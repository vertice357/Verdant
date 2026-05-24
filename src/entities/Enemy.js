import Phaser from 'phaser'
import { EventBus, EVENTS } from '../systems/EventBus.js'
import { DEPTHS } from '../config/Constants.js'

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
    this._dead = false
    this._hitCooldown = false

    this.drawSprite()
  }

  takeDamage(amount) {
    if (this._dead || this._hitCooldown) return

    this.hp -= amount
    this.drawSprite(0xff4444)

    this._hitCooldown = true
    this.scene.time.delayedCall(200, () => {
      this._hitCooldown = false
      if (this.active && !this._dead) this.drawSprite()
    })

    if (this.hp <= 0) this._die()
  }

  _die() {
    if (this._dead) return
    this._dead = true

    // Disable physics immediately so no more overlaps trigger
    this.setActive(false)
    this.body.enable = false
    this.setVisible(false)
    if (this._gfx) this._gfx.setVisible(false)

    EventBus.emit(EVENTS.ENEMY_DIED, { x: this.x, y: this.y })
    EventBus.emit(EVENTS.DEW_BOND_XP, { amount: 10 })

    // Defer actual destroy to next frame — safe outside physics step
    this.scene.time.delayedCall(0, () => {
      if (this._gfx) { this._gfx.destroy(); this._gfx = null }
      if (this.scene) this.destroy()
    })
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
    if (this._gfx) { this._gfx.destroy(); this._gfx = null }
    super.destroy()
  }
}
