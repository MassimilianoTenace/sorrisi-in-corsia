// Capelli dei personaggi in gioco. Coordinate della testa: centro in (0, 0), raggio r,
// il viso guarda leggermente a destra (occhi circa tra x = 0 e x = r * 0.6).
import { INK, shade, ellipse, rrect, line, finish } from './primitives.js';

const P = (x, y) => ({ x, y });

// Colore pieno oppure sfumato dalle radici alle punte.
function tint(ctx, look, r) {
  if (!look.roots) return look.hair;
  const g = ctx.createLinearGradient(0, -r * 1.3, 0, r * 1.6);
  g.addColorStop(0, look.roots);
  g.addColorStop(0.35, look.roots);
  g.addColorStop(0.75, look.hair);
  return g;
}

function blob(ctx, fill, build, stroke = INK, width = 1.1) {
  ctx.beginPath();
  build();
  ctx.closePath();
  finish(ctx, fill, stroke, width);
}

const curls = (ctx, fill, spots, size) => {
  for (const [x, y, k = 1] of spots) ellipse(ctx, x, y, size * k, size * k, fill, INK, 0.9);
};

// Chioma lunga: dritta (wave = 0) oppure mossa.
function mane(ctx, fill, r, { bottom = 2, width = 1.18, wave = 0 }) {
  blob(ctx, fill, () => {
    ctx.moveTo(-r * 0.7, -r * 0.75);
    ctx.bezierCurveTo(-r * (width + wave), -r * 0.2, -r * (width - wave), r * 0.7, -r * (width + wave * 0.5), r * (bottom * 0.65));
    ctx.quadraticCurveTo(-r * (width + wave), r * bottom, -r * 0.55, r * bottom);
    ctx.quadraticCurveTo(0, r * (bottom - 0.35 - wave), r * 0.55, r * bottom);
    ctx.quadraticCurveTo(r * (width + wave), r * bottom, r * (width + wave * 0.5), r * (bottom * 0.65));
    ctx.bezierCurveTo(r * (width - wave), r * 0.7, r * (width + wave), -r * 0.2, r * 0.7, -r * 0.75);
  });
}

// Calotta con le due ciocche che incorniciano il viso.
function curtains(ctx, fill, r, { part = 0.1, length = 1.2, bangs = 0 }) {
  blob(ctx, fill, () => {
    ctx.moveTo(r * part, -r * 0.82);
    ctx.bezierCurveTo(-r * 0.2, -r * (0.55 - bangs), -r * 0.72, -r * 0.35, -r * 0.7, r * 0.25);
    ctx.quadraticCurveTo(-r * 0.6, r * length * 0.75, -r * 0.82, r * length);
    ctx.quadraticCurveTo(-r * 1.22, r * 0.45, -r * 1.12, -r * 0.2);
    ctx.bezierCurveTo(-r * 1.1, -r * 1.4, r * 1.1, -r * 1.4, r * 1.12, -r * 0.2);
    ctx.quadraticCurveTo(r * 1.2, r * 0.45, r * 0.98, r * length);
    ctx.quadraticCurveTo(r * 0.86, r * length * 0.6, r * 0.96, r * 0.1);
    ctx.bezierCurveTo(r * 0.95, -r * (0.4 - bangs * 0.5), r * 0.55, -r * (0.55 - bangs), r * part, -r * 0.82);
  });
}

// Calotta corta con la linea della fronte a piacere.
function crop(ctx, fill, r, hairline) {
  ctx.beginPath();
  ctx.arc(0, -0.5, r + 0.7, Math.PI * 0.98, Math.PI * 2.02);
  hairline();
  ctx.closePath();
  finish(ctx, fill, INK, 1.2);
}

