import React, { useState } from 'react';
import { PaperTradeRecord } from '../types/crypto';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  AlertCircle, 
  Award, 
  Clock, 
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { formatPercent } from '../utils/formatters';

interface WeeklyReportViewProps {
  paperTrades: PaperTradeRecord[];
}

export const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({ paperTrades }) => {
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'ALL_TIME'>('WEEKLY');

  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 3600 * 1000;
  const oneMonthAgo = now - 30 * 24 * 3600 * 1000;

  // Filter trades by period
  const filteredTrades = paperTrades.filter((t) => {
    if (period === 'WEEKLY') return t.exitTime >= oneWeekAgo;
    if (period === 'MONTHLY') return t.exitTime >= oneMonthAgo;
    return true;
  });

  const totalTrades = filteredTrades.length;
  const totalAllTimeTrades = paperTrades.length;
  const hasEnoughData = totalTrades >= 30;

  // Compute metrics
  const wins = filteredTrades.filter((t) => t.result === 'WIN');
  const losses = filteredTrades.filter((t) => t.result === 'LOSS');
  const draws = filteredTrades.filter((t) => t.result === 'DRAW');

  const winCount = wins.length;
  const lossCount = losses.length;
  const drawCount = draws.length;

  const winRatePercent = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const lossRatePercent = totalTrades > 0 ? (lossCount / totalTrades) * 100 : 0;

  const totalWinUsd = wins.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
  const totalLossUsd = Math.abs(losses.reduce((acc, t) => acc + (t.pnlUsd || 0), 0));
  const totalWinPct = wins.reduce((acc, t) => acc + (t.pnlPercent || 0), 0);
  const totalLossPct = Math.abs(losses.reduce((acc, t) => acc + (t.pnlPercent || 0), 0));

  const avgWinUsd = winCount > 0 ? totalWinUsd / winCount : 0;
  const avgLossUsd = lossCount > 0 ? totalLossUsd / lossCount : 0;
  const avgWinPct = winCount > 0 ? totalWinPct / winCount : 0;
  const avgLossPct = lossCount > 0 ? totalLossPct / lossCount : 0;

  // Mathematical Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)
  const expectancyUsd = (winRatePercent / 100) * avgWinUsd - (lossRatePercent / 100) * avgLossUsd;
  const expectancyPct = (winRatePercent / 100) * avgWinPct - (lossRatePercent / 100) * avgLossPct;

  const netPnlUsd = filteredTrades.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
  const totalFees = filteredTrades.reduce((acc, t) => acc + (t.feesPaidUsd || 0), 0);

  // Maximum Drawdown computation
  let peak = 0;
  let maxDrawdownPct = 0;
  let cumulativePnl = 0;
  const chartPoints: Array<{ x: number; y: number; val: number }> = [];

  // Sort ascending by exit time for cumulative curve
  const sortedTrades = [...filteredTrades].sort((a, b) => a.exitTime - b.exitTime);

  sortedTrades.forEach((t, idx) => {
    cumulativePnl += t.pnlPercent || 0;
    if (cumulativePnl > peak) peak = cumulativePnl;
    const dd = peak - cumulativePnl;
    if (dd > maxDrawdownPct) maxDrawdownPct = dd;
    chartPoints.push({ x: idx, y: cumulativePnl, val: t.pnlPercent || 0 });
  });

  // Best & Worst Pair
  const pairPnlMap: Record<string, { pnlUsd: number; wins: number; total: number }> = {};
  filteredTrades.forEach((t) => {
    if (!pairPnlMap[t.displayName]) pairPnlMap[t.displayName] = { pnlUsd: 0, wins: 0, total: 0 };
    pairPnlMap[t.displayName].pnlUsd += t.pnlUsd || 0;
    pairPnlMap[t.displayName].total += 1;
    if (t.result === 'WIN') pairPnlMap[t.displayName].wins += 1;
  });

  const pairList = Object.entries(pairPnlMap).map(([name, data]) => ({ name, ...data }));
  pairList.sort((a, b) => b.pnlUsd - a.pnlUsd);

  const bestPair = pairList.length > 0 ? pairList[0] : null;
  const worstPair = pairList.length > 0 ? pairList[pairList.length - 1] : null;

  // Best & Worst Timeframe
  const tfPnlMap: Record<string, number> = {};
  filteredTrades.forEach((t) => {
    tfPnlMap[t.timeframe] = (tfPnlMap[t.timeframe] || 0) + (t.pnlUsd || 0);
  });

  const tfList = Object.entries(tfPnlMap).map(([tf, pnl]) => ({ tf, pnl }));
  tfList.sort((a, b) => b.pnl - a.pnl);

  const bestTf = tfList.length > 0 ? tfList[0] : null;
  const worstTf = tfList.length > 0 ? tfList[tfList.length - 1] : null;

  return (
    <div className="space-y-4 text-slate-100 font-mono">
      {/* Period Selection Controls */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Calendar className="h-4 w-4 text-cyan-400" />
          <span>REPORT HORIZON:</span>
        </div>

        <div className="flex items-center gap-1">
          {(['WEEKLY', 'MONTHLY', 'ALL_TIME'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                period === p
                  ? 'bg-cyan-500 text-slate-950 glow-cyan'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {p === 'WEEKLY' ? 'Weekly' : p === 'MONTHLY' ? 'Monthly' : 'All-Time'}
            </button>
          ))}
        </div>
      </div>

      {/* "Not Enough Data" Notice (< 30 trades) */}
      {!hasEnoughData ? (
        <div className="bg-slate-900/70 border-2 border-amber-500/40 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
            <AlertCircle className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-amber-300">
              Not Enough Data ({totalTrades} / 30 trades logged)
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Statistical quantitative reports, average win/loss ratios, expectancy, and drawdown require at least <strong>30 completed paper trades</strong> in this horizon to eliminate small-sample noise.
            </p>
          </div>

          {/* Progress to 30 */}
          <div className="max-w-xs mx-auto">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Sample Progress</span>
              <span>{Math.round((totalTrades / 30) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (totalTrades / 30) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Full Quantitative Performance Report */
        <div className="space-y-4">
          {/* 4 Metric Top Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Total Trades & Win Rate */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Win Rate ({winCount}W / {lossCount}L)</div>
              <div className="text-lg font-black text-cyan-300 mt-1">
                {winRatePercent.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400">{totalTrades} Total Trades</div>
            </div>

            {/* Avg Win vs Avg Loss */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Avg Win / Avg Loss</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                +${avgWinUsd.toFixed(2)} (+{avgWinPct.toFixed(2)}%)
              </div>
              <div className="text-sm font-bold text-rose-400">
                -${avgLossUsd.toFixed(2)} (-{avgLossPct.toFixed(2)}%)
              </div>
            </div>

            {/* Mathematical Expectancy */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Expectancy / Trade</div>
              <div className={`text-lg font-black mt-1 ${expectancyUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {expectancyUsd >= 0 ? '+' : ''}${expectancyUsd.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">
                {expectancyPct >= 0 ? '+' : ''}{expectancyPct.toFixed(2)}% net
              </div>
            </div>

            {/* Max Drawdown */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Max Drawdown</div>
              <div className="text-lg font-black text-amber-400 mt-1">
                -{maxDrawdownPct.toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-400">Fees Paid: ${totalFees.toFixed(2)}</div>
            </div>
          </div>

          {/* Best / Worst Pair & Timeframe Performance Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pairs */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Pair Performance</span>
                <Award className="h-4 w-4 text-cyan-400" />
              </div>

              {bestPair && (
                <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">Best Performing Pair</span>
                    <strong className="text-white">{bestPair.name}</strong>
                    <span className="text-[10px] text-slate-400 block">{bestPair.wins}/{bestPair.total} wins</span>
                  </div>
                  <span className="text-sm font-black text-emerald-400">+${bestPair.pnlUsd.toFixed(2)}</span>
                </div>
              )}

              {worstPair && (
                <div className="flex items-center justify-between bg-rose-950/30 border border-rose-500/30 p-2.5 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] text-rose-400 uppercase font-bold block">Worst Performing Pair</span>
                    <strong className="text-white">{worstPair.name}</strong>
                    <span className="text-[10px] text-slate-400 block">{worstPair.total - worstPair.wins}/{worstPair.total} losses</span>
                  </div>
                  <span className="text-sm font-black text-rose-400">${worstPair.pnlUsd.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Timeframes */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Timeframe Edge</span>
                <Clock className="h-4 w-4 text-cyan-400" />
              </div>

              {bestTf && (
                <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">Most Profitable TF</span>
                    <strong className="text-white text-sm">{bestTf.tf}</strong>
                  </div>
                  <span className="text-sm font-black text-emerald-400">+${bestTf.pnl.toFixed(2)}</span>
                </div>
              )}

              {worstTf && (
                <div className="flex items-center justify-between bg-rose-950/30 border border-rose-500/30 p-2.5 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] text-rose-400 uppercase font-bold block">Least Profitable TF</span>
                    <strong className="text-white text-sm">{worstTf.tf}</strong>
                  </div>
                  <span className="text-sm font-black text-rose-400">${worstTf.pnl.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Simple Cumulative Equity Curve Chart */}
          {chartPoints.length > 1 && (
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>Cumulative Performance Curve (%)</span>
                </span>
                <span className={`text-xs font-bold ${cumulativePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {cumulativePnl >= 0 ? '+' : ''}{cumulativePnl.toFixed(2)}% Net
                </span>
              </div>

              {/* Lightweight SVG Equity Graph */}
              <div className="h-32 w-full pt-2">
                {(() => {
                  const minY = Math.min(0, ...chartPoints.map((p) => p.y));
                  const maxY = Math.max(1, ...chartPoints.map((p) => p.y));
                  const rangeY = maxY - minY || 1;
                  const width = 500;
                  const height = 110;

                  const pointsString = chartPoints
                    .map((p, idx) => {
                      const px = (idx / (chartPoints.length - 1)) * width;
                      const py = height - ((p.y - minY) / rangeY) * height;
                      return `${px},${py}`;
                    })
                    .join(' ');

                  const zeroY = height - ((0 - minY) / rangeY) * height;

                  return (
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                      {/* Zero baseline */}
                      <line
                        x1="0"
                        y1={zeroY}
                        x2={width}
                        y2={zeroY}
                        stroke="#334155"
                        strokeDasharray="4"
                        strokeWidth="1"
                      />
                      {/* Path line */}
                      <polyline
                        fill="none"
                        stroke={cumulativePnl >= 0 ? '#10b981' : '#f43f5e'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={pointsString}
                      />
                    </svg>
                  );
                })()}
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                <span>Trade #1</span>
                <span>Trade #{totalTrades}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
