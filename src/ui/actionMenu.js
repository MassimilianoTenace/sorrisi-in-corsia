// Scheda che appare accanto al bambino scelto, con le azioni possibili.
import { el } from './dom.js';
import { S } from '../strings.it.js';
import { icon, toyIcon } from '../art/icons.js';
import { happinessColor, moodIndex } from '../game/happiness.js';

export function actionsFor(game, kid) {
  const carried = game.player.carried;
  const following = kid.state === 'following';
  return [
    { id: 'balloon', key: 1, icon: 'balloon', label: S.actions.balloon, enabled: true },
    {
      id: carried ? 'toy' : 'shelf',
      key: 2,
      icon: 'toy',
      toy: carried,
      label: carried ? S.actions.toy : S.actions.toyNone,
      enabled: !carried || !kid.toy,
    },
    following
      ? { id: 'sendBack', key: 3, icon: 'back', label: S.actions.sendBack, enabled: true }
      : { id: 'invite', key: 3, icon: 'invite', label: S.actions.invite, enabled: true },
  ];
}

export function createActionMenu(root, { onAction, onClose }) {
  let signature = '';
  let bar = null;
  let mood = null;

  function build(game, kid, list) {
    bar = el('i', {});
    mood = el('span', { class: 'mood' });
    root.replaceChildren(
      el('div', { class: 'menu-head' },
        el('strong', {}, kid.name),
        mood,
        el('button', { type: 'button', class: 'menu-close', 'aria-label': S.close, onclick: onClose }, '×'),
      ),
      el('div', { class: 'meter small' }, bar),
      el('div', { class: 'menu-info' },
        el('span', { class: 'fav' }, `${S.hud.favourite}:`, toyIcon(kid.favourite, 24), S.toys[kid.favourite]),
        el('span', {}, kid.bedridden ? S.hud.bedridden : S.hud.canWalk),
      ),
      el('div', { class: 'menu-actions' },
        ...list.map((a) =>
          el('button', { type: 'button', class: 'tool', 'data-action': a.id, disabled: !a.enabled, onclick: () => onAction(a.id, kid.id) },
            a.toy ? toyIcon(a.toy, 32) : icon(a.icon, 32),
            el('small', {}, a.label),
            el('kbd', {}, String(a.key)),
          ),
        ),
      ),
    );
  }

  return {
    update(game, camera, hidden) {
      const kid = game.selectedKid;
      if (!kid || hidden || game.player.busy || kid.state === 'playing') {
        root.hidden = true;
        signature = '';
        return;
      }
      const list = actionsFor(game, kid);
      const next = `${kid.id}|${list.map((a) => `${a.id}${a.enabled}${a.toy ?? ''}`).join()}`;
      if (next !== signature) {
        signature = next;
        build(game, kid, list);
      }
      root.hidden = false;
      bar.style.width = `${Math.max(4, kid.happiness)}%`;
      bar.style.background = happinessColor(kid.happiness);
      const text = S.hud.mood[moodIndex(kid.happiness)];
      if (mood.textContent !== text) mood.textContent = text;

      // sotto il bambino se c'è posto, altrimenti sopra, altrimenti di lato
      const p = camera.worldToView(kid.x, kid.y, 0);
      const { offsetWidth: w, offsetHeight: h } = root;
      const limit = camera.usableHeight - 6;
      const clamp = (v, max) => Math.round(Math.max(6, Math.min(max, v)));
      const below = p.y + 26 * camera.zoom;
      const above = p.y - 105 * camera.zoom - h;
      let left = p.x - w / 2;
      let top = below;
      if (below + h > limit) {
        if (above >= 6) top = above;
        else {
          const gap = 55 * camera.zoom;
          left = p.x + gap + w <= camera.view.w ? p.x + gap : p.x - gap - w;
          top = p.y - h / 2;
        }
      }
      root.style.transform = `translate(${clamp(left, camera.view.w - w - 6)}px, ${clamp(top, limit - h)}px)`;
    },
  };
}
