export type OffensiveElement = 'fire' | 'ice' | 'lightning' | 'arcane' | 'poison';
export type SpellElement = OffensiveElement | 'defense';
export type SpellTargetRule = 'single' | 'lane' | 'adjacent_lanes' | 'all_enemies' | 'self';

export const OFFENSIVE_ELEMENTS: OffensiveElement[] = [
  'fire',
  'ice',
  'lightning',
  'arcane',
  'poison',
];

export function isOffensiveElement(element: string): element is OffensiveElement {
  return OFFENSIVE_ELEMENTS.includes(element as OffensiveElement);
}

export interface SpellEffect {
  type: 'damage' | 'heal' | 'shield' | 'status' | 'mana_restore' | 'reversal_heal';
  value: number;
  durationTurns?: number;
  statusType?: 'poison' | 'weaken' | 'burn' | 'strengthen' | 'frost' | 'staggered';
}

export interface Spell {
  id: string;
  name: string;
  description: string;
  pettyComment: string;
  element: SpellElement;
  isOffensive: boolean;
  manaCost: number;
  cooldownTurns: number;
  currentCooldown: number;
  castAnimation: 'spark' | 'missile' | 'fire' | 'hex' | 'shield' | 'drain' | 'ice';
  projectileType?: 'arcane_bolt' | 'fire_orb' | 'void_skull' | 'spark' | 'hex_beam' | 'ice_shard';
  effects: SpellEffect[];
  // Phase 9 extensions (optional for backward compatibility)
  targetRule?: SpellTargetRule;
  lifestealRatio?: number;
  postureDamage?: number;
  chargeable?: boolean;
  chargeManaBonus?: number;
  chargeDamageMultiplier?: number;
  chargeTargetRule?: SpellTargetRule;
  synergyHint?: string;
}
