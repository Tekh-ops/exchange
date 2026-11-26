import { describe, it, expect } from 'vitest';
import { getAdjacentLanes, getLaneDistance, getNextLane, LANE_COORDS } from '../combat/LaneSystem';

describe('LaneSystem', () => {
  it('computes lane distances and adjacencies correctly', () => {
    expect(getLaneDistance('left', 'right')).toBe(2);
    expect(getLaneDistance('left', 'center')).toBe(1);
    expect(getAdjacentLanes('left')).toEqual(['left', 'center']);
    expect(getAdjacentLanes('center')).toEqual(['center', 'left', 'right']);
  });

  it('clamps lane movement at arena boundaries', () => {
    expect(getNextLane('center', 'left')).toBe('left');
    expect(getNextLane('left', 'left')).toBe('left');
    expect(getNextLane('center', 'right')).toBe('right');
    expect(getNextLane('right', 'right')).toBe('right');
  });

  it('provides virtual arena coordinates for all 3 lanes', () => {
    expect(LANE_COORDS.left.playerX).toBeLessThan(LANE_COORDS.left.enemyX);
    expect(LANE_COORDS.center.playerX).toBeLessThan(LANE_COORDS.center.enemyX);
    expect(LANE_COORDS.right.playerX).toBeLessThan(LANE_COORDS.right.enemyX);
  });
});
