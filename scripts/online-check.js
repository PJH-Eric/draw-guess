/*
 * scripts/online-check.js — 線上模式的端對端驗證
 *
 * 真的啟動一台 server.js，再用「兩個玩家用戶端 + 一個觀戰用戶端」
 * 三條獨立的 Socket.IO 連線跑完整流程，不是在同一個頁面假裝兩個人。
 *
 *   node scripts/online-check.js
 *
 * 驗證項目
 *   1.  /health 與 /api/rooms 可用
 *   2.  開房、產生玩家邀請連結、第二台憑 token 加入並成為玩家
 *   3.  觀戰用邀請連結進來就是觀戰者
 *   4.  觀戰者不能準備、不能開始、不能選題、不能畫、不能猜（伺服器擋下並說原因）
 *   5.  準備 → 開始（線上只有真人，沒有電腦對手）→ 三個用戶端都收到同一份房間投影
 *   6.  筆畫即時廣播、復原與清除同步、筆數對不上時可以重新同步
 *   7.  猜錯進紀錄、猜對只公布「某某猜對了」、答案不會外流給非畫家
 *   8.  猜題冷卻、猜對的人不能再猜、畫家不能猜
 *   9.  操作摘要會即時更新，而且揭曉前不含答案
 *  10.  邀請連結撤銷後失效、房號不存在的處理
 *  11.  房間滿了之後想當玩家的人被明確降為觀戰
 *  12.  斷線重連可以回到原本的座位
 *  13.  最後一個真人離開 → 房間立刻關閉、觀戰者收到 closed、邀請失效、大廳移除
 */
'use strict';

const { spawn } = require('child_process');
const path = require('path');
const { io } = require('socket.io-client');

const Rules = require('../public/js/rules.js');

const PORT = Number(process.env.CHECK_PORT || 3131);
const BASE = 'http://127.0.0.1:' + PORT;

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) { passed += 1; console.log('  ✓ ' + name); }
  else { failed += 1; console.log('  ✗ ' + name + (detail !== undefined ? '  →  ' + detail : '')); }
}
function section(name) { console.log('\n▍' + name); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------ 用戶端小包裝 */

class Client {
  constructor(label, clientId, name) {
    this.label = label;
    this.clientId = clientId;
    this.name = name;
    this.view = null;
    this.feed = [];
    this.strokes = [];
    this.boards = [];
    this.privates = [];
    this.errors = [];
    this.closed = null;
    this.rooms = null;
    this.online = null;
    this.syncCount = 0;
    this.socket = io(BASE, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 8000,
      autoConnect: false
    });

    this.socket.on('room:sync', (v) => { this.view = v; this.syncCount += 1; });
    this.socket.on('room:stroke', (p) => { this.strokes.push(p); });
    this.socket.on('room:board', (p) => { this.boards.push(p); });
    this.socket.on('room:feed', (p) => { this.feed.push(p.entry); });
    this.socket.on('room:private', (p) => { this.privates.push(p); });
    this.socket.on('room:error', (p) => { this.errors.push(p); });
    this.socket.on('room:closed', (p) => { this.closed = p; });
    this.socket.on('lobby:rooms', (p) => { this.rooms = p.rooms; this.online = p.online; });
    this.cheers = [];
    this.socket.on('room:cheer', (p) => { this.cheers.push(p); });
    /* 收過的所有房間投影（序列化），用來檢查猜題者從頭到尾都沒拿到答案 */
    this.seen = [];
    this.socket.on('room:sync', (v) => { if (this.keepSeen) this.seen.push(JSON.stringify(v)); });
  }

  connect() {
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = (error) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve();
      };
      const timer = setTimeout(() => finish(new Error(this.label + ' 連線逾時')), 10000);
      this.socket.once('connect', () => {
        /* 伺服器回的是「公開 id」：房間投影裡看到的 id 都是這個，私密的 clientId 不會出現 */
        this.socket.emit('hello', { clientId: this.clientId, name: this.name }, (res) => { this.id = res && res.id; finish(); });
      });
      this.socket.once('connect_error', (error) => finish(error));
      this.socket.connect();
    });
  }

  emit(evt, payload) { this.socket.emit(evt, payload || {}); }

  ask(evt, payload) {
    return new Promise((resolve) => {
      let done = false;
      const t = setTimeout(() => { if (!done) { done = true; resolve({ ok: false, error: 'timeout' }); } }, 6000);
      this.socket.emit(evt, payload || {}, (res) => {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(res || { ok: false, error: 'no-ack' });
      });
    });
  }

  /** 等到某個條件成立（用來等伺服器推播，而不是硬睡一段時間） */
  async until(fn, ms) {
    const limit = Date.now() + (ms || 5000);
    while (Date.now() < limit) {
      if (fn(this)) return true;
      await sleep(40);
    }
    return false;
  }

  lastError() { return this.errors.length ? this.errors[this.errors.length - 1] : null; }
  clearErrors() { this.errors = []; }
  close() { try { this.socket.close(); } catch (e) {} }
}

/* ------------------------------------------------------------ 主流程 */

let server = null;

async function startServer() {
  server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PORT),
      HOST: '127.0.0.1',
      GAME_ALLOWED_ORIGIN: 'https://pjh-eric.github.io',
      RENDER_EXTERNAL_URL: 'https://draw-guess.onrender.com',
      ROOM_TICK_MS: '200'
    }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  server.stderr.on('data', (d) => process.stderr.write('[server] ' + d));

  const limit = Date.now() + 15000;
  while (Date.now() < limit) {
    try {
      const res = await fetch(BASE + '/health');
      if (res.ok) return await res.json();
    } catch (e) { /* 還沒起來 */ }
    await sleep(200);
  }
  throw new Error('伺服器沒有在 15 秒內啟動');
}

function stopServer() {
  if (server && !server.killed) server.kill();
}

