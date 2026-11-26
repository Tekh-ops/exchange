import { describe, it, expect } from 'vitest';
import { EncounterManager } from '../encounters/EncounterManager';

describe('EncounterManager', () => {
  it('creates multi-enemy instances with independent AI memory', () => {
    const encounter = EncounterManager.getEncounter('masters_disciples');
    const instances = EncounterManager.createEnemyInstances(encounter);

    expect(instances).toHaveLength(3);
    instances[0].memory.recordOffensiveAction('petty_spark', 'arcane', 1);

    expect(instances[0].memory.getHistory()).toHaveLength(1);
    expect(instances[1].memory.getHistory()).toHaveLength(0);
    expect(instances[2].memory.getHistory()).toHaveLength(0);
  });

  it('assigns distinct lanes and roles per template', () => {
    const encounter = EncounterManager.getEncounter('masters_disciples');
    const instances = EncounterManager.createEnemyInstances(encounter);

    expect(instances.map((i) => i.entity.lane)).toEqual(['left', 'center', 'right']);
    expect(instances.map((i) => i.entity.role)).toEqual(['striker', 'defender', 'support']);
  });
});
