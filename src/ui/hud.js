// Pannello di controllo in basso, nome della stanza e messaggi.
import { el } from './dom.js';
import { S } from '../strings.it.js';
import { CONFIG } from '../config.js';
import { drawPortrait } from '../art/portrait.js';
import { icon, toyIcon } from '../art/icons.js';
import { happinessColor } from '../game/happiness.js';

export function createHud({ panel, roomLabel, toasts }, actions) {
  const portrait = el('canvas', { width: 144, height: 158 });
  const name = el('strong', {});
  const meterFill = el('i', {});
  const meterValue = el('b', {});
  const smiles = el('b', {});
  const balloons = el('b', {});
  const popped = el('b', {});
  const balloonsLabel = el('span', {});
  const poppedLabel = el('span', {});
  const changeButton = el('button', { type: 'button', id: 'btn-change', class: 'group who', title: S.changeCharacter, onclick: actions.changeCharacter },
    portrait,
    name,
    el('small', {}, S.actions.change),
  );
  const toySlot = el('span', { class: 'slot' });
  const toyName = el('small', {});
  const cooldown = el('i', { class: 'cooldown' });
  const superText = el('small', {});

  const control = (id, iconName, label, onclick, extra = {}) =>
    el('button', { type: 'button', id, class: 'tool', title: label, 'aria-label': label, onclick, ...extra },
      icon(iconName, 32),
      el('small', {}, label),
    );

  const playButton = control('btn-play', 'play', S.actions.playTogether, actions.playTogether, { hidden: true });
  playButton.classList.add('highlight');
  const soundButton = control('btn-sound', 'soundOn', S.actions.sound, actions.toggleSound);

  const toyButton = el('button', { type: 'button', id: 'btn-carry', class: 'tool carry', onclick: actions.shelf, title: S.hud.carrying },
    toySlot,
    toyName,
  );
  const superButton = el('button', { type: 'button', id: 'btn-super', class: 'tool super', onclick: actions.superpower, title: S.actions.super },
    cooldown,
    icon('super', 38),
    superText,
  );

  panel.replaceChildren(
    changeButton,
    el('div', { class: 'group stats' },
      el('div', { class: 'meter-label' }, S.hud.average, ' ', meterValue),
      el('div', { class: 'meter' }, meterFill),
      el('div', { class: 'counters' },
        el('span', {}, `${S.hud.smiles}: `, smiles),
        el('span', {}, balloonsLabel, balloons),
        el('span', { class: 'popped' }, popped, poppedLabel),
      ),
    ),
    el('div', { class: 'group tools' },
      playButton,
      toyButton,
      superButton,
      el('div', { class: 'system' },
        control('btn-center', 'center', S.actions.center, actions.center),
        soundButton,
        control('btn-help', 'help', S.actions.help, actions.help),
      ),
    ),
  );

  let last = {};
  const changed = (key, value) => {
    if (last[key] === value) return false;
    last[key] = value;
    return true;
  };

  // Ritratto, nome e nomi dei contatori seguono il volontario scelto.
  function setCharacter(game) {
    const { character } = game.player;
    last = {};
    drawPortrait(portrait, character);
    name.textContent = S.characters[character.id].name;
    const guitar = character.gear === 'guitar';
    balloonsLabel.textContent = `${guitar ? S.hud.songs : S.hud.balloons}: `;
    poppedLabel.textContent = ` ${guitar ? S.hud.broken : S.hud.popped}`;
  }

  return {
    setCharacter,

    reset(game) {
      toasts.replaceChildren();
      setCharacter(game);
    },

    update(game) {
      const avg = Math.round(game.averageHappiness);
      if (changed('avg', avg)) {
        meterFill.style.width = `${avg}%`;
        meterFill.style.background = happinessColor(avg);
        meterValue.textContent = `${avg}%`;
      }
      if (changed('smiles', game.stats.smiles)) smiles.textContent = game.stats.smiles;
      const guitar = game.player.character.gear === 'guitar';
      const made = guitar ? game.stats.songs : game.stats.balloons;
      const failed = guitar ? game.stats.broken : game.stats.popped;
      if (changed('balloons', made)) balloons.textContent = made;
      if (changed('popped', failed)) popped.textContent = failed;

      const carried = game.player.carried;
      if (changed('carried', carried ?? 'none')) {
        toySlot.replaceChildren(carried ? toyIcon(carried, 32) : icon('toy', 32));
        toySlot.classList.toggle('empty', !carried);
        toyName.textContent = carried ? S.toys[carried] : S.actions.toyNone;
      }

      const wait = Math.ceil(game.cooldown);
      const busy = game.player.busy;
      cooldown.style.height = `${(game.cooldown / CONFIG.superpower.cooldown) * 100}%`;
      if (changed('super', `${wait}|${busy}`)) {
        superText.textContent = wait > 0 ? `${wait}s` : S.actions.super;
        superButton.disabled = wait > 0 || busy;
        superButton.classList.toggle('ready', wait === 0 && !busy);
        toyButton.disabled = busy;
        changeButton.disabled = busy;
      }

      const canPlay = !busy && game.readyToPlay().length > 0;
      if (changed('play', canPlay)) playButton.hidden = !canPlay;

      const area = game.map.areaAt(game.player.x, game.player.y);
      if (area && changed('room', area)) roomLabel.textContent = S.rooms[area];
    },

    setMuted(muted) {
      soundButton.querySelector('canvas').replaceWith(icon(muted ? 'soundOff' : 'soundOn', 32));
      soundButton.setAttribute('aria-pressed', String(muted));
    },

    toast(text) {
      // niente doppioni uno sull'altro
      for (const old of toasts.children) if (old.textContent === text) old.remove();
      const node = el('div', { class: 'toast' }, text);
      toasts.append(node);
      while (toasts.children.length > 3) toasts.firstChild.remove();
      setTimeout(() => node.remove(), 3600);
    },
  };
}
