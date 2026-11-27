// Ritratti grandi (mezzo busto) per la scelta del personaggio e il pannello di gioco.
// Si compongono dall'aspetto del personaggio più i particolari in "portrait".
import { INK, shade, ellipse, rrect, line, heart, finish } from './primitives.js';
import { drawRoundBalloon, drawGuitar, BALLOON_COLORS } from './props.js';
import { drawBear } from './bear.js';

const P = (x, y) => ({ x, y });

function shape(ctx, fill, build, stroke = INK, width = 2.2) {
  ctx.beginPath();
  build();
  ctx.closePath();
  finish(ctx, fill, stroke, width);
}

const curls = (ctx, color, spots, r = 12) => {
  for (const [x, y, k = 1] of spots) ellipse(ctx, x, y, r * k, r * k, color, INK, 1.6);
};

// Colore pieno oppure sfumato dalle radici alle punte.
function tint(ctx, look) {
  if (!look.roots) return look.hair;
  const g = ctx.createLinearGradient(0, 25, 0, 200);
  g.addColorStop(0, look.roots);
  g.addColorStop(0.3, look.roots);
  g.addColorStop(0.7, look.hair);
  return g;
}

// Misure del viso: metà larghezza, y del mento, larghezza della mascella.
const FACES = {
  square: { w: 40, chin: 146, jaw: 31 },
  oval: { w: 38, chin: 145, jaw: 22 },
  round: { w: 41, chin: 142, jaw: 29 },
  long: { w: 37, chin: 150, jaw: 25 },
};

// ---------- capelli ----------
function mane(ctx, fill, { bottom, spread, wave = 0 }) {
  shape(ctx, fill, () => {
    ctx.moveTo(100, 30);
    ctx.bezierCurveTo(48, 28, 48 - wave, 70, 50, 95);
    ctx.bezierCurveTo(52 - wave * 2, 125, 100 - spread + wave * 2, 140, 100 - spread, bottom - 22);
    ctx.quadraticCurveTo(100 - spread - wave, bottom, 100 - spread + 24, bottom);
    ctx.quadraticCurveTo(100, bottom - 26 - wave, 100 + spread - 24, bottom);
    ctx.quadraticCurveTo(100 + spread + wave, bottom, 100 + spread, bottom - 22);
    ctx.bezierCurveTo(100 + spread - wave * 2, 140, 148 + wave * 2, 125, 150, 95);
    ctx.bezierCurveTo(152 + wave, 70, 152, 28, 100, 30);
  });
}

// Calotta con due bande che incorniciano il viso.
function curtains(ctx, fill, { part = 104, length = 150, fringe = 0 }) {
  shape(ctx, fill, () => {
    ctx.moveTo(part, 52);
    ctx.bezierCurveTo(part - 20, 62 + fringe, 70, 66 + fringe, 67, 94);
    ctx.quadraticCurveTo(66, length - 30, 58, length);
    ctx.quadraticCurveTo(42, length - 38, 52, 76);
    ctx.bezierCurveTo(52, 20, 148, 20, 148, 76);
    ctx.quadraticCurveTo(158, length - 38, 142, length);
    ctx.quadraticCurveTo(134, length - 30, 133, 94);
    ctx.bezierCurveTo(130, 66 + fringe, part + 18, 62 + fringe, part, 52);
  });
}

// Calotta corta: "hairline" chiude la forma disegnando l'attaccatura da destra a sinistra.
function crop(ctx, fill, hairline) {
  shape(ctx, fill, () => {
    ctx.moveTo(59, 82);
    ctx.bezierCurveTo(52, 22, 148, 22, 141, 82);
    hairline();
  });
}

function shine(ctx, look, ...strands) {
  for (const strand of strands) line(ctx, strand.map(([x, y]) => P(x, y)), look.highlights ?? shade(look.hair, 0.28), 2.6);
}

