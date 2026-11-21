/* ===== app/telephone.js — 畫圖傳話（Beta）的對局畫面 =====
 *
 * 一般模式與接力模式的畫面程式不動：render／overlay／canvas 只在 game.mode === 'telephone' 時把工作轉到這裡。
 * 這一層只呈現伺服器的投影（TelephoneRules.toPublic）並送出意圖，權限一律看 you.can 與 game.you。
 *
 * 身分（game.you.role）：starter 挑題中的開頭／drawer 輪到畫／guesser 輪到猜／waiting 等別人／
 *   spectator 觀戰（含中途進來、下一輪才加入的人）／player（揭曉、結算後）
 *
 * 畫布：輪到畫的人畫自己這一格（上一張畫只在換手 5 秒的卡片上看得到，開始作畫就收起來）；輪到猜的人畫布上顯示「正在看的那一張」（上一張或偷看的畫），不能畫；
 * 前面已經畫完的人可以在畫布上即時看後面的人作畫；其他人在傳話中看不到任何畫，畫布被等待卡蓋住；等最後一人猜時，等待卡改成可以左右翻看所有的畫。
 */

import { $, D, S, Sound, app, esc, secsLeft } from './core.js?v=6d05b1bb91';
import { strokesThumb } from './gallery.js?v=6d05b1bb91';
import { chatBlockHtml } from './overlay.js?v=6d05b1bb91';

var w = window;
var REACT = { heart: '❤️', laugh: '😂' };
function t(key, params) { return w.I18N.t(key, params); }
function sep() { return w.I18N.lang === 'en' ? ', ' : '、'; }

export function isTelephoneGame(g) { return !!(g && g.mode === 'telephone'); }

function inHandoff(g) { return g.phase === 'step' && Date.now() < g.stepStartsAt; }

/** 某個階段的名稱（上排 chip、左側摘要用）；傳話中再分「畫」與「猜」 */
export function telephonePhaseLabel(g) {
  if (g.phase === 'step') return t(g.turnKind === 'write' ? 'telephone.phase.write' : 'telephone.phase.draw');
  return t('telephone.phase.' + g.phase);
}

/** 上排 chip 的配色沿用一般模式：挑題同選題、傳話同作畫 */
export function telephonePhaseColor(g) {
  return { picking: 'picking', step: 'drawing', reveal: 'reveal', over: 'over' }[g.phase] || 'picking';
}

export function telephoneRoleLabel(role) { return t('telephone.role.' + (role || 'player')); }

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

function roundHtml(g) {
  return '<p class="relay-qno tp-qno">' + esc(t('telephone.roundNo', { n: g.roundNo, total: g.rounds })) + '</p>';
}

function thumbKey(g, idx) { return g.seed + ':' + g.roundNo + ':' + idx; }

/** 一張畫的縮圖；空白的畫顯示一張白紙 */
function pictureHtml(g, idx, strokes, size, alt) {
  var url = strokesThumb(thumbKey(g, idx), strokes, size);
  return url
    ? '<img class="tp-pic" src="' + url + '" alt="' + esc(alt || '') + '" width="' + size + '" height="' + size + '">'
    : '<span class="tp-pic tp-pic-blank" role="img" aria-label="' + esc(alt || '') + '"><span>' + esc(t('telephone.blank')) + '</span></span>';
}

/** 傳話順序：大家都看得到誰畫過、輪到誰、還有誰（沒有內容） */
function orderHtml(v, g) {
  if (!g.order || !g.order.length) return '';
  return '<ol class="tp-order" aria-label="' + esc(t('telephone.order')) + '">' + g.order.map(function (o) {
    var me = v.you && o.id === v.you.id;
    var st = o.skipped ? 'skipped' : (o.current ? 'current' : (o.done ? 'done' : 'todo'));
    return '<li class="tp-order-item" data-state="' + st + '" data-kind="' + o.kind + '"' + (me ? ' data-me="true"' : '') + '>' +
      '<span class="tp-order-face" aria-hidden="true">' + S.face(playerIdx(g, o.id), o.current ? (o.kind === 'write' ? 'think' : 'draw') : (o.done ? 'happy' : 'idle')) + '</span>' +
      '<span class="tp-order-name">' + esc(o.name) + (me ? '<span class="sr-only">' + esc(t('telephone.you')) + '</span>' : '') + '</span>' +
      '<small class="tp-order-tag">' + esc(t(o.kind === 'write' ? 'telephone.order.write' : 'telephone.order.draw') + (o.skipped ? '・' + t('telephone.order.skipped') : '')) + '</small></li>';
  }).join('') + '</ol>';
}

