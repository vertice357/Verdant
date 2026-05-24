import Phaser from 'phaser'
import { CompanionAI } from '../systems/CompanionAI.js'
import { DEW, DEPTHS } from '../config/Constants.js'

export class Companion extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player) {
    super(scene, x, y, null)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.player = player
    this.attackDamage = 2
    this.setDepth(DEPTHS.COMPANION)
    this.body.setSize(22, 18)

    this._gfx = scene.add.graphics()
    this._ai = new CompanionAI(this, player, scene)

    // Attack hitbox
    this.attackHitbox = scene.physics.add.image(x, y, null)
    this.attackHitbox.body.setSize(40, 30)
    this.attackHitbox.body.enable = false
    this.attackHitbox.setVisible(false)

    this.drawSprite()
  }

  update(time, delta) {
    this._ai.update(time, delta)
    this._gfx.setPosition(this.x, this.y)
    this.attackHitbox.setPosition(this.x, this.y)
    this.drawSprite()
  }

  drawSprite(state = 'idle') {
    if (!this._gfx) return
    this._gfx.clear()

    // Body — Aussie shepherd colors: brown/copper/white
    this._gfx.fillStyle(0x92400e, 1) // brown body
    this._gfx.fillRect(-14, -8, 28, 16)
    // White chest blaze
    this._gfx.fillStyle(0xffffff, 1)
    this._gfx.fillRect(-5, -4, 10, 12)
    // Copper points (muzzle)
    this._gfx.fillStyle(0xb45309, 1)
    this._gfx.fillRect(-6, -12, 12, 8) // head
    this._gfx.fillRect(12, -4, 6, 4)   // muzzle
    // Merle patch
    this._gfx.fillStyle(0x78350f, 1)
    this._gfx.fillRect(-14, -8, 8, 8)
    // Amber eyes
    this._gfx.fillStyle(0xf59e0b, 1)
    this._gfx.fillRect(8, -10, 3, 3)
    // Tail
    this._gfx.fillStyle(0x92400e, 1)
    this._gfx.fillRect(-18, -4, 6, 4)
  }

  getAIState() {
    return this._ai.currentState
  }

  destroy() {
    if (this._gfx) this._gfx.destroy()
    super.destroy()
  }
}
