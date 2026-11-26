import { EnemyRole, Lane } from '../combat/combatTypes';
import { OffensiveElement } from '../spells/types';

export interface EnemyTemplate {
  id: string;
  name: string;
  title: string;
  maxHp: number;
  maxMana: number;
  spellPower: number;
  critRate: number;
  maxPosture: number;
  lane: Lane;
  role: EnemyRole;
  isBoss: boolean;
  bossId?: string;
  specialtyElement?: OffensiveElement;
  baseResistanceProfile?: Partial<Record<OffensiveElement, number>>;
  resistanceGrowthRate?: number;
  maxResistanceCap?: number;
  spellIds: string[];
  spriteTint?: number;
}

export interface EncounterDefinition {
  id: string;
  name: string;
  subtitle: string;
  difficulty: 'duel' | 'skirmish' | 'hard' | 'boss' | 'legendary';
  description: string;
  recommendedLevel?: number;
  minLevel?: number;
  isLegendaryBoss?: boolean;
  warningText?: string;
  enemies: EnemyTemplate[];
  rewards: {
    xp: number;
    gold: number;
  };
  firstVictoryRewards?: {
    xp: number;
    gold: number;
    spellId?: string;
    equipmentId?: string;
  };
}

export const ENEMY_TEMPLATES: Record<string, EnemyTemplate> = {
  malakor: {
    id: 'malakor',
    name: 'Arch-Mage Malakor',
    title: 'The Pretentious Nethermancer',
    maxHp: 520,
    maxMana: 160,
    spellPower: 16,
    critRate: 0.12,
    maxPosture: 85,
    lane: 'center',
    role: 'boss',
    isBoss: true,
    bossId: 'malakor',
    resistanceGrowthRate: 1.0,
    maxResistanceCap: 0.45,
    spellIds: ['void_bolt', 'nether_ward', 'dread_hex', 'cataclysm_blast', 'leech_vitality'],
  },
  crystal_archon: {
    id: 'crystal_archon',
    name: 'Vaelith the Prismatic',
    title: 'Crystalline Refrangent',
    maxHp: 640,
    maxMana: 180,
    spellPower: 16,
    critRate: 0.10,
    maxPosture: 100,
    lane: 'center',
    role: 'boss',
    isBoss: true,
    bossId: 'crystal_archon',
    baseResistanceProfile: { arcane: 0.15, fire: 0.1 },
    resistanceGrowthRate: 1.25,
    maxResistanceCap: 0.45,
    spellIds: ['prism_lance', 'nether_ward', 'crystalline_burst', 'lane_beam'],
    spriteTint: 0x38bdf8,
  },
  shadow_conjurer: {
    id: 'shadow_conjurer',
    name: 'Umbrax the Slippery',
    title: 'Master of Lane Trickery',
    maxHp: 560,
    maxMana: 180,
    spellPower: 17,
    critRate: 0.18,
    maxPosture: 80,
    lane: 'left',
    role: 'boss',
    isBoss: true,
    bossId: 'shadow_conjurer',
    baseResistanceProfile: { poison: 0.15 },
    resistanceGrowthRate: 1.1,
    maxResistanceCap: 0.45,
    spellIds: ['shadow_ambush', 'dread_hex', 'flank_volley', 'leech_vitality'],
    spriteTint: 0x9333ea,
  },
  fire_apprentice: {
    id: 'fire_apprentice',
    name: 'Ignis Initiate',
    title: 'Hot-Headed Apprentice',
    maxHp: 85,
    maxMana: 70,
    spellPower: 12,
    critRate: 0.1,
    maxPosture: 35,
    lane: 'left',
    role: 'striker',
    isBoss: false,
    specialtyElement: 'fire',
    baseResistanceProfile: { fire: 0.15 },
    spellIds: ['ember_bolt', 'cataclysm_blast'],
    spriteTint: 0xf87171,
  },
  ice_apprentice: {
    id: 'ice_apprentice',
    name: 'Glacies Initiate',
    title: 'Frosty Academic',
    maxHp: 90,
    maxMana: 75,
    spellPower: 11,
    critRate: 0.08,
    maxPosture: 40,
    lane: 'right',
    role: 'striker',
    isBoss: false,
    specialtyElement: 'ice',
    baseResistanceProfile: { ice: 0.15 },
    spellIds: ['frost_lance', 'nether_ward'],
    spriteTint: 0x60a5fa,
  },
  shield_disciple: {
    id: 'shield_disciple',
    name: 'Bastion Disciple',
    title: 'Aegis Ward-Keeper',
    maxHp: 105,
    maxMana: 60,
    spellPower: 10,
    critRate: 0.05,
    maxPosture: 55,
    lane: 'center',
    role: 'defender',
    isBoss: false,
    spellIds: ['ally_ward', 'void_bolt'],
    spriteTint: 0x34d399,
  },
  support_acolyte: {
    id: 'support_acolyte',
    name: 'Mending Acolyte',
    title: 'Syphon Chorister',
    maxHp: 75,
    maxMana: 90,
    spellPower: 10,
    critRate: 0.05,
    maxPosture: 30,
    lane: 'right',
    role: 'support',
    isBoss: false,
    spellIds: ['ally_mend', 'dread_hex'],
    spriteTint: 0xfacc15,
  },
  void_wisp: {
    id: 'void_wisp',
    name: 'Petty Wisp',
    title: 'Conjured Nuisance',
    maxHp: 55,
    maxMana: 50,
    spellPower: 9,
    critRate: 0.1,
    maxPosture: 25,
    lane: 'left',
    role: 'striker',
    isBoss: false,
    spellIds: ['void_bolt'],
    spriteTint: 0xc084fc,
  },
  eternal_construct: {
    id: 'eternal_construct',
    name: 'Eternal Construct',
    title: 'Arcane Bastion',
    maxHp: 850,
    maxMana: 140,
    spellPower: 15,
    critRate: 0.08,
    maxPosture: 80,
    lane: 'right',
    role: 'support',
    isBoss: false,
    spellIds: ['ally_ward', 'ally_mend', 'void_bolt'],
    spriteTint: 0xfacc15,
  },
  vorath: {
    id: 'vorath',
    name: 'Vorath',
    title: 'The Eternal Arcanist',
    maxHp: 25000,
    maxMana: 500,
    spellPower: 22,
    critRate: 0.14,
    maxPosture: 180,
    lane: 'center',
    role: 'boss',
    isBoss: true,
    bossId: 'vorath',
    baseResistanceProfile: {
      fire: 0.2,
      ice: 0.2,
      lightning: 0.2,
      arcane: 0.25,
      poison: 0.15,
    },
    resistanceGrowthRate: 1.3,
    maxResistanceCap: 0.45,
    spellIds: [
      'eternal_bolt',
      'arcane_ward_vorath',
      'abyssal_lance',
      'chronal_snare',
      'apocalypse_singularity',
    ],
    spriteTint: 0xd4af37,
  },
};

