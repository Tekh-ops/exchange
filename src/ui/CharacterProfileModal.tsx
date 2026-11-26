import { useState } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import {
  PlayerAttributes,
  getDerivedAttributeBonuses,
  SPELL_UNLOCK_LEVELS,
} from '../progression/progressionRules';
import { INITIAL_EQUIPMENT, ALTERNATE_EQUIPMENT } from '../equipment/equipmentRegistry';
import { soundEngine } from '../voice/soundEngine';
import {
  X,
  User,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Shield,
  Trophy,
  Check,
  Lock,
} from 'lucide-react';

interface CharacterProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ATTR_META: {
  key: keyof PlayerAttributes;
  label: string;
  desc: string;
}[] = [
  { key: 'vitality', label: 'Vitality', desc: '+12 Max HP & +1.5% DMG Reduction per pt' },
  { key: 'intelligence', label: 'Intelligence', desc: '+2 Spell Power & mana efficiency per pt' },
  { key: 'mind', label: 'Mind', desc: '+10 Max Mana & +1 Mana Regen every 2 pts' },
  { key: 'dexterity', label: 'Dexterity', desc: '+2% Dodge & +1.5% Crit Rate per pt' },
  { key: 'arcane', label: 'Arcane', desc: '+3% Synergy & +3% Posture DMG per pt' },
];

