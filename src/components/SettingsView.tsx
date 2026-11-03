import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Newspaper, 
  Download, 
  FileText,
  CheckCircle,
  Smartphone,
  Share2,
  Mic,
  MicOff,
  Filter,
  DollarSign,
  Scale,
  Timer,
  Vibrate,
  Globe,
  Radio,
  Eye,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  Zap,
  Lock,
  Unlock,
  Server,
  Calendar,
  XCircle,
  Key
} from 'lucide-react';
import { UserSettings, VoiceLanguage, WhatsAppDeliveryMode, TradeTimeLimit, WhatsAppRecipient, AutoModeSettings } from '../types/crypto';
import { playClickSound, playLongSignalSound, playShortSignalSound, setSoundMuted } from '../services/audio';
import { setVoiceEnabled, setVoiceLanguage, setVoiceVolume, setVibrationEnabled, speakMessage } from '../services/voice';
import { 
  DEFAULT_WHATSAPP_RECIPIENTS, 
  DEFAULT_WHATSAPP_NUMBER, 
  formatStandardWhatsAppMessage,
  dispatchWhatsAppNotification,
  getFullPhoneNumber
} from '../services/whatsapp';
import { usePWAInstall } from '../hooks/usePWAInstall';

import { StockUserSettings, StockDataProvider } from '../types/stocks';
import { ApiConnectionsCard } from './ApiConnectionsCard';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onSelectExchange?: (ex: 'binance' | 'bitget') => void;
  stockSettings?: StockUserSettings;
  onUpdateStockSettings?: (newSettings: Partial<StockUserSettings>) => void;
  onOpenDisclaimer: () => void;
  totalPaperTradesCount?: number;
  paperWinRate?: number;
  paperNetPnlUsd?: number;
  paperExpectancyUsd?: number;
  onOpenCalendarModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onSelectExchange,
  stockSettings,
  onUpdateStockSettings,
  onOpenDisclaimer,
  totalPaperTradesCount = 0,
  paperWinRate = 0,
  paperNetPnlUsd = 0,
  paperExpectancyUsd = 0,
  onOpenCalendarModal,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [testSentStatus, setTestSentStatus] = useState<string | null>(null);

  // WhatsApp recipients list (defaulting to primary +91 9934480908 and second +92 3044809801)
  const recipients = settings.whatsappRecipients && settings.whatsappRecipients.length > 0
    ? settings.whatsappRecipients
    : DEFAULT_WHATSAPP_RECIPIENTS;

  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientCode, setNewRecipientCode] = useState('+91');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');
  const [showAddRecipient, setShowAddRecipient] = useState(false);

  // Live-Mode Readiness Checklist Calculations (Requirement 3)
  const tradesReqCount = 100;
  const isTradesPassed = totalPaperTradesCount >= tradesReqCount;
  const tradesProgress = Math.min(100, Math.round((totalPaperTradesCount / tradesReqCount) * 100));

  const nowMs = Date.now();
  const firstUsageMs = settings.firstUsageTimestamp || nowMs;
  const weeksOfUse = Math.max(0, (nowMs - firstUsageMs) / (7 * 24 * 3600 * 1000));
  const isWeeksPassed = weeksOfUse >= 4.0;
  const weeksProgress = Math.min(100, Math.round((weeksOfUse / 4.0) * 100));

  const isExpectancyPassed = paperExpectancyUsd > 0;
  const dailyLossBreaches = settings.dailyLossLimitBreaches || 0;
  const isDailyLossLimitNeverBroken = dailyLossBreaches === 0;

  const isLiveChecklistComplete = isTradesPassed && isWeeksPassed && isExpectancyPassed && isDailyLossLimitNeverBroken;

  // Cool-down Locks Status (Requirement 4)
  const isRevengeCooldownActive = Boolean(settings.revengeCooldownUntil && settings.revengeCooldownUntil > nowMs);
  const revengeCooldownMinsLeft = isRevengeCooldownActive
    ? Math.max(1, Math.ceil((settings.revengeCooldownUntil! - nowMs) / 60000))
    : 0;

  const isDailyLossCooldownActive = Boolean(settings.dailyLossCooldownUntil && settings.dailyLossCooldownUntil > nowMs);

  // Sample live message preview
  const sampleMessage = formatStandardWhatsAppMessage({
    exchange: settings.activeExchange || 'binance',
    pair: 'BTC/USDT',
    timeframe: settings.defaultTimeframe || '15m',
    direction: 'LONG',
    entryZone: '$94,200 - $94,450',
    stopLoss: 93100,
    takeProfit1: 95800,
    takeProfit2: 97200,
    riskReward: 2.4,
    timeLimitLabel: settings.selectedTimeLimit === 'custom' ? `${settings.customTimeLimitMinutes}m` : (settings.selectedTimeLimit || '15 min'),
    agreementScore: 88,
  });

  const handleToggleRecipient = (id: string) => {
    playClickSound();
    const updated = recipients.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    onUpdateSettings({ whatsappRecipients: updated });
  };

  const handleUpdateRecipient = (id: string, updates: Partial<WhatsAppRecipient>) => {
    const updated = recipients.map((r) => (r.id === id ? { ...r, ...updates } : r));
    onUpdateSettings({ whatsappRecipients: updated });
  };

  const handleDeleteRecipient = (id: string) => {
    playClickSound();
    const updated = recipients.filter((r) => r.id !== id);
    onUpdateSettings({ whatsappRecipients: updated });
  };

  const handleAddRecipient = () => {
    if (!newRecipientPhone.trim()) return;
    playClickSound();
    const newEntry: WhatsAppRecipient = {
      id: `rec-${Date.now()}`,
      name: newRecipientName.trim() || 'Trader',
      countryCode: newRecipientCode.trim() || '+91',
      phone: newRecipientPhone.trim().replace(/[^0-9]/g, ''),
      enabled: true,
    };
    onUpdateSettings({ whatsappRecipients: [...recipients, newEntry] });
    setNewRecipientName('');
    setNewRecipientPhone('');
    setShowAddRecipient(false);
  };

  const handleSendTestMessage = async (recipient: WhatsAppRecipient) => {
    playClickSound();
    setTestSentStatus(`Sending test to ${getFullPhoneNumber(recipient)}...`);
    try {
      const fullPhone = getFullPhoneNumber(recipient);
      const testMsg = `🧪 [TEST MESSAGE - CYBERPULSE FUTURES]\n${sampleMessage}`;
      const log = await dispatchWhatsAppNotification(testMsg, 'SIGNAL', 'BTC/USDT', {
        whatsappEnabled: true,
        whatsappPhone: fullPhone,
        whatsappMode: settings.whatsappMode || 'quick_share',
      });
      if (log.status === 'SENT') {
        setTestSentStatus(`✓ Test message sent to ${fullPhone}`);
      } else {
        setTestSentStatus(`✓ Link opened for ${fullPhone}`);
      }
    } catch (err: any) {
      setTestSentStatus(`Error: ${err?.message || 'Failed to dispatch test'}`);
    }
    setTimeout(() => setTestSentStatus(null), 3500);
  };

  return (
    <div className="flex flex-col gap-4 pb-28 text-slate-100 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-wide">Terminal Settings</h2>
        <p className="text-xs text-slate-400 font-mono">
          Configure API Connections, WhatsApp recipients, Auto Mode, 2x risk cap, Hindi/English voice & PWA
        </p>
      </div>

      {/* 0. EXCHANGE API CONNECTIONS (Binance & Bitget) */}
      <ApiConnectionsCard
        activeExchange={settings.activeExchange || 'binance'}
        onSelectExchange={(ex) => {
          if (onSelectExchange) onSelectExchange(ex);
          onUpdateSettings({ activeExchange: ex });
        }}
      />

      {/* 1. WHATSAPP CONFIGURATION (Requirement 12) */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-sm text-white">WhatsApp Integration</span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onUpdateSettings({ whatsappEnabled: !settings.whatsappEnabled });
            }}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
              settings.whatsappEnabled
                ? 'bg-emerald-500 text-slate-950 glow-green'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {settings.whatsappEnabled ? 'ENABLED' : 'MUTED'}
          </button>
        </div>

        {/* Delivery Mode: Quick Share vs Automatic */}
        <div className="flex flex-col gap-1.5 text-xs font-mono">
          <span className="text-slate-400">Delivery Mode:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                playClickSound();
                onUpdateSettings({ whatsappMode: 'quick_share' });
              }}
              className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                settings.whatsappMode === 'quick_share'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold text-[11px]">Quick Share (wa.me)</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Prefilled chat link (Default)</div>
            </button>

            <button
              onClick={() => {
                playClickSound();
                onUpdateSettings({ whatsappMode: 'automatic' });
              }}
              className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                settings.whatsappMode === 'automatic'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold text-[11px]">Automatic (Serverless)</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Official Cloud API (via server.ts)</div>
            </button>
          </div>
        </div>

        {/* Recipients List */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 font-bold">Recipients List:</span>
            <button
              onClick={() => setShowAddRecipient(!showAddRecipient)}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>Add Recipient</span>
            </button>
          </div>

          {/* Recipient Cards */}
          <div className="space-y-2">
            {recipients.map((rec) => {
              const fullNumber = getFullPhoneNumber(rec);
              return (
                <div
                  key={rec.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rec.enabled}
                        onChange={() => handleToggleRecipient(rec.id)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer h-4 w-4"
                      />
                      <span className="font-mono text-xs font-bold text-white">{rec.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSendTestMessage(rec)}
                        className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-[10px] font-mono hover:bg-emerald-900 transition cursor-pointer"
                      >
                        Send Test
                      </button>
                      {recipients.length > 1 && (
                        <button
                          onClick={() => handleDeleteRecipient(rec.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Editable Country Code & Phone Number */}
                  <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                    <div className="col-span-1">
                      <span className="text-[9px] text-slate-500 uppercase block">Code</span>
                      <input
                        type="text"
                        value={rec.countryCode}
                        onChange={(e) => handleUpdateRecipient(rec.id, { countryCode: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                        placeholder="+91"
                      />
                    </div>
                    <div className="col-span-3">
                      <span className="text-[9px] text-slate-500 uppercase block">Phone Number</span>
                      <input
                        type="text"
                        value={rec.phone}
                        onChange={(e) => handleUpdateRecipient(rec.id, { phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                        placeholder="9934480908"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Recipient Form */}
          {showAddRecipient && (
            <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-500/40 space-y-2 font-mono text-xs">
              <span className="text-[11px] font-bold text-cyan-300">New WhatsApp Contact:</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Name (e.g. Trading Desk)"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  className="col-span-3 bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Code (e.g. +91)"
                  value={newRecipientCode}
                  onChange={(e) => setNewRecipientCode(e.target.value)}
                  className="col-span-1 bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newRecipientPhone}
                  onChange={(e) => setNewRecipientPhone(e.target.value)}
                  className="col-span-2 bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowAddRecipient(false)}
                  className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[10px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRecipient}
                  className="px-3 py-1 rounded bg-cyan-500 text-slate-950 font-bold text-[10px]"
                >
                  Save Recipient
                </button>
              </div>
            </div>
          )}

          {testSentStatus && (
            <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-xs font-mono">
              {testSentStatus}
            </div>
          )}
        </div>

        {/* Message Preview */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center justify-between w-full text-xs font-mono text-slate-400 hover:text-cyan-400 transition"
          >
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>{showPreview ? 'Hide Message Preview' : 'Show Message Preview'}</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-bold">{showPreview ? '▲' : '▼'}</span>
          </button>

          {showPreview && (
            <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
              {sampleMessage}
            </div>
          )}
        </div>
      </div>

      {/* 2. AUTO MODE SETTINGS (Requirement 13) */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-sm text-white">Auto Mode (Periodic Scanner)</span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              const currentAuto = settings.autoMode || {
                enabled: false,
                intervalMinutes: 15,
                maxDailySignals: 10,
                minMinutesBetweenSignals: 30,
                samePairCooldownHours: 4,
                quietHoursStart: 23,
                quietHoursEnd: 7,
                signalsSentToday: 0,
                lastSignalTimestamp: 0,
                lastSentByPair: {},
                lastScanTimestamp: 0,
                nextScanTimestamp: Date.now() + 15 * 60 * 1000,
              };
              const willEnable = !currentAuto.enabled;
              onUpdateSettings({
                autoMode: {
                  ...currentAuto,
                  enabled: willEnable,
                  nextScanTimestamp: willEnable ? Date.now() + currentAuto.intervalMinutes * 60 * 1000 : 0,
                },
              });
            }}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
              settings.autoMode?.enabled
                ? 'bg-cyan-500 text-slate-950 glow-cyan'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {settings.autoMode?.enabled ? 'AUTO ON' : 'AUTO OFF'}
          </button>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
          When ON, automatically scans {settings.activeExchange === 'binance' ? 'Binance Futures' : 'Bitget Futures'} with Strict Mode and sends to enabled WhatsApp recipients only when high-conviction LONG/SHORT qualifies. Never sends NO TRADE.
        </p>

        {/* Scan Interval */}
        <div className="flex flex-col gap-1.5 text-xs font-mono">
          <div className="flex justify-between text-slate-300">
            <span>Scan Frequency:</span>
            <span className="text-cyan-400 font-bold">Every {settings.autoMode?.intervalMinutes || 15} min</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[5, 15, 30, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  playClickSound();
                  onUpdateSettings({
                    autoMode: {
                      ...(settings.autoMode || {} as any),
                      intervalMinutes: mins as any,
                    },
                  });
                }}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  (settings.autoMode?.intervalMinutes || 15) === mins
                    ? 'bg-cyan-500 text-slate-950 shadow glow-cyan'
                    : 'bg-slate-950 border border-slate-800 text-slate-400'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Safeguards Table */}
        <div className="rounded-xl bg-slate-950 p-2.5 space-y-1.5 font-mono text-[11px] text-slate-400 border border-slate-800">
          <div className="flex justify-between">
            <span>Daily Signal Cap:</span>
            <span className="text-white font-bold">{settings.autoMode?.maxDailySignals || 10} signals / day</span>
          </div>
          <div className="flex justify-between">
            <span>Min Spacing:</span>
            <span className="text-white font-bold">{settings.autoMode?.minMinutesBetweenSignals || 30} mins between alerts</span>
          </div>
          <div className="flex justify-between">
            <span>Cooldown:</span>
            <span className="text-white font-bold">{settings.autoMode?.samePairCooldownHours || 4}h per pair/direction</span>
          </div>
          <div className="flex justify-between">
            <span>Quiet Hours:</span>
            <span className="text-amber-400 font-bold">23:00 – 07:00 (Muted)</span>
          </div>
        </div>

        <div className="rounded-xl bg-cyan-950/30 border border-cyan-800/40 p-2.5 text-[10px] font-mono text-cyan-300 flex items-start gap-1.5">
          <Server className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
          <span>
            <strong>Background Note:</strong> Browser-based auto-scan operates while the app is open in your browser or installed PWA. For 24/7 background scanning when your device is closed, trigger the server cron endpoint <code>/api/cron/scan</code> via Cloud Scheduler.
          </span>
        </div>
      </div>

      {/* 3. RISK MANAGEMENT & LEVERAGE CAP (Requirement 14) */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-sm text-white">Risk Rules & Leverage Caps</span>
          </div>
          <span className="text-[10px] font-mono text-amber-400 font-bold">PRUDENT LIMITS</span>
        </div>

        {/* Leverage Cap (cannot exceed 3x, suggested 2x) */}
        <div className="flex flex-col gap-1.5 text-xs font-mono">
          <div className="flex justify-between text-slate-300">
            <span>Max Leverage Setting:</span>
            <span className="text-cyan-400 font-bold">{settings.maxLeverage || 2}x (Strict Cap ≤ 3x)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((lev) => (
              <button
                key={lev}
                onClick={() => {
                  playClickSound();
                  onUpdateSettings({ maxLeverage: lev });
                }}
                className={`py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  (settings.maxLeverage || 2) === lev
                    ? 'bg-cyan-500 text-slate-950 shadow glow-cyan'
                    : 'bg-slate-950 border border-slate-800 text-slate-400'
                }`}
              >
                {lev}x {lev === 2 ? '(Suggested)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Loss Limit */}
        <div className="flex justify-between items-center text-xs font-mono pt-1 border-t border-slate-800">
          <div>
            <span className="text-slate-300 font-semibold block">Daily Loss Lockout</span>
            <span className="text-[10px] text-slate-500">Locks signals if daily loss exceeds limit</span>
          </div>
          <span className="text-red-400 font-bold text-sm">{settings.dailyLossLimitPercent || 3}%</span>
        </div>

        {/* Paper Trading Mode (ON by default) */}
        <div className="flex justify-between items-center text-xs font-mono pt-1 border-t border-slate-800">
          <div>
            <span className="text-slate-300 font-semibold block">Paper Trading Engine</span>
            <span className="text-[10px] text-slate-500">Virtual balance simulation from live prices</span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onUpdateSettings({ paperTradingEnabled: !settings.paperTradingEnabled });
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              settings.paperTradingEnabled
                ? 'bg-emerald-500 text-slate-950 glow-green'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {settings.paperTradingEnabled ? 'PAPER ON' : 'PAPER OFF'}
          </button>
        </div>

        {/* LIVE-MODE READINESS CHECKLIST (Requirement 3) */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3 text-xs font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isLiveChecklistComplete ? (
                <Unlock className="h-4 w-4 text-emerald-400" />
              ) : (
                <Lock className="h-4 w-4 text-amber-400" />
              )}
              <div>
                <span className="font-bold text-slate-100 block">Live-Mode Readiness Checklist</span>
                <span className="text-[10px] text-slate-400">
                  {isLiveChecklistComplete ? 'All 4 requirements satisfied' : 'Live mode stays locked until all 4 criteria are met'}
                </span>
              </div>
            </div>

            <button
              disabled={!isLiveChecklistComplete}
              onClick={() => {
                if (!isLiveChecklistComplete) return;
                playClickSound();
                onUpdateSettings({ isLiveModeSelected: !settings.isLiveModeSelected });
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                !isLiveChecklistComplete
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                  : settings.isLiveModeSelected
                  ? 'bg-amber-500 text-slate-950 glow-amber'
                  : 'bg-emerald-500 text-slate-950 glow-green'
              }`}
            >
              {!isLiveChecklistComplete
                ? 'LOCKED'
                : settings.isLiveModeSelected
                ? 'LIVE MONITORED'
                : 'ENABLE LIVE'}
            </button>
          </div>

          {/* 4 Quantitative Checklist Items */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            {/* Item 1: At least 100 paper trades */}
            <div className="flex flex-col gap-1 bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  {isTradesPassed ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="text-slate-200">1. At least 100 Paper Trades</span>
                </div>
                <span className={`font-bold ${isTradesPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {totalPaperTradesCount} / {tradesReqCount} trades
                </span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${isTradesPassed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${tradesProgress}%` }}
                />
              </div>
            </div>

            {/* Item 2: At least 4 weeks of use */}
            <div className="flex flex-col gap-1 bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  {isWeeksPassed ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="text-slate-200">2. At least 4 Weeks of Real Usage</span>
                </div>
                <span className={`font-bold ${isWeeksPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {weeksOfUse.toFixed(1)} / 4.0 weeks
                </span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${isWeeksPassed ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                  style={{ width: `${weeksProgress}%` }}
                />
              </div>
            </div>

            {/* Item 3: Positive expectancy after fees */}
            <div className="flex items-center justify-between bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 text-[11px]">
              <div className="flex items-center gap-1.5">
                {isExpectancyPassed ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                )}
                <span className="text-slate-200">3. Positive Expectancy (After Fees)</span>
              </div>
              <span className={`font-bold ${isExpectancyPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {paperExpectancyUsd > 0 ? '+' : ''}${paperExpectancyUsd.toFixed(2)} / trade
              </span>
            </div>

            {/* Item 4: Daily loss limit never broken */}
            <div className="flex items-center justify-between bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 text-[11px]">
              <div className="flex items-center gap-1.5">
                {isDailyLossLimitNeverBroken ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                )}
                <span className="text-slate-200">4. Daily Loss Limit Never Broken</span>
              </div>
              <span className={`font-bold ${isDailyLossLimitNeverBroken ? 'text-emerald-400' : 'text-rose-400'}`}>
                {dailyLossBreaches === 0 ? '0 Breaches (Clean)' : `${dailyLossBreaches} Breaches (Reset req.)`}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed font-sans pt-1 border-t border-slate-800/60">
            <strong>Safety Protocol:</strong> The app never connects to real exchange API keys or places real orders. Live Mode provides real-time alerts and position tracking only.
          </p>
        </div>

        {/* NON-BYPASSABLE COOL-DOWN LOCKS (Requirement 4) */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-cyan-400" />
              <span className="font-bold text-slate-200">Protective Cool-Down Locks</span>
            </div>
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
              NON-BYPASSABLE
            </span>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Strict behavioral safeguards to prevent emotional decisions and account blowups. These locks operate autonomously and cannot be switched off in Settings.
          </div>

          {/* Active Cooldown Banner or Clear State */}
          {isRevengeCooldownActive ? (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/80 text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <strong className="text-rose-200 block font-mono">Take a break, do not revenge-trade</strong>
                <span>2 consecutive losses logged. Signal generation is locked for {revengeCooldownMinsLeft} more minute(s).</span>
              </div>
            </div>
          ) : isDailyLossCooldownActive ? (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/80 text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <strong className="text-rose-200 block font-mono">Daily loss limit reached. Trading locked until tomorrow.</strong>
                <span>Signal generation is locked until 00:00 local time to protect your capital.</span>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>No active lockouts. Capital protection rules active.</span>
              </div>
              <span className="text-[10px] text-slate-500">2-Loss: 30m · Daily: 24h</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <div>
              <span className="text-slate-200 font-bold block">Revenge Protection:</span>
              2 consecutive losses = 30m lock
            </div>
            <div>
              <span className="text-slate-200 font-bold block">Daily Loss Lockout:</span>
              {settings.dailyLossLimitPercent || 3}% loss = locked until 00:00
            </div>
          </div>
        </div>

        {/* ECONOMIC EVENT CALENDAR CONFIGURATION (Requirement 1) */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <span className="font-bold text-slate-200">High-Impact Event Calendar</span>
            </div>
            <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              ±30m WAIT WINDOW
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Within 30 minutes before and after high-impact events (central bank decisions, inflation CPI/PCE, employment NFP, and mega earnings), signal generation returns <strong>WAIT / NO TRADE</strong>.
          </p>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Free Calendar API Key (Optional / Finnhub or Economic API):</label>
            <input
              type="text"
              value={settings.calendarApiKey || ''}
              onChange={(e) => onUpdateSettings({ calendarApiKey: e.target.value.trim() })}
              placeholder="Defaults to auto-generated FOMC/CPI/NFP schedule"
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          {onOpenCalendarModal && (
            <button
              onClick={() => {
                playClickSound();
                onOpenCalendarModal();
              }}
              className="w-full py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Open Event Calendar & Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. VOICE & AUDIO ENGINE (Requirement 10) */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-sm text-white">Voice & Haptic Engine</span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              const next = !settings.voiceEnabled;
              onUpdateSettings({ voiceEnabled: next });
              setVoiceEnabled(next);
            }}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
              settings.voiceEnabled
                ? 'bg-cyan-500 text-slate-950 glow-cyan'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {settings.voiceEnabled ? 'VOICE ON' : 'MUTED'}
          </button>
        </div>

        {/* Language Selection: English vs Hindi vs Urdu */}
        <div className="flex flex-col gap-1.5 text-xs font-mono">
          <div className="flex justify-between text-slate-300">
            <span>Spoken Language:</span>
            <span className="text-cyan-400 font-bold">
              {settings.voiceLanguage === 'ur-PK' ? 'اردو (Urdu)' : settings.voiceLanguage === 'hi-IN' ? 'हिन्दी (Hindi)' : 'English (US)'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => {
                playClickSound();
                onUpdateSettings({ voiceLanguage: 'en-US' });
                setVoiceLanguage('en-US');
                speakMessage('English voice selected', 'en-US');
              }}
              className={`py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                settings.voiceLanguage === 'en-US'
                  ? 'bg-cyan-500 text-slate-950 shadow glow-cyan'
                  : 'bg-slate-950 border border-slate-800 text-slate-400'
              }`}
            >
              English
            </button>
            <button
              onClick={() => {
                playClickSound();
                onUpdateSettings({ voiceLanguage: 'hi-IN' });
                setVoiceLanguage('hi-IN');
                speakMessage('Hindi aawaaz chuni gayi', 'hi-IN');
              }}
              className={`py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                settings.voiceLanguage === 'hi-IN'
                  ? 'bg-cyan-500 text-slate-950 shadow glow-cyan'
                  : 'bg-slate-950 border border-slate-800 text-slate-400'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => {
                playClickSound();
                onUpdateSettings({ voiceLanguage: 'ur-PK' });
                setVoiceLanguage('ur-PK');
                speakMessage('Urdu aawaaz muntakhib ho gayi', 'ur-PK');
              }}
              className={`py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                settings.voiceLanguage === 'ur-PK'
                  ? 'bg-cyan-500 text-slate-950 shadow glow-cyan'
                  : 'bg-slate-950 border border-slate-800 text-slate-400'
              }`}
            >
              اردو (Urdu)
            </button>
          </div>
        </div>

        {/* Volume Slider */}
        <div className="flex flex-col gap-1 text-xs font-mono">
          <div className="flex justify-between text-slate-300">
            <span>Speech Volume:</span>
            <span className="text-cyan-400 font-bold">{Math.round((settings.voiceVolume ?? 0.95) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.voiceVolume ?? 0.95}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateSettings({ voiceVolume: val });
              setVoiceVolume(val);
            }}
            className="w-full accent-cyan-400"
          />
        </div>
      </div>

      {/* Optional CoinGlass API Key for Smart Money & Whale Tracking */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col gap-2.5 text-xs font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-sm text-white">CoinGlass API Key (Optional)</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-bold">WHALE TRACKER</span>
        </div>
        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
          Optional API key for expanded long/short account metrics. When omitted, Smart Money and volume pressure features run seamlessly using free, public Binance and Bitget REST data.
        </p>
        <input
          type="password"
          value={settings.coinGlassApiKey || ''}
          onChange={(e) => onUpdateSettings({ coinGlassApiKey: e.target.value.trim() })}
          placeholder="Enter your optional CoinGlass API Key..."
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* 5. LIQUIDITY PRE-FILTERS & STRICT MODE */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col gap-3 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-white">Scanner Liquidity Filters</span>
          <span className="text-[10px] text-cyan-400">Strict Mode Protection</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-300">Min 24h Volume (USDT):</span>
          <span className="text-cyan-400 font-bold">${((settings.min24hVolumeUsd || 10_000_000) / 1_000_000).toFixed(0)}M</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-300">Max Bid/Ask Spread:</span>
          <span className="text-cyan-400 font-bold">{settings.maxSpreadPercent || 0.08}%</span>
        </div>
      </div>

      {/* 5B. STOCKS MODULE SETTINGS */}
      {stockSettings && onUpdateStockSettings && (
        <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-4 flex flex-col gap-3.5 text-xs font-mono shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📈</span>
              <span className="font-bold text-sm text-white">Stocks Module Settings</span>
            </div>
            <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-700">
              Cash & Paper
            </span>
          </div>

          {/* Provider Selection */}
          <div className="flex flex-col gap-1.5">
            <span className="text-slate-300 font-semibold">Data Provider:</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'demo_bundled', label: 'Bundled Snapshot', desc: 'No API key needed (Offline ready)' },
                { id: 'finnhub', label: 'Finnhub', desc: 'Requires free API key' },
                { id: 'twelvedata', label: 'Twelve Data', desc: 'Global equities' },
                { id: 'alphavantage', label: 'Alpha Vantage', desc: 'Free tier key' },
              ].map(prov => (
                <button
                  key={prov.id}
                  onClick={() => {
                    playClickSound();
                    onUpdateStockSettings({ dataProvider: prov.id as StockDataProvider });
                  }}
                  className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                    stockSettings.dataProvider === prov.id
                      ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-[11px]">{prov.label}</div>
                  <div className="text-[9px] text-slate-500">{prov.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Inputs (Stored locally only) */}
          {stockSettings.dataProvider === 'finnhub' && (
            <div className="space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400">Finnhub API Key (stored in local browser storage only):</label>
              <input
                type="password"
                value={stockSettings.apiKeyFinnhub || ''}
                onChange={e => onUpdateStockSettings({ apiKeyFinnhub: e.target.value })}
                placeholder="Enter Finnhub API Key"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {stockSettings.dataProvider === 'twelvedata' && (
            <div className="space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400">Twelve Data API Key (stored in local browser storage only):</label>
              <input
                type="password"
                value={stockSettings.apiKeyTwelveData || ''}
                onChange={e => onUpdateStockSettings({ apiKeyTwelveData: e.target.value })}
                placeholder="Enter Twelve Data API Key"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {/* Short Selling Toggle (Default OFF) */}
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="font-bold text-white text-[11px]">Stock Short Selling Signals</div>
              <div className="text-[10px] text-slate-400">
                Default OFF. Shorting stocks involves borrow costs and uptick rules.
              </div>
            </div>
            <button
              onClick={() => {
                playClickSound();
                onUpdateStockSettings({ enableShortSelling: !stockSettings.enableShortSelling });
              }}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
                stockSettings.enableShortSelling
                  ? 'bg-rose-500 text-white glow-rose'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {stockSettings.enableShortSelling ? 'ENABLED' : 'OFF (Long Only)'}
            </button>
          </div>

          {/* Opening Volatility Observation Period */}
          <div className="flex flex-col gap-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-[11px]">Opening Volatility Observation:</span>
              <span className="text-cyan-400 font-bold">{stockSettings.observationPeriodMinutes} min</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Withholds high-confidence signals during morning shakeout unless ORB setup confirms.
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={stockSettings.observationPeriodMinutes}
              onChange={e => onUpdateStockSettings({ observationPeriodMinutes: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-400 mt-1"
            />
          </div>

          {/* Custom Trading Window */}
          <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-[11px]">Custom Trading Window</div>
                <div className="text-[10px] text-slate-400">Restrict signals to high-liquidity mid-session hours</div>
              </div>
              <input
                type="checkbox"
                checked={stockSettings.customTradingWindowEnabled}
                onChange={e => onUpdateStockSettings({ customTradingWindowEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
            </div>

            {stockSettings.customTradingWindowEnabled && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400">Start Time:</span>
                  <input
                    type="time"
                    value={stockSettings.customTradingStart}
                    onChange={e => onUpdateStockSettings({ customTradingStart: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">End Time:</span>
                  <input
                    type="time"
                    value={stockSettings.customTradingEnd}
                    onChange={e => onUpdateStockSettings({ customTradingEnd: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. PWA INSTALL & BACKGROUND RELIABILITY NOTE */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-sm text-white">PWA & Background Reliability</span>
          </div>
          {isInstalled && (
            <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
              INSTALLED
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
          Installing the app to the home screen gives the most reliable background behavior, ensuring timers and speech synthesis continue operating smoothly when multitasking.
        </p>

        {isInstallable && !isInstalled && (
          <button
            onClick={install}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-mono font-bold text-xs tracking-wider transition shadow-lg glow-cyan cursor-pointer"
          >
            Install CyberPulse to Home Screen
          </button>
        )}
      </div>

      {/* 7. RISK DISCLAIMER ACCESS */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">Review Risk & Safety Protocol</span>
        <button
          onClick={() => {
            playClickSound();
            onOpenDisclaimer();
          }}
          className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] underline cursor-pointer"
        >
          Open Disclaimer
        </button>
      </div>
    </div>
  );
};
