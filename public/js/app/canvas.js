/* ===== app/canvas.js — 畫布與工具列 ===== */

import { $, D, ME, Paint, Rules, S, Sound, Store, app, toast } from './core.js?v=a602eaaae6';
import { askConfirm } from './modal.js?v=a602eaaae6';
import { handleGameEvents, soloRefresh, startSolo, withWordPack } from './solo.js?v=a602eaaae6';
import { pushFeed } from './feed.js?v=a602eaaae6';

var w = window;

/* ================================================================
   畫布
   ================================================================ */

export function ensurePaint() {
  if (app.paint) return app.paint;
  app.paint = Paint.create($('board'), {
    onStroke: sendStroke,
    onSound: function (kind) {
      if (kind === 'draw' || kind === 'pen') Sound.playPen();
      else Sound.play(kind === 'erase' ? 'erase' : (kind === 'fill' ? 'fill' : 'shape'));
    },
    onBlocked: function () {
      var v = app.view;
      if (!v || !v.game) return;
      toolHint(v.you && v.you.role === 'spectator'
        ? (globalThis.I18N ? globalThis.I18N.t("text.201") : "你是觀戰者，不能畫也不能猜。")
        : (v.game.you.isDrawer ? (globalThis.I18N ? globalThis.I18N.t("text.200") : "還不能畫，先挑一個題目。") : (globalThis.I18N ? globalThis.I18N.t("text.199") : "現在不是你畫，換你猜猜看！")), 'error');
      Sound.play('blocked');
    }
  });
  app.paint.setTool(Store.tool());
  app.paint.setColor(Store.color());
  app.paint.setWidth(Store.width());
  return app.paint;
}

export function sendStroke(stroke) {
  if (app.mode === 'solo') {
    var r = Rules.addStroke(app.solo.state, ME, stroke);
    if (!r.ok) { toolHint(r.error, 'error'); Sound.play('blocked'); return; }
    app.paint.addStroke(r.stroke);
    app.paint.clearRedo();
    soloRefresh();
    return;
  }
  /* 線上：本機先畫出來（不等來回），伺服器回聲會因為筆數相同而被略過 */
  var sanitized = Rules.sanitizeStroke(stroke);
  if (!sanitized) return;
  app.paint.addStroke(sanitized);
  app.paint.clearRedo();
  w.Online.send('room:stroke', { stroke: stroke });
}

export var stageRO = null;
export function layoutStage() {
  var stage = $('stage'), box = $('stage-canvas');
  if (!stage || !box) return;
  /* 舞台是 flex:1，工具列或猜題框一出現高度就會變，所以用 ResizeObserver
     盯著它，畫布永遠不會比舞台大。 */
  if (!stageRO && w.ResizeObserver) {
    stageRO = new w.ResizeObserver(function () { sizeCanvas(); });
    stageRO.observe(stage);
  }
  sizeCanvas();
}

export function sizeCanvas() {
  var stage = $('stage'), box = $('stage-canvas');
  if (!stage || !box) return;
  var r = stage.getBoundingClientRect();
  var size = Math.floor(Math.min(r.width, r.height));
  if (!isFinite(size) || size < 80) return;
  /* 只扣掉外框陰影需要的一點點餘裕，其餘全部給畫布 */
  size = Math.max(140, size - 2);
  /* 直向時畫布下方剩多少空白：猜題氣泡只用這一段，不夠高就不顯示（絕不擠壓畫布） */
  var gap = Math.max(0, Math.floor(r.height - size));
  stage.style.setProperty('--stage-gap', gap + 'px');
  stage.classList.toggle('gap-tight', gap < 46);
  if (box.style.width === size + 'px') return;
  box.style.width = size + 'px';
  box.style.height = size + 'px';
  if (app.paint) app.paint.resize();
}

export function toolHint(text, kind) {
  var el = $('tool-hint');
  el.textContent = text || '';
  el.setAttribute('data-kind', kind || 'info');
}

/* ---------------------------------------------------------- 工具列 */