/* ---------------------------------------------------- 疊層卡片 */

function flowNote(html) { return '<p class="tp-flow-note">' + html + '</p>'; }

/** 挑題、換手、等別人、揭曉用疊層卡片；輪到自己畫或猜的時候不蓋住畫布（回傳 null） */
export function telephoneOverlayHtml(v, g) {
  if (g.phase === 'picking') return pickingHtml(v, g);
  if (g.phase === 'reveal') return revealHtml(v, g);
  if (g.phase !== 'step') return null;
  var mine = g.you.role === 'drawer' || g.you.role === 'guesser';
  if (mine && inHandoff(g)) return handoffHtml(v, g);
  if (mine) return null;
  /* 前面畫完的人：換手結束後直接在畫布上看下一位作畫 */
  if (g.you.watching && !inHandoff(g)) return null;
  return g.turnKind === 'write' && g.drawings ? browseHtml(v, g) : waitHtml(v, g);
}

function pickingHtml(v, g) {
  var s = secsLeft(g.deadline);
  if (g.you.canPick && g.choices && g.choices.length) {
    var cards = g.choices.map(function (c) {
      return '<button class="wordchoice" type="button" data-act="telephone-pick" data-word="' + esc(c.id) + '">' +
        '<b>' + esc(c.text) + '</b><span class="s">' + esc(c.catLabel) + '・' + esc(c.diffLabel) + '</span></button>';
    }).join('');
    return roundHtml(g) + '<h3>' + esc(t('telephone.pick.title')) + '</h3>' +
      flowNote(withSecs('telephone.pick.note', s)) +
      '<div class="wordchoices tp-choices">' + cards + '</div>' + orderHtml(v, g);
  }
  return roundHtml(g) + '<div class="relay-guesser-card tp-wait-card"><span class="relay-hero-face" aria-hidden="true">' +
    S.face(playerIdx(g, g.starterId), 'think') + '</span>' +
    '<h3>' + esc(t('telephone.pick.wait', { name: g.starterName })) + '</h3>' + flowNote(esc(t('telephone.pick.waitNote'))) +
    '<p class="tp-secs">' + withSecs('telephone.secs', s) + '</p></div>';
}

/** 換手 5 秒：輪到的人看到大字倒數與要照著畫（或猜）的東西 */
function handoffHtml(v, g) {
  var s = Math.max(0, Math.ceil((g.stepStartsAt - Date.now()) / 1000));
  var guess = g.you.role === 'guesser';
  var prev = g.prev;
  var body = '';
  if (prev && prev.kind === 'word') {
    body = '<p class="tp-hand-label">' + esc(t('telephone.hand.word')) + '</p><div class="revealword tp-hand-word">' + esc(prev.text) + '</div>';
  } else if (prev && prev.kind === 'drawing') {
    body = '<p class="tp-hand-label">' + esc(t(guess ? 'telephone.hand.guessFrom' : 'telephone.hand.copyFrom', { name: prev.authorName })) + '</p>' +
      '<div class="tp-hand-pic">' + pictureHtml(g, prev.idx, prev.strokes || [], 320, t('telephone.alt.drawing', { name: prev.authorName })) + '</div>' +
      (guess ? '' : flowNote(esc(t('telephone.hand.memorize'))));
  }
  return '<div class="relay-countdown tp-handoff">' + roundHtml(g) +
    '<p class="relay-count-who">' + esc(t(guess ? 'telephone.hand.guess' : 'telephone.hand.draw')) + '</p>' +
    '<b class="relay-count-n tp-hand-n" aria-live="assertive">' + (s > 0 ? s : esc(t('telephone.go'))) + '</b>' + body + '</div>';
}

