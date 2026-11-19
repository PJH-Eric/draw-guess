/* ===== app/solo.js — 單機引擎 ===== */

import { D, LOOP_MS, ME, RNG, Rules, Sound, Store, Words, app, show, toast } from './core.js?v=95f17e75a6';
import { pushFeed } from './feed.js?v=95f17e75a6';
import { ensurePaint } from './canvas.js?v=95f17e75a6';
import { render, updateTimers } from './render.js?v=95f17e75a6';
import { recordResult } from './online-events.js?v=95f17e75a6';

var w = window;

/* ================================================================
   單機引擎：自己持有完整狀態，就你一個人，單純練習作畫用的
   ================================================================ */

/** 確認某個語系的題庫已經載入再做事（英文與簡中題庫是用到才載入的）。已經在就同步執行。 */
export function withWordPack(lang, fn) {
  if (Words.hasLang(lang) || !w.LazyPacks) { fn(); return; }
  w.LazyPacks.words(lang, function (ok) {
    if (ok && Words.hasLang(lang)) fn();
    else toast(w.I18N.t('words.loadFail'), 'error');
  });
}

export function startSolo() {
  /* 題庫還沒載入（剛換題目語系、網路慢）：載好再開始 */
  if (!Words.hasLang(Store.wordLang())) { withWordPack(Store.wordLang(), startSolo); return; }
  var players = [{ id: ME, get name() { return globalThis.I18N ? globalThis.I18N.t("text.166") : "你"; }, ai: null }];
  var seed = RNG.randomSeed(null, 6);
  /* 單機練習不設限：沒有別人在等，所以直接把引擎上限吃滿 ——
     練幾次、每題畫多久都不用先決定，練夠了直接離開就好。
     （引擎需要一個有限數字才跑得動，所以用 CONST 的極限值當「不設限」。） */
  var state = Rules.createState({ lang: Store.wordLang(),
    seed: seed,
    players: players,
    rounds: Rules.CONST.ROUNDS_MAX,
    drawSec: Rules.CONST.DRAW_SEC_MAX,
    unlimited: true,               // 真的不限時、不限次：不會逾時、不會跳結算（見 rules.js createState）
    diff: Store.diff(),
    category: Store.category()
  });
  var r = Rules.start(state, Date.now());
  if (!r.ok) { toast(r.error, 'error'); return; }

  GameAnalytics.start({ mode: 'solo', difficulty: Store.diff(), players: 1 });
  app.mode = 'solo';
  app.solo = { state: state, seed: seed };
  /* 單機只有自己一個人：左側操作摘要、玩家分數列、給別人看的三張提示都用不到，
     整塊拿掉，空出來的高度全部給畫布（CSS 見 body.solo-mode） */
  D.body.classList.add('solo-mode');
  app.roomCode = null;
  app.feed = [];
  app.feedSeen = {};
  app.lastTurnKey = '';
  app.lastPhase = '';
  app.lastMask = '';
  app.lastGuessedCount = 0;
  /* 不設限＝上限吃滿，寫出「畫 999 次」只會讓人困惑，直接講怎麼換題 */
  pushFeed({ kind: 'system', get from() { return globalThis.I18N ? globalThis.I18N.t("text.173") : "系統"; }, get text() { return globalThis.I18N ? globalThis.I18N.t("text.210") : "練習開始，想畫幾題就畫幾題，按「換題」換下一題。"; }, at: Date.now() });

  show('s-game');
  ensurePaint();
  app.paint.clearLocal();
  app.paint.clearRedo();
  soloRefresh();
  Sound.play('start');
  startLoop();
}

/** 把單機的完整狀態投影成跟線上一樣形狀的 view */

/** Project category codes into the current UI language without revealing hidden hints. */
export function localizeGame(game) {
  if (!game) return game;
  if (game.hint) Object.defineProperty(game.hint, 'catLabel', { configurable: true, get: function () { return game.hint.cat ? w.I18N.t('category.' + game.hint.cat) : null; } });
  (game.choices || []).forEach(function (choice) {
    Object.defineProperty(choice, 'catLabel', { configurable: true, get: function () { return w.I18N.t('category.' + choice.cat); } });
    Object.defineProperty(choice, 'diffLabel', { configurable: true, get: function () { return w.I18N.t('difficulty.' + choice.diff); } });
  });
  return game;
}

