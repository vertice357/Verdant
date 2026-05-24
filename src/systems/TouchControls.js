import { DEPTHS } from '../config/Constants.js'

const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches

export class TouchControls {
  constructor(scene) {
    this._attackPressed = false
    this._spellPressed  = false
    this._joystick      = null
    this._visible       = false

    if (!isTouchDevice()) return

    this._visible = true
    this._build(scene)
  }

  _build(scene) {
    const W = scene.scale.width
    const H = scene.scale.height

    // ── Joystick (bottom-left) ────────────────────────────────────────────
    const joyX = 110
    const joyY = H - 110

    const base  = scene.add.circle(joyX, joyY, 60, 0x6d28d9, 0.3)
      .setDepth(DEPTHS.HUD).setScrollFactor(0)
    const thumb = scene.add.circle(joyX, joyY, 30, 0xa78bfa, 0.7)
      .setDepth(DEPTHS.HUD).setScrollFactor(0)

    this._joystick = scene.plugins.get('rexVirtualJoystick').add(scene, {
      x: joyX,
      y: joyY,
      radius: 60,
      base,
      thumb,
      dir: '8dir',
      forceMin: 16,
    })

    // ── Attack button (bottom-right) ──────────────────────────────────────
    const atkX = W - 80
    const atkY = H - 90

    const atkBg = scene.add.circle(atkX, atkY, 40, 0xdc2626, 0.4)
      .setDepth(DEPTHS.HUD).setScrollFactor(0).setInteractive()
    scene.add.text(atkX, atkY, '⚔', { fontSize: '22px' })
      .setOrigin(0.5).setDepth(DEPTHS.HUD).setScrollFactor(0)

    atkBg.on('pointerdown', () => { this._attackPressed = true })
    atkBg.on('pointerup',   () => {})

    // ── Spell button (above attack) ───────────────────────────────────────
    const splX = W - 80
    const splY = H - 185

    const splBg = scene.add.circle(splX, splY, 40, 0x2563eb, 0.4)
      .setDepth(DEPTHS.HUD).setScrollFactor(0).setInteractive()
    scene.add.text(splX, splY, '✦', { fontSize: '22px' })
      .setOrigin(0.5).setDepth(DEPTHS.HUD).setScrollFactor(0)

    splBg.on('pointerdown', () => { this._spellPressed = true })
    splBg.on('pointerup',   () => {})
  }

  // Called each frame by InputSystem — returns movement vector
  getMovement() {
    if (!this._joystick) return { dx: 0, dy: 0 }
    const cursor = this._joystick.createCursorKeys()
    let dx = 0, dy = 0
    if (cursor.left.isDown)  dx -= 1
    if (cursor.right.isDown) dx += 1
    if (cursor.up.isDown)    dy -= 1
    if (cursor.down.isDown)  dy += 1
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707 }
    return { dx, dy }
  }

  // Consume and return one-shot presses
  attackJustPressed() {
    if (this._attackPressed) { this._attackPressed = false; return true }
    return false
  }

  spellJustPressed() {
    if (this._spellPressed) { this._spellPressed = false; return true }
    return false
  }

  get active() { return this._visible }
}
