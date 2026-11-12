/* XONLAR JANGI — umumiy o'yin mantig'i (host/yakka rejimda ishlaydi, mijoz faqat snapshot oladi) */
(function (root) {
'use strict';
const TILE = 32, MW = 96, MH = 96, TICK = 0.05, POPMAX = 120;

const FACTIONS = [
  { id: 'qoqon', color: '#3b82f6' }, { id: 'buxoro', color: '#ef4444' },
  { id: 'xiva', color: '#22c55e' }, { id: 'qozoq', color: '#c084fc' }];

const UT = {
  dehqon:   { hp: 40,  spd: 54, atk: 3,  rng: 14,  cd: 1.2, armor: 0, cost: { f: 50 },           time: 8,  pop: 1, cls: 'inf', sight: 200, r: 8 },
  nayzador: { hp: 75,  spd: 52, atk: 9,  rng: 16,  cd: 1.0, armor: 2, cost: { f: 60, w: 30 },    time: 10, pop: 1, cls: 'inf', sight: 230, r: 9, bonus: { cls: 'cav', m: 2.5 } },
  kamonchi: { hp: 45,  spd: 54, atk: 8,  rng: 190, cd: 1.3, armor: 0, cost: { f: 40, w: 50 },    time: 11, pop: 1, cls: 'inf', sight: 260, r: 8, ranged: 1 },
  miltiqchi:{ hp: 55,  spd: 50, atk: 22, rng: 170, cd: 2.6, armor: 1, cost: { f: 60, g: 50 },    time: 14, pop: 1, cls: 'inf', sight: 250, r: 8, ranged: 1 },
  otliq:    { hp: 105, spd: 98, atk: 12, rng: 18,  cd: 1.1, armor: 2, cost: { f: 80, g: 40 },    time: 15, pop: 2, cls: 'cav', sight: 260, r: 12 },
  top:      { hp: 90,  spd: 30, atk: 70, rng: 270, cd: 4.5, armor: 0, cost: { w: 150, g: 100 },  time: 25, pop: 3, cls: 'sg',  sight: 300, r: 14, ranged: 1, sieg: 2.5, splash: 1 },
  kema:     { hp: 170, spd: 72, atk: 16, rng: 230, cd: 2.0, armor: 2, cost: { w: 150, g: 50 },   time: 22, pop: 2, cls: 'sh',  sight: 300, r: 14, ranged: 1, sieg: 1.3, splash: 1, water: 1 }};
const BT = {
  saroy:   { w: 3, h: 3, hp: 1500, cost: { w: 300, s: 200 },        bt: 40, train: ['dehqon'], pop: 10, drop: 1, armor: 3 },
  uy:      { w: 2, h: 2, hp: 300,  cost: { w: 60, s: 20 },          bt: 14, pop: 8, armor: 1 },
  ombor:   { w: 2, h: 2, hp: 400,  cost: { w: 80, s: 30 },          bt: 16, drop: 1, armor: 1 },
  ferma:   { w: 2, h: 2, hp: 220,  cost: { w: 70 },                 bt: 12, farm: 1, armor: 0 },
  kazarma: { w: 3, h: 3, hp: 750,  cost: { w: 150, s: 80 },         bt: 28, train: ['nayzador', 'kamonchi', 'miltiqchi', 'top'], armor: 3 },
  otxona:  { w: 3, h: 3, hp: 700,  cost: { w: 140, s: 60, g: 20 },  bt: 28, train: ['otliq'], armor: 3 },
  minora:  { w: 2, h: 2, hp: 650,  cost: { w: 60, s: 150 },         bt: 24, tower: { rng: 240, atk: 14, cd: 1.3 }, armor: 4 },
  port:    { w: 3, h: 3, hp: 650,  cost: { w: 200, s: 60 },         bt: 28, train: ['kema'], dock: 1, armor: 2 }};
const RT = { tree: { rk: 'w', amt: 90 }, rock: { rk: 's', amt: 260 }, gold: { rk: 'g', amt: 380 }, bush: { rk: 'f', amt: 160 } };
const UNAMES = Object.keys(UT), BNAMES = Object.keys(BT), RNAMES = Object.keys(RT);
UNAMES.forEach((k, i) => UT[k].n = i); BNAMES.forEach((k, i) => BT[k].n = i);
const GR = { w: 0.95, s: 0.7, g: 0.6, f: 1.0, farm: 0.62 };

function rng(seed) { let s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------------- Xarita ---------------- */
function blob(ter, R, cx, cy, r, val) {
  const p1 = R() * 6.28, p2 = R() * 6.28, p3 = R() * 6.28, rr = Math.ceil(r * 1.5);
  for (let y = cy - rr; y <= cy + rr; y++) for (let x = cx - rr; x <= cx + rr; x++) {
    if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
    const dx = x - cx, dy = y - cy, a = Math.atan2(dy, dx);
    const rad = r * (1 + .22 * Math.sin(3 * a + p1) + .14 * Math.sin(5 * a + p2) + .08 * Math.sin(7 * a + p3));
    if (dx * dx + dy * dy < rad * rad) ter[y * MW + x] = val;
  }
}
const STARTS4 = [[13, 13], [82, 82], [82, 13], [13, 82]];
function genMap(seed, np) {
  for (let at = 0; at < 60; at++) {
    const R = rng(seed * 7919 + at * 104729 + 1);
    const ter = new Uint8Array(MW * MH), res = [], occ = new Uint8Array(MW * MH);
    const starts = STARTS4.slice(0, np);
    blob(ter, R, 48, 48, 9 + R() * 5, 1);
    for (let i = 0; i < 5; i++) {
      const x = 12 + (R() * 72 | 0), y = 12 + (R() * 72 | 0);
      if (STARTS4.some(s => Math.hypot(s[0] - x, s[1] - y) < 22)) continue;
      blob(ter, R, x, y, 2.5 + R() * 3.5, 1);
    }
    const put = (type, x, y) => {
      if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) return false;
      const i = y * MW + x; if (ter[i] || occ[i]) return false;
      for (const s of STARTS4) if (Math.hypot(s[0] + 1 - x, s[1] + 1 - y) <= 6) return false;
      occ[i] = 1; res.push({ id: res.length + 1, type, tx: x, ty: y }); return true;
    };
    const cluster = (type, cx, cy, r, dens) => {
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if (Math.hypot(x - cx, y - cy) < r && R() < dens) put(type, x, y);
    };
    for (let i = 0; i < 18; i++) cluster('tree', 4 + R() * 88, 4 + R() * 88, 3 + R() * 4, .8);
    for (let i = 0; i < 160; i++) put('tree', 3 + (R() * 90 | 0), 3 + (R() * 90 | 0));
    for (let i = 0; i < 7; i++) cluster('rock', 6 + R() * 84, 6 + R() * 84, 1.6 + R() * .9, .9);
    for (let i = 0; i < 7; i++) cluster('gold', 6 + R() * 84, 6 + R() * 84, 1.5 + R() * .6, .85);
    for (let i = 0; i < 8; i++) cluster('bush', 6 + R() * 84, 6 + R() * 84, 1.6, .6);
    for (const s of STARTS4) {
      const sx = s[0] + 1, sy = s[1] + 1, ang = Math.atan2(48 - sy, 48 - sx);
      const at2 = (a, d) => [sx + Math.cos(ang + a) * d, sy + Math.sin(ang + a) * d];
      let p = at2(.7, 10); cluster('gold', p[0], p[1], 2.1, .9);
      p = at2(-.7, 10); cluster('rock', p[0], p[1], 2.2, .9);
      p = at2(1.7, 12); cluster('tree', p[0], p[1], 3.6, .85);
      p = at2(-1.7, 12); cluster('tree', p[0], p[1], 3.6, .85);
      p = at2(0, 8); cluster('bush', p[0], p[1], 1.8, .75);
      p = at2(2.5, 9); cluster('tree', p[0], p[1], 3, .8);
    }
    // bog'liqlik tekshiruvi
    const blocked = i => ter[i] || occ[i];
    const seen = new Uint8Array(MW * MH), q = [], sx0 = STARTS4[0][0] + 1, sy0 = STARTS4[0][1] + 1;
    q.push(sy0 * MW + sx0); seen[q[0]] = 1;
    for (let h = 0; h < q.length; h++) { const i = q[h], x = i % MW, y = (i / MW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue; const ni = ny * MW + nx; if (!seen[ni] && !blocked(ni)) { seen[ni] = 1; q.push(ni); } } }
    let ok = true;
    for (let k = 0; k < np; k++) if (!seen[(starts[k][1] + 1) * MW + starts[k][0] + 1]) ok = false;
    for (const s of starts) { let tr = 0; for (const r of res) if (r.type === 'tree' && Math.hypot(r.tx - s[0], r.ty - s[1]) < 20) tr++; if (tr < 14) ok = false; }
    if (!ok && at < 59) continue;
    for (const r of res) r.amt = RT[r.type].amt;
    return { ter, res, starts };
  }
}

/* ---------------- Holat ---------------- */
function createState(seed, plist) {
  const M = genMap(seed, plist.length);
  const S = { seed, tick: 0, time: 0, ter: M.ter, blk: new Uint8Array(MW * MH), rt: new Int32Array(MW * MH), res: [], units: [], blds: [], byId: new Map(),
    players: [], nextId: M.res.length + 1, fx: [], fxn: [], dr: [], over: false, winner: -1, fields: new Map(), starts: M.starts, grid: new Map(), client: false };
  for (let i = 0; i < MW * MH; i++) S.blk[i] = M.ter[i] ? 1 : 0;
  for (const r of M.res) addRes(S, r);
  plist.forEach((p, i) => {
    const lvl = p.bot == null ? 0 : p.bot, bonus = p.bot != null ? [1, 1.0, 1.5][lvl] : 1;
    const P = { idx: i, fac: p.fac, name: p.name, human: p.bot == null, bot: p.bot != null ? { lvl, last: 0, t: i * 3 } : null, color: FACTIONS[p.fac].color,
      res: { f: 400 * bonus, w: 400 * bonus, s: 250 * bonus, g: 150 * bonus }, pop: 0, popcap: 10, alive: true, cnt: {}, noteT: 0 };
    S.players.push(P);
    const st = M.starts[i];
    addBld(S, 'saroy', i, st[0], st[1], true);
    for (let k = 0; k < 5; k++) addUnit(S, 'dehqon', i, (st[0] + 1.5) * TILE + (k - 2) * 22, (st[1] + 4) * TILE + (k % 2) * 16);
  });
  S.hasHuman = S.players.some(p => p.human);
  recount(S);
  return S;
}
function addRes(S, r) {
  const T = RT[r.type];
  const e = { id: r.id, kind: 'r', type: r.type, rk: T.rk, tx: r.tx, ty: r.ty, w: 1, h: 1, x: r.tx * TILE + 16, y: r.ty * TILE + 16, amt: r.amt == null ? T.amt : r.amt, hp: 1, v: (r.tx * 7 + r.ty * 13) % 3 };
  S.res.push(e); S.byId.set(e.id, e); S.blk[r.ty * MW + r.tx] |= 2; S.rt[r.ty * MW + r.tx] = e.id; return e;
}
function removeRes(S, e) {
  e.amt = 0; e.hp = 0; e.dead = true; const i = e.ty * MW + e.tx; S.blk[i] &= ~2; S.rt[i] = 0; S.byId.delete(e.id);
  const k = S.res.indexOf(e); if (k >= 0) S.res.splice(k, 1); S.dr.push(e.id);
}
function facBonus(S, owner) { return S.players[owner].fac; }
function addUnit(S, type, owner, x, y, reserved, id) {
  const T = UT[type], P = S.players[owner], fac = P ? P.fac : -1;
  let hp = T.hp, spd = T.spd;
  if (fac === 3 && type === 'otliq') { hp *= 1.15; spd *= 1.15; }
  const u = { id: id || S.nextId++, kind: 'u', type, owner, x, y, ox: x, oy: y, rx: x, ry: y, hp, mhp: hp, st: 'idle', tid: 0, tx: x, ty: y, cd: 0, scan: Math.random() * .4,
    face: 1, carry: { k: '', n: 0 }, gs: '', gt: 0, gk: '', water: !!T.water, r: T.r, spd, ar: 14, am: false, back: false };
  if (id && id >= S.nextId) S.nextId = id + 1;
  S.units.push(u); S.byId.set(u.id, u); if (!reserved && P) P.pop += T.pop; return u;
}
function occupy(S, b, on) {
  for (let y = b.ty; y < b.ty + b.h; y++) for (let x = b.tx; x < b.tx + b.w; x++) { const i = y * MW + x; if (on) S.blk[i] |= 4; else S.blk[i] &= ~4; }
}
function addBld(S, type, owner, tx, ty, done, id) {
  const T = BT[type], P = S.players[owner];
  let mhp = T.hp; if (P && P.fac === 2) mhp *= 1.25;
  const b = { id: id || S.nextId++, kind: 'b', type, owner, tx, ty, w: T.w, h: T.h, x: (tx + T.w / 2) * TILE, y: (ty + T.h / 2) * TILE, hp: done ? mhp : mhp * .1, mhp,
    done: !!done, prog: done ? 1 : 0, queue: [], rx: -1, ry: -1, rid: 0, cd: 0 };
  if (id && id >= S.nextId) S.nextId = id + 1;
  S.blds.push(b); S.byId.set(b.id, b); occupy(S, b, true); return b;
}

/* ---------------- Yordamchilar ---------------- */
const emit = (S, ev) => { S.fx.push(ev); if (!S.client) S.fxn.push(ev); };
const costOk = (P, c) => { for (const k in c) if ((P.res[k] || 0) < c[k]) return false; return true; };
const pay = (P, c) => { for (const k in c) P.res[k] -= c[k]; };
const refund = (P, c, m) => { for (const k in c) P.res[k] += Math.floor(c[k] * (m || 1)); };
function edgeDist(u, e) {
  if (e.kind === 'u') return Math.hypot(e.x - u.x, e.y - u.y) - (e.r || 8);
  const x0 = e.tx * TILE, y0 = e.ty * TILE, x1 = x0 + e.w * TILE, y1 = y0 + e.h * TILE;
  return Math.hypot(Math.max(x0 - u.x, 0, u.x - x1), Math.max(y0 - u.y, 0, u.y - y1));
}
const passL = (S, x, y) => { const tx = x / TILE | 0, ty = y / TILE | 0; return x >= 0 && y >= 0 && tx < MW && ty < MH && S.blk[ty * MW + tx] === 0; };
const passW = (S, x, y) => { const tx = x / TILE | 0, ty = y / TILE | 0; return x >= 0 && y >= 0 && tx < MW && ty < MH && S.blk[ty * MW + tx] === 1; };
function moveBy(S, u, dx, dy) {
  const p = u.water ? passW : passL, ox = u.x, oy = u.y;
  const nx = u.x + dx, ny = u.y + dy;
  if (p(S, nx, u.y)) u.x = nx; if (p(S, u.x, ny)) u.y = ny;
  return Math.hypot(u.x - ox, u.y - oy);
}
function bfs(S, seeds, water) {
  const f = new Int16Array(MW * MH).fill(-1), q = new Int32Array(MW * MH); let h = 0, t = 0;
  const ok = water ? i => S.blk[i] === 1 : i => S.blk[i] === 0;
  for (const i of seeds) if (f[i] < 0 && ok(i)) { f[i] = 0; q[t++] = i; }
  while (h < t) {
    const i = q[h++], x = i % MW, y = (i / MW) | 0, v = f[i] + 1;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      const ni = ny * MW + nx; if (f[ni] >= 0 || !ok(ni)) continue;
      if (dx && dy && (!ok(y * MW + nx) || !ok(ny * MW + x))) continue;
      f[ni] = v; q[t++] = ni;
    }
  }
  return f;
}
function getField(S, key, ttl, seedsFn, water) {
  key = (water ? 'W' : 'L') + key; const now = S.time; let c = S.fields.get(key);
  if (c && now - c.t < ttl) return c.f;
  if (S.fields.size > 90) { let k0 = null, t0 = 1e9; for (const [k, v] of S.fields) if (v.t < t0) { t0 = v.t; k0 = k; } S.fields.delete(k0); }
  const f = bfs(S, seedsFn(), water); S.fields.set(key, { f, t: now }); return f;
}
function pointSeeds(S, px, py, water) {
  const tx = Math.max(0, Math.min(MW - 1, px / TILE | 0)), ty = Math.max(0, Math.min(MH - 1, py / TILE | 0));
  const ok = i => water ? S.blk[i] === 1 : S.blk[i] === 0;
  for (let r = 0; r <= 6; r++) { const s = [];
    for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) { if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r) continue; if (x < 0 || y < 0 || x >= MW || y >= MH) continue; const i = y * MW + x; if (ok(i)) s.push(i); }
    if (s.length) return s; }
  return [];
}
function perimSeeds(S, e, water) {
  const s = [];
  for (let x = e.tx - 1; x <= e.tx + e.w; x++) for (let y = e.ty - 1; y <= e.ty + e.h; y++) {
    const inX = x >= e.tx && x < e.tx + e.w, inY = y >= e.ty && y < e.ty + e.h;
    if ((inX && inY) || (!inX && !inY)) continue; if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
    const i = y * MW + x; if (water ? S.blk[i] === 1 : S.blk[i] === 0) s.push(i);
  }
  return s;
}
function stepField(S, u, f, dt) {
  const tx = u.x / TILE | 0, ty = u.y / TILE | 0; if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return false;
  const cur = f[ty * MW + tx]; if (cur < 0) return false; if (cur === 0) return 2;
  let bx = -1, by = -1, bv = cur;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue; const nx = tx + dx, ny = ty + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
    const v = f[ny * MW + nx]; if (v < 0) continue;
    if (dx && dy && (f[ty * MW + nx] < 0 || f[ny * MW + tx] < 0)) continue;
    if (v < bv || (v === bv && bx >= 0 && !(dx && dy))) { bv = v; bx = nx; by = ny; }
  }
  if (bx < 0) return true;
  const cx = bx * TILE + 16, cy = by * TILE + 16, d = Math.hypot(cx - u.x, cy - u.y) || 1, st = Math.min(u.spd * dt, d + 4);
  if (Math.abs(cx - u.x) > .5) u.face = cx > u.x ? 1 : -1;
  moveBy(S, u, (cx - u.x) / d * st, (cy - u.y) / d * st); u.mv = true; return true;
}
function moveToPoint(S, u, px, py, dt) {
  const d = Math.hypot(px - u.x, py - u.y), st = u.spd * dt;
  if (d < TILE * 1.6) {
    const s = Math.min(st, d); if (Math.abs(px - u.x) > .5) u.face = px > u.x ? 1 : -1;
    const m = moveBy(S, u, (px - u.x) / d * s, (py - u.y) / d * s); u.mv = true;
    if (m >= s * .3 || d < 6) return;
  }
  const f = getField(S, 'p' + (px / TILE | 0) + ',' + (py / TILE | 0), 1.2, () => pointSeeds(S, px, py, u.water), u.water);
  const sr = stepField(S, u, f, dt);
  if (!sr || sr === 2) { const s = Math.min(st, d); moveBy(S, u, (px - u.x) / d * s, (py - u.y) / d * s); u.mv = true; }
}
function moveToEnt(S, u, e, dt) {
  if (e.kind === 'u') return moveToPoint(S, u, e.x, e.y, dt);
  const f = getField(S, 'e' + e.id, 6, () => perimSeeds(S, e, u.water), u.water);
  const r = stepField(S, u, f, dt);
  if (!r || r === 2) { const d = Math.hypot(e.x - u.x, e.y - u.y) || 1, s = u.spd * dt; if (Math.abs(e.x - u.x) > .5) u.face = e.x > u.x ? 1 : -1; moveBy(S, u, (e.x - u.x) / d * s, (e.y - u.y) / d * s); u.mv = true; return !!r; }
  return true;
}
function unstick(S, u) {
  const p = u.water ? passW : passL; if (p(S, u.x, u.y)) return;
  const tx = u.x / TILE | 0, ty = u.y / TILE | 0;
  for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = (tx + dx) * TILE + 16, y = (ty + dy) * TILE + 16; if (p(S, x, y)) { u.x = x; u.y = y; return; } }
}
function buildGrid(S) {
  const g = new Map();
  for (const u of S.units) { if (u.hp <= 0) continue; const k = ((u.x / 64) | 0) + ((u.y / 64) | 0) * 100; let a = g.get(k); if (!a) { a = []; g.set(k, a); } a.push(u); }
  S.grid = g;
}
function query(S, x, y, r, fn) {
  const c0 = Math.max(0, ((x - r) / 64) | 0), c1 = ((x + r) / 64) | 0, r0 = Math.max(0, ((y - r) / 64) | 0), r1 = ((y + r) / 64) | 0;
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) { const a = S.grid.get(cx + cy * 100); if (a) for (const u of a) fn(u); }
}
function acquire(S, u, range) {
  let best = null, bd = 1e9; const T = UT[u.type];
  query(S, u.x, u.y, range, e => {
    if (e.owner === u.owner || e.hp <= 0 || !S.players[e.owner].alive) return;
    if (e.water && !T.ranged && !u.water) return;
    const d = Math.hypot(e.x - u.x, e.y - u.y); if (d > range) return;
    const w = d * (e.type === 'dehqon' ? 1.6 : 1); if (w < bd) { bd = w; best = e; }
  });
  if (!best && u.type !== 'dehqon') for (const b of S.blds) {
    if (b.owner === u.owner || b.hp <= 0 || !S.players[b.owner].alive) continue;
    const d = edgeDist(u, b); if (d < range * .8 && d < bd) { bd = d; best = b; }
  }
  return best;
}
function calcDmg(S, u, T, e) {
  let m = 1; const armor = e.kind === 'b' ? BT[e.type].armor : UT[e.type].armor;
  if (T.bonus && e.kind === 'u' && UT[e.type].cls === T.bonus.cls) m *= T.bonus.m;
  if (e.kind === 'b') m *= T.sieg ? T.sieg : (T.ranged ? .3 : .7);
  if (S.players[u.owner].fac === 0 && u.type === 'miltiqchi') m *= 1.2;
  return Math.max(1, T.atk * m - armor);
}
function hurt(S, e, d, att) {
  if (e.hp <= 0) return; e.hp -= d;
  if (att && e.kind === 'u' && e.st === 'idle' && e.type !== 'dehqon') { e.st = 'atk'; e.tid = att.id; }
  if (e.owner >= 0) { const P = S.players[e.owner]; if (P && P.human && S.time - P.noteT > 10 && att) { P.noteT = S.time; emit(S, ['n', e.owner, 3, e.x | 0, e.y | 0]); } }
  if (e.hp <= 0) kill(S, e);
}
function kill(S, e) {
  e.hp = 0; e.dead = true;
  if (e.kind === 'u') { emit(S, ['d', e.x | 0, e.y | 0, UT[e.type].n]); S.players[e.owner].pop -= UT[e.type].pop; }
  else { occupy(S, e, false); emit(S, ['x', e.x | 0, e.y | 0, e.w * 22]); for (const q of e.queue) S.players[e.owner].pop -= UT[q.type].pop; e.queue = []; }
}
function doAttack(S, u, e, T) {
  const dmg = calcDmg(S, u, T, e);
  if (T.ranged) emit(S, ['p', u.type === 'top' || u.type === 'kema' ? 2 : u.type === 'miltiqchi' ? 1 : 0, u.x | 0, (u.y - 12) | 0, e.x | 0, (e.y - 8) | 0]);
  else emit(S, ['m', u.id]);
  if (u.type === 'kamonchi' && Math.random() < .1) return;
  hurt(S, e, dmg, u);
  if (T.splash) { emit(S, ['x', e.x | 0, e.y | 0, 18]); query(S, e.x, e.y, 46, o => { if (o !== e && o.owner !== u.owner && o.hp > 0) hurt(S, o, dmg * .45, u); }); }
}
const nearestDrop = (S, u) => { let best = null, bd = 1e12; for (const b of S.blds) { if (b.owner !== u.owner || !b.done || b.hp <= 0 || !BT[b.type].drop) continue; const d = (b.x - u.x) ** 2 + (b.y - u.y) ** 2; if (d < bd) { bd = d; best = b; } } return best; };
function nearestRes(S, x, y, rk, maxd) {
  let best = null, bd = maxd * maxd;
  for (const r of S.res) { if (r.rk !== rk) continue; const d = (r.x - x) ** 2 + (r.y - y) ** 2; if (d < bd) { bd = d; best = r; } } return best;
}
function nearestFarm(S, u) {
  let best = null, bd = 1e12; for (const b of S.blds) { if (b.owner !== u.owner || !b.done || b.type !== 'ferma' || b.hp <= 0) continue; const d = (b.x - u.x) ** 2 + (b.y - u.y) ** 2; if (d < bd) { bd = d; best = b; } } return best;
}

