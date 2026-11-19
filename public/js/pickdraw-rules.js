/* ===== pickdraw-rules.js — 你出我畫他猜（Beta）的規則核心（伺服器、測試、畫面共用） =====
 *
 * 跟一般模式（rules.js）與接力模式（relay-rules.js）分開的一份規則；共用的只有筆畫消毒、
 * 提示遮罩與提示張數這類「純工具」，直接借 Rules 的實作。
 *
 * 這一層只有「狀態 + 行動 → 新狀態」，沒有畫面、網路與計時器；時間由呼叫端把 now 傳進來，
 * 候選題與逾時隨機挑題都用種子亂數，同一個種子加上同一串行動一定得到同一個結果。
 *
 * 固定 3 人，照座位輪替：第 n 題（0 起算）出題者 = seats[n % 3]、畫家 = seats[(n+1) % 3]、
 * 猜題者 = seats[(n+2) % 3]；上一題的畫家變下一題的出題者。一圈 3 題，一場 laps 圈。
 *
 * 一題的節奏
 *   picking    出題者從 3 個候選挑 1 個（15 秒；時間到沒選就隨機）
 *   countdown  3、2、1、開始！
 *   drawing    畫家作畫，猜題者猜（次數不限）；出題者只能看、丟表情
 *   reveal     公布答案 7 秒，可以對完成圖按表情
 *   →（下一題）… 全部題數跑完就 over；遊戲中剩不到 3 人立即 over
 *
 * 計分（越早猜中 B、C 越高）：B、C 從 300 線性降到 100，每給一張提示再打六折；
 * A 從 100 線性升到 300，不受提示影響。沒猜中或放棄：A 300、B 與 C 0 分。
 *
 * 隱藏資訊：答案只放在 state.wordId。對外一律走 toPublic(state, viewerId)：
 * 猜題者在公布前拿不到答案與候選題；候選題只給出題者；畫家挑完後看得到答案；觀戰者看得到答案。
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
  root.PickdrawRules = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (RNG, Words, Rules) {
  'use strict';

  var CONST = {
    PLAYERS: 3,
    CHOICES: 3,
    PICK_MS: 15000,
    COUNTDOWN_MS: 3000,
    REVEAL_MS: 7000,
    DRAW_SEC: [30, 60, 90],
    DRAW_SEC_DEFAULT: 60,
    LAPS_MAX: 5,
    LAPS_DEFAULT: 2,
    HIGH: 300,
    LOW: 100,
    HINT_FACTOR: 0.6,
    HINTS: 3,
    GUESS_MAX: 40,
    GALLERY_MAX: 60,
    MAX_STROKES: Rules.CONST.MAX_STROKES,
    MAX_TOTAL_POINTS: Rules.CONST.MAX_TOTAL_POINTS
  };

  var PHASES = ['idle', 'picking', 'countdown', 'drawing', 'reveal', 'over'];
  /* 這一題還在進行中（答案對猜題者保密的階段） */
  var ACTIVE = ['picking', 'countdown', 'drawing'];
  var REACTIONS = Rules.REACTIONS;
  /* 出題者在作畫中可以丟的表情 */
  var CHEERS = ['cheer', 'lol', 'panic'];
  /* 整人王（當出題者得分）、神畫手（當畫家得分）、神猜手（當猜題者得分） */
  var AWARDS = ['pick', 'draw', 'guess'];

  var err = function (key, code, params) { return { ok: false, error: key, params: params || null, code: code || 'invalid' }; };
  var ok = function (extra) { return Object.assign({ ok: true }, extra || {}); };
  var clamp = function (v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); };
  var isActive = function (phase) { return ACTIVE.indexOf(phase) >= 0; };

  /* ------------------------------------------------------------ 建立 */

  function normDrawSec(v) {
    var n = Math.round(Number(v));
    return CONST.DRAW_SEC.indexOf(n) >= 0 ? n : CONST.DRAW_SEC_DEFAULT;
  }

  function normLaps(v) {
    var n = Math.round(Number(v));
    return isFinite(n) && n >= 1 ? Math.min(n, CONST.LAPS_MAX) : CONST.LAPS_DEFAULT;
  }

  function newPlayer(p, i) {
    return {
      id: String(p.id),
      name: String(p.name || ('P' + (i + 1))),
      score: 0,
      pickPts: 0,    // 當出題者拿到的分數（整人王）
      drawPts: 0,    // 當畫家拿到的分數（神畫手）
      guessPts: 0    // 當猜題者拿到的分數（神猜手）
    };
  }

  /**
   * @param {object} opts
   *   seed      字串種子
   *   players   [{id, name}]，順序就是座位順序（只取前 3 位）
   *   laps      一場幾圈（1–5，一圈 3 題）
   *   drawSec   每題作畫秒數（30／60／90）
   *   diff      1/2/3 或 0＝混合
   *   category  種類代碼，空字串＝全部
   *   lang      題庫語言
   */
  function createState(opts) {
    var o = opts || {};
    var players = (o.players || []).slice(0, CONST.PLAYERS).map(newPlayer);
    return {
      mode: 'pickdraw',
      seed: RNG.normalizeSeed(o.seed) || RNG.randomSeed(null, 6),
      lang: Words.normLang(o.lang),
      diff: [1, 2, 3].indexOf(Number(o.diff)) >= 0 ? Number(o.diff) : 0,
      category: Words.CATEGORY_KEYS.indexOf(o.category) >= 0 ? o.category : '',
      laps: normLaps(o.laps),
      drawMs: normDrawSec(o.drawSec) * 1000,
      players: players,
      seats: players.map(function (p) { return p.id; }),
      questionNo: 0,         // 1 起算；角色用 questionNo - 1 算
      phase: 'idle',
      pickerId: null,
      drawerId: null,
      guesserId: null,
      choices: [],
      wordId: null,
      usedWords: [],
      hints: 0,
      revealed: [],
      hintPlan: [],
      strokes: [],
      pointCount: 0,
      wrong: 0,
      deadline: 0,
      drawStartedAt: 0,
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

  function totalQuestions(state) { return state.laps * CONST.PLAYERS; }

  /** 第 n 題（0 起算）的三個角色 */
  function rolesOf(state, n) {
    var s = state.seats;
    var len = s.length || 1;
    return {
      pickerId: s[n % len] || null,
      drawerId: s[(n + 1) % len] || null,
      guesserId: s[(n + 2) % len] || null
    };
  }

  /**
   * 猜中時三個角色各拿幾分。
   * t = 作畫經過比例（0～1）；B、C 從 300 降到 100 再乘 0.6^提示張數；A 從 100 升到 300。
   */
  function pointsAt(drawMs, elapsedMs, hints) {
    var t = drawMs > 0 ? clamp(elapsedMs / drawMs, 0, 1) : 1;
    var bc = Math.round((CONST.HIGH - (CONST.HIGH - CONST.LOW) * t) * Math.pow(CONST.HINT_FACTOR, Math.max(0, hints || 0)));
    var a = Math.round(CONST.LOW + (CONST.HIGH - CONST.LOW) * t);
    return { picker: a, drawer: bc, guesser: bc };
  }

  function scoresAt(state, now) {
    return pointsAt(state.drawMs, now - state.drawStartedAt, state.hints);
  }

  /* ------------------------------------------------------------ 開局與換題 */

  function start(state, now) {
    if (state.players.length !== CONST.PLAYERS) return err('srv.err.pickdrawNeedThree', 'players', { n: CONST.PLAYERS });
    state.seats = state.players.map(function (p) { return p.id; });
    for (var i = 0; i < state.players.length; i++) {
      var p = state.players[i];
      p.score = 0; p.pickPts = 0; p.drawPts = 0; p.guessPts = 0;
    }
    state.questionNo = 0;
    state.usedWords = [];
    state.log = [];
    state.gallery = [];
    state.awards = null;
    state.over = false;
    state.winners = [];
    state.startedAt = now;
    state.endedAt = 0;
    beginQuestion(state, now);
    return ok({ state: state });
  }

  /** 開始新的一題：輪替角色、抽 3 個候選題，進入挑題；題數跑完就結算 */
  function beginQuestion(state, now) {
    if (state.questionNo >= totalQuestions(state)) { finish(state, now); return state; }
    var r = rolesOf(state, state.questionNo);
    state.questionNo += 1;
    state.pickerId = r.pickerId;
    state.drawerId = r.drawerId;
    state.guesserId = r.guesserId;
    state.wordId = null;
    state.hints = 0;
    state.revealed = [];
    state.hintPlan = [];
    state.strokes = [];
    state.pointCount = 0;
    state.wrong = 0;
    state.drawStartedAt = 0;
    state.phase = 'picking';
    state.deadline = now + CONST.PICK_MS;

    var crng = RNG.createRng(state.seed + ':pd-choices:' + state.questionNo);
    var pickOpts = { diff: state.diff || 0, cat: state.category, exclude: state.usedWords };
    state.choices = Words.pick(crng, CONST.CHOICES, pickOpts);
    if (state.choices.length < CONST.CHOICES) {
      state.usedWords = [];
      state.choices = Words.pick(crng, CONST.CHOICES, { diff: state.diff || 0, cat: state.category });
    }
    return state;
  }

  /* ------------------------------------------------------------ 挑題 */

  function settlePick(state, wordId, now, auto) {
    state.wordId = wordId;
    state.usedWords.push(wordId);
    if (state.usedWords.length > 200) state.usedWords.splice(0, 100);
    var w = word(state);
    var hrng = RNG.createRng(state.seed + ':pd-hint:' + state.questionNo);
    var slots = w ? Words.revealable(w) : [];
    state.hintPlan = slots.length >= 2 ? [slots[Math.floor(hrng() * slots.length) % slots.length]] : [];
    state.phase = 'countdown';
    state.deadline = now + CONST.COUNTDOWN_MS;
    return { wordId: wordId, auto: !!auto };
  }

  /** 出題者從 3 個候選挑一個 */
  function pick(state, playerId, wordId, now) {
    if (state.phase !== 'picking') return err('srv.err.pickdrawNotPicking', 'phase');
    if (playerId !== state.pickerId) return err('srv.err.pickdrawNotPicker', 'forbidden');
    var id = String(wordId || '');
    if (state.choices.indexOf(id) < 0) return err('srv.err.pickdrawPickFromThree', 'choice');
    settlePick(state, id, now, false);
    return ok({ wordId: id });
  }

  /** 時間到沒選：用種子亂數從候選隨機挑一個 */
  function autoPick(state, now) {
    var rng = RNG.createRng(state.seed + ':pd-pick:' + state.questionNo);
    var id = state.choices[Math.floor(rng() * state.choices.length) % state.choices.length];
    return settlePick(state, id, now, true);
  }

  /* ------------------------------------------------------------ 作畫 */

  function canDraw(state, playerId) { return state.phase === 'drawing' && playerId === state.drawerId; }

  function addStroke(state, playerId, raw) {
    if (state.phase !== 'drawing') return err('srv.err.cantDrawYet', 'phase');
    if (playerId !== state.drawerId) return err('srv.err.onlyDrawerDraw', 'forbidden');
    var stroke = Rules.sanitizeStroke(raw);
    if (!stroke) return err('srv.err.badStroke', 'stroke');
    if (state.strokes.length >= CONST.MAX_STROKES) return err('srv.err.tooManyStrokes', 'limit');
    if (state.pointCount + stroke.p.length / 2 > CONST.MAX_TOTAL_POINTS) return err('srv.err.tooFull', 'limit');
    stroke.n = state.strokes.length + 1;
    state.strokes.push(stroke);
    state.pointCount += stroke.p.length / 2;
    return ok({ stroke: stroke });
  }

  function undoStroke(state, playerId) {
    if (!canDraw(state, playerId)) return err('srv.err.onlyDrawerDraw', 'forbidden');
    if (!state.strokes.length) return err('srv.err.boardEmpty', 'empty');
    var removed = state.strokes.pop();
    state.pointCount -= removed.p.length / 2;
    return ok({ removed: removed });
  }

  function clearBoard(state, playerId) {
    if (!canDraw(state, playerId)) return err('srv.err.onlyDrawerDraw', 'forbidden');
    state.strokes = [];
    state.pointCount = 0;
    return ok();
  }

  /** 畫家給下一張提示：字數 → 種類 → 揭一個字；每給一張，B、C 之後的得分再打六折 */
  function giveHint(state, playerId, now) {
    if (state.phase !== 'drawing') return err('srv.err.noWordNow', 'phase');
    if (playerId !== state.drawerId) return err('srv.err.onlyDrawerHint', 'forbidden');
    var total = Rules.hintTotal(state);
    var next = state.hints + 1;
    if (next > total) return err(total < CONST.HINTS ? 'srv.err.noThirdHint' : 'srv.err.allHintsGiven', 'hint');
    state.hints = next;
    if (next === 3 && state.hintPlan.length) state.revealed = [state.hintPlan[0]];
    return ok({ step: next, mask: Rules.maskOf(state), at: now });
  }

  /* ------------------------------------------------------------ 猜題 */

  function credit(state, id, pts, field) {
    var p = player(state, id);
    if (!p) return;
    p.score += pts;
    p[field] += pts;
  }

  /** 猜題者在作畫中猜，次數不限 */
  function guess(state, playerId, text, now) {
    if (playerId !== state.guesserId) return err('srv.err.pickdrawNotGuesser', 'forbidden');
    if (state.phase !== 'drawing') return err('srv.err.notGuessTime', 'phase');
    var clean = String(text === undefined || text === null ? '' : text).slice(0, CONST.GUESS_MAX);
    if (!Words.normalize(clean, state.lang)) return err('srv.err.emptyGuess', 'empty');
    var verdict = Words.match(word(state), clean);
    if (verdict !== 'hit') {
      state.wrong += 1;
      return ok({ verdict: verdict, points: 0 });
    }
    var e = endQuestion(state, now, 'hit');
    return ok({ verdict: 'hit', points: e.entry.points.guesser, entry: e.entry });
  }

  /** 猜題者放棄：直接公布，出題者拿 300 */
  function giveUp(state, playerId, now) {
    if (playerId !== state.guesserId) return err('srv.err.pickdrawNotGuesser', 'forbidden');
    if (state.phase !== 'countdown' && state.phase !== 'drawing') return err('srv.err.noWordNow', 'phase');
    return endQuestion(state, now, 'giveup');
  }

  /* ------------------------------------------------------------ 公布與結算 */

  function nameOf(state, id) {
    var p = player(state, id);
    return p ? p.name : '—';
  }

  /** 這一題結束（猜中／時間到／放棄）：計分、記錄、存畫廊，進入公布 */
  function endQuestion(state, now, reason) {
    if (state.phase !== 'countdown' && state.phase !== 'drawing') return err('srv.err.turnEnded', 'phase');
    var pts;
    if (reason === 'hit') pts = scoresAt(state, now);
    else pts = { picker: CONST.HIGH, drawer: 0, guesser: 0 };
    credit(state, state.pickerId, pts.picker, 'pickPts');
    credit(state, state.drawerId, pts.drawer, 'drawPts');
    credit(state, state.guesserId, pts.guesser, 'guessPts');

    var w = word(state);
    var entry = {
      questionNo: state.questionNo,
      turnNo: state.questionNo,
      pickerId: state.pickerId,
      pickerName: nameOf(state, state.pickerId),
      drawerId: state.drawerId,
      drawerName: nameOf(state, state.drawerId),
      guesserId: state.guesserId,
      guesserName: nameOf(state, state.guesserId),
      wordId: state.wordId,
      word: w ? w.text : null,
      cat: w ? w.cat : null,
      reason: reason,
      hit: reason === 'hit',
      points: pts,
      elapsedMs: state.drawStartedAt ? Math.max(0, now - state.drawStartedAt) : 0,
      hints: state.hints,
      wrong: state.wrong,
      at: now
    };
    state.log.push(entry);
    if (w && state.strokes.length) {
      state.gallery.push({
        turnNo: state.questionNo,
        pickerId: state.pickerId,
        pickerName: entry.pickerName,
        drawerId: state.drawerId,
        drawerName: entry.drawerName,
        guesserId: state.guesserId,
        guesserName: entry.guesserName,
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

  /** 三個獎項：整人王（出題得分）、神畫手（作畫得分）、神猜手（猜題得分） */
  function awardsOf(state) {
    return { pick: topBy(state, 'pickPts'), draw: topBy(state, 'drawPts'), guess: topBy(state, 'guessPts') };
  }

  function finish(state, now) {
    state.phase = 'over';
    state.over = true;
    state.deadline = 0;
    var best = -1;
    state.players.forEach(function (p) { best = Math.max(best, p.score); });
    state.winners = state.players.filter(function (p) { return p.score === best; }).map(function (p) { return p.id; });
    state.awards = awardsOf(state);
    state.endedAt = now;
    return ok({ state: state, winners: state.winners });
  }

  /* ------------------------------------------------------------ 時間 */

  /** 推進時間：挑題逾時隨機、倒數結束開畫、作畫時間到公布、公布結束換下一題 */
  function tick(state, now) {
    var events = [];
    for (var guard = 0; guard < 16; guard++) {
      var ph = state.phase;
      if (ph === 'over' || ph === 'idle') break;
      if (now < state.deadline) break;

      if (ph === 'picking') {
        var ap = autoPick(state, now);
        events.push({ type: 'picked', wordId: ap.wordId, auto: true });
        continue;
      }
      if (ph === 'countdown') {
        state.phase = 'drawing';
        state.drawStartedAt = now;
        state.deadline = now + state.drawMs;
        events.push({ type: 'drawstart', drawerId: state.drawerId });
        continue;
      }
      if (ph === 'drawing') {
        var tu = endQuestion(state, now, 'timeup');
        if (tu.ok) events.push({ type: 'questionend', entry: tu.entry });
        continue;
      }
      if (ph === 'reveal') {
        beginQuestion(state, now);
        if (state.over) events.push({ type: 'gameover', winners: state.winners });
        else events.push({ type: 'questionstart', questionNo: state.questionNo, pickerId: state.pickerId });
        continue;
      }
      break;
    }
    return { events: events };
  }

  /* ------------------------------------------------------------ 成員異動 */

  /** 有人離開：遊戲中剩不到 3 人就立即結算 */
  function removePlayer(state, id, now) {
    var idx = -1;
    for (var i = 0; i < state.players.length; i++) if (state.players[i].id === id) idx = i;
    if (idx < 0) return err('srv.err.noSuchPlayer', 'gone');
    state.players.splice(idx, 1);
    if (state.over || state.phase === 'idle') return ok({ removed: id });
    finish(state, now);
    return ok({ removed: id, finished: true });
  }

  /* ------------------------------------------------------------ 表情 */

  function currentGalleryItem(state) {
    var list = state.gallery || [];
    var last = list.length ? list[list.length - 1] : null;
    return last && last.turnNo === state.questionNo ? last : null;
  }

  /** 公布答案時對完成圖按表情（再按一次收回）；這一局的玩家都可以按 */
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

  /** 出題者在作畫中可以對畫家丟表情 */
  function canCheer(state, playerId) {
    return state.phase === 'drawing' && !!playerId && playerId === state.pickerId;
  }

  function cheer(state, playerId, kind) {
    if (typeof kind !== 'string' || CHEERS.indexOf(kind) < 0) return err('srv.err.badReaction', 'invalid');
    if (!canCheer(state, playerId)) return err('srv.err.pickdrawCheerForbidden', 'forbidden');
    return ok({ kind: kind, from: playerId, to: state.drawerId });
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

  /** 結算後的畫廊（每題完成圖）；整局結束前不提供 */
  function galleryOf(state) {
    if (state.phase !== 'over') return [];
    return (state.gallery || []).map(function (it) {
      return {
        turnNo: it.turnNo, mode: 'pickdraw',
        drawerId: it.drawerId, drawerName: it.drawerName,
        pickerId: it.pickerId, pickerName: it.pickerName,
        guesserId: it.guesserId, guesserName: it.guesserName,
        hit: it.hit, word: it.word, cat: it.cat, strokes: it.strokes,
        reactions: { heart: it.reactions.heart.length, laugh: it.reactions.laugh.length, clap: it.reactions.clap.length }
      };
    });
  }

  /* ------------------------------------------------------------ 投影 */

  /** 看的人在這一題的角色：picker／drawer／guesser／spectator（結束後玩家都算 player） */
  function roleOf(state, viewerId) {
    var p = viewerId ? player(state, viewerId) : null;
    if (!p) return 'spectator';
    if (state.phase === 'over' || state.phase === 'idle') return 'player';
    if (viewerId === state.pickerId) return 'picker';
    if (viewerId === state.drawerId) return 'drawer';
    if (viewerId === state.guesserId) return 'guesser';
    return 'player';
  }

  /**
   * 送給某一位觀看者的投影。
   * 猜題者在公布前拿不到答案與候選題；候選題只給出題者；畫家要等挑完才看得到答案（挑完就有）。
   * @param {string|null} viewerId null＝觀戰者
   */
  function toPublic(state, viewerId) {
    var role = roleOf(state, viewerId);
    var isGuesser = role === 'guesser';
    var hide = isGuesser && isActive(state.phase);
    var w = word(state);
    var info = w ? Words.publicInfo(w) : null;
    var drawing = state.phase === 'drawing';
    var lapNo = state.questionNo ? Math.floor((state.questionNo - 1) / CONST.PLAYERS) + 1 : 0;

    return {
      mode: 'pickdraw',
      seed: state.seed,
      lang: state.lang,
      diff: state.diff,
      phase: state.phase,
      questionNo: state.questionNo,
      turnNo: state.questionNo,
      totalQuestions: totalQuestions(state),
      lap: lapNo,
      laps: state.laps,
      drawMs: state.drawMs,
      deadline: state.deadline,
      drawStartedAt: state.drawStartedAt,
      startedAt: state.startedAt,
      pickerId: state.pickerId,
      pickerName: state.pickerId ? nameOf(state, state.pickerId) : '',
      drawerId: state.drawerId,
      drawerName: state.drawerId ? nameOf(state, state.drawerId) : '',
      guesserId: state.guesserId,
      guesserName: state.guesserId ? nameOf(state, state.guesserId) : '',
      players: state.players.map(function (p) {
        var live = state.phase !== 'over' && state.phase !== 'idle';
        return {
          id: p.id, name: p.name, score: p.score,
          role: !live ? null : (p.id === state.pickerId ? 'picker' : (p.id === state.drawerId ? 'drawer' : (p.id === state.guesserId ? 'guesser' : null))),
          isDrawer: drawing && p.id === state.drawerId,
          isGuesser: live && p.id === state.guesserId,
          pickPts: p.pickPts, drawPts: p.drawPts, guessPts: p.guessPts
        };
      }),
      strokes: state.strokes,
      /* 候選題只給出題者 */
      choices: (role === 'picker' && state.phase === 'picking') ? state.choices.map(function (id) {
        var c = Words.byId(id, state.lang);
        return { id: id, text: c.text, cat: c.cat, catEmoji: Words.CATEGORIES[c.cat].emoji, diff: c.diff };
      }) : [],
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
        isPicker: role === 'picker',
        isDrawer: role === 'drawer',
        isGuesser: isGuesser,
        canPick: role === 'picker' && state.phase === 'picking',
        canDraw: role === 'drawer' && drawing,
        canGuess: isGuesser && drawing,
        canHint: role === 'drawer' && drawing && state.hints < Rules.hintTotal(state),
        canGiveUp: isGuesser && (state.phase === 'countdown' || drawing),
        canCheer: !!viewerId && canCheer(state, viewerId),
        canChat: role !== 'picker',
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
    rolesOf: rolesOf,
    pick: pick,
    autoPick: autoPick,
    addStroke: addStroke,
    undoStroke: undoStroke,
    clearBoard: clearBoard,
    giveHint: giveHint,
    guess: guess,
    giveUp: giveUp,
    endQuestion: endQuestion,
    tick: tick,
    finish: finish,
    awardsOf: awardsOf,
    removePlayer: removePlayer,
    react: react,
    cheer: cheer,
    canCheer: canCheer,
    galleryOf: galleryOf,
    toPublic: toPublic,
    roleOf: roleOf,
    pointsAt: pointsAt,
    scoresAt: scoresAt,
    totalQuestions: totalQuestions,
    player: player,
    word: word,
    isActive: isActive,
    normDrawSec: normDrawSec,
    normLaps: normLaps
  };
}));
