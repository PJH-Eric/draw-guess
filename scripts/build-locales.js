/*
 * scripts/build-locales.js — 把 public/js/locales.js 拆成「每個語系一個檔」
 *
 * 為什麼需要：locales.js 一個檔案裝了繁中、簡中、英文三份介面字典，每個玩家開頁都要整份載入，
 * 但實際只會用到其中一種。這支腳本把它拆成：
 *   public/js/locales/ui.zh-Hant.js   預設語系（也是找不到翻譯時的後備），開頁一定載入
 *   public/js/locales/ui.zh-Hans.js   用到才載入（js/lazy-packs.js）
 *   public/js/locales/ui.en.js        用到才載入
 *
 * locales.js 仍然是唯一的來源（人改的是它，測試讀的也是它）；locales/ui.*.js 是產物，不要手改。
 *
 * 用法：
 *   node scripts/build-locales.js           重新產生
 *   node scripts/build-locales.js --check   只檢查；產物不是最新就以代碼 1 結束（npm test 會跑）
 *
 * 改完 locales.js 之後：npm run locales，再 npm run stamp。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const JS = path.resolve(__dirname, '..', 'public', 'js');
const SOURCE = path.join(JS, 'locales.js');
const OUT_DIR = path.join(JS, 'locales');
const CHECK = process.argv.includes('--check');
const DEFAULT = 'zh-Hant';

function collect() {
  const dicts = {};
  const api = { register(lang, values) { Object.assign(dicts[lang] || (dicts[lang] = {}), values); return api; } };
  const box = { I18N: api };
  box.window = box; box.self = box; box.globalThis = box;
  vm.runInNewContext(fs.readFileSync(SOURCE, 'utf8'), box);
  for (const lang of Object.keys(dicts)) {
    for (const [key, value] of Object.entries(dicts[lang])) {
      if (typeof value !== 'string') throw new Error('字典值必須是字串才能拆檔：' + lang + ' ' + key);
    }
  }
  return { dicts, outage: box.ServerOutageMessages || null };
}

function render(lang, dict, outage) {
  const keys = Object.keys(dict).sort();
  const body = keys.map((k) => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(dict[k])).join(',\n');
  let out = '/* 自動產生，請勿手改。來源：js/locales.js（執行 npm run locales 重新產生）。 */\n' +
    'I18N.register(' + JSON.stringify(lang) + ', {\n' + body + '\n});\n' +
    'if (I18N.packReady) I18N.packReady(' + JSON.stringify(lang) + ');\n';
  if (outage) {
    out += '\n/* 伺服器暫停服務的提示文字（js/server-outage.js 用；三個語系都很短，一起放在預設檔） */\n' +
      'window.ServerOutageMessages = ' + JSON.stringify(outage, null, 2) + ';\n';
  }
  return out;
}

function main() {
  const { dicts, outage } = collect();
  if (!dicts[DEFAULT]) throw new Error('locales.js 裡找不到預設語系 ' + DEFAULT);
  const stale = [];
  for (const lang of Object.keys(dicts).sort()) {
    const file = path.join(OUT_DIR, 'ui.' + lang + '.js');
    const text = render(lang, dicts[lang], lang === DEFAULT ? outage : null);
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : null;
    if (current === text) continue;
    stale.push('public/js/locales/ui.' + lang + '.js');
    if (!CHECK) { fs.mkdirSync(OUT_DIR, { recursive: true }); fs.writeFileSync(file, text); }
  }
  if (CHECK) {
    if (stale.length) {
      console.error('語系拆檔不是最新的（請執行 npm run locales 與 npm run stamp 後再提交）：\n  ' + stale.join('\n  '));
      process.exit(1);
    }
    console.log('語系拆檔是最新的（' + Object.keys(dicts).length + ' 個語系）');
    return;
  }
  console.log(stale.length ? '已更新：\n  ' + stale.join('\n  ') : '語系拆檔已經是最新的');
}

main();
