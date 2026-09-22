/* ===== storage.js — 本機偏好與戰績 =====
 * localStorage 在無痕視窗、封鎖第三方資料的瀏覽器裡可能會丟例外，
 * 所以每一次存取都包 try/catch，失敗就當作「沒有存過」繼續玩。
 */
(function (w) {
  'use strict';

  var KEY = {
    nick: 'dg_nick',
    clientId: 'dg_client',
    tutorialDone: 'dg_tutorial',
    aiLevel: 'dg_ai_level',
    aiCount: 'dg_ai_count',
    rounds: 'dg_rounds',
    drawSec: 'dg_draw_sec',
    diff: 'dg_diff',
    stats: 'dg_stats',
    reduceMotion: 'dg_reduce_motion',
    bigTools: 'dg_big_tools',
    tool: 'dg_tool',
    color: 'dg_color',
    width: 'dg_width'
  };

  function get(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  function getJson(k, d) {
    try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
  }
  function setJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function getFlag(k, d) { var v = get(k, null); return v === null ? d : v === '1'; }
  function setFlag(k, v) { set(k, v ? '1' : '0'); }
  function getInt(k, d, lo, hi) {
    var v = parseInt(get(k, ''), 10);
    if (!isFinite(v)) return d;
    return Math.max(lo, Math.min(hi, v));
  }

  /** 這台裝置的身分：重新整理後要靠它回到原本的座位 */
  function clientId() {
    var id = get(KEY.clientId, '');
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      id = 'c' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
      set(KEY.clientId, id);
    }
    return id;
  }

  var EMPTY_STATS = {
    solo: { games: 0, win: 0, correct: 0, drawn: 0, best: 0 },
    online: { games: 0, win: 0, correct: 0, drawn: 0, best: 0 }
  };

  function stats() {
    var s = getJson(KEY.stats, null);
    if (!s || !s.solo || !s.online) return JSON.parse(JSON.stringify(EMPTY_STATS));
    return s;
  }

  /**
   * 記一場的結果。
   * @param {'solo'|'online'} mode
   * @param {{win:boolean, correct:number, drawn:number, score:number}} result
   */
  function recordGame(mode, result) {
    var s = stats();
    var b = s[mode === 'online' ? 'online' : 'solo'];
    b.games += 1;
    if (result.win) b.win += 1;
    b.correct += Math.max(0, Number(result.correct) || 0);
    b.drawn += Math.max(0, Number(result.drawn) || 0);
    b.best = Math.max(b.best || 0, Math.max(0, Number(result.score) || 0));
    setJson(KEY.stats, s);
    return s;
  }

  w.Store = {
    KEY: KEY,
    clientId: clientId,
    nick: function (v) { if (v === undefined) return get(KEY.nick, ''); set(KEY.nick, v); return v; },
    aiLevel: function (v) { if (v === undefined) return get(KEY.aiLevel, 'normal'); set(KEY.aiLevel, v); return v; },
    aiCount: function (v) { if (v === undefined) return getInt(KEY.aiCount, 2, 1, 7); set(KEY.aiCount, v); return v; },
    rounds: function (v) { if (v === undefined) return getInt(KEY.rounds, 2, 1, 5); set(KEY.rounds, v); return v; },
    drawSec: function (v) { if (v === undefined) return getInt(KEY.drawSec, 80, 30, 120); set(KEY.drawSec, v); return v; },
    diff: function (v) { if (v === undefined) return getInt(KEY.diff, 0, 0, 3); set(KEY.diff, v); return v; },
    tutorialDone: function (v) { if (v === undefined) return getFlag(KEY.tutorialDone, false); setFlag(KEY.tutorialDone, v); return v; },
    reduceMotion: function (v) { if (v === undefined) return getFlag(KEY.reduceMotion, false); setFlag(KEY.reduceMotion, v); return v; },
    bigTools: function (v) { if (v === undefined) return getFlag(KEY.bigTools, false); setFlag(KEY.bigTools, v); return v; },
    tool: function (v) { if (v === undefined) return get(KEY.tool, 'pen'); set(KEY.tool, v); return v; },
    color: function (v) { if (v === undefined) return getInt(KEY.color, 0, 0, 31); set(KEY.color, v); return v; },
    width: function (v) { if (v === undefined) return getInt(KEY.width, 1, 0, 3); set(KEY.width, v); return v; },
    stats: stats,
    recordGame: recordGame,
    resetDefaults: function () {
      setFlag(KEY.reduceMotion, false);
      setFlag(KEY.bigTools, false);
    }
  };
}(window));
