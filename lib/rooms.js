/* ===== lib/rooms.js — 房間狀態機（伺服器權威） =====
 *
 * 這一層只管「房間規則」：誰可以進來、誰坐在玩家席、什麼時候能開始、
 * 邀請連結有沒有過期、誰可以猜題、誰只能看。
 * 真正的遊戲規則一律轉交 Rules（線上房間只有真人，電腦對手只在單機練習裡），
 * 兩邊跟單機模式用的是同一份程式。
 *
 * 刻意不依賴 socket.io：所有方法都是「輸入 → { ok, ... }」，
 * 所以測試可以不開網路就跑完整個生命週期。
 *
 * 房間生命週期以「實體玩家」為準：
 *   實體玩家 = 坐在玩家席的真人。觀戰者不算。
 *   實體玩家歸零（最後一個真人離開、退出、或斷線超過保留時間）→ 立刻關房，
 *   邀請失效、計時器停掉、觀戰者收到「房間已結束」。
 *   關掉之後不會因為重新連線或舊邀請復活。
 *
 * 免費雲端前提：房間只活在記憶體裡，服務重啟就會消失，
 * 所以房間被設計成「可拋棄的暫時狀態」，沒有任何長期資料要保存。
 */
'use strict';

const crypto = require('crypto');
const Rules = require('../public/js/rules.js');
const RNG = require('../public/js/rng.js');
const Words = require('../public/js/words.js');

const CODE_ALPHABET = RNG.SEED_CHARS;          // 不含 0 O 1 I，方便口頭唸房號

const DEFAULTS = {
  maxRooms: 300,
  codeLength: 4,
  graceMs: 60 * 1000,           // 斷線後保留座位的時間
  guessMax: 24,                 // 一次猜測的長度上限
  feedKeep: 120,                // 猜題紀錄保留幾筆
  guessCooldownMs: 400,         // 同一人兩次猜測的最短間隔
  guessPerTurn: 40,             // 同一題最多猜幾次（擋洗版）
  summaryKeep: 60,
  inviteTtlMs: 60 * 60 * 1000,  // 邀請連結預設有效期
  inviteMaxUses: 20,
  nameMax: 12,
  roomNameMax: 16,
  maxPlayers: 8,
  strokeCooldownMs: 0           // 筆畫不做冷卻，改用 Rules 的筆數／點數上限擋洪水
};

const err = (message, code) => ({ ok: false, error: message, code: code || 'invalid' });
const ok = (extra) => Object.assign({ ok: true }, extra || {});

/** 清掉控制字元、壓掉連續空白、限制長度。所有使用者輸入都要過這一關。 */
function sanitizeText(input, max) {
  const raw = String(input === undefined || input === null ? '' : input);
  /* 逐字元過濾：控制字元、雙向覆寫、零寬字元與各種空白一律換成半形空白。
     用字碼判斷而不是正規表示式，才不會有不可見字元躺在原始碼裡。 */
  let out = '';
  for (const ch of raw) {
    const c = ch.codePointAt(0);
    const blank = c < 0x21 || c === 0x7F || (c >= 0x80 && c <= 0xA0)
      || (c >= 0x2000 && c <= 0x200F) || (c >= 0x2028 && c <= 0x202E)
      || (c >= 0x2066 && c <= 0x2069) || c === 0x3000 || c === 0xFEFF;
    out += blank ? ' ' : ch;
  }
  out = out.split(' ').filter((part) => part.length > 0).join(' ');
  if (out.length > max) out = out.slice(0, max);
  return out;
}

/* 沒取名字的人不能全都叫「玩家」：猜題紀錄、席位卡與比分都只認名字。
   沒給名字（或還是舊版用戶端送來的通稱）就在伺服器端配一個可愛暱稱。 */
const NICK_ADJ = [
  '快樂', '愛睏', '勇敢', '迷糊', '害羞', '貪吃', '安靜', '調皮', '溫柔', '神祕',
  '閃亮', '認真', '悠哉', '熱血', '冷靜', '幸運', '好奇', '努力', '慢吞吞', '急驚風'
];
const NICK_ANIMAL = [
  '小貓', '小狗', '兔子', '企鵝', '狐狸', '水獺', '浣熊', '刺蝟', '海豚', '貓熊',
  '樹懶', '鸚鵡', '松鼠', '山羊', '袋鼠', '海豹', '章魚', '蜜蜂', '烏龜', '羊駝'
];
const GENERIC_NAMES = ['玩家', '觀眾', '觀戰者', '你'];

function randomNick() {
  return NICK_ADJ[Math.floor(Math.random() * NICK_ADJ.length)] +
    NICK_ANIMAL[Math.floor(Math.random() * NICK_ANIMAL.length)];
}

