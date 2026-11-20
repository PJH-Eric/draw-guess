/* ===== app/online-events.js — 線上事件 ===== */

import { $, Sound, Store, Words, app, toast } from './core.js?v=363abaebc3';
import { modals } from './modal.js?v=363abaebc3';
import { localizeGame } from './solo.js?v=363abaebc3';
import { pushFeed, replaceFeed } from './feed.js?v=363abaebc3';
import { render } from './render.js?v=363abaebc3';
import { renderAside } from './overlay.js?v=363abaebc3';
import { renderGameSettings } from './game-settings.js?v=363abaebc3';
import { isRelayGame, relayRecord, relayTransition, showCheer } from './relay.js?v=363abaebc3';
import { isPickdrawGame, pickdrawRecord, pickdrawTransition } from './pickdraw.js?v=363abaebc3';
import { forgetRoom, joinRoom, leaveGame, lobbyModeKey, renderRoomList, saveNick, setLobbyEnabled, subscribeLobby } from './lobby.js?v=363abaebc3';

var w = window;

/* -------------------------------------------------------- 線上事件 */

export function renderOnlineCount() {
  var el = $('lobby-online-count');
  var valid = app.conn && app.conn.status === 'connected' && Number.isInteger(app.onlineCount);
  el.hidden = !valid;
  el.textContent = valid ? w.I18N.t('lobby.onlineCount', { n: app.onlineCount }) : '';
}

/* ------------------------------------------------------------ 線上：大廳聊天室（左下氣泡） */

export function setupLobbyChat(O) {
  if (!w.LobbyChat) return;
  var chat = w.LobbyChat.create({
    game: 'draw-guess',
    defaultOpen: false,   // 展開的面板會蓋到房間列表，預設先收成氣泡
    mount: '#app',
    watch: '#s-lobby',
    getName: function () { return Store.ensureNick(); },
    setName: function (n) { $('lobby-nick').value = n.slice(0, 12); saveNick($('lobby-nick')); },
    join: function (name) { O.send('lobbychat:join', { name: name }); },
    leave: function () { O.send('lobbychat:leave', {}); },
    send: function (text, name) { O.send('lobbychat:send', { text: text, name: name }); },
    joinRoom: function (code) { joinRoom(code, null, null); }
  });
  chat.bindSetting({ input: '#settings-lobbychat', label: '#settings-lobbychat-label', sub: '#settings-lobbychat-sub', reset: '#settings-reset' });
  O.on('status', function (s) { chat.setConnected(!!s && s.status === 'connected'); });
  O.on('lobbychat:history', function (p) { chat.history(p.history, p.online); });
  O.on('lobbychat:msg', function (p) { chat.add(p.msg); });
  O.on('lobbychat:online', function (p) { chat.online(p.online); });
  O.on('lobbychat:error', function (p) { chat.error(p.code); });
}

