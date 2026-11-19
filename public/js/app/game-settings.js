/* ===== app/game-settings.js — 對局設定彈窗與邀請連結 ===== */

import { $, Cfg, D, S, Sound, app, esc, toast } from './core.js?v=b57785ee7e';
import { askConfirm, askLeaveGame, makeModal, modals } from './modal.js?v=b57785ee7e';
import { doSkip } from './canvas.js?v=b57785ee7e';
import { renderOverlay } from './overlay.js?v=b57785ee7e';
import { renderKickBanner } from './render.js?v=b57785ee7e';

var w = window;

/* ================================================================
   對局設定彈窗
   ================================================================ */

export function setupGameSettings() {
  modals.game = makeModal('game-settings-modal', 'game-settings-panel', 'b-game-settings');
  $('b-game-settings').addEventListener('click', function () { Sound.play('click'); modals.game.open(); renderGameSettings(); });
  $('game-settings-close').addEventListener('click', function () { modals.game.close(); });
  $('game-settings-done').addEventListener('click', function () { modals.game.close(); });
  var back = D.querySelector('[data-game-settings-close]');
  if (back) back.addEventListener('click', function () { modals.game.close(); });

  $('gs-skip').addEventListener('click', function () { doSkip(); modals.game.close(); });
  ['gs-kick-list', 'scorelist'].forEach(function (id) {
    $(id).addEventListener('click', function (ev) {
      var button = ev.target.closest('button[data-kick]');
      if (button && !button.disabled) confirmKick(button.getAttribute('data-kick'));
    });
  });
  ['b-kick-yes', 'b-kick-no'].forEach(function (id) {
    $(id).addEventListener('click', function () {
      if (!app.view || !app.view.you.can.voteKick) return;
      Sound.play('click');
      w.Online.send(id === 'b-kick-yes' ? 'room:kickVote' : 'room:kickDisagree', {});
    });
  });
  $('b-kick-close').addEventListener('click', function () {
    var v = app.view, kick = v && v.room && v.room.kick;
    if (!kick) return;
    app.dismissedKickVote = v.room.code + ':' + kick.targetId + ':' + kick.endsAt;
    renderKickBanner();
    $('b-kick-open').focus();
  });
  $('b-kick-open').addEventListener('click', function () {
    app.dismissedKickVote = '';
    renderKickBanner();
    $('b-kick-close').focus();
  });
  $('gs-quit').addEventListener('click', function () {
    modals.game.close();
    askLeaveGame();
  });
}

export function confirmKick(target) {
  var v = app.view;
  if (app.mode !== 'online' || !v || !v.room || !v.you.can.kick) return;
  var member = v.room.members.find(function (m) { return m.id === target && m.role === 'player' && m.id !== v.you.id; });
  if (!member) return;
  var code = v.room.code;
  if (modals.game.isOpen()) modals.game.close();
  Sound.play('click');
  askConfirm({
    title: w.I18N.t('kick.confirmTitle'),
    text: w.I18N.t('kick.confirmText', { name: member.name }),
    ok: w.I18N.t('kick.confirmOk'),
    cancel: w.I18N.t('kick.cancel')
  }, function () {
    var current = app.view;
    if (app.mode !== 'online' || !current || !current.room || current.room.code !== code) return;
    var exists = current.room.members.some(function (m) { return m.id === target && m.role === 'player' && m.id !== current.you.id; });
    if (!exists || !current.you.can.kick) {
      toast(w.I18N.t(current.room.kick ? 'kick.busy' : 'srv.err.kickBadTarget'), 'error');
      return;
    }
    w.Online.send('room:kick', { target: target });
  });
}

export function newInvite() {
  if (app.mode !== 'online' || !app.roomCode) return toast((globalThis.I18N ? globalThis.I18N.t("text.046") : "目前不在可邀請的房間裡。"), 'error');
  /* 不指定 role：伺服器端 createInvite 沒收到合法值就會當成 'any'，
     由拿到連結的人自己選要當玩家還是觀戰（見 checkPendingInvite／setupLobby）。 */
  w.Online.send('room:invite', {
    ttlMinutes: 60,
    maxUses: 20
  }, function (res) {
    if (!res || !res.ok) return toast((res && w.I18N.message(res.error, res.params)) || (globalThis.I18N ? globalThis.I18N.t("text.045") : "邀請連結產生失敗。"), 'error');
    app.inviteToken = res.token;
    app.inviteUrl = Cfg.inviteUrl(app.roomCode, res.token);
    app.lastOverlayHtml = null;
    renderOverlay();
    toast((globalThis.I18N ? globalThis.I18N.t("text.044") : "邀請連結好了，按「複製」傳給朋友。"), 'ok');
  });
}

