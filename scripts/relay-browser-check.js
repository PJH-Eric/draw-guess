/*
 * scripts/relay-browser-check.js — 接力模式（Beta）的瀏覽器巡檢
 * 執行：node scripts/relay-browser-check.js            （會自己啟動 server.js 與無頭 Chrome）
 *       STOP_AFTER=setup node scripts/relay-browser-check.js   只跑到等待畫面
 *
 * 零外部套件：用 Node 內建的 fetch 與 WebSocket 講 Chrome DevTools Protocol。
 * 四個分頁各自在獨立的瀏覽器情境（各自的 localStorage＝各自的身分）：房主、玩家乙、玩家丙、觀戰。
 *
 * 檢查項目
 *   1. 首頁有接力入口；接力大廳只列接力房，一般大廳看不到接力房
 *   2. 開接力房彈窗只顯示接力欄位（猜題次數、每棒秒數）
 *   3. 等待畫面、投票、倒數、作畫（當棒／等待的畫家／猜題者／觀戰）、換棒、公布、結算
 *      在 8 種尺寸與英文版都不可水平溢出、主要按鈕不能被裁到畫面外
 *   4. 猜題者畫面從頭到尾不出現答案文字；主控台沒有錯誤
 * 截圖存到 screenshots/relay/（已在 .gitignore）。
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.CHECK_PORT || 3133);
const BASE = 'http://127.0.0.1:' + PORT + '/';
const DEBUG_PORT = Number(process.env.CDP_PORT || 9346);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'draw-guess-relay-'));
const SHOTS = path.join(ROOT, 'screenshots', 'relay');
const STOP_AFTER = process.env.STOP_AFTER || '';
const ALL_SIZES = process.env.RELAY_SIZES !== 'few';

const VIEWPORTS = [
  { key: 'phone-narrow', name: '手機窄版直向', width: 360, height: 640, mobile: true, dsf: 2 },
  { key: 'phone', name: '手機直向', width: 390, height: 844, mobile: true, dsf: 2 },
  { key: 'phone-mid', name: '手機中窄版直向', width: 456, height: 800, mobile: true, dsf: 2 },
  { key: 'phone-land', name: '手機橫向', width: 844, height: 390, mobile: true, dsf: 2 },
  { key: 'phone-land-small', name: '小手機橫向', width: 667, height: 375, mobile: true, dsf: 2 },
  { key: 'tablet', name: '平板直向', width: 768, height: 1024, mobile: true, dsf: 1 },
  { key: 'tablet-land', name: '平板橫向', width: 1024, height: 768, mobile: true, dsf: 1 },
  { key: 'desktop', name: '桌機寬版', width: 1440, height: 900, mobile: false, dsf: 1 }
];
const BASE_VP = VIEWPORTS[6];
const FIRST_HALF = VIEWPORTS.slice(0, 4);
const SECOND_HALF = VIEWPORTS.slice(4);

const failures = [];
function check(label, condition, detail) {
  if (condition) console.log('  ✓ ' + label);
  else {
    console.log('  ✗ ' + label + (detail ? ' — ' + detail : ''));
    failures.push(label + (detail ? ' — ' + detail : ''));
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const list = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium'
  ].filter(Boolean);
  for (const c of list) if (fs.existsSync(c)) return c;
  return null;
}

/* ---------------------------------------------------- 極簡 CDP 用戶端 */

