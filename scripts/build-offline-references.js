/* Fetch accurately titled, freely licensed Commons references and cache pencil-sketch stages. */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const Words = require('../public/js/words.js');
const DrawingReference = require('../public/js/reference.js');
const MeaningReference = require('../public/js/meaning-reference.js');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'public', 'references');
const ASSETS = path.join(OUTPUT, 'assets');
const CATALOG = path.join(OUTPUT, 'catalog.json');
const CATALOG_SCRIPT = path.join(OUTPUT, 'catalog.js');
const USER_AGENT = 'DrawGuessOfflineReferences/1.0 (https://github.com/PJH-Eric/draw-guess)';
const REQUEST_INTERVAL_MS = 334;
const OPENVERSE_REQUEST_INTERVAL_MS = 1000;
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
let nextOpenverseRequestAt = 0;
let pauseRequestsUntil = 0;
let openverseRemainingToday = Infinity;

const OPENVERSE_ALIASES = {
  'w-idiom-2': 'frog in well illustration',
  'w-idiom-5': 'person covering ears bell',
  'w-idiom-10': 'old man horse parable',
  'w-idiom-13': 'person pulling seedling plant',
  'w-idiom-16': 'tiger dragon illustration',
  'w-idiom-19': 'archer hitting target',
  'w-idiom-20': 'horse crossing finish line',
  'w-idiom-21': 'student exam failure',
  'w-idiom-27': 'surrounded by enemies illustration',
  'w-idiom-34': 'oil poured on fire',
  'w-idiom-39': 'dragon phoenix illustration',
  'w-idiom-37': 'nine cows one hair',
  'w-idiom-44': 'water receding rocks appear',
  'w-idiom-60': 'busy person multitasking',
  'w-idiom-62': 'embarrassed red face',
  'w-idiom-63': 'happy heart flower',
  'w-idiom-65': 'spear shield illustration',
  'w-idiom-88': 'three hearts two arrows',
  'w-idiom-89': 'one heart one arrow',
  'w-idiom-56': 'wolf eating food',
  'w-idiom-69': 'cart pointing opposite directions',
  'w-idiom-72': 'time flying arrow',
  'w-idiom-80': 'sand building tower',
  'w-idiom-83': 'door reveals mountain',
  'w-idiom-84': 'bird flying upward',
  'w-idiom-91': 'person opening eyes wide',
  'w-action-49': 'hopscotch game',
  'w-action-47': 'person snoring',
  'w-action-73': 'person crossing a street',
  'w-action-87': 'taking body temperature',
  'w-emotion-5': 'shy person',
  'w-emotion-7': 'anxious person',
  'w-emotion-9': 'tired person',
  'w-emotion-18': 'surprised expression',
  'w-emotion-20': 'person in love',
  'w-emotion-30': 'grateful person',
  'w-emotion-38': 'hopeless person',
  'w-emotion-39': 'nostalgic photo',
  'w-expression-3': 'winking person',
  'w-expression-8': 'sighing person',
  'w-expression-14': 'person stomping',
  'w-expression-16': 'person scratching head',
  'w-expression-21': 'person saluting',
  'w-expression-24': 'angry glare',
  'w-expression-25': 'sly grin',
  'w-expression-26': 'person shouting',
  'w-expression-27': 'drooling person',
  'w-expression-28': 'blushing face',
  'w-expression-30': 'person covering mouth',
  'w-expression-37': 'person whistling',
  'w-expression-43': 'person grinding teeth',
  'w-expression-45': 'person with open mouth',
  'w-expression-10': 'person nodding',
  'w-expression-9': 'person shaking head',
  'w-expression-40': 'person squinting',
  'w-expression-41': 'person pursing lips',
  'w-expression-44': 'person shrugging',
  'w-music-0': 'trumpet player',
  'w-music-34': 'lullaby song',
  'w-music-38': 'children nursery rhyme',
  'w-physics-2': 'person floating in water',
  'w-physics-17': 'thermal expansion diagram',
  'w-physics-35': 'sound wave diagram',
  'w-place-35': 'flower shop storefront',
  'w-place-68': 'pet shop storefront',
  'w-place-72': 'dessert shop storefront',
  'w-star-2': 'Mayday band',
  'w-star-26': 'Feng Fei Fei singer',
  'w-star-27': 'Teresa Teng singer',
  'w-star-48': 'Roger Federer tennis player',
  'w-history-37': 'Wang Xizhi portrait',
  'w-history-34': 'Li Bai portrait',
  'w-history-69': 'Mencius portrait',
  'w-job-17': 'store clerk retail worker',
  'w-vehicle-52': 'electric skateboard',
  'w-people-37': 'two people facing off',
  'w-phenomenon-13': 'snow avalanche mountain',
  'w-phenomenon-46': 'light drizzle rain',
  'w-festival-21': 'father child fathers day',
  'w-phenomenon-32': 'desert mirage',
  'w-phenomenon-35': 'cold wave weather',
  'w-phenomenon-36': 'plum rain weather',
  'w-trend-3': 'astronaut space travel',
  'w-trend-11': 'short video app',
  'w-trend-25': 'vaccination',
  'w-trend-41': 'online scam',
  'w-food-111': 'scallion pancake',
  'w-food-115': 'oyster omelette',
  'w-food-118': 'lu wei',
  'w-food-124': 'ba-wan',
  'w-food-125': 'wogui rice cake',
  'w-food-128': 'gua bao',
  'w-food-131': 'pig blood rice cake',
  'w-food-133': 'danzai noodles',
  'w-food-134': 'zha jiang mian',
  'w-food-139': 'chicken leg rice',
  'w-star-11': 'Gloria Tang',
  'w-star-4': 'JJ Lin',
  'w-history-43': 'Albert Einstein',
  'w-history-47': 'Florence Nightingale',
  'w-history-64': 'George Washington',
  'w-history-66': 'Winston Churchill',
  'w-geography-75': 'Sydney Opera House',
  'w-taiwan-1': 'Yushan Jade Mountain',
  'w-taiwan-4': 'ASE Technology Taiwan',
  'w-taiwan-8': 'Penghu Island Taiwan',
  'w-taiwan-2': 'Alishan',
  'w-taiwan-3': 'Sun Moon Lake',
  'w-taiwan-10': 'Mazu pilgrimage',
  'w-taiwan-11': 'Yanshui Beehive Fireworks'
};

