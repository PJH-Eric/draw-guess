/* ===== app/gallery.js — 結算畫面的本局畫廊、最佳畫家與看大圖 =====
 *
 * 畫廊的筆畫量大，伺服器不會跟著每次同步送下來：結算畫面第一次出現時才用 room:gallery 要一次，
 * 依「種子 + 題號」記住是哪一局，再來一局換了種子就重新要。
 * 縮圖在本機用同一套畫布引擎（Paint.drawStroke，固定 1400×1400，油漆桶才會跟原圖一致）重畫後縮小。
 */

import { $, D, app, esc, toast } from './core.js?v=dc086ad2ad';
import { makeModal, modals } from './modal.js?v=dc086ad2ad';
import { renderOverlay } from './overlay.js?v=dc086ad2ad';

var w = window;
var THUMB = 240;
var REACT_EMOJI = { heart: '❤️', laugh: '😂', clap: '👏' };

/* 目前這一局的畫廊（只留一份） */
var gal = { key: '', status: 'idle', items: [], thumbs: [], timer: 0 };
var viewer = { modal: null, index: 0 };

export function reactionEmoji(kind) { return REACT_EMOJI[kind] || ''; }

function keyOf(g) { return g ? g.seed + ':' + g.turnNo : ''; }

/** 把一張作品重畫到 1400×1400 的畫布（跟遊戲畫布同一套繪製，油漆桶結果才一致） */
function renderFull(strokes) {
  var P = w.Paint;
  var c = D.createElement('canvas');
  c.width = P.BUF; c.height = P.BUF;
  var ctx = c.getContext('2d');
  ctx.fillStyle = P.PAPER;
  ctx.fillRect(0, 0, P.BUF, P.BUF);
  for (var i = 0; i < strokes.length; i++) P.drawStroke(ctx, strokes[i], false);
  return c;
}

function thumbOf(strokes) {
  try {
    var full = renderFull(strokes);
    var t = D.createElement('canvas');
    t.width = THUMB; t.height = THUMB;
    var ctx = t.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(full, 0, 0, THUMB, THUMB);
    return t.toDataURL('image/png');
  } catch (e) { return ''; }
}

/* 公布答案卡上的小縮圖：卡片蓋住了畫布，按表情前要看得到在評哪一張。
   用本機畫布上已經有的筆畫重畫，每一題只算一次。 */
var revealThumb = { key: '', url: '' };
export function revealThumbUrl(turnNo) {
  if (!app.paint || !app.paint.count()) return '';
  var key = turnNo + ':' + app.paint.count();
  if (revealThumb.key !== key) revealThumb = { key: key, url: thumbOf(app.paint.strokes()) };
  return revealThumb.url;
}

function rerender() {
  app.lastOverlayHtml = null;
  if (app.view) renderOverlay();
}

/** 結算畫面出現時呼叫：還沒要過這一局的畫廊就去要（線上限定） */
export function ensureGallery(g) {
  if (app.mode !== 'online' || !g || g.phase !== 'over') return;
  var key = keyOf(g);
  if (gal.key === key && gal.status !== 'idle') return;
  loadGallery(key);
}

export function retryGallery() {
  if (gal.key) loadGallery(gal.key);
}

function loadGallery(key) {
  gal = { key: key, status: 'loading', items: [], thumbs: [], timer: 0 };
  var mine = gal;
  var done = false;
  var finish = function (res) {
    if (done || gal !== mine) return;
    done = true;
    w.clearTimeout(mine.timer);
    if (!res || !res.ok || !Array.isArray(res.items)) { mine.status = 'error'; rerender(); return; }
    mine.items = res.items;
    mine.thumbs = res.items.map(function (it) { return thumbOf(it.strokes || []); });
    mine.status = 'ready';
    rerender();
  };
  mine.timer = w.setTimeout(function () { finish(null); }, 8000);
  var sent = w.Online && w.Online.send('room:gallery', {}, finish);
  if (!sent) finish(null);
}

/** 離開結算或換局時丟掉畫廊與大圖視窗 */
export function resetGallery() {
  w.clearTimeout(gal.timer);
  gal = { key: '', status: 'idle', items: [], thumbs: [], timer: 0 };
  if (viewer.modal && viewer.modal.isOpen()) viewer.modal.close();
}

function reactionsLine(r) {
  var out = '';
  for (var k in REACT_EMOJI) {
    if (r && r[k] > 0) out += '<span class="gal-react" aria-label="' + esc(w.I18N.t('react.' + k)) + ' ' + r[k] + '">' + REACT_EMOJI[k] + '<b>' + r[k] + '</b></span>';
  }
  return out;
}

/** 最佳畫家：放在分享範圍內（結算圖片也會帶到） */
export function bestDrawerHtml(g) {
  var best = g && g.bestDrawers;
  if (!best || !best.length) return '';
  return '<div class="best-drawer"><span class="best-drawer-badge" aria-hidden="true">🎨</span>' +
    '<span class="best-drawer-text"><span class="best-drawer-tag">' + esc(w.I18N.t('best.title')) + '</span>' +
    '<b class="best-drawer-name">' + esc(best.map(function (b) { return b.name; }).join('、')) + '</b>' +
    '<span class="best-drawer-count">' + esc(w.I18N.t('best.count', { n: best[0].count })) + '</span></span></div>';
}

