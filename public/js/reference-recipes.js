/* Topic-specific offline drawings for the expanded prompt bank. */
(function (root, factory) {
  'use strict';
  var api = factory(
    typeof module === 'object' && module.exports
      ? require('./words.js')
      : root.Words,
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ReferenceRecipes = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Words) {
  'use strict';

  var recipes = {};
  var completed = {
    'w-food-2': true,
    'w-food-5': true,
    'w-food-27': true,
    'w-food-79': true,
    'w-home-15': true,
    'w-home-19': true,
    'w-nature-5': true,
    'w-nature-6': true,
    'w-nature-17': true,
    'w-nature-70': true,
    'w-fun-0': true,
    'w-fun-1': true,
    'w-fun-2': true,
    'w-civics-21': true,
    'w-civics-22': true,
    'w-physics-9': true,
    'w-physics-12': true,
    'w-physics-24': true,
    'w-astro-5': true,
    'w-astro-12': true,
    'w-music-4': true,
    'w-body-0': true,
    'w-body-1': true,
    'w-body-3': true,
    'w-clothes-0': true,
    'w-clothes-1': true,
    'w-clothes-4': true,
    'w-clothes-5': true,
    'w-clothes-6': true,
    'w-festival-1': true,
  };

  function op(color, kind, args) {
    return { c: color, o: [kind].concat(args) };
  }

  function add(out, color, kind) {
    out.push(op(color, kind, Array.prototype.slice.call(arguments, 3)));
  }

  function line(out, color, x1, y1, x2, y2) {
    add(out, color, 'l', x1, y1, x2, y2);
  }
  function path(out, color) {
    add.apply(
      null,
      [out, color, 'p'].concat(Array.prototype.slice.call(arguments, 2)),
    );
  }
  function shape(out, color) {
    add.apply(
      null,
      [out, color, 's'].concat(Array.prototype.slice.call(arguments, 2)),
    );
  }
  function circle(out, color, x, y, r) {
    add(out, color, 'c', x, y, r);
  }
  function ellipse(out, color, x, y, rx, ry, rot) {
    add(out, color, 'e', x, y, rx, ry, rot || 0);
  }
  function rect(out, color, x, y, w, h) {
    add(out, color, 'r', x, y, w, h);
  }
  function arc(out, color, x, y, r, from, to) {
    add(out, color, 'a', x, y, r, from, to);
  }
  function rays(out, color, x, y, inner, outer, count, offset) {
    add(out, color, 'ray', x, y, inner, outer, count, offset || 0);
  }
  function star(out, color, x, y, outer, inner, arms) {
    add(out, color, 'st', x, y, outer, inner, arms || 5);
  }

  function combined(word) {
    var english = Words.byId(word.id, 'en');
    return (word.text + ' ' + (english ? english.text : '')).toLowerCase();
  }

  function has(name, words) {
    return words.some(function (word) {
      return name.indexOf(word) >= 0;
    });
  }

  function face(out, mood) {
    ellipse(out, 'skin', 500, 440, 245, 255, 0);
    ellipse(out, 'brown', 500, 250, 235, 110, 0);
    ellipse(out, 'white', 405, 420, 34, 48, 0);
    ellipse(out, 'white', 595, 420, 34, 48, 0);
    circle(out, 'dark', 412, 425, 15);
    circle(out, 'dark', 588, 425, 15);
    if (mood === 'sad' || mood === 'angry' || mood === 'worried') {
      path(out, 'brown', 350, 350, 405, 330, 455, 350);
      path(out, 'brown', 545, 350, 595, 330, 650, 350);
    }
    if (mood === 'angry') {
      line(out, 'red', 345, 325, 440, 365);
      line(out, 'red', 655, 325, 560, 365);
    }
    if (mood === 'surprised') ellipse(out, 'red', 500, 610, 42, 64, 0);
    else if (mood === 'sad') arc(out, 'red', 500, 665, 75, 205, 335);
    else if (mood === 'angry' || mood === 'worried')
      arc(out, 'red', 500, 620, 58, 205, 335);
    else path(out, 'red', 420, 600, 465, 640, 535, 640, 580, 600);
    if (mood === 'happy') {
      ellipse(out, 'pink', 350, 525, 35, 20, 0);
      ellipse(out, 'pink', 650, 525, 35, 20, 0);
    }
  }

  function person(out, kind) {
    circle(out, 'skin', 500, 250, 112);
    ellipse(out, 'brown', 500, 170, 125, 55, 0);
    rect(out, 'skin', 460, 350, 80, 100);
    shape(out, 'blue', 325, 450, 675, 450, 760, 850, 240, 850);
    line(out, 'skin', 340, 500, 180, 710);
    line(out, 'skin', 660, 500, 820, 710);
    line(out, 'dark', 400, 850, 360, 975);
    line(out, 'dark', 600, 850, 640, 975);
    circle(out, 'dark', 465, 245, 11);
    circle(out, 'dark', 535, 245, 11);
    path(out, 'red', 465, 300, 500, 320, 535, 300);
    if (kind === 'hat') {
      ellipse(out, 'gold', 500, 155, 160, 22, 0);
      rect(out, 'gold', 425, 90, 150, 65);
    }
  }

  function drawAnimal(name) {
    var out = [];
    if (has(name, ['dinosaur', '恐龍'])) {
      ellipse(out, 'green', 465, 575, 230, 135, -8);
      path(out, 'green', 610, 540, 665, 360, 760, 340, 820, 420, 740, 500);
      shape(out, 'green', 760, 390, 920, 440, 780, 490);
      line(out, 'green', 350, 650, 300, 840);
      line(out, 'green', 520, 680, 500, 850);
      line(out, 'green', 650, 640, 670, 830);
      path(out, 'green', 260, 570, 160, 520, 115, 430);
      for (var plate = 0; plate < 5; plate++)
        shape(
          out,
          'orange',
          360 + plate * 72,
          440,
          390 + plate * 72,
          360,
          430 + plate * 72,
          455,
        );
      circle(out, 'white', 775, 410, 24);
      circle(out, 'dark', 780, 410, 11);
      return out;
    }
    if (
      has(name, [
        'fish',
        'shark',
        'whale',
        'dolphin',
        '鯊',
        '魚',
        '海豚',
        '鯨',
        '海馬',
      ])
    ) {
      ellipse(out, 'blue', 475, 520, 255, 150, 0);
      shape(out, 'blue', 700, 520, 875, 400, 865, 640);
      shape(out, 'teal', 430, 390, 510, 270, 575, 390);
      circle(out, 'dark', 330, 490, 18);
      arc(out, 'dark', 255, 560, 70, 10, 90);
      path(out, 'silver', 350, 560, 430, 585, 510, 560);
      for (var i = 0; i < 3; i++)
        line(out, 'silver', 535 + i * 28, 505, 550 + i * 28, 540);
      if (has(name, ['whale', '鯨']))
        path(out, 'sky', 300, 340, 330, 280, 360, 340);
      if (has(name, ['shark', '鯊']))
        shape(out, 'white', 405, 615, 500, 680, 580, 610);
      if (has(name, ['海馬', 'seahorse']))
        path(out, 'gold', 580, 470, 650, 400, 620, 350, 570, 390);
      return out;
    }
    if (has(name, ['octopus', 'jellyfish', '章魚', '水母'])) {
      ellipse(out, 'purple', 500, 390, 185, 160, 0);
      circle(out, 'dark', 445, 405, 16);
      circle(out, 'dark', 555, 405, 16);
      arc(out, 'red', 500, 450, 38, 15, 165);
      for (var j = 0; j < 6; j++)
        path(
          out,
          'purple',
          365 + j * 54,
          520,
          325 + j * 54,
          650,
          370 + j * 54,
          760,
        );
      if (has(name, ['jellyfish', '水母'])) {
        ellipse(out, 'sky', 500, 330, 180, 135, 0);
        rays(out, 'teal', 500, 320, 155, 172, 8, 0);
      }
      return out;
    }
    if (has(name, ['crab', 'lobster', 'shrimp', '蝦', '蟹', '龍蝦'])) {
      ellipse(out, 'red', 500, 550, 205, 125, 0);
      arc(out, 'red', 500, 560, 175, 185, 355);
      circle(out, 'white', 440, 440, 40);
      circle(out, 'white', 560, 440, 40);
      circle(out, 'dark', 445, 445, 14);
      circle(out, 'dark', 555, 445, 14);
      for (var k = 0; k < 3; k++) {
        path(
          out,
          'red',
          355,
          565 + k * 40,
          245,
          610 + k * 35,
          210,
          690 + k * 35,
        );
        path(
          out,
          'red',
          645,
          565 + k * 40,
          755,
          610 + k * 35,
          790,
          690 + k * 35,
        );
      }
      shape(out, 'red', 300, 520, 175, 430, 245, 555);
      shape(out, 'red', 700, 520, 825, 430, 755, 555);
      return out;
    }
    if (
      has(name, [
        'bird',
        'duck',
        'chicken',
        'turkey',
        'eagle',
        'parrot',
        'owl',
        'penguin',
        'swan',
        'pigeon',
        '鴨',
        '雞',
        '鳥',
        '鷹',
        '鴕鳥',
        '鵝',
        '鸚鵡',
        '孔雀',
        '企鵝',
        '火雞',
        '鴿',
      ])
    ) {
      ellipse(out, 'gold', 480, 540, 220, 155, -8);
      circle(out, 'gold', 640, 395, 104);
      ellipse(out, 'orange', 325, 545, 120, 70, -25);
      shape(out, 'orange', 730, 400, 850, 430, 730, 465);
      circle(out, 'dark', 665, 380, 14);
      path(out, 'brown', 360, 520, 465, 455, 570, 515);
      line(out, 'brown', 440, 680, 420, 790);
      line(out, 'brown', 550, 680, 570, 790);
      if (has(name, ['penguin', '企鵝']))
        ellipse(out, 'white', 490, 545, 105, 125, -5);
      if (has(name, ['eagle', '鷹']))
        shape(out, 'brown', 300, 520, 175, 455, 295, 590);
      if (has(name, ['peacock', '孔雀'])) {
        for (var f = 0; f < 5; f++)
          ellipse(out, 'teal', 330 + f * 80, 330, 38, 120, (f - 2) * 12);
      }
      if (has(name, ['turkey', '火雞'])) {
        for (var feather = 0; feather < 7; feather++)
          ellipse(
            out,
            'orange',
            290 + feather * 70,
            345,
            38,
            120,
            (feather - 3) * 10,
          );
      }
      return out;
    }
    if (has(name, ['earthworm', 'worm', '蚯蚓'])) {
      path(
        out,
        'brown',
        180,
        620,
        250,
        460,
        340,
        560,
        430,
        440,
        520,
        560,
        610,
        450,
        700,
        560,
        790,
        470,
        850,
        550,
      );
      for (var ring = 0; ring < 6; ring++)
        line(
          out,
          'cream',
          265 + ring * 90,
          495 + (ring % 2) * 45,
          280 + ring * 90,
          540 + (ring % 2) * 40,
        );
      return out;
    }
    if (
      has(name, [
        'butterfly',
        'moth',
        'dragonfly',
        'bee',
        'wasp',
        'ladybug',
        'beetle',
        'caterpillar',
        'spider',
        'ant',
        'fly',
        'mosquito',
        '蝴蝶',
        '蜜蜂',
        '瓢蟲',
        '蜘蛛',
        '螞蟻',
        '毛毛蟲',
        '蜻蜓',
      ])
    ) {
      if (has(name, ['butterfly', 'moth', '蝴蝶'])) {
        ellipse(out, 'pink', 360, 420, 150, 205, -25);
        ellipse(out, 'purple', 640, 420, 150, 205, 25);
        ellipse(out, 'yellow', 365, 650, 95, 120, 25);
        ellipse(out, 'teal', 635, 650, 95, 120, -25);
        circle(out, 'brown', 500, 520, 45);
        line(out, 'brown', 485, 475, 430, 400);
        line(out, 'brown', 515, 475, 570, 400);
        circle(out, 'gold', 350, 420, 30);
        circle(out, 'gold', 650, 420, 30);
      } else if (has(name, ['spider', '蜘蛛'])) {
        circle(out, 'dark', 500, 510, 120);
        circle(out, 'dark', 500, 330, 72);
        for (var leg = 0; leg < 4; leg++) {
          path(
            out,
            'dark',
            410,
            475 + leg * 30,
            310,
            415 + leg * 30,
            255,
            475 + leg * 30,
          );
          path(
            out,
            'dark',
            590,
            475 + leg * 30,
            690,
            415 + leg * 30,
            745,
            475 + leg * 30,
          );
        }
        circle(out, 'red', 475, 320, 12);
        circle(out, 'red', 525, 320, 12);
      } else {
        for (var seg = 0; seg < 5; seg++)
          circle(out, seg % 2 ? 'gold' : 'orange', 300 + seg * 100, 510, 70);
        circle(out, 'dark', 760, 490, 65);
        for (var l = 0; l < 3; l++) {
          line(out, 'dark', 365 + l * 115, 560, 310 + l * 115, 690);
          line(out, 'dark', 365 + l * 115, 470, 310 + l * 115, 350);
        }
        line(out, 'dark', 745, 430, 710, 340);
        line(out, 'dark', 790, 430, 830, 340);
        if (has(name, ['bee', '蜜蜂'])) {
          line(out, 'dark', 420, 445, 420, 575);
          line(out, 'dark', 520, 445, 520, 575);
          ellipse(out, 'white', 450, 385, 55, 90, -25);
        }
        if (has(name, ['ladybug', '瓢蟲'])) {
          circle(out, 'dark', 400, 485, 12);
          circle(out, 'dark', 500, 525, 12);
          circle(out, 'dark', 590, 485, 12);
        }
      }
      return out;
    }
    if (
      has(name, [
        'turtle',
        'tortoise',
        'snake',
        'lizard',
        'crocodile',
        'frog',
        '蛙',
        '龜',
        '蛇',
        '蜥蜴',
        '鱷',
      ])
    ) {
      if (has(name, ['snake', '蛇'])) {
        path(
          out,
          'green',
          190,
          650,
          280,
          430,
          420,
          610,
          565,
          420,
          710,
          600,
          820,
          430,
        );
        circle(out, 'green', 835, 420, 72);
        circle(out, 'white', 855, 400, 22);
        circle(out, 'dark', 860, 400, 10);
        path(out, 'red', 895, 450, 955, 465, 895, 480);
      } else {
        ellipse(out, 'green', 500, 570, 220, 140, 0);
        ellipse(out, 'brown', 500, 545, 155, 105, 0);
        path(out, 'gold', 400, 510, 470, 465, 545, 510, 600, 550);
        circle(out, 'green', 740, 530, 70);
        circle(out, 'dark', 760, 515, 13);
        for (var foot = 0; foot < 4; foot++)
          ellipse(
            out,
            'green',
            345 + (foot % 2) * 310,
            690 + Math.floor(foot / 2) * 35,
            48,
            28,
            0,
          );
        if (has(name, ['frog', '蛙'])) {
          ellipse(out, 'green', 500, 575, 190, 120, 0);
          circle(out, 'white', 430, 440, 48);
          circle(out, 'white', 570, 440, 48);
          circle(out, 'dark', 430, 440, 15);
          circle(out, 'dark', 570, 440, 15);
          arc(out, 'red', 500, 580, 95, 10, 170);
        }
        if (has(name, ['crocodile', '鱷'])) {
          shape(out, 'green', 650, 535, 880, 500, 800, 610);
          for (var tooth = 0; tooth < 4; tooth++)
            path(
              out,
              'white',
              700 + tooth * 35,
              560,
              720 + tooth * 35,
              590,
              740 + tooth * 35,
              555,
            );
        }
      }
      return out;
    }
    // A clean side-view mammal, with species-specific silhouette cues.
    ellipse(out, 'brown', 455, 555, 230, 135, -5);
    circle(out, 'brown', 680, 465, 112);
    circle(out, 'brown', 625, 370, 48);
    circle(out, 'brown', 740, 370, 48);
    circle(out, 'dark', 710, 455, 13);
    path(out, 'dark', 750, 500, 785, 520, 750, 540);
    for (var leg = 0; leg < 4; leg++)
      line(out, 'brown', 320 + leg * 105, 630, 310 + leg * 105, 815);
    path(out, 'brown', 250, 520, 170, 480, 190, 390);
    if (has(name, ['tiger', 'zebra', 'striped', '老虎', '斑馬'])) {
      for (var stripe = 0; stripe < 4; stripe++)
        path(
          out,
          'dark',
          390 + stripe * 70,
          455,
          350 + stripe * 70,
          540,
          385 + stripe * 70,
          625,
        );
    }
    if (has(name, ['giraffe', '長頸鹿'])) {
      rect(out, 'gold', 610, 300, 90, 245);
      circle(out, 'gold', 660, 270, 58);
      circle(out, 'gold', 630, 215, 16);
      circle(out, 'gold', 690, 215, 16);
      for (var spot = 0; spot < 4; spot++)
        circle(
          out,
          'brown',
          635 + (spot % 2) * 40,
          330 + Math.floor(spot / 2) * 78,
          13,
        );
    }
    if (has(name, ['elephant', '大象']))
      path(out, 'gray', 735, 500, 820, 585, 810, 690, 760, 720);
    if (has(name, ['rabbit', 'hare', '兔'])) {
      ellipse(out, 'pink', 635, 270, 32, 135, -8);
      ellipse(out, 'pink', 710, 270, 32, 135, 8);
    }
    if (has(name, ['bear', '熊'])) {
      circle(out, 'brown', 625, 360, 48);
      circle(out, 'brown', 735, 360, 48);
      ellipse(out, 'cream', 680, 500, 58, 42, 0);
    }
    if (has(name, ['lion', '獅'])) {
      for (var mane = 0; mane < 9; mane++)
        circle(
          out,
          'gold',
          680 + Math.cos((mane * Math.PI) / 4.5) * 125,
          465 + Math.sin((mane * Math.PI) / 4.5) * 125,
          45,
        );
    }
    if (has(name, ['camel', '駱駝'])) {
      ellipse(out, 'brown', 420, 430, 75, 115, 0);
      ellipse(out, 'brown', 555, 430, 75, 115, 0);
    }
    if (has(name, ['hedgehog', 'porcupine', '刺蝟', '豪豬']))
      rays(out, 'dark', 470, 475, 105, 180, 13, -90);
    if (has(name, ['panda', '貓熊', '熊貓'])) {
      ellipse(out, 'white', 455, 555, 230, 135, -5);
      circle(out, 'white', 680, 465, 112);
      ellipse(out, 'dark', 645, 450, 32, 48, 20);
      ellipse(out, 'dark', 715, 450, 32, 48, -20);
    }
    return out;
  }

  function drawFood(name) {
    var out = [];
    var fruit = has(name, [
      'apple',
      'orange',
      'lemon',
      'pear',
      'peach',
      'plum',
      'mango',
      'melon',
      'watermelon',
      'grape',
      'berry',
      'cherry',
      'banana',
      'coconut',
      'kiwi',
      'pineapple',
      'tomato',
      'strawberry',
      '蘋果',
      '橘',
      '檸檬',
      '梨',
      '桃',
      '芒果',
      '瓜',
      '葡萄',
      '莓',
      '櫻桃',
      '香蕉',
      '椰子',
      '奇異果',
      '鳳梨',
      '番茄',
      '草莓',
    ]);
    if (
      has(name, [
        'carrot',
        'corn',
        'pumpkin',
        'eggplant',
        'cabbage',
        'broccoli',
        'onion',
        'potato',
        '菜',
        '蘿蔔',
        '玉米',
        '南瓜',
        '茄子',
        '洋蔥',
        '馬鈴薯',
        '高麗菜',
        '花椰',
      ])
    ) {
      if (has(name, ['carrot', '蘿蔔'])) {
        shape(out, 'orange', 350, 300, 650, 300, 500, 840);
        path(out, 'green', 500, 300, 450, 180, 500, 250, 560, 150, 530, 300);
        for (var r = 0; r < 3; r++)
          line(
            out,
            'gold',
            430 + r * 45,
            490 + r * 85,
            475 + r * 45,
            505 + r * 85,
          );
      } else if (has(name, ['corn', '玉米'])) {
        path(out, 'gold', 390, 260, 610, 300, 600, 720, 400, 740, 390, 260);
        for (var c = 0; c < 4; c++)
          for (var d = 0; d < 3; d++)
            circle(out, 'yellow', 430 + c * 43, 355 + d * 90, 13);
        path(out, 'green', 390, 700, 250, 830, 470, 700);
        path(out, 'green', 610, 700, 750, 830, 530, 700);
      } else {
        ellipse(
          out,
          has(name, ['eggplant', '茄子']) ? 'purple' : 'green',
          500,
          525,
          225,
          210,
          0,
        );
        if (has(name, ['pumpkin', '南瓜'])) {
          ellipse(out, 'orange', 500, 535, 100, 205, 0);
          ellipse(out, 'gold', 390, 535, 70, 175, 0);
          ellipse(out, 'gold', 610, 535, 70, 175, 0);
        }
        path(out, 'green', 460, 330, 500, 240, 550, 330);
      }
      return out;
    }
    if (fruit) {
      if (has(name, ['banana', '香蕉'])) {
        path(out, 'yellow', 280, 350, 360, 650, 520, 755, 690, 700, 800, 550);
        path(out, 'cream', 310, 325, 400, 580, 530, 660, 680, 620);
      } else if (
        has(name, ['grape', '葡萄', 'cherry', '櫻桃', 'berry', '莓'])
      ) {
        if (has(name, ['cherry', '櫻桃'])) {
          circle(out, 'red', 400, 610, 95);
          circle(out, 'red', 600, 610, 95);
          line(out, 'green', 400, 515, 480, 290);
          line(out, 'green', 600, 515, 520, 290);
          ellipse(out, 'green', 550, 305, 75, 34, -25);
        } else {
          for (var g = 0; g < 3; g++)
            for (var h = 0; h < 3; h++)
              circle(
                out,
                'purple',
                380 + g * 105 + (h % 2) * 30,
                440 + h * 95,
                65,
              );
          path(out, 'green', 480, 350, 500, 230, 590, 290);
        }
      } else if (has(name, ['pineapple', '鳳梨'])) {
        ellipse(out, 'gold', 500, 560, 170, 245, 0);
        for (var p = 0; p < 5; p++)
          path(out, 'orange', 370, 400 + p * 72, 630, 470 + p * 72);
        for (var leaf = 0; leaf < 5; leaf++)
          path(out, 'green', 500, 320, 410 + leaf * 45, 150, 520, 300);
      } else if (has(name, ['watermelon', '西瓜'])) {
        ellipse(out, 'green', 500, 520, 270, 205, -10);
        path(out, 'cream', 320, 445, 500, 350, 700, 430);
        path(out, 'dark', 335, 590, 500, 670, 685, 565);
      } else {
        ellipse(
          out,
          has(name, ['lemon', '檸檬']) ? 'yellow' : 'red',
          500,
          530,
          220,
          220,
          has(name, ['pear', '梨']) ? 0 : -15,
        );
        path(out, 'green', 500, 315, 530, 230, 630, 245);
        ellipse(out, 'green', 570, 260, 85, 35, -30);
        if (has(name, ['orange', 'lemon', '橘', '檸檬'])) {
          circle(out, 'yellow', 500, 530, 50);
          rays(out, 'cream', 500, 530, 65, 85, 8, 0);
        }
        if (has(name, ['strawberry', '草莓'])) {
          shape(out, 'red', 330, 400, 670, 400, 500, 820);
          for (var seed = 0; seed < 7; seed++)
            circle(
              out,
              'yellow',
              400 + (seed % 3) * 90,
              480 + Math.floor(seed / 3) * 90,
              8,
            );
        }
      }
      return out;
    }
    if (
      has(name, [
        'drink',
        'juice',
        'milk',
        'tea',
        'coffee',
        'soup',
        'noodle',
        'rice',
        'porridge',
        'dumpling',
        'bun',
        'bread',
        'cake',
        'cookie',
        'candy',
        'chocolate',
        'ice cream',
        'hamburger',
        'pizza',
        '飲',
        '汁',
        '牛奶',
        '茶',
        '咖啡',
        '湯',
        '麵',
        '飯',
        '粥',
        '餃',
        '包子',
        '麵包',
        '蛋糕',
        '餅',
        '糖',
        '巧克力',
        '冰淇淋',
        '漢堡',
        '披薩',
      ])
    ) {
      if (
        has(name, [
          'drink',
          'juice',
          'milk',
          'tea',
          'coffee',
          '飲',
          '汁',
          '牛奶',
          '茶',
          '咖啡',
        ])
      ) {
        path(out, 'teal', 350, 330, 650, 330, 610, 820, 390, 820, 350, 330);
        line(out, 'silver', 400, 420, 600, 420);
        path(out, 'red', 480, 330, 490, 230, 550, 230);
        for (var steam = 0; steam < 2; steam++)
          path(
            out,
            'sky',
            440 + steam * 110,
            245,
            420 + steam * 110,
            190,
            460 + steam * 110,
            145,
          );
      } else if (has(name, ['cake', '蛋糕'])) {
        shape(out, 'cream', 300, 450, 700, 450, 700, 780, 300, 780);
        path(
          out,
          'pink',
          300,
          450,
          380,
          400,
          460,
          450,
          540,
          400,
          620,
          450,
          700,
          400,
        );
        circle(out, 'red', 500, 345, 45);
        line(out, 'gold', 500, 310, 500, 235);
      } else if (has(name, ['pizza', '披薩'])) {
        shape(out, 'gold', 270, 300, 730, 300, 500, 820);
        arc(out, 'red', 500, 430, 95, 0, 360);
        circle(out, 'red', 420, 500, 25);
        circle(out, 'red', 575, 520, 25);
      } else if (has(name, ['noodle', 'soup', 'rice', '飯', '麵', '湯'])) {
        path(out, 'cream', 290, 450, 340, 700, 660, 700, 710, 450);
        arc(out, 'red', 500, 450, 210, 0, 180);
        for (var n = 0; n < 3; n++)
          path(
            out,
            'gold',
            390,
            490 + n * 35,
            480,
            530 + n * 35,
            590,
            485 + n * 35,
          );
        path(out, 'green', 490, 420, 520, 365, 560, 410);
      } else if (has(name, ['hamburger', 'burger', '漢堡'])) {
        arc(out, 'gold', 500, 510, 210, 180, 360);
        rect(out, 'green', 300, 510, 400, 50);
        rect(out, 'red', 310, 565, 380, 55);
        rect(out, 'cream', 300, 625, 400, 50);
        arc(out, 'gold', 500, 675, 200, 0, 180);
      } else {
        ellipse(out, 'gold', 500, 510, 230, 170, 0);
        arc(out, 'cream', 500, 510, 195, 0, 180);
        circle(out, 'red', 450, 485, 24);
        circle(out, 'green', 555, 525, 24);
      }
      return out;
    }
    // Simple plated meal for less common dishes, with ingredients so it reads as food.
    ellipse(out, 'white', 500, 570, 330, 180, 0);
    ellipse(out, 'silver', 500, 570, 260, 130, 0);
    ellipse(out, 'gold', 440, 535, 115, 65, -20);
    circle(out, 'green', 570, 520, 48);
    circle(out, 'red', 610, 600, 32);
    return out;
  }

  function drawVehicle(name) {
    var out = [];
    if (has(name, ['wheelchair', '輪椅'])) {
      circle(out, 'dark', 440, 650, 180);
      circle(out, 'dark', 710, 710, 65);
      path(out, 'blue', 350, 350, 590, 350, 650, 580, 470, 580, 350, 350);
      line(out, 'silver', 470, 580, 350, 690);
      line(out, 'silver', 590, 350, 700, 270);
      line(out, 'silver', 700, 270, 780, 270);
      return out;
    }
    if (has(name, ['stroller', 'baby carriage', '嬰兒車', '娃娃車'])) {
      circle(out, 'dark', 360, 740, 75);
      circle(out, 'dark', 660, 740, 75);
      path(out, 'blue', 300, 260, 600, 260, 680, 650, 360, 650, 300, 260);
      line(out, 'silver', 600, 260, 760, 160);
      circle(out, 'cream', 500, 500, 75);
      return out;
    }
    if (has(name, ['handcart', 'cart', '手推車', '拖板車'])) {
      rect(out, 'brown', 240, 420, 480, 120);
      line(out, 'brown', 300, 540, 220, 780);
      line(out, 'brown', 680, 540, 780, 780);
      circle(out, 'dark', 300, 790, 65);
      circle(out, 'dark', 700, 790, 65);
      return out;
    }
    if (
      has(name, [
        'boat',
        'ship',
        'ferry',
        'sail',
        'yacht',
        '船',
        '舟',
        '郵輪',
        '快艇',
      ])
    ) {
      path(out, 'red', 220, 560, 780, 560, 680, 760, 330, 760, 220, 560);
      rect(out, 'white', 390, 390, 220, 170);
      rect(out, 'silver', 430, 430, 55, 65);
      rect(out, 'silver', 520, 430, 55, 65);
      line(out, 'brown', 500, 175, 500, 390);
      shape(out, 'cream', 490, 200, 300, 370, 490, 370);
      path(
        out,
        'blue',
        180,
        810,
        320,
        780,
        460,
        810,
        600,
        780,
        760,
        810,
        900,
        780,
      );
      if (has(name, ['submarine', '潛水艇'])) {
        ellipse(out, 'yellow', 500, 550, 285, 135, 0);
        for (var port = 0; port < 3; port++)
          circle(out, 'sky', 400 + port * 95, 540, 26);
      }
      return out;
    }
    if (
      has(name, [
        'plane',
        'airplane',
        'jet',
        'glider',
        'parachute',
        'helicopter',
        '飛機',
        '滑翔機',
        '降落傘',
        '飛行傘',
        '直升機',
      ])
    ) {
      if (has(name, ['helicopter', '直升機'])) {
        ellipse(out, 'red', 500, 520, 205, 115, 0);
        path(out, 'silver', 650, 500, 850, 480, 870, 520, 650, 550);
        line(out, 'dark', 500, 405, 500, 330);
        line(out, 'dark', 320, 330, 680, 330);
        line(out, 'dark', 390, 650, 610, 650);
      } else if (has(name, ['parachute', '降落傘', '飛行傘'])) {
        arc(out, 'red', 500, 500, 280, 180, 360);
        line(out, 'red', 225, 500, 470, 850);
        line(out, 'red', 775, 500, 530, 850);
        circle(out, 'blue', 500, 840, 45);
      } else {
        path(
          out,
          'silver',
          180,
          500,
          820,
          500,
          900,
          545,
          820,
          590,
          180,
          590,
          290,
          545,
          180,
          500,
        );
        shape(out, 'blue', 430, 500, 540, 220, 610, 220, 555, 500);
        shape(out, 'blue', 420, 590, 530, 820, 600, 820, 545, 590);
        circle(out, 'sky', 710, 545, 22);
      }
      return out;
    }
    if (
      has(name, ['train', 'metro', 'subway', 'tram', '火車', '高鐵', '捷運'])
    ) {
      rect(out, 'red', 210, 300, 580, 410);
      path(out, 'red', 210, 300, 350, 190, 650, 190, 790, 300);
      for (var win = 0; win < 4; win++)
        rect(out, 'sky', 280 + win * 115, 360, 75, 110);
      line(out, 'dark', 210, 710, 790, 710);
      circle(out, 'dark', 340, 745, 55);
      circle(out, 'dark', 660, 745, 55);
      line(out, 'silver', 250, 815, 750, 815);
      return out;
    }
    if (
      has(name, [
        'bike',
        'bicycle',
        'motorcycle',
        'scooter',
        '車',
        '單車',
        '機車',
        '腳踏車',
      ])
    ) {
      if (has(name, ['motorcycle', 'scooter', '機車'])) {
        circle(out, 'dark', 320, 690, 110);
        circle(out, 'dark', 700, 690, 110);
        path(out, 'red', 300, 650, 430, 480, 600, 530, 710, 650);
        line(out, 'silver', 420, 490, 350, 390);
        line(out, 'silver', 320, 390, 400, 390);
        circle(out, 'gold', 725, 555, 40);
      } else {
        circle(out, 'dark', 280, 680, 120);
        circle(out, 'dark', 720, 680, 120);
        line(out, 'red', 280, 680, 460, 480);
        line(out, 'red', 460, 480, 560, 680);
        line(out, 'red', 560, 680, 280, 680);
        line(out, 'red', 460, 480, 720, 680);
        line(out, 'dark', 430, 445, 490, 445);
        line(out, 'dark', 690, 500, 780, 500);
      }
      return out;
    }
    // Four-wheel vehicle with type cues: bus windows, truck cargo, cab light or siren.
    shape(
      out,
      'red',
      200,
      520,
      300,
      380,
      650,
      380,
      810,
      520,
      830,
      680,
      180,
      680,
    );
    rect(out, 'sky', 335, 415, 165, 120);
    rect(out, 'sky', 535, 415, 120, 120);
    circle(out, 'dark', 330, 690, 80);
    circle(out, 'dark', 680, 690, 80);
    circle(out, 'yellow', 225, 590, 28);
    circle(out, 'yellow', 785, 590, 28);
    if (has(name, ['bus', '巴士', '公車', '校車'])) {
      for (var w = 0; w < 3; w++) rect(out, 'sky', 325 + w * 125, 430, 95, 95);
    }
    if (has(name, ['police', '警車'])) {
      rect(out, 'blue', 450, 340, 100, 35);
      rays(out, 'red', 500, 325, 5, 20, 6, 0);
    }
    if (has(name, ['taxi', '計程車'])) {
      rect(out, 'gold', 440, 340, 120, 38);
    }
    if (
      has(name, ['truck', 'garbage', 'dump', 'cargo', '貨車', '垃圾車', '卡車'])
    )
      rect(out, 'silver', 600, 300, 190, 200);
    if (has(name, ['excavator', '挖土機'])) {
      path(out, 'gold', 650, 390, 720, 210, 820, 180, 755, 430);
      line(out, 'gold', 760, 205, 880, 320);
    }
    return out;
  }

  function drawHome(name) {
    var out = [];
    if (has(name, ['sofa', 'couch', 'chair', 'bed', '沙發', '椅', '床'])) {
      if (has(name, ['bed', '床'])) {
        rect(out, 'blue', 230, 450, 540, 300);
        rect(out, 'white', 260, 395, 200, 120);
        path(out, 'brown', 200, 750, 800, 750, 800, 850, 200, 850);
      } else {
        rect(out, 'blue', 260, 450, 480, 260);
        rect(out, 'blue', 180, 390, 150, 320);
        rect(out, 'blue', 670, 390, 150, 320);
        rect(out, 'brown', 240, 710, 55, 130);
        rect(out, 'brown', 705, 710, 55, 130);
        ellipse(out, 'white', 400, 520, 100, 55, 0);
      }
      return out;
    }
    if (
      has(name, [
        'spoon',
        'fork',
        'chopstick',
        'knife',
        'ladle',
        '湯匙',
        '叉子',
        '筷',
        '菜刀',
        '刀',
      ])
    ) {
      if (has(name, ['spoon', '湯匙'])) {
        ellipse(out, 'silver', 500, 290, 120, 160, 0);
        rect(out, 'silver', 465, 420, 70, 400);
      } else if (has(name, ['fork', '叉子'])) {
        rect(out, 'silver', 460, 400, 80, 400);
        for (var tooth = 0; tooth < 4; tooth++)
          line(out, 'silver', 420 + tooth * 55, 170, 420 + tooth * 55, 420);
        path(out, 'silver', 420, 420, 580, 420);
      } else if (has(name, ['chopstick', '筷'])) {
        line(out, 'wood', 420, 180, 520, 840);
        line(out, 'wood', 540, 180, 640, 840);
      } else {
        shape(out, 'silver', 300, 260, 720, 260, 680, 420, 330, 420);
        rect(out, 'wood', 470, 420, 90, 390);
      }
      return out;
    }
    if (has(name, ['lamp', 'flashlight', 'candle', '燈', '蠟燭', '手電筒'])) {
      rect(out, 'brown', 430, 500, 140, 280);
      shape(out, 'gold', 360, 500, 640, 500, 570, 250, 430, 250);
      rays(out, 'gold', 500, 300, 180, 250, 7, -90);
      return out;
    }
    if (has(name, ['window', 'frame', 'mirror', '窗', '相框', '鏡'])) {
      rect(out, 'brown', 230, 200, 540, 600);
      rect(out, 'sky', 280, 250, 440, 500);
      line(out, 'white', 500, 250, 500, 750);
      line(out, 'white', 280, 500, 720, 500);
      return out;
    }
    if (has(name, ['cup', 'mug', 'bowl', 'plate', '碗', '盤', '杯'])) {
      ellipse(out, 'white', 500, 500, 245, 130, 0);
      arc(out, 'silver', 500, 500, 245, 0, 180);
      if (has(name, ['cup', 'mug', '杯'])) {
        path(out, 'white', 300, 500, 340, 770, 620, 770, 700, 500);
        arc(out, 'silver', 715, 610, 95, 270, 90);
      }
      return out;
    }
    if (
      has(name, [
        'refrigerator',
        'fridge',
        'oven',
        'microwave',
        'stove',
        'washing machine',
        '冰箱',
        '烤箱',
        '微波爐',
        '電鍋',
        '洗衣機',
      ])
    ) {
      rect(out, 'silver', 310, 180, 380, 660);
      rect(out, 'white', 340, 220, 320, 285);
      rect(out, 'white', 340, 530, 320, 270);
      line(out, 'dark', 340, 510, 660, 510);
      line(out, 'dark', 625, 300, 625, 445);
      circle(out, 'red', 610, 580, 12);
      circle(out, 'red', 650, 580, 12);
      return out;
    }
    if (has(name, ['heater', '暖爐', '暖氣'])) {
      rect(out, 'white', 300, 280, 400, 500);
      for (var coil = 0; coil < 4; coil++)
        path(
          out,
          'red',
          380 + coil * 70,
          400,
          340 + coil * 70,
          465,
          420 + coil * 70,
          530,
          380 + coil * 70,
          595,
          420 + coil * 70,
          660,
        );
      line(out, 'dark', 350, 790, 310, 860);
      line(out, 'dark', 650, 790, 690, 860);
      return out;
    }
    if (has(name, ['computer', 'laptop', 'monitor', '電腦', '筆電', '螢幕'])) {
      rect(out, 'dark', 220, 250, 560, 400);
      rect(out, 'sky', 255, 285, 490, 325);
      path(out, 'silver', 440, 650, 415, 760, 585, 760, 560, 650);
      line(out, 'dark', 360, 780, 640, 780);
      return out;
    }
    if (has(name, ['camera', '相機'])) {
      rect(out, 'dark', 260, 370, 480, 330);
      rect(out, 'dark', 370, 300, 180, 70);
      circle(out, 'silver', 500, 530, 135);
      circle(out, 'blue', 500, 530, 85);
      circle(out, 'gold', 670, 420, 26);
      return out;
    }
    if (has(name, ['television', 'tv', '電視'])) {
      rect(out, 'dark', 200, 260, 600, 430);
      rect(out, 'sky', 235, 295, 530, 350);
      line(out, 'dark', 400, 710, 360, 820);
      line(out, 'dark', 600, 710, 640, 820);
      return out;
    }
    if (has(name, ['toilet', '馬桶'])) {
      rect(out, 'white', 390, 250, 220, 280);
      ellipse(out, 'white', 500, 580, 190, 130, 0);
      rect(out, 'white', 370, 690, 260, 100);
      ellipse(out, 'silver', 500, 550, 110, 65, 0);
      return out;
    }
    if (has(name, ['umbrella', '雨傘'])) {
      arc(out, 'red', 500, 470, 270, 180, 360);
      for (var rib = 0; rib < 5; rib++)
        line(out, 'silver', 500, 470, 260 + rib * 120, 470);
      line(out, 'brown', 500, 470, 500, 820);
      path(out, 'brown', 500, 820, 550, 890, 610, 840);
      return out;
    }
    if (has(name, ['scissors', '剪刀'])) {
      circle(out, 'blue', 400, 720, 80);
      circle(out, 'blue', 600, 720, 80);
      line(out, 'silver', 400, 650, 700, 230);
      line(out, 'silver', 600, 650, 300, 230);
      return out;
    }
    if (
      has(name, [
        'hammer',
        'screwdriver',
        'wrench',
        'tool',
        '鎚',
        '螺絲起子',
        '扳手',
      ])
    ) {
      rect(out, 'brown', 455, 400, 90, 430);
      if (has(name, ['screwdriver', '螺絲起子'])) {
        shape(out, 'silver', 360, 220, 640, 220, 540, 420, 460, 420);
      } else if (has(name, ['wrench', '扳手'])) {
        path(out, 'silver', 390, 300, 350, 190, 470, 240, 530, 480, 610, 620);
      } else {
        rect(out, 'silver', 330, 260, 340, 125);
        line(out, 'silver', 500, 260, 500, 385);
      }
      return out;
    }
    if (has(name, ['broom', 'mop', 'vacuum', '掃把', '拖把', '吸塵器'])) {
      line(out, 'brown', 560, 200, 480, 700);
      if (has(name, ['vacuum', '吸塵器'])) {
        circle(out, 'red', 650, 740, 120);
        path(out, 'silver', 560, 650, 470, 500, 310, 500);
      } else {
        path(out, 'gold', 360, 690, 650, 740, 620, 840, 330, 790, 360, 690);
        for (var bristle = 0; bristle < 4; bristle++)
          line(out, 'brown', 380 + bristle * 60, 785, 370 + bristle * 60, 850);
      }
      return out;
    }
    if (has(name, ['table', 'desk', '書桌', '桌子', '餐桌'])) {
      rect(out, 'brown', 220, 390, 560, 125);
      line(out, 'brown', 300, 515, 270, 820);
      line(out, 'brown', 700, 515, 730, 820);
      if (has(name, ['desk', '書桌'])) {
        rect(out, 'cream', 430, 285, 200, 100);
      }
      return out;
    }
    if (
      has(name, [
        'wardrobe',
        'cabinet',
        'shelf',
        'drawer',
        '衣櫃',
        '櫃',
        '書架',
      ])
    ) {
      rect(out, 'brown', 250, 180, 500, 650);
      line(out, 'cream', 500, 180, 500, 830);
      for (var shelf = 0; shelf < 3; shelf++)
        line(out, 'cream', 270, 380 + shelf * 130, 730, 380 + shelf * 130);
      circle(out, 'gold', 465, 500, 12);
      circle(out, 'gold', 535, 500, 12);
      return out;
    }
    if (has(name, ['bottle', 'jar', 'water bottle', '瓶', '水壺'])) {
      path(
        out,
        'teal',
        385,
        330,
        420,
        250,
        460,
        250,
        460,
        180,
        540,
        180,
        540,
        250,
        580,
        250,
        615,
        330,
        615,
        800,
        385,
        800,
        385,
        330,
      );
      rect(out, 'silver', 460, 410, 80, 80);
      return out;
    }
    if (has(name, ['pan', 'pot', 'frying', '平底鍋', '鍋'])) {
      ellipse(out, 'silver', 470, 500, 230, 140, 0);
      line(out, 'silver', 690, 500, 900, 450);
      arc(out, 'dark', 470, 500, 200, 0, 180);
      return out;
    }
    if (has(name, ['toothpaste', 'tooth paste', '牙膏'])) {
      path(out, 'blue', 380, 260, 620, 260, 600, 760, 400, 760, 380, 260);
      rect(out, 'white', 430, 760, 140, 70);
      line(out, 'white', 405, 400, 595, 400);
      return out;
    }
    if (has(name, ['soap', '肥皂'])) {
      path(
        out,
        'pink',
        320,
        480,
        370,
        320,
        630,
        320,
        680,
        480,
        650,
        700,
        350,
        700,
        320,
        480,
      );
      circle(out, 'white', 420, 410, 22);
      circle(out, 'white', 500, 380, 22);
      circle(out, 'white', 580, 420, 22);
      return out;
    }
    if (has(name, ['toothbrush', 'brush', 'comb', '牙刷', '梳'])) {
      rect(out, 'blue', 455, 320, 90, 520);
      for (var br = 0; br < 5; br++)
        line(out, 'white', 430 + br * 35, 200, 430 + br * 35, 360);
      return out;
    }
    if (has(name, ['garbage bag', '垃圾袋'])) {
      path(
        out,
        'dark',
        390,
        330,
        440,
        260,
        560,
        260,
        610,
        330,
        680,
        800,
        320,
        800,
        390,
        330,
      );
      path(out, 'silver', 440, 340, 500, 365, 560, 340);
      circle(out, 'red', 500, 570, 55);
      return out;
    }
    if (has(name, ['bucket', 'bin', 'trash', '桶', '垃圾桶'])) {
      path(out, 'teal', 330, 300, 670, 300, 620, 800, 380, 800, 330, 300);
      line(out, 'dark', 300, 290, 700, 290);
      if (has(name, ['trash', '垃圾'])) {
        line(out, 'dark', 430, 400, 570, 700);
        line(out, 'dark', 570, 400, 430, 700);
      }
      return out;
    }
    if (has(name, ['book', 'notebook', 'letter', 'envelope', '書', '信封'])) {
      rect(out, 'cream', 260, 210, 480, 590);
      line(out, 'red', 500, 220, 500, 790);
      for (var row = 0; row < 4; row++)
        line(out, 'blue', 325, 350 + row * 90, 465, 350 + row * 90);
      path(out, 'blue', 260, 210, 500, 520, 740, 210);
      return out;
    }
    if (has(name, ['clock', 'watch', '手錶', '時鐘', '鬧鐘'])) {
      circle(out, 'white', 500, 500, 250);
      circle(out, 'dark', 500, 500, 18);
      line(out, 'dark', 500, 500, 500, 330);
      line(out, 'dark', 500, 500, 630, 550);
      line(out, 'dark', 375, 190, 420, 270);
      line(out, 'dark', 625, 190, 580, 270);
      return out;
    }
    // Handy household item: a stand-alone package with an unmistakable handle or cap.
    rect(out, 'teal', 340, 260, 320, 520);
    rect(out, 'silver', 390, 320, 220, 185);
    line(out, 'dark', 500, 520, 500, 710);
    return out;
  }

  function drawClothes(name) {
    var out = [];
    if (has(name, ['hat', 'cap', 'helmet', '帽', '安全帽', '頭盔'])) {
      ellipse(out, 'blue', 500, 420, 245, 65, 0);
      arc(out, 'blue', 500, 420, 190, 180, 360);
      rect(out, 'blue', 375, 250, 250, 170);
      return out;
    }
    if (has(name, ['shoe', 'boot', 'slipper', 'sandal', '鞋', '靴', '拖鞋'])) {
      path(
        out,
        'brown',
        280,
        330,
        570,
        330,
        610,
        630,
        780,
        690,
        800,
        790,
        250,
        790,
        280,
        330,
      );
      line(out, 'white', 300, 720, 760, 720);
      return out;
    }
    if (has(name, ['sock', '襪'])) {
      path(
        out,
        'white',
        390,
        220,
        610,
        220,
        610,
        620,
        730,
        690,
        730,
        790,
        380,
        790,
        390,
        220,
      );
      line(out, 'red', 390, 330, 610, 330);
      return out;
    }
    if (
      has(name, ['bag', 'backpack', 'purse', 'wallet', '包', '背包', '錢包'])
    ) {
      path(out, 'red', 330, 330, 670, 330, 730, 780, 270, 780, 330, 330);
      arc(out, 'brown', 500, 370, 110, 180, 360);
      rect(out, 'gold', 390, 560, 220, 145);
      return out;
    }
    if (has(name, ['glove', 'mitten', '手套'])) {
      path(
        out,
        'blue',
        380,
        780,
        360,
        430,
        415,
        330,
        460,
        465,
        490,
        260,
        535,
        260,
        535,
        450,
        575,
        230,
        615,
        250,
        600,
        465,
        650,
        300,
        690,
        325,
        650,
        520,
        690,
        650,
        620,
        790,
        380,
        780,
      );
      return out;
    }
    if (
      has(name, ['dress', 'gown', 'wedding', 'skirt', '洋裝', '婚紗', '裙'])
    ) {
      rect(out, 'pink', 420, 210, 160, 150);
      shape(out, 'pink', 420, 360, 580, 360, 790, 810, 210, 810);
      line(out, 'white', 500, 380, 500, 780);
      return out;
    }
    if (has(name, ['tie', '領帶'])) {
      shape(
        out,
        'red',
        420,
        220,
        580,
        220,
        550,
        350,
        650,
        740,
        500,
        850,
        350,
        740,
        450,
        350,
      );
      return out;
    }
    if (has(name, ['scarf', '圍巾'])) {
      rect(out, 'red', 290, 250, 420, 160);
      path(
        out,
        'red',
        350,
        390,
        350,
        750,
        450,
        750,
        490,
        500,
        590,
        500,
        630,
        750,
        730,
        750,
        690,
        390,
      );
      return out;
    }
    if (has(name, ['mask', '口罩'])) {
      path(
        out,
        'sky',
        320,
        360,
        680,
        360,
        730,
        530,
        680,
        700,
        320,
        700,
        270,
        530,
        320,
        360,
      );
      arc(out, 'blue', 320, 530, 90, 90, 270);
      arc(out, 'blue', 680, 530, 90, 270, 90);
      for (var fold = 0; fold < 3; fold++)
        line(out, 'white', 350, 450 + fold * 55, 650, 450 + fold * 55);
      return out;
    }
    if (has(name, ['ring', '戒指'])) {
      ellipse(out, 'gold', 500, 530, 170, 185, 0);
      circle(out, 'red', 500, 340, 72);
      return out;
    }
    // Shirt/top silhouette, including collar and sleeves.
    shape(
      out,
      'blue',
      400,
      250,
      600,
      250,
      680,
      370,
      850,
      440,
      760,
      610,
      660,
      560,
      660,
      820,
      340,
      820,
      340,
      560,
      240,
      610,
      150,
      440,
      320,
      370,
    );
    path(out, 'white', 420, 255, 500, 345, 580, 255);
    line(out, 'white', 500, 350, 500, 800);
    return out;
  }

  function drawBody(name) {
    var out = [];
    if (has(name, ['nose', '鼻子'])) {
      path(
        out,
        'skin',
        500,
        190,
        420,
        520,
        355,
        625,
        420,
        700,
        500,
        680,
        580,
        700,
        645,
        625,
        580,
        520,
        500,
        190,
      );
      arc(out, 'brown', 430, 690, 35, 190, 350);
      arc(out, 'brown', 570, 690, 35, 190, 350);
    } else if (has(name, ['mouth', '嘴巴'])) {
      path(
        out,
        'red',
        170,
        470,
        330,
        390,
        420,
        435,
        500,
        395,
        580,
        435,
        670,
        390,
        830,
        470,
      );
      path(out, 'red', 170, 470, 350, 640, 650, 640, 830, 470);
      line(out, 'white', 300, 500, 700, 500);
    } else if (has(name, ['ear', '耳朵'])) {
      ellipse(out, 'skin', 500, 500, 170, 270, 0);
      ellipse(out, 'pink', 500, 500, 82, 175, 0);
    } else if (has(name, ['tooth', 'teeth', '牙齒'])) {
      shape(
        out,
        'white',
        300,
        250,
        700,
        250,
        760,
        450,
        690,
        780,
        600,
        810,
        550,
        600,
        450,
        600,
        400,
        810,
        310,
        780,
        240,
        450,
      );
    } else if (has(name, ['footprint', '腳印'])) {
      ellipse(out, 'brown', 500, 540, 130, 220, -20);
      for (var toe = 0; toe < 4; toe++)
        circle(
          out,
          'brown',
          405 + toe * 65,
          300 - Math.abs(1.5 - toe) * 25,
          35,
        );
    } else if (has(name, ['hand', 'finger', '拳頭', '手指', '拳頭'])) {
      if (has(name, ['fist', '拳頭'])) {
        rect(out, 'skin', 340, 460, 320, 300);
        for (var knuckle = 0; knuckle < 4; knuckle++)
          circle(out, 'skin', 375 + knuckle * 78, 440, 55);
      } else {
        rect(out, 'skin', 390, 420, 220, 370);
        for (var digit = 0; digit < 5; digit++) {
          var height =
            digit === 0 ? 165 : 300 + (digit === 1 || digit === 3 ? 45 : 0);
          rect(out, 'skin', 365 + digit * 55, 420 - height, 43, height);
          circle(out, 'pink', 385 + digit * 55, 420 - height, 22);
        }
      }
    } else if (has(name, ['hair', '頭髮'])) {
      circle(out, 'brown', 500, 490, 230);
      ellipse(out, 'skin', 500, 570, 175, 205, 0);
      path(out, 'brown', 310, 500, 340, 250, 500, 320, 660, 230, 700, 500);
    } else if (has(name, ['heart', '心臟'])) {
      path(
        out,
        'red',
        500,
        790,
        240,
        500,
        330,
        310,
        500,
        430,
        670,
        310,
        760,
        500,
        500,
        790,
      );
      line(out, 'blue', 500, 470, 500, 280);
      path(out, 'blue', 500, 340, 420, 250, 350, 260);
      path(out, 'blue', 500, 350, 580, 250, 650, 260);
    } else if (has(name, ['brain', '大腦'])) {
      circle(out, 'pink', 400, 480, 120);
      circle(out, 'pink', 520, 400, 120);
      circle(out, 'pink', 620, 500, 110);
      circle(out, 'pink', 450, 600, 105);
      circle(out, 'pink', 580, 610, 95);
      path(out, 'red', 500, 310, 470, 480, 540, 530, 500, 680);
    } else if (has(name, ['lung', '肺'])) {
      path(
        out,
        'pink',
        470,
        350,
        420,
        460,
        420,
        720,
        310,
        760,
        230,
        690,
        240,
        500,
        320,
        390,
      );
      path(
        out,
        'pink',
        530,
        350,
        580,
        460,
        580,
        720,
        690,
        760,
        770,
        690,
        760,
        500,
        680,
        390,
      );
      line(out, 'silver', 500, 240, 500, 520);
    } else if (has(name, ['intestine', '腸'])) {
      path(
        out,
        'pink',
        330,
        330,
        670,
        330,
        670,
        680,
        350,
        680,
        350,
        430,
        620,
        430,
        620,
        590,
        410,
        590,
        410,
        500,
        570,
        500,
      );
    } else if (has(name, ['stomach', '胃'])) {
      path(
        out,
        'pink',
        420,
        250,
        420,
        470,
        330,
        550,
        330,
        700,
        500,
        780,
        650,
        690,
        650,
        560,
        540,
        530,
        520,
        420,
        570,
        320,
      );
    } else if (has(name, ['bone', '骨頭'])) {
      path(
        out,
        'white',
        360,
        290,
        310,
        240,
        240,
        260,
        220,
        330,
        300,
        400,
        610,
        650,
        680,
        730,
        750,
        710,
        770,
        640,
        690,
        570,
        390,
        320,
      );
    } else if (has(name, ['muscle', '肌肉'])) {
      path(
        out,
        'red',
        300,
        330,
        420,
        250,
        500,
        360,
        580,
        250,
        700,
        330,
        640,
        490,
        710,
        680,
        500,
        830,
        290,
        680,
        360,
        490,
      );
      line(out, 'cream', 500, 380, 500, 700);
    } else if (has(name, ['tongue', '舌頭'])) {
      path(
        out,
        'pink',
        360,
        320,
        640,
        320,
        620,
        730,
        500,
        820,
        380,
        730,
        360,
        320,
      );
      line(out, 'red', 500, 620, 500, 790);
    } else if (has(name, ['lips', 'lip', '嘴唇'])) {
      path(
        out,
        'red',
        200,
        500,
        350,
        400,
        470,
        460,
        500,
        430,
        530,
        460,
        650,
        400,
        800,
        500,
        650,
        640,
        350,
        640,
        200,
        500,
      );
      line(out, 'white', 290, 515, 710, 515);
    } else if (has(name, ['eyebrow', '眉毛'])) {
      path(out, 'brown', 220, 500, 350, 400, 480, 500);
      path(out, 'brown', 520, 500, 650, 400, 780, 500);
    } else if (has(name, ['moustache', 'mustache', '鬍子'])) {
      ellipse(out, 'brown', 390, 510, 115, 65, 25);
      ellipse(out, 'brown', 610, 510, 115, 65, -25);
    } else if (has(name, ['eyelash', '睫毛'])) {
      arc(out, 'dark', 500, 550, 160, 180, 360);
      for (var lash = 0; lash < 5; lash++)
        line(out, 'dark', 370 + lash * 60, 410, 350 + lash * 60, 350);
    } else if (has(name, ['nail', '指甲'])) {
      ellipse(out, 'pink', 500, 500, 130, 210, 0);
      ellipse(out, 'white', 500, 370, 83, 58, 0);
    } else if (has(name, ['freckle', 'mole', '痣', '雀斑'])) {
      ellipse(out, 'skin', 500, 500, 245, 220, 0);
      for (var spot = 0; spot < 9; spot++)
        circle(
          out,
          'brown',
          360 + (spot % 3) * 70,
          430 + Math.floor(spot / 3) * 65,
          10,
        );
    } else if (has(name, ['eye', '眼'])) {
      ellipse(out, 'white', 500, 500, 225, 125, 0);
      circle(out, 'blue', 500, 500, 82);
      circle(out, 'dark', 500, 500, 35);
    } else if (has(name, ['foot', '腳', 'ankle', '踝'])) {
      path(
        out,
        'skin',
        420,
        250,
        580,
        250,
        580,
        650,
        760,
        700,
        790,
        790,
        390,
        790,
        420,
        250,
      );
    } else if (has(name, ['arm', 'shoulder', 'elbow', '手臂', '肩', '手肘'])) {
      path(
        out,
        'skin',
        400,
        240,
        600,
        240,
        580,
        470,
        700,
        650,
        630,
        750,
        450,
        560,
        430,
        420,
      );
      circle(out, 'brown', 610, 590, 40);
    } else if (has(name, ['neck', '脖子'])) {
      rect(out, 'skin', 390, 250, 220, 500);
    } else if (has(name, ['belly', 'navel', '肚子', '肚臍'])) {
      ellipse(out, 'skin', 500, 500, 240, 270, 0);
      circle(out, 'brown', 500, 550, 22);
    } else if (has(name, ['chin', 'forehead', '下巴', '額頭'])) {
      path(
        out,
        'skin',
        280,
        320,
        500,
        180,
        720,
        320,
        680,
        610,
        500,
        810,
        320,
        610,
        280,
        320,
      );
    } else {
      ellipse(out, 'skin', 500, 500, 230, 280, 0);
      circle(out, 'dark', 420, 460, 18);
      circle(out, 'dark', 580, 460, 18);
    }
    return out;
  }

  function drawNature(name) {
    var out = [];
    if (has(name, ['canyon', '大峽谷'])) {
      path(out, 'brown', 150, 220, 350, 380, 340, 610, 500, 820);
      path(out, 'orange', 850, 220, 650, 390, 670, 610, 500, 820);
      path(out, 'red', 350, 380, 500, 470, 650, 390);
      path(out, 'red', 340, 610, 500, 690, 670, 610);
      line(out, 'blue', 500, 690, 500, 830);
      return out;
    }
    if (has(name, ['waterfall', 'falls', '瀑布'])) {
      shape(out, 'green', 130, 280, 430, 280, 400, 800, 150, 800);
      shape(out, 'green', 570, 280, 870, 280, 850, 800, 600, 800);
      path(out, 'sky', 440, 290, 560, 290, 540, 730, 460, 730);
      ellipse(out, 'blue', 500, 790, 250, 65, 0);
      for (var splash = 0; splash < 4; splash++)
        line(out, 'white', 370 + splash * 85, 760, 345 + splash * 85, 800);
      return out;
    }
    if (has(name, ['desert', 'sahara', '沙漠'])) {
      path(out, 'gold', 100, 670, 290, 520, 470, 680, 660, 510, 900, 650);
      path(out, 'orange', 100, 790, 300, 650, 520, 810, 750, 650, 900, 760);
      circle(out, 'gold', 740, 260, 90);
      return out;
    }
    if (has(name, ['equator', '赤道'])) {
      circle(out, 'blue', 500, 500, 270);
      path(out, 'green', 320, 420, 400, 355, 470, 450, 430, 550, 350, 565);
      path(out, 'green', 540, 550, 620, 430, 700, 500, 640, 640, 560, 620);
      line(out, 'white', 230, 500, 770, 500);
      return out;
    }
    if (
      has(name, [
        'arctic',
        'antarctic',
        'north pole',
        'south pole',
        '北極',
        '南極',
      ])
    ) {
      shape(
        out,
        'ice',
        180,
        760,
        320,
        460,
        440,
        600,
        560,
        360,
        690,
        560,
        820,
        430,
        900,
        760,
      );
      path(out, 'blue', 100, 800, 300, 760, 500, 800, 700, 760, 900, 800);
      circle(out, 'white', 740, 220, 70);
      return out;
    }
    if (has(name, ['rainforest', '雨林', '大堡礁'])) {
      for (var tree = 0; tree < 4; tree++) {
        rect(out, 'brown', 220 + tree * 160, 480, 50, 340);
        ellipse(out, 'green', 245 + tree * 160, 400, 125, 145, 0);
      }
      if (has(name, ['reef', '大堡礁'])) {
        path(
          out,
          'pink',
          120,
          790,
          250,
          680,
          300,
          770,
          380,
          680,
          440,
          800,
          560,
          710,
          620,
          800,
          720,
          670,
          880,
          790,
        );
        path(out, 'blue', 100, 850, 900, 850);
      }
      return out;
    }
    if (has(name, ['mountain', 'hill', 'volcano', '山', '火山'])) {
      shape(out, 'green', 120, 790, 430, 250, 610, 790);
      shape(out, 'green', 430, 790, 700, 350, 930, 790);
      shape(out, 'white', 360, 370, 430, 250, 500, 390, 445, 375);
      if (has(name, ['volcano', '火山'])) {
        path(out, 'red', 500, 255, 470, 170, 530, 100, 500, 45);
        circle(out, 'red', 610, 180, 30);
      }
      line(out, 'brown', 120, 800, 930, 800);
      return out;
    }
    if (has(name, ['dead branch', 'branch', 'twig', '枯枝', '樹枝'])) {
      path(out, 'brown', 220, 790, 430, 580, 500, 300, 630, 460, 800, 260);
      path(out, 'brown', 425, 585, 300, 420);
      path(out, 'brown', 500, 310, 405, 190);
      path(out, 'brown', 620, 465, 730, 360);
      circle(out, 'brown', 790, 260, 25);
      return out;
    }
    if (
      has(name, ['tree', 'forest', 'pine', 'palm', '樹', '森林', '松', '椰子'])
    ) {
      rect(out, 'brown', 450, 540, 100, 300);
      ellipse(out, 'green', 500, 385, 240, 205, 0);
      if (has(name, ['pine', '松'])) {
        shape(out, 'green', 500, 120, 260, 540, 740, 540);
        shape(out, 'green', 500, 310, 300, 700, 700, 700);
      }
      if (has(name, ['palm', '椰子'])) {
        line(out, 'brown', 500, 840, 540, 310);
        for (var fr = 0; fr < 6; fr++)
          path(out, 'green', 540, 330, 400 + fr * 50, 210, 280 + fr * 90, 320);
      }
      return out;
    }
    if (
      has(name, [
        'flower',
        'rose',
        'sunflower',
        'tulip',
        '花',
        '玫瑰',
        '向日葵',
        '菊',
        '梅',
      ])
    ) {
      line(out, 'green', 500, 520, 500, 880);
      ellipse(out, 'green', 435, 680, 85, 35, -25);
      ellipse(out, 'green', 570, 760, 85, 35, 25);
      for (var petal = 0; petal < 8; petal++) {
        var ang = (petal * Math.PI) / 4;
        ellipse(
          out,
          'pink',
          500 + Math.cos(ang) * 105,
          380 + Math.sin(ang) * 105,
          62,
          92,
          petal * 45,
        );
      }
      circle(out, 'gold', 500, 380, 70);
      return out;
    }
    if (
      has(name, [
        'river',
        'lake',
        'sea',
        'ocean',
        'beach',
        'waterfall',
        '河',
        '湖',
        '海',
        '瀑布',
        '溪',
      ])
    ) {
      path(out, 'blue', 100, 600, 300, 540, 470, 620, 650, 560, 900, 620);
      path(out, 'sky', 100, 690, 310, 635, 520, 710, 700, 650, 900, 700);
      path(out, 'blue', 100, 770, 330, 720, 520, 790, 730, 735, 900, 780);
      if (has(name, ['beach', '海灘']))
        shape(out, 'gold', 620, 800, 920, 800, 920, 600, 800, 660);
      return out;
    }
    if (has(name, ['cloud', 'sky', '雲', '天空'])) {
      ellipse(out, 'white', 500, 510, 255, 120, 0);
      circle(out, 'white', 385, 480, 100);
      circle(out, 'white', 500, 405, 130);
      circle(out, 'white', 630, 480, 105);
      circle(out, 'sky', 800, 220, 80);
      rays(out, 'gold', 800, 220, 105, 145, 8, 0);
      return out;
    }
    if (has(name, ['stone', 'rock', 'boulder', '石', '岩'])) {
      shape(out, 'gray', 200, 760, 270, 440, 460, 350, 700, 410, 820, 760);
      path(out, 'silver', 330, 520, 460, 430, 560, 480);
      return out;
    }
    if (has(name, ['star', 'moon', 'sun', 'planet', '星', '月', '太陽'])) {
      if (has(name, ['sun', '太陽'])) {
        circle(out, 'gold', 500, 500, 180);
        rays(out, 'orange', 500, 500, 240, 340, 12, -90);
      } else if (has(name, ['moon', '月'])) {
        circle(out, 'gold', 500, 500, 245);
        circle(out, 'cream', 610, 420, 220);
      } else star(out, 'gold', 500, 500, 300, 145, 5);
      return out;
    }
    // Nature landmark: sky, a green ground and one well-shaped subject.
    circle(out, 'gold', 760, 230, 90);
    path(out, 'green', 100, 800, 330, 650, 560, 800, 750, 620, 920, 800);
    line(out, 'brown', 120, 810, 900, 810);
    return out;
  }

  function drawPhenomenon(name) {
    var out = [];
    if (
      has(name, [
        'rain',
        'storm',
        'snow',
        'blizzard',
        'fog',
        'cloud',
        '梅雨',
        '下雪',
        '暴雨',
        '雷雨',
        '濃霧',
        '暴風雪',
      ])
    ) {
      ellipse(out, 'gray', 500, 330, 245, 120, 0);
      circle(out, 'gray', 380, 300, 100);
      circle(out, 'gray', 540, 250, 130);
      circle(out, 'gray', 665, 315, 100);
      for (var drop = 0; drop < 5; drop++)
        path(
          out,
          name.indexOf('雪') >= 0 || name.indexOf('snow') >= 0
            ? 'white'
            : 'blue',
          300 + drop * 95,
          500,
          270 + drop * 95,
          590,
          300 + drop * 95,
          660,
        );
      if (has(name, ['storm', '雷', '颱風'])) {
        path(out, 'gold', 620, 430, 500, 540, 585, 540, 450, 720);
      }
      return out;
    }
    if (has(name, ['eclipse', '日蝕', '月蝕'])) {
      circle(out, 'gold', 500, 500, 235);
      circle(out, 'dark', 600, 430, 205);
      rays(out, 'gold', 500, 500, 270, 330, 10, -90);
      return out;
    }
    if (has(name, ['wave', 'tide', 'tsunami', '海浪', '潮汐', '海嘯'])) {
      path(
        out,
        'blue',
        100,
        650,
        250,
        470,
        430,
        650,
        610,
        470,
        800,
        650,
        930,
        510,
      );
      path(
        out,
        'sky',
        100,
        760,
        280,
        610,
        460,
        760,
        650,
        610,
        830,
        760,
        930,
        660,
      );
      return out;
    }
    if (
      has(name, [
        'earthquake',
        'landslide',
        'avalanche',
        '地震',
        '山崩',
        '雪崩',
        '土石流',
      ])
    ) {
      path(
        out,
        'brown',
        120,
        720,
        300,
        520,
        430,
        690,
        520,
        500,
        650,
        690,
        850,
        500,
      );
      path(out, 'red', 480, 500, 430, 620, 530, 640, 470, 780);
      return out;
    }
    if (has(name, ['rainbow', 'aurora', '極光', '彩虹'])) {
      arc(out, 'red', 500, 750, 350, 180, 360);
      arc(out, 'gold', 500, 750, 290, 180, 360);
      arc(out, 'green', 500, 750, 230, 180, 360);
      arc(out, 'blue', 500, 750, 170, 180, 360);
      return out;
    }
    if (has(name, ['sunset', 'sunrise', '日出', '日落', '晚霞'])) {
      arc(out, 'gold', 500, 650, 200, 180, 360);
      line(out, 'blue', 100, 650, 900, 650);
      path(out, 'red', 120, 560, 300, 500, 430, 565);
      path(out, 'purple', 590, 565, 710, 495, 880, 550);
      return out;
    }
    if (
      has(name, ['wind', 'typhoon', 'tornado', '颱風', '季風', '焚風', '風'])
    ) {
      arc(out, 'sky', 500, 500, 270, 30, 330);
      arc(out, 'blue', 500, 500, 180, 10, 290);
      path(out, 'gray', 160, 350, 360, 350, 430, 410);
      path(out, 'gray', 840, 650, 640, 650, 570, 590);
      return out;
    }
    if (has(name, ['volcano', '火山'])) {
      shape(out, 'brown', 150, 800, 500, 250, 850, 800);
      path(out, 'red', 500, 250, 460, 160, 550, 100, 500, 40);
      circle(out, 'orange', 390, 200, 30);
      circle(out, 'orange', 620, 175, 24);
      return out;
    }
    star(out, 'gold', 500, 400, 180, 85, 5);
    rays(out, 'sky', 500, 500, 240, 340, 8, 0);
    return out;
  }

  function drawPlace(name) {
    var out = [];
    if (has(name, ['bridge', '橋'])) {
      line(out, 'brown', 180, 700, 820, 700);
      path(
        out,
        'brown',
        180,
        700,
        300,
        430,
        430,
        700,
        570,
        700,
        700,
        430,
        820,
        700,
      );
      for (var cable = 0; cable < 5; cable++)
        line(out, 'silver', 280 + cable * 110, 450, 280 + cable * 110, 690);
      return out;
    }
    if (has(name, ['castle', '城堡', '寺', '廟'])) {
      rect(out, 'cream', 260, 400, 480, 400);
      rect(out, 'brown', 200, 300, 120, 500);
      rect(out, 'brown', 680, 300, 120, 500);
      shape(out, 'red', 180, 320, 260, 180, 340, 320);
      shape(out, 'red', 660, 320, 740, 180, 820, 320);
      shape(out, 'red', 240, 420, 500, 260, 760, 420);
      rect(out, 'brown', 440, 590, 120, 210);
      return out;
    }
    if (
      has(name, [
        'hospital',
        'school',
        'library',
        'store',
        'bank',
        'hotel',
        'museum',
        '學校',
        '醫院',
        '圖書館',
        '超市',
        '銀行',
        '美術館',
        '博物館',
        '郵局',
      ])
    ) {
      shape(out, 'cream', 220, 360, 500, 180, 780, 360);
      rect(out, 'cream', 260, 360, 480, 440);
      for (var win = 0; win < 3; win++) {
        rect(out, 'sky', 320 + win * 140, 430, 85, 100);
        rect(out, 'sky', 320 + win * 140, 590, 85, 100);
      }
      rect(out, 'brown', 450, 630, 100, 170);
      if (has(name, ['hospital', '醫院'])) {
        line(out, 'red', 490, 235, 510, 235);
        line(out, 'red', 500, 225, 500, 245);
      }
      return out;
    }
    if (has(name, ['lighthouse', '燈塔'])) {
      shape(out, 'white', 350, 320, 650, 320, 600, 810, 400, 810);
      rect(out, 'red', 400, 470, 200, 65);
      rect(out, 'red', 380, 640, 240, 65);
      shape(out, 'gold', 350, 320, 500, 220, 650, 320);
      rays(out, 'gold', 500, 270, 120, 200, 6, -90);
      return out;
    }
    if (has(name, ['tower', '摩天', '101', '塔'])) {
      shape(out, 'teal', 370, 830, 440, 830, 620, 200, 500, 140, 380, 200);
      for (var level = 0; level < 5; level++)
        line(
          out,
          'white',
          390 + level * 7,
          350 + level * 90,
          610 - level * 7,
          350 + level * 90,
        );
      return out;
    }
    if (has(name, ['tent', '帳篷'])) {
      shape(out, 'orange', 170, 800, 500, 220, 830, 800);
      line(out, 'brown', 500, 220, 500, 800);
      path(out, 'cream', 390, 800, 500, 560, 610, 800);
      return out;
    }
    if (has(name, ['park', 'farm', '園', '公園', '農場', '果園'])) {
      circle(out, 'gold', 750, 230, 85);
      shape(out, 'green', 100, 810, 380, 620, 610, 810);
      rect(out, 'brown', 460, 590, 75, 220);
      ellipse(out, 'green', 500, 510, 180, 145, 0);
      rect(out, 'cream', 650, 520, 190, 230);
      shape(out, 'red', 630, 530, 745, 400, 860, 530);
      return out;
    }
    // Building front and path make otherwise abstract locations easy to sketch.
    shape(out, 'cream', 200, 400, 500, 180, 800, 400);
    rect(out, 'cream', 250, 400, 500, 420);
    rect(out, 'brown', 450, 620, 100, 200);
    for (var wi = 0; wi < 2; wi++)
      rect(out, 'sky', 310 + wi * 380, 490, 100, 95);
    return out;
  }

  function drawFun(name) {
    var out = [];
    if (
      has(name, [
        'ball',
        'baseball',
        'volleyball',
        'basketball',
        'tennis',
        'ping-pong',
        'badminton',
        '足球',
        '棒球',
        '排球',
        '籃球',
        '網球',
        '桌球',
        '羽毛球',
        '沙灘球',
        '躲避球',
      ])
    ) {
      circle(out, 'white', 500, 510, 250);
      if (has(name, ['baseball', '棒球'])) {
        arc(out, 'red', 500, 510, 200, 40, 140);
        arc(out, 'red', 500, 510, 200, 220, 320);
        for (var st = 0; st < 5; st++) {
          line(
            out,
            'red',
            330 + st * 20,
            390 + st * 18,
            345 + st * 20,
            405 + st * 18,
          );
          line(
            out,
            'red',
            655 + st * 20,
            600 + st * 18,
            670 + st * 20,
            615 + st * 18,
          );
        }
      } else if (has(name, ['basketball', '籃球'])) {
        arc(out, 'orange', 500, 510, 245, 60, 300);
        line(out, 'orange', 260, 510, 740, 510);
        arc(out, 'orange', 500, 510, 245, 0, 180);
      } else if (has(name, ['volleyball', '排球'])) {
        path(out, 'blue', 500, 260, 450, 400, 500, 510, 690, 560, 740, 740);
        path(out, 'blue', 500, 260, 570, 410, 500, 510, 330, 610, 280, 750);
      } else {
        path(out, 'black', 500, 260, 475, 390, 500, 510, 650, 570, 720, 730);
        path(out, 'black', 500, 260, 545, 390, 500, 510, 350, 570, 280, 730);
      }
      return out;
    }
    if (
      has(name, [
        'racket',
        'tennis',
        'badminton',
        '網球拍',
        '羽毛球拍',
        '桌球拍',
        '球拍',
      ])
    ) {
      ellipse(out, 'brown', 470, 370, 145, 220, -25);
      for (var net = 0; net < 4; net++) {
        line(out, 'silver', 380 + net * 45, 210, 560 + net * 30, 520);
        line(out, 'silver', 350, 300 + net * 45, 580, 260 + net * 45);
      }
      line(out, 'brown', 555, 540, 700, 850);
      return out;
    }
    if (has(name, ['robot', '機器人'])) {
      rect(out, 'silver', 330, 280, 340, 320);
      rect(out, 'blue', 390, 350, 80, 70);
      rect(out, 'blue', 530, 350, 80, 70);
      path(out, 'red', 440, 500, 500, 530, 560, 500);
      rect(out, 'red', 385, 630, 230, 200);
      line(out, 'silver', 500, 280, 500, 190);
      star(out, 'gold', 500, 160, 38, 18, 5);
      line(out, 'silver', 330, 710, 220, 790);
      line(out, 'silver', 670, 710, 780, 790);
      return out;
    }
    if (has(name, ['tent', '帳篷'])) {
      shape(out, 'orange', 160, 800, 500, 230, 840, 800);
      path(out, 'cream', 390, 800, 500, 540, 610, 800);
      line(out, 'brown', 500, 230, 500, 800);
      return out;
    }
    if (has(name, ['balloon', '氣球'])) {
      ellipse(out, 'pink', 500, 400, 190, 235, 0);
      shape(out, 'pink', 470, 620, 530, 620, 500, 665);
      path(out, 'brown', 500, 665, 465, 760, 535, 855);
      return out;
    }
    if (
      has(name, [
        'brush',
        'paint',
        'crayon',
        'pencil',
        '畫筆',
        '水彩',
        '蠟筆',
        '調色盤',
        '素描本',
      ])
    ) {
      ellipse(out, 'gold', 415, 500, 180, 230, 0);
      for (var hole = 0; hole < 5; hole++)
        circle(
          out,
          ['red', 'blue', 'green', 'purple', 'orange'][hole],
          345 + (hole % 3) * 95,
          420 + Math.floor(hole / 3) * 110,
          28,
        );
      path(out, 'brown', 580, 680, 720, 330, 800, 180);
      shape(out, 'red', 720, 330, 800, 180, 790, 380);
      return out;
    }
    if (has(name, ['windmill', 'pinwheel', '風車'])) {
      circle(out, 'gold', 500, 420, 38);
      for (var blade = 0; blade < 4; blade++) {
        var ang = (blade * Math.PI) / 2;
        ellipse(
          out,
          blade % 2 ? 'blue' : 'red',
          500 + Math.cos(ang) * 130,
          420 + Math.sin(ang) * 130,
          65,
          120,
          blade * 90,
        );
      }
      line(out, 'brown', 500, 460, 500, 850);
      return out;
    }
    if (
      has(name, [
        'carousel',
        'roller coaster',
        'amusement',
        '摩天輪',
        '旋轉木馬',
        '雲霄飛車',
        '海盜船',
      ])
    ) {
      circle(out, 'gold', 500, 480, 230);
      line(out, 'brown', 500, 700, 400, 900);
      line(out, 'brown', 500, 700, 600, 900);
      for (var seat = 0; seat < 6; seat++) {
        var theta = (seat * Math.PI) / 3;
        line(
          out,
          'silver',
          500,
          480,
          500 + Math.cos(theta) * 210,
          480 + Math.sin(theta) * 210,
        );
        circle(
          out,
          'red',
          500 + Math.cos(theta) * 210,
          480 + Math.sin(theta) * 210,
          35,
        );
      }
      return out;
    }
    if (has(name, ['skate', 'ski', '滑雪', '溜冰'])) {
      path(out, 'silver', 240, 700, 670, 700, 800, 760);
      line(out, 'blue', 350, 420, 500, 700);
      line(out, 'blue', 500, 400, 620, 700);
      return out;
    }
    if (has(name, ['fishing', '釣竿'])) {
      line(out, 'brown', 250, 250, 600, 500);
      path(out, 'brown', 600, 500, 750, 490, 800, 600);
      path(out, 'blue', 100, 750, 300, 700, 500, 750, 700, 700, 900, 750);
      circle(out, 'blue', 800, 660, 38);
    } else if (has(name, ['campfire', '營火'])) {
      shape(out, 'red', 330, 760, 500, 350, 670, 760);
      shape(out, 'gold', 420, 760, 500, 500, 580, 760);
      line(out, 'brown', 330, 800, 670, 800);
      line(out, 'brown', 380, 850, 620, 750);
    } else if (has(name, ['doll', '洋娃娃'])) {
      circle(out, 'skin', 500, 300, 115);
      rect(out, 'pink', 385, 420, 230, 330);
      line(out, 'skin', 385, 480, 280, 650);
      line(out, 'skin', 615, 480, 720, 650);
      circle(out, 'dark', 465, 290, 12);
      circle(out, 'dark', 535, 290, 12);
    } else {
      circle(out, 'gold', 500, 460, 190);
      line(out, 'dark', 310, 460, 690, 460);
      line(out, 'dark', 500, 270, 500, 650);
      line(out, 'brown', 500, 650, 500, 850);
    }
    return out;
  }

  function drawMusic(name) {
    var out = [];
    if (has(name, ['loudspeaker', 'speaker', '喇叭'])) {
      path(
        out,
        'dark',
        270,
        390,
        430,
        390,
        650,
        250,
        650,
        750,
        430,
        610,
        270,
        610,
        270,
        390,
      );
      rect(out, 'dark', 330, 610, 95, 180);
      arc(out, 'blue', 650, 500, 115, 300, 60);
      arc(out, 'blue', 650, 500, 195, 300, 60);
      return out;
    }
    if (
      has(name, [
        'violin',
        'cello',
        'viola',
        'bass',
        '小提琴',
        '大提琴',
        '中提琴',
        '低音提琴',
      ])
    ) {
      ellipse(out, 'brown', 500, 590, 160, 215, 0);
      ellipse(out, 'wood', 500, 430, 100, 155, 0);
      rect(out, 'brown', 465, 170, 70, 290);
      circle(out, 'dark', 500, 180, 48);
      path(out, 'dark', 380, 510, 450, 550, 380, 600);
      path(out, 'dark', 620, 510, 550, 550, 620, 600);
      line(out, 'silver', 690, 220, 470, 820);
      line(out, 'wood', 720, 200, 500, 800);
      return out;
    }
    if (has(name, ['guitar', 'harp', 'ukulele', '豎琴', '吉他', '貝斯'])) {
      if (has(name, ['harp', '豎琴'])) {
        path(out, 'gold', 300, 820, 350, 300, 650, 170, 720, 820);
        for (var string = 0; string < 6; string++)
          line(out, 'silver', 390 + string * 45, 330, 500 + string * 25, 790);
      } else {
        ellipse(out, 'brown', 500, 640, 190, 230, 0);
        ellipse(out, 'wood', 500, 480, 110, 120, 0);
        rect(out, 'brown', 460, 180, 80, 340);
        circle(out, 'dark', 500, 180, 45);
        for (var str = 0; str < 4; str++)
          line(out, 'silver', 475 + str * 17, 230, 475 + str * 17, 820);
      }
      return out;
    }
    if (
      has(name, [
        'flute',
        'clarinet',
        'oboe',
        'trumpet',
        'trombone',
        'saxophone',
        'horn',
        '喇叭',
        '小號',
        '長笛',
        '薩克斯',
        '口琴',
        '豎笛',
        '雙簧管',
        '伸縮號',
        '法國號',
      ])
    ) {
      if (
        has(name, ['trumpet', 'trombone', '喇叭', '小號', '伸縮號', '法國號'])
      ) {
        path(out, 'gold', 230, 470, 340, 470, 380, 420, 560, 420, 610, 350);
        path(out, 'gold', 230, 530, 340, 530, 380, 580, 560, 580, 610, 650);
        ellipse(out, 'gold', 700, 500, 125, 190, 0);
        line(out, 'gold', 370, 445, 370, 555);
        for (var valve = 0; valve < 3; valve++) {
          line(out, 'silver', 430 + valve * 55, 420, 430 + valve * 55, 330);
          circle(out, 'silver', 430 + valve * 55, 315, 19);
        }
      } else {
        path(out, 'gold', 300, 340, 650, 340, 700, 400, 330, 450);
        for (var hole = 0; hole < 5; hole++)
          circle(out, 'dark', 370 + hole * 55, 390, 12);
      }
      if (has(name, ['saxophone', '薩克斯'])) {
        path(out, 'gold', 600, 350, 650, 550, 500, 710, 680, 730, 710, 650);
        circle(out, 'silver', 680, 730, 50);
      }
      return out;
    }
    if (
      has(name, [
        'drum',
        'tambourine',
        '鈴鼓',
        '手鼓',
        '打擊',
        '沙鈴',
        '木琴',
        '鐵琴',
        '三角鐵',
        '響板',
        '鼓棒',
      ])
    ) {
      ellipse(out, 'red', 500, 530, 250, 160, 0);
      ellipse(out, 'cream', 500, 520, 225, 135, 0);
      line(out, 'brown', 355, 530, 455, 210);
      line(out, 'brown', 645, 530, 545, 210);
      if (has(name, ['木琴', '鐵琴']))
        for (var bar = 0; bar < 5; bar++)
          rect(out, 'gold', 310 + bar * 80, 610 + (bar % 2) * 50, 65, 36);
      return out;
    }
    if (has(name, ['record', '唱片'])) {
      circle(out, 'dark', 500, 500, 270);
      circle(out, 'silver', 500, 500, 170);
      circle(out, 'red', 500, 500, 55);
      return out;
    }
    if (has(name, ['bell', '鈴'])) {
      path(
        out,
        'gold',
        310,
        600,
        360,
        350,
        410,
        260,
        590,
        260,
        640,
        350,
        690,
        600,
        310,
        600,
      );
      line(out, 'gold', 270, 630, 730, 630);
      circle(out, 'red', 500, 690, 42);
      return out;
    }
    if (
      has(name, [
        'note',
        'score',
        'music',
        '譜',
        '音符',
        '休止符',
        '卡農',
        '圓舞曲',
        '國歌',
        '交響',
        '樂團',
        '兒歌',
        '搖籃曲',
        '進行曲',
        '古典',
        '爵士',
        '搖滾',
        '饒舌',
        '流行歌',
      ])
    ) {
      for (var staff = 0; staff < 5; staff++)
        line(out, 'dark', 180, 500 + staff * 65, 820, 500 + staff * 65);
      ellipse(out, 'dark', 360, 650, 42, 27, -20);
      line(out, 'dark', 400, 650, 400, 390);
      ellipse(out, 'dark', 590, 520, 42, 27, -20);
      line(out, 'dark', 630, 520, 630, 270);
      path(out, 'dark', 400, 390, 520, 350, 630, 330);
      return out;
    }
    // A familiar piano keyboard for music groups and recording topics.
    rect(out, 'white', 230, 380, 540, 360);
    for (var key = 0; key < 7; key++)
      line(out, 'dark', 230 + key * 77, 380, 230 + key * 77, 740);
    for (var blackKey = 0; blackKey < 5; blackKey++)
      rect(out, 'dark', 285 + blackKey * 77, 380, 44, 210);
    return out;
  }

  function drawFestival(name) {
    var out = [];
    if (has(name, ['christmas', '聖誕'])) {
      shape(out, 'green', 500, 150, 250, 650, 750, 650);
      shape(out, 'green', 500, 300, 180, 800, 820, 800);
      rect(out, 'brown', 450, 800, 100, 95);
      star(out, 'gold', 500, 120, 90, 40, 5);
      for (var bauble = 0; bauble < 5; bauble++)
        circle(out, 'red', 360 + bauble * 70, 460 + (bauble % 2) * 125, 24);
      return out;
    }
    if (has(name, ['firework', '煙火', '跨年'])) {
      for (var burst = 0; burst < 3; burst++) {
        var cx = 300 + burst * 200,
          cy = 330 + (burst % 2) * 120;
        rays(out, ['red', 'gold', 'blue'][burst], cx, cy, 65, 150, 10, -90);
        circle(out, 'gold', cx, cy, 17);
      }
      line(out, 'brown', 100, 850, 900, 850);
      return out;
    }
    if (has(name, ['lantern', '燈籠', '天燈', '元宵'])) {
      ellipse(out, 'red', 500, 430, 185, 250, 0);
      line(out, 'gold', 330, 430, 670, 430);
      line(out, 'gold', 360, 610, 640, 610);
      rect(out, 'gold', 470, 675, 60, 110);
      line(out, 'red', 440, 225, 560, 225);
      rays(out, 'gold', 500, 140, 125, 175, 8, -90);
      return out;
    }
    if (has(name, ['dragon', '舞龍'])) {
      path(
        out,
        'green',
        140,
        600,
        260,
        430,
        380,
        570,
        500,
        430,
        620,
        570,
        740,
        430,
        840,
        570,
      );
      circle(out, 'green', 850, 500, 80);
      path(out, 'red', 820, 455, 950, 430, 900, 500);
      circle(out, 'gold', 855, 485, 12);
      for (var fin = 0; fin < 4; fin++)
        shape(
          out,
          'gold',
          260 + fin * 145,
          470,
          300 + fin * 145,
          350,
          360 + fin * 145,
          475,
        );
      return out;
    }
    if (has(name, ['lion', '舞獅'])) {
      circle(out, 'red', 500, 500, 260);
      ellipse(out, 'white', 410, 440, 75, 90, 0);
      ellipse(out, 'white', 590, 440, 75, 90, 0);
      circle(out, 'dark', 420, 435, 22);
      circle(out, 'dark', 580, 435, 22);
      path(out, 'white', 370, 575, 500, 700, 630, 575);
      line(out, 'gold', 330, 350, 240, 270);
      line(out, 'gold', 670, 350, 760, 270);
      return out;
    }
    if (has(name, ['egg', '復活節', '彩蛋'])) {
      ellipse(out, 'pink', 500, 500, 180, 245, 0);
      path(out, 'gold', 340, 430, 420, 390, 500, 430, 580, 390, 660, 430);
      path(out, 'blue', 350, 600, 425, 560, 500, 600, 575, 560, 650, 600);
      star(out, 'gold', 500, 300, 38, 18, 5);
      return out;
    }
    if (has(name, ['gift', '禮物', '紅包'])) {
      rect(out, 'red', 240, 400, 520, 390);
      rect(out, 'gold', 455, 400, 90, 390);
      rect(out, 'red', 210, 330, 580, 100);
      rect(out, 'gold', 455, 330, 90, 100);
      ellipse(out, 'gold', 420, 285, 90, 45, -30);
      ellipse(out, 'gold', 580, 285, 90, 45, 30);
      return out;
    }
    if (has(name, ['moon', '賞月', '中秋'])) {
      circle(out, 'gold', 500, 330, 145);
      circle(out, 'cream', 530, 300, 145);
      ellipse(out, 'brown', 500, 720, 285, 95, 0);
      ellipse(out, 'cream', 500, 675, 220, 60, 0);
      for (var dumpling = 0; dumpling < 3; dumpling++)
        circle(out, 'white', 400 + dumpling * 100, 655, 35);
      return out;
    }
    if (has(name, ['boat', 'dragon boat', '端午', '龍舟'])) {
      path(out, 'red', 170, 570, 830, 570, 700, 740, 300, 740, 170, 570);
      shape(out, 'gold', 300, 570, 390, 440, 470, 570);
      shape(out, 'green', 520, 570, 610, 440, 690, 570);
      for (var rower = 0; rower < 3; rower++)
        line(out, 'brown', 360 + rower * 120, 480, 290 + rower * 150, 370);
      path(out, 'blue', 120, 800, 400, 760, 650, 800, 880, 760);
      return out;
    }
    if (has(name, ['pumpkin', 'halloween', '南瓜', '萬聖'])) {
      ellipse(out, 'orange', 500, 540, 250, 200, 0);
      ellipse(out, 'gold', 500, 540, 105, 200, 0);
      shape(out, 'dark', 390, 500, 460, 470, 455, 550);
      shape(out, 'dark', 610, 500, 680, 470, 620, 550);
      path(out, 'dark', 400, 620, 500, 690, 600, 620);
      line(out, 'green', 500, 340, 520, 270);
      return out;
    }
    if (has(name, ['birthday', '生日'])) {
      shape(out, 'pink', 300, 500, 700, 500, 700, 790, 300, 790);
      path(out, 'cream', 300, 500, 400, 450, 500, 500, 600, 450, 700, 500);
      for (var candle = 0; candle < 3; candle++) {
        line(out, 'blue', 410 + candle * 90, 450, 410 + candle * 90, 340);
        ellipse(out, 'gold', 410 + candle * 90, 320, 22, 40, 0);
      }
      return out;
    }
    if (has(name, ['valentine', '情人'])) {
      path(
        out,
        'red',
        500,
        780,
        220,
        520,
        310,
        350,
        500,
        470,
        690,
        350,
        780,
        520,
        500,
        780,
      );
      line(out, 'green', 500, 470, 500, 850);
      ellipse(out, 'pink', 385, 760, 90, 34, -25);
      ellipse(out, 'pink', 615, 760, 90, 34, 25);
      return out;
    }
    person(out, 'hat');
    return out;
  }

  function drawScience(name, category) {
    var out = [];
    if (category === 'astro') {
      if (has(name, ['solar system', '太陽系'])) {
        circle(out, 'gold', 500, 500, 90);
        ellipse(out, 'silver', 500, 500, 190, 110, -20);
        ellipse(out, 'silver', 500, 500, 310, 190, 20);
        ellipse(out, 'silver', 500, 500, 420, 265, -20);
        circle(out, 'red', 665, 430, 35);
        circle(out, 'blue', 785, 590, 48);
        circle(out, 'orange', 145, 550, 55);
        circle(out, 'brown', 900, 360, 68);
      } else if (has(name, ['sunspot', '太陽黑子'])) {
        circle(out, 'gold', 500, 500, 255);
        circle(out, 'dark', 445, 470, 42);
        ellipse(out, 'dark', 555, 560, 70, 45, 0);
        rays(out, 'orange', 500, 500, 290, 350, 10, -90);
      } else if (has(name, ['black hole', '黑洞'])) {
        circle(out, 'dark', 500, 500, 130);
        ellipse(out, 'purple', 500, 500, 330, 115, -20);
        ellipse(out, 'gold', 500, 500, 235, 55, -20);
        circle(out, 'white', 500, 500, 110);
      } else if (has(name, ['galaxy', '銀河', '星系'])) {
        ellipse(out, 'purple', 500, 500, 120, 320, -30);
        ellipse(out, 'blue', 500, 500, 120, 320, 30);
        circle(out, 'gold', 500, 500, 80);
        for (var gl = 0; gl < 7; gl++)
          star(out, 'white', 220 + gl * 90, 220 + (gl % 3) * 190, 25, 11, 5);
      } else if (has(name, ['rocket', '火箭', '登月'])) {
        shape(out, 'silver', 500, 150, 680, 600, 500, 820, 320, 600);
        circle(out, 'sky', 500, 490, 60);
        shape(out, 'red', 330, 650, 230, 790, 400, 730);
        shape(out, 'red', 670, 650, 770, 790, 600, 730);
        path(out, 'orange', 430, 790, 500, 950, 570, 790);
      } else if (
        has(name, [
          'satellite',
          '衛星',
          '太空站',
          '太空望遠鏡',
          'space station',
        ])
      ) {
        rect(out, 'silver', 420, 400, 160, 200);
        rect(out, 'blue', 180, 380, 210, 240);
        rect(out, 'blue', 610, 380, 210, 240);
        line(out, 'silver', 390, 500, 420, 500);
        line(out, 'silver', 580, 500, 610, 500);
        circle(out, 'gold', 500, 380, 45);
      } else if (has(name, ['constellation', 'star', '座', '星'])) {
        path(out, 'sky', 220, 620, 360, 380, 510, 490, 680, 250, 810, 610);
        for (var st = 0; st < 5; st++)
          star(
            out,
            'gold',
            [220, 360, 510, 680, 810][st],
            [620, 380, 490, 250, 610][st],
            60,
            25,
            5,
          );
      } else if (has(name, ['saturn', '土星'])) {
        circle(out, 'gold', 500, 500, 180);
        ellipse(out, 'brown', 500, 500, 340, 85, -20);
      } else {
        var planetColor = has(name, ['mars', '火星'])
          ? 'red'
          : has(name, ['earth', '地球'])
            ? 'blue'
            : has(name, ['jupiter', '木星'])
              ? 'orange'
              : has(name, ['venus', '金星'])
                ? 'gold'
                : 'sky';
        circle(out, planetColor, 500, 500, 225);
        if (has(name, ['earth', '地球'])) {
          path(out, 'green', 330, 430, 420, 360, 470, 450, 420, 540, 340, 540);
          path(out, 'green', 560, 545, 630, 500, 680, 570, 620, 660);
        }
        if (has(name, ['jupiter', '木星'])) {
          path(out, 'cream', 300, 420, 450, 390, 700, 430);
          path(out, 'cream', 290, 550, 500, 520, 710, 560);
          ellipse(out, 'red', 610, 570, 55, 30, 0);
        }
        if (has(name, ['moon', '月相'])) {
          circle(out, 'cream', 500, 500, 225);
          circle(out, 'dark', 600, 450, 200);
        }
      }
      return out;
    }
    if (category === 'physics') {
      if (has(name, ['magnet', '磁鐵', '電磁鐵'])) {
        path(
          out,
          'red',
          300,
          230,
          300,
          590,
          350,
          700,
          430,
          770,
          570,
          770,
          650,
          700,
          700,
          590,
          700,
          230,
        );
        line(out, 'silver', 300, 230, 440, 230);
        line(out, 'silver', 560, 230, 700, 230);
        line(out, 'red', 300, 350, 440, 350);
        line(out, 'blue', 560, 350, 700, 350);
        rays(out, 'gold', 500, 520, 180, 250, 8, 0);
        return out;
      }
      if (
        has(name, [
          'lever',
          'pulley',
          'balance',
          '天平',
          '槓桿',
          '滑輪',
          '杠桿',
        ])
      ) {
        shape(out, 'brown', 420, 820, 580, 820, 500, 670);
        line(out, 'brown', 200, 350, 800, 350);
        line(out, 'brown', 500, 350, 500, 670);
        path(out, 'blue', 230, 350, 130, 580, 330, 580, 230, 350);
        path(out, 'red', 770, 350, 670, 580, 870, 580, 770, 350);
        line(out, 'silver', 230, 580, 330, 580);
        line(out, 'silver', 670, 580, 870, 580);
        return out;
      }
      if (has(name, ['gear', '齒輪'])) {
        circle(out, 'silver', 500, 500, 220);
        circle(out, 'white', 500, 500, 85);
        rays(out, 'silver', 500, 500, 210, 285, 12, 0);
        for (var tooth = 0; tooth < 8; tooth++)
          line(out, 'dark', 430 + tooth * 20, 500, 570 - tooth * 20, 500);
        return out;
      }
      if (has(name, ['spring', '彈簧'])) {
        path(
          out,
          'blue',
          300,
          240,
          700,
          240,
          300,
          330,
          700,
          420,
          300,
          510,
          700,
          600,
          300,
          690,
          700,
          780,
          300,
          780,
        );
        line(out, 'dark', 300, 200, 700, 200);
        line(out, 'dark', 300, 820, 700, 820);
        return out;
      }
      if (
        has(name, [
          'prism',
          'lens',
          'refraction',
          '稜鏡',
          '折射',
          '透鏡',
          '放大鏡',
        ])
      ) {
        shape(out, 'sky', 420, 280, 650, 500, 420, 720);
        line(out, 'red', 150, 500, 420, 500);
        line(out, 'orange', 650, 470, 850, 380);
        line(out, 'green', 650, 500, 870, 500);
        line(out, 'blue', 650, 530, 850, 620);
        return out;
      }
      if (has(name, ['sound', 'echo', 'wave', '聲波', '回聲', '超音波'])) {
        circle(out, 'dark', 260, 500, 70);
        for (var wave = 0; wave < 4; wave++)
          arc(out, 'blue', 320, 500, 100 + wave * 85, 285, 75);
        return out;
      }
      if (has(name, ['electric', 'current', 'static', '電流', '靜電'])) {
        line(out, 'dark', 260, 300, 260, 700);
        line(out, 'dark', 740, 300, 740, 700);
        line(out, 'dark', 260, 300, 740, 300);
        line(out, 'dark', 260, 700, 740, 700);
        path(
          out,
          'gold',
          540,
          350,
          420,
          530,
          530,
          530,
          440,
          680,
          610,
          470,
          500,
          470,
        );
        circle(out, 'red', 260, 300, 35);
        circle(out, 'blue', 740, 700, 35);
        return out;
      }
      if (has(name, ['gravity', 'fall', '重力', '自由落體'])) {
        circle(out, 'red', 500, 330, 85);
        path(out, 'green', 500, 250, 540, 190, 590, 210);
        line(out, 'blue', 500, 430, 500, 720);
        path(out, 'blue', 440, 650, 500, 740, 560, 650);
        path(out, 'brown', 200, 820, 430, 700, 570, 820, 820, 700);
        return out;
      }
      if (has(name, ['evapor', 'boil', '蒸發', '沸騰', '氣壓', '水壓'])) {
        path(out, 'blue', 260, 600, 320, 780, 680, 780, 740, 600);
        line(out, 'blue', 260, 600, 740, 600);
        for (var steam = 0; steam < 3; steam++)
          path(
            out,
            'sky',
            380 + steam * 100,
            520,
            350 + steam * 100,
            430,
            390 + steam * 100,
            350,
          );
        return out;
      }
      if (has(name, ['shadow', '影子'])) {
        circle(out, 'gold', 350, 380, 90);
        line(out, 'gray', 450, 500, 790, 780);
        ellipse(out, 'gray', 700, 790, 180, 45, 0);
        return out;
      }
      if (has(name, ['ramp', '斜坡', '拋物線'])) {
        path(out, 'brown', 180, 800, 820, 800, 820, 360);
        path(out, 'blue', 250, 750, 420, 600, 580, 470, 790, 400);
        circle(out, 'red', 255, 730, 34);
        return out;
      }
      // A little experiment setup gives abstract forces something drawable.
      rect(out, 'silver', 340, 350, 320, 370);
      circle(out, 'gold', 500, 520, 100);
      line(out, 'dark', 500, 720, 500, 850);
      line(out, 'dark', 350, 850, 650, 850);
      rays(out, 'blue', 500, 300, 180, 240, 8, -90);
      return out;
    }
    if (category === 'civics') {
      if (has(name, ['vote', 'election', '投票', '選舉', '公投'])) {
        rect(out, 'red', 250, 500, 500, 300);
        rect(out, 'white', 350, 310, 300, 190);
        line(out, 'dark', 500, 325, 500, 460);
        path(out, 'blue', 400, 390, 470, 445, 600, 330);
        return out;
      }
      if (has(name, ['flag', '國旗'])) {
        line(out, 'brown', 300, 180, 300, 850);
        rect(out, 'red', 300, 200, 480, 300);
        star(out, 'gold', 460, 350, 85, 38, 5);
        return out;
      }
      if (has(name, ['traffic', 'light', '紅綠燈', '交通號誌'])) {
        rect(out, 'dark', 375, 160, 250, 580);
        circle(out, 'red', 500, 285, 72);
        circle(out, 'gold', 500, 445, 72);
        circle(out, 'green', 500, 605, 72);
        line(out, 'dark', 500, 740, 500, 880);
        return out;
      }
      if (has(name, ['crosswalk', '斑馬線'])) {
        path(out, 'dark', 180, 230, 820, 230, 820, 780, 180, 780);
        for (var stripe = 0; stripe < 5; stripe++)
          rect(out, 'white', 235 + stripe * 115, 320, 65, 360);
        return out;
      }
      if (
        has(name, [
          'passport',
          'identity',
          'id card',
          '駕照',
          '護照',
          '身分證',
          '健保卡',
        ])
      ) {
        rect(out, 'teal', 210, 300, 580, 390);
        rect(out, 'white', 260, 355, 150, 210);
        circle(out, 'skin', 335, 420, 40);
        path(out, 'blue', 285, 535, 335, 470, 385, 535);
        for (var detail = 0; detail < 3; detail++)
          line(out, 'dark', 460, 410 + detail * 65, 720, 410 + detail * 65);
        return out;
      }
      if (
        has(name, [
          'law',
          'constitution',
          'legal',
          '憲法',
          '法律',
          '判決',
          '法院',
        ])
      ) {
        rect(out, 'cream', 340, 300, 320, 440);
        line(out, 'dark', 415, 400, 585, 400);
        line(out, 'dark', 415, 475, 585, 475);
        line(out, 'dark', 415, 550, 550, 550);
        line(out, 'brown', 500, 740, 500, 850);
        line(out, 'brown', 300, 850, 700, 850);
        circle(out, 'gold', 500, 265, 65);
        return out;
      }
      if (has(name, ['seat belt', '安全帶'])) {
        path(out, 'red', 350, 250, 650, 250, 600, 800, 400, 800, 350, 250);
        line(out, 'dark', 390, 310, 620, 650);
        rect(out, 'gold', 480, 490, 80, 75);
        return out;
      }
      if (has(name, ['garbage', 'recycl', '垃圾分類', '資源回收'])) {
        rect(out, 'blue', 250, 350, 220, 420);
        rect(out, 'green', 530, 350, 220, 420);
        path(out, 'white', 300, 520, 350, 430, 400, 520);
        path(out, 'white', 600, 520, 650, 430, 700, 520);
        return out;
      }
      if (has(name, ['ticket', '罰單'])) {
        rect(out, 'cream', 350, 200, 300, 600);
        line(out, 'red', 410, 350, 590, 350);
        line(out, 'dark', 410, 440, 590, 440);
        line(out, 'dark', 410, 530, 560, 530);
        star(out, 'red', 500, 675, 60, 25, 5);
        return out;
      }
      // Civic offices are shown with a civic building and a public-service sign.
      rect(out, 'cream', 250, 340, 500, 470);
      shape(out, 'white', 210, 350, 500, 180, 790, 350);
      rect(out, 'brown', 450, 610, 100, 200);
      for (var col = 0; col < 3; col++) {
        rect(out, 'white', 320 + col * 180, 420, 70, 170);
        line(out, 'silver', 355 + col * 180, 420, 355 + col * 180, 590);
      }
      return out;
    }
    return out;
  }

  function drawGeography(name, category) {
    var out = [];
    if (category === 'taiwan') {
      if (has(name, ['101', '台北'])) {
        shape(out, 'teal', 365, 850, 635, 850, 600, 230, 500, 130, 400, 230);
        for (var floor = 0; floor < 5; floor++)
          line(
            out,
            'white',
            405 + floor * 6,
            360 + floor * 85,
            595 - floor * 6,
            360 + floor * 85,
          );
      } else if (has(name, ['玉山', '山', '阿里'])) {
        shape(out, 'green', 140, 800, 500, 210, 870, 800);
        shape(out, 'white', 420, 330, 500, 210, 580, 340, 500, 300);
        if (has(name, ['阿里'])) {
          path(out, 'red', 160, 745, 330, 690, 500, 745, 680, 690, 850, 745);
          circle(out, 'red', 760, 230, 55);
        }
      } else if (has(name, ['日月潭'])) {
        circle(out, 'gold', 660, 280, 90);
        ellipse(out, 'blue', 500, 610, 330, 175, 0);
        shape(out, 'green', 100, 800, 260, 580, 410, 800);
        shape(out, 'green', 600, 800, 770, 570, 920, 800);
      } else if (has(name, ['日月光'])) {
        rect(out, 'silver', 280, 390, 440, 330);
        rect(out, 'blue', 330, 440, 90, 90);
        rect(out, 'blue', 455, 440, 90, 90);
        rect(out, 'blue', 580, 440, 90, 90);
        line(out, 'dark', 250, 720, 750, 720);
        path(out, 'green', 180, 800, 350, 740, 520, 800, 700, 740, 850, 800);
      } else if (has(name, ['檳榔'])) {
        path(out, 'green', 500, 830, 300, 250, 500, 390, 700, 250, 500, 830);
        line(out, 'white', 500, 420, 500, 790);
        ellipse(out, 'brown', 500, 560, 62, 130, 0);
      } else if (has(name, ['澎湖', '蘭嶼', '墾丁', '太魯閣'])) {
        path(out, 'blue', 130, 700, 320, 610, 490, 700, 680, 610, 870, 700);
        path(out, 'brown', 310, 620, 410, 390, 500, 620);
        path(out, 'brown', 510, 620, 610, 430, 690, 620);
        star(out, 'gold', 500, 280, 65, 30, 5);
      } else if (has(name, ['媽祖', '蜂炮'])) {
        person(out, 'hat');
        rays(out, 'red', 780, 260, 55, 170, 10, -90);
      } else {
        ellipse(out, 'green', 500, 530, 180, 245, 0);
        circle(out, 'red', 500, 300, 55);
      }
      return out;
    }
    if (has(name, ['tower', '鐵塔', '艾菲爾'])) {
      path(out, 'dark', 500, 180, 350, 830, 650, 830, 500, 180);
      line(out, 'dark', 400, 480, 600, 480);
      line(out, 'dark', 360, 650, 640, 650);
      line(out, 'dark', 390, 560, 610, 560);
      return out;
    }
    if (has(name, ['liberty', '自由女神'])) {
      person(out, '');
      star(out, 'gold', 500, 170, 120, 55, 7);
      line(out, 'green', 660, 230, 780, 110);
      rays(out, 'gold', 780, 100, 20, 70, 8, 0);
      return out;
    }
    if (has(name, ['big ben', '大笨鐘'])) {
      shape(out, 'brown', 360, 850, 640, 850, 600, 220, 500, 140, 400, 220);
      circle(out, 'white', 500, 400, 80);
      line(out, 'dark', 500, 400, 500, 345);
      line(out, 'dark', 500, 400, 545, 420);
      for (var lv = 0; lv < 3; lv++)
        line(out, 'gold', 410, 530 + lv * 90, 590, 530 + lv * 90);
      return out;
    }
    if (has(name, ['opera house', '雪梨歌劇院'])) {
      path(out, 'white', 180, 680, 430, 300, 450, 680);
      path(out, 'white', 400, 680, 620, 260, 680, 680);
      path(out, 'white', 610, 680, 810, 390, 850, 680);
      line(out, 'blue', 160, 710, 880, 710);
      return out;
    }
    if (has(name, ['white house', '白宮'])) {
      shape(out, 'white', 230, 420, 500, 250, 770, 420);
      rect(out, 'white', 280, 420, 440, 340);
      for (var col = 0; col < 5; col++)
        rect(out, 'silver', 330 + col * 75, 450, 38, 270);
      line(out, 'green', 180, 770, 820, 770);
      return out;
    }
    if (has(name, ['sagrada', '聖家堂'])) {
      rect(out, 'cream', 280, 500, 440, 350);
      for (var spire = 0; spire < 4; spire++) {
        shape(
          out,
          'cream',
          320 + spire * 100,
          500,
          360 + spire * 100,
          160 + (spire % 2) * 55,
          400 + spire * 80,
          500,
        );
        line(out, 'brown', 360 + spire * 100, 245, 360 + spire * 100, 300);
      }
      return out;
    }
    if (has(name, ['sahara', '撒哈拉'])) return drawNature(name);
    if (has(name, ['pyramid', '埃及'])) {
      shape(out, 'gold', 150, 800, 500, 230, 850, 800);
      path(out, 'brown', 500, 230, 500, 800, 850, 800);
      path(out, 'cream', 500, 230, 150, 800, 500, 800);
      circle(out, 'gold', 740, 260, 85);
      return out;
    }
    if (
      has(name, ['fuji', 'himalaya', 'everest', '富士', '喜馬拉雅', '聖母峰'])
    )
      return drawNature(name);
    if (
      has(name, [
        'amazon',
        'nile',
        'yangtze',
        'yellow river',
        'mississippi',
        'river',
        '尼羅河',
        '長江',
        '黃河',
        '亞馬遜',
        '密西西比',
        '河',
      ])
    )
      return drawNature(name);
    if (has(name, ['niagara', 'waterfall', '瀑布'])) return drawNature(name);
    if (
      has(name, [
        'dead sea',
        'baikal',
        'mediterranean',
        '死海',
        '貝加爾',
        '地中海',
      ])
    )
      return drawNature('lake');
    if (has(name, ['reef', '大堡礁'])) return drawNature(name);
    if (has(name, ['hong kong', 'macau', 'dubai', '香港', '澳門', '杜拜'])) {
      for (var tower = 0; tower < 3; tower++) {
        rect(
          out,
          ['teal', 'blue', 'cream'][tower],
          260 + tower * 190,
          300 + (tower % 2) * 100,
          145,
          520 - (tower % 2) * 100,
        );
        for (var win = 0; win < 3; win++)
          line(
            out,
            'white',
            280 + tower * 190,
            410 + win * 95,
            390 + tower * 190,
            410 + win * 95,
          );
      }
      return out;
    }
    var countries = [
      'taiwan',
      '台灣',
      'japan',
      '日本',
      'korea',
      '韓國',
      'thailand',
      '泰國',
      'vietnam',
      '越南',
      'singapore',
      '新加坡',
      'india',
      '印度',
      'egypt',
      '埃及',
      'france',
      '法國',
      'united kingdom',
      'england',
      '英國',
      'germany',
      '德國',
      'italy',
      '義大利',
      'spain',
      '西班牙',
      'netherlands',
      '荷蘭',
      'switzerland',
      '瑞士',
      'greece',
      '希臘',
      'russia',
      '俄羅斯',
      'united states',
      'usa',
      '美國',
      'canada',
      '加拿大',
      'mexico',
      '墨西哥',
      'brazil',
      '巴西',
      'argentina',
      '阿根廷',
      'australia',
      '澳洲',
      'new zealand',
      '紐西蘭',
      'kenya',
      '肯亞',
      'south africa',
      '南非',
      'iceland',
      '冰島',
      'finland',
      '芬蘭',
      'turkey',
      '土耳其',
      'mongolia',
      '蒙古',
      'china',
      '中國',
      'philippines',
      '菲律賓',
      'malaysia',
      '馬來西亞',
      'indonesia',
      '印尼',
      'myanmar',
      '緬甸',
      'nepal',
      '尼泊爾',
      'israel',
      '以色列',
      'sweden',
      '瑞典',
      'norway',
      '挪威',
      'denmark',
      '丹麥',
      'poland',
      '波蘭',
      'czech',
      '捷克',
      'austria',
      '奧地利',
      'portugal',
      '葡萄牙',
      'ireland',
      '愛爾蘭',
      'chile',
      '智利',
      'peru',
      '秘魯',
      'cuba',
      '古巴',
      'morocco',
      '摩洛哥',
      'ethiopia',
      '衣索比亞',
    ];
    if (!has(name, countries)) return drawNature(name);
    if (has(name, ['japan', '日本'])) {
      rect(out, 'white', 200, 280, 600, 400);
      circle(out, 'red', 500, 480, 115);
    } else if (has(name, ['france', '法國'])) {
      rect(out, 'blue', 260, 280, 160, 400);
      rect(out, 'white', 420, 280, 160, 400);
      rect(out, 'red', 580, 280, 160, 400);
    } else if (has(name, ['italy', '義大利'])) {
      rect(out, 'green', 260, 280, 160, 400);
      rect(out, 'white', 420, 280, 160, 400);
      rect(out, 'red', 580, 280, 160, 400);
    } else if (has(name, ['united states', 'usa', '美國'])) {
      rect(out, 'white', 250, 280, 500, 400);
      for (var stripe = 0; stripe < 6; stripe++)
        rect(out, 'red', 250, 280 + stripe * 63, 500, 32);
      rect(out, 'blue', 250, 280, 220, 175);
      for (var st = 0; st < 4; st++)
        star(
          out,
          'white',
          285 + (st % 2) * 75,
          315 + Math.floor(st / 2) * 75,
          22,
          10,
          5,
        );
    } else if (has(name, ['canada', '加拿大'])) {
      rect(out, 'red', 260, 280, 130, 400);
      rect(out, 'red', 610, 280, 130, 400);
      shape(
        out,
        'red',
        500,
        350,
        540,
        430,
        620,
        440,
        555,
        490,
        605,
        570,
        515,
        535,
        500,
        625,
        485,
        535,
        395,
        570,
        445,
        490,
        380,
        440,
        465,
        430,
      );
    } else if (has(name, ['taiwan', '台灣'])) {
      rect(out, 'red', 250, 280, 500, 400);
      rect(out, 'blue', 250, 280, 230, 200);
      star(out, 'white', 365, 380, 80, 35, 12);
    } else {
      rect(out, 'red', 250, 280, 500, 400);
      rect(out, 'white', 250, 415, 500, 135);
      if (has(name, ['china', '中國'])) star(out, 'gold', 350, 375, 58, 26, 5);
      else if (has(name, ['korea', '韓國'])) {
        circle(out, 'red', 500, 480, 82);
        arc(out, 'blue', 500, 480, 82, 0, 180);
      } else star(out, 'gold', 500, 480, 75, 33, 5);
    }
    return out;
  }

  function drawMovie(name) {
    var out = [];
    if (has(name, ['titanic', '鐵達尼'])) {
      path(out, 'dark', 170, 510, 830, 510, 700, 700, 300, 700, 170, 510);
      rect(out, 'white', 390, 310, 220, 200);
      rect(out, 'dark', 465, 210, 70, 100);
      path(out, 'blue', 120, 780, 320, 740, 520, 780, 720, 740, 900, 780);
    } else if (has(name, ['jurassic', '侏羅紀', 'dinosaur', '龍'])) {
      out = drawAnimal('green dinosaur');
      star(out, 'red', 800, 220, 60, 25, 5);
    } else if (has(name, ['star wars', '星際大戰'])) {
      line(out, 'dark', 470, 280, 470, 800);
      line(out, 'red', 530, 280, 530, 800);
      path(out, 'dark', 430, 260, 500, 220, 570, 260);
      star(out, 'gold', 730, 280, 80, 35, 5);
    } else if (has(name, ['harry potter', '哈利波特'])) {
      circle(out, 'skin', 500, 410, 130);
      ellipse(out, 'dark', 445, 410, 44, 35, 0);
      ellipse(out, 'dark', 555, 410, 44, 35, 0);
      path(out, 'dark', 475, 380, 525, 380);
      line(out, 'brown', 650, 580, 850, 230);
      star(out, 'gold', 865, 210, 40, 18, 5);
    } else if (has(name, ['frozen', '冰雪'])) {
      circle(out, 'white', 500, 470, 160);
      circle(out, 'white', 500, 260, 115);
      circle(out, 'dark', 470, 250, 12);
      circle(out, 'dark', 530, 250, 12);
      path(out, 'orange', 500, 285, 570, 300, 500, 320);
      line(out, 'brown', 360, 470, 250, 390);
      line(out, 'brown', 640, 470, 750, 390);
      star(out, 'sky', 760, 250, 55, 24, 6);
    } else if (has(name, ['lion king', '獅子王'])) {
      circle(out, 'gold', 500, 500, 210);
      for (var mane = 0; mane < 8; mane++)
        circle(
          out,
          'orange',
          500 + Math.cos((mane * Math.PI) / 4) * 240,
          500 + Math.sin((mane * Math.PI) / 4) * 240,
          45,
        );
      circle(out, 'white', 445, 470, 45);
      circle(out, 'white', 555, 470, 45);
      circle(out, 'dark', 450, 470, 15);
      circle(out, 'dark', 550, 470, 15);
      path(out, 'brown', 420, 590, 500, 650, 580, 590);
    } else if (has(name, ['finding nemo', '海底總動員', 'nemo'])) {
      ellipse(out, 'orange', 500, 510, 220, 135, 0);
      shape(out, 'white', 370, 385, 430, 400, 410, 630, 350, 620);
      shape(out, 'white', 570, 390, 630, 380, 660, 615, 600, 620);
      circle(out, 'white', 600, 480, 32);
      circle(out, 'dark', 610, 480, 12);
    } else if (has(name, ['spider-man', 'spider man', '蜘蛛人'])) {
      circle(out, 'red', 500, 500, 230);
      for (var web = 0; web < 5; web++) {
        line(out, 'dark', 500, 270, 500, 730);
        line(out, 'dark', 300 + web * 50, 350, 700 - web * 50, 650);
      }
      ellipse(out, 'white', 420, 470, 48, 75, -20);
      ellipse(out, 'white', 580, 470, 48, 75, 20);
    } else if (has(name, ['batman', '蝙蝠俠'])) {
      circle(out, 'dark', 500, 500, 240);
      shape(
        out,
        'dark',
        280,
        420,
        320,
        250,
        440,
        350,
        500,
        320,
        560,
        350,
        680,
        250,
        720,
        420,
      );
      ellipse(out, 'white', 420, 490, 55, 28, 0);
      ellipse(out, 'white', 580, 490, 55, 28, 0);
    } else if (has(name, ['iron man', '鋼鐵人', 'ironman'])) {
      shape(
        out,
        'red',
        300,
        220,
        700,
        220,
        760,
        500,
        650,
        800,
        350,
        800,
        240,
        500,
      );
      path(
        out,
        'gold',
        380,
        300,
        500,
        270,
        620,
        300,
        600,
        520,
        500,
        580,
        400,
        520,
      );
      circle(out, 'sky', 500, 630, 55);
    } else if (has(name, ['pokemon', '寶可夢', '精靈寶可夢'])) {
      circle(out, 'red', 500, 500, 230);
      rect(out, 'white', 275, 490, 450, 50);
      circle(out, 'white', 500, 515, 62);
      circle(out, 'dark', 500, 515, 25);
    } else if (has(name, ['pikachu', '皮卡丘'])) {
      circle(out, 'gold', 500, 520, 210);
      shape(out, 'gold', 335, 400, 300, 125, 420, 350);
      shape(out, 'gold', 665, 400, 700, 125, 580, 350);
      circle(out, 'red', 385, 550, 38);
      circle(out, 'red', 615, 550, 38);
      path(out, 'dark', 470, 600, 500, 620, 530, 600);
    } else if (has(name, ['dragon ball', '七龍珠'])) {
      circle(out, 'orange', 500, 500, 230);
      for (var ballstar = 0; ballstar < 3; ballstar++)
        star(
          out,
          'red',
          390 + ballstar * 100,
          450 + (ballstar % 2) * 100,
          45,
          20,
          5,
        );
    } else if (has(name, ['one piece', '航海王'])) {
      ellipse(out, 'skin', 500, 430, 105, 125, 0);
      ellipse(out, 'red', 500, 280, 150, 38, 0);
      rect(out, 'red', 390, 250, 220, 45);
      path(out, 'dark', 420, 490, 500, 530, 580, 490);
    } else if (has(name, ['kung fu panda', '功夫熊貓'])) {
      drawAnimal('panda');
      path(out, 'brown', 200, 700, 140, 620, 150, 520);
      path(out, 'brown', 800, 700, 860, 620, 850, 520);
    } else if (has(name, ['wall-e', '瓦力', 'transformer', '變形金剛'])) {
      rect(out, 'yellow', 330, 390, 340, 340);
      rect(out, 'dark', 300, 300, 400, 160);
      circle(out, 'blue', 435, 380, 48);
      circle(out, 'blue', 565, 380, 48);
      rect(out, 'dark', 380, 730, 240, 80);
    } else if (has(name, ['toy story', '玩具總動員'])) {
      circle(out, 'skin', 500, 410, 110);
      ellipse(out, 'brown', 500, 260, 160, 42, 0);
      rect(out, 'brown', 430, 260, 140, 70);
      star(out, 'gold', 700, 400, 70, 32, 5);
    } else if (has(name, ['天外奇蹟']) || /\bup\b/.test(name)) {
      rect(out, 'red', 410, 510, 180, 220);
      shape(out, 'cream', 390, 510, 500, 380, 610, 510);
      for (var balloon = 0; balloon < 5; balloon++) {
        circle(
          out,
          ['red', 'gold', 'blue', 'green', 'pink'][balloon],
          360 + balloon * 70,
          190 + (balloon % 2) * 55,
          32,
        );
        line(
          out,
          'brown',
          360 + balloon * 70,
          220 + (balloon % 2) * 55,
          500,
          510,
        );
      }
    } else if (has(name, ['inside out', '腦筋急轉彎'])) {
      for (var mood = 0; mood < 4; mood++) {
        circle(
          out,
          ['yellow', 'blue', 'red', 'green'][mood],
          300 + mood * 135,
          500,
          85,
        );
        circle(out, 'white', 275 + mood * 135, 480, 22);
        circle(out, 'white', 325 + mood * 135, 480, 22);
        circle(out, 'dark', 275 + mood * 135, 480, 9);
        circle(out, 'dark', 325 + mood * 135, 480, 9);
      }
    } else if (has(name, ['monsters inc', '怪獸電力公司'])) {
      circle(out, 'teal', 500, 510, 230);
      circle(out, 'white', 430, 470, 75);
      circle(out, 'white', 570, 470, 75);
      circle(out, 'dark', 430, 470, 28);
      circle(out, 'dark', 570, 470, 28);
      path(out, 'white', 360, 630, 500, 690, 640, 630);
    } else if (has(name, ['zootopia', '動物方城市'])) {
      circle(out, 'gray', 500, 430, 150);
      ellipse(out, 'gray', 425, 230, 52, 180, -10);
      ellipse(out, 'gray', 575, 230, 52, 180, 10);
      circle(out, 'white', 455, 430, 34);
      circle(out, 'white', 545, 430, 34);
      rect(out, 'blue', 370, 590, 260, 200);
    } else if (has(name, ['sailor moon', '美少女戰士'])) {
      circle(out, 'skin', 500, 510, 170);
      shape(out, 'gold', 360, 420, 410, 270, 500, 350, 590, 270, 640, 420);
      circle(out, 'gold', 500, 240, 62);
      circle(out, 'cream', 530, 220, 62);
      circle(out, 'blue', 445, 510, 26);
      circle(out, 'blue', 555, 510, 26);
    } else if (has(name, ['demon slayer', '鬼滅'])) {
      person(out, '');
      rect(out, 'green', 350, 510, 300, 210);
      path(out, 'silver', 660, 520, 830, 250, 870, 270, 700, 550);
      circle(out, 'red', 500, 250, 18);
    } else if (has(name, ['slam dunk', '灌籃高手'])) {
      circle(out, 'orange', 650, 510, 150);
      arc(out, 'brown', 650, 510, 145, 50, 310);
      line(out, 'brown', 500, 510, 800, 510);
      rect(out, 'red', 180, 250, 320, 50);
      line(out, 'dark', 430, 300, 430, 430);
      arc(out, 'red', 430, 460, 80, 0, 180);
    } else if (has(name, ['crayon shin', '蠟筆小新'])) {
      circle(out, 'skin', 500, 500, 210);
      path(out, 'dark', 300, 350, 380, 250, 500, 335, 620, 250, 700, 350);
      ellipse(out, 'dark', 420, 500, 55, 28, 0);
      ellipse(out, 'dark', 580, 500, 55, 28, 0);
      path(out, 'red', 400, 620, 500, 670, 600, 620);
    } else if (has(name, ['infernal affairs', '無間道'])) {
      circle(out, 'dark', 500, 260, 80);
      path(out, 'blue', 380, 350, 620, 350, 700, 820, 300, 820, 380, 350);
      rect(out, 'silver', 420, 415, 160, 90);
      circle(out, 'gold', 500, 460, 32);
      line(out, 'dark', 510, 480, 540, 525);
    } else if (
      has(name, [
        'cars',
        '汽車總動員',
        'fast furious',
        '玩命關頭',
        'top gun',
        '捍衛戰士',
      ])
    ) {
      return drawVehicle('racing car');
    } else if (has(name, ['jaws', '大白鯊', 'shark'])) {
      shape(out, 'blue', 500, 260, 760, 740, 240, 740);
      path(out, 'white', 355, 650, 500, 710, 645, 650);
    } else if (has(name, ['matrix', '駭客任務'])) {
      circle(out, 'dark', 500, 480, 140);
      ellipse(out, 'dark', 400, 470, 95, 40, 0);
      ellipse(out, 'dark', 600, 470, 95, 40, 0);
      for (var rain = 0; rain < 6; rain++)
        line(out, 'green', 250 + rain * 100, 180, 250 + rain * 100, 850);
    } else if (has(name, ['inception', '全面啟動'])) {
      ellipse(out, 'silver', 500, 650, 210, 65, 0);
      shape(out, 'silver', 500, 250, 570, 650, 430, 650);
      circle(out, 'dark', 500, 700, 24);
    } else if (has(name, ['阿凡達', 'avatar'])) {
      circle(out, 'blue', 500, 480, 210);
      ellipse(out, 'dark', 425, 475, 45, 32, 0);
      ellipse(out, 'dark', 575, 475, 45, 32, 0);
      path(out, 'dark', 470, 590, 500, 610, 530, 590);
      ellipse(out, 'green', 330, 350, 46, 160, -20);
      ellipse(out, 'green', 670, 350, 46, 160, 20);
    } else if (
      has(name, ['海底', 'little mermaid', '小美人魚', 'moana', '海洋奇緣'])
    ) {
      ellipse(out, 'skin', 500, 300, 115, 135, 0);
      path(out, 'purple', 500, 420, 350, 650, 500, 850, 650, 650, 500, 420);
    } else if (has(name, ['totoro', '龍貓'])) {
      ellipse(out, 'gray', 500, 510, 260, 300, 0);
      circle(out, 'white', 420, 300, 45);
      circle(out, 'white', 580, 300, 45);
      circle(out, 'dark', 420, 300, 15);
      circle(out, 'dark', 580, 300, 15);
      ellipse(out, 'white', 500, 600, 160, 105, 0);
    } else if (
      has(name, [
        'mulan',
        '花木蘭',
        '阿拉丁',
        'aladdin',
        'beauty',
        '美女與野獸',
        'cinderella',
        '灰姑娘',
        'snow white',
        '白雪公主',
        '睡美人',
      ])
    ) {
      person(out, 'hat');
      if (has(name, ['aladdin', '阿拉丁'])) {
        ellipse(out, 'gold', 740, 730, 100, 45, 0);
        path(out, 'gold', 810, 705, 850, 630, 890, 700);
      } else {
        star(out, 'gold', 500, 140, 80, 35, 5);
      }
    } else if (has(name, ['柯南', 'conan'])) {
      circle(out, 'skin', 500, 380, 135);
      ellipse(out, 'dark', 430, 380, 55, 42, 0);
      ellipse(out, 'dark', 570, 380, 55, 42, 0);
      circle(out, 'dark', 430, 380, 12);
      circle(out, 'dark', 570, 380, 12);
      path(out, 'dark', 360, 250, 440, 180, 490, 240, 560, 170, 650, 250);
      circle(out, 'blue', 760, 700, 100);
    } else if (has(name, ['火影', 'naruto'])) {
      person(out, '');
      rect(out, 'silver', 410, 155, 180, 55);
      spiral(out, 'blue', 500, 185);
    } else {
      person(out, '');
      rect(out, 'dark', 250, 170, 500, 65);
      rect(out, 'dark', 220, 220, 45, 140);
      rect(out, 'dark', 735, 220, 45, 140);
      line(out, 'gold', 150, 850, 850, 850);
    }
    return out;
  }

  function spiral(out, color, x, y) {
    path(
      out,
      color,
      x,
      y,
      x + 42,
      y - 12,
      x + 52,
      y + 25,
      x + 20,
      y + 42,
      x - 12,
      y + 22,
      x - 2,
      y - 5,
      x + 30,
      y - 8,
    );
  }

  function drawTrend(name) {
    var out = [];
    if (has(name, ['phone', 'mobile', '手機', '手錶', '智慧手錶', '折疊'])) {
      rect(out, 'dark', 370, 180, 260, 650);
      rect(out, 'sky', 395, 235, 210, 520);
      circle(out, 'silver', 500, 790, 22);
      circle(out, 'red', 500, 410, 65);
    } else if (has(name, ['drone', '無人機'])) {
      rect(out, 'silver', 430, 420, 140, 100);
      for (var rotor = 0; rotor < 4; rotor++) {
        var x = rotor % 2 ? 660 : 340,
          y = rotor < 2 ? 350 : 590;
        line(out, 'dark', 500, 470, x, y);
        ellipse(out, 'dark', x, y, 100, 20, 0);
      }
    } else if (has(name, ['solar', '太陽能'])) {
      rect(out, 'blue', 250, 350, 500, 330);
      for (var grid = 0; grid < 4; grid++) {
        line(out, 'white', 250 + grid * 125, 350, 250 + grid * 125, 680);
        line(out, 'white', 250, 350 + grid * 82, 750, 350 + grid * 82);
      }
      circle(out, 'gold', 500, 230, 70);
      rays(out, 'gold', 500, 230, 95, 135, 8, 0);
    } else if (has(name, ['wind power', '風力發電'])) {
      line(out, 'silver', 500, 430, 500, 850);
      circle(out, 'silver', 500, 430, 24);
      line(out, 'white', 500, 430, 500, 140);
      line(out, 'white', 500, 430, 250, 560);
      line(out, 'white', 500, 430, 750, 560);
    } else if (has(name, ['virtual reality', 'vr', '元宇宙', '虛擬實境'])) {
      path(
        out,
        'dark',
        280,
        360,
        400,
        300,
        600,
        300,
        720,
        360,
        700,
        590,
        560,
        600,
        500,
        520,
        440,
        600,
        300,
        590,
        280,
        360,
      );
      circle(out, 'sky', 400, 470, 65);
      circle(out, 'sky', 600, 470, 65);
      line(out, 'silver', 455, 470, 545, 470);
    } else if (has(name, ['robot', '人工智慧', '聊天機器人', '語音助理'])) {
      rect(out, 'silver', 330, 260, 340, 380);
      circle(out, 'blue', 430, 420, 46);
      circle(out, 'blue', 570, 420, 46);
      path(out, 'dark', 425, 545, 500, 585, 575, 545);
      line(out, 'silver', 500, 260, 500, 180);
      circle(out, 'red', 500, 160, 28);
    } else if (has(name, ['e-invoice', '電子發票'])) {
      rect(out, 'white', 330, 220, 340, 600);
      line(out, 'dark', 400, 340, 600, 340);
      line(out, 'dark', 400, 410, 600, 410);
      for (var qr = 0; qr < 4; qr++)
        rect(
          out,
          'dark',
          410 + (qr % 2) * 70,
          500 + Math.floor(qr / 2) * 70,
          55,
          55,
        );
    } else if (has(name, ['car', 'vehicle', '自動駕駛', '機車']))
      return drawVehicle('car');
    else if (has(name, ['cup', '環保杯'])) {
      rect(out, 'teal', 370, 300, 260, 500);
      path(out, 'silver', 370, 300, 420, 220, 580, 220, 630, 300);
      rect(out, 'dark', 420, 400, 160, 50);
    } else if (has(name, ['wind', '風力'])) return drawTrend('wind power');
    else if (has(name, ['pandemic', 'vaccine', '快篩', '疫苗'])) {
      rect(out, 'white', 280, 330, 440, 330);
      line(out, 'red', 500, 390, 500, 600);
      line(out, 'red', 410, 500, 590, 500);
      rect(out, 'blue', 430, 660, 140, 140);
    } else if (has(name, ['recycl', '資源回收']))
      return drawClue(name, 'civics');
    else if (has(name, ['concert', '演唱會', '直播', 'video', '影音'])) {
      rect(out, 'dark', 250, 250, 500, 380);
      rect(out, 'purple', 280, 280, 440, 320);
      star(out, 'gold', 500, 420, 100, 45, 5);
      for (var light = 0; light < 4; light++)
        rays(out, 'gold', 280 + light * 145, 180, 45, 85, 6, -90);
      line(out, 'brown', 350, 630, 300, 850);
      line(out, 'brown', 650, 630, 700, 850);
    } else if (has(name, ['payment', 'wallet', '支付'])) {
      rect(out, 'teal', 250, 350, 500, 340);
      rect(out, 'white', 570, 440, 180, 110);
      circle(out, 'gold', 350, 500, 58);
    } else if (has(name, ['online shopping', '網購', '外送', 'delivery'])) {
      rect(out, 'brown', 320, 380, 360, 380);
      path(out, 'brown', 400, 380, 430, 280, 570, 280, 600, 380);
      star(out, 'gold', 500, 540, 110, 50, 5);
    } else if (has(name, ['wind', '風'])) return drawTrend('wind power');
    else {
      rect(out, 'silver', 280, 300, 440, 360);
      circle(out, 'sky', 500, 480, 110);
      rect(out, 'dark', 420, 660, 160, 80);
    }
    return out;
  }

  function drawHistory(name) {
    var out = [];
    if (has(name, ['great wall', '長城'])) {
      path(out, 'brown', 120, 660, 300, 530, 470, 620, 620, 470, 880, 610);
      path(out, 'cream', 120, 610, 880, 560, 880, 700, 120, 760);
      for (var tower = 0; tower < 4; tower++)
        rect(out, 'brown', 175 + tower * 200, 500 - (tower % 2) * 45, 90, 165);
    } else if (has(name, ['terracotta', '兵馬俑'])) {
      person(out, 'hat');
      rect(out, 'brown', 380, 100, 240, 65);
      line(out, 'dark', 500, 385, 500, 800);
    } else if (has(name, ['pyramid', '金字塔'])) {
      shape(out, 'gold', 130, 820, 500, 230, 870, 820);
      path(out, 'brown', 500, 230, 500, 820, 870, 820);
      line(out, 'cream', 500, 390, 680, 700);
    } else if (has(name, ['sphinx', '人面獅身'])) {
      ellipse(out, 'gold', 500, 680, 300, 85, 0);
      circle(out, 'gold', 690, 510, 105);
      path(out, 'gold', 470, 650, 580, 520, 750, 640);
      rect(out, 'cream', 650, 395, 100, 55);
    } else if (has(name, ['colosseum', '羅馬競技場'])) {
      ellipse(out, 'cream', 500, 430, 330, 140, 0);
      ellipse(out, 'brown', 500, 430, 190, 70, 0);
      path(out, 'cream', 170, 430, 190, 780, 810, 780, 830, 430);
      for (var arch = 0; arch < 6; arch++)
        arc(out, 'brown', 230 + arch * 105, 700, 43, 180, 360);
    } else if (has(name, ['leaning tower', '比薩斜塔'])) {
      path(out, 'cream', 360, 820, 470, 200, 700, 240, 620, 820, 360, 820);
      for (var floor = 0; floor < 5; floor++) {
        line(
          out,
          'brown',
          380 + floor * 7,
          330 + floor * 90,
          680 - floor * 10,
          365 + floor * 85,
        );
        arc(out, 'brown', 520, 390 + floor * 85, 50, 180, 360);
      }
    } else if (has(name, ['stonehenge', '巨石陣'])) {
      for (var stone = 0; stone < 4; stone++)
        rect(out, 'gray', 230 + stone * 150, 460 + (stone % 2) * 90, 90, 350);
      for (var top = 0; top < 3; top++)
        rect(out, 'gray', 200 + top * 200, 410, 150, 80);
    } else if (has(name, ['easter island', '復活節島'])) {
      for (var head = 0; head < 3; head++) {
        rect(out, 'gray', 230 + head * 240, 390, 150, 360);
        rect(out, 'gray', 210 + head * 240, 350, 190, 90);
      }
      line(out, 'green', 120, 800, 880, 800);
    } else if (has(name, ['taj mahal', '泰姬'])) {
      rect(out, 'white', 300, 450, 400, 350);
      shape(out, 'white', 240, 470, 500, 230, 760, 470);
      circle(out, 'white', 500, 300, 95);
      for (var min = 0; min < 4; min++)
        rect(out, 'cream', 250 + min * 165, 380, 38, 420);
    } else if (has(name, ['forbidden city', '紫禁城'])) {
      rect(out, 'red', 250, 430, 500, 350);
      shape(out, 'gold', 180, 440, 500, 270, 820, 440);
      rect(out, 'gold', 450, 600, 100, 180);
    } else if (has(name, ['steam engine', '蒸汽機'])) {
      rect(out, 'dark', 280, 500, 390, 190);
      circle(out, 'dark', 360, 710, 75);
      circle(out, 'dark', 640, 710, 75);
      rect(out, 'red', 340, 340, 140, 160);
      path(out, 'silver', 430, 310, 400, 220, 450, 150);
    } else if (has(name, ['printing', '活字印刷'])) {
      rect(out, 'brown', 310, 280, 380, 470);
      rect(out, 'cream', 360, 390, 280, 250);
      for (var type = 0; type < 3; type++)
        rect(out, 'gold', 395 + type * 75, 450, 55, 65);
      line(out, 'brown', 500, 280, 500, 170);
    } else if (has(name, ['paper', '造紙'])) {
      rect(out, 'cream', 300, 250, 400, 520);
      line(out, 'brown', 380, 390, 620, 390);
      line(out, 'brown', 380, 480, 620, 480);
      line(out, 'brown', 380, 570, 570, 570);
    } else if (
      has(name, [
        'silk road',
        '絲路',
        '馬可波羅',
        '哥倫布',
        '麥哲倫',
        '鄭和',
        '張騫',
      ])
    ) {
      path(out, 'gold', 120, 780, 300, 620, 450, 690, 600, 520, 850, 600);
      circle(out, 'brown', 500, 420, 60);
      ellipse(out, 'brown', 500, 580, 145, 90, 0);
      line(out, 'brown', 420, 600, 400, 770);
      line(out, 'brown', 580, 600, 600, 770);
      line(out, 'blue', 150, 820, 850, 820);
    } else if (has(name, ['canal', '大運河'])) {
      path(out, 'blue', 150, 650, 850, 650, 750, 800, 250, 800, 150, 650);
      shape(out, 'brown', 380, 620, 430, 500, 570, 500, 620, 620);
      path(out, 'red', 150, 750, 850, 750);
    } else {
      person(out, 'hat');
      if (
        has(name, [
          'picasso',
          '梵谷',
          'davinci',
          '畢卡索',
          '梵谷',
          '達文西',
          '王羲之',
          '蘇東坡',
          '李白',
          '杜甫',
        ])
      ) {
        line(out, 'brown', 720, 500, 850, 280);
        ellipse(out, 'gold', 800, 300, 48, 68, 20);
        rect(out, 'gold', 690, 610, 200, 120);
      }
      if (has(name, ['mozart', 'beethoven', '莫札特', '貝多芬'])) {
        path(out, 'white', 420, 210, 500, 160, 580, 210);
        star(out, 'gold', 700, 280, 55, 25, 5);
      }
      if (
        has(name, [
          'einstein',
          'newton',
          'edison',
          'curie',
          '愛因斯坦',
          '牛頓',
          '愛迪生',
          '居禮',
        ])
      ) {
        ellipse(out, 'dark', 455, 255, 38, 30, 0);
        ellipse(out, 'dark', 545, 255, 38, 30, 0);
        line(out, 'dark', 493, 255, 507, 255);
        circle(out, 'gold', 790, 350, 65);
        rays(out, 'blue', 790, 350, 85, 120, 7, 0);
      }
      if (has(name, ['孔子', '老子', '孟子', '莊子', '司馬遷', '孫子'])) {
        path(out, 'white', 390, 270, 500, 320, 610, 270);
        rect(out, 'brown', 390, 120, 220, 55);
      }
      if (
        has(name, [
          '華盛頓',
          '林肯',
          '拿破崙',
          '秦始皇',
          '武則天',
          '成吉思汗',
          '孫中山',
        ])
      ) {
        ellipse(out, 'gold', 500, 155, 150, 45, 0);
      }
    }
    return out;
  }

  function drawAction(name) {
    var out = [];
    circle(out, 'skin', 500, 240, 82);
    line(out, 'dark', 500, 325, 500, 610);
    if (has(name, ['run', '跑', '追', '逃'])) {
      path(out, 'skin', 500, 400, 650, 350, 760, 390);
      path(out, 'skin', 500, 430, 350, 500, 260, 460);
      line(out, 'dark', 500, 610, 660, 760);
      line(out, 'dark', 660, 760, 800, 760);
      line(out, 'dark', 500, 610, 350, 740);
      line(out, 'dark', 350, 740, 230, 700);
      path(out, 'gold', 180, 330, 280, 330, 340, 365);
      path(out, 'gold', 700, 260, 800, 260, 855, 295);
    } else if (has(name, ['jump', 'hop', '跳', '蹦'])) {
      line(out, 'skin', 500, 400, 300, 260);
      line(out, 'skin', 500, 400, 700, 260);
      line(out, 'dark', 500, 610, 350, 450);
      line(out, 'dark', 500, 610, 650, 450);
      rays(out, 'gold', 500, 160, 115, 170, 8, -90);
    } else if (has(name, ['wave', '揮手'])) {
      line(out, 'skin', 500, 410, 360, 550);
      path(out, 'skin', 500, 410, 640, 300, 690, 150);
      circle(out, 'skin', 690, 140, 32);
      line(out, 'dark', 500, 610, 400, 850);
      line(out, 'dark', 500, 610, 600, 850);
      for (var wave = 0; wave < 3; wave++)
        arc(out, 'gold', 740, 150, 52 + wave * 28, 290, 70);
    } else if (has(name, ['dance', '跳舞', '舞'])) {
      line(out, 'skin', 500, 420, 300, 270);
      line(out, 'skin', 500, 420, 710, 300);
      line(out, 'dark', 500, 610, 350, 790);
      line(out, 'dark', 500, 610, 690, 760);
      star(out, 'gold', 250, 180, 45, 20, 5);
      star(out, 'pink', 760, 200, 45, 20, 5);
    } else if (has(name, ['swim', '游泳', '潛水'])) {
      line(out, 'skin', 470, 420, 300, 500);
      line(out, 'skin', 520, 420, 700, 480);
      line(out, 'dark', 500, 430, 500, 680);
      line(out, 'dark', 500, 680, 690, 680);
      line(out, 'dark', 500, 680, 320, 680);
      path(out, 'blue', 130, 760, 300, 720, 470, 760, 640, 720, 850, 760);
      path(out, 'blue', 130, 840, 300, 800, 470, 840, 640, 800, 850, 840);
    } else if (has(name, ['read', '閱讀', '看書'])) {
      line(out, 'skin', 500, 410, 380, 530);
      line(out, 'skin', 500, 410, 620, 530);
      rect(out, 'cream', 330, 500, 170, 175);
      rect(out, 'cream', 500, 500, 170, 175);
      line(out, 'brown', 500, 500, 500, 675);
      line(out, 'dark', 500, 610, 410, 850);
      line(out, 'dark', 500, 610, 590, 850);
    } else if (has(name, ['eat', 'drink', '吃', '喝'])) {
      line(out, 'skin', 500, 410, 370, 500);
      line(out, 'skin', 500, 410, 640, 380);
      ellipse(out, 'cream', 700, 370, 80, 105, 0);
      ellipse(out, 'gold', 770, 650, 135, 60, 0);
      circle(out, 'red', 750, 630, 24);
      line(out, 'dark', 500, 610, 410, 850);
      line(out, 'dark', 500, 610, 590, 850);
    } else if (has(name, ['sleep', 'rest', '睡', '休息'])) {
      line(out, 'skin', 500, 420, 650, 450);
      line(out, 'skin', 500, 420, 610, 550);
      path(out, 'blue', 270, 600, 730, 600, 810, 720, 210, 720, 270, 600);
      path(out, 'white', 320, 560, 500, 560, 520, 630, 320, 630);
      path(out, 'sky', 680, 280, 740, 220, 800, 280, 860, 220);
    } else if (has(name, ['throw', '射', '投', '丟', '拋'])) {
      line(out, 'skin', 500, 410, 350, 280);
      line(out, 'skin', 500, 410, 670, 260);
      line(out, 'dark', 500, 610, 390, 850);
      line(out, 'dark', 500, 610, 660, 850);
      circle(out, 'red', 820, 180, 45);
      path(out, 'gold', 700, 150, 780, 130, 810, 150);
    } else if (has(name, ['kick', '踢'])) {
      line(out, 'skin', 500, 410, 350, 500);
      line(out, 'skin', 500, 410, 650, 500);
      line(out, 'dark', 500, 610, 400, 840);
      line(out, 'dark', 500, 610, 720, 660);
      circle(out, 'blue', 850, 650, 65);
    } else {
      line(out, 'skin', 500, 410, 340, 530);
      line(out, 'skin', 500, 410, 660, 530);
      line(out, 'dark', 500, 610, 410, 850);
      line(out, 'dark', 500, 610, 590, 850);
      rays(out, 'gold', 780, 230, 25, 70, 6, 0);
    }
    return out;
  }

  function drawClue(name, category) {
    var out = [];
    if (category === 'fun') return drawFun(name);
    if (category === 'music') return drawMusic(name);
    if (category === 'festival') return drawFestival(name);
    if (category === 'movie') return drawMovie(name);
    if (category === 'trend') return drawTrend(name);
    if (category === 'astro' || category === 'physics' || category === 'civics')
      return drawScience(name, category);
    if (category === 'history') return drawHistory(name);
    if (category === 'body') return drawBody(name);
    if (category === 'action') return drawAction(name);
    if (category === 'emotion') {
      var mood = has(name, [
        'sad',
        '哭',
        '傷心',
        '沮喪',
        '失望',
        '難過',
        '委屈',
      ])
        ? 'sad'
        : has(name, ['angry', 'mad', '生氣', '憤怒', '煩惱', '嫉妒'])
          ? 'angry'
          : has(name, ['fear', 'scared', '害怕', '緊張', '焦慮'])
            ? 'worried'
            : has(name, ['surprise', '驚訝', '驚喜'])
              ? 'surprised'
              : has(name, [
                    'happy',
                    'joy',
                    '開心',
                    '幸福',
                    '甜蜜',
                    '滿足',
                    '雀躍',
                    '興奮',
                  ])
                ? 'happy'
                : 'happy';
      face(out, mood);
      if (has(name, ['sad', '哭', '傷心', '難過', '沮喪'])) {
        path(out, 'sky', 610, 500, 635, 570, 620, 620);
        circle(out, 'sky', 620, 640, 12);
      }
      if (has(name, ['love', '心動', '甜蜜', '幸福'])) {
        star(out, 'pink', 780, 250, 65, 30, 5);
      }
      if (has(name, ['bored', '無聊', 'tired', '疲倦'])) {
        path(out, 'silver', 395, 670, 500, 700, 605, 670);
      }
      return out;
    }
    if (category === 'expression') {
      var expressionMood = has(name, ['哭', '嘆氣', '沮喪'])
        ? 'sad'
        : has(name, ['驚', '大叫', '打噴嚏', '打哈欠'])
          ? 'surprised'
          : has(name, ['皺眉', '瞪眼', '怒'])
            ? 'angry'
            : 'happy';
      face(out, expressionMood);
      if (has(name, ['wink', '眨眼'])) line(out, 'dark', 560, 420, 630, 420);
      if (
        has(name, ['手', '揮', '抱', '擊掌', '鼓掌', '握手', '敬禮', '剪刀手'])
      ) {
        line(out, 'skin', 680, 550, 830, 350);
        circle(out, 'skin', 835, 330, 35);
      }
      if (has(name, ['heart', '比心', '飛吻'])) {
        path(
          out,
          'red',
          700,
          260,
          650,
          210,
          600,
          260,
          700,
          350,
          800,
          260,
          750,
          210,
          700,
          260,
        );
      }
      if (has(name, ['哈欠', '打噴嚏', '咳嗽', '吹口哨']))
        path(out, 'sky', 700, 490, 810, 460, 870, 500);
      return out;
    }
    if (
      category === 'job' ||
      category === 'people' ||
      category === 'history' ||
      category === 'star'
    ) {
      person(out, '');
      if (category === 'star') {
        circle(out, 'dark', 770, 470, 76);
        path(out, 'dark', 815, 430, 900, 430, 900, 560);
        ellipse(out, 'purple', 500, 865, 290, 45, 0);
        for (var beam = 0; beam < 3; beam++)
          rays(out, 'gold', 220 + beam * 280, 180, 30, 80, 5, -90);
      }
      if (has(name, ['doctor', '醫生', 'nurse', '護士', 'vet', '獸醫'])) {
        line(out, 'white', 500, 500, 500, 630);
        line(out, 'white', 435, 565, 565, 565);
      }
      if (has(name, ['teacher', '老師', '教授'])) {
        rect(out, 'green', 690, 420, 230, 160);
        path(out, 'white', 750, 490, 810, 490, 780, 530);
      }
      if (has(name, ['police', '警察', '消防', 'firefighter'])) {
        rect(out, 'dark', 420, 125, 160, 35);
        star(out, 'gold', 500, 135, 35, 17, 5);
      }
      if (has(name, ['chef', '廚師'])) {
        ellipse(out, 'white', 500, 120, 130, 70, 0);
        rect(out, 'white', 415, 120, 170, 55);
      }
      if (has(name, ['artist', '畫家'])) {
        line(out, 'brown', 740, 520, 840, 330);
        ellipse(out, 'gold', 810, 305, 45, 60, 20);
      }
      if (has(name, ['astronaut', '太空人'])) {
        ellipse(out, 'sky', 500, 250, 145, 125, 0);
        rect(out, 'white', 420, 465, 160, 190);
      }
      if (has(name, ['bride', '新娘'])) {
        path(out, 'white', 380, 485, 500, 900, 620, 485);
        circle(out, 'white', 500, 105, 90);
      }
      if (has(name, ['baby', '嬰兒'])) {
        circle(out, 'pink', 500, 250, 120);
        rect(out, 'white', 370, 390, 260, 300);
      }
      if (has(name, ['old', '老人', '爺爺', '奶奶', '外公', '外婆'])) {
        path(out, 'white', 410, 290, 500, 325, 590, 290);
      }
      if (has(name, ['twin', '雙胞胎'])) {
        circle(out, 'skin', 260, 245, 80);
        circle(out, 'skin', 740, 245, 80);
      }
      return out;
    }
    if (category === 'action') {
      person(out, '');
      if (has(name, ['run', '跑', '追'])) {
        path(out, 'blue', 650, 510, 800, 430, 890, 450);
        line(out, 'skin', 600, 610, 800, 750);
        line(out, 'dark', 440, 850, 250, 930);
        line(out, 'dark', 570, 850, 760, 940);
      }
      if (has(name, ['jump', '跳', '蹦'])) {
        line(out, 'dark', 440, 850, 300, 980);
        line(out, 'dark', 570, 850, 710, 980);
        rays(out, 'gold', 500, 230, 180, 225, 6, -90);
      }
      if (has(name, ['sleep', '睡', '休息'])) {
        path(out, 'sky', 690, 300, 760, 230, 830, 300, 900, 220);
      }
      if (has(name, ['swim', '游泳'])) {
        path(out, 'blue', 100, 810, 300, 760, 500, 810, 700, 760, 900, 810);
      }
      if (has(name, ['eat', '吃', '喝'])) {
        ellipse(out, 'cream', 760, 670, 120, 70, 0);
        path(out, 'gold', 730, 650, 790, 650, 760, 690);
      }
      if (has(name, ['read', '閱讀', '看書'])) {
        rect(out, 'cream', 670, 500, 190, 180);
        line(out, 'brown', 765, 510, 765, 670);
      }
      if (has(name, ['sing', '唱歌'])) {
        ellipse(out, 'dark', 760, 320, 55, 72, 0);
        path(out, 'dark', 800, 280, 870, 280, 870, 430);
      }
      return out;
    }
    if (category === 'fantasy') {
      if (has(name, ['dragon', '龍'])) {
        path(
          out,
          'green',
          200,
          690,
          280,
          450,
          450,
          590,
          590,
          450,
          760,
          610,
          850,
          420,
        );
        shape(out, 'green', 700, 450, 750, 300, 850, 420);
        rays(out, 'red', 840, 470, 35, 100, 5, 0);
        circle(out, 'gold', 850, 400, 15);
      } else if (has(name, ['unicorn', '獨角獸'])) {
        ellipse(out, 'white', 470, 540, 210, 150, 0);
        circle(out, 'white', 670, 430, 95);
        shape(out, 'gold', 670, 345, 700, 180, 730, 355);
        path(out, 'pink', 560, 450, 610, 390, 660, 440);
      } else if (has(name, ['witch', '巫婆', '女巫'])) {
        person(out, '');
        shape(out, 'purple', 310, 180, 500, 30, 690, 180);
        ellipse(out, 'purple', 500, 180, 200, 28, 0);
        line(out, 'brown', 730, 550, 780, 880);
        star(out, 'gold', 780, 500, 48, 20, 5);
      } else if (has(name, ['mermaid', '美人魚'])) {
        circle(out, 'skin', 500, 250, 100);
        ellipse(out, 'orange', 500, 450, 180, 120, 0);
        path(out, 'teal', 500, 560, 390, 750, 500, 880, 610, 750, 500, 560);
        shape(out, 'teal', 500, 835, 380, 950, 500, 900, 620, 950);
      } else {
        person(out, 'hat');
        star(out, 'purple', 740, 260, 95, 45, 5);
        star(out, 'gold', 260, 350, 65, 30, 5);
      }
      return out;
    }
    // Abstract topics use a small visual analogy instead of a reused animal icon.
    circle(out, 'gold', 500, 480, 145);
    rays(out, 'orange', 500, 480, 205, 285, 8, -90);
    return out;
  }

  function drawWord(word) {
    var name = combined(word);
    if (word.cat === 'animal') return drawAnimal(name);
    if (word.cat === 'food') return drawFood(name);
    if (word.cat === 'home') return drawHome(name);
    if (word.cat === 'clothes') return drawClothes(name);
    if (word.cat === 'vehicle') return drawVehicle(name);
    if (word.cat === 'nature') return drawNature(name);
    if (word.cat === 'geography' || word.cat === 'taiwan')
      return drawGeography(name, word.cat);
    if (word.cat === 'phenomenon') return drawPhenomenon(name);
    if (word.cat === 'place') return drawPlace(name);
    return drawClue(name, word.cat);
  }

  Words.all().forEach(function (word) {
    if (
      !word.id ||
      word.id.indexOf('w-') !== 0 ||
      word.cat === 'idiom' ||
      completed[word.id]
    )
      return;
    recipes[word.id] = drawWord(word);
  });

  Object.defineProperty(recipes, 'completedIds', {
    value: Object.keys(completed),
  });
  return recipes;
});
