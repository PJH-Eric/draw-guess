/*
 * scripts/check-syntax.js — 所有前後端 JS 的語法檢查（零外部套件）
 *
 * 這個專案沒有打包器也沒有 ESLint：瀏覽器直接載入原始檔，所以一個少打的括號
 * 要等到有人開頁面才會發現。這裡用 Node 內建的 `node --check` 把每個檔案掃一遍，
 * npm test 第一步就跑，語法壞掉的版本推不上去。
 *   - public/js/app/ 底下是 ES module，其餘是一般腳本。
 *   - 跳過 vendor/（第三方壓縮檔）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MODULE_DIR = path.join(ROOT, 'public', 'js', 'app');

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === 'vendor' || name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(js|cjs)$/.test(name)) out.push(full);
  }
  return out;
}

const files = [path.join(ROOT, 'server.js')]
  .concat(walk(path.join(ROOT, 'lib'), []), walk(path.join(ROOT, 'scripts'), []), walk(path.join(ROOT, 'tests'), []), walk(path.join(ROOT, 'public', 'js'), []));

let bad = 0;
for (const file of files) {
  const isModule = file.startsWith(MODULE_DIR + path.sep);
  const res = isModule
    ? spawnSync(process.execPath, ['--check', '--input-type=module'], { input: fs.readFileSync(file), encoding: 'utf8' })
    : spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (res.status !== 0) {
    bad++;
    console.error('✗ ' + path.relative(ROOT, file).replace(/\\/g, '/') + '\n' + String(res.stderr || '').split('\n').slice(0, 6).join('\n'));
  }
}
if (bad) { console.error('語法檢查失敗 ' + bad + ' 個檔案'); process.exit(1); }
console.log('語法檢查通過（' + files.length + ' 個檔案）');
