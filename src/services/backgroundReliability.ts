/**
 * Background Reliability Service:
 * - Screen Wake Lock API during active trades
 * - Keep-alive audio oscillator to prevent mobile sleep/throttling
 * - Media Session API for lockscreen persistence
 * - Web Notifications for pre-trade, alarms, milestones, and results
 */

let wakeLockSentinel: any = null;
let keepAliveOscillator: OscillatorNode | null = null;
let keepAliveGain: GainNode | null = null;
let keepAliveCtx: AudioContext | null = null;

/**
 * Requests Notification permission on user interaction
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    if (Notification.permission === 'granted') {
      return true;
    }
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch {
    return false;
  }
}

/**
 * Dispatches a rich Web Notification with vibration
 */
export function sendWebNotification(title: string, options: { body: string; icon?: string; tag?: string }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const n = new Notification(title, {
      body: options.body,
      icon: options.icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: options.tag || 'cyberpulse-trade-alert',
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch (err) {
    // Fallback if ServiceWorkerRegistration is required on some mobile browsers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body: options.body,
          icon: options.icon || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: options.tag || 'cyberpulse-trade-alert',
        });
      }).catch(() => {});
    }
  }
}

/**
 * Requests Screen Wake Lock during active trading
 */
export async function acquireWakeLock() {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
  try {
    if (!wakeLockSentinel) {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    }
  } catch {
    // wake lock request may be denied if tab is inactive or battery saver is active
  }
}

/**
 * Releases Screen Wake Lock
 */
export async function releaseWakeLock() {
  try {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  } catch {
    // ignore
  }
}

/**
 * Starts an inaudible keep-alive Web Audio stream (0.0001 gain)
 * Keeps the browser audio engine active in the background on iOS/Android
 */
export function startKeepAliveAudio() {
  if (keepAliveOscillator) return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!keepAliveCtx) {
      keepAliveCtx = new AudioContextClass();
    }
    if (keepAliveCtx.state === 'suspended') {
      keepAliveCtx.resume();
    }

    keepAliveOscillator = keepAliveCtx.createOscillator();
    keepAliveGain = keepAliveCtx.createGain();

    // 20Hz sub-audible frequency with near-zero amplitude
    keepAliveOscillator.type = 'sine';
    keepAliveOscillator.frequency.value = 20;
    keepAliveGain.gain.value = 0.00001;

    keepAliveOscillator.connect(keepAliveGain);
    keepAliveGain.connect(keepAliveCtx.destination);

    keepAliveOscillator.start();
  } catch {
    // ignore
  }
}

/**
 * Stops keep-alive audio stream
 */
export function stopKeepAliveAudio() {
  try {
    if (keepAliveOscillator) {
      keepAliveOscillator.stop();
      keepAliveOscillator.disconnect();
      keepAliveOscillator = null;
    }
    if (keepAliveGain) {
      keepAliveGain.disconnect();
      keepAliveGain = null;
    }
  } catch {
    // ignore
  }
}

/**
 * Updates Media Session API metadata for lockscreen visibility
 */
export function updateMediaSessionState(activeTradesCount: number, topTradeLabel?: string) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

  try {
    if (activeTradesCount > 0) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: topTradeLabel || 'CyberPulse Live Trade Active',
        artist: `${activeTradesCount} Active Trade${activeTradesCount > 1 ? 's' : ''} Monitored`,
        album: 'CyberPulse Futures Protocol',
        artwork: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      });
      navigator.mediaSession.playbackState = 'playing';
    } else {
      navigator.mediaSession.playbackState = 'none';
    }
  } catch {
    // ignore
  }
}
