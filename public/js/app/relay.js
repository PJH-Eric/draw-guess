/* ===== app/relay.js — 接力模式（Beta）的對局畫面 =====
 *
 * 一般模式的畫面程式不動：render／overlay／guess 只在 game.mode === 'relay' 時把工作轉到這裡。
 * 這一層一樣只呈現伺服器的投影（RelayRules.toPublic）並送出意圖，權限一律看 you.can 與 game.you。
 *
 * 角色（game.you.role）：guesser 猜題者／drawer 正在畫／painter 等下一棒的畫家／pending 下一題才加入／spectator 觀戰
 */

import { $, D, S, Sound, app, esc, netNow, secsLeft, toast } from './core.js?v=95f17e75a6';
import { askConfirm } from './modal.js?v=95f17e75a6';
import { reactionBarHtml } from './overlay.js?v=95f17e75a6';

var w = window;
function t(key, params) { return w.I18N.t(key, params); }

export function isRelayGame(g) { return !!(g && g.mode === 'relay'); }

/** 某個階段的名稱（上排 chip、左側摘要用） */
export function relayPhaseLabel(phase) { return t('relay.phase.' + phase); }

function playerIdx(g, id) {
  for (var i = 0; i < g.players.length; i++) if (g.players[i].id === id) return i;
  return 0;
}
function nameOf(g, id) {
  for (var i = 0; i < g.players.length; i++) if (g.players[i].id === id) return g.players[i].name;
  for (var j = 0; j < g.order.length; j++) if (g.order[j].id === id) return g.order[j].name;
  return '—';
}

/** 把字典句子裡的 {s} 換成會被 updateTimers 每秒更新的 <b class="pick-secs"> */
function withSecs(key, s) {
  var parts = t(key, { s: '\u0000' }).split('\u0000');
  return esc(parts[0]) + '<b class="pick-secs">' + s + '</b>' + esc(parts.slice(1).join(''));
}

/* ---------------------------------------------------- 疊層卡片 */

/** 投票、倒數、公布答案用疊層卡片；作畫中與換棒緩衝不蓋住畫布（回傳 null） */
export function relayOverlayHtml(v, g) {
  if (g.phase === 'voting') return votingHtml(v, g);
  if (g.phase === 'countdown') return countdownHtml(v, g);
  if (g.phase === 'reveal') return revealHtml(v, g);
  return null;
}

function progressHtml(g) {
  return '<p class="relay-progress" role="status">' + esc(t('relay.vote.progress', { n: g.voted, total: g.voters })) + '</p>';
}

function votingHtml(v, g) {
  var qno = '<p class="relay-qno">' + esc(t('relay.questionNo', { n: g.questionNo })) + '</p>';
  if (g.you.isGuesser) {
    return qno + '<div class="relay-guesser-card"><span class="relay-hero-face" aria-hidden="true">' +
      S.face(playerIdx(g, g.guesserId), 'think') + '</span>' +
      '<h3>' + esc(t('relay.vote.guesser')) + '</h3><p>' + esc(t('relay.vote.guesserNote')) + '</p></div>' + progressHtml(g);
  }
  var canVote = !!(v.you.can && v.you.can.vote);
  var cards = (g.choices || []).map(function (c) {
    var mine = g.myVote === c.id;
    return '<button class="wordchoice relay-choice' + (mine ? ' mine' : '') + '" type="button" data-act="relay-vote" data-word="' + esc(c.id) + '"' +
      ' aria-pressed="' + mine + '"' + (canVote ? '' : ' disabled') + '>' +
      '<b>' + esc(c.text) + '</b><span class="s">' + esc(c.catLabel) + '・' + esc(c.diffLabel) + '</span>' +
      '<span class="relay-votes" data-n="' + c.votes + '">' + esc(t('relay.vote.votes', { n: c.votes })) + '</span>' +
      (mine ? '<span class="relay-mine">' + esc(t('relay.vote.mine')) + '</span>' : '') + '</button>';
  }).join('');
  var note = canVote ? '<p>' + withSecs('relay.vote.note', secsLeft(g.deadline)) + '</p>'
    : '<p>' + esc(t(g.you.role === 'pending' ? 'relay.vote.pendingNote' : 'relay.vote.watchNote')) + '</p>';
  return qno + '<h3>' + esc(canVote ? t('relay.vote.title') : t('relay.vote.watch', { name: g.guesserName })) + '</h3>' + note +
    '<div class="wordchoices relay-choices">' + cards + '</div>' + progressHtml(g);
}