export const ENCOUNTERS: Record<string, EncounterDefinition> = {
  solo_malakor: {
    id: 'solo_malakor',
    name: 'Malakor the Petty',
    subtitle: 'Classic 1v1 Arch-Mage Duel',
    difficulty: 'duel',
    description: 'Face Arch-Mage Malakor in a traditional three-stage adaptive wizard duel.',
    enemies: [ENEMY_TEMPLATES.malakor],
    rewards: { xp: 60, gold: 35 },
  },
  twin_apprentices: {
    id: 'twin_apprentices',
    name: 'The Twin Apprentices',
    subtitle: '2-Enemy Elemental Skirmish',
    difficulty: 'skirmish',
    description: 'Two rival initiates specializing in Fire and Ice coordinate cross-lane attacks.',
    enemies: [ENEMY_TEMPLATES.fire_apprentice, ENEMY_TEMPLATES.ice_apprentice],
    rewards: { xp: 85, gold: 50 },
  },
  masters_disciples: {
    id: 'masters_disciples',
    name: "The Master's Disciples",
    subtitle: '3-Enemy Tactical Formation',
    difficulty: 'hard',
    description: 'A defender, a fire striker, and a mending acolyte covering all three lanes.',
    enemies: [
      { ...ENEMY_TEMPLATES.fire_apprentice, lane: 'left' },
      { ...ENEMY_TEMPLATES.shield_disciple, lane: 'center' },
      { ...ENEMY_TEMPLATES.support_acolyte, lane: 'right' },
    ],
    rewards: { xp: 120, gold: 75 },
  },
  malakors_court: {
    id: 'malakors_court',
    name: "Malakor's Court",
    subtitle: 'Boss + Support Escorts',
    difficulty: 'boss',
    description: 'Malakor enters the Obsidian Spire flanked by a Petty Wisp and Mending Acolyte.',
    enemies: [
      { ...ENEMY_TEMPLATES.void_wisp, lane: 'left' },
      { ...ENEMY_TEMPLATES.malakor, lane: 'center' },
      { ...ENEMY_TEMPLATES.support_acolyte, lane: 'right' },
    ],
    rewards: { xp: 150, gold: 100 },
  },
  crystal_archon_boss: {
    id: 'crystal_archon_boss',
    name: 'Vaelith the Prismatic',
    subtitle: 'Crystalline Staged Boss',
    difficulty: 'boss',
    description: 'A refrangent archon who rapidly adapts elemental resistances and fires lane beams.',
    enemies: [ENEMY_TEMPLATES.crystal_archon],
    rewards: { xp: 110, gold: 70 },
  },
  shadow_conjurer_boss: {
    id: 'shadow_conjurer_boss',
    name: 'Umbrax the Slippery',
    subtitle: 'Shadow Staged Boss',
    difficulty: 'boss',
    recommendedLevel: 3,
    description: 'A deceptive shadow sorcerer who shifts lanes and punishes predictable dodging.',
    enemies: [ENEMY_TEMPLATES.shadow_conjurer],
    rewards: { xp: 115, gold: 75 },
  },
  vorath_legendary: {
    id: 'vorath_legendary',
    name: 'Vorath — The Eternal Arcanist',
    subtitle: 'Legendary 3-Phase Boss (25,000 HP)',
    difficulty: 'legendary',
    recommendedLevel: 5,
    minLevel: 3,
    isLegendaryBoss: true,
    warningText: 'LONG LEGENDARY ENCOUNTER (25,000 HP • 3 PHASES). Vorath adapts rapidly, summons constructs, and unleashes multi-lane singularities.',
    description: 'An immortal arcanist of ancient gold and violet fire. Demands mastery of synergies, posture breaks, and evasion.',
    enemies: [ENEMY_TEMPLATES.vorath],
    rewards: { xp: 450, gold: 200 },
    firstVictoryRewards: {
      xp: 1200,
      gold: 500,
      spellId: 'eternal_annihilation',
      equipmentId: 'crown_of_eternity',
    },
  },
};