/* ---------------- Birlik yangilash ---------------- */
function updUnit(S, u, dt) {
  const T = UT[u.type], P = S.players[u.owner];
  u.cd = Math.max(0, u.cd - dt); u.mv = false;
  unstick(S, u);
  switch (u.st) {
    case 'idle':
      if (u.type !== 'dehqon') { u.scan -= dt; if (u.scan <= 0) { u.scan = .45; const e = acquire(S, u, T.sight); if (e) { u.st = 'atk'; u.tid = e.id; u.back = false; } } }
      break;
    case 'move': {
      if (u.am) { u.scan -= dt; if (u.scan <= 0) { u.scan = .45; const e = acquire(S, u, T.sight); if (e) { u.st = 'atk'; u.tid = e.id; u.back = true; break; } } }
      const d = Math.hypot(u.tx - u.x, u.ty - u.y);
      if (d <= u.ar) { u.st = 'idle'; u.am = false; break; }
      moveToPoint(S, u, u.tx, u.ty, dt); break;
    }
    case 'atk': {
      const e = S.byId.get(u.tid);
      if (!e || e.hp <= 0 || e.owner === u.owner || e.kind === 'r' || !S.players[e.owner].alive) { u.st = u.back ? 'move' : 'idle'; u.am = u.back; break; }
      if (T.atk === 0) { u.st = 'idle'; break; }
      const ed = edgeDist(u, e);
      if (ed <= T.rng) {
        if (Math.abs(e.x - u.x) > 1) u.face = e.x > u.x ? 1 : -1;
        if (u.cd <= 0) { doAttack(S, u, e, T); u.cd = T.cd * (.9 + Math.random() * .2); }
      } else {
        if (e.kind === 'u' && !u.back && Math.hypot(e.x - u.x, e.y - u.y) > T.sight * 3) { u.st = 'idle'; break; }
        if (u.type === 'dehqon' && e.kind === 'u' && Math.hypot(e.x - u.x, e.y - u.y) > 500) { u.st = 'idle'; break; }
        if (moveToEnt(S, u, e, dt) === false && u.water) u.st = 'idle';
      }
      break;
    }
    case 'gather': gatherUpd(S, u, dt, P); break;
    case 'build': buildUpd(S, u, dt); break;
  }
}
function validGather(S, u, e) {
  if (!e || e.dead) return false;
  if (e.kind === 'r') return e.amt > 0;
  return e.kind === 'b' && e.type === 'ferma' && e.done && e.owner === u.owner && e.hp > 0;
}
function findNextGather(S, u) {
  if (u.gk === 'f') { const f = nearestFarm(S, u); if (f) return f; }
  return nearestRes(S, u.x, u.y, u.gk, 14 * TILE) || nearestRes(S, u.x, u.y, u.gk, 40 * TILE);
}
function gatherUpd(S, u, dt, P) {
  let e = S.byId.get(u.tid);
  if (u.gs === 'back') {
    const d = nearestDrop(S, u); if (!d) { u.st = 'idle'; return; }
    if (edgeDist(u, d) <= 20) {
      P.res[u.carry.k] += u.carry.n; if (P.human || true) emit(S, ['c', u.owner, u.carry.k === 'f' ? 0 : u.carry.k === 'w' ? 1 : u.carry.k === 's' ? 2 : 3, d.x | 0, d.y | 0]);
      u.carry.n = 0; u.gs = 'to';
      if (!validGather(S, u, e)) { e = findNextGather(S, u); if (!e) { u.st = 'idle'; return; } u.tid = e.id; }
      return;
    }
    moveToEnt(S, u, d, dt); return;
  }
  if (!validGather(S, u, e)) {
    if (u.carry.n > 0) { u.gs = 'back'; return; }
    e = findNextGather(S, u); if (!e) { u.st = 'idle'; return; } u.tid = e.id;
  }
  if (edgeDist(u, e) > 20) { u.gs = 'to'; moveToEnt(S, u, e, dt); return; }
  u.gs = 'work'; u.face = e.x >= u.x ? 1 : -1;
  let rate = e.kind === 'b' ? GR.farm : GR[u.gk];
  if (P.fac === 1) rate *= 1.2; if (P.bot) rate *= [.85, 1, 1.25][P.bot.lvl];
  u.gt += dt;
  const iv = 1 / rate;
  while (u.gt >= iv) {
    u.gt -= iv;
    if (u.carry.n === 0 || u.carry.k !== u.gk) { u.carry.k = u.gk; u.carry.n = 0; }
    u.carry.n++; if (e.kind === 'r') { e.amt--; if (e.amt <= 0) { removeRes(S, e); break; } }
    if (u.carry.n >= 10) break;
  }
  if (u.carry.n >= 10 || !validGather(S, u, S.byId.get(u.tid))) { u.gs = 'back'; }
}
function buildUpd(S, u, dt) {
  const b = S.byId.get(u.tid);
  if (!b || b.kind !== 'b' || b.hp <= 0) { u.st = 'idle'; return; }
  if (b.done && b.hp >= b.mhp - .5) {
    if (b.type === 'ferma' && b.owner === u.owner) { u.st = 'gather'; u.tid = b.id; u.gs = 'to'; u.gk = 'f'; } else u.st = 'idle'; return;
  }
  if (edgeDist(u, b) > 20) { moveToEnt(S, u, b, dt); return; }
  u.face = b.x >= u.x ? 1 : -1;
  const T = BT[b.type];
  if (!b.done) {
    b.prog += dt / T.bt; b.hp = Math.min(b.mhp, b.mhp * (.1 + .9 * Math.min(1, b.prog)));
    if (b.prog >= 1) { b.done = true; b.hp = b.mhp; recountPop(S); emit(S, ['n', b.owner, 1, b.x | 0, b.y | 0]); }
  } else b.hp = Math.min(b.mhp, b.hp + b.mhp * dt / (T.bt * 2));
}
function spawnPos(S, b, water, tx, ty) {
  const ok = (x, y) => { const i = y * MW + x; return water ? S.blk[i] === 1 : S.blk[i] === 0; };
  for (let r = 1; r <= 8; r++) {
    let best = null, bd = 1e9;
    for (let y = b.ty - r; y < b.ty + b.h + r; y++) for (let x = b.tx - r; x < b.tx + b.w + r; x++) {
      if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
      if (x >= b.tx && x < b.tx + b.w && y >= b.ty && y < b.ty + b.h) continue; if (!ok(x, y)) continue;
      const cx = x * TILE + 16, cy = y * TILE + 16, d = Math.hypot(cx - tx, cy - ty) + Math.random() * 40; if (d < bd) { bd = d; best = [cx, cy]; }
    }
    if (best) return [best[0] + (Math.random() - .5) * 10, best[1] + (Math.random() - .5) * 10];
  }
  return null;
}
function updBld(S, b, dt) {
  const T = BT[b.type]; if (!b.done || b.hp <= 0) return;
  if (T.tower) {
    b.cd -= dt;
    if (b.cd <= 0) {
      let best = null, bd = 1e9;
      query(S, b.x, b.y, T.tower.rng, e => { if (e.owner === b.owner || e.hp <= 0 || !S.players[e.owner].alive) return; const d = Math.hypot(e.x - b.x, e.y - b.y); if (d < T.tower.rng && d < bd) { bd = d; best = e; } });
      if (best) { let dm = T.tower.atk; if (S.players[b.owner].fac === 2) dm *= 1.25; emit(S, ['p', 0, b.x | 0, (b.y - 34) | 0, best.x | 0, (best.y - 8) | 0]); hurt(S, best, Math.max(1, dm - UT[best.type].armor), null); b.cd = T.tower.cd; } else b.cd = .35;
    }
  }
  if (b.queue.length) {
    const q = b.queue[0]; q.t -= dt;
    if (q.t <= 0) {
      const UTt = UT[q.type], P = S.players[b.owner];
      const tx = b.rx >= 0 ? b.rx : MW * TILE / 2, ty = b.ry >= 0 ? b.ry : MH * TILE / 2;
      const p = spawnPos(S, b, !!UTt.water, tx, ty);
      if (p) {
        b.queue.shift(); const u = addUnit(S, q.type, b.owner, p[0], p[1], true);
        emit(S, ['n', b.owner, 2, p[0] | 0, p[1] | 0]);
        if (b.rid && S.byId.get(b.rid) && q.type === 'dehqon') { const r = S.byId.get(b.rid); if (r.kind === 'r' || (r.kind === 'b' && r.type === 'ferma')) { u.st = 'gather'; u.tid = r.id; u.gk = r.kind === 'r' ? r.rk : 'f'; u.gs = 'to'; } }
        else if (b.rx >= 0) { u.st = 'move'; u.tx = b.rx; u.ty = b.ry; u.ar = 24; }
      } else q.t = 1;
    }
  }
}
function separate(S) {
  for (const u of S.units) {
    if (u.hp <= 0) continue;
    query(S, u.x, u.y, 24, v => {
      if (v.id <= u.id || v.hp <= 0 || v.water !== u.water) return;
      const dx = v.x - u.x, dy = v.y - u.y, md = u.r + v.r - 2, d2 = dx * dx + dy * dy;
      if (d2 >= md * md) return; const d = Math.sqrt(d2) || .01, push = (md - d) * .5, nx = dx / d || 1, ny = dy / d || 0;
      const wu = u.mv ? 1 : .35, wv = v.mv ? 1 : .35, s = wu + wv;
      moveBy(S, u, -nx * push * 2 * (wu / s) * .6, -ny * push * 2 * (wu / s) * .6); moveBy(S, v, nx * push * 2 * (wv / s) * .6, ny * push * 2 * (wv / s) * .6);
    });
  }
}
function recountPop(S) {
  for (const P of S.players) P.popcap = 0;
  for (const b of S.blds) if (b.done && b.hp > 0 && BT[b.type].pop) S.players[b.owner].popcap += BT[b.type].pop;
  for (const P of S.players) P.popcap = Math.min(POPMAX, P.popcap);
}
function recount(S) {
  for (const P of S.players) P.cnt = {};
  for (const u of S.units) { if (u.hp <= 0) continue; const c = S.players[u.owner].cnt; c[u.type] = (c[u.type] || 0) + 1; }
  for (const b of S.blds) { if (b.hp <= 0) continue; const c = S.players[b.owner].cnt; if (b.done) c[b.type] = (c[b.type] || 0) + 1; c['_' + b.type] = (c['_' + b.type] || 0) + 1; for (const q of b.queue) c['q_' + q.type] = (c['q_' + q.type] || 0) + 1; }
  recountPop(S);
}
function eliminate(S, P) {
  P.alive = false;
  for (const u of S.units) if (u.owner === P.idx && u.hp > 0) kill(S, u);
  for (const b of S.blds) if (b.owner === P.idx && b.hp > 0) kill(S, b);
  emit(S, ['n', P.idx, 4, 0, 0]);
}
function sweep(S) {
  if (S.units.some(u => u.dead)) { for (const u of S.units) if (u.dead) S.byId.delete(u.id); S.units = S.units.filter(u => !u.dead); }
  if (S.blds.some(b => b.dead)) { for (const b of S.blds) if (b.dead) S.byId.delete(b.id); S.blds = S.blds.filter(b => !b.dead); }
}

