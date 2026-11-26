import { Graphics as PixiGraphics } from 'pixi.js';
import { ELEMENT_PALETTES, VfxElement } from './ElementalEffects';
import { VfxParticlePool } from './ParticlePresets';

export interface ActiveImpactEffect {
  id: string;
  x: number;
  y: number;
  element: VfxElement;
  spellId?: string;
  isCharged?: boolean;
  bossStage?: number;
  age: number;
  maxAge: number;
  maxRadius: number;
}

export function spawnElementalImpactParticles(
  pool: VfxParticlePool,
  x: number,
  y: number,
  element: VfxElement,
  particleScale: number,
  maxParticles: number,
  options?: { spellId?: string; isCharged?: boolean }
): void {
  const palette = ELEMENT_PALETTES[element];
  const isBig =
    options?.isCharged ||
    options?.spellId === 'pyro_tantrum' ||
    options?.spellId === 'apocalypse_singularity' ||
    options?.spellId === 'eternal_annihilation';
  const baseCount = isBig ? 22 : 12;
  const count = Math.max(3, Math.round(baseCount * particleScale));

  switch (element) {
    case 'fire':
      pool.spawnBurst(x, y, count, maxParticles, (i) => {
        const ang = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const spd = (isBig ? 3.5 : 2.2) + Math.random() * 2.5;
        return {
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 0.8,
          size: (isBig ? 6.5 : 4.5) + Math.random() * 2,
          color: i % 3 === 0 ? palette.core : i % 2 === 0 ? palette.primary : palette.secondary,
          alpha: 0.95,
          maxLife: 24 + Math.random() * 10,
          rotation: ang,
          rotSpeed: 0,
          shape: i % 3 === 0 ? 'ember' : 'flame',
          gravity: -0.05,
          drag: 0.92,
        };
      });
      break;

    case 'ice':
      pool.spawnBurst(x, y, count, maxParticles, (i) => {
        const ang = (i / count) * Math.PI * 2;
        const spd = (isBig ? 3.8 : 2.5) + Math.random() * 2;
        return {
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: (isBig ? 6 : 4) + Math.random() * 2,
          color: i % 2 === 0 ? palette.core : palette.primary,
          alpha: 0.95,
          maxLife: 26,
          rotation: ang,
          rotSpeed: 0.12,
          shape: i % 3 === 0 ? 'snowflake' : 'ice_shard',
          gravity: 0.04,
          drag: 0.93,
        };
      });
      break;

    case 'lightning':
      pool.spawnBurst(x, y, count, maxParticles, (i) => {
        const ang = Math.random() * Math.PI * 2;
        const spd = 3.5 + Math.random() * 4;
        return {
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: 3.5,
          color: i % 2 === 0 ? palette.core : palette.primary,
          alpha: 1,
          maxLife: 12,
          rotation: ang,
          rotSpeed: 0,
          shape: 'spark',
          gravity: 0,
          drag: 0.86,
        };
      });
      break;

    case 'poison':
      pool.spawnBurst(x, y, count, maxParticles, (i) => {
        const ang = (i / count) * Math.PI * 2;
        const spd = 1.2 + Math.random() * 1.8;
        return {
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 0.5,
          size: 5 + Math.random() * 3,
          color: i % 2 === 0 ? palette.primary : palette.smoke,
          alpha: 0.9,
          maxLife: 28,
          rotation: 0,
          rotSpeed: 0,
          shape: i % 2 === 0 ? 'bubble' : 'smoke',
          gravity: -0.03,
          drag: 0.94,
        };
      });
      break;

    case 'heal':
      pool.spawnBurst(x, y, count, maxParticles, (i) => ({
        x: x + (Math.random() - 0.5) * 34,
        y: y + 14 - Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -1.1 - Math.random() * 1.0,
        size: 4.5 + Math.random() * 2,
        color: i % 3 === 0 ? palette.accent : palette.primary,
        alpha: 0.95,
        maxLife: 32,
        rotation: 0,
        rotSpeed: 0,
        shape: 'heal_cross',
        gravity: -0.02,
        drag: 0.98,
      }));
      break;

    case 'defense':
    case 'arcane':
    default:
      pool.spawnBurst(x, y, count, maxParticles, (i) => {
        const ang = (i / count) * Math.PI * 2;
        const spd = 2.0 + Math.random() * 2.2;
        return {
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: 4.5 + Math.random() * 2,
          color: i % 3 === 0 ? palette.accent : palette.primary,
          alpha: 0.95,
          maxLife: 24,
          rotation: ang,
          rotSpeed: 0.14,
          shape: 'rune',
          gravity: 0,
          drag: 0.93,
        };
      });
      break;
  }
}

