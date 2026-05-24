export class InputSystem {
  constructor(scene) {
    this.keys = scene.input.keyboard.addKeys({
      up:      Phaser.Input.Keyboard.KeyCodes.W,
      down:    Phaser.Input.Keyboard.KeyCodes.S,
      left:    Phaser.Input.Keyboard.KeyCodes.A,
      right:   Phaser.Input.Keyboard.KeyCodes.D,
      upArr:   Phaser.Input.Keyboard.KeyCodes.UP,
      downArr: Phaser.Input.Keyboard.KeyCodes.DOWN,
      leftArr: Phaser.Input.Keyboard.KeyCodes.LEFT,
      rightArr:Phaser.Input.Keyboard.KeyCodes.RIGHT,
      attack:  Phaser.Input.Keyboard.KeyCodes.SPACE,
      spell:   Phaser.Input.Keyboard.KeyCodes.Q,
      debug:   Phaser.Input.Keyboard.KeyCodes.F,
    })

    this._attackPressed = false
    this._spellPressed  = false
    this._touch         = null   // set after TouchControls is created
  }

  setTouchControls(tc) {
    this._touch = tc
  }

  update() {
    this._attackPressed = Phaser.Input.Keyboard.JustDown(this.keys.attack)
    this._spellPressed  = Phaser.Input.Keyboard.JustDown(this.keys.spell)
  }

  getMovement() {
    let dx = 0, dy = 0

    // Keyboard
    if (this.keys.left.isDown  || this.keys.leftArr.isDown)  dx -= 1
    if (this.keys.right.isDown || this.keys.rightArr.isDown) dx += 1
    if (this.keys.up.isDown    || this.keys.upArr.isDown)    dy -= 1
    if (this.keys.down.isDown  || this.keys.downArr.isDown)  dy += 1

    // Touch — override keyboard if joystick is active
    if (this._touch?.active) {
      const t = this._touch.getMovement()
      if (t.dx !== 0 || t.dy !== 0) { dx = t.dx; dy = t.dy }
    }

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707 }
    return { dx, dy }
  }

  attackJustPressed() {
    return this._attackPressed || (this._touch?.attackJustPressed() ?? false)
  }

  spellJustPressed() {
    return this._spellPressed || (this._touch?.spellJustPressed() ?? false)
  }

  isDebugPressed() { return Phaser.Input.Keyboard.JustDown(this.keys.debug) }
}
