import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-3 right-3 z-50 flex items-center justify-center gap-2 rounded-xl bg-amber-500/90 backdrop-blur border border-amber-300 px-3 py-2 text-xs font-mono font-bold text-slate-950 shadow-xl animate-pulse">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Offline Mode — Cached market data active. Live WebSocket paused.</span>
    </div>
  );
};
