import { create } from 'zustand';
import { CombatEntity, CombatTurnPhase, EnemyIntent, CombatLogEntry, Lane } from '../combat/combatTypes';
import { Spell, OffensiveElement, isOffensiveElement } from '../spells/types';
import { calculateSpellDamage, processStatusEffects } from '../combat/damageCalculator';
import { ENEMY_SPELLS } from '../ai/enemyAi';
import { gameEvents } from '../engine/eventBus';
import { soundEngine } from '../voice/soundEngine';
import { EnemyMemory } from '../ai/EnemyMemory';
import { AdaptationEngine } from '../ai/AdaptationEngine';
import { PredictionEngine, PredictionResult } from '../ai/PredictionEngine';
import { PredictabilitySystem, PredictabilityStage } from '../ai/PredictabilitySystem';
import { EnemyEmotionSystem, EnemyEmotion } from '../ai/EnemyEmotionSystem';
import { BossPersistenceManager } from '../ai/BossPersistence';
import { getContextualLine, getVorathAdaptiveBanter } from '../dialogue/banterData';
import { BattleRecorder } from '../history/BattleRecorder';
import { BattleRecord } from '../history/BattleRecord';
import { getBattleHistoryRepository } from '../history/BattleHistoryRepository';
import { EncounterManager, EnemyInstance } from '../encounters/EncounterManager';
import { EncounterDefinition, ENEMY_TEMPLATES } from '../encounters/EncounterDefinition';
import { BossPhaseManager } from '../encounters/BossPhaseManager';
import { EnemyCoordination } from '../ai/EnemyCoordination';
import { resolveSpellTargets } from '../combat/TargetingSystem';
import { DodgeSystem, DodgeType, DODGE_COSTS } from '../combat/DodgeSystem';
import { HealingSystem } from '../combat/HealingSystem';
import { PostureSystem } from '../combat/PostureSystem';
import { ChargingSystem, ChargedSpellState } from '../combat/ChargingSystem';
import { getNextLane, LANE_COORDS } from '../combat/LaneSystem';

export interface CombatEquipmentBonuses {
  chargeCostReduction?: number;
  dodgeEfficiencyBonus?: number;
  postureDamageMultiplier?: number;
  healingBonusMultiplier?: number;
  synergyBonusMultiplier?: number;
  damageReduction?: number;
  manaRegenBonus?: number;
  manaCostReduction?: number;
  playerLevel?: number;
}

interface CombatState {
  player: CombatEntity;
  enemy: CombatEntity; // Primary/selected enemy for backward-compatible HUD & tests
  enemies: EnemyInstance[];
  selectedTargetId: string | null;
  activeEncounter: EncounterDefinition;
  turnNumber: number;
  turnPhase: CombatTurnPhase;
  enemyIntent: EnemyIntent | null;
  activeSpells: Spell[];
  combatLogs: CombatLogEntry[];
  dialogueOpen: boolean;

  // Phase 9 Tactical State
  activeDodge: DodgeType | null;
  consecutiveDodges: number;
  perfectDodgeBuff: boolean;
  chargedSpell: ChargedSpellState | null;
  chargingMode: boolean;
  recentDamageTaken: number;
  equipBonuses: CombatEquipmentBonuses;

  // Adaptive Intelligence & Emotional System State (mirrored from selected/primary enemy)
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
    initialSpells: Spell[],
    encounterId?: string,
    equipBonuses?: CombatEquipmentBonuses
  ) => void;
  selectTarget: (enemyId: string) => void;
  moveLane: (direction: 'left' | 'right' | 'center') => { success: boolean; reason?: string };
  toggleChargingMode: () => void;
  performDodge: (dodgeType: DodgeType, targetLane?: Lane) => { success: boolean; reason?: string };
  castSpell: (spellId: string, options?: { charge?: boolean; viaVoice?: boolean }) => { success: boolean; reason?: string };
  triggerEnemyAction: () => void;
  concludeTurn: () => void;
  addLog: (text: string, type: 'player' | 'enemy' | 'system' | 'critical') => void;
  fleeBattle: () => void;
  closeDialogue: () => void;
  toggleAdaptivePanel: () => void;
}

const defaultEncounter = EncounterManager.getEncounter('solo_malakor');
const initialInstances = EncounterManager.createEnemyInstances(defaultEncounter);
const primaryInitial = initialInstances[0];

