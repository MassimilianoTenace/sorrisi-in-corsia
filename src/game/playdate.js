import { CONFIG } from '../config.js';

// I bambini al seguito di un volontario (senza volontario: tutti quelli al seguito di qualcuno).
export const followersOf = (kids, leader = null) =>
  kids.filter((k) => k.state === 'following' && (!leader || k.leader === leader));

// Ritorna null se il bambino può venire, altrimenti il motivo del rifiuto.
export function inviteRefusal(kid, kids, leader = null) {
  if (kid.state === 'following' || kid.state === 'playing') return 'busy';
  if (kid.bedridden) return 'bedridden';
  if (followersOf(kids, leader).length >= CONFIG.playdate.maxFollowers) return 'tooMany';
  return null;
}

// Chi può giocare adesso: il volontario e i bambini al seguito dentro la sala giochi.
export function playersReady(map, player, kids) {
  if (map.areaAt(player.x, player.y) !== 'giochi') return [];
  return followersOf(kids, player).filter((k) => map.areaAt(k.x, k.y) === 'giochi');
}
