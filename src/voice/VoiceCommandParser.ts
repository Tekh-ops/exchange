import { Spell, OffensiveElement } from '../spells/types';
import { CombatEntity, Lane } from '../combat/combatTypes';

export type ParsedVoiceCommand =
  | {
      kind: 'spell';
      spellId: string;
      spellName: string;
      charge: boolean;
      targetName?: string;
      confidence: number;
      rawTranscript: string;
    }
  | {
      kind: 'dodge';
      dodgeType: 'quickstep' | 'arcane_blink' | 'perfect_dodge';
      targetLane?: Lane;
      rawTranscript: string;
    }
  | {
      kind: 'move_lane';
      direction: 'left' | 'right' | 'center';
      rawTranscript: string;
    }
  | {
      kind: 'ambiguous';
      rawTranscript: string;
      options: string[];
      reason: string;
    }
  | {
      kind: 'unknown';
      rawTranscript: string;
      reason: string;
    };

export type TargetResolutionOutcome =
  | { status: 'all' }
  | { status: 'matched'; enemyId: string; enemyName: string }
  | { status: 'ambiguous'; candidates: string[] }
  | { status: 'not_found'; query: string };

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

// Common phonetic/recognition aliases for spell names
const SPELL_ALIASES: Record<string, string[]> = {
  petty_spark: ['petty spark', 'pretty spark', 'pity spark', 'petty spark spell'],
  arcane_dart: ['arcane dart', 'arcane dark', 'arcana dart', 'arcane art'],
  frigid_snub: ['frigid snub', 'rigid snub', 'fridge snub', 'cold shoulder', 'ice snub'],
  pyro_tantrum: ['sorcerers tantrum', 'sorcerer tantrum', 'pyro tantrum', 'fire tantrum'],
  cursed_hex: ['hex of inconvenience', 'cursed hex', 'inconvenience'],
  ego_shield: ['ego shield', 'eagle shield'],
  siphon_pride: ['siphon pride', 'siphon bride', 'cyclone pride'],
  mend_minor_miracles: ['mend of minor miracles', 'minor miracles'],
  reversal_of_misfortune: ['reversal of misfortune', 'reversal'],
  eternal_annihilation: ['eternal annihilation', 'annihilation'],
};

const ELEMENT_WORDS: OffensiveElement[] = ['fire', 'ice', 'lightning', 'arcane', 'poison'];

function getSpellDamageScore(spell: Spell): number {
  return spell.effects
    .filter((e) => e.type === 'damage')
    .reduce((sum, e) => sum + e.value, 0);
}

export class VoiceCommandParser {
  public static parseAlternatives(
    alternatives: string[],
    availableSpells: Spell[]
  ): ParsedVoiceCommand {
    if (!alternatives || alternatives.length === 0) {
      return { kind: 'unknown', rawTranscript: '', reason: 'Empty speech transcript.' };
    }

    let fallback: ParsedVoiceCommand | null = null;
    for (const alt of alternatives) {
      const parsed = this.parse(alt, availableSpells);
      if (parsed.kind === 'spell' || parsed.kind === 'dodge' || parsed.kind === 'move_lane') {
        return parsed;
      }
      if (!fallback || (parsed.kind === 'ambiguous' && fallback.kind === 'unknown')) {
        fallback = parsed;
      }
    }
    return fallback || this.parse(alternatives[0], availableSpells);
  }

