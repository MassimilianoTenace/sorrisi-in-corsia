// Disegnare i contorni è costoso: ogni oggetto viene dipinto su una propria immagine
// e ridipinto solo quando cambia davvero (le parti ferme mai, le animazioni a scatti).
const STEP = 0.2; // si ridisegna tutto solo quando lo zoom cambia in modo sensibile
const MAX_SCALE = 2.6;

export class SpriteCache {
  constructor() {
    this.scale = 0;
    this.sprites = new Map();
  }

  setScale(scale) {
    const next = Math.min(MAX_SCALE, Math.ceil(scale / STEP - 0.001) * STEP);
    if (next === this.scale) return;
    this.scale = next;
    this.sprites.clear();
  }

  clear() {
    this.sprites.clear();
  }

  /**
   * box: rettangolo in pixel mondo {x, y, w, h}, relativo ad anchor;
   * paint disegna in quelle coordinate; si ridipinge quando cambia version.
   */
  draw(ctx, key, box, paint, { version = '', anchor = { x: 0, y: 0 } } = {}) {
    let sprite = this.sprites.get(key);
    const width = Math.ceil(box.w * this.scale);
    const height = Math.ceil(box.h * this.scale);
    if (!sprite || sprite.canvas.width !== width || sprite.canvas.height !== height) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      sprite = { canvas, g: canvas.getContext('2d'), version: null };
      this.sprites.set(key, sprite);
    }
    if (sprite.version !== version) {
      sprite.version = version;
      const { g } = sprite;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, width, height);
      g.setTransform(this.scale, 0, 0, this.scale, -box.x * this.scale, -box.y * this.scale);
      g.lineCap = 'round';
      g.save();
      paint(g);
      g.restore();
    }
    ctx.drawImage(sprite.canvas, anchor.x + box.x, anchor.y + box.y, width / this.scale, height / this.scale);
  }
}
