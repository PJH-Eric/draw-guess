/* ===== app/overlay.js — 疊層卡片：房間設定、選題、公布答案、結算 ===== */

import { $, D, ME, Rules, S, Sound, Store, app, esc, paintIcons, secsLeft, toast } from './core.js?v=8f46673fb4';
import { askLeaveRoom, makeModal, modals } from './modal.js?v=8f46673fb4';
import { categoryChoices, renderCategorySelect, renderWordLangSelect, wordLangLabel } from './menus.js?v=8f46673fb4';
import { soloRefresh, soloStep, startSolo } from './solo.js?v=8f46673fb4';
import { renderRecent } from './feed.js?v=8f46673fb4';
import { TOOL_TIP, syncDoneButtons, syncToolbar, toolHint } from './canvas.js?v=8f46673fb4';
import { PHASE_LABEL, moodOf } from './render.js?v=8f46673fb4';
import { copyText, newInvite, revokeInvite } from './game-settings.js?v=8f46673fb4';
import { enterOnlineRoom, leaveGame, lobbyModeKey, roomRuleChips, saveNick } from './lobby.js?v=8f46673fb4';
import { hideRelayUi, isRelayGame, relayAwardsHtml, relayCanDo, relayBarMode, relayOverlayHtml, relayPhaseLabel, relayToolsShown, relayVote, renderRelayAssist, renderRelayBanner } from './relay.js?v=8f46673fb4';
import { hideTelephoneUi, isTelephoneGame, renderTelephoneAssist, telephoneAwardsHtml, telephoneCanDo, telephoneOverlayAct, telephoneOverlayHtml, telephonePhaseLabel, telephoneRoleLabel, telephoneToolsShown } from './telephone.js?v=8f46673fb4';
import { bestDrawerHtml, ensureGallery, galleryHtml, openGalleryItem, reactionEmoji, resetGallery, retryGallery, revealThumbUrl } from './gallery.js?v=8f46673fb4';

var w = window;

/* ---------------------------------------------------- 疊層（overlay） */

export function renderOverlay() {
  var v = app.view, g = v.game;
  var wrap = $('stage-overlay'), card = $('overlay-card');
  var html = null;

  /* 規則下拉選單只在等待畫面才有意義：一離開等待畫面（開始對局、房間結束……）
     就把展開狀態清掉，不然下次回到等待畫面（例如再玩一局）會莫名其妙自動展開。 */
  if (!v.room || v.room.phase !== 'waiting') app.ruleMenuOpen = null;

  if (v.room && v.room.closed) {
    html = ("<h3>" + esc(I18N.t("text.144")) + "</h3><p>") + esc(w.I18N.message(v.room.closedReason) || (globalThis.I18N ? globalThis.I18N.t("text.143") : "房間裡已經沒有玩家了。")) + '</p>' +
      ("<div class=\"overlay-btns\"><button class=\"btn3d\" data-color=\"grape\" data-act=\"lobby\">" + esc(I18N.t("text.142")) + "</button>") +
      ("<button class=\"btn3d small\" data-color=\"cream\" data-act=\"home\">" + esc(I18N.t("text.141")) + "</button></div>");
  } else if (v.room && v.room.phase === 'waiting') {
    html = roomSetupHtml(v);
  } else if (isRelayGame(g) && g.phase !== 'over') {
    /* 接力：投票、倒數、公布答案用卡片；作畫與換棒緩衝不蓋住畫布 */
    html = relayOverlayHtml(v, g);
  } else if (isTelephoneGame(g) && g.phase !== 'over') {
    /* 畫圖傳話：挑題、換手、等別人、揭曉用卡片；輪到自己畫或猜時不蓋住畫布 */
    html = telephoneOverlayHtml(v, g);
  } else if (g && g.phase === 'picking') {
    html = pickingHtml(v, g);
  } else if (g && g.phase === 'reveal') {
    html = revealHtml(g);
  } else if (g && g.phase === 'over') {
    ensureGallery(g);
    html = overHtml(v, g);
  }
  if (!(g && g.phase === 'over') || (v.room && v.room.closed)) resetGallery();

  /* 房間設定卡比其他卡大得多：寬螢幕要改兩欄（.setup-card），而且它開著的時候
     提示訊息要改到上方出現，不然會蓋住卡片底部的「準備／開始」（body.setup-open）。 */
  var isSetup = !!html && !!v.room && !v.room.closed && v.room.phase === 'waiting';
  card.classList.toggle('setup-card', isSetup);
  card.classList.toggle('tp-flow-card', !!v.room && v.room.mode === 'telephone');
  card.classList.toggle('tp-reveal-card', !!html && !isSetup && !(v.room && v.room.closed) && isTelephoneGame(g) && g.phase === 'reveal');
  card.classList.toggle('relay-flow-card', !!v.room && v.room.mode === 'relay');
  D.body.classList.toggle('setup-open', isSetup);

  if (!html) {
    wrap.hidden = true;
    card.innerHTML = '';
    app.lastOverlayHtml = null;
    return;
  }
  wrap.hidden = false;
  /* 內容一樣就不重建 DOM：房間設定面板每秒都會收到投影，
     重建會把邀請連結輸入框的選取與按鈕焦點洗掉。 */
  if (html === app.lastOverlayHtml) return;
  app.lastOverlayHtml = html;
  /* 不再整張 innerHTML 重建，而是「就地更新」（morphOverlay）：只改有變的地方。
     以前別人一聊天、一按準備，整張卡就重建一次，聊天輸入框被換成新的元素：
     注音打到一半會中斷、游標跳到最後、iPhone 的鍵盤還會被收起來。
     現在輸入框、按鈕這些節點都會留著，只有文字或屬性真的變了才動。 */
  var list = card.querySelector('#chat-list');
  var stick = !list || (list.scrollHeight - list.scrollTop - list.clientHeight < 30);
  var tpl = D.createElement('div');
  tpl.innerHTML = html;
  morphChildren(card, tpl);
  S.decorateAll(card);
  paintIcons(card);
  countUpScores(card);
  afterOverlayRender(card, stick);
}

/* ---------------------------------------------------- 卡片就地更新 */

/** 兩個節點算不算「同一個東西」：同標籤、同 id、同 data-act／data-field（按鈕的身分） */
export function sameKind(a, b) {
  if (a.nodeType !== b.nodeType) return false;
  if (a.nodeType !== 1) return true;
  if (a.tagName !== b.tagName) return false;
  return (a.id || '') === (b.id || '') &&
    (a.getAttribute('data-act') || '') === (b.getAttribute('data-act') || '') &&
    (a.getAttribute('data-field') || '') === (b.getAttribute('data-field') || '');
}

/* 這幾個屬性是畫面自己加上去的（立體按鈕、圖示），新的 HTML 裡本來就沒有，不能被清掉 */
export var MORPH_KEEP = { 'data-b3': 1, 'data-ico-done': 1, 'data-counted': 1 };

export function syncAttrs(o, n) {
  for (var i = o.attributes.length - 1; i >= 0; i--) {
    var name = o.attributes[i].name;
    if (!MORPH_KEEP[name] && !n.hasAttribute(name)) o.removeAttribute(name);
  }
  for (var j = 0; j < n.attributes.length; j++) {
    var a = n.attributes[j];
    var val = (a.name === 'class' && o.classList && o.classList.contains('press')) ? a.value + ' press' : a.value;
    if (o.getAttribute(a.name) !== val) o.setAttribute(a.name, val);
  }
}

export function morphNode(o, n) {
  if (o.nodeType !== 1) { if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue; return; }
  var colorBefore = o.getAttribute('data-color');
  var icoBefore = o.getAttribute('data-ico');
  syncAttrs(o, n);
  /* 已經裝飾過的立體按鈕：裡面是 svgui 畫的外框＋標籤，只換標籤文字，換色就請它重畫 */
  if (o.getAttribute('data-b3')) {
    var lbl = o.querySelector('.b3-lbl');
    if (lbl && lbl.innerHTML !== n.innerHTML) lbl.innerHTML = n.innerHTML;
    if (o.getAttribute('data-color') !== colorBefore) S.setColor(o, o.getAttribute('data-color'));
    return;
  }
  if (o.getAttribute('data-ico-done') && icoBefore === o.getAttribute('data-ico')) return;
  if (o.getAttribute('data-ico-done')) o.removeAttribute('data-ico-done');
  if (o.tagName === 'INPUT' || o.tagName === 'TEXTAREA') {
    /* 唯讀的（邀請網址）跟著新值換；使用者正在打的字（聊天）完全不動 */
    if (o.readOnly && o.value !== n.value) o.value = n.value;
    return;
  }
  morphChildren(o, n);
}

export function morphChildren(o, n) {
  var oldKids = Array.prototype.slice.call(o.childNodes);
  var newKids = Array.prototype.slice.call(n.childNodes);
  for (var i = 0; i < newKids.length; i++) {
    var nk = newKids[i], ok = oldKids[i];
    if (!ok) o.appendChild(nk);
    else if (sameKind(ok, nk)) morphNode(ok, nk);
    else o.replaceChild(nk, ok);
  }
  for (var k = newKids.length; k < oldKids.length; k++) o.removeChild(oldKids[k]);
}

