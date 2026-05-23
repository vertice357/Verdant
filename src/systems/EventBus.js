import Phaser from 'phaser'

export const EventBus = new Phaser.Events.EventEmitter()

export const EVENTS = {
  PLAYER_DAMAGED: 'player-damaged',
  PLAYER_HEALED: 'player-healed',
  PLAYER_DIED: 'player-died',
  PLAYER_MANA_CHANGED: 'player-mana-changed',
  ENEMY_DIED: 'enemy-died',
  SPELL_CAST: 'spell-cast',
  OPAL_COLLECTED: 'opal-collected',
  DEW_BOND_XP: 'dew-bond-xp',
  ROOM_CHANGED: 'room-changed',
}