const OPENVERSE_TITLE_EXCLUSIONS = {
  'w-action-47': /simple sleep services/i,
  'w-action-49': /oblivion/i,
  'w-action-73': /seeing my doctor across town/i,
  'w-action-87': /goat milk/i,
  'w-fantasy-65': /macbook|laptop cover/i,
  'w-festival-21': /snowman/i,
  'w-history-37': /after wang xizhi|lan ting xu|hometown/i,
  'w-history-69': /friendship is one mind|aerial/i,
  'w-history-34': /zhou enlai/i,
  'w-job-17': /hudson.s bay|mink trap/i,
  'w-music-0': /factory worker/i,
  'w-music-34': /somewhere over the rainbow/i,
  'w-music-38': /muffin tin monday/i,
  'w-emotion-18': /project 365/i,
  'w-emotion-20': /ice cream/i,
  'w-emotion-38': /city of hopeless/i,
  'w-emotion-7': /nervous system/i,
  'w-expression-3': /motel|wink.s place|soap opera/i,
  'w-expression-8': /bridge of sighs/i,
  'w-expression-9': /supermarket|expiration date|scratched off/i,
  'w-expression-14': /war stomp/i,
  'w-expression-16': /petri museum|limestone|trialpiece/i,
  'w-expression-21': /salute to sun/i,
  'w-expression-24': /rocket.?s red glare/i,
  'w-expression-25': /snickers|mixed-breed|fairy costume/i,
  'w-expression-26': /shout louder/i,
  'w-expression-27': /primordius|bibleman/i,
  'w-expression-28': /catchy colors|bottle green/i,
  'w-expression-30': /duct|lint covers/i,
  'w-expression-37': /duck|in water/i,
  'w-expression-43': /teeth don.t grind|grinding teeth sing/i,
  'w-expression-44': /bathroom|no one came/i,
  'w-expression-45': /open mouths|montreal/i,
  'w-expression-40': /three33|havanovers/i,
  'w-expression-41': /long dress/i,
  'w-history-15': /gunpowder store/i,
  'w-idiom-2': /eye of newt|hair of dog|blend well/i,
  'w-idiom-12': /love that move/i,
  'w-idiom-13': /seedlings never flourish/i,
  'w-idiom-19': /never miss a thing|never missed a beat/i,
  'w-idiom-20': /ferrari/i,
  'w-idiom-5': /pool balls|better luck next time/i,
  'w-idiom-16': /crouching tiger|hidden dragon/i,
  'w-idiom-21': /study.*facebook|fail exam/i,
  'w-idiom-27': /tomb|doric columns/i,
  'w-idiom-34': /candy van olst|don.t add fuel/i,
  'w-idiom-37': /drop in the ocean|few drops.*ocean|lose faith in humanity/i,
  'w-idiom-39': /chrysanthemum|cultivar/i,
  'w-idiom-44': /in time.*truth comes out|the truth comes out/i,
  'w-idiom-56': /wolfed it down/i,
  'w-idiom-57': /crowd forms|labor stage/i,
  'w-idiom-60': /flurr(y|ies)|rooftop/i,
  'w-idiom-61': /wisdom.*dumbfounds/i,
  'w-idiom-62': /bombus|maryland|frederick|red light cameras/i,
  'w-idiom-63': /venus|airport|rocking chair/i,
  'w-idiom-65': /choose not to contradict|contradict.*order to live/i,
  'w-idiom-69': /your angel/i,
  'w-idiom-71': /from bad to worse/i,
  'w-idiom-72': /time flies so fast/i,
  'w-idiom-76': /same difference/i,
  'w-idiom-80': /every little bit helps/i,
  'w-idiom-81': /dazzled by the brights|sunday sun/i,
  'w-idiom-83': /blogging|get straight.*point/i,
  'w-idiom-84': /paraglider/i,
  'w-idiom-88': /peek-a-boo|protest/i,
  'w-idiom-89': /beach|wholeheartedly enjoy|wholeheartedly agree/i,
  'w-idiom-91': /nasa.*typhoon/i,
  'w-movie-29': /chicago|morning light|castles in the sky meet/i,
  'w-movie-49': /premiere/i,
  'w-movie-67': /sweets/i,
  'w-movie-73': /inauguración|proyección/i,
  'w-place-35': /google maps/i,
  'w-place-68': /pet shop boys|birthday cake/i,
  'w-place-72': /jing jing dessert|willow branches|closeup|cookies/i,
  'w-place-76': /mainzer.s cats/i,
  'w-phenomenon-13': /picnic area|amphitheater/i,
  'w-phenomenon-32': /mirage f1|riat/i,
  'w-phenomenon-35': /cold waves crashing on the shore/i,
  'w-phenomenon-36': /materia dietetica|wellcome/i,
  'w-phenomenon-46': /remix|explored|drizzle in 2022/i,
  'w-physics-2': /neutral buoyancy laboratory/i,
  'w-physics-17': /thermal expansion kfupm/i,
  'w-physics-35': /party flyer|template/i,
  'w-trend-11': /regents canal|sunset/i,
  'w-trend-25': /hiv rapid test/i,
  'w-trend-41': /conference on internet scam/i,
  'w-trend-6': /cryptocurrency cachet/i,
  'w-star-2': /may.?day rally/i,
  'w-star-26': /馮飛|feng fei/i,
  'w-star-27': /home of teresa teng/i,
  'w-star-48': /infographic/i,
  'w-taiwan-4': /sunlight.*moonlight/i,
  'w-trend-3': /^space travel$/i,
  'w-vehicle-52': /hub.*motor|battery and controller/i,
  'w-people-37': /new scientific truth does not triumph/i,
  'w-history-33': /\bterritory\b/i,
  'w-history-64': /\bUSS\b|\bship\b/i,
  'w-job-18': /captain.s windows/i,
  'w-job-24': /reporter notebook/i,
  'w-job-34': /lifeguard boat/i,
  'w-job-53': /private detective stories/i,
  'w-job-68': /erotic|erotik/i,
  'w-job-77': /Twitter content/i,
  'w-movie-77': /the departed|remake/i,
  'w-place-53': /eat,? drink,? shop/i
};

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
  // Keep -ing intact: chopping it off made Kenting match the surname Kent.
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

