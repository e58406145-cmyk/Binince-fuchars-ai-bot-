/**
 * Voice Announcement & Haptic Vibration Engine
 * Features:
 * - Non-overlapping FIFO speech queue
 * - English (en-US) & Hindi (hi-IN) localization
 * - Volume control & vibration control
 * - Pre-trade warnings, live trade milestones, and P/L result announcements
 */

import { VoiceLanguage } from '../types/crypto';

let speechEnabled = true;
let currentLanguage: VoiceLanguage = 'en-US';
let currentVolume = 0.95; // 0.0 to 1.0
let vibrationEnabled = true;

// FIFO Speech Queue to prevent overlapping voice announcements
interface SpeechQueueItem {
  text: string;
  lang: VoiceLanguage;
}

const speechQueue: SpeechQueueItem[] = [];
let isSpeaking = false;

export function configureVoiceSettings(options: {
  enabled?: boolean;
  language?: VoiceLanguage;
  volume?: number;
  vibration?: boolean;
}) {
  if (options.enabled !== undefined) speechEnabled = options.enabled;
  if (options.language !== undefined) currentLanguage = options.language;
  if (options.volume !== undefined) currentVolume = Math.max(0, Math.min(1, options.volume));
  if (options.vibration !== undefined) vibrationEnabled = options.vibration;
}

export function setVoiceEnabled(enabled: boolean) {
  speechEnabled = enabled;
}

export function setVoiceLanguage(lang: VoiceLanguage) {
  currentLanguage = lang;
}

export function setVoiceVolume(vol: number) {
  currentVolume = Math.max(0, Math.min(1, vol));
}

export function setVibrationEnabled(enabled: boolean) {
  vibrationEnabled = enabled;
}

export function triggerHapticVibration(pattern: number[] = [200, 100, 200]) {
  if (!vibrationEnabled) return;
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
}

