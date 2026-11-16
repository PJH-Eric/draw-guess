/* ===== words.js — 題庫 =====
 *
 * 每一題只有文字：標準答案、也算對的別名、分類與難度。
 * 多語系（英文、簡中）在 words.en.js／words.zh-Hans.js，同一個 id 對應同一題。
 * 畫家看的參考範本不在這裡，在 refs/rNNNN.js（見 reference.js）。
 *
 * 這裡另外保留一組「形狀指令 → 筆畫」的轉換（pointsOf），給舊區塊的參考範本共用。
 * 座標一律落在 1000 × 1000 的正規化畫布裡（y 軸向下）。
 *   ['c',  cx, cy, r]                  圓
 *   ['e',  cx, cy, rx, ry, rot?]       橢圓（rot 為度數）
 *   ['r',  x, y, w, h]                 矩形
 *   ['l',  x1, y1, x2, y2]             直線
 *   ['p',  x1, y1, x2, y2, ...]        折線（不封口）
 *   ['s',  x1, y1, x2, y2, ...]        封閉多邊形
 *   ['a',  cx, cy, r, a0, a1]          圓弧（度數，0 = 右，順時針增加）
 *   ['ae', cx, cy, rx, ry, a0, a1]     橢圓弧
 *   ['ray',cx, cy, r0, r1, n, off?]    n 條放射線
 *   ['w',  x1, x2, y, amp, n]          波浪
 *   ['st', cx, cy, rOut, rIn, n]       星形
 *   ['d',  x, y, r?]                   小點
 *
 * 沒有 Node / DOM 相依：瀏覽器、伺服器與測試共用同一份。
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.Words = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var BOX = 1000;                 // 正規化畫布邊長
  var MASK_CHAR = '＿';            // 還沒提示的字，畫面上是一條底線
  var RAD = Math.PI / 180;

  var CATEGORIES = {
    animal:  { key: 'animal',  label: '動物',     emoji: '🐾' },
    food:    { key: 'food',    label: '食物',     emoji: '🍎' },
    home:    { key: 'home',    label: '生活用品', emoji: '🏠' },
    vehicle: { key: 'vehicle', label: '交通工具', emoji: '🚗' },
    nature:  { key: 'nature',  label: '自然景物', emoji: '🌤' },
    fun:     { key: 'fun',     label: '運動娛樂', emoji: '⚽' },
    emotion: { key: 'emotion', label: '心情感受', emoji: '💗' },
    idiom: { key: 'idiom', label: '成語故事', emoji: '📖' },
    phenomenon: { key: 'phenomenon', label: '自然現象', emoji: '🌪' },
    place: { key: 'place', label: '場所地點', emoji: '🏫' },
    expression: { key: 'expression', label: '表情動作', emoji: '😄' },
    job: { key: 'job', label: '職業人物', emoji: '👩‍🚒' },
    fantasy: { key: 'fantasy', label: '奇幻世界', emoji: '🪄' },
    action: { key: 'action', label: '活動行為', emoji: '🎭' },
    star: { key: 'star', label: '明星人物', emoji: '🌟' },
    movie: { key: 'movie', label: '電影作品', emoji: '🎬' },
    trend: { key: 'trend', label: '時事話題', emoji: '📰' },
    history: { key: 'history', label: '歷史人文', emoji: '🏛' },
    geography: { key: 'geography', label: '世界地理', emoji: '🗺' },
    civics: { key: 'civics', label: '公民社會', emoji: '⚖' },
    physics: { key: 'physics', label: '物理現象', emoji: '🧲' },
    astro: { key: 'astro', label: '天文宇宙', emoji: '🔭' },
    music: { key: 'music', label: '音樂世界', emoji: '🎵' },
    people: { key: 'people', label: '人物角色', emoji: '🧑' },
    body: { key: 'body', label: '身體部位', emoji: '🖐' },
    clothes: { key: 'clothes', label: '服裝配件', emoji: '👕' },
    festival: { key: 'festival', label: '節慶節日', emoji: '🏮' },
    taiwan: { key: 'taiwan', label: '台灣在地', emoji: '🧋' },
    toy: { key: 'toy', label: '玩具遊戲', emoji: '🧸' },
    school: { key: 'school', label: '學校文具', emoji: '🎒' },
    plant: { key: 'plant', label: '植物花草', emoji: '🌱' },
    ocean: { key: 'ocean', label: '海洋世界', emoji: '🌊' },
    tech: { key: 'tech', label: '科技3C', emoji: '💻' },
    tool: { key: 'tool', label: '工具五金', emoji: '🔧' },
    dino: { key: 'dino', label: '恐龍史前', emoji: '🦕' },
    fairy: { key: 'fairy', label: '童話故事', emoji: '🏰' },
    earth: { key: 'earth', label: '地球科學', emoji: '🌍' },
    culture: { key: 'culture', label: '人文文化', emoji: '🎎' }
  };
  var CATEGORY_KEYS = Object.keys(CATEGORIES);

  var DIFFICULTY = {
    1: { key: 1, label: '簡單', note: '常見又好畫' },
    2: { key: 2, label: '普通', note: '需要幾個特徵' },
    3: { key: 3, label: '困難', note: '很考驗畫技' }
  };

  /* ================================================================
     題庫
     text 為標準答案；alt 是也算對的說法（同義、俗稱、常見錯字）。
     ================================================================ */
  var LIST = [
    /* 動物 */
    { id: 'cat', text: '貓', alt: ['貓咪', '小貓'], cat: 'animal', diff: 1 },
    { id: 'dog', text: '狗', alt: ['狗狗', '小狗'], cat: 'animal', diff: 1 },
    { id: 'fish', text: '魚', alt: ['小魚'], cat: 'animal', diff: 1 },
    { id: 'bird', text: '鳥', alt: ['小鳥'], cat: 'animal', diff: 1 },
    { id: 'rabbit', text: '兔子', alt: ['兔', '小白兔'], cat: 'animal', diff: 1 },
    { id: 'pig', text: '豬', alt: ['小豬', '豬豬'], cat: 'animal', diff: 2 },
    { id: 'cow', text: '牛', alt: ['乳牛', '母牛'], cat: 'animal', diff: 2 },
    { id: 'elephant', text: '大象', alt: ['象'], cat: 'animal', diff: 2 },
    { id: 'snake', text: '蛇', alt: ['小蛇'], cat: 'animal', diff: 1 },
    { id: 'turtle', text: '烏龜', alt: ['海龜', '龜'], cat: 'animal', diff: 2 },
    { id: 'butterfly', text: '蝴蝶', alt: ['蝶'], cat: 'animal', diff: 2 },
    { id: 'crab', text: '螃蟹', alt: ['蟹'], cat: 'animal', diff: 2 },
    { id: 'giraffe', text: '長頸鹿', alt: [], cat: 'animal', diff: 2 },
    { id: 'penguin', text: '企鵝', alt: [], cat: 'animal', diff: 2 },
    { id: 'lion', text: '獅子', alt: ['獅'], cat: 'animal', diff: 2 },
    { id: 'frog', text: '青蛙', alt: ['蛙'], cat: 'animal', diff: 2 },
    { id: 'bee', text: '蜜蜂', alt: ['蜂'], cat: 'animal', diff: 2 },
    { id: 'owl', text: '貓頭鷹', alt: [], cat: 'animal', diff: 3 },
    { id: 'whale', text: '鯨魚', alt: ['鯨'], cat: 'animal', diff: 2 },
    { id: 'dinosaur', text: '恐龍', alt: ['暴龍'], cat: 'animal', diff: 2 },
    /* 食物 */
    { id: 'apple', text: '蘋果', alt: ['紅蘋果'], cat: 'food', diff: 1 },
    { id: 'banana', text: '香蕉', alt: [], cat: 'food', diff: 1 },
    { id: 'watermelon', text: '西瓜', alt: ['西瓜片'], cat: 'food', diff: 1 },
    { id: 'cake', text: '蛋糕', alt: ['生日蛋糕'], cat: 'food', diff: 2 },
    { id: 'icecream', text: '冰淇淋', alt: ['霜淇淋'], cat: 'food', diff: 1 },
    { id: 'burger', text: '漢堡', alt: ['漢堡包'], cat: 'food', diff: 2 },
    { id: 'pizza', text: '披薩', alt: ['比薩', 'pizza'], cat: 'food', diff: 2 },
    { id: 'bread', text: '麵包', alt: ['吐司'], cat: 'food', diff: 1 },
    { id: 'coffee', text: '咖啡', alt: ['咖啡杯'], cat: 'food', diff: 2 },
    { id: 'riceball', text: '飯糰', alt: ['御飯糰'], cat: 'food', diff: 2 },
    { id: 'sushi', text: '壽司', alt: ['握壽司'], cat: 'food', diff: 2 },
    { id: 'hotdog', text: '熱狗', alt: ['熱狗堡'], cat: 'food', diff: 2 },
    { id: 'donut', text: '甜甜圈', alt: ['多拿滋'], cat: 'food', diff: 1 },
    { id: 'grape', text: '葡萄', alt: [], cat: 'food', diff: 2 },
    { id: 'strawberry', text: '草莓', alt: [], cat: 'food', diff: 2 },
    { id: 'pineapple', text: '鳳梨', alt: ['菠蘿'], cat: 'food', diff: 3 },
    { id: 'egg', text: '雞蛋', alt: ['蛋', '荷包蛋'], cat: 'food', diff: 1 },
    { id: 'bubbletea', text: '珍珠奶茶', alt: ['珍奶', '波霸奶茶'], cat: 'food', diff: 3 },
    { id: 'lollipop', text: '棒棒糖', alt: [], cat: 'food', diff: 1 },
    { id: 'hotpot', text: '火鍋', alt: [], cat: 'food', diff: 3 },
    /* 生活用品 */
    { id: 'umbrella', text: '雨傘', alt: ['傘'], cat: 'home', diff: 1 },
    { id: 'clock', text: '時鐘', alt: ['鐘', '鬧鐘'], cat: 'home', diff: 1 },
    { id: 'book', text: '書本', alt: ['書'], cat: 'home', diff: 1 },
    { id: 'chair', text: '椅子', alt: ['凳子'], cat: 'home', diff: 1 },
    { id: 'table', text: '桌子', alt: ['書桌'], cat: 'home', diff: 1 },
    { id: 'cup', text: '杯子', alt: ['水杯', '馬克杯'], cat: 'home', diff: 1 },
    { id: 'bulb', text: '燈泡', alt: ['電燈泡'], cat: 'home', diff: 1 },
    { id: 'key', text: '鑰匙', alt: ['鎖匙'], cat: 'home', diff: 2 },
    { id: 'scissors', text: '剪刀', alt: [], cat: 'home', diff: 2 },
    /* 服裝配件 */
    { id: 'glasses', text: '眼鏡', alt: ['太陽眼鏡'], cat: 'clothes', diff: 1 },
    /* 生活用品 */
    { id: 'phone', text: '手機', alt: ['行動電話'], cat: 'home', diff: 1 },
    { id: 'tv', text: '電視', alt: ['電視機'], cat: 'home', diff: 2 },
    { id: 'toothbrush', text: '牙刷', alt: [], cat: 'home', diff: 2 },
    { id: 'broom', text: '掃把', alt: ['掃帚'], cat: 'home', diff: 2 },
    { id: 'mirror', text: '鏡子', alt: ['化妝鏡'], cat: 'home', diff: 2 },
    { id: 'pencil', text: '鉛筆', alt: ['筆'], cat: 'home', diff: 1 },
    /* 服裝配件 */
    { id: 'hat', text: '帽子', alt: ['棒球帽'], cat: 'clothes', diff: 1 },
    { id: 'shoe', text: '鞋子', alt: ['鞋', '球鞋'], cat: 'clothes', diff: 2 },
    /* 生活用品 */
    { id: 'fan', text: '電風扇', alt: ['風扇'], cat: 'home', diff: 3 },
    { id: 'washer', text: '洗衣機', alt: [], cat: 'home', diff: 3 },
    /* 交通工具 */
    { id: 'car', text: '汽車', alt: ['車', '轎車'], cat: 'vehicle', diff: 1 },
    { id: 'bicycle', text: '腳踏車', alt: ['自行車', '單車'], cat: 'vehicle', diff: 2 },
    { id: 'airplane', text: '飛機', alt: [], cat: 'vehicle', diff: 2 },
    { id: 'boat', text: '船', alt: ['小船'], cat: 'vehicle', diff: 1 },
    { id: 'train', text: '火車', alt: ['列車'], cat: 'vehicle', diff: 2 },
    { id: 'bus', text: '公車', alt: ['巴士'], cat: 'vehicle', diff: 2 },
    { id: 'motorcycle', text: '摩托車', alt: ['機車'], cat: 'vehicle', diff: 3 },
    { id: 'balloon', text: '熱氣球', alt: [], cat: 'vehicle', diff: 2 },
    { id: 'rocket', text: '火箭', alt: [], cat: 'vehicle', diff: 2 },
    { id: 'helicopter', text: '直升機', alt: ['直昇機'], cat: 'vehicle', diff: 3 },
    { id: 'truck', text: '卡車', alt: ['貨車'], cat: 'vehicle', diff: 2 },
    { id: 'ambulance', text: '救護車', alt: [], cat: 'vehicle', diff: 2 },
    { id: 'submarine', text: '潛水艇', alt: ['潛艇'], cat: 'vehicle', diff: 3 },
    { id: 'skateboard', text: '滑板', alt: [], cat: 'vehicle', diff: 2 },
    { id: 'tricycle', text: '三輪車', alt: [], cat: 'vehicle', diff: 2 },
    { id: 'sailboat', text: '帆船', alt: [], cat: 'vehicle', diff: 2 },
    { id: 'cablecar', text: '纜車', alt: ['空中纜車'], cat: 'vehicle', diff: 3 },
    { id: 'firetruck', text: '消防車', alt: [], cat: 'vehicle', diff: 2 },
    { id: 'tractor', text: '拖拉機', alt: ['耕耘機'], cat: 'vehicle', diff: 3 },
    { id: 'canoe', text: '獨木舟', alt: ['小艇'], cat: 'vehicle', diff: 3 },
    /* 自然景物 */
    { id: 'sun', text: '太陽', alt: ['日'], cat: 'nature', diff: 1 },
    { id: 'moon', text: '月亮', alt: ['月', '彎月', '月球'], cat: 'nature', diff: 1 },
    { id: 'star', text: '星星', alt: ['星'], cat: 'nature', diff: 1 },
    { id: 'cloud', text: '雲', alt: ['雲朵', '白雲'], cat: 'nature', diff: 1 },
    /* 自然現象 */
    { id: 'rain', text: '下雨', alt: ['雨', '雨天'], cat: 'phenomenon', diff: 1 },
    { id: 'rainbow', text: '彩虹', alt: [], cat: 'phenomenon', diff: 1 },
    /* 自然景物 */
    { id: 'tree', text: '樹', alt: ['大樹', '樹木'], cat: 'nature', diff: 1 },
    { id: 'flower', text: '花', alt: ['花朵', '小花'], cat: 'nature', diff: 1 },
    { id: 'mountain', text: '山', alt: ['高山'], cat: 'nature', diff: 1 },
    { id: 'sea', text: '大海', alt: ['海', '海洋'], cat: 'nature', diff: 2 },
    /* 自然現象 */
    { id: 'lightning', text: '閃電', alt: ['雷電', '打雷'], cat: 'phenomenon', diff: 1 },
    /* 自然景物 */
    { id: 'snowman', text: '雪人', alt: ['雪寶'], cat: 'nature', diff: 2 },
    { id: 'volcano', text: '火山', alt: [], cat: 'nature', diff: 2 },
    { id: 'island', text: '小島', alt: ['島', '無人島'], cat: 'nature', diff: 2 },
    { id: 'desert', text: '沙漠', alt: [], cat: 'nature', diff: 3 },
    { id: 'waterfall', text: '瀑布', alt: [], cat: 'nature', diff: 3 },
    { id: 'cactus', text: '仙人掌', alt: [], cat: 'nature', diff: 2 },
    { id: 'mushroom', text: '蘑菇', alt: ['香菇'], cat: 'nature', diff: 1 },
    { id: 'maple', text: '楓葉', alt: ['葉子', '樹葉'], cat: 'nature', diff: 2 },
    /* 自然現象 */
    { id: 'tornado', text: '龍捲風', alt: [], cat: 'phenomenon', diff: 3 },
    /* 運動娛樂 */
    { id: 'soccer', text: '足球', alt: [], cat: 'fun', diff: 1 },
    { id: 'basketball', text: '籃球', alt: [], cat: 'fun', diff: 1 },
    { id: 'racket', text: '球拍', alt: ['網球拍'], cat: 'fun', diff: 2 },
    /* 音樂世界 */
    { id: 'guitar', text: '吉他', alt: ['電吉他'], cat: 'music', diff: 2 },
    { id: 'drum', text: '鼓', alt: ['爵士鼓'], cat: 'music', diff: 2 },
    /* 運動娛樂 */
    { id: 'kite', text: '風箏', alt: [], cat: 'fun', diff: 2 },
    { id: 'swing', text: '鞦韆', alt: ['盪鞦韆'], cat: 'fun', diff: 2 },
    { id: 'slide', text: '溜滑梯', alt: ['滑梯'], cat: 'fun', diff: 2 },
    { id: 'ferriswheel', text: '摩天輪', alt: [], cat: 'fun', diff: 3 },
    { id: 'dice', text: '骰子', alt: ['色子'], cat: 'fun', diff: 1 },
    { id: 'cards', text: '撲克牌', alt: ['紙牌'], cat: 'fun', diff: 2 },
    { id: 'puzzle', text: '拼圖', alt: [], cat: 'fun', diff: 2 },
    /* 音樂世界 */
    { id: 'note', text: '音符', alt: [], cat: 'music', diff: 1 },
    { id: 'microphone', text: '麥克風', alt: [], cat: 'music', diff: 2 },
    /* 生活用品 */
    { id: 'camera', text: '相機', alt: ['照相機'], cat: 'home', diff: 2 },
    /* 運動娛樂 */
    { id: 'trophy', text: '獎盃', alt: ['冠軍盃'], cat: 'fun', diff: 2 },
    /* 生活用品 */
    { id: 'computer', text: '電腦', alt: ['筆電'], cat: 'home', diff: 2 },
    /* 音樂世界 */
    { id: 'piano', text: '鋼琴', alt: ['電子琴'], cat: 'music', diff: 2 },
    /* 運動娛樂 */
    { id: 'bowling', text: '保齡球', alt: [], cat: 'fun', diff: 3 },
    { id: 'jumprope', text: '跳繩', alt: [], cat: 'fun', diff: 2 },
    /* 身體部位 */
    { id: 'face', text: '臉', alt: ['臉蛋', '臉孔'], cat: 'body', diff: 1 },
    { id: 'eye', text: '眼睛', alt: ['眼'], cat: 'body', diff: 1 },
    { id: 'hand', text: '手', alt: ['手掌'], cat: 'body', diff: 1 },
    /* 場所地點 */
    { id: 'house', text: '房子', alt: ['房屋', '家'], cat: 'place', diff: 1 },
    /* 人物角色 */
    { id: 'person', text: '小朋友', alt: ['小孩', '兒童'], cat: 'people', diff: 1 },
    /* 服裝配件 */
    { id: 'shirt', text: 'T恤', alt: ['短袖', '上衣', 't-shirt'], cat: 'clothes', diff: 1 },
    /* 節慶節日 */
    { id: 'lantern', text: '燈籠', alt: ['紅燈籠'], cat: 'festival', diff: 1 },
    { id: 'xmastree', text: '聖誕樹', alt: [], cat: 'festival', diff: 1 }
  ];

  /* ================================================================
     擴充題：一個字串放多題，用空白分開；「|」後面是也算對的別名。
     分類有 hard: true 的只能放第 3 層（困難）。
     ================================================================ */
  var BANKS = {
    animal: {
      1: [
        '熊 老虎 猴子 蝸牛 鯊魚 金魚 章魚 鴨子|鴨',
        '小雞 老鼠|鼠 馬 綿羊|羊 蜘蛛 螞蟻 瓢蟲 毛毛蟲'
      ],
      2: [
        '貓熊|熊貓 獵豹 猩猩 松鼠 刺蝟 海豚 水母',
        '蝦子|蝦 龍蝦 海馬 鵝 公雞 母雞 老鷹 鸚鵡',
        '孔雀 天鵝 燕子 啄木鳥 紅鶴 鴕鳥 駱駝 斑馬',
        '河馬 犀牛 梅花鹿|鹿 山羊 狐狸 狼 無尾熊 袋鼠',
        '樹懶 浣熊 海豹 北極熊 蝙蝠 倉鼠 蜻蜓 蟬',
        '蚯蚓 鱷魚 蜥蜴 壁虎 小丑魚 河豚 蝌蚪',
        '螢火蟲 蚊子 蒼蠅 蟑螂 螳螂 羊駝 貝殼 海星'
      ],
      3: [
        '變色龍 水獺 鰻魚 比目魚 魟魚 海葵 珊瑚 海膽',
        '蛤蜊 牡蠣|生蠔 花枝|烏賊 蟾蜍 蠑螈 穿山甲 食蟻獸',
        '犰狳 狒狒 黑猩猩 長臂猿 野豬 麋鹿 馴鹿 羚羊',
        '水牛 氂牛 雪豹 美洲獅 土撥鼠 鼴鼠 黃鼠狼 臭鼬',
        '海鷗 信天翁 獨角仙 蜈蚣 蟋蟀 鮭魚 鮪魚 驢子 火雞'
      ]
    },
    food: {
      1: [
        '橘子|柳丁 檸檬 櫻桃 番茄|蕃茄 玉米 紅蘿蔔|胡蘿蔔',
        '南瓜 茄子 香腸 薯條 布丁 餅乾 巧克力',
        '棉花糖 牛奶 果汁 湯圓 包子 水餃|餃子 雞腿',
        '爆米花 梨子|梨 椰子 花生 麵條|麵 泡麵 白飯|米飯|飯',
        '糖果'
      ],
      2: [
        '芒果 水蜜桃|桃子 奇異果|獼猴桃 木瓜 哈密瓜 柚子',
        '蓮霧 芭樂|番石榴 楊桃 藍莓 柿子 白蘿蔔 馬鈴薯|洋芋',
        '地瓜|番薯 青椒 花椰菜|青花菜 高麗菜 洋蔥 大蒜',
        '辣椒 豆腐 稀飯|粥 拉麵 饅頭 蛋餅 鍋貼',
        '小籠包 肉粽|粽子 月餅 鳳梨酥 蛋塔 果凍 洋芋片',
        '炸雞 牛排 培根 起司|乳酪 汽水 紅茶 豆漿 蜂蜜',
        '三明治 貝果 可頌 沙拉 濃湯 火腿 炒飯',
        '雞排 刨冰 豆花 冰棒 奶茶 可麗餅 鬆餅',
        '泡芙 銅鑼燒 麻糬 貢丸 滷蛋 便當 燒餅 油條',
        '紅豆餅 雞蛋糕 章魚燒 鯛魚燒 馬卡龍 聖代 奶昔',
        '年糕 優格 奶油 果醬 開心果 核桃 瓜子 腰果',
        '葡萄乾 杏仁 牛軋糖 綠茶'
      ],
      3: [
        '義大利麵 蔥油餅 臭豆腐 滷肉飯 牛肉麵 蚵仔煎',
        '大腸麵線 鹹酥雞|鹽酥雞 滷味 關東煮 咖哩飯|咖哩',
        '壽喜燒 味噌湯 燒賣 肉圓 碗粿 米糕 油飯',
        '刈包 胡椒餅 蔥抓餅 豬血糕 蚵仔麵線 擔仔麵',
        '炸醬麵 餛飩|雲吞 米粉 鍋燒麵 排骨飯 雞腿飯',
        '蘿蔔糕 芋頭糕 腸粉 叉燒包 蝦餃 塔可餅 千層麵',
        '燉飯 炸魚薯條 漢堡排 牛丼 親子丼 天婦羅 烏龍麵',
        '蕎麥麵 大阪燒 泡菜 石鍋拌飯 韓式炸雞 提拉米蘇',
        '蘋果派 春捲 冰沙 紅豆湯 仙草 愛玉'
      ]
    },
    home: {
      1: [
        '沙發 床 枕頭 碗 盤子 湯匙 叉子 筷子',
        '牙膏 毛巾 梳子 檯燈 蠟燭 鎖頭|鎖 窗戶 梯子',
        '水桶 垃圾桶 衛生紙 信封 尺 橡皮擦 電池 冰箱',
        '相框 花瓶 手電筒 平底鍋 水壺|茶壺'
      ],
      2: [
        '衣櫃 烤箱 微波爐 電鍋 拖把 肥皂 吸塵器 熨斗',
        '菜刀 砧板 衣架 鈕扣 針線 拉鍊 筆記本',
        '釘書機 膠水 日曆 溫度計 插座 打火機 火柴',
        '熱水瓶 果汁機 鍋鏟 刷子 體重計 地圖 抱枕',
        '地毯 蚊香 冷氣 鍋蓋 量杯 繃帶 書架 門把 音響',
        '鍵盤 螢幕 鋸子 捲尺 扇子 棉被 暖爐|電暖器 花盆',
        '澆花器 滑鼠 門鈴 保險箱 鐵鎚|槌子 扳手 油漆刷',
        '印表機 充電器 延長線 曬衣架 吹風機 指甲剪',
        '行李箱 便利貼 保溫瓶 開瓶器 遙控器 滅火器 工具箱',
        '螺絲起子 刮鬍刀 電蚊拍 投影機 急救箱 棉花棒',
        '耳機 收音機 望遠鏡 指南針|羅盤 抹布 郵票 鑰匙圈'
      ],
      3: [
        '洗碗機 電磁爐 熱水器 飲水機 除濕機 咖啡機',
        '烤麵包機 保鮮膜 保鮮盒 鋁箔紙 菜瓜布 洗碗精 洗衣精',
        '沐浴乳 洗髮精 烘衣機 清淨機|空氣清淨機 抽油煙機 瓦斯爐',
        '氣炸鍋 淨水器 製冰機 按摩椅 掃地機|掃地機器人 監視器',
        '路由器 掃描器 捲髮棒 曬衣夾 收納箱 置物櫃',
        '篩子 水平儀 園藝剪 烤肉架 豆漿機 洗衣籃 垃圾袋'
      ]
    },
    vehicle: {
      1: [
        '捷運|地鐵|mrt 計程車|小黃 警車 校車 高鐵 郵輪|遊輪 漁船',
        '嬰兒車 輪椅 賽車 垃圾車'
      ],
      2: [
        '推土機 挖土機|怪手 水泥車 露營車 吉普車 電動車 小貨車',
        '快艇 氣墊船 降落傘 娃娃車 馬車 滑翔機 灑水車',
        '油罐車 拖板車 碰碰車 飛行傘 越野車 起重機|吊車 敞篷車',
        '蒸汽火車 遊覽車 太空船 手推車 獨輪車 雙層巴士 飛船',
        '雪橇 竹筏 渡輪 直排輪 登山車'
      ],
      3: [
        '滑翔翼 拖吊車 冷凍車 聯結車 單軌列車 磁浮列車',
        '蒸汽船 摩托艇 電動滑板 舢舨 太空梭'
      ]
    },
    nature: {
      1: [
        '天空 河流|河 森林 石頭 草地|草 雪花 流星 花瓣',
        '向日葵 玫瑰 椰子樹 松樹 地球 池塘 海灘|沙灘'
      ],
      2: [
        '溪流 竹林 山洞 冰山 沼澤 泥土 樹枝 果實',
        '楓樹 藤蔓 星空 雲海 樹幹 年輪 蕨類 菊花 梅花',
        '麥田 樹苗 盆地 高原 海岸 礁石 山坡 水窪',
        '湖泊|湖 草原 山谷 懸崖 冰河 綠洲 沙丘 樹根',
        '花園 種子 櫻花 鬱金香 百合 蒲公英 荷花 苔蘚',
        '露珠 山脈 樹皮 松果 荷葉 蘭花 牽牛花',
        '桃花 稻田 竹筍 落葉 峽谷 草叢 泉水 冰塊'
      ],
      3: [
        '平原 丘陵 沙洲 苔原 枯枝'
      ]
    },
    fun: {
      1: [
        '棒球 排球 網球 桌球 羽毛球 帳篷',
        '泡泡 積木 泰迪熊|玩偶 氣球 蹺蹺板 飛盤 陀螺',
        '機器人'
      ],
      2: [
        '撞球 毽子 彈珠 象棋 扭蛋 彩帶 畫架 畫筆',
        '水彩 蠟筆 睡袋 風車 單槓 跳高 鉛球 碼表',
        '球門 球網 泳鏡|蛙鏡 貼紙 鬼屋 射箭 桌遊',
        '游泳圈 滑雪板 啞鈴 跑步機 玩具車 圍棋 西洋棋',
        '麻將 營火 跳跳床|彈跳床 飛鏢 雙槓 跳遠 標槍',
        '接力棒 哨子 籃框 跑道 浮板 漫畫 海盜船',
        '打地鼠 跳棋 沙灘球 舉重 釣竿 溜冰鞋 呼拉圈',
        '洋娃娃|娃娃 魔術方塊 旋轉木馬 雲霄飛車 夾娃娃機',
        '衝浪板 拳擊手套 沙坑'
      ],
      3: [
        '擊劍 體操 高爾夫 躲避球 風帆 套圈圈',
        '計分板 保齡球瓶 調色盤 素描本'
      ]
    },
    emotion: {
      1: ['開心|快樂|高興 傷心|難過 生氣|憤怒 害怕'],
      2: [
        '驚訝|吃驚 害羞 興奮 緊張 無聊 疲倦|累 得意 委屈 孤單|寂寞 幸福 感動 驕傲',
        '煩惱 尷尬 驚喜 勇敢 心動 痛苦 舒服'
      ],
      3: [
        '失望 焦慮 嫉妒 期待 溫暖 好奇 自信 感謝 沮喪 輕鬆|放鬆 後悔 滿足 甜蜜 羨慕 雀躍',
        '絕望 懷念'
      ]
    },
    idiom: {
      hard: true,
      3: [
        '守株待兔 畫蛇添足 井底之蛙 亡羊補牢 狐假虎威 掩耳盜鈴',
        '對牛彈琴 刻舟求劍 杯弓蛇影 鷸蚌相爭 塞翁失馬 盲人摸象',
        '愚公移山 拔苗助長 葉公好龍 三顧茅廬 臥虎藏龍',
        '畫龍點睛 一箭雙鵰 百發百中 馬到成功 名落孫山',
        '破釜沉舟 臥薪嘗膽 完璧歸趙 負荊請罪 紙上談兵 四面楚歌 指鹿為馬',
        '望梅止渴 草木皆兵 胸有成竹 雪中送炭 錦上添花 火上加油',
        '如魚得水 一石二鳥 九牛一毛 雞飛狗跳 龍飛鳳舞 鳥語花香',
        '風和日麗 春暖花開 冰天雪地 水落石出 滴水穿石 走馬看花',
        '畫餅充飢 望子成龍 狗急跳牆 虎頭蛇尾 打草驚蛇 引狼入室',
        '螳螂捕蟬 老馬識途 如虎添翼 狼吞虎嚥 七上八下 五顏六色',
        '七嘴八舌 手忙腳亂 目瞪口呆 面紅耳赤 心花怒放 廢寢忘食 自相矛盾',
        '班門弄斧 東施效顰 濫竽充數 南轅北轍 守口如瓶 雪上加霜 光陰似箭',
        '滄海桑田 世外桃源 一目瞭然 半斤八兩 瓜熟蒂落 坐井觀天',
        '目不轉睛 聚沙成塔 眼花撩亂 柳暗花明 開門見山 一飛沖天 生龍活虎',
        '害群之馬 山明水秀 三心二意 一心一意 眼明手快 大開眼界'
      ]
    },
    phenomenon: {
      1: ['下雪 日出 日落 海浪 地震 颱風'],
      2: [
        '雷雨 極光 濃霧|霧 月蝕|月食 日蝕|日食 洪水|淹水',
        '山崩 雪崩 潮汐 海嘯 冰雹 乾旱 晚霞 彗星',
        '流星雨 暴風雪 沙塵暴 火山爆發 土石流 結冰',
        '冰柱 陣雨 暴雨|大雨 滿月 隕石 熱浪'
      ],
      3: [
        '海市蜃樓 焚風 霧霾 寒流 梅雨 季風 日暈 月暈',
        '結霜|霜 漲潮 退潮 朝霞 黎明 黃昏 毛毛雨 狂風 積雪'
      ]
    },
    place: {
      1: [
        '學校 醫院 教室 公園 超市 機場 橋 游泳池',
        '動物園 遊樂園 城堡 燈塔 廚房 浴室'
      ],
      2: [
        '郵局 市場 餐廳 書店 操場 廟宇|廟 農場 果園',
        '溫室 客廳 樓梯 屋頂 隧道 涼亭 走廊 藥局',
        '天橋 圖書館 銀行 夜市 麵包店 花店 水族館 美術館',
        '體育館 車站 港口 加油站 消防局 教堂 牧場',
        '菜園 臥室 陽台 電梯 牙科 理髮店 玩具店',
        '水果攤 飲料店 健身房 球場 溜冰場 露營區',
        '便利商店|超商 咖啡廳 電影院 博物館 停車場 警察局',
        '摩天大樓|大樓 噴水池 早餐店 速食店 寵物店 滑雪場'
      ],
      3: [
        '五金行 網咖 甜點店 候車亭 診所 洗衣店 文具店',
        '觀景台 地下道'
      ]
    },
    expression: {
      1: ['微笑 哭泣|哭|大哭 大笑 眨眼 揮手 比讚|按讚 擁抱'],
      2: [
        '嘟嘴 嘆氣 搖頭 點頭 飛吻 傻笑 發呆 跺腳 比心 抓頭 皺眉 打噴嚏 咳嗽',
        '鼓掌|拍手 敬禮 握手 撒嬌 瞪眼 偷笑 大叫 流口水 臉紅 鬼臉 摀嘴 擊掌',
        '聳肩 伸懶腰 吐舌頭 打哈欠 剪刀手|比耶 吹口哨 打瞌睡'
      ],
      3: ['苦笑 瞇眼 抿嘴 搓手 磨牙 挑眉 張嘴 裝可愛']
    },
    job: {
      1: ['醫生 老師 警察 消防員 廚師 畫家 歌手 農夫'],
      2: [
        '郵差 護士|護理師 獸醫 法官 主播 演員 舞者 教練 漁夫 店員',
        '機長 船長 太空人 飛行員 工程師 律師 記者',
        '作家 導演 指揮家 裁判 獵人 木匠 水電工 理髮師',
        '司機 救生員 園丁 清潔員 快遞員 保全 咖啡師 校長',
        '攝影師 魔術師 科學家 建築師 音樂家 運動員 麵包師',
        '服務生 空服員 潛水員 牙醫|牙醫師 甜點師 美容師',
        '插畫家 主持人'
      ],
      3: [
        '工人 牧羊人 秘書 心理師 雕刻家 書法家 圖書館員 考古學家',
        '探險家 銀行員 調酒師 花藝師 按摩師 瑜珈老師 復健師 漫畫家',
        '陶藝家 翻譯員 模特兒 設計師 教授 藥師'
      ]
    },
    fantasy: {
      1: ['公主 國王 天使 海盜 巨龍|龍 人魚|美人魚 外星人 幽靈|鬼'],
      2: [
        '仙女 狼人 殭屍 巫婆 騎士 王子 女王 忍者 超人 惡魔 魔法棒 藏寶圖 寶箱',
        '飛馬 火龍 魔法師|巫師 鳳凰 時光機 魔毯 小精靈',
        '獨角獸 吸血鬼 小矮人 木乃伊 水晶球 飛天掃帚 神燈 龍蛋 飛碟|ufo',
        '孫悟空 嫦娥 巨人 雪怪 財神 月老'
      ],
      3: [
        '樹人 獅鷲 武士 英雄 妖怪 天狗 雷神 哪吒 玉兔 牛郎 媽祖',
        '海怪 傳送門 海妖 樹精 河童 狐仙 龍王 沙悟淨 織女',
        '半人馬 九尾狐 魔法書 許願池 隱形斗篷 石像鬼 三頭犬 獨眼巨人',
        '豬八戒 唐三藏 土地公 諾亞方舟'
      ]
    },
    action: {
      1: ['跑步 睡覺 游泳 釣魚 刷牙 洗澡 吃飯 唱歌 跳舞 看書 拍照 畫畫'],
      2: [
        '爬山 種花 喝水 掃地 洗碗 澆花 散步 爬樹 滑雪',
        '潛水 露營 野餐 寫字 剪紙 排隊 上學 做夢 搬家',
        '種菜 餵鳥 洗車 煮飯 打針 踢足球 洗手 拖地 遛狗',
        '溜冰 衝浪 划船 烤肉 購物 摺紙 打電話',
        '玩遊戲 打呼 溜滑板 跳格子 吹蠟燭 拆禮物 寄信 餵魚',
        '摺衣服 買菜 泡茶 剪頭髮 打籃球 做蛋糕 放風箏',
        '彈吉他 騎腳踏車 曬衣服 堆雪人 看電視 搭飛機 過馬路',
        '打棒球 堆沙堡 捉迷藏 吹泡泡 爬樓梯 看醫生'
      ],
      3: [
        '放學 許願 寫卡片 沖咖啡 搭電梯 逛夜市 打排球',
        '打羽球 扮家家酒 包禮物 擦窗戶 燙衣服 烤餅乾 量體溫 等紅燈'
      ]
    },
    star: {
      hard: true,
      3: [
        '周杰倫 蔡依林 五月天 張惠妹|阿妹 林俊傑 劉德華 成龍 周星馳 梁朝偉',
        '張學友 郭富城 鄧紫棋 蕭敬騰 陳奕迅 李安 楊紫瓊 舒淇 林志玲',
        '金城武 周潤發 李小龍 甄子丹 張曼玉 鞏俐 章子怡',
        '費玉清 鳳飛飛 鄧麗君 伍佰 張國榮 泰勒絲|泰勒 碧昂絲 瑪丹娜 麥可傑克森 貓王 披頭四',
        '湯姆克魯斯 李奧納多 布萊德彼特 艾瑪華森 基努李維',
        '奧黛麗赫本 瑪麗蓮夢露 卓別林 憨豆先生 麥可喬丹',
        '梅西 貝克漢 費德勒 大谷翔平 王建民 戴資穎',
        '林依晨 桂綸鎂 謝金燕 孫燕姿 周華健 張震嶽 陳綺貞 盧廣仲 楊丞琳 蕭亞軒',
        '徐若瑄 張小燕 劉若英 梁靜茹 江蕙 任賢齊 女神卡卡 愛黛兒 艾德希蘭 席琳狄翁',
        '巨石強森 湯姆漢克斯 梅莉史翠普 娜塔莉波曼 小勞勃道尼'
      ]
    },
    movie: {
      hard: true,
      3: [
        '鐵達尼號 阿凡達 侏羅紀公園 星際大戰 哈利波特 魔戒',
        '玩具總動員 冰雪奇緣 獅子王 海底總動員 怪獸電力公司 天外奇蹟',
        '腦筋急轉彎 無敵破壞王 動物方城市 汽車總動員 超人特攻隊 瓦力 花木蘭',
        '阿拉丁 美女與野獸 小美人魚 白雪公主 睡美人 灰姑娘 彼得潘',
        '木偶奇遇記 龍貓 神隱少女 天空之城 魔女宅急便 蜘蛛人 蝙蝠俠 鋼鐵人 美國隊長',
        '雷神索爾 復仇者聯盟 黑豹 神力女超人 變形金剛 玩命關頭 捍衛戰士',
        '回到未來 教父 大白鯊 駭客任務 全面啟動 星際效應 阿甘正傳',
        '功夫熊貓 馴龍高手 異形 魔鬼終結者 靈魂急轉彎 可可夜總會 勇敢傳說',
        '海洋奇緣 魔髮奇緣 泰山 小飛象 小鹿斑比 名偵探柯南|柯南',
        '火影忍者 七龍珠 鬼滅之刃 灌籃高手 櫻桃小丸子 蠟筆小新 美少女戰士 聖鬥士星矢',
        '航海王|海賊王 寶可夢|神奇寶貝 皮卡丘 海角七號 賽德克巴萊 艋舺 少林足球 無間道'
      ]
    },
    trend: {
      hard: true,
      3: [
        '人工智慧|ai 聊天機器人 自動駕駛 太空旅行 虛擬實境|vr',
        '元宇宙 加密貨幣|比特幣 行動支付 外送員 網購 直播',
        '短影音 社群媒體 網紅 遠距上班 視訊會議 線上課程',
        '智慧手錶 無人機 智慧音箱 電子書 太陽能板 風力發電',
        '資源回收 環保杯 快篩 疫苗 共享單車|youbike 世界盃 奧運',
        '演唱會 行動電源 自拍棒 電競 電動機車 充電樁',
        '語音助理 智慧家電 穿戴裝置 折疊手機 虛擬偶像 網路詐騙',
        '手遊 串流影音 電子發票'
      ]
    },
    history: {
      hard: true,
      3: [
        '萬里長城|長城 兵馬俑 金字塔 人面獅身 羅馬競技場 比薩斜塔',
        '巨石陣 復活節島 馬丘比丘 吳哥窟 泰姬瑪哈陵',
        '紫禁城|故宮 敦煌 絲路 大運河 火藥 造紙術 活字印刷',
        '蒸汽機 哥倫布 麥哲倫 馬可波羅 孔子 老子 孫子兵法 秦始皇 武則天 諸葛亮',
        '關羽 張飛 曹操 劉備 岳飛 鄭成功 李白 杜甫 蘇東坡 王羲之 畢卡索',
        '梵谷 達文西 莫札特 貝多芬 愛因斯坦 牛頓 愛迪生',
        '居禮夫人 南丁格爾 萊特兄弟 伽利略 拿破崙 成吉思汗 甲骨文 法國大革命',
        '柏林圍牆 羅塞塔石碑 木馬屠城 龐貝城 鴉片戰爭 辛亥革命 鄭和 張騫',
        '司馬遷 孫中山 華盛頓 林肯 邱吉爾 莎士比亞 柏拉圖 孟子 莊子 包青天'
      ]
    },
    geography: {
      hard: true,
      3: [
        '台灣|臺灣 日本 韓國 泰國 越南 新加坡 印度 埃及 法國 英國 德國 義大利 西班牙 荷蘭 瑞士 希臘',
        '俄羅斯 美國 加拿大 墨西哥 巴西 阿根廷 澳洲 紐西蘭 肯亞 南非 冰島 芬蘭 土耳其 蒙古',
        '富士山 喜馬拉雅山 聖母峰 撒哈拉沙漠 亞馬遜河',
        '尼羅河 長江 黃河 密西西比河 大峽谷 尼加拉瀑布 死海',
        '貝加爾湖 赤道 北極 南極 熱帶雨林 大堡礁 地中海',
        '中國 菲律賓 馬來西亞 印尼 緬甸 尼泊爾 以色列 瑞典 挪威 丹麥 波蘭 捷克 奧地利 葡萄牙',
        '愛爾蘭 智利 秘魯 古巴 摩洛哥 衣索比亞 杜拜 香港 澳門 艾菲爾鐵塔|巴黎鐵塔',
        '自由女神 大笨鐘 雪梨歌劇院 白宮 聖家堂'
      ]
    },
    civics: {
      hard: true,
      3: [
        '投票 選舉 憲法 法律 國旗 國會 法院 判決 納稅|繳稅 身分證',
        '護照 戶口名簿 公投 市長 里長 公所 兵役 健保卡 駕照 垃圾分類',
        '交通號誌 斑馬線 紅綠燈 消防演習 地震演習 陪審團 志工 安全帶 酒駕',
        '無障礙 義務教育 罰單'
      ]
    },
    physics: {
      hard: true,
      3: [
        '重力|地心引力 摩擦力 浮力 反射 折射 蒸發 凝結 槓桿 滑輪 彈簧 靜電',
        '電流 磁鐵 稜鏡 回聲 沸騰 影子 熱脹冷縮 表面張力 毛細現象',
        '自由落體 拋物線 齒輪 斜坡 天平 擺錘 水壓 氣壓 離心力',
        '虹吸 紫外線 雷射 凸透鏡 凹透鏡 放大鏡 聲波 超音波 電磁鐵 結晶'
      ]
    },
    astro: {
      hard: true,
      3: [
        '太陽系 銀河系|銀河 黑洞 超新星 星座 北斗七星 獵戶座 北極星 火星 金星 木星 水星 土星',
        '天王星 海王星 冥王星 月相 隕石坑 太空站 太空衣|太空裝 登月',
        '人造衛星|衛星 哈雷彗星 天文台 太空望遠鏡 小行星 月球車 火箭發射',
        '無重力 天狼星 織女星 牛郎星 星象儀 火星車 太空垃圾 星系 太陽黑子'
      ]
    },
    music: {
      1: [
        '喇叭 鈴鐺 小提琴 口琴 三角鐵 唱片|黑膠 鼓棒',
        '沙鈴 木琴'
      ],
      2: [
        '五線譜 指揮棒 樂譜 大提琴 長笛 手風琴 鈴鼓',
        '豎琴 貝斯 響板 手鼓 小號 鐵琴 薩克斯風',
        '休止符 高音譜號 節拍器 音樂盒 豎笛|單簧管 合唱團 樂團',
        '搖滾'
      ],
      3: [
        '饒舌 爵士 古典樂 搖籃曲 圓舞曲 國歌 卡農',
        '兒歌 錄音室 二重唱 獨奏 雙簧管 伸縮號',
        '中提琴 低音提琴 法國號 交響樂團 音樂會 流行歌',
        '進行曲 生日快樂歌 電子音樂 街頭藝人 打擊樂'
      ]
    },
    people: {
      1: ['爸爸 媽媽 嬰兒|寶寶 爺爺 奶奶'],
      2: ['哥哥 姊姊|姐姐 弟弟 妹妹 外公 外婆 老人 新娘 新郎 雙胞胎 學生 壽星 觀眾 粉絲'],
      3: [
        '叔叔 阿姨 舅舅 表哥 同學 鄰居 朋友 客人 隊長 室友 導遊 路人 偶像 青少年 班長',
        '房東 顧客 夥伴 對手 老闆 小學生 大學生 畢業生 評審 保母'
      ]
    },
    body: {
      1: ['鼻子 嘴巴 耳朵 牙齒 腳|腳丫 頭髮 手指 腳印'],
      2: [
        '眉毛 舌頭 脖子 肚子 肚臍 屁股 膝蓋 手臂 指甲',
        '骨頭 心臟 大腦 肌肉 鬍子 睫毛 拳頭 嘴唇 酒窩'
      ],
      3: ['肩膀 手肘 腳踝 下巴 額頭 肺 胃 腸子 痣 雀斑']
    },
    clothes: {
      1: ['裙子 褲子|長褲 襪子 手套 圍巾 領帶 手錶 戒指 雨衣 拖鞋 外套'],
      2: [
        '短褲 洋裝 毛衣 背心 睡衣 泳衣 內褲 口罩 項鍊 耳環 雨鞋 高跟鞋',
        '靴子 皮帶 蝴蝶結 髮夾 背包 錢包 手提包|包包',
        '安全帽 草帽 圍裙 制服 西裝'
      ],
      3: ['旗袍 和服 婚紗 燕尾服 牛仔褲 連帽衫|帽t 羽絨外套 髮箍 手環 耳罩 斗笠']
    },
    taiwan: {
      2: ['台北101|101 玉山 阿里山 日月潭 日月光 檳榔'],
      3: ['太魯閣 墾丁 澎湖 蘭嶼 媽祖遶境 鹽水蜂炮']
    },
    festival: {
      1: ['紅包|壓歲錢 禮物|禮盒 聖誕老人 煙火 鞭炮 南瓜燈 天燈'],
      2: [
        '春聯 舞龍 舞獅 元宵節 中秋節 端午節 龍舟',
        '春節|過年 聖誕節 萬聖節 復活節 彩蛋 情人節',
        '母親節 父親節 兒童節 生日 聖誕襪 年夜飯 賞月',
        '猜燈謎'
      ],
      3: [
        '教師節 清明節 除夕 七夕 重陽節 感恩節 中元節',
        '跨年'
      ]
    }
  };

  /* ================================================================
     第二批擴充題（2026-11）。一律接在既有題目後面：
     既有分類的新題沿用同一個分類、編號接續（w-animal-130…），
     這樣舊題的 id、順序與範本區塊（refs/rNNNN.js，每 40 題一檔）都不會位移。
     之後再加題也請加在這一段的最後面，不要插進前面的 BANKS。
     ================================================================ */
  var BANKS_MORE = {
    toy: {
      1: [
        '溜溜球 竹蜻蜓 紙飛機 水槍 彈弓 沙包 木馬 不倒翁 萬花筒 紙船 黏土 布偶'
      ],
      2: [
        '遙控車 模型飛機 小火車 疊疊樂 骨牌 泡泡槍 發條玩具 彈珠台 手偶 玩具兵 娃娃屋 拼豆',
        '翻花繩 紙娃娃 扯鈴 劍玉 彈力球 套娃|俄羅斯娃娃 波浪鼓|撥浪鼓 滑步車'
      ],
      3: [
        '九連環 七巧板 華容道 孔明鎖 數獨 填字遊戲 賓果 密室逃脫'
      ]
    },
    school: {
      1: [
        '書包 黑板 粉筆 課本 鉛筆盒 彩色筆 便當盒 作業簿 獎狀 白板'
      ],
      2: [
        '削筆機|削鉛筆機 圓規 量角器 三角板 螢光筆 原子筆 鋼筆 毛筆 墨水 板擦 講台 地球儀',
        '成績單 考卷 資料夾 迴紋針 圖釘 膠帶 美工刀 算盤 顯微鏡 試管 燒杯 立可白 布告欄'
      ],
      3: [
        '畢業證書 運動會 校外教學 補習班 點名'
      ]
    },
    plant: {
      1: [
        '綠葉 竹子 幸運草|四葉草 盆栽 柳樹 花苞 豆芽 稻草'
      ],
      2: [
        '康乃馨 茉莉花 薰衣草 繡球花 牡丹 水仙 多肉植物 含羞草 捕蠅草 豬籠草 蘆薈 薄荷',
        '榕樹 銀杏 棕櫚樹 聖誕紅 杜鵑花 蘆葦 小麥 棉花 甘蔗 睡蓮'
      ],
      3: [
        '盆景 神木 紅樹林 光合作用 花粉 發芽 油桐花 波斯菊 風信子 曇花'
      ]
    },
    ocean: {
      1: [
        '海草|海藻 船錨 救生圈 漁網 魚鉤 寄居蟹 海螺 珍珠'
      ],
      2: [
        '虎鯨|殺人鯨 海獅 海象 海牛 旗魚 飛魚 翻車魚 鯨鯊 鎚頭鯊 海參 扇貝 珊瑚礁 沉船',
        '浮標 潛水鏡 氧氣瓶 蛙鞋 漂流瓶 碼頭 消波塊 獨角鯨 藍鯨'
      ],
      3: [
        '鮟鱇魚 藤壺 浮游生物 潮間帶 海溝 洋流 赤潮 抹香鯨 座頭鯨 鸚鵡螺'
      ]
    },
    tech: {
      1: [
        '平板|平板電腦 電子錶 隨身碟 遊戲機 計算機 插頭'
      ],
      2: [
        '遊戲手把 搖桿 記憶卡 硬碟 光碟 傳輸線 天線 觸控筆 視訊鏡頭 無線耳機 密碼 條碼',
        '電路板 晶片 電子郵件 游標 下載 當機 無線網路 藍牙 機械手臂 腳架 導航 電動牙刷'
      ],
      3: [
        '電腦病毒 駭客 搜尋引擎 伺服器 3D列印 感應器 行車紀錄器 指紋辨識 人臉辨識',
        '程式碼|程式'
      ]
    },
    tool: {
      1: [
        '釘子 螺絲 鏟子 繩子 斧頭 鉗子 水管 油漆'
      ],
      2: [
        '電鑽 螺帽 鐵鍊 掛鉤 砂紙 鑿子 鋤頭 耙子 鐮刀 十字鎬 鐵絲 磚塊 水泥 木板 三角錐',
        '熱熔槍 圍籬 打氣筒 滾筒刷 電鋸 割草機 護目鏡 水龍頭 馬桶吸把'
      ],
      3: [
        '六角扳手 千斤頂 鏝刀 游標卡尺 鷹架 鋼筋 鉸鏈 電焊'
      ]
    },
    dino: {
      1: [
        '恐龍蛋 化石 恐龍骨架 長毛象|猛瑪象'
      ],
      2: [
        '三角龍 劍龍 腕龍 雷龍 翼龍|翼手龍 迅猛龍 甲龍 蛇頸龍 棘龍 劍齒虎 原始人 洞穴壁畫',
        '石器 石斧 鑽木取火 琥珀'
      ],
      3: [
        '三葉蟲 菊石 始祖鳥 滄龍 魚龍 副櫛龍 冰河時期 恐龍滅絕 渡渡鳥 侏羅紀'
      ]
    },
    fairy: {
      1: [
        '小紅帽 三隻小豬 醜小鴨 大野狼 南瓜馬車 玻璃鞋 糖果屋 毒蘋果'
      ],
      2: [
        '七隻小羊 仙女教母 國王新衣 長髮公主 小木偶 青蛙王子 魔豆|傑克與魔豆 龜兔賽跑',
        '拇指姑娘 愛麗絲 鵝媽媽 金斧頭 烏鴉喝水 桃太郎 虎姑婆 年獸 魔鏡 紡車 薑餅人 胡桃鉗',
        '稻草人 豌豆公主'
      ],
      3: [
        '北風與太陽 狐狸與葡萄 后羿射日 女媧補天 白蛇傳 阿里巴巴 芝麻開門 伊索寓言 小王子',
        '吹笛人|彩衣吹笛人'
      ]
    },
    earth: {
      2: [
        '地殼 地核 岩漿|熔岩 溫泉 間歇泉 鐘乳石 石筍 水晶 鑽石 寶石 金礦 煤炭|煤 石油',
        '沙子 鵝卵石 火山口 火山灰 地震儀 風向儀|風向計 雨量計|雨量筒 氣象站',
        '天氣預報|氣象預報 水循環 三角洲 大氣層 春天 夏天 秋天 冬天 四季 烏雲 積雨雲',
        '颱風眼 大理石 礦坑 水壩 天坑 海蝕洞 火山島 地熱'
      ],
      3: [
        '斷層 板塊 氣象衛星 等高線 經緯線|經緯度 地下水 沖積扇 永凍土 臭氧層 溫室效應',
        '全球暖化 海平面 晝夜 自轉 公轉 地軸 回歸線 時區 鋒面 聖嬰現象 火成岩 沉積岩',
        '花崗岩 石灰岩 玄武岩 岩層 大陸漂移 海底火山 環礁 潟湖 峽灣 喀斯特 石林 泥火山',
        '壺穴 曲流 牛軛湖 堰塞湖 風化 侵蝕'
      ]
    },
    culture: {
      2: [
        '茶道 書法 水墨畫|國畫 中國結 皮影戲 布袋戲 京劇 臉譜 太極拳 功夫 相撲 柔道',
        '空手道 瑜珈 鳥居 神社 招財貓 鯉魚旗 紙鶴|千紙鶴 圖騰柱|圖騰 回力鏢 木屐 風笛',
        '鬥牛 芭蕾舞|芭蕾 嘉年華 草裙舞 街舞 馬戲團 小丑 雕像 油畫 青花瓷 太鼓 轎子',
        '油紙傘 石獅子 寶塔|佛塔 大佛|佛像 十字架 婚禮 蒙古包 冰屋 樹屋 印章'
      ],
      3: [
        '歌仔戲 相聲 劍道 跆拳道 藝妓 達摩 御守 榻榻米 韓服 蘇格蘭裙 佛朗明哥 探戈 華爾滋',
        '森巴 肚皮舞 踢踏舞 歌劇 音樂劇 默劇 木偶戲|傀儡戲 雜技 版畫 香爐 廟會 八家將',
        '神轎 花轎 算命 抽籤 八卦 陰陽 十二生肖|生肖 門神 牌坊 四合院 木魚 清真寺 潑水節',
        '啤酒節 亡靈節 象形文字 卷軸 古箏 二胡 琵琶'
      ]
    },
    history: {
      3: [
        '屈原 項羽 劉邦 韓信 王昭君 楊貴妃 貂蟬 西施 唐太宗 康熙 乾隆 慈禧 朱元璋 忽必烈',
        '文天祥 蔡倫 張衡 華佗 李時珍 魯班 荊軻 蘇武 陶淵明 白居易 李清照 林則徐 劉銘傳',
        '馬偕 八田與一 莫那魯道 亞歷山大 凱撒 埃及豔后 圖坦卡門 蘇格拉底 亞里斯多德 阿基米德',
        '聖女貞德 維多利亞女王 路易十四 哥白尼 達爾文 瓦特 諾貝爾 貝爾 特斯拉 巴斯德',
        '米開朗基羅 莫內 巴哈 蕭邦 馬克吐溫 甘地 曼德拉 金恩博士 德蕾莎修女 海倫凱勒',
        '富蘭克林 阿姆斯壯 庫克船長 德川家康 織田信長 文藝復興 工業革命 十字軍 黑死病',
        '大航海時代 獨立宣言 南北戰爭 滑鐵盧 諾曼第登陸 珍珠港 斯巴達 維京人 羅馬帝國',
        '馬雅文明 印加帝國 巴比倫 空中花園 亞特蘭提斯 赤壁之戰 科舉 狀元 地動儀 渾天儀 日晷',
        '沙漏 青銅器 唐三彩 清明上河圖 蒙娜麗莎 沉思者 大衛像 維納斯 帕德嫩神廟 凡爾賽宮',
        '布達拉宮 天壇 護城河 吊橋 投石機 弓箭 盾牌 盔甲 戰車 大砲 電報 打字機 留聲機',
        '烽火台'
      ]
    },
    geography: {
      3: [
        '北韓 寮國 柬埔寨 斯里蘭卡 不丹 伊朗 沙烏地阿拉伯 烏克蘭 匈牙利 比利時 梵蒂岡',
        '摩納哥 哥倫比亞 牙買加 巴拿馬 奈及利亞 馬達加斯加 斐濟 帛琉 馬爾地夫 格陵蘭 夏威夷',
        '阿拉斯加 西伯利亞 西藏 峇里島 沖繩 北海道 濟州島 關島 東京 京都 大阪 首爾 北京',
        '上海 曼谷 巴黎 倫敦 羅馬 威尼斯 紐約 洛杉磯 舊金山 拉斯維加斯 雪梨 柏林 莫斯科',
        '開羅 伊斯坦堡 阿姆斯特丹 里約熱內盧 金門大橋 倫敦塔橋 凱旋門 羅浮宮 聖母院 新天鵝堡',
        '魚尾獅 雙子星塔 東京鐵塔 清水寺 金閣寺 天安門 東方明珠 大皇宮 下龍灣 佩特拉',
        '耶路撒冷 麥加 救世基督像 伊瓜蘇瀑布 黃石公園 好萊塢 時代廣場 帝國大廈',
        '總統山|拉什莫爾山 烏魯魯|艾爾斯岩 阿爾卑斯山 洛磯山脈 維蘇威火山 吉力馬札羅山 太平洋',
        '大西洋 印度洋 北冰洋 亞洲 歐洲 非洲 北美洲 南美洲 大洋洲 紅海 黑海 加勒比海',
        '波斯灣 台灣海峽 巴拿馬運河 蘇伊士運河 百慕達三角 馬里亞納海溝 加拉巴哥群島 西西里島',
        '戈壁沙漠 多瑙河 萊茵河 泰晤士河 塞納河 恆河 湄公河'
      ]
    },
    trend: {
      3: [
        '生成式AI 人形機器人 深偽 淨零排放|碳中和 極端氣候 半導體 低軌衛星 假新聞 迷因',
        '表情符號 開箱 團購 訂閱 雲端 大數據 演算法 打卡 限時動態 播客 有聲書 快閃店',
        '無人商店 自助結帳 掃碼點餐 外送平台 共享機車 減塑 淨灘 剩食 植物肉 送餐機器人',
        '無人計程車 火星移民 網美牆 盲盒 手搖飲 躺平 毛小孩 少子化 高齡化 通膨|通貨膨脹',
        '漲價 颱風假 國家警報 停電 野火|森林大火 經典賽 啦啦隊 應援棒|螢光棒 黃牛'
      ]
    },
    animal: {
      1: [
        '鴿子 烏鴉 麻雀 蚱蜢 金龜子 蠶寶寶|蠶'
      ],
      2: [
        '蜂鳥 天竺鼠 柴犬 貴賓狗 臘腸狗 哈士奇 鵜鶘 狐獴|貓鼬 水豚 鴨嘴獸 巨嘴鳥|大嘴鳥',
        '白鷺鷥 喜鵲 鍬形蟲'
      ],
      3: [
        '黃金獵犬 竹節蟲 帝雉 藍鵲|台灣藍鵲 石虎 黑熊|台灣黑熊 山羌 雲豹 科摩多龍 袋獾'
      ]
    },
    food: {
      1: [
        '小黃瓜|黃瓜 青菜 金針菇 豌豆 火龍果 荔枝 熱可可 蛋捲'
      ],
      2: [
        '榴槤 釋迦 龍眼 百香果 酪梨 石榴 絲瓜 苦瓜 蓮藕 芋頭 蘆筍 菠菜 薑 洋蔥圈 雞塊',
        '甜不辣 茶葉蛋 皮蛋 布朗尼 糖葫蘆 口香糖 軟糖'
      ],
      3: [
        '山竹 酸辣湯 蛋黃酥 太陽餅 地瓜球 龍鬚糖 佛跳牆 烤鴨|北京烤鴨 麻婆豆腐 宮保雞丁'
      ]
    },
    home: {
      1: [
        '馬桶 浴缸 門 窗簾 奶瓶 吸管'
      ],
      2: [
        '鞋櫃 蓮蓬頭 洗手台 馬桶刷 蚊帳 搖籃 嬰兒床 存錢筒|撲滿 魚缸 鳥籠'
      ],
      3: [
        '縫紉機 壁爐 吊燈 屏風'
      ]
    },
    vehicle: {
      1: [
        '購物車 跑車 滑板車'
      ],
      2: [
        '腳踏船|天鵝船 輕軌 嘟嘟車 人力車 牛車 坦克 堆高機 戰鬥機'
      ],
      3: [
        '貢多拉 貨櫃船 航空母艦 壓路機'
      ]
    },
    nature: {
      1: [
        '鳥巢 蜂窩|蜂巢 蜘蛛網 樹洞'
      ],
      2: [
        '螞蟻窩 木頭 樹樁 花海 梯田 茶園 泥巴 水草'
      ],
      3: [
        '濕地 河谷 山頂'
      ]
    },
    fun: {
      1: [
        '拔河 賽跑 猜拳|剪刀石頭布'
      ],
      2: [
        '攀岩 跳水 滑水道 卡丁車 射氣球 撈金魚 馬拉松 跨欄 橄欖球'
      ],
      3: [
        '冰壺 鐵人三項 冰球'
      ]
    },
    place: {
      1: [
        '廁所 車庫 幼兒園|幼稚園 小木屋'
      ],
      2: [
        '保齡球館 棒球場 籃球場 動物醫院 工廠 倉庫 辦公室 實驗室 劇院|戲院 植物園 旅館',
        '地下室'
      ],
      3: [
        '閣樓 天文館 攝影棚 垃圾場'
      ]
    },
    job: {
      2: [
        '會計師 偵探 間諜 馴獸師 飼育員|動物管理員 氣象主播 化妝師 裁縫師 鐵匠 礦工 伐木工',
        '列車長 軍人|士兵 賽車手'
      ],
      3: [
        '檢察官 配音員 鎖匠 外交官 騎師 營養師'
      ]
    },
    action: {
      1: [
        '穿鞋子 洗臉 梳頭髮 穿衣服 開門'
      ],
      2: [
        '倒垃圾 包水餃 舉手 鞠躬 擦桌子 鋪床 倒立 翻跟斗 滑手機 自拍 綁鞋帶 撐傘'
      ],
      3: [
        '仰臥起坐 伏地挺身 插花'
      ]
    },
    fantasy: {
      2: [
        '藥水|魔法藥水 魔法帽 骷髏 史萊姆 寶劍 魔王'
      ],
      3: [
        '哥布林 魔法陣 地下城 金箍棒'
      ]
    },
    festival: {
      2: [
        '聖誕帽 薑餅屋 拐杖糖 生日帽 派對 拉炮'
      ],
      3: [
        '交換禮物 香包 立蛋 柚子帽'
      ]
    },
    taiwan: {
      2: [
        '藍白拖 鐵路便當|台鐵便當 悠遊卡 辦桌|流水席 三合院 騎樓 攤販 九份 淡水 野柳',
        '女王頭 龍山寺 西門町 故宮博物院'
      ],
      3: [
        '合歡山 清境農場 鵝鑾鼻 龜山島 綠島 小琉球 金門 馬祖 風獅爺 赤崁樓 安平古堡 紅毛城',
        '中正紀念堂 翠玉白菜 彩虹村|彩虹眷村 黑面琵鷺'
      ]
    },
    clothes: {
      2: [
        '披風|斗篷 領結 吊帶褲 浴袍 涼鞋'
      ]
    }
  };

  /** 「貓熊|熊貓」→ { text, alt } */
  function parseEntry(entry) {
    var names = entry.split('|');
    return { text: names[0], alt: names.slice(1) };
  }

  var usedText = {};
  LIST.forEach(function (word) {
    usedText[word.text] = true;
    (word.alt || []).forEach(function (name) { usedText[name] = true; });
  });

  /* 編號接在同分類既有題目後面（w-animal-0、w-animal-1…），所以新題只能往後加 */
  var bankCounts = {};
  function expandBanks(banks) {
    Object.keys(banks).forEach(function (cat) {
      if (!CATEGORIES[cat]) throw new Error('未知的分類：' + cat);
      var bank = banks[cat];
      var hard = (BANKS[cat] || bank).hard;
      [1, 2, 3].forEach(function (diff) {
        if (!bank[diff]) return;
        if (hard && diff !== 3) throw new Error('困難分類只能有第 3 層：' + cat);
        bank[diff].join(' ').trim().split(/\s+/).forEach(function (entry) {
          var word = parseEntry(entry);
          [word.text].concat(word.alt).forEach(function (name) {
            if (usedText[name]) throw new Error('題目文字重複：' + name);
            usedText[name] = true;
          });
          bankCounts[cat] = (bankCounts[cat] || 0) + 1;
          LIST.push({ id: 'w-' + cat + '-' + (bankCounts[cat] - 1), text: word.text, alt: word.alt, cat: cat, diff: diff });
        });
      });
    });
  }
  expandBanks(BANKS);
  expandBanks(BANKS_MORE);

  /* ================================================================
     形狀指令 → 筆畫（點陣列）
     ================================================================ */

  function ringPoints(cx, cy, rx, ry, a0, a1, rot, steps) {
    var pts = [];
    var n = steps || Math.max(12, Math.round(Math.abs(a1 - a0) / 12));
    var cos = Math.cos((rot || 0) * RAD);
    var sin = Math.sin((rot || 0) * RAD);
    for (var i = 0; i <= n; i++) {
      var a = (a0 + (a1 - a0) * (i / n)) * RAD;
      var x = Math.cos(a) * rx;
      var y = Math.sin(a) * ry;
      pts.push(cx + x * cos - y * sin, cy + x * sin + y * cos);
    }
    return pts;
  }

  /** 把一個指令展開成 0..n 筆（每筆是一個點陣列） */
  function opStrokes(op) {
    var k = op[0];
    var a = op;
    switch (k) {
      case 'c':  return [ringPoints(a[1], a[2], a[3], a[3], 0, 360, 0)];
      case 'e':  return [ringPoints(a[1], a[2], a[3], a[4], 0, 360, a[5] || 0)];
      case 'a':  return [ringPoints(a[1], a[2], a[3], a[3], a[4], a[5] < a[4] ? a[5] + 360 : a[5], 0)];
      case 'ae': return [ringPoints(a[1], a[2], a[3], a[4], a[5], a[6] < a[5] ? a[6] + 360 : a[6], 0)];
      case 'r':  return [[a[1], a[2], a[1] + a[3], a[2], a[1] + a[3], a[2] + a[4], a[1], a[2] + a[4], a[1], a[2]]];
      case 'l':  return [[a[1], a[2], a[3], a[4]]];
      case 'p':  return [a.slice(1)];
      case 's':  return [a.slice(1).concat([a[1], a[2]])];
      case 'd':  return [ringPoints(a[1], a[2], a[3] || 16, a[3] || 16, 0, 360, 0, 10)];
      case 'ray': {
        var out = [];
        var n = a[5] || 6;
        var off = (a[6] || 0);
        for (var i = 0; i < n; i++) {
          var ang = (off + i * 360 / n) * RAD;
          out.push([
            a[1] + Math.cos(ang) * a[3], a[2] + Math.sin(ang) * a[3],
            a[1] + Math.cos(ang) * a[4], a[2] + Math.sin(ang) * a[4]
          ]);
        }
        return out;
      }
      case 'w': {
        var pts = [];
        var segs = Math.max(1, a[5] || 3) * 12;
        for (var j = 0; j <= segs; j++) {
          var t = j / segs;
          pts.push(a[1] + (a[2] - a[1]) * t, a[3] + Math.sin(t * Math.PI * 2 * (a[5] || 3)) * a[4]);
        }
        return [pts];
      }
      case 'st': {
        var sp = [];
        var arms = a[5] || 5;
        for (var m = 0; m < arms * 2; m++) {
          var r = (m % 2 === 0) ? a[3] : a[4];
          var ang2 = (-90 + m * 180 / arms) * RAD;
          sp.push(a[1] + Math.cos(ang2) * r, a[2] + Math.sin(ang2) * r);
        }
        sp.push(sp[0], sp[1]);
        return [sp];
      }
      default: return [];
    }
  }

  /* ================================================================
     查詢與比對
     ================================================================ */

  var index = {};
  for (var n = 0; n < LIST.length; n++) index[LIST[n].id] = LIST[n];

  /* ================================================================
     多語系題庫：題目文字跟著「題庫語言」走。
     zh-Hant（預設）用上面的 LIST；en 用 words.en.js，同一個 id 對應同一題
     （同一個分類與難度），只換題目文字與別名。
     ================================================================ */

  var LANGS = ['zh-Hant', 'zh-Hans', 'en'];
  function normLang(lang) { return lang === 'en' ? 'en' : lang === 'zh-Hans' || lang === 'zh-CN' || lang === 'zh-SG' ? 'zh-Hans' : 'zh-Hant'; }

  var EN_DATA = null;
  function enData() {
    if (EN_DATA) return EN_DATA;
    var src = null;
    if (typeof module === 'object' && module.exports && typeof require === 'function') {
      try { src = require('./words.en.js'); } catch (e) { src = null; }
    } else if (typeof globalThis !== 'undefined') {
      src = globalThis.WordsEN || null;
    }
    if (src) EN_DATA = src;
    return src || {};
  }

  var enViews = {}, hansViews = {};
  var HANS_DATA = null;
  function hansData() {
    if (HANS_DATA) return HANS_DATA;
    var src = null;
    if (typeof module === 'object' && module.exports && typeof require === 'function') {
      try { src = require('./words.zh-Hans.js'); } catch (e) { src = null; }
    } else if (typeof globalThis !== 'undefined') {
      src = globalThis.WordsHans || null;
    }
    if (src) HANS_DATA = src;
    return src || {};
  }

  /** 把題目文字換成指定語言；找不到對應就保留原題。 */
  function localize(word, lang) {
    if (!word) return word;
    lang = normLang(lang);
    if (lang === 'zh-Hant') return word;
    var views = lang === 'en' ? enViews : hansViews;
    if (views[word.id]) return views[word.id];
    var raw = (lang === 'en' ? enData() : hansData())[word.id];
    if (!raw) return word;
    var names = String(raw).split('|');
    var view = {
      id: word.id, text: names[0], alt: names.slice(1),
      cat: word.cat, diff: word.diff, lang: lang
    };
    views[word.id] = view;
    return view;
  }

  function byId(id, lang) { return localize(index[id] || null, lang); }

  /** 這個語系的題庫在不在（瀏覽器裡英文與簡中是用到才載入的，見 js/lazy-packs.js） */
  function hasLang(lang) {
    lang = normLang(lang);
    if (lang === 'zh-Hant') return true;
    var data = lang === 'en' ? enData() : hansData();
    for (var k in data) if (Object.prototype.hasOwnProperty.call(data, k)) return true;
    return false;
  }

  /** 這個字元算不算「一格」：中文每個字都算；英文只算字母與數字（空白、連字號、撇號不算） */
  var GLYPH_RE = /[\p{L}\p{N}]/u;
  function isGlyph(word, ch) { return word.lang === 'en' ? GLYPH_RE.test(ch) : true; }

  /** 可以被「翻開一個字」的位置（字元索引） */
  function revealable(word) {
    var out = [];
    for (var i = 0; i < word.text.length; i++) if (isGlyph(word, word.text.charAt(i))) out.push(i);
    return out;
  }

  /** 字數（中文是字數，英文是字母數） */
  function glyphCount(word) { return revealable(word).length; }

  /* ---- 英文比對：不分大小寫、容忍前後空白與標點、去掉重音、單複數與冠詞 ---- */
  var EN_STOP = { a: 1, an: 1, the: 1, of: 1, and: 1, to: 1, in: 1, on: 1, with: 1, for: 1, at: 1 };

  function singular(t) {
    var n = t.length;
    if (n > 4 && t.slice(-3) === 'ies') return t.slice(0, -3) + 'y';
    if (n > 4 && /(ses|xes|zes|ches|shes)$/.test(t)) return t.slice(0, -2);
    if (n > 3 && t.charAt(n - 1) === 's' && !/(ss|us|is)$/.test(t)) return t.slice(0, -1);
    return t;
  }

  function enTokens(text) {
    var s = String(text === undefined || text === null ? '' : text);
    try { s = s.normalize('NFD'); } catch (e) { /* 舊瀏覽器沒有 normalize 就算了 */ }
    s = s.replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['\u2018\u2019`\u00b4]/g, '');
    var tokens = s.split(/[^\p{L}\p{N}]+/u).filter(function (t) { return t.length > 0; });
    if (tokens.length > 1 && (tokens[0] === 'a' || tokens[0] === 'an' || tokens[0] === 'the')) tokens.shift();
    return tokens.map(singular);
  }

  /** 編輯距離是否在 k 以內（只用在很短的字串上，不需要最佳化） */
  function editWithin(a, b, k) {
    if (Math.abs(a.length - b.length) > k) return false;
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev.push(j);
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      var best = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        if (cur[j] < best) best = cur[j];
      }
      if (best > k) return false;
      prev = cur;
    }
    return prev[b.length] <= k;
  }

  function matchEn(word, guess) {
    var gt = enTokens(guess);
    if (!gt.length) return 'miss';
    var gk = gt.join('');
    var names = [word.text].concat(word.alt || []);
    var i;
    for (i = 0; i < names.length; i++) {
      if (enTokens(names[i]).join('') === gk) return 'hit';
    }
    /* 「很接近」：打錯一兩個字母、或猜中多字題目的一半以上單字、或只差一截 */
    for (i = 0; i < names.length; i++) {
      var nt = enTokens(names[i]);
      var nk = nt.join('');
      if (nk.length >= 4 && editWithin(gk, nk, nk.length >= 9 ? 2 : 1)) return 'close';
      var content = nt.filter(function (t) { return !EN_STOP[t]; });
      if (content.length >= 2) {
        var pool = content.slice();
        var shared = 0;
        gt.forEach(function (t) {
          var at = pool.indexOf(t);
          if (at >= 0) { shared += 1; pool.splice(at, 1); }
        });
        if (shared >= Math.ceil(content.length / 2)) return 'close';
      }
      var lo = Math.min(gk.length, nk.length), hi = Math.max(gk.length, nk.length);
      if (lo >= 4 && lo / hi >= 0.6 && (nk.indexOf(gk) >= 0 || gk.indexOf(nk) >= 0)) return 'close';
    }
    return 'miss';
  }

  /** 正規化玩家輸入：中文去掉空白、標點、全形轉半形；英文不分大小寫、忽略空白與標點、單複數 */
  function normalize(text, lang) {
    if (normLang(lang) === 'en') return enTokens(text).join('');
    var s = String(text === undefined || text === null ? '' : text);
    s = s.replace(/[\s　]+/g, '');
    s = s.replace(/[，。！？、,.!?~～·「」『』（）()\[\]【】:：;；"'`]/g, '');
    s = s.replace(/[！-～]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    });
    return s.toLowerCase();
  }

  /** 猜測是否命中；回傳 'hit' | 'close' | 'miss' */
  function match(word, guess) {
    if (word && word.lang === 'en') return matchEn(word, guess);
    var g = normalize(guess);
    if (!g) return 'miss';
    var names = [word.text].concat(word.alt || []);
    var i;
    for (i = 0; i < names.length; i++) {
      if (normalize(names[i]) === g) return 'hit';
    }
    /* 猜中題目至少一半的字，才算「很接近」，只私下提示猜的人。
       門檻看題目本身的字數：1～2 字中 1 個、3～4 字中 2 個、5～6 字中 3 個，
       長題目不會只猜中一個字就說接近。別名也照同一個門檻比，
       否則「珍珠奶茶」的別名「珍奶」只有兩個字，猜「奶昔」中一個字就算接近了。 */
    var need = Math.ceil(normalize(word.text).length / 2);
    for (i = 0; i < names.length; i++) {
      if (sharedChars(normalize(names[i]), g) >= need) return 'close';
    }
    return 'miss';
  }

  /** 兩串字共有幾個字；同一個字要兩邊都出現幾次才算幾次（「咪咪」對「貓咪」只算 1） */
  function sharedChars(a, b) {
    var left = b.split('');
    var count = 0;
    for (var i = 0; i < a.length; i++) {
      var at = left.indexOf(a.charAt(i));
      if (at >= 0) { count += 1; left.splice(at, 1); }
    }
    return count;
  }

  /* 「混合」不是整池亂抽 —— 題庫裡困難題比簡單題多，整池亂抽會變成大部分都很難。
     刻意偏簡單：一半簡單、四成普通，困難只留一成當調味。 */
  var MIX = [{ diff: 1, weight: 50 }, { diff: 2, weight: 40 }, { diff: 3, weight: 10 }];

  /** 依難度挑選候選題目；用可注入的種子亂數，讓同一場對局可以重播 */
  function pick(rng, count, opts) {
    var o = opts || {};
    function poolOf(diff, allowUsed) {
      return LIST.filter(function (w) {
        if (diff && w.diff !== diff) return false;
        if (o.cat && w.cat !== o.cat) return false;
        if (!allowUsed && o.exclude && o.exclude.indexOf(w.id) >= 0) return false;
        return true;
      });
    }
    var all = poolOf(0);
    if (!all.length) all = poolOf(0, true);
    if (!all.length) return [];
    var fixed = o.diff ? poolOf(o.diff) : null;
    if (fixed && !fixed.length) fixed = all;
    var mixed = {};
    if (!fixed) {
      MIX.forEach(function (m) {
        var sub = poolOf(m.diff);
        mixed[m.diff] = sub.length ? sub : all;
      });
    }
    var total = 0;
    MIX.forEach(function (m) { total += m.weight; });

    var next = rng || Math.random;
    var out = [];
    var taken = {};
    var guard = 0;
    while (out.length < count && guard < 500) {
      guard += 1;
      var pool = fixed;
      if (!pool) {
        var roll = next() * total;
        for (var i = 0; i < MIX.length; i++) {
          roll -= MIX[i].weight;
          if (roll < 0 || i === MIX.length - 1) { pool = mixed[MIX[i].diff]; break; }
        }
      }
      var w2 = pool[Math.floor(next() * pool.length) % pool.length];
      if (taken[w2.id]) continue;
      taken[w2.id] = true;
      out.push(w2.id);
    }
    /* 指定難度不足三題時只放寬難度，仍留在選定種類內。 */
    var remaining = all.filter(function (w) { return !taken[w.id]; });
    while (out.length < count && remaining.length) {
      var at = Math.floor(next() * remaining.length) % remaining.length;
      out.push(remaining.splice(at, 1)[0].id);
    }
    return out;
  }

  /** 一題公開可見的部分（分類代碼、字數）；答案本身永遠不在裡面。
   *  分類與難度只給代碼，畫面依各自的語系翻成文字（cat.＊、diff.＊）。 */
  function publicInfo(word) {
    return {
      id: word.id,
      cat: word.cat,
      catEmoji: CATEGORIES[word.cat].emoji,
      diff: word.diff,
      len: glyphCount(word)
    };
  }

  /** 遮罩後的提示字串。中文：「太＿」；英文：「_ _ _」每個字母一格，空白與連字號照樣顯示 */
  function maskOf(word, revealed) {
    var out = '';
    var en = word.lang === 'en';
    for (var i = 0; i < word.text.length; i++) {
      var ch = word.text.charAt(i);
      if (en && !isGlyph(word, ch)) { out += ch; continue; }
      out += (revealed && revealed.indexOf(i) >= 0) ? ch : (en ? '_' : MASK_CHAR);
    }
    return out;
  }

  return {
    BOX: BOX,
    MASK_CHAR: MASK_CHAR,
    CATEGORIES: CATEGORIES,
    CATEGORY_KEYS: CATEGORY_KEYS,
    DIFFICULTY: DIFFICULTY,
    LIST: LIST,
    byId: byId,
    LANGS: LANGS,
    normLang: normLang,
    hasLang: hasLang,
    localize: localize,
    revealable: revealable,
    glyphCount: glyphCount,
    all: function () { return LIST.slice(); },
    inCategory: function (cat) { return LIST.filter(function (w) { return w.cat === cat; }); },
    pointsOf: opStrokes,
    normalize: normalize,
    match: match,
    pick: pick,
    publicInfo: publicInfo,
    maskOf: maskOf
  };
}));