function step(S) {
  if (S.over) return;
  const dt = TICK; S.tick++; S.time += dt;
  buildGrid(S);
  for (const u of S.units) { u.ox = u.x; u.oy = u.y; }
  for (const u of S.units) if (u.hp > 0) updUnit(S, u, dt);
  separate(S);
  for (const b of S.blds) updBld(S, b, dt);
  sweep(S);
  if (S.tick % 20 === 0) {
    recount(S);
    for (const P of S.players) if (P.alive && !S.blds.some(b => b.owner === P.idx && b.type === 'saroy')) eliminate(S, P);
    sweep(S);
    const alive = S.players.filter(p => p.alive);
    if (alive.length <= 1 || (S.hasHuman && !alive.some(p => p.human))) { S.over = true; S.winner = alive.length === 1 ? alive[0].idx : -1; if (S.hasHuman && !alive.some(p => p.human)) S.winner = -1; }
  }
  for (const P of S.players) if (P.bot && P.alive) { P.bot.t -= dt; if (P.bot.t <= 0) { P.bot.t = 1.3; try { aiThink(S, P); } catch (e) { console.error('AI xato', e); } } }
}

/* ---------------- Buyruqlar ---------------- */
function nearOwn(S, owner, tx, ty) { for (const b of S.blds) if (b.owner === owner && b.hp > 0 && Math.hypot(b.tx - tx, b.ty - ty) < 24) return true; return false; }
function canPlace(S, type, tx, ty, owner) {
  const T = BT[type]; if (tx < 1 || ty < 1 || tx + T.w > MW - 1 || ty + T.h > MH - 1) return false;
  for (let y = ty; y < ty + T.h; y++) for (let x = tx; x < tx + T.w; x++) if (S.blk[y * MW + x] !== 0) return false;
  if (T.dock) { let w = false; for (let y = ty - 2; y < ty + T.h + 2 && !w; y++) for (let x = tx - 2; x < tx + T.w + 2; x++) if (x >= 0 && y >= 0 && x < MW && y < MH && S.blk[y * MW + x] === 1) { w = true; break; } if (!w) return false; }
  return nearOwn(S, owner, tx, ty);
}
function applyCmd(S, pl, c) {
  const P = S.players[pl]; if (!P || !P.alive || S.over) return;
  const own = id => { const e = S.byId.get(id); return e && e.owner === pl && e.hp > 0 ? e : null; };
  const units = ids => (ids || []).slice(0, 200).map(own).filter(e => e && e.kind === 'u');
  switch (c.t) {
    case 'move': { const us = units(c.ids); const ar = 12 + 6 * Math.sqrt(us.length);
      for (const u of us) { u.st = 'move'; u.tx = Math.max(8, Math.min(MW * TILE - 8, c.x)); u.ty = Math.max(8, Math.min(MH * TILE - 8, c.y)); u.am = !!c.am && u.type !== 'dehqon'; u.ar = ar; u.back = false; } break; }
    case 'atk': { const e = S.byId.get(c.tid); if (!e || e.owner === pl || e.owner < 0 || e.kind === 'r') return;
      for (const u of units(c.ids)) { if (e.kind === 'u' && e.water && !UT[u.type].ranged && !u.water) continue; u.st = 'atk'; u.tid = e.id; u.back = false; u.am = false; } break; }
    case 'gather': { const r = S.byId.get(c.rid); if (!r) return; if (r.kind === 'b' && !(r.type === 'ferma' && r.owner === pl && r.done)) return; if (r.kind === 'u') return;
      for (const u of units(c.ids)) { if (u.type !== 'dehqon') { u.st = 'move'; u.tx = r.x; u.ty = r.y; u.ar = 40; u.am = false; continue; }
        const k = r.kind === 'r' ? r.rk : 'f'; if (u.carry.k !== k) u.carry.n = 0; u.gk = k; u.carry.k = k; u.st = 'gather'; u.tid = r.id; u.gs = u.carry.n >= 10 ? 'back' : 'to'; u.gt = 0; } break; }
    case 'build': { const T = BT[c.type]; if (!T) return; const tx = c.tx | 0, ty = c.ty | 0;
      const bl = units(c.ids).filter(u => u.type === 'dehqon'); if (!bl.length) return;
      if (!costOk(P, T.cost)) { emit(S, ['n', pl, 5, 0, 0]); return; }
      if (!canPlace(S, c.type, tx, ty, pl)) { emit(S, ['n', pl, 6, 0, 0]); return; }
      pay(P, T.cost); const b = addBld(S, c.type, pl, tx, ty, false);
      for (const u of bl) { u.st = 'build'; u.tid = b.id; } break; }
    case 'rep': { const b = own(c.bid); if (!b || b.kind !== 'b') return; for (const u of units(c.ids)) if (u.type === 'dehqon') { u.st = 'build'; u.tid = b.id; } break; }
    case 'train': { const b = own(c.bid); if (!b || b.kind !== 'b' || !b.done) return; const T = BT[b.type]; if (!T.train || !T.train.includes(c.type)) return;
      const U = UT[c.type]; if (b.queue.length >= 6) return;
      if (!costOk(P, U.cost)) { emit(S, ['n', pl, 5, 0, 0]); return; }
      if (P.pop + U.pop > P.popcap) { emit(S, ['n', pl, 7, 0, 0]); return; }
      pay(P, U.cost); P.pop += U.pop; b.queue.push({ type: c.type, t: U.time, tt: U.time }); break; }
    case 'cancel': { const b = own(c.bid); if (!b || b.kind !== 'b') return; const i = c.idx | 0; const q = b.queue[i]; if (!q) return; b.queue.splice(i, 1); P.pop -= UT[q.type].pop; refund(P, UT[q.type].cost, 1); break; }
    case 'rally': { const b = own(c.bid); if (!b || b.kind !== 'b') return; b.rx = c.x; b.ry = c.y; b.rid = c.rid || 0; break; }
    case 'stop': for (const u of units(c.ids)) { u.st = 'idle'; u.am = false; } break;
    case 'del': { const b = own(c.bid); if (!b || b.kind !== 'b' || b.type === 'saroy') return; refund(P, BT[b.type].cost, b.done ? .5 : 1); kill(S, b); sweep(S); recountPop(S); break; }
  }
}

