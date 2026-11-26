import { useState, useEffect, useMemo } from 'react';
import { BattleRecord, BattleOutcome } from '../history/BattleRecord';
import { getBattleHistoryRepository } from '../history/BattleHistoryRepository';
import { BattleRecordDetails } from './BattleRecordDetails';
import { soundEngine } from '../voice/soundEngine';
import { X, Scroll, Download, Trash2, Trophy, Skull, Flag, ChevronRight, Search } from 'lucide-react';

interface BattleChronicleProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BattleChronicle({ isOpen, onClose }: BattleChronicleProps) {
  const [records, setRecords] = useState<BattleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | BattleOutcome>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'damage'>('newest');
  const [selectedRecord, setSelectedRecord] = useState<BattleRecord | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const all = await getBattleHistoryRepository().getAllRecords();
      setRecords(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRecords();
      setConfirmClear(false);
    }
  }, [isOpen]);

  const filteredRecords = useMemo(() => {
    let list = [...records];

    if (outcomeFilter !== 'all') {
      list = list.filter((r) => r.outcome === outcomeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.opponentName.toLowerCase().includes(q) ||
          (r.bossName && r.bossName.toLowerCase().includes(q)) ||
          r.outcome.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return b.combat.totalDamageDealt - a.combat.totalDamageDealt;
    });

    return list;
  }, [records, outcomeFilter, searchQuery, sortOrder]);

  const handleExport = async () => {
    soundEngine.playClick();
    const json = await getBattleHistoryRepository().exportHistoryJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `petty-sorcerer-chronicle-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = async () => {
    soundEngine.playClick();
    await getBattleHistoryRepository().clearHistory();
    setRecords([]);
    setConfirmClear(false);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="pixel-box-gold w-[740px] max-w-[96%] max-h-[90vh] flex flex-col p-5 relative">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer p-1"
          aria-label="Close chronicle"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center justify-between mb-4 pr-8">
          <h2 className="font-pixel text-base text-amber-300 flex items-center gap-2">
            <Scroll size={18} /> BATTLE CHRONICLE
          </h2>
          <span className="font-pixel text-[10px] text-gray-400">
            {records.length} RECORDED {records.length === 1 ? 'DUEL' : 'DUELS'}
          </span>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opponent..."
              className="w-full bg-[#0d0818] border border-purple-800/60 rounded pl-8 pr-2.5 py-1.5 text-xs font-lore text-gray-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value as 'all' | BattleOutcome)}
            className="bg-[#0d0818] border border-purple-800/60 rounded px-2.5 py-1.5 font-pixel text-[9px] text-gray-200 cursor-pointer"
          >
            <option value="all">ALL OUTCOMES</option>
            <option value="victory">VICTORIES</option>
            <option value="defeat">DEFEATS</option>
            <option value="fled">FLED</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'damage')}
            className="bg-[#0d0818] border border-purple-800/60 rounded px-2.5 py-1.5 font-pixel text-[9px] text-gray-200 cursor-pointer"
          >
            <option value="newest">NEWEST FIRST</option>
            <option value="oldest">OLDEST FIRST</option>
            <option value="damage">HIGHEST DMG</option>
          </select>

          <button
            type="button"
            onClick={handleExport}
            disabled={records.length === 0}
            className="pixel-btn px-2.5 py-1.5 font-pixel text-[9px] flex items-center gap-1 text-amber-300 disabled:opacity-40 cursor-pointer"
            title="Export Battle Chronicle as JSON"
          >
            <Download size={12} /> EXPORT
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setConfirmClear(true);
              }}
              disabled={records.length === 0}
              className="pixel-btn px-2.5 py-1.5 font-pixel text-[9px] flex items-center gap-1 text-red-400 border-red-900/70 disabled:opacity-40 cursor-pointer"
            >
              <Trash2 size={12} /> CLEAR
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-1.5 rounded bg-red-700 hover:bg-red-600 text-white font-pixel text-[9px] cursor-pointer"
              >
                CONFIRM
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1.5 rounded bg-gray-800 text-gray-300 font-pixel text-[9px] cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[240px]">
          {loading ? (
            <div className="py-16 text-center font-pixel text-xs text-gray-400">
              LOADING ARCHIVES...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Scroll size={32} className="mx-auto text-purple-700/60" />
              <p className="font-pixel text-xs text-gray-400">NO CHRONICLES FOUND</p>
              <p className="font-lore text-sm text-gray-500 italic">
                Complete a wizard duel to inscribe your petty deeds into history.
              </p>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isVic = rec.outcome === 'victory';
              const isFled = rec.outcome === 'fled';
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedRecord(rec);
                  }}
                  className="w-full text-left p-3 rounded bg-[#110a20]/90 hover:bg-[#1a1030] border border-purple-900/50 hover:border-amber-500/60 transition flex items-center gap-3 cursor-pointer"
                >
                  <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 border ${
                    isVic
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : isFled
                      ? 'bg-gray-800/60 border-gray-600 text-gray-300'
                      : 'bg-red-950/50 border-red-700/60 text-red-400'
                  }`}>
                    {isVic ? <Trophy size={16} /> : isFled ? <Flag size={16} /> : <Skull size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-pixel text-[10px] uppercase ${
                        isVic ? 'text-amber-300' : isFled ? 'text-gray-300' : 'text-red-400'
                      }`}>
                        {rec.outcome}
                      </span>
                      <span className="font-lore text-sm text-white truncate">
                        vs {rec.opponentName}
                      </span>
                    </div>
                    <div className="font-pixel text-[9px] text-gray-400 mt-1 flex flex-wrap gap-3">
                      <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                      <span>{rec.totalTurns} Turns</span>
                      <span>{(rec.durationMs / 1000).toFixed(1)}s</span>
                      <span className="text-amber-400/90">{rec.combat.totalDamageDealt} DMG</span>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-gray-500 shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {selectedRecord && (
        <BattleRecordDetails
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
