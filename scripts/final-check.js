/*
 * scripts/final-check.js — 接力模式與畫圖傳話（Beta）最後確認的有界迭代執行器
 *
 *   node scripts/final-check.js [--max=10]
 *
 * 防護（對應 loop-engineering 的原則 4 與 3）：
 *   - 預算出口：每個套件有逾時，整體最多跑 --max 輪（預設 10）。
 *   - 防作弊不變量：npm test、scripts/online-check.js 與畫圖傳話瀏覽器巡檢的通過項數不得少於
 *     scripts/final-check.baseline.json 記錄的數字；測試被刪或弱化就失敗。
 *   - 無進展偵測：同一組失敗項目連續兩輪出現，就停下來交給人。
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASELINE = path.join(__dirname, 'final-check.baseline.json');
const MAX = Number((process.argv.find((a) => a.startsWith('--max=')) || '--max=10').split('=')[1]) || 10;
const SUITE_TIMEOUT_MS = 15 * 60 * 1000;

const SUITES = [
  { name: 'npm test', cmd: 'npm', args: ['test'], pass: /通過 \d+ 項，失敗 0 項/ },
  { name: 'test:online', cmd: 'npm', args: ['run', '-s', 'test:online'], pass: /失敗 0 項/ },
  { name: 'browser-check', cmd: process.execPath, args: [path.join(ROOT, 'scripts/browser-check.js')], pass: /瀏覽器檢查全部通過/ },
  { name: 'relay-browser-check', cmd: process.execPath, args: [path.join(ROOT, 'scripts/relay-browser-check.js')], pass: /接力瀏覽器巡檢通過/ },
  { name: 'telephone-browser-check', cmd: process.execPath, args: [path.join(ROOT, 'scripts/telephone-browser-check.js')], pass: /畫圖傳話瀏覽器巡檢通過/ }
];

/** 防作弊：統計測試檔裡通過的檢查項數（✓ 行），不能少於基準 */
function countPasses(text) { return (text.match(/^\s*✓ /gm) || []).length; }

function readBaseline() {
  if (!fs.existsSync(BASELINE)) return null;
  return JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
}

function runSuite(s) {
  const r = spawnSync(s.cmd, s.args, { cwd: ROOT, encoding: 'utf8', timeout: SUITE_TIMEOUT_MS, shell: process.platform === 'win32' && s.cmd === 'npm', maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  const timedOut = r.error && r.error.code === 'ETIMEDOUT';
  const ok = !timedOut && r.status === 0 && s.pass.test(out);
  return { name: s.name, ok, timedOut, out };
}

function failuresOf(results) {
  const names = [];
  for (const r of results) {
    if (r.ok) continue;
    if (r.timedOut) names.push(r.name + ':timeout');
    else {
      const bad = (r.out.match(/^\s*✗ .*$/gm) || []).map((x) => x.trim().slice(0, 120));
      names.push(...(bad.length ? bad : [r.name + ':exit']));
    }
  }
  return names.sort();
}

function main() {
  const baseline = readBaseline();
  let previous = null;
  for (let i = 1; i <= MAX; i++) {
    console.log('\n═══ 第 ' + i + ' / ' + MAX + ' 輪 ═══');
    const results = SUITES.map((s) => {
      const r = runSuite(s);
      console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.name + (r.timedOut ? '（逾時）' : ''));
      return r;
    });

    /* 防作弊不變量：relay 測試與線上測試的通過項數不得下降 */
    const counts = {
      'tests/relay.js': countPasses(results[0].out),
      'online-check': countPasses(results[1].out),
      'telephone-browser': countPasses(results[4].out)
    };
    let invariantOk = true;
    if (baseline) {
      for (const k of Object.keys(baseline.counts)) {
        if ((counts[k] || 0) < baseline.counts[k]) {
          invariantOk = false;
          console.log('  ✗ 不變量：' + k + ' 通過項 ' + (counts[k] || 0) + ' < 基準 ' + baseline.counts[k]);
        }
      }
    }

    if (results.every((r) => r.ok) && invariantOk) {
      console.log('\n✓ 第 ' + i + ' 輪全部通過，停止迭代。');
      /* 基準只往上補：新加入的套件才寫入，已有的數字不會被調低 */
      if (!baseline || Object.keys(counts).some((k) => !(k in baseline.counts))) {
        const merged = Object.assign({}, counts, baseline ? baseline.counts : {});
        fs.writeFileSync(BASELINE, JSON.stringify({ counts: merged }, null, 2) + '\n');
        console.log('已寫入通過項基準：' + JSON.stringify(merged));
      }
      return 0;
    }

    const current = failuresOf(results).concat(invariantOk ? [] : ['invariant']).sort();
    if (previous && JSON.stringify(previous) === JSON.stringify(current)) {
      console.log('\n✗ 同一組失敗連續兩輪出現（無進展），停止並交給人。失敗項目：');
      current.forEach((f) => console.log('   - ' + f));
      return 2;
    }
    previous = current;
    console.log('  失敗項目：' + (current.join(' | ') || '（無）'));
  }
  console.log('\n✗ 已達 ' + MAX + ' 輪上限，停止並交給人。');
  return 1;
}

process.exitCode = main();
