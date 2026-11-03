import React, { useEffect, useState } from 'react';
import { Play, Square, Clock, Send, ShieldAlert } from 'lucide-react';
import { AutoModeSettings } from '../types/crypto';
import { playClickSound } from '../services/audio';

interface AutoModeBarProps {
  autoMode: AutoModeSettings;
  onStop: () => void;
  nextScanSeconds: number;
}

export const AutoModeBar: React.FC<AutoModeBarProps> = ({
  autoMode,
  onStop,
  nextScanSeconds,
}) => {
  if (!autoMode.enabled) return null;

  const mins = Math.floor(Math.max(0, nextScanSeconds) / 60);
  const secs = Math.max(0, nextScanSeconds) % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const currentHour = new Date().getHours();
  const isQuietHours = currentHour >= (autoMode.quietHoursStart ?? 23) || currentHour < (autoMode.quietHoursEnd ?? 7);

  return (
    <div className="w-full bg-slate-900/90 border border-cyan-500/80 glow-cyan-border rounded-2xl p-3 flex items-center justify-between gap-3 text-xs font-mono shadow-xl">
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-cyan-300 tracking-wider uppercase text-[11px]">
              AUTO MODE ON
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-200 font-bold">
              Next scan in <span className="text-cyan-400">{timeFormatted}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
            <span>Signals sent today: <strong className="text-white">{autoMode.signalsSentToday}/{autoMode.maxDailySignals}</strong></span>
            <span>·</span>
            <span>Interval: {autoMode.intervalMinutes}m</span>
            {isQuietHours && (
              <span className="text-amber-400 font-semibold">(Quiet Hours Active: 23:00-07:00)</span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          playClickSound();
          onStop();
        }}
        className="px-3.5 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-extrabold text-xs tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-lg glow-red shrink-0"
      >
        <Square className="h-3.5 w-3.5 fill-current" />
        <span>STOP</span>
      </button>
    </div>
  );
};
