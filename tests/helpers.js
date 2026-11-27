import { Game } from '../src/game/game.js';

// Generatore ripetibile (mulberry32).
export function seeded(seed = 1) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Senza colleghi di norma: chi li vuole provare li chiede.
export function newGame(seed = 1, characterId = 'lorenzo', colleagues = 0) {
  const events = [];
  const game = new Game({ characterId, colleagues, rng: seeded(seed), onEvent: (e) => events.push(e) });
  return { game, events };
}

export function run(game, seconds) {
  for (let t = 0; t < seconds; t += 0.05) game.update(0.05);
}

// Avanza finché la condizione è vera; fallisce se non succede entro il limite.
export function until(game, condition, limit = 60) {
  for (let t = 0; t < limit; t += 0.05) {
    if (condition()) return t;
    game.update(0.05);
  }
  throw new Error(`condizione non raggiunta in ${limit} secondi`);
}

export const place = (who, x, y) => {
  who.x = x;
  who.y = y;
  who.stop();
};

// Tela finta: tiene il conto delle trasformazioni, annota le ellissi e rifiuta numeri non validi.
export function fakeContext() {
  let m = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const ellipses = [];
  const multiply = ([a, b, c, d, e, f]) => {
    const [A, B, C, D, E, F] = m;
    m = [A * a + C * b, B * a + D * b, A * c + C * d, B * c + D * d, A * e + C * f + E, B * e + D * f + F];
  };
  const methods = {
    save: () => stack.push(m),
    restore: () => (m = stack.pop()),
    translate: (x, y) => multiply([1, 0, 0, 1, x, y]),
    scale: (x, y) => multiply([x, 0, 0, y, 0, 0]),
    rotate: (a) => multiply([Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]),
    transform: (...v) => multiply(v),
    setTransform: (...v) => (m = v),
    ellipse: (x, y, rx, ry) => ellipses.push({ rx, ry, scale: Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) }),
    createLinearGradient: () => ({ addColorStop() {} }),
    measureText: (text) => ({ width: text.length * 7 }),
  };
  const state = { ellipses };
  return new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => {
        for (const v of args) {
          if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`numero non valido in ${String(key)}`);
        }
        return methods[key]?.(...args);
      };
    },
  });
}

export const fakeCanvas = (width = 200, height = 220) => {
  const ctx = fakeContext();
  return { width, height, ctx, getContext: () => ctx };
};
