/**
 * Backtest Engine on Historical Klines
 * Evaluates strategy rules on past candles, accounting for:
 * - 0.05% taker fee per side (0.10% total)
 * - 0.02% slippage per side (0.04% total)
 * - Strict stop-loss & take-profit tracking
 * - Maximum drawdown and expectancy calculations
 */

import { KlineData, Timeframe, BacktestResult, SignalType } from '../types/crypto';
import { calculateEMA, calculateRSI, calculateATR, calculateBollingerBands } from '../utils/indicators';

export function runBacktest(
  pairSymbol: string,
  timeframe: Timeframe,
  klines: KlineData[],
  strictMode = true
): BacktestResult {
  const minRequiredBars = 35;
  if (!klines || klines.length < minRequiredBars) {
    return {
      pair: pairSymbol,
      timeframe,
      totalTrades: 0,
      winCount: 0,
      lossCount: 0,
      drawCount: 0,
      winRatePercent: 0,
      totalPnlPercent: 0,
      netPnlPercentAfterFees: 0,
      profitFactor: 0,
      maxDrawdownPercent: 0,
      averageTradePnlPercent: 0,
      expectancyPercent: 0,
      trades: [],
    };
  }

  const closes = klines.map((k) => k.close);
  const rsiValues = calculateRSI(closes, 14);
  const ema9Values = calculateEMA(closes, 9);
  const ema21Values = calculateEMA(closes, 21);
  const ema50Values = calculateEMA(closes, 50);
  const atrValues = calculateATR(klines, 14);

  const trades: BacktestResult['trades'] = [];
  const FEE_AND_SLIPPAGE_PER_TRADE = 0.14; // 0.05% entry taker + 0.05% exit taker + 0.04% slippage

  let inTrade = false;
  let currentTrade: {
    direction: 'LONG' | 'SHORT';
    entryIndex: number;
    entryTime: number;
    entryPrice: number;
    stopLoss: number;
    tp1: number;
    tp2: number;
  } | null = null;

  for (let i = minRequiredBars; i < klines.length - 1; i++) {
    const bar = klines[i];
    const prevBar = klines[i - 1];

    // If currently in a trade, check exit conditions on this bar
    if (inTrade && currentTrade) {
      const isLong = currentTrade.direction === 'LONG';
      const barsHeld = i - currentTrade.entryIndex;
      let exitPrice: number | null = null;
      let exitReason = '';

      if (isLong) {
        if (bar.low <= currentTrade.stopLoss) {
          exitPrice = currentTrade.stopLoss;
          exitReason = 'Stop Loss Hit';
        } else if (bar.high >= currentTrade.tp2) {
          exitPrice = currentTrade.tp2;
          exitReason = 'Take Profit 2 Hit';
        } else if (bar.high >= currentTrade.tp1 && barsHeld > 4) {
          exitPrice = currentTrade.tp1;
          exitReason = 'Take Profit 1 Hit';
        } else if (barsHeld >= 12) {
          exitPrice = bar.close;
          exitReason = 'Time Limit Expired';
        }
      } else {
        if (bar.high >= currentTrade.stopLoss) {
          exitPrice = currentTrade.stopLoss;
          exitReason = 'Stop Loss Hit';
        } else if (bar.low <= currentTrade.tp2) {
          exitPrice = currentTrade.tp2;
          exitReason = 'Take Profit 2 Hit';
        } else if (bar.low <= currentTrade.tp1 && barsHeld > 4) {
          exitPrice = currentTrade.tp1;
          exitReason = 'Take Profit 1 Hit';
        } else if (barsHeld >= 12) {
          exitPrice = bar.close;
          exitReason = 'Time Limit Expired';
        }
      }

      if (exitPrice !== null) {
        const grossPnl = isLong
          ? ((exitPrice - currentTrade.entryPrice) / currentTrade.entryPrice) * 100
          : ((currentTrade.entryPrice - exitPrice) / currentTrade.entryPrice) * 100;

        const netPnl = grossPnl - FEE_AND_SLIPPAGE_PER_TRADE;
        const result: 'WIN' | 'LOSS' | 'DRAW' = netPnl > 0.05 ? 'WIN' : netPnl < -0.05 ? 'LOSS' : 'DRAW';

        trades.push({
          entryTime: currentTrade.entryTime,
          exitTime: bar.time,
          direction: currentTrade.direction,
          entryPrice: currentTrade.entryPrice,
          exitPrice,
          grossPnlPercent: grossPnl,
          netPnlPercent: netPnl,
          result,
          reason: exitReason,
        });

        inTrade = false;
        currentTrade = null;
        continue;
      }
    }

    // Check entry signal if not in a trade
    if (!inTrade) {
      const ema9 = ema9Values[i] || bar.close;
      const ema21 = ema21Values[i] || bar.close;
      const ema50 = ema50Values[i] || bar.close;
      const rsi = rsiValues[i] || 50;
      const atr = atrValues[i] || bar.close * 0.01;

      const bullishTrend = ema9 > ema21 && ema21 > ema50;
      const bearishTrend = ema9 < ema21 && ema21 < ema50;

      let signal: SignalType = 'NO_TRADE';

      if (bullishTrend && rsi > 45 && rsi < 70 && bar.close > prevBar.close) {
        signal = 'LONG';
      } else if (bearishTrend && rsi < 55 && rsi > 30 && bar.close < prevBar.close) {
        signal = 'SHORT';
      }

      if (signal === 'LONG') {
        const entryPrice = bar.close;
        const stopLoss = entryPrice - atr * 1.5;
        const risk = entryPrice - stopLoss;
        const tp1 = entryPrice + risk * 1.5;
        const tp2 = entryPrice + risk * 2.0;

        inTrade = true;
        currentTrade = {
          direction: 'LONG',
          entryIndex: i,
          entryTime: bar.time,
          entryPrice,
          stopLoss,
          tp1,
          tp2,
        };
      } else if (signal === 'SHORT') {
        const entryPrice = bar.close;
        const stopLoss = entryPrice + atr * 1.5;
        const risk = stopLoss - entryPrice;
        const tp1 = entryPrice - risk * 1.5;
        const tp2 = entryPrice - risk * 2.0;

        inTrade = true;
        currentTrade = {
          direction: 'SHORT',
          entryIndex: i,
          entryTime: bar.time,
          entryPrice,
          stopLoss,
          tp1,
          tp2,
        };
      }
    }
  }

  // Calculate statistics
  const totalTrades = trades.length;
  const winCount = trades.filter((t) => t.result === 'WIN').length;
  const lossCount = trades.filter((t) => t.result === 'LOSS').length;
  const drawCount = trades.filter((t) => t.result === 'DRAW').length;

  const winRatePercent = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const totalPnlPercent = trades.reduce((acc, t) => acc + t.grossPnlPercent, 0);
  const netPnlPercentAfterFees = trades.reduce((acc, t) => acc + t.netPnlPercent, 0);

  const winningTrades = trades.filter((t) => t.netPnlPercent > 0);
  const losingTrades = trades.filter((t) => t.netPnlPercent < 0);

  const totalGains = winningTrades.reduce((acc, t) => acc + t.netPnlPercent, 0);
  const totalLosses = Math.abs(losingTrades.reduce((acc, t) => acc + t.netPnlPercent, 0));

  const profitFactor = totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? 9.99 : 0;
  const averageTradePnlPercent = totalTrades > 0 ? netPnlPercentAfterFees / totalTrades : 0;

  // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss)
  const avgWin = winningTrades.length > 0 ? totalGains / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
  const expectancyPercent = ((winRatePercent / 100) * avgWin) - (((100 - winRatePercent) / 100) * avgLoss);

  // Maximum Drawdown calculation
  let peak = 0;
  let runningEquity = 0;
  let maxDrawdown = 0;

  trades.forEach((t) => {
    runningEquity += t.netPnlPercent;
    if (runningEquity > peak) {
      peak = runningEquity;
    }
    const dd = peak - runningEquity;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }
  });

  return {
    pair: pairSymbol,
    timeframe,
    totalTrades,
    winCount,
    lossCount,
    drawCount,
    winRatePercent: Math.round(winRatePercent * 10) / 10,
    totalPnlPercent: Math.round(totalPnlPercent * 100) / 100,
    netPnlPercentAfterFees: Math.round(netPnlPercentAfterFees * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    maxDrawdownPercent: Math.round(maxDrawdown * 100) / 100,
    averageTradePnlPercent: Math.round(averageTradePnlPercent * 100) / 100,
    expectancyPercent: Math.round(expectancyPercent * 100) / 100,
    trades,
  };
}
