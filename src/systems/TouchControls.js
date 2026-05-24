import { DEPTHS } from '../config/Constants.js'

const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches

export class TouchControls {
  constructor(scene) {
    this._dx = 0
    this._dy = 0
    this._attackPressed = false
    this._spellPressed  = false
    this._active        = false

    if (!isTouchDevice()) return

    this._active = true
    this._build(scene)
  }

  _build(scene) {
    const W = scene.scale.width
    const H = scene.scale.height

    // ── Joystick ──────────────────────────────────────────────────────────
    const JOY_X  = 110
    const JOY_Y  = H - 110
    const RADIUS = 60
    const DEAD   = 12   // dead-zone pixels

    const base = scene.add.circle(JOY_X, JOY_Y, RADIUS, 0x6d28d9, 0.3)
      .setDepth(DEPTHS.HUD).setScrollFactor(0)
    const thumb = scene.add.circle(JOY_X, JOY_Y, 28, 0xa78bfa, 0.75)
      .setDepth(DEPTHS.HUD).setScrollFactor(0)

    // Touch tracking for joystick
    let joyPointerId = null
    let joyOriginX = JOY_X
    let joyOriginY = JOY_Y

    scene.input.on('pointerdown', (p) => {
      if (joyPointerId !== null) return
      if (p.x > W / 2) return   // right half = buttons only
      joyPointerId = p.id
      joyOriginX   = p.x
      joyOriginY   = p.y
      base.setPosition(p.x, p.y)
      thumb.setPosition(p.x, p.y)
    })

    scene.input.on('pointermove', (p) => {
      if (p.id !== joyPointerId) return
      const dx  = p.x - joyOriginX
      const dy  = p.y - joyOriginY
      const len = Math.sqrt(dx * dx + dy * dy)
      const clamped = Math.min(len, RADIUS)
      const nx  = len > 0 ? dx / len : 0
      const ny  = len > 0 ? dy / len : 0

      thumb.setPosition(joyOriginX + nx * clamped, joyOriginY + ny * clamped)

      if (len > DEAD) {
        this._dx = nx
        this._dy = ny
      } else {
        this._dx = 0
        this._dy = 0
      }
    })

    scene.input.on('pointerup', (p) => {
      if (p.id !== joyPointerId) return
      joyPointerId = null
      this._dx = 0
      this._dy = 0
      base.setPosition(JOY_X, JOY_Y)
      thumb.setPosition(JOY_X, JOY_Y)
    })

    // ── Attack button ─────────────────────────────────────────────────────
    const atkBg = scene.add.circle(W - 80, H - 90, 40, 0xdc2626, 0.4)
      .setDepth(DEPTHS.HUD).setScrollFactor(0).setInteractive()
    scene.add.text(W - 80, H - 90, '⚔', { fontSize: '22px' })
      .setOrigin(0.5).setDepth(DEPTHS.HUD).setScrollFactor(0)
    atkBg.on('pointerdown', () => { this._attackPressed = true })

    // ── Spell button ──────────────────────────────────────────────────────
    const splBg = scene.add.circle(W - 80, H - 185, 40, 0x2563eb, 0.4)
      .setDepth(DEPTHS.HUD).setScrollFactor(0).setInteractive()
    scene.add.text(W - 80, H - 185, '✦', { fontSize: '22px' })
      .setOrigin(0.5).setDepth(DEPTHS.HUD).setScrollFactor(0)
    splBg.on('pointerdown', () => { this._spellPressed = true })
  }

  getMovement() { return { dx: this._dx, dy: this._dy } }

  attackJustPressed() {
    if (this._attackPressed) { this._attackPressed = false; return true }
    return false
  }

  spellJustPressed() {
    if (this._spellPressed) { this._spellPressed = false; return true }
    return false
  }

  get active() { return this._active }
}
