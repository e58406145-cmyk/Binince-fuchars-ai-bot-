import React, { useState } from 'react';
import { 
  FinanceBudgetData, 
  PaperTradeRecord, 
  ExchangeId 
} from '../types/crypto';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Calculator, 
  DollarSign, 
  PieChart, 
  RefreshCw, 
  Lock, 
  Sliders, 
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';
import { calculateLiquidationPrice, LEVERAGE_OPTIONS } from '../services/autoScannerEngine';

interface FinanceBudgetDashboardProps {
  financeData: FinanceBudgetData;
  trades: PaperTradeRecord[];
  onUpdateFinance: (updated: Partial<FinanceBudgetData>) => void;
  onResetBudget: () => void;
}

export const FinanceBudgetDashboard: React.FC<FinanceBudgetDashboardProps> = ({
  financeData,
  trades,
  onUpdateFinance,
  onResetBudget,
}) => {
  // Calculator local state
  const [calcRiskPercent, setCalcRiskPercent] = useState<number>(financeData.riskPerTradePercent || 1);
  const [calcLeverage, setCalcLeverage] = useState<number>(financeData.selectedLeverage || 10);
  const [calcEntryPrice, setCalcEntryPrice] = useState<string>('68000');
  const [calcStopLoss, setCalcStopLoss] = useState<string>('66640');
  const [calcDirection, setCalcDirection] = useState<'LONG' | 'SHORT'>('LONG');

  // Edit capital / budget state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(financeData.startingBudgetUsd.toString());

  const entry = parseFloat(calcEntryPrice) || 0;
  const sl = parseFloat(calcStopLoss) || 0;
  const slDistancePercent = entry > 0 && sl > 0 ? (Math.abs(entry - sl) / entry) * 100 : 2;

  // Position Sizing Formula:
  // Risk Amount ($) = Available Balance * (Risk % / 100)
  // Position Size ($) = Risk Amount / (SL Distance %)
  const riskAmountUsd = (financeData.currentCapitalUsd * calcRiskPercent) / 100;
  const positionSizeUsd = slDistancePercent > 0 ? (riskAmountUsd / (slDistancePercent / 100)) : 0;
  const marginRequiredUsd = calcLeverage > 0 ? positionSizeUsd / calcLeverage : positionSizeUsd;
  const estLiquidation = calculateLiquidationPrice(entry, calcDirection, calcLeverage);

  // Compute daily / weekly / monthly stats from trades
  const now = Date.now();
  const oneDayAgo = now - 24 * 3600 * 1000;
  const oneWeekAgo = now - 7 * 24 * 3600 * 1000;
  const oneMonthAgo = now - 30 * 24 * 3600 * 1000;

  const dailyTrades = trades.filter(t => t.exitTime >= oneDayAgo);
  const weeklyTrades = trades.filter(t => t.exitTime >= oneWeekAgo);
  const monthlyTrades = trades.filter(t => t.exitTime >= oneMonthAgo);

  const dailyPnl = dailyTrades.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
  const weeklyPnl = weeklyTrades.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
  const monthlyPnl = monthlyTrades.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
  const totalFees = trades.reduce((acc, t) => acc + (t.feesPaidUsd || 0), 0);

  const isDailyLossLimitHit = dailyPnl < 0 && Math.abs(dailyPnl) >= (financeData.startingBudgetUsd * (financeData.maxDailyLossPercent / 100));

  return (
    <div className="space-y-5 pb-24 text-slate-100 max-w-4xl mx-auto px-3 sm:px-4">
      {/* Top Title Banner */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-cyan-400" />
            <span>FINANCE & BUDGET MANAGEMENT</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Capital allocation, real-time P/L tracking, and algorithmic position sizing
          </p>
        </div>

        <button
          onClick={() => setIsEditingBudget(!isEditingBudget)}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold text-cyan-300 transition cursor-pointer"
        >
          {isEditingBudget ? 'Cancel' : 'Adjust Budget'}
        </button>
      </div>

      {/* Adjust Budget Form Modal / Bar */}
      {isEditingBudget && (
        <div className="bg-slate-900 border border-cyan-500/40 p-4 rounded-xl shadow-xl flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Set Starting Budget (USDT)</label>
            <input
              type="number"
              value={tempBudget}
              onChange={(e) => setTempBudget(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white text-sm"
              placeholder="e.g. 5000"
            />
          </div>
          <button
            onClick={() => {
              const val = parseFloat(tempBudget);
              if (val > 0) {
                onUpdateFinance({ startingBudgetUsd: val, currentCapitalUsd: val, availableBalanceUsd: val });
                setIsEditingBudget(false);
              }
            }}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-black text-xs transition cursor-pointer mt-5"
          >
            Save Budget
          </button>
        </div>
      )}

      {/* Daily Loss Warning Banner */}
      {isDailyLossLimitHit && (
        <div className="bg-rose-950/70 border-2 border-rose-500 p-3.5 rounded-xl flex items-center gap-3 text-rose-200">
          <ShieldAlert className="h-6 w-6 text-rose-400 shrink-0" />
          <div className="text-xs font-mono">
            <span className="font-bold text-rose-300">DAILY LOSS LIMIT TRIGGERED:</span> You have reached your max allowed daily loss ({financeData.maxDailyLossPercent}% of capital). New trade entries should be paused to preserve capital.
          </div>
        </div>
      )}

      {/* 4-Card Capital & P/L Metric Board */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Capital */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl shadow-lg">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Total Capital</span>
            <DollarSign className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-white mt-1">
            ${financeData.currentCapitalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            Budget: ${financeData.startingBudgetUsd.toLocaleString()}
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl shadow-lg">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Available Balance</span>
            <Wallet className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-emerald-300 mt-1">
            ${financeData.availableBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            Margin: ${(financeData.currentCapitalUsd - financeData.availableBalanceUsd).toFixed(2)}
          </div>
        </div>

        {/* Daily P/L */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl shadow-lg">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Daily P/L</span>
            {dailyPnl >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-400" />}
          </div>
          <div className={`text-lg sm:text-xl font-black font-mono mt-1 ${dailyPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {dailyPnl >= 0 ? '+' : ''}${dailyPnl.toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            {((dailyPnl / (financeData.startingBudgetUsd || 1)) * 100).toFixed(2)}% of budget
          </div>
        </div>

        {/* Total Fees Paid */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl shadow-lg">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Trading Fees</span>
            <Layers className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-300 mt-1">
            ${totalFees.toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            Weekly P/L: {weeklyPnl >= 0 ? '+' : ''}${weeklyPnl.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Position Sizing & Margin Calculator */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold font-mono text-white uppercase tracking-wider">
              Algorithmic Position Size & Margin Calculator
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            Isolated Margin
          </span>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Direction */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">Direction</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setCalcDirection('LONG')}
                className={`py-1 text-xs font-mono font-bold rounded transition cursor-pointer ${
                  calcDirection === 'LONG' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                LONG
              </button>
              <button
                onClick={() => setCalcDirection('SHORT')}
                className={`py-1 text-xs font-mono font-bold rounded transition cursor-pointer ${
                  calcDirection === 'SHORT' ? 'bg-rose-500 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                SHORT
              </button>
            </div>
          </div>

          {/* Risk Per Trade % (Default 1%, max configurable 2%) */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">Risk Per Trade % (Max 2%)</label>
            <select
              value={calcRiskPercent}
              onChange={(e) => setCalcRiskPercent(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white"
            >
              <option value="0.5">0.5% (Very Safe)</option>
              <option value="1.0">1.0% (Default Safe)</option>
              <option value="1.5">1.5% (Moderate)</option>
              <option value="2.0">2.0% (Max Allowed Risk)</option>
            </select>
          </div>

          {/* Entry Price */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">Entry Price ($)</label>
            <input
              type="number"
              value={calcEntryPrice}
              onChange={(e) => setCalcEntryPrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white"
              placeholder="e.g. 68000"
            />
          </div>

          {/* Stop Loss Price */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">Stop Loss ($)</label>
            <input
              type="number"
              value={calcStopLoss}
              onChange={(e) => setCalcStopLoss(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white"
              placeholder="e.g. 66640"
            />
          </div>
        </div>

        {/* Leverage Slider */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400 flex items-center gap-1">
              <Sliders className="h-3.5 w-3.5 text-cyan-400" />
              <span>Leverage Selection:</span>
            </span>
            <span className="font-bold text-cyan-300">{calcLeverage}x</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {LEVERAGE_OPTIONS.map((lev) => (
              <button
                key={lev}
                onClick={() => setCalcLeverage(lev)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition cursor-pointer shrink-0 ${
                  calcLeverage === lev
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        {/* Calculated Results Board */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400">Position Value</div>
            <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
              ${positionSizeUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400">Margin Required</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              ${marginRequiredUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400">Max Loss at SL</div>
            <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">
              -${riskAmountUsd.toFixed(2)} ({calcRiskPercent}%)
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="text-[10px] font-mono text-slate-400">Est. Liquidation</div>
            <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
              ${formatCryptoPrice(estLiquidation)}
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Allocation Card (Requirement 11) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <h3 className="text-xs sm:text-sm font-bold font-mono uppercase text-white flex items-center gap-1.5">
            <PieChart className="h-4 w-4 text-cyan-400" />
            <span>Portfolio Allocation & Risk Distribution</span>
          </h3>
          <span className="text-[11px] font-mono text-cyan-300">
            {((financeData.availableBalanceUsd / (financeData.currentCapitalUsd || 1)) * 100).toFixed(0)}% Liquid
          </span>
        </div>

        {/* Dual Bar */}
        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 mb-3 flex">
          <div
            className="bg-emerald-500 h-full transition-all"
            style={{ width: `${Math.min(100, Math.max(0, (financeData.availableBalanceUsd / (financeData.currentCapitalUsd || 1)) * 100))}%` }}
            title="Available Liquid Balance"
          />
          <div
            className="bg-cyan-500 h-full transition-all"
            style={{ width: `${Math.min(100, Math.max(0, (financeData.allocatedMarginUsd / (financeData.currentCapitalUsd || 1)) * 100))}%` }}
            title="Allocated Futures Margin"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400">Available Liquid</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              ${financeData.availableBalanceUsd.toFixed(2)}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400">Allocated Margin</div>
            <div className="text-sm font-bold text-cyan-300 mt-0.5">
              ${(financeData.allocatedMarginUsd || 0).toFixed(2)}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400">Max Configured Risk</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5">
              {calcRiskPercent}% / Trade
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trade History Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <h3 className="text-xs sm:text-sm font-bold font-mono uppercase text-white flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>Recent Trades Performance Log</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">{trades.length} Total Trades</span>
        </div>

        {trades.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-slate-500">
            No closed trades logged yet. Signals taken and executed will automatically display here.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {trades.slice(0, 10).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                    t.direction === 'LONG' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                  }`}>
                    {t.direction}
                  </span>
                  <span className="font-bold text-white">{t.displayName}</span>
                  <span className="text-[10px] text-slate-400">{t.leverage}x</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`font-bold ${t.pnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.pnlUsd >= 0 ? '+' : ''}${t.pnlUsd.toFixed(2)} ({t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%)
                    </div>
                    <div className="text-[9px] text-slate-500">Fee: ${t.feesPaidUsd.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
