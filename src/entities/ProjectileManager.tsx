import { useEffect, useRef, useState } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
import { gameEvents } from '../engine/eventBus';
import { ProjectileEventPayload } from '../engine/types';

interface ActiveProjectile extends ProjectileEventPayload {
  currentX: number;
  currentY: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface Explosion {
  id: string;
  x: number;
  y: number;
  color: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export function ProjectileManager() {
  const [projectiles, setProjectiles] = useState<ActiveProjectile[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const graphicsRef = useRef<PixiGraphics | null>(null);

  // Subscribe to fired projectiles
  useEffect(() => {
    const unsub = gameEvents.on('PROJECTILE_FIRED', (payload) => {
      setProjectiles((prev) => [
        ...prev,
        {
          ...payload,
          currentX: payload.startX,
          currentY: payload.startY,
          trail: [],
        },
      ]);
    });
    return () => unsub();
  }, []);

  // Update projectile flights & explosion animations
  useTick((ticker) => {
    const dt = ticker.deltaTime;

    // Update explosions
    explosionsRef.current = explosionsRef.current
      .map((exp) => ({
        ...exp,
        radius: exp.radius + dt * 2.5,
        alpha: exp.alpha - dt * 0.04,
      }))
      .filter((exp) => exp.alpha > 0);

    // Update projectiles
    setProjectiles((prev) => {
      if (prev.length === 0) return prev;
      const updated: ActiveProjectile[] = [];

      prev.forEach((p) => {
        const dx = p.targetX - p.currentX;
        const dy = p.targetY - p.currentY;
        const dist = Math.hypot(dx, dy);

        // Arrived at target
        if (dist <= p.speed * dt * 1.5) {
          // Trigger impact callback
          if (p.onHit) {
            p.onHit();
          }

          // Spawn impact explosion ring
          explosionsRef.current.push({
            id: `exp-${Date.now()}-${Math.random()}`,
            x: p.targetX,
            y: p.targetY,
            color: p.color,
            radius: 4,
            maxRadius: 28,
            alpha: 1,
          });
        } else {
          // Move towards target
          const angle = Math.atan2(dy, dx);
          const nextX = p.currentX + Math.cos(angle) * p.speed * dt;
          const nextY = p.currentY + Math.sin(angle) * p.speed * dt;

          // Add to trail
          const newTrail = [
            { x: p.currentX, y: p.currentY, alpha: 0.8 },
            ...p.trail.map((t) => ({ ...t, alpha: t.alpha - 0.15 })),
          ].filter((t) => t.alpha > 0);

          updated.push({
            ...p,
            currentX: nextX,
            currentY: nextY,
            trail: newTrail,
          });
        }
      });

      return updated;
    });

    // Draw active projectiles and explosions
    if (graphicsRef.current) {
      const g = graphicsRef.current;
      g.clear();

      // Render explosions
      explosionsRef.current.forEach((exp) => {
        g.circle(exp.x, exp.y, exp.radius);
        g.stroke({ width: 3, color: exp.color, alpha: exp.alpha });
        g.circle(exp.x, exp.y, exp.radius * 0.5);
        g.fill({ color: 0xffffff, alpha: exp.alpha * 0.8 });
      });

      // Render projectiles
      projectiles.forEach((p) => {
        // Draw trail
        p.trail.forEach((t) => {
          g.circle(t.x, t.y, 4);
          g.fill({ color: p.color, alpha: t.alpha * 0.4 });
        });

        // Draw projectile core
        g.circle(p.currentX, p.currentY, 7);
        g.fill({ color: p.color });
        g.circle(p.currentX, p.currentY, 3.5);
        g.fill({ color: 0xffffff });
      });
    }
  });

  return (
    <pixiContainer>
      <pixiGraphics ref={graphicsRef} draw={() => {}} />
    </pixiContainer>
  );
}
