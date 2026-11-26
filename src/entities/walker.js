import { findPath, nearestWalkable } from '../engine/pathfinding.js';

export class Walker {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.path = [];
    this.phase = 0;
    this.back = false;
    this.flip = false;
    this.bubble = null;
  }

  get moving() {
    return this.path.length > 0;
  }

  get tile() {
    return { x: Math.floor(this.x), y: Math.floor(this.y) };
  }

  // Avvia il cammino verso una casella. Ritorna false se non è raggiungibile.
  walkTo(map, tx, ty) {
    const from = this.tile;
    const start = map.isWalkable(from.x, from.y) ? from : nearestWalkable(map, this.x, this.y);
    const tiles = findPath(map, start, { x: tx, y: ty });
    if (!tiles) return false;
    this.path = tiles.map((t) => ({ x: t.x + 0.5, y: t.y + 0.5 }));
    if (!this.path.length) this.path = [{ x: tx + 0.5, y: ty + 0.5 }];
    return true;
  }

  stop() {
    this.path = [];
  }

  faceTowards(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    if (Math.abs(dx - dy) > 0.05) this.flip = dx - dy < 0;
    if (Math.abs(dx + dy) > 0.05) this.back = dx + dy < 0;
  }

  say(text, seconds = 2.2) {
    this.bubble = { text, t: seconds };
  }

  // Avanza lungo il percorso; ritorna true nell'istante in cui arriva.
  step(dt) {
    if (this.bubble && (this.bubble.t -= dt) <= 0) this.bubble = null;
    if (!this.path.length) return false;
    let left = this.speed * dt;
    this.phase += dt * this.speed * 3.6;
    while (left > 0 && this.path.length) {
      const goal = this.path[0];
      const dist = Math.hypot(goal.x - this.x, goal.y - this.y);
      if (dist <= left) {
        this.x = goal.x;
        this.y = goal.y;
        left -= dist;
        this.path.shift();
      } else {
        this.faceTowards(goal.x, goal.y);
        this.x += ((goal.x - this.x) / dist) * left;
        this.y += ((goal.y - this.y) / dist) * left;
        left = 0;
      }
    }
    return this.path.length === 0;
  }
}
