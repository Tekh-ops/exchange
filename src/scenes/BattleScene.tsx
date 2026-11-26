import { useEffect, useRef } from 'react';
import { Container as PixiContainer, Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
import { ArenaBackground } from './ArenaBackground';
import { WizardEntity } from '../entities/WizardEntity';
import { ProjectileManager } from '../entities/ProjectileManager';
import { CombatTextManager } from '../entities/CombatTextManager';
import { useCombatStore } from '../stores/combatStore';
import { gameEvents } from '../engine/eventBus';
import { gameCamera } from '../engine/camera';

interface Mote {
  x: number;
  y: number;
  vy: number;
  radius: number;
  color: number;
  alpha: number;
}

export function BattleScene() {
  const { player, enemy } = useCombatStore();
  const cameraContainerRef = useRef<PixiContainer | null>(null);
  const motesGraphicRef = useRef<PixiGraphics | null>(null);
  const motesRef = useRef<Mote[]>([]);

  // Initialize ambient magical particles
  useEffect(() => {
    const list: Mote[] = [];
    for (let i = 0; i < 30; i++) {
      list.push({
        x: Math.random() * 960,
        y: 360 + Math.random() * 180,
        vy: 0.4 + Math.random() * 0.8,
        radius: 1 + Math.random() * 2,
        color: Math.random() > 0.4 ? 0xa855f7 : 0xf59e0b,
        alpha: 0.3 + Math.random() * 0.5,
      });
    }
    motesRef.current = list;
  }, []);

  // Listen to screen shake events
  useEffect(() => {
    const unsub = gameEvents.on('SCREEN_SHAKE', (payload) => {
      gameCamera.triggerShake(payload.intensity, payload.durationMs);
    });
    return () => unsub();
  }, []);

  // Frame tick: update camera & ambient motes
  useTick((ticker) => {
    const dt = ticker.deltaTime * (1 / 60);
    gameCamera.update(dt);

    if (cameraContainerRef.current) {
      const offset = gameCamera.getRenderOffset();
      cameraContainerRef.current.position.set(offset.x, offset.y);
    }

    // Update ambient motes
    if (motesGraphicRef.current) {
      const g = motesGraphicRef.current;
      g.clear();

      motesRef.current.forEach((mote) => {
        mote.y -= mote.vy * ticker.deltaTime;
        mote.x += Math.sin(mote.y * 0.05) * 0.4;
        if (mote.y < 120) {
          mote.y = 520;
          mote.x = Math.random() * 960;
        }
        g.circle(mote.x, mote.y, mote.radius);
        g.fill({ color: mote.color, alpha: mote.alpha });
      });
    }
  });

  return (
    <pixiContainer ref={cameraContainerRef}>
      {/* Dark Fantasy Castle Environment */}
      <ArenaBackground />

      {/* Floating Arcane Embers */}
      <pixiGraphics ref={motesGraphicRef} draw={() => {}} />

      {/* The Petty Sorcerer (Player, Left) */}
      <WizardEntity
        type="player"
        entity={player}
        baseX={260}
        baseY={370}
      />

      {/* Arch-Mage Malakor (Enemy, Right) */}
      <WizardEntity
        type="enemy"
        entity={enemy}
        baseX={700}
        baseY={370}
      />

      {/* Projectiles (Spells traveling in flight) */}
      <ProjectileManager />

      {/* In-world Floating Damage Numbers */}
      <CombatTextManager />
    </pixiContainer>
  );
}