/** 作畫中等別人：只知道輪到誰、還剩幾秒，看不到任何畫 */
function waitHtml(v, g) {
  var s = secsLeft(g.deadline);
  var joinsNext = g.you.role === 'spectator' && v.you.role === 'player';
  var key = g.turnKind === 'write' ? 'telephone.wait.write' : 'telephone.wait.draw';
  var guidance = joinsNext ? flowNote(esc(t('telephone.wait.next'))) :
    '<dl class="tp-wait-tips">' + ['before', 'after'].map(function (stage) {
      var prefix = 'telephone.wait.' + stage;
      return '<div><dt>' + esc(t(prefix + 'Title')) + '</dt><dd>' + esc(t(prefix + 'Note')) + '</dd></div>';
    }).join('') + '</dl>';
  return roundHtml(g) + '<div class="relay-guesser-card tp-wait-card tp-turn-wait">' +
    '<div class="tp-wait-heading"><span class="relay-hero-face" aria-hidden="true">' +
    S.face(playerIdx(g, g.turnId), g.turnKind === 'write' ? 'think' : 'draw') + '</span>' +
    '<h3>' + esc(t(key, { name: g.turnName, n: g.stepNo + 1 })) + '</h3></div>' +
    guidance + '<p class="tp-secs">' + withSecs('telephone.secs', s) + '</p>' + orderHtml(v, g) + '</div>';
}

/** 等最後一人猜：其他人（含觀戰者）左右翻看這一輪所有的畫，看不到題目 */
function browseHtml(v, g) {
  var list = g.drawings || [];
  var s = secsLeft(g.deadline);
  var i = Math.max(0, Math.min(list.length - 1, app.tpBrowse || 0));
  app.tpBrowse = i;
  var cur = list[i];
  var pic = cur ? pictureHtml(g, cur.idx, cur.strokes, 480, t('telephone.alt.drawing', { name: cur.authorName })) : '';
  return roundHtml(g) + '<h3>' + esc(t('telephone.wait.write', { name: g.turnName })) + '</h3>' +
    '<p class="tp-secs">' + withSecs('telephone.secs', s) + '</p>' +
    (cur ? '<div class="tp-browse">' +
      '<button class="pillbtn tp-browse-btn" type="button" data-act="telephone-browse" data-d="-1" aria-label="' + esc(t('telephone.browse.prev')) + '"' + (list.length < 2 ? ' disabled' : '') + '>‹</button>' +
      '<figure class="tp-browse-fig">' + pic + '<figcaption>' + esc(t('telephone.browse.pos', { i: i + 1, n: list.length, name: cur.authorName })) + '</figcaption></figure>' +
      '<button class="pillbtn tp-browse-btn" type="button" data-act="telephone-browse" data-d="1" aria-label="' + esc(t('telephone.browse.next')) + '"' + (list.length < 2 ? ' disabled' : '') + '>›</button>' +
      '</div>' : '') +
    flowNote(esc(t('telephone.browse.note')));
}

function hintsLine(chain) {
  var parts = [];
  var basic = chain.hints.basic;
  for (var i = 1; i <= basic; i++) parts.push(t('telephone.hintName.' + i));
  chain.hints.peeks.forEach(function (idx) {
    var c = chain.cells[idx];
    parts.push(t('telephone.reveal.peeked', { name: c ? c.authorName : '—' }));
  });
  if (!parts.length) return esc(t('telephone.reveal.noHints'));
  return esc(t('telephone.reveal.hints', { list: parts.join(sep()), f: chain.factor }));
}

function reactBtns(c) {
  return '<span class="tp-reacts">' + ['heart', 'laugh'].map(function (k) {
    var on = c.mine.indexOf(k) >= 0;
    var label = t('react.' + k) + ' ' + c.counts[k];
    return '<button class="react-btn tp-react' + (on ? ' on' : '') + '" type="button" data-act="telephone-react" data-cell="' + c.idx + '" data-kind="' + k + '"' +
      ' aria-pressed="' + on + '" aria-label="' + esc(label) + '"' + (c.canReact ? '' : ' disabled') + '>' +
      '<span class="react-emoji" aria-hidden="true">' + REACT[k] + '</span><b class="react-count" aria-hidden="true">' + c.counts[k] + '</b></button>';
  }).join('') + '</span>';
}

