import React from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Volume2, 
  Bell, 
  BatteryCharging, 
  CheckCircle2, 
  XCircle, 
  Info, 
  X,
  Code
} from 'lucide-react';
import { playClickSound } from '../services/audio';

interface AndroidForegroundServiceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isWakeLockActive: boolean;
  isKeepAliveAudioActive: boolean;
  pushPermission: NotificationPermission;
  onRequestPush: () => void;
}

export const AndroidForegroundServiceGuideModal: React.FC<AndroidForegroundServiceGuideModalProps> = ({
  isOpen,
  onClose,
  isWakeLockActive,
  isKeepAliveAudioActive,
  pushPermission,
  onRequestPush,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl text-slate-100 font-mono space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                SCREEN-OFF BACKGROUND ALERTS & ANDROID SERVICE
              </h3>
              <p className="text-[10px] text-slate-400 font-sans">
                Keep voice signal alerts active when screen is locked
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Checklist */}
        <div className="space-y-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
          <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide block border-b border-slate-800/80 pb-1">
            ⚡ Web Engine Keep-Alive Status
          </span>

          <div className="flex items-center justify-between py-1 border-b border-slate-900">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Screen Wake Lock API</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isWakeLockActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {isWakeLockActive ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-900">
            <div className="flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>Web Audio Oscillator Stream</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isKeepAliveAudioActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {isKeepAliveAudioActive ? 'RUNNING (SUB-AUDIBLE)' : 'STOPPED'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-emerald-400" />
              <span>Mobile Push Notifications</span>
            </div>
            {pushPermission === 'granted' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                GRANTED
              </span>
            ) : (
              <button
                onClick={onRequestPush}
                className="px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
              >
                ALLOW PUSH
              </button>
            )}
          </div>
        </div>

        {/* Android Battery Optimization Advice */}
        <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl space-y-2 text-xs font-sans">
          <div className="flex items-center gap-2 text-amber-300 font-mono font-bold">
            <BatteryCharging className="h-4 w-4 shrink-0" />
            <span>Android Battery Saver Settings</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            To prevent Android OS from putting CyberPulse to sleep when screen turns off:
          </p>
          <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 pl-1">
            <li><strong className="text-white">Xiaomi / Redmi (MIUI):</strong> App Info → Autostart → <span className="text-emerald-400 font-bold">ENABLE</span> & Battery Saver → <span className="text-emerald-400 font-bold">No Restrictions</span>.</li>
            <li><strong className="text-white">Samsung Galaxy:</strong> App Info → Battery → <span className="text-emerald-400 font-bold">Unrestricted</span>.</li>
            <li><strong className="text-white">OnePlus / Oppo / Vivo:</strong> App Info → Battery Usage → <span className="text-emerald-400 font-bold">Allow Background Activity</span>.</li>
          </ul>
        </div>

        {/* Native Android Foreground Service Specification */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2 text-xs font-sans">
          <div className="flex items-center justify-between font-mono font-bold text-cyan-300">
            <div className="flex items-center gap-1.5">
              <Code className="h-4 w-4 text-cyan-400" />
              <span>Native Android APK Foreground Service</span>
            </div>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            For 100% uninterrupted 24/7 background scanning when compiled into a native Android APK or Capacitor app:
          </p>
          <div className="bg-slate-900 p-2 rounded-lg text-[10px] font-mono text-cyan-200 overflow-x-auto border border-slate-800">
            <code>
              {`// AndroidManifest.xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

// NotificationChannel & Service
val channel = NotificationChannel("cyberpulse_bg", "Trading Radar", NotificationManager.IMPORTANCE_HIGH)
val notification = NotificationCompat.Builder(this, "cyberpulse_bg")
    .setContentTitle("CyberPulse Radar Active")
    .setContentText("Continuous market signal voice scanner running")
    .setSmallIcon(R.drawable.ic_radar)
    .setOngoing(true)
    .build()
startForeground(1001, notification)`}
            </code>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
        >
          Got It, Continue Radar
        </button>
      </div>
    </div>
  );
};
