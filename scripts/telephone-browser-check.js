/*
 * scripts/telephone-browser-check.js — 畫圖傳話（Beta）的瀏覽器巡檢
 * 執行：node scripts/telephone-browser-check.js            （會自己啟動 server.js 與無頭 Chrome）
 *       STOP_AFTER=setup node scripts/telephone-browser-check.js   只跑到等待畫面
 *       TP_SIZES=few 只截基準尺寸（快速確認流程）
 *
 * 零外部套件：用 Node 內建的 fetch 與 WebSocket 講 Chrome DevTools Protocol（與接力巡檢同一套）。
 * 五個分頁各自在獨立的瀏覽器情境：房主、玩家乙、玩家丙、玩家丁、觀戰者。
 *
 * 檢查項目
 *   1. 首頁有入口；這個大廳只列這種房，一般與接力大廳看不到；教學有這個模式
 *   2. 開房彈窗只顯示每張畫、猜答案秒數與輪次
 *   3. 等待、挑題、換手、照畫、等別人、猜答案（提示、偷看）、翻看全部的畫、揭曉、結算
 *      在 8 種尺寸與英文版都不可水平溢出、主要按鈕不能被裁到畫面外
 *   4. 傳話中別人看不到題目與畫；聊天關閉；剩不到 3 人立即結算；主控台沒有錯誤
 * 截圖存到 screenshots/telephone/（已在 .gitignore）。
 */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.CHECK_PORT || 3136);
