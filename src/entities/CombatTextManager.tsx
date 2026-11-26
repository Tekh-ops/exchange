import { useEffect, useState } from 'react';
import { useTick } from '@pixi/react';
import { gameEvents } from '../engine/eventBus';
import { FloatingCombatTextPayload } from '../engine/types';

interface ActiveText extends FloatingCombatTextPayload {
  life: number;
  maxLife: number;
  currentY: number;
}

export function CombatTextManager() {
  const [items, setItems] = useState<ActiveText[]>([]);

  useEffect(() => {
    const unsub = gameEvents.on('SPAWN_COMBAT_TEXT', (payload) => {
      setItems((prev) => [
        ...prev,
        {
          ...payload,
          life: 1.0,
          maxLife: 1.0,
          currentY: payload.y,
        },
      ]);
    });
    return () => unsub();
  }, []);

  useTick((ticker) => {
    const dt = ticker.deltaTime * 0.025;
    setItems((prev) => {
      if (prev.length === 0) return prev;
      return prev
        .map((item) => ({
          ...item,
          currentY: item.currentY - dt * 25,
          life: item.life - dt,
        }))
        .filter((item) => item.life > 0);
    });
  });

  return (
    <pixiContainer>
      {items.map((item) => {
        const alpha = Math.min(1, item.life * 1.5);
        return (
          <pixiText
            key={item.id}
            text={item.text}
            x={item.x}
            y={item.currentY}
            anchor={0.5}
            alpha={alpha}
            style={{
              fontFamily: 'monospace',
              fontSize: item.size || 16,
              fontWeight: 'bold',
              fill: item.color,
              stroke: { color: 0x09070f, width: 3 },
            }}
          />
        );
      })}
    </pixiContainer>
  );
}
