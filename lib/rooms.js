/* ===== lib/rooms.js — 房間狀態機（伺服器權威） =====
 *
 * 這一層只管「房間規則」：誰可以進來、誰坐在玩家席、什麼時候能開始、
 * 邀請連結有沒有過期、誰可以猜題、誰只能看。
 * 真正的遊戲規則一律轉交 Rules（線上房間跟單機都只有真人，沒有電腦對手），
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
const RelayRules = require('../public/js/relay-rules.js');
const PickdrawRules = require('../public/js/pickdraw-rules.js');
const RNG = require('../public/js/rng.js');
const Words = require('../public/js/words.js');

const CODE_ALPHABET = RNG.SEED_CHARS;          // 不含 0 O 1 I，方便口頭唸房號

/* 線上房間自己的規則上限：跟 Rules.CONST 的引擎極限（給單機自己練習用的）分開，
   不然單機把上限拉到 999 輪、99999 秒，線上房間也會跟著被拉大，其他真人會被晾在那邊等。 */
const ROOM_MIN_PLAYERS = 2;      // 線上至少要兩個真人才能開始，一個人就用單機練習
const ROOM_ROUNDS_MAX = Math.min(5, Rules.CONST.ROUNDS_MAX);
const ROOM_DRAW_SEC_MAX = Math.min(120, Rules.CONST.DRAW_SEC_MAX);

const DEFAULTS = {
  maxRooms: 300,
  codeLength: 4,
  graceMs: 60 * 1000,           // 斷線後保留座位的時間
  hostAwayMs: 20 * 1000,        // 等待／結算畫面的房主斷線多久，就先把房主交給在線的玩家
  idleMs: 30 * 60 * 1000,       // 等待／結算畫面完全沒有任何動作多久就收掉房間（0 = 不收）
  guessMax: 40,                 // 一次猜測的長度上限（英文題目最長 32 個字元，要放得下）
  feedKeep: 120,                // 猜題紀錄保留幾筆
  guessCooldownMs: 400,         // 同一人兩次猜測的最短間隔
  guessPerTurn: 40,             // 同一題最多猜幾次（擋洗版）
  summaryKeep: 60,
  chatMax: 200,                 // 一則聊天訊息的長度上限
  chatKeep: 60,                 // 聊天紀錄保留幾筆
  chatCooldownMs: 500,          // 同一人兩則聊天的最短間隔
  inviteTtlMs: 60 * 60 * 1000,  // 邀請連結預設有效期
  inviteMaxUses: 20,
  nameMax: 12,
  roomNameMax: 24,
  maxPlayers: 8,
  strokeCooldownMs: 0           // 筆畫不做冷卻，改用 Rules 的筆數／點數上限擋洪水
};

/* 錯誤訊息一律是字典代碼（srv.err.＊）加參數，由用戶端依使用者的語系翻譯；
   伺服器不產生任何特定語言的句子。 */
const err = (key, code, params) => ({ ok: false, error: key, params: params || null, code: code || 'invalid' });
const ok = (extra) => Object.assign({ ok: true }, extra || {});

/* 用戶端送來的東西不能直接 String()／Number()：物件可以把 toString／valueOf 塞成非函式，
   String({toString:1,valueOf:1}) 會直接丟例外，沒接住的話整台伺服器就掛了。
   所以一律只接受真正的字串／數字，其他型別當成空值。 */
const str = (x) => (typeof x === 'string' ? x : (typeof x === 'number' && isFinite(x) ? String(x) : ''));
const num = (x) => (typeof x === 'number' ? x : (typeof x === 'string' && x.trim() !== '' ? Number(x) : NaN));

/** 畫家斷線多久沒回來，這一題就先跳過（座位還是照樣保留 graceMs） */
const DRAWER_AWAY_MS = 15 * 1000;
/* 接力模式：猜題者斷線就公布答案、輪到的畫家斷線就跳過。
   給 3 秒緩衝只是讓「重新整理頁面」或網路閃一下的人不會一斷就害整題結束。 */
const RELAY_AWAY_MS = 3 * 1000;
const RELAY_TYPING_MS = 4000;          // 「輸入中…」最多亮多久（沒有再收到就熄掉）
const RELAY_CHEER_COOLDOWN_MS = 600;   // 同一人兩次丟表情的最短間隔
const MODES = ['classic', 'relay', 'pickdraw'];
const PICKDRAW_CHEER_COOLDOWN_MS = 600; // 你出我畫他猜：出題者兩次丟表情的最短間隔
/* 你出我畫他猜：畫家或猜題者斷線多久沒回來，這題就直接公布、三人都不得分（跟一般模式的畫家一樣等 15 秒） */
const PICKDRAW_AWAY_MS = DRAWER_AWAY_MS;
/* 投票踢人：除了被投票的人以外，玩家過半數同意才成立 */
const KICK_VOTE_MS = 30 * 1000;        // 一場投票開多久
const KICK_BAN_MS = 5 * 60 * 1000;     // 被踢出後多久不能再進同一間房
const KICK_COOLDOWN_MS = 60 * 1000;    // 同一個人兩次發起之間的冷卻
const KICK_MIN_PLAYERS = 3;            // 兩人房沒有「多數」可言

