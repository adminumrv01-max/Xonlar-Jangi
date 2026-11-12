/* XONLAR JANGI — mijoz: menyu, tarmoq, grafika, boshqaruv, ovoz */
(function () {
'use strict';
const $ = id => document.getElementById(id);
const Sim = window.Sim, SP = window.Sprites, I = window.I18N;
const TILE = Sim.TILE, MW = Sim.MW, MH = Sim.MH, TICK = Sim.TICK, UT = Sim.UT, BT = Sim.BT, UNAMES = Sim.UNAMES, BNAMES = Sim.BNAMES, FACTIONS = Sim.FACTIONS;
const isTouch = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window);
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
let SET = Object.assign({ lang: 'uz', music: 50, sfx: 70, gfx: 1, edge: !isTouch }, store.get('xj_set', {}));
let ACC = store.get('xj_acc', null);
const cv = $('game'), ctx = cv.getContext('2d'), mini = $('mini'), mctx = mini.getContext('2d');
let G = null, NET = null, sprites = null, spriteKey = '', soloFac = 0, lastSolo = null, setReturn = 'menu';
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = n => n | 0;

/* =============== Ovoz =============== */
const AU = { ctx: null, sg: null, mg: null, noise: null, last: {} };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const c = AU.ctx = new C(); AU.sg = c.createGain(); AU.mg = c.createGain(); AU.sg.connect(c.destination); AU.mg.connect(c.destination);
    const b = c.createBuffer(1, c.sampleRate * .6, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; AU.noise = b;
    applyVol(); musicStart();
  } catch (e) {}
}
function applyVol() { if (!AU.ctx) return; AU.sg.gain.value = SET.sfx / 100 * .8; AU.mg.gain.value = SET.music / 100 * .35; }
function tone(f0, f1, dur, type, vol, delay) {
  const c = AU.ctx; if (!c || SET.sfx <= 0) return; const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(AU.sg); o.start(t); o.stop(t + dur + .03);
}
function noise(dur, vol, fq) {
  const c = AU.ctx; if (!c || SET.sfx <= 0) return; const t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = AU.noise; f.type = 'lowpass'; f.frequency.value = fq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); s.connect(f); f.connect(g); g.connect(AU.sg); s.start(t); s.stop(t + dur + .03);
}
const SFX = {
  click() { tone(600, 900, .06, 'square', .1); }, sword() { noise(.09, .3, 3000); tone(900, 300, .08, 'sawtooth', .08); }, arrow() { tone(1200, 400, .12, 'triangle', .12); },
  gun() { noise(.2, .5, 1400); tone(160, 50, .18, 'square', .15); }, boom() { noise(.5, .8, 500); tone(90, 30, .45, 'sine', .5); },
  done() { tone(523, 523, .12, 'triangle', .22); tone(784, 784, .2, 'triangle', .22, .12); }, unit() { tone(660, 880, .1, 'sine', .18); }, coin() { tone(1400, 1800, .06, 'square', .05); },
  horn() { tone(220, 220, .5, 'sawtooth', .2); tone(330, 330, .5, 'sawtooth', .16, .05); }, err() { tone(200, 150, .15, 'square', .12); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .25, 'triangle', .28, i * .18)); }, lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, f, .3, 'sawtooth', .18, i * .25)); }
};
function sfx(n, x, y) {
  if (!AU.ctx || SET.sfx <= 0) return; const now = performance.now(), gap = n === 'sword' ? 70 : n === 'coin' ? 120 : n === 'boom' ? 90 : 40;
  if (AU.last[n] && now - AU.last[n] < gap) return; if (x != null && !onScreen(x, y)) return; AU.last[n] = now; SFX[n] && SFX[n]();
}
const SCALE = [0, 1, 4, 5, 7, 8, 10]; let mNext = 0, mStep = 0, mTimer = null, mPos = 3;
function musicStart() { if (mTimer) return; mNext = AU.ctx.currentTime + .3; mTimer = setInterval(musicTick, 250); }
function musicTick() {
  const c = AU.ctx; if (!c || SET.music <= 0) { if (c) mNext = Math.max(mNext, c.currentTime); return; } if (c.state === 'suspended') c.resume();
  while (mNext < c.currentTime + .8) { playNote(mNext); mNext += .36; mStep++; }
}
function mnote(f, t, d, type, v) {
  const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .03); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(AU.mg); o.start(t); o.stop(t + d + .05);
}
function playNote(t) {
  const R = 146.83;
  if (mStep % 16 === 0) { mnote(R / 2, t, 5.6, 'sawtooth', .13); mnote(R * .75, t, 5.6, 'triangle', .13); }
  if (mStep % 4 === 0) mnote(R / 2, t, .25, 'sine', .35);
  if (mStep % 2 === 0 && Math.random() < .8) { mPos = clamp(mPos + ((Math.random() * 5 | 0) - 2), 0, 11); const deg = SCALE[mPos % 7] + 12 * Math.floor(mPos / 7); mnote(R * 2 * Math.pow(2, deg / 12), t, .6, 'triangle', .3); }
}

/* =============== Yordamchi UI =============== */
function show(id) { document.querySelectorAll('.screen').forEach(e => e.classList.toggle('on', e.id === id)); }
function hideScreens() { document.querySelectorAll('.screen').forEach(e => e.classList.remove('on')); }
function note(text, bad) { const n = $('notes'); if (!n) return; const d = document.createElement('div'); d.textContent = text; if (bad) d.className = 'bad'; n.appendChild(d); while (n.children.length > 4) n.removeChild(n.firstChild); setTimeout(() => d.remove(), 3300); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fname = i => I.t('f_' + FACTIONS[i].id);
function pname(i) { const P = G && G.S.players[i]; return P ? esc(P.name) + ' · ' + fname(P.fac) : '?'; }
function saveSet() { store.set('xj_set', SET); }

function applyLang() {
  I.lang = SET.lang; I.apply(); renderHelp(); renderSoloFacs(); renderBadge(); if (NET && NET.lobby) renderLobby(); $('setLang').value = SET.lang;
  document.querySelectorAll('[data-langs]').forEach(c => { c.innerHTML = ''; [['uz', "O'zbekcha"], ['ru', 'Русский'], ['en', 'English']].forEach(([k, n]) => { const b = document.createElement('button'); b.textContent = n; if (k === SET.lang) b.className = 'on'; b.onclick = () => { SET.lang = k; saveSet(); applyLang(); }; c.appendChild(b); }); });
  if (G) { G.psig = ''; }
}
function renderHelp() { $('helpBody').innerHTML = I.list('help').join(''); }
function renderBadge() {
  const p = ACC && ACC.profile; const html = p ? `<span class="nm">${esc(p.name)}</span><span>🏆 ${p.wins | 0}</span><span>🎮 ${p.games | 0}</span><span>🪙 ${p.coins | 0}</span>${p.title ? `<span class="ttl">👑 ${esc(I.t('title_khan'))}</span>` : ''}` : I.t('s_off');
  $('profBadge').innerHTML = html; $('accInfo').innerHTML = html;
}
async function api(path, body) { const r = await fetch(path, { method: 'POST', body: JSON.stringify(body) }); return r.json(); }
async function doLogin() {
  const name = $('inName').value.trim(), code = $('inCode').value; const err = $('profErr'); err.textContent = '';
  if (name.length < 2 || code.length < 3) { err.textContent = I.t('e_short'); return; }
  $('btnLogin').disabled = true;
  try {
    const j = await api('/api/login', { name, code });
    if (!j.ok) { err.textContent = I.t(j.err === 'short' ? 'e_short' : 'e_wrong'); $('btnLogin').disabled = false; return; }
    ACC = { name, code, profile: j.profile }; store.set('xj_acc', ACC); enterMenu();
  } catch (e) {
    ACC = { name, code, profile: { name, wins: 0, games: 0, coins: 0, title: '' }, offline: true }; store.set('xj_acc', ACC); enterMenu(); note(I.t('e_net'), true);
  }
  $('btnLogin').disabled = false;
}
function enterMenu() { renderBadge(); show('s-menu'); }
async function syncProfile(manual) {
  if (!ACC) return; const m = $('accMsg'); if (manual) { m.className = 'err'; m.textContent = '…'; }
  try {
    const j = await api('/api/save', { name: ACC.name, code: ACC.code, profile: ACC.profile });
    if (j.ok) { ACC.profile = j.profile; ACC.offline = false; store.set('xj_acc', ACC); renderBadge(); if (manual) { m.className = 'err ok'; m.textContent = I.t('s_synced'); } }
    else if (manual) { m.className = 'err'; m.textContent = I.t('e_wrong'); }
  } catch (e) { if (manual) { m.className = 'err'; m.textContent = I.t('e_net'); } }
}
function award(kind) {
  if (!ACC || G.awarded) return; G.awarded = true; const p = ACC.profile; p.games = (p.games | 0) + 1;
  if (kind === 'win') { p.wins = (p.wins | 0) + 1; p.coins = (p.coins | 0) + 500; p.title = 'Eng katta xon'; }
  store.set('xj_acc', ACC); renderBadge(); syncProfile(false);
}

/* =============== Menyu bog'lash =============== */
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { audioInit(); SFX.click(); show(b.dataset.go); }));
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.btn')) { audioInit(); } }, true);
$('btnLogin').onclick = doLogin; $('inCode').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
$('mSolo').onclick = () => { renderSoloFacs(); show('s-solo'); };
$('mOnline').onclick = () => { $('onErr').textContent = ''; show('s-online'); };
$('mHelp').onclick = () => show('s-help');
$('mSet').onclick = () => { setReturn = 'menu'; openSettings(); };
$('mOut').onclick = () => { ACC = null; store.set('xj_acc', null); $('inCode').value = ''; show('s-profile'); };
function openSettings() { $('setMusic').value = SET.music; $('setSfx').value = SET.sfx; $('setGfx').value = SET.gfx; $('setEdge').checked = !!SET.edge; $('setLang').value = SET.lang; $('accMsg').textContent = ''; renderBadge(); show('s-set'); }
$('setLang').onchange = e => { SET.lang = e.target.value; saveSet(); applyLang(); };
$('setMusic').oninput = e => { SET.music = +e.target.value; saveSet(); applyVol(); audioInit(); };
$('setSfx').oninput = e => { SET.sfx = +e.target.value; saveSet(); applyVol(); audioInit(); };
$('setSfx').onchange = () => { audioInit(); SFX.sword(); };
$('setGfx').onchange = e => { SET.gfx = +e.target.value; saveSet(); if (G) resize(); };
$('setEdge').onchange = e => { SET.edge = e.target.checked; saveSet(); };
$('accSync').onclick = () => syncProfile(true);
$('accOut').onclick = () => $('mOut').onclick();
$('setBack').onclick = () => { show(setReturn === 'pause' ? 's-pause' : 's-menu'); };

