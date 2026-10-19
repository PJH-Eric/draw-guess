'use strict';
/* Render labelled contact sheets of the drawing references for visual review.
 *   node scripts/reference-sheet.js --range 0-39 --out sheet.png [--recipes fragment.json] [--cols 8] [--size 190]
 *   node scripts/reference-sheet.js --ids cat,w-food-1 --out sheet.png
 * --recipes merges a JSON map {id: ops[]} over the shipped recipes, to preview drafts. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const Words = require('../public/js/words.js');
const Recipes = require('../public/js/reference-recipes.js');
const Reference = require('../public/js/reference.js');
const Meaning = require('../public/js/meaning-reference.js');

const arg = (name, fallback) => {
  const i = process.argv.indexOf('--' + name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const all = Words.all();
let ids;
if (arg('ids')) ids = arg('ids').split(',');
else {
  const [a, b] = arg('range', '0-39').split('-').map(Number);
  ids = all.slice(a, b + 1).map((w) => w.id);
}
if (arg('recipes'))
  Object.assign(Recipes, JSON.parse(fs.readFileSync(arg('recipes'), 'utf8')));
// Warn about malformed draft recipes so they get fixed before review.
for (const id of ids) {
  if (!Recipes[id]) continue;
  const problems = [];
  const known = new Set(Reference.paletteKeys());
  const KINDS = [
    'c',
    'e',
    'r',
    'l',
    'p',
    's',
    'a',
    'ae',
    'ray',
    'w',
    'st',
    'd',
  ];
  for (const item of Recipes[id]) {
    const op = Array.isArray(item) ? item : item.o;
    if (!Array.isArray(item) && !known.has(item.c))
      problems.push('palette ' + item.c);
    if (
      !Array.isArray(op) ||
      !KINDS.includes(op[0]) ||
      op.slice(1).some((n) => !Number.isFinite(n))
    )
      problems.push('op ' + JSON.stringify(op));
  }
  const strokes = Reference.get(id) || [];
  if (strokes.length < 5) problems.push('only ' + strokes.length + ' strokes');
  if (strokes.some((st) => st.p.some((n) => n < -40 || n > 1040)))
    problems.push('out of 0..1000 range');
  if (problems.length) console.warn('WARN ' + id + ': ' + problems.join('; '));
}
const cols = Number(arg('cols', 8));
const size = Number(arg('size', 190));
const step = Number(arg('step', 3));
const esc = (t) =>
  String(t).replace(
    /[&<>]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c],
  );
const cells = ids
  .map((id) => {
    const w = Words.byId(id);
    const svg = Meaning.svg(id, step) || Reference.svg(id, step);
    return (
      '<div class="c"><div class="i">' +
      svg +
      '</div><b>' +
      esc(id.replace(/^w-/, '')) +
      ' ' +
      esc(w ? w.text : '?') +
      '</b></div>'
    );
  })
  .join('');
const html =
  '<meta charset="utf-8"><style>body{margin:0;display:grid;grid-template-columns:repeat(' +
  cols +
  ',' +
  size +
  'px);gap:4px;width:' +
  cols * (size + 4) +
  'px;font:12px sans-serif}' +
  '.c{border:1px solid #ccc}.i{width:' +
  size +
  'px;height:' +
  size +
  'px}svg{width:100%;height:100%}b{display:block;text-align:center;padding:2px}</style>' +
  cells;
const tmp = path.join(os.tmpdir(), 'ref-sheet-' + process.pid + '.html');
fs.writeFileSync(tmp, html);
const rows = Math.ceil(ids.length / cols);
const chrome = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));
if (!chrome) throw new Error('Chrome or Edge not found');
const out = path.resolve(arg('out', 'sheet.png'));
execFileSync(
  chrome,
  [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--screenshot=' + out,
    '--window-size=' +
      (cols * (size + 4) + 8) +
      ',' +
      (rows * (size + 28) + 20),
    'file:///' + tmp.split(path.sep).join('/'),
  ],
  { stdio: 'ignore' },
);
fs.unlinkSync(tmp);
console.log(out + ' (' + ids.length + ' topics)');
