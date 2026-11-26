import { CombatEntity, Lane } from './combatTypes';
import { Spell, SpellTargetRule } from '../spells/types';
import { getAdjacentLanes, getLaneDistance } from './LaneSystem';

export interface TargetResolution {
  valid: boolean;
  targets: CombatEntity[];
  reason?: string;
}

/**
 * Resolves which living enemies are hit by a spell given its targeting rule,
 * player lane, and selected target enemy ID.
 */
export function resolveSpellTargets(
  spell: Spell,
  playerLane: Lane,
  enemies: CombatEntity[],
  selectedTargetId: string | null,
  overrideRule?: SpellTargetRule
): TargetResolution {
  const living = enemies.filter((e) => e.hp > 0);
  if (living.length === 0) {
    return { valid: false, targets: [], reason: 'No living enemies remain.' };
  }

  const rule: SpellTargetRule = overrideRule ?? spell.targetRule ?? 'single';

  if (rule === 'self' || !spell.isOffensive) {
    return { valid: true, targets: [] };
  }

  if (rule === 'all_enemies') {
    return { valid: true, targets: living };
  }

  if (rule === 'lane') {
    const inLane = living.filter((e) => (e.lane ?? 'center') === playerLane);
    if (inLane.length === 0) {
      return {
        valid: false,
        targets: [],
        reason: `No enemies in ${playerLane.toUpperCase()} lane! Move lanes or choose another spell.`,
      };
    }
    return { valid: true, targets: inLane };
  }

  if (rule === 'adjacent_lanes') {
    const adj = getAdjacentLanes(playerLane);
    const inAdj = living.filter((e) => adj.includes(e.lane ?? 'center'));
    if (inAdj.length === 0) {
      return {
        valid: false,
        targets: [],
        reason: `No enemies within adjacent lanes of ${playerLane.toUpperCase()}.`,
      };
    }
    return { valid: true, targets: inAdj };
  }

  // Single target
  const target = living.find((e) => e.id === selectedTargetId) ?? living[0];
  if (!target) {
    return { valid: false, targets: [], reason: 'Select a valid living target.' };
  }

  // Optional lane restriction check for melee/close-range spells if ever needed
  const dist = getLaneDistance(playerLane, target.lane ?? 'center');
  if (dist > 2) {
    return { valid: false, targets: [], reason: 'Target is out of range.' };
  }

  return { valid: true, targets: [target] };
}
