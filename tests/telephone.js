/*
 * tests/telephone.js — 畫圖傳話（Beta）規則核心的單元測試
 *
 *   node tests/telephone.js
 *
 * 前半段只測 public/js/telephone-rules.js 的狀態轉移；房間層在後半段用 lib/rooms.js 測。
 */
'use strict';

const TP = require('../public/js/telephone-rules.js');
const Words = require('../public/js/words.js');

let passed = 0;
let failed = 0;
function section(name) { console.log('\n▍' + name); }
function check(name, condition, detail) {
  if (condition) { passed += 1; console.log('  ✓ ' + name); }
  else { failed += 1; console.log('  ✗ ' + name + (detail !== undefined ? '  →  ' + JSON.stringify(detail) : '')); }
}

const C = TP.CONST;
const T0 = 1000000;
const IDS = ['a', 'b', 'c', 'd', 'e', 'f'];
const LINE = { t: 'pen', c: '#222222', w: 6, p: [10, 10, 200, 200] };

function make(n, opts) {
  const players = IDS.slice(0, n).map((id) => ({ id, name: id.toUpperCase() }));
  const st = TP.createState(Object.assign({ seed: 'TP1', players, rounds: 1, drawSec: 45, guessSec: 25 }, opts || {}));
  TP.start(st, T0);
  return st;
}

/** 開頭的人挑第一個候選、等換手結束；回傳可以動手的時間 */
function toStep(st, t) {
  TP.pick(st, st.starterId, st.choices[0], t);
  return st.stepStartsAt;
}

/** 輪到的人畫一筆後送出；回傳下一格可以動手的時間 */
function drawAndPass(st, t) {
  const cell = TP.currentCell(st);
  TP.addStroke(st, cell.authorId, LINE, t);
  TP.submitDrawing(st, cell.authorId, t);
  return st.stepStartsAt;
}

const answerOf = (st) => Words.byId(st.wordId, st.lang).text;

section('開局與設定');
{
  const two = TP.createState({ seed: 'X', players: [{ id: 'a' }, { id: 'b' }] });
  const r = TP.start(two, T0);
  check('不到 3 人不能開局', !r.ok && r.error === 'srv.err.telephoneNeedPlayers');
  check('超過 5 人只取前 5 位', TP.createState({ players: IDS.map((id) => ({ id })) }).players.length === 5);
  check('每張畫 30／45／60，非法值回預設 45', TP.createState({ drawSec: 30 }).drawSec === 30 && TP.createState({ drawSec: 90 }).drawSec === 45);
  check('猜答案 20／25／30，非法值回預設 25', TP.createState({ guessSec: 20 }).guessSec === 20 && TP.createState({ guessSec: 15 }).guessSec === 25);
  check('輪次 1–3，超過壓回 3、預設 1', TP.createState({ rounds: 9 }).rounds === 3 && TP.createState({}).rounds === 1);

  const st = make(4);
  check('進入挑題、15 秒', st.phase === 'picking' && st.deadline === T0 + C.PICK_MS);
  check('候選題 3 個', st.choices.length === 3);
  check('第 1 輪由座位第一位開頭', st.starterId === 'a');
}

section('格子與傳話順序');
{
  [3, 4, 5].forEach((n) => {
    const st = make(n);
    toStep(st, T0);
    const cells = st.chain.cells;
    check(n + ' 人：' + n + ' 格、前面都畫、最後一格猜',
      cells.length === n && cells.slice(0, -1).every((c) => c.kind === 'draw') && cells[n - 1].kind === 'write');
    check(n + ' 人：照座位從開頭的人往下', cells.map((c) => c.authorId).join('') === IDS.slice(0, n).join(''));
  });
  const st = make(4, { rounds: 3 });
  let t = toStep(st, T0);
  for (let i = 0; i < 3; i++) t = drawAndPass(st, t);
  TP.answer(st, 'd', '隨便', t);
  check('寫完答案就揭曉', st.phase === 'reveal');
  TP.tick(st, st.deadline);
  check('第 2 輪換下一位開頭', st.phase === 'picking' && st.starterId === 'b');
  t = toStep(st, st.deadline);
  check('第 2 輪順序從 B 起、A 最後猜', st.chain.cells.map((c) => c.authorId).join('') === 'bcda' && st.chain.cells[3].kind === 'write');
}

