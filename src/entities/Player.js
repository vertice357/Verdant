import Phaser from 'phaser'
import { InputSystem } from '../systems/InputSystem.js'
import { SpellSystem } from '../systems/SpellSystem.js'
import { EventBus, EVENTS } from '../systems/EventBus.js'
import { PLAYER, DEPTHS } from '../config/Constants.js'

const STATES = { IDLE: 'idle', WALK: 'walk', ATTACK: 'attack', HURT: 'hurt', DEAD: 'dead' }

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, null)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setDepth(DEPTHS.PLAYER)
    this.body.setSize(20, 20)

    // Draw placeholder sprite
    this._gfx = scene.add.graphics()
    this._drawSprite()

    this.hp = PLAYER.HP_MAX
    this.mana = PLAYER.MANA_MAX
    this.attackDamage = PLAYER.ATTACK_DAMAGE
    this.facing = 'down'
    this.state = STATES.IDLE
    this.iframes = false
    this.attackQueued = false

    this.input = new InputSystem(scene)
    this.spellSystem = new SpellSystem(scene, this)

    // Attack hitbox (inactive by default)
    this.attackHitbox = scene.physics.add.image(x, y, null)
    this.attackHitbox.body.setSize(36, 36)
    this.attackHitbox.body.enable = false
    this.attackHitbox.setVisible(false)
    this.attackHitbox.setDepth(DEPTHS.PLAYER)

    // Mana regen
    this._manaTimer = scene.time.addEvent({
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

    // Sync graphics to physics body
    this._gfx.setPosition(this.x, this.y)
    this.attackHitbox.setPosition(...this._hitboxPos())
  }

  _handleMovement() {
    const { dx, dy } = this.input.getMovement()
    const speed = PLAYER.SPEED

    this.setVelocity(dx * speed, dy * speed)

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

    this._drawSprite()
  }

  _doAttack() {
    this.state = STATES.ATTACK
    this.setVelocity(0, 0)
    this.attackHitbox.body.enable = true

    if (this._attackTimer) this._attackTimer.remove()
    this._attackTimer = this.scene.time.delayedCall(200, () => {
      this.attackHitbox.body.enable = false
      this.state = STATES.IDLE
    })

    this._drawSprite()
  }

  takeDamage(amount) {
    if (this.iframes || this.state === STATES.DEAD) return

    this.hp = Math.max(0, this.hp - amount)
    EventBus.emit(EVENTS.PLAYER_DAMAGED, { hp: this.hp })

    if (this.hp <= 0) {
      this.state = STATES.DEAD
      EventBus.emit(EVENTS.PLAYER_DIED)
      console.log('Game Over')
      return
    }

    this.iframes = true
    this.scene.time.delayedCall(PLAYER.IFRAME_DURATION, () => {
      this.iframes = false
    })

    // Flash effect
    this.scene.tweens.add({
      targets: this._gfx,
      alpha: 0,
      yoyo: true,
      repeat: 5,
      duration: 120,
      onComplete: () => this._gfx.setAlpha(1),
    })
  }

  _hitboxPos() {
    const offset = 28
    const map = { up: [this.x, this.y - offset], down: [this.x, this.y + offset], left: [this.x - offset, this.y], right: [this.x + offset, this.y] }
    return map[this.facing]
  }

  _drawSprite() {
    this._gfx.clear()
    // Body
    const color = this.state === STATES.ATTACK ? 0xdda0f0 : this.state === STATES.HURT ? 0xff4444 : 0xc084fc
    this._gfx.fillStyle(color, 1)
    this._gfx.fillRect(-10, -14, 20, 24)
    // Cloak (lavender)
    this._gfx.fillStyle(0x9333ea, 1)
    this._gfx.fillRect(-12, -4, 24, 14)
    // Head
    this._gfx.fillStyle(0xfbbf80, 1)
    this._gfx.fillRect(-6, -20, 12, 10)
    // Direction indicator
    this._gfx.fillStyle(0xffffff, 1)
    const d = this.facing
    if (d === 'down')  this._gfx.fillRect(-2, 8, 4, 4)
    if (d === 'up')    this._gfx.fillRect(-2, -18, 4, 4)
    if (d === 'right') this._gfx.fillRect(8, -2, 4, 4)
    if (d === 'left')  this._gfx.fillRect(-12, -2, 4, 4)
    // Staff
    this._gfx.fillStyle(0x92400e, 1)
    this._gfx.fillRect(10, -22, 3, 28)
    this._gfx.fillStyle(0xc084fc, 1)
    this._gfx.fillCircle(11, -24, 4)
  }

  destroy() {
    this._gfx.destroy()
    super.destroy()
  }
}
