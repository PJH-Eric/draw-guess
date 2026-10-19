/* Fetch accurately titled, freely licensed Commons references and cache pencil-sketch stages. */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const Words = require('../public/js/words.js');
const DrawingReference = require('../public/js/reference.js');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'public', 'references');
const ASSETS = path.join(OUTPUT, 'assets');
const CATALOG = path.join(OUTPUT, 'catalog.json');
const CATALOG_SCRIPT = path.join(OUTPUT, 'catalog.js');
const USER_AGENT = 'DrawGuessOfflineReferences/1.0 (https://github.com/PJH-Eric/draw-guess)';
const REQUEST_INTERVAL_MS = 334;
const LICENSES = /^(CC BY(?:-SA)?(?: [0-9.]+)?|CC0|Public domain|PD(?:-old)?)$/i;
const STOP_WORDS = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'the', 'to', 'with']);
const CATEGORY_CONTEXT = {
  animal: 'animal', food: 'food', home: '', vehicle: 'vehicle', nature: 'nature',
  fun: '', emotion: 'emotion', idiom: 'idiom illustration', phenomenon: 'natural phenomenon',
  place: 'landmark', expression: 'expression illustration', job: 'occupation', fantasy: '',
  action: 'action', star: 'celebrity', movie: 'film', trend: 'internet meme', history: 'historical person',
  geography: 'geography map', civics: 'government politics', physics: 'physics', astro: 'astronomy space',
  music: 'music instrument', people: 'person portrait', body: 'human anatomy', clothes: 'clothing',
  taiwan: 'Taiwan landmark', festival: 'festival'
};
const ANIMAL_CONTEXT = {
  ant: 'insect', chick: 'bird', crane: 'bird', duck: 'bird', eagle: 'bird', flamingo: 'bird',
  goose: 'bird', goldfish: 'fish', hen: 'bird', parrot: 'bird', peacock: 'bird', rooster: 'bird',
  seal: 'marine mammal', shark: 'fish', shrimp: 'crustacean', swan: 'bird', swallow: 'bird',
  woodpecker: 'bird'
};
const ANIMAL_FALSE_POSITIVES = new Set([
  'art', 'body', 'brand', 'butterfly', 'casino', 'cookie', 'cracker', 'crackers', 'dancer',
  'hotel', 'helmet', 'helmets', 'logo', 'nebula', 'performer', 'sculpture', 'seller',
  'shell', 'skeleton', 'skull', 'statue', 'toy'
]);
let nextRequestAt = 0;
let pauseRequestsUntil = 0;

function clean(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return clean(value).toLowerCase().replace(/\.[a-z0-9]{2,5}$/i, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/)
    .filter(token => token && !STOP_WORDS.has(token)).map(stem);
}

function stem(token) {
  if (token.length > 5 && token.endsWith('ies')) return token.slice(0, -3) + 'y';
  if (token.length > 5 && token.endsWith('ing')) {
    const base = token.slice(0, -3);
    return /([a-z])\1$/.test(base) ? base.slice(0, -1) : base;
  }
  if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

function titleScore(term, title) {
  const wanted = [...new Set(tokens(term))];
  const found = tokens(title.replace(/^File:/i, ''));
  if (!wanted.length || !found.length) return null;
  const matched = wanted.filter(word => found.includes(word));
  if (matched.length !== wanted.length) return null;
  const extra = found.filter(word => !wanted.includes(word)).length;
  // Full term coverage is mandatory; prefer concise filenames over tangential long titles.
  return {
    coverage: matched.length / wanted.length,
    score: 1 - Math.min(0.8, extra / Math.max(4, wanted.length * 4)),
    extra
  };
}

async function fetchJson(url, signal) {
  let response;
  while (true) {
    const now = Date.now();
    const slot = Math.max(now, nextRequestAt, pauseRequestsUntil);
    nextRequestAt = slot + REQUEST_INTERVAL_MS;
    if (slot > now) await new Promise(resolve => setTimeout(resolve, slot - now));
    response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal
    });
    if (response.status !== 429) break;
    const retryAfter = Number(response.headers.get('retry-after')) || 60;
    pauseRequestsUntil = Date.now() + retryAfter * 1000;
    console.log('Commons rate limit: pausing API requests for ' + retryAfter + ' seconds.');
  }
  if (!response.ok) {
    const error = new Error('Wikimedia API HTTP ' + response.status);
    error.status = response.status;
    error.retryAfter = Number(response.headers.get('retry-after')) || 0;
    throw error;
  }
  return response.json();
}

