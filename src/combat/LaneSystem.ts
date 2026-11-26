import { Lane } from './combatTypes';

export const LANES: Lane[] = ['left', 'center', 'right'];

export interface LaneCoordinates {
  playerX: number;
  playerY: number;
  enemyX: number;
  enemyY: number;
}

/**
 * Maps each of the 3 tactical lanes onto the 960x540 virtual arena.
 * Player occupies the left side; enemies occupy the right side.
 * Lanes are arranged vertically-in-depth (top/left-flank, center, bottom/right-flank)
 * so all characters remain readable in side-view pixel art.
 */
export const LANE_COORDS: Record<Lane, LaneCoordinates> = {
  left: {
    playerX: 215,
    playerY: 325,
    enemyX: 745,
    enemyY: 325,
  },
  center: {
    playerX: 260,
    playerY: 372,
    enemyX: 700,
    enemyY: 372,
  },
  right: {
    playerX: 215,
    playerY: 420,
    enemyX: 745,
    enemyY: 420,
  },
};

export function getLaneIndex(lane: Lane): number {
  return LANES.indexOf(lane);
}

export function getLaneDistance(a: Lane, b: Lane): number {
  return Math.abs(getLaneIndex(a) - getLaneIndex(b));
}

export function getAdjacentLanes(lane: Lane): Lane[] {
  const idx = getLaneIndex(lane);
  const result: Lane[] = [lane];
  if (idx > 0) result.push(LANES[idx - 1]);
  if (idx < LANES.length - 1) result.push(LANES[idx + 1]);
  return result;
}

export function getNextLane(current: Lane, direction: 'left' | 'right'): Lane {
  const idx = getLaneIndex(current);
  if (direction === 'left') {
    return LANES[Math.max(0, idx - 1)];
  }
  return LANES[Math.min(LANES.length - 1, idx + 1)];
}

export function getLaneLabel(lane: Lane): string {
  switch (lane) {
    case 'left': return 'LEFT LANE';
    case 'center': return 'CENTER LANE';
    case 'right': return 'RIGHT LANE';
  }
}
