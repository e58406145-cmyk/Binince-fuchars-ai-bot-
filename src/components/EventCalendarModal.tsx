import React from 'react';
import { EconomicEvent } from '../types/crypto';
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  X, 
  ExternalLink, 
  Landmark, 
  TrendingUp, 
  Users, 
  Building2, 
  BarChart2 
} from 'lucide-react';

interface EventCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EconomicEvent[];
  activeEvent: EconomicEvent | null;
  onSimulateEvent?: (event: EconomicEvent) => void;
  apiKey?: string;
  onSaveApiKey?: (key: string) => void;
}

export const EventCalendarModal: React.FC<EventCalendarModalProps> = ({
  isOpen,
  onClose,
  events,
  activeEvent,
  onSimulateEvent,
  apiKey,
  onSaveApiKey,
}) => {
  if (!isOpen) return null;

  const now = Date.now();

  const getCategoryIcon = (cat: EconomicEvent['category']) => {
    switch (cat) {
      case 'CENTRAL_BANK': return <Landmark className="h-4 w-4 text-purple-400" />;
      case 'INFLATION': return <TrendingUp className="h-4 w-4 text-rose-400" />;
      case 'EMPLOYMENT': return <Users className="h-4 w-4 text-cyan-400" />;
      case 'EARNINGS': return <Building2 className="h-4 w-4 text-amber-400" />;
      case 'GDP': return <BarChart2 className="h-4 w-4 text-emerald-400" />;
      default: return <Calendar className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                High-Impact Event Calendar
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Mandatory ±30 min trading halt protection before and after high-impact data
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Active Alert Banner if in ±30 min window */}
        {activeEvent && (
          <div className="bg-rose-950/80 border-b border-rose-500/50 p-3 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs font-mono">
              <span className="font-bold text-rose-300 block">PROTECTION WINDOW ACTIVE (±30 MIN):</span>
              <span className="text-slate-200">{activeEvent.title}</span>
              <p className="text-[10px] text-rose-400 mt-1">
                All signal generation is automatically locked to <strong>WAIT</strong> to protect against wide spreads and liquidity gaps.
              </p>
            </div>
          </div>
        )}

        {/* API Key Configuration */}
        {onSaveApiKey && (
          <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
            <span className="text-[11px] text-slate-400 shrink-0">Calendar API Key:</span>
            <input
              type="text"
              value={apiKey || ''}
              onChange={(e) => onSaveApiKey(e.target.value.trim())}
              placeholder="Configurable free API (e.g. Finnhub)"
              className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1 mb-1">
            <span>UPCOMING GLOBAL ECONOMIC DATA</span>
            <span>COUNTDOWN</span>
          </div>

          {events.map((evt) => {
            const diffMs = evt.timestamp - now;
            const diffMin = Math.round(diffMs / 60000);
            const isCurrentlyWithin30m = Math.abs(diffMin) <= 30;

            const timeFormatted = new Date(evt.timestamp).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={evt.id}
                className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  isCurrentlyWithin30m
                    ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/50'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-cyan-500/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(evt.category)}
                    <span className="font-bold font-mono text-xs text-white">
                      {evt.title}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black ${
                      evt.impact === 'HIGH' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {evt.impact}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                    <span>{evt.country} ({evt.currency})</span>
                    <span>•</span>
                    <span>{timeFormatted}</span>
                    {evt.forecast && <span>Forecast: <strong className="text-slate-300">{evt.forecast}</strong></span>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right font-mono">
                    {diffMin > 0 ? (
                      <div className="text-xs font-bold text-cyan-300">
                        In {diffMin > 60 ? `${Math.floor(diffMin / 60)}h ${diffMin % 60}m` : `${diffMin}m`}
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-slate-500">
                        {Math.abs(diffMin)}m ago
                      </div>
                    )}
                    <span className={`text-[9px] ${isCurrentlyWithin30m ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                      {isCurrentlyWithin30m ? 'HALT ACTIVE (WAIT)' : 'Safe'}
                    </span>
                  </div>

                  {onSimulateEvent && (
                    <button
                      onClick={() => onSimulateEvent(evt)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-900/60 border border-slate-700 text-[10px] font-mono text-slate-300 hover:text-white transition cursor-pointer"
                      title="Set event time to NOW (to test the ±30m protection lock and WAIT override)"
                    >
                      Test Window
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs font-mono">
          <span className="text-[11px] text-slate-400">
            Rules: High-impact central bank & inflation releases trigger mandatory WAIT signal.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
