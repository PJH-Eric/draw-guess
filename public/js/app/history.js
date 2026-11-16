/* ===== app/history.js — 手機返回鍵／瀏覽器上一頁 ===== */
/*
 * 這是單頁應用，畫面切換本來不會留下瀏覽紀錄：在對局中按 Android 的返回鍵（或瀏覽器上一頁）
 * 會直接離開整個網頁。這裡只要不在主選單、或有彈窗開著，就在瀏覽紀錄裡墊一筆「擋板」：
 * 按返回時瀏覽器只是把擋板彈掉，我們收到 popstate 後做「畫面上的返回」
 * （關彈窗 → 收摘要 → 離開對局要先問 → 回主選單），需要的話再把擋板墊回去。
 * 回到主選單就把擋板收掉，再按一次返回才會真的離開網頁。
 */

import { $, D, app, show } from './core.js?v=35d7919526';
import { modals } from './modal.js?v=35d7919526';
import { setAsideOpen } from './feed.js?v=35d7919526';

var w = window;
var guarded = false;   // 目前有沒有墊著擋板
var skipPop = false;   // 下一次 popstate 是我們自己收擋板造成的，不用處理
var inPop = false;     // 正在處理返回鍵
/* 返回鍵處理完還需要擋板時，不馬上墊回去，等使用者下一次操作（點、按鍵）才墊：
   瀏覽器會把「沒有使用者操作就自己加上去的瀏覽紀錄」標成可略過，
   在 popstate 裡立刻 pushState 的話，下一次按返回鍵會整個跳過、直接離開網頁。 */
var rearm = false;

function topModal() {
  var order = ['confirm', 'reference', 'game', 'roomCreate', 'settings'];
  for (var i = 0; i < order.length; i++) {
    var m = modals[order[i]];
    if (m && m.isOpen()) return order[i];
  }
  return null;
}

function needGuard() { return app.screen !== 's-home' || !!topModal(); }

export function syncHistory() {
  if (!w.history || !w.history.pushState) return;
  if (needGuard()) {
    if (guarded || inPop || rearm) return;
    try { w.history.pushState(Object.assign({}, w.history.state, { dgBack: 1 }), ''); guarded = true; } catch (e) { guarded = false; }
  } else {
    rearm = false;
    if (!guarded) return;
    guarded = false;
    skipPop = true;
    try { w.history.back(); } catch (e) { skipPop = false; }
  }
}

/** 畫面上的「返回」：由內而外，一次只退一層 */
export function goBack() {
  var m = topModal();
  if (m === 'confirm') { $('confirm-cancel').click(); return; }
  if (m) { modals[m].close(); return; }
  if (app.screen === 's-game') {
    if (app.asideOpen && !w.matchMedia('(min-width:1100px)').matches) { setAsideOpen(false); return; }
    $('b-game-back').click();
    return;
  }
  if (app.screen !== 's-home') {
    var back = D.querySelector('#' + app.screen + ' [data-back]');
    if (back) back.click(); else show('s-home');
  }
}

export function setupHistory() {
  w.addEventListener('popstate', function () {
    if (skipPop) { skipPop = false; return; }
    guarded = false;
    inPop = true;
    try { goBack(); } finally { inPop = false; }
    rearm = needGuard();
  });
  var onGesture = function () {
    if (!rearm) return;
    rearm = false;
    syncHistory();
  };
  ['pointerdown', 'keydown', 'click'].forEach(function (type) { D.addEventListener(type, onGesture, true); });
  w.addEventListener('dg:nav', syncHistory);
  syncHistory();
}
