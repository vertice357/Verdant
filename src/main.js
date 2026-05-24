import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { GameScene } from './scenes/GameScene.js'
import { HUDScene } from './scenes/HUDScene.js'

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, GameScene, HUDScene],
}

const game = new Phaser.Game(config)

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    game.destroy(true)
    window.location.reload()
  })
}
