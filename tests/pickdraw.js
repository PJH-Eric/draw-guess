/*
 * tests/pickdraw.js — 你出我畫他猜（Beta）規則核心的單元測試
 *
 *   node tests/pickdraw.js
 *
 * 只測 public/js/pickdraw-rules.js 的狀態轉移；房間層在後半段用 lib/rooms.js 測。
 */
'use strict';

const PD = require('../public/js/pickdraw-rules.js');
const Words = require('../public/js/words.js');

let passed = 0;
let failed = 0;
function section(name) { console.log('\n▍' + name); }
function check(name, condition, detail) {
  if (condition) { passed += 1; console.log('  ✓ ' + name); }
  else { failed += 1; console.log('  ✗ ' + name + (detail !== undefined ? '  →  ' + JSON.stringify(detail) : '')); }
}

const C = PD.CONST;
const T0 = 1000000;

function make(opts) {
  const players = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }];
  const st = PD.createState(Object.assign({ seed: 'PD1', players, laps: 1, drawSec: 60 }, opts || {}));
  PD.start(st, T0);
  return st;
}

/** 出題者挑第一個候選 → 倒數結束 → 開始作畫；回傳作畫開始時間 */
function toDrawing(st, t) {
  PD.pick(st, st.pickerId, st.choices[0], t);
  t += C.COUNTDOWN_MS;
  PD.tick(st, t);
  return t;
}

const answer = (st) => Words.byId(st.wordId, st.lang).text;

section('開局與設定');
{
  const two = PD.createState({ seed: 'X', players: [{ id: 'a' }, { id: 'b' }] });
  check('不到 3 人不能開局', !PD.start(two, T0).ok && PD.start(two, T0).error === 'srv.err.pickdrawNeedThree');
  const four = PD.createState({ seed: 'X', players: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }] });
  check('超過 3 人只取前 3 位', four.players.length === 3);
  check('秒數 30／60／90 以外回預設 60', PD.createState({ drawSec: 45 }).drawMs === 60000 && PD.createState({ drawSec: 90 }).drawMs === 90000);
  check('圈數超過 5 壓回 5、預設 2', PD.createState({ laps: 9 }).laps === 5 && PD.createState({}).laps === 2);

  const st = make();
  check('進入挑題階段、15 秒', st.phase === 'picking' && st.deadline === T0 + C.PICK_MS);
  check('候選題 3 個', st.choices.length === 3);
  check('第 1 題：A 出、B 畫、C 猜', st.pickerId === 'a' && st.drawerId === 'b' && st.guesserId === 'c');
  check('一圈 3 題', PD.totalQuestions(st) === 3 && PD.totalQuestions(make({ laps: 2 })) === 6);
}

section('角色輪替');
{
  const st = make({ laps: 2 });
  const seen = [];
  let t = T0;
  for (let q = 0; q < 6; q++) {
    seen.push([st.pickerId, st.drawerId, st.guesserId].join(''));
    t = toDrawing(st, t);
    t += st.drawMs;
    PD.tick(st, t);
    t += C.REVEAL_MS;
    PD.tick(st, t);
  }
  check('A→B→C 輪流當出題者、上一題畫家變下一題出題者', seen.join(',') === 'abc,bca,cab,abc,bca,cab', seen);
  const lap1 = seen.slice(0, 3);
  const each = ['a', 'b', 'c'].every((id) => [0, 1, 2].every((k) => lap1.some((s) => s[k] === id)));
  check('一圈內每人各當一次三種角色', each);
  check('題數跑完進結算', st.phase === 'over' && st.over);
}

