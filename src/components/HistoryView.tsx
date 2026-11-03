import React, { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Trash2, 
  Download, 
  Clock, 
  Filter,
  Share2,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  BarChart3,
  Play,
  RotateCcw,
  Scale,
  ShieldAlert,
  Flame,
  Award
} from 'lucide-react';
import { SignalResult, WhatsAppLogEntry, PaperTradeRecord, BacktestResult, Timeframe, KlineData } from '../types/crypto';
import { playClickSound } from '../services/audio';
import { formatCryptoPrice, formatPercent } from '../utils/formatters';
import { runBacktest } from '../services/backtestEngine';
import { WeeklyReportView } from './WeeklyReportView';

interface HistoryViewProps {
  history: SignalResult[];
  paperTrades?: PaperTradeRecord[];
  whatsappLogs?: WhatsAppLogEntry[];
  onClearHistory: () => void;
  onClearPaperTrades?: () => void;
  onClearWhatsAppLogs?: () => void;
  onSelectSignal: (sig: SignalResult) => void;
  selectedPairSymbol?: string;
  currentTimeframe?: Timeframe;
  recentKlines?: KlineData[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  paperTrades = [],
  whatsappLogs = [],
  onClearHistory,
  onClearPaperTrades,
  onClearWhatsAppLogs,
  onSelectSignal,
  selectedPairSymbol = 'BTCUSDT',
  currentTimeframe = '15m',
  recentKlines = [],
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'signals' | 'journal' | 'report' | 'stats' | 'backtest' | 'whatsapp'>('signals');
  const [filter, setFilter] = useState<'ALL' | 'LONG' | 'SHORT' | 'NO_TRADE'>('ALL');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Backtest state
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  const filteredSignals = history.filter((item) => {
    if (filter === 'ALL') return true;
    return item.signal === filter;
  });

  // Calculate paper trading stats
  const totalPaperTrades = paperTrades.length;
  const paperWins = paperTrades.filter((t) => t.result === 'WIN').length;
  const paperLosses = paperTrades.filter((t) => t.result === 'LOSS').length;
  const paperDraws = paperTrades.filter((t) => t.result === 'DRAW').length;
  const measuredWinRate = totalPaperTrades >= 30 
    ? `${((paperWins / totalPaperTrades) * 100).toFixed(1)}%` 
    : 'Not enough data yet (<30 trades)';
  const netPaperPnlUsd = paperTrades.reduce((sum, t) => sum + (t.pnlUsd || 0), 0);
  const totalFeesPaid = paperTrades.reduce((sum, t) => sum + (t.feesPaidUsd || 0), 0);

  // Win rate per pair breakdown
  const pairStatsMap: Record<string, { total: number; wins: number }> = {};
  paperTrades.forEach((t) => {
    if (!pairStatsMap[t.displayName]) pairStatsMap[t.displayName] = { total: 0, wins: 0 };
    pairStatsMap[t.displayName].total += 1;
    if (t.result === 'WIN') pairStatsMap[t.displayName].wins += 1;
  });

  // Cumulative equity curve data points
  let runningPnl = 0;
  const equityCurvePoints = paperTrades.map((t, idx) => {
    runningPnl += t.pnlPercent || 0;
    return { tradeNum: idx + 1, cumulativePnl: runningPnl };
  });

  const handleExport = () => {
    playClickSound();
    let dataToExport: any = history;
    if (activeSubTab === 'journal' || activeSubTab === 'stats' || activeSubTab === 'report') dataToExport = paperTrades;
    else if (activeSubTab === 'whatsapp') dataToExport = whatsappLogs;
    else if (activeSubTab === 'backtest') dataToExport = backtestResult;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `cyberpulse_${activeSubTab}_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const handleRunBacktest = () => {
    playClickSound();
    setIsBacktesting(true);
    setTimeout(() => {
      const res = runBacktest(selectedPairSymbol, currentTimeframe, recentKlines, true);
      setBacktestResult(res);
      setIsBacktesting(false);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-3 pb-24 text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Terminal History & Analytics</h2>
          <p className="text-xs text-slate-400 font-mono">
            {history.length} Signals · {paperTrades.length} Logged Trades · {whatsappLogs.length} WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExport}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 transition cursor-pointer"
            title="Export JSON"
          >
            <Download className="h-4 w-4" />
          </button>
          {showConfirmClear ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  playClickSound();
                  if (activeSubTab === 'signals') onClearHistory();
                  else if (activeSubTab === 'journal' || activeSubTab === 'report') onClearPaperTrades?.();
                  else if (activeSubTab === 'whatsapp') onClearWhatsAppLogs?.();
                  setShowConfirmClear(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-500 transition cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                playClickSound();
                setShowConfirmClear(true);
              }}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition cursor-pointer"
              title="Clear Logs"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Subtab Navigation (6 Tabs) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-mono font-bold">
        <button
          onClick={() => { playClickSound(); setActiveSubTab('signals'); }}
          className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
            activeSubTab === 'signals' ? 'bg-cyan-500 text-slate-950 shadow glow-cyan' : 'text-slate-400 hover:text-white'
          }`}
        >
          Signals
        </button>
        <button
          onClick={() => { playClickSound(); setActiveSubTab('journal'); }}
          className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
            activeSubTab === 'journal' ? 'bg-cyan-500 text-slate-950 shadow glow-cyan' : 'text-slate-400 hover:text-white'
          }`}
        >
          Journal ({paperTrades.length})
        </button>
        <button
          onClick={() => { playClickSound(); setActiveSubTab('report'); }}
          className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
            activeSubTab === 'report' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow glow-cyan' : 'text-slate-400 hover:text-white'
          }`}
        >
          Reports
        </button>
        <button
          onClick={() => { playClickSound(); setActiveSubTab('stats'); }}
          className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
            activeSubTab === 'stats' ? 'bg-cyan-500 text-slate-950 shadow glow-cyan' : 'text-slate-400 hover:text-white'
          }`}
        >
          Stats
        </button>
        <button
          onClick={() => { playClickSound(); setActiveSubTab('backtest'); }}
          className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
            activeSubTab === 'backtest' ? 'bg-cyan-500 text-slate-950 shadow glow-cyan' : 'text-slate-400 hover:text-white'
          }`}
        >
          Backtest
        </button>
        <button
          onClick={() => { playClickSound(); setActiveSubTab('whatsapp'); }}
          className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
            activeSubTab === 'whatsapp' ? 'bg-emerald-500 text-slate-950 shadow glow-green' : 'text-slate-400 hover:text-white'
          }`}
        >
          WhatsApp
        </button>
      </div>

      {/* 1. SIGNALS LOG SUBTAB */}
      {activeSubTab === 'signals' && (
        <div className="flex flex-col gap-2.5">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            {(['ALL', 'LONG', 'SHORT', 'NO_TRADE'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  playClickSound();
                  setFilter(mode);
                }}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filter === mode
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/50 font-bold'
                    : 'bg-slate-950 text-slate-500 hover:text-slate-300'
                }`}
              >
                {mode.replace('_', ' ')}
              </button>
            ))}
          </div>

          {filteredSignals.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs font-mono">
              No signal events recorded. Tap "Generate Signal" on the Dashboard.
            </div>
          ) : (
            filteredSignals.map((item) => {
              const isLong = item.signal === 'LONG';
              const isShort = item.signal === 'SHORT';
              const dateStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    playClickSound();
                    onSelectSignal(item);
                  }}
                  className={`p-3 rounded-xl bg-slate-900/80 border transition-all cursor-pointer flex items-center justify-between hover:bg-slate-800/80 ${
                    isLong
                      ? 'border-emerald-500/40 hover:border-emerald-400'
                      : isShort
                      ? 'border-red-500/40 hover:border-red-400'
                      : 'border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${
                      isLong ? 'bg-emerald-500/20 text-emerald-400' : isShort ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {isLong && <ArrowUp className="h-4 w-4 stroke-[3]" />}
                      {isShort && <ArrowDown className="h-4 w-4 stroke-[3]" />}
                      {!isLong && !isShort && <Minus className="h-4 w-4 stroke-[3]" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{item.displayName}</span>
                        <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400 uppercase">
                          {item.timeframe}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          item.source === 'AUTO'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                            : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                        }`}>
                          {item.source || 'MANUAL'}
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${
                          isLong ? 'text-emerald-400' : isShort ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {item.signal}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Entry: ${formatCryptoPrice(item.entryPrice)} · R:R 1:{item.riskRewardRatio} · Score: {Math.round(item.confidenceScore)}/100
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500">{dateStr}</span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. PAPER TRADE JOURNAL SUBTAB */}
      {activeSubTab === 'journal' && (
        <div className="flex flex-col gap-2.5">
          {paperTrades.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs font-mono">
              No paper trades logged yet. Tap "I took this trade" when a signal appears to log virtual trades.
            </div>
          ) : (
            paperTrades.map((trade) => {
              const isWin = trade.result === 'WIN';
              const isLoss = trade.result === 'LOSS';
              const dateStr = new Date(trade.entryTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={trade.id}
                  className={`p-3 rounded-xl bg-slate-900/80 border flex flex-col gap-1.5 ${
                    isWin ? 'border-emerald-500/40' : isLoss ? 'border-red-500/40' : 'border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                        trade.direction === 'LONG' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                      }`}>
                        {trade.direction}
                      </span>
                      <span className="font-bold text-xs text-white">{trade.displayName}</span>
                      <span className="text-[10px] font-mono text-slate-400">({trade.timeframe})</span>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold ${isWin ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-amber-400'}`}>
                        {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}% (${(trade.pnlUsd || 0).toFixed(2)})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
                    <div>Entry: <span className="text-slate-200">${formatCryptoPrice(trade.entryPrice)}</span></div>
                    <div>Exit: <span className="text-slate-200">${formatCryptoPrice(trade.exitPrice)}</span></div>
                    <div>Reason: <span className="text-cyan-400">{trade.exitReason}</span></div>
                    <div className="text-right text-slate-500">{dateStr}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2.5. WEEKLY & MONTHLY PERFORMANCE REPORT */}
      {activeSubTab === 'report' && (
        <WeeklyReportView paperTrades={paperTrades} />
      )}

      {/* 3. PERFORMANCE STATS & EQUITY CURVE */}
      {activeSubTab === 'stats' && (
        <div className="flex flex-col gap-3 font-mono">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Measured Win Rate</span>
              <div className="text-base font-bold text-cyan-300 mt-0.5">{measuredWinRate}</div>
              <span className="text-[9px] text-slate-500">{totalPaperTrades} trades logged (req: 30)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Net Realized P/L</span>
              <div className={`text-base font-bold mt-0.5 ${netPaperPnlUsd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${netPaperPnlUsd.toFixed(2)}
              </div>
              <span className="text-[9px] text-slate-500">Fees paid: ${totalFeesPaid.toFixed(2)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">W / L / D Ratio</span>
              <div className="text-base font-bold text-white mt-0.5">
                {paperWins}W · {paperLosses}L · {paperDraws}D
              </div>
              <span className="text-[9px] text-slate-500">Strict mode enabled</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Live Mode Unlock</span>
              <div className="text-base font-bold text-amber-400 mt-0.5">
                {totalPaperTrades >= 100 ? 'Unlocked' : `${totalPaperTrades}/100 Trades`}
              </div>
              <span className="text-[9px] text-slate-500">Paper-trading safeguard</span>
            </div>
          </div>

          {/* Equity Curve Visual Bar */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Cumulative Paper Equity Curve</span>
              <span className="text-cyan-400 text-[10px]">{equityCurvePoints.length} Data Points</span>
            </div>

            {equityCurvePoints.length === 0 ? (
              <div className="h-20 flex items-center justify-center text-slate-600 text-[11px]">
                Log paper trades to generate cumulative equity curve
              </div>
            ) : (
              <div className="h-24 flex items-end gap-1 pt-2 pb-1 border-b border-slate-800 overflow-x-auto scrollbar-none">
                {equityCurvePoints.map((pt, i) => {
                  const heightPct = Math.min(100, Math.max(10, Math.abs(pt.cumulativePnl) * 5));
                  const isPositive = pt.cumulativePnl >= 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 min-w-[6px] rounded-t flex flex-col justify-end"
                      title={`Trade #${pt.tradeNum}: ${pt.cumulativePnl.toFixed(2)}%`}
                    >
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pair-by-Pair Breakdown */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <span className="text-xs font-bold text-slate-200 block">Win Rate by Pair</span>
            {Object.keys(pairStatsMap).length === 0 ? (
              <span className="text-slate-500 text-[11px]">No pair trade data yet</span>
            ) : (
              Object.entries(pairStatsMap).map(([pName, st]) => (
                <div key={pName} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-800/60">
                  <span className="text-slate-300 font-semibold">{pName}</span>
                  <span className="text-cyan-300 font-bold">
                    {((st.wins / st.total) * 100).toFixed(1)}% ({st.wins}/{st.total} wins)
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. BACKTEST ENGINE SUBTAB */}
      {activeSubTab === 'backtest' && (
        <div className="flex flex-col gap-3 font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Historical K-Line Backtest</h3>
                <p className="text-[10px] text-slate-400">
                  Includes 0.05% taker fees per side (0.10%) + 0.04% slippage
                </p>
              </div>
              <button
                onClick={handleRunBacktest}
                disabled={isBacktesting}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow glow-cyan"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isBacktesting ? 'Computing...' : 'Run Backtest'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
              <span>Target: <strong className="text-cyan-300">{selectedPairSymbol}</strong></span>
              <span>Timeframe: <strong className="text-cyan-300">{currentTimeframe}</strong></span>
              <span>Candles: <strong className="text-white">{recentKlines.length}</strong></span>
            </div>
          </div>

          {backtestResult && (
            <div className="space-y-3">
              {/* Backtest KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Win Rate</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {backtestResult.winRatePercent}%
                  </div>
                  <span className="text-[9px] text-slate-500">{backtestResult.winCount}W / {backtestResult.lossCount}L</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Net P/L (After Fees)</span>
                  <div className={`text-sm font-bold mt-0.5 ${backtestResult.netPnlPercentAfterFees >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {backtestResult.netPnlPercentAfterFees >= 0 ? '+' : ''}{backtestResult.netPnlPercentAfterFees}%
                  </div>
                  <span className="text-[9px] text-slate-500">Gross: {backtestResult.totalPnlPercent}%</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Profit Factor</span>
                  <div className="text-sm font-bold text-cyan-300 mt-0.5">
                    {backtestResult.profitFactor}
                  </div>
                  <span className="text-[9px] text-slate-500">Gross Gains/Losses</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Max Drawdown</span>
                  <div className="text-sm font-bold text-red-400 mt-0.5">
                    -{backtestResult.maxDrawdownPercent}%
                  </div>
                  <span className="text-[9px] text-slate-500">Peak to trough</span>
                </div>
              </div>

              {/* Backtest Trades Table */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">Simulated Trade History ({backtestResult.trades.length})</span>
                <div className="max-h-60 overflow-y-auto space-y-1.5 scrollbar-none">
                  {backtestResult.trades.map((t, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold px-1 rounded ${t.direction === 'LONG' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                          {t.direction}
                        </span>
                        <span>Entry: ${formatCryptoPrice(t.entryPrice)}</span>
                        <span>Exit: ${formatCryptoPrice(t.exitPrice)}</span>
                        <span className="text-slate-500">({t.reason})</span>
                      </div>
                      <span className={`font-bold ${t.netPnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.netPnlPercent >= 0 ? '+' : ''}{t.netPnlPercent.toFixed(2)}% net
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. SENT TO WHATSAPP SUBTAB */}
      {activeSubTab === 'whatsapp' && (
        <div className="flex flex-col gap-2.5">
          {whatsappLogs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs font-mono">
              No WhatsApp messages dispatched yet. Configure recipients in Settings and execute signals.
            </div>
          ) : (
            whatsappLogs.map((log) => {
              const dateStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 uppercase">
                        {log.eventType}
                      </span>
                      <span className="font-mono text-xs font-bold text-white">{log.pair}</span>
                      <span className="text-[10px] font-mono text-slate-400">→ {log.recipient}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        log.status === 'SENT'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : log.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{dateStr}</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800/80 break-words whitespace-pre-wrap leading-relaxed">
                    {log.previewText}
                  </p>

                  {log.error && (
                    <span className="text-[10px] font-mono text-red-400">Error: {log.error}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
