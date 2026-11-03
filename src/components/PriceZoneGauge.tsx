import React from 'react';
import { PricePositionGuidance, PriceZone } from '../types/stocks';
import { Target, Info, AlertCircle } from 'lucide-react';

interface PriceZoneGaugeProps {
  guidance: PricePositionGuidance;
  currencySymbol?: string;
}

export const PriceZoneGauge: React.FC<PriceZoneGaugeProps> = ({ guidance, currencySymbol = '$' }) => {
  const { zone, score, currentPrice, fairValuePrice, supportPrice, resistancePrice, headline, guidanceText, disclaimer } = guidance;

  // Zones metadata
  const zones: { id: PriceZone; label: string; color: string; bgClass: string; textClass: string }[] = [
    { id: 'LOW', label: 'LOW', color: '#38bdf8', bgClass: 'bg-sky-500/20', textClass: 'text-sky-400' },
    { id: 'LOWER-MID', label: 'LWR-MID', color: '#34d399', bgClass: 'bg-emerald-500/20', textClass: 'text-emerald-400' },
    { id: 'FAIR', label: 'FAIR', color: '#06b6d4', bgClass: 'bg-cyan-500/20', textClass: 'text-cyan-300' },
    { id: 'UPPER-MID', label: 'UPR-MID', color: '#fbbf24', bgClass: 'bg-amber-500/20', textClass: 'text-amber-400' },
    { id: 'HIGH', label: 'HIGH', color: '#f87171', bgClass: 'bg-rose-500/20', textClass: 'text-rose-400' },
  ];

  const activeZoneMeta = zones.find(z => z.id === zone) || zones[2];

  return (
    <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2.5">
      {/* Title & Active Zone Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
          <Target className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold tracking-wider uppercase">Price Position Guidance</span>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border border-cyan-500/40 ${activeZoneMeta.bgClass} ${activeZoneMeta.textClass}`}>
          ZONE: {zone} ({score}%)
        </div>
      </div>

      {/* Visual 5-Zone Gauge Bar */}
      <div className="flex flex-col gap-1.5 pt-1">
        {/* Horizontal zones track */}
        <div className="relative w-full h-4 rounded-full bg-slate-900 border border-slate-700/60 p-0.5 flex overflow-hidden">
          {zones.map((z, idx) => (
            <div
              key={z.id}
              className={`flex-1 h-full flex items-center justify-center text-[9px] font-mono font-bold transition-colors ${
                z.id === zone
                  ? `${z.bgClass} ${z.textClass} border-b-2 border-current shadow-inner`
                  : 'text-slate-500 opacity-60'
              } ${idx > 0 ? 'border-l border-slate-800' : ''}`}
            >
              {z.label}
            </div>
          ))}
        </div>

        {/* Dynamic pointer triangle */}
        <div className="relative w-full h-3">
          <div 
            className="absolute -top-1 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
            style={{ left: `${Math.max(5, Math.min(95, score))}%` }}
          >
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-cyan-400" />
            <span className="text-[9px] font-mono font-bold text-cyan-300 -mt-0.5">
              {currencySymbol}{currentPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Range boundary markers */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 -mt-1">
          <span>Supp: {currencySymbol}{supportPrice.toFixed(2)}</span>
          <span className="text-cyan-300">VWAP: {currencySymbol}{fairValuePrice.toFixed(2)}</span>
          <span>Res: {currencySymbol}{resistancePrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Dynamic guidance box */}
      <div className={`p-2.5 rounded-xl border text-[11px] flex flex-col gap-1 ${activeZoneMeta.bgClass} border-slate-700/60`}>
        <div className={`font-bold font-mono ${activeZoneMeta.textClass}`}>
          {headline}
        </div>
        <div className="text-slate-300 leading-relaxed font-sans">
          {guidanceText}
        </div>
      </div>

      {/* Clear Mandatory Note */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono italic px-1 pt-0.5 border-t border-slate-800/80">
        <Info className="w-3 h-3 text-cyan-400 shrink-0" />
        <span>{disclaimer}</span>
      </div>
    </div>
  );
};
