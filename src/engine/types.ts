// Core engine types and configuration constants

export const VIRTUAL_WIDTH = 960;
export const VIRTUAL_HEIGHT = 540;
export const ASPECT_RATIO = VIRTUAL_WIDTH / VIRTUAL_HEIGHT;

export type GameScene = 'main_menu' | 'battle' | 'victory' | 'defeat';

export interface Vector2D {
  x: number;
  y: number;
}

export interface CameraShakeState {
  intensity: number;
  duration: number;
  elapsed: number;
}

export type DamageType = 
  | 'arcane' 
  | 'fire' 
  | 'ice' 
  | 'lightning' 
  | 'poison' 
  | 'void' 
  | 'physical' 
  | 'emotional';

export interface DamageEventPayload {
  targetId: 'player' | 'enemy';
  amount: number;
  type: DamageType;
  isCritical: boolean;
  isShielded?: boolean;
}

export interface HealEventPayload {
  targetId: 'player' | 'enemy';
  amount: number;
}

export interface ProjectileEventPayload {
  id: string;
  type: 'arcane_bolt' | 'fire_orb' | 'void_skull' | 'spark' | 'hex_beam' | 'ice_shard';
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: number;
  onHit?: () => void;
}

export interface FloatingCombatTextPayload {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size?: number;
}

export interface ScreenShakePayload {
  intensity: number;
  durationMs: number;
}
