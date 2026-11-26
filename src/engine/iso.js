// Proiezione isometrica 2:1. Il mondo si misura in caselle, lo schermo in pixel.
export const TILE_W = 64;
export const TILE_H = 32;

export function toScreen(x, y, z = 0) {
  return {
    x: (x - y) * (TILE_W / 2),
    y: (x + y) * (TILE_H / 2) - z,
  };
}

export function toWorld(sx, sy) {
  const a = sx / (TILE_W / 2);
  const b = sy / (TILE_H / 2);
  return { x: (a + b) / 2, y: (b - a) / 2 };
}
