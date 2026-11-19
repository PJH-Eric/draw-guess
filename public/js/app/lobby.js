/* ===== app/lobby.js — 線上大廳 ===== */

import { $, Cfg, D, S, Sound, Store, Words, app, esc, paintIcons, show, toast } from './core.js?v=73830c6027';
import { WORD_LANGS, categoryChoices, wordLangLabel } from './menus.js?v=73830c6027';
import { startLoop, stopLoop } from './solo.js?v=73830c6027';
import { ensurePaint } from './canvas.js?v=73830c6027';
import { render } from './render.js?v=73830c6027';
import { DIFF_CHOICES, morphChildren, openRoomCreate } from './overlay.js?v=73830c6027';

var w = window;

/* ================================================================
   大廳與線上
   ================================================================ */

/** 從輸入框收暱稱：清空就重新配一個可愛名字，兩個輸入框一起同步。
    沒有名字的人在猜題紀錄與席位卡上會全部都叫「玩家」，分不出誰是誰。 */
export function saveNick(el) {
  Store.nick(String(el.value || '').trim().slice(0, 12));
  var n = Store.ensureNick();
  el.value = n;
  var other = el.id === 'lobby-nick' ? $('settings-nick') : $('lobby-nick');
  if (other) other.value = n;
  return n;
}

export function setupLobby() {
  $('lobby-nick').addEventListener('change', function () { saveNick(this); });
  $('b-lobby-host').addEventListener('click', function () {
    saveNick($('lobby-nick'));
    Sound.play('click');
    openRoomCreate();
  });
  $('b-lobby-join').addEventListener('click', function () {
    var code = $('lobby-code').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    if (code.length !== 4) return toast((globalThis.I18N ? globalThis.I18N.t("text.025") : "房號是 4 個英數字。"), 'error');
    joinRoom(code, null, 'player');
  });
  /* 房號打完直接按 Enter 就加入 */
  $('lobby-code').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); $('b-lobby-join').click(); }
  });
  $('b-lobby-refresh').addEventListener('click', subscribeLobby);
  resetRoomFilter();
  setupRoomFilter();
  $('b-lobby-retry').addEventListener('click', connectOnline);
  /* 邀請連結不綁身分：對方自己按「加入當玩家」或「加入觀戰」，見 checkPendingInvite。 */
  $('b-lobby-invite-player').addEventListener('click', function () {
    if (!app.pendingInvite) return;
    saveNick($('lobby-nick'));
    joinRoom(app.pendingInvite.code, app.pendingInvite.token, 'player');
  });
  $('b-lobby-invite-spectator').addEventListener('click', function () {
    if (!app.pendingInvite) return;
    saveNick($('lobby-nick'));
    joinRoom(app.pendingInvite.code, app.pendingInvite.token, 'spectator');
  });
  $('b-lobby-invite-cancel').addEventListener('click', function () {
    app.pendingInvite = null;
    clearInviteParams();
    $('lobby-invite').hidden = true;
  });
}

/**
 * @param {object} [opts]
 *   rejoin  斷線重連：已經在這間房的畫面上，成功就只要求重新同步，不要把邀請連結、聊天草稿清掉；
 *           失敗（房間關了、座位被收回）就直接顯示「房間已經結束」，不要停在凍住的舊畫面
 *   resume  重新整理頁面後自動回到原本的房間：失敗就留在大廳並說明原因
 */