const HAIR = {
  quiff: {
    front(ctx, look) {
      // lati sfumati: dal colore dei capelli alla pelle
      const fade = ctx.createLinearGradient(0, 45, 0, 96);
      fade.addColorStop(0, look.hair);
      fade.addColorStop(0.55, shade(look.hair, 0.16));
      fade.addColorStop(1, look.skin);
      for (const dir of [-1, 1]) {
        shape(ctx, fade, () => {
          ctx.moveTo(100 + dir * 39.5, 94);
          ctx.bezierCurveTo(100 + dir * 44, 66, 100 + dir * 43, 47, 100 + dir * 31, 42);
          ctx.lineTo(100 + dir * 28, 58);
          ctx.quadraticCurveTo(100 + dir * 35, 68, 100 + dir * 34, 94);
        }, null);
      }
      // ciuffo voluminoso, a ciocche, portato di lato
      shape(ctx, look.hair, () => {
        ctx.moveTo(62, 68);
        ctx.bezierCurveTo(48, 46, 54, 30, 68, 28);
        ctx.bezierCurveTo(70, 15, 88, 12, 96, 19);
        ctx.bezierCurveTo(106, 5, 128, 8, 132, 20);
        ctx.bezierCurveTo(150, 18, 156, 36, 146, 45);
        ctx.bezierCurveTo(152, 53, 145, 62, 138, 68);
        ctx.bezierCurveTo(136, 54, 129, 48, 119, 50);
        ctx.quadraticCurveTo(112, 58, 103, 51);
        ctx.quadraticCurveTo(95, 59, 86, 51);
        ctx.quadraticCurveTo(76, 52, 71, 57);
        ctx.quadraticCurveTo(66, 60, 62, 68);
      });
      for (const [x, y, w] of [[66, 40, 22], [86, 27, 30], [112, 25, 28], [90, 41, 34], [122, 38, 20]]) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + w * 0.5, y - 11, x + w, y - 1);
        finish(ctx, null, shade(look.hair, 0.26), 2.6);
      }
    },
  },
  senior: {
    front(ctx, look) {
      for (const dir of [-1, 1]) {
        shape(ctx, look.hair, () => {
          ctx.moveTo(100 + dir * 39, 96);
          ctx.bezierCurveTo(100 + dir * 48, 66, 100 + dir * 38, 48, 100 + dir * 18, 45);
          ctx.quadraticCurveTo(100 + dir * 30, 60, 100 + dir * 32, 72);
          ctx.quadraticCurveTo(100 + dir * 34, 84, 100 + dir * 39, 96);
        }, INK, 1.8);
      }
      for (const y of [46, 51]) line(ctx, [P(78, y + 3), P(100, y - 3), P(122, y + 3)], look.hair, 2.4);
    },
  },
  fringe: {
    front(ctx, look) {
      crop(ctx, look.hair, () => {
        ctx.quadraticCurveTo(137, 62, 130, 60);
        ctx.lineTo(125, 72);
        ctx.quadraticCurveTo(120, 62, 114, 58);
        ctx.lineTo(104, 71);
        ctx.quadraticCurveTo(101, 60, 94, 57);
        ctx.lineTo(80, 66);
        ctx.quadraticCurveTo(66, 62, 59, 82);
      });
      curls(ctx, look.hair, [[76, 38], [95, 30], [117, 33], [133, 45]], 11);
      shine(ctx, look, [[72, 42], [92, 30], [112, 34]], [[104, 44], [124, 40], [136, 52]]);
    },
  },
  sweep: {
    back: (ctx, look) => mane(ctx, look.hair, { bottom: 132, spread: 52, wave: 5 }),
    front(ctx, look) {
      shape(ctx, look.hair, () => {
        ctx.moveTo(62, 100);
        ctx.bezierCurveTo(38, 82, 40, 34, 74, 30);
        ctx.bezierCurveTo(96, 6, 160, 20, 150, 62);
        ctx.quadraticCurveTo(156, 82, 139, 100);
        ctx.bezierCurveTo(140, 66, 134, 52, 112, 50);
        ctx.bezierCurveTo(94, 46, 76, 54, 72, 66);
        ctx.quadraticCurveTo(66, 80, 62, 100);
      });
      shine(ctx, look, [[132, 54], [104, 28], [70, 40]], [[144, 50], [124, 24], [96, 24]], [[64, 80], [52, 62], [62, 42]], [[118, 42], [90, 36], [70, 56]]);
    },
  },
  bald: {
    front(ctx) {
      ellipse(ctx, 87, 53, 14, 7, 'rgba(255,255,255,0.35)', null, 1, -0.35);
    },
  },
  straight: {
    back: (ctx, look) => mane(ctx, look.hair, { bottom: 208, spread: 56 }),
    front(ctx, look) {
      curtains(ctx, look.hair, { part: 103, length: 168 });
      shine(ctx, look, [[92, 45], [68, 66], [60, 120]], [[116, 45], [137, 66], [142, 120]]);
    },
  },
  wavy: {
    back: (ctx, look) => mane(ctx, tint(ctx, look), { bottom: 206, spread: 60, wave: 10 }),
    front(ctx, look) {
      curtains(ctx, tint(ctx, look), { part: 88, length: 164 });
      shine(ctx, look, [[96, 45], [130, 64], [146, 100], [134, 122], [146, 148]], [[76, 52], [56, 88], [66, 116], [54, 146]]);
    },
  },
  ombre: {
    back: (ctx, look) => mane(ctx, tint(ctx, look), { bottom: 212, spread: 58, wave: 6 }),
    front(ctx, look) {
      curtains(ctx, tint(ctx, look), { part: 100, length: 170, fringe: 8 });
      shine(ctx, look, [[58, 110], [64, 140], [54, 160]], [[144, 108], [136, 140], [146, 160]], [[94, 54], [74, 68], [68, 86]]);
    },
  },
  longCurly: {
    back(ctx, look) {
      mane(ctx, look.hair, { bottom: 186, spread: 60, wave: 8 });
      curls(ctx, look.hair, [[50, 72], [44, 96], [48, 122], [40, 146], [48, 168], [66, 182], [150, 72], [156, 96],
        [152, 122], [160, 146], [152, 168], [134, 182]], 14);
    },
    front(ctx, look) {
      curtains(ctx, look.hair, { part: 102, length: 140 });
      curls(ctx, look.hair, [[58, 66], [70, 44], [130, 46], [143, 68], [55, 98], [146, 100], [52, 126], [148, 130]], 10);
      shine(ctx, look, [[80, 40], [96, 34]], [[110, 34], [130, 44]]);
    },
  },
  bob: {
    back: (ctx, look) => mane(ctx, look.hair, { bottom: 150, spread: 56 }),
    front(ctx, look) {
      curtains(ctx, look.hair, { part: 80, length: 142 });
      shine(ctx, look, [[84, 46], [120, 42], [142, 74]], [[76, 52], [60, 84], [58, 118]]);
    },
  },
  curlyBob: {
    back(ctx, look) {
      curls(ctx, look.hair, [[56, 72], [50, 94], [55, 116], [66, 130], [144, 72], [150, 94], [145, 116], [134, 130]], 17);
    },
    front(ctx, look) {
      curtains(ctx, look.hair, { part: 86, length: 106 });
      curls(ctx, look.hair, [[66, 52], [82, 38], [102, 33], [122, 39], [137, 55]], 13);
      shine(ctx, look, [[72, 46], [86, 36]], [[108, 32], [126, 42]]);
    },
  },
  tied: {
    back(ctx, look) {
      ellipse(ctx, 62, 138, 16, 38, look.hair, INK, 2.2, 0.35);
    },
    front(ctx, look) {
      crop(ctx, look.hair, () => {
        ctx.quadraticCurveTo(132, 52, 100, 52);
        ctx.quadraticCurveTo(68, 54, 59, 82);
      });
      // riga in mezzo e due ciocche libere
      line(ctx, [P(101, 37), P(100, 51)], shade(look.hair, 0.35), 2);
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(100 + dir * 6, 50);
        ctx.bezierCurveTo(100 + dir * 44, 60, 100 + dir * 30, 96, 100 + dir * 42, 142);
        finish(ctx, null, INK, 6);
        ctx.beginPath();
        ctx.moveTo(100 + dir * 6, 50);
        ctx.bezierCurveTo(100 + dir * 44, 60, 100 + dir * 30, 96, 100 + dir * 42, 142);
        finish(ctx, null, look.hair, 3.6);
      }
    },
  },
  updo: {
    back(ctx, look) {
      curls(ctx, look.hair, [[80, 34, 1], [100, 26, 1.15], [119, 35, 0.9]], 17);
    },
    front(ctx, look) {
      crop(ctx, look.hair, () => {
        ctx.bezierCurveTo(136, 58, 120, 52, 110, 55);
        ctx.bezierCurveTo(90, 70, 68, 58, 59, 82);
      });
      shine(ctx, look, [[112, 50], [92, 58], [70, 66]], [[112, 44], [134, 62]]);
    },
  },
};

