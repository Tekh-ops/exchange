import { create } from 'zustand';
import { CombatEntity, CombatTurnPhase, EnemyIntent, CombatLogEntry } from '../combat/combatTypes';
import { Spell, OffensiveElement, isOffensiveElement } from '../spells/types';
import { calculateSpellDamage, processStatusEffects } from '../combat/damageCalculator';
import { decideEnemyIntent, ENEMY_SPELLS } from '../ai/enemyAi';
import { gameEvents } from '../engine/eventBus';
import { soundEngine } from '../voice/soundEngine';
import { EnemyMemory } from '../ai/EnemyMemory';
import { AdaptationEngine } from '../ai/AdaptationEngine';
import { PredictionEngine, PredictionResult } from '../ai/PredictionEngine';
import { PredictabilitySystem, PredictabilityStage } from '../ai/PredictabilitySystem';
import { EnemyEmotionSystem, EnemyEmotion } from '../ai/EnemyEmotionSystem';
import { BossPersistenceManager } from '../ai/BossPersistence';
import { getContextualLine } from '../dialogue/banterData';
import { BattleRecorder } from '../history/BattleRecorder';
import { BattleRecord } from '../history/BattleRecord';
import { getBattleHistoryRepository } from '../history/BattleHistoryRepository';

interface CombatState {
  player: CombatEntity;
  enemy: CombatEntity;
  turnNumber: number;
  turnPhase: CombatTurnPhase;
  enemyIntent: EnemyIntent | null;
  activeSpells: Spell[];
  combatLogs: CombatLogEntry[];
  dialogueOpen: boolean;

  // Adaptive Intelligence & Emotional System State
  enemyMemory: EnemyMemory;
  adaptationEngine: AdaptationEngine;
  predictionEngine: PredictionEngine;
  predictabilitySystem: PredictabilitySystem;
  enemyEmotionSystem: EnemyEmotionSystem;
  currentEnemyEmotion: EnemyEmotion;
  currentEmotionReason: string;
  currentPrediction: PredictionResult | null;
  predictabilityScore: number;
  predictabilityStage: PredictabilityStage;
  elementResistances: Record<OffensiveElement, number>;
  lastPunishmentDescription: string | null;
  contextualRivalBanter: string | null;
  showAdaptivePanel: boolean;

  // Battle Chronicle
  battleRecorder: BattleRecorder | null;
  lastBattleRecord: BattleRecord | null;

  // Actions
  initBattle: (
    playerMaxHp: number, 
    playerMaxMana: number, 
    playerSpellPower: number, 
    playerCritRate: number,
    initialSpells: Spell[]
  ) => void;
  castSpell: (spellId: string) => void;
  triggerEnemyAction: () => void;
  concludeTurn: () => void;
  addLog: (text: string, type: 'player' | 'enemy' | 'system' | 'critical') => void;
  fleeBattle: () => void;
  closeDialogue: () => void;
  toggleAdaptivePanel: () => void;
}

const memoryInstance = new EnemyMemory({ bossId: 'malakor', windowSize: 12 });
const adaptationInstance = new AdaptationEngine({ bossId: 'malakor', maxResistance: 0.45 });
const predictionInstance = new PredictionEngine();
const predictabilityInstance = new PredictabilitySystem();
const emotionInstance = new EnemyEmotionSystem();