export function joinRoom(code, token, role, opts) {
  opts = opts || {};
  w.Online.send('room:join', { code: code, token: token, role: role, name: Store.ensureNick() }, function (res) {
    if (!res || !res.ok) {
      var why = (res && w.I18N.message(res.error, res.params)) || (globalThis.I18N ? globalThis.I18N.t("text.024") : "加入失敗。");
      if (opts.rejoin && app.mode === 'online' && app.view) {
        forgetRoom();
        app.view.room.closed = true;
        app.view.room.closedReason = (globalThis.I18N ? globalThis.I18N.t("text.023") : "回不到原本的房間了：") + why;
        app.lastOverlayHtml = null;
        render();
        return;
      }
      if (opts.resume) { forgetRoom(); return toast((globalThis.I18N ? globalThis.I18N.t("text.022") : "原本的房間回不去了：") + why, 'error'); }
      return toast(why, 'error');
    }
    if (res.downgraded) toast((globalThis.I18N ? globalThis.I18N.t("text.021") : "位子滿了（或對局進行中），你先以觀戰身分進來。"), 'info');
    app.pendingInvite = null;
    $('lobby-invite').hidden = true;
    if (token) clearInviteParams();
    if (opts.rejoin && app.mode === 'online' && app.roomCode === res.code) {
      w.Online.send('room:resync', {});
      return;
    }
    enterOnlineRoom(res.code);
  });
}

/* 重新整理頁面後自動回到房間：房號只記在這個分頁（sessionStorage），按「離開房間」就忘掉 */
export function rememberRoom(code) { try { w.sessionStorage.setItem('dg_room', code); } catch (e) { /* 存不了就算了 */ } }
export function forgetRoom() { try { w.sessionStorage.removeItem('dg_room'); } catch (e) { /* 同上 */ } }
export function savedRoom() { try { return w.sessionStorage.getItem('dg_room') || null; } catch (e) { return null; } }

/* 邀請連結用過（或確定不能用）之後，把網址上的 ?room=&invite= 拿掉：
   不然離開房間回到大廳時又會跳出同一張「收到房間邀請」 */
export function clearInviteParams() {
  try {
    var u = new URL(w.location.href);
    if (!u.searchParams.has('invite') && !u.searchParams.has('room')) return;
    u.searchParams.delete('invite');
    u.searchParams.delete('room');
    w.history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
  } catch (e) { /* 舊瀏覽器就維持原樣 */ }
}

export function enterOnlineRoom(code) {
  app.mode = 'online';
  app.roomCode = code;
  app.view = null;
  app.feed = [];
  app.feedSeen = {};
  app.lastTurnKey = '';
  app.lastPhase = '';
  app.lastGuessedCount = 0;
  app.inviteToken = null;
  app.inviteUrl = '';
  app.chatDraft = '';
  app.ruleMenuOpen = null;
  app.lastOverlayHtml = null;
  D.body.classList.remove('solo-mode');
  rememberRoom(code);
  show('s-game');
  ensurePaint();
  app.paint.clearLocal();
  app.paint.clearRedo();
  startLoop();
  /* 保險：萬一第一份投影比 ack 早到而被丟掉，這裡再要一次 */
  w.Online.send('room:resync', {});
  Sound.play('join');
}

export function leaveGame(target) {
  if (app.mode === 'solo') GameAnalytics.end({ result: 'complete' });
  if (app.mode === 'online') w.Online.send('room:leave', {});
  forgetRoom();
  D.body.classList.remove('solo-mode');
  stopLoop();
  app.mode = null;
  app.solo = null;
  app.view = null;
  app.roomCode = null;
  if (app.paint) { app.paint.setEnabled(false); app.paint.clearLocal(); }
  show(target || 's-home');
  if (target === 's-lobby') connectOnline();
}

/** 目前大廳是哪一種：'classic'／'relay'／'pickdraw'（其他值一律當一般大廳） */
export function lobbyModeKey() {
  return app.lobbyMode === 'relay' || app.lobbyMode === 'pickdraw' ? app.lobbyMode : 'classic';
}

/** 訂閱大廳：帶上目前是哪一種大廳，伺服器只推那一種房間 */
export function subscribeLobby() {
  w.Online.send('lobby:subscribe', { mode: lobbyModeKey() });
}

/* 一般大廳與接力大廳共用同一個畫面：標題、說明與開房說明跟著模式換。
   換的是 data-i18n 的 key，切換語系時 I18N 會照新的 key 重新套用。 */
function setI18nKey(el, key) {
  if (!el) return;
  el.setAttribute('data-i18n', key);
  el.textContent = w.I18N.t(key);
}

