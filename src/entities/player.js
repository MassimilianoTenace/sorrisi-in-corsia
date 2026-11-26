import { Walker } from './walker.js';
import { CONFIG } from '../config.js';

export class Player extends Walker {
  constructor(character, x, y) {
    super(x, y, CONFIG.speed.player);
    this.character = character;
    this.task = null; // cosa fare all'arrivo
    this.action = null; // azione in corso (palloncino, gioco, superpotere...)
    this.carried = null; // id del gioco in mano
  }

  get busy() {
    return this.action !== null;
  }
}