// ---------- viso ----------
function faceShape(ctx, look, f) {
  const { w, chin, jaw } = f;
  shape(ctx, look.skin, () => {
    ctx.moveTo(100 - w, 72);
    ctx.bezierCurveTo(100 - w, 36, 100 + w, 36, 100 + w, 72);
    ctx.bezierCurveTo(100 + w + 2, 98, 100 + w - 2, 112, 100 + jaw, 126);
    ctx.bezierCurveTo(100 + jaw * 0.65, chin - 6, 110, chin, 101, chin);
    ctx.bezierCurveTo(92, chin, 100 - jaw * 0.65, chin - 6, 100 - jaw, 126);
    ctx.bezierCurveTo(100 - w + 2, 112, 100 - w - 2, 98, 100 - w, 72);
  });
}

function beardShape(ctx, look, f) {
  const { w, chin } = f;
  const low = chin + (look.beardStyle === 'full' ? 20 : 4);
  ctx.save();
  if (look.beardStyle === 'short') ctx.globalAlpha = 0.88;
  shape(ctx, look.beard, () => {
    ctx.moveTo(101 - w + 1, 90);
    ctx.bezierCurveTo(101 - w + 2, 112, 69, 126, 78, low - 10);
    ctx.bezierCurveTo(90, low + 3, 112, low + 3, 124, low - 10);
    ctx.bezierCurveTo(133, 126, 99 + w - 2, 112, 99 + w - 1, 90);
    ctx.lineTo(135.5, 102);
    ctx.bezierCurveTo(131, 117, 122, 117, 116, 112);
    ctx.bezierCurveTo(108, 106, 94, 106, 86, 112);
    ctx.bezierCurveTo(80, 117, 71, 117, 66.5, 102);
  }, INK, 1.4);
  ctx.restore();
}

