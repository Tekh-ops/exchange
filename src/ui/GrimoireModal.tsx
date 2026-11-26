import { usePlayerStore } from '../stores/playerStore';
import { soundEngine } from '../voice/soundEngine';
import { BookOpen, Shield, Zap, Sparkles, X } from 'lucide-react';

interface GrimoireModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GrimoireModal({ isOpen, onClose }: GrimoireModalProps) {
  const {
    progression,
    equipment,
    spells,
    getTotalMaxHp,
    getTotalMaxMana,
    getTotalSpellPower,
    getTotalCritRate,
  } = usePlayerStore();

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="pixel-box-gold w-[680px] max-w-[95%] max-h-[85vh] overflow-y-auto p-6 relative">
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

        {/* Title */}
        <div className="flex items-center gap-3 border-b border-purple-900/60 pb-3 mb-4">
          <BookOpen className="text-amber-400" size={24} />
          <div>
            <h2 className="font-pixel text-base text-amber-300 tracking-wider">
              GRIMOIRE OF GRUDGES
            </h2>
            <p className="font-lore text-xs text-gray-400">
              The documented inventory, achievements, and equipment of The Petty Sorcerer
            </p>
          </div>
        </div>

        {/* Two column layout: Stats & Equipment | Spells */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Stats & Gear */}
          <div className="space-y-4">
            {/* Stats Panel */}
            <div className="pixel-box p-3 bg-purple-950/30">
              <h3 className="font-pixel text-[11px] text-purple-300 mb-2 border-b border-purple-900/40 pb-1 flex items-center gap-1.5">
                <Zap size={14} /> ATTRIBUTES
              </h3>
              <div className="space-y-1.5 text-xs font-lore">
                <div className="flex justify-between">
                  <span className="text-gray-400">Level:</span>
                  <span className="font-pixel text-[10px] text-amber-300">{progression.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">XP Progress:</span>
                  <span className="font-pixel text-[10px] text-purple-300">
                    {progression.currentXp} / {progression.xpToNextLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Health:</span>
                  <span className="font-pixel text-[10px] text-green-400">{getTotalMaxHp()} HP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Mana:</span>
                  <span className="font-pixel text-[10px] text-blue-400">{getTotalMaxMana()} MP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Spell Power:</span>
                  <span className="font-pixel text-[10px] text-fuchsia-400">{getTotalSpellPower()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Critical Strike:</span>
                  <span className="font-pixel text-[10px] text-amber-400">
                    {Math.round(getTotalCritRate() * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Equipment Items */}
            <div className="pixel-box p-3 bg-purple-950/30">
              <h3 className="font-pixel text-[11px] text-purple-300 mb-2 border-b border-purple-900/40 pb-1 flex items-center gap-1.5">
                <Shield size={14} /> ACTIVE ATTIRE
              </h3>
              <div className="space-y-2">
                {equipment.map((item) => (
                  <div key={item.id} className="p-2 rounded bg-purple-900/20 border border-purple-800/40 text-xs">
                    <div className="flex justify-between font-pixel text-[10px] text-amber-300 mb-0.5">
                      <span>{item.name}</span>
                      <span className="text-gray-500 uppercase">{item.slot}</span>
                    </div>
                    <p className="font-lore text-gray-300 text-[11px]">{item.description}</p>
                    <p className="font-lore text-purple-300/80 text-[10px] italic mt-1">"{item.pettyFlavor}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Inscribed Spells */}
          <div className="pixel-box p-3 bg-purple-950/30">
            <h3 className="font-pixel text-[11px] text-purple-300 mb-2 border-b border-purple-900/40 pb-1 flex items-center gap-1.5">
              <Sparkles size={14} /> INSCRIBED INCANTATIONS
            </h3>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {spells.map((sp) => (
                <div key={sp.id} className="p-2 rounded bg-purple-900/20 border border-purple-800/40 text-xs">
                  <div className="flex justify-between font-pixel text-[10px] text-amber-300 mb-1">
                    <span>{sp.name}</span>
                    <span className="text-blue-400">{sp.manaCost > 0 ? `${sp.manaCost} MP` : 'FREE'}</span>
                  </div>
                  <p className="font-lore text-gray-300 text-[11px]">{sp.description}</p>
                  <p className="font-lore text-purple-300/70 text-[10px] italic mt-1">{sp.pettyComment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="pixel-btn w-full mt-5 py-2.5 font-pixel text-xs text-amber-300 cursor-pointer hover:scale-105 active:scale-95"
        >
          CLOSE GRIMOIRE
        </button>
      </div>
    </div>
  );
}
