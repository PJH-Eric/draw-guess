/*
 * tests/relay.js — 接力模式（Beta）規則核心的單元測試
 *
 *   node tests/relay.js
 *
 * 只測 public/js/relay-rules.js 的狀態轉移；房間層與線上對局在 tests/verify.js 與 scripts/online-check.js。
 */
'use strict';

const Relay = require('../public/js/relay-rules.js');
const Words = require('../public/js/words.js');

let passed = 0;
let failed = 0;
function section(name) { console.log('\n▍' + name); }
function check(name, condition, detail) {
  if (condition) { passed += 1; console.log('  ✓ ' + name); }
  else { failed += 1; console.log('  ✗ ' + name + (detail !== undefined ? '  →  ' + JSON.stringify(detail) : '')); }
}

const C = Relay.CONST;
const T0 = 1000000;

function make(n, opts) {
  const o = opts || {};
  const players = [];
  for (let i = 1; i <= (n || 4); i++) players.push({ id: 'p' + i, name: '玩家' + i });
  const st = Relay.createState(Object.assign({ seed: 'RELAY1', players, guessRounds: 1, batonSec: 7 }, o));
  Relay.start(st, T0);
  return st;
}

/** 讓所有畫家投第一個候選題 → 進入倒數 */
function voteAll(st, t, pick) {
  for (const id of st.order) Relay.vote(st, id, pick || st.choices[0], t);
}

/** 投票 → 倒數結束 → 第一棒開始，回傳目前時間 */
function toDrawing(st, t) {
  voteAll(st, t);
  t += C.COUNTDOWN_MS;
  Relay.tick(st, t);
  return t;
}

const answer = (st) => Words.byId(st.wordId, st.lang).text;

section('開局與角色');
{
  const two = Relay.createState({ seed: 'X', players: [{ id: 'a' }, { id: 'b' }] });
  check('少於 3 人不能開局', !Relay.start(two, T0).ok);

  const st = make(4);
  check('第一位猜題者是座位第一位', st.guesserId === 'p1', st.guesserId);
  check('進入投票階段', st.phase === 'voting');
  check('候選題 4 個', st.choices.length === 4);
  check('接力順序不含猜題者、包含其餘三人', st.order.length === 3 && st.order.indexOf('p1') < 0);
  check('每棒秒數 7／12／17 以外回預設 12', Relay.createState({ batonSec: 9 }).batonMs === 12000);
  check('猜題次數超過 5 被壓回 5', Relay.createState({ guessRounds: 9 }).guessRounds === 5);
}

section('投票');
{
  const st = make(4);
  const g = Relay.toPublic(st, 'p1');
  check('猜題者看不到候選題', g.choices.length === 0 && g.answer === null);
  const pv = Relay.toPublic(st, 'p2');
  check('畫家看得到 4 個候選題與票數', pv.choices.length === 4 && pv.choices.every((c) => c.votes === 0));
  check('投影不帶誰投了哪題', !JSON.stringify(pv).includes('"votes":{'));
  check('猜題者不能投票', !Relay.vote(st, 'p1', st.choices[0], T0).ok);
  check('只能投候選題', !Relay.vote(st, 'p2', 'nope', T0).ok);

  const [a, b] = st.order;
  Relay.vote(st, a, st.choices[1], T0 + 10);
  Relay.vote(st, b, st.choices[1], T0 + 20);
  check('還沒投完不提前開始', st.phase === 'voting');
  const last = st.order[2];
  Relay.vote(st, last, st.choices[2], T0 + 30);
  check('全部投完提前開始（進倒數）', st.phase === 'countdown');
  check('最高票的題目勝出', st.wordId === st.choices[1]);
  check('倒數 3 秒', st.deadline === T0 + 30 + C.COUNTDOWN_MS);
  check('接力三圈：棒數 = 畫家數 × 3', st.batons.length === st.order.length * 3);

  /* 平手：從同票題目隨機，同一個種子重播結果一樣 */
  const tieA = make(3, { seed: 'TIE001' });
  Relay.vote(tieA, tieA.order[0], tieA.choices[0], T0);
  Relay.vote(tieA, tieA.order[1], tieA.choices[3], T0);
  const tieB = make(3, { seed: 'TIE001' });
  Relay.vote(tieB, tieB.order[0], tieB.choices[0], T0);
  Relay.vote(tieB, tieB.order[1], tieB.choices[3], T0);
  check('平手只在同票題目中抽', [tieA.choices[0], tieA.choices[3]].indexOf(tieA.wordId) >= 0, tieA.wordId);
  check('平手抽選可重播', tieA.wordId === tieB.wordId);

  /* 沒人投：時間到從全部候選隨機 */
  const none = make(4, { seed: 'NOVOTE' });
  Relay.tick(none, T0 + C.VOTE_MS - 1);
  check('投票時間沒到不開票', none.phase === 'voting');
  Relay.tick(none, T0 + C.VOTE_MS);
  check('沒人投也會選出一題', none.phase === 'countdown' && none.choices.indexOf(none.wordId) >= 0);

  /* 斷線的人不用等 */
  const away = make(4);
  Relay.vote(away, away.order[0], away.choices[0], T0);
  Relay.vote(away, away.order[1], away.choices[0], T0);
  Relay.tick(away, T0 + 5, { away: [away.order[2]] });
  check('斷線的畫家不用等，其他人投完就開始', away.phase === 'countdown');
}