function countdownHtml(v, g) {
  var s = secsLeft(g.deadline);
  var first = g.nextDrawerId;
  var firstLine = first
    ? '<p class="relay-first' + (first === v.you.id ? ' me' : '') + '">' +
      esc(first === v.you.id ? t('relay.yourTurn') : t('relay.handoff.next', { name: nameOf(g, first) })) + '</p>'
    : '';
  return '<div class="relay-countdown"><p class="relay-qno">' + esc(t('relay.questionNo', { n: g.questionNo })) + '</p>' +
    '<b class="relay-count-n" aria-live="assertive">' + (s > 0 ? s : esc(t('relay.go'))) + '</b>' +
    '<p class="relay-count-who">' + esc(g.you.isGuesser ? t('relay.countdown.you') : t('relay.countdown.guesser', { name: g.guesserName })) + '</p>' +
    firstLine + '</div>';
}

function resultLine(last) {
  if (!last) return '';
  if (last.reason === 'hit') {
    return esc(t('relay.reveal.hit', { name: last.guesserName, drawer: last.drawerName || '—' })) +
      ' <b class="relay-points">' + esc(t('relay.reveal.points', { points: last.points })) + '</b>';
  }
  var key = { giveup: 'relay.reveal.giveup', guesserleft: 'relay.reveal.left', nopainters: 'relay.reveal.none' }[last.reason] || 'relay.reveal.timeup';
  return esc(t(key, { name: last.guesserName }));
}

function revealHtml(v, g) {
  var last = g.log.length ? g.log[g.log.length - 1] : null;
  var painters = last && last.painters && last.painters.length
    ? '<p class="relay-painters">' + esc(t('relay.reveal.painters', { names: last.painters.map(function (p) { return p.name; }).join(w.I18N.lang === 'en' ? ', ' : '、') })) + '</p>'
    : '';
  var lastQ = g.questionNo >= g.totalQuestions;
  return '<p class="relay-qno">' + esc(t('relay.questionNo', { n: g.questionNo })) + '</p>' +
    '<h3>' + esc(t('text.089')) + '</h3><div class="revealword">' + esc(g.answer || (last && last.word) || '—') + '</div>' +
    '<p class="relay-result" data-hit="' + !!(last && last.hit) + '">' + resultLine(last) + '</p>' + painters +
    reactionBarHtml(g) +
    '<p>' + esc(t(lastQ ? 'relay.reveal.last' : 'relay.reveal.next')) + '</p>';
}

/** 結算卡上的三個獎項（放在分享範圍內，結算圖片也會帶到） */
export function relayAwardsHtml(g) {
  var a = g && g.awards;
  if (!a) return '';
  var rows = [
    { k: 'guess', ico: '🔮', unit: 'relay.award.pts' },
    { k: 'relay', ico: '🏃', unit: 'relay.award.pts' },
    { k: 'key', ico: '✨', unit: 'relay.award.keys' }
  ].map(function (r) {
    var list = a[r.k] || [];
    var who = list.length ? list.map(function (x) { return x.name; }).join(w.I18N.lang === 'en' ? ', ' : '、') : t('relay.award.none');
    return '<li class="relay-award" data-k="' + r.k + '"' + (list.length ? '' : ' data-empty="true"') + '>' +
      '<span class="relay-award-ico" aria-hidden="true">' + r.ico + '</span>' +
      '<span class="relay-award-text"><b class="relay-award-title">' + esc(t('relay.award.' + r.k)) + '</b>' +
      '<span class="relay-award-desc">' + esc(t('relay.award.' + r.k + 'Desc')) + '</span></span>' +
      '<span class="relay-award-who"><b>' + esc(who) + '</b>' +
      (list.length ? '<small>' + esc(t(r.unit, { n: list[0].value })) + '</small>' : '') + '</span></li>';
  }).join('');
  return '<div class="relay-awards"><h4>' + esc(t('relay.awards.title')) + '</h4><ul>' + rows + '</ul></div>';
}

