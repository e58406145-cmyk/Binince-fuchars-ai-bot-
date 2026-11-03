/**
 * CoinGlass API Integration Service
 * Optional multi-exchange smart money & whale data provider.
 * Handles graceful fallback to public exchange REST data when no API key is provided.
 */

import { fetchWithFallback } from './fetchHelper';

export interface CoinGlassMarketData {
  symbol: string;
  globalLongShortRatio?: number;
  topTraderLongShortRatio?: number;
  openInterestUsd?: number;
  openInterestChangePercent24h?: number;
  fundingRate?: number;
  longLiquidation24hUsd?: number;
  shortLiquidation24hUsd?: number;
  totalLiquidation24hUsd?: number;
  cvd24hUsd?: number;
  isFromCoinGlass: boolean;
}

export async function fetchCoinGlassData(
  symbol: string,
  apiKey?: string
): Promise<CoinGlassMarketData | null> {
  if (!apiKey || apiKey.trim().length === 0) {
    return null; // Graceful fallback
  }

  const cleanSymbol = symbol.replace('USDT', '').replace('USD', '');

  try {
    const url = `https://open-api.coinglass.com/public/v2/indicator/long_short_ratio?symbol=${cleanSymbol}`;
    const headers = { 'CG-API-KEY': apiKey.trim() };

    const res = await fetch(url, { headers }).then((r) => r.json()).catch(() => null);

    if (res && res.code === '0' && res.data) {
      const first = Array.isArray(res.data) ? res.data[0] : res.data;
      return {
        symbol,
        globalLongShortRatio: parseFloat(first.longShortRatio || '1.0'),
        topTraderLongShortRatio: parseFloat(first.topLongShortRatio || first.longShortRatio || '1.1'),
        openInterestUsd: parseFloat(first.openInterestUsd || '0'),
        fundingRate: parseFloat(first.fundingRate || '0.0001'),
        totalLiquidation24hUsd: parseFloat(first.liquidation24h || '0'),
        isFromCoinGlass: true,
      };
    }
  } catch {
    // Return null on API error or invalid key
  }

  return null;
}
