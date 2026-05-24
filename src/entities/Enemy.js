import Phaser from 'phaser'
import { EventBus, EVENTS } from '../systems/EventBus.js'
import { DEPTHS, ENEMY } from '../config/Constants.js'

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
    this._isFlashing = false
    this._knockedBack = false

    this.drawSprite()
  }

  takeDamage(amount, sourceX, sourceY) {
    if (this._dead || this._hitCooldown) return
    console.log(`[ENEMY] takeDamage(${amount}), hp: ${this.hp} -> ${this.hp - amount}`)

    this.hp -= amount
    this._hitCooldown = true
    this._isFlashing = true
    this.drawSprite(0xffffff)
    this._spawnHitEffect()

    // Knockback — push enemy away from hit source
    if (sourceX !== undefined && sourceY !== undefined) {
      this._applyKnockback(sourceX, sourceY)
    }

    this.scene.time.delayedCall(120, () => {
      if (this._dead) return
      this.drawSprite(0xff4444)
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

  _applyKnockback(sourceX, sourceY) {
    if (!this.body) return
    this._knockedBack = true
    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.x, this.y)
    this.setVelocity(
      Math.cos(angle) * ENEMY.KNOCKBACK_FORCE,
      Math.sin(angle) * ENEMY.KNOCKBACK_FORCE
    )
    this.scene.time.delayedCall(ENEMY.KNOCKBACK_DURATION, () => {
      this._knockedBack = false
    })
  }

  _spawnHitEffect() {
    const sparks = this.scene.add.graphics()
    sparks.setDepth(DEPTHS.ENEMIES + 1)
    sparks.fillStyle(0xfbbf24, 1)
    const offsets = [[-8,-8],[8,-8],[-8,8],[8,8],[0,-12],[0,12]]
    offsets.forEach(([ox, oy]) => sparks.fillRect(this.x + ox - 2, this.y + oy - 2, 4, 4))
    this.scene.time.delayedCall(180, () => sparks.destroy())
  }

  _die() {
    if (this._dead) return
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

  drawSprite(flashColor = null) {}

  syncGfx() {
    if (this._gfx && this.active) this._gfx.setPosition(this.x, this.y)
  }

  destroy() {
    if (this._gfx) { this._gfx.destroy(); this._gfx = null }
    super.destroy()
  }
}