/** 卡片更新完之後：聊天捲到最新、帶回打到一半的字、規則下拉選單的焦點 */
export function afterOverlayRender(card, stick) {
  var list = card.querySelector('#chat-list');
  if (list && stick) list.scrollTop = list.scrollHeight;
  var ci = card.querySelector('#chat-input');
  if (ci && !ci.value && app.chatDraft && D.activeElement !== ci) ci.value = app.chatDraft;
  var f = app.ruleFocus;
  app.ruleFocus = null;
  if (f) {
    var el = f.target === 'opt'
      ? (card.querySelector('.ruledd-opt.on[data-field="' + f.field + '"]') || card.querySelector('.ruledd-opt[data-field="' + f.field + '"]'))
      : card.querySelector('.ruledd-btn[data-field="' + f.field + '"]');
    if (el) el.focus();
  }
}

/* 每人輪數／每題秒數／題目難度都用按鈕，不用滑桿：
   這張面板每次收到房間投影就會重畫，滑桿拖到一半會被打斷，按鈕不會。 */
export var ROUND_CHOICES = [1, 2, 3, 4, 5];
export var SEC_CHOICES = [60, 90, 120];
export var DIFF_CHOICES = [
  { v: 0, get label() { return globalThis.I18N ? globalThis.I18N.t("text.119") : "混合"; } }, { v: 1, get label() { return globalThis.I18N ? globalThis.I18N.t("text.140") : "簡單"; } },
  { v: 2, get label() { return globalThis.I18N ? globalThis.I18N.t("text.139") : "普通"; } }, { v: 3, get label() { return globalThis.I18N ? globalThis.I18N.t("text.138") : "困難"; } }
];
/* 接力房的兩個欄位：每人當猜題者幾次（1–5）、每棒秒數（7／12／17） */
export function guessRoundChoices() {
  return [1, 2, 3, 4, 5].map(function (n) { return { v: n, label: w.I18N.t('relay.opt.times', { n: n }) }; });
}
export function batonChoices() {
  var list = (w.RelayRules && w.RelayRules.CONST.BATON_SEC) || [7, 12, 17];
  return list.map(function (n) { return { v: n, label: w.I18N.t('relay.opt.sec', { n: n }) }; });
}

/* 畫圖傳話的三個欄位：每張畫秒數（30／45／60）、猜答案秒數（20／25／30）、輪次（1–3） */
export function tpDrawChoices() {
  var list = (w.TelephoneRules && w.TelephoneRules.CONST.DRAW_SEC) || [30, 45, 60];
  return list.map(function (n) { return { v: n, label: w.I18N.t('telephone.opt.sec', { n: n }) }; });
}
export function tpGuessChoices() {
  var list = (w.TelephoneRules && w.TelephoneRules.CONST.GUESS_SEC) || [20, 25, 30];
  return list.map(function (n) { return { v: n, label: w.I18N.t('telephone.opt.sec', { n: n }) }; });
}
export function tpRoundChoices() {
  return [1, 2, 3].map(function (n) { return { v: n, label: w.I18N.t('telephone.opt.rounds', { n: n }) }; });
}

export function chips(act, list, current) {
  return '<div class="chiprow">' + list.map(function (o) {
    var val = (o.v !== undefined ? o.v : o);
    var label = (o.label !== undefined ? o.label : o);
    return '<button type="button" class="pillbtn" role="radio" data-act="' + act + '" data-v="' + esc(val) + '"' +
      ' aria-checked="' + (String(val) === String(current) ? 'true' : 'false') + '">' + esc(label) + '</button>';
  }).join('') + '</div>';
}

/* 房間設定卡片裡的「遊戲規則」用下拉選單，三個欄位排在同一行（不是三行堆疊），
   卡片矮下來，等待畫面才擠得出空間放聊天室；一顆按鈕不管螢幕多窄都不會換行，
   不像一排五顆按鈕在手機上會被迫斷成兩行。
   刻意不用原生 <select>：原生選單的清單樣式交給瀏覽器／作業系統畫，跟卡通風的
   圓角、陰影、配色完全不搭（尤其桌機瀏覽器那種灰底方框）。這裡自己刻一顆按鈕
   （顯示目前值）＋按下展開的清單，全部用卡片本身的樣式畫，跟其他按鈕一致。
   開合狀態記在 app.ruleMenuOpen（哪個欄位在展開，同時只會開一個），
   這樣重畫時（收到房間投影）還是知道要不要保持展開，不會每次投影一來就自動關掉。
   點外面或按 Escape 會關閉，見 setupRuleMenuClose()。 */
export function ruleDropdown(field, list, current) {
  var cur = list.filter(function (o) { return String(o.v !== undefined ? o.v : o) === String(current); })[0];
  /* list 有兩種形狀：純數字（ROUND_CHOICES／SEC_CHOICES）或 {v,label}（DIFF_CHOICES），
     所以「目前顯示的字」跟下面 opts 那份 val/label 用同一個 fallback 邏輯：
     沒有 .label 就退回 .v，兩個都沒有（純數字的情況）才退回 cur 本身。 */
  var curLabel = current;
  if (cur !== undefined) curLabel = (cur.label !== undefined ? cur.label : (cur.v !== undefined ? cur.v : cur));
  var open = app.ruleMenuOpen === field;
  var opts = list.map(function (o) {
    var val = (o.v !== undefined ? o.v : o);
    var label = (o.label !== undefined ? o.label : o);
    var on = String(val) === String(current);
    return '<button type="button" class="ruledd-opt' + (on ? ' on' : '') + '" role="option" aria-selected="' +
      (on ? 'true' : 'false') + '" data-act="rule-opt" data-field="' + esc(field) + '" data-v="' + esc(val) + '">' +
      esc(label) + (on ? '<span class="ruledd-check" aria-hidden="true">✓</span>' : '') + '</button>';
  }).join('');
  return '<div class="ruledd' + (open ? ' open' : '') + '">' +
    '<button type="button" class="ruledd-btn" data-act="rule-toggle" data-field="' + esc(field) + '" ' +
    'aria-haspopup="listbox" aria-expanded="' + (open ? 'true' : 'false') + '">' +
    '<span class="ruledd-val">' + esc(curLabel) + '</span>' +
    '<span class="ruledd-arrow" aria-hidden="true"></span></button>' +
    (open ? '<div class="ruledd-list" role="listbox">' + opts + '</div>' : '') +
    '</div>';
}

/** 開房彈窗的規則欄位：跟房間設定卡同一組選項，同樣是下拉（dropdowns.js 會把 select 換成自訂清單） */
export function fillSelect(id, list, current) {
  var html = list.map(function (o) {
    var val = (o.v !== undefined ? o.v : o);
    var label = (o.label !== undefined ? o.label : o);
    return '<option value="' + esc(val) + '"' + (String(val) === String(current) ? ' selected' : '') + '>' + esc(label) + '</option>';
  }).join('');
  var el = $(id);
  if (el.getAttribute('data-sig') !== html) { el.innerHTML = html; el.setAttribute('data-sig', html); }
  el.value = String(current);
}

export function renderRoomCreateOptions() {
  var c = app.roomCreate;
  renderCategorySelect('room-create-category', c.category || '');
  renderWordLangSelect('room-create-wordlang', c.wordLang);
  $('lobby-room-name').value = c.roomName;
  $('room-create-private').checked = c.private;
  fillSelect('room-create-rounds', ROUND_CHOICES, c.rounds);
  fillSelect('room-create-drawsec', SEC_CHOICES, c.drawSec);
  fillSelect('room-create-guessrounds', guessRoundChoices(), c.guessRounds || 1);
  fillSelect('room-create-baton', batonChoices(), c.batonSec || 12);
  fillSelect('room-create-tpdraw', tpDrawChoices(), c.tpDrawSec || 45);
  fillSelect('room-create-tpguess', tpGuessChoices(), c.tpGuessSec || 25);
  fillSelect('room-create-tprounds', tpRoundChoices(), c.tpRounds || 1);
  fillSelect('room-create-diff', DIFF_CHOICES, c.diff);
  /* 一般房、接力房與畫圖傳話房共用同一個彈窗：只顯示這個模式用得到的欄位 */
  var mode = c.mode === 'relay' || c.mode === 'telephone' ? c.mode : 'classic';
  $('room-create-panel').dataset.mode = mode;
  var only = D.querySelectorAll('#room-create-modal .classic-only, #room-create-modal .relay-only, #room-create-modal .telephone-only');
  for (var i = 0; i < only.length; i++) {
    only[i].hidden = !only[i].classList.contains(mode + '-only');
  }
  var titleKey = { relay: 'relay.createTitle', telephone: 'telephone.createTitle' }[mode] || 'text.374';
  var title = $('room-create-title').querySelector('[data-i18n]');
  title.setAttribute('data-i18n', titleKey);
  title.textContent = w.I18N.t(titleKey);
}

export function setupRoomCreate() {
  $('room-create-private').addEventListener('change', function () { app.roomCreate.private = this.checked; });
  $('room-create-category').addEventListener('change', function () { app.roomCreate.category = this.value; });
  $('room-create-wordlang').addEventListener('change', function () {
    app.roomCreate.wordLang = Store.wordLang(this.value);
    if (w.LazyPacks) w.LazyPacks.words(this.value);
  });
  modals.roomCreate = makeModal('room-create-modal', 'room-create-panel', 'b-lobby-host');
  $('room-create-close').addEventListener('click', function () { modals.roomCreate.close(); });
  $('room-create-cancel').addEventListener('click', function () { modals.roomCreate.close(); });
  var back = D.querySelector('[data-room-create-close]');
  if (back) back.addEventListener('click', function () { modals.roomCreate.close(); });

  $('room-create-rounds').addEventListener('change', function () { app.roomCreate.rounds = Number(this.value); });
  $('room-create-drawsec').addEventListener('change', function () { app.roomCreate.drawSec = Number(this.value); });
  $('room-create-diff').addEventListener('change', function () { app.roomCreate.diff = Number(this.value); });
  $('room-create-guessrounds').addEventListener('change', function () { app.roomCreate.guessRounds = Number(this.value); });
  $('room-create-baton').addEventListener('change', function () { app.roomCreate.batonSec = Number(this.value); });
  $('room-create-tpdraw').addEventListener('change', function () { app.roomCreate.tpDrawSec = Number(this.value); });
  $('room-create-tpguess').addEventListener('change', function () { app.roomCreate.tpGuessSec = Number(this.value); });
  $('room-create-tprounds').addEventListener('change', function () { app.roomCreate.tpRounds = Number(this.value); });

  $('lobby-room-name').addEventListener('input', function () {
    app.roomCreate.roomName = this.value.slice(0, 24);
  });
  $('room-create-submit').addEventListener('click', createRoomFromSettings);
}

