// Oggetti, costumi ed effetti dei superpoteri. Per ogni mossa si può definire:
//   outfit(look, env) -> modifiche temporanee all'aspetto
//   behind / waist / over (ctx, j, env, parts) -> disegni dietro, sopra il busto, davanti a tutto
import { INK, shade, poly, ellipse, rrect, line, star, heart, finish } from './primitives.js';
import { drawPump, drawGuitar, drawNote, drawBacon, drawBrick, drawWeb, BALLOON_COLORS } from './props.js';
import { P } from './skeleton.js';
import { VANISH } from './superPoses.js';

const GOLD = '#f6c531';

function sparkles(ctx, x, y, radius, t, count = 6, color = '#ffe45c') {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + t * 2.4;
    const k = 0.75 + 0.25 * Math.sin(t * 7 + i * 2);
    star(ctx, x + Math.cos(a) * radius * k, y + Math.sin(a) * radius * k, 2.4 + k * 1.6, color, INK);
  }
}

function notes(ctx, t, spread = 34) {
  for (let i = 0; i < 4; i++) {
    const u = (t * 0.7 + i / 4) % 1;
    const dir = i % 2 ? 1 : -1;
    drawNote(ctx, dir * (spread * 0.7 + u * spread * 0.8), -35 - u * 70, 0.9, BALLOON_COLORS[i]);
  }
}

function apparatus(ctx, pose) {
  if (pose === 'bandiera') {
    ellipse(ctx, -26, 0, 9, 4, '#7b8790');
    rrect(ctx, -28.5, -92, 5, 91, 2, '#c3ced6');
    ellipse(ctx, -26, -92, 4, 4, '#e8483f');
  } else if (pose === 'planche' || pose === 'lsit') {
    const bars = pose === 'planche' ? [[2, -9], [9, -6]] : [[-9, -10], [6, -7]];
    for (const [x, y] of bars) {
      line(ctx, [P(x - 5, 1), P(x - 4, y), P(x + 4, y), P(x + 5, 1)], INK, 4.4);
      line(ctx, [P(x - 5, 1), P(x - 4, y), P(x + 4, y), P(x + 5, 1)], '#e8a23a', 2.4);
    }
  }
}

// Orsacchiotto modellato con palloncini dorati.
function goldenBear(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const bit = (cx, cy, rx, ry, rot = 0) => {
    ellipse(ctx, cx, cy, rx, ry, GOLD, INK, 1.1, rot);
    ellipse(ctx, cx - rx * 0.3, cy - ry * 0.35, rx * 0.22, ry * 0.2, 'rgba(255,255,255,0.8)', null);
  };
  bit(-7, 13, 4.2, 6.5, 0.7);
  bit(7, 13, 4.2, 6.5, -0.7);
  bit(0, 5, 7.5, 9);
  bit(-9, 1, 6.5, 3.4, -0.6);
  bit(9, 1, 6.5, 3.4, 0.6);
  bit(-7, -15, 4, 4);
  bit(7, -15, 4, 4);
  bit(0, -8, 8, 7.5);
  bit(0, -5.5, 3.6, 2.8);
  ellipse(ctx, -3, -10, 1.1, 1.3, INK, null);
  ellipse(ctx, 3, -10, 1.1, 1.3, INK, null);
  ellipse(ctx, 0, -6.5, 1.4, 1, INK, null);
  ctx.restore();
}

function wand(ctx, hand, angle) {
  const tip = P(hand.x + Math.cos(angle) * 17, hand.y + Math.sin(angle) * 17);
  line(ctx, [hand, tip], INK, 4);
  line(ctx, [hand, tip], '#241f2e', 2.4);
  line(ctx, [P(hand.x + Math.cos(angle) * 13, hand.y + Math.sin(angle) * 13), tip], '#ffffff', 2.4);
  return tip;
}

function vanishing(item) {
  return {
    over(ctx, j, { t, p }, parts) {
      const held = P(j.b.ha.x + 7, j.b.ha.y - 4);
      if (p < VANISH.show) return;
      if (p < VANISH.gone) {
        item(ctx, held.x, held.y, t);
        parts.add(item.part);
      }
      if (p >= VANISH.gone) {
        const k = Math.min(1, (p - VANISH.gone) / 0.14);
        if (k < 1) {
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            ellipse(ctx, held.x + Math.cos(a) * k * 13, held.y + Math.sin(a) * k * 13, 5 * (1 - k) + 1, 5 * (1 - k) + 1, '#ffffff', '#b9b4cc', 0.8);
          }
        }
        sparkles(ctx, held.x, held.y, 14, t, 5);
      }
      if (p >= VANISH.wand) {
        const angle = p < VANISH.gone ? -0.45 + Math.sin(t * 11) * 0.3 : -1.9;
        const tip = wand(ctx, j.a.ha, angle);
        parts.add('wand');
        star(ctx, tip.x, tip.y, 3, '#ffe45c', INK);
      }
    },
  };
}

