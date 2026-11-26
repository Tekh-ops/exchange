import { BattleTimelineEvent, TimelineEventType } from '../history/BattleRecord';
import { Swords, Shield, Sparkles, Brain, Heart, Flame, AlertTriangle, Flag, Clock } from 'lucide-react';

interface BattleTimelineProps {
  events: BattleTimelineEvent[];
}

function getEventIcon(type: TimelineEventType) {
  switch (type) {
    case 'battle_started':
    case 'battle_ended':
      return <Flag size={13} className="text-amber-400" />;
    case 'player_cast_spell':
    case 'enemy_cast_spell':
      return <Sparkles size={13} className="text-purple-400" />;
    case 'damage_dealt':
    case 'damage_received':
      return <Swords size={13} className="text-red-400" />;
    case 'shield_applied':
      return <Shield size={13} className="text-sky-400" />;
    case 'player_healed':
    case 'lifesteal_triggered':
      return <Heart size={13} className="text-emerald-400" />;
    case 'enemy_predicted_spell':
    case 'enemy_prediction_succeeded':
    case 'enemy_prediction_failed':
    case 'enemy_developed_resistance':
      return <Brain size={13} className="text-indigo-400" />;
    case 'punishment_triggered':
    case 'enemy_prepared_counter':
    case 'critical_hp_threshold':
      return <AlertTriangle size={13} className="text-amber-500" />;
    default:
      return <Flame size={13} className="text-gray-400" />;
  }
}

function getActorBadge(actor: BattleTimelineEvent['actor']) {
  if (actor === 'player') {
    return (
      <span className="px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-600/50 text-purple-200 text-[9px] font-pixel uppercase">
        YOU
      </span>
    );
  }
  if (actor === 'enemy') {
    return (
      <span className="px-1.5 py-0.5 rounded bg-red-950/60 border border-red-700/50 text-red-300 text-[9px] font-pixel uppercase">
        FOE
      </span>
    );
  }
  return (
    <span className="px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-700/40 text-amber-300 text-[9px] font-pixel uppercase">
      SYS
    </span>
  );
}

export function BattleTimeline({ events }: BattleTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 font-lore text-sm italic">
        No timeline events recorded for this duel.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-2">
      {events.map((ev, idx) => (
        <div
          key={`${ev.timestamp}-${idx}`}
          className="flex items-start gap-3 p-2.5 rounded bg-[#100b1d]/90 border border-purple-900/40 hover:border-purple-700/60 transition"
        >
          <div className="mt-0.5 shrink-0">{getEventIcon(ev.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-pixel text-[9px] text-amber-400/90">
                TURN {ev.turn}
              </span>
              {getActorBadge(ev.actor)}
              {ev.element && (
                <span className="text-[9px] font-pixel uppercase px-1.5 py-0.5 rounded bg-black/40 text-gray-300 border border-gray-700/60">
                  {ev.element}
                </span>
              )}
              <span className="ml-auto flex items-center gap-1 text-[9px] font-pixel text-gray-500">
                <Clock size={10} />
                {(ev.timestamp / 1000).toFixed(1)}s
              </span>
            </div>
            <p className="font-lore text-xs text-gray-200 leading-snug">
              {ev.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
