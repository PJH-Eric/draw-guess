/* ===== app/main.js — 啟動 ===== */

import { $, Cfg, D, S, Sound, Store, app, paintIcons, show } from './core.js?v=a602eaaae6';
import { askLeaveGame, modals, setupConfirm, setupReference } from './modal.js?v=a602eaaae6';
import { applyDisplaySettings, setupSettings, syncSettingsUI } from './settings.js?v=a602eaaae6';
import { renderSoloOptions, renderStats, renderTutorial, setupSoloScreen, setupTutorial, tut } from './menus.js?v=a602eaaae6';
import { layoutAside, relayoutFeed, renderRecent, setAsideOpen } from './feed.js?v=a602eaaae6';
import { buildToolbar, ensurePaint, layoutStage, syncToolbar } from './canvas.js?v=a602eaaae6';
import { setupGuessbar } from './guess.js?v=a602eaaae6';
import { render } from './render.js?v=a602eaaae6';
import { placeCanvasTop, placeGuessFeed, placeSoloActions, renderRoomCreateOptions, setupOverlayEvents, setupRoomCreate, syncGuessbarSpace } from './overlay.js?v=a602eaaae6';
import { renderGameSettings, setupGameSettings } from './game-settings.js?v=a602eaaae6';
import { connectOnline, leaveGame, renderRoomList, savedRoom, setLobbyState, setupLobby } from './lobby.js?v=a602eaaae6';
import { renderOnlineCount, setupOnlineEvents } from './online-events.js?v=a602eaaae6';
import { setupHistory } from './history.js?v=a602eaaae6';
import { setupGallery } from './gallery.js?v=a602eaaae6';
import { setupKeys, setupRuleMenuClose } from './keys.js?v=a602eaaae6';

var w = window;

/* ================================================================
   啟動
   ================================================================ */

export function init() {
  w.I18N.mountToggle({ after: $('b-settings') });
  w.I18N.onChange(function () {
    app.lastOverlayHtml = null;
    $('logo').innerHTML = S.logo();
    renderSoloOptions();
    syncSettingsUI();
    if (app.lobbyState) setLobbyState(app.lobbyState.key, app.lobbyState.tail);
    if (app.rooms) renderRoomList(app.rooms);
    renderOnlineCount();
    if (modals.game && modals.game.isOpen()) renderGameSettings();
    if (modals.roomCreate && modals.roomCreate.isOpen()) renderRoomCreateOptions();
    if (app.screen === 's-help') renderTutorial();
    if (app.screen === 's-stats') renderStats();
    render(); syncToolbar(); renderRecent();
    var link = D.querySelector('.lobby-home-link');
    if (link) link.href = w.I18N.withLang(link.href);
  });

  $('logo').innerHTML = S.logo();
  paintIcons();
  S.decorateAll();
  S.decorateBackground($('bgdeco'), 12);
  applyDisplaySettings();

  setupSettings();
  setupReference();
  setupConfirm();
  setupRoomCreate();
  setupGameSettings();
  setupTutorial();
  setupSoloScreen();
  setupLobby();
  setupGuessbar();
  setupOnlineEvents();
  setupKeys();
  setupRuleMenuClose();
  setupOverlayEvents();
  setupGallery();
  buildToolbar();
  ensurePaint();
  syncToolbar();

  $('b-solo').addEventListener('click', function () { Sound.play('click'); show('s-solo'); });
  $('b-online').addEventListener('click', function () { Sound.play('click'); show('s-lobby'); connectOnline(); });
  $('b-help').addEventListener('click', function () { Sound.play('click'); tut.index = 0; show('s-help'); renderTutorial(); });
  $('b-stats').addEventListener('click', function () { Sound.play('click'); renderStats(); show('s-stats'); });

  var backs = D.querySelectorAll('[data-back]');
  for (var i = 0; i < backs.length; i++) {
    (function (b) {
      b.addEventListener('click', function () { Sound.play('click'); show(b.getAttribute('data-back')); });
    }(backs[i]));
  }

  $('b-game-back').addEventListener('click', function () {
    /* 對局已經結束就不用再問，直接走 */
    var g = app.view && app.view.game;
    var done = (app.view && app.view.room && app.view.room.closed) || (g && g.phase === 'over') || !g;
    if (done) { leaveGame(app.mode === 'online' ? 's-lobby' : 's-home'); return; }
    askLeaveGame();
  });
  $('b-aside-toggle').addEventListener('click', function () { setAsideOpen(!app.asideOpen); Sound.play('click'); });
  $('b-aside-close').addEventListener('click', function () { setAsideOpen(false); });
  /* 音訊必須等第一次使用者手勢才能解鎖 */
  var unlock = function () {
    Sound.unlock();
    Sound.startBgm(app.screen === 's-game' ? 'draw' : 'menu');
    D.removeEventListener('pointerdown', unlock);
    D.removeEventListener('keydown', unlock);
  };
  D.addEventListener('pointerdown', unlock);
  D.addEventListener('keydown', unlock);

  w.addEventListener('resize', function () { placeCanvasTop(); placeSoloActions(); placeGuessFeed(); syncGuessbarSpace(); relayoutFeed(); layoutStage(); layoutAside(); });
  w.addEventListener('orientationchange', function () { setTimeout(function () { placeCanvasTop(); placeSoloActions(); placeGuessFeed(); syncGuessbarSpace(); relayoutFeed(); layoutStage(); layoutAside(); }, 250); });
  relayoutFeed();
  layoutStage();

  /* 帶著邀請連結進來：直接停在大廳讓使用者確認暱稱 */
  var entry = Cfg.entry();
  var resume = savedRoom();
  if (entry.room && entry.invite) { show('s-lobby'); connectOnline(); }
  else if (resume && Cfg.isOnlineEnabled()) { app.resumeRoom = resume; show('s-lobby'); connectOnline(); }
  else if (!Store.tutorialDone()) { tut.index = 0; show('s-help'); renderTutorial(); }
  setupHistory();
}

if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init);
else init();

/* 給自動化檢查用 */
w.DrawGuessApp = app;