function renderSoloFacs() {
  const h = FACTIONS.map((f, i) => `<div class="fac ${i === soloFac ? 'mine' : ''}" data-i="${i}"><div class="sw" style="background:${f.color}"></div><div><b>${fname(i)}</b><small>${I.t('fd_' + f.id)}</small></div></div>`).join('');
  $('soloFacs').innerHTML = h;
  $('soloFacs').querySelectorAll('.fac').forEach(e => e.onclick = () => { soloFac = +e.dataset.i; SFX.click(); renderSoloFacs(); });
}
$('soloStart').onclick = () => {
  audioInit(); const nb = +$('soloBots').value, lvl = +$('soloDiff').value; const others = [0, 1, 2, 3].filter(i => i !== soloFac).slice(0, nb);
  const parts = [soloFac].concat(others).sort((a, b) => a - b); const plist = parts.map(f => f === soloFac ? { fac: f, name: (ACC && ACC.name) || 'Xon' } : { fac: f, name: 'Bot', bot: lvl });
  lastSolo = { plist, me: parts.indexOf(soloFac) };
  launch({ seed: (Math.random() * 1e9) | 0, plist, me: lastSolo.me, online: false, isHost: true });
};

/* =============== Tarmoq =============== */
function netConnect(cb) {
  if (NET && NET.ws && NET.ws.readyState === 1) { cb(true); return; }
  let ws; try { ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws'); } catch (e) { cb(false); return; }
  NET = { ws, id: '', code: '', lobby: null, me: -1 }; let done = false;
  ws.onopen = () => { done = true; cb(true); }; ws.onerror = () => { if (!done) { done = true; cb(false); } };
  ws.onclose = () => { if (!done) { done = true; cb(false); } onNetClose(ws); };
  ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } onNet(m); };
}
const nsend = o => { if (NET && NET.ws && NET.ws.readyState === 1) NET.ws.send(JSON.stringify(o)); };
function netClose() { if (NET && NET.ws) { try { NET.ws.onclose = null; NET.ws.close(); } catch (e) {} } NET = null; }
function onNetClose(ws) {
  if (!NET || NET.ws !== ws) return; NET = null;
  if (G && G.online) { stopGame(); note(I.t('e_conn'), true); show('s-menu'); } else if ($('s-lobby').classList.contains('on')) show('s-menu');
}
$('btnJoin').onclick = () => {
  audioInit(); const code = $('inRoom').value.trim(); if (code.length < 3) { $('onErr').textContent = I.t('e_code'); return; } $('onErr').textContent = '…';
  netConnect(ok => { if (!ok) { $('onErr').textContent = I.t('e_conn'); return; } nsend({ t: 'join', code, name: (ACC && ACC.name) || 'Xon' }); });
};
function onNet(m) {
  switch (m.t) {
    case 'joined': NET.id = m.id; NET.code = m.code; $('onErr').textContent = ''; break;
    case 'err': $('onErr').textContent = I.t('e_' + m.e); if (m.e !== 'code') netClose(); break;
    case 'lobby': NET.lobby = m; NET.host = m.host === NET.id;
      if (G && G.online && !m.started) { stopGame(); }
      if (!G) { renderLobby(); show('s-lobby'); } break;
    case 'start': {
      const plist = [], slotIdx = {};
      m.slots.forEach((s, i) => { if (s.k === 'free') return; slotIdx[i] = plist.length; plist.push(s.k === 'bot' ? { fac: i, name: s.name || 'Bot', bot: s.bot | 0 } : { fac: i, name: s.name }); });
      launch({ seed: m.seed, plist, me: slotIdx[m.you], online: true, isHost: m.host === NET.id, slotIdx }); break; }
    case 'cmd': if (G && G.simRun) { const idx = G.slotIdx[m.slot]; if (idx != null) Sim.applyCmd(G.S, idx, m.c); } break;
    case 'snap': if (G && !G.simRun) Sim.applySnap(G.S, m, performance.now()); break;
    case 'left': if (G && G.simRun) { const idx = G.slotIdx[m.slot]; if (idx != null && G.S.players[idx].alive) { Sim.eliminate(G.S, G.S.players[idx]); note(I.t('n_disc', { n: G.S.players[idx].name }), true); } } break;
    case 'hostleft': if (G) { stopGame(); } netClose(); show('s-menu'); note(I.t('e_conn'), true); break;
    case 'kicked': netClose(); show('s-menu'); break;
  }
}
function renderLobby() {
  const L = NET && NET.lobby; if (!L) return; $('lobCode').textContent = L.code;
  const myCid = NET.id; let mySlot = -1, nh = 0, nr = 0, occ = 0;
  L.slots.forEach((s, i) => { if (s.cid === myCid) mySlot = i; if (s.k === 'human') { nh++; if (s.ready) nr++; } if (s.k !== 'free') occ++; });
  NET.mySlot = mySlot;
  $('lobFacs').innerHTML = L.slots.map((s, i) => {
    let st = '', cls = '', extra = '';
    if (s.k === 'free') { st = `<span style="color:#9be08b">${I.t('free')}</span>`; if (NET.host) extra = `<button class="btn alt mini" data-bot="${i}">${I.t('addbot')}</button>`; }
    else if (s.k === 'bot') { st = `<span style="color:#ffd86b">🤖 ${I.t('bot')}</span>`; cls = 'taken'; if (NET.host) extra = `<button class="btn red mini" data-bot="${i}">✖</button>`; }
    else if (s.cid === myCid) { st = `<span style="color:var(--gold)">${I.t('yours')} ${s.ready ? '✔' : ''}</span>`; cls = 'mine'; }
    else { st = `<span style="color:#ff9a8a">${I.t('taken', { n: esc(s.name) })} ${s.ready ? '✔' : ''}</span>`; cls = 'taken'; }
    return `<div class="fac ${cls}" data-i="${i}"><div class="sw" style="background:${FACTIONS[i].color}"></div><div style="flex:1;min-width:0"><b>${fname(i)}</b><small>${I.t('fd_' + FACTIONS[i].id)}</small><div class="st">${st}</div></div>${extra}</div>`;
  }).join('');
  $('lobFacs').querySelectorAll('.fac').forEach(e => e.onclick = ev => {
    if (ev.target.closest('[data-bot]')) return; const i = +e.dataset.i, s = L.slots[i]; SFX.click();
    if (s.k === 'free') nsend({ t: 'pick', slot: i }); else if (s.cid === myCid) nsend({ t: 'unpick' });
  });
  $('lobFacs').querySelectorAll('[data-bot]').forEach(b => b.onclick = ev => { ev.stopPropagation(); nsend({ t: 'bot', slot: +b.dataset.bot, lvl: 1 }); });
  const rb = $('btnReady'); const me = mySlot >= 0 ? L.slots[mySlot] : null; rb.disabled = !me; rb.textContent = me && me.ready ? I.t('unready') : I.t('ready');
  $('lobInfo').textContent = L.started ? I.t('loading') : (mySlot < 0 ? I.t('lob_pick') + ' · ' : '') + I.t('lob_n', { n: L.n }) + ' · ' + I.t('lob_ready', { r: nr, h: nh }) + (occ < 2 ? ' · ' + I.t('lob_wait') : '');
}
$('btnReady').onclick = () => { audioInit(); const L = NET.lobby, me = L.slots[NET.mySlot]; if (me) nsend({ t: 'ready', v: !me.ready }); };
$('btnLeave').onclick = () => { nsend({ t: 'leave' }); netClose(); show('s-menu'); };