/* ---------------------------------------------------- 玩家列（同時是接力順序） */

function moodFor(g, id) {
  if (g.phase === 'over') return g.winners.indexOf(id) >= 0 ? 'win' : 'sad';
  if (id === g.drawerId && g.phase === 'drawing') return 'draw';
  if (id === g.guesserId) return 'think';
  return 'idle';
}

/** 玩家列：猜題者排第一，接著是這一題的接力順序（標出「正在畫」「下一棒」），最後是下一題才加入的人 */
export function relayStripHtml(v, g) {
  var active = ['drawing', 'handoff', 'countdown', 'voting'].indexOf(g.phase) >= 0;
  var byId = {};
  g.players.forEach(function (p) { byId[p.id] = p; });
  var seen = {};
  var cards = [];
  function card(p, tag, cls) {
    if (!p || seen[p.id]) return;
    seen[p.id] = 1;
    var list = ['pcard'].concat(cls || []);
    if (p.id === v.you.id) list.push('me');
    cards.push('<div class="' + list.join(' ') + '">' +
      '<span class="pface" aria-hidden="true">' + S.face(playerIdx(g, p.id), moodFor(g, p.id)) + '</span>' +
      '<span class="pinfo"><b class="pname">' + esc(p.name) + '</b>' +
      '<span class="pstate">' + esc(tag) + '</span></span>' +
      '<span class="pscore">' + p.score + '</span></div>');
  }
  if (g.guesserId && g.phase !== 'over') card(byId[g.guesserId], t('relay.role.guesser'), ['relay-guesser']);
  g.order.forEach(function (o, i) {
    var p = byId[o.id];
    if (!p) return;
    var now = active && g.phase === 'drawing' && o.id === g.drawerId;
    var next = active && !now && o.id === g.nextDrawerId;
    var tag = now ? t('relay.order.now') : (next ? t('relay.order.next') : (o.away ? t('relay.order.away') : (i + 1) + ''));
    card(p, tag, [now ? 'drawer relay-now' : '', next ? 'relay-next' : '', o.away ? 'off' : ''].filter(Boolean));
  });
  g.players.forEach(function (p) { card(p, p.pending ? t('relay.role.pending') : t('relay.role.painter'), p.pending ? ['relay-pending'] : []); });
  return cards.join('');
}

/* ---------------------------------------------------- 題目列 */

export function renderRelayWordbar(v, g) {
  var wb = $('wordbar');
  wb.hidden = false;
  var guesser = g.you.isGuesser;
  var h = g.hint;
  wb.setAttribute('data-mine', String(!guesser && !!g.answer));
  var label, mask;
  if (g.phase === 'voting' || !g.answer && !h) {
    label = t('text.156');
    mask = '—';
  } else if (guesser && !g.answer) {
    label = t('relay.word.guess');
    mask = h && h.lenShown ? h.mask : '？';
  } else {
    label = guesser ? t('text.156') : t('relay.word.draw');
    mask = g.answer || '—';
  }
  $('wordbar-label').textContent = label;
  $('wordbar-mask').textContent = mask;
  var meta = [];
  if (g.phase === 'voting') meta.push(t('relay.word.wait'));
  if (h && guesser && !g.answer) {
    if (h.catShown) meta.push(h.catLabel);
    if (h.lenShown) meta.push(h.len + t('text.158'));
    if (h.revealed) meta.push(t('text.157'));
  }
  if ((g.phase === 'drawing' || g.phase === 'handoff') && g.lap) meta.push(t('relay.order.lap', { n: g.lap, total: g.laps }));
  meta.push(t('relay.questionNo', { n: g.questionNo }));
  $('wordbar-meta').textContent = meta.join('・');
}

