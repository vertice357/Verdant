import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // placeholder: real asset loading goes here in Phase 2
  }

  create() {
    console.log('Boot OK')
    this.scene.start('GameScene')
  }
}
