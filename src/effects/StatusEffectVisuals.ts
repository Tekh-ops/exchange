import { Graphics as PixiGraphics } from 'pixi.js';
import { CombatEntity } from '../combat/combatTypes';
import { ChargedSpellState } from '../combat/ChargingSystem';
import { ELEMENT_PALETTES, getVfxElementForSpell } from './ElementalEffects';

/**
 * Renders lightweight pixel-crisp visuals for active status effects,
 * stagger stars, and charged-spell aura on any WizardEntity.
 * Visuals only render while the corresponding status/state is active.
 */
export function drawEntityStatusVisuals(
  g: PixiGraphics,
  entity: CombatEntity,
  time: number,
  options?: {
    chargedSpell?: ChargedSpellState | null;
    isLowQuality?: boolean;
  }
): void {
  g.clear();
  if (entity.hp <= 0) return;

  const isLow = options?.isLowQuality ?? false;

  // Staggered stars
  if (entity.isStaggered) {
    const spin = time * 6;
    const starCount = isLow ? 2 : 3;
    for (let s = 0; s < starCount; s++) {
      const ang = spin + (s * Math.PI * 2) / starCount;
      g.circle(Math.cos(ang) * 22, -56 + Math.sin(ang) * 6, 3.5);
      g.fill({ color: 0xfacc15, alpha: 0.95 });
    }
  }

  // Active status effects (burn, frost, poison, weaken, strengthen)
  entity.statusEffects.forEach((st, idx) => {
    const ang = time * 3.2 + idx * 2.1;

    switch (st.type) {
      case 'burn': {
        // Small flickering flame & rising ember
        const fx = Math.cos(ang) * 24;
        const fy = 6 - ((time * 22 + idx * 9) % 26);
        g.poly([fx, fy - 5, fx + 4, fy, fx, fy + 3, fx - 4, fy]);
        g.fill({ color: 0xf97316, alpha: 0.9 });
        if (!isLow) {
          g.rect(fx - 1, fy - 8, 2, 2);
          g.fill({ color: 0xfef08a, alpha: 0.85 });
        }
        break;
      }

      case 'frost': {
        // Crystalline ice shards & subtle frost aura
        const fx = Math.cos(ang) * 32;
        const fy = 8 + Math.sin(ang) * 12;
        g.poly([fx, fy - 5, fx + 3, fy, fx, fy + 5, fx - 3, fy]);
        g.fill({ color: 0xbae6fd, alpha: 0.9 });
        if (!isLow) {
          g.ellipse(0, 36, 38, 10);
          g.stroke({ width: 1.5, color: 0x38bdf8, alpha: 0.45 });
        }
        break;
      }

      case 'poison': {
        // Bubbling toxic green particles
        const px = Math.sin(time * 2.5 + idx * 1.7) * 26;
        const py = 18 - ((time * 18 + idx * 11) % 34);
        g.circle(px, py, 3.2);
        g.stroke({ width: 1.5, color: 0x22c55e, alpha: 0.9 });
        if (!isLow) {
          g.rect(px - 1, py - 1, 2, 2);
          g.fill({ color: 0xbef264, alpha: 0.85 });
        }
        break;
      }

      case 'weaken': {
        // Dimmed descending violet/grey ring
        g.ellipse(0, 22, 30, 9);
        g.stroke({ width: 1.5, color: 0x94a3b8, alpha: 0.5 });
        break;
      }

      case 'strengthen': {
        // Rising golden power sparks
        const sx = Math.cos(ang * 1.3) * 28;
        const sy = 14 - ((time * 24 + idx * 7) % 32);
        g.rect(sx - 1.5, sy - 1.5, 3, 3);
        g.fill({ color: 0xfacc15, alpha: 0.9 });
        break;
      }
    }
  });

  // Charged spell evolving aura around player while charging
  const charged = options?.chargedSpell;
  if (charged) {
    const el = getVfxElementForSpell(charged.spellId);
    const pal = ELEMENT_PALETTES[el];
    const pulse = Math.sin(time * 8) * 5;
    g.ellipse(0, 4, 42 + pulse, 50 + pulse);
    g.stroke({ width: 2, color: pal.primary, alpha: 0.75 });

    if (!isLow) {
      const orbitCount = 4;
      for (let k = 0; k < orbitCount; k++) {
        const a = time * 5 + (k * Math.PI * 2) / orbitCount;
        const ox = Math.cos(a) * 38;
        const oy = Math.sin(a) * 22;
        g.rect(ox - 2.5, oy - 2.5, 5, 5);
        g.fill({ color: pal.accent, alpha: 0.95 });
      }
    }
  }
}
