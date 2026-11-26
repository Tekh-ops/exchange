import { EnemyEmotion } from '../ai/EnemyEmotionSystem';

export interface BanterDialogue {
  id: string;
  speaker: 'player' | 'enemy';
  speakerName: string;
  text: string;
  emotion?: EnemyEmotion;
  portrait?: string;
}

export const PETTY_BANTER: BanterDialogue[] = [
  {
    id: 'b1',
    speaker: 'player',
    speakerName: 'The Petty Sorcerer',
    text: 'You didn’t even nod when we crossed paths at the Grand Library! Do you know who I am?!',
  },
  {
    id: 'b2',
    speaker: 'enemy',
    speakerName: 'Arch-Mage Malakor',
    text: 'I care not for the buzzing of garden gnats. Now burn in voidfire!',
    emotion: 'confident',
  },
  {
    id: 'b3',
    speaker: 'player',
    speakerName: 'The Petty Sorcerer',
    text: 'Gnats?! My thesis on Minor Kinetic Displacement was cited twice! TWICE!',
  },
  {
    id: 'b4',
    speaker: 'enemy',
    speakerName: 'Arch-Mage Malakor',
    text: 'Both citations were by yourself in subsequent pamphlets.',
    emotion: 'amused',
  },
  {
    id: 'b5',
    speaker: 'player',
    speakerName: 'The Petty Sorcerer',
    text: 'THAT STILL COUNTS ACCORDING TO ACADEMIC PROTOCOL SECTION 4B!',
  },
];

export const CONTEXTUAL_RIVAL_LINES: Record<string, string[]> = {
  repeated_spell: [
    "Again? You're becoming terribly predictable.",
    "Did your spellbook run out of pages, or just your imagination?",
    "Throwing the same spark over and over is an insult to the arcane arts.",
    "I could counter that in my sleep. Literally. I was just yawning.",
  ],
  adaptation: [
    "I've adjusted my defences. Try something else.",
    "Your elemental magic has lost its sting. My wards are impenetrable.",
    "Every repeated cast only fuels my resistance. How disappointing.",
    "Adapting to your narrow repertoire requires virtually no effort.",
  ],
  correct_prediction: [
    "I knew you'd try that again. Right into my calculation.",
    "So easily foretold! Did you think I wouldn't anticipate that?",
    "Predictable to the final syllable. My ward was ready before you breathed.",
  ],
  incorrect_prediction: [
    "Well... that was unexpected.",
    "Hmph! A lucky deviation from your routine.",
    "You strayed from your habit? Preposterous!",
  ],
  player_change_strategy: [
    "Oh? A change of tactics. Interesting.",
    "Finally, a flicker of variety! Let us see if it lasts.",
    "Switching elements won't save you from inevitable defeat.",
  ],
  enemy_substantial_damage: [
    "Insolent insect! That was my favorite sleeve!",
    "A lucky strike! It won't happen again!",
    "Do you think mere bruising can shatter my superiority?!",
  ],
  enemy_low_health: [
    "Don't mistake exhaustion for defeat!",
    "This is becoming... rather inconvenient.",
    "You think you've cornered me? The abyss answers to MY command!",
  ],
  enemy_desperation: [
    "Impossible! Bested by a minor dabbler of petty charms?!",
    "I refuse to let an unreviewed thesis author stand over me!",
  ],
  counterattack: [
    "Your repetition is your doom! Taste your own foolishness!",
    "A predictable strike invites an immediate reckoning!",
  ],
};

let lastUsedLineIndex: Record<string, number> = {};

export function getContextualLine(category: keyof typeof CONTEXTUAL_RIVAL_LINES): string {
  const lines = CONTEXTUAL_RIVAL_LINES[category] || CONTEXTUAL_RIVAL_LINES.repeated_spell;
  if (lines.length === 0) return '...';

  const lastIndex = lastUsedLineIndex[category] ?? -1;
  let nextIndex = Math.floor(Math.random() * lines.length);

  // Avoid repeating identical line consecutively if multiple choices exist
  if (lines.length > 1 && nextIndex === lastIndex) {
    nextIndex = (nextIndex + 1) % lines.length;
  }

  lastUsedLineIndex[category] = nextIndex;
  return lines[nextIndex];
}

export const VICTORY_BANTER: string[] = [
  'And let that teach you never to cut in front of me at the alchemy reagent stall!',
  'Hah! Your robes look like they were sewn by a colourblind goblin!',
  'I will be sure to leave a strongly worded review on your wizard academy registry!',
];

export const DEFEAT_BANTER: string[] = [
  'My wand was slightly calibrated incorrectly due to the humidity!',
  'A minor technicality! The floor had uneven tile mortar!',
  'I shall return once I file an official grievance with the Magistrate!',
];

export function getVorathAdaptiveBanter(memory: {
  totalEncounters: number;
  victories: number;
  defeats: number;
  grudgeLevel: number;
  favoriteElementCountered?: string;
}): string {
  if (memory.totalEncounters === 0) {
    return 'You dare step into the Astral Sanctum, mortal? Your petty sparks will be unmade before the End of Ages.';
  }
  const fav = memory.favoriteElementCountered
    ? ` I still taste your ${memory.favoriteElementCountered.toUpperCase()} incantations from our past.`
    : '';
  if (memory.defeats > 0) {
    return `You struck me down before, little sorcerer (Grudge Lv.${memory.grudgeLevel}).${fav} The Eternal Crown does not forget.`;
  }
  return `Back again after ${memory.victories} defeat${memory.victories === 1 ? '' : 's'}?${fav} Time itself bends to my wards.`;
}