export function applyLobbyMode() {
  var mode = lobbyModeKey();
  var relay = mode === 'relay', pickdraw = mode === 'pickdraw';
  D.body.classList.toggle('lobby-relay', relay);
  D.body.classList.toggle('lobby-pickdraw', pickdraw);
  setI18nKey($('lobby-title').querySelector('[data-i18n]'), relay ? 'relay.name' : (pickdraw ? 'pickdraw.name' : 'text.211'));
  setI18nKey(D.querySelector('#s-lobby [data-i18n="lobby.host.desc"], #s-lobby [data-i18n="relay.hostDesc"], #s-lobby [data-i18n="pickdraw.hostDesc"]'),
    relay ? 'relay.hostDesc' : (pickdraw ? 'pickdraw.hostDesc' : 'lobby.host.desc'));
  $('relay-lobby-note').hidden = !relay;
  $('pickdraw-lobby-note').hidden = !pickdraw;
  /* GA4：你出我畫他猜大廳送虛擬路徑 /pickdraw 的 page_view */
  if (pickdraw && w.GameAnalytics) w.GameAnalytics.pageView('pickdraw_lobby');
  /* GA4：接力大廳送虛擬路徑 /relay 的 page_view（一般大廳維持原本的統計方式） */
  if (relay && w.GameAnalytics) w.GameAnalytics.pageView('relay_lobby');
}

/** 連線之前先把會送出請求的按鈕停用，避免按了卻沒有送出去 */
export function setLobbyEnabled(on) {
  ['b-lobby-host', 'b-lobby-join', 'b-lobby-refresh', 'b-lobby-quick', 'b-lobby-invite-player', 'b-lobby-invite-spectator'].forEach(function (id) {
    var el = $(id);
    if (el) el.disabled = !on;
  });
}

/* 連線狀態記 key 不記字串，切換語系時才有辦法重畫 */
export function setLobbyState(key, tail) {
  app.lobbyState = { key: key, tail: tail || '' };
  $('lobby-state').textContent = w.I18N.t(key) + (tail || '');
  /* 狀態標籤前面的小燈：已連線是綠的，其餘（連線中、回房間中）是黃的 */
  $('lobby-state').setAttribute('data-ok', String(key === 'text.017'));
}

export function connectOnline() {
  applyLobbyMode();
  $('lobby-nick').value = Store.ensureNick();
  setLobbyEnabled(false);
  if (!Cfg.isOnlineEnabled()) {
    $('lobby-off').hidden = false;
    $('lobby-live').hidden = true;
    $('lobby-off-note').textContent = Cfg.status === 'invalid'
      ? ((globalThis.I18N ? globalThis.I18N.t("text.020") : "伺服器設定有問題：") + Cfg.error)
      : (globalThis.I18N ? globalThis.I18N.t("text.019") : "線上對戰需要一台開著的伺服器。單機練習完全不受影響，可以直接玩。");
    return;
  }
  setLobbyState('text.018');
  w.Online.connect({ clientId: Store.clientId(), name: Store.ensureNick() })
    .then(function () {
      $('lobby-off').hidden = true;
      $('lobby-live').hidden = false;
      setLobbyEnabled(true);
      subscribeLobby();
      setLobbyState('text.017');
      checkPendingInvite();
      /* 重新整理前在房間裡：自動回去（有邀請連結的話以邀請為準） */
      var entry = Cfg.entry();
      if (app.resumeRoom && !(entry.room && entry.invite) && app.mode !== 'online') {
        var code = app.resumeRoom;
        app.resumeRoom = null;
        setLobbyState('text.016', code + '…');
        joinRoom(code, null, null, { resume: true });
      }
    })
    .catch(function (e) {
      setLobbyEnabled(false);
      $('lobby-off').hidden = false;
      $('lobby-live').hidden = true;
      $('lobby-off-note').textContent = e.message || (globalThis.I18N ? globalThis.I18N.t("text.015") : "連不到伺服器。");
    });
}