/* =============== O'yinni ishga tushirish =============== */
const frameWait = () => new Promise(r => setTimeout(r, 40));
function setBar(p) { $('loadBar').style.width = p + '%'; }
async function launch(o) {
  show('s-load'); $('loadTip').textContent = I.tip(); setBar(5); await frameWait(); const t0 = performance.now();
  if (G) stopGame();
  const S = Sim.createState(o.seed, o.plist); setBar(30); await frameWait();
  const colors = S.players.map(p => p.color), key = colors.join(','); if (!sprites || spriteKey !== key) { sprites = SP.build(mk, colors); spriteKey = key; iconCache = {}; } setBar(60); await frameWait();
  const terrain = SP.terrain(mk, S, MW, MH); setBar(85); await frameWait();
  const mt = mk(MW, MH), mx = mt.getContext('2d'); for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { mx.fillStyle = S.ter[y * MW + x] === 1 ? '#1f5f9e' : '#5b9a3c'; mx.fillRect(x, y, 1, 1); }
  const sa = S.blds.find(b => b.owner === o.me && b.type === 'saroy');
  G = { S, me: o.me, online: o.online, simRun: o.isHost, slotIdx: o.slotIdx || {}, sp: sprites, terrain, miniTer: mt, cam: { x: sa.x, y: sa.y }, z: isTouch ? 1 : 1.3, dpr: 1, sel: [], groups: {}, acc: 0, last: performance.now(), lastSnap: 0,
    paused: false, placing: null, rallyMode: false, amode: false, boxTool: false, marks: [], parts: [], projs: [], texts: [], psig: '', miniT: 0, keys: {}, mouse: { x: 0, y: 0, in: false }, animals: [], resShown: false, awarded: false, deadShown: false, spectating: false, hudT: 0, lastClick: { t: 0, id: 0 } };
  if (o.online && !o.isHost) S.client = true;
  makeAnimals(); setBar(100);
  const wait = Math.max(0, 1500 - (performance.now() - t0)); await new Promise(r => setTimeout(r, wait));
  hideScreens(); $('hud').classList.remove('hidden'); resize(); G.last = performance.now(); G.psig = ''; renderPanel(true); note(I.t('n_unit').replace(/.*/, '') + fname(S.players[o.me].fac)); sfx('horn');
}
function stopGame() { G = null; $('hud').classList.add('hidden'); $('selbox').style.display = 'none'; $('placebar').style.display = 'none'; $('s-pause').classList.remove('on'); }
function makeAnimals() {
  const S = G.S, r = SP.rnd(S.seed + 99), kinds = ['deer', 'sheep', 'camel']; let n = 0;
  for (let i = 0; i < 400 && n < 36; i++) {
    const tx = 2 + (r() * 92 | 0), ty = 2 + (r() * 92 | 0); if (S.blk[ty * MW + tx] !== 0) continue; let near = false;
    for (const st of S.starts) if (Math.hypot(st[0] - tx, st[1] - ty) < 12) near = true; if (near) continue;
    const k = kinds[n % 3]; G.animals.push({ k, x: tx * TILE + 16, y: ty * TILE + 16, tx: tx * TILE + 16, ty: ty * TILE + 16, wait: r() * 4, face: 1, mv: 0 }); n++;
  }
}

/* =============== Kamera / o'lcham =============== */
function resize() {
  if (!G) return; const base = window.devicePixelRatio || 1; G.dpr = Math.min(base, [1, 1.5, 2][SET.gfx] || 1.5);
  cv.width = Math.floor(innerWidth * G.dpr); cv.height = Math.floor(innerHeight * G.dpr); ctx.imageSmoothingEnabled = false; setPanelVar();
}
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
function setPanelVar() { const p = $('panel'); document.documentElement.style.setProperty('--ph', (p ? p.offsetHeight : 130) + 'px'); }
const scl = () => G.z * G.dpr;
function toWorld(cx, cy) { const s = scl(); return { x: G.cam.x + (cx * G.dpr - cv.width / 2) / s, y: G.cam.y + (cy * G.dpr - cv.height / 2) / s }; }
function clampCam() { const c = G.cam; c.x = clamp(c.x, 0, MW * TILE); c.y = clamp(c.y, 0, MH * TILE); }
function onScreen(x, y) { if (!G) return true; const s = scl(); return Math.abs(x - G.cam.x) * s < cv.width * .65 && Math.abs(y - G.cam.y) * s < cv.height * .65; }
function zoomAt(f, cx, cy) { const before = toWorld(cx, cy); G.z = clamp(G.z * f, .55, 2.6); const after = toWorld(cx, cy); G.cam.x += before.x - after.x; G.cam.y += before.y - after.y; clampCam(); }
function centerOn(x, y) { G.cam.x = x; G.cam.y = y; clampCam(); }

/* =============== Buyruqlar / tanlash =============== */
const P_ = () => G.S.players[G.me];
function cmd(c) { if (!G || G.S.over) return; if (G.simRun) Sim.applyCmd(G.S, G.me, c); else nsend({ t: 'cmd', c }); }
function selEnts() { const a = []; for (const id of G.sel) { const e = G.S.byId.get(id); if (e && e.hp > 0 && !e.dead) a.push(e); } return a; }
function selUnits() { return selEnts().filter(e => e.kind === 'u' && e.owner === G.me); }
function setSel(list) { G.sel = list.map(e => e.id).slice(0, 300); G.placing = null; G.rallyMode = false; $('placebar').style.display = 'none'; G.psig = ''; }
function pick(wx, wy) {
  const S = G.S; let best = null, bd = 1e9;
  for (const u of S.units) { if (u.hp <= 0) continue; const dx = wx - (u.rx == null ? u.x : u.rx), dy = wy - ((u.ry == null ? u.y : u.ry) - 4), r = u.r + 6, d = dx * dx + dy * dy; if (d < r * r * 1.3 && d < bd) { bd = d; best = u; } }
  if (best) return best;
  let bb = null, by = -1;
  for (const b of S.blds) { if (b.hp <= 0) continue; const sh = G.sp.bld[b.type][0].height * 2, x0 = b.tx * TILE, x1 = x0 + b.w * TILE, y1 = (b.ty + b.h) * TILE; if (wx >= x0 && wx <= x1 && wy >= y1 - sh * .92 && wy <= y1 && y1 > by) { bb = b; by = y1; } }
  if (bb) return bb;
  const tx = wx / TILE | 0, ty = wy / TILE | 0;
  for (let dy = 0; dy <= 1; dy++) { if (tx < 0 || tx >= MW || ty + dy < 0 || ty + dy >= MH) continue; const id = S.rt[(ty + dy) * MW + tx]; if (id) { const e = S.byId.get(id); if (e && (dy === 0 || e.type === 'tree')) return e; } }
  return null;
}
function clickSelect(e, add, dbl) {
  if (!e) { if (!add) setSel([]); return; }
  if (e.kind === 'u' && e.owner === G.me && dbl) { const same = G.S.units.filter(u => u.owner === G.me && u.type === e.type && u.hp > 0 && onScreen(u.x, u.y)); setSel(same); return; }
  if (add && e.owner === G.me && e.kind === 'u') { const cur = selUnits(); if (!cur.includes(e)) cur.push(e); setSel(cur); return; }
  setSel([e]);
}
function boxSelect(x0, y0, x1, y1, add) {
  const a = toWorld(Math.min(x0, x1), Math.min(y0, y1)), b = toWorld(Math.max(x0, x1), Math.max(y0, y1)); const list = [];
  for (const u of G.S.units) if (u.owner === G.me && u.hp > 0 && u.rx >= a.x && u.rx <= b.x && u.ry >= a.y && u.ry <= b.y) list.push(u);
  if (add) for (const u of selUnits()) if (!list.includes(u)) list.push(u);
  if (!list.length && !add) { setSel([]); return; } setSel(list);
}
function mark(x, y, col) { G.marks.push({ x, y, t: performance.now(), col }); }
function orderAt(w, hit) {
  const us = selUnits(); if (!us.length) return; const ids = us.map(u => u.id);
  if (hit && hit.kind !== 'r' && hit.owner !== G.me && hit.owner >= 0) { cmd({ t: 'atk', ids, tid: hit.id }); mark(hit.x, hit.y, '#ff5040'); SFX.click(); return; }
  if (hit && hit.kind === 'r') { cmd({ t: 'gather', ids, rid: hit.id }); mark(hit.x, hit.y, '#ffd040'); SFX.click(); return; }
  if (hit && hit.kind === 'b' && hit.owner === G.me) {
    if (hit.type === 'ferma' && hit.done) { cmd({ t: 'gather', ids, rid: hit.id }); mark(hit.x, hit.y, '#ffd040'); return; }
    if (!hit.done || hit.hp < hit.mhp - 1) { cmd({ t: 'rep', ids, bid: hit.id }); mark(hit.x, hit.y, '#40d0ff'); return; }
  }
  cmd({ t: 'move', ids, x: w.x, y: w.y, am: G.amode }); mark(w.x, w.y, G.amode ? '#ff9040' : '#7cfc00'); G.amode = false; G.psig = ''; SFX.click();
}
function selectArmy() { setSel(G.S.units.filter(u => u.owner === G.me && u.type !== 'dehqon' && u.hp > 0 && !u.water)); }
function selectIdle() { const l = G.S.units.filter(u => u.owner === G.me && u.type === 'dehqon' && u.hp > 0 && u.st === 'idle'); if (l.length) { setSel([l[(G.idleI = ((G.idleI || 0) + 1) % l.length)]]); centerOn(G.sel.length ? G.S.byId.get(G.sel[0]).x : G.cam.x, G.S.byId.get(G.sel[0]).y); } }
function goHome() { const b = G.S.blds.find(b => b.owner === G.me && b.type === 'saroy'); if (b) centerOn(b.x, b.y); }
function startPlace(type) {
  const ps = selUnits().filter(u => u.type === 'dehqon'); if (!ps.length) return; if (!Sim.costOk(P_(), BT[type].cost)) { note(I.t('n_noRes'), true); SFX.err(); return; }
  const T = BT[type]; G.placing = { type, tx: Math.round(G.cam.x / TILE - T.w / 2), ty: Math.round(G.cam.y / TILE - T.h / 2) }; G.psig = '';
  if (isTouch) { $('placebar').style.display = 'flex'; note(I.t('place_hint')); }
}
function ghostTo(w) { const T = BT[G.placing.type]; G.placing.tx = Math.round(w.x / TILE - T.w / 2); G.placing.ty = Math.round(w.y / TILE - T.h / 2); }
function confirmPlace(keep) {
  const p = G.placing; if (!p) return; const ps = selUnits().filter(u => u.type === 'dehqon');
  if (!Sim.costOk(P_(), BT[p.type].cost)) { note(I.t('n_noRes'), true); SFX.err(); return; }
  if (!Sim.canPlace(G.S, p.type, p.tx, p.ty, G.me)) { note(I.t('n_noPlace'), true); SFX.err(); return; }
  cmd({ t: 'build', ids: ps.map(u => u.id), type: p.type, tx: p.tx, ty: p.ty }); SFX.click();
  if (!keep) { G.placing = null; $('placebar').style.display = 'none'; } G.psig = '';
}
$('plOk').onclick = () => confirmPlace(false); $('plNo').onclick = () => { G.placing = null; $('placebar').style.display = 'none'; G.psig = ''; };