section('接力與換棒');
{
  const st = make(4);
  let t = toDrawing(st, T0);
  check('倒數結束第一棒開始', st.phase === 'drawing' && st.batonNo === 0 && st.drawerId === st.order[0]);
  const pd = Relay.toPublic(st, st.drawerId);
  check('正在畫的人可以畫', pd.you.canDraw && pd.you.role === 'drawer');
  const other = Relay.toPublic(st, st.order[1]);
  check('等待中的畫家不能畫、看得到下一棒是自己', !other.you.canDraw && other.nextDrawerId === st.order[1] && other.you.isNext);
  check('不是這棒的人不能畫', !Relay.addStroke(st, st.order[1], { t: 'pen', p: [1, 1, 5, 5] }).ok);
  check('當棒的人可以畫', Relay.addStroke(st, st.order[0], { t: 'pen', p: [1, 1, 5, 5] }).ok);
  check('投影不帶這棒值多少分', !('points' in pd) && !JSON.stringify(pd).includes('batonPoints'));

  Relay.tick(st, t + C.BATON_SEC_DEFAULT * 0 + 7000 - 1);
  check('一定畫滿秒數（時間沒到不交棒）', st.phase === 'drawing');
  t += 7000;
  Relay.tick(st, t);
  check('時間到進入 3 秒換棒緩衝', st.phase === 'handoff' && st.deadline === t + C.HANDOFF_MS);
  check('緩衝中畫布鎖住', !Relay.addStroke(st, st.order[0], { t: 'pen', p: [1, 1, 5, 5] }).ok && !Relay.addStroke(st, st.order[1], { t: 'pen', p: [1, 1, 5, 5] }).ok);
  t += C.HANDOFF_MS;
  Relay.tick(st, t);
  check('緩衝結束換下一棒', st.phase === 'drawing' && st.batonNo === 1 && st.drawerId === st.order[1]);

  /* 復原收回畫布上最後一筆（別人畫的也可以） */
  check('可以收回上一棒畫的最後一筆', Relay.undoStroke(st, st.order[1]).ok && st.strokes.length === 0);
  Relay.addStroke(st, st.order[1], { t: 'pen', p: [1, 1, 9, 9] });
  check('可以清空畫布', Relay.clearBoard(st, st.order[1]).ok && st.strokes.length === 0);

  /* 一路跑完三圈：最後一棒後也有緩衝，之後公布答案 */
  const full = make(3);
  let ft = toDrawing(full, T0);
  for (let i = 0; i < full.batons.length; i++) {
    ft += 7000; Relay.tick(full, ft);
    if (i === full.batons.length - 1) check('最後一棒後也有緩衝', full.phase === 'handoff');
    ft += C.HANDOFF_MS; Relay.tick(full, ft);
  }
  check('三圈畫完沒猜中就公布答案', full.phase === 'reveal' && full.log[0].reason === 'timeup');
  check('沒人得分', full.players.every((p) => p.score === 0));
  check('棒數上限是三圈', full.log[0].batons === 6);
}

