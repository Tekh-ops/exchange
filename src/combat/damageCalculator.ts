import { CombatEntity, CombatStatusEffect } from './combatTypes';

export interface CalculatedDamage {
  rawDamage: number;
  resistedAmount: number;
  finalDamage: number;
  absorbedByShield: number;
  remainingShield: number;
  isCritical: boolean;
  resistancePercent: number;
}

export function calculateSpellDamage(
  attacker: CombatEntity,
  defender: CombatEntity,
  baseValue: number,
  elementalResistance: number = 0,
  extraDeflection: number = 0
): CalculatedDamage {
  // Check for weaken or strengthen status effects
  let modifier = 1.0;
  attacker.statusEffects.forEach(st => {
    if (st.type === 'strengthen') modifier += 0.25;
    if (st.type === 'weaken') modifier -= 0.25;
  });

  // Calculate critical roll
  const isCritical = Math.random() < attacker.critRate;
  const critMultiplier = isCritical ? 1.5 : 1.0;

  // Raw calculated damage
  const rawDamage = Math.round((baseValue + attacker.spellPower * 0.8) * modifier * critMultiplier);

  // Apply elemental resistance and anti-repetition deflection (capped at 60% max reduction)
  const totalResistanceFactor = Math.min(0.60, Math.max(0, elementalResistance + extraDeflection));
  const resistedAmount = Math.round(rawDamage * totalResistanceFactor);
  const damageAfterResistance = Math.max(1, rawDamage - resistedAmount);

  // Apply to defender shield
  let remainingShield = defender.shield;
  let absorbedByShield = 0;
  let finalDamage = damageAfterResistance;

  if (remainingShield > 0) {
    if (remainingShield >= damageAfterResistance) {
      absorbedByShield = damageAfterResistance;
      remainingShield -= damageAfterResistance;
      finalDamage = 0;
    } else {
      absorbedByShield = remainingShield;
      finalDamage = damageAfterResistance - remainingShield;
      remainingShield = 0;
    }
  }

  return {
    rawDamage,
    resistedAmount,
    finalDamage,
    absorbedByShield,
    remainingShield,
    isCritical,
    resistancePercent: Math.round(totalResistanceFactor * 100),
  };
}

export function processStatusEffects(entity: CombatEntity): {
  updatedEntity: CombatEntity;
  tickDamage: number;
  expiredEffects: string[];
} {
  let tickDamage = 0;
  const expiredEffects: string[] = [];
  const updatedEffects: CombatStatusEffect[] = [];

  entity.statusEffects.forEach(st => {
    if (st.type === 'poison' || st.type === 'burn') {
      tickDamage += st.value;
    }

    const turnsRemaining = st.turnsRemaining - 1;
    if (turnsRemaining > 0) {
      updatedEffects.push({ ...st, turnsRemaining });
    } else {
      expiredEffects.push(st.name);
    }
  });

  const remainingHp = Math.max(0, entity.hp - tickDamage);

  return {
    updatedEntity: {
      ...entity,
      hp: remainingHp,
      statusEffects: updatedEffects,
    },
    tickDamage,
    expiredEffects,
  };
}
