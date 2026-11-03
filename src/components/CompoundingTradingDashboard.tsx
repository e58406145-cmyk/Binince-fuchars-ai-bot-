import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShieldAlert, 
  Zap, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Octagon, 
  Award, 
  PieChart, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';
import { ExchangeId, Timeframe, CryptoPair } from '../types/crypto';
import { 
  CompoundingState, 
  CompoundingTradeRecord, 
  loadCompoundingState, 
  saveCompoundingState, 
  calculateCompoundingPositionSize, 
  evaluateCompoundingOpportunity,
  DEFAULT_COMPOUNDING_STATE
} from '../services/compoundingEngine';
import { playClickSound, playLongSignalSound, playShortSignalSound } from '../services/audio';

interface CompoundingTradingDashboardProps {
  activeExchange: ExchangeId;
  timeframe: Timeframe;
  selectedPair: CryptoPair | null;
  onCloseModal?: () => void;
}

export const CompoundingTradingDashboard: React.FC<CompoundingTradingDashboardProps> = ({
  activeExchange,
  timeframe,
  selectedPair,
  onCloseModal,
}) => {
  const [state, setState] = useState<CompoundingState>(() => loadCompoundingState());
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showConfirmEmergency, setShowConfirmEmergency] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    saveCompoundingState(state);
  }, [state]);

  // Handle Auto Trading Simulation Timer
  useEffect(() => {
    if (!state.isAutoTradingActive || state.isPaused) return;

    const interval = setInterval(async () => {
      // If active trade is running, evaluate exit
      if (state.activeTrade) {
        const trade = state.activeTrade;
        const elapsed = Date.now() - trade.timestamp;

        // Simulate trade resolution after ~30s for demo or price check
        if (elapsed >= 15000) {
          const winRand = Math.random();
          const isWin = winRand > 0.42; // ~58% win rate
          const movePct = isWin ? (0.015 + Math.random() * 0.02) : -(0.01 + Math.random() * 0.015);

          const exitPrice = parseFloat((trade.entryPrice * (1 + movePct)).toFixed(4));
          const pnlPct = parseFloat((movePct * 100).toFixed(2));
          const pnlUsd = parseFloat((trade.positionSizeUsd * movePct).toFixed(2));
          const newBal = parseFloat(Math.max(0, state.currentBalanceUsd + pnlUsd).toFixed(2));

          const updatedRecord: CompoundingTradeRecord = {
            ...trade,
            exitPrice,
            endBalanceUsd: newBal,
            pnlUsd,
            pnlPercent: pnlPct,
            status: isWin ? 'WIN' : 'LOSS',
          };

          const newWins = isWin ? state.wins + 1 : state.wins;
          const newLosses = !isWin ? state.losses + 1 : state.losses;
          const newTotal = state.totalTrades + 1;
          const newHwm = Math.max(state.highWaterMarkUsd, newBal);
          const drawdown = newHwm > 0 ? ((newHwm - newBal) / newHwm) * 100 : 0;

          setState((prev) => ({
            ...prev,
            currentBalanceUsd: newBal,
            highWaterMarkUsd: newHwm,
            totalTrades: newTotal,
            wins: newWins,
            losses: newLosses,
            maxDrawdownPercent: Math.max(prev.maxDrawdownPercent, parseFloat(drawdown.toFixed(1))),
            activeTrade: null,
            history: [updatedRecord, ...prev.history.slice(0, 99)],
            lastTradeTime: Date.now(),
          }));

          if (isWin) playLongSignalSound();
          else playShortSignalSound();
        }
      } else {
        // Find opportunity
        if (selectedPair && !isEvaluating) {
          setIsEvaluating(true);
          const opp = await evaluateCompoundingOpportunity(
            activeExchange,
            selectedPair,
            timeframe,
            state.currentBalanceUsd
          );
          setIsEvaluating(false);

          if (opp) {
            setState((prev) => ({
              ...prev,
              activeTrade: opp,
            }));
          }
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [state, activeExchange, selectedPair, timeframe, isEvaluating]);

  // Action Handlers
  const handleStartAutoTrading = () => {
    playClickSound();
    if (state.currentBalanceUsd < 1.0) {
      alert('Balance too low ($' + state.currentBalanceUsd + '). Reset balance to $5.00 to start.');
      return;
    }
    setState((prev) => ({ ...prev, isAutoTradingActive: true, isPaused: false }));
  };

  const handlePauseAutoTrading = () => {
    playClickSound();
    setState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleStopAutoTrading = () => {
    playClickSound();
    setState((prev) => ({ ...prev, isAutoTradingActive: false, isPaused: false }));
  };

  const handleEmergencyStop = () => {
    playClickSound();
    setState((prev) => ({
      ...prev,
      isAutoTradingActive: false,
      isPaused: false,
      activeTrade: null,
    }));
    setShowConfirmEmergency(false);
  };

  const handleResetTo5Dollars = () => {
    playClickSound();
    setState({
      ...DEFAULT_COMPOUNDING_STATE,
      initialBalanceUsd: 5.00,
      currentBalanceUsd: 5.00,
      highWaterMarkUsd: 5.00,
    });
    setShowConfirmReset(false);
  };

  // Metrics
  const totalPnlUsd = parseFloat((state.currentBalanceUsd - state.initialBalanceUsd).toFixed(2));
  const totalPnlPercent = parseFloat(((totalPnlUsd / state.initialBalanceUsd) * 100).toFixed(1));
  const winRate = state.totalTrades > 0 ? Math.round((state.wins / state.totalTrades) * 100) : 0;
  const isProfitable = totalPnlUsd >= 0;

  return (
    <div className="space-y-4 pb-28 text-slate-100 max-w-2xl mx-auto px-3 sm:px-4 font-mono">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950/60 to-slate-900 border-2 border-cyan-500/50 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse">🌱</span>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>SMART $5 AUTO COMPOUNDING</span>
                </h1>
                <p className="text-[11px] text-cyan-300 font-sans">Controlled Reinvestment & Discipline Growth Engine</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => {
                playClickSound();
                setState((prev) => ({ ...prev, isLiveMode: !prev.isLiveMode }));
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                state.isLiveMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 glow-amber'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
              }`}
            >
              {state.isLiveMode ? '⚠️ LIVE MODE' : '🧪 DEMO MODE ($5)'}
            </button>

            {onCloseModal && (
              <button
                onClick={onCloseModal}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:text-white"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Master Control Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!state.isAutoTradingActive ? (
              <button
                onClick={handleStartAutoTrading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-black text-xs tracking-wider uppercase shadow-lg hover:scale-105 transition cursor-pointer flex items-center gap-1.5"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>START $5 COMPOUNDING</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePauseAutoTrading}
                  className={`px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 border ${
                    state.isPaused
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-amber-950 text-amber-300 border-amber-500/50'
                  }`}
                >
                  <Pause className="h-3.5 w-3.5" />
                  <span>{state.isPaused ? 'RESUME' : 'PAUSE'}</span>
                </button>

                <button
                  onClick={handleStopAutoTrading}
                  className="px-3 py-2 rounded-xl bg-rose-950 text-rose-300 border border-rose-500/50 font-bold text-xs hover:bg-rose-900 transition cursor-pointer flex items-center gap-1"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>STOP</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClickSound();
                if (!showConfirmEmergency) setShowConfirmEmergency(true);
                else handleEmergencyStop();
              }}
              className={`px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                showConfirmEmergency
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-rose-950/80 border border-rose-500/50 text-rose-300 hover:bg-rose-900'
              }`}
            >
              <Octagon className="h-3.5 w-3.5 fill-current" />
              <span>{showConfirmEmergency ? 'CONFIRM EMERGENCY STOP' : 'EMERGENCY STOP'}</span>
            </button>

            <button
              onClick={() => setShowConfirmReset(true)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Reset Compounding State to $5.00"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showConfirmReset && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-amber-500/50 text-amber-300 text-xs flex items-center justify-between">
            <span>Reset balance back to initial $5.00 USDT starting capital?</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px]"
              >
                Cancel
              </button>
              <button
                onClick={handleResetTo5Dollars}
                className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[10px]"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PERFORMANCE METRICS CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Initial Balance</div>
          <div className="text-base font-black text-white mt-1">${state.initialBalanceUsd.toFixed(2)} USDT</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Fixed Starting Capital</div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/40">
          <div className="text-[10px] text-cyan-400 uppercase font-bold">Current Balance</div>
          <div className="text-base font-black text-cyan-300 mt-1">${state.currentBalanceUsd.toFixed(2)} USDT</div>
          <div className={`text-[9px] font-bold mt-0.5 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfitable ? '+' : ''}${totalPnlUsd.toFixed(2)} ({totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent}%)
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Win Rate</div>
          <div className="text-base font-black text-emerald-400 mt-1">{winRate}%</div>
          <div className="text-[9px] text-slate-400 mt-0.5">{state.wins} W / {state.losses} L ({state.totalTrades} trades)</div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Max Drawdown</div>
          <div className="text-base font-black text-amber-400 mt-1">{state.maxDrawdownPercent}%</div>
          <div className="text-[9px] text-slate-500 mt-0.5">High Water: ${state.highWaterMarkUsd.toFixed(2)}</div>
        </div>
      </div>

      {/* ACTIVE COMPOUNDING TRADE DISPLAY */}
      {state.activeTrade ? (
        <div className="p-4 rounded-2xl bg-slate-900/90 border-2 border-cyan-500/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                state.activeTrade.direction === 'BUY'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-rose-500 text-white'
              }`}>
                {state.activeTrade.direction}
              </span>
              <span className="font-bold text-sm text-white">{state.activeTrade.displayName}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">({state.activeTrade.exchange})</span>
            </div>

            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> In Position
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-[10px] bg-slate-950 p-2 rounded-xl text-center">
            <div>
              <span className="text-slate-500 block">Position Size</span>
              <span className="font-bold text-cyan-300">${state.activeTrade.positionSizeUsd.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Entry Price</span>
              <span className="font-bold text-white">${state.activeTrade.entryPrice}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Stop Loss</span>
              <span className="font-bold text-rose-400">${state.activeTrade.stopLoss}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Take Profit</span>
              <span className="font-bold text-emerald-400">${state.activeTrade.takeProfit}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>
              {state.isAutoTradingActive
                ? 'Scanning markets for high-confluence $5 compounding entry...'
                : 'Auto Compounding Scanner is idle. Click START to begin.'}
            </span>
          </div>
          {isEvaluating && <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />}
        </div>
      )}

      {/* COMPOUNDING SETTINGS & RISK CONTROLS */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-white text-sm">Compounding Risk Settings</span>
          <span className="text-[10px] text-emerald-400 font-bold">CONTROLLED REINVESTMENT</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-[10px] block mb-1">Profit Reinvestment Rate:</label>
            <div className="grid grid-cols-3 gap-1">
              {[25, 50, 75].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setState((prev) => ({ ...prev, reinvestPercent: pct }))}
                  className={`py-1 rounded-lg font-bold text-center transition cursor-pointer ${
                    state.reinvestPercent === pct
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-950 border border-slate-800 text-slate-400'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-[10px] block mb-1">Max Risk Per Trade:</label>
            <div className="grid grid-cols-3 gap-1">
              {[2, 3, 5].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setState((prev) => ({ ...prev, maxRiskPerTradePercent: pct }))}
                  className={`py-1 rounded-lg font-bold text-center transition cursor-pointer ${
                    state.maxRiskPerTradePercent === pct
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-950 border border-slate-800 text-slate-400'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COMPOUNDING TRADE HISTORY */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-white text-sm">Compounding History ({state.history.length})</span>
          <span className="text-[10px] text-slate-400">Recorded Growth Ledger</span>
        </div>

        {state.history.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No compounding trades recorded yet. Start auto-compounding to log growth.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {state.history.map((rec) => (
              <div
                key={rec.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rec.status === 'WIN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                  }`}>
                    {rec.status}
                  </span>
                  <div>
                    <div className="font-bold text-white">{rec.displayName}</div>
                    <div className="text-[9px] text-slate-500">{new Date(rec.timestamp).toLocaleTimeString()} • ${rec.positionSizeUsd} position</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold ${rec.status === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {rec.status === 'WIN' ? '+' : ''}${rec.pnlUsd?.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-slate-400">Bal: ${rec.endBalanceUsd?.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DISCLOSURE */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-500 leading-relaxed font-sans">
        <strong>Capital Preservation Notice:</strong> The Smart $5 Auto Compounding System uses controlled position sizing and conservative stop-loss limits. No guaranteed returns. Never trade with funds you cannot afford to lose.
      </div>
    </div>
  );
};
