/* ===== app/modal.js — 彈窗、範本與確認對話框 ===== */

import { $, D, S, Sound, Words, app, esc, navChanged } from './core.js?v=407d3bb548';
import { leaveGame } from './lobby.js?v=407d3bb548';

var w = window;

/* ================================================================
   Modal（設定彈窗）：遮罩、焦點鎖定、Escape、關閉返回原焦點
   ================================================================ */

export function makeModal(modalId, panelId, openerId) {
  var modal = $(modalId), panel = $(panelId), opener = $(openerId);
  var lastFocus = null;
  var onKey = function (ev) {
    if (ev.key === 'Escape') { ev.preventDefault(); api.close(); return; }
    if (ev.key !== 'Tab') return;
    var f = panel.querySelectorAll('button,input,select,textarea,[href],[tabindex]:not([tabindex="-1"])');
    var able = [];
    for (var i = 0; i < f.length; i++) if (!f[i].disabled && f[i].offsetParent !== null) able.push(f[i]);
    if (!able.length) return;
    var first = able[0], last = able[able.length - 1];
    if (ev.shiftKey && D.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && D.activeElement === last) { ev.preventDefault(); first.focus(); }
  };
  var api = {
    isOpen: function () { return modal.classList.contains('open'); },
    open: function () {
      if (api.isOpen()) return;
      lastFocus = D.activeElement;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      D.body.classList.add('modal-open');
      if (opener) opener.setAttribute('aria-expanded', 'true');
      D.addEventListener('keydown', onKey, true);
      setTimeout(function () { panel.focus(); }, 0);
      S.repaintAll(panel);
      navChanged();
    },
    close: function () {
      if (!api.isOpen()) return;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      if (!D.querySelector('.settings-modal.open')) D.body.classList.remove('modal-open');
      if (opener) opener.setAttribute('aria-expanded', 'false');
      D.removeEventListener('keydown', onKey, true);
      /* 焦點回到原本的地方。觸控裝置按按鈕常常不會讓它取得焦點，
         那時候 lastFocus 會是 body，退而求其次回到開啟用的按鈕。 */
      var back = (lastFocus && lastFocus.focus && lastFocus !== D.body && D.contains(lastFocus))
        ? lastFocus : opener;
      if (back && back.focus) back.focus();
      navChanged();
    },
    toggle: function () { api.isOpen() ? api.close() : api.open(); }
  };
  return api;
}

/* 各個彈窗的控制器（makeModal 的回傳值），在各自的 setup 裡建立 */
export var modals = { settings: null, game: null, roomCreate: null, confirm: null, reference: null };
export var referenceKey = '', referenceStep = 3;
export var referenceRendered = '';

export function referenceId() {
  var v = app.view;
  if (app.screen !== 's-game' || !v || !v.game || !v.you.can.draw ||
      !v.game.you.isDrawer || (v.room && v.room.closed)) return null;
  return v.game.referenceId;
}

export function renderReference() {
  var id = referenceId();
  $('b-reference').hidden = !id;
  var key = id ? id + ':' + app.view.game.turnNo + ':' + app.view.game.lang : '';
  if (referenceKey !== key) {
    referenceKey = key;
    referenceStep = 3;
    referenceRendered = '';
    modals.reference.close();
    $('reference-picture').innerHTML = '';
    $('reference-word').textContent = '';
  }
  if (!id) { modals.reference.close(); return; }
  if (!modals.reference.isOpen()) return;
  var rendered = key + ':' + referenceStep + ':' + w.I18N.lang;
  if (rendered === referenceRendered) return;
  referenceRendered = rendered;
  var word = Words.byId(id, app.view.game.lang);
  var picture = $('reference-picture');
  $('reference-word').textContent = word.text;
  var semanticSvg = w.MeaningReference
    ? w.MeaningReference.svg(id, referenceStep)
    : '';
  var DR = w.DrawingReference;
  if (!semanticSvg && DR.hasRecipe && !DR.hasRecipe(id) && DR.ensure) {
    DR.ensure(id, function () { referenceRendered = ''; renderReference(); });
  }
  var svg = semanticSvg || DR.svg(id, referenceStep);
  picture.innerHTML = svg;
  var hasPicture = !!svg;
  picture.setAttribute('aria-label', w.I18N.t('reference.image', { word: word.text, step: referenceStep }));
  picture.hidden = !hasPicture;
  $('reference-empty').hidden = hasPicture;
  $('reference-steps').hidden = !hasPicture;
  var buttons = D.querySelectorAll('[data-reference-step]');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].setAttribute('aria-pressed', String(Number(buttons[i].dataset.referenceStep) === referenceStep));
  }
}

