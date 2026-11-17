/*
 * scripts/gallery-check.cjs — 公布表情、最佳畫家與本局畫廊的實機畫面檢查
 * 執行：node scripts/gallery-check.cjs   （會自己啟動 server.js 與無頭 Chrome／Edge）
 *
 * 一個真的瀏覽器分頁（玩家「小畫」）＋一個 socket.io 機器人房主（「阿機」）跑完整一局（每人畫 1 次）：
 *   1. 兩題都有畫東西，瀏覽器在當猜題者的那一題按 ❤️，機器人在另一題按 👏。
 *   2. 公布答案卡：表情列在手機直向／平板橫向／桌機下不溢出、命中區 ≥46px。
 *   3. 結算：最佳畫家與畫廊縮圖在八種尺寸下不溢出；點開看大圖、上一張／下一張、Escape 關閉、焦點歸位。
 *   4. 英文介面也拍一次結算與大圖。
 * 截圖存在 screenshots/gallery-*.png。
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { io } = require('socket.io-client');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.CHECK_PORT || 3141);
const BASE = 'http://127.0.0.1:' + PORT + '/';
const DEBUG_PORT = Number(process.env.CDP_PORT || 9351);
const PROFILE = path.join(ROOT, '.chrome-gallery-test');
const SHOTS = path.join(ROOT, 'screenshots');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWPORTS = [
  { name: '手機窄版直向', width: 360, height: 640, mobile: true, dsf: 2 },
  { name: '手機直向', width: 390, height: 844, mobile: true, dsf: 2 },
  { name: '手機橫向', width: 844, height: 390, mobile: true, dsf: 2 },
  { name: '小手機橫向', width: 667, height: 375, mobile: true, dsf: 2 },
  { name: '平板直向', width: 768, height: 1024, mobile: true, dsf: 1 },
  { name: '平板橫向', width: 1024, height: 768, mobile: true, dsf: 1 },
  { name: '桌機寬版', width: 1440, height: 900, mobile: false, dsf: 1 }
];

const failures = [];
function check(label, ok, detail) {
  if (ok) console.log('  ✓ ' + label);
  else { console.log('  ✗ ' + label + (detail ? ' — ' + detail : '')); failures.push(label); }
}

function findChrome() {
  return [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((c) => fs.existsSync(c)) || null;
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.errors = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id); this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        this.errors.push((msg.params.exceptionDetails.exception || {}).description || 'exception');
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        this.errors.push(msg.params.args.map((a) => a.description || a.value).join(' '));
      }
    });
  }
  send(method, params) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params: params || {} }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('CDP timeout ' + method)); } }, 30000);
    });
  }
  async eval(body) {
    const r = await this.send('Runtime.evaluate', { expression: '(function(){' + body + '})()', returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('頁面例外：' + ((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text));
    return r.result.value;
  }
  async waitFor(expr, ms, label) {
    const end = Date.now() + (ms || 8000);
    while (Date.now() < end) {
      if (await this.eval('try{return !!(' + expr + ')}catch(e){return false}')) return true;
      await sleep(120);
    }
    throw new Error('等不到：' + (label || expr));
  }
}

/* 版面探針：水平溢出與命中區（只看結算卡／公布卡與大圖彈窗） */
const LAYOUT = `
  var vw = innerWidth, out = { scrollWidth: document.documentElement.scrollWidth, wide: [], small: [] };
  var scope = document.querySelectorAll('#overlay-card *, #gallery-modal.open .gallery-panel *');
  for (var i = 0; i < scope.length; i++) {
    var el = scope[i]; if (el.offsetParent === null) continue;
    var r = el.getBoundingClientRect(); if (!r.width) continue;
    if (r.right > vw + 1.5 || r.left < -1.5) out.wide.push((el.id || el.className || el.tagName) + '[' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
    if (el.tagName === 'BUTTON' && (el.closest('.react-bar') || el.closest('.gallery-block') || el.closest('#gallery-modal'))) {
      if (r.width < 46 || r.height < 46) out.small.push((el.id || el.className) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
  }
  out.wide = out.wide.slice(0, 5); out.small = out.small.slice(0, 5);
  return out;`;

function bot(name, clientId) {
  const s = io(BASE, { transports: ['websocket'], forceNew: true, reconnection: false });
  const b = { s, view: null, id: null };
  s.on('room:sync', (v) => { b.view = v; });
  b.ready = new Promise((resolve) => s.on('connect', () => s.emit('hello', { clientId, name }, (r) => { b.id = r.id; resolve(); })));
  b.ask = (evt, p) => new Promise((resolve) => s.emit(evt, p || {}, resolve));
  b.until = async (fn, ms) => { const end = Date.now() + (ms || 8000); while (Date.now() < end) { if (b.view && fn(b.view)) return true; await sleep(60); } return false; };
  return b;
}