section('計分');
{
  check('第一棒 300 分', Relay.batonPoints(0, 9, 0) === 300);
  check('最後一棒 100 分', Relay.batonPoints(8, 9, 0) === 100);
  check('中間平均遞減', Relay.batonPoints(4, 9, 0) === 200);
  check('用一張提示打六折', Relay.batonPoints(0, 9, 1) === 180);
  check('用兩張提示再打六折', Relay.batonPoints(0, 9, 2) === 108);

  const st = make(4);
  let t = toDrawing(st, T0);
  check('不是猜題者不能猜', !Relay.guess(st, st.order[1], 'x', t).ok);
  const wrong = Relay.guess(st, 'p1', '完全不對的答案XYZ', t);
  check('猜錯可以繼續猜', wrong.ok && wrong.verdict !== 'hit' && st.phase === 'drawing');
  const first = st.order[0];
  const hit = Relay.guess(st, 'p1', answer(st), t + 100);
  check('第一棒猜中：猜題者 300 分', hit.ok && hit.verdict === 'hit' && Relay.player(st, 'p1').score === 300, hit);
  check('當下作畫者同分', Relay.player(st, first).score === 300);
  check('猜中就公布答案', st.phase === 'reveal');
  check('關鍵一筆記一次', Relay.player(st, first).keys === 1);

  /* 緩衝中猜中算上一棒 */
  const hb = make(4);
  let ht = toDrawing(hb, T0);
  ht += 7000; Relay.tick(hb, ht);
  check('（進入緩衝）', hb.phase === 'handoff');
  const prev = hb.order[0];
  Relay.guess(hb, 'p1', answer(hb), ht + 500);
  check('緩衝中猜中算上一棒（第一棒 300）', Relay.player(hb, prev).score === 300 && Relay.player(hb, hb.order[1]).score === 0);

  /* 提示由猜題者自己按，之後的得分打折，作畫者一起降 */
  const hn = make(4);
  let nt = toDrawing(hn, T0);
  check('畫家不能按提示', !Relay.useHint(hn, hn.order[0], nt).ok);
  check('猜題者可以按提示（字數）', Relay.useHint(hn, 'p1', nt).ok && hn.hints === 1);
  Relay.useHint(hn, 'p1', nt);
  check('第二張是種類', Relay.toPublic(hn, 'p1').hint.catShown);
  Relay.guess(hn, 'p1', answer(hn), nt);
  check('用兩張提示後第一棒剩 108', Relay.player(hn, 'p1').score === 108 && Relay.player(hn, hn.order[0]).score === 108);
}

section('放棄、斷線與人數');
{
  const st = make(4);
  let t = toDrawing(st, T0);
  check('畫家不能放棄', !Relay.giveUp(st, st.order[0], t).ok);
  check('猜題者可以放棄', Relay.giveUp(st, 'p1', t).ok && st.phase === 'reveal' && st.log[0].reason === 'giveup');
  check('放棄沒人得分', st.players.every((p) => p.score === 0));

  const gl = make(4);
  let gt = toDrawing(gl, T0);
  Relay.tick(gl, gt + 10, { away: ['p1'] });
  check('猜題者斷線，這題直接公布', gl.phase === 'reveal' && gl.log[0].reason === 'guesserleft');

  const dl = make(4);
  let dt = toDrawing(dl, T0);
  const d0 = dl.drawerId, d1 = dl.order[1];
  Relay.tick(dl, dt + 10, { away: [d0] });
  check('輪到的畫家斷線：結束這一棒', dl.phase === 'handoff');
  Relay.tick(dl, dt + 10 + C.HANDOFF_MS, { away: [d0] });
  check('跳過換下一位', dl.phase === 'drawing' && dl.drawerId === d1);

  /* 接下來輪到的人斷線：換棒時直接跳過他 */
  const sk = make(4);
  let skt = toDrawing(sk, T0);
  const second = sk.order[1], third = sk.order[2];
  skt += 7000; Relay.tick(sk, skt, { away: [second] });
  skt += C.HANDOFF_MS; Relay.tick(sk, skt, { away: [second] });
  check('換棒時跳過斷線的下一棒', sk.drawerId === third && sk.batonNo === 2);

  const low = make(3);
  toDrawing(low, T0);
  const r = Relay.removePlayer(low, low.order[0], T0 + 5000);
  check('人數低於 3 人直接結算', r.finished && low.phase === 'over');

  const leave = make(4);
  let lt = toDrawing(leave, T0);
  const cur = leave.drawerId;
  Relay.removePlayer(leave, cur, lt + 5);
  check('當棒畫家離開：這一棒結束', leave.phase === 'handoff');
  check('離開的人之後的棒次都拿掉', leave.batons.slice(leave.batonNo + 1).indexOf(cur) < 0);

  const gq = make(4);
  toDrawing(gq, T0);
  Relay.removePlayer(gq, 'p1', T0 + 5000);
  check('猜題者離開：這題公布答案', gq.phase === 'reveal');
}

