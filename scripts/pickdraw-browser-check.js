/*
 * scripts/pickdraw-browser-check.js — 你出我畫他猜（Beta）的瀏覽器巡檢
 * 執行：node scripts/pickdraw-browser-check.js            （會自己啟動 server.js 與無頭 Chrome）
 *       STOP_AFTER=setup node scripts/pickdraw-browser-check.js   只跑到等待畫面
 *
 * 零外部套件：用 Node 內建的 fetch 與 WebSocket 講 Chrome DevTools Protocol（與接力巡檢同一套）。
 * 四個分頁各自在獨立的瀏覽器情境：房主、玩家乙、玩家丙、第 4 人（房間已滿只能觀戰）。
 *
 * 檢查項目
 *   1. 首頁有入口；這個大廳只列這種房，一般與接力大廳看不到
 *   2. 開房彈窗只顯示圈數與每題秒數（30／60／90）；第 4 人只能觀戰
 *   3. 等待、挑題、倒數、作畫（出題者／畫家／猜題者／觀戰）、公布、結算
 *      在 8 種尺寸與英文版都不可水平溢出、主要按鈕不能被裁到畫面外
 *   4. 猜題者畫面不出現答案；角色輪替；15 秒沒挑自動隨機；剩不到 3 人立即結算；主控台沒有錯誤
 * 截圖存到 screenshots/pickdraw/（已在 .gitignore）。
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.CHECK_PORT || 3134);
const BASE = 'http://127.0.0.1:' + PORT + '/';
const DEBUG_PORT = Number(process.env.CDP_PORT || 9347);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'draw-guess-pickdraw-'));
const SHOTS = path.join(ROOT, 'screenshots', 'pickdraw');
const STOP_AFTER = process.env.STOP_AFTER || '';
const ALL_SIZES = process.env.PD_SIZES !== 'few';

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
  console.log('\n【首頁與你出我畫他猜大廳】');
  check('首頁有「你出我畫他猜（Beta）」入口', await host.eval('var b=document.getElementById("b-pickdraw"); return !!b && /你出我畫他猜/.test(b.textContent);'));
  await sweep(host, '01-首頁', { one: !process.env.PD_HOME_ALL });
  await host.click('#b-pickdraw');
  await host.waitFor('window.Online && window.Online.isConnected() && !document.getElementById("b-lobby-host").disabled', 15000, '大廳連線');
  check('大廳標題與說明', await host.eval('return /你出我畫他猜/.test(document.getElementById("lobby-title").textContent) && !document.getElementById("pickdraw-lobby-note").hidden && document.getElementById("relay-lobby-note").hidden;'));
  await sweep(host, '02-大廳-空');
  await host.click('#b-lobby-host');
  await host.waitFor('document.getElementById("room-create-modal").classList.contains("open")', 4000, '開房彈窗');
  const fields = await host.eval('function vis(id){var l=document.querySelector("label[for="+id+"]");return !!l && !l.hidden;} return {laps:vis("room-create-laps"),sec:vis("room-create-pdsec"),gr:vis("room-create-guessrounds"),rd:vis("room-create-rounds"),ds:vis("room-create-drawsec"),title:document.getElementById("room-create-title").textContent,opts:Array.from(document.getElementById("room-create-pdsec").options).map(function(o){return o.value;}).join(",")};');
  check('開房彈窗：顯示圈數與每題秒數', fields.laps && fields.sec, JSON.stringify(fields));
  check('開房彈窗：不顯示一般模式與接力的欄位', !fields.rd && !fields.ds && !fields.gr, JSON.stringify(fields));
  check('每題秒數只有 30／60／90', fields.opts === '30,60,90', fields.opts);
  check('開房彈窗標題', /你出我畫他猜/.test(fields.title), fields.title);
  /* 選 90 秒、1 圈：作畫中有時間在各尺寸之間切換截圖，一圈 3 題剛好每人每種角色一次 */
  await host.eval('var s=document.getElementById("room-create-pdsec"); s.value="90"; s.dispatchEvent(new Event("change",{bubbles:true})); var l=document.getElementById("room-create-laps"); l.value="1"; l.dispatchEvent(new Event("change",{bubbles:true})); return 1;');
  await sweep(host, '03-開房彈窗');
  await host.click('#room-create-submit');
  await host.waitFor('window.DrawGuessApp.view && window.DrawGuessApp.view.room && window.DrawGuessApp.view.room.mode === "pickdraw"', 6000, '進入房間');
  const code = await host.eval('return window.DrawGuessApp.roomCode;');
  const created = await host.view();
  check('房間設定套用 90 秒、1 圈、上限 3 人', created.room.settings.drawSec === 90 && created.room.settings.laps === 1 && created.room.settings.maxPlayers === 3, JSON.stringify(created.room.settings));

  /* 觀戰分頁先去一般與接力大廳，確認看不到這種房 */
  await watch.click('#b-online');
  await watch.waitFor('window.Online && window.Online.isConnected()', 15000, '一般大廳連線');
  await sleep(800);
  check('一般大廳看不到這種房', await watch.eval('return !document.querySelector(' + JSON.stringify('#roomlist [data-code="' + code + '"]') + ');'));
  await watch.click('[data-back="s-home"]');
  await watch.click('#b-relay');
  await sleep(1000);
  check('接力大廳看不到這種房', await watch.eval('return !document.querySelector(' + JSON.stringify('#roomlist [data-code="' + code + '"]') + ');'));
  await watch.click('[data-back="s-home"]');

  for (const t of [p2, p3, watch]) {
    await t.click('#b-pickdraw');
    await t.waitFor('window.Online && window.Online.isConnected()', 15000, '大廳連線');
    await t.waitFor('document.querySelector(' + JSON.stringify('#roomlist [data-code="' + code + '"]') + ')', 6000, '大廳列出房間');
  }
  check('房間卡片有模式標記', await p2.eval('return !!document.querySelector(' + JSON.stringify('#roomlist [data-code="' + code + '"]') + ').closest("li,article,div").parentElement.querySelector(".rc-rule[data-k=pdmode]");'));
  await sweep(p2, '04-大廳-有房間');
  await p2.click('#roomlist button[data-act=join][data-code=' + JSON.stringify(code) + ']');
  await p2.waitFor('window.DrawGuessApp.view && window.DrawGuessApp.view.room && window.DrawGuessApp.view.room.code === ' + JSON.stringify(code), 6000, '進房');
  await p3.click('#roomlist button[data-act=join][data-code=' + JSON.stringify(code) + ']');
  await p3.waitFor('window.DrawGuessApp.view && window.DrawGuessApp.view.room && window.DrawGuessApp.view.room.code === ' + JSON.stringify(code), 6000, '進房');
  /* 第 4 個人想當玩家：房間已滿，伺服器轉為觀戰 */
  await watch.waitFor('(function(){var b=document.querySelector(' + JSON.stringify('#roomlist button[data-act=join][data-code="' + code + '"]') + '); return !b || b.disabled || true;})()', 3000, '列表更新');
  const joinBtn = await watch.eval('var b=document.querySelector(' + JSON.stringify('#roomlist button[data-act=join][data-code="' + code + '"]') + '); return b ? !b.disabled : false;');
  if (joinBtn) await watch.click('#roomlist button[data-act=join][data-code=' + JSON.stringify(code) + ']');
  else await watch.click('#roomlist button[data-act=watch][data-code=' + JSON.stringify(code) + ']');
  await watch.waitFor('window.DrawGuessApp.view && window.DrawGuessApp.view.room && window.DrawGuessApp.view.room.code === ' + JSON.stringify(code), 6000, '進房');
  check('第 4 人只能觀戰', (await watch.view()).you.role === 'spectator');
  await p2.click('[data-act=ready]');
  await p3.click('[data-act=ready]');
  await host.waitFor('window.DrawGuessApp.view.you.can.start', 6000, '可以開始');
  check('等待畫面有模式徽章與角色輪替說明', await host.eval('return !!document.querySelector("#overlay-card .pickdraw-badge") && /輪流/.test(document.getElementById("overlay-card").textContent);'));
  await sweep(host, '05-等待畫面-房主');
  await sweep(p2, '05-等待畫面-玩家', { one: true });
  await sweep(watch, '05-等待畫面-觀戰', { one: true });
  if (STOP_AFTER === 'setup') return finish(tabs);

  await pickdrawGame(host, p2, p3, watch, tabs);
  return finish(tabs);
}

