import React, { useState } from 'react';
import { X, Calculator, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import { StockMarketId, StockUserSettings } from '../types/stocks';
import { STOCK_MARKETS } from '../config/marketHours';

interface StockRiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketId: StockMarketId;
  entryPrice: number;
  stopLossPrice: number;
  currentOpenTradesCount: number;
  dailyLossPercent: number;
  userSettings: StockUserSettings;
  onUpdateSettings: (settings: Partial<StockUserSettings>) => void;
}

export const StockRiskCalculatorModal: React.FC<StockRiskCalculatorModalProps> = ({
  isOpen,
  onClose,
  marketId,
  entryPrice,
  stopLossPrice,
  currentOpenTradesCount,
  dailyLossPercent,
  userSettings,
  onUpdateSettings
}) => {
  const marketInfo = STOCK_MARKETS[marketId];
  const balance = userSettings.virtualBalances[marketId] ?? 10000;
  const [riskPercent, setRiskPercent] = useState(userSettings.riskPerTradePercent || 1.0);
  const [customBalance, setCustomBalance] = useState(balance.toString());

  if (!isOpen) return null;

  const currentBal = parseFloat(customBalance) || 10000;
  const stopDistance = Math.max(0.01, Math.abs(entryPrice - stopLossPrice));
  const maxRiskAmount = currentBal * (riskPercent / 100);
  const calculatedShares = Math.floor(maxRiskAmount / stopDistance);
  const totalPositionValue = calculatedShares * entryPrice;
  const isCapExceeded = totalPositionValue > currentBal;
  const actualShares = isCapExceeded ? Math.floor(currentBal / entryPrice) : calculatedShares;
  const actualPositionValue = actualShares * entryPrice;
  const actualRiskAmount = actualShares * stopDistance;

  // Safeguard warnings
  const isDailyLimitHit = dailyLossPercent >= userSettings.maxDailyLossPercent;
  const isMaxOpenHit = currentOpenTradesCount >= userSettings.maxOpenTrades;
  const isCoolingOff = (userSettings.coolDownUntilTimestamp ?? 0) > Date.now();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-600 text-cyan-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Stock Position Sizing</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                  1X CASH ONLY
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {marketInfo.name} ({marketInfo.currency})
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
          {/* Safeguard Warnings */}
          {isDailyLimitHit && (
            <div className="p-3 bg-rose-950/60 border border-rose-500 rounded-2xl flex items-start gap-2 text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-300">Daily Loss Lockout (3% Hit)</strong>
                <p className="text-[11px] mt-0.5">Trading locked for the rest of today to protect capital.</p>
              </div>
            </div>
          )}

          {isMaxOpenHit && (
            <div className="p-3 bg-amber-950/60 border border-amber-500 rounded-2xl flex items-start gap-2 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">Max Open Positions Limit (3/3)</strong>
                <p className="text-[11px] mt-0.5">You currently have 3 open stock positions. Close one before opening another.</p>
              </div>
            </div>
          )}

          {isCoolingOff && (
            <div className="p-3 bg-purple-950/60 border border-purple-500 rounded-2xl flex items-start gap-2 text-purple-200">
              <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-purple-300">Consecutive Loss Cooling-Off</strong>
                <p className="text-[11px] mt-0.5">Mandatory 30-minute break after 2 consecutive losses to reset mindset.</p>
              </div>
            </div>
          )}

          {/* Account Balance */}
          <div className="space-y-1">
            <label className="text-slate-400">Virtual Portfolio Capital ({marketInfo.currency}):</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                {marketInfo.currencySymbol}
              </span>
              <input
                type="number"
                value={customBalance}
                onChange={e => {
                  setCustomBalance(e.target.value);
                  const val = parseFloat(e.target.value) || 10000;
                  onUpdateSettings({
                    virtualBalances: {
                      ...userSettings.virtualBalances,
                      [marketId]: val
                    }
                  });
                }}
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Risk Per Trade (1% - 2%) */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-slate-400">Risk Per Trade (Max 2%):</label>
              <span className="text-cyan-300 font-bold">{riskPercent.toFixed(1)}% ({marketInfo.currencySymbol}{maxRiskAmount.toFixed(2)})</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="2.0"
              step="0.25"
              value={riskPercent}
              onChange={e => {
                const val = parseFloat(e.target.value);
                setRiskPercent(val);
                onUpdateSettings({ riskPerTradePercent: val });
              }}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Price & Stop Distance */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div>
              <div className="text-[10px] text-slate-500">ENTRY PRICE</div>
              <div className="text-sm font-bold text-white">{marketInfo.currencySymbol}{entryPrice.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">STOP LOSS</div>
              <div className="text-sm font-bold text-rose-400">{marketInfo.currencySymbol}{stopLossPrice.toFixed(2)}</div>
            </div>
            <div className="col-span-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              Risk Distance: {marketInfo.currencySymbol}{stopDistance.toFixed(2)} per share ({((stopDistance / entryPrice) * 100).toFixed(2)}%)
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="bg-cyan-950/40 border border-cyan-500/50 p-4 rounded-2xl flex flex-col gap-2">
            <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-bold">
              Recommended Position Size
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono">{actualShares}</span>
              <span className="text-xs text-slate-300">Shares / Units</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-300 border-t border-cyan-900/60 pt-1.5">
              <span>Position Value (1x Cash):</span>
              <span className="font-bold text-white">{marketInfo.currencySymbol}{actualPositionValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Capital at Risk (if stopped):</span>
              <span className="font-bold text-rose-400">{marketInfo.currencySymbol}{actualRiskAmount.toFixed(2)}</span>
            </div>
            {isCapExceeded && (
              <div className="text-[10px] text-amber-300/90 leading-tight">
                * Adjusted down from {calculatedShares} shares to match available cash capital without borrowed margin.
              </div>
            )}
          </div>

          {/* Mandatory Risk Disclaimer */}
          <div className="text-[10px] text-slate-500 leading-tight border-t border-slate-800 pt-2">
            Strict cash account rules: 0 leverage/margin. Maximum 3 concurrent trades. Never trade with borrowed funds.
          </div>
        </div>
      </div>
    </div>
  );
};
