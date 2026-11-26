// Ritratti grandi (mezzo busto) per la scelta del personaggio e il pannello di gioco.
import { INK, poly, ellipse, line, finish } from './primitives.js';
import { drawRoundBalloon, BALLOON_COLORS } from './props.js';

function shape(ctx, fill, build, stroke = INK, width = 2.2) {
  ctx.beginPath();
  build();
  ctx.closePath();
  finish(ctx, fill, stroke, width);
}

const P = (x, y) => ({ x, y });

// Disegnato su una tela logica 200 x 220.
function lorenzo(ctx) {
  const skin = '#e5ac81';
  const skinShade = '#cd9068';
  const hair = '#221614';
  const hairLight = '#4a322a';
  const beard = '#2f1f19';
  const shirt = '#f7cfd3';
  const shirtShade = '#e5b0b8';
  const shirtLight = '#fde5e7';

  // camicia di lino rosa
  shape(ctx, shirt, () => {
    ctx.moveTo(20, 222);
    ctx.bezierCurveTo(22, 176, 42, 160, 74, 150);
    ctx.lineTo(126, 150);
    ctx.bezierCurveTo(158, 160, 178, 176, 180, 222);
  });
  line(ctx, [P(48, 222), P(52, 190), P(46, 175)], shirtShade, 2.5);
  line(ctx, [P(152, 222), P(148, 192), P(156, 176)], shirtShade, 2.5);

  // collo
  shape(ctx, skinShade, () => {
    ctx.moveTo(80, 118);
    ctx.lineTo(78, 152);
    ctx.quadraticCurveTo(88, 174, 101, 190);
    ctx.quadraticCurveTo(114, 172, 123, 150);
    ctx.lineTo(120, 118);
  });
  // colletto aperto
  shape(ctx, shirtLight, () => {
    ctx.moveTo(80, 138);
    ctx.lineTo(101, 190);
    ctx.lineTo(80, 184);
    ctx.lineTo(62, 154);
  });
  shape(ctx, shirtLight, () => {
    ctx.moveTo(121, 138);
    ctx.lineTo(101, 190);
    ctx.lineTo(124, 182);
    ctx.lineTo(139, 153);
  });
  line(ctx, [P(101, 190), P(102, 222)], shirtShade, 2.5);
  ellipse(ctx, 108, 202, 2.2, 2.2, '#fff', '#b98890', 1);
  ellipse(ctx, 108, 218, 2.2, 2.2, '#fff', '#b98890', 1);

  // orecchie
  for (const [x, dir] of [[58, -1], [143, 1]]) {
    ellipse(ctx, x, 90, 9, 13, skin, INK, 2, dir * 0.15);
    line(ctx, [P(x - dir, 84), P(x + dir * 2, 90), P(x - dir, 96)], skinShade, 2);
  }

  // viso con mascella squadrata
  shape(ctx, skin, () => {
    ctx.moveTo(61, 72);
    ctx.bezierCurveTo(61, 36, 140, 36, 140, 72);
    ctx.bezierCurveTo(142, 98, 138, 112, 130, 126);
    ctx.bezierCurveTo(120, 140, 110, 146, 101, 146);
    ctx.bezierCurveTo(92, 146, 80, 140, 71, 126);
    ctx.bezierCurveTo(62, 112, 59, 98, 61, 72);
  });

  // barba corta e curata
  shape(ctx, beard, () => {
    ctx.moveTo(62, 90);
    ctx.bezierCurveTo(63, 112, 69, 125, 78, 134);
    ctx.bezierCurveTo(90, 148, 112, 148, 124, 134);
    ctx.bezierCurveTo(133, 125, 139, 112, 140, 90);
    ctx.lineTo(135.5, 102);
    ctx.bezierCurveTo(131, 117, 122, 117, 116, 112);
    ctx.bezierCurveTo(108, 106, 94, 106, 86, 112);
    ctx.bezierCurveTo(80, 117, 71, 117, 66.5, 102);
  }, INK, 1.4);
  // bocca sorridente e baffi
  shape(ctx, '#8e3b40', () => {
    ctx.moveTo(86, 117);
    ctx.quadraticCurveTo(101, 135, 116, 117);
    ctx.quadraticCurveTo(101, 121, 86, 117);
  }, INK, 1.6);
  shape(ctx, '#fff', () => {
    ctx.moveTo(90, 119);
    ctx.quadraticCurveTo(101, 122, 112, 119);
    ctx.quadraticCurveTo(101, 128, 90, 119);
  }, null);
  shape(ctx, beard, () => {
    ctx.moveTo(81, 117);
    ctx.quadraticCurveTo(90, 106, 101, 111);
    ctx.quadraticCurveTo(112, 106, 121, 117);
    ctx.quadraticCurveTo(110, 114, 101, 117);
    ctx.quadraticCurveTo(92, 114, 81, 117);
  }, INK, 1.2);

  // occhi
  for (const x of [82, 120]) {
    ellipse(ctx, x, 84, 8.5, 6.5, '#fff', INK, 1.4);
    ellipse(ctx, x + 1, 84.5, 4.6, 5, '#4a2c1c', null);
    ellipse(ctx, x + 1, 84.5, 2.2, 2.4, '#140a06', null);
    ellipse(ctx, x + 2.8, 82.4, 1.4, 1.4, '#fff', null);
    line(ctx, [P(x - 9, 82), P(x, 76.5), P(x + 9, 81)], INK, 2.2);
  }
  // sopracciglia folte
  shape(ctx, hair, () => {
    ctx.moveTo(68, 74);
    ctx.quadraticCurveTo(80, 62, 95, 70);
    ctx.lineTo(94, 74);
    ctx.quadraticCurveTo(81, 69, 69, 77);
  }, null);
  shape(ctx, hair, () => {
    ctx.moveTo(134, 74);
    ctx.quadraticCurveTo(121, 62, 107, 70);
    ctx.lineTo(108, 74);
    ctx.quadraticCurveTo(121, 69, 133, 77);
  }, null);
  // naso
  line(ctx, [P(103, 84), P(107, 101), P(103, 104), P(97, 103)], '#b87752', 2.4);

  // lati sfumati
  shape(ctx, hairLight, () => {
    ctx.moveTo(60, 88);
    ctx.bezierCurveTo(54, 66, 56, 48, 70, 40);
    ctx.lineTo(73, 56);
    ctx.quadraticCurveTo(66, 66, 66, 88);
  }, null);
  shape(ctx, hairLight, () => {
    ctx.moveTo(141, 88);
    ctx.bezierCurveTo(147, 66, 146, 50, 132, 40);
    ctx.lineTo(130, 56);
    ctx.quadraticCurveTo(136, 66, 135, 88);
  }, null);
  // ciuffo voluminoso pettinato di lato
  shape(ctx, hair, () => {
    ctx.moveTo(63, 66);
    ctx.bezierCurveTo(50, 36, 70, 18, 94, 20);
    ctx.bezierCurveTo(112, 4, 146, 12, 148, 28);
    ctx.bezierCurveTo(156, 36, 148, 54, 139, 66);
    ctx.bezierCurveTo(137, 52, 130, 46, 120, 48);
    ctx.bezierCurveTo(105, 52, 86, 44, 74, 52);
    ctx.quadraticCurveTo(68, 56, 63, 66);
  });
  line(ctx, [P(74, 40), P(92, 28), P(118, 24), P(138, 27)], hairLight, 3);
  line(ctx, [P(80, 46), P(100, 37), P(126, 37), P(142, 42)], hairLight, 2.2);
}

const PORTRAITS = { lorenzo };

export function drawPortrait(canvas, id, { background = true, balloons = false } = {}) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
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
  if (balloons) {
    [[28, 62, 19, 0], [172, 92, 17, 1], [34, 118, 14, 2]].forEach(([x, y, r, i]) => {
      line(ctx, [P(x, y + r), P(x < 100 ? 52 : 150, 200)], '#6b5b52', 1.4);
      drawRoundBalloon(ctx, x, y, r, BALLOON_COLORS[i]);
    });
  }
  PORTRAITS[id](ctx);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// Sagoma misteriosa per i personaggi non ancora disponibili.
export function drawLockedPortrait(canvas) {
  const ctx = canvas.getContext('2d');
  const s = canvas.width / 200;
  ctx.setTransform(s, 0, 0, s, 0, canvas.height - 220 * s);
  ctx.fillStyle = '#8a96a3';
  ellipse(ctx, 100, 88, 42, 52, '#8a96a3', null);
  poly(ctx, [P(30, 222), P(45, 168), P(80, 148), P(120, 148), P(155, 168), P(170, 222)], '#8a96a3', null);
  ctx.fillStyle = '#e9eef2';
  ctx.font = 'bold 64px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 100, 92);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