/* =============== Panel =============== */
let iconCache = {};
function icon(kind, type) {
  const key = kind + type; if (iconCache[key]) return iconCache[key]; let src;
  if (kind === 'u') src = G.sp.unit[type][G.me][0]; else if (kind === 'b') src = G.sp.bld[type][G.me]; else if (kind === 'r') src = G.sp.res[type][0]; else src = G.sp.animal[type][0];
  const c = mk(48, 48), x = c.getContext('2d'), k = Math.min(44 / src.width, 44 / src.height), k2 = k >= 1 ? Math.floor(k) : k; x.imageSmoothingEnabled = k < 1;
  const w = src.width * k2, h = src.height * k2; x.drawImage(src, (48 - w) / 2, (48 - h) / 2, w, h); return (iconCache[key] = c.toDataURL());
}
const costTxt = c => (c.f ? '🍖' + c.f + ' ' : '') + (c.w ? '🪵' + c.w + ' ' : '') + (c.s ? '🪨' + c.s + ' ' : '') + (c.g ? '🪙' + c.g : '');
const qpct = q => q.pct != null ? q.pct : (1 - q.t / q.tt) * 100;
function hpBar(e) { const r = e.hp / (e.mhp || 1); return `<div class="hpb"><i class="${r < .3 ? 'vlo' : r < .6 ? 'lo' : ''}" style="width:${clamp(r * 100, 0, 100)}%"></i></div>`; }
function ent(e) { return e.kind === 'u' ? ['u', e.type, I.t('u_' + e.type)] : e.kind === 'b' ? ['b', e.type, I.t('b_' + e.type)] : ['r', e.type, I.t('r_' + e.type)]; }
function renderPanel(force) {
  const S = G.S, P = P_(), es = selEnts(); G.sel = es.map(e => e.id); const mine = es.filter(e => e.owner === G.me);
  const f0 = es[0]; let kind = 'none';
  if (f0) kind = (f0.owner === G.me && f0.kind === 'u') ? 'units' : (f0.owner === G.me && f0.kind === 'b') ? 'bld' : 'info';
  const afford = a => a.map(c => Sim.costOk(P, c) ? 1 : 0).join('');
  let sig = kind + '|' + G.sel.slice(0, 40).join(',') + '|' + G.sel.length + '|' + (G.amode ? 1 : 0) + (G.rallyMode ? 1 : 0) + (G.placing ? G.placing.type : '') + '|' + I.lang;
  const hasP = mine.some(e => e.type === 'dehqon');
  if (kind === 'units' && hasP) sig += afford(BNAMES.map(t => BT[t].cost));
  if (kind === 'bld') { const b = f0, T = BT[b.type]; sig += '|' + b.done + (b.hp / b.mhp * 10 | 0) + '|' + b.queue.map(q => q.type + (qpct(q) / 12 | 0)).join(',') + '|' + (T.train ? afford(T.train.map(t => UT[t].cost)) : '') + (P.pop >= P.popcap ? 'P' : ''); }
  if (es.length === 1) sig += '|' + (f0.hp / (f0.mhp || 1) * 12 | 0) + (f0.amt ? (f0.amt / 20 | 0) : '');
  if (!force && sig === G.psig) return; G.psig = sig;
  let info = '', acts = '';
  const A = (a, ic, name, cost, extra) => `<div class="ab ${extra || ''}" data-a="${a}">${ic}<span>${name}</span>${cost ? `<span class="cs">${cost}</span>` : ''}</div>`;
  if (kind === 'none') {
    info = `<div class="info"><div class="t"><span class="ic">👑</span><div><b>${esc(P.name)}</b><br><small>${fname(P.fac)}</small></div></div><div class="hint" style="text-align:left;margin:4px 0 0">${isTouch ? '👆' : '🖱'} ${I.t('sel', { n: 0 })}</div></div>`;
    acts = A('army', '🛡', I.t('army')) + A('idle', '🧑‍🌾', I.t('idle')) + A('home', '🏰', I.t('home'));
  } else if (kind === 'units') {
    if (es.length === 1) { const u = f0, T = UT[u.type]; info = `<div class="info"><div class="t"><img class="ic" src="${icon('u', u.type)}"><div><b>${I.t('u_' + u.type)}</b></div></div>${hpBar(u)}<small>${I.t('hp')}: ${Math.ceil(u.hp)}/${Math.ceil(u.mhp)}<br>⚔ ${T.atk} · 🛡 ${T.armor}${T.ranged ? ' · 🎯 ' + T.rng : ''}</small></div>`; }
    else { const cnt = {}; for (const u of mine) cnt[u.type] = (cnt[u.type] || 0) + 1; info = `<div class="info"><b>${I.t('sel', { n: mine.length })}</b><div class="chips">${Object.keys(cnt).map(t => `<span class="chip" data-a="sel:${t}"><img src="${icon('u', t)}" style="height:20px;image-rendering:pixelated"> ${cnt[t]}</span>`).join('')}</div></div>`; }
    if (hasP) acts += BNAMES.map(t => A('build:' + t, `<img class="ic" src="${icon('b', t)}">`, I.t('b_' + t), costTxt(BT[t].cost), (Sim.costOk(P, BT[t].cost) ? '' : 'no') + (G.placing && G.placing.type === t ? ' on' : ''))).join('');
    acts += A('stop', '⏹', I.t('stop')) + A('am', '⚔', I.t('amove'), '', G.amode ? 'on' : '');
  } else if (kind === 'bld') {
    const b = f0, T = BT[b.type];
    info = `<div class="info"><div class="t"><img class="ic" src="${icon('b', b.type)}"><div><b>${I.t('b_' + b.type)}</b></div></div>${hpBar(b)}<small>${I.t('hp')}: ${Math.ceil(b.hp)}/${Math.ceil(b.mhp)}${b.done ? '' : '<br>' + I.t('building') + ' ' + Math.floor(b.prog * 100) + '%'}</small>${b.queue.length ? `<div class="qrow">${b.queue.map((q, i) => `<div class="qi" data-a="cancel:${i}"><img src="${icon('u', q.type)}" style="height:26px;image-rendering:pixelated"><i style="width:${i === 0 ? qpct(q) : 0}%"></i></div>`).join('')}</div>` : ''}</div>`;
    if (b.done && T.train) acts += T.train.map(t => A('train:' + t, `<img class="ic" src="${icon('u', t)}">`, I.t('u_' + t), costTxt(UT[t].cost), Sim.costOk(P, UT[t].cost) && P.pop + UT[t].pop <= P.popcap ? '' : 'no')).join('');
    if (b.done && T.train) acts += A('rally', '🚩', I.t('rally'), '', G.rallyMode ? 'on' : '');
    if (b.type !== 'saroy') acts += A('del', '🗑', I.t('del'));
  } else {
    const e = f0, k = ent(e); info = `<div class="info"><div class="t"><img class="ic" src="${icon(k[0], k[1])}"><div><b>${k[2]}</b>${e.owner >= 0 && e.owner !== G.me ? '<br><small>' + pname(e.owner) + '</small>' : ''}</div></div>${e.kind !== 'r' ? hpBar(e) : ''}${e.amt ? `<small>${e.amt}</small>` : ''}</div>`;
    acts = A('army', '🛡', I.t('army')) + A('home', '🏰', I.t('home'));
  }
  $('panel').innerHTML = info + `<div class="acts">${acts}</div>`; setPanelVar();
}
$('panel').addEventListener('click', e => {
  const t = e.target.closest('[data-a]'); if (!t || !G) return; audioInit(); const [a, arg] = t.dataset.a.split(':'); SFX.click(); const f0 = selEnts()[0];
  switch (a) {
    case 'build': startPlace(arg); break;
    case 'train': if (f0 && f0.kind === 'b') cmd({ t: 'train', bid: f0.id, type: arg }); G.psig = ''; break;
    case 'cancel': if (f0 && f0.kind === 'b') cmd({ t: 'cancel', bid: f0.id, idx: +arg }); G.psig = ''; break;
    case 'rally': G.rallyMode = !G.rallyMode; G.psig = ''; if (G.rallyMode) note(I.t('rally_set')); break;
    case 'del': if (f0 && f0.kind === 'b') { cmd({ t: 'del', bid: f0.id }); setSel([]); } break;
    case 'stop': cmd({ t: 'stop', ids: selUnits().map(u => u.id) }); break;
    case 'am': G.amode = !G.amode; G.psig = ''; break;
    case 'army': selectArmy(); break; case 'idle': selectIdle(); break; case 'home': goHome(); break;
    case 'sel': setSel(selUnits().filter(u => u.type === arg)); break;
  }
});