async function main() {
  const chrome = findChrome();
  if (!chrome) { console.log('找不到 Chrome／Edge，略過。'); return; }
  fs.mkdirSync(SHOTS, { recursive: true });

  const server = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), HOST: '127.0.0.1', GAME_ALLOWED_ORIGIN: '*', ROOM_TICK_MS: '200' }), stdio: 'ignore'
  });
  let up = false;
  for (let i = 0; i < 40 && !up; i++) { await sleep(200); try { up = (await fetch(BASE + 'health')).ok; } catch (e) {} }
  if (!up) { server.kill(); throw new Error('伺服器沒有啟動'); }
  fs.rmSync(PROFILE, { recursive: true, force: true });
  const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--mute-audio',
    '--remote-debugging-port=' + DEBUG_PORT, '--user-data-dir=' + PROFILE, 'about:blank'], { stdio: 'ignore' });
  const cleanup = () => { try { browser.kill(); } catch (e) {} try { server.kill(); } catch (e) {} };
  process.on('exit', cleanup);

  let target = null;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(300);
    try { target = (await (await fetch('http://127.0.0.1:' + DEBUG_PORT + '/json/list')).json()).find((t) => t.type === 'page'); } catch (e) {}
  }
  if (!target) throw new Error('連不上瀏覽器偵錯埠');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  const cdp = new CDP(ws);
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable');

  const setVp = async (v) => { await cdp.send('Emulation.setDeviceMetricsOverride', { width: v.width, height: v.height, deviceScaleFactor: v.dsf, mobile: v.mobile }); await sleep(260); };
  const shot = async (name) => {
    const res = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, 'gallery-' + name + '.png'), Buffer.from(res.data, 'base64'));
  };
  const layout = async (where, v) => {
    const info = await cdp.eval(LAYOUT);
    check(where + '：沒有水平溢出', info.scrollWidth <= v.width + 2 && !info.wide.length, JSON.stringify(info));
    check(where + '：按鈕命中區 ≥46px', !info.small.length, JSON.stringify(info.small));
  };

  await setVp(VIEWPORTS[1]);
  await cdp.send('Page.navigate', { url: BASE + '?lang=zh-TW' });
  await cdp.waitFor('window.DrawGuessApp && document.getElementById("b-online")', 15000, '頁面初始化');

  /* 機器人開房（每人畫 1 次、60 秒） */
  const host = bot('阿機', 'gallery-bot-host-01');
  await host.ready;
  const created = await host.ask('room:create', { name: '阿機', roomName: '畫廊測試', settings: { rounds: 1, drawSec: 60 } });
  check('機器人開房', created && created.ok, JSON.stringify(created));
  const code = created.code;

  /* 瀏覽器用房號加入 */
  await cdp.eval('document.getElementById("b-online").click()');
  await cdp.waitFor('document.querySelector("#s-lobby.active") && window.Online && Online.status && Online.status() === "connected"', 15000, '進入大廳').catch(() => cdp.waitFor('document.querySelector("#s-lobby.active")', 5000, '大廳'));
  await sleep(600);
  await cdp.eval('var i=document.getElementById("lobby-code"); i.value=' + JSON.stringify(code) + '; document.getElementById("b-lobby-join").click();');
  await cdp.waitFor('document.querySelector("#overlay-card [data-act=ready]")', 10000, '房間等待畫面');
  await cdp.eval('document.querySelector("#overlay-card [data-act=ready]").click()');
  await host.until((v) => v.room.members.some((m) => m.id !== host.id && m.ready), 6000);
  const started = await new Promise((resolve) => { host.s.emit('room:start', {}); setTimeout(resolve, 300); });
  void started;
  check('開局', await host.until((v) => v.room.phase === 'playing', 6000));

  const myId = await cdp.eval('return DrawGuessApp.view && DrawGuessApp.view.you && DrawGuessApp.view.you.id');
  const STROKES = [
    { t: 'ellipse', c: 2, w: 2, f: 1, p: [250, 250, 750, 750] },
    { t: 'pen', c: 0, w: 2, p: [350, 420, 400, 380, 450, 420] },
    { t: 'pen', c: 0, w: 2, p: [550, 420, 600, 380, 650, 420] },
    { t: 'line', c: 1, w: 3, p: [380, 600, 620, 600] }
  ];
  const STROKES2 = [
    { t: 'rect', c: 6, w: 1, f: 1, p: [100, 500, 900, 900] },
    { t: 'ellipse', c: 3, w: 1, f: 1, p: [600, 80, 880, 360] },
    { t: 'line', c: 4, w: 3, p: [100, 500, 500, 200] },
    { t: 'line', c: 4, w: 3, p: [500, 200, 900, 500] }
  ];

  for (let turn = 1; turn <= 2; turn++) {
    await host.until((v) => v.game && v.game.phase === 'picking' && v.game.turnNo === turn, 15000);
    const drawerIsBot = host.view.game.drawerId === host.id;
    console.log('\n▍第 ' + turn + ' 題：畫家是' + (drawerIsBot ? '機器人' : '瀏覽器'));
    if (drawerIsBot) {
      host.s.emit('room:pick', { wordId: host.view.game.choices[0].id });
      await host.until((v) => v.game.phase === 'drawing', 5000);
      for (const st of STROKES) host.s.emit('room:stroke', { stroke: st });
      await sleep(400);
      host.s.emit('room:skip', {});
    } else {
      await cdp.waitFor('document.querySelector("#overlay-card [data-act=pick]")', 8000, '選題卡');
      await cdp.eval('document.querySelector("#overlay-card [data-act=pick]").click()');
      await host.until((v) => v.game.phase === 'drawing', 5000);
      await cdp.eval('var L=' + JSON.stringify(STROKES2) + '; L.forEach(function(s){Online.send("room:stroke",{stroke:s})});');
      await sleep(400);
      await cdp.eval('Online.send("room:skip",{})');
    }
    await cdp.waitFor('document.querySelector("#overlay-card .react-bar")', 6000, '公布卡的表情列');
    if (drawerIsBot) {
      check('猜題者的表情按鈕可以按', await cdp.eval('return !document.querySelector("#overlay-card [data-act=react]").disabled'));
      await cdp.eval('document.querySelector("#overlay-card [data-act=react][data-kind=heart]").click()');
      await cdp.waitFor('document.querySelector("#overlay-card [data-kind=heart]").getAttribute("aria-pressed")==="true"', 4000, '❤️ 按下');
      check('按下後計數變 1', (await cdp.eval('return document.querySelector("#overlay-card [data-kind=heart] .react-count").textContent')) === '1');
      for (const v of [VIEWPORTS[0], VIEWPORTS[3], VIEWPORTS[6]]) {
        await setVp(v);
        await layout('公布卡（猜題者）' + v.name, v);
        await shot('reveal-guesser-' + v.width + 'x' + v.height);
      }
    } else {
      host.s.emit('room:react', { kind: 'clap' });
      await cdp.waitFor('document.querySelector("#overlay-card [data-kind=clap] .react-count").textContent==="1"', 4000, '收到 👏');
      check('畫家的表情按鈕是停用的', await cdp.eval('return document.querySelector("#overlay-card [data-act=react]").disabled'));
      for (const v of [VIEWPORTS[1], VIEWPORTS[5]]) {
        await setVp(v);
        await layout('公布卡（畫家）' + v.name, v);
        await shot('reveal-drawer-' + v.width + 'x' + v.height);
      }
    }
    await setVp(VIEWPORTS[1]);
  }

  console.log('\n▍結算');
  await cdp.waitFor('document.querySelector("#overlay-card .gal-grid .gal-thumb img")', 15000, '畫廊縮圖');
  check('畫廊有兩張', (await cdp.eval('return document.querySelectorAll("#overlay-card .gal-thumb").length')) === 2);
  check('縮圖真的有畫東西', await cdp.eval(`
    var img=document.querySelector('#overlay-card .gal-thumb img'); var c=document.createElement('canvas'); c.width=c.height=60;
    var x=c.getContext('2d'); x.drawImage(img,0,0,60,60); var d=x.getImageData(0,0,60,60).data, n=0;
    for (var i=0;i<d.length;i+=4) if (Math.abs(d[i]-255)+Math.abs(d[i+1]-253)+Math.abs(d[i+2]-248)>30) n++;
    return n>100;`));
  const best = await cdp.eval('var b=document.querySelector("#overlay-card .best-drawer-name"); return b ? b.textContent : ""');
  check('最佳畫家平手並列兩人（各 1 個表情）', best.indexOf('阿機') >= 0 && best.indexOf('、') > 0, best);
  check('最佳畫家在分享範圍內', await cdp.eval('return !!document.querySelector("[data-result-share] .best-drawer")'));
  check('畫廊不在分享範圍內', await cdp.eval('return !document.querySelector("[data-result-share] .gallery-block")'));

  for (const v of VIEWPORTS) {
    await setVp(v);
    await layout('結算 ' + v.name, v);
    await cdp.eval('var g=document.querySelector("#overlay-card .gallery-block"); if(g) g.scrollIntoView({block:"center"})');
    await sleep(150);
    await shot('over-' + v.width + 'x' + v.height);
  }

  console.log('\n▍看大圖');
  for (const v of [VIEWPORTS[0], VIEWPORTS[3], VIEWPORTS[4], VIEWPORTS[6]]) {
    await setVp(v);
    await cdp.eval('var b=document.querySelector("#overlay-card [data-act=gallery-open]"); b.focus(); b.click()');
    await cdp.waitFor('document.querySelector("#gallery-modal.open canvas")', 4000, '大圖');
    await sleep(150);
    await layout('大圖 ' + v.name, v);
    const fit = await cdp.eval('var c=document.querySelector("#gallery-modal.open canvas").getBoundingClientRect(), p=document.getElementById("gallery-panel").getBoundingClientRect(); return {cw:Math.round(c.width),ch:Math.round(c.height),pb:Math.round(p.bottom),vh:innerHeight,pt:Math.round(p.top)}');
    check('大圖 ' + v.name + '：正方形且面板在視窗內', Math.abs(fit.cw - fit.ch) <= 2 && fit.cw >= 150 && fit.pb <= fit.vh + 1 && fit.pt >= -1, JSON.stringify(fit));
    await shot('view-' + v.width + 'x' + v.height);
    const w1 = await cdp.eval('return document.getElementById("gallery-view-word").textContent');
    await cdp.eval('document.getElementById("gallery-next").click()');
    const w2 = await cdp.eval('return document.getElementById("gallery-view-word").textContent');
    check('大圖 ' + v.name + '：下一張會換', w1 !== w2 && (await cdp.eval('return document.getElementById("gallery-view-pos").textContent')).indexOf('2') >= 0);
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await sleep(150);
    check('大圖 ' + v.name + '：Escape 關閉且焦點回到縮圖', await cdp.eval('return !document.querySelector("#gallery-modal.open") && document.activeElement && document.activeElement.getAttribute("data-act")==="gallery-open"'));
  }

  console.log('\n▍手機返回鍵先關大圖');
  await cdp.eval('document.querySelector("#overlay-card [data-act=gallery-open]").click()');
  await cdp.waitFor('document.querySelector("#gallery-modal.open")', 4000);
  await cdp.eval('history.back()');
  await sleep(500);
  check('返回鍵關掉大圖', await cdp.eval('return !document.querySelector("#gallery-modal.open")'));
  check('返回鍵沒有跳出離開確認、還在結算畫面', await cdp.eval('return !document.querySelector("#confirm-modal.open") && !!document.querySelector("#overlay-card .gallery-block")'));

  console.log('\n▍英文介面');
  await cdp.eval('I18N.setLang("en")');
  await sleep(400);
  for (const v of [VIEWPORTS[0], VIEWPORTS[5]]) {
    await setVp(v);
    await layout('英文結算 ' + v.name, v);
    await cdp.eval('var g=document.querySelector("#overlay-card .gallery-block"); if(g) g.scrollIntoView({block:"center"})');
    await shot('over-en-' + v.width + 'x' + v.height);
  }
  check('英文標題', (await cdp.eval('return document.querySelector("#gal-title").textContent')) === 'Game gallery');
  await cdp.eval('document.querySelector("#overlay-card [data-act=gallery-open]").click()');
  await cdp.waitFor('document.querySelector("#gallery-modal.open canvas")', 4000);
  check('英文大圖文字', (await cdp.eval('return document.getElementById("gallery-download").textContent')).indexOf('Download') >= 0);
  await shot('view-en-1024x768');
  await cdp.eval('document.getElementById("gallery-close").click()');

  console.log('\n▍再來一局會清掉畫廊');
  host.s.emit('room:rematch', {});
  await cdp.waitFor('!document.querySelector("#overlay-card .gallery-block")', 8000, '畫廊收起');
  check('再來一局後畫廊收起', true);

  check('主控台沒有錯誤', cdp.errors.length === 0, cdp.errors.slice(0, 3).join(' | '));
  host.s.close();
  console.log('\n' + (failures.length ? '失敗 ' + failures.length + ' 項' : '全部通過'));
  cleanup();
  await sleep(800);
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) { /* Chrome 還鎖著檔案就留給下次 */ }
  process.exit(failures.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