function ptsHtml(c, hit) {
  if (c.skipped) return '';
  return '<span class="tp-cell-pts" data-on="' + (hit && c.points > 0) + '">' + esc(t('telephone.reveal.pts', { n: c.points })) + '</span>';
}

/** 揭曉整串：題目 → 每個人的畫 → 最後的答案；每一格可以按愛心／大笑 */
export function chainHtml(g, chain) {
  var rows = '<li class="tp-cell tp-cell-word"><span class="tp-cell-step">' + esc(t('telephone.reveal.word')) + '</span>' +
    '<div class="revealword">' + esc(chain.word || '—') + '</div></li>';
  chain.cells.forEach(function (c, i) {
    var stand = c.stand ? '<small class="tp-cell-stand">' + esc(t('telephone.reveal.stand', { name: c.stand })) + '</small>' : '';
    var head = '<div class="tp-cell-head"><span class="tp-cell-step">' + (i + 1) + '</span>' +
      '<b class="tp-cell-name">' + esc(c.authorName) + '</b>' +
      ptsHtml(c, chain.hit) + '</div>';
    if (c.skipped) {
      rows += '<li class="tp-cell' + (c.kind === 'write' ? ' tp-cell-write' : '') + '" data-skipped="true">' + head +
        '<p class="tp-cell-skip">' + esc(t('telephone.reveal.skipped')) + '</p>' + stand + '</li>';
      return;
    }
    if (c.kind === 'draw') {
      var midTag = c.midHit ? '<p class="tp-cell-mid">' + esc(t('telephone.reveal.midHit', { n: c.midPts, wrong: c.midWrong })) + '</p>' : '';
      rows += '<li class="tp-cell tp-cell-draw">' + head +
        '<div class="tp-cell-pic">' + pictureHtml(g, 'r' + chain.roundNo + ':' + i, c.strokes, 240, t('telephone.alt.drawing', { name: c.authorName })) + '</div>' +
        stand + midTag + reactBtns(c) + '</li>';
    } else {
      rows += '<li class="tp-cell tp-cell-write" data-hit="' + chain.hit + '"><div>' + head + stand + '</div>' +
        '<div class="tp-cell-outcome"><div class="tp-cell-answer">' +
        (c.text ? '「' + esc(c.text) + '」' : esc(t('telephone.reveal.blankAnswer'))) + '</div>' +
        '<p class="relay-result" data-hit="' + chain.hit + '">' + esc(t(chain.hit ? 'telephone.reveal.hit' : 'telephone.reveal.miss')) + '</p></div>' +
        reactBtns(c) + '</li>';
    }
  });
  return '<ol class="tp-chain">' + rows + '</ol><p class="tp-hints-used">' + hintsLine(chain) + '</p>';
}

function revealHtml(v, g) {
  var chain = g.chain;
  if (!chain) return null;
  var s = secsLeft(g.deadline);
  var last = g.roundNo >= g.rounds;
  return roundHtml(g) + '<h3>' + esc(t('telephone.reveal.title')) + '</h3>' + chainHtml(g, chain) +
    '<p class="tp-next">' + withSecs(last ? 'telephone.reveal.last' : 'telephone.reveal.next', s) + '</p>' +
    /* 揭曉時可以聊天（傳話中關閉，避免暴雷） */
    chatBlockHtml(v);
}

/** 結算卡上的「最好笑」（放在分享範圍內，結算圖片也會帶到）；沒人按表情就不頒 */
export function telephoneAwardsHtml(g) {
  var list = g && g.awards && g.awards.funniest;
  if (!list || !list.length) return '';
  return '<div class="relay-awards tp-awards"><ul><li class="relay-award tp-award">' +
    '<span class="relay-award-ico" aria-hidden="true">😂</span>' +
    '<span class="relay-award-text"><b class="relay-award-title">' + esc(t('telephone.award.funniest')) + '</b>' +
    '<span class="relay-award-desc">' + esc(t('telephone.award.funniestDesc')) + '</span></span>' +
    '<span class="relay-award-who"><b>' + esc(list.map(function (x) { return x.name; }).join(sep())) + '</b>' +
    '<small>' + esc(t('telephone.award.count', { n: list[0].count })) + '</small></span></li></ul></div>';
}