/* =============== Kiritish: sichqoncha / sensor =============== */
cv.addEventListener('contextmenu', e => e.preventDefault()); document.addEventListener('contextmenu', e => { if (G) e.preventDefault(); });
const ptrs = new Map(); let drag = null, pinch = null;
function showBox(x0, y0, x1, y1) { const b = $('selbox'); b.style.display = 'block'; b.style.left = Math.min(x0, x1) + 'px'; b.style.top = Math.min(y0, y1) + 'px'; b.style.width = Math.abs(x1 - x0) + 'px'; b.style.height = Math.abs(y1 - y0) + 'px'; }
function hideBox() { $('selbox').style.display = 'none'; }
function setRallyAt(w, hit) { const b = selEnts()[0]; if (b && b.kind === 'b' && b.owner === G.me) { cmd({ t: 'rally', bid: b.id, x: w.x, y: w.y, rid: hit && hit.kind === 'r' ? hit.id : 0 }); mark(w.x, w.y, '#40d0ff'); } G.rallyMode = false; G.psig = ''; }
cv.addEventListener('pointerdown', e => {
  if (!G) return; audioInit(); cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false, type: e.pointerType });
  const w = toWorld(e.clientX, e.clientY);
  if (e.pointerType === 'mouse') {
    G.mouse.x = e.clientX; G.mouse.y = e.clientY;
    if (e.button === 2) { if (G.placing) { G.placing = null; G.psig = ''; return; } if (G.rallyMode) { G.rallyMode = false; G.psig = ''; return; } const hit = pick(w.x, w.y); const f0 = selEnts()[0]; if (f0 && f0.kind === 'b' && f0.owner === G.me && !selUnits().length) setRallyAt(w, hit); else orderAt(w, hit); return; }
    if (e.button === 0) {
      if (G.placing) { ghostTo(w); confirmPlace(e.shiftKey); return; }
      if (G.rallyMode) { setRallyAt(w, pick(w.x, w.y)); return; }
      if (G.amode && selUnits().length) { orderAt(w, null); return; }
      drag = { x0: e.clientX, y0: e.clientY, active: false, add: e.shiftKey };
    }
  } else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; ptrs.forEach(p => p.moved = true); hideBox(); drag = null; }
  else if (G.boxTool) drag = { x0: e.clientX, y0: e.clientY, active: false, add: false, touch: true };
});
cv.addEventListener('pointermove', e => {
  if (!G) return; const p = ptrs.get(e.pointerId); G.mouse.x = e.clientX; G.mouse.y = e.clientY; G.mouse.in = true;
  if (G.placing && e.pointerType === 'mouse') ghostTo(toWorld(e.clientX, e.clientY));
  if (!p) return;
  if (e.pointerType === 'mouse') { if (drag) { if (!drag.active && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) drag.active = true; if (drag.active) showBox(drag.x0, drag.y0, e.clientX, e.clientY); } p.x = e.clientX; p.y = e.clientY; return; }
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 10) p.moved = true;
  if (ptrs.size >= 2 && pinch) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2; zoomAt(d / pinch.d, cx, cy); G.cam.x -= (cx - pinch.cx) * G.dpr / scl(); G.cam.y -= (cy - pinch.cy) * G.dpr / scl(); clampCam(); pinch.d = d; pinch.cx = cx; pinch.cy = cy; return; }
  if (drag && drag.touch) { if (p.moved) { drag.active = true; showBox(drag.x0, drag.y0, e.clientX, e.clientY); } return; }
  if (p.moved) { G.cam.x -= dx * G.dpr / scl(); G.cam.y -= dy * G.dpr / scl(); clampCam(); }
});
function endPtr(e) {
  if (!G) { ptrs.delete(e.pointerId); return; } const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (!p) return; if (ptrs.size < 2) pinch = null;
  if (e.pointerType === 'mouse') {
    if (e.button !== 0 || !drag) return; const d = drag; drag = null; hideBox();
    if (d.active) boxSelect(d.x0, d.y0, e.clientX, e.clientY, d.add); else { const w = toWorld(e.clientX, e.clientY), hit = pick(w.x, w.y), now = performance.now(), dbl = hit && G.lastClick.id === hit.id && now - G.lastClick.t < 380; G.lastClick = { t: now, id: hit ? hit.id : 0 }; clickSelect(hit, d.add, dbl); }
    return;
  }
  if (drag && drag.touch) { const d = drag; drag = null; hideBox(); if (d.active) { boxSelect(d.x0, d.y0, e.clientX, e.clientY, false); G.boxTool = false; $('toolBox').classList.remove('on'); return; } }
  if (!p.moved && performance.now() - p.t < 450 && ptrs.size === 0) tap(e.clientX, e.clientY);
}
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); pinch = null; drag = null; hideBox(); });
function tap(x, y) {
  const w = toWorld(x, y), hit = pick(w.x, w.y);
  if (G.placing) { ghostTo(w); return; }
  if (G.rallyMode) { setRallyAt(w, hit); return; }
  const us = selUnits();
  if (G.amode && us.length) { orderAt(w, null); return; }
  if (hit && hit.owner === G.me) {
    if (us.length && us.some(u => u.type === 'dehqon') && hit.kind === 'b' && ((hit.type === 'ferma' && hit.done) || !hit.done || hit.hp < hit.mhp - 1)) { orderAt(w, hit); return; }
    clickSelect(hit, false, false); return;
  }
  if (us.length) orderAt(w, hit); else if (hit) setSel([hit]); else setSel([]);
}
cv.addEventListener('wheel', e => { if (!G) return; e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }, { passive: false });
cv.addEventListener('pointerleave', () => { if (G) G.mouse.in = false; });
document.querySelectorAll('#mobtools button').forEach(b => b.addEventListener('click', () => {
  if (!G) return; audioInit(); const t = b.dataset.tool; SFX.click();
  if (t === 'box') { G.boxTool = !G.boxTool; b.classList.toggle('on', G.boxTool); } else if (t === 'army') selectArmy(); else if (t === 'am') { G.amode = !G.amode; $('toolAm').classList.toggle('on', G.amode); G.psig = ''; } else if (t === 'none') { setSel([]); G.amode = false; $('toolAm').classList.remove('on'); } else if (t === 'home') goHome();
}));
window.addEventListener('keydown', e => {
  if (!G) return; if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) return; const k = e.key.toLowerCase();
  if (k === 'escape') { if (G.placing) { G.placing = null; G.psig = ''; $('placebar').style.display = 'none'; } else if (G.rallyMode || G.amode) { G.rallyMode = G.amode = false; G.psig = ''; } else togglePause(); return; }
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { if (k === 'a' && !e.ctrlKey && selUnits().length && !e.shiftKey) { G.amode = true; G.psig = ''; note(I.t('amove')); return; } if (k === 's' && selUnits().length && !G.keys.shift) { cmd({ t: 'stop', ids: selUnits().map(u => u.id) }); return; } G.keys[k] = true; e.preventDefault(); return; }
  if (k === 'h') goHome(); else if (k === ' ') { e.preventDefault(); selectIdle(); } else if (k === 'delete') { const f = selEnts()[0]; if (f && f.kind === 'b' && f.owner === G.me) { cmd({ t: 'del', bid: f.id }); setSel([]); } }
  else if (/^[1-9]$/.test(k)) { if (e.ctrlKey || e.metaKey) { e.preventDefault(); G.groups[k] = selUnits().map(u => u.id); note('#' + k + ' ✔'); } else if (G.groups[k]) { const l = G.groups[k].map(id => G.S.byId.get(id)).filter(u => u && u.hp > 0); if (l.length) { const now = performance.now(); if (G.lastGrp === k && now - G.lastGrpT < 400) centerOn(l[0].x, l[0].y); G.lastGrp = k; G.lastGrpT = now; setSel(l); } } }
});
window.addEventListener('keyup', e => { if (G) G.keys[e.key.toLowerCase()] = false; });
function togglePause() { if (!G) return; if (!G.online) G.paused = true; show('s-pause'); }
$('btnMenu').onclick = () => { audioInit(); togglePause(); };
$('pResume').onclick = () => { G.paused = false; hideScreens(); };
$('pSet').onclick = () => { setReturn = 'pause'; openSettings(); };
$('pQuit').onclick = () => { quitToMenu(); };
function quitToMenu() { const online = G && G.online; stopGame(); if (online) { nsend({ t: 'leave' }); netClose(); } show('s-menu'); }
mini.addEventListener('pointerdown', e => { mini.setPointerCapture(e.pointerId); miniMove(e); mini._d = true; e.stopPropagation(); });
mini.addEventListener('pointermove', e => { if (mini._d) miniMove(e); }); mini.addEventListener('pointerup', () => mini._d = false);
function miniMove(e) { if (!G) return; const r = mini.getBoundingClientRect(); centerOn((e.clientX - r.left) / r.width * MW * TILE, (e.clientY - r.top) / r.height * MH * TILE); }

