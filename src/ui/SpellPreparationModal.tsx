import { useState } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { soundEngine } from '../voice/soundEngine';
import { BookOpen, CheckCircle2, Circle, Sparkles, X, Zap } from 'lucide-react';

interface SpellPreparationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpellPreparationModal({ isOpen, onClose }: SpellPreparationModalProps) {
  const {
    spells,
    preparedSpellIds,
    getMaxPreparedSpells,
    togglePrepareSpell,
  } = usePlayerStore();
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const maxSlots = getMaxPreparedSpells();

  const handleToggle = (spellId: string) => {
    soundEngine.playClick();
    const res = togglePrepareSpell(spellId);
    if (!res.success && res.reason) {
      setNotice(res.reason);
    } else {
      setNotice(null);
    }
  };

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="pixel-box-gold w-[680px] max-w-[95%] max-h-[86vh] flex flex-col p-5 relative">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer p-1"
        >
          <X size={18} />
        </button>

        <div className="flex items-center justify-between border-b border-purple-900/60 pb-3 mb-3 pr-8">
          <div className="flex items-center gap-2.5">
            <BookOpen className="text-amber-400" size={20} />
            <div>
              <h2 className="font-pixel text-sm text-amber-300">SPELL PREPARATION</h2>
              <p className="font-lore text-xs text-gray-400">
                Attune your active combat incantations before entering the arena
              </p>
            </div>
          </div>
          <div className="font-pixel text-[10px] px-2.5 py-1 rounded bg-purple-950 border border-purple-700 text-amber-300">
            SLOTS: {preparedSpellIds.length} / {maxSlots}
          </div>
        </div>

        {notice && (
          <div className="mb-3 p-2 rounded bg-red-950/60 border border-red-600/60 font-pixel text-[9px] text-red-300">
            {notice}
          </div>
        )}

        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
          {spells.map((spell) => {
            const isPrepared = preparedSpellIds.includes(spell.id);
            return (
              <button
                key={spell.id}
                type="button"
                onClick={() => handleToggle(spell.id)}
                className={`p-3 rounded border text-left transition cursor-pointer ${
                  isPrepared
                    ? 'bg-purple-900/40 border-amber-400/80'
                    : 'bg-[#100a1d] border-purple-900/50 hover:border-purple-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-pixel text-[10px] text-amber-300 flex items-center gap-1.5">
                    {isPrepared ? (
                      <CheckCircle2 size={13} className="text-emerald-400" />
                    ) : (
                      <Circle size={13} className="text-gray-500" />
                    )}
                    {spell.name}
                  </span>
                  <span className="font-pixel text-[9px] text-blue-400">
                    {spell.manaCost > 0 ? `${spell.manaCost} MP` : '0 MP'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-1.5 font-pixel text-[7px]">
                  <span className="px-1.5 py-0.5 rounded bg-black/50 border border-purple-800 text-purple-200 uppercase">
                    {spell.element}
                  </span>
                  {spell.targetRule && (
                    <span className="px-1.5 py-0.5 rounded bg-black/50 border border-purple-800 text-sky-300 uppercase">
                      {spell.targetRule.replace('_', ' ')}
                    </span>
                  )}
                  {spell.chargeable && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-600/60 text-amber-300 flex items-center gap-0.5">
                      <Zap size={8} /> CHARGEABLE
                    </span>
                  )}
                </div>

                <p className="font-lore text-xs text-gray-300">{spell.description}</p>
                {spell.synergyHint && (
                  <p className="font-lore text-[10px] text-emerald-300/90 mt-1 flex items-center gap-1">
                    <Sparkles size={10} /> {spell.synergyHint}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="pixel-btn w-full mt-4 py-2.5 font-pixel text-xs text-amber-300 cursor-pointer"
        >
          CONFIRM LOADOUT
        </button>
      </div>
    </div>
  );
}
