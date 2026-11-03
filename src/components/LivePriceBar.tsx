import React, { useEffect, useState } from 'react';
import { Activity, Clock, Percent } from 'lucide-react';
import { CryptoPair, DerivativesData } from '../types/crypto';
import { formatCryptoPrice } from '../utils/formatters';

interface LivePriceBarProps {
  pair: CryptoPair | null;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  derivatives: DerivativesData | null;
  wsConnected: boolean;
}

export const LivePriceBar: React.FC<LivePriceBarProps> = ({
  pair,
  high24h,
  low24h,
  volume24h,
  derivatives,
  wsConnected,
}) => {
  const [fundingCountdown, setFundingCountdown] = useState<string>('--:--:--');

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      let target = derivatives?.nextFundingTime;

      if (!target) {
        // Calculate next 8-hour epoch: 00:00, 08:00, 16:00 UTC
        const next8h = Math.ceil(now / (8 * 3600 * 1000)) * (8 * 3600 * 1000);
        target = next8h;
      }

      const diff = Math.max(0, target - now);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setFundingCountdown(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [derivatives]);

  const fundingRatePercent = (derivatives?.fundingRate || 0.0001) * 100;
  const isFundingPositive = fundingRatePercent >= 0;

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
      {/* 24h High / Low */}
      <div className="flex items-center gap-3">
        <div>
          <span className="text-[10px] text-slate-500">24h H: </span>
          <span className="text-slate-200 font-semibold">
            {formatCryptoPrice(high24h, pair?.pricePrecision)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500">24h L: </span>
          <span className="text-slate-200 font-semibold">
            {formatCryptoPrice(low24h, pair?.pricePrecision)}
          </span>
        </div>
      </div>

      {/* Funding Rate & Countdown */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1" title="Perpetual Funding Rate (8h)">
          <Percent className="h-3 w-3 text-cyan-400" />
          <span className={isFundingPositive ? 'text-cyan-300' : 'text-emerald-400'}>
            {isFundingPositive ? '+' : ''}{fundingRatePercent.toFixed(4)}%
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400" title="Time remaining until next funding settlement">
          <Clock className="h-3 w-3 text-slate-500" />
          <span className="text-slate-300">{fundingCountdown}</span>
        </div>

        {/* Live WebSocket Status Dot */}
        <div className="flex items-center gap-1" title={wsConnected ? 'Real-time WebSocket Live' : 'Connecting to Stream...'}>
          <Activity className={`h-3 w-3 ${wsConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-500'}`} />
        </div>
      </div>
    </div>
  );
};