/* =============== Effektlar =============== */
function parts(x, y, n, col, spread, life, up) { if (SET.gfx < 1) n = Math.min(n, 2); for (let i = 0; i < n; i++) G.parts.push({ x, y, vx: (Math.random() - .5) * spread, vy: (Math.random() - .5) * spread - (up || 0), life: life * (.6 + Math.random() * .6), max: life, col, s: 2 + Math.random() * 3 }); if (G.parts.length > 400) G.parts.splice(0, G.parts.length - 400); }
function handleFx() {
  const S = G.S; const evs = S.fx; for (let i = 0; i < evs.length; i++) {
    const ev = evs[i]; switch (ev[0]) {
      case 'm': { const u = S.byId.get(ev[1]); if (u) { u.lunge = .18; sfx('sword', u.x, u.y); } break; }
      case 'p': { const k = ev[1], dx = ev[4] - ev[2], dy = ev[5] - ev[3], d = Math.hypot(dx, dy) || 1, sp = k === 0 ? 520 : k === 1 ? 900 : 380; G.projs.push({ k, x0: ev[2], y0: ev[3], x1: ev[4], y1: ev[5], t: 0, dur: d / sp }); sfx(k === 0 ? 'arrow' : k === 1 ? 'gun' : 'boom', ev[2], ev[3]); if (k >= 1) parts(ev[2], ev[3], 5, '#cfcfcf', 40, .5); break; }
      case 'x': { parts(ev[1], ev[2], 6 + ev[3] / 3 | 0, '#ff9a30', 120, .6); parts(ev[1], ev[2], 6 + ev[3] / 4 | 0, '#555', 80, 1.1, 30); sfx('boom', ev[1], ev[2]); break; }
      case 'd': parts(ev[1], ev[2], 6, '#b8a07a', 60, .6, 10); break;
      case 'c': if (ev[1] === G.me) { sfx('coin'); const x = ev[3], y = ev[4]; parts(x, y - 20, 2, ['#ffb0a0', '#e0b070', '#bbbbbb', '#ffe066'][ev[2]], 30, .5, 20); } break;
      case 'n': { const o = ev[1], k = ev[2]; if (k === 4) { note(I.t('n_dead', { n: S.players[o] ? S.players[o].name + ' · ' + fname(S.players[o].fac) : '?' }), true); sfx('horn'); break; } if (o !== G.me) break;
        if (k === 1) { note(I.t('n_done')); sfx('done'); } else if (k === 2) sfx('unit'); else if (k === 3) { note(I.t('n_att'), true); sfx('horn'); G.alert = { x: ev[3], y: ev[4], t: performance.now() }; } else if (k === 5) { note(I.t('n_noRes'), true); sfx('err'); } else if (k === 6) { note(I.t('n_noPlace'), true); sfx('err'); } else if (k === 7) { note(I.t('n_pop'), true); sfx('err'); } break; }
    }
  } evs.length = 0; if (!S.client) S.fxn.length = G.online ? S.fxn.length : 0;
}

