import { useEffect, useRef, useState } from 'react';
import { Sprite as PixiSprite, Container as PixiContainer, Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
import { TextureCache } from './pixelTextures';
import { gameEvents } from '../engine/eventBus';
import { CombatEntity } from '../combat/combatTypes';
import { EnemyEmotion } from '../ai/EnemyEmotionSystem';

interface WizardEntityProps {
  type: 'player' | 'enemy';
  entity: CombatEntity;
  baseX: number;
  baseY: number;
}

export function WizardEntity({ type, entity, baseX, baseY }: WizardEntityProps) {
  const containerRef = useRef<PixiContainer | null>(null);
  const spriteRef = useRef<PixiSprite | null>(null);
  const shieldRef = useRef<PixiGraphics | null>(null);
  const hpBarRef = useRef<PixiGraphics | null>(null);
  const emotionFxRef = useRef<PixiGraphics | null>(null);

  const [animState, setAnimState] = useState<'idle' | 'cast' | 'hurt' | 'victory' | 'defeat'>('idle');
  const [currentEmotion, setCurrentEmotion] = useState<EnemyEmotion>('neutral');
  const animTimerRef = useRef(0);
  const timeRef = useRef(0);

  // Subscribe to typed animation requests
  useEffect(() => {
    const unsubAnim = gameEvents.on('ENTITY_ANIMATION', (data) => {
      if (data.entityId === entity.id || data.entityId === type) {
        setAnimState(data.state);
        animTimerRef.current = 0;
      }
    });

    // Subscribe to emotion changes if this is the enemy
    const unsubEmotion = gameEvents.on('ENEMY_EMOTION_CHANGED', (data) => {
      if (type === 'enemy' && (!data.entityId || data.entityId === entity.id)) {
        setCurrentEmotion(data.emotion);
      }
    });

    return () => {
      unsubAnim();
      unsubEmotion();
    };
  }, [type, entity.id]);

  // Animation frame loop
  useTick((ticker) => {
    const dt = ticker.deltaTime * 0.05;
    timeRef.current += dt;
    animTimerRef.current += dt;

    if (!containerRef.current || !spriteRef.current) return;

    let offsetX = 0;
    let offsetY = 0;
    let rotation = 0;
    let scaleY = entity.bossId === 'vorath' ? 2.65 : 2.4;
    const scaleX = type === 'player' ? 2.4 : entity.bossId === 'vorath' ? -2.65 : -2.4; // Enemy faces left

    const effectiveState = entity.hp <= 0 ? 'defeat' : animState;

    // Basic Action Animations
    switch (effectiveState) {
      case 'idle':
        // Breathing bob
        offsetY = Math.sin(timeRef.current * 3) * 4;
        scaleY = 2.4 + Math.sin(timeRef.current * 3) * 0.05;
        break;

      case 'cast': {
        const thrust = Math.sin(Math.min(Math.PI, animTimerRef.current * 8)) * 18;
        offsetX = type === 'player' ? thrust : -thrust;
        offsetY = -Math.abs(Math.sin(animTimerRef.current * 8)) * 8;
        if (animTimerRef.current > 0.5) {
          setAnimState('idle');
        }
        break;
      }

      case 'hurt': {
        const recoil = Math.sin(animTimerRef.current * 30) * 8;
        offsetX = (type === 'player' ? -1 : 1) * 10 + recoil;
        if (animTimerRef.current > 0.35) {
          setAnimState('idle');
        }
        break;
      }

      case 'victory': {
        offsetY = -Math.abs(Math.sin(timeRef.current * 6)) * 22;
        break;
      }

      case 'defeat': {
        offsetY = 16;
        rotation = type === 'player' ? -0.4 : 0.4;
        break;
      }
    }

    // Enemy Emotional Behavior Visual Modifiers (Posture, Tremble, Auras)
    if (type === 'enemy' && animState === 'idle') {
      switch (currentEmotion) {
        case 'amused':
          // Smug confident sway & head bob
          offsetY += Math.sin(timeRef.current * 5) * 3;
          rotation = Math.sin(timeRef.current * 3) * 0.06;
          break;

        case 'confident':
          // Stately upright posture
          scaleY = 2.48;
          offsetY -= 4;
          break;

        case 'surprised':
          // Recoiled posture, startled freeze
          offsetX += 8;
          offsetY -= 2;
          scaleY = 2.5;
          break;

        case 'frustrated':
          // Rapid impatient jitter
          offsetX += (Math.random() - 0.5) * 3;
          offsetY += (Math.random() - 0.5) * 2;
          break;

        case 'angry':
          // Aggressive forward lean & rapid heavy breathing
          offsetX -= 8;
          scaleY = 2.4 + Math.sin(timeRef.current * 9) * 0.12;
          rotation = -0.08;
          break;

        case 'desperate':
          // Hunched defensive posture, flickering
          offsetY += 10;
          scaleY = 2.2;
          rotation = 0.08;
          break;

        case 'fearful':
          // Trembling backward crouch
          offsetX += 12 + (Math.random() - 0.5) * 3;
          offsetY += 8;
          scaleY = 2.15;
          break;

        case 'triumphant':
          offsetY = -14 + Math.sin(timeRef.current * 4) * 6;
          rotation = Math.sin(timeRef.current * 2) * 0.1;
          break;
      }
    }

    containerRef.current.position.set(baseX + offsetX, baseY + offsetY);
    spriteRef.current.scale.set(scaleX, scaleY);
    spriteRef.current.rotation = rotation;
    spriteRef.current.alpha = entity.hp <= 0 ? 0.45 : 1;

    // Render Emotion Auras and FX
    if (emotionFxRef.current && type === 'enemy') {
      const efx = emotionFxRef.current;
      efx.clear();

      if (entity.hp > 0) {
        if (entity.isStaggered) {
          const spin = timeRef.current * 6;
          for (let s = 0; s < 3; s++) {
            const ang = spin + (s * Math.PI * 2) / 3;
            efx.circle(Math.cos(ang) * 22, -56 + Math.sin(ang) * 6, 3.5);
            efx.fill({ color: 0xfacc15, alpha: 0.95 });
          }
        }

        // Orbiting status effect indicators (poison, burn, frost, weaken)
        entity.statusEffects.forEach((st, idx) => {
          const statusColor =
            st.type === 'poison'
              ? 0x10b981
              : st.type === 'burn'
              ? 0xf97316
              : st.type === 'frost'
              ? 0x38bdf8
              : 0xa855f7;
          const ang = timeRef.current * 3 + idx * 2.1;
          efx.circle(Math.cos(ang) * 34, 10 + Math.sin(ang) * 14, 3);
          efx.fill({ color: statusColor, alpha: 0.9 });
        });

        switch (currentEmotion) {
        case 'angry': {
          // Radiating aggressive crimson aura
          const pulse = Math.sin(timeRef.current * 12) * 6;
          efx.ellipse(0, 0, 48 + pulse, 58 + pulse);
          efx.stroke({ width: 3, color: 0xef4444, alpha: 0.8 });
          efx.ellipse(0, 0, 44 + pulse, 54 + pulse);
          efx.fill({ color: 0xb91c1c, alpha: 0.25 });
          break;
        }

        case 'amused': {
          // Golden sparkle above head
          const sparkY = -60 + Math.sin(timeRef.current * 4) * 4;
          efx.circle(8, sparkY, 3);
          efx.fill({ color: 0xfacc15, alpha: 0.9 });
          efx.circle(-10, sparkY - 8, 2);
          efx.fill({ color: 0xd4af37, alpha: 0.7 });
          break;
        }

        case 'confident': {
          // Emerald ground rune
          efx.ellipse(0, 40, 50, 14);
          efx.stroke({ width: 2, color: 0x10b981, alpha: 0.7 });
          break;
        }

        case 'surprised': {
          // Exclamation alert above head
          efx.rect(-3, -76, 6, 14);
          efx.fill({ color: 0x38bdf8 });
          efx.rect(-3, -58, 6, 5);
          efx.fill({ color: 0x38bdf8 });
          break;
        }

        case 'frustrated': {
          // Impatient steam/ember puffs
          const puffY = -50 - (timeRef.current * 30) % 25;
          efx.circle(-8, puffY, 3);
          efx.fill({ color: 0x9ca3af, alpha: 0.6 });
          efx.circle(6, puffY - 6, 2.5);
          efx.fill({ color: 0x9ca3af, alpha: 0.5 });
          break;
        }

        case 'desperate': {
          // Unstable flickering dark-purple aura
          const flicker = Math.random() * 8;
          efx.ellipse(0, 6, 42 + flicker, 48 + flicker);
          efx.stroke({ width: 2, color: 0x7c3aed, alpha: 0.7 });
          efx.ellipse(0, 6, 40 + flicker, 46 + flicker);
          efx.fill({ color: 0x4c1d95, alpha: 0.25 });
          break;
        }

        case 'fearful': {
          // Pale ghostly shimmer
          const fearPulse = Math.sin(timeRef.current * 16) * 4;
          efx.ellipse(0, 6, 38 + fearPulse, 44 + fearPulse);
          efx.stroke({ width: 1.5, color: 0x94a3b8, alpha: 0.6 });
          break;
        }
        }
      }
    }

    // Redraw HP Bar
    if (hpBarRef.current) {
      const g = hpBarRef.current;
      g.clear();

      const barWidth = 90;
      const barHeight = 8;
      const hpPercent = Math.max(0, entity.hp / entity.maxHp);

      // Bar background
      g.rect(-barWidth / 2, -75, barWidth, barHeight);
      g.fill({ color: 0x09070f });
      g.rect(-barWidth / 2, -75, barWidth, barHeight);
      g.stroke({ width: 1, color: 0x302747 });

      // Health fill
      const fillColor = type === 'player' ? 0x22c55e : 0xef4444;
      g.rect(-barWidth / 2, -75, barWidth * hpPercent, barHeight);
      g.fill({ color: fillColor });

      // Shield overlay if present
      if (entity.shield > 0) {
        g.rect(-barWidth / 2, -81, barWidth, 4);
        g.fill({ color: 0x09070f });
        g.rect(-barWidth / 2, -81, Math.min(barWidth, (entity.shield / 50) * barWidth), 4);
        g.fill({ color: 0x60a5fa });
      }
    }

    // Shield dome graphic
    if (shieldRef.current) {
      const s = shieldRef.current;
      s.clear();
      if (entity.shield > 0) {
        const pulse = Math.sin(timeRef.current * 4) * 0.15;
        s.ellipse(0, 0, 48 + pulse * 10, 56 + pulse * 10);
        s.stroke({ width: 2, color: type === 'player' ? 0x60a5fa : 0x10b981 });
        s.fill({ color: type === 'player' ? 0x60a5fa : 0x10b981, alpha: 0.15 + pulse * 0.05 });
      }
    }
  });

  const texture =
    type === 'player'
      ? TextureCache['player_sorcerer']
      : entity.bossId === 'vorath' && TextureCache['enemy_vorath']
      ? TextureCache['enemy_vorath']
      : TextureCache['enemy_malakor'];

  return (
    <pixiContainer ref={containerRef} x={baseX} y={baseY}>
      {/* Emotion Visual FX (Auras, Puffs, Sparks) */}
      <pixiGraphics ref={emotionFxRef} draw={() => {}} />

      {/* Barrier Shield Dome */}
      <pixiGraphics ref={shieldRef} draw={() => {}} />

      {/* Wizard Sprite */}
      {texture && (
        <pixiSprite
          ref={spriteRef}
          texture={texture}
          anchor={0.5}
        />
      )}

      {/* Overhead Status & HP Bar */}
      <pixiGraphics ref={hpBarRef} draw={() => {}} />
    </pixiContainer>
  );
}
