import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Key, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Activity, Wifi, WifiOff, Trash2, Zap } from 'lucide-react';
import { 
  StoredCredentialsState, 
  ExchangeCredentials, 
  loadStoredCredentials, 
  saveStoredCredentials, 
  clearExchangeCredentials, 
  testBinanceConnection, 
  testBitgetConnection,
  getDailyApiCounter,
  ApiRequestCounter
} from '../services/api/apiCredentials';
import { playClickSound } from '../services/audio';

interface ApiConnectionsCardProps {
  activeExchange: 'binance' | 'bitget';
  onSelectExchange: (ex: 'binance' | 'bitget') => void;
}

export const ApiConnectionsCard: React.FC<ApiConnectionsCardProps> = ({ activeExchange, onSelectExchange }) => {
  const [creds, setCreds] = useState<StoredCredentialsState>({
    binance: { apiKey: '', secretKey: '', isConnected: false },
    bitget: { apiKey: '', secretKey: '', passphrase: '', isConnected: false },
  });

  const [counter, setCounter] = useState<ApiRequestCounter>({ dateStr: '', count: 0, limit: 333 });

  // Input fields for Binance
  const [binanceKey, setBinanceKey] = useState('');
  const [binanceSecret, setBinanceSecret] = useState('');
  const [binanceStatus, setBinanceStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [binanceMessage, setBinanceMessage] = useState<string | null>(null);

  // Input fields for Bitget
  const [bitgetKey, setBitgetKey] = useState('');
  const [bitgetSecret, setBitgetSecret] = useState('');
  const [bitgetPass, setBitgetPass] = useState('');
  const [bitgetStatus, setBitgetStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [bitgetMessage, setBitgetMessage] = useState<string | null>(null);

  // Load credentials on mount
  useEffect(() => {
    async function init() {
      const loaded = await loadStoredCredentials();
      setCreds(loaded);
      if (loaded.binance) {
        setBinanceKey(loaded.binance.apiKey || '');
        setBinanceSecret(loaded.binance.secretKey || '');
      }
      if (loaded.bitget) {
        setBitgetKey(loaded.bitget.apiKey || '');
        setBitgetSecret(loaded.bitget.secretKey || '');
        setBitgetPass(loaded.bitget.passphrase || '');
      }
      setCounter(getDailyApiCounter());
    }
    init();
  }, []);

  // Update counter periodically or on user interaction
  const refreshCounter = () => {
    setCounter(getDailyApiCounter());
  };

  // Test Binance
  const handleTestBinance = async () => {
    playClickSound();
    setBinanceStatus('TESTING');
    setBinanceMessage('Testing Binance API connection & permissions...');
    refreshCounter();

    const result = await testBinanceConnection(binanceKey, binanceSecret);
    refreshCounter();

    if (result.success) {
      setBinanceStatus('SUCCESS');
      setBinanceMessage(result.message);
      const updatedCreds: StoredCredentialsState = {
        ...creds,
        binance: {
          apiKey: binanceKey,
          secretKey: binanceSecret,
          isConnected: true,
          lastTestedAt: Date.now(),
          permissions: { read: true, trade: true, withdraw: false },
        },
      };
      setCreds(updatedCreds);
      await saveStoredCredentials(updatedCreds);
    } else {
      setBinanceStatus('ERROR');
      setBinanceMessage(result.message);
      const updatedCreds: StoredCredentialsState = {
        ...creds,
        binance: {
          apiKey: binanceKey,
          secretKey: binanceSecret,
          isConnected: false,
          lastError: result.message,
          permissions: { read: false, trade: false, withdraw: false },
        },
      };
      setCreds(updatedCreds);
      await saveStoredCredentials(updatedCreds);
    }
  };

  // Disconnect Binance
  const handleDisconnectBinance = async () => {
    playClickSound();
    setBinanceKey('');
    setBinanceSecret('');
    setBinanceStatus('IDLE');
    setBinanceMessage('Binance API disconnected and credentials wiped from encrypted storage.');
    await clearExchangeCredentials('binance');
    setCreds((prev) => ({
      ...prev,
      binance: { apiKey: '', secretKey: '', isConnected: false, permissions: { read: false, trade: false, withdraw: false } },
    }));
  };

  // Test Bitget
  const handleTestBitget = async () => {
    playClickSound();
    setBitgetStatus('TESTING');
    setBitgetMessage('Testing Bitget API connection & permissions...');
    refreshCounter();

    const result = await testBitgetConnection(bitgetKey, bitgetSecret, bitgetPass);
    refreshCounter();

    if (result.success) {
      setBitgetStatus('SUCCESS');
      setBitgetMessage(result.message);
      const updatedCreds: StoredCredentialsState = {
        ...creds,
        bitget: {
          apiKey: bitgetKey,
          secretKey: bitgetSecret,
          passphrase: bitgetPass,
          isConnected: true,
          lastTestedAt: Date.now(),
          permissions: { read: true, trade: true, withdraw: false },
        },
      };
      setCreds(updatedCreds);
      await saveStoredCredentials(updatedCreds);
    } else {
      setBitgetStatus('ERROR');
      setBitgetMessage(result.message);
      const updatedCreds: StoredCredentialsState = {
        ...creds,
        bitget: {
          apiKey: bitgetKey,
          secretKey: bitgetSecret,
          passphrase: bitgetPass,
          isConnected: false,
          lastError: result.message,
          permissions: { read: false, trade: false, withdraw: false },
        },
      };
      setCreds(updatedCreds);
      await saveStoredCredentials(updatedCreds);
    }
  };

  // Disconnect Bitget
  const handleDisconnectBitget = async () => {
    playClickSound();
    setBitgetKey('');
    setBitgetSecret('');
    setBitgetPass('');
    setBitgetStatus('IDLE');
    setBitgetMessage('Bitget API disconnected and credentials wiped from encrypted storage.');
    await clearExchangeCredentials('bitget');
    setCreds((prev) => ({
      ...prev,
      bitget: { apiKey: '', secretKey: '', passphrase: '', isConnected: false, permissions: { read: false, trade: false, withdraw: false } },
    }));
  };

  const usagePercent = Math.min(100, Math.round((counter.count / counter.limit) * 100));

  return (
    <div className="space-y-4">
      {/* Active Exchange Selector Banner */}
      <div className="rounded-2xl bg-slate-900/90 border-2 border-cyan-500/40 p-4 shadow-xl backdrop-blur-xl font-mono text-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-sm text-white">Active Market Exchange Selection</span>
          </div>
          <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-bold">
            CURRENT: {activeExchange.toUpperCase()} FUTURES
          </span>
        </div>

        <p className="text-[11px] text-slate-400 font-sans mb-3">
          All market scanner, order book, candlestick indicators, and trade analysis endpoints use the selected exchange exclusively.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              playClickSound();
              onSelectExchange('binance');
            }}
            className={`p-3 rounded-xl font-bold flex items-center justify-between transition cursor-pointer border ${
              activeExchange === 'binance'
                ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🟡</span>
              <div className="text-left">
                <div className="text-xs font-black">BINANCE FUTURES</div>
                <div className="text-[9px] text-slate-400 font-normal">USDT-M / COIN-M</div>
              </div>
            </div>
            {creds.binance?.isConnected ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                CONNECTED
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-500 font-bold">
                READY
              </span>
            )}
          </button>

          <button
            onClick={() => {
              playClickSound();
              onSelectExchange('bitget');
            }}
            className={`p-3 rounded-xl font-bold flex items-center justify-between transition cursor-pointer border ${
              activeExchange === 'bitget'
                ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🔵</span>
              <div className="text-left">
                <div className="text-xs font-black">BITGET FUTURES</div>
                <div className="text-[9px] text-slate-400 font-normal">USDT / USDC Mix</div>
              </div>
            </div>
            {creds.bitget?.isConnected ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                CONNECTED
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-500 font-bold">
                READY
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Daily API Request Usage Tracker Bar (333 Limit) */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 shadow-lg font-mono text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-slate-200">Daily API Request Usage Tracker</span>
          </div>
          <span className={`text-[11px] font-bold ${counter.count >= counter.limit ? 'text-rose-400' : 'text-cyan-400'}`}>
            {counter.count} / {counter.limit} Requests
          </span>
        </div>

        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Configured Daily Cap: 333 req/day</span>
          <span>Resets at Midnight UTC</span>
        </div>

        {counter.count >= counter.limit && (
          <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/80 text-rose-300 text-[11px] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>Daily API request limit reached (333/333). Non-essential market requests are paused until reset.</span>
          </div>
        )}
      </div>

      {/* SECTION 1: BINANCE API CONNECTION CARD */}
      <div className="rounded-2xl bg-slate-900/90 border border-amber-500/30 p-4 shadow-xl font-mono text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🟡</span>
            <div>
              <span className="font-bold text-sm text-white block">Binance API Integration</span>
              <span className="text-[10px] text-slate-400 font-sans">USDT-M Futures API Credentials</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {creds.binance?.isConnected ? (
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/50 font-bold text-[10px] flex items-center gap-1">
                <Wifi className="h-3 w-3" /> CONNECTED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-bold text-[10px] flex items-center gap-1">
                <WifiOff className="h-3 w-3 text-slate-500" /> DISCONNECTED
              </span>
            )}
          </div>
        </div>

        {/* Binance API Key */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5 text-amber-400" />
            <span>Binance API Key:</span>
          </label>
          <input
            type="password"
            value={binanceKey}
            onChange={(e) => setBinanceKey(e.target.value)}
            placeholder="Enter your personal Binance API Key..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Binance Secret Key */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Binance Secret Key:</span>
          </label>
          <input
            type="password"
            value={binanceSecret}
            onChange={(e) => setBinanceSecret(e.target.value)}
            placeholder="Enter your personal Binance Secret Key..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Security & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestBinance}
              disabled={binanceStatus === 'TESTING' || !binanceKey || !binanceSecret}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
            >
              {binanceStatus === 'TESTING' ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Testing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Test & Connect
                </>
              )}
            </button>

            {creds.binance?.isConnected && (
              <button
                onClick={handleDisconnectBinance}
                className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-rose-950 border border-rose-500/40 text-rose-300 font-bold text-xs transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Disconnect
              </button>
            )}
          </div>

          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-sans">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>AES-GCM Encrypted • Withdrawals Blocked</span>
          </div>
        </div>

        {/* Feedback Message */}
        {binanceMessage && (
          <div
            className={`p-2.5 rounded-xl border font-mono text-[11px] leading-relaxed ${
              binanceStatus === 'SUCCESS'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                : binanceStatus === 'ERROR'
                ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            {binanceMessage}
          </div>
        )}
      </div>

      {/* SECTION 2: BITGET API CONNECTION CARD */}
      <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-4 shadow-xl font-mono text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🔵</span>
            <div>
              <span className="font-bold text-sm text-white block">Bitget API Integration</span>
              <span className="text-[10px] text-slate-400 font-sans">Futures V2 API Credentials</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {creds.bitget?.isConnected ? (
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/50 font-bold text-[10px] flex items-center gap-1">
                <Wifi className="h-3 w-3" /> CONNECTED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-bold text-[10px] flex items-center gap-1">
                <WifiOff className="h-3 w-3 text-slate-500" /> DISCONNECTED
              </span>
            )}
          </div>
        </div>

        {/* Bitget API Key */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5 text-cyan-400" />
            <span>Bitget API Key:</span>
          </label>
          <input
            type="password"
            value={bitgetKey}
            onChange={(e) => setBitgetKey(e.target.value)}
            placeholder="Enter your personal Bitget API Key..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Bitget Secret Key */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Bitget Secret Key:</span>
          </label>
          <input
            type="password"
            value={bitgetSecret}
            onChange={(e) => setBitgetSecret(e.target.value)}
            placeholder="Enter your personal Bitget Secret Key..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Bitget Passphrase */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5 text-cyan-400" />
            <span>Bitget Passphrase:</span>
          </label>
          <input
            type="password"
            value={bitgetPass}
            onChange={(e) => setBitgetPass(e.target.value)}
            placeholder="Enter your Bitget API Passphrase..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Security & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestBitget}
              disabled={bitgetStatus === 'TESTING' || !bitgetKey || !bitgetSecret || !bitgetPass}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
            >
              {bitgetStatus === 'TESTING' ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Testing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Test & Connect
                </>
              )}
            </button>

            {creds.bitget?.isConnected && (
              <button
                onClick={handleDisconnectBitget}
                className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-rose-950 border border-rose-500/40 text-rose-300 font-bold text-xs transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Disconnect
              </button>
            )}
          </div>

          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-sans">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>AES-GCM Encrypted • Withdrawals Blocked</span>
          </div>
        </div>

        {/* Feedback Message */}
        {bitgetMessage && (
          <div
            className={`p-2.5 rounded-xl border font-mono text-[11px] leading-relaxed ${
              bitgetStatus === 'SUCCESS'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                : bitgetStatus === 'ERROR'
                ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            {bitgetMessage}
          </div>
        )}
      </div>
    </div>
  );
};
