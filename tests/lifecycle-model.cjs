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