export function openRoomCreate() {
  app.roomCreate = {
    private: false,
    roomName: (Store.nick() || (globalThis.I18N ? globalThis.I18N.t("text.137") : "大家")) + (globalThis.I18N ? globalThis.I18N.t("text.136") : " 的房間"),
    rounds: 2,
    drawSec: 90,
    diff: 0,
    category: '',
    wordLang: Store.wordLang(),
    mode: lobbyModeKey(),
    guessRounds: 1,
    batonSec: 12,
    tpDrawSec: 45,
    tpGuessSec: 25,
    tpRounds: 1
  };
  renderRoomCreateOptions();
  modals.roomCreate.open();
}

export function createRoomFromSettings() {
  var c = app.roomCreate;
  var roomName = $('lobby-room-name').value.trim().slice(0, 24) || (globalThis.I18N ? globalThis.I18N.t("text.135") : "畫畫小房間");
  c.roomName = roomName;
  saveNick($('lobby-nick'));
  $('room-create-submit').disabled = true;
  var relay = c.mode === 'relay', telephone = c.mode === 'telephone';
  var settings = relay
    ? { wordLang: c.wordLang || Store.wordLang(), guessRounds: c.guessRounds || 1, batonSec: c.batonSec || 12, diff: c.diff, category: c.category || '' }
    : telephone
      ? { wordLang: c.wordLang || Store.wordLang(), drawSec: c.tpDrawSec || 45, guessSec: c.tpGuessSec || 25, rounds: c.tpRounds || 1, diff: c.diff, category: c.category || '' }
      : { wordLang: c.wordLang || Store.wordLang(), rounds: c.rounds, drawSec: c.drawSec, diff: c.diff, category: c.category || '' };
  w.Online.send('room:create', {
    name: Store.ensureNick(),
    roomName: roomName,
    private: c.private,
    mode: relay ? 'relay' : (telephone ? 'telephone' : 'classic'),
    settings: settings
  }, function (res) {
    $('room-create-submit').disabled = false;
    if (!res || !res.ok) return toast((res && w.I18N.message(res.error, res.params)) || (globalThis.I18N ? globalThis.I18N.t("text.134") : "開房失敗。"), 'error');
    modals.roomCreate.close();
    enterOnlineRoom(res.code);
  });
}

/** 房間設定：房主在這裡調規則、產生邀請連結；線上房間只有真人，沒有電腦對手 */
/** 聊天室區塊（等待畫面、結算畫面共用）。輸入框刻意不帶 value：它的內容交給使用者，
    卡片就地更新時不會去動它（打到一半的字另外存在 app.chatDraft）。 */
export function chatBlockHtml(v) {
  if (!v.you || !v.you.can.chat) return '';
  var chatMsgs = (v.room.chat || []).map(function (c) {
    var mine = c.fromId === v.you.id;
    return '<li class="chatmsg' + (mine ? ' mine' : '') + '">' +
      '<b class="chatfrom">' + esc(c.from) + '</b>' +
      '<span class="chattext">' + esc(c.text) + '</span></li>';
  }).join('');
  return ("<div class=\"setupblock chatblock\"><h4>" + esc(I18N.t("text.133")) + "</h4>") +
    '<ol class="chatlist" id="chat-list">' +
    (chatMsgs || '<li class="chatempty">' + (v.room.phase === 'finished' ? (globalThis.I18N ? globalThis.I18N.t("text.132") : "聊聊剛剛那一局吧！") : (globalThis.I18N ? globalThis.I18N.t("text.131") : "開始之前先聊聊吧！")) + '</li>') + '</ol>' +
    ("<div class=\"chatrow\"><label class=\"sr-only\" for=\"chat-input\">" + esc(I18N.t("text.130")) + "</label>") +
    ("<input id=\"chat-input\" maxlength=\"200\" autocomplete=\"off\" enterkeyhint=\"send\" placeholder=\"" + esc(I18N.t("text.129")) + "\">") +
    ("<button type=\"button\" class=\"btn3d small\" data-color=\"sky\" data-act=\"chat-send\">" + esc(I18N.t("text.128")) + "</button></div></div>");
}