section('挑題');
{
  const st = make();
  check('只有出題者能挑', !PD.pick(st, 'b', st.choices[0], T0).ok && !PD.pick(st, 'c', st.choices[0], T0).ok);
  check('只能挑候選題', !PD.pick(st, 'a', 'nope', T0).ok);
  const want = st.choices[2];
  check('出題者挑題成功進倒數', PD.pick(st, 'a', want, T0 + 100).ok && st.phase === 'countdown' && st.wordId === want);
  check('倒數 3 秒', st.deadline === T0 + 100 + C.COUNTDOWN_MS);
  check('挑完不能再挑', !PD.pick(st, 'a', st.choices[0], T0 + 200).ok);
  PD.tick(st, T0 + 100 + C.COUNTDOWN_MS - 1);
  check('倒數未完還不能畫', st.phase === 'countdown' && !PD.addStroke(st, 'b', { t: 'pen', p: [1, 1, 5, 5] }).ok);
  const ev = PD.tick(st, T0 + 100 + C.COUNTDOWN_MS).events;
  check('倒數結束開始作畫', st.phase === 'drawing' && ev[0].type === 'drawstart' && st.deadline === st.drawStartedAt + 60000);

  const a1 = make(); const a2 = make();
  PD.tick(a1, T0 + C.PICK_MS - 1);
  check('15 秒內不自動挑', a1.phase === 'picking');
  const e1 = PD.tick(a1, T0 + C.PICK_MS).events;
  PD.tick(a2, T0 + C.PICK_MS);
  check('15 秒沒挑：自動隨機挑一個候選題', a1.phase === 'countdown' && a1.choices.indexOf(a1.wordId) >= 0 && e1[0].auto === true);
  check('自動挑題用種子亂數可重播', a1.wordId === a2.wordId);
}

section('作畫與提示');
{
  const st = make();
  const t = toDrawing(st, T0);
  check('只有畫家能畫', PD.addStroke(st, 'b', { t: 'pen', p: [1, 1, 9, 9] }).ok && !PD.addStroke(st, 'a', { t: 'pen', p: [1, 1, 9, 9] }).ok && !PD.addStroke(st, 'c', { t: 'pen', p: [1, 1, 9, 9] }).ok);
  check('只有畫家能復原', !PD.undoStroke(st, 'a').ok && PD.undoStroke(st, 'b').ok);
  check('只有畫家能清空', !PD.clearBoard(st, 'c').ok && PD.clearBoard(st, 'b').ok);
  check('猜題者不能給提示', !PD.giveHint(st, 'c', t).ok);
  check('出題者不能給提示', !PD.giveHint(st, 'a', t).ok);
  const h = PD.giveHint(st, 'b', t);
  check('畫家給提示 1（字數）', h.ok && h.step === 1 && st.hints === 1);
}

section('計分');
{
  const at = (sec, hints) => PD.pointsAt(60000, sec * 1000, hints || 0);
  const p0 = at(0), p30 = at(30), p60 = at(60), ph = at(30, 1);
  check('第 0 秒：A100 B300 C300', p0.picker === 100 && p0.drawer === 300 && p0.guesser === 300, p0);
  check('第 30 秒：A200 B200 C200', p30.picker === 200 && p30.drawer === 200 && p30.guesser === 200, p30);
  check('第 60 秒：A300 B100 C100', p60.picker === 300 && p60.drawer === 100 && p60.guesser === 100, p60);
  check('第 30 秒、已給 1 張提示：A200 B120 C120', ph.picker === 200 && ph.drawer === 120 && ph.guesser === 120, ph);
  const p2 = at(0, 2);
  check('2 張提示 B、C 300×0.36=108，A 不受影響', p2.drawer === 108 && p2.picker === 100, p2);

  const st = make();
  const t = toDrawing(st, T0);
  PD.giveHint(st, 'b', t);
  check('只有猜題者能猜', !PD.guess(st, 'a', answer(st), t).ok && !PD.guess(st, 'b', answer(st), t).ok);
  const miss = PD.guess(st, 'c', '一定不是這個ZZ', t + 1000);
  check('猜錯次數不限、累計錯誤', miss.ok && miss.verdict !== 'hit' && PD.guess(st, 'c', '也不是ZZ', t + 2000).ok && st.wrong === 2);
  const hit = PD.guess(st, 'c', answer(st), t + 30000);
  check('第 30 秒猜中、1 張提示：A200 B120 C120 入帳', hit.ok && hit.verdict === 'hit' &&
    PD.player(st, 'a').score === 200 && PD.player(st, 'b').score === 120 && PD.player(st, 'c').score === 120,
    st.players.map((p) => p.score));
  check('分項記到出題／作畫／猜題', PD.player(st, 'a').pickPts === 200 && PD.player(st, 'b').drawPts === 120 && PD.player(st, 'c').guessPts === 120);
  check('猜中進公布 7 秒', st.phase === 'reveal' && st.deadline === t + 30000 + C.REVEAL_MS);
  check('公布後不能再猜', !PD.guess(st, 'c', answer(st), t + 31000).ok);

  const tu = make();
  const t2 = toDrawing(tu, T0);
  PD.tick(tu, t2 + 60000);
  check('時間到沒猜中：A300、B 與 C 0 分', tu.phase === 'reveal' && PD.player(tu, 'a').score === 300 && PD.player(tu, 'b').score === 0 && PD.player(tu, 'c').score === 0);
  check('紀錄原因 timeup', tu.log[0].reason === 'timeup');

  const gu = make();
  const t3 = toDrawing(gu, T0);
  check('只有猜題者能放棄', !PD.giveUp(gu, 'a', t3).ok && !PD.giveUp(gu, 'b', t3).ok);
  check('放棄：A300、B 與 C 0 分', PD.giveUp(gu, 'c', t3 + 5000).ok && gu.phase === 'reveal' && PD.player(gu, 'a').score === 300 && PD.player(gu, 'b').score === 0 && gu.log[0].reason === 'giveup');
}