section('挑題與換手');
{
  const st = make(3);
  check('不是開頭的人不能挑', !TP.pick(st, 'b', st.choices[0], T0).ok);
  check('只能從候選挑', TP.pick(st, 'a', 'zzz', T0).error === 'srv.err.telephonePickFromThree');
  TP.tick(st, T0 + C.PICK_MS);
  check('時間到隨機挑題並開始第一格', st.phase === 'step' && st.choices.indexOf(st.wordId) >= 0 && st.stepNo === 0);
  check('每格先有 3 秒換手', st.stepStartsAt === T0 + C.PICK_MS + C.HANDOFF_MS && st.deadline === st.stepStartsAt + 45000);
  check('換手中不能畫', TP.addStroke(st, 'a', LINE, st.stepStartsAt - 1).error === 'srv.err.telephoneHandoff');
  check('換手結束可以畫', TP.addStroke(st, 'a', LINE, st.stepStartsAt).ok);
  check('沒輪到的人不能畫', TP.addStroke(st, 'b', LINE, st.stepStartsAt).error === 'srv.err.telephoneNotYourTurn');
}

section('逾時送出');
{
  const st = make(3);
  let t = toStep(st, T0);
  TP.addStroke(st, 'a', LINE, t);
  TP.tick(st, st.deadline);
  check('作畫時間到：畫一半照傳給下一位', st.stepNo === 1 && st.chain.cells[0].done && st.chain.cells[0].strokes.length === 1);
  TP.tick(st, st.deadline);
  check('空白的畫也照傳', st.stepNo === 2 && st.chain.cells[1].done);
  t = st.stepStartsAt;
  check('猜答案時間是 25 秒', st.deadline - st.stepStartsAt === 25000);
  TP.answer(st, 'c', '草稿', t, { draft: true });
  check('草稿不會揭曉', st.phase === 'step');
  TP.tick(st, st.deadline);
  check('時間到用草稿送出', st.phase === 'reveal' && st.chain.cells[2].text === '草稿');

  const st2 = make(3);
  t = toStep(st2, T0);
  TP.tick(st2, st2.deadline); TP.tick(st2, st2.deadline); TP.tick(st2, st2.deadline);
  check('答案沒寫就留空（揭曉顯示「（沒寫）」）、全部 0 分', st2.phase === 'reveal' && st2.chain.cells[2].text === '' && st2.players.every((p) => p.score === 0));
}

section('計分');
{
  const scoreFor = (n, hintsFn) => {
    const st = make(n);
    let t = toStep(st, T0);
    for (let i = 0; i < n - 1; i++) t = drawAndPass(st, t);
    if (hintsFn) hintsFn(st, IDS[n - 1], t);
    TP.answer(st, IDS[n - 1], answerOf(st), t);
    return st.chain.cells.map((c) => c.points);
  };
  check('3 人猜中：300／200／100', scoreFor(3).join() === '300,200,100');
  check('4 人猜中：300／233／167／100', scoreFor(4).join() === '300,233,167,100');
  check('5 人猜中：300／250／200／150／100', scoreFor(5).join() === '300,250,200,150,100');
  check('字數提示 ×0.6：180／140／100／60', scoreFor(4, (st, id, t) => TP.giveHint(st, id, t)).join() === '180,140,100,60');
  check('偷看 B 的畫 ×0.7：210／163／117／70', scoreFor(4, (st, id, t) => TP.peek(st, id, 1, t)).join() === '210,163,117,70');
  check('偷看 A 的畫 ×0.3：90／70／50／30', scoreFor(4, (st, id, t) => TP.peek(st, id, 0, t)).join() === '90,70,50,30');
  check('字數＋偷看 A ×0.18：54／42／30／18', scoreFor(4, (st, id, t) => { TP.giveHint(st, id, t); TP.peek(st, id, 0, t); }).join() === '54,42,30,18');
  check('偷看兩張相乘 ×0.21', scoreFor(4, (st, id, t) => { TP.peek(st, id, 0, t); TP.peek(st, id, 1, t); })[0] === 63);
  check('5 人偷看倍數 0.3／0.5／0.7', TP.peekFactor(0, 3) === 0.3 && TP.peekFactor(1, 3) === 0.5 && TP.peekFactor(2, 3) === 0.7);

  const st = make(3);
  let t = toStep(st, T0);
  t = drawAndPass(st, t); t = drawAndPass(st, t);
  TP.answer(st, 'c', '一定不是這個答案啦', t);
  check('猜錯全部 0 分', st.phase === 'reveal' && !st.chain.hit && st.players.every((p) => p.score === 0));
  check('分數累加到玩家', (() => { const s = make(3); let u = toStep(s, T0); u = drawAndPass(s, u); u = drawAndPass(s, u); TP.answer(s, 'c', answerOf(s), u); return TP.player(s, 'a').score === 300 && TP.player(s, 'c').score === 100; })());
}

