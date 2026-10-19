'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Words = require('../public/js/words.js');
const Reference = require('../public/js/reference.js');
const MeaningReference = require('../public/js/meaning-reference.js');

const catalogPath = path.join(__dirname, '..', 'public', 'references', 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const catalogScript = fs.readFileSync(path.join(__dirname, '..', 'public', 'references', 'catalog.js'), 'utf8');
const browserGlobal = {};
vm.runInNewContext(catalogScript, { globalThis: browserGlobal });
const expected = Words.all().filter((word) => word.id.startsWith('w-') && !Reference.get(word.id));
const expectedIds = new Set(expected.map((word) => word.id));
const catalogIds = Object.keys(catalog);
const ready = catalogIds.filter((id) => catalog[id].status === 'ready');
const semantic = catalogIds.filter((id) => catalog[id].status === 'semantic');
const missing = catalogIds.filter((id) => catalog[id].status === 'missing');
const retry = catalogIds.filter((id) => catalog[id].status === 'retry');
const knownFalseMatches = new Map([
  ['w-idiom-19', /never missed a beat/i],
  ['w-idiom-37', /few drops.*ocean|lose faith in humanity/i],
  ['w-idiom-44', /truth comes out/i],
  ['w-idiom-60', /flurr|rooftop/i],
  ['w-idiom-62', /red light cameras/i],
  ['w-idiom-63', /rocking chair/i],
  ['w-idiom-65', /contradict.*order to live/i],
  ['w-idiom-88', /protest/i],
  ['w-idiom-89', /wholeheartedly agree/i],
  ['w-people-37', /new scientific truth does not triumph/i],
  ['w-phenomenon-13', /amphitheater/i],
  ['w-phenomenon-46', /drizzle in 2022/i],
  ['w-vehicle-52', /battery and controller/i],
  ['w-expression-43', /grinding teeth sing/i],
  ['w-festival-21', /snowman/i]
]);

assert.equal(
  catalogIds.length,
  expected.length,
  'Every expanded prompt must have an explicit catalog status'
);
assert.deepEqual(new Set(catalogIds), expectedIds, 'Catalog entries must only represent uncovered prompts');
assert.equal(retry.length, 0, 'Retryable build failures must be resolved before delivery');
assert.equal(
  JSON.stringify(browserGlobal.OfflineReferences),
  JSON.stringify(catalog),
  'Browser catalog must match the provenance manifest'
);

for (const id of MeaningReference.ids()) {
  assert.ok(MeaningReference.get(id), id + ' semantic scene must resolve every component');
  for (const step of [1, 2, 3]) {
    assert.match(MeaningReference.svg(id, step), /<path /, id + ' scene step ' + step + ' must render strokes');
  }
}

for (const id of ready) {
  const item = catalog[id];
  const falseMatch = knownFalseMatches.get(id);
  assert.ok(!falseMatch || !falseMatch.test(item.fileTitle), id + ' must not keep a known unrelated image');
  assert.ok(item.fileTitle && item.author && item.license, id + ' needs complete attribution');
  assert.match(
    item.license,
    /^(CC BY(?:-SA)?(?: [0-9.]+)?|CC0|Public domain|PD(?:-old)?)$/i,
    id + ' must use a permitted license'
  );
  assert.doesNotMatch(item.license, /\b(?:NC|ND)\b|no derivatives|non-commercial/i, id + ' must allow adaptation');
  assert.match(
    item.sourceUrl,
    /^https:\/\//,
    id + ' source must link to the original image page'
  );
  assert.match(item.licenseUrl, /^https:\/\//, id + ' must link to its license');
  assert.equal(item.stages.length, 3, id + ' must have three stages');
  for (const stage of item.stages) {
    assert.match(stage, /^references\/assets\/w-[\w-]+\/[123]\.png$/, id + ' must use a local asset');
    const file = path.join(__dirname, '..', 'public', stage);
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a', file + ' must be PNG');
    assert.equal(bytes.readUInt32BE(16), 640, file + ' must be 640 pixels wide');
    assert.equal(bytes.readUInt32BE(20), 640, file + ' must be 640 pixels tall');
  }
}

for (const id of missing) {
  assert.equal(catalog[id].status, 'missing');
  assert.equal(catalog[id].stages, undefined, id + ' must not point to an incorrect image');
  assert.equal(MeaningReference.get(id), null, id + ' must not hide a complete semantic template');
}

for (const id of semantic) {
  assert.equal(catalog[id].word, Words.byId(id).text, id + ' semantic sketch must match its prompt');
  assert.equal(catalog[id].method, 'composed-topic-sketch');
  assert.ok(MeaningReference.get(id), id + ' must have a complete composed scene');
  for (const step of [1, 2, 3]) {
    const svg = MeaningReference.svg(id, step);
    assert.match(svg, /^<svg /, id + ' must render a scene at step ' + step);
    assert.match(svg, /<path /, id + ' must contain visible strokes at step ' + step);
    assert.doesNotMatch(svg, /NaN|undefined/, id + ' must not emit malformed coordinates');
  }
}
console.log('Offline catalog verified: ' + ready.length + ' licensed images, ' + semantic.length + ' semantic sketches, ' + missing.length + ' explicit gaps.');
