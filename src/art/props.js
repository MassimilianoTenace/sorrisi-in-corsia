// Oggetti piccoli: giochi, palloncini e pompetta.
import { INK, shade, poly, ellipse, rrect, line, heart } from './primitives.js';

export const TOY_IDS = ['peluche', 'libro', 'costruzioni', 'pennarelli', 'marionetta', 'macchinina'];
export const BALLOON_COLORS = ['#ef4b4b', '#3f8fe8', '#ffc928', '#52bd5a', '#b45fd6', '#ff8a2b'];
export const SHAPES = ['cane', 'spada', 'fiore', 'giraffa', 'cuore'];

// Disegnati in un riquadro di circa 20x20 centrato in (x, y).
export function drawToy(ctx, id, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (id === 'peluche') {
    ellipse(ctx, -6, -8, 3.5, 3.5, '#b9793f');
    ellipse(ctx, 6, -8, 3.5, 3.5, '#b9793f');
    ellipse(ctx, 0, 5, 6.5, 6, '#b9793f');
    ellipse(ctx, 0, -3, 7.5, 6.5, '#c98a4c');
    ellipse(ctx, 0, -0.5, 3.5, 2.8, '#f0cfa2', null);
    ellipse(ctx, 0, -1.5, 1.4, 1, INK, null);
    ellipse(ctx, -3, -5, 1, 1, INK, null);
    ellipse(ctx, 3, -5, 1, 1, INK, null);
  } else if (id === 'libro') {
    poly(ctx, [{ x: -9, y: -7 }, { x: 0, y: -4 }, { x: 0, y: 9 }, { x: -9, y: 6 }], '#e5554f');
    poly(ctx, [{ x: 9, y: -7 }, { x: 0, y: -4 }, { x: 0, y: 9 }, { x: 9, y: 6 }], '#c63f3a');
    poly(ctx, [{ x: -7.5, y: -7.5 }, { x: 0, y: -5 }, { x: 0, y: 6 }, { x: -7.5, y: 3.5 }], '#fff8e4', INK, 0.8);
    poly(ctx, [{ x: 7.5, y: -7.5 }, { x: 0, y: -5 }, { x: 0, y: 6 }, { x: 7.5, y: 3.5 }], '#fff1cf', INK, 0.8);
    line(ctx, [{ x: -5.5, y: -3 }, { x: -2, y: -2 }], '#8b7a6a', 1);
    line(ctx, [{ x: -5.5, y: 0 }, { x: -2, y: 1 }], '#8b7a6a', 1);
  } else if (id === 'costruzioni') {
    rrect(ctx, -9, 1, 9, 8, 1, '#e8483f');
    rrect(ctx, 0, 1, 9, 8, 1, '#3d82e0');
    rrect(ctx, -4.5, -7, 9, 8, 1, '#ffc928');
    for (const bx of [-2.5, 2.5]) rrect(ctx, bx - 1.5, -9.5, 3, 2.5, 0.8, '#ffc928');
  } else if (id === 'pennarelli') {
    ['#e8483f', '#3d82e0', '#52bd5a', '#ffc928'].forEach((color, i) => {
      const px = -8.5 + i * 4.5;
      rrect(ctx, px, -6, 4, 14, 1.2, color);
      poly(ctx, [{ x: px + 0.5, y: -6 }, { x: px + 2, y: -10 }, { x: px + 3.5, y: -6 }], shade(color, -0.25));
    });
  } else if (id === 'marionetta') {
    poly(ctx, [{ x: -6, y: 9 }, { x: -5, y: -1 }, { x: 5, y: -1 }, { x: 6, y: 9 }], '#6c5ad6');
    ellipse(ctx, -7, 2, 2.5, 2, '#f5c9a2');
    ellipse(ctx, 7, 2, 2.5, 2, '#f5c9a2');
    ellipse(ctx, 0, -4, 5, 5, '#f5c9a2');
    poly(ctx, [{ x: -6, y: -6 }, { x: 0, y: -13 }, { x: 6, y: -6 }], '#e8483f');
    ellipse(ctx, 0, -13, 1.8, 1.8, '#ffc928');
    ellipse(ctx, -2, -4, 0.9, 0.9, INK, null);
    ellipse(ctx, 2, -4, 0.9, 0.9, INK, null);
    ellipse(ctx, 0, -2, 1.3, 1.3, '#e8483f', null);
  } else if (id === 'macchinina') {
    poly(ctx, [{ x: -5, y: -1 }, { x: -3, y: -7 }, { x: 4, y: -7 }, { x: 7, y: -1 }], '#ff6a3d');
    poly(ctx, [{ x: -2.5, y: -2 }, { x: -1.5, y: -5.5 }, { x: 3, y: -5.5 }, { x: 5, y: -2 }], '#bfe8f5', INK, 0.8);
    rrect(ctx, -10, -1.5, 20, 7, 3, '#ff6a3d');
    for (const wx of [-5.5, 5.5]) {
      ellipse(ctx, wx, 6, 3.4, 3.4, '#333');
      ellipse(ctx, wx, 6, 1.3, 1.3, '#ccc', null);
    }
  }
  ctx.restore();
}