/* ---------------------------------------------------- 換棒大字 */

var flash = { key: '', until: 0 };

export function renderRelayBanner(v, g) {
  var el = $('relay-banner');
  if (!el) return;
  var html = '', tone = '';
  if (g && v.room && !v.room.closed && g.phase === 'handoff') {
    var lock = '<small>' + esc(t('relay.handoff.lock')) + '</small>';
    if (!g.nextDrawerId) { html = '<b>' + esc(t('relay.handoff.last')) + '</b>'; tone = 'last'; }
    else if (g.you.isNext) { html = '<b>' + esc(t('relay.yourTurn')) + '</b>' + lock; tone = 'me'; }
    else { html = '<b>' + esc(t('relay.handoff.next', { name: nameOf(g, g.nextDrawerId) })) + '</b>' + lock; tone = 'next'; }
  } else if (g && g.phase === 'drawing' && netNow() < flash.until) {
    html = '<b>' + esc(t('relay.go')) + '</b>';
    tone = 'go';
  }
  if (el.getAttribute('data-sig') !== html) {
    el.setAttribute('data-sig', html);
    el.innerHTML = html;
    el.setAttribute('data-tone', tone);
  }
  el.hidden = !html;
}

/**
 * 階段切換時的音效、震動與「開始！」閃字（online-events 每次收到投影時呼叫）。
 * 用「題號:階段:棒次」當鑰匙，同一個切換只響一次。
 */
export function relayTransition(prev, v) {
  var g = v.game;
  if (!isRelayGame(g)) return;
  var key = g.questionNo + ':' + g.phase + ':' + g.batonNo;
  if (app.relayKey === key) return;
  var before = app.relayKey;
  app.relayKey = key;
  if (!before) return;                         // 剛進房（或重新整理）：不補放過去的音效
  if (g.phase === 'handoff' && g.you.isNext) {
    Sound.play('turn');
    Sound.vibrate([40, 70, 40, 70, 120]);
  } else if (g.phase === 'countdown') {
    Sound.play('start');
    if (g.you.isNext) Sound.vibrate([40, 70, 40]);
  } else if (g.phase === 'drawing') {
    if (g.batonNo === 0) flash = { key: key, until: netNow() + 1100 };
    if (g.you.isDrawer) Sound.play('turn');
  } else if (g.phase === 'voting') {
    Sound.play(g.you.isGuesser ? 'hint' : 'click');
  }
}

/* ---------------------------------------------------- 每一格的計時更新 */

/** 倒數數字、輸入中、閃字到期：由 updateTimers 每 120ms 呼叫 */
export function relayTick(v, g) {
  var n = D.querySelector('#overlay-card .relay-count-n');
  if (n && g.phase === 'countdown') {
    var s = secsLeft(g.deadline);
    var text = s > 0 ? String(s) : t('relay.go');
    if (n.textContent !== text) n.textContent = text;
  }
  var typing = $('relay-typing-chip');
  var until = v.room && v.room.guesserTypingUntil;
  var on = !!until && until > netNow() && (g.phase === 'drawing' || g.phase === 'handoff');
  if (typing) {
    typing.hidden = !on;
    var tt = on ? t('relay.typing', { name: g.guesserName }) : '';
    if (typing.textContent !== tt) typing.textContent = tt;
  }
  renderRelayBanner(v, g);
}

/* ---------------------------------------------------- 操作列 */

