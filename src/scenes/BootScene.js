import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // Phase 2: load tilemap + spritesheet assets here
  }

  create() {
    console.log('Boot OK')
    this.scene.start('GameScene')
    this.scene.launch('HUDScene')
  }
}