function mouth(ctx, look, smile) {
  const lips = look.lips ?? '#a8625c';
  if (smile === 'big') {
    shape(ctx, '#8e3b40', () => {
      ctx.moveTo(84, 116);
      ctx.quadraticCurveTo(101, 140, 118, 116);
      ctx.quadraticCurveTo(101, 121, 84, 116);
    }, look.lips ?? INK, look.lips ? 3 : 1.6);
    shape(ctx, '#fff', () => {
      ctx.moveTo(88, 118);
      ctx.quadraticCurveTo(101, 122, 114, 118);
      ctx.quadraticCurveTo(101, 130, 88, 118);
    }, null);
  } else {
    const lift = smile === 'closed' ? 2 : 4;
    shape(ctx, lips, () => {
      ctx.moveTo(86, 119 - lift * 0.4);
      ctx.quadraticCurveTo(94, 114, 101, 117);
      ctx.quadraticCurveTo(108, 114, 116, 119 - lift * 0.4);
      ctx.quadraticCurveTo(101, 124 + lift * 2, 86, 119 - lift * 0.4);
    }, shade(lips, -0.35), 1.2);
    line(ctx, [P(87, 119 - lift * 0.4), P(101, 119 + lift * 0.3), P(115, 119 - lift * 0.4)], shade(lips, -0.5), 1.8);
  }
}