export function setupOnlineEvents() {
  var O = w.Online;
  setupLobbyChat(O);

  O.on('status', function (s) {
    app.conn = s;
    if (s.status !== 'connected') app.onlineCount = null;
    renderOnlineCount();
    if (app.screen === 's-lobby') {
      if (s.message) { app.lobbyState = null; $('lobby-state').textContent = s.message; $('lobby-state').setAttribute('data-ok', 'false'); }
      setLobbyEnabled(s.status === 'connected');
    }
    if (app.view) renderAside();
  });

  O.on('lobby:rooms', function (p) {
    /* 剛從一般大廳切到接力大廳（或反過來）時，舊模式的列表可能還在路上：不是這個大廳的就略過 */
    if (p.mode && p.mode !== lobbyModeKey()) return;
    app.onlineCount = Number.isInteger(p.online) && p.online >= 0 ? p.online : null;
    renderOnlineCount();
    renderRoomList(p.rooms);
  });

  O.on('room:sync', function (v) {
    localizeGame(v.game);
    if (app.mode !== 'online') return;
    var prev = app.view;
    app.view = v;
    if (v.room.mode === 'relay' && w.GameAnalytics) GameAnalytics.pageView('relay_room');
    if (v.room.mode === 'pickdraw' && w.GameAnalytics) GameAnalytics.pageView('pickdraw_room');
    if (v.game) GameAnalytics.sync(v.room.phase, v.room.code + '|' + v.game.seed, {
      mode: v.room.mode === 'relay' || v.room.mode === 'pickdraw' ? v.room.mode : 'online', difficulty: v.game.diff, players: v.game.players.length, spectator: v.you.role !== 'player'
    }, { result: v.game.winners && v.game.winners.indexOf(v.you.id) >= 0 ? 'win' : 'lose' });
    app.roomCode = v.room.code;
    /* 回大廳時回到跟這間房同一種的大廳（邀請連結進來的人一開始不知道是哪一種） */
    app.lobbyMode = v.room.mode === 'relay' || v.room.mode === 'pickdraw' ? v.room.mode : 'classic';
    /* 房間用的題目語系本機還沒載入（別人開的英文／簡中房）：補載，好了再重畫一次 */
    if (v.game && v.game.lang && w.LazyPacks && !Words.hasLang(v.game.lang)) {
      w.LazyPacks.words(v.game.lang, function (ok) { if (ok && app.mode === 'online' && app.view) render(); });
    }

    /* 換題／換階段：清畫布、播音效 */
    var key = v.game ? (v.game.turnNo + ':' + v.game.phase) : (v.room.phase);
    if (v.game && prev && prev.game && prev.game.turnNo !== v.game.turnNo) {
      app.paint.clearLocal();
      app.paint.clearRedo();
    }
    if (key !== app.lastTurnKey) {
      app.lastTurnKey = key;
      /* 接力每一棒都會進 drawing：音效與震動交給 relayTransition，只提醒該提醒的人 */
      if (v.game && v.game.phase === 'drawing' && !isRelayGame(v.game) && !isPickdrawGame(v.game)) Sound.play('turn');
      if (v.game && v.game.phase === 'over') {
        Sound.play(v.game.winners.indexOf(v.you.id) >= 0 ? 'win' : 'lose');
        recordResult(v);
      }
    }

    /* 筆畫：有整張就換掉，沒有就比對筆數，對不上主動要求重新同步 */
    if (v.game && v.game.strokes) app.paint.setStrokes(v.game.strokes);
    else if (v.game && typeof v.game.strokeCount === 'number' && v.game.strokeCount !== app.paint.count()) {
      O.send('room:resync', {});
    }

    if (isRelayGame(v.game)) relayTransition(prev, v);
    if (isPickdrawGame(v.game)) pickdrawTransition(prev, v);
    if (v.room.feed) replaceFeed(v.room.feed);
    render();
    if (modals.game && modals.game.isOpen()) renderGameSettings();
  });

  O.on('room:stroke', function (p) {
    if (app.mode !== 'online' || !p.stroke) return;
    /* 自己剛剛畫的那一筆已經在本機畫過了，筆數相同就略過 */
    if (app.paint.count() >= p.count) return;
    if (app.paint.count() < p.count - 1) { O.send('room:resync', {}); return; }
    app.paint.addStroke(p.stroke);
    Sound.playPen();
  });

  O.on('room:board', function (p) {
    if (app.mode !== 'online') return;
    if (p.action === 'clear') { app.paint.clearLocal(); Sound.play('clear'); return; }
    var list = app.paint.strokes();
    if (list.length > p.count) app.paint.setStrokes(list.slice(0, p.count));
    else if (list.length < p.count) O.send('room:resync', {});
    Sound.play('undo');
  });

  /* 接力：別的畫家丟給當下作畫者的表情（猜題者收不到） */
  O.on('room:cheer', function (p) {
    if (app.mode !== 'online') return;
    showCheer(p);
  });

  O.on('room:feed', function (p) {
    if (app.mode !== 'online') return;
    pushFeed(p.entry);
    Sound.playChat();
  });

  O.on('room:private', function (p) {
    if (p.kind === 'hit') { toast(w.I18N.message(p.message, p.params), 'ok'); Sound.play('correct'); Sound.vibrate([12, 40, 12]); }
    else if (p.kind === 'close') { toast(w.I18N.message(p.message, p.params), 'ok'); Sound.play('close'); }
    else if (p.kind === 'miss') { Sound.play('wrong'); }
    else if (p.kind === 'rejected') { toast(w.I18N.message(p.message, p.params), 'error'); Sound.play('blocked'); }
  });

  O.on('room:error', function (p) { toast(w.I18N.message(p.message, p.params), 'error'); Sound.play('blocked'); });

  O.on('room:closed', function (p) {
    if (app.mode !== 'online') return;
    forgetRoom();
    if (app.view) {
      app.view.room.closed = true;
      app.view.room.closedReason = p.reason;
      render();
    }
    toast(w.I18N.message(p.reason), 'error');
    Sound.play('leave');
  });

  /* 被投票請出房間：伺服器已經把這條連線移出房間了，這裡回大廳並講清楚原因 */
  O.on('room:kicked', function () {
    if (app.mode !== 'online') return;
    forgetRoom();
    leaveGame('s-lobby');
    toast(w.I18N.t('kick.youKicked'), 'error');
    Sound.play('leave');
  });

  O.on('room:left', function () {
    app.roomCode = null;
  });

  O.on('reconnected', function () {
    if (app.mode === 'online' && app.roomCode) {
      joinRoom(app.roomCode, null, null, { rejoin: true });
    } else if (app.screen === 's-lobby') {
      subscribeLobby();
    }
  });
}