function sanitizeName(input, fallback) {
  const s = sanitizeText(input, DEFAULTS.nameMax);
  if (s && GENERIC_NAMES.indexOf(s) < 0) return s;
  if (fallback && GENERIC_NAMES.indexOf(fallback) < 0) return fallback;
  return randomNick();
}

class Room {
  constructor(store, opts) {
    this.store = store;
    this.code = opts.code;
    this.name = opts.name;
    this.private = !!opts.private;
    this.createdAt = opts.now;

    /** id -> { id, name, role, ready, connected, joinedAt, lastSeen, lastGuessAt, guessCount } */
    this.members = new Map();
    /** aiId -> { id, name, level } */
    this.hostId = null;

    /** 'waiting' | 'playing' | 'finished' */
    this.phase = 'waiting';
    this.state = null;
    this.seed = opts.seed || RNG.randomSeed(null, 6);

    this.settings = {
      rounds: Rules.CONST.ROUNDS_DEFAULT,
      drawSec: Math.round(Rules.CONST.DRAW_MS / 1000),
      diff: 0,                       // 0 = 混合難度
      maxPlayers: store.opts.maxPlayers
    };

    /** 這一題的畫家已經按過「畫完了」的題號（-1 = 還沒按）。只是通知，不會結束這一題。 */
    this.doneTurn = -1;
    /** 猜題紀錄：誰猜了什麼、誰猜對了、系統事件。這不是聊天室，沒有自由發言。 */
    this.feed = [];
    this.summary = [];
    this.invites = new Map();
    this.rematchVotes = new Set();

    this.version = 0;
    this.closed = false;
    this.closedReason = null;
  }

  /* ------------------------------------------------------------ 查詢 */

  member(id) { return this.members.get(id) || null; }
  isHost(id) { return this.hostId === id; }

  /** 坐在玩家席的真人 —— 房間存不存在只看這個數字 */
  humanPlayers() {
    return [...this.members.values()].filter((m) => m.role === 'player');
  }

  spectators() {
    return [...this.members.values()].filter((m) => m.role === 'spectator');
  }

  seatsTaken() { return this.humanPlayers().length; }

  /**
   * 同一間房裡不允許兩個一模一樣的名字：猜題紀錄、席位卡與比分都只認名字，
   * 兩個「玩家」或兩個「小明」會讓人完全分不出誰是誰，重複的就自動接編號。
   * @param {string} base    想用的名字（已經過 sanitizeName）
   * @param {string} selfId  自己的 id（換名字時不跟自己比）
   */
  uniqueName(base, selfId) {
    const taken = new Set();
    for (const [mid, m] of this.members) if (mid !== String(selfId || '')) taken.add(m.name);
    if (!taken.has(base)) return base;
    for (let i = 2; i <= 30; i++) {
      const candidate = base + i;
      if (!taken.has(candidate)) return candidate;
    }
    return base + Math.floor(Math.random() * 900 + 100);
  }
  openSeats() { return Math.max(0, this.settings.maxPlayers - this.seatsTaken()); }

  /** 送進 Rules 的名單：線上房間只有真人 */
  roster() {
    return this.humanPlayers()
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((m) => ({ id: m.id, name: m.name, ai: null }));
  }

  canStart() {
    if (this.phase === 'playing') return err('這一局已經開始了。');
    if (this.seatsTaken() < Rules.CONST.MIN_PLAYERS) {
      return err('至少要 ' + Rules.CONST.MIN_PLAYERS + ' 位玩家，人不夠可以按「加一個電腦對手」。');
    }
    const notReady = this.humanPlayers().filter((m) => !m.ready);
    if (notReady.length) {
      return err('還有人沒按「準備好了」：' + notReady.map((m) => m.name).join('、'));
    }
    return ok();
  }

  /* ------------------------------------------------------------ 加入 */

