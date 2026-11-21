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
  const nextRoundAt = st.deadline;
  TP.tick(st, nextRoundAt);
  check('第 2 輪換下一位開頭', st.phase === 'picking' && st.starterId === 'b');
  t = toStep(st, nextRoundAt);
  check('第 2 輪順序從 B 起、A 最後猜', st.chain.cells.map((c) => c.authorId).join('') === 'bcda' && st.chain.cells[3].kind === 'write');
}

section('挑題與換手');
{
  const st = make(3);
  check('不是開頭的人不能挑', !TP.pick(st, 'b', st.choices[0], T0).ok);
  check('只能從候選挑', TP.pick(st, 'a', 'zzz', T0).error === 'srv.err.telephonePickFromThree');
  TP.tick(st, T0 + C.PICK_MS);
  check('時間到隨機挑題並開始第一格', st.phase === 'step' && st.choices.indexOf(st.wordId) >= 0 && st.stepNo === 0);
  check('每格先有 5 秒換手', C.HANDOFF_MS === 5000 && st.stepStartsAt === T0 + C.PICK_MS + C.HANDOFF_MS && st.deadline === st.stepStartsAt + 45000);
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

section('截止時間');
{
  const st = make(4);
  check('選題截止時權限已收回', !TP.toPublic(st, 'a', st.deadline).you.canPick &&
    TP.pick(st, 'a', st.choices[0], st.deadline).ok === false && st.phase === 'picking');
  TP.tick(st, st.deadline);
  let t = drawAndPass(st, st.stepStartsAt);
  t = drawAndPass(st, t);
  check('作畫截止時不再收新筆畫或交畫', !TP.toPublic(st, 'c', st.deadline).you.canDraw &&
    !TP.addStroke(st, 'c', LINE, st.deadline).ok && !TP.submitDrawing(st, 'c', st.deadline).ok);
  t = drawAndPass(st, t);
  TP.answer(st, 'd', '草稿', t, { draft: true });
  const view = TP.toPublic(st, 'd', st.deadline);
  check('猜題截止時收回答案、提示與翻看權限', !view.you.canAnswer && !view.you.canHint && !view.you.canPeek &&
    !TP.answer(st, 'd', '逾時答案', st.deadline).ok && !TP.giveHint(st, 'd', st.deadline).ok &&
    !TP.peek(st, 'd', 0, st.deadline).ok);
  check('中途猜題在該棒截止時也停止', !TP.toPublic(st, 'b', st.deadline).you.midGuess.can &&
    !TP.midGuess(st, 'b', '逾時猜題', st.deadline).ok);
  TP.tick(st, st.deadline);
  check('猜題截止仍自動交出原草稿', st.chain.cells[3].text === '草稿' && st.phase === 'reveal');
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
  const st = make(4, { matchId: 'public-match-id' });
  const pickA = TP.toPublic(st, 'a', T0), pickB = TP.toPublic(st, 'b', T0);
  check('玩家與觀戰者只收到公開對局識別碼', ['a', 'b', null].every((id) => {
    const view = TP.toPublic(st, id, T0);
    return view.seed === st.matchId && !JSON.stringify(view).includes(st.seed);
  }));
  const restored = JSON.parse(JSON.stringify(st));
  delete restored.matchId;
  check('舊存檔的公開識別碼不會回退到抽題種子', TP.toPublic(restored, 'b', T0).seed !== restored.seed);
  check('候選題只給開頭的人', pickA.choices.length === 3 && pickB.choices.length === 0);
  let t = toStep(st, T0);
  const a = TP.toPublic(st, 'a', t);
  check('開頭的人看題目、有參考範本', a.prev.kind === 'word' && a.prev.text === answerOf(st) && a.referenceId === st.wordId);
  check('A 畫：只有下一位 B 看得到', TP.watchersOf(st).join() === 'b');
  const b = TP.toPublic(st, 'c', t);
  check('作畫中其他人只知道輪到誰', b.turnId === 'a' && !b.prev && !b.answer && !b.drawings && b.strokes.length === 0);
  check('觀戰者全部看得到：題目與正在畫的這一張', TP.toPublic(st, null, t).answer === answerOf(st) && TP.toPublic(st, null, t).you.watching && !TP.toPublic(st, null, t).prev);
  t = drawAndPass(st, t);
  const b2 = TP.toPublic(st, 'b', t);
  const b2h = TP.toPublic(st, 'b', t - 1);
  check('下一位換手 5 秒內拿到上一張畫、沒有題目', b2h.prev.kind === 'drawing' && b2h.prev.idx === 0 && b2h.prev.strokes.length === 1 && !b2h.answer);
  check('開始作畫後上一張畫收起來', b2.prev.strokes === null && b2.prev.hidden === true && b2.prev.idx === 0);
  check('換手中還不能畫', !b2h.you.canDraw && b2.you.canDraw);
  TP.addStroke(st, 'b', LINE, t);
  const aw = TP.toPublic(st, 'a', t);
  check('B 畫：前面的 A 與下一位 C 看得到', aw.you.watching && aw.strokes.length === 1 && TP.watchersOf(st).join() === 'a,c' && TP.toPublic(st, 'c', t).strokes.length === 1);
  check('B 畫：最後的 D 看不到、觀戰者看得到', !TP.toPublic(st, 'd', t).you.watching && TP.toPublic(st, 'd', t).strokes.length === 0 && TP.toPublic(st, null, t).strokes.length === 1);
  TP.undoStroke(st, 'b', t);
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

section('中間的人猜原本的題目');
{
  const st = make(4);
  let t = toStep(st, T0);
  check('開頭的人不能猜', TP.midGuess(st, 'a', 'x', t).error === 'srv.err.telephoneCantMidGuess');
  t = drawAndPass(st, t);
  check('還沒交出畫不能猜', TP.midGuess(st, 'b', 'x', t).error === 'srv.err.telephoneCantMidGuess');
  t = drawAndPass(st, t);
  check('交出畫之後可以猜', TP.toPublic(st, 'b', t).you.midGuess.can && TP.toPublic(st, 'b', t).you.midGuess.points === 50);
  check('猜錯可以再猜，下一次剩 40', TP.midGuess(st, 'b', '一定不是這個', t).next === 40 && TP.midGuess(st, 'b', '也不是', t).next === 30);
  const hit = TP.midGuess(st, 'b', answerOf(st), t);
  check('猜中 50 - 10×猜錯次數', hit.kind === 'hit' && hit.points === 30 && TP.player(st, 'b').score === 30);
  check('猜中後不能再猜', TP.midGuess(st, 'b', answerOf(st), t).error === 'srv.err.telephoneMidDone');
  check('玩家列標記猜中', TP.toPublic(st, 'a', t).players.find((p) => p.id === 'b').midHit);
  check('猜中的訊息不含題目、別人拿不到猜的內容', !JSON.stringify(TP.toPublic(st, 'c', t)).includes(answerOf(st)));
  t = drawAndPass(st, t);
  check('最後一人不能用中間猜題', TP.midGuess(st, 'd', 'x', t).error === 'srv.err.telephoneCantMidGuess');
  check('C 交出畫後也能猜', TP.toPublic(st, 'c', t).you.midGuess.can);
  TP.answer(st, 'd', answerOf(st), t);
  check('整串分數另外算：B 233＋30', TP.player(st, 'b').score === 263 && st.chain.cells[1].midPts === 30);
  const rv = TP.toPublic(st, 'a', t);
  check('揭曉列表標出誰自己猜中', rv.chain.cells[1].midHit && rv.chain.cells[1].midWrong === 2 && !rv.chain.cells[2].midHit);
  check('揭曉後不能再猜', TP.midGuess(st, 'c', 'x', t).error === 'srv.err.telephoneCantMidGuess');

  const s2 = make(4);
  t = toStep(s2, T0); t = drawAndPass(s2, t); t = drawAndPass(s2, t);
  TP.midGuess(s2, 'b', answerOf(s2), t);
  t = drawAndPass(s2, t);
  TP.tick(s2, t, { away: ['d'] });
  check('已經猜中的人不會被找去代猜', s2.chain.cells[3].authorId === 'c');
  const s3 = make(3);
  t = toStep(s3, T0); t = drawAndPass(s3, t); t = drawAndPass(s3, t);
  TP.midGuess(s3, 'b', answerOf(s3), t);
  TP.tick(s3, t, { away: ['c'] });
  check('沒人能代猜就直接揭曉、沒寫答案', s3.phase === 'reveal' && s3.chain.cells[2].skipped);
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
  mem.dg_stats = JSON.stringify({ solo: { games: 1, win: 0, correct: 2, drawn: 1, best: 50 }, online: { games: 3, win: 1, correct: 4, drawn: 3, best: 600 } });
  const s0 = Store.stats();
  check('舊存檔讀得出來，新模式補 0', s0.online.games === 3 && s0.telephone && s0.telephone.games === 0);
  Store.recordGame('telephone', { win: true, correct: 1, drawn: 2, score: 500 });
  const s1 = Store.stats();
  check('畫圖傳話記在自己那一欄', s1.telephone.games === 1 && s1.telephone.best === 500 && s1.online.games === 3);
}

section('房間層（lib/rooms.js）');
{
  const { RoomStore } = require('../lib/rooms.js');
  const store = new RoomStore({ idleMs: 0 });
  let t = T0;
  const made = store.create('h', { name: '房主', roomName: '傳話房', settings: { drawSec: 30, guessSec: 20, rounds: 2 }, now: t, mode: 'telephone' });
  check('可以開畫圖傳話房', made.ok && made.room.mode === 'telephone' && made.room.telephone);
  const room = made.room;
  check('設定套用（30／20 秒、2 輪）、人數上限 5', room.settings.drawSec === 30 && room.settings.guessSec === 20 && room.settings.rounds === 2 && room.settings.maxPlayers === 5);
  check('每張畫秒數只收 30／45／60', !room.setSettings('h', { drawSec: 90 }).ok && room.setSettings('h', { drawSec: 45 }).ok);
  check('猜答案秒數只收 20／25／30', !room.setSettings('h', { guessSec: 15 }).ok && room.setSettings('h', { guessSec: 25 }).ok);
  check('輪次只收 1–3', !room.setSettings('h', { rounds: 4 }).ok && !room.setSettings('h', { rounds: 0 }).ok && room.setSettings('h', { rounds: 1 }).ok);
  store.create('r', { name: '接力', roomName: '接力房', now: t, mode: 'relay' });
  store.create('c', { name: '一般', roomName: '一般房', now: t });
  check('一般大廳與接力大廳看不到這種房', store.list().every((r) => r.mode === 'classic') && store.list('relay').every((r) => r.mode === 'relay'));
  check('畫圖傳話大廳只列這種房', store.list('telephone').length === 1 && store.list('telephone')[0].code === room.code && store.list('telephone')[0].guessSec === 25);

  room.join('a', { name: '阿明', now: t + 1 });
  check('2 人不能開始', !room.start('h', t).ok && room.canStart().error === 'srv.err.needPlayers');
  room.join('b', { name: '小美', now: t + 2 });
  room.join('c', { name: '大雄', now: t + 3 });
  room.join('d', { name: '胖虎', now: t + 4 });
  const sixth = room.join('e', { name: '路人', now: t + 5 });
  check('第 6 人只能觀戰', sixth.ok && room.member('e').role === 'spectator');
  check('聊天：等待室可以聊', room.chat('a', '哈囉', t + 10).ok);
  ['a', 'b', 'c', 'd'].forEach((id) => room.setReady(id, true));
  check('5 人可以開始', room.start('h', t + 20).ok && room.state.phase === 'picking' && room.state.starterId === 'h');
  t += 20;
  check('傳話中聊天被擋', room.chat('a', '嗨', t + 3000).error === 'srv.err.telephoneNoChat');
  check('傳話中不送聊天紀錄', room.viewFor('a', t).room.chat.length === 0 && !room.viewFor('a', t).you.can.chat);
  check('不能用一般猜題', room.guess('d', 'x', t).error === 'srv.err.telephoneUseAnswer');
  const vh = room.viewFor('h', t), va = room.viewFor('a', t), ve = room.viewFor('e', t);
  check('開頭的人看得到候選並可挑', vh.game.choices.length === 3 && vh.you.can.pick);
  check('其他人與觀戰者拿不到候選', va.game.choices.length === 0 && ve.game.choices.length === 0);
  const want = room.state.choices[0];
  const ans = Words.byId(want, room.state.lang).text;
  check('挑題', room.pickWord('h', want, t).ok && room.state.phase === 'step');
  check('換手中不能畫', !room.stroke('h', LINE, t + 10).ok);
  t = room.state.stepStartsAt;
  const tk = room.tick(t);
  check('換手結束發出 go 事件', tk.events.some((e) => e.type === 'go') && room.viewFor('h', t).you.can.draw);
  check('只有輪到的人能畫', room.stroke('h', LINE, t).ok && !room.stroke('a', LINE, t).ok);
  check('其他玩家的視圖沒有題目與畫', ['a', 'b', 'c', 'd'].every((id) => !JSON.stringify(room.viewFor(id, t).game).includes(ans) && !room.viewFor(id, t).game.prev));
  check('觀戰者看得到題目與正在畫的這一張', room.viewFor('e', t).game.answer === ans && room.viewFor('e', t).game.strokes.length === 1);
  check('還沒輪到、也不是下一位的人看不到筆畫', ['b', 'c', 'd'].every((id) => room.viewFor(id, t).game.strokes.length === 0) && room.viewFor('a', t).game.strokes.length === 1);
  check('紀錄裡沒有題目', !JSON.stringify(room.feed).includes(ans) && !JSON.stringify(room.summary).includes(ans));
  check('交出畫', room.telephoneSubmit('h', t).ok && room.state.stepNo === 1);
  t = room.state.stepStartsAt; room.tick(t);
  const a1 = room.viewFor('a', t - 1);
  check('下一位換手時拿到上一張畫、沒有題目', a1.game.prev.kind === 'drawing' && a1.game.prev.strokes.length === 1 && !JSON.stringify(a1.game).includes(ans));
  check('開始作畫後上一張畫收起來、房主可以看阿明畫', room.viewFor('a', t).game.prev.strokes === null && room.viewFor('h', t).game.you.watching);
  /* 阿明斷線：5 秒內照常，超過就跳過 */
  room.disconnect('a', t);
  check('狀態列：斷線的是畫的人', room.viewFor('b', t).room.awayRole === 'drawer');
  room.tick(t + 4999);
  check('5 秒內不跳過', room.state.stepNo === 1);
  room.tick(t + 5000);
  check('超過 5 秒跳過', room.state.stepNo === 2 && room.state.chain.cells[1].skipped && room.feed.some((e) => e.key === 'srv.feed.telephoneSkip'));
  t = room.state.stepStartsAt; room.tick(t);
  check('小美拿到房主的畫', room.viewFor('b', t).game.prev.idx === 0);
  room.stroke('b', LINE, t); room.telephoneSubmit('b', t);
  check('房間層：中間的人猜錯回 miss、不廣播', room.telephoneMidGuess('b', '一定不對', t + 10).kind === 'miss' && !room.feed.some((e) => e.key === 'srv.feed.telephoneMidHit'));
  check('房間層：猜太快被擋', room.telephoneMidGuess('b', ans, t + 11).error === 'srv.err.guessTooFast');
  check('房間層：猜中大家看到「猜中了」但沒有題目', room.telephoneMidGuess('b', ans, t + 5000).kind === 'hit' &&
    room.feed.some((e) => e.key === 'srv.feed.telephoneMidHit') && !JSON.stringify(room.feed).includes(ans));
  check('房間層：等待中的人視圖有猜題框旗標', room.viewFor('b', t + 5000).game.you.midGuess.hit && room.viewFor('b', t + 5000).game.you.midGuess.points === 40);
  t = room.state.stepStartsAt; room.tick(t);
  room.telephoneSubmit('c', t);
  t = room.state.stepStartsAt; room.tick(t);
  const vd = room.viewFor('d', t);
  check('最後一人是猜的人', vd.game.you.role === 'guesser' && vd.you.can.answer && vd.you.can.hint);
  check('猜的人可以偷看', vd.you.can.peek && vd.game.peekable.length > 0);
  check('畫的人不能偷看', !room.telephonePeek('h', 0, t).ok);
  check('偷看第一張', room.telephonePeek('d', 0, t).ok && room.viewFor('d', t).game.peeks.length === 1);
  check('偷看的畫只給猜的人', room.viewFor('h', t).game.peeks === null);
  const vb = room.viewFor('b', t), ve2 = room.viewFor('e', t);
  check('等猜答案時其他人與觀戰者可翻看畫', vb.game.drawings.length === 3 && ve2.game.drawings.length === 3 && !JSON.stringify(vb.game).includes(ans));
  check('草稿不廣播也不揭曉', room.telephoneAnswer('d', '草稿字', true, t).ok && room.state.phase === 'step' && !JSON.stringify(room.viewFor('h', t)).includes('草稿字'));
  const fin = room.telephoneAnswer('d', ans, false, t + 100);
  check('寫答案就揭曉', fin.ok && room.state.phase === 'reveal');
  const rv = room.viewFor('b', t + 100);
  check('揭曉整串給大家', rv.game.chain.word === ans && rv.game.chain.cells.length === 5 && rv.game.chain.hit);
  check('揭曉後紀錄才有題目', JSON.stringify(room.summary).includes(ans));
  check('揭曉時可以聊天', room.chat('b', '笑死', t + 3000).ok && room.viewFor('b', t + 3000).you.can.chat);
  check('揭曉時可以按表情（指定格子）', room.react('b', 'laugh', 0).ok && !room.react('h', 'laugh', 0).ok);
  /* 偷看第一張 ×0.3：300／250／200／150／100 → 90／0（跳過）／60／45／30 */
  const pts = room.state.chain.cells.map((c) => c.points).join();
  check('計分：偷看 ×0.3、被跳過的人 0 分', pts === '90,0,60,45,30', pts);
  check('單輪揭曉後結算', (room.tick(room.state.deadline), room.phase === 'finished' && room.state.awards.funniest[0].id === 'h'));
  check('結算畫廊', room.gallery().ok && room.gallery().mode === 'telephone' && room.gallery().items.length === 2);
  check('結算可以聊天', room.viewFor('b', room.state.deadline).you.can.chat || room.chat('c', '再一局', room.state.endedAt + 5000).ok);
}

section('房間層：中途離開與最後一人代猜');
{
  const { RoomStore } = require('../lib/rooms.js');
  const store = new RoomStore({ idleMs: 0 });
  let t = T0;
  const room = store.create('h', { name: '房主', roomName: '傳話房', settings: { rounds: 1 }, now: t, mode: 'telephone' }).room;
  ['a', 'b', 'c'].forEach((id, i) => { room.join(id, { name: id, now: t + i + 1 }); room.setReady(id, true); });
  room.start('h', t + 10);
  t += 10;
  room.pickWord('h', room.state.choices[0], t);
  t = room.state.stepStartsAt;
  room.telephoneSubmit('h', t); t = room.state.stepStartsAt;
  room.telephoneSubmit('a', t); t = room.state.stepStartsAt;
  room.telephoneSubmit('b', t); t = room.state.stepStartsAt;
  room.leave('c', t);
  check('最後一人離開由前一位代猜', room.state.stepNo === 3 && room.state.chain.cells[3].authorId === 'b' && room.feed.some((e) => e.key === 'srv.feed.telephoneStandIn'));
  room.leave('b', t + 1);
  check('剩不到 3 人立即結算', room.phase === 'finished' && room.feed.some((e) => e.key === 'srv.feed.telephonePlayerLeft'));
}

console.log('\n' + (failed ? '✗ ' : '✓ ') + '畫圖傳話規則：' + passed + ' 通過，' + failed + ' 失敗');
if (failed) process.exit(1);
