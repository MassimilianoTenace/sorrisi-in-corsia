// Effetti sonori sintetizzati con WebAudio: nessun file audio da scaricare.
const KEY = 'sorrisi.muted';

function readMuted() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

// I suoni veri e propri, su un contesto audio qualsiasi (anche "offline", per le prove).
export function createSounds(ctx) {
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

  // Rutto: voce grave e gorgogliante, distorta e poi smorzata, molto più forte degli altri suoni.
  function burp() {
    const t = ctx.currentTime;
    const length = 1;

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, t);
    envelope.gain.exponentialRampToValueAtTime(0.66, t + 0.03); // attacco secco
    envelope.gain.setValueAtTime(0.66, t + length * 0.62);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + length);
    envelope.connect(ctx.destination);

    const muffle = ctx.createBiquadFilter(); // toglie gli acuti: suono sordo
    muffle.type = 'lowpass';
    muffle.frequency.setValueAtTime(480, t);
    muffle.frequency.exponentialRampToValueAtTime(240, t + length);
    muffle.Q.value = 0.7;
    muffle.connect(envelope);

    const distortion = ctx.createWaveShaper(); // la rende ruvida
    distortion.curve = Float32Array.from({ length: 512 }, (_, i) => Math.tanh(((i / 511) * 2 - 1) * 5));
    distortion.connect(muffle);

    const gargle = ctx.createGain(); // volume che trema rapidamente
    gargle.gain.value = 0.65;
    gargle.connect(distortion);
    const wobble = ctx.createOscillator();
    const depth = ctx.createGain();
    wobble.type = 'square';
    wobble.frequency.setValueAtTime(31, t);
    wobble.frequency.linearRampToValueAtTime(17, t + length);
    depth.gain.value = 0.35;
    wobble.connect(depth).connect(gargle.gain);

    const voices = [['sawtooth', 105, 46, 0.7], ['square', 71, 33, 0.45]].map(([type, from, to, volume]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.linearRampToValueAtTime(from * 1.25, t + 0.12);
      osc.frequency.exponentialRampToValueAtTime(to, t + length);
      gain.gain.value = volume;
      osc.connect(gain).connect(gargle);
      return osc;
    });

    const rumble = ctx.createBufferSource(); // un po' di rumore
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * length), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
    rumble.buffer = buffer;
    rumble.connect(gargle);

    for (const source of [wobble, ...voices, rumble]) source.start(t);
    for (const source of [wobble, ...voices]) source.stop(t + length + 0.05);
  }

  return {
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
    magic: () => [784, 988, 1175, 1568, 2093].forEach((f, i) => tone(f, i * 0.06, 0.2, { volume: 0.06 })),
    burp,
    strum: () => {
      [0, 0.55, 1.1, 1.65, 2.2].forEach((start, bar) => {
        const chord = bar % 2 ? [220, 277, 330, 440] : [196, 247, 294, 392];
        chord.forEach((f, i) => tone(f, start + i * 0.035, 0.45, { type: 'triangle', volume: 0.05 }));
      });
    },
    twang: () => tone(660, 0, 0.5, { type: 'sawtooth', to: 70, volume: 0.1 }),
    camera: () => [0, 1.4, 2.8].forEach((start) => tone(1800, start, 0.05, { type: 'square', to: 900, volume: 0.05 })),
    nope: () => [300, 220].forEach((f, i) => tone(f, i * 0.14, 0.18, { type: 'triangle', volume: 0.08 })),
  };
}

export function createAudio() {
  let ctx = null;
  let sounds = null;
  let muted = readMuted();

  // I browser permettono l'audio solo dopo un gesto dell'utente.
  function unlock() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!ctx) {
      ctx = new Ctx();
      sounds = createSounds(ctx);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

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
