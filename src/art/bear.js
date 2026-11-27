// L'orsetto sulla nuvola azzurra stampato sulle magliette dei volontari.
import { ellipse, line } from './primitives.js';

const FUR = '#b98250';
const FUR_LIGHT = '#e8c79b';
const OUTLINE = '#6e4526';

// Disegnato in un riquadro di circa 20x20 centrato in (x, y).
export function drawBear(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // nuvola
  for (const [cx, cy, rx, ry] of [[0, 1.5, 10, 7.5], [-6, -2.5, 5.5, 5], [6.5, -1.5, 5, 4.6], [0, -6, 6, 4.5]]) {
    ellipse(ctx, cx, cy, rx, ry, '#bfe3f4', null);
  }
  const part = (cx, cy, rx, ry, fill = FUR) => ellipse(ctx, cx, cy, rx, ry, fill, OUTLINE, 0.6);
  // zampe e corpo
  part(-4.6, 6.4, 2.6, 2.1);
  part(4.6, 6.4, 2.6, 2.1);
  part(0, 3.6, 4.7, 4.5);
  part(-4.6, 2, 1.8, 2.7);
  part(4.6, 2, 1.8, 2.7);
  ellipse(ctx, 0, 4.4, 2.4, 2.6, FUR_LIGHT, null);
  // testa
  part(-3.7, -6.2, 2.1, 2.1);
  part(3.7, -6.2, 2.1, 2.1);
  part(0, -3, 4.8, 4.3);
  ellipse(ctx, 0, -1.4, 2.2, 1.7, FUR_LIGHT, null);
  ellipse(ctx, -1.8, -4, 0.7, 0.8, '#1d120c', null);
  ellipse(ctx, 1.8, -4, 0.7, 0.8, '#1d120c', null);
  ellipse(ctx, 0, -2.1, 0.95, 0.7, '#1d120c', null);
  line(ctx, [{ x: -1, y: -0.5 }, { x: 0, y: -0.1 }, { x: 1, y: -0.5 }], OUTLINE, 0.6);
  ctx.restore();
}
