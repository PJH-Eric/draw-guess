/* ===== app/menus.js — 教學、戰績與單機設定畫面 ===== */

import { $, D, ME, S, Sound, Store, Words, app, esc, show, toast } from './core.js?v=faead5a5c6';
import { soloRefresh, startSolo, withWordPack } from './solo.js?v=faead5a5c6';

var w = window;

/* ================================================================
   教學（純文字）
   ================================================================ */

export var TUTORIAL = [
  { get h() { return globalThis.I18N ? globalThis.I18N.t("text.263") : "這個遊戲在玩什麼"; }, get b() { return (globalThis.I18N ? globalThis.I18N.t("text.262") : "<p>大家輪流當「畫家」。輪到你當畫家時，你會從三個題目裡挑一個，把它畫在畫布上；其他人看著你的線條，把答案打進下面的猜題框。</p>") +
    (globalThis.I18N ? globalThis.I18N.t("text.261") : "<p>一局裡每個人都會當到畫家。全部畫完之後，分數最高的人獲勝。</p>") +
    (globalThis.I18N ? globalThis.I18N.t("text.260") : "<p>下一段會說明畫家可以用哪些工具。</p>"); } },
  { get h() { return globalThis.I18N ? globalThis.I18N.t("text.259") : "當畫家：小畫家式的工具列"; }, get b() { return (globalThis.I18N ? globalThis.I18N.t("text.258") : "<p>輪到你畫的時候，畫布下面會出現工具列，用法跟小畫家一樣：</p>") +
    '<ul>' +
    (globalThis.I18N ? globalThis.I18N.t("text.257") : "<li><b>鉛筆</b>：按住拖曳就畫線，最常用。</li>") +
    (globalThis.I18N ? globalThis.I18N.t("text.256") : "<li><b>筆刷</b>：跟鉛筆一樣，但線比較粗。</li>") +
    (globalThis.I18N ? globalThis.I18N.t("text.255") : "<li><b>直線／矩形／橢圓</b>：從一點按住拖到另一點，放開才會定形。</li>") +
    (globalThis.I18N ? globalThis.I18N.t("text.254") : "<li><b>橡皮擦</b>：擦掉畫錯的地方。</li>") +
    (globalThis.I18N ? globalThis.I18N.t("text.253") : "<li><b>油漆桶</b>：點一下就把那一塊封閉區域填成目前的顏色。要先把輪廓連起來，不然顏色會流到整張紙。</li>") +
    '</ul>' +
    (globalThis.I18N ? globalThis.I18N.t("text.252") : "<p>右邊還有<b>復原</b>、<b>重做</b>、<b>全部清除</b>。顏色和粗細在工具列上直接點選；矩形和橢圓可以勾「填滿」畫成實心。</p>"); } },
  { get h() { return globalThis.I18N ? globalThis.I18N.t("text.251") : "當畫家：不能做的事"; }, get b() { return (globalThis.I18N ? globalThis.I18N.t("text.250") : "<p>這個遊戲刻意<b>沒有文字工具，也沒有聊天室</b>——畫家沒有任何可以打字的地方，所以不可能把答案寫出來。</p>") +
    (globalThis.I18N ? globalThis.I18N.t("text.249") : "<p>線上房間裡，畫好了按<b>「畫完了」</b>——那只是告訴大家可以猜了，這一題還會繼續，你也還能補幾筆。（單機自己練習只有你一個人，沒有其他人要通知，看不到這顆鈕。）</p>") +
    (globalThis.I18N ? globalThis.I18N.t("text.248") : "<p>只能用線條和顏色表達。真的畫不出來就按<b>「跳過這題」</b>（單機時是「換題」，也可用右上角「對局設定」裡的「跳過這一題」），會直接公布答案、換下一題。</p>") +
    (globalThis.I18N ? globalThis.I18N.t("text.247") : "<p>線上房間裡，畫得越多人猜中，你這一題拿的分數越高；全部人都猜中還有額外加分。</p>"); } },
  { get h() { return globalThis.I18N ? globalThis.I18N.t("text.246") : "當猜題者：把答案打進去"; }, get b() { return (globalThis.I18N ? globalThis.I18N.t("text.245") : "<p>輪到別人畫的時候，畫布下方會出現猜題框。想到什麼就直接打進去按「猜！」，答錯不扣分，可以一直猜。</p>") +
    (globalThis.I18N ? globalThis.I18N.t("text.244") : "<p>三種回應：</p>") +
    '<ul>' +
    (globalThis.I18N ? globalThis.I18N.t("text.243") : "<li><b>猜對了</b>：加分，而且你猜的內容不會被別人看到。</li>") +
    (globalThis.I18N ? globalThis.I18N.t("text.242") : "<li><b>很接近了</b>：猜中答案一半以上的字（兩個字的題目中一個、四個字的中兩個），這個提示只有你看得到。</li>") +
    (globalThis.I18N ? globalThis.I18N.t("text.241") : "<li><b>沒猜中</b>：會出現在操作摘要的「猜題紀錄」裡，讓大家知道這個答案已經有人試過了。</li>") +
    '</ul>' +
    (globalThis.I18N ? globalThis.I18N.t("text.240") : "<p>猜得越早、名次越前面，分數越高。</p>"); } },
  { get h() { return globalThis.I18N ? globalThis.I18N.t("text.239") : "題目提示怎麼看"; }, get b() { return (globalThis.I18N ? globalThis.I18N.t("text.238") : "<p>畫布上方那一條就是提示。提示不會自己出現，要等畫家按，而且依序給：</p>") +
    '<ul>' +
    (globalThis.I18N ? globalThis.I18N.t("text.237") : "<li><b>字數</b>：答案有幾個字就出現幾條底線，例如 <b>＿＿</b>。</li>") +
    (globalThis.I18N ? globalThis.I18N.t("text.236") : "<li><b>種類</b>：題目的分類，例如動物、食物、台灣在地。</li>") +
    (globalThis.I18N ? globalThis.I18N.t("text.235") : "<li><b>一個字</b>：隨機翻開答案裡的其中一個字，例如 <b>＿陽</b>。只有一個字的題目沒有這張。</li>") +
    '</ul>' +
    (globalThis.I18N ? globalThis.I18N.t("text.234") : "<p>右上角的倒數就是這一題剩下的時間。時間到、或所有人都猜中了，這一題就結束並公布答案。</p>"); } },
  { get h() { return globalThis.I18N ? globalThis.I18N.t("text.233") : "單機自己練習"; }, get b() { return (globalThis.I18N ? globalThis.I18N.t("text.232") : "<p>單機練習就你自己一個人，沒有電腦對手、也不計分，單純練習下筆用的。</p>") +
    (globalThis.I18N ? globalThis.I18N.t("text.231") : "<p>挑一個題目開始畫，畫完（或不想畫了）按「換題」就換下一題，想練幾次、每次想畫多久都能自己調整。</p>") +
    (globalThis.I18N ? globalThis.I18N.t("text.230") : "<p>因為只有你自己，猜題、提示、分數這些跟別人比賽的東西在單機裡都用不到，重點是練習下筆。</p>"); } },
  { get h() { return globalThis.I18N ? globalThis.I18N.t("text.229") : "線上一起玩"; }, get b() { return (globalThis.I18N ? globalThis.I18N.t("text.228") : "<p>在主選單按「經典模式」可以開房間或用房號加入，2 到 8 個人都行（線上只有真人，沒有電腦對手）。</p>") +
    (globalThis.I18N ? globalThis.I18N.t("text.227") : "<p>房主可以在對局設定裡產生<b>邀請連結</b>，對方開啟後會先停在大廳確認暱稱，按下按鈕才會真的進房。</p>") +
    (globalThis.I18N ? globalThis.I18N.t("text.226") : "<p>位子滿了或對局已經開始時，新來的人會變成<b>觀戰者</b>：可以看畫、看紀錄，但不能畫也不能猜。</p>") +
    (globalThis.I18N ? globalThis.I18N.t("text.225") : "<p>右上角的摘要鈕打開操作摘要：目前階段、你能做什麼、比分，還有「猜題紀錄」——每一則猜題（含猜錯的）與對局事件都在那裡。房間裡沒有任何真人玩家時會立刻關閉。</p>") +
    (globalThis.I18N ? globalThis.I18N.t("text.224") : "<p>等待畫面的「房間設定」最下面有<b>離開房間</b>（房主是<b>退出房間</b>）：房主退出會把房主交給下一位，最後一個人退出房間就會關掉。</p>"); } },
  { get h() { return w.I18N.t('tut.relay.h'); }, get b() { return modeGuide('relay'); } },
  { get h() { return w.I18N.t('tut.telephone.h'); }, get b() { return modeGuide('telephone'); } }
];

