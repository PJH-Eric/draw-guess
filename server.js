/*
 * server.js — 你畫我猜的權威伺服器
 *
 * Express 負責靜態前端與 /health，Socket.IO 負責大廳、房間與對局。
 * 「誰可以做什麼」由 lib/rooms.js 判斷，「這一筆／這一猜算不算數」由
 * public/js/rules.js 判斷 —— 兩者都是伺服器說了算，用戶端送過來的只是「意圖」。
 * 答案永遠不會送給不是畫家的人：投影一律走 Rules.toPublic。
 *
 * 環境變數
 *   PORT                 監聽埠（Render 之類的平台會自動注入），預設 3030
 *   HOST                 監聽介面，預設 0.0.0.0
 *   GAME_ALLOWED_ORIGIN  允許連進來的前端來源，逗號分隔；* 代表不限制
 *   ROOM_TICK_MS         對局推進間隔（毫秒），預設 500
 */
'use strict';

const http = require('http');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const express = require('express');
const { Server } = require('socket.io');

const Rules = require('./public/js/rules.js');
const Words = require('./public/js/words.js');
const { RoomStore, sanitizeName } = require('./lib/rooms.js');

const PORT = Number(process.env.PORT || 3030);
const HOST = process.env.HOST || '0.0.0.0';
const TICK_MS = Math.max(100, Number(process.env.ROOM_TICK_MS || 500));
const STARTED_AT = Date.now();

/* 允許的前端來源：正式環境請明確設定，不要放著 * 不管 */
const ALLOWED = String(process.env.GAME_ALLOWED_ORIGIN || '*')
  .split(',').map((s) => s.trim()).filter(Boolean);
if (process.env.RENDER_EXTERNAL_URL) {
  ALLOWED.push(process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, ''));
}
const allowAll = ALLOWED.includes('*');

function originAllowed(origin) {
  if (allowAll) return true;
  if (!origin) return true;              // 同源請求不帶 Origin
  return ALLOWED.includes(origin);
}

/* ------------------------------------------------------------ HTTP */

const app = express();
app.disable('x-powered-by');

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && originAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', allowAll ? '*' : origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  setHeaders(res) { res.setHeader('Cache-Control', 'no-cache'); }
}));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'draw-guess',
    uptimeSec: Math.round((Date.now() - STARTED_AT) / 1000),
    rooms: store.size(),
    words: Words.LIST.length,
    sockets: io ? io.engine.clientsCount : 0
  });
});

app.get('/api/rooms', (_req, res) => res.json({ rooms: store.list(), total: store.size() }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin(origin, cb) { cb(null, originAllowed(origin)); },
    methods: ['GET', 'POST']
  },
  pingInterval: 20000,
  pingTimeout: 25000,
  /* 一筆最多 400 個點，留寬裕一點的上限 */
  maxHttpBufferSize: 2e5
});

/* ------------------------------------------------------------ 狀態 */

const store = new RoomStore({});

/** roomCode -> Set<socket> */
const roomSockets = new Map();
/** 停在大廳、要收房間列表推播的 socket */
const lobbySockets = new Set();

const now = () => Date.now();

function presenceSnapshot() {
  let players = 0;
  let spectators = 0;
  let rooms = 0;
  for (const [code, sockets] of roomSockets) {
    const room = store.getAny(code);
    if (!room || !sockets.size) continue;
    rooms += 1;
    for (const socket of sockets) {
      const member = room.member(socket.data.clientId);
      if (member?.role === 'player') players += 1;
      if (member?.role === 'spectator') spectators += 1;
    }
  }
  return {
    gameId: 'draw-guess',
    online: io.engine.clientsCount,
    players,
    spectators,
    lobby: lobbySockets.size,
    rooms,
    updatedAt: new Date().toISOString()
  };
}

app.get('/api/presence', (_req, res) => res.json(presenceSnapshot()));

