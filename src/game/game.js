// Stato e regole della partita. Non usa il browser: i test la fanno girare direttamente.
import { CONFIG } from '../config.js';
import { S } from '../strings.it.js';
import { createMap } from '../world/map.js';
import { FURNITURE, PLAYER_START, PLAY_SPOTS } from '../world/layout.js';
import { findPath, nearestWalkable } from '../engine/pathfinding.js';
import { Player } from '../entities/player.js';
import { TOY_IDS, SHAPES, BALLOON_COLORS } from '../art/props.js';
import { getCharacter } from '../characters/index.js';
import { createKids, createAdults } from './people.js';
import { changeHappiness, decayed, happinessColor } from './happiness.js';
import { resolveBalloon, audienceAround } from './balloon.js';
import { superGain, superAudience, pickMove } from './superpower.js';
import { ToyShelf, giftGain } from './toys.js';
import { followersOf, inviteRefusal, playersReady } from './playdate.js';

const REACH = 2.05;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class Game {
  constructor({ characterId = 'lorenzo', rng = Math.random, onEvent = () => {} } = {}) {
    this.rng = rng;
    this.onEvent = onEvent;
    this.map = createMap();
    this.furniture = FURNITURE;
    this.player = new Player(getCharacter(characterId), PLAYER_START.x, PLAYER_START.y);
    this.kids = createKids(rng);
    this.adults = createAdults(this.map, rng);
    this.shelf = new ToyShelf(TOY_IDS);
    this.shelfItem = FURNITURE.find((f) => f.type === 'toyshelf');
    this.selected = null;
    this.cooldown = 0;
    this.time = 0;
    this.floaters = [];
    this.particles = [];
    this.stats = { smiles: 0, balloons: 0, popped: 0 };
    this.forcedOutcome = null; // debug: 'pop' | 'success'
    this.lastMove = null;
    this.wasReady = false;
    this.greetTimer = 4;
  }

  // ---------- eventi ed effetti ----------
  sound(name) {
    this.onEvent({ type: 'sound', name });
  }

  toast(text) {
    this.onEvent({ type: 'toast', text });
  }

  line(list) {
    return list[Math.floor(this.rng() * list.length)];
  }

  float(x, y, z, text, color, dx = 0) {
    this.floaters.push({ x, y, z, text, color, dx, t: 0, life: 1.7 });
  }

  burst(x, y, z, kind, count, colors) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2;
      const v = 0.3 + this.rng() * 1.1;
      this.particles.push({
        x, y, z, kind,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        vz: 40 + this.rng() * 90,
        color: colors[i % colors.length],
        spin: this.rng() * 6,
        t: 0,
        life: 0.8 + this.rng() * 0.7,
      });
    }
  }

  // Applica una variazione di felicità e la mostra sopra la testa.
  cheerUp(kid, delta) {
    const real = Math.round(changeHappiness(kid, delta));
    const z = kid.state === 'bed' ? 30 : 18; // parte in basso per non coprire i fumetti
    if (delta > 0) {
      this.stats.smiles += Math.max(0, real);
      this.float(kid.x, kid.y, z, real > 0 ? `+${real}` : '♥', '#27913a', -30);
    } else {
      this.float(kid.x, kid.y, z, `${real}`, '#d63a2f', -30);
    }
  }

  kidById(id) {
    return this.kids.find((k) => k.id === id) ?? null;
  }

  get selectedKid() {
    return this.selected ? this.kidById(this.selected) : null;
  }

  nearestKid() {
    const area = this.map.areaAt(this.player.x, this.player.y);
    return (
      this.kids
        .filter((k) => this.map.areaAt(k.x, k.y) === area)
        .sort((a, b) => distance(a, this.player) - distance(b, this.player))[0] ?? null
    );
  }

  // ---------- comandi del giocatore ----------
  walk(x, y) {
    if (this.player.busy) return false;
    const goal = nearestWalkable(this.map, x, y);
    if (!goal) return false;
    this.selected = null;
    this.player.task = null;
    return this.player.walkTo(this.map, goal.x, goal.y);
  }

  // type: 'approach' | 'balloon' | 'toy' | 'invite' | 'sendBack'
  interact(type, kidId) {
    const kid = this.kidById(kidId);
    if (!kid || this.player.busy || kid.state === 'playing') return false;
    if (type === 'toy' && !this.player.carried) {
      this.toast(S.toast.needToy);
      return false;
    }
    this.selected = kid.id;
    this.player.task = { type, kidId: kid.id };
    if (this.canReach(kid)) {
      this.player.stop();
      this.runTask();
      return true;
    }
    const spot = this.spotNear(kid);
    if (!spot || !this.player.walkTo(this.map, spot.x, spot.y)) {
      this.player.task = null;
      return false;
    }
    return true;
  }

  openShelf() {
    if (this.player.busy) return false;
    this.selected = null;
    const spots = this.map.tilesAround(this.shelfItem);
    const target = { x: this.shelfItem.x + 1, y: this.shelfItem.y + 1 };
    spots.sort((a, b) => distance(a, target) - distance(b, target));
    this.player.task = { type: 'shelf' };
    if (!spots.length || !this.player.walkTo(this.map, spots[0].x, spots[0].y)) return false;
    return true;
  }

  takeToy(id) {
    if (!this.shelf.take(id, this.player)) return false;
    this.sound('toy');
    this.toast(S.toast.tookToy(S.toys[id]));
    return true;
  }

  putBackToy() {
    if (!this.player.carried) return false;
    this.shelf.putBack(this.player.carried);
    this.player.carried = null;
    this.sound('click');
    this.toast(S.toast.putToy);
    return true;
  }

  readyToPlay() {
    return playersReady(this.map, this.player, this.kids);
  }

  playTogether() {
    const friends = this.readyToPlay();
    if (this.player.busy || !friends.length) return false;
    const player = this.player;
    this.selected = null;
    player.task = null;
    const [mine, ...theirs] = PLAY_SPOTS;
    player.walkTo(this.map, mine.x, mine.y);
    friends.forEach((kid, i) => {
      kid.state = 'playing';
      const spot = theirs[i % theirs.length];
      kid.walkTo(this.map, spot.x, spot.y);
      kid.say(this.line(S.say.playing), 2);
      kid.react('joy', CONFIG.playdate.duration);
    });
    player.action = { type: 'playing', t: 0, duration: CONFIG.playdate.duration, friends, nextLine: 1.6 };
    this.sound('toy');
    return true;
  }

  superpower() {
    const player = this.player;
    if (player.busy) return false;
    if (this.cooldown > 0) {
      this.toast(S.toast.superRecharging);
      return false;
    }
    const audience = superAudience(this.map, player, this.kids);
    if (!audience.length) {
      this.toast(S.toast.noAudience);
      this.sound('nope');
      return false;
    }
    const move = pickMove(player.character.superpower.moves, this.lastMove, this.rng);
    this.lastMove = move;
    player.stop();
    player.task = null;
    player.back = false;
    this.selected = null;
    // si esibisce sul posto, al centro della casella
    player.action = { type: 'super', t: 0, duration: CONFIG.superpower.duration, move, audience, applied: false };
    this.cooldown = CONFIG.superpower.cooldown;
    player.bubble = null;
    this.float(player.x, player.y, 112, S.superMoves[move], '#b8560f');
    this.sound('super');
    return true;
  }

  // ---------- interazioni ----------
  canReach(kid) {
    return (
      distance(this.player, kid) <= REACH &&
      this.map.areaAt(this.player.x, this.player.y) === this.map.areaAt(kid.x, kid.y) &&
      this.map.isWalkable(this.player.tile.x, this.player.tile.y)
    );
  }

  // Casella da cui raggiungere un bambino con il percorso più breve.
  spotNear(kid) {
    let tiles;
    if (kid.state === 'bed') {
      tiles = this.map.tilesAround(kid.bed);
    } else {
      const { x, y } = kid.tile;
      tiles = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 0]].map(([dx, dy]) => ({ x: x + dx, y: y + dy }));
    }
    const area = this.map.areaAt(kid.x, kid.y);
    let best = null;
    let bestCost = Infinity;
    for (const t of tiles) {
      if (!this.map.isWalkable(t.x, t.y) || this.map.areaAt(t.x, t.y) !== area) continue;
      const centre = { x: t.x + 0.5, y: t.y + 0.5 };
      if (distance(centre, kid) > REACH) continue;
      const path = findPath(this.map, this.player.tile, t);
      if (!path) continue;
      // si preferisce stare di lato, senza coprire il bambino
      const cost = path.length + distance(centre, kid) * 2 + (t.x === kid.tile.x && t.y === kid.tile.y ? 3 : 0);
      if (cost < bestCost) {
        best = t;
        bestCost = cost;
      }
    }
    return best;
  }

  runTask() {
    const task = this.player.task;
    if (!task) return;
    this.player.task = null;
    if (task.type === 'shelf') {
      this.player.faceTowards(this.shelfItem.x + 1.5, this.shelfItem.y + 0.5);
      this.onEvent({ type: 'shelf' });
      return;
    }
    const kid = this.kidById(task.kidId);
    if (!kid || kid.state === 'playing') return;
    if (!this.canReach(kid)) {
      // il bambino si è spostato: si riprova
      this.interact(task.type, task.kidId);
      return;
    }
    this.player.faceTowards(kid.x, kid.y);
    if (kid.state !== 'bed') {
      kid.stop();
      kid.faceTowards(this.player.x, this.player.y);
    }

    if (task.type === 'approach') {
      kid.say(this.line(S.say.greet), 1.8);
    } else if (task.type === 'balloon') {
      this.startBalloon(kid);
    } else if (task.type === 'toy') {
      this.startGift(kid);
    } else if (task.type === 'invite') {
      this.invite(kid);
    } else if (task.type === 'sendBack' && kid.state === 'following') {
      kid.say(S.say.goingBack);
      kid.returnToBed(this.map);
    }
  }

  startBalloon(kid) {
    const shape = SHAPES[Math.floor(this.rng() * SHAPES.length)];
    const color = BALLOON_COLORS[Math.floor(this.rng() * BALLOON_COLORS.length)];
    this.player.back = false;
    this.player.action = { type: 'balloon', t: 0, duration: CONFIG.balloon.duration, kid, shape, color };
    this.player.say(this.line(S.say.balloonStart), 1.6);
    this.sound('pump');
  }

  finishBalloon({ kid, shape, color }) {
    const player = this.player;
    const audience = audienceAround(this.map, player, this.kids);
    const result = resolveBalloon({ target: kid, audience, rng: this.rng, forced: this.forcedOutcome });

    for (const { kid: k, delta, reaction } of result.effects) {
      this.cheerUp(k, delta);
      if (reaction === 'upset') {
        k.react('sad', 3);
        k.say(this.line(S.say.popUpset));
      } else if (reaction === 'amused') {
        k.react('joy', 3);
        k.say(this.line(S.say.popAmused));
      } else {
        k.react('joy', 2.6);
        k.cheer = 1.6;
        if (k === kid) k.say(this.line(S.say.happy));
      }
    }

    if (result.popped) {
      this.stats.popped++;
      this.burst(player.x + 0.25, player.y - 0.1, 44, 'shard', 26, [color]);
      this.float(player.x, player.y, 96, S.say.pop, '#c22820');
      this.sound('pop');
      this.sound('giggle');
    } else {
      this.stats.balloons++;
      kid.balloon = { shape, color, time: CONFIG.balloon.keepSeconds };
      this.burst(kid.x, kid.y, 60, 'confetti', 22, BALLOON_COLORS);
      this.float(player.x, player.y, 96, S.balloons[shape], '#2457a6');
      this.sound('success');
    }
    return result;
  }

  startGift(kid) {
    if (!this.player.carried) return;
    if (kid.toy) {
      kid.say(S.say.alreadyPlaying);
      this.sound('nope');
      return;
    }
    const toyId = this.player.carried;
    this.player.carried = null;
    kid.toy = { id: toyId, time: CONFIG.toys.keepSeconds };
    kid.react('joy', CONFIG.toys.giveDuration + 1);
    kid.say(this.line(kid.favourite === toyId ? S.say.toyFavourite : S.say.toy));
    this.player.action = { type: 'giving', t: 0, duration: CONFIG.toys.giveDuration, kid, toyId };
    this.sound('toy');
  }

  finishGift({ kid, toyId }) {
    this.cheerUp(kid, giftGain(kid, toyId));
    this.burst(kid.x, kid.y, 64, 'heart', kid.favourite === toyId ? 14 : 7, ['#ef5b6c', '#ff8fa3']);
    this.sound('success');
  }

  invite(kid) {
    const refusal = inviteRefusal(kid, this.kids);
    if (refusal === 'bedridden') {
      kid.say(S.say.bedridden, 3.2);
      this.sound('nope');
    } else if (refusal === 'tooMany') {
      this.toast(S.toast.tooMany);
    } else if (!refusal) {
      const start = nearestWalkable(this.map, kid.x, kid.y);
      if (kid.state === 'bed') {
        // scende dal letto dal lato del volontario
        const side = this.map
          .tilesAround(kid.bed)
          .filter((t) => this.map.areaAt(t.x, t.y) === kid.bed.room)
          .sort((a, b) => distance(a, this.player) - distance(b, this.player))[0] ?? start;
        kid.x = side.x + 0.5;
        kid.y = side.y + 0.5;
      }
      kid.state = 'following';
      kid.react('joy', 2);
      kid.say(this.line(S.say.accept));
      this.selected = null;
      this.toast(S.toast.goToPlayroom);
      this.sound('giggle');
    }
  }

  // ---------- aggiornamento ----------
  update(dt) {
    this.time += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.updatePlayer(dt);
    this.kids.forEach((kid) => this.updateKid(kid, dt));
    this.adults.forEach((a) => a.update(dt, this.map));
    this.updateEffects(dt);

    const ready = !this.player.busy && this.readyToPlay().length > 0;
    if (ready && !this.wasReady) this.toast(S.toast.readyToPlay);
    this.wasReady = ready;
  }

  updatePlayer(dt) {
    const player = this.player;
    const arrived = player.step(dt);
    if (arrived && !player.busy) this.runTask();

    const action = player.action;
    if (!action) return;
    action.t += dt;

    if (action.type === 'super') {
      if (!action.applied && action.t >= action.duration * 0.4) {
        action.applied = true;
        for (const kid of action.audience) {
          this.cheerUp(kid, superGain());
          kid.react('joy', 3.5);
          kid.say(this.line(S.say.superKid), 2.6);
          this.burst(kid.x, kid.y, 62, 'heart', 6, ['#ffce2e', '#ef5b6c']);
        }
        this.toast(S.toast.superArea(action.audience.length));
        this.sound('giggle');
      }
    } else if (action.type === 'playing') {
      if (action.t >= action.nextLine) {
        action.nextLine += 1.5;
        const kid = this.line(action.friends);
        kid.say(this.line(S.say.playing), 1.3);
        this.burst(kid.x, kid.y, 50, 'confetti', 8, BALLOON_COLORS);
      }
    }

    if (action.t < action.duration) return;
    player.action = null;
    if (action.type === 'balloon') this.finishBalloon(action);
    else if (action.type === 'giving') this.finishGift(action);
    else if (action.type === 'playing') {
      for (const kid of action.friends) {
        this.cheerUp(kid, CONFIG.playdate.gain);
        kid.react('joy', 3);
        kid.say(S.say.goingBack, 2.4);
        kid.returnToBed(this.map);
      }
      this.sound('success');
    }
  }

  // Un bambino coinvolto in un'azione resta fermo.
  isEngaged(kid) {
    const { action, task } = this.player;
    if (task?.kidId === kid.id) return true;
    if (!action) return false;
    return action.kid === kid || (action.type === 'super' && action.audience.includes(kid));
  }

  updateKid(kid, dt) {
    if (kid.reaction && (kid.reaction.t -= dt) <= 0) kid.reaction = null;
    kid.cheer = Math.max(0, kid.cheer - dt);
    if (kid.balloon && (kid.balloon.time -= dt) <= 0) kid.balloon = null;
    if (kid.toy && !this.isEngaged(kid) && (kid.toy.time -= dt) <= 0) {
      this.shelf.putBack(kid.toy.id);
      this.toast(S.toast.toyReturned(S.toys[kid.toy.id]));
      kid.toy = null;
    }

    const engaged = this.isEngaged(kid);
    if (!engaged && kid.state !== 'playing') kid.happiness = decayed(kid.happiness, dt);

    if (kid.state === 'following' && !engaged) this.follow(kid, dt);
    const frozen = engaged && kid.state !== 'playing';
    if (frozen) {
      if (kid.bubble && (kid.bubble.t -= dt) <= 0) kid.bubble = null;
      return;
    }
    const arrived = kid.step(dt);
    if (kid.state === 'returning' && (arrived || !kid.moving)) kid.layDown();
    if (kid.state === 'playing' && !kid.moving) kid.faceTowards(this.player.x, this.player.y);
  }

  follow(kid, dt) {
    const place = followersOf(this.kids).indexOf(kid);
    const gap = 1.2 + place * 0.75;
    kid.repath -= dt;
    const sameArea = this.map.areaAt(kid.x, kid.y) === this.map.areaAt(this.player.x, this.player.y);
    if (distance(kid, this.player) <= gap && sameArea) {
      kid.stop();
      kid.faceTowards(this.player.x, this.player.y);
    } else if (kid.repath <= 0) {
      kid.repath = 0.3;
      const { x, y } = this.player.tile;
      kid.walkTo(this.map, x, y);
    }
  }

  updateEffects(dt) {
    for (const f of this.floaters) f.t += dt;
    this.floaters = this.floaters.filter((f) => f.t < f.life);
    for (const p of this.particles) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z = Math.max(0, p.z + p.vz * dt);
      p.vz -= (p.kind === 'heart' ? 30 : 220) * dt;
    }
    this.particles = this.particles.filter((p) => p.t < p.life);
  }

  get averageHappiness() {
    return this.kids.reduce((sum, k) => sum + k.happiness, 0) / this.kids.length;
  }

  get averageColor() {
    return happinessColor(this.averageHappiness);
  }
}
