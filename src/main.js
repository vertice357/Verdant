import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { GameScene } from './scenes/GameScene.js'
import { HUDScene } from './scenes/HUDScene.js'

// Global error overlay — catches any uncaught JS error and prints it on screen
window.onerror = (msg, src, line, col, err) => {
  showError(`${msg}\n${src}:${line}:${col}`)
}
window.onunhandledrejection = (e) => {
  showError(`Unhandled promise: ${e.reason}`)
}

function showError(text) {
  const div = document.createElement('div')
  div.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'width:100%', 'padding:12px',
    'background:#7f1d1d', 'color:#fca5a5', 'font:13px monospace',
    'white-space:pre-wrap', 'z-index:9999', 'pointer-events:none',
  ].join(';')
  div.textContent = '❌ ERROR:\n' + text
  document.body.appendChild(div)
  console.error('[VERDANT ERROR]', text)
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, GameScene, HUDScene],
  callbacks: {
    postBoot: (game) => {
      game.events.on('step', () => {
        // Heartbeat — if this stops firing the loop is frozen
      })
    },
  },
}

const game = new Phaser.Game(config)

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    game.destroy(true)
    window.location.reload()
  })
}
