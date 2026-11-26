import { describe, it, expect } from 'vitest';
import { gameEvents } from '../engine/eventBus';

describe('Typed Game Event Bus', () => {
  it('successfully emits and receives typed damage events', () => {
    let receivedTarget: string | null = null;
    let receivedAmount: number | null = null;

    const unsubscribe = gameEvents.on('DAMAGE_DEALT', (payload) => {
      receivedTarget = payload.targetId;
      receivedAmount = payload.amount;
    });

    gameEvents.emit('DAMAGE_DEALT', {
      targetId: 'enemy',
      amount: 45,
      type: 'arcane',
      isCritical: true,
    });

    expect(receivedTarget).toBe('enemy');
    expect(receivedAmount).toBe(45);

    // Unsubscribe
    unsubscribe();
    receivedAmount = null;

    gameEvents.emit('DAMAGE_DEALT', {
      targetId: 'enemy',
      amount: 20,
      type: 'arcane',
      isCritical: false,
    });

    expect(receivedAmount).toBeNull();
  });
});