function modeGuide(mode) {
  var key = 'tut.' + mode + '.';
  return '<div class="mode-guide" data-mode="' + mode + '">' + [1, 2, 3].map(function (step) {
    return '<section class="mode-guide-step"><h4>' + esc(w.I18N.t(key + 'step' + step)) + '</h4>' +
      w.I18N.t(key + 'b' + step) + '</section>';
  }).join('') + '</div>';
}

/* 每一段配一張小示意圖：用現成的圖示與表情拼出來（純裝飾，文字才是內容，所以 aria-hidden）。 */
function tutTile(html, cls) { return '<span class="tut-tile' + (cls ? ' ' + cls : '') + '">' + html + '</span>'; }
function tutIco(name) { return '<span class="ico">' + S.icon(name) + '</span>'; }
export function tutorialArt(index) {
  var lang = w.I18N ? w.I18N.lang : 'zh-Hant';
  var arrow = '<span class="tut-arrow">→</span>';
  var blank = lang === 'en' ? '_ _ _' : '＿ ＿';
  var half = lang === 'en' ? '_ u _' : (lang === 'zh-Hans' ? '＿ 阳' : '＿ 陽');
  var art = [
    /* 這個遊戲在玩什麼：畫家畫、其他人猜 */
    tutTile(S.face(0, 'draw'), 'face') + arrow + tutTile(tutIco('board')) + arrow + tutTile(S.face(1, 'think'), 'face') + tutTile(S.face(2, 'happy'), 'face'),
    /* 工具列 */
    ['pen', 'brush', 'line', 'rect', 'ellipse', 'erase', 'fill'].map(function (n) { return tutTile(tutIco(n)); }).join(''),
    /* 不能做的事：沒有聊天、沒有文字，只能畫 */
    tutTile(tutIco('chat'), 'ban') + tutTile('<b>Aa</b>', 'ban') + arrow + tutTile(tutIco('pen'), 'ok'),
    /* 猜題：三種回應 */
    '<span class="tut-pill">' + tutIco('pen') + '<i>…</i></span>' + arrow + tutTile('✓', 'ok') + tutTile('≈', 'near') + tutTile('✗', 'miss'),
    /* 提示：字數 → 種類 → 一個字 */
    '<span class="tut-pill">' + blank + '</span>' + arrow + '<span class="tut-pill">' + tutIco('tag') + '</span>' + arrow + '<span class="tut-pill">' + half + '</span>',
    /* 單機練習 */
    tutTile(S.face(0, 'draw'), 'face') + tutTile(tutIco('board')) + arrow + tutTile(tutIco('refresh')),
    /* 線上一起玩 */
    tutTile(tutIco('home')) + arrow + tutTile(S.face(0, 'happy'), 'face') + tutTile(S.face(1, 'happy'), 'face') + tutTile(S.face(2, 'happy'), 'face') + tutTile(tutIco('eye')),
    /* 接力：好幾個畫家輪流畫一張圖給一個人猜 */
    tutTile(S.face(0, 'draw'), 'face') + arrow + tutTile(S.face(1, 'draw'), 'face') + arrow + tutTile(S.face(2, 'draw'), 'face') + arrow + tutTile(S.face(3, 'think'), 'face'),
    /* 畫圖傳話：畫 → 照畫 → 照畫 → 猜 */
    tutTile(S.face(0, 'draw'), 'face') + arrow + tutTile(S.face(1, 'draw'), 'face') + arrow + tutTile(S.face(2, 'draw'), 'face') + arrow + tutTile(S.face(3, 'think'), 'face')
  ];
  return '<div class="tut-art" aria-hidden="true">' + (art[index] || '') + '</div>';
}

