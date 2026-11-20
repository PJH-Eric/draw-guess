'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { setTimeout: sleep } = require('node:timers/promises');
const { io } = require('socket.io-client');
const { RoomStore } = require('../lib/rooms.js');
const { openCheckpoints } = require('../lib/room-checkpoints.js');

async function connect(base, clientId) {
  const socket = io(base, { transports: ['websocket'], reconnection: false, timeout: 4500 });
  const client = { socket, clientId, view: null, strokes: [] };
  socket.on('room:sync', value => { client.view = value; });
  socket.on('room:stroke', value => { client.strokes.push(value); });
  try {
    await Promise.race([
      once(socket, 'connect'),
      once(socket, 'connect_error').then(([error]) => { throw error; })
    ]);
    const hello = await socket.timeout(5000).emitWithAck('hello', { clientId, name: `Pilot ${clientId.slice(0, 5)}` });
    assert.equal(hello.ok, true);
    client.id = hello.id;
    return client;
  } catch (error) {
    socket.disconnect();
    throw error;
  }
}

async function waitFor(check, description) {
  const deadline = Date.now() + 6500;
  do {
    const value = check();
    if (value) return value;
    await sleep(30);
  } while (Date.now() < deadline);
  throw new Error(`等待逾時：${description}`);
}

async function exercise(initial, restart) {
  const identities = [randomUUID(), randomUUID()];
  const sockets = [];
  async function player(base, index) {
    const result = await connect(base, identities[index]);
    sockets.push(result.socket);
    return result;
  }
  try {
    let host = await player(initial, 0);
    let mate = await player(initial, 1);
    const created = await host.socket.timeout(5000).emitWithAck('room:create', { roomName: 'Recovery check', mode: 'classic' });
    assert.equal(created.ok, true);
    const code = created.code;
    const hostId = host.id;
    const mateId = mate.id;
    assert.equal((await mate.socket.timeout(5000).emitWithAck('room:join', { code, role: 'player' })).ok, true);
    host.socket.emit('room:ready', { ready: true });
    mate.socket.emit('room:ready', { ready: true });
    await waitFor(() => host.view?.room.members.every(member => member.ready), '兩人準備');
    host.socket.emit('room:start', {});
    const room = await waitFor(() => host.view?.game?.drawerId && host.view, '開局');
    const drawer = room.game.drawerId === hostId ? host : mate;
    const guesser = drawer === host ? mate : host;
    const choice = await waitFor(() => drawer.view?.game?.choices?.[0], '畫家選題');
    drawer.socket.emit('room:pick', { wordId: choice.id });
    await waitFor(() => drawer.view?.game?.phase === 'drawing', '進入作畫');
    drawer.socket.emit('room:stroke', { stroke: { t: 'pen', c: 0, w: 1, p: [100, 100, 200, 200] } });
    const stroke = await waitFor(() => guesser.strokes[0], '筆畫廣播確認');
    const next = await restart();

    host = await player(next, 0);
    assert.equal(host.id, hostId);
    const resumed = await host.socket.timeout(5000).emitWithAck('room:join', { code, role: 'player' });
    assert.equal(resumed.reconnected, true);
    const paused = await waitFor(() => host.view?.room?.recovering != null && host.view, '保留房間');
    assert.equal(paused.room.hostId, hostId);
    assert.equal(paused.game.deadline, 0);
    assert.deepEqual(paused.game.strokes, [stroke.stroke]);
    mate = await player(next, 1);
    assert.equal(mate.id, mateId);
    assert.equal((await mate.socket.timeout(5000).emitWithAck('room:join', { code, role: 'player' })).reconnected, true);
    const after = await waitFor(() => mate.view?.room?.recovering === null && mate.view, '恢復畫布');
    assert.equal(after.room.code, code);
    assert.equal(after.game.turnNo, room.game.turnNo);
    assert.equal(after.game.drawerId, room.game.drawerId);
    assert.deepEqual(after.game.strokes, [stroke.stroke]);
    assert.ok(after.game.deadline > Date.now());
    await mate.socket.timeout(5000).emitWithAck('room:leave', {});
    await host.socket.timeout(5000).emitWithAck('room:leave', {});
    return { code, strokes: after.game.strokes.length };
  } finally {
    for (const socket of sockets) socket.disconnect();
  }
}

function start(filename) {
  const child = spawn(process.execPath, ['-e', `
    const { server } = require('./server.js');
    server.listen(0, '127.0.0.1', () => console.log(server.address().port));
  `], {
    cwd: path.join(__dirname, '..'), env: { ...process.env, DRAW_ROOM_DB_PATH: filename },
    stdio: ['ignore', 'pipe', 'inherit']
  });
  const base = Promise.race([
    once(child.stdout, 'data').then(([data]) => `http://127.0.0.1:${String(data).trim()}`),
    once(child, 'exit').then(([code]) => { throw new Error(`等待伺服器啟動失敗 (${code})`); })
  ]);
  return { child, base };
}

async function stop(child) {
  if (child.exitCode != null || child.signalCode != null) return;
  const done = once(child, 'exit');
  child.kill('SIGKILL');
  await done;
}

if (require.main === module) test('強制重啟後保留玩家身分、房主、作畫輪次與已確認筆畫', { timeout: 24000 }, async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'draw-guess-restart-'));
  const file = path.join(directory, 'rooms.sqlite');
  let server = start(file);
  try {
    const result = await exercise(await server.base, async () => {
      await stop(server.child);
      server = start(file);
      return server.base;
    });
    assert.equal(result.strokes, 1);
  } finally {
    await stop(server.child);
    rmSync(directory, { recursive: true, force: true });
  }
});

if (require.main === module) for (const mode of ['relay', 'pickdraw']) {
  test(`${mode} 房間在還原後保留輪次與玩家`, () => {
    const directory = mkdtempSync(path.join(tmpdir(), `draw-guess-${mode}-`));
    let checkpoints;
    try {
      const file = path.join(directory, 'rooms.sqlite');
      checkpoints = openCheckpoints(file);
      const store = new RoomStore({ checkpoints });
      const now = Date.now();
      const { room } = store.create('host', { name: 'Host', mode, now });
      for (const [id, name] of [['mate', 'Mate'], ['other', 'Other']]) {
        assert.equal(room.join(id, { name, role: 'player', now }).ok, true);
        room.setReady(id, true);
      }
      assert.equal(room.start('host', now).ok, true);
      store.flushCheckpoints(now);
      const restored = new RoomStore({ checkpoints }).get(room.code);
      assert.ok(restored.recovery);
      assert.equal(restored.hostId, 'host');
      assert.equal(restored.state.questionNo, room.state.questionNo);
      assert.deepEqual(restored.state.players, room.state.players);
      for (const id of ['host', 'mate', 'other']) assert.equal(restored.join(id, { now }).reconnected, true);
      assert.equal(restored.recovery, null);
      assert.equal(restored.phase, 'playing');
    } finally {
      checkpoints?.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
}

module.exports = { exercise };
