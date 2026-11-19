/* ===== app/pickdraw.js — 你出我畫他猜（Beta）的對局畫面 =====
 *
 * 一般模式與接力模式的畫面程式不動：render／overlay／canvas 只在 game.mode === 'pickdraw' 時把工作轉到這裡。
 * 這一層只呈現伺服器的投影（PickdrawRules.toPublic）並送出意圖，權限一律看 you.can 與 game.you。
 *
 * 角色（game.you.role）：picker 出題者／drawer 畫家／guesser 猜題者／spectator 觀戰／player（結算後）
 * 共用接力做好的元件：放棄鈕（#b-relay-giveup）、表情列（#relay-cheers）、飄過畫布的表情、倒數大字與獎項卡樣式。
 */

import { $, D, S, Sound, app, esc, secsLeft } from './core.js?v=73830c6027';
import { reactionBarHtml } from './overlay.js?v=73830c6027';

var w = window;
function t(key, params) { return w.I18N.t(key, params); }
function sep() { return w.I18N.lang === 'en' ? ', ' : '、'; }

export function isPickdrawGame(g) { return !!(g && g.mode === 'pickdraw'); }

/** 某個階段的名稱（上排 chip、左側摘要用） */
export function pickdrawPhaseLabel(phase) { return t('pickdraw.phase.' + phase); }

/** 角色名稱（左側摘要「你的身分」用） */
export function pickdrawRoleLabel(role) { return t('pickdraw.role.' + (role || 'player')); }

function playerIdx(g, id) {
  for (var i = 0; i < g.players.length; i++) if (g.players[i].id === id) return i;
  return 0;
}

/** 把字典句子裡的 {s} 換成會被 updateTimers 每秒更新的 <b class="pick-secs"> */
function withSecs(key, s, params) {
  var p = Object.assign({}, params || {}, { s: '\u0000' });
  var parts = t(key, p).split('\u0000');
  return esc(parts[0]) + '<b class="pick-secs">' + s + '</b>' + esc(parts.slice(1).join(''));
}

function qnoHtml(g) {
  return '<p class="relay-qno pd-qno">' + esc(t('pickdraw.questionNo', { n: g.questionNo, total: g.totalQuestions })) +
    (g.laps > 1 ? '・' + esc(t('pickdraw.lapNo', { n: g.lap, total: g.laps })) : '') + '</p>';
}

/** 「出題 → 畫 → 猜」三個人一排，挑題卡與倒數卡上都有，一眼看出這題誰做什麼 */
function trioHtml(v, g) {
  var list = [
    { role: 'picker', id: g.pickerId, name: g.pickerName },
    { role: 'drawer', id: g.drawerId, name: g.drawerName },
    { role: 'guesser', id: g.guesserId, name: g.guesserName }
  ];
  return '<ol class="pd-trio" aria-label="' + esc(t('pickdraw.name')) + '">' + list.map(function (x) {
    var me = v.you && x.id === v.you.id;
    return '<li class="pd-trio-item" data-role="' + x.role + '"' + (me ? ' data-me="true"' : '') + '>' +
      '<span class="pd-trio-face" aria-hidden="true">' + S.face(playerIdx(g, x.id), x.role === 'drawer' ? 'draw' : (x.role === 'guesser' ? 'think' : 'happy')) + '</span>' +
      '<b class="pd-trio-role">' + esc(t('pickdraw.role.' + x.role)) + '</b>' +
      '<span class="pd-trio-name">' + esc(x.name || '—') + (me ? esc(t('pickdraw.you')) : '') + '</span></li>';
  }).join('') + '</ol>';
}

/* ---------------------------------------------------- 疊層卡片 */

/** 挑題、倒數、公布答案用疊層卡片；作畫中不蓋住畫布（回傳 null） */
export function pickdrawOverlayHtml(v, g) {
  if (g.phase === 'picking') return pickingHtml(v, g);
  if (g.phase === 'countdown') return countdownHtml(v, g);
  if (g.phase === 'reveal') return revealHtml(v, g);
  return null;
}

