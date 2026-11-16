/* ===== lazy-packs.js — 語系與題庫「用到才載入」 =====
 *
 * 介面字典與題庫各有三個語系，但一個玩家通常只用一種。這裡負責：
 *   1. 開頁時只把「目前介面語系」與「上次選的題目語系」那兩包同步寫進頁面（document.write），
 *      後面的腳本執行時字典已經在了，畫面不會先閃一下繁中再換。
 *      繁中是預設也是後備，一定會載入（index.html 直接引用），所以繁中玩家不會多載任何東西。
 *   2. 之後切換語系、換題目語系、進到別種語系的房間時，再用 <script> 動態補載。
 *
 * 檔案網址沿用這支腳本自己的 ?v= 版本參數，所以跟其他靜態檔一起換新（見 scripts/stamp-assets.js）。
 * 要排在 i18n.js 與 locales/ui.zh-Hant.js 之後、其他腳本之前。
 */
(function (w, d) {
  'use strict';

  var self = d.currentScript;
  var src = self && self.src ? self.src : '';
  var base = src.replace(/lazy-packs\.js.*$/, '');
  var ver = (src.match(/\?v=[^&#]*/) || [''])[0];

  var UI = { 'en': 'locales/ui.en.js', 'zh-Hans': 'locales/ui.zh-Hans.js' };
  var WORDS = { 'en': 'words.en.js', 'zh-Hans': 'words.zh-Hans.js' };

  var state = {};      // file → 'loading' | 'ok'
  var waiting = {};    // file → [callback]

  function url(file) { return base + file + ver; }

  function load(file, cb) {
    if (!file || state[file] === 'ok') { if (cb) cb(true); return; }
    (waiting[file] = waiting[file] || []).push(cb || function () {});
    if (state[file] === 'loading') return;
    state[file] = 'loading';
    var el = d.createElement('script');
    el.src = url(file);
    var finish = function (ok) {
      state[file] = ok ? 'ok' : '';
      var list = waiting[file] || [];
      waiting[file] = [];
      for (var i = 0; i < list.length; i++) { try { list[i](ok); } catch (e) { if (w.console) w.console.error(e); } }
    };
    el.onload = function () { finish(true); };
    el.onerror = function () { el.remove(); finish(false); };
    d.head.appendChild(el);
  }

  /* 只在頁面還在解析時有效：寫進去的 <script> 會緊接在這支後面同步執行 */
  function writeNow(file) {
    if (!file || state[file] || d.readyState !== 'loading') return;
    state[file] = 'ok';
    d.write('<script src="' + url(file) + '"><\/script>');
  }

  w.LazyPacks = {
    /** 介面字典：載好（或本來就不需要）就回呼 true */
    ui: function (lang, cb) { load(UI[lang], cb); },
    /** 題庫：同上 */
    words: function (lang, cb) { load(WORDS[lang], cb); }
  };

  if (w.I18N && w.I18N.usePackLoader) w.I18N.usePackLoader(w.LazyPacks.ui);

  var uiLang = w.I18N ? w.I18N.lang : 'zh-Hant';
  writeNow(UI[uiLang]);

  /* 題目語系第一次用到時會跟著介面語系（見 storage.js 的 wordLang），這裡用同一個判斷 */
  var wordLang = null;
  try { wordLang = w.localStorage.getItem('dg_word_lang'); } catch (e) { wordLang = null; }
  if (wordLang !== 'zh-Hant' && !WORDS[wordLang]) wordLang = uiLang;
  writeNow(WORDS[wordLang]);
}(window, document));
