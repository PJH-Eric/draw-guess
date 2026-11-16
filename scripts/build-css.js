/*
 * scripts/build-css.js — 把 public/css/parts/*.css 依檔名順序接成 public/css/style.css
 *
 * 為什麼需要：主樣式表以前是單一檔案近兩千行，找東西、改東西都得在整份裡翻。
 * 現在依區域拆成 parts/ 底下幾個檔（00-base、10-menus、20-lobby、30-game…），
 * 但瀏覽器仍然只載入一份 style.css（少幾次請求），所以用這支腳本把它們接回去。
 *
 * 順序就是檔名順序，而且有意義：後面的檔會蓋過前面同權重的規則
 * （60-responsive 蓋過各畫面的基本樣式，70 之後是在那之上的新版面與動態）。
 *
 * parts/ 是來源，style.css 是產物，不要直接改 style.css。
 *
 * 用法：
 *   node scripts/build-css.js           重新產生 style.css
 *   node scripts/build-css.js --check   只檢查；不是最新就以代碼 1 結束（npm test 會跑）
 *
 * 改完 parts/ 之後：npm run build（= 語系拆檔 + 樣式 + 版本參數）。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CSS = path.resolve(__dirname, '..', 'public', 'css');
const PARTS = path.join(CSS, 'parts');
const OUT = path.join(CSS, 'style.css');
const CHECK = process.argv.includes('--check');

function main() {
  const files = fs.readdirSync(PARTS).filter((f) => f.endsWith('.css')).sort();
  if (!files.length) throw new Error('public/css/parts/ 裡沒有任何樣式檔');
  let text = '/* 自動產生，請勿手改。來源：css/parts/*.css（執行 npm run css 重新產生）。 */\n';
  for (const f of files) {
    text += '\n/* >>> parts/' + f + ' */\n' + fs.readFileSync(path.join(PARTS, f), 'utf8').replace(/\r\n/g, '\n').replace(/\n*$/, '\n');
  }
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : null;
  if (current === text) { console.log('style.css 已經是最新的（' + files.length + ' 個分檔）'); return; }
  if (CHECK) {
    console.error('public/css/style.css 不是最新的（請執行 npm run build 後再提交）');
    process.exit(1);
  }
  fs.writeFileSync(OUT, text);
  console.log('已重新產生 public/css/style.css（' + files.length + ' 個分檔）');
}

main();