/* 教學目前翻到第幾段 */
export var tut = { index: 0 };
export function renderTutorial() {
  var t = TUTORIAL[tut.index];
  var dots = '';
  for (var i = 0; i < TUTORIAL.length; i++) dots += '<i' + (i === tut.index ? ' class="on"' : (i < tut.index ? ' class="done"' : '')) + '></i>';
  $('tut-progress').innerHTML = '<span class="tut-dots" aria-hidden="true">' + dots + '</span><span class="tut-progress-text">' +
    esc((globalThis.I18N ? globalThis.I18N.t("text.162") : "第 ") + (tut.index + 1) + (globalThis.I18N ? globalThis.I18N.t("text.223") : " 段 / 共 ") + TUTORIAL.length + (globalThis.I18N ? globalThis.I18N.t("text.222") : " 段")) + '</span>';
  $('tut-box').innerHTML = tutorialArt(tut.index) + '<h3>' + t.h + '</h3>' + t.b;
  $('b-tut-prev').disabled = tut.index === 0;
  S.setLabel($('b-tut-next'), tut.index === TUTORIAL.length - 1 ? (globalThis.I18N ? globalThis.I18N.t("text.221") : "看完了 ✓") : (globalThis.I18N ? globalThis.I18N.t("text.220") : "下一段 ▶"));
  $('tut-box').focus();
}

