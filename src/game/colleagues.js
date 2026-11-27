// I colleghi: volontari che girano da soli e fanno tutto ciò che può fare il giocatore.
// Ogni attività è un generatore: a ogni "yield" riprende al passo di gioco successivo.
// Non usa il browser: i test la fanno girare direttamente.
import { CONFIG } from '../config.js';
import { S } from '../strings.it.js';
import { CHARACTERS } from '../characters/index.js';
import { Volunteer } from '../entities/volunteer.js';
import { superAudience } from './superpower.js';
import { followersOf } from './playdate.js';

const C = CONFIG.colleagues;
const STARTS = [{ x: 4.5, y: 8.5 }, { x: 11.5, y: 7.5 }, { x: 9.5, y: 8.5 }];
const PLAYROOM_DOOR = { x: 15.5, y: 7.5 };

const between = (rng, [min, max]) => min + rng() * (max - min);

export class Colleague extends Volunteer {
  constructor(character, x, y) {
    super(character, x, y, CONFIG.speed.colleague);
    this.routine = null; // attività in corso
    this.activity = null;
    this.timer = 0;
    this.wait = 0;
  }
}

// Volontari scelti a caso, tutti diversi tra loro e da quello del giocatore.
export function createColleagues(count, playerId, rng) {
  const others = CHARACTERS.filter((c) => c.id !== playerId);
  return Array.from({ length: count }, (_, i) => {
    const [character] = others.splice(Math.floor(rng() * others.length), 1);
    const spot = STARTS[i % STARTS.length];
    const colleague = new Colleague(character, spot.x, spot.y);
    colleague.wait = between(rng, C.firstPause);
    colleague.cooldown = between(rng, C.firstSuper);
    return colleague;
  });
}

// Un bambino libero: né scelto dal giocatore né già seguito da un altro volontario.
function freeKid(game, me, wanted = () => true) {
  const free = game.kids.filter(
    (k) =>
      k.state !== 'playing' && k.state !== 'following' &&
      !game.isClaimedByPlayer(k) && !game.isTargeted(k, me) && wanted(k),
  );
  // si va più volentieri da chi è giù di morale
  free.sort((a, b) => a.happiness - b.happiness);
  const pool = free.slice(0, 3);
  return pool[Math.floor(game.rng() * pool.length)] ?? null;
}

// Aspetta che il volontario sia arrivato e abbia finito.
function* settle(me) {
  while (me.busy || me.task || me.moving) yield;
}

const ROUTINES = {
  *greet(game, me) {
    const kid = freeKid(game, me);
    if (!kid || !game.interact('approach', kid.id, me)) return;
    yield* settle(me);
    me.say(game.line(S.say.volunteerGreet), 1.8);
  },

  // chi ha la chitarra suona una canzone: ci pensa il gioco
  *balloon(game, me) {
    const kid = freeKid(game, me);
    if (!kid || !game.interact('balloon', kid.id, me)) return;
    yield* settle(me);
  },

  *gift(game, me) {
    const wanted = (k) => !k.toy;
    if (!game.shelf.list().length || !freeKid(game, me, wanted) || !game.openShelf(me)) return;
    yield* settle(me);
    const kid = freeKid(game, me, wanted);
    const toys = game.shelf.list();
    if (!kid || !toys.length) return;
    const toy = toys.includes(kid.favourite) ? kid.favourite : game.line(toys);
    if (!game.takeToy(toy, me) || !game.interact('toy', kid.id, me)) return;
    yield* settle(me);
  },

  *playdate(game, me) {
    const guests = 1 + Math.floor(game.rng() * 2);
    for (let i = 0; i < guests; i++) {
      const kid = freeKid(game, me, (k) => k.state === 'bed' && !k.bedridden);
      if (!kid || !game.interact('invite', kid.id, me)) break;
      yield* settle(me);
    }
    const friends = () => followersOf(game.kids, me);
    if (!friends().length || !game.walk(PLAYROOM_DOOR.x, PLAYROOM_DOOR.y, me)) return;
    yield* settle(me);
    while (friends().length && game.readyToPlay(me).length < friends().length) yield;
    if (game.playTogether(me)) yield* settle(me);
  },

  *superpower(game, me) {
    if (!superAudience(game.map, me, game.kids).length) {
      const kid = freeKid(game, me);
      if (!kid || !game.interact('approach', kid.id, me)) return;
      yield* settle(me);
    }
    if (game.superpower(me)) yield* settle(me);
  },
};

export const ACTIVITIES = Object.keys(ROUTINES);

function chooseActivity(me, rng) {
  const options = ACTIVITIES.filter((name) => name !== 'superpower' || me.cooldown <= 0);
  let roll = rng() * options.reduce((sum, name) => sum + C.weights[name], 0);
  return options.find((name) => (roll -= C.weights[name]) < 0) ?? options[0];
}

// Chiude l'attività (finita o interrotta) lasciando tutto in ordine.
export function retire(game, me) {
  if (me.action?.type === 'playing') me.action.friends.forEach((kid) => kid.returnToBed(game.map));
  me.action = null;
  me.task = null;
  me.stop();
  followersOf(game.kids, me).forEach((kid) => kid.returnToBed(game.map));
  if (me.carried) {
    game.shelf.putBack(me.carried);
    me.carried = null;
  }
  me.routine = null;
  me.activity = null;
  me.wait = between(game.rng, C.pause);
}

export function updateColleague(game, me, dt) {
  if (!me.routine) {
    if ((me.wait -= dt) > 0) return;
    me.activity = chooseActivity(me, game.rng);
    me.routine = ROUTINES[me.activity](game, me);
    me.timer = 0;
  }
  me.timer += dt;
  // il tempo massimo evita di restare bloccati per sempre
  if (me.timer > C.activityTimeout || me.routine.next().done) retire(game, me);
}