async function fetchOpenverseJson(url) {
  const now = Date.now();
  const slot = Math.max(now, nextOpenverseRequestAt);
  nextOpenverseRequestAt = slot + OPENVERSE_REQUEST_INTERVAL_MS;
  if (slot > now) await new Promise(resolve => setTimeout(resolve, slot - now));
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(20000)
  });
  const remaining = Number(response.headers.get('x-ratelimit-available-anon_sustained'));
  if (Number.isFinite(remaining)) openverseRemainingToday = remaining;
  if (!response.ok) {
    const error = new Error('Openverse API HTTP ' + response.status);
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

function openverseLicense(result) {
  const license = String(result.license || '').toLowerCase();
  const version = String(result.license_version || '').trim();
  if (license === 'by') return 'CC BY' + (version ? ' ' + version : '');
  if (license === 'by-sa') return 'CC BY-SA' + (version ? ' ' + version : '');
  if (license === 'cc0') return 'CC0';
  if (license === 'pdm') return 'Public domain';
  return '';
}

function openverseCandidateMatches(term, result, id) {
  const title = clean(result.title);
  if (/\b(?:logo|poster|wallpaper|album cover|official music video|music video|screenshot)\b/i.test(title)) return false;
  if (OPENVERSE_TITLE_EXCLUSIONS[id] && OPENVERSE_TITLE_EXCLUSIONS[id].test(title)) return false;
  return !!titleScore(term, title);
}

async function findOpenverseReference(word) {
  if (openverseRemainingToday <= 0) {
    const error = new Error('Openverse anonymous daily request limit reached');
    error.status = 429;
    throw error;
  }
  const translated = Words.byId(word.id, 'en');
  const term = translated && translated.text && !/[\u3400-\u9fff]/.test(translated.text)
    ? translated.text
    : word.text;
  const query = OPENVERSE_ALIASES[word.id] || term;
  const url = new URL('https://api.openverse.org/v1/images/');
  url.searchParams.set('q', query);
  url.searchParams.set('license', 'by,by-sa,cc0,pdm');
  url.searchParams.set('page_size', '20');
  url.searchParams.set('filter_dead', 'true');
  const result = await fetchOpenverseJson(url);
  const candidates = (result.results || []).map(image => {
    const license = openverseLicense(image);
    if (!license || (!image.thumbnail && !image.url) || !image.foreign_landing_url || !image.creator) return null;
    if (!/^https:\/\//i.test(image.foreign_landing_url) || !openverseCandidateMatches(query, image, word.id)) return null;
    if (!/^https:\/\//i.test(image.thumbnail)) return null;
    if (image.width && image.height && Math.min(image.width, image.height) < 120) return null;
    return {
      page: { title: image.title || query },
      image: { downloadUrls: [image.thumbnail, image.url].filter(Boolean) },
      metadata: { Artist: { value: image.creator } },
      license,
      licenseUrl: image.license_url,
      sourceUrl: image.foreign_landing_url,
      provider: 'Openverse / ' + clean(image.source || image.provider),
      score: titleScore(query, image.title) ? 2 : 1
    };
  }).filter(Boolean).sort((a, b) => b.score - a.score);
  return candidates.length ? { term, candidates } : { term, missing: true };
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
  if (/^https:\/\//i.test(cleanedUrl)) return cleanedUrl;
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
    if (!/^https:\/\//i.test(item.sourceUrl || '')) item.sourceUrl = sourcePageUrl(item.fileTitle);
    item.licenseUrl = licensePageUrl(item.license, item.licenseUrl);
  });
  Object.keys(catalog).forEach(id => {
    if (catalog[id].status !== 'missing' || !MeaningReference.get(id)) return;
    catalog[id] = {
      status: 'semantic',
      method: 'composed-topic-sketch',
      word: Words.byId(id).text
    };
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
  ], { encoding: null, maxBuffer: 6 * 1024 * 1024, timeout: 40000 });
  if (result.status !== 0 || !result.stdout || result.stdout.length > 5 * 1024 * 1024) return false;
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
    author: clean(metadata.Artist && metadata.Artist.value) || 'Unknown image contributor',
    license: reference.license,
    licenseUrl: licensePageUrl(reference.license, metadata.LicenseUrl && metadata.LicenseUrl.value),
    sourceUrl: reference.sourceUrl || sourcePageUrl(reference.page.title.replace(/^File:/i, '')),
    sourceProvider: reference.provider || 'Wikimedia Commons',
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
  const retryOpenverse = process.argv.includes('--retry-openverse');
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
        (retryOpenverse && catalog[word.id] && ['missing', 'retry', 'semantic'].includes(catalog[word.id].status) &&
          (!retryCategories || retryCategories.has(word.cat))) ||
        (retryMissing && catalog[word.id] && catalog[word.id].status === 'missing' &&
          (!retryCategories || retryCategories.has(word.cat))) ||
        !catalog[word.id] || !['ready', 'missing', 'semantic'].includes(catalog[word.id].status))
  );
  const queue = words.slice(0, limit);
  const total = queue.length;
  fs.mkdirSync(ASSETS, { recursive: true });
  let completed = 0;
  let found = 0;
  let skipped = 0;
  let stopped = false;

  console.log('Searching ' + total + ' uncovered prompts; Wikimedia and Openverse limits are observed.');
  async function worker() {
    while (!stopped) {
      const word = queue.shift();
      if (!word) return;
      try {
        const reference = retryOpenverse
          ? await findOpenverseReference(word)
          : await findReference(word);
        if (reference.missing) {
          fs.rmSync(path.join(ASSETS, word.id), { recursive: true, force: true });
          catalog[word.id] = { status: 'missing' };
          skipped++;
        } else {
          const assetDir = path.join(ASSETS, word.id);
          let selected = null;
          for (const candidate of reference.candidates) {
            const urls = candidate.image.downloadUrls || [candidate.image.thumburl];
            for (const imageUrl of urls) {
              fs.mkdirSync(assetDir, { recursive: true });
              const downloadPath = path.join(assetDir, 'source.tmp');
              if (downloadImage(imageUrl, downloadPath) && renderSketch(downloadPath, assetDir)) {
                fs.rmSync(downloadPath, { force: true });
                selected = Object.assign({}, reference, candidate);
                break;
              }
              fs.rmSync(assetDir, { recursive: true, force: true });
            }
            if (selected) break;
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
          console.log('The image provider denied the request; pausing safely at ' + completed + ' prompts.');
          catalog[word.id] = { status: 'retry', error: error.message };
          stopped = true;
          return;
        }
        if (error.status === 429 && /Openverse/.test(error.message)) {
          console.log('Openverse rate limit reached; pausing safely at ' + completed + ' prompts.');
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
    Object.values(catalog).filter(item => item.status === 'semantic').length +
    ' semantic sketches, ' +
    Object.values(catalog).filter(item => item.status === 'missing').length +
    ' confirmed gaps, and ' +
    Object.values(catalog).filter(item => item.status === 'retry').length +
    ' retryable prompts.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
