/* XONLAR JANGI — pixel-art sprite generator (faqat fillRect ishlatadi). 1 art-piksel = 2 dunyo birligi */
(function (root) {
'use strict';
function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
function sh(c, f) { const [r, g, b] = hex(c); const k = v => Math.max(0, Math.min(255, Math.round(v * f))); return '#' + [k(r), k(g), k(b)].map(v => v.toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
function rnd(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
function disc(c, cx, cy, r, col, sq) { sq = sq || 1; const ry = r * sq; for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) { const w = Math.floor(r * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))) + .5); if (w > 0) R(c, cx - w, cy + y, w * 2, 1, col); } }
function dome(c, cx, cy, r, col, hi) { for (let y = -r; y <= 0; y++) { const w = Math.floor(Math.sqrt(r * r - y * y) + .5); if (w > 0) { R(c, cx - w, cy + y, w * 2, 1, col); if (y < -1 && w > 2) R(c, cx - w + 1, cy + y, Math.max(1, w >> 1), 1, hi); R(c, cx + w - 1, cy + y, 1, 1, sh(col, .7)); } } }
function bricks(c, x, y, w, h, base, dark) { R(c, x, y, w, h, base); for (let yy = 0; yy < h; yy += 4) { R(c, x, y + yy, w, 1, dark); const off = (yy / 4) % 2 ? 3 : 0; for (let xx = off; xx < w; xx += 6) R(c, x + xx, y + yy + 1, 1, Math.min(3, h - yy - 1), dark); } R(c, x, y, 1, h, sh(base, 1.12)); R(c, x + w - 1, y, 1, h, sh(base, .8)); }
function flag(c, x, y, team) { R(c, x, y, 1, 9, '#4a3320'); R(c, x + 1, y, 6, 4, team); R(c, x + 1, y + 3, 6, 1, sh(team, .75)); R(c, x + 3, y + 1, 1, 2, '#fff3'); }
function arch(c, x, y, w, h, col) { R(c, x, y + (w >> 1), w, h - (w >> 1), col); for (let i = 0; i < (w >> 1); i++) { const k = (w >> 1) - i; R(c, x + (w >> 1) - k, y + i, k * 2, 1, col); } }

/* ----- odamlar ----- */
function human(c, o) {
  const f = o.f, skin = '#e0ac7e', pants = o.pants || '#3b2e24';
  R(c, 5, 15, 2, f ? 4 : 5, pants); R(c, 9, 15, 2, f ? 5 : 4, pants);
  R(c, 5, f ? 18 : 19, 2, 1, '#1d130b'); R(c, 9, f ? 19 : 18, 2, 1, '#1d130b');
  R(c, 4, 8, 8, 7, o.robe); R(c, 4, 8, 1, 7, sh(o.robe, 1.15)); R(c, 11, 8, 1, 7, sh(o.robe, .75));
  R(c, 4, 13, 8, 1, o.belt || '#e6b422'); R(c, 7, 8, 2, 3, sh(o.robe, .8));
  R(c, 3, 9, 1, 4, sh(o.robe, .85)); R(c, 12, 9, 1, 4, sh(o.robe, .85)); R(c, 3, 13, 1, 1, skin); R(c, 12, 13, 1, 1, skin);
  R(c, 5, 3, 6, 5, skin); R(c, 5, 3, 1, 5, sh(skin, .9)); R(c, 6, 5, 1, 1, '#222'); R(c, 9, 5, 1, 1, '#222'); R(c, 7, 7, 2, 1, '#5a3a22');
}
function hat(c, kind, col, team) {
  if (kind === 'dopi') { R(c, 5, 2, 6, 2, '#15151a'); R(c, 5, 1, 6, 1, '#15151a'); R(c, 6, 2, 1, 1, '#fff'); R(c, 8, 2, 1, 1, '#fff'); R(c, 10, 2, 1, 1, '#fff'); }
  if (kind === 'helm') { R(c, 5, 1, 6, 3, '#aab4bd'); R(c, 6, 0, 4, 1, '#aab4bd'); R(c, 7, -1 + 1, 2, 1, '#e6b422'); R(c, 5, 3, 6, 1, '#6b7580'); R(c, 7, 4, 2, 2, '#aab4bd'); }
  if (kind === 'fur') { R(c, 4, 1, 8, 3, '#5a3b22'); R(c, 5, 0, 6, 1, '#6c4a2d'); R(c, 4, 3, 8, 1, '#3a2514'); R(c, 7, 0, 2, 1, team); }
  if (kind === 'turban') { R(c, 4, 1, 8, 3, '#f3efe2'); R(c, 5, 0, 6, 1, '#f3efe2'); R(c, 4, 3, 8, 1, '#cfc9b4'); R(c, 6, 1, 4, 1, team); R(c, 7, -1 + 1, 2, 1, '#e6b422'); }
}
function spriteHuman(c, type, team, f) {
  if (type === 'dehqon') {
    human(c, { f, robe: '#c9b184', belt: team, pants: '#6e5a3a' }); hat(c, 'dopi', null, team);
    R(c, 13, 6, 1, 10, '#8b5a2b'); R(c, 12, 6, 3, 1, '#9aa5ad'); R(c, 12, 7, 1, 1, '#9aa5ad');
  } else if (type === 'nayzador') {
    human(c, { f, robe: team }); hat(c, 'helm', null, team);
    R(c, 13, 1, 1, 17, '#8b5a2b'); R(c, 12, 2, 3, 1, '#d5dde3'); R(c, 13, 0, 1, 2, '#e8eef2');
    R(c, 1, 8, 4, 6, '#7a4b22'); R(c, 1, 8, 4, 1, '#a46a35'); R(c, 2, 10, 2, 2, team); R(c, 1, 13, 4, 1, '#4a2c12');
  } else if (type === 'kamonchi') {
    human(c, { f, robe: team, pants: '#2e3b2a' }); hat(c, 'fur', null, team);
    R(c, 13, 5, 1, 1, '#7a4b22'); R(c, 14, 6, 1, 7, '#7a4b22'); R(c, 13, 13, 1, 1, '#7a4b22'); R(c, 12, 6, 1, 7, '#efe6c8');
    R(c, 2, 9, 2, 5, '#5a3b22'); R(c, 2, 8, 1, 1, '#d9d0b0');
  } else if (type === 'miltiqchi') {
    human(c, { f, robe: mix(team, '#1b1b22', .55), belt: team }); hat(c, 'turban', null, team);
    R(c, 7, 10, 9, 1, '#4a4a4a'); R(c, 7, 11, 1, 1, '#4a4a4a'); R(c, 5, 10, 3, 2, '#7a4b22'); R(c, 15, 9, 1, 1, '#999');
  }
}
function spriteCav(c, team, f) {
  const br = '#7a4a24', dk = '#5a3418';
  R(c, 3, 11, 12, 5, br); R(c, 3, 15, 12, 1, dk); R(c, 14, 8, 3, 5, br); R(c, 16, 7, 4, 3, br); R(c, 19, 8, 1, 1, '#222'); R(c, 15, 7, 1, 3, '#2c1a0c'); R(c, 14, 6, 2, 1, '#2c1a0c');
  R(c, 2, 11, 2, 6, '#2c1a0c'); R(c, 4, f ? 16 : 16, 2, f ? 4 : 5, dk); R(c, 7, 16, 2, f ? 5 : 4, dk); R(c, 11, 16, 2, f ? 4 : 5, dk); R(c, 14, 16, 2, f ? 5 : 4, dk);
  R(c, 6, 10, 6, 2, team); R(c, 6, 10, 6, 1, sh(team, 1.2));
  R(c, 8, 4, 5, 7, team); R(c, 8, 4, 1, 7, sh(team, 1.15)); R(c, 8, 9, 5, 1, '#e6b422'); R(c, 8, 0, 4, 4, '#e0ac7e'); R(c, 9, 1, 1, 1, '#222'); R(c, 11, 1, 1, 1, '#222'); R(c, 8, -1 + 1, 4, 1, '#aab4bd'); R(c, 7, 0, 1, 2, '#aab4bd'); R(c, 12, 0, 1, 2, '#aab4bd');
  R(c, 17, 0, 1, 12, '#8b5a2b'); R(c, 16, 1, 3, 1, '#d5dde3');
}
function spriteCannon(c, team, f) {
  disc(c, 5, 12, 3, '#5a3a1e'); disc(c, 5, 12, 1, '#2e1c0c'); disc(c, 15, 12, 3, '#5a3a1e'); disc(c, 15, 12, 1, '#2e1c0c');
  R(c, 3, 9, 14, 3, '#7a5230'); R(c, 3, 9, 14, 1, '#9a6a3c');
  R(c, 5, 5, 13, 4, '#3d4248'); R(c, 5, 5, 13, 1, '#7c858d'); R(c, 18, 4, 2, 6, '#2a2e32'); R(c, 4, 6, 2, 2, '#2a2e32'); R(c, 8, 5, 1, 4, '#e6b422'); R(c, 12, 5, 1, 4, '#e6b422');
  R(c, 1, 3, 1, 8, '#4a3320'); R(c, 2, 3, 4, 3, team);
}
function spriteShip(c, team, f) {
  R(c, 2, 17, 24, 3, '#7a4b22'); R(c, 4, 20, 20, 2, '#5a3418'); R(c, 7, 22, 14, 1, '#3d220e'); R(c, 1, 16, 3, 2, '#7a4b22'); R(c, 25, 15, 3, 3, '#7a4b22');
  R(c, 2, 17, 24, 1, '#a16a35'); R(c, 6, 18, 2, 1, '#2a1a0c'); R(c, 12, 18, 2, 1, '#2a1a0c'); R(c, 18, 18, 2, 1, '#2a1a0c');
  R(c, 13, 2, 2, 15, '#4a2f17'); R(c, 15, 3, 9, 11, '#f1ead2'); R(c, 15, 3, 1, 11, '#d3cab0'); R(c, 15, 7, 9, 2, team); R(c, 4, 7, 9, 8, '#e6dfc6'); R(c, 4, 10, 9, 2, team);
  R(c, 13, 0, 5, 3, team); R(c, 13, 0, 1, 3, '#4a3320');
  R(c, 0, 23, 28, 1, '#ffffff55'); R(c, 3, 24, 22, 1, '#ffffff33');
}
function spriteHumans(S, type, team, f) { return type; }

/* ----- manzara ----- */
function spriteTree(c, v) {
  const greens = [['#2f7a2c', '#3f9a3a', '#256122'], ['#3a8a3a', '#52ad48', '#2c6e2c'], ['#4c8a2a', '#6aa83a', '#386b1f']][v];
  R(c, 7, 17, 3, 8, '#5a3b20'); R(c, 7, 17, 1, 8, '#7a5230'); R(c, 6, 23, 5, 1, '#3d2813');
  disc(c, 8, 13, 7, greens[2], .8); disc(c, 5, 10, 5, greens[0], .9); disc(c, 11, 9, 5, greens[0], .9); disc(c, 8, 6, 6, greens[0], .9);
  disc(c, 7, 5, 3, greens[1]); disc(c, 4, 9, 2, greens[1]); disc(c, 11, 8, 2, greens[1]);
  const r = rnd(v * 31 + 5); for (let i = 0; i < 8; i++) R(c, 2 + (r() * 12 | 0), 3 + (r() * 12 | 0), 1, 1, greens[2]);
}
function spriteRock(c, v) {
  const base = ['#8b9097', '#7d8389', '#9a9fa4'][v];
  disc(c, 8, 8, 6, sh(base, .75), .7); disc(c, 7, 7, 5, base, .7); disc(c, 5, 6, 2, sh(base, 1.25), .8); R(c, 3, 11, 10, 1, sh(base, .6));
  disc(c, 12, 11, 3, sh(base, .9), .7); R(c, 11, 10, 2, 1, sh(base, 1.2));
}
function spriteGold(c, v) {
  const base = '#7d8389'; disc(c, 8, 8, 6, '#5d6369', .7); disc(c, 7, 7, 5, base, .7); R(c, 3, 11, 10, 1, '#4a4f55');
  const g = ['#f5c518', '#ffe066', '#c99a0c']; const r = rnd(v * 7 + 3);
  for (let i = 0; i < 7; i++) { const x = 3 + (r() * 9 | 0), y = 4 + (r() * 6 | 0); R(c, x, y, 2, 2, g[0]); R(c, x, y, 1, 1, g[1]); R(c, x + 1, y + 1, 1, 1, g[2]); }
}
function spriteBush(c, v) {
  disc(c, 8, 9, 6, '#2c6e2c', .6); disc(c, 6, 8, 4, '#3f9a3a', .7); disc(c, 11, 8, 4, '#3a8a3a', .7);
  const r = rnd(v * 11 + 1); for (let i = 0; i < 6; i++) { const x = 3 + (r() * 10 | 0), y = 5 + (r() * 6 | 0); R(c, x, y, 2, 2, '#d8263a'); R(c, x, y, 1, 1, '#ff7a86'); }
}
function spriteDeer(c, f) { R(c, 3, 5, 8, 4, '#a9733d'); R(c, 3, 8, 8, 1, '#e8d8b8'); R(c, 10, 2, 2, 4, '#a9733d'); R(c, 11, 1, 3, 3, '#a9733d'); R(c, 13, 2, 1, 1, '#222'); R(c, 11, 0, 1, 2, '#6b4a2a'); R(c, 13, 0, 1, 2, '#6b4a2a'); R(c, 4, 9, 1, f ? 3 : 4, '#7a5230'); R(c, 6, 9, 1, f ? 4 : 3, '#7a5230'); R(c, 9, 9, 1, f ? 3 : 4, '#7a5230'); R(c, 10, 9, 1, f ? 4 : 3, '#7a5230'); R(c, 2, 5, 1, 2, '#fff'); }
function spriteSheep(c, f) { disc(c, 6, 5, 4, '#f1efe8', .8); R(c, 9, 4, 3, 3, '#3a3a3a'); R(c, 11, 5, 1, 1, '#fff'); R(c, 3, 8, 1, f ? 2 : 3, '#3a3a3a'); R(c, 8, 8, 1, f ? 3 : 2, '#3a3a3a'); }
function spriteCamel(c, f) { R(c, 3, 7, 11, 5, '#c79a56'); R(c, 5, 4, 3, 3, '#b3843f'); R(c, 9, 4, 3, 3, '#b3843f'); R(c, 14, 5, 2, 5, '#c79a56'); R(c, 15, 3, 4, 3, '#c79a56'); R(c, 18, 4, 1, 1, '#222'); R(c, 4, 12, 1, f ? 4 : 5, '#a07a3c'); R(c, 7, 12, 1, f ? 5 : 4, '#a07a3c'); R(c, 11, 12, 1, f ? 4 : 5, '#a07a3c'); R(c, 13, 12, 1, f ? 5 : 4, '#a07a3c'); R(c, 2, 8, 1, 3, '#8b6430'); R(c, 6, 9, 5, 2, '#c0392b'); }

/* ----- binolar (16px = 1 tile; tagi = poydevor) ----- */
function bSaroy(c, T) {
  const W = 48, H = 72; const wall = '#dcc08f', dk = '#a98757';
  bricks(c, 4, 42, 40, 30, wall, dk); R(c, 4, 42, 40, 2, sh(wall, 1.12)); R(c, 3, 70, 42, 2, sh(dk, .7));
  R(c, 4, 47, 40, 3, T); R(c, 4, 47, 40, 1, sh(T, 1.2)); R(c, 4, 49, 40, 1, sh(T, .7));
  R(c, 15, 52, 18, 20, '#1d4e89'); arch(c, 17, 54, 14, 18, '#102f56'); arch(c, 19, 58, 10, 14, '#2a1a0e'); R(c, 20, 66, 8, 6, '#2a1a0e'); R(c, 24, 58, 1, 14, '#4a2f17');
  R(c, 15, 52, 18, 1, '#e6b422'); R(c, 15, 52, 1, 20, '#e6b422'); R(c, 32, 52, 1, 20, '#e6b422');
  R(c, 8, 54, 4, 6, '#2a1a0e'); R(c, 36, 54, 4, 6, '#2a1a0e'); R(c, 8, 54, 4, 1, '#e6b422'); R(c, 36, 54, 4, 1, '#e6b422');
  R(c, 17, 34, 14, 10, '#e9d6a8'); R(c, 17, 34, 14, 1, '#fff6d8'); R(c, 17, 43, 14, 1, dk); R(c, 21, 37, 2, 4, '#1d4e89'); R(c, 25, 37, 2, 4, '#1d4e89');
  dome(c, 24, 34, 11, '#2aa6c7', '#7fe0f2'); R(c, 13, 33, 22, 1, '#1b7f99'); R(c, 23, 14, 2, 10, '#e6b422'); R(c, 22, 12, 4, 3, '#e6b422'); R(c, 23, 11, 2, 1, '#fff3a0');
  for (const x of [2, 38]) { bricks(c, x, 26, 8, 22, '#d1b07a', dk); R(c, x - 1, 24, 10, 3, '#e9d6a8'); dome(c, x + 4, 24, 4, '#2aa6c7', '#7fe0f2'); R(c, x + 3, 16, 2, 5, '#e6b422'); R(c, x + 3, 30, 2, 3, '#2a1a0e'); R(c, x + 2, 40, 4, 2, T); }
  flag(c, 24, 0, T);
}
function bUy(c, T) {
  bricks(c, 3, 22, 26, 24, '#d7b98a', '#a98757'); R(c, 1, 17, 30, 6, '#8a6a45'); R(c, 1, 17, 30, 2, '#a98757'); R(c, 1, 22, 30, 1, '#5a3b20');
  R(c, 3, 19, 26, 2, T); R(c, 3, 19, 26, 1, sh(T, 1.2)); for (let x = 2; x < 30; x += 4) R(c, x, 15, 2, 2, '#8a6a45');
  R(c, 12, 30, 8, 16, '#4a2f17'); arch(c, 12, 28, 8, 10, '#4a2f17'); R(c, 15, 32, 1, 14, '#2a1a0e'); R(c, 6, 28, 4, 5, '#1d130b'); R(c, 22, 28, 4, 5, '#1d130b'); R(c, 6, 28, 4, 1, '#e9d6a8');
  R(c, 3, 45, 26, 1, '#7d6240');
}
function bOmbor(c, T) {
  R(c, 3, 22, 26, 24, '#8d6238'); for (let x = 3; x < 29; x += 4) R(c, x, 22, 1, 24, '#6e4a28'); R(c, 3, 22, 26, 1, '#b07f4a');
  for (let i = 0; i < 10; i++) R(c, 1 + i, 20 - i, 30 - i * 2, 1, i % 2 ? '#8a3b2a' : '#a24a36'); R(c, 6, 11, 20, 1, '#6e2d20'); R(c, 1, 19, 30, 2, '#6e2d20'); R(c, 6, 14, 20, 2, T);
  R(c, 9, 28, 14, 18, '#3d2813'); R(c, 9, 28, 14, 1, '#b07f4a'); R(c, 15, 28, 1, 18, '#6e4a28'); R(c, 9, 36, 14, 1, '#6e4a28');
  R(c, 4, 38, 7, 8, '#a8773f'); R(c, 4, 38, 7, 1, '#d09a58'); R(c, 4, 42, 7, 1, '#6e4a28'); R(c, 22, 40, 6, 6, '#b88a4a'); R(c, 22, 43, 6, 1, '#6e4a28');
}
function bFerma(c, T) {
  R(c, 0, 4, 32, 28, '#6e4a2a'); for (let y = 6; y < 30; y += 4) { R(c, 1, y, 30, 2, '#4f3319'); for (let x = 2; x < 30; x += 3) { R(c, x, y - 1, 1, 2, y % 8 === 6 ? '#8bc34a' : '#e6c34a'); R(c, x, y - 2, 1, 1, y % 8 === 6 ? '#aed581' : '#f6dd78'); } }
  R(c, 0, 4, 32, 1, '#8a6238'); R(c, 0, 31, 32, 1, '#3d2813'); R(c, 0, 4, 1, 28, '#8a6238'); R(c, 31, 4, 1, 28, '#3d2813'); flag(c, 28, 0, T);
}
function bKazarma(c, T) {
  bricks(c, 2, 26, 44, 22, '#9b9488', '#6f695f'); for (let x = 2; x < 46; x += 6) R(c, x, 22, 4, 5, '#9b9488'), R(c, x, 22, 4, 1, '#bdb7aa'); R(c, 2, 26, 44, 1, '#bdb7aa');
  R(c, 2, 47, 44, 1, '#4a463f'); R(c, 0, 12, 12, 36, '#8c867a'); R(c, 36, 12, 12, 36, '#8c867a'); R(c, 0, 12, 1, 36, '#a8a296'); R(c, 11, 12, 1, 36, '#5f5a50'); R(c, 36, 12, 1, 36, '#a8a296');
  for (const x of [0, 36]) { for (let i = 0; i < 12; i += 4) R(c, x + i, 8, 3, 5, '#8c867a'), R(c, x + i, 8, 3, 1, '#bdb7aa'); R(c, x + 4, 22, 3, 6, '#1d130b'); R(c, x + 4, 34, 3, 6, '#1d130b'); R(c, x + 3, 42, 5, 2, T); }
  R(c, 17, 32, 14, 16, '#2a1a0e'); arch(c, 17, 30, 14, 10, '#2a1a0e'); R(c, 24, 32, 1, 16, '#4a2f17'); R(c, 17, 30, 14, 1, '#6f695f');
  R(c, 19, 14, 10, 16, T); R(c, 19, 14, 10, 2, sh(T, 1.25)); R(c, 19, 29, 10, 1, sh(T, .6)); for (let i = 0; i < 4; i++) R(c, 19 + i * 3 + (i === 3 ? -0 : 0), 30, 2, 2 + (i % 2), T); R(c, 23, 20, 2, 5, '#e6b422'); R(c, 21, 22, 6, 1, '#e6b422');
  for (let i = 0; i < 3; i++) { R(c, 14 + i * 2, 37, 1, 10, '#8b5a2b'); R(c, 13 + i * 2, 36, 3, 1, '#d5dde3'); }
  flag(c, 22, 0, T);
}
function bOtxona(c, T) {
  R(c, 2, 26, 44, 22, '#7d5530'); for (let x = 2; x < 46; x += 4) R(c, x, 26, 1, 22, '#5e3f21'); R(c, 2, 26, 44, 1, '#a07040');
  for (let i = 0; i < 14; i++) R(c, i, 25 - i, 48 - i * 2, 1, i % 2 ? '#7a3a2c' : '#984838'); R(c, 8, 11, 32, 1, '#5e281d'); R(c, 0, 24, 48, 2, '#5e281d'); R(c, 8, 16, 32, 3, T); R(c, 8, 16, 32, 1, sh(T, 1.2));
  R(c, 6, 30, 36, 18, '#241608'); R(c, 6, 30, 36, 1, '#a07040'); R(c, 6, 30, 2, 18, '#a07040'); R(c, 40, 30, 2, 18, '#a07040');
  for (const x of [11, 26]) { R(c, x, 36, 10, 12, '#7a4a24'); R(c, x + 6, 33, 5, 5, '#7a4a24'); R(c, x + 9, 35, 3, 3, '#7a4a24'); R(c, x + 11, 36, 1, 1, '#111'); R(c, x + 5, 33, 2, 5, '#2c1a0c'); R(c, x + 6, 32, 1, 1, '#7a4a24'); }
  R(c, 2, 43, 6, 5, '#d8b448'); R(c, 2, 43, 6, 1, '#f2d878'); R(c, 40, 44, 6, 4, '#d8b448'); R(c, 40, 44, 6, 1, '#f2d878');
  flag(c, 3, 3, T);
}
function bMinora(c, T) {
  bricks(c, 7, 20, 18, 52, '#c4a478', '#8e7550'); R(c, 7, 70, 18, 2, '#6a5538'); R(c, 4, 12, 24, 9, '#b79868'); R(c, 4, 12, 24, 1, '#dcc38e'); R(c, 4, 20, 24, 1, '#7a6140');
  for (let x = 4; x < 28; x += 6) R(c, x, 8, 4, 5, '#b79868'), R(c, x, 8, 4, 1, '#dcc38e'); R(c, 6, 16, 20, 2, T);
  R(c, 14, 28, 4, 8, '#1d130b'); R(c, 14, 44, 4, 8, '#1d130b'); R(c, 13, 60, 6, 10, '#2a1a0e'); arch(c, 13, 58, 6, 6, '#2a1a0e'); R(c, 7, 54, 18, 1, T);
  dome(c, 16, 8, 8, '#2aa6c7', '#7fe0f2'); R(c, 15, 0, 2, 3, '#e6b422'); flag(c, 22, 0, T);
}
function bPort(c, T) {
  R(c, 0, 34, 48, 14, '#9b6b3a'); for (let x = 0; x < 48; x += 6) R(c, x, 34, 1, 14, '#6e4a28'); R(c, 0, 34, 48, 2, '#c08850'); R(c, 0, 47, 48, 1, '#4a2f17');
  for (const x of [1, 22, 44]) R(c, x, 30, 3, 18, '#4a2f17');
  bricks(c, 4, 20, 22, 18, '#c9a46f', '#8e7550'); for (let i = 0; i < 8; i++) R(c, 2 + i, 19 - i, 26 - i * 2, 1, i % 2 ? '#a24a36' : '#8a3b2a'); R(c, 4, 17, 22, 2, T); R(c, 12, 26, 6, 12, '#2a1a0e');
  R(c, 36, 4, 3, 36, '#4a2f17'); R(c, 28, 8, 20, 2, '#4a2f17'); R(c, 40, 10, 1, 14, '#d9c9a0'); R(c, 40, 24, 3, 3, '#6a6a6a');
  R(c, 30, 36, 7, 8, '#8d6238'); R(c, 30, 36, 7, 1, '#b07f4a'); disc(c, 43, 40, 3, '#7a5230', 1.2); R(c, 40, 39, 6, 1, '#3d2813'); flag(c, 2, 8, T);
}
const BDRAW = { saroy: [48, 72, bSaroy], uy: [32, 48, bUy], ombor: [32, 48, bOmbor], ferma: [32, 32, bFerma], kazarma: [48, 48, bKazarma], otxona: [48, 48, bOtxona], minora: [32, 72, bMinora], port: [48, 48, bPort] };

function build(mk, teamColors) {
  const sp = { res: {}, unit: {}, bld: {}, animal: {}, ter: null };
  const make = (w, h, fn) => { const cv = mk(w, h), c = cv.getContext('2d'); fn(c); return cv; };
  sp.res.tree = [0, 1, 2].map(v => make(16, 24, c => spriteTree(c, v)));
  sp.res.rock = [0, 1, 2].map(v => make(16, 14, c => spriteRock(c, v)));
  sp.res.gold = [0, 1, 2].map(v => make(16, 14, c => spriteGold(c, v)));
  sp.res.bush = [0, 1, 2].map(v => make(16, 12, c => spriteBush(c, v)));
  sp.animal.deer = [0, 1].map(f => make(16, 12, c => spriteDeer(c, f)));
  sp.animal.sheep = [0, 1].map(f => make(14, 11, c => spriteSheep(c, f)));
  sp.animal.camel = [0, 1].map(f => make(20, 17, c => spriteCamel(c, f)));
  for (const t of ['dehqon', 'nayzador', 'kamonchi', 'miltiqchi', 'otliq', 'top', 'kema']) {
    sp.unit[t] = teamColors.map(col => [0, 1].map(f => {
      if (t === 'otliq') return make(21, 22, c => spriteCav(c, col, f));
      if (t === 'top') return make(21, 16, c => spriteCannon(c, col, f));
      if (t === 'kema') return make(28, 26, c => spriteShip(c, col, f));
      return make(16, 20, c => spriteHuman(c, t, col, f));
    }));
  }
  for (const t in BDRAW) { const [w, h, fn] = BDRAW[t]; sp.bld[t] = teamColors.map(col => make(w, h, c => fn(c, col))); }
  return sp;
}
function terrain(mk, S, MW, MH) {
  const cv = mk(MW * 16, MH * 16), c = cv.getContext('2d'), r = rnd(S.seed * 3 + 1);
  const water = (x, y) => x < 0 || y < 0 || x >= MW || y >= MH ? false : S.ter[y * MW + x] === 1;
  const near = (x, y, rad) => { for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (water(x + dx, y + dy)) return true; return false; };
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const X = tx * 16, Y = ty * 16;
    if (S.ter[ty * MW + tx] === 1) {
      const deep = !near(tx, ty, 2); R(c, X, Y, 16, 16, deep ? '#1f5f9e' : '#2c78b8');
      for (let i = 0; i < 6; i++) R(c, X + (r() * 14 | 0), Y + (r() * 15 | 0), 2, 1, deep ? '#25699f' : '#3d8ed0');
      if (!deep) for (const [dx, dy, ex, ey, w, h] of [[-1, 0, 0, 0, 1, 16], [1, 0, 15, 0, 1, 16], [0, -1, 0, 0, 16, 1], [0, 1, 0, 15, 16, 1]]) if (!water(tx + dx, ty + dy)) R(c, X + ex, Y + ey, w, h, '#bfe6f5');
    } else {
      const sand = near(tx, ty, 1), v = (tx * 7 + ty * 13) % 3;
      if (sand) { R(c, X, Y, 16, 16, '#dcc78f'); for (let i = 0; i < 7; i++) R(c, X + (r() * 15 | 0), Y + (r() * 15 | 0), 1, 1, r() < .5 ? '#c7b078' : '#ecdcaa'); }
      else {
        R(c, X, Y, 16, 16, ['#5b9a3c', '#559336', '#62a243'][v]);
        for (let i = 0; i < 5; i++) R(c, X + (r() * 14 | 0), Y + (r() * 14 | 0), 2, 1, '#4a8230'); for (let i = 0; i < 4; i++) R(c, X + (r() * 15 | 0), Y + (r() * 15 | 0), 1, 1, '#7cb856');
        const q = r(); if (q < .05) { const fx = X + (r() * 13 | 0), fy = Y + (r() * 13 | 0); R(c, fx, fy, 1, 1, ['#f5e04a', '#ffffff', '#ef6b8a'][r() * 3 | 0]); } else if (q < .09) { const fx = X + (r() * 13 | 0), fy = Y + (r() * 13 | 0); R(c, fx, fy, 1, 2, '#3d6e26'); R(c, fx + 1, fy + 1, 1, 1, '#3d6e26'); }
      }
    }
  }
  return cv;
}
root.Sprites = { build, terrain, sh, mix, rnd };
if (typeof module !== 'undefined') module.exports = root.Sprites;
})(typeof window !== 'undefined' ? window : globalThis);
