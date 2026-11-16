'use strict';

const assert = require('node:assert/strict');
const { RoomStore } = require('../lib/rooms.js');

const store = new RoomStore();
const { room } = store.create('host', { name: 'host', now: 0 });
room.join('spectator', { role: 'spectator', now: 0 });
room.disconnect('host', 100);
assert.equal(store.sweep(100 + store.opts.graceMs - 1).closed.length, 0);
const swept = store.sweep(100 + store.opts.graceMs);
assert.deepEqual(swept.closed, [room]);
assert.equal(store.get(room.code), null);
assert.equal(room.join('late-client', { now: 100000 }).ok, false);

const zero = store.create('host', { name: 'host', now: 0 }).room;
zero.close('srv.closed.empty', 0);
assert.equal(store.sweep(119999).forget.includes(zero), false);
assert.equal(store.sweep(120000).forget.includes(zero), true);
assert.equal(store.getAny(zero.code), null);
console.log('PASS 房間模型：斷線期限、純觀戰關房、禁止復活與關閉保存期限');

/* 房主在等待畫面斷線：超過 hostAwayMs 就把房主交給在線玩家，原房主座位保留 */
{
  const s = new RoomStore();
  const r = s.create('h', { name: 'host', now: 0 }).room;
  r.join('p2', { name: 'p2', now: 10 });
  r.join('watch', { name: 'w', role: 'spectator', now: 20 });
  r.disconnect('h', 1000);
  s.sweep(1000 + s.opts.hostAwayMs - 1);
  assert.equal(r.hostId, 'h');
  const res = s.sweep(1000 + s.opts.hostAwayMs);
  assert.equal(r.hostId, 'p2');
  assert.equal(res.changed.includes(r), true);
  assert.equal(!!r.member('h'), true);
  /* 只剩觀戰者在線時不交接（觀戰者不能當房主開局） */
  const r2 = s.create('h2', { name: 'host2', now: 0 }).room;
  r2.join('w2', { name: 'w2', role: 'spectator', now: 0 });
  r2.disconnect('h2', 0);
  s.sweep(s.opts.hostAwayMs + 5);
  assert.equal(r2.hostId, 'h2');
  console.log('PASS 房間模型：房主離線交接給在線玩家、不交給觀戰者');
}

/* 閒置回收：等待畫面完全沒動作超過 idleMs 才關；有動作會重新起算；idleMs=0 不回收 */
{
  const s = new RoomStore({ idleMs: 1000 });
  const r = s.create('h', { name: 'host', now: 0 }).room;
  s.sweep(0);
  assert.equal(s.sweep(999).closed.length, 0);
  r.join('p2', { name: 'p2', now: 999 });
  assert.equal(s.sweep(1500).closed.length, 0);
  assert.equal(s.sweep(2499).closed.length, 0);
  const res = s.sweep(2500);
  assert.deepEqual(res.closed, [r]);
  assert.equal(r.closedReason, 'srv.closed.idle');
  const never = new RoomStore({ idleMs: 0 });
  const r3 = never.create('h', { name: 'host', now: 0 }).room;
  never.sweep(0);
  assert.equal(never.sweep(1e9).closed.length, 0);
  assert.equal(r3.closed, false);
  console.log('PASS 房間模型：閒置房間回收、動作重新起算、可關閉回收');
}
