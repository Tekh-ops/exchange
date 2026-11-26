import { useEffect, useRef } from 'react';
import { Container as PixiContainer, Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
import { ArenaBackground } from './ArenaBackground';
import { WizardEntity } from '../entities/WizardEntity';
import { ProjectileManager } from '../entities/ProjectileManager';
import { CombatTextManager } from '../entities/CombatTextManager';
import { SpellEffectManager } from '../effects/SpellEffectManager';
import { useCombatStore } from '../stores/combatStore';
import { useGameStore } from '../stores/gameStore';
import { VFX_QUALITY_BUDGETS } from '../effects/ElementalEffects';
import { gameEvents } from '../engine/eventBus';
import { gameCamera } from '../engine/camera';
import { LANE_COORDS } from '../combat/LaneSystem';

interface Mote {
  x: number;
  y: number;
  vy: number;
  radius: number;
  color: number;
  alpha: number;
}

export function BattleScene() {
  const { player, enemies } = useCombatStore();
  const cameraContainerRef = useRef<PixiContainer | null>(null);
  const motesGraphicRef = useRef<PixiGraphics | null>(null);
  const motesRef = useRef<Mote[]>([]);

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

  useEffect(() => {
    const unsub = gameEvents.on('SCREEN_SHAKE', (payload) => {
      const { screenShake, vfxQuality } = useGameStore.getState().settings;
      if (!screenShake) return;
      const scale = VFX_QUALITY_BUDGETS[vfxQuality].shakeScale;
      gameCamera.triggerShake(payload.intensity * scale, payload.durationMs);
    });
    return () => unsub();
  }, []);

  useTick((ticker) => {
    const dt = ticker.deltaTime * (1 / 60);
    gameCamera.update(dt);

    if (cameraContainerRef.current) {
      const offset = gameCamera.getRenderOffset();
      cameraContainerRef.current.position.set(offset.x, offset.y);
    }

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

  const playerCoords = LANE_COORDS[player.lane ?? 'center'];

  return (
    <pixiContainer ref={cameraContainerRef}>
      <ArenaBackground />

      <pixiGraphics ref={motesGraphicRef} draw={() => {}} />

      {/* The Petty Sorcerer (Player, Left side at active lane) */}
      <WizardEntity
        type="player"
        entity={player}
        baseX={playerCoords.playerX}
        baseY={playerCoords.playerY}
      />

      {/* Active Encounter Enemies (Right side, positioned by lane) */}
      {enemies.map((inst, idx) => {
        const lane = inst.entity.lane ?? 'center';
        const coords = LANE_COORDS[lane];
        // Slight horizontal stagger if multiple enemies share a lane
        const sameLaneBefore = enemies
          .slice(0, idx)
          .filter((other) => (other.entity.lane ?? 'center') === lane).length;
        const xOffset = sameLaneBefore * 55;

        return (
          <WizardEntity
            key={inst.entity.id}
            type="enemy"
            entity={inst.entity}
            baseX={coords.enemyX + xOffset}
            baseY={coords.enemyY}
          />
        );
      })}

      <SpellEffectManager />
      <ProjectileManager />
      <CombatTextManager />
    </pixiContainer>
  );
}
