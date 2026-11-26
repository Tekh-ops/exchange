export type OffensiveElement = 'fire' | 'ice' | 'lightning' | 'arcane' | 'poison';
export type SpellElement = OffensiveElement | 'defense';

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
  type: 'damage' | 'heal' | 'shield' | 'status' | 'mana_restore';
  value: number;
  durationTurns?: number;
  statusType?: 'poison' | 'weaken' | 'burn' | 'strengthen';
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
}
