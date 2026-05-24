import { DEPTHS } from '../config/Constants.js'

export class DebugOverlay {
  constructor(scene) {
    this.scene = scene
    this.visible = false
    this._texts = []
    this._gfx = scene.add.graphics().setDepth(DEPTHS.DEBUG)

    scene.input.keyboard.on('keydown-F', () => {
      this.visible = !this.visible
      scene.physics.world.drawDebug = this.visible
      if (!this.visible) {
        this._gfx.clear()
        this._texts.forEach(t => t.destroy())
        this._texts = []
        scene.physics.world.debugGraphic && scene.physics.world.debugGraphic.clear()
      }
    })
  }

  update() {
    if (!this.visible) return
    this._gfx.clear()
    this._texts.forEach(t => t.destroy())
    this._texts = []

    const scene = this.scene

    // Player state
    if (scene.player) {
      this._label(scene.player.x, scene.player.y - 32, `Sage: ${scene.player.state}`, '#c084fc')
      this._label(scene.player.x, scene.player.y - 20, `HP:${scene.player.hp} MP:${scene.player.mana} iframes:${scene.player.iframes}`, '#ffffff')
    }

    // Dew AI state
    if (scene.companion) {
      this._label(scene.companion.x, scene.companion.y - 28, `Dew: ${scene.companion.getAIState()}`, '#f59e0b')
    }

    // Enemy states
    if (scene.enemies) {
      scene.enemies.getChildren().forEach(e => {
        if (e.active) {
          this._label(e.x, e.y - 20, `HP:${e.hp} ${e.state || ''}`, '#4ade80')
          // Detect range circle
          this._gfx.lineStyle(1, 0x4ade80, 0.3)
          this._gfx.strokeCircle(e.x, e.y, e.detectRange)
        }
      })
    }
  }

  _label(x, y, text, color = '#ffffff') {
    const t = this.scene.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color,
    }).setOrigin(0.5).setDepth(DEPTHS.DEBUG)
    this._texts.push(t)
  }
}