/* ---------------- Bot AI ---------------- */
function findSite(S, pl, type, near, margin) {
  const T = BT[type], cx = near.tx + 1, cy = near.ty + 1, a0 = Math.random() * 6.28;
  for (let r = 3; r <= 20; r++) for (let a = 0; a < r * 6; a++) {
    const ang = a0 + a / (r * 6) * 6.283, x = Math.round(cx + Math.cos(ang) * r), y = Math.round(cy + Math.sin(ang) * r);
    if (!canPlace(S, type, x, y, pl)) continue;
    let free = true;
    if (margin) for (let yy = y - 1; yy <= y + T.h && free; yy++) for (let xx = x - 1; xx <= x + T.w; xx++) { if (xx < 0 || yy < 0 || xx >= MW || yy >= MH) continue; if (S.blk[yy * MW + xx] & 4) { free = false; break; } }
    if (free) return [x, y];
  }
  return null;
}
function aiBuild(S, P, peas, type, near) {
  const site = findSite(S, P.idx, type, near, type !== 'port'); if (!site) return false;
  let best = null, bd = 1e12;
  for (const u of peas) { if (u.st === 'build') continue; const d = (u.x - site[0] * TILE) ** 2 + (u.y - site[1] * TILE) ** 2 + (u.st === 'idle' ? 0 : 4e5); if (d < bd) { bd = d; best = u; } }
  if (!best) return false;
  const ids = [best.id]; let second = null; bd = 1e12;
  for (const u of peas) { if (u === best || u.st === 'build') continue; const d = (u.x - site[0] * TILE) ** 2 + (u.y - site[1] * TILE) ** 2; if (d < bd) { bd = d; second = u; } }
  if (second) ids.push(second.id);
  applyCmd(S, P.idx, { t: 'build', ids, type, tx: site[0], ty: site[1] }); return true;
}
function aiThink(S, P) {
  const pl = P.idx, L = P.bot.lvl, C = P.cnt, sa = S.blds.find(b => b.owner === pl && b.type === 'saroy' && b.done && b.hp > 0);
  if (!sa) return;
  const my = S.units.filter(u => u.owner === pl && u.hp > 0), peas = my.filter(u => u.type === 'dehqon');
  const mil = my.filter(u => u.type !== 'dehqon' && !UT[u.type].water);
  const can = t => costOk(P, BT[t].cost), np = peas.length;
  const want = [12, 17, 22][L] + Math.min(8, (S.time / 100) | 0);
  if (sa.queue.length < 2 && (C.dehqon || 0) + (C.q_dehqon || 0) < want && P.pop < P.popcap) applyCmd(S, pl, { t: 'train', bid: sa.id, type: 'dehqon' });
  if (P.popcap - P.pop <= 5 && P.popcap < POPMAX && ((C._uy || 0) - (C.uy || 0)) < 1 && can('uy')) aiBuild(S, P, peas, 'uy', sa);
  const farms = C._ferma || 0, wantF = Math.min(10, Math.floor(np / 3));
  if (S.time > 25 && farms < wantF && ((C._ferma || 0) - (C.ferma || 0)) < 1 && can('ferma')) aiBuild(S, P, peas, 'ferma', sa);
  if (np >= 7 && (C._kazarma || 0) < 1 + (L > 0 && S.time > 200 ? 1 : 0) + (L > 1 && S.time > 420 ? 1 : 0) && can('kazarma')) aiBuild(S, P, peas, 'kazarma', sa);
  if (np >= 11 && (C.kazarma || 0) >= 1 && (C._otxona || 0) < 1 + (L > 1 && S.time > 500 ? 1 : 0) && can('otxona')) aiBuild(S, P, peas, 'otxona', sa);
  if (L >= 1 && np >= 12 && (C.kazarma || 0) && (C._minora || 0) < L * 2 && can('minora')) aiBuild(S, P, peas, 'minora', sa);
  if (np >= 8) for (const b of S.blds) {
    if (b.owner !== pl || !b.done || !BT[b.type].train || b.type === 'saroy' || b.type === 'port' || b.queue.length >= 2) continue;
    let pool = BT[b.type].train.filter(t => t !== 'top'); if (b.type === 'kazarma' && L > 0 && S.time > 420 && Math.random() < .25) pool = ['top'];
    pool = pool.filter(t => costOk(P, UT[t].cost) && P.pop + UT[t].pop <= P.popcap);
    if (pool.length) applyCmd(S, pl, { t: 'train', bid: b.id, type: pool[(Math.random() * pool.length) | 0] });
  }
  // bo'sh dehqonlarni ishga solish
  const cntG = { f: 0, w: 0, s: 0, g: 0 };
  for (const u of peas) if (u.st === 'gather') cntG[u.gk]++;
  const frac = S.time < 120 ? { f: .35, w: .45, s: .1, g: .1 } : { f: .38, w: .3, s: .12, g: .2 };
  for (const u of peas) {
    if (u.st !== 'idle') continue;
    let bk = 'w', bdef = -9;
    for (const k of ['f', 'w', 's', 'g']) { let def = frac[k] * Math.max(1, np) - cntG[k]; if (P.res[k] > 700) def -= 6; if (def > bdef) { bdef = def; bk = k; } }
    let r = null;
    if (bk === 'f') { r = nearestFarm(S, u); if (r && S.units.filter(o => o.st === 'gather' && o.tid === r.id).length >= 5) r = null; if (!r) r = nearestRes(S, sa.x, sa.y, 'f', 22 * TILE); }
    if (!r) r = nearestRes(S, sa.x, sa.y, bk, 24 * TILE) || nearestRes(S, u.x, u.y, bk, 60 * TILE);
    if (!r) r = nearestRes(S, u.x, u.y, 'w', 60 * TILE);
    if (r) { applyCmd(S, pl, { t: 'gather', ids: [u.id], rid: r.id }); cntG[u.gk]++; }
  }
  // mudofaa
  let threat = null;
  for (const e of S.units) { if (e.owner === pl || e.hp <= 0 || !S.players[e.owner].alive) continue; for (const b of S.blds) if (b.owner === pl && Math.hypot(e.x - b.x, e.y - b.y) < 10 * TILE) { threat = e; break; } if (threat) break; }
  if (threat && mil.length) applyCmd(S, pl, { t: 'move', ids: mil.filter(u => u.st === 'idle' || u.st === 'move').map(u => u.id), x: threat.x, y: threat.y, am: true });
  // hujum
  const thr = [8, 12, 16][L] + Math.min(35, S.time / 60 | 0);
  const first = [300, 240, 180][L];
  if (!threat && S.time > first && mil.length >= thr && S.time - P.bot.last > 45) {
    let tgt = null, bd = 1e12;
    for (const b of S.blds) { if (b.owner === pl || b.type !== 'saroy' || !S.players[b.owner].alive) continue; const d = (b.x - sa.x) ** 2 + (b.y - sa.y) ** 2; if (d < bd) { bd = d; tgt = b; } }
    if (tgt) { applyCmd(S, pl, { t: 'move', ids: mil.map(u => u.id), x: tgt.x, y: tgt.y + 60, am: true }); P.bot.last = S.time; }
  }
}