  join(id, opts) {
    const { name, role, token, now } = opts || {};
    if (this.closed) return err('這個房間已經結束了。', 'closed');

    const existing = this.members.get(id);
    if (existing) {
      /* 重新連線：座位、角色與名字都接回來 */
      existing.connected = true;
      existing.lastSeen = now;
      if (name) existing.name = this.uniqueName(sanitizeName(name, existing.name), id);
      this.syncPlayerNames();
      this.touch();
      return ok({ member: existing, reconnected: true });
    }

    let wantRole = role === 'spectator' ? 'spectator' : 'player';

    /* 帶邀請 token 進來的，角色由 token 決定並要通過驗證 */
    if (token) {
      const check = this.checkInvite(token, now);
      if (!check.ok) return check;
      if (check.invite.role !== 'any') wantRole = check.invite.role;
    } else if (this.private && !opts.creator) {
      return err('這是不公開的房間，需要邀請連結才能進來。', 'private');
    }

    /* 想當玩家但沒位子 → 明白地轉為觀戰，不默默佔位。
       對局進行中還有空位的話，可以直接加入當玩家：自動排在目前順位的最後一位，
       這一場也就跟著多一題、多一輪，不用等這一局結束。 */
    let downgraded = false;
    if (wantRole === 'player' && this.openSeats() <= 0) {
      wantRole = 'spectator';
      downgraded = true;
    }

    const member = {
      id,
      name: this.uniqueName(sanitizeName(name, ''), id),
      role: wantRole,
      ready: false,
      connected: true,
      joinedAt: now,
      lastSeen: now,
      lastGuessAt: 0,
      guessTurn: 0,
      guessCount: 0
    };
    this.members.set(id, member);
    if (!this.hostId) this.hostId = id;
    if (token) this.consumeInvite(token);
    if (member.role === 'player' && this.phase === 'playing' && this.state) {
      const added = Rules.addPlayer(this.state, { id: member.id, name: member.name, ai: null });
      if (added.ok && !added.already) this.note(member.name + ' 中途加入，排在最後一位。', now, 'info');
    }
    this.touch();
    return ok({ member, downgraded });
  }

  /** 觀戰者下場當玩家。對局進行中一樣可以下場，跟中途加入一樣排在最後一位。 */
  becomePlayer(id, now) {
    const m = this.member(id);
    if (!m) return err('你不在這個房間裡。');
    if (m.role === 'player') return ok({ already: true });
    if (this.openSeats() <= 0) return err('玩家席已經滿了，暫時只能觀戰。', 'full');
    m.role = 'player';
    m.ready = false;
    if (this.phase === 'playing' && this.state) {
      const added = Rules.addPlayer(this.state, { id: m.id, name: m.name, ai: null });
      if (added.ok && !added.already) this.note(m.name + ' 中途下場一起玩，排在最後一位。', now, 'info');
    }
    this.touch();
    return ok();
  }

  becomeSpectator(id) {
    const m = this.member(id);
    if (!m) return err('你不在這個房間裡。');
    if (this.phase === 'playing' && m.role === 'player') {
      return err('對局進行中不能改成觀戰，可以按「離開房間」。', 'playing');
    }
    m.role = 'spectator';
    m.ready = false;
    this.touch();
    return ok();
  }

  setReady(id, ready) {
    const m = this.member(id);
    if (!m) return err('你不在這個房間裡。');
    if (m.role !== 'player') return err('觀戰者不需要準備。', 'forbidden');
    m.ready = !!ready;
    this.touch();
    return ok({ ready: m.ready });
  }

  setSettings(hostId, patch) {
    if (!this.isHost(hostId)) return err('只有房主可以調整規則。', 'forbidden');
    if (this.phase === 'playing') return err('對局進行中不能改規則。');
    const p = patch || {};
    if (p.rounds !== undefined) {
      const r = Math.round(Number(p.rounds));
      if (!isFinite(r) || r < 1 || r > Rules.CONST.ROUNDS_MAX) return err('每人輪數只能是 1 到 ' + Rules.CONST.ROUNDS_MAX + '。');
      this.settings.rounds = r;
    }
    if (p.drawSec !== undefined) {
      const d = Math.round(Number(p.drawSec));
      if (!isFinite(d) || d < Rules.CONST.DRAW_SEC_MIN || d > Rules.CONST.DRAW_SEC_MAX) {
        return err('每題作畫秒數只能是 ' + Rules.CONST.DRAW_SEC_MIN + ' 到 ' + Rules.CONST.DRAW_SEC_MAX + ' 秒。');
      }
      this.settings.drawSec = d;
    }
    if (p.diff !== undefined) {
      const v = Math.round(Number(p.diff));
      if ([0, 1, 2, 3].indexOf(v) < 0) return err('題目難度只能是混合、簡單、普通或困難。');
      this.settings.diff = v;
    }
    this.touch();
    return ok({ settings: this.settings });
  }

  /* ------------------------------------------------------------ 開局 */

  start(hostId, now) {
    if (!this.isHost(hostId)) return err('只有房主可以開始對局。', 'forbidden');
    const can = this.canStart();
    if (!can.ok) return can;

    this.seed = RNG.randomSeed(null, 6);
    this.state = Rules.createState({
      seed: this.seed,
      players: this.roster(),
      rounds: this.settings.rounds,
      drawSec: this.settings.drawSec,
      diff: this.settings.diff
    });
    const s = Rules.start(this.state, now);
    if (!s.ok) return s;
    this.phase = 'playing';
    this.doneTurn = -1;
    this.summary = [];
    this.rematchVotes.clear();
    this.note('開始！種子 ' + this.seed + '，每人畫 ' + this.settings.rounds + ' 次，每題 ' + this.settings.drawSec + ' 秒。', now);
    this.noteTurnStart(now);
    this.touch();
    return ok({ state: this.state });
  }

