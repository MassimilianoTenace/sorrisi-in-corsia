// Personale e genitori: semplici abitudini, solo per dare vita al reparto.
import { Walker } from './walker.js';
import { CONFIG } from '../config.js';
import { S } from '../strings.it.js';
import { nearestWalkable } from '../engine/pathfinding.js';

const between = (rng, a, b) => a + rng() * (b - a);
const pick = (rng, list) => list[Math.floor(rng() * list.length)];

export class Adult extends Walker {
  constructor({ id, role, look, x, y, chair = null, spots = [], rng }) {
    super(x, y, CONFIG.speed.adult);
    Object.assign(this, { id, role, look, chair, spots, rng });
    this.state = role === 'parent' ? 'sit' : 'idle';
    this.wait = role === 'parent' ? between(rng, 18, 55) : between(rng, 1, 6);
    if (chair) this.sitDown();
  }

  sitDown() {
    this.x = this.chair.x + 0.5;
    this.y = this.chair.y + 0.55;
    this.state = 'sit';
    this.back = false;
    this.flip = false;
    this.wait = between(this.rng, 25, 60);
  }

  chat() {
    this.say(pick(this.rng, S.say[this.role]), 2.6);
  }

  update(dt, map) {
    const arrived = this.step(dt);
    if (this.role === 'reception') return;

    if (this.state === 'walk') {
      if (arrived || !this.moving) this.arrive(map);
      return;
    }

    if ((this.wait -= dt) > 0) return;
    if (this.role === 'parent') this.parentLeaves(map);
    else this.patrol(map);
  }

  patrol(map) {
    const spot = pick(this.rng, this.spots);
    if (this.walkTo(map, spot.x, spot.y)) {
      this.state = 'walk';
      this.look_at = spot.look;
    } else {
      this.wait = 2;
    }
  }

  parentLeaves(map) {
    if (this.state === 'sit') {
      const start = nearestWalkable(map, this.x, this.y);
      this.x = start.x + 0.5;
      this.y = start.y + 0.5;
      const spot = pick(this.rng, this.spots);
      this.returning = false;
      if (this.walkTo(map, spot.x, spot.y)) this.state = 'walk';
      else this.sitDown();
    } else {
      const seat = map.tilesAround(this.chair)[0];
      this.returning = true;
      if (seat && this.walkTo(map, seat.x, seat.y)) this.state = 'walk';
      else this.sitDown();
    }
  }

  arrive(map) {
    if (this.role === 'parent' && this.returning) {
      this.sitDown();
      return;
    }
    this.state = 'idle';
    this.wait = between(this.rng, 3, 8);
    if (this.look_at) this.faceTowards(this.look_at.x, this.look_at.y);
    if (this.rng() < 0.45) this.chat();
  }
}
