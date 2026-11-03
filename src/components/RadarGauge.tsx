import React from 'react';
import { ArrowUp, ArrowDown, Minus, ShieldAlert } from 'lucide-react';
import { SignalResult } from '../types/crypto';

interface RadarGaugeProps {
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisPhase: string;
  signal: SignalResult | null;
}

export const RadarGauge: React.FC<RadarGaugeProps> = ({
  isAnalyzing,
  analysisProgress,
  analysisPhase,
  signal,
}) => {
  const signalType = signal?.signal;

  // Determine dynamic glow colors
  let ringColor = 'border-cyan-500/40';
  let glowClass = 'glow-cyan';
  let textColor = 'text-cyan-400';
  let sweepGradient = 'from-cyan-500/30';

  if (signalType === 'LONG') {
    ringColor = 'border-emerald-500';
    glowClass = 'glow-green';
    textColor = 'text-emerald-400';
    sweepGradient = 'from-emerald-500/40';
  } else if (signalType === 'SHORT') {
    ringColor = 'border-red-500';
    glowClass = 'glow-red';
    textColor = 'text-red-400';
    sweepGradient = 'from-red-500/40';
  } else if (signalType === 'NO_TRADE') {
    ringColor = 'border-amber-500';
    glowClass = 'glow-amber';
    textColor = 'text-amber-400';
    sweepGradient = 'from-amber-500/40';
  }

  return (
    <div className="relative flex flex-col items-center justify-center py-2 select-none">
      {/* Outer Radar Scope Container */}
      <div
        className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-slate-950 border-2 ${ringColor} ${glowClass} flex items-center justify-center transition-all duration-700 overflow-hidden shadow-2xl`}
      >
        {/* Radar Concentric Rings */}
        <div className="absolute inset-4 rounded-full border border-cyan-500/20" />
        <div className="absolute inset-10 rounded-full border border-cyan-500/25 border-dashed" />
        <div className="absolute inset-16 rounded-full border border-cyan-500/35" />
        <div className="absolute inset-24 rounded-full border border-cyan-500/20" />

        {/* Crosshair Axes */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-500/20 -translate-x-1/2" />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-cyan-500/20 -translate-y-1/2" />

        {/* Diagonal Crosshairs */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-500/10 -translate-x-1/2 rotate-45" />
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-500/10 -translate-x-1/2 -rotate-45" />

        {/* Degree Markers */}
        <span className="absolute top-2 text-[9px] font-mono text-cyan-400/60 font-bold">000°</span>
        <span className="absolute right-2 text-[9px] font-mono text-cyan-400/60 font-bold">090°</span>
        <span className="absolute bottom-2 text-[9px] font-mono text-cyan-400/60 font-bold">180°</span>
        <span className="absolute left-2 text-[9px] font-mono text-cyan-400/60 font-bold">270°</span>

        {/* Rotating Radar Sweep Wedge during analyzing */}
        {isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center animate-radar-sweep pointer-events-none">
            <div
              className={`w-1/2 h-1/2 bg-gradient-to-tr ${sweepGradient} to-transparent origin-bottom-right rounded-tl-full`}
            />
          </div>
        )}

        {/* Center Target Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
          {isAnalyzing ? (
            /* Analyzing State: Progress & Phase */
            <div className="flex flex-col items-center animate-pulse">
              <span className="text-3xl font-extrabold font-mono tracking-wider text-cyan-300 drop-shadow">
                {Math.min(100, Math.round(analysisProgress))}%
              </span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">
                Analyzing Market
              </span>
              <span className="mt-2 text-[10px] text-slate-400 max-w-[170px] leading-tight font-mono line-clamp-2">
                {analysisPhase}
              </span>
            </div>
          ) : signal ? (
            /* Result State: Big Arrow & Direction */
            <div className="flex flex-col items-center">
              {signal.signal === 'LONG' && (
                <div className="flex flex-col items-center animate-bounce">
                  <div className="p-2.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 glow-green">
                    <ArrowUp className="h-10 w-10 text-emerald-400 stroke-[3]" />
                  </div>
                  <span className="mt-2 text-2xl font-black tracking-widest text-emerald-400 drop-shadow">
                    LONG
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-300">
                    AGREEMENT SCORE {signal.confidenceScore}/100
                  </span>
                </div>
              )}

              {signal.signal === 'SHORT' && (
                <div className="flex flex-col items-center animate-bounce">
                  <div className="p-2.5 rounded-full bg-red-500/20 border border-red-400/60 glow-red">
                    <ArrowDown className="h-10 w-10 text-red-400 stroke-[3]" />
                  </div>
                  <span className="mt-2 text-2xl font-black tracking-widest text-red-400 drop-shadow">
                    SHORT
                  </span>
                  <span className="text-[10px] font-mono font-bold text-red-300">
                    AGREEMENT SCORE {signal.confidenceScore}/100
                  </span>
                </div>
              )}

              {signal.signal === 'NO_TRADE' && (
                <div className="flex flex-col items-center">
                  <div className="p-2.5 rounded-full bg-amber-500/20 border border-amber-400/60 glow-amber">
                    <Minus className="h-10 w-10 text-amber-400 stroke-[3]" />
                  </div>
                  <span className="mt-2 text-xl font-black tracking-wider text-amber-400 drop-shadow">
                    NO TRADE
                  </span>
                  <span className="text-[10px] font-mono text-amber-300/90 max-w-[150px] leading-tight mt-0.5">
                    Conditions not strong enough
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Idle Ready State */
            <div className="flex flex-col items-center opacity-85">
              <div className="h-3 w-3 rounded-full bg-cyan-400 animate-ping mb-3" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
                RADAR STANDBY
              </span>
              <span className="mt-1 text-[10px] text-slate-400 max-w-[150px] leading-tight">
                Tap 'Generate Signal' to trigger real live calculation
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
