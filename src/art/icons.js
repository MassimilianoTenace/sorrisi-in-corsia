// Icone dei pulsanti, disegnate con lo stesso stile del gioco.
import { INK, ellipse, line, rrect, poly, heart } from './primitives.js';
import { drawToy, drawRoundBalloon, drawPump, drawGuitar } from './props.js';

const P = (x, y) => ({ x, y });

// Tela logica 32 x 32.
const ICONS = {
  balloon(c) {
    line(c, [P(12, 20), P(16, 30)], '#6b5b52', 1);
    line(c, [P(23, 18), P(16, 30)], '#6b5b52', 1);
    drawRoundBalloon(c, 11, 11, 9, '#ef4b4b');
    drawRoundBalloon(c, 22, 10, 8, '#3f8fe8');
  },
  guitar: (c) => drawGuitar(c, 13, 20, 0.75, { s: 0.85 }),
  toy: (c) => drawToy(c, 'peluche', 16, 17, 1.5),
  invite(c) {
    for (const [x, color] of [[10, '#ffb12b'], [22, '#52bd5a']]) {
      rrect(c, x - 6, 16, 12, 13, 5, color);
      ellipse(c, x, 11, 6, 6, '#f4c49c');
      ellipse(c, x - 2, 10.5, 0.9, 0.9, INK, null);
      ellipse(c, x + 2, 10.5, 0.9, 0.9, INK, null);
      line(c, [P(x - 2, 13.5), P(x, 14.5), P(x + 2, 13.5)], INK, 1);
    }
  },
  back(c) {
    rrect(c, 3, 16, 26, 8, 2, '#6c7ae0');
    rrect(c, 3, 8, 4, 20, 1.5, '#4c59b5');
    rrect(c, 7, 13, 8, 5, 2.5, '#fff');
    rrect(c, 25, 14, 4, 14, 1.5, '#4c59b5');
  },
  play(c) {
    drawToy(c, 'costruzioni', 11, 18, 1.1);
    drawRoundBalloon(c, 24, 11, 7, '#ffc928');
  },
  super(c) {
    poly(c, [P(19, 1), P(6, 18), P(14, 18), P(11, 31), P(26, 12), P(17, 12), P(23, 1)], '#ffd72e', INK, 1.4);
  },
  center(c) {
    ellipse(c, 16, 16, 9, 9, null, INK, 2.4);
    ellipse(c, 16, 16, 3, 3, '#e8483f');
    for (const [a, b] of [[P(16, 2), P(16, 8)], [P(16, 24), P(16, 30)], [P(2, 16), P(8, 16)], [P(24, 16), P(30, 16)]]) {
      line(c, [a, b], INK, 2.4);
    }
  },
  soundOn(c) {
    poly(c, [P(4, 12), P(10, 12), P(18, 5), P(18, 27), P(10, 20), P(4, 20)], '#f4f4f4', INK, 1.6);
    for (const r of [5, 10]) {
      c.beginPath();
      c.arc(19, 16, r, -0.9, 0.9);
      c.strokeStyle = INK;
      c.lineWidth = 2.2;
      c.stroke();
    }
  },
  soundOff(c) {
    poly(c, [P(4, 12), P(10, 12), P(18, 5), P(18, 27), P(10, 20), P(4, 20)], '#f4f4f4', INK, 1.6);
    line(c, [P(22, 11), P(30, 21)], '#d8362e', 3);
    line(c, [P(30, 11), P(22, 21)], '#d8362e', 3);
  },
  help(c) {
    c.font = 'bold 28px "Trebuchet MS", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineWidth = 3;
    c.strokeStyle = INK;
    c.strokeText('?', 16, 17);
    c.fillStyle = '#ffd72e';
    c.fillText('?', 16, 17);
  },
  pump: (c) => drawPump(c, 16, 18, 0.25),
  heart: (c) => heart(c, 16, 16, 12, '#ef5b6c'),
};

export function icon(name, size = 32) {
  const canvas = document.createElement('canvas');
  const ratio = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = size * ratio;
  canvas.height = size * ratio;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale((size * ratio) / 32, (size * ratio) / 32);
  ICONS[name](ctx);
  return canvas;
}

export function toyIcon(id, size = 56) {
  const canvas = document.createElement('canvas');
  const ratio = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = size * ratio;
  canvas.height = size * ratio;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale((size * ratio) / 28, (size * ratio) / 28);
  drawToy(ctx, id, 14, 14, 1.1);
  return canvas;
}
