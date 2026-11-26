import { toScreen } from '../engine/iso.js';

export const INK = '#2b1c18';

// Schiarisce (amount > 0) o scurisce (amount < 0) un colore #rrggbb.
export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const target = amount < 0 ? 0 : 255;
  const k = Math.abs(amount);
  const mix = (c) => Math.round(c + (target - c) * k);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function finish(ctx, fill, stroke = INK, width = 1.2) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

export function poly(ctx, pts, fill, stroke = INK, width = 1.2) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  finish(ctx, fill, stroke, width);
}

export function ellipse(ctx, x, y, rx, ry, fill, stroke = INK, width = 1.2, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  finish(ctx, fill, stroke, width);
}

export function rrect(ctx, x, y, w, h, r, fill, stroke = INK, width = 1.2) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  finish(ctx, fill, stroke, width);
}

export function line(ctx, pts, color = INK, width = 1.2) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// Rettangolo sul pavimento (o a quota z).
export function isoRect(ctx, x, y, w, d, fill, stroke = null, z = 0) {
  poly(
    ctx,
    [toScreen(x, y, z), toScreen(x + w, y, z), toScreen(x + w, y + d, z), toScreen(x, y + d, z)],
    fill,
    stroke,
  );
}

// Parallelepipedo: si vedono il piano, il lato sud (a sinistra) e il lato est (a destra).
export function isoBox(ctx, x, y, w, d, z, h, color, opts = {}) {
  const { top = shade(color, 0.18), left = color, right = shade(color, -0.2), stroke = INK } = opts;
  const x1 = x + w;
  const y1 = y + d;
  poly(ctx, [toScreen(x, y1, z), toScreen(x1, y1, z), toScreen(x1, y1, z + h), toScreen(x, y1, z + h)], left, stroke);
  poly(ctx, [toScreen(x1, y, z), toScreen(x1, y1, z), toScreen(x1, y1, z + h), toScreen(x1, y, z + h)], right, stroke);
  isoRect(ctx, x, y, w, d, top, stroke, z + h);
}

// Disegna in coordinate "di facciata": u lungo la parete (32 = una casella), v verso l'alto negativo.
export function onFaceY(ctx, x, y, z, fn) {
  const o = toScreen(x, y, z);
  ctx.save();
  ctx.transform(1, 0.5, 0, 1, o.x, o.y);
  fn(ctx);
  ctx.restore();
}

// Facciata a x costante; (x, y) è il suo estremo sud, u cresce verso nord.
export function onFaceX(ctx, x, y, z, fn) {
  const o = toScreen(x, y, z);
  ctx.save();
  ctx.transform(1, -0.5, 0, 1, o.x, o.y);
  fn(ctx);
  ctx.restore();
}

export function onFloor(ctx, x, y, fn) {
  const o = toScreen(x, y, 0);
  ctx.save();
  ctx.transform(1, 0.5, -1, 0.5, o.x, o.y);
  fn(ctx);
  ctx.restore();
}

export function shadow(ctx, x, y, rx, ry = rx / 2, alpha = 0.22) {
  ellipse(ctx, x, y, rx, ry, `rgba(30, 20, 20, ${alpha})`, null);
}

export function star(ctx, x, y, r, fill, stroke = null) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const k = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
  }
  ctx.closePath();
  finish(ctx, fill, stroke, 1);
}

export function heart(ctx, x, y, r, fill, stroke = INK) {
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.bezierCurveTo(x - r * 1.5, y, x - r, y - r * 1.2, x, y - r * 0.45);
  ctx.bezierCurveTo(x + r, y - r * 1.2, x + r * 1.5, y, x, y + r);
  ctx.closePath();
  finish(ctx, fill, stroke, 1.2);
}
