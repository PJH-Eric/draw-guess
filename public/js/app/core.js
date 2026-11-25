/* ===== app/core.js — 畫面、輸入與流程（共用狀態與小工具） =====
 *
 * 這一層只負責「呈現狀態」與「把玩家意圖送出去」，不自己判斷規則。
 *   單機：自己持有完整的 Rules state，用同一份 Rules 推進（就你一個人，沒有電腦對手）。
 *   線上：狀態在伺服器，這裡只收 Rules.toPublic 投影，權限一律看 you.can。
 * 兩種模式最後都收斂成同一個 view 物件，所以只有一套畫面程式碼。
 *
 * 這個遊戲沒有聊天室：唯一的文字輸入就是猜題框，「猜題紀錄」併在操作摘要裡，唯讀。
 */
/* 原本是單一檔案 app.js，依功能拆成 js/app/ 底下的 ES module；入口是 main.js。 */

import { modals } from './modal.js?v=24a743ba5e';
import { renderRecentWorks } from './menus.js?v=24a743ba5e';
import { layoutStage } from './canvas.js?v=24a743ba5e';

var w = window;

export var D = document;
export var $ = function (id) { return D.getElementById(id); };
export var Rules = w.Rules, Words = w.Words, RNG = w.RNG;
export var Cfg = w.GameConfig, S = w.SvgUI, Store = w.Store, Sound = w.Sound, Paint = w.Paint;

export var ME = 'me';                    // 單機模式裡自己的玩家 id
export var LOOP_MS = 120;                // 單機推進與倒數更新的間隔

/* 「猜題紀錄」最多列幾筆（再多也捲不完，前面的意義不大） */
export var RECENT_MAX = 60;

export var app = {
  screen: 's-home',
  mode: null,                     // 'solo' | 'online'
  paint: null,
  view: null,
  feed: [],
  feedSeen: {},
  solo: null,                     // { state, director, seed, level }
  loop: 0,
  asideOpen: false,
  lastTurnKey: '',
  lastPhase: '',
  lastMask: '',
  lastGuessedCount: 0,
  roomCode: null,
  pendingInvite: null,
  inviteToken: null,
  inviteUrl: '',
  chatDraft: '',                  // 聊天室打到一半的字，投影更新時用來保留輸入框內容
  dismissedKickVote: '',              // 僅收起目前這場投票提示，不影響票數
  ruleMenuOpen: null,              // 遊戲規則自訂下拉選單：哪個欄位（set-rounds／set-drawsec／set-diff）展開中
  ruleFocus: null,                 // 卡片更新完要把焦點放到哪：{ field, target: 'btn' | 'opt' }
  roomCreate: { roomName: '', rounds: 2, drawSec: 90, diff: 0, guessRounds: 1, batonSec: 12, laps: 2, pdDrawSec: 60 },
  lobbyMode: 'classic',            // 'classic'（一般大廳）| 'relay'（接力大廳）| 'telephone'（畫圖傳話大廳）：決定大廳列哪種房、開哪種房
  lastOverlayHtml: null,
  conn: { status: 'idle', message: '' },
  wideLayout: null,
  recordedKey: '',
  resumeRoom: null                 // 重新整理前所在的房號（sessionStorage），連上線後自動回去
};

/* ================================================================
   小工具
   ================================================================ */

export function show(id) {
  if (w.ServerOutage) w.ServerOutage.setScreen(id);
  if (modals.reference) modals.reference.close();
  var list = D.querySelectorAll('.screen');
  for (var i = 0; i < list.length; i++) list[i].classList.toggle('active', list[i].id === id);
  app.screen = id;
  if (id !== 's-game' && w.NetworkLatency) w.NetworkLatency.setActive(false);
  if (id !== 's-game') { D.body.classList.remove('setup-open'); D.body.classList.remove('solo-mode'); }
  if (id === 's-game') { layoutStage(); if (app.paint) app.paint.resize(); }
  if (id === 's-solo') renderRecentWorks();
  Sound.setTrack(id === 's-game' ? 'draw' : 'menu');
  navChanged();
}

/** 畫面或彈窗有變：通知 app/history.js 更新「返回鍵擋板」 */
export function navChanged() {
  try { w.dispatchEvent(new w.Event('dg:nav')); } catch (e) { /* 很舊的瀏覽器沒有 Event 建構子：不影響遊玩 */ }
}

export var toastTimer = 0;
export function toast(message, kind) {
  var el = $('toast');
  el.textContent = message;
  el.setAttribute('data-kind', kind || 'info');
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.hidden = true; }, kind === 'error' ? 4200 : 2600);
}

export function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 把 <span data-ico="pen"> 換成真正的 SVG */
export function paintIcons(root) {
  var list = (root || D).querySelectorAll('[data-ico]');
  for (var i = 0; i < list.length; i++) {
    var el = list[i];
    if (el.dataset.icoDone) continue;
    el.innerHTML = S.icon(el.getAttribute('data-ico'));
    el.dataset.icoDone = '1';
  }
}

/** 目前該用哪個時鐘：線上要用伺服器時間算倒數 */
export function netNow() {
  return (app.mode === 'online' && w.Online) ? w.Online.now() : Date.now();
}

export function secsLeft(deadline) {
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((deadline - netNow()) / 1000));
}
