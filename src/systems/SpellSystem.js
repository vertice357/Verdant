import { PLAYER, DEPTHS } from '../config/Constants.js'
import { EventBus, EVENTS } from './EventBus.js'

const SPELLS = {
  aquaBolt: {
    damage: 2,
    speed: 380,
    range: 420,
    manaCost: 1,
    color: 0x38bdf8,
    size: 7,
  },
}

export class SpellSystem {
  constructor(scene, player) {
    this.scene = scene
    this.player = player
  }

  cast(spellKey, facing) {
    const spell = SPELLS[spellKey]
    if (!spell) return

    if (this.player.mana < spell.manaCost) return

    this.player.mana -= spell.manaCost
    EventBus.emit(EVENTS.PLAYER_MANA_CHANGED, { mana: this.player.mana })

    const dirMap = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
    const [dx, dy] = dirMap[facing] || [0, 1]

    const proj = this.scene.projectiles.create(this.player.x + dx * 20, this.player.y + dy * 20, null)
    proj.setVisible(false)
    proj.body.setSize(spell.size * 2, spell.size * 2)
    proj.damage = spell.damage
    proj.setDepth(DEPTHS.PROJECTILES)
    proj.setVelocity(dx * spell.speed, dy * spell.speed)

    // Draw projectile
    const gfx = this.scene.add.graphics()
    gfx.fillStyle(spell.color, 1)
    gfx.fillCircle(0, 0, spell.size)
    // Glow ring
    gfx.lineStyle(2, 0xbae6fd, 0.6)
    gfx.strokeCircle(0, 0, spell.size + 2)
    proj._gfx = gfx

    // Destroy after range timeout
    const timeToLive = (spell.range / spell.speed) * 1000
    this.scene.time.delayedCall(timeToLive, () => {
      if (proj.active) {
        gfx.destroy()
        proj.destroy()
      }
    })

    // Sync gfx each frame
    this.scene.events.on('update', () => {
      if (proj.active) {
        gfx.setPosition(proj.x, proj.y)
      } else {
        gfx.destroy()
      }
    })

    EventBus.emit(EVENTS.SPELL_CAST, { spell: spellKey })
  }
}