function pickingHtml(v, g) {
  var s = secsLeft(g.deadline);
  if (g.you.canPick && g.choices && g.choices.length) {
    var cards = g.choices.map(function (c) {
      return '<button class="wordchoice" type="button" data-act="pickdraw-pick" data-word="' + esc(c.id) + '">' +
        '<b>' + esc(c.text) + '</b><span class="s">' + esc(c.catLabel) + '・' + esc(c.diffLabel) + '</span></button>';
    }).join('');
    return qnoHtml(g) + '<h3>' + esc(t('pickdraw.pick.title', { name: g.drawerName })) + '</h3>' +
      '<p>' + withSecs('pickdraw.pick.note', s, { guesser: g.guesserName }) + '</p>' +
      '<div class="wordchoices pd-choices">' + cards + '</div>' + trioHtml(v, g);
  }
  var role = g.you.role;
  var note = role === 'drawer' ? 'pickdraw.pick.waitDrawer' : (role === 'guesser' ? 'pickdraw.pick.waitGuesser' : 'pickdraw.pick.waitWatch');
  return qnoHtml(g) + '<div class="relay-guesser-card pd-wait-card"><span class="relay-hero-face" aria-hidden="true">' +
    S.face(playerIdx(g, g.pickerId), 'think') + '</span>' +
    '<h3>' + esc(t('pickdraw.pick.wait', { name: g.pickerName })) + '</h3><p>' + esc(t(note)) + '</p>' +
    '<p class="pd-secs">' + withSecs('pickdraw.pick.secs', s) + '</p></div>' + trioHtml(v, g);
}

function countdownHtml(v, g) {
  var s = secsLeft(g.deadline);
  var role = g.you.role;
  var who = role === 'picker' ? t('pickdraw.countdown.picker', { name: g.drawerName })
    : role === 'drawer' ? t('pickdraw.countdown.drawer')
      : role === 'guesser' ? t('pickdraw.countdown.guesser')
        : t('pickdraw.countdown.watch', { drawer: g.drawerName, guesser: g.guesserName });
  return '<div class="relay-countdown pd-countdown">' + qnoHtml(g) +
    '<b class="relay-count-n" aria-live="assertive">' + (s > 0 ? s : esc(t('pickdraw.go'))) + '</b>' +
    '<p class="relay-count-who">' + esc(who) + '</p></div>' + trioHtml(v, g);
}

function resultLine(last) {
  if (!last) return '';
  if (last.reason === 'hit') return esc(t('pickdraw.reveal.hit', { name: last.guesserName }));
  if (last.reason === 'giveup') return esc(t('pickdraw.reveal.giveup', { name: last.guesserName }));
  if (last.reason === 'drawerleft') return esc(t('pickdraw.reveal.drawerleft', { name: last.drawerName }));
  if (last.reason === 'guesserleft') return esc(t('pickdraw.reveal.guesserleft', { name: last.guesserName }));
  return esc(t('pickdraw.reveal.timeup'));
}

function scoreRowsHtml(g, last) {
  if (!last || !last.points) return '';
  var rows = [
    { role: 'picker', id: last.pickerId, name: last.pickerName, n: last.points.picker },
    { role: 'drawer', id: last.drawerId, name: last.drawerName, n: last.points.drawer },
    { role: 'guesser', id: last.guesserId, name: last.guesserName, n: last.points.guesser }
  ];
  return '<ul class="resultlist pd-scores">' + rows.map(function (r) {
    return '<li class="pd-score-row" data-role="' + r.role + '"><span class="rface" aria-hidden="true">' +
      S.face(playerIdx(g, r.id), r.n > 0 ? 'happy' : 'sad') + '</span>' +
      '<span class="rname"><small class="pd-score-role">' + esc(t('pickdraw.role.' + r.role)) + '</small>' + esc(r.name) + '</span>' +
      '<span class="rpts">' + esc(t('pickdraw.reveal.pts', { n: r.n })) + '</span></li>';
  }).join('') + '</ul>';
}