/* ---------------------------------------------------- 玩家列（傳話順序） */

function stateText(g, p) {
  if (g.phase === 'over') return t('telephone.role.player');
  if (p.pending) return t('telephone.state.pending');
  var o = null;
  for (var i = 0; i < (g.order || []).length; i++) if (g.order[i].id === p.id && !g.order[i].skipped) o = g.order[i];
  if (g.phase === 'picking') return p.id === g.starterId ? t('telephone.state.picking') : t('telephone.state.waiting');
  if (!o) return t('telephone.state.waiting');
  if (o.current) return t(o.kind === 'write' ? 'telephone.state.guessing' : 'telephone.state.drawing');
  if (p.midHit) return t('telephone.state.midHit');
  if (o.done) return t('telephone.state.done');
  return t('telephone.state.waiting');
}

/** 玩家列：傳話中照傳話順序排、標出輪到誰；結算時照分數排 */
export function telephoneStripHtml(v, g) {
  var list = g.players.slice();
  var pos = {};
  (g.order || []).forEach(function (o, i) { if (pos[o.id] === undefined || !o.skipped) pos[o.id] = i; });
  if (g.phase === 'over') list.sort(function (a, b) { return b.score - a.score; });
  else list.sort(function (a, b) { return (pos[a.id] === undefined ? 99 : pos[a.id]) - (pos[b.id] === undefined ? 99 : pos[b.id]); });
  return list.map(function (p) {
    var cls = ['pcard'];
    if (p.isDrawer || p.isGuesser) cls.push('drawer');
    if (p.id === v.you.id) cls.push('me');
    var mood = g.phase === 'over' ? (g.winners.indexOf(p.id) >= 0 ? 'win' : 'sad') : (p.isDrawer ? 'draw' : (p.isGuesser ? 'think' : 'idle'));
    return '<div class="' + cls.join(' ') + '">' +
      '<span class="pface" aria-hidden="true">' + S.face(playerIdx(g, p.id), mood) + '</span>' +
      '<span class="pinfo"><b class="pname">' + esc(p.name) + '</b>' +
      '<span class="pstate">' + esc(stateText(g, p)) + '</span></span>' +
      '<span class="pscore">' + p.score + '</span></div>';
  }).join('');
}

/* ---------------------------------------------------- 題目列 */

export function renderTelephoneWordbar(v, g) {
  var wb = $('wordbar');
  wb.hidden = false;
  var role = g.you.role;
  var label, mask, isStatus = false;
  var meta = [];
  if (g.phase === 'reveal' || g.phase === 'over') {
    label = t('telephone.word.answer');
    mask = g.answer || '—';
  } else if (role === 'drawer' && g.prev && g.prev.kind === 'word') {
    label = t('telephone.word.draw');
    mask = g.prev.text;
  } else if (role === 'drawer') {
    isStatus = true;
    label = t('telephone.word.copy');
    mask = t('telephone.word.copyMask', { name: g.prev ? g.prev.authorName : '—' });
  } else if (role === 'spectator' && g.answer) {
    /* 觀戰者全部都看得到：題目直接顯示 */
    label = t('text.156');
    mask = g.answer;
    meta.push(t(g.turnKind === 'write' ? 'telephone.word.spectateWrite' : 'telephone.word.watchMask', { name: g.turnName }));
  } else if (g.you.watching) {
    isStatus = true;
    label = t('telephone.word.watch');
    mask = t('telephone.word.watchMask', { name: g.turnName });
  } else if (role === 'guesser') {
    var h = g.hint;
    label = t('telephone.word.guess');
    mask = h && h.lenShown ? h.mask : '？';
    if (h && h.catShown) meta.push(h.catLabel);
    if (h && h.lenShown) meta.push(h.len + t('text.158'));
    if (h && h.revealed) meta.push(t('text.157'));
    meta.push(t('telephone.factor', { f: g.factor }));
  } else {
    label = t('text.156');
    mask = '？';
    meta.push(t('telephone.word.secret'));
  }
  wb.setAttribute('data-mine', String(role === 'drawer' && !!g.prev && g.prev.kind === 'word'));
  wb.toggleAttribute('data-tp-status', isStatus);
  $('wordbar-label').textContent = label;
  $('wordbar-mask').textContent = mask;
  meta.push(t('telephone.roundNo', { n: g.roundNo, total: g.rounds }));
  $('wordbar-meta').textContent = meta.join('・');
}