export function roomSetupHtml(v) {
  var r = v.room;
  var seats = '';
  for (var i = 0; i < r.members.length; i++) {
    var m = r.members[i];
    if (m.role !== 'player') continue;
    seats += '<div class="seatrow' + (m.ready ? ' ready' : '') + '">' +
      '<span class="sface" aria-hidden="true">' + S.face(i, m.ready ? 'happy' : 'idle') + '</span>' +
      '<span class="seatname">' + esc(m.name) + (m.host ? (globalThis.I18N ? globalThis.I18N.t("text.127") : "（房主）") : '') + (m.ready ? ' ✓' : '') + '</span></div>';
  }
  var specs = r.members.filter(function (x) { return x.role === 'spectator'; });
  var host = v.you.can.setSettings;
  /* 還有幾個空位：用虛線小圓點畫出來，看得出還能再邀人 */
  var taken = r.members.filter(function (x) { return x.role === 'player'; }).length;
  var open = Math.max(0, (Number(r.settings.maxPlayers) || 0) - taken);
  var dots = '';
  for (var d = 0; d < Math.min(open, 7); d++) dots += '<i></i>';
  var openSeats = open ? '<div class="seatrow seat-open"><span class="seat-dots" aria-hidden="true">' + dots + '</span>' +
    '<span class="seatname">' + esc(w.I18N.t('room.openSeats', { n: open })) + '</span></div>' : '';
  /* 題目語系開房後就固定了：跟其他規則同一種欄位外觀，只是不能點 */
  var langField = '<div class="rule-field category-rule"><span>' + esc(w.I18N.t('wordlang.select')) + '</span>' +
    '<div class="ruledd-static" id="room-wordlang-note" title="' + esc(w.I18N.t('room.langLocked')) + '">' +
    '<span class="ruledd-val">' + esc(wordLangLabel(r.settings.wordLang)) + '</span>' +
    '<span class="ruledd-lock" aria-hidden="true">' + esc(w.I18N.t('room.langLocked')) + '</span></div></div>';

  /* ---- 遊戲規則 ---- */
  var rules;
  var relay = r.mode === 'relay';
  var telephone = r.mode === 'telephone';
  if (telephone) {
    /* 畫圖傳話房：每張畫秒數、猜答案秒數、輪次，再加題型與種類；下面一句話講清楚怎麼傳 */
    var tpNote = '<p class="setupnote tp-flow-note">' + esc(w.I18N.t('telephone.rulesNote')) + '</p>';
    rules = host
      ? '<div class="setupblock tp-setup-rules"><h4>' + esc(w.I18N.t('text.123')) + '</h4>' +
        '<div class="rules-row">' +
        '<div class="rule-field"><span>' + esc(w.I18N.t('telephone.field.drawSec')) + '</span>' + ruleDropdown('set-tpdraw', tpDrawChoices(), r.settings.drawSec) + '</div>' +
        '<div class="rule-field"><span>' + esc(w.I18N.t('telephone.field.guessSec')) + '</span>' + ruleDropdown('set-tpguess', tpGuessChoices(), r.settings.guessSec) + '</div>' +
        '<div class="rule-field"><span>' + esc(w.I18N.t('telephone.field.rounds')) + '</span>' + ruleDropdown('set-tprounds', tpRoundChoices(), r.settings.rounds) + '</div>' +
        '</div><div class="rules-row">' +
        '<div class="rule-field"><span>' + esc(w.I18N.t('text.124')) + '</span>' + ruleDropdown('set-diff', DIFF_CHOICES, r.settings.diff) + '</div>' +
        '<div class="rule-field"><span>' + esc(w.I18N.t('category.select')) + '</span>' +
        ruleDropdown('set-category', categoryChoices(), r.settings.category || '') + '</div></div>' +
        langField + tpNote + '</div>'
      : '<div class="setupblock"><h4>' + esc(w.I18N.t('text.123')) + '</h4>' +
        '<div class="setup-rulechips" id="room-wordlang-note">' + roomRuleChips({
          mode: 'telephone', drawSec: r.settings.drawSec, guessSec: r.settings.guessSec, rounds: r.settings.rounds,
          diff: r.settings.diff, category: r.settings.category || '', wordLang: r.settings.wordLang
        }) + '</div>' + tpNote + '</div>';
  } else if (relay) {
    /* 接力房：猜題次數、每棒秒數、題型，再加種類；下面一句話講清楚怎麼玩 */
    var relayNote = '<p class="setupnote relay-rules-note">' + esc(w.I18N.t('relay.rulesNote')) + '</p>';
    rules = host
      ? '<div class="setupblock"><h4>' + esc(w.I18N.t('text.123')) + '</h4>' +
        '<div class="rules-row">' +
        '<div class="rule-field"><span>' + esc(w.I18N.t('relay.field.guessRounds')) + '</span>' + ruleDropdown('set-guessrounds', guessRoundChoices(), r.settings.guessRounds) + '</div>' +
        '<div class="rule-field"><span>' + esc(w.I18N.t('relay.field.baton')) + '</span>' + ruleDropdown('set-batonsec', batonChoices(), r.settings.batonSec) + '</div>' +
        '<div class="rule-field"><span>' + esc(w.I18N.t('text.124')) + '</span>' + ruleDropdown('set-diff', DIFF_CHOICES, r.settings.diff) + '</div>' +
        '</div><div class="rule-field category-rule"><span>' + esc(w.I18N.t('category.select')) + '</span>' +
        ruleDropdown('set-category', categoryChoices(), r.settings.category || '') + '</div>' +
        langField + relayNote + '</div>'
      : '<div class="setupblock"><h4>' + esc(w.I18N.t('text.123')) + '</h4>' +
        '<div class="setup-rulechips" id="room-wordlang-note">' + roomRuleChips({
          mode: 'relay', guessRounds: r.settings.guessRounds, batonSec: r.settings.batonSec, diff: r.settings.diff,
          category: r.settings.category || '', wordLang: r.settings.wordLang
        }) + '</div>' + relayNote + '</div>';
  } else if (host) {
    rules = ("<div class=\"setupblock\"><h4>" + esc(I18N.t("text.123")) + "</h4>") +
      '<div class="rules-row">' +
      ("<div class=\"rule-field\"><span>" + esc(I18N.t("text.126")) + "</span>") + ruleDropdown('set-rounds', ROUND_CHOICES, r.settings.rounds) + '</div>' +
      ("<div class=\"rule-field\"><span>" + esc(I18N.t("text.125")) + "</span>") + ruleDropdown('set-drawsec', SEC_CHOICES, r.settings.drawSec) + '</div>' +
      ("<div class=\"rule-field\"><span>" + esc(I18N.t("text.124")) + "</span>") + ruleDropdown('set-diff', DIFF_CHOICES, r.settings.diff) + '</div>' +
      '</div><div class="rule-field category-rule"><span>' + esc(w.I18N.t('category.select')) + '</span>' +
      ruleDropdown('set-category', categoryChoices(), r.settings.category || '') + '</div>' +
      langField + '</div>';
  } else {
    /* 不是房主：規則只能看，用跟大廳房間卡片同一種 chip 列出來 */
    rules = '<div class="setupblock"><h4>' + esc(w.I18N.t('text.123')) + '</h4>' +
      '<div class="setup-rulechips" id="room-wordlang-note">' + roomRuleChips({
        rounds: r.settings.rounds, drawSec: r.settings.drawSec, diff: r.settings.diff,
        category: r.settings.category || '', wordLang: r.settings.wordLang
      }) + '</div></div>';
  }

  /* ---- 邀請連結 ----
     以前這裡讓房主先選好對方的身分（一定是玩家／一定是觀戰），但那是房主在幫對方做決定。
     身分應該讓被邀請的人自己選，所以連結本身不綁身分（一律是 'any'），對方點連結後
     在大廳落地頁自己按「加入當玩家」或「加入觀戰」（見 checkPendingInvite／setupLobby）。 */
  /* 網址欄跟三顆按鈕排在同一行（以前網址一行、按鈕一行、說明兩行），說明也縮成一行，
     這一區矮下來。 */
  var invite = '';
  if (v.you.can.invite) {
    var has = !!app.inviteUrl;
    invite = '<div class="setupblock"><h4>' + esc(w.I18N.t('text.117')) + '</h4>' +
      '<div class="inviterow"><label class="sr-only" for="invite-url">' + esc(w.I18N.t('text.116')) + '</label>' +
      /* 網址自己佔一行、可以折行，整串都看得到（以前跟三顆按鈕擠同一行，只露出前面十幾個字） */
      '<textarea id="invite-url" readonly rows="2" spellcheck="false" placeholder="' + esc(w.I18N.t('text.115')) + '">' + esc(app.inviteUrl) + '</textarea>' +
      '<div class="invite-btns">' +
      '<button type="button" class="pillbtn' + (has ? '' : ' primary') + '" data-act="invite-new">' + esc(w.I18N.t('text.114')) + '</button>' +
      /* 只在觸控裝置用系統分享面板取代「複製」：桌機的分享視窗反而比複製麻煩 */
      (w.navigator && w.navigator.share && w.matchMedia && w.matchMedia('(pointer:coarse)').matches
        ? '<button type="button" class="pillbtn' + (has ? ' primary' : '') + '" data-act="invite-share"' + (has ? '' : ' disabled') + '>' + esc(w.I18N.t('invite.share')) + '</button>'
        : '<button type="button" class="pillbtn' + (has ? ' primary' : '') + '" data-act="invite-copy"' + (has ? '' : ' disabled') + '>' + esc(w.I18N.t('text.113')) + '</button>') +
      '<button type="button" class="pillbtn" data-act="invite-revoke"' + (app.inviteToken ? '' : ' disabled') + '>' + esc(w.I18N.t('text.112')) + '</button>' +
      '</div></div>' +
      '<p class="setupnote">' + esc(w.I18N.t('text.111')) + '</p></div>';
  }

  /* ---- 聊天室 ----
     刻意放在「邀請朋友」下面：只在等待畫面（跟結算畫面）才有，開始對局後 v.you.can.chat 就是 false，
     聊天室也就跟著收起來。 */
  var chatHtml = chatBlockHtml(v);

  /* ---- 主要按鈕 ----
     每個人只有一顆主要按鈕：房主是「開始！」（房主不用另外按準備，按開始就代表他準備好了，
     伺服器 canStart 也不等房主）、其他玩家是「準備好了」、觀戰者是「下場一起玩」。
     「改成觀戰」「離開房間」是次要動作，縮小一號（.sub）排在後面，手機上才排得進一行。 */
  var btns = '';
  if (v.you.isHost) {
    btns += '<button class="btn3d" data-color="grape" data-act="start"' +
      (v.you.can.start ? '' : ' disabled') + (">" + esc(I18N.t("text.110")) + "</button>");
  } else if (v.you.role === 'player') {
    btns += '<button class="btn3d" data-color="' + (v.you.ready ? 'lemon' : 'mint') + '" data-act="ready">' +
      (v.you.ready ? (globalThis.I18N ? globalThis.I18N.t("text.109") : "取消準備") : (globalThis.I18N ? globalThis.I18N.t("text.108") : "準備好了 ✓")) + '</button>';
  }
  if (v.you.can.becomePlayer) btns += ("<button class=\"btn3d\" data-color=\"mint\" data-act=\"become-player\">" + esc(I18N.t("text.107")) + "</button>");
  if (v.you.can.becomeSpectator) btns += ("<button class=\"btn3d small sub\" data-color=\"cream\" data-act=\"become-spectator\">" + esc(I18N.t("text.106")) + "</button>");
  /* 進來之後要走得掉：房主退出會把房主交給下一位，最後一個人退出房間就關掉 */
  btns += '<button class="btn3d small sub" data-color="peach" data-act="leave-room">' +
    (v.you.isHost ? (globalThis.I18N ? globalThis.I18N.t("text.105") : "退出房間") : (globalThis.I18N ? globalThis.I18N.t("text.104") : "離開房間")) + '</button>';
  var blockedBy = v.you.can.startBlockedBy;
  var blockedMessage = blockedBy
    ? (globalThis.I18N
      ? globalThis.I18N.message(blockedBy, v.you.can.startBlockedByParams)
      : blockedBy)
    : (globalThis.I18N ? globalThis.I18N.t("text.099") : "等房主按開始。");

  /* 房號跟「x / y 位玩家」以前各佔一行；席位卡本身就數得出人數，
     那行字拿掉、房號也縮小，卡片才有地方放下面新的聊天室。
     內容分成兩欄（.setup-col）：寬螢幕並排（左：房號、名單、規則；右：邀請、聊天室），
     一個畫面就看得完不用捲；窄螢幕兩欄上下接著排，跟以前一樣是一欄。 */
  var heading = ("<h3>" + esc(I18N.t("text.103")) +
    (relay ? ' <span class="relay-badge"><span class="ico" data-ico="relay" aria-hidden="true"></span>' + esc(w.I18N.t('relay.name')) + '</span>' : '') +
    (telephone ? ' <span class="relay-badge telephone-badge"><span class="ico" data-ico="telephone" aria-hidden="true"></span>' + esc(w.I18N.t('telephone.name')) + '</span>' : '') + "</h3>");
  var content = '<div class="setup-cols"><div class="setup-col">' +
    '<div class="roomcode"><b>' + esc(r.code) + '</b><span>' +
    esc(w.I18N.t(r.private ? 'room.privateInvite' : 'text.102')) + '</span></div>' +
    '<div class="seatlist">' + (seats || ("<div class=\"seatrow\">" + esc(I18N.t("text.101")) + "</div>")) +
    openSeats +
    (specs.length ? '<div class="seatrow spec"><span class="ico" data-ico="eye" aria-hidden="true"></span> ' + specs.length + (esc(I18N.t("text.100")) + "</div>") : '') + '</div>' +
    rules + '</div><div class="setup-col">' + invite + chatHtml + '</div></div>';
  var actions = (v.you.can.start ? '' : '<p class="setup-blocked">' + esc(blockedMessage) + '</p>') +
    '<div class="overlay-btns">' + btns + '</div>';
  return telephone
    ? heading + '<div class="tp-setup-body" id="tp-setup-body" tabindex="0">' + content + '</div>' +
      '<div class="tp-setup-actions">' + actions + '</div>'
    : heading + content + actions;
}