/* =============== Chizish =============== */
const sortArr = []; const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
function render(now) {
  const S = G.S, W = cv.width, H = cv.height, s = scl(), cam = G.cam; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#0d2a45'; ctx.fillRect(0, 0, W, H);
  const vx0 = cam.x - W / 2 / s, vy0 = cam.y - H / 2 / s, vx1 = cam.x + W / 2 / s, vy1 = cam.y + H / 2 / s;
  const tx0 = Math.max(0, vx0), ty0 = Math.max(0, vy0), tx1 = Math.min(MW * TILE, vx1), ty1 = Math.min(MH * TILE, vy1);
  if (tx1 > tx0 && ty1 > ty0) ctx.drawImage(G.terrain, tx0 / 2, ty0 / 2, (tx1 - tx0) / 2, (ty1 - ty0) / 2, (tx0 - vx0) * s, (ty0 - vy0) * s, (tx1 - tx0) * s, (ty1 - ty0) * s);
  const SX = x => (x - vx0) * s, SY = y => (y - vy0) * s;
  if (SET.gfx >= 1) { // suv ko'pigi
    const a = Math.max(0, vx0 / TILE | 0), b = Math.max(0, vy0 / TILE | 0), c = Math.min(MW - 1, vx1 / TILE | 0), d = Math.min(MH - 1, vy1 / TILE | 0); ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let ty = b; ty <= d; ty++) for (let tx = a; tx <= c; tx++) { if (S.ter[ty * MW + tx] !== 1) continue; const h = hash(tx, ty), ph = ((now / 1700) + (h % 100) / 100) % 1; if (ph < .35) { const ww = Math.sin(ph / .35 * Math.PI); ctx.globalAlpha = ww * .6; ctx.fillRect(SX(tx * TILE + (h >> 3) % 20 + 2), SY(ty * TILE + (h >> 7) % 26 + 2), 8 * s, 2 * s); } } ctx.globalAlpha = 1;
  }
  // sahna
  const arr = sortArr; arr.length = 0; const pad = 80;
  for (const r of S.res) { if (r.x < vx0 - pad || r.x > vx1 + pad || r.y < vy0 - pad || r.y > vy1 + 80) continue; r._y = r.y; arr.push(r); }
  for (const b of S.blds) { const sh = G.sp.bld[b.type][0].height * 2; if ((b.tx + b.w) * TILE < vx0 - pad || b.tx * TILE > vx1 + pad || (b.ty + b.h) * TILE < vy0 || (b.ty + b.h) * TILE - sh > vy1) continue; b._y = (b.ty + b.h) * TILE; arr.push(b); }
  for (const u of S.units) { if (u.rx < vx0 - pad || u.rx > vx1 + pad || u.ry < vy0 - pad || u.ry > vy1 + pad) continue; u._y = u.ry; arr.push(u); }
  for (const an of G.animals) { if (an.x < vx0 - pad || an.x > vx1 + pad || an.y < vy0 - pad || an.y > vy1 + pad) continue; an._y = an.y; an.isA = true; arr.push(an); }
  arr.sort((a, b) => a._y - b._y);
  const selSet = new Set(G.sel), shadows = SET.gfx >= 1;
  // tanlangan halqalar (yerda)
  for (const id of G.sel) { const e = S.byId.get(id); if (!e) continue; const own = e.owner === G.me; ctx.strokeStyle = own ? '#7cfc00' : (e.owner >= 0 ? '#ff5040' : '#ffd040'); ctx.lineWidth = Math.max(1, 1.5 * s);
    if (e.kind === 'u') { ctx.beginPath(); ctx.ellipse(SX(e.rx), SY(e.ry + e.r), (e.r + 3) * s, (e.r * .55 + 2) * s, 0, 0, 7); ctx.stroke(); } else if (e.kind === 'b') ctx.strokeRect(SX(e.tx * TILE), SY(e.ty * TILE), e.w * TILE * s, e.h * TILE * s); else { ctx.beginPath(); ctx.ellipse(SX(e.x), SY(e.y + 6), 14 * s, 8 * s, 0, 0, 7); ctx.stroke(); } }
  for (const e of arr) {
    if (e.isA) { const spr = G.sp.animal[e.k][e.mv > now - 200 ? ((now / 200 | 0) % 2) : 0], w = spr.width, h = spr.height; if (shadows) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(SX(e.x), SY(e.y + 6), w * s, w * .35 * s, 0, 0, 7); ctx.fill(); } drawSpr(spr, SX(e.x) - w * s, SY(e.y + 8) - h * 2 * s, s, e.face < 0); continue; }
    if (e.kind === 'r') { const spr = G.sp.res[e.type][e.v], w = spr.width, h = spr.height; if (shadows && e.type !== 'bush') { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(SX(e.x), SY(e.y + 12), w * .8 * s, w * .35 * s, 0, 0, 7); ctx.fill(); } drawSpr(spr, SX(e.x) - w * s, SY(e.y + 14) - h * 2 * s, s, false); }
    else if (e.kind === 'b') drawBld(e, s, SX, SY, now);
    else drawUnit(e, s, SX, SY, now, selSet.has(e.id), shadows);
  }
  // loyiha (ghost)
  if (G.placing) { const p = G.placing, T = BT[p.type], ok = Sim.canPlace(S, p.type, p.tx, p.ty, G.me), spr = G.sp.bld[p.type][G.me]; ctx.globalAlpha = .6; drawSpr(spr, SX(p.tx * TILE), SY((p.ty + T.h) * TILE) - spr.height * 2 * s, s, false); ctx.globalAlpha = .38; ctx.fillStyle = ok ? '#37ff37' : '#ff3737'; ctx.fillRect(SX(p.tx * TILE), SY(p.ty * TILE), T.w * TILE * s, T.h * TILE * s); ctx.globalAlpha = 1; ctx.strokeStyle = ok ? '#7cfc00' : '#ff5040'; ctx.lineWidth = 2; ctx.strokeRect(SX(p.tx * TILE), SY(p.ty * TILE), T.w * TILE * s, T.h * TILE * s); }
  // o'qlar va to'plar
  for (let i = G.projs.length - 1; i >= 0; i--) { const p = G.projs[i]; p.t += G.dt; const f = p.t / p.dur; if (f >= 1) { G.projs.splice(i, 1); if (p.k >= 1) parts(p.x1, p.y1, 4, p.k === 2 ? '#ffb040' : '#ddd', 50, .35); else parts(p.x1, p.y1, 1, '#d8c8a0', 20, .25); continue; }
    const x = p.x0 + (p.x1 - p.x0) * f, y = p.y0 + (p.y1 - p.y0) * f - (p.k === 2 ? Math.sin(f * Math.PI) * 70 : p.k === 0 ? Math.sin(f * Math.PI) * 14 : 0);
    if (p.k === 0) { const a = Math.atan2(p.y1 - p.y0, p.x1 - p.x0); ctx.strokeStyle = '#e8dcb0'; ctx.lineWidth = Math.max(1, 1.5 * s); ctx.beginPath(); ctx.moveTo(SX(x), SY(y)); ctx.lineTo(SX(x - Math.cos(a) * 9), SY(y - Math.sin(a) * 9)); ctx.stroke(); }
    else if (p.k === 1) { ctx.fillStyle = '#fff2b0'; ctx.fillRect(SX(x) - s, SY(y) - s, 2 * s, 2 * s); }
    else { ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(SX(x), SY(y), 4 * s, 0, 7); ctx.fill(); } }
  // zarrachalar
  for (let i = G.parts.length - 1; i >= 0; i--) { const p = G.parts[i]; p.life -= G.dt; if (p.life <= 0) { G.parts.splice(i, 1); continue; } p.x += p.vx * G.dt; p.y += p.vy * G.dt; p.vx *= .96; p.vy *= .96; ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.col; ctx.fillRect(SX(p.x), SY(p.y), p.s * s, p.s * s); } ctx.globalAlpha = 1;
  // buyruq belgilari
  for (let i = G.marks.length - 1; i >= 0; i--) { const m = G.marks[i], f = (now - m.t) / 600; if (f >= 1) { G.marks.splice(i, 1); continue; } ctx.globalAlpha = 1 - f; ctx.strokeStyle = m.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(SX(m.x), SY(m.y), (6 + f * 14) * s, (3 + f * 7) * s, 0, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1;
  // hujum signali
  if (G.alert && now - G.alert.t < 3000) { const f = (now - G.alert.t) / 3000; ctx.globalAlpha = (1 - f) * (.5 + .5 * Math.sin(now / 90)); ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(SX(G.alert.x), SY(G.alert.y), 40 * s, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
  if (SET.gfx >= 2) { const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .45, W / 2, H / 2, Math.max(W, H) * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,5,0,.35)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
}
function drawSpr(spr, x, y, s, flip) { const w = spr.width * 2 * s, h = spr.height * 2 * s; if (flip) { ctx.setTransform(-1, 0, 0, 1, 2 * x + w, 0); ctx.drawImage(spr, x, y, w, h); ctx.setTransform(1, 0, 0, 1, 0, 0); } else ctx.drawImage(spr, x, y, w, h); }
function drawBld(b, s, SX, SY, now) {
  const spr = G.sp.bld[b.type][b.owner], w = spr.width, h = spr.height, x = SX(b.tx * TILE), yb = SY((b.ty + b.h) * TILE);
  if (SET.gfx >= 1) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x + 4 * s, yb - 5 * s, b.w * TILE * s, 8 * s); }
  if (b.done || b.prog >= 1) drawSpr(spr, x, yb - h * 2 * s, s, false);
  else { const p = clamp(b.prog, .05, 1), sh = Math.max(1, Math.floor(h * p)); ctx.globalAlpha = .55; ctx.fillStyle = '#6b4a22'; ctx.fillRect(x + 2 * s, yb - 6 * s, b.w * TILE * s - 4 * s, 6 * s); ctx.globalAlpha = 1; ctx.drawImage(spr, 0, h - sh, w, sh, x, yb - sh * 2 * s, w * 2 * s, sh * 2 * s); ctx.strokeStyle = '#d9b36a'; ctx.lineWidth = Math.max(1, s); ctx.setLineDash([4 * s, 3 * s]); ctx.strokeRect(x, yb - h * 2 * s, w * 2 * s, h * 2 * s); ctx.setLineDash([]); }
  if (b.hp < b.mhp * .98 || !b.done || G.sel.includes(b.id)) { const bw = b.w * TILE * .8 * s, bx = x + (b.w * TILE * s - bw) / 2, by = yb - h * 2 * s - 8 * s; ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, bw + 2, 6 * s + 2); const r = b.hp / b.mhp; ctx.fillStyle = r < .3 ? '#d9453a' : r < .6 ? '#e0b030' : '#4cc24c'; ctx.fillRect(bx, by, bw * clamp(r, 0, 1), 6 * s); }
  if (b.owner === G.me && b.done && b.queue.length && (b.queue[0])) { const q = b.queue[0], bw = b.w * TILE * .6 * s, bx = x + (b.w * TILE * s - bw) / 2, by = yb + 3 * s; ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, bw + 2, 4 * s + 2); ctx.fillStyle = '#e6b422'; ctx.fillRect(bx, by, bw * clamp(qpct(q) / 100, 0, 1), 4 * s); }
}
function drawUnit(u, s, SX, SY, now, selected, shadows) {
  const T = UT[u.type], spr = G.sp.unit[u.type][u.owner][u._mv > now - 140 ? ((now / 120 | 0) % 2) : 0], w = spr.width, h = spr.height;
  let lx = 0; if (u.lunge > 0) { u.lunge -= G.dt; lx = u.face * 4 * (u.lunge / .18); }
  const work = S_work(u); let by = 0; if (work) by = Math.abs(Math.sin(now / 110 + u.id)) * -3;
  const cx = SX(u.rx + lx), foot = SY(u.ry + u.r + 2);
  if (shadows) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, foot, (u.r + 1) * s, (u.r * .45 + 1) * s, 0, 0, 7); ctx.fill(); }
  drawSpr(spr, cx - w * s, foot + by * s - h * 2 * s + (u.water ? 3 * s : 0), s, u.face < 0);
  if (selected || u.hp < u.mhp - .5) { const bw = (u.r * 2 + 8) * s, bx = cx - bw / 2, bY = foot - h * 2 * s - 5 * s; ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, bY - 1, bw + 2, 4 * s + 2); const r = u.hp / u.mhp; ctx.fillStyle = r < .3 ? '#d9453a' : r < .6 ? '#e0b030' : '#4cc24c'; ctx.fillRect(bx, bY, bw * clamp(r, 0, 1), 4 * s); }
}
function S_work(u) { return G.S.client ? u.work : (u.st === 'gather' && u.gs === 'work') || u.st === 'build' ? 1 : 0; }
function drawMini(now) {
  const S = G.S; mctx.drawImage(G.miniTer, 0, 0); mctx.fillStyle = '#2f6a2a'; for (const r of S.res) { mctx.fillStyle = r.type === 'tree' ? '#2f6a2a' : r.type === 'rock' ? '#a0a6ac' : r.type === 'gold' ? '#f5c518' : '#3f9a3a'; mctx.fillRect(r.tx, r.ty, 1, 1); }
  for (const b of S.blds) { mctx.fillStyle = S.players[b.owner].color; mctx.fillRect(b.tx, b.ty, b.w, b.h); mctx.strokeStyle = '#000'; mctx.strokeRect(b.tx - .5, b.ty - .5, b.w + 1, b.h + 1); }
  for (const u of S.units) { mctx.fillStyle = S.players[u.owner].color; const x = u.x / TILE | 0, y = u.y / TILE | 0; mctx.fillRect(x, y, u.owner === G.me ? 2 : 1, u.owner === G.me ? 2 : 1); }
  const s = scl(), x0 = (G.cam.x - cv.width / 2 / s) / TILE, y0 = (G.cam.y - cv.height / 2 / s) / TILE; mctx.strokeStyle = '#fff'; mctx.lineWidth = 1; mctx.strokeRect(x0, y0, cv.width / s / TILE, cv.height / s / TILE);
}
function updateHud() {
  const P = P_(), S = G.S; $('rf').textContent = fmt(P.res.f); $('rw').textContent = fmt(P.res.w); $('rs').textContent = fmt(P.res.s); $('rg').textContent = fmt(P.res.g); $('rp').textContent = P.pop + '/' + P.popcap; const t = S.time | 0; $('tmr').textContent = (t / 60 | 0) + ':' + String(t % 60).padStart(2, '0');
  $('rp').style.color = P.pop >= P.popcap ? '#ff8a7a' : '';
}

