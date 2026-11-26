export type CombatTurnPhase = 
  | 'player_turn' 
  | 'player_casting' 
  | 'enemy_turn' 
  | 'enemy_casting' 
  | 'turn_end' 
  | 'victory' 
  | 'defeat';

export type Lane = 'left' | 'center' | 'right';
export type EnemyRole = 'boss' | 'striker' | 'defender' | 'support';

export interface CombatStatusEffect {
  id: string;
  type: 'poison' | 'weaken' | 'burn' | 'strengthen' | 'frost' | 'staggered';
  name: string;
  turnsRemaining: number;
  value: number; // e.g. tick damage or multiplier
}

export interface CombatEntity {
  id: string;
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
  // Phase 9 extensions
  lane?: Lane;
  stamina?: number;
  maxStamina?: number;
  posture?: number;
  maxPosture?: number;
  isStaggered?: boolean;
  role?: EnemyRole;
  isBoss?: boolean;
  bossId?: string;
  bossStage?: number;
}

export interface AttackTelegraph {
  targetLanes: Lane[];
  attackType: 'single_lane' | 'multi_lane' | 'all_lanes' | 'homing' | 'support';
  dangerLevel: 'low' | 'moderate' | 'high' | 'extreme';
  canDodge: boolean;
  canBlock: boolean;
  canInterrupt: boolean;
  warningText: string;
}

export interface EnemyIntent {
  spellId: string;
  spellName: string;
  type: 'attack' | 'defense' | 'hex' | 'ultimate' | 'support';
  estimatedDamage?: number;
  description: string;
  telegraph?: AttackTelegraph;
  targetEnemyId?: string; // for support buffs/shields
}

export interface CombatLogEntry {
  id: string;
  text: string;
  type: 'player' | 'enemy' | 'system' | 'critical';
  timestamp: string;
}