export function setupTutorial() {
  $('b-tut-prev').addEventListener('click', function () {
    if (tut.index > 0) { tut.index--; renderTutorial(); Sound.play('click'); }
  });
  $('b-tut-next').addEventListener('click', function () {
    if (tut.index < TUTORIAL.length - 1) { tut.index++; renderTutorial(); Sound.play('click'); }
    else { Store.tutorialDone(true); show('s-home'); }
  });
  $('b-tut-skip').addEventListener('click', function () { Store.tutorialDone(true); show('s-home'); });
  $('b-tut-practice').addEventListener('click', function () {
    Store.tutorialDone(true);
    startSolo();
  });
}

/* ================================================================
   戰績
   ================================================================ */

export function renderStats() {
  var s = Store.stats();
  var blank = function (b) { return !b.games && !b.win && !b.correct && !b.drawn && !b.best; };
  if (blank(s.solo) && blank(s.online) && blank(s.relay) && blank(s.telephone)) {
    /* 還沒有任何紀錄：兩張全是 0 的表格沒有意義，直接帶人去畫第一張 */
    $('statgrid').innerHTML = '<div class="stat-empty"><span class="stat-empty-face" aria-hidden="true">' + S.face(2, 'happy') + '</span>' +
      '<h3>' + esc(w.I18N.t('stats.empty.title')) + '</h3><p>' + esc(w.I18N.t('stats.empty.text')) + '</p>' +
      '<button class="btn3d" data-color="mint" id="b-stats-start">' + esc(w.I18N.t('stats.empty.cta')) + '</button></div>';
    S.decorateAll($('statgrid'));
    $('b-stats-start').addEventListener('click', function () { $('b-solo').click(); });
    return;
  }
  var card = function (title, b) {
    return '<div class="statcard"><h3>' + title + '</h3>' +
      ("<div class=\"statrow\"><span>" + esc(I18N.t("text.219")) + "</span><b>") + b.games + '</b></div>' +
      ("<div class=\"statrow\"><span>" + esc(I18N.t("text.218")) + "</span><b>") + b.win + '</b></div>' +
      '<div class="statrow"><span>' + esc(w.I18N.t('stats.winRate')) + '</span><b>' +
      (b.games ? Math.round(b.win / b.games * 100) + '%' : '—') + '</b></div>' +
      ("<div class=\"statrow\"><span>" + esc(I18N.t("text.217")) + "</span><b>") + b.correct + (esc(I18N.t("text.216")) + "</b></div>") +
      ("<div class=\"statrow\"><span>" + esc(I18N.t("text.215")) + "</span><b>") + b.drawn + (esc(I18N.t("text.214")) + "</b></div>") +
      ("<div class=\"statrow\"><span>" + esc(I18N.t("text.213")) + "</span><b>") + b.best + '</b></div>' +
      '</div>';
  };
  $('statgrid').innerHTML = card((globalThis.I18N ? globalThis.I18N.t("text.212") : "單機練習"), s.solo) + card((globalThis.I18N ? globalThis.I18N.t("text.211") : "線上對戰"), s.online) +
    card(esc(w.I18N.t('relay.name')), s.relay) + card(esc(w.I18N.t('telephone.name')), s.telephone);
}

/* ================================================================
   單機設定畫面
   ================================================================ */

export function buildChips(hostId, values, getter, setter) {
  var host = $(hostId);
  host.innerHTML = '';
  values.forEach(function (v) {
    var b = D.createElement('button');
    b.type = 'button';
    b.className = 'pillbtn';
    b.setAttribute('role', 'radio');
    b.textContent = v.label;
    b.setAttribute('aria-checked', String(getter() === v.value));
    b.addEventListener('click', function () {
      setter(v.value);
      Sound.play('click');
      var all = host.querySelectorAll('.pillbtn');
      for (var i = 0; i < all.length; i++) all[i].setAttribute('aria-checked', String(all[i] === b));
    });
    host.appendChild(b);
  });
}

export function categoryChoices() {
  return [{ v: '', label: w.I18N.t('category.all') }].concat(Words.CATEGORY_KEYS.map(function (key) {
    return { v: key, label: Words.CATEGORIES[key].emoji + ' ' + w.I18N.t('category.' + key) };
  }));
}

export function renderCategorySelect(id, value) {
  $(id).innerHTML = categoryChoices().map(function (item) {
    return '<option value="' + esc(item.v) + '"' + (item.v === value ? ' selected' : '') + '>' + esc(item.label) + '</option>';
  }).join('');
}