function processSpeechQueue() {
  if (isSpeaking || speechQueue.length === 0) return;
  if (!speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    speechQueue.length = 0; // clear queue if disabled
    return;
  }

  const item = speechQueue.shift();
  if (!item) return;

  isSpeaking = true;

  try {
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.lang = item.lang;
    utterance.volume = currentVolume;
    utterance.rate = item.lang === 'hi-IN' ? 1.0 : 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (item.lang === 'hi-IN') {
      const hiVoice = voices.find((v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('lekha'));
      if (hiVoice) utterance.voice = hiVoice;
    } else {
      const enVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onend = () => {
      isSpeaking = false;
      setTimeout(processSpeechQueue, 80);
    };

    utterance.onerror = () => {
      isSpeaking = false;
      setTimeout(processSpeechQueue, 80);
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    isSpeaking = false;
    setTimeout(processSpeechQueue, 80);
  }
}

/**
 * Enqueues a message for sequential, non-overlapping speech delivery
 */
export function speakMessage(text: string, lang: VoiceLanguage = currentLanguage) {
  if (!speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  speechQueue.push({ text, lang });
  processSpeechQueue();
}

/**
 * Clears speech queue immediately (e.g. for urgent alarms)
 */
export function cancelOngoingSpeech() {
  speechQueue.length = 0;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
}

/**
 * Pre-trade 15-second warning announcement
 */
export function announcePreTradeWarning(seconds: number, pair: string, direction: 'LONG' | 'SHORT') {
  const cleanPair = pair.replace('/', ' ');
  const text = currentLanguage === 'hi-IN'
    ? `${seconds} second mein apna trade lagayein: ${cleanPair}, ${direction === 'LONG' ? 'LONG' : 'SHORT'}`
    : `Place your trade in ${seconds} seconds: ${cleanPair}, ${direction}`;

  speakMessage(text);
  triggerHapticVibration([150, 100, 150]);
}

/**
 * Trade Start announcement when countdown reaches 1
 */
export function announceTradeStart(pair: string, direction: string) {
  const cleanPair = pair.replace('/', ' ');
  const text = currentLanguage === 'hi-IN'
    ? `Trade shuru! ${cleanPair} ${direction}`
    : `Trade start! ${cleanPair} ${direction}`;

  speakMessage(text);
  triggerHapticVibration([400, 100, 400]);
}

/**
 * Scanner completion announcement
 */
export function announceScanComplete(topPair: string, direction: string, entryPrice: number) {
  const cleanPair = topPair.replace('/', ' ');
  const formattedPrice = entryPrice > 10 ? entryPrice.toFixed(2) : entryPrice.toFixed(4);

  const text = currentLanguage === 'hi-IN'
    ? `Scan poora hua. Top pair: ${cleanPair}, ${direction === 'LONG' ? 'LONG' : 'SHORT'}, entry ${formattedPrice}`
    : `Scan complete. Top pair: ${cleanPair}, ${direction}, entry ${formattedPrice}`;

  speakMessage(text);
  triggerHapticVibration([150, 80, 150]);
}

/**
 * Milestone announcements (50%, 5min, expiry, 10-second countdown)
 */
export function announceTradeMilestone(
  type: '50_PERCENT' | '5_MIN_LEFT' | 'EXPIRY' | 'ENTRY_EXPIRED',
  pair: string,
  timeRemainingText?: string
) {
  const cleanPair = pair.replace('/', ' ');
  let text = '';

  if (type === '50_PERCENT') {
    text = currentLanguage === 'ur-PK'
      ? `${cleanPair} ka adha waqt guzar gaya, ${timeRemainingText || ''} baqi hai`
      : currentLanguage === 'hi-IN'
      ? `${cleanPair} ke liye aadha samay bita, ${timeRemainingText || ''} bacha hai`
      : `Halfway mark reached for ${cleanPair}, ${timeRemainingText || ''} remaining`;
    triggerHapticVibration([200, 100, 200]);
  } else if (type === '5_MIN_LEFT') {
    text = currentLanguage === 'ur-PK'
      ? `${cleanPair} ke 5 minute baqi hain`
      : currentLanguage === 'hi-IN'
      ? `${cleanPair} ke liye paanch minute bache hain`
      : `5 minutes left for ${cleanPair}`;
    triggerHapticVibration([250, 100, 250]);
  } else if (type === 'EXPIRY') {
    text = currentLanguage === 'ur-PK'
      ? `${cleanPair} ka waqt khatam ho gaya hai, trade close ya review karein`
      : currentLanguage === 'hi-IN'
      ? `${cleanPair} ka samay samapt ho gaya hai, apna trade review ya band karein`
      : `Time is up for ${cleanPair}, review or close your trade`;
    triggerHapticVibration([400, 150, 400]);
  } else if (type === 'ENTRY_EXPIRED') {
    text = currentLanguage === 'ur-PK'
      ? `${cleanPair} entry zone tak nahi pohncha, signal expire ho gaya`
      : currentLanguage === 'hi-IN'
      ? `${cleanPair} ke liye entry zone samay se pehle nahi pahuncha, signal samapt`
      : `Time expired for ${cleanPair} before entry zone reached`;
    triggerHapticVibration([300, 100, 300]);
  }

  if (text) speakMessage(text);
}

/**
 * Single number spoken for final 10-second countdown
 */
export function announceCountdownDigit(digit: number) {
  speakMessage(digit.toString());
  triggerHapticVibration([80]);
}

/**
 * Final result announcement (Win / Loss / Draw)
 */
export function announceTradeResult(result: 'WIN' | 'LOSS' | 'DRAW', pnlPercent: number) {
  const absPnl = Math.abs(pnlPercent).toFixed(2);
  let text = '';

  if (result === 'WIN') {
    text = currentLanguage === 'ur-PK'
      ? `Aap ka faida, plus ${absPnl} percent`
      : currentLanguage === 'hi-IN'
      ? `Aapki jeet abhi, plus ${absPnl} percent`
      : `Your win now, plus ${absPnl} percent`;
    triggerHapticVibration([300, 100, 300, 100, 300]);
  } else if (result === 'LOSS') {
    text = currentLanguage === 'ur-PK'
      ? `Aap ka nuksan, minus ${absPnl} percent`
      : currentLanguage === 'hi-IN'
      ? `Aapka nuksan abhi, minus ${absPnl} percent`
      : `Your loss now, minus ${absPnl} percent`;
    triggerHapticVibration([500, 150, 500]);
  } else {
    text = currentLanguage === 'ur-PK' || currentLanguage === 'hi-IN'
      ? `Barabari, zero percent`
      : `Draw, zero percent`;
    triggerHapticVibration([200, 100, 200]);
  }

  speakMessage(text);
}

/**
 * Price level touch announcement
 */
export function announcePriceAlert(type: 'entry' | 'tp1' | 'tp2' | 'sl', pair: string, price: number) {
  const cleanPair = pair.replace('/', ' ');
  const formattedPrice = price > 10 ? price.toFixed(2) : price.toFixed(4);
  let text = '';

  if (type === 'entry') {
    text = currentLanguage === 'ur-PK'
      ? `${cleanPair} ka entry zone pohnch gaya, qeemat ${formattedPrice}`
      : currentLanguage === 'hi-IN'
      ? `${cleanPair} ke liye entry zone pahunch gaya, bhav ${formattedPrice}`
      : `Entry zone reached for ${cleanPair} at ${formattedPrice}`;
    triggerHapticVibration([250, 100, 250]);
  } else if (type === 'tp1') {
    text = currentLanguage === 'ur-PK'
      ? `${cleanPair} take profit one hit ho gaya, qeemat ${formattedPrice}`
      : currentLanguage === 'hi-IN'
      ? `${cleanPair} ke liye take profit one pahunch gaya, bhav ${formattedPrice}`
      : `Take profit one reached for ${cleanPair} at ${formattedPrice}`;
    triggerHapticVibration([300, 100, 300]);
  } else if (type === 'tp2') {
    text = currentLanguage === 'ur-PK'
      ? `${cleanPair} take profit two hit ho gaya, qeemat ${formattedPrice}`
      : currentLanguage === 'hi-IN'
      ? `${cleanPair} ke liye take profit two pahunch gaya, bhav ${formattedPrice}`
      : `Take profit two reached for ${cleanPair} at ${formattedPrice}`;
    triggerHapticVibration([400, 100, 400]);
  } else if (type === 'sl') {
    text = currentLanguage === 'ur-PK'
      ? `Khabardar: ${cleanPair} stop loss trigger ho gaya, qeemat ${formattedPrice}`
      : currentLanguage === 'hi-IN'
      ? `Savdhan: ${cleanPair} ka stop loss trigger hua, bhav ${formattedPrice}`
      : `Warning: Stop loss triggered for ${cleanPair} at ${formattedPrice}`;
    triggerHapticVibration([500, 150, 500]);
  }

  if (text) speakMessage(text);
}

// =======================================================
// AUTO SCANNER VOICE ANNOUNCEMENTS (ENGLISH & URDU/HINDI)
// =======================================================

export function announceBestOpportunity(
  pair: string, 
  direction: 'LONG' | 'SHORT', 
  entryPrice: number, 
  score: number,
  leverage = 5,
  timeframe = '15m'
) {
  const cleanPair = pair.replace('/', ' ');
  const tfText = timeframe.endsWith('m') ? `${timeframe.replace('m', '')} minutes` : timeframe.endsWith('h') ? `${timeframe.replace('h', '')} hour` : timeframe;

  const text = currentLanguage === 'ur-PK'
    ? `Behtareen trading mauqa mil gaya hai: ${cleanPair}. ${direction} signal. Recommended leverage ${leverage}x. Timeframe ${tfText}.`
    : currentLanguage === 'hi-IN'
    ? `Behtareen trading mauqa mil gaya hai: ${cleanPair}. ${direction} signal. Recommended leverage ${leverage}x. Timeframe ${tfText}.`
    : `Best trading opportunity detected. ${cleanPair}. ${direction} signal. Recommended leverage ${leverage}x. Timeframe ${tfText}.`;

  speakMessage(text);
  triggerHapticVibration([200, 100, 200, 100, 250]);
}

export function announceBestDirectionalSignal(direction: 'LONG' | 'SHORT', pair: string, entryPrice: number, leverage = 3) {
  const cleanPair = pair.replace('/', ' ');

  const text = currentLanguage === 'ur-PK'
    ? `Behtareen ${direction === 'LONG' ? 'Long' : 'Short'} signal mil gaya hai: ${cleanPair}. ${direction} signal. Recommended leverage ${leverage}x.`
    : currentLanguage === 'hi-IN'
    ? `Behtareen ${direction === 'LONG' ? 'Long' : 'Short'} signal mil gaya hai: ${cleanPair}. ${direction} signal. Recommended leverage ${leverage}x.`
    : `Best trading opportunity detected. ${cleanPair}. ${direction} signal. Recommended leverage ${leverage}x.`;

  speakMessage(text);
  triggerHapticVibration([150, 100, 150]);
}

export function announceNoOpportunityFound() {
  const text = currentLanguage === 'ur-PK'
    ? 'Koi behtareen trading mauqa nahi mila. Barah-e-karam intezar karein.'
    : currentLanguage === 'hi-IN'
    ? 'Koi behtareen trading mauqa nahi mila. Kripya intezar karein.'
    : 'No high-quality trading opportunity found. Please wait.';

  speakMessage(text);
}

export function announceCommandReady() {
  const text = currentLanguage === 'ur-PK'
    ? 'Auto generate mode active. Command ready hai, hukum dein.'
    : currentLanguage === 'hi-IN'
    ? 'Auto generate mode chalu. Command ready hai, batayein.'
    : 'Auto generate mode active. Command ready, awaiting instructions.';

  speakMessage(text);
  triggerHapticVibration([100, 50, 100]);
}

export function announceScannerStateChange(status: 'STARTED' | 'STOPPED' | 'PAUSED' | 'RESUMED' | 'CONTINUOUS') {
  let text = '';
  if (status === 'STARTED' || status === 'CONTINUOUS') {
    text = currentLanguage === 'ur-PK'
      ? 'Market auto scanning shuru ho gayi hai'
      : currentLanguage === 'hi-IN'
      ? 'Market auto scanning shuru ho gayi hai'
      : 'Market auto scanning started';
  } else if (status === 'STOPPED') {
    text = currentLanguage === 'ur-PK'
      ? 'Auto scanning rok di gayi hai'
      : currentLanguage === 'hi-IN'
      ? 'Auto scanning band kar di gayi hai'
      : 'Auto scanning stopped';
  } else if (status === 'PAUSED') {
    text = currentLanguage === 'ur-PK'
      ? 'Scanning waqti tor par roki gayi hai'
      : currentLanguage === 'hi-IN'
      ? 'Scanning thodi der ke liye pause ki gayi hai'
      : 'Scanning paused';
  } else if (status === 'RESUMED') {
    text = currentLanguage === 'ur-PK'
      ? 'Scanning dobara shuru kar di gayi hai'
      : currentLanguage === 'hi-IN'
      ? 'Scanning phir se chalu kar di gayi hai'
      : 'Scanning resumed';
  }

  if (text) speakMessage(text);
}

export function announceNewSignalAlert(pair: string, direction: 'LONG' | 'SHORT') {
  const cleanPair = pair.replace('/', ' ');
  const text = currentLanguage === 'ur-PK'
    ? `Naya signal aya hai: ${cleanPair}, ${direction}`
    : currentLanguage === 'hi-IN'
    ? `Naya signal aya hai: ${cleanPair}, ${direction}`
    : `${cleanPair}, ${direction === 'LONG' ? 'BUY' : 'SELL'} signal detected.`;

  speakMessage(text);
  triggerHapticVibration([300, 100, 300]);
}

export function announceMultiExchangeSignal(
  exchangeName: string,
  marketType: 'Spot' | 'Futures',
  direction: 'BUY' | 'SELL' | 'LONG' | 'SHORT',
  pair: string
) {
  const cleanPair = pair.replace('/', ' ').replace('-USDT', ' USDT');
  const text = currentLanguage === 'ur-PK' || currentLanguage === 'hi-IN'
    ? `Naya ${exchangeName} ${marketType} ${direction} signal: ${cleanPair}`
    : `New ${exchangeName} ${marketType} ${direction} signal for ${cleanPair}`;

  speakMessage(text);
  triggerHapticVibration([300, 100, 300, 100, 300]);
}

export function announceConfirmedSignal(
  pair: string,
  direction: 'LONG' | 'SHORT',
  timeframe = '15m',
  confidence = 85
) {
  const cleanPair = pair.replace('/', ' ').replace('-USDT', ' USDT');
  const tfText = timeframe.endsWith('m') ? `${timeframe.replace('m', '')} minute` : timeframe.endsWith('h') ? `${timeframe.replace('h', '')} hour` : timeframe;

  const text = currentLanguage === 'ur-PK'
    ? `Naya confirmed signal: ${cleanPair}, ${direction === 'LONG' ? 'LONG' : 'SHORT'}, timeframe ${tfText}, confidence ${confidence} percent.`
    : currentLanguage === 'hi-IN'
    ? `Naya confirmed signal: ${cleanPair}, ${direction === 'LONG' ? 'LONG' : 'SHORT'}, timeframe ${tfText}, confidence ${confidence} percent.`
    : `Attention! New confirmed ${direction} signal detected for ${cleanPair} on ${tfText} timeframe. Confidence ${confidence} percent.`;

  speakMessage(text);
  triggerHapticVibration([300, 100, 300, 100, 300]);
}

export function announceBuyingPressure(pair: string, buyerPct: number) {
  const cleanPair = pair.replace('/', ' ');
  const text = currentLanguage === 'ur-PK'
    ? `Shaddid khareedari ka dabao: ${cleanPair}, ${buyerPct} percent buyer pressure.`
    : currentLanguage === 'hi-IN'
    ? `Bhari kharedari ka dabav: ${cleanPair}, ${buyerPct} percent buyer pressure.`
    : `Strong buying pressure detected on ${cleanPair}, ${buyerPct} percent.`;

  speakMessage(text);
  triggerHapticVibration([200, 100, 200]);
}

export function announceSellingPressure(pair: string, sellerPct: number) {
  const cleanPair = pair.replace('/', ' ');
  const text = currentLanguage === 'ur-PK'
    ? `Shaddid bikwali ka dabao: ${cleanPair}, ${sellerPct} percent seller pressure.`
    : currentLanguage === 'hi-IN'
    ? `Bhari bikwali ka dabav: ${cleanPair}, ${sellerPct} percent seller pressure.`
    : `Strong selling pressure detected on ${cleanPair}, ${sellerPct} percent.`;

  speakMessage(text);
  triggerHapticVibration([200, 100, 200]);
}

export function announceEmergencyStop() {
  const text = currentLanguage === 'ur-PK'
    ? 'Emergency stop active. Tamam automatic trading band kar di gayi hai.'
    : currentLanguage === 'hi-IN'
    ? 'Emergency stop active. Sabhi automatic trading band kar di gayi hai.'
    : 'Emergency stop activated. Automatic trading has been stopped.';

  speakMessage(text);
  triggerHapticVibration([500, 150, 500, 150, 500]);
}

export function announceApiFailure(exchange: string, message?: string) {
  const text = currentLanguage === 'ur-PK'
    ? `${exchange} API connection fail ho gaya hai. Check karein.`
    : currentLanguage === 'hi-IN'
    ? `${exchange} API connection fail ho gaya hai. Check karein.`
    : `${exchange} API connection failed. Running in signal only mode.`;

  speakMessage(text);
  triggerHapticVibration([400, 100, 400]);
}

// =======================================================
// SPEECH RECOGNITION (VOICE COMMAND SYSTEM)
// =======================================================

export type VoiceCommandHandler = (
  command:
    | 'SCAN_ALL'
    | 'FIND_BEST_LONG'
    | 'FIND_BEST_SHORT'
    | 'FIND_BEST_OPPORTUNITY'
    | 'START_CONTINUOUS'
    | 'STOP'
    | 'PAUSE'
    | 'RESUME',
  transcript: string
) => void;

export function listenToVoiceCommand(
  onCommand: VoiceCommandHandler,
  onError?: (err: string) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (onError) onError('Speech recognition is not supported in this browser.');
    return () => {};
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = currentLanguage === 'ur-PK' ? 'ur-PK' : currentLanguage === 'hi-IN' ? 'hi-IN' : 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = (event.results[0]?.[0]?.transcript || '').trim().toLowerCase();
      
      // Match voice commands
      if (
        transcript.includes('scan all') ||
        transcript.includes('tamam pair') ||
        transcript.includes('sare pair') ||
        transcript.includes('sab pairs')
      ) {
        onCommand('SCAN_ALL', transcript);
      } else if (
        transcript.includes('best long') ||
        transcript.includes('find best long') ||
        transcript.includes('accha long') ||
        transcript.includes('behtareen long')
      ) {
        onCommand('FIND_BEST_LONG', transcript);
      } else if (
        transcript.includes('best short') ||
        transcript.includes('find best short') ||
        transcript.includes('accha short') ||
        transcript.includes('behtareen short')
      ) {
        onCommand('FIND_BEST_SHORT', transcript);
      } else if (
        transcript.includes('best opportunity') ||
        transcript.includes('find best') ||
        transcript.includes('trading opportunity') ||
        transcript.includes('mauqa') ||
        transcript.includes('opportunity')
      ) {
        onCommand('FIND_BEST_OPPORTUNITY', transcript);
      } else if (
        transcript.includes('start continuous') ||
        transcript.includes('start auto') ||
        transcript.includes('start scanning') ||
        transcript.includes('shuru karo') ||
        transcript.includes('start')
      ) {
        onCommand('START_CONTINUOUS', transcript);
      } else if (
        transcript.includes('stop auto') ||
        transcript.includes('stop scanning') ||
        transcript.includes('rok do') ||
        transcript.includes('stop')
      ) {
        onCommand('STOP', transcript);
      } else if (
        transcript.includes('pause') ||
        transcript.includes('ruk jao')
      ) {
        onCommand('PAUSE', transcript);
      } else if (
        transcript.includes('resume') ||
        transcript.includes('phir se') ||
        transcript.includes('dobara')
      ) {
        onCommand('RESUME', transcript);
      } else {
        if (onError) onError(`Command not recognized: "${transcript}"`);
      }
    };

    recognition.onerror = (e: any) => {
      if (onError && e.error !== 'no-speech') onError(e.error || 'Speech error');
    };

    recognition.start();

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  } catch (err: any) {
    if (onError) onError(err?.message || 'Speech recognition initialization failed');
    return () => {};
  }
}