function socketsOf(code) {
  let set = roomSockets.get(code);
  if (!set) { set = new Set(); roomSockets.set(code, set); }
  return set;
}

function attach(socket, code) {
  detach(socket);
  socket.data.roomCode = code;
  socketsOf(code).add(socket);
  lobbySockets.delete(socket);
}

function detach(socket) {
  const code = socket.data.roomCode;
  if (!code) return;
  const set = roomSockets.get(code);
  if (set) {
    set.delete(socket);
    if (!set.size) roomSockets.delete(code);
  }
  socket.data.roomCode = null;
}

/* ------------------------------------------------------------ 廣播 */

/**
 * 每個人拿到的是「自己這個角色看到的投影」，權限旗標由伺服器算好。
 * 筆畫可能很多，所以平常只送筆數；full=true（進房、換題、結算）才送整張畫布，
 * 用戶端發現筆數對不上會自己要求重新同步。
 */
function viewPayload(room, clientId, full) {
  const v = room.viewFor(clientId, now());
  if (v.game) {
    v.game.strokeCount = v.game.strokes.length;
    if (!full) delete v.game.strokes;
  }
  return v;
}

function syncRoom(room, full) {
  for (const s of socketsOf(room.code)) {
    s.emit('room:sync', viewPayload(room, s.data.clientId, !!full));
  }
}

function syncOne(socket, room, full) {
  socket.emit('room:sync', viewPayload(room, socket.data.clientId, !!full));
}

function syncLobby() {
  if (!lobbySockets.size) return;
  const payload = { rooms: store.list(), total: store.size() };
  for (const s of lobbySockets) s.emit('lobby:rooms', payload);
}

/** 猜題紀錄的增量：某人猜了什麼、猜對了誰。沒有自由聊天。 */
function broadcastFeed(room, entry) {
  for (const s of socketsOf(room.code)) s.emit('room:feed', { entry });
}

/** 新的一筆：只送增量，並附上筆數讓用戶端偵測漏收 */
function broadcastStroke(room, stroke) {
  const count = room.state ? room.state.strokes.length : 0;
  for (const s of socketsOf(room.code)) s.emit('room:stroke', { stroke, count });
}

function broadcastBoard(room, action) {
  const count = room.state ? room.state.strokes.length : 0;
  for (const s of socketsOf(room.code)) s.emit('room:board', { action, count });
}

function fail(socket, message, code) {
  socket.emit('room:error', { message: String(message || '操作失敗'), code: code || 'invalid' });
}

/** 房間被判定結束：通知在場所有人，包含只剩下的觀戰者 */
function announceClosed(room) {
  for (const s of socketsOf(room.code)) {
    s.emit('room:closed', { reason: room.closedReason || '房間已經結束。', code: room.code });
  }
  roomSockets.delete(room.code);
}

/** 有人離開或斷線後，立刻檢查房間還有沒有實體玩家 */
function enforceLifecycle(room, t) {
  if (room.closed) return true;
  if (!room.shouldClose()) return false;
  room.close(
    room.members.size > 0
      ? '房間裡已經沒有玩家了（只剩觀戰者），房間自動關閉。'
      : '房間裡已經沒有人了，房間自動關閉。',
    t
  );
  room.closedAt = t;
  announceClosed(room);
  syncLobby();
  return true;
}

/* ------------------------------------------------------------ Socket */

