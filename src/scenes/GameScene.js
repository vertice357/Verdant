import Phaser from 'phaser'
import { Player } from '../entities/Player.js'
import { Companion } from '../entities/Companion.js'
import { Mossling } from '../entities/enemies/Mossling.js'
import { DebugOverlay } from '../utils/DebugOverlay.js'
import { EventBus, EVENTS } from '../systems/EventBus.js'
import { DEPTHS } from '../config/Constants.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this._buildRoom()
    this._spawnEntities()
    this.debug = new DebugOverlay(this)

    EventBus.on(EVENTS.PLAYER_DIED, () => {
      this.time.delayedCall(1000, () => {
        this.add.text(480, 270, 'GAME OVER', {
          fontFamily: 'monospace',
          fontSize: '32px',
          color: '#ef4444',
        }).setOrigin(0.5).setDepth(DEPTHS.HUD)
        this.add.text(480, 310, 'Refresh to restart', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#6b7280',
        }).setOrigin(0.5).setDepth(DEPTHS.HUD)
      })
    })
  }

  _buildRoom() {
    const W = 960, H = 540, T = 32

    const floor = this.add.graphics().setDepth(DEPTHS.FLOOR)
    floor.fillStyle(0x2d4a3e)
    floor.fillRect(T * 2, T * 2, W - T * 4, H - T * 4)

    const wallGfx = this.add.graphics().setDepth(DEPTHS.FLOOR)
    wallGfx.fillStyle(0x1a2e28)
    wallGfx.fillRect(0, 0, W, T * 2)
    wallGfx.fillRect(0, H - T * 2, W, T * 2)
    wallGfx.fillRect(0, 0, T * 2, H)
    wallGfx.fillRect(W - T * 2, 0, T * 2, H)
    wallGfx.lineStyle(2, 0x374151, 1)
    wallGfx.strokeRect(T * 2, T * 2, W - T * 4, H - T * 4)

    this.walls = this.physics.add.staticGroup()
    const wallDefs = [
      { x: W / 2, y: T,       w: W,     h: T * 2 },
      { x: W / 2, y: H - T,   w: W,     h: T * 2 },
      { x: T,     y: H / 2,   w: T * 2, h: H     },
      { x: W - T, y: H / 2,   w: T * 2, h: H     },
    ]
    wallDefs.forEach(d => {
      const zone = this.add.zone(d.x, d.y, d.w, d.h)
      this.physics.add.existing(zone, true)
      this.walls.add(zone)
    })
  }

  _spawnEntities() {
    this.projectiles = this.physics.add.group()

    this.player = new Player(this, 480, 270)
    this.companion = new Companion(this, 420, 270, this.player)

    this.enemies = this.add.group()
    const spawnPoints = [{ x: 700, y: 180 }, { x: 740, y: 380 }, { x: 200, y: 200 }]
    spawnPoints.forEach(pos => {
      this.enemies.add(new Mossling(this, pos.x, pos.y, this.player))
    })

    this.physics.add.collider(this.player, this.walls)
    this.physics.add.collider(this.companion, this.walls)
    this.physics.add.collider(this.enemies, this.walls)

    this.physics.add.overlap(
      this.player.attackHitbox, this.enemies,
      (_, enemy) => { if (enemy.active) enemy.takeDamage(this.player.attackDamage) }
    )

    this.physics.add.overlap(
      this.player, this.enemies,
      (player, enemy) => { if (enemy.active) player.takeDamage(enemy.damage) }
    )

    this.physics.add.overlap(
      this.companion.attackHitbox, this.enemies,
      (_, enemy) => { if (enemy.active) enemy.takeDamage(this.companion.attackDamage) }
    )

    this.physics.add.overlap(
      this.projectiles, this.enemies,
      (proj, enemy) => {
        if (!proj.active || !enemy.active) return
        enemy.takeDamage(proj.damage)
        // Defer projectile destroy to next frame
        this.time.delayedCall(0, () => { if (proj.active) proj.destroy() })
      }
    )

    this.physics.add.collider(
      this.projectiles, this.walls,
      (proj) => { this.time.delayedCall(0, () => { if (proj.active) proj.destroy() }) }
    )
  }

  update(time, delta) {
    this.player.update(time, delta)
    this.companion.update(time, delta)
    this.enemies.getChildren().forEach(e => { if (e.active) e.update(time, delta) })
    this.debug.update()
  }
}
