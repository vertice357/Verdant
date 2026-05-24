import Phaser from 'phaser'
import { InputSystem } from '../systems/InputSystem.js'
import { SpellSystem } from '../systems/SpellSystem.js'
import { EventBus, EVENTS } from '../systems/EventBus.js'
import { PLAYER, DEPTHS } from '../config/Constants.js'

const STATES = { IDLE: 'idle', WALK: 'walk', ATTACK: 'attack', HURT: 'hurt', DEAD: 'dead' }

// Displayed size after scaling the 128×160 sprite sheet frame
const DISPLAY_W = 64
const DISPLAY_H = 80

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player', 1)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setDepth(DEPTHS.PLAYER)
    this.setDisplaySize(DISPLAY_W, DISPLAY_H)

    // Physics body centered within the displayed frame
    this.body.setSize(20, 20)
    this.body.setOffset((DISPLAY_W - 20) / 2, (DISPLAY_H - 20) / 2)

    this._swingGfx = scene.add.graphics().setDepth(DEPTHS.PLAYER - 1)

    this.hp = PLAYER.HP_MAX
    this.mana = PLAYER.MANA_MAX
    this.attackDamage = PLAYER.ATTACK_DAMAGE
    this.facing = 'down'
    this.state = STATES.IDLE
    this.iframes = false

    this.input = new InputSystem(scene)
    this.spellSystem = new SpellSystem(scene, this)

    // Attack hitbox — larger and further out
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
    this.play('player_idle_down')
  }

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

  _playAnim() {
    if (this.state === STATES.ATTACK) return

    if (this.state === STATES.WALK) {
      this.setFlipX(this.facing === 'left')
      this.play('player_walk', true)
    } else {
      this.setFlipX(this.facing === 'left')
      if (this.facing === 'up') {
        this.play('player_idle_up', true)
      } else if (this.facing === 'down') {
        this.play('player_idle_down', true)
      } else {
        this.play('player_idle_side', true)
      }
    }
  }

  _doAttack() {
    this.state = STATES.ATTACK
    this.setVelocity(0, 0)

    this.iframes = true
    this.attackHitbox.body.enable = true
    this._drawSwingArc()
    this.play('player_attack', true)

    if (this._attackTimer) this._attackTimer.remove()
    this._attackTimer = this.scene.time.delayedCall(PLAYER.ATTACK_DURATION, () => {
      this.attackHitbox.body.enable = false
      this._swingGfx.clear()
      this.state = STATES.IDLE
      this._playAnim()
      this.scene.time.delayedCall(80, () => { this.iframes = false })
    })
  }

  takeDamage(amount) {
    if (this.iframes || this.state === STATES.DEAD) return

    this.hp = Math.max(0, this.hp - amount)
    EventBus.emit(EVENTS.PLAYER_DAMAGED, { hp: this.hp })

    if (this.hp <= 0) {
      this.state = STATES.DEAD
      EventBus.emit(EVENTS.PLAYER_DIED)
      return
    }

    this.iframes = true
    this.scene.time.delayedCall(PLAYER.IFRAME_DURATION, () => { this.iframes = false })

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      yoyo: true,
      repeat: 5,
      duration: 100,
      onComplete: () => this.setAlpha(1),
    })
  }

  _hitboxPos() {
    const o = PLAYER.ATTACK_OFFSET
    const map = {
      up:    [this.x,     this.y - o],
      down:  [this.x,     this.y + o],
      left:  [this.x - o, this.y    ],
      right: [this.x + o, this.y    ],
    }
    return map[this.facing]
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
    const s = Phaser.Math.DegToRad(start)
    const e = Phaser.Math.DegToRad(end)

    this._swingGfx.beginPath()
    this._swingGfx.moveTo(0, 0)
    this._swingGfx.arc(0, 0, r, s, e)
    this._swingGfx.closePath()
    this._swingGfx.fillPath()
    this._swingGfx.strokePath()
  }

  destroy() {
    this._swingGfx.destroy()
    super.destroy()
  }
}
