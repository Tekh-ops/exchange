import { CombatEntity, EnemyIntent } from '../combat/combatTypes';

export interface EnemyAction {
  spellId: string;
  name: string;
  type: 'attack' | 'defense' | 'hex' | 'drain';
  manaCost: number;
  baseDamage: number;
  shieldValue?: number;
  castAnimation: 'spark' | 'missile' | 'fire' | 'hex' | 'shield' | 'drain';
  projectileType: 'arcane_bolt' | 'fire_orb' | 'void_skull' | 'spark' | 'hex_beam';
  flavorMessage: string;
}

export const ENEMY_SPELLS: Record<string, EnemyAction> = {
  void_bolt: {
    spellId: 'void_bolt',
    name: 'Void Bolt',
    type: 'attack',
    manaCost: 12,
    baseDamage: 22,
    castAnimation: 'missile',
    projectileType: 'void_skull',
    flavorMessage: 'Malakor launches a swirling skull of void energy!',
  },
  nether_ward: {
    spellId: 'nether_ward',
    name: 'Nether Barrier',
    type: 'defense',
    manaCost: 15,
    baseDamage: 0,
    shieldValue: 30,
    castAnimation: 'shield',
    projectileType: 'hex_beam',
    flavorMessage: 'Malakor weaves a sinister defensive shroud!',
  },
  dread_hex: {
    spellId: 'dread_hex',
    name: 'Curse of Impotence',
    type: 'hex',
    manaCost: 18,
    baseDamage: 12,
    castAnimation: 'hex',
    projectileType: 'hex_beam',
    flavorMessage: 'Malakor mutters a vicious incantation weakening your magic!',
  },
  cataclysm_blast: {
    spellId: 'cataclysm_blast',
    name: 'Doom Cataclysm',
    type: 'attack',
    manaCost: 35,
    baseDamage: 42,
    castAnimation: 'fire',
    projectileType: 'fire_orb',
    flavorMessage: 'Malakor conjures a roaring apocalyptic orb of dark fire!',
  },
  leech_vitality: {
    spellId: 'leech_vitality',
    name: 'Essence Leech',
    type: 'drain',
    manaCost: 15,
    baseDamage: 18,
    castAnimation: 'drain',
    projectileType: 'void_skull',
    flavorMessage: 'Malakor siphons your life essence to mend his wounds!',
  },
};

/**
 * Intelligent tactical decision maker for Arch-Mage Malakor
 */
export function decideEnemyIntent(enemy: CombatEntity, player: CombatEntity): EnemyIntent {
  // If enemy is below 35% HP and has no shield, prioritize defense or leech
  if (enemy.hp < enemy.maxHp * 0.4 && enemy.shield === 0 && enemy.mana >= 15) {
    if (Math.random() < 0.6) {
      return {
        spellId: 'nether_ward',
        spellName: 'Nether Barrier',
        type: 'defense',
        description: 'Conjures a dark ward absorbing 30 incoming damage.',
      };
    } else {
      return {
        spellId: 'leech_vitality',
        spellName: 'Essence Leech',
        type: 'attack',
        estimatedDamage: 18,
        description: 'Leeches 18 vitality to recover his own health.',
      };
    }
  }

  // If enemy has high mana and player has no shield, go for Cataclysm
  if (enemy.mana >= 35 && player.shield === 0 && Math.random() < 0.5) {
    return {
      spellId: 'cataclysm_blast',
      spellName: 'Doom Cataclysm',
      type: 'ultimate',
      estimatedDamage: 42,
      description: 'Chanting a devastating apocalyptic blast!',
    };
  }

  // Hex if player doesn't have weaken
  const playerWeakened = player.statusEffects.some(s => s.type === 'weaken');
  if (!playerWeakened && enemy.mana >= 18 && Math.random() < 0.4) {
    return {
      spellId: 'dread_hex',
      spellName: 'Curse of Impotence',
      type: 'hex',
      estimatedDamage: 12,
      description: 'Inflicts 12 damage and dampens spell output.',
    };
  }

  // Default to standard Void Bolt
  return {
    spellId: 'void_bolt',
    spellName: 'Void Bolt',
    type: 'attack',
    estimatedDamage: 22,
    description: 'Fires a concentrated bolt of necrotic energy.',
  };
}
