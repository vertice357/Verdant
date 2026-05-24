import { DEPTHS } from '../config/Constants.js'

export class DebugOverlay {
  constructor(scene) {
    this.scene = scene
    this.visible = false
    this._texts = []
    this._gfx = scene.add.graphics().setDepth(DEPTHS.DEBUG)

    scene.input.keyboard.on('keydown-F', () => {
      try {
        this.visible = !this.visible
        if (!this.visible) {
          this._gfx.clear()
          this._texts.forEach(t => t.destroy())
          this._texts = []
        }
      } catch (e) {
        console.error('DebugOverlay toggle error', e)
      }
    })
  }

  update() {
    if (!this.visible) return

    try {
      this._gfx.clear()
      this._texts.forEach(t => t.destroy())
      this._texts = []

      const scene = this.scene

      // Player
      if (scene.player) {
        const p = scene.player
        this._label(p.x, p.y - 34, `Sage: ${p.state}`, '#c084fc')
        this._label(p.x, p.y - 22, `HP:${p.hp}  MP:${p.mana}  iframes:${p.iframes}`, '#ffffff')
        // Player body rect
        this._gfx.lineStyle(1, 0xc084fc, 0.8)
        this._gfx.strokeRect(p.x - 10, p.y - 10, 20, 20)
        // Attack hitbox
        if (p.attackHitbox && p.attackHitbox.body && p.attackHitbox.body.enable) {
          this._gfx.lineStyle(2, 0xfbbf24, 1)
          this._gfx.strokeRect(p.attackHitbox.x - 18, p.attackHitbox.y - 18, 36, 36)
        }
      }

      // Dew
      if (scene.companion) {
        const d = scene.companion
        this._label(d.x, d.y - 26, `Dew: ${d.getAIState()}`, '#f59e0b')
        this._gfx.lineStyle(1, 0xf59e0b, 0.8)
        this._gfx.strokeRect(d.x - 14, d.y - 8, 28, 16)
      }

      // Enemies
      if (scene.enemies) {
        scene.enemies.getChildren().forEach(e => {
          if (!e.active || e._dead) return
          this._label(e.x, e.y - 22, `HP:${e.hp ?? '?'}  ${e.state ?? ''}`, '#4ade80')
          this._gfx.lineStyle(1, 0x4ade80, 0.8)
          this._gfx.strokeRect(e.x - 10, e.y - 10, 20, 20)
          if (e.detectRange) {
            this._gfx.lineStyle(1, 0x4ade80, 0.2)
            this._gfx.strokeCircle(e.x, e.y, e.detectRange)
          }
        })
      }

      // Projectiles
      if (scene.projectiles) {
        scene.projectiles.getChildren().forEach(p => {
          if (!p.active) return
          this._gfx.lineStyle(1, 0x38bdf8, 0.8)
          this._gfx.strokeCircle(p.x, p.y, 12)
        })
      }
    } catch (e) {
      console.error('DebugOverlay update error', e)
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
