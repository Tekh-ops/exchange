import { VfxQuality } from '../stores/gameStore';

export type VfxElement = 'fire' | 'ice' | 'lightning' | 'arcane' | 'poison' | 'defense' | 'heal';

export interface ElementPalette {
  primary: number;
  secondary: number;
  core: number;
  accent: number;
  smoke: number;
}

export const ELEMENT_PALETTES: Record<VfxElement, ElementPalette> = {
  fire: {
    primary: 0xf97316,   // Vivid orange
    secondary: 0xef4444, // Crimson flame
    core: 0xfef08a,      // White-gold heat
    accent: 0xfacc15,    // Golden ember
    smoke: 0x7c2d12,     // Dark ember soot
  },
  ice: {
    primary: 0x38bdf8,   // Icy cyan
    secondary: 0x60a5fa, // Glacial blue
    core: 0xf0f9ff,      // Crisp frost white
    accent: 0xbae6fd,    // Pale crystal
    smoke: 0x1e3a8a,     // Deep frost mist
  },
  lightning: {
    primary: 0x38bdf8,   // Electric blue
    secondary: 0xa855f7, // Arc violet
    core: 0xffffff,      // Pure flash white
    accent: 0xfacc15,    // Static gold
    smoke: 0x312e81,     // Indigo charge
  },
  arcane: {
    primary: 0xa855f7,   // Royal violet
    secondary: 0xd946ef, // Magenta
    core: 0xfdf4ff,      // Arcane white
    accent: 0xfacc15,    // Astral gold
    smoke: 0x4c1d95,     // Deep void purple
  },
  poison: {
    primary: 0x22c55e,   // Toxic green
    secondary: 0x15803d, // Acid emerald
    core: 0xbef264,      // Bilious lime
    accent: 0x4ade80,    // Bubbling venom
    smoke: 0x14532d,     // Dark green fume
  },
  defense: {
    primary: 0x60a5fa,   // Barrier blue
    secondary: 0x818cf8, // Rune indigo
    core: 0xe0f2fe,      // Crystal edge
    accent: 0xfacc15,    // Ward gold
    smoke: 0x1e3a8a,
  },
  heal: {
    primary: 0x34d399,   // Restorative emerald
    secondary: 0x10b981, // Soft green
    core: 0xfef9c3,      // Warm gold light
    accent: 0xfacc15,    // Gold sparkle
    smoke: 0x065f46,
  },
};

export interface VfxQualityBudget {
  particleScale: number;
  maxParticles: number;
  enableSecondaryRings: boolean;
  enableHeatShimmer: boolean;
  shakeScale: number;
}

export const VFX_QUALITY_BUDGETS: Record<VfxQuality, VfxQualityBudget> = {
  low: {
    particleScale: 0.35,
    maxParticles: 60,
    enableSecondaryRings: false,
    enableHeatShimmer: false,
    shakeScale: 0.4,
  },
  medium: {
    particleScale: 0.7,
    maxParticles: 140,
    enableSecondaryRings: true,
    enableHeatShimmer: false,
    shakeScale: 0.75,
  },
  high: {
    particleScale: 1.0,
    maxParticles: 240,
    enableSecondaryRings: true,
    enableHeatShimmer: true,
    shakeScale: 1.0,
  },
};

export function getVfxElementForSpell(
  spellId?: string,
  fallbackElement?: string
): VfxElement {
  if (spellId === 'ego_shield' || spellId === 'reversal_of_misfortune') {
    return spellId === 'reversal_of_misfortune' ? 'heal' : 'defense';
  }
  if (spellId === 'mend_minor_miracles') return 'heal';
  if (spellId === 'petty_spark') return 'lightning';
  if (spellId === 'frigid_snub' || spellId === 'frost_lance') return 'ice';
  if (spellId === 'pyro_tantrum' || spellId === 'ember_bolt' || spellId === 'cataclysm_blast') return 'fire';
  if (spellId === 'cursed_hex' || spellId === 'dread_hex') return 'poison';
  if (
    spellId === 'arcane_dart' ||
    spellId === 'siphon_pride' ||
    spellId === 'eternal_annihilation'
  ) {
    return 'arcane';
  }
  if (
    fallbackElement === 'fire' ||
    fallbackElement === 'ice' ||
    fallbackElement === 'lightning' ||
    fallbackElement === 'arcane' ||
    fallbackElement === 'poison' ||
    fallbackElement === 'defense' ||
    fallbackElement === 'heal'
  ) {
    return fallbackElement;
  }
  return 'arcane';
}
