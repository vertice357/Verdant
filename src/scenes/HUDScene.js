import Phaser from 'phaser'
import { EventBus, EVENTS } from '../systems/EventBus.js'
import { PLAYER, DEPTHS } from '../config/Constants.js'

export class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene' })
  }

  create() {
    this.hp = PLAYER.HP_MAX
    this.mana = PLAYER.MANA_MAX
    this._buildHUD()

    EventBus.on(EVENTS.PLAYER_DAMAGED, ({ hp }) => this._updateHP(hp))
    EventBus.on(EVENTS.PLAYER_HEALED, ({ hp }) => this._updateHP(hp))
    EventBus.on(EVENTS.PLAYER_MANA_CHANGED, ({ mana }) => this._updateMana(mana))
  }

  _buildHUD() {
    this.hpText = this.add.text(16, 16, this._hpString(), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f87171',
    }).setDepth(DEPTHS.HUD)

    this.manaText = this.add.text(16, 40, this._manaString(), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#818cf8',
    }).setDepth(DEPTHS.HUD)

    if (!window.matchMedia('(pointer: coarse)').matches) {
      this.add.text(16, 64, 'SPACE: attack  Q: Aqua Bolt  F: debug', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#6b7280',
      }).setDepth(DEPTHS.HUD)
    }
  }

  _hpString() {
    return 'HP: ' + '♥'.repeat(Math.max(0, this.hp)) + '♡'.repeat(Math.max(0, PLAYER.HP_MAX - this.hp))
  }

  _manaString() {
    return 'MP: ' + '●'.repeat(Math.max(0, this.mana)) + '○'.repeat(Math.max(0, PLAYER.MANA_MAX - this.mana))
  }

  _updateHP(hp) {
    this.hp = hp
    this.hpText.setText(this._hpString())
  }

  _updateMana(mana) {
    this.mana = mana
    this.manaText.setText(this._manaString())
  }
}
