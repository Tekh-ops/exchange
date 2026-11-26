import { CombatEntity, EnemyIntent, Lane } from '../combat/combatTypes';
import { LANES } from '../combat/LaneSystem';

export interface EnemyAction {
  spellId: string;
  name: string;
  type: 'attack' | 'defense' | 'hex' | 'drain' | 'support';
  manaCost: number;
  baseDamage: number;
  shieldValue?: number;
  healValue?: number;
  attackPattern?: 'single_lane' | 'multi_lane' | 'all_lanes' | 'homing' | 'support';
  dangerLevel?: 'low' | 'moderate' | 'high' | 'extreme';
  canDodge?: boolean;
  canBlock?: boolean;
  canInterrupt?: boolean;
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
    attackPattern: 'single_lane',
    dangerLevel: 'moderate',
    canDodge: true,
    canBlock: true,
    canInterrupt: false,
    castAnimation: 'missile',
    projectileType: 'void_skull',
    flavorMessage: 'launches a swirling skull of void energy!',
  },
  nether_ward: {
    spellId: 'nether_ward',
    name: 'Nether Barrier',
    type: 'defense',
    manaCost: 15,
    baseDamage: 0,
    shieldValue: 30,
    attackPattern: 'support',
    dangerLevel: 'low',
    canDodge: false,
    canBlock: false,
    canInterrupt: true,
    castAnimation: 'shield',
    projectileType: 'hex_beam',
    flavorMessage: 'weaves a sinister defensive shroud!',
  },
  dread_hex: {
    spellId: 'dread_hex',
    name: 'Curse of Impotence',
    type: 'hex',
    manaCost: 18,
    baseDamage: 12,
    attackPattern: 'homing',
    dangerLevel: 'moderate',
    canDodge: true,
    canBlock: true,
    canInterrupt: false,
    castAnimation: 'hex',
    projectileType: 'hex_beam',
    flavorMessage: 'mutters a vicious incantation weakening your magic!',
  },
  cataclysm_blast: {
    spellId: 'cataclysm_blast',
    name: 'Doom Cataclysm',
    type: 'attack',
    manaCost: 35,
    baseDamage: 42,
    attackPattern: 'multi_lane',
    dangerLevel: 'extreme',
    canDodge: true,
    canBlock: true,
    canInterrupt: true,
    castAnimation: 'fire',
    projectileType: 'fire_orb',
    flavorMessage: 'conjures a roaring apocalyptic orb of dark fire!',
  },
  leech_vitality: {
    spellId: 'leech_vitality',
    name: 'Essence Leech',
    type: 'drain',
    manaCost: 15,
    baseDamage: 18,
    attackPattern: 'single_lane',
    dangerLevel: 'moderate',
    canDodge: true,
    canBlock: true,
    canInterrupt: false,
    castAnimation: 'drain',
    projectileType: 'void_skull',
    flavorMessage: 'siphons your life essence to mend wounds!',
  },
  ember_bolt: {
    spellId: 'ember_bolt',
    name: 'Ember Bolt',
    type: 'attack',
    manaCost: 10,
    baseDamage: 16,
    attackPattern: 'single_lane',
    dangerLevel: 'moderate',
    canDodge: true,
    canBlock: true,
    canInterrupt: false,
    castAnimation: 'fire',
    projectileType: 'fire_orb',
    flavorMessage: 'hurls a scorching cinder across the lane!',
  },
  frost_lance: {
    spellId: 'frost_lance',
    name: 'Frost Lance',
    type: 'attack',
    manaCost: 12,
    baseDamage: 15,
    attackPattern: 'single_lane',
    dangerLevel: 'moderate',
    canDodge: true,
    canBlock: true,
    canInterrupt: false,
    castAnimation: 'missile',
    projectileType: 'arcane_bolt',
    flavorMessage: 'fires a razor shard of glacial spite!',
  },
  ally_ward: {
    spellId: 'ally_ward',
    name: 'Bastion Ward',
    type: 'support',
    manaCost: 14,
    baseDamage: 0,
    shieldValue: 25,
    attackPattern: 'support',
    dangerLevel: 'low',
    canDodge: false,
    canBlock: false,
    canInterrupt: true,
    castAnimation: 'shield',
    projectileType: 'hex_beam',
    flavorMessage: 'projects a protective barrier onto an ally!',
  },
  ally_mend: {
    spellId: 'ally_mend',
    name: 'Acolyte Mend',
    type: 'support',
    manaCost: 16,
    baseDamage: 0,
    healValue: 24,
    attackPattern: 'support',
    dangerLevel: 'low',
    canDodge: false,
    canBlock: false,
    canInterrupt: true,
    castAnimation: 'drain',
    projectileType: 'hex_beam',
    flavorMessage: 'chants a restorative hymn for an injured ally!',
  },
  prism_lance: {
    spellId: 'prism_lance',
    name: 'Prismatic Lance',
    type: 'attack',
    manaCost: 14,
    baseDamage: 24,
    attackPattern: 'single_lane',
    dangerLevel: 'high',
    canDodge: true,
    canBlock: true,
    canInterrupt: false,
    castAnimation: 'spark',
    projectileType: 'spark',
    flavorMessage: 'refracts a blinding beam of arcane crystal!',
  },
  crystalline_burst: {
    spellId: 'crystalline_burst',
    name: 'Crystalline Burst',
    type: 'attack',
    manaCost: 30,
    baseDamage: 34,
    attackPattern: 'all_lanes',
    dangerLevel: 'extreme',
    canDodge: false,
    canBlock: true,
    canInterrupt: true,
    castAnimation: 'fire',
    projectileType: 'arcane_bolt',
    flavorMessage: 'shatters the arena with an all-lane prismatic eruption!',
  },
  lane_beam: {
    spellId: 'lane_beam',
    name: 'Refraction Beam',
    type: 'attack',
    manaCost: 18,
    baseDamage: 28,
    attackPattern: 'single_lane',
    dangerLevel: 'high',
    canDodge: true,
    canBlock: true,
    canInterrupt: false,
    castAnimation: 'missile',
    projectileType: 'arcane_bolt',
    flavorMessage: 'locks a focused laser onto your lane!',
  },
  shadow_ambush: {
    spellId: 'shadow_ambush',
    name: 'Shadow Ambush',
    type: 'attack',
    manaCost: 16,
    baseDamage: 25,
    attackPattern: 'single_lane',
    dangerLevel: 'high',
    canDodge: true,
    canBlock: true,
    canInterrupt: false,
    castAnimation: 'hex',
    projectileType: 'void_skull',
    flavorMessage: 'strikes from the umbral flank!',
  },
  flank_volley: {
    spellId: 'flank_volley',
    name: 'Flank Volley',
    type: 'attack',
    manaCost: 24,
    baseDamage: 30,
    attackPattern: 'multi_lane',
    dangerLevel: 'high',
    canDodge: true,
    canBlock: true,
    canInterrupt: true,
    castAnimation: 'missile',
    projectileType: 'hex_beam',
    flavorMessage: 'blankets two lanes in shadow daggers!',
  },
  eternal_bolt: {
    spellId: 'eternal_bolt',
    name: 'Eternal Arcana',
    type: 'attack',
    manaCost: 14,
    baseDamage: 26,
    attackPattern: 'single_lane',
    dangerLevel: 'moderate',
    canDodge: true,
    canBlock: true,
    canInterrupt: false,
    castAnimation: 'missile',
    projectileType: 'arcane_bolt',
    flavorMessage: 'fires a measured lance of ancient violet force!',
  },
  arcane_ward_vorath: {
    spellId: 'arcane_ward_vorath',
    name: 'Aegis of Centuries',
    type: 'defense',
    manaCost: 24,
    baseDamage: 0,
    shieldValue: 85,
    attackPattern: 'support',
    dangerLevel: 'low',
    canDodge: false,
    canBlock: false,
    canInterrupt: true,
    castAnimation: 'shield',
    projectileType: 'hex_beam',
    flavorMessage: 'erects an ancient gilded barrier!',
  },
  abyssal_lance: {
    spellId: 'abyssal_lance',
    name: 'Abyssal Convergence',
    type: 'attack',
    manaCost: 28,
    baseDamage: 34,
    attackPattern: 'multi_lane',
    dangerLevel: 'high',
    canDodge: true,
    canBlock: true,
    canInterrupt: false,
    castAnimation: 'spark',
    projectileType: 'spark',
    flavorMessage: 'splits the arena with twin forbidden lances!',
  },
  chronal_snare: {
    spellId: 'chronal_snare',
    name: 'Chronal Snare',
    type: 'hex',
    manaCost: 22,
    baseDamage: 22,
    attackPattern: 'homing',
    dangerLevel: 'high',
    canDodge: true,
    canBlock: true,
    canInterrupt: false,
    castAnimation: 'hex',
    projectileType: 'hex_beam',
    flavorMessage: 'warps time around your footing to punish evasion!',
  },
  apocalypse_singularity: {
    spellId: 'apocalypse_singularity',
    name: 'End of Ages',
    type: 'attack',
    manaCost: 48,
    baseDamage: 56,
    attackPattern: 'all_lanes',
    dangerLevel: 'extreme',
    canDodge: true,
    canBlock: true,
    canInterrupt: true,
    castAnimation: 'fire',
    projectileType: 'fire_orb',
    flavorMessage: 'condenses an apocalyptic golden singularity across all lanes!',
  },
};

