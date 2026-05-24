import { DEPTHS } from '../config/Constants.js'
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

    // Create projectile as a visible circle using a Graphics texture
    const gfx = this.scene.add.graphics()
    gfx.fillStyle(spell.color, 1)
    gfx.fillCircle(spell.size, spell.size, spell.size)
    gfx.lineStyle(2, 0xbae6fd, 0.6)
    gfx.strokeCircle(spell.size, spell.size, spell.size + 2)
    gfx.generateTexture('aquaBoltTex', spell.size * 2 + 4, spell.size * 2 + 4)
    gfx.destroy()

    const startX = this.player.x + dx * 22
    const startY = this.player.y + dy * 22

    const proj = this.scene.projectiles.create(startX, startY, 'aquaBoltTex')
    proj.setDepth(DEPTHS.PROJECTILES)
    proj.body.setSize(spell.size * 2, spell.size * 2)
    proj.damage = spell.damage
    proj.setVelocity(dx * spell.speed, dy * spell.speed)

    // Destroy after max range
    const timeToLive = (spell.range / spell.speed) * 1000
    this.scene.time.delayedCall(timeToLive, () => {
      if (proj.active) proj.destroy()
    })

    EventBus.emit(EVENTS.SPELL_CAST, { spell: spellKey })
  }
}