section('中途加入與整局');
{
  const st = make(3, { guessRounds: 1 });
  let t = toDrawing(st, T0);
  const add = Relay.addPlayer(st, { id: 'p9', name: '新來的' });
  check('對局中加入：先觀戰', add.ok && Relay.toPublic(st, 'p9').you.role === 'pending');
  check('新玩家看得到答案（觀戰）', Relay.toPublic(st, 'p9').answer === answer(st));
  check('新玩家這題不在接力順序裡', st.batons.indexOf('p9') < 0 && !Relay.addStroke(st, 'p9', { t: 'pen', p: [1, 1, 2, 2] }).ok);
  check('總題數補上新玩家的猜題輪次', Relay.totalQuestions(st) === 4, Relay.totalQuestions(st));
  Relay.giveUp(st, 'p1', t);
  t += C.REVEAL_MS; Relay.tick(st, t);
  check('下一題加入接力順序', st.order.indexOf('p9') >= 0 && st.guesserId === 'p2');

  /* 整局：每人當一次猜題者就結算，三個獎項 */
  const g = make(3, { guessRounds: 1, seed: 'FULL01' });
  let gt = T0;
  const guessers = [];
  for (let q = 0; q < 3; q++) {
    guessers.push(g.guesserId);
    gt = toDrawing(g, gt);
    if (q === 0) Relay.guess(g, g.guesserId, answer(g), gt);           // 第一棒猜中
    else if (q === 1) { gt += 7000; Relay.tick(g, gt); gt += C.HANDOFF_MS; Relay.tick(g, gt); Relay.guess(g, g.guesserId, answer(g), gt); }
    else Relay.giveUp(g, g.guesserId, gt);
    gt += C.REVEAL_MS; Relay.tick(g, gt);
  }
  check('照座位順序輪流當猜題者', guessers.join(',') === 'p1,p2,p3', guessers);
  check('每人當滿次數就結算', g.phase === 'over' && g.over);
  const a = g.awards;
  check('神猜手是猜題得分最高的人', a.guess.length === 1 && a.guess[0].id === 'p1', a.guess);
  check('接力王與關鍵一筆有得主', a.relay.length >= 1 && a.key.length >= 1);
  const p = Relay.toPublic(g, 'p1');
  check('結算投影有獎項與贏家', !!p.awards && p.winners.length >= 1);

  /* 畫廊列出參與畫家 */
  const gal = make(3, { seed: 'GAL001' });
  let galT = toDrawing(gal, T0);
  Relay.addStroke(gal, gal.drawerId, { t: 'pen', p: [10, 10, 50, 50] });
  galT += 7000; Relay.tick(gal, galT); galT += C.HANDOFF_MS; Relay.tick(gal, galT);
  Relay.addStroke(gal, gal.drawerId, { t: 'pen', p: [20, 10, 60, 50] });
  Relay.giveUp(gal, gal.guesserId, galT);
  check('公布時可以對整張圖按表情（猜題者也可以）', Relay.react(gal, gal.guesserId, 'heart').ok);
  check('整局結束前不提供畫廊', Relay.galleryOf(gal).length === 0);
  Relay.finish(gal, galT);
  const items = Relay.galleryOf(gal);
  check('畫廊放完成圖並列出參與畫家', items.length === 1 && items[0].painters.length === 2 && items[0].strokes.length === 2, items[0] && items[0].painters);
}

section('表情互動與隱藏資訊');
{
  const st = make(4);
  let t = toDrawing(st, T0);
  check('沒在畫的畫家可以丟表情', Relay.cheer(st, st.order[1], 'cheer').ok);
  check('當棒的人不能對自己丟', !Relay.cheer(st, st.drawerId, 'lol').ok);
  check('猜題者不能丟表情', !Relay.cheer(st, 'p1', 'panic').ok);
  check('只收固定三種表情', !Relay.cheer(st, st.order[1], 'boom').ok);

  const gv = Relay.toPublic(st, 'p1');
  const raw = JSON.stringify(gv);
  check('猜題者的投影沒有答案', gv.answer === null && !raw.includes(answer(st)));
  check('猜題者的投影沒有候選題', gv.choices.length === 0 && !raw.includes(st.wordId));
  const sv = Relay.toPublic(st, null);
  check('觀戰者看得到答案', sv.answer === answer(st) && sv.you.role === 'spectator');
  Relay.giveUp(st, 'p1', t);
  check('公布後猜題者也看得到答案', Relay.toPublic(st, 'p1').answer === answer(st));
}

console.log('\n' + (failed ? '✗ ' : '✓ ') + '接力規則：' + passed + ' 通過，' + failed + ' 失敗');
if (failed) process.exit(1);
