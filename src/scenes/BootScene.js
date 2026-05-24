import Phaser from 'phaser'

// Sprite sheet frame dimensions — adjust these if the image differs
const FRAME_W = 128
const FRAME_H = 160
const SHEET_COLS = 8

// Frame indices (row * SHEET_COLS + col)
// Row 0: 8 directional idle/standing poses
// Row 1: 7-frame walk cycle (indices 8-14)
// Row 2: 5-frame attack sequence (indices 16-20)
const F = {
  IDLE_DOWN:   1,   // front-facing
  IDLE_UP:     3,   // back-facing
  IDLE_SIDE:   5,   // side profile (flipX for left)
  WALK_START:  8,
  WALK_END:    14,
  ATK_START:   16,
  ATK_END:     20,
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    this.load.spritesheet('player', 'assets/sprites/player.png', {
      frameWidth: FRAME_W,
      frameHeight: FRAME_H,
    })
  }

  create() {
    const anims = this.anims

    anims.create({
      key: 'player_idle_down',
      frames: [{ key: 'player', frame: F.IDLE_DOWN }],
      frameRate: 1,
      repeat: -1,
    })

    anims.create({
      key: 'player_idle_up',
      frames: [{ key: 'player', frame: F.IDLE_UP }],
      frameRate: 1,
      repeat: -1,
    })

    anims.create({
      key: 'player_idle_side',
      frames: [{ key: 'player', frame: F.IDLE_SIDE }],
      frameRate: 1,
      repeat: -1,
    })

    anims.create({
      key: 'player_walk',
      frames: anims.generateFrameNumbers('player', {
        start: F.WALK_START,
        end: F.WALK_END,
      }),
      frameRate: 10,
      repeat: -1,
    })

    anims.create({
      key: 'player_attack',
      frames: anims.generateFrameNumbers('player', {
        start: F.ATK_START,
        end: F.ATK_END,
      }),
      frameRate: 14,
      repeat: 0,
    })

    console.log('Boot OK')
    this.scene.start('GameScene')
    this.scene.launch('HUDScene')
  }
}