export var TOOL_ORDER = ['pen', 'brush', 'line', 'rect', 'ellipse', 'erase', 'fill'];
export var TOOL_ICON = { pen: 'pen', brush: 'brush', line: 'line', rect: 'rect', ellipse: 'ellipse', erase: 'erase', fill: 'fill' };
export var TOOL_TIP = {
  get pen() { return globalThis.I18N ? globalThis.I18N.t("text.198") : "鉛筆：按住拖曳畫線"; },
  get brush() { return globalThis.I18N ? globalThis.I18N.t("text.197") : "筆刷：比鉛筆粗一級"; },
  get line() { return globalThis.I18N ? globalThis.I18N.t("text.196") : "直線：按住拖到終點放開"; },
  get rect() { return globalThis.I18N ? globalThis.I18N.t("text.195") : "矩形：拖出對角線"; },
  get ellipse() { return globalThis.I18N ? globalThis.I18N.t("text.194") : "橢圓：拖出外框"; },
  get erase() { return globalThis.I18N ? globalThis.I18N.t("text.193") : "橡皮擦：擦掉畫錯的地方"; },
  get fill() { return globalThis.I18N ? globalThis.I18N.t("text.192") : "油漆桶：點一下填滿封閉區域"; }
};

export function buildToolbar() {
  var tools = $('tool-list');
  tools.innerHTML = '';
  TOOL_ORDER.forEach(function (key) {
    var b = D.createElement('button');
    b.type = 'button';
    b.className = 'toolbtn';
    b.setAttribute('role', 'radio');
    b.setAttribute('data-tool', key);
    b.title = TOOL_TIP[key];
    b.setAttribute('aria-label', Rules.TOOLS[key].label);
    b.innerHTML = '<span class="ico">' + S.icon(TOOL_ICON[key]) + '</span>';
    b.addEventListener('click', function () { chooseTool(key); });
    tools.appendChild(b);
  });

  var colors = $('color-list');
  colors.innerHTML = '';
  Rules.COLORS.forEach(function (hex, i) {
    var b = D.createElement('button');
    b.type = 'button';
    b.className = 'colorbtn';
    b.setAttribute('role', 'radio');
    b.setAttribute('data-color-index', String(i));
    b.style.background = hex;
    b.setAttribute('aria-label', (globalThis.I18N ? globalThis.I18N.t("text.191") : "顏色 ") + (i + 1));
    b.title = (globalThis.I18N ? globalThis.I18N.t("text.191") : "顏色 ") + (i + 1);
    b.addEventListener('click', function () {
      app.paint.setColor(i); Store.color(i); Sound.play('click'); syncToolbar();
    });
    colors.appendChild(b);
  });

  var widths = $('width-list');
  widths.innerHTML = '';
  Rules.WIDTHS.forEach(function (px, i) {
    var b = D.createElement('button');
    b.type = 'button';
    b.className = 'widthbtn';
    b.setAttribute('role', 'radio');
    b.setAttribute('data-width-index', String(i));
    b.setAttribute('aria-label', (globalThis.I18N ? globalThis.I18N.t("text.190") : "筆寬 ") + (i + 1));
    b.title = (globalThis.I18N ? globalThis.I18N.t("text.190") : "筆寬 ") + (i + 1);
    var dot = D.createElement('i');
    var size = Math.max(5, Math.round(px / 3.2));
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';
    b.appendChild(dot);
    b.addEventListener('click', function () {
      app.paint.setWidth(i); Store.width(i); Sound.play('click'); syncToolbar();
    });
    widths.appendChild(b);
  });

  $('opt-filled').addEventListener('change', function () {
    app.paint.setFilled(this.checked);
    $('fillbox').classList.toggle('on', this.checked);
  });
  $('b-undo').addEventListener('click', doUndo);
  $('b-redo').addEventListener('click', doRedo);
  $('b-clear').addEventListener('click', doClear);
  $('b-done').addEventListener('click', doDone);
  $('b-skip').addEventListener('click', doSkip);
  $('b-solo-save').addEventListener('click', saveSoloDrawing);
  $('b-solo-image').addEventListener('click', downloadSoloImage);
  $('b-solo-load').addEventListener('click', chooseSoloFile);
  $('b-solo-next').addEventListener('click', doSkip);
  $('b-solo-load-home').addEventListener('click', chooseSoloFile);
  $('solo-file-input').addEventListener('change', loadSoloFile);
  $('b-hint-1').addEventListener('click', doHint);
  $('b-hint-2').addEventListener('click', doHint);
  $('b-hint-3').addEventListener('click', doHint);
}

export function soloDrawingReady() {
  return app.mode === 'solo' && app.solo && app.solo.state.phase === 'drawing';
}

export function drawingFilename(extension) {
  return (globalThis.I18N ? globalThis.I18N.t("text.189") : "你畫我猜-") + Rules.word(app.solo.state).text + extension;
}

export function downloadBlob(blob, filename) {
  var url = URL.createObjectURL(blob);
  var link = D.createElement('a');
  link.href = url;
  link.download = filename;
  D.body.appendChild(link);
  link.click();
  link.remove();
  w.setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
}