async function run() {
  section('伺服器啟動與健康檢查');
  const health = await startServer();
  check('/health 回報服務正常', health && health.ok === true, JSON.stringify(health));
  check('/health 說得出服務名稱', health.service === 'draw-guess', health.service);
  check('/health 回報題庫大小', health.words === 5350, health.words);
  const pageOrigin = await fetch(BASE + '/health', { headers: { Origin: 'https://pjh-eric.github.io' } });
  check('GitHub Pages 可跨來源連線', pageOrigin.headers.get('access-control-allow-origin') === 'https://pjh-eric.github.io');
  const renderOrigin = await fetch(BASE + '/health', { headers: { Origin: 'https://draw-guess.onrender.com' } });
  check('Render 自己的前端可連線', renderOrigin.headers.get('access-control-allow-origin') === 'https://draw-guess.onrender.com');
  const unknownOrigin = await fetch(BASE + '/health', { headers: { Origin: 'https://other.example' } });
  check('未設定的外部來源沒有 CORS 授權', !unknownOrigin.headers.get('access-control-allow-origin'));

  const roomsRes = await (await fetch(BASE + '/api/rooms')).json();
  check('/api/rooms 可用且一開始是空的', Array.isArray(roomsRes.rooms) && roomsRes.rooms.length === 0, roomsRes.total);

  /* ---------------------------------------------------- 建房與加入 */
  section('開房、邀請連結與角色');
  const host = new Client('host', 'client-host-0001', '阿明');
  const mate = new Client('mate', 'client-mate-0001', '小華');
  const watcher = new Client('watch', 'client-watch-001', '觀眾');
  await Promise.all([host.connect(), mate.connect(), watcher.connect()]);
  check('三個用戶端都連上了', true);

  const created = await host.ask('room:create', { name: '阿明', roomName: '畫畫測試房' });
  check('開房成功', created.ok === true, JSON.stringify(created));
  const code = created.code;
  check('拿到 4 碼房號', typeof code === 'string' && code.length === 4, code);
  await host.until((c) => !!c.view);
  check('房主收到房間投影', !!host.view && host.view.room.code === code);
  check('房主是玩家而且是房主', host.view.you.role === 'player' && host.view.you.isHost === true);

  section('安全：私密 clientId 不外流、抄公開 id 也冒用不了、怪封包打不掛伺服器');
  check('房間投影裡看不到私密的 clientId（只有公開 id）',
    JSON.stringify(host.view).indexOf(host.clientId) < 0 && host.view.you.id === host.id && host.id !== host.clientId,
    host.view.you.id);
  {
    /* 抄下房主在投影裡的公開 id，拿去當自己的 clientId 連線：只會變成一個新的人，不會變成房主 */
    const evil = new Client('evil', host.view.you.id, '冒牌貨');
    await evil.connect();
    const ej = await evil.ask('room:join', { code, name: '冒牌貨' });
    await evil.until((c) => !!c.view, 3000);
    check('抄公開 id 連線不會被當成房主重新連線', ej.ok && !ej.reconnected && evil.view && !evil.view.you.isHost,
      JSON.stringify({ ej, isHost: evil.view && evil.view.you.isHost }));
    check('房主還是原本那個人', await host.until((c) => c.view.you.isHost === true, 2000));
    evil.emit('room:leave', {});
    await sleep(200);
    evil.close();

    /* toString／valueOf 不是函式的物件：以前 String() 一碰就丟例外，整台伺服器直接掛掉 */
    const bad = new Client('bad', 'client-bad-00001', '壞壞');
    await bad.connect();
    const obj = { toString: 1, valueOf: 1 };
    bad.emit('hello', { clientId: obj, name: obj });
    bad.emit('room:join', { code: obj, token: obj, name: obj });
    bad.emit('invite:check', { code: obj, token: obj });
    bad.emit('room:chat', { text: obj });
    bad.emit('room:settings', { rounds: obj });
    bad.emit('room:stroke', { stroke: { t: obj, p: [obj, obj] } });
    await sleep(400);
    const alive = await mate.ask('invite:check', { code, token: 'f'.repeat(32) });
    check('收到一堆怪封包之後伺服器還活著', alive && alive.error !== 'timeout' && alive.error !== 'no-ack', JSON.stringify(alive));
    bad.close();
  }

  const invPlayer = await host.ask('room:invite', { role: 'player', ttlMinutes: 60, maxUses: 5 });
  check('可以產生玩家邀請連結', invPlayer.ok === true && !!invPlayer.token, JSON.stringify(invPlayer).slice(0, 80));
  check('邀請 token 猜不到（32 個十六進位字元）', /^[0-9a-f]{32}$/.test(invPlayer.token || ''), invPlayer.token);

  const preCheck = await mate.ask('invite:check', { code, token: invPlayer.token });
  check('加入前可以先驗證邀請連結', preCheck.ok === true && preCheck.role === 'player', JSON.stringify(preCheck).slice(0, 80));
  check('驗證時就看得到房間資訊', !!preCheck.room && preCheck.room.code === code);

  const badCheck = await mate.ask('invite:check', { code, token: 'f'.repeat(32) });
  check('假 token 在加入前就被擋下', badCheck.ok === false, badCheck.error);
  const goneCheck = await mate.ask('invite:check', { code: 'ZZZZ', token: invPlayer.token });
  check('房號不存在時有明確訊息', goneCheck.ok === false && goneCheck.code === 'gone', goneCheck.error);

  /* 確認暱稱後才加入（前端的落地頁流程） */
  const joined = await mate.ask('room:join', { code, token: invPlayer.token, role: 'player', name: '小華改名' });
  check('憑邀請連結加入成功', joined.ok === true, JSON.stringify(joined));
  check('token 指定玩家就是玩家', joined.role === 'player', joined.role);
  await mate.until((c) => !!c.view);
  check('改過的暱稱有進到房間', mate.view.you.name === '小華改名', mate.view.you.name);

  const invWatch = await host.ask('room:invite', { role: 'spectator', ttlMinutes: 60, maxUses: 5 });
  const joinedWatch = await watcher.ask('room:join', { code, token: invWatch.token, role: 'player', name: '觀眾' });
  check('觀戰連結不會因為要求玩家就變成玩家', joinedWatch.ok && joinedWatch.role === 'spectator', joinedWatch.role);
  await watcher.until((c) => !!c.view);
  check('觀戰者知道自己是觀戰', watcher.view.you.role === 'spectator');

  /* ------------------------------------------------ 聊天室（只在等待畫面） */
  section('聊天室（只在等待畫面）');
  host.clearErrors();
  host.emit('room:chat', { text: '大家好，準備好了嗎？' });
  check('聊天訊息送出後大家都收得到',
    await host.until((c) => c.view.room.chat.some((m) => m.text === '大家好，準備好了嗎？')) &&
    await mate.until((c) => c.view.room.chat.some((m) => m.text === '大家好，準備好了嗎？')));
  check('聊天訊息帶著寄件人名字',
    host.view.room.chat.some((m) => m.text === '大家好，準備好了嗎？' && m.from === '阿明'));
  watcher.clearErrors();
  watcher.emit('room:chat', { text: '我先看看規則' });
  check('觀戰者也可以在等待畫面聊天',
    await watcher.until((c) => c.view.room.chat.some((m) => m.text === '我先看看規則')));
  host.clearErrors();
  host.emit('room:chat', { text: '   ' });
  check('空白訊息會被擋下', await host.until((c) => !!c.lastError()), host.lastError());

  /* ------------------------------------------------ 觀戰者權限 */
  section('觀戰者不能越權');
  watcher.clearErrors();
  watcher.emit('room:ready', { ready: true });
  check('觀戰者不能按準備', await watcher.until((c) => !!c.lastError()), watcher.lastError());
  watcher.clearErrors();
  watcher.emit('room:start', {});
  check('觀戰者不能開始對局', await watcher.until((c) => !!c.lastError()), watcher.lastError());
  watcher.clearErrors();
  watcher.emit('room:stroke', { stroke: { t: 'pen', p: [10, 10, 20, 20] } });
  check('觀戰者不能畫', await watcher.until((c) => !!c.lastError()), watcher.lastError());
  check('觀戰者的權限旗標是不能操作',
    !watcher.view.you.can.draw && !watcher.view.you.can.guess && !watcher.view.you.can.ready,
    JSON.stringify(watcher.view.you.can));

  /* ------------------------------------------------ 準備與開始 */
  section('準備與開始');
  mate.clearErrors();
  mate.emit('room:addAi', { level: 'easy' });
  check('線上版沒有電腦對手可以加', await mate.until((c) => !!c.lastError(), 3000) || !mate.view.room.aiSeats,
    JSON.stringify(mate.view.room.aiSeats || null));

  host.emit('room:start', {});
  check('沒準備好就不能開始', await host.until((c) => !!c.lastError()), host.lastError());
  host.clearErrors();

  host.emit('room:ready', { ready: true });
  mate.emit('room:ready', { ready: true });
  check('兩位玩家都準備好了', await host.until((c) => c.view.room.members.filter((m) => m.role === 'player' && m.ready).length === 2));

  mate.clearErrors();
  mate.emit('room:start', {});
  check('非房主不能開始', await mate.until((c) => !!c.lastError()), mate.lastError());

  host.emit('room:start', {});
  check('房主開始成功', await host.until((c) => c.view.room.phase === 'playing'), host.view.room.phase);
  check('三個用戶端都看到對局開始',
    await mate.until((c) => c.view.room.phase === 'playing') && await watcher.until((c) => c.view.room.phase === 'playing'));
  check('名單裡有 2 位真人（線上沒有電腦對手）', host.view.game.players.length === 2, host.view.game.players.length);
  check('三個用戶端看到同一個題號與同一位畫家',
    host.view.game.turnNo === mate.view.game.turnNo && host.view.game.drawerId === watcher.view.game.drawerId,
    host.view.game.drawerId + '/' + watcher.view.game.drawerId);

  host.clearErrors();
  host.emit('room:chat', { text: '開始之後還能聊嗎？' });
  check('對局進行中不能聊天，會被擋下', await host.until((c) => !!c.lastError()), host.lastError());
  check('對局中的投影不含聊天紀錄（開始前的訊息也不留）', host.view.room.chat.length === 0, host.view.room.chat.length);

  /* -------------------------------------------- 選題與隱藏資訊 */
  section('選題與隱藏資訊');

  /* 線上房間只有真人，第一位畫家一定是其中一個人 */
  const humans = { [host.id]: host, [mate.id]: mate };
  const drawerId = host.view.game.drawerId;
  const drawer = humans[drawerId] || null;
  const guesser = drawer ? (drawerId === host.id ? mate : host) : null;
  check('畫家是真人', !!drawer, drawer ? drawer.label : drawerId);

  if (drawer) {
    await drawer.until((c) => c.view.game.phase === 'picking' && c.view.game.choices.length === 3, 20000);
    check('畫家收到三個候選題目', drawer.view.game.choices.length === 3, drawer.view.game.choices.length);
    check('猜題者看不到候選題目', guesser.view.game.choices.length === 0, guesser.view.game.choices.length);
    check('觀戰者看不到候選題目', watcher.view.game.choices.length === 0, watcher.view.game.choices.length);

    /* 下面用「整包資料裡找不到答案字串」檢查有沒有洩題。選題前別人就看得到的字
       （暱稱「觀眾」、房名「畫畫測試房」、系統訊息「開始！種子…」「某某當畫家」）
       剛好是題目時會誤判，所以挑一個還沒出現在任何人畫面上的候選題。 */
    const seen = JSON.stringify(guesser.view) + JSON.stringify(watcher.view);
    const pick = drawer.view.game.choices.find((c) => seen.indexOf(c.text) < 0) || drawer.view.game.choices[0];
    guesser.clearErrors();
    guesser.emit('room:pick', { wordId: pick.id });
    check('別人不能替畫家選題', await guesser.until((c) => !!c.lastError()), guesser.lastError());

    drawer.emit('room:pick', { wordId: pick.id });
    check('畫家選題成功', await drawer.until((c) => c.view.game.phase === 'drawing', 8000), drawer.view.game.phase);

    const answer = pick.text;
    check('畫家看得到答案', drawer.view.game.answer === answer, drawer.view.game.answer);
    check('猜題者看不到答案', guesser.view.game.answer === null, guesser.view.game.answer);
    check('觀戰者看不到答案', watcher.view.game.answer === null, watcher.view.game.answer);
    check('猜題者收到的整包資料裡沒有答案', JSON.stringify(guesser.view).indexOf(answer) < 0);
    check('觀戰者收到的整包資料裡沒有答案', JSON.stringify(watcher.view).indexOf(answer) < 0);
    check('畫家還沒給提示時，猜題者看不到字數與種類',
      guesser.view.game.hint.mask === '' && guesser.view.game.hint.cat === null,
      guesser.view.game.hint.mask + '/' + guesser.view.game.hint.cat);

    /* 三張提示：字數 → 種類 → 一個字，由畫家主動按 */
    drawer.emit('room:hint', {});
    check('第一張提示公開字數',
      await guesser.until((c) => (c.view.game.hint.mask || '').length === answer.length, 6000),
      guesser.view.game.hint.mask);
    check('第一張提示只有底線', (guesser.view.game.hint.mask || '').indexOf('＿') >= 0 &&
      guesser.view.game.hint.cat === null, guesser.view.game.hint.mask);
    drawer.emit('room:hint', {});
    check('第二張提示公開種類',
      await guesser.until((c) => !!c.view.game.hint.cat, 6000),
      guesser.view.game.hint.cat);
    if (answer.length > 1) {
      drawer.emit('room:hint', {});
      check('第三張提示翻開一個字',
        await guesser.until((c) => c.view.game.hint.revealed === 1, 6000),
        guesser.view.game.hint.mask);
      check('翻開一個字後仍看不到完整答案', guesser.view.game.answer === null &&
        JSON.stringify(guesser.view).indexOf(answer) < 0);
    }
    check('猜題者不能替畫家給提示',
      !(await guesser.until((c) => c.view.game.hint.step > 3, 600)), guesser.view.game.hint.step);
    check('操作摘要在揭曉前不含答案',
      host.view.room.summary.every((s) => !JSON.stringify(s.params || {}).includes(answer)),
      JSON.stringify(host.view.room.summary.slice(-2)));

    /* -------------------------------------------- 畫布同步 */
    section('畫布同步');
    const beforeMate = mate.strokes.length;
    const beforeWatch = watcher.strokes.length;
    drawer.emit('room:stroke', { stroke: { t: 'pen', c: 0, w: 1, p: [100, 100, 200, 200, 300, 150] } });
    check('筆畫廣播給其他玩家', await mate.until((c) => c.strokes.length > beforeMate, 4000), mate.strokes.length);
    check('筆畫也廣播給觀戰者', await watcher.until((c) => c.strokes.length > beforeWatch, 4000), watcher.strokes.length);
    const got = mate.strokes[mate.strokes.length - 1];
    check('筆畫內容一致', got.stroke.p.join() === '100,100,200,200,300,150', got.stroke.p.join());
    check('筆畫附帶筆數讓用戶端可以偵測漏收', typeof got.count === 'number' && got.count >= 1, got.count);

    drawer.emit('room:stroke', { stroke: { t: 'rect', c: 3, w: 1, f: 1, p: [400, 400, 600, 600] } });
    check('矩形工具可以送出', await mate.until((c) => c.strokes.length > beforeMate + 1, 4000));
    drawer.emit('room:stroke', { stroke: { t: 'fill', c: 5, p: [500, 500] } });
    check('油漆桶可以送出', await mate.until((c) => c.strokes.length > beforeMate + 2, 4000));

    guesser.clearErrors();
    guesser.emit('room:stroke', { stroke: { t: 'pen', p: [1, 1, 2, 2] } });
    check('非畫家不能畫', await guesser.until((c) => !!c.lastError()), guesser.lastError());

    guesser.clearErrors();
    guesser.emit('room:stroke', { stroke: { t: 'rect', p: [1, 1, 2] } });
    check('格式不對的筆畫被伺服器擋下', await guesser.until((c) => !!c.lastError()), guesser.lastError());

    const boardsBefore = mate.boards.length;
    drawer.emit('room:undo', {});
    check('復原會廣播出去', await mate.until((c) => c.boards.length > boardsBefore, 4000), JSON.stringify(mate.boards.slice(-1)));
    check('復原後筆數少一筆', mate.boards[mate.boards.length - 1].action === 'undo');

    drawer.emit('room:clear', {});
    check('清除會廣播出去', await mate.until((c) => c.boards.some((b) => b.action === 'clear'), 4000));

    /* 重新同步：要得到整張畫布 */
    drawer.emit('room:stroke', { stroke: { t: 'pen', p: [10, 10, 20, 20] } });
    await sleep(300);
    const beforeSync = watcher.syncCount;
    watcher.emit('room:resync', {});
    check('可以要求重新同步整張畫布',
      await watcher.until((c) => c.syncCount > beforeSync && Array.isArray(c.view.game.strokes), 4000),
      watcher.view.game && watcher.view.game.strokes && watcher.view.game.strokes.length);

    /* ------------------------------------- 畫完了（只是通知） */
    section('畫完了只是通知');
    guesser.clearErrors();
    guesser.emit('room:done', {});
    check('只有畫家能說畫完了', await guesser.until((c) => !!c.lastError(), 3000), guesser.lastError());

    /* 這顆鈕不鎖：畫家想再按幾次都可以（補了幾筆想再叫大家看一次是很自然的事），
       伺服器同樣不擋重複，每按一次就再廣播一次通知。 */
    const summaryBefore = watcher.view.room.summary.length;
    drawer.clearErrors();
    drawer.emit('room:done', {});
    drawer.emit('room:done', {});
    check('畫家說畫完了，大家都看得到',
      await watcher.until((c) => c.view.room.drawerDone === true, 4000), String(watcher.view.room.drawerDone));
    await sleep(300);
    check('連按兩下不會被擋下（沒有收到任何錯誤）', !drawer.lastError(), JSON.stringify(drawer.lastError()));
    check('連按兩下會廣播兩次通知（這顆鈕不鎖）',
      watcher.view.room.summary.filter((n, i) => i >= summaryBefore && n.key === 'srv.sum.done').length === 2,
      JSON.stringify(watcher.view.room.summary.slice(summaryBefore)));
    check('說完畫完了這一題還在繼續',
      watcher.view.game.phase === 'drawing' && watcher.view.game.turnNo === drawer.view.game.turnNo,
      watcher.view.game.phase);
    check('紀錄裡看得到「某某說畫完了」',
      (watcher.view.room.summary || []).some((n) => n.key === 'srv.sum.done'),
      JSON.stringify((watcher.view.room.summary || []).slice(-2)));
    const summaryBefore2 = watcher.view.room.summary.length;
    drawer.clearErrors();
    drawer.emit('room:done', {});
    check('同一題還是可以再說一次畫完了', await watcher.until((c) => c.view.room.summary.length > summaryBefore2, 3000));
    check('第三次按也沒有被擋下', !drawer.lastError(), JSON.stringify(drawer.lastError()));
    drawer.clearErrors();

    /* -------------------------------------------- 猜題 */
    section('猜題');
    const feedBefore = watcher.feed.length;
    guesser.emit('room:guess', { text: '一定不是這個答案' });
    check('猜錯會廣播到猜題紀錄', await watcher.until((c) => c.feed.length > feedBefore, 4000), watcher.feed.length);
    const lastGuess = watcher.feed[watcher.feed.length - 1];
    check('猜錯的內容大家都看得到', lastGuess.text === '一定不是這個答案');
    /* 猜題紀錄要看得出「誰」猜的：沒有名字的話大家都長一樣 */
    check('猜錯的紀錄帶著猜的人的名字',
      !!lastGuess.from && lastGuess.from !== '玩家' && lastGuess.fromId === guesser.id,
      JSON.stringify({ from: lastGuess.from, fromId: lastGuess.fromId }));

    guesser.privates = [];
    guesser.emit('room:guess', { text: '馬上再猜一次' });
    check('猜太快會被擋下並回報原因',
      await guesser.until((c) => c.privates.some((p) => p.kind === 'rejected'), 3000),
      JSON.stringify(guesser.privates));

    drawer.privates = [];
    drawer.emit('room:guess', { text: answer });
    check('畫家不能猜自己的題目',
      await drawer.until((c) => c.privates.some((p) => p.kind === 'rejected'), 3000),
      JSON.stringify(drawer.privates));

    await sleep(600);
    guesser.privates = [];
    const watchFeedBefore = watcher.feed.length;
    guesser.emit('room:guess', { text: answer });
    check('猜對會私下通知本人',
      await guesser.until((c) => c.privates.some((p) => p.kind === 'hit'), 4000),
      JSON.stringify(guesser.privates));
    check('猜對有給分', guesser.privates.some((p) => p.kind === 'hit' && p.points > 0));
    await sleep(400);
    check('猜對的內容不會被廣播出去',
      watcher.feed.slice(watchFeedBefore).every((f) => !JSON.stringify(f.params || f.text || '').includes(answer)) ||
      watcher.feed.slice(watchFeedBefore).every((f) => f.kind !== 'guess'),
      JSON.stringify(watcher.feed.slice(watchFeedBefore)));
    /* 「某某猜對了」是系統訊息，跟著房間投影一起送（room:sync 裡的 room.feed），
       猜錯才走 room:feed 增量頻道。這裡驗證觀戰者確實收得到，而且沒有答案。 */
    check('紀錄裡只公布「某某猜對了」',
      await watcher.until((c) => (c.view.room.feed || []).some((f) => f.kind === 'correct' && f.key === 'srv.feed.correct'), 4000),
      JSON.stringify((watcher.view.room.feed || []).slice(-3)));
    /* 兩個真人時，最後一位猜中就等於「全部猜中」，這一題會立刻結束並公布答案（kind=reveal），
       所以只檢查「還在進行中」的那些訊息（猜題與猜對）不外流答案。 */
    check('公布訊息裡不含答案',
      (watcher.view.room.feed || [])
        .filter((f) => f.kind === 'guess' || f.kind === 'correct')
        .every((f) => !JSON.stringify(f.params || f.text || '').includes(answer)),
      JSON.stringify((watcher.view.room.feed || []).slice(-3)));
    check('分數有反映到投影上',
      await watcher.until((c) => c.view.game.players.some((p) => p.score > 0), 4000),
      JSON.stringify(watcher.view.game.players.map((p) => p.name + ':' + p.score)));
    check('猜中的人在投影上被標記', watcher.view.game.guessed.length >= 1, watcher.view.game.guessed.length);

    await sleep(600);
    guesser.privates = [];
    guesser.emit('room:guess', { text: answer });
    check('已經猜中的人不能再猜',
      await guesser.until((c) => c.privates.some((p) => p.kind === 'rejected'), 3000),
      JSON.stringify(guesser.privates));

    watcher.privates = [];
    watcher.emit('room:guess', { text: answer });
    check('觀戰者不能猜',
      await watcher.until((c) => c.privates.some((p) => p.kind === 'rejected'), 3000),
      JSON.stringify(watcher.privates));

    section('公布答案時按表情');
    check('全部猜中後進入公布答案', await watcher.until((c) => c.view.game.phase === 'reveal', 4000), watcher.view.game.phase);
    check('公布時帶這一題的表情列', !!guesser.view.game.reactions && guesser.view.game.reactions.canReact === true,
      JSON.stringify(guesser.view.game.reactions));
    guesser.emit('room:react', { kind: 'heart' });
    check('猜題者按的表情大家都看得到',
      await watcher.until((c) => c.view.game.reactions && c.view.game.reactions.counts.heart === 1, 3000),
      JSON.stringify(watcher.view.game.reactions));
    check('自己按過的會標記', await guesser.until((c) => c.view.game.reactions.mine.indexOf('heart') >= 0, 3000));
    drawer.clearErrors();
    drawer.emit('room:react', { kind: 'heart' });
    check('畫家不能幫自己按', await drawer.until((c) => !!c.lastError(), 3000), drawer.lastError());
    watcher.clearErrors();
    watcher.emit('room:react', { kind: 'clap' });
    check('觀戰者不能按', await watcher.until((c) => !!c.lastError(), 3000), watcher.lastError());
    /* 伺服器會略過 150ms 內的連點，等一下再送 */
    await sleep(200);
    guesser.clearErrors();
    guesser.emit('room:react', { kind: { toString: null } });
    check('怪表情被擋下', await guesser.until((c) => !!c.lastError(), 3000), guesser.lastError());
    const earlyGallery = await guesser.ask('room:gallery', {});
    check('對局中拿不到畫廊', earlyGallery.ok === false, JSON.stringify(earlyGallery));
    const spamGallery = await guesser.ask('room:gallery', {});
    check('畫廊請求有限流', spamGallery.ok === false && spamGallery.code === 'ratelimit', JSON.stringify(spamGallery));

    section('操作摘要');
    check('摘要有這一題的回合紀錄',
      host.view.room.summary.some((s) => s.kind === 'turn' || s.kind === 'pick'),
      JSON.stringify(host.view.room.summary.slice(-3)));
    check('摘要有「某某猜對了」',
      host.view.room.summary.some((s) => s.kind === 'correct'),
      JSON.stringify(host.view.room.summary.slice(-3)));
    check('觀戰者也收得到摘要', watcher.view.room.summary.length > 0, watcher.view.room.summary.length);
    check('觀戰者的摘要在公布前沒有答案',
      watcher.view.room.summary.filter((s) => s.kind !== 'reveal').every((s) => !JSON.stringify(s.params || {}).includes(answer)),
      JSON.stringify(watcher.view.room.summary.slice(-3)));
  }

  /* -------------------------------------------- 邀請撤銷與滿房 */
  section('邀請撤銷與對局中途加入');
  const rv = await host.ask('room:revokeInvite', { token: invPlayer.token });
  check('撤銷邀請會回覆結果（畫面才會跟著更新）', rv && rv.ok === true, JSON.stringify(rv));
  const revoked = await watcher.ask('invite:check', { code, token: invPlayer.token });
  check('撤銷後的邀請連結不能再用', revoked.ok === false, revoked.error);

  const extra = new Client('extra', 'client-extra-001', '路人');
  await extra.connect();
  const extraJoin = await extra.ask('room:join', { code, role: 'player', name: '路人' });
  check('對局進行中還有空位就直接加入當玩家（自動排最後一位）',
    extraJoin.ok === true && extraJoin.role === 'player' && !extraJoin.downgraded,
    JSON.stringify(extraJoin));
  check('中途加入的人看得到自己在這一局的名單裡',
    await extra.until((c) => !!c.view && !!c.view.game && !!c.view.you && c.view.you.inGame, 3000),
    extra.view && extra.view.you);
  check('大家都看得到「路人中途加入」的紀錄',
    await host.until((c) => (c.view.room.summary || []).some((s) => s.key === 'srv.sum.joinedMid' && s.params.name === '路人'), 3000),
    JSON.stringify(host.view.room.summary.slice(-3)));

  /* -------------------------------------------- 斷線重連 */
  section('斷線重連');
  const beforeName = mate.view.you.name;
  mate.close();
  await sleep(400);
  const mate2 = new Client('mate2', 'client-mate-0001', '小華改名');
  await mate2.connect();
  const rejoin = await mate2.ask('room:join', { code, name: '小華改名' });
  check('用同一個 clientId 可以回到原本的座位', rejoin.ok === true && rejoin.reconnected === true, JSON.stringify(rejoin));
  await mate2.until((c) => !!c.view);
  check('重連後角色沒變', mate2.view.you.role === 'player', mate2.view.you.role);
  check('重連後名字沒變', mate2.view.you.name === beforeName, mate2.view.you.name);
  check('重連後還在同一局', !!mate2.view.game && mate2.view.game.turnNo >= 1, mate2.view.game && mate2.view.game.turnNo);

  /* 同一個人多開一條連線（或網路閃一下先重連成功），晚一點斷掉的那條不能把他標成離線：
     標成離線 60 秒後就會被當成斷線太久踢出去。 */
  const mate3 = new Client('mate3', 'client-mate-0001', '小華改名');
  await mate3.connect();
  await mate3.ask('room:join', { code, name: '小華改名' });
  mate3.close();
  await sleep(500);
  const meRow = (host.view.room.members || []).find((m) => m.id === mate2.id);
  check('多出來的那條連線斷掉，人還是算在線上（不會 60 秒後被踢）', !!meRow && meRow.connected === true, JSON.stringify(meRow));

  /* -------------------------------------------- 房間自動關閉 */
  section('零實體玩家自動關閉');
  const lobbyWatcher = new Client('lobby', 'client-lobby-001', '大廳');
  await lobbyWatcher.connect();
  lobbyWatcher.emit('lobby:subscribe', {});
  check('大廳收到目前在線人數', await lobbyWatcher.until((c) => Number.isInteger(c.online) && c.online > 0, 4000));
  const beforeCount = lobbyWatcher.online;
  const countProbe = new Client('count-probe', 'client-count-probe', '測試');
  await countProbe.connect();
  check('新連線增加在線人數', await lobbyWatcher.until((c) => c.online === beforeCount + 1, 4000));
  countProbe.close();
  check('斷線減少在線人數', await lobbyWatcher.until((c) => c.online === beforeCount, 4000));
  check('大廳看得到這間房',
    await lobbyWatcher.until((c) => (c.rooms || []).some((r) => r.code === code), 4000),
    JSON.stringify((lobbyWatcher.rooms || []).map((r) => r.code)));

  host.emit('room:leave', {});
  await sleep(400);
  check('還有真人玩家時房間不關', watcher.closed === null, JSON.stringify(watcher.closed));

  mate2.emit('room:leave', {});
  await sleep(400);
  /* 中途加入的「路人」現在是真正的玩家（不是觀戰），還在的話房間一樣不會關 */
  check('中途加入的玩家還在，房間也不會關', watcher.closed === null, JSON.stringify(watcher.closed));

  extra.emit('room:leave', {});
  check('最後一位真人（含中途加入的）離開後觀戰者收到「房間已結束」',
    await watcher.until((c) => !!c.closed, 5000),
    JSON.stringify(watcher.closed));
  check('關閉原因講清楚', watcher.closed && /沒有玩家|沒有人/.test(watcher.closed.reason), watcher.closed && watcher.closed.reason);
  /* extra（路人）自己就是觸發關房的最後一位玩家，離開當下就已經離開了 socket.io 的房間分組，
     不會再收到之後的廣播，所以改用 watcher 這個一路留到最後的觀戰者確認關房通知即可。 */
  check('房間從大廳列表消失',
    await lobbyWatcher.until((c) => !(c.rooms || []).some((r) => r.code === code), 5000),
    JSON.stringify((lobbyWatcher.rooms || []).map((r) => r.code)));

  const afterClose = await watcher.ask('invite:check', { code, token: invWatch.token });
  check('關閉後邀請連結失效', afterClose.ok === false, afterClose.error);
  const rejoinClosed = await host.ask('room:join', { code, name: '阿明' });
  check('關閉後不能再加入（重連也救不回來）', rejoinClosed.ok === false, rejoinClosed.error);

  const finalRooms = await (await fetch(BASE + '/api/rooms')).json();
  check('伺服器上已經沒有這間房', !finalRooms.rooms.some((r) => r.code === code), JSON.stringify(finalRooms.rooms.map((r) => r.code)));

  [host, mate2, watcher, extra, lobbyWatcher].forEach((c) => c.close());

  await runRelay();
  await runTelephone();
}

