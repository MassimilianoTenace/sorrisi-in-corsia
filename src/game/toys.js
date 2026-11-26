import { CONFIG } from '../config.js';

const T = CONFIG.toys;

// Lo scaffale: un esemplare per ogni gioco.
export class ToyShelf {
  constructor(ids) {
    this.ids = [...ids];
    this.available = new Set(ids);
  }

  // Prende un gioco e rimette a posto quello eventualmente già in mano.
  take(id, holder) {
    if (!this.available.has(id)) return false;
    if (holder.carried) this.putBack(holder.carried);
    this.available.delete(id);
    holder.carried = id;
    return true;
  }

  putBack(id) {
    this.available.add(id);
  }

  list() {
    return this.ids.filter((id) => this.available.has(id));
  }
}

export const giftGain = (kid, toyId) => T.gain + (kid.favourite === toyId ? T.favouriteBonus : 0);