/** 邀請連結：先停在大廳讓被邀請者確認暱稱，確認後才送出加入 */
export function checkPendingInvite() {
  var entry = Cfg.entry();
  if (!entry.room || !entry.invite) return;
  w.Online.send('invite:check', { code: entry.room, token: entry.invite }, function (res) {
    var box = $('lobby-invite');
    box.hidden = false;
    if (!res || !res.ok) {
      app.pendingInvite = null;
      $('lobby-invite-title').textContent = (globalThis.I18N ? globalThis.I18N.t("text.014") : "這個邀請連結不能用了");
      $('lobby-invite-note').textContent = (res && w.I18N.message(res.error, res.params)) || (globalThis.I18N ? globalThis.I18N.t("text.013") : "連結無效。");
      $('b-lobby-invite-player').hidden = true;
      $('b-lobby-invite-spectator').hidden = true;
      clearInviteParams();
      return;
    }
    /* 連結不綁身分，玩家還是觀戰由對方自己按下面兩顆鈕決定；
       res.note 是伺服器算出來的提醒（例如玩家席已滿），有的話一起顯示。 */
    app.pendingInvite = { code: entry.room, token: entry.invite };
    $('b-lobby-invite-player').hidden = false;
    $('b-lobby-invite-spectator').hidden = false;
    $('lobby-invite-title').textContent = (globalThis.I18N ? globalThis.I18N.t("text.012") : "收到房間 ") + entry.room + (globalThis.I18N ? globalThis.I18N.t("text.011") : " 的邀請");
    $('lobby-invite-note').textContent =
      (globalThis.I18N ? globalThis.I18N.t("text.010") : "可以先改上面的暱稱，再選要當玩家還是觀戰。") + (res.note ? '（' + res.note + '）' : '');
  });
}

/* 大廳房間卡片上的規則 chip：畫幾次、每題秒數、難度、題目種類、題目語系。
   純顯示（不是按鈕），窄螢幕自動換行；舊版伺服器沒送的欄位就不畫那一顆。 */
export function roomRuleChips(r) {
  var list = [];
  /* 接力房：猜題次數與每棒秒數取代一般模式的「畫幾次／每題秒數」 */
  if (r.mode === 'relay') {
    list.push({ k: 'mode', ico: 'relay', label: w.I18N.t('relay.badge') });
    if (r.guessRounds) list.push({ k: 'rounds', ico: 'pen', label: w.I18N.t('relay.rule.guessRounds', { n: r.guessRounds }) });
    if (r.batonSec) list.push({ k: 'sec', ico: 'clock', label: w.I18N.t('relay.rule.baton', { n: r.batonSec }) });
  }
  /* 你出我畫他猜：模式標記、圈數；每題秒數沿用一般模式那顆 chip */
  if (r.mode === 'pickdraw') {
    list.push({ k: 'pdmode', ico: 'pickdraw', label: w.I18N.t('pickdraw.badge') });
    if (r.laps) list.push({ k: 'rounds', ico: 'pen', label: w.I18N.t('pickdraw.rule.laps', { n: r.laps }) });
  }
  if (r.rounds) list.push({ k: 'rounds', ico: 'pen', label: (r.rounds === 1 ? w.I18N.t('lobby.rule.roundsOne') : w.I18N.t('lobby.rule.rounds', { n: r.rounds })) });
  if (r.drawSec) list.push({ k: 'sec', ico: 'clock', label: w.I18N.t('lobby.rule.sec', { n: r.drawSec }) });
  if (r.diff !== undefined) {
    var dl = DIFF_CHOICES.filter(function (d) { return d.v === r.diff; })[0];
    if (dl) list.push({ k: 'diff', label: dl.label });
  }
  if (r.category !== undefined) {
    var cat = r.category && Words.CATEGORIES[r.category];
    list.push({
      k: 'category',
      label: cat ? cat.emoji + ' ' + w.I18N.t('category.' + r.category) : w.I18N.t('category.all')
    });
  }
  if (r.wordLang) list.push({ k: 'lang', label: wordLangLabel(r.wordLang) });
  if (!list.length) return '';
  return '<span class="rc-rules" role="list" aria-label="' + esc(w.I18N.t('lobby.rules')) + '">' + list.map(function (c) {
    return '<span class="rc-rule" role="listitem" data-k="' + c.k + '">' +
      (c.ico ? '<span class="ico" data-ico="' + c.ico + '" aria-hidden="true"></span>' : '') +
      '<span class="rc-rule-t">' + esc(c.label) + '</span></span>';
  }).join('') + '</span>';
}