export function pickingHtml(v, g) {
  if (g.you.canPick && g.choices.length) {
    var cards = g.choices.map(function (c) {
      return '<button class="wordchoice" data-act="pick" data-word="' + esc(c.id) + '">' +
        '<b>' + esc(c.text) + '</b><span class="s">' + esc(c.catLabel) + '・' + esc(c.diffLabel) + '</span></button>';
    }).join('');
    return ("<h3>" + esc(I18N.t("text.098")) + "</h3>") + (g.unlimited
      ? ("<p>" + esc(I18N.t("text.097")) + "</p>")
      : '<p><b class="pick-secs">' + secsLeft(g.deadline) + ("</b>" + esc(I18N.t("text.096")) + "</p>")) +
      '<div class="wordchoices">' + cards + '</div>';
  }
  var drawer = drawerName(g);
  return '<h3>' + esc(drawer) + (esc(I18N.t("text.095")) + "</h3><p>" + esc(I18N.t("text.095.2")) + "</p>");
}

export function drawerName(g) {
  for (var i = 0; i < g.players.length; i++) if (g.players[i].isDrawer) return g.players[i].name;
  return (globalThis.I18N ? globalThis.I18N.t("text.094") : "畫家");
}

export function revealHtml(g) {
  var last = g.log.length ? g.log[g.log.length - 1] : null;
  var rows = '';
  if (last) {
    for (var i = 0; i < last.guessed.length; i++) {
      var gg = last.guessed[i];
      rows += '<li><span class="rface" aria-hidden="true">' + S.face(i, 'happy') + '</span>' +
        '<span class="rname">' + esc(gg.name) + '</span><span class="rpts">+' + gg.points + '</span></li>';
    }
    rows += '<li><span class="rface" aria-hidden="true">' + S.face(7, last.drawerPoints > 0 ? 'happy' : 'sad') + '</span>' +
      '<span class="rname">' + esc(last.drawerName) + (esc(I18N.t("text.093")) + "</span>") +
      '<span class="rpts">+' + last.drawerPoints + '</span></li>';
  }
  /* 單機練習只有自己：不用列「你（畫家）+0」這種比分，公布答案就好，
     想馬上畫下一題可以直接按「下一題」，不用等倒數。 */
  if (app.mode === 'solo') {
    return ("<h3>" + esc(I18N.t("text.089")) + "</h3><div class=\"revealword\">") + esc(g.answer || (last ? last.word : '—')) + '</div>' +
      ("<div class=\"overlay-btns\"><button class=\"btn3d\" data-color=\"mint\" data-act=\"solo-next\">" + esc(I18N.t("text.092")) + "</button></div>");
  }
  /* 單機自己練習沒有其他人猜題（total===0），不顯示「0 / 0 人猜中」；
     換下一位畫家的措辭在單機也怪（永遠是同一個你），改成「換下一題」。 */
  var subline = last ? (last.total > 0 ? (last.correct + ' / ' + last.total + (globalThis.I18N ? globalThis.I18N.t("text.091") : " 人猜中")) : (globalThis.I18N ? globalThis.I18N.t("text.090") : "練習完成")) : '';
  return ("<h3>" + esc(I18N.t("text.089")) + "</h3><div class=\"revealword\">") + esc(g.answer || (last ? last.word : '—')) + '</div>' +
    '<p>' + subline + '</p>' +
    '<ul class="resultlist">' + (rows || ("<li><span class=\"rname\">" + esc(I18N.t("text.088")) + "</span></li>")) + '</ul>' +
    reactionBarHtml(g) +
    '<p>' + (app.mode === 'solo' ? (globalThis.I18N ? globalThis.I18N.t("text.087") : "馬上出下一題…") : (globalThis.I18N ? globalThis.I18N.t("text.086") : "馬上換下一位畫家…")) + '</p>';
}

/* 結算的彩帶：純裝飾，位置與延遲用固定公式算（同一份 HTML 才不會每次重畫都變），
   開了「減少動態」就不放。 */
/** 公布答案時的表情列：玩家（非畫家）可以按，其他人只看數字 */
export function reactionBarHtml(g) {
  var r = g.reactions;
  if (app.mode !== 'online' || !r) return '';
  var note = r.canReact ? w.I18N.t('react.title') : w.I18N.t(g.you && g.you.isDrawer ? 'react.own' : 'react.watch');
  var btns = (Rules.REACTIONS || ['heart', 'laugh', 'clap']).map(function (k) {
    var on = r.mine.indexOf(k) >= 0;
    var label = w.I18N.t('react.' + k) + ' ' + r.counts[k];
    return '<button class="react-btn' + (on ? ' on' : '') + '" type="button" data-act="react" data-kind="' + k + '"' +
      ' aria-pressed="' + on + '" aria-label="' + esc(label) + '"' + (r.canReact ? '' : ' disabled') + '>' +
      '<span class="react-emoji" aria-hidden="true">' + reactionEmoji(k) + '</span>' +
      '<b class="react-count" aria-hidden="true">' + r.counts[k] + '</b></button>';
  }).join('');
  var thumb = revealThumbUrl(r.turnNo);
  return '<div class="react-bar" role="group" aria-label="' + esc(w.I18N.t('react.title')) + '">' +
    (thumb ? '<img class="react-thumb" src="' + thumb + '" alt="" width="240" height="240">' : '') +
    '<div class="react-side"><span class="react-note">' + esc(note) + '</span><div class="react-btns">' + btns + '</div></div></div>';
}

export function confettiHtml() {
  if (Store.reduceMotion()) return '';
  var colors = ['#FFE3A0', '#C9B6F5', '#A9E7D2', '#FFB8CF', '#AED9F5'];
  var out = '';
  for (var i = 0; i < 18; i++) {
    out += '<i style="left:' + ((i * 53 + 7) % 100) + '%;background:' + colors[i % colors.length] +
      ';animation-delay:' + ((i * 137) % 900) + 'ms;animation-duration:' + (1500 + (i * 211) % 900) + 'ms"></i>';
  }
  return '<div class="confetti" aria-hidden="true">' + out + '</div>';
}

/* 分數從 0 跳到最終值：每個數字只跑一次（data-counted 記著，卡片就地更新時不會重跑） */
export function countUpScores(card) {
  var list = card.querySelectorAll('.rscore[data-score]');
  for (var i = 0; i < list.length; i++) {
    (function (el) {
      if (el.getAttribute('data-counted')) return;
      el.setAttribute('data-counted', '1');
      var target = Number(el.getAttribute('data-score')) || 0;
      if (Store.reduceMotion() || target <= 0 || !w.requestAnimationFrame) { el.textContent = String(target); return; }
      var start = 0;
      var step = function (ts) {
        if (!start) start = ts;
        var k = Math.min(1, (ts - start) / 700);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1 && el.isConnected) w.requestAnimationFrame(step);
        else el.textContent = String(target);
      };
      w.requestAnimationFrame(step);
    }(list[i]));
  }
}

export function overHtml(v, g) {
  var sorted = g.players.slice().sort(function (a, b) { return b.score - a.score; });
  var rows = sorted.map(function (p) {
    var win = g.winners.indexOf(p.id) >= 0;
    var rank = 1;
    for (var j = 0; j < sorted.length; j++) if (sorted[j].score > p.score) rank += 1;
    return '<li class="result-row' + (win ? ' win' : '') + '">' +
      '<span class="rplace" aria-hidden="true">' + rank + '</span>' +
      '<span class="rface" aria-hidden="true">' + S.face(indexOfPlayer(g, p.id), win ? 'win' : 'sad') +
      (win ? '<span class="ico rcrown" data-ico="crown"></span>' : '') + '</span>' +
      '<span class="rname">' + esc(p.name) + '</span>' +
      '<span class="rpts"><b class="rscore" data-score="' + p.score + '">' + p.score + '</b>' + esc(w.I18N.t('result.unit')) + '</span></li>';
  }).join('');
  /* 線上：結算完由房主按「回房間」，大家回到等待畫面（可以聊天、改規則、重新準備）再開一局；
     不再是全員投票直接開新局（有一個人掛機就全部卡住）。單機維持「再玩一局」。 */
  /* 贏家放大擺在最上面：頭像、皇冠、名字（平手就並排） */
  var champs = sorted.filter(function (p) { return g.winners.indexOf(p.id) >= 0; });
  var hero = champs.length ? '<div class="result-hero"><div class="result-hero-faces">' + champs.map(function (p) {
    return '<span class="result-hero-face" aria-hidden="true">' + S.face(indexOfPlayer(g, p.id), 'win') +
      '<span class="ico hero-crown" data-ico="crown"></span></span>';
  }).join('') + '</div><b class="result-hero-name">' + esc(champs.map(function (p) { return p.name; }).join('、')) + '</b>' +
    '<span class="result-hero-tag">' + esc(w.I18N.t(champs.length > 1 ? 'result.tie' : 'result.winner')) + '</span></div>' : '';
  var btns = '';
  var note = '';
  if (app.mode === 'online') {
    /* 房主：主要動作是「再來一局」（同一批人、同樣規則直接開打），想改規則或等人就「回房間」 */
    if (v.you.can.rematch) btns += '<button class="btn3d" data-color="mint" data-act="online-rematch">' + esc(w.I18N.t('result.rematch')) + '</button>';
    if (v.you.can.returnToRoom) {
      btns += '<button class="btn3d' + (v.you.can.rematch ? ' small sub' : '') + '" data-color="' + (v.you.can.rematch ? 'sky' : 'mint') +
        '" data-act="return-room">' + esc(w.I18N.t('result.room')) + '</button>';
    } else note = '<p>' + esc(w.I18N.t('result.waitHost')) + '</p>';
    btns += '<button class="btn3d small sub" data-color="cream" data-act="lobby">' + esc(w.I18N.t('result.lobby')) + '</button>' +
      '<button class="btn3d small sub" data-color="cream" data-act="home">' + esc(w.I18N.t('result.home')) + '</button>';
  } else {
    if (v.you.can.rematch) btns += ("<button class=\"btn3d\" data-color=\"mint\" data-act=\"rematch\">" + esc(I18N.t("text.081")) + "</button>");
    btns += ("<button class=\"btn3d small\" data-color=\"cream\" data-act=\"home\">" + esc(I18N.t("text.080")) + "</button>");
  }
  var partyMode = isRelayGame(g) || isTelephoneGame(g);
  var standings = '<ol class="resultlist">' + rows + '</ol>';
  var awards = isRelayGame(g) ? relayAwardsHtml(g) : (isTelephoneGame(g) ? telephoneAwardsHtml(g) : bestDrawerHtml(g));
  var details = partyMode ? '<div class="party-result-details">' + standings + awards + '</div>' : awards + standings;
  return confettiHtml() + '<section data-result-share class="result-share-card' + (partyMode ? ' party-result' : '') + '">' +
    '<div class="result-heading"><h3>' + esc(I18N.t('text.079')) + '</h3><span>' + esc(I18N.t('text.079.2')) + '</span></div>' +
    hero + details + note + '</section>' +
    galleryHtml(g) +
    (app.mode === 'online' ? chatBlockHtml(v) : '') +
    /* 主要動作（再來一局）自己一列，其餘次要鈕在下一列平分寬度，不會落單一顆 */
    '<div class="overlay-btns result-btns">' + btns + '</div>';
}

