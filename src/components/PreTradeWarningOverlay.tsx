import React, { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, BellRing, X, Volume2, ShieldAlert } from 'lucide-react';
import { playCountdownTick, playTradeStartAlarm, playClickSound } from '../services/audio';
import { announcePreTradeWarning, announceTradeStart, triggerHapticVibration } from '../services/voice';
import { formatCryptoPrice } from '../utils/formatters';

interface PreTradeWarningOverlayProps {
  isOpen: boolean;
  pair: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  countdownSeconds: number;
  onCountdownComplete: () => void;
  onDismiss: () => void;
}

export const PreTradeWarningOverlay: React.FC<PreTradeWarningOverlayProps> = ({
  isOpen,
  pair,
  direction,
  entryPrice,
  countdownSeconds = 15,
  onCountdownComplete,
  onDismiss,
}) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const timerRef = useRef<any>(null);

  const isLong = direction === 'LONG';
  const themeColor = isLong ? 'emerald' : 'red';
  const borderClass = isLong ? 'border-emerald-500 glow-green' : 'border-red-500 glow-red';
  const badgeClass = isLong ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60' : 'bg-red-500/20 text-red-300 border-red-500/60';

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(countdownSeconds);
    setAlarmTriggered(false);

    // Initial voice announcement
    announcePreTradeWarning(countdownSeconds, pair, direction);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 2) {
          clearInterval(timerRef.current);
          setAlarmTriggered(true);

          // Loud distinct TRADE START alarm at 1
          playTradeStartAlarm();
          announceTradeStart(pair, direction);
          triggerHapticVibration([400, 100, 400]);

          setTimeout(() => {
            onCountdownComplete();
          }, 1800);

          return 1;
        }

        // Countdown tick
        playCountdownTick();
        triggerHapticVibration([80]);
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, countdownSeconds, pair, direction]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className={`relative flex flex-col items-center w-full max-w-sm rounded-3xl bg-slate-900 border-2 ${borderClass} p-6 shadow-2xl text-slate-100 select-none animate-in fade-in zoom-in-95 duration-200`}>
        
        {/* Dismiss Button */}
        <button
          onClick={() => {
            playClickSound();
            onDismiss();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          title="Dismiss Countdown"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Direction Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-black border ${badgeClass} mb-2`}>
          {isLong ? <ArrowUp className="h-4 w-4 stroke-[3]" /> : <ArrowDown className="h-4 w-4 stroke-[3]" />}
          <span>{direction} SIGNAL READY</span>
        </div>

        <h3 className="text-sm font-mono uppercase tracking-wider text-slate-300">
          Place your trade in:
        </h3>

        {/* Big Countdown Number */}
        <div className="relative my-3 flex items-center justify-center">
          <div className={`w-28 h-28 rounded-full border-4 ${
            isLong ? 'border-emerald-500/40 bg-emerald-950/40' : 'border-red-500/40 bg-red-950/40'
          } flex items-center justify-center shadow-inner`}>
            {alarmTriggered ? (
              <span className="text-xl font-black font-mono tracking-tight text-white animate-bounce text-center px-2">
                TRADE START!
              </span>
            ) : (
              <span className={`text-6xl font-black font-mono ${isLong ? 'text-emerald-400' : 'text-red-400'} drop-shadow-lg`}>
                {timeLeft}
              </span>
            )}
          </div>
        </div>

        {/* Pair & Price Detail */}
        <div className="text-center space-y-1">
          <div className="text-xl font-black text-white tracking-wide">
            {pair}
          </div>
          <div className="text-xs font-mono text-cyan-400">
            Target Entry: ${formatCryptoPrice(entryPrice)}
          </div>
        </div>

        {/* Alarm note */}
        <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
          <BellRing className={`h-4 w-4 ${isLong ? 'text-emerald-400' : 'text-red-400'} animate-pulse shrink-0`} />
          <span>Loud alarm will sound at 1 to place your order on exchange</span>
        </div>

        {/* Direct Action Button */}
        <button
          onClick={() => {
            playClickSound();
            onDismiss();
          }}
          className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide transition cursor-pointer ${
            isLong
              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow glow-green'
              : 'bg-red-500 text-slate-950 hover:bg-red-400 shadow glow-red'
          }`}
        >
          I Placed the Order (Proceed)
        </button>
      </div>
    </div>
  );
};
