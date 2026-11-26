import { Spell } from '../spells/types';
import { Lane } from '../combat/combatTypes';

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
      kind: 'unknown';
      rawTranscript: string;
      reason: string;
    };

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
  petty_spark: ['petty spark', 'pretty spark', 'pity spark', 'spark'],
  arcane_dart: ['arcane dart', 'arcane dark', 'arcana dart', 'dart'],
  frigid_snub: ['frigid snub', 'rigid snub', 'fridge snub', 'cold shoulder', 'ice snub'],
  pyro_tantrum: ['sorcerers tantrum', 'sorcerer tantrum', 'tantrum', 'pyro tantrum', 'fire tantrum'],
  cursed_hex: ['hex of inconvenience', 'inconvenience', 'cursed hex', 'hex'],
  ego_shield: ['ego shield', 'eagle shield', 'shield'],
  siphon_pride: ['siphon pride', 'siphon bride', 'cyclone pride', 'siphon'],
  mend_minor_miracles: ['mend of minor miracles', 'minor miracles', 'mend', 'heal'],
  reversal_of_misfortune: ['reversal of misfortune', 'reversal', 'misfortune'],
};

export class VoiceCommandParser {
  public static parse(transcript: string, availableSpells: Spell[]): ParsedVoiceCommand {
    const raw = transcript.trim();
    if (!raw) {
      return { kind: 'unknown', rawTranscript: raw, reason: 'Empty speech transcript.' };
    }

    let cleaned = normalizeText(raw);

    // Check lane movement commands
    if (/^(move|go|step)\s+(left|right|center)$/.test(cleaned)) {
      const dir = cleaned.split(' ').pop() as 'left' | 'right' | 'center';
      return { kind: 'move_lane', direction: dir, rawTranscript: raw };
    }

    // Check dodge commands
    if (cleaned.includes('perfect dodge')) {
      return { kind: 'dodge', dodgeType: 'perfect_dodge', rawTranscript: raw };
    }
    if (cleaned.includes('arcane blink') || cleaned.startsWith('blink')) {
      let targetLane: Lane | undefined;
      if (cleaned.includes('left')) targetLane = 'left';
      else if (cleaned.includes('right')) targetLane = 'right';
      else if (cleaned.includes('center')) targetLane = 'center';
      return { kind: 'dodge', dodgeType: 'arcane_blink', targetLane, rawTranscript: raw };
    }
    if (cleaned === 'dodge' || cleaned === 'quickstep') {
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

    // Extract optional "on <target>"
    let targetName: string | undefined;
    const onMatch = cleaned.match(/\s+on\s+([a-z0-9\s]+)$/);
    if (onMatch) {
      targetName = onMatch[1].trim();
      cleaned = cleaned.slice(0, onMatch.index).trim();
    }

    // Match against spells
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
        if (cleaned.includes(candidate) || candidate.includes(cleaned)) {
          const score = 0.88;
          if (score > bestScore) {
            bestScore = score;
            bestSpell = spell;
          }
        } else {
          const dist = levenshtein(cleaned, candidate);
          const maxLen = Math.max(cleaned.length, candidate.length);
          const sim = maxLen > 0 ? 1 - dist / maxLen : 0;
          if (sim >= 0.62 && sim > bestScore) {
            bestScore = sim;
            bestSpell = spell;
          }
        }
      }
    }

    if (bestSpell && bestScore >= 0.62) {
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
      reason: `Could not match "${raw}" to any known spell or command.`,
    };
  }
}
