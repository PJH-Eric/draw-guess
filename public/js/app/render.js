/* ===== app/render.js — 對局畫面渲染 ===== */

import { $, D, S, app, esc, secsLeft } from './core.js?v=131ce4b06c';
import { renderReference } from './modal.js?v=131ce4b06c';
import { sizeCanvas } from './canvas.js?v=131ce4b06c';
import { renderAside, renderControls, renderOverlay } from './overlay.js?v=131ce4b06c';

var w = window;

/* ================================================================
   畫面渲染（單機與線上共用）
   ================================================================ */

export var PHASE_LABEL = { get picking() { return globalThis.I18N ? globalThis.I18N.t("text.165") : "選題目"; }, get drawing() { return globalThis.I18N ? globalThis.I18N.t("text.150") : "作畫中"; }, get reveal() { return globalThis.I18N ? globalThis.I18N.t("text.164") : "公布答案"; }, get over() { return globalThis.I18N ? globalThis.I18N.t("text.163") : "結算"; } };

/* 只顯示目前第幾題，不顯示「/ 總題數」：
   線上房間對局中可以一直有人中途加入，總題數在結束前其實還會變，
   顯示分母反而是誤導；單機沒有這回事，但兩邊乾脆都只看目前題號就好，簡單清楚。 */
export function turnLabel(g) {
  return (globalThis.I18N ? globalThis.I18N.t("text.162") : "第 ") + g.turnNo + (globalThis.I18N ? globalThis.I18N.t("text.161") : " 題");
}

export function render() {
  var v = app.view;
  if (!v) return;
  var g = v.game;
  var closed = v.room && v.room.closed;
  if (w.NetworkLatency) w.NetworkLatency.setActive(app.screen === 's-game' && app.mode === 'online' && !!v.room && v.room.phase === 'playing' && !!g && g.phase !== 'over');

  /* ---- 上排狀態 ---- */
  var phaseChip = $('phase-chip');
  if (closed) {
    phaseChip.textContent = (globalThis.I18N ? globalThis.I18N.t("text.071") : "房間已結束");
    phaseChip.setAttribute('data-p', 'over');
  } else if (v.room && v.room.phase === 'waiting') {
    phaseChip.textContent = (globalThis.I18N ? globalThis.I18N.t("text.070") : "等待開始");
    phaseChip.setAttribute('data-p', 'picking');
  } else if (g) {
    phaseChip.textContent = PHASE_LABEL[g.phase] || g.phase;
    phaseChip.setAttribute('data-p', g.phase);
  }
  $('round-chip').textContent = g ? turnLabel(g) : (globalThis.I18N ? globalThis.I18N.t("text.160") : "尚未開始");

  updateTimers();

  /* ---- 題目提示 ----
     對局中一直留著（沒題目時顯示等待文字），提示列才不會忽然冒出來把畫布擠小 */
  var wb = $('wordbar');
  if (!g || closed) {
    wb.hidden = true;
  } else if (g.hint) {
    var mine = g.you.isDrawer;
    var h = g.hint;
    wb.hidden = false;
    wb.setAttribute('data-mine', String(mine));
    $('wordbar-label').textContent = mine ? (globalThis.I18N ? globalThis.I18N.t("text.159") : "你要畫的是") : (globalThis.I18N ? globalThis.I18N.t("text.156") : "題目");
    /* 猜題者要等畫家按提示：還沒按就連幾個字都不知道 */
    $('wordbar-mask').textContent = (mine || g.answer) ? (g.answer || '')
      : (h.lenShown ? h.mask : '？');
    var meta = [];
    if (h.catShown) meta.push(h.catLabel);
    if (h.lenShown) meta.push(h.len + (globalThis.I18N ? globalThis.I18N.t("text.158") : " 個字"));
    if (!mine && !h.lenShown && !h.catShown) meta.push((globalThis.I18N ? globalThis.I18N.t("text.069") : "畫家還沒給提示"));
    if (!mine && h.revealed) meta.push((globalThis.I18N ? globalThis.I18N.t("text.157") : "翻開了 1 個字"));
    meta.push(turnLabel(g));
    $('wordbar-meta').textContent = meta.join('・');
  } else {
    wb.hidden = false;
    wb.setAttribute('data-mine', 'false');
    $('wordbar-label').textContent = (globalThis.I18N ? globalThis.I18N.t("text.156") : "題目");
    $('wordbar-mask').textContent = '—';
    $('wordbar-meta').textContent = (g.phase === 'picking' ? (globalThis.I18N ? globalThis.I18N.t("text.155") : "畫家正在挑題目…") : (globalThis.I18N ? globalThis.I18N.t("text.070") : "等待開始")) +
      '・' + turnLabel(g);
  }
  /* 畫家斷線中：告訴大家不是當機，15 秒沒回來就會跳過這一題（伺服器算的） */
  if (v.room && v.room.drawerAwayUntil && !wb.hidden) {
    $('wordbar-meta').textContent = (globalThis.I18N ? globalThis.I18N.t("text.154") : "畫家斷線了，最多等 15 秒・") + $('wordbar-meta').textContent;
  }

  renderPlayers();
  renderOverlay();
  renderControls();
  renderReference();
  renderAside();
  sizeCanvas();
}

/* 有投票在進行就顯示橫幅：誰對誰、幾票、剩幾秒；有投票權的人看得到「同意」 */
export function renderKickBanner() {
  var v = app.view;
  var k = app.mode === 'online' && v && v.room && !v.room.closed ? v.room.kick : null;
  var box = $('kick-banner');
  if (!k) { box.hidden = true; return; }
  var secs = Math.max(0, secsLeft(k.endsAt));
  $('kick-text').textContent = w.I18N.t('kick.banner', { by: k.byName, name: k.targetName, yes: k.yes, need: k.need, s: secs }) +
    (v.you.can.voteKick ? '' : ' ' + w.I18N.t(k.targetId === v.you.id ? 'kick.target' : (k.voted ? 'kick.voted' : 'kick.watch')));
  $('b-kick-yes').hidden = !v.you.can.voteKick;
  box.hidden = false;
}

