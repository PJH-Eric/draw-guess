/*
 * tests/online-liveness.cjs — 用戶端存活檢查（public/js/online.js 的 probe）整合測試
 *
 * 把瀏覽器端的 online.js 原封不動載進 Node（window／document 用最小替身），
 * 對真正的 server.js 連線，驗證：
 *   1. 連線正常時探測不會打斷連線
 *   2. 連線「看起來連著、其實對方不回了」時，回到前景會在探測逾時後自動重連並重新 hello
 *   3. 已經掉線、還在等退避重試時，回到前景會立刻重連
 *   4. 伺服器的心跳設定確實是收緊後的值
 *
 * 需要 socket.io-client（devDependency），所以掛在 npm run test:online，不在 npm test。
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { io: ioClient } = require('socket.io-client');
const { server, io, store } = require('../server.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms, label) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (fn()) return;
    await sleep(25);
  }
  throw new Error('等不到：' + label);
}

async function main() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;

  const docHandlers = {};
  const winHandlers = {};
  const document = {
    visibilityState: 'visible',
    addEventListener(type, fn) { (docHandlers[type] = docHandlers[type] || []).push(fn); }
  };
  const window = {
    io: ioClient,
    GameConfig: {
      serverUrl: url,
      isOnlineEnabled: () => true,
      url: (p) => url + p,
      describe: () => url,
      error: ''
    },
    addEventListener(type, fn) { (winHandlers[type] = winHandlers[type] || []).push(fn); }
  };
  const sandbox = { window, document, console, setTimeout, clearTimeout, Promise, Date };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/js/online.js'), 'utf8'), sandbox);
  const Online = window.Online;
  const fire = (handlers, type) => (handlers[type] || []).forEach((fn) => fn());

  let reconnects = 0;
  Online.on('reconnected', () => { reconnects += 1; });
  const serverSocket = () => [...io.sockets.sockets.values()][0];

  try {
    assert.equal(io.engine.opts.pingInterval, 10000);
    assert.equal(io.engine.opts.pingTimeout, 10000);
    console.log('PASS 伺服器心跳：10 秒探測、10 秒逾時（最久 20 秒判定斷線）');

    await Online.connect({ clientId: 'liveness-client-1', name: 'tester' });
    assert.equal(Online.status().status, 'connected');
    const firstId = serverSocket().id;

    /* 1. 活著的連線：探測有回條，不重連 */
    fire(docHandlers, 'visibilitychange');
    await sleep(400);
    assert.equal(serverSocket().id, firstId);
    assert.equal(reconnects, 0);
    console.log('PASS 連線正常時回到前景只探測、不重連');

    /* 分頁在背景時不探測 */
    document.visibilityState = 'hidden';
    serverSocket().removeAllListeners('latency:ping');
    fire(docHandlers, 'visibilitychange');
    await sleep(300);
    assert.equal(Online.status().status, 'connected');
    document.visibilityState = 'visible';

    /* 2. 殭屍連線：伺服器不再回探測 → 逾時後自動重連，並重新 hello */
    const started = Date.now();
    fire(docHandlers, 'visibilitychange');
    await until(() => reconnects === 1 && Online.status().status === 'connected', 8000, '探測逾時後重連');
    const took = Date.now() - started;
    assert.ok(took >= 3500 && took < 7000, '應在探測逾時（約 4 秒）後重連，實際 ' + took + 'ms');
    await until(() => io.sockets.sockets.size === 1, 2000, '舊連線被收掉');
    assert.notEqual(serverSocket().id, firstId);
    assert.ok(serverSocket().data.clientId, '重連後伺服器已重新認得身分');
    console.log('PASS 殭屍連線在探測逾時後自動重連並恢復身分（' + took + 'ms，不用等 20 秒心跳）');

    /* 3. 已掉線、等退避重試中：回到前景立刻重連 */
    const beforeDrop = serverSocket().id;
    serverSocket().conn.close();
    await until(() => Online.status().status !== 'connected', 2000, '偵測到掉線');
    const dropAt = Date.now();
    fire(winHandlers, 'online');
    await until(() => Online.status().status === 'connected' && reconnects === 2, 3000, '立刻重連');
    assert.ok(Date.now() - dropAt < 700, '應該跳過退避時間立刻重連');
    assert.notEqual(serverSocket().id, beforeDrop);
    console.log('PASS 掉線後網路恢復／回到前景會跳過退避時間立刻重連');

    /* 離線事件：畫面狀態立刻反映，不用等心跳 */
    fire(winHandlers, 'offline');
    assert.equal(Online.status().status, 'connecting');
    fire(winHandlers, 'online');
    await until(() => Online.status().status === 'connected', 6000, '離線事件後恢復');
    console.log('PASS 瀏覽器離線事件立刻顯示重試中，恢復後回到已連線');

    Online.disconnect();
    await until(() => io.sockets.sockets.size === 0, 2000, '主動離線');
    assert.equal(store.size(), 0);
  } finally {
    io.close();
    server.close();
  }
  process.exit(0);
}

main().catch((error) => { console.error(error); process.exit(1); });
