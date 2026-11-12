/* XONLAR JANGI — server (hech qanday tashqi paket kerak emas: faqat Node.js) */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'profiles.json');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.svg': 'image/svg+xml' };

/* ---------- Profillar ---------- */
let DB = {};
try { DB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { DB = {}; }
let saveTimer = null;
function saveDB() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(DB_FILE, JSON.stringify(DB)); } catch (e) { console.error('DB yozilmadi', e.message); } }, 400);
}
const hash = (name, code) => crypto.createHash('sha256').update('xj|' + name.toLowerCase() + '|' + code).digest('hex');
const pub = p => ({ name: p.name, wins: p.wins | 0, games: p.games | 0, coins: p.coins | 0, title: p.title || '' });
function readBody(req, cb) {
  let b = ''; req.on('data', d => { b += d; if (b.length > 20000) req.destroy(); }); req.on('end', () => { try { cb(JSON.parse(b || '{}')); } catch (e) { cb(null); } });
}
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
function api(req, res) {
  readBody(req, body => {
    if (!body) return json(res, 400, { ok: false, err: 'bad' });
    const name = String(body.name || '').trim().slice(0, 16), code = String(body.code || '').slice(0, 32);
    if (name.length < 2 || code.length < 3) return json(res, 400, { ok: false, err: 'short' });
    const key = name.toLowerCase(), h = hash(name, code);
    if (req.url === '/api/login') {
      const p = DB[key];
      if (!p) { DB[key] = { name, h, wins: 0, games: 0, coins: 0, title: '' }; saveDB(); return json(res, 200, { ok: true, created: true, profile: pub(DB[key]) }); }
      if (p.h !== h) return json(res, 200, { ok: false, err: 'wrong' });
      return json(res, 200, { ok: true, profile: pub(p) });
    }
    if (req.url === '/api/save') {
      const p = DB[key]; if (!p || p.h !== h) return json(res, 200, { ok: false, err: 'wrong' });
      const s = body.profile || {};
      p.wins = Math.max(p.wins | 0, s.wins | 0); p.games = Math.max(p.games | 0, s.games | 0); p.coins = Math.max(p.coins | 0, s.coins | 0);
      if (typeof s.title === 'string') p.title = s.title.slice(0, 40);
      saveDB(); return json(res, 200, { ok: true, profile: pub(p) });
    }
    json(res, 404, { ok: false });
  });
}

/* ---------- HTTP ---------- */
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/api/')) return api(req, res);
  let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html';
  const f = path.normalize(path.join(PUB, u)); if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(data);
  });
});

/* ---------- WebSocket (qo'lda) ---------- */
function wsSend(sock, str) {
  if (sock.destroyed) return;
  const p = Buffer.from(str), n = p.length; let h;
  if (n < 126) h = Buffer.from([0x81, n]);
  else if (n < 65536) { h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(n, 2); }
  else { h = Buffer.alloc(10); h[0] = 0x81; h[1] = 127; h.writeUInt32BE(0, 2); h.writeUInt32BE(n, 6); }
  sock.write(Buffer.concat([h, p]));
}
function wsPing(sock) { if (!sock.destroyed) sock.write(Buffer.from([0x89, 0])); }
server.on('upgrade', (req, sock) => {
  if (req.url.split('?')[0] !== '/ws') return sock.destroy();
  const key = req.headers['sec-websocket-key']; if (!key) return sock.destroy();
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n');
  sock.setNoDelay(true);
  const c = { id: crypto.randomBytes(4).toString('hex'), sock, name: 'Oyinchi', room: null, slot: -1, buf: Buffer.alloc(0), frag: [] };
  sock.on('data', d => {
    c.buf = Buffer.concat([c.buf, d]);
    if (c.buf.length > 4e6) return sock.destroy();
    for (;;) {
      const b = c.buf; if (b.length < 2) break;
      const fin = (b[0] & 128) !== 0, op = b[0] & 15, masked = (b[1] & 128) !== 0; let len = b[1] & 127, off = 2;
      if (len === 126) { if (b.length < 4) break; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (b.length < 10) break; len = b.readUInt32BE(6); off = 10; }
      if (masked) off += 4; if (b.length < off + len) break;
      let payload = Buffer.from(b.subarray(off, off + len));
      if (masked) { const m = b.subarray(off - 4, off); for (let i = 0; i < payload.length; i++) payload[i] ^= m[i & 3]; }
      c.buf = b.subarray(off + len);
      if (op === 8) { sock.end(); return; }
      if (op === 9) { sock.write(Buffer.concat([Buffer.from([0x8A, payload.length]), payload])); continue; }
      if (op === 10) continue;
      if (op === 1 || op === 0) {
        c.frag.push(payload);
        if (fin) { const text = Buffer.concat(c.frag).toString('utf8'); c.frag = []; onMsg(c, text); }
      }
    }
  });
  const bye = () => { if (c.closed) return; c.closed = true; leave(c); };
  sock.on('close', bye); sock.on('error', bye); sock.on('end', bye);
});
setInterval(() => { for (const r of rooms.values()) for (const c of r.clients.values()) wsPing(c.sock); }, 25000);

