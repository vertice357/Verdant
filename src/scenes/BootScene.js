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
  IDLE_DOWN:   0,   // Use frame 0 for all idles (testing)
  IDLE_UP:     0,
  IDLE_SIDE:   0,
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
    const assetUrl = 'assets/sprites/sage.png'

    // First check: can we fetch the asset?
    fetch(assetUrl)
      .then(r => {
        console.log(`✓ Asset exists at ${assetUrl} (status ${r.status})`)
      })
      .catch(e => console.error(`❌ Asset not found: ${assetUrl}`, e))

    const load = this.load

    load.on('loaderror', (fileObj) => {
      console.error('❌ Phaser load error:', {
        key: fileObj.key,
        url: fileObj.url,
        state: fileObj.state,
      })
    })

    load.on('filecomplete', (key) => {
      console.log(`✓ Phaser loaded: ${key}`)
    })

    console.log(`[preload] Loading spritesheet from: ${assetUrl}`)
    load.spritesheet('player', assetUrl, {
      frameWidth: FRAME_W,
      frameHeight: FRAME_H,
    })
  }

  create() {
    console.log('[create] Texture manager keys:', this.textures.getTextureKeys())

    const tex = this.textures.get('player')
    if (!tex) {
      console.error('❌ CRITICAL: player texture undefined in create()')
      return
    }

    const frameTotal = tex.frameTotal || tex.getFrameNames?.().length || 0
    console.log(`✓ Texture 'player' exists with ${frameTotal} frames`)

    const anims = this.anims

    // Use generateFrameNumbers for all animations (more reliable than manual frame objects)
    anims.create({
      key: 'player_idle_down',
      frames: anims.generateFrameNumbers('player', { start: F.IDLE_DOWN, end: F.IDLE_DOWN }),
      frameRate: 1,
      repeat: -1,
    })

    anims.create({
      key: 'player_idle_up',
      frames: anims.generateFrameNumbers('player', { start: F.IDLE_UP, end: F.IDLE_UP }),
      frameRate: 1,
      repeat: -1,
    })

    anims.create({
      key: 'player_idle_side',
      frames: anims.generateFrameNumbers('player', { start: F.IDLE_SIDE, end: F.IDLE_SIDE }),
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

    console.log('✓ All animations registered')

    console.log('Boot OK')
    this.scene.start('GameScene')
    this.scene.launch('HUDScene')
  }
}