export function indexOfPlayer(g, id) {
  for (var i = 0; i < g.players.length; i++) if (g.players[i].id === id) return i;
  return 0;
}

/* 卡片上的按鈕用「事件委派」：監聽器只在 init 掛一次在卡片本身，
   卡片內容就地更新（見 morphChildren）時不用重綁，也不會越綁越多。 */
export function setupOverlayEvents() {
  var card = $('overlay-card');
  card.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('button[data-act]') : null;
    if (!el || !card.contains(el) || el.disabled) return;
    onOverlayAct(el);
  });
  card.addEventListener('input', function (ev) {
    if (ev.target && ev.target.id === 'chat-input') app.chatDraft = ev.target.value;
  });
  card.addEventListener('keydown', function (ev) {
    var t = ev.target;
    if (!t) return;
    if (t.id === 'chat-input' && ev.key === 'Enter') {
      /* 注音／拼音選字時按的 Enter 是「確定這個字」，不是送出 */
      if (ev.isComposing || ev.keyCode === 229) return;
      ev.preventDefault();
      sendChatMessage();
      return;
    }
    ruleMenuKey(ev);
  });
}

/** 規則下拉選單的鍵盤操作：↓ 打開、↑↓ 在選項間移動、Home／End 跳到頭尾（Esc 見 setupRuleMenuClose） */
export function ruleMenuKey(ev) {
  var t = ev.target;
  var field = t.getAttribute && t.getAttribute('data-field');
  if (!field) return;
  if (t.classList.contains('ruledd-btn') && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
    ev.preventDefault();
    if (app.ruleMenuOpen !== field) {
      app.ruleMenuOpen = field;
      app.ruleFocus = { field: field, target: 'opt' };
      app.lastOverlayHtml = null;
      renderOverlay();
    }
    return;
  }
  if (!t.classList.contains('ruledd-opt')) return;
  var opts = Array.prototype.slice.call(t.parentNode.querySelectorAll('.ruledd-opt'));
  var i = opts.indexOf(t);
  var next = null;
  if (ev.key === 'ArrowDown') next = opts[Math.min(opts.length - 1, i + 1)];
  else if (ev.key === 'ArrowUp') next = opts[Math.max(0, i - 1)];
  else if (ev.key === 'Home') next = opts[0];
  else if (ev.key === 'End') next = opts[opts.length - 1];
  if (next) { ev.preventDefault(); next.focus(); }
}

export function onOverlayAct(el) {
  var act = el.getAttribute('data-act');
  Sound.play('click');
  if (act === 'pick') {
    var wid = el.getAttribute('data-word');
    if (app.mode === 'solo') {
      var r = Rules.pickWord(app.solo.state, ME, wid, Date.now());
      if (!r.ok) return toast(r.error, 'error');
      app.paint.clearLocal();
      soloRefresh();
    } else w.Online.send('room:pick', { wordId: wid });
  } else if (act === 'invite-new') newInvite();
  else if (act === 'invite-copy') copyText(app.inviteUrl);
  else if (act === 'invite-revoke') revokeInvite();
  else if (act === 'invite-share') {
    /* 手機上直接叫出系統的分享面板（LINE、訊息…）；使用者取消分享不算錯誤 */
    if (app.inviteUrl && w.navigator.share) {
      w.navigator.share({
        title: w.I18N.t('invite.shareTitle'),
        text: w.I18N.t('invite.shareText', { code: app.roomCode || '' }),
        url: app.inviteUrl
      }).catch(function () { /* 取消分享 */ });
    }
  }
  else if (act === 'ready') w.Online.send('room:ready', { ready: !app.view.you.ready });
  else if (act === 'start') w.Online.send('room:start', {});
  else if (act === 'become-player') w.Online.send('room:becomePlayer', {});
  else if (act === 'become-spectator') w.Online.send('room:becomeSpectator', {});
  else if (act === 'leave-room') askLeaveRoom();
  else if (act === 'settings') modals.game.open();
  else if (act === 'chat-send') sendChatMessage();
  else if (act === 'rematch') startSolo();
  else if (act === 'solo-next') {
    /* 公布答案的倒數直接歸零，下一次推進就換題 */
    if (app.mode === 'solo' && app.solo && app.solo.state.phase === 'reveal') { app.solo.state.deadline = Date.now(); soloStep(); }
  }
  else if (act === 'return-room') w.Online.send('room:return', {});
  else if (act === 'online-rematch') w.Online.send('room:rematch', {});
  else if (act === 'react') w.Online.send('room:react', { kind: el.getAttribute('data-kind') });
  else if (act === 'relay-vote') relayVote(el.getAttribute('data-word'));
  else if (act.indexOf('telephone-') === 0) { if (telephoneOverlayAct(act, el) === 'render') renderOverlay(); }
  else if (act === 'gallery-open') openGalleryItem(Number(el.getAttribute('data-i')));
  else if (act === 'gallery-retry') retryGallery();
  else if (act === 'lobby') leaveGame('s-lobby');
  else if (act === 'home') leaveGame('s-home');
  else if (act === 'rule-toggle') {
    var field = el.getAttribute('data-field');
    var opening = app.ruleMenuOpen !== field;
    app.ruleMenuOpen = opening ? field : null;
    /* 打開時焦點移到目前選中的那一項（鍵盤可以直接上下選），收起來就留在按鈕上 */
    app.ruleFocus = { field: field, target: opening ? 'opt' : 'btn' };
    app.lastOverlayHtml = null;
    renderOverlay();
  } else if (act === 'rule-opt') {
    var optField = el.getAttribute('data-field');
    var optValue = optField === 'set-category' ? el.getAttribute('data-v') : Number(el.getAttribute('data-v'));
    var key = optField === 'set-category' ? 'category' : optField === 'set-rounds' ? 'rounds' : optField === 'set-drawsec' ? 'drawSec' : optField === 'set-diff' ? 'diff'
      : optField === 'set-guessrounds' ? 'guessRounds' : optField === 'set-batonsec' ? 'batonSec'
      : optField === 'set-tpdraw' ? 'drawSec' : optField === 'set-tpguess' ? 'guessSec' : optField === 'set-tprounds' ? 'rounds' : null;
    if (key) {
      var payload = {};
      payload[key] = optValue;
      w.Online.send('room:settings', payload);
    }
    app.ruleMenuOpen = null;
    /* 選完焦點回到這個欄位的按鈕（以前選項被拿掉，焦點就掉到整頁最上面） */
    app.ruleFocus = { field: optField, target: 'btn' };
    app.lastOverlayHtml = null;
    renderOverlay();
  }
}

/** 送出聊天室訊息；空白的不送，送出後立刻清空輸入框（不等伺服器回應） */
export function sendChatMessage() {
  var input = $('chat-input');
  if (!input) return;
  var text = input.value.trim();
  if (!text) return;
  input.value = '';
  app.chatDraft = '';
  w.Online.send('room:chat', { text: text });
}

/* ------------------------------------------------ 工具列／猜題列切換 */

