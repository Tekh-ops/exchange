import { useCombatStore } from '../stores/combatStore';
import { soundEngine } from '../voice/soundEngine';
import { OffensiveElement } from '../spells/types';
import { 
  Brain, 
  Flame, 
  Snowflake, 
  Zap, 
  Sparkles, 
  Skull, 
  ShieldAlert, 
  X, 
  TrendingUp, 
  Activity,
  Smile,
  AlertTriangle,
  Frown,
  Meh
} from 'lucide-react';

interface AdaptiveIntelligencePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdaptiveIntelligencePanel({ isOpen, onClose }: AdaptiveIntelligencePanelProps) {
  const {
    elementResistances,
    predictabilityScore,
    predictabilityStage,
    currentEnemyEmotion,
    currentEmotionReason,
    currentPrediction,
    lastPunishmentDescription,
    enemyMemory,
  } = useCombatStore();

  if (!isOpen) return null;

  const history = enemyMemory.getHistory();
  const consecutiveCount = enemyMemory.getConsecutiveElementCount();
  const consecutiveElement = enemyMemory.getConsecutiveElement();
  const { element: topElement, frequency: topFreq } = enemyMemory.getMostFrequentElement();

  const getElementMeta = (el: OffensiveElement) => {
    switch (el) {
      case 'fire':
        return { label: 'Fire', color: 'text-red-400', bar: 'from-orange-600 to-red-500', icon: <Flame size={13} className="text-red-400" /> };
      case 'ice':
        return { label: 'Ice', color: 'text-cyan-300', bar: 'from-blue-600 to-cyan-400', icon: <Snowflake size={13} className="text-cyan-300" /> };
      case 'lightning':
        return { label: 'Lightning', color: 'text-amber-300', bar: 'from-yellow-600 to-amber-400', icon: <Zap size={13} className="text-amber-300" /> };
      case 'arcane':
        return { label: 'Arcane', color: 'text-purple-400', bar: 'from-purple-700 to-fuchsia-500', icon: <Sparkles size={13} className="text-purple-400" /> };
      case 'poison':
        return { label: 'Poison', color: 'text-emerald-400', bar: 'from-emerald-700 to-green-500', icon: <Skull size={13} className="text-emerald-400" /> };
    }
  };

  const getEmotionIcon = () => {
    switch (currentEnemyEmotion) {
      case 'amused':
        return <Smile size={14} className="text-yellow-400" />;
      case 'confident':
        return <Sparkles size={14} className="text-emerald-400" />;
      case 'surprised':
        return <AlertTriangle size={14} className="text-cyan-400" />;
      case 'frustrated':
      case 'angry':
        return <Frown size={14} className="text-red-400" />;
      case 'desperate':
      case 'fearful':
        return <AlertTriangle size={14} className="text-purple-400 animate-pulse" />;
      default:
        return <Meh size={14} className="text-gray-400" />;
    }
  };

  const getStageColor = () => {
    switch (predictabilityStage) {
      case 'punishing':
        return 'text-red-400 border-red-500 bg-red-950/60';
      case 'counter_primed':
        return 'text-orange-400 border-orange-500 bg-orange-950/60';
      case 'adapting':
        return 'text-amber-300 border-amber-500 bg-amber-950/60';
      case 'noticed':
        return 'text-yellow-300 border-yellow-500 bg-yellow-950/40';
      default:
        return 'text-emerald-400 border-emerald-500 bg-emerald-950/40';
    }
  };

