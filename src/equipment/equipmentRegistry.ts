export interface EquipmentItem {
  id: string;
  name: string;
  slot: 'weapon' | 'robe' | 'ring' | 'grimoire';
  description: string;
  bonusHp: number;
  bonusMana: number;
  bonusSpellPower: number;
  bonusCritRate: number;
  pettyFlavor: string;
  // Phase 9 trade-off bonuses
  chargeCostReduction?: number;
  dodgeEfficiencyBonus?: number;
  postureDamageMultiplier?: number;
  healingBonusMultiplier?: number;
  extraSpellSlots?: number;
}

export const INITIAL_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'staff_of_spite',
    name: 'Crooked Staff of Spite',
    slot: 'weapon',
    description: 'A gnarly branch plucked from an irritated elder ent. (+20% Posture DMG)',
    bonusHp: 0,
    bonusMana: 20,
    bonusSpellPower: 12,
    bonusCritRate: 0.1,
    postureDamageMultiplier: 1.2,
    pettyFlavor: 'Slightly unbalanced, but very good for pointing indignantly.',
  },
  {
    id: 'robe_of_grudges',
    name: 'Robe of Embroidered Grudges',
    slot: 'robe',
    description: 'Every hem is stitched with names of wizards who failed to say thank you. (+8% Dodge)',
    bonusHp: 35,
    bonusMana: 15,
    bonusSpellPower: 6,
    bonusCritRate: 0.05,
    dodgeEfficiencyBonus: 0.08,
    pettyFlavor: 'Dry clean only. Stains easily with spilled potions.',
  },
  {
    id: 'ring_of_condescension',
    name: 'Ring of Pure Condescension',
    slot: 'ring',
    description: 'Emits a faint sneering aura that accelerates charged casting (-3 Charge MP).',
    bonusHp: 10,
    bonusMana: 25,
    bonusSpellPower: 8,
    bonusCritRate: 0.15,
    chargeCostReduction: 3,
    pettyFlavor: 'Warm to the touch, cold to everyone else.',
  },
  {
    id: 'grimoire_of_footnotes',
    name: 'Grimoire of Petty Footnotes',
    slot: 'grimoire',
    description: 'Crammed with margin notes that grant +1 Prepared Spell Slot & +15% Healing.',
    bonusHp: 0,
    bonusMana: 15,
    bonusSpellPower: 4,
    bonusCritRate: 0,
    extraSpellSlots: 1,
    healingBonusMultiplier: 1.15,
    pettyFlavor: 'Includes an entire appendix dedicated to Malakor’s grammatical errors.',
  },
];

export const ALTERNATE_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'catalyst_of_hubris',
    name: 'Catalyst of Unchecked Hubris',
    slot: 'weapon',
    description: 'Massive Spell Power (+20) and Charge discount (-5 MP), at the cost of -25 Max HP.',
    bonusHp: -25,
    bonusMana: 30,
    bonusSpellPower: 20,
    bonusCritRate: 0.15,
    chargeCostReduction: 5,
    pettyFlavor: 'Glass cannons are still cannons.',
  },
  {
    id: 'slippers_of_haste',
    name: 'Velvet Slippers of Haste',
    slot: 'robe',
    description: 'High mobility (+18% Dodge efficiency) with lighter defensive padding.',
    bonusHp: 15,
    bonusMana: 20,
    bonusSpellPower: 4,
    bonusCritRate: 0.08,
    dodgeEfficiencyBonus: 0.18,
    pettyFlavor: 'Squeak softly when executing a tactical retreat.',
  },
];