/** 畫家工具列要不要出現：正在畫，或換棒緩衝中的下一棒（先出現、畫面才不會在開畫那一刻跳動） */
export function relayToolsShown(g) {
  return (g.phase === 'drawing' && g.you.isDrawer) || (g.phase === 'handoff' && g.you.isNext);
}

/** 猜題列的兩種用法：猜題者拿來猜、其他人（畫家與觀戰者）拿來跟畫家聊天 */
export function relayBarMode(v, g) {
  if (!v.room || v.room.closed || g.phase === 'over') return null;
  if (g.you.isGuesser) return 'guess';
  if (relayToolsShown(g)) return null;
  return v.you.can && v.you.can.chat ? 'chat' : null;
}

/** 猜題者的提示列與放棄鈕、畫家的表情列 */
export function renderRelayAssist(v, g) {
  var guesser = g.you.isGuesser && (g.phase === 'drawing' || g.phase === 'handoff' || g.phase === 'countdown');
  var row = $('hintrow');
  row.hidden = !guesser;
  row.classList.toggle('relay-hints', guesser);
  if (guesser && g.hint) {
    var steps = g.hint.steps || [];
    for (var i = 0; i < 3; i++) {
      var b = $('b-hint-' + (i + 1));
      var st = steps[i] || { done: false, available: false, exists: false };
      b.disabled = !st.available || !(v.you.can && v.you.can.hint);
      b.classList.toggle('done', !!st.done);
      b.hidden = !st.exists;
      b.setAttribute('aria-pressed', String(!!st.done));
    }
    $('hintrow-note').textContent = t('relay.hint.note');
  } else if (guesser) {
    for (var k = 1; k <= 3; k++) { $('b-hint-' + k).disabled = true; $('b-hint-' + k).hidden = false; }
    $('hintrow-note').textContent = t('relay.hint.note');
  }
  var give = $('b-relay-giveup');
  give.hidden = !guesser;
  give.disabled = !(v.you.can && v.you.can.giveUp);

  var cheers = $('relay-cheers');
  var canCheer = !!(v.you.can && v.you.can.cheer);
  var showRow = canCheer || (!g.you.isGuesser && (g.phase === 'drawing' || g.phase === 'handoff') && v.you.role === 'player');
  cheers.hidden = !showRow;
  var btns = cheers.querySelectorAll('.cheer-btn');
  for (var j = 0; j < btns.length; j++) btns[j].disabled = !canCheer;
  /* 「輸入中…」掛在表情列尾端（畫家與觀戰者才看得到；猜題者的投影裡根本沒有這個欄位） */
  var chip = $('relay-typing-chip');
  if (!chip) {
    chip = D.createElement('span');
    chip.id = 'relay-typing-chip';
    chip.className = 'relay-typing';
    chip.setAttribute('role', 'status');
    chip.hidden = true;
    $('canvastop').appendChild(chip);
  }
}

/** 離開接力（回到一般模式畫面）時把接力專用的元件都收起來 */
export function hideRelayUi() {
  ['b-relay-giveup', 'relay-cheers', 'relay-banner', 'relay-typing-chip'].forEach(function (id) {
    var el = $(id);
    if (el) el.hidden = true;
  });
  var row = $('hintrow');
  if (row) row.classList.remove('relay-hints');
  /* 猜題框在接力房被改成聊天框過：換回一般模式的「猜！」 */
  var bar = $('guessbar');
  if (bar && bar.getAttribute('data-mode')) {
    bar.removeAttribute('data-mode');
    bar.removeAttribute('data-sig');
    S.setLabel($('b-guess'), esc(t('text.393')));
    S.setColor($('b-guess'), 'mint');
    $('guess-input').maxLength = 24;
  }
  app.relayKey = '';
}

/* ---------------------------------------------------- 表情與放棄 */

var CHEER_EMOJI = { cheer: '📣', lol: '🤣', panic: '😱' };

