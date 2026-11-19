/* ===== relay-rules.js — 接力模式（Beta）的規則核心（伺服器、測試、畫面共用） =====
 *
 * 跟一般模式（rules.js）完全分開的一份規則：一般模式的程式路徑一行都不經過這裡。
 * 共用的只有筆畫消毒、提示遮罩與提示張數這類「純工具」，直接借 Rules 的實作。
 *
 * 這一層一樣只有「狀態 + 行動 → 新狀態」，沒有畫面、網路與計時器；時間由呼叫端把 now 傳進來，
 * 種子亂數決定候選題、平手抽選與接力順序，所以同一個種子加上同一串行動一定得到同一個結果。
 *
 * 一題的節奏（每題一位猜題者，其餘玩家都是畫家）
 *   voting     畫家從 4 個候選題投票（10 秒；全部投完提前結束；平手隨機；沒人投也隨機）
 *   countdown  3、2、1、開始！
 *   drawing    輪到的畫家畫一棒（一定畫滿秒數，不能提早交棒）
 *   handoff    換棒緩衝 3 秒，畫布鎖住；最後一棒之後也有這段緩衝，之後才公布答案
 *   reveal     公布答案 7 秒，可以對整張圖按表情
 *   →（下一位猜題者）… 每個人都當滿 guessRounds 次猜題者就 over
 *
 * 隱藏資訊：答案只放在 state.wordId。對外一律走 toPublic(state, viewerId)：
 * 猜題者在公布前拿不到答案與候選題；畫家、還沒上場的新玩家與觀戰者都看得到。
 */