/* 大廳篩選：題目語系、題目種類、只看可加入。category 用 null 代表「不篩選」，
   因為空字串本身是一個合法的值（房間選了「全部種類」）。 */
export function resetRoomFilter() { app.roomFilter = { lang: '', category: null, open: false }; }

export function renderRoomFilter() {
  var f = app.roomFilter;
  var langs = [{ v: '', label: w.I18N.t('lobby.filter.langAll') }].concat(WORD_LANGS);
  var cats = [{ v: '*', label: w.I18N.t('lobby.filter.catAny') }].concat(categoryChoices());
  function fill(id, list, cur) {
    var html = list.map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (o.v === cur ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');
    var el = $(id);
    if (el.getAttribute('data-sig') !== html) { el.innerHTML = html; el.setAttribute('data-sig', html); }
  }
  fill('lobby-filter-lang', langs, f.lang);
  fill('lobby-filter-category', cats, f.category === null ? '*' : f.category);
  $('lobby-filter-open').setAttribute('aria-pressed', String(!!f.open));
}

export function setupRoomFilter() {
  $('lobby-filter-lang').addEventListener('change', function () {
    app.roomFilter.lang = this.value;
    renderRoomList(app.rooms);
  });
  $('lobby-filter-category').addEventListener('change', function () {
    app.roomFilter.category = this.value === '*' ? null : this.value;
    renderRoomList(app.rooms);
  });
  $('lobby-filter-open').addEventListener('click', function () {
    app.roomFilter.open = !app.roomFilter.open;
    Sound.play('click');
    renderRoomList(app.rooms);
  });
  $('b-lobby-quick').addEventListener('click', quickJoin);
  /* 房間卡片的按鈕用事件委派：列表是就地更新的（見 renderRoomList），不用每次重綁 */
  $('roomlist').addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('button[data-act]') : null;
    if (!btn || btn.disabled) return;
    var act = btn.getAttribute('data-act');
    if (act === 'join') joinRoom(btn.getAttribute('data-code'), null, 'player');
    else if (act === 'watch') joinRoom(btn.getAttribute('data-code'), null, 'spectator');
    else if (act === 'host') $('b-lobby-host').click();
    else if (act === 'filter-clear') {
      resetRoomFilter();
      renderRoomList(app.rooms);
      var first = $('lobby-filter-lang-button');
      if (first) first.focus();
    }
  });
}

/** 套用篩選之後看得到的房間 */
export function visibleRooms(rooms) {
  var f = app.roomFilter;
  return (rooms || []).filter(function (r) {
    return (!f.lang || r.wordLang === f.lang) &&
      (f.category === null || (r.category || '') === f.category) &&
      (!f.open || r.players < r.maxPlayers);
  });
}

/** 快速加入：第一間「等待中、還有空位、符合目前篩選」的房間（列表本來就把等待中的排前面） */
export function quickJoin() {
  var pick = visibleRooms(app.rooms).filter(function (r) { return r.phase === 'waiting' && r.players < r.maxPlayers; })[0];
  if (!pick) { toast(w.I18N.t('lobby.quick.none'), 'error'); return; }
  Sound.play('click');
  joinRoom(pick.code, null, 'player');
}

/* 房間裡有幾個人用小頭像表示（最多畫 5 個，其餘寫 +N）。只是人數的圖像化，不代表是誰。 */
export function roomFaces(r) {
  var n = Math.min(r.players, 5), out = '';
  for (var i = 0; i < n; i++) out += '<span class="rc-face">' + S.face(i, 'idle') + '</span>';
  if (r.players > n) out += '<span class="rc-more">' + esc(w.I18N.t('lobby.more', { n: r.players - n })) + '</span>';
  return '<span class="rc-faces" aria-hidden="true">' + out + '</span>';
}

