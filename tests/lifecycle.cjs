'use strict';

const assert = require('node:assert/strict');
const { io: connect } = require('socket.io-client');
const { server, io, store } = require('../server.js');
const sockets = [];
async function until(check) {
  const deadline = Date.now() + 1200;
  while (!check()) {
    if (Date.now() >= deadline) assert.fail('房間或成員狀態未完成清理');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
function request(socket, event, payload = {}) { return socket.timeout(1500).emitWithAck(event, payload); }
async function client(secret) {
  const socket = connect('http://127.0.0.1:' + server.address().port, {
    transports: ['websocket'], forceNew: true, reconnection: false
  });
  sockets.push(socket);
  await new Promise(resolve => socket.once('connect', resolve));
  socket.identity = await request(socket, 'hello', { clientId: secret, name: secret });
  return socket;
}
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let failures = 0;
  async function check(name, run) {
    try { await run(); console.log('PASS ' + name); }
    catch (error) { failures++; console.error('FAIL ' + name + ': ' + error.message); }
    for (const socket of sockets.splice(0)) socket.disconnect();
    await until(() => io.sockets.sockets.size === 0);
    store.rooms.clear();
  }
  await check('回大廳與換房都釋放舊席位並關房', async () => {
    const host = await client('lifecycle-host');
    const first = await request(host, 'room:create');
    host.emit('lobby:subscribe');
    await until(() => !store.get(first.code));
    const second = await request(host, 'room:create');
    const third = await request(host, 'room:create');
    assert.equal(store.get(second.code), null);
    assert.ok(store.get(third.code));
  });
  await check('多分頁關閉或離開一頁，不移除另一頁仍在使用的成員', async () => {
    const first = await client('lifecycle-shared');
    const { code } = await request(first, 'room:create');
    const second = await client('lifecycle-shared');
    await request(second, 'room:join', { code });
    first.emit('room:leave');
    await until(() => [...io.sockets.sockets.values()].some(s => s.data.roomCode === null));
    assert.equal(store.get(code).member(first.identity.id).connected, true);
    second.disconnect();
    await until(() => !store.get(code).member(first.identity.id).connected);
    store.sweep(Date.now() + store.opts.graceMs);
    assert.equal(store.get(code), null);
  });
  await check('關房通知觀眾並將連線從舊房移回大廳', async () => {
    const host = await client('lifecycle-host');
    const spectator = await client('lifecycle-spectator');
    const { code } = await request(host, 'room:create');
    const invite = await request(host, 'room:invite', { role: 'spectator', ttlMinutes: 30 });
    await request(spectator, 'room:join', { code, token: invite.token });
    let closed = false;
    spectator.on('room:closed', () => { closed = true; });
    host.emit('room:leave');
    await until(() => closed);
    const serverSocket = [...io.sockets.sockets.values()].find(s => s.data.clientId === spectator.identity.id);
    assert.equal(serverSocket.data.roomCode, null);
    assert.equal(store.getAny(code).checkInvite(invite.token, Date.now()).ok, false);
    let lobby;
    spectator.on('lobby:rooms', payload => { lobby = payload; });
    const newcomer = await client('lifecycle-newcomer');
    await until(() => lobby && lobby.online === 3);
    assert.ok(newcomer.connected);
  });
  await check('更新暱稱不會改變連線身分或遺留在線座位', async () => {
    const host = await client('lifecycle-host');
    const { code } = await request(host, 'room:create');
    const hello = await request(host, 'hello', { clientId: 'different-client', name: '新名字' });
    assert.equal(hello.id, host.identity.id);
    host.disconnect();
    await until(() => io.sockets.sockets.size === 0);
    assert.equal(store.get(code).member(host.identity.id).connected, false);
  });
  await check('已關閉房間到點釋放，不因清理工作重設保存期限', () => {
    const { room } = store.create('host', { name: 'host', now: 0 });
    room.close('srv.closed.empty', 0);
    assert.equal(store.sweep(119999).forget.length, 0);
    assert.deepEqual(store.sweep(120000).forget, [room]);
    assert.equal(store.getAny(room.code), null);
  });
  io.close(); server.close();
  process.exit(failures ? 1 : 0);
}
main().catch(error => { console.error(error); process.exit(1); });