/**
 * 戰績只記一次：用「這一局」本身當鑰匙（種子＋開局時間），不是用一個會被重設的旗標。
 * 以前在結算畫面斷線重連會重設旗標 → 同一局記兩次；線上「再開一局」又沒重設 → 下一局完全沒記到。
 * 鑰匙存在 sessionStorage，重新整理頁面自動回到房間時也不會重記。
 */
export function recordedKeys() {
  try { return JSON.parse(w.sessionStorage.getItem('dg_recorded') || '[]'); } catch (e) { return []; }
}
export function recordResult(v) {
  if (!v.game) return;
  var gameKey = app.mode + ':' + v.game.seed + ':' + v.game.startedAt;
  var keys = recordedKeys();
  if (app.recordedKey === gameKey || keys.indexOf(gameKey) >= 0) return;
  app.recordedKey = gameKey;
  try { w.sessionStorage.setItem('dg_recorded', JSON.stringify(keys.concat(gameKey).slice(-20))); } catch (e) { /* 私密模式存不了就算了，記憶體裡的鑰匙還是擋得住 */ }
  var me = null;
  for (var i = 0; i < v.game.players.length; i++) if (v.game.players[i].id === v.you.id) me = v.game.players[i];
  if (!me) return;
  var correct = 0;
  if (isRelayGame(v.game) || isPickdrawGame(v.game)) {
    var rr = isRelayGame(v.game) ? relayRecord(v) : pickdrawRecord(v);
    Store.recordGame(isRelayGame(v.game) ? 'relay' : 'pickdraw', { win: v.game.winners.indexOf(v.you.id) >= 0, correct: rr.correct, drawn: rr.drawn, score: me.score });
    return;
  }
  for (var j = 0; j < v.game.log.length; j++) {
    var g = v.game.log[j].guessed || [];
    for (var k = 0; k < g.length; k++) if (g[k].id === v.you.id) correct++;
  }
  Store.recordGame(app.mode === 'online' ? 'online' : 'solo', {
    win: v.game.winners.indexOf(v.you.id) >= 0,
    correct: correct,
    drawn: me.drew,
    score: me.score
  });
}
