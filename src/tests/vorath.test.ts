import { describe, it, expect, beforeEach } from 'vitest';
import { EncounterManager } from '../encounters/EncounterManager';
import { BossPhaseManager } from '../encounters/BossPhaseManager';
import { BossPersistenceManager } from '../ai/BossPersistence';
import { usePlayerStore } from '../stores/playerStore';

describe('Vorath — Legendary Boss', () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
    BossPersistenceManager.clearAll();
  });

  it('initializes Vorath with 25,000 HP and high base resistances', () => {
    const enc = EncounterManager.getEncounter('vorath_legendary');
    expect(enc.isLegendaryBoss).toBe(true);
    const instances = EncounterManager.createEnemyInstances(enc);
    expect(instances).toHaveLength(1);
    const vorath = instances[0];
    expect(vorath.entity.hp).toBe(25000);
    expect(vorath.entity.maxHp).toBe(25000);
    expect(vorath.elementResistances.arcane).toBeGreaterThanOrEqual(0.2);
  });

  it('transitions through Phases 1 -> 2 (70%) -> 3 (35%) with summons', () => {
    const enc = EncounterManager.getEncounter('vorath_legendary');
    const vorath = EncounterManager.createEnemyInstances(enc)[0].entity;

    const p2Entity = { ...vorath, hp: Math.floor(vorath.maxHp * 0.68) };
    const p2Res = BossPhaseManager.evaluateStageTransition(p2Entity);
    expect(p2Res.transitioned).toBe(true);
    expect(p2Res.newStage).toBe(2);
    expect(p2Res.config?.summonTemplateId).toBe('void_wisp');

    const p3Entity = { ...p2Res.updatedEntity, hp: Math.floor(vorath.maxHp * 0.3) };
    const p3Res = BossPhaseManager.evaluateStageTransition(p3Entity);
    expect(p3Res.transitioned).toBe(true);
    expect(p3Res.newStage).toBe(3);
    expect(p3Res.config?.summonTemplateId).toBe('eternal_construct');
    expect(BossPhaseManager.getAllowedSpellsForStage('vorath', 3)).toContain(
      'apocalypse_singularity'
    );
  });

  it('awards first-victory spell & equipment only once across replays', () => {
    const first = usePlayerStore.getState().claimEncounterRewards({
      battleId: 'vorath-win-1',
      encounterId: 'vorath_legendary',
      outcome: 'victory',
      xpEarned: 1650,
      goldEarned: 700,
      bossId: 'vorath',
    });
    expect(first.isFirstBossVictory).toBe(true);
    expect(first.unlockedBossSpells).toContain('eternal_annihilation');
    expect(first.unlockedBossItems).toContain('crown_of_eternity');

    const replay = usePlayerStore.getState().claimEncounterRewards({
      battleId: 'vorath-win-2',
      encounterId: 'vorath_legendary',
      outcome: 'victory',
      xpEarned: 450,
      goldEarned: 200,
      bossId: 'vorath',
    });
    expect(replay.isFirstBossVictory).toBe(false);
    expect(replay.unlockedBossSpells).toHaveLength(0);
    expect(replay.unlockedBossItems).toHaveLength(0);
  });
});
