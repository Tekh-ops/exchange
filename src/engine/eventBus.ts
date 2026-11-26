import { 
  DamageEventPayload, 
  HealEventPayload, 
  ProjectileEventPayload, 
  FloatingCombatTextPayload, 
  ScreenShakePayload 
} from './types';

// Strongly typed event map
export type GameEventMap = {
  'DAMAGE_DEALT': DamageEventPayload;
  'HEAL_APPLIED': HealEventPayload;
  'PROJECTILE_FIRED': ProjectileEventPayload;
  'SPAWN_COMBAT_TEXT': FloatingCombatTextPayload;
  'SCREEN_SHAKE': ScreenShakePayload;
  'ENTITY_ANIMATION': { entityId: string; state: 'idle' | 'cast' | 'hurt' | 'victory' | 'defeat' };
  'ENEMY_EMOTION_CHANGED': { entityId?: string; emotion: 'neutral' | 'amused' | 'confident' | 'surprised' | 'frustrated' | 'angry' | 'desperate' | 'fearful' | 'triumphant' | 'defeated'; reason: string };
  'SPELL_CAST_EFFECT': {
    spellId: string;
    source: 'player' | 'enemy';
    target: 'player' | 'enemy';
    element?: 'fire' | 'ice' | 'lightning' | 'arcane' | 'poison' | 'defense' | 'heal';
    isCharged?: boolean;
    startX?: number;
    startY?: number;
    targetX?: number;
    targetY?: number;
    affectedLanes?: ('left' | 'center' | 'right')[];
    bossStage?: number;
    bossId?: string;
  };
  'LIFESTEAL_STREAM': {
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    amount: number;
  };
  'TRIGGER_SOUND': { sound: string; pitchModifier?: number; volumeModifier?: number };
  'BATTLE_LOG': { message: string; type: 'player' | 'enemy' | 'system' | 'critical' };
};

type AnyCallback = (data: any) => void;

class TypedEventBus {
  private listeners: Map<keyof GameEventMap, Set<AnyCallback>> = new Map();

  public on<K extends keyof GameEventMap>(event: K, callback: (data: GameEventMap[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(callback as AnyCallback);

    return () => {
      this.off(event, callback);
    };
  }

  public off<K extends keyof GameEventMap>(event: K, callback: (data: GameEventMap[K]) => void): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback as AnyCallback);
    }
  }

  public emit<K extends keyof GameEventMap>(event: K, data: GameEventMap[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in event listener for ${String(event)}:`, err);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

// Global singleton event bus
export const gameEvents = new TypedEventBus();