/** 結算卡裡的畫廊區塊 */
export function galleryHtml(g) {
  if (app.mode !== 'online' || !g || !g.galleryCount) return '';
  var body;
  if (gal.key !== keyOf(g) || gal.status === 'loading' || gal.status === 'idle') {
    body = '<p class="gal-status" role="status">' + esc(w.I18N.t('gallery.loading')) + '</p>';
  } else if (gal.status === 'error') {
    body = '<p class="gal-status">' + esc(w.I18N.t('gallery.fail')) +
      ' <button class="pillbtn gal-retry" type="button" data-act="gallery-retry">' + esc(w.I18N.t('gallery.retry')) + '</button></p>';
  } else if (!gal.items.length) {
    body = '<p class="gal-status">' + esc(w.I18N.t('gallery.empty')) + '</p>';
  } else {
    body = '<ul class="gal-grid">' + gal.items.map(function (it, i) {
      var label = w.I18N.t('gallery.open', { name: it.drawerName, word: it.word });
      return '<li class="gal-item"><button class="gal-thumb" type="button" data-act="gallery-open" data-i="' + i + '" aria-label="' + esc(label) + '">' +
        (gal.thumbs[i] ? '<img src="' + gal.thumbs[i] + '" alt="" width="' + THUMB + '" height="' + THUMB + '">' : '') +
        '<span class="gal-word">' + esc(it.word) + '</span>' +
        '<span class="gal-by">' + esc(w.I18N.t('gallery.by', { name: it.drawerName })) + '</span>' +
        '<span class="gal-reacts">' + reactionsLine(it.reactions) + '</span></button></li>';
    }).join('') + '</ul>';
  }
  return '<section class="gallery-block" aria-labelledby="gal-title"><h4 id="gal-title">' + esc(w.I18N.t('gallery.title')) + '</h4>' + body + '</section>';
}

/* ---------------------------------------------------- 看大圖 */

function renderViewer() {
  var it = gal.items[viewer.index];
  if (!it) return;
  var n = gal.items.length;
  $('gallery-view-word').textContent = it.word;
  $('gallery-view-by').textContent = w.I18N.t('gallery.by', { name: it.drawerName });
  $('gallery-view-reacts').innerHTML = reactionsLine(it.reactions);
  $('gallery-view-pos').textContent = w.I18N.t('gallery.pos', { i: viewer.index + 1, n: n });
  var pic = $('gallery-view-picture');
  pic.innerHTML = '';
  var c = renderFull(it.strokes || []);
  c.className = 'gallery-view-canvas';
  c.setAttribute('role', 'img');
  c.setAttribute('aria-label', w.I18N.t('gallery.open', { name: it.drawerName, word: it.word }));
  pic.appendChild(c);
  $('gallery-prev').disabled = n < 2;
  $('gallery-next').disabled = n < 2;
}

export function openGalleryItem(i) {
  if (gal.status !== 'ready' || !gal.items[i]) return;
  viewer.index = i;
  viewer.modal.open();
  renderViewer();
}

function step(d) {
  var n = gal.items.length;
  if (n < 2) return;
  viewer.index = (viewer.index + d + n) % n;
  renderViewer();
}

function safeName(s) {
  return String(s || 'drawing').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40) || 'drawing';
}

function downloadCurrent() {
  var it = gal.items[viewer.index];
  var c = $('gallery-view-picture').querySelector('canvas');
  if (!it || !c) return;
  c.toBlob(function (blob) {
    if (!blob) { toast(w.I18N.t('text.187'), 'error'); return; }
    var url = URL.createObjectURL(blob);
    var a = D.createElement('a');
    a.href = url;
    a.download = 'draw-guess-' + safeName(it.drawerName) + '-' + safeName(it.word) + '.png';
    D.body.appendChild(a);
    a.click();
    a.remove();
    w.setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    toast(w.I18N.t('gallery.saved'), 'ok');
  }, 'image/png');
}

export function setupGallery() {
  viewer.modal = makeModal('gallery-modal', 'gallery-panel', null);
  /* 登記起來，手機返回鍵才會先關大圖，而不是問要不要離開對局 */
  modals.gallery = viewer.modal;
  ['gallery-close', 'gallery-backdrop'].forEach(function (id) {
    $(id).addEventListener('click', function () { viewer.modal.close(); });
  });
  $('gallery-prev').addEventListener('click', function () { step(-1); });
  $('gallery-next').addEventListener('click', function () { step(1); });
  $('gallery-download').addEventListener('click', downloadCurrent);
  $('gallery-panel').addEventListener('keydown', function (ev) {
    if (ev.target && ev.target.tagName === 'INPUT') return;
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); step(-1); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); step(1); }
  });
  /* 換語系時大圖視窗的文字跟著換 */
  if (w.I18N && w.I18N.onChange) w.I18N.onChange(function () { if (viewer.modal.isOpen()) renderViewer(); });
}