export function setupReference() {
  modals.reference = makeModal('reference-modal', 'reference-panel', 'b-reference');
  $('b-reference').addEventListener('click', function () {
    if (!referenceId()) return;
    referenceStep = 3;
    modals.reference.open();
    renderReference();
  });
  ['reference-close', 'reference-done', 'reference-backdrop'].forEach(function (id) {
    $(id).addEventListener('click', function () { modals.reference.close(); });
  });
  $('reference-steps').addEventListener('click', function (ev) {
    var button = ev.target.closest('[data-reference-step]');
    if (!button) return;
    referenceStep = Number(button.dataset.referenceStep);
    renderReference();
  });
}

/* ---------------------------------------------------------- 確認對話框
   離開對局這種收不回來的動作，先再問一次。用同一組 Modal 行為
   （焦點鎖定、Escape 關閉、關閉後焦點歸位），不用瀏覽器的 confirm()。 */
export var confirmAction = null;

export function setupConfirm() {
  modals.confirm = makeModal('confirm-modal', 'confirm-panel', null);
  $('confirm-cancel').addEventListener('click', function () { confirmAction = null; modals.confirm.close(); Sound.play('click'); });
  $('confirm-ok').addEventListener('click', function () {
    var fn = confirmAction;
    confirmAction = null;
    modals.confirm.close();
    Sound.play('click');
    if (fn) fn();
  });
  var back = D.querySelector('[data-confirm-close]');
  if (back) back.addEventListener('click', function () { confirmAction = null; modals.confirm.close(); });
}

/**
 * 問一次再做。
 * @param {{title:string, text:string, ok:string, cancel:string}} o
 * @param {function} onOk 按下確定才會跑
 */
export function askConfirm(o, onOk) {
  $('confirm-title').textContent = o.title;
  $('confirm-text').textContent = o.text;
  S.setLabel($('confirm-ok'), esc(o.ok));
  S.setLabel($('confirm-cancel'), esc(o.cancel));
  confirmAction = onOk;
  modals.confirm.open();
}

/** 離開對局前的確認：線上是離開房間、單機是離開這一局 */
export function askLeaveGame() {
  var online = app.mode === 'online';
  askConfirm({
    get title() { return online ? (globalThis.I18N ? globalThis.I18N.t("text.276") : "要離開這間房嗎？") : (globalThis.I18N ? globalThis.I18N.t("text.282") : "要離開這一局嗎？"); },
    get text() { return online
      ? (globalThis.I18N ? globalThis.I18N.t("text.281") : "離開後你的座位會釋出，房間裡的對局會繼續進行。想再回來的話要重新從大廳加入。")
      : (globalThis.I18N ? globalThis.I18N.t("text.280") : "目前這一局的進度與分數不會保留。"); },
    get ok() { return online ? (globalThis.I18N ? globalThis.I18N.t("text.104") : "離開房間") : (globalThis.I18N ? globalThis.I18N.t("text.279") : "離開這一局"); },
    get cancel() { return online ? (globalThis.I18N ? globalThis.I18N.t("text.272") : "留下來") : (globalThis.I18N ? globalThis.I18N.t("text.278") : "繼續玩"); }
  }, function () {
    leaveGame(online ? 's-lobby' : 's-home');
  });
}

/** 等待中的房間裡按「離開房間／退出房間」：房主退出會把房主交給下一位 */
export function askLeaveRoom() {
  var v = app.view;
  var isHost = !!(v && v.you && v.you.isHost);
  var alone = !!(v && v.room && v.room.members && v.room.members.length <= 1);
  askConfirm({
    get title() { return isHost ? (globalThis.I18N ? globalThis.I18N.t("text.277") : "要退出這間房嗎？") : (globalThis.I18N ? globalThis.I18N.t("text.276") : "要離開這間房嗎？"); },
    get text() { return isHost
      ? (alone
        ? (globalThis.I18N ? globalThis.I18N.t("text.275") : "房間裡只剩你，退出之後這間房會直接關掉，邀請連結也會失效。")
        : (globalThis.I18N ? globalThis.I18N.t("text.274") : "退出之後房主會交給下一位，房間會繼續留著。想再回來的話要重新從大廳加入。"))
      : (globalThis.I18N ? globalThis.I18N.t("text.273") : "離開後你的座位會釋出，房間會繼續留著。想再回來的話要重新從大廳加入。"); },
    get ok() { return isHost ? (globalThis.I18N ? globalThis.I18N.t("text.105") : "退出房間") : (globalThis.I18N ? globalThis.I18N.t("text.104") : "離開房間"); },
    get cancel() { return globalThis.I18N ? globalThis.I18N.t("text.272") : "留下來"; }
  }, function () {
    leaveGame('s-lobby');
  });
}
