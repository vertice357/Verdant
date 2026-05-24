import Phaser from 'phaser'

// Spritesheet: 256×256, 4 cols × 4 rows, 64×64px per frame — no in-engine scaling
// Frame index = row * 4 + col
//
//         col0          col1          col2          col3
// row0 |  0 idle_down | 1 idle_up  | 2 idle_left | 3 idle_right |
// row1 |  4 walk_down | 5 walk_up  | 6 walk_left | 7 walk_right | (walk A)
// row2 |  8 walk_down | 9 walk_up  |10 walk_left |11 walk_right | (walk B)
// row3 | 12 atk_down  |13 atk_up   |14 atk_left  |15 atk_right  |

const FRAME_W = 64
const FRAME_H = 64

export const F = {
  IDLE_DOWN:  0,
  IDLE_UP:    1,
  IDLE_LEFT:  2,
  IDLE_RIGHT: 3,
  WALK_DOWN_A: 4,
  WALK_UP_A:   5,
  WALK_LEFT_A: 6,
  WALK_RIGHT_A:7,
  WALK_DOWN_B: 8,
  WALK_UP_B:   9,
  WALK_LEFT_B: 10,
  WALK_RIGHT_B:11,
  ATK_DOWN:   12,
  ATK_UP:     13,
  ATK_LEFT:   14,
  ATK_RIGHT:  15,
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    this.load.on('loaderror', (fileObj) => {
      console.error('❌ Phaser load error:', { key: fileObj.key, url: fileObj.url })
    })
    this.load.on('filecomplete', (key) => console.log(`✓ Phaser loaded: ${key}`))

    this.load.spritesheet('player', 'assets/sprites/sage.png',    { frameWidth: FRAME_W, frameHeight: FRAME_H })
    this.load.spritesheet('dew',    'assets/sprites/dew-sheet.png', { frameWidth: FRAME_W, frameHeight: FRAME_H })
  }

  create() {
    const anims = this.anims

    // ── Player (Sage) animations ──────────────────────────────────────────
    for (const [key, frame] of [
      ['player_idle_down',  F.IDLE_DOWN],  ['player_idle_up',    F.IDLE_UP],
      ['player_idle_left',  F.IDLE_LEFT],  ['player_idle_right', F.IDLE_RIGHT],
    ]) {
      anims.create({ key, frames: anims.generateFrameNumbers('player', { frames: [frame] }), frameRate: 1, repeat: -1 })
    }
    for (const [key, a, b] of [
      ['player_walk_down',  F.WALK_DOWN_A,  F.WALK_DOWN_B],
      ['player_walk_up',    F.WALK_UP_A,    F.WALK_UP_B],
      ['player_walk_left',  F.WALK_LEFT_A,  F.WALK_LEFT_B],
      ['player_walk_right', F.WALK_RIGHT_A, F.WALK_RIGHT_B],
    ]) {
      anims.create({ key, frames: anims.generateFrameNumbers('player', { frames: [a, b] }), frameRate: 8, repeat: -1 })
    }
    for (const [key, frame] of [
      ['player_attack_down',  F.ATK_DOWN],  ['player_attack_up',    F.ATK_UP],
      ['player_attack_left',  F.ATK_LEFT],  ['player_attack_right', F.ATK_RIGHT],
    ]) {
      anims.create({ key, frames: anims.generateFrameNumbers('player', { frames: [frame] }), frameRate: 14, repeat: 0 })
    }

    // ── Dew animations (same frame layout as Sage) ────────────────────────
    for (const [key, frame] of [
      ['dew_idle_down',  F.IDLE_DOWN],  ['dew_idle_up',    F.IDLE_UP],
      ['dew_idle_left',  F.IDLE_LEFT],  ['dew_idle_right', F.IDLE_RIGHT],
    ]) {
      anims.create({ key, frames: anims.generateFrameNumbers('dew', { frames: [frame] }), frameRate: 1, repeat: -1 })
    }
    for (const [key, a, b] of [
      ['dew_walk_down',  F.WALK_DOWN_A,  F.WALK_DOWN_B],
      ['dew_walk_up',    F.WALK_UP_A,    F.WALK_UP_B],
      ['dew_walk_left',  F.WALK_LEFT_A,  F.WALK_LEFT_B],
      ['dew_walk_right', F.WALK_RIGHT_A, F.WALK_RIGHT_B],
    ]) {
      anims.create({ key, frames: anims.generateFrameNumbers('dew', { frames: [a, b] }), frameRate: 10, repeat: -1 })
    }
    for (const [key, frame] of [
      ['dew_attack_down',  F.ATK_DOWN],  ['dew_attack_up',    F.ATK_UP],
      ['dew_attack_left',  F.ATK_LEFT],  ['dew_attack_right', F.ATK_RIGHT],
    ]) {
      anims.create({ key, frames: anims.generateFrameNumbers('dew', { frames: [frame] }), frameRate: 14, repeat: 0 })
    }

    console.log('✓ All animations registered')
    console.log('Boot OK')
    this.scene.start('GameScene')
    this.scene.launch('HUDScene')
  }
}
