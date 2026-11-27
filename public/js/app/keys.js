/* ===== app/keys.js — 鍵盤快捷鍵 ===== */

import { D, app } from './core.js?v=646a052379';
import { modals } from './modal.js?v=646a052379';
import { chooseTool, doRedo, doUndo } from './canvas.js?v=646a052379';
import { renderOverlay } from './overlay.js?v=646a052379';

var w = window;

/* ================================================================
   鍵盤快捷鍵（畫家用）
   ================================================================ */

export function setupKeys() {
  D.addEventListener('keydown', function (ev) {
    if (app.screen !== 's-game') return;
    var tag = (ev.target && ev.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (modals.settings.isOpen() || modals.game.isOpen() || modals.reference.isOpen() || (modals.confirm && modals.confirm.isOpen())) return;
    if (!app.view || !app.view.you.can.draw) return;

    var k = ev.key.toLowerCase();
    if ((ev.ctrlKey || ev.metaKey) && k === 'z') { ev.preventDefault(); doUndo(); return; }
    if ((ev.ctrlKey || ev.metaKey) && (k === 'y' || (k === 'z' && ev.shiftKey))) { ev.preventDefault(); doRedo(); return; }
    var map = { p: 'pen', b: 'brush', l: 'line', r: 'rect', o: 'ellipse', e: 'erase', f: 'fill' };
    if (map[k]) { ev.preventDefault(); chooseTool(map[k]); }
  });
}

/* 房間設定卡片裡「遊戲規則」的自訂下拉選單：點清單以外的地方，或按 Escape，就收起來。
   只掛一次在 document 上（跟卡片的事件委派一樣，不會越掛越多，
   掛在卡片本身的話舊的監聽器會一直留著、越掛越多）。 */
export function setupRuleMenuClose() {
  D.addEventListener('click', function (ev) {
    if (!app.ruleMenuOpen) return;
    if (ev.target.closest && ev.target.closest('.ruledd')) return;
    var rail = ev.target.closest && ev.target.closest('.scroll-rail');
    var region = rail && D.getElementById(rail.getAttribute('aria-controls'));
    if (region && region.closest('.ruledd')) return;
    app.ruleMenuOpen = null;
    app.lastOverlayHtml = null;
    renderOverlay();
  }, true);
  D.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && app.ruleMenuOpen) {
      app.ruleFocus = { field: app.ruleMenuOpen, target: 'btn' };
      app.ruleMenuOpen = null;
      app.lastOverlayHtml = null;
      renderOverlay();
    }
  });
}
