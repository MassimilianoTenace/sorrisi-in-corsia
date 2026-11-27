import { Walker } from './walker.js';
import { CONFIG } from '../config.js';
import { expressionFor } from '../game/happiness.js';

export const bedPosition = (bed) => ({ x: bed.x + 0.5, y: bed.y + 0.82 });

export class Kid extends Walker {
  constructor({ id, name, look, bed, bedridden, favourite, happiness }) {
    const p = bedPosition(bed);
    super(p.x, p.y, CONFIG.speed.kid);
    Object.assign(this, { id, name, look, bed, bedridden, favourite, happiness });
    this.state = 'bed'; // bed | following | playing | returning
    this.balloon = null;
    this.toy = null;
    this.reaction = null; // espressione momentanea
    this.cheer = 0;
    this.frizz = 0; // secondi residui con i capelli bianchi
    this.leader = null; // il volontario che sta seguendo
    this.repath = 0;
  }

  react(expression, seconds = 2.4) {
    this.reaction = { expression, t: seconds };
  }

  get expression() {
    return this.reaction?.expression ?? expressionFor(this.happiness);
  }

  returnToBed(map) {
    // Casella accanto al letto più vicina alla testata.
    const spots = map
      .tilesAround(this.bed)
      .filter((t) => map.areaAt(t.x, t.y) === this.bed.room)
      .sort((a, b) => Math.abs(a.y - this.bed.y) - Math.abs(b.y - this.bed.y));
    this.state = 'returning';
    this.leader = null;
    if (!spots.length || !this.walkTo(map, spots[0].x, spots[0].y)) this.layDown();
  }

  layDown() {
    const p = bedPosition(this.bed);
    this.x = p.x;
    this.y = p.y;
    this.stop();
    this.state = 'bed';
    this.leader = null;
    this.back = false;
    this.flip = false;
  }
}
