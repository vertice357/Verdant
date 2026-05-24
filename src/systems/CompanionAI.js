import Phaser from 'phaser'
import { DEW } from '../config/Constants.js'

const STATE = { FOLLOW: 'FOLLOW', GUARD: 'GUARD', ATTACK: 'ATTACK' }
const STATE_HOLD_MS = 200 // prevent oscillation

export class CompanionAI {
  constructor(companion, player, scene) {
    this.companion = companion
    this.player = player
    this.scene = scene
    this.currentState = STATE.FOLLOW
    this._stateTimer = 0
    this._attackCooldown = 0
    this._attackActive = false
  }

  update(time, delta) {
    this._stateTimer -= delta
    this._attackCooldown -= delta

    const enemies = this._getEnemies()
    const nearest = this._nearest(enemies)
    const distToPlayer = Phaser.Math.Distance.Between(
      this.companion.x, this.companion.y,
      this.player.x, this.player.y
    )

    // --- Priority state machine ---
    if (this._stateTimer <= 0) {
      if (nearest && this._distTo(nearest) <= DEW.ATTACK_RANGE) {
        this._setState(STATE.ATTACK)
      } else if (nearest && this._distTo(nearest) <= DEW.DETECT_RANGE) {
        this._setState(STATE.GUARD)
      } else {
        this._setState(STATE.FOLLOW)
      }
    }

    // --- Behaviors ---
    if (this.currentState === STATE.FOLLOW) {
      this._follow()
    } else if (this.currentState === STATE.GUARD) {
      this._guard(nearest)
    } else if (this.currentState === STATE.ATTACK) {
      this._attack(nearest)
    }
  }

  _follow() {
    const dx = this.player.x - this.companion.x
    const dy = this.player.y - this.companion.y
    const dist = Math.hypot(dx, dy)

    if (dist > DEW.FOLLOW_DISTANCE) {
      this.scene.physics.moveToObject(this.companion, this.player, DEW.SPEED)
    } else {
      this.companion.setVelocity(0, 0)
    }
    this.companion.attackHitbox.body.enable = false
  }

  _guard(target) {
    if (!target) { this._follow(); return }
    // Position between player and enemy
    const mx = (this.player.x + target.x) / 2
    const my = (this.player.y + target.y) / 2
    const dx = mx - this.companion.x
    const dy = my - this.companion.y
    const dist = Math.hypot(dx, dy)

    if (dist > 20) {
      this.companion.setVelocity((dx / dist) * DEW.SPEED, (dy / dist) * DEW.SPEED)
    } else {
      this.companion.setVelocity(0, 0)
    }
    this.companion.attackHitbox.body.enable = false
  }

  _attack(target) {
    if (!target || !target.active) {
      this._setState(STATE.FOLLOW)
      return
    }

    // Move toward enemy
    this.scene.physics.moveToObject(this.companion, target, DEW.SPEED)

    // Bite when close enough + cooldown clear
    if (this._distTo(target) < DEW.ATTACK_RANGE && this._attackCooldown <= 0) {
      this.companion.attackHitbox.body.enable = true
      this._attackCooldown = DEW.ATTACK_COOLDOWN
      this.scene.time.delayedCall(150, () => {
        if (this.companion.active) this.companion.attackHitbox.body.enable = false
      })
    }
  }

  _setState(state) {
    if (state !== this.currentState) {
      this.currentState = state
      this._stateTimer = STATE_HOLD_MS
    }
  }

  _getEnemies() {
    return this.scene.enemies ? this.scene.enemies.getChildren().filter(e => e.active) : []
  }

  _nearest(enemies) {
    if (!enemies.length) return null
    return enemies.reduce((closest, e) => {
      return this._distTo(e) < this._distTo(closest) ? e : closest
    })
  }

  _distTo(target) {
    return Phaser.Math.Distance.Between(this.companion.x, this.companion.y, target.x, target.y)
  }
}
