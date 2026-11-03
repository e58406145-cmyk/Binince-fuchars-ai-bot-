import React from 'react';
import { LayoutDashboard, History, Settings, Zap, Loader2, Wallet, Lock } from 'lucide-react';
import { playClickSound } from '../services/audio';

export type NavTab = 'dashboard' | 'autoscanner' | 'finance' | 'history' | 'settings' | 'pocketoption' | 'quotex' | 'compounding';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onGenerateSignal: () => void;
  isAnalyzing: boolean;
  isMarketClosed?: boolean;
  marketClosedReason?: string;
  isAutoModeOn?: boolean;
  isLocked?: boolean;
  lockReason?: string;
  lockCountdownText?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onGenerateSignal,
  isAnalyzing,
  isMarketClosed,
  marketClosedReason,
  isAutoModeOn,
  isLocked,
  lockReason,
  lockCountdownText,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-cyan-500/30 px-2 sm:px-4 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="relative max-w-lg mx-auto flex items-center justify-between">
        
        {/* Left Side: Dashboard & Auto Scanner (Mode B) */}
        <div className="flex items-center gap-2 sm:gap-5">
          <button
            onClick={() => {
              playClickSound();
              onTabChange('dashboard');
            }}
            className={`flex flex-col items-center gap-1 transition cursor-pointer p-1 ${
              activeTab === 'dashboard'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="h-4 sm:h-5 w-4 sm:w-5" />
            <span className="text-[9px] sm:text-[10px] tracking-tight">Manual</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              onTabChange('autoscanner');
            }}
            className={`flex flex-col items-center gap-1 transition cursor-pointer p-1 relative ${
              activeTab === 'autoscanner'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAutoModeOn && (
              <span className="absolute -top-0.5 right-1 h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            )}
            <Zap className={`h-4 sm:h-5 w-4 sm:w-5 ${isAutoModeOn ? 'text-cyan-300 fill-cyan-400' : ''}`} />
            <span className="text-[9px] sm:text-[10px] tracking-tight font-mono">Auto Scan</span>
          </button>
        </div>

        {/* Center: LARGE Raised Circular Button "Generate Signal" (Mode A Manual) */}
        <div className="relative -top-5 flex flex-col items-center px-1">
          {/* Animated Glowing Ring behind the button */}
          {!isAnalyzing && !isMarketClosed && !isLocked && (
            <div className="absolute inset-0 rounded-full bg-cyan-400/30 animate-pulse-ring pointer-events-none" />
          )}

          <button
            onClick={() => {
              if (isLocked) {
                alert(lockReason || 'Trading locked in cool-down');
                return;
              }
              if (isMarketClosed) return;
              playClickSound();
              onGenerateSignal();
            }}
            disabled={isAnalyzing || isMarketClosed || isLocked}
            className={`relative flex flex-col items-center justify-center w-14 sm:w-16 h-14 sm:h-16 rounded-full border-2 transition-all cursor-pointer ${
              isLocked
                ? 'bg-rose-950/90 text-rose-400 border-rose-500/80 shadow-lg glow-red cursor-not-allowed'
                : isMarketClosed
                ? 'bg-slate-800 text-slate-500 border-slate-700 opacity-60 cursor-not-allowed'
                : isAnalyzing
                ? 'bg-gradient-to-tr from-cyan-600 via-cyan-400 to-blue-500 text-slate-950 border-white shadow-xl glow-cyan opacity-90 cursor-not-allowed'
                : 'bg-gradient-to-tr from-cyan-600 via-cyan-400 to-blue-500 text-slate-950 border-white shadow-xl glow-cyan active:scale-95 hover:scale-105'
            }`}
            title={
              isLocked
                ? lockReason || 'Trading Locked'
                : isMarketClosed
                ? marketClosedReason || 'Market is closed'
                : 'Run Single Pair Calculation'
            }
          >
            {isLocked ? (
              <Lock className="h-6 sm:h-7 w-6 sm:w-7 text-rose-400" />
            ) : isAnalyzing ? (
              <Loader2 className="h-6 sm:h-7 w-6 sm:w-7 animate-spin text-slate-950" />
            ) : (
              <Zap className={`h-6 sm:h-7 w-6 sm:w-7 ${isMarketClosed ? 'text-slate-500' : 'text-slate-950 fill-slate-950'}`} />
            )}
          </button>

          <span className={`mt-0.5 sm:mt-1 text-[7px] sm:text-[8px] font-mono font-extrabold tracking-wider uppercase whitespace-nowrap ${
            isLocked ? 'text-rose-400 animate-pulse' : isMarketClosed ? 'text-rose-400' : 'text-cyan-300'
          }`}>
            {isLocked ? (lockCountdownText || 'LOCKED') : isMarketClosed ? 'CLOSED' : isAnalyzing ? 'ANALYZING...' : 'GENERATE'}
          </span>
        </div>

        {/* Right Side: Finance, History & Settings */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => {
              playClickSound();
              onTabChange('finance');
            }}
            className={`flex flex-col items-center gap-1 transition cursor-pointer p-1 ${
              activeTab === 'finance'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="h-4 sm:h-5 w-4 sm:w-5" />
            <span className="text-[9px] sm:text-[10px] tracking-tight">Finance</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              onTabChange('history');
            }}
            className={`flex flex-col items-center gap-1 transition cursor-pointer p-1 ${
              activeTab === 'history'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-4 sm:h-5 w-4 sm:w-5" />
            <span className="text-[9px] sm:text-[10px] tracking-tight">History</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              onTabChange('settings');
            }}
            className={`flex flex-col items-center gap-1 transition cursor-pointer p-1 ${
              activeTab === 'settings'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="h-4 sm:h-5 w-4 sm:w-5" />
            <span className="text-[9px] sm:text-[10px] tracking-tight">Settings</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

