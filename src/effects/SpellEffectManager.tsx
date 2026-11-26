import { useEffect, useRef } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
import { gameEvents } from '../engine/eventBus';
import { LANE_COORDS } from '../combat/LaneSystem';
import { Lane } from '../combat/combatTypes';
import { useGameStore } from '../stores/gameStore';
import {
  ELEMENT_PALETTES,
  VFX_QUALITY_BUDGETS,
  VfxElement,
  getVfxElementForSpell,
} from './ElementalEffects';
import { VfxParticlePool } from './ParticlePresets';
import { ActiveImpactEffect, drawImpactEffect, spawnElementalImpactParticles } from './ImpactEffects';

interface CastAuraEffect {
  x: number;
  y: number;
  element: VfxElement;
  spellId: string;
  isCharged: boolean;
  bossStage?: number;
  age: number;
  maxAge: number;
}

interface LaneHighlightEffect {
  lane: Lane;
  color: number;
  age: number;
  maxAge: number;
}

interface LifestealParticle {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  arcOffset: number;
}

/**
 * Renders spell cast buildups, AoE lane highlights, reverse lifesteal streams,
 * healing circles, and shield barrier ripples in response to combat events.
 */
export function SpellEffectManager() {
  const graphicsRef = useRef<PixiGraphics | null>(null);
  const poolRef = useRef(new VfxParticlePool());
  const aurasRef = useRef<CastAuraEffect[]>([]);
  const impactsRef = useRef<ActiveImpactEffect[]>([]);
  const laneHighlightsRef = useRef<LaneHighlightEffect[]>([]);
  const lifestealRef = useRef<LifestealParticle[]>([]);

  useEffect(() => {
    const unsubCast = gameEvents.on('SPELL_CAST_EFFECT', (payload) => {
      const budget = VFX_QUALITY_BUDGETS[useGameStore.getState().settings.vfxQuality];
      const element = getVfxElementForSpell(payload.spellId, payload.element);
      const palette = ELEMENT_PALETTES[element];
      const cx = payload.startX ?? (payload.source === 'player' ? 260 : 700);
      const cy = payload.startY ?? 350;

      const isBig =
        payload.isCharged ||
        payload.spellId === 'pyro_tantrum' ||
        payload.spellId === 'apocalypse_singularity' ||
        payload.spellId === 'eternal_annihilation';

      aurasRef.current.push({
        x: cx,
        y: cy,
        element,
        spellId: payload.spellId,
        isCharged: Boolean(payload.isCharged),
        bossStage: payload.bossStage,
        age: 0,
        maxAge: payload.spellId === 'petty_spark' ? 14 : isBig ? 34 : 22,
      });

      // Spawn cast gathering particles around staff/hand
      const burstCount = Math.max(2, Math.round((isBig ? 14 : 7) * budget.particleScale));
      poolRef.current.spawnBurst(cx, cy - 10, burstCount, budget.maxParticles, (i) => {
        const ang = (i / burstCount) * Math.PI * 2;
        return {
          x: cx + Math.cos(ang) * 26,
          y: cy - 10 + Math.sin(ang) * 26,
          vx: -Math.cos(ang) * 1.1,
          vy: -Math.sin(ang) * 1.1,
          size: isBig ? 4.5 : 3.2,
          color: i % 2 === 0 ? palette.accent : palette.primary,
          alpha: 0.9,
          maxLife: 18,
          rotation: ang,
          rotSpeed: 0.1,
          shape:
            element === 'fire'
              ? 'flame'
              : element === 'ice'
              ? 'snowflake'
              : element === 'lightning'
              ? 'spark'
              : element === 'poison'
              ? 'bubble'
              : element === 'heal'
              ? 'heal_cross'
              : 'rune',
          gravity: 0,
          drag: 0.95,
        };
      });

      // Highlight affected lanes for multi-lane / AoE spells
      if (payload.affectedLanes && payload.affectedLanes.length > 0) {
        payload.affectedLanes.forEach((lane) => {
          laneHighlightsRef.current.push({
            lane,
            color: palette.primary,
            age: 0,
            maxAge: 28,
          });
        });
      }

      // Defensive / Healing cast circle directly on target
      if (element === 'heal' || element === 'defense') {
        const tx = payload.targetX ?? cx;
        const ty = payload.targetY ?? cy;
        impactsRef.current.push({
          id: `cast-imp-${Date.now()}-${Math.random()}`,
          x: tx,
          y: ty,
          element,
          spellId: payload.spellId,
          isCharged: payload.isCharged,
          age: 0,
          maxAge: 28,
          maxRadius: 48,
        });
        spawnElementalImpactParticles(
          poolRef.current,
          tx,
          ty,
          element,
          budget.particleScale,
          budget.maxParticles,
          { spellId: payload.spellId, isCharged: payload.isCharged }
        );
      }
    });

    const unsubLifesteal = gameEvents.on('LIFESTEAL_STREAM', (payload) => {
      const budget = VFX_QUALITY_BUDGETS[useGameStore.getState().settings.vfxQuality];
      const orbCount = Math.max(4, Math.round(12 * budget.particleScale));
      for (let i = 0; i < orbCount; i++) {
        lifestealRef.current.push({
          startX: payload.startX + (Math.random() - 0.5) * 18,
          startY: payload.startY + (Math.random() - 0.5) * 18,
          targetX: payload.targetX,
          targetY: payload.targetY,
          progress: -i * 0.06,
          speed: 0.045 + Math.random() * 0.015,
          arcOffset: (Math.random() - 0.5) * 60,
        });
      }
    });

    return () => {
      unsubCast();
      unsubLifesteal();
      poolRef.current.clear();
    };
  }, []);

  useTick((ticker) => {
    const dt = ticker.deltaTime;
    const budget = VFX_QUALITY_BUDGETS[useGameStore.getState().settings.vfxQuality];

    poolRef.current.update(dt);
    aurasRef.current = aurasRef.current
      .map((a) => ({ ...a, age: a.age + dt }))
      .filter((a) => a.age < a.maxAge);

    impactsRef.current = impactsRef.current
      .map((imp) => ({ ...imp, age: imp.age + dt }))
      .filter((imp) => imp.age < imp.maxAge);

    laneHighlightsRef.current = laneHighlightsRef.current
      .map((lh) => ({ ...lh, age: lh.age + dt }))
      .filter((lh) => lh.age < lh.maxAge);

    const nextLifesteal: LifestealParticle[] = [];
    for (let i = 0; i < lifestealRef.current.length; i++) {
      const lp = lifestealRef.current[i];
      lp.progress += lp.speed * dt;
      if (lp.progress < 1) {
        nextLifesteal.push(lp);
      } else {
        // Trigger subtle heal pulse when final crimson orb returns to caster
        if (i === 0) {
          impactsRef.current.push({
            id: `ls-heal-${Date.now()}`,
            x: lp.targetX,
            y: lp.targetY,
            element: 'heal',
            age: 0,
            maxAge: 22,
            maxRadius: 36,
          });
        }
      }
    }
    lifestealRef.current = nextLifesteal;

    if (!graphicsRef.current) return;
    const g = graphicsRef.current;
    g.clear();

    // 1. Lane highlights for multi-lane / AoE attacks
    laneHighlightsRef.current.forEach((lh) => {
      const coords = LANE_COORDS[lh.lane];
      const alpha = Math.sin((lh.age / lh.maxAge) * Math.PI) * 0.25;
      g.rect(coords.playerX - 60, coords.playerY - 20, coords.enemyX - coords.playerX + 120, 40);
      g.fill({ color: lh.color, alpha });
      g.rect(coords.playerX - 60, coords.playerY - 20, coords.enemyX - coords.playerX + 120, 40);
      g.stroke({ width: 1.5, color: lh.color, alpha: alpha * 1.8 });
    });

    // 2. Cast buildup rings / circles
    aurasRef.current.forEach((a) => {
      const palette = ELEMENT_PALETTES[a.element];
      const progress = a.age / a.maxAge;
      const alpha = Math.sin(progress * Math.PI) * 0.85;
      const baseR = (a.isCharged ? 36 : 26) * (0.7 + progress * 0.5);

      g.ellipse(a.x, a.y + 18, baseR, baseR * 0.35);
      g.stroke({ width: 2, color: palette.primary, alpha });

      if (a.bossStage && a.bossStage >= 2) {
        g.circle(a.x, a.y - 10, baseR * 1.15);
        g.stroke({ width: 1.8, color: a.bossStage >= 3 ? 0xef4444 : 0xd4af37, alpha: alpha * 0.8 });
      }
    });

    // 3. Impacts (heal, shield, cast circles)
    impactsRef.current.forEach((imp) => {
      drawImpactEffect(g, imp, budget.enableSecondaryRings);
    });

    // 4. Reverse lifesteal crimson-violet particles
    lifestealRef.current.forEach((lp) => {
      if (lp.progress < 0) return;
      const t = lp.progress;
      const inv = 1 - t;
      const midX = (lp.startX + lp.targetX) * 0.5;
      const midY = (lp.startY + lp.targetY) * 0.5 + lp.arcOffset;
      const x = inv * inv * lp.startX + 2 * inv * t * midX + t * t * lp.targetX;
      const y = inv * inv * lp.startY + 2 * inv * t * midY + t * t * lp.targetY;
      g.circle(x, y, 4.5);
      g.fill({ color: 0xf43f5e, alpha: 0.9 });
      g.circle(x, y, 2);
      g.fill({ color: 0xfda4af, alpha: 0.95 });
    });

    // 5. Pooled particles
    poolRef.current.draw(g);
  });

  return (
    <pixiContainer>
      <pixiGraphics ref={graphicsRef} draw={() => {}} />
    </pixiContainer>
  );
}