export function drawRoundBalloon(ctx, x, y, r, color) {
  ellipse(ctx, x, y, r * 0.85, r, color);
  poly(ctx, [{ x: x - 2, y: y + r + 2.5 }, { x, y: y + r - 0.5 }, { x: x + 2, y: y + r + 2.5 }], color, INK, 0.8);
  ellipse(ctx, x - r * 0.32, y - r * 0.38, r * 0.18, r * 0.3, 'rgba(255,255,255,0.7)', null, 1, 0.5);
}

// Un palloncino lungo "a salsiccia" tra i punti dati.
function tube(ctx, pts, color, width = 6) {
  line(ctx, pts, INK, width + 2);
  line(ctx, pts, color, width);
  line(ctx, pts.slice(0, 2).map((p) => ({ x: p.x - 0.8, y: p.y - 1.2 })), 'rgba(255,255,255,0.45)', width * 0.25);
}

function segment(ctx, a, b, color, w = 6) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  ellipse(ctx, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len / 2 + 0.8, w / 2, color, INK, 1.1, Math.atan2(dy, dx));
}

// Figura di palloncino centrata in (x, y), circa 30x30.
export function drawBalloonShape(ctx, shape, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const seg = (a, b, w) => segment(ctx, a, b, color, w);
  if (shape === 'cane') {
    seg([-8, 3], [-9, 13]); seg([-4, 3], [-3, 13]); seg([6, 3], [5, 13]); seg([10, 3], [11, 13]);
    seg([-6, 2], [8, 2], 8); seg([-12, -2], [-15, 3]); seg([-6, 1], [-8, -7]);
    seg([-8, -8], [-16, -7]); seg([-8, -9], [-4, -16]); seg([-9, -9], [-12, -16]); seg([9, 1], [14, -7], 5);
  } else if (shape === 'spada') {
    tube(ctx, [{ x: -1, y: 5 }, { x: 10, y: -17 }], color);
    seg([-9, -1], [0, 5]); seg([0, 5], [8, 11]); seg([-2, 7], [-7, 16]);
  } else if (shape === 'fiore') {
    tube(ctx, [{ x: 0, y: 2 }, { x: 1, y: 17 }], '#4cae52', 4);
    segment(ctx, [1, 12], [10, 8], '#4cae52', 5);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      seg([Math.cos(a) * 3, Math.sin(a) * 3 - 6], [Math.cos(a) * 13, Math.sin(a) * 13 - 6], 7);
    }
    ellipse(ctx, 0, -6, 4, 4, '#ffd83d');
  } else if (shape === 'giraffa') {
    seg([-7, 6], [-10, 17]); seg([-3, 6], [-3, 17]); seg([5, 6], [5, 17]); seg([9, 6], [12, 17]);
    seg([-6, 5], [8, 5], 7); tube(ctx, [{ x: -5, y: 3 }, { x: -9, y: -14 }], color);
    seg([-9, -15], [-16, -12]); seg([-9, -16], [-8, -21], 3); seg([-11, -16], [-13, -21], 3);
  } else {
    heart(ctx, 0, 0, 13, null, INK);
    ctx.lineWidth = 7.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  ctx.restore();
}

// Pompetta a mano; (x, y) è l'impugnatura centrale del cilindro.
export function drawPump(ctx, x, y, angle = 0, push = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  line(ctx, [{ x: 0, y: -9 }, { x: 0, y: -15 + push }], INK, 3.4);
  line(ctx, [{ x: 0, y: -9 }, { x: 0, y: -15 + push }], '#cfd6dd', 1.8);
  rrect(ctx, -5, -17.5 + push, 10, 3.6, 1.5, '#2d5fb8');
  rrect(ctx, -3.6, -10, 7.2, 19, 2.5, '#ffd028');
  rrect(ctx, -4.4, -10.5, 8.8, 3.4, 1.2, '#2d5fb8');
  rrect(ctx, -1.8, 8.5, 3.6, 4, 1, '#2d5fb8');
  ctx.restore();
}
