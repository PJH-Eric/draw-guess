/*
 * scripts/stamp-assets.js — 幫 index.html 引用的本機 CSS／JS 加上版本參數（?v=內容雜湊）
 *
 * 為什麼需要：GitHub Pages 會讓瀏覽器把靜態檔快取一小段時間。部署新版之後，
 * 玩家可能拿到「新的 index.html 配舊的 style.css／app.js」，畫面就破了。
 * 每個網址都帶同一個版本參數，檔案內容一變參數就變，瀏覽器只會整組換新。
 *
 * 做法：
 *   - 版本 = 所有被引用檔案（先把舊的 ?v= 拿掉再算）內容的 SHA-1 前 10 碼，全站共用一個。
 *   - index.html 裡 css/、js/ 開頭的 href／src 都改成帶 ?v=版本。
 *   - js/app/ 底下的 ES module 彼此 import 的路徑也帶同一個版本，
 *     這樣同一個模組在整頁只會有一個網址（不會被載入兩份）。
 *
 * 用法：
 *   node scripts/stamp-assets.js           改寫檔案
 *   node scripts/stamp-assets.js --check   只檢查；有檔案沒更新就以代碼 1 結束（npm test 會跑）
 *
 * 改完 public/ 底下的 CSS／JS 之後記得跑一次（npm run stamp）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PUBLIC = path.resolve(__dirname, '..', 'public');
const INDEX = path.join(PUBLIC, 'index.html');
const MODULE_DIR = path.join(PUBLIC, 'js', 'app');
const CHECK = process.argv.includes('--check');
/* 不在 index.html 裡、由 js/lazy-packs.js 用到才載入的檔案：內容也要算進版本，
   不然只改這些檔的時候版本參數不會變，瀏覽器會繼續用快取的舊檔。 */
const LAZY = ['js/locales/ui.en.js', 'js/locales/ui.zh-Hans.js', 'js/words.en.js', 'js/words.zh-Hans.js'];

/* index.html 裡的本機樣式與腳本：href="css/x.css"、src="js/x.js"（可能已經帶 ?v=） */
const ASSET_RE = /\b(href|src)="((?:css|js)\/[^"?#]+\.(?:css|js))(?:\?v=[0-9a-zA-Z]*)?"/g;
/* 模組之間的相對 import：from './x.js'、import './x.js'（可能已經帶 ?v=） */
const IMPORT_RE = /(\bfrom\s+|\bimport\s+)(['"])(\.\.?\/[^'"?]+\.js)(?:\?v=[0-9a-zA-Z]*)?\2/g;

function stripStamps(text) {
  return text.replace(ASSET_RE, '$1="$2"').replace(IMPORT_RE, '$1$2$3$2');
}

function moduleFiles() {
  if (!fs.existsSync(MODULE_DIR)) return [];
  return fs.readdirSync(MODULE_DIR).filter((f) => f.endsWith('.js')).sort().map((f) => path.join(MODULE_DIR, f));
}

function main() {
  const html = fs.readFileSync(INDEX, 'utf8');
  const assets = [];
  for (const m of html.matchAll(ASSET_RE)) {
    const file = path.join(PUBLIC, m[2]);
    if (!fs.existsSync(file)) throw new Error('index.html 引用了不存在的檔案：' + m[2]);
    if (assets.indexOf(file) < 0) assets.push(file);
  }
  const modules = moduleFiles();
  const lazy = LAZY.map((f) => path.join(PUBLIC, f)).filter((f) => fs.existsSync(f));
  const all = [...new Set([...assets, ...modules, ...lazy])].sort();

  const hash = crypto.createHash('sha1');
  for (const file of all) {
    hash.update(path.relative(PUBLIC, file).replace(/\\/g, '/') + '\n');
    /* 換行一律當成 LF 來算：Windows 與 CI 簽出的換行不同，版本才不會跟著變 */
    hash.update(stripStamps(fs.readFileSync(file, 'utf8')).replace(/\r\n/g, '\n'));
    hash.update('\n');
  }
  const version = hash.digest('hex').slice(0, 10);

  const outputs = new Map();
  outputs.set(INDEX, html.replace(ASSET_RE, (_, attr, url) => attr + '="' + url + '?v=' + version + '"'));
  for (const file of modules) {
    const text = fs.readFileSync(file, 'utf8');
    outputs.set(file, text.replace(IMPORT_RE, (_, kw, q, url) => kw + q + url + '?v=' + version + q));
  }

  const stale = [];
  for (const [file, text] of outputs) {
    if (fs.readFileSync(file, 'utf8') === text) continue;
    stale.push(path.relative(path.resolve(__dirname, '..'), file).replace(/\\/g, '/'));
    if (!CHECK) fs.writeFileSync(file, text);
  }

  if (CHECK) {
    if (stale.length) {
      console.error('靜態檔版本參數不是最新的（請執行 npm run stamp 後再提交）：\n  ' + stale.join('\n  '));
      process.exit(1);
    }
    console.log('靜態檔版本參數是最新的（v=' + version + '，' + all.length + ' 個檔案）');
    return;
  }
  console.log(stale.length
    ? '已更新版本參數 v=' + version + '：\n  ' + stale.join('\n  ')
    : '版本參數已經是最新的（v=' + version + '）');
}

main();
