'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const { performance } = require('perf_hooks');
const onlineSource = fs.readFileSync(path.join(__dirname, '../public/js/online.js'), 'utf8');
const coreSource = fs.readFileSync(path.join(__dirname, '../public/js/app/core.js'), 'utf8').replace(/^import .*;$/gm, '').replace(/export /g, '');
async function client(real) {
  let elapsed = 0, serverElapsed = 0, wall = 2000000;
  let pingDelay = 0;
  const handlers = {};
  const clock = () => real ? performance.now() : elapsed;
  const socket = {
    connected: true,
    on(event, fn) { handlers[event] = fn; return this; },
    once(event, fn) { handlers[event] = fn; return this; },
    timeout() { return this; },
    emit(event, payload, ack) {
      if (event === 'hello') ack({ ok: true, serverTime: real ? Date.now() : 1000000 + serverElapsed });
      if (event === 'latency:ping') {
        elapsed += pingDelay / 2; serverElapsed += pingDelay / 2; wall += pingDelay / 2;
        const serverTime = real ? Date.now() : 1000000 + serverElapsed;
        elapsed += pingDelay / 2; serverElapsed += pingDelay / 2; wall += pingDelay / 2;
        ack(null, { serverTime });
      }
    },
    removeAllListeners() {}, disconnect() {}, connect() {}
  };
  const window = { performance: { now: clock }, io: () => socket, addEventListener() {}, GameConfig: { isOnlineEnabled: () => true, serverUrl: 'fixture' } };
  const FakeDate = class extends Date { static now() { return wall; } };
  const sandbox = { window, document: { visibilityState:'visible', addEventListener() {} }, Date: real ? Date : FakeDate, console, setTimeout, clearTimeout, Promise };
  vm.createContext(sandbox);
  vm.runInContext(onlineSource, sandbox);
  await window.Online.connect({ clientId:'timing', name:'Timing' });
  handlers.connect();
  vm.runInContext(coreSource, sandbox);
  sandbox.app.mode = 'online';
  return { online:window.Online, seconds:sandbox.secsLeft, advance(ms, wallMs = ms) { elapsed += ms; serverElapsed += ms; wall += wallMs; },
    sleep(ms) { serverElapsed += ms; wall += ms; },
    reconnect() { handlers.connect(); },
    delay(ms) { pingDelay = ms; } };
}
(async () => {
  for (const duration of [15000, 90000, 30000]) {
    const c = await client(false);
    const end = c.online.now() + duration;
    for (let t = 0; t <= duration; t += 120) {
      assert.equal(c.seconds(end), Math.max(0, Math.ceil((duration - t) / 1000)));
      c.advance(120);
    }
  }
  console.log('PASS 選題15秒、作畫90秒、投票30秒：每120ms更新不會多扣秒');
  const c = await client(false);
  const ends = [15000,90000,30000].map(ms => c.online.now() + ms);
  c.advance(1000);
  assert.deepEqual(ends.map(c.seconds), [14,89,29]);
  c.advance(1000, 6000);
  assert.deepEqual(ends.map(c.seconds), [13,88,28], '本機時鐘快調5秒，實際只過1秒，三個倒數不可一起跳快');
  console.log('PASS 本機時鐘跳動不會加速所有倒數');
  c.advance(1000,-6000);
  assert.deepEqual(ends.map(c.seconds), [12,87,27]);
  console.log('PASS 本機時鐘回調不會拉長倒數');
  c.sleep(10000);
  c.online.probe();
  assert.deepEqual(ends.map(c.seconds), [2,77,17]);
  console.log('PASS 手機休眠後回到前景，依伺服器恢復正確剩餘時間');
  c.delay(200);
  c.online.probe();
  assert.ok(Math.abs(c.online.now()-1013200)<1, '校時需補償往返延遲的一半');
  c.sleep(3000);
  c.reconnect();
  assert.ok(Math.abs(c.online.now()-1016200)<1);
  console.log('PASS 網路延遲補償與重連校時');
  const active = new Map();
  let sequence=0, updates=0;
  const loopContext={window:{},app:{mode:'online',loop:0},LOOP_MS:120,updateTimers(){updates++;},setInterval(fn,ms){assert.equal(ms,120);active.set(++sequence,fn);return sequence;},clearInterval(id){active.delete(id);}};
  vm.createContext(loopContext);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/js/app/solo.js'),'utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),loopContext);
  for(let i=0;i<5;i++)loopContext.startLoop();
  assert.equal(active.size,1);
  Array.from(active.values())[0]();
  assert.equal(updates,1);
  loopContext.stopLoop();assert.equal(active.size,0);
  console.log('PASS 重複進出對局不會疊加計時器');
  const { RoomStore, KICK_VOTE_MS }=require('../lib/rooms.js');
  const store=new RoomStore({});
  const room=store.create('a',{name:'A',now:1000}).room;
  for(const id of ['b','c']) {room.join(id,{name:id,role:'player',now:1000});room.setReady(id,true);}
  room.start('a',1000);
  assert.equal(room.state.deadline,16000);
  store.sweep(15999);assert.equal(room.state.phase,'picking');
  store.sweep(16000);assert.equal(room.state.phase,'drawing');
  assert.equal(room.state.deadline,106000);
  room.startKick('a','c',16000);
  assert.equal(room.kickVote.endsAt,16000+KICK_VOTE_MS);
  store.sweep(16000+KICK_VOTE_MS-1);assert.ok(room.kickVote);
  store.sweep(16000+KICK_VOTE_MS);assert.equal(room.kickVote,null);
  store.sweep(105999);assert.equal(room.state.phase,'drawing');
  store.sweep(106000);assert.equal(room.state.phase,'reveal');
  assert.equal(room.state.deadline,113000);
  store.sweep(112999);assert.equal(room.state.phase,'reveal');
  store.sweep(113000);assert.equal(room.state.phase,'picking');
  assert.equal(room.state.deadline,128000);
  console.log('PASS 伺服器選題15秒、作畫90秒、投票30秒的實際截止邊界');

  const live = await client(true);
  const deadlines=[15000,90000,30000].map(ms => live.online.now()+ms);
  const start=performance.now();
  await new Promise(resolve=>setTimeout(resolve,5100));
  const took=performance.now()-start;
  const consumed=deadlines.map((deadline,index)=>[15,90,30][index]-live.seconds(deadline));
  consumed.forEach(seconds=>assert.ok(Math.abs(seconds-took/1000)<=1, '實際秒數與倒數差距不得超過一秒'));
  console.log('PASS 真實耗時 '+Math.round(took)+'ms，三個倒數分別減少 '+consumed.join('/')+' 秒');
})().catch(error => { console.error(error); process.exitCode=1; });