  /* ---------------------------------------------------------- 遊戲行動 */

  /** 只有「坐在玩家席、而且真的在這一局裡」的人可以送遊戲行動 */
  requirePlayer(id) {
    const m = this.member(id);
    if (!m) return err('你不在這個房間裡。');
    if (m.role !== 'player') return err('觀戰者不能操作遊戲，只能看。', 'forbidden');
    if (this.phase !== 'playing' || !this.state) return err('現在沒有進行中的對局。', 'phase');
    if (!Rules.player(this.state, id)) return err('你不在這一局的名單裡。', 'forbidden');
    return ok({ member: m });
  }

  pickWord(id, wordId, now) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    const res = Rules.pickWord(this.state, id, wordId, now);
    if (!res.ok) return res;
    this.noteWordPicked(now, false);
    this.touch();
    return res;
  }

  stroke(id, raw, now) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    const res = Rules.addStroke(this.state, id, raw);
    if (!res.ok) return res;
    this.touch();
    return res;
  }

  undo(id) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    const res = Rules.undoStroke(this.state, id);
    if (res.ok) this.touch();
    return res;
  }

  clearBoard(id) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    const res = Rules.clearBoard(this.state, id);
    if (res.ok) this.touch();
    return res;
  }

  /** 畫家給出下一張提示（字數 → 種類 → 一個字） */
  giveHint(id, now) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    const res = Rules.giveHint(this.state, id, now);
    if (!res.ok) return res;
    this.noteHint(res, now);
    this.touch();
    return res;
  }

  /** 畫家提前結束這一題 */
  skipTurn(id, now) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    const res = Rules.giveUp(this.state, id, now);
    if (!res.ok) return res;
    this.noteTurnEnd(res.entry, now);
    this.touch();
    return res;
  }

  /* ------------------------------------------------------------ 猜題 */

  /**
   * 送出一次猜測。這個遊戲沒有聊天室：唯一的文字輸入就是答案，
   * 所以畫家與觀戰者根本沒有可以打字的地方，也就沒有「不小心把答案說出來」的問題。
   *
   * @returns {{ok, kind:'hit'|'close'|'miss', entry?, points?, order?}}
   *   hit   猜中：猜的內容不外流，只公布「某某猜對了」
   *   close 只差一個字：只回給猜的人，不進紀錄
   *   miss  沒猜中：寫進猜題紀錄讓大家看到有人猜過什麼
   */
  guess(id, text, now) {
    const m = this.member(id);
    if (!m) return err('你不在這個房間裡。');
    if (this.phase !== 'playing' || !this.state) return err('現在沒有進行中的對局。', 'phase');
    if (m.role !== 'player') return err('觀戰者不能猜題，只能看。', 'forbidden');
    if (!Rules.player(this.state, id)) return err('你不在這一局的名單裡。', 'forbidden');
    if (this.state.phase !== 'drawing') return err('現在不是猜題時間。', 'phase');
    if (this.state.drawerId === id) return err('你是這一回合的畫家，不能猜自己的題目。', 'forbidden');
    if (Rules.hasGuessed(this.state, id)) return err('你已經猜對了，等其他人。', 'done');

    if (now - m.lastGuessAt < this.store.opts.guessCooldownMs) {
      return err('猜太快了，慢一點再試。', 'ratelimit');
    }
    if (m.guessTurn !== this.state.turnNo) { m.guessTurn = this.state.turnNo; m.guessCount = 0; }
    if (m.guessCount >= this.store.opts.guessPerTurn) {
      return err('這一題你已經猜很多次了，等下一題吧。', 'ratelimit');
    }
    const clean = sanitizeText(text, this.store.opts.guessMax);
    if (!clean) return err('猜測是空的。', 'empty');
    m.lastGuessAt = now;
    m.guessCount += 1;

    const g = Rules.guess(this.state, id, clean, now);
    if (!g.ok) return g;
    if (g.verdict === 'hit') {
      this.touch();
      this.noteCorrect(m, g, now);
      return ok({ kind: 'hit', points: g.points, order: g.order, allDone: g.allDone, name: m.name });
    }
    if (g.verdict === 'close') return ok({ kind: 'close', text: clean });
    return ok({ kind: 'miss', entry: this.pushFeed(this.guessEntry(m.name, m.id, 'player', clean, now)) });
  }

  /**
   * 畫家按「畫完了」：只是告訴大家可以認真猜了，**不會**結束這一題，
   * 時間照跑、還能繼續補筆畫。真的要結束是 skipTurn。
   */
  markDone(id, now) {
    if (this.phase !== 'playing' || !this.state) return err('現在沒有進行中的對局。', 'phase');
    const m = this.member(id);
    if (!m) return err('你不在這個房間裡。');
    if (this.state.drawerId !== id) return err('只有這一題的畫家可以說畫完了。', 'forbidden');
    if (this.state.phase !== 'drawing') return err('現在不是作畫時間。', 'phase');
    if (this.doneTurn === this.state.turnNo) return err('你已經說過畫完了。', 'done');
    this.doneTurn = this.state.turnNo;
    this.note(m.name + ' 說畫完了，快猜！', now, 'info');
    this.system('🎨 ' + m.name + ' 說畫完了，快猜！', now);
    this.touch();
    return ok({ name: m.name });
  }

  guessEntry(from, fromId, role, text, now) {
    return {
      id: crypto.randomBytes(6).toString('hex'),
      kind: 'guess', from, fromId, role, text, at: now
    };
  }

  /** 系統訊息（有人加入、猜中、換題…），跟猜題紀錄共用同一條時間軸 */
  system(text, now, kind) {
    return this.pushFeed({
      id: crypto.randomBytes(6).toString('hex'),
      kind: kind || 'system',
      from: '系統',
      fromId: null,
      role: 'system',
      text: sanitizeText(text, 160),
      at: now
    });
  }

  pushFeed(entry) {
    this.feed.push(entry);
    if (this.feed.length > this.store.opts.feedKeep) {
      this.feed.splice(0, this.feed.length - this.store.opts.feedKeep);
    }
    return entry;
  }

  /* -------------------------------------------------------- 操作摘要 */

  /**
   * 摘要條目。重要：作畫階段結束前，這裡絕對不會出現答案，
   * 所以同一份摘要可以直接送給玩家與觀戰者，不需要再過濾。
   */
  note(text, now, kind) {
    this.summary.push({ text: sanitizeText(text, 120), at: now, kind: kind || 'info' });
    if (this.summary.length > this.store.opts.summaryKeep) {
      this.summary.splice(0, this.summary.length - this.store.opts.summaryKeep);
    }
  }

  noteTurnStart(now) {
    const s = this.state;
    if (!s) return;
    const d = Rules.player(s, s.drawerId);
    this.note('第 ' + s.turnNo + ' / ' + s.totalTurns + ' 題：輪到 ' + (d ? d.name : '—') + ' 當畫家，正在選題目。', now, 'turn');
  }

  noteWordPicked(now, auto) {
    const s = this.state;
    if (!s || !s.wordId) return;
    const w = Words.byId(s.wordId);
    const d = Rules.player(s, s.drawerId);
    /* 種類與字數現在是畫家手上的提示，選題時還不能寫進摘要 */
    this.note((d ? d.name : '—') + (auto ? ' 沒選，系統幫他挑了題目' : ' 選好題目了') +
      '，開始作畫。', now, 'pick');
  }

  noteHint(res, now) {
    const text = res.step === 1 ? '畫家給了提示：題目有 ' + res.mask.length + ' 個字。'
      : res.step === 2 ? '畫家給了提示：種類是「' + Words.CATEGORIES[Words.byId(this.state.wordId).cat].label + '」。'
        : '畫家給了提示：' + res.mask;
    this.note(text, now, 'hint');
    this.system(text, now, 'hint');
  }

  noteCorrect(who, g, now) {
    this.note(who.name + ' 猜對了！第 ' + g.order + ' 個，+' + g.points + ' 分。', now, 'correct');
    this.system(who.name + ' 猜對了！（第 ' + g.order + ' 個，+' + g.points + ' 分）', now, 'correct');
  }

  noteTurnEnd(entry, now) {
    if (!entry) return;
    this.note('答案是「' + entry.word + '」；' + entry.correct + '/' + entry.total +
      ' 人猜中，畫家 ' + entry.drawerName + ' +' + entry.drawerPoints + ' 分。', now, 'reveal');
    this.system('⏱ 這一題結束，答案是「' + entry.word + '」。', now);
  }

  /* ------------------------------------------------------- 邀請連結 */

  createInvite(id, { role, ttlMs, maxUses, now }) {
    const m = this.member(id);
    if (!m) return err('你不在這個房間裡。');
    if (m.role !== 'player' && !this.isHost(id)) {
      return err('只有玩家或房主可以產生邀請連結。', 'forbidden');
    }
    const wanted = (role === 'player' || role === 'spectator' || role === 'any') ? role : 'any';
    const ttl = Math.max(60 * 1000, Math.min(24 * 60 * 60 * 1000, Number(ttlMs) || this.store.opts.inviteTtlMs));
    const uses = Math.max(1, Math.min(100, Number(maxUses) || this.store.opts.inviteMaxUses));
    const token = crypto.randomBytes(16).toString('hex');   // 16 bytes = 猜不到
    this.invites.set(token, {
      token, role: wanted, createdBy: id, createdAt: now,
      expiresAt: now + ttl, maxUses: uses, uses: 0, revoked: false
    });
    /* 一間房最多留 8 組有效邀請，超過就丟掉最舊的 */
    if (this.invites.size > 8) {
      const oldest = [...this.invites.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
      this.invites.delete(oldest.token);
    }
    this.touch();
    return ok({ invite: this.invites.get(token) });
  }

  revokeInvite(id, token) {
    const inv = this.invites.get(token);
    if (!inv) return err('找不到這組邀請連結。', 'gone');
    if (inv.createdBy !== id && !this.isHost(id)) return err('只有產生者或房主可以撤銷。', 'forbidden');
    inv.revoked = true;
    this.touch();
    return ok({ token });
  }

  /** 每次加入與重新連線都重新驗證，不是只在產生的當下檢查一次 */
  checkInvite(token, now) {
    if (this.closed) return err('這個邀請連結指向的房間已經結束了。', 'closed');
    const inv = this.invites.get(String(token || ''));
    if (!inv) return err('這個邀請連結無效，可能已經被撤銷或房間換過。', 'invite_invalid');
    if (inv.revoked) return err('這個邀請連結已經被撤銷了。', 'invite_revoked');
    if (inv.expiresAt <= now) return err('這個邀請連結已經過期，請對方重新產生一組。', 'invite_expired');
    if (inv.uses >= inv.maxUses) return err('這個邀請連結的使用次數已經用完。', 'invite_used');
    if (this.phase === 'playing') {
      return ok({ invite: inv, note: '對局進行中，你會先以觀戰身分進入，下一局就能下場。' });
    }
    if (this.openSeats() <= 0 && inv.role !== 'spectator') {
      return ok({ invite: inv, note: '玩家席已滿，你會以觀戰身分進入房間。' });
    }
    return ok({ invite: inv });
  }

  consumeInvite(token) {
    const inv = this.invites.get(String(token || ''));
    if (inv) inv.uses += 1;
  }

  /** 房間關閉時把所有邀請一併作廢 */
  revokeAllInvites() {
    for (const inv of this.invites.values()) inv.revoked = true;
  }

  /* ------------------------------------------------------- 離開／回收 */

  disconnect(id, now) {
    const m = this.member(id);
    if (!m) return err('沒有這個人。');
    m.connected = false;
    m.lastSeen = now;
    this.touch();
    return ok();
  }

  leave(id, now) {
    const m = this.member(id);
    if (!m) return err('沒有這個人。');
    this.members.delete(id);
    this.rematchVotes.delete(id);

    if (this.state && Rules.player(this.state, id)) {
      const r = Rules.removePlayer(this.state, id, now);
      if (r.ok && r.turnEnded) this.noteTurnEnd(r.turnEnded, now);
      if (this.state.over && this.phase === 'playing') this.finishGame(now);
    }
    if (this.hostId === id) {
      const next = [...this.members.values()].sort((a, b) => a.joinedAt - b.joinedAt)[0];
      this.hostId = next ? next.id : null;
    }
    this.touch();
    return ok({ name: m.name, role: m.role });
  }

  /** 斷線超過保留時間的人清掉，把座位讓出來 */
  sweepMembers(now) {
    const dropped = [];
    for (const m of [...this.members.values()]) {
      if (m.connected) continue;
      if (now - m.lastSeen < this.store.opts.graceMs) continue;
      this.leave(m.id, now);
      dropped.push(m);
    }
    return dropped;
  }

  /** 實體玩家歸零 → 立刻關房。AI 席位與觀戰者都不能讓房間活下去。 */
  shouldClose() {
    return this.humanPlayers().length === 0;
  }

  close(reason, now) {
    if (this.closed) return;
    this.closed = true;
    this.closedReason = reason || '房間已經結束。';
    this.phase = 'finished';
    this.revokeAllInvites();
    this.state = null;                 // 停掉對局計時器的依據
    this.note(this.closedReason, now, 'closed');
    this.touch();
  }

  /* ------------------------------------------------------------ 推進 */

  /**
   * 每秒（或每次有人行動後）呼叫一次：推進規則時間。
   * 線上房間只有真人，沒有需要代打的電腦席位。
   * @returns {{events: Array, strokes: Array, feed: Array}}
   */
  tick(now) {
    const out = { events: [], strokes: [], feed: [] };
    if (this.closed || this.phase !== 'playing' || !this.state) return out;

    const before = this.state.turnNo;
    const t = Rules.tick(this.state, now);
    for (const ev of t.events) this.applyEvent(ev, now);
    out.events.push(...t.events);

    if (this.state.over) { this.finishGame(now); return out; }
    if (this.state && this.state.turnNo !== before) this.touch();
    return out;
  }

  applyEvent(ev, now) {
    if (ev.type === 'autopick') this.noteWordPicked(now, true);
    else if (ev.type === 'turnend') this.noteTurnEnd(ev.entry, now);
    else if (ev.type === 'turnstart') this.noteTurnStart(now);
    else if (ev.type === 'gameover') this.note('全部畫完了，正在結算。', now, 'over');
    this.touch();
  }

  finishGame(now) {
    if (this.phase === 'finished') return;
    this.phase = 'finished';
    for (const m of this.members.values()) m.ready = false;
    this.rematchVotes.clear();
    const names = (this.state ? this.state.winners : []).map((id) => {
      const p = Rules.player(this.state, id);
      return p ? p.name : '—';
    });
    this.system(names.length > 1 ? '🏆 平手！' + names.join('、') + ' 並列第一。' : '🏆 ' + (names[0] || '—') + ' 拿下這一局！', now);
    this.note('結算：' + (names.join('、') || '—') + ' 獲勝。', now, 'result');
    this.touch();
  }

  /** 再來一局：所有真人玩家都同意才重開 */
  voteRematch(id, now) {
    if (this.phase !== 'finished') return err('這一局還沒結束。');
    if (this.closed) return err('房間已經結束了。', 'closed');
    const m = this.member(id);
    if (!m) return err('你不在這個房間裡。');
    if (m.role !== 'player') return err('觀戰者不能投票再來一局。', 'forbidden');
    this.rematchVotes.add(id);
    const humans = this.humanPlayers().map((x) => x.id);
    const all = humans.every((hid) => this.rematchVotes.has(hid));
    if (!all) {
      this.touch();
      return ok({ started: false, votes: this.rematchVotes.size, need: humans.length });
    }
    this.phase = 'waiting';
    for (const p of this.humanPlayers()) p.ready = true;
    const r = this.start(this.hostId && this.member(this.hostId) ? this.hostId : humans[0], now);
    if (!r.ok) { this.phase = 'finished'; return r; }
    return ok({ started: true });
  }

  syncPlayerNames() {
    if (!this.state) return;
    for (const p of this.state.players) {
      const m = this.members.get(p.id);
      if (m) p.name = m.name;
    }
  }

  touch() { this.version += 1; }

  /* --------------------------------------------------------- 對外投影 */

  brief() {
    return {
      code: this.code,
      name: this.name,
      private: this.private,
      phase: this.phase,
      closed: this.closed,
      players: this.seatsTaken(),
      maxPlayers: this.settings.maxPlayers,
      humans: this.humanPlayers().length,
      spectators: this.spectators().length,
      host: this.hostId && this.members.get(this.hostId) ? this.members.get(this.hostId).name : '',
      rounds: this.settings.rounds,
      drawSec: this.settings.drawSec,
      turnNo: this.state ? this.state.turnNo : 0,
      totalTurns: this.state ? this.state.totalTurns : this.settings.rounds * Math.max(1, this.seatsTaken()),
      createdAt: this.createdAt
    };
  }

  /**
   * 傳給某一位成員的完整房間投影。
   * 答案的保護在 Rules.toPublic 裡：只有當回合畫家拿得到，
   * 觀戰者與其他玩家一律拿遮罩字串。摘要本身在揭曉前不寫答案。
   */
  viewFor(id, now) {
    const m = this.member(id);
    const isHost = this.isHost(id);
    const canStart = this.canStart();
    const inGame = !!(this.state && Rules.player(this.state, id));
    const game = this.state ? Rules.toPublic(this.state, inGame ? id : null) : null;

    return {
      room: {
        code: this.code,
        name: this.name,
        private: this.private,
        phase: this.phase,
        closed: this.closed,
        closedReason: this.closedReason,
        hostId: this.hostId,
        settings: this.settings,
        drawerDone: !!(this.state && this.doneTurn === this.state.turnNo),
        seatsTaken: this.seatsTaken(),
        openSeats: this.openSeats(),
        members: [...this.members.values()].map((x) => ({
          id: x.id, name: x.name, role: x.role, ready: x.ready,
          connected: x.connected, host: x.id === this.hostId
        })),
        summary: this.summary,
        feed: this.feed,
        invites: (isHost || (m && m.role === 'player'))
          ? [...this.invites.values()]
            .filter((i) => !i.revoked && i.expiresAt > now && i.uses < i.maxUses)
            .map((i) => ({ token: i.token, role: i.role, expiresAt: i.expiresAt, uses: i.uses, maxUses: i.maxUses }))
          : [],
        rematchVotes: this.rematchVotes.size,
        version: this.version
      },
      game,
      you: m ? {
        id: m.id,
        name: m.name,
        role: m.role,
        ready: m.ready,
        isHost,
        inGame,
        can: {
          ready: m.role === 'player' && this.phase !== 'playing',
          start: isHost && canStart.ok,
          startBlockedBy: canStart.ok ? null : canStart.error,
          setAi: isHost && this.phase !== 'playing',
          setSettings: isHost && this.phase !== 'playing',
          pick: inGame && !!game && game.you.canPick,
          draw: inGame && !!game && game.you.canDraw,
          guess: inGame && !!game && game.you.canGuess,
          skip: inGame && !!game && game.you.canDraw,
          invite: (m.role === 'player' || isHost) && !this.closed,
          rematch: this.phase === 'finished' && m.role === 'player' && !this.closed,
          becomePlayer: m.role === 'spectator' && !this.closed && this.openSeats() > 0,
          becomeSpectator: m.role === 'player' && this.phase !== 'playing'
        }
      } : null
    };
  }
}

