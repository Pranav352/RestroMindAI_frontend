// Web Audio API Sound Synthesizer for RestroMind AI Live Orders
// Zero external file dependencies - pure browser audio synthesis

const AUDIO_MUTED_KEY = 'restromind_audio_muted';

export const isAudioMuted = () => {
  try {
    return localStorage.getItem(AUDIO_MUTED_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

export const setAudioMuted = (muted) => {
  try {
    localStorage.setItem(AUDIO_MUTED_KEY, muted ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to set audio mute state:', e);
  }
};

export const toggleAudioMuted = () => {
  const current = isAudioMuted();
  setAudioMuted(!current);
  return !current;
};

export const playNewOrderChime = () => {
  if (isAudioMuted()) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // Master Gain (Volume)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Note 1: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    // Note 2: A5 (880.00 Hz) - Plays slightly after Note 1
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.15);
    gain2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    // Start oscillators
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.65);

    // Clean up audio context
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch (err) {
    console.warn('Audio play error:', err);
  }
};

export default {
  isAudioMuted,
  setAudioMuted,
  toggleAudioMuted,
  playNewOrderChime
};