export function renderControls() {
  var v = app.view, g = v.game;
  if (!isTelephoneGame(g)) hideTelephoneUi();
  if (isRelayGame(g)) { renderRelayControls(v, g); return; }
  hideRelayUi();
  if (isTelephoneGame(g)) { renderTelephoneControls(v, g); return; }
  var canDraw = !!(g && v.you.can.draw);
  var canGuess = !!(g && v.you.can.guess);
  var spectator = v.you.role === 'spectator';

  /* 畫家（含選題階段）不需要猜題框，觀戰者也沒有 */
  var isDrawer = !!(g && g.you.isDrawer);
  $('toolbar').hidden = !canDraw;
  $('solo-file-actions').hidden = app.mode !== 'solo' || !canDraw;
  /* 沒有工具列的人（猜題者、觀戰者、還在選題的畫家）：橫向時右側那一欄收掉，
     畫布回到正中間，不然右邊會空著一整欄、畫布偏左。舞台有 ResizeObserver，畫布會自己重算。 */
  /* 單機永遠是自己在畫，選題那幾秒工具列暫時收著也不要收掉右欄：
     右欄上面還放著返回鈕跟題目，收掉的話返回鈕會被擠出畫面、畫布也會跳一下 */
  D.body.classList.toggle('no-tools', !canDraw && app.mode !== 'solo');
  placeCanvasTop();
  placeSoloActions();
  placeGuessFeed();
  $('guessbar').hidden = canDraw || isDrawer || spectator || !g ||
    g.phase === 'over' || (v.room && v.room.closed);

  if (app.paint) app.paint.setEnabled(canDraw);

  if (canDraw) {
    syncToolbar();
    if (!$('tool-hint').textContent) toolHint(TOOL_TIP[app.paint.getTool()]);
  }
  renderHintRow(g, canDraw);
  syncDoneButtons();
  syncGuessbarSpace();

  var input = $('guess-input');
  if (!$('guessbar').hidden) {
    var guessed = g && g.you.guessed;
    input.disabled = !canGuess;
    $('b-guess').disabled = !canGuess;
    input.placeholder = guessed ? (globalThis.I18N ? globalThis.I18N.t("text.078") : "你已經猜對了，等其他人…")
      : (g && g.phase === 'drawing' ? (globalThis.I18N ? globalThis.I18N.t("text.077") : "猜猜看這是什麼？") : (globalThis.I18N ? globalThis.I18N.t("text.076") : "等畫家開始畫…"));
  }
}

/**
 * 接力模式的操作列：
 *   正在畫的人（與換棒緩衝中的下一棒）有工具列；猜題者有猜題框、提示與放棄；
 *   其他畫家與觀戰者的底部框改成「畫家聊天」（猜題者看不到），沒在畫的畫家還有表情列。
 */
export function renderRelayControls(v, g) {
  var closed = !!(v.room && v.room.closed);
  var tools = !closed && relayToolsShown(g);
  var canDraw = !closed && !!v.you.can.draw;
  $('toolbar').hidden = !tools;
  $('solo-file-actions').hidden = true;
  D.body.classList.toggle('no-tools', !tools);
  placeCanvasTop();
  placeSoloActions();
  placeGuessFeed();
  if (app.paint) app.paint.setEnabled(canDraw);
  if (tools) {
    syncToolbar();
    if (!$('tool-hint').textContent) toolHint(TOOL_TIP[app.paint.getTool()]);
  }
  if (closed) { $('hintrow').hidden = true; } else renderRelayAssist(v, g);
  if (closed) hideRelayUi(); else renderRelayBanner(v, g);
  syncDoneButtons();

  var bar = $('guessbar'), input = $('guess-input'), btn = $('b-guess');
  var mode = closed ? null : relayBarMode(v, g);
  bar.hidden = !mode;
  if (mode) {
    var chat = mode === 'chat';
    var sig = mode + ':' + w.I18N.lang;
    if (bar.getAttribute('data-sig') !== sig) {
      if (bar.getAttribute('data-mode') !== mode) input.value = '';
      bar.setAttribute('data-mode', mode);
      bar.setAttribute('data-sig', sig);
      S.setLabel(btn, esc(w.I18N.t(chat ? 'text.128' : 'text.393')));
      S.setColor(btn, chat ? 'sky' : 'mint');
    }
    input.maxLength = chat ? 200 : 24;
    var canGuess = !!v.you.can.guess;
    input.disabled = chat ? false : !canGuess;
    btn.disabled = chat ? false : !canGuess;
    input.placeholder = chat ? w.I18N.t('relay.chat.placeholder')
      : w.I18N.t(canGuess ? 'relay.guess.placeholder' : 'relay.guess.wait');
  }
  syncGuessbarSpace();
}

/**
 * 畫圖傳話的操作列：
 *   輪到畫的人有工具列（「畫完了」改成「交出去」）；輪到猜的人有答案框、提示與偷看；其他人與觀戰者都沒有。
 */
export function renderTelephoneControls(v, g) {
  var closed = !!(v.room && v.room.closed) || g.phase === 'over';
  var tools = !closed && telephoneToolsShown(g);
  var canDraw = !closed && !!v.you.can.draw;
  $('toolbar').hidden = !tools;
  $('solo-file-actions').hidden = true;
  D.body.classList.toggle('no-tools', !tools);
  placeCanvasTop();
  placeSoloActions();
  placeGuessFeed();
  if (app.paint) app.paint.setEnabled(canDraw);
  if (tools) {
    syncToolbar();
    if (!$('tool-hint').textContent) toolHint(TOOL_TIP[app.paint.getTool()]);
  }
  if (closed) { $('hintrow').hidden = true; $('relay-cheers').hidden = true; $('b-relay-giveup').hidden = true; hideTelephoneUi(); }
  else renderTelephoneAssist(v, g);
  syncDoneButtons();

  var bar = $('guessbar'), input = $('guess-input'), btn = $('b-guess');
  /* 中間的人交出畫之後，同一個框拿來猜原本的題目（猜中前可以一直猜） */
  var mid = g.phase === 'step' && g.you.role === 'waiting' && g.you.midGuess;
  bar.hidden = closed || g.phase !== 'step' || (g.you.role !== 'guesser' && !mid);
  if (!bar.hidden) {
    var mode = mid ? 'midguess' : 'answer';
    var canAnswer = mid ? !!g.you.midGuess.can : !!v.you.can.answer;
    var sig = 'tp:' + mode + ':' + w.I18N.lang;
    if (bar.getAttribute('data-sig') !== sig) {
      if (bar.getAttribute('data-mode') !== mode) input.value = '';
      bar.setAttribute('data-mode', mode);
      bar.setAttribute('data-sig', sig);
      S.setLabel(btn, esc(w.I18N.t(mid ? 'telephone.mid.send' : 'telephone.answer.send')));
      S.setColor(btn, mid ? 'sky' : 'mint');
    }
    input.maxLength = (w.TelephoneRules && w.TelephoneRules.CONST.ANSWER_MAX) || 40;
    input.disabled = !canAnswer;
    btn.disabled = !canAnswer;
    input.placeholder = mid
      ? w.I18N.t(g.you.midGuess.hit ? 'telephone.mid.done' : 'telephone.mid.placeholder', { n: g.you.midGuess.points })
      : w.I18N.t(canAnswer ? 'telephone.answer.placeholder' : 'telephone.answer.wait');
    if (mid && g.you.midGuess.hit) input.value = '';
  } else if (bar.getAttribute('data-mode') === 'answer' || bar.getAttribute('data-mode') === 'midguess') {
    /* 交出答案或換人之後，下一次這個框給一般猜題用時要換回原本的字 */
    bar.removeAttribute('data-mode');
    bar.removeAttribute('data-sig');
    input.value = '';
    S.setLabel(btn, esc(w.I18N.t('text.393')));
  }
  syncGuessbarSpace();
}

/** 橫向的線上對局：玩家列與提示搬進右側那一欄的最上面（下面接工具列或猜題框）。
    抬頭少掉一整列、猜題框也不再橫跨底部，那些高度全部還給畫布（畫布右邊本來就有空位）。
    直向與單機放回抬頭原位。 */
export function placeCanvasTop() {
  var top = $('canvastop'), bar = $('playbar'), tools = $('toolbar');
  var head = D.querySelector('.game-head');
  if (!top || !bar || !tools || !head) return;
  var side = app.mode !== 'solo' &&
    w.matchMedia('(orientation:landscape) and (min-width:560px)').matches;
  D.body.classList.toggle('side-top', side);
  if (top.parentNode !== (side ? bar : head)) {
    if (side) bar.insertBefore(top, bar.firstChild); else head.appendChild(top);
  }
  var donebox = $('b-done').parentNode;
  var row = tools.querySelector('.toolrow-misc');
  var pinned = side && app.view && isTelephoneGame(app.view.game) && !$('b-done').hidden &&
    w.matchMedia('(max-height:560px)').matches;
  if (donebox.parentNode === (pinned ? bar : row)) return;
  if (pinned) bar.insertBefore(donebox, tools); else row.appendChild(donebox);
}

/** 猜題流的位置：橫向放在右欄（玩家列與猜題框之間）；
    直向搬進舞台，疊在畫布下方本來就空著的那一段（高度由 sizeCanvas 量的 --stage-gap 決定）。 */
export function placeGuessFeed() {
  var feed = $('guess-feed'), stage = $('stage'), bar = $('playbar'), guess = $('guessbar');
  if (!feed || !stage || !bar || !guess) return;
  var inStage = w.matchMedia('(orientation:portrait)').matches;
  if (feed.parentNode === (inStage ? stage : bar)) return;
  if (inStage) stage.appendChild(feed); else bar.insertBefore(feed, guess.nextSibling);
}

/** 平板直向的單機：畫布被高度卡住，而粗細／復原那一排右邊空著一大段。
    「存檔／下載圖片／載入／換題」搬進那一排的右邊（跟線上的「畫完了／跳過」同位置），
    少掉一整列，高度還給畫布。其他版面放回工具列底部。 */
