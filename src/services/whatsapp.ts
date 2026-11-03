/**
 * Comprehensive WhatsApp Integration Service
 * - Primary recipient: +91 9934480908 (ON by default)
 * - Second recipient: +92 3044809801 (OFF by default)
 * - Country code field (default +91, editable) plus number
 * - Send test message functionality
 * - Formats exact standardized trade messages
 * - Dual Delivery Modes: 'quick_share' (wa.me) and 'automatic' (Serverless Cloud API)
 */

import { WhatsAppDeliveryMode, WhatsAppLogEntry, WhatsAppRecipient } from '../types/crypto';

export const DEFAULT_WHATSAPP_RECIPIENTS: WhatsAppRecipient[] = [
  {
    id: 'rec-primary-91',
    name: 'Primary Trader',
    countryCode: '+91',
    phone: '9934480908',
    enabled: true,
  },
  {
    id: 'rec-secondary-92',
    name: 'Backup Monitor',
    countryCode: '+92',
    phone: '3044809801',
    enabled: false,
  },
];

export const DEFAULT_WHATSAPP_NUMBER = '+919934480908';

export function getFullPhoneNumber(recipient: WhatsAppRecipient): string {
  const code = (recipient.countryCode || '+91').trim();
  const num = (recipient.phone || '').trim().replace(/[^0-9]/g, '');
  const cleanCode = code.startsWith('+') ? code : `+${code}`;
  return `${cleanCode}${num}`;
}

/**
 * Formats standardized WhatsApp message conforming to prompt requirements
 */
export function formatStandardWhatsAppMessage(data: {
  exchange: string;
  pair: string;
  timeframe: string;
  direction: 'LONG' | 'SHORT';
  entryZone: string;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: number;
  timeLimitLabel: string;
  agreementScore: number;
  eventNote?: string;
}): string {
  const ex = data.exchange.toUpperCase();
  const pair = data.pair.toUpperCase();
  const dir = data.direction;
  const sl = data.stopLoss > 10 ? data.stopLoss.toFixed(2) : data.stopLoss.toFixed(4);
  const tp1 = data.takeProfit1 > 10 ? data.takeProfit1.toFixed(2) : data.takeProfit1.toFixed(4);
  const tp2 = data.takeProfit2 > 10 ? data.takeProfit2.toFixed(2) : data.takeProfit2.toFixed(4);

  let msg = `${ex} ${pair} ${data.timeframe} | ${dir} | Entry ${data.entryZone} | SL $${sl} | TP1 $${tp1} | TP2 $${tp2} | R:R 1:${data.riskReward} | Valid for ${data.timeLimitLabel} | Agreement score ${Math.round(data.agreementScore)}/100 (not a probability) | Analysis only, not financial advice. Trading carries risk of loss.`;

  if (data.eventNote) {
    msg = `⚡ [UPDATE: ${data.eventNote}]\n${msg}`;
  }

  return msg;
}

/**
 * Builds WhatsApp share URL for Quick Share mode
 */
export function buildWhatsAppWebUrl(phoneNumber: string, message: string): string {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encoded}`;
}

export function openQuickShareLink(phone: string, text: string) {
  try {
    const url = buildWhatsAppWebUrl(phone, text);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
    }, 200);
  } catch {
    // ignore
  }
}

/**
 * Dispatches WhatsApp message to a single recipient via Quick Share (wa.me) or Automatic Cloud API
 */
export async function dispatchWhatsAppNotification(
  message: string,
  eventType: WhatsAppLogEntry['eventType'],
  pair: string,
  settings: {
    whatsappEnabled: boolean;
    whatsappPhone?: string;
    whatsappMode: WhatsAppDeliveryMode;
  }
): Promise<WhatsAppLogEntry> {
  const recipient = settings.whatsappPhone || DEFAULT_WHATSAPP_NUMBER;
  const mode = settings.whatsappMode || 'quick_share';

  const logEntry: WhatsAppLogEntry = {
    id: `wa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    eventType,
    pair,
    recipient,
    mode,
    status: 'PENDING',
    previewText: message,
  };

  if (!settings.whatsappEnabled) {
    logEntry.status = 'FAILED';
    logEntry.error = 'WhatsApp integration disabled in Settings';
    return logEntry;
  }

  // Delivery Mode 1: Automatic via serverless Cloud API endpoint
  if (mode === 'automatic') {
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          message,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        logEntry.status = 'SENT';
      } else {
        logEntry.status = 'FAILED';
        logEntry.error = resData.error || `Server HTTP ${res.status}`;
        openQuickShareLink(recipient, message);
      }
    } catch (err: any) {
      logEntry.status = 'FAILED';
      logEntry.error = err?.message || 'Network error calling /api/whatsapp/send';
      openQuickShareLink(recipient, message);
    }
  } else {
    // Delivery Mode 2: Quick Share (wa.me)
    try {
      openQuickShareLink(recipient, message);
      logEntry.status = 'SENT';
    } catch (err: any) {
      logEntry.status = 'FAILED';
      logEntry.error = err?.message || 'Failed opening WhatsApp share link';
    }
  }

  return logEntry;
}

/**
 * Dispatches WhatsApp notification to ALL enabled recipients in the list
 */
export async function dispatchToEnabledRecipients(
  message: string,
  eventType: WhatsAppLogEntry['eventType'],
  pair: string,
  recipients: WhatsAppRecipient[],
  mode: WhatsAppDeliveryMode
): Promise<WhatsAppLogEntry[]> {
  const enabledRecipients = recipients.filter((r) => r.enabled);
  if (enabledRecipients.length === 0) {
    return [];
  }

  const results: WhatsAppLogEntry[] = [];
  for (const r of enabledRecipients) {
    const fullNumber = getFullPhoneNumber(r);
    const log = await dispatchWhatsAppNotification(message, eventType, pair, {
      whatsappEnabled: true,
      whatsappPhone: fullNumber,
      whatsappMode: mode,
    });
    results.push(log);
  }

  return results;
}
