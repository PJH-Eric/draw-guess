/* ===== app/feed.js — 猜題紀錄與左側摘要欄 ===== */

import { $, RECENT_MAX, app, esc } from './core.js?v=3fde9877f8';
import { layoutStage } from './canvas.js?v=3fde9877f8';

var w = window;

/* ================================================================
   猜題紀錄（唯讀，顯示在操作摘要裡）
   ================================================================ */

export function pushFeed(entry) {
  if (!entry) return;
  if (entry.id && app.feedSeen[entry.id]) return;
  if (entry.id) app.feedSeen[entry.id] = 1;
  app.feed.push(entry);
  if (app.feed.length > 120) app.feed.splice(0, app.feed.length - 120);
  renderRecent();
}

export function replaceFeed(list) {
  app.feed = (list || []).slice();
  app.feedSeen = {};
  for (var i = 0; i < app.feed.length; i++) if (app.feed[i].id) app.feedSeen[app.feed[i].id] = 1;
  renderRecent();
}

/** 系統事件與每一則猜題合成同一條時間軸；線上的系統訊息以伺服器摘要為準，不重複。 */
export function recentEvents() {
  var v = app.view;
  var hasSummary = !!(v && v.room && v.room.summary);
  var out = [];
  var i, n, m;
  if (hasSummary) {
    for (i = 0; i < v.room.summary.length; i++) {
      n = v.room.summary[i];
      out.push({ at: n.at || 0, kind: n.kind || 'info', text: n.key ? w.I18N.message(n.key, n.params) : n.text });
    }
  }
  for (i = 0; i < app.feed.length; i++) {
    m = app.feed[i];
    if (hasSummary && m.kind !== 'guess') continue;
    out.push({
      at: m.at || 0,
      kind: m.kind === 'guess' ? 'guess' : (m.kind || 'info'),
      get text() { return m.kind === 'guess' ? (m.from + (globalThis.I18N ? globalThis.I18N.t("text.202") : " 猜「") + m.text + '」') : m.text; },
      mine: !!(m.fromId && v && v.you && m.fromId === v.you.id)
    });
  }
  out.sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
  return out;
}

/** 唯一的紀錄區：最新的排在最上面，不用捲到底就看得到 */
export function renderRecent() {
  var ul = $('sum-list');
  if (!ul) return;
  var recent = recentEvents().slice(-RECENT_MAX).reverse();
  ul.innerHTML = recent.map(function (n) {
    return '<li data-k="' + esc(n.kind || 'info') + '"' + (n.mine ? ' data-mine="true"' : '') +
      '>' + esc(n.text) + '</li>';
  }).join('');
  $('sum-empty').hidden = recent.length > 0;
  /* 畫布旁（橫向右欄）或畫布下方空白處（直向）的猜題流：最新的在最下面，貼著猜題框 */
  var gf = $('guess-feed');
  if (gf) {
    gf.setAttribute('data-empty', w.I18N ? w.I18N.t('text.408') : '');
    var feedHtml = recent.slice(0, 30).map(function (n) {
      return '<li data-k="' + esc(n.kind || 'info') + '"' + (n.mine ? ' data-mine="true"' : '') + '>' + esc(n.text) + '</li>';
    }).join('');
    /* 內容沒變就不重建：每次畫面更新都重建的話，氣泡的進場動畫會一直重播 */
    if (gf.getAttribute('data-sig') !== feedHtml) { gf.setAttribute('data-sig', feedHtml); gf.innerHTML = feedHtml; }
  }
}

export function layoutAside() {
  var aside = $('game-aside');
  if (!aside) return;
  if (!app.asideOpen || w.matchMedia('(min-width:1100px)').matches) {
    aside.style.top = '';
    return;
  }
  /* 摘要緊接工具鈕下方展開，讓長紀錄有更多可閱讀空間。 */
  var top = 0;
  ['b-game-back', 'b-aside-toggle', 'b-game-settings', 'b-settings'].forEach(function (id) {
    var control = $(id);
    if (control && !control.hidden) top = Math.max(top, control.getBoundingClientRect().bottom);
  });
  aside.style.top = Math.ceil(top + 8) + 'px';
}

export function setAsideOpen(open) {
  app.asideOpen = !!open;
  var aside = $('game-aside');
  aside.classList.toggle('open', app.asideOpen);
  /* 窄版是把浮層移出畫面，寬版是常駐左欄；收合要用 display 才真的讓出空間 */
  aside.classList.toggle('collapsed', !app.asideOpen);
  $('game').classList.toggle('aside-open', app.asideOpen);
  $('b-aside-toggle').setAttribute('aria-expanded', String(app.asideOpen));
  layoutAside();
  layoutStage();
}

/* 寬版左欄常駐（紀錄就在裡面），窄版收起來、用摘要鈕叫出來 */
export function relayoutFeed() {
  var wide = w.matchMedia('(min-width:1100px)').matches;
  if (app.wideLayout === wide) return;
  app.wideLayout = wide;
  setAsideOpen(wide);
  renderRecent();
  layoutStage();
}
