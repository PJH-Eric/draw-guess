/*
 * tests/relay.js — 接力模式規則核心的單元測試
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
  check('參考範本只給當棒畫家', Relay.toPublic(st, st.drawerId).referenceId === st.wordId);
  const waitingPainter = st.order.find((id) => id !== st.drawerId);
  check('等待中的畫家、猜題者、觀戰者拿不到範本', Relay.toPublic(st, waitingPainter).referenceId === null &&
    gv.referenceId === null && sv.referenceId === null);
  Relay.giveUp(st, 'p1', t);
  check('公布答案後沒有範本', Relay.toPublic(st, st.batons[st.batonNo]).referenceId === null);
  check('公布後猜題者也看得到答案', Relay.toPublic(st, 'p1').answer === answer(st));
}

section('房間層（lib/rooms.js）');
{
  const { RoomStore, RELAY_AWAY_MS } = require('../lib/rooms.js');
  const store = new RoomStore({ idleMs: 0 });
  let t = T0;
  const made = store.create('h', { name: '房主', roomName: '接力房', settings: { guessRounds: 2, batonSec: 7 }, now: t, mode: 'relay' });
  check('可以開接力房', made.ok && made.room.mode === 'relay');
  const room = made.room;
  check('接力設定套用（猜題 2 次、每棒 7 秒）', room.settings.guessRounds === 2 && room.settings.batonSec === 7);
  check('每棒秒數只收 7／12／17', !room.setSettings('h', { batonSec: 10 }).ok);
  check('猜題次數只收 1–5', !room.setSettings('h', { guessRounds: 6 }).ok && room.setSettings('h', { guessRounds: 1 }).ok);
  const classic = store.create('c', { name: '一般', roomName: '一般房', now: t });
  check('一般大廳看不到接力房', store.list().every((r) => r.mode === 'classic') && store.list().some((r) => r.code === classic.room.code));
  check('接力大廳只列接力房', store.list('relay').length === 1 && store.list('relay')[0].code === room.code);

  room.join('a', { name: '阿明', now: t });
  room.setReady('a', true);
  check('兩人不能開始（至少 3 人）', !room.start('h', t).ok);
  room.join('b', { name: '小華', now: t });
  room.setReady('b', true);
  const st = room.start('h', t);
  check('三人可以開始', st.ok && room.state.mode === 'relay');

  const gid = room.state.guesserId;
  const painters = room.state.order.slice();
  const gv = room.viewFor(gid, t);
  check('猜題者的房間投影沒有候選題與答案', gv.game.choices.length === 0 && gv.game.answer === null && gv.you.can.vote === false);
  const pv = room.viewFor(painters[0], t);
  check('畫家可以投票', pv.you.can.vote && pv.game.choices.length === 4);
  check('猜題者不能聊天', !room.chat(gid, '我猜是…', t + 600).ok);
  check('畫家對局中可以聊天', room.chat(painters[0], '畫大一點', t + 600).ok);
  check('猜題者看不到畫家聊天', room.viewFor(gid, t).room.chat.length === 0 && room.viewFor(painters[1], t).room.chat.length === 1);
  check('一般模式的選題與跳過在接力房被擋', !room.pickWord(painters[0], room.state.choices[0], t).ok && !room.skipTurn(painters[0], t).ok);

  for (const id of painters) room.vote(id, room.state.choices[2], t + 1000);
  check('投完提前進倒數', room.state.phase === 'countdown');
  const summaryText = JSON.stringify(room.summary) + JSON.stringify(room.feed);
  const ans = Words.byId(room.state.wordId, room.state.lang).text;
  check('摘要與紀錄在公布前沒有答案', !summaryText.includes(ans));
  t += 1000 + C.COUNTDOWN_MS;
  room.tick(t);
  check('倒數完第一棒開始', room.state.phase === 'drawing');
  const drawer = room.state.drawerId;
  check('只有當棒的人能畫', room.stroke(drawer, { t: 'pen', p: [1, 1, 9, 9] }, t).ok && !room.stroke(gid, { t: 'pen', p: [1, 1, 9, 9] }, t).ok);
  check('猜題者打字會亮輸入中', room.typing(gid, true, t) && room.viewFor(painters[0], t).room.guesserTypingUntil > t && room.viewFor(gid, t).room.guesserTypingUntil === 0);
  const waiting = painters.find((id) => id !== drawer);
  check('等待的畫家可以丟表情', room.cheer(waiting, 'cheer', t).ok);
  check('猜題者不能丟表情', !room.cheer(gid, 'cheer', t).ok);
  check('猜題者可以用提示', room.giveHint(gid, t).ok && room.state.hints === 1);
  const miss = room.guess(gid, '一定不是這個ZZ', t + 500);
  check('猜錯會進猜題紀錄（大家都看得到）', miss.ok && miss.kind === 'miss' && room.feed[room.feed.length - 1].text === '一定不是這個ZZ');
  const hit = room.guess(gid, ans, t + 1000);
  check('猜中：用了一張提示的第一棒 180 分', hit.ok && hit.kind === 'hit' && hit.points === 180, hit);
  check('公布後摘要才有答案', JSON.stringify(room.summary).includes(ans));
  check('公布時猜題者也看得到答案', room.viewFor(gid, t + 1000).game.answer === ans);

  /* 下一題：猜題者斷線就公布 */
  t += 1000 + C.REVEAL_MS;
  room.tick(t);
  const g2 = room.state.guesserId;
  check('換下一位猜題者', room.state.phase === 'voting' && g2 !== gid);
  room.disconnect(g2, t);
  room.tick(t + RELAY_AWAY_MS - 1);
  check('斷線緩衝內不公布', room.state.phase === 'voting');
  room.tick(t + RELAY_AWAY_MS);
  check('猜題者斷線超過緩衝：這題公布答案', room.state.phase === 'reveal' && room.state.log[room.state.log.length - 1].reason === 'guesserleft');
  room.join(g2, { name: '', now: t + RELAY_AWAY_MS + 10 });

  /* 中途加入：先觀戰，下一題才上場 */
  room.join('d', { name: '新人', now: t + 5000 });
  check('對局中加入當玩家：這題先觀戰', room.viewFor('d', t + 5000).game.you.role === 'pending');

  /* 離開到剩兩人：結算 */
  room.leave('d', t + 6000);
  room.leave('b', t + 6000);
  room.leave('a', t + 6000);
  check('人數低於 3 人就結算', room.phase === 'finished');
  check('結算後可以拿畫廊', room.gallery().ok && room.gallery().mode === 'relay');
  check('簡報帶接力設定', room.brief().mode === 'relay' && room.brief().batonSec === 7);
}

console.log('\n' + (failed ? '✗ ' : '✓ ') + '接力規則：' + passed + ' 通過，' + failed + ' 失敗');
if (failed) process.exit(1);