io.on('connection', (socket) => {
  socket.data.clientId = null;
  socket.data.name = sanitizeName('', '');
  socket.data.roomCode = null;

  socket.on('hello', (payload, ack) => {
    const p = payload || {};
    let id = String(p.clientId || '').trim();
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) id = crypto.randomBytes(12).toString('hex');
    socket.data.clientId = id;
    socket.data.name = sanitizeName(p.name, '');
    if (typeof ack === 'function') ack({ ok: true, clientId: id, name: socket.data.name, serverTime: now() });
  });

  socket.on('lobby:subscribe', () => {
    detach(socket);
    lobbySockets.add(socket);
    socket.emit('lobby:rooms', { rooms: store.list(), total: store.size() });
  });

  socket.on('lobby:unsubscribe', () => { lobbySockets.delete(socket); });

  socket.on('room:create', (payload, ack) => {
    if (!socket.data.clientId) return fail(socket, '連線還沒準備好，請重新整理頁面。', 'nosession');
    const p = payload || {};
    socket.data.name = sanitizeName(p.name, socket.data.name);
    const res = store.create(socket.data.clientId, {
      name: socket.data.name,
      roomName: p.roomName,
      private: !!p.private,
      settings: p.settings,
      now: now()
    });
    if (!res.ok) { fail(socket, res.error, res.code); if (typeof ack === 'function') ack(res); return; }
    const room = res.room;
    attach(socket, room.code);
    room.system(socket.data.name + ' 開了這間房。把房號或邀請連結傳給朋友，大家準備好就能開始。', now());
    /* 先回 ack：用戶端要先知道自己進了哪一間房，才收得下後面的投影 */
    if (typeof ack === 'function') ack({ ok: true, code: room.code });
    syncRoom(room, true);
    syncLobby();
  });

  socket.on('room:join', (payload, ack) => {
    if (!socket.data.clientId) return fail(socket, '連線還沒準備好，請重新整理頁面。', 'nosession');
    const p = payload || {};
    const room = store.get(p.code);
    if (!room) {
      const e = { ok: false, error: '找不到這個房間，可能已經關閉或房號打錯了。', code: 'gone' };
      fail(socket, e.error, e.code);
      if (typeof ack === 'function') ack(e);
      return;
    }
    socket.data.name = sanitizeName(p.name, socket.data.name);
    const res = room.join(socket.data.clientId, {
      name: socket.data.name,
      role: p.role,
      token: p.token ? String(p.token) : null,
      now: now()
    });
    if (!res.ok) { fail(socket, res.error, res.code); if (typeof ack === 'function') ack(res); return; }
    attach(socket, room.code);
    room.system(res.reconnected
      ? res.member.name + ' 重新連上線了。'
      : res.member.name + ' 加入了（' + (res.member.role === 'player' ? '玩家' : '觀戰') + '）。', now());
    if (typeof ack === 'function') {
      ack({ ok: true, code: room.code, role: res.member.role, downgraded: !!res.downgraded, reconnected: !!res.reconnected });
    }
    syncRoom(room, true);
    syncLobby();
  });

  /* 進房前先問一下這個邀請連結還有沒有效，讓前端能顯示明確原因 */
  socket.on('invite:check', (payload, ack) => {
    const p = payload || {};
    const room = store.get(p.code);
    if (!room) {
      return typeof ack === 'function' && ack({ ok: false, error: '這個邀請連結指向的房間已經不存在或已經結束了。', code: 'gone' });
    }
    const res = room.checkInvite(String(p.token || ''), now());
    if (typeof ack === 'function') {
      ack(res.ok ? { ok: true, role: res.invite.role, note: res.note || null, room: room.brief() } : res);
    }
  });

  /* --------------------------------------------------------- 房內操作 */

  function withRoom(handler) {
    return (payload, ack) => {
      const room = store.get(socket.data.roomCode);
      if (!room) return fail(socket, '你已經不在任何房間裡了。', 'gone');
      handler(room, payload || {}, ack);
    };
  }

  socket.on('room:becomePlayer', withRoom((room) => {
    const res = room.becomePlayer(socket.data.clientId);
    if (!res.ok) return fail(socket, res.error, res.code);
    const m = room.member(socket.data.clientId);
    room.system(m.name + ' 從觀戰改成下場一起玩。', now());
    syncRoom(room); syncLobby();
  }));

  socket.on('room:becomeSpectator', withRoom((room) => {
    const res = room.becomeSpectator(socket.data.clientId);
    if (!res.ok) return fail(socket, res.error, res.code);
    syncRoom(room);
    if (enforceLifecycle(room, now())) return;
    syncLobby();
  }));

  socket.on('room:ready', withRoom((room, p) => {
    const res = room.setReady(socket.data.clientId, !!p.ready);
    if (!res.ok) return fail(socket, res.error, res.code);
    syncRoom(room); syncLobby();
  }));

  socket.on('room:settings', withRoom((room, p) => {
    const res = room.setSettings(socket.data.clientId, p);
    if (!res.ok) return fail(socket, res.error, res.code);
    room.system('房主調整了規則：每人畫 ' + res.settings.rounds + ' 次、每題 ' + res.settings.drawSec + ' 秒。', now());
    syncRoom(room); syncLobby();
  }));

  socket.on('room:start', withRoom((room) => {
    const res = room.start(socket.data.clientId, now());
    if (!res.ok) return fail(socket, res.error, res.code);
    syncRoom(room, true); syncLobby();
  }));

  socket.on('room:pick', withRoom((room, p) => {
    const res = room.pickWord(socket.data.clientId, String(p.wordId || ''), now());
    if (!res.ok) return fail(socket, res.error, res.code);
    syncRoom(room, true);
  }));

  socket.on('room:stroke', withRoom((room, p) => {
    const res = room.stroke(socket.data.clientId, p.stroke, now());
    if (!res.ok) return fail(socket, res.error, res.code);
    broadcastStroke(room, res.stroke);
  }));

  socket.on('room:undo', withRoom((room) => {
    const res = room.undo(socket.data.clientId);
    if (!res.ok) return fail(socket, res.error, res.code);
    broadcastBoard(room, 'undo');
  }));

  socket.on('room:clear', withRoom((room) => {
    const res = room.clearBoard(socket.data.clientId);
    if (!res.ok) return fail(socket, res.error, res.code);
    broadcastBoard(room, 'clear');
  }));

  socket.on('room:hint', withRoom((room) => {
    const res = room.giveHint(socket.data.clientId, now());
    if (!res.ok) return fail(socket, res.error, res.code);
    syncRoom(room, true);
  }));

  socket.on('room:skip', withRoom((room) => {
    const res = room.skipTurn(socket.data.clientId, now());
    if (!res.ok) return fail(socket, res.error, res.code);
    syncRoom(room, true); syncLobby();
  }));

  /* 整張畫布重新要一次（用戶端發現筆數對不上時） */
  socket.on('room:resync', withRoom((room) => { syncOne(socket, room, true); }));

  /* 唯一的文字輸入就是猜答案；沒有聊天室，所以畫家與觀戰者沒有地方打字。 */
  socket.on('room:guess', withRoom((room, p) => {
    const res = room.guess(socket.data.clientId, p.text, now());
    if (!res.ok) {
      /* 被擋下的原因只回給本人，不廣播 */
      socket.emit('room:private', { kind: 'rejected', message: res.error, code: res.code });
      return;
    }
    if (res.kind === 'miss') {
      socket.emit('room:private', { kind: 'miss' });
      return broadcastFeed(room, res.entry);
    }
    if (res.kind === 'close') {
      socket.emit('room:private', { kind: 'close', message: '「' + res.text + '」很接近了，再想一下！' });
      return;
    }
    if (res.kind === 'hit') {
      socket.emit('room:private', { kind: 'hit', message: '猜對了！+' + res.points + ' 分（第 ' + res.order + ' 個）', points: res.points });
      syncRoom(room);
      if (res.allDone) syncRoom(room, true);
    }
  }));

  socket.on('room:rematch', withRoom((room) => {
    const res = room.voteRematch(socket.data.clientId, now());
    if (!res.ok) return fail(socket, res.error, res.code);
    const m = room.member(socket.data.clientId);
    room.system(res.started
      ? '大家都同意，新的一局開始了！'
      : m.name + ' 想再來一局（' + res.votes + '/' + res.need + '）。', now());
    syncRoom(room, true); syncLobby();
  }));

  socket.on('room:invite', withRoom((room, p, ack) => {
    const res = room.createInvite(socket.data.clientId, {
      role: p.role, ttlMs: Number(p.ttlMinutes) * 60000, maxUses: p.maxUses, now: now()
    });
    if (!res.ok) { fail(socket, res.error, res.code); return typeof ack === 'function' && ack(res); }
    syncRoom(room);
    if (typeof ack === 'function') {
      ack({ ok: true, token: res.invite.token, role: res.invite.role, expiresAt: res.invite.expiresAt, maxUses: res.invite.maxUses });
    }
  }));

  socket.on('room:revokeInvite', withRoom((room, p) => {
    const res = room.revokeInvite(socket.data.clientId, String(p.token || ''));
    if (!res.ok) return fail(socket, res.error, res.code);
    syncRoom(room);
  }));

  socket.on('room:leave', withRoom((room) => {
    const t = now();
    const res = room.leave(socket.data.clientId, t);
    detach(socket);
    socket.emit('room:left', { ok: true });
    if (res.ok) room.system(res.name + ' 離開了房間。', t);
    if (enforceLifecycle(room, t)) return;
    syncRoom(room, true);
    syncLobby();
  }));

  socket.on('disconnect', () => {
    lobbySockets.delete(socket);
    const room = store.getAny(socket.data.roomCode);
    detach(socket);
    if (!room || room.closed) return;
    const member = room.member(socket.data.clientId);
    if (!member) return;
    /* 先標記斷線並保留座位，讓重新整理的人可以憑 clientId 回到原位；
       超過保留時間還沒回來，定時工作才會把他踢掉並檢查房間要不要關。 */
    room.disconnect(socket.data.clientId, now());
    room.system(member.name + ' 斷線了，座位會先保留一分鐘。', now());
    syncRoom(room);
    syncLobby();
  });
});