export function saveSoloDrawing() {
  if (!soloDrawingReady()) return;
  var text = w.DrawingFile.encode(app.solo.state);
  Store.addRecentDrawing({ text: text, word: Rules.word(app.solo.state).text, at: Date.now() });
  downloadBlob(new Blob([text], { type: 'application/json;charset=utf-8' }), drawingFilename('.drawguess.json'));
  toast((globalThis.I18N ? globalThis.I18N.t("text.188") : "作品存檔已送出下載，可用「載入」繼續編輯。"), 'ok');
}

export function downloadSoloImage() {
  if (!soloDrawingReady()) return;
  var filename = drawingFilename('.png');
  app.paint.toBlob(function (blob) {
    if (!blob) { toast((globalThis.I18N ? globalThis.I18N.t("text.187") : "圖片匯出失敗，請再試一次。"), 'error'); return; }
    downloadBlob(blob, filename);
    toast((globalThis.I18N ? globalThis.I18N.t("text.186") : "PNG 圖片已送出下載。"), 'ok');
  });
}

export function chooseSoloFile() {
  if (app.screen !== 's-solo' && !soloDrawingReady()) return;
  var input = $('solo-file-input');
  input.value = '';
  input.click();
}

export function loadSoloFile() {
  var file = this.files && this.files[0];
  if (!file) return;
  var screen = app.screen, solo = app.solo;
  if (screen !== 's-solo' && !soloDrawingReady()) return;
  var reader = new FileReader();
  reader.onerror = function () { toast((globalThis.I18N ? globalThis.I18N.t("text.185") : "讀取檔案失敗，請再試一次。"), 'error'); };
  reader.onload = function () {
    if (app.screen !== screen || app.solo !== solo) return;
    var state;
    try { state = w.DrawingFile.decode(reader.result, { id: ME, get name() { return globalThis.I18N ? globalThis.I18N.t("text.166") : "你"; } }, Date.now()); }
    catch (e) { toast(e.message, 'error'); return; }
    var replace = function () { withWordPack(Store.wordLang(), replaceNow); };
    var replaceNow = function () {
      if (app.screen !== screen || app.solo !== solo) return;
      if (screen === 's-solo') startSolo();
      app.solo.state = state;
      app.solo.seed = state.seed;
      app.paint.setStrokes(state.strokes);
      app.paint.clearRedo();
      soloRefresh();
      toast((globalThis.I18N ? globalThis.I18N.t("text.184") : "作品已載入，可以繼續畫。"), 'ok');
    };
    if (screen === 's-game' && solo.state.strokes.length) {
      askConfirm({
        get title() { return globalThis.I18N ? globalThis.I18N.t("text.183") : "載入作品？"; },
        get text() { return globalThis.I18N ? globalThis.I18N.t("text.182") : "載入會取代目前畫布。尚未存檔的筆畫會被取代，請先存檔再載入。"; },
        get ok() { return globalThis.I18N ? globalThis.I18N.t("text.181") : "載入作品"; }, get cancel() { return globalThis.I18N ? globalThis.I18N.t("text.180") : "保留目前作品"; }
      }, replace);
    } else replace();
  };
  reader.readAsText(file, 'UTF-8');
}

export function chooseTool(key) {
  app.paint.setTool(key);
  Store.tool(key);
  Sound.play('click');
  toolHint(TOOL_TIP[key]);
  syncToolbar();
}

/** 「畫完了」按過就不再重複；「跳過這題」只有畫家能按 */
export function syncDoneButtons() {
  var done = $('b-done'), skip = $('b-skip');
  if (!done || !skip) return;
  var v = app.view, g = v && v.game;
  var drawing = !!(g && g.phase === 'drawing' && g.you.isDrawer);
  /* 單機自己練習只有你一個人，沒有其他人可以通知，「畫完了」這顆鈕整個用不到，
     改用作品操作列裡的「換題」換下一題。 */
  if (app.mode === 'solo') {
    done.hidden = true;
    skip.disabled = !drawing;
    $('b-solo-next').disabled = !drawing;
    return;
  }
  /* 線上房間：這顆鈕只要輪到你畫就一直能按，按過也不鎖、不改字 ——
     補了幾筆想再叫大家看一次是很自然的事，伺服器那邊同樣不擋重複。 */
  done.hidden = false;
  done.disabled = !drawing;
  var lbl = done.querySelector('.b3-lbl') || done;
  lbl.textContent = (globalThis.I18N ? globalThis.I18N.t("text.179") : "畫完了");
  skip.disabled = !drawing;
}

