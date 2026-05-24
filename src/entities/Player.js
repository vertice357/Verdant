import Phaser from 'phaser'
import { InputSystem } from '../systems/InputSystem.js'
import { SpellSystem } from '../systems/SpellSystem.js'
import { EventBus, EVENTS } from '../systems/EventBus.js'
import { PLAYER, DEPTHS } from '../config/Constants.js'

const STATES = { IDLE: 'idle', WALK: 'walk', ATTACK: 'attack', HURT: 'hurt', DEAD: 'dead' }

// Animation key builder — maps state + facing to the 16-frame spritesheet
// Spritesheet layout (128×128 frames, 4 cols × 4 rows):
//   row 0: idle_down  idle_up  idle_left  idle_right
//   row 1: walk_down_a walk_up_a walk_left_a walk_right_a
//   row 2: walk_down_b walk_up_b walk_left_b walk_right_b
//   row 3: attack_down attack_up attack_left attack_right
//
// hurt/dead reuse the idle frame for the current facing direction
// (no dedicated hurt/dead row in the sheet; visual feedback via tween)
const animKey = (state, facing) => {
  switch (state) {
    case STATES.WALK:   return `player_walk_${facing}`
    case STATES.ATTACK: return `player_attack_${facing}`
    default:            return `player_idle_${facing}`   // idle, hurt, dead
  }
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setDepth(DEPTHS.PLAYER)
    // 270×270 source frame → ~108×108 displayed
    this.setScale(0.4)

    // Physics body: centred on Sage's feet in the displayed frame
    this.body.setSize(28, 28)
    this.body.setOffset(40, 68)

    this._swingGfx = scene.add.graphics().setDepth(DEPTHS.PLAYER - 1)

    this.hp           = PLAYER.HP_MAX
    this.mana         = PLAYER.MANA_MAX
    this.attackDamage = PLAYER.ATTACK_DAMAGE
    this.facing       = 'down'
    this.state        = STATES.IDLE
    this.iframes      = false

    this.input       = new InputSystem(scene)
    this.spellSystem = new SpellSystem(scene, this)

    this.attackHitbox = scene.physics.add.image(x, y, null)
    this.attackHitbox.body.setSize(PLAYER.ATTACK_HITBOX_SIZE, PLAYER.ATTACK_HITBOX_SIZE)
    this.attackHitbox.body.enable = false
    this.attackHitbox.setVisible(false)
    this.attackHitbox.setDepth(DEPTHS.PLAYER)

    scene.time.addEvent({
      delay: PLAYER.MANA_REGEN_RATE,
      loop: true,
      callback: () => {
        if (this.mana < PLAYER.MANA_MAX) {
          this.mana++
          EventBus.emit(EVENTS.PLAYER_MANA_CHANGED, { mana: this.mana })
        }
      },
    })

    this._attackTimer = null
    this._hurtTimer   = null
  }

  // ─── main loop ───────────────────────────────────────────────────────────

  update(time, delta) {
    if (this.state === STATES.DEAD) return

    this.input.update()

    if (this.state !== STATES.ATTACK && this.state !== STATES.HURT) {
      this._handleMovement()
    } else {
      this.setVelocity(0, 0)
    }

    if (this.input.attackJustPressed() && this.state !== STATES.ATTACK) {
      this._doAttack()
    }

    if (this.input.spellJustPressed()) {
      this.spellSystem.cast('aquaBolt', this.facing)
    }

    this._swingGfx.setPosition(this.x, this.y)
    this.attackHitbox.setPosition(...this._hitboxPos())
  }

  // ─── movement ────────────────────────────────────────────────────────────

  _handleMovement() {
    const { dx, dy } = this.input.getMovement()
    this.setVelocity(dx * PLAYER.SPEED, dy * PLAYER.SPEED)

    if (dx !== 0 || dy !== 0) {
      this.state = STATES.WALK
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx > 0 ? 'right' : 'left'
      } else {
        this.facing = dy > 0 ? 'down' : 'up'
      }
    } else {
      this.state = STATES.IDLE
    }

    this._playAnim()
  }

  // ─── animation ───────────────────────────────────────────────────────────

  _playAnim() {
    const key = animKey(this.state, this.facing)
    if (this.anims.currentAnim?.key !== key) {
      this.play(key)
    }
  }

  // ─── attack ──────────────────────────────────────────────────────────────

  _doAttack() {
    this.state = STATES.ATTACK
    this.setVelocity(0, 0)
    this.iframes = true
    this.attackHitbox.body.enable = true
    this._drawSwingArc()
    this._playAnim()

    if (this._attackTimer) this._attackTimer.remove()
    this._attackTimer = this.scene.time.delayedCall(PLAYER.ATTACK_DURATION, () => {
      this.attackHitbox.body.enable = false
      this._swingGfx.clear()
      this.state = STATES.IDLE
      this._playAnim()
      this.scene.time.delayedCall(80, () => { this.iframes = false })
    })
  }

  // ─── damage / hurt / dead ────────────────────────────────────────────────

  takeDamage(amount) {
    if (this.iframes || this.state === STATES.DEAD) return

    this.hp = Math.max(0, this.hp - amount)
    EventBus.emit(EVENTS.PLAYER_DAMAGED, { hp: this.hp })

    if (this.hp <= 0) {
      this._doDie()
      return
    }

    this._doHurt()
  }

  _doHurt() {
    this.state   = STATES.HURT
    this.iframes = true
    this._playAnim()   // shows idle_{facing} frozen — no dedicated hurt row

    // Flash tween for visual feedback
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      yoyo: true,
      repeat: 4,
      duration: 80,
      onComplete: () => this.setAlpha(1),
    })

    if (this._hurtTimer) this._hurtTimer.remove()
    this._hurtTimer = this.scene.time.delayedCall(PLAYER.IFRAME_DURATION, () => {
      if (this.state === STATES.HURT) {
        this.state = STATES.IDLE
        this._playAnim()
      }
      this.iframes = false
    })
  }

  _doDie() {
    this.state = STATES.DEAD
    this.setVelocity(0, 0)
    this.attackHitbox.body.enable = false
    this._swingGfx.clear()

    // Fade out on the idle_{facing} frame (no dead row in sheet)
    this._playAnim()
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
    })

    EventBus.emit(EVENTS.PLAYER_DIED)
  }

  // Phaser calls this whenever an animation frame changes to auto-resize the
  // physics body. We set body size manually so we suppress it entirely.
  setSizeToFrame() { return this }

  // ─── helpers ─────────────────────────────────────────────────────────────

  _hitboxPos() {
    const o = PLAYER.ATTACK_OFFSET
    return {
      up:    [this.x,     this.y - o],
      down:  [this.x,     this.y + o],
      left:  [this.x - o, this.y    ],
      right: [this.x + o, this.y    ],
    }[this.facing]
  }

  _drawSwingArc() {
    this._swingGfx.clear()
    this._swingGfx.lineStyle(3, 0xdda0f0, 0.85)
    this._swingGfx.fillStyle(0xc084fc, 0.18)

    const r = PLAYER.ATTACK_OFFSET + 10
    const angles = {
      right: { start: -60, end: 60 },
      left:  { start: 120, end: 240 },
      down:  { start: 30,  end: 150 },
      up:    { start: 210, end: 330 },
    }
    const { start, end } = angles[this.facing]
    this._swingGfx.beginPath()
    this._swingGfx.moveTo(0, 0)
    this._swingGfx.arc(0, 0, r, Phaser.Math.DegToRad(start), Phaser.Math.DegToRad(end))
    this._swingGfx.closePath()
    this._swingGfx.fillPath()
    this._swingGfx.strokePath()
  }

  destroy() {
    this._swingGfx.destroy()
    super.destroy()
  }
}
