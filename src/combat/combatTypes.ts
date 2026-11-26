export type CombatTurnPhase = 
  | 'player_turn' 
  | 'player_casting' 
  | 'enemy_turn' 
  | 'enemy_casting' 
  | 'turn_end' 
  | 'victory' 
  | 'defeat';

export interface CombatStatusEffect {
  id: string;
  type: 'poison' | 'weaken' | 'burn' | 'strengthen';
  name: string;
  turnsRemaining: number;
  value: number; // e.g. tick damage or multiplier
}

export interface CombatEntity {
  id: 'player' | 'enemy';
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  shield: number;
  spellPower: number;
  critRate: number;
  statusEffects: CombatStatusEffect[];
}

export interface EnemyIntent {
  spellId: string;
  spellName: string;
  type: 'attack' | 'defense' | 'hex' | 'ultimate';
  estimatedDamage?: number;
  description: string;
}

export interface CombatLogEntry {
  id: string;
  text: string;
  type: 'player' | 'enemy' | 'system' | 'critical';
  timestamp: string;
}