export const useCombatStore = create<CombatState>((set, get) => ({
  player: {
    id: 'player',
    name: 'The Petty Sorcerer',
    title: 'Self-Proclaimed Master of Minor Arcana',
    hp: 120,
    maxHp: 120,
    mana: 80,
    maxMana: 80,
    shield: 0,
    spellPower: 14,
    critRate: 0.1,
    statusEffects: [],
  },
  enemy: {
    id: 'enemy',
    name: 'Arch-Mage Malakor',
    title: 'The Pretentious Nethermancer',
    hp: 160,
    maxHp: 160,
    mana: 100,
    maxMana: 100,
    shield: 0,
    spellPower: 16,
    critRate: 0.12,
    statusEffects: [],
  },
  turnNumber: 1,
  turnPhase: 'player_turn',
  enemyIntent: null,
  activeSpells: [],
  combatLogs: [],
  dialogueOpen: true,

  // Adaptive Systems Initial State
  enemyMemory: memoryInstance,
  adaptationEngine: adaptationInstance,
  predictionEngine: predictionInstance,
  predictabilitySystem: predictabilityInstance,
  enemyEmotionSystem: emotionInstance,
  currentEnemyEmotion: 'neutral',
  currentEmotionReason: 'Arch-Mage Malakor observes your combat stance impassively.',
  currentPrediction: null,
  predictabilityScore: 0,
  predictabilityStage: 'unpredictable',
  elementResistances: {
    fire: 0,
    ice: 0,
    lightning: 0,
    arcane: 0,
    poison: 0,
  },
  lastPunishmentDescription: null,
  contextualRivalBanter: null,
  showAdaptivePanel: false,

  // Battle Chronicle
  battleRecorder: null,
  lastBattleRecord: null,

  initBattle: (playerMaxHp, playerMaxMana, playerSpellPower, playerCritRate, initialSpells) => {
    // Reset tactical memory & emotion
    memoryInstance.reset();
    emotionInstance.reset();

    // Initialize battle recorder
    const recorder = new BattleRecorder({
      gameMode: 'duel',
      opponentName: 'Arch-Mage Malakor',
      opponentId: 'malakor',
      bossName: 'Arch-Mage Malakor',
      bossId: 'malakor',
    });

    const playerEntity: CombatEntity = {
      id: 'player',
      name: 'The Petty Sorcerer',
      title: 'Disgruntled Magus',
      hp: playerMaxHp,
      maxHp: playerMaxHp,
      mana: playerMaxMana,
      maxMana: playerMaxMana,
      shield: 0,
      spellPower: playerSpellPower,
      critRate: playerCritRate,
      statusEffects: [],
    };

    const enemyEntity: CombatEntity = {
      id: 'enemy',
      name: 'Arch-Mage Malakor',
      title: 'The Pretentious Nethermancer',
      hp: 160,
      maxHp: 160,
      mana: 100,
      maxMana: 100,
      shield: 0,
      spellPower: 16,
      critRate: 0.12,
      statusEffects: [],
    };

    const intent = decideEnemyIntent(enemyEntity, playerEntity);
    const initialPrediction = predictionInstance.predictNextElement(memoryInstance);
    memoryInstance.recordPrediction({
      turn: 1,
      predictedElement: initialPrediction.predictedElement,
      confidence: initialPrediction.confidence,
      reason: initialPrediction.reason,
    });

    const initialResistances = adaptationInstance.getAllResistances(memoryInstance);

    set({
      player: playerEntity,
      enemy: enemyEntity,
      turnNumber: 1,
      turnPhase: 'player_turn',
      enemyIntent: intent,
      activeSpells: initialSpells.map(s => ({ ...s, currentCooldown: 0 })),
      combatLogs: [
        {
          id: 'log-0',
          text: '⚔️ Battle commenced in the Obsidian Spire! The Petty Sorcerer prepares to defend his questionable honor.',
          type: 'system',
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      dialogueOpen: true,
      currentEnemyEmotion: 'neutral',
      currentEmotionReason: 'Arch-Mage Malakor observes your combat stance impassively.',
      currentPrediction: initialPrediction,
      predictabilityScore: 0,
      predictabilityStage: 'unpredictable',
      elementResistances: initialResistances,
      lastPunishmentDescription: null,
      contextualRivalBanter: null,
      battleRecorder: recorder,
      lastBattleRecord: null,
    });

    gameEvents.emit('ENEMY_EMOTION_CHANGED', {
      emotion: 'neutral',
      reason: 'Battle commenced.',
    });
  },

  addLog: (text, type) => {
    set((state) => ({
      combatLogs: [
        {
          id: `log-${Date.now()}-${Math.random()}`,
          text,
          type,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...state.combatLogs.slice(0, 49),
      ],
    }));
  },

  closeDialogue: () => set({ dialogueOpen: false }),

  toggleAdaptivePanel: () => set((state) => ({ showAdaptivePanel: !state.showAdaptivePanel })),

  fleeBattle: () => {
    get().addLog('🏃 The Petty Sorcerer filed an emergency retreat tactical grievance!', 'system');
    set({ turnPhase: 'defeat' });
  },

  castSpell: (spellId: string) => {
    const { player, turnPhase, activeSpells, enemy, turnNumber, currentPrediction } = get();
    if (turnPhase !== 'player_turn') return;

    const spell = activeSpells.find((s) => s.id === spellId);
    // Reject cast if invalid or insufficient resources (does NOT record in memory!)
    if (!spell || player.mana < spell.manaCost || spell.currentCooldown > 0) return;

    // Deduct mana, apply cooldown
    const updatedSpells = activeSpells.map((s) =>
      s.id === spellId ? { ...s, currentCooldown: s.cooldownTurns } : s
    );

    set({
      turnPhase: 'player_casting',
      player: { ...player, mana: player.mana - spell.manaCost },
      activeSpells: updatedSpells,
    });

    // Sound effect and voice
    soundEngine.playSpellCast(spell.castAnimation);
    soundEngine.playWizardVoice('player');

    // Visual feedback
    gameEvents.emit('ENTITY_ANIMATION', { entityId: 'player', state: 'cast' });

    // Handle Defensive Actions
    if (!spell.isOffensive || spell.element === 'defense') {
      memoryInstance.recordDefensiveAction(turnNumber);

      // Record defensive cast in battle recorder
      const recorder = get().battleRecorder;
      if (recorder) {
        recorder.setTurn(turnNumber);
        recorder.recordPlayerSpellCast(spell.id, spell.name, spell.element, spell.manaCost, false);
      }

      setTimeout(() => {
        const shieldVal = spell.effects.find((e) => e.type === 'shield')?.value || 35;
        set((state) => ({
          player: { ...state.player, shield: state.player.shield + shieldVal },
          predictabilityScore: predictabilityInstance.calculatePredictabilityScore(memoryInstance),
          predictabilityStage: predictabilityInstance.getStage(memoryInstance),
        }));

        gameEvents.emit('SPAWN_COMBAT_TEXT', {
          id: `txt-${Date.now()}`,
          x: 270,
          y: 280,
          text: `SHIELD +${shieldVal}`,
          color: '#60a5fa',
        });
        get().addLog(`✨ The Petty Sorcerer conjured ${spell.name}! Absorbing ${shieldVal} damage.`, 'player');

        setTimeout(() => {
          get().triggerEnemyAction();
        }, 800);
      }, 400);
      return;
    }

    // Offensive Spell Execution
    const offensiveEl = isOffensiveElement(spell.element) ? spell.element : 'arcane';
    const prevConsecutiveCount = memoryInstance.getConsecutiveElementCount();
    const prevConsecutiveEl = memoryInstance.getConsecutiveElement();

    // 1. Evaluate Prediction Outcome
    let predictionWasCorrect = false;
    if (currentPrediction) {
      predictionWasCorrect = currentPrediction.predictedElement === offensiveEl;
      memoryInstance.resolveLatestPrediction(offensiveEl);

      if (predictionWasCorrect) {
        emotionInstance.evaluateEvent({ type: 'enemy_correct_prediction' }, enemy, player, memoryInstance);
        const banter = getContextualLine('correct_prediction');
        set({ contextualRivalBanter: banter });
        get().addLog(`🧠 Malakor correctly anticipated your ${offensiveEl.toUpperCase()}! "${banter}"`, 'enemy');
      } else {
        emotionInstance.evaluateEvent({ type: 'enemy_wrong_prediction' }, enemy, player, memoryInstance);
        const banter = getContextualLine('incorrect_prediction');
        set({ contextualRivalBanter: banter });
      }
    }

    // 2. Check Strategy Change vs Repetition
    if (prevConsecutiveCount >= 3 && prevConsecutiveEl !== offensiveEl) {
      // Player broke pattern
      emotionInstance.evaluateEvent({ type: 'player_change_strategy' }, enemy, player, memoryInstance);
      const banter = getContextualLine('player_change_strategy');
      set({ contextualRivalBanter: banter });
      get().addLog(`🔄 Strategy Shift! "${banter}"`, 'player');
    } else if (prevConsecutiveEl === offensiveEl) {
      // Player repeated element
      emotionInstance.evaluateEvent({ type: 'player_repeat_spell' }, enemy, player, memoryInstance);
      if (prevConsecutiveCount >= 2) {
        const banter = getContextualLine('repeated_spell');
        set({ contextualRivalBanter: banter });
      }
    }

    // 3. Record Offensive Cast in Enemy Memory
    memoryInstance.recordOffensiveAction(spell.id, offensiveEl, turnNumber);

    // 4. Calculate Adaptation Resistance
    const currentResistance = adaptationInstance.calculateResistance(offensiveEl, memoryInstance);

    // 5. Evaluate Anti-Repetition Punishments
    const punishment = predictabilityInstance.evaluatePunishment(offensiveEl, memoryInstance, currentResistance);

    // Update live predictability & resistance states
    const updatedResistances = adaptationInstance.getAllResistances(memoryInstance);
    const score = predictabilityInstance.calculatePredictabilityScore(memoryInstance);
    const stage = predictabilityInstance.getStage(memoryInstance);
    const emotionState = emotionInstance.getState();

    set({
      elementResistances: updatedResistances,
      predictabilityScore: score,
      predictabilityStage: stage,
      currentEnemyEmotion: emotionState.currentEmotion,
      currentEmotionReason: emotionState.reason,
      lastPunishmentDescription: punishment.triggered ? punishment.reason : null,
    });

    gameEvents.emit('ENEMY_EMOTION_CHANGED', {
      emotion: emotionState.currentEmotion,
      reason: emotionState.reason,
    });

    // 6. Fire Projectile
    const projectileColors: Record<OffensiveElement, number> = {
      fire: 0xef4444,
      ice: 0x38bdf8,
      lightning: 0xfacc15,
      arcane: 0xa855f7,
      poison: 0x10b981,
    };

    gameEvents.emit('PROJECTILE_FIRED', {
      id: `proj-${Date.now()}`,
      type: spell.projectileType || 'arcane_bolt',
      startX: 290,
      startY: 330,
      targetX: 670,
      targetY: 330,
      speed: 12,
      color: projectileColors[offensiveEl] || 0xa855f7,
      onHit: () => {
        let currentEnemy = get().enemy;
        let isCrit = false;

        // Apply punishment effects if triggered
        if (punishment.triggered) {
          if (punishment.shieldBonus) {
            currentEnemy = {
              ...currentEnemy,
              shield: currentEnemy.shield + punishment.shieldBonus,
            };
            set({ enemy: currentEnemy });
            gameEvents.emit('SPAWN_COMBAT_TEXT', {
              id: `punish-shield-${Date.now()}`,
              x: 690,
              y: 290,
              text: `PUNISH WARD +${punishment.shieldBonus}`,
              color: '#60a5fa',
              size: 14,
            });
          }

          if (punishment.counterDamage) {
            // Immediate counter retaliatory strike
            const counterHp = Math.max(0, get().player.hp - punishment.counterDamage);
            set((state) => ({ player: { ...state.player, hp: counterHp } }));
            soundEngine.playHit(false);
            gameEvents.emit('SCREEN_SHAKE', { intensity: 9, durationMs: 200 });
            gameEvents.emit('SPAWN_COMBAT_TEXT', {
              id: `counter-hit-${Date.now()}`,
              x: 270,
              y: 280,
              text: `COUNTER -${punishment.counterDamage}`,
              color: '#f87171',
              size: 15,
            });
            get().addLog(`⚡ ${punishment.reason}`, 'enemy');
          } else {
            get().addLog(`🛡️ ${punishment.reason}`, 'enemy');
          }
        }

        // Calculate and apply spell damage
        spell.effects.forEach((eff) => {
          if (eff.type === 'damage') {
            const deflection = punishment.deflectionPercent || 0;
            const calc = calculateSpellDamage(
              get().player,
              currentEnemy,
              eff.value,
              currentResistance,
              deflection
            );
            isCrit = calc.isCritical;

            // Damage enemy
            const newEnemyHp = Math.max(0, currentEnemy.hp - calc.finalDamage);
            set({
              enemy: {
                ...currentEnemy,
                hp: newEnemyHp,
                shield: calc.remainingShield,
              },
            });

            // Camera shake & hit sound
            soundEngine.playHit(isCrit);
            gameEvents.emit('SCREEN_SHAKE', { intensity: isCrit ? 12 : 7, durationMs: 250 });
            gameEvents.emit('ENTITY_ANIMATION', { entityId: 'enemy', state: 'hurt' });

            // Floating combat text
            gameEvents.emit('SPAWN_COMBAT_TEXT', {
              id: `txt-${Date.now()}`,
              x: 690,
              y: 260,
              text: calc.absorbedByShield > 0 && calc.finalDamage === 0
                ? 'BLOCKED!'
                : `${isCrit ? 'CRITICAL! ' : ''}-${calc.finalDamage}`,
              color: isCrit ? '#facc15' : '#ef4444',
              size: isCrit ? 20 : 16,
            });

            // Log damage and resistance feedback
            if (calc.resistedAmount > 0) {
              get().addLog(
                `⚡ ${spell.name} dealt ${calc.finalDamage} ${offensiveEl.toUpperCase()} damage (Malakor resisted ${calc.resistedAmount} [${calc.resistancePercent}% resistance]!)`,
                'player'
              );
            } else {
              get().addLog(
                `⚡ ${spell.name} blasted Arch-Mage Malakor for ${calc.finalDamage} damage! ${isCrit ? '(CRITICAL HIT)' : ''}`,
                'player'
              );
            }

            // Check emotional reaction to damage
            emotionInstance.evaluateEvent({
              type: 'enemy_substantial_damage',
              damageTaken: calc.finalDamage,
              isCritical: isCrit,
            }, get().enemy, get().player, memoryInstance);

            const postHitEmotion = emotionInstance.getState();
            set({
              currentEnemyEmotion: postHitEmotion.currentEmotion,
              currentEmotionReason: postHitEmotion.reason,
            });
            gameEvents.emit('ENEMY_EMOTION_CHANGED', {
              emotion: postHitEmotion.currentEmotion,
              reason: postHitEmotion.reason,
            });
          } else if (eff.type === 'mana_restore') {
            const newMana = Math.min(get().player.maxMana, get().player.mana + eff.value);
            set((state) => ({ player: { ...state.player, mana: newMana } }));
          } else if (eff.type === 'heal') {
            const newHp = Math.min(get().player.maxHp, get().player.hp + eff.value);
            set((state) => ({ player: { ...state.player, hp: newHp } }));
            gameEvents.emit('SPAWN_COMBAT_TEXT', {
              id: `heal-${Date.now()}`,
              x: 270,
              y: 280,
              text: `+${eff.value} HP`,
              color: '#34d399',
            });
          }
        });

        // Check if enemy defeated
        if (get().enemy.hp <= 0) {
          emotionInstance.evaluateEvent({ type: 'enemy_defeated' }, get().enemy, get().player, memoryInstance);
          const topElement = memoryInstance.getMostFrequentElement().element;
          BossPersistenceManager.recordEncounterOutcome('malakor', true, topElement);

          setTimeout(() => {
            set({
              turnPhase: 'victory',
              currentEnemyEmotion: 'defeated',
            });
            soundEngine.playVictoryFanfare();
            gameEvents.emit('ENTITY_ANIMATION', { entityId: 'enemy', state: 'defeat' });
            gameEvents.emit('ENTITY_ANIMATION', { entityId: 'player', state: 'victory' });
            gameEvents.emit('ENEMY_EMOTION_CHANGED', {
              emotion: 'defeated',
              reason: 'Humiliated and bested by minor arcana!',
            });
            get().addLog('🏆 VICTORY! Arch-Mage Malakor has been humiliated and routed!', 'critical');
          }, 400);
          return;
        }

        // Pass to enemy turn
        setTimeout(() => {
          get().triggerEnemyAction();
        }, 700);
      },
    });
  },

  triggerEnemyAction: () => {
    const { enemy, enemyIntent } = get();
    if (get().turnPhase === 'victory' || get().turnPhase === 'defeat') return;

    set({ turnPhase: 'enemy_turn' });
    const actionKey = enemyIntent ? enemyIntent.spellId : 'void_bolt';
    const action = ENEMY_SPELLS[actionKey] || ENEMY_SPELLS.void_bolt;

    setTimeout(() => {
      set({ turnPhase: 'enemy_casting' });
      soundEngine.playSpellCast(action.castAnimation);
      soundEngine.playWizardVoice('enemy');
      gameEvents.emit('ENTITY_ANIMATION', { entityId: 'enemy', state: 'cast' });

      // If it's a defensive shield
      if (action.type === 'defense') {
        const shieldVal = action.shieldValue || 30;
        set((state) => ({
          enemy: { ...state.enemy, shield: state.enemy.shield + shieldVal },
        }));
        gameEvents.emit('SPAWN_COMBAT_TEXT', {
          id: `txt-${Date.now()}`,
          x: 690,
          y: 280,
          text: `SHIELD +${shieldVal}`,
          color: '#34d399',
        });
        get().addLog(`🛡️ Malakor wove ${action.name}! Shielding for ${shieldVal} points.`, 'enemy');

        setTimeout(() => {
          get().concludeTurn();
        }, 700);
        return;
      }

      // Fire projectile from enemy to player
      gameEvents.emit('PROJECTILE_FIRED', {
        id: `proj-${Date.now()}`,
        type: action.projectileType,
        startX: 650,
        startY: 330,
        targetX: 290,
        targetY: 330,
        speed: 12,
        color: 0x10b981,
        onHit: () => {
          const currentPlayer = get().player;
          const calc = calculateSpellDamage(enemy, currentPlayer, action.baseDamage);

          const newPlayerHp = Math.max(0, currentPlayer.hp - calc.finalDamage);
          set({
            player: {
              ...currentPlayer,
              hp: newPlayerHp,
              shield: calc.remainingShield,
            },
          });

          // Camera shake and hit sound
          soundEngine.playHit(calc.isCritical);
          gameEvents.emit('SCREEN_SHAKE', { intensity: calc.isCritical ? 14 : 8, durationMs: 280 });
          gameEvents.emit('ENTITY_ANIMATION', { entityId: 'player', state: 'hurt' });

          // Combat text
          gameEvents.emit('SPAWN_COMBAT_TEXT', {
            id: `txt-${Date.now()}`,
            x: 270,
            y: 260,
            text: calc.absorbedByShield > 0 && calc.finalDamage === 0
              ? 'BLOCKED!'
              : `-${calc.finalDamage}`,
            color: '#ef4444',
          });

          get().addLog(
            `💥 ${action.name} struck you for ${calc.finalDamage} damage! ${calc.isCritical ? '(CRITICAL)' : ''}`,
            'enemy'
          );

          // Check if player defeated
          if (newPlayerHp <= 0) {
            emotionInstance.evaluateEvent({ type: 'player_defeated' }, get().enemy, get().player, memoryInstance);
            const topElement = memoryInstance.getMostFrequentElement().element;
            BossPersistenceManager.recordEncounterOutcome('malakor', false, topElement);

            setTimeout(() => {
              set({
                turnPhase: 'defeat',
                currentEnemyEmotion: 'triumphant',
              });
              gameEvents.emit('ENTITY_ANIMATION', { entityId: 'player', state: 'defeat' });
              gameEvents.emit('ENTITY_ANIMATION', { entityId: 'enemy', state: 'victory' });
              gameEvents.emit('ENEMY_EMOTION_CHANGED', {
                emotion: 'triumphant',
                reason: 'Crushed your petty insurrection!',
              });
              get().addLog('☠️ DEFEAT! The Petty Sorcerer was sent sprawling into the dungeon dust.', 'critical');
            }, 400);
            return;
          }

          setTimeout(() => {
            get().concludeTurn();
          }, 600);
        },
      });
    }, 500);
  },

  concludeTurn: () => {
    const { player, enemy, turnNumber, activeSpells } = get();

    // Process status effects
    const playerProcessed = processStatusEffects(player);
    const enemyProcessed = processStatusEffects(enemy);

    // Decrement spell cooldowns
    const decrementedSpells = activeSpells.map((s) => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1),
    }));

    // Natural mana regen
    const regenPlayer = {
      ...playerProcessed.updatedEntity,
      mana: Math.min(player.maxMana, playerProcessed.updatedEntity.mana + 10),
    };
    const regenEnemy = {
      ...enemyProcessed.updatedEntity,
      mana: Math.min(enemy.maxMana, enemyProcessed.updatedEntity.mana + 10),
    };

    // Calculate next enemy intent & generate prediction for next player action
    const nextIntent = decideEnemyIntent(regenEnemy, regenPlayer);
    const nextPrediction = predictionInstance.predictNextElement(memoryInstance);
    memoryInstance.recordPrediction({
      turn: turnNumber + 1,
      predictedElement: nextPrediction.predictedElement,
      confidence: nextPrediction.confidence,
      reason: nextPrediction.reason,
    });

    // Update natural turn emotional decay
    emotionInstance.evaluateEvent({ type: 'turn_passed' }, regenEnemy, regenPlayer, memoryInstance);
    const emotionState = emotionInstance.getState();
    const updatedResistances = adaptationInstance.getAllResistances(memoryInstance);
    const score = predictabilityInstance.calculatePredictabilityScore(memoryInstance);
    const stage = predictabilityInstance.getStage(memoryInstance);

    set({
      player: regenPlayer,
      enemy: regenEnemy,
      turnNumber: turnNumber + 1,
      turnPhase: 'player_turn',
      activeSpells: decrementedSpells,
      enemyIntent: nextIntent,
      currentPrediction: nextPrediction,
      elementResistances: updatedResistances,
      predictabilityScore: score,
      predictabilityStage: stage,
      currentEnemyEmotion: emotionState.currentEmotion,
      currentEmotionReason: emotionState.reason,
    });

    gameEvents.emit('ENTITY_ANIMATION', { entityId: 'player', state: 'idle' });
    gameEvents.emit('ENTITY_ANIMATION', { entityId: 'enemy', state: 'idle' });
    gameEvents.emit('ENEMY_EMOTION_CHANGED', {
      emotion: emotionState.currentEmotion,
      reason: emotionState.reason,
    });
  },
}));