export function placeSoloActions() {
  var acts = $('solo-file-actions'), tools = $('toolbar'), hint = $('tool-hint');
  var row = tools && tools.querySelector('.toolrow-misc');
  if (!acts || !tools || !row) return;
  var inline = app.mode === 'solo' &&
    w.matchMedia('(orientation:portrait) and (min-width:621px)').matches;
  if (acts.parentNode === (inline ? row : tools)) return;
  if (inline) row.appendChild(acts); else tools.insertBefore(acts, hint);
}

/** 猜題列是固定在遊戲主畫面正下方的浮層，把它的高度讓回給畫布（不然會蓋到） */
export function syncGuessbarSpace() {
  var bar = $('guessbar');
  var on = !bar.hidden;
  document.body.classList.toggle('has-guessbar', on);
  var h = on ? Math.ceil(bar.getBoundingClientRect().height) + 12 : 0;
  document.documentElement.style.setProperty('--guessbar-h', h + 'px');
}

/** 畫家的三個提示按鈕：已給的標起來、下一張可以按、單字題沒有第三張 */
export function renderHintRow(g, canDraw) {
  var row = $('hintrow');
  row.hidden = !canDraw;
  if (!canDraw || !g || !g.hint) return;
  var steps = g.hint.steps || [];
  for (var i = 0; i < 3; i++) {
    var b = $('b-hint-' + (i + 1));
    var st = steps[i] || { done: false, available: false, exists: false };
    b.disabled = !st.available;
    b.classList.toggle('done', !!st.done);
    b.hidden = !st.exists;
    b.setAttribute('aria-pressed', String(!!st.done));
  }
  $('hintrow-note').textContent = g.hint.step >= g.hint.total
    ? (g.hint.total < 3 ? (globalThis.I18N ? globalThis.I18N.t("text.075") : "單字題沒有「一個字」這張提示。") : (globalThis.I18N ? globalThis.I18N.t("text.074") : "提示都給完了。"))
    : (globalThis.I18N ? globalThis.I18N.t("text.073") : "按下去就公開給所有人，收不回來。");
}

/* ------------------------------------------------------ 左側摘要 */

export function renderAside() {
  var v = app.view, g = v.game;
  var relayRole = isRelayGame(g) && v.you.role !== 'spectator' ? w.I18N.t('relay.role.' + (g.you.role === 'spectator' ? 'painter' : g.you.role))
    : (isTelephoneGame(g) && v.you.role !== 'spectator' && g.phase !== 'over' ? telephoneRoleLabel(g.you.role) : '');
  var youRole = relayRole ? relayRole : v.you.role === 'spectator' ? (globalThis.I18N ? globalThis.I18N.t("text.036") : "觀戰者")
    : (g && g.you.isDrawer ? (globalThis.I18N ? globalThis.I18N.t("text.035") : "這一題的畫家") : (globalThis.I18N ? globalThis.I18N.t("text.072") : "猜題者"));

  $('sum-phase').textContent = (v.room && v.room.closed) ? (globalThis.I18N ? globalThis.I18N.t("text.071") : "房間已結束")
    : (v.room && v.room.phase === 'waiting' ? (globalThis.I18N ? globalThis.I18N.t("text.070") : "等待開始")
      : (g ? (isRelayGame(g) ? relayPhaseLabel(g.phase) : (isTelephoneGame(g) ? telephonePhaseLabel(g) : (PHASE_LABEL[g.phase] || g.phase))) : '—'));
  $('sum-drawer').textContent = g ? drawerName(g) : '—';
  $('sum-role').textContent = youRole;
  $('sum-can').textContent = canDoText(v, g);
  $('sum-hint').textContent = g && g.hint
    ? ((g.you.isDrawer || g.answer)
      ? (g.answer || '') + (g.hint.catLabel ? '（' + g.hint.catLabel + '）' : '')
      : (g.hint.lenShown ? g.hint.mask : (globalThis.I18N ? globalThis.I18N.t("text.069") : "畫家還沒給提示")) +
        (g.hint.catLabel ? '（' + g.hint.catLabel + '）' : ''))
    : '—';
  $('sum-conn').textContent = app.mode === 'solo' ? (globalThis.I18N ? globalThis.I18N.t("text.068") : "單機（不需要連線）")
    : ({ get connected() { return globalThis.I18N ? globalThis.I18N.t("text.067") : "已連線"; }, get connecting() { return globalThis.I18N ? globalThis.I18N.t("text.066") : "重新連線中…"; }, get loading() { return globalThis.I18N ? globalThis.I18N.t("text.065") : "載入中…"; }, get error() { return globalThis.I18N ? globalThis.I18N.t("text.064") : "連線錯誤"; }, get offline() { return globalThis.I18N ? globalThis.I18N.t("text.063") : "無伺服器"; }, get idle() { return globalThis.I18N ? globalThis.I18N.t("text.062") : "未連線"; } }[app.conn.status] || app.conn.status);

  /* 比分與投票操作：按鈕沿用伺服器權限，名單未變時保留焦點。 */
  var sl = $('scorelist');
  var members = v.room ? v.room.members.filter(function (m) { return m.role === 'player'; }) : [];
  var sorted = g ? g.players.slice().sort(function (a, b) { return b.score - a.score; }) : members;
  var scoreHtml = sorted.map(function (p, index) {
    var cls = ['', p.isDrawer ? 'drawer' : '', p.id === v.you.id ? 'me' : ''].join(' ').trim();
    var eligible = app.mode === 'online' && v.room && !v.room.closed && p.id !== v.you.id && members.some(function (m) { return m.id === p.id; });
    var button = '';
    if (eligible) {
      var reason = v.room.kick ? 'kick.busy' : (v.you.role !== 'player' ? 'kick.playersOnly' : 'kick.needThree');
      button = '<button type="button" class="score-kick" id="score-kick-' + esc(p.id) + '" data-kick="' + esc(p.id) + '" aria-label="' + esc(w.I18N.t('kick.actionFor', { name: p.name })) + '"' +
        (v.you.can.kick ? '' : ' disabled title="' + esc(w.I18N.t(reason)) + '"') + '>' + esc(w.I18N.t('kick.action')) + '</button>';
    }
    return '<li class="' + cls + '"><span class="sface" aria-hidden="true">' +
      S.face(g ? indexOfPlayer(g, p.id) : index, g ? moodOf(p, g) : 'happy') + '</span>' +
      '<span class="sname" title="' + esc(p.name) + '">' + esc(p.name) + '</span>' +
      '<span class="spts">' + (p.score || 0) + '</span>' + button + '</li>';
  }).join('');
  if (sl.getAttribute('data-sig') !== scoreHtml) {
    var focusedId = sl.contains(D.activeElement) ? D.activeElement.id : '';
    sl.innerHTML = scoreHtml;
    sl.setAttribute('data-sig', scoreHtml);
    var nextFocus = focusedId && D.getElementById(focusedId);
    if (nextFocus && !nextFocus.disabled) nextFocus.focus();
  }

  /* 猜題紀錄：系統事件 + 每一則猜題 */
  renderRecent();
}

export function canDoText(v, g) {
  if (v.room && v.room.closed) return (globalThis.I18N ? globalThis.I18N.t("text.060") : "房間已結束，回大廳再開一間吧。");
  if (v.room && v.room.phase === 'waiting') {
    if (v.you.role === 'spectator') return (globalThis.I18N ? globalThis.I18N.t("text.059") : "等這一局開始，你會以觀戰身分看畫。");
    if (v.you.isHost) return (globalThis.I18N ? globalThis.I18N.t("text.058") : "其他人都按「準備好了」之後，按「開始！」就能開局。");
    return v.you.ready ? (globalThis.I18N ? globalThis.I18N.t("text.057") : "已準備，等房主按開始。") : (globalThis.I18N ? globalThis.I18N.t("text.056") : "按「準備好了」讓房主可以開始。");
  }
  if (!g) return '—';
  if (isRelayGame(g) && g.phase !== 'over') return relayCanDo(v, g);
  if (isTelephoneGame(g) && g.phase !== 'over') return telephoneCanDo(v, g);
  if (v.you.role === 'spectator') return (globalThis.I18N ? globalThis.I18N.t("text.055") : "觀戰中：可以看畫與猜題紀錄，不能畫也不能猜。");
  if (g.phase === 'picking') return g.you.canPick ? (globalThis.I18N ? globalThis.I18N.t("text.054") : "從三個題目裡挑一個。") : (globalThis.I18N ? globalThis.I18N.t("text.053") : "等畫家挑題目。");
  if (g.phase === 'drawing') {
    if (g.you.isDrawer) return (globalThis.I18N ? globalThis.I18N.t("text.052") : "用工具列把題目畫出來；畫好了按「畫完了」告訴大家（這一題不會因此結束）。");
    if (g.you.guessed) return (globalThis.I18N ? globalThis.I18N.t("text.051") : "你已經猜中了，等其他人或時間結束。");
    return (globalThis.I18N ? globalThis.I18N.t("text.050") : "把答案打進下面的猜題框，猜錯不扣分。");
  }
  if (g.phase === 'reveal') return (globalThis.I18N ? globalThis.I18N.t("text.049") : "看一下答案，馬上換下一位畫家。");
  return app.mode === 'online' ? w.I18N.t(v.you.can.rematch ? 'result.canHost' : 'result.waitHost') : (globalThis.I18N ? globalThis.I18N.t("text.047") : "這一局結束了，可以再玩一局或離開。");
}
