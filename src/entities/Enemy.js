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
    this._isFlashing = false  // prevents update() from overwriting hit flash

    this.drawSprite()
  }

  takeDamage(amount) {
    if (this._dead || this._hitCooldown) return
    console.log(`[ENEMY] takeDamage(${amount}), hp: ${this.hp} -> ${this.hp - amount}`)

    this.hp -= amount
    this._hitCooldown = true
    this._isFlashing = true
    this.drawSprite(0xffffff)  // white flash on hit

    // Show hit sparks
    this._spawnHitEffect()

    this.scene.time.delayedCall(120, () => {
      if (this._dead) return
      this.drawSprite(0xff4444)  // red tint after white flash
    })

    this.scene.time.delayedCall(300, () => {
      this._isFlashing = false
      this._hitCooldown = false
      if (!this._dead && this.active) this.drawSprite()
    })

    if (this.hp <= 0) {
      console.log('[ENEMY] hp <= 0, calling _die()')
      this._die()
    }
  }

  _spawnHitEffect() {
    // Quick star-burst sparks at hit position
    const sparks = this.scene.add.graphics()
    sparks.setDepth(DEPTHS.ENEMIES + 1)
    sparks.fillStyle(0xfbbf24, 1)
    const offsets = [[-8, -8], [8, -8], [-8, 8], [8, 8], [0, -12], [0, 12]]
    offsets.forEach(([ox, oy]) => sparks.fillRect(this.x + ox - 2, this.y + oy - 2, 4, 4))
    this.scene.time.delayedCall(180, () => sparks.destroy())
  }

  _die() {
    if (this._dead) return
    console.log('[ENEMY] _die() called')
    this._dead = true

    this.setActive(false)
    this.setVisible(false)
    if (this.body) this.body.enable = false
    if (this._gfx) this._gfx.setVisible(false)

    EventBus.emit(EVENTS.ENEMY_DIED, { x: this.x, y: this.y })
    EventBus.emit(EVENTS.DEW_BOND_XP, { amount: 10 })

    this.scene.time.delayedCall(0, () => {
      try {
        if (this._gfx) { this._gfx.destroy(); this._gfx = null }
        if (this.scene) this.destroy()
      } catch (e) { console.error('[ENEMY] destroy error', e) }
    })
  }

  drawSprite(flashColor = null) {
    // Overridden by subclasses — flashColor passed through
  }

  syncGfx() {
    if (this._gfx && this.active) this._gfx.setPosition(this.x, this.y)
  }

  destroy() {
    if (this._gfx) { this._gfx.destroy(); this._gfx = null }
    super.destroy()
  }
}