export function revokeInvite() {
  if (!app.inviteToken) return;
  w.Online.send('room:revokeInvite', { token: app.inviteToken }, function (res) {
    if (res && res.ok === false) return toast(res.error || (globalThis.I18N ? globalThis.I18N.t("text.043") : "撤銷失敗。"), 'error');
    app.inviteToken = null;
    app.inviteUrl = '';
    app.lastOverlayHtml = null;
    renderOverlay();
    toast((globalThis.I18N ? globalThis.I18N.t("text.042") : "邀請連結已撤銷。"), 'ok');
  });
}

export function copyText(text) {
  if (!text) return toast((globalThis.I18N ? globalThis.I18N.t("text.041") : "先按「產生連結」。"), 'error');
  var done = function () { toast((globalThis.I18N ? globalThis.I18N.t("text.040") : "已複製到剪貼簿。"), 'ok'); };
  if (w.navigator && w.navigator.clipboard && w.navigator.clipboard.writeText) {
    w.navigator.clipboard.writeText(text).then(done).catch(function () { fallback(); });
  } else fallback();
  function fallback() {
    var el = $('invite-url');
    if (!el) return toast((globalThis.I18N ? globalThis.I18N.t("text.039") : "複製失敗，請手動選取連結。"), 'error');
    el.removeAttribute('readonly');
    el.select();
    try { D.execCommand('copy'); done(); } catch (e) { toast((globalThis.I18N ? globalThis.I18N.t("text.038") : "複製失敗，請手動選取。"), 'error'); }
    el.setAttribute('readonly', 'readonly');
  }
}

export function renderGameSettings() {
  var v = app.view;
  var online = app.mode === 'online' && v && v.room;

  $('gs-code').textContent = online ? v.room.code : (globalThis.I18N ? globalThis.I18N.t("text.037") : "單機");
  $('gs-role').textContent = !v ? '—'
    : (v.you.role === 'spectator' ? (globalThis.I18N ? globalThis.I18N.t("text.036") : "觀戰者") : (v.game && v.game.you.isDrawer ? (globalThis.I18N ? globalThis.I18N.t("text.035") : "這一題的畫家") : (globalThis.I18N ? globalThis.I18N.t("text.034") : "玩家")));
  $('gs-role-note').textContent = !v ? '—'
    : (v.you.role === 'spectator' ? (globalThis.I18N ? globalThis.I18N.t("text.033") : "可以看畫與猜題紀錄，不能畫也不能猜")
      : (globalThis.I18N ? globalThis.I18N.t("text.032") : "可以畫、可以猜") + (v.you.isHost ? (globalThis.I18N ? globalThis.I18N.t("text.031") : "，而且是房主") : ''));

  var rb = $('gs-role-btns');
  rb.innerHTML = '';
  if (online && v.you.can.becomePlayer) rb.innerHTML = ("<button class=\"btn3d small\" data-color=\"mint\" id=\"gs-become-player\">" + esc(I18N.t("text.030")) + "</button>");
  else if (online && v.you.can.becomeSpectator) rb.innerHTML = ("<button class=\"btn3d small\" data-color=\"cream\" id=\"gs-become-spectator\">" + esc(I18N.t("text.029")) + "</button>");
  S.decorateAll(rb);
  if ($('gs-become-player')) $('gs-become-player').addEventListener('click', function () { w.Online.send('room:becomePlayer', {}); modals.game.close(); });
  if ($('gs-become-spectator')) $('gs-become-spectator').addEventListener('click', function () { w.Online.send('room:becomeSpectator', {}); modals.game.close(); });

  /* 投票請玩家離開：只有線上房間才有；名單沒變就不重建按鈕（焦點才不會每次投影都跑掉） */
  var kg = $('gs-kick-group');
  kg.hidden = !online;
  if (online) {
    var others = v.room.members.filter(function (m) { return m.role === 'player' && m.id !== v.you.id; });
    var kickHtml = v.you.can.kick ? others.map(function (m) {
      return '<button type="button" class="btn3d small" data-color="cream" data-kick="' + esc(m.id) + '" data-name="' + esc(m.name) + '">' + esc(m.name) + '</button>';
    }).join('') : '';
    var kl = $('gs-kick-list');
    if (kl.getAttribute('data-sig') !== kickHtml) {
      kl.innerHTML = kickHtml;
      kl.setAttribute('data-sig', kickHtml);
      S.decorateAll(kl);
    }
    $('gs-kick-note').textContent = w.I18N.t(v.room.kick ? 'kick.busy'
      : (v.you.role !== 'player' ? 'kick.playersOnly' : (others.length < 2 ? 'kick.needThree' : 'kick.note')));
  }

  var canSkip = v && v.you && v.you.can.skip;
  $('gs-skip').disabled = !canSkip;
  $('gs-note').textContent = canSkip
    ? (globalThis.I18N ? globalThis.I18N.t("text.028") : "跳過會直接結束這一題，公布答案，沒有人得分。")
    : (v && v.game ? (globalThis.I18N ? globalThis.I18N.t("text.027") : "只有輪到你當畫家時才能跳過。") : (globalThis.I18N ? globalThis.I18N.t("text.026") : "目前沒有進行中的對局。"));
}
