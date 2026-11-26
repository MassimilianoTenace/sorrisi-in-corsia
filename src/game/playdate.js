import { CONFIG } from '../config.js';

export const followersOf = (kids) => kids.filter((k) => k.state === 'following');

// Ritorna null se il bambino può venire, altrimenti il motivo del rifiuto.
export function inviteRefusal(kid, kids) {
  if (kid.state === 'following' || kid.state === 'playing') return 'busy';
  if (kid.bedridden) return 'bedridden';
  if (followersOf(kids).length >= CONFIG.playdate.maxFollowers) return 'tooMany';
  return null;
}

// Chi può giocare adesso: il volontario e i bambini al seguito dentro la sala giochi.
export function playersReady(map, player, kids) {
  if (map.areaAt(player.x, player.y) !== 'giochi') return [];
  return followersOf(kids).filter((k) => map.areaAt(k.x, k.y) === 'giochi');
}
