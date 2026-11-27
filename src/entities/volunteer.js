import { Walker } from './walker.js';
import { CONFIG } from '../config.js';

// Un volontario in corsia: quello del giocatore oppure un collega.
export class Volunteer extends Walker {
  constructor(character, x, y, speed = CONFIG.speed.player) {
    super(x, y, speed);
    this.character = character;
    this.task = null; // cosa fare all'arrivo
    this.action = null; // azione in corso (palloncino, gioco, superpotere...)
    this.carried = null; // id del gioco in mano
    this.cooldown = 0; // ricarica del superpotere
  }

  get busy() {
    return this.action !== null;
  }
}
