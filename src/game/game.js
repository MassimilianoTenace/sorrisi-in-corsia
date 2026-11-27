// Stato e regole della partita. Non usa il browser: i test la fanno girare direttamente.
// Le azioni accettano "who", il volontario che le compie: se manca è quello del giocatore.
import { CONFIG } from '../config.js';
import { S } from '../strings.it.js';
import { createMap } from '../world/map.js';
import { FURNITURE, PLAYER_START, PLAY_GROUPS } from '../world/layout.js';
import { findPath, nearestWalkable } from '../engine/pathfinding.js';
import { Volunteer } from '../entities/volunteer.js';
import { TOY_IDS, SHAPES, BALLOON_COLORS } from '../art/props.js';
import { getCharacter } from '../characters/index.js';
import { createKids, createAdults } from './people.js';
import { changeHappiness, decayed, happinessColor } from './happiness.js';
import { resolveBalloon, audienceAround } from './balloon.js';
import { superGain, superAudience, nextMove } from './superpower.js';
import { moveData } from './superMoves.js';
import { ToyShelf, giftGain } from './toys.js';
import { followersOf, inviteRefusal, playersReady } from './playdate.js';
import { createColleagues, updateColleague, retire } from './colleagues.js';

const REACH = 2.05;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class Game {
  constructor({ characterId = 'lorenzo', rng = Math.random, onEvent = () => {}, colleagues = CONFIG.colleagues.count } = {}) {
    this.rng = rng;
    this.onEvent = onEvent;
    this.map = createMap();
    this.furniture = FURNITURE;
    this.player = new Volunteer(getCharacter(characterId), PLAYER_START.x, PLAYER_START.y);
    this.kids = createKids(rng);
    this.adults = createAdults(this.map, rng);
    this.colleagues = createColleagues(colleagues, this.player.character.id, rng);
    this.shelf = new ToyShelf(TOY_IDS);
    this.shelfItem = FURNITURE.find((f) => f.type === 'toyshelf');
    this.selected = null;
    this.time = 0;
    this.floaters = [];
    this.particles = [];
    // contano solo le azioni del giocatore
    this.stats = { smiles: 0, balloons: 0, popped: 0, songs: 0, broken: 0 };
    this.forcedOutcome = null; // debug: 'pop' | 'success'
    this.moveTurns = new Map(); // quante mosse ha già usato ogni personaggio
    this.wasReady = false;
  }

  get volunteers() {
    return [this.player, ...this.colleagues];
  }

  get cooldown() {
    return this.player.cooldown;
  }

  set cooldown(seconds) {
    this.player.cooldown = seconds;
  }

  // ---------- eventi ed effetti ----------
  // Dei colleghi si sentono solo i suoni nella stanza del giocatore.
  sound(name, who = this.player) {
    const { map, player } = this;
    if (who !== player && map.areaAt(who.x, who.y) !== map.areaAt(player.x, player.y)) return;
    this.onEvent({ type: 'sound', name });
  }

  // I messaggi riguardano solo il giocatore.
  toast(text, who = this.player) {
    if (who === this.player) this.onEvent({ type: 'toast', text });
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
  cheerUp(kid, delta, who = this.player) {
    const real = Math.round(changeHappiness(kid, delta));
    const z = kid.state === 'bed' ? 30 : 18; // parte in basso per non coprire i fumetti
    if (delta > 0) {
      if (who === this.player) this.stats.smiles += Math.max(0, real);
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

  // ---------- chi sta con chi ----------
  // Un volontario che sta già facendo qualcosa con quel bambino.
  volunteerBusyWith(kid, except = this.player) {
    return (
      this.volunteers.find(
        (v) => v !== except && (v.action?.kid === kid || (v.action?.type === 'playing' && v.action.friends.includes(kid))),
      ) ?? null
    );
  }

  // Un altro volontario ci sta andando o ci sta lavorando.
  isTargeted(kid, except) {
    return Boolean(this.volunteerBusyWith(kid, except)) || this.volunteers.some((v) => v !== except && v.task?.kidId === kid.id);
  }

  isClaimedByPlayer(kid) {
    const { task, action } = this.player;
    return this.selected === kid.id || task?.kidId === kid.id || action?.kid === kid;
  }

  tellBusy(kid, other, who) {
    this.toast(S.toast.busyWith(S.characters[other.character.id].name, kid.name), who);
  }

  // ---------- comandi ----------
  walk(x, y, who = this.player) {
    if (who.busy) return false;
    const goal = nearestWalkable(this.map, x, y);
    if (!goal) return false;
    if (who === this.player) this.selected = null;
    who.task = null;
    return who.walkTo(this.map, goal.x, goal.y);
  }

  // type: 'approach' | 'balloon' | 'toy' | 'invite' | 'sendBack'
  interact(type, kidId, who = this.player) {
    const kid = this.kidById(kidId);
    if (!kid || who.busy) return false;
    const other = this.volunteerBusyWith(kid, who);
    if (other) {
      this.tellBusy(kid, other, who);
      return false;
    }
    if (kid.state === 'playing') return false;
    if ((type === 'invite' || type === 'sendBack') && kid.state === 'following' && kid.leader !== who) {
      this.toast(S.toast.followingOther(kid.name, S.characters[kid.leader.character.id].name), who);
      return false;
    }
    if (type === 'toy' && !who.carried) {
      this.toast(S.toast.needToy, who);
      return false;
    }
    if (who === this.player) {
      this.selected = kid.id;
      // il giocatore ha la precedenza: i colleghi in arrivo rinunciano
      for (const colleague of this.colleagues) {
        if (colleague.task?.kidId !== kid.id) continue;
        colleague.task = null;
        colleague.stop();
      }
    } else if (this.isClaimedByPlayer(kid)) {
      return false;
    }
    who.task = { type, kidId: kid.id };
    if (this.canReach(kid, who)) {
      who.stop();
      this.runTask(who);
      return true;
    }
    const spot = this.spotNear(kid, who);
    if (!spot || !who.walkTo(this.map, spot.x, spot.y)) {
      who.task = null;
      return false;
    }
    return true;
  }

  openShelf(who = this.player) {
    if (who.busy) return false;
    if (who === this.player) this.selected = null;
    const spots = this.map.tilesAround(this.shelfItem);
    const target = { x: this.shelfItem.x + 1, y: this.shelfItem.y + 1 };
    spots.sort((a, b) => distance(a, target) - distance(b, target));
    who.task = { type: 'shelf' };
    if (!spots.length || !who.walkTo(this.map, spots[0].x, spots[0].y)) return false;
    return true;
  }

  takeToy(id, who = this.player) {
    if (!this.shelf.take(id, who)) return false;
    this.sound('toy', who);
    this.toast(S.toast.tookToy(S.toys[id]), who);
    return true;
  }

  putBackToy(who = this.player) {
    if (!who.carried) return false;
    this.shelf.putBack(who.carried);
    who.carried = null;
    this.sound('click', who);
    this.toast(S.toast.putToy, who);
    return true;
  }

  readyToPlay(who = this.player) {
    return playersReady(this.map, who, this.kids);
  }

  playTogether(who = this.player) {
    const friends = this.readyToPlay(who);
    if (who.busy || !friends.length) return false;
    if (who === this.player) this.selected = null;
    who.task = null;
    // il primo gruppo di posti non occupato da altri
    const taken = this.volunteers.filter((v) => v !== who && v.action?.type === 'playing').map((v) => v.action.group);
    const group = Math.max(0, PLAY_GROUPS.findIndex((_, i) => !taken.includes(i)));
    const [mine, ...theirs] = PLAY_GROUPS[group];
    who.walkTo(this.map, mine.x, mine.y);
    friends.forEach((kid, i) => {
      kid.state = 'playing';
      const spot = theirs[i % theirs.length];
      kid.walkTo(this.map, spot.x, spot.y);
      kid.say(this.line(S.say.playing), 2);
      kid.react('joy', CONFIG.playdate.duration);
    });
    who.action = { type: 'playing', t: 0, duration: CONFIG.playdate.duration, friends, group, nextLine: 1.6 };
    this.sound('toy', who);
    return true;
  }

  superpower(who = this.player) {
    if (who.busy) return false;
    if (who.cooldown > 0) {
      this.toast(S.toast.superRecharging, who);
      return false;
    }
    const audience = superAudience(this.map, who, this.kids);
    if (!audience.length) {
      this.toast(S.toast.noAudience, who);
      this.sound('nope', who);
      return false;
    }
    const { id, superpower } = who.character;
    const turn = this.moveTurns.get(id) ?? 0;
    const move = nextMove(superpower.moves, turn);
    this.moveTurns.set(id, turn + 1);
    who.stop();
    who.task = null;
    who.back = false;
    if (who === this.player) this.selected = null;
    // si esibisce sul posto, al centro della casella
    who.action = { type: 'super', t: 0, duration: moveData(move).duration, move, audience, applied: false, spoken: 0 };
    who.cooldown = who === this.player ? CONFIG.superpower.cooldown : CONFIG.colleagues.superCooldown;
    who.bubble = null;
    this.float(who.x, who.y, 112, S.superMoves[move], '#b8560f');
    this.sound('super', who);
    return true;
  }

  // Cambia il volontario del giocatore: restano posizione, punteggi, gioco in mano,
  // bambini al seguito e ricarica. Chi sceglie un collega si scambia con lui.
  changeCharacter(id) {
    const { player } = this;
    const next = getCharacter(id);
    if (player.busy || next.id !== id || next === player.character) return false;
    const twin = this.colleagues.find((c) => c.character.id === id);
    if (twin) {
      retire(this, twin);
      twin.character = player.character;
      twin.bubble = null;
    }
    player.character = next;
    player.bubble = null;
    return true;
  }

  // Battute del volontario ed effetto sui bambini, ai tempi previsti dalla mossa.
  updateSuper(who, action) {
    const move = moveData(action.move);
    const progress = action.t / action.duration;
    while (action.spoken < move.lines.length && progress >= move.lines[action.spoken].at) {
      const { key, sound } = move.lines[action.spoken++];
      who.say(S.say.super[key], 2.2);
      if (sound) this.sound(sound, who);
    }
    if (action.applied || progress < move.applyAt) return;
    action.applied = true;
    for (const kid of action.audience) {
      this.cheerUp(kid, superGain(), who);
      kid.react('joy', 3.5);
      if (move.effect === 'whiteHair') kid.frizz = CONFIG.superpower.whiteHairSeconds;
      kid.say(this.line(move.effect === 'whiteHair' ? S.say.superHair : S.say.superKid), 2.6);
      if (move.throws) this.toss(who, kid, move.throws);
      this.burst(kid.x, kid.y, 62, 'heart', 6, ['#ffce2e', '#ef5b6c']);
    }
    this.toast(S.toast.superArea(action.audience.length), who);
    if (move.sound) this.sound(move.sound, who);
    this.sound('giggle', who);
  }

  // Un oggetto lanciato ad arco dal volontario a un bambino.
  toss(from, to, kind) {
    const life = 0.9;
    const z = 48;
    const target = to.state === 'bed' ? 34 : 28;
    this.particles.push({
      x: from.x,
      y: from.y,
      z,
      kind,
      vx: (to.x - from.x) / life,
      vy: (to.y - from.y) / life,
      vz: (target - z) / life + 110 * life,
      color: '#ffffff',
      spin: this.rng() * 6,
      t: 0,
      life,
    });
  }

  // ---------- interazioni ----------
  canReach(kid, who = this.player) {
    return (
      distance(who, kid) <= REACH &&
      this.map.areaAt(who.x, who.y) === this.map.areaAt(kid.x, kid.y) &&
      this.map.isWalkable(who.tile.x, who.tile.y)
    );
  }

  // Casella da cui raggiungere un bambino con il percorso più breve.
  spotNear(kid, who = this.player) {
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
      const path = findPath(this.map, who.tile, t);
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

  runTask(who) {
    const { task } = who;
    if (!task) return;
    who.task = null;
    if (task.type === 'shelf') {
      who.faceTowards(this.shelfItem.x + 1.5, this.shelfItem.y + 0.5);
      if (who === this.player) this.onEvent({ type: 'shelf' });
      return;
    }
    const kid = this.kidById(task.kidId);
    if (!kid) return;
    const other = this.volunteerBusyWith(kid, who);
    if (other) {
      this.tellBusy(kid, other, who);
      return;
    }
    if (kid.state === 'playing') return;
    if (!this.canReach(kid, who)) {
      // il bambino si è spostato: si riprova
      this.interact(task.type, task.kidId, who);
      return;
    }
    who.faceTowards(kid.x, kid.y);
    if (kid.state !== 'bed') {
      kid.stop();
      kid.faceTowards(who.x, who.y);
    }

    if (task.type === 'approach') {
      kid.say(this.line(S.say.greet), 1.8);
    } else if (task.type === 'balloon') {
      this.startBalloon(who, kid);
    } else if (task.type === 'toy') {
      this.startGift(who, kid);
    } else if (task.type === 'invite') {
      this.invite(who, kid);
    } else if (task.type === 'sendBack' && kid.state === 'following') {
      kid.say(S.say.goingBack);
      kid.returnToBed(this.map);
    }
  }

  startBalloon(who, kid) {
    const shape = SHAPES[Math.floor(this.rng() * SHAPES.length)];
    const color = BALLOON_COLORS[Math.floor(this.rng() * BALLOON_COLORS.length)];
    // chi ha la chitarra, al posto del palloncino suona una canzone
    const song = who.character.gear === 'guitar';
    who.back = false;
    who.action = { type: 'balloon', t: 0, duration: CONFIG.balloon.duration, kid, shape, color, song };
    who.say(this.line(song ? S.say.songStart : S.say.balloonStart), 1.6);
    this.sound(song ? 'strum' : 'pump', who);
  }

  // Per la canzone lo "scoppio" è una corda che si rompe.
  finishBalloon(who, { kid, shape, color, song }) {
    const mine = who === this.player;
    const audience = audienceAround(this.map, who, this.kids);
    const forced = mine ? this.forcedOutcome : null;
    const result = resolveBalloon({ target: kid, audience, rng: this.rng, forced });

    for (const { kid: k, delta, reaction } of result.effects) {
      this.cheerUp(k, delta, who);
      if (reaction === 'upset') {
        k.react('sad', 3);
        k.say(this.line(song ? S.say.stringUpset : S.say.popUpset));
      } else if (reaction === 'amused') {
        k.react('joy', 3);
        k.say(this.line(song ? S.say.stringAmused : S.say.popAmused));
      } else {
        k.react('joy', 2.6);
        k.cheer = 1.6;
        if (k === kid) k.say(this.line(S.say.happy));
      }
    }

    if (mine) {
      const counter = result.popped ? (song ? 'broken' : 'popped') : song ? 'songs' : 'balloons';
      this.stats[counter]++;
    }
    if (result.popped) {
      this.burst(who.x + 0.25, who.y - 0.1, 44, 'shard', song ? 8 : 26, [song ? '#d9dde3' : color]);
      this.float(who.x, who.y, 96, song ? S.say.stringBroke : S.say.pop, '#c22820');
      this.sound(song ? 'twang' : 'pop', who);
      this.sound('giggle', who);
    } else {
      if (!song) kid.balloon = { shape, color, time: CONFIG.balloon.keepSeconds };
      this.burst(kid.x, kid.y, 60, song ? 'note' : 'confetti', song ? 10 : 22, BALLOON_COLORS);
      this.float(who.x, who.y, 96, song ? S.say.songDone : S.balloons[shape], '#2457a6');
      this.sound('success', who);
    }
    return result;
  }

  startGift(who, kid) {
    if (!who.carried) return;
    if (kid.toy) {
      kid.say(S.say.alreadyPlaying);
      this.sound('nope', who);
      return;
    }
    const toyId = who.carried;
    who.carried = null;
    kid.toy = { id: toyId, time: CONFIG.toys.keepSeconds, mine: who === this.player };
    kid.react('joy', CONFIG.toys.giveDuration + 1);
    kid.say(this.line(kid.favourite === toyId ? S.say.toyFavourite : S.say.toy));
    who.action = { type: 'giving', t: 0, duration: CONFIG.toys.giveDuration, kid, toyId };
    this.sound('toy', who);
  }

  finishGift(who, { kid, toyId }) {
    this.cheerUp(kid, giftGain(kid, toyId), who);
    this.burst(kid.x, kid.y, 64, 'heart', kid.favourite === toyId ? 14 : 7, ['#ef5b6c', '#ff8fa3']);
    this.sound('success', who);
  }

  invite(who, kid) {
    const refusal = inviteRefusal(kid, this.kids, who);
    if (refusal === 'bedridden') {
      kid.say(S.say.bedridden, 3.2);
      this.sound('nope', who);
    } else if (refusal === 'tooMany') {
      this.toast(S.toast.tooMany, who);
    } else if (!refusal) {
      const start = nearestWalkable(this.map, kid.x, kid.y);
      if (kid.state === 'bed') {
        // scende dal letto dal lato del volontario
        const side = this.map
          .tilesAround(kid.bed)
          .filter((t) => this.map.areaAt(t.x, t.y) === kid.bed.room)
          .sort((a, b) => distance(a, who) - distance(b, who))[0] ?? start;
        kid.x = side.x + 0.5;
        kid.y = side.y + 0.5;
      }
      kid.state = 'following';
      kid.leader = who;
      kid.react('joy', 2);
      kid.say(this.line(S.say.accept));
      if (who === this.player) this.selected = null;
      this.toast(S.toast.goToPlayroom, who);
      this.sound('giggle', who);
    }
  }

  // ---------- aggiornamento ----------
  update(dt) {
    this.time += dt;
    for (const who of this.volunteers) who.cooldown = Math.max(0, who.cooldown - dt);
    for (const colleague of this.colleagues) updateColleague(this, colleague, dt);
    for (const who of this.volunteers) this.updateVolunteer(who, dt);
    this.kids.forEach((kid) => this.updateKid(kid, dt));
    this.adults.forEach((a) => a.update(dt, this.map));
    this.updateEffects(dt);

    const ready = !this.player.busy && this.readyToPlay().length > 0;
    if (ready && !this.wasReady) this.toast(S.toast.readyToPlay);
    this.wasReady = ready;
  }

  updateVolunteer(who, dt) {
    const arrived = who.step(dt);
    if (arrived && !who.busy) this.runTask(who);

    const { action } = who;
    if (!action) return;
    action.t += dt;

    if (action.type === 'super') {
      this.updateSuper(who, action);
    } else if (action.type === 'playing') {
      if (action.t >= action.nextLine) {
        action.nextLine += 1.5;
        const kid = this.line(action.friends);
        kid.say(this.line(S.say.playing), 1.3);
        this.burst(kid.x, kid.y, 50, 'confetti', 8, BALLOON_COLORS);
      }
    }

    if (action.t < action.duration) return;
    who.action = null;
    if (action.type === 'balloon') this.finishBalloon(who, action);
    else if (action.type === 'giving') this.finishGift(who, action);
    else if (action.type === 'playing') {
      for (const kid of action.friends) {
        this.cheerUp(kid, CONFIG.playdate.gain, who);
        kid.react('joy', 3);
        kid.say(S.say.goingBack, 2.4);
        kid.returnToBed(this.map);
      }
      this.sound('success', who);
    }
  }

  // Un bambino coinvolto in un'azione resta fermo.
  isEngaged(kid) {
    return this.volunteers.some(
      ({ action, task }) =>
        task?.kidId === kid.id || action?.kid === kid || (action?.type === 'super' && action.audience.includes(kid)),
    );
  }

  updateKid(kid, dt) {
    if (kid.reaction && (kid.reaction.t -= dt) <= 0) kid.reaction = null;
    kid.cheer = Math.max(0, kid.cheer - dt);
    kid.frizz = Math.max(0, kid.frizz - dt);
    if (kid.balloon && (kid.balloon.time -= dt) <= 0) kid.balloon = null;
    if (kid.toy && !this.isEngaged(kid) && (kid.toy.time -= dt) <= 0) {
      this.shelf.putBack(kid.toy.id);
      if (kid.toy.mine) this.toast(S.toast.toyReturned(S.toys[kid.toy.id]));
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
    if (kid.state === 'playing' && !kid.moving && kid.leader) kid.faceTowards(kid.leader.x, kid.leader.y);
  }

  follow(kid, dt) {
    const { leader } = kid;
    const place = followersOf(this.kids, leader).indexOf(kid);
    const gap = 1.2 + place * 0.75;
    kid.repath -= dt;
    const sameArea = this.map.areaAt(kid.x, kid.y) === this.map.areaAt(leader.x, leader.y);
    if (distance(kid, leader) <= gap && sameArea) {
      kid.stop();
      kid.faceTowards(leader.x, leader.y);
    } else if (kid.repath <= 0) {
      kid.repath = 0.3;
      const { x, y } = leader.tile;
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
      p.vz -= ({ heart: 30, note: 15 }[p.kind] ?? 220) * dt;
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
