import { describe, it, expect, beforeEach } from 'vitest';
import { EnemyEmotionSystem } from '../ai/EnemyEmotionSystem';
import { EnemyMemory } from '../ai/EnemyMemory';
import { BossPersistenceManager } from '../ai/BossPersistence';
import { CombatEntity } from '../combat/combatTypes';

describe('EnemyEmotionSystem and Boss Persistence', () => {
  let emotionSystem: EnemyEmotionSystem;
  let memory: EnemyMemory;

  const mockEnemy: CombatEntity = {
    id: 'enemy',
    name: 'Arch-Mage Malakor',
    title: 'Nethermancer',
    hp: 160,
    maxHp: 160,
    mana: 100,
    maxMana: 100,
    shield: 0,
    spellPower: 16,
    critRate: 0.1,
    statusEffects: [],
  };

  const mockPlayer: CombatEntity = {
    id: 'player',
    name: 'Petty Sorcerer',
    title: 'Mage',
    hp: 120,
    maxHp: 120,
    mana: 80,
    maxMana: 80,
    shield: 0,
    spellPower: 14,
    critRate: 0.1,
    statusEffects: [],
  };

  beforeEach(() => {
    emotionSystem = new EnemyEmotionSystem();
    memory = new EnemyMemory({ windowSize: 12 });
    BossPersistenceManager.clearAll();
  });

  it('12. Emotion transitions correspond to real gameplay events', () => {
    // 1. Initial state is neutral
    expect(emotionSystem.getEmotion()).toBe('neutral');

    // 2. Repeated spell triggers amused
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 1);
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 2);
    emotionSystem.evaluateEvent({ type: 'player_repeat_spell' }, mockEnemy, mockPlayer, memory);
    expect(emotionSystem.getEmotion()).toBe('amused');

    // 3. Player changes strategy triggers surprised
    emotionSystem.evaluateEvent({ type: 'player_change_strategy' }, mockEnemy, mockPlayer, memory);
    expect(emotionSystem.getEmotion()).toBe('surprised');

    // 4. Enemy takes substantial damage triggers frustrated / angry
    emotionSystem.evaluateEvent({
      type: 'enemy_substantial_damage',
      damageTaken: 36,
      isCritical: true,
    }, mockEnemy, mockPlayer, memory);
    expect(emotionSystem.getEmotion()).toBe('angry');

    // 5. Enemy HP low triggers desperate
    const lowHpEnemy = { ...mockEnemy, hp: 45 }; // 45 / 160 = 28%
    emotionSystem.evaluateEvent({ type: 'enemy_hp_low' }, lowHpEnemy, mockPlayer, memory);
    expect(emotionSystem.getEmotion()).toBe('desperate');

    // 6. Enemy HP critical triggers fearful
    const critHpEnemy = { ...mockEnemy, hp: 20 }; // 20 / 160 = 12.5%
    emotionSystem.evaluateEvent({ type: 'enemy_hp_critical' }, critHpEnemy, mockPlayer, memory);
    expect(emotionSystem.getEmotion()).toBe('fearful');

    // 7. Enemy defeated triggers defeated
    const deadEnemy = { ...mockEnemy, hp: 0 };
    emotionSystem.evaluateEvent({ type: 'enemy_defeated' }, deadEnemy, mockPlayer, memory);
    expect(emotionSystem.getEmotion()).toBe('defeated');
  });

  it('13. Boss memory is completely independent between different rivals', () => {
    const memoryMalakor = new EnemyMemory({ bossId: 'malakor' });
    const memoryPyromancer = new EnemyMemory({ bossId: 'ignis_pyromancer' });

    // Train Malakor against fire
    for (let i = 1; i <= 6; i++) {
      memoryMalakor.recordOffensiveAction('pyro_tantrum', 'fire', i);
    }

    // Train Ignis against ice
    for (let i = 1; i <= 4; i++) {
      memoryPyromancer.recordOffensiveAction('frigid_snub', 'ice', i);
    }

    expect(memoryMalakor.getElementCount('fire')).toBe(6);
    expect(memoryMalakor.getElementCount('ice')).toBe(0);

    expect(memoryPyromancer.getElementCount('ice')).toBe(4);
    expect(memoryPyromancer.getElementCount('fire')).toBe(0);

    expect(memoryMalakor.bossId).toBe('malakor');
    expect(memoryPyromancer.bossId).toBe('ignis_pyromancer');
  });

  it('14. Persistence correctly saves and restores long-term boss memory across encounters', () => {
    // Record first encounter: Player defeated Malakor using mostly Fire
    BossPersistenceManager.recordEncounterOutcome('malakor', true, 'fire');

    let malakorRecord = BossPersistenceManager.loadBossMemory('malakor');
    expect(malakorRecord.totalEncounters).toBe(1);
    expect(malakorRecord.defeats).toBe(1);
    expect(malakorRecord.victories).toBe(0);
    expect(malakorRecord.historicalPlayerElementCounts.fire).toBe(1);
    expect(malakorRecord.grudgeLevel).toBe(2);

    // Record second encounter: Malakor won
    BossPersistenceManager.recordEncounterOutcome('malakor', false, 'lightning');

    malakorRecord = BossPersistenceManager.loadBossMemory('malakor');
    expect(malakorRecord.totalEncounters).toBe(2);
    expect(malakorRecord.victories).toBe(1);
    expect(malakorRecord.historicalPlayerElementCounts.fire).toBe(1);
    expect(malakorRecord.historicalPlayerElementCounts.lightning).toBe(1);

    // Another boss remains untouched
    const ignisRecord = BossPersistenceManager.loadBossMemory('ignis');
    expect(ignisRecord.totalEncounters).toBe(0);
  });
});