section('表情');
{
  const st = make();
  const t = toDrawing(st, T0);
  check('出題者作畫中可丟表情', PD.cheer(st, 'a', 'lol').ok);
  check('畫家與猜題者不能丟作畫表情', !PD.cheer(st, 'b', 'lol').ok && !PD.cheer(st, 'c', 'lol').ok);
  check('不認得的表情被擋', !PD.cheer(st, 'a', 'boom').ok);
  PD.addStroke(st, 'b', { t: 'pen', p: [1, 1, 9, 9] });
  PD.guess(st, 'c', answer(st), t + 1000);
  check('公布時玩家可以按愛心', PD.react(st, 'c', 'heart').ok && PD.toPublic(st, 'a').reactions.counts.heart === 1);
  check('再按一次收回', PD.react(st, 'c', 'heart').ok && PD.toPublic(st, 'a').reactions.counts.heart === 0);
  check('觀戰者不能按', !PD.react(st, 'zz', 'heart').ok);
}

section('隱藏資訊（toPublic）');
{
  const st = make();
  const pa = PD.toPublic(st, 'a'), pb = PD.toPublic(st, 'b'), pc = PD.toPublic(st, 'c'), sp = PD.toPublic(st, null);
  check('只有出題者拿到候選題', pa.choices.length === 3 && pb.choices.length === 0 && pc.choices.length === 0 && sp.choices.length === 0);
  check('角色標示', pa.you.role === 'picker' && pb.you.role === 'drawer' && pc.you.role === 'guesser' && sp.you.role === 'spectator');
  check('出題者可以挑、不能聊天', pa.you.canPick && !pa.you.canChat && pc.you.canChat);
  toDrawing(st, T0);
  const ans = answer(st);
  const gc = PD.toPublic(st, 'c');
  check('作畫中猜題者拿不到答案', gc.answer === null && !JSON.stringify(gc).includes(ans) && !JSON.stringify(gc).includes(st.wordId));
  check('參考範本只給畫家', PD.toPublic(st, 'b').referenceId === st.wordId);
  check('出題者、猜題者、觀戰者拿不到範本', PD.toPublic(st, 'a').referenceId === null && gc.referenceId === null && PD.toPublic(st, null).referenceId === null);
  check('畫家、出題者、觀戰者看得到答案', PD.toPublic(st, 'b').answer === ans && PD.toPublic(st, 'a').answer === ans && PD.toPublic(st, null).answer === ans);
  check('權限旗標', PD.toPublic(st, 'b').you.canDraw && PD.toPublic(st, 'b').you.canHint && gc.you.canGuess && gc.you.canGiveUp && PD.toPublic(st, 'a').you.canCheer);
  PD.giveUp(st, 'c', T0 + 9000);
  check('公布時猜題者看得到答案', PD.toPublic(st, 'c').answer === ans);
  check('公布答案後畫家沒有範本', PD.toPublic(st, 'b').referenceId === null);
}

