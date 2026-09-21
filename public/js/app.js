/* ===== app.js — 畫面、輸入與流程 =====
 *
 * 這一層只負責「呈現狀態」與「把玩家意圖送出去」，不自己判斷規則。
 *   單機：自己持有完整的 Rules state，用同一份 Rules + AI 推進。
 *   線上：狀態在伺服器，這裡只收 Rules.toPublic 投影，權限一律看 you.can。
 * 兩種模式最後都收斂成同一個 view 物件，所以只有一套畫面程式碼。
 *
 * 這個遊戲沒有聊天室：唯一的文字輸入就是猜題框，左下的「猜題紀錄」是唯讀的。
 */
(function (w) {
  'use strict';

  var D = document;
  var $ = function (id) { return D.getElementById(id); };
  var Rules = w.Rules, AI = w.AI, Words = w.Words, RNG = w.RNG;
  var Cfg = w.GameConfig, S = w.SvgUI, Store = w.Store, Sound = w.Sound, Paint = w.Paint;

  var ME = 'me';                    // 單機模式裡自己的玩家 id
  var LOOP_MS = 120;                // 單機推進與倒數更新的間隔

  var app = {
    screen: 's-home',
    mode: null,                     // 'solo' | 'online'
    paint: null,
    view: null,
    feed: [],
    feedSeen: {},
    solo: null,                     // { state, director, seed, level }
    loop: 0,
    asideOpen: false,
    feedOpen: false,
    unread: 0,
    lastTurnKey: '',
    lastPhase: '',
    lastMask: '',
    lastGuessedCount: 0,
    roomCode: null,
    pendingInvite: null,
    inviteToken: null,
    inviteRole: 'any',
    inviteUrl: '',
    roomCreate: { roomName: '', rounds: 2, drawSec: 80, diff: 0, aiCount: 0 },
    lastOverlayHtml: null,
    conn: { status: 'idle', message: '' },
    wideLayout: null,
    recorded: false
  };

  /* ================================================================
     小工具
     ================================================================ */

  function show(id) {
    var list = D.querySelectorAll('.screen');
    for (var i = 0; i < list.length; i++) list[i].classList.toggle('active', list[i].id === id);
    app.screen = id;
    /* 猜題紀錄的浮動入口只在對局畫面出現（寬版是搬進左欄，不用這顆按鈕） */
    var dock = $('feeddock');
    if (dock) dock.hidden = (id !== 's-game') || !!app.wideLayout;
    if (id === 's-game') { layoutStage(); if (app.paint) app.paint.resize(); }
    Sound.setTrack(id === 's-game' ? 'draw' : 'menu');
  }

  var toastTimer = 0;
  function toast(message, kind) {
    var el = $('toast');
    el.textContent = message;
    el.setAttribute('data-kind', kind || 'info');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, kind === 'error' ? 4200 : 2600);
  }

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** 把 <span data-ico="pen"> 換成真正的 SVG */
  function paintIcons(root) {
    var list = (root || D).querySelectorAll('[data-ico]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.dataset.icoDone) continue;
      el.innerHTML = S.icon(el.getAttribute('data-ico'));
      el.dataset.icoDone = '1';
    }
  }

  /** 目前該用哪個時鐘：線上要用伺服器時間算倒數 */
  function netNow() {
    return (app.mode === 'online' && w.Online) ? w.Online.now() : Date.now();
  }

  function secsLeft(deadline) {
    if (!deadline) return 0;
    return Math.max(0, Math.ceil((deadline - netNow()) / 1000));
  }

  /* ================================================================
     Modal（設定彈窗）：遮罩、焦點鎖定、Escape、關閉返回原焦點
     ================================================================ */

  function makeModal(modalId, panelId, openerId) {
    var modal = $(modalId), panel = $(panelId), opener = $(openerId);
    var lastFocus = null;
    var onKey = function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); api.close(); return; }
      if (ev.key !== 'Tab') return;
      var f = panel.querySelectorAll('button,input,select,textarea,[href],[tabindex]:not([tabindex="-1"])');
      var able = [];
      for (var i = 0; i < f.length; i++) if (!f[i].disabled && f[i].offsetParent !== null) able.push(f[i]);
      if (!able.length) return;
      var first = able[0], last = able[able.length - 1];
      if (ev.shiftKey && D.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && D.activeElement === last) { ev.preventDefault(); first.focus(); }
    };
    var api = {
      isOpen: function () { return modal.classList.contains('open'); },
      open: function () {
        if (api.isOpen()) return;
        lastFocus = D.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        if (opener) opener.setAttribute('aria-expanded', 'true');
        D.addEventListener('keydown', onKey, true);
        setTimeout(function () { panel.focus(); }, 0);
        S.repaintAll(panel);
      },
      close: function () {
        if (!api.isOpen()) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        if (opener) opener.setAttribute('aria-expanded', 'false');
        D.removeEventListener('keydown', onKey, true);
        /* 焦點回到原本的地方。觸控裝置按按鈕常常不會讓它取得焦點，
           那時候 lastFocus 會是 body，退而求其次回到開啟用的按鈕。 */
        var back = (lastFocus && lastFocus.focus && lastFocus !== D.body && D.contains(lastFocus))
          ? lastFocus : opener;
        if (back && back.focus) back.focus();
      },
      toggle: function () { api.isOpen() ? api.close() : api.open(); }
    };
    return api;
  }

  var settingsModal, gameModal, roomCreateModal;

  /* ================================================================
     系統設定
     ================================================================ */

  function applyDisplaySettings() {
    D.body.classList.toggle('reduced-motion', Store.reduceMotion());
    D.body.classList.toggle('big-tools', Store.bigTools());
  }

  function setupSettings() {
    settingsModal = makeModal('settings-modal', 'settings-panel', 'b-settings');
    $('b-settings').addEventListener('click', function () { Sound.play('click'); settingsModal.open(); syncSettingsUI(); });
    $('settings-close').addEventListener('click', function () { settingsModal.close(); });
    $('settings-done').addEventListener('click', function () { settingsModal.close(); });
    var back = D.querySelector('[data-settings-close]');
    if (back) back.addEventListener('click', function () { settingsModal.close(); });

    $('settings-music').addEventListener('change', function () {
      Sound.setMusic(this.checked); syncSettingsUI();
    });
    $('settings-sfx').addEventListener('change', function () { Sound.setSfx(this.checked); syncSettingsUI(); });
    $('settings-music-volume').addEventListener('input', function () {
      Sound.setMusicVolume(Number(this.value) / 100); syncSettingsUI();
    });
    $('settings-sfx-volume').addEventListener('input', function () {
      Sound.setSfxVolume(Number(this.value) / 100); syncSettingsUI();
    });
    $('settings-pencue').addEventListener('change', function () { Sound.setPenCue(this.checked); });
    $('settings-chatcue').addEventListener('change', function () { Sound.setChatCue(this.checked); });
    $('settings-haptic').addEventListener('change', function () { Sound.setHaptic(this.checked); Sound.vibrate(12); });
    $('settings-motion').addEventListener('change', function () { Store.reduceMotion(this.checked); applyDisplaySettings(); });
    $('settings-bigtools').addEventListener('change', function () {
      Store.bigTools(this.checked); applyDisplaySettings(); layoutStage();
    });
    $('settings-trace').addEventListener('change', function () { Store.showTrace(this.checked); });
    $('settings-nick').addEventListener('change', function () {
      var v = this.value.trim().slice(0, 12);
      Store.nick(v);
      $('lobby-nick').value = v;
    });
    $('settings-server-check').addEventListener('click', function () {
      Cfg.checkHealth(function (state) { setServerPill(state); });
    });
    $('settings-reset').addEventListener('click', function () {
      Sound.resetDefaults();
      Store.resetDefaults();
      applyDisplaySettings();
      syncSettingsUI();
      toast('已恢復預設設定。', 'ok');
    });
  }

  function setServerPill(state) {
    var pill = $('settings-server-pill');
    var text = { unset: '未設定', invalid: '設定有誤', checking: '檢查中…', ok: '連得到', fail: '連不到' };
    pill.setAttribute('data-state', state);
    pill.textContent = text[state] || state;
  }

  function syncSettingsUI() {
    $('settings-music').checked = Sound.isMusicOn();
    $('settings-music-status').textContent = Sound.isMusicOn() ? '開啟' : '靜音';
    $('settings-sfx').checked = Sound.isSfxOn();
    $('settings-sfx-status').textContent = Sound.isSfxOn() ? '開啟' : '靜音';
    $('settings-music-volume').value = Math.round(Sound.getMusicVolume() * 100);
    $('settings-music-volume-value').textContent = Math.round(Sound.getMusicVolume() * 100) + '%';
    $('settings-sfx-volume').value = Math.round(Sound.getSfxVolume() * 100);
    $('settings-sfx-volume-value').textContent = Math.round(Sound.getSfxVolume() * 100) + '%';
    $('settings-pencue').checked = Sound.isPenCueOn();
    $('settings-chatcue').checked = Sound.isChatCueOn();
    $('settings-haptic').checked = Sound.isHapticOn();
    $('settings-motion').checked = Store.reduceMotion();
    $('settings-bigtools').checked = Store.bigTools();
    $('settings-trace').checked = Store.showTrace();
    $('settings-nick').value = Store.nick();
    $('settings-server-url').textContent = Cfg.describe();
    setServerPill(Cfg.status === 'ok' ? (w.Online && w.Online.isConnected() ? 'ok' : 'unset') : Cfg.status);
  }

  /* ================================================================
     教學（純文字）
     ================================================================ */

  var TUTORIAL = [
    { h: '這個遊戲在玩什麼', b:
      '<p>大家輪流當「畫家」。輪到你當畫家時，你會從三個題目裡挑一個，把它畫在畫布上；其他人看著你的線條，把答案打進下面的猜題框。</p>' +
      '<p>一局裡每個人都會當到畫家。全部畫完之後，分數最高的人獲勝。</p>' +
      '<p>下一段會說明畫家可以用哪些工具。</p>' },
    { h: '當畫家：小畫家式的工具列', b:
      '<p>輪到你畫的時候，畫布下面會出現工具列，用法跟小畫家一樣：</p>' +
      '<ul>' +
      '<li><b>鉛筆</b>：按住拖曳就畫線，最常用。</li>' +
      '<li><b>筆刷</b>：跟鉛筆一樣，但線比較粗。</li>' +
      '<li><b>直線／矩形／橢圓</b>：從一點按住拖到另一點，放開才會定形。</li>' +
      '<li><b>橡皮擦</b>：擦掉畫錯的地方。</li>' +
      '<li><b>油漆桶</b>：點一下就把那一塊封閉區域填成目前的顏色。要先把輪廓連起來，不然顏色會流到整張紙。</li>' +
      '</ul>' +
      '<p>右邊還有<b>復原</b>、<b>重做</b>、<b>全部清除</b>。顏色和粗細在工具列上直接點選；矩形和橢圓可以勾「填滿」畫成實心。</p>' },
    { h: '當畫家：不能做的事', b:
      '<p>這個遊戲刻意<b>沒有文字工具，也沒有聊天室</b>——畫家沒有任何可以打字的地方，所以不可能把答案寫出來。</p>' +
      '<p>只能用線條和顏色表達。如果真的畫不出來，可以按右上角的 🎮 打開對局設定，選「跳過這一題」。</p>' +
      '<p>畫得越多人猜中，你這一題拿的分數越高；全部人都猜中還有額外加分。</p>' },
    { h: '當猜題者：把答案打進去', b:
      '<p>輪到別人畫的時候，畫布下方會出現猜題框。想到什麼就直接打進去按「猜！」，答錯不扣分，可以一直猜。</p>' +
      '<p>三種回應：</p>' +
      '<ul>' +
      '<li><b>猜對了</b>：加分，而且你猜的內容不會被別人看到。</li>' +
      '<li><b>很接近了</b>：只差一個字，這個提示只有你看得到。</li>' +
      '<li><b>沒猜中</b>：會出現在左下的「猜題紀錄」裡，讓大家知道這個答案已經有人試過了。</li>' +
      '</ul>' +
      '<p>猜得越早、名次越前面，分數越高。</p>' },
    { h: '題目提示怎麼看', b:
      '<p>畫布上方那一條就是提示：</p>' +
      '<ul>' +
      '<li><b>○○○</b> 代表答案有幾個字，一個圈就是一個字。</li>' +
      '<li>旁邊會寫題目的<b>分類</b>（動物、食物、生活用品、交通工具、自然景物、運動娛樂）。</li>' +
      '<li>時間過了一半之後，系統會陸續<b>翻開</b>其中幾個字，但最後一個字永遠不會翻開。</li>' +
      '</ul>' +
      '<p>右上角的倒數就是這一題剩下的時間。時間到、或所有人都猜中了，這一題就結束並公布答案。</p>' },
    { h: '電腦對手在做什麼', b:
      '<p>電腦當畫家時，它會照著內建的形狀一筆一筆畫給你猜；<b>簡單</b>的手很抖、會漏掉細節、畫得慢，<b>困難</b>的又快又完整。</p>' +
      '<p>電腦當猜題者時，它看到的東西跟你完全一樣：畫布上的線、分類、字數、已經翻開的字。它<b>拿不到答案</b>，是真的在比對形狀來猜，所以也常常猜錯。</p>' +
      '<p>難度只影響它反應多快、猜幾次、以及要不要用字數和已翻開的字來縮小範圍——不會偷看，也不會偷改分數。</p>' },
    { h: '線上一起玩', b:
      '<p>在主選單按「線上對戰」可以開房間或用房號加入，2 到 8 個人都行；人不夠可以加電腦對手湊。</p>' +
      '<p>房主可以在對局設定裡產生<b>邀請連結</b>，對方開啟後會先停在大廳確認暱稱，按下按鈕才會真的進房。</p>' +
      '<p>位子滿了或對局已經開始時，新來的人會變成<b>觀戰者</b>：可以看畫、看紀錄，但不能畫也不能猜。</p>' +
      '<p>左上角的 📋 打開操作摘要（目前階段、你能做什麼、比分）；左下角是猜題紀錄。房間裡沒有任何真人玩家時會立刻關閉。</p>' }
  ];

  var tutIndex = 0;
  function renderTutorial() {
    var t = TUTORIAL[tutIndex];
    $('tut-progress').textContent = '第 ' + (tutIndex + 1) + ' 段 / 共 ' + TUTORIAL.length + ' 段';
    $('tut-box').innerHTML = '<h3>' + t.h + '</h3>' + t.b;
    $('b-tut-prev').disabled = tutIndex === 0;
    S.setLabel($('b-tut-next'), tutIndex === TUTORIAL.length - 1 ? '看完了 ✓' : '下一段 ▶');
    $('tut-box').focus();
  }

  function setupTutorial() {
    $('b-tut-prev').addEventListener('click', function () {
      if (tutIndex > 0) { tutIndex--; renderTutorial(); Sound.play('click'); }
    });
    $('b-tut-next').addEventListener('click', function () {
      if (tutIndex < TUTORIAL.length - 1) { tutIndex++; renderTutorial(); Sound.play('click'); }
      else { Store.tutorialDone(true); show('s-home'); }
    });
    $('b-tut-skip').addEventListener('click', function () { Store.tutorialDone(true); show('s-home'); });
    $('b-tut-practice').addEventListener('click', function () {
      Store.tutorialDone(true);
      Store.aiLevel('easy');
      Store.aiCount(1);
      startSolo();
    });
  }

  /* ================================================================
     戰績
     ================================================================ */

  function renderStats() {
    var s = Store.stats();
    var card = function (title, b) {
      return '<div class="statcard"><h3>' + title + '</h3>' +
        '<div class="statrow"><span>玩過幾局</span><b>' + b.games + '</b></div>' +
        '<div class="statrow"><span>拿第一</span><b>' + b.win + '</b></div>' +
        '<div class="statrow"><span>總共猜對</span><b>' + b.correct + ' 題</b></div>' +
        '<div class="statrow"><span>當過畫家</span><b>' + b.drawn + ' 次</b></div>' +
        '<div class="statrow"><span>單局最高分</span><b>' + b.best + '</b></div>' +
        '</div>';
    };
    $('statgrid').innerHTML = card('單機練習', s.solo) + card('線上對戰', s.online);
  }

  /* ================================================================
     單機設定畫面
     ================================================================ */

  function buildChips(hostId, values, getter, setter) {
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

  function setupSoloScreen() {
    var cards = $('opt-ai').querySelectorAll('.optcard');
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.setAttribute('aria-checked', String(Store.aiLevel() === card.getAttribute('data-v')));
        card.addEventListener('click', function () {
          Store.aiLevel(card.getAttribute('data-v'));
          Sound.play('click');
          for (var j = 0; j < cards.length; j++) cards[j].setAttribute('aria-checked', String(cards[j] === card));
        });
      }(cards[i]));
    }

    buildChips('opt-aicount',
      [1, 2, 3, 4, 5].map(function (n) { return { value: n, label: n + ' 位' }; }),
      Store.aiCount, Store.aiCount);
    buildChips('opt-rounds',
      [1, 2, 3].map(function (n) { return { value: n, label: n + ' 次' }; }),
      Store.rounds, Store.rounds);
    buildChips('opt-drawsec',
      [40, 60, 80, 120].map(function (n) { return { value: n, label: n + ' 秒' }; }),
      Store.drawSec, Store.drawSec);
    buildChips('opt-worddiff', [
      { value: 0, label: '混合' }, { value: 1, label: '簡單' },
      { value: 2, label: '普通' }, { value: 3, label: '困難' }
    ], Store.diff, Store.diff);

    $('b-solo-start').addEventListener('click', startSolo);
  }

  /* ================================================================
     單機引擎：自己持有完整狀態，用同一份 Rules + AI 推進
     ================================================================ */

  function startSolo() {
    var level = Store.aiLevel();
    var count = Store.aiCount();
    var players = [{ id: ME, name: Store.nick() || '你', ai: null }];
    for (var i = 1; i <= count; i++) {
      players.push({ id: 'ai' + i, name: '電腦' + i + '號（' + AI.levelOf(level).label + '）', ai: level });
    }
    var seed = RNG.randomSeed(null, 6);
    var state = Rules.createState({
      seed: seed,
      players: players,
      rounds: Store.rounds(),
      drawSec: Store.drawSec(),
      diff: Store.diff()
    });
    var r = Rules.start(state, Date.now());
    if (!r.ok) { toast(r.error, 'error'); return; }

    app.mode = 'solo';
    app.solo = { state: state, director: AI.createDirector(), seed: seed, level: level };
    app.roomCode = null;
    app.feed = [];
    app.feedSeen = {};
    app.unread = 0;
    app.recorded = false;
    app.lastTurnKey = '';
    app.lastPhase = '';
    app.lastMask = '';
    app.lastGuessedCount = 0;
    pushFeed({ kind: 'system', from: '系統', text: '單機練習開始，每人畫 ' + state.rounds + ' 次。', at: Date.now() });

    show('s-game');
    ensurePaint();
    app.paint.clearLocal();
    app.paint.clearRedo();
    setFeedOpen(Store.showTrace());
    soloRefresh();
    if (app.view && app.view.you.can.draw && !app.wideLayout) setFeedOpen(false);
    Sound.play('start');
    startLoop();
  }

  /** 把單機的完整狀態投影成跟線上一樣形狀的 view */
  function soloRefresh() {
    var st = app.solo.state;
    var wasDrawer = !!(app.view && app.view.game && app.view.game.you.isDrawer);
    var game = Rules.toPublic(st, ME);
    app.view = {
      room: null,
      game: game,
      you: {
        id: ME,
        name: Store.nick() || '你',
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
    /* 剛換成自己當畫家：窄版先收起疊在畫布上的紀錄面板 */
    if (!app.wideLayout && app.feedOpen && game.you.isDrawer && !wasDrawer) setFeedOpen(false);
    render();
  }

  function soloStep() {
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

    var t = Rules.tick(st, now);
    handleGameEvents(t.events);

    AI.drive(app.solo.director, st, now, app.solo.seed, {
      pick: function (aiId, wordId) { Rules.pickWord(st, aiId, wordId, now); },
      hint: function (aiId) {
        var r = Rules.giveHint(st, aiId, now);
        if (!r.ok) return;
        pushFeed({ kind: 'system', from: '系統', text: hintFeedText(r), at: now });
        Sound.play('hint');
      },
      stroke: function (aiId, stroke) {
        var r = Rules.addStroke(st, aiId, stroke);
        if (r.ok) { app.paint.addStroke(r.stroke); Sound.playPen(); }
      },
      guess: function (aiId, text) {
        var p = Rules.player(st, aiId);
        var g = Rules.guess(st, aiId, text, now);
        if (!g.ok) return;
        if (g.verdict === 'hit') {
          pushFeed({ kind: 'correct', from: '系統', text: (p ? p.name : '電腦') + ' 猜對了！（第 ' + g.order + ' 個，+' + g.points + ' 分）', at: now });
          Sound.play('correct');
        } else if (g.verdict !== 'close') {
          pushFeed({ kind: 'guess', from: p ? p.name : '電腦', fromId: aiId, role: 'ai', text: text, at: now });
          Sound.playChat();
        }
      }
    });

    var t2 = Rules.tick(st, now);
    handleGameEvents(t2.events);
    soloRefresh();
  }

  /** 提示要怎麼寫進猜題紀錄（單機與線上共用同一套措辭） */
  function hintFeedText(ev) {
    if (ev.step === 1) return '畫家給了提示：題目有 ' + (ev.mask || '').length + ' 個字。';
    if (ev.step === 2) return '畫家給了提示：題目的種類。';
    return '畫家給了提示：' + (ev.mask || '');
  }

  function handleGameEvents(events) {
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      if (ev.type === 'autopick') {
        pushFeed({ kind: 'system', from: '系統', text: '時間到，系統幫畫家挑了題目。', at: Date.now() });
      } else if (ev.type === 'hint') {
        pushFeed({ kind: 'system', from: '系統', text: hintFeedText(ev), at: Date.now() });
        Sound.play('hint');
      } else if (ev.type === 'turnend') {
        pushFeed({ kind: 'system', from: '系統', text: '答案是「' + ev.entry.word + '」，' + ev.entry.correct + '/' + ev.entry.total + ' 人猜中。', at: Date.now() });
        Sound.play(ev.entry.correct > 0 ? 'turn' : 'timeup');
        if (app.paint) { app.paint.clearRedo(); }
      } else if (ev.type === 'turnstart') {
        if (app.paint) { app.paint.clearLocal(); app.paint.clearRedo(); }
      } else if (ev.type === 'gameover') {
        Sound.play('win');
      }
    }
  }

  function startLoop() {
    stopLoop();
    app.loop = setInterval(function () {
      if (app.mode === 'solo') soloStep();
      else updateTimers();
    }, LOOP_MS);
  }
  function stopLoop() { if (app.loop) { clearInterval(app.loop); app.loop = 0; } }

  /* ================================================================
     猜題紀錄（唯讀）
     ================================================================ */

  function pushFeed(entry) {
    if (!entry) return;
    if (entry.id && app.feedSeen[entry.id]) return;
    if (entry.id) app.feedSeen[entry.id] = 1;
    app.feed.push(entry);
    if (app.feed.length > 120) app.feed.splice(0, app.feed.length - 120);
    if (!app.feedOpen) { app.unread++; updateFeedBadge(); }
    renderFeed();
  }

  function replaceFeed(list) {
    app.feed = (list || []).slice();
    app.feedSeen = {};
    for (var i = 0; i < app.feed.length; i++) if (app.feed[i].id) app.feedSeen[app.feed[i].id] = 1;
    renderFeed();
  }

  function renderFeed() {
    var box = $('feed-list');
    if (!box) return;
    if (!app.feed.length) {
      box.innerHTML = '<p class="chat-empty">還沒有人猜過。猜錯的答案會出現在這裡，讓大家知道哪些試過了。</p>';
      return;
    }
    var html = '';
    for (var i = 0; i < app.feed.length; i++) {
      var m = app.feed[i];
      var role = m.kind === 'guess' ? (m.role === 'ai' ? 'ai' : 'player') : 'system';
      var mine = m.fromId && app.view && app.view.you && m.fromId === app.view.you.id;
      html += '<div class="chat-msg" data-role="' + role + '" data-mine="' + (mine ? 'true' : 'false') + '">' +
        (m.kind === 'guess' ? '<span class="who">' + esc(m.from) + '</span>' : '') +
        esc(m.text) + '</div>';
    }
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  }

  function updateFeedBadge() {
    var b = $('feed-unread');
    if (!b) return;
    b.hidden = app.unread <= 0;
    b.textContent = app.unread > 99 ? '99+' : String(app.unread);
  }

  function setFeedOpen(open) {
    app.feedOpen = !!open;
    $('feed-panel').hidden = !app.feedOpen;
    $('b-feed-toggle').setAttribute('aria-expanded', String(app.feedOpen));
    if (app.feedOpen) { app.unread = 0; updateFeedBadge(); renderFeed(); }
  }

  function setAsideOpen(open) {
    app.asideOpen = !!open;
    var aside = $('game-aside');
    aside.classList.toggle('open', app.asideOpen);
    /* 窄版是把浮層移出畫面，寬版是常駐左欄；收合要用 display 才真的讓出空間 */
    aside.classList.toggle('collapsed', !app.asideOpen);
    $('game').classList.toggle('aside-open', app.asideOpen);
    $('b-aside-toggle').setAttribute('aria-expanded', String(app.asideOpen));
    layoutStage();
  }

  /* 寬版把猜題紀錄搬進左欄下方，窄版搬回畫布左下的浮層 */
  function relayoutFeed() {
    var wide = w.matchMedia('(min-width:1100px)').matches;
    if (app.wideLayout === wide) return;
    app.wideLayout = wide;
    var panel = $('feed-panel');
    if (wide) {
      $('aside-chat-slot').appendChild(panel);
      setAsideOpen(true);
      $('feeddock').hidden = true;
      panel.hidden = false;
      app.feedOpen = true;
      app.unread = 0;
      updateFeedBadge();
    } else {
      $('feeddock').appendChild(panel);
      $('feeddock').hidden = app.screen !== 's-game';
      setAsideOpen(false);
      setFeedOpen(Store.showTrace());
      if (app.screen === 's-game') $('feeddock').hidden = false;
    }
    renderFeed();
    layoutStage();
  }

  /* ================================================================
     畫布
     ================================================================ */

  function ensurePaint() {
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
          ? '你是觀戰者，不能畫也不能猜。'
          : (v.game.you.isDrawer ? '還不能畫，先挑一個題目。' : '現在不是你畫，換你猜猜看！'), 'error');
        Sound.play('blocked');
      }
    });
    app.paint.setTool(Store.tool());
    app.paint.setColor(Store.color());
    app.paint.setWidth(Store.width());
    return app.paint;
  }

  function sendStroke(stroke) {
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

  var stageRO = null;
  function layoutStage() {
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

  function sizeCanvas() {
    var stage = $('stage'), box = $('stage-canvas');
    if (!stage || !box) return;
    var r = stage.getBoundingClientRect();
    var size = Math.floor(Math.min(r.width, r.height));
    if (!isFinite(size) || size < 80) return;
    size = Math.max(140, size - 4);
    if (box.style.width === size + 'px') return;
    box.style.width = size + 'px';
    box.style.height = size + 'px';
    if (app.paint) app.paint.resize();
  }

  function toolHint(text, kind) {
    var el = $('tool-hint');
    el.textContent = text || '';
    el.setAttribute('data-kind', kind || 'info');
  }

  /* ---------------------------------------------------------- 工具列 */

  var TOOL_ORDER = ['pen', 'brush', 'line', 'rect', 'ellipse', 'erase', 'fill'];
  var TOOL_ICON = { pen: 'pen', brush: 'brush', line: 'line', rect: 'rect', ellipse: 'ellipse', erase: 'erase', fill: 'fill' };
  var TOOL_TIP = {
    pen: '鉛筆：按住拖曳畫線',
    brush: '筆刷：比鉛筆粗一級',
    line: '直線：按住拖到終點放開',
    rect: '矩形：拖出對角線',
    ellipse: '橢圓：拖出外框',
    erase: '橡皮擦：擦掉畫錯的地方',
    fill: '油漆桶：點一下填滿封閉區域'
  };

  function buildToolbar() {
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
      b.setAttribute('aria-label', '顏色 ' + (i + 1));
      b.title = '顏色 ' + (i + 1);
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
      b.setAttribute('aria-label', '筆寬 ' + (i + 1));
      b.title = '筆寬 ' + (i + 1);
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
    $('b-done').addEventListener('click', doSkip);
    $('b-hint-1').addEventListener('click', doHint);
    $('b-hint-2').addEventListener('click', doHint);
    $('b-hint-3').addEventListener('click', doHint);
  }

  function chooseTool(key) {
    app.paint.setTool(key);
    Store.tool(key);
    Sound.play('click');
    toolHint(TOOL_TIP[key]);
    syncToolbar();
  }

  function syncToolbar() {
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
  }

  function doUndo() {
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

  function doRedo() {
    var st = app.paint.popRedo();
    if (!st) { toolHint('沒有可以重做的筆畫了。'); return; }
    sendStroke({ t: st.t, c: st.c, w: st.w, f: st.f, p: st.p.slice() });
    Sound.play('shape');
    syncToolbar();
  }

  function doClear() {
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
  function doHint() {
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

  function noteHint(r) {
    var text = r.step === 1 ? '你給了提示：題目有 ' + r.mask.length + ' 個字。'
      : r.step === 2 ? '你給了提示：題目的種類。'
        : '你給了提示：' + r.mask;
    pushFeed({ kind: 'system', from: '系統', text: text, at: Date.now() });
  }

  function doSkip() {
    if (app.mode === 'solo') {
      var r = Rules.giveUp(app.solo.state, ME, Date.now());
      if (!r.ok) { toolHint(r.error, 'error'); return; }
      handleGameEvents([{ type: 'turnend', entry: r.entry }]);
      soloRefresh();
      return;
    }
    w.Online.send('room:skip', {});
  }

  /* ================================================================
     猜題
     ================================================================ */

  function setupGuessbar() {
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

  function submitGuess(text) {
    if (app.mode === 'solo') {
      var now = Date.now();
      var r = Rules.guess(app.solo.state, ME, text, now);
      if (!r.ok) { toast(r.error, 'error'); Sound.play('blocked'); return; }
      if (r.verdict === 'hit') {
        pushFeed({ kind: 'correct', from: '系統', text: '你猜對了！（第 ' + r.order + ' 個，+' + r.points + ' 分）', at: now });
        Sound.play('correct'); Sound.vibrate([12, 40, 12]);
        toast('猜對了！+' + r.points + ' 分', 'ok');
      } else if (r.verdict === 'close') {
        toast('「' + text + '」很接近了，再想一下！', 'ok');
        Sound.play('close');
      } else {
        pushFeed({ kind: 'guess', from: '你', fromId: ME, role: 'player', text: text, at: now });
        Sound.play('wrong');
      }
      soloRefresh();
      return;
    }
    w.Online.send('room:guess', { text: text });
  }

  /* ================================================================
     畫面渲染（單機與線上共用）
     ================================================================ */

  var PHASE_LABEL = { picking: '選題目', drawing: '作畫中', reveal: '公布答案', over: '結算' };

  function render() {
    var v = app.view;
    if (!v) return;
    var g = v.game;
    var closed = v.room && v.room.closed;

    /* ---- 上排狀態 ---- */
    var phaseChip = $('phase-chip');
    if (closed) {
      phaseChip.textContent = '房間已結束';
      phaseChip.setAttribute('data-p', 'over');
    } else if (v.room && v.room.phase === 'waiting') {
      phaseChip.textContent = '等待開始';
      phaseChip.setAttribute('data-p', 'picking');
    } else if (g) {
      phaseChip.textContent = PHASE_LABEL[g.phase] || g.phase;
      phaseChip.setAttribute('data-p', g.phase);
    }
    $('round-chip').textContent = g ? ('第 ' + g.turnNo + ' / ' + g.totalTurns + ' 題') : '尚未開始';

    updateTimers();

    /* ---- 題目提示 ----
       對局中一直留著（沒題目時顯示等待文字），提示列才不會忽然冒出來把畫布擠小 */
    var wb = $('wordbar');
    if (!g || closed) {
      wb.hidden = true;
    } else if (g.hint) {
      var mine = g.you.isDrawer;
      var h = g.hint;
      wb.hidden = false;
      wb.setAttribute('data-mine', String(mine));
      $('wordbar-label').textContent = mine ? '你要畫的是' : '題目';
      /* 猜題者要等畫家按提示：還沒按就連幾個字都不知道 */
      $('wordbar-mask').textContent = (mine || g.answer) ? (g.answer || '')
        : (h.lenShown ? h.mask : '？');
      var meta = [];
      if (h.catShown) meta.push(h.catLabel);
      if (h.lenShown) meta.push(h.len + ' 個字');
      if (!mine && !h.lenShown && !h.catShown) meta.push('畫家還沒給提示');
      if (!mine && h.revealed) meta.push('翻開了 1 個字');
      meta.push('第 ' + g.turnNo + '/' + g.totalTurns + ' 題');
      $('wordbar-meta').textContent = meta.join('・');
    } else {
      wb.hidden = false;
      wb.setAttribute('data-mine', 'false');
      $('wordbar-label').textContent = '題目';
      $('wordbar-mask').textContent = '—';
      $('wordbar-meta').textContent = (g.phase === 'picking' ? '畫家正在挑題目…' : '等待開始') +
        '・第 ' + g.turnNo + '/' + g.totalTurns + ' 題';
    }

    renderPlayers();
    renderOverlay();
    renderControls();
    renderAside();
    sizeCanvas();
  }

  function updateTimers() {
    var v = app.view;
    if (!v || !v.game) { $('timer-chip').hidden = true; return; }
    var g = v.game;
    var chip = $('timer-chip');
    if (g.phase === 'over' || !g.deadline || (v.room && v.room.closed)) { chip.hidden = true; return; }
    var s = secsLeft(g.deadline);
    chip.hidden = false;
    $('timer-text').textContent = s + ' 秒';
    chip.setAttribute('data-urgent', String(g.phase === 'drawing' && s <= 10));
    var sum = $('sum-timer');
    if (sum) sum.textContent = s + ' 秒';
  }

  function moodOf(p, g) {
    if (g.phase === 'over') return g.winners.indexOf(p.id) >= 0 ? 'win' : 'sad';
    if (p.isDrawer) return g.phase === 'drawing' ? 'draw' : 'think';
    if (p.guessed) return 'happy';
    return g.phase === 'drawing' ? 'think' : 'idle';
  }

  function stateOf(p, g) {
    if (p.isDrawer) return g.phase === 'picking' ? '選題目中' : '作畫中';
    if (p.guessed) return '已猜中';
    if (g.phase === 'drawing') return p.wrong ? ('猜了 ' + p.wrong + ' 次') : '思考中';
    return p.ai ? '電腦' : '等待中';
  }

  function renderPlayers() {
    var v = app.view, g = v.game;
    var host = $('playerstrip');
    if (!g) { host.innerHTML = ''; return; }
    var html = '';
    for (var i = 0; i < g.players.length; i++) {
      var p = g.players[i];
      var cls = ['pcard'];
      if (p.isDrawer) cls.push('drawer');
      if (p.guessed) cls.push('guessed');
      if (p.id === v.you.id) cls.push('me');
      html += '<div class="' + cls.join(' ') + '">' +
        '<span class="pface" aria-hidden="true">' + S.face(i, moodOf(p, g)) + '</span>' +
        '<span class="pinfo"><b class="pname">' + esc(p.name) + '</b>' +
        '<span class="pstate">' + esc(stateOf(p, g)) + '</span></span>' +
        '<span class="pscore">' + p.score + '</span></div>';
    }
    host.innerHTML = html;
  }

  /* ---------------------------------------------------- 疊層（overlay） */

  function renderOverlay() {
    var v = app.view, g = v.game;
    var wrap = $('stage-overlay'), card = $('overlay-card');
    var html = null;

    if (v.room && v.room.closed) {
      html = '<h3>房間已經結束</h3><p>' + esc(v.room.closedReason || '房間裡已經沒有玩家了。') + '</p>' +
        '<div class="overlay-btns"><button class="btn3d" data-color="grape" data-act="lobby">回大廳</button>' +
        '<button class="btn3d small" data-color="cream" data-act="home">回主選單</button></div>';
    } else if (v.room && v.room.phase === 'waiting') {
      html = roomSetupHtml(v);
    } else if (g && g.phase === 'picking') {
      html = pickingHtml(v, g);
    } else if (g && g.phase === 'reveal') {
      html = revealHtml(g);
    } else if (g && g.phase === 'over') {
      html = overHtml(v, g);
    }

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
    card.innerHTML = html;
    S.decorateAll(card);
    paintIcons(card);
    bindOverlay(card);
  }

  /* 每人輪數／每題秒數／題目難度都用按鈕，不用滑桿：
     這張面板每次收到房間投影就會重畫，滑桿拖到一半會被打斷，按鈕不會。 */
  var ROUND_CHOICES = [1, 2, 3, 4, 5];
  var SEC_CHOICES = [30, 45, 60, 80, 120, 180];
  var DIFF_CHOICES = [
    { v: 0, label: '混合' }, { v: 1, label: '簡單' },
    { v: 2, label: '普通' }, { v: 3, label: '困難' }
  ];
  var INVITE_ROLES = [
    { v: 'any', label: '有位子就當玩家' },
    { v: 'player', label: '一定是玩家' },
    { v: 'spectator', label: '一定是觀戰' }
  ];
  var CREATE_AI_CHOICES = [
    { v: 0, label: '不加' }, { v: 1, label: '1 個' }, { v: 2, label: '2 個' }, { v: 3, label: '3 個' }
  ];

  function chips(act, list, current) {
    return '<div class="chiprow">' + list.map(function (o) {
      var val = (o.v !== undefined ? o.v : o);
      var label = (o.label !== undefined ? o.label : o);
      return '<button type="button" class="pillbtn" role="radio" data-act="' + act + '" data-v="' + esc(val) + '"' +
        ' aria-checked="' + (String(val) === String(current) ? 'true' : 'false') + '">' + esc(label) + '</button>';
    }).join('') + '</div>';
  }

  function renderRoomCreateOptions() {
    var c = app.roomCreate;
    $('lobby-room-name').value = c.roomName;
    $('room-create-rounds').innerHTML = chips('create-rounds', ROUND_CHOICES, c.rounds);
    $('room-create-drawsec').innerHTML = chips('create-drawsec', SEC_CHOICES, c.drawSec);
    $('room-create-diff').innerHTML = chips('create-diff', DIFF_CHOICES, c.diff);
    $('room-create-ai').innerHTML = chips('create-ai', CREATE_AI_CHOICES, c.aiCount);
  }

  function setupRoomCreate() {
    roomCreateModal = makeModal('room-create-modal', 'room-create-panel', 'b-lobby-host');
    $('room-create-close').addEventListener('click', function () { roomCreateModal.close(); });
    $('room-create-cancel').addEventListener('click', function () { roomCreateModal.close(); });
    var back = D.querySelector('[data-room-create-close]');
    if (back) back.addEventListener('click', function () { roomCreateModal.close(); });

    ['room-create-rounds', 'room-create-drawsec', 'room-create-diff', 'room-create-ai'].forEach(function (id) {
      $(id).addEventListener('click', function (ev) {
        var button = ev.target.closest('button[data-act]');
        if (!button) return;
        var action = button.getAttribute('data-act');
        var value = button.getAttribute('data-v');
        if (action === 'create-rounds') app.roomCreate.rounds = Number(value);
        else if (action === 'create-drawsec') app.roomCreate.drawSec = Number(value);
        else if (action === 'create-diff') app.roomCreate.diff = Number(value);
        else if (action === 'create-ai') app.roomCreate.aiCount = Number(value);
        renderRoomCreateOptions();
        Sound.play('click');
      });
    });

    $('lobby-room-name').addEventListener('input', function () {
      app.roomCreate.roomName = this.value.slice(0, 16);
    });
    $('room-create-submit').addEventListener('click', createRoomFromSettings);
  }

  function openRoomCreate() {
    app.roomCreate = {
      roomName: (Store.nick() || '大家') + ' 的房間',
      rounds: 2,
      drawSec: 80,
      diff: 0,
      aiCount: 0
    };
    renderRoomCreateOptions();
    roomCreateModal.open();
  }

  function createRoomFromSettings() {
    var c = app.roomCreate;
    var roomName = $('lobby-room-name').value.trim().slice(0, 16) || '畫畫小房間';
    c.roomName = roomName;
    Store.nick($('lobby-nick').value.trim().slice(0, 12));
    var aiLevels = [];
    for (var i = 0; i < c.aiCount; i++) aiLevels.push('normal');
    $('room-create-submit').disabled = true;
    w.Online.send('room:create', {
      name: Store.nick(),
      roomName: roomName,
      settings: { rounds: c.rounds, drawSec: c.drawSec, diff: c.diff },
      aiLevels: aiLevels
    }, function (res) {
      $('room-create-submit').disabled = false;
      if (!res || !res.ok) return toast((res && res.error) || '開房失敗。', 'error');
      roomCreateModal.close();
      enterOnlineRoom(res.code);
    });
  }

  /** 開房間設定：房主在這裡調規則、加電腦對手、產生邀請連結 */
  function roomSetupHtml(v) {
    var r = v.room;
    var seats = '';
    for (var i = 0; i < r.members.length; i++) {
      var m = r.members[i];
      if (m.role !== 'player') continue;
      seats += '<span class="seatchip' + (m.ready ? ' ready' : '') + '">' +
        '<span class="sface" aria-hidden="true">' + S.face(i, m.ready ? 'happy' : 'idle') + '</span>' +
        esc(m.name) + (m.host ? '（房主）' : '') + (m.ready ? ' ✓' : '') + '</span>';
    }
    for (var j = 0; j < r.aiSeats.length; j++) {
      seats += '<span class="seatchip ai"><span class="sface" aria-hidden="true">' +
        S.face(r.members.length + j, 'think') + '</span>' + esc(r.aiSeats[j].name) + '</span>';
    }
    var specs = r.members.filter(function (x) { return x.role === 'spectator'; });
    var host = v.you.can.setSettings;

    /* ---- 遊戲規則 ---- */
    var rules;
    if (host) {
      rules = '<div class="setupblock"><h4>遊戲規則</h4>' +
        '<div class="setuprow"><span>每人畫幾次</span>' + chips('set-rounds', ROUND_CHOICES, r.settings.rounds) + '</div>' +
        '<div class="setuprow"><span>每題秒數</span>' + chips('set-drawsec', SEC_CHOICES, r.settings.drawSec) + '</div>' +
        '<div class="setuprow"><span>題目難度</span>' + chips('set-diff', DIFF_CHOICES, r.settings.diff) + '</div>' +
        '</div>';
    } else {
      var dl = DIFF_CHOICES.filter(function (d) { return d.v === r.settings.diff; })[0];
      rules = '<div class="setupblock"><h4>遊戲規則</h4>' +
        '<p class="setupnote">每人畫 ' + r.settings.rounds + ' 次・每題 ' + r.settings.drawSec + ' 秒・' +
        esc(dl ? dl.label : '混合') + '難度（由房主決定）</p></div>';
    }

    /* ---- 電腦對手 ---- */
    var ai = '';
    if (host) {
      var rows = r.aiSeats.map(function (s) {
        return '<div class="aiseat"><span class="an">' + esc(s.name) + '</span>' +
          '<select data-act="ai-level" data-ai="' + esc(s.id) + '" aria-label="' + esc(s.name) + ' 的難度">' +
          AI.LEVEL_KEYS.map(function (k) {
            return '<option value="' + k + '"' + (k === s.level ? ' selected' : '') + '>' + AI.levelOf(k).label + '</option>';
          }).join('') + '</select>' +
          '<button type="button" data-act="remove-ai" data-ai="' + esc(s.id) + '" aria-label="移除 ' + esc(s.name) + '">✕</button></div>';
      }).join('');
      ai = '<div class="setupblock"><h4>電腦對手</h4>' +
        (rows || '<p class="setupnote">還沒有電腦對手。人不夠的時候加幾個就能開始。</p>') +
        '<div class="setuprow"><span>加一個</span><div class="chiprow">' +
        AI.LEVEL_KEYS.map(function (k) {
          return '<button type="button" class="pillbtn" data-act="add-ai" data-v="' + k + '"' +
            (r.openSeats > 0 ? '' : ' disabled') + '>＋ ' + AI.levelOf(k).label + '</button>';
        }).join('') + '</div></div></div>';
    }

    /* ---- 邀請連結 ---- */
    var invite = '';
    if (v.you.can.invite) {
      invite = '<div class="setupblock"><h4>邀請朋友</h4>' +
        '<div class="setuprow"><span>對方的身分</span>' + chips('invite-role', INVITE_ROLES, app.inviteRole) + '</div>' +
        '<div class="inviterow"><label class="sr-only" for="invite-url">邀請連結</label>' +
        '<input id="invite-url" readonly placeholder="按「產生連結」" value="' + esc(app.inviteUrl) + '"></div>' +
        '<div class="chiprow">' +
        '<button type="button" class="pillbtn" data-act="invite-new">產生連結</button>' +
        '<button type="button" class="pillbtn" data-act="invite-copy"' + (app.inviteUrl ? '' : ' disabled') + '>複製</button>' +
        '<button type="button" class="pillbtn" data-act="invite-revoke"' + (app.inviteToken ? '' : ' disabled') + '>撤銷</button>' +
        '</div>' +
        '<p class="setupnote">有效期 60 分鐘、最多 20 人次。對方開啟後會先停在大廳確認暱稱，' +
        '按下確認才會進房；改暱稱不會改變連結給定的身分。</p></div>';
    }

    /* ---- 主要按鈕 ---- */
    var btns = '';
    if (v.you.role === 'player') {
      btns += '<button class="btn3d" data-color="' + (v.you.ready ? 'lemon' : 'mint') + '" data-act="ready">' +
        (v.you.ready ? '取消準備' : '準備好了 ✓') + '</button>';
    }
    if (v.you.can.becomePlayer) btns += '<button class="btn3d small" data-color="mint" data-act="become-player">下場一起玩</button>';
    if (v.you.can.becomeSpectator) btns += '<button class="btn3d small" data-color="cream" data-act="become-spectator">改成觀戰</button>';
    if (v.you.isHost) {
      btns += '<button class="btn3d" data-color="grape" data-act="start"' +
        (v.you.can.start ? '' : ' disabled') + '>開始！</button>';
    }

    return '<h3>房間設定</h3>' +
      '<div class="roomcode"><b>' + esc(r.code) + '</b><span>把房號唸給朋友，或用下面的邀請連結</span></div>' +
      '<div class="seatlist">' + (seats || '<span class="seatchip">還沒有人入座</span>') + '</div>' +
      '<p>' + r.seatsTaken + ' / ' + r.settings.maxPlayers + ' 位玩家' +
      (specs.length ? '・' + specs.length + ' 位觀戰' : '') + '</p>' +
      rules + ai + invite +
      (v.you.can.start ? '' : '<p>' + esc(v.you.can.startBlockedBy || '等房主按開始。') + '</p>') +
      '<div class="overlay-btns">' + btns + '</div>';
  }

  function pickingHtml(v, g) {
    if (g.you.canPick && g.choices.length) {
      var cards = g.choices.map(function (c) {
        return '<button class="wordchoice" data-act="pick" data-word="' + esc(c.id) + '">' +
          '<b>' + esc(c.text) + '</b><span class="s">' + esc(c.catLabel) + '・' + esc(c.diffLabel) + '</span></button>';
      }).join('');
      return '<h3>挑一個來畫</h3><p>' + secsLeft(g.deadline) + ' 秒內沒選的話，系統會幫你挑第一個。</p>' +
        '<div class="wordchoices">' + cards + '</div>';
    }
    var drawer = drawerName(g);
    return '<h3>' + esc(drawer) + ' 正在挑題目</h3><p>準備好了嗎？等一下就要開始猜囉。</p>';
  }

  function drawerName(g) {
    for (var i = 0; i < g.players.length; i++) if (g.players[i].isDrawer) return g.players[i].name;
    return '畫家';
  }

  function revealHtml(g) {
    var last = g.log.length ? g.log[g.log.length - 1] : null;
    var rows = '';
    if (last) {
      for (var i = 0; i < last.guessed.length; i++) {
        var gg = last.guessed[i];
        rows += '<li><span class="rface" aria-hidden="true">' + S.face(i, 'happy') + '</span>' +
          '<span class="rname">' + esc(gg.name) + '</span><span class="rpts">+' + gg.points + '</span></li>';
      }
      rows += '<li><span class="rface" aria-hidden="true">' + S.face(7, last.drawerPoints > 0 ? 'happy' : 'sad') + '</span>' +
        '<span class="rname">' + esc(last.drawerName) + '（畫家）</span>' +
        '<span class="rpts">+' + last.drawerPoints + '</span></li>';
    }
    return '<h3>答案是</h3><div class="revealword">' + esc(g.answer || (last ? last.word : '—')) + '</div>' +
      '<p>' + (last ? last.correct + ' / ' + last.total + ' 人猜中' : '') + '</p>' +
      '<ul class="resultlist">' + (rows || '<li><span class="rname">這一題沒有人猜中</span></li>') + '</ul>' +
      '<p>馬上換下一位畫家…</p>';
  }

  function overHtml(v, g) {
    var sorted = g.players.slice().sort(function (a, b) { return b.score - a.score; });
    var rows = sorted.map(function (p, i) {
      var win = g.winners.indexOf(p.id) >= 0;
      return '<li class="' + (win ? 'win' : '') + '">' +
        '<span class="rface" aria-hidden="true">' + S.face(indexOfPlayer(g, p.id), win ? 'win' : 'sad') + '</span>' +
        '<span class="rname">' + (win ? '🏆 ' : (i + 1) + '. ') + esc(p.name) + '</span>' +
        '<span class="rpts">' + p.score + ' 分</span></li>';
    }).join('');
    var btns = '';
    if (v.you.can.rematch) btns += '<button class="btn3d" data-color="mint" data-act="rematch">再玩一局</button>';
    btns += '<button class="btn3d small" data-color="cream" data-act="' + (app.mode === 'online' ? 'lobby' : 'home') + '">' +
      (app.mode === 'online' ? '回大廳' : '回主選單') + '</button>';
    return '<h3>結算</h3><ul class="resultlist">' + rows + '</ul>' +
      (v.room && v.room.rematchVotes ? '<p>已經有 ' + v.room.rematchVotes + ' 個人想再玩一局。</p>' : '') +
      '<div class="overlay-btns">' + btns + '</div>';
  }

  function indexOfPlayer(g, id) {
    for (var i = 0; i < g.players.length; i++) if (g.players[i].id === id) return i;
    return 0;
  }

  function bindOverlay(card) {
    var sels = card.querySelectorAll('select[data-act=ai-level]');
    for (var s = 0; s < sels.length; s++) {
      (function (sel) {
        sel.addEventListener('change', function () {
          w.Online.send('room:setAiLevel', { aiId: sel.getAttribute('data-ai'), level: sel.value });
        });
      }(sels[s]));
    }
    var list = card.querySelectorAll('button[data-act]');
    for (var i = 0; i < list.length; i++) {
      (function (el) {
        el.addEventListener('click', function () {
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
          } else if (act === 'set-rounds') w.Online.send('room:settings', { rounds: Number(el.getAttribute('data-v')) });
          else if (act === 'set-drawsec') w.Online.send('room:settings', { drawSec: Number(el.getAttribute('data-v')) });
          else if (act === 'set-diff') w.Online.send('room:settings', { diff: Number(el.getAttribute('data-v')) });
          else if (act === 'add-ai') w.Online.send('room:addAi', { level: el.getAttribute('data-v') });
          else if (act === 'remove-ai') w.Online.send('room:removeAi', { aiId: el.getAttribute('data-ai') });
          else if (act === 'invite-role') {
            app.inviteRole = el.getAttribute('data-v');
            app.lastOverlayHtml = null;
            renderOverlay();
          } else if (act === 'invite-new') newInvite();
          else if (act === 'invite-copy') copyText(app.inviteUrl);
          else if (act === 'invite-revoke') revokeInvite();
          else if (act === 'ready') w.Online.send('room:ready', { ready: !app.view.you.ready });
          else if (act === 'start') w.Online.send('room:start', {});
          else if (act === 'become-player') w.Online.send('room:becomePlayer', {});
          else if (act === 'become-spectator') w.Online.send('room:becomeSpectator', {});
          else if (act === 'settings') gameModal.open();
          else if (act === 'rematch') {
            if (app.mode === 'solo') startSolo();
            else w.Online.send('room:rematch', {});
          } else if (act === 'lobby') leaveGame('s-lobby');
          else if (act === 'home') leaveGame('s-home');
        });
      }(list[i]));
    }
  }

  /* ------------------------------------------------ 工具列／猜題列切換 */

  function renderControls() {
    var v = app.view, g = v.game;
    var canDraw = !!(g && v.you.can.draw);
    var canGuess = !!(g && v.you.can.guess);
    var spectator = v.you.role === 'spectator';

    /* 畫家（含選題階段）不需要猜題框，觀戰者也沒有 */
    var isDrawer = !!(g && g.you.isDrawer);
    $('toolbar').hidden = !canDraw;
    $('guessbar').hidden = canDraw || isDrawer || spectator || !g ||
      g.phase === 'over' || (v.room && v.room.closed);

    if (app.paint) app.paint.setEnabled(canDraw);

    if (canDraw) {
      syncToolbar();
      if (!$('tool-hint').textContent) toolHint(TOOL_TIP[app.paint.getTool()]);
    }
    renderHintRow(g, canDraw);

    var input = $('guess-input');
    if (!$('guessbar').hidden) {
      var guessed = g && g.you.guessed;
      input.disabled = !canGuess;
      $('b-guess').disabled = !canGuess;
      input.placeholder = guessed ? '你已經猜對了，等其他人…'
        : (g && g.phase === 'drawing' ? '猜猜看這是什麼？' : '等畫家開始畫…');
    }
  }

  /** 畫家的三個提示按鈕：已給的標起來、下一張可以按、單字題沒有第三張 */
  function renderHintRow(g, canDraw) {
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
      ? (g.hint.total < 3 ? '單字題沒有「一個字」這張提示。' : '提示都給完了。')
      : '按下去就公開給所有人，收不回來。';
  }

  /* ------------------------------------------------------ 左側摘要 */

  function renderAside() {
    var v = app.view, g = v.game;
    var youRole = v.you.role === 'spectator' ? '觀戰者'
      : (g && g.you.isDrawer ? '這一題的畫家' : '猜題者');

    $('sum-phase').textContent = (v.room && v.room.closed) ? '房間已結束'
      : (v.room && v.room.phase === 'waiting' ? '等待開始'
        : (g ? (PHASE_LABEL[g.phase] || g.phase) : '—'));
    $('sum-drawer').textContent = g ? drawerName(g) : '—';
    $('sum-role').textContent = youRole;
    $('sum-can').textContent = canDoText(v, g);
    $('sum-hint').textContent = g && g.hint
      ? ((g.you.isDrawer || g.answer)
        ? (g.answer || '') + (g.hint.catLabel ? '（' + g.hint.catLabel + '）' : '')
        : (g.hint.lenShown ? g.hint.mask : '畫家還沒給提示') +
          (g.hint.catLabel ? '（' + g.hint.catLabel + '）' : ''))
      : '—';
    $('sum-conn').textContent = app.mode === 'solo' ? '單機（不需要連線）'
      : ({ connected: '已連線', connecting: '重新連線中…', loading: '載入中…', error: '連線錯誤', offline: '無伺服器', idle: '未連線' }[app.conn.status] || app.conn.status);

    /* 比分 */
    var sl = $('scorelist');
    if (g) {
      var sorted = g.players.slice().sort(function (a, b) { return b.score - a.score; });
      sl.innerHTML = sorted.map(function (p) {
        var cls = ['', p.isDrawer ? 'drawer' : '', p.id === v.you.id ? 'me' : ''].join(' ').trim();
        return '<li class="' + cls + '"><span class="sface" aria-hidden="true">' +
          S.face(indexOfPlayer(g, p.id), moodOf(p, g)) + '</span>' +
          '<span class="sname">' + esc(p.name) + (p.ai ? '（電腦）' : '') + '</span>' +
          '<span class="spts">' + p.score + '</span></li>';
      }).join('');
    } else sl.innerHTML = '';

    /* 最近發生的事 */
    var notes = (v.room && v.room.summary) ? v.room.summary : localSummary();
    var ul = $('sum-list');
    var recent = notes.slice(-8).reverse();
    ul.innerHTML = recent.map(function (n) {
      return '<li data-k="' + esc(n.kind || 'info') + '">' + esc(n.text) + '</li>';
    }).join('');
    $('sum-empty').hidden = recent.length > 0;

    var scope = $('feed-scope');
    if (scope) scope.textContent = app.mode === 'online' && app.roomCode ? ('房號 ' + app.roomCode) : '單機練習';
  }

  function canDoText(v, g) {
    if (v.room && v.room.closed) return '房間已結束，回大廳再開一間吧。';
    if (v.room && v.room.phase === 'waiting') {
      return v.you.role === 'spectator' ? '等這一局開始，你會以觀戰身分看畫。'
        : (v.you.ready ? '已準備，等房主按開始。' : '按「準備好了」讓房主可以開始。');
    }
    if (!g) return '—';
    if (v.you.role === 'spectator') return '觀戰中：可以看畫與猜題紀錄，不能畫也不能猜。';
    if (g.phase === 'picking') return g.you.canPick ? '從三個題目裡挑一個。' : '等畫家挑題目。';
    if (g.phase === 'drawing') {
      if (g.you.isDrawer) return '用工具列把題目畫出來，別讓時間跑完。';
      if (g.you.guessed) return '你已經猜中了，等其他人或時間結束。';
      return '把答案打進下面的猜題框，猜錯不扣分。';
    }
    if (g.phase === 'reveal') return '看一下答案，馬上換下一位畫家。';
    return '這一局結束了，可以再玩一局或離開。';
  }

  /** 單機沒有伺服器摘要，就從本機紀錄湊一份一樣格式的 */
  function localSummary() {
    return app.feed.slice(-8).map(function (m) {
      return { text: m.kind === 'guess' ? (m.from + ' 猜「' + m.text + '」') : m.text, kind: m.kind === 'guess' ? 'info' : (m.kind || 'info') };
    });
  }

  /* ================================================================
     對局設定彈窗
     ================================================================ */

  function setupGameSettings() {
    gameModal = makeModal('game-settings-modal', 'game-settings-panel', 'b-game-settings');
    $('b-game-settings').addEventListener('click', function () { Sound.play('click'); gameModal.open(); renderGameSettings(); });
    $('game-settings-close').addEventListener('click', function () { gameModal.close(); });
    $('game-settings-done').addEventListener('click', function () { gameModal.close(); });
    var back = D.querySelector('[data-game-settings-close]');
    if (back) back.addEventListener('click', function () { gameModal.close(); });

    $('gs-skip').addEventListener('click', function () { doSkip(); gameModal.close(); });
    $('gs-quit').addEventListener('click', function () {
      gameModal.close();
      leaveGame(app.mode === 'online' ? 's-lobby' : 's-home');
    });
  }

  function newInvite() {
    if (app.mode !== 'online' || !app.roomCode) return toast('目前不在可邀請的房間裡。', 'error');
    w.Online.send('room:invite', {
      role: app.inviteRole,
      ttlMinutes: 60,
      maxUses: 20
    }, function (res) {
      if (!res || !res.ok) return toast((res && res.error) || '邀請連結產生失敗。', 'error');
      app.inviteToken = res.token;
      app.inviteUrl = Cfg.inviteUrl(app.roomCode, res.token);
      app.lastOverlayHtml = null;
      renderOverlay();
      toast('邀請連結好了，按「複製」傳給朋友。', 'ok');
    });
  }

  function revokeInvite() {
    if (!app.inviteToken) return;
    w.Online.send('room:revokeInvite', { token: app.inviteToken }, function (res) {
      if (res && res.ok === false) return toast(res.error || '撤銷失敗。', 'error');
      app.inviteToken = null;
      app.inviteUrl = '';
      app.lastOverlayHtml = null;
      renderOverlay();
      toast('邀請連結已撤銷。', 'ok');
    });
  }

  function copyText(text) {
    if (!text) return toast('先按「產生連結」。', 'error');
    var done = function () { toast('已複製到剪貼簿。', 'ok'); };
    if (w.navigator && w.navigator.clipboard && w.navigator.clipboard.writeText) {
      w.navigator.clipboard.writeText(text).then(done).catch(function () { fallback(); });
    } else fallback();
    function fallback() {
      var el = $('invite-url');
      if (!el) return toast('複製失敗，請手動選取連結。', 'error');
      el.removeAttribute('readonly');
      el.select();
      try { D.execCommand('copy'); done(); } catch (e) { toast('複製失敗，請手動選取。', 'error'); }
      el.setAttribute('readonly', 'readonly');
    }
  }

  function renderGameSettings() {
    var v = app.view;
    var online = app.mode === 'online' && v && v.room;

    $('gs-code').textContent = online ? v.room.code : '單機';
    $('gs-role').textContent = !v ? '—'
      : (v.you.role === 'spectator' ? '觀戰者' : (v.game && v.game.you.isDrawer ? '這一題的畫家' : '玩家'));
    $('gs-role-note').textContent = !v ? '—'
      : (v.you.role === 'spectator' ? '可以看畫與猜題紀錄，不能畫也不能猜'
        : '可以畫、可以猜' + (v.you.isHost ? '，而且是房主' : ''));

    var rb = $('gs-role-btns');
    rb.innerHTML = '';
    if (online && v.you.can.becomePlayer) rb.innerHTML = '<button class="btn3d small" data-color="mint" id="gs-become-player">下場一起玩</button>';
    else if (online && v.you.can.becomeSpectator) rb.innerHTML = '<button class="btn3d small" data-color="cream" id="gs-become-spectator">改成觀戰</button>';
    S.decorateAll(rb);
    if ($('gs-become-player')) $('gs-become-player').addEventListener('click', function () { w.Online.send('room:becomePlayer', {}); gameModal.close(); });
    if ($('gs-become-spectator')) $('gs-become-spectator').addEventListener('click', function () { w.Online.send('room:becomeSpectator', {}); gameModal.close(); });

    var canSkip = v && v.you && v.you.can.skip;
    $('gs-skip').disabled = !canSkip;
    $('gs-note').textContent = canSkip
      ? '跳過會直接結束這一題，公布答案，沒有人得分。'
      : (v && v.game ? '只有輪到你當畫家時才能跳過。' : '目前沒有進行中的對局。');
  }

  /* ================================================================
     大廳與線上
     ================================================================ */

  function setupLobby() {
    $('lobby-nick').addEventListener('change', function () {
      Store.nick(this.value.trim().slice(0, 12));
    });
    $('b-lobby-host').addEventListener('click', function () {
      Store.nick($('lobby-nick').value.trim().slice(0, 12));
      Sound.play('click');
      openRoomCreate();
    });
    $('b-lobby-join').addEventListener('click', function () {
      var code = $('lobby-code').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
      if (code.length !== 4) return toast('房號是 4 個英數字。', 'error');
      joinRoom(code, null, 'player');
    });
    $('b-lobby-refresh').addEventListener('click', function () { w.Online.send('lobby:subscribe', {}); });
    $('b-lobby-retry').addEventListener('click', connectOnline);
    $('b-lobby-invite').addEventListener('click', function () {
      if (!app.pendingInvite) return;
      Store.nick($('lobby-nick').value.trim().slice(0, 12));
      joinRoom(app.pendingInvite.code, app.pendingInvite.token, app.pendingInvite.role);
    });
    $('b-lobby-invite-cancel').addEventListener('click', function () {
      app.pendingInvite = null;
      $('lobby-invite').hidden = true;
    });
  }

  function joinRoom(code, token, role) {
    w.Online.send('room:join', { code: code, token: token, role: role, name: Store.nick() }, function (res) {
      if (!res || !res.ok) return toast((res && res.error) || '加入失敗。', 'error');
      if (res.downgraded) toast('位子滿了（或對局進行中），你先以觀戰身分進來。', 'info');
      app.pendingInvite = null;
      $('lobby-invite').hidden = true;
      enterOnlineRoom(res.code);
    });
  }

  function enterOnlineRoom(code) {
    app.mode = 'online';
    app.roomCode = code;
    app.view = null;
    app.feed = [];
    app.feedSeen = {};
    app.unread = 0;
    app.recorded = false;
    app.lastTurnKey = '';
    app.lastPhase = '';
    app.lastGuessedCount = 0;
    app.inviteToken = null;
    app.inviteUrl = '';
    app.lastOverlayHtml = null;
    show('s-game');
    ensurePaint();
    app.paint.clearLocal();
    app.paint.clearRedo();
    setFeedOpen(app.wideLayout ? true : Store.showTrace());
    startLoop();
    /* 保險：萬一第一份投影比 ack 早到而被丟掉，這裡再要一次 */
    w.Online.send('room:resync', {});
    Sound.play('join');
  }

  function leaveGame(target) {
    if (app.mode === 'online') w.Online.send('room:leave', {});
    stopLoop();
    app.mode = null;
    app.solo = null;
    app.view = null;
    app.roomCode = null;
    if (app.paint) { app.paint.setEnabled(false); app.paint.clearLocal(); }
    show(target || 's-home');
    if (target === 's-lobby') connectOnline();
  }

  /** 連線之前先把會送出請求的按鈕停用，避免按了卻沒有送出去 */
  function setLobbyEnabled(on) {
    ['b-lobby-host', 'b-lobby-join', 'b-lobby-refresh', 'b-lobby-invite'].forEach(function (id) {
      var el = $(id);
      if (el) el.disabled = !on;
    });
  }

  function connectOnline() {
    $('lobby-nick').value = Store.nick();
    setLobbyEnabled(false);
    if (!Cfg.isOnlineEnabled()) {
      $('lobby-off').hidden = false;
      $('lobby-live').hidden = true;
      $('lobby-off-note').textContent = Cfg.status === 'invalid'
        ? ('伺服器設定有問題：' + Cfg.error)
        : '線上對戰需要一台開著的伺服器。單機練習完全不受影響，可以直接玩。';
      return;
    }
    $('lobby-state').textContent = '正在連線…';
    w.Online.connect({ clientId: Store.clientId(), name: Store.nick() || '玩家' })
      .then(function () {
        $('lobby-off').hidden = true;
        $('lobby-live').hidden = false;
        setLobbyEnabled(true);
        w.Online.send('lobby:subscribe', {});
        $('lobby-state').textContent = '已連線。';
        checkPendingInvite();
      })
      .catch(function (e) {
        setLobbyEnabled(false);
        $('lobby-off').hidden = false;
        $('lobby-live').hidden = true;
        $('lobby-off-note').textContent = e.message || '連不到伺服器。';
      });
  }

  /** 邀請連結：先停在大廳讓被邀請者確認暱稱，確認後才送出加入 */
  function checkPendingInvite() {
    var entry = Cfg.entry();
    if (!entry.room || !entry.invite) return;
    w.Online.send('invite:check', { code: entry.room, token: entry.invite }, function (res) {
      var box = $('lobby-invite');
      box.hidden = false;
      if (!res || !res.ok) {
        app.pendingInvite = null;
        $('lobby-invite-title').textContent = '這個邀請連結不能用了';
        $('lobby-invite-note').textContent = (res && res.error) || '連結無效。';
        $('b-lobby-invite').hidden = true;
        return;
      }
      app.pendingInvite = { code: entry.room, token: entry.invite, role: res.role };
      $('b-lobby-invite').hidden = false;
      $('lobby-invite-title').textContent = '收到房間 ' + entry.room + ' 的邀請';
      $('lobby-invite-note').textContent =
        '你會以「' + (res.role === 'spectator' ? '觀戰者' : (res.role === 'player' ? '玩家' : '玩家（有位子的話）')) + '」身分加入。' +
        (res.note ? res.note : '') + ' 可以先改上面的暱稱，按下面的按鈕才會真的進房。';
    });
  }

  function renderRoomList(rooms) {
    var host = $('roomlist');
    if (!rooms || !rooms.length) {
      host.innerHTML = '<p class="hint-note">目前沒有公開房間。按「開一間房」自己開一間，把房號或邀請連結傳給朋友。</p>';
      return;
    }
    host.innerHTML = rooms.map(function (r) {
      var phase = { waiting: '等待中', playing: '進行中', finished: '已結束' }[r.phase] || r.phase;
      return '<div class="roomcard"><span class="rc-code">' + esc(r.code) + '</span>' +
        '<span class="rc-main"><b class="rc-name">' + esc(r.name) + '</b>' +
        '<span class="rc-sub"><span class="rc-badge" data-p="' + r.phase + '">' + phase + '</span>' +
        r.players + '/' + r.maxPlayers + ' 位玩家' +
        (r.ai.length ? '（含 ' + r.ai.length + ' 個電腦）' : '') +
        (r.spectators ? '・' + r.spectators + ' 觀戰' : '') +
        '・房主 ' + esc(r.host) + '</span></span>' +
        '<span class="rc-btns">' +
        '<button class="btn3d small" data-color="mint" data-join="' + esc(r.code) + '">加入</button>' +
        '<button class="btn3d small" data-color="sky" data-watch="' + esc(r.code) + '">觀戰</button>' +
        '</span></div>';
    }).join('');
    S.decorateAll(host);
    var j = host.querySelectorAll('[data-join]');
    for (var i = 0; i < j.length; i++) {
      (function (el) { el.addEventListener('click', function () { joinRoom(el.getAttribute('data-join'), null, 'player'); }); }(j[i]));
    }
    var s = host.querySelectorAll('[data-watch]');
    for (var k = 0; k < s.length; k++) {
      (function (el) { el.addEventListener('click', function () { joinRoom(el.getAttribute('data-watch'), null, 'spectator'); }); }(s[k]));
    }
  }

  /* -------------------------------------------------------- 線上事件 */

  function setupOnlineEvents() {
    var O = w.Online;

    O.on('status', function (s) {
      app.conn = s;
      if (app.screen === 's-lobby') {
        if (s.message) $('lobby-state').textContent = s.message;
        setLobbyEnabled(s.status === 'connected');
      }
      if (app.view) renderAside();
    });

    O.on('lobby:rooms', function (p) { renderRoomList(p.rooms); });

    O.on('room:sync', function (v) {
      if (app.mode !== 'online') return;
      var prev = app.view;
      app.view = v;
      app.roomCode = v.room.code;

      /* 換題／換階段：清畫布、播音效 */
      var key = v.game ? (v.game.turnNo + ':' + v.game.phase) : (v.room.phase);
      if (v.game && prev && prev.game && prev.game.turnNo !== v.game.turnNo) {
        app.paint.clearLocal();
        app.paint.clearRedo();
      }
      if (key !== app.lastTurnKey) {
        app.lastTurnKey = key;
        /* 換自己畫的時候，窄版的紀錄浮層先讓開，免得一開始就擋住畫布 */
        if (!app.wideLayout && app.feedOpen && v.game && v.game.you.isDrawer) setFeedOpen(false);
        if (v.game && v.game.phase === 'drawing') Sound.play('turn');
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

      if (v.room.feed) replaceFeed(v.room.feed);
      render();
      if (gameModal && gameModal.isOpen()) renderGameSettings();
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

    O.on('room:feed', function (p) {
      if (app.mode !== 'online') return;
      pushFeed(p.entry);
      Sound.playChat();
    });

    O.on('room:private', function (p) {
      if (p.kind === 'hit') { toast(p.message, 'ok'); Sound.play('correct'); Sound.vibrate([12, 40, 12]); }
      else if (p.kind === 'close') { toast(p.message, 'ok'); Sound.play('close'); }
      else if (p.kind === 'miss') { Sound.play('wrong'); }
      else if (p.kind === 'rejected') { toast(p.message, 'error'); Sound.play('blocked'); }
    });

    O.on('room:error', function (p) { toast(p.message, 'error'); Sound.play('blocked'); });

    O.on('room:closed', function (p) {
      if (app.mode !== 'online') return;
      if (app.view) {
        app.view.room.closed = true;
        app.view.room.closedReason = p.reason;
        render();
      }
      toast(p.reason, 'error');
      Sound.play('leave');
    });

    O.on('room:left', function () {
      app.roomCode = null;
    });

    O.on('reconnected', function () {
      if (app.mode === 'online' && app.roomCode) {
        joinRoom(app.roomCode, null, null);
      }
    });
  }

  function recordResult(v) {
    if (app.recorded || !v.game) return;
    app.recorded = true;
    var me = null;
    for (var i = 0; i < v.game.players.length; i++) if (v.game.players[i].id === v.you.id) me = v.game.players[i];
    if (!me) return;
    var correct = 0;
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

  /* ================================================================
     鍵盤快捷鍵（畫家用）
     ================================================================ */

  function setupKeys() {
    D.addEventListener('keydown', function (ev) {
      if (app.screen !== 's-game') return;
      var tag = (ev.target && ev.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (settingsModal.isOpen() || gameModal.isOpen()) return;
      if (!app.view || !app.view.you.can.draw) return;

      var k = ev.key.toLowerCase();
      if ((ev.ctrlKey || ev.metaKey) && k === 'z') { ev.preventDefault(); doUndo(); return; }
      if ((ev.ctrlKey || ev.metaKey) && (k === 'y' || (k === 'z' && ev.shiftKey))) { ev.preventDefault(); doRedo(); return; }
      var map = { p: 'pen', b: 'brush', l: 'line', r: 'rect', o: 'ellipse', e: 'erase', f: 'fill' };
      if (map[k]) { ev.preventDefault(); chooseTool(map[k]); }
    });
  }

  /* ================================================================
     啟動
     ================================================================ */

  function init() {
    $('logo').innerHTML = S.logo();
    paintIcons();
    S.decorateAll();
    S.decorateBackground($('bgdeco'), 12);
    applyDisplaySettings();

    setupSettings();
    setupRoomCreate();
    setupGameSettings();
    setupTutorial();
    setupSoloScreen();
    setupLobby();
    setupGuessbar();
    setupOnlineEvents();
    setupKeys();
    buildToolbar();
    ensurePaint();
    syncToolbar();

    $('b-solo').addEventListener('click', function () { Sound.play('click'); show('s-solo'); });
    $('b-online').addEventListener('click', function () { Sound.play('click'); show('s-lobby'); connectOnline(); });
    $('b-help').addEventListener('click', function () { Sound.play('click'); tutIndex = 0; show('s-help'); renderTutorial(); });
    $('b-stats').addEventListener('click', function () { Sound.play('click'); renderStats(); show('s-stats'); });

    var backs = D.querySelectorAll('[data-back]');
    for (var i = 0; i < backs.length; i++) {
      (function (b) {
        b.addEventListener('click', function () { Sound.play('click'); show(b.getAttribute('data-back')); });
      }(backs[i]));
    }

    $('b-game-back').addEventListener('click', function () {
      leaveGame(app.mode === 'online' ? 's-lobby' : 's-home');
    });
    $('b-aside-toggle').addEventListener('click', function () { setAsideOpen(!app.asideOpen); Sound.play('click'); });
    $('b-aside-close').addEventListener('click', function () { setAsideOpen(false); });
    $('b-feed-toggle').addEventListener('click', function () { setFeedOpen(!app.feedOpen); Sound.play('click'); });
    $('b-feed-close').addEventListener('click', function () { setFeedOpen(false); });

    /* 窄版的猜題紀錄是疊在畫布上的浮層。輪到自己畫的時候一碰畫布就讓它閃開，
       不然它會擋住左半邊的作畫區。寬版是併在左欄裡，不會擋到，就不用動。 */
    $('board').addEventListener('pointerdown', function () {
      if (!app.wideLayout && app.feedOpen && app.view && app.view.you.can.draw) setFeedOpen(false);
    }, true);

    /* 音訊必須等第一次使用者手勢才能解鎖 */
    var unlock = function () {
      Sound.unlock();
      Sound.startBgm(app.screen === 's-game' ? 'draw' : 'menu');
      D.removeEventListener('pointerdown', unlock);
      D.removeEventListener('keydown', unlock);
    };
    D.addEventListener('pointerdown', unlock);
    D.addEventListener('keydown', unlock);

    w.addEventListener('resize', function () { relayoutFeed(); layoutStage(); });
    w.addEventListener('orientationchange', function () { setTimeout(function () { relayoutFeed(); layoutStage(); }, 250); });
    relayoutFeed();
    layoutStage();

    /* 帶著邀請連結進來：直接停在大廳讓使用者確認暱稱 */
    var entry = Cfg.entry();
    if (entry.room && entry.invite) { show('s-lobby'); connectOnline(); }
    else if (!Store.tutorialDone()) { tutIndex = 0; show('s-help'); renderTutorial(); }
  }

  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init);
  else init();

  /* 給自動化檢查用 */
  w.DrawGuessApp = app;
}(window));