const BACK = {
  long: (ctx, look, r) => rrect(ctx, -r * 1.12, -r * 0.7, r * 2.1, r * 2.05, r * 0.8, look.hair),
  pigtails(ctx, look, r) {
    ellipse(ctx, -r * 1.15, r * 0.25, r * 0.42, r * 0.62, look.hair, INK, 1.1, 0.5);
    ellipse(ctx, r * 1.12, r * 0.25, r * 0.42, r * 0.62, look.hair, INK, 1.1, -0.5);
  },
  bun: (ctx, look, r) => ellipse(ctx, -r * 0.35, -r * 1.12, r * 0.5, r * 0.45, look.hair),
  straight: (ctx, look, r) => mane(ctx, tint(ctx, look, r), r, { bottom: 2.05, width: 1.16 }),
  wavy: (ctx, look, r) => mane(ctx, tint(ctx, look, r), r, { bottom: 1.95, width: 1.22, wave: 0.28 }),
  ombre: (ctx, look, r) => mane(ctx, tint(ctx, look, r), r, { bottom: 2.1, width: 1.18, wave: 0.18 }),
  longCurly(ctx, look, r) {
    mane(ctx, look.hair, r, { bottom: 1.6, width: 1.28, wave: 0.2 });
    curls(ctx, look.hair, [[-r * 1.15, 0], [-r * 1.25, r * 0.65], [-r * 1.05, r * 1.3], [-r * 0.4, r * 1.55],
      [r * 1.15, 0], [r * 1.25, r * 0.65], [r * 1.05, r * 1.3], [r * 0.4, r * 1.55]], r * 0.34);
  },
  bob: (ctx, look, r) => mane(ctx, look.hair, r, { bottom: 1.12, width: 1.18 }),
  // lunghi e scalati: due lunghezze, con le punte leggere in fuori
  curtain(ctx, look, r) {
    mane(ctx, look.hair, r, { bottom: 1.9, width: 1.16, wave: 0.1 });
    for (const dir of [-1, 1]) {
      blob(ctx, look.hair, () => {
        ctx.moveTo(dir * r * 0.8, -r * 0.2);
        ctx.quadraticCurveTo(dir * r * 1.25, r * 0.55, dir * r * 1.34, r * 1.05);
        ctx.quadraticCurveTo(dir * r * 1.05, r * 0.95, dir * r * 0.8, r * 0.7);
      });
    }
  },
  swept: (ctx, look, r) => mane(ctx, look.hair, r, { bottom: 1.75, width: 1.1 }),
  curlyBob(ctx, look, r) {
    curls(ctx, look.hair, [[-r * 1.05, -r * 0.3], [-r * 1.15, r * 0.3], [-r * 0.9, r * 0.8], [r * 1.05, -r * 0.3],
      [r * 1.15, r * 0.3], [r * 0.9, r * 0.8]], r * 0.45);
  },
  tied(ctx, look, r) {
    ellipse(ctx, -r * 0.9, r * 0.85, r * 0.4, r * 0.8, look.hair, INK, 1.1, 0.45);
  },
  updo(ctx, look, r) {
    curls(ctx, look.hair, [[-r * 0.55, -r * 1.05], [-r * 0.05, -r * 1.25]], r * 0.45);
  },
  sweep: (ctx, look, r) => mane(ctx, look.hair, r, { bottom: 0.72, width: 1.17, wave: 0.14 }),
  rock(ctx, look, r) {
    mane(ctx, look.hair, r, { bottom: 1.5, width: 1.3, wave: 0.34 });
    (look.streaks ?? []).forEach((color, i) => {
      const dir = i % 2 ? 1 : -1;
      line(ctx, [P(dir * r * 0.9, -r * 0.3), P(dir * r * 1.28, r * (0.3 + i * 0.2)), P(dir * r * 0.9, r * 1.2)], color, 2.4);
    });
  },
  frizz(ctx, look, r) {
    ctx.beginPath();
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const k = i % 2 ? 1.18 : 1.75 + (i % 6 === 0 ? 0.2 : 0);
      ctx.lineTo(Math.cos(a) * r * k, Math.sin(a) * r * k - r * 0.2);
    }
    ctx.closePath();
    finish(ctx, look.hair, INK, 1.1);
  },
};