section('斷線（tick 的 away）');
{
  const st = make();
  let t = toDrawing(st, T0);
  PD.tick(st, t + 1000, { away: ['b'] });
  check('畫家斷線：公布、原因 drawerleft', st.phase === 'reveal' && st.log[0].reason === 'drawerleft');
  check('畫家斷線：三人都 0 分', st.players.every((p) => p.score === 0));

  const st2 = make();
  PD.tick(st2, T0 + 1000, { away: ['b', 'c'] });
  check('挑題中畫家斷線：先不公布（還沒有題目）', st2.phase === 'picking');
  PD.pick(st2, 'a', st2.choices[0], T0 + 2000);
  PD.tick(st2, T0 + 2000, { away: ['c'] });
  check('挑完進倒數時猜題者已斷線：直接公布', st2.phase === 'reveal' && st2.log[0].reason === 'guesserleft');

  const st3 = make();
  t = toDrawing(st3, T0);
  PD.tick(st3, t + 1000, { away: ['a'] });
  check('出題者斷線不影響這一題', st3.phase === 'drawing');
}

section('戰績分模式（storage.js）');
{
  const vm = require('vm');
  const fs = require('fs');
  const path = require('path');
  const mem = {};
  const box = {
    localStorage: {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: (k) => { delete mem[k]; }
    },
    crypto: { getRandomValues: (a) => a }, Math, Date, JSON
  };
  box.window = box; box.globalThis = box;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/js/storage.js'), 'utf8'), box);
  const Store = box.Store || box.window.Store;
  /* 舊版存檔只有 solo／online 兩欄 */
  mem.dg_stats = JSON.stringify({ solo: { games: 1, win: 0, correct: 2, drawn: 1, best: 50 }, online: { games: 3, win: 1, correct: 4, drawn: 3, best: 600 } });
  const s0 = Store.stats();
  check('舊存檔讀得出來，新模式補 0、舊數字不動', s0.online.games === 3 && s0.solo.best === 50 && s0.relay.games === 0 && s0.pickdraw.games === 0);
  Store.recordGame('pickdraw', { win: true, correct: 2, drawn: 3, score: 900 });
  Store.recordGame('relay', { win: false, correct: 1, drawn: 2, score: 300 });
  const s1 = Store.stats();
  check('你出我畫他猜記在自己那一欄', s1.pickdraw.games === 1 && s1.pickdraw.win === 1 && s1.pickdraw.best === 900);
  check('接力記在自己那一欄，一般線上不受影響', s1.relay.games === 1 && s1.relay.win === 0 && s1.online.games === 3);
}

section('離開與結算');
{
  const st = make();
  toDrawing(st, T0);
  const r = PD.removePlayer(st, 'c', T0 + 5000);
  check('遊戲中剩不到 3 人立即結算', r.ok && r.finished && st.phase === 'over' && st.over);

  const full = make();
  let t = T0;
  /* 第 1 題 C 很快猜中；第 2 題時間到；第 3 題 B 放棄 */
  t = toDrawing(full, t);
  PD.addStroke(full, full.drawerId, { t: 'pen', p: [1, 1, 9, 9] });
  PD.guess(full, full.guesserId, answer(full), t);
  t += C.REVEAL_MS; PD.tick(full, t);
  t = toDrawing(full, t);
  PD.addStroke(full, full.drawerId, { t: 'pen', p: [2, 2, 8, 8] });
  t += full.drawMs; PD.tick(full, t);
  t += C.REVEAL_MS; PD.tick(full, t);
  t = toDrawing(full, t);
  PD.giveUp(full, full.guesserId, t + 1000);
  t += 1000 + C.REVEAL_MS; PD.tick(full, t);
  check('一圈打完進結算', full.phase === 'over');
  /* a: 出題 100（第 1 題）；b: 畫 300 + 出題 300；c: 猜 300 + 出題 300 */
  const sc = full.players.map((p) => p.id + p.score).join(',');
  check('總分 a100 b600 c600', sc === 'a100,b600,c600', sc);
  check('冠軍並列 b、c', full.winners.join(',') === 'b,c');
  check('整人王並列 b、c（各 300）', full.awards.pick.map((x) => x.id).join(',') === 'b,c' && full.awards.pick[0].value === 300);
  check('神畫手 b、神猜手 c', full.awards.draw[0].id === 'b' && full.awards.guess[0].id === 'c');
  const g = PD.galleryOf(full);
  check('畫廊放有畫的題目（2 題）並帶三個角色', g.length === 2 && g[0].mode === 'pickdraw' && g[0].pickerName === 'A' && g[0].drawerName === 'B' && g[0].guesserName === 'C');
  check('結算前不給畫廊', PD.galleryOf(make()).length === 0);

  const again = PD.start(full, t + 100);
  check('再來一局：分數歸零重新從第 1 題', again.ok && full.questionNo === 1 && full.players.every((p) => p.score === 0) && full.phase === 'picking');
}