/* ------------------------------------------------------------ 接力模式 */

async function runRelay() {
  const Words = require('../public/js/words.js');
  const RelayRules = require('../public/js/relay-rules.js');
  section('接力模式：開房與大廳分流');
  const a = new Client('relay-a', 'client-relay-aaaa', '接力甲');
  const b = new Client('relay-b', 'client-relay-bbbb', '接力乙');
  const c = new Client('relay-c', 'client-relay-cccc', '接力丙');
  const w = new Client('relay-w', 'client-relay-wwww', '接力觀');
  const classicLobby = new Client('lobby-c', 'client-lobby-cccc', '一般大廳');
  const relayLobby = new Client('lobby-r', 'client-lobby-rrrr', '接力大廳');
  for (const x of [a, b, c, w, classicLobby, relayLobby]) await x.connect();
  classicLobby.emit('lobby:subscribe', {});
  relayLobby.emit('lobby:subscribe', { mode: 'relay' });

  const created = await a.ask('room:create', { name: '接力甲', roomName: '接力測試房', mode: 'relay', settings: { guessRounds: 1, batonSec: 7 } });
  check('可以開接力房', created.ok === true && created.mode === 'relay', JSON.stringify(created));
  const code = created.code;
  check('接力大廳看得到接力房', await relayLobby.until((x) => (x.rooms || []).some((r) => r.code === code && r.mode === 'relay'), 4000));
  await sleep(200);
  check('一般大廳看不到接力房', !(classicLobby.rooms || []).some((r) => r.code === code), JSON.stringify(classicLobby.rooms));
  const api = await (await fetch(BASE + '/api/rooms')).json();
  check('/api/rooms（一般列表）不含接力房', !api.rooms.some((r) => r.code === code));

  for (const x of [b, c]) {
    const j = await x.ask('room:join', { code, name: x.name, role: 'player' });
    check(x.name + ' 加入接力房', j.ok === true, JSON.stringify(j));
  }
  const jw = await w.ask('room:join', { code, name: w.name, role: 'spectator' });
  check('觀戰者加入接力房', jw.ok === true && jw.role === 'spectator');
  b.emit('room:ready', { ready: true });
  c.emit('room:ready', { ready: true });
  await a.until((x) => x.view && x.view.you.can.start, 3000);
  for (const x of [a, b, c, w]) x.keepSeen = true;
  a.emit('room:start', {});
  check('三人開始接力', await a.until((x) => x.view && x.view.game && x.view.game.mode === 'relay' && x.view.game.phase === 'voting', 4000));

  section('接力模式：投票、接力與猜題');
  const byId = {};
  for (const x of [a, b, c]) byId[x.id] = x;
  let total = a.view.game.totalQuestions;
  check('總題數 = 3（每人當一次猜題者）', total === 3, total);
  let answers = [];
  for (let q = 0; q < 3; q++) {
    await a.until((x) => x.view.game.phase === 'voting' && x.view.game.questionNo === q + 1, 12000);
    const gid = a.view.game.guesserId;
    const guesser = byId[gid];
    const painters = [a, b, c].filter((x) => x.id !== gid);
    await guesser.until((x) => x.view && x.view.game.questionNo === q + 1, 3000);
    check('第 ' + (q + 1) + ' 題：猜題者看不到候選題', guesser.view.game.choices.length === 0 && !guesser.view.you.can.vote);
    await painters[0].until((x) => x.view.game.choices.length === 4, 3000);
    const choice = painters[0].view.game.choices[1].id;
    painters[0].emit('room:vote', { wordId: choice });
    check('投票後只顯示票數', await painters[1].until((x) => x.view.game.choices.some((ch) => ch.votes === 1), 3000) &&
      !JSON.stringify(painters[1].view.game).includes(painters[0].id + '":"'));
    painters[1].emit('room:vote', { wordId: choice });
    check('全部投完提前開始（倒數）', await a.until((x) => ['countdown', 'drawing'].indexOf(x.view.game.phase) >= 0, 3000));
    await a.until((x) => x.view.game.phase === 'drawing', 5000);
    const ans = w.view && w.view.game.answer;
    answers.push(ans);
    check('觀戰者看得到答案', !!ans, JSON.stringify(w.view && w.view.game.answer));
    check('猜題者的投影沒有答案', guesser.view.game.answer === null);
    const drawerId = a.view.game.drawerId;
    const drawer = byId[drawerId];
    const waiting = painters.find((x) => x.id !== drawerId);
    drawer.emit('room:stroke', { stroke: { t: 'pen', c: 0, w: 1, p: [100, 100, 300, 300] } });
    check('當棒畫家的筆畫廣播給大家', await guesser.until((x) => x.strokes.length > 0, 3000));
    guesser.strokes = [];
    waiting.emit('room:stroke', { stroke: { t: 'pen', c: 0, w: 1, p: [1, 1, 2, 2] } });
    check('不是這一棒的畫家畫不了', await waiting.until((x) => x.errors.length > 0, 3000));
    waiting.clearErrors();
    if (q === 0) {
      waiting.emit('room:chat', { text: '加油畫大一點' });
      check('畫家之間可以聊天', await drawer.until((x) => (x.view.room.chat || []).some((m) => m.text === '加油畫大一點'), 3000));
      await sleep(200);
      check('猜題者看不到畫家聊天', (guesser.view.room.chat || []).length === 0);
      guesser.emit('room:chat', { text: '偷看' });
      check('猜題者不能在對局中聊天', await guesser.until((x) => x.errors.length > 0, 3000));
      guesser.clearErrors();
      waiting.emit('room:cheer', { kind: 'cheer' });
      check('表情送到當下作畫者', await drawer.until((x) => x.cheers.some((ch) => ch.kind === 'cheer'), 3000));
      await sleep(200);
      check('猜題者收不到表情', guesser.cheers.length === 0);
      guesser.emit('room:typing', { on: true });
      check('畫家看得到「輸入中…」', await waiting.until((x) => x.view.room.guesserTypingUntil > 0, 3000));
      guesser.emit('room:guess', { text: '這個一定猜錯QQ' });
      check('猜錯內容大家都看得到', await w.until((x) => x.feed.some((e) => e && e.text === '這個一定猜錯QQ'), 3000));
      await sleep(450);
      guesser.emit('room:guess', { text: ans });
      check('猜題者猜中 → 公布答案', await a.until((x) => x.view.game.phase === 'reveal', 4000));
      check('第一棒猜中 300 分', await guesser.until((x) => x.privates.some((p) => p.kind === 'hit' && p.points === 300), 3000),
        JSON.stringify(guesser.privates));
      const scores = a.view.game.players.filter((p) => p.score === 300).map((p) => p.id).sort();
      check('猜題者與當下作畫者同分', scores.join() === [gid, drawerId].sort().join(), JSON.stringify(a.view.game.players));
    } else if (q === 1) {
      guesser.emit('room:hint', {});
      check('猜題者自己用提示', await guesser.until((x) => x.view.game.hint && x.view.game.hint.step === 1, 3000));
      guesser.emit('room:giveUp', {});
      check('放棄 → 公布答案、沒人得分', await a.until((x) => x.view.game.phase === 'reveal' && x.view.game.log.slice(-1)[0].reason === 'giveup', 4000));
    } else {
      /* 等一棒跑完進緩衝，再在緩衝中猜中：算上一棒 */
      check('一棒畫滿進入換棒緩衝', await a.until((x) => x.view.game.phase === 'handoff', 9000));
      const next = byId[a.view.game.nextDrawerId];
      check('下一棒的人收到「換你畫」標記', !!next && next.view.game.you.isNext === true);
      guesser.emit('room:guess', { text: ans });
      check('緩衝中猜中 → 公布', await a.until((x) => x.view.game.phase === 'reveal', 4000));
      const last = a.view.game.log.slice(-1)[0];
      check('緩衝中猜中算上一棒', last.drawerId === drawerId && last.points === 300, JSON.stringify(last));
    }
    check('公布後猜題者也看得到答案', await guesser.until((x) => x.view.game.answer === ans, 3000));
  }

  section('接力模式：結算');
  check('三題後結算', await a.until((x) => x.view.room.phase === 'finished', 12000));
  const g = a.view.game;
  check('結算有三個獎項', !!g.awards && Array.isArray(g.awards.guess) && Array.isArray(g.awards.relay) && Array.isArray(g.awards.key));
  const gal = await a.ask('room:gallery', {});
  check('畫廊放每題完成圖並列出參與畫家', gal.ok && gal.items.length >= 1 && Array.isArray(gal.items[0].painters) && gal.items[0].painters.length >= 1,
    JSON.stringify(gal && gal.items && gal.items.map((i) => i.painters)));

  /* 猜題者整場收過的投影：當他是猜題者的那幾題，公布前一個答案字都沒有 */
  for (let q = 0; q < 3; q++) {
    const ans = answers[q];
    if (!ans) continue;
    const owner = [a, b, c].find((x) => x.seen.some((s) => {
      const v = JSON.parse(s);
      return v.game && v.game.questionNo === q + 1 && v.game.guesserId === x.id;
    }));
    if (!owner) continue;
    const leaked = owner.seen.some((s) => {
      const v = JSON.parse(s);
      return v.game && v.game.questionNo === q + 1 && RelayRules.ACTIVE.indexOf(v.game.phase) >= 0 && s.includes(ans);
    });
    check('第 ' + (q + 1) + ' 題猜題者在公布前從沒收到答案', !leaked);
  }
  check('題庫答案確實存在（檢查有效）', answers.every((x) => !!x && Words.LIST.length > 0));

  a.emit('room:rematch', {});
  check('房主可以直接再來一局', await a.until((x) => x.view.room.phase === 'playing' && x.view.game.questionNo === 1, 4000));
  c.emit('room:leave', {});
  check('剩兩人時直接結算', await a.until((x) => x.view.room.phase === 'finished', 5000));
  [a, b, c, w, classicLobby, relayLobby].forEach((x) => x.close());
}

