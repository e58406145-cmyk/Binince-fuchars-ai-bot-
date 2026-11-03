import React, { useState } from 'react';
import { X, Calculator, ShieldCheck, Scale, AlertTriangle, AlertCircle } from 'lucide-react';
import { CryptoPair, UserSettings } from '../types/crypto';
import { playClickSound } from '../services/audio';
import { formatCryptoPrice } from '../utils/formatters';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: CryptoPair | null;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  direction?: 'LONG' | 'SHORT';
  settings: UserSettings;
  onExecutePaperTrade?: (sizeUsd: number, leverage: number) => void;
}

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({
  isOpen,
  onClose,
  pair,
  entryPrice,
  stopLossPrice,
  takeProfitPrice,
  direction = 'LONG',
  settings,
  onExecutePaperTrade,
}) => {
  const [balance, setBalance] = useState<number>(settings.paperBalanceUsd || 10000);
  const [riskPercent, setRiskPercent] = useState<number>(Math.min(2.0, settings.riskPerTradePercent || 1.0));
  // Leverage is capped at 2x suggested, settings max 3x
  const [leverage, setLeverage] = useState<number>(Math.min(2, settings.maxLeverage || 2));
  const [orderExecuted, setOrderExecuted] = useState(false);

  if (!isOpen) return null;

  const riskAmountUsd = (balance * Math.min(2.0, riskPercent)) / 100;
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  const priceDistancePct = entryPrice > 0 ? (priceDistance / entryPrice) : 0.01;

  // Position Size = Risk Amount / Price Distance %
  const nominalPositionSizeUsd = priceDistancePct > 0 ? riskAmountUsd / priceDistancePct : 1000;
  // Margin required with leverage
  const requiredMarginUsd = nominalPositionSizeUsd / leverage;

  // Estimated Liquidation Price for 2x
  // Long liquidation price ~ Entry * (1 - 1/leverage + 0.005)
  // Short liquidation price ~ Entry * (1 + 1/leverage - 0.005)
  const isLong = direction === 'LONG';
  const estLiquidationPrice = isLong
    ? Math.max(0, entryPrice * (1 - (0.95 / leverage)))
    : entryPrice * (1 + (0.95 / leverage));

  // Risk/Reward check
  const rewardDistance = takeProfitPrice ? Math.abs(takeProfitPrice - entryPrice) : priceDistance * 2;
  const calculatedRR = priceDistance > 0 ? rewardDistance / priceDistance : 2.0;
  const isRRBelowTwo = calculatedRR < 2.0;

  const handlePlacePaperOrder = () => {
    playClickSound();
    onExecutePaperTrade?.(nominalPositionSizeUsd, leverage);
    setOrderExecuted(true);
    setTimeout(() => {
      setOrderExecuted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-md rounded-2xl bg-slate-900 border border-cyan-500/50 shadow-2xl glow-cyan overflow-hidden text-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Position Size & Risk Calculator
              </h3>
              <p className="text-[10px] text-cyan-400 font-mono">
                2x Leverage Cap · Risk ≤ 2% · Liquidation Safety
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 text-xs">
          {/* Risk-Reward Warning */}
          {isRRBelowTwo && (
            <div className="rounded-xl bg-amber-950/50 border border-amber-500/50 p-2.5 flex items-center gap-2 text-amber-300 font-mono text-[11px]">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Warning: Risk-Reward is 1:{calculatedRR.toFixed(2)}, which is below the mandatory 1:2 threshold. Strict Mode advises skipping this trade.</span>
            </div>
          )}

          {/* Account Balance */}
          <div>
            <div className="flex justify-between text-slate-300 font-mono mb-1">
              <span>Account Equity (USDT):</span>
              <span className="font-bold text-white">${balance.toLocaleString()}</span>
            </div>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(Math.max(100, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Risk per trade % (default 1%, max 2%) */}
          <div>
            <div className="flex justify-between text-slate-300 font-mono mb-1">
              <span>Risk Per Trade (Max 2.0%):</span>
              <span className="font-bold text-cyan-400">{riskPercent.toFixed(1)}% (${riskAmountUsd.toFixed(2)})</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0.5, 1.0, 1.5, 2.0].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    playClickSound();
                    setRiskPercent(r);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    riskPercent === r
                      ? 'bg-cyan-500 text-slate-950 shadow glow-cyan'
                      : 'bg-slate-950 border border-slate-800 text-slate-400'
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>

          {/* Strict 2x Leverage Cap (Settings cannot exceed 3x) */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                Suggested Leverage Cap
              </span>
              <span className="text-cyan-400 font-bold">{leverage}x (Max 3x in Settings)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Strict 2x leverage cap recommended. Prevents forced liquidation during standard volatility swings.
            </p>
          </div>

          {/* Calculation Summary Table including Liquidation Price */}
          <div className="rounded-xl bg-slate-950 border border-cyan-500/30 p-3 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Contract / Direction:</span>
              <span className="text-white font-bold">{pair?.displayName || 'BTC/USDT'} ({direction})</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Entry Price:</span>
              <span className="text-slate-200 font-semibold">${formatCryptoPrice(entryPrice, pair?.pricePrecision)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Stop Loss:</span>
              <span className="text-red-400 font-semibold">${formatCryptoPrice(stopLossPrice, pair?.pricePrecision)} ({(priceDistancePct * 100).toFixed(2)}%)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Max Dollar Risk (Loss at Stop):</span>
              <span className="text-red-400 font-bold">${riskAmountUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Position Size (Nominal):</span>
              <span className="text-white font-bold">${nominalPositionSizeUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Required Margin ({leverage}x):</span>
              <span className="text-cyan-300 font-bold">${requiredMarginUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
              <span className="text-amber-400 font-semibold">Est. Liquidation Price:</span>
              <span className="text-amber-300 font-bold">${formatCryptoPrice(estLiquidationPrice, pair?.pricePrecision)}</span>
            </div>
          </div>

          {/* Paper Trade Button */}
          {settings.paperTradingEnabled && (
            <button
              onClick={handlePlacePaperOrder}
              disabled={orderExecuted}
              className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide transition shadow-lg cursor-pointer ${
                orderExecuted
                  ? 'bg-emerald-500 text-slate-950 glow-green'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 glow-cyan'
              }`}
            >
              {orderExecuted ? 'Paper Trade Recorded!' : `Execute Paper Trade (${leverage}x Margin)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