const FRONT = {
  // ciuffo alto portato di lato con i lati sfumati
  quiff(ctx, look, r) {
    const { hair } = look;
    blob(ctx, shade(hair, 0.24), () => {
      ctx.moveTo(-r - 0.3, 1);
      ctx.quadraticCurveTo(-r - 1, -r * 0.9, -r * 0.3, -r * 0.95);
      ctx.lineTo(-r * 0.55, -r * 0.25);
      ctx.lineTo(-r * 0.68, r * 0.2);
    }, null);
    blob(ctx, hair, () => {
      ctx.moveTo(-r * 0.92, -r * 0.35);
      ctx.bezierCurveTo(-r * 1.2, -r * 1.25, -r * 0.55, -r * 1.55, -r * 0.1, -r * 1.42);
      ctx.bezierCurveTo(r * 0.05, -r * 1.78, r * 0.6, -r * 1.62, r * 0.68, -r * 1.48);
      ctx.bezierCurveTo(r * 1.15, -r * 1.55, r * 1.32, -r * 1.05, r * 1.08, -r * 0.82);
      ctx.bezierCurveTo(r * 1.12, -r * 0.65, r * 1.02, -r * 0.5, r * 0.9, -r * 0.42);
      ctx.bezierCurveTo(r * 0.55, -r * 0.86, -r * 0.05, -r * 0.6, -r * 0.5, -r * 0.66);
      ctx.quadraticCurveTo(-r * 0.62, -r * 0.2, -r * 0.7, r * 0.08);
    }, INK, 1.2);
    const light = shade(hair, 0.3);
    line(ctx, [P(-r * 0.5, -r * 1.05), P(r * 0.05, -r * 1.3), P(r * 0.5, -r * 1.2)], light, 1.1);
    line(ctx, [P(-r * 0.1, -r * 0.9), P(r * 0.45, -r * 1.0), P(r * 0.85, -r * 0.85)], light, 0.9);
  },
  // corti e radi, con l'attaccatura alta
  senior(ctx, look, r) {
    for (const dir of [-1, 1]) {
      blob(ctx, look.hair, () => {
        ctx.moveTo(dir * r * 0.98, r * 0.2);
        ctx.quadraticCurveTo(dir * r * 1.16, -r * 0.65, dir * r * 0.5, -r * 0.92);
        ctx.quadraticCurveTo(dir * r * 0.7, -r * 0.45, dir * r * 0.74, r * 0.05);
      });
    }
    line(ctx, [P(-r * 0.55, -r * 0.92), P(0, -r * 1.07), P(r * 0.55, -r * 0.92)], look.hair, 2.2);
  },
  fringe(ctx, look, r) {
    crop(ctx, look.hair, r, () => {
      ctx.lineTo(r * 0.86, -r * 0.35);
      ctx.lineTo(r * 0.6, -r * 0.6);
      ctx.lineTo(r * 0.42, -r * 0.28);
      ctx.lineTo(r * 0.15, -r * 0.62);
      ctx.lineTo(-r * 0.18, -r * 0.35);
      ctx.quadraticCurveTo(-r * 0.65, -r * 0.5, -r * 0.7, r * 0.2);
    });
    curls(ctx, look.hair, [[-r * 0.35, -r * 1.05], [r * 0.2, -r * 1.12], [r * 0.65, -r * 0.92]], r * 0.32);
  },
  // lunghi e pettinati all'indietro, mossi
  sweep(ctx, look, r) {
    blob(ctx, look.hair, () => {
      ctx.moveTo(-r * 0.88, r * 0.4);
      ctx.bezierCurveTo(-r * 1.4, -r * 0.2, -r * 1.3, -r * 1.25, -r * 0.4, -r * 1.38);
      ctx.bezierCurveTo(r * 0.3, -r * 1.62, r * 1.35, -r * 1.25, r * 1.18, -r * 0.3);
      ctx.quadraticCurveTo(r * 1.16, r * 0.1, r * 0.98, r * 0.2);
      ctx.bezierCurveTo(r * 1, -r * 0.75, r * 0.3, -r * 0.95, -r * 0.1, -r * 0.72);
      ctx.bezierCurveTo(-r * 0.6, -r * 0.55, -r * 0.55, 0, -r * 0.88, r * 0.4);
    });
    const light = shade(look.hair, 0.4);
    line(ctx, [P(r * 0.5, -r * 0.95), P(-r * 0.2, -r * 1.15), P(-r * 0.95, -r * 0.5)], light, 1);
    line(ctx, [P(r * 0.85, -r * 0.9), P(r * 0.25, -r * 1.32), P(-r * 0.4, -r * 1.2)], light, 0.9);
  },
  straight: (ctx, look, r) => curtains(ctx, tint(ctx, look, r), r, { part: 0.15, length: 1.35 }),
  wavy(ctx, look, r) {
    curtains(ctx, tint(ctx, look, r), r, { part: -0.15, length: 1.35 });
    line(ctx, [P(-r * 0.95, -r * 0.1), P(-r * 0.78, r * 0.5), P(-r * 0.98, r * 0.9)], look.highlights ?? shade(look.hair, 0.22), 1.1);
  },
  ombre(ctx, look, r) {
    curtains(ctx, tint(ctx, look, r), r, { part: 0.05, length: 1.4, bangs: 0.12 });
    line(ctx, [P(-r * 0.96, r * 0.25), P(-r * 0.82, r * 1.05)], shade(look.hair, 0.35), 1.1);
  },
  longCurly(ctx, look, r) {
    curtains(ctx, look.hair, r, { part: 0.1, length: 1.15 });
    curls(ctx, look.hair, [[-r * 0.98, -r * 0.35], [-r * 1.02, r * 0.35], [-r * 0.9, r * 0.95], [-r * 0.55, -r * 0.98],
      [r * 0.65, -r * 0.95], [r * 1.04, r * 0.65, 0.8]], r * 0.3);
  },
  bob(ctx, look, r) {
    curtains(ctx, look.hair, r, { part: -0.35, length: 1.02 });
    line(ctx, [P(-r * 0.35, -r * 1.05), P(-r * 0.85, -r * 0.4)], shade(look.hair, 0.28), 1.2);
  },
  // frangia a tendina: si apre al centro e scende fino agli zigomi
  curtain(ctx, look, r) {
    curtains(ctx, look.hair, r, { part: 0.18, length: 1.2, bangs: 0.2 });
    for (const [dir, x] of [[-1, 0.12], [1, 0.24]]) {
      blob(ctx, look.hair, () => {
        ctx.moveTo(r * 0.18, -r * 0.95);
        ctx.quadraticCurveTo(r * (x + dir * 0.4), -r * 0.45, r * (x + dir * 0.82), r * 0.08);
        ctx.quadraticCurveTo(r * (x + dir * 0.85), -r * 0.65, r * (x + dir * 0.45), -r * 0.98);
      }, INK, 0.9);
    }
    line(ctx, [P(-r * 0.95, -r * 0.05), P(-r * 0.86, r * 0.55), P(-r * 1.02, r * 0.95)], look.highlights, 1.1);
  },
  // tirati indietro, con la riga di lato: fronte libera
  swept(ctx, look, r) {
    crop(ctx, look.hair, r, () => {
      ctx.quadraticCurveTo(r * 0.9, -r * 0.5, r * 0.4, -r * 0.82);
      ctx.bezierCurveTo(r * 0.05, -r * 0.55, -r * 0.65, -r * 0.55, -r * 0.76, r * 0.25);
    });
    line(ctx, [P(r * 0.4, -r * 0.88), P(r * 0.2, -r * 1.05)], look.highlights, 1);
    line(ctx, [P(r * 0.1, -r * 0.9), P(-r * 0.55, -r * 0.75), P(-r * 0.9, -r * 0.15)], look.highlights, 1.1);
  },
  curlyBob(ctx, look, r) {
    curtains(ctx, look.hair, r, { part: -0.2, length: 0.75 });
    curls(ctx, look.hair, [[-r * 0.8, -r * 0.75], [-r * 0.35, -r * 1.05], [r * 0.2, -r * 1.12], [r * 0.7, -r * 0.88],
      [-r * 1.0, -r * 0.1, 0.85], [r * 1.05, -r * 0.2, 0.75]], r * 0.34);
  },
  tied(ctx, look, r) {
    crop(ctx, look.hair, r, () => {
      ctx.bezierCurveTo(r * 0.7, -r * 0.55, r * 0.35, -r * 0.7, r * 0.05, -r * 0.82);
      ctx.bezierCurveTo(-r * 0.3, -r * 0.6, -r * 0.72, -r * 0.4, -r * 0.74, r * 0.25);
    });
    // le due ciocche libere
    line(ctx, [P(-r * 0.15, -r * 0.8), P(-r * 0.62, -r * 0.2), P(-r * 0.6, r * 0.75)], INK, 2.8);
    line(ctx, [P(-r * 0.15, -r * 0.8), P(-r * 0.62, -r * 0.2), P(-r * 0.6, r * 0.75)], look.hair, 1.6);
    line(ctx, [P(r * 0.3, -r * 0.82), P(r * 0.98, -r * 0.15), P(r * 0.93, r * 0.65)], INK, 2.6);
    line(ctx, [P(r * 0.3, -r * 0.82), P(r * 0.98, -r * 0.15), P(r * 0.93, r * 0.65)], look.hair, 1.4);
  },
  updo(ctx, look, r) {
    crop(ctx, look.hair, r, () => {
      ctx.bezierCurveTo(r * 0.75, -r * 0.5, r * 0.35, -r * 0.5, r * 0.15, -r * 0.62);
      ctx.bezierCurveTo(-r * 0.25, -r * 0.35, -r * 0.62, -r * 0.45, -r * 0.7, r * 0.2);
    });
    line(ctx, [P(r * 0.05, -r * 0.95), P(r * 0.55, -r * 0.6), P(r * 0.8, -r * 0.2)], shade(look.hair, 0.25), 1.2);
  },
  rock(ctx, look, r) {
    const streaks = look.streaks ?? [look.hair];
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.05 + i * 0.15);
      const tip = P(Math.cos(a) * r * 1.9, Math.sin(a) * r * 1.9);
      blob(ctx, streaks[i % streaks.length], () => {
        ctx.moveTo(Math.cos(a - 0.22) * r * 0.9, Math.sin(a - 0.22) * r * 0.9);
        ctx.lineTo(tip.x, tip.y);
        ctx.lineTo(Math.cos(a + 0.22) * r * 0.9, Math.sin(a + 0.22) * r * 0.9);
      });
    }
    crop(ctx, look.hair, r, () => {
      ctx.quadraticCurveTo(r * 0.2, -r * 1.05, -r * 0.7, r * 0.1);
    });
  },
  frizz(ctx, look, r) {
    ctx.beginPath();
    const tufts = [[-1.05, 0], [-1.45, -0.55], [-0.9, -0.75], [-1.05, -1.4], [-0.45, -1.1], [-0.2, -1.75], [0.15, -1.1],
      [0.75, -1.55], [0.7, -0.9], [1.45, -0.8], [1.0, -0.45], [1.25, 0], [0.8, -0.3], [0.25, -0.65], [-0.35, -0.4], [-0.75, -0.45]];
    tufts.forEach(([x, y]) => ctx.lineTo(x * r, y * r));
    ctx.closePath();
    finish(ctx, look.hair, INK, 1.1);
  },
  cap(ctx, look, r) {
    ctx.beginPath();
    ctx.arc(0, -1, r + 0.8, Math.PI, Math.PI * 2);
    ctx.quadraticCurveTo(0, -r * 0.5, -r - 0.8, -1);
    finish(ctx, look.cap, INK, 1.2);
    ellipse(ctx, r * 0.75, -r * 0.5, r * 0.6, r * 0.2, shade(look.cap, -0.2), INK, 1, 0.15);
    ellipse(ctx, 0, -r - 1.5, 1.8, 1.4, shade(look.cap, 0.3), INK, 0.9);
  },
  curly(ctx, look, r) {
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI * (0.92 + i * 0.195);
      ellipse(ctx, Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, r * 0.36, r * 0.36, look.hair, INK, 1);
    }
    ellipse(ctx, -1, -r * 0.78, r * 0.62, r * 0.32, look.hair, null);
  },
  bald: (ctx, look, r) => ellipse(ctx, -r * 0.25, -r * 0.7, r * 0.25, r * 0.13, 'rgba(255,255,255,0.4)', null),
};