section('提示與偷看');
{
  const st = make(4);
  let t = toStep(st, T0);
  check('畫的人不能用提示', TP.giveHint(st, 'a', t).error === 'srv.err.telephoneWrongStep');
  for (let i = 0; i < 3; i++) t = drawAndPass(st, t);
  check('猜的人可以照順序用提示', TP.giveHint(st, 'd', t).ok && st.hints === 1);
  check('上一張本來就看得到，不能偷看', TP.peek(st, 'd', 2, t).error === 'srv.err.telephoneCantPeek');
  check('偷看第一張', TP.peek(st, 'd', 0, t).ok);
  check('同一張不能重複偷看', TP.peek(st, 'd', 0, t).error === 'srv.err.telephoneAlreadyPeeked');
  const pv = TP.toPublic(st, 'd', t);
  check('偷看的畫只給猜的人', pv.peeks.length === 1 && pv.peeks[0].idx === 0 && pv.peeks[0].strokes.length === 1);
  check('偷看清單標示倍數', pv.peekable.length === 2 && pv.peekable[0].factor === 0.3 && pv.peekable[1].factor === 0.7 && pv.peekable[0].state === 'peeked');
  check('其他人拿不到偷看的畫與提示', TP.toPublic(st, 'a', t).peeks === null && TP.toPublic(st, 'a', t).hint === null);
}

section('隱藏資訊（toPublic）');
{
  const st = make(4);
  const pickA = TP.toPublic(st, 'a', T0), pickB = TP.toPublic(st, 'b', T0);
  check('候選題只給開頭的人', pickA.choices.length === 3 && pickB.choices.length === 0);
  let t = toStep(st, T0);
  const a = TP.toPublic(st, 'a', t);
  check('開頭的人看題目、有參考範本', a.prev.kind === 'word' && a.prev.text === answerOf(st) && a.referenceId === st.wordId);
  const b = TP.toPublic(st, 'b', t);
  check('作畫中其他人只知道輪到誰', b.turnId === 'a' && !b.prev && !b.answer && !b.drawings && b.strokes.length === 0);
  check('觀戰者也拿不到內容', !TP.toPublic(st, null, t).prev && !TP.toPublic(st, null, t).answer);
  t = drawAndPass(st, t);
  const b2 = TP.toPublic(st, 'b', t);
  check('下一位只拿到上一張畫、沒有題目', b2.prev.kind === 'drawing' && b2.prev.idx === 0 && !b2.answer);
  check('換手中還不能畫', !TP.toPublic(st, 'b', t - 1).you.canDraw && b2.you.canDraw);
  t = drawAndPass(st, t);
  const c3 = TP.toPublic(st, 'c', t);
  check('第三位只拿到第二張', c3.prev.idx === 1 && !c3.drawings);
  t = drawAndPass(st, t);
  const d = TP.toPublic(st, 'd', t);
  check('猜的人只拿到上一張、沒有題目', d.prev.kind === 'drawing' && d.prev.idx === 2 && !d.answer && !d.drawings);
  const a4 = TP.toPublic(st, 'a', t), spec = TP.toPublic(st, null, t);
  check('等最後一人猜：其他人可翻看所有畫', a4.drawings.length === 3 && spec.drawings.length === 3);
  check('等最後一人猜：其他人看不到題目與草稿', !a4.answer && a4.draft === undefined && !a4.hint);
  TP.answer(st, 'd', '草稿', t, { draft: true });
  check('草稿不給其他人', JSON.stringify(TP.toPublic(st, 'a', t)).indexOf('草稿') < 0);
  check('傳話中不能聊天', !a4.you.canChat);
  TP.answer(st, 'd', answerOf(st), t);
  const rv = TP.toPublic(st, 'b', t);
  check('揭曉後才給整串', rv.chain && rv.chain.word === answerOf(st) && rv.chain.cells.length === 4 && rv.chain.cells[3].text === answerOf(st));
  check('揭曉時可以聊天', rv.you.canChat);
}