/** 清掉控制字元、壓掉連續空白、限制長度。所有使用者輸入都要過這一關。 */
function sanitizeText(input, max) {
  const raw = str(input);
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
/* 英文暱稱：形容詞（最多 5 個字母）＋ 空白 ＋ 小動物（最多 6 個字母），剛好塞進 12 字的上限 */
const NICK_ADJ_EN = [
  'Happy', 'Brave', 'Dizzy', 'Shy', 'Quiet', 'Silly', 'Magic', 'Shiny', 'Smart', 'Chill',
  'Lucky', 'Nosy', 'Eager', 'Slow', 'Jolly', 'Zippy', 'Cozy', 'Sunny', 'Merry', 'Fuzzy'
];
const NICK_ANIMAL_EN = [
  'Kitty', 'Puppy', 'Bunny', 'Fox', 'Otter', 'Panda', 'Sloth', 'Parrot', 'Goat', 'Seal',
  'Bee', 'Turtle', 'Alpaca', 'Koala', 'Lemur', 'Moose', 'Gecko', 'Hippo', 'Mole', 'Llama'
];
const GENERIC_NAMES = ['玩家', '觀眾', '觀戰者', '你', 'player', 'guest', 'spectator', 'you'];
const isGeneric = (name) => GENERIC_NAMES.indexOf(String(name).toLowerCase()) >= 0;

/** lang：'en' 配英文暱稱，其餘配中文暱稱 */
function randomNick(lang) {
  if (lang === 'en') {
    return NICK_ADJ_EN[Math.floor(Math.random() * NICK_ADJ_EN.length)] + ' ' +
      NICK_ANIMAL_EN[Math.floor(Math.random() * NICK_ANIMAL_EN.length)];
  }
  return NICK_ADJ[Math.floor(Math.random() * NICK_ADJ.length)] +
    NICK_ANIMAL[Math.floor(Math.random() * NICK_ANIMAL.length)];
}

function sanitizeName(input, fallback, lang) {
  const s = sanitizeText(input, DEFAULTS.nameMax);
  if (s && !isGeneric(s)) return s;
  if (fallback && !isGeneric(fallback)) return fallback;
  return randomNick(lang);
}

class Room {
  constructor(store, opts) {
    this.store = store;
    this.code = opts.code;
    this.name = opts.name;
    this.private = !!opts.private;
    this.createdAt = opts.now;
    /** 'classic'（一般模式）| 'relay'（接力模式）| 'pickdraw'（你出我畫他猜 Beta）：開房時決定，之後不會變 */
    this.mode = MODES.indexOf(opts.mode) >= 0 ? opts.mode : 'classic';
    /** 接力：猜題者「輸入中…」亮到幾點（只給畫家與觀戰者看） */
    this.typingUntil = 0;

    /** id -> { id, name, role, ready, connected, joinedAt, lastSeen, lastGuessAt, guessCount } */
    this.members = new Map();
    /** aiId -> { id, name, level } */
    this.hostId = null;

    /** 'waiting' | 'playing' | 'finished' */
    this.phase = 'waiting';
    this.state = null;
    this.seed = opts.seed || RNG.randomSeed(null, 6);

    this.settings = this.mode === 'relay' ? {
      guessRounds: RelayRules.CONST.GUESS_ROUNDS_DEFAULT,   // 每人當猜題者幾次（1–5）
      batonSec: RelayRules.CONST.BATON_SEC_DEFAULT,         // 每棒作畫秒數（7／12／17）
      diff: 0,
      category: '',
      wordLang: 'zh-Hant',
      maxPlayers: Math.min(store.opts.maxPlayers, RelayRules.CONST.MAX_PLAYERS)
    } : this.mode === 'pickdraw' ? {
      laps: PickdrawRules.CONST.LAPS_DEFAULT,             // 一場幾圈（1–5，一圈 3 題）
      drawSec: PickdrawRules.CONST.DRAW_SEC_DEFAULT,      // 每題作畫秒數（30／60／90）
      diff: 0,
      category: '',
      wordLang: 'zh-Hant',
      maxPlayers: PickdrawRules.CONST.PLAYERS             // 固定 3 人，第 4 人起只能觀戰
    } : {
      rounds: Rules.CONST.ROUNDS_DEFAULT,
      drawSec: Math.round(Rules.CONST.DRAW_MS / 1000),
      diff: 0,                       // 0 = 混合難度
      category: '',                  // 空字串 = 全部種類
      /* 題庫語言：整間房共用（不跟著每個人的介面語言走），由房主在開房／等待畫面決定 */
      wordLang: 'zh-Hant',
      maxPlayers: store.opts.maxPlayers
    };

    /** 這一題的畫家已經按過「畫完了」的題號（-1 = 還沒按）。只是通知，不會結束這一題。 */
    this.doneTurn = -1;
    /** 猜題紀錄：誰猜了什麼、誰猜對了、系統事件。這是遊戲紀錄，不是自由聊天。 */
    this.feed = [];
    this.summary = [];
    this.invites = new Map();
    /** 這一局中途離開的人：id -> { score, drew }。同一局裡回來時接回分數與已畫次數，開新局就清掉。 */
    this.departed = new Map();
    /** 等待畫面的自由聊天：只在 phase === 'waiting' 收，開始對局後 chat() 一律擋掉，
     *  這樣才不會有人不小心把題目答案打進聊天室裡外流。見下面 chat()。
     *  這個陣列刻意不叫 this.chat：下面 chat() 方法要用這個名字，陣列跟方法撞名的話，
     *  建構子裡賦值會直接把原型上的方法蓋掉，之後呼叫 room.chat(...) 就會炸掉。 */
    this.chatLog = [];

    /** 進行中的踢人投票：{ targetId, targetName, byId, byName, yes:Set<id>, endsAt }，沒有就是 null */
    this.kickVote = null;
    /** 被投票踢出的人：id -> 幾點之後才能再進來 */
    this.banned = new Map();

    this.version = 0;
    this.closed = false;
    this.closedReason = null;
  }

  /* ------------------------------------------------------------ 查詢 */

  member(id) { return this.members.get(id) || null; }
  isHost(id) { return this.hostId === id; }

  get relay() { return this.mode === 'relay'; }
  /** 這間房用哪一份規則核心：一般模式走 Rules，接力模式走 RelayRules */
  get pickdraw() { return this.mode === 'pickdraw'; }
  get engine() { return this.relay ? RelayRules : (this.pickdraw ? PickdrawRules : Rules); }
  minPlayers() {
    if (this.relay) return RelayRules.CONST.MIN_PLAYERS;
    if (this.pickdraw) return PickdrawRules.CONST.PLAYERS;
    return ROOM_MIN_PLAYERS;
  }

  /** 你出我畫他猜：這個人現在是不是「這一題進行中的猜題者」（看不到答案） */
  isPickdrawGuesser(id) {
    return this.pickdraw && this.phase === 'playing' && !!this.state &&
      this.state.guesserId === id && PickdrawRules.isActive(this.state.phase);
  }

  /** 接力：斷線超過 RELAY_AWAY_MS 的玩家（猜題者就公布、輪到的畫家就跳過） */
  awayIds(now, ms) {
    const limit = ms === undefined ? RELAY_AWAY_MS : ms;
    const out = [];
    for (const m of this.members.values()) {
      if (!m.connected && now - m.lastSeen >= limit) out.push(m.id);
    }
    return out;
  }

  /** 接力：這個人現在是不是「這一題進行中的猜題者」（看不到聊天、答案與表情） */
  isActiveGuesser(id) {
    return this.relay && this.phase === 'playing' && !!this.state &&
      this.state.guesserId === id && RelayRules.isActive(this.state.phase);
  }

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

  /**
   * 挑下一任房主：優先交給最早進房、還坐在玩家席的人；沒有玩家才輪到觀戰者。
   * 以前是單純挑最早進房的人，結果常常交給觀戰者 —— 觀戰者畫面上沒有「開始！」，
   * 大家就只能一直等下去。
   */
  pickHost(excludeId) {
    const all = [...this.members.values()].filter((m) => m.id !== excludeId)
      .sort((a, b) => a.joinedAt - b.joinedAt);
    const player = all.find((m) => m.role === 'player');
    return player ? player.id : (all[0] ? all[0].id : null);
  }

  /** 對局中把人加進 Rules：同一局裡離開又回來的人，把他離開前的分數與已畫次數接回去 */
  addToGame(m, now, how) {
    if (this.phase !== 'playing' || !this.state) return;
    /* 你出我畫他猜固定開局那 3 人，中途不加人（剩不到 3 人就直接結算了） */
    if (this.pickdraw) return;
    const back = this.departed.get(m.id);
    const added = this.relay
      ? RelayRules.addPlayer(this.state, Object.assign({}, back || {}, { id: m.id, name: m.name }))
      : Rules.addPlayer(this.state, {
        id: m.id, name: m.name,
        score: back ? back.score : 0, drew: back ? back.drew : 0
      });
    if (!added.ok || added.already) return;
    this.departed.delete(m.id);
    this.note(back ? 'srv.sum.backInGame' : (how === 'become' ? 'srv.sum.becamePlayerMid' : 'srv.sum.joinedMid'),
      { name: m.name }, now, 'info');
  }

  /** 送進 Rules 的名單：線上房間只有真人 */
  roster() {
    return this.humanPlayers()
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((m) => ({ id: m.id, name: m.name }));
  }

  canStart() {
    if (this.phase === 'playing') return err('srv.err.alreadyStarted');
    if (this.phase !== 'waiting') return err('srv.err.backToRoomFirst', 'phase');
    if (this.pickdraw && this.seatsTaken() !== PickdrawRules.CONST.PLAYERS) {
      return err('srv.err.pickdrawNeedThree', undefined, { n: PickdrawRules.CONST.PLAYERS });
    }
    if (this.seatsTaken() < this.minPlayers()) {
      return err('srv.err.needPlayers', undefined, { n: this.minPlayers() });
    }
    /* 房主不用另外按「準備好了」：按「開始」本身就代表房主準備好了，
       所以只等其他玩家（畫面上房主也沒有準備鈕，只有「開始！」） */
    const notReady = this.humanPlayers().filter((m) => !m.ready && m.id !== this.hostId);
    if (notReady.length) {
      return err('srv.err.notReady', undefined, { names: notReady.map((m) => m.name) });
    }
    return ok();
  }

  /* ------------------------------------------------------------ 加入 */

  join(id, opts) {
    const { name, role, token, now, lang } = opts || {};
    if (this.closed) return err('srv.err.roomClosed', 'closed');

    const existing = this.members.get(id);
    const bannedUntil = this.banned.get(id);
    if (!existing && bannedUntil) {
      if (bannedUntil > now) {
        return err('srv.err.kicked', 'kicked', { min: Math.max(1, Math.ceil((bannedUntil - now) / 60000)) });
      }
      this.banned.delete(id);
    }
    if (existing) {
      /* 重新連線：座位、角色與名字都接回來 */
      existing.connected = true;
      existing.lastSeen = now;
      if (name) existing.name = this.uniqueName(sanitizeName(name, existing.name), id);
      this.syncPlayerNames();
      this.finishRecovery(now);
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
      return err('srv.err.privateRoom', 'private');
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
      name: this.uniqueName(sanitizeName(name, '', lang), id),
      role: wantRole,
      ready: false,
      connected: true,
      joinedAt: now,
      lastSeen: now,
      lastGuessAt: 0,
      guessTurn: 0,
      guessCount: 0,
      lastChatAt: 0
    };
    this.members.set(id, member);
    if (!this.hostId) this.hostId = id;
    if (token) this.consumeInvite(token);
    if (member.role === 'player') this.addToGame(member, now, 'join');
    this.touch();
    return ok({ member, downgraded });
  }

  /** 觀戰者下場當玩家。對局進行中一樣可以下場，跟中途加入一樣排在最後一位。 */
  becomePlayer(id, now) {
    const m = this.member(id);
    if (!m) return err('srv.err.notInRoom');
    if (m.role === 'player') return ok({ already: true });
    if (this.openSeats() <= 0) return err('srv.err.seatsFullWatch', 'full');
    m.role = 'player';
    m.ready = false;
    this.addToGame(m, now, 'become');
    this.touch();
    return ok();
  }

  /** 最後一位玩家不能改成觀戰：改下去房間就沒有玩家了，會直接被關掉 */
  canBecomeSpectator(id) {
    const m = this.member(id);
    if (!m || m.role !== 'player' || this.phase === 'playing' || this.closed) return false;
    return this.humanPlayers().some((x) => x.id !== id);
  }

  becomeSpectator(id) {
    const m = this.member(id);
    if (!m) return err('srv.err.notInRoom');
    if (m.role !== 'player') return ok({ already: true });
    if (this.phase === 'playing') {
      return err('srv.err.cantSpectateNow', 'playing');
    }
    if (!this.canBecomeSpectator(id)) {
      return err('srv.err.lastPlayer', 'last');
    }
    m.role = 'spectator';
    m.ready = false;
    /* 房主改成觀戰：房主交給下一位玩家，不然觀戰的房主沒有「開始！」，大家會卡住 */
    let newHost = null;
    if (this.hostId === id) {
      this.hostId = this.pickHost(id);
      const h = this.member(this.hostId);
      newHost = h ? h.name : null;
    }
    this.touch();
    return ok({ newHost });
  }

  setReady(id, ready) {
    const m = this.member(id);
    if (!m) return err('srv.err.notInRoom');
    if (m.role !== 'player') return err('srv.err.spectatorNoReady', 'forbidden');
    m.ready = !!ready;
    this.touch();
    return ok({ ready: m.ready });
  }

  setSettings(hostId, patch) {
    if (!this.isHost(hostId)) return err('srv.err.onlyHostRules', 'forbidden');
    if (this.phase === 'playing') return err('srv.err.noRulesNow');
    const p = (patch && typeof patch === 'object') ? patch : {};
    /* 先全部驗過、再一次套用：以前是邊驗邊改，{rounds:4, drawSec:5} 會回錯誤、
       但 rounds 已經偷偷被改成 4 了。型別也只收數字（或數字字串），true、[3] 這種不收。 */
    const next = Object.assign({}, this.settings);
    if (this.relay) {
      /* 接力房只有自己的兩個欄位；一般模式的 rounds／drawSec 不適用，送來就略過 */
      if (p.guessRounds !== undefined) {
        const r = Math.round(num(p.guessRounds));
        const max = RelayRules.CONST.GUESS_ROUNDS_MAX;
        if (!isFinite(r) || r < 1 || r > max) return err('srv.err.relayGuessRoundsRange', undefined, { max });
        next.guessRounds = r;
      }
      if (p.batonSec !== undefined) {
        const b = Math.round(num(p.batonSec));
        if (RelayRules.CONST.BATON_SEC.indexOf(b) < 0) {
          return err('srv.err.relayBatonSecRange', undefined, { list: RelayRules.CONST.BATON_SEC.join('／') });
        }
        next.batonSec = b;
      }
    } else if (this.pickdraw) {
      /* 你出我畫他猜只有圈數與每題秒數；一般模式的 rounds 不適用 */
      if (p.laps !== undefined) {
        const r = Math.round(num(p.laps));
        const max = PickdrawRules.CONST.LAPS_MAX;
        if (!isFinite(r) || r < 1 || r > max) return err('srv.err.pickdrawLapsRange', undefined, { max });
        next.laps = r;
      }
      if (p.drawSec !== undefined) {
        const d = Math.round(num(p.drawSec));
        if (PickdrawRules.CONST.DRAW_SEC.indexOf(d) < 0) {
          return err('srv.err.pickdrawDrawSecRange', undefined, { list: PickdrawRules.CONST.DRAW_SEC.join('／') });
        }
        next.drawSec = d;
      }
    } else if (p.rounds !== undefined) {
      const r = Math.round(num(p.rounds));
      if (!isFinite(r) || r < 1 || r > ROOM_ROUNDS_MAX) return err('srv.err.roundsRange', undefined, { max: ROOM_ROUNDS_MAX });
      next.rounds = r;
    }
    if (!this.relay && !this.pickdraw && p.drawSec !== undefined) {
      const d = Math.round(num(p.drawSec));
      if (!isFinite(d) || d < Rules.CONST.DRAW_SEC_MIN || d > ROOM_DRAW_SEC_MAX) {
        return err('srv.err.drawSecRange', undefined, { min: Rules.CONST.DRAW_SEC_MIN, max: ROOM_DRAW_SEC_MAX });
      }
      next.drawSec = d;
    }
    if (p.diff !== undefined) {
      const v = Math.round(num(p.diff));
      if ([0, 1, 2, 3].indexOf(v) < 0) return err('srv.err.diffRange');
      next.diff = v;
    }
    if (p.wordLang !== undefined) {
      const l = str(p.wordLang);
      if (Words.LANGS.indexOf(l) < 0) return err('srv.err.langRange');
      next.wordLang = l;
    }
    if (p.category !== undefined) {
      if (typeof p.category !== 'string' || (p.category !== '' && Words.CATEGORY_KEYS.indexOf(p.category) < 0)) {
        return err('srv.err.categoryRange');
      }
      next.category = p.category;
    }
    this.settings = next;
    this.touch();
    return ok({ settings: this.settings });
  }

  /* ------------------------------------------------------------ 聊天室 */

  /**
   * 等待畫面才能聊天：這時候還沒題目、也還沒有答案，不會有人不小心把答案打出來外流。
   * 一旦開始對局，phase 就不是 'waiting'，這裡直接擋掉；用戶端也會把聊天室整塊收起來。
   */
  chat(id, text, now) {
    const m = this.member(id);
    if (!m) return err('srv.err.notInRoom');
    /* 結算畫面（finished）答案都公布完了，也可以聊天。
       接力模式例外：畫家之間對局中也能聊天，只有這一題的猜題者不能（他也看不到）。 */
    /* 你出我畫他猜：出題者在對局中只能丟表情、不能打字；其他人跟一般模式一樣對局中不聊天 */
    if (this.pickdraw && this.phase === 'playing' && this.state && this.state.pickerId === id) {
      return err('srv.err.pickerCantChat', 'forbidden');
    }
    if (this.phase === 'playing' && !this.relay) return err('srv.err.noChatNow', 'phase');
    if (this.isActiveGuesser(id)) return err('srv.err.relayGuesserNoChat', 'forbidden');
    if (now - m.lastChatAt < this.store.opts.chatCooldownMs) {
      return err('srv.err.chatTooFast', 'ratelimit');
    }
    const clean = sanitizeText(text, this.store.opts.chatMax);
    if (!clean) return err('srv.err.emptyMessage', 'empty');
    m.lastChatAt = now;
    const entry = {
      id: crypto.randomBytes(6).toString('hex'),
      from: m.name, fromId: m.id, text: clean, at: now
    };
    this.chatLog.push(entry);
    if (this.chatLog.length > this.store.opts.chatKeep) {
      this.chatLog.splice(0, this.chatLog.length - this.store.opts.chatKeep);
    }
    this.touch();
    return ok({ entry });
  }

  /* ------------------------------------------------------------ 開局 */

  start(hostId, now) {
    if (!this.isHost(hostId)) return err('srv.err.onlyHostStart', 'forbidden');
    const can = this.canStart();
    if (!can.ok) return can;

    this.seed = RNG.randomSeed(null, 6);
    if (this.relay) return this.startRelay(now);
    if (this.pickdraw) return this.startPickdraw(now);
    this.state = Rules.createState({
      seed: this.seed,
      players: this.roster(),
      rounds: this.settings.rounds,
      drawSec: this.settings.drawSec,
      diff: this.settings.diff,
      category: this.settings.category,
      lang: this.settings.wordLang
    });
    const s = Rules.start(this.state, now);
    if (!s.ok) return s;
    this.phase = 'playing';
    this.doneTurn = -1;
    this.summary = [];
    this.departed.clear();
    this.note('srv.sum.start', { seed: this.seed, rounds: this.settings.rounds, secs: this.settings.drawSec }, now);
    this.noteTurnStart(now);
    this.touch();
    return ok({ state: this.state });
  }

  /* ---------------------------------------------------------- 遊戲行動 */

  /** 只有「坐在玩家席、而且真的在這一局裡」的人可以送遊戲行動 */
  requirePlayer(id) {
    const m = this.member(id);
    if (!m) return err('srv.err.notInRoom');
    if (m.role !== 'player') return err('srv.err.spectatorNoPlay', 'forbidden');
    if (this.phase !== 'playing' || !this.state) return err('srv.err.noGame', 'phase');
    if (!this.engine.player(this.state, id)) return err('srv.err.notInRoster', 'forbidden');
    return ok({ member: m });
  }

  pickWord(id, wordId, now) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    if (this.relay) return err('srv.err.relayUseVote', 'forbidden');
    if (this.pickdraw) {
      const pr = PickdrawRules.pick(this.state, id, str(wordId), now);
      if (!pr.ok) return pr;
      this.applyPickdrawEvent({ type: 'picked', wordId: pr.wordId, auto: false }, now);
      return pr;
    }
    const res = Rules.pickWord(this.state, id, wordId, now);
    if (!res.ok) return res;
    this.noteWordPicked(now, false);
    this.touch();
    return res;
  }

  stroke(id, raw, now) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    const res = this.engine.addStroke(this.state, id, raw);
    if (!res.ok) return res;
    this.touch();
    return res;
  }

  undo(id) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    const res = this.engine.undoStroke(this.state, id);
    if (res.ok) this.touch();
    return res;
  }

  clearBoard(id) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    const res = this.engine.clearBoard(this.state, id);
    if (res.ok) this.touch();
    return res;
  }

  /** 畫家給出下一張提示（字數 → 種類 → 一個字）；接力模式是猜題者自己按 */
  giveHint(id, now) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    if (this.relay) {
      const rh = RelayRules.useHint(this.state, id, now);
      if (!rh.ok) return rh;
      this.note('srv.sum.relayHint', { name: gate.member.name, step: rh.step }, now, 'hint');
      this.system('srv.feed.relayHint', { name: gate.member.name, step: rh.step }, now, 'hint');
      this.touch();
      return rh;
    }
    if (this.pickdraw) {
      const ph = PickdrawRules.giveHint(this.state, id, now);
      if (!ph.ok) return ph;
      this.note('srv.sum.pickdrawHint', { name: gate.member.name, step: ph.step }, now, 'hint');
      this.system('srv.feed.pickdrawHint', { name: gate.member.name, step: ph.step }, now, 'hint');
      this.touch();
      return ph;
    }
    const res = Rules.giveHint(this.state, id, now);
    if (!res.ok) return res;
    this.noteHint(res, now);
    this.touch();
    return res;
  }

  /** 公布答案時對這一題的作品按表情（再按一次收回） */
  react(id, kind) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    const res = this.engine.react(this.state, id, kind);
    if (res.ok) this.touch();
    return res;
  }

  /** 結算後的本局畫廊（含筆畫），只在結算畫面提供 */
  gallery() {
    if (!this.state || this.phase !== 'finished') return err('srv.err.galleryNotReady', 'phase');
    return ok({ items: this.engine.galleryOf(this.state), endedAt: this.state.endedAt || 0, mode: this.mode });
  }

  /** 畫家提前結束這一題 */
  skipTurn(id, now) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    if (this.relay || this.pickdraw) return err('srv.err.relayNoSkip', 'forbidden');
    const res = Rules.giveUp(this.state, id, now);
    if (!res.ok) return res;
    this.noteTurnEnd(res.entry, now);
    this.touch();
    return res;
  }

  /* ------------------------------------------------------------ 猜題 */

  /**
   * 送出一次猜測。對局進行中唯一能打字的地方就是這裡（猜答案）：
   * 聊天室（見上面 chat()）只在等待畫面開放，開始對局後就關掉了，
   * 所以不會有「聊天打字時不小心把答案說出來」的問題。
   *
   * @returns {{ok, kind:'hit'|'close'|'miss', entry?, points?, order?}}
   *   hit   猜中：猜的內容不外流，只公布「某某猜對了」
   *   close 猜中答案一半以上的字：只回給猜的人，不進紀錄
   *   miss  沒猜中：寫進猜題紀錄讓大家看到有人猜過什麼
   */
  guess(id, text, now) {
    const m = this.member(id);
    if (!m) return err('srv.err.notInRoom');
    if (this.phase !== 'playing' || !this.state) return err('srv.err.noGame', 'phase');
    if (m.role !== 'player') return err('srv.err.spectatorNoGuess', 'forbidden');
    if (this.relay) return this.relayGuess(m, text, now);
    if (this.pickdraw) return this.pickdrawGuess(m, text, now);
    if (!Rules.player(this.state, id)) return err('srv.err.notInRoster', 'forbidden');
    if (this.state.phase !== 'drawing') return err('srv.err.notGuessTime', 'phase');
    if (this.state.drawerId === id) return err('srv.err.drawerCantGuess', 'forbidden');
    if (Rules.hasGuessed(this.state, id)) return err('srv.err.alreadyGuessed', 'done');

    if (now - m.lastGuessAt < this.store.opts.guessCooldownMs) {
      return err('srv.err.guessTooFast', 'ratelimit');
    }
    if (m.guessTurn !== this.state.turnNo) { m.guessTurn = this.state.turnNo; m.guessCount = 0; }
    if (m.guessCount >= this.store.opts.guessPerTurn) {
      return err('srv.err.guessTooMany', 'ratelimit');
    }
    const clean = sanitizeText(text, this.store.opts.guessMax);
    if (!clean) return err('srv.err.emptyGuess', 'empty');
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
   *
   * 同一題可以一直按：補了幾筆想再叫大家看一次是很自然的事，
   * 所以這裡不擋重複，每按一次就再廣播一次。
   */
  markDone(id, now) {
    if (this.phase !== 'playing' || !this.state) return err('srv.err.noGame', 'phase');
    /* 接力每棒都畫滿秒數，沒有「畫完了」；你出我畫他猜跟一般模式一樣可以通知大家 */
    if (this.relay) return err('srv.err.relayNoSkip', 'forbidden');
    const m = this.member(id);
    if (!m) return err('srv.err.notInRoom');
    if (this.state.drawerId !== id) return err('srv.err.onlyDrawerDone', 'forbidden');
    if (this.state.phase !== 'drawing') return err('srv.err.notDrawTime', 'phase');
    this.doneTurn = this.turnKey();
    this.note('srv.sum.done', { name: m.name }, now, 'info');
    this.system('srv.feed.done', { name: m.name }, now);
    this.touch();
    return ok({ name: m.name });
  }

  /* ------------------------------------------------------------ 接力模式 */

  startRelay(now) {
    this.state = RelayRules.createState({
      seed: this.seed,
      players: this.roster(),
      guessRounds: this.settings.guessRounds,
      batonSec: this.settings.batonSec,
      diff: this.settings.diff,
      category: this.settings.category,
      lang: this.settings.wordLang
    });
    const s = RelayRules.start(this.state, now);
    if (!s.ok) { this.state = null; return s; }
    this.phase = 'playing';
    this.doneTurn = -1;
    this.typingUntil = 0;
    this.summary = [];
    this.departed.clear();
    this.note('srv.sum.relayStart', { rounds: this.settings.guessRounds, secs: this.settings.batonSec }, now);
    this.noteRelayQuestion(now);
    this.touch();
    return ok({ state: this.state });
  }

  /** 畫家投票選題（只回報票數，不公開誰投哪題） */
  vote(id, wordId, now) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    if (!this.relay) return err('srv.err.relayOnly', 'forbidden');
    const res = RelayRules.vote(this.state, id, str(wordId), now);
    if (!res.ok) return res;
    if (res.settled) this.applyRelayEvent({ type: 'votesettled' }, now);
    this.touch();
    return res;
  }

  /** 猜題者放棄：公布答案，這題沒人得分 */
  relayGiveUp(id, now) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    if (this.pickdraw) {
      const pg = PickdrawRules.giveUp(this.state, id, now);
      if (!pg.ok) return pg;
      this.notePickdrawEnd(pg.entry, now);
      this.touch();
      return pg;
    }
    if (!this.relay) return err('srv.err.relayOnly', 'forbidden');
    const res = RelayRules.giveUp(this.state, id, now);
    if (!res.ok) return res;
    this.typingUntil = 0;
    this.noteRelayEnd(res.entry, now);
    this.touch();
    return res;
  }

  relayGuess(m, text, now) {
    const s = this.state;
    if (s.guesserId !== m.id) return err('srv.err.relayNotGuesser', 'forbidden');
    if (s.phase !== 'drawing' && s.phase !== 'handoff') return err('srv.err.notGuessTime', 'phase');
    if (now - m.lastGuessAt < this.store.opts.guessCooldownMs) return err('srv.err.guessTooFast', 'ratelimit');
    const clean = sanitizeText(text, this.store.opts.guessMax);
    if (!clean) return err('srv.err.emptyGuess', 'empty');
    m.lastGuessAt = now;
    /* 接力的猜題次數不限，所以不套 guessPerTurn；冷卻時間照樣擋洗版 */
    const g = RelayRules.guess(s, m.id, clean, now);
    if (!g.ok) return g;
    this.typingUntil = 0;
    if (g.verdict === 'hit') {
      this.noteRelayEnd(g.entry, now);
      this.touch();
      return ok({ kind: 'hit', points: g.points, name: m.name, relay: true });
    }
    this.touch();
    if (g.verdict === 'close') return ok({ kind: 'close', text: clean });
    return ok({ kind: 'miss', entry: this.pushFeed(this.guessEntry(m.name, m.id, 'player', clean, now)) });
  }

  /** 猜題者打字中：亮「輸入中…」給畫家看。回傳狀態有沒有變（有變才需要廣播） */
  typing(id, on, now) {
    if (!this.relay || !this.state || this.phase !== 'playing') return false;
    if (this.state.guesserId !== id) return false;
    if (this.state.phase !== 'drawing' && this.state.phase !== 'handoff') return false;
    const was = this.typingUntil > now;
    this.typingUntil = on ? now + RELAY_TYPING_MS : 0;
    return was !== (this.typingUntil > now);
  }

  /** 沒在畫的畫家對當下作畫者丟表情（加油／笑死／崩潰），猜題者看不到 */
  cheer(id, kind, now) {
    const gate = this.requirePlayer(id);
    if (!gate.ok) return gate;
    if (this.pickdraw) {
      const pm = gate.member;
      if (now - (pm.lastCheerAt || 0) < PICKDRAW_CHEER_COOLDOWN_MS) return err('srv.err.tooFast', 'ratelimit');
      const pc = PickdrawRules.cheer(this.state, id, str(kind));
      if (!pc.ok) return pc;
      pm.lastCheerAt = now;
      /* 出題者的表情不含答案，三個人與觀戰者都看得到 */
      return ok({ kind: pc.kind, from: id, fromName: pm.name, to: pc.to, guesserId: null });
    }
    if (!this.relay) return err('srv.err.relayOnly', 'forbidden');
    const m = gate.member;
    if (now - (m.lastCheerAt || 0) < RELAY_CHEER_COOLDOWN_MS) return err('srv.err.tooFast', 'ratelimit');
    const res = RelayRules.cheer(this.state, id, str(kind));
    if (!res.ok) return res;
    m.lastCheerAt = now;
    return ok({ kind: res.kind, from: id, fromName: m.name, to: res.to, guesserId: this.state.guesserId });
  }

  /* ------------------------------------------------------------ 你出我畫他猜（Beta） */

  startPickdraw(now) {
    this.state = PickdrawRules.createState({
      seed: this.seed,
      players: this.roster(),
      laps: this.settings.laps,
      drawSec: this.settings.drawSec,
      diff: this.settings.diff,
      category: this.settings.category,
      lang: this.settings.wordLang
    });
    const s = PickdrawRules.start(this.state, now);
    if (!s.ok) { this.state = null; return s; }
    this.phase = 'playing';
    this.doneTurn = -1;
    this.summary = [];
    this.departed.clear();
    this.note('srv.sum.pickdrawStart', { laps: this.settings.laps, secs: this.settings.drawSec }, now);
    this.notePickdrawQuestion(now);
    this.touch();
    return ok({ state: this.state });
  }

  /** 猜題者猜：次數不限（冷卻照樣擋洗版）；猜錯大家都看得到，「很接近」只回給猜題者 */
  pickdrawGuess(m, text, now) {
    const s = this.state;
    if (s.guesserId !== m.id) return err('srv.err.pickdrawNotGuesser', 'forbidden');
    if (s.phase !== 'drawing') return err('srv.err.notGuessTime', 'phase');
    if (now - m.lastGuessAt < this.store.opts.guessCooldownMs) return err('srv.err.guessTooFast', 'ratelimit');
    const clean = sanitizeText(text, this.store.opts.guessMax);
    if (!clean) return err('srv.err.emptyGuess', 'empty');
    m.lastGuessAt = now;
    const g = PickdrawRules.guess(s, m.id, clean, now);
    if (!g.ok) return g;
    if (g.verdict === 'hit') {
      this.notePickdrawEnd(g.entry, now);
      this.touch();
      return ok({ kind: 'hit', points: g.points, name: m.name, pickdraw: true });
    }
    this.touch();
    if (g.verdict === 'close') return ok({ kind: 'close', text: clean });
    return ok({ kind: 'miss', entry: this.pushFeed(this.guessEntry(m.name, m.id, 'player', clean, now)) });
  }

  notePickdrawQuestion(now) {
    const s = this.state;
    if (!s || !s.pickerId) return;
    const params = {
      no: s.questionNo, total: PickdrawRules.totalQuestions(s),
      picker: PickdrawRules.player(s, s.pickerId) ? PickdrawRules.player(s, s.pickerId).name : '—',
      drawer: PickdrawRules.player(s, s.drawerId) ? PickdrawRules.player(s, s.drawerId).name : '—',
      guesser: PickdrawRules.player(s, s.guesserId) ? PickdrawRules.player(s, s.guesserId).name : '—'
    };
    this.note('srv.sum.pickdrawQuestion', params, now, 'turn');
    this.system('srv.feed.pickdrawQuestion', params, now);
  }

  /** 公布答案的紀錄：答案在這之後才會寫進摘要與猜題紀錄（之前猜題者也看得到） */
  notePickdrawEnd(entry, now) {
    if (!entry) return;
    if (!entry.word) {
      this.note('srv.sum.noWord', {}, now, 'reveal');
      this.system('srv.feed.noWord', {}, now);
      return;
    }
    const params = {
      word: entry.word, picker: entry.pickerName, drawer: entry.drawerName, name: entry.guesserName,
      a: entry.points.picker, b: entry.points.drawer, c: entry.points.guesser
    };
    const key = entry.hit ? 'pickdrawHit'
      : ({ giveup: 'pickdrawGiveUp', drawerleft: 'pickdrawDrawerLeft', guesserleft: 'pickdrawGuesserLeft' }[entry.reason] || 'pickdrawTimeUp');
    this.note('srv.sum.' + key, params, now, entry.hit ? 'correct' : 'reveal');
    this.system('srv.feed.' + key, params, now, entry.hit ? 'correct' : undefined);
  }

  applyPickdrawEvent(ev, now) {
    if (ev.type === 'picked') {
      const s = this.state;
      const p = PickdrawRules.player(s, s.pickerId);
      this.system(ev.auto ? 'srv.feed.pickdrawAutoPicked' : 'srv.feed.pickdrawPicked', { name: p ? p.name : '—' }, now);
    } else if (ev.type === 'questionend') this.notePickdrawEnd(ev.entry, now);
    else if (ev.type === 'questionstart') this.notePickdrawQuestion(now);
    else if (ev.type === 'gameover') this.note('srv.sum.over', {}, now, 'over');
    this.touch();
  }

  noteRelayQuestion(now) {
    const s = this.state;
    if (!s || !s.guesserId) return;
    const g = RelayRules.player(s, s.guesserId);
    const params = { no: s.questionNo, total: RelayRules.totalQuestions(s), name: g ? g.name : '—' };
    this.note('srv.sum.relayQuestion', params, now, 'turn');
    this.system('srv.feed.relayQuestion', params, now);
  }

  /** 公布答案的紀錄：答案在這之後才會寫進摘要（之前猜題者也看得到摘要） */
  noteRelayEnd(entry, now) {
    if (!entry) return;
    if (!entry.word) {
      this.note('srv.sum.noWord', {}, now, 'reveal');
      this.system('srv.feed.noWord', {}, now);
      return;
    }
    if (entry.hit) {
      const params = { name: entry.guesserName, drawer: entry.drawerName || '—', word: entry.word, points: entry.points };
      this.note('srv.sum.relayHit', params, now, 'correct');
      this.system('srv.feed.relayHit', params, now, 'correct');
      return;
    }
    const key = entry.reason === 'giveup' ? 'relayGiveUp' : (entry.reason === 'guesserleft' ? 'relayGuesserLeft' : 'relayTimeUp');
    this.note('srv.sum.' + key, { word: entry.word, name: entry.guesserName }, now, 'reveal');
    this.system('srv.feed.' + key, { word: entry.word, name: entry.guesserName }, now);
  }

  applyRelayEvent(ev, now) {
    if (ev.type === 'questionend') { this.typingUntil = 0; this.noteRelayEnd(ev.entry, now); }
    else if (ev.type === 'questionstart') this.noteRelayQuestion(now);
    else if (ev.type === 'batonskip') {
      const p = RelayRules.player(this.state, ev.drawerId);
      this.system('srv.feed.relaySkip', { name: p ? p.name : '—' }, now);
    } else if (ev.type === 'gameover') this.note('srv.sum.over', {}, now, 'over');
    this.touch();
  }

  guessEntry(from, fromId, role, text, now) {
    return {
      id: crypto.randomBytes(6).toString('hex'),
      kind: 'guess', from, fromId, role, text, at: now
    };
  }

  /** 系統訊息（有人加入、猜中、換題…），跟猜題紀錄共用同一條時間軸。
   *  只存字典代碼與參數（srv.feed.＊），由每個人的畫面依自己的語言組句。 */
  system(key, params, now, kind) {
    return this.pushFeed({
      id: crypto.randomBytes(6).toString('hex'),
      kind: kind || 'system',
      from: '',
      fromId: null,
      role: 'system',
      key,
      params: params || {},
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
  note(key, params, now, kind) {
    this.summary.push({ key, params: params || {}, at: now, kind: kind || 'info' });
    if (this.summary.length > this.store.opts.summaryKeep) {
      this.summary.splice(0, this.summary.length - this.store.opts.summaryKeep);
    }
  }

  noteTurnStart(now) {
    const s = this.state;
    if (!s) return;
    const d = Rules.player(s, s.drawerId);
    this.note('srv.sum.turn', { no: s.turnNo, total: s.totalTurns, name: d ? d.name : '—' }, now, 'turn');
  }

  noteWordPicked(now, auto) {
    const s = this.state;
    if (!s || !s.wordId) return;
    const d = Rules.player(s, s.drawerId);
    /* 種類與字數現在是畫家手上的提示，選題時還不能寫進摘要 */
    this.note(auto ? 'srv.sum.autoPicked' : 'srv.sum.picked', { name: d ? d.name : '—' }, now, 'pick');
  }

  noteHint(res, now) {
    /* 種類只送代碼（cat），由畫面端翻成各自語言的分類名稱 */
    const w = Words.byId(this.state.wordId, this.state.lang);
    const key = res.step === 1 ? 'srv.sum.hintLen' : (res.step === 2 ? 'srv.sum.hintCat' : 'srv.sum.hintMask');
    const params = res.step === 1 ? { n: Words.glyphCount(w) }
      : (res.step === 2 ? { cat: w.cat } : { mask: res.mask });
    this.note(key, params, now, 'hint');
    this.system(key, params, now, 'hint');
  }

  noteCorrect(who, g, now) {
    const params = { name: who.name, order: g.order, points: g.points };
    this.note('srv.sum.correct', params, now, 'correct');
    this.system('srv.feed.correct', params, now, 'correct');
  }

  noteTurnEnd(entry, now) {
    if (!entry) return;
    /* 畫家還在選題就離開／斷線：這一題根本沒有題目，不要寫出「答案是「null」」 */
    if (!entry.word) {
      this.note('srv.sum.noWord', {}, now, 'reveal');
      this.system('srv.feed.noWord', {}, now);
      return;
    }
    this.note('srv.sum.reveal', {
      word: entry.word, correct: entry.correct, total: entry.total,
      name: entry.drawerName, points: entry.drawerPoints
    }, now, 'reveal');
    this.system('srv.feed.reveal', { word: entry.word }, now);
  }

  /* ------------------------------------------------------- 邀請連結 */

  createInvite(id, { role, ttlMs, maxUses, now }) {
    const m = this.member(id);
    if (!m) return err('srv.err.notInRoom');
    if (m.role !== 'player' && !this.isHost(id)) {
      return err('srv.err.inviteForbidden', 'forbidden');
    }
    const wanted = (role === 'player' || role === 'spectator' || role === 'any') ? role : 'any';
    const ttl = Math.max(60 * 1000, Math.min(24 * 60 * 60 * 1000, num(ttlMs) || this.store.opts.inviteTtlMs));
    const uses = Math.max(1, Math.min(100, Math.round(num(maxUses)) || this.store.opts.inviteMaxUses));
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
    if (!inv) return err('srv.err.inviteGone', 'gone');
    if (inv.createdBy !== id && !this.isHost(id)) return err('srv.err.revokeForbidden', 'forbidden');
    inv.revoked = true;
    this.touch();
    return ok({ token });
  }

  /** 每次加入與重新連線都重新驗證，不是只在產生的當下檢查一次 */
  checkInvite(token, now) {
    if (this.closed) return err('srv.err.inviteRoomClosed', 'closed');
    const inv = this.invites.get(str(token));
    if (!inv) return err('srv.err.inviteInvalid', 'invite_invalid');
    if (inv.revoked) return err('srv.err.inviteRevoked', 'invite_revoked');
    if (inv.expiresAt <= now) return err('srv.err.inviteExpired', 'invite_expired');
    if (inv.uses >= inv.maxUses) return err('srv.err.inviteUsed', 'invite_used');
    if (this.phase === 'playing') {
      return ok({ invite: inv, note: 'srv.note.invitePlaying' });
    }
    if (this.openSeats() <= 0 && inv.role !== 'spectator') {
      return ok({ invite: inv, note: 'srv.note.inviteFull' });
    }
    return ok({ invite: inv });
  }

  consumeInvite(token) {
    const inv = this.invites.get(str(token));
    if (inv) inv.uses += 1;
  }

  /** 房間關閉時把所有邀請一併作廢 */
  revokeAllInvites() {
    for (const inv of this.invites.values()) inv.revoked = true;
  }

  /* ------------------------------------------------------- 離開／回收 */

  disconnect(id, now) {
    const m = this.member(id);
    if (!m) return err('srv.err.noSuchMember');
    m.connected = false;
    m.lastSeen = now;
    this.touch();
    return ok();
  }

  leave(id, now) {
    const m = this.member(id);
    if (!m) return err('srv.err.noSuchMember');
    this.members.delete(id);

    if (this.relay && this.state && this.phase === 'playing' && RelayRules.player(this.state, id)) {
      const rp = RelayRules.player(this.state, id);
      this.departed.set(id, {
        score: rp.score, guessPts: rp.guessPts, drawPts: rp.drawPts, keys: rp.keys, asGuesser: rp.asGuesser
      });
      const rr = RelayRules.removePlayer(this.state, id, now);
      if (rr.ok && rr.questionEnded) this.applyRelayEvent({ type: 'questionend', entry: rr.questionEnded }, now);
      if (this.state.over && this.phase === 'playing') this.finishGame(now);
    } else if (this.pickdraw && this.state && this.phase === 'playing' && PickdrawRules.player(this.state, id)) {
      /* 剩不到 3 人就立即結算 */
      this.system('srv.feed.pickdrawPlayerLeft', { name: m.name }, now);
      PickdrawRules.removePlayer(this.state, id, now);
      if (this.state.over && this.phase === 'playing') this.finishGame(now);
    } else if (this.state && this.phase === 'playing' && Rules.player(this.state, id)) {
      const p = Rules.player(this.state, id);
      this.departed.set(id, { score: p.score, drew: p.drew });
      const r = Rules.removePlayer(this.state, id, now);
      if (r.ok && r.turnEnded) this.noteTurnEnd(r.turnEnded, now);
      /* 少一個猜題者可能剛好湊齊「全部猜中」而收掉這一題：這些事件也要寫進紀錄，
         不然答案就沒公布在摘要裡 */
      if (r.ok && r.events) for (const ev of r.events) this.applyEvent(ev, now);
      if (this.state.over && this.phase === 'playing') this.finishGame(now);
    }
    if (this.hostId === id) this.hostId = this.pickHost(id);
    /* 投票中有人離開：被投票的人自己走了就不用投了；投票的人走了，他那一票也跟著拿掉
       （門檻要不要重算，交給每秒的 kickTick） */
    if (this.kickVote) {
      if (this.kickVote.targetId === id) this.kickVote = null;
      else {
        this.kickVote.yes.delete(id);
        this.kickVote.no.delete(id);
      }
    }
    this.touch();
    return ok({ name: m.name, role: m.role });
  }

  /* ------------------------------------------------------- 投票踢人 */

  /** 目前這場投票的票數與門檻：投票的人是「被投票者以外的玩家」，過半數才成立 */
  kickTally() {
    const v = this.kickVote;
    if (!v) return null;
    const voters = this.humanPlayers().filter((m) => m.id !== v.targetId);
    return {
      yes: voters.filter((m) => v.yes.has(m.id)).length,
      no: voters.filter((m) => v.no.has(m.id)).length,
      need: Math.floor(voters.length / 2) + 1,
      voters: voters.length
    };
  }

  /** 票數夠了就把人請出去；回傳 { kicked, name } 或空物件 */
  settleKick(now) {
    const v = this.kickVote;
    const tally = this.kickTally();
    if (!v || !tally || tally.yes < tally.need) return {};
    this.kickVote = null;
    this.banned.set(v.targetId, now + KICK_BAN_MS);
    this.leave(v.targetId, now);
    this.system('srv.feed.kicked', { name: v.targetName }, now);
    this.touch();
    return { kicked: v.targetId, name: v.targetName };
  }

  startKick(id, targetId, now) {
    if (this.closed) return err('srv.err.roomEnded', 'closed');
    const m = this.member(id);
    if (!m || m.role !== 'player') return err('srv.err.kickPlayersOnly', 'forbidden');
    const t = this.member(targetId);
    if (!t || t.role !== 'player' || t.id === id) return err('srv.err.kickBadTarget', 'invalid');
    if (this.humanPlayers().length < KICK_MIN_PLAYERS) return err('srv.err.kickNeedThree', 'invalid');
    if (this.kickVote) return err('srv.err.kickBusy', 'busy');
    if (m.lastKickAt && now - m.lastKickAt < KICK_COOLDOWN_MS) return err('srv.err.kickCooldown', 'ratelimit');
    m.lastKickAt = now;
    this.kickVote = {
      targetId: t.id, targetName: t.name, byId: m.id, byName: m.name,
      yes: new Set([m.id]), no: new Set(), endsAt: now + KICK_VOTE_MS
    };
    this.system('srv.feed.kickStart', { by: m.name, name: t.name }, now);
    this.touch();
    return ok(this.settleKick(now));
  }

  voteKick(id, now, agree = true) {
    const v = this.kickVote;
    if (!v) return err('srv.err.kickNoVote', 'gone');
    const m = this.member(id);
    if (!m || m.role !== 'player' || m.id === v.targetId) return err('srv.err.kickPlayersOnly', 'forbidden');
    if (typeof agree !== 'boolean') return err('srv.err.kickChoice', 'invalid');
    if (v.yes.has(m.id) || v.no.has(m.id)) return ok({});
    (agree ? v.yes : v.no).add(m.id);
    this.touch();
    return ok(this.settleKick(now));
  }

  /** 每秒檢查一次：對象不在了就取消、有人離開後票數剛好過半就成立、時間到就作廢 */
  kickTick(now) {
    const v = this.kickVote;
    if (!v) return {};
    const t = this.member(v.targetId);
    if (!t || t.role !== 'player') { this.kickVote = null; this.touch(); return { changed: true }; }
    const r = this.settleKick(now);
    if (r.kicked) return { changed: true, kicked: r.kicked };
    if (now >= v.endsAt) {
      this.kickVote = null;
      this.system('srv.feed.kickFailed', { name: v.targetName }, now);
      this.touch();
      return { changed: true };
    }
    return {};
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

  /**
   * 等待或結算畫面的房主斷線超過 hostAwayMs：先把房主交給還在線上的玩家，
   * 其他人不用對著按不到的「開始」乾等到座位保留時間結束。對局中不換（房主沒有對局內的專屬操作）。
   * 原房主的座位照樣保留，回來還是玩家。
   */
  handOffHost(now) {
    if (this.closed || this.phase === 'playing') return null;
    const host = this.member(this.hostId);
    if (!host || host.connected || now - host.lastSeen < this.store.opts.hostAwayMs) return null;
    const next = [...this.members.values()]
      .filter((m) => m.id !== host.id && m.connected && m.role === 'player')
      .sort((a, b) => a.joinedAt - b.joinedAt)[0];
    if (!next) return null;
    this.hostId = next.id;
    this.system('srv.feed.hostMoved', { from: host.name, to: next.name }, now);
    this.touch();
    return next;
  }

  /** 實體玩家歸零 → 立刻關房。觀戰者不能讓房間活下去。 */
  shouldClose() {
    return this.humanPlayers().length === 0;
  }

  close(reason, now) {
    if (this.closed) return;
    this.closed = true;
    this.closedAt = now;
    this.closedReason = reason || 'srv.closed.default';
    this.phase = 'finished';
    this.revokeAllInvites();
    this.state = null;                 // 停掉對局計時器的依據
    this.note(this.closedReason, {}, now, 'closed');
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

    if (this.relay) {
      const rt = RelayRules.tick(this.state, now, { away: this.awayIds(now) });
      for (const ev of rt.events) this.applyRelayEvent(ev, now);
      out.events.push(...rt.events);
      if (this.state.over) this.finishGame(now);
      return out;
    }

    if (this.pickdraw) {
      const pt = PickdrawRules.tick(this.state, now, { away: this.awayIds(now, PICKDRAW_AWAY_MS) });
      for (const ev of pt.events) this.applyPickdrawEvent(ev, now);
      out.events.push(...pt.events);
      if (this.state.over) this.finishGame(now);
      return out;
    }

    const before = this.state.turnNo;

    /* 畫家斷線超過 DRAWER_AWAY_MS 還沒回來：先跳過這一題，不讓大家對著空白畫布乾等。
       跳過會用掉當次作畫機會，避免再次排到同一位離線玩家而增加總題數。
       他的座位照樣保留 graceMs，回來還能繼續玩。 */
    const away = this.drawerAwayUntil();
    if (away && now >= away) {
      const d = this.member(this.state.drawerId);
      const e = Rules.endTurn(this.state, now, 'drawerleft');
      if (e.ok) {
        this.system('srv.feed.drawerGone', { name: d ? d.name : '' }, now);
        this.noteTurnEnd(e.entry, now);
        out.events.push({ type: 'turnend', entry: e.entry });
      }
    }

    const t = Rules.tick(this.state, now);
    for (const ev of t.events) this.applyEvent(ev, now);
    out.events.push(...t.events);

    if (this.state.over) { this.finishGame(now); return out; }
    if (this.state && this.state.turnNo !== before) this.touch();
    return out;
  }

  /** 畫家斷線中：回傳「等到幾點就跳過」，沒斷線回傳 0 */
  /** 這一題的題號（一般模式是 turnNo，接力與你出我畫他猜是 questionNo） */
  turnKey() {
    const s = this.state;
    if (!s) return -1;
    return s.turnNo !== undefined ? s.turnNo : s.questionNo;
  }

  /**
   * 你出我畫他猜：倒數或作畫中，畫家或猜題者斷線 → 等到幾點就公布答案。
   * @returns {{until:number, role:'drawer'|'guesser'|null}}
   */
  pickdrawAway() {
    const s = this.state;
    const none = { until: 0, role: null };
    if (!this.pickdraw || !s || this.phase !== 'playing') return none;
    if (s.phase !== 'countdown' && s.phase !== 'drawing') return none;
    for (const role of ['drawer', 'guesser']) {
      const m = this.member(s[role + 'Id']);
      if (m && !m.connected) return { until: m.lastSeen + PICKDRAW_AWAY_MS, role };
    }
    return none;
  }

  drawerAwayUntil() {
    const s = this.state;
    if (this.pickdraw) return this.pickdrawAway().until;
    if (!s || this.phase !== 'playing' || this.relay) return 0;
    if (s.phase !== 'picking' && s.phase !== 'drawing') return 0;
    const d = this.member(s.drawerId);
    if (!d || d.connected) return 0;
    return d.lastSeen + DRAWER_AWAY_MS;
  }

  applyEvent(ev, now) {
    if (ev.type === 'autopick') this.noteWordPicked(now, true);
    else if (ev.type === 'turnend') this.noteTurnEnd(ev.entry, now);
    else if (ev.type === 'turnstart') this.noteTurnStart(now);
    else if (ev.type === 'gameover') this.note('srv.sum.over', {}, now, 'over');
    this.touch();
  }

  finishGame(now) {
    if (this.phase === 'finished') return;
    this.phase = 'finished';
    for (const m of this.members.values()) m.ready = false;
    const names = (this.state ? this.state.winners : []).map((id) => {
      const p = this.engine.player(this.state, id);
      return p ? p.name : '—';
    });
    if (names.length > 1) this.system('srv.feed.tie', { names }, now);
    else this.system('srv.feed.win', { name: names[0] || '—' }, now);
    this.note('srv.sum.result', { names: names.length ? names : ['—'] }, now, 'result');
    this.touch();
  }

  /**
   * 結算完回到等待畫面：房主按「回房間」，大家回到房間設定那張卡
   * （可以聊天、改規則、重新準備），再照原本流程按開始。
   * 以前是「全員投票再玩一局」直接開新局：沒辦法改規則，有一個人掛機就全部卡住。
   */
  returnToRoom(id, now) {
    if (this.closed) return err('srv.err.roomEnded', 'closed');
    if (this.phase !== 'finished') return err('srv.err.gameNotOver', 'phase');
    if (!this.isHost(id)) return err('srv.err.onlyHostReturn', 'forbidden');
    this.phase = 'waiting';
    this.state = null;
    this.doneTurn = -1;
    this.departed.clear();
    for (const m of this.members.values()) m.ready = false;
    this.touch();
    return ok();
  }

  /** 這一局打完能不能直接再開一局：房主、已結算、玩家席至少兩人 */
  canRematch(id) {
    return !this.closed && this.phase === 'finished' && this.isHost(id) && this.seatsTaken() >= this.minPlayers();
  }

  /**
   * 結算後房主直接開下一局：同一批人、同樣規則，不用先回等待畫面再各自按準備。
   * 想改規則或等人的話還是走「回房間」。
   */
  rematch(id, now) {
    if (this.closed) return err('srv.err.roomEnded', 'closed');
    if (this.phase !== 'finished') return err('srv.err.gameNotOver', 'phase');
    if (!this.isHost(id)) return err('srv.err.onlyHostStart', 'forbidden');
    if (this.seatsTaken() < this.minPlayers()) return err('srv.err.needPlayers', undefined, { n: this.minPlayers() });
    const back = this.returnToRoom(id, now);
    if (!back.ok) return back;
    /* 大家剛一起打完一局，視同都準備好了 */
    for (const m of this.humanPlayers()) m.ready = true;
    return this.start(id, now);
  }

  syncPlayerNames() {
    if (!this.state) return;
    for (const p of this.state.players) {
      const m = this.members.get(p.id);
      if (m) p.name = m.name;
    }
  }

  touch() {
    this.version += 1;
    this.store.markCheckpoint(this);
  }

  finishRecovery(now) {
    if (!this.recovery) return false;
    if (now < this.recovery.until && this.humanPlayers().some(member => !member.connected)) return false;
    const delay = now - this.recovery.savedAt;
    if (this.state && this.phase === 'playing') {
      for (const key of ['deadline', 'startedAt', 'drawStartedAt', 'questionStartedAt']) {
        if (this.state[key]) this.state[key] += delay;
      }
    }
    if (this.kickVote) this.kickVote.endsAt += delay;
    for (const member of this.members.values()) {
      if (!member.connected) member.lastSeen = now - this.store.opts.graceMs - 1;
    }
    this.recovery = null;
    this.touch();
    return true;
  }

  /* --------------------------------------------------------- 對外投影 */

  brief() {
    if (this.pickdraw) {
      return {
        code: this.code,
        name: this.name,
        mode: 'pickdraw',
        private: this.private,
        phase: this.phase,
        closed: this.closed,
        players: this.seatsTaken(),
        maxPlayers: this.settings.maxPlayers,
        humans: this.humanPlayers().length,
        spectators: this.spectators().length,
        host: this.hostId && this.members.get(this.hostId) ? this.members.get(this.hostId).name : '',
        laps: this.settings.laps,
        drawSec: this.settings.drawSec,
        diff: this.settings.diff,
        category: this.settings.category,
        wordLang: this.settings.wordLang,
        turnNo: this.state ? this.state.questionNo : 0,
        totalTurns: this.state ? PickdrawRules.totalQuestions(this.state) : this.settings.laps * PickdrawRules.CONST.PLAYERS,
        createdAt: this.createdAt
      };
    }
    if (this.relay) {
      return {
        code: this.code,
        name: this.name,
        mode: 'relay',
        private: this.private,
        phase: this.phase,
        closed: this.closed,
        players: this.seatsTaken(),
        maxPlayers: this.settings.maxPlayers,
        humans: this.humanPlayers().length,
        spectators: this.spectators().length,
        host: this.hostId && this.members.get(this.hostId) ? this.members.get(this.hostId).name : '',
        guessRounds: this.settings.guessRounds,
        batonSec: this.settings.batonSec,
        diff: this.settings.diff,
        category: this.settings.category,
        wordLang: this.settings.wordLang,
        turnNo: this.state ? this.state.questionNo : 0,
        totalTurns: this.state ? RelayRules.totalQuestions(this.state) : this.settings.guessRounds * Math.max(1, this.seatsTaken()),
        createdAt: this.createdAt
      };
    }
    return {
      code: this.code,
      name: this.name,
      mode: 'classic',
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
      diff: this.settings.diff,
      category: this.settings.category,
      wordLang: this.settings.wordLang,
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
    const inGame = !!(this.state && this.engine.player(this.state, id));
    const game = this.state
      ? (this.relay
        ? RelayRules.toPublic(this.state, inGame ? id : null, { away: this.awayIds(now) })
        : (this.pickdraw
          ? PickdrawRules.toPublic(this.state, inGame ? id : null)
          : Rules.toPublic(this.state, inGame ? id : null)))
      : null;
    const kv = this.kickVote;
    const tally = this.kickTally();
    /* 接力：這一題的猜題者看不到畫家聊天（聊天裡可能就有答案） */
    const hideChat = this.isActiveGuesser(id);
    if (game && this.recovery) game.deadline = 0;
    const relayCan = this.relay && game && m ? {
      vote: inGame && game.you.canVote,
      hint: inGame && game.you.canHint,
      giveUp: inGame && game.you.canGiveUp,
      cheer: inGame && game.you.canCheer
    } : (this.pickdraw && game && m ? {
      vote: false,
      hint: inGame && game.you.canHint,
      giveUp: inGame && game.you.canGiveUp,
      cheer: inGame && game.you.canCheer
    } : { vote: false, hint: false, giveUp: false, cheer: false });

    return {
      room: {
        code: this.code,
        name: this.name,
        mode: this.mode,
        private: this.private,
        phase: this.phase,
        recovering: this.recovery?.savedAt ?? null,
        closed: this.closed,
        closedReason: this.closedReason,
        hostId: this.hostId,
        settings: this.settings,
        drawerDone: !!(this.state && this.doneTurn === this.turnKey()),
        seatsTaken: this.seatsTaken(),
        openSeats: this.openSeats(),
        members: [...this.members.values()].map((x) => ({
          id: x.id, name: x.name, role: x.role, ready: x.ready,
          connected: x.connected, host: x.id === this.hostId
        })),
        summary: this.summary,
        feed: this.feed,
        /* 只在等待畫面才帶聊天紀錄下去：開始對局後用戶端本來就會把聊天室收起來，
           不送也省得讓人以為對局中還能聊天。 */
        chat: (this.phase !== 'playing' || (this.relay && !hideChat)) ? this.chatLog : [],
        /* 接力：猜題者「輸入中…」，只給畫家與觀戰者 */
        guesserTypingUntil: (this.relay && !hideChat && this.typingUntil > now) ? this.typingUntil : 0,
        invites: (isHost || (m && m.role === 'player'))
          ? [...this.invites.values()]
            .filter((i) => !i.revoked && i.expiresAt > now && i.uses < i.maxUses)
            .map((i) => ({ token: i.token, role: i.role, expiresAt: i.expiresAt, uses: i.uses, maxUses: i.maxUses }))
          : [],
        /* 畫家斷線中：等到這個時間還沒回來就跳過這一題（0 = 沒斷線） */
        drawerAwayUntil: this.drawerAwayUntil(),
        /* 你出我畫他猜：斷線的是畫家還是猜題者（題目列的提示文字不一樣） */
        awayRole: this.pickdrawAway().role,
        /* 進行中的踢人投票（沒有就是 null）；voted 是「看這份投影的人」投過了沒 */
        kick: kv ? {
          targetId: kv.targetId, targetName: kv.targetName, byName: kv.byName,
          yes: tally.yes, no: tally.no, need: tally.need, endsAt: kv.endsAt,
          voted: kv.yes.has(id) || kv.no.has(id), choice: kv.yes.has(id) ? 'yes' : (kv.no.has(id) ? 'no' : null)
        } : null,
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
          ready: !this.recovery && m.role === 'player' && this.phase !== 'playing',
          start: !this.recovery && isHost && canStart.ok,
          startBlockedBy: canStart.ok ? null : canStart.error,
          startBlockedByParams: canStart.ok ? null : canStart.params,
          setAi: isHost && this.phase !== 'playing',
          setSettings: isHost && this.phase !== 'playing',
          pick: !this.recovery && inGame && !!game && game.you.canPick,
          draw: !this.recovery && inGame && !!game && game.you.canDraw,
          guess: !this.recovery && inGame && !!game && game.you.canGuess,
          skip: !this.relay && !this.pickdraw && inGame && !!game && game.you.canDraw,
          invite: (m.role === 'player' || isHost) && !this.closed,
          chat: (this.phase !== 'playing' || (this.relay && !hideChat)) && !this.closed,
          vote: relayCan.vote,
          hint: relayCan.hint,
          giveUp: relayCan.giveUp,
          cheer: relayCan.cheer,
          returnToRoom: this.phase === 'finished' && isHost && !this.closed,
          rematch: this.canRematch(m.id),
          kick: m.role === 'player' && !this.closed && !kv && this.humanPlayers().length >= KICK_MIN_PLAYERS,
          voteKick: m.role === 'player' && !!kv && kv.targetId !== m.id && !kv.yes.has(m.id) && !kv.no.has(m.id),
          becomePlayer: m.role === 'spectator' && !this.closed && this.openSeats() > 0,
          becomeSpectator: this.canBecomeSpectator(m.id)
        }
      } : null
    };
  }
}

class RoomStore {
  constructor(opts) {
    this.opts = Object.assign({}, DEFAULTS, opts || {});
    this.rooms = new Map();
    this.checkpoints = this.opts.checkpoints;
    this.pendingCheckpoints = new Set();
    if (this.checkpoints) {
      const readyAt = Date.now();
      for (const { format, savedAt, state } of this.checkpoints.load()) {
        if (format !== 1) throw new Error('不支援的房間快照版本');
        const room = Object.assign(Object.create(Room.prototype), state, { store: this });
        room.recovery ??= { savedAt, until: readyAt + 120000 };
        room.typingUntil = 0;
        for (const member of room.members.values()) {
          member.connected = false;
          member.lastSeen = readyAt;
        }
        this.rooms.set(room.code, room);
        this.markCheckpoint(room);
      }
      this.flushCheckpoints(readyAt);
    }
  }

  markCheckpoint(room) {
    if (this.checkpoints && this.rooms.get(room.code) === room) this.pendingCheckpoints.add(room);
  }

  flushCheckpoints(now) {
    if (!this.pendingCheckpoints.size) return;
    this.checkpoints.write(this.pendingCheckpoints, now);
    this.pendingCheckpoints.clear();
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

  create(id, { name, roomName, private: isPrivate, settings, now, lang, mode }) {
    if (this.rooms.size >= this.opts.maxRooms) {
      return err('srv.err.serverBusy', 'busy');
    }
    const room = new Room(this, {
      mode,
      code: this.newCode(),
      /* 沒取房名就留空：畫面端會用各自語言的預設房名顯示（room.defaultName） */
      name: sanitizeText(roomName, this.opts.roomNameMax),
      private: !!isPrivate,
      now
    });
    const joined = room.join(id, { name, role: 'player', now, creator: true, lang });
    if (!joined.ok) return joined;
    const configured = room.setSettings(id, settings || {});
    if (!configured.ok) return configured;
    this.rooms.set(room.code, room);
    room.hostId = id;
    this.markCheckpoint(room);
    return ok({ room });
  }

  get(code) {
    const room = this.rooms.get(str(code).toUpperCase().trim()) || null;
    return room && !room.closed ? room : null;
  }

  /** 連已關閉的房間也拿得到，讓還在房裡的觀戰者能收到「已結束」 */
  getAny(code) {
    return this.rooms.get(str(code).toUpperCase().trim()) || null;
  }

  /** 公開房間列表。一般大廳只列一般房、接力大廳只列接力房（mode 沒給就當一般大廳） */
  list(mode) {
    const want = MODES.indexOf(mode) >= 0 ? mode : 'classic';
    const out = [];
    for (const r of this.rooms.values()) {
      if (r.private || r.closed || r.mode !== want) continue;
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
    const kicked = [];

    for (const room of [...this.rooms.values()]) {
      if (room.closed) {
        /* 關閉後再留 2 分鐘讓還連著的人收到通知，然後才真的丟掉 */
        if (now - room.closedAt >= 120000) {
          this.rooms.delete(room.code);
          forget.push(room);
        }
        continue;
      }

      const recovered = room.finishRecovery(now);
      if (room.recovery) continue;
      if (recovered) changed.push(room);
      const dropped = room.sweepMembers(now);
      const handed = room.handOffHost(now);
      const kick = room.kickTick(now);
      if (kick.kicked) kicked.push({ room, id: kick.kicked });
      if (dropped.length || handed || kick.changed) changed.push(room);

      if (room.shouldClose()) {
        room.close(
          room.members.size > 0 ? 'srv.closed.onlySpectators' : 'srv.closed.empty',
          now
        );
        room.closedAt = now;
        closed.push(room);
        continue;
      }

      const res = room.tick(now);
      if (res.events.length || res.strokes.length || res.feed.length) {
        this.markCheckpoint(room);
        ticked.push({ room, ...res });
      }

      /* 閒置回收：版本號沒變＝這段時間沒有人做任何事（進出、準備、聊天、改規則…）。
         對局中有計時器在推進，不算閒置；只收等待／結算畫面放著不管的房間。 */
      if (room.version !== room.idleVersion) {
        room.idleVersion = room.version;
        room.idleSince = now;
      } else if (this.opts.idleMs > 0 && room.phase !== 'playing' && now - room.idleSince >= this.opts.idleMs) {
        room.close('srv.closed.idle', now);
        room.closedAt = now;
        closed.push(room);
      }
    }
    return { ticked, changed, closed, forget, kicked };
  }

  size() { return [...this.rooms.values()].filter((r) => !r.closed).length; }
}

module.exports = {
  RoomStore, Room, DEFAULTS, sanitizeText, sanitizeName, str, num, DRAWER_AWAY_MS, RELAY_AWAY_MS, MODES,
  KICK_VOTE_MS, KICK_BAN_MS, KICK_COOLDOWN_MS, KICK_MIN_PLAYERS
};
