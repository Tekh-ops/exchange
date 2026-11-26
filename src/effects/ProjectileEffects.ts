import { Graphics as PixiGraphics } from 'pixi.js';
import { ELEMENT_PALETTES, VfxElement, getVfxElementForSpell } from './ElementalEffects';
import { VfxParticlePool } from './ParticlePresets';
import { ProjectileEventPayload } from '../engine/types';

export interface ActiveElementalProjectile extends ProjectileEventPayload {
  currentX: number;
  currentY: number;
  age: number;
  vfxElement: VfxElement;
  trail: { x: number; y: number; alpha: number }[];
}

/**
 * Emits element-specific trail particles while a projectile is in flight.
 */
export function emitProjectileTrail(
  pool: VfxParticlePool,
  p: ActiveElementalProjectile,
  particleScale: number,
  maxParticles: number
): void {
  const palette = ELEMENT_PALETTES[p.vfxElement];
  const chargeBoost = p.isCharged ? 1.5 : 1.0;
  if (Math.random() > 0.75 * particleScale * chargeBoost) return;

  switch (p.vfxElement) {
    case 'fire':
      pool.spawn(
        {
          x: p.currentX + (Math.random() - 0.5) * 10,
          y: p.currentY + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.6 - Math.random() * 1.1,
          size: p.spellId === 'pyro_tantrum' || p.isCharged ? 5.5 : 3.8,
          color: Math.random() > 0.4 ? palette.primary : palette.secondary,
          alpha: 0.9,
          maxLife: 18,
          rotation: 0,
          rotSpeed: 0,
          shape: Math.random() > 0.35 ? 'flame' : 'ember',
          gravity: -0.04,
          drag: 0.96,
        },
        maxParticles
      );
      break;

    case 'ice':
      pool.spawn(
        {
          x: p.currentX + (Math.random() - 0.5) * 10,
          y: p.currentY + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 0.6,
          vy: 0.3 + Math.random() * 0.6,
          size: p.isCharged ? 4.5 : 3.2,
          color: Math.random() > 0.4 ? palette.core : palette.primary,
          alpha: 0.85,
          maxLife: 22,
          rotation: Math.random() * Math.PI,
          rotSpeed: 0.08,
          shape: Math.random() > 0.4 ? 'snowflake' : 'ice_shard',
          gravity: 0.02,
          drag: 0.97,
        },
        maxParticles
      );
      break;

    case 'lightning':
      pool.spawn(
        {
          x: p.currentX + (Math.random() - 0.5) * 8,
          y: p.currentY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 2.2,
          vy: (Math.random() - 0.5) * 2.2,
          size: 3,
          color: Math.random() > 0.5 ? palette.core : palette.primary,
          alpha: 0.95,
          maxLife: 9,
          rotation: 0,
          rotSpeed: 0,
          shape: 'spark',
          gravity: 0,
          drag: 0.9,
        },
        maxParticles
      );
      break;

    case 'poison':
      pool.spawn(
        {
          x: p.currentX + (Math.random() - 0.5) * 8,
          y: p.currentY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.4 - Math.random() * 0.6,
          size: p.isCharged ? 5 : 3.5,
          color: Math.random() > 0.4 ? palette.smoke : palette.primary,
          alpha: 0.8,
          maxLife: 22,
          rotation: 0,
          rotSpeed: 0,
          shape: Math.random() > 0.45 ? 'smoke' : 'bubble',
          gravity: -0.02,
          drag: 0.96,
        },
        maxParticles
      );
      break;

    case 'arcane':
    default:
      pool.spawn(
        {
          x: p.currentX + (Math.random() - 0.5) * 8,
          y: p.currentY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: p.isCharged || p.spellId === 'eternal_annihilation' ? 5 : 3.5,
          color: p.bossStage && p.bossStage >= 2 ? palette.accent : palette.primary,
          alpha: 0.85,
          maxLife: 18,
          rotation: p.age * 0.15,
          rotSpeed: 0.12,
          shape: 'rune',
          gravity: 0,
          drag: 0.96,
        },
        maxParticles
      );
      break;
  }
}

/**
 * Draws a distinct pixel-crisp silhouette for each elemental projectile.
 */