function buildTelegraph(
  enemy: CombatEntity,
  action: EnemyAction,
  playerLane: Lane,
  preferredTargetLane?: Lane
): EnemyIntent['telegraph'] {
  const pattern = action.attackPattern || 'single_lane';
  let targetLanes: Lane[] = [preferredTargetLane || playerLane];

  if (pattern === 'all_lanes') {
    targetLanes = [...LANES];
  } else if (pattern === 'multi_lane') {
    const otherLanes = LANES.filter((l) => l !== playerLane);
    targetLanes = [playerLane, otherLanes[0] || 'center'];
  } else if (pattern === 'support') {
    targetLanes = [];
  }

  const laneDesc = targetLanes.length === 3
    ? 'ALL LANES'
    : targetLanes.map((l) => l.toUpperCase()).join(' & ');

  return {
    targetLanes,
    attackType: pattern,
    dangerLevel: action.dangerLevel || 'moderate',
    canDodge: action.canDodge ?? true,
    canBlock: action.canBlock ?? true,
    canInterrupt: action.canInterrupt ?? false,
    warningText:
      pattern === 'support'
        ? `${enemy.name} is preparing ${action.name}!`
        : `${enemy.name} targets ${laneDesc} with ${action.name}!`,
  };
}

/**
 * Intelligent tactical decision maker for any enemy (solo or multi-enemy, lane-aware)
 */