export function roomCardHtml(r) {
  var phase = { get waiting() { return globalThis.I18N ? globalThis.I18N.t("text.008") : "等待中"; }, get playing() { return globalThis.I18N ? globalThis.I18N.t("text.007") : "進行中"; }, get finished() { return globalThis.I18N ? globalThis.I18N.t("text.006") : "已結束"; } }[r.phase] || r.phase;
  var code = esc(r.code);
  return '<div class="roomcard"><span class="rc-code">' + code + '</span>' +
    '<span class="rc-main"><b class="rc-name">' + esc(r.name) + '</b>' +
    '<span class="rc-sub"><span class="rc-badge" data-p="' + esc(r.phase) + '">' + esc(phase) + '</span>' +
    (r.phase === 'playing' && r.turnNo && r.totalTurns
      ? '<span class="rc-progress">' + esc(w.I18N.t('lobby.progress', { n: r.turnNo, total: r.totalTurns })) + '</span>' : '') +
    roomFaces(r) +
    r.players + '/' + r.maxPlayers + (globalThis.I18N ? globalThis.I18N.t("text.005") : " 位玩家") +
    (r.spectators ? '・' + r.spectators + (globalThis.I18N ? globalThis.I18N.t("text.004") : " 觀戰") : '') +
    (globalThis.I18N ? globalThis.I18N.t("text.003") : "・房主 ") + esc(r.host) + '</span>' +
    roomRuleChips(r) + '</span>' +
    '<span class="rc-btns">' +
    (r.players >= r.maxPlayers
      /* 滿房按「加入」只會被伺服器轉成觀戰，不如直接講清楚 */
      ? '<button class="btn3d small" data-color="cream" disabled>' + esc(w.I18N.t('lobby.full')) + '</button>'
      : '<button class="btn3d small" data-color="mint" data-act="join" data-code="' + code + '">' + esc(w.I18N.t('text.369')) + '</button>') +
    '<button class="btn3d small" data-color="sky" data-act="watch" data-code="' + code + '">' + esc(w.I18N.t('text.317')) + '</button>' +
    '</span></div>';
}

export function renderRoomList(rooms) {
  app.rooms = rooms;
  var host = $('roomlist');
  var total = rooms ? rooms.length : 0;
  if (!app.roomFilter) resetRoomFilter();
  $('lobby-filter').hidden = !total;
  $('b-lobby-quick').hidden = !total;
  renderRoomFilter();

  var html;
  if (!total) {
    /* 沒有公開房間：給一張有下一步的空狀態卡，不要只丟一行字 */
    html = '<div class="lobby-empty"><span class="lobby-empty-face" aria-hidden="true">' + S.face(4, 'idle') + '</span>' +
      '<h3>' + esc(w.I18N.t('lobby.empty.title')) + '</h3><p>' + esc(w.I18N.t({ relay: 'relay.emptyText', pickdraw: 'pickdraw.emptyText' }[lobbyModeKey()] || 'text.009')) + '</p>' +
      '<button class="btn3d" data-color="mint" data-act="host">' + esc(w.I18N.t('text.362')) + '</button></div>';
  } else {
    var list = visibleRooms(rooms);
    html = list.length ? list.map(roomCardHtml).join('')
      : '<p class="hint-note">' + esc(w.I18N.t('lobby.filter.none')) + '</p>' +
        '<button class="btn3d small" data-color="cream" data-act="filter-clear" id="b-lobby-filter-clear">' + esc(w.I18N.t('lobby.filter.clear')) + '</button>';
  }
  /* 就地更新而不是整塊 innerHTML 重建：大廳每次有人進出都會推一次列表，
     重建會讓卡片閃一下，鍵盤焦點也會從按鈕上掉下來。 */
  var tpl = D.createElement('div');
  tpl.innerHTML = html;
  morphChildren(host, tpl);
  S.decorateAll(host);
  paintIcons(host);
}