section('斷線與離開');
{
  const st = make(4);
  let t = toStep(st, T0);
  t = drawAndPass(st, t);
  TP.tick(st, t + 10, { away: ['b'] });
  check('輪到的人斷線直接跳過', st.stepNo === 2 && st.chain.cells[1].skipped);
  const c = TP.toPublic(st, 'c', st.stepStartsAt);
  check('上一張畫交給下一位', c.prev.kind === 'drawing' && c.prev.idx === 0);
  t = drawAndPass(st, st.stepStartsAt);
  TP.answer(st, 'd', answerOf(st), t);
  check('被跳過的人不得分', st.chain.cells[1].points === 0 && st.chain.cells[0].points === 300);

  const s2 = make(4);
  t = toStep(s2, T0);
  t = drawAndPass(s2, t); t = drawAndPass(s2, t);
  t = drawAndPass(s2, t);
  TP.tick(s2, t, { away: ['d'] });
  t = s2.stepStartsAt;
  check('最後一人斷線由前一位代猜', s2.stepNo === 3 && s2.chain.cells[3].authorId === 'c' && s2.chain.cells[3].stand === 'd');
  const cv = TP.toPublic(s2, 'c', t);
  check('代猜的人拿到猜答案畫面', cv.you.role === 'guesser' && cv.prev.kind === 'drawing');

  const s3 = make(3);
  t = toStep(s3, T0);
  TP.tick(s3, t, { away: ['a'] });
  const b = TP.toPublic(s3, 'b', s3.stepStartsAt);
  check('開頭的人斷線，下一位看題目作畫', s3.chain.cells[0].skipped && b.prev.kind === 'word');

  const s4 = make(4);
  TP.tick(s4, T0 + 1, { away: ['a'] });
  check('挑題時開頭的人斷線換下一位挑', s4.starterId === 'b' && s4.phase === 'picking');

  const s5 = make(3);
  const r = TP.removePlayer(s5, 'b', T0);
  check('剩不到 3 人直接結算', r.finished && s5.phase === 'over');

  const s6 = make(4);
  t = toStep(s6, T0);
  TP.removePlayer(s6, 'a', t);
  check('輪到的人離開就跳過', s6.stepNo === 1 && s6.chain.cells[0].skipped);
}

section('中途進房');
{
  const st = make(3, { rounds: 2 });
  check('對局中進房先觀戰', TP.addPlayer(st, { id: 'd', name: 'D' }).ok && TP.player(st, 'd').pending);
  check('觀戰中的玩家角色是 spectator', TP.toPublic(st, 'd', T0).you.role === 'spectator');
  let t = toStep(st, T0);
  check('這一輪不在順序裡', st.chain.cells.length === 3);
  t = drawAndPass(st, t); t = drawAndPass(st, t);
  TP.answer(st, 'c', 'x', t);
  TP.tick(st, st.deadline);
  check('下一輪起加入順序', st.seats.length === 4 && !TP.player(st, 'd').pending);
  TP.addPlayer(st, { id: 'e' });
  check('滿 5 人後不能再加入', TP.addPlayer(st, { id: 'f' }).error === 'srv.err.seatsFull');
}

section('揭曉表情與最好笑');
{
  const st = make(3, { rounds: 1 });
  let t = toStep(st, T0);
  t = drawAndPass(st, t); t = drawAndPass(st, t);
  check('揭曉前不能按', TP.react(st, 'a', 'laugh', 0).error === 'srv.err.reactRevealOnly');
  TP.answer(st, 'c', 'x', t);
  check('不能按自己那格', TP.react(st, 'a', 'laugh', 0).error === 'srv.err.telephoneOwnCell');
  check('可以對別人的格子按', TP.react(st, 'b', 'laugh', 0).ok && TP.react(st, 'c', 'heart', 0).ok && TP.react(st, 'a', 'laugh', 2).ok);
  check('再按一次收回', TP.react(st, 'a', 'laugh', 2).on === false);
  const rv = TP.toPublic(st, 'b', t);
  check('揭曉列表帶表情數', rv.chain.cells[0].counts.laugh === 1 && rv.chain.cells[0].counts.heart === 1 && rv.chain.cells[0].mine.indexOf('laugh') >= 0);
  TP.tick(st, st.deadline);
  check('最後一輪揭曉後結算', st.phase === 'over');
  check('最好笑頒給表情最多那格的作者', st.awards.funniest.length === 1 && st.awards.funniest[0].id === 'a' && st.awards.funniest[0].count === 2);
  check('畫廊收錄每一張畫', TP.galleryOf(st).length === 2 && TP.galleryOf(st)[0].reactions.laugh === 1);

  const s2 = make(3);
  t = toStep(s2, T0); t = drawAndPass(s2, t); t = drawAndPass(s2, t);
  TP.answer(s2, 'c', 'x', t);
  TP.tick(s2, s2.deadline);
  check('沒人按就不頒最好笑', s2.awards.funniest.length === 0);
}

section('種子重現');
{
  const a = make(4, { seed: 'SAME' }), b = make(4, { seed: 'SAME' });
  check('同種子候選題相同', a.choices.join() === b.choices.join());
  TP.tick(a, T0 + C.PICK_MS); TP.tick(b, T0 + C.PICK_MS);
  check('同種子逾時隨機結果相同', a.wordId === b.wordId);
}

/* 房間層在 stage 2 接上後補在這裡 */
if (typeof module === 'object' && require.main === module) {
  const done = () => {
    console.log('\n' + passed + ' 通過、' + failed + ' 失敗');
    process.exit(failed ? 1 : 0);
  };
  done();
}