export function updateTimers() {
  renderKickBanner();
  var v = app.view;
  if (!v || !v.game) { $('timer-chip').hidden = true; return; }
  var g = v.game;
  var chip = $('timer-chip');
  if (g.phase === 'over' || !g.deadline || (v.room && v.room.closed)) { chip.hidden = true; return; }
  /* 單機作畫不設限（上限 99999 秒）：寫「99999 秒」只會讓人以為壞了，
     但整顆藏起來會讓抬頭少一列的高度，右側工具列跟著上移鑽到設定鈕底下，
     所以維持同一顆 chip，只把數字換成「不限時」。
     選題那 15 秒是真的會逾時自動挑第一個，那個照常倒數。 */
  if (app.mode === 'solo' && g.phase === 'drawing') {
    chip.hidden = false;
    chip.setAttribute('data-urgent', 'false');
    $('timer-text').textContent = (globalThis.I18N ? globalThis.I18N.t("text.153") : "不限時");
    var soloSum = $('sum-timer');
    if (soloSum) soloSum.textContent = (globalThis.I18N ? globalThis.I18N.t("text.153") : "不限時");
    return;
  }
  var s = secsLeft(g.deadline);
  chip.hidden = false;
  /* 數字與單位分開：窄螢幕把單位縮小，數字才放得大（textContent 仍是「114 秒」） */
  var timerHtml = s + '<span class="timer-unit">' + esc(globalThis.I18N ? globalThis.I18N.t("text.152") : " 秒") + '</span>';
  var timerEl = $('timer-text');
  if (timerEl.innerHTML !== timerHtml) timerEl.innerHTML = timerHtml;
  /* 選題卡上的「N 秒內沒選…」也跟著倒數（卡片本身只在收到投影時才更新） */
  var ps = D.querySelector('#overlay-card .pick-secs');
  if (ps && ps.textContent !== String(s)) ps.textContent = s;
  chip.setAttribute('data-urgent', String(g.phase === 'drawing' && s <= 10));
  var sum = $('sum-timer');
  if (sum) sum.textContent = s + (globalThis.I18N ? globalThis.I18N.t("text.152") : " 秒");
}

export function moodOf(p, g) {
  if (g.phase === 'over') return g.winners.indexOf(p.id) >= 0 ? 'win' : 'sad';
  if (p.isDrawer) return g.phase === 'drawing' ? 'draw' : 'think';
  if (p.guessed) return 'happy';
  return g.phase === 'drawing' ? 'think' : 'idle';
}

export function stateOf(p, g) {
  if (p.isDrawer) return g.phase === 'picking' ? (globalThis.I18N ? globalThis.I18N.t("text.151") : "選題目中") : (globalThis.I18N ? globalThis.I18N.t("text.150") : "作畫中");
  if (p.guessed) return (globalThis.I18N ? globalThis.I18N.t("text.149") : "已猜中");
  if (g.phase === 'drawing') return p.wrong ? ((globalThis.I18N ? globalThis.I18N.t("text.148") : "猜了 ") + p.wrong + (globalThis.I18N ? globalThis.I18N.t("text.147") : " 次")) : (globalThis.I18N ? globalThis.I18N.t("text.146") : "思考中");
  return (globalThis.I18N ? globalThis.I18N.t("text.008") : "等待中");
}

export function renderPlayers() {
  var v = app.view, g = v.game;
  var host = $('playerstrip');
  if (!g) { host.innerHTML = ''; app.lastScores = null; return; }
  var html = '';
  var prev = app.lastScores || {}, cur = {}, gains = [];
  for (var i = 0; i < g.players.length; i++) {
    var p = g.players[i];
    var cls = ['pcard'];
    if (p.isDrawer) cls.push('drawer');
    if (p.guessed) cls.push('guessed');
    if (p.id === v.you.id) cls.push('me');
    cur[p.id] = p.score;
    if (prev[p.id] !== undefined && p.score > prev[p.id]) gains.push({ i: i, n: p.score - prev[p.id] });
    html += '<div class="' + cls.join(' ') + '">' +
      '<span class="pface" aria-hidden="true">' + S.face(i, moodOf(p, g)) + '</span>' +
      '<span class="pinfo"><b class="pname">' + esc(p.name) + '</b>' +
      '<span class="pstate">' + esc(stateOf(p, g)) + '</span></span>' +
      '<span class="pscore">' + p.score + '</span></div>';
  }
  app.lastScores = cur;
  /* 內容沒變就不重建（房間投影每秒都會來） */
  if (host.getAttribute('data-sig') !== html) { host.setAttribute('data-sig', html); host.innerHTML = html; }
  for (var k = 0; k < gains.length; k++) floatGain(host.children[gains[k].i], gains[k].n);
}

/** 有人得分：分數卡上方飄一個「+N」。掛在 body 上，卡片重畫也不會被洗掉，飄完自己移除。 */
export function floatGain(card, n) {
  if (!card || !card.getBoundingClientRect || D.body.classList.contains('reduced-motion')) return;
  var r = card.getBoundingClientRect();
  if (!r.width) return;
  var el = D.createElement('span');
  el.className = 'score-float';
  el.setAttribute('aria-hidden', 'true');
  el.textContent = '+' + n;
  el.style.left = Math.round(r.left + r.width / 2) + 'px';
  el.style.top = Math.round(r.top) + 'px';
  D.body.appendChild(el);
  w.setTimeout(function () { el.remove(); }, 1100);
}
