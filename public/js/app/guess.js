/* ===== app/guess.js — 猜題列 ===== */

import { $, ME, Rules, Sound, app, toast } from './core.js?v=d9b580ef2d';
import { soloRefresh } from './solo.js?v=d9b580ef2d';
import { pushFeed } from './feed.js?v=d9b580ef2d';

var w = window;

/* ================================================================
   猜題
   ================================================================ */

export function setupGuessbar() {
  $('guessbar').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var input = $('guess-input');
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    submitGuess(text);
    input.focus();
  });
}

export function submitGuess(text) {
  if (app.mode === 'solo') {
    var now = Date.now();
    var r = Rules.guess(app.solo.state, ME, text, now);
    if (!r.ok) { toast(r.error, 'error'); Sound.play('blocked'); return; }
    if (r.verdict === 'hit') {
      pushFeed({ kind: 'correct', get from() { return globalThis.I18N ? globalThis.I18N.t("text.173") : "系統"; }, get text() { return (globalThis.I18N ? globalThis.I18N.t("text.172") : "你猜對了！（第 ") + r.order + (globalThis.I18N ? globalThis.I18N.t("text.171") : " 個，+") + r.points + (globalThis.I18N ? globalThis.I18N.t("text.170") : " 分）"); }, at: now });
      Sound.play('correct'); Sound.vibrate([12, 40, 12]);
      toast((globalThis.I18N ? globalThis.I18N.t("text.169") : "猜對了！+") + r.points + (globalThis.I18N ? globalThis.I18N.t("text.168") : " 分"), 'ok');
    } else if (r.verdict === 'close') {
      toast('「' + text + (globalThis.I18N ? globalThis.I18N.t("text.167") : "」很接近了，再想一下！"), 'ok');
      Sound.play('close');
    } else {
      pushFeed({ kind: 'guess', get from() { return globalThis.I18N ? globalThis.I18N.t("text.166") : "你"; }, fromId: ME, role: 'player', text: text, at: now });
      Sound.play('wrong');
    }
    soloRefresh();
    return;
  }
  /* 接力：猜題者以外的人，這個框是「畫家聊天」（猜題者看不到） */
  if ($('guessbar').getAttribute('data-mode') === 'chat') { w.Online.send('room:chat', { text: text }); return; }
  w.Online.send('room:guess', { text: text });
}
