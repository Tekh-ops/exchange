import { Spell } from '../spells/types';

interface SpellTooltipProps {
  spell: Spell;
}

export function SpellTooltip({ spell }: SpellTooltipProps) {
  const elementColors: Record<string, string> = {
    arcane: 'text-purple-400 border-purple-500/50 bg-purple-950/40',
    fire: 'text-red-400 border-red-500/50 bg-red-950/40',
    ice: 'text-cyan-300 border-cyan-500/50 bg-cyan-950/40',
    lightning: 'text-amber-300 border-yellow-500/50 bg-yellow-950/40',
    poison: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40',
    defense: 'text-blue-400 border-blue-500/50 bg-blue-950/40',
  };

  const badgeClass = elementColors[spell.element] || 'text-gold-400 border-gold-500/50 bg-gold-950/40';

  return (
    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 pixel-box p-3 z-50 pointer-events-none text-left shadow-2xl border-2 border-amber-600/60">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-purple-900/60 mb-2">
        <span className="font-pixel text-[11px] text-amber-300 tracking-wider">
          {spell.name}
        </span>
        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border font-pixel ${badgeClass}`}>
          {spell.element}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-300 leading-relaxed mb-2 font-lore">
        {spell.description}
      </p>

      {/* Petty quote */}
      <div className="text-[11px] italic text-purple-300/90 bg-purple-950/60 p-1.5 rounded border border-purple-800/40 mb-2 font-lore">
        {spell.pettyComment}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-pixel text-gray-400 pt-1 border-t border-purple-950">
        <div>
          <span className="text-gray-500">MANA: </span>
          <span className={spell.manaCost > 0 ? 'text-blue-400' : 'text-emerald-400'}>
            {spell.manaCost > 0 ? `${spell.manaCost} MP` : 'FREE'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">COOLDOWN: </span>
          <span className="text-amber-300">
            {spell.cooldownTurns > 0 ? `${spell.cooldownTurns} turns` : 'None'}
          </span>
        </div>
      </div>
    </div>
  );
}
