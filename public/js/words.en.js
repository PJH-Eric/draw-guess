/* ===== words.en.js — 英文題庫（Draw & Guess 英文版題目） =====
 *
 * 一個 id 對應 words.js 裡同一個中文詞條：第一個是顯示用的標準答案，
 * 「|」後面是也算對的說法（同義詞、常見寫法）。比對時不分大小寫、容忍前後空白，
 * 並忽略連字號、標點、重音符號、開頭的 a／an／the 與單複數差異（見 words.js 的 matchEn）。
 * 分類與難度沿用中文題庫（同一個 id 同一個分類與難度）；分類名稱的英文在 words.js。
 * 行尾註解是對應的中文題目，方便維護；新增中文題時要在這裡補上同一個 id。
 * 瀏覽器載入後掛在 window.WordsEN，Node 以 require 取得。
 */
(function (root, factory) {
  'use strict';
  var data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.WordsEN = data;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return {
    'cat': "cat|kitty|kitten", // 貓
    'dog': "dog|puppy", // 狗
    'fish': "fish", // 魚
    'bird': "bird", // 鳥
    'rabbit': "rabbit|bunny", // 兔子
    'pig': "pig|piglet", // 豬
    'cow': "cow", // 牛
    'elephant': "elephant", // 大象
    'snake': "snake", // 蛇
    'turtle': "turtle|tortoise", // 烏龜
    'butterfly': "butterfly", // 蝴蝶
    'crab': "crab", // 螃蟹
    'giraffe': "giraffe", // 長頸鹿
    'penguin': "penguin", // 企鵝
    'lion': "lion", // 獅子
    'frog': "frog", // 青蛙
    'bee': "bee", // 蜜蜂
    'owl': "owl", // 貓頭鷹
    'whale': "whale", // 鯨魚
    'dinosaur': "dinosaur|dino", // 恐龍
    'apple': "apple", // 蘋果
    'banana': "banana", // 香蕉
    'watermelon': "watermelon", // 西瓜
    'cake': "cake|birthday cake", // 蛋糕
    'icecream': "ice cream", // 冰淇淋
    'burger': "hamburger|burger", // 漢堡
    'pizza': "pizza", // 披薩
    'bread': "bread|toast", // 麵包
    'coffee': "coffee", // 咖啡
    'riceball': "rice ball|onigiri", // 飯糰
    'sushi': "sushi", // 壽司
    'hotdog': "hot dog|hotdog", // 熱狗
    'donut': "donut|doughnut", // 甜甜圈
    'grape': "grape|grapes", // 葡萄
    'strawberry': "strawberry", // 草莓
    'pineapple': "pineapple", // 鳳梨
    'egg': "egg|fried egg", // 雞蛋
    'bubbletea': "bubble tea|boba|pearl milk tea", // 珍珠奶茶
    'lollipop': "lollipop", // 棒棒糖
    'hotpot': "hot pot|hotpot", // 火鍋
    'umbrella': "umbrella", // 雨傘
    'clock': "clock|alarm clock", // 時鐘
    'book': "book", // 書本
    'chair': "chair|stool", // 椅子
    'table': "table|desk", // 桌子
    'cup': "cup|mug", // 杯子
    'bulb': "light bulb|bulb", // 燈泡
    'key': "key", // 鑰匙
    'scissors': "scissors", // 剪刀
    'glasses': "glasses|eyeglasses|sunglasses", // 眼鏡
    'phone': "phone|cell phone|mobile phone|smartphone", // 手機
    'tv': "television|tv", // 電視
    'toothbrush': "toothbrush", // 牙刷
    'broom': "broom", // 掃把
    'mirror': "mirror", // 鏡子
    'pencil': "pencil", // 鉛筆
    'hat': "hat|cap|baseball cap", // 帽子
    'shoe': "shoes|shoe|sneakers", // 鞋子
    'fan': "electric fan|fan", // 電風扇
    'washer': "washing machine|washer", // 洗衣機
    'car': "car|automobile", // 汽車
    'bicycle': "bicycle|bike", // 腳踏車
    'airplane': "airplane|plane|aeroplane", // 飛機
    'boat': "boat|ship", // 船
    'train': "train", // 火車
    'bus': "bus", // 公車
    'motorcycle': "motorcycle|motorbike|scooter", // 摩托車
    'balloon': "hot air balloon", // 熱氣球
    'rocket': "rocket", // 火箭
    'helicopter': "helicopter|chopper", // 直升機
    'truck': "truck|lorry", // 卡車
    'ambulance': "ambulance", // 救護車
    'submarine': "submarine|sub", // 潛水艇
    'skateboard': "skateboard", // 滑板
    'tricycle': "tricycle|trike", // 三輪車
    'sailboat': "sailboat|sailing boat|yacht", // 帆船
    'cablecar': "cable car|gondola", // 纜車
    'firetruck': "fire truck|fire engine", // 消防車
    'tractor': "tractor", // 拖拉機
    'canoe': "canoe|kayak", // 獨木舟
    'sun': "sun", // 太陽
    'moon': "moon|crescent moon", // 月亮
    'star': "star|stars", // 星星
    'cloud': "cloud", // 雲
    'rain': "rain|raining|rainy day", // 下雨
    'rainbow': "rainbow", // 彩虹
    'tree': "tree", // 樹
    'flower': "flower", // 花
    'mountain': "mountain", // 山
    'sea': "sea|ocean", // 大海
    'lightning': "lightning|thunder", // 閃電
    'snowman': "snowman", // 雪人
    'volcano': "volcano", // 火山
    'island': "island|small island", // 小島
    'desert': "desert", // 沙漠
    'waterfall': "waterfall", // 瀑布
    'cactus': "cactus", // 仙人掌
    'mushroom': "mushroom", // 蘑菇
    'maple': "maple leaf|leaf", // 楓葉
    'tornado': "tornado|twister", // 龍捲風
    'soccer': "soccer|football", // 足球
    'basketball': "basketball", // 籃球
    'racket': "tennis racket|racket|racquet", // 球拍
    'guitar': "guitar", // 吉他
    'drum': "drum|drums|drum set", // 鼓
    'kite': "kite", // 風箏
    'swing': "swing", // 鞦韆
    'slide': "slide|playground slide", // 溜滑梯
    'ferriswheel': "ferris wheel", // 摩天輪
    'dice': "dice|die", // 骰子
    'cards': "playing cards|cards|deck of cards", // 撲克牌
    'puzzle': "jigsaw puzzle|puzzle|jigsaw", // 拼圖
    'note': "music note|note|musical note", // 音符
    'microphone': "microphone|mic", // 麥克風
    'camera': "camera", // 相機
    'trophy': "trophy|cup", // 獎盃
    'computer': "computer|laptop", // 電腦
    'piano': "piano", // 鋼琴
    'bowling': "bowling|bowling ball", // 保齡球
    'jumprope': "jump rope|skipping rope", // 跳繩
    'face': "face", // 臉
    'eye': "eye|eyes", // 眼睛
    'hand': "hand", // 手
    'house': "house|home", // 房子
    'person': "child|kid", // 小朋友
    'shirt': "t-shirt|tee|shirt", // T恤
    'lantern': "lantern|red lantern|paper lantern", // 燈籠
    'xmastree': "christmas tree", // 聖誕樹
    'w-animal-0': "bear", // 熊
    'w-animal-1': "tiger", // 老虎
    'w-animal-2': "monkey", // 猴子
    'w-animal-3': "snail", // 蝸牛
    'w-animal-4': "shark", // 鯊魚
    'w-animal-5': "goldfish", // 金魚
    'w-animal-6': "octopus", // 章魚
    'w-animal-7': "duck", // 鴨子
    'w-animal-8': "chick", // 小雞
    'w-animal-9': "mouse|rat", // 老鼠
    'w-animal-10': "horse", // 馬
    'w-animal-11': "sheep|lamb", // 綿羊
    'w-animal-12': "spider", // 蜘蛛
    'w-animal-13': "ant", // 螞蟻
    'w-animal-14': "ladybug|ladybird", // 瓢蟲
    'w-animal-15': "caterpillar", // 毛毛蟲
    'w-animal-16': "panda", // 貓熊
    'w-animal-17': "cheetah", // 獵豹
    'w-animal-18': "gorilla", // 猩猩
    'w-animal-19': "squirrel", // 松鼠
    'w-animal-20': "hedgehog", // 刺蝟
    'w-animal-21': "dolphin", // 海豚
    'w-animal-22': "jellyfish", // 水母
    'w-animal-23': "shrimp|prawn", // 蝦子
    'w-animal-24': "lobster", // 龍蝦
    'w-animal-25': "seahorse", // 海馬
    'w-animal-26': "goose", // 鵝
    'w-animal-27': "rooster", // 公雞
    'w-animal-28': "hen", // 母雞
    'w-animal-29': "eagle", // 老鷹
    'w-animal-30': "parrot", // 鸚鵡
    'w-animal-31': "peacock", // 孔雀
    'w-animal-32': "swan", // 天鵝
    'w-animal-33': "swallow", // 燕子
    'w-animal-34': "woodpecker", // 啄木鳥
    'w-animal-35': "flamingo", // 紅鶴
    'w-animal-36': "ostrich", // 鴕鳥
    'w-animal-37': "camel", // 駱駝
    'w-animal-38': "zebra", // 斑馬
    'w-animal-39': "hippo|hippopotamus", // 河馬
    'w-animal-40': "rhino|rhinoceros", // 犀牛
    'w-animal-41': "deer", // 梅花鹿
    'w-animal-42': "goat", // 山羊
    'w-animal-43': "fox", // 狐狸
    'w-animal-44': "wolf", // 狼
    'w-animal-45': "koala", // 無尾熊
    'w-animal-46': "kangaroo", // 袋鼠
    'w-animal-47': "sloth", // 樹懶
    'w-animal-48': "raccoon", // 浣熊
    'w-animal-49': "seal", // 海豹
    'w-animal-50': "polar bear", // 北極熊
    'w-animal-51': "bat", // 蝙蝠
    'w-animal-52': "hamster", // 倉鼠
    'w-animal-53': "dragonfly", // 蜻蜓
    'w-animal-54': "cicada", // 蟬
    'w-animal-55': "earthworm|worm", // 蚯蚓
    'w-animal-56': "crocodile|alligator", // 鱷魚
    'w-animal-57': "lizard", // 蜥蜴
    'w-animal-58': "gecko", // 壁虎
    'w-animal-59': "clownfish", // 小丑魚
    'w-animal-60': "pufferfish", // 河豚
    'w-animal-61': "tadpole", // 蝌蚪
    'w-animal-62': "firefly", // 螢火蟲
    'w-animal-63': "mosquito", // 蚊子
    'w-animal-64': "fly|housefly", // 蒼蠅
    'w-animal-65': "cockroach", // 蟑螂
    'w-animal-66': "praying mantis|mantis", // 螳螂
    'w-animal-67': "alpaca|llama", // 羊駝
    'w-animal-68': "seashell|shell", // 貝殼
    'w-animal-69': "starfish", // 海星
    'w-animal-70': "chameleon", // 變色龍
    'w-animal-71': "otter", // 水獺
    'w-animal-72': "eel", // 鰻魚
    'w-animal-73': "flounder|flatfish", // 比目魚
    'w-animal-74': "stingray", // 魟魚
    'w-animal-75': "sea anemone|anemone", // 海葵
    'w-animal-76': "coral", // 珊瑚
    'w-animal-77': "sea urchin", // 海膽
    'w-animal-78': "clam", // 蛤蜊
    'w-animal-79': "oyster", // 牡蠣
    'w-animal-80': "squid|cuttlefish", // 花枝
    'w-animal-81': "toad", // 蟾蜍
    'w-animal-82': "newt|salamander", // 蠑螈
    'w-animal-83': "pangolin", // 穿山甲
    'w-animal-84': "anteater", // 食蟻獸
    'w-animal-85': "armadillo", // 犰狳
    'w-animal-86': "baboon", // 狒狒
    'w-animal-87': "chimpanzee|chimp", // 黑猩猩
    'w-animal-88': "gibbon", // 長臂猿
    'w-animal-89': "wild boar|boar", // 野豬
    'w-animal-90': "moose|elk", // 麋鹿
    'w-animal-91': "reindeer", // 馴鹿
    'w-animal-92': "antelope", // 羚羊
    'w-animal-93': "buffalo|water buffalo", // 水牛
    'w-animal-94': "yak", // 氂牛
    'w-animal-95': "snow leopard", // 雪豹
    'w-animal-96': "cougar|puma|mountain lion", // 美洲獅
    'w-animal-97': "groundhog|marmot", // 土撥鼠
    'w-animal-98': "mole", // 鼴鼠
    'w-animal-99': "weasel", // 黃鼠狼
    'w-animal-100': "skunk", // 臭鼬
    'w-animal-101': "seagull|gull", // 海鷗
    'w-animal-102': "albatross", // 信天翁
    'w-animal-103': "rhinoceros beetle|rhino beetle", // 獨角仙
    'w-animal-104': "centipede", // 蜈蚣
    'w-animal-105': "cricket", // 蟋蟀
    'w-animal-106': "salmon", // 鮭魚
    'w-animal-107': "tuna", // 鮪魚
    'w-animal-108': "donkey", // 驢子
    'w-animal-109': "turkey", // 火雞
    'w-food-0': "orange|tangerine", // 橘子
    'w-food-1': "lemon", // 檸檬
    'w-food-2': "cherry", // 櫻桃
    'w-food-3': "tomato", // 番茄
    'w-food-4': "corn", // 玉米
    'w-food-5': "carrot", // 紅蘿蔔
    'w-food-6': "pumpkin", // 南瓜
    'w-food-7': "eggplant", // 茄子
    'w-food-8': "sausage", // 香腸
    'w-food-9': "french fries|fries", // 薯條
    'w-food-10': "pudding", // 布丁
    'w-food-11': "cookie|biscuit", // 餅乾
    'w-food-12': "chocolate", // 巧克力
    'w-food-13': "marshmallow", // 棉花糖
    'w-food-14': "milk", // 牛奶
    'w-food-15': "juice", // 果汁
    'w-food-16': "tangyuan|sweet rice ball", // 湯圓
    'w-food-17': "bao|baozi", // 包子
    'w-food-18': "dumpling|dumplings", // 水餃
    'w-food-19': "drumstick|chicken leg", // 雞腿
    'w-food-20': "popcorn", // 爆米花
    'w-food-21': "pear", // 梨子
    'w-food-22': "coconut", // 椰子
    'w-food-23': "peanut", // 花生
    'w-food-24': "noodles|noodle", // 麵條
    'w-food-25': "instant noodles|cup noodles", // 泡麵
    'w-food-26': "rice|white rice", // 白飯
    'w-food-27': "candy|sweets", // 糖果
    'w-food-28': "mango", // 芒果
    'w-food-29': "peach", // 水蜜桃
    'w-food-30': "kiwi|kiwifruit", // 奇異果
    'w-food-31': "papaya", // 木瓜
    'w-food-32': "cantaloupe|melon", // 哈密瓜
    'w-food-33': "pomelo|grapefruit", // 柚子
    'w-food-34': "wax apple", // 蓮霧
    'w-food-35': "guava", // 芭樂
    'w-food-36': "starfruit|star fruit", // 楊桃
    'w-food-37': "blueberry", // 藍莓
    'w-food-38': "persimmon", // 柿子
    'w-food-39': "radish|daikon", // 白蘿蔔
    'w-food-40': "potato", // 馬鈴薯
    'w-food-41': "sweet potato", // 地瓜
    'w-food-42': "bell pepper|green pepper", // 青椒
    'w-food-43': "broccoli", // 花椰菜
    'w-food-44': "cabbage", // 高麗菜
    'w-food-45': "onion", // 洋蔥
    'w-food-46': "garlic", // 大蒜
    'w-food-47': "chili|chili pepper|chilli", // 辣椒
    'w-food-48': "tofu", // 豆腐
    'w-food-49': "congee|porridge", // 稀飯
    'w-food-50': "ramen", // 拉麵
    'w-food-51': "mantou|steamed bread", // 饅頭
    'w-food-52': "egg pancake|egg crepe", // 蛋餅
    'w-food-53': "potsticker|pot sticker", // 鍋貼
    'w-food-54': "soup dumpling|xiaolongbao", // 小籠包
    'w-food-55': "zongzi|sticky rice dumpling", // 肉粽
    'w-food-56': "mooncake", // 月餅
    'w-food-57': "pineapple cake", // 鳳梨酥
    'w-food-58': "egg tart", // 蛋塔
    'w-food-59': "jelly", // 果凍
    'w-food-60': "potato chips|chips", // 洋芋片
    'w-food-61': "fried chicken", // 炸雞
    'w-food-62': "steak", // 牛排
    'w-food-63': "bacon", // 培根
    'w-food-64': "cheese", // 起司
    'w-food-65': "soda|soft drink", // 汽水
    'w-food-66': "black tea", // 紅茶
    'w-food-67': "soy milk|soymilk", // 豆漿
    'w-food-68': "honey", // 蜂蜜
    'w-food-69': "sandwich", // 三明治
    'w-food-70': "bagel", // 貝果
    'w-food-71': "croissant", // 可頌
    'w-food-72': "salad", // 沙拉
    'w-food-73': "cream soup|thick soup", // 濃湯
    'w-food-74': "ham", // 火腿
    'w-food-75': "fried rice", // 炒飯
    'w-food-76': "chicken cutlet|fried chicken cutlet", // 雞排
    'w-food-77': "shaved ice", // 刨冰
    'w-food-78': "tofu pudding|douhua", // 豆花
    'w-food-79': "popsicle|ice pop", // 冰棒
    'w-food-80': "milk tea", // 奶茶
    'w-food-81': "crepe", // 可麗餅
    'w-food-82': "pancake|pancakes", // 鬆餅
    'w-food-83': "cream puff", // 泡芙
    'w-food-84': "dorayaki", // 銅鑼燒
    'w-food-85': "mochi", // 麻糬
    'w-food-86': "meatball|pork ball", // 貢丸
    'w-food-87': "braised egg|soy sauce egg", // 滷蛋
    'w-food-88': "bento|lunch box", // 便當
    'w-food-89': "shaobing|sesame flatbread", // 燒餅
    'w-food-90': "youtiao|fried dough stick", // 油條
    'w-food-91': "red bean cake|red bean pancake", // 紅豆餅
    'w-food-92': "egg cake|baby cake", // 雞蛋糕
    'w-food-93': "takoyaki|octopus balls", // 章魚燒
    'w-food-94': "taiyaki|fish-shaped cake", // 鯛魚燒
    'w-food-95': "macaron|macaroon", // 馬卡龍
    'w-food-96': "sundae", // 聖代
    'w-food-97': "milkshake|shake", // 奶昔
    'w-food-98': "rice cake|nian gao", // 年糕
    'w-food-99': "yogurt|yoghurt", // 優格
    'w-food-100': "butter", // 奶油
    'w-food-101': "jam", // 果醬
    'w-food-102': "pistachio", // 開心果
    'w-food-103': "walnut", // 核桃
    'w-food-104': "sunflower seeds|sunflower seed", // 瓜子
    'w-food-105': "cashew", // 腰果
    'w-food-106': "raisin|raisins", // 葡萄乾
    'w-food-107': "almond", // 杏仁
    'w-food-108': "nougat", // 牛軋糖
    'w-food-109': "green tea", // 綠茶
    'w-food-110': "spaghetti|pasta", // 義大利麵
    'w-food-111': "green onion pancake|scallion pancake", // 蔥油餅
    'w-food-112': "stinky tofu", // 臭豆腐
    'w-food-113': "braised pork rice", // 滷肉飯
    'w-food-114': "beef noodle soup|beef noodles", // 牛肉麵
    'w-food-115': "oyster omelet|oyster omelette", // 蚵仔煎
    'w-food-116': "intestine vermicelli|mee sua", // 大腸麵線
    'w-food-117': "popcorn chicken|salt and pepper chicken", // 鹹酥雞
    'w-food-118': "braised snacks|lu wei", // 滷味
    'w-food-119': "oden", // 關東煮
    'w-food-120': "curry rice|curry", // 咖哩飯
    'w-food-121': "sukiyaki", // 壽喜燒
    'w-food-122': "miso soup", // 味噌湯
    'w-food-123': "shumai|siu mai", // 燒賣
    'w-food-124': "ba-wan|taiwanese meatball", // 肉圓
    'w-food-125': "bowl rice cake|wagui", // 碗粿
    'w-food-126': "sticky rice|glutinous rice", // 米糕
    'w-food-127': "oil rice|glutinous oil rice", // 油飯
    'w-food-128': "gua bao|pork belly bun", // 刈包
    'w-food-129': "pepper bun|black pepper bun", // 胡椒餅
    'w-food-130': "flaky scallion pancake|cong zhua bing", // 蔥抓餅
    'w-food-131': "pig blood cake|pork blood cake", // 豬血糕
    'w-food-132': "oyster vermicelli", // 蚵仔麵線
    'w-food-133': "danzai noodles|tan tsai noodles", // 擔仔麵
    'w-food-134': "zha jiang noodles|noodles with meat sauce", // 炸醬麵
    'w-food-135': "wonton|wontons", // 餛飩
    'w-food-136': "rice vermicelli|rice noodles", // 米粉
    'w-food-137': "clay pot noodles|pot noodle soup", // 鍋燒麵
    'w-food-138': "pork chop rice", // 排骨飯
    'w-food-139': "chicken drumstick rice|chicken leg rice", // 雞腿飯
    'w-food-140': "turnip cake|radish cake", // 蘿蔔糕
    'w-food-141': "taro cake", // 芋頭糕
    'w-food-142': "rice noodle roll", // 腸粉
    'w-food-143': "bbq pork bun|char siu bao", // 叉燒包
    'w-food-144': "shrimp dumpling|har gow", // 蝦餃
    'w-food-145': "taco", // 塔可餅
    'w-food-146': "lasagna|lasagne", // 千層麵
    'w-food-147': "risotto", // 燉飯
    'w-food-148': "fish and chips", // 炸魚薯條
    'w-food-149': "hamburger steak|salisbury steak", // 漢堡排
    'w-food-150': "beef bowl|gyudon", // 牛丼
    'w-food-151': "oyakodon|chicken and egg bowl", // 親子丼
    'w-food-152': "tempura", // 天婦羅
    'w-food-153': "udon", // 烏龍麵
    'w-food-154': "soba|buckwheat noodles", // 蕎麥麵
    'w-food-155': "okonomiyaki", // 大阪燒
    'w-food-156': "kimchi", // 泡菜
    'w-food-157': "bibimbap", // 石鍋拌飯
    'w-food-158': "korean fried chicken", // 韓式炸雞
    'w-food-159': "tiramisu", // 提拉米蘇
    'w-food-160': "apple pie", // 蘋果派
    'w-food-161': "spring roll", // 春捲
    'w-food-162': "smoothie|slush", // 冰沙
    'w-food-163': "red bean soup", // 紅豆湯
    'w-food-164': "grass jelly|herbal jelly", // 仙草
    'w-food-165': "aiyu jelly|aiyu", // 愛玉
    'w-home-0': "sofa|couch", // 沙發
    'w-home-1': "bed", // 床
    'w-home-2': "pillow", // 枕頭
    'w-home-3': "bowl", // 碗
    'w-home-4': "plate|dish", // 盤子
    'w-home-5': "spoon", // 湯匙
    'w-home-6': "fork", // 叉子
    'w-home-7': "chopsticks", // 筷子
    'w-home-8': "toothpaste", // 牙膏
    'w-home-9': "towel", // 毛巾
    'w-home-10': "comb", // 梳子
    'w-home-11': "desk lamp|lamp", // 檯燈
    'w-home-12': "candle", // 蠟燭
    'w-home-13': "lock|padlock", // 鎖頭
    'w-home-14': "window", // 窗戶
    'w-home-15': "ladder", // 梯子
    'w-home-16': "bucket|pail", // 水桶
    'w-home-17': "trash can|trash bin|garbage can|dustbin", // 垃圾桶
    'w-home-18': "toilet paper|tissue paper", // 衛生紙
    'w-home-19': "envelope", // 信封
    'w-home-20': "ruler", // 尺
    'w-home-21': "eraser|rubber", // 橡皮擦
    'w-home-22': "battery", // 電池
    'w-home-23': "refrigerator|fridge", // 冰箱
    'w-home-24': "picture frame|photo frame", // 相框
    'w-home-25': "vase", // 花瓶
    'w-home-26': "flashlight|torch", // 手電筒
    'w-home-27': "frying pan|pan|skillet", // 平底鍋
    'w-home-28': "kettle|teapot", // 水壺
    'w-home-29': "wardrobe|closet", // 衣櫃
    'w-home-30': "oven", // 烤箱
    'w-home-31': "microwave|microwave oven", // 微波爐
    'w-home-32': "rice cooker", // 電鍋
    'w-home-33': "mop", // 拖把
    'w-home-34': "soap", // 肥皂
    'w-home-35': "vacuum cleaner|vacuum", // 吸塵器
    'w-home-36': "iron|clothes iron", // 熨斗
    'w-home-37': "kitchen knife|knife|cleaver", // 菜刀
    'w-home-38': "cutting board|chopping board", // 砧板
    'w-home-39': "hanger|coat hanger|clothes hanger", // 衣架
    'w-home-40': "button", // 鈕扣
    'w-home-41': "needle and thread|sewing kit", // 針線
    'w-home-42': "zipper|zip", // 拉鍊
    'w-home-43': "notebook", // 筆記本
    'w-home-44': "stapler", // 釘書機
    'w-home-45': "glue", // 膠水
    'w-home-46': "calendar", // 日曆
    'w-home-47': "thermometer", // 溫度計
    'w-home-48': "power outlet|outlet|socket", // 插座
    'w-home-49': "lighter", // 打火機
    'w-home-50': "matches|matchstick|match", // 火柴
    'w-home-51': "hot water flask|water flask", // 熱水瓶
    'w-home-52': "blender", // 果汁機
    'w-home-53': "spatula", // 鍋鏟
    'w-home-54': "brush", // 刷子
    'w-home-55': "scale|weighing scale|bathroom scale", // 體重計
    'w-home-56': "map", // 地圖
    'w-home-57': "cushion|throw pillow", // 抱枕
    'w-home-58': "carpet|rug", // 地毯
    'w-home-59': "mosquito coil", // 蚊香
    'w-home-60': "air conditioner|ac", // 冷氣
    'w-home-61': "pot lid|lid", // 鍋蓋
    'w-home-62': "measuring cup", // 量杯
    'w-home-63': "bandage", // 繃帶
    'w-home-64': "bookshelf|bookcase", // 書架
    'w-home-65': "doorknob|door handle", // 門把
    'w-home-66': "speaker|stereo", // 音響
    'w-home-67': "keyboard", // 鍵盤
    'w-home-68': "monitor|screen", // 螢幕
    'w-home-69': "saw", // 鋸子
    'w-home-70': "tape measure", // 捲尺
    'w-home-71': "hand fan|folding fan", // 扇子
    'w-home-72': "blanket|quilt|comforter", // 棉被
    'w-home-73': "heater|space heater", // 暖爐
    'w-home-74': "flower pot|flowerpot", // 花盆
    'w-home-75': "watering can", // 澆花器
    'w-home-76': "computer mouse|mouse", // 滑鼠
    'w-home-77': "doorbell", // 門鈴
    'w-home-78': "safe|safe box", // 保險箱
    'w-home-79': "hammer", // 鐵鎚
    'w-home-80': "wrench|spanner", // 扳手
    'w-home-81': "paintbrush|paint brush", // 油漆刷
    'w-home-82': "printer", // 印表機
    'w-home-83': "charger", // 充電器
    'w-home-84': "extension cord|power strip", // 延長線
    'w-home-85': "drying rack|clothes drying rack", // 曬衣架
    'w-home-86': "hair dryer|blow dryer|hairdryer", // 吹風機
    'w-home-87': "nail clipper|nail clippers", // 指甲剪
    'w-home-88': "suitcase|luggage", // 行李箱
    'w-home-89': "sticky note|post-it", // 便利貼
    'w-home-90': "thermos|vacuum flask", // 保溫瓶
    'w-home-91': "bottle opener", // 開瓶器
    'w-home-92': "remote control|remote", // 遙控器
    'w-home-93': "fire extinguisher", // 滅火器
    'w-home-94': "toolbox", // 工具箱
    'w-home-95': "screwdriver", // 螺絲起子
    'w-home-96': "razor|shaver", // 刮鬍刀
    'w-home-97': "bug zapper|electric fly swatter", // 電蚊拍
    'w-home-98': "projector", // 投影機
    'w-home-99': "first aid kit|first-aid kit", // 急救箱
    'w-home-100': "cotton swab|q-tip", // 棉花棒
    'w-home-101': "headphones|earphones|earbuds", // 耳機
    'w-home-102': "radio", // 收音機
    'w-home-103': "telescope|binoculars", // 望遠鏡
    'w-home-104': "compass", // 指南針
    'w-home-105': "rag|dishcloth|cleaning cloth", // 抹布
    'w-home-106': "stamp|postage stamp", // 郵票
    'w-home-107': "keychain|key ring", // 鑰匙圈
    'w-home-108': "dishwasher", // 洗碗機
    'w-home-109': "induction cooker|induction stove", // 電磁爐
    'w-home-110': "water heater", // 熱水器
    'w-home-111': "water dispenser|water cooler", // 飲水機
    'w-home-112': "dehumidifier", // 除濕機
    'w-home-113': "coffee maker|coffee machine", // 咖啡機
    'w-home-114': "toaster", // 烤麵包機
    'w-home-115': "plastic wrap|cling film|cling wrap", // 保鮮膜
    'w-home-116': "food container|lunch container|tupperware", // 保鮮盒
    'w-home-117': "aluminum foil|tin foil", // 鋁箔紙
    'w-home-118': "scouring pad|scrub sponge", // 菜瓜布
    'w-home-119': "dish soap|dishwashing liquid", // 洗碗精
    'w-home-120': "laundry detergent|detergent", // 洗衣精
    'w-home-121': "body wash|shower gel", // 沐浴乳
    'w-home-122': "shampoo", // 洗髮精
    'w-home-123': "clothes dryer|tumble dryer|dryer", // 烘衣機
    'w-home-124': "air purifier", // 清淨機
    'w-home-125': "range hood|extractor hood|kitchen hood", // 抽油煙機
    'w-home-126': "gas stove|stove", // 瓦斯爐
    'w-home-127': "air fryer", // 氣炸鍋
    'w-home-128': "water purifier|water filter", // 淨水器
    'w-home-129': "ice maker", // 製冰機
    'w-home-130': "massage chair", // 按摩椅
    'w-home-131': "robot vacuum|robot vacuum cleaner|roomba", // 掃地機
    'w-home-132': "security camera|cctv|surveillance camera", // 監視器
    'w-home-133': "router|wifi router", // 路由器
    'w-home-134': "scanner", // 掃描器
    'w-home-135': "curling iron|curling wand", // 捲髮棒
    'w-home-136': "clothespin|clothes peg|clothespeg", // 曬衣夾
    'w-home-137': "storage box|storage bin", // 收納箱
    'w-home-138': "locker|cabinet", // 置物櫃
    'w-home-139': "sieve|strainer", // 篩子
    'w-home-140': "spirit level|level", // 水平儀
    'w-home-141': "garden shears|pruning shears|pruners", // 園藝剪
    'w-home-142': "barbecue grill|bbq grill|grill", // 烤肉架
    'w-home-143': "soy milk maker", // 豆漿機
    'w-home-144': "laundry basket|hamper", // 洗衣籃
    'w-home-145': "garbage bag|trash bag|bin bag", // 垃圾袋
    'w-vehicle-0': "subway|metro|mrt|underground", // 捷運
    'w-vehicle-1': "taxi|cab", // 計程車
    'w-vehicle-2': "police car|cop car", // 警車
    'w-vehicle-3': "school bus", // 校車
    'w-vehicle-4': "bullet train|high speed rail|high-speed train", // 高鐵
    'w-vehicle-5': "cruise ship|cruise liner|cruise", // 郵輪
    'w-vehicle-6': "fishing boat", // 漁船
    'w-vehicle-7': "stroller|baby stroller|pram", // 嬰兒車
    'w-vehicle-8': "wheelchair", // 輪椅
    'w-vehicle-9': "race car|racing car", // 賽車
    'w-vehicle-10': "garbage truck|trash truck|rubbish truck", // 垃圾車
    'w-vehicle-11': "bulldozer", // 推土機
    'w-vehicle-12': "excavator|digger", // 挖土機
    'w-vehicle-13': "cement mixer|concrete mixer", // 水泥車
    'w-vehicle-14': "camper van|rv|motorhome|campervan", // 露營車
    'w-vehicle-15': "jeep", // 吉普車
    'w-vehicle-16': "electric car|ev|electric vehicle", // 電動車
    'w-vehicle-17': "pickup truck|pickup|van", // 小貨車
    'w-vehicle-18': "speedboat", // 快艇
    'w-vehicle-19': "hovercraft", // 氣墊船
    'w-vehicle-20': "parachute", // 降落傘
    'w-vehicle-21': "baby carriage|pushchair", // 娃娃車
    'w-vehicle-22': "horse carriage|carriage|horse-drawn carriage", // 馬車
    'w-vehicle-23': "glider", // 滑翔機
    'w-vehicle-24': "water truck|water sprinkler truck|street sprinkler", // 灑水車
    'w-vehicle-25': "tanker truck|tanker|oil tanker", // 油罐車
    'w-vehicle-26': "flatbed truck|flatbed", // 拖板車
    'w-vehicle-27': "bumper car|bumper cars|dodgems", // 碰碰車
    'w-vehicle-28': "paraglider|paragliding", // 飛行傘
    'w-vehicle-29': "off-road vehicle|suv|offroad vehicle", // 越野車
    'w-vehicle-30': "crane", // 起重機
    'w-vehicle-31': "convertible|cabriolet", // 敞篷車
    'w-vehicle-32': "steam train|steam locomotive", // 蒸汽火車
    'w-vehicle-33': "tour bus|coach", // 遊覽車
    'w-vehicle-34': "spaceship|spacecraft|space ship", // 太空船
    'w-vehicle-35': "handcart|cart|wheelbarrow", // 手推車
    'w-vehicle-36': "unicycle|wheelbarrow", // 獨輪車
    'w-vehicle-37': "double-decker bus|double decker|double-decker", // 雙層巴士
    'w-vehicle-38': "airship|blimp|zeppelin", // 飛船
    'w-vehicle-39': "sled|sleigh|sledge", // 雪橇
    'w-vehicle-40': "bamboo raft|raft", // 竹筏
    'w-vehicle-41': "ferry", // 渡輪
    'w-vehicle-42': "inline skates|rollerblades", // 直排輪
    'w-vehicle-43': "mountain bike", // 登山車
    'w-vehicle-44': "hang glider|hang gliding", // 滑翔翼
    'w-vehicle-45': "tow truck", // 拖吊車
    'w-vehicle-46': "refrigerated truck|reefer truck", // 冷凍車
    'w-vehicle-47': "semi truck|tractor trailer|semi-trailer", // 聯結車
    'w-vehicle-48': "monorail", // 單軌列車
    'w-vehicle-49': "maglev|maglev train", // 磁浮列車
    'w-vehicle-50': "steamboat|steamship", // 蒸汽船
    'w-vehicle-51': "jet ski|motorboat", // 摩托艇
    'w-vehicle-52': "electric skateboard|e-skateboard|electric scooter", // 電動滑板
    'w-vehicle-53': "sampan", // 舢舨
    'w-vehicle-54': "space shuttle|shuttle", // 太空梭
    'w-nature-0': "sky", // 天空
    'w-nature-1': "river", // 河流
    'w-nature-2': "forest|woods", // 森林
    'w-nature-3': "stone|rock", // 石頭
    'w-nature-4': "grass|lawn|meadow", // 草地
    'w-nature-5': "snowflake", // 雪花
    'w-nature-6': "shooting star|meteor", // 流星
    'w-nature-7': "petal", // 花瓣
    'w-nature-8': "sunflower", // 向日葵
    'w-nature-9': "rose", // 玫瑰
    'w-nature-10': "palm tree|coconut tree", // 椰子樹
    'w-nature-11': "pine tree|pine", // 松樹
    'w-nature-12': "earth|globe|planet earth", // 地球
    'w-nature-13': "pond", // 池塘
    'w-nature-14': "beach|seashore", // 海灘
    'w-nature-15': "stream|creek|brook", // 溪流
    'w-nature-16': "bamboo forest|bamboo grove|bamboo", // 竹林
    'w-nature-17': "cave", // 山洞
    'w-nature-18': "iceberg", // 冰山
    'w-nature-19': "swamp|marsh", // 沼澤
    'w-nature-20': "soil|dirt|mud", // 泥土
    'w-nature-21': "branch|twig", // 樹枝
    'w-nature-22': "fruit", // 果實
    'w-nature-23': "maple tree|maple", // 楓樹
    'w-nature-24': "vine|vines", // 藤蔓
    'w-nature-25': "starry sky|night sky|starry night", // 星空
    'w-nature-26': "sea of clouds|cloud sea", // 雲海
    'w-nature-27': "tree trunk|trunk", // 樹幹
    'w-nature-28': "tree rings|tree ring|growth rings", // 年輪
    'w-nature-29': "fern|ferns", // 蕨類
    'w-nature-30': "chrysanthemum|mum", // 菊花
    'w-nature-31': "plum blossom|plum flower", // 梅花
    'w-nature-32': "wheat field", // 麥田
    'w-nature-33': "sapling|seedling", // 樹苗
    'w-nature-34': "basin", // 盆地
    'w-nature-35': "plateau|highland", // 高原
    'w-nature-36': "coast|coastline|shore", // 海岸
    'w-nature-37': "reef|sea rock", // 礁石
    'w-nature-38': "hillside|slope|hill slope", // 山坡
    'w-nature-39': "puddle", // 水窪
    'w-nature-40': "lake", // 湖泊
    'w-nature-41': "prairie|grassland|steppe", // 草原
    'w-nature-42': "valley", // 山谷
    'w-nature-43': "cliff", // 懸崖
    'w-nature-44': "glacier", // 冰河
    'w-nature-45': "oasis", // 綠洲
    'w-nature-46': "sand dune|dune", // 沙丘
    'w-nature-47': "tree root|root|roots", // 樹根
    'w-nature-48': "garden", // 花園
    'w-nature-49': "seed|seeds", // 種子
    'w-nature-50': "cherry blossom|sakura", // 櫻花
    'w-nature-51': "tulip", // 鬱金香
    'w-nature-52': "lily", // 百合
    'w-nature-53': "dandelion", // 蒲公英
    'w-nature-54': "lotus|lotus flower", // 荷花
    'w-nature-55': "moss", // 苔蘚
    'w-nature-56': "dewdrop|dew", // 露珠
    'w-nature-57': "mountain range|mountains", // 山脈
    'w-nature-58': "bark|tree bark", // 樹皮
    'w-nature-59': "pinecone|pine cone", // 松果
    'w-nature-60': "lotus leaf|lily pad", // 荷葉
    'w-nature-61': "orchid", // 蘭花
    'w-nature-62': "morning glory", // 牽牛花
    'w-nature-63': "peach blossom", // 桃花
    'w-nature-64': "rice field|paddy|rice paddy", // 稻田
    'w-nature-65': "bamboo shoot|bamboo shoots", // 竹筍
    'w-nature-66': "fallen leaves|fallen leaf", // 落葉
    'w-nature-67': "canyon|gorge", // 峽谷
    'w-nature-68': "bush|bushes|thicket", // 草叢
    'w-nature-69': "spring water|natural spring", // 泉水
    'w-nature-70': "ice cube|ice", // 冰塊
    'w-nature-71': "plain|plains", // 平原
    'w-nature-72': "hills|hill", // 丘陵
    'w-nature-73': "sandbar|sand bar", // 沙洲
    'w-nature-74': "tundra", // 苔原
    'w-nature-75': "dead branch|dry twig", // 枯枝
    'w-fun-0': "baseball", // 棒球
    'w-fun-1': "volleyball", // 排球
    'w-fun-2': "tennis|tennis ball", // 網球
    'w-fun-3': "table tennis|ping pong", // 桌球
    'w-fun-4': "badminton|shuttlecock", // 羽毛球
    'w-fun-5': "tent", // 帳篷
    'w-fun-6': "bubbles|bubble", // 泡泡
    'w-fun-7': "building blocks|blocks|lego", // 積木
    'w-fun-8': "teddy bear|stuffed toy|plush toy", // 泰迪熊
    'w-fun-9': "balloon", // 氣球
    'w-fun-10': "seesaw|teeter-totter", // 蹺蹺板
    'w-fun-11': "frisbee|flying disc", // 飛盤
    'w-fun-12': "spinning top|top", // 陀螺
    'w-fun-13': "robot", // 機器人
    'w-fun-14': "billiards|pool|snooker", // 撞球
    'w-fun-15': "jianzi|footbag|hacky sack", // 毽子
    'w-fun-16': "marbles|marble", // 彈珠
    'w-fun-17': "chinese chess|xiangqi", // 象棋
    'w-fun-18': "gashapon|capsule toy", // 扭蛋
    'w-fun-19': "streamer|streamers|ribbon streamer", // 彩帶
    'w-fun-20': "easel", // 畫架
    'w-fun-21': "artist brush|art brush|drawing brush", // 畫筆
    'w-fun-22': "watercolor|watercolour|watercolors", // 水彩
    'w-fun-23': "crayon|crayons", // 蠟筆
    'w-fun-24': "sleeping bag", // 睡袋
    'w-fun-25': "windmill|pinwheel", // 風車
    'w-fun-26': "horizontal bar|high bar", // 單槓
    'w-fun-27': "high jump", // 跳高
    'w-fun-28': "shot put", // 鉛球
    'w-fun-29': "stopwatch", // 碼表
    'w-fun-30': "goal|goalpost|soccer goal", // 球門
    'w-fun-31': "net|ball net", // 球網
    'w-fun-32': "goggles|swim goggles|swimming goggles", // 泳鏡
    'w-fun-33': "sticker|stickers", // 貼紙
    'w-fun-34': "haunted house", // 鬼屋
    'w-fun-35': "archery", // 射箭
    'w-fun-36': "board game|board games", // 桌遊
    'w-fun-37': "swim ring|inflatable ring|swim tube|float ring", // 游泳圈
    'w-fun-38': "snowboard|ski|skis", // 滑雪板
    'w-fun-39': "dumbbell|dumbbells", // 啞鈴
    'w-fun-40': "treadmill", // 跑步機
    'w-fun-41': "toy car", // 玩具車
    'w-fun-42': "weiqi|go|igo", // 圍棋
    'w-fun-43': "chess", // 西洋棋
    'w-fun-44': "mahjong|mahjongg", // 麻將
    'w-fun-45': "campfire|bonfire", // 營火
    'w-fun-46': "trampoline", // 跳跳床
    'w-fun-47': "darts|dart", // 飛鏢
    'w-fun-48': "parallel bars", // 雙槓
    'w-fun-49': "long jump", // 跳遠
    'w-fun-50': "javelin", // 標槍
    'w-fun-51': "relay baton|baton", // 接力棒
    'w-fun-52': "whistle", // 哨子
    'w-fun-53': "basketball hoop|hoop", // 籃框
    'w-fun-54': "running track|track", // 跑道
    'w-fun-55': "kickboard|swim board|float board", // 浮板
    'w-fun-56': "comic book|comic|manga", // 漫畫
    'w-fun-57': "pirate ship", // 海盜船
    'w-fun-58': "whack-a-mole", // 打地鼠
    'w-fun-59': "chinese checkers|checkers", // 跳棋
    'w-fun-60': "beach ball", // 沙灘球
    'w-fun-61': "weightlifting|weight lifting", // 舉重
    'w-fun-62': "fishing rod|fishing pole", // 釣竿
    'w-fun-63': "roller skates|ice skates|skates", // 溜冰鞋
    'w-fun-64': "hula hoop", // 呼拉圈
    'w-fun-65': "doll", // 洋娃娃
    'w-fun-66': "rubik's cube|rubiks cube|magic cube", // 魔術方塊
    'w-fun-67': "carousel|merry-go-round", // 旋轉木馬
    'w-fun-68': "roller coaster|rollercoaster", // 雲霄飛車
    'w-fun-69': "claw machine|crane game", // 夾娃娃機
    'w-fun-70': "surfboard", // 衝浪板
    'w-fun-71': "boxing gloves|boxing glove", // 拳擊手套
    'w-fun-72': "sandbox|sandpit", // 沙坑
    'w-fun-73': "fencing", // 擊劍
    'w-fun-74': "gymnastics", // 體操
    'w-fun-75': "golf", // 高爾夫
    'w-fun-76': "dodgeball", // 躲避球
    'w-fun-77': "sail|windsurfing sail", // 風帆
    'w-fun-78': "ring toss", // 套圈圈
    'w-fun-79': "scoreboard", // 計分板
    'w-fun-80': "bowling pin|bowling pins", // 保齡球瓶
    'w-fun-81': "paint palette|palette", // 調色盤
    'w-fun-82': "sketchbook|sketch book", // 素描本
    'w-emotion-0': "happy|joyful|glad", // 開心
    'w-emotion-1': "sad|heartbroken|unhappy", // 傷心
    'w-emotion-2': "angry|mad", // 生氣
    'w-emotion-3': "scared|afraid|frightened", // 害怕
    'w-emotion-4': "surprised|shocked", // 驚訝
    'w-emotion-5': "shy|bashful", // 害羞
    'w-emotion-6': "excited", // 興奮
    'w-emotion-7': "nervous", // 緊張
    'w-emotion-8': "bored", // 無聊
    'w-emotion-9': "tired|sleepy|exhausted", // 疲倦
    'w-emotion-10': "smug|pleased with oneself|self-satisfied", // 得意
    'w-emotion-11': "wronged|aggrieved|feeling wronged", // 委屈
    'w-emotion-12': "lonely|alone", // 孤單
    'w-emotion-13': "blissful|bliss|happiness", // 幸福
    'w-emotion-14': "touched|moved", // 感動
    'w-emotion-15': "proud", // 驕傲
    'w-emotion-16': "worried|troubled|bothered", // 煩惱
    'w-emotion-17': "embarrassed|awkward", // 尷尬
    'w-emotion-18': "pleasant surprise|delighted", // 驚喜
    'w-emotion-19': "courageous|brave|bold", // 勇敢
    'w-emotion-20': "smitten|heart flutter|crush", // 心動
    'w-emotion-21': "in pain|suffering|agony", // 痛苦
    'w-emotion-22': "comfortable|comfy|cozy", // 舒服
    'w-emotion-23': "disappointed", // 失望
    'w-emotion-24': "anxious|anxiety", // 焦慮
    'w-emotion-25': "jealous", // 嫉妒
    'w-emotion-26': "anticipation|looking forward|expectant", // 期待
    'w-emotion-27': "warm|warmth|heartwarming", // 溫暖
    'w-emotion-28': "curious", // 好奇
    'w-emotion-29': "confident|self-confident", // 自信
    'w-emotion-30': "grateful|thankful|thanks", // 感謝
    'w-emotion-31': "dejected|discouraged|downcast", // 沮喪
    'w-emotion-32': "relaxed|at ease|carefree", // 輕鬆
    'w-emotion-33': "regretful|regret|remorse", // 後悔
    'w-emotion-34': "satisfied|content|fulfilled", // 滿足
    'w-emotion-35': "sweet|sweetness|lovey-dovey", // 甜蜜
    'w-emotion-36': "envious|envy", // 羨慕
    'w-emotion-37': "thrilled|overjoyed|jumping for joy", // 雀躍
    'w-emotion-38': "hopeless|despair|desperate", // 絕望
    'w-emotion-39': "nostalgic|nostalgia|missing", // 懷念
    'w-idiom-0': "wait for a rabbit|waiting for a rabbit|rabbit and the stump|wait by a stump", // 守株待兔
    'w-idiom-1': "draw legs on a snake|drawing legs on a snake|gild the lily|legs on a snake", // 畫蛇添足
    'w-idiom-2': "frog in a well|frog in the well|well frog", // 井底之蛙
    'w-idiom-3': "mend the fold|lock the barn door|close the barn door|mend the pen after sheep are lost", // 亡羊補牢
    'w-idiom-4': "fox and the tiger|fox borrows the tiger's might|fox borrowing the tiger's power", // 狐假虎威
    'w-idiom-5': "steal a bell|cover your ears to steal a bell|plug ears to steal a bell|stealing a bell", // 掩耳盜鈴
    'w-idiom-6': "play music to a cow|play the lute to a cow|cast pearls before swine|playing music to a cow", // 對牛彈琴
    'w-idiom-7': "carve a boat for a sword|sword overboard|mark the boat to find a sword|lost sword", // 刻舟求劍
    'w-idiom-8': "snake in the cup|snake in a cup|bow in the cup|bow reflection snake", // 杯弓蛇影
    'w-idiom-9': "snipe and clam|clam and snipe|the snipe and the clam", // 鷸蚌相爭
    'w-idiom-10': "blessing in disguise|old man lost his horse|the old man's horse", // 塞翁失馬
    'w-idiom-11': "blind men and the elephant|blind man and elephant|blind men and elephant", // 盲人摸象
    'w-idiom-12': "move a mountain|moving mountains|move mountains|foolish old man moves mountains", // 愚公移山
    'w-idiom-13': "pull up seedlings|pulling seedlings|pull seedlings to help them grow", // 拔苗助長
    'w-idiom-14': "lord ye loves dragons|fake dragon lover|ye gong loves dragons", // 葉公好龍
    'w-idiom-15': "three visits to the cottage|visit the cottage three times|three visits", // 三顧茅廬
    'w-idiom-16': "crouching tiger hidden dragon|crouching tiger|hidden dragon|tiger and dragon", // 臥虎藏龍
    'w-idiom-17': "add the finishing touch|finishing touch|dot the dragon's eyes", // 畫龍點睛
    'w-idiom-18': "two birds with one arrow|two eagles with one arrow|one arrow two birds", // 一箭雙鵰
    'w-idiom-19': "never miss|perfect aim|hit every shot|bullseye every time", // 百發百中
    'w-idiom-20': "instant success|success on arrival|horse brings success", // 馬到成功
    'w-idiom-21': "fail the exam|failed the exam|last on the list", // 名落孫山
    'w-idiom-22': "burn the boats|burn your bridges|burn the bridges|no turning back|burn your boats", // 破釜沉舟
    'w-idiom-23': "sleep on firewood and taste gall|taste gall|endure hardship for revenge", // 臥薪嘗膽
    'w-idiom-24': "return the jade|return the jade intact|return jade to zhao", // 完璧歸趙
    'w-idiom-25': "carry thorns to apologize|carry thorns and say sorry|bear a switch", // 負荊請罪
    'w-idiom-26': "armchair general|armchair strategist|paper strategy|talk big on paper", // 紙上談兵
    'w-idiom-27': "surrounded on all sides|surrounded by enemies|besieged|trapped on all sides", // 四面楚歌
    'w-idiom-28': "call a deer a horse|calling a deer a horse|point at a deer call it a horse", // 指鹿為馬
    'w-idiom-29': "plums to quench thirst|picture plums to ease thirst|imagine plums", // 望梅止渴
    'w-idiom-30': "every bush is an enemy|seeing enemies everywhere|paranoid", // 草木皆兵
    'w-idiom-31': "have a plan in mind|have a clear plan|bamboo in mind|well prepared", // 胸有成竹
    'w-idiom-32': "charcoal in the snow|a friend in need|timely help|give charcoal in snow", // 雪中送炭
    'w-idiom-33': "icing on the cake|add flowers to brocade|cherry on top", // 錦上添花
    'w-idiom-34': "add fuel to the fire|pour oil on the fire|fuel the fire|fuel to the fire", // 火上加油
    'w-idiom-35': "like a fish in water|fish in water|in your element", // 如魚得水
    'w-idiom-36': "kill two birds with one stone|two birds one stone|two birds with one stone", // 一石二鳥
    'w-idiom-37': "a drop in the ocean|drop in the ocean|a drop in the bucket|drop in the bucket", // 九牛一毛
    'w-idiom-38': "chickens and dogs running wild|chaos|pandemonium|mayhem|total chaos", // 雞飛狗跳
    'w-idiom-39': "dragon and phoenix dancing|flowing calligraphy|flamboyant calligraphy|dragons and phoenixes", // 龍飛鳳舞
    'w-idiom-40': "birds sing flowers bloom|birds and flowers|birdsong and flowers", // 鳥語花香
    'w-idiom-41': "sunny and breezy|lovely weather|fine weather|beautiful day", // 風和日麗
    'w-idiom-42': "flowers bloom in spring|spring has come|warm spring|spring flowers", // 春暖花開
    'w-idiom-43': "ice and snow|snowy landscape|frozen world|icy and snowy", // 冰天雪地
    'w-idiom-44': "the truth comes out|truth revealed|truth comes out|water recedes rocks appear", // 水落石出
    'w-idiom-45': "water wears away stone|dripping water pierces stone|constant dripping wears away stone|persistence", // 滴水穿石
    'w-idiom-46': "look at flowers on horseback|quick glance|skim through|a quick look", // 走馬看花
    'w-idiom-47': "pie in the sky|draw a cake to satisfy hunger|empty promises", // 畫餅充飢
    'w-idiom-48': "tiger parent|tiger mom|hope child becomes a dragon|high hopes for a child", // 望子成龍
    'w-idiom-49': "cornered dog jumps the wall|cornered dog|cornered animal|desperate measures", // 狗急跳牆
    'w-idiom-50': "strong start weak finish|start strong finish weak|big head thin tail", // 虎頭蛇尾
    'w-idiom-51': "startle the snake|beat the grass startle the snake|tip off the enemy", // 打草驚蛇
    'w-idiom-52': "invite the wolf in|let the wolf in|invite a wolf into the house", // 引狼入室
    'w-idiom-53': "mantis stalks the cicada|mantis hunting cicada|mantis and cicada", // 螳螂捕蟬
    'w-idiom-54': "old horse knows the way|an old horse knows the road|experienced guide", // 老馬識途
    'w-idiom-55': "add wings to a tiger|winged tiger|even stronger", // 如虎添翼
    'w-idiom-56': "wolf it down|wolf down food|gobble up|devour|eat like a wolf", // 狼吞虎嚥
    'w-idiom-57': "on pins and needles|on edge|butterflies in my stomach|jittery", // 七上八下
    'w-idiom-58': "colorful|multicolored|rainbow colors|all the colors", // 五顏六色
    'w-idiom-59': "everyone talking at once|all talking at once|noisy discussion", // 七嘴八舌
    'w-idiom-60': "in a flurry|flustered|scrambling|rushing about", // 手忙腳亂
    'w-idiom-61': "dumbfounded|stunned|speechless|jaw drop|gobsmacked", // 目瞪口呆
    'w-idiom-62': "red in the face|blushing|flushed|beet red", // 面紅耳赤
    'w-idiom-63': "over the moon|overjoyed|elated|heart blooming with joy", // 心花怒放
    'w-idiom-64': "forget to eat and sleep|lose sleep over it|absorbed in work", // 廢寢忘食
    'w-idiom-65': "contradict yourself|self-contradiction|spear and shield|contradiction", // 自相矛盾
    'w-idiom-66': "show off in front of an expert|teach your grandmother|swing an axe before the master", // 班門弄斧
    'w-idiom-67': "blind imitation|copycat|imitating xi shi|dong shi copies xi shi", // 東施效顰
    'w-idiom-68': "fake it in the band|pretend to play the flute|just filling the numbers", // 濫竽充數
    'w-idiom-69': "head in the wrong direction|wrong direction|opposite direction|going the wrong way", // 南轅北轍
    'w-idiom-70': "lips sealed|keep a secret|keep mum|tight-lipped", // 守口如瓶
    'w-idiom-71': "from bad to worse|make matters worse|add insult to injury|adding frost to snow", // 雪上加霜
    'w-idiom-72': "time flies|time flies like an arrow", // 光陰似箭
    'w-idiom-73': "the sea becomes farmland|great changes over time|how times change", // 滄海桑田
    'w-idiom-74': "shangri-la|utopia|paradise|peach blossom spring", // 世外桃源
    'w-idiom-75': "clear at a glance|plain as day|obvious|crystal clear", // 一目瞭然
    'w-idiom-76': "same difference|six of one half a dozen of the other|about the same|no difference", // 半斤八兩
    'w-idiom-77': "ripe fruit falls|all in good time|things happen naturally|when the melon is ripe it falls", // 瓜熟蒂落
    'w-idiom-78': "see the sky from a well|narrow view|narrow minded|narrow-minded", // 坐井觀天
    'w-idiom-79': "eyes glued|eyes glued to it|stare without blinking|unblinking", // 目不轉睛
    'w-idiom-80': "every little bit helps|sand piles into a tower|little by little|many a little makes a mickle|small things add up", // 聚沙成塔
    'w-idiom-81': "dazzled|dizzying|bewildered|dazzling display|eye-popping", // 眼花撩亂
    'w-idiom-82': "light at the end of the tunnel|a new hope|unexpected turn for the better", // 柳暗花明
    'w-idiom-83': "get straight to the point|get to the point|straight to the point|cut to the chase", // 開門見山
    'w-idiom-84': "soar to the sky|take off|skyrocket|shoot to fame|meteoric rise", // 一飛沖天
    'w-idiom-85': "full of energy|full of life|energetic|lively as a dragon", // 生龍活虎
    'w-idiom-86': "black sheep|bad apple|rotten apple", // 害群之馬
    'w-idiom-87': "beautiful scenery|picturesque landscape|green hills and clear water", // 山明水秀
    'w-idiom-88': "half-hearted|half hearted|two minds|indecisive|fickle", // 三心二意
    'w-idiom-89': "wholeheartedly|whole-hearted|with all your heart|single-minded", // 一心一意
    'w-idiom-90': "quick eyes quick hands|quick-witted|sharp eyes and fast hands|quick reflexes", // 眼明手快
    'w-idiom-91': "eye-opening|eye opening|eye opener|broaden your horizons|open your eyes", // 大開眼界
    'w-phenomenon-0': "snowfall|snowing|snow", // 下雪
    'w-phenomenon-1': "sunrise", // 日出
    'w-phenomenon-2': "sunset", // 日落
    'w-phenomenon-3': "ocean wave|wave|waves", // 海浪
    'w-phenomenon-4': "earthquake", // 地震
    'w-phenomenon-5': "typhoon|hurricane", // 颱風
    'w-phenomenon-6': "thunderstorm", // 雷雨
    'w-phenomenon-7': "aurora|northern lights", // 極光
    'w-phenomenon-8': "fog|mist", // 濃霧
    'w-phenomenon-9': "lunar eclipse|moon eclipse", // 月蝕
    'w-phenomenon-10': "solar eclipse|sun eclipse", // 日蝕
    'w-phenomenon-11': "flood|flooding", // 洪水
    'w-phenomenon-12': "landslide", // 山崩
    'w-phenomenon-13': "avalanche", // 雪崩
    'w-phenomenon-14': "tide|tides", // 潮汐
    'w-phenomenon-15': "tsunami|tidal wave", // 海嘯
    'w-phenomenon-16': "hail|hailstorm", // 冰雹
    'w-phenomenon-17': "drought", // 乾旱
    'w-phenomenon-18': "evening glow|afterglow|sunset glow", // 晚霞
    'w-phenomenon-19': "comet", // 彗星
    'w-phenomenon-20': "meteor shower", // 流星雨
    'w-phenomenon-21': "blizzard|snowstorm", // 暴風雪
    'w-phenomenon-22': "sandstorm|dust storm", // 沙塵暴
    'w-phenomenon-23': "volcanic eruption|eruption|volcano eruption", // 火山爆發
    'w-phenomenon-24': "mudslide|debris flow", // 土石流
    'w-phenomenon-25': "freezing|frozen", // 結冰
    'w-phenomenon-26': "icicle", // 冰柱
    'w-phenomenon-27': "rain shower|shower", // 陣雨
    'w-phenomenon-28': "heavy rain|downpour", // 暴雨
    'w-phenomenon-29': "full moon", // 滿月
    'w-phenomenon-30': "meteorite", // 隕石
    'w-phenomenon-31': "heat wave|heatwave", // 熱浪
    'w-phenomenon-32': "mirage", // 海市蜃樓
    'w-phenomenon-33': "foehn wind|foehn|hot dry wind", // 焚風
    'w-phenomenon-34': "smog|haze", // 霧霾
    'w-phenomenon-35': "cold wave|cold snap", // 寒流
    'w-phenomenon-36': "plum rain|rainy season", // 梅雨
    'w-phenomenon-37': "monsoon", // 季風
    'w-phenomenon-38': "sun halo|solar halo|halo", // 日暈
    'w-phenomenon-39': "moon halo|lunar halo", // 月暈
    'w-phenomenon-40': "frost", // 結霜
    'w-phenomenon-41': "high tide|rising tide", // 漲潮
    'w-phenomenon-42': "low tide|ebb tide", // 退潮
    'w-phenomenon-43': "morning glow|sunrise glow", // 朝霞
    'w-phenomenon-44': "dawn|daybreak", // 黎明
    'w-phenomenon-45': "dusk|twilight", // 黃昏
    'w-phenomenon-46': "drizzle", // 毛毛雨
    'w-phenomenon-47': "gale|strong wind|high wind", // 狂風
    'w-phenomenon-48': "snowdrift|snow cover", // 積雪
    'w-place-0': "school", // 學校
    'w-place-1': "hospital", // 醫院
    'w-place-2': "classroom", // 教室
    'w-place-3': "park", // 公園
    'w-place-4': "supermarket|grocery store", // 超市
    'w-place-5': "airport", // 機場
    'w-place-6': "bridge", // 橋
    'w-place-7': "swimming pool|pool", // 游泳池
    'w-place-8': "zoo", // 動物園
    'w-place-9': "amusement park|theme park|playground park", // 遊樂園
    'w-place-10': "castle", // 城堡
    'w-place-11': "lighthouse", // 燈塔
    'w-place-12': "kitchen", // 廚房
    'w-place-13': "bathroom", // 浴室
    'w-place-14': "post office", // 郵局
    'w-place-15': "market", // 市場
    'w-place-16': "restaurant", // 餐廳
    'w-place-17': "bookstore|bookshop", // 書店
    'w-place-18': "playground|schoolyard", // 操場
    'w-place-19': "temple", // 廟宇
    'w-place-20': "farm", // 農場
    'w-place-21': "orchard", // 果園
    'w-place-22': "greenhouse", // 溫室
    'w-place-23': "living room", // 客廳
    'w-place-24': "stairs|staircase|stairway", // 樓梯
    'w-place-25': "roof|rooftop", // 屋頂
    'w-place-26': "tunnel", // 隧道
    'w-place-27': "pavilion|gazebo", // 涼亭
    'w-place-28': "corridor|hallway", // 走廊
    'w-place-29': "pharmacy|drugstore", // 藥局
    'w-place-30': "overpass|pedestrian bridge|footbridge", // 天橋
    'w-place-31': "library", // 圖書館
    'w-place-32': "bank", // 銀行
    'w-place-33': "night market", // 夜市
    'w-place-34': "bakery", // 麵包店
    'w-place-35': "flower shop|florist", // 花店
    'w-place-36': "aquarium", // 水族館
    'w-place-37': "art museum|art gallery|gallery", // 美術館
    'w-place-38': "gymnasium|sports hall|indoor stadium", // 體育館
    'w-place-39': "train station|station", // 車站
    'w-place-40': "harbor|harbour|port", // 港口
    'w-place-41': "gas station|petrol station", // 加油站
    'w-place-42': "fire station", // 消防局
    'w-place-43': "church", // 教堂
    'w-place-44': "ranch", // 牧場
    'w-place-45': "vegetable garden|veggie garden", // 菜園
    'w-place-46': "bedroom", // 臥室
    'w-place-47': "balcony", // 陽台
    'w-place-48': "elevator|lift", // 電梯
    'w-place-49': "dental clinic|dentist's office", // 牙科
    'w-place-50': "barbershop|barber shop|hair salon", // 理髮店
    'w-place-51': "toy store|toy shop", // 玩具店
    'w-place-52': "fruit stand|fruit stall", // 水果攤
    'w-place-53': "drink shop|juice bar|bubble tea shop", // 飲料店
    'w-place-54': "gym|fitness center|fitness centre", // 健身房
    'w-place-55': "stadium|ballpark|sports field", // 球場
    'w-place-56': "skating rink|ice rink|rink", // 溜冰場
    'w-place-57': "campsite|campground", // 露營區
    'w-place-58': "convenience store", // 便利商店
    'w-place-59': "cafe|coffee shop|café", // 咖啡廳
    'w-place-60': "cinema|movie theater|movie theatre", // 電影院
    'w-place-61': "museum", // 博物館
    'w-place-62': "parking lot|car park", // 停車場
    'w-place-63': "police station", // 警察局
    'w-place-64': "skyscraper|tall building", // 摩天大樓
    'w-place-65': "fountain", // 噴水池
    'w-place-66': "breakfast shop|breakfast diner", // 早餐店
    'w-place-67': "fast food restaurant|fast food place|fast food", // 速食店
    'w-place-68': "pet shop|pet store", // 寵物店
    'w-place-69': "ski resort|ski slope|ski field", // 滑雪場
    'w-place-70': "hardware store", // 五金行
    'w-place-71': "internet cafe|internet café|gaming cafe", // 網咖
    'w-place-72': "dessert shop|dessert store|sweet shop", // 甜點店
    'w-place-73': "bus shelter|bus stop", // 候車亭
    'w-place-74': "clinic", // 診所
    'w-place-75': "laundromat|laundry|dry cleaner", // 洗衣店
    'w-place-76': "stationery store|stationery shop", // 文具店
    'w-place-77': "observation deck|viewing platform|lookout", // 觀景台
    'w-place-78': "underpass|pedestrian underpass", // 地下道
    'w-expression-0': "smile", // 微笑
    'w-expression-1': "cry|crying|weep", // 哭泣
    'w-expression-2': "laugh|laughing|laughing out loud", // 大笑
    'w-expression-3': "wink|blink", // 眨眼
    'w-expression-4': "wave|waving|wave hello|wave goodbye", // 揮手
    'w-expression-5': "thumbs up|like", // 比讚
    'w-expression-6': "hug|embrace", // 擁抱
    'w-expression-7': "pout|pouting", // 嘟嘴
    'w-expression-8': "sigh", // 嘆氣
    'w-expression-9': "shake head|shake your head|head shake", // 搖頭
    'w-expression-10': "nod|nodding|nod head", // 點頭
    'w-expression-11': "blow a kiss|air kiss|flying kiss", // 飛吻
    'w-expression-12': "silly grin|goofy grin|goofy smile|smirk", // 傻笑
    'w-expression-13': "zone out|daydream|daydreaming|space out|spacing out|blank stare", // 發呆
    'w-expression-14': "stomp|stomp feet|stomp your feet|stamp feet", // 跺腳
    'w-expression-15': "finger heart|heart sign|make a heart|heart hands|heart gesture", // 比心
    'w-expression-16': "scratch head|scratch your head|head scratch", // 抓頭
    'w-expression-17': "frown|furrowed brow", // 皺眉
    'w-expression-18': "sneeze|achoo", // 打噴嚏
    'w-expression-19': "cough|coughing", // 咳嗽
    'w-expression-20': "clap|applaud|clapping|applause", // 鼓掌
    'w-expression-21': "salute", // 敬禮
    'w-expression-22': "handshake|shake hands", // 握手
    'w-expression-23': "act spoiled|acting spoiled|pester sweetly", // 撒嬌
    'w-expression-24': "glare|stare|glaring", // 瞪眼
    'w-expression-25': "snicker|giggle|snigger", // 偷笑
    'w-expression-26': "shout|yell|scream|shouting", // 大叫
    'w-expression-27': "drool|drooling", // 流口水
    'w-expression-28': "blush|blushing", // 臉紅
    'w-expression-29': "funny face|silly face|make a face", // 鬼臉
    'w-expression-30': "cover mouth|cover your mouth|hand over mouth|gasp", // 摀嘴
    'w-expression-31': "high five|high-five", // 擊掌
    'w-expression-32': "shrug", // 聳肩
    'w-expression-33': "stretch|stretching", // 伸懶腰
    'w-expression-34': "stick out tongue|stick out your tongue|tongue out", // 吐舌頭
    'w-expression-35': "yawn|yawning", // 打哈欠
    'w-expression-36': "peace sign|v sign|victory sign|peace", // 剪刀手
    'w-expression-37': "whistling|whistle a tune", // 吹口哨
    'w-expression-38': "doze off|dozing|snooze|nodding off", // 打瞌睡
    'w-expression-39': "wry smile|bitter smile|forced smile", // 苦笑
    'w-expression-40': "squint|squinting", // 瞇眼
    'w-expression-41': "pursed lips|press lips|lips pressed|purse lips", // 抿嘴
    'w-expression-42': "rub hands|rub your hands|rubbing hands", // 搓手
    'w-expression-43': "grind teeth|grinding teeth|teeth grinding", // 磨牙
    'w-expression-44': "raise an eyebrow|raised eyebrow|arch eyebrow|eyebrow raise", // 挑眉
    'w-expression-45': "open mouth|open your mouth|mouth open|gape", // 張嘴
    'w-expression-46': "act cute|play cute|acting cute|cutesy", // 裝可愛
    'w-job-0': "doctor", // 醫生
    'w-job-1': "teacher", // 老師
    'w-job-2': "police officer|policeman|police|cop", // 警察
    'w-job-3': "firefighter|fireman", // 消防員
    'w-job-4': "chef|cook", // 廚師
    'w-job-5': "painter|artist", // 畫家
    'w-job-6': "singer", // 歌手
    'w-job-7': "farmer", // 農夫
    'w-job-8': "mail carrier|postman|mailman|letter carrier", // 郵差
    'w-job-9': "nurse", // 護士
    'w-job-10': "veterinarian|vet", // 獸醫
    'w-job-11': "judge", // 法官
    'w-job-12': "news anchor|anchor|newscaster|anchorman", // 主播
    'w-job-13': "actor|actress", // 演員
    'w-job-14': "dancer", // 舞者
    'w-job-15': "coach|trainer", // 教練
    'w-job-16': "fisherman|fisher", // 漁夫
    'w-job-17': "store clerk|shop assistant|salesclerk|clerk", // 店員
    'w-job-18': "airline captain|captain", // 機長
    'w-job-19': "ship captain|sea captain|captain of a ship", // 船長
    'w-job-20': "astronaut", // 太空人
    'w-job-21': "pilot|aviator", // 飛行員
    'w-job-22': "engineer", // 工程師
    'w-job-23': "lawyer|attorney", // 律師
    'w-job-24': "reporter|journalist", // 記者
    'w-job-25': "writer|author", // 作家
    'w-job-26': "film director|director|movie director", // 導演
    'w-job-27': "conductor|orchestra conductor", // 指揮家
    'w-job-28': "referee|umpire", // 裁判
    'w-job-29': "hunter", // 獵人
    'w-job-30': "carpenter|woodworker", // 木匠
    'w-job-31': "plumber|electrician", // 水電工
    'w-job-32': "barber|hairdresser|hair stylist", // 理髮師
    'w-job-33': "driver", // 司機
    'w-job-34': "lifeguard", // 救生員
    'w-job-35': "gardener", // 園丁
    'w-job-36': "cleaner|janitor|sanitation worker", // 清潔員
    'w-job-37': "courier|delivery person|delivery man|delivery driver", // 快遞員
    'w-job-38': "security guard|guard", // 保全
    'w-job-39': "barista", // 咖啡師
    'w-job-40': "principal|headmaster|school principal", // 校長
    'w-job-41': "photographer", // 攝影師
    'w-job-42': "magician", // 魔術師
    'w-job-43': "scientist", // 科學家
    'w-job-44': "architect", // 建築師
    'w-job-45': "musician", // 音樂家
    'w-job-46': "athlete", // 運動員
    'w-job-47': "baker", // 麵包師
    'w-job-48': "waiter|waitress|server", // 服務生
    'w-job-49': "flight attendant|stewardess|air hostess", // 空服員
    'w-job-50': "diver|scuba diver", // 潛水員
    'w-job-51': "dentist", // 牙醫
    'w-job-52': "pastry chef|pastry cook|dessert chef", // 甜點師
    'w-job-53': "beautician|beauty therapist|cosmetologist", // 美容師
    'w-job-54': "illustrator", // 插畫家
    'w-job-55': "host|emcee|presenter", // 主持人
    'w-job-56': "worker|laborer|labourer", // 工人
    'w-job-57': "shepherd", // 牧羊人
    'w-job-58': "secretary", // 秘書
    'w-job-59': "psychologist|therapist|counselor", // 心理師
    'w-job-60': "sculptor", // 雕刻家
    'w-job-61': "calligrapher", // 書法家
    'w-job-62': "librarian", // 圖書館員
    'w-job-63': "archaeologist|archeologist", // 考古學家
    'w-job-64': "explorer|adventurer", // 探險家
    'w-job-65': "bank teller|banker|bank clerk", // 銀行員
    'w-job-66': "bartender|mixologist", // 調酒師
    'w-job-67': "florist|flower arranger|floral designer", // 花藝師
    'w-job-68': "masseur|masseuse|massage therapist", // 按摩師
    'w-job-69': "yoga teacher|yoga instructor", // 瑜珈老師
    'w-job-70': "physical therapist|physiotherapist|rehab therapist", // 復健師
    'w-job-71': "cartoonist|comic artist|manga artist", // 漫畫家
    'w-job-72': "potter|ceramic artist|ceramist", // 陶藝家
    'w-job-73': "translator|interpreter", // 翻譯員
    'w-job-74': "model|fashion model", // 模特兒
    'w-job-75': "designer", // 設計師
    'w-job-76': "professor", // 教授
    'w-job-77': "pharmacist|chemist|druggist", // 藥師
    'w-fantasy-0': "princess", // 公主
    'w-fantasy-1': "king", // 國王
    'w-fantasy-2': "angel", // 天使
    'w-fantasy-3': "pirate", // 海盜
    'w-fantasy-4': "dragon", // 巨龍
    'w-fantasy-5': "mermaid|merman", // 人魚
    'w-fantasy-6': "space alien|alien|extraterrestrial|martian", // 外星人
    'w-fantasy-7': "ghost|spirit", // 幽靈
    'w-fantasy-8': "fairy|fairy godmother", // 仙女
    'w-fantasy-9': "werewolf", // 狼人
    'w-fantasy-10': "zombie", // 殭屍
    'w-fantasy-11': "witch", // 巫婆
    'w-fantasy-12': "knight", // 騎士
    'w-fantasy-13': "prince", // 王子
    'w-fantasy-14': "queen", // 女王
    'w-fantasy-15': "ninja", // 忍者
    'w-fantasy-16': "superman|superhero", // 超人
    'w-fantasy-17': "demon|devil", // 惡魔
    'w-fantasy-18': "magic wand|wand", // 魔法棒
    'w-fantasy-19': "treasure map", // 藏寶圖
    'w-fantasy-20': "treasure chest|treasure box|chest", // 寶箱
    'w-fantasy-21': "pegasus|flying horse|winged horse", // 飛馬
    'w-fantasy-22': "fire dragon|fire-breathing dragon", // 火龍
    'w-fantasy-23': "wizard|mage|sorcerer|warlock", // 魔法師
    'w-fantasy-24': "phoenix", // 鳳凰
    'w-fantasy-25': "time machine", // 時光機
    'w-fantasy-26': "magic carpet|flying carpet", // 魔毯
    'w-fantasy-27': "elf|sprite|pixie|little elf", // 小精靈
    'w-fantasy-28': "unicorn", // 獨角獸
    'w-fantasy-29': "vampire", // 吸血鬼
    'w-fantasy-30': "dwarf|gnome", // 小矮人
    'w-fantasy-31': "mummy", // 木乃伊
    'w-fantasy-32': "crystal ball", // 水晶球
    'w-fantasy-33': "flying broomstick|broomstick|flying broom|witch's broom", // 飛天掃帚
    'w-fantasy-34': "magic lamp|genie lamp|aladdin's lamp|genie", // 神燈
    'w-fantasy-35': "dragon egg", // 龍蛋
    'w-fantasy-36': "ufo|flying saucer", // 飛碟
    'w-fantasy-37': "sun wukong|monkey king|wukong", // 孫悟空
    'w-fantasy-38': "chang'e|moon goddess", // 嫦娥
    'w-fantasy-39': "giant", // 巨人
    'w-fantasy-40': "yeti|abominable snowman|snow monster", // 雪怪
    'w-fantasy-41': "god of wealth|money god|fortune god", // 財神
    'w-fantasy-42': "matchmaker god|god of matchmaking|matchmaker", // 月老
    'w-fantasy-43': "treant|ent|tree man", // 樹人
    'w-fantasy-44': "griffin|gryphon|griffon", // 獅鷲
    'w-fantasy-45': "samurai|warrior", // 武士
    'w-fantasy-46': "hero", // 英雄
    'w-fantasy-47': "monster|yokai|spirit monster", // 妖怪
    'w-fantasy-48': "tengu", // 天狗
    'w-fantasy-49': "thunder god|god of thunder", // 雷神
    'w-fantasy-50': "nezha|nata", // 哪吒
    'w-fantasy-51': "jade rabbit|moon rabbit", // 玉兔
    'w-fantasy-52': "cowherd|the cowherd", // 牛郎
    'w-fantasy-53': "mazu|matsu|sea goddess", // 媽祖
    'w-fantasy-54': "sea monster|kraken", // 海怪
    'w-fantasy-55': "portal|teleport portal|teleporter", // 傳送門
    'w-fantasy-56': "siren|sea siren|sea witch", // 海妖
    'w-fantasy-57': "dryad|tree spirit|tree nymph", // 樹精
    'w-fantasy-58': "kappa", // 河童
    'w-fantasy-59': "fox spirit|fox fairy|huli jing", // 狐仙
    'w-fantasy-60': "dragon king", // 龍王
    'w-fantasy-61': "sha wujing|sandy|friar sand", // 沙悟淨
    'w-fantasy-62': "weaver girl|weaver maiden|the weaver girl", // 織女
    'w-fantasy-63': "centaur", // 半人馬
    'w-fantasy-64': "nine-tailed fox|nine tailed fox|kitsune", // 九尾狐
    'w-fantasy-65': "spellbook|magic book|book of spells", // 魔法書
    'w-fantasy-66': "wishing well|wishing fountain|wish pond", // 許願池
    'w-fantasy-67': "invisibility cloak|invisible cloak|cloak of invisibility", // 隱形斗篷
    'w-fantasy-68': "gargoyle", // 石像鬼
    'w-fantasy-69': "cerberus|three-headed dog|three headed dog", // 三頭犬
    'w-fantasy-70': "cyclops", // 獨眼巨人
    'w-fantasy-71': "zhu bajie|pigsy", // 豬八戒
    'w-fantasy-72': "tang monk|tripitaka|xuanzang", // 唐三藏
    'w-fantasy-73': "earth god|land god|tudigong|god of the land", // 土地公
    'w-fantasy-74': "noah's ark|noahs ark", // 諾亞方舟
    'w-action-0': "running|run|jogging", // 跑步
    'w-action-1': "sleeping|sleep", // 睡覺
    'w-action-2': "swimming|swim", // 游泳
    'w-action-3': "fishing|go fishing", // 釣魚
    'w-action-4': "brushing teeth|brush teeth|brush your teeth", // 刷牙
    'w-action-5': "taking a bath|take a shower|bathe|shower|bath", // 洗澡
    'w-action-6': "eating|eat|having a meal|having dinner", // 吃飯
    'w-action-7': "singing|sing", // 唱歌
    'w-action-8': "dancing|dance", // 跳舞
    'w-action-9': "reading|read a book|reading a book", // 看書
    'w-action-10': "taking a photo|take a picture|taking pictures|take a photo", // 拍照
    'w-action-11': "drawing|painting|draw", // 畫畫
    'w-action-12': "hiking|climbing a mountain|mountain climbing|hike", // 爬山
    'w-action-13': "planting flowers|plant flowers|gardening", // 種花
    'w-action-14': "drinking water|drink water|drinking", // 喝水
    'w-action-15': "sweeping|sweep the floor|sweeping the floor", // 掃地
    'w-action-16': "washing dishes|wash dishes|do the dishes", // 洗碗
    'w-action-17': "watering flowers|water the flowers|watering plants|water plants", // 澆花
    'w-action-18': "taking a walk|walking|go for a walk|stroll", // 散步
    'w-action-19': "climbing a tree|climb a tree|tree climbing", // 爬樹
    'w-action-20': "skiing|ski", // 滑雪
    'w-action-21': "diving|scuba diving|snorkeling", // 潛水
    'w-action-22': "camping|go camping", // 露營
    'w-action-23': "picnic|having a picnic", // 野餐
    'w-action-24': "writing|handwriting|write", // 寫字
    'w-action-25': "paper cutting|cutting paper|paper cut|paper-cutting", // 剪紙
    'w-action-26': "waiting in line|queueing|standing in line|queue up|lining up", // 排隊
    'w-action-27': "going to school|go to school", // 上學
    'w-action-28': "dreaming|dream|having a dream", // 做夢
    'w-action-29': "moving house|moving|moving day|move house", // 搬家
    'w-action-30': "growing vegetables|grow vegetables|planting vegetables|vegetable gardening", // 種菜
    'w-action-31': "feeding birds|feed the birds|feed birds", // 餵鳥
    'w-action-32': "washing a car|car wash|wash the car|washing the car", // 洗車
    'w-action-33': "cooking|cook rice|cooking rice|cook dinner", // 煮飯
    'w-action-34': "getting a shot|getting an injection|injection|vaccination|get a shot", // 打針
    'w-action-35': "playing soccer|play soccer|kicking a ball|play football", // 踢足球
    'w-action-36': "washing hands|wash your hands|wash hands|handwashing", // 洗手
    'w-action-37': "mopping|mop the floor|mopping the floor", // 拖地
    'w-action-38': "walking the dog|walk the dog|dog walking|walking a dog", // 遛狗
    'w-action-39': "ice skating|skating|roller skating", // 溜冰
    'w-action-40': "surfing|surf", // 衝浪
    'w-action-41': "rowing|row a boat|rowing a boat|boating", // 划船
    'w-action-42': "barbecue|bbq|grilling|barbecuing", // 烤肉
    'w-action-43': "shopping|go shopping", // 購物
    'w-action-44': "origami|paper folding|folding paper|fold paper", // 摺紙
    'w-action-45': "making a phone call|phone call|calling|make a call|talking on the phone", // 打電話
    'w-action-46': "playing games|play games|gaming|video games", // 玩遊戲
    'w-action-47': "snoring|snore", // 打呼
    'w-action-48': "skateboarding|skate", // 溜滑板
    'w-action-49': "hopscotch", // 跳格子
    'w-action-50': "blowing out candles|blow out the candles|blow out candles", // 吹蠟燭
    'w-action-51': "opening presents|open gifts|unwrapping gifts|open a present|unwrap a present", // 拆禮物
    'w-action-52': "mailing a letter|send a letter|post a letter|sending a letter", // 寄信
    'w-action-53': "feeding fish|feed the fish|feed fish", // 餵魚
    'w-action-54': "folding clothes|fold clothes|folding laundry|fold the laundry", // 摺衣服
    'w-action-55': "grocery shopping|buying groceries|buy groceries|shopping for groceries", // 買菜
    'w-action-56': "making tea|brew tea|make tea|brewing tea", // 泡茶
    'w-action-57': "getting a haircut|haircut|cutting hair|get a haircut", // 剪頭髮
    'w-action-58': "playing basketball|play basketball|shooting hoops|shoot hoops", // 打籃球
    'w-action-59': "baking a cake|bake a cake|making a cake|make a cake", // 做蛋糕
    'w-action-60': "flying a kite|fly a kite|kite flying|flying kites", // 放風箏
    'w-action-61': "playing guitar|play guitar|play the guitar|playing the guitar", // 彈吉他
    'w-action-62': "riding a bike|ride a bike|cycling|bike riding|riding a bicycle", // 騎腳踏車
    'w-action-63': "hanging laundry|hang laundry|drying clothes|hang clothes to dry|hanging clothes", // 曬衣服
    'w-action-64': "building a snowman|build a snowman|make a snowman|making a snowman", // 堆雪人
    'w-action-65': "watching tv|watch tv|watching television|watch television", // 看電視
    'w-action-66': "taking a flight|flying|take a plane|boarding a plane", // 搭飛機
    'w-action-67': "crossing the street|cross the street|crossing the road|cross the road", // 過馬路
    'w-action-68': "playing baseball|play baseball|batting|swinging a bat", // 打棒球
    'w-action-69': "building a sandcastle|build a sandcastle|make a sandcastle|making a sandcastle|sandcastle", // 堆沙堡
    'w-action-70': "hide and seek|hide-and-seek|playing hide and seek", // 捉迷藏
    'w-action-71': "blowing bubbles|blow bubbles|bubble blowing", // 吹泡泡
    'w-action-72': "climbing stairs|climb the stairs|climbing the stairs|go upstairs|take the stairs", // 爬樓梯
    'w-action-73': "seeing a doctor|see a doctor|visiting the doctor|doctor visit|go to the doctor", // 看醫生
    'w-action-74': "after school|school is out|school is over|leaving school|going home from school", // 放學
    'w-action-75': "making a wish|make a wish|wishing|wish", // 許願
    'w-action-76': "writing a card|write a card|writing cards|make a card", // 寫卡片
    'w-action-77': "making coffee|brew coffee|make coffee|brewing coffee|pour-over coffee", // 沖咖啡
    'w-action-78': "taking the elevator|take the elevator|riding the elevator|ride the elevator|taking an elevator", // 搭電梯
    'w-action-79': "browsing the night market|visiting a night market|night market stroll|going to the night market", // 逛夜市
    'w-action-80': "playing volleyball|play volleyball|spiking|volleyball game", // 打排球
    'w-action-81': "playing badminton|play badminton|badminton game", // 打羽球
    'w-action-82': "playing house|play house|pretend play|playing pretend|house play", // 扮家家酒
    'w-action-83': "wrapping a gift|wrap a gift|wrapping presents|gift wrapping|wrap a present", // 包禮物
    'w-action-84': "cleaning windows|wash windows|clean the window|wiping windows|washing windows", // 擦窗戶
    'w-action-85': "ironing|iron clothes|ironing clothes|press clothes", // 燙衣服
    'w-action-86': "baking cookies|bake cookies|make cookies|baking biscuits", // 烤餅乾
    'w-action-87': "taking a temperature|take temperature|checking temperature|take someone's temperature|temperature check", // 量體溫
    'w-action-88': "waiting at a red light|stopped at a red light|red light|waiting for the light|stop at red light", // 等紅燈
    'w-star-0': "jay chou", // 周杰倫
    'w-star-1': "jolin tsai", // 蔡依林
    'w-star-2': "mayday", // 五月天
    'w-star-3': "a-mei|amei|a-mei chang", // 張惠妹
    'w-star-4': "jj lin", // 林俊傑
    'w-star-5': "andy lau", // 劉德華
    'w-star-6': "jackie chan", // 成龍
    'w-star-7': "stephen chow", // 周星馳
    'w-star-8': "tony leung", // 梁朝偉
    'w-star-9': "jacky cheung", // 張學友
    'w-star-10': "aaron kwok", // 郭富城
    'w-star-11': "g.e.m.|gem tang|g.e.m. tang", // 鄧紫棋
    'w-star-12': "jam hsiao", // 蕭敬騰
    'w-star-13': "eason chan", // 陳奕迅
    'w-star-14': "ang lee", // 李安
    'w-star-15': "michelle yeoh", // 楊紫瓊
    'w-star-16': "shu qi", // 舒淇
    'w-star-17': "lin chi-ling|chiling lin", // 林志玲
    'w-star-18': "takeshi kaneshiro", // 金城武
    'w-star-19': "chow yun-fat|chow yun fat", // 周潤發
    'w-star-20': "bruce lee", // 李小龍
    'w-star-21': "donnie yen", // 甄子丹
    'w-star-22': "maggie cheung", // 張曼玉
    'w-star-23': "gong li", // 鞏俐
    'w-star-24': "zhang ziyi", // 章子怡
    'w-star-25': "fei yu-ching|yu-ching fei", // 費玉清
    'w-star-26': "feng fei-fei|fong fei-fei", // 鳳飛飛
    'w-star-27': "teresa teng", // 鄧麗君
    'w-star-28': "wu bai", // 伍佰
    'w-star-29': "leslie cheung", // 張國榮
    'w-star-30': "taylor swift", // 泰勒絲
    'w-star-31': "beyonce|beyoncé", // 碧昂絲
    'w-star-32': "madonna", // 瑪丹娜
    'w-star-33': "michael jackson", // 麥可傑克森
    'w-star-34': "elvis presley|elvis", // 貓王
    'w-star-35': "the beatles|beatles", // 披頭四
    'w-star-36': "tom cruise", // 湯姆克魯斯
    'w-star-37': "leonardo dicaprio|leo dicaprio|dicaprio", // 李奧納多
    'w-star-38': "brad pitt", // 布萊德彼特
    'w-star-39': "emma watson", // 艾瑪華森
    'w-star-40': "keanu reeves", // 基努李維
    'w-star-41': "audrey hepburn", // 奧黛麗赫本
    'w-star-42': "marilyn monroe", // 瑪麗蓮夢露
    'w-star-43': "charlie chaplin|chaplin", // 卓別林
    'w-star-44': "mr bean|mr. bean|mister bean", // 憨豆先生
    'w-star-45': "michael jordan", // 麥可喬丹
    'w-star-46': "lionel messi|messi", // 梅西
    'w-star-47': "david beckham|beckham", // 貝克漢
    'w-star-48': "roger federer|federer", // 費德勒
    'w-star-49': "shohei ohtani|ohtani", // 大谷翔平
    'w-star-50': "chien-ming wang|wang chien-ming", // 王建民
    'w-star-51': "tai tzu-ying|tai tzu ying", // 戴資穎
    'w-star-52': "ariel lin", // 林依晨
    'w-star-53': "gwei lun-mei|gwei lun mei", // 桂綸鎂
    'w-star-54': "jeannie hsieh|hsieh chin-yen|jinny hsieh", // 謝金燕
    'w-star-55': "stefanie sun", // 孫燕姿
    'w-star-56': "emil chau", // 周華健
    'w-star-57': "chang chen-yue|a-yue", // 張震嶽
    'w-star-58': "cheer chen", // 陳綺貞
    'w-star-59': "crowd lu", // 盧廣仲
    'w-star-60': "rainie yang", // 楊丞琳
    'w-star-61': "elva hsiao", // 蕭亞軒
    'w-star-62': "vivian hsu", // 徐若瑄
    'w-star-63': "chang hsiao-yen|xiao yan zhang", // 張小燕
    'w-star-64': "rene liu", // 劉若英
    'w-star-65': "fish leong", // 梁靜茹
    'w-star-66': "jody chiang", // 江蕙
    'w-star-67': "richie jen", // 任賢齊
    'w-star-68': "lady gaga", // 女神卡卡
    'w-star-69': "adele", // 愛黛兒
    'w-star-70': "ed sheeran", // 艾德希蘭
    'w-star-71': "celine dion|céline dion", // 席琳狄翁
    'w-star-72': "dwayne johnson|the rock", // 巨石強森
    'w-star-73': "tom hanks", // 湯姆漢克斯
    'w-star-74': "meryl streep", // 梅莉史翠普
    'w-star-75': "natalie portman", // 娜塔莉波曼
    'w-star-76': "robert downey jr|robert downey jr.|rdj", // 小勞勃道尼
    'w-movie-0': "titanic", // 鐵達尼號
    'w-movie-1': "avatar", // 阿凡達
    'w-movie-2': "jurassic park", // 侏羅紀公園
    'w-movie-3': "star wars", // 星際大戰
    'w-movie-4': "harry potter", // 哈利波特
    'w-movie-5': "the lord of the rings|lord of the rings", // 魔戒
    'w-movie-6': "toy story", // 玩具總動員
    'w-movie-7': "frozen", // 冰雪奇緣
    'w-movie-8': "the lion king|lion king", // 獅子王
    'w-movie-9': "finding nemo|nemo", // 海底總動員
    'w-movie-10': "monsters inc|monsters, inc.", // 怪獸電力公司
    'w-movie-11': "up|pixar up|up movie", // 天外奇蹟
    'w-movie-12': "inside out", // 腦筋急轉彎
    'w-movie-13': "wreck-it ralph|wreck it ralph", // 無敵破壞王
    'w-movie-14': "zootopia|zootropolis", // 動物方城市
    'w-movie-15': "cars", // 汽車總動員
    'w-movie-16': "the incredibles|incredibles", // 超人特攻隊
    'w-movie-17': "wall-e|wall e|walle", // 瓦力
    'w-movie-18': "mulan", // 花木蘭
    'w-movie-19': "aladdin", // 阿拉丁
    'w-movie-20': "beauty and the beast", // 美女與野獸
    'w-movie-21': "the little mermaid|little mermaid", // 小美人魚
    'w-movie-22': "snow white", // 白雪公主
    'w-movie-23': "sleeping beauty", // 睡美人
    'w-movie-24': "cinderella", // 灰姑娘
    'w-movie-25': "peter pan", // 彼得潘
    'w-movie-26': "pinocchio", // 木偶奇遇記
    'w-movie-27': "my neighbor totoro|totoro", // 龍貓
    'w-movie-28': "spirited away", // 神隱少女
    'w-movie-29': "castle in the sky|laputa", // 天空之城
    'w-movie-30': "kiki's delivery service|kikis delivery service|kiki", // 魔女宅急便
    'w-movie-31': "spider-man|spiderman|spider man", // 蜘蛛人
    'w-movie-32': "batman", // 蝙蝠俠
    'w-movie-33': "iron man|ironman", // 鋼鐵人
    'w-movie-34': "captain america", // 美國隊長
    'w-movie-35': "thor", // 雷神索爾
    'w-movie-36': "the avengers|avengers", // 復仇者聯盟
    'w-movie-37': "black panther", // 黑豹
    'w-movie-38': "wonder woman", // 神力女超人
    'w-movie-39': "transformers", // 變形金剛
    'w-movie-40': "fast and furious|the fast and the furious|fast & furious", // 玩命關頭
    'w-movie-41': "top gun", // 捍衛戰士
    'w-movie-42': "back to the future", // 回到未來
    'w-movie-43': "the godfather|godfather", // 教父
    'w-movie-44': "jaws", // 大白鯊
    'w-movie-45': "the matrix|matrix", // 駭客任務
    'w-movie-46': "inception", // 全面啟動
    'w-movie-47': "interstellar", // 星際效應
    'w-movie-48': "forrest gump|forest gump", // 阿甘正傳
    'w-movie-49': "kung fu panda", // 功夫熊貓
    'w-movie-50': "how to train your dragon", // 馴龍高手
    'w-movie-51': "alien|aliens", // 異形
    'w-movie-52': "the terminator|terminator", // 魔鬼終結者
    'w-movie-53': "soul", // 靈魂急轉彎
    'w-movie-54': "coco", // 可可夜總會
    'w-movie-55': "brave|merida|disney brave", // 勇敢傳說
    'w-movie-56': "moana", // 海洋奇緣
    'w-movie-57': "tangled", // 魔髮奇緣
    'w-movie-58': "tarzan", // 泰山
    'w-movie-59': "dumbo", // 小飛象
    'w-movie-60': "bambi", // 小鹿斑比
    'w-movie-61': "detective conan|case closed|conan", // 名偵探柯南
    'w-movie-62': "naruto", // 火影忍者
    'w-movie-63': "dragon ball|dragon ball z", // 七龍珠
    'w-movie-64': "demon slayer", // 鬼滅之刃
    'w-movie-65': "slam dunk", // 灌籃高手
    'w-movie-66': "chibi maruko-chan|chibi maruko chan|maruko", // 櫻桃小丸子
    'w-movie-67': "crayon shin-chan|crayon shin chan|shin-chan", // 蠟筆小新
    'w-movie-68': "sailor moon", // 美少女戰士
    'w-movie-69': "saint seiya|knights of the zodiac", // 聖鬥士星矢
    'w-movie-70': "one piece", // 航海王
    'w-movie-71': "pokemon|pokémon", // 寶可夢
    'w-movie-72': "pikachu", // 皮卡丘
    'w-movie-73': "cape no 7|cape no. 7|cape number 7", // 海角七號
    'w-movie-74': "seediq bale", // 賽德克巴萊
    'w-movie-75': "monga", // 艋舺
    'w-movie-76': "shaolin soccer", // 少林足球
    'w-movie-77': "infernal affairs", // 無間道
    'w-trend-0': "artificial intelligence|ai", // 人工智慧
    'w-trend-1': "chatbot|chat bot", // 聊天機器人
    'w-trend-2': "self-driving car|self driving|autonomous driving|autopilot", // 自動駕駛
    'w-trend-3': "space travel|space tourism", // 太空旅行
    'w-trend-4': "virtual reality|vr", // 虛擬實境
    'w-trend-5': "metaverse", // 元宇宙
    'w-trend-6': "cryptocurrency|bitcoin|crypto", // 加密貨幣
    'w-trend-7': "mobile payment|mobile pay|tap to pay", // 行動支付
    'w-trend-8': "food delivery rider|delivery rider|food delivery", // 外送員
    'w-trend-9': "online shopping|e-commerce|shopping online", // 網購
    'w-trend-10': "live stream|livestream|live streaming", // 直播
    'w-trend-11': "short video|short videos|tiktok", // 短影音
    'w-trend-12': "social media", // 社群媒體
    'w-trend-13': "influencer|internet celebrity", // 網紅
    'w-trend-14': "remote work|work from home|working from home|telecommuting", // 遠距上班
    'w-trend-15': "video call|video conference|video meeting|zoom meeting", // 視訊會議
    'w-trend-16': "online course|online class|e-learning", // 線上課程
    'w-trend-17': "smartwatch|smart watch", // 智慧手錶
    'w-trend-18': "drone", // 無人機
    'w-trend-19': "smart speaker", // 智慧音箱
    'w-trend-20': "e-book|ebook|e-reader", // 電子書
    'w-trend-21': "solar panel|solar panels", // 太陽能板
    'w-trend-22': "wind power|wind turbine|wind energy", // 風力發電
    'w-trend-23': "recycling|recycle", // 資源回收
    'w-trend-24': "reusable cup|eco cup|reusable mug", // 環保杯
    'w-trend-25': "rapid test|covid test|rapid antigen test|test kit", // 快篩
    'w-trend-26': "vaccine|vaccination", // 疫苗
    'w-trend-27': "bike sharing|bike share|shared bike|youbike", // 共享單車
    'w-trend-28': "world cup", // 世界盃
    'w-trend-29': "olympics|olympic games|the olympics", // 奧運
    'w-trend-30': "live concert|pop concert|live show", // 演唱會
    'w-trend-31': "power bank|portable charger", // 行動電源
    'w-trend-32': "selfie stick", // 自拍棒
    'w-trend-33': "esports|e-sports|gaming tournament", // 電競
    'w-trend-34': "electric scooter|e-scooter|electric motorcycle", // 電動機車
    'w-trend-35': "charging station|ev charger|charging point", // 充電樁
    'w-trend-36': "voice assistant|virtual assistant|siri", // 語音助理
    'w-trend-37': "smart home|smart appliance|smart appliances", // 智慧家電
    'w-trend-38': "wearable|wearables|wearable device", // 穿戴裝置
    'w-trend-39': "foldable phone|folding phone|flip phone", // 折疊手機
    'w-trend-40': "virtual idol|virtual singer|vtuber", // 虛擬偶像
    'w-trend-41': "online scam|internet scam|phishing", // 網路詐騙
    'w-trend-42': "mobile game|mobile games|phone game", // 手遊
    'w-trend-43': "video streaming|streaming|netflix", // 串流影音
    'w-trend-44': "e-invoice|electronic receipt|digital receipt", // 電子發票
    'w-history-0': "great wall of china|great wall", // 萬里長城
    'w-history-1': "terracotta army|terracotta warriors", // 兵馬俑
    'w-history-2': "pyramid|pyramids|great pyramid", // 金字塔
    'w-history-3': "sphinx|great sphinx", // 人面獅身
    'w-history-4': "colosseum|coliseum", // 羅馬競技場
    'w-history-5': "leaning tower of pisa|tower of pisa|leaning tower", // 比薩斜塔
    'w-history-6': "stonehenge", // 巨石陣
    'w-history-7': "easter island|moai", // 復活節島
    'w-history-8': "machu picchu", // 馬丘比丘
    'w-history-9': "angkor wat", // 吳哥窟
    'w-history-10': "taj mahal", // 泰姬瑪哈陵
    'w-history-11': "forbidden city", // 紫禁城
    'w-history-12': "dunhuang|mogao caves", // 敦煌
    'w-history-13': "silk road", // 絲路
    'w-history-14': "grand canal", // 大運河
    'w-history-15': "gunpowder", // 火藥
    'w-history-16': "papermaking|paper making|invention of paper", // 造紙術
    'w-history-17': "movable type|movable type printing|printing press", // 活字印刷
    'w-history-18': "steam engine", // 蒸汽機
    'w-history-19': "columbus|christopher columbus", // 哥倫布
    'w-history-20': "magellan|ferdinand magellan", // 麥哲倫
    'w-history-21': "marco polo", // 馬可波羅
    'w-history-22': "confucius", // 孔子
    'w-history-23': "laozi|lao tzu|lao tse", // 老子
    'w-history-24': "the art of war|art of war", // 孫子兵法
    'w-history-25': "qin shi huang|first emperor of qin|qin shihuang", // 秦始皇
    'w-history-26': "wu zetian|empress wu", // 武則天
    'w-history-27': "zhuge liang", // 諸葛亮
    'w-history-28': "guan yu", // 關羽
    'w-history-29': "zhang fei", // 張飛
    'w-history-30': "cao cao", // 曹操
    'w-history-31': "liu bei", // 劉備
    'w-history-32': "yue fei", // 岳飛
    'w-history-33': "koxinga|zheng chenggong", // 鄭成功
    'w-history-34': "li bai|li po", // 李白
    'w-history-35': "du fu", // 杜甫
    'w-history-36': "su dongpo|su shi", // 蘇東坡
    'w-history-37': "wang xizhi", // 王羲之
    'w-history-38': "picasso|pablo picasso", // 畢卡索
    'w-history-39': "van gogh|vincent van gogh", // 梵谷
    'w-history-40': "leonardo da vinci|da vinci", // 達文西
    'w-history-41': "mozart", // 莫札特
    'w-history-42': "beethoven", // 貝多芬
    'w-history-43': "einstein|albert einstein", // 愛因斯坦
    'w-history-44': "isaac newton|newton", // 牛頓
    'w-history-45': "thomas edison|edison", // 愛迪生
    'w-history-46': "marie curie|madame curie", // 居禮夫人
    'w-history-47': "florence nightingale|nightingale", // 南丁格爾
    'w-history-48': "wright brothers|the wright brothers", // 萊特兄弟
    'w-history-49': "galileo|galileo galilei", // 伽利略
    'w-history-50': "napoleon|napoleon bonaparte", // 拿破崙
    'w-history-51': "genghis khan", // 成吉思汗
    'w-history-52': "oracle bones|oracle bone script", // 甲骨文
    'w-history-53': "french revolution", // 法國大革命
    'w-history-54': "berlin wall", // 柏林圍牆
    'w-history-55': "rosetta stone", // 羅塞塔石碑
    'w-history-56': "trojan horse", // 木馬屠城
    'w-history-57': "pompeii", // 龐貝城
    'w-history-58': "opium war|opium wars", // 鴉片戰爭
    'w-history-59': "xinhai revolution|1911 revolution", // 辛亥革命
    'w-history-60': "zheng he", // 鄭和
    'w-history-61': "zhang qian", // 張騫
    'w-history-62': "sima qian", // 司馬遷
    'w-history-63': "sun yat-sen|sun yat sen", // 孫中山
    'w-history-64': "george washington|washington", // 華盛頓
    'w-history-65': "abraham lincoln|lincoln", // 林肯
    'w-history-66': "winston churchill|churchill", // 邱吉爾
    'w-history-67': "shakespeare|william shakespeare", // 莎士比亞
    'w-history-68': "plato", // 柏拉圖
    'w-history-69': "mencius", // 孟子
    'w-history-70': "zhuangzi|chuang tzu", // 莊子
    'w-history-71': "judge bao|bao zheng|justice bao", // 包青天
    'w-geography-0': "taiwan", // 台灣
    'w-geography-1': "japan", // 日本
    'w-geography-2': "south korea|korea", // 韓國
    'w-geography-3': "thailand", // 泰國
    'w-geography-4': "vietnam", // 越南
    'w-geography-5': "singapore", // 新加坡
    'w-geography-6': "india", // 印度
    'w-geography-7': "egypt", // 埃及
    'w-geography-8': "france", // 法國
    'w-geography-9': "united kingdom|uk|britain|england|great britain", // 英國
    'w-geography-10': "germany", // 德國
    'w-geography-11': "italy", // 義大利
    'w-geography-12': "spain", // 西班牙
    'w-geography-13': "netherlands|holland", // 荷蘭
    'w-geography-14': "switzerland", // 瑞士
    'w-geography-15': "greece", // 希臘
    'w-geography-16': "russia", // 俄羅斯
    'w-geography-17': "united states|usa|us|america|united states of america", // 美國
    'w-geography-18': "canada", // 加拿大
    'w-geography-19': "mexico", // 墨西哥
    'w-geography-20': "brazil", // 巴西
    'w-geography-21': "argentina", // 阿根廷
    'w-geography-22': "australia", // 澳洲
    'w-geography-23': "new zealand", // 紐西蘭
    'w-geography-24': "kenya", // 肯亞
    'w-geography-25': "south africa", // 南非
    'w-geography-26': "iceland", // 冰島
    'w-geography-27': "finland", // 芬蘭
    'w-geography-28': "turkiye|turkey|türkiye", // 土耳其
    'w-geography-29': "mongolia", // 蒙古
    'w-geography-30': "mount fuji|mt fuji|fuji", // 富士山
    'w-geography-31': "himalayas|the himalayas|himalaya", // 喜馬拉雅山
    'w-geography-32': "mount everest|everest", // 聖母峰
    'w-geography-33': "sahara desert|sahara", // 撒哈拉沙漠
    'w-geography-34': "amazon river|amazon", // 亞馬遜河
    'w-geography-35': "nile river|nile|the nile", // 尼羅河
    'w-geography-36': "yangtze river|yangtze", // 長江
    'w-geography-37': "yellow river", // 黃河
    'w-geography-38': "mississippi river|mississippi", // 密西西比河
    'w-geography-39': "grand canyon", // 大峽谷
    'w-geography-40': "niagara falls|niagara", // 尼加拉瀑布
    'w-geography-41': "dead sea", // 死海
    'w-geography-42': "lake baikal|baikal", // 貝加爾湖
    'w-geography-43': "equator", // 赤道
    'w-geography-44': "north pole|arctic", // 北極
    'w-geography-45': "south pole|antarctica", // 南極
    'w-geography-46': "rainforest|rain forest|tropical rainforest", // 熱帶雨林
    'w-geography-47': "great barrier reef", // 大堡礁
    'w-geography-48': "mediterranean sea|mediterranean", // 地中海
    'w-geography-49': "china", // 中國
    'w-geography-50': "philippines|the philippines", // 菲律賓
    'w-geography-51': "malaysia", // 馬來西亞
    'w-geography-52': "indonesia", // 印尼
    'w-geography-53': "myanmar|burma", // 緬甸
    'w-geography-54': "nepal", // 尼泊爾
    'w-geography-55': "israel", // 以色列
    'w-geography-56': "sweden", // 瑞典
    'w-geography-57': "norway", // 挪威
    'w-geography-58': "denmark", // 丹麥
    'w-geography-59': "poland", // 波蘭
    'w-geography-60': "czech republic|czechia|czech", // 捷克
    'w-geography-61': "austria", // 奧地利
    'w-geography-62': "portugal", // 葡萄牙
    'w-geography-63': "ireland", // 愛爾蘭
    'w-geography-64': "chile", // 智利
    'w-geography-65': "peru", // 秘魯
    'w-geography-66': "cuba", // 古巴
    'w-geography-67': "morocco", // 摩洛哥
    'w-geography-68': "ethiopia", // 衣索比亞
    'w-geography-69': "dubai", // 杜拜
    'w-geography-70': "hong kong|hongkong", // 香港
    'w-geography-71': "macau|macao", // 澳門
    'w-geography-72': "eiffel tower|the eiffel tower", // 艾菲爾鐵塔
    'w-geography-73': "statue of liberty|lady liberty", // 自由女神
    'w-geography-74': "big ben", // 大笨鐘
    'w-geography-75': "sydney opera house|opera house", // 雪梨歌劇院
    'w-geography-76': "white house|the white house", // 白宮
    'w-geography-77': "sagrada familia|sagrada família", // 聖家堂
    'w-civics-0': "voting|vote|cast a vote", // 投票
    'w-civics-1': "election|elections", // 選舉
    'w-civics-2': "constitution", // 憲法
    'w-civics-3': "law|laws", // 法律
    'w-civics-4': "national flag|flag", // 國旗
    'w-civics-5': "parliament|congress|legislature", // 國會
    'w-civics-6': "court|courthouse|court of law", // 法院
    'w-civics-7': "verdict|judgment|ruling", // 判決
    'w-civics-8': "paying taxes|pay taxes|taxes|tax", // 納稅
    'w-civics-9': "id card|identity card|id", // 身分證
    'w-civics-10': "passport", // 護照
    'w-civics-11': "household registration|household register|family register", // 戶口名簿
    'w-civics-12': "referendum", // 公投
    'w-civics-13': "mayor", // 市長
    'w-civics-14': "village chief|neighborhood chief|ward chief|village head", // 里長
    'w-civics-15': "district office|town hall|township office", // 公所
    'w-civics-16': "military service|conscription|draft", // 兵役
    'w-civics-17': "health insurance card|national health card|health card", // 健保卡
    'w-civics-18': "driver's license|drivers license|driving license|driver license", // 駕照
    'w-civics-19': "waste sorting|garbage sorting|trash sorting|sorting trash", // 垃圾分類
    'w-civics-20': "traffic sign|traffic signal|road sign", // 交通號誌
    'w-civics-21': "crosswalk|zebra crossing|pedestrian crossing", // 斑馬線
    'w-civics-22': "traffic light|traffic lights|stoplight", // 紅綠燈
    'w-civics-23': "fire drill", // 消防演習
    'w-civics-24': "earthquake drill", // 地震演習
    'w-civics-25': "jury|jurors", // 陪審團
    'w-civics-26': "volunteer|volunteers", // 志工
    'w-civics-27': "seat belt|seatbelt", // 安全帶
    'w-civics-28': "drunk driving|drink driving|dui", // 酒駕
    'w-civics-29': "accessibility|wheelchair access|barrier-free", // 無障礙
    'w-civics-30': "compulsory education|mandatory education", // 義務教育
    'w-civics-31': "ticket|traffic ticket|fine|parking ticket", // 罰單
    'w-physics-0': "gravity", // 重力
    'w-physics-1': "friction", // 摩擦力
    'w-physics-2': "buoyancy|floating force", // 浮力
    'w-physics-3': "reflection", // 反射
    'w-physics-4': "refraction", // 折射
    'w-physics-5': "evaporation", // 蒸發
    'w-physics-6': "condensation", // 凝結
    'w-physics-7': "lever", // 槓桿
    'w-physics-8': "pulley", // 滑輪
    'w-physics-9': "spring|coil spring", // 彈簧
    'w-physics-10': "static electricity|static", // 靜電
    'w-physics-11': "electric current|current|electricity", // 電流
    'w-physics-12': "magnet", // 磁鐵
    'w-physics-13': "prism", // 稜鏡
    'w-physics-14': "echo", // 回聲
    'w-physics-15': "boiling|boil", // 沸騰
    'w-physics-16': "shadow", // 影子
    'w-physics-17': "thermal expansion|expansion and contraction|heat expansion", // 熱脹冷縮
    'w-physics-18': "surface tension", // 表面張力
    'w-physics-19': "capillary action|capillary effect|capillarity", // 毛細現象
    'w-physics-20': "free fall|freefall|falling object", // 自由落體
    'w-physics-21': "parabola|projectile motion|parabolic arc", // 拋物線
    'w-physics-22': "gear|cogwheel|gears", // 齒輪
    'w-physics-23': "ramp|slope|inclined plane|incline", // 斜坡
    'w-physics-24': "balance scale|balance|scales", // 天平
    'w-physics-25': "pendulum", // 擺錘
    'w-physics-26': "water pressure", // 水壓
    'w-physics-27': "air pressure|atmospheric pressure|barometric pressure", // 氣壓
    'w-physics-28': "centrifugal force", // 離心力
    'w-physics-29': "siphon|syphon", // 虹吸
    'w-physics-30': "ultraviolet|uv|uv rays|ultraviolet rays", // 紫外線
    'w-physics-31': "laser", // 雷射
    'w-physics-32': "convex lens", // 凸透鏡
    'w-physics-33': "concave lens", // 凹透鏡
    'w-physics-34': "magnifying glass|magnifier", // 放大鏡
    'w-physics-35': "sound wave|sound waves", // 聲波
    'w-physics-36': "ultrasound|ultrasonic|ultrasonic wave", // 超音波
    'w-physics-37': "electromagnet", // 電磁鐵
    'w-physics-38': "crystal|crystallization|crystals", // 結晶
    'w-astro-0': "solar system", // 太陽系
    'w-astro-1': "milky way|the milky way", // 銀河系
    'w-astro-2': "black hole", // 黑洞
    'w-astro-3': "supernova", // 超新星
    'w-astro-4': "constellation|zodiac", // 星座
    'w-astro-5': "big dipper|the big dipper|plough", // 北斗七星
    'w-astro-6': "orion|orion constellation", // 獵戶座
    'w-astro-7': "north star|polaris|pole star", // 北極星
    'w-astro-8': "mars", // 火星
    'w-astro-9': "venus", // 金星
    'w-astro-10': "jupiter", // 木星
    'w-astro-11': "mercury", // 水星
    'w-astro-12': "saturn", // 土星
    'w-astro-13': "uranus", // 天王星
    'w-astro-14': "neptune", // 海王星
    'w-astro-15': "pluto", // 冥王星
    'w-astro-16': "moon phases|phases of the moon|lunar phases|moon phase", // 月相
    'w-astro-17': "crater|impact crater|meteor crater", // 隕石坑
    'w-astro-18': "space station|iss", // 太空站
    'w-astro-19': "spacesuit|space suit", // 太空衣
    'w-astro-20': "moon landing|landing on the moon", // 登月
    'w-astro-21': "satellite|artificial satellite", // 人造衛星
    'w-astro-22': "halley's comet|halleys comet", // 哈雷彗星
    'w-astro-23': "observatory", // 天文台
    'w-astro-24': "space telescope|hubble|hubble telescope", // 太空望遠鏡
    'w-astro-25': "asteroid", // 小行星
    'w-astro-26': "lunar rover|moon rover|moon buggy", // 月球車
    'w-astro-27': "rocket launch|rocket liftoff|launch|liftoff", // 火箭發射
    'w-astro-28': "zero gravity|weightlessness|microgravity|zero-g", // 無重力
    'w-astro-29': "sirius|dog star", // 天狼星
    'w-astro-30': "vega", // 織女星
    'w-astro-31': "altair", // 牛郎星
    'w-astro-32': "planetarium", // 星象儀
    'w-astro-33': "mars rover|rover", // 火星車
    'w-astro-34': "space junk|space debris|orbital debris", // 太空垃圾
    'w-astro-35': "galaxy", // 星系
    'w-astro-36': "sunspot|sunspots|sun spots", // 太陽黑子
    'w-music-0': "loudspeaker|megaphone|horn", // 喇叭
    'w-music-1': "bell|jingle bell", // 鈴鐺
    'w-music-2': "violin|fiddle", // 小提琴
    'w-music-3': "harmonica|mouth organ", // 口琴
    'w-music-4': "triangle", // 三角鐵
    'w-music-5': "vinyl record|record|vinyl", // 唱片
    'w-music-6': "drumsticks|drumstick", // 鼓棒
    'w-music-7': "maracas|shaker", // 沙鈴
    'w-music-8': "xylophone", // 木琴
    'w-music-9': "musical staff|staff|stave", // 五線譜
    'w-music-10': "conductor's baton", // 指揮棒
    'w-music-11': "sheet music|score", // 樂譜
    'w-music-12': "cello", // 大提琴
    'w-music-13': "flute", // 長笛
    'w-music-14': "accordion", // 手風琴
    'w-music-15': "tambourine", // 鈴鼓
    'w-music-16': "harp", // 豎琴
    'w-music-17': "bass guitar|bass", // 貝斯
    'w-music-18': "castanets", // 響板
    'w-music-19': "hand drum|bongo|bongos", // 手鼓
    'w-music-20': "trumpet", // 小號
    'w-music-21': "glockenspiel|metallophone", // 鐵琴
    'w-music-22': "saxophone|sax", // 薩克斯風
    'w-music-23': "musical rest|rest", // 休止符
    'w-music-24': "treble clef|g clef", // 高音譜號
    'w-music-25': "metronome", // 節拍器
    'w-music-26': "music box", // 音樂盒
    'w-music-27': "clarinet", // 豎笛
    'w-music-28': "choir|chorus", // 合唱團
    'w-music-29': "band|music band", // 樂團
    'w-music-30': "rock music|rock and roll", // 搖滾
    'w-music-31': "rap|hip hop", // 饒舌
    'w-music-32': "jazz", // 爵士
    'w-music-33': "classical music", // 古典樂
    'w-music-34': "lullaby", // 搖籃曲
    'w-music-35': "waltz", // 圓舞曲
    'w-music-36': "national anthem|anthem", // 國歌
    'w-music-37': "pachelbel's canon|canon", // 卡農
    'w-music-38': "nursery rhyme|children's song", // 兒歌
    'w-music-39': "recording studio|studio", // 錄音室
    'w-music-40': "duet", // 二重唱
    'w-music-41': "solo|solo performance", // 獨奏
    'w-music-42': "oboe", // 雙簧管
    'w-music-43': "trombone", // 伸縮號
    'w-music-44': "viola", // 中提琴
    'w-music-45': "double bass|contrabass", // 低音提琴
    'w-music-46': "french horn", // 法國號
    'w-music-47': "symphony orchestra|orchestra", // 交響樂團
    'w-music-48': "concert", // 音樂會
    'w-music-49': "pop song|pop music|pop", // 流行歌
    'w-music-50': "march|marching song", // 進行曲
    'w-music-51': "happy birthday song|happy birthday", // 生日快樂歌
    'w-music-52': "electronic music|edm", // 電子音樂
    'w-music-53': "street performer|busker", // 街頭藝人
    'w-music-54': "percussion", // 打擊樂
    'w-people-0': "dad|father|daddy", // 爸爸
    'w-people-1': "mom|mother|mum|mommy", // 媽媽
    'w-people-2': "baby|infant", // 嬰兒
    'w-people-3': "grandpa|grandfather", // 爺爺
    'w-people-4': "grandma|grandmother", // 奶奶
    'w-people-5': "older brother|big brother", // 哥哥
    'w-people-6': "older sister|big sister", // 姊姊
    'w-people-7': "younger brother|little brother", // 弟弟
    'w-people-8': "younger sister|little sister", // 妹妹
    'w-people-9': "maternal grandfather|mother's father", // 外公
    'w-people-10': "maternal grandmother|mother's mother", // 外婆
    'w-people-11': "old man|elderly person|senior|old person", // 老人
    'w-people-12': "bride", // 新娘
    'w-people-13': "groom|bridegroom", // 新郎
    'w-people-14': "twins|twin", // 雙胞胎
    'w-people-15': "student|pupil", // 學生
    'w-people-16': "birthday boy|birthday girl|birthday person", // 壽星
    'w-people-17': "audience|spectator|viewer", // 觀眾
    'w-people-18': "fan|fans", // 粉絲
    'w-people-19': "uncle", // 叔叔
    'w-people-20': "aunt|auntie", // 阿姨
    'w-people-21': "maternal uncle|mother's brother", // 舅舅
    'w-people-22': "cousin|older cousin", // 表哥
    'w-people-23': "classmate", // 同學
    'w-people-24': "neighbor|neighbour", // 鄰居
    'w-people-25': "friend", // 朋友
    'w-people-26': "guest|visitor", // 客人
    'w-people-27': "captain|team leader", // 隊長
    'w-people-28': "roommate|flatmate", // 室友
    'w-people-29': "tour guide|guide", // 導遊
    'w-people-30': "passerby|passer-by|bystander", // 路人
    'w-people-31': "idol", // 偶像
    'w-people-32': "teenager|teen|adolescent", // 青少年
    'w-people-33': "class leader|class monitor|class president", // 班長
    'w-people-34': "landlord|landlady", // 房東
    'w-people-35': "customer|client", // 顧客
    'w-people-36': "partner|buddy|companion", // 夥伴
    'w-people-37': "opponent|rival", // 對手
    'w-people-38': "boss", // 老闆
    'w-people-39': "elementary school student|primary school student|schoolchild", // 小學生
    'w-people-40': "college student|university student", // 大學生
    'w-people-41': "graduate", // 畢業生
    'w-people-42': "contest judge|jury|judging panel", // 評審
    'w-people-43': "babysitter|nanny", // 保母
    'w-body-0': "nose", // 鼻子
    'w-body-1': "mouth", // 嘴巴
    'w-body-2': "ear|ears", // 耳朵
    'w-body-3': "tooth|teeth", // 牙齒
    'w-body-4': "foot|feet", // 腳
    'w-body-5': "hair", // 頭髮
    'w-body-6': "finger|fingers", // 手指
    'w-body-7': "footprint|footprints", // 腳印
    'w-body-8': "eyebrow|eyebrows", // 眉毛
    'w-body-9': "tongue", // 舌頭
    'w-body-10': "neck", // 脖子
    'w-body-11': "belly|tummy", // 肚子
    'w-body-12': "belly button|navel", // 肚臍
    'w-body-13': "bottom|butt", // 屁股
    'w-body-14': "knee|knees", // 膝蓋
    'w-body-15': "arm|arms", // 手臂
    'w-body-16': "fingernail|nail|nails", // 指甲
    'w-body-17': "bone|bones", // 骨頭
    'w-body-18': "heart", // 心臟
    'w-body-19': "brain", // 大腦
    'w-body-20': "muscle|muscles", // 肌肉
    'w-body-21': "beard|mustache|moustache", // 鬍子
    'w-body-22': "eyelash|eyelashes", // 睫毛
    'w-body-23': "fist", // 拳頭
    'w-body-24': "lips|lip", // 嘴唇
    'w-body-25': "dimple|dimples", // 酒窩
    'w-body-26': "shoulder|shoulders", // 肩膀
    'w-body-27': "elbow", // 手肘
    'w-body-28': "ankle", // 腳踝
    'w-body-29': "chin|jaw", // 下巴
    'w-body-30': "forehead", // 額頭
    'w-body-31': "lung|lungs", // 肺
    'w-body-32': "stomach", // 胃
    'w-body-33': "intestine|intestines|gut|bowel", // 腸子
    'w-body-34': "beauty mark|mole", // 痣
    'w-body-35': "freckle|freckles", // 雀斑
    'w-clothes-0': "skirt", // 裙子
    'w-clothes-1': "pants|trousers", // 褲子
    'w-clothes-2': "socks|sock", // 襪子
    'w-clothes-3': "gloves|glove", // 手套
    'w-clothes-4': "scarf", // 圍巾
    'w-clothes-5': "necktie|tie", // 領帶
    'w-clothes-6': "watch|wristwatch", // 手錶
    'w-clothes-7': "ring", // 戒指
    'w-clothes-8': "raincoat", // 雨衣
    'w-clothes-9': "slippers|flip-flops", // 拖鞋
    'w-clothes-10': "jacket|coat", // 外套
    'w-clothes-11': "shorts", // 短褲
    'w-clothes-12': "dress", // 洋裝
    'w-clothes-13': "sweater|jumper", // 毛衣
    'w-clothes-14': "vest|tank top", // 背心
    'w-clothes-15': "pajamas|pyjamas", // 睡衣
    'w-clothes-16': "swimsuit|swimming suit|bathing suit", // 泳衣
    'w-clothes-17': "underwear|underpants", // 內褲
    'w-clothes-18': "face mask|mask", // 口罩
    'w-clothes-19': "necklace", // 項鍊
    'w-clothes-20': "earrings|earring", // 耳環
    'w-clothes-21': "rain boots|rubber boots|wellies", // 雨鞋
    'w-clothes-22': "high heels|high heel|heels", // 高跟鞋
    'w-clothes-23': "boots|boot", // 靴子
    'w-clothes-24': "belt", // 皮帶
    'w-clothes-25': "bow|ribbon", // 蝴蝶結
    'w-clothes-26': "hairpin|hair clip|barrette", // 髮夾
    'w-clothes-27': "backpack|schoolbag|rucksack", // 背包
    'w-clothes-28': "wallet|purse", // 錢包
    'w-clothes-29': "handbag|bag|tote bag", // 手提包
    'w-clothes-30': "helmet|safety helmet|hard hat", // 安全帽
    'w-clothes-31': "straw hat", // 草帽
    'w-clothes-32': "apron", // 圍裙
    'w-clothes-33': "uniform", // 制服
    'w-clothes-34': "suit|business suit", // 西裝
    'w-clothes-35': "cheongsam|qipao", // 旗袍
    'w-clothes-36': "kimono", // 和服
    'w-clothes-37': "wedding dress|wedding gown", // 婚紗
    'w-clothes-38': "tuxedo|tailcoat", // 燕尾服
    'w-clothes-39': "jeans|blue jeans", // 牛仔褲
    'w-clothes-40': "hoodie|hooded sweatshirt", // 連帽衫
    'w-clothes-41': "down jacket|puffer jacket|puffy jacket", // 羽絨外套
    'w-clothes-42': "headband|hairband", // 髮箍
    'w-clothes-43': "bracelet|wristband", // 手環
    'w-clothes-44': "earmuffs", // 耳罩
    'w-clothes-45': "bamboo hat|conical hat|rice hat", // 斗笠
    'w-taiwan-0': "taipei 101|101", // 台北101
    'w-taiwan-1': "jade mountain|yushan|mount yu|mt. yu", // 玉山
    'w-taiwan-2': "alishan|mount ali|ali mountain", // 阿里山
    'w-taiwan-3': "sun moon lake", // 日月潭
    'w-taiwan-4': "sunlight and moonlight|sun moon light", // 日月光
    'w-taiwan-5': "betel nut|areca nut", // 檳榔
    'w-taiwan-6': "taroko|taroko gorge", // 太魯閣
    'w-taiwan-7': "kenting", // 墾丁
    'w-taiwan-8': "penghu|pescadores", // 澎湖
    'w-taiwan-9': "orchid island|lanyu", // 蘭嶼
    'w-taiwan-10': "mazu pilgrimage|mazu procession|matsu pilgrimage", // 媽祖遶境
    'w-taiwan-11': "yanshui beehive fireworks|yanshui fireworks|beehive fireworks", // 鹽水蜂炮
    'w-festival-0': "red envelope|lucky money|hongbao", // 紅包
    'w-festival-1': "gift|present", // 禮物
    'w-festival-2': "santa claus|santa", // 聖誕老人
    'w-festival-3': "fireworks|firework", // 煙火
    'w-festival-4': "firecracker|firecrackers", // 鞭炮
    'w-festival-5': "jack-o'-lantern|jack o lantern|pumpkin lantern", // 南瓜燈
    'w-festival-6': "sky lantern|flying lantern", // 天燈
    'w-festival-7': "spring couplets|couplets|new year couplets", // 春聯
    'w-festival-8': "dragon dance", // 舞龍
    'w-festival-9': "lion dance", // 舞獅
    'w-festival-10': "lantern festival", // 元宵節
    'w-festival-11': "mid-autumn festival|moon festival", // 中秋節
    'w-festival-12': "dragon boat festival", // 端午節
    'w-festival-13': "dragon boat", // 龍舟
    'w-festival-14': "chinese new year|lunar new year|spring festival", // 春節
    'w-festival-15': "christmas|xmas", // 聖誕節
    'w-festival-16': "halloween", // 萬聖節
    'w-festival-17': "easter", // 復活節
    'w-festival-18': "easter egg|painted egg|colored egg", // 彩蛋
    'w-festival-19': "valentine's day|valentines day|valentine", // 情人節
    'w-festival-20': "mother's day|mothers day", // 母親節
    'w-festival-21': "father's day|fathers day", // 父親節
    'w-festival-22': "children's day|childrens day", // 兒童節
    'w-festival-23': "birthday", // 生日
    'w-festival-24': "christmas stocking|stocking", // 聖誕襪
    'w-festival-25': "new year's eve dinner|reunion dinner", // 年夜飯
    'w-festival-26': "moon gazing|moon watching", // 賞月
    'w-festival-27': "lantern riddles|riddle game|lantern riddle", // 猜燈謎
    'w-festival-28': "teachers' day|teachers day|teacher's day", // 教師節
    'w-festival-29': "tomb sweeping day|qingming festival|qingming", // 清明節
    'w-festival-30': "new year's eve|chinese new year's eve", // 除夕
    'w-festival-31': "qixi festival|qixi|chinese valentine's day", // 七夕
    'w-festival-32': "double ninth festival|chongyang festival", // 重陽節
    'w-festival-33': "thanksgiving", // 感恩節
    'w-festival-34': "ghost festival|hungry ghost festival", // 中元節
    'w-festival-35': "new year countdown|countdown", // 跨年
    'w-toy-0': "yo-yo|yoyo", // 溜溜球
    'w-toy-1': "bamboo dragonfly|bamboo copter", // 竹蜻蜓
    'w-toy-2': "paper airplane|paper plane", // 紙飛機
    'w-toy-3': "water gun|squirt gun", // 水槍
    'w-toy-4': "slingshot", // 彈弓
    'w-toy-5': "beanbag|bean bag", // 沙包
    'w-toy-6': "rocking horse", // 木馬
    'w-toy-7': "roly-poly toy|tumbler toy|roly-poly", // 不倒翁
    'w-toy-8': "kaleidoscope", // 萬花筒
    'w-toy-9': "paper boat", // 紙船
    'w-toy-10': "clay|play dough|modeling clay", // 黏土
    'w-toy-11': "stuffed toy|plush toy|stuffed animal", // 布偶
    'w-toy-12': "remote control car|rc car", // 遙控車
    'w-toy-13': "model airplane|model plane", // 模型飛機
    'w-toy-14': "toy train", // 小火車
    'w-toy-15': "stacking blocks game|block stacking tower|jenga", // 疊疊樂
    'w-toy-16': "dominoes|domino", // 骨牌
    'w-toy-17': "bubble gun", // 泡泡槍
    'w-toy-18': "wind-up toy|clockwork toy", // 發條玩具
    'w-toy-19': "pinball|pinball machine", // 彈珠台
    'w-toy-20': "hand puppet", // 手偶
    'w-toy-21': "toy soldier", // 玩具兵
    'w-toy-22': "dollhouse|doll house", // 娃娃屋
    'w-toy-23': "fuse beads|perler beads", // 拼豆
    'w-toy-24': "cat's cradle|string figure", // 翻花繩
    'w-toy-25': "paper doll", // 紙娃娃
    'w-toy-26': "diabolo|chinese yo-yo", // 扯鈴
    'w-toy-27': "kendama", // 劍玉
    'w-toy-28': "bouncy ball|bouncing ball", // 彈力球
    'w-toy-29': "nesting doll|matryoshka|russian doll", // 套娃
    'w-toy-30': "rattle drum|pellet drum", // 波浪鼓
    'w-toy-31': "balance bike", // 滑步車
    'w-toy-32': "chinese rings puzzle|nine linked rings", // 九連環
    'w-toy-33': "tangram", // 七巧板
    'w-toy-34': "klotski|sliding block puzzle", // 華容道
    'w-toy-35': "burr puzzle|luban lock", // 孔明鎖
    'w-toy-36': "sudoku", // 數獨
    'w-toy-37': "crossword|crossword puzzle", // 填字遊戲
    'w-toy-38': "bingo", // 賓果
    'w-toy-39': "escape room", // 密室逃脫
    'w-school-0': "schoolbag|school bag", // 書包
    'w-school-1': "blackboard|chalkboard", // 黑板
    'w-school-2': "chalk", // 粉筆
    'w-school-3': "textbook", // 課本
    'w-school-4': "pencil case|pencil box", // 鉛筆盒
    'w-school-5': "marker|color marker|colored marker", // 彩色筆
    'w-school-6': "lunch box|lunchbox", // 便當盒
    'w-school-7': "exercise book|homework book|workbook", // 作業簿
    'w-school-8': "award certificate|certificate", // 獎狀
    'w-school-9': "whiteboard", // 白板
    'w-school-10': "pencil sharpener", // 削筆機
    'w-school-11': "drawing compass|pair of compasses", // 圓規
    'w-school-12': "protractor", // 量角器
    'w-school-13': "set square|triangle ruler", // 三角板
    'w-school-14': "highlighter", // 螢光筆
    'w-school-15': "ballpoint pen|pen", // 原子筆
    'w-school-16': "fountain pen", // 鋼筆
    'w-school-17': "calligraphy brush|ink brush", // 毛筆
    'w-school-18': "ink|ink bottle", // 墨水
    'w-school-19': "blackboard eraser|chalkboard eraser", // 板擦
    'w-school-20': "podium|lectern", // 講台
    'w-school-21': "globe", // 地球儀
    'w-school-22': "report card", // 成績單
    'w-school-23': "test paper|exam paper", // 考卷
    'w-school-24': "folder|file folder", // 資料夾
    'w-school-25': "paper clip|paperclip", // 迴紋針
    'w-school-26': "thumbtack|pushpin", // 圖釘
    'w-school-27': "tape|adhesive tape|sticky tape", // 膠帶
    'w-school-28': "utility knife|box cutter", // 美工刀
    'w-school-29': "abacus", // 算盤
    'w-school-30': "microscope", // 顯微鏡
    'w-school-31': "test tube", // 試管
    'w-school-32': "beaker", // 燒杯
    'w-school-33': "correction fluid|white-out", // 立可白
    'w-school-34': "bulletin board|notice board", // 布告欄
    'w-school-35': "diploma", // 畢業證書
    'w-school-36': "sports day", // 運動會
    'w-school-37': "field trip|school trip", // 校外教學
    'w-school-38': "cram school", // 補習班
    'w-school-39': "roll call", // 點名
    'w-plant-0': "green leaf|leaf", // 綠葉
    'w-plant-1': "bamboo", // 竹子
    'w-plant-2': "four-leaf clover|clover", // 幸運草
    'w-plant-3': "potted plant|houseplant", // 盆栽
    'w-plant-4': "willow|willow tree", // 柳樹
    'w-plant-5': "flower bud|bud", // 花苞
    'w-plant-6': "bean sprout", // 豆芽
    'w-plant-7': "hay|rice straw|hay bale", // 稻草
    'w-plant-8': "carnation", // 康乃馨
    'w-plant-9': "jasmine", // 茉莉花
    'w-plant-10': "lavender", // 薰衣草
    'w-plant-11': "hydrangea", // 繡球花
    'w-plant-12': "peony", // 牡丹
    'w-plant-13': "daffodil|narcissus", // 水仙
    'w-plant-14': "succulent", // 多肉植物
    'w-plant-15': "sensitive plant|mimosa", // 含羞草
    'w-plant-16': "venus flytrap", // 捕蠅草
    'w-plant-17': "pitcher plant", // 豬籠草
    'w-plant-18': "aloe|aloe vera", // 蘆薈
    'w-plant-19': "mint", // 薄荷
    'w-plant-20': "banyan|banyan tree", // 榕樹
    'w-plant-21': "ginkgo", // 銀杏
    'w-plant-22': "palm tree", // 棕櫚樹
    'w-plant-23': "poinsettia", // 聖誕紅
    'w-plant-24': "azalea", // 杜鵑花
    'w-plant-25': "reed", // 蘆葦
    'w-plant-26': "wheat", // 小麥
    'w-plant-27': "cotton", // 棉花
    'w-plant-28': "sugarcane|sugar cane", // 甘蔗
    'w-plant-29': "water lily", // 睡蓮
    'w-plant-30': "bonsai", // 盆景
    'w-plant-31': "giant tree|sacred tree|giant cypress", // 神木
    'w-plant-32': "mangrove", // 紅樹林
    'w-plant-33': "photosynthesis", // 光合作用
    'w-plant-34': "pollen", // 花粉
    'w-plant-35': "sprouting|germination|sprout", // 發芽
    'w-plant-36': "tung blossom|tung flower", // 油桐花
    'w-plant-37': "cosmos flower|cosmos", // 波斯菊
    'w-plant-38': "hyacinth", // 風信子
    'w-plant-39': "night-blooming cereus|queen of the night", // 曇花
    'w-ocean-0': "seaweed|kelp", // 海草
    'w-ocean-1': "anchor", // 船錨
    'w-ocean-2': "life ring|lifebuoy|life preserver", // 救生圈
    'w-ocean-3': "fishing net", // 漁網
    'w-ocean-4': "fish hook|fishhook", // 魚鉤
    'w-ocean-5': "hermit crab", // 寄居蟹
    'w-ocean-6': "conch|sea snail", // 海螺
    'w-ocean-7': "pearl", // 珍珠
    'w-ocean-8': "orca|killer whale", // 虎鯨
    'w-ocean-9': "sea lion", // 海獅
    'w-ocean-10': "walrus", // 海象
    'w-ocean-11': "manatee|sea cow", // 海牛
    'w-ocean-12': "swordfish|marlin|sailfish", // 旗魚
    'w-ocean-13': "flying fish", // 飛魚
    'w-ocean-14': "ocean sunfish|sunfish|mola mola", // 翻車魚
    'w-ocean-15': "whale shark", // 鯨鯊
    'w-ocean-16': "hammerhead shark|hammerhead", // 鎚頭鯊
    'w-ocean-17': "sea cucumber", // 海參
    'w-ocean-18': "scallop", // 扇貝
    'w-ocean-19': "coral reef", // 珊瑚礁
    'w-ocean-20': "shipwreck|sunken ship", // 沉船
    'w-ocean-21': "buoy", // 浮標
    'w-ocean-22': "diving mask|snorkel mask", // 潛水鏡
    'w-ocean-23': "oxygen tank|scuba tank", // 氧氣瓶
    'w-ocean-24': "flippers|swim fins", // 蛙鞋
    'w-ocean-25': "message in a bottle|drift bottle", // 漂流瓶
    'w-ocean-26': "pier|dock|wharf", // 碼頭
    'w-ocean-27': "wave breaker block|tetrapod", // 消波塊
    'w-ocean-28': "narwhal", // 獨角鯨
    'w-ocean-29': "blue whale", // 藍鯨
    'w-ocean-30': "anglerfish", // 鮟鱇魚
    'w-ocean-31': "barnacle", // 藤壺
    'w-ocean-32': "plankton", // 浮游生物
    'w-ocean-33': "intertidal zone|tidal zone", // 潮間帶
    'w-ocean-34': "ocean trench|trench", // 海溝
    'w-ocean-35': "ocean current", // 洋流
    'w-ocean-36': "red tide", // 赤潮
    'w-ocean-37': "sperm whale", // 抹香鯨
    'w-ocean-38': "humpback whale|humpback", // 座頭鯨
    'w-ocean-39': "nautilus", // 鸚鵡螺
    'w-tech-0': "tablet|tablet computer", // 平板
    'w-tech-1': "digital watch", // 電子錶
    'w-tech-2': "usb drive|flash drive|usb stick", // 隨身碟
    'w-tech-3': "game console|console", // 遊戲機
    'w-tech-4': "calculator", // 計算機
    'w-tech-5': "plug|power plug", // 插頭
    'w-tech-6': "game controller|gamepad|controller", // 遊戲手把
    'w-tech-7': "joystick", // 搖桿
    'w-tech-8': "memory card|sd card", // 記憶卡
    'w-tech-9': "hard drive|hard disk", // 硬碟
    'w-tech-10': "cd|disc|dvd", // 光碟
    'w-tech-11': "usb cable|charging cable|cable", // 傳輸線
    'w-tech-12': "antenna", // 天線
    'w-tech-13': "stylus", // 觸控筆
    'w-tech-14': "webcam", // 視訊鏡頭
    'w-tech-15': "wireless earbuds|earbuds", // 無線耳機
    'w-tech-16': "password", // 密碼
    'w-tech-17': "barcode", // 條碼
    'w-tech-18': "circuit board", // 電路板
    'w-tech-19': "microchip|chip", // 晶片
    'w-tech-20': "email|e-mail", // 電子郵件
    'w-tech-21': "cursor|mouse cursor", // 游標
    'w-tech-22': "download", // 下載
    'w-tech-23': "computer crash|crash|frozen computer", // 當機
    'w-tech-24': "wi-fi|wifi", // 無線網路
    'w-tech-25': "bluetooth", // 藍牙
    'w-tech-26': "robotic arm|robot arm", // 機械手臂
    'w-tech-27': "tripod", // 腳架
    'w-tech-28': "gps navigation|navigation|gps", // 導航
    'w-tech-29': "electric toothbrush", // 電動牙刷
    'w-tech-30': "computer virus", // 電腦病毒
    'w-tech-31': "hacker", // 駭客
    'w-tech-32': "search engine", // 搜尋引擎
    'w-tech-33': "server", // 伺服器
    'w-tech-34': "3d printing|3d printer", // 3D列印
    'w-tech-35': "sensor", // 感應器
    'w-tech-36': "dashcam|dash cam", // 行車紀錄器
    'w-tech-37': "fingerprint scanner|fingerprint recognition", // 指紋辨識
    'w-tech-38': "face recognition|facial recognition", // 人臉辨識
    'w-tech-39': "code|source code|programming", // 程式碼
    'w-tool-0': "nail", // 釘子
    'w-tool-1': "screw", // 螺絲
    'w-tool-2': "shovel|spade", // 鏟子
    'w-tool-3': "rope", // 繩子
    'w-tool-4': "axe|ax", // 斧頭
    'w-tool-5': "pliers", // 鉗子
    'w-tool-6': "hose|water pipe|pipe", // 水管
    'w-tool-7': "paint|paint can", // 油漆
    'w-tool-8': "electric drill|drill", // 電鑽
    'w-tool-9': "nut|hex nut", // 螺帽
    'w-tool-10': "chain|iron chain", // 鐵鍊
    'w-tool-11': "hook", // 掛鉤
    'w-tool-12': "sandpaper", // 砂紙
    'w-tool-13': "chisel", // 鑿子
    'w-tool-14': "hoe", // 鋤頭
    'w-tool-15': "rake", // 耙子
    'w-tool-16': "sickle", // 鐮刀
    'w-tool-17': "pickaxe", // 十字鎬
    'w-tool-18': "wire|iron wire", // 鐵絲
    'w-tool-19': "brick", // 磚塊
    'w-tool-20': "cement|concrete", // 水泥
    'w-tool-21': "wooden plank|plank|board", // 木板
    'w-tool-22': "traffic cone|cone", // 三角錐
    'w-tool-23': "hot glue gun|glue gun", // 熱熔槍
    'w-tool-24': "fence", // 圍籬
    'w-tool-25': "air pump|bike pump|pump", // 打氣筒
    'w-tool-26': "paint roller", // 滾筒刷
    'w-tool-27': "chainsaw", // 電鋸
    'w-tool-28': "lawn mower|lawnmower", // 割草機
    'w-tool-29': "goggles|safety goggles", // 護目鏡
    'w-tool-30': "faucet|tap", // 水龍頭
    'w-tool-31': "plunger", // 馬桶吸把
    'w-tool-32': "hex key|allen key|allen wrench", // 六角扳手
    'w-tool-33': "car jack|jack", // 千斤頂
    'w-tool-34': "trowel", // 鏝刀
    'w-tool-35': "caliper|vernier caliper", // 游標卡尺
    'w-tool-36': "scaffolding|scaffold", // 鷹架
    'w-tool-37': "rebar|steel bar", // 鋼筋
    'w-tool-38': "hinge", // 鉸鏈
    'w-tool-39': "welding", // 電焊
    'w-dino-0': "dinosaur egg", // 恐龍蛋
    'w-dino-1': "fossil", // 化石
    'w-dino-2': "dinosaur skeleton|dinosaur bones", // 恐龍骨架
    'w-dino-3': "mammoth|woolly mammoth", // 長毛象
    'w-dino-4': "triceratops", // 三角龍
    'w-dino-5': "stegosaurus", // 劍龍
    'w-dino-6': "brachiosaurus", // 腕龍
    'w-dino-7': "brontosaurus|apatosaurus", // 雷龍
    'w-dino-8': "pterosaur|pterodactyl|pteranodon", // 翼龍
    'w-dino-9': "velociraptor|raptor", // 迅猛龍
    'w-dino-10': "ankylosaurus", // 甲龍
    'w-dino-11': "plesiosaur|plesiosaurus", // 蛇頸龍
    'w-dino-12': "spinosaurus", // 棘龍
    'w-dino-13': "saber-toothed tiger|sabertooth|saber-toothed cat", // 劍齒虎
    'w-dino-14': "caveman|prehistoric man", // 原始人
    'w-dino-15': "cave painting", // 洞穴壁畫
    'w-dino-16': "stone tool", // 石器
    'w-dino-17': "stone axe|stone ax", // 石斧
    'w-dino-18': "fire by friction|rubbing sticks for fire|fire drilling", // 鑽木取火
    'w-dino-19': "amber", // 琥珀
    'w-dino-20': "trilobite", // 三葉蟲
    'w-dino-21': "ammonite", // 菊石
    'w-dino-22': "archaeopteryx", // 始祖鳥
    'w-dino-23': "mosasaurus|mosasaur", // 滄龍
    'w-dino-24': "ichthyosaur|ichthyosaurus", // 魚龍
    'w-dino-25': "parasaurolophus", // 副櫛龍
    'w-dino-26': "ice age", // 冰河時期
    'w-dino-27': "dinosaur extinction|extinction", // 恐龍滅絕
    'w-dino-28': "dodo|dodo bird", // 渡渡鳥
    'w-dino-29': "jurassic|jurassic period", // 侏羅紀
    'w-fairy-0': "little red riding hood|red riding hood", // 小紅帽
    'w-fairy-1': "three little pigs", // 三隻小豬
    'w-fairy-2': "ugly duckling", // 醜小鴨
    'w-fairy-3': "big bad wolf", // 大野狼
    'w-fairy-4': "pumpkin carriage|pumpkin coach", // 南瓜馬車
    'w-fairy-5': "glass slipper", // 玻璃鞋
    'w-fairy-6': "candy house|hansel and gretel", // 糖果屋
    'w-fairy-7': "poison apple|poisoned apple", // 毒蘋果
    'w-fairy-8': "wolf and the seven young goats|seven little goats", // 七隻小羊
    'w-fairy-9': "fairy godmother", // 仙女教母
    'w-fairy-10': "emperor's new clothes", // 國王新衣
    'w-fairy-11': "rapunzel", // 長髮公主
    'w-fairy-12': "pinocchio", // 小木偶
    'w-fairy-13': "frog prince", // 青蛙王子
    'w-fairy-14': "jack and the beanstalk|magic beans|beanstalk", // 魔豆
    'w-fairy-15': "tortoise and the hare", // 龜兔賽跑
    'w-fairy-16': "thumbelina", // 拇指姑娘
    'w-fairy-17': "alice in wonderland|alice", // 愛麗絲
    'w-fairy-18': "mother goose", // 鵝媽媽
    'w-fairy-19': "golden axe|golden ax", // 金斧頭
    'w-fairy-20': "crow and the pitcher|thirsty crow", // 烏鴉喝水
    'w-fairy-21': "momotaro|peach boy", // 桃太郎
    'w-fairy-22': "aunt tiger|grandaunt tiger", // 虎姑婆
    'w-fairy-23': "nian beast|nian|nian monster", // 年獸
    'w-fairy-24': "magic mirror", // 魔鏡
    'w-fairy-25': "spinning wheel", // 紡車
    'w-fairy-26': "gingerbread man", // 薑餅人
    'w-fairy-27': "nutcracker", // 胡桃鉗
    'w-fairy-28': "scarecrow", // 稻草人
    'w-fairy-29': "princess and the pea", // 豌豆公主
    'w-fairy-30': "north wind and the sun", // 北風與太陽
    'w-fairy-31': "fox and the grapes", // 狐狸與葡萄
    'w-fairy-32': "hou yi shoots the suns|houyi", // 后羿射日
    'w-fairy-33': "nuwa mends the sky|nuwa", // 女媧補天
    'w-fairy-34': "legend of the white snake|white snake", // 白蛇傳
    'w-fairy-35': "ali baba", // 阿里巴巴
    'w-fairy-36': "open sesame", // 芝麻開門
    'w-fairy-37': "aesop's fables|aesop", // 伊索寓言
    'w-fairy-38': "little prince", // 小王子
    'w-fairy-39': "pied piper", // 吹笛人
    'w-earth-0': "earth's crust|crust", // 地殼
    'w-earth-1': "earth's core|core", // 地核
    'w-earth-2': "magma|lava", // 岩漿
    'w-earth-3': "hot spring", // 溫泉
    'w-earth-4': "geyser", // 間歇泉
    'w-earth-5': "stalactite", // 鐘乳石
    'w-earth-6': "stalagmite", // 石筍
    'w-earth-7': "crystal|quartz", // 水晶
    'w-earth-8': "diamond", // 鑽石
    'w-earth-9': "gemstone|gem|jewel", // 寶石
    'w-earth-10': "gold mine|gold ore", // 金礦
    'w-earth-11': "coal", // 煤炭
    'w-earth-12': "oil|petroleum|crude oil", // 石油
    'w-earth-13': "sand", // 沙子
    'w-earth-14': "pebble|cobblestone", // 鵝卵石
    'w-earth-15': "volcanic crater|volcano crater", // 火山口
    'w-earth-16': "volcanic ash", // 火山灰
    'w-earth-17': "seismograph|seismometer", // 地震儀
    'w-earth-18': "weather vane|wind vane", // 風向儀
    'w-earth-19': "rain gauge", // 雨量計
    'w-earth-20': "weather station", // 氣象站
    'w-earth-21': "weather forecast", // 天氣預報
    'w-earth-22': "water cycle", // 水循環
    'w-earth-23': "delta|river delta", // 三角洲
    'w-earth-24': "atmosphere", // 大氣層
    'w-earth-25': "spring|springtime", // 春天
    'w-earth-26': "summer", // 夏天
    'w-earth-27': "autumn|fall", // 秋天
    'w-earth-28': "winter", // 冬天
    'w-earth-29': "four seasons|seasons", // 四季
    'w-earth-30': "dark cloud|rain cloud", // 烏雲
    'w-earth-31': "cumulonimbus|thundercloud|storm cloud", // 積雨雲
    'w-earth-32': "eye of the typhoon|typhoon eye|eye of the storm", // 颱風眼
    'w-earth-33': "marble", // 大理石
    'w-earth-34': "mine|mine shaft", // 礦坑
    'w-earth-35': "dam", // 水壩
    'w-earth-36': "sinkhole", // 天坑
    'w-earth-37': "sea cave", // 海蝕洞
    'w-earth-38': "volcanic island", // 火山島
    'w-earth-39': "geothermal energy|geothermal", // 地熱
    'w-earth-40': "fault line|fault", // 斷層
    'w-earth-41': "tectonic plate|plate tectonics", // 板塊
    'w-earth-42': "weather satellite", // 氣象衛星
    'w-earth-43': "contour line", // 等高線
    'w-earth-44': "latitude and longitude|longitude and latitude", // 經緯線
    'w-earth-45': "groundwater", // 地下水
    'w-earth-46': "alluvial fan", // 沖積扇
    'w-earth-47': "permafrost", // 永凍土
    'w-earth-48': "ozone layer", // 臭氧層
    'w-earth-49': "greenhouse effect", // 溫室效應
    'w-earth-50': "global warming", // 全球暖化
    'w-earth-51': "sea level", // 海平面
    'w-earth-52': "day and night", // 晝夜
    'w-earth-53': "earth's rotation|rotation", // 自轉
    'w-earth-54': "earth's orbit|revolution|orbit", // 公轉
    'w-earth-55': "earth's axis|axis", // 地軸
    'w-earth-56': "tropic|tropic of cancer|tropic of capricorn", // 回歸線
    'w-earth-57': "time zone", // 時區
    'w-earth-58': "weather front|front", // 鋒面
    'w-earth-59': "el nino", // 聖嬰現象
    'w-earth-60': "igneous rock", // 火成岩
    'w-earth-61': "sedimentary rock", // 沉積岩
    'w-earth-62': "granite", // 花崗岩
    'w-earth-63': "limestone", // 石灰岩
    'w-earth-64': "basalt", // 玄武岩
    'w-earth-65': "rock layers|strata", // 岩層
    'w-earth-66': "continental drift", // 大陸漂移
    'w-earth-67': "underwater volcano|submarine volcano", // 海底火山
    'w-earth-68': "atoll", // 環礁
    'w-earth-69': "lagoon", // 潟湖
    'w-earth-70': "fjord", // 峽灣
    'w-earth-71': "karst", // 喀斯特
    'w-earth-72': "stone forest", // 石林
    'w-earth-73': "mud volcano", // 泥火山
    'w-earth-74': "river pothole|pothole", // 壺穴
    'w-earth-75': "meander", // 曲流
    'w-earth-76': "oxbow lake", // 牛軛湖
    'w-earth-77': "landslide lake|barrier lake", // 堰塞湖
    'w-earth-78': "weathering", // 風化
    'w-earth-79': "erosion", // 侵蝕
    'w-culture-0': "tea ceremony", // 茶道
    'w-culture-1': "calligraphy", // 書法
    'w-culture-2': "ink painting|chinese painting|ink wash painting", // 水墨畫
    'w-culture-3': "chinese knot", // 中國結
    'w-culture-4': "shadow puppetry|shadow play|shadow puppet", // 皮影戲
    'w-culture-5': "glove puppetry|budaixi|glove puppet show", // 布袋戲
    'w-culture-6': "peking opera|beijing opera", // 京劇
    'w-culture-7': "opera mask|peking opera mask", // 臉譜
    'w-culture-8': "tai chi|taichi", // 太極拳
    'w-culture-9': "kung fu|kungfu", // 功夫
    'w-culture-10': "sumo|sumo wrestling", // 相撲
    'w-culture-11': "judo", // 柔道
    'w-culture-12': "karate", // 空手道
    'w-culture-13': "yoga", // 瑜珈
    'w-culture-14': "torii|torii gate", // 鳥居
    'w-culture-15': "shinto shrine|shrine", // 神社
    'w-culture-16': "lucky cat|maneki-neko|beckoning cat", // 招財貓
    'w-culture-17': "carp streamer|koinobori", // 鯉魚旗
    'w-culture-18': "paper crane|origami crane", // 紙鶴
    'w-culture-19': "totem pole|totem", // 圖騰柱
    'w-culture-20': "boomerang", // 回力鏢
    'w-culture-21': "wooden clogs|clogs|geta", // 木屐
    'w-culture-22': "bagpipes|bagpipe", // 風笛
    'w-culture-23': "bullfighting|bullfight", // 鬥牛
    'w-culture-24': "ballet", // 芭蕾舞
    'w-culture-25': "carnival", // 嘉年華
    'w-culture-26': "hula|hula dance", // 草裙舞
    'w-culture-27': "street dance|breakdance|hip-hop dance", // 街舞
    'w-culture-28': "circus", // 馬戲團
    'w-culture-29': "clown", // 小丑
    'w-culture-30': "statue", // 雕像
    'w-culture-31': "oil painting", // 油畫
    'w-culture-32': "blue and white porcelain", // 青花瓷
    'w-culture-33': "taiko|taiko drum", // 太鼓
    'w-culture-34': "sedan chair|palanquin", // 轎子
    'w-culture-35': "oil-paper umbrella|paper umbrella", // 油紙傘
    'w-culture-36': "stone lion|guardian lion", // 石獅子
    'w-culture-37': "pagoda", // 寶塔
    'w-culture-38': "buddha statue|buddha", // 大佛
    'w-culture-39': "cross|crucifix", // 十字架
    'w-culture-40': "wedding", // 婚禮
    'w-culture-41': "yurt|ger", // 蒙古包
    'w-culture-42': "igloo", // 冰屋
    'w-culture-43': "treehouse|tree house", // 樹屋
    'w-culture-44': "seal|name seal|chop", // 印章
    'w-culture-45': "taiwanese opera", // 歌仔戲
    'w-culture-46': "crosstalk|crosstalk comedy", // 相聲
    'w-culture-47': "kendo", // 劍道
    'w-culture-48': "taekwondo", // 跆拳道
    'w-culture-49': "geisha", // 藝妓
    'w-culture-50': "daruma|daruma doll", // 達摩
    'w-culture-51': "omamori|japanese amulet", // 御守
    'w-culture-52': "tatami", // 榻榻米
    'w-culture-53': "hanbok", // 韓服
    'w-culture-54': "kilt", // 蘇格蘭裙
    'w-culture-55': "flamenco", // 佛朗明哥
    'w-culture-56': "tango", // 探戈
    'w-culture-57': "waltz dance|ballroom waltz", // 華爾滋
    'w-culture-58': "samba", // 森巴
    'w-culture-59': "belly dance", // 肚皮舞
    'w-culture-60': "tap dance", // 踢踏舞
    'w-culture-61': "opera", // 歌劇
    'w-culture-62': "musical|musical theater", // 音樂劇
    'w-culture-63': "mime|pantomime", // 默劇
    'w-culture-64': "puppet show|marionette show|marionette", // 木偶戲
    'w-culture-65': "acrobatics", // 雜技
    'w-culture-66': "printmaking|woodblock print", // 版畫
    'w-culture-67': "incense burner", // 香爐
    'w-culture-68': "temple fair", // 廟會
    'w-culture-69': "eight generals|ba jia jiang", // 八家將
    'w-culture-70': "deity palanquin|god's palanquin", // 神轎
    'w-culture-71': "bridal sedan chair|wedding sedan", // 花轎
    'w-culture-72': "fortune telling|fortune-telling", // 算命
    'w-culture-73': "fortune sticks|drawing lots", // 抽籤
    'w-culture-74': "bagua|eight trigrams", // 八卦
    'w-culture-75': "yin yang|yin and yang", // 陰陽
    'w-culture-76': "chinese zodiac|zodiac animals", // 十二生肖
    'w-culture-77': "door god", // 門神
    'w-culture-78': "memorial archway|paifang", // 牌坊
    'w-culture-79': "siheyuan|courtyard house", // 四合院
    'w-culture-80': "wooden fish", // 木魚
    'w-culture-81': "mosque", // 清真寺
    'w-culture-82': "water festival|songkran", // 潑水節
    'w-culture-83': "beer festival|oktoberfest", // 啤酒節
    'w-culture-84': "day of the dead", // 亡靈節
    'w-culture-85': "hieroglyphs|hieroglyphics|pictograph", // 象形文字
    'w-culture-86': "scroll", // 卷軸
    'w-culture-87': "guzheng|chinese zither", // 古箏
    'w-culture-88': "erhu", // 二胡
    'w-culture-89': "pipa", // 琵琶
    'w-history-72': "qu yuan", // 屈原
    'w-history-73': "xiang yu", // 項羽
    'w-history-74': "liu bang", // 劉邦
    'w-history-75': "han xin", // 韓信
    'w-history-76': "wang zhaojun", // 王昭君
    'w-history-77': "yang guifei|consort yang", // 楊貴妃
    'w-history-78': "diaochan|diao chan", // 貂蟬
    'w-history-79': "xi shi|xishi", // 西施
    'w-history-80': "emperor taizong of tang|tang taizong", // 唐太宗
    'w-history-81': "kangxi|kangxi emperor", // 康熙
    'w-history-82': "qianlong|qianlong emperor", // 乾隆
    'w-history-83': "empress dowager cixi|cixi", // 慈禧
    'w-history-84': "zhu yuanzhang|hongwu emperor", // 朱元璋
    'w-history-85': "kublai khan", // 忽必烈
    'w-history-86': "wen tianxiang", // 文天祥
    'w-history-87': "cai lun", // 蔡倫
    'w-history-88': "zhang heng", // 張衡
    'w-history-89': "hua tuo", // 華佗
    'w-history-90': "li shizhen", // 李時珍
    'w-history-91': "lu ban", // 魯班
    'w-history-92': "jing ke", // 荊軻
    'w-history-93': "su wu", // 蘇武
    'w-history-94': "tao yuanming", // 陶淵明
    'w-history-95': "bai juyi", // 白居易
    'w-history-96': "li qingzhao", // 李清照
    'w-history-97': "lin zexu", // 林則徐
    'w-history-98': "liu mingchuan", // 劉銘傳
    'w-history-99': "mackay|george mackay", // 馬偕
    'w-history-100': "hatta yoichi|yoichi hatta", // 八田與一
    'w-history-101': "mona rudao", // 莫那魯道
    'w-history-102': "alexander the great|alexander", // 亞歷山大
    'w-history-103': "julius caesar|caesar", // 凱撒
    'w-history-104': "cleopatra", // 埃及豔后
    'w-history-105': "tutankhamun|king tut", // 圖坦卡門
    'w-history-106': "socrates", // 蘇格拉底
    'w-history-107': "aristotle", // 亞里斯多德
    'w-history-108': "archimedes", // 阿基米德
    'w-history-109': "joan of arc", // 聖女貞德
    'w-history-110': "queen victoria", // 維多利亞女王
    'w-history-111': "louis xiv|louis the fourteenth|sun king", // 路易十四
    'w-history-112': "copernicus", // 哥白尼
    'w-history-113': "darwin|charles darwin", // 達爾文
    'w-history-114': "james watt|watt", // 瓦特
    'w-history-115': "nobel|alfred nobel", // 諾貝爾
    'w-history-116': "alexander graham bell|graham bell", // 貝爾
    'w-history-117': "nikola tesla|tesla", // 特斯拉
    'w-history-118': "pasteur|louis pasteur", // 巴斯德
    'w-history-119': "michelangelo", // 米開朗基羅
    'w-history-120': "monet|claude monet", // 莫內
    'w-history-121': "bach", // 巴哈
    'w-history-122': "chopin", // 蕭邦
    'w-history-123': "mark twain", // 馬克吐溫
    'w-history-124': "gandhi", // 甘地
    'w-history-125': "mandela|nelson mandela", // 曼德拉
    'w-history-126': "martin luther king|dr. king|martin luther king jr", // 金恩博士
    'w-history-127': "mother teresa", // 德蕾莎修女
    'w-history-128': "helen keller", // 海倫凱勒
    'w-history-129': "benjamin franklin|franklin", // 富蘭克林
    'w-history-130': "neil armstrong|armstrong", // 阿姆斯壯
    'w-history-131': "captain cook|james cook", // 庫克船長
    'w-history-132': "tokugawa ieyasu", // 德川家康
    'w-history-133': "oda nobunaga", // 織田信長
    'w-history-134': "renaissance", // 文藝復興
    'w-history-135': "industrial revolution", // 工業革命
    'w-history-136': "crusades|crusaders|crusader", // 十字軍
    'w-history-137': "black death|plague", // 黑死病
    'w-history-138': "age of discovery|age of exploration", // 大航海時代
    'w-history-139': "declaration of independence", // 獨立宣言
    'w-history-140': "american civil war|civil war", // 南北戰爭
    'w-history-141': "waterloo|battle of waterloo", // 滑鐵盧
    'w-history-142': "normandy landings|d-day", // 諾曼第登陸
    'w-history-143': "pearl harbor", // 珍珠港
    'w-history-144': "sparta|spartan", // 斯巴達
    'w-history-145': "viking", // 維京人
    'w-history-146': "roman empire", // 羅馬帝國
    'w-history-147': "maya civilization|mayan civilization|maya", // 馬雅文明
    'w-history-148': "inca empire|inca", // 印加帝國
    'w-history-149': "babylon", // 巴比倫
    'w-history-150': "hanging gardens|hanging gardens of babylon", // 空中花園
    'w-history-151': "atlantis", // 亞特蘭提斯
    'w-history-152': "battle of red cliffs|red cliff", // 赤壁之戰
    'w-history-153': "imperial examination", // 科舉
    'w-history-154': "top scholar|zhuangyuan", // 狀元
    'w-history-155': "ancient seismoscope|zhang heng seismoscope|seismoscope", // 地動儀
    'w-history-156': "armillary sphere", // 渾天儀
    'w-history-157': "sundial", // 日晷
    'w-history-158': "hourglass", // 沙漏
    'w-history-159': "bronzeware|bronze vessel", // 青銅器
    'w-history-160': "tang sancai|tang tricolor pottery", // 唐三彩
    'w-history-161': "along the river during the qingming festival|qingming scroll", // 清明上河圖
    'w-history-162': "mona lisa", // 蒙娜麗莎
    'w-history-163': "the thinker|thinker", // 沉思者
    'w-history-164': "statue of david|david statue", // 大衛像
    'w-history-165': "venus de milo|venus", // 維納斯
    'w-history-166': "parthenon", // 帕德嫩神廟
    'w-history-167': "palace of versailles|versailles", // 凡爾賽宮
    'w-history-168': "potala palace", // 布達拉宮
    'w-history-169': "temple of heaven", // 天壇
    'w-history-170': "moat", // 護城河
    'w-history-171': "drawbridge|suspension bridge", // 吊橋
    'w-history-172': "catapult|trebuchet", // 投石機
    'w-history-173': "bow and arrow", // 弓箭
    'w-history-174': "shield", // 盾牌
    'w-history-175': "armor|suit of armor", // 盔甲
    'w-history-176': "chariot|war chariot", // 戰車
    'w-history-177': "cannon", // 大砲
    'w-history-178': "telegraph", // 電報
    'w-history-179': "typewriter", // 打字機
    'w-history-180': "gramophone|phonograph", // 留聲機
    'w-history-181': "beacon tower", // 烽火台
    'w-geography-78': "north korea", // 北韓
    'w-geography-79': "laos", // 寮國
    'w-geography-80': "cambodia", // 柬埔寨
    'w-geography-81': "sri lanka", // 斯里蘭卡
    'w-geography-82': "bhutan", // 不丹
    'w-geography-83': "iran", // 伊朗
    'w-geography-84': "saudi arabia", // 沙烏地阿拉伯
    'w-geography-85': "ukraine", // 烏克蘭
    'w-geography-86': "hungary", // 匈牙利
    'w-geography-87': "belgium", // 比利時
    'w-geography-88': "vatican|vatican city", // 梵蒂岡
    'w-geography-89': "monaco", // 摩納哥
    'w-geography-90': "colombia", // 哥倫比亞
    'w-geography-91': "jamaica", // 牙買加
    'w-geography-92': "panama", // 巴拿馬
    'w-geography-93': "nigeria", // 奈及利亞
    'w-geography-94': "madagascar", // 馬達加斯加
    'w-geography-95': "fiji", // 斐濟
    'w-geography-96': "palau", // 帛琉
    'w-geography-97': "maldives", // 馬爾地夫
    'w-geography-98': "greenland", // 格陵蘭
    'w-geography-99': "hawaii", // 夏威夷
    'w-geography-100': "alaska", // 阿拉斯加
    'w-geography-101': "siberia", // 西伯利亞
    'w-geography-102': "tibet", // 西藏
    'w-geography-103': "bali", // 峇里島
    'w-geography-104': "okinawa", // 沖繩
    'w-geography-105': "hokkaido", // 北海道
    'w-geography-106': "jeju|jeju island", // 濟州島
    'w-geography-107': "guam", // 關島
    'w-geography-108': "tokyo", // 東京
    'w-geography-109': "kyoto", // 京都
    'w-geography-110': "osaka", // 大阪
    'w-geography-111': "seoul", // 首爾
    'w-geography-112': "beijing", // 北京
    'w-geography-113': "shanghai", // 上海
    'w-geography-114': "bangkok", // 曼谷
    'w-geography-115': "paris", // 巴黎
    'w-geography-116': "london", // 倫敦
    'w-geography-117': "rome", // 羅馬
    'w-geography-118': "venice", // 威尼斯
    'w-geography-119': "new york|new york city", // 紐約
    'w-geography-120': "los angeles", // 洛杉磯
    'w-geography-121': "san francisco", // 舊金山
    'w-geography-122': "las vegas", // 拉斯維加斯
    'w-geography-123': "sydney", // 雪梨
    'w-geography-124': "berlin", // 柏林
    'w-geography-125': "moscow", // 莫斯科
    'w-geography-126': "cairo", // 開羅
    'w-geography-127': "istanbul", // 伊斯坦堡
    'w-geography-128': "amsterdam", // 阿姆斯特丹
    'w-geography-129': "rio de janeiro|rio", // 里約熱內盧
    'w-geography-130': "golden gate bridge", // 金門大橋
    'w-geography-131': "tower bridge", // 倫敦塔橋
    'w-geography-132': "arc de triomphe|triumphal arch", // 凱旋門
    'w-geography-133': "louvre|louvre museum", // 羅浮宮
    'w-geography-134': "notre-dame|notre dame cathedral", // 聖母院
    'w-geography-135': "neuschwanstein castle|neuschwanstein", // 新天鵝堡
    'w-geography-136': "merlion", // 魚尾獅
    'w-geography-137': "petronas towers|petronas twin towers", // 雙子星塔
    'w-geography-138': "tokyo tower", // 東京鐵塔
    'w-geography-139': "kiyomizu temple|kiyomizu-dera", // 清水寺
    'w-geography-140': "golden pavilion|kinkaku-ji", // 金閣寺
    'w-geography-141': "tiananmen|tiananmen gate", // 天安門
    'w-geography-142': "oriental pearl tower", // 東方明珠
    'w-geography-143': "grand palace", // 大皇宮
    'w-geography-144': "ha long bay|halong bay", // 下龍灣
    'w-geography-145': "petra", // 佩特拉
    'w-geography-146': "jerusalem", // 耶路撒冷
    'w-geography-147': "mecca", // 麥加
    'w-geography-148': "christ the redeemer", // 救世基督像
    'w-geography-149': "iguazu falls", // 伊瓜蘇瀑布
    'w-geography-150': "yellowstone|yellowstone national park", // 黃石公園
    'w-geography-151': "hollywood", // 好萊塢
    'w-geography-152': "times square", // 時代廣場
    'w-geography-153': "empire state building", // 帝國大廈
    'w-geography-154': "mount rushmore", // 總統山
    'w-geography-155': "uluru|ayers rock", // 烏魯魯
    'w-geography-156': "alps|the alps", // 阿爾卑斯山
    'w-geography-157': "rocky mountains|rockies", // 洛磯山脈
    'w-geography-158': "mount vesuvius|vesuvius", // 維蘇威火山
    'w-geography-159': "kilimanjaro|mount kilimanjaro", // 吉力馬札羅山
    'w-geography-160': "pacific ocean|pacific", // 太平洋
    'w-geography-161': "atlantic ocean|atlantic", // 大西洋
    'w-geography-162': "indian ocean", // 印度洋
    'w-geography-163': "arctic ocean", // 北冰洋
    'w-geography-164': "asia", // 亞洲
    'w-geography-165': "europe", // 歐洲
    'w-geography-166': "africa", // 非洲
    'w-geography-167': "north america", // 北美洲
    'w-geography-168': "south america", // 南美洲
    'w-geography-169': "oceania", // 大洋洲
    'w-geography-170': "red sea", // 紅海
    'w-geography-171': "black sea", // 黑海
    'w-geography-172': "caribbean sea|caribbean", // 加勒比海
    'w-geography-173': "persian gulf", // 波斯灣
    'w-geography-174': "taiwan strait", // 台灣海峽
    'w-geography-175': "panama canal", // 巴拿馬運河
    'w-geography-176': "suez canal", // 蘇伊士運河
    'w-geography-177': "bermuda triangle", // 百慕達三角
    'w-geography-178': "mariana trench", // 馬里亞納海溝
    'w-geography-179': "galapagos islands|galapagos", // 加拉巴哥群島
    'w-geography-180': "sicily", // 西西里島
    'w-geography-181': "gobi desert|gobi", // 戈壁沙漠
    'w-geography-182': "danube|danube river", // 多瑙河
    'w-geography-183': "rhine|rhine river", // 萊茵河
    'w-geography-184': "thames|river thames", // 泰晤士河
    'w-geography-185': "seine|seine river", // 塞納河
    'w-geography-186': "ganges|ganges river", // 恆河
    'w-geography-187': "mekong|mekong river", // 湄公河
    'w-trend-45': "generative ai", // 生成式AI
    'w-trend-46': "humanoid robot", // 人形機器人
    'w-trend-47': "deepfake", // 深偽
    'w-trend-48': "net zero|carbon neutral|net zero emissions", // 淨零排放
    'w-trend-49': "extreme weather|extreme climate", // 極端氣候
    'w-trend-50': "semiconductor", // 半導體
    'w-trend-51': "low earth orbit satellite|leo satellite", // 低軌衛星
    'w-trend-52': "fake news", // 假新聞
    'w-trend-53': "meme", // 迷因
    'w-trend-54': "emoji", // 表情符號
    'w-trend-55': "unboxing", // 開箱
    'w-trend-56': "group buying|group buy", // 團購
    'w-trend-57': "subscription", // 訂閱
    'w-trend-58': "cloud storage|the cloud|cloud computing", // 雲端
    'w-trend-59': "big data", // 大數據
    'w-trend-60': "algorithm", // 演算法
    'w-trend-61': "check-in|checking in", // 打卡
    'w-trend-62': "social media story|instagram story|stories", // 限時動態
    'w-trend-63': "podcast", // 播客
    'w-trend-64': "audiobook", // 有聲書
    'w-trend-65': "pop-up store|pop-up shop", // 快閃店
    'w-trend-66': "unmanned store|cashierless store", // 無人商店
    'w-trend-67': "self-checkout", // 自助結帳
    'w-trend-68': "qr code ordering|scan to order", // 掃碼點餐
    'w-trend-69': "food delivery app|delivery platform", // 外送平台
    'w-trend-70': "scooter sharing|shared scooter", // 共享機車
    'w-trend-71': "plastic reduction|reducing plastic", // 減塑
    'w-trend-72': "beach cleanup", // 淨灘
    'w-trend-73': "food waste|leftover food", // 剩食
    'w-trend-74': "plant-based meat", // 植物肉
    'w-trend-75': "delivery robot|food delivery robot", // 送餐機器人
    'w-trend-76': "robotaxi|driverless taxi", // 無人計程車
    'w-trend-77': "mars colonization|mars colony", // 火星移民
    'w-trend-78': "instagram wall|selfie wall", // 網美牆
    'w-trend-79': "blind box|mystery box", // 盲盒
    'w-trend-80': "hand-shaken drink|handmade drink", // 手搖飲
    'w-trend-81': "lying flat", // 躺平
    'w-trend-82': "fur baby|fur kid", // 毛小孩
    'w-trend-83': "low birth rate|declining birthrate", // 少子化
    'w-trend-84': "aging society|aging population", // 高齡化
    'w-trend-85': "inflation", // 通膨
    'w-trend-86': "price hike|price increase", // 漲價
    'w-trend-87': "typhoon day off|typhoon holiday", // 颱風假
    'w-trend-88': "emergency alert|national alert", // 國家警報
    'w-trend-89': "blackout|power outage", // 停電
    'w-trend-90': "wildfire|forest fire", // 野火
    'w-trend-91': "world baseball classic|wbc", // 經典賽
    'w-trend-92': "cheerleader|cheerleading", // 啦啦隊
    'w-trend-93': "light stick|glow stick", // 應援棒
    'w-trend-94': "ticket scalper|scalper", // 黃牛
    'w-animal-110': "pigeon|dove", // 鴿子
    'w-animal-111': "crow|raven", // 烏鴉
    'w-animal-112': "sparrow", // 麻雀
    'w-animal-113': "grasshopper", // 蚱蜢
    'w-animal-114': "scarab beetle|beetle", // 金龜子
    'w-animal-115': "silkworm", // 蠶寶寶
    'w-animal-116': "hummingbird", // 蜂鳥
    'w-animal-117': "guinea pig", // 天竺鼠
    'w-animal-118': "shiba inu|shiba", // 柴犬
    'w-animal-119': "poodle", // 貴賓狗
    'w-animal-120': "dachshund|sausage dog", // 臘腸狗
    'w-animal-121': "husky", // 哈士奇
    'w-animal-122': "pelican", // 鵜鶘
    'w-animal-123': "meerkat", // 狐獴
    'w-animal-124': "capybara", // 水豚
    'w-animal-125': "platypus", // 鴨嘴獸
    'w-animal-126': "toucan", // 巨嘴鳥
    'w-animal-127': "egret|white egret", // 白鷺鷥
    'w-animal-128': "magpie", // 喜鵲
    'w-animal-129': "stag beetle", // 鍬形蟲
    'w-animal-130': "golden retriever", // 黃金獵犬
    'w-animal-131': "stick insect|walking stick", // 竹節蟲
    'w-animal-132': "mikado pheasant", // 帝雉
    'w-animal-133': "taiwan blue magpie|blue magpie", // 藍鵲
    'w-animal-134': "leopard cat", // 石虎
    'w-animal-135': "formosan black bear|black bear", // 黑熊
    'w-animal-136': "muntjac|barking deer", // 山羌
    'w-animal-137': "clouded leopard", // 雲豹
    'w-animal-138': "komodo dragon", // 科摩多龍
    'w-animal-139': "tasmanian devil", // 袋獾
    'w-food-166': "cucumber", // 小黃瓜
    'w-food-167': "leafy greens|greens|vegetables", // 青菜
    'w-food-168': "enoki|enoki mushroom", // 金針菇
    'w-food-169': "pea|green peas", // 豌豆
    'w-food-170': "dragon fruit|pitaya", // 火龍果
    'w-food-171': "lychee|litchi", // 荔枝
    'w-food-172': "hot chocolate|hot cocoa", // 熱可可
    'w-food-173': "egg roll cookie|egg roll", // 蛋捲
    'w-food-174': "durian", // 榴槤
    'w-food-175': "sugar apple|custard apple", // 釋迦
    'w-food-176': "longan", // 龍眼
    'w-food-177': "passion fruit", // 百香果
    'w-food-178': "avocado", // 酪梨
    'w-food-179': "pomegranate", // 石榴
    'w-food-180': "loofah|luffa", // 絲瓜
    'w-food-181': "bitter melon|bitter gourd", // 苦瓜
    'w-food-182': "lotus root", // 蓮藕
    'w-food-183': "taro", // 芋頭
    'w-food-184': "asparagus", // 蘆筍
    'w-food-185': "spinach", // 菠菜
    'w-food-186': "ginger", // 薑
    'w-food-187': "onion rings", // 洋蔥圈
    'w-food-188': "chicken nuggets|nuggets", // 雞塊
    'w-food-189': "tianbula|taiwanese fish cake", // 甜不辣
    'w-food-190': "tea egg", // 茶葉蛋
    'w-food-191': "century egg|preserved egg", // 皮蛋
    'w-food-192': "brownie", // 布朗尼
    'w-food-193': "candied hawthorn|tanghulu", // 糖葫蘆
    'w-food-194': "chewing gum|gum|bubble gum", // 口香糖
    'w-food-195': "gummy candy|gummy|gummies", // 軟糖
    'w-food-196': "mangosteen", // 山竹
    'w-food-197': "hot and sour soup", // 酸辣湯
    'w-food-198': "egg yolk pastry", // 蛋黃酥
    'w-food-199': "suncake|sun cake", // 太陽餅
    'w-food-200': "sweet potato balls", // 地瓜球
    'w-food-201': "dragon's beard candy", // 龍鬚糖
    'w-food-202': "buddha jumps over the wall", // 佛跳牆
    'w-food-203': "peking duck|roast duck", // 烤鴨
    'w-food-204': "mapo tofu", // 麻婆豆腐
    'w-food-205': "kung pao chicken", // 宮保雞丁
    'w-home-146': "toilet", // 馬桶
    'w-home-147': "bathtub", // 浴缸
    'w-home-148': "door", // 門
    'w-home-149': "curtain", // 窗簾
    'w-home-150': "baby bottle|feeding bottle", // 奶瓶
    'w-home-151': "drinking straw|straw", // 吸管
    'w-home-152': "shoe cabinet|shoe rack", // 鞋櫃
    'w-home-153': "shower head|showerhead", // 蓮蓬頭
    'w-home-154': "sink|washbasin", // 洗手台
    'w-home-155': "toilet brush", // 馬桶刷
    'w-home-156': "mosquito net", // 蚊帳
    'w-home-157': "cradle", // 搖籃
    'w-home-158': "crib|baby crib", // 嬰兒床
    'w-home-159': "piggy bank", // 存錢筒
    'w-home-160': "fish tank|fishbowl", // 魚缸
    'w-home-161': "birdcage|bird cage", // 鳥籠
    'w-home-162': "sewing machine", // 縫紉機
    'w-home-163': "fireplace", // 壁爐
    'w-home-164': "chandelier", // 吊燈
    'w-home-165': "folding screen|room divider", // 屏風
    'w-vehicle-55': "shopping cart|shopping trolley", // 購物車
    'w-vehicle-56': "sports car", // 跑車
    'w-vehicle-57': "kick scooter|scooter", // 滑板車
    'w-vehicle-58': "pedal boat|swan boat", // 腳踏船
    'w-vehicle-59': "light rail|tram|streetcar", // 輕軌
    'w-vehicle-60': "tuk-tuk|tuk tuk|auto rickshaw", // 嘟嘟車
    'w-vehicle-61': "rickshaw", // 人力車
    'w-vehicle-62': "ox cart|oxcart", // 牛車
    'w-vehicle-63': "tank", // 坦克
    'w-vehicle-64': "forklift", // 堆高機
    'w-vehicle-65': "fighter jet|fighter plane", // 戰鬥機
    'w-vehicle-66': "gondola", // 貢多拉
    'w-vehicle-67': "container ship|cargo ship", // 貨櫃船
    'w-vehicle-68': "aircraft carrier", // 航空母艦
    'w-vehicle-69': "road roller|steamroller", // 壓路機
    'w-nature-76': "bird nest|nest", // 鳥巢
    'w-nature-77': "beehive|honeycomb|hive", // 蜂窩
    'w-nature-78': "spider web|cobweb", // 蜘蛛網
    'w-nature-79': "tree hollow|tree hole", // 樹洞
    'w-nature-80': "anthill|ant nest", // 螞蟻窩
    'w-nature-81': "log|wood", // 木頭
    'w-nature-82': "tree stump|stump", // 樹樁
    'w-nature-83': "flower field|sea of flowers", // 花海
    'w-nature-84': "rice terrace|terraced field", // 梯田
    'w-nature-85': "tea plantation|tea garden", // 茶園
    'w-nature-86': "mud", // 泥巴
    'w-nature-87': "water plants|aquatic plants|waterweed", // 水草
    'w-nature-88': "wetland", // 濕地
    'w-nature-89': "river valley", // 河谷
    'w-nature-90': "mountaintop|summit|peak", // 山頂
    'w-fun-83': "tug of war", // 拔河
    'w-fun-84': "running race|race|footrace", // 賽跑
    'w-fun-85': "rock paper scissors", // 猜拳
    'w-fun-86': "rock climbing|climbing wall", // 攀岩
    'w-fun-87': "high diving|platform diving|springboard diving", // 跳水
    'w-fun-88': "water slide|waterslide", // 滑水道
    'w-fun-89': "go-kart|go kart", // 卡丁車
    'w-fun-90': "balloon darts|balloon pop game", // 射氣球
    'w-fun-91': "goldfish scooping", // 撈金魚
    'w-fun-92': "marathon", // 馬拉松
    'w-fun-93': "hurdles|hurdling", // 跨欄
    'w-fun-94': "rugby|american football", // 橄欖球
    'w-fun-95': "curling", // 冰壺
    'w-fun-96': "triathlon", // 鐵人三項
    'w-fun-97': "ice hockey|hockey", // 冰球
    'w-place-79': "restroom|washroom|public toilet", // 廁所
    'w-place-80': "garage", // 車庫
    'w-place-81': "kindergarten|preschool", // 幼兒園
    'w-place-82': "log cabin|cabin", // 小木屋
    'w-place-83': "bowling alley", // 保齡球館
    'w-place-84': "baseball field|ballpark|baseball stadium", // 棒球場
    'w-place-85': "basketball court", // 籃球場
    'w-place-86': "animal hospital|vet clinic", // 動物醫院
    'w-place-87': "factory", // 工廠
    'w-place-88': "warehouse", // 倉庫
    'w-place-89': "office", // 辦公室
    'w-place-90': "laboratory|lab", // 實驗室
    'w-place-91': "theater|theatre", // 劇院
    'w-place-92': "botanical garden", // 植物園
    'w-place-93': "hotel|inn", // 旅館
    'w-place-94': "basement", // 地下室
    'w-place-95': "attic", // 閣樓
    'w-place-96': "planetarium", // 天文館
    'w-place-97': "film studio|studio", // 攝影棚
    'w-place-98': "landfill|garbage dump", // 垃圾場
    'w-job-78': "accountant", // 會計師
    'w-job-79': "detective", // 偵探
    'w-job-80': "spy", // 間諜
    'w-job-81': "animal trainer|lion tamer", // 馴獸師
    'w-job-82': "zookeeper", // 飼育員
    'w-job-83': "weather forecaster|weatherman", // 氣象主播
    'w-job-84': "makeup artist", // 化妝師
    'w-job-85': "tailor|seamstress", // 裁縫師
    'w-job-86': "blacksmith", // 鐵匠
    'w-job-87': "miner", // 礦工
    'w-job-88': "lumberjack", // 伐木工
    'w-job-89': "train conductor", // 列車長
    'w-job-90': "soldier", // 軍人
    'w-job-91': "race car driver|racer", // 賽車手
    'w-job-92': "prosecutor", // 檢察官
    'w-job-93': "voice actor", // 配音員
    'w-job-94': "locksmith", // 鎖匠
    'w-job-95': "diplomat", // 外交官
    'w-job-96': "jockey", // 騎師
    'w-job-97': "nutritionist|dietitian", // 營養師
    'w-action-89': "putting on shoes|put on shoes", // 穿鞋子
    'w-action-90': "washing face|wash face", // 洗臉
    'w-action-91': "combing hair|brushing hair", // 梳頭髮
    'w-action-92': "getting dressed|get dressed", // 穿衣服
    'w-action-93': "opening a door|open the door", // 開門
    'w-action-94': "taking out the trash|take out the garbage", // 倒垃圾
    'w-action-95': "making dumplings|wrapping dumplings", // 包水餃
    'w-action-96': "raising hand|raise your hand", // 舉手
    'w-action-97': "bowing|bow", // 鞠躬
    'w-action-98': "wiping the table|wipe the table", // 擦桌子
    'w-action-99': "making the bed|make the bed", // 鋪床
    'w-action-100': "handstand", // 倒立
    'w-action-101': "somersault|cartwheel", // 翻跟斗
    'w-action-102': "scrolling on phone|using a phone", // 滑手機
    'w-action-103': "selfie|taking a selfie", // 自拍
    'w-action-104': "tying shoelaces|tie shoelaces", // 綁鞋帶
    'w-action-105': "holding an umbrella", // 撐傘
    'w-action-106': "sit-ups|sit-up", // 仰臥起坐
    'w-action-107': "push-ups|push-up", // 伏地挺身
    'w-action-108': "flower arranging|ikebana", // 插花
    'w-fantasy-75': "potion|magic potion", // 藥水
    'w-fantasy-76': "wizard hat|witch hat", // 魔法帽
    'w-fantasy-77': "skeleton", // 骷髏
    'w-fantasy-78': "slime", // 史萊姆
    'w-fantasy-79': "sword|magic sword", // 寶劍
    'w-fantasy-80': "demon king|demon lord", // 魔王
    'w-fantasy-81': "goblin", // 哥布林
    'w-fantasy-82': "magic circle", // 魔法陣
    'w-fantasy-83': "dungeon", // 地下城
    'w-fantasy-84': "golden cudgel|monkey king's staff", // 金箍棒
    'w-festival-36': "santa hat|christmas hat", // 聖誕帽
    'w-festival-37': "gingerbread house", // 薑餅屋
    'w-festival-38': "candy cane", // 拐杖糖
    'w-festival-39': "party hat|birthday hat", // 生日帽
    'w-festival-40': "party", // 派對
    'w-festival-41': "party popper", // 拉炮
    'w-festival-42': "gift exchange|secret santa", // 交換禮物
    'w-festival-43': "fragrant sachet|sachet", // 香包
    'w-festival-44': "egg balancing|standing an egg", // 立蛋
    'w-festival-45': "pomelo hat", // 柚子帽
    'w-taiwan-12': "blue and white slippers|blue and white flip-flops", // 藍白拖
    'w-taiwan-13': "railway bento|train lunch box", // 鐵路便當
    'w-taiwan-14': "easycard", // 悠遊卡
    'w-taiwan-15': "roadside banquet|bando", // 辦桌
    'w-taiwan-16': "sanheyuan|three-sided courtyard house", // 三合院
    'w-taiwan-17': "arcade walkway|covered walkway", // 騎樓
    'w-taiwan-18': "street vendor|vendor stall", // 攤販
    'w-taiwan-19': "jiufen", // 九份
    'w-taiwan-20': "tamsui", // 淡水
    'w-taiwan-21': "yehliu", // 野柳
    'w-taiwan-22': "queen's head|queen's head rock", // 女王頭
    'w-taiwan-23': "longshan temple", // 龍山寺
    'w-taiwan-24': "ximending", // 西門町
    'w-taiwan-25': "national palace museum", // 故宮博物院
    'w-taiwan-26': "hehuanshan|mount hehuan", // 合歡山
    'w-taiwan-27': "cingjing farm", // 清境農場
    'w-taiwan-28': "eluanbi|eluanbi lighthouse", // 鵝鑾鼻
    'w-taiwan-29': "turtle island|guishan island", // 龜山島
    'w-taiwan-30': "green island", // 綠島
    'w-taiwan-31': "xiaoliuqiu|little liuqiu", // 小琉球
    'w-taiwan-32': "kinmen", // 金門
    'w-taiwan-33': "matsu islands|matsu", // 馬祖
    'w-taiwan-34': "wind lion god", // 風獅爺
    'w-taiwan-35': "chihkan tower", // 赤崁樓
    'w-taiwan-36': "anping fort|fort zeelandia", // 安平古堡
    'w-taiwan-37': "fort san domingo", // 紅毛城
    'w-taiwan-38': "chiang kai-shek memorial hall", // 中正紀念堂
    'w-taiwan-39': "jadeite cabbage", // 翠玉白菜
    'w-taiwan-40': "rainbow village", // 彩虹村
    'w-taiwan-41': "black-faced spoonbill", // 黑面琵鷺
    'w-clothes-46': "cape|cloak", // 披風
    'w-clothes-47': "bow tie", // 領結
    'w-clothes-48': "overalls|dungarees", // 吊帶褲
    'w-clothes-49': "bathrobe", // 浴袍
    'w-clothes-50': "sandals", // 涼鞋
    'w-sport-0': "working out|fitness", // 健身
    'w-sport-1': "champion", // 冠軍
    'w-sport-2': "gold medal", // 金牌
    'w-sport-3': "jersey", // 球衣
    'w-sport-4': "helmet", // 頭盔
    'w-sport-5': "softball", // 壘球
    'w-sport-6': "pitch|throwing a ball", // 投球
    'w-sport-7': "pass|passing the ball", // 傳球
    'w-sport-8': "dribble|dribbling", // 運球
    'w-sport-9': "slam dunk|dunk", // 灌籃
    'w-sport-10': "serve|serving", // 發球
    'w-sport-11': "spike", // 扣球
    'w-sport-12': "track and field|athletics", // 田徑
    'w-sport-13': "horse racing", // 賽馬
    'w-sport-14': "squat", // 深蹲
    'w-sport-15': "backstroke swimming|back crawl", // 仰泳
    'w-sport-16': "medal", // 獎牌
    'w-sport-17': "bat|baseball bat", // 球棒
    'w-sport-18': "sportswear|tracksuit", // 運動服
    'w-sport-19': "red card", // 紅牌
    'w-sport-20': "yellow card", // 黃牌
    'w-sport-21': "corner kick", // 角球
    'w-sport-22': "basketball net|hoop net", // 籃網
    'w-sport-23': "swing a bat|batting", // 揮棒
    'w-sport-24': "butterfly stroke", // 蝶式
    'w-sport-25': "backstroke", // 仰式
    'w-sport-26': "freestyle", // 自由式
    'w-sport-27': "long distance running", // 長跑
    'w-sport-28': "sprint", // 短跑
    'w-sport-29': "relay race|relay", // 接力賽
    'w-sport-30': "race walking", // 競走
    'w-sport-31': "equestrian", // 馬術
    'w-sport-32': "water polo", // 水球
    'w-sport-33': "handball", // 手球
    'w-sport-34': "field hockey|hockey", // 曲棍球
    'w-sport-35': "squash", // 壁球
    'w-sport-36': "boxing", // 拳擊
    'w-sport-37': "wrestling", // 摔角
    'w-sport-38': "shooting", // 射擊
    'w-sport-39': "starting line", // 起跑線
    'w-sport-40': "finish line", // 終點線
    'w-sport-41': "ice skates", // 冰刀
    'w-sport-42': "snorkeling", // 浮潛
    'w-sport-43': "goalkeeper|goalie", // 守門員
    'w-sport-44': "free throw|penalty kick", // 罰球
    'w-sport-45': "block|blocking", // 攔網
    'w-sport-46': "podium", // 領獎台
    'w-sport-47': "wristband|wrist guard", // 護腕
    'w-sport-48': "elbow pad", // 護肘
    'w-sport-49': "barbell", // 槓鈴
    'w-sport-50': "offside", // 越位
    'w-sport-51': "header", // 頭球
    'w-sport-52': "penalty kick|penalty shot", // 點球
    'w-sport-53': "ski pole", // 雪杖
    'w-sport-54': "ski goggles", // 滑雪鏡
    'w-sport-55': "boxing ring", // 拳擊台
    'w-sport-56': "punching bag|sandbag", // 沙袋
    'w-sport-57': "mouthguard|mouth guard", // 護齒
    'w-sport-58': "yoga mat", // 瑜伽墊
    'w-sport-59': "resistance band", // 彈力帶
    'w-sport-60': "pommel horse", // 鞍馬
    'w-sport-61': "still rings|rings", // 吊環
    'w-sport-62': "balance beam", // 平衡木
    'w-sport-63': "vault", // 跳馬
    'w-sport-64': "triple jump", // 三級跳
    'w-sport-65': "obstacle race|steeplechase", // 障礙賽
    'w-sport-66': "synchronized swimming", // 水上芭蕾
    'w-sport-67': "paragliding", // 滑翔傘
    'w-sport-68': "cross country skiing", // 越野滑雪
    'w-sport-69': "bungee jumping|bungee", // 高空彈跳
    'w-sport-70': "discus", // 鐵餅
    'w-hobby-0': "photography", // 攝影
    'w-hobby-1': "reading", // 閱讀
    'w-hobby-2': "cooking", // 烹飪
    'w-hobby-3': "gardening", // 園藝
    'w-hobby-4': "knitting|weaving", // 編織
    'w-hobby-5': "stamp collecting", // 集郵
    'w-hobby-6': "baking", // 烘焙
    'w-hobby-7': "traveling|travel", // 旅行
    'w-hobby-8': "riding a bike", // 騎車
    'w-hobby-9': "keeping a cat|having a cat", // 養貓
    'w-hobby-10': "keeping a dog|having a dog", // 養狗
    'w-hobby-11': "keeping a bird|keeping birds", // 養鳥
    'w-hobby-12': "looking at the sea|watching the sea", // 看海
    'w-hobby-13': "stargazing|looking at stars", // 看星星
    'w-hobby-14': "writing a letter|write a letter", // 寫信
    'w-hobby-15': "telling a joke|tell a joke", // 講笑話
    'w-hobby-16': "making bread|bread making", // 做麵包
    'w-hobby-17': "playing with clay|clay modeling", // 玩黏土
    'w-hobby-18': "making a kite", // 做風箏
    'w-hobby-19': "making a video|filming a video", // 拍影片
    'w-hobby-20': "doing magic|magic trick", // 變魔術
    'w-hobby-21': "watching clouds|cloud gazing", // 看雲
    'w-hobby-22': "sewing", // 縫紉
    'w-hobby-23': "embroidery", // 刺繡
    'w-hobby-24': "cross stitch", // 十字繡
    'w-hobby-25': "pottery", // 陶藝
    'w-hobby-26': "woodworking|carpentry", // 木工
    'w-hobby-27': "carving|sculpting", // 雕刻
    'w-hobby-28': "handmade soap", // 手工皂
    'w-hobby-29': "beading|beads", // 串珠
    'w-hobby-30': "patchwork|quilting", // 拼布
    'w-hobby-31': "stargazing", // 觀星
    'w-hobby-32': "birdwatching|bird watching", // 賞鳥
    'w-hobby-33': "mountaineering", // 登山
    'w-hobby-34': "river tracing|stream hiking", // 溯溪
    'w-hobby-35': "painting|face painting", // 彩繪
    'w-hobby-36': "graffiti|doodle", // 塗鴉
    'w-hobby-37': "filming|video recording", // 錄影
    'w-hobby-38': "building models|model kit", // 組模型
    'w-hobby-39': "collecting", // 收藏
    'w-hobby-40': "collecting cards|card collecting", // 集卡
    'w-hobby-41': "collecting seashells|seashell hunting", // 撿貝殼
    'w-hobby-42': "keeping fish", // 養魚
    'w-hobby-43': "tea tasting", // 品茶
    'w-hobby-44': "knitting wool", // 打毛線
    'w-hobby-45': "collage", // 拼貼
    'w-hobby-46': "picture book", // 繪本
    'w-hobby-47': "knitting a scarf", // 織圍巾
    'w-hobby-48': "latte art", // 咖啡拉花
    'w-hobby-49': "wool felt|felting", // 羊毛氈
    'w-hobby-50': "wood carving", // 木雕
    'w-hobby-51': "sketching|sketch", // 速寫
    'w-hobby-52': "dried flowers", // 乾燥花
    'w-hobby-53': "crochet", // 鉤針
    'w-hobby-54': "leather carving|leathercraft", // 皮雕
    'w-hobby-55': "seal carving", // 篆刻
    'w-hobby-56': "batik", // 蠟染
    'w-hobby-57': "sand painting|sand art", // 沙畫
    'w-hobby-58': "paper sculpture|paper carving", // 紙雕
    'w-hobby-59': "pop up book", // 立體書
    'w-hobby-60': "rubbing|stone rubbing", // 拓印
    'w-hobby-61': "glassblowing", // 吹玻璃
    'w-hobby-62': "egg carving|egg shell carving", // 蛋雕
    'w-hobby-63': "flower pressing|pressed flowers", // 壓花
    'w-toy-40': "ball|rubber ball", // 皮球
    'w-toy-41': "rattle", // 搖鈴
    'w-toy-42': "toy bear", // 玩具熊
    'w-toy-43': "sand bucket|beach pail", // 沙桶
    'w-toy-44': "rubber duck", // 橡皮鴨
    'w-toy-45': "hopscotch", // 跳房子
    'w-toy-46': "puppet|marionette", // 木偶
    'w-toy-47': "toy drum", // 玩具鼓
    'w-toy-48': "toy house|dollhouse", // 玩具屋
    'w-toy-49': "toy box", // 玩具箱
    'w-toy-50': "figurine|action figure", // 公仔
    'w-toy-51': "rubber band", // 橡皮筋
    'w-toy-52': "magnetic tiles", // 磁力片
    'w-toy-53': "toy train track|track car", // 軌道車
    'w-toy-54': "3d puzzle", // 立體拼圖
    'w-toy-55': "speaking tube|tin can phone", // 傳聲筒
    'w-toy-56': "paper cup phone|cup phone", // 紙杯電話
    'w-toy-57': "slinky|coil spring toy", // 彈簧圈
    'w-toy-58': "peekaboo", // 躲貓貓
    'w-toy-59': "shadow tag|step on shadows", // 踩影子
    'w-toy-60': "tag|playing tag", // 鬼抓人
    'w-toy-61': "snakes and ladders", // 蛇棋
    'w-toy-62': "ludo", // 飛行棋
    'w-toy-63': "gomoku|five in a row", // 五子棋
    'w-toy-64': "sand sculpture|sand castle", // 沙雕
    'w-toy-65': "hoop rolling|rolling a hoop", // 滾鐵環
    'w-toy-66': "spirograph", // 萬花尺
    'w-toy-67': "wind up frog", // 發條青蛙
    'w-toy-68': "marble maze", // 彈珠迷宮
    'w-toy-69': "spinning top|spin a top", // 打陀螺
    'w-fun-98': "playing video games|video games", // 打電動
    'w-fun-99': "playing in the sand|play with sand", // 玩沙
    'w-fun-100': "playing in water|water play", // 玩水
    'w-fun-101': "snowball fight", // 打雪仗
    'w-fun-102': "playing ball|play ball", // 打球
    'w-fun-103': "roller blading|rollerblading", // 溜直排輪
    'w-fun-104': "digging sand|dig in the sand", // 挖沙
    'w-fun-105': "catching fish|fish catching", // 抓魚
    'w-fun-106': "riding a rocking horse|rocking horse ride", // 騎木馬
    'w-fun-107': "playing on the slide|going down a slide", // 玩滑梯
    'w-fun-108': "sparkler", // 仙女棒
    'w-fun-109': "watching the sunrise|sunrise watching", // 看日出
    'w-fun-110': "watching the sunset|sunset watching", // 看夕陽
    'w-fun-111': "outing|field trip", // 郊遊
    'w-fun-112': "spring outing|nature walk", // 踏青
    'w-fun-113': "water park", // 水上樂園
    'w-fun-114': "hot spring bath|hot spring", // 泡溫泉
    'w-fun-115': "flower viewing|flower watching", // 賞花
    'w-fun-116': "cherry blossom viewing", // 賞櫻
    'w-fun-117': "shrimp fishing", // 釣蝦
    'w-fun-118': "roasting marshmallows|roast marshmallows", // 烤棉花糖
    'w-fun-119': "pitching a tent|set up a tent", // 搭帳篷
    'w-fun-120': "water fight", // 打水仗
    'w-fun-121': "rafting", // 泛舟
    'w-fun-122': "grass skiing|grass sledding", // 滑草
    'w-fun-123': "beach volleyball", // 沙灘排球
    'w-fun-124': "watching fireworks|fireworks show", // 看煙火
    'w-fun-125': "parade", // 遊行
    'w-fun-126': "magic show", // 魔術表演
    'w-fun-127': "juggling", // 雜耍
    'w-fun-128': "tightrope walking|tightrope", // 走鋼索
    'w-fun-129': "wave pool", // 造浪池
    'w-fun-130': "lazy river", // 漂漂河
    'w-fun-131': "light show", // 燈光秀
    'w-fun-132': "zip line|zipline", // 溜索
    'w-fun-133': "trapeze|flying trapeze", // 空中飛人
    'w-fun-134': "white water rafting|drifting", // 漂流
    'w-fun-135': "beach buggy|dune buggy", // 沙灘車
    'w-fun-136': "sled dog", // 雪橇犬
    'w-fun-137': "water dance show|fountain show", // 水舞
    'w-music-55': "piano keys|keys", // 琴鍵
    'w-music-56': "flute|bamboo flute", // 笛子
    'w-music-57': "snare drum|small drum", // 小鼓
    'w-music-58': "bass drum", // 大鼓
    'w-music-59': "cymbals|cymbal", // 銅鈸
    'w-music-60': "lyrics", // 歌詞
    'w-music-61': "stage", // 舞台
    'w-music-62': "recorder", // 直笛
    'w-music-63': "bow|violin bow", // 琴弓
    'w-music-64': "musical instrument|instrument", // 樂器
    'w-music-65': "whistle|whistling", // 口哨
    'w-music-66': "gong", // 鑼
    'w-music-67': "suona", // 嗩吶
    'w-music-68': "ukulele", // 烏克麗麗
    'w-music-69': "ocarina", // 陶笛
    'w-music-70': "melodica", // 口風琴
    'w-music-71': "pipe organ|organ", // 管風琴
    'w-music-72': "folk song|folk music", // 民謠
    'w-music-73': "hip hop", // 嘻哈
    'w-music-74': "loudspeaker|megaphone", // 擴音器
    'w-music-75': "timpani|kettle drum", // 定音鼓
    'w-music-76': "trombone", // 長號
    'w-music-77': "piccolo", // 短笛
    'w-music-78': "acoustic guitar", // 木吉他
    'w-music-79': "djembe|african drum", // 非洲鼓
    'w-music-80': "yangqin|hammered dulcimer", // 揚琴
    'w-music-81': "panpipes|pan flute", // 排簫
    'w-music-82': "celesta", // 鋼片琴
    'w-music-83': "heavy metal", // 重金屬
    'w-music-84': "flat sign|flat symbol", // 降記號
    'w-festival-46': "flower lantern|lantern", // 花燈
    'w-festival-47': "fu character|good luck character", // 福字
    'w-festival-48': "rabbit lantern", // 兔子燈
    'w-festival-49': "reunion dinner", // 團圓飯
    'w-festival-50': "new year painting|new year picture", // 年畫
    'w-festival-51': "gift box|present box", // 禮物盒
    'w-festival-52': "wreath|flower wreath", // 花環
    'w-festival-53': "snowball", // 雪球
    'w-festival-54': "rose", // 玫瑰花
    'w-festival-55': "christmas card", // 聖誕卡
    'w-festival-56': "gold ingot|ingot", // 元寶
    'w-festival-57': "greeting card", // 賀卡
    'w-festival-58': "mugwort", // 艾草
    'w-festival-59': "tomb sweeping", // 掃墓
    'w-festival-60': "new year greetings|new year visit", // 拜年
    'w-festival-61': "staying up on new years eve|stay up late", // 守歲
    'w-festival-62': "magpie bridge", // 鵲橋
    'w-festival-63': "christmas carol|christmas song", // 聖誕歌
    'w-festival-64': "beehive fireworks|firework rockets", // 蜂炮
    'w-festival-65': "popiah|spring roll wrap", // 潤餅
    'w-festival-66': "fa gao|prosperity cake", // 發糕
    'w-festival-67': "cowherd and weaver girl", // 牛郎織女
    'w-festival-68': "realgar wine", // 雄黃酒
    'w-festival-69': "ancestor worship|ancestor memorial", // 祭祖
    'w-festival-70': "harvest festival", // 豐年祭
    'w-kitchen-0': "pot|pan", // 鍋子
    'w-kitchen-1': "rice bowl", // 飯碗
    'w-kitchen-2': "soup bowl", // 湯碗
    'w-kitchen-3': "dining table", // 餐桌
    'w-kitchen-4': "fruit knife", // 水果刀
    'w-kitchen-5': "tableware|cutlery", // 餐具
    'w-kitchen-6': "table knife", // 餐刀
    'w-kitchen-7': "ladle", // 湯勺
    'w-kitchen-8': "slotted spoon", // 漏勺
    'w-kitchen-9': "dish rack", // 碗架
    'w-kitchen-10': "baking tray", // 烤盤
    'w-kitchen-11': "wok", // 炒鍋
    'w-kitchen-12': "soup pot", // 湯鍋
    'w-kitchen-13': "steamer", // 蒸籠
    'w-kitchen-14': "rolling pin", // 擀麵棍
    'w-kitchen-15': "whisk|egg beater", // 打蛋器
    'w-kitchen-16': "chef hat", // 廚師帽
    'w-kitchen-17': "placemat", // 餐墊
    'w-kitchen-18': "salt shaker", // 鹽罐
    'w-kitchen-19': "oil bottle", // 油瓶
    'w-kitchen-20': "strainer", // 濾網
    'w-kitchen-21': "can opener", // 開罐器
    'w-kitchen-22': "peeler", // 削皮刀
    'w-kitchen-23': "oven mitt", // 隔熱手套
    'w-kitchen-24': "spice jar", // 調味罐
    'w-kitchen-25': "soy sauce bottle", // 醬油瓶
    'w-kitchen-26': "grater", // 磨泥器
    'w-kitchen-27': "coffee pot", // 咖啡壺
    'w-kitchen-28': "cupboard", // 碗櫃
    'w-kitchen-29': "knife and fork", // 刀叉
    'w-kitchen-30': "rice paddle", // 飯勺
    'w-kitchen-31': "trivet", // 鍋墊
    'w-kitchen-32': "coffee dripper", // 濾杯
    'w-kitchen-33': "sauce dish", // 醬料碟
    'w-kitchen-34': "pizza pan", // 披薩盤
    'w-kitchen-35': "egg carton", // 蛋盒
    'w-kitchen-36': "rice jar", // 米缸
    'w-kitchen-37': "baking paper", // 烘焙紙
    'w-kitchen-38': "bbq tongs", // 烤肉夾
    'w-kitchen-39': "vegetable basket", // 洗菜籃
    'w-kitchen-40': "pepper shaker", // 胡椒罐
    'w-kitchen-41': "goblet", // 高腳杯
    'w-kitchen-42': "cake stand", // 蛋糕架
    'w-kitchen-43': "dough", // 麵團
    'w-kitchen-44': "basket", // 菜籃
    'w-kitchen-45': "kitchen timer", // 計時器
    'w-kitchen-46': "kitchen scale", // 電子秤
    'w-kitchen-47': "measuring spoon", // 量匙
    'w-kitchen-48': "tongs", // 食物夾
    'w-kitchen-49': "cake mold", // 蛋糕模
    'w-kitchen-50': "cookie cutter", // 餅乾模
    'w-kitchen-51': "pressure cooker", // 壓力鍋
    'w-kitchen-52': "clay pot", // 砂鍋
    'w-kitchen-53': "mortar and pestle", // 研磨缽
    'w-kitchen-54': "garlic press", // 蒜泥器
    'w-kitchen-55': "flour sifter", // 麵粉篩
    'w-kitchen-56': "spice rack", // 香料架
    'w-kitchen-57': "piping bag", // 擠花袋
    'w-kitchen-58': "egg steamer", // 蒸蛋器
    'w-kitchen-59': "bread tongs", // 烤麵包夾
    'w-drink-0': "cola", // 可樂
    'w-drink-1': "water", // 開水
    'w-drink-2': "mineral water", // 礦泉水
    'w-drink-3': "orange juice", // 柳橙汁
    'w-drink-4': "apple juice", // 蘋果汁
    'w-drink-5': "winter melon tea", // 冬瓜茶
    'w-drink-6': "oolong tea", // 烏龍茶
    'w-drink-7': "sparkling water", // 氣泡水
    'w-drink-8': "iced coffee", // 冰咖啡
    'w-drink-9': "popsicle|ice pop", // 雪糕
    'w-drink-10': "ice cream cone|cone", // 甜筒
    'w-drink-11': "cupcake", // 杯子蛋糕
    'w-drink-12': "swiss roll", // 瑞士捲
    'w-drink-13': "mango shaved ice", // 芒果冰
    'w-drink-14': "mung bean soup", // 綠豆湯
    'w-drink-15': "tapioca pearls", // 粉圓
    'w-drink-16': "lemonade|lemon juice", // 檸檬汁
    'w-drink-17': "hot tea", // 熱茶
    'w-drink-18': "fresh milk", // 鮮奶
    'w-drink-19': "apple tea", // 蘋果茶
    'w-drink-20': "flower tea", // 花茶
    'w-drink-21': "chrysanthemum tea", // 菊花茶
    'w-drink-22': "ginger tea", // 薑茶
    'w-drink-23': "muffin", // 馬芬
    'w-drink-24': "sour plum drink", // 酸梅湯
    'w-drink-25': "barley tea", // 麥茶
    'w-drink-26': "herbal tea", // 青草茶
    'w-drink-27': "yogurt drink", // 優酪乳
    'w-drink-28': "latte", // 拿鐵
    'w-drink-29': "cappuccino", // 卡布奇諾
    'w-drink-30': "americano", // 美式咖啡
    'w-drink-31': "mocha", // 摩卡
    'w-drink-32': "lemon tea", // 檸檬紅茶
    'w-drink-33': "honey water", // 蜂蜜水
    'w-drink-34': "coconut water", // 椰子水
    'w-drink-35': "watermelon juice", // 西瓜汁
    'w-drink-36': "papaya milk", // 木瓜牛奶
    'w-drink-37': "cheesecake", // 起司蛋糕
    'w-drink-38': "strawberry cake", // 草莓蛋糕
    'w-drink-39': "cinnamon roll", // 肉桂捲
    'w-drink-40': "caramel pudding|flan", // 焦糖布丁
    'w-drink-41': "red bean shaved ice", // 紅豆冰
    'w-drink-42': "snowflake ice", // 雪花冰
    'w-drink-43': "milk shaved ice", // 綿綿冰
    'w-drink-44': "taro balls", // 芋圓
    'w-drink-45': "hot grass jelly", // 燒仙草
    'w-drink-46': "barley soup", // 薏仁湯
    'w-drink-47': "fruit tart", // 水果塔
    'w-drink-48': "mint tea", // 薄荷茶
    'w-drink-49': "rose tea", // 玫瑰茶
    'w-drink-50': "longan tea", // 桂圓茶
    'w-drink-51': "cheese foam tea", // 奶蓋茶
    'w-drink-52': "pound cake", // 磅蛋糕
    'w-drink-53': "chiffon cake", // 戚風蛋糕
    'w-drink-54': "honey cake", // 蜂蜜蛋糕
    'w-drink-55': "chestnut cake", // 栗子蛋糕
    'w-drink-56': "jelly cup", // 果凍杯
    'w-drink-57': "soy milk", // 豆奶
    'w-drink-58': "almond tea", // 杏仁茶
    'w-drink-59': "fruit tea", // 水果茶
    'w-food-206': "boiled egg", // 水煮蛋
    'w-food-207': "roast chicken", // 烤雞
    'w-food-208': "grilled corn", // 烤玉米
    'w-food-209': "roasted sweet potato", // 烤地瓜
    'w-food-210': "seaweed", // 海苔
    'w-food-211': "beef", // 牛肉
    'w-food-212': "pork", // 豬肉
    'w-food-213': "fish ball", // 魚丸
    'w-food-214': "plum", // 李子
    'w-food-215': "pear", // 水梨
    'w-food-216': "cherry tomato", // 小番茄
    'w-food-217': "cabbage|bok choy", // 白菜
    'w-food-218': "edamame", // 毛豆
    'w-food-219': "egg fried rice", // 蛋炒飯
    'w-food-220': "pan fried dumpling", // 煎餃
    'w-food-221': "steamed dumpling", // 蒸餃
    'w-food-222': "soybean", // 黃豆
    'w-food-223': "red bean", // 紅豆
    'w-food-224': "mung bean", // 綠豆
    'w-food-225': "skewer|kebab", // 肉串
    'w-food-226': "shelled shrimp", // 蝦仁
    'w-food-227': "omelette rice", // 蛋包飯
    'w-food-228': "pig trotter", // 豬腳
    'w-food-229': "pork rib soup", // 排骨湯
    'w-food-230': "grilled sausage", // 烤香腸
    'w-food-231': "grilled fish", // 烤魚
    'w-food-232': "steamed fish", // 蒸魚
    'w-food-233': "chopped scallion", // 蔥花
    'w-food-234': "chive|leek", // 韭菜
    'w-food-235': "wood ear mushroom", // 木耳
    'w-food-236': "nori", // 紫菜
    'w-food-237': "corn soup", // 玉米濃湯
    'w-food-238': "oyster", // 蚵仔
    'w-food-239': "scallop", // 干貝
    'w-food-240': "squid", // 魷魚
    'w-food-241': "egg drop soup", // 蛋花湯
    'w-food-242': "water spinach", // 空心菜
    'w-food-243': "celery", // 芹菜
    'w-food-244': "green beans", // 四季豆
    'w-food-245': "chestnut", // 栗子
    'w-food-246': "red date|jujube", // 紅棗
    'w-food-247': "baby corn", // 玉米筍
    'w-food-248': "bell pepper", // 甜椒
    'w-food-249': "pickled cabbage", // 酸菜
    'w-food-250': "pork floss", // 肉鬆
    'w-food-251': "pork chop", // 豬排
    'w-food-252': "pork cutlet rice", // 豬排飯
    'w-food-253': "chicken rice", // 雞肉飯
    'w-food-254': "duck meat", // 鴨肉
    'w-food-255': "lamb|mutton", // 羊肉
    'w-food-256': "sashimi", // 生魚片
    'w-food-257': "hand roll", // 手捲
    'w-food-258': "thick toast", // 厚片吐司
    'w-food-259': "baguette", // 法國麵包
    'w-food-260': "garlic bread", // 蒜香麵包
    'w-food-261': "pineapple bun", // 菠蘿包
    'w-food-262': "red bean bun", // 紅豆麵包
    'w-food-263': "cream bun", // 奶油麵包
    'w-food-264': "apricot", // 杏桃
    'w-food-265': "grapefruit", // 葡萄柚
    'w-food-266': "kumquat", // 金桔
    'w-food-267': "minced pork rice", // 肉燥飯
    'w-food-268': "fried bun", // 水煎包
    'w-food-269': "corn kernels", // 玉米粒
    'w-food-270': "sticky rice", // 糯米
    'w-food-271': "fish slice", // 魚片
    'w-food-272': "grilled squid", // 烤魷魚
    'w-food-273': "dry noodles", // 乾麵
    'w-food-274': "braised pork", // 紅燒肉
    'w-food-275': "sweet and sour ribs", // 糖醋排骨
    'w-food-276': "three cup chicken", // 三杯雞
    'w-food-277': "poached chicken", // 白斬雞
    'w-food-278': "lotus seed", // 蓮子
    'w-food-279': "yam", // 山藥
    'w-food-280': "fig", // 無花果
    'w-food-281': "loquat", // 枇杷
    'w-food-282': "mulberry", // 桑葚
    'w-food-283': "red apple", // 蛇果
    'w-food-284': "sesame oil chicken", // 麻油雞
    'w-food-285': "ginger duck", // 薑母鴨
    'w-farm-0': "duckling", // 小鴨
    'w-farm-1': "lamb", // 小羊
    'w-farm-2': "chicken coop", // 雞舍
    'w-farm-3': "pigsty", // 豬圈
    'w-farm-4': "fence", // 籬笆
    'w-farm-5': "haystack", // 乾草堆
    'w-farm-6': "calf", // 小牛
    'w-farm-7': "bull", // 公牛
    'w-farm-8': "cowshed", // 牛棚
    'w-farm-9': "sheep pen", // 羊圈
    'w-farm-10': "flock", // 羊群
    'w-farm-11': "farmland", // 農田
    'w-farm-12': "paddy field", // 水田
    'w-farm-13': "tea picking", // 採茶
    'w-farm-14': "barn", // 穀倉
    'w-farm-15': "stable", // 馬廄
    'w-farm-16': "cornfield", // 玉米田
    'w-farm-17': "waterwheel", // 水車
    'w-farm-18': "well", // 水井
    'w-farm-19': "sprinkler", // 灑水器
    'w-farm-20': "sowing|plant seeds", // 播種
    'w-farm-21': "plant rice seedlings", // 插秧
    'w-farm-22': "harvest", // 收割
    'w-farm-23': "watering", // 澆水
    'w-farm-24': "fertilize", // 施肥
    'w-farm-25': "milking", // 擠牛奶
    'w-farm-26': "collect eggs", // 撿雞蛋
    'w-farm-27': "pick fruit", // 採果
    'w-farm-28': "farming", // 種田
    'w-farm-29': "plowing", // 犁田
    'w-farm-30': "farmhouse", // 農舍
    'w-farm-31': "rice ear", // 稻穗
    'w-farm-32': "wheat ear", // 麥穗
    'w-farm-33': "seedling", // 秧苗
    'w-farm-34': "beehive", // 蜂箱
    'w-farm-35': "sheepdog", // 牧羊犬
    'w-farm-36': "cow bell", // 牛鈴
    'w-farm-37': "fruit tree", // 果樹
    'w-farm-38': "apple tree", // 蘋果樹
    'w-farm-39': "duck house", // 鴨舍
    'w-farm-40': "vegetable field", // 菜田
    'w-farm-41': "farm tools", // 農具
    'w-farm-42': "harvester", // 收割機
    'w-farm-43': "drying grain", // 曬穀
    'w-farm-44': "mill", // 磨坊
    'w-farm-45': "beekeeping", // 養蜂
    'w-farm-46': "collect honey", // 採蜜
    'w-farm-47': "pick vegetables", // 摘菜
    'w-farm-48': "pull radish", // 拔蘿蔔
    'w-farm-49': "dig sweet potato", // 挖地瓜
    'w-farm-50': "strawberry farm", // 草莓園
    'w-farm-51': "flower field", // 花田
    'w-farm-52': "lotus field", // 蓮花田
    'w-farm-53': "irrigation", // 灌溉
    'w-farm-54': "rice grain", // 稻米
    'w-farm-55': "pasture grass", // 牧草
    'w-farm-56': "wooden barrel", // 木桶
    'w-farm-57': "milk can", // 牛奶桶
    'w-farm-58': "vegetable patch", // 菜圃
    'w-farm-59': "cut rice", // 割稻
    'w-city-0': "road", // 馬路
    'w-city-1': "street lamp|streetlight", // 路燈
    'w-city-2': "sidewalk", // 人行道
    'w-city-3': "intersection|crossroads", // 十字路口
    'w-city-4': "bus stop", // 公車站牌
    'w-city-5': "mailbox|post box", // 郵筒
    'w-city-6': "square|plaza", // 廣場
    'w-city-7': "overpass|viaduct", // 高架橋
    'w-city-8': "fire hydrant", // 消防栓
    'w-city-9': "bench|park bench", // 長椅
    'w-city-10': "apartment", // 公寓
    'w-city-11': "alley", // 巷子
    'w-city-12': "roadblock|barricade", // 路障
    'w-city-13': "gutter|drain", // 水溝
    'w-city-14': "fence|wall", // 圍牆
    'w-city-15': "iron gate", // 鐵門
    'w-city-16': "asphalt road", // 柏油路
    'w-city-17': "street sign", // 路牌
    'w-city-18': "railing", // 欄杆
    'w-city-19': "flower bed", // 花壇
    'w-city-20': "pedestrian", // 行人
    'w-city-21': "metro station|subway station", // 捷運站
    'w-city-22': "manhole cover", // 人孔蓋
    'w-city-23': "vending machine", // 販賣機
    'w-city-24': "billboard", // 廣告看板
    'w-city-25': "night view|cityscape", // 夜景
    'w-city-26': "skyline", // 天際線
    'w-city-27': "bulletin board", // 公佈欄
    'w-city-28': "construction site", // 工地
    'w-city-29': "railway track|rails", // 鐵軌
    'w-city-30': "railroad crossing|level crossing", // 平交道
    'w-city-31': "bike lane", // 單車道
    'w-city-32': "traffic island", // 安全島
    'w-city-33': "interchange", // 交流道
    'w-city-34': "shopping street", // 商店街
    'w-city-35': "old street", // 老街
    'w-city-36': "city wall", // 城牆
    'w-city-37': "city gate", // 城門
    'w-city-38': "clock tower|bell tower", // 鐘樓
    'w-city-39': "monument", // 紀念碑
    'w-city-40': "chimney", // 煙囪
    'w-city-41': "flagpole", // 旗桿
    'w-city-42': "notice board", // 告示牌
    'w-city-43': "parking space", // 停車格
    'w-city-44': "traffic lane", // 車道
    'w-city-45': "one-way street", // 單行道
    'w-city-46': "downtown", // 市區
    'w-city-47': "suburb", // 郊區
    'w-city-48': "traffic jam", // 塞車
    'w-city-49': "visitor center", // 遊客中心
    'w-city-50': "highway|freeway", // 高速公路
    'w-city-51': "underground mall", // 地下街
    'w-city-52': "fire lane", // 防火巷
    'w-city-53': "city hall", // 市政府
    'w-city-54': "cable-stayed bridge", // 斜張橋
    'w-city-55': "guardrail", // 護欄
    'w-city-56': "convex mirror", // 反光鏡
    'w-city-57': "storm drain", // 排水孔
    'w-city-58': "roadside tree", // 行道樹
    'w-city-59': "landmark", // 地標
    'w-place-99': "backyard", // 後院
    'w-place-100': "maze", // 迷宮
    'w-place-101': "seaside", // 海邊
    'w-place-102': "palace", // 宮殿
    'w-place-103': "cafeteria", // 食堂
    'w-place-104': "soccer field|football field", // 足球場
    'w-place-105': "tennis court", // 網球場
    'w-place-106': "jungle", // 叢林
    'w-place-107': "snow mountain", // 雪山
    'w-place-108': "lakeside", // 湖邊
    'w-place-109': "campsite", // 營地
    'w-place-110': "bathhouse", // 浴池
    'w-place-111': "riverbank", // 河岸
    'w-place-112': "deserted island", // 荒島
    'w-place-113': "vacant lot", // 空地
    'w-place-114': "field", // 田野
    'w-place-115': "campus", // 校園
    'w-place-116': "bay", // 海灣
    'w-place-117': "mountain road", // 山路
    'w-place-118': "village", // 村莊
    'w-place-119': "study room|study", // 書房
    'w-place-120': "storeroom|storage room", // 儲藏室
    'w-place-121': "teahouse", // 茶館
    'w-place-122': "nurse office|infirmary", // 保健室
    'w-place-123': "meeting room|conference room", // 會議室
    'w-place-124': "department store", // 百貨公司
    'w-place-125': "barbecue area", // 烤肉區
    'w-place-126': "fishing spot", // 釣魚場
    'w-place-127': "badminton court", // 羽球場
    'w-place-128': "volleyball court", // 排球場
    'w-place-129': "bazaar|market fair", // 市集
    'w-place-130': "playground|kids park", // 兒童樂園
    'w-place-131': "car wash", // 洗車場
    'w-place-132': "garage|repair shop", // 修車廠
    'w-place-133': "noodle shop", // 麵店
    'w-place-134': "hair salon", // 髮廊
    'w-place-135': "summer camp", // 夏令營
    'w-place-136': "aviary|bird park", // 鳥園
    'w-place-137': "butterfly garden", // 蝴蝶園
    'w-place-138': "game room", // 遊戲間
    'w-place-139': "cake shop", // 蛋糕店
    'w-place-140': "shoe store", // 鞋店
    'w-place-141': "watchtower", // 瞭望塔
    'w-place-142': "dungeon", // 地牢
    'w-place-143': "bomb shelter", // 防空洞
    'w-place-144': "power plant", // 發電廠
    'w-place-145': "monastery", // 修道院
    'w-place-146': "exhibition hall", // 展覽館
    'w-place-147': "apiary", // 養蜂場
    'w-place-148': "observation station", // 觀測站
    'w-vehicle-70': "ship|steamship", // 輪船
    'w-vehicle-71': "rubber boat|inflatable raft", // 橡皮艇
    'w-vehicle-72': "yacht", // 遊艇
    'w-vehicle-73': "airliner|passenger plane", // 客機
    'w-vehicle-74': "jet|jet plane", // 噴射機
    'w-vehicle-75': "balance bike", // 平衡車
    'w-vehicle-76': "parade float", // 花車
    'w-vehicle-77': "trailer", // 拖車
    'w-vehicle-78': "lifeboat", // 救生艇
    'w-vehicle-79': "cargo ship", // 貨輪
    'w-vehicle-80': "toy boat", // 玩具船
    'w-vehicle-81': "raft", // 木筏
    'w-vehicle-82': "baby walker", // 學步車
    'w-vehicle-83': "toy plane", // 玩具飛機
    'w-vehicle-84': "kids ride-on car", // 童車
    'w-vehicle-85': "tandem bike", // 雙人單車
    'w-vehicle-86': "vintage car|classic car", // 老爺車
    'w-vehicle-87': "armored truck", // 運鈔車
    'w-vehicle-88': "cargo plane", // 貨機
    'w-vehicle-89': "tour bus", // 觀光巴士
    'w-vehicle-90': "passenger car|sedan", // 小客車
    'w-vehicle-91': "street sweeper", // 掃街車
    'w-vehicle-92': "snowplow", // 鏟雪車
    'w-vehicle-93': "construction vehicle", // 工程車
    'w-vehicle-94': "patrol car", // 巡邏車
    'w-vehicle-95': "container truck", // 貨櫃車
    'w-vehicle-96': "banana boat", // 香蕉船
    'w-vehicle-97': "rice transplanter", // 插秧機
    'w-vehicle-98': "solar car", // 太陽能車
    'w-vehicle-99': "windsurf board|sailboard", // 帆板
    'w-vehicle-100': "light aircraft", // 輕航機
    'w-vehicle-101': "mail truck", // 郵務車
    'w-vehicle-102': "folding bike", // 折疊車
    'w-vehicle-103': "snowmobile", // 雪地摩托
    'w-vehicle-104': "jet ski", // 水上摩托
    'w-vehicle-105': "amphibious vehicle", // 兩棲車
    'w-vehicle-106': "lunar rover|moon buggy", // 登月車
    'w-vehicle-107': "road bike", // 公路車
    'w-vehicle-108': "flying car", // 飛行汽車
    'w-vehicle-109': "seaplane", // 水上飛機
    'w-job-98': "fishmonger|fish seller", // 魚販
    'w-job-99': "street vendor|peddler", // 小販
    'w-job-100': "electrician", // 電工
    'w-job-101': "security guard|guard", // 守衛
    'w-job-102': "butler", // 管家
    'w-job-103': "sailor", // 水手
    'w-job-104': "boxer", // 拳擊手
    'w-job-105': "soccer player|football player", // 足球員
    'w-job-106': "basketball player", // 籃球員
    'w-job-107': "drummer", // 鼓手
    'w-job-108': "guitarist", // 吉他手
    'w-job-109': "poet", // 詩人
    'w-job-110': "cashier", // 收銀員
    'w-job-111': "street sweeper", // 清道夫
    'w-job-112': "beekeeper", // 養蜂人
    'w-job-113': "dishwasher", // 洗碗工
    'w-job-114': "repairman|mechanic", // 修理工
    'w-job-115': "car washer", // 洗車工
    'w-job-116': "shepherd boy", // 牧童
    'w-job-117': "butcher", // 肉販
    'w-job-118': "vegetable seller", // 菜販
    'w-job-119': "house painter|painter", // 油漆工
    'w-job-120': "welder", // 焊接工
    'w-job-121': "doorman", // 門衛
    'w-job-122': "acrobat", // 雜技演員
    'w-job-123': "stuntman|stunt performer", // 特技演員
    'w-job-124': "storyteller", // 說書人
    'w-job-125': "pianist", // 鋼琴家
    'w-job-126': "violinist", // 小提琴家
    'w-job-127': "editor", // 編輯
    'w-job-128': "fruit farmer", // 果農
    'w-job-129': "tea farmer", // 茶農
    'w-job-130': "tea picker", // 採茶工
    'w-job-131': "traffic police|traffic officer", // 交通警察
    'w-job-132': "customs officer", // 海關
    'w-job-133': "security screener", // 安檢員
    'w-job-134': "mountain guide", // 登山嚮導
    'w-job-135': "master of ceremonies|emcee", // 司儀
    'w-job-136': "forest ranger|ranger", // 護林員
    'w-job-137': "cobbler", // 補鞋匠
    'w-job-138': "weaver", // 織布工
    'w-job-139': "animator", // 動畫師
    'w-job-140': "navigator", // 領航員
    'w-job-141': "geologist", // 地質學家
    'w-job-142': "astronomer", // 天文學家
    'w-job-143': "biologist", // 生物學家
    'w-job-144': "mathematician", // 數學家
    'w-job-145': "inventor", // 發明家
    'w-job-146': "chemist", // 化學家
    'w-job-147': "physicist", // 物理學家
    'w-people-44': "queen", // 皇后
    'w-people-45': "thief", // 小偷
    'w-people-46': "patient", // 病人
    'w-people-47': "boy", // 男孩
    'w-people-48': "girl", // 女孩
    'w-people-49': "man", // 男人
    'w-people-50': "woman", // 女人
    'w-people-51': "adult|grown-up", // 大人
    'w-people-52': "bad guy", // 壞人
    'w-people-53': "good person", // 好人
    'w-people-54': "traveler", // 旅客
    'w-people-55': "passenger", // 乘客
    'w-people-56': "athlete|player", // 選手
    'w-people-57': "owner|master", // 主人
    'w-people-58': "teammate", // 隊友
    'w-people-59': "family", // 家人
    'w-people-60': "aunt", // 姑姑
    'w-people-61': "grandson", // 孫子
    'w-people-62': "son", // 兒子
    'w-people-63': "daughter", // 女兒
    'w-people-64': "husband", // 丈夫
    'w-people-65': "wife", // 妻子
    'w-people-66': "couple", // 情侶
    'w-people-67': "married couple", // 夫妻
    'w-people-68': "warrior", // 戰士
    'w-people-69': "stranger", // 陌生人
    'w-people-70': "ancestor", // 祖先
    'w-people-71': "triplets", // 三胞胎
    'w-people-72': "parent|guardian", // 家長
    'w-people-73': "servant", // 僕人
    'w-civics-32': "democracy", // 民主
    'w-civics-33': "freedom|liberty", // 自由
    'w-civics-34': "human rights", // 人權
    'w-civics-35': "equality", // 平等
    'w-civics-36': "ballot", // 選票
    'w-civics-37': "candidate", // 候選人
    'w-civics-38': "campaign|election campaign", // 競選
    'w-civics-39': "vote counting", // 開票
    'w-civics-40': "polling station", // 投票所
    'w-civics-41': "nationality", // 國籍
    'w-civics-42': "receipt|invoice", // 發票
    'w-civics-43': "contract", // 合約
    'w-civics-44': "insurance", // 保險
    'w-civics-45': "pension", // 年金
    'w-civics-46': "welfare", // 福利
    'w-civics-47': "national defense", // 國防
    'w-civics-48': "treaty", // 條約
    'w-civics-49': "national emblem", // 國徽
    'w-civics-50': "president", // 總統
    'w-civics-51': "legislator|lawmaker", // 議員
    'w-civics-52': "legislature|legislative yuan", // 立法院
    'w-civics-53': "separation of powers", // 三權分立
    'w-civics-54': "public hearing", // 公聽會
    'w-civics-55': "recall", // 罷免
    'w-civics-56': "petition", // 請願
    'w-civics-57': "mediation", // 調解
    'w-civics-58': "blood donation", // 捐血
    'w-civics-59': "charity", // 慈善
    'w-civics-60': "community|neighborhood", // 社區
    'w-civics-61': "income tax", // 所得稅
    'w-shape-0': "box shape", // 方形
    'w-shape-1': "star shape", // 星形
    'w-shape-2': "circle outline", // 圓圈
    'w-shape-3': "circle", // 圓形
    'w-shape-4': "triangle", // 三角形
    'w-shape-5': "heart", // 愛心
    'w-shape-6': "arrow", // 箭頭
    'w-shape-7': "question mark", // 問號
    'w-shape-8': "exclamation mark", // 驚嘆號
    'w-shape-9': "rectangle", // 長方形
    'w-shape-10': "diamond", // 菱形
    'w-shape-11': "cross", // 十字
    'w-shape-12': "x mark|cross mark", // 叉叉
    'w-shape-13': "check mark|tick", // 打勾
    'w-shape-14': "straight line", // 直線
    'w-shape-15': "wave", // 波浪
    'w-shape-16': "water drop|droplet", // 水滴
    'w-shape-17': "plus sign", // 加號
    'w-shape-18': "minus sign", // 減號
    'w-shape-19': "half moon", // 半月
    'w-shape-20': "double arrow", // 雙箭頭
    'w-shape-21': "diagonal arrow", // 斜箭頭
    'w-shape-22': "dotted line row", // 點線
    'w-shape-23': "oval|ellipse", // 橢圓形
    'w-shape-24': "pentagram", // 五角星
    'w-shape-25': "hexagon", // 六角形
    'w-shape-26': "trapezoid", // 梯形
    'w-shape-27': "semicircle", // 半圓
    'w-shape-28': "donut shape", // 圓環
    'w-shape-29': "sector", // 扇形
    'w-shape-30': "spiral", // 螺旋
    'w-shape-31': "dotted line|dashed line", // 虛線
    'w-shape-32': "curve", // 曲線
    'w-shape-33': "zigzag", // 之字形
    'w-shape-34': "sawtooth", // 鋸齒
    'w-shape-35': "block", // 方塊
    'w-shape-36': "dot", // 圓點
    'w-shape-37': "equals sign", // 等號
    'w-shape-38': "asterisk", // 星號
    'w-shape-39': "smiley face", // 笑臉
    'w-shape-40': "slash", // 斜線
    'w-shape-41': "parentheses", // 括號
    'w-shape-42': "octagon", // 八角形
    'w-shape-43': "concentric circles", // 同心圓
    'w-shape-44': "cube", // 立方體
    'w-shape-45': "cylinder", // 圓柱體
    'w-shape-46': "cone", // 圓錐體
    'w-shape-47': "sphere", // 球體
    'w-shape-48': "cuboid", // 長方體
    'w-shape-49': "cross star", // 十字星
    'w-adjective-0': "warm", // 暖
    'w-adjective-1': "tall|high", // 高
    'w-adjective-2': "short", // 矮
    'w-adjective-3': "fat", // 胖
    'w-adjective-4': "thin|skinny", // 瘦
    'w-adjective-5': "fast", // 快
    'w-adjective-6': "slow", // 慢
    'w-adjective-7': "cold", // 冷
    'w-adjective-8': "hot", // 熱
    'w-adjective-9': "wet", // 濕
    'w-adjective-10': "dry", // 乾
    'w-adjective-11': "heavy", // 重
    'w-adjective-12': "light", // 輕
    'w-adjective-13': "big|large", // 大
    'w-adjective-14': "small|little", // 小
    'w-adjective-15': "long", // 長
    'w-adjective-16': "short", // 短
    'w-adjective-17': "many", // 多
    'w-adjective-18': "few", // 少
    'w-adjective-19': "dirty", // 髒
    'w-adjective-20': "clean", // 乾淨
    'w-adjective-21': "new", // 新
    'w-adjective-22': "old", // 舊
    'w-adjective-23': "soft", // 軟
    'w-adjective-24': "hard", // 硬
    'w-adjective-25': "bright", // 亮
    'w-adjective-26': "dark", // 暗
    'w-adjective-27': "full", // 滿
    'w-adjective-28': "empty", // 空
    'w-adjective-29': "thick", // 粗
    'w-adjective-30': "thin", // 細
    'w-adjective-31': "wide", // 寬
    'w-adjective-32': "narrow", // 窄
    'w-adjective-33': "deep", // 深
    'w-adjective-34': "shallow", // 淺
    'w-adjective-35': "thick", // 厚
    'w-adjective-36': "thin", // 薄
    'w-adjective-37': "far", // 遠
    'w-adjective-38': "near", // 近
    'w-adjective-39': "pointy|sharp", // 尖
    'w-adjective-40': "blunt", // 鈍
    'w-adjective-41': "bent", // 彎
    'w-adjective-42': "full stomach", // 飽
    'w-adjective-43': "hungry", // 餓
    'w-adjective-44': "aged", // 老
    'w-adjective-45': "young", // 年輕
    'w-adjective-46': "ugly", // 醜
    'w-adjective-47': "beautiful", // 美
    'w-adjective-48': "sour", // 酸
    'w-adjective-49': "sweet", // 甜
    'w-adjective-50': "bitter", // 苦
    'w-adjective-51': "concave", // 凹
    'w-adjective-52': "convex", // 凸
    'w-adjective-53': "smooth", // 光滑
    'w-adjective-54': "rough", // 粗糙
    'w-adjective-55': "loose", // 鬆
    'w-adjective-56': "tight", // 緊
    'w-adjective-57': "tilted|slanted", // 傾斜
    'w-adjective-58': "crispy", // 脆
    'w-adjective-59': "curved", // 彎曲
    'w-emotion-40': "worried", // 擔心
    'w-emotion-41': "relieved|reassured", // 安心
    'w-emotion-42': "calm", // 平靜
    'w-emotion-43': "fear", // 恐懼
    'w-emotion-44': "sorrow", // 悲傷
    'w-emotion-45': "cheerful", // 愉快
    'w-emotion-46': "angry", // 氣憤
    'w-emotion-47': "gloomy|depressed", // 憂鬱
    'w-emotion-48': "excited emotionally|moved", // 激動
    'w-emotion-49': "jealous|green with envy", // 吃醋
    'w-emotion-50': "uneasy", // 不安
    'w-emotion-51': "guilty feeling", // 心虛
    'w-emotion-52': "heartache|feel sorry for", // 心疼
    'w-emotion-53': "annoyed|irritated", // 心煩
    'w-emotion-54': "frowning with worry", // 愁眉
    'w-emotion-55': "helpless", // 無奈
    'w-emotion-56': "cheerful and open", // 開朗
    'w-emotion-57': "anxious", // 擔憂
    'w-emotion-58': "missing someone", // 思念
    'w-emotion-59': "panicked|flustered", // 慌張
    'w-emotion-60': "tense", // 緊繃
    'w-emotion-61': "guilty", // 愧疚
    'w-emotion-62': "puzzled", // 納悶
    'w-emotion-63': "inferiority", // 自卑
    'w-emotion-64': "conflicted", // 糾結
    'w-emotion-65': "lost and confused", // 迷惘
    'w-emotion-66': "impatient", // 不耐煩
    'w-emotion-67': "terrified", // 惶恐
    'w-emotion-68': "delighted", // 欣喜
    'w-emotion-69': "indignant", // 激憤
    'w-expression-47': "beckon", // 招手
    'w-expression-48': "clench fist", // 握拳
    'w-expression-49': "hands on hips", // 叉腰
    'w-expression-50': "arms crossed", // 抱胸
    'w-expression-51': "chin on hand", // 托腮
    'w-expression-52': "hold head", // 抱頭
    'w-expression-53': "shed tears", // 流淚
    'w-expression-54': "grit teeth", // 咬牙
    'w-expression-55': "kiss", // 親親
    'w-expression-56': "pat head", // 摸頭
    'w-expression-57': "pat on shoulder", // 拍肩
    'w-expression-58': "wave off", // 擺手
    'w-expression-59': "bend over", // 彎腰
    'w-expression-60': "squat", // 蹲下
    'w-expression-61': "prop chin", // 撐下巴
    'w-expression-62': "rub eyes", // 揉眼睛
    'w-expression-63': "clean ears", // 掏耳朵
    'w-expression-64': "giggle", // 嘻笑
    'w-expression-65': "deep breath", // 深呼吸
    'w-expression-66': "scratch itch", // 抓癢
    'w-expression-67': "hiccup", // 打嗝
    'w-expression-68': "pout", // 噘嘴
    'w-expression-69': "blow air", // 吹氣
    'w-expression-70': "thumbs up", // 豎拇指
    'w-expression-71': "fist salute", // 抱拳
    'w-expression-72': "bow with fists", // 作揖
    'w-expression-73': "kneel", // 跪下
    'w-expression-74': "tiptoe", // 踮腳
    'w-expression-75': "shake leg", // 抖腳
    'w-expression-76': "cross legs", // 翹腳
    'w-expression-77': "spin around", // 轉圈
    'w-expression-78': "hush", // 噓聲
    'w-expression-79': "knit brows", // 蹙眉
    'w-expression-80': "look around", // 張望
    'w-expression-81': "peek", // 偷看
    'w-expression-82': "faint", // 昏倒
    'w-expression-83': "curl lip", // 撇嘴
    'w-expression-84': "smack lips", // 咂嘴
    'w-expression-85': "suppress smile", // 抿笑
    'w-expression-86': "wrinkle nose", // 皺鼻
    'w-action-109': "horse riding", // 騎馬
    'w-action-110': "play piano", // 彈鋼琴
    'w-action-111': "play drums", // 打鼓
    'w-action-112': "watch movie", // 看電影
    'w-action-113': "go shopping", // 逛街
    'w-action-114': "drive", // 開車
    'w-action-115': "take bus", // 搭公車
    'w-action-116': "take train", // 坐火車
    'w-action-117': "take metro", // 搭捷運
    'w-action-118': "ride scooter", // 騎機車
    'w-action-119': "cook noodles", // 煮麵
    'w-action-120': "chop vegetables", // 切菜
    'w-action-121': "stir fry", // 炒菜
    'w-action-122': "fry egg", // 煎蛋
    'w-action-123': "wash hair", // 洗頭
    'w-action-124': "knock on door", // 敲門
    'w-action-125': "pour water", // 倒水
    'w-action-126': "eat ice cream", // 吃冰
    'w-action-127': "blow balloon", // 吹氣球
    'w-action-128': "push cart", // 推車
    'w-action-129': "play blocks", // 玩積木
    'w-action-130': "play chess", // 下棋
    'w-action-131': "set off fireworks", // 放煙火
    'w-action-132': "tai chi", // 打太極
    'w-action-133': "do yoga", // 做瑜伽
    'w-action-134': "play flute", // 吹笛子
    'w-action-135': "play violin", // 拉小提琴
    'w-action-136': "bake bread", // 烤麵包
    'w-action-137': "wash vegetables", // 洗菜
    'w-action-138': "peel apple", // 削蘋果
    'w-action-139': "peel orange", // 剝橘子
    'w-action-140': "drink soup", // 喝湯
    'w-action-141': "eat corn", // 啃玉米
    'w-action-142': "blow dry hair", // 吹頭髮
    'w-action-143': "shave", // 刮鬍子
    'w-action-144': "put on makeup", // 化妝
    'w-action-145': "wear hat", // 戴帽子
    'w-action-146': "tie necktie", // 繫領帶
    'w-action-147': "sew clothes", // 縫衣服
    'w-action-148': "knit sweater", // 織毛衣
    'w-action-149': "hammer nail", // 釘釘子
    'w-action-150': "saw wood", // 鋸木頭
    'w-action-151': "weed", // 除草
    'w-action-152': "mow lawn", // 割草
    'w-action-153': "pick apples", // 摘蘋果
    'w-action-154': "feed chickens", // 餵雞
    'w-action-155': "feed cat", // 餵貓
    'w-action-156': "ride camel", // 騎駱駝
    'w-action-157': "canoe", // 划獨木舟
    'w-action-158': "throw ball", // 丟球
    'w-action-159': "catch ball", // 接球
    'w-action-160': "shoot basket", // 投籃
    'w-action-161': "play ping pong", // 打乒乓
    'w-action-162': "do puzzle", // 玩拼圖
    'w-action-163': "seesaw", // 玩翹翹板
    'w-action-164': "wipe sweat", // 擦汗
    'w-action-165': "ring doorbell", // 按電鈴
    'w-action-166': "do homework", // 寫功課
    'w-action-167': "carry schoolbag", // 背書包
    'w-action-168': "listen to music", // 聽音樂
    'w-action-169': "skydiving", // 跳傘
    'w-action-170': "bowling", // 打保齡球
    'w-action-171': "play golf", // 打高爾夫
    'w-action-172': "dig hole", // 挖洞
    'w-action-173': "pull luggage", // 拖行李
    'w-action-174': "pick fruit", // 採水果
    'w-action-175': "wash dog", // 洗狗
    'w-action-176': "climb wall", // 爬牆
    'w-action-177': "record audio", // 錄音
    'w-action-178': "buy ticket", // 買票
    'w-medical-0': "stethoscope", // 聽診器
    'w-medical-1': "syringe|injection syringe", // 針筒
    'w-medical-2': "pill|pills", // 藥丸
    'w-medical-3': "thermometer", // 體溫計
    'w-medical-4': "crutches|crutch", // 拐杖
    'w-medical-5': "hospital bed", // 病床
    'w-medical-6': "iv drip|drip", // 點滴
    'w-medical-7': "x-ray|xray", // X光片
    'w-medical-8': "ointment", // 藥膏
    'w-medical-9': "take medicine", // 吃藥
    'w-medical-10': "gauze", // 紗布
    'w-medical-11': "measure blood pressure", // 量血壓
    'w-medical-12': "eye drops", // 眼藥水
    'w-medical-13': "knee brace", // 護膝
    'w-medical-14': "body temperature", // 體溫
    'w-medical-15': "white coat|lab coat", // 白袍
    'w-medical-16': "medicine box|medicine chest", // 藥箱
    'w-medical-17': "needle", // 針頭
    'w-medical-18': "hospital gown", // 病服
    'w-medical-19': "stretcher", // 擔架
    'w-medical-20': "cast|plaster cast", // 石膏
    'w-medical-21': "walker", // 助行器
    'w-medical-22': "blood pressure monitor", // 血壓計
    'w-medical-23': "dental floss|floss", // 牙線
    'w-medical-24': "gargle|rinse mouth", // 漱口
    'w-medical-25': "teeth cleaning", // 洗牙
    'w-medical-26': "registration|check in", // 掛號
    'w-medical-27': "medicine bag", // 藥袋
    'w-medical-28': "pill bottle|medicine bottle", // 藥瓶
    'w-medical-29': "capsule", // 膠囊
    'w-medical-30': "cough syrup|syrup", // 糖漿
    'w-medical-31': "rubbing alcohol|alcohol", // 酒精
    'w-medical-32': "disinfect|disinfection", // 消毒
    'w-medical-33': "health checkup|medical checkup", // 健康檢查
    'w-medical-34': "eye chart", // 視力表
    'w-medical-35': "blood test", // 驗血
    'w-medical-36': "ear thermometer", // 耳溫槍
    'w-medical-37': "oxygen mask", // 氧氣罩
    'w-medical-38': "dental chair", // 診療椅
    'w-medical-39': "waiting room", // 候診室
    'w-medical-40': "emergency room", // 急診室
    'w-medical-41': "hospital ward|ward", // 病房
    'w-medical-42': "massage", // 按摩
    'w-medical-43': "acupuncture", // 針灸
    'w-medical-44': "cupping", // 拔罐
    'w-medical-45': "rehabilitation|physical therapy", // 復健
    'w-medical-46': "back support|waist brace", // 護腰
    'w-medical-47': "operating room", // 手術室
    'w-medical-48': "intensive care unit|icu", // 加護病房
    'w-medical-49': "eye clinic", // 眼科
    'w-medical-50': "ecg|electrocardiogram|ekg", // 心電圖
    'w-medical-51': "ventilator|respirator", // 呼吸器
    'w-medical-52': "braces", // 牙套
    'w-medical-53': "dentures|false teeth", // 假牙
    'w-medical-54': "eye exam|eye test", // 驗光
    'w-medical-55': "heat pack|hot compress", // 熱敷袋
    'w-medical-56': "ice pack", // 冰敷袋
    'w-medical-57': "pill box|pillbox", // 藥盒
    'w-medical-58': "health exercises|stretching exercises", // 保健操
    'w-medical-59': "medicine cabinet", // 藥櫃
    'w-body-36': "waist", // 腰
    'w-body-37': "back", // 背
    'w-body-38': "toe|toes", // 腳趾
    'w-body-39': "thigh", // 大腿
    'w-body-40': "calf|shin", // 小腿
    'w-body-41': "cheek|cheeks", // 臉頰
    'w-body-42': "nostril|nostrils", // 鼻孔
    'w-body-43': "thumb", // 拇指
    'w-body-44': "index finger|pointer finger", // 食指
    'w-body-45': "back of hand", // 手背
    'w-body-46': "wrist", // 手腕
    'w-body-47': "heel", // 腳跟
    'w-body-48': "sole|sole of foot", // 腳底
    'w-body-49': "eyelid", // 眼皮
    'w-body-50': "eyeball", // 眼珠
    'w-body-51': "pupil", // 瞳孔
    'w-body-52': "throat", // 喉嚨
    'w-body-53': "earlobe", // 耳垂
    'w-body-54': "bridge of nose|nose bridge", // 鼻梁
    'w-body-55': "middle finger", // 中指
    'w-body-56': "spine|backbone", // 脊椎
    'w-body-57': "rib|ribs", // 肋骨
    'w-body-58': "joint", // 關節
    'w-body-59': "skull", // 頭骨
    'w-body-60': "nerve", // 神經
    'w-science-0': "cell", // 細胞
    'w-science-1': "dna", // DNA
    'w-science-2': "atom", // 原子
    'w-science-3': "molecule", // 分子
    'w-science-4': "bacteria|germs", // 細菌
    'w-science-5': "food chain", // 食物鏈
    'w-science-6': "food web", // 食物網
    'w-science-7': "respiration", // 呼吸作用
    'w-science-8': "alcohol lamp|spirit lamp", // 酒精燈
    'w-science-9': "element", // 元素
    'w-science-10': "periodic table", // 週期表
    'w-science-11': "water molecule", // 水分子
    'w-science-12': "chemical reaction", // 化學反應
    'w-science-13': "acid and base", // 酸鹼
    'w-science-14': "litmus paper", // 石蕊試紙
    'w-science-15': "dissolve|dissolving", // 溶解
    'w-science-16': "mixture", // 混合物
    'w-science-17': "filtration|filter", // 過濾
    'w-science-18': "distillation", // 蒸餾
    'w-science-19': "electrolysis", // 電解
    'w-science-20': "oxygen", // 氧氣
    'w-science-21': "carbon dioxide|co2", // 二氧化碳
    'w-science-22': "hydrogen", // 氫氣
    'w-science-23': "metal", // 金屬
    'w-science-24': "rust|rusting", // 生鏽
    'w-science-25': "combustion|burning", // 燃燒
    'w-science-26': "pollination", // 授粉
    'w-science-27': "chloroplast", // 葉綠體
    'w-science-28': "nucleus|cell nucleus", // 細胞核
    'w-science-29': "cell membrane", // 細胞膜
    'w-science-30': "chromosome", // 染色體
    'w-science-31': "gene", // 基因
    'w-science-32': "ecosystem", // 生態系
    'w-science-33': "producer", // 生產者
    'w-science-34': "consumer", // 消費者
    'w-science-35': "decomposer", // 分解者
    'w-science-36': "parasite|parasitism", // 寄生
    'w-science-37': "symbiosis", // 共生
    'w-science-38': "hibernation", // 冬眠
    'w-science-39': "life cycle", // 生命週期
    'w-science-40': "skeleton", // 骨骼
    'w-science-41': "blood circulation", // 血液循環
    'w-science-42': "digestive system", // 消化系統
    'w-science-43': "neuron", // 神經元
    'w-science-44': "paramecium", // 草履蟲
    'w-science-45': "amoeba", // 變形蟲
    'w-science-46': "yeast", // 酵母菌
    'w-science-47': "mold", // 黴菌
    'w-science-48': "plant cell", // 植物細胞
    'w-science-49': "animal cell", // 動物細胞
    'w-science-50': "ion", // 離子
    'w-science-51': "atomic nucleus", // 原子核
    'w-science-52': "electron", // 電子
    'w-science-53': "proton", // 質子
    'w-science-54': "neutron", // 中子
    'w-science-55': "graduated cylinder|measuring cylinder", // 量筒
    'w-science-56': "dropper", // 滴管
    'w-science-57': "funnel", // 漏斗
    'w-science-58': "petri dish", // 培養皿
    'w-science-59': "experiment", // 實驗
    'w-physics-39': "inertia", // 慣性
    'w-physics-40': "magnetic field", // 磁場
    'w-physics-41': "circuit|electric circuit", // 電路
    'w-physics-42': "series circuit", // 串聯
    'w-physics-43': "parallel circuit", // 並聯
    'w-physics-44': "conductor", // 導體
    'w-physics-45': "insulator", // 絕緣體
    'w-physics-46': "centripetal force", // 向心力
    'w-physics-47': "kinetic energy", // 動能
    'w-physics-48': "potential energy", // 位能
    'w-physics-49': "spectrum", // 光譜
    'w-physics-50': "primary colors", // 三原色
    'w-physics-51': "speed of sound", // 音速
    'w-physics-52': "resonance", // 共鳴
    'w-physics-53': "tuning fork", // 音叉
    'w-physics-54': "resistance|drag", // 阻力
    'w-physics-55': "simple pendulum", // 單擺
    'w-physics-56': "collision", // 碰撞
    'w-physics-57': "diffusion", // 擴散
    'w-physics-58': "melting", // 熔化
    'w-astro-37': "total solar eclipse", // 日全食
    'w-astro-38': "nebula", // 星雲
    'w-astro-39': "star cluster", // 星團
    'w-astro-40': "fixed star|star", // 恆星
    'w-astro-41': "planet", // 行星
    'w-astro-42': "big bang", // 大爆炸
    'w-astro-43': "dark matter", // 暗物質
    'w-astro-44': "light year", // 光年
    'w-astro-45': "red giant", // 紅巨星
    'w-astro-46': "white dwarf", // 白矮星
    'w-astro-47': "neutron star", // 中子星
    'w-astro-48': "zodiac|zodiac signs", // 十二星座
    'w-astro-49': "andromeda", // 仙女座
    'w-astro-50': "ursa major|great bear", // 大熊座
    'w-astro-51': "ursa minor|little bear", // 小熊座
    'w-astro-52': "cygnus|swan constellation", // 天鵝座
    'w-astro-53': "scorpio|scorpius", // 天蠍座
    'w-astro-54': "leo", // 獅子座
    'w-astro-55': "annular eclipse", // 日環食
    'w-astro-56': "total lunar eclipse", // 月全食
    'w-astro-57': "fireball", // 火球
    'w-astro-58': "comet tail", // 彗尾
    'w-astro-59': "moons of jupiter", // 木衛
    'w-astro-60': "great red spot", // 大紅斑
    'w-astro-61': "lunar surface", // 月球表面
    'w-astro-62': "spacewalk", // 太空漫步
    'w-astro-63': "launch pad", // 發射台
    'w-astro-64': "gravitational pull", // 引力
    'w-astro-65': "ecliptic", // 黃道
    'w-astro-66': "southern cross", // 南十字星
    'w-tech-40': "charging cable", // 充電線
    'w-tech-41': "network cable|ethernet cable", // 網路線
    'w-tech-42': "power cord", // 電源線
    'w-tech-43': "headset", // 耳麥
    'w-tech-44': "voice recorder", // 錄音筆
    'w-tech-45': "digital camera", // 數位相機
    'w-tech-46': "photocopier|copier", // 影印機
    'w-tech-47': "telephone|phone", // 電話
    'w-tech-48': "video camera", // 攝影機
    'w-tech-49': "walkie-talkie|intercom", // 對講機
    'w-tech-50': "atm", // 提款機
    'w-tech-51': "cash register", // 收銀機
    'w-tech-52': "web page|webpage", // 網頁
    'w-tech-53': "browser|web browser", // 瀏覽器
    'w-tech-54': "scanner", // 掃描機
    'w-tech-55': "e-paper", // 電子紙
    'w-tech-56': "touchpad|trackpad", // 觸控板
    'w-tech-57': "adapter", // 轉接頭
    'w-tech-58': "motherboard", // 主機板
    'w-tech-59': "memory|ram", // 記憶體
    'w-tech-60': "processor|cpu", // 處理器
    'w-tech-61': "cooling fan", // 散熱風扇
    'w-tech-62': "screenshot", // 螢幕截圖
    'w-tech-63': "window", // 視窗
    'w-tech-64': "url|web address", // 網址
    'w-tech-65': "cloud computing", // 雲端運算
    'w-tech-66': "machine learning", // 機器學習
    'w-tech-67': "voice recognition|speech recognition", // 語音辨識
    'w-tech-68': "smart home", // 智慧家庭
    'w-tech-69': "gps|satellite positioning", // 衛星定位
    'w-tool-40': "mallet", // 木槌
    'w-tool-41': "rubber mallet", // 橡皮槌
    'w-tool-42': "phillips screwdriver", // 十字起子
    'w-tool-43': "dustpan", // 畚箕
    'w-tool-44': "padlock", // 掛鎖
    'w-tool-45': "work boots", // 工作靴
    'w-tool-46': "spray paint", // 噴漆
    'w-tool-47': "wood plane|plane", // 刨子
    'w-tool-48': "file", // 銼刀
    'w-tool-49': "pliers|vise grips", // 老虎鉗
    'w-tool-50': "needle nose pliers", // 尖嘴鉗
    'w-tool-51': "steel ruler", // 鋼尺
    'w-tool-52': "chalk line|ink line", // 墨斗
    'w-tool-53': "drill bit", // 鑽頭
    'w-tool-54': "hemp rope", // 麻繩
    'w-tool-55': "bench grinder", // 砂輪機
    'w-tool-56': "adjustable wrench", // 活動扳手
    'w-tool-57': "ring spanner", // 梅花扳手
    'w-tool-58': "pipe wrench", // 管鉗
    'w-tool-59': "hacksaw", // 鋼鋸
    'w-tool-60': "shovel|spade", // 圓鍬
    'w-tool-61': "carpenter square|try square", // 角尺
    'w-tool-62': "cutting machine|cutter", // 切割機
    'w-tool-63': "nail puller|pry bar", // 拔釘器
    'w-tool-64': "metal shears|tin snips", // 鐵剪
    'w-insect-0': "pupa|chrysalis", // 蛹
    'w-insect-1': "insect eggs|eggs", // 蟲卵
    'w-insect-2': "queen bee", // 蜂后
    'w-insect-3': "larva|grub", // 幼蟲
    'w-insect-4': "moth", // 飛蛾
    'w-insect-5': "wasp", // 黃蜂
    'w-insect-6': "cocoon", // 蠶繭
    'w-insect-7': "antenna|antennae", // 觸角
    'w-insect-8': "flea", // 跳蚤
    'w-insect-9': "termite", // 白蟻
    'w-insect-10': "fly swatter", // 蒼蠅拍
    'w-insect-11': "bug net|butterfly net", // 捕蟲網
    'w-insect-12': "butterfly wing", // 蝴蝶翅膀
    'w-insect-13': "longhorn beetle", // 天牛
    'w-insect-14': "worker bee", // 工蜂
    'w-insect-15': "ant colony", // 蟻群
    'w-insect-16': "spider silk", // 蜘蛛絲
    'w-insect-17': "locust", // 蝗蟲
    'w-insect-18': "aphid", // 蚜蟲
    'w-insect-19': "beetle", // 甲蟲
    'w-insect-20': "weevil", // 象鼻蟲
    'w-insect-21': "stink bug", // 椿象
    'w-insect-22': "water strider", // 水黽
    'w-insect-23': "swallowtail", // 鳳蝶
    'w-insect-24': "queen ant", // 蟻后
    'w-insect-25': "ant nest|anthill", // 蟻穴
    'w-insect-26': "molting", // 蛻皮
    'w-insect-27': "compound eye", // 複眼
    'w-insect-28': "bee sting|stinger", // 蜂針
    'w-insect-29': "swarm of bees|bee swarm", // 蜂群
    'w-insect-30': "insecticide|bug spray", // 殺蟲劑
    'w-insect-31': "insect specimen", // 昆蟲標本
    'w-insect-32': "insect chirping", // 蟲鳴
    'w-insect-33': "butterfly pupa", // 蝶蛹
    'w-insect-34': "mosquito larva|wriggler", // 孑孓
    'w-insect-35': "dung beetle", // 糞金龜
    'w-insect-36': "louse|lice", // 蝨子
    'w-insect-37': "scorpion", // 蠍子
    'w-insect-38': "hornet", // 大黃蜂
    'w-insect-39': "cabbage white butterfly", // 紋白蝶
    'w-insect-40': "mosquito bite", // 蚊子包
    'w-insect-41': "drone bee", // 雄蜂
    'w-insect-42': "earwig", // 蠼螋
    'w-insect-43': "mole cricket", // 螻蛄
    'w-insect-44': "mayfly", // 蜉蝣
    'w-insect-45': "silverfish", // 蠹魚
    'w-insect-46': "rove beetle", // 隱翅蟲
    'w-insect-47': "antlion", // 蟻獅
    'w-insect-48': "cicada shell", // 蟬蛻
    'w-insect-49': "jumping spider", // 蠅虎
    'w-bird-0': "bird egg", // 鳥蛋
    'w-bird-1': "feather", // 羽毛
    'w-bird-2': "beak|bird beak", // 鳥嘴
    'w-bird-3': "wing", // 翅膀
    'w-bird-4': "chick|baby bird", // 雛鳥
    'w-bird-5': "bird claw|talon", // 鳥爪
    'w-bird-6': "mandarin duck", // 鴛鴦
    'w-bird-7': "wild goose", // 大雁
    'w-bird-8': "crane", // 鶴
    'w-bird-9': "hatching eggs|incubate", // 孵蛋
    'w-bird-10': "hatch", // 破殼
    'w-bird-11': "nesting|build a nest", // 築巢
    'w-bird-12': "soaring|flying", // 飛翔
    'w-bird-13': "rooster comb|comb", // 雞冠
    'w-bird-14': "tail feather", // 尾羽
    'w-bird-15': "birdsong", // 鳥鳴
    'w-bird-16': "kingfisher", // 翠鳥
    'w-bird-17': "myna", // 八哥
    'w-bird-18': "thrush", // 畫眉
    'w-bird-19': "bulbul", // 白頭翁
    'w-bird-20': "night heron", // 夜鷺
    'w-bird-21': "cormorant", // 鸕鶿
    'w-bird-22': "vulture", // 禿鷹
    'w-bird-23': "falcon", // 獵鷹
    'w-bird-24': "cuckoo", // 布穀鳥
    'w-bird-25': "robin", // 知更鳥
    'w-bird-26': "canary", // 金絲雀
    'w-bird-27': "hill myna", // 九官鳥
    'w-bird-28': "java sparrow|finch", // 文鳥
    'w-bird-29': "hornbill", // 犀鳥
    'w-bird-30': "kiwi", // 奇異鳥
    'w-bird-31': "emu", // 鴯鶓
    'w-bird-32': "skylark|lark", // 雲雀
    'w-bird-33': "quail", // 鵪鶉
    'w-bird-34': "spoonbill", // 琵鷺
    'w-bird-35': "storm petrel|petrel", // 海燕
    'w-bird-36': "migratory bird", // 候鳥
    'w-bird-37': "migration", // 遷徙
    'w-bird-38': "flock of birds|flock", // 鳥群
    'w-bird-39': "spread wings", // 展翅
    'w-bird-40': "molting feathers", // 換羽
    'w-bird-41': "bird feed|birdseed", // 鳥食
    'w-bird-42': "black drongo|drongo", // 烏秋
    'w-bird-43': "japanese white-eye|white-eye", // 綠繡眼
    'w-bird-44': "taiwan barbet|barbet", // 五色鳥
    'w-bird-45': "white stork|stork", // 白鸛
    'w-bird-46': "grey heron|heron", // 蒼鷺
    'w-bird-47': "shrike", // 伯勞
    'w-bird-48': "hoopoe", // 戴勝
    'w-bird-49': "sandpiper", // 鷸
    'w-animal-140': "black cat", // 黑貓
    'w-animal-141': "orange cat|ginger cat", // 橘貓
    'w-animal-142': "pony|foal", // 小馬
    'w-animal-143': "hare", // 野兔
    'w-animal-144': "chipmunk", // 花栗鼠
    'w-animal-145': "cobra", // 眼鏡蛇
    'w-animal-146': "tree frog", // 樹蛙
    'w-animal-147': "ivory|tusk", // 象牙
    'w-animal-148': "horn", // 牛角
    'w-animal-149': "antlers|antler", // 鹿角
    'w-animal-150': "hoof|horseshoe", // 馬蹄
    'w-animal-151': "beaver", // 河狸
    'w-animal-152': "chihuahua", // 吉娃娃
    'w-animal-153': "police dog", // 警犬
    'w-animal-154': "corgi", // 柯基
    'w-animal-155': "white cat", // 白貓
    'w-animal-156': "bear cub", // 小熊
    'w-animal-157': "baby elephant", // 小象
    'w-animal-158': "bunny", // 小兔
    'w-animal-159': "siamese cat", // 暹羅貓
    'w-animal-160': "persian cat", // 波斯貓
    'w-animal-161': "calico cat", // 三花貓
    'w-animal-162': "tabby cat", // 虎斑貓
    'w-animal-163': "pug", // 巴哥犬
    'w-animal-164': "samoyed", // 薩摩耶
    'w-animal-165': "pomeranian", // 博美犬
    'w-animal-166': "beagle", // 米格魯
    'w-animal-167': "bulldog", // 鬥牛犬
    'w-animal-168': "orangutan", // 紅毛猩猩
    'w-animal-169': "macaque", // 獼猴
    'w-animal-170': "lemur", // 狐猴
    'w-animal-171': "tarsier", // 眼鏡猴
    'w-animal-172': "spider monkey", // 蜘蛛猴
    'w-animal-173': "flying squirrel", // 飛鼠
    'w-animal-174': "guinea pig", // 豚鼠
    'w-animal-175': "rattlesnake", // 響尾蛇
    'w-animal-176': "python", // 蟒蛇
    'w-animal-177': "iguana", // 鬣蜥
    'w-animal-178': "poison frog|poison dart frog", // 毒蛙
    'w-animal-179': "porcupine", // 豪豬
    'w-animal-180': "lynx", // 猞猁
    'w-animal-181': "honey badger", // 蜜獾
    'w-animal-182': "hyena", // 鬣狗
    'w-animal-183': "moose", // 駝鹿
    'w-animal-184': "wild horse|mustang", // 野馬
    'w-animal-185': "mule", // 騾子
    'w-animal-186': "fang|tusk", // 獠牙
    'w-animal-187': "lion mane|mane", // 獅鬃
    'w-animal-188': "doghouse", // 狗窩
    'w-animal-189': "cat paw|paw", // 貓爪
    'w-animal-190': "echidna", // 針鼴
    'w-animal-191': "proboscis monkey", // 長鼻猴
    'w-animal-192': "aye-aye", // 指猴
    'w-animal-193': "shrew", // 鼩鼱
    'w-animal-194': "tapir", // 貘
    'w-animal-195': "mandrill", // 山魈
    'w-animal-196': "wombat", // 袋熊
    'w-animal-197': "red panda", // 小熊貓
    'w-animal-198': "bobcat|wildcat", // 山貓
    'w-animal-199': "llama", // 駱馬
    'w-plant-40': "bouquet", // 花束
    'w-plant-41': "daisy", // 雛菊
    'w-plant-42': "oak", // 橡樹
    'w-plant-43': "stamen|pistil", // 花蕊
    'w-plant-44': "thorns|bramble", // 荊棘
    'w-plant-45': "weeds|wild grass", // 野草
    'w-plant-46': "blade of grass", // 小草
    'w-plant-47': "bamboo leaf", // 竹葉
    'w-plant-48': "flower bush", // 花叢
    'w-plant-49': "dead leaf", // 枯葉
    'w-plant-50': "young leaf", // 嫩葉
    'w-plant-51': "wisteria", // 紫藤
    'w-plant-52': "osmanthus", // 桂花
    'w-plant-53': "camellia", // 山茶花
    'w-plant-54': "gardenia", // 梔子花
    'w-plant-55': "magnolia", // 玉蘭花
    'w-plant-56': "moth orchid", // 蝴蝶蘭
    'w-plant-57': "marigold", // 金盞花
    'w-plant-58': "violet", // 紫羅蘭
    'w-plant-59': "pansy", // 三色堇
    'w-plant-60': "flame tree flower|royal poinciana", // 鳳凰花
    'w-plant-61': "kapok flower|cotton tree flower", // 木棉花
    'w-plant-62': "golden shower tree", // 阿勃勒
    'w-plant-63': "baby's breath", // 滿天星
    'w-plant-64': "foxtail grass|foxtail", // 狗尾草
    'w-plant-65': "silvergrass|miscanthus", // 芒草
    'w-plant-66': "grapevine", // 葡萄藤
    'w-plant-67': "flower stem|stem", // 花莖
    'w-plant-68': "sprout|shoot", // 嫩芽
    'w-plant-69': "lotus seedpod", // 蓮蓬
    'w-plant-70': "sweetgum", // 楓香
    'w-plant-71': "parasol tree|plane tree", // 梧桐
    'w-plant-72': "olive tree", // 橄欖樹
    'w-plant-73': "lisianthus", // 洋桔梗
    'w-plant-74': "iris|sweet flag", // 菖蒲
    'w-plant-75': "wood sorrel|oxalis", // 酢漿草
    'w-plant-76': "iris flower", // 鳶尾花
    'w-plant-77': "calla lily", // 海芋
    'w-plant-78': "red spider lily|spider lily", // 彼岸花
    'w-plant-79': "snake plant", // 虎尾蘭
    'w-ocean-40': "school of fish", // 魚群
    'w-ocean-41': "bubble|air bubble", // 氣泡
    'w-ocean-42': "seabed|sea floor", // 海底
    'w-ocean-43': "seawater", // 海水
    'w-ocean-44': "fin", // 魚鰭
    'w-ocean-45': "fish scale|scales", // 魚鱗
    'w-ocean-46': "fish tail", // 魚尾
    'w-ocean-47': "fish bone|fishbone", // 魚骨
    'w-ocean-48': "whale tail", // 鯨尾
    'w-ocean-49': "fish eye", // 魚眼
    'w-ocean-50': "aquarium", // 水族箱
    'w-ocean-51': "fish mouth", // 魚嘴
    'w-ocean-52': "sea otter", // 海獺
    'w-ocean-53': "sea snake", // 海蛇
    'w-ocean-54': "conger eel|moray eel", // 海鰻
    'w-ocean-55': "gills|gill", // 魚鰓
    'w-ocean-56': "mantis shrimp", // 皮皮蝦
    'w-ocean-57': "king crab", // 帝王蟹
    'w-ocean-58': "fiddler crab", // 招潮蟹
    'w-ocean-59': "grouper", // 石斑魚
    'w-ocean-60': "cod", // 鱈魚
    'w-ocean-61': "mackerel", // 鯖魚
    'w-ocean-62': "kelp", // 海帶
    'w-ocean-63': "jellyfish|sea jelly", // 海蜇
    'w-ocean-64': "treasure", // 寶藏
    'w-ocean-65': "sea slug", // 海蛞蝓
    'w-ocean-66': "krill", // 磷蝦
    'w-ocean-67': "sakura shrimp", // 櫻花蝦
    'w-ocean-68': "sea lily", // 海百合
    'w-ocean-69': "sea squirt", // 海鞘
    'w-nature-91': "mountain peak|peak", // 山峰
    'w-nature-92': "rock", // 岩石
    'w-nature-93': "creek|brook", // 小河
    'w-nature-94': "woods|grove", // 樹林
    'w-nature-95': "lawn", // 草坪
    'w-nature-96': "snowfield|snowy ground", // 雪地
    'w-nature-97': "moonlight", // 月光
    'w-nature-98': "sunshine|sunlight", // 陽光
    'w-nature-99': "night sky", // 夜空
    'w-nature-100': "hillock", // 山丘
    'w-nature-101': "sandy ground", // 沙地
    'w-nature-102': "river bank", // 江岸
    'w-nature-103': "treetop", // 樹梢
    'w-nature-104': "snowy slope", // 雪坡
    'w-nature-105': "cave", // 洞穴
    'w-nature-106': "horizon", // 地平線
    'w-nature-107': "coniferous forest|pine forest", // 針葉林
    'w-nature-108': "mountain spring", // 山泉
    'w-nature-109': "quicksand", // 流沙
    'w-nature-110': "shade|tree shade", // 樹蔭
    'w-nature-111': "wilderness", // 荒野
    'w-nature-112': "peninsula", // 半島
    'w-nature-113': "river mouth|estuary", // 河口
    'w-nature-114': "mountainside", // 山腰
    'w-nature-115': "cliff face|steep cliff", // 峭壁
    'w-nature-116': "ice field", // 冰原
    'w-nature-117': "ore|mineral", // 礦石
    'w-nature-118': "lake water", // 湖水
    'w-nature-119': "lakeside", // 湖畔
    'w-nature-120': "mountain stream", // 山澗
    'w-nature-121': "sea cliff", // 海崖
    'w-nature-122': "strait", // 海峽
    'w-nature-123': "riverbed", // 河床
    'w-nature-124': "open field|prairie", // 曠野
    'w-nature-125': "grain of sand", // 沙粒
    'w-nature-126': "rock wall", // 岩壁
    'w-nature-127': "ice cave", // 冰洞
    'w-nature-128': "karst cave", // 溶洞
    'w-phenomenon-49': "light rain|drizzle", // 小雨
    'w-phenomenon-50': "breeze|gentle breeze", // 微風
    'w-phenomenon-51': "sunny day|sunny", // 晴天
    'w-phenomenon-52': "cloudy day|overcast", // 陰天
    'w-phenomenon-53': "snowmelt|melting snow", // 融雪
    'w-phenomenon-54': "windy|wind rising", // 起風
    'w-phenomenon-55': "wind and rain", // 風雨
    'w-phenomenon-56': "raindrop", // 雨滴
    'w-phenomenon-57': "hurricane", // 颶風
    'w-phenomenon-58': "frost", // 下霜
    'w-phenomenon-59': "steam|water vapor", // 水蒸氣
    'w-phenomenon-60': "whirlpool|vortex", // 漩渦
    'w-phenomenon-61': "reflection", // 倒影
    'w-phenomenon-62': "evening|dusk", // 傍晚
    'w-phenomenon-63': "noon|midday", // 正午
    'w-phenomenon-64': "mist", // 雲霧
    'w-phenomenon-65': "sinkhole", // 地陷
    'w-phenomenon-66': "double rainbow", // 雙彩虹
    'w-phenomenon-67': "waterspout", // 水龍捲
    'w-phenomenon-68': "thunderclap|rumble of thunder", // 雷鳴
    'w-dino-30': "dinosaur footprint|dinosaur track", // 恐龍腳印
    'w-dino-31': "carnivorous dinosaur|meat-eating dinosaur", // 肉食恐龍
    'w-dino-32': "herbivorous dinosaur|plant-eating dinosaur", // 草食恐龍
    'w-dino-33': "baby dinosaur", // 恐龍寶寶
    'w-dino-34': "diplodocus", // 梁龍
    'w-dino-35': "ceratopsian|horned dinosaur", // 角龍
    'w-dino-36': "hadrosaur|duck-billed dinosaur", // 鴨嘴龍
    'w-dino-37': "cretaceous period|cretaceous", // 白堊紀
    'w-dino-38': "allosaurus", // 異特龍
    'w-dino-39': "pachycephalosaurus", // 厚頭龍
    'w-myth-0': "zeus", // 宙斯
    'w-myth-1': "athena", // 雅典娜
    'w-myth-2': "apollo", // 阿波羅
    'w-myth-3': "poseidon", // 波賽頓
    'w-myth-4': "hades", // 冥王
    'w-myth-5': "cupid", // 邱比特
    'w-myth-6': "god of war", // 戰神
    'w-myth-7': "dionysus", // 酒神
    'w-myth-8': "medusa", // 美杜莎
    'w-myth-9': "pandoras box|pandora box", // 潘朵拉盒子
    'w-myth-10': "hercules", // 海克力斯
    'w-myth-11': "prometheus", // 普羅米修斯
    'w-myth-12': "odin", // 奧丁
    'w-myth-13': "fenrir", // 芬里爾
    'w-myth-14': "world tree|yggdrasil", // 世界樹
    'w-myth-15': "valkyrie", // 女武神
    'w-myth-16': "loki", // 洛基
    'w-myth-17': "minotaur", // 牛頭怪
    'w-myth-18': "hydra", // 九頭蛇
    'w-myth-19': "chimera", // 奇美拉
    'w-myth-20': "sphinx", // 斯芬克斯
    'w-myth-21': "anubis", // 阿努比斯
    'w-myth-22': "sun god", // 太陽神
    'w-myth-23': "scarab", // 聖甲蟲
    'w-myth-24': "eye of horus", // 荷魯斯之眼
    'w-myth-25': "queen mother of the west", // 西王母
    'w-myth-26': "immortal peach", // 蟠桃
    'w-myth-27': "pangu", // 盤古
    'w-myth-28': "jingwei filling the sea", // 精衛填海
    'w-myth-29': "kuafu chasing the sun", // 夸父追日
    'w-myth-30': "erlang shen", // 二郎神
    'w-myth-31': "chiyou", // 蚩尤
    'w-myth-32': "shennong", // 神農
    'w-myth-33': "fuxi", // 伏羲
    'w-myth-34': "amaterasu", // 天照大神
    'w-myth-35': "yamata no orochi", // 八岐大蛇
    'w-myth-36': "urashima taro", // 浦島太郎
    'w-myth-37': "princess kaguya", // 輝夜姬
    'w-myth-38': "snow woman|yuki onna", // 雪女
    'w-myth-39': "kraken", // 克拉肯
    'w-myth-40': "xingtian", // 刑天
    'w-myth-41': "yinglong", // 應龍
    'w-myth-42': "qilin", // 麒麟
    'w-myth-43': "pixiu", // 貔貅
    'w-myth-44': "baize", // 白澤
    'w-myth-45': "taotie", // 饕餮
    'w-myth-46': "classic of mountains and seas", // 山海經
    'w-myth-47': "atlas", // 阿特拉斯
    'w-myth-48': "the fates", // 命運女神
    'w-myth-49': "golden fleece", // 金羊毛
    'w-myth-50': "achilles", // 阿基里斯
    'w-myth-51': "icarus", // 伊卡洛斯
    'w-myth-52': "king midas", // 彌達斯
    'w-myth-53': "mount olympus", // 奧林帕斯山
    'w-myth-54': "bifrost|rainbow bridge", // 彩虹橋
    'w-myth-55': "valhalla", // 瓦爾哈拉
    'w-myth-56': "sword in the stone", // 石中劍
    'w-myth-57': "orpheus", // 奧菲斯
    'w-myth-58': "river styx", // 冥河
    'w-fantasy-85': "divine dragon", // 神龍
    'w-fantasy-86': "magic shoes", // 魔法鞋
    'w-fantasy-87': "magic egg", // 魔法蛋
    'w-fantasy-88': "magic flower", // 魔法花
    'w-fantasy-89': "magic key", // 魔法鑰匙
    'w-fantasy-90': "elf", // 精靈
    'w-fantasy-91': "monster", // 怪獸
    'w-fantasy-92': "immortal|deity", // 神仙
    'w-fantasy-93': "invisible man", // 隱形人
    'w-fantasy-94': "transform", // 變形
    'w-fantasy-95': "fairy folk|sprite", // 妖精
    'w-fantasy-96': "ogre", // 食人魔
    'w-fantasy-97': "spell", // 咒語
    'w-fantasy-98': "curse", // 詛咒
    'w-fantasy-99': "enchanted forest", // 魔法森林
    'w-fantasy-100': "magic school", // 魔法學院
    'w-fantasy-101': "floating island", // 浮空島
    'w-fantasy-102': "castle in the sky", // 空中城堡
    'w-fantasy-103': "undersea kingdom", // 海底王國
    'w-fantasy-104': "dragon rider", // 龍騎士
    'w-fantasy-105': "frost giant", // 冰霜巨人
    'w-fantasy-106': "fire magic", // 火焰魔法
    'w-fantasy-107': "crystal cave", // 水晶洞
    'w-fantasy-108': "magic mushroom", // 魔法蘑菇
    'w-fantasy-109': "misty forest", // 迷霧森林
    'w-fantasy-110': "dark knight", // 暗黑騎士
    'w-fantasy-111': "paladin", // 聖騎士
    'w-fantasy-112': "orc", // 獸人
    'w-fantasy-113': "dwarf", // 矮人
    'w-fantasy-114': "magic ring", // 魔法戒指
    'w-fantasy-115': "water spirit", // 水精靈
    'w-fantasy-116': "wind spirit", // 風精靈
    'w-fantasy-117': "transformation potion", // 變身藥水
    'w-fantasy-118': "alchemy", // 煉金術
    'w-fantasy-119': "philosophers stone", // 賢者之石
    'w-fantasy-120': "parallel world", // 平行世界
    'w-fantasy-121': "summoning", // 召喚術
    'w-fantasy-122': "magic barrier", // 結界
    'w-fantasy-123': "prophet|seer", // 預言家
    'w-fantasy-124': "time traveler", // 時空旅人
    'w-fairy-40': "shepherd boy", // 牧羊童
    'w-fairy-41': "farmer and the snake", // 農夫與蛇
    'w-fairy-42': "lion and the mouse", // 獅子與老鼠
    'w-fairy-43': "ant and the grasshopper", // 螞蟻與蚱蜢
    'w-fairy-44': "goldilocks", // 金髮女孩
    'w-fairy-45': "prince charming", // 白馬王子
    'w-fairy-46': "three bears", // 三隻熊
    'w-fairy-47': "little match girl", // 賣火柴女孩
    'w-fairy-48': "tom thumb", // 拇指湯姆
    'w-fairy-49': "nightingale and the rose", // 夜鶯與玫瑰
    'w-fairy-50': "goose girl", // 牧鵝女孩
    'w-fairy-51': "steadfast tin soldier", // 小錫兵
    'w-fairy-52': "red shoes", // 紅鞋子
    'w-fairy-53': "wild swans", // 野天鵝
    'w-fairy-54': "snail maiden", // 田螺姑娘
    'w-fairy-55': "magic paintbrush", // 神筆
    'w-fairy-56': "mouse wedding", // 老鼠娶親
    'w-fairy-57': "golden goose", // 金鵝
    'w-fairy-58': "elves and the shoemaker", // 鞋匠與小精靈
    'w-fairy-59': "three wishes", // 三個願望
    'w-idiom-92': "buy the box return the pearl", // 買櫝還珠
    'w-idiom-93': "bore a hole for light", // 鑿壁借光
    'w-idiom-94': "tie hair to beam", // 懸樑刺股
    'w-idiom-95': "study by firefly light", // 囊螢映雪
    'w-idiom-96': "mencius mother moves three times", // 孟母三遷
    'w-idiom-97': "besiege wei to save zhao", // 圍魏救趙
    'w-idiom-98': "recommend oneself", // 毛遂自薦
    'w-idiom-99': "donkey of qian out of tricks", // 黔驢技窮
    'w-idiom-100': "arrogant like yelang", // 夜郎自大
    'w-idiom-101': "learn to walk in handan", // 邯鄲學步
    'w-idiom-102': "crane among chickens", // 鶴立雞群
    'w-idiom-103': "pass fish eyes as pearls", // 魚目混珠
    'w-idiom-104': "fight fire with firewood", // 抱薪救火
    'w-idiom-105': "look for a horse by its picture", // 按圖索驥
    'w-idiom-106': "one cry amazes all", // 一鳴驚人
    'w-idiom-107': "build a cart behind closed doors", // 閉門造車
    'w-idiom-108': "hard to get off a tiger", // 騎虎難下
    'w-idiom-109': "borrow arrows with straw boats", // 草船借箭
    'w-idiom-110': "so happy forget shu", // 樂不思蜀
    'w-idiom-111': "paper price soars in luoyang", // 洛陽紙貴
    'w-idiom-112': "penetrate the wood deeply", // 入木三分
    'w-idiom-113': "broken mirror made whole", // 破鏡重圓
    'w-idiom-114': "grind an iron rod into a needle", // 鐵杵磨針
    'w-idiom-115': "dove takes magpie nest", // 鳩佔鵲巢
    'w-idiom-116': "bird frightened by bow", // 驚弓之鳥
    'w-idiom-117': "kill the hen for eggs", // 殺雞取卵
    'w-idiom-118': "cook the hound after the hare dies", // 兔死狗烹
    'w-idiom-119': "mantis stops a cart", // 螳臂擋車
    'w-idiom-120': "silkworm traps itself in a cocoon", // 作繭自縛
    'w-idiom-121': "friendship of guan and bao", // 管鮑之交
    'w-history-182': "yin ruins", // 殷墟
    'w-history-183': "emperor wu of han", // 漢武帝
    'w-history-184': "xuanzang", // 玄奘
    'w-history-185': "jianzhen", // 鑑真
    'w-history-186': "huo qubing", // 霍去病
    'w-history-187': "sima guang", // 司馬光
    'w-history-188': "zu chongzhi", // 祖沖之
    'w-history-189': "huang daopo", // 黃道婆
    'w-history-190': "zhou yu", // 周瑜
    'w-history-191': "zhao yun", // 趙雲
    'w-history-192': "di renjie", // 狄仁傑
    'w-history-193': "wei zheng", // 魏徵
    'w-history-194': "shang yang", // 商鞅
    'w-history-195': "mozi", // 墨子
    'w-history-196': "guan zhong", // 管仲
    'w-history-197': "vasco da gama", // 達伽馬
    'w-history-198': "hans christian andersen|andersen", // 安徒生
    'w-history-199': "homer", // 荷馬
    'w-history-200': "dante", // 但丁
    'w-history-201': "goethe", // 歌德
    'w-history-202': "tolstoy", // 托爾斯泰
    'w-history-203': "victor hugo|hugo", // 雨果
    'w-history-204': "tchaikovsky", // 柴可夫斯基
    'w-history-205': "rembrandt", // 林布蘭
    'w-history-206': "renoir", // 雷諾瓦
    'w-history-207': "feast at hongmen", // 鴻門宴
    'w-history-208': "battle of guandu", // 官渡之戰
    'w-history-209': "an lushan rebellion", // 安史之亂
    'w-history-210': "hundred days reform", // 戊戌變法
    'w-history-211': "epang palace", // 阿房宮
    'w-geography-188': "taichung", // 台中
    'w-geography-189': "taitung", // 台東
    'w-geography-190': "yilan", // 宜蘭
    'w-geography-191': "taiping mountain", // 太平山
    'w-geography-192': "hsinchu", // 新竹
    'w-geography-193': "chiayi", // 嘉義
    'w-geography-194': "changhua", // 彰化
    'w-geography-195': "beitou", // 北投
    'w-geography-196': "lukang", // 鹿港
    'w-geography-197': "taipei", // 台北
    'w-geography-198': "kaohsiung", // 高雄
    'w-geography-199': "tainan", // 台南
    'w-geography-200': "hualien", // 花蓮
    'w-geography-201': "melbourne", // 墨爾本
    'w-geography-202': "toronto", // 多倫多
    'w-geography-203': "chicago", // 芝加哥
    'w-geography-204': "seattle", // 西雅圖
    'w-geography-205': "munich", // 慕尼黑
    'w-geography-206': "vienna", // 維也納
    'w-geography-207': "prague", // 布拉格
    'w-geography-208': "barcelona", // 巴塞隆納
    'w-geography-209': "madrid", // 馬德里
    'w-geography-210': "milan", // 米蘭
    'w-geography-211': "florence", // 佛羅倫斯
    'w-geography-212': "athens", // 雅典
    'w-geography-213': "copenhagen", // 哥本哈根
    'w-geography-214': "new delhi", // 新德里
    'w-geography-215': "kuala lumpur", // 吉隆坡
    'w-geography-216': "hanoi", // 河內
    'w-geography-217': "croatia", // 克羅埃西亞
    'w-geography-218': "scotland", // 蘇格蘭
    'w-geography-219': "venezuela", // 委內瑞拉
    'w-geography-220': "tanzania", // 坦尚尼亞
    'w-geography-221': "pakistan", // 巴基斯坦
    'w-geography-222': "kazakhstan", // 哈薩克
    'w-geography-223': "vancouver", // 溫哥華
    'w-geography-224': "miami", // 邁阿密
    'w-geography-225': "boston", // 波士頓
    'w-geography-226': "geneva", // 日內瓦
    'w-geography-227': "zurich", // 蘇黎世
    'w-trend-95': "smart lock", // 智慧門鎖
    'w-trend-96': "fitness band", // 運動手環
    'w-trend-97': "chasing idols", // 追星
    'w-trend-98': "photo filter", // 濾鏡
    'w-trend-99': "climate change", // 氣候變遷
    'w-trend-100': "hydrogen energy", // 氫能源
    'w-trend-101': "carbon credit", // 碳權
    'w-trend-102': "side hustle", // 斜槓
    'w-trend-103': "air fryer", // 空氣炸鍋
    'w-trend-104': "e-wallet|digital wallet", // 電子錢包
    'w-trend-105': "cashless", // 無現金
    'w-trend-106': "telemedicine", // 遠距醫療
    'w-trend-107': "virtual streamer|vtuber", // 虛擬主播
    'w-trend-108': "quantum computer", // 量子電腦
    'w-trend-109': "nuclear fusion", // 核融合
    'w-trend-110': "moon base", // 月球基地
    'w-trend-111': "ride hailing", // 叫車
    'w-trend-112': "carpool", // 共乘
    'w-trend-113': "smart city", // 智慧城市
    'w-trend-114': "internet of things", // 物聯網
    'w-trend-115': "blockchain", // 區塊鏈
    'w-trend-116': "augmented reality", // 擴增實境
    'w-trend-117': "smart glasses", // 智慧眼鏡
    'w-trend-118': "brain computer interface", // 腦機介面
    'w-trend-119': "gene editing", // 基因編輯
    'w-trend-120': "reusable bag|tote bag", // 環保袋
    'w-trend-121': "metal straw", // 金屬吸管
    'w-trend-122': "home delivery", // 宅配
    'w-trend-123': "pickup locker", // 取餐櫃
    'w-trend-124': "binge watching", // 追劇
    'w-home-166': "pen holder|pencil cup", // 筆筒
    'w-home-167': "coffee table", // 茶几
    'w-home-168': "round table", // 圓桌
    'w-home-169': "stool|bench", // 板凳
    'w-home-170': "rocking chair", // 搖椅
    'w-home-171': "hammock", // 吊床
    'w-home-172': "straw mat", // 草蓆
    'w-home-173': "pillowcase", // 枕套
    'w-home-174': "bed sheet", // 床單
    'w-home-175': "washbasin", // 臉盆
    'w-home-176': "bathtub basin", // 澡盆
    'w-home-177': "sink", // 水槽
    'w-home-178': "clothes basket", // 衣籃
    'w-home-179': "wind chime", // 風鈴
    'w-home-180': "mattress", // 床墊
    'w-home-181': "recliner|deck chair", // 躺椅
    'w-home-182': "nightstand", // 床頭櫃
    'w-home-183': "tv cabinet", // 電視櫃
    'w-home-184': "shoe rack", // 鞋架
    'w-home-185': "bookcase", // 書櫃
    'w-home-186': "round stool", // 圓凳
    'w-home-187': "clothespin", // 衣夾
    'w-home-188': "shoe brush", // 鞋刷
    'w-home-189': "hand soap", // 洗手乳
    'w-home-190': "low stool", // 矮凳
    'w-home-191': "bedside lamp", // 床頭燈
    'w-home-192': "doorstop", // 門擋
    'w-home-193': "coat rack", // 衣帽架
    'w-home-194': "umbrella stand", // 雨傘架
    'w-home-195': "doormat|floor mat", // 腳踏墊
    'w-home-196': "door curtain", // 門簾
    'w-home-197': "window screen", // 紗窗
    'w-home-198': "windowsill", // 窗台
    'w-home-199': "blinds", // 百葉窗
    'w-home-200': "toothpick", // 牙籤
    'w-home-201': "rinse cup", // 漱口杯
    'w-home-202': "soap dish", // 肥皂盒
    'w-home-203': "hand towel", // 擦手巾
    'w-home-204': "bath towel", // 浴巾
    'w-home-205': "water ladle", // 水瓢
    'w-home-206': "tea tray", // 茶盤
    'w-home-207': "tray", // 托盤
    'w-home-208': "fruit plate", // 果盤
    'w-home-209': "thermos cup", // 保溫杯
    'w-home-210': "tissue box", // 面紙盒
    'w-home-211': "blanket", // 毛毯
    'w-home-212': "cooling mat", // 涼蓆
    'w-home-213': "electric blanket", // 電熱毯
    'w-home-214': "hot water bottle", // 熱水袋
    'w-home-215': "hand warmer", // 暖暖包
    'w-home-216': "screen door", // 紗門
    'w-home-217': "paper window decoration", // 窗花
    'w-home-218': "dressing table", // 梳妝台
    'w-home-219': "ironing board", // 熨衣板
    'w-home-220': "ball of yarn", // 毛線球
    'w-home-221': "fluorescent lamp", // 日光燈
    'w-home-222': "drawer", // 抽屜
    'w-home-223': "night light", // 夜燈
    'w-home-224': "fuse", // 保險絲
    'w-home-225': "lampshade", // 燈罩
    'w-home-226': "ceiling fan", // 吊扇
    'w-home-227': "wall clock", // 壁鐘
    'w-home-228': "wall painting", // 掛畫
    'w-home-229': "breaker box", // 分電盤
    'w-home-230': "electric kettle", // 電熱水瓶
    'w-home-231': "mosquito coil holder", // 蚊香盤
    'w-home-232': "electricity meter", // 電表
    'w-home-233': "transformer", // 變壓器
    'w-home-234': "washboard", // 洗衣板
    'w-home-235': "pin cushion", // 針插
    'w-clothes-51': "beanie|knit hat", // 毛帽
    'w-clothes-52': "leather shoes", // 皮鞋
    'w-clothes-53': "sneakers|sports shoes", // 運動鞋
    'w-clothes-54': "cloth shoes", // 布鞋
    'w-clothes-55': "bib", // 圍兜
    'w-clothes-56': "diaper", // 尿布
    'w-clothes-57': "shoelace", // 鞋帶
    'w-clothes-58': "neckerchief", // 領巾
    'w-clothes-59': "hair tie", // 髮圈
    'w-clothes-60': "swim trunks", // 泳褲
    'w-clothes-61': "shirt", // 襯衫
    'w-clothes-62': "bucket hat", // 漁夫帽
    'w-clothes-63': "peaked cap", // 鴨舌帽
    'w-clothes-64': "ankle socks", // 短襪
    'w-clothes-65': "long socks", // 長襪
    'w-clothes-66': "long sleeves", // 長袖
    'w-clothes-67': "jacket", // 夾克
    'w-clothes-68': "trench coat", // 風衣
    'w-clothes-69': "overcoat", // 大衣
    'w-clothes-70': "leather jacket", // 皮衣
    'w-clothes-71': "padded jacket", // 棉襖
    'w-clothes-72': "pleated skirt", // 百褶裙
    'w-clothes-73': "tutu|puffy skirt", // 蓬蓬裙
    'w-clothes-74': "miniskirt", // 迷你裙
    'w-clothes-75': "long skirt", // 長裙
    'w-clothes-76': "formal dress|gown", // 禮服
    'w-clothes-77': "tang suit", // 唐裝
    'w-clothes-78': "hanfu", // 漢服
    'w-clothes-79': "brooch", // 胸針
    'w-clothes-80': "headband", // 髮帶
    'w-clothes-81': "headscarf", // 頭巾
    'w-clothes-82': "stockings", // 絲襪
    'w-clothes-83': "tote bag", // 帆布袋
    'w-clothes-84': "beret", // 貝雷帽
    'w-clothes-85': "fur coat", // 皮草
    'w-clothes-86': "poncho", // 雨披
    'w-clothes-87': "straw raincoat", // 蓑衣
    'w-clothes-88': "garter", // 吊襪帶
    'w-clothes-89': "cufflinks", // 袖扣
    'w-clothes-90': "overalls|work clothes", // 工作服
    'w-school-40': "colored pencil", // 色鉛筆
    'w-school-41': "ruler|straight ruler", // 直尺
    'w-school-42': "school desk", // 課桌
    'w-school-43': "school gate", // 校門
    'w-school-44': "drawing paper", // 畫紙
    'w-school-45': "class schedule", // 課表
    'w-school-46': "bookmark", // 書籤
    'w-school-47': "pencil bag", // 鉛筆袋
    'w-school-48': "watercolor brush", // 水彩筆
    'w-school-49': "dictionary", // 字典
    'w-school-50': "contact book", // 聯絡簿
    'w-school-51': "flag raising", // 升旗
    'w-school-52': "nap time", // 午休
    'w-school-53': "essay|composition", // 作文
    'w-school-54': "arts and crafts", // 美勞
    'w-school-55': "chalk eraser", // 粉筆擦
    'w-school-56': "book cover", // 書套
    'w-school-57': "recess|class dismissed", // 下課
    'w-school-58': "class begins|attend class", // 上課
    'w-school-59': "calligraphy copybook", // 字帖
    'w-school-60': "zhuyin", // 注音符號
    'w-school-61': "midterm exam", // 段考
    'w-school-62': "school anniversary", // 校慶
    'w-school-63': "graduation ceremony", // 畢業典禮
    'w-school-64': "crossing guard", // 導護
    'w-taiwan-42': "bamboo basket", // 竹籃
    'w-taiwan-43': "rattan chair", // 藤椅
    'w-taiwan-44': "bamboo chair", // 竹椅
    'w-taiwan-45': "water tower", // 水塔
    'w-taiwan-46': "window bars", // 鐵窗
    'w-taiwan-47': "street stall", // 路邊攤
    'w-taiwan-48': "grocery store", // 雜貨店
    'w-taiwan-49': "roller shutter", // 鐵捲門
    'w-taiwan-50': "noodle stand", // 麵攤
    'w-taiwan-51': "brick wall", // 紅磚牆
    'w-taiwan-52': "phone booth", // 電話亭
    'w-taiwan-53': "betel nut stand", // 檳榔攤
    'w-taiwan-54': "train|railway", // 台鐵
    'w-taiwan-55': "receipt lottery|invoice", // 統一發票
    'w-taiwan-56': "tin house", // 鐵皮屋
    'w-taiwan-57': "outdoor stage show", // 野台戲
    'w-taiwan-58': "gongfu tea", // 功夫茶
    'w-taiwan-59': "tea set", // 茶具
    'w-taiwan-60': "clay teapot", // 紫砂壺
    'w-taiwan-61': "coach bus", // 客運
    'w-taiwan-62': "toll station", // 收費站
    'w-taiwan-63': "flea market", // 跳蚤市場
    'w-taiwan-64': "bed and breakfast|homestay", // 民宿
    'w-taiwan-65': "utility pole", // 電線桿
    'w-taiwan-66': "signboard", // 招牌
    'w-taiwan-67': "barber shop", // 理髮廳
    'w-taiwan-68': "temple parade troupe", // 陣頭
    'w-taiwan-69': "karaoke", // 卡拉OK
    'w-taiwan-70': "flower stage truck", // 電子花車
    'w-taiwan-71': "red plastic bag", // 紅色塑膠袋
    'w-taiwan-72': "traditional taste", // 古早味
    'w-taiwan-73': "highway|freeway", // 國道
    'w-taiwan-74': "temple square", // 廟口
    'w-taiwan-75': "folk toys", // 童玩
    'w-taiwan-76': "oyster rack", // 蚵架
    'w-taiwan-77': "salt pan", // 鹽田
    'w-taiwan-78': "beiguan music", // 北管
    'w-taiwan-79': "neon light", // 霓虹燈
    'w-anime-0': "doraemon", // 哆啦A夢
    'w-anime-1': "nobita", // 大雄
    'w-anime-2': "shizuka", // 靜香
    'w-anime-3': "gian", // 胖虎
    'w-anime-4': "suneo", // 小夫
    'w-anime-5': "anywhere door|dokodemo door", // 任意門
    'w-anime-6': "luffy|monkey d. luffy", // 魯夫
    'w-anime-7': "zoro", // 索隆
    'w-anime-8': "chopper", // 喬巴
    'w-anime-9': "nami", // 娜美
    'w-anime-10': "sanji", // 香吉士
    'w-anime-11': "naruto uzumaki|naruto", // 鳴人
    'w-anime-12': "sasuke", // 佐助
    'w-anime-13': "kakashi", // 卡卡西
    'w-anime-14': "gaara", // 我愛羅
    'w-anime-15': "kamehameha", // 龜派氣功
    'w-anime-16': "vegeta", // 貝吉塔
    'w-anime-17': "piccolo", // 比克
    'w-anime-18': "frieza", // 弗利沙
    'w-anime-19': "master roshi", // 龜仙人
    'w-anime-20': "kogoro mori", // 毛利小五郎
    'w-anime-21': "kaito kid|phantom thief kid", // 怪盜基德
    'w-anime-22': "professor agasa", // 阿笠博士
    'w-anime-23': "ai haibara", // 灰原哀
    'w-anime-24': "tanjiro", // 炭治郎
    'w-anime-25': "nezuko", // 禰豆子
    'w-anime-26': "zenitsu", // 善逸
    'w-anime-27': "inosuke", // 伊之助
    'w-anime-28': "hanamichi sakuragi|sakuragi", // 櫻木花道
    'w-anime-29': "kaede rukawa|rukawa", // 流川楓
    'w-anime-30': "atashinchi", // 我們這一家
    'w-anime-31': "kochikame", // 烏龍派出所
    'w-anime-32': "nintama rantaro", // 忍者亂太郎
    'w-anime-33': "cardcaptor sakura", // 庫洛魔法使
    'w-anime-34': "digimon", // 數碼寶貝
    'w-anime-35': "yu-gi-oh|yugioh", // 遊戲王
    'w-anime-36': "fullmetal alchemist", // 鋼之鍊金術師
    'w-anime-37': "gintama", // 銀魂
    'w-anime-38': "haikyu|haikyuu", // 排球少年
    'w-anime-39': "prince of tennis", // 網球王子
    'w-anime-40': "captain tsubasa", // 足球小將翼
    'w-anime-41': "initial d", // 頭文字D
    'w-anime-42': "evangelion", // 福音戰士
    'w-anime-43': "gundam", // 鋼彈
    'w-anime-44': "astro boy", // 原子小金剛
    'w-anime-45': "black jack", // 怪醫黑傑克
    'w-anime-46': "candy candy", // 小甜甜
    'w-anime-47': "rose of versailles", // 凡爾賽玫瑰
    'w-anime-48': "city hunter", // 城市獵人
    'w-anime-49': "ranma", // 亂馬
    'w-anime-50': "inuyasha", // 犬夜叉
    'w-anime-51': "sesshomaru", // 殺生丸
    'w-anime-52': "yu yu hakusho", // 幽遊白書
    'w-anime-53': "shaman king", // 通靈王
    'w-anime-54': "fairy tail", // 妖精尾巴
    'w-anime-55': "jujutsu kaisen", // 咒術迴戰
    'w-anime-56': "gojo satoru|gojo", // 五條悟
    'w-anime-57': "spy x family|spy family", // 間諜家家酒
    'w-anime-58': "anya forger|anya", // 安妮亞
    'w-anime-59': "sword art online", // 刀劍神域
    'w-anime-60': "cooking master boy|chuka ichiban", // 中華一番
    'w-anime-61': "adventures of tom sawyer|tom sawyer", // 湯姆歷險記
    'w-anime-62': "heidi|heidi girl of the alps", // 小天使
    'w-anime-63': "ikkyu-san|ikkyu", // 一休和尚
    'w-anime-64': "princess mononoke", // 魔法公主
    'w-anime-65': "nausicaa", // 風之谷
    'w-anime-66': "porco rosso", // 紅豬
    'w-anime-67': "ponyo", // 波妞
    'w-anime-68': "no-face|kaonashi", // 無臉男
    'w-anime-69': "yubaba", // 湯婆婆
    'w-anime-70': "catbus|cat bus", // 貓巴士
    'w-anime-71': "soot sprite|susuwatari", // 煤炭精靈
    'w-anime-72': "squirtle", // 傑尼龜
    'w-anime-73': "bulbasaur", // 妙蛙種子
    'w-anime-74': "charmander", // 小火龍
    'w-anime-75': "eevee", // 伊布
    'w-anime-76': "snorlax", // 卡比獸
    'w-anime-77': "jigglypuff", // 胖丁
    'w-anime-78': "psyduck", // 可達鴨
    'w-anime-79': "poke ball|pokeball", // 精靈球
    'w-anime-80': "sailor moon heroine|usagi tsukino", // 月光仙子
    'w-anime-81': "tuxedo mask", // 夜禮服假面
    'w-anime-82': "ninja hattori", // 忍者哈特利
    'w-anime-83': "perman", // 小超人帕門
    'w-anime-84': "kiteretsu", // 奇天烈大百科
    'w-anime-85': "q-taro|obake no q-taro", // Q太郎
    'w-anime-86': "hiroshi nohara", // 野原廣志
    'w-anime-87': "kazama", // 風間
    'w-anime-88': "anpanman", // 麵包超人
    'w-anime-89': "baikinman", // 細菌人
    'w-anime-90': "shimajiro", // 巧虎
    'w-anime-91': "hello kitty", // 凱蒂貓
    'w-anime-92': "my melody", // 美樂蒂
    'w-anime-93': "cinnamoroll", // 大耳狗
    'w-anime-94': "pompompurin", // 布丁狗
    'w-anime-95': "kuromi", // 酷洛米
    'w-anime-96': "gudetama", // 蛋黃哥
    'w-anime-97': "sumikko gurashi", // 角落生物
    'w-anime-98': "rilakkuma", // 拉拉熊
    'w-anime-99': "miffy", // 米飛兔
    'w-anime-100': "moomin", // 嚕嚕米
    'w-anime-101': "snoopy", // 史努比
    'w-anime-102': "garfield", // 加菲貓
    'w-anime-103': "mickey mouse|mickey", // 米老鼠
    'w-anime-104': "minnie mouse|minnie", // 米妮
    'w-anime-105': "donald duck", // 唐老鴨
    'w-anime-106': "goofy", // 高飛
    'w-anime-107': "pluto the dog|pluto", // 布魯托
    'w-anime-108': "winnie the pooh|pooh", // 小熊維尼
    'w-anime-109': "tigger", // 跳跳虎
    'w-anime-110': "eeyore", // 屹耳
    'w-anime-111': "stitch", // 史迪奇
    'w-anime-112': "buzz lightyear", // 巴斯光年
    'w-anime-113': "woody", // 胡迪
    'w-anime-114': "little green men|toy story aliens", // 三眼怪
    'w-anime-115': "nemo", // 尼莫
    'w-anime-116': "dory", // 多莉
    'w-anime-117': "lightning mcqueen", // 閃電麥坤
    'w-anime-118': "elsa", // 艾莎
    'w-anime-119': "anna", // 安娜
    'w-anime-120': "simba", // 辛巴
    'w-anime-121': "pumbaa", // 彭彭
    'w-anime-122': "timon", // 丁滿
    'w-anime-123': "genie", // 神燈精靈
    'w-anime-124': "princess jasmine|jasmine", // 茉莉公主
    'w-anime-125': "belle", // 貝兒
    'w-anime-126': "ariel", // 愛麗兒
    'w-anime-127': "chip and dale|chip n dale", // 奇奇蒂蒂
    'w-anime-128': "spongebob|spongebob squarepants", // 海綿寶寶
    'w-anime-129': "patrick star|patrick", // 派大星
    'w-anime-130': "squidward", // 章魚哥
    'w-anime-131': "mr. krabs|mr krabs", // 蟹老闆
    'w-anime-132': "tom cat|tom", // 湯姆貓
    'w-anime-133': "jerry mouse|jerry", // 傑利鼠
    'w-anime-134': "bugs bunny", // 兔巴哥
    'w-anime-135': "tweety|tweety bird", // 崔弟
    'w-anime-136': "road runner", // 嗶嗶鳥
    'w-anime-137': "wile e. coyote|wile e coyote", // 威利狼
    'w-anime-138': "peppa pig", // 粉紅豬小妹
    'w-anime-139': "teletubbies", // 天線寶寶
    'w-anime-140': "paw patrol", // 汪汪隊
    'w-anime-141': "dora the explorer|dora", // 朵拉
    'w-anime-142': "minions|minion", // 小小兵
    'w-anime-143': "despicable me", // 神偷奶爸
    'w-anime-144': "shrek", // 史瑞克
    'w-anime-145': "puss in boots", // 鞋貓劍客
    'w-anime-146': "ice age movie|ice age", // 冰原歷險記
    'w-anime-147': "rio", // 里約大冒險
    'w-anime-148': "the smurfs|smurfs", // 藍色小精靈
    'w-anime-149': "the simpsons|simpsons", // 辛普森家庭
    'w-anime-150': "adventure time", // 探險活寶
    'w-anime-151': "powerpuff girls", // 飛天小女警
    'w-anime-152': "scooby-doo|scooby doo", // 史酷比
    'w-anime-153': "teenage mutant ninja turtles|ninja turtles", // 忍者龜
    'w-anime-154': "power rangers", // 金剛戰士
    'w-anime-155': "ultraman", // 鹹蛋超人
    'w-anime-156': "kamen rider", // 假面騎士
    'w-anime-157': "godzilla", // 哥吉拉
    'w-anime-158': "mazinger z", // 無敵鐵金剛
    'w-anime-159': "gatchaman", // 科學小飛俠
    'w-taiwan-80': "coffin bread", // 棺材板
    'w-taiwan-81': "milkfish", // 虱目魚
    'w-taiwan-82': "mullet roe|karasumi", // 烏魚子
    'w-taiwan-83': "tube rice pudding", // 筒仔米糕
    'w-taiwan-84': "oyster fritter", // 蚵嗲
    'w-taiwan-85': "sausage in sticky rice|taiwanese hot dog", // 大腸包小腸
    'w-taiwan-86': "herbal pork rib soup", // 藥燉排骨
    'w-taiwan-87': "four herbs soup", // 四神湯
    'w-taiwan-88': "iron egg", // 鐵蛋
    'w-taiwan-89': "a-gei|tamsui a-gei", // 阿給
    'w-taiwan-90': "fish ball soup", // 魚丸湯
    'w-taiwan-91': "ox tongue pastry", // 牛舌餅
    'w-taiwan-92': "square cookie|cube pastry", // 方塊酥
    'w-taiwan-93': "mung bean pastry", // 綠豆椪
    'w-taiwan-94': "wanluan pork knuckle", // 萬巒豬腳
    'w-taiwan-95': "chishang bento", // 池上便當
    'w-taiwan-96': "wendan pomelo|pomelo", // 文旦
    'w-taiwan-97': "irwin mango", // 愛文芒果
    'w-taiwan-98': "high mountain tea", // 高山茶
    'w-taiwan-99': "marble soda|ramune", // 彈珠汽水
    'w-taiwan-100': "sarsaparilla|root beer", // 沙士
    'w-taiwan-101': "kaoliang liquor|kaoliang", // 高粱酒
    'w-taiwan-102': "peanut candy|kinmen peanut candy", // 貢糖
    'w-taiwan-103': "bamboo tube rice", // 竹筒飯
    'w-taiwan-104': "millet wine", // 小米酒
    'w-taiwan-105': "lei cha|pounded tea", // 擂茶
    'w-taiwan-106': "hakka floral fabric", // 客家花布
    'w-taiwan-107': "glass beads|paiwan glass beads", // 琉璃珠
    'w-taiwan-108': "slate house", // 石板屋
    'w-taiwan-109': "hundred-pace snake|hundred pacer", // 百步蛇
    'w-taiwan-110': "military dependents village", // 眷村
    'w-taiwan-111': "holy pig|sacrificial pig", // 神豬
    'w-taiwan-112': "burning of the king boat|king boat burning", // 燒王船
    'w-taiwan-113': "song jiang battle array", // 宋江陣
    'w-taiwan-114': "grappling with ghosts|qiang gu", // 搶孤
    'w-taiwan-115': "parade float|yi ge float", // 藝閣
    'w-taiwan-116': "earth god temple|tudigong temple", // 土地公廟
    'w-taiwan-117': "city god temple", // 城隍廟
    'w-taiwan-118': "scooter waterfall", // 機車瀑布
    'w-taiwan-119': "priority seat", // 博愛座
    'w-taiwan-120': "yangmingshan", // 陽明山
    'w-taiwan-121': "elephant mountain|xiangshan", // 象山
    'w-taiwan-122': "maokong", // 貓空
    'w-taiwan-123': "pingxi", // 平溪
    'w-taiwan-124': "shifen waterfall", // 十分瀑布
    'w-taiwan-125': "fulong", // 福隆
    'w-taiwan-126': "jiaoxi", // 礁溪
    'w-taiwan-127': "wuling farm", // 武陵農場
    'w-taiwan-128': "xitou", // 溪頭
    'w-taiwan-129': "jiji", // 集集
    'w-taiwan-130': "baguashan|bagua mountain", // 八卦山
    'w-taiwan-131': "sanxiantai", // 三仙台
    'w-taiwan-132': "brown boulevard|mr. brown avenue", // 伯朗大道
    'w-taiwan-133': "chishang", // 池上
    'w-taiwan-134': "cijin", // 旗津
    'w-taiwan-135': "sizihwan", // 西子灣
    'w-taiwan-136': "love river", // 愛河
    'w-taiwan-137': "fo guang shan", // 佛光山
    'w-taiwan-138': "lotus pond", // 蓮池潭
    'w-taiwan-139': "moon world", // 月世界
    'w-taiwan-140': "hengchun", // 恆春
    'w-taiwan-141': "qixingtan", // 七星潭
    'w-taiwan-142': "qingshui cliff", // 清水斷崖
    'w-taiwan-143': "hsuehshan tunnel|xueshan tunnel", // 雪山隧道
    'w-taiwan-144': "suhua highway", // 蘇花公路
    'w-taiwan-145': "xiluo bridge", // 西螺大橋
    'w-taiwan-146': "shimen reservoir", // 石門水庫
    'w-taiwan-147': "chianan canal", // 嘉南大圳
    'w-taiwan-148': "forest railway|alishan forest railway", // 森林鐵路
    'w-taiwan-149': "presidential office building|presidential office", // 總統府
    'w-taiwan-150': "grand hotel|grand hotel taipei", // 圓山飯店
    'w-taiwan-151': "taipei arena", // 小巨蛋
    'w-taiwan-152': "xingtian temple", // 行天宮
    'w-taiwan-153': "atayal", // 泰雅族
    'w-taiwan-154': "amis", // 阿美族
    'w-taiwan-155': "tao people|yami", // 達悟族
    'w-taiwan-156': "pasibutbut|eight-part polyphony", // 八部合音
    'w-taiwan-157': "guanziling", // 關子嶺
    'w-taiwan-158': "sanyi", // 三義
    'w-taiwan-159': "yingge", // 鶯歌
    'w-festival-71': "christmas present|christmas gift", // 聖誕禮物
    'w-festival-72': "birthday party", // 生日派對
    'w-festival-73': "giving red envelopes|handing out red envelopes", // 發紅包
    'w-festival-74': "hanging lanterns|hang a lantern", // 掛燈籠
    'w-festival-75': "bridal bouquet|wedding bouquet", // 捧花
    'w-festival-76': "year-end party|weiya", // 尾牙
    'w-festival-77': "lucky draw|raffle|prize draw", // 抽獎
    'w-festival-78': "spring cleaning|big cleanup", // 大掃除
    'w-festival-79': "putting up spring couplets|pasting couplets", // 貼春聯
    'w-festival-80': "wrapping zongzi|making rice dumplings", // 包粽子
    'w-festival-81': "christmas dinner|christmas feast", // 聖誕大餐
    'w-festival-82': "pumpkin pie", // 南瓜派
    'w-festival-83': "love letter", // 情書
    'w-festival-84': "marriage proposal|proposing", // 求婚
    'w-festival-85': "wedding banquet|wedding feast", // 喜宴
    'w-festival-86': "longevity peach bun|birthday peach bun", // 壽桃
    'w-outdoor-0': "tarp|canopy|camping tarp", // 天幕
    'w-outdoor-1': "camping lantern|lantern", // 營燈
    'w-outdoor-2': "folding chair|camp chair", // 折疊椅
    'w-outdoor-3': "hiking boots|hiking boot", // 登山鞋
    'w-outdoor-4': "hiking backpack|backpack", // 登山背包
    'w-outdoor-5': "cooler|cooler box", // 保冷箱
    'w-outdoor-6': "firewood|logs", // 柴火
    'w-outdoor-7': "skewer|kebab", // 烤肉串
    'w-outdoor-8': "charcoal|coal", // 木炭
    'w-outdoor-9': "picnic basket|basket", // 野餐籃
    'w-outdoor-10': "picnic blanket|picnic mat", // 野餐墊
    'w-outdoor-11': "lunch box|picnic box", // 野餐盒
    'w-outdoor-12': "fishing net|dip net", // 撈魚網
    'w-outdoor-13': "catching crabs|crab catching", // 抓螃蟹
    'w-outdoor-14': "signpost|sign", // 指示牌
    'w-outdoor-15': "trail|hiking trail", // 步道
    'w-outdoor-16': "sun hat|bucket hat", // 遮陽帽
    'w-outdoor-17': "beach umbrella|parasol", // 海灘傘
    'w-outdoor-18': "beach chair|deck chair", // 海灘椅
    'w-outdoor-19': "beach towel|towel", // 海灘巾
    'w-outdoor-20': "flip-flops|flip flops", // 人字拖
    'w-outdoor-21': "sunscreen|sunblock", // 防曬乳
    'w-outdoor-22': "life jacket|life vest", // 救生衣
    'w-outdoor-23': "sandcastle|sand castle", // 沙堡
    'w-outdoor-24': "splashing water|playing in water", // 戲水
    'w-outdoor-25': "swimming pool|pool", // 泳池
    'w-outdoor-26': "climbing frame|jungle gym", // 攀爬架
    'w-outdoor-27': "ball pit|ball pool", // 球池
    'w-outdoor-28': "bouncy castle|bounce house", // 充氣城堡
    'w-outdoor-29': "teacup ride|spinning teacups", // 旋轉茶杯
    'w-outdoor-30': "fountain|water fountain", // 噴泉
    'w-outdoor-31': "feeding pigeons|feeding birds", // 餵鴿子
    'w-outdoor-32': "hiking|hike", // 健行
    'w-outdoor-33': "feeding lambs|feeding sheep", // 餵小羊
    'w-outdoor-34': "strawberry picking|picking strawberries", // 採草莓
    'w-outdoor-35': "pony ride|riding a pony", // 騎小馬
    'w-outdoor-36': "tent stake|tent peg", // 營釘
    'w-outdoor-37': "camping table|folding table", // 露營桌
    'w-outdoor-38': "headlamp|head torch", // 頭燈
    'w-outdoor-39': "Swiss army knife|pocket knife", // 瑞士刀
    'w-outdoor-40': "trekking pole|hiking pole", // 登山杖
    'w-outdoor-41': "climbing rope|rope", // 登山繩
    'w-outdoor-42': "ice axe|ice pick", // 冰斧
    'w-outdoor-43': "bug spray|mosquito repellent", // 防蚊液
    'w-outdoor-44': "camping stove|portable stove", // 卡式爐
    'w-outdoor-45': "gas canister|gas can", // 瓦斯罐
    'w-outdoor-46': "camping mug|steel cup", // 鋼杯
    'w-outdoor-47': "camp cooking|cookout", // 野炊
    'w-outdoor-48': "chopping wood|splitting wood", // 劈柴
    'w-outdoor-49': "campfire party|bonfire party", // 營火晚會
    'w-outdoor-50': "grill grate|grill", // 烤肉網
    'w-outdoor-51': "thermos|vacuum flask", // 保溫壺
    'w-outdoor-52': "bug box|insect box", // 昆蟲箱
    'w-outdoor-53': "catching tadpoles|tadpole catching", // 抓蝌蚪
    'w-outdoor-54': "skipping stones|stone skipping", // 打水漂
    'w-outdoor-55': "driftwood|drift wood", // 漂流木
    'w-outdoor-56': "mountain cable car|gondola", // 登山纜車
    'w-outdoor-57': "lookout tower|watchtower", // 瞭望台
    'w-outdoor-58': "mountain hut|cabin", // 山屋
    'w-outdoor-59': "wetsuit|diving suit", // 潛水衣
    'w-outdoor-60': "snorkel|breathing tube", // 呼吸管
    'w-outdoor-61': "lifeguard tower|lifeguard stand", // 救生塔
    'w-outdoor-62': "diving board|diving platform", // 跳水台
    'w-outdoor-63': "paddleboard|SUP", // 立槳
    'w-outdoor-64': "water skiing|water ski", // 滑水
    'w-outdoor-65': "climbing pole|pole climbing", // 爬竿
    'w-outdoor-66': "swing ride|chair swing ride", // 旋轉飛椅
    'w-outdoor-67': "bumper boat|bumper boats", // 碰碰船
    'w-outdoor-68': "corn maze|maze", // 玉米迷宮
    'w-outdoor-69': "arcade basketball|basketball machine", // 投籃機
    'w-outdoor-70': "cotton candy machine|candy floss machine", // 棉花糖機
    'w-outdoor-71': "tandem bike|tandem bicycle", // 協力車
    'w-outdoor-72': "bike lane|cycling path", // 自行車道
    'w-outdoor-73': "cycling around Taiwan|round-island trip", // 環島
    'w-outdoor-74': "sandboarding|sand sledding", // 滑沙
    'w-outdoor-75': "sheep shearing|shearing", // 剪羊毛
    'w-outdoor-76': "kicking a shuttlecock|jianzi", // 踢毽子
    'w-outdoor-77': "hanging chair|swing chair", // 吊床椅
    'w-outdoor-78': "tree climbing|climbing a tree", // 攀樹
    'w-outdoor-79': "rock climbing|rock wall", // 爬岩壁
    'w-outdoor-80': "city night view|night view", // 看夜景
    'w-outdoor-81': "reaching the summit|summit", // 登頂
    'w-outdoor-82': "planting a flag|flag", // 插旗
    'w-outdoor-83': "earth oven|dirt oven", // 焢窯
    'w-outdoor-84': "parasailing|parasail", // 拖曳傘
    'w-outdoor-85': "wild hot spring|hot spring", // 野溪溫泉
    'w-fruitveg-0': "green onion|scallion", // 青蔥
    'w-fruitveg-1': "rambutan|hairy lychee", // 紅毛丹
    'w-fruitveg-2': "burdock root|burdock", // 牛蒡
    'w-fruitveg-3': "zucchini|courgette", // 櫛瓜
    'w-fruitveg-4': "beetroot|beet", // 甜菜根
    'w-fruitveg-5': "okra|lady's finger", // 秋葵
    'w-fruitveg-6': "bok choy|pak choi", // 青江菜
    'w-fruitveg-7': "king oyster mushroom|mushroom", // 杏鮑菇
    'w-fruitveg-8': "raspberry|raspberries", // 覆盆子
    'w-fruitveg-9': "blackberry|blackberries", // 黑莓
    'w-fruitveg-10': "olive|olives", // 橄欖
    'w-fruitveg-11': "winter melon|wax gourd", // 冬瓜
    'w-fruitveg-12': "plum|green plum", // 梅子
    'w-fruitveg-13': "cilantro|coriander", // 香菜
    'w-fruitveg-14': "bean sprouts|sprouts", // 豆芽菜
    'w-fruitveg-15': "radish|red radish", // 櫻桃蘿蔔
    'w-fruitveg-16': "lettuce|romaine", // 萵苣
    'w-fruitveg-17': "date|dates", // 椰棗
    'w-fruitveg-18': "water caltrop|devil's horn nut", // 菱角
    'w-fruitveg-19': "water bamboo|wild rice stem", // 茭白筍
    'w-fruitveg-20': "kohlrabi|turnip", // 大頭菜
    'w-kitchen-60': "mixing bowl|bowl", // 調理盆
    'w-kitchen-61': "ice cube tray|ice tray", // 冰塊盒
    'w-kitchen-62': "beer mug|beer stein", // 啤酒杯
    'w-kitchen-63': "coaster|drink coaster", // 杯墊
    'w-kitchen-64': "chopstick rest|chopstick holder", // 筷架
    'w-kitchen-65': "grater|cheese grater", // 刨絲器
    'w-kitchen-66': "pizza cutter|pizza wheel", // 披薩刀
    'w-kitchen-67': "ice cream scoop|scoop", // 冰淇淋勺
    'w-kitchen-68': "waffle maker|waffle iron", // 鬆餅機
    'w-clothes-91': "fanny pack|waist bag", // 腰包
    'w-clothes-92': "briefcase|attache case", // 公事包
    'w-clothes-93': "crossbody bag|messenger bag", // 斜背包
    'w-clothes-94': "top hat|tophat", // 禮帽
    'w-clothes-95': "arm sleeves|sleeve cover", // 袖套
    'w-clothes-96': "anklet|ankle bracelet", // 腳鍊
    'w-clothes-97': "camouflage uniform|camo", // 迷彩服
    'w-clothes-98': "straw sandals|straw shoes", // 草鞋
    'w-clothes-99': "shawl|wrap", // 披肩
    'w-tech-70': "instant camera|polaroid", // 拍立得
    'w-tech-71': "humidifier|air humidifier", // 加濕器
    'w-tech-72': "vinyl record|record", // 黑膠唱片
    'w-tech-73': "cassette tape|cassette", // 卡帶
    'w-tech-74': "portable cassette player|walkman", // 隨身聽
    'w-tech-75': "brick phone|old mobile phone", // 大哥大
    'w-tech-76': "video tape|VHS tape", // 錄影帶
    'w-tech-77': "fax machine|fax", // 傳真機
    'w-tech-78': "digital photo frame|photo frame", // 數位相框
    'w-tech-79': "paper shredder|shredder", // 碎紙機
    'w-tech-80': "bug zapper|mosquito lamp", // 捕蚊燈
    'w-tech-81': "laser pointer|laser pen", // 雷射筆
    'w-tech-82': "laminator|laminating machine", // 護貝機
    'w-tech-83': "projector screen|projection screen", // 投影幕
    'w-animal-200': "brown bear", // 棕熊
    'w-animal-201': "fawn", // 小鹿
    'w-animal-202': "koi", // 錦鯉
    'w-animal-203': "tropical fish", // 熱帶魚
    'w-animal-204': "white horse", // 白馬
    'w-animal-205': "white tiger", // 白虎
    'w-animal-206': "saury|pacific saury", // 秋刀魚
    'w-animal-207': "crayfish", // 小龍蝦
    'w-animal-208': "loach", // 泥鰍
    'w-animal-209': "piranha", // 食人魚
    'w-animal-210': "catfish", // 鯰魚
    'w-animal-211': "leopard", // 花豹
    'w-animal-212': "dalmatian", // 大麥町
    'w-animal-213': "tortoise", // 陸龜
    'w-animal-214': "ram", // 公羊
    'w-animal-215': "bullfrog", // 牛蛙
    'w-animal-216': "betta fish", // 鬥魚
    'w-animal-217': "vole", // 田鼠
    'w-animal-218': "manta ray", // 蝠鱝
    'w-animal-219': "bison", // 野牛
    'w-animal-220': "green bamboo viper", // 青竹絲
    'w-animal-221': "fennec fox", // 耳廓狐
    'w-animal-222': "arctic fox", // 北極狐
    'w-animal-223': "slug", // 蛞蝓
    'w-animal-224': "lionfish", // 獅子魚
    'w-animal-225': "spider crab", // 蜘蛛蟹
    'w-animal-226': "cutlassfish", // 白帶魚
    'w-animal-227': "horned frog", // 角蛙
    'w-animal-228': "king cobra", // 眼鏡王蛇
    'w-animal-229': "electric eel", // 電鰻
    'w-animal-230': "ferret", // 雪貂
    'w-bird-50': "wild duck", // 野鴨
    'w-bird-51': "black swan", // 黑天鵝
    'w-bird-52': "emperor penguin", // 皇帝企鵝
    'w-bird-53': "white dove", // 白鴿
    'w-bird-54': "stork", // 送子鳥
    'w-bird-55': "pheasant", // 雉雞
    'w-bird-56': "macaw", // 金剛鸚鵡
    'w-bird-57': "blue peacock", // 藍孔雀
    'w-bird-58': "puffin", // 海鸚
    'w-bird-59': "osprey", // 魚鷹
    'w-bird-60': "cockatoo", // 鳳頭鸚鵡
    'w-insect-50': "hornet", // 虎頭蜂
    'w-insect-51': "red dragonfly", // 紅蜻蜓
    'w-insect-52': "green caterpillar", // 青蟲
    'w-insect-53': "millipede", // 馬陸
    'w-fruitveg-21': "button mushroom", // 洋菇
    'w-fruitveg-22': "black bean", // 黑豆
    'w-fruitveg-23': "napa cabbage", // 大白菜
    'w-fruitveg-24': "yardlong bean", // 長豆
    'w-fruitveg-25': "bayberry", // 楊梅
    'w-fruitveg-26': "hazelnut", // 榛果
    'w-fruitveg-27': "pine nut", // 松子
    'w-fruitveg-28': "sweet potato leaves", // 地瓜葉
    'w-fruitveg-29': "jackfruit", // 波羅蜜
    'w-fruitveg-30': "fava bean", // 蠶豆
    'w-fruitveg-31': "purple cabbage", // 紫高麗菜
    'w-fruitveg-32': "banana peel", // 香蕉皮
    'w-fruitveg-33': "apple core", // 蘋果核
    'w-fruitveg-34': "chickpea", // 鷹嘴豆
    'w-fruitveg-35': "ginseng", // 人參
    'w-fruitveg-36': "dried persimmon", // 柿餅
    'w-plant-80': "banana tree", // 芭蕉樹
    'w-plant-81': "cactus ball", // 仙人球
    'w-plant-82': "banana leaf", // 芭蕉葉
    'w-plant-83': "acorn", // 橡實
    'w-plant-84': "morning glory", // 喇叭花
    'w-plant-85': "rapeseed flower", // 油菜花
    'w-plant-86': "poppy", // 罌粟花
    'w-plant-87': "hibiscus", // 朱槿
    'w-plant-88': "bougainvillea", // 九重葛
    'w-plant-89': "ivy", // 常春藤
    'w-plant-90': "plumeria", // 雞蛋花
    'w-plant-91': "cycad", // 鐵樹
    'w-plant-92': "gerbera", // 非洲菊
    'w-plant-93': "monstera", // 龜背芋
    'w-plant-94': "pothos", // 黃金葛
    'w-plant-95': "spider plant", // 吊蘭
    'w-plant-96': "money tree", // 發財樹
    'w-plant-97': "lucky bamboo", // 富貴竹
    'w-plant-98': "ginger lily", // 野薑花
    'w-plant-99': "rice plant", // 水稻
    'w-plant-100': "banana plant", // 香蕉樹
    'w-plant-101': "mango tree", // 芒果樹
    'w-plant-102': "narcissus", // 水仙花
    'w-plant-103': "azalea", // 杜鵑
    'w-plant-104': "giant water lily", // 王蓮
    'w-plant-105': "calla lily", // 馬蹄蓮
    'w-plant-106': "coffee plant", // 咖啡樹
    'w-plant-107': "tea plant", // 茶樹
    'w-plant-108': "lily of the valley", // 鈴蘭
    'w-plant-109': "dahlia", // 大理花
    'w-nature-129': "new moon", // 新月
    'w-nature-130': "snowscape", // 雪景
    'w-nature-131': "boulder", // 巨石
    'w-nature-132': "sea spray", // 浪花
    'w-nature-133': "flame", // 火焰
    'w-nature-134': "sand pile", // 沙堆
    'w-nature-135': "puddle", // 小水坑
    'w-nature-136': "big wave", // 大浪
    'w-nature-137': "snow pile", // 雪堆
    'w-nature-138': "deserted island", // 孤島
    'w-nature-139': "colorful sunset clouds", // 彩霞
    'w-nature-140': "frozen lake", // 冰湖
    'w-nature-141': "whirlwind", // 旋風
    'w-nature-142': "starry river", // 星河
    'w-nature-143': "crater lake", // 火山湖
    'w-nature-144': "natural arch", // 天然拱門
    'w-nature-145': "mushroom rock", // 蘑菇岩
    'w-nature-146': "sea stack", // 海蝕柱
    'w-nature-147': "rapids", // 激流
    'w-nature-148': "steep cliff", // 斷崖
    'w-food-286': "fried noodles", // 炒麵
    'w-food-287': "rice cracker", // 仙貝
    'w-food-288': "cold noodles", // 涼麵
    'w-food-289': "jerky", // 肉乾
    'w-food-290': "oatmeal", // 麥片
    'w-food-291': "paella", // 海鮮飯
    'w-food-292': "croquette", // 可樂餅
    'w-food-293': "shrimp cracker", // 蝦餅
    'w-food-294': "peanut candy", // 花生糖
    'w-food-295': "mung bean cake", // 綠豆糕
    'w-food-296': "taro pastry", // 芋頭酥
    'w-food-297': "sweet bean ice", // 蜜豆冰
    'w-food-298': "salted egg", // 鹹蛋
    'w-food-299': "omelette", // 歐姆蛋
    'w-food-300': "french toast", // 法式吐司
    'w-food-301': "strawberry daifuku", // 草莓大福
    'w-food-302': "shredded squid", // 魷魚絲
    'w-food-303': "sesame ball", // 芝麻球
    'w-food-304': "chicken feet", // 雞爪
    'w-food-305': "chive pocket", // 韭菜盒
    'w-food-306': "pretzel", // 德國結
    'w-food-307': "shawarma|kebab", // 沙威瑪
    'w-food-308': "nachos|tortilla chips", // 玉米片
    'w-food-309': "dango", // 三色糰子
    'w-food-310': "kimbap|gimbap", // 紫菜包飯
    'w-food-311': "fried dough twist", // 麻花
    'w-food-312': "eel rice|unagi don", // 鰻魚飯
    'w-food-313': "baumkuchen|tree cake", // 年輪蛋糕
    'w-food-314': "curry bread", // 咖哩麵包
    'w-food-315': "fish cake|kamaboko", // 魚板
    'w-food-316': "chicken wings|grilled chicken wings", // 烤雞翅
    'w-food-317': "hash brown", // 薯餅
    'w-food-318': "skittles|rainbow candy", // 彩虹糖
    'w-food-319': "chocolate bar", // 巧克力棒
    'w-food-320': "choco pie", // 蛋黃派
    'w-food-321': "tamagoyaki|japanese omelet", // 玉子燒
    'w-food-322': "egg waffle|bubble waffle", // 雞蛋仔
    'w-food-323': "bbq ribs|grilled ribs", // 烤肋排
    'w-food-324': "corn dog", // 玉米熱狗
    'w-food-325': "steamed twisted roll", // 花捲
    'w-food-326': "fried shrimp", // 炸蝦
    'w-food-327': "tteokbokki", // 辣炒年糕
    'w-food-328': "creme brulee", // 烤布蕾
    'w-drink-60': "beer", // 啤酒
    'w-drink-61': "red wine", // 紅酒
    'w-drink-62': "yakult", // 養樂多
    'w-drink-63': "cocoa", // 可可亞
    'w-drink-64': "cocktail", // 雞尾酒
    'w-kitchen-69': "napkin", // 餐巾紙
    'w-kitchen-70': "beer bottle", // 啤酒瓶
    'w-kitchen-71': "glass jar|mason jar", // 玻璃罐
    'w-kitchen-72': "fruit basket", // 水果籃
    'w-kitchen-73': "tablecloth", // 桌巾
    'w-kitchen-74': "knife block", // 刀架
    'w-kitchen-75': "gooseneck kettle", // 手沖壺
    'w-kitchen-76': "yin yang hot pot", // 鴛鴦鍋
    'w-kitchen-77': "soup cup", // 湯盅
    'w-kitchen-78': "juicer", // 榨汁器
    'w-kitchen-79': "chopstick holder", // 筷子筒
    'w-kitchen-80': "coffee grinder", // 磨豆機
    'w-kitchen-81': "sandwich maker", // 三明治機
    'w-kitchen-82': "bread maker", // 麵包機
    'w-kitchen-83': "rubber gloves", // 洗碗手套
    'w-kitchen-84': "bread basket", // 麵包籃
    'w-kitchen-85': "beer keg|barrel", // 啤酒桶
    'w-kitchen-86': "tea bag", // 茶包
    'w-kitchen-87': "sugar bowl|sugar jar", // 糖罐
    'w-kitchen-88': "water pitcher", // 冷水壺
    'w-kitchen-89': "popcorn machine", // 爆米花機
    'w-home-236': "sponge", // 海綿
    'w-home-237': "mailbox", // 信箱
    'w-home-238': "lipstick", // 口紅
    'w-home-239': "plastic bag", // 塑膠袋
    'w-home-240': "cardboard box", // 紙箱
    'w-home-241': "pacifier", // 奶嘴
    'w-home-242': "floor lamp", // 落地燈
    'w-home-243': "bean bag", // 懶骨頭
    'w-home-244': "bunk bed", // 雙層床
    'w-home-245': "feather duster", // 雞毛撣
    'w-home-246': "marker", // 麥克筆
    'w-home-247': "binder clip", // 長尾夾
    'w-home-248': "perfume bottle", // 香水瓶
    'w-home-249': "candlestick", // 燭台
    'w-home-250': "photo album", // 相簿
    'w-home-251': "doormat", // 門墊
    'w-home-252': "storage box", // 收納盒
    'w-home-253': "fly swatter", // 蚊蠅拍
    'w-home-254': "mousetrap", // 捕鼠器
    'w-home-255': "nail polish", // 指甲油
    'w-home-256': "cushion|seat cushion", // 坐墊
    'w-home-257': "shoe box", // 鞋盒
    'w-home-258': "shower curtain", // 浴簾
    'w-home-259': "towel rack", // 毛巾架
    'w-home-260': "teru teru bozu|sunshine doll", // 晴天娃娃
    'w-home-261': "glasses case", // 眼鏡盒
    'w-home-262': "office desk", // 辦公桌
    'w-home-263': "yarn", // 毛線
    'w-home-264': "makeup bag", // 化妝包
    'w-home-265': "clothesline", // 曬衣繩
    'w-home-266': "drawing paper", // 圖畫紙
    'w-taiwan-160': "tea leaves", // 茶葉
    'w-taiwan-161': "shaved ice", // 剉冰
    'w-taiwan-162': "wheel cake", // 車輪餅
    'w-taiwan-163': "scooter raincoat|raincoat", // 機車雨衣
    'w-taiwan-164': "turkey rice", // 火雞肉飯
    'w-taiwan-165': "braised pork rice", // 焢肉飯
    'w-taiwan-166': "oden", // 黑輪
    'w-taiwan-167': "maokong gondola", // 貓纜
    'w-taiwan-168': "shigandang|stone guardian", // 石敢當
    'w-taiwan-169': "tao canoe|plank boat", // 拼板舟
    'w-taiwan-170': "maltose", // 麥芽糖
    'w-taiwan-171': "taipei metro|mrt", // 台北捷運
    'w-taiwan-172': "yellow taxi|taxi", // 小黃計程車
    'w-taiwan-173': "incense", // 線香
    'w-taiwan-174': "shaobing youtiao", // 燒餅油條
    'w-taiwan-175': "fried vermicelli", // 炒米粉
    'w-taiwan-176': "wet market", // 菜市場
    'w-taiwan-177': "fortune sticks", // 籤筒
    'w-taiwan-178': "amulet", // 平安符
    'w-taiwan-179': "archway|paifang", // 牌樓
    'w-taiwan-180': "palm leaf fan", // 蒲扇
    'w-taiwan-181': "plastic chair", // 塑膠椅
    'w-taiwan-182': "areca palm", // 檳榔樹
    'w-taiwan-183': "formosan macaque", // 台灣獼猴
    'w-taiwan-184': "gold paper furnace", // 金爐
    'w-taiwan-185': "joss paper", // 銀紙
    'w-taiwan-186': "moon blocks", // 擲筊
    'w-taiwan-187': "menko cards", // 尪仔標
    'w-taiwan-188': "red turtle cake", // 紅龜粿
    'w-taiwan-189': "water lantern", // 水燈
    'w-taiwan-190': "train lunch box", // 火車便當盒
    'w-taiwan-191': "tze-chiang express", // 自強號
    'w-taiwan-192': "peanut ice cream roll", // 花生捲冰淇淋
    'w-taiwan-193': "stove", // 大鍋灶
    'w-taiwan-194': "pork ball soup", // 貢丸湯
    'w-clothes-100': "crown", // 皇冠
    'w-clothes-101': "cowboy hat", // 牛仔帽
    'w-clothes-102': "swim cap", // 泳帽
    'w-clothes-103': "sweatpants", // 運動褲
    'w-clothes-104': "ballet shoes", // 芭蕾舞鞋
    'w-clothes-105': "duffel bag", // 行李袋
    'w-clothes-106': "badge", // 徽章
    'w-clothes-107': "pearl necklace", // 珍珠項鍊
    'w-clothes-108': "wig", // 假髮
    'w-clothes-109': "fake beard", // 假鬍子
    'w-clothes-110': "kung fu suit", // 功夫裝
    'w-clothes-111': "sailor uniform", // 水手服
    'w-clothes-112': "snow boots", // 雪靴
    'w-clothes-113': "handkerchief", // 手帕
    'w-clothes-114': "clown hat|party hat", // 小丑帽
    'w-clothes-115': "cowboy boots", // 牛仔靴
    'w-clothes-116': "hood", // 兜帽
    'w-clothes-117': "veil", // 面紗
    'w-clothes-118': "cat ear headband", // 貓耳髮箍
    'w-clothes-119': "hairpin|hair stick", // 髮簪
    'w-clothes-120': "judge robe", // 法官袍
    'w-fun-138': "magic hat|top hat", // 魔術帽
    'w-fun-139': "magic wand", // 魔術棒
    'w-fun-140': "pinwheel", // 紙風車
    'w-fun-141': "wooden sword", // 木劍
    'w-fun-142': "rag doll", // 布娃娃
    'w-fun-143': "mask", // 面具
    'w-fun-144': "spotlight", // 聚光燈
    'w-fun-145': "chessboard|game board", // 棋盤
    'w-fun-146': "hand shadow", // 手影
    'w-fun-147': "fan dance", // 扇子舞
    'w-fun-148': "sculpture", // 雕塑
    'w-fun-149': "sky lantern", // 孔明燈
    'w-fun-150': "stilts", // 高蹺
    'w-fun-151': "tarot cards", // 塔羅牌
    'w-fun-152': "electronic drums", // 電子鼓
    'w-fun-153': "scratch card|scratch off", // 刮刮樂
    'w-fun-154': "virtual pet|tamagotchi", // 電子雞
    'w-fun-155': "director chair", // 導演椅
    'w-fun-156': "megaphone|bullhorn", // 大聲公
    'w-fun-157': "dance pad", // 跳舞毯
    'w-fun-158': "mural", // 壁畫
    'w-fun-159': "plaster bust", // 石膏像
    'w-fun-160': "pottery", // 捏陶
    'w-sport-71': "ping pong ball", // 乒乓球
    'w-sport-72': "badminton racket", // 羽球拍
    'w-sport-73': "pool cue|cue stick", // 撞球桿
    'w-sport-74': "archery target", // 箭靶
    'w-sport-75': "cleats", // 釘鞋
    'w-sport-76': "vaulting box", // 跳箱
    'w-sport-77': "pole vault", // 撐竿跳
    'w-sport-78': "road bike", // 自由車
    'w-sport-79': "olympic torch", // 聖火
    'w-sport-80': "golf ball", // 高爾夫球
    'w-sport-81': "baseball glove", // 棒球手套
    'w-sport-82': "rowing|rowing boat", // 賽艇
    'w-sport-83': "snowboarding", // 單板滑雪
    'w-sport-84': "figure skating", // 花式滑冰
    'w-sport-85': "kettlebell", // 壺鈴
    'w-sport-86': "exercise ball|yoga ball", // 健身球
    'w-sport-87': "grandstand|bleachers", // 看台
    'w-sport-88': "spinning bike|exercise bike", // 飛輪
    'w-sport-89': "nunchaku", // 雙節棍
    'w-tech-84': "handheld fan", // 手持風扇
    'w-tech-85': "phone case", // 手機殼
    'w-tech-86': "thermometer gun", // 體溫槍
    'w-tech-87': "arcade machine", // 街機
    'w-tech-88': "payphone", // 公用電話
    'w-tech-89': "tripod", // 三腳架
    'w-tech-90': "massage gun", // 按摩槍
    'w-tech-91': "hair clipper", // 理髮器
    'w-tech-92': "drawing tablet", // 繪圖板
    'w-tech-93': "tape recorder", // 錄音機
    'w-tech-94': "smoke detector", // 煙霧偵測器
    'w-tech-95': "video doorbell", // 視訊門鈴
    'w-tech-96': "time clock", // 打卡鐘
    'w-tech-97': "mouse pad", // 滑鼠墊
    'w-tech-98': "flip phone", // 翻蓋手機
    'w-tech-99': "pc tower|desktop computer", // 電腦主機
    'w-tech-100': "computer chair", // 電腦椅
    'w-tech-101': "camera lens", // 鏡頭
    'w-tech-102': "camera flash", // 閃光燈
    'w-tech-103': "earplugs", // 耳塞
    'w-tech-104': "pager", // 呼叫器
    'w-tech-105': "lava lamp", // 熔岩燈
    'w-tech-106': "power wheelchair", // 電動輪椅
    'w-tech-107': "game cartridge", // 遊戲卡帶
    'w-vehicle-110': "traffic cone", // 交通錐
    'w-vehicle-111': "steering wheel", // 方向盤
    'w-vehicle-112': "tire|tyre", // 輪胎
    'w-vehicle-113': "paddle|oar", // 船槳
    'w-vehicle-114': "sail", // 船帆
    'w-vehicle-115': "car key", // 車鑰匙
    'w-vehicle-116': "bike basket", // 車籃
    'w-vehicle-117': "bicycle bell", // 車鈴
    'w-vehicle-118': "wheel", // 車輪
    'w-vehicle-119': "locomotive|train engine", // 火車頭
    'w-vehicle-120': "bus stop", // 公車站
    'w-vehicle-121': "escalator", // 手扶梯
    'w-vehicle-122': "rearview mirror", // 後照鏡
    'w-vehicle-123': "windshield wiper", // 雨刷
    'w-vehicle-124': "platform", // 月台
    'w-vehicle-125': "fuel nozzle|gas pump", // 加油槍
    'w-vehicle-126': "food truck", // 餐車
    'w-vehicle-127': "delivery van", // 宅配車
    'w-vehicle-128': "propeller", // 螺旋槳
    'w-vehicle-129': "airplane wing", // 機翼
    'w-vehicle-130': "luggage cart", // 行李車
    'w-vehicle-131': "ship wheel|helm", // 船舵
    'w-vehicle-132': "stop sign", // 停車標誌
    'w-vehicle-133': "bicycle chain", // 車鏈
    'w-vehicle-134': "windshield", // 擋風玻璃
    'w-vehicle-135': "porthole", // 舷窗
    'w-vehicle-136': "landing gear", // 起落架
    'w-vehicle-137': "control tower", // 塔台
    'w-vehicle-138': "windsock", // 風向袋
    'w-vehicle-139': "train car", // 車廂
    'w-vehicle-140': "charging station", // 充電站
    'w-vehicle-141': "speed limit sign", // 限速標誌
    'w-vehicle-142': "no entry sign", // 禁止進入
    'w-vehicle-143': "saddle", // 馬鞍
    'w-vehicle-144': "exhaust pipe", // 排氣管
    'w-place-149': "candy store", // 糖果店
    'w-place-150': "straw hut|thatched house", // 稻草屋
    'w-place-151': "doghouse", // 狗屋
    'w-place-152': "chicken coop|hen cage", // 雞籠
    'w-place-153': "archway", // 拱門
    'w-place-154': "sushi restaurant", // 壽司店
    'w-place-155': "pizza shop", // 披薩店
    'w-place-156': "eyeglasses shop|optical shop", // 眼鏡行
    'w-place-157': "photo studio", // 照相館
    'w-place-158': "arcade", // 電玩店
    'w-place-159': "villa", // 別墅
    'w-place-160': "tower|eiffel tower", // 鐵塔
    'w-place-161': "ramen shop", // 拉麵店
    'w-place-162': "newsstand", // 書報攤
    'w-place-163': "ice cream shop", // 冰淇淋店
    'w-place-164': "fried chicken stall", // 雞排攤
    'w-place-165': "street stall", // 地攤
    'w-place-166': "pool hall", // 撞球場
    'w-place-167': "dinosaur museum", // 恐龍館
    'w-place-168': "thatched hut", // 茅草屋
    'w-place-169': "brick house", // 紅磚屋
    'w-place-170': "arch bridge", // 拱橋
    'w-place-171': "leaning tower", // 斜塔
    'w-place-172': "stilt house", // 水上屋
    'w-place-173': "imperial palace|palace", // 皇宮
    'w-place-174': "stone lion", // 石獅
    'w-place-175': "glass house", // 玻璃屋
    'w-place-176': "bar|pub", // 酒吧
    'w-place-177': "helipad", // 停機坪
    'w-place-178': "boarding gate", // 登機門
    'w-place-179': "baggage carousel", // 行李轉盤
    'w-place-180': "fish market", // 魚市場
    'w-place-181': "grape trellis", // 葡萄棚
    'w-place-182': "mahjong parlor", // 麻將館
    'w-place-183': "space center", // 太空中心
    'w-place-184': "windmill house", // 風車屋
    'w-place-185': "tulou", // 土樓
    'w-job-148': "cowboy", // 牛仔
    'w-job-149': "monk", // 和尚
    'w-job-150': "witch", // 魔女
    'w-job-151': "nun", // 修女
    'w-job-152': "priest", // 神父
    'w-job-153': "ticket seller", // 售票員
    'w-job-154': "royal guard", // 衛兵
    'w-job-155': "general", // 將軍
    'w-job-156': "emperor", // 皇帝
    'w-job-157': "butcher", // 屠夫
    'w-job-158': "mover", // 搬家工
    'w-job-159': "gas station attendant", // 加油員
    'w-job-160': "paramedic", // 救護員
    'w-job-161': "road worker", // 修路工
    'w-job-162': "pirate captain", // 海盜船長
    'w-job-163': "flower girl", // 賣花女
    'w-job-164': "swordsman", // 劍客
    'w-job-165': "tribal chief", // 酋長
    'w-job-166': "sumo wrestler|sumo", // 相撲手
    'w-job-167': "boatman|ferryman", // 船夫
    'w-job-168': "woodcutter|lumberjack", // 樵夫
    'w-job-169': "bullfighter|matador", // 鬥牛士
    'w-job-170': "archer", // 弓箭手
    'w-job-171': "strongman", // 大力士
    'w-job-172': "bodyguard", // 保鑣
    'w-job-173': "mounted police", // 騎警
    'w-job-174': "frogman", // 蛙人
    'w-job-175': "boy scout|scout", // 童軍
    'w-job-176': "wrestler", // 摔角手
    'w-job-177': "traffic cop", // 交警
    'w-job-178': "mascot", // 吉祥物
    'w-job-179': "taoist priest", // 道士
    'w-job-180': "bricklayer|mason", // 泥水匠
    'w-job-181': "fortune teller", // 算命師
    'w-body-61': "pinky|little finger", // 小指
    'w-body-62': "front tooth|incisor", // 門牙
    'w-body-63': "tear", // 眼淚
    'w-body-64': "sweat", // 汗水
    'w-body-65': "bald head", // 光頭
    'w-body-66': "ponytail", // 馬尾
    'w-body-67': "braid|pigtail", // 辮子
    'w-body-68': "curly hair", // 捲髮
    'w-body-69': "abs|six pack", // 腹肌
    'w-body-70': "nosebleed", // 鼻血
    'w-body-71': "dark circles", // 黑眼圈
    'w-body-72': "pimple|acne", // 痘痘
    'w-body-73': "beer belly", // 啤酒肚
    'w-body-74': "gray hair", // 白髮
    'w-body-75': "double chin", // 雙下巴
    'w-body-76': "ring finger", // 無名指
    'w-body-77': "fang tooth|canine tooth", // 虎牙
    'w-body-78': "cavity|tooth decay", // 蛀牙
    'w-body-79': "snot|runny nose", // 鼻涕
    'w-body-80': "adams apple", // 喉結
    'w-body-81': "fingerprint", // 指紋
    'w-body-82': "prosthetic limb", // 義肢
    'w-body-83': "afro", // 爆炸頭
    'w-body-84': "scar", // 疤痕
    'w-body-85': "wrinkles", // 皺紋
    'w-medical-60': "eye patch", // 眼罩
    'w-medical-61': "cooling patch|fever patch", // 退燒貼
    'w-medical-62': "scalpel", // 手術刀
    'w-medical-63': "contact lens", // 隱形眼鏡
    'w-medical-64': "hearing aid", // 助聽器
    'w-outdoor-86': "rubber duck", // 黃色小鴨
    'w-outdoor-87': "fence", // 柵欄
    'w-outdoor-88': "sand shovel", // 沙鏟
    'w-outdoor-89': "watering can", // 澆水壺
    'w-outdoor-90': "torch", // 火把
    'w-outdoor-91': "playground|amusement park", // 遊樂場
    'w-outdoor-92': "pitchfork|hay fork", // 乾草叉
    'w-outdoor-93': "shoulder pole", // 扁擔
    'w-outdoor-94': "millstone", // 石磨
    'w-outdoor-95': "well bucket", // 吊桶
    'w-outdoor-96': "camp bed|cot", // 行軍床
    'w-outdoor-97': "windsurfing board|windsurf", // 風浪板
    'w-outdoor-98': "straw pile", // 稻草堆
    'w-outdoor-99': "vineyard", // 葡萄園
    'w-outdoor-100': "fish pond", // 魚池
    'w-outdoor-101': "dart game", // 射飛鏢
    'w-outdoor-102': "wooden bridge", // 小木橋
    'w-outdoor-103': "sleeping pad", // 睡墊
    'w-festival-87': "party hat", // 派對帽
    'w-festival-88': "ghost", // 鬼魂
    'w-festival-89': "reindeer", // 聖誕麋鹿
    'w-festival-90': "lucky bag", // 福袋
    'w-festival-91': "kumquat tree", // 年桔
    'w-festival-92': "christmas star", // 聖誕星星
    'w-festival-93': "party popper|confetti cannon", // 禮炮
    'w-festival-94': "wedding candy", // 喜糖
    'w-festival-95': "champagne tower", // 香檳塔
    'w-festival-96': "balloon arch", // 氣球拱門
    'w-festival-97': "roast turkey", // 烤火雞
    'w-festival-98': "mooncake box", // 月餅盒
    'w-festival-99': "raffle box|lottery box", // 抽獎箱
    'w-festival-100': "firecracker", // 爆竹
    'w-festival-101': "gong and drum", // 鑼鼓
    'w-festival-102': "christmas wreath", // 聖誕花環
    'w-festival-103': "ribbon", // 緞帶
    'w-festival-104': "witch hat", // 女巫帽
    'w-festival-105': "skull", // 骷髏頭
    'w-festival-106': "easter egg", // 彩色蛋
    'w-festival-107': "easter bunny", // 復活兔
    'w-festival-108': "lotus lantern", // 蓮花燈
    'w-festival-109': "stocking", // 聖誕襪子
    'w-festival-110': "cake candle", // 蛋糕蠟燭
    'w-festival-111': "confetti", // 彩色紙屑
    'w-festival-112': "graduation gown", // 學士服
    'w-fantasy-125': "wand", // 魔杖
    'w-fantasy-126': "gold coin", // 金幣
    'w-fantasy-127': "halo", // 天使光環
    'w-fantasy-128': "throne", // 王座
    'w-fantasy-129': "pirate flag|jolly roger", // 海盜旗
    'w-fantasy-130': "trident", // 三叉戟
    'w-fantasy-131': "tombstone|gravestone", // 墓碑
    'w-fantasy-132': "coffin", // 棺材
    'w-fantasy-133': "eye patch", // 海盜眼罩
    'w-fantasy-134': "hook hand|pirate hook", // 鐵鉤手
    'w-fantasy-135': "knight helmet", // 騎士頭盔
    'w-fantasy-136': "fairy", // 仙子
    'w-fantasy-137': "mermaid princess", // 人魚公主
    'w-fantasy-138': "golden key", // 金鑰匙
    'w-fantasy-139': "storybook", // 童話書
    'w-fantasy-140': "turret", // 塔樓
    'w-fantasy-141': "witch hut", // 巫婆小屋
    'w-fantasy-142': "gingerbread house", // 薑餅小屋
    'w-fantasy-143': "mushroom house", // 蘑菇屋
    'w-fantasy-144': "wishing star", // 許願星
    'w-fantasy-145': "fairy wings", // 精靈翅膀
    'w-fantasy-146': "undersea castle", // 海底城
    'w-fantasy-147': "magic lamp", // 魔法燈
    'w-geography-228': "Little Mermaid statue|Little Mermaid", // 小美人魚像
    'w-geography-229': "Manneken Pis", // 尿尿小童
    'w-geography-230': "Mont Saint-Michel", // 聖米歇爾山
    'w-geography-231': "Buckingham Palace", // 白金漢宮
    'w-geography-232': "London Eye", // 倫敦眼
    'w-geography-233': "Brandenburg Gate", // 布蘭登堡門
    'w-geography-234': "Santorini", // 聖托里尼
    'w-geography-235': "Kremlin", // 克里姆林宮
    'w-geography-236': "Tokyo Skytree", // 東京晴空塔
    'w-geography-237': "Osaka Castle", // 大阪城
    'w-geography-238': "Gyeongbokgung", // 景福宮
    'w-geography-239': "Marina Bay Sands", // 金沙酒店
    'w-geography-240': "Guilin", // 桂林山水
    'w-geography-241': "Cappadocia", // 卡帕多奇亞
    'w-geography-242': "Moai", // 摩艾石像
    'w-geography-243': "dutch windmill|windmill", // 荷蘭風車
    'w-geography-244': "burj khalifa", // 哈利法塔
    'w-geography-245': "space needle", // 太空針塔
    'w-geography-246': "sydney harbour bridge", // 雪梨大橋
    'w-geography-247': "brooklyn bridge", // 布魯克林大橋
    'w-geography-248': "red phone booth|telephone box", // 紅電話亭
    'w-geography-249': "Loch Ness", // 尼斯湖
    'w-idiom-122': "carp leaping over the dragon gate", // 魚躍龍門
    'w-idiom-123': "worrying the sky will fall", // 杞人憂天
    'w-idiom-124': "Chang e flying to the moon", // 嫦娥奔月
    'w-idiom-125': "Hou Yi shooting suns", // 後羿射日
    'w-idiom-126': "flowing water and high mountains", // 高山流水
    'w-idiom-127': "watching fire from across the river", // 隔岸觀火
    'w-idiom-128': "lure the tiger from the mountain", // 調虎離山
    'w-idiom-129': "golden cicada sheds its shell", // 金蟬脫殼
    'w-idiom-130': "empty city strategy", // 空城計
    'w-idiom-131': "steal a sheep in passing", // 順手牽羊
    'w-idiom-132': "a dagger behind a smile", // 笑裡藏刀
    'w-idiom-133': "climbing a tree to catch fish", // 緣木求魚
    'w-idiom-134': "fishing the moon from water", // 水中撈月
    'w-idiom-135': "needle in a haystack", // 大海撈針
    'w-idiom-136': "cunning rabbit has three burrows", // 狡兔三窟
    'w-idiom-137': "scurrying away like a rat", // 抱頭鼠竄
    'w-idiom-138': "dancing with joy", // 手舞足蹈
    'w-idiom-139': "rein in at the cliff edge", // 懸崖勒馬
    'w-idiom-140': "sitting on pins and needles", // 如坐針氈
    'w-idiom-141': "dragonfly skimming water", // 蜻蜓點水
    'w-idiom-142': "catch all in one net", // 一網打盡
    'w-idiom-143': "miserly", // 一毛不拔
    'w-idiom-144': "drenched in sweat", // 汗流浹背
    'w-idiom-145': "pearl in the palm", // 掌上明珠
    'w-history-212': "gladiator", // 角鬥士
    'w-history-213': "knights of the round table", // 圓桌騎士
    'w-history-214': "bamboo slips", // 竹簡
    'w-history-215': "quill pen", // 羽毛筆
    'w-history-216': "The Scream", // 吶喊
    'w-history-217': "Starry Night", // 星夜
    'w-history-218': "Mayflower", // 五月花號
    'w-history-219': "Robin Hood", // 羅賓漢
    'w-history-220': "printing press", // 印刷機
    'w-history-221': "stele", // 石碑
    'w-history-222': "pharaoh", // 法老王
    'w-history-223': "dragon robe", // 龍袍
    'w-history-224': "imperial edict", // 聖旨
    'w-history-225': "imperial seal", // 玉璽
    'w-history-226': "south pointing ladle", // 司南
    'w-history-227': "viking ship|longship", // 維京船
    'w-history-228': "laurel wreath", // 月桂冠
    'w-history-229': "bronze ding|bronze cauldron", // 青銅鼎
    'w-history-230': "chime bells|bianzhong", // 編鐘
    'w-history-231': "phoenix crown", // 鳳冠
    'w-science-60': "conical flask", // 錐形瓶
    'w-science-61': "wind vane", // 風向標
    'w-science-62': "lightning rod", // 避雷針
    'w-science-63': "generator", // 發電機
    'w-science-64': "optical fiber", // 光纖
    'w-science-65': "weights", // 砝碼
    'w-science-66': "stopwatch", // 碼錶
    'w-science-67': "test tube rack", // 試管架
    'w-science-68': "tweezers", // 鑷子
    'w-science-69': "anemometer", // 風速計
    'w-science-70': "weather balloon", // 氣象氣球
    'w-science-71': "radar", // 雷達
    'w-science-72': "periscope", // 潛望鏡
    'w-science-73': "pinhole camera", // 針孔相機
    'w-science-74': "Newtons cradle", // 牛頓搖籃
    'w-science-75': "water rocket", // 水火箭
    'w-science-76': "saturn rings", // 土星環
    'w-science-77': "glass rod|stirring rod", // 玻璃棒
    'w-science-78': "spring scale", // 彈簧秤
    'w-science-79': "dinosaur fossil", // 恐龍化石
    'w-science-80': "soap bubble", // 肥皂泡
    'w-science-81': "dry cell|battery", // 乾電池
    'w-trend-125': "capsule toy machine|gashapon", // 扭蛋機
    'w-trend-126': "robot dog", // 機器狗
    'w-trend-127': "shaker bottle", // 搖搖杯
    'w-trend-128': "cat cafe", // 貓咪咖啡廳
    'w-trend-129': "photo booth|sticker booth", // 拍貼機
    'w-trend-130': "streamer|live streamer", // 直播主
    'w-trend-131': "hand sanitizer", // 乾洗手
    'w-fruitveg-37': "European pear", // 西洋梨
    'w-fruitveg-38': "ponkan mandarin", // 椪柑
    'w-fruitveg-39': "prune", // 黑棗
    'w-fruitveg-40': "hawthorn", // 山楂
    'w-fruitveg-41': "muskmelon", // 香瓜
    'w-fruitveg-42': "roselle", // 洛神花
    'w-fruitveg-43': "sesame", // 芝麻
    'w-fruitveg-44': "oats", // 燕麥
    'w-fruitveg-45': "pearl barley", // 薏仁
    'w-fruitveg-46': "sunflower seeds", // 葵瓜子
    'w-fruitveg-47': "garlic shoots", // 蒜苗
    'w-fruitveg-48': "salak", // 蛇皮果
    'w-fruitveg-49': "chayote", // 佛手瓜
    'w-fruitveg-50': "bottle gourd", // 葫蘆瓜
    'w-fruitveg-51': "wasabi", // 山葵
    'w-fruitveg-52': "turmeric", // 薑黃
    'w-fruitveg-53': "lemongrass", // 檸檬草
    'w-fruitveg-54': "parsley", // 巴西里
    'w-fruitveg-55': "basil", // 羅勒
    'w-fruitveg-56': "dill", // 蒔蘿
    'w-fruitveg-57': "Chinese broccoli", // 芥藍菜
    'w-fruitveg-58': "garland chrysanthemum", // 茼蒿
    'w-fruitveg-59': "amaranth", // 莧菜
    'w-fruitveg-60': "mature ginger", // 老薑
    'w-fruitveg-61': "shimeji mushroom", // 鴻喜菇
    'w-fruitveg-62': "white fungus", // 白木耳
    'w-fruitveg-63': "truffle", // 松露
    'w-fruitveg-64': "kelp", // 昆布
    'w-fruitveg-65': "water chestnut", // 荸薺
    'w-fruitveg-66': "cassava", // 樹薯
    'w-fruitveg-67': "buckwheat", // 蕎麥
    'w-fruitveg-68': "barley", // 大麥
    'w-fruitveg-69': "sorghum", // 高粱
    'w-fruitveg-70': "pumpkin seeds", // 南瓜子
    'w-fruitveg-71': "green papaya", // 青木瓜
    'w-fruitveg-72': "plum prune", // 西梅
    'w-fruitveg-73': "sweet persimmon", // 甜柿
    'w-fruitveg-74': "alfalfa sprouts", // 苜蓿芽
    'w-fruitveg-75': "arrowhead", // 慈菇
    'w-tech-108': "floor lamp", // 立燈
    'w-tech-109': "ceiling light", // 吸頂燈
    'w-tech-110': "electric kettle", // 電熱水壺
    'w-tech-111': "headphones", // 頭戴式耳機
    'w-tech-112': "wireless microphone", // 無線麥克風
    'w-tech-113': "ring light", // 補光燈
    'w-tech-114': "RC helicopter", // 遙控直升機
    'w-tech-115': "phone stand", // 手機支架
    'w-tech-116': "bluetooth speaker", // 藍牙喇叭
    'w-tech-117': "film camera", // 底片相機
    'w-tech-118': "DSLR camera", // 單眼相機
    'w-tech-119': "action camera", // 運動相機
    'w-tech-120': "card reader", // 刷卡機
    'w-tech-121': "barcode scanner", // 條碼槍
    'w-tech-122': "electric scooter", // 電動滑板車
    'w-tech-123': "light switch", // 開關
    'w-tech-124': "electronic dictionary", // 電子辭典
    'w-tech-125': "handheld console", // 掌上遊戲機
    'w-tech-126': "digital thermometer", // 電子溫度計
    'w-tech-127': "pedometer", // 計步器
    'w-tech-128': "water flosser", // 沖牙機
    'w-tech-129': "circulator fan", // 循環扇
    'w-tech-130': "smart plug", // 智慧插座
    'w-tech-131': "smart bulb", // 智慧燈泡
    'w-tech-132': "interactive whiteboard", // 電子白板
    'w-tech-133': "touchscreen", // 觸控螢幕
    'w-tech-134': "reading pen", // 點讀筆
    'w-tech-135': "set-top box", // 機上盒
    'w-tech-136': "graphics card", // 顯示卡
    'w-tech-137': "floppy disk", // 磁碟片
    'w-tech-138': "soldering iron", // 電烙鐵
    'w-tech-139': "multimeter", // 萬用電表
    'w-tech-140': "UPS", // 不斷電系統
    'w-tech-141': "monitor arm", // 螢幕支架
    'w-tech-142': "hand-crank generator", // 手搖發電機
    'w-tech-143': "solar charger", // 太陽能充電器
    'w-tech-144': "power supply unit", // 電源供應器
    'w-tech-145': "bone conduction headphones", // 骨傳導耳機
    'w-kitchen-90': "cake turntable", // 蛋糕轉台
    'w-kitchen-91': "offset spatula", // 抹刀
    'w-kitchen-92': "pizza stone", // 披薩石板
    'w-kitchen-93': "ice cream maker", // 冰淇淋機
    'w-kitchen-94': "yogurt maker", // 優格機
    'w-kitchen-95': "shaved ice machine", // 刨冰機
    'w-kitchen-96': "milk frother", // 奶泡壺
    'w-kitchen-97': "moka pot", // 摩卡壺
    'w-kitchen-98': "French press", // 濾壓壺
    'w-kitchen-99': "tea strainer", // 茶漏
    'w-kitchen-100': "tea caddy", // 茶葉罐
    'w-kitchen-101': "teacup", // 茶杯
    'w-kitchen-102': "champagne flute", // 香檳杯
    'w-kitchen-103': "bamboo skewer", // 竹籤
    'w-kitchen-104': "kitchen scissors", // 廚房剪刀
    'w-kitchen-105': "steak knife", // 牛排刀
    'w-kitchen-106': "bread knife", // 麵包刀
    'w-kitchen-107': "milk pan", // 牛奶鍋
    'w-kitchen-108': "Dutch oven", // 燉鍋
    'w-kitchen-109': "cast iron skillet", // 鑄鐵鍋
    'w-kitchen-110': "salad bowl", // 沙拉碗
    'w-kitchen-111': "noodle bowl", // 麵碗
    'w-kitchen-112': "dough scraper", // 刮板
    'w-kitchen-113': "piping tip", // 擠花嘴
    'w-kitchen-114': "pasta maker", // 製麵機
    'w-kitchen-115': "gaiwan", // 蓋碗
    'w-kitchen-116': "decanter", // 醒酒器
    'w-kitchen-117': "jigger", // 量酒器
    'w-kitchen-118': "sushi mat", // 壽司竹簾
    'w-kitchen-119': "takoyaki pan", // 章魚燒盤
    'w-kitchen-120': "spice rack", // 調味架
    'w-kitchen-121': "cutlery set", // 刀叉組
    'w-kitchen-122': "crab cracker", // 蟹鉗
    'w-kitchen-123': "canning jar", // 密封罐
    'w-kitchen-124': "chocolate mold", // 巧克力模
    'w-kitchen-125': "rice ball mold", // 飯糰模
    'w-clothes-121': "jumpsuit", // 連身褲
    'w-clothes-122': "pinafore dress", // 背帶裙
    'w-clothes-123': "cargo pants", // 工裝褲
    'w-clothes-124': "leggings", // 緊身褲
    'w-clothes-125': "yoga pants", // 瑜珈褲
    'w-clothes-126': "varsity jacket", // 棒球外套
    'w-clothes-127': "leather jacket", // 皮夾克
    'w-clothes-128': "denim jacket", // 牛仔外套
    'w-clothes-129': "windbreaker", // 防風外套
    'w-clothes-130': "bell-bottoms", // 喇叭褲
    'w-clothes-131': "ski jacket", // 滑雪衣
    'w-clothes-132': "loafers", // 樂福鞋
    'w-clothes-133': "riding boots", // 馬靴
    'w-clothes-134': "flip-flops", // 夾腳拖
    'w-clothes-135': "clogs", // 洞洞鞋
    'w-clothes-136': "canvas shoes", // 帆布鞋
    'w-clothes-137': "tank top", // 運動背心
    'w-clothes-138': "lab coat", // 實驗袍
    'w-clothes-139': "nurse uniform", // 護士服
    'w-clothes-140': "firefighter suit", // 消防衣
    'w-clothes-141': "army cap", // 軍帽
    'w-clothes-142': "police cap", // 警帽
    'w-clothes-143': "pirate hat", // 海盜帽
    'w-clothes-144': "wizard hat", // 巫師帽
    'w-clothes-145': "fur coat", // 毛皮大衣
    'w-clothes-146': "dudou", // 肚兜
    'w-clothes-147': "mandarin jacket", // 馬褂
    'w-clothes-148': "tights", // 褲襪
    'w-clothes-149': "leg warmers", // 襪套
    'w-clothes-150': "corsage", // 胸花
    'w-clothes-151': "flower crown", // 花冠
    'w-clothes-152': "embroidered shoes", // 繡花鞋
    'w-clothes-153': "platform shoes", // 厚底鞋
    'w-clothes-154': "tutu", // 舞裙
    'w-festival-113': "New Year goods", // 年貨
    'w-festival-114': "burning incense", // 燒香
    'w-festival-115': "joss paper", // 金紙
    'w-festival-116': "dragon boat race", // 賽龍舟
    'w-festival-117': "longevity noodles", // 長壽麵
    'w-festival-118': "countdown clock", // 倒數鐘
    'w-festival-119': "Christmas lights", // 聖誕燈
    'w-festival-120': "jingle bells", // 聖誕鈴鐺
    'w-festival-121': "graduation cap", // 畢業帽
    'w-festival-133': "five-color thread", // 五彩線
    'w-festival-134': "Laba porridge", // 臘八粥
    'w-festival-135': "money tree", // 搖錢樹
    'w-festival-136': "advent calendar", // 降臨曆
    'w-festival-137': "mistletoe", // 槲寄生
    'w-festival-138': "double happiness", // 囍字
    'w-festival-139': "wedding invitation", // 喜帖
    'w-festival-144': "Halloween mask", // 萬聖面具
    'w-festival-122': "bamboo leaves for zongzi", // 粽葉
    'w-festival-123': "yule log", // 聖誕蛋糕
    'w-festival-124': "yukata", // 浴衣
    'w-festival-125': "candy apple", // 蘋果糖
    'w-festival-126': "Halloween candy", // 萬聖糖果
    'w-festival-127': "pumpkin patch", // 南瓜田
    'w-festival-128': "harvest", // 豐收
    'w-festival-129': "party balloons", // 派對氣球
    'w-festival-130': "lantern fair", // 燈會
    'w-festival-131': "hand lantern", // 提燈
    'w-festival-140': "prayer for blessings", // 祈福
    'w-festival-141': "fortune stick", // 求籤
    'w-festival-142': "ema plaque", // 繪馬
    'w-festival-143': "kadomatsu", // 門松
    'w-festival-132': "wish lantern", // 許願燈
    'w-bird-61': "black-headed gull", // 紅嘴鷗
    'w-bird-62': "cassowary", // 食火雞
    'w-bird-63': "tit", // 山雀
    'w-bird-64': "kestrel", // 紅隼
    'w-bird-65': "swift", // 雨燕
    'w-insect-54': "wolf spider", // 狼蛛
    'w-insect-55': "tarantula", // 捕鳥蛛
    'w-insect-56': "pill bug", // 鼠婦
    'w-insect-57': "cabbage white butterfly", // 粉蝶
    'w-insect-58': "queen bee", // 女王蜂
    'w-insect-59': "bumblebee", // 熊蜂
    'w-insect-60': "fire ant", // 火蟻
    'w-insect-61': "mite", // 蟎
    'w-insect-62': "tick", // 蜱
    'w-bird-66': "oriole", // 黃鸝
    'w-bird-67': "ibis", // 朱鷺
    'w-bird-68': "wren", // 鷦鷯
    'w-bird-69': "barn owl", // 倉鴞
    'w-bird-70': "frigatebird", // 軍艦鳥
    'w-bird-71': "booby", // 鰹鳥
    'w-insect-63': "lacewing", // 草蛉
    'w-insect-64': "katydid", // 螽斯
    'w-insect-65': "click beetle", // 叩頭蟲
    'w-insect-66': "silverfish", // 衣魚
    'w-insect-67': "monarch butterfly", // 帝王斑蝶
    'w-insect-68': "leafcutter ant", // 切葉蟻
    'w-insect-69': "leafhopper", // 葉蟬
    'w-insect-70': "owl butterfly", // 貓頭鷹蝶
    'w-idiom-146': "smile through tears", // 破涕為笑
    'w-idiom-147': "hair standing on end in rage", // 怒髮衝冠
    'w-idiom-148': "a worried frown", // 愁眉苦臉
    'w-idiom-149': "not knowing whether to laugh or cry", // 哭笑不得
    'w-idiom-150': "stride with head held high", // 昂首闊步
    'w-idiom-151': "tiptoe quietly", // 躡手躡腳
    'w-idiom-152': "write furiously", // 奮筆疾書
    'w-idiom-153': "can't put it down", // 愛不釋手
    'w-idiom-154': "jump with rage", // 暴跳如雷
    'w-idiom-155': "listen attentively", // 洗耳恭聽
    'w-idiom-156': "rest with eyes closed", // 閉目養神
    'w-idiom-157': "shake one's head complacently", // 搖頭晃腦
    'w-idiom-158': "grind one's teeth in hatred", // 咬牙切齒
    'w-idiom-159': "hold one's breath and focus", // 屏氣凝神
    'w-idiom-160': "walk on thin ice", // 如履薄冰
    'w-idiom-161': "lightning and thunder", // 電閃雷鳴
    'w-idiom-162': "eye like a hungry tiger", // 虎視眈眈
    'w-idiom-163': "a sheep in the tiger's mouth", // 羊入虎口
    'w-idiom-164': "kill a chicken to scare the monkey", // 殺雞儆猴
    'w-idiom-165': "smooth sailing", // 一帆風順
    'w-idiom-166': "take the lead", // 一馬當先
    'w-idiom-167': "hit the nail on the head", // 一針見血
    'w-idiom-168': "drool with desire", // 垂涎三尺
    'w-idiom-169': "tongue-tied", // 張口結舌
    'w-idiom-170': "gasping for breath", // 氣喘吁吁
    'w-idiom-171': "make a fuss over nothing", // 大驚小怪
    'w-plant-110': "birch", // 白樺
    'w-plant-111': "cypress", // 柏樹
    'w-plant-112': "camphor tree", // 樟樹
    'w-plant-113': "lemon tree", // 檸檬樹
    'w-plant-114': "wild rose", // 薔薇
    'w-plant-115': "snapdragon", // 金魚草
    'w-plant-116': "chamomile", // 洋甘菊
    'w-plant-117': "rubber tree", // 橡膠樹
    'w-plant-118': "begonia", // 秋海棠
    'w-plant-119': "lilac", // 紫丁香
    'w-plant-120': "gladiolus", // 劍蘭
    'w-body-86': "collarbone", // 鎖骨
    'w-body-87': "armpit", // 腋下
    'w-body-88': "temple", // 太陽穴
    'w-body-89': "knuckle", // 指關節
    'w-trend-132': "danmaku comments", // 彈幕
    'w-trend-133': "photo retouching", // 修圖
    'w-fruitveg-76': "lentil", // 扁豆
    'w-fruitveg-77': "kidney bean", // 紅腰豆
    'w-fruitveg-78': "pecan", // 碧根果
    'w-fruitveg-79': "ginkgo nut", // 白果
    'w-fruitveg-80': "choy sum", // 菜心
    'w-fruitveg-81': "gynura", // 紅鳳菜
    'w-fruitveg-82': "bird's nest fern", // 山蘇
    'w-fruitveg-83': "shallot", // 紅蔥頭
    'w-fruitveg-84': "watercress", // 西洋菜
    'w-fruitveg-85': "kale", // 羽衣甘藍
    'w-fruitveg-86': "artichoke", // 朝鮮薊
    'w-fruitveg-87': "fennel", // 茴香
    'w-fruitveg-88': "cranberry", // 蔓越莓
    'w-fruitveg-89': "goji berry", // 枸杞
    'w-fruitveg-90': "reishi mushroom", // 靈芝
    'w-fruitveg-91': "dried longan", // 桂圓
    'w-fruitveg-92': "dried tangerine peel", // 陳皮
    'w-fruitveg-93': "green garlic", // 青蒜
    'w-fruitveg-94': "yellow chives", // 韭黃
    'w-fruitveg-95': "red onion", // 紫洋蔥
    'w-fruitveg-96': "blackcurrant", // 黑加侖
    'w-fruitveg-97': "gooseberry", // 醋栗
    'w-tech-146': "microphone stand", // 麥克風架
    'w-tech-147': "headphone stand", // 耳機架
    'w-tech-148': "screen protector", // 螢幕保護貼
    'w-tech-149': "burglar alarm", // 防盜警報器
    'w-tech-150': "racing wheel", // 遊戲方向盤
    'w-tech-151': "electric screwdriver", // 電動螺絲起子
    'w-tech-152': "glue gun", // 熱熔膠槍
    'w-tech-153': "satellite dish", // 衛星天線
    'w-tech-154': "camcorder", // 錄影機
    'w-tech-155': "laptop stand", // 筆電支架
    'w-tech-156': "cooling pad", // 散熱墊
    'w-tech-157': "star projector lamp", // 星空燈
    'w-tech-158': "motion sensor light", // 感應燈
    'w-tech-159': "hand warmer", // 暖手寶
    'w-tech-160': "welding machine", // 電焊機
    'w-tech-161': "circuit breaker", // 斷路器
    'w-kitchen-126': "meat tenderizer", // 肉槌
    'w-kitchen-127': "fish spatula", // 魚鏟
    'w-kitchen-128': "bottle brush", // 瓶刷
    'w-kitchen-129': "ice tongs", // 冰夾
    'w-kitchen-130': "dish brush", // 洗碗刷
    'w-kitchen-131': "toothpick holder", // 牙籤盒
    'w-kitchen-132': "napkin holder", // 餐巾架
    'w-kitchen-133': "cheese knife", // 起司刀
    'w-kitchen-134': "toast rack", // 吐司架
    'w-kitchen-135': "potato masher", // 馬鈴薯搗碎器
    'w-kitchen-136': "takeout box", // 外帶盒
    'w-kitchen-137': "fruit fork", // 水果叉
    'w-clothes-155': "bomber jacket", // 飛行外套
    'w-clothes-156': "board shorts", // 沙灘褲
    'w-clothes-157': "shower cap", // 浴帽
    'w-clothes-158': "leotard", // 緊身衣
    'w-clothes-159': "newsboy cap", // 報童帽
    'w-clothes-160': "hiking boots", // 登山靴
    'w-clothes-161': "mittens", // 連指手套
    'w-clothes-162': "nightcap", // 睡帽
    'w-clothes-163': "clutch bag", // 手拿包
    'w-clothes-164': "tote bag", // 托特包
    'w-clothes-165': "blazer", // 西裝外套
    'w-festival-145': "pumpkin pail", // 南瓜桶
    'w-festival-146': "wedding ring", // 婚戒
    'w-festival-147': "wedding cake", // 結婚蛋糕
    'w-festival-148': "red carpet", // 紅毯
    'w-festival-149': "Easter basket", // 彩蛋籃
    'w-festival-150': "heart chocolate", // 心形巧克力
    'w-festival-151': "flower girl", // 花童
    'w-festival-152': "gift basket", // 禮籃
    'w-festival-153': "cheers", // 乾杯
    'w-festival-154': "wedding car", // 婚車
    'w-festival-155': "wedding pastry", // 喜餅
    'w-festival-156': "bottle rocket", // 沖天炮
    'w-festival-157': "flower lei", // 夏威夷花環
    'w-festival-158': "New Year hat", // 新年帽
    'w-festival-159': "red bridal veil", // 紅蓋頭
    'w-festival-160': "toast", // 敬酒
    'w-festival-161': "bouquet toss", // 捧花拋
    'w-bird-72': "budgerigar", // 虎皮鸚鵡
    'w-bird-73': "cockatiel", // 玄鳳鸚鵡
    'w-bird-74': "crested serpent eagle", // 大冠鷲
    'w-bird-75': "tern", // 燕鷗
    'w-bird-76': "nightingale", // 夜鶯
    'w-insect-71': "damselfly", // 豆娘
    'w-insect-72': "bed bug", // 臭蟲
    'w-bird-77': "turtle dove", // 斑鳩
    'w-bird-78': "silver pheasant", // 白鷴
    'w-bird-79': "mallard", // 綠頭鴨
    'w-bird-80': "peregrine falcon", // 游隼
    'w-insect-73': "luna moth", // 天蠶蛾
    'w-insect-74': "jewel beetle", // 吉丁蟲
    'w-bird-81': "black kite", // 黑鳶
    'w-bird-82': "rainbow lorikeet", // 彩虹吸蜜鸚鵡
    'w-plant-121': "pear blossom", // 梨花
    'w-plant-122': "apricot blossom", // 杏花
    'w-plant-123': "peach tree", // 桃樹
    'w-plant-124': "orange tree", // 橘子樹
    'w-body-90': "instep", // 腳背
    'w-fruitveg-98': "corn on the cob", // 玉米棒
    'w-fruitveg-99': "garlic clove", // 蒜瓣
    'w-fruitveg-100': "ginger slice", // 薑片
    'w-fruitveg-101': "orange peel", // 橘子皮
    'w-fruitveg-102': "banana bunch", // 香蕉串
    'w-fruitveg-103': "bunch of grapes", // 葡萄串
    'w-fruitveg-104': "dried fruit", // 果乾
    'w-fruitveg-105': "pickles", // 醃黃瓜
    'w-fruitveg-106': "red chili", // 紅辣椒
    'w-fruitveg-107': "dried tofu", // 豆干
    'w-fruitveg-108': "pickled mustard stem", // 榨菜
    'w-fruitveg-109': "nectarine", // 油桃
    'w-fruitveg-110': "yellow peach", // 黃桃
    'w-fruitveg-111': "young coconut", // 椰青
    'w-fruitveg-112': "pea shoots", // 豌豆苗
    'w-fruitveg-113': "mung bean sprouts", // 綠豆芽
    'w-fruitveg-114': "radish sprouts", // 蘿蔔嬰
    'w-fruitveg-115': "apple peel", // 蘋果皮
    'w-fruitveg-116': "lemon slice", // 檸檬片
    'w-fruitveg-117': "purple sweet potato", // 紫薯
    'w-fruitveg-118': "kabocha squash", // 栗南瓜
    'w-fruitveg-119': "soybean sprouts", // 黃豆芽
    'w-tech-162': "reading lamp", // 閱讀燈
    'w-tech-163': "clip lamp", // 夾燈
    'w-tech-164': "solar light", // 太陽能燈
    'w-tech-165': "garden light", // 庭園燈
    'w-tech-166': "work light", // 工作燈
    'w-tech-167': "wall lamp", // 壁燈
    'w-tech-168': "string lights", // 燈串
    'w-tech-169': "desk fan", // 桌扇
    'w-tech-170': "gaming mouse", // 電競滑鼠
    'w-tech-171': "charging dock", // 充電座
    'w-tech-172': "electric curtain", // 電動窗簾
    'w-tech-173': "flameless candle", // 電子蠟燭
    'w-tech-174': "computer desk", // 電腦桌
    'w-tech-175': "standing fan", // 立扇
    'w-tech-176': "electric stove", // 電熱爐
    'w-tech-177': "HDMI cable", // HDMI線
    'w-tech-178': "e-bike", // 電動腳踏車
    'w-kitchen-138': "bubble tea cup", // 手搖杯
    'w-kitchen-139': "takeaway cup", // 外帶杯
    'w-kitchen-140': "cup lid", // 杯蓋
    'w-kitchen-141': "cup sleeve", // 杯套
    'w-kitchen-142': "milk bottle", // 牛奶瓶
    'w-kitchen-143': "wine rack", // 酒架
    'w-kitchen-144': "zip bag", // 保鮮袋
    'w-kitchen-145': "cooler bag", // 保冷袋
    'w-kitchen-146': "compost bin", // 廚餘桶
    'w-kitchen-147': "kitchen counter", // 流理台
    'w-kitchen-148': "kitchen cabinet", // 廚櫃
    'w-kitchen-149': "pasta tongs", // 麵條夾
    'w-kitchen-150': "meat fork", // 肉叉
    'w-kitchen-151': "rotisserie rack", // 烤雞架
    'w-kitchen-152': "sippy cup", // 吸管杯
    'w-kitchen-153': "drinking glass", // 玻璃杯
    'w-kitchen-154': "bowl lid", // 碗蓋
    'w-kitchen-155': "cork", // 酒瓶塞
    'w-clothes-166': "silk scarf", // 絲巾
    'w-clothes-167': "track jacket", // 運動外套
    'w-clothes-168': "dress pants", // 西裝褲
    'w-clothes-169': "casual pants", // 休閒褲
    'w-clothes-170': "undershirt", // 汗衫
    'w-clothes-171': "polo shirt", // 馬球衫
    'w-clothes-172': "striped shirt", // 條紋衫
    'w-clothes-173': "skort", // 裙褲
    'w-clothes-174': "velcro strap", // 魔鬼氈
    'w-clothes-175': "sleeveless top", // 無袖衫
    'w-festival-162': "colored lights", // 彩燈
    'w-festival-163': "bunting", // 彩旗
    'w-festival-164': "champagne", // 香檳
    'w-festival-165': "cake knife", // 蛋糕刀
    'w-festival-166': "birthday card", // 生日卡
    'w-festival-167': "party ball", // 彩球
    'w-festival-168': "candy jar", // 糖果罐
    'w-festival-169': "lantern float", // 花燈車
    'w-bird-83': "partridge", // 鷓鴣
    'w-bird-84': "bamboo partridge", // 竹雞
    'w-bird-85': "moorhen", // 紅冠水雞
    'w-bird-86': "wagtail", // 鶺鴒
    'w-bird-87': "bird's nest", // 鳥窩
    'w-bird-88': "birdhouse", // 鳥屋
    'w-insect-75': "queen of the hive", // 蜂王
    'w-insect-76': "pupa shell", // 蛹殼
    'w-insect-77': "butterfly swarm", // 蝶群
    'w-plant-125': "apple blossom", // 蘋果花
    'w-plant-126': "flower basket", // 花籃
    'w-plant-127': "plum tree", // 梅樹
    'w-animal-231': "white rabbit", // 白兔
    'w-animal-232': "grey wolf", // 灰狼
    'w-animal-233': "baby monkey", // 小猴
    'w-animal-234': "yellow dog", // 黃狗
    'w-animal-235': "black dog", // 黑狗
    'w-animal-236': "big bear", // 大熊
    'w-animal-237': "turtle shell", // 烏龜殼
    'w-home-267': "tissue", // 紙巾
    'w-home-268': "shoehorn", // 鞋拔
    'w-home-269': "clothes brush", // 衣刷
    'w-home-270': "chest of drawers", // 抽屜櫃
    'w-home-271': "armchair", // 沙發椅
    'w-home-272': "bed frame", // 床架
    'w-home-273': "window frame", // 窗框
    'w-home-274': "door frame", // 門框
    'w-home-275': "floor", // 地板
    'w-home-276': "ceiling", // 天花板
    'w-astro-67': "star chart", // 星圖
    'w-physics-59': "magnetic force", // 磁力
    'w-fairy-60': "magic cauldron", // 魔法鍋
    'w-fairy-61': "magic stone", // 魔法石
    'w-fairy-62': "wizard robe", // 魔法袍
    'w-fairy-63': "dragon scale", // 龍鱗
    'w-place-186': "alley entrance", // 巷口
    'w-place-187': "eaves", // 屋簷
    'w-place-188': "front gate", // 大門
    'w-place-189': "doorway", // 門口
    'w-place-190': "back door", // 後門
    'w-place-191': "street corner", // 街角
    'w-place-192': "footpath", // 小路
    'w-place-193': "main street", // 大街
    'w-food-329': "cake slice", // 蛋糕片
    'w-food-330': "bread slice", // 麵包片
    'w-food-331': "scrambled eggs", // 炒蛋
    'w-food-332': "meat bun", // 肉包
    'w-food-333': "vegetable bun", // 菜包
    'w-food-334': "steamed egg custard", // 蒸蛋
    'w-food-335': "milk candy", // 牛奶糖
    'w-food-336': "mashed potatoes", // 薯泥
    'w-food-337': "whipped cream", // 鮮奶油
    'w-food-338': "char siu", // 叉燒
    'w-food-339': "noodle soup", // 湯麵
    'w-food-340': "scallion oil noodles", // 蔥油麵
    'w-home-277': "insole", // 鞋墊
    'w-bird-89': "waterbird", // 水鳥
    'w-bird-90': "bird droppings", // 鳥糞
    'w-bird-91': "wild bird", // 野鳥
    'w-bird-92': "eagle talon", // 鷹爪
    'w-bird-93': "duck egg", // 鴨蛋
    'w-bird-94': "goose egg", // 鵝蛋
    'w-insect-78': "snail shell", // 蝸牛殼
    'w-insect-79': "little bee", // 小蜜蜂
    'w-insect-80': "big spider", // 大蜘蛛
    'w-insect-81': "small spider", // 小蜘蛛
    'w-insect-82': "little ant", // 小螞蟻
    'w-insect-83': "big ant", // 大螞蟻
    'w-insect-84': "black spider", // 黑蜘蛛
    'w-insect-85': "silk thread", // 蠶絲
    'w-insect-86': "beeswax", // 蜂蠟
    'w-festival-170': "birthday song", // 生日歌
    'w-festival-171': "gift bag", // 禮物袋
    'w-festival-172': "lantern viewing", // 賞燈
    'w-festival-173': "set off firecrackers", // 放鞭炮
    'w-festival-174': "grab red packets", // 搶紅包
    'w-festival-175': "new year", // 新年
    'w-festival-176': "dance party", // 舞會
    'w-festival-177': "celebration", // 慶典
    'w-festival-178': "yuanxiao", // 元宵
    'w-festival-179': "happy new year", // 新年快樂
    'w-fruitveg-120': "green apple", // 青蘋果
    'w-fruitveg-121': "mustard greens", // 芥菜
    'w-fruitveg-122': "straw mushroom", // 草菇
    'w-fruitveg-123': "citrus", // 柑橘
    'w-fruitveg-124': "young ginger", // 嫩薑
    'w-fruitveg-125': "dried radish", // 蘿蔔乾
    'w-clothes-176': "collar", // 衣領
    'w-clothes-177': "sleeve", // 袖子
    'w-clothes-178': "pocket", // 口袋
    'w-clothes-179': "shoe sole", // 鞋底
    'w-clothes-180': "leather bag", // 皮包
    'w-clothes-181': "shoulder bag", // 肩背包
    'w-clothes-182': "pet collar", // 項圈
    'w-clothes-183': "nightgown", // 睡袍
    'w-plant-128': "small tree", // 小樹
    'w-plant-129': "wildflower", // 野花
    'w-plant-130': "nectar", // 花蜜
    'w-plant-131': "pine needle", // 松針
    'w-plant-132': "willow leaf", // 柳葉
    'w-plant-133': "red leaves", // 紅葉
    'w-plant-134': "dead tree", // 枯樹
    'w-plant-135': "hedge", // 樹籬
    'w-body-91': "palm of hand", // 手心
    'w-body-92': "scalp", // 頭皮
    'w-body-93': "eye corner", // 眼角
    'w-body-94': "mouth corner", // 嘴角
    'w-body-95': "ear piercing", // 耳洞
    'w-body-96': "skin", // 皮膚
    'w-body-97': "blood vessel", // 血管
    'w-body-98': "nose tip", // 鼻尖
    'w-trend-134': "Hebe Tien", // 田馥甄
    'w-trend-135': "Show Lo", // 羅志祥
    'w-trend-136': "Wang Leehom", // 王力宏
    'w-trend-137': "Eddie Peng", // 彭于晏
    'w-trend-138': "Justin Bieber", // 小賈斯汀
    'w-trend-139': "Rihanna", // 蕾哈娜
    'w-trend-140': "Bruno Mars", // 布魯諾火星
    'w-trend-141': "Jeremy Lin", // 林書豪
    'w-kitchen-156': "steamer pot", // 蒸鍋
    'w-kitchen-157': "pot handle", // 鍋柄
    'w-kitchen-158': "dinner plate", // 餐盤
    'w-kitchen-159': "saucer", // 碟子
    'w-kitchen-160': "water bottle", // 水瓶
    'w-kitchen-161': "wine glass", // 酒杯
    'w-kitchen-162': "glass bottle", // 玻璃瓶
    'w-sport-90': "basketball stand", // 籃球架
    'w-sport-91': "soccer cleats", // 足球鞋
    'w-sport-92': "running shoes", // 跑鞋
    'w-sport-93': "sports team", // 球隊
    'w-sport-94': "silver medal", // 銀牌
    'w-sport-95': "bronze medal", // 銅牌
    'w-sport-96': "warm up", // 暖身
    'w-tech-179': "earphone cable", // 耳機線
    'w-tech-180': "charger head", // 充電頭
    'w-outdoor-104': "fishing bait", // 魚餌
    'w-outdoor-105': "picnic table", // 野餐桌
    'w-action-179': "squeeze toothpaste", // 擠牙膏
    'w-action-180': "polish shoes", // 擦鞋
    'w-idiom-172': "in high spirits", // 興高采烈
    'w-idiom-173': "talk to oneself", // 自言自語
    'w-idiom-174': "bruised face", // 鼻青臉腫
    'w-idiom-175': "bare fangs brandish claws", // 張牙舞爪
    'w-idiom-176': "perfect in every way", // 十全十美
    'w-idiom-177': "all sorts", // 五花八門
    'w-idiom-178': "give up halfway", // 半途而廢
    'w-idiom-179': "cannot wait", // 迫不及待
    'w-clothes-184': "wool socks", // 毛襪
    'w-clothes-185': "cotton socks", // 棉襪
    'w-clothes-186': "one-piece dress", // 連身裙
    'w-clothes-187': "waistcoat", // 馬甲
    'w-body-99': "side face", // 側臉
    'w-body-100': "back view", // 背影
    'w-body-101': "lower belly", // 小腹
    'w-body-102': "back of head", // 後腦
    'w-trend-142': "Yani Tseng", // 曾雅妮
    'w-trend-143': "Tanya Chua", // 蔡健雅
    'w-kitchen-163': "rice bin", // 米桶
    'w-kitchen-164': "grill rack", // 烤架
    'w-kitchen-165': "gas cylinder", // 瓦斯桶
    'w-outdoor-106': "fishing line", // 釣魚線
    'w-idiom-180': "with relish", // 津津有味
    'w-idiom-181': "listless", // 無精打采
    'w-idiom-182': "fully focused", // 全神貫注
    'w-idiom-183': "fearful and anxious", // 提心吊膽
    'w-idiom-184': "beaming with joy", // 眉開眼笑
    'w-idiom-185': "doubled over laughing", // 捧腹大笑
    'w-idiom-186': "vie to be first", // 爭先恐後
    'w-idiom-187': "burning with anxiety", // 心急如焚
    'w-idiom-188': "in unison", // 異口同聲
    'w-idiom-189': "all directions", // 四面八方
    'w-animal-238': "grizzly bear", // 灰熊
    'w-animal-239': "lioness", // 母獅
    'w-animal-240': "male lion", // 公獅
    'w-food-341': "beef jerky", // 牛肉乾
    'w-food-342': "flour", // 麵粉
    'w-food-343': "sugar", // 白糖
    'w-food-344': "soy sauce", // 醬油
    'w-food-345': "chili sauce", // 辣醬
    'w-food-346': "ketchup", // 番茄醬
    'w-food-347': "mayonnaise", // 美乃滋
    'w-food-348': "peanut butter", // 花生醬
    'w-food-349': "condensed milk", // 煉乳
    'w-food-350': "chicken breast", // 雞胸肉
    'w-home-278': "laundry powder", // 洗衣粉
    'w-home-279': "bleach", // 漂白水
    'w-home-280': "curtain rod", // 窗簾桿
    'w-home-281': "paper bag", // 紙袋
    'w-home-282': "paper cup", // 紙杯
    'w-home-283': "paper plate", // 紙盤
    'w-home-284': "menu", // 菜單
    'w-home-285': "bill", // 帳單
    'w-place-194': "exit", // 出口
    'w-place-195': "entrance", // 入口
    'w-place-196': "counter", // 櫃檯
    'w-place-197': "backstage", // 後台
    'w-place-198': "lobby", // 大廳
    'w-place-199': "aisle", // 走道
    'w-place-200': "dormitory", // 宿舍
    'w-place-201': "auditorium", // 禮堂
    'w-place-202': "countryside", // 鄉村
    'w-place-203': "city", // 城市
    'w-job-182': "master craftsman", // 師傅
    'w-job-183': "store manager", // 店長
    'w-job-184': "manager", // 經理
    'w-fun-161': "toy", // 玩具
    'w-fun-162': "joke", // 笑話
    'w-fun-163': "riddle", // 謎語
    'w-fun-164': "song", // 歌曲
    'w-vehicle-145': "car door", // 車門
    'w-vehicle-146': "car window", // 車窗
    'w-vehicle-147': "headlight", // 車燈
    'w-vehicle-148': "license plate", // 車牌
    'w-vehicle-149': "car roof", // 車頂
    'w-vehicle-150': "engine", // 引擎
    'w-vehicle-151': "brake", // 剎車
    'w-vehicle-152': "dashboard", // 儀表板
    'w-vehicle-153': "fuel tank", // 油箱
    'w-vehicle-154': "car trunk", // 後車廂
    'w-nature-149': "early morning", // 清晨
    'w-nature-150': "afternoon", // 午後
    'w-nature-151': "night", // 夜晚
    'w-nature-152': "daytime", // 白天
    'w-nature-153': "moonlit night", // 月夜
    'w-nature-154': "starlight", // 星光
    'w-nature-155': "ripple", // 水波
    'w-nature-156': "clear sky", // 晴空
    'w-nature-157': "blue sky", // 藍天
    'w-action-181': "say hello", // 打招呼
    'w-action-182': "wash feet", // 洗腳
    'w-animal-241': "fox cub", // 小狐狸
    'w-animal-242': "tiger cub", // 小老虎
    'w-animal-243': "lion cub", // 小獅子
    'w-animal-244': "baby turtle", // 小烏龜
    'w-animal-245': "little frog", // 小青蛙
    'w-animal-246': "dog bone", // 狗骨頭
    'w-animal-247': "bear paw", // 熊掌
    'w-animal-248': "pig snout", // 豬鼻子
    'w-animal-249': "elephant trunk", // 大象鼻子
    'w-animal-250': "zebra stripes", // 斑馬紋
    'w-animal-251': "spotted dog", // 斑點狗
    'w-animal-252': "dog tail", // 狗尾巴
    'w-animal-253': "cat tail", // 貓尾巴
    'w-animal-254': "bunny ears", // 兔耳朵
    'w-fruitveg-126': "watermelon rind", // 西瓜皮
    'w-fruitveg-127': "apple slices", // 蘋果片
    'w-fruitveg-128': "yellow pepper", // 黃椒
    'w-fruitveg-129': "small chili", // 小辣椒
    'w-fruitveg-130': "broccoli florets", // 綠花椰
    'w-fruitveg-131': "salad greens", // 生菜
    'w-fruitveg-132': "corn silk", // 玉米鬚
    'w-food-351': "shrimp roll", // 蝦捲
    'w-food-352': "beef soup", // 牛肉湯
    'w-food-353': "chicken soup", // 雞湯
    'w-food-354': "fish soup", // 魚湯
    'w-food-355': "strawberry milk", // 草莓牛奶
    'w-food-356': "iced black tea", // 冰紅茶
    'w-food-357': "hot coffee", // 熱咖啡
    'w-food-358': "rice milk", // 米漿
    'w-food-359': "cookie tin", // 餅乾盒
    'w-food-360': "candy wrapper", // 糖果紙
    'w-food-361': "chocolate chips", // 巧克力片
    'w-food-362': "cheese slice", // 起司片
    'w-food-363': "jam toast", // 果醬吐司
    'w-food-364': "scallion omelette", // 蔥花蛋
    'w-food-365': "tomato egg stir-fry", // 番茄炒蛋
    'w-home-286': "laundry bag", // 洗衣袋
    'w-home-287': "door lock", // 門鎖
    'w-home-288': "keyhole", // 鑰匙孔
    'w-home-289': "door peephole", // 貓眼
    'w-home-290': "house number plate", // 門牌
    'w-home-291': "letter mail", // 信件
    'w-home-292': "parcel", // 包裹
    'w-home-293': "filing cabinet", // 檔案櫃
    'w-home-294': "white glue", // 白膠
    'w-home-295': "pen cap", // 筆蓋
    'w-home-296': "pencil lead", // 筆芯
    'w-home-297': "notepad", // 便條紙
    'w-home-298': "scrapbook", // 剪貼簿
    'w-home-299': "photograph", // 相片
    'w-place-204': "ticket window", // 售票口
    'w-place-205': "checkout counter", // 收銀台
    'w-place-206': "fitting room", // 試衣間
    'w-place-207': "locker room", // 更衣室
    'w-place-208': "lounge", // 休息室
    'w-place-209': "courtyard", // 庭院
    'w-job-185': "bus driver", // 公車司機
    'w-job-186': "intern", // 實習生
    'w-job-187': "boss lady", // 老闆娘
    'w-job-188': "building manager", // 管理員
    'w-job-189': "sports fan", // 球迷
    'w-fun-165': "read comics", // 看漫畫
    'w-fun-166': "play harmonica", // 吹口琴
    'w-vehicle-155': "pedal", // 腳踏板
    'w-vehicle-156': "car seat", // 安全座椅
    'w-vehicle-157': "turn signal", // 方向燈
    'w-vehicle-158': "brake light", // 煞車燈
    'w-vehicle-159': "gas pedal", // 油門
    'w-vehicle-160': "gear shift", // 排檔
    'w-vehicle-161': "train ticket", // 車票
    'w-nature-158': "sunshower", // 太陽雨
    'w-nature-159': "morning sun", // 朝陽
    'w-action-183': "turn on light", // 開燈
    'w-action-184': "turn off light", // 關燈
    'w-action-185': "close door", // 關門
    'w-action-186': "open window", // 開窗
    'w-action-187': "look in mirror", // 照鏡子
    'w-action-188': "blow nose", // 擤鼻涕
    'w-action-189': "tickle", // 搔癢
    'w-action-190': "fold quilt", // 摺被子
    'w-action-191': "scrub toilet", // 刷馬桶
    'w-action-192': "vacuum floor", // 吸地
    'w-action-193': "write diary", // 寫日記
    'w-action-194': "typing", // 打字
    'w-action-195': "check watch", // 看手錶
    'w-action-196': "put on glasses", // 戴眼鏡
    'w-action-197': "take off shoes", // 脫鞋
    'w-action-198': "put on socks", // 穿襪子
    'w-action-199': "wear mask", // 戴口罩
    'w-clothes-188': "thermal underwear", // 衛生衣
    'w-kitchen-166': "small bowl", // 小碗
    'w-kitchen-167': "rice measuring cup", // 量米杯
    'w-kitchen-168': "bowl and chopsticks", // 碗筷
    'w-kitchen-169': "lunch bag", // 便當袋
    'w-tech-181': "keycap", // 鍵帽
    'w-plant-136': "sunflower field", // 向日葵田
    'w-insect-87': "ants moving", // 螞蟻搬家
    'w-insect-88': "red ant", // 紅螞蟻
    'w-festival-180': "birthday present", // 生日禮物
    'w-festival-181': "pray at temple", // 拜拜
    'w-sport-97': "basketball shoes", // 籃球鞋
    'w-sport-98': "ping pong paddle", // 桌球拍
    'w-sport-99': "shoot at goal", // 射門
    'w-sport-100': "hit the ball", // 擊球
    'w-sport-101': "start of race", // 起跑
    'w-sport-102': "cross the finish line", // 衝線
    'w-sport-103': "award ceremony", // 頒獎
    'w-body-103': "long hair", // 長髮
    'w-body-104': "short hair", // 短髮
    'w-body-105': "bangs", // 瀏海
    'w-body-106': "stubble", // 鬍渣
    'w-body-107': "headache", // 頭痛
    'w-body-108': "stomachache", // 肚子痛
    'w-body-109': "fever", // 發燒
    'w-body-110': "cold flu", // 感冒
    'w-body-111': "fracture", // 骨折
    'w-animal-255': "litter box", // 貓砂盆
    'w-animal-256': "dog bowl", // 狗碗
    'w-animal-257': "cat scratcher", // 貓抓板
    'w-animal-258': "fish food", // 魚飼料
    'w-animal-259': "dog leash", // 狗繩
    'w-animal-260': "pet cage", // 寵物籠
    'w-animal-261': "seal pup", // 小海豹
    'w-animal-262': "baby zebra", // 小斑馬
    'w-food-366': "breakfast", // 早餐
    'w-food-367': "lunch", // 午餐
    'w-food-368': "dinner", // 晚餐
    'w-food-369': "midnight snack", // 宵夜
    'w-food-370': "snack", // 點心
    'w-food-371': "junk food", // 零食
    'w-food-372': "toast slice", // 吐司片
    'w-food-373': "egg yolk", // 蛋黃
    'w-food-374': "egg white", // 蛋白
    'w-food-375': "milk powder", // 奶粉
    'w-home-300': "slipper rack", // 拖鞋架
    'w-home-301': "window pane", // 窗戶玻璃
    'w-home-302': "bottle lid", // 瓶蓋
    'w-home-303': "battery box", // 電池盒
    'w-place-210': "bakery shop", // 麵包坊
    'w-place-211': "principal's office", // 校長室
    'w-place-212': "music room", // 音樂教室
    'w-place-213': "art room", // 美術教室
    'w-place-214': "computer lab", // 電腦教室
    'w-place-215': "bus terminal", // 公車總站
    'w-job-190': "neighbor auntie", // 鄰居阿姨
    'w-job-191': "homeroom teacher", // 班導師
    'w-job-192': "PE teacher", // 體育老師
    'w-job-193': "music teacher", // 音樂老師
    'w-job-194': "art teacher", // 美術老師
    'w-fun-167': "play in mud", // 玩泥巴
    'w-fun-168': "fold paper crane", // 折紙鶴
    'w-fun-169': "play tag", // 玩捉人
    'w-fun-170': "cup stacking", // 疊杯子
    'w-fun-171': "toss beanbags", // 丟沙包
    'w-fun-172': "play dodgeball", // 玩躲避球
    'w-nature-160': "rainbow after rain", // 雨後彩虹
    'w-nature-161': "sea surface", // 海面
    'w-nature-162': "lake surface", // 湖面
    'w-nature-163': "rainy night", // 雨夜
    'w-nature-164': "snowy night", // 雪夜
    'w-vehicle-162': "back seat", // 後座
    'w-vehicle-163': "front seat", // 前座
    'w-vehicle-164': "bike lock", // 車鎖
    'w-vehicle-165': "airbag", // 安全氣囊
    'w-vehicle-166': "scooter pillion", // 機車後座
    'w-vehicle-167': "park the car", // 停車
    'w-action-200': "wash handkerchief", // 洗手帕
    'w-action-201': "wipe tears", // 擦眼淚
    'w-action-202': "draw curtains", // 拉窗簾
    'w-action-203': "press elevator button", // 按電梯
    'w-action-204': "hold umbrella", // 拿雨傘
    'w-action-205': "walk with crutch", // 撐拐杖
    'w-action-206': "carry boxes", // 搬箱子
    'w-action-207': "push door", // 推門
    'w-action-208': "pull door", // 拉門
    'w-action-209': "sit down", // 坐下
    'w-action-210': "stand up", // 站起來
    'w-action-211': "lie down", // 躺下
    'w-action-212': "jump up", // 跳起來
    'w-action-213': "fall down", // 跌倒
    'w-action-214': "run over", // 跑過來
    'w-action-215': "drink milk", // 喝牛奶
    'w-action-216': "eat apple", // 吃蘋果
    'w-action-217': "eat noodles", // 吃麵
    'w-action-218': "drink coffee", // 喝咖啡
    'w-action-219': "eat watermelon", // 吃西瓜
    'w-body-112': "toenail", // 腳指甲
    'w-body-113': "toothache", // 牙齒痛
    'w-body-114': "sore finger", // 手指痛
    'w-animal-263': "beluga whale", // 白鯨
    'w-animal-264': "howling wolf", // 狼嚎
    'w-animal-265': "lion roar", // 獅吼
    'w-bird-95': "peacock display", // 孔雀開屏
    'w-bird-96': "rooster crowing", // 公雞啼
    'w-food-376': "grape juice", // 葡萄汁
    'w-food-377': "yakiniku", // 燒肉
    'w-food-378': "matcha", // 抹茶
    'w-food-379': "spicy hot pot", // 麻辣鍋
    'w-home-304': "sofa bed", // 沙發床
    'w-home-305': "high chair", // 高腳椅
    'w-home-306': "double-sided tape", // 雙面膠
    'w-home-307': "staples", // 訂書針
    'w-home-308': "letter paper", // 信紙
    'w-home-309': "postcard", // 明信片
    'w-home-310': "pencil shavings", // 鉛筆屑
    'w-home-311': "bath pouf", // 沐浴球
    'w-home-312': "toothbrush holder", // 牙刷架
    'w-home-313': "full-length mirror", // 全身鏡
    'w-place-216': "snack shop", // 小吃店
    'w-place-217': "bento shop", // 便當店
    'w-place-218': "clothing store", // 服飾店
    'w-place-219': "phone shop", // 手機店
    'w-place-220': "appliance store", // 電器行
    'w-place-221': "pediatric clinic", // 小兒科
    'w-place-222': "after-school class", // 安親班
    'w-place-223': "talent class", // 才藝班
    'w-place-224': "claw machine shop", // 夾娃娃店
    'w-place-225': "food court", // 美食街
    'w-job-195': "truck driver", // 卡車司機
    'w-job-196': "train driver", // 火車司機
    'w-job-197': "paperboy", // 送報生
    'w-job-198': "policewoman", // 女警
    'w-job-199': "new student", // 新生
    'w-job-200': "student on duty", // 值日生
    'w-job-201': "senior student", // 學長
    'w-vehicle-168': "ladder truck", // 雲梯車
    'w-vehicle-169': "delivery scooter", // 外送機車
    'w-vehicle-170': "bike rack", // 腳踏車架
    'w-vehicle-171': "luggage rack", // 行李架
    'w-vehicle-172': "bus strap", // 公車吊環
    'w-vehicle-173': "ticket machine", // 售票機
    'w-vehicle-174': "ticket gate", // 閘門
    'w-nature-165': "scorching sun", // 烈日
    'w-nature-166': "cold wind", // 寒風
    'w-nature-167': "spring rain", // 春雨
    'w-nature-168': "creekside", // 溪邊
    'w-action-220': "eat breakfast", // 吃早餐
    'w-action-221': "eat bento", // 吃便當
    'w-action-222': "drink juice", // 喝果汁
    'w-action-223': "blow bubble gum", // 吹泡泡糖
    'w-action-224': "turn off TV", // 關電視
    'w-action-225': "read newspaper", // 看報紙
    'w-action-226': "clean up", // 打掃
    'w-action-227': "measure height", // 量身高
    'w-action-228': "weigh oneself", // 量體重
    'w-action-229': "cut nails", // 剪指甲
    'w-action-230': "apply ointment", // 擦藥
    'w-action-231': "honk the horn", // 按喇叭
    'w-action-232': "pinch nose", // 捏鼻子
    'w-action-233': "stroke chin", // 摸下巴
    'w-action-234': "cover ears", // 捂耳朵
    'w-action-235': "tuck in blanket", // 蓋被子
    'w-action-236': "sit cross-legged", // 盤腿
    'w-clothes-189': "plaid shirt", // 格子襯衫
    'w-clothes-190': "floral shirt", // 花襯衫
    'w-clothes-191': "leather gloves", // 皮手套
    'w-clothes-192': "tie clip", // 領帶夾
    'w-clothes-193': "suspenders", // 吊帶
    'w-kitchen-170': "steaming rack", // 蒸架
    'w-kitchen-171': "salt", // 鹽巴
    'w-kitchen-172': "pots and pans", // 鍋碗瓢盆
    'w-tech-182': "RC airplane", // 遙控飛機
    'w-tech-183': "RC boat", // 遙控船
    'w-tech-184': "phone screen", // 手機螢幕
    'w-tech-185': "night vision goggles", // 夜視鏡
    'w-tech-186': "speed camera", // 測速照相
    'w-plant-137': "ginkgo leaf", // 銀杏葉
    'w-plant-138': "cactus flower", // 仙人掌花
    'w-plant-139': "rose thorn", // 玫瑰刺
    'w-insect-89': "bee collecting nectar", // 蜜蜂採蜜
    'w-insect-90': "spider spinning web", // 蜘蛛結網
    'w-festival-182': "new year's wish", // 新年願望
    'w-festival-183': "thank-you banquet", // 謝師宴
    'w-sport-104': "jumping jacks", // 開合跳
    'w-sport-105': "hop on one foot", // 單腳跳
    'w-outdoor-107': "gather leaves", // 撿落葉
    'w-outdoor-108': "chase butterflies", // 追蝴蝶
    'w-outdoor-109': "catch cicadas", // 抓蟬
    'w-outdoor-110': "catch crickets", // 捉蟋蟀
    'w-outdoor-111': "watch fireflies", // 看螢火蟲
    'w-outdoor-112': "sunbathe", // 曬太陽
    'w-outdoor-113': "float paper boats", // 放紙船
    'w-body-115': "earwax", // 耳屎
    'w-body-116': "saliva", // 口水
    'w-body-117': "dandruff", // 頭皮屑
    'w-body-118': "sunburn", // 曬傷
    'w-body-119': "bruise", // 瘀青
    'w-body-120': "blister", // 水泡
    'w-body-121': "heartbeat", // 心跳
    'w-food-380': "rice crust", // 鍋巴
    'w-food-381': "thick meat soup", // 肉羹
    'w-food-382': "century egg tofu", // 皮蛋豆腐
    'w-home-314': "shoe polish", // 鞋油
    'w-home-315': "storage rack", // 置物架
    'w-home-316': "mop bucket", // 拖把桶
    'w-place-226': "nail salon", // 美甲店
    'w-place-227': "shaved ice shop", // 冰店
    'w-job-202': "manicurist", // 美甲師
    'w-job-203': "real estate agent", // 房仲
    'w-job-204': "piano teacher", // 鋼琴老師
    'w-job-205': "swim coach", // 游泳教練
    'w-job-206': "fitness coach", // 健身教練
    'w-vehicle-175': "scooter seat", // 機車坐墊
    'w-nature-169': "rainwater", // 雨水
    'w-action-237': "open the fridge", // 打開冰箱
    'w-action-238': "tear off calendar page", // 撕日曆
    'w-action-239': "swat a mosquito", // 拍蚊子
    'w-action-240': "pick up litter", // 撿垃圾
    'w-action-241': "peel a banana", // 剝香蕉
    'w-action-242': "fan oneself", // 搖扇子
    'w-action-243': "wring a towel", // 擰毛巾
    'w-action-244': "insert a coin", // 投硬幣
    'w-action-245': "write on blackboard", // 寫黑板
    'w-clothes-194': "safety pin", // 安全別針
    'w-kitchen-173': "food cover", // 菜罩
    'w-kitchen-174': "fridge magnet", // 冰箱磁鐵
    'w-festival-184': "wedding photo", // 婚紗照
    'w-festival-185': "full-month party", // 滿月酒
    'w-sport-106': "breaststroke", // 蛙式
    'w-outdoor-114': "watch meteors", // 看流星
    'w-outdoor-115': "sketch outdoors", // 寫生
    'w-body-122': "thirsty", // 口渴
    'w-body-123': "dizzy", // 頭暈
    'w-animal-266': "barking dog", // 狗吠
    'w-tech-187': "digital signage", // 電子看板
    'w-festival-186': "zhuazhou ceremony", // 抓周
    'w-action-246': "dust off", // 拍灰塵
  };
}));