function revealHtml(v, g) {
  var last = g.log.length ? g.log[g.log.length - 1] : null;
  var lastQ = g.questionNo >= g.totalQuestions;
  return qnoHtml(g) +
    '<h3>' + esc(t('text.089')) + '</h3><div class="revealword">' + esc(g.answer || (last && last.word) || '—') + '</div>' +
    '<p class="relay-result" data-hit="' + !!(last && last.hit) + '">' + resultLine(last) + '</p>' +
    scoreRowsHtml(g, last) +
    reactionBarHtml(g) +
    '<p>' + esc(t(lastQ ? 'pickdraw.reveal.last' : 'pickdraw.reveal.next')) + '</p>';
}

/** 結算卡上的三個獎項（放在分享範圍內，結算圖片也會帶到） */
export function pickdrawAwardsHtml(g) {
  var a = g && g.awards;
  if (!a) return '';
  var rows = [
    { k: 'pick', ico: '😈' },
    { k: 'draw', ico: '🎨' },
    { k: 'guess', ico: '🔮' }
  ].map(function (r) {
    var list = a[r.k] || [];
    var who = list.length ? list.map(function (x) { return x.name; }).join(sep()) : t('pickdraw.award.none');
    return '<li class="relay-award pd-award" data-k="' + r.k + '"' + (list.length ? '' : ' data-empty="true"') + '>' +
      '<span class="relay-award-ico" aria-hidden="true">' + r.ico + '</span>' +
      '<span class="relay-award-text"><b class="relay-award-title">' + esc(t('pickdraw.award.' + r.k)) + '</b>' +
      '<span class="relay-award-desc">' + esc(t('pickdraw.award.' + r.k + 'Desc')) + '</span></span>' +
      '<span class="relay-award-who"><b>' + esc(who) + '</b>' +
      (list.length ? '<small>' + esc(t('pickdraw.award.pts', { n: list[0].value })) + '</small>' : '') + '</span></li>';
  }).join('');
  return '<div class="relay-awards pd-awards"><h4>' + esc(t('pickdraw.awards.title')) + '</h4><ul>' + rows + '</ul></div>';
}

/* ---------------------------------------------------- 玩家列（三人角色列） */

function moodFor(g, p) {
  if (g.phase === 'over') return g.winners.indexOf(p.id) >= 0 ? 'win' : 'sad';
  if (p.role === 'drawer') return g.phase === 'drawing' ? 'draw' : 'think';
  if (p.role === 'guesser') return 'think';
  if (p.role === 'picker') return 'happy';
  return 'idle';
}

/** 玩家列：照「出題 → 畫 → 猜」排，每張卡標出這題的角色；結算時照分數排 */
export function pickdrawStripHtml(v, g) {
  var order = { picker: 0, drawer: 1, guesser: 2 };
  var list = g.players.slice();
  if (g.phase === 'over') list.sort(function (a, b) { return b.score - a.score; });
  else list.sort(function (a, b) { return (order[a.role] === undefined ? 9 : order[a.role]) - (order[b.role] === undefined ? 9 : order[b.role]); });
  return list.map(function (p) {
    var cls = ['pcard'];
    if (p.role) cls.push('pd-' + p.role);
    if (p.isDrawer) cls.push('drawer');
    if (p.id === v.you.id) cls.push('me');
    var tag = p.role ? t('pickdraw.role.' + p.role) : t('pickdraw.role.player');
    return '<div class="' + cls.join(' ') + '">' +
      '<span class="pface" aria-hidden="true">' + S.face(playerIdx(g, p.id), moodFor(g, p)) + '</span>' +
      '<span class="pinfo"><b class="pname">' + esc(p.name) + '</b>' +
      '<span class="pstate">' + esc(tag) + '</span></span>' +
      '<span class="pscore">' + p.score + '</span></div>';
  }).join('');
}