  return (
    <div className="absolute left-4 top-16 bottom-24 w-96 pixel-box-gold p-4 z-50 pointer-events-auto flex flex-col bg-[#140d24]/98 backdrop-blur-md border-2 border-amber-600/80 shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-purple-900/60 mb-3">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-purple-400" />
          <span className="font-pixel text-xs text-amber-300 tracking-wider">
            RIVAL ADAPTIVE INTEL
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

      <div className="space-y-3 font-lore text-xs">
        {/* Enemy Emotion Badge */}
        <div className="p-2.5 rounded bg-purple-950/40 border border-purple-800/50">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[10px] text-gray-400 flex items-center gap-1.5">
              {getEmotionIcon()}
              <span>CURRENT EMOTION:</span>
            </span>
            <span className="font-pixel text-[10px] text-amber-300 uppercase px-2 py-0.5 rounded bg-purple-900/60 border border-purple-700/60">
              {currentEnemyEmotion}
            </span>
          </div>
          <p className="text-[11px] text-purple-200/90 italic">
            "{currentEmotionReason}"
          </p>
        </div>

        {/* Prediction & Confidence */}
        <div className="p-2.5 rounded bg-purple-950/40 border border-purple-800/50">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[10px] text-gray-400 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-amber-400" />
              <span>ANTICIPATED SPELL:</span>
            </span>
            {currentPrediction ? (
              <span className={`font-pixel text-[10px] uppercase font-bold ${getElementMeta(currentPrediction.predictedElement).color}`}>
                {currentPrediction.predictedElement} ({currentPrediction.confidence}%)
              </span>
            ) : (
              <span className="font-pixel text-[10px] text-gray-500">ANALYZING...</span>
            )}
          </div>
          {currentPrediction && (
            <p className="text-[11px] text-gray-300">
              {currentPrediction.reason}
            </p>
          )}
        </div>

        {/* Predictability Meter */}
        <div className="p-2.5 rounded bg-purple-950/40 border border-purple-800/50">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[10px] text-gray-400 flex items-center gap-1.5">
              <Activity size={13} className="text-cyan-400" />
              <span>PREDICTABILITY:</span>
            </span>
            <span className="font-pixel text-[10px] text-amber-300">
              {predictabilityScore}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2.5 bg-[#09070f] rounded border border-purple-950 overflow-hidden mb-1.5">
            <div
              className={`h-full transition-all duration-300 ${
                predictabilityScore >= 75 ? 'bg-red-500' : predictabilityScore >= 45 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${predictabilityScore}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Pattern Stage:</span>
            <span className={`font-pixel text-[9px] uppercase px-1.5 py-0.5 rounded border ${getStageColor()}`}>
              {predictabilityStage.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Elemental Resistances Breakdown */}
        <div className="p-2.5 rounded bg-purple-950/40 border border-purple-800/50">
          <div className="font-pixel text-[10px] text-amber-300 mb-2 pb-1 border-b border-purple-900/60 flex items-center justify-between">
            <span>ELEMENTAL RESISTANCE</span>
            <span className="text-[8px] text-gray-500">MAX 45%</span>
          </div>

          <div className="space-y-2">
            {(['fire', 'ice', 'lightning', 'arcane', 'poison'] as OffensiveElement[]).map((el) => {
              const meta = getElementMeta(el);
              const resistance = elementResistances[el] || 0;
              const percent = Math.round(resistance * 100);

              return (
                <div key={el} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`flex items-center gap-1 font-pixel text-[9px] ${meta.color}`}>
                      {meta.icon}
                      <span>{meta.label.toUpperCase()}</span>
                    </span>
                    <span className="font-pixel text-[9px] text-gray-300">
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#09070f] rounded border border-purple-950 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${meta.bar} transition-all duration-300`}
                      style={{ width: `${(resistance / 0.45) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Repetition Statistics */}
        <div className="p-2.5 rounded bg-purple-950/40 border border-purple-800/50 text-[10px] space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Consecutive Element:</span>
            <span className="font-pixel text-[9px] text-amber-300 uppercase">
              {consecutiveElement ? `${consecutiveElement} (x${consecutiveCount})` : 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Most Used Element:</span>
            <span className="font-pixel text-[9px] text-purple-300 uppercase">
              {topElement ? `${topElement} (${Math.round(topFreq * 100)}%)` : 'None'}
            </span>
          </div>
        </div>

        {/* Recent Cast History */}
        <div className="p-2.5 rounded bg-purple-950/40 border border-purple-800/50">
          <span className="font-pixel text-[10px] text-amber-300 block mb-1.5">
            RECENT OFFENSIVE SPELLS ({history.length}/12)
          </span>
          {history.length === 0 ? (
            <p className="text-gray-500 italic text-[11px]">No offensive spells cast yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {history.map((act, i) => {
                const meta = getElementMeta(act.element);
                return (
                  <span
                    key={i}
                    className={`font-pixel text-[8px] px-1.5 py-0.5 rounded border border-purple-900 bg-purple-950 flex items-center gap-0.5 ${meta.color}`}
                    title={`Turn ${act.turn}: ${act.spellId} (${act.element})`}
                  >
                    {meta.icon}
                    <span>{act.element[0].toUpperCase()}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Latest Punishment / Counter Notice */}
        {lastPunishmentDescription && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-700/60 text-red-200">
            <div className="flex items-center gap-1.5 font-pixel text-[10px] text-red-400 mb-1">
              <ShieldAlert size={14} />
              <span>ACTIVE PUNISHMENT</span>
            </div>
            <p className="text-[11px] leading-snug">
              {lastPunishmentDescription}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          soundEngine.playClick();
          onClose();
        }}
        className="pixel-btn w-full mt-3 py-2 font-pixel text-[10px] text-amber-300 cursor-pointer"
      >
        DISMISS INTEL
      </button>
    </div>
  );
}
