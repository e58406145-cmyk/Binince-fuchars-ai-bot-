import React, { useState, useEffect } from 'react';
import { 
  ExchangeId, 
  Timeframe, 
  AutoScannerStatus, 
  AutoScannerCommand, 
  FullSignal27Point, 
  AutoScannerStats,
  VoiceLanguage
} from '../types/crypto';
import { 
  Zap, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ShieldCheck, 
  Clock, 
  Compass, 
  Layers, 
  Sliders, 
  Send, 
  CheckCircle, 
  Activity,
  AlertCircle,
  HelpCircle,
  Volume2
} from 'lucide-react';
import { formatCryptoPrice } from '../utils/formatters';
import { Signal27PointCard } from './Signal27PointCard';
import { 
  listenToVoiceCommand, 
  announceCommandReady, 
  announceScannerStateChange,
  announceBestOpportunity,
  announceBestDirectionalSignal,
  announceNoOpportunityFound
} from '../services/voice';
import { playClickSound, playLongSignalSound, playShortSignalSound } from '../services/audio';

interface AutoScannerDashboardProps {
  activeExchange: ExchangeId;
  timeframe: Timeframe;
  stats: AutoScannerStats;
  voiceLanguage: VoiceLanguage;
  onToggleAutoMode: (enabled: boolean) => void;
  onExecuteCommand: (command: AutoScannerCommand) => void;
  onTakeTrade: (signal: FullSignal27Point, leverage: number) => void;
  onShareWhatsApp: (signal: FullSignal27Point) => void;
}