class CDP {
  constructor(ws, label) {
    this.ws = ws; this.label = label; this.id = 0; this.pending = new Map(); this.listeners = new Map(); this.errors = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
      } else if (msg.method) (this.listeners.get(msg.method) || []).forEach((fn) => fn(msg.params));
    });
  }
  send(method, params) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params: params || {} }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('CDP timeout: ' + method)); } }, 30000);
    });
  }
  on(method, fn) { const l = this.listeners.get(method) || []; l.push(fn); this.listeners.set(method, l); }
  async eval(expr) {
    const res = await this.send('Runtime.evaluate', { expression: '(function(){' + expr + '})()', returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error(this.label + ' 頁面例外：' + (res.exceptionDetails.exception && res.exceptionDetails.exception.description));
    return res.result.value;
  }
  async waitFor(expr, ms, label) {
    const end = Date.now() + (ms || 8000);
    while (Date.now() < end) {
      /* 以 var／return 開頭的是一段程式（例如先宣告變數），否則當成一個運算式 */
      const body = /^\s*(var|return)\b/.test(expr) ? expr : 'return !!(' + expr + ');';
      if (await this.eval('try { ' + body + ' } catch (e) { return false; }')) return true;
      await sleep(120);
    }
    throw new Error(this.label + '：等不到 ' + (label || expr));
  }
  click(sel) { return this.eval('var el=document.querySelector(' + JSON.stringify(sel) + '); if(!el) return false; el.scrollIntoView({block:"center"}); el.click(); return true;'); }
  view() { return this.eval('var a=window.DrawGuessApp; var v=a&&a.view; return v ? JSON.parse(JSON.stringify(v)) : null;'); }
}

let chromeProc = null;
let serverProc = null;

async function openTab(label) {
  const ctx = await rootCdp.send('Target.createBrowserContext', { disposeOnDetach: false });
  const t = await rootCdp.send('Target.createTarget', { url: 'about:blank', browserContextId: ctx.browserContextId });
  let target = null;
  for (let i = 0; i < 30 && !target; i++) {
    const list = await (await fetch('http://127.0.0.1:' + DEBUG_PORT + '/json/list')).json();
    target = list.find((x) => x.id === t.targetId);
    if (!target) await sleep(100);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const cdp = new CDP(ws, label);
  cdp.on('Runtime.exceptionThrown', (p) => cdp.errors.push((p.exceptionDetails && p.exceptionDetails.exception && p.exceptionDetails.exception.description) || '未知例外'));
  cdp.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') cdp.errors.push(p.args.map((a) => a.description || a.value).join(' ')); });
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await setViewport(cdp, BASE_VP);
  return cdp;
}

async function setViewport(cdp, v) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: v.width, height: v.height, deviceScaleFactor: v.dsf, mobile: v.mobile });
  await cdp.send('Emulation.setTouchEmulationEnabled', v.mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
}

async function boot(cdp, nick, lang) {
  await cdp.send('Page.navigate', { url: BASE + (lang ? '?lang=' + lang : '') });
  await sleep(500);
  await cdp.waitFor('window.DrawGuessApp && document.readyState === "complete"', 10000, '頁面初始化');
  await cdp.eval('localStorage.setItem("dg_tutorial","1"); localStorage.setItem("dg_nick",' + JSON.stringify(nick) + '); return 1;');
  await cdp.send('Page.navigate', { url: BASE + (lang ? '?lang=' + lang : '') });
  await sleep(500);
  await cdp.waitFor('window.DrawGuessApp && document.readyState === "complete"', 10000, '頁面初始化');
}

/* 版面檢查：不可水平溢出；可見的按鈕／輸入框不能跑到畫面外（被裁掉就按不到） */
const LAYOUT = `
  var vw = window.innerWidth, vh = window.innerHeight;
  var doc = document.documentElement;
  var out = { overflowX: Math.max(doc.scrollWidth, document.body.scrollWidth) - vw, clipped: [] };
  function visible(el) {
    if (el.closest('[hidden]')) return false;
    var cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    var r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }
  function inScroller(el) {
    var n = el.parentElement;
    while (n && n !== document.body) {
      var cs = getComputedStyle(n);
      if (/(auto|scroll)/.test(cs.overflowX + cs.overflowY) && n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1 && /(auto|scroll)/.test(cs.overflowX)) return true;
      n = n.parentElement;
    }
    return false;
  }
  var screen = document.querySelector('.screen.active');
  var els = (screen ? screen.querySelectorAll('button, input, select, textarea') : []);
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    if (!visible(el) || el.closest('#game-aside:not(.open)') || el.closest('.scroll-rail')) continue;
    var r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1 || r.bottom > vh + 1 || r.top < -1) && !inScroller(el)) {
      out.clipped.push((el.id || el.getAttribute('data-act') || el.className || el.tagName) + '@' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
  }
  return out;
`;

