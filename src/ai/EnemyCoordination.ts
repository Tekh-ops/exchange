import { CombatEntity, EnemyIntent, Lane } from '../combat/combatTypes';
import { ENEMY_SPELLS, decideEnemyIntent } from '../ai/enemyAi';
import { BossPhaseManager } from '../encounters/BossPhaseManager';

/**
 * Coordinates intents across multiple living enemies so support/defenders
 * protect or heal injured allies and strikers avoid redundant overlap.
 */
export class EnemyCoordination {
  public static decideCoordinatedIntent(
    actingEnemy: CombatEntity,
    allLivingEnemies: CombatEntity[],
    player: CombatEntity,
    predictedLane?: Lane
  ): EnemyIntent {
    const role = actingEnemy.role ?? 'striker';

    // Support enemy: prioritize healing lowest-HP injured ally
    if (role === 'support' && allLivingEnemies.length > 1) {
      const injured = [...allLivingEnemies]
        .filter((e) => e.hp > 0 && e.hp < e.maxHp * 0.7)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];

      if (injured && actingEnemy.mana >= 16) {
        const mend = ENEMY_SPELLS.ally_mend;
        return {
          spellId: mend.spellId,
          spellName: mend.name,
          type: 'support',
          targetEnemyId: injured.id,
          description: `${actingEnemy.name} prepares to mend ${injured.name}!`,
          telegraph: {
            targetLanes: [],
            attackType: 'support',
            dangerLevel: 'low',
            canDodge: false,
            canBlock: false,
            canInterrupt: true,
            warningText: `${actingEnemy.name} is channeling Acolyte Mend for ${injured.name}!`,
          },
        };
      }
    }

    // Defender enemy: shield lowest-HP unshielded ally
    if (role === 'defender' && allLivingEnemies.length > 1) {
      const unshielded = [...allLivingEnemies]
        .filter((e) => e.hp > 0 && e.shield === 0)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];

      if (unshielded && actingEnemy.mana >= 14 && Math.random() < 0.6) {
        const ward = ENEMY_SPELLS.ally_ward;
        return {
          spellId: ward.spellId,
          spellName: ward.name,
          type: 'support',
          targetEnemyId: unshielded.id,
          description: `${actingEnemy.name} weaves a Bastion Ward onto ${unshielded.name}!`,
          telegraph: {
            targetLanes: [],
            attackType: 'support',
            dangerLevel: 'low',
            canDodge: false,
            canBlock: false,
            canInterrupt: true,
            warningText: `${actingEnemy.name} is shielding ${unshielded.name}!`,
          },
        };
      }
    }

    const allowedBossSpells = actingEnemy.isBoss
      ? BossPhaseManager.getAllowedSpellsForStage(actingEnemy.bossId, actingEnemy.bossStage ?? 1)
      : undefined;

    return decideEnemyIntent(actingEnemy, player, allowedBossSpells, predictedLane);
  }
}
