'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Words = require('../public/js/words.js');
const Reference = require('../public/js/reference.js');

const catalogPath = path.join(__dirname, '..', 'public', 'references', 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const catalogScript = fs.readFileSync(path.join(__dirname, '..', 'public', 'references', 'catalog.js'), 'utf8');
const browserGlobal = {};
vm.runInNewContext(catalogScript, { globalThis: browserGlobal });
const expected = Words.all().filter((word) => word.id.startsWith('w-') && !Reference.get(word.id));
const expectedIds = new Set(expected.map((word) => word.id));
const catalogIds = Object.keys(catalog);
const ready = catalogIds.filter((id) => catalog[id].status === 'ready');
const missing = catalogIds.filter((id) => catalog[id].status === 'missing');
const retry = catalogIds.filter((id) => catalog[id].status === 'retry');

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

for (const id of ready) {
  const item = catalog[id];
  assert.ok(item.fileTitle && item.author && item.license, id + ' needs complete attribution');
  assert.match(
    item.license,
    /^(CC BY(?:-SA)?(?: [0-9.]+)?|CC0|Public domain|PD(?:-old)?)$/i,
    id + ' must use a permitted license'
  );
  assert.doesNotMatch(item.license, /\b(?:NC|ND)\b|no derivatives|non-commercial/i, id + ' must allow adaptation');
  assert.match(
    item.sourceUrl,
    /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/,
    id + ' source must link to Commons'
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
}
console.log('Offline catalog verified: ' + ready.length + ' licensed image references, ' + missing.length + ' explicit gaps.');