/* ---------- Xonalar ---------- */
const rooms = new Map();
const send = (c, o) => wsSend(c.sock, JSON.stringify(o));
function lobbyMsg(r) {
  return { t: 'lobby', code: r.code, host: r.host, started: r.started, slots: r.slots.map(s => ({ k: s.k, name: s.name || '', ready: !!s.ready, bot: s.bot | 0, cid: s.cid || '' })), n: r.clients.size };
}
function bcast(r, o, except) { const s = JSON.stringify(o); for (const c of r.clients.values()) if (c !== except) wsSend(c.sock, s); }
function freeSlot(r, i) { r.slots[i] = { k: 'free' }; }
function leave(c) {
  const r = c.room; if (!r) return; c.room = null; r.clients.delete(c.id);
  if (c.slot >= 0 && r.slots[c.slot] && r.slots[c.slot].cid === c.id) {
    if (r.started) { const h = r.clients.get(r.host); if (h) send(h, { t: 'left', slot: c.slot }); }
    freeSlot(r, c.slot);
  }
  c.slot = -1;
  if (r.clients.size === 0) { rooms.delete(r.code); return; }
  if (c.id === r.host) {
    if (r.started) { bcast(r, { t: 'hostleft' }); for (const x of r.clients.values()) x.room = null; rooms.delete(r.code); return; }
    r.host = r.clients.keys().next().value;
  }
  if (!r.started) bcast(r, lobbyMsg(r));
}
function tryStart(r) {
  if (r.started) return;
  const occ = r.slots.filter(s => s.k !== 'free'); if (occ.length < 2) return;
  if (!r.slots.every(s => s.k !== 'human' || s.ready)) return;
  if (![...r.clients.values()].some(c => c.slot >= 0)) return;
  for (const c of [...r.clients.values()]) if (c.slot < 0) { send(c, { t: 'kicked' }); r.clients.delete(c.id); c.room = null; }
  r.started = true; const seed = (Math.random() * 1e9) | 0;
  for (const c of r.clients.values()) send(c, { t: 'start', seed, you: c.slot, host: r.host, slots: r.slots.map(s => ({ k: s.k, name: s.name || '', bot: s.bot | 0 })) });
}
function onMsg(c, text) {
  let m; try { m = JSON.parse(text); } catch (e) { return; }
  if (m.t === 'join') {
    if (c.room) return;
    const code = String(m.code || '').trim().toUpperCase().replace(/[^A-Z0-9А-ЯЁ_-]/g, '').slice(0, 12);
    if (code.length < 3) return send(c, { t: 'err', e: 'code' });
    let r = rooms.get(code);
    if (r && r.started) return send(c, { t: 'err', e: 'started' });
    if (r && r.clients.size >= 4) return send(c, { t: 'err', e: 'full' });
    if (!r) { r = { code, clients: new Map(), host: c.id, started: false, slots: [0, 1, 2, 3].map(() => ({ k: 'free' })) }; rooms.set(code, r); }
    c.name = String(m.name || 'Oyinchi').slice(0, 16); c.room = r; r.clients.set(c.id, c);
    send(c, { t: 'joined', id: c.id, code }); bcast(r, lobbyMsg(r)); return;
  }
  const r = c.room; if (!r) return;
  switch (m.t) {
    case 'pick': { if (r.started) return; const i = m.slot | 0; if (i < 0 || i > 3 || r.slots[i].k !== 'free') return;
      if (c.slot >= 0) freeSlot(r, c.slot); c.slot = i; r.slots[i] = { k: 'human', cid: c.id, name: c.name, ready: false }; bcast(r, lobbyMsg(r)); break; }
    case 'unpick': { if (r.started) return; if (c.slot >= 0) freeSlot(r, c.slot); c.slot = -1; bcast(r, lobbyMsg(r)); break; }
    case 'bot': { if (r.started || c.id !== r.host) return; const i = m.slot | 0; if (i < 0 || i > 3) return;
      if (r.slots[i].k === 'free') r.slots[i] = { k: 'bot', name: 'Bot', bot: Math.max(0, Math.min(2, m.lvl | 0)) };
      else if (r.slots[i].k === 'bot') freeSlot(r, i); bcast(r, lobbyMsg(r)); tryStart(r); break; }
    case 'ready': { if (r.started || c.slot < 0) return; r.slots[c.slot].ready = !!m.v; bcast(r, lobbyMsg(r)); tryStart(r); break; }
    case 'cmd': { if (!r.started || c.slot < 0) return; const h = r.clients.get(r.host); if (h && h !== c) send(h, { t: 'cmd', slot: c.slot, c: m.c }); break; }
    case 'snap': { if (c.id !== r.host) return; const s = text; for (const x of r.clients.values()) if (x !== c) wsSend(x.sock, s); break; }
    case 'end': { if (c.id !== r.host || !r.started) return; r.started = false; for (const s of r.slots) if (s.k === 'human') s.ready = false;
      for (const s of r.slots) if (s.k === 'bot') freeSlot(r, r.slots.indexOf(s)); bcast(r, lobbyMsg(r)); break; }
    case 'leave': leave(c); break;
  }
}

server.listen(PORT, () => console.log('Xonlar jangi serveri: http://localhost:' + PORT));