/* ---------------------------------------------------- 畫布內容 */

/** 輪到猜的人目前在看哪一張：上一張（prev）或偷看過的某一張 */
function guesserViews(g) {
  var out = [];
  if (g.prev && g.prev.kind === 'drawing') out.push({ idx: g.prev.idx, name: g.prev.authorName, strokes: g.prev.strokes, prev: true });
  (g.peeks || []).forEach(function (p) { out.push({ idx: p.idx, name: p.authorName, strokes: p.strokes, prev: false }); });
  return out;
}

function currentView(g) {
  var views = guesserViews(g);
  for (var i = 0; i < views.length; i++) if (views[i].idx === app.tpView) return views[i];
  return views[0] || null;
}

/**
 * 依身分決定畫布上要顯示的筆畫（online-events 收到投影後呼叫）：
 * 輪到畫的人 → 自己這一格；輪到猜的人 → 正在看的那一張；其他人 → 空白。
 */
export function applyTelephoneCanvas(v) {
  var g = v.game;
  if (!isTelephoneGame(g) || !app.paint) return;
  if (g.phase === 'step' && g.you.role === 'guesser') {
    var cur = currentView(g);
    var list = cur ? cur.strokes : [];
    var key = g.roundNo + ':' + (cur ? cur.idx : -1) + ':' + list.length;
    if (app.tpCanvasKey !== key || app.paint.count() !== list.length) { app.tpCanvasKey = key; app.paint.setStrokes(list); }
    return;
  }
  app.tpCanvasKey = '';
  if (g.phase === 'step' && (g.you.role === 'drawer' || g.you.watching)) {
    /* 自己這一格：伺服器帶整份筆畫，對不上才換（避免把剛畫、還在路上的一筆洗掉又畫回來） */
    var mine = g.strokes || [];
    if (mine.length !== app.paint.count()) app.paint.setStrokes(mine);
    return;
  }
  if (app.paint.count()) app.paint.setStrokes([]);
}

/* ---------------------------------------------------- 音效與計時 */

/**
 * 階段切換時的音效與震動（online-events 每次收到投影時呼叫）。
 * 用「輪次:階段:格子」當鑰匙，同一個切換只響一次；剛進房（或重新整理）不補放。
 */
export function telephoneTransition(prev, v) {
  var g = v.game;
  if (!isTelephoneGame(g)) return;
  var key = g.roundNo + ':' + g.phase + ':' + g.stepNo;
  if (app.telephoneKey === key) return;
  var before = app.telephoneKey;
  app.telephoneKey = key;
  app.tpView = null;
  app.tpBrowse = 0;
  if (!before) return;
  var mine = g.you.role === 'drawer' || g.you.role === 'guesser' || g.you.role === 'starter';
  if (g.phase === 'picking') Sound.play(mine ? 'turn' : 'click');
  else if (g.phase === 'step') {
    if (mine) { Sound.play('start'); Sound.vibrate([40, 70, 40, 70, 120]); }
    else Sound.play('click');
  } else if (g.phase === 'reveal') Sound.play(g.chain && g.chain.hit ? 'correct' : 'timeup');
}

/** 換手倒數數字：由 updateTimers 每 120ms 呼叫（等待秒數由 .pick-secs 共用邏輯更新） */
export function telephoneTick(v, g) {
  var n = D.querySelector('#overlay-card .tp-hand-n');
  if (n && g.phase === 'step') {
    var s = Math.max(0, Math.ceil((g.stepStartsAt - Date.now()) / 1000));
    var text = s > 0 ? String(s) : t('telephone.go');
    if (n.textContent !== text) n.textContent = text;
  }
  /* 揭曉中的「N 秒後下一輪」 */
  var nx = D.querySelector('#overlay-card .tp-next .pick-secs');
  if (nx) { var r = String(secsLeft(g.deadline)); if (nx.textContent !== r) nx.textContent = r; }
}