(function (root, factory) {
  'use strict';
  var node = typeof module === 'object' && module.exports;
  var api = factory(
    node ? require('./rng.js') : root.RNG,
    node ? require('./words.js') : root.Words,
    node ? require('./rules.js') : root.Rules
  );
  if (node) module.exports = api;
  root.RelayRules = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (RNG, Words, Rules) {
  'use strict';

  var CONST = {
    MIN_PLAYERS: 3,          // 開局最少人數；遊戲中掉到這個數字以下就直接結算
    MAX_PLAYERS: 8,
    CHOICES: 4,
    VOTE_MS: 10000,
    COUNTDOWN_MS: 3000,
    HANDOFF_MS: 3000,
    LAPS: 3,                 // 每題最多接力三圈
    REVEAL_MS: 7000,
    BATON_SEC: [7, 12, 17],
    BATON_SEC_DEFAULT: 12,
    GUESS_ROUNDS_MAX: 5,
    GUESS_ROUNDS_DEFAULT: 1,
    SCORE_FIRST: 300,
    SCORE_LAST: 100,
    HINT_FACTOR: 0.6,
    HINTS: 3,
    GUESS_MAX: 40,
    GALLERY_MAX: 60,
    MAX_STROKES: Rules.CONST.MAX_STROKES,
    MAX_TOTAL_POINTS: Rules.CONST.MAX_TOTAL_POINTS
  };

  var PHASES = ['idle', 'voting', 'countdown', 'drawing', 'handoff', 'reveal', 'over'];
  /* 這一題還在進行中（猜題者斷線就要直接公布答案的階段） */
  var ACTIVE = ['voting', 'countdown', 'drawing', 'handoff'];
  var REACTIONS = Rules.REACTIONS;
  /* 沒在畫的畫家可以對當下作畫者丟的表情；猜題者看不到 */
  var CHEERS = ['cheer', 'lol', 'panic'];
  var AWARDS = ['guess', 'relay', 'key'];

  var err = function (key, code, params) { return { ok: false, error: key, params: params || null, code: code || 'invalid' }; };
  var ok = function (extra) { return Object.assign({ ok: true }, extra || {}); };
  var clamp = function (v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); };
  var isActive = function (phase) { return ACTIVE.indexOf(phase) >= 0; };

  /* ------------------------------------------------------------ 建立 */

  function normBatonSec(v) {
    var n = Math.round(Number(v));
    return CONST.BATON_SEC.indexOf(n) >= 0 ? n : CONST.BATON_SEC_DEFAULT;
  }

  function normGuessRounds(v) {
    var n = Math.round(Number(v));
    return isFinite(n) && n >= 1 ? Math.min(n, CONST.GUESS_ROUNDS_MAX) : CONST.GUESS_ROUNDS_DEFAULT;
  }

  function newPlayer(p, i) {
    return {
      id: String(p.id),
      name: String(p.name || ('P' + (i + 1))),
      score: Math.max(0, Number(p.score) || 0),
      guessPts: Math.max(0, Number(p.guessPts) || 0),   // 當猜題者拿到的分數（神猜手）
      drawPts: Math.max(0, Number(p.drawPts) || 0),     // 當畫家拿到的分數（接力王）
      keys: Math.max(0, Math.floor(Number(p.keys) || 0)),  // 在他那一棒被猜中的題數（關鍵一筆）
      asGuesser: Math.max(0, Math.floor(Number(p.asGuesser) || 0)),
      pending: false                                     // 中途進來、下一題才加入接力
    };
  }

  /**
   * @param {object} opts
   *   seed         字串種子
   *   players      [{id, name}]，順序就是座位順序（猜題者照座位輪流）
   *   guessRounds  每人當猜題者幾次（1–5）
   *   batonSec     每棒秒數（7／12／17）
   *   diff         1/2/3 或 0＝混合
   *   category     種類代碼，空字串＝全部
   *   lang         題庫語言
   */
  function createState(opts) {
    var o = opts || {};
    var players = (o.players || []).slice(0, CONST.MAX_PLAYERS).map(newPlayer);
    return {
      mode: 'relay',
      seed: RNG.normalizeSeed(o.seed) || RNG.randomSeed(null, 6),
      lang: Words.normLang(o.lang),
      diff: [1, 2, 3].indexOf(Number(o.diff)) >= 0 ? Number(o.diff) : 0,
      category: Words.CATEGORY_KEYS.indexOf(o.category) >= 0 ? o.category : '',
      guessRounds: normGuessRounds(o.guessRounds),
      batonMs: normBatonSec(o.batonSec) * 1000,
      players: players,
      seats: players.map(function (p) { return p.id; }),
      seatIdx: -1,
      questionNo: 0,
      phase: 'idle',
      guesserId: null,
      choices: [],
      votes: {},
      order: [],          // 這一題的接力順序（畫家 id），每題重新隨機
      batons: [],         // 每一棒輪到誰：order 重複三圈
      batonNo: 0,
      drawerId: null,
      drawn: [],          // 這一題真的畫過的畫家（畫廊用）
      wordId: null,
      usedWords: [],
      hints: 0,
      revealed: [],
      hintPlan: [],
      strokes: [],
      pointCount: 0,
      wrong: 0,
      deadline: 0,
      startedAt: 0,
      log: [],
      gallery: [],
      awards: null,
      over: false,
      winners: [],
      endedAt: 0
    };
  }

  function player(state, id) {
    for (var i = 0; i < state.players.length; i++) if (state.players[i].id === id) return state.players[i];
    return null;
  }

  function word(state) { return state.wordId ? Words.byId(state.wordId, state.lang) : null; }

  /** 這個人還欠幾次猜題者 */
  function owes(state, id) {
    var p = player(state, id);
    return p ? Math.max(0, state.guessRounds - p.asGuesser) : 0;
  }

  /** 全場總題數：已經開始的題數 + 每個人還欠的次數（中途加入或離開會跟著變） */
  function totalQuestions(state) {
    var owed = 0;
    for (var i = 0; i < state.players.length; i++) owed += owes(state, state.players[i].id);
    return state.questionNo + owed;
  }

  /** 第 batonNo 棒（0 起算），共 total 棒：300 平均降到 100，再乘上提示折扣 */
  function batonPoints(batonNo, total, hintsUsed) {
    var base = total <= 1 ? CONST.SCORE_FIRST
      : CONST.SCORE_FIRST - (CONST.SCORE_FIRST - CONST.SCORE_LAST) * clamp(batonNo, 0, total - 1) / (total - 1);
    return Math.round(base * Math.pow(CONST.HINT_FACTOR, Math.max(0, hintsUsed || 0)));
  }

  function awayFn(opts) {
    var a = opts && opts.away;
    if (!a) return function () { return false; };
    if (typeof a === 'function') return a;
    var list = Array.isArray(a) ? a : Array.from(a);
    return function (id) { return list.indexOf(id) >= 0; };
  }

  /* ------------------------------------------------------------ 開局與換題 */

  function start(state, now) {
    if (state.players.length < CONST.MIN_PLAYERS) return err('srv.err.relayMinPlayers', 'players', { n: CONST.MIN_PLAYERS });
    for (var i = 0; i < state.players.length; i++) {
      var p = state.players[i];
      p.score = 0; p.guessPts = 0; p.drawPts = 0; p.keys = 0; p.asGuesser = 0; p.pending = false;
    }
    state.seatIdx = -1;
    state.questionNo = 0;
    state.usedWords = [];
    state.log = [];
    state.gallery = [];
    state.awards = null;
    state.over = false;
    state.winners = [];
    state.startedAt = now;
    beginQuestion(state, now);
    return ok({ state: state });
  }

  /** 照座位順序找下一位還欠猜題次數的人；都當滿了回 -1 */
  function nextGuesserIdx(state) {
    var n = state.seats.length;
    for (var step = 1; step <= n; step++) {
      var idx = (state.seatIdx + step) % n;
      if (owes(state, state.seats[idx]) > 0) return idx;
    }
    return -1;
  }

  /** 開始新的一題：決定猜題者、重新隨機接力順序、抽 4 個候選題，進入投票 */
  function beginQuestion(state, now) {
    var idx = nextGuesserIdx(state);
    if (idx < 0) { finish(state, now); return state; }
    for (var i = 0; i < state.players.length; i++) state.players[i].pending = false;
    state.seatIdx = idx;
    state.guesserId = state.seats[idx];
    player(state, state.guesserId).asGuesser += 1;
    state.questionNo += 1;

    var order = state.seats.filter(function (id) { return id !== state.guesserId && !!player(state, id); });
    var rng = RNG.createRng(state.seed + ':relay-order:' + state.questionNo);
    for (var k = order.length - 1; k > 0; k--) {
      var j = Math.floor(rng() * (k + 1)) % (k + 1);
      var t = order[k]; order[k] = order[j]; order[j] = t;
    }
    state.order = order;
    state.batons = [];
    state.batonNo = 0;
    state.drawerId = null;
    state.drawn = [];
    state.votes = {};
    state.wordId = null;
    state.hints = 0;
    state.revealed = [];
    state.hintPlan = [];
    state.strokes = [];
    state.pointCount = 0;
    state.wrong = 0;
    state.phase = 'voting';
    state.deadline = now + CONST.VOTE_MS;

    var crng = RNG.createRng(state.seed + ':relay-choices:' + state.questionNo);
    var pickOpts = { diff: state.diff || 0, cat: state.category, exclude: state.usedWords };
    state.choices = Words.pick(crng, CONST.CHOICES, pickOpts);
    if (state.choices.length < CONST.CHOICES) {
      state.usedWords = [];
      state.choices = Words.pick(crng, CONST.CHOICES, { diff: state.diff || 0, cat: state.category });
    }
    return state;
  }

  /* ------------------------------------------------------------ 投票 */

  function voteCounts(state) {
    var counts = {};
    for (var i = 0; i < state.choices.length; i++) counts[state.choices[i]] = 0;
    Object.keys(state.votes).forEach(function (voter) {
      var id = state.votes[voter];
      if (counts[id] !== undefined && state.order.indexOf(voter) >= 0) counts[id] += 1;
    });
    return counts;
  }

  function allVoted(state, isAway) {
    var voters = state.order.filter(function (id) { return !isAway(id); });
    if (!voters.length) return false;
    return voters.every(function (id) { return state.votes[id] !== undefined; });
  }

  /** 畫家投一票（可以改票）；全部投完就提前開始 */
  function vote(state, playerId, wordId, now) {
    if (state.phase !== 'voting') return err('srv.err.relayNotVoting', 'phase');
    if (playerId === state.guesserId) return err('srv.err.relayGuesserNoVote', 'forbidden');
    if (state.order.indexOf(playerId) < 0) return err('srv.err.relayNotPainter', 'forbidden');
    var id = String(wordId || '');
    if (state.choices.indexOf(id) < 0) return err('srv.err.relayPickFromFour', 'choice');
    state.votes[playerId] = id;
    var settled = false;
    if (allVoted(state, function () { return false; })) { settleVote(state, now); settled = true; }
    return ok({ wordId: id, settled: settled });
  }

  /** 開票：最高票；平手從同票題目隨機；沒人投就從全部候選隨機 */
  function settleVote(state, now) {
    var counts = voteCounts(state);
    var best = 0;
    state.choices.forEach(function (id) { best = Math.max(best, counts[id]); });
    var top = state.choices.filter(function (id) { return counts[id] === best; });
    var rng = RNG.createRng(state.seed + ':relay-vote:' + state.questionNo);
    var chosen = top[Math.floor(rng() * top.length) % top.length];
    state.wordId = chosen;
    state.usedWords.push(chosen);
    if (state.usedWords.length > 200) state.usedWords.splice(0, 100);
    var w = word(state);
    var hrng = RNG.createRng(state.seed + ':relay-hint:' + state.questionNo);
    var slots = w ? Words.revealable(w) : [];
    state.hintPlan = slots.length >= 2 ? [slots[Math.floor(hrng() * slots.length) % slots.length]] : [];
    state.batons = [];
    for (var lap = 0; lap < CONST.LAPS; lap++) state.batons = state.batons.concat(state.order);
    state.phase = 'countdown';
    state.deadline = now + CONST.COUNTDOWN_MS;
    return { wordId: chosen, votes: best };
  }

  /* ------------------------------------------------------------ 接力 */

  /** 從 from 開始找下一個可以上場的棒次（跳過斷線的畫家），沒有了回 -1 */
  function nextBatonIdx(state, from, isAway) {
    for (var i = from; i < state.batons.length; i++) {
      var id = state.batons[i];
      if (player(state, id) && !isAway(id)) return i;
    }
    return -1;
  }

  function startBaton(state, idx, now) {
    state.batonNo = idx;
    state.drawerId = state.batons[idx];
    if (state.drawn.indexOf(state.drawerId) < 0) state.drawn.push(state.drawerId);
    state.phase = 'drawing';
    state.deadline = now + state.batonMs;
  }

  /** 這一棒結束（時間到、或畫家斷線被跳過）：進 3 秒緩衝，畫布鎖住 */
  function endBaton(state, now) {
    state.phase = 'handoff';
    state.deadline = now + CONST.HANDOFF_MS;
  }

  /** 換棒緩衝時「下一棒是誰」（顯示用；真正換棒時會再算一次，中間有人斷線就跳過） */
  function upcomingDrawer(state, isAway) {
    var from = state.phase === 'countdown' || state.phase === 'voting' ? 0 : state.batonNo + 1;
    var idx = nextBatonIdx(state, from, isAway || function () { return false; });
    return idx >= 0 ? state.batons[idx] : null;
  }

  function currentDrawer(state) {
    return (state.phase === 'drawing' || state.phase === 'handoff') ? (state.batons[state.batonNo] || null) : null;
  }

  /* ------------------------------------------------------------ 作畫 */

  function addStroke(state, playerId, raw) {
    if (state.phase !== 'drawing') return err('srv.err.relayNotYourBaton', 'phase');
    if (playerId !== state.drawerId) return err('srv.err.relayNotYourBaton', 'forbidden');
    var stroke = Rules.sanitizeStroke(raw);
    if (!stroke) return err('srv.err.badStroke', 'stroke');
    if (state.strokes.length >= CONST.MAX_STROKES) return err('srv.err.tooManyStrokes', 'limit');
    if (state.pointCount + stroke.p.length / 2 > CONST.MAX_TOTAL_POINTS) return err('srv.err.tooFull', 'limit');
    stroke.n = state.strokes.length + 1;
    state.strokes.push(stroke);
    state.pointCount += stroke.p.length / 2;
    return ok({ stroke: stroke });
  }

  /** 復原：收回畫布上最後一筆（不管是誰畫的） */
  function undoStroke(state, playerId) {
    if (state.phase !== 'drawing' || playerId !== state.drawerId) return err('srv.err.relayNotYourBaton', 'forbidden');
    if (!state.strokes.length) return err('srv.err.boardEmpty', 'empty');
    var removed = state.strokes.pop();
    state.pointCount -= removed.p.length / 2;
    return ok({ removed: removed });
  }

  function clearBoard(state, playerId) {
    if (state.phase !== 'drawing' || playerId !== state.drawerId) return err('srv.err.relayNotYourBaton', 'forbidden');
    state.strokes = [];
    state.pointCount = 0;
    return ok();
  }

  /* ------------------------------------------------------------ 猜題 */

  function credit(state, id, pts, field) {
    var p = player(state, id);
    if (!p) return;
    p.score += pts;
    p[field] += pts;
  }

  /**
   * 猜題者隨時可猜（作畫中與換棒緩衝都可以），次數不限。
   * 緩衝中猜中算上一棒：handoff 時 batonNo 仍指向剛畫完的那一棒。
   */
  function guess(state, playerId, text, now) {
    if (playerId !== state.guesserId) return err('srv.err.relayNotGuesser', 'forbidden');
    if (state.phase !== 'drawing' && state.phase !== 'handoff') return err('srv.err.notGuessTime', 'phase');
    var clean = String(text === undefined || text === null ? '' : text).slice(0, CONST.GUESS_MAX);
    if (!Words.normalize(clean, state.lang)) return err('srv.err.emptyGuess', 'empty');
    var verdict = Words.match(word(state), clean);
    if (verdict !== 'hit') {
      state.wrong += 1;
      return ok({ verdict: verdict, points: 0 });
    }
    var drawerId = state.batons[state.batonNo];
    var pts = batonPoints(state.batonNo, state.batons.length, state.hints);
    credit(state, playerId, pts, 'guessPts');
    credit(state, drawerId, pts, 'drawPts');
    var dp = player(state, drawerId);
    if (dp) dp.keys += 1;
    var e = endQuestion(state, now, 'hit', { drawerId: drawerId, points: pts });
    return ok({ verdict: 'hit', points: pts, drawerId: drawerId, entry: e.entry });
  }

  /** 猜題者自己按提示：字數 → 種類 → 揭一個字；每用一張，之後得分再打六折 */
  function useHint(state, playerId, now) {
    if (playerId !== state.guesserId) return err('srv.err.relayHintGuesser', 'forbidden');
    if (state.phase !== 'drawing' && state.phase !== 'handoff') return err('srv.err.noWordNow', 'phase');
    var total = Rules.hintTotal(state);
    var next = state.hints + 1;
    if (next > total) return err(total < CONST.HINTS ? 'srv.err.noThirdHint' : 'srv.err.allHintsGiven', 'hint');
    state.hints = next;
    if (next === 3 && state.hintPlan.length) state.revealed = [state.hintPlan[0]];
    return ok({ step: next, mask: Rules.maskOf(state), at: now });
  }

  /** 猜題者放棄：直接公布答案，這題沒人得分 */
  function giveUp(state, playerId, now) {
    if (playerId !== state.guesserId) return err('srv.err.relayNotGuesser', 'forbidden');
    if (['countdown', 'drawing', 'handoff'].indexOf(state.phase) < 0) return err('srv.err.noWordNow', 'phase');
    return endQuestion(state, now, 'giveup');
  }

  /* ------------------------------------------------------------ 公布與結算 */

  function nameOf(state, id) {
    var p = player(state, id);
    return p ? p.name : '—';
  }

  function endQuestion(state, now, reason, hit) {
    if (!isActive(state.phase)) return err('srv.err.turnEnded', 'phase');
    var w = word(state);
    var painters = state.drawn.map(function (id) { return { id: id, name: nameOf(state, id) }; });
    var entry = {
      questionNo: state.questionNo,
      turnNo: state.questionNo,
      guesserId: state.guesserId,
      guesserName: nameOf(state, state.guesserId),
      wordId: state.wordId,
      word: w ? w.text : null,
      cat: w ? w.cat : null,
      reason: reason,
      hit: reason === 'hit',
      drawerId: hit ? hit.drawerId : null,
      drawerName: hit ? nameOf(state, hit.drawerId) : null,
      points: hit ? hit.points : 0,
      batonNo: hit ? state.batonNo : -1,
      batons: state.batons.length,
      hints: state.hints,
      wrong: state.wrong,
      painters: painters,
      at: now
    };
    state.log.push(entry);
    if (w && state.strokes.length) {
      state.gallery.push({
        turnNo: state.questionNo,
        guesserId: state.guesserId,
        guesserName: entry.guesserName,
        painters: painters,
        hit: entry.hit,
        wordId: state.wordId,
        word: w.text,
        cat: w.cat,
        strokes: state.strokes.slice(),
        reactions: { heart: [], laugh: [], clap: [] }
      });
      if (state.gallery.length > CONST.GALLERY_MAX) state.gallery.shift();
    }
    state.phase = 'reveal';
    state.drawerId = null;
    state.deadline = now + CONST.REVEAL_MS;
    return ok({ entry: entry });
  }

  function topBy(state, field) {
    var best = 0;
    state.players.forEach(function (p) { best = Math.max(best, p[field]); });
    if (best <= 0) return [];
    return state.players.filter(function (p) { return p[field] === best; })
      .map(function (p) { return { id: p.id, name: p.name, value: best }; });
  }

  /** 三個獎項：神猜手（猜題得分）、接力王（作畫得分）、關鍵一筆（在他那一棒被猜中的題數） */
  function awardsOf(state) {
    return { guess: topBy(state, 'guessPts'), relay: topBy(state, 'drawPts'), key: topBy(state, 'keys') };
  }

  function finish(state, now) {
    state.phase = 'over';
    state.over = true;
    state.deadline = 0;
    state.drawerId = null;
    var best = -1;
    state.players.forEach(function (p) { best = Math.max(best, p.score); });
    state.winners = state.players.filter(function (p) { return p.score === best; }).map(function (p) { return p.id; });
    state.awards = awardsOf(state);
    state.endedAt = now;
    return ok({ state: state, winners: state.winners });
  }

  /* ------------------------------------------------------------ 時間 */

  /**
   * 推進時間。
   * @param {object} [opts] { away: Set|Array|function } 目前斷線中的玩家：
   *   猜題者斷線 → 這題直接公布；輪到的畫家斷線 → 跳過換下一位；投票不等斷線的人。
   */
  function tick(state, now, opts) {
    var isAway = awayFn(opts);
    var events = [];
    for (var guard = 0; guard < 16; guard++) {
      var ph = state.phase;
      if (ph === 'over' || ph === 'idle') break;

      if (isActive(ph) && isAway(state.guesserId)) {
        var gl = endQuestion(state, now, 'guesserleft');
        if (gl.ok) events.push({ type: 'questionend', entry: gl.entry });
        continue;
      }
      if (isActive(ph) && !state.order.some(function (id) { return !!player(state, id); })) {
        var np = endQuestion(state, now, 'nopainters');
        if (np.ok) events.push({ type: 'questionend', entry: np.entry });
        continue;
      }

      if (ph === 'voting') {
        if (!allVoted(state, isAway) && now < state.deadline) break;
        var sv = settleVote(state, now);
        events.push({ type: 'votesettled', wordId: sv.wordId });
        continue;
      }
      if (ph === 'countdown') {
        if (now < state.deadline) break;
        var first = nextBatonIdx(state, 0, isAway);
        if (first < 0) {
          var nb = endQuestion(state, now, 'nopainters');
          if (nb.ok) events.push({ type: 'questionend', entry: nb.entry });
          continue;
        }
        startBaton(state, first, now);
        events.push({ type: 'batonstart', batonNo: first, drawerId: state.drawerId });
        continue;
      }
      if (ph === 'drawing') {
        if (isAway(state.drawerId)) {
          var skipped = state.drawerId;
          endBaton(state, now);
          events.push({ type: 'batonskip', drawerId: skipped, next: upcomingDrawer(state, isAway) });
          continue;
        }
        if (now < state.deadline) break;
        endBaton(state, now);
        events.push({ type: 'handoff', batonNo: state.batonNo, next: upcomingDrawer(state, isAway) });
        continue;
      }
      if (ph === 'handoff') {
        if (now < state.deadline) break;
        var nx = nextBatonIdx(state, state.batonNo + 1, isAway);
        if (nx < 0) {
          var tu = endQuestion(state, now, 'timeup');
          if (tu.ok) events.push({ type: 'questionend', entry: tu.entry });
          continue;
        }
        startBaton(state, nx, now);
        events.push({ type: 'batonstart', batonNo: nx, drawerId: state.drawerId });
        continue;
      }
      if (ph === 'reveal') {
        if (now < state.deadline) break;
        beginQuestion(state, now);
        if (state.over) events.push({ type: 'gameover', winners: state.winners });
        else events.push({ type: 'questionstart', questionNo: state.questionNo, guesserId: state.guesserId });
        continue;
      }
      break;
    }
    return { events: events };
  }

  /* ------------------------------------------------------------ 成員異動 */

  /** 有人離開：從座位、接力順序與之後的棒次拿掉；人數不夠就結算 */
  function removePlayer(state, id, now) {
    var idx = -1;
    for (var i = 0; i < state.players.length; i++) if (state.players[i].id === id) idx = i;
    if (idx < 0) return err('srv.err.noSuchPlayer', 'gone');
    state.players.splice(idx, 1);
    var si = state.seats.indexOf(id);
    if (si >= 0) {
      state.seats.splice(si, 1);
      /* 指標往回退一格：下一次 +1 才會剛好落在原本的下一位 */
      if (si <= state.seatIdx) state.seatIdx -= 1;
    }
    delete state.votes[id];
    var oi = state.order.indexOf(id);
    if (oi >= 0) state.order.splice(oi, 1);
    /* 還沒輪到的棒次拿掉；目前這一棒（含已經畫完的）留著，計分與紀錄才對得上 */
    state.batons = state.batons.filter(function (b, k) { return b !== id || k <= state.batonNo; });

    if (state.over) return ok({ removed: id });
    if (state.players.length < CONST.MIN_PLAYERS) {
      finish(state, now);
      return ok({ removed: id, finished: true });
    }
    if (id === state.guesserId && isActive(state.phase)) {
      var e = endQuestion(state, now, 'guesserleft');
      return ok({ removed: id, questionEnded: e.ok ? e.entry : null });
    }
    if (state.phase === 'drawing' && state.drawerId === id) {
      endBaton(state, now);
      return ok({ removed: id, batonSkipped: true });
    }
    return ok({ removed: id });
  }

  /** 對局中有人加入：這一題先觀戰，下一題加入接力順序，並補排他當猜題者的輪次 */
  function addPlayer(state, p) {
    if (state.over) return err('srv.err.gameOver', 'over');
    if (player(state, String(p.id))) return ok({ state: state, already: true });
    if (state.players.length >= CONST.MAX_PLAYERS) return err('srv.err.seatsFull', 'full');
    var entry = newPlayer(p, state.players.length);
    entry.pending = state.phase !== 'idle';
    state.players.push(entry);
    state.seats.push(entry.id);
    return ok({ state: state, player: entry });
  }

  /* ------------------------------------------------------------ 表情 */

  function currentGalleryItem(state) {
    var list = state.gallery || [];
    var last = list.length ? list[list.length - 1] : null;
    return last && last.turnNo === state.questionNo ? last : null;
  }

  /** 公布答案時對整張完成圖按表情（再按一次收回）；這一局的玩家都可以按 */
  function react(state, playerId, kind) {
    if (state.phase !== 'reveal') return err('srv.err.reactRevealOnly', 'phase');
    if (!player(state, playerId)) return err('srv.err.notInGame', 'forbidden');
    if (typeof kind !== 'string' || REACTIONS.indexOf(kind) < 0) return err('srv.err.badReaction', 'invalid');
    var item = currentGalleryItem(state);
    if (!item) return err('srv.err.nothingToReact', 'empty');
    var list = item.reactions[kind];
    var at = list.indexOf(playerId);
    if (at >= 0) list.splice(at, 1); else list.push(playerId);
    return ok({ kind: kind, on: at < 0, count: list.length });
  }

  /** 沒在畫的畫家可以對當下作畫者丟表情 */
  function canCheer(state, playerId) {
    if (state.phase !== 'drawing' && state.phase !== 'handoff') return false;
    if (playerId === state.guesserId || state.order.indexOf(playerId) < 0) return false;
    return playerId !== currentDrawer(state);
  }

  function cheer(state, playerId, kind) {
    if (typeof kind !== 'string' || CHEERS.indexOf(kind) < 0) return err('srv.err.badReaction', 'invalid');
    if (!canCheer(state, playerId)) return err('srv.err.relayCheerForbidden', 'forbidden');
    return ok({ kind: kind, from: playerId, to: currentDrawer(state) });
  }

  function publicReactions(state, viewerId) {
    if (state.phase !== 'reveal') return null;
    var item = currentGalleryItem(state);
    if (!item) return null;
    var counts = {}, mine = [];
    REACTIONS.forEach(function (k) {
      counts[k] = item.reactions[k].length;
      if (viewerId && item.reactions[k].indexOf(viewerId) >= 0) mine.push(k);
    });
    return { turnNo: item.turnNo, counts: counts, mine: mine, canReact: !!viewerId && !!player(state, viewerId) };
  }

  /** 結算後的畫廊（含筆畫與參與畫家）；整局結束前不提供 */
  function galleryOf(state) {
    if (state.phase !== 'over') return [];
    return (state.gallery || []).map(function (it) {
      return {
        turnNo: it.turnNo, mode: 'relay',
        drawerId: it.guesserId, drawerName: it.painters.map(function (p) { return p.name; }).join('、'),
        guesserId: it.guesserId, guesserName: it.guesserName,
        painters: it.painters, hit: it.hit,
        word: it.word, cat: it.cat, strokes: it.strokes,
        reactions: { heart: it.reactions.heart.length, laugh: it.reactions.laugh.length, clap: it.reactions.clap.length }
      };
    });
  }

  /* ------------------------------------------------------------ 投影 */

  /** 看的人在這一題的角色：guesser／drawer（正在畫）／painter／pending（下一題才加入）／spectator */
  function roleOf(state, viewerId) {
    var p = viewerId ? player(state, viewerId) : null;
    if (!p) return 'spectator';
    if (p.pending) return 'pending';
    if (viewerId === state.guesserId && state.phase !== 'over') return 'guesser';
    if (state.phase === 'drawing' && viewerId === state.drawerId) return 'drawer';
    return 'painter';
  }

  /**
   * 送給某一位觀看者的投影。
   * 猜題者在公布前拿不到答案與候選題；畫家與觀戰者都看得到。
   * 這一棒值多少分一律不送（接力中不顯示這棒值多少分）。
   * @param {string|null} viewerId null＝觀戰者
   * @param {object} [opts] { away } 斷線中的玩家（決定「下一棒」顯示）
   */
  function toPublic(state, viewerId, opts) {
    var isAway = awayFn(opts);
    var role = roleOf(state, viewerId);
    var isGuesser = role === 'guesser';
    var hide = isGuesser && isActive(state.phase);
    var w = word(state);
    var info = w ? Words.publicInfo(w) : null;
    var counts = state.phase === 'voting' ? voteCounts(state) : null;
    var voted = Object.keys(state.votes).filter(function (id) { return state.order.indexOf(id) >= 0; }).length;
    var drawer = currentDrawer(state);
    var next = isActive(state.phase) ? upcomingDrawer(state, isAway) : null;
    var lapLen = state.order.length || 1;
    var nameList = function (ids) { return ids.map(function (id) { return { id: id, name: nameOf(state, id), away: isAway(id) }; }); };

    return {
      mode: 'relay',
      seed: state.seed,
      lang: state.lang,
      diff: state.diff,
      phase: state.phase,
      questionNo: state.questionNo,
      turnNo: state.questionNo,
      totalQuestions: totalQuestions(state),
      guessRounds: state.guessRounds,
      batonMs: state.batonMs,
      deadline: state.deadline,
      startedAt: state.startedAt,
      guesserId: state.guesserId,
      guesserName: state.guesserId ? nameOf(state, state.guesserId) : '',
      drawerId: drawer,
      nextDrawerId: next,
      order: nameList(state.order),
      batonNo: state.batonNo,
      batons: state.batons.length,
      lap: state.batons.length ? Math.min(CONST.LAPS, Math.floor(state.batonNo / lapLen) + 1) : 0,
      laps: CONST.LAPS,
      lastBaton: state.batons.length > 0 && state.batonNo >= state.batons.length - 1,
      players: state.players.map(function (p) {
        return {
          id: p.id, name: p.name, score: p.score, pending: p.pending,
          isGuesser: p.id === state.guesserId && state.phase !== 'over',
          isDrawer: p.id === drawer && state.phase === 'drawing',
          guessPts: p.guessPts, drawPts: p.drawPts, keys: p.keys
        };
      }),
      strokes: state.strokes,
      /* 投票：只給票數，不給誰投了哪一題；猜題者連候選題都拿不到 */
      choices: (!isGuesser && state.phase === 'voting') ? state.choices.map(function (id) {
        var c = Words.byId(id, state.lang);
        return { id: id, text: c.text, cat: c.cat, catEmoji: Words.CATEGORIES[c.cat].emoji, diff: c.diff, votes: counts[id] };
      }) : [],
      voted: voted,
      voters: state.order.length,
      myVote: (!isGuesser && viewerId && state.votes[viewerId]) || null,
      hint: info ? {
        step: state.hints,
        total: Rules.hintTotal(state),
        steps: Rules.hintSteps(state),
        lenShown: state.hints >= 1,
        catShown: state.hints >= 2,
        cat: state.hints >= 2 ? info.cat : null,
        catEmoji: state.hints >= 2 ? info.catEmoji : null,
        diff: info.diff,
        len: state.hints >= 1 ? info.len : 0,
        mask: state.hints >= 1 ? Rules.maskOf(state) : '',
        revealed: state.revealed.length
      } : null,
      answer: (!hide && w) ? w.text : null,
      /* 畫家參考範本：只給這一棒正在畫的人（等待中的畫家與觀戰者看得到答案，但不需要範本） */
      referenceId: role === 'drawer' && state.phase === 'drawing' && w ? w.id : null,
      answerCat: (!hide && w) ? w.cat : null,
      wrong: state.wrong,
      log: state.log.slice(-8),
      over: state.over,
      winners: state.winners,
      awards: state.awards,
      galleryCount: state.gallery.length,
      reactions: publicReactions(state, viewerId),
      you: {
        id: viewerId || null,
        role: role,
        isGuesser: isGuesser,
        isDrawer: role === 'drawer',
        isNext: !!viewerId && next === viewerId,
        canDraw: role === 'drawer',
        canVote: state.phase === 'voting' && !!viewerId && state.order.indexOf(viewerId) >= 0 && !isGuesser,
        canGuess: isGuesser && (state.phase === 'drawing' || state.phase === 'handoff'),
        canHint: isGuesser && (state.phase === 'drawing' || state.phase === 'handoff') && state.hints < Rules.hintTotal(state),
        canGiveUp: isGuesser && ['countdown', 'drawing', 'handoff'].indexOf(state.phase) >= 0,
        canCheer: !!viewerId && canCheer(state, viewerId),
        canPick: false,
        guessed: false
      }
    };
  }

  return {
    CONST: CONST,
    PHASES: PHASES,
    ACTIVE: ACTIVE,
    REACTIONS: REACTIONS,
    CHEERS: CHEERS,
    AWARDS: AWARDS,
    createState: createState,
    start: start,
    beginQuestion: beginQuestion,
    vote: vote,
    settleVote: settleVote,
    voteCounts: voteCounts,
    addStroke: addStroke,
    undoStroke: undoStroke,
    clearBoard: clearBoard,
    guess: guess,
    useHint: useHint,
    giveUp: giveUp,
    endQuestion: endQuestion,
    tick: tick,
    finish: finish,
    awardsOf: awardsOf,
    removePlayer: removePlayer,
    addPlayer: addPlayer,
    react: react,
    cheer: cheer,
    canCheer: canCheer,
    galleryOf: galleryOf,
    toPublic: toPublic,
    roleOf: roleOf,
    batonPoints: batonPoints,
    currentDrawer: currentDrawer,
    upcomingDrawer: upcomingDrawer,
    totalQuestions: totalQuestions,
    owes: owes,
    player: player,
    word: word,
    isActive: isActive
  };
}));
