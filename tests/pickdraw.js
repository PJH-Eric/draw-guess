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
  check('畫家、出題者、觀戰者看得到答案', PD.toPublic(st, 'b').answer === ans && PD.toPublic(st, 'a').answer === ans && PD.toPublic(st, null).answer === ans);
  check('權限旗標', PD.toPublic(st, 'b').you.canDraw && PD.toPublic(st, 'b').you.canHint && gc.you.canGuess && gc.you.canGiveUp && PD.toPublic(st, 'a').you.canCheer);
  PD.giveUp(st, 'c', T0 + 9000);
  check('公布時猜題者看得到答案', PD.toPublic(st, 'c').answer === ans);
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

console.log('\n' + (failed ? '✗ ' : '✓ ') + '你出我畫他猜規則：' + passed + ' 通過，' + failed + ' 失敗');
if (failed) process.exit(1);
