import { Graphics as PixiGraphics } from 'pixi.js';

export type ParticleShape =
  | 'flame'
  | 'ember'
  | 'snowflake'
  | 'ice_shard'
  | 'spark'
  | 'rune'
  | 'bubble'
  | 'smoke'
  | 'heal_cross'
  | 'crimson_orb';

export interface VfxParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: number;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotSpeed: number;
  shape: ParticleShape;
  gravity: number;
  drag: number;
}

export class VfxParticlePool {
  private particles: VfxParticle[] = [];

  public get count(): number {
    return this.particles.length;
  }

  public spawn(p: Omit<VfxParticle, 'life'>, maxParticles: number): void {
    if (this.particles.length >= maxParticles) {
      // Evict oldest particle to stay strictly bounded
      this.particles.shift();
    }
    this.particles.push({ ...p, life: 0 });
  }

  public spawnBurst(
    _x: number,
    _y: number,
    count: number,
    maxParticles: number,
    factory: (idx: number) => Omit<VfxParticle, 'life'>
  ): void {
    const safeCount = Math.max(1, Math.round(count));
    for (let i = 0; i < safeCount; i++) {
      this.spawn(factory(i), maxParticles);
    }
  }

  public update(dt: number): void {
    if (this.particles.length === 0) return;
    const next: VfxParticle[] = [];
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) continue;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;
      next.push(p);
    }
    this.particles = next;
  }

  public draw(g: PixiGraphics): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const progress = p.life / p.maxLife;
      const alpha = Math.max(0, p.alpha * (1 - progress));
      const sz = Math.max(1, p.size * (p.shape === 'smoke' ? 1 + progress * 0.6 : 1 - progress * 0.45));

      switch (p.shape) {
        case 'flame': {
          // Pixel flame diamond + inner bright core
          g.poly([
            p.x, p.y - sz * 1.4,
            p.x + sz, p.y,
            p.x, p.y + sz * 0.8,
            p.x - sz, p.y,
          ]);
          g.fill({ color: p.color, alpha });
          g.rect(p.x - sz * 0.35, p.y - sz * 0.35, sz * 0.7, sz * 0.7);
          g.fill({ color: 0xfef08a, alpha: alpha * 0.85 });
          break;
        }
        case 'ember':
        case 'crimson_orb': {
          const rx = Math.round(p.x);
          const ry = Math.round(p.y);
          g.rect(rx - sz * 0.5, ry - sz * 0.5, sz, sz);
          g.fill({ color: p.color, alpha });
          break;
        }
        case 'snowflake': {
          const r = sz;
          g.moveTo(p.x - r, p.y);
          g.lineTo(p.x + r, p.y);
          g.moveTo(p.x, p.y - r);
          g.lineTo(p.x, p.y + r);
          g.stroke({ width: 1.5, color: p.color, alpha });
          break;
        }
        case 'ice_shard': {
          const c = Math.cos(p.rotation);
          const s = Math.sin(p.rotation);
          g.poly([
            p.x + c * sz * 1.6, p.y + s * sz * 1.6,
            p.x - s * sz * 0.5, p.y + c * sz * 0.5,
            p.x - c * sz * 1.2, p.y - s * sz * 1.2,
            p.x + s * sz * 0.5, p.y - c * sz * 0.5,
          ]);
          g.fill({ color: p.color, alpha });
          break;
        }
        case 'spark': {
          const ex = p.x + p.vx * 1.8;
          const ey = p.y + p.vy * 1.8;
          g.moveTo(p.x, p.y);
          g.lineTo(ex, ey);
          g.stroke({ width: 1.8, color: p.color, alpha });
          break;
        }
        case 'rune': {
          g.poly([
            p.x, p.y - sz,
            p.x + sz, p.y,
            p.x, p.y + sz,
            p.x - sz, p.y,
          ]);
          g.stroke({ width: 1.5, color: p.color, alpha });
          break;
        }
        case 'bubble': {
          g.circle(p.x, p.y, sz);
          g.stroke({ width: 1.5, color: p.color, alpha });
          g.rect(p.x - sz * 0.35, p.y - sz * 0.45, 2, 2);
          g.fill({ color: 0xbef264, alpha });
          break;
        }
        case 'smoke': {
          g.circle(p.x, p.y, sz);
          g.fill({ color: p.color, alpha: alpha * 0.5 });
          break;
        }
        case 'heal_cross': {
          const arm = sz;
          g.rect(p.x - arm * 0.28, p.y - arm, arm * 0.56, arm * 2);
          g.fill({ color: p.color, alpha });
          g.rect(p.x - arm, p.y - arm * 0.28, arm * 2, arm * 0.56);
          g.fill({ color: p.color, alpha });
          break;
        }
      }
    }
  }

  public clear(): void {
    this.particles = [];
  }
}
