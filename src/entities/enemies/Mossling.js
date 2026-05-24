import { Enemy } from '../Enemy.js'
import { ENEMY } from '../../config/Constants.js'

const STATE = { PATROL: 'patrol', CHASE: 'chase' }

export class Mossling extends Enemy {
  constructor(scene, x, y, player) {
    super(scene, x, y, {
      hp: ENEMY.MOSSLING_HP,
      damage: ENEMY.MOSSLING_DAMAGE,
      speed: ENEMY.MOSSLING_SPEED,
      detectRange: ENEMY.MOSSLING_DETECT_RANGE,
      bodySize: 20,
    })
    this.player = player
    this.state = STATE.PATROL
    this._patrolDir = 1
    this._patrolTimer = 0
    this._stateHoldTimer = 0
    this.drawSprite()
  }

  update(time, delta) {
    if (this._dead || !this.active) return

    // Don't override movement during knockback
    if (!this._knockedBack) {
      this._stateHoldTimer -= delta

      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y)

      if (this._stateHoldTimer <= 0) {
        if (dist < this.detectRange && this.state !== STATE.CHASE) {
          this.state = STATE.CHASE
          this._stateHoldTimer = 200
        } else if (dist >= this.detectRange && this.state !== STATE.PATROL) {
          this.state = STATE.PATROL
          this._stateHoldTimer = 200
        }
      }

      if (this.state === STATE.PATROL) {
        this._patrolTimer += delta
        if (this._patrolTimer > 2000) {
          this._patrolDir *= -1
          this._patrolTimer = 0
        }
        this.setVelocity(this._patrolDir * ENEMY.MOSSLING_PATROL_SPEED, 0)
      } else {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y)
        this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed)
      }
    }

    this.syncGfx()
    if (!this._isFlashing) this.drawSprite()
  }

  drawSprite(flashColor = null) {
    if (!this._gfx) return
    this._gfx.clear()
    const bodyColor = flashColor ?? (this.state === STATE.CHASE ? 0x86efac : 0x4ade80)
    this._gfx.fillStyle(bodyColor, 1)
    this._gfx.fillRect(-10, -10, 20, 20)
    if (!flashColor) {
      this._gfx.fillStyle(0xff0000, 1)
      this._gfx.fillRect(-5, -5, 3, 3)
      this._gfx.fillRect(3, -5, 3, 3)
      this._gfx.fillStyle(0x166534, 1)
      this._gfx.fillRect(-10, -10, 6, 4)
      this._gfx.fillRect(4, 6, 6, 4)
    }
  }
}
