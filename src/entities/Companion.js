import Phaser from 'phaser'
import { CompanionAI } from '../systems/CompanionAI.js'
import { DEW, DEPTHS } from '../config/Constants.js'

const STATES = { FOLLOW: 'FOLLOW', GUARD: 'GUARD', ATTACK: 'ATTACK' }

export class Companion extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player) {
    super(scene, x, y, 'dew')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.player       = player
    this.attackDamage = DEW.ATTACK_DAMAGE ?? 2
    this.facing       = 'down'
    this.aiState      = STATES.FOLLOW

    this.setDepth(DEPTHS.COMPANION)
    this.body.setSize(22, 18)
    this.body.setOffset(21, 40)

    this._ai = new CompanionAI(this, player, scene)

    this.attackHitbox = scene.physics.add.image(x, y, null)
    this.attackHitbox.body.setSize(40, 30)
    this.attackHitbox.body.enable = false
    this.attackHitbox.setVisible(false)
  }

  // Phaser calls this on animation frame change — keep manual body size
  setSizeToFrame() { return this }

  update(time, delta) {
    this._ai.update(time, delta)
    this.attackHitbox.setPosition(this.x, this.y)
    this._updateFacing()
    this._playAnim()
  }

  _updateFacing() {
    const vx = this.body.velocity.x
    const vy = this.body.velocity.y
    if (Math.abs(vx) > Math.abs(vy)) {
      this.facing = vx > 0 ? 'right' : 'left'
    } else if (Math.abs(vy) > 4) {
      this.facing = vy > 0 ? 'down' : 'up'
    }
  }

  _playAnim() {
    if (!this.active) return
    const moving    = Math.abs(this.body.velocity.x) > 4 || Math.abs(this.body.velocity.y) > 4
    const attacking = this._ai.currentState === STATES.ATTACK

    // Left-facing frames have the head cut in the source art — use right
    // frames and flip horizontally instead (standard sprite mirror trick)
    const dir   = this.facing === 'left' ? 'right' : this.facing
    const flip  = this.facing === 'left'
    this.setFlipX(flip)

    const key = attacking ? `dew_attack_${dir}`
              : moving    ? `dew_walk_${dir}`
              :              `dew_idle_${dir}`

    if (this.anims.currentAnim?.key !== key) this.play(key)
  }

  getAIState() { return this._ai.currentState }

  destroy() {
    super.destroy()
  }
}