class RoomStore {
  constructor(opts) {
    this.opts = Object.assign({}, DEFAULTS, opts || {});
    this.rooms = new Map();
  }

  newCode() {
    let code;
    let guard = 0;
    do {
      code = Array.from({ length: this.opts.codeLength }, () =>
        CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');
      guard += 1;
    } while (this.rooms.has(code) && guard < 200);
    return code;
  }

  create(id, { name, roomName, private: isPrivate, settings, now }) {
    if (this.rooms.size >= this.opts.maxRooms) {
      return err('伺服器上的房間已經滿了，請稍後再試。', 'busy');
    }
    const room = new Room(this, {
      code: this.newCode(),
      name: sanitizeText(roomName, this.opts.roomNameMax) || '畫畫小房間',
      private: !!isPrivate,
      now
    });
    const joined = room.join(id, { name, role: 'player', now, creator: true });
    if (!joined.ok) return joined;
    const configured = room.setSettings(id, settings || {});
    if (!configured.ok) return configured;
    this.rooms.set(room.code, room);
    room.hostId = id;
    return ok({ room });
  }

  get(code) {
    const room = this.rooms.get(String(code || '').toUpperCase().trim()) || null;
    return room && !room.closed ? room : null;
  }

  /** 連已關閉的房間也拿得到，讓還在房裡的觀戰者能收到「已結束」 */
  getAny(code) {
    return this.rooms.get(String(code || '').toUpperCase().trim()) || null;
  }

  list() {
    const out = [];
    for (const r of this.rooms.values()) {
      if (r.private || r.closed) continue;
      if (r.members.size === 0) continue;
      out.push(r.brief());
    }
    out.sort((a, b) => {
      const rank = (x) => (x.phase === 'waiting' ? 0 : (x.phase === 'playing' ? 1 : 2));
      return rank(a) - rank(b) || b.createdAt - a.createdAt;
    });
    return out.slice(0, 50);
  }

  /**
   * 每秒的定時工作：推進對局、踢掉斷線太久的人、關掉沒有實體玩家的房間。
   * @returns {{ticked, changed, closed, forget}}
   */
  sweep(now) {
    const ticked = [];
    const changed = [];
    const closed = [];
    const forget = [];

    for (const room of [...this.rooms.values()]) {
      if (room.closed) {
        /* 關閉後再留 2 分鐘讓還連著的人收到通知，然後才真的丟掉 */
        if (now - (room.closedAt || (room.closedAt = now)) > 120000) {
          this.rooms.delete(room.code);
          forget.push(room);
        }
        continue;
      }

      const dropped = room.sweepMembers(now);
      if (dropped.length) changed.push(room);

      if (room.shouldClose()) {
        room.close(
          room.members.size > 0
            ? '房間裡已經沒有玩家了（只剩觀戰者），房間自動關閉。'
            : '房間裡已經沒有人了，房間自動關閉。',
          now
        );
        room.closedAt = now;
        closed.push(room);
        continue;
      }

      const res = room.tick(now);
      if (res.events.length || res.strokes.length || res.feed.length) {
        ticked.push({ room, ...res });
      }
    }
    return { ticked, changed, closed, forget };
  }

  size() { return [...this.rooms.values()].filter((r) => !r.closed).length; }
}

module.exports = { RoomStore, Room, DEFAULTS, sanitizeText, sanitizeName };
