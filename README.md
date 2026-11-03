# CyberPulse Futures — Crypto Futures Market-Analysis Radar

A high-performance, mobile-first Progressive Web App (PWA) built with React, TypeScript, and Tailwind CSS. Provides real-time market analysis for Binance Futures and Bitget Futures perpetual contracts using live public market data, a multi-factor analysis engine executed in a Web Worker, dual-mode WhatsApp notifications, and background reliability.

---

## 🚀 Key Features

### 1. Dynamic Market Data (No Exchange API Keys Required)
- **Binance Futures**:
  - Exchange Info: `https://fapi.binance.com/fapi/v1/exchangeInfo` (USDT-M Perpetual) & `https://dapi.binance.com/dapi/v1/exchangeInfo` (COIN-M)
  - Live Ticker WebSocket: `wss://fstream.binance.com/ws/<symbol>@ticker`
  - Order Book Depth & Kline REST endpoints
- **Bitget Futures**:
  - Exchange Info: `https://api.bitget.com/api/v2/mix/market/contracts?productType=USDT-FUTURES` (also USDC-FUTURES & COIN-FUTURES)
  - Live WebSocket: `wss://ws.bitget.com/v2/ws/public`
- **Offline Pair Fallback**: Bundled fallback list of 51 major perpetuals loaded if public API requests fail, with an offline banner.

### 2. Analysis Engine (Web Worker)
- **Trend**: Multi-timeframe EMA 9, 21, 50, 200 on selected and two higher timeframes.
- **Momentum**: RSI(14), MACD(12, 26, 9), Stochastic RSI.
- **Volatility**: Bollinger Bands(20, 2), ATR(14).
- **Volume & Flow**: Volume vs. 20-period average, VWAP, taker buy/sell volume ratio.
- **Order Book**: Bid/ask depth imbalance within 1% of mid-price.
- **Derivatives**: Real-time funding rate, open interest change, Long/Short account ratio.
- **Structure**: Support/resistance swing pivots, candlestick pattern filters (engulfing & pin bars).
- **Strict Mode (ON by default)**: Requires at least 6 agreeing factor groups, HTF trend confluence, R:R $\ge 1:2$, above-average volume, and no opposing funding/OI extremes.

### 3. Market Scanner
- Triggered manually via the center pulsing **"Generate Signal"** button.
- Pre-filters all pairs by minimum 24h volume ($\ge \$10M$) and maximum spread ($\le 0.08\%$).
- Evaluates qualifying candidates in rate-limit-safe batches with a progress bar.
- Ranks top 5 setups by Agreement Score (0–100, labeled as factor agreement, not a probability).

### 4. Holding Time Limits & Pre-Trade Warning
- Configurable limits: 5 min, 15 min, 30 min, 1 hour, 4 hours, or custom.
- **Pre-Trade 15s Countdown**: Spoken warning and visible 15-to-1 countdown with green/red banner and loud "TRADE START" alarm at 1.
- **Active Live Trades Board**: Multiple simultaneous trades with independent wall-clock timers powered by `Date.now()` inside a dedicated Web Worker.
- Spoken milestone notifications at 50% time elapsed, 5 minutes left, and expiry.

### 5. WhatsApp Integration (Dual Mode)
- **Recipients List**:
  - Primary Recipient: `+91 9934480908` (ON by default)
  - Secondary Recipient: `+92 3044809801` (OFF by default)
  - Editable country code (default `+91`), phone number, and individual ON/OFF toggles.
  - "Send test message" button and live message preview.
- **Modes**:
  1. **Quick Share (Default)**: Direct dispatch via prefilled `https://wa.me/<number>?text=<encoded>` links.
  2. **Automatic (Serverless Cloud API)**: Backend route `POST /api/whatsapp/send` calling the official Meta WhatsApp Business Cloud API.
- **Dispatches On**: Signal generated, pair selected, trade taken, entry zone touched, SL triggered, TP1/TP2 hit, time limit expired, and final result.

### 6. Auto Mode & Serverless Cron
- **Browser Auto Mode**: Scans every 5, 15, 30, or 60 minutes while app is open.
- **Safeguards**: Max 10 signals per day, 30-minute spacing, 4-hour pair cooldown, and quiet hours (23:00–07:00).
- **Server Cron Endpoint**: `GET /api/cron/scan` can be scheduled via Cloud Scheduler or external cron to scan when the app is closed.

### 7. Performance Stats, Journal & Backtest Engine
- **Measured Win Rate**: Calculated exclusively from app's logged paper trades for that pair and timeframe (minimum 30 trades required to display percentage).
- **Trade Journal**: Full log of entry/exit prices, reasons, P/L %, and fees.
- **Backtest Mode**: Historical k-line simulation factoring in 0.05% taker fee per side and 0.02% slippage per side (0.14% total friction), max drawdown, and expectancy.

---

## 🛠️ Environment Configuration

Copy `.env.example` to `.env` (or configure in your Cloud deployment secrets):

```env
# Optional WhatsApp Business Cloud API credentials for Automatic delivery mode
WHATSAPP_TOKEN="your_meta_system_user_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"

# Optional CryptoPanic API key for news sentiment analysis
CRYPTO_PANIC_API_KEY="your_api_key"
```

---

## 🚀 Deployment & Cron Setup

### Running Locally
```bash
npm install
npm run dev
```

### Server Cron Setup (for 24/7 scanning when app is closed)
To scan in the background every 15 minutes, set up a cron job targeting your server endpoint:

1. **Google Cloud Scheduler**:
   - Frequency: `*/15 * * * *`
   - Target: `HTTP`
   - URL: `https://<YOUR_APP_URL>/api/cron/scan`
   - Method: `GET`

2. **Crontab (Linux / VPS)**:
   ```bash
   */15 * * * * curl -s https://<YOUR_APP_URL>/api/cron/scan > /dev/null
   ```

---

## ⚠️ Risk & Disclaimer
Analysis is based on technical data and can be wrong. Not financial advice. Futures trading with leverage can lose your entire balance. Never trade with borrowed money. Suggested leverage is capped at 2x. The app never places real exchange orders.