async function findReference(word) {
  const translated = Words.byId(word.id, 'en');
  const term = translated && translated.text && !/[\u3400-\u9fff]/.test(translated.text)
    ? translated.text
    : word.text;
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  const context = word.cat === 'animal'
    ? ANIMAL_CONTEXT[term.toLowerCase()] || 'animal'
    : CATEGORY_CONTEXT[word.cat] || '';
  url.searchParams.set('action', 'query');
  url.searchParams.set('generator', 'search');
  url.searchParams.set(
    'gsrsearch',
    'filetype:bitmap ' + term + (context ? ' ' + context : '')
  );
  url.searchParams.set('gsrnamespace', '6');
  url.searchParams.set('gsrlimit', '20');
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|extmetadata|mime|thumbmime');
  url.searchParams.set('iiurlwidth', '320');
  url.searchParams.set('format', 'json');

  const result = await fetchJson(url);
  const pages = Object.values(result.query && result.query.pages || []);
  const eligible = pages.map(page => {
    const image = page.imageinfo && page.imageinfo[0];
    const metadata = image && image.extmetadata || {};
    const license = clean(metadata.LicenseShortName && metadata.LicenseShortName.value);
    const match = titleScore(term, page.title);
    if (!image || !image.thumburl || !match || !LICENSES.test(license)) return null;
    if (word.cat === 'animal') {
      const wanted = new Set(tokens(term));
      const extra = tokens(page.title.replace(/^File:/i, '')).filter(token => !wanted.has(token));
      if (extra.some(token => ANIMAL_FALSE_POSITIVES.has(token))) return null;
    }
    if (/\b(?:NC|ND)\b|non-commercial|no derivatives/i.test(license)) return null;
    if (!/^image\/(?:jpeg|png|webp)$/i.test(image.thumbmime || image.mime || '')) return null;
    return {
      page,
      image,
      metadata,
      license,
      score: match.score
    };
  }).filter(Boolean).sort((a, b) =>
    b.score - a.score || a.page.title.length - b.page.title.length
  );

  return eligible.length ? { term, candidates: eligible } : { term, missing: true };
}

function readCatalog() {
  try { return JSON.parse(fs.readFileSync(CATALOG, 'utf8')); }
  catch (_) { return {}; }
}

function sourcePageUrl(fileTitle) {
  const titlePath = String(fileTitle || '')
    .split('/')
    .map(encodeURIComponent)
    .join('/')
    .replace(/%20/g, '_');
  return 'https://commons.wikimedia.org/wiki/File:' + titlePath;
}

function licensePageUrl(license, declaredUrl) {
  const cleanedUrl = clean(declaredUrl).replace(/^http:\/\//i, 'https://');
  if (cleanedUrl) return cleanedUrl;
  const ccLicense = String(license || '').match(/^CC BY(-SA)?(?: ([0-9.]+))?$/i);
  if (ccLicense) {
    return 'https://creativecommons.org/licenses/by' +
      (ccLicense[1] ? '-sa' : '') + '/' + (ccLicense[2] || '4.0') + '/';
  }
  if (/^CC0$/i.test(license)) return 'https://creativecommons.org/publicdomain/zero/1.0/';
  if (/^GFDL$/i.test(license)) return 'https://www.gnu.org/licenses/fdl-1.3.html';
  return 'https://commons.wikimedia.org/wiki/Commons:Public_domain';
}

function writeCatalog(catalog) {
  Object.entries(catalog).forEach(([id, item]) => {
    if (item.status !== 'ready') return;
    if (!LICENSES.test(item.license) || /\b(?:NC|ND)\b|non-commercial|no derivatives/i.test(item.license)) {
      catalog[id] = { status: 'missing' };
      fs.rmSync(path.join(ASSETS, id), { recursive: true, force: true });
      return;
    }
    item.sourceUrl = sourcePageUrl(item.fileTitle);
    item.licenseUrl = licensePageUrl(item.license, item.licenseUrl);
  });
  const ordered = Object.fromEntries(Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b)));
  const json = JSON.stringify(ordered, null, 2) + '\n';
  fs.writeFileSync(CATALOG, json, 'utf8');
  fs.writeFileSync(CATALOG_SCRIPT,
    '/* Generated by scripts/build-offline-references.js. */\n' +
    '(function(root){"use strict";root.OfflineReferences=' + JSON.stringify(ordered) + ';})(typeof globalThis!=="undefined"?globalThis:this);\n',
    'utf8');
}

function downloadImage(url, destination) {
  const result = spawnSync('py', [
    '-c',
    "import sys,urllib.request; r=urllib.request.Request(sys.argv[1],headers={'User-Agent':sys.argv[2],'Referer':'https://commons.wikimedia.org/'}); d=urllib.request.urlopen(r,timeout=30).read(); sys.stdout.buffer.write(d)",
    url,
    USER_AGENT
  ], { encoding: null, maxBuffer: 2 * 1024 * 1024, timeout: 40000 });
  if (result.status !== 0 || !result.stdout || result.stdout.length > 500000) return false;
  fs.writeFileSync(destination, result.stdout);
  return true;
}