const GAME = 'var g=window.DrawGuessApp.view&&window.DrawGuessApp.view.game;';

async function gameOf(tab) {
  return tab.eval(GAME + 'var v=window.DrawGuessApp.view; return g ? {phase:g.phase,q:g.questionNo,role:g.you.role,answer:g.answer,me:v.you.id,roomPhase:v.room.phase} : (v ? {roomPhase:v.room.phase} : null);');
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

async function roles(players) {
  return {
    picker: await findTab(players, (g) => g.role === 'picker'),
    drawer: await findTab(players, (g) => g.role === 'drawer'),
    guesser: await findTab(players, (g) => g.role === 'guesser')
  };
}

async function pickdrawGame(host, p2, p3, watch, tabs) {
  console.log('\n【你出我畫他猜對局】');
  const players = [host, p2, p3];
  await host.click('[data-act=start]');
  for (const t of tabs) await waitPhase(t, 'picking', 6000);
  const r1 = await roles(players);
  check('三種角色各一人', !!r1.picker && !!r1.drawer && !!r1.guesser);
  check('第 1 題房主出題', r1.picker === host);

  /* ---- 挑題 ---- */
  check('出題者看到 3 個候選題可以挑', await r1.picker.eval('return document.querySelectorAll("#overlay-card [data-act=pickdraw-pick]:not([disabled])").length === 3;'));
  check('畫家與猜題者看不到候選題', await r1.drawer.eval('return document.querySelectorAll("#overlay-card [data-act=pickdraw-pick]").length === 0;') &&
    await r1.guesser.eval('return document.querySelectorAll("#overlay-card [data-act=pickdraw-pick]").length === 0 && /挑題/.test(document.getElementById("overlay-card").textContent);'));
  check('三人角色列', await host.eval('return document.querySelectorAll("#playerstrip .pcard").length === 3 && !!document.querySelector("#playerstrip .pd-picker") && !!document.querySelector("#playerstrip .pd-drawer") && !!document.querySelector("#playerstrip .pd-guesser");'));
  /* 挑題只有 15 秒：這一題先截前半的尺寸，後半留到第二題 */
  await sweep(r1.picker, '06-挑題-出題者', { list: FIRST_HALF });
  await shot(r1.drawer, '06-挑題-畫家-tablet-land');
  await shot(r1.guesser, '06-挑題-猜題者-phone');
  await r1.picker.click('#overlay-card [data-act=pickdraw-pick]');

  /* ---- 倒數 ---- */
  await waitPhase(host, 'countdown', 6000).catch(() => {});
  const cd = await r1.drawer.eval('var n=document.querySelector("#overlay-card .relay-count-n"); return n ? n.textContent : "";');
  check('挑完進入 3、2、1 倒數', /^[123]$/.test(cd) || cd === '開始！', cd);
  await shot(r1.drawer, '07-倒數-畫家-tablet-land');
  await shot(r1.guesser, '07-倒數-猜題者-phone');

  /* ---- 作畫中：四種角色 ---- */
  for (const t of tabs) await waitPhase(t, 'drawing', 8000);
  const answer = (await gameOf(watch)).answer;
  check('觀戰者看得到答案', !!answer, answer);
  check('畫家有工具列與提示鈕', await r1.drawer.eval(visible('#toolbar')) && await r1.drawer.eval(visible('#b-hint-1')));
  check('出題者沒有工具列、沒有猜題框、有表情列', !(await r1.picker.eval(visible('#toolbar'))) && !(await r1.picker.eval(visible('#guess-input'))) && await r1.picker.eval(visible('#relay-cheers')));
  check('猜題者有猜題框與放棄、沒有提示鈕', await r1.guesser.eval(visible('#guess-input')) && await r1.guesser.eval(visible('#b-relay-giveup')) && !(await r1.guesser.eval(visible('#b-hint-1'))));
  check('猜題者畫面上沒有答案', !(await r1.guesser.eval('return document.body.innerText.indexOf(' + JSON.stringify(answer) + ') >= 0;')));
  check('畫家題目列顯示答案', await r1.drawer.eval('return document.getElementById("wordbar-mask").textContent === ' + JSON.stringify(answer) + ';'));
  check('出題者題目列顯示自己出的題', await r1.picker.eval('return document.getElementById("wordbar-mask").textContent === ' + JSON.stringify(answer) + ';'));
  check('沒有「畫完了／跳過」', !(await r1.drawer.eval(visible('#b-done'))) && !(await r1.drawer.eval(visible('#b-skip'))));
  /* 查看範本：只有畫家有入口，打開看得到範本圖 */
  check('畫家有「查看範本」', await r1.drawer.eval(visible('#b-reference')));
  check('出題者、猜題者、觀戰者沒有「查看範本」', !(await r1.picker.eval(visible('#b-reference'))) &&
    !(await r1.guesser.eval(visible('#b-reference'))) && !(await watch.eval(visible('#b-reference'))));
  await r1.drawer.click('#b-reference');
  check('範本視窗打開並畫出範本圖', await r1.drawer.waitFor('document.getElementById("reference-modal").classList.contains("open") && !!document.querySelector("#reference-picture svg")', 4000, '範本').catch(() => false));
  await shot(r1.drawer, '08-作畫-畫家-範本-tablet-land');
  await r1.drawer.click('#reference-close');
  await r1.drawer.waitFor('!document.getElementById("reference-modal").classList.contains("open")', 3000, '關閉範本').catch(() => {});
  await drag(r1.drawer, 0.25, 0.3, 0.75, 0.7);
  await drag(r1.drawer, 0.7, 0.25, 0.3, 0.75);
  check('畫家畫得出筆畫，其他人同步收到', await r1.guesser.waitFor('window.DrawGuessApp.paint.count() >= 2', 4000, '筆畫同步').catch(() => false));
  check('出題者點畫布畫不出來', await (async () => { const before = await r1.picker.eval('return window.DrawGuessApp.paint.count();'); await drag(r1.picker, 0.2, 0.2, 0.4, 0.4); return (await r1.picker.eval('return window.DrawGuessApp.paint.count();')) === before; })());
  await r1.picker.click('#relay-cheers [data-cheer=lol]');
  check('出題者的表情飄到畫家畫布上', await r1.drawer.waitFor('document.querySelector("#relay-cheer-layer .relay-cheer")', 3000, '表情').catch(() => false));
  await r1.drawer.click('#b-hint-1');
  check('畫家給提示，猜題者看到字數', await r1.guesser.waitFor(GAME + 'return g.hint && g.hint.step === 1;', 4000, '提示').catch(() => false));

  await sweep(r1.drawer, '08-作畫-畫家');
  await sweep(r1.picker, '08-作畫-出題者');
  await sweep(r1.guesser, '08-作畫-猜題者');
  await sweep(watch, '08-作畫-觀戰', { one: true });

  /* ---- 猜錯、猜中 ---- */
  await typeAndSend(r1.guesser, '一定不是這個');
  check('猜錯內容大家都看得到', await watch.waitFor('/一定不是這個/.test(document.getElementById("sum-list").textContent)', 4000, '猜錯紀錄').catch(() => false));
  await sleep(500);
  await typeAndSend(r1.guesser, answer);
  await waitPhase(host, 'reveal', 6000);
  check('猜中後公布答案', (await gameOf(r1.guesser)).answer === answer);
  check('公布卡列出三人得分', await host.eval('return document.querySelectorAll("#overlay-card .pd-score-row").length === 3;'));
  check('公布卡有完成圖', await host.waitFor('document.querySelector("#overlay-card .react-thumb")', 3000, '完成圖').catch(() => false));
  await r1.guesser.click('#overlay-card [data-act=react][data-kind=heart]');
  check('公布時可以按愛心', await host.waitFor(GAME + 'return g.reactions && g.reactions.counts.heart === 1;', 4000, '表情').catch(() => false));
  await sweep(r1.guesser, '10-公布', { list: FIRST_HALF });

  /* ---- 第 2 題：角色輪替；後半尺寸截圖；放棄 ---- */
  for (const t of tabs) await waitPhase(t, 'picking', 12000);
  const r2 = await roles(players);
  check('第 2 題：上一題畫家變出題者', r2.picker === r1.drawer && r2.drawer === r1.guesser && r2.guesser === r1.picker);
  await sweep(r2.picker, '06-挑題-出題者', { list: SECOND_HALF });
  await sweep(r2.guesser, '06-挑題-等待', { list: FIRST_HALF });
  await r2.picker.click('#overlay-card [data-act=pickdraw-pick]');
  await waitPhase(r2.guesser, 'drawing', 8000);
  await r2.guesser.click('#b-relay-giveup');
  await r2.guesser.waitFor('document.getElementById("confirm-modal").classList.contains("open")', 3000, '放棄確認');
  check('放棄確認說明出題者拿 300', await r2.guesser.eval('return /300/.test(document.getElementById("confirm-modal").textContent);'));
  await shot(r2.guesser, '11-放棄確認-tablet-land');
  await r2.guesser.click('#confirm-ok');
  await waitPhase(host, 'reveal', 5000);
  check('第 2 題放棄 → 公布答案', true);
  await sweep(r2.guesser, '10-公布', { list: SECOND_HALF });

  /* ---- 第 3 題：出題者不挑，15 秒後自動隨機；放棄 ---- */
  for (const t of tabs) await waitPhase(t, 'picking', 12000);
  const r3 = await roles(players);
  await waitPhase(host, 'countdown', 18000);
  check('15 秒沒挑：自動隨機挑題', true);
  await waitPhase(r3.guesser, 'drawing', 8000);
  await r3.guesser.click('#b-relay-giveup');
  await r3.guesser.waitFor('document.getElementById("confirm-modal").classList.contains("open")', 3000, '放棄確認');
  await r3.guesser.click('#confirm-ok');

  await host.waitFor('window.DrawGuessApp.view.room.phase === "finished"', 15000, '結算');
  await host.waitFor('document.querySelectorAll("#overlay-card .gal-item").length >= 1', 8000, '畫廊').catch(() => {});
  check('結算有三個獎項', await host.eval('return document.querySelectorAll("#overlay-card .relay-award").length === 3 && /整人王/.test(document.getElementById("overlay-card").textContent);'));
  check('結算畫廊有完成圖', await host.eval('return document.querySelectorAll("#overlay-card .gal-item").length >= 1;'));
  await sweep(host, '12-結算');

  /* ---- 英文版：再來一局 ---- */
  console.log('\n【英文版】');
  for (const t of tabs) await t.eval('window.I18N.setLang("en"); return 1;');
  await sleep(300);
  await sweep(host, '13-結算-en', { one: !ALL_SIZES });
  await host.click('[data-act=online-rematch]');
  for (const t of tabs) await waitPhase(t, 'picking', 6000);
  const e1 = await roles(players);
  await sweep(e1.picker, '14-挑題-en');
  await e1.picker.click('#overlay-card [data-act=pickdraw-pick]');
  await waitPhase(e1.guesser, 'drawing', 8000);
  await sweep(e1.guesser, '15-作畫-猜題者-en');
  await sweep(e1.drawer, '15-作畫-畫家-en', { one: true });
  await sweep(e1.picker, '15-作畫-出題者-en', { one: true });
  check('英文版的對局文字沒有中文殘留', !(await e1.guesser.eval('var t=[document.getElementById("phase-chip"),document.getElementById("wordbar"),document.getElementById("hintrow"),document.getElementById("playerstrip")].map(function(e){return e?e.innerText:"";}).join(" "); return /[\\u3400-\\u9fff]/.test(t.replace(/玩家[乙丙]|房主小明|觀戰者/g,""));')));

  /* ---- 有人離開：剩不到 3 人立即結算 ---- */
  await e1.picker.eval('window.Online.send("room:leave", {}); return 1;');
  check('剩不到 3 人立即結算', await (e1.drawer).waitFor('window.DrawGuessApp.view.room.phase === "finished"', 6000, '結算').catch(() => false));
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
    console.log(failures.length ? '✗ 你出我畫他猜瀏覽器巡檢失敗 ' + failures.length + ' 項' : '✓ 你出我畫他猜瀏覽器巡檢通過');
    setTimeout(() => process.exit(failures.length ? 1 : 0), 300);
  });
