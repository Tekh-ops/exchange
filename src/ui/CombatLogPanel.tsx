import { useCombatStore } from '../stores/combatStore';
import { soundEngine } from '../voice/soundEngine';
import { Scroll, X, Shield, Zap, Skull, Info } from 'lucide-react';

interface CombatLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CombatLogPanel({ isOpen, onClose }: CombatLogPanelProps) {
  const { combatLogs } = useCombatStore();

  if (!isOpen) return null;

  return (
    <div className="absolute right-4 top-16 bottom-24 w-84 pixel-box p-3 z-50 pointer-events-auto flex flex-col bg-[#140e24]/95 backdrop-blur-md border-2 border-amber-600/70 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-purple-900/60 mb-2">
        <div className="flex items-center gap-2">
          <Scroll size={16} className="text-amber-400" />
          <span className="font-pixel text-[11px] text-amber-300">
            CHRONICLE OF GRIEVANCES
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="text-gray-400 hover:text-white p-1 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs font-lore">
        {combatLogs.map((log) => {
          let icon = <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />;
          let textColor = 'text-gray-300';
          let borderClass = 'border-purple-900/40 bg-purple-950/30';

          if (log.type === 'player') {
            icon = <Zap size={13} className="text-purple-400 shrink-0 mt-0.5" />;
            textColor = 'text-purple-200';
            borderClass = 'border-purple-800/60 bg-purple-900/20';
          } else if (log.type === 'enemy') {
            icon = <Skull size={13} className="text-emerald-400 shrink-0 mt-0.5" />;
            textColor = 'text-emerald-200';
            borderClass = 'border-emerald-900/60 bg-emerald-950/20';
          } else if (log.type === 'critical') {
            icon = <Shield size={13} className="text-amber-400 shrink-0 mt-0.5" />;
            textColor = 'text-amber-300 font-bold';
            borderClass = 'border-amber-600/80 bg-amber-950/30';
          }

          return (
            <div
              key={log.id}
              className={`p-2 rounded border ${borderClass} flex gap-2 items-start text-[11px] leading-tight`}
            >
              {icon}
              <div className="flex-1">
                <p className={textColor}>{log.text}</p>
                <span className="text-[9px] text-gray-500 font-pixel mt-1 block">
                  {log.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
