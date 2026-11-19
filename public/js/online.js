/* ===== online.js — Socket.IO 連線包裝 =====
 *
 * 所有連線位置都從 GameConfig 取得（?server= 或建置注入或同源），
 * 這個檔案裡沒有任何寫死的網址。
 *
 * 對 app.js 只暴露「連線 / 送出意圖 / 訂閱事件」三件事；
 * 房間規則與遊戲規則都在伺服器上判斷，這裡不做任何權限判斷，
 * 只把伺服器算好的 you.can 原封不動交給 UI。
 */
(function (w) {
  'use strict';

  var Config = w.GameConfig;
  var socket = null;
  var loading = null;
  var connectionGeneration = 0;
  var listeners = {};
  var status = 'idle';    // idle | loading | connecting | connected | error | offline
  var lastError = '';
  /* 以伺服器時間校準，再以單調時鐘推進；系統校時不應讓倒數跳秒。 */
  var timeOffset = 0;
  var clockAnchor = null;

  function elapsedNow() {
    return w.performance && typeof w.performance.now === 'function' ? w.performance.now() : Date.now();
  }

  function syncClock(serverTime, sentAt) {
    if (typeof serverTime !== 'number' || !isFinite(serverTime)) return;
    var receivedAt = elapsedNow();
    /* 使用往返延遲中點估計回程時間，回到前景時也重新校準。 */
    var estimate = serverTime + Math.max(0, receivedAt - sentAt) / 2;
    clockAnchor = { server: estimate, elapsed: receivedAt };
    timeOffset = estimate - Date.now();
  }

  function serverNow() {
    return clockAnchor ? clockAnchor.server + Math.max(0, elapsedNow() - clockAnchor.elapsed) : Date.now() + timeOffset;
  }

  var SERVER_EVENTS = [
    'lobby:rooms',
    'room:sync',
    'room:stroke',
    'room:board',
    'room:feed',
    'room:private',
    'room:error',
    'room:closed',
    'room:cheer',
    'room:left',
    'lobbychat:history',
    'lobbychat:msg',
    'lobbychat:online',
    'lobbychat:error'
  ];

  function emitLocal(evt, payload) {
    var list = listeners[evt];
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      try { list[i](payload); } catch (e) { console.error('[online] handler error', e); }
    }
  }

  function on(evt, fn) {
    (listeners[evt] || (listeners[evt] = [])).push(fn);
    return function off() {
      var list = listeners[evt] || [];
      var i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    };
  }

  function setStatus(next, message) {
    status = next;
    if (w.ServerOutage) w.ServerOutage.state(next);
    lastError = message || '';
    emitLocal('status', { status: status, message: lastError });
  }

  /** socket.io 用戶端腳本是由伺服器提供的，所以要從 server URL 載入 */
  function loadScript() {
    if (w.io) return Promise.resolve();
    if (loading) return loading;
    var src = Config.url('/socket.io/socket.io.js');
    if (!src) return Promise.reject(new Error((globalThis.I18N ? globalThis.I18N.t("text.311") : "沒有設定遊戲伺服器位址。")));
    setStatus('loading');
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () {
        loading = null;
        s.remove();
        reject(new Error((globalThis.I18N ? globalThis.I18N.t("text.310") : "連不到遊戲伺服器（") + Config.describe() + (globalThis.I18N ? globalThis.I18N.t("text.309") : "），請確認伺服器有開著。")));
      };
      document.head.appendChild(s);
    });
    return loading;
  }

  /**
   * 建立連線。可以重複呼叫，已連上就直接回傳。
   * @param {{clientId:string, name:string}} identity
   */
  function connect(identity) {
    if (!Config.isOnlineEnabled()) {
      setStatus('offline', Config.error || (globalThis.I18N ? globalThis.I18N.t("text.308") : "目前沒有可用的遊戲伺服器，只能玩單機。"));
      return Promise.reject(new Error(lastError));
    }
    if (socket && socket.connected) return Promise.resolve(socket);

    var generation = connectionGeneration;
    if (w.ServerOutage) w.ServerOutage.state('begin');
    return loadScript().then(function () {
      if (generation !== connectionGeneration) throw new Error('Connection cancelled');
      if (socket) { socket.connect(); return waitHello(identity); }
      setStatus('connecting');
      socket = w.io(Config.serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 800,
        reconnectionDelayMax: 6000,
        timeout: 12000
      });
      if (w.NetworkLatency) w.NetworkLatency.bindSocketIo(socket);

      var firstConnect = true;
      socket.on('connect', function () {
        if (firstConnect) { firstConnect = false; return; }
        sayHello(identity);
      });
      socket.on('disconnect', function (reason) {
        setStatus('connecting', (globalThis.I18N ? globalThis.I18N.t("text.307") : "連線中斷（") + reason + (globalThis.I18N ? globalThis.I18N.t("text.306") : "），正在重試…"));
      });
      socket.on('connect_error', function (err) {
        setStatus('error', (globalThis.I18N ? globalThis.I18N.t("text.305") : "連不上伺服器：") + (err && err.message ? err.message : (globalThis.I18N ? globalThis.I18N.t("text.304") : "未知錯誤")));
      });

      SERVER_EVENTS.forEach(function (evt) {
        socket.on(evt, function (payload) { emitLocal(evt, payload); });
      });

      return waitHello(identity);
    }).catch(function (err) {
      if (generation === connectionGeneration) setStatus('error', err.message || String(err));
      throw err;
    });
  }

  function sayHello(identity) {
    if (!socket) return;
    var target = socket;
    var sentAt = elapsedNow();
    target.emit('hello', { clientId: identity.clientId, name: identity.name }, function (res) {
      if (socket !== target || !target.connected || !res || !res.ok) return;
      syncClock(res.serverTime, sentAt);
      setStatus('connected');
      emitLocal('reconnected', {});
    });
  }

  function waitHello(identity) {
    var target = socket;
    var generation = connectionGeneration;
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error((globalThis.I18N ? globalThis.I18N.t("text.303") : "伺服器沒有回應（免費方案冷啟動可能要十幾秒，請再試一次）。")));
      }, 15000);
      var finish = function () {
        if (done) return;
        if (generation !== connectionGeneration) return;
        var sentAt = elapsedNow();
        target.emit('hello', { clientId: identity.clientId, name: identity.name }, function (res) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          if (generation !== connectionGeneration) { reject(new Error('Connection cancelled')); return; }
          if (res && res.ok) {
            syncClock(res.serverTime, sentAt);
            setStatus('connected');
            resolve(target);
          }
          else reject(new Error((globalThis.I18N ? globalThis.I18N.t("text.302") : "伺服器拒絕連線。")));
        });
      };
      if (target.connected) finish();
      else target.once('connect', finish);
    });
  }

  /* ------------------------------------------------------------ 存活檢查
   * 手機切到背景、關螢幕、換網路之後，瀏覽器手上的連線常常已經是死的，
   * 但要等到心跳逾時才會發現，這段時間畫面看起來連著、送出去的動作卻石沉大海。
   * 回到前景或網路恢復時主動確認一次：
   *   - 已經斷線、正在等下一次重試 → 不等退避時間，馬上重連
   *   - 看起來連著 → 丟一個要回條的探測，PROBE_MS 內沒回就當它死了，直接重連
   * 重連成功後照原本流程 hello → reconnected → 回到房間或重新訂閱大廳。 */
  var PROBE_MS = 4000;
  var probing = false;
  var offlineMarked = false;

  function interrupted(reason) {
    return (globalThis.I18N ? globalThis.I18N.t("text.307") : "連線中斷（") + reason +
      (globalThis.I18N ? globalThis.I18N.t("text.306") : "），正在重試…");
  }

  function forceReconnect(target) {
    if (socket !== target) return;
    setStatus('connecting', interrupted('probe'));
    target.disconnect();
    target.connect();
  }

  function probe() {
    var target = socket;
    if (!target || probing) return;
    if (!target.connected) {
      /* 首次連線還在進行中就不要打斷它；已經掉線在等重試的才立刻重來 */
      if (status !== 'loading' && !(target.io && target.io._readyState === 'opening')) {
        target.disconnect();
        target.connect();
      }
      return;
    }
    probing = true;
    var sentAt = elapsedNow();
    target.timeout(PROBE_MS).emit('latency:ping', Date.now(), function (err, res) {
      probing = false;
      if (socket !== target || !target.connected) return;
      if (err) { forceReconnect(target); return; }
      if (res) syncClock(res.serverTime, sentAt);
      /* 瀏覽器報過離線、但這條連線其實撐過來了：把「重試中」的狀態改回已連線 */
      if (offlineMarked && socket === target && target.connected) setStatus('connected');
      offlineMarked = false;
    });
  }

  function onResume() {
    if (document.visibilityState === 'hidden') return;
    probe();
  }
  document.addEventListener('visibilitychange', onResume);
  w.addEventListener('pageshow', onResume);
  w.addEventListener('online', onResume);
  w.addEventListener('offline', function () {
    if (!socket) return;
    offlineMarked = status === 'connected';
    setStatus('connecting', interrupted('offline'));
  });

  function send(evt, payload, ack) {
    if (!socket || !socket.connected) {
      emitLocal('room:error', { message: (globalThis.I18N ? globalThis.I18N.t("text.301") : "目前沒有連線，動作沒有送出去。請等重新連線後再試。"), code: 'offline' });
      return false;
    }
    if (evt === 'room:leave' && w.GameAnalytics) w.GameAnalytics.roomLeft();
    if (ack) socket.emit(evt, payload || {}, function (res) {
      if (res && res.ok && w.GameAnalytics && (evt === 'room:create' || evt === 'room:join')) {
        w.GameAnalytics.roomAccepted(evt === 'room:create' ? 'create' : 'join', res.code || (payload && payload.code), payload && payload.token ? 'invite_link' : 'lobby', res.mode);
      }
      ack(res);
    });
    else socket.emit(evt, payload || {});
    return true;
  }

  function disconnect() {
    connectionGeneration++;
    if (socket) { socket.removeAllListeners(); socket.disconnect(); socket = null; }
    setStatus('idle');
  }

  w.Online = {
    on: on,
    connect: connect,
    send: send,
    disconnect: disconnect,
    /** 主動確認連線還活著（回到前景、網路恢復時會自動呼叫） */
    probe: probe,
    isConnected: function () { return !!socket && socket.connected; },
    /** 換算成伺服器時間，用來算倒數 */
    now: serverNow,
    timeOffset: function () { return timeOffset; },
    status: function () { return { status: status, message: lastError }; }
  };
}(window));
