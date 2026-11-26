import { useEffect, useRef } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
import { gameEvents } from '../engine/eventBus';
import { useGameStore } from '../stores/gameStore';
import { VFX_QUALITY_BUDGETS } from '../effects/ElementalEffects';
import { VfxParticlePool } from '../effects/ParticlePresets';
import {
  ActiveElementalProjectile,
  drawElementalProjectile,
  emitProjectileTrail,
  resolveProjectileElement,
} from '../effects/ProjectileEffects';
import {
  ActiveImpactEffect,
  drawImpactEffect,
  spawnElementalImpactParticles,
} from '../effects/ImpactEffects';

export function ProjectileManager() {
  const projectilesRef = useRef<ActiveElementalProjectile[]>([]);
  const impactsRef = useRef<ActiveImpactEffect[]>([]);
  const particlePoolRef = useRef(new VfxParticlePool());
  const graphicsRef = useRef<PixiGraphics | null>(null);

  // Subscribe to fired projectiles
  useEffect(() => {
    const unsub = gameEvents.on('PROJECTILE_FIRED', (payload) => {
      projectilesRef.current.push({
        ...payload,
        currentX: payload.startX,
        currentY: payload.startY,
        age: 0,
        vfxElement: resolveProjectileElement(payload),
        trail: [],
      });
    });
    return () => {
      unsub();
      particlePoolRef.current.clear();
    };
  }, []);

  // Update projectile flights & elemental impact animations
  useTick((ticker) => {
    const dt = ticker.deltaTime;
    const budget = VFX_QUALITY_BUDGETS[useGameStore.getState().settings.vfxQuality];

    particlePoolRef.current.update(dt);

    // Update impact bursts
    impactsRef.current = impactsRef.current
      .map((imp) => ({ ...imp, age: imp.age + dt }))
      .filter((imp) => imp.age < imp.maxAge);

    // Update projectiles and fire onHit callbacks cleanly outside React setState
    if (projectilesRef.current.length > 0) {
      const updated: ActiveElementalProjectile[] = [];
      const hitsToFire: (() => void)[] = [];

      projectilesRef.current.forEach((p) => {
        p.age += dt;
        const dx = p.targetX - p.currentX;
        const dy = p.targetY - p.currentY;
        const dist = Math.hypot(dx, dy);

        // Arrived at target
        if (dist <= p.speed * dt * 1.5) {
          if (p.onHit) {
            hitsToFire.push(p.onHit);
          }

          const isBig =
            p.isCharged ||
            p.spellId === 'pyro_tantrum' ||
            p.spellId === 'apocalypse_singularity' ||
            p.spellId === 'eternal_annihilation';

          impactsRef.current.push({
            id: `imp-${Date.now()}-${Math.random()}`,
            x: p.targetX,
            y: p.targetY,
            element: p.vfxElement,
            spellId: p.spellId,
            isCharged: p.isCharged,
            bossStage: p.bossStage,
            age: 0,
            maxAge: isBig ? 26 : 18,
            maxRadius: isBig ? 46 : 30,
          });

          spawnElementalImpactParticles(
            particlePoolRef.current,
            p.targetX,
            p.targetY,
            p.vfxElement,
            budget.particleScale,
            budget.maxParticles,
            { spellId: p.spellId, isCharged: p.isCharged }
          );
        } else {
          // Move towards target
          const angle = Math.atan2(dy, dx);
          const nextX = p.currentX + Math.cos(angle) * p.speed * dt;
          const nextY = p.currentY + Math.sin(angle) * p.speed * dt;

          // Emit element-specific flight trail particles
          emitProjectileTrail(particlePoolRef.current, p, budget.particleScale, budget.maxParticles);

          // Add to crisp trail
          const newTrail = [
            { x: p.currentX, y: p.currentY, alpha: 0.85 },
            ...p.trail.map((t) => ({ ...t, alpha: t.alpha - 0.16 })),
          ].filter((t) => t.alpha > 0);

          updated.push({
            ...p,
            currentX: nextX,
            currentY: nextY,
            trail: newTrail,
          });
        }
      });

      projectilesRef.current = updated;
      hitsToFire.forEach((cb) => cb());
    }

    // Draw active projectiles, particles, and impacts
    if (graphicsRef.current) {
      const g = graphicsRef.current;
      g.clear();

      impactsRef.current.forEach((imp) => {
        drawImpactEffect(g, imp, budget.enableSecondaryRings);
      });

      particlePoolRef.current.draw(g);

      projectilesRef.current.forEach((p) => {
        drawElementalProjectile(g, p);
      });
    }
  });

  return (
    <pixiContainer>
      <pixiGraphics ref={graphicsRef} draw={() => {}} />
    </pixiContainer>
  );
}