function moustache(ctx, color) {
  shape(ctx, color, () => {
    ctx.moveTo(81, 117);
    ctx.quadraticCurveTo(90, 106, 101, 111);
    ctx.quadraticCurveTo(112, 106, 121, 117);
    ctx.quadraticCurveTo(110, 113, 101, 116);
    ctx.quadraticCurveTo(92, 113, 81, 117);
  }, INK, 1.2);
}

function features(ctx, look, traits) {
  const lashes = Boolean(look.lips);
  for (const x of [82, 120]) {
    ellipse(ctx, x, 85, 8.5, 6.2, '#fff', INK, 1.2);
    ellipse(ctx, x + 1, 85.5, 4.6, 5, traits.eyes, null);
    ellipse(ctx, x + 1, 85.5, 2.2, 2.4, '#140a06', null);
    ellipse(ctx, x + 2.8, 83.4, 1.4, 1.4, '#fff', null);
    line(ctx, [P(x - 9, 83), P(x, 77.5), P(x + 9, 82)], INK, lashes ? 3 : 2.2);
    if (lashes) {
      const dir = x < 100 ? -1 : 1;
      line(ctx, [P(x + dir * 7, 81), P(x + dir * 13, 76)], INK, 2.2);
    }
  }
  const browColor = shade(look.brow ?? look.hair, -0.05);
  const weight = look.thickBrows || look.beard ? 7 : lashes ? 3.4 : 4.4;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(101 + dir * 32, 74);
    ctx.quadraticCurveTo(101 + dir * 21, 63, 101 + dir * 8, 71);
    finish(ctx, null, browColor, weight);
  }
  line(ctx, [P(103, 85), P(107, 101), P(103, 104), P(97, 103)], shade(look.skin, -0.25), 2.4);
  if (look.lips) {
    for (const x of [76, 126]) ellipse(ctx, x, 106, 9, 5, 'rgba(235, 90, 90, 0.25)', null);
  }
  if (traits.lines) {
    for (const dir of [-1, 1]) {
      line(ctx, [P(101 + dir * 17, 105), P(101 + dir * 22, 118)], shade(look.skin, -0.2), 1.6);
      line(ctx, [P(101 + dir * 31, 87), P(101 + dir * 36, 90)], shade(look.skin, -0.2), 1.4);
    }
    line(ctx, [P(88, 58), P(101, 56), P(114, 58)], shade(look.skin, -0.16), 1.4);
  }
  if (traits.noseStud) ellipse(ctx, 93.5, 100, 1.8, 1.8, '#f4f8ff', INK, 0.8);
}

function glasses(ctx, color) {
  for (const x of [81, 121]) {
    rrect(ctx, x - 15, 73, 30, 24, 11, 'rgba(210, 235, 255, 0.18)', color, 2.8);
  }
  line(ctx, [P(96, 82), P(101, 79), P(106, 82)], color, 2.6);
  line(ctx, [P(66, 81), P(58, 84)], color, 2.4);
  line(ctx, [P(136, 81), P(144, 84)], color, 2.4);
}

function jewels(ctx, look) {
  const { earrings, necklace } = look;
  if (earrings) {
    for (const x of [58, 143]) {
      if (earrings.type === 'hoop') ellipse(ctx, x, 111, 9, 12, null, earrings.color, 3);
      else if (earrings.type === 'disc') ellipse(ctx, x, 104, 7, 8, earrings.color, INK, 1.4);
      else ellipse(ctx, x, 100, 3, 3, earrings.color, INK, 1);
    }
  }
  if (necklace === 'pearls') {
    for (let i = -6; i <= 6; i++) ellipse(ctx, 100 + i * 4.6, 164 - i * i * 0.42, 2.7, 2.7, '#fffdf4', '#8d8478', 0.9);
  } else if (necklace === 'choker') {
    ctx.beginPath();
    ctx.moveTo(80, 146);
    ctx.quadraticCurveTo(101, 164, 121, 146);
    finish(ctx, null, '#17131c', 4);
    heart(ctx, 101, 164, 7, '#f2c14e');
  }
}

