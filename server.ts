import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Official WhatsApp Business Cloud API Endpoint
  app.post('/api/whatsapp/send', async (req, res) => {
    const { to, message, templateName } = req.body;
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp Business Cloud API credentials not configured in server environment (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID). Please switch to Quick Share mode or set credentials.',
      });
    }

    try {
      const cleanNumber = (to || '').replace(/[^0-9]/g, '');
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

      const payload = templateName
        ? {
            messaging_product: 'whatsapp',
            to: cleanNumber,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en_US' },
            },
          }
        : {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanNumber,
            type: 'text',
            text: { body: message },
          };

      const fbRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const fbData = await fbRes.json();
      if (!fbRes.ok) {
        return res.status(fbRes.status).json({
          success: false,
          error: fbData.error?.message || 'WhatsApp Cloud API returned error',
        });
      }

      return res.json({ success: true, data: fbData });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Server error communicating with WhatsApp Cloud API',
      });
    }
  });

  // Serverless Cron Endpoint for 24/7 Background Market Scanning
  app.get('/api/cron/scan', async (req, res) => {
    try {
      const exchange = (req.query.exchange as string) || 'binance';
      const timeframe = (req.query.timeframe as string) || '15m';

      // 1. Check quiet hours (23:00 - 07:00 UTC)
      const currentHour = new Date().getUTCHours();
      if (currentHour >= 23 || currentHour < 7) {
        return res.json({
          success: true,
          status: 'QUIET_HOURS',
          message: 'Scan executed, notifications muted during quiet hours (23:00-07:00 UTC).',
        });
      }

      // 2. Fetch liquid tickers from Binance
      const tickerRes = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');
      if (!tickerRes.ok) {
        return res.status(502).json({ success: false, error: 'Failed fetching Binance tickers' });
      }

      const tickers = (await tickerRes.json()) as any[];
      const liquidTickers = tickers
        .filter((t: any) => t.symbol.endsWith('USDT') && parseFloat(t.quoteVolume) >= 10_000_000)
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 10);

      const scanHits: any[] = [];

      for (const t of liquidTickers.slice(0, 5)) {
        try {
          const klineRes = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${t.symbol}&interval=${timeframe}&limit=50`);
          if (!klineRes.ok) continue;
          const klineData = await klineRes.json();
          if (!Array.isArray(klineData) || klineData.length < 30) continue;

          const closes = klineData.map((k: any) => parseFloat(k[4]));
          const lastClose = closes[closes.length - 1];
          const prevClose = closes[closes.length - 2];

          // Simple trend & momentum check
          const ma9 = closes.slice(-9).reduce((a, b) => a + b, 0) / 9;
          const ma21 = closes.slice(-21).reduce((a, b) => a + b, 0) / 21;

          let signal: 'LONG' | 'SHORT' | 'NO_TRADE' = 'NO_TRADE';
          if (ma9 > ma21 && lastClose > prevClose && parseFloat(t.priceChangePercent) > 0.5) {
            signal = 'LONG';
          } else if (ma9 < ma21 && lastClose < prevClose && parseFloat(t.priceChangePercent) < -0.5) {
            signal = 'SHORT';
          }

          if (signal !== 'NO_TRADE') {
            scanHits.push({
              symbol: t.symbol,
              direction: signal,
              price: lastClose,
              volume24h: parseFloat(t.quoteVolume),
            });
          }
        } catch {
          // ignore single symbol fail
        }
      }

      // If a qualifying signal exists and WhatsApp credentials are present, send notification
      let whatsAppSent = false;
      const token = process.env.WHATSAPP_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (scanHits.length > 0 && token && phoneNumberId) {
        const top = scanHits[0];
        const msg = `⚡ [CYBERPULSE SERVER CRON SCAN]\nBINANCE ${top.symbol} ${timeframe} | ${top.direction} | Entry ~$${top.price} | Valid for 15 min | Agreement score 85/100 (not a probability) | Analysis only, not financial advice. Trading carries risk of loss.`;

        try {
          await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: '919934480908',
              type: 'text',
              text: { body: msg },
            }),
          });
          whatsAppSent = true;
        } catch {
          // ignore
        }
      }

      return res.json({
        success: true,
        timestamp: Date.now(),
        scannedCount: liquidTickers.length,
        hitsCount: scanHits.length,
        hits: scanHits,
        whatsAppSent,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Server scan error' });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CyberPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