/* ---------------------------------------------------- 題目列 */

export function renderPickdrawWordbar(v, g) {
  var wb = $('wordbar');
  wb.hidden = false;
  var role = g.you.role;
  var h = g.hint;
  var label, mask;
  if (g.phase === 'picking' || !g.answer && !h) {
    label = t('text.156');
    mask = '—';
  } else if (role === 'guesser' && !g.answer) {
    label = t('pickdraw.word.guess');
    mask = h && h.lenShown ? h.mask : '？';
  } else {
    label = t(role === 'drawer' ? 'pickdraw.word.draw' : (role === 'picker' ? 'pickdraw.word.picked' : 'pickdraw.word.answer'));
    mask = g.answer || '—';
  }
  wb.setAttribute('data-mine', String(role === 'drawer' && !!g.answer));
  $('wordbar-label').textContent = label;
  $('wordbar-mask').textContent = mask;
  var meta = [];
  if (g.phase === 'picking') meta.push(t('pickdraw.word.wait'));
  if (h && role === 'guesser' && !g.answer) {
    if (h.catShown) meta.push(h.catLabel);
    if (h.lenShown) meta.push(h.len + t('text.158'));
    if (h.revealed) meta.push(t('text.157'));
  }
  meta.push(t('pickdraw.questionNo', { n: g.questionNo, total: g.totalQuestions }));
  $('wordbar-meta').textContent = meta.join('・');
}

/* ---------------------------------------------------- 音效與計時 */

/**
 * 階段切換時的音效與震動（online-events 每次收到投影時呼叫）。
 * 用「題號:階段」當鑰匙，同一個切換只響一次；剛進房（或重新整理）不補放。
 */
export function pickdrawTransition(prev, v) {
  var g = v.game;
  if (!isPickdrawGame(g)) return;
  var key = g.questionNo + ':' + g.phase;
  if (app.pickdrawKey === key) return;
  var before = app.pickdrawKey;
  app.pickdrawKey = key;
  if (!before) return;
  if (g.phase === 'picking') {
    Sound.play(g.you.role === 'picker' ? 'turn' : 'click');
    if (g.you.role === 'picker') Sound.vibrate([40, 70, 40]);
  } else if (g.phase === 'countdown') {
    Sound.play('start');
    if (g.you.role === 'drawer') Sound.vibrate([40, 70, 40, 70, 120]);
  } else if (g.phase === 'drawing') {
    if (g.you.role === 'drawer') Sound.play('turn');
  }
}

/** 倒數數字：由 updateTimers 每 120ms 呼叫（挑題秒數由 .pick-secs 共用邏輯更新） */
export function pickdrawTick(v, g) {
  var n = D.querySelector('#overlay-card .relay-count-n');
  if (n && g.phase === 'countdown') {
    var s = secsLeft(g.deadline);
    var text = s > 0 ? String(s) : t('pickdraw.go');
    if (n.textContent !== text) n.textContent = text;
  }
}

/* ---------------------------------------------------- 操作列 */

/** 畫家工具列：倒數時先出現（開畫那一刻畫面才不會跳動），作畫中才真的能畫 */
export function pickdrawToolsShown(g) {
  return g.you.role === 'drawer' && (g.phase === 'countdown' || g.phase === 'drawing');
}

/**
 * 畫家的提示鈕、猜題者的放棄鈕、出題者的表情列。
 * 提示列（#hintrow）也是放棄鈕的容器：猜題者看到的是「只有放棄鈕」的同一列。
 */
