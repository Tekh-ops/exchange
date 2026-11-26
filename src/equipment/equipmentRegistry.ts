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
}

export const INITIAL_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'staff_of_spite',
    name: 'Crooked Staff of Spite',
    slot: 'weapon',
    description: 'A gnarly branch plucked from an irritated elder ent.',
    bonusHp: 0,
    bonusMana: 20,
    bonusSpellPower: 12,
    bonusCritRate: 0.1,
    pettyFlavor: 'Slightly unbalanced, but very good for pointing indignantly.',
  },
  {
    id: 'robe_of_grudges',
    name: 'Robe of Embroidered Grudges',
    slot: 'robe',
    description: 'Every hem is stitched with names of wizards who failed to say thank you.',
    bonusHp: 35,
    bonusMana: 15,
    bonusSpellPower: 6,
    bonusCritRate: 0.05,
    pettyFlavor: 'Dry clean only. Stains easily with spilled potions.',
  },
  {
    id: 'ring_of_condescension',
    name: 'Ring of Pure Condescension',
    slot: 'ring',
    description: 'Emits a faint sneering aura that slightly unnerves opponents.',
    bonusHp: 10,
    bonusMana: 25,
    bonusSpellPower: 8,
    bonusCritRate: 0.15,
    pettyFlavor: 'Warm to the touch, cold to everyone else.',
  },
];