function smallHat(ctx, color) {
  shape(ctx, color, () => {
    ctx.moveTo(70, 46);
    ctx.bezierCurveTo(74, 14, 124, 14, 130, 46);
    ctx.quadraticCurveTo(100, 36, 70, 46);
  });
  line(ctx, [P(78, 38), P(100, 30), P(122, 38)], shade(color, 0.45), 2);
}

// Maglietta bianca con l'orsetto.
function shirt(ctx, look) {
  shape(ctx, look.top, () => {
    ctx.moveTo(20, 222);
    ctx.bezierCurveTo(22, 176, 42, 160, 76, 152);
    ctx.quadraticCurveTo(101, 178, 126, 152);
    ctx.bezierCurveTo(158, 160, 178, 176, 180, 222);
  });
  const fold = shade(look.top, -0.13);
  line(ctx, [P(46, 222), P(50, 195), P(43, 180)], fold, 2.5);
  line(ctx, [P(154, 222), P(150, 195), P(158, 180)], fold, 2.5);
  ctx.beginPath();
  ctx.moveTo(77, 156);
  ctx.quadraticCurveTo(101, 181, 125, 156);
  finish(ctx, null, fold, 3);
  drawBear(ctx, 101, 197, 2.5);
}

// Disegnato su una tela logica 200 x 220.
function bust(ctx, { look, portrait }, parts) {
  const f = FACES[portrait.face] ?? FACES.oval;
  const hair = HAIR[look.style];
  hair.back?.(ctx, look);
  // collo
  shape(ctx, shade(look.skin, -0.12), () => {
    ctx.moveTo(81, 118);
    ctx.lineTo(79, 154);
    ctx.quadraticCurveTo(101, 180, 122, 154);
    ctx.lineTo(120, 118);
  });
  shirt(ctx, look);
  parts.add('bear');
  for (const [x, dir] of [[100 - f.w - 1, -1], [101 + f.w, 1]]) {
    ellipse(ctx, x, 90, 9, 13, look.skin, INK, 2, dir * 0.15);
    line(ctx, [P(x - dir, 84), P(x + dir * 2, 90), P(x - dir, 96)], shade(look.skin, -0.14), 2);
  }
  faceShape(ctx, look, f);
  if (look.beard) beardShape(ctx, look, f);
  mouth(ctx, look, portrait.smile);
  if (look.beard) moustache(ctx, look.beard);
  features(ctx, look, portrait);
  if (look.necklace) jewels(ctx, { necklace: look.necklace });
  hair.front(ctx, look);
  if (look.earrings) jewels(ctx, { earrings: look.earrings });
  if (look.glasses) glasses(ctx, look.glassesColor ?? '#4a3b55');
  if (look.smallHat) {
    smallHat(ctx, look.smallHat);
    parts.add('smallHat');
  }
}

export const PORTRAIT_STYLES = Object.keys(HAIR);

// Ritorna i nomi degli accessori disegnati (utile nelle prove).
export function drawPortrait(canvas, character, { background = true, gear = false } = {}) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const parts = new Set();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (background) {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, '#9fd8e8');
    g.addColorStop(1, '#e9f6d8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
  const s = Math.min(width / 200, height / 220);
  ctx.setTransform(s, 0, 0, s, (width - 200 * s) / 2, height - 220 * s);
  if (gear && character.gear === 'balloons') {
    [[26, 52, 19, 0], [176, 70, 17, 1], [22, 108, 14, 2]].forEach(([x, y, r, i]) => {
      line(ctx, [P(x, y + r), P(x < 100 ? 40 : 164, 200)], '#6b5b52', 1.4);
      drawRoundBalloon(ctx, x, y, r, BALLOON_COLORS[i]);
    });
    parts.add('balloons');
  }
  bust(ctx, character, parts);
  if (gear && character.gear === 'guitar') {
    drawGuitar(ctx, 169, 188, -0.22, { s: 3.1 });
    parts.add('guitar');
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return [...parts];
}
