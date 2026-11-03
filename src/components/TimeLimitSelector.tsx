import React, { useState } from 'react';
import { Timer, Clock, Edit3 } from 'lucide-react';
import { TradeTimeLimit, Timeframe } from '../types/crypto';
import { playClickSound } from '../services/audio';

interface TimeLimitSelectorProps {
  selectedLimit: TradeTimeLimit;
  customMinutes: number;
  onSelectLimit: (limit: TradeTimeLimit, customMinutes?: number) => void;
  activeTimeframe: Timeframe;
}

const LIMITS: Array<{ id: TradeTimeLimit; label: string; timeframe: Timeframe }> = [
  { id: '5m', label: '5 min', timeframe: '5m' },
  { id: '15m', label: '15 min', timeframe: '15m' },
  { id: '30m', label: '30 min', timeframe: '30m' },
  { id: '1h', label: '1 hour', timeframe: '1h' },
  { id: '4h', label: '4 hours', timeframe: '4h' },
  { id: 'custom', label: 'Custom', timeframe: '15m' },
];

export const TimeLimitSelector: React.FC<TimeLimitSelectorProps> = ({
  selectedLimit,
  customMinutes,
  onSelectLimit,
  activeTimeframe,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customVal, setCustomVal] = useState(customMinutes.toString());

  const handleCustomSubmit = () => {
    const mins = Math.max(1, parseInt(customVal, 10) || 15);
    onSelectLimit('custom', mins);
    setShowCustomInput(false);
  };

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-2.5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-slate-300 text-xs font-mono">
          <Timer className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-bold text-white">Holding Time Limit</span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400">
          Syncs timeframe & validity timer
        </span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        {LIMITS.map((item) => {
          const isSelected = selectedLimit === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                playClickSound();
                if (item.id === 'custom') {
                  setShowCustomInput(!showCustomInput);
                } else {
                  setShowCustomInput(false);
                  onSelectLimit(item.id);
                }
              }}
              className={`flex-1 min-w-[54px] py-1 px-2 rounded-xl text-center text-xs font-mono font-semibold transition cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow glow-cyan'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {item.id === 'custom' && selectedLimit === 'custom' ? `${customMinutes}m` : item.label}
            </button>
          );
        })}
      </div>

      {showCustomInput && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <span className="text-[11px] font-mono text-slate-400">Custom minutes:</span>
          <input
            type="number"
            min="1"
            max="1440"
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            className="w-20 rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
          />
          <button
            onClick={() => {
              playClickSound();
              handleCustomSubmit();
            }}
            className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold font-mono hover:bg-cyan-400 transition cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};