export const AutoScannerDashboard: React.FC<AutoScannerDashboardProps> = ({
  activeExchange,
  timeframe,
  stats,
  voiceLanguage,
  onToggleAutoMode,
  onExecuteCommand,
  onTakeTrade,
  onShareWhatsApp,
}) => {
  const [selectedSignalDetail, setSelectedSignalDetail] = useState<FullSignal27Point | null>(null);
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'LONG' | 'SHORT' | 'HIGH_SCORE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const isModeOn = stats.status !== 'OFF';
  const isScanning = stats.status === 'SCANNING';
  const isContinuous = stats.status === 'CONTINUOUS';
  const isPaused = stats.status === 'PAUSED';

  // Toggle voice recognition
  const toggleVoiceListening = () => {
    if (isListeningVoice) {
      setIsListeningVoice(false);
      setVoiceTranscript(null);
      return;
    }

    if (!isModeOn) {
      onToggleAutoMode(true);
    }

    setIsListeningVoice(true);
    setVoiceError(null);
    setVoiceTranscript('Listening for command...');

    const stop = listenToVoiceCommand(
      (cmd, transcript) => {
        setIsListeningVoice(false);
        setVoiceTranscript(`Recognized: "${transcript}"`);
        onExecuteCommand(cmd);
        setTimeout(() => setVoiceTranscript(null), 4000);
      },
      (err) => {
        setIsListeningVoice(false);
        setVoiceError(err);
        setTimeout(() => setVoiceError(null), 4000);
      }
    );
  };

  // Filter scanned opportunities
  const filteredSignals = stats.scannedOpportunities.filter((sig) => {
    const matchesSearch = sig.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sig.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterDirection === 'LONG') return sig.direction === 'LONG';
    if (filterDirection === 'SHORT') return sig.direction === 'SHORT';
    if (filterDirection === 'HIGH_SCORE') return sig.setupScore >= 75;
    return true;
  });

  return (
    <div className="space-y-4 pb-24 text-slate-100 max-w-4xl mx-auto px-3 sm:px-4">
      {/* Mode B Master Switch Banner */}
      <div className="bg-slate-900/90 border-2 border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full animate-ping ${
                isModeOn ? 'bg-cyan-400' : 'bg-slate-600'
              }`} />
              <h1 className="text-lg sm:text-xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                <span>AI AUTO GENERATE ALL PAIRS</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                MODE B
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Scans <span className="text-cyan-300 font-bold uppercase">{activeExchange} Futures</span> exclusively based on Settings.
            </p>
          </div>

          {/* Master ON/OFF Toggle Button */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                playClickSound();
                onToggleAutoMode(!isModeOn);
              }}
              className={`px-5 py-2.5 rounded-xl font-mono font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-xl cursor-pointer flex items-center gap-2 ${
                isModeOn
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-cyan-500/30 glow-cyan'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}
            >
              <Zap className={`h-4 w-4 ${isModeOn ? 'fill-slate-950' : ''}`} />
              <span>{isModeOn ? '⚡ AUTO GENERATE: ON' : '⚡ AUTO GENERATE: OFF'}</span>
            </button>
          </div>
        </div>

        {/* Status Strip & Live Connection Status */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">AUTO GENERATE STATUS:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
              stats.status === 'OFF' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
              stats.status === 'COMMAND_READY' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 animate-pulse' :
              stats.status === 'SCANNING' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' :
              stats.status === 'CONTINUOUS' ? 'bg-purple-950 text-purple-300 border border-purple-500/50' :
              'bg-amber-950 text-amber-300 border border-amber-500/50'
            }`}>
              {stats.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 font-mono">Live Market Connection:</span>
            <span className="text-emerald-400 font-bold font-mono">Connected ({activeExchange.toUpperCase()})</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
            <span>Exchange: <strong className="text-white uppercase">{activeExchange} FUTURES</strong></span>
            <span>TF: <strong className="text-cyan-300">{timeframe}</strong></span>
            {isContinuous && stats.nextScanCountdownSeconds > 0 && (
              <span className="text-purple-400 font-bold">
                Next Scan: {Math.floor(stats.nextScanCountdownSeconds / 60)}:{(stats.nextScanCountdownSeconds % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        {/* Dashboard Direct Controls: START SCAN, STOP SCAN, PAUSE SCAN, RESUME SCAN, REFRESH MARKET DATA */}
        {isModeOn && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            <span className="text-slate-400 font-bold mr-1">Controls:</span>
            <button
              onClick={() => onExecuteCommand('SCAN_ALL')}
              disabled={isScanning}
              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition cursor-pointer disabled:opacity-40"
            >
              ▶ START SCAN
            </button>
            <button
              onClick={() => onExecuteCommand('STOP')}
              disabled={!isScanning && !isContinuous && !isPaused}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold transition cursor-pointer disabled:opacity-40"
            >
              ⏹ STOP SCAN
            </button>
            <button
              onClick={() => onExecuteCommand('PAUSE')}
              disabled={!isContinuous}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition cursor-pointer disabled:opacity-40"
            >
              ⏸ PAUSE SCAN
            </button>
            <button
              onClick={() => onExecuteCommand('RESUME')}
              disabled={!isPaused}
              className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold transition cursor-pointer disabled:opacity-40"
            >
              ⏯ RESUME SCAN
            </button>
            <button
              onClick={() => onExecuteCommand('SCAN_ALL')}
              disabled={isScanning}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition cursor-pointer disabled:opacity-40"
            >
              🔄 REFRESH MARKET DATA
            </button>
          </div>
        )}
      </div>

      {/* Voice Command Bar & Feedback */}
      {isModeOn && (
        <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleVoiceListening}
              className={`p-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
                isListeningVoice
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
              }`}
              title="Speak voice command (English or Urdu)"
            >
              {isListeningVoice ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              <span className="text-xs font-mono font-bold">
                {isListeningVoice ? 'Listening...' : 'Voice Command'}
              </span>
            </button>

            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Speak: "Scan All", "Best Long", "Best Short", "Best Opportunity", "Start Continuous", "Stop"
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <Volume2 className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-400">Voice Language:</span>
            <span className="font-bold text-cyan-300">
              {voiceLanguage === 'ur-PK' ? 'اردو (Urdu)' : voiceLanguage === 'hi-IN' ? 'हिन्दी (Hindi)' : 'English'}
            </span>
          </div>

          {voiceTranscript && (
            <div className="w-full text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg mt-1">
              🎙️ {voiceTranscript}
            </div>
          )}

          {voiceError && (
            <div className="w-full text-xs font-mono text-rose-300 bg-rose-950/40 border border-rose-500/30 px-3 py-1.5 rounded-lg mt-1">
              ⚠️ {voiceError}
            </div>
          )}
        </div>
      )}

      {/* 8 Command Buttons Grid */}
      {isModeOn && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="text-xs font-bold font-mono uppercase text-slate-400 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-cyan-400" />
              <span>COMMAND SYSTEM (TAP OR SPEAK)</span>
            </span>
            <span className="text-[10px] text-cyan-400">Single Exchange Exclusive</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. SCAN ALL PAIRS */}
            <button
              onClick={() => onExecuteCommand('SCAN_ALL')}
              disabled={isScanning}
              className="p-3 rounded-xl bg-slate-950/90 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-left transition cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono text-white group-hover:text-cyan-300">
                  SCAN ALL PAIRS
                </span>
                <Search className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Full market analysis
              </div>
            </button>

            {/* 2. FIND BEST LONG SIGNAL */}
            <button
              onClick={() => onExecuteCommand('FIND_BEST_LONG')}
              disabled={isScanning}
              className="p-3 rounded-xl bg-slate-950/90 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 text-left transition cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono text-emerald-400 group-hover:text-emerald-300">
                  BEST LONG SIGNAL
                </span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Top bullish breakout
              </div>
            </button>

            {/* 3. FIND BEST SHORT SIGNAL */}
            <button
              onClick={() => onExecuteCommand('FIND_BEST_SHORT')}
              disabled={isScanning}
              className="p-3 rounded-xl bg-slate-950/90 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-left transition cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono text-rose-400 group-hover:text-rose-300">
                  BEST SHORT SIGNAL
                </span>
                <TrendingDown className="h-4 w-4 text-rose-400" />
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Top bearish rejection
              </div>
            </button>

            {/* 4. FIND BEST TRADING OPPORTUNITY */}
            <button
              onClick={() => onExecuteCommand('FIND_BEST_OPPORTUNITY')}
              disabled={isScanning}
              className="p-3 rounded-xl bg-slate-950/90 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/50 text-left transition cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono text-amber-300 group-hover:text-amber-200">
                  BEST OPPORTUNITY
                </span>
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Highest confluence
              </div>
            </button>

            {/* 5. START CONTINUOUS AUTO SCANNING */}
            <button
              onClick={() => onExecuteCommand('START_CONTINUOUS')}
              disabled={isContinuous}
              className={`p-3 rounded-xl border text-left transition cursor-pointer group ${
                isContinuous
                  ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-md'
                  : 'bg-slate-950/90 hover:bg-purple-950/40 border-slate-800 hover:border-purple-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono text-purple-300 group-hover:text-purple-200">
                  CONTINUOUS SCAN
                </span>
                <RotateCcw className={`h-4 w-4 text-purple-400 ${isContinuous ? 'animate-spin' : ''}`} />
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Auto refresh cycle
              </div>
            </button>

            {/* 6. STOP AUTO SCANNING */}
            <button
              onClick={() => onExecuteCommand('STOP')}
              disabled={!isScanning && !isContinuous && !isPaused}
              className="p-3 rounded-xl bg-slate-950/90 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-left transition cursor-pointer group disabled:opacity-40"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono text-rose-400 group-hover:text-rose-300">
                  STOP SCANNING
                </span>
                <Square className="h-4 w-4 text-rose-400" />
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Halt all processes
              </div>
            </button>

            {/* 7. PAUSE SCANNING */}
            <button
              onClick={() => onExecuteCommand('PAUSE')}
              disabled={!isContinuous}
              className="p-3 rounded-xl bg-slate-950/90 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/50 text-left transition cursor-pointer group disabled:opacity-40"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono text-amber-300 group-hover:text-amber-200">
                  PAUSE SCANNING
                </span>
                <Pause className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Hold current cycle
              </div>
            </button>

            {/* 8. RESUME SCANNING */}
            <button
              onClick={() => onExecuteCommand('RESUME')}
              disabled={!isPaused}
              className="p-3 rounded-xl bg-slate-950/90 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-left transition cursor-pointer group disabled:opacity-40"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono text-cyan-300 group-hover:text-cyan-200">
                  RESUME SCANNING
                </span>
                <Play className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Continue scanning
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Live Scan Progress & Statistics Bar */}
      {isModeOn && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2 text-xs font-mono">
            <span className="text-slate-400">
              Scanning Progress: <strong className="text-white">{stats.pairsScanned}</strong> / {stats.totalTradablePairs || 30} pairs
            </span>
            <span className="text-cyan-300 font-bold">{stats.scanProgressPercent}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mb-3">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, stats.scanProgressPercent))}%` }}
            />
          </div>

          {/* 3 Metric Pills: Long, Short, Wait */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">LONG SIGNALS</div>
              <div className="text-base font-black text-emerald-300 mt-0.5">{stats.longSignalsCount}</div>
            </div>

            <div className="bg-rose-950/40 border border-rose-500/30 p-2 rounded-xl">
              <div className="text-[10px] text-rose-400 uppercase font-bold">SHORT SIGNALS</div>
              <div className="text-base font-black text-rose-300 mt-0.5">{stats.shortSignalsCount}</div>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 p-2 rounded-xl">
              <div className="text-[10px] text-amber-400 uppercase font-bold">WAIT / CHOP</div>
              <div className="text-base font-black text-amber-300 mt-0.5">{stats.waitCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Best Opportunity Showcase (Single Card with 27-Point preview) */}
      {isModeOn && stats.bestOpportunity && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs sm:text-sm font-bold font-mono text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="h-4 w-4" />
              <span>TOP OPPORTUNITY IDENTIFIED (27-POINT ANALYSIS)</span>
            </h2>
            <button
              onClick={() => setSelectedSignalDetail(stats.bestOpportunity)}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Open Full Modal
            </button>
          </div>

          <Signal27PointCard
            signal={stats.bestOpportunity}
            onTakeTrade={onTakeTrade}
            onShareWhatsApp={onShareWhatsApp}
          />
        </div>
      )}

      {/* Scanned Opportunities List with Filters */}
      {isModeOn && stats.scannedOpportunities.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs sm:text-sm font-bold font-mono uppercase text-white">
                Scanned Market Opportunities ({filteredSignals.length})
              </h3>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
              {(['ALL', 'LONG', 'SHORT', 'HIGH_SCORE'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setFilterDirection(dir)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer shrink-0 ${
                    filterDirection === dir
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pair (e.g. BTC, ETH, SOL)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Table / List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSignals.map((sig) => (
              <div
                key={sig.symbol}
                onClick={() => setSelectedSignalDetail(sig)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 transition cursor-pointer text-xs font-mono group"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    sig.direction === 'LONG' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                    sig.direction === 'SHORT' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' :
                    'bg-amber-950 text-amber-400 border border-amber-500/30'
                  }`}>
                    {sig.direction}
                  </span>
                  <div>
                    <div className="font-bold text-white group-hover:text-cyan-300">{sig.displayName}</div>
                    <div className="text-[10px] text-slate-400">Entry: ${formatCryptoPrice(sig.entryPrice)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-cyan-300">Score: {sig.setupScore}</div>
                    <div className="text-[10px] text-slate-500">Rec: {sig.recommendedLeverage}x</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTakeTrade(sig, sig.recommendedLeverage);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition"
                    title="Take Trade"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for 27-Point Signal Details */}
      {selectedSignalDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
          <div className="w-full max-h-[92vh] overflow-y-auto">
            <Signal27PointCard
              signal={selectedSignalDetail}
              onClose={() => setSelectedSignalDetail(null)}
              onTakeTrade={(sig, lev) => {
                onTakeTrade(sig, lev);
                setSelectedSignalDetail(null);
              }}
              onShareWhatsApp={onShareWhatsApp}
            />
          </div>
        </div>
      )}
    </div>
  );
};
