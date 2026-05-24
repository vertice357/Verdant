import Phaser from 'phaser'
import { DEPTHS } from '../config/Constants.js'
import { EventBus, EVENTS } from '../systems/EventBus.js'

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config) {
    super(scene, x, y, null)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.hp = config.hp
    this.damage = config.damage
    this.speed = config.speed
    this.detectRange = config.detectRange
    this.setDepth(DEPTHS.ENEMIES)
    this.body.setSize(config.bodySize || 22, config.bodySize || 22)

    this._gfx = scene.add.graphics()
    this._hitTimer = null
    this._dead = false

    this.drawSprite()
  }

  takeDamage(amount) {
    if (this._dead) return
    if (this._hitTimer) return // brief invincibility between hits

    this.hp -= amount
    this.drawSprite(0xff4444)

    this._hitTimer = this.scene.time.delayedCall(200, () => {
      this._hitTimer = null
      if (this.active) this.drawSprite()
    })

    if (this.hp <= 0) this._die()
  }

  _die() {
    this._dead = true
    EventBus.emit(EVENTS.ENEMY_DIED, { x: this.x, y: this.y })
    EventBus.emit(EVENTS.DEW_BOND_XP, { amount: 10 })
    this._gfx.destroy()
    this.destroy()
  }

  drawSprite(flashColor = null) {
    // Overridden by subclasses
  }

  syncGfx() {
    if (this._gfx && this.active) {
      this._gfx.setPosition(this.x, this.y)
    }
  }

  destroy() {
    if (this._gfx) this._gfx.destroy()
    super.destroy()
  }
}