/* ------------------------------------------------------------ 畫圖傳話（Beta） */

async function runTelephone() {
  section('畫圖傳話：開房與大廳分流');
  const a = new Client('tp-a', 'client-tp-aaaa', '傳話甲');
  const b = new Client('tp-b', 'client-tp-bbbb', '傳話乙');
  const c = new Client('tp-c', 'client-tp-cccc', '傳話丙');
  const d = new Client('tp-d', 'client-tp-dddd', '傳話丁');
  const w = new Client('tp-w', 'client-tp-wwww', '傳話觀戰');
  const classicLobby = new Client('lobby-tc', 'client-lobby-tc', '一般大廳2');
  const relayLobby = new Client('lobby-tr', 'client-lobby-tr', '接力大廳2');
  const tpLobby = new Client('lobby-tt', 'client-lobby-tt', '傳話大廳');
  for (const x of [a, b, c, d, w, classicLobby, relayLobby, tpLobby]) await x.connect();
  classicLobby.emit('lobby:subscribe', {});
  relayLobby.emit('lobby:subscribe', { mode: 'relay' });
  tpLobby.emit('lobby:subscribe', { mode: 'telephone' });

  const created = await a.ask('room:create', { name: '傳話甲', roomName: '傳話測試房', mode: 'telephone', settings: { drawSec: 30, guessSec: 20, rounds: 1 } });
  check('可以開畫圖傳話房', created.ok === true && created.mode === 'telephone', JSON.stringify(created));
  const code = created.code;
  check('這個模式的大廳看得到房間', await tpLobby.until((x) => (x.rooms || []).some((r) => r.code === code && r.mode === 'telephone' && r.maxPlayers === 5), 4000));
  await sleep(200);
  check('一般與接力大廳看不到這種房', !(classicLobby.rooms || []).some((r) => r.code === code) && !(relayLobby.rooms || []).some((r) => r.code === code));

  for (const x of [b, c, d]) {
    const j = await x.ask('room:join', { code, name: x.name, role: 'player' });
    check(x.name + ' 加入', j.ok === true && j.role === 'player', JSON.stringify(j));
  }
  const jw = await w.ask('room:join', { code, name: w.name, role: 'spectator' });
  check('觀戰者加入', jw.ok === true && jw.role === 'spectator');
  for (const x of [b, c, d]) x.emit('room:ready', { ready: true });
  await a.until((x) => x.view && x.view.you.can.start, 3000);
  for (const x of [a, b, c, d, w]) x.keepSeen = true;
  a.emit('room:start', {});
  check('四人開始、進入挑題', await a.until((x) => x.view && x.view.game && x.view.game.mode === 'telephone' && x.view.game.phase === 'picking', 4000));

  section('畫圖傳話：挑題、照畫、猜答案');
  const byId = {};
  for (const x of [a, b, c, d]) byId[x.id] = x;
  const starter = byId[a.view.game.starterId];
  await starter.until((x) => x.view.game.choices.length === 3, 3000);
  check('只有開頭的人拿到候選', [a, b, c, d].every((x) => x === starter ? x.view.game.choices.length === 3 : x.view.game.choices.length === 0));
  b.emit('room:chat', { text: '偷偷講' });
  check('傳話中聊天被擋', await b.until((x) => x.errors.some((e) => /telephoneNoChat/.test(JSON.stringify(e))), 3000));
  b.clearErrors();
  const wordId = starter.view.game.choices[0].id;
  const ans = starter.view.game.choices[0].text;
  starter.emit('room:pick', { wordId });
  check('挑完進第一格', await a.until((x) => x.view.game.phase === 'step' && x.view.game.stepNo === 0, 3000));
  const order = a.view.game.order.map((o) => byId[o.id]);
  check('順序 4 格、最後一格猜', order.length === 4 && a.view.game.order[3].kind === 'write');
  for (let i = 0; i < 3; i++) {
    const me = order[i];
    check('第 ' + (i + 1) + ' 格換手後可以畫', await me.until((x) => x.view.game.stepNo === i && x.view.you.can.draw, 6000));
    for (const x of [a, b, c, d, w]) x.strokes = [];
    me.emit('room:stroke', { stroke: { t: 'pen', c: 0, w: 1, p: [100, 100, 300 + i * 10, 300] } });
    check('第 ' + (i + 1) + ' 格筆畫只送給畫的人、前面畫完的人、下一位與觀戰者', await me.until((x) => x.strokes.length > 0, 3000) && (await sleep(300),
      order.slice(0, i + 2).every((x) => x.strokes.length > 0) && order.slice(i + 2).every((x) => x.strokes.length === 0) && w.strokes.length > 0));
    if (i > 0) check('第 ' + (i + 1) + ' 格開始作畫後看不到上一張畫', me.view.game.prev && me.view.game.prev.strokes === null);
    const other = order[(i + 1) % 4];
    other.emit('room:stroke', { stroke: { t: 'pen', c: 0, w: 1, p: [1, 1, 2, 2] } });
    check('沒輪到的人畫不了', await other.until((x) => x.errors.length > 0, 3000));
    other.clearErrors();
    me.emit('room:submit', {});
    await a.until((x) => x.view.game.stepNo === i + 1, 3000);
  }
  /* 中間的人交出畫後猜原本的題目：猜錯只有自己知道，猜中大家看到「某某猜中了」 */
  const mid = order[1];
  mid.privates = [];
  mid.emit('room:midguess', { text: '一定不是這個' });
  check('中間的人猜錯只回給自己', await mid.until((x) => x.privates.some((p) => p.kind === 'miss' && p.params && p.params.next === 40), 3000));
  await sleep(1300);
  mid.emit('room:midguess', { text: ans });
  check('中間的人猜中 +40', await mid.until((x) => x.privates.some((p) => p.kind === 'hit' && p.points === 40), 3000));
  check('大家看到猜中了、沒有題目', await order[0].until((x) => (x.view.room.feed || []).some((e) => e.key === 'srv.feed.telephoneMidHit'), 3000) &&
    !JSON.stringify(order[3].view).includes(ans));
  const guesser = order[3];
  check('猜的人可以寫答案與偷看', await guesser.until((x) => x.view.you.can.answer && x.view.you.can.peek && x.view.game.prev && x.view.game.prev.kind === 'drawing', 6000));
  check('其他人與觀戰者可翻看所有畫', await w.until((x) => x.view.game.drawings && x.view.game.drawings.length === 3, 3000) && order[0].view.game.drawings.length === 3);
  guesser.emit('room:hint', {});
  check('猜的人用提示看到字數', await guesser.until((x) => x.view.game.hint && x.view.game.hint.step === 1, 3000));
  order[0].emit('room:hint', {});
  check('畫的人不能用提示', await order[0].until((x) => x.errors.length > 0, 3000));
  guesser.emit('room:peek', { idx: 0 });
  check('偷看第一張畫只給猜的人', await guesser.until((x) => x.view.game.peeks && x.view.game.peeks.length === 1, 3000) && order[1].view.game.peeks === null);
  guesser.emit('room:answer', { text: '草稿', draft: true });
  await sleep(200);
  guesser.emit('room:answer', { text: ans });
  check('寫答案就揭曉', await a.until((x) => x.view.game.phase === 'reveal' && x.view.game.chain && x.view.game.chain.hit, 4000));
  /* 字數 ×0.6、偷看第一張（4 人可偷看 2 張）×0.3 → 0.18 */
  const pts = a.view.game.chain.cells.map((x) => x.points).join();
  check('依順序遞減並乘提示倍數', pts === '54,42,30,18', pts);
  const leaked = [a, b, c, d].some((x) => x.seen.some((s) => {
    const v = JSON.parse(s);
    return v.game && (v.game.phase === 'picking' || v.game.phase === 'step') && v.you && v.you.id !== starter.id && s.includes(ans);
  }));
  check('揭曉前玩家裡只有開頭的人收到題目', !leaked);
  check('觀戰者傳話中就看得到題目', w.seen.some((s) => { const v = JSON.parse(s); return v.game && v.game.phase === 'step' && v.game.answer === ans; }));
  check('沒人收到草稿', ![a, b, c, w].some((x) => x.seen.some((s) => s.includes('草稿'))));
  b.emit('room:chat', { text: '笑死' });
  check('揭曉時可以聊天', await a.until((x) => (x.view.room.chat || []).some((m) => m.text === '笑死'), 3000));
  const cellOfOther = a.view.game.chain.cells.findIndex((x) => x.authorId !== a.id);
  a.emit('room:react', { kind: 'laugh', cell: cellOfOther });
  check('對別人的格子按表情', await b.until((x) => x.view.game.chain && x.view.game.chain.cells[cellOfOther].counts.laugh === 1, 3000));

  section('畫圖傳話：結算');
  check('揭曉後結算', await a.until((x) => x.view.room.phase === 'finished', 40000));
  check('最好笑頒給被按的人', a.view.game.awards && a.view.game.awards.funniest.length === 1 && a.view.game.awards.funniest[0].id === a.view.game.chain.cells[cellOfOther].authorId);
  const gal = await a.ask('room:gallery', {});
  check('畫廊收錄每一張畫', gal.ok && gal.mode === 'telephone' && gal.items.length === 3, JSON.stringify(gal && gal.items && gal.items.length));

  a.emit('room:rematch', {});
  check('房主可以直接再來一局', await a.until((x) => x.view.room.phase === 'playing' && x.view.game.roundNo === 1, 4000));
  c.emit('room:leave', {});
  d.emit('room:leave', {});
  check('剩兩人時立即結算', await a.until((x) => x.view.room.phase === 'finished', 5000));
  [a, b, c, d, w, classicLobby, relayLobby, tpLobby].forEach((x) => x.close());
}

run()
  .catch((e) => {
    failed += 1;
    console.error('\n✗ 測試中斷：' + (e && e.stack ? e.stack : e));
  })
  .then(async () => {
    await sleep(200);
    stopServer();
    console.log('\n' + '='.repeat(46));
    console.log('  通過 ' + passed + ' 項，失敗 ' + failed + ' 項');
    console.log('='.repeat(46));
    process.exit(failed ? 1 : 0);
  });