async function shot(cdp, name) {
  const res = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(res.data, 'base64'));
}

/** 在每一種尺寸下截圖並檢查版面，最後回到基準尺寸 */
async function sweep(cdp, name, opts) {
  const o = opts || {};
  const list = o.list ? (ALL_SIZES ? o.list : [BASE_VP]) : (ALL_SIZES && !o.one ? VIEWPORTS : [BASE_VP]);
  for (const v of list) {
    await setViewport(cdp, v);
    await sleep(o.settle || 260);
    const lay = await cdp.eval(LAYOUT);
    check(name + '／' + v.name + '：沒有水平溢出', lay.overflowX <= 1, 'overflow ' + lay.overflowX + 'px');
    check(name + '／' + v.name + '：按鈕與輸入框沒被裁到畫面外', lay.clipped.length === 0, lay.clipped.slice(0, 4).join(' | '));
    await shot(cdp, name + '-' + v.key);
  }
  await setViewport(cdp, BASE_VP);
  await sleep(120);
}

let rootCdp = null;

async function main() {
  const chrome = findChrome();
  if (!chrome) { console.log('找不到 Chrome 或 Edge，略過。'); return; }
  fs.mkdirSync(SHOTS, { recursive: true });
  for (const f of fs.readdirSync(SHOTS)) if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS, f));

  serverProc = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), HOST: '127.0.0.1', GAME_ALLOWED_ORIGIN: '*', ROOM_TICK_MS: '200' }),
    stdio: 'ignore'
  });
  let up = false;
  for (let i = 0; i < 50 && !up; i++) { await sleep(200); try { up = (await fetch(BASE + 'health')).ok; } catch (e) {} }
  if (!up) throw new Error('伺服器沒有啟動');

  chromeProc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--mute-audio', '--remote-debugging-port=' + DEBUG_PORT, '--user-data-dir=' + PROFILE, 'about:blank'], { stdio: 'ignore' });
  let ver = null;
  for (let i = 0; i < 50 && !ver; i++) { await sleep(200); try { ver = await (await fetch('http://127.0.0.1:' + DEBUG_PORT + '/json/version')).json(); } catch (e) {} }
  if (!ver) throw new Error('無法連上瀏覽器');
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  rootCdp = new CDP(ws, 'browser');

  const host = await openTab('房主');
  const p2 = await openTab('玩家乙');
  const p3 = await openTab('玩家丙');
  const watch = await openTab('觀戰');
  const tabs = [host, p2, p3, watch];
  await boot(host, '房主小明');
  await boot(p2, '玩家乙');
  await boot(p3, '玩家丙');
  await boot(watch, '觀戰者');

  /* ---------------- 1. 首頁與大廳 ---------------- */
  console.log('\n【首頁與接力大廳】');
  check('首頁有「接力模式（Beta）」入口', await host.eval('var b=document.getElementById("b-relay"); return !!b && /接力模式/.test(b.textContent);'));
  await sweep(host, '01-首頁', { one: !process.env.RELAY_HOME_ALL });
  await host.click('#b-relay');
  await host.waitFor('window.Online && window.Online.isConnected() && !document.getElementById("b-lobby-host").disabled', 15000, '接力大廳連線');
  check('接力大廳標題與說明', await host.eval('return /接力/.test(document.getElementById("lobby-title").textContent) && !document.getElementById("relay-lobby-note").hidden;'));
  await sweep(host, '02-接力大廳-空');
  await host.click('#b-lobby-host');
  await host.waitFor('document.getElementById("room-create-modal").classList.contains("open")', 4000, '開房彈窗');
  const fields = await host.eval('function vis(id){var l=document.querySelector("label[for="+id+"]");return !!l && !l.hidden;} return {gr:vis("room-create-guessrounds"),bt:vis("room-create-baton"),rd:vis("room-create-rounds"),ds:vis("room-create-drawsec"),title:document.getElementById("room-create-title").textContent};');
  check('開接力房彈窗：顯示猜題次數與每棒秒數', fields.gr && fields.bt, JSON.stringify(fields));
  check('開接力房彈窗：不顯示一般模式的畫幾次／秒數', !fields.rd && !fields.ds, JSON.stringify(fields));
  check('開接力房彈窗標題', /接力/.test(fields.title), fields.title);
  /* 每棒選 17 秒，截圖時才有時間在各尺寸之間切換 */
  await host.eval('var s=document.getElementById("room-create-baton"); s.value="17"; s.dispatchEvent(new Event("change",{bubbles:true})); return 1;');
  await sweep(host, '03-開接力房彈窗');
  await host.click('#room-create-submit');
  await host.waitFor('window.DrawGuessApp.view && window.DrawGuessApp.view.room && window.DrawGuessApp.view.room.mode === "relay"', 6000, '進入接力房');
  const code = await host.eval('return window.DrawGuessApp.roomCode;');
  const created = await host.view();
  check('房間設定套用每棒 17 秒', created.room.settings.batonSec === 17, JSON.stringify(created.room.settings));

  /* 觀戰分頁先去一般大廳，確認看不到接力房 */
  await watch.click('#b-online');
  await watch.waitFor('window.Online && window.Online.isConnected()', 15000, '一般大廳連線');
  await sleep(800);
  check('一般大廳看不到接力房', await watch.eval('return !document.querySelector(' + JSON.stringify('#roomlist [data-code="' + code + '"]') + ');'));
  await watch.click('[data-back="s-home"]');

  for (const t of [p2, p3, watch]) {
    await t.click('#b-relay');
    await t.waitFor('window.Online && window.Online.isConnected()', 15000, '接力大廳連線');
    await t.waitFor('document.querySelector(' + JSON.stringify('#roomlist [data-code="' + code + '"]') + ')', 6000, '接力大廳列出房間');
  }
  await sweep(p2, '04-接力大廳-有房間');
  await p2.click('#roomlist button[data-act=join][data-code=' + JSON.stringify(code) + ']');
  await p3.click('#roomlist button[data-act=join][data-code=' + JSON.stringify(code) + ']');
  await watch.click('#roomlist button[data-act=watch][data-code=' + JSON.stringify(code) + ']');
  for (const t of [p2, p3, watch]) await t.waitFor('window.DrawGuessApp.view && window.DrawGuessApp.view.room && window.DrawGuessApp.view.room.code === ' + JSON.stringify(code), 6000, '進房');
  await p2.click('[data-act=ready]');
  await p3.click('[data-act=ready]');
  await host.waitFor('window.DrawGuessApp.view.you.can.start', 6000, '可以開始');
  await sweep(host, '05-等待畫面-房主');
  await sweep(p2, '05-等待畫面-玩家', { one: true });
  if (STOP_AFTER === 'setup') return finish(tabs);

  await relayGame(host, p2, p3, watch, tabs);
  return finish(tabs);
}

