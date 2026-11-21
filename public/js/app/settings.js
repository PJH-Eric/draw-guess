/* ===== app/settings.js — 系統設定 ===== */

import { $, Cfg, D, Sound, Store, toast } from './core.js?v=f66810618b';
import { makeModal, modals } from './modal.js?v=f66810618b';
import { layoutStage } from './canvas.js?v=f66810618b';
import { saveNick } from './lobby.js?v=f66810618b';

var w = window;

/* ================================================================
   系統設定
   ================================================================ */

export function applyDisplaySettings() {
  D.body.classList.toggle('reduced-motion', Store.reduceMotion());
  D.body.classList.toggle('big-tools', Store.bigTools());
}

export function setupSettings() {
  modals.settings = makeModal('settings-modal', 'settings-panel', 'b-settings');
  $('b-settings').addEventListener('click', function () { Sound.play('click'); modals.settings.open(); syncSettingsUI(); });
  $('settings-close').addEventListener('click', function () { modals.settings.close(); });
  $('settings-done').addEventListener('click', function () { modals.settings.close(); });
  var back = D.querySelector('[data-settings-close]');
  if (back) back.addEventListener('click', function () { modals.settings.close(); });

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
  $('settings-nick').addEventListener('change', function () { saveNick(this); });
  $('settings-reset').addEventListener('click', function () {
    Sound.resetDefaults();
    Store.resetDefaults();
    applyDisplaySettings();
    syncSettingsUI();
    toast((globalThis.I18N ? globalThis.I18N.t("text.271") : "已恢復預設設定。"), 'ok');
  });
}

export function syncSettingsUI() {
  $('settings-music').checked = Sound.isMusicOn();
  $('settings-music-status').textContent = Sound.isMusicOn() ? (globalThis.I18N ? globalThis.I18N.t("text.265") : "開啟") : (globalThis.I18N ? globalThis.I18N.t("text.264") : "靜音");
  $('settings-sfx').checked = Sound.isSfxOn();
  $('settings-sfx-status').textContent = Sound.isSfxOn() ? (globalThis.I18N ? globalThis.I18N.t("text.265") : "開啟") : (globalThis.I18N ? globalThis.I18N.t("text.264") : "靜音");
  $('settings-music-volume').value = Math.round(Sound.getMusicVolume() * 100);
  $('settings-music-volume-value').textContent = Math.round(Sound.getMusicVolume() * 100) + '%';
  $('settings-sfx-volume').value = Math.round(Sound.getSfxVolume() * 100);
  $('settings-sfx-volume-value').textContent = Math.round(Sound.getSfxVolume() * 100) + '%';
  /* 自訂滑桿的已填滿長度（CSS 用 --fill 畫軌道） */
  ['settings-music-volume', 'settings-sfx-volume'].forEach(function (id) {
    var range = $(id);
    var span = (Number(range.max) || 100) - (Number(range.min) || 0);
    range.style.setProperty('--fill', ((Number(range.value) - (Number(range.min) || 0)) / (span || 1) * 100) + '%');
  });
  $('settings-pencue').checked = Sound.isPenCueOn();
  $('settings-chatcue').checked = Sound.isChatCueOn();
  $('settings-haptic').checked = Sound.isHapticOn();
  $('settings-motion').checked = Store.reduceMotion();
  $('settings-bigtools').checked = Store.bigTools();
  $('settings-nick').value = Store.nick();
  $('settings-server-url').textContent = Cfg.describe();
}
