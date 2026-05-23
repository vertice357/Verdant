import Phaser from 'phaser'
import { Player } from '../entities/Player.js'
import { Companion } from '../entities/Companion.js'
import { Mossling } from '../entities/enemies/Mossling.js'
import { DebugOverlay } from '../utils/DebugOverlay.js'
import { DEPTHS } from '../config/Constants.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this._buildRoom()
    this._spawnEntities()
    this.debug = new DebugOverlay(this)
  }

  _buildRoom() {
    const W = 960
    const H = 540
    const T = 32

    // Floor tiles (visual only)
    const floorGraphics = this.add.graphics()
    floorGraphics.fillStyle(0x2d4a3e, 1)
    floorGraphics.fillRect(T * 2, T * 2, W - T * 4, H - T * 4)
    floorGraphics.setDepth(DEPTHS.FLOOR)

    // Wall graphics
    const wallGraphics = this.add.graphics()
    wallGraphics.fillStyle(0x1a2e28, 1)
    // top
    wallGraphics.fillRect(0, 0, W, T * 2)
    // bottom
    wallGraphics.fillRect(0, H - T * 2, W, T * 2)
    // left
    wallGraphics.fillRect(0, 0, T * 2, H)
    // right
    wallGraphics.fillRect(W - T * 2, 0, T * 2, H)
    wallGraphics.setDepth(DEPTHS.FLOOR)

    // Physics wall bodies
    this.walls = this.physics.add.staticGroup()
    const wallData = [
      { x: W / 2, y: T,       w: W,        h: T * 2 },
      { x: W / 2, y: H - T,   w: W,        h: T * 2 },
      { x: T,     y: H / 2,   w: T * 2,    h: H     },
      { x: W - T, y: H / 2,   w: T * 2,    h: H     },
    ]
    for (const d of wallData) {
      const body = this.add.zone(d.x, d.y, d.w, d.h)
      this.physics.add.existing(body, true)
      this.walls.add(body)
    }
  }

  _spawnEntities() {
    this.player = new Player(this, 480, 270)
    this.companion = new Companion(this, 420, 270, this.player)

    this.enemies = this.add.group()
    const m1 = new Mossling(this, 700, 200, this.player)
    const m2 = new Mossling(this, 750, 380, this.player)
    this.enemies.add(m1)
    this.enemies.add(m2)

    // Wall collisions
    this.physics.add.collider(this.player, this.walls)
    this.physics.add.collider(this.companion, this.walls)
    this.physics.add.collider(this.enemies, this.walls)

    // Player attack vs enemies
    this.physics.add.overlap(
      this.player.attackHitbox,
      this.enemies,
      (hitbox, enemy) => enemy.takeDamage(this.player.attackDamage),
    )

    // Enemy contact damage to player
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (player, enemy) => player.takeDamage(enemy.damage),
    )

    // Dew attack vs enemies
    this.physics.add.overlap(
      this.companion.attackHitbox,
      this.enemies,
      (hitbox, enemy) => enemy.takeDamage(this.companion.attackDamage),
    )

    // Projectile vs enemies handled in SpellSystem
    this.projectiles = this.physics.add.group()
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      (proj, enemy) => {
        enemy.takeDamage(proj.damage)
        proj.destroy()
      },
    )
  }

  update(time, delta) {
    this.player.update(time, delta)
    this.companion.update(time, delta)
    this.enemies.getChildren().forEach(e => e.update(time, delta))
    this.debug.update()
  }
}