const GAME = 'var g=window.DrawGuessApp.view&&window.DrawGuessApp.view.game;';

async function gameOf(tab) {
  return tab.eval(GAME + 'var v=window.DrawGuessApp.view; return g ? {phase:g.phase,q:g.questionNo,role:g.you.role,isNext:g.you.isNext,answer:g.answer,guesser:g.guesserId,me:v.you.id,roomPhase:v.room.phase} : (v ? {roomPhase:v.room.phase} : null);');
}

async function findTab(tabs, test) {
  for (const t of tabs) { const g = await gameOf(t); if (g && test(g)) return t; }
  return null;
}

async function drag(tab, fx, fy, tx, ty) {
  const r = await tab.eval('var b=document.getElementById("board").getBoundingClientRect(); return {x:b.left,y:b.top,w:b.width,h:b.height};');
  const at = (fxr, fyr) => ({ x: Math.round(r.x + r.w * fxr), y: Math.round(r.y + r.h * fyr) });
  const a = at(fx, fy), b = at(tx, ty);
  await tab.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: a.x, y: a.y, button: 'left', clickCount: 1 });
  for (let i = 1; i <= 8; i++) {
    await tab.send('Input.dispatchMouseEvent', { type: 'mouseMoved', button: 'left', buttons: 1, x: Math.round(a.x + (b.x - a.x) * i / 8), y: Math.round(a.y + (b.y - a.y) * i / 8) });
  }
  await tab.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await sleep(150);
}