section('房間層（lib/rooms.js）');
{
  const { RoomStore } = require('../lib/rooms.js');
  const store = new RoomStore({ idleMs: 0 });
  let t = T0;
  const made = store.create('h', { name: '房主', roomName: '三人房', settings: { laps: 1, drawSec: 30 }, now: t, mode: 'pickdraw' });
  check('可以開你出我畫他猜房', made.ok && made.room.mode === 'pickdraw' && made.room.pickdraw);
  const room = made.room;
  check('設定套用（1 圈、30 秒）、人數上限 3', room.settings.laps === 1 && room.settings.drawSec === 30 && room.settings.maxPlayers === 3);
  check('秒數只收 30／60／90', !room.setSettings('h', { drawSec: 45 }).ok && room.setSettings('h', { drawSec: 60 }).ok);
  check('圈數只收 1–5', !room.setSettings('h', { laps: 6 }).ok && !room.setSettings('h', { laps: 0 }).ok && room.setSettings('h', { laps: 1 }).ok);
  store.create('r', { name: '接力', roomName: '接力房', now: t, mode: 'relay' });
  store.create('c', { name: '一般', roomName: '一般房', now: t });
  check('一般大廳與接力大廳看不到這種房', store.list().every((r) => r.mode === 'classic') && store.list('relay').every((r) => r.mode === 'relay'));
  check('你出我畫他猜大廳只列這種房', store.list('pickdraw').length === 1 && store.list('pickdraw')[0].code === room.code && store.list('pickdraw')[0].laps === 1);

  room.join('a', { name: '阿明', now: t + 1 });
  check('只有 2 人不能開始', !room.start('h', t).ok && room.canStart().error === 'srv.err.pickdrawNeedThree');
  room.join('b', { name: '小美', now: t + 2 });
  const fourth = room.join('d', { name: '路人', now: t + 3 });
  check('第 4 人只能觀戰', fourth.ok && fourth.downgraded && room.member('d').role === 'spectator');
  check('觀戰者沒位子不能下場', !room.becomePlayer('d', t).ok);
  room.setReady('a', true); room.setReady('b', true);
  const st = room.start('h', t);
  check('剛好 3 人可以開始', st.ok && room.phase === 'playing' && room.state.phase === 'picking');
  check('座位照進房順序：房主出題、阿明畫、小美猜', room.state.pickerId === 'h' && room.state.drawerId === 'a' && room.state.guesserId === 'b');

  const vh = room.viewFor('h', t), va = room.viewFor('a', t), vb = room.viewFor('b', t), vd = room.viewFor('d', t);
  check('出題者看得到 3 個候選並可挑題', vh.game.choices.length === 3 && vh.you.can.pick);
  check('畫家、猜題者、觀戰者都拿不到候選題', va.game.choices.length === 0 && vb.game.choices.length === 0 && vd.game.choices.length === 0);
  check('出題者對局中聊天被擋', room.chat('h', '哈囉', t).error === 'srv.err.pickerCantChat');
  check('畫家不能挑題', !room.pickWord('a', room.state.choices[0], t).ok);
  const want = room.state.choices[1];
  check('出題者挑題', room.pickWord('h', want, t + 100).ok && room.state.phase === 'countdown');
  t += 100 + C.COUNTDOWN_MS;
  room.tick(t);
  check('倒數完開始作畫', room.state.phase === 'drawing');
  const ans = Words.byId(want, room.state.lang).text;
  const gv = room.viewFor('b', t);
  check('猜題者的視圖沒有答案', gv.game.answer === null && !JSON.stringify(gv).includes(ans));
  check('觀戰者看得到答案', room.viewFor('d', t).game.answer === ans);
  check('只有畫家能畫', room.stroke('a', { t: 'pen', p: [1, 1, 9, 9] }, t).ok && !room.stroke('h', { t: 'pen', p: [1, 1, 9, 9] }, t).ok && !room.stroke('b', { t: 'pen', p: [1, 1, 9, 9] }, t).ok);
  check('畫家可以給提示、猜題者不行', room.giveHint('a', t).ok && !room.giveHint('b', t).ok && room.state.hints === 1);
  check('權限旗標：畫家 hint、猜題者 giveUp、出題者 cheer', room.viewFor('a', t).you.can.hint && room.viewFor('b', t).you.can.giveUp && room.viewFor('h', t).you.can.cheer);
  check('出題者可以丟表情、畫家不行', room.cheer('h', 'cheer', t).ok && !room.cheer('a', 'cheer', t).ok);
  check('沒有「跳過」', !room.skipTurn('a', t).ok);
  check('出題者與猜題者不能按「畫完了」', !room.markDone('h', t).ok && !room.markDone('b', t).ok);
  check('畫家可以按「畫完了」（只是通知）', room.markDone('a', t).ok && room.viewFor('b', t).room.drawerDone === true && room.state.phase === 'drawing');
  const miss = room.guess('b', '一定不是這個ZZ', t + 500);
  check('猜錯進猜題紀錄（大家看得到）', miss.ok && miss.kind === 'miss' && room.feed[room.feed.length - 1].text === '一定不是這個ZZ');
  check('出題者不能猜', !room.guess('h', ans, t + 600).ok);
  const hit = room.guess('b', ans, t + 1000);
  check('猜中回報 pickdraw', hit.ok && hit.kind === 'hit' && hit.pickdraw && hit.points > 0, hit);
  check('公布後摘要與猜題者視圖才有答案', JSON.stringify(room.summary).includes(ans) && room.viewFor('b', t + 1000).game.answer === ans);

  /* 下一題：上一題畫家變出題者 */
  t += 1000 + C.REVEAL_MS;
  room.tick(t);
  check('第 2 題：阿明出題、小美畫、房主猜', room.state.pickerId === 'a' && room.state.drawerId === 'b' && room.state.guesserId === 'h');
  t += C.PICK_MS;
  room.tick(t);
  check('挑題逾時自動隨機', room.state.phase === 'countdown' && room.feed.some((e) => e.key === 'srv.feed.pickdrawAutoPicked'));
  check('新的一題「畫完了」重新計算', room.viewFor('b', t).room.drawerDone === false);

  /* 猜題者斷線：15 秒內照常，題目列標出斷線的是猜題者；超過就公布、這題不計分 */
  const before = room.state.players.map((p) => p.score).join();
  room.disconnect('h', t);
  t += C.COUNTDOWN_MS;
  room.tick(t);
  check('猜題者剛斷線：照常開始作畫', room.state.phase === 'drawing');
  const av = room.viewFor('a', t);
  check('題目列資訊：斷線的是猜題者', av.room.awayRole === 'guesser' && av.room.drawerAwayUntil > t);
  room.tick(t + 15000 - C.COUNTDOWN_MS - 1);
  check('斷線 15 秒內不公布', room.state.phase === 'drawing');
  room.tick(t + 15000);
  const last = room.state.log[room.state.log.length - 1];
  check('猜題者斷線超過 15 秒：公布答案', room.state.phase === 'reveal' && last.reason === 'guesserleft');
  check('斷線那題三人都不得分（出題者不白拿 300）', room.state.players.map((p) => p.score).join() === before && last.points.picker === 0);
  check('斷線公布寫進紀錄', room.feed.some((e) => e.key === 'srv.feed.pickdrawGuesserLeft'));
  room.join('h', { name: '房主', now: t + 15010 });
  check('回來後斷線提示消失', room.viewFor('a', t + 15010).room.awayRole === null);

  room.leave('b', t + 10);
  check('剩不到 3 人立即結算', room.phase === 'finished' && room.state.over);
  check('結算後可拿畫廊', room.gallery().ok && room.gallery().mode === 'pickdraw' && room.gallery().items.length === 1);
  check('結算帶三個獎項', !!room.viewFor('h', t + 20).game.awards && 'pick' in room.viewFor('h', t + 20).game.awards);
  check('2 人不能再來一局', !room.canRematch('h'));
  check('觀戰者可以補位下場', room.becomePlayer('d', t + 30).ok);
  check('補滿 3 人可以再來一局', room.canRematch('h'));
}

console.log('\n' + (failed ? '✗ ' : '✓ ') + '你出我畫他猜規則：' + passed + ' 通過，' + failed + ' 失敗');
if (failed) process.exit(1);