/* 題目語系的選項一律寫各語言自己的名稱，不跟著介面語系翻譯 */
export var WORD_LANGS = [
  { v: 'zh-Hant', label: '繁體中文' },
  { v: 'zh-Hans', label: '简体中文' },
  { v: 'en', label: 'English' }
];
export function wordLangLabel(lang) {
  var hit = WORD_LANGS.filter(function (item) { return item.v === lang; })[0];
  return hit ? hit.label : WORD_LANGS[0].label;
}
export function renderWordLangSelect(id, value) {
  $(id).innerHTML = WORD_LANGS.map(function (item) {
    return '<option value="' + esc(item.v) + '"' + (item.v === value ? ' selected' : '') + '>' + esc(item.label) + '</option>';
  }).join('');
}

export function renderSoloOptions() {
  renderCategorySelect('opt-category', Store.category());
  renderWordLangSelect('opt-wordlang', Store.wordLang());
  renderRecentWorks();
  /* 單機可選種類與難度；練幾次、每題畫多久都不設限（見 startSolo） */
  buildChips('opt-worddiff', [
    { value: 0, get label() { return globalThis.I18N ? globalThis.I18N.t("text.119") : "混合"; } }, { value: 1, get label() { return globalThis.I18N ? globalThis.I18N.t("text.140") : "簡單"; } },
    { value: 2, get label() { return globalThis.I18N ? globalThis.I18N.t("text.139") : "普通"; } }, { value: 3, get label() { return globalThis.I18N ? globalThis.I18N.t("text.138") : "困難"; } }
  ], Store.diff, Store.diff);
}

/* 最近存檔的作品：把存檔裡的筆畫重畫成縮圖（先畫在跟畫布一樣大的離線畫布上，
   油漆桶的座標才對，再縮小貼上去） */
export function renderRecentWorks() {
  var list = Store.recentDrawings();
  $('recent-works-wrap').hidden = !list.length;
  var box = $('recent-works');
  box.innerHTML = list.map(function (it, i) {
    return '<button type="button" class="recentwork" data-i="' + i + '" aria-label="' + esc(w.I18N.t('solo.recent.load', { word: it.word })) + '">' +
      '<canvas width="160" height="160" aria-hidden="true"></canvas><span>' + esc(it.word) + '</span></button>';
  }).join('');
  if (!list.length || !w.Paint) return;
  var big = D.createElement('canvas');
  big.width = big.height = w.Paint.BUF;
  var bctx = big.getContext('2d');
  var thumbs = box.querySelectorAll('canvas');
  for (var i = 0; i < list.length; i++) {
    try {
      var data = JSON.parse(list[i].text);
      bctx.fillStyle = w.Paint.PAPER;
      bctx.fillRect(0, 0, big.width, big.height);
      for (var k = 0; k < data.strokes.length; k++) w.Paint.drawStroke(bctx, data.strokes[k], false);
      thumbs[i].getContext('2d').drawImage(big, 0, 0, 160, 160);
    } catch (e) { /* 壞掉的存檔就留白，點了會有錯誤提示 */ }
  }
}

/** 把一份作品存檔文字載入成新的單機練習（從單機設定頁進來用） */
export function openDrawingText(text) {
  var state;
  try { state = w.DrawingFile.decode(text, { id: ME, get name() { return globalThis.I18N ? globalThis.I18N.t("text.166") : "你"; } }, Date.now()); }
  catch (e) { toast(e.message, 'error'); return; }
  withWordPack(Store.wordLang(), function () {
    startSolo();
    app.solo.state = state;
    app.solo.seed = state.seed;
    app.paint.setStrokes(state.strokes);
    app.paint.clearRedo();
    soloRefresh();
    toast((globalThis.I18N ? globalThis.I18N.t("text.184") : "作品已載入，可以繼續畫。"), 'ok');
  });
}

export function setupSoloScreen() {
  $('recent-works').addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('button.recentwork') : null;
    if (!btn) return;
    var item = Store.recentDrawings()[Number(btn.getAttribute('data-i'))];
    if (item) { Sound.play('click'); openDrawingText(item.text); }
  });
  renderSoloOptions();
  $('opt-category').addEventListener('change', function () { Store.category(this.value); });
  /* 換題目語系就先把那一包題庫載進來，按「開始畫」時通常已經好了 */
  $('opt-wordlang').addEventListener('change', function () { Store.wordLang(this.value); if (w.LazyPacks) w.LazyPacks.words(this.value); });
  $('b-solo-start').addEventListener('click', startSolo);
}
