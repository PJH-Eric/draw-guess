/* ===== telephone-rules.js — 畫圖傳話（Beta）的規則核心（伺服器、測試、畫面共用） =====
 *
 * 跟一般模式（rules.js）與接力模式（relay-rules.js）分開的一份規則；共用的只有筆畫消毒、
 * 提示遮罩與提示張數這類「純工具」，直接借 Rules 的實作。
 *
 * 這一層只有「狀態 + 行動 → 新狀態」，沒有畫面、網路與計時器；時間由呼叫端把 now 傳進來，
 * 候選題與逾時隨機挑題都用種子亂數，同一個種子加上同一串行動一定得到同一個結果。
 *
 * 3–5 人，每一輪傳一串：從這一輪開頭的人起照座位往下，每人輪一次。
 *   開頭的人從 3 個候選挑一題 → 看題目作畫 → 下一位只看上一張畫再畫一張 → … →
 *   最後一位只看上一張畫寫答案 → 一次揭曉整串。每輪換下一位開頭。
 *
 * 一輪的節奏
 *   picking  開頭的人挑題（15 秒；時間到沒選就隨機）
 *   step     一格一格傳：每格先有 5 秒換手（stepStartsAt 之前不能動），作畫照開房秒數、
 *            最後一格寫答案照開房秒數；時間到就送出目前內容（畫一半照傳、答案用草稿）
 *   reveal   揭曉整串，每一格可以按愛心／大笑
 *   →（下一輪）… 輪次跑完就 over；遊戲中剩不到 3 人立即 over
 *
 * 計分：最後一人猜中，整串的人依順序從 300 線性遞減到 100，再乘這一輪所有提示倍數；
 *   猜錯或沒寫全部 0 分；被跳過的人不得分。提示由猜的人使用：
 *   字數 → 種類 → 揭一個字，每張 ×0.6；偷看前面的畫，第一張 ×0.3、越後面越接近 ×0.7，倍數相乘。
 *
 * 隱藏資訊：一律走 toPublic(state, viewerId)。輪到的人只拿到上一格（開頭的人拿題目）；
 *   照畫的人只在換手 5 秒內拿得到上一張畫，開始作畫後就不給（憑記憶畫）；
 *   前面已經畫完的人與下一位可以即時看目前這一格作畫（watchersOf），再後面的人看不到；
 *   作畫中其他人只拿到「輪到誰、剩幾秒」；最後一人猜時其他人可以翻看所有的畫（沒有題目）；
 *   偷看的畫只給猜的人；揭曉後才給整串。
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
  root.TelephoneRules = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (RNG, Words, Rules) {
  'use strict';

  var CONST = {
    MIN_PLAYERS: 3,
    MAX_PLAYERS: 5,
    CHOICES: 3,
    PICK_MS: 15000,
    HANDOFF_MS: 5000,
    DRAW_SEC: [30, 45, 60],
    DRAW_SEC_DEFAULT: 45,
    GUESS_SEC: [20, 25, 30],
    GUESS_SEC_DEFAULT: 25,
    ROUNDS_MAX: 3,
    ROUNDS_DEFAULT: 1,
    REVEAL_BASE_MS: 12000,
    REVEAL_PER_CELL_MS: 4000,
    HIGH: 300,
    LOW: 100,
    HINT_FACTOR: 0.6,
    HINTS: 3,
    PEEK_LOW: 0.3,
    PEEK_HIGH: 0.7,
    ANSWER_MAX: 40,
    MAX_STROKES: Rules.CONST.MAX_STROKES,
    MAX_TOTAL_POINTS: Rules.CONST.MAX_TOTAL_POINTS
  };

  var PHASES = ['idle', 'picking', 'step', 'reveal', 'over'];
  /* 傳話進行中（題目與畫對大家保密、聊天關閉）的階段 */
  var ACTIVE = ['picking', 'step'];
  /* 揭曉時每一格可以按的表情 */
  var REACTIONS = ['heart', 'laugh'];

  var err = function (key, code, params) { return { ok: false, error: key, params: params || null, code: code || 'invalid' }; };
  var ok = function (extra) { return Object.assign({ ok: true }, extra || {}); };
  var isActive = function (phase) { return ACTIVE.indexOf(phase) >= 0; };
  var round2 = function (x) { return Math.round(x * 100) / 100; };

  /* ------------------------------------------------------------ 建立 */

  function pickFrom(list, v, dflt) {
    var n = Math.round(Number(v));
    return list.indexOf(n) >= 0 ? n : dflt;
  }
  function normDrawSec(v) { return pickFrom(CONST.DRAW_SEC, v, CONST.DRAW_SEC_DEFAULT); }
  function normGuessSec(v) { return pickFrom(CONST.GUESS_SEC, v, CONST.GUESS_SEC_DEFAULT); }
  function normRounds(v) {
    var n = Math.round(Number(v));
    return isFinite(n) && n >= 1 ? Math.min(n, CONST.ROUNDS_MAX) : CONST.ROUNDS_DEFAULT;
  }

  function newPlayer(p, i) {
    return { id: String(p.id), name: String(p.name || ('P' + (i + 1))), score: 0, pending: false };
  }

  /**
   * @param {object} opts
   *   seed      字串種子
   *   players   [{id, name}]，順序就是座位順序（只取前 5 位）
   *   drawSec   每張畫秒數（30／45／60）
   *   guessSec  最後猜答案秒數（20／25／30）
   *   rounds    輪次（1–3，每輪一串）
   *   diff      1/2/3 或 0＝混合
   *   category  種類代碼，空字串＝全部
   *   lang      題庫語言
   */
  function createState(opts) {
    var o = opts || {};
    var players = (o.players || []).slice(0, CONST.MAX_PLAYERS).map(newPlayer);
    return {
      mode: 'telephone',
      seed: RNG.normalizeSeed(o.seed) || RNG.randomSeed(null, 6),
      lang: Words.normLang(o.lang),
      diff: [1, 2, 3].indexOf(Number(o.diff)) >= 0 ? Number(o.diff) : 0,
      category: Words.CATEGORY_KEYS.indexOf(o.category) >= 0 ? o.category : '',
      drawSec: normDrawSec(o.drawSec),
      guessSec: normGuessSec(o.guessSec),
      rounds: normRounds(o.rounds),
      players: players,
      seats: players.map(function (p) { return p.id; }),
      roundNo: 0,
      phase: 'idle',
      starterId: null,
      choices: [],
      chain: null,          // 這一輪的整串
      chains: [],           // 已揭曉的每一串（畫廊、獎項用）
      stepNo: 0,
      stepStartsAt: 0,
      deadline: 0,
      /* 給 Rules.hintTotal／maskOf 用：這一輪的題目、一般提示張數、揭開的字 */
      wordId: null,
      hints: 0,
      revealed: [],
      hintPlan: [],
      usedWords: [],
      startedAt: 0,
      log: [],
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

  function nameOf(state, id) {
    var p = player(state, id);
    if (p) return p.name;
    /* 已經離開的人：從這一串的紀錄找名字 */
    var cells = state.chain ? state.chain.cells : [];
    for (var i = 0; i < cells.length; i++) if (cells[i].authorId === id) return cells[i].authorName;
    return '—';
  }

  function word(state) { return state.wordId ? Words.byId(state.wordId, state.lang) : null; }

  function currentCell(state) {
    return state.phase === 'step' && state.chain ? state.chain.cells[state.stepNo] || null : null;
  }

  /** 第 idx 格之前最後一張沒被跳過的畫（沒有就是 -1：要看題目） */
  function prevDrawingIdx(chain, idx) {
    for (var i = idx - 1; i >= 0; i--) {
      var c = chain.cells[i];
      if (c.kind === 'draw' && !c.skipped && c.done) return i;
    }
    return -1;
  }

  /* ------------------------------------------------------------ 提示倍數 */

  /** 可以偷看的張數：最後猜的人本來就看得到上一張，前面那幾張才算偷看 */
  function peekableCount(chain) { return Math.max(0, chain.cells.length - 2); }

  /** 偷看第 idx 張畫（0 = 第一張）的倍數：第一張 ×0.3，平均升到最後一張可偷看的 ×0.7 */
  function peekFactor(idx, peekable) {
    if (peekable <= 1) return CONST.PEEK_LOW;
    return round2(CONST.PEEK_LOW + (CONST.PEEK_HIGH - CONST.PEEK_LOW) * idx / (peekable - 1));
  }

  function hintFactor(chain) {
    var f = Math.pow(CONST.HINT_FACTOR, chain.hints.basic);
    var peekable = peekableCount(chain);
    chain.hints.peeks.forEach(function (idx) { f *= peekFactor(idx, peekable); });
    return f;
  }

  /** 猜中時第 i 格（共 n 格）的基本分：300 平均遞減到 100 */
  function basePoints(i, n) {
    return n <= 1 ? CONST.HIGH : CONST.HIGH - (CONST.HIGH - CONST.LOW) * i / (n - 1);
  }

  /* ------------------------------------------------------------ 開局與換輪 */

  function start(state, now) {
    var active = state.players.length;
    if (active < CONST.MIN_PLAYERS) return err('srv.err.telephoneNeedPlayers', 'players', { n: CONST.MIN_PLAYERS });
    state.players.forEach(function (p) { p.score = 0; p.pending = false; });
    state.seats = state.players.map(function (p) { return p.id; });
    state.roundNo = 0;
    state.usedWords = [];
    state.chains = [];
    state.log = [];
    state.awards = null;
    state.over = false;
    state.winners = [];
    state.startedAt = now;
    state.endedAt = 0;
    beginRound(state, now);
    return ok({ state: state });
  }

  /** 開始新的一輪：中途進來的人加入座位、決定開頭的人、抽 3 個候選題；輪次跑完就結算 */
  function beginRound(state, now) {
    if (state.roundNo >= state.rounds) { finish(state, now); return state; }
    state.players.forEach(function (p) { p.pending = false; });
    state.seats = state.players.map(function (p) { return p.id; });
    state.roundNo += 1;
    var n = state.seats.length;
    state.starterId = state.seats[(state.roundNo - 1) % n];
    state.chain = null;
    state.stepNo = 0;
    state.stepStartsAt = 0;
    state.wordId = null;
    state.hints = 0;
    state.revealed = [];
    state.hintPlan = [];
    state.phase = 'picking';
    state.deadline = now + CONST.PICK_MS;

    var crng = RNG.createRng(state.seed + ':tp-choices:' + state.roundNo);
    var pickOpts = { diff: state.diff || 0, cat: state.category, exclude: state.usedWords };
    state.choices = Words.pick(crng, CONST.CHOICES, pickOpts);
    if (state.choices.length < CONST.CHOICES) {
      state.usedWords = [];
      state.choices = Words.pick(crng, CONST.CHOICES, { diff: state.diff || 0, cat: state.category });
    }
    return state;
  }

  /** 從開頭的人起照座位排一次：前面都是作畫，最後一人猜答案 */
  function buildChain(state, wordId) {
    var seats = state.seats, n = seats.length;
    var startIdx = Math.max(0, seats.indexOf(state.starterId));
    var cells = [];
    for (var i = 0; i < n; i++) {
      var id = seats[(startIdx + i) % n];
      cells.push({
        authorId: id,
        authorName: nameOf(state, id),
        kind: i === n - 1 ? 'write' : 'draw',
        strokes: [],
        pointCount: 0,
        text: '',
        draft: '',
        done: false,
        skipped: false,
        stand: null,       // 最後一人斷線時改由誰代猜（原本的人的 id）
        points: 0,
        reactions: { heart: [], laugh: [] }
      });
    }
    return {
      roundNo: state.roundNo,
      wordId: wordId,
      starterId: state.starterId,
      cells: cells,
      hints: { basic: 0, peeks: [] },
      hit: false,
      factor: 1
    };
  }

  /* ------------------------------------------------------------ 挑題 */

  function settlePick(state, wordId, now, auto, isGone) {
    state.wordId = wordId;
    state.usedWords.push(wordId);
    if (state.usedWords.length > 200) state.usedWords.splice(0, 100);
    var w = word(state);
    var hrng = RNG.createRng(state.seed + ':tp-hint:' + state.roundNo);
    var slots = w ? Words.revealable(w) : [];
    state.hintPlan = slots.length >= 2 ? [slots[Math.floor(hrng() * slots.length) % slots.length]] : [];
    state.chain = buildChain(state, wordId);
    state.phase = 'step';
    state.stepNo = -1;
    var ev = advance(state, now, isGone);
    return { wordId: wordId, auto: !!auto, events: ev };
  }

  /** 開頭的人從 3 個候選挑一個 */
  function pick(state, playerId, wordId, now) {
    if (state.phase !== 'picking') return err('srv.err.telephoneNotPicking', 'phase');
    if (playerId !== state.starterId) return err('srv.err.telephoneNotStarter', 'forbidden');
    var id = String(wordId || '');
    if (state.choices.indexOf(id) < 0) return err('srv.err.telephonePickFromThree', 'choice');
    var r = settlePick(state, id, now, false, null);
    return ok({ wordId: id, events: r.events });
  }

  /** 時間到沒選：用種子亂數從候選隨機挑一個 */
  function autoPick(state, now, isGone) {
    var rng = RNG.createRng(state.seed + ':tp-pick:' + state.roundNo);
    var id = state.choices[Math.floor(rng() * state.choices.length) % state.choices.length];
    return settlePick(state, id, now, true, isGone);
  }

  /* ------------------------------------------------------------ 傳話 */

  function goneFn(state, isGone) {
    return function (id) { return !player(state, id) || (!!isGone && isGone(id)); };
  }

  /** 最後一人斷線：由前面最近一位還在的人代猜（不找開頭的人，他知道題目）；找不到回 null */
  function standIn(state, gone) {
    var cells = state.chain.cells;
    for (var i = cells.length - 2; i >= 1; i--) {
      if (!gone(cells[i].authorId)) return cells[i].authorId;
    }
    return null;
  }

  /**
   * 換到下一格：斷線或離開的人跳過；最後一人斷線改由前一位代猜；
   * 寫答案那格前面沒有任何畫（全被跳過）就直接揭曉。回傳這次推進產生的事件。
   */
  function advance(state, now, isGone) {
    var gone = goneFn(state, isGone);
    var chain = state.chain;
    var events = [];
    for (;;) {
      state.stepNo += 1;
      var cell = chain.cells[state.stepNo];
      if (!cell) { events.push(reveal(state, now)); return events; }
      if (cell.kind === 'write') {
        if (prevDrawingIdx(chain, state.stepNo) < 0) {
          cell.skipped = true;
          events.push({ type: 'skip', authorId: cell.authorId, stepNo: state.stepNo, reason: 'nodrawing' });
          continue;
        }
        if (gone(cell.authorId)) {
          var sub = standIn(state, gone);
          if (!sub) {
            cell.skipped = true;
            events.push({ type: 'skip', authorId: cell.authorId, stepNo: state.stepNo, reason: 'away' });
            continue;
          }
          events.push({ type: 'standin', from: cell.authorId, to: sub, stepNo: state.stepNo });
          cell.stand = cell.authorId;
          cell.authorId = sub;
          cell.authorName = nameOf(state, sub);
        }
      } else if (gone(cell.authorId)) {
        cell.skipped = true;
        events.push({ type: 'skip', authorId: cell.authorId, stepNo: state.stepNo, reason: 'away' });
        continue;
      }
      state.stepStartsAt = now + CONST.HANDOFF_MS;
      state.deadline = state.stepStartsAt + (cell.kind === 'draw' ? state.drawSec : state.guessSec) * 1000;
      events.push({ type: 'step', stepNo: state.stepNo, authorId: cell.authorId, kind: cell.kind });
      return events;
    }
  }

  function isTurn(state, playerId, kind, now) {
    var cell = currentCell(state);
    if (!cell) return err('srv.err.telephoneNotYourTurn', 'phase');
    if (cell.authorId !== playerId) return err('srv.err.telephoneNotYourTurn', 'forbidden');
    if (kind && cell.kind !== kind) return err('srv.err.telephoneWrongStep', 'phase');
    if (now !== undefined && now !== null && now < state.stepStartsAt) return err('srv.err.telephoneHandoff', 'phase');
    return null;
  }

  function addStroke(state, playerId, raw, now) {
    var bad = isTurn(state, playerId, 'draw', now);
    if (bad) return bad;
    var cell = currentCell(state);
    var stroke = Rules.sanitizeStroke(raw);
    if (!stroke) return err('srv.err.badStroke', 'stroke');
    if (cell.strokes.length >= CONST.MAX_STROKES) return err('srv.err.tooManyStrokes', 'limit');
    if (cell.pointCount + stroke.p.length / 2 > CONST.MAX_TOTAL_POINTS) return err('srv.err.tooFull', 'limit');
    stroke.n = cell.strokes.length + 1;
    cell.strokes.push(stroke);
    cell.pointCount += stroke.p.length / 2;
    return ok({ stroke: stroke });
  }

  function undoStroke(state, playerId, now) {
    var bad = isTurn(state, playerId, 'draw', now);
    if (bad) return bad;
    var cell = currentCell(state);
    if (!cell.strokes.length) return err('srv.err.boardEmpty', 'empty');
    var removed = cell.strokes.pop();
    cell.pointCount -= removed.p.length / 2;
    return ok({ removed: removed });
  }

  function clearBoard(state, playerId, now) {
    var bad = isTurn(state, playerId, 'draw', now);
    if (bad) return bad;
    var cell = currentCell(state);
    cell.strokes = [];
    cell.pointCount = 0;
    return ok();
  }

  /** 提早送出這張畫（不必等時間到） */
  function submitDrawing(state, playerId, now, isGone) {
    var bad = isTurn(state, playerId, 'draw', now);
    if (bad) return bad;
    currentCell(state).done = true;
    return ok({ events: advance(state, now, isGone) });
  }

  /**
   * 最後一人寫答案。draft=true 只存草稿（時間到就用草稿送出），不揭曉；
   * 草稿與答案只存在伺服器，不會給其他人。
   */
  function answer(state, playerId, text, now, opts) {
    var bad = isTurn(state, playerId, 'write', now);
    if (bad) return bad;
    var cell = currentCell(state);
    var clean = String(text === undefined || text === null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, CONST.ANSWER_MAX);
    if (opts && opts.draft) { cell.draft = clean; return ok({ draft: true }); }
    if (!clean) return err('srv.err.emptyGuess', 'empty');
    cell.text = clean;
    cell.done = true;
    return ok({ events: advance(state, now, opts && opts.isGone) });
  }

  /** 猜的人用一般提示：字數 → 種類 → 揭一個字，每張讓這一輪得分 ×0.6 */
  function giveHint(state, playerId, now) {
    var bad = isTurn(state, playerId, 'write', now);
    if (bad) return bad;
    var total = Rules.hintTotal(state);
    var next = state.hints + 1;
    if (next > total) return err(total < CONST.HINTS ? 'srv.err.noThirdHint' : 'srv.err.allHintsGiven', 'hint');
    state.hints = next;
    state.chain.hints.basic = next;
    if (next === 3 && state.hintPlan.length) state.revealed = [state.hintPlan[0]];
    return ok({ step: next, mask: Rules.maskOf(state), factor: hintFactor(state.chain) });
  }

  /** 這張畫可不可以偷看：前面沒被跳過、不是本來就看得到的上一張、還沒看過 */
  function peekState(state, idx) {
    var chain = state.chain;
    var cell = chain.cells[idx];
    var prev = prevDrawingIdx(chain, state.stepNo);
    if (!cell || cell.kind !== 'draw' || idx >= state.stepNo) return 'none';
    if (idx === prev) return 'visible';
    if (idx >= peekableCount(chain)) return 'none';
    if (cell.skipped || !cell.done) return 'skipped';
    if (chain.hints.peeks.indexOf(idx) >= 0) return 'peeked';
    return 'available';
  }

  /** 猜的人偷看第 idx 張畫（0 = 第一張）：倍數相乘，看越前面扣越多 */
  function peek(state, playerId, idx, now) {
    var bad = isTurn(state, playerId, 'write', now);
    if (bad) return bad;
    var i = Math.round(Number(idx));
    if (!isFinite(i)) return err('srv.err.telephoneCantPeek', 'invalid');
    var st = peekState(state, i);
    if (st === 'peeked') return err('srv.err.telephoneAlreadyPeeked', 'peek');
    if (st !== 'available') return err('srv.err.telephoneCantPeek', 'peek');
    state.chain.hints.peeks.push(i);
    return ok({ idx: i, factor: hintFactor(state.chain), pick: peekFactor(i, peekableCount(state.chain)) });
  }

  /* ------------------------------------------------------------ 揭曉與結算 */

  function scoreChain(state) {
    var chain = state.chain;
    var last = chain.cells[chain.cells.length - 1];
    var w = word(state);
    var text = last && !last.skipped ? last.text : '';
    var hit = !!(w && text && Words.match(w, text) === 'hit');
    var n = chain.cells.length;
    var f = hintFactor(chain);
    chain.cells.forEach(function (cell, i) {
      var pts = !hit || cell.skipped ? 0 : Math.round(basePoints(i, n) * f);
      cell.points = pts;
      var p = pts ? player(state, cell.authorId) : null;
      if (p) p.score += pts;
    });
    chain.hit = hit;
    chain.factor = round2(f);
    return hit;
  }

  function revealMs(chain) {
    return CONST.REVEAL_BASE_MS + CONST.REVEAL_PER_CELL_MS * chain.cells.length;
  }

  /** 這一輪傳完：最後一格沒寫的補上草稿、計分、記錄，進入揭曉 */
  function reveal(state, now) {
    var chain = state.chain;
    var last = chain.cells[chain.cells.length - 1];
    if (last && last.kind === 'write' && !last.skipped && !last.text) last.text = last.draft || '';
    if (last) last.done = !last.skipped;
    var hit = scoreChain(state);
    var w = word(state);
    var entry = {
      roundNo: state.roundNo,
      turnNo: state.roundNo,
      wordId: state.wordId,
      word: w ? w.text : null,
      cat: w ? w.cat : null,
      answer: last && !last.skipped ? last.text : '',
      guesserId: last ? last.authorId : null,
      guesserName: last ? last.authorName : '',
      hit: hit,
      factor: chain.factor,
      hints: chain.hints.basic,
      peeks: chain.hints.peeks.slice(),
      points: chain.cells.map(function (c) { return { id: c.authorId, name: c.authorName, points: c.points, skipped: c.skipped }; }),
      at: now
    };
    state.log.push(entry);
    state.chains.push(chain);
    state.phase = 'reveal';
    state.stepStartsAt = 0;
    state.deadline = now + revealMs(chain);
    return { type: 'reveal', entry: entry };
  }

  /** 最好笑：被按最多表情的那一格的作者（平手並列；沒人按就不頒） */
  function funniestOf(state) {
    var best = 0, list = [];
    state.chains.forEach(function (chain) {
      chain.cells.forEach(function (cell) {
        if (cell.skipped) return;
        var n = cell.reactions.heart.length + cell.reactions.laugh.length;
        if (n > best) { best = n; list = []; }
        if (n === best && n > 0 && !list.some(function (x) { return x.id === cell.authorId; })) {
          list.push({ id: cell.authorId, name: cell.authorName, count: n });
        }
      });
    });
    return best > 0 ? list : [];
  }

  function finish(state, now) {
    state.phase = 'over';
    state.over = true;
    state.deadline = 0;
    state.stepStartsAt = 0;
    var best = -1;
    state.players.forEach(function (p) { best = Math.max(best, p.score); });
    state.winners = state.players.filter(function (p) { return p.score === best; }).map(function (p) { return p.id; });
    state.awards = { funniest: funniestOf(state) };
    state.endedAt = now;
    return ok({ state: state, winners: state.winners });
  }

  /* ------------------------------------------------------------ 時間 */

  function awayFn(opts) {
    var a = opts && opts.away;
    if (!a) return function () { return false; };
    if (typeof a === 'function') return a;
    var list = Array.isArray(a) ? a : Array.from(a);
    return function (id) { return list.indexOf(id) >= 0; };
  }

  /**
   * 推進時間：挑題逾時隨機、輪到的人斷線跳過、每格時間到送出、揭曉結束換下一輪。
   * @param {object} [opts] { away: Set|Array|function } 斷線超過緩衝時間的玩家（由房間層決定緩衝多久）
   */
  function tick(state, now, opts) {
    var isAway = awayFn(opts);
    var gone = goneFn(state, isAway);
    var events = [];
    for (var guard = 0; guard < 24; guard++) {
      var ph = state.phase;
      if (ph === 'over' || ph === 'idle') break;
      if (ph === 'picking' && gone(state.starterId)) {
        /* 開頭的人斷線：換下一位還在的人開頭（候選題不變） */
        var nextId = nextStarter(state, gone);
        if (!nextId) break;
        state.starterId = nextId;
        state.deadline = now + CONST.PICK_MS;
        events.push({ type: 'starter', starterId: nextId });
        continue;
      }
      if (ph === 'step') {
        var cell = currentCell(state);
        if (cell && gone(cell.authorId)) {
          if (cell.kind === 'draw') {
            cell.skipped = true;
            cell.strokes = [];
            cell.pointCount = 0;
            events.push({ type: 'skip', authorId: cell.authorId, stepNo: state.stepNo, reason: 'away' });
          } else {
            /* 寫答案的人斷線：退回上一格重新找代猜的人 */
            if (cell.stand) { cell.authorId = cell.stand; cell.authorName = nameOf(state, cell.stand); cell.stand = null; }
            state.stepNo -= 1;
            cell.draft = '';
          }
          events = events.concat(advance(state, now, isAway));
          continue;
        }
      }
      if (now < state.deadline) break;

      if (ph === 'picking') {
        var ap = autoPick(state, now, isAway);
        events.push({ type: 'picked', wordId: ap.wordId, auto: true });
        events = events.concat(ap.events);
        continue;
      }
      if (ph === 'step') {
        var c = currentCell(state);
        /* 時間到：畫一半照傳；答案用草稿（沒寫就留空，揭曉顯示「（沒寫）」） */
        if (c.kind === 'write' && !c.text) c.text = c.draft || '';
        c.done = true;
        events.push({ type: 'timeup', stepNo: state.stepNo, authorId: c.authorId, kind: c.kind });
        events = events.concat(advance(state, now, isAway));
        continue;
      }
      if (ph === 'reveal') {
        beginRound(state, now);
        if (state.over) events.push({ type: 'gameover', winners: state.winners });
        else events.push({ type: 'roundstart', roundNo: state.roundNo, starterId: state.starterId });
        continue;
      }
      break;
    }
    return { events: events };
  }

  function nextStarter(state, gone) {
    var s = state.seats, n = s.length;
    var at = s.indexOf(state.starterId);
    for (var k = 1; k <= n; k++) {
      var id = s[(at + k + n) % n];
      if (!gone(id)) return id;
    }
    return null;
  }

  /* ------------------------------------------------------------ 成員異動 */

  /** 有人離開：遊戲中剩不到 3 人立即結算；輪到他就跳過（由下一次 tick 處理） */
  function removePlayer(state, id, now) {
    var idx = -1;
    for (var i = 0; i < state.players.length; i++) if (state.players[i].id === id) idx = i;
    if (idx < 0) return err('srv.err.noSuchPlayer', 'gone');
    state.players.splice(idx, 1);
    if (state.over || state.phase === 'idle') {
      state.seats = state.seats.filter(function (s) { return s !== id; });
      return ok({ removed: id });
    }
    var active = state.players.filter(function (p) { return !p.pending; }).length;
    if (active < CONST.MIN_PLAYERS) {
      finish(state, now);
      return ok({ removed: id, finished: true });
    }
    /* 座位留著（這一串的順序不變），下一輪重排座位時自然拿掉 */
    var r = tick(state, now, null);
    return ok({ removed: id, events: r.events });
  }

  /** 中途進房：未滿 5 人時先觀戰，下一輪起加入傳話順序 */
  function addPlayer(state, p) {
    if (state.over) return err('srv.err.gameOver', 'over');
    if (player(state, String(p.id))) return ok({ state: state, already: true });
    if (state.players.length >= CONST.MAX_PLAYERS) return err('srv.err.seatsFull', 'full');
    var entry = newPlayer(p, state.players.length);
    entry.pending = state.phase !== 'idle';
    state.players.push(entry);
    if (!entry.pending) state.seats.push(entry.id);
    return ok({ state: state, player: entry });
  }

  /* ------------------------------------------------------------ 表情 */

  /** 揭曉時對某一格按表情（再按一次收回）；這一局的玩家可以按，自己那格不能按 */
  function react(state, playerId, kind, cellIdx) {
    if (state.phase !== 'reveal' || !state.chain) return err('srv.err.reactRevealOnly', 'phase');
    if (!player(state, playerId)) return err('srv.err.notInGame', 'forbidden');
    if (typeof kind !== 'string' || REACTIONS.indexOf(kind) < 0) return err('srv.err.badReaction', 'invalid');
    var cell = state.chain.cells[Math.round(Number(cellIdx))];
    if (!cell || cell.skipped) return err('srv.err.nothingToReact', 'empty');
    if (cell.authorId === playerId) return err('srv.err.telephoneOwnCell', 'forbidden');
    var list = cell.reactions[kind];
    var at = list.indexOf(playerId);
    if (at >= 0) list.splice(at, 1); else list.push(playerId);
    return ok({ kind: kind, on: at < 0, count: list.length, cell: Math.round(Number(cellIdx)) });
  }

  /** 結算後的畫廊（每一格的畫）；整局結束前不提供 */
  function galleryOf(state) {
    if (state.phase !== 'over') return [];
    var out = [];
    state.chains.forEach(function (chain) {
      var w = Words.byId(chain.wordId, state.lang);
      chain.cells.forEach(function (cell, i) {
        if (cell.kind !== 'draw' || cell.skipped || !cell.strokes.length) return;
        out.push({
          turnNo: chain.roundNo, mode: 'telephone', step: i + 1,
          drawerId: cell.authorId, drawerName: cell.authorName,
          hit: chain.hit, word: w ? w.text : '', cat: w ? w.cat : null, strokes: cell.strokes,
          reactions: { heart: cell.reactions.heart.length, laugh: cell.reactions.laugh.length, clap: 0 }
        });
      });
    });
    return out;
  }

  /* ------------------------------------------------------------ 投影 */

  function drawingOf(state, idx) {
    var c = state.chain.cells[idx];
    return { idx: idx, authorId: c.authorId, authorName: c.authorName, strokes: c.strokes };
  }

  /** 傳話順序（大家都看得到，不含內容） */
  function orderOf(state) {
    if (!state.chain) return [];
    return state.chain.cells.map(function (c, i) {
      return {
        idx: i, id: c.authorId, name: c.authorName, kind: c.kind, skipped: c.skipped,
        done: c.done || (state.phase !== 'step' && state.phase !== 'picking'),
        current: state.phase === 'step' && i === state.stepNo
      };
    });
  }

  function hintView(state) {
    var w = word(state);
    if (!w) return null;
    var info = Words.publicInfo(w);
    return {
      step: state.hints,
      total: Rules.hintTotal(state),
      steps: Rules.hintSteps(state),
      lenShown: state.hints >= 1,
      catShown: state.hints >= 2,
      cat: state.hints >= 2 ? info.cat : null,
      catEmoji: state.hints >= 2 ? info.catEmoji : null,
      len: state.hints >= 1 ? info.len : 0,
      mask: state.hints >= 1 ? Rules.maskOf(state) : '',
      revealed: state.revealed.length
    };
  }

  function peekList(state) {
    var chain = state.chain, peekable = peekableCount(chain), out = [];
    for (var i = 0; i < peekable; i++) {
      var st = peekState(state, i);
      if (st === 'none' || st === 'visible') continue;
      out.push({ idx: i, authorName: chain.cells[i].authorName, factor: peekFactor(i, peekable), state: st });
    }
    return out;
  }

  function chainView(state, chain, viewerId) {
    var w = Words.byId(chain.wordId, state.lang);
    var canReact = state.phase === 'reveal' && chain === state.chain && !!viewerId && !!player(state, viewerId);
    return {
      roundNo: chain.roundNo,
      word: w ? w.text : '',
      cat: w ? w.cat : null,
      hit: chain.hit,
      factor: chain.factor,
      hints: { basic: chain.hints.basic, peeks: chain.hints.peeks.slice() },
      cells: chain.cells.map(function (c, i) {
        var counts = {}, mine = [];
        REACTIONS.forEach(function (k) {
          counts[k] = c.reactions[k].length;
          if (viewerId && c.reactions[k].indexOf(viewerId) >= 0) mine.push(k);
        });
        return {
          idx: i, authorId: c.authorId, authorName: c.authorName, kind: c.kind,
          strokes: c.kind === 'draw' && !c.skipped ? c.strokes : [],
          text: c.kind === 'write' ? c.text : '', skipped: c.skipped, stand: c.stand ? nameOf(state, c.stand) : null,
          points: c.points, counts: counts, mine: mine,
          canReact: canReact && !c.skipped && c.authorId !== viewerId
        };
      })
    };
  }

  /**
   * 誰可以即時看目前這一格作畫：前面已經畫完（沒被跳過）的人，加上下一位（先看著，等一下憑記憶照畫或猜）。
   * 例：ABCD 四人，A 畫只有 B 看得到；B 畫 A、C 看得到；C 畫 A、B、D 看得到。
   * 再後面還沒輪到的人與觀戰者都看不到。
   */
  function watchersOf(state) {
    var cell = currentCell(state);
    if (!cell || cell.kind !== 'draw') return [];
    var out = [];
    for (var i = 0; i < state.stepNo; i++) {
      var c = state.chain.cells[i];
      if (c.kind === 'draw' && c.done && !c.skipped && c.authorId !== cell.authorId && out.indexOf(c.authorId) < 0 && player(state, c.authorId)) out.push(c.authorId);
    }
    var next = state.chain.cells[state.stepNo + 1];
    if (next && !next.skipped && next.authorId !== cell.authorId && out.indexOf(next.authorId) < 0 && player(state, next.authorId)) out.push(next.authorId);
    return out;
  }

  /** 看的人現在的身分：starter（挑題中）／turn（輪到他）／waiting／spectator（結束後玩家都算 player） */
  function roleOf(state, viewerId) {
    var p = viewerId ? player(state, viewerId) : null;
    if (!p || p.pending) return 'spectator';
    if (state.phase === 'picking') return viewerId === state.starterId ? 'starter' : 'waiting';
    if (state.phase === 'step') {
      var c = currentCell(state);
      return c && c.authorId === viewerId ? (c.kind === 'write' ? 'guesser' : 'drawer') : 'waiting';
    }
    return 'player';
  }

  /**
   * 送給某一位觀看者的投影。
   * @param {string|null} viewerId null＝觀戰者
   */
  function toPublic(state, viewerId, now) {
    var role = roleOf(state, viewerId);
    var cell = currentCell(state);
    var t = typeof now === 'number' ? now : 0;
    var started = !!cell && t >= state.stepStartsAt;
    var view = {
      mode: 'telephone',
      seed: state.seed,
      lang: state.lang,
      diff: state.diff,
      phase: state.phase,
      roundNo: state.roundNo,
      turnNo: state.roundNo,
      rounds: state.rounds,
      drawSec: state.drawSec,
      guessSec: state.guessSec,
      deadline: state.deadline,
      stepStartsAt: state.stepStartsAt,
      stepNo: state.phase === 'step' ? state.stepNo : -1,
      stepCount: state.chain ? state.chain.cells.length : 0,
      starterId: state.starterId,
      starterName: state.starterId ? nameOf(state, state.starterId) : '',
      turnId: cell ? cell.authorId : null,
      turnName: cell ? cell.authorName : '',
      turnKind: cell ? cell.kind : null,
      startedAt: state.startedAt,
      order: orderOf(state),
      players: state.players.map(function (p) {
        return {
          id: p.id, name: p.name, score: p.score, pending: p.pending,
          isDrawer: !!cell && cell.authorId === p.id && cell.kind === 'draw',
          isGuesser: !!cell && cell.authorId === p.id && cell.kind === 'write'
        };
      }),
      choices: [],
      prev: null,
      strokes: [],
      drawings: null,
      peeks: null,
      peekable: null,
      hint: null,
      factor: state.chain ? round2(hintFactor(state.chain)) : 1,
      hintsUsed: state.chain ? { basic: state.chain.hints.basic, peeks: state.chain.hints.peeks.length } : null,
      answer: null,
      referenceId: null,
      chain: null,
      log: state.log.slice(-6),
      over: state.over,
      winners: state.winners,
      awards: state.awards,
      galleryCount: state.phase === 'over' ? galleryOf(state).length : 0,
      you: {
        id: viewerId || null,
        role: role,
        isStarter: role === 'starter',
        isDrawer: role === 'drawer',
        isGuesser: role === 'guesser',
        canPick: role === 'starter',
        canDraw: role === 'drawer' && started,
        canSubmit: role === 'drawer' && started,
        canAnswer: role === 'guesser' && started,
        canHint: role === 'guesser' && started && state.hints < Rules.hintTotal(state),
        canPeek: false,
        canChat: !isActive(state.phase),
        watching: false,
        guessed: false
      }
    };

    if (state.phase === 'picking' && role === 'starter') {
      view.choices = state.choices.map(function (id) {
        var c = Words.byId(id, state.lang);
        return { id: id, text: c.text, cat: c.cat, catEmoji: Words.CATEGORIES[c.cat].emoji, diff: c.diff };
      });
    }

    if (state.phase === 'step' && cell) {
      var chain = state.chain;
      if (role === 'drawer' || role === 'guesser') {
        var pi = prevDrawingIdx(chain, state.stepNo);
        if (pi < 0) {
          var w = word(state);
          view.prev = { kind: 'word', text: w ? w.text : '', cat: w ? w.cat : null };
          view.answer = w ? w.text : null;
          view.referenceId = role === 'drawer' && w ? w.id : null;
        } else {
          /* 照畫的人只有換手那 5 秒看得到上一張畫，開始作畫後就收起來（畫完揭曉時才再看到）；
             猜的人整格都看得到 */
          var showPrev = role === 'guesser' || !started;
          view.prev = { kind: 'drawing', idx: pi, authorName: chain.cells[pi].authorName, strokes: showPrev ? chain.cells[pi].strokes : null, hidden: !showPrev };
        }
        if (role === 'drawer') view.strokes = cell.strokes;
        if (role === 'guesser') {
          view.hint = hintView(state);
          view.peeks = chain.hints.peeks.map(function (i) { return drawingOf(state, i); });
          view.peekable = peekList(state);
          view.you.canPeek = started && view.peekable.some(function (x) { return x.state === 'available'; });
          view.draft = cell.draft;
        }
      } else if (role === 'waiting' && watchersOf(state).indexOf(viewerId) >= 0) {
        /* 前面畫完的人與下一位：即時看目前這一格作畫（只有正在畫的這一張） */
        view.you.watching = true;
        view.strokes = cell.strokes;
      } else if (cell.kind === 'write') {
        /* 等最後一人猜：其他人（含觀戰者）可以翻看這一輪所有的畫，看不到題目與正在打的字 */
        view.drawings = chain.cells.filter(function (c, i) { return c.kind === 'draw' && !c.skipped && c.done && i < state.stepNo; })
          .map(function (c) { return drawingOf(state, chain.cells.indexOf(c)); });
      }
    }

    if ((state.phase === 'reveal' || state.phase === 'over') && state.chain) {
      view.chain = chainView(state, state.chain, viewerId);
      view.answer = view.chain.word;
    }
    return view;
  }

  return {
    CONST: CONST,
    PHASES: PHASES,
    ACTIVE: ACTIVE,
    REACTIONS: REACTIONS,
    createState: createState,
    start: start,
    beginRound: beginRound,
    pick: pick,
    autoPick: autoPick,
    addStroke: addStroke,
    undoStroke: undoStroke,
    clearBoard: clearBoard,
    submitDrawing: submitDrawing,
    answer: answer,
    giveHint: giveHint,
    peek: peek,
    tick: tick,
    finish: finish,
    removePlayer: removePlayer,
    addPlayer: addPlayer,
    react: react,
    galleryOf: galleryOf,
    toPublic: toPublic,
    roleOf: roleOf,
    player: player,
    word: word,
    currentCell: currentCell,
    watchersOf: watchersOf,
    isActive: isActive,
    peekFactor: peekFactor,
    hintFactor: hintFactor,
    basePoints: basePoints,
    normDrawSec: normDrawSec,
    normGuessSec: normGuessSec,
    normRounds: normRounds
  };
}));