/* ---------------------------------------------------- 操作列 */

/** 工具列：輪到畫的人換手時就先出現（開畫那一刻畫面才不會跳動），換手結束才真的能畫 */
export function telephoneToolsShown(g) {
  return g.phase === 'step' && g.you.role === 'drawer';
}

/** 猜的人的提示鈕（字數 → 種類 → 揭一個字）與「偷看前面的畫」 */
export function renderTelephoneAssist(v, g) {
  var can = v.you.can || {};
  var guesser = g.phase === 'step' && g.you.role === 'guesser';
  var row = $('hintrow');
  row.hidden = !guesser;
  row.classList.toggle('relay-hints', guesser);
  row.classList.toggle('tp-guesser-row', guesser);
  D.body.classList.toggle('tp-guessing', guesser);
  var steps = (g.hint && g.hint.steps) || [];
  for (var i = 0; i < 3; i++) {
    var b = $('b-hint-' + (i + 1));
    var st = steps[i] || { done: false, available: false, exists: i < 2 };
    b.hidden = !guesser || !st.exists;
    b.disabled = !guesser || !st.available || !can.hint;
    b.classList.toggle('done', !!st.done);
    b.setAttribute('aria-pressed', String(!!st.done));
  }
  $('hintrow-note').textContent = guesser ? t('telephone.hint.note', { f: g.factor }) : '';
  $('b-relay-giveup').hidden = true;
  $('relay-cheers').hidden = true;
  renderPeekDock(v, g, guesser);
}

function renderPeekDock(v, g, guesser) {
  var dock = $('tp-peekdock');
  if (!dock) return;
  var views = guesser ? guesserViews(g) : [];
  var list = guesser ? (g.peekable || []).filter(function (p) { return p.state === 'available' || p.state === 'peeked'; }) : [];
  dock.hidden = !guesser || !list.length;
  if (dock.hidden) { dock.removeAttribute('data-sig'); return; }
  var cur = currentView(g);
  /* 一張畫一顆鈕：沒偷看過的是「偷看（倍數）」，偷看過的變成切換鈕；第一顆是上一張 */
  var chip = function (x, label) {
    var on = !!cur && cur.idx === x.idx;
    return '<button class="pillbtn tp-view" type="button" role="radio" aria-checked="' + on + '" data-tp-view="' + x.idx + '">' + esc(label) + '</button>';
  };
  var html = '<span class="hintrow-label">' + esc(t('telephone.peek.label')) + '</span>';
  if (views[0] && views[0].prev) html += chip(views[0], t('telephone.peek.prev', { name: views[0].name }));
  list.forEach(function (p) {
    if (p.state === 'peeked') html += chip({ idx: p.idx }, t('telephone.peek.seen', { name: p.authorName }));
    else {
      html += '<button class="pillbtn tp-peek" type="button" data-tp-peek="' + p.idx + '"' + (v.you.can.peek ? '' : ' disabled') +
        ' aria-label="' + esc(t('telephone.peek.aria', { name: p.authorName, f: p.factor })) + '">' +
        esc(t('telephone.peek.btn', { name: p.authorName, f: p.factor })) + '</button>';
    }
  });
  var sig = html + ':' + w.I18N.lang;
  if (dock.getAttribute('data-sig') === sig) return;
  dock.setAttribute('data-sig', sig);
  dock.innerHTML = html;
}

/** 離開畫圖傳話（回到其他模式畫面）時收起這個模式專用的元件 */
export function hideTelephoneUi() {
  var row = $('hintrow');
  if (row) row.classList.remove('tp-guesser-row');
  $('wordbar').removeAttribute('data-tp-status');
  D.body.classList.remove('tp-guessing');
  var dock = $('tp-peekdock');
  if (dock) { dock.hidden = true; dock.removeAttribute('data-sig'); }
  app.telephoneKey = '';
  app.tpCanvasKey = '';
}

