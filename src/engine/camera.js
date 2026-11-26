import { toScreen, toWorld } from './iso.js';

const WALL_HEADROOM = 150;

export class Camera {
  constructor(mapW, mapH) {
    const left = toScreen(0, mapH).x;
    const right = toScreen(mapW, 0).x;
    const bottom = toScreen(mapW, mapH).y;
    this.bounds = { x0: left - 20, x1: right + 20, y0: -WALL_HEADROOM, y1: bottom + 24 };
    this.x = (this.bounds.x0 + this.bounds.x1) / 2;
    this.y = (this.bounds.y0 + this.bounds.y1) / 2;
    this.zoom = 1;
    this.view = { w: 800, h: 600, bottom: 0 };
    this.follow = true;
    this.userZoomed = false;
  }

  get fitZoom() {
    const b = this.bounds;
    return Math.min(this.view.w / (b.x1 - b.x0), this.usableHeight / (b.y1 - b.y0));
  }

  get usableHeight() {
    return Math.max(120, this.view.h - this.view.bottom);
  }

  resize(w, h, bottom) {
    this.view = { w, h, bottom };
    if (!this.userZoomed) {
      const fit = this.fitZoom;
      // Schermi grandi: tutto il reparto. Telefoni: più vicino e si segue il volontario.
      const small = Math.min(w, h) < 560;
      this.zoom = small ? 0.95 : Math.min(1.9, Math.max(1, fit * 1.25));
    }
    this.clampZoom();
  }

  clampZoom() {
    const min = Math.min(this.fitZoom, 0.7);
    this.zoom = Math.min(2.6, Math.max(min, this.zoom));
  }

  // Limita un centro desiderato ai confini; se la mappa ci sta tutta, la centra.
  clampCentre(x, y) {
    const b = this.bounds;
    const axis = (value, lo, hi, size) => {
      const half = size / 2 / this.zoom;
      if (hi - lo <= half * 2) return (lo + hi) / 2;
      return Math.min(hi - half, Math.max(lo + half, value));
    };
    return {
      x: axis(x, b.x0, b.x1, this.view.w),
      y: axis(y, b.y0, b.y1, this.usableHeight),
    };
  }

  update(dt, target, snap = false) {
    let goal = { x: this.x, y: this.y };
    if (this.follow && target) {
      const p = toScreen(target.x, target.y, 30);
      goal = p;
    }
    goal = this.clampCentre(goal.x, goal.y);
    const k = snap ? 1 : 1 - Math.exp(-dt * (this.follow ? 5 : 30));
    this.x += (goal.x - this.x) * k;
    this.y += (goal.y - this.y) * k;
  }

  pan(dx, dy) {
    this.follow = false;
    const c = this.clampCentre(this.x - dx / this.zoom, this.y - dy / this.zoom);
    this.x = c.x;
    this.y = c.y;
  }

  zoomAt(factor, px, py) {
    const before = this.screenToPixel(px, py);
    this.userZoomed = true;
    this.zoom *= factor;
    this.clampZoom();
    const after = this.screenToPixel(px, py);
    const c = this.clampCentre(this.x + before.x - after.x, this.y + before.y - after.y);
    this.x = c.x;
    this.y = c.y;
  }

  // Origine dello schermo (in pixel mondo) -> usata dal renderer.
  get offset() {
    return {
      x: this.view.w / 2 - this.x * this.zoom,
      y: this.usableHeight / 2 - this.y * this.zoom,
    };
  }

  screenToPixel(px, py) {
    const o = this.offset;
    return { x: (px - o.x) / this.zoom, y: (py - o.y) / this.zoom };
  }

  screenToWorld(px, py) {
    const p = this.screenToPixel(px, py);
    return toWorld(p.x, p.y);
  }

  worldToView(x, y, z = 0) {
    const p = toScreen(x, y, z);
    const o = this.offset;
    return { x: p.x * this.zoom + o.x, y: p.y * this.zoom + o.y };
  }
}