const bacon = (ctx, x, y) => {
  drawBacon(ctx, x, y - 3, -0.35, 1.1);
  drawBacon(ctx, x + 1, y + 3, -0.1, 1.1);
};
bacon.part = 'bacon';
const brick = (ctx, x, y) => drawBrick(ctx, x, y, 1.15);
brick.part = 'lego';

function webLine(ctx, from, to, k) {
  const end = P(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k);
  line(ctx, [from, end], INK, 3);
  line(ctx, [from, end], '#ffffff', 1.4);
  if (k >= 1) drawWeb(ctx, end.x, end.y, 11);
}

const calisthenics = (pose) => ({ behind: (ctx) => apparatus(ctx, pose) });

export const SUPER_ART = {
  verticale: calisthenics('verticale'),
  planche: calisthenics('planche'),
  lsit: calisthenics('lsit'),
  bandiera: calisthenics('bandiera'),

  orsoDorato: {
    over(ctx, j, { t, p }, parts) {
      if (p < 0.45) {
        const k = p / 0.45;
        const { x, y } = j.b.ha;
        drawPump(ctx, x - 1, y + 1, 0, j.a.ha.y - (y - 16));
        const tube = [P(x + 1, y + 12), P(x + 7 + k * 22, y + 11 - k * 7)];
        line(ctx, tube, INK, 5 + k * 6);
        line(ctx, tube, GOLD, 3 + k * 6);
        parts.add('pump');
        return;
      }
      const grow = Math.min(1, (p - 0.45) / 0.25);
      const x = j.b.ha.x + 18;
      const y = j.b.ha.y - 12 + Math.sin(t * 3) * 2;
      sparkles(ctx, x, y, 30, t, 7);
      goldenBear(ctx, x, y, 0.5 + grow * 0.75);
      parts.add('goldenBear');
    },
  },

  pancettaSparisce: vanishing(bacon),
  legoSparisce: vanishing(brick),

  pancettaLancio: {
    over(ctx, j, { t, p }, parts) {
      if (p < 0.18) return;
      parts.add('bacon');
      for (const hand of [j.a.ha, j.b.ha]) drawBacon(ctx, hand.x, hand.y - 3, -0.4, 0.85);
      for (let i = 0; i < 6; i++) {
        const u = (t * 0.9 + i / 6) % 1;
        const dir = i % 2 ? 1 : -1;
        drawBacon(ctx, dir * (20 + u * 62), -50 - Math.sin(u * Math.PI) * 38 + u * 32, dir * u * 7, 0.95);
      }
    },
  },

  rutto: {
    over(ctx, j, { p }, parts) {
      if (p < 0.35 || p >= 0.72) return;
      const k = (p - 0.35) / 0.37;
      const mouth = P(j.head.x + 9, j.head.y + 5);
      parts.add('burp');
      for (let i = 0; i < 4; i++) {
        const u = (k * 2.2 + i / 4) % 1;
        ellipse(ctx, mouth.x + 6 + u * 44, mouth.y - u * 14 + Math.sin(i * 3) * 6, 3 + u * 8, 3 + u * 7, 'rgba(160, 214, 92, 0.75)', '#5d8f2f', 1);
      }
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(mouth.x, mouth.y, 10 + i * 9 + k * 12, -0.55, 0.45);
        finish(ctx, null, '#5d8f2f', 2);
      }
    },
  },

  shakira: {
    behind(ctx, j, env, parts) {
      parts.add('box');
      poly(ctx, [P(-17, -13), P(-9, -19), P(24, -19), P(16, -13)], '#e2b878');
      rrect(ctx, -17, -13, 33, 15, 1, '#c9964f');
      poly(ctx, [P(16, -13), P(24, -19), P(24, -4), P(16, 2)], '#a97a3d');
      rrect(ctx, -3, -13, 6, 15, 0, '#e8d3a8', INK, 0.6);
    },
    // cintura di monete che segue i fianchi
    waist(ctx, j) {
      const { x, y } = j.hip;
      line(ctx, [P(x - 8.5, y - 3), P(x, y + 1), P(x + 8.5, y - 3)], '#b4318c', 3.4);
      for (let i = -3; i <= 3; i++) ellipse(ctx, x + i * 2.6, y + 3.5 - Math.abs(i) * 1.1, 1.3, 1.5, GOLD, INK, 0.6);
    },
    over: (ctx, j, { t }) => notes(ctx, t),
  },

  danza: {
    waist(ctx, j, env, parts) {
      const { x, y } = j.hip;
      parts.add('tutu');
      for (const [dy, w, color] of [[1.5, 18, '#f59ac0'], [-1, 15, '#ffc2da']]) {
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 5);
        ctx.lineTo(x + 6, y - 5);
        for (let i = 0; i <= 8; i++) ctx.lineTo(x + w - (i * w) / 4, y + dy + (i % 2 ? 4 : 1));
        ctx.closePath();
        finish(ctx, color, INK, 0.9);
      }
    },
    over: (ctx, j, { t }) => sparkles(ctx, j.hip.x, -48, 42, t * 0.5, 5, '#ffd9ec'),
  },

  artigli: {
    // le unghie crescono, restano lunghe e alla fine si ritirano
    outfit: (look, { p }) => ({ claws: 19 * Math.max(0, Math.min(1, (p - 0.12) / 0.25, (0.97 - p) / 0.1)) }),
    over(ctx, j, { t, p }) {
      if (p < 0.35 || Math.floor(t * 2) % 2) return;
      for (let i = 0; i < 3; i++) {
        line(ctx, [P(30 + i * 6, -72), P(46 + i * 6, -52), P(48 + i * 6, -34)], '#ffffff', 2);
      }
    },
  },

  trucco: {
    outfit: (look, { p }) => ({
      lips: p > 0.2 ? '#e0123a' : look.lips,
      blush: p > 0.55,
      eyeshadow: p > 0.82 ? '#7b4fd0' : null,
    }),
    over(ctx, j, { t, p }, parts) {
      parts.add('makeup');
      const a = j.a.ha;
      // specchietto
      ellipse(ctx, a.x - 2, a.y - 6, 6.5, 6.5, '#e86aa6');
      ellipse(ctx, a.x - 2, a.y - 6, 4.4, 4.4, '#cdeefa', INK, 0.8);
      line(ctx, [P(a.x - 4, a.y - 6), P(a.x - 1, a.y - 9)], '#ffffff', 1.2);
      const { x, y } = j.b.ha;
      const target = p < 0.4 ? P(j.head.x + 6, j.head.y + 7) : p < 0.7 ? P(j.head.x + 9, j.head.y + 3) : P(j.head.x + 9, j.head.y);
      const mid = P(x + (target.x - x) * 0.55, y + (target.y - y) * 0.55);
      line(ctx, [P(x, y), mid], INK, 4.2);
      line(ctx, [P(x, y), mid], p < 0.4 ? GOLD : p < 0.7 ? '#b4318c' : '#2d2a33', 2.4);
      if (p < 0.4) line(ctx, [mid, target], '#e0123a', 3);
      else if (p < 0.7) ellipse(ctx, target.x, target.y, 2.8, 2.8, '#f7a1a8', INK, 0.7);
      else line(ctx, [mid, target], '#3b2418', 1.4);
      sparkles(ctx, 0, -66, 30, t * 0.4, 3, '#ffb7d5');
    },
  },

  abito: {
    outfit: (look, { p }) =>
      p < 0.14 ? {} : { topStyle: 'gown', top: '#9c1f5c', bear: false, bumbag: null, tiara: true, shoes: '#d9b13b', earrings: { type: 'disc', color: GOLD } },
    over(ctx, j, { t, p }) {
      const k = p < 0.3 ? 1 : 0.35;
      sparkles(ctx, 0, -42, 26 + k * 14, t, p < 0.3 ? 10 : 4);
    },
  },

  giocoleria: {
    over(ctx, j, { t }, parts) {
      parts.add('balls');
      const left = j.a.ha;
      const right = j.b.ha;
      for (let i = 0; i < 4; i++) {
        const u = (t * 0.85 + i / 4) % 1;
        const rising = u < 0.5;
        const v = (u % 0.5) * 2;
        const [from, to] = rising ? [left, right] : [right, left];
        const x = from.x + (to.x - from.x) * v;
        const y = from.y + (to.y - from.y) * v - 3 - Math.sin(v * Math.PI) * (rising ? 70 : 54);
        ellipse(ctx, x, y, 4.6, 4.6, BALLOON_COLORS[i]);
        ellipse(ctx, x - 1.4, y - 1.6, 1.3, 1.3, 'rgba(255,255,255,0.75)', null);
      }
    },
  },

  boxe: {
    outfit: () => ({ gloves: '#d62828', shorts: '#c61f2a', headband: '#d62828', belt: false }),
    waist(ctx, j) {
      const { x, y } = j.hip;
      line(ctx, [P(x - 7, y - 4), P(x + 7, y - 4)], '#ffffff', 3);
    },
    over(ctx, j) {
      if (!j.punch) return;
      const hand = j[j.punch].ha;
      star(ctx, hand.x + 14, hand.y - 1, 8, '#ffe45c', INK);
      for (const dy of [-8, 8]) line(ctx, [P(hand.x + 4, hand.y + dy), P(hand.x + 16, hand.y + dy * 1.5)], '#ffffff', 2);
    },
  },

  spider: {
    outfit: () => ({
      topStyle: 'spider', top: '#d3202c', bottom: '#1f4fa8', shoes: '#d3202c', gloves: '#d3202c',
      mask: '#d3202c', bear: false, belt: false,
    }),
    behind(ctx, j, { p }) {
      if (j.trick !== 'hang') return;
      line(ctx, [P(0, -150), P(0, -83)], INK, 3.2);
      line(ctx, [P(0, -150), P(0, -83)], '#ffffff', 1.5);
      if (p > 0.6) drawWeb(ctx, 0, -146, 14);
    },
    over(ctx, j, { p }, parts) {
      parts.add('web');
      if (j.trick === 'shoot') webLine(ctx, j.b.ha, P(78, -108), Math.min(1, p / 0.18));
      else if (j.trick === 'crouch') webLine(ctx, j.b.ha, P(76, -26), Math.min(1, (p - 0.28) / 0.12));
      else if (j.trick === 'double') {
        const k = Math.min(1, (p - 0.76) / 0.12);
        webLine(ctx, j.a.ha, P(-76, -104), k);
        webLine(ctx, j.b.ha, P(76, -104), k);
      }
    },
  },

  rock: {
    outfit(look, { t }) {
      const colors = ['#ff2d95', '#19d3ff', '#8bff3a', '#ffb000', '#a855ff'];
      const first = Math.floor(t * 3) % colors.length;
      return {
        style: 'rock',
        hair: colors[first],
        streaks: colors.map((_, i) => colors[(first + i + 1) % colors.length]),
        brow: look.hair,
        jacket: '#221d2b',
        shades: true,
      };
    },
    behind(ctx, j, { t }) {
      // fari colorati
      [[-52, '#ff2d95'], [52, '#19d3ff']].forEach(([x, color], i) => {
        if (Math.floor(t * 4 + i) % 2) return;
        ctx.save();
        ctx.globalAlpha = 0.3;
        poly(ctx, [P(x, -140), P(x * 0.1 - 14, 0), P(x * 0.1 + 14, 0)], color, null);
        ctx.restore();
      });
    },
    waist(ctx, j, env, parts) {
      drawGuitar(ctx, j.hip.x - 4, j.hip.y + 4, 1.12, { electric: true });
      parts.add('guitar');
    },
    over(ctx, j, { t }) {
      notes(ctx, t * 1.5, 38);
      if (Math.floor(t * 6) % 2) {
        poly(ctx, [P(44, -92), P(36, -76), P(42, -76), P(37, -62), P(50, -80), P(44, -80), P(49, -92)], '#ffe45c', INK, 1);
      }
    },
  },

  selfie: {
    over(ctx, j, { t }, parts) {
      parts.add('phone');
      const { x, y } = j.b.ha;
      ctx.save();
      ctx.translate(x + 3, y - 5);
      ctx.rotate(0.12);
      rrect(ctx, -6, -10, 12, 20, 2.5, '#2a2c38');
      rrect(ctx, -4.5, -8, 9, 15, 1, '#aee3f5', INK, 0.6);
      ellipse(ctx, 0, -2, 2.8, 3, shade('#e6b08a', 0.05), INK, 0.6);
      ellipse(ctx, 0, 5, 3.6, 2.2, '#ffffff', INK, 0.6);
      ellipse(ctx, 0, 8.5, 0.9, 0.9, '#d9dde3', null);
      ctx.restore();
      if (t % 1.4 > 1.15) {
        star(ctx, x - 3, y - 17, 11, '#ffffff', '#ffd21f');
        sparkles(ctx, x - 3, y - 17, 20, t, 5, '#ffffff');
      } else if (t % 1.4 < 0.7) {
        heart(ctx, x + 14, y - 18 - (t % 1.4) * 14, 4, '#ef5b6c');
      }
    },
  },
};