export function soloRefresh() {
  var st = app.solo.state;
  var wasDrawer = !!(app.view && app.view.game && app.view.game.you.isDrawer);
  var game = localizeGame(Rules.toPublic(st, ME));
  app.view = {
    room: null,
    game: game,
    you: {
      id: ME,
      get name() { return globalThis.I18N ? globalThis.I18N.t("text.166") : "你"; },
      role: 'player',
      ready: true,
      isHost: true,
      inGame: true,
      can: {
        pick: game.you.canPick,
        draw: game.you.canDraw,
        guess: game.you.canGuess,
        skip: game.you.canDraw,
        rematch: st.over,
        invite: false,
        setAi: false,
        setSettings: false,
        becomePlayer: false,
        becomeSpectator: false
      }
    }
  };
  render();
}

export function soloStep() {
  if (app.mode !== 'solo' || !app.solo) return;
  var st = app.solo.state;
  if (st.over) {
    /* 結束了還要再更新一次畫面，結算卡才出得來，戰績也才記得到 */
    if (!app.view || !app.view.game || !app.view.game.over) {
      soloRefresh();
      Sound.play(st.winners.indexOf(ME) >= 0 ? 'win' : 'lose');
      recordResult(app.view);
    }
    return;
  }
  var now = Date.now();

  /* 沒有電腦對手了：這裡只需要推進時間（選字逾時、作畫逾時、公布完換下一題），
     畫布跟猜題都是你自己在操作，走各自的按鈕處理函式就好。 */
  var t = Rules.tick(st, now);
  handleGameEvents(t.events);
  soloRefresh();
}

/** 提示要怎麼寫進猜題紀錄（單機與線上共用同一套措辭） */
export function hintFeedText(ev) {
  if (ev.step === 1) return (globalThis.I18N ? globalThis.I18N.t("text.209") : "畫家給了提示：題目有 ") + (ev.mask || '').length + (globalThis.I18N ? globalThis.I18N.t("text.176") : " 個字。");
  if (ev.step === 2) return (globalThis.I18N ? globalThis.I18N.t("text.208") : "畫家給了提示：題目的種類。");
  return (globalThis.I18N ? globalThis.I18N.t("text.207") : "畫家給了提示：") + (ev.mask || '');
}

export function handleGameEvents(events) {
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    if (ev.type === 'autopick') {
      pushFeed({ kind: 'system', get from() { return globalThis.I18N ? globalThis.I18N.t("text.173") : "系統"; }, get text() { return globalThis.I18N ? globalThis.I18N.t("text.206") : "時間到，系統幫畫家挑了題目。"; }, at: Date.now() });
    } else if (ev.type === 'hint') {
      pushFeed({ kind: 'system', get from() { return globalThis.I18N ? globalThis.I18N.t("text.173") : "系統"; }, text: hintFeedText(ev), at: Date.now() });
      Sound.play('hint');
    } else if (ev.type === 'turnend') {
      /* 單機自己練習沒有其他人猜題，total 會是 0——這時候不要顯示「0/0 人猜中」，
         畫完（或跳過）就直接換下一題。 */
      var turnendText = ev.entry.total > 0
        ? (globalThis.I18N ? globalThis.I18N.t("text.204") : "答案是「") + ev.entry.word + '」，' + ev.entry.correct + '/' + ev.entry.total + (globalThis.I18N ? globalThis.I18N.t("text.205") : " 人猜中。")
        : (globalThis.I18N ? globalThis.I18N.t("text.204") : "答案是「") + ev.entry.word + (globalThis.I18N ? globalThis.I18N.t("text.203") : "」，換下一題。");
      pushFeed({ kind: 'system', get from() { return globalThis.I18N ? globalThis.I18N.t("text.173") : "系統"; }, text: turnendText, at: Date.now() });
      Sound.play(ev.entry.correct > 0 ? 'turn' : 'timeup');
      if (app.paint) { app.paint.clearRedo(); }
    } else if (ev.type === 'turnstart') {
      if (app.paint) { app.paint.clearLocal(); app.paint.clearRedo(); }
    } else if (ev.type === 'gameover') {
      Sound.play('win');
    }
  }
}

export function startLoop() {
  stopLoop();
  app.loop = setInterval(function () {
    if (app.mode === 'solo') soloStep();
    else updateTimers();
  }, LOOP_MS);
}
export function stopLoop() { if (app.loop) { clearInterval(app.loop); app.loop = 0; } }