async function typeAndSend(tab, text) {
  await tab.eval('var i=document.getElementById("guess-input"); i.value=' + JSON.stringify(text) + '; i.dispatchEvent(new Event("input",{bubbles:true})); document.getElementById("guessbar").requestSubmit(); return 1;');
  await sleep(500);
}

const visible = (sel) => 'var e=document.querySelector(' + JSON.stringify(sel) + '); return !!e && !e.hidden && !e.closest("[hidden]") && e.getBoundingClientRect().width > 0;';

async function waitPhase(tab, phase, ms) {
  await tab.waitFor(GAME + 'return g && g.phase === ' + JSON.stringify(phase) + ';', ms || 12000, '階段 ' + phase);
}

async function relayGame(host, p2, p3, watch, tabs) {
  console.log('\n【接力對局】');
  const players = [host, p2, p3];
  await host.click('[data-act=start]');
  for (const t of tabs) await waitPhase(t, 'voting', 6000);
  const guesser = await findTab(players, (g) => g.role === 'guesser');
  const painters = [];
  for (const t of players) if (t !== guesser) painters.push(t);
  check('有一位猜題者、兩位畫家', !!guesser && painters.length === 2);

  /* ---- 投票 ---- */
  check('畫家看到 4 個候選題可以投', await painters[0].eval('return document.querySelectorAll("#overlay-card [data-act=relay-vote]:not([disabled])").length === 4;'));
  check('猜題者看不到候選題', await guesser.eval('return document.querySelectorAll("#overlay-card [data-act=relay-vote]").length === 0 && /猜題者/.test(document.getElementById("overlay-card").textContent);'));
  /* 投票只有 10 秒：這一題先截前半的尺寸，後半留到第二題 */
  await sweep(painters[0], '06-投票-畫家', { list: FIRST_HALF });
  await shot(guesser, '06-投票-猜題者-tablet-land');
  await shot(watch, '06-投票-觀戰-tablet-land');
  await painters[0].click('#overlay-card [data-act=relay-vote]');
  check('投票後顯示票數（不顯示誰投的）', await painters[1].waitFor('document.querySelector("#overlay-card .relay-votes[data-n=\\"1\\"]")', 4000, '票數更新').catch(() => false));
  await painters[1].click('#overlay-card [data-act=relay-vote]');

  /* ---- 倒數 ---- */
  await waitPhase(host, 'countdown', 6000).catch(() => {});
  const cd = await host.eval('var n=document.querySelector("#overlay-card .relay-count-n"); return n ? n.textContent : "";');
  check('投完提前進入 3、2、1 倒數', /^[123]$/.test(cd) || cd === '開始！', cd);
  await shot(host, '07-倒數-tablet-land');
  await shot(guesser, '07-倒數-猜題者-phone');

  /* ---- 作畫中：四種角色 ---- */
  for (const t of tabs) await waitPhase(t, 'drawing', 8000);
  const drawer = await findTab(players, (g) => g.role === 'drawer');
  const waiting = painters.find((t) => t !== drawer);
  const answer = (await gameOf(watch)).answer;
  check('觀戰者看得到答案', !!answer, answer);
  check('當棒畫家有工具列', await drawer.eval(visible('#toolbar')));
  check('等待中的畫家沒有工具列、有表情列', !(await waiting.eval(visible('#toolbar'))) && await waiting.eval(visible('#relay-cheers')));
  check('猜題者有猜題框、提示與放棄', await guesser.eval(visible('#guess-input')) && await guesser.eval(visible('#b-hint-1')) && await guesser.eval(visible('#b-relay-giveup')));
  check('猜題者畫面上沒有答案', !(await guesser.eval('return document.body.innerText.indexOf(' + JSON.stringify(answer) + ') >= 0;')));
  check('畫家題目列顯示答案', await waiting.eval('return document.getElementById("wordbar-mask").textContent === ' + JSON.stringify(answer) + ';'));
  check('等待中的畫家底部框是畫家聊天', await waiting.eval('return document.getElementById("guessbar").getAttribute("data-mode") === "chat";'));
  check('玩家列標出正在畫與下一棒', await host.eval('return !!document.querySelector("#playerstrip .relay-now") && !!document.querySelector("#playerstrip .relay-guesser");'));
  await drag(drawer, 0.25, 0.3, 0.75, 0.7);
  await drag(drawer, 0.7, 0.25, 0.3, 0.75);
  check('當棒畫家畫得出筆畫，其他人同步收到', await guesser.waitFor('window.DrawGuessApp.paint.count() >= 2', 4000, '筆畫同步').catch(() => false));
  check('等待中的畫家點畫布畫不出來', await (async () => { const before = await waiting.eval('return window.DrawGuessApp.paint.count();'); await drag(waiting, 0.2, 0.2, 0.4, 0.4); return (await waiting.eval('return window.DrawGuessApp.paint.count();')) === before; })());

  await typeAndSend(waiting, '畫大一點啦');
  check('畫家聊天出現在其他畫家的紀錄', await drawer.waitFor('Array.from(document.querySelectorAll("#sum-list li[data-k=chat], #guess-feed li[data-k=chat]")).some(function(li){return /畫大一點啦/.test(li.textContent);})', 4000, '聊天').catch(() => false));
  check('猜題者看不到畫家聊天', !(await guesser.eval('return /畫大一點啦/.test(document.body.innerText);')));
  await waiting.click('#relay-cheers [data-cheer=lol]');
  check('表情飄到當棒畫家的畫布上', await drawer.waitFor('document.querySelector("#relay-cheer-layer .relay-cheer")', 3000, '表情').catch(() => false));
  check('猜題者看不到表情', !(await guesser.eval('return !!document.querySelector("#relay-cheer-layer .relay-cheer");')));
  await guesser.eval('var i=document.getElementById("guess-input"); i.value="貓"; i.dispatchEvent(new Event("input",{bubbles:true})); return 1;');
  check('畫家看得到「輸入中…」', await waiting.waitFor('(function(){var c=document.getElementById("relay-typing-chip"); return c && !c.hidden && /輸入中/.test(c.textContent);})()', 4000, '輸入中').catch(() => false));
  await guesser.eval('document.getElementById("guess-input").value=""; return 1;');

  await sweep(drawer, '08-作畫-當棒畫家');
  await sweep(waiting, '08-作畫-等待畫家');
  await sweep(guesser, '08-作畫-猜題者');
  await shot(watch, '08-作畫-觀戰-tablet-land');

  /* ---- 換棒 ---- */
  await waitPhase(host, 'handoff', 20000);
  const next = await findTab(players, (g) => g.isNext);
  check('換棒時下一棒看到「換你畫！」', !!next && await next.eval('var b=document.getElementById("relay-banner"); return !b.hidden && /換你畫/.test(b.textContent);'));
  check('換棒緩衝中畫布鎖住', !(await drawer.eval('return window.DrawGuessApp.view.you.can.draw;')));
  if (next) await sweep(next, '09-換棒-下一棒', { one: !ALL_SIZES });
  await shot(guesser, '09-換棒-猜題者-tablet-land');

  /* ---- 猜錯、提示、猜中 ---- */
  await typeAndSend(guesser, '一定不是這個');
  check('猜錯內容大家都看得到', await watch.waitFor('/一定不是這個/.test(document.getElementById("sum-list").textContent)', 4000, '猜錯紀錄').catch(() => false));
  await waitPhase(host, 'drawing', 6000).catch(() => {});
  await guesser.click('#b-hint-1');
  check('猜題者用了提示（字數）', await guesser.waitFor(GAME + 'return g.hint && g.hint.step === 1;', 4000, '提示').catch(() => false));
  await typeAndSend(guesser, answer);
  await waitPhase(host, 'reveal', 6000);
  check('猜中後公布答案', (await gameOf(guesser)).answer === answer);
  await guesser.click('#overlay-card [data-act=react][data-kind=heart]');
  check('公布時可以對整張圖按愛心', await host.waitFor(GAME + 'return g.reactions && g.reactions.counts.heart === 1;', 4000, '表情').catch(() => false));
  /* 公布只停 7 秒：一樣分兩題截 */
  await sweep(guesser, '10-公布', { list: FIRST_HALF });

  /* ---- 其餘題目：放棄，直到結算 ---- */
  for (let q = 2; q <= 3; q++) {
    for (const t of tabs) await waitPhase(t, 'voting', 12000);
    const gTab = await findTab(players, (g) => g.role === 'guesser');
    const pTab = players.find((t) => t !== gTab);
    if (q === 2) await sweep(pTab, '06-投票-畫家', { list: SECOND_HALF });
    if (q === 3) await sweep(gTab, '06-投票-猜題者', { list: FIRST_HALF });
    for (const t of players) if (t !== gTab) await t.click('#overlay-card [data-act=relay-vote]');
    await waitPhase(gTab, 'drawing', 8000);
    await gTab.click('#b-relay-giveup');
    await gTab.waitFor('document.getElementById("confirm-modal").classList.contains("open")', 3000, '放棄確認');
    if (q === 2) await shot(gTab, '11-放棄確認-tablet-land');
    await gTab.click('#confirm-ok');
    await waitPhase(host, 'reveal', 5000);
    check('第 ' + q + ' 題放棄 → 公布答案', true);
    if (q === 2) await sweep(gTab, '10-公布', { list: SECOND_HALF });
  }
  await host.waitFor('window.DrawGuessApp.view.room.phase === "finished"', 12000, '結算');
  await host.waitFor('document.querySelectorAll("#overlay-card .gal-item").length >= 1', 8000, '畫廊').catch(() => {});
  check('結算有三個獎項', await host.eval('return document.querySelectorAll("#overlay-card .relay-award").length === 3;'));
  check('畫廊列出接力畫家', await host.eval('var b=document.querySelector("#overlay-card .gal-by"); return !!b && b.textContent.length > 0;'));
  await sweep(host, '12-結算');

  /* ---- 英文版：再來一局 ---- */
  console.log('\n【英文版】');
  for (const t of tabs) await t.eval('window.I18N.setLang("en"); return 1;');
  await sleep(300);
  await sweep(host, '13-結算-en', { one: !ALL_SIZES });
  await host.click('[data-act=online-rematch]');
  for (const t of tabs) await waitPhase(t, 'voting', 6000);
  const eg = await findTab(players, (g) => g.role === 'guesser');
  const ep = players.find((t) => t !== eg);
  await sweep(ep, '14-投票-en');
  for (const t of players) if (t !== eg) await t.click('#overlay-card [data-act=relay-vote]');
  await waitPhase(eg, 'drawing', 8000);
  const ed = await findTab(players, (g) => g.role === 'drawer');
  await sweep(eg, '15-作畫-猜題者-en');
  await sweep(ed, '15-作畫-當棒畫家-en', { one: true });
  check('英文版的接力文字沒有中文殘留', !(await eg.eval('var t=[document.getElementById("phase-chip"),document.getElementById("wordbar"),document.getElementById("hintrow"),document.getElementById("playerstrip")].map(function(e){return e?e.innerText:"";}).join(" "); return /[\\u3400-\\u9fff]/.test(t.replace(/玩家[乙丙]|房主小明|觀戰者/g,""));')));
}

async function finish(tabs) {
  for (const t of tabs) check(t.label + '：主控台沒有錯誤', t.errors.length === 0, t.errors.slice(0, 3).join(' | '));
}

function cleanup() {
  try { if (chromeProc) chromeProc.kill(); } catch (e) {}
  try { if (serverProc) serverProc.kill(); } catch (e) {}
  try { fs.rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) {}
}

main()
  .catch((e) => { failures.push('中斷：' + (e && e.stack ? e.stack : e)); console.error('\n✗ ' + (e && e.stack ? e.stack : e)); })
  .then(() => {
    cleanup();
    console.log('\n截圖：' + SHOTS);
    console.log(failures.length ? '✗ 接力瀏覽器巡檢失敗 ' + failures.length + ' 項' : '✓ 接力瀏覽器巡檢通過');
    setTimeout(() => process.exit(failures.length ? 1 : 0), 300);
  });
