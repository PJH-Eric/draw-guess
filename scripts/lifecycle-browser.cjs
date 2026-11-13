'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { server, io, store } = require('../server.js');

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    assert.equal(io.sockets.sockets.size, 0);
    await page.evaluate(() => document.getElementById('b-online').click());
    await page.waitForFunction(() => Online.status().status === 'connected');
    await page.waitForFunction(() => !document.getElementById('lobby-online-count').hidden);
    let previous = [...io.sockets.sockets.values()][0];
    previous.conn.close();
    await page.waitForFunction(() => Online.status().status !== 'connected');
    await page.waitForFunction(() => Online.status().status === 'connected');
    await page.waitForFunction(() => !document.getElementById('lobby-online-count').hidden);
    console.log('PASS 重連後恢復大廳列表與在線人數推送');
    await page.evaluate(() => document.getElementById('b-lobby-host').click());
    await page.click('#room-create-submit');
    await page.waitForSelector('#s-game.active');
    const room = [...store.rooms.values()].find(room => !room.closed);
    previous = [...io.sockets.sockets.values()][0];
    previous.conn.close();
    await page.waitForFunction(() => Online.status().status !== 'connected');
    await page.waitForFunction(() => Online.status().status === 'connected');
    await page.waitForTimeout(150);
    assert.equal(room.member(room.hostId).connected, true);
    assert.equal([...io.sockets.sockets.values()][0].data.roomCode, room.code);
    console.log('PASS 房間內重連會恢復原身分與席位');
    room.close('srv.closed.empty', Date.now());
    [...io.sockets.sockets.values()][0].conn.close();
    await page.waitForFunction(() => DrawGuessApp.view.room.closed);
    assert.equal(store.get(room.code), null);
    console.log('PASS 已關閉房間無法因重連復活，畫面顯示結束狀態');
    await page.evaluate(() => Online.disconnect());
    await page.waitForTimeout(100);
    assert.equal(io.sockets.sockets.size, 0);
    assert.equal(await page.evaluate(() => Online.status().status), 'idle');
    assert.deepEqual(errors, []);
    console.log('PASS 主動離線停止連線且沒有瀏覽器錯誤');
  } finally {
    await browser.close(); io.close(); server.close();
  }
  process.exit(0);
}
main().catch(error => { console.error(error); process.exit(1); });