const BASE = 'http://127.0.0.1:' + PORT + '/';
const DEBUG_PORT = Number(process.env.CDP_PORT || 9349);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'draw-guess-telephone-'));
const SHOTS = path.join(ROOT, 'screenshots', 'telephone');
const STOP_AFTER = process.env.STOP_AFTER || '';
const ALL_SIZES = process.env.TP_SIZES !== 'few';

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
  var out = { overflowX: Math.max(doc.scrollWidth, document.body.scrollWidth) - vw, clipped: [], instructions: 0, clippedText: [] };
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
  var screen = document.querySelector('#gallery-modal.open') || document.querySelector('#room-create-modal.open') || document.querySelector('.screen.active');
  var els = (screen ? screen.querySelectorAll('button, input, select, textarea') : []);
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    if (!visible(el) || el.closest('#game-aside:not(.open)') || el.closest('.scroll-rail')) continue;
    var r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1 || r.bottom > vh + 1 || r.top < -1) && !inScroller(el)) {
      out.clipped.push((el.id || el.getAttribute('data-act') || el.className || el.tagName) + '@' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
  }
  var instructions = document.querySelectorAll('.mode-guide-step, .telephone-lobby-note, .tp-flow-note, .tp-wait-tips > div, .tp-hints-used, .tp-hand-label, .tp-next, .tp-browse-fig figcaption, .sum-line-action');
  for (var note of instructions) {
    var bounds = note.getBoundingClientRect();
    if (!visible(note) || (note.closest('#game-aside') && bounds.right <= 0)) continue;
    out.instructions++;
    if (note.scrollWidth > note.clientWidth + 1 || bounds.left < -1 || bounds.right > vw + 1) {
      out.clippedText.push(note.textContent.trim());
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
    if (v.width > v.height && v.height <= 560) {
      const result = await cdp.eval(`
        const card = document.getElementById('overlay-card');
        const footer = card.querySelector('.party-result ~ .result-btns');
        if (!footer || card.closest('[hidden]') || document.querySelector('#gallery-modal.open')) return null;
        const buttons = Array.from(footer.querySelectorAll('button'), function (button) { return button.getBoundingClientRect(); });
        const name = card.querySelector('.result-hero-name').getBoundingClientRect();
        const first = card.querySelector('.result-row').getBoundingClientRect();
        const top = footer.getBoundingClientRect().top;
        return name.bottom <= top && first.bottom <= top && buttons.every(function (r) {
          return Math.abs(r.top - buttons[0].top) <= 1 && r.bottom <= innerHeight + 1;
        });
      `);
      if (result !== null) check(name + '／' + v.name + '：冠軍與首列排名可見，結算按鈕排成一列', result);
      if (o.drawing || o.picking) {
        const actions = await cdp.eval(`
          const buttons = Array.from(document.querySelectorAll(${JSON.stringify(o.drawing ? '#playbar > .donebox #b-done' : '.tp-choices button')}));
          return {count: buttons.length, visible: buttons.every(function (button) {
            const r = button.getBoundingClientRect();
            return r.top >= 0 && r.bottom <= innerHeight &&
              button.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
          })};
        `);
        check(name + '／' + v.name + '：限時操作無須捲動即可點擊',
          actions.count === (o.drawing ? 1 : 3) && actions.visible, JSON.stringify(actions));
      }
    }
    check(name + '／' + v.name + '：沒有水平溢出', lay.overflowX <= 1, 'overflow ' + lay.overflowX + 'px');
    check(name + '／' + v.name + '：按鈕與輸入框沒被裁到畫面外', lay.clipped.length === 0, lay.clipped.slice(0, 4).join(' | '));
    if (o.instructions || lay.instructions) {
      check(name + '／' + v.name + '：說明文字完整', lay.instructions > 0 && lay.clippedText.length === 0, lay.clippedText.join(' | '));
    }
    if (o.roomSetup) {
      const setup = await cdp.eval(`
        const card = document.getElementById('overlay-card');
        const body = document.getElementById('tp-setup-body');
        const footer = card.querySelector('.tp-setup-actions');
        const diff = body.querySelector('.ruledd-btn[data-field=set-diff]');
        const category = body.querySelector('.ruledd-btn[data-field=set-category]');
        const note = body.querySelector('.tp-flow-note');
        const footerTop = footer.getBoundingClientRect().top;
        const scrollTop = body.scrollTop;
        note.scrollIntoView({block: 'end'});
        const fits = note.getBoundingClientRect().bottom <= footerTop + 1 &&
          note.getBoundingClientRect().top >= body.getBoundingClientRect().top - 1;
        body.scrollTop = scrollTop;
        const bounds = card.getBoundingClientRect();
        return {
          aligned: Math.abs(diff.getBoundingClientRect().top - category.getBoundingClientRect().top) <= 1,
          fits: fits && body.scrollWidth <= body.clientWidth + 1 && bounds.left >= 0 && bounds.right <= innerWidth,
          buttons: Array.from(footer.querySelectorAll('button')).every(function (button) {
            const r = button.getBoundingClientRect();
            return r.bottom <= innerHeight && button.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
          })
        };
      `);
      check(name + '／' + v.name + '：規則欄對齊、說明可捲至完整顯示、房間按鈕可點擊',
        setup.aligned && setup.fits && setup.buttons, JSON.stringify(setup));
    }
    if (o.waitCard) {
      const wait = await cdp.eval(`
        const card = document.querySelector('#overlay-card');
        const tips = Array.from(card.querySelectorAll('.tp-wait-tips > div'));
        const timer = card.querySelector('.tp-turn-wait .tp-secs');
        const order = card.querySelector('.tp-turn-wait .tp-order');
        return tips.length === 2 && tips.every(function (tip) {
          return tip.querySelector('dt').textContent.trim() && tip.querySelector('dd').textContent.trim();
        }) && !!timer.querySelector('.pick-secs') && order.children.length === 4 &&
          order.getBoundingClientRect().bottom <= card.getBoundingClientRect().bottom + 1;
      `);
      check(name + '／' + v.name + '：兩段提示、倒數與接棒順序同時完整可見', wait);
    }
    if (o.reveal) {
      const reveal = await cdp.eval(`
        const chain = document.querySelector('#overlay-card .tp-chain');
        const answer = chain.querySelector('.tp-cell-write');
        const bounds = chain.getBoundingClientRect();
        const result = answer.getBoundingClientRect();
        const drawings = Array.from(chain.querySelectorAll('.tp-cell-draw'));
        const cards = drawings.map(function (cell) {
          return {card: cell.getBoundingClientRect(), picture: cell.querySelector('.tp-cell-pic .tp-pic').getBoundingClientRect()};
        });
        const sameRow = function (a, b) { return Math.abs(a.card.top - b.card.top) <= 1; };
        return {
          fullAnswer: Math.abs(result.left - bounds.left) <= 1 && Math.abs(result.right - bounds.right) <= 1 &&
            cards.every(function (item) { return item.card.bottom <= result.top; }),
          drawings: cards.length,
          rows: cards.filter(function (item, idx) { return !cards.slice(0, idx).some(function (prev) { return sameRow(prev, item); }); }).length,
          aligned: cards.every(function (a) {
            return a.picture.width <= 197 && cards.every(function (b) {
              return !sameRow(a, b) ||
                (Math.abs(a.picture.top - b.picture.top) <= 1 && Math.abs(a.picture.width - b.picture.width) <= 1);
            });
          }),
          reactionsFit: Array.from(chain.querySelectorAll('.tp-reacts')).every(function (reactions) {
            return reactions.scrollWidth <= reactions.clientWidth + 1 &&
              Array.from(reactions.querySelectorAll('button')).every(function (button) { return button.offsetHeight >= 44; });
          })
        };
      `);
      check(name + '／' + v.name + '：畫作對齊、答案獨立成列、表情按鈕完整',
        reveal.fullAnswer && reveal.drawings === 3 && (v.width < 768 || reveal.rows === 1) &&
        reveal.aligned && reveal.reactionsFit, JSON.stringify(reveal));
    }
    if (o.roomCreate) {
      const modal = await cdp.eval(`
        const panel = document.getElementById('room-create-panel');
        const body = document.getElementById('room-create-body');
        const rules = panel.querySelector('.create-room-rules').getBoundingClientRect();
        const details = panel.querySelector('.create-room-details').getBoundingClientRect();
        const actions = Array.from(panel.querySelectorAll('.settings-foot button, .settings-close'));
        const inside = actions.every(function (button) {
          const r = button.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return r.width >= 44 && r.height >= 44 && button.contains(hit);
        });
        const fields = Array.from(body.querySelectorAll('.dropdown-button')).filter(function (button) {
          return !button.closest('[hidden]');
        });
        return {
          columns: rules.left > details.left ? 2 : 1,
          horizontalOverflow: body.scrollWidth - body.clientWidth,
          inside: inside,
          fields: fields.length,
          wrapped: fields.every(function (button) {
            const label = button.querySelector('span');
            return button.offsetHeight >= 44 && label.scrollWidth <= label.clientWidth + 1;
          })
        };
      `);
      check(name + '／' + v.name + '：開房欄位完整、操作鈕可點擊',
        modal.columns === (v.width >= 620 ? 2 : 1) && modal.horizontalOverflow <= 1 &&
        modal.inside && modal.fields === 6 && modal.wrapped, JSON.stringify(modal));
    }
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
  const p4 = await openTab('玩家丁');
  const watch = await openTab('觀戰');
  const tabs = [host, p2, p3, p4, watch];
  await boot(host, '房主小明');
  await boot(p2, '玩家乙');
  await boot(p3, '玩家丙');
  await boot(p4, '玩家丁');
  await boot(watch, '觀戰者');

  /* ---------------- 1. 首頁與大廳 ---------------- */
  console.log('\n【首頁與畫圖傳話大廳】');
  check('首頁有「畫圖傳話（Beta）」入口', await host.eval('var b=document.getElementById("b-telephone"); return !!b && /畫圖傳話/.test(b.textContent);'));
  check('首頁沒有你出我畫他猜', await host.eval('return !document.getElementById("b-pickdraw") && !/你出我畫他猜/.test(document.body.innerText);'));
  await sweep(host, '01-首頁', { one: !process.env.TP_HOME_ALL });

  await host.click('#b-help');
  await host.waitFor('document.getElementById("s-help").classList.contains("active")', 4000, '玩法教學');
  const tutTotal = await host.eval('return document.querySelectorAll("#tut-progress .tut-dots i").length;');
  for (let i = 1; i < tutTotal; i++) await host.click('#b-tut-next');
  check('教學最後一段是畫圖傳話', await host.eval('return /畫圖傳話/.test(document.querySelector("#tut-box h3").textContent);'));
  await sweep(host, '00-教學-畫圖傳話', { instructions: true });
  await host.click('#b-tut-skip');
  await host.waitFor('document.getElementById("s-home").classList.contains("active")', 4000, '回首頁');
  await host.click('#b-telephone');
  await host.waitFor('window.Online && window.Online.isConnected() && !document.getElementById("b-lobby-host").disabled', 15000, '大廳連線');
  check('大廳標題與說明', await host.eval('return /畫圖傳話/.test(document.getElementById("lobby-title").textContent) && !document.getElementById("telephone-lobby-note").hidden && document.getElementById("relay-lobby-note").hidden;'));
  await sweep(host, '02-大廳-空', { instructions: true });
  await host.click('#b-lobby-host');
  await host.waitFor('document.getElementById("room-create-modal").classList.contains("open")', 4000, '開房彈窗');
  const fields = await host.eval('function vis(id){var l=document.querySelector("label[for="+id+"]");return !!l && !l.hidden;} function opts(id){return Array.from(document.getElementById(id).options).map(function(o){return o.value;}).join(",");} return {d:vis("room-create-tpdraw"),g:vis("room-create-tpguess"),r:vis("room-create-tprounds"),gr:vis("room-create-guessrounds"),rd:vis("room-create-rounds"),ds:vis("room-create-drawsec"),title:document.getElementById("room-create-title").textContent,dopt:opts("room-create-tpdraw"),gopt:opts("room-create-tpguess"),ropt:opts("room-create-tprounds"),dval:document.getElementById("room-create-tpdraw").value,gval:document.getElementById("room-create-tpguess").value};');
  check('開房彈窗：顯示每張畫、猜答案、輪次', fields.d && fields.g && fields.r, JSON.stringify(fields));
  check('開房彈窗：不顯示一般模式與接力的欄位', !fields.rd && !fields.ds && !fields.gr, JSON.stringify(fields));
  check('選項 30／45／60、20／25／30、1–3，預設 45、25', fields.dopt === '30,45,60' && fields.gopt === '20,25,30' && fields.ropt === '1,2,3' && fields.dval === '45' && fields.gval === '25', JSON.stringify(fields));
  check('開房彈窗標題', /畫圖傳話/.test(fields.title), fields.title);
  for (const [viewport, field, value] of [[VIEWPORTS[0], 'tpdraw', '60'], [VIEWPORTS[4], 'tpguess', '30']]) {
    await setViewport(host, viewport);
    const id = 'room-create-' + field;
    await host.click('#' + id + '-button');
    await host.waitFor('!document.getElementById("' + id + '-list").hidden', 3000, '開啟自訂下拉選單');
    const menu = await host.eval(`
      const r = document.getElementById(${JSON.stringify(id + '-list')}).getBoundingClientRect();
      return r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1;
    `);
    check(viewport.name + '：自訂下拉選單完整留在畫面內', menu);
    await host.click('#' + id + '-list [data-value="' + value + '"]');
    check(viewport.name + '：可選擇傳話秒數',
      await host.eval('return document.getElementById("' + id + '").value === "' + value + '";'));
  }
  await host.eval('document.getElementById("room-create-body").scrollTop = 0;');
  await sweep(host, '03-開房彈窗', { roomCreate: true });
  for (const lang of ['en', 'zh-Hans']) {
    await host.eval('window.I18N.setLang(' + JSON.stringify(lang) + ');');
    await host.waitFor('window.I18N.lang === ' + JSON.stringify(lang), 4000, '開房語系切換');
    await sweep(host, '03-開房彈窗-' + lang, { roomCreate: true, list: [VIEWPORTS[0], VIEWPORTS[4], BASE_VP, VIEWPORTS[7]] });
  }
  await host.eval('window.I18N.setLang("zh-Hant");');
  await host.waitFor('window.I18N.lang === "zh-Hant"', 4000, '還原繁體中文');
  await host.click('#room-create-submit');
  await host.waitFor('window.DrawGuessApp.view && window.DrawGuessApp.view.room && window.DrawGuessApp.view.room.mode === "telephone"', 6000, '進入房間');
  const code = await host.eval('return window.DrawGuessApp.roomCode;');
  const created = await host.view();
  check('房間設定套用 60／30 秒、1 輪、上限 5 人', created.room.settings.drawSec === 60 && created.room.settings.guessSec === 30 && created.room.settings.rounds === 1 && created.room.settings.maxPlayers === 5, JSON.stringify(created.room.settings));

  await watch.click('#b-online');
  await watch.waitFor('window.Online && window.Online.isConnected()', 15000, '一般大廳連線');
  await sleep(800);
  check('一般大廳看不到這種房', await watch.eval('return !document.querySelector(' + JSON.stringify('#roomlist [data-code="' + code + '"]') + ');'));
  await watch.click('[data-back="s-home"]');
  await watch.click('#b-relay');
  await sleep(1000);
  check('接力大廳看不到這種房', await watch.eval('return !document.querySelector(' + JSON.stringify('#roomlist [data-code="' + code + '"]') + ');'));
  await watch.click('[data-back="s-home"]');

  for (const t of [p2, p3, p4, watch]) {
    await t.click('#b-telephone');
    await t.waitFor('window.Online && window.Online.isConnected()', 15000, '大廳連線');
    await t.waitFor('document.querySelector(' + JSON.stringify('#roomlist [data-code="' + code + '"]') + ')', 6000, '大廳列出房間');
  }
  check('房間卡片有模式標記', await p2.eval('return !!document.querySelector(".rc-rule[data-k=tpmode]");'));
  await sweep(p2, '04-大廳-有房間');
  for (const t of [p2, p3, p4]) {
    await t.click('#roomlist button[data-act=join][data-code=' + JSON.stringify(code) + ']');
    await t.waitFor('window.DrawGuessApp.view && window.DrawGuessApp.view.room && window.DrawGuessApp.view.room.code === ' + JSON.stringify(code), 6000, '進房');
  }
  await watch.click('#roomlist button[data-act=watch][data-code=' + JSON.stringify(code) + ']');
  await watch.waitFor('window.DrawGuessApp.view && window.DrawGuessApp.view.room && window.DrawGuessApp.view.room.code === ' + JSON.stringify(code), 6000, '觀戰進房');
  check('觀戰者身分', (await watch.view()).you.role === 'spectator');
  for (const t of [p2, p3, p4]) await t.click('[data-act=ready]');
  await host.waitFor('window.DrawGuessApp.view.you.can.start', 6000, '可以開始');
  check('等待畫面有模式徽章與規則說明', await host.eval('return !!document.querySelector("#overlay-card .telephone-badge") && /傳一串/.test(document.getElementById("overlay-card").textContent);'));
  check('等待畫面可以聊天', await p2.eval(visible('#chat-input')));
  await sweep(host, '05-等待畫面-房主', { roomSetup: true });
  await sweep(p2, '05-等待畫面-玩家', { one: true });
  if (STOP_AFTER === 'setup') return finish(tabs);

  await telephoneGame(host, [host, p2, p3, p4], watch, tabs);
  return finish(tabs);
}

const GAME = 'var g=window.DrawGuessApp.view&&window.DrawGuessApp.view.game;';

async function gameOf(tab) {
  return tab.eval(GAME + 'var v=window.DrawGuessApp.view; return g ? {phase:g.phase,step:g.stepNo,role:g.you.role,answer:g.answer,me:v.you.id,roomPhase:v.room.phase,order:(g.order||[]).map(function(o){return o.id;})} : (v ? {roomPhase:v.room.phase} : null);');
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

const visible = (sel) => 'var e=document.querySelector(' + JSON.stringify(sel) + '); return !!e && !e.hidden && !e.closest("[hidden]") && e.getBoundingClientRect().width > 0;';

async function telephoneGame(host, players, watch, tabs) {
  console.log('\n【畫圖傳話對局】');
  await host.click('[data-act=start]');
  for (const t of tabs) await t.waitFor(GAME + 'return g && g.phase === "picking";', 6000, '挑題');
  check('第 1 輪由房主開頭', (await gameOf(host)).role === 'starter');
  check('開頭的人看到 3 個候選題', await host.eval('return document.querySelectorAll("#overlay-card [data-act=telephone-pick]").length === 3;'));
  check('其他人看到等待卡、看不到候選', await players[1].eval('return document.querySelectorAll("#overlay-card [data-act=telephone-pick]").length === 0 && /挑題目/.test(document.getElementById("overlay-card").textContent);'));
  check('傳話中聊天輸入框隱藏', !(await players[1].eval(visible('#chat-input'))));
  await sweep(host, '06-挑題-開頭', { list: [...FIRST_HALF, VIEWPORTS[4]], instructions: true, picking: true });
  await sweep(players[1], '06-挑題-等待', { list: SECOND_HALF, instructions: true });
  const answer = await host.eval('return document.querySelector("#overlay-card [data-act=telephone-pick] b").textContent;');
  await host.click('#overlay-card [data-act=telephone-pick]');

  /* ---- 換手倒數 ---- */
  await host.waitFor(GAME + 'return g && g.phase === "step";', 6000, '進入傳話');
  check('換手倒數卡顯示題目', await host.eval('return !!document.querySelector("#overlay-card .tp-hand-n") && document.getElementById("overlay-card").textContent.indexOf(' + JSON.stringify(answer) + ') >= 0;'));
  await shot(host, '07-換手-開頭-tablet-land');
  const order = (await gameOf(host)).order;
  const byId = {};
  for (const t of players) byId[(await gameOf(t)).me] = t;
  const chain = order.map((id) => byId[id]);
  check('傳話順序 4 格、房主第一', chain.length === 4 && chain[0] === host);

  /* ---- 一格一格傳 ---- */
  for (let i = 0; i < 3; i++) {
    const me = chain[i];
    await me.waitFor('window.DrawGuessApp.view.you.can.draw', 8000, '第 ' + (i + 1) + ' 格可以畫');
    check('第 ' + (i + 1) + ' 格：有工具列與「交出去」', await me.eval(visible('#toolbar')) && await me.eval('var b=document.getElementById("b-done"); return !b.hidden && !b.disabled && /交出去/.test(b.textContent);'));
    if (i === 0) check('開頭的人題目列顯示題目、有參考範本', await me.eval('return document.getElementById("wordbar-mask").textContent === ' + JSON.stringify(answer) + ';') && await me.eval(visible('#b-reference')));
    else {
      check('第 ' + (i + 1) + ' 格：開始作畫後看不到上一張畫與題目', await me.eval(GAME + 'return g.prev && g.prev.strokes === null && !document.querySelector("#overlay-card .tp-pic");') &&
        !(await me.eval('return document.body.innerText.indexOf(' + JSON.stringify(answer) + ') >= 0;')));
    }
    await drag(me, 0.25 + i * 0.05, 0.3, 0.75, 0.7);
    /* 前面畫完的人與下一位可以即時看；再後面的人看不到；觀戰者全部看得到 */
    const viewers = chain.slice(0, i).concat(chain[i + 1] ? [chain[i + 1]] : []);
    const hiddenTo = chain.slice(i + 2);
    check('第 ' + (i + 1) + ' 格：觀戰者看得到作畫與題目', await watch.waitFor('window.DrawGuessApp.paint.count() >= 1 && document.getElementById("stage-overlay").hidden && document.getElementById("wordbar-mask").textContent === ' + JSON.stringify(answer), 4000, '觀戰').catch(() => false));
    check('第 ' + (i + 1) + ' 格：前面畫完的人與下一位看得到作畫', await (async () => {
      for (const o of viewers) {
        if (!(await o.waitFor('window.DrawGuessApp.paint.count() >= 1 && document.getElementById("stage-overlay").hidden', 4000, '看得到作畫').catch(() => false))) return false;
      }
      return true;
    })());
    check('第 ' + (i + 1) + ' 格：再後面的人看不到筆畫與題目', await (async () => {
      for (const o of hiddenTo) {
        if (await o.eval('return window.DrawGuessApp.paint.count() > 0 || document.body.innerText.indexOf(' + JSON.stringify(answer) + ') >= 0;')) return false;
      }
      return true;
    })());
    check('第 ' + (i + 1) + ' 格：看的人看不到題目', await (async () => {
      for (const o of viewers) if (o !== host && await o.eval('return document.body.innerText.indexOf(' + JSON.stringify(answer) + ') >= 0;')) return false;
      return true;
    })());
    if (i === 0) {
      await sweep(me, '08-作畫-開頭', { drawing: true });
      await setViewport(me, VIEWPORTS[0]);
      await me.click('#b-aside-toggle');
      await me.waitFor('document.getElementById("game-aside").classList.contains("open")', 2500, '展開操作摘要');
      await sleep(260);
      const summary = await me.eval(`
        const note = document.querySelector('.sum-line-action');
        const description = note.querySelector('b');
        const bounds = note.getBoundingClientRect();
        return description.textContent.trim() !== '' && description.textContent.trim() !== '—' &&
          note.scrollWidth <= note.clientWidth + 1 && bounds.left >= 0 && bounds.right <= innerWidth;
      `);
      check('手機窄版：操作摘要的當前步驟說明完整', summary);
      await shot(me, '08-操作摘要-phone-narrow');
      await me.click('#b-aside-close');
      await setViewport(me, BASE_VP);
      await sweep(chain[2], '09-等待-作畫中', { waitCard: true });
      await sweep(watch, '09-觀戰-作畫中', { list: SECOND_HALF });
      await sweep(chain[1], '09-下一位-觀看', { list: FIRST_HALF });
    } else if (i === 1) {
      await sweep(me, '08-照畫', { drawing: true });
      await sweep(chain[0], '09-畫完-觀看', { one: true });
    }
    await me.click('#b-done');
    await me.waitFor(GAME + 'return g.stepNo === ' + (i + 1) + ';', 6000, '交出去');
    if (i === 1) {
      /* 中間的人交出畫後猜原本的題目 */
      check('交出畫後出現「猜原本的題目」框', await me.waitFor('document.getElementById("guessbar").getAttribute("data-mode") === "midguess" && !document.getElementById("guessbar").hidden && !document.getElementById("guess-input").disabled', 4000, '中間猜題').catch(() => false));
      await me.eval('var i=document.getElementById("guess-input"); i.value="一定不是這個"; document.getElementById("guessbar").requestSubmit(); return 1;');
      check('猜錯有提示、下一次剩 40 分', await me.waitFor('/40/.test(document.getElementById("guess-input").placeholder)', 4000, '猜錯').catch(() => false));
      await sweep(me, '09-中間猜題', { list: FIRST_HALF });
      await sleep(500);
      await me.eval('var i=document.getElementById("guess-input"); i.value=' + JSON.stringify(answer) + '; document.getElementById("guessbar").requestSubmit(); return 1;');
      check('猜中後框停用、大家看到猜中了', await me.waitFor('document.getElementById("guess-input").disabled', 4000, '猜中').catch(() => false) &&
        await host.waitFor('/猜中原本的題目/.test(document.body.innerText)', 4000, '公告').catch(() => false));
    }
  }

  /* ---- 最後一人猜答案 ---- */
  const guesser = chain[3];
  await guesser.waitFor('window.DrawGuessApp.view.you.can.answer', 8000, '可以猜');
  check('猜的人有答案框、提示與偷看', await guesser.eval(visible('#guess-input')) && await guesser.eval(visible('#b-hint-1')) && await guesser.eval(visible('#tp-peekdock')));
  check('猜的人畫布顯示上一張畫、不能畫', await guesser.eval('return window.DrawGuessApp.paint.count() >= 1;'));
  check('猜的人看不到題目', !(await guesser.eval('return document.body.innerText.indexOf(' + JSON.stringify(answer) + ') >= 0;')));
  await guesser.click('#b-hint-1');
  check('用提示後看到字數', await guesser.waitFor(GAME + 'return g.hint && g.hint.step === 1;', 4000, '提示').catch(() => false));
  await guesser.click('#tp-peekdock [data-tp-peek="0"]');
  check('偷看第一張畫，可以切換正在看的畫', await guesser.waitFor('document.querySelectorAll("#tp-peekdock .tp-view").length === 2', 4000, '偷看').catch(() => false));
  check('其他人與觀戰者可以翻看所有的畫', await watch.waitFor('document.querySelectorAll("#overlay-card .tp-browse").length === 1', 4000, '翻看').catch(() => false));
  await watch.click('#overlay-card [data-act=telephone-browse][data-d="1"]');
  check('翻看可以換下一張', await watch.eval('return /2 \\/ 3/.test(document.querySelector("#overlay-card .tp-browse-fig figcaption").textContent);'));
  check('玩家翻看時沒有題目', !(await chain[1].eval('return document.body.innerText.indexOf(' + JSON.stringify(answer) + ') >= 0;')));
  await sweep(guesser, '10-猜答案');
  await sweep(watch, '11-翻看全部的畫', { instructions: true });
  await guesser.eval('var i=document.getElementById("guess-input"); i.value=' + JSON.stringify(answer) + '; i.dispatchEvent(new Event("input",{bubbles:true})); document.getElementById("guessbar").requestSubmit(); return 1;');

  /* ---- 揭曉 ---- */
  for (const t of tabs) await t.waitFor(GAME + 'return g && g.phase === "reveal";', 6000, '揭曉');
  check('揭曉列表：題目＋4 格', await host.eval('return document.querySelectorAll("#overlay-card .tp-cell").length === 5 && document.querySelector("#overlay-card .tp-cell-word .revealword").textContent === ' + JSON.stringify(answer) + ';'));
  check('猜對時顯示得分與提示倍數', await host.eval('return /×0\\.18/.test(document.querySelector("#overlay-card .tp-hints-used").textContent) && /\\+54/.test(document.getElementById("overlay-card").textContent);'));
  check('揭曉時可以聊天', await players[1].eval(visible('#chat-input')));
  await players[1].click('#overlay-card .tp-cell-draw [data-act=telephone-react][data-kind=laugh]');
  check('可以對別人的格子按大笑', await host.waitFor(GAME + 'return g.chain && g.chain.cells[0].counts.laugh === 1;', 4000, '表情').catch(() => false));
  check('自己那格的表情按鈕停用', await host.eval('return document.querySelector("#overlay-card .tp-cell-draw [data-act=telephone-react]").disabled;'));
  await sweep(host, '12-揭曉', { instructions: true, reveal: true });

  await host.waitFor('window.DrawGuessApp.view.room.phase === "finished"', 40000, '結算');
  await host.waitFor('document.querySelectorAll("#overlay-card .gal-item").length >= 1', 8000, '畫廊').catch(() => {});
  check('結算有「最好笑」', await host.eval('return /最好笑/.test(document.getElementById("overlay-card").textContent) && /房主小明/.test(document.querySelector("#overlay-card .tp-award").textContent);'));
  check('結算畫廊有每一張畫', await host.eval('return document.querySelectorAll("#overlay-card .gal-item").length === 3;'));
  await sweep(host, '13-結算');
  await host.click('#overlay-card [data-act=gallery-open]');
  await host.waitFor('document.getElementById("gallery-modal").classList.contains("open")', 3000, '開啟畫廊');
  const firstPicture = await host.eval('return document.getElementById("gallery-view-pos").textContent;');
  await host.click('#gallery-next');
  check('結算畫廊可切換到下一張', (await host.eval('return document.getElementById("gallery-view-pos").textContent;')) !== firstPicture);
  await sweep(host, '13-結算畫廊');
  await host.click('#gallery-close');
  await host.waitFor('!document.getElementById("gallery-modal").classList.contains("open")', 3000, '關閉畫廊');
  await host.eval('document.getElementById("overlay-card").scrollTop = 0; return 1;');

  /* ---- 英文版：再來一局 ---- */
  console.log('\n【英文版】');
  for (const t of tabs) await t.eval('window.I18N.setLang("en"); return 1;');
  await sleep(300);
  await sweep(host, '14-結算-en', { one: !ALL_SIZES });
  await host.click('[data-act=online-rematch]');
  for (const t of tabs) await t.waitFor(GAME + 'return g && g.phase === "picking";', 6000, '挑題');
  await sweep(host, '15-挑題-en', { one: true });
  await host.click('#overlay-card [data-act=telephone-pick]');
  await host.waitFor(GAME + 'return g && g.phase === "step";', 6000, '進入傳話');
  const e = (await gameOf(host)).order.map((id) => byId[id]);
  await e[0].waitFor('window.DrawGuessApp.view.you.can.draw', 8000, '可以畫');
  await drag(e[0], 0.3, 0.3, 0.6, 0.6);
  await sweep(e[0], '16-作畫-en');
  await sweep(e[1], '16-等待-en', { one: true });
  check('英文版的對局文字沒有中文殘留', !(await e[1].eval('var t=[document.getElementById("phase-chip"),document.getElementById("wordbar"),document.getElementById("overlay-card"),document.getElementById("playerstrip")].map(function(x){return x?x.innerText:"";}).join(" "); return /[\\u3400-\\u9fff]/.test(t.replace(/玩家[乙丙丁]|房主小明|觀戰者/g,""));')));
  await e[0].click('#b-done');
  await e[1].waitFor('window.DrawGuessApp.view.you.can.draw', 8000, '下一格可以畫');
  check('英文接畫提示沿單字換行', await e[1].eval(`
    const header = document.getElementById('wordbar');
    const text = document.getElementById('wordbar-mask');
    return header.hasAttribute('data-tp-status') && getComputedStyle(text).wordBreak === 'normal';
  `));
  await sweep(e[1], '17-照畫-en', { one: true });

  /* ---- 兩人離開：剩不到 3 人立即結算 ---- */
  await e[2].eval('window.Online.send("room:leave", {}); return 1;');
  await e[3].eval('window.Online.send("room:leave", {}); return 1;');
  check('剩不到 3 人立即結算', await host.waitFor('window.DrawGuessApp.view.room.phase === "finished"', 6000, '結算').catch(() => false));
  check('戰績記在畫圖傳話一欄', await host.eval('var s=window.Store.stats(); return s.telephone.games >= 1 && s.online.games === 0;'));
  await host.click('#overlay-card [data-act=home]');
  await host.waitFor('document.getElementById("s-home").classList.contains("active")', 4000, '回首頁');
  await host.click('#b-stats');
  await host.waitFor('document.querySelectorAll("#statgrid .statcard").length === 4', 4000, '戰績四張卡');
  check('戰績頁有畫圖傳話卡', await host.eval('return /Draw Telephone/.test(document.getElementById("statgrid").textContent);'));
  await sweep(host, '18-戰績-en', { list: [VIEWPORTS[0], VIEWPORTS[5], BASE_VP] });
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
    console.log(failures.length ? '✗ 畫圖傳話瀏覽器巡檢失敗 ' + failures.length + ' 項' : '✓ 畫圖傳話瀏覽器巡檢通過');
    setTimeout(() => process.exit(failures.length ? 1 : 0), 300);
  });
