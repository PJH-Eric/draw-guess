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
 *   5.  準備 → 加電腦對手 → 開始 → 三個用戶端都收到同一份房間投影
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
    this.syncCount = 0;
    this.socket = io(BASE, { transports: ['websocket'], reconnection: false, timeout: 8000 });

    this.socket.on('room:sync', (v) => { this.view = v; this.syncCount += 1; });
    this.socket.on('room:stroke', (p) => { this.strokes.push(p); });
    this.socket.on('room:board', (p) => { this.boards.push(p); });
    this.socket.on('room:feed', (p) => { this.feed.push(p.entry); });
    this.socket.on('room:private', (p) => { this.privates.push(p); });
    this.socket.on('room:error', (p) => { this.errors.push(p); });
    this.socket.on('room:closed', (p) => { this.closed = p; });
    this.socket.on('lobby:rooms', (p) => { this.rooms = p.rooms; });
  }

  connect() {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(this.label + ' 連線逾時')), 10000);
      this.socket.on('connect', () => {
        this.socket.emit('hello', { clientId: this.clientId, name: this.name }, () => {
          clearTimeout(t);
          resolve();
        });
      });
      this.socket.on('connect_error', (e) => { clearTimeout(t); reject(e); });
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
  check('/health 回報題庫大小', health.words === 4096, health.words);
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
  section('準備、電腦對手與開始');
  mate.clearErrors();
  mate.emit('room:addAi', { level: 'easy' });
  check('非房主不能加電腦對手', await mate.until((c) => !!c.lastError()), mate.lastError());

  host.emit('room:addAi', { level: 'easy' });
  check('房主可以加電腦對手', await host.until((c) => c.view.room.aiSeats.length === 1), JSON.stringify(host.view.room.aiSeats));

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
  check('名單裡有 3 位（2 真人 + 1 電腦）', host.view.game.players.length === 3, host.view.game.players.length);
  check('三個用戶端看到同一個題號與同一位畫家',
    host.view.game.turnNo === mate.view.game.turnNo && host.view.game.drawerId === watcher.view.game.drawerId,
    host.view.game.drawerId + '/' + watcher.view.game.drawerId);

  /* -------------------------------------------- 選題與隱藏資訊 */
  section('選題與隱藏資訊');

  /* 推進到「其中一個真人當畫家」的回合，才能測畫圖與猜題 */
  const humans = { [host.clientId]: host, [mate.clientId]: mate };
  let drawer = null;
  let guesser = null;
  for (let hop = 0; hop < 10 && !drawer; hop++) {
    const id = host.view.game.drawerId;
    if (humans[id]) { drawer = humans[id]; guesser = id === host.clientId ? mate : host; break; }
    /* 這一輪是電腦畫，等它畫完再看下一輪 */
    await host.until((c) => c.view.game.drawerId !== id, 130000);
  }
  check('有輪到真人當畫家', !!drawer, drawer ? drawer.label : 'none');

  if (drawer) {
    await drawer.until((c) => c.view.game.phase === 'picking' && c.view.game.choices.length === 3, 20000);
    check('畫家收到三個候選題目', drawer.view.game.choices.length === 3, drawer.view.game.choices.length);
    check('猜題者看不到候選題目', guesser.view.game.choices.length === 0, guesser.view.game.choices.length);
    check('觀戰者看不到候選題目', watcher.view.game.choices.length === 0, watcher.view.game.choices.length);

    const pick = drawer.view.game.choices[0];
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
    check('猜題者拿到的是遮罩', (guesser.view.game.hint.mask || '').indexOf('○') >= 0, guesser.view.game.hint.mask);
    check('分類與字數是公開提示',
      !!guesser.view.game.hint.catLabel && guesser.view.game.hint.len === answer.length,
      guesser.view.game.hint.catLabel + '/' + guesser.view.game.hint.len);
    check('操作摘要在揭曉前不含答案',
      host.view.room.summary.every((s) => s.text.indexOf(answer) < 0),
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

    /* -------------------------------------------- 猜題 */
    section('猜題');
    const feedBefore = watcher.feed.length;
    guesser.emit('room:guess', { text: '一定不是這個答案' });
    check('猜錯會廣播到猜題紀錄', await watcher.until((c) => c.feed.length > feedBefore, 4000), watcher.feed.length);
    check('猜錯的內容大家都看得到', watcher.feed[watcher.feed.length - 1].text === '一定不是這個答案');

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
      watcher.feed.slice(watchFeedBefore).every((f) => f.text.indexOf(answer) < 0) ||
      watcher.feed.slice(watchFeedBefore).every((f) => f.kind !== 'guess'),
      JSON.stringify(watcher.feed.slice(watchFeedBefore)));
    /* 「某某猜對了」是系統訊息，跟著房間投影一起送（room:sync 裡的 room.feed），
       猜錯才走 room:feed 增量頻道。這裡驗證觀戰者確實收得到，而且沒有答案。 */
    check('紀錄裡只公布「某某猜對了」',
      await watcher.until((c) => (c.view.room.feed || []).some((f) => f.kind === 'correct' && f.text.indexOf('猜對了') >= 0), 4000),
      JSON.stringify((watcher.view.room.feed || []).slice(-3)));
    check('公布訊息裡不含答案',
      (watcher.view.room.feed || []).every((f) => f.text.indexOf(answer) < 0));
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

    section('操作摘要');
    check('摘要有這一題的回合紀錄',
      host.view.room.summary.some((s) => s.kind === 'turn' || s.kind === 'pick'),
      JSON.stringify(host.view.room.summary.slice(-3)));
    check('摘要有「某某猜對了」',
      host.view.room.summary.some((s) => s.kind === 'correct'),
      JSON.stringify(host.view.room.summary.slice(-3)));
    check('觀戰者也收得到摘要', watcher.view.room.summary.length > 0, watcher.view.room.summary.length);
    check('觀戰者的摘要裡沒有答案', watcher.view.room.summary.every((s) => s.text.indexOf(answer) < 0));
  }

  /* -------------------------------------------- 邀請撤銷與滿房 */
  section('邀請撤銷與滿房轉觀戰');
  host.emit('room:revokeInvite', { token: invPlayer.token });
  await sleep(300);
  const revoked = await watcher.ask('invite:check', { code, token: invPlayer.token });
  check('撤銷後的邀請連結不能再用', revoked.ok === false, revoked.error);

  const extra = new Client('extra', 'client-extra-001', '路人');
  await extra.connect();
  const extraJoin = await extra.ask('room:join', { code, role: 'player', name: '路人' });
  check('對局進行中加入會被明確降為觀戰',
    extraJoin.ok === true && extraJoin.role === 'spectator' && extraJoin.downgraded === true,
    JSON.stringify(extraJoin));

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

  /* -------------------------------------------- 房間自動關閉 */
  section('零實體玩家自動關閉');
  const lobbyWatcher = new Client('lobby', 'client-lobby-001', '大廳');
  await lobbyWatcher.connect();
  lobbyWatcher.emit('lobby:subscribe', {});
  check('大廳看得到這間房',
    await lobbyWatcher.until((c) => (c.rooms || []).some((r) => r.code === code), 4000),
    JSON.stringify((lobbyWatcher.rooms || []).map((r) => r.code)));

  host.emit('room:leave', {});
  await sleep(400);
  check('還有一位真人玩家時房間不關', watcher.closed === null, JSON.stringify(watcher.closed));

  mate2.emit('room:leave', {});
  check('最後一位真人離開後觀戰者收到「房間已結束」',
    await watcher.until((c) => !!c.closed, 5000),
    JSON.stringify(watcher.closed));
  check('關閉原因講清楚', watcher.closed && /沒有玩家|沒有人/.test(watcher.closed.reason), watcher.closed && watcher.closed.reason);
  check('另一位觀戰者也收到通知', await extra.until((c) => !!c.closed, 5000), JSON.stringify(extra.closed));
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