export function decideEnemyIntent(
  enemy: CombatEntity,
  player: CombatEntity,
  allowedSpellIds?: string[],
  predictedLane?: Lane
): EnemyIntent {
  const playerLane: Lane = player.lane ?? 'center';
  const targetLane: Lane = predictedLane ?? playerLane;
  const pool = allowedSpellIds && allowedSpellIds.length > 0
    ? allowedSpellIds
    : ['void_bolt', 'nether_ward', 'dread_hex', 'cataclysm_blast', 'leech_vitality'];

  const hasSpell = (id: string) => pool.includes(id) && ENEMY_SPELLS[id];
  const makeIntent = (spellId: string, overrideType?: EnemyIntent['type']): EnemyIntent => {
    const act = ENEMY_SPELLS[spellId] || ENEMY_SPELLS.void_bolt;
    return {
      spellId: act.spellId,
      spellName: act.name,
      type: overrideType ?? (act.type === 'drain' ? 'attack' : act.type),
      estimatedDamage: act.baseDamage > 0 ? act.baseDamage : undefined,
      description: `${enemy.name} ${act.flavorMessage}`,
      telegraph: buildTelegraph(enemy, act, playerLane, targetLane),
    };
  };

  // Stage 3 bosses are more aggressive with ultimate/all-lane spells
  const bossStage = enemy.bossStage ?? 1;
  if (bossStage >= 3 && hasSpell('cataclysm_blast') && enemy.mana >= 35 && Math.random() < 0.65) {
    return makeIntent('cataclysm_blast', 'ultimate');
  }
  if (bossStage >= 3 && hasSpell('crystalline_burst') && enemy.mana >= 30 && Math.random() < 0.65) {
    return makeIntent('crystalline_burst', 'ultimate');
  }
  if (bossStage >= 2 && hasSpell('flank_volley') && enemy.mana >= 24 && Math.random() < 0.55) {
    return makeIntent('flank_volley', 'ultimate');
  }

  // If enemy is below 40% HP and has no shield, prioritize defense or leech
  if (enemy.hp < enemy.maxHp * 0.4 && enemy.shield === 0) {
    if (hasSpell('nether_ward') && enemy.mana >= 15 && Math.random() < 0.55) {
      return makeIntent('nether_ward', 'defense');
    }
    if (hasSpell('leech_vitality') && enemy.mana >= 15) {
      return makeIntent('leech_vitality', 'attack');
    }
  }

  // If enemy has high mana and player has no shield, go for heavy/multi-lane attack
  if (hasSpell('cataclysm_blast') && enemy.mana >= 35 && player.shield === 0 && Math.random() < 0.45) {
    return makeIntent('cataclysm_blast', 'ultimate');
  }

  // Hex if player doesn't have weaken
  const playerWeakened = player.statusEffects.some((s) => s.type === 'weaken');
  if (hasSpell('dread_hex') && !playerWeakened && enemy.mana >= 18 && Math.random() < 0.35) {
    return makeIntent('dread_hex', 'hex');
  }

  // Pick first affordable offensive spell in pool
  for (const id of pool) {
    const act = ENEMY_SPELLS[id];
    if (act && act.type === 'attack' && enemy.mana >= act.manaCost) {
      return makeIntent(id, 'attack');
    }
  }

  // Fallback
  return makeIntent(pool[0] || 'void_bolt', 'attack');
}