export function CharacterProfileModal({ isOpen, onClose }: CharacterProfileModalProps) {
  const playerStore = usePlayerStore();
  const {
    progression,
    equipment,
    spells,
    preparedSpellIds,
    allocateAttributes,
    respecAttributes,
    equipItem,
  } = playerStore;

  const [pending, setPending] = useState<PlayerAttributes>({
    vitality: 0,
    intelligence: 0,
    mind: 0,
    dexterity: 0,
    arcane: 0,
  });
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingTotal =
    pending.vitality +
    pending.intelligence +
    pending.mind +
    pending.dexterity +
    pending.arcane;
  const remainingPoints = progression.attributePoints - pendingTotal;

  const previewAttrs: PlayerAttributes = {
    vitality: progression.attributes.vitality + pending.vitality,
    intelligence: progression.attributes.intelligence + pending.intelligence,
    mind: progression.attributes.mind + pending.mind,
    dexterity: progression.attributes.dexterity + pending.dexterity,
    arcane: progression.attributes.arcane + pending.arcane,
  };

  const currentDerived = getDerivedAttributeBonuses(progression.attributes);
  const previewDerived = getDerivedAttributeBonuses(previewAttrs);

  const previewHp =
    playerStore.getTotalMaxHp() - currentDerived.bonusHp + previewDerived.bonusHp;
  const previewMana =
    playerStore.getTotalMaxMana() - currentDerived.bonusMana + previewDerived.bonusMana;
  const previewPower =
    playerStore.getTotalSpellPower() -
    currentDerived.bonusSpellPower +
    previewDerived.bonusSpellPower;
  const previewCrit = Math.round(
    (playerStore.getTotalCritRate() -
      currentDerived.bonusCritRate +
      previewDerived.bonusCritRate) *
      100
  );

  const xpPct =
    progression.xpToNextLevel > 0
      ? Math.min(100, Math.round((progression.currentXp / progression.xpToNextLevel) * 100))
      : 100;

  const winRate =
    progression.battlesFought > 0
      ? Math.round((progression.battlesWon / progression.battlesFought) * 100)
      : 0;

  const adjustPending = (key: keyof PlayerAttributes, delta: number) => {
    soundEngine.playClick();
    setNotice(null);
    if (delta > 0 && remainingPoints <= 0) return;
    if (delta < 0 && pending[key] <= 0) return;
    setPending((prev) => ({ ...prev, [key]: prev[key] + delta }));
  };

  const handleConfirm = () => {
    soundEngine.playClick();
    const res = allocateAttributes(pending);
    if (res.success) {
      setPending({ vitality: 0, intelligence: 0, mind: 0, dexterity: 0, arcane: 0 });
      setNotice('Attributes confirmed!');
    } else if (res.reason) {
      setNotice(res.reason);
    }
  };

  const handleRespec = () => {
    soundEngine.playClick();
    const res = respecAttributes();
    if (res.success) {
      setPending({ vitality: 0, intelligence: 0, mind: 0, dexterity: 0, arcane: 0 });
      setNotice('Attributes reset and points refunded.');
    } else if (res.reason) {
      setNotice(res.reason);
    }
  };

  const allEquipment = [...INITIAL_EQUIPMENT, ...ALTERNATE_EQUIPMENT];

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="pixel-box-gold w-[780px] max-w-[96%] max-h-[90vh] flex flex-col p-5 relative">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer p-1"
          aria-label="Close character profile"
        >
          <X size={18} />
        </button>

        {/* Header: Level & XP Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-900/60 pb-4 mb-4 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-purple-950/90 border-2 border-amber-400 flex flex-col items-center justify-center">
              <span className="font-pixel text-[8px] text-amber-200">LVL</span>
              <span className="font-pixel text-lg text-amber-300">{progression.level}</span>
            </div>
            <div>
              <h2 className="font-pixel text-base text-amber-300 flex items-center gap-2">
                <User size={16} /> THE PETTY SORCERER
              </h2>
              <div className="w-64 sm:w-80 mt-1.5">
                <div className="flex justify-between font-pixel text-[8px] text-gray-400 mb-1">
                  <span>XP PROGRESS</span>
                  <span className="text-purple-200">
                    {progression.xpToNextLevel > 0
                      ? `${progression.currentXp} / ${progression.xpToNextLevel}`
                      : 'MAX LEVEL'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#090612] border border-purple-800/80 rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-amber-400 transition-all duration-300"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
                <div className="flex justify-between font-pixel text-[8px] text-gray-500 mt-1">
                  <span>TOTAL XP: {progression.totalXpEarned}</span>
                  <span className="text-amber-300">GOLD: {progression.gold}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 font-pixel text-[9px]">
            <div className="p-2 rounded bg-[#100a1d] border border-purple-900/50 text-center">
              <span className="text-gray-400 block text-[7px]">BATTLES</span>
              <span className="text-white">
                {progression.battlesWon}W / {progression.battlesFought}F ({winRate}%)
              </span>
            </div>
            <div className="p-2 rounded bg-[#100a1d] border border-purple-900/50 text-center">
              <span className="text-gray-400 block text-[7px]">BOSSES SLAIN</span>
              <span className="text-amber-300 flex items-center justify-center gap-1">
                <Trophy size={10} /> {progression.firstBossVictories.length}
              </span>
            </div>
          </div>
        </div>

        {notice && (
          <div className="mb-3 p-2 rounded bg-purple-950/70 border border-amber-500/60 font-pixel text-[9px] text-amber-200">
            {notice}
          </div>
        )}

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1">
          {/* Left Column: Attributes & Derived Stats */}
          <div className="space-y-3">
            <div className="pixel-box p-3 bg-[#110a20]">
              <div className="flex items-center justify-between mb-2 border-b border-purple-900/40 pb-1.5">
                <span className="font-pixel text-[10px] text-amber-300">ATTRIBUTES</span>
                <span className="font-pixel text-[9px] px-2 py-0.5 rounded bg-purple-950 border border-purple-700 text-emerald-300">
                  POINTS: {remainingPoints}
                </span>
              </div>

              <div className="space-y-2">
                {ATTR_META.map((a) => (
                  <div
                    key={a.key}
                    className="p-2 rounded bg-black/40 border border-purple-900/40 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-pixel text-[10px] text-purple-200">
                        {a.label}{' '}
                        <span className="text-amber-300">
                          {progression.attributes[a.key]}
                          {pending[a.key] > 0 && (
                            <span className="text-emerald-400"> (+{pending[a.key]})</span>
                          )}
                        </span>
                      </div>
                      <div className="font-lore text-[11px] text-gray-400">{a.desc}</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={pending[a.key] <= 0}
                        onClick={() => adjustPending(a.key, -1)}
                        className="pixel-btn p-1 text-gray-300 disabled:opacity-30 cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <button
                        type="button"
                        disabled={remainingPoints <= 0}
                        onClick={() => adjustPending(a.key, 1)}
                        className="pixel-btn p-1 text-amber-300 disabled:opacity-30 cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  disabled={pendingTotal === 0}
                  onClick={handleConfirm}
                  className="pixel-btn flex-1 py-2 font-pixel text-[9px] text-emerald-300 flex items-center justify-center gap-1 disabled:opacity-35 cursor-pointer"
                >
                  <Check size={12} /> CONFIRM POINTS
                </button>
                <button
                  type="button"
                  onClick={handleRespec}
                  className="pixel-btn px-3 py-2 font-pixel text-[9px] text-amber-300 flex items-center gap-1 cursor-pointer"
                  title="Reset attributes (uses 1 Respec Token or 150 Gold)"
                >
                  <RotateCcw size={11} />
                  <span>
                    {progression.respecTokens > 0
                      ? `RESPEC (${progression.respecTokens} TOKEN)`
                      : 'RESPEC (150G)'}
                  </span>
                </button>
              </div>
            </div>

            {/* Derived Stats Preview */}
            <div className="pixel-box p-3 bg-[#110a20]">
              <h3 className="font-pixel text-[10px] text-purple-300 mb-2">
                DERIVED COMBAT STATS {pendingTotal > 0 ? '(PREVIEW)' : ''}
              </h3>
              <div className="grid grid-cols-2 gap-1.5 font-lore text-xs text-gray-300">
                <div>Max HP: <span className="text-green-400">{previewHp}</span></div>
                <div>Max Mana: <span className="text-blue-400">{previewMana}</span></div>
                <div>Spell Power: <span className="text-fuchsia-300">{previewPower}</span></div>
                <div>Crit Rate: <span className="text-amber-300">{previewCrit}%</span></div>
                <div>
                  DMG Reduction:{' '}
                  <span className="text-emerald-300">
                    {Math.round(previewDerived.damageReduction * 100)}%
                  </span>
                </div>
                <div>
                  Dodge Bonus:{' '}
                  <span className="text-sky-300">
                    +{Math.round(previewDerived.dodgeEfficiencyBonus * 100)}%
                  </span>
                </div>
                <div>
                  Posture Mult:{' '}
                  <span className="text-amber-200">
                    {previewDerived.postureDamageMultiplier.toFixed(2)}x
                  </span>
                </div>
                <div>
                  Synergy Mult:{' '}
                  <span className="text-purple-200">
                    {previewDerived.synergyBonusMultiplier.toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Equipment & Spell Unlocks */}
          <div className="space-y-3">
            <div className="pixel-box p-3 bg-[#110a20]">
              <h3 className="font-pixel text-[10px] text-amber-300 mb-2 flex items-center gap-1.5">
                <Shield size={12} /> EQUIPMENT & GEAR
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {allEquipment.map((item) => {
                  const isUnlocked = progression.unlockedEquipmentIds.includes(item.id);
                  const isEquipped = equipment.some((e) => e.id === item.id);
                  const meetsLevel = !item.minLevel || progression.level >= item.minLevel;

                  return (
                    <div
                      key={item.id}
                      className={`p-2 rounded border text-xs flex items-center justify-between gap-2 ${
                        isEquipped
                          ? 'bg-purple-900/40 border-amber-400/70'
                          : 'bg-black/40 border-purple-900/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-pixel text-[9px] text-amber-200 flex items-center gap-1">
                          <span>{item.name}</span>
                          {item.rarity === 'legendary' && (
                            <span className="text-[7px] px-1 rounded bg-amber-500/20 text-amber-300">
                              LEGENDARY
                            </span>
                          )}
                        </div>
                        <div className="font-lore text-[11px] text-gray-400 truncate">
                          {item.description}
                        </div>
                      </div>

                      {!isUnlocked ? (
                        <span className="font-pixel text-[8px] text-gray-500 flex items-center gap-1 shrink-0">
                          <Lock size={10} /> LVL {item.minLevel ?? '?'}
                        </span>
                      ) : isEquipped ? (
                        <span className="font-pixel text-[8px] text-emerald-400 shrink-0">
                          EQUIPPED
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!meetsLevel}
                          onClick={() => {
                            soundEngine.playClick();
                            const res = equipItem(item);
                            if (!res.success && res.reason) setNotice(res.reason);
                          }}
                          className="pixel-btn px-2 py-1 font-pixel text-[8px] text-amber-300 shrink-0 cursor-pointer disabled:opacity-40"
                        >
                          EQUIP
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pixel-box p-3 bg-[#110a20]">
              <h3 className="font-pixel text-[10px] text-purple-300 mb-2 flex items-center gap-1.5">
                <Sparkles size={12} /> SPELL UNLOCKS ({progression.unlockedSpellIds.length}/
                {spells.length}) • PREPARED ({preparedSpellIds.length}/
                {playerStore.getMaxPreparedSpells()})
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {spells.map((sp) => {
                  const unlocked = progression.unlockedSpellIds.includes(sp.id);
                  const reqLvl = SPELL_UNLOCK_LEVELS[sp.id];
                  return (
                    <div
                      key={sp.id}
                      className={`p-2 rounded border text-xs flex items-center justify-between ${
                        unlocked
                          ? 'bg-black/40 border-purple-900/40'
                          : 'bg-black/25 border-gray-800 opacity-60'
                      }`}
                    >
                      <div>
                        <span className="font-pixel text-[9px] text-amber-200">{sp.name}</span>
                        <span className="font-lore text-[11px] text-gray-400 block">
                          {sp.element.toUpperCase()} • {sp.manaCost} MP
                        </span>
                      </div>
                      <span
                        className={`font-pixel text-[8px] ${
                          unlocked ? 'text-emerald-400' : 'text-gray-400'
                        }`}
                      >
                        {unlocked ? 'UNLOCKED' : reqLvl ? `LVL ${reqLvl}` : 'VORATH BOSS'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