export function renderPickdrawAssist(v, g) {
  var can = v.you.can || {};
  var active = g.phase === 'countdown' || g.phase === 'drawing';
  var drawer = g.you.role === 'drawer' && active;
  var guesser = g.you.role === 'guesser' && active;
  var picker = g.you.role === 'picker' && active;
  var row = $('hintrow');
  row.hidden = !(drawer || guesser);
  row.classList.toggle('relay-hints', guesser);
  row.classList.toggle('pd-guesser-row', guesser);
  var steps = (g.hint && g.hint.steps) || [];
  for (var i = 0; i < 3; i++) {
    var b = $('b-hint-' + (i + 1));
    var st = steps[i] || { done: false, available: false, exists: i < 2 };
    b.hidden = !drawer || !st.exists;
    b.disabled = !drawer || !st.available || !can.hint;
    b.classList.toggle('done', !!st.done);
    b.setAttribute('aria-pressed', String(!!st.done));
  }
  var note = '';
  if (drawer) {
    note = g.hint && g.hint.step >= g.hint.total
      ? t(g.hint.total < 3 ? 'text.075' : 'text.074')
      : t('pickdraw.hint.note');
  } else if (guesser) note = t('pickdraw.tip.guesser');
  $('hintrow-note').textContent = note;

  var give = $('b-relay-giveup');
  give.hidden = !guesser;
  give.disabled = !can.giveUp;

  var cheers = $('relay-cheers');
  cheers.hidden = !picker;
  cheers.setAttribute('aria-label', t('pickdraw.cheer.title'));
  var btns = cheers.querySelectorAll('.cheer-btn');
  for (var j = 0; j < btns.length; j++) btns[j].disabled = !can.cheer;
}

/** 離開你出我畫他猜（回到其他模式畫面）時收起這個模式專用的樣式 */
export function hidePickdrawUi() {
  var row = $('hintrow');
  if (row) row.classList.remove('pd-guesser-row');
  var cheers = $('relay-cheers');
  if (cheers && cheers.getAttribute('aria-label') !== t('relay.cheer.title')) cheers.setAttribute('aria-label', t('relay.cheer.title'));
  app.pickdrawKey = '';
}

/** 畫布被點但不能畫：依角色說明原因 */
export function pickdrawBlockedTip(v) {
  var g = v.game;
  if (!v.you || v.you.role === 'spectator') return null;
  if (g.you.role === 'picker') return t('pickdraw.tip.picker');
  if (g.you.role === 'guesser') return t('pickdraw.tip.guesser');
  if (g.you.role === 'drawer') return t('pickdraw.tip.wait');
  return null;
}

/** 放棄確認的文字（放棄鈕是跟接力共用的，文字依模式換） */
export function pickdrawGiveUpText() {
  return { title: t('pickdraw.giveUp.title'), text: t('pickdraw.giveUp.confirm') };
}

/** 戰績用：這一局我猜中幾題、畫了幾題 */
export function pickdrawRecord(v) {
  var g = v.game, me = v.you.id;
  var correct = 0, drawn = 0;
  (g.log || []).forEach(function (e) {
    if (e.hit && e.guesserId === me) correct += 1;
    if (e.drawerId === me) drawn += 1;
  });
  return { correct: correct, drawn: drawn };
}

/** 左側摘要的「你可以做什麼」 */
export function pickdrawCanDo(v, g) {
  if (v.you.role === 'spectator') return t('pickdraw.can.spectator');
  var role = g.you.role;
  if (g.phase === 'picking') return t(role === 'picker' ? 'pickdraw.can.picker' : 'pickdraw.can.pickWait');
  if (g.phase === 'countdown') return t('pickdraw.can.countdown');
  if (g.phase === 'reveal') return t('pickdraw.can.reveal');
  if (role === 'drawer') return t('pickdraw.can.drawer');
  if (role === 'guesser') return t('pickdraw.can.guesser');
  if (role === 'picker') return t('pickdraw.can.pickerWatch');
  return t('pickdraw.can.spectator');
}
