import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Octagon, 
  Volume2, 
  VolumeX, 
  Bell, 
  BellOff, 
  Wifi, 
  WifiOff, 
  ShieldAlert, 
  Activity, 
  Lock, 
  Unlock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Smartphone
} from 'lucide-react';
import { ExchangeId, Timeframe, AutoScannerStats } from '../types/crypto';
import { playClickSound } from '../services/audio';
import { 
  speakMessage, 
  announceScannerStateChange, 
  announceEmergencyStop, 
  setVoiceEnabled,
  cancelOngoingSpeech 
} from '../services/voice';
import { sendWebNotification } from '../services/backgroundReliability';

interface MasterControlHeaderCardProps {
  activeExchange: ExchangeId;
  timeframe: Timeframe;
  scannerStats: AutoScannerStats;
  voiceEnabled: boolean;
  onToggleVoice: (enabled: boolean) => void;
  onStartScanner: () => void;
  onStopScanner: () => void;
  onEmergencyStop: () => void;
  apiConnected: boolean;
  isLiveModeSelected: boolean;
  onToggleLiveMode: (live: boolean) => void;
  onOpenAndroidGuide?: () => void;
}

export const MasterControlHeaderCard: React.FC<MasterControlHeaderCardProps> = ({
  activeExchange,
  timeframe,
  scannerStats,
  voiceEnabled,
  onToggleVoice,
  onStartScanner,
  onStopScanner,
  onEmergencyStop,
  apiConnected,
  isLiveModeSelected,
  onToggleLiveMode,
  onOpenAndroidGuide,
}) => {
  const [showConfirmEmergency, setShowConfirmEmergency] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const isScannerRunning = scannerStats.status === 'SCANNING' || scannerStats.status === 'CONTINUOUS';
  const isEmergencyActive = scannerStats.status === 'OFF' && scannerStats.lastScanTime === -1;

  // Request Push Notification Permission
  const handleRequestPushPermission = async () => {
    playClickSound();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        sendWebNotification('CyberPulse Mobile Notifications Active', {
          body: 'You will receive real-time signal, TP/SL, and risk alerts even when the app is in the background.',
        });
      }
    }
  };

  const handleStart = () => {
    playClickSound();
    onStartScanner();
    announceScannerStateChange('STARTED');
    if (pushPermission === 'granted') {
      sendWebNotification('Auto Scanner Started', {
        body: `Scanning ${activeExchange.toUpperCase()} Futures on ${timeframe} timeframe for high-probability signals.`,
      });
    }
  };

  const handleStop = () => {
    playClickSound();
    cancelOngoingSpeech();
    onStopScanner();
    announceScannerStateChange('STOPPED');
    if (pushPermission === 'granted') {
      sendWebNotification('Auto Scanner Stopped', {
        body: 'Automatic signal scanning has been paused. Historical signals preserved.',
      });
    }
  };

  const handleEmergencyClick = () => {
    playClickSound();
    if (!showConfirmEmergency) {
      setShowConfirmEmergency(true);
    } else {
      onEmergencyStop();
      announceEmergencyStop();
      setShowConfirmEmergency(false);
      if (pushPermission === 'granted') {
        sendWebNotification('🚨 EMERGENCY STOP ACTIVATED', {
          body: 'All automatic trading & signal scanning activities have been immediately disabled. Manual confirmation required to restart.',
        });
      }
    }
  };

  return (
    <div className="w-full rounded-2xl bg-slate-900/90 border-2 border-cyan-500/40 p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl font-mono text-slate-100 space-y-3">
      {/* Row 1: Title & Key Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <span className="font-extrabold text-xs text-white uppercase tracking-wide">
            MASTER COMMAND CONTROL
          </span>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Scanner Status */}
          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
            isScannerRunning
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 glow-green'
              : scannerStats.status === 'PAUSED'
              ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
              : 'bg-rose-950 text-rose-300 border border-rose-500/50'
          }`}>
            SCANNER: {isScannerRunning ? 'RUNNING' : scannerStats.status === 'PAUSED' ? 'PAUSED' : 'STOPPED'}
          </span>

          {/* API Status */}
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
            apiConnected
              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
              : 'bg-slate-950 text-slate-400 border-slate-800'
          }`}>
            {apiConnected ? 'API CONNECTED' : 'API: NOT CONNECTED (SIGNAL ONLY)'}
          </span>
        </div>
      </div>

      {/* Row 2: Master Control Buttons (START, STOP, EMERGENCY STOP) */}
      <div className="grid grid-cols-3 gap-2">
        {/* START BUTTON */}
        <button
          onClick={handleStart}
          disabled={isScannerRunning}
          className={`py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer ${
            isScannerRunning
              ? 'bg-emerald-950/60 text-emerald-500 border border-emerald-800 opacity-60 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 glow-green active:scale-95'
          }`}
        >
          <Play className="h-4 w-4 fill-current shrink-0" />
          <span>START</span>
        </button>

        {/* STOP BUTTON */}
        <button
          onClick={handleStop}
          disabled={!isScannerRunning && scannerStats.status !== 'PAUSED'}
          className={`py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer ${
            !isScannerRunning && scannerStats.status !== 'PAUSED'
              ? 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 glow-amber active:scale-95'
          }`}
        >
          <Square className="h-4 w-4 fill-current shrink-0" />
          <span>STOP</span>
        </button>

        {/* EMERGENCY STOP BUTTON */}
        <button
          onClick={handleEmergencyClick}
          className={`py-2.5 px-3 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1 cursor-pointer ${
            showConfirmEmergency
              ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/50'
              : 'bg-rose-950/90 border-2 border-rose-500/80 text-rose-300 hover:bg-rose-900 glow-red'
          }`}
        >
          <Octagon className="h-4 w-4 fill-current shrink-0" />
          <span>{showConfirmEmergency ? 'CONFIRM STOP' : 'EMERGENCY STOP'}</span>
        </button>
      </div>

      {showConfirmEmergency && (
        <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs flex items-center justify-between font-sans">
          <span>🚨 Press again to halt all signal generation & disable automatic restart.</span>
          <button
            onClick={() => setShowConfirmEmergency(false)}
            className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Row 3: Quick Toggles (Voice Alert, Push Notifications, Live Mode) */}
      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-1 border-t border-slate-800">
        {/* Voice Alert Toggle */}
        <button
          onClick={() => {
            playClickSound();
            onToggleVoice(!voiceEnabled);
          }}
          className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
            voiceEnabled
              ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}
        >
          {voiceEnabled ? <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> : <VolumeX className="h-3.5 w-3.5" />}
          <span>VOICE: {voiceEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Push Notification Button */}
        <button
          onClick={handleRequestPushPermission}
          className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
            pushPermission === 'granted'
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <Bell className="h-3.5 w-3.5 text-emerald-400" />
          <span>PUSH: {pushPermission === 'granted' ? 'ENABLED' : 'ENABLE'}</span>
        </button>

        {/* Live Trading Mode Button */}
        <button
          onClick={() => {
            playClickSound();
            if (!apiConnected && !isLiveModeSelected) {
              alert('API Keys Not Connected!\nApp is operating in Signal-Only Demo Mode. Connect Binance or Bitget API keys in Settings to unlock live monitoring.');
            }
            onToggleLiveMode(!isLiveModeSelected);
          }}
          className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
            isLiveModeSelected
              ? 'bg-amber-950/80 border-amber-500 text-amber-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          {isLiveModeSelected ? <Unlock className="h-3.5 w-3.5 text-amber-400" /> : <Lock className="h-3.5 w-3.5" />}
          <span>{isLiveModeSelected ? 'LIVE: ON' : 'SIGNAL ONLY'}</span>
        </button>
      </div>

      {/* Row 4: Background Screen-Off Status & Android Guide Link */}
      <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-800/80">
        <button
          onClick={() => {
            playClickSound();
            if (onOpenAndroidGuide) onOpenAndroidGuide();
          }}
          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold underline transition cursor-pointer"
        >
          <Smartphone className="h-3 w-3" />
          <span>Screen-Off Background & Android Service Guide →</span>
        </button>
        <span className="text-[9px] text-slate-500">
          Suggestions Only • No Auto Execution
        </span>
      </div>
    </div>
  );
};
