/**
 * Web Audio API synthesizer for futuristic sci-fi sound effects
 * Zero external audio files required, 100% offline compliant
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;

export function initAudio(): boolean {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return true;
  } catch (err) {
    console.warn('AudioContext not supported or blocked:', err);
    return false;
  }
}

export function setSoundMuted(muted: boolean) {
  isMuted = muted;
}

export function playClickSound() {
  if (isMuted || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // ignore audio glitches
  }
}

export function playRadarPing() {
  if (isMuted || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch {
    // ignore
  }
}

export function playLongSignalSound() {
  if (isMuted || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    
    // Multi-frequency harmonic rising chord: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [
      { freq: 523.25, time: 0 },
      { freq: 659.25, time: 0.08 },
      { freq: 783.99, time: 0.16 },
      { freq: 1046.50, time: 0.24 },
    ];

    notes.forEach(({ freq, time }) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      // Lowpass filter for smooth analog warmth
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now + time);
      filter.frequency.exponentialRampToValueAtTime(4500, now + time + 0.35);

      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.12, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + 0.55);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + time);
      osc.stop(now + time + 0.6);
    });
  } catch {
    // ignore
  }
}

export function playShortSignalSound() {
  if (isMuted || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    // Descending warning alarm chord: 620Hz -> 440Hz -> 220Hz
    const steps = [
      { freq: 622.25, time: 0 },
      { freq: 440.00, time: 0.12 },
      { freq: 220.00, time: 0.24 },
    ];

    steps.forEach(({ freq, time }) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'square';
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now + time);

      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.11, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + time);
      osc.stop(now + time + 0.5);
    });
  } catch {
    // ignore
  }
}

export function playNoTradeSound() {
  if (isMuted || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    
    // Double calm amber blip
    [0, 0.12].forEach((offset) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now + offset);
      osc.frequency.setValueAtTime(392, now + offset + 0.05);

      gain.gain.setValueAtTime(0.08, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.09);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  } catch {
    // ignore
  }
}

/**
 * Short crisp tick for pre-trade countdown (15s down to 2s)
 */
export function playCountdownTick() {
  if (isMuted || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch {
    // ignore
  }
}

/**
 * Loud, distinct futuristic "TRADE START" alarm
 * High-impact dual horn fanfare with resonant punch
 */
export function playTradeStartAlarm() {
  if (isMuted || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    // 3 rapid powerful alert pulses (880Hz / 1320Hz / 1760Hz)
    const bursts = [
      { time: 0, freq1: 880, freq2: 1320 },
      { time: 0.16, freq1: 987, freq2: 1480 },
      { time: 0.32, freq1: 1320, freq2: 1980 },
    ];

    bursts.forEach(({ time, freq1, freq2 }) => {
      if (!audioCtx) return;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      osc1.frequency.setValueAtTime(freq1, now + time);
      osc2.frequency.setValueAtTime(freq2, now + time);

      gain.gain.setValueAtTime(0.18, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(now + time);
      osc2.start(now + time);
      osc1.stop(now + time + 0.24);
      osc2.stop(now + time + 0.24);
    });
  } catch {
    // ignore
  }
}