export function drawElementalProjectile(
  g: PixiGraphics,
  p: ActiveElementalProjectile
): void {
  const palette = ELEMENT_PALETTES[p.vfxElement];
  const chargeScale = p.isCharged ? 1.35 : 1.0;
  const spellScale =
    p.spellId === 'pyro_tantrum' || p.spellId === 'apocalypse_singularity' || p.spellId === 'eternal_annihilation'
      ? 1.45
      : p.spellId === 'petty_spark'
      ? 0.8
      : 1.0;
  const s = chargeScale * spellScale;

  // Draw crisp pixel trail
  for (let i = 0; i < p.trail.length; i++) {
    const t = p.trail[i];
    g.rect(t.x - 2 * s, t.y - 2 * s, 4 * s, 4 * s);
    g.fill({ color: palette.primary, alpha: t.alpha * 0.45 });
  }

  const dx = p.targetX - p.startX;
  const dy = p.targetY - p.startY;
  const angle = Math.atan2(dy, dx);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  switch (p.vfxElement) {
    case 'fire': {
      // Spherical fireball silhouette with flickering flame crown
      const flicker = Math.sin(p.age * 0.9) * 2.2;
      g.circle(p.currentX, p.currentY, 10 * s + flicker * 0.4);
      g.fill({ color: palette.secondary, alpha: 0.85 });
      // Trailing flame spikes
      g.poly([
        p.currentX - cos * 16 * s, p.currentY - sin * 16 * s,
        p.currentX - sin * 8 * s, p.currentY + cos * 8 * s,
        p.currentX + cos * 9 * s, p.currentY + sin * 9 * s,
        p.currentX + sin * 8 * s, p.currentY - cos * 8 * s,
      ]);
      g.fill({ color: palette.primary, alpha: 0.9 });
      g.circle(p.currentX, p.currentY, 6 * s);
      g.fill({ color: palette.accent });
      g.circle(p.currentX + cos * 2, p.currentY + sin * 2, 3 * s);
      g.fill({ color: palette.core });
      break;
    }

    case 'ice': {
      // Faceted crystalline ice lance
      const len = 14 * s;
      const wid = 6 * s;
      g.poly([
        p.currentX + cos * len, p.currentY + sin * len,
        p.currentX - sin * wid, p.currentY + cos * wid,
        p.currentX - cos * len * 0.8, p.currentY - sin * len * 0.8,
        p.currentX + sin * wid, p.currentY - cos * wid,
      ]);
      g.fill({ color: palette.primary });
      g.poly([
        p.currentX + cos * len * 0.7, p.currentY + sin * len * 0.7,
        p.currentX - sin * wid * 0.45, p.currentY + cos * wid * 0.45,
        p.currentX - cos * len * 0.4, p.currentY - sin * len * 0.4,
        p.currentX + sin * wid * 0.45, p.currentY - cos * wid * 0.45,
      ]);
      g.fill({ color: palette.core });
      break;
    }

    case 'lightning': {
      // Jagged electric bolt segment
      const seg = 16 * s;
      const jitter1 = ((p.age % 4) - 1.5) * 4;
      const jitter2 = (((p.age + 2) % 4) - 1.5) * -4;
      const x1 = p.currentX - cos * seg;
      const y1 = p.currentY - sin * seg;
      const xm = p.currentX - sin * jitter1;
      const ym = p.currentY + cos * jitter1;
      const x2 = p.currentX + cos * seg * 0.7 - sin * jitter2;
      const y2 = p.currentY + sin * seg * 0.7 + cos * jitter2;

      g.moveTo(x1, y1);
      g.lineTo(xm, ym);
      g.lineTo(x2, y2);
      g.stroke({ width: 4 * s, color: palette.primary });
      g.moveTo(x1, y1);
      g.lineTo(xm, ym);
      g.lineTo(x2, y2);
      g.stroke({ width: 1.8 * s, color: palette.core });
      break;
    }

    case 'poison': {
      // Swirling toxic green orb with dark core & orbiting droplet
      g.circle(p.currentX, p.currentY, 8 * s);
      g.fill({ color: palette.smoke, alpha: 0.9 });
      g.circle(p.currentX, p.currentY, 5.5 * s);
      g.fill({ color: palette.primary });
      g.circle(p.currentX, p.currentY, 2.5 * s);
      g.fill({ color: palette.core });
      const bx = p.currentX + Math.cos(p.age * 0.5) * 8 * s;
      const by = p.currentY + Math.sin(p.age * 0.5) * 8 * s;
      g.circle(bx, by, 2.2 * s);
      g.fill({ color: palette.accent });
      break;
    }

    case 'arcane':
    default: {
      // Concentrated arcane sphere + rotating diamond rune ring
      const isSiphon = p.spellId === 'siphon_pride';
      const coreCol = isSiphon ? 0xf43f5e : palette.core;
      const ringCol = isSiphon ? 0xbe123c : p.bossStage && p.bossStage >= 2 ? palette.accent : palette.secondary;

      g.circle(p.currentX, p.currentY, 8 * s);
      g.fill({ color: palette.primary, alpha: 0.85 });
      g.circle(p.currentX, p.currentY, 4 * s);
      g.fill({ color: coreCol });

      const r = 11 * s;
      const rot = p.age * 0.25;
      const pts: number[] = [];
      for (let k = 0; k < 4; k++) {
        const a = rot + (k * Math.PI) / 2;
        pts.push(p.currentX + Math.cos(a) * r, p.currentY + Math.sin(a) * r);
      }
      g.poly(pts);
      g.stroke({ width: 1.5, color: ringCol, alpha: 0.9 });
      break;
    }
  }
}

export function resolveProjectileElement(payload: ProjectileEventPayload): VfxElement {
  return getVfxElementForSpell(payload.spellId, payload.element);
}