// short, long, pigtails e bun hanno la stessa frangia
function plain(ctx, look, r) {
  crop(ctx, look.hair, r, () => {
    ctx.bezierCurveTo(r * 0.7, -r * 0.35, r * 0.25, -r * 0.75, -r * 0.05, -r * 0.55);
    ctx.bezierCurveTo(-r * 0.3, -r * 0.4, -r * 0.65, -r * 0.45, -r * 0.7, r * 0.15);
  });
  if (look.style === 'pigtails') {
    ellipse(ctx, -r * 0.98, -r * 0.1, 2, 2, look.band ?? '#e8483f', INK, 0.8);
    ellipse(ctx, r * 0.98, -r * 0.1, 2, 2, look.band ?? '#e8483f', INK, 0.8);
  }
}

// Acconciature che di spalle lasciano scoperta la nuca.
const SHORT_AT_BACK = new Set(['quiff', 'short', 'senior', 'fringe', 'sweep']);

export function hairBack(ctx, look, r) {
  BACK[look.style]?.(ctx, look, r);
}

export function hairFront(ctx, look, r, back) {
  if (!back) {
    (FRONT[look.style] ?? plain)(ctx, look, r);
    return;
  }
  if (look.style === 'bald') {
    FRONT.bald(ctx, look, r);
    return;
  }
  ctx.beginPath();
  ctx.arc(0, -0.5, r + 0.6, Math.PI * 0.86, Math.PI * 2.14);
  ctx.quadraticCurveTo(0, r * (SHORT_AT_BACK.has(look.style) ? 0.78 : 1.05), -r * 0.95, r * 0.4);
  finish(ctx, look.style === 'cap' ? look.cap : tint(ctx, look, r), INK, 1.2);
  if (look.style === 'quiff') line(ctx, [P(-5, -r + 1), P(2, -r - 3), P(7, -r - 1)], shade(look.hair, 0.22), 1.4);
}

// Il cappellino sta sulla sommità del capo, visibile davanti e di spalle.
export function drawSmallHat(ctx, color, r, back) {
  const x = back ? 0 : -r * 0.12;
  blob(ctx, color, () => {
    ctx.moveTo(x - r * 0.68, -r * 0.82);
    ctx.bezierCurveTo(x - r * 0.55, -r * 1.42, x + r * 0.55, -r * 1.42, x + r * 0.68, -r * 0.82);
    ctx.quadraticCurveTo(x, -r * 1.02, x - r * 0.68, -r * 0.82);
  }, INK, 1);
  line(ctx, [P(x - r * 0.5, -r * 0.98), P(x, -r * 1.12), P(x + r * 0.5, -r * 0.98)], shade(color, 0.45), 0.8);
}