export function syncToolbar() {
  var cur = app.paint ? app.paint.getTool() : 'pen';
  var list = $('tool-list').querySelectorAll('.toolbtn');
  for (var i = 0; i < list.length; i++) {
    list[i].setAttribute('aria-checked', String(list[i].getAttribute('data-tool') === cur));
  }
  var ci = app.paint ? app.paint.getColor() : 0;
  var cs = $('color-list').querySelectorAll('.colorbtn');
  for (var j = 0; j < cs.length; j++) {
    cs[j].setAttribute('aria-checked', String(Number(cs[j].getAttribute('data-color-index')) === ci));
  }
  var wi = app.paint ? app.paint.getWidth() : 1;
  var ws = $('width-list').querySelectorAll('.widthbtn');
  for (var k = 0; k < ws.length; k++) {
    ws[k].setAttribute('aria-checked', String(Number(ws[k].getAttribute('data-width-index')) === wi));
  }
  var shape = cur === 'rect' || cur === 'ellipse';
  $('fillbox').style.display = shape ? '' : 'none';
  $('b-redo').disabled = !app.paint || app.paint.redoCount() === 0;
  syncDoneButtons();
}

export function doUndo() {
  if (app.mode === 'solo') {
    var r = Rules.undoStroke(app.solo.state, ME);
    if (!r.ok) { toolHint(r.error, 'error'); Sound.play('blocked'); return; }
    app.paint.pushRedo(r.removed);
    app.paint.setStrokes(app.solo.state.strokes);
    Sound.play('undo');
    soloRefresh();
    syncToolbar();
    return;
  }
  var list = app.paint.strokes();
  if (list.length) app.paint.pushRedo(list[list.length - 1]);
  w.Online.send('room:undo', {});
  Sound.play('undo');
  syncToolbar();
}

export function doRedo() {
  var st = app.paint.popRedo();
  if (!st) { toolHint((globalThis.I18N ? globalThis.I18N.t("text.178") : "沒有可以重做的筆畫了。")); return; }
  sendStroke({ t: st.t, c: st.c, w: st.w, f: st.f, p: st.p.slice() });
  Sound.play('shape');
  syncToolbar();
}

export function doClear() {
  if (app.mode === 'solo') {
    var r = Rules.clearBoard(app.solo.state, ME);
    if (!r.ok) { toolHint(r.error, 'error'); return; }
    app.paint.clearLocal();
    app.paint.clearRedo();
    Sound.play('clear');
    soloRefresh();
    return;
  }
  w.Online.send('room:clear', {});
  Sound.play('clear');
}

/* 三張提示依序給：字數 → 種類 → 一個字。按鈕只是送出「給下一張」。 */
export function doHint() {
  if (app.mode === 'solo') {
    var r = Rules.giveHint(app.solo.state, ME, Date.now());
    if (!r.ok) { toolHint(r.error, 'error'); Sound.play('blocked'); return; }
    noteHint(r);
    Sound.play('hint');
    soloRefresh();
    return;
  }
  w.Online.send('room:hint', {});
}

export function noteHint(r) {
  var text = r.step === 1 ? (globalThis.I18N ? globalThis.I18N.t("text.177") : "你給了提示：題目有 ") + r.mask.length + (globalThis.I18N ? globalThis.I18N.t("text.176") : " 個字。")
    : r.step === 2 ? (globalThis.I18N ? globalThis.I18N.t("text.175") : "你給了提示：題目的種類。")
      : (globalThis.I18N ? globalThis.I18N.t("text.174") : "你給了提示：") + r.mask;
  pushFeed({ kind: 'system', get from() { return globalThis.I18N ? globalThis.I18N.t("text.173") : "系統"; }, text: text, at: Date.now() });
}

/**
 * 「畫完了」：只是告訴其他人可以認真猜了 —— 這一題不會結束，
 * 時間照跑，畫家還可以繼續補筆畫。真的要結束是「跳過這題」。
 */
export function doDone() {
  /* 單機自己練習沒有其他人可以通知，這顆鈕在單機一律藏起來（見 syncDoneButtons），
     按鈕不存在自然點不到，這裡留一個保險：真的被呼叫到也什麼都不做。 */
  if (app.mode === 'solo') return;
  /* 想按幾次就按幾次：不鎖按鈕、不記「按過了」，每一次都送出去再廣播一次 */
  w.Online.send('room:done', {});
}

export function doSkip() {
  if (app.mode === 'solo') {
    var r = Rules.giveUp(app.solo.state, ME, Date.now());
    if (!r.ok) { toolHint(r.error, 'error'); return; }
    handleGameEvents([{ type: 'turnend', entry: r.entry }]);
    soloRefresh();
    return;
  }
  w.Online.send('room:skip', {});
}