/* ------------------------------------------------------------ 定時工作 */

setInterval(() => {
  const t = now();
  const res = store.sweep(t);

  for (const item of res.ticked) {
    for (const st of item.strokes) broadcastStroke(item.room, st);
    for (const entry of item.feed) broadcastFeed(item.room, entry);
    const bigChange = item.events.some((e) =>
      e.type === 'turnstart' || e.type === 'turnend' || e.type === 'autopick' || e.type === 'aipick' || e.type === 'gameover');
    if (item.events.length) syncRoom(item.room, bigChange);
  }
  for (const room of res.changed) {
    if (!room.closed) syncRoom(room, true);
  }
  for (const room of res.closed) announceClosed(room);
  for (const room of res.forget) roomSockets.delete(room.code);

  if (res.changed.length || res.closed.length || res.ticked.length) syncLobby();
}, TICK_MS);

/* ------------------------------------------------------------ 啟動 */

function lanAddresses() {
  const out = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    }
  }
  return out;
}

function shutdown(signal) {
  console.log('\n收到 ' + signal + '，正在關閉伺服器…');
  io.close(() => {
    server.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log('========================================');
    console.log('  你畫我猜 伺服器已啟動');
    console.log('========================================');
    console.log('  本機：      http://localhost:' + PORT);
    for (const ip of lanAddresses()) {
      console.log('  同網段：    http://' + ip + ':' + PORT + '   ← 另一台電腦用這個');
    }
    console.log('  健康檢查：  http://localhost:' + PORT + '/health');
    console.log('  允許來源：  ' + (allowAll ? '不限制（* — 正式環境請設定 GAME_ALLOWED_ORIGIN）' : ALLOWED.join(', ')));
    console.log('  題庫：      ' + Words.LIST.length + ' 題，' + Object.keys(Words.CATEGORIES).length + ' 個分類');
    console.log('----------------------------------------');
  });
}

module.exports = { app, server, io, store };