function renderSketch(inputFile, assetDir) {
  const result = spawnSync('py', [
    path.join(__dirname, 'render-offline-reference.py'),
    inputFile,
    assetDir
  ], { encoding: 'utf8', timeout: 30000 });
  return result.status === 0;
}

function attribution(reference, word, imageName) {
  const metadata = reference.metadata;
  return {
    term: reference.term,
    word: word.text,
    fileTitle: reference.page.title.replace(/^File:/i, ''),
    author: clean(metadata.Artist && metadata.Artist.value) || 'Unknown Commons contributor',
    license: reference.license,
    licenseUrl: licensePageUrl(reference.license, metadata.LicenseUrl && metadata.LicenseUrl.value),
    sourceUrl: sourcePageUrl(reference.page.title.replace(/^File:/i, '')),
    changes: 'Converted to a three-stage monochrome edge sketch for drawing reference.',
    stages: [1, 2, 3].map(stage => 'references/assets/' + imageName + '/' + stage + '.png')
  };
}

async function main() {
  const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
  const idsArg = process.argv.find(arg => arg.startsWith('--ids='));
  const requestedIds = idsArg ? new Set(idsArg.slice('--ids='.length).split(',').filter(Boolean)) : null;
  const categoriesArg = process.argv.find(arg => arg.startsWith('--retry-categories='));
  const retryCategories = categoriesArg
    ? new Set(categoriesArg.slice('--retry-categories='.length).split(',').filter(Boolean))
    : null;
  const refresh = process.argv.includes('--refresh');
  const retryMissing = process.argv.includes('--retry-missing');
  const catalog = readCatalog();
  if (process.argv.includes('--repair-links')) {
    writeCatalog(catalog);
    console.log('Repaired source and license links for ' + Object.values(catalog).filter(item => item.status === 'ready').length + ' references.');
    return;
  }
  const words = Words.all().filter(word =>
    word.id.startsWith('w-') &&
    !DrawingReference.get(word.id) &&
    (requestedIds
      ? requestedIds.has(word.id)
      : refresh ||
        (retryMissing && catalog[word.id] && catalog[word.id].status === 'missing' &&
          (!retryCategories || retryCategories.has(word.cat))) ||
        !catalog[word.id] || !['ready', 'missing'].includes(catalog[word.id].status))
  );
  const queue = words.slice(0, limit);
  const total = queue.length;
  fs.mkdirSync(ASSETS, { recursive: true });
  let completed = 0;
  let found = 0;
  let skipped = 0;
  let stopped = false;

  console.log('Searching ' + total + ' uncovered prompts; Wikimedia limit is observed.');
  async function worker() {
    while (!stopped) {
      const word = queue.shift();
      if (!word) return;
      try {
        const reference = await findReference(word);
        if (reference.missing) {
          fs.rmSync(path.join(ASSETS, word.id), { recursive: true, force: true });
          catalog[word.id] = { status: 'missing' };
          skipped++;
        } else {
          const assetDir = path.join(ASSETS, word.id);
          let selected = null;
          for (const candidate of reference.candidates) {
            fs.mkdirSync(assetDir, { recursive: true });
            const downloadPath = path.join(assetDir, 'source.tmp');
            if (downloadImage(candidate.image.thumburl, downloadPath) &&
                renderSketch(downloadPath, assetDir)) {
              fs.rmSync(downloadPath, { force: true });
              selected = Object.assign({}, reference, candidate);
              break;
            }
            fs.rmSync(assetDir, { recursive: true, force: true });
          }
          if (selected) {
            catalog[word.id] = Object.assign({ status: 'ready' }, attribution(selected, word, word.id));
            found++;
          } else {
            catalog[word.id] = { status: 'missing' };
            skipped++;
          }
        }
      } catch (error) {
        if (error.status === 403) {
          console.log('Wikimedia denied the request; pausing safely at ' + completed + ' prompts.');
          catalog[word.id] = { status: 'retry', error: error.message };
          stopped = true;
          return;
        }
        catalog[word.id] = { status: 'retry', error: error.message };
        skipped++;
      }
      completed++;
      if (completed % 10 === 0 || completed === total) {
        writeCatalog(catalog);
        console.log(completed + ': ' + found + ' offline references, ' + skipped + ' still uncovered');
      }
    }
  }

  await Promise.all([worker(), worker(), worker()]);
  writeCatalog(catalog);
  console.log('Catalog now contains ' +
    Object.values(catalog).filter(item => item.status === 'ready').length +
    ' image references, ' +
    Object.values(catalog).filter(item => item.status === 'missing').length +
    ' confirmed gaps, and ' +
    Object.values(catalog).filter(item => item.status === 'retry').length +
    ' retryable prompts.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