/** 收到別的畫家丟的表情：在畫布上飄一下（猜題者收不到這個事件） */
export function showCheer(p) {
  var layer = $('relay-cheer-layer');
  if (!layer || !p || !CHEER_EMOJI[p.kind]) return;
  var v = app.view;
  var toMe = !!(v && v.you && p.to === v.you.id);
  var el = D.createElement('span');
  el.className = 'relay-cheer' + (toMe ? ' to-me' : '');
  el.style.left = (12 + Math.round(Math.random() * 64)) + '%';
  el.innerHTML = '<span class="relay-cheer-emoji">' + CHEER_EMOJI[p.kind] + '</span>' +
    '<span class="relay-cheer-text">' + esc(t('relay.cheer.from', { name: p.fromName, kind: t('relay.cheer.' + p.kind) })) + '</span>';
  layer.appendChild(el);
  while (layer.children.length > 6) layer.removeChild(layer.firstChild);
  w.setTimeout(function () { el.remove(); }, 2200);
  if (toMe) Sound.play('chat');
}

export function setupRelayControls() {
  var cheers = $('relay-cheers');
  cheers.addEventListener('click', function (ev) {
    var b = ev.target.closest ? ev.target.closest('.cheer-btn') : null;
    if (!b || b.disabled) return;
    w.Online.send('room:cheer', { kind: b.getAttribute('data-cheer') });
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
  });
  $('b-relay-giveup').addEventListener('click', function () {
    Sound.play('click');
    askConfirm({
      get title() { return t('relay.giveUp.title'); },
      get text() { return t('relay.giveUp.confirm'); },
      get ok() { return t('relay.giveUp'); },
      get cancel() { return t('text.272'); }
    }, function () { w.Online.send('room:giveUp', {}); });
  });
  /* 猜題者打字：亮「輸入中…」給畫家看。有字就每 2.5 秒最多送一次，清空就馬上熄掉 */
  var lastOn = 0, sentOn = false;
  $('guess-input').addEventListener('input', function () {
    var v = app.view, g = v && v.game;
    if (app.mode !== 'online' || !isRelayGame(g) || !g.you.isGuesser) return;
    var has = !!this.value.trim();
    var now = Date.now();
    if (has && (!sentOn || now - lastOn > 2500)) { w.Online.send('room:typing', { on: true }); lastOn = now; sentOn = true; }
    else if (!has && sentOn) { w.Online.send('room:typing', { on: false }); sentOn = false; }
  });
  $('guessbar').addEventListener('submit', function () { sentOn = false; }, true);
}

/** 投票：卡片按下去就送出（可以改票） */
export function relayVote(wordId) {
  if (!wordId) return;
  w.Online.send('room:vote', { wordId: wordId });
}

/** 戰績用：這一局我在接力裡猜中幾題、畫了幾題 */
export function relayRecord(v) {
  var g = v.game, me = v.you.id;
  var correct = 0, drawn = 0;
  (g.log || []).forEach(function (e) {
    if (e.hit && e.guesserId === me) correct += 1;
    if ((e.painters || []).some(function (p) { return p.id === me; })) drawn += 1;
  });
  return { correct: correct, drawn: drawn };
}

export function relayToast(key, params) { toast(t(key, params), 'info'); }

/** 左側摘要的「你可以做什麼」 */
export function relayCanDo(v, g) {
  if (v.you.role === 'spectator') return t('relay.can.spectator');
  var role = g.you.role;
  if (role === 'pending') return t('relay.can.pending');
  if (g.phase === 'voting') return t(role === 'guesser' ? 'relay.can.voteGuesser' : 'relay.can.votePainter');
  if (g.phase === 'countdown') return t('relay.can.countdown');
  if (g.phase === 'reveal') return t('relay.can.reveal');
  if (role === 'guesser') return t('relay.can.guesser');
  if (role === 'drawer') return t('relay.can.drawer');
  return t('relay.can.painter');
}