/** 畫布被點但不能畫：依身分說明原因 */
export function telephoneBlockedTip(v) {
  var g = v.game;
  if (!v.you || v.you.role === 'spectator') return null;
  if (g.you.role === 'guesser') return t('telephone.tip.guesser');
  if (g.you.role === 'drawer') return t('telephone.tip.handoff');
  if (g.you.watching) return t('telephone.tip.watching');
  return t('telephone.tip.wait');
}

/** 戰績用：這一局我猜中幾次、畫了幾張 */
export function telephoneRecord(v) {
  var g = v.game, me = v.you.id;
  var correct = 0, drawn = 0;
  (g.log || []).forEach(function (e) {
    if (e.hit && e.guesserId === me) correct += 1;
    (e.points || []).forEach(function (p, i) { if (p.id === me && !p.skipped && i < e.points.length - 1) drawn += 1; });
  });
  return { correct: correct, drawn: drawn };
}

/** 左側摘要的「你可以做什麼」 */
export function telephoneCanDo(v, g) {
  if (v.you.role === 'spectator' || g.you.role === 'spectator') return t('telephone.can.spectator');
  var role = g.you.role;
  if (g.phase === 'picking') return t(role === 'starter' ? 'telephone.can.starter' : 'telephone.can.wait');
  if (g.phase === 'reveal') return t('telephone.can.reveal');
  if (role === 'drawer') return t(g.prev && g.prev.kind === 'word' ? 'telephone.can.drawWord' : 'telephone.can.copy');
  if (role === 'guesser') return t('telephone.can.guesser');
  if (g.you.midGuess && g.you.midGuess.can) return t('telephone.can.midGuess', { n: g.you.midGuess.points });
  if (g.you.watching) return t('telephone.can.watch');
  return t(g.turnKind === 'write' ? 'telephone.can.browse' : 'telephone.can.wait');
}

/* ---------------------------------------------------- 事件 */

export function setupTelephoneControls() {
  var dock = $('tp-peekdock');
  if (dock) dock.addEventListener('click', function (ev) {
    var b = ev.target.closest ? ev.target.closest('button') : null;
    if (!b || b.disabled || !dock.contains(b)) return;
    var v = app.view;
    if (!v || !isTelephoneGame(v.game)) return;
    Sound.play('click');
    if (b.hasAttribute('data-tp-view')) {
      app.tpView = Number(b.getAttribute('data-tp-view'));
      applyTelephoneCanvas(v);
      renderPeekDock(v, v.game, true);
    } else if (b.hasAttribute('data-tp-peek')) {
      var idx = Number(b.getAttribute('data-tp-peek'));
      app.tpView = idx;
      w.Online.send('room:peek', { idx: idx });
    }
  });
  /* 猜的人打字：草稿存在伺服器（時間到就用草稿送出）；停手 400ms 才送一次，其他人收不到 */
  var timer = 0;
  $('guess-input').addEventListener('input', function () {
    var v = app.view, g = v && v.game;
    if (app.mode !== 'online' || !isTelephoneGame(g) || g.you.role !== 'guesser') return;
    var text = this.value;
    w.clearTimeout(timer);
    timer = w.setTimeout(function () { w.Online.send('room:answer', { text: text, draft: true }); }, 400);
  });
  $('guessbar').addEventListener('submit', function () { w.clearTimeout(timer); }, true);
}

/** 疊層卡片上的按鈕（overlay.js 的事件委派轉過來） */
export function telephoneOverlayAct(act, el) {
  if (act === 'telephone-pick') w.Online.send('room:pick', { wordId: el.getAttribute('data-word') });
  else if (act === 'telephone-react') w.Online.send('room:react', { kind: el.getAttribute('data-kind'), cell: Number(el.getAttribute('data-cell')) });
  else if (act === 'telephone-browse') {
    var g = app.view && app.view.game;
    var n = g && g.drawings ? g.drawings.length : 0;
    if (!n) return;
    app.tpBrowse = ((app.tpBrowse || 0) + Number(el.getAttribute('data-d')) + n) % n;
    app.lastOverlayHtml = null;
    return 'render';
  }
  return null;
}
