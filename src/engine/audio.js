// Effetti sonori sintetizzati con WebAudio: nessun file audio da scaricare.
const KEY = 'sorrisi.muted';

function readMuted() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function createAudio() {
  let ctx = null;
  let muted = readMuted();

  // I browser permettono l'audio solo dopo un gesto dell'utente.
  function unlock() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!ctx) ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, start, length, { type = 'sine', to = freq, volume = 0.12 } = {}) {
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + length);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + length + 0.05);
  }

  function noise(length, volume) {
    const size = Math.floor(ctx.sampleRate * length);
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size) ** 3;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.buffer = buffer;
    src.connect(gain).connect(ctx.destination);
    src.start();
  }

  const sounds = {
    click: () => tone(520, 0, 0.07, { type: 'triangle', volume: 0.08 }),
    pump: () => {
      for (let i = 0; i < 4; i++) tone(160, i * 0.32, 0.2, { type: 'sawtooth', to: 340, volume: 0.04 });
      for (let i = 0; i < 5; i++) tone(700 + i * 90, 1.5 + i * 0.22, 0.14, { type: 'square', to: 1100, volume: 0.025 });
    },
    success: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, { type: 'triangle' })),
    pop: () => {
      noise(0.28, 0.5);
      tone(220, 0, 0.18, { type: 'square', to: 50, volume: 0.1 });
    },
    giggle: () => [700, 880, 760, 960, 840].forEach((f, i) => tone(f, 0.12 + i * 0.09, 0.08, { to: f * 1.2, volume: 0.07 })),
    toy: () => [392, 523, 659].forEach((f, i) => tone(f, i * 0.1, 0.18, { type: 'triangle' })),
    super: () => {
      [392, 392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.13, 0.28, { type: 'sawtooth', volume: 0.06 }));
      tone(1047, 0.68, 0.6, { type: 'triangle', volume: 0.1 });
    },
    nope: () => [300, 220].forEach((f, i) => tone(f, i * 0.14, 0.18, { type: 'triangle', volume: 0.08 })),
  };

  return {
    unlock,
    play(name) {
      if (muted || !ctx || ctx.state !== 'running') return;
      sounds[name]?.();
    },
    get muted() {
      return muted;
    },
    toggle() {
      muted = !muted;
      try {
        localStorage.setItem(KEY, muted ? '1' : '0');
      } catch {
        // memoria del browser non disponibile: la scelta vale solo per questa visita
      }
      return muted;
    },
  };
}
