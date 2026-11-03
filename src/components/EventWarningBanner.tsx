import React from 'react';
import { EconomicEvent } from '../types/crypto';
import { ShieldAlert, Calendar, AlertOctagon } from 'lucide-react';

interface EventWarningBannerProps {
  activeEvent: EconomicEvent | null;
  statusText: string;
  onOpenCalendar: () => void;
}

export const EventWarningBanner: React.FC<EventWarningBannerProps> = ({
  activeEvent,
  statusText,
  onOpenCalendar,
}) => {
  if (!activeEvent) return null;

  return (
    <div className="bg-gradient-to-r from-rose-950 via-red-950 to-slate-950 border-b-2 border-rose-500 px-3 py-2 flex items-center justify-between gap-3 text-xs font-mono text-rose-200 shadow-xl shadow-rose-950/40">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-black text-rose-300 uppercase tracking-wider bg-rose-900/60 px-1.5 py-0.5 rounded border border-rose-500/40">
            EVENT HALT ACTIVE (WAIT)
          </span>
          <span className="text-slate-100 font-bold">{statusText || activeEvent.title}</span>
        </div>
      </div>

      <button
        onClick={onOpenCalendar}
        className="px-2.5 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 border border-rose-400/60 text-white font-bold text-[10px] tracking-wide transition cursor-pointer shrink-0 flex items-center gap-1"
      >
        <Calendar className="h-3 w-3" />
        <span>Calendar</span>
      </button>
    </div>
  );
};