export function drawImpactEffect(
  g: PixiGraphics,
  imp: ActiveImpactEffect,
  enableSecondaryRings: boolean
): void {
  const palette = ELEMENT_PALETTES[imp.element];
  const progress = Math.min(1, imp.age / imp.maxAge);
  const alpha = Math.max(0, 1 - progress);
  const r = 6 + imp.maxRadius * progress;

  switch (imp.element) {
    case 'fire': {
      // Expanding flame ring + core flash
      g.circle(imp.x, imp.y, r);
      g.stroke({ width: 3.5, color: palette.primary, alpha });
      if (enableSecondaryRings) {
        g.circle(imp.x, imp.y, r * 0.65);
        g.fill({ color: palette.secondary, alpha: alpha * 0.45 });
      }
      g.circle(imp.x, imp.y, r * 0.35);
      g.fill({ color: palette.core, alpha: alpha * 0.85 });
      break;
    }

    case 'ice': {
      // Octagonal frost shockwave + crystal spikes
      g.circle(imp.x, imp.y, r);
      g.stroke({ width: 2.5, color: palette.core, alpha });
      for (let k = 0; k < 6; k++) {
        const ang = (k * Math.PI) / 3;
        g.moveTo(imp.x + Math.cos(ang) * (r * 0.4), imp.y + Math.sin(ang) * (r * 0.4));
        g.lineTo(imp.x + Math.cos(ang) * (r * 1.15), imp.y + Math.sin(ang) * (r * 1.15));
        g.stroke({ width: 2, color: palette.primary, alpha });
      }
      break;
    }

    case 'lightning': {
      // Sharp flash + branching electric arcs
      if (progress < 0.35) {
        g.circle(imp.x, imp.y, r * 0.65);
        g.fill({ color: palette.core, alpha: alpha * 0.7 });
      }
      for (let k = 0; k < 4; k++) {
        const ang = (k * Math.PI) / 2 + imp.age * 0.25;
        const midR = r * 0.55;
        const endR = r * 1.15;
        g.moveTo(imp.x, imp.y);
        g.lineTo(
          imp.x + Math.cos(ang + 0.25) * midR,
          imp.y + Math.sin(ang + 0.25) * midR
        );
        g.lineTo(imp.x + Math.cos(ang) * endR, imp.y + Math.sin(ang) * endR);
        g.stroke({ width: 2.2, color: k % 2 === 0 ? palette.primary : palette.core, alpha });
      }
      break;
    }

    case 'poison': {
      // Corrosive expanding cloud ring
      g.circle(imp.x, imp.y, r * 0.85);
      g.fill({ color: palette.smoke, alpha: alpha * 0.45 });
      g.circle(imp.x, imp.y, r);
      g.stroke({ width: 2.5, color: palette.primary, alpha });
      break;
    }

    case 'heal': {
      // Soft emerald-gold rising ring
      g.ellipse(imp.x, imp.y + 18, r * 0.9, r * 0.32);
      g.stroke({ width: 2.5, color: palette.primary, alpha });
      if (enableSecondaryRings) {
        g.ellipse(imp.x, imp.y + 18 - progress * 24, r * 0.65, r * 0.24);
        g.stroke({ width: 1.5, color: palette.accent, alpha: alpha * 0.85 });
      }
      break;
    }

    case 'defense':
    case 'arcane':
    default: {
      // Rotating arcane rune circle
      g.circle(imp.x, imp.y, r);
      g.stroke({ width: 2.5, color: palette.primary, alpha });
      const rot = imp.age * 0.15;
      const pts: number[] = [];
      for (let k = 0; k < 4; k++) {
        const a = rot + (k * Math.PI) / 2;
        pts.push(imp.x + Math.cos(a) * r * 0.85, imp.y + Math.sin(a) * r * 0.85);
      }
      g.poly(pts);
      g.stroke({ width: 1.8, color: palette.accent, alpha });
      break;
    }
  }
}