  public static parse(transcript: string, availableSpells: Spell[]): ParsedVoiceCommand {
    const raw = transcript.trim();
    if (!raw) {
      return { kind: 'unknown', rawTranscript: raw, reason: 'Empty speech transcript.' };
    }

    let cleaned = normalizeText(raw);

    // Check lane movement commands
    if (/^(move|go|step|shift)\s+(left|right|center)$/.test(cleaned)) {
      const dir = cleaned.split(' ').pop() as 'left' | 'right' | 'center';
      return { kind: 'move_lane', direction: dir, rawTranscript: raw };
    }

    // Check dodge commands
    if (cleaned === 'perfect dodge' || cleaned === 'use perfect dodge') {
      return { kind: 'dodge', dodgeType: 'perfect_dodge', rawTranscript: raw };
    }
    if (cleaned.includes('arcane blink') || /^blink(\s+(left|right|center))?$/.test(cleaned)) {
      let targetLane: Lane | undefined;
      if (cleaned.includes('left')) targetLane = 'left';
      else if (cleaned.includes('right')) targetLane = 'right';
      else if (cleaned.includes('center')) targetLane = 'center';
      return { kind: 'dodge', dodgeType: 'arcane_blink', targetLane, rawTranscript: raw };
    }
    if (cleaned === 'dodge' || cleaned === 'quickstep' || cleaned === 'use quickstep') {
      return { kind: 'dodge', dodgeType: 'quickstep', rawTranscript: raw };
    }

    // Extract charge modifier
    let charge = false;
    if (cleaned.startsWith('charge ')) {
      charge = true;
      cleaned = cleaned.replace(/^charge\s+/, '');
    }

    // Strip natural command prefixes
    cleaned = cleaned.replace(/^(cast|use|launch|fire|invoke)\s+/, '');
    cleaned = cleaned.replace(/^(my|the)\s+/, '');

    // Extract optional "on <target>"
    let targetName: string | undefined;
    const onMatch = cleaned.match(/\s+on\s+([a-z0-9\s]+)$/);
    if (onMatch) {
      targetName = onMatch[1].replace(/^the\s+/, '').trim();
      cleaned = cleaned.slice(0, onMatch.index).trim();
    }

    // Handle natural elemental queries like "strongest fire spell" or "fire spell"
    const requestedElement = ELEMENT_WORDS.find((el) =>
      new RegExp(`\\b${el}\\b`).test(cleaned)
    );
    if (
      requestedElement &&
      (cleaned.includes('strongest') || cleaned.includes('spell') || cleaned === requestedElement)
    ) {
      const matching = availableSpells.filter((s) => s.element === requestedElement);
      if (matching.length === 1) {
        return {
          kind: 'spell',
          spellId: matching[0].id,
          spellName: matching[0].name,
          charge,
          targetName,
          confidence: 0.9,
          rawTranscript: raw,
        };
      }
      if (matching.length > 1) {
        if (cleaned.includes('strongest')) {
          const sorted = [...matching].sort(
            (a, b) => getSpellDamageScore(b) - getSpellDamageScore(a)
          );
          if (getSpellDamageScore(sorted[0]) > getSpellDamageScore(sorted[1])) {
            return {
              kind: 'spell',
              spellId: sorted[0].id,
              spellName: sorted[0].name,
              charge,
              targetName,
              confidence: 0.92,
              rawTranscript: raw,
            };
          }
        }
        return {
          kind: 'ambiguous',
          rawTranscript: raw,
          options: matching.map((s) => s.name),
          reason: `Multiple ${requestedElement} spells available (${matching
            .map((s) => s.name)
            .join(', ')}). Please name the spell.`,
        };
      }
    }

    // Match against spells (exact -> alias -> conservative fuzzy)
    let bestSpell: Spell | null = null;
    let bestScore = 0;

    for (const spell of availableSpells) {
      const candidates = [normalizeText(spell.name), ...(SPELL_ALIASES[spell.id] || [])];
      for (const candidate of candidates) {
        if (cleaned === candidate) {
          return {
            kind: 'spell',
            spellId: spell.id,
            spellName: spell.name,
            charge,
            targetName,
            confidence: 1.0,
            rawTranscript: raw,
          };
        }

        if (cleaned.length >= 4 && candidate.length >= 4 && (cleaned.includes(candidate) || candidate.includes(cleaned))) {
          const score = 0.88;
          if (score > bestScore) {
            bestScore = score;
            bestSpell = spell;
          }
        } else if (cleaned.length >= 4) {
          const dist = levenshtein(cleaned, candidate);
          const maxLen = Math.max(cleaned.length, candidate.length);
          const sim = maxLen > 0 ? 1 - dist / maxLen : 0;
          if (sim >= 0.72 && sim > bestScore) {
            bestScore = sim;
            bestSpell = spell;
          }
        }
      }
    }

    if (bestSpell && bestScore >= 0.72) {
      return {
        kind: 'spell',
        spellId: bestSpell.id,
        spellName: bestSpell.name,
        charge,
        targetName,
        confidence: Math.round(bestScore * 100) / 100,
        rawTranscript: raw,
      };
    }

    return {
      kind: 'unknown',
      rawTranscript: raw,
      reason: `Could not match "${raw}" to any prepared spell or command.`,
    };
  }

  public static resolveVoiceTarget(
    targetName: string | undefined,
    livingEnemies: CombatEntity[]
  ): TargetResolutionOutcome | null {
    if (!targetName) return null;
    const query = normalizeText(targetName).replace(/^the\s+/, '');
    if (!query) return null;

    if (query === 'all' || query === 'all enemies' || query === 'everyone') {
      return { status: 'all' };
    }

    const matches = livingEnemies.filter((e) => {
      const normName = normalizeText(e.name);
      return normName === query || normName.includes(query);
    });

    if (matches.length === 1) {
      return { status: 'matched', enemyId: matches[0].id, enemyName: matches[0].name };
    }
    if (matches.length > 1) {
      return { status: 'ambiguous', candidates: matches.map((m) => m.name) };
    }
    return { status: 'not_found', query: targetName };
  }
}