/* =============== Asosiy sikl =============== */
function loop(t) {
  requestAnimationFrame(loop); if (!G) return; const S = G.S; const dt = Math.min(.25, (t - G.last) / 1000); G.last = t; G.dt = dt;
  // kamera harakati
  const sp = 760 / G.z * dt, k = G.keys; if (k.w || k.arrowup) G.cam.y -= sp; if (k.s || k.arrowdown) G.cam.y += sp; if (k.a || k.arrowleft) G.cam.x -= sp; if (k.d || k.arrowright) G.cam.x += sp;
  if (SET.edge && !isTouch && G.mouse.in && !drag && !$('s-pause').classList.contains('on')) { const m = G.mouse, e = 10; if (m.x < e) G.cam.x -= sp; if (m.x > innerWidth - e) G.cam.x += sp; if (m.y < e + 40 && m.y < 42 && false) G.cam.y -= sp; if (m.y < 4) G.cam.y -= sp; if (m.y > innerHeight - 4) G.cam.y += sp; }
  clampCam();
  if (G.simRun && !G.paused && !S.over) { G.acc = Math.min(G.acc + dt, TICK * 6); while (G.acc >= TICK) { Sim.step(S); G.acc -= TICK; } }
  if (G.simRun && G.online && NET && (t - G.lastSnap > 140 || (S.over && !G.overSent))) { G.lastSnap = t; if (S.over) G.overSent = true; try { NET.ws.send(JSON.stringify(Sim.snapshot(S))); } catch (e) {} }
  let al = G.simRun ? G.acc / TICK : clamp((t - (S.snapT || t)) / 150, 0, 1); if (G.simRun && (G.paused || S.over)) al = 1;
  for (const u of S.units) { const nx = u.ox + (u.x - u.ox) * al, ny = u.oy + (u.y - u.oy) * al; if (u.rx == null || Math.abs(nx - u.rx) + Math.abs(ny - u.ry) > .15) u._mv = t; u.rx = nx; u.ry = ny; }
  for (const a of G.animals) { a.wait -= dt; if (a.wait <= 0 && Math.hypot(a.tx - a.x, a.ty - a.y) < 4) { a.wait = 2 + Math.random() * 5; const ang = Math.random() * 6.28, d = 40 + Math.random() * 90, nx = clamp(a.x + Math.cos(ang) * d, 40, MW * TILE - 40), ny = clamp(a.y + Math.sin(ang) * d, 40, MH * TILE - 40); if (S.blk[(ny / TILE | 0) * MW + (nx / TILE | 0)] === 0) { a.tx = nx; a.ty = ny; } }
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy); if (d > 2) { const st = 22 * dt, nx = a.x + dx / d * st, ny = a.y + dy / d * st; if (S.blk[(ny / TILE | 0) * MW + (nx / TILE | 0)] === 0) { a.x = nx; a.y = ny; a.mv = t; if (Math.abs(dx) > 1) a.face = dx > 0 ? 1 : -1; } else { a.tx = a.x; a.ty = a.y; } } }
  handleFx(); render(t);
  G.hudT -= dt; if (G.hudT <= 0) { G.hudT = .2; updateHud(); renderPanel(false); drawMini(t); }
  if (!G.resShown) { const P = P_(); if (S.over) { showResult(S.winner === G.me ? 'win' : (!P.alive && !G.spectating ? 'lose' : 'over')); } else if (!P.alive && !G.deadShown) { G.deadShown = true; showResult('lose', true); } }
}
function showResult(kind, canSpec) {
  G.resShown = true; const S = G.S; $('placebar').style.display = 'none'; G.placing = null; hideBox();
  const T = $('resTitle'), B = $('resBody'), Gf = $('resGift'), b1 = $('resBtn1'), b2 = $('resBtn2'); Gf.style.display = 'none';
  if (kind === 'win') { T.textContent = I.t('win_t'); T.style.color = '#ffd86b'; B.textContent = I.t('win_b'); Gf.style.display = 'block'; Gf.innerHTML = `<div class="crown">👑</div><div class="px" style="color:var(--gold);font-size:13px;line-height:1.6;margin:8px 0">${I.t('gift_t')}</div><div>${S.players.length >= 4 ? I.t('gift_b') : I.t('gift2_b')}</div>`; sfx('win'); award('win'); }
  else if (kind === 'lose') { T.textContent = I.t('lose_t'); T.style.color = '#ff8a7a'; B.textContent = I.t('lose_b'); sfx('lose'); award('lose'); }
  else { T.textContent = I.t('over_t'); T.style.color = '#ffd86b'; B.innerHTML = S.winner >= 0 ? I.t('over_b', { w: pname(S.winner) }) : ''; award('lose'); }
  if (canSpec) { b1.textContent = I.t('spectate'); b1.onclick = () => { G.resShown = false; G.spectating = true; hideScreens(); }; }
  else if (G.online) { b1.textContent = I.t('tolobby'); b1.onclick = () => { const host = NET && NET.host; stopGame(); if (host) nsend({ t: 'end' }); renderLobby(); show('s-lobby'); }; }
  else { b1.textContent = I.t('again'); b1.onclick = () => { if (lastSolo) launch({ seed: (Math.random() * 1e9) | 0, plist: lastSolo.plist, me: lastSolo.me, online: false, isHost: true }); }; }
  b2.textContent = I.t('tomenu'); b2.onclick = () => { quitToMenu(); }; show('s-result');
}
requestAnimationFrame(loop);

/* =============== Boshlang'ich holat =============== */
applyLang();
if (ACC && ACC.name) { enterMenu(); syncProfile(false); } else show('s-profile');
window.__xj = { get G() { return G; }, Sim };
})();