function syncPrimaryEnemyFields(enemies: EnemyInstance[], selectedTargetId: string | null) {
  const living = enemies.filter((e) => e.entity.hp > 0);
  const selected =
    living.find((e) => e.entity.id === selectedTargetId) ||
    living[0] ||
    enemies[0];

  return {
    enemy: selected.entity,
    selectedTargetId: selected.entity.id,
    enemyIntent: selected.currentIntent,
    enemyMemory: selected.memory,
    adaptationEngine: selected.adaptation,
    predictionEngine: selected.predictionEngine,
    predictabilitySystem: selected.predictability,
    enemyEmotionSystem: selected.emotionSystem,
    currentEnemyEmotion: selected.currentEmotion,
    currentEmotionReason: selected.currentEmotionReason,
    currentPrediction: selected.currentPrediction,
    predictabilityScore: selected.predictabilityScore,
    predictabilityStage: selected.predictabilityStage,
    elementResistances: selected.elementResistances,
    lastPunishmentDescription: selected.lastPunishmentDescription,
  };
}

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
    lane: 'center',
    stamina: 100,
    maxStamina: 100,
    posture: 0,
    maxPosture: 60,
  },
  enemy: primaryInitial.entity,
  enemies: initialInstances,
  selectedTargetId: primaryInitial.entity.id,
  activeEncounter: defaultEncounter,
  turnNumber: 1,
  turnPhase: 'player_turn',
  enemyIntent: null,
  activeSpells: [],
  combatLogs: [],
  dialogueOpen: true,

  activeDodge: null,
  consecutiveDodges: 0,
  perfectDodgeBuff: false,
  chargedSpell: null,
  chargingMode: false,
  recentDamageTaken: 0,
  equipBonuses: {},

  enemyMemory: primaryInitial.memory,
  adaptationEngine: primaryInitial.adaptation,
  predictionEngine: primaryInitial.predictionEngine,
  predictabilitySystem: primaryInitial.predictability,
  enemyEmotionSystem: primaryInitial.emotionSystem,
  currentEnemyEmotion: 'neutral',
  currentEmotionReason: 'Arch-Mage Malakor observes your combat stance impassively.',
  currentPrediction: null,
  predictabilityScore: 0,
  predictabilityStage: 'unpredictable',
  elementResistances: { fire: 0, ice: 0, lightning: 0, arcane: 0, poison: 0 },
  lastPunishmentDescription: null,
  contextualRivalBanter: null,
  showAdaptivePanel: false,

  battleRecorder: null,
  lastBattleRecord: null,

  initBattle: (
    playerMaxHp,
    playerMaxMana,
    playerSpellPower,
    playerCritRate,
    initialSpells,
    encounterId = 'solo_malakor',
    equipBonuses = {}
  ) => {
    const encounter = EncounterManager.getEncounter(encounterId);
    const instances = EncounterManager.createEnemyInstances(encounter);
    const primaryBoss = instances.find((i) => i.entity.isBoss) || instances[0];

    const recorder = new BattleRecorder({
      gameMode: encounter.enemies.length > 1 ? 'campaign' : 'duel',
      opponentName: encounter.name,
      opponentId: encounter.id,
      bossName: primaryBoss.entity.isBoss ? primaryBoss.entity.name : undefined,
      bossId: primaryBoss.entity.bossId,
    });
    recorder.setTotalEnemies(instances.length);

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
      lane: 'center',
      stamina: 100,
      maxStamina: 100,
      posture: 0,
      maxPosture: 60,
    };

    const allLivingEntities = instances.map((i) => i.entity);

    instances.forEach((inst) => {
      const pred = inst.predictionEngine.predictNextElement(inst.memory);
      inst.memory.recordPrediction({
        turn: 1,
        predictedElement: pred.predictedElement,
        confidence: pred.confidence,
        reason: pred.reason,
      });
      inst.currentPrediction = pred;
      inst.currentIntent = EnemyCoordination.decideCoordinatedIntent(
        inst.entity,
        allLivingEntities,
        playerEntity
      );
    });

    if (instances[0].currentPrediction) {
      recorder.recordPrediction(
        instances[0].currentPrediction.predictedElement,
        instances[0].currentPrediction.confidence
      );
    }

    const synced = syncPrimaryEnemyFields(instances, instances[0].entity.id);
    const vorathBanter =
      primaryBoss.entity.bossId === 'vorath'
        ? getVorathAdaptiveBanter(BossPersistenceManager.loadBossMemory('vorath'))
        : null;

    set({
      player: playerEntity,
      enemies: instances,
      activeEncounter: encounter,
      turnNumber: 1,
      turnPhase: 'player_turn',
      activeSpells: initialSpells.map((s) => ({ ...s, currentCooldown: 0 })),
      combatLogs: [
        {
          id: 'log-0',
          text: `⚔️ Encounter: ${encounter.name} (${instances.length} ${instances.length === 1 ? 'foe' : 'foes'})!`,
          type: 'system',
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      dialogueOpen: true,
      activeDodge: null,
      consecutiveDodges: 0,
      perfectDodgeBuff: false,
      chargedSpell: null,
      chargingMode: false,
      recentDamageTaken: 0,
      equipBonuses,
      contextualRivalBanter: vorathBanter,
      battleRecorder: recorder,
      lastBattleRecord: null,
      ...synced,
    });

    gameEvents.emit('ENEMY_EMOTION_CHANGED', {
      emotion: 'neutral',
      reason: 'Battle commenced.',
    });
  },

  selectTarget: (enemyId: string) => {
    const { enemies, turnPhase } = get();
    if (turnPhase === 'victory' || turnPhase === 'defeat') return;
    const found = enemies.find((e) => e.entity.id === enemyId && e.entity.hp > 0);
    if (!found) return;

    found.memory.recordTargetSelection(enemyId);
    const synced = syncPrimaryEnemyFields(enemies, enemyId);
    set({ ...synced });
  },

  moveLane: (direction: 'left' | 'right' | 'center') => {
    const { player, turnPhase, battleRecorder } = get();
    if (turnPhase !== 'player_turn') {
      return { success: false, reason: 'Can only move lanes during your turn.' };
    }

    const currentLane: Lane = player.lane ?? 'center';
    const nextLane: Lane = direction === 'center' ? 'center' : getNextLane(currentLane, direction);

    if (nextLane === currentLane) {
      return { success: false, reason: `Already in ${currentLane.toUpperCase()} lane.` };
    }

    const stamina = player.stamina ?? 100;
    const moveCost = 10;
    if (stamina < moveCost) {
      get().addLog(`⚡ Not enough Stamina (${stamina}/${moveCost}) to shift lanes!`, 'system');
      return { success: false, reason: 'Not enough Stamina to shift lanes.' };
    }

    set({
      player: { ...player, lane: nextLane, stamina: stamina - moveCost },
    });

    get().enemies.forEach((inst) => {
      if (inst.entity.hp > 0) inst.memory.recordPlayerLane(nextLane);
    });
    if (battleRecorder) battleRecorder.recordLaneChange(nextLane);
    get().addLog(`🏃 Shifted to ${nextLane.toUpperCase()} lane (-${moveCost} Stamina).`, 'player');

    return { success: true };
  },

  toggleChargingMode: () => set((s) => ({ chargingMode: !s.chargingMode })),

  performDodge: (dodgeType: DodgeType, targetLane?: Lane) => {
    const { player, turnPhase, consecutiveDodges, battleRecorder } = get();
    if (turnPhase !== 'player_turn') {
      return { success: false, reason: 'Cannot dodge outside your turn.' };
    }

    const stamina = player.stamina ?? 100;
    const check = DodgeSystem.canAffordDodge(dodgeType, stamina, player.mana);
    if (!check.canAfford) {
      get().addLog(`⚠️ Cannot ${dodgeType.replace('_', ' ')}: ${check.reason}`, 'system');
      return { success: false, reason: check.reason };
    }

    const cost = DODGE_COSTS[dodgeType];
    let nextLane: Lane = player.lane ?? 'center';
    if (dodgeType === 'arcane_blink') {
      if (targetLane) {
        nextLane = targetLane;
      } else {
        const telegraph = get().enemyIntent?.telegraph;
        const safe = (['left', 'center', 'right'] as Lane[]).find(
          (l) => l !== nextLane && (!telegraph || !telegraph.targetLanes.includes(l))
        );
        nextLane = safe || (nextLane === 'center' ? 'left' : 'center');
      }
      if (battleRecorder && nextLane !== player.lane) {
        battleRecorder.recordLaneChange(nextLane);
      }
    }

    set({
      turnPhase: 'player_casting',
      activeDodge: dodgeType,
      consecutiveDodges: consecutiveDodges + 1,
      player: {
        ...player,
        lane: nextLane,
        stamina: stamina - cost.staminaCost,
        mana: player.mana - cost.manaCost,
      },
    });

    get().enemies.forEach((inst) => {
      if (inst.entity.hp > 0) {
        inst.memory.recordPlayerDodge(dodgeType);
        inst.memory.recordPlayerLane(nextLane);
      }
    });

    const label =
      dodgeType === 'perfect_dodge'
        ? '⚡ Perfect Dodge Stance'
        : dodgeType === 'arcane_blink'
        ? `✨ Arcane Blink -> ${nextLane.toUpperCase()} Lane`
        : '💨 Quickstep Evasion';

    get().addLog(`${label} prepared!`, 'player');
    soundEngine.playSpellCast('shield');

    setTimeout(() => {
      get().triggerEnemyAction();
    }, 500);

    return { success: true };
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
    const { battleRecorder, turnNumber, enemies } = get();
    if (battleRecorder && !battleRecorder.isFinalized()) {
      const defeatedCount = enemies.filter((e) => e.entity.hp <= 0).length;
      const record = battleRecorder.finalize('fled', turnNumber, {
        xpEarned: 0,
        goldEarned: 0,
        itemsEarned: [],
        levelBefore: 0,
        levelAfter: 0,
        unlocksEarned: [],
      });
      if (record) {
        if (record.advancedCombat) record.advancedCombat.enemiesDefeated = defeatedCount;
        set({ lastBattleRecord: record });
        getBattleHistoryRepository().saveRecord(record).catch(() => {});
      }
    }
    set({ turnPhase: 'defeat' });
  },

  castSpell: (spellId: string, options?: { charge?: boolean; viaVoice?: boolean }) => {
    const {
      player,
      turnPhase,
      activeSpells,
      enemies,
      selectedTargetId,
      turnNumber,
      chargingMode,
      chargedSpell,
      perfectDodgeBuff,
      recentDamageTaken,
      equipBonuses,
      battleRecorder,
      activeEncounter,
    } = get();

    if (turnPhase !== 'player_turn') {
      return { success: false, reason: 'Not your turn.' };
    }

    const spell = activeSpells.find((s) => s.id === spellId);
    if (!spell) {
      return { success: false, reason: `Spell "${spellId}" is not prepared.` };
    }

    if (spell.currentCooldown > 0) {
      const msg = `${spell.name} is on cooldown (${spell.currentCooldown} turns left).`;
      get().addLog(`⏳ ${msg}`, 'system');
      return { success: false, reason: msg };
    }

    const releasingCharged = chargedSpell !== null && chargedSpell.spellId === spellId;
    const wantsCharge = !releasingCharged && Boolean(options?.charge ?? chargingMode);

    if (wantsCharge) {
      const chargeCheck = ChargingSystem.canStartCharge(
        spell,
        player.mana,
        equipBonuses.chargeCostReduction ?? 0
      );
      if (!chargeCheck.valid) {
        get().addLog(`⚠️ ${chargeCheck.reason}`, 'system');
        return { success: false, reason: chargeCheck.reason };
      }

      set({
        turnPhase: 'player_casting',
        chargingMode: false,
        player: { ...player, mana: player.mana - chargeCheck.totalCost },
        chargedSpell: {
          spellId: spell.id,
          spellName: spell.name,
          targetId: selectedTargetId,
          bonusManaPaid: chargeCheck.totalCost - spell.manaCost,
          turnsRemaining: 1,
        },
      });

      enemies.forEach((inst) => {
        if (inst.entity.hp > 0) inst.memory.recordChargedCast();
      });
      if (battleRecorder) {
        battleRecorder.setTurn(turnNumber);
        battleRecorder.recordChargedSpell(spell.name);
        if (options?.viaVoice) battleRecorder.recordVoiceAttempt(true, spell.name);
      }

      soundEngine.playSpellCast(spell.castAnimation);
      const chargeCoords = LANE_COORDS[player.lane ?? 'center'];
      gameEvents.emit('ENTITY_ANIMATION', { entityId: 'player', state: 'cast' });
      gameEvents.emit('SPELL_CAST_EFFECT', {
        spellId: spell.id,
        source: 'player',
        target: 'player',
        element: isOffensiveElement(spell.element) ? spell.element : 'arcane',
        isCharged: true,
        startX: chargeCoords.playerX,
        startY: chargeCoords.playerY,
      });
      get().addLog(
        `🔮 Charging ${spell.name}! (${chargeCheck.totalCost} MP — Keep your shield up until next turn!)`,
        'player'
      );

      setTimeout(() => {
        get().triggerEnemyAction();
      }, 650);

      return { success: true };
    }

    const manaCostRed = spell.manaCost > 10 ? (equipBonuses.manaCostReduction ?? 0) : 0;
    const manaNeeded = releasingCharged ? 0 : Math.max(1, spell.manaCost - manaCostRed);
    if (player.mana < manaNeeded) {
      const msg = `Not enough mana to cast ${spell.name}.`;
      get().addLog(`⚠️ ${msg}`, 'system');
      return { success: false, reason: msg };
    }

    const playerLane: Lane = player.lane ?? 'center';
    const overrideRule = releasingCharged ? spell.chargeTargetRule : undefined;
    const targetRes = resolveSpellTargets(
      spell,
      playerLane,
      enemies.map((e) => e.entity),
      selectedTargetId,
      overrideRule
    );

    if (!targetRes.valid) {
      get().addLog(`🎯 ${targetRes.reason}`, 'system');
      return { success: false, reason: targetRes.reason };
    }

    const updatedSpells = activeSpells.map((s) =>
      s.id === spellId ? { ...s, currentCooldown: s.cooldownTurns } : s
    );

    set({
      turnPhase: 'player_casting',
      player: { ...player, mana: player.mana - manaNeeded },
      activeSpells: updatedSpells,
      chargedSpell: releasingCharged ? null : chargedSpell,
      perfectDodgeBuff: false,
    });

    if (battleRecorder) {
      battleRecorder.setTurn(turnNumber);
      battleRecorder.recordPlayerSpellCast(
        spell.id,
        spell.name,
        spell.element,
        manaNeeded,
        spell.isOffensive
      );
      if (options?.viaVoice) battleRecorder.recordVoiceAttempt(true, spell.name);
    }

    soundEngine.playSpellCast(spell.castAnimation);
    soundEngine.playWizardVoice('player');
    gameEvents.emit('ENTITY_ANIMATION', { entityId: 'player', state: 'cast' });

    if (!spell.isOffensive || spell.element === 'defense') {
      enemies.forEach((inst) => {
        if (inst.entity.hp > 0) {
          inst.memory.recordDefensiveAction(turnNumber);
          if (player.hp / player.maxHp <= 0.35) inst.memory.recordLowHpHeal();
        }
      });

      const pCoords = LANE_COORDS[playerLane];
      const isHealSpell = spell.effects.some((e) => e.type === 'heal' || e.type === 'reversal_heal');
      gameEvents.emit('SPELL_CAST_EFFECT', {
        spellId: spell.id,
        source: 'player',
        target: 'player',
        element: isHealSpell ? 'heal' : 'defense',
        startX: pCoords.playerX,
        startY: pCoords.playerY,
        targetX: pCoords.playerX,
        targetY: pCoords.playerY,
      });
      if (isHealSpell) {
        soundEngine.playHealChime();
      } else {
        soundEngine.playShieldResonance();
      }

      setTimeout(() => {
        const healMult = equipBonuses.healingBonusMultiplier ?? 1.0;
        let currentP = get().player;
        const pNowCoords = LANE_COORDS[currentP.lane ?? 'center'];

        spell.effects.forEach((eff) => {
          if (eff.type === 'shield') {
            currentP = { ...currentP, shield: currentP.shield + eff.value };
            gameEvents.emit('SPAWN_COMBAT_TEXT', {
              id: `txt-${Date.now()}`,
              x: pNowCoords.playerX,
              y: pNowCoords.playerY - 90,
              text: `SHIELD +${eff.value}`,
              color: '#60a5fa',
            });
            get().addLog(`🛡️ Cast ${spell.name}! Absorbing ${eff.value} damage.`, 'player');
          } else if (eff.type === 'heal' || eff.type === 'reversal_heal') {
            const rawHeal =
              eff.type === 'reversal_heal'
                ? HealingSystem.calculateReversalHeal(recentDamageTaken, eff.value / 100)
                : eff.value;
            const res = HealingSystem.applyHealing(currentP, rawHeal, healMult);
            currentP = { ...currentP, hp: res.newHp };
            if (battleRecorder) {
              battleRecorder.recordHealing(res.actualHealed, false);
              if (res.wastedHealing > 0) battleRecorder.recordWastedHealing(res.wastedHealing);
            }
            gameEvents.emit('SPAWN_COMBAT_TEXT', {
              id: `heal-${Date.now()}`,
              x: pNowCoords.playerX,
              y: pNowCoords.playerY - 95,
              text: `+${res.actualHealed} HP`,
              color: '#34d399',
            });
            get().addLog(`💚 ${spell.name} restored ${res.actualHealed} HP!`, 'player');
          }
        });

        currentP = PostureSystem.recoverPosture(currentP, 15);
        set({ player: currentP });

        setTimeout(() => {
          get().triggerEnemyAction();
        }, 700);
      }, 400);
      return { success: true };
    }

    const offensiveEl = isOffensiveElement(spell.element) ? spell.element : 'arcane';
    const chargeMult = releasingCharged ? (spell.chargeDamageMultiplier ?? 1.5) : 1.0;
    const dodgeMult = perfectDodgeBuff ? 1.25 : 1.0;
    const totalSpellMult = chargeMult * dodgeMult;

    const projectileColors: Record<OffensiveElement, number> = {
      fire: 0xef4444,
      ice: 0x38bdf8,
      lightning: 0xfacc15,
      arcane: 0xa855f7,
      poison: 0x10b981,
    };

    const primaryTarget = targetRes.targets[0];
    const pStartCoords = LANE_COORDS[playerLane];
    const eTargetCoords = LANE_COORDS[primaryTarget?.lane ?? 'center'];
    const projSpeed = offensiveEl === 'lightning' ? 18 : spell.id === 'pyro_tantrum' ? 10 : 12;

    gameEvents.emit('PROJECTILE_FIRED', {
      id: `proj-${Date.now()}`,
      type: spell.projectileType || 'arcane_bolt',
      startX: pStartCoords.playerX + 30,
      startY: pStartCoords.playerY - 30,
      targetX: eTargetCoords.enemyX - 20,
      targetY: eTargetCoords.enemyY - 30,
      speed: projSpeed,
      color: projectileColors[offensiveEl] || 0xa855f7,
      spellId: spell.id,
      element: offensiveEl,
      isCharged: releasingCharged,
      onHit: () => {
        const currentEnemies = [...get().enemies];
        let totalActualDamageForLifesteal = 0;
        let currentPlayer = get().player;
        const postureMult = equipBonuses.postureDamageMultiplier ?? 1.0;
        const healMult = equipBonuses.healingBonusMultiplier ?? 1.0;

        targetRes.targets.forEach((tgt) => {
          const idx = currentEnemies.findIndex((e) => e.entity.id === tgt.id);
          if (idx < 0) return;

          const inst = currentEnemies[idx];
          const prevConsecutiveCount = inst.memory.getConsecutiveElementCount();
          const prevConsecutiveEl = inst.memory.getConsecutiveElement();

          if (inst.currentPrediction) {
            const wasCorrect = inst.currentPrediction.predictedElement === offensiveEl;
            inst.memory.resolveLatestPrediction(offensiveEl);
            if (idx === 0 && battleRecorder) {
              battleRecorder.recordPredictionOutcome(wasCorrect, offensiveEl);
            }
            if (wasCorrect) {
              inst.emotionSystem.evaluateEvent(
                { type: 'enemy_correct_prediction' },
                inst.entity,
                currentPlayer,
                inst.memory
              );
              if (inst.entity.id === get().selectedTargetId) {
                const banter = getContextualLine('correct_prediction');
                set({ contextualRivalBanter: banter });
              }
            } else {
              inst.emotionSystem.evaluateEvent(
                { type: 'enemy_wrong_prediction' },
                inst.entity,
                currentPlayer,
                inst.memory
              );
            }
          }

          if (prevConsecutiveCount >= 3 && prevConsecutiveEl !== offensiveEl) {
            inst.emotionSystem.evaluateEvent(
              { type: 'player_change_strategy' },
              inst.entity,
              currentPlayer,
              inst.memory
            );
            if (idx === 0 && battleRecorder) battleRecorder.recordStrategyChange();
          } else if (prevConsecutiveEl === offensiveEl) {
            inst.emotionSystem.evaluateEvent(
              { type: 'player_repeat_spell' },
              inst.entity,
              currentPlayer,
              inst.memory
            );
          }

          inst.memory.recordOffensiveAction(spell.id, offensiveEl, turnNumber);

          const resistance = inst.adaptation.calculateResistance(offensiveEl, inst.memory);
          const punishment = inst.predictability.evaluatePunishment(
            offensiveEl,
            inst.memory,
            resistance
          );

          inst.elementResistances = inst.adaptation.getAllResistances(inst.memory);
          inst.predictabilityScore = inst.predictability.calculatePredictabilityScore(inst.memory);
          inst.predictabilityStage = inst.predictability.getStage(inst.memory);
          inst.lastPunishmentDescription = punishment.triggered ? punishment.reason : null;

          if (idx === 0 && battleRecorder) {
            battleRecorder.recordResistanceUpdate(inst.elementResistances);
            if (punishment.triggered) battleRecorder.recordPunishment(punishment.reason);
          }

          if (punishment.triggered) {
            if (punishment.shieldBonus) {
              inst.entity = {
                ...inst.entity,
                shield: inst.entity.shield + punishment.shieldBonus,
              };
            }
            if (punishment.counterDamage) {
              currentPlayer = {
                ...currentPlayer,
                hp: Math.max(0, currentPlayer.hp - punishment.counterDamage),
              };
              if (battleRecorder) {
                battleRecorder.recordDamageReceived(punishment.counterDamage, false, false);
              }
              get().addLog(`⚡ ${punishment.reason}`, 'enemy');
            } else {
              get().addLog(`🛡️ ${punishment.reason}`, 'enemy');
            }
          }

          const synergy = ChargingSystem.evaluateSynergy(offensiveEl, inst.entity);
          if (synergy.triggered) {
            get().addLog(`✨ ${synergy.name}: ${synergy.description}`, 'critical');
          }

          spell.effects.forEach((eff) => {
            if (eff.type === 'damage') {
              const attrSynergyBoost = synergy.triggered
                ? (equipBonuses.synergyBonusMultiplier ?? 1.0)
                : 1.0;
              const scaledBase = Math.round(
                eff.value * totalSpellMult * synergy.bonusMultiplier * attrSynergyBoost
              );
              const calc = calculateSpellDamage(
                currentPlayer,
                inst.entity,
                scaledBase,
                resistance,
                punishment.deflectionPercent || 0
              );

              const newHp = Math.max(0, inst.entity.hp - calc.finalDamage);
              totalActualDamageForLifesteal += calc.finalDamage;

              inst.entity = {
                ...inst.entity,
                hp: newHp,
                shield: calc.remainingShield,
              };

              const postureAmt = (spell.postureDamage ?? 10) * (releasingCharged ? 1.5 : 1.0);
              const postRes = PostureSystem.applyPostureDamage(inst.entity, postureAmt, postureMult);
              inst.entity = postRes.updatedEntity;

              if (battleRecorder) {
                battleRecorder.recordDamageDealt(calc.finalDamage, calc.isCritical, offensiveEl);
                battleRecorder.recordPostureAndStagger(
                  postRes.postureDamageDealt,
                  postRes.triggeredStagger,
                  inst.entity.name
                );
              }

              if (postRes.triggeredStagger) {
                get().addLog(`💫 ${inst.entity.name} is STAGGERED!`, 'critical');
              }

              const hitCoords = LANE_COORDS[inst.entity.lane ?? 'center'];
              soundEngine.playElementalImpact(offensiveEl, calc.isCritical);
              gameEvents.emit('SCREEN_SHAKE', {
                intensity: calc.isCritical || releasingCharged || spell.id === 'pyro_tantrum' ? 13 : 7,
                durationMs: 250,
              });
              gameEvents.emit('ENTITY_ANIMATION', { entityId: inst.entity.id, state: 'hurt' });
              gameEvents.emit('SPAWN_COMBAT_TEXT', {
                id: `txt-${Date.now()}-${inst.entity.id}`,
                x: hitCoords.enemyX,
                y: hitCoords.enemyY - 95,
                text: `${releasingCharged ? 'CHARGED! ' : ''}${calc.isCritical ? 'CRIT! ' : ''}-${calc.finalDamage}`,
                color: calc.isCritical ? '#facc15' : '#ef4444',
                size: calc.isCritical || releasingCharged ? 19 : 16,
              });

              get().addLog(
                `⚡ ${spell.name} hit ${inst.entity.name} for ${calc.finalDamage} ${offensiveEl.toUpperCase()} DMG${calc.resistedAmount > 0 ? ` (${calc.resistancePercent}% resisted)` : ''}!`,
                'player'
              );

              const stageRes = BossPhaseManager.evaluateStageTransition(inst.entity);
              if (stageRes.transitioned && stageRes.config) {
                inst.entity = stageRes.updatedEntity;
                if (stageRes.config.shiftsLane) {
                  const nextBossLane: Lane =
                    (['left', 'center', 'right'] as Lane[]).find((l) => l !== inst.entity.lane) ??
                    'right';
                  inst.entity = { ...inst.entity, lane: nextBossLane };
                  get().addLog(
                    `🌑 ${inst.entity.name} phase-shifted into the ${nextBossLane.toUpperCase()} lane!`,
                    'enemy'
                  );
                }
                if (stageRes.config.phaseShieldBonus) {
                  get().addLog(
                    `🛡️ ${inst.entity.name} erupted with a +${stageRes.config.phaseShieldBonus} Phase Barrier!`,
                    'enemy'
                  );
                }
                if (battleRecorder) {
                  battleRecorder.recordBossStageTransition(inst.entity.name, stageRes.newStage);
                }
                set({ contextualRivalBanter: stageRes.config.transitionDialogue });
                get().addLog(
                  `🔥 ${inst.entity.name} entered ${stageRes.config.title}!`,
                  'critical'
                );

                // Summon construct/ally if configured for this boss phase (up to 3 living enemies)
                const livingCount = currentEnemies.filter((e) => e.entity.hp > 0).length;
                if (stageRes.config.summonTemplateId && livingCount < 3) {
                  const tpl = ENEMY_TEMPLATES[stageRes.config.summonTemplateId];
                  if (tpl) {
                    const usedLanes = new Set(
                      currentEnemies.filter((e) => e.entity.hp > 0).map((e) => e.entity.lane ?? 'center')
                    );
                    const openLane: Lane =
                      (['left', 'right', 'center'] as Lane[]).find((l) => !usedLanes.has(l)) ?? 'right';
                    const summonedInst = EncounterManager.createEnemyInstances({
                      id: 'summon',
                      name: 'Summon',
                      subtitle: '',
                      difficulty: 'duel',
                      description: '',
                      enemies: [{ ...tpl, lane: openLane }],
                      rewards: { xp: 0, gold: 0 },
                    })[0];
                    summonedInst.entity.id = `${tpl.id}_summon_${Date.now()}`;
                    summonedInst.currentIntent = EnemyCoordination.decideCoordinatedIntent(
                      summonedInst.entity,
                      currentEnemies.map((e) => e.entity),
                      currentPlayer
                    );
                    currentEnemies.push(summonedInst);
                    get().addLog(
                      `✨ ${inst.entity.name} summoned ${summonedInst.entity.name} in ${openLane.toUpperCase()} lane!`,
                      'enemy'
                    );
                  }
                }
              }

              if (newHp <= 0) {
                inst.emotionSystem.evaluateEvent({ type: 'enemy_defeated' }, inst.entity, currentPlayer, inst.memory);
                if (battleRecorder) battleRecorder.recordEnemyDefeated(inst.entity.name);
                get().addLog(`💀 ${inst.entity.name} was defeated!`, 'critical');
              } else {
                inst.emotionSystem.evaluateEvent(
                  { type: 'enemy_substantial_damage', damageTaken: calc.finalDamage, isCritical: calc.isCritical },
                  inst.entity,
                  currentPlayer,
                  inst.memory
                );
              }

              const em = inst.emotionSystem.getState();
              inst.currentEmotion = em.currentEmotion;
              inst.currentEmotionReason = em.reason;
              gameEvents.emit('ENEMY_EMOTION_CHANGED', {
                entityId: inst.entity.id,
                emotion: em.currentEmotion,
                reason: em.reason,
              });
            } else if (eff.type === 'status' && eff.statusType && inst.entity.hp > 0) {
              const statusEff = {
                id: `st-${eff.statusType}-${Date.now()}`,
                type: eff.statusType,
                name: eff.statusType.toUpperCase(),
                turnsRemaining: eff.durationTurns ?? 2,
                value: eff.value,
              };
              inst.entity = {
                ...inst.entity,
                statusEffects: [...inst.entity.statusEffects, statusEff],
              };
              if (battleRecorder) battleRecorder.recordStatusEffect(statusEff.name, 'enemy');
            }
          });
        });

        spell.effects.forEach((eff) => {
          if (eff.type === 'mana_restore') {
            currentPlayer = {
              ...currentPlayer,
              mana: Math.min(currentPlayer.maxMana, currentPlayer.mana + eff.value),
            };
          } else if (eff.type === 'heal') {
            const res = HealingSystem.applyHealing(currentPlayer, eff.value, healMult);
            currentPlayer = { ...currentPlayer, hp: res.newHp };
            if (battleRecorder) battleRecorder.recordHealing(res.actualHealed, false);
          }
        });

        const effectiveLifestealRatio = Math.max(0.2, spell.lifestealRatio ?? 0);
        if (totalActualDamageForLifesteal > 0) {
          const stealRes = HealingSystem.applyLifesteal(
            currentPlayer,
            totalActualDamageForLifesteal,
            effectiveLifestealRatio,
            healMult
          );
          currentPlayer = { ...currentPlayer, hp: stealRes.newHp };
          if (battleRecorder && stealRes.actualHealed > 0) {
            battleRecorder.recordHealing(stealRes.actualHealed, true);
          }
          if (stealRes.actualHealed > 0) {
            const pNowCoords = LANE_COORDS[currentPlayer.lane ?? 'center'];
            const srcCoords = LANE_COORDS[primaryTarget?.lane ?? 'center'];
            gameEvents.emit('LIFESTEAL_STREAM', {
              startX: srcCoords.enemyX - 15,
              startY: srcCoords.enemyY - 30,
              targetX: pNowCoords.playerX + 15,
              targetY: pNowCoords.playerY - 30,
              amount: stealRes.actualHealed,
            });
            soundEngine.playHealChime();
            gameEvents.emit('SPAWN_COMBAT_TEXT', {
              id: `lifesteal-${Date.now()}`,
              x: pNowCoords.playerX,
              y: pNowCoords.playerY - 95,
              text: `+${stealRes.actualHealed} LIFESTEAL`,
              color: '#34d399',
            });
          }
        }

        const synced = syncPrimaryEnemyFields(currentEnemies, get().selectedTargetId);
        set({
          player: currentPlayer,
          enemies: currentEnemies,
          ...synced,
        });

        const allDead = currentEnemies.every((e) => e.entity.hp <= 0);
        if (allDead) {
          currentEnemies.forEach((inst) => {
            if (inst.entity.isBoss && inst.entity.bossId) {
              const topEl = inst.memory.getMostFrequentElement().element;
              BossPersistenceManager.recordEncounterOutcome(inst.entity.bossId, true, topEl);
            }
          });

          if (battleRecorder && !battleRecorder.isFinalized()) {
            const record = battleRecorder.finalize('victory', turnNumber, {
              xpEarned: activeEncounter.rewards.xp,
              goldEarned: activeEncounter.rewards.gold,
              itemsEarned: [],
              levelBefore: 0,
              levelAfter: 0,
              unlocksEarned: [],
            });
            if (record) {
              set({ lastBattleRecord: record });
              getBattleHistoryRepository().saveRecord(record).catch(() => {});
            }
          }

          setTimeout(() => {
            set({ turnPhase: 'victory', currentEnemyEmotion: 'defeated' });
            soundEngine.playVictoryFanfare();
            gameEvents.emit('ENTITY_ANIMATION', { entityId: 'enemy', state: 'defeat' });
            gameEvents.emit('ENTITY_ANIMATION', { entityId: 'player', state: 'victory' });
            gameEvents.emit('ENEMY_EMOTION_CHANGED', {
              emotion: 'defeated',
              reason: 'All foes defeated!',
            });
            get().addLog(`🏆 VICTORY! ${activeEncounter.name} has been vanquished!`, 'critical');
          }, 400);
          return;
        }

        setTimeout(() => {
          get().triggerEnemyAction();
        }, 700);
      },
    });

    // Fire visual-only projectiles to any secondary targets in multi-target spells
    targetRes.targets.slice(1).forEach((secTarget, idx) => {
      const secCoords = LANE_COORDS[secTarget.lane ?? 'center'];
      gameEvents.emit('PROJECTILE_FIRED', {
        id: `proj-sec-${Date.now()}-${idx}`,
        type: spell.projectileType || 'arcane_bolt',
        startX: pStartCoords.playerX + 30,
        startY: pStartCoords.playerY - 30,
        targetX: secCoords.enemyX - 20,
        targetY: secCoords.enemyY - 30,
        speed: projSpeed,
        color: projectileColors[offensiveEl] || 0xa855f7,
        spellId: spell.id,
        element: offensiveEl,
        isCharged: releasingCharged,
      });
    });

    if (primaryTarget) {
      const affectedLanes = Array.from(
        new Set(targetRes.targets.map((t) => t.lane ?? 'center'))
      ) as Lane[];
      gameEvents.emit('SPELL_CAST_EFFECT', {
        spellId: spell.id,
        source: 'player',
        target: 'enemy',
        element: offensiveEl,
        isCharged: releasingCharged,
        startX: pStartCoords.playerX,
        startY: pStartCoords.playerY,
        targetX: eTargetCoords.enemyX,
        targetY: eTargetCoords.enemyY,
        affectedLanes: targetRes.targets.length > 1 || spell.targetRule !== 'single' ? affectedLanes : undefined,
      });
    }

    return { success: true };
  },

  triggerEnemyAction: () => {
    if (get().turnPhase === 'victory' || get().turnPhase === 'defeat') return;

    set({ turnPhase: 'enemy_turn' });

    setTimeout(() => {
      set({ turnPhase: 'enemy_casting' });

      const currentEnemies = [...get().enemies];
      const {
        activeDodge,
        consecutiveDodges,
        chargedSpell,
        equipBonuses,
        battleRecorder,
        turnNumber,
      } = get();

      // Build a list of living enemy actions to execute sequentially
      const livingEnemyIndices: number[] = [];
      for (let i = 0; i < currentEnemies.length; i++) {
        if (currentEnemies[i].entity.hp > 0) {
          livingEnemyIndices.push(i);
        }
      }

      let dodgeResolvedThisTurn = false;
      let totalDamageToPlayerThisTurn = 0;

      // Process each enemy sequentially with delays so projectiles visually travel
      const ENEMY_ACTION_DELAY = 650; // ms between each enemy's action

      function processEnemyAtStep(step: number): void {
        if (get().turnPhase === 'victory' || get().turnPhase === 'defeat') return;

        // All enemies have acted — finalize the turn
        if (step >= livingEnemyIndices.length) {
          const synced = syncPrimaryEnemyFields(currentEnemies, get().selectedTargetId);
          const latestPlayer = get().player;
          set({
            enemies: currentEnemies,
            activeDodge: null,
            recentDamageTaken: totalDamageToPlayerThisTurn,
            ...synced,
          });

          if (latestPlayer.hp <= 0) {
            currentEnemies.forEach((inst) => {
              inst.emotionSystem.evaluateEvent({ type: 'player_defeated' }, inst.entity, latestPlayer, inst.memory);
              if (inst.entity.isBoss && inst.entity.bossId) {
                const topEl = inst.memory.getMostFrequentElement().element;
                BossPersistenceManager.recordEncounterOutcome(inst.entity.bossId, false, topEl);
              }
            });

            if (battleRecorder && !battleRecorder.isFinalized()) {
              const defeatedCount = currentEnemies.filter((e) => e.entity.hp <= 0).length;
              const record = battleRecorder.finalize('defeat', turnNumber, {
                xpEarned: 0,
                goldEarned: 0,
                itemsEarned: [],
                levelBefore: 0,
                levelAfter: 0,
                unlocksEarned: [],
              });
              if (record) {
                if (record.advancedCombat) record.advancedCombat.enemiesDefeated = defeatedCount;
                set({ lastBattleRecord: record });
                getBattleHistoryRepository().saveRecord(record).catch(() => {});
              }
            }

            setTimeout(() => {
              set({ turnPhase: 'defeat', currentEnemyEmotion: 'triumphant' });
              gameEvents.emit('ENTITY_ANIMATION', { entityId: 'player', state: 'defeat' });
              gameEvents.emit('ENTITY_ANIMATION', { entityId: 'enemy', state: 'victory' });
              get().addLog('☠️ DEFEAT! The Petty Sorcerer was overwhelmed.', 'critical');
            }, 400);
            return;
          }

          setTimeout(() => {
            get().concludeTurn();
          }, 500);
          return;
        }

        const i = livingEnemyIndices[step];
        const inst = currentEnemies[i];
        let currentPlayer = get().player;

        // Staggered enemies lose their action
        if (inst.entity.isStaggered) {
          inst.entity = PostureSystem.clearStagger(inst.entity);
          get().addLog(`💫 ${inst.entity.name} is staggered and loses their action!`, 'system');
          processEnemyAtStep(step + 1);
          return;
        }

        const intent = inst.currentIntent;
        const actionKey = intent ? intent.spellId : 'void_bolt';
        const action = ENEMY_SPELLS[actionKey] || ENEMY_SPELLS.void_bolt;

        soundEngine.playSpellCast(action.castAnimation);
        soundEngine.playWizardVoice('enemy');
        gameEvents.emit('ENTITY_ANIMATION', { entityId: inst.entity.id, state: 'cast' });

        if (battleRecorder) battleRecorder.recordEnemySpellCast(`${inst.entity.name}: ${action.name}`);

        const enemyLaneCoords = LANE_COORDS[inst.entity.lane ?? 'center'];

        // Handle defense / support actions (no projectile to player)
        if (action.type === 'defense' || action.type === 'support') {
          if (action.spellId === 'ally_mend' && intent?.targetEnemyId) {
            const allyIdx = currentEnemies.findIndex((e) => e.entity.id === intent.targetEnemyId);
            if (allyIdx >= 0 && currentEnemies[allyIdx].entity.hp > 0) {
              const ally = currentEnemies[allyIdx];
              const healVal = action.healValue || 24;
              ally.entity = {
                ...ally.entity,
                hp: Math.min(ally.entity.maxHp, ally.entity.hp + healVal),
              };
              const allyCoords = LANE_COORDS[ally.entity.lane ?? 'center'];
              gameEvents.emit('SPAWN_COMBAT_TEXT', {
                id: `eheal-${Date.now()}-${i}`,
                x: allyCoords.enemyX,
                y: allyCoords.enemyY - 95,
                text: `+${healVal} HP`,
                color: '#34d399',
              });
              get().addLog(`💚 ${inst.entity.name} mended ${ally.entity.name} for +${healVal} HP!`, 'enemy');
              set({ enemies: currentEnemies });
              setTimeout(() => processEnemyAtStep(step + 1), ENEMY_ACTION_DELAY);
              return;
            }
          }

          const shieldVal = action.shieldValue || 25;
          if (action.spellId === 'ally_ward' && intent?.targetEnemyId) {
            const allyIdx = currentEnemies.findIndex((e) => e.entity.id === intent.targetEnemyId);
            if (allyIdx >= 0 && currentEnemies[allyIdx].entity.hp > 0) {
              currentEnemies[allyIdx].entity = {
                ...currentEnemies[allyIdx].entity,
                shield: currentEnemies[allyIdx].entity.shield + shieldVal,
              };
              const allyCoords = LANE_COORDS[currentEnemies[allyIdx].entity.lane ?? 'center'];
              gameEvents.emit('SPAWN_COMBAT_TEXT', {
                id: `eward-${Date.now()}-${i}`,
                x: allyCoords.enemyX,
                y: allyCoords.enemyY - 95,
                text: `SHIELD +${shieldVal}`,
                color: '#10b981',
              });
              get().addLog(
                `🛡️ ${inst.entity.name} shielded ${currentEnemies[allyIdx].entity.name} (+${shieldVal})!`,
                'enemy'
              );
              set({ enemies: currentEnemies });
              setTimeout(() => processEnemyAtStep(step + 1), ENEMY_ACTION_DELAY);
              return;
            }
          }

          inst.entity = { ...inst.entity, shield: inst.entity.shield + shieldVal };
          if (action.selfBuff) {
            inst.entity = {
              ...inst.entity,
              statusEffects: [
                ...inst.entity.statusEffects,
                {
                  id: `ebuff-${Date.now()}-${i}`,
                  type: action.selfBuff.type,
                  name: action.selfBuff.name,
                  turnsRemaining: action.selfBuff.turns,
                  value: action.selfBuff.value,
                },
              ],
            };
          }
          gameEvents.emit('SPAWN_COMBAT_TEXT', {
            id: `eshield-${Date.now()}-${i}`,
            x: enemyLaneCoords.enemyX,
            y: enemyLaneCoords.enemyY - 95,
            text: action.selfBuff ? `SHIELD +${shieldVal} • EMPOWERED` : `SHIELD +${shieldVal}`,
            color: '#10b981',
          });
          get().addLog(
            `🛡️ ${inst.entity.name} wove ${action.name} (+${shieldVal} Shield${action.selfBuff ? `, +${action.selfBuff.name}` : ''}).`,
            'enemy'
          );
          set({ enemies: currentEnemies });
          setTimeout(() => processEnemyAtStep(step + 1), ENEMY_ACTION_DELAY);
          return;
        }

        // Offensive action — fire projectile, then apply damage after travel delay
        const playerLane: Lane = currentPlayer.lane ?? 'center';
        const playerLaneCoords = LANE_COORDS[playerLane];

        const enemyProjColor =
          action.spellId === 'frost_lance'
            ? 0x38bdf8
            : action.castAnimation === 'fire'
            ? 0xef4444
            : action.castAnimation === 'hex'
            ? 0x10b981
            : action.castAnimation === 'drain'
            ? 0xf43f5e
            : 0x9333ea;

        const enemyProjType =
          action.spellId === 'frost_lance'
            ? 'ice_shard'
            : action.castAnimation === 'fire'
            ? 'fire_orb'
            : action.castAnimation === 'hex'
            ? 'hex_beam'
            : action.castAnimation === 'spark'
            ? 'spark'
            : 'void_skull';

        const enemyVfxElement =
          action.spellId === 'frost_lance' || action.spellId === 'chronal_snare'
            ? 'ice'
            : action.castAnimation === 'fire'
            ? 'fire'
            : action.castAnimation === 'hex'
            ? 'poison'
            : action.castAnimation === 'spark'
            ? 'lightning'
            : 'arcane';

        // Fire projectile — damage & effects trigger in onHit when projectile reaches player
        let impactHandled = false;
        const handleEnemyProjectileHit = () => {
          if (impactHandled) return;
          impactHandled = true;
          if (get().turnPhase === 'victory' || get().turnPhase === 'defeat') return;

          currentPlayer = get().player; // Re-read player state (may have been updated by previous enemy)
          const calc = calculateSpellDamage(inst.entity, currentPlayer, action.baseDamage);

          const dodgeRes = DodgeSystem.resolveIncomingAttack(
            activeDodge,
            currentPlayer.lane ?? 'center',
            intent?.telegraph,
            calc.finalDamage + calc.absorbedByShield,
            consecutiveDodges,
            equipBonuses.dodgeEfficiencyBonus ?? 0
          );

          if (activeDodge && !dodgeResolvedThisTurn) {
            dodgeResolvedThisTurn = true;
            if (battleRecorder) {
              battleRecorder.recordDodgeResult(
                dodgeRes.evaded,
                dodgeRes.isPerfectDodge,
                dodgeRes.damageAvoided,
                dodgeRes.reason
              );
            }
            if (dodgeRes.manaRecovered > 0) {
              currentPlayer = {
                ...currentPlayer,
                mana: Math.min(currentPlayer.maxMana, currentPlayer.mana + dodgeRes.manaRecovered),
              };
            }
            if (dodgeRes.grantsNextTurnBonus) {
              set({ perfectDodgeBuff: true });
            }
          }

          const pLaneCoords = LANE_COORDS[currentPlayer.lane ?? 'center'];

          if (dodgeRes.evaded) {
            gameEvents.emit('SPAWN_COMBAT_TEXT', {
              id: `dodge-${Date.now()}-${i}`,
              x: pLaneCoords.playerX,
              y: pLaneCoords.playerY - 95,
              text: dodgeRes.isPerfectDodge ? 'PERFECT DODGE!' : 'EVADED!',
              color: dodgeRes.isPerfectDodge ? '#facc15' : '#38bdf8',
              size: 16,
            });
            get().addLog(`💨 ${dodgeRes.reason}`, 'player');
            set({ player: currentPlayer });
            setTimeout(() => processEnemyAtStep(step + 1), 300);
            return;
          }

          const shieldBefore = currentPlayer.shield;
          const vitReduction = 1 - Math.min(0.25, equipBonuses.damageReduction ?? 0);
          const postDodgeRaw = Math.round(
            action.baseDamage * dodgeRes.damageMultiplier * vitReduction
          );
          const finalCalc = calculateSpellDamage(inst.entity, currentPlayer, postDodgeRaw);
          const dmg = finalCalc.finalDamage;
          totalDamageToPlayerThisTurn += dmg;

          currentPlayer = {
            ...currentPlayer,
            hp: Math.max(0, currentPlayer.hp - dmg),
            shield: finalCalc.remainingShield,
          };

          if (ChargingSystem.shouldInterruptCharge(chargedSpell, shieldBefore, dmg)) {
            if (battleRecorder && chargedSpell) {
              battleRecorder.recordSpellInterrupted(chargedSpell.spellName);
            }
            get().addLog(
              `💥 ${inst.entity.name} INTERRUPTED your charged ${chargedSpell?.spellName}!`,
              'critical'
            );
            set({ chargedSpell: null });
          }

          if (action.type === 'drain' && dmg > 0) {
            const healAmt = Math.round(dmg * 0.25);
            inst.entity = {
              ...inst.entity,
              hp: Math.min(inst.entity.maxHp, inst.entity.hp + healAmt),
            };
          }

          if (action.inflictStatus) {
            const st = action.inflictStatus;
            currentPlayer = {
              ...currentPlayer,
              statusEffects: [
                ...currentPlayer.statusEffects,
                {
                  id: `pst-${st.type}-${Date.now()}-${i}`,
                  type: st.type,
                  name: st.name,
                  turnsRemaining: st.turns,
                  value: st.value,
                },
              ],
            };
            if (battleRecorder) battleRecorder.recordStatusEffect(st.name, 'player');
            get().addLog(`🔮 Afflicted with ${st.name} (${st.turns} turns)!`, 'enemy');
          }

          if (action.manaDrain && action.manaDrain > 0) {
            const drained = Math.min(currentPlayer.mana, action.manaDrain);
            currentPlayer = { ...currentPlayer, mana: currentPlayer.mana - drained };
            if (drained > 0) {
              get().addLog(`💧 ${inst.entity.name} drained ${drained} Mana!`, 'enemy');
            }
          }

          if (action.staminaDrain && action.staminaDrain > 0) {
            const curStam = currentPlayer.stamina ?? 100;
            const drained = Math.min(curStam, action.staminaDrain);
            currentPlayer = { ...currentPlayer, stamina: curStam - drained };
            if (drained > 0) {
              get().addLog(`❄️ ${inst.entity.name} sapped ${drained} Stamina!`, 'enemy');
            }
          }

          if (action.shiftsEnemyLane) {
            const otherLanes = (['left', 'center', 'right'] as Lane[]).filter(
              (l) => l !== (inst.entity.lane ?? 'center')
            );
            const nextLane = otherLanes[Math.floor(Math.random() * otherLanes.length)] ?? 'center';
            inst.entity = { ...inst.entity, lane: nextLane };
            get().addLog(`👤 ${inst.entity.name} slipped into the ${nextLane.toUpperCase()} lane!`, 'enemy');
          }

          if (finalCalc.absorbedByShield > 0 && dmg === 0) {
            soundEngine.playShieldResonance();
          } else {
            soundEngine.playElementalImpact(enemyVfxElement, finalCalc.isCritical);
          }
          gameEvents.emit('SCREEN_SHAKE', { intensity: finalCalc.isCritical ? 14 : 8, durationMs: 260 });
          gameEvents.emit('ENTITY_ANIMATION', { entityId: 'player', state: 'hurt' });
          gameEvents.emit('SPAWN_COMBAT_TEXT', {
            id: `txt-${Date.now()}-${i}`,
            x: pLaneCoords.playerX,
            y: pLaneCoords.playerY - 90,
            text: finalCalc.absorbedByShield > 0 && dmg === 0 ? 'BLOCKED!' : `-${dmg}`,
            color: '#ef4444',
          });

          get().addLog(
            `💥 ${inst.entity.name}'s ${action.name} dealt ${dmg} damage!`,
            'enemy'
          );

          if (battleRecorder) {
            const blocked = finalCalc.absorbedByShield > 0 && dmg === 0;
            battleRecorder.recordDamageReceived(dmg, finalCalc.isCritical, blocked);
          }

          set({ player: currentPlayer, enemies: currentEnemies });

          if (currentPlayer.hp <= 0) {
            // Player died — skip remaining enemies, finalize
            processEnemyAtStep(livingEnemyIndices.length);
            return;
          }

          // Brief pause after impact before next enemy casts
          setTimeout(() => processEnemyAtStep(step + 1), 300);
        };

        gameEvents.emit('SPELL_CAST_EFFECT', {
          spellId: action.spellId,
          source: 'enemy',
          target: 'player',
          element: enemyVfxElement,
          startX: enemyLaneCoords.enemyX,
          startY: enemyLaneCoords.enemyY,
          targetX: playerLaneCoords.playerX,
          targetY: playerLaneCoords.playerY,
          affectedLanes: intent?.telegraph?.targetLanes,
          bossStage: inst.entity.bossStage,
          bossId: inst.entity.bossId,
        });

        gameEvents.emit('PROJECTILE_FIRED', {
          id: `eproj-${Date.now()}-${i}`,
          type: enemyProjType,
          startX: enemyLaneCoords.enemyX - 25,
          startY: enemyLaneCoords.enemyY - 28,
          targetX: playerLaneCoords.playerX + 25,
          targetY: playerLaneCoords.playerY - 28,
          speed: enemyVfxElement === 'lightning' ? 16 : 11,
          color: enemyProjColor,
          spellId: action.spellId,
          element: enemyVfxElement,
          bossStage: inst.entity.bossStage,
          onHit: handleEnemyProjectileHit,
        });

        // Safety fallback in case ProjectileManager is unmounted (e.g., headless tests or background tab)
        setTimeout(() => {
          handleEnemyProjectileHit();
        }, 1600);
      }

      // Start processing from the first living enemy
      if (livingEnemyIndices.length > 0) {
        processEnemyAtStep(0);
      } else {
        // No living enemies — just conclude
        setTimeout(() => {
          get().concludeTurn();
        }, 500);
      }
    }, 450);
  },

  concludeTurn: () => {
    const { player, enemies, turnNumber, activeSpells, battleRecorder, activeDodge } = get();

    const playerProcessed = processStatusEffects(player);
    const decrementedSpells = activeSpells.map((s) => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1),
    }));

    const { equipBonuses } = get();
    const regenPlayer: CombatEntity = {
      ...playerProcessed.updatedEntity,
      mana: Math.min(
        player.maxMana,
        playerProcessed.updatedEntity.mana + 10 + (equipBonuses.manaRegenBonus ?? 0)
      ),
      stamina: Math.min(player.maxStamina ?? 100, (playerProcessed.updatedEntity.stamina ?? 100) + 20),
    };

    const updatedEnemies = enemies.map((inst) => {
      if (inst.entity.hp <= 0) return inst;

      const processed = processStatusEffects(inst.entity);
      const regenEntity: CombatEntity = {
        ...processed.updatedEntity,
        mana: Math.min(inst.entity.maxMana, processed.updatedEntity.mana + 10),
      };

      const nextPred = inst.predictionEngine.predictNextElement(inst.memory);
      inst.memory.recordPrediction({
        turn: turnNumber + 1,
        predictedElement: nextPred.predictedElement,
        confidence: nextPred.confidence,
        reason: nextPred.reason,
      });

      inst.emotionSystem.evaluateEvent({ type: 'turn_passed' }, regenEntity, regenPlayer, inst.memory);
      const em = inst.emotionSystem.getState();

      return {
        ...inst,
        entity: regenEntity,
        currentPrediction: nextPred,
        elementResistances: inst.adaptation.getAllResistances(inst.memory),
        predictabilityScore: inst.predictability.calculatePredictabilityScore(inst.memory),
        predictabilityStage: inst.predictability.getStage(inst.memory),
        currentEmotion: em.currentEmotion,
        currentEmotionReason: em.reason,
      };
    });

    const livingEntities = updatedEnemies.filter((e) => e.entity.hp > 0).map((e) => e.entity);
    updatedEnemies.forEach((inst) => {
      if (inst.entity.hp > 0) {
        const predictedLane = inst.memory.getMostFrequentLane() || undefined;
        inst.currentIntent = EnemyCoordination.decideCoordinatedIntent(
          inst.entity,
          livingEntities,
          regenPlayer,
          predictedLane
        );
      }
    });

    if (battleRecorder && updatedEnemies[0]?.currentPrediction) {
      battleRecorder.setTurn(turnNumber + 1);
      battleRecorder.recordPrediction(
        updatedEnemies[0].currentPrediction.predictedElement,
        updatedEnemies[0].currentPrediction.confidence
      );
    }

    const synced = syncPrimaryEnemyFields(updatedEnemies, get().selectedTargetId);

    set({
      player: regenPlayer,
      enemies: updatedEnemies,
      turnNumber: turnNumber + 1,
      turnPhase: 'player_turn',
      activeSpells: decrementedSpells,
      consecutiveDodges: activeDodge ? get().consecutiveDodges : 0,
      ...synced,
    });

    gameEvents.emit('ENTITY_ANIMATION', { entityId: 'player', state: 'idle' });
    gameEvents.emit('ENTITY_ANIMATION', { entityId: 'enemy', state: 'idle' });
    gameEvents.emit('ENEMY_EMOTION_CHANGED', {
      emotion: synced.currentEnemyEmotion,
      reason: synced.currentEmotionReason,
    });
  },
}));
