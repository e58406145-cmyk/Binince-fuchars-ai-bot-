/**
 * Buyer vs Seller Pressure Calculation Engine
 * Uses FREE Public Binance REST Endpoints:
 * 1. Taker Buy/Sell Volume from /fapi/v1/klines
 * 2. Order Book Depth Imbalance from /fapi/v1/depth
 * 3. Futures Global Long/Short Account Ratio from /futures/data/globalLongShortAccountRatio
 */

import { ExchangeId, Timeframe, KlineData, OrderBookData, DerivativesData } from '../types/crypto';
import { fetchBinanceKlines, fetchBinanceOrderBook, fetchBinanceDerivatives } from './api/binance';
import { fetchBitgetKlines, fetchBitgetOrderBook, fetchBitgetDerivatives } from './api/bitget';

export interface BuyerSellerPressureResult {
  buyerPressurePercent: number;
  sellerPressurePercent: number;
  status: 'BUYER_DOMINANT' | 'SELLER_DOMINANT' | 'NEUTRAL';
  isDataAvailable: boolean;
  timestamp: number;
  timeframe: Timeframe;
  dataSource: string;
  takerBuyPercent: number;
  orderBookBuyPercent: number;
  longAccountPercent: number;
}

export async function calculateBuyerSellerPressure(
  exchange: ExchangeId,
  symbol: string,
  timeframe: Timeframe,
  productType?: any
): Promise<BuyerSellerPressureResult> {
  const now = Date.now();
  const dataSourceName = exchange === 'binance'
    ? 'Binance Futures REST API (Free Public Endpoint)'
    : 'Bitget Futures REST API (Free Public Endpoint)';

  try {
    let klines: KlineData[] = [];
    let orderBook: OrderBookData | null = null;
    let derivatives: DerivativesData | null = null;

    if (exchange === 'binance') {
      const [kRes, obRes, dRes] = await Promise.all([
        fetchBinanceKlines(symbol, timeframe, 30).catch(() => []),
        fetchBinanceOrderBook(symbol, 20).catch(() => null),
        fetchBinanceDerivatives(symbol).catch(() => null),
      ]);
      klines = kRes;
      orderBook = obRes;
      derivatives = dRes;
    } else {
      const [kRes, obRes, dRes] = await Promise.all([
        fetchBitgetKlines(symbol, timeframe, productType || 'USDT-FUTURES', 30).catch(() => []),
        fetchBitgetOrderBook(symbol, productType || 'USDT-FUTURES', 20).catch(() => null),
        fetchBitgetDerivatives(symbol, productType || 'USDT-FUTURES').catch(() => null),
      ]);
      klines = kRes;
      orderBook = obRes;
      derivatives = dRes;
    }

    if (!klines || klines.length < 5) {
      return {
        buyerPressurePercent: 50,
        sellerPressurePercent: 50,
        status: 'NEUTRAL',
        isDataAvailable: false,
        timestamp: now,
        timeframe,
        dataSource: dataSourceName,
        takerBuyPercent: 50,
        orderBookBuyPercent: 50,
        longAccountPercent: 50,
      };
    }

    // 1. Calculate Taker Buy Volume Ratio
    let totalQuoteVolume = 0;
    let totalTakerBuyQuoteVolume = 0;

    klines.forEach((k) => {
      const qVol = k.quoteVolume || (k.volume * k.close);
      const tbVol = k.takerBuyQuoteVolume || (qVol * 0.5);
      totalQuoteVolume += qVol;
      totalTakerBuyQuoteVolume += tbVol;
    });

    let takerBuyPercent = 50;
    if (totalQuoteVolume > 0) {
      takerBuyPercent = (totalTakerBuyQuoteVolume / totalQuoteVolume) * 100;
    }

    // 2. Calculate Order Book Depth Ratio
    let orderBookBuyPercent = 50;
    if (orderBook && orderBook.bids.length > 0 && orderBook.asks.length > 0) {
      const totalBidDepthUsd = orderBook.bids.slice(0, 15).reduce((acc, b) => acc + (b.price * b.amount), 0);
      const totalAskDepthUsd = orderBook.asks.slice(0, 15).reduce((acc, a) => acc + (a.price * a.amount), 0);
      const totalDepthUsd = totalBidDepthUsd + totalAskDepthUsd;
      if (totalDepthUsd > 0) {
        orderBookBuyPercent = (totalBidDepthUsd / totalDepthUsd) * 100;
      }
    }

    // 3. Calculate Global Long/Short Ratio Component
    let longAccountPercent = 50;
    if (derivatives && derivatives.longAccountRatio) {
      longAccountPercent = derivatives.longAccountRatio * 100;
    }

    // Weighted Formula: 40% Taker Volume + 30% Order Book Depth + 30% Long/Short Accounts
    const weightedBuyer = (takerBuyPercent * 0.40) + (orderBookBuyPercent * 0.30) + (longAccountPercent * 0.30);
    const buyerPressurePercent = Math.min(99, Math.max(1, Math.round(weightedBuyer)));
    const sellerPressurePercent = 100 - buyerPressurePercent;

    let status: 'BUYER_DOMINANT' | 'SELLER_DOMINANT' | 'NEUTRAL' = 'NEUTRAL';
    if (buyerPressurePercent >= 55) {
      status = 'BUYER_DOMINANT';
    } else if (sellerPressurePercent >= 55) {
      status = 'SELLER_DOMINANT';
    } else {
      status = 'NEUTRAL';
    }

    return {
      buyerPressurePercent,
      sellerPressurePercent,
      status,
      isDataAvailable: true,
      timestamp: now,
      timeframe,
      dataSource: dataSourceName,
      takerBuyPercent: Math.round(takerBuyPercent),
      orderBookBuyPercent: Math.round(orderBookBuyPercent),
      longAccountPercent: Math.round(longAccountPercent),
    };
  } catch (err) {
    return {
      buyerPressurePercent: 50,
      sellerPressurePercent: 50,
      status: 'NEUTRAL',
      isDataAvailable: false,
      timestamp: now,
      timeframe,
      dataSource: dataSourceName,
      takerBuyPercent: 50,
      orderBookBuyPercent: 50,
      longAccountPercent: 50,
    };
  }
}