/* ---------------- Tarmoq: snapshot ---------------- */
function snapshot(S) {
  const d = { t: 'snap', k: S.tick, tm: S.time | 0,
    p: S.players.map(P => [P.res.f | 0, P.res.w | 0, P.res.s | 0, P.res.g | 0, P.pop, P.popcap, P.alive ? 1 : 0]),
    u: S.units.map(u => [u.id, UT[u.type].n, u.owner, Math.round(u.x), Math.round(u.y), Math.ceil(u.hp), u.face > 0 ? 1 : 0, u.st === 'gather' && u.gs === 'work' ? 1 : (u.st === 'build' ? 2 : 0)]),
    b: S.blds.map(b => [b.id, BT[b.type].n, b.owner, b.tx, b.ty, Math.ceil(b.hp), b.done ? 100 : Math.floor(b.prog * 100), b.queue.map(q => [UNAMES.indexOf(q.type), Math.floor((1 - q.t / q.tt) * 100)]), b.rx | 0, b.ry | 0]),
    dr: S.dr, fx: S.fxn, o: S.over ? S.winner : -2 };
  S.fxn = []; S.dr = []; return d;
}
function applySnap(S, d, now) {
  S.client = true; S.snapT = now; S.time = d.tm;
  d.p.forEach((a, i) => { const P = S.players[i]; if (!P) return; P.res = { f: a[0], w: a[1], s: a[2], g: a[3] }; P.pop = a[4]; P.popcap = a[5]; P.alive = !!a[6]; });
  for (const id of d.dr) { const r = S.byId.get(id); if (r && r.kind === 'r') removeRes(S, r); }
  const seen = new Set(), nu = [];
  for (const a of d.u) {
    let e = S.byId.get(a[0]);
    if (!e) { e = addUnit(S, UNAMES[a[1]], a[2], a[3], a[4], true, a[0]); S.units.pop(); e.rx = a[3]; e.ry = a[4]; }
    else { e.ox = e.rx; e.oy = e.ry; e.x = a[3]; e.y = a[4]; }
    e.hp = a[5]; e.face = a[6] ? 1 : -1; e.work = a[7]; seen.add(e.id); nu.push(e);
  }
  for (const u of S.units) if (!seen.has(u.id)) S.byId.delete(u.id);
  S.units = nu;
  const bseen = new Set(), nb = [];
  for (const a of d.b) {
    let e = S.byId.get(a[0]);
    if (!e) { e = addBld(S, BNAMES[a[1]], a[2], a[3], a[4], true, a[0]); S.blds.pop(); }
    e.hp = a[5]; e.done = a[6] >= 100; e.prog = a[6] / 100; e.queue = a[7].map(q => ({ type: UNAMES[q[0]], pct: q[1] })); e.rx = a[8] || -1; e.ry = a[9] || -1; bseen.add(e.id); nb.push(e);
  }
  for (const b of S.blds) if (!bseen.has(b.id)) { occupy(S, b, false); S.byId.delete(b.id); }
  S.blds = nb;
  for (const f of d.fx) S.fx.push(f);
  if (d.o > -2) { S.over = true; S.winner = d.o; }
}

root.Sim = { TILE, MW, MH, TICK, POPMAX, FACTIONS, UT, BT, RT, UNAMES, BNAMES, RNAMES, createState, step, applyCmd, snapshot, applySnap, canPlace, costOk, edgeDist, eliminate, sweep, recount, query, buildGrid };
if (typeof module !== 'undefined') module.exports = root.Sim;
})(typeof window !== 'undefined' ? window : globalThis);
