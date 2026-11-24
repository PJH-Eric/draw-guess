(function (root) {
  'use strict';
  var R = root.ReferenceRecipes || require('../reference-recipes.js');
  var K = root.ReferenceKit || require('../reference-kit.js');
  var Q0 = K.Q;
  function isLayer(x) {
    return typeof x[0] === 'string' && typeof x[1] === 'string' && (x[0] === 'none' || x[0].charAt(0) === '#') &&
      x.length <= 3 && (x[2] === undefined || (typeof x[2] === 'object' && !Array.isArray(x[2])));
  }
  function flat(x) {
    if (typeof x === 'string') return [x];
    if (isLayer(x)) return [x];
    var o = [], j;
    for (j = 0; j < x.length; j++) o = o.concat(flat(x[j]));
    return o;
  }
  function Q(list) { return Q0(flat(list)); }
  function P(v) { return Math.round(v); }
  function e(c, x, y, rx, ry, fl, rot) {
    return c + '|E' + P(x) + ' ' + P(y) + ' ' + P(rx) + ' ' + P(ry) + (rot ? ' ' + P(rot) : '') + (fl ? '|' + fl : '');
  }
  function r(c, x, y, w, h, rad, fl) {
    return c + '|R' + P(x) + ' ' + P(y) + ' ' + P(w) + ' ' + P(h) + (rad ? ' ' + P(rad) : '') + (fl ? '|' + fl : '');
  }
  function p(c, d, fl) { return c + '|' + d + (fl ? '|' + fl : ''); }
  function ln(c, w, d) { return '-' + c + w + '|' + d; }
  function tb(d, w, c) { return [ln('k', w + 14, d), ln(c, w, d)]; }
  function pp(a) {
    var s = '', i;
    for (i = 0; i < a.length; i++) s += (i ? 'L' : 'M') + P(a[i][0]) + ' ' + P(a[i][1]);
    return s;
  }
  function G(x, y, h, o) { return K.guy(x, y, h, o); }
  function star(cx, cy, r1, r2, n, rot, fill) {
    var d = '', i, a, rr;
    for (i = 0; i < n * 2; i++) {
      a = (rot + i * 180 / n) * Math.PI / 180; rr = i % 2 ? r2 : r1;
      d += (i ? 'L' : 'M') + P(cx + rr * Math.cos(a)) + ' ' + P(cy + rr * Math.sin(a));
    }
    return fill + '|' + d + 'Z';
  }
  function drop(x, y, s, c) {
    return p(c || 's', 'M' + P(x) + ' ' + P(y) + 'C' + P(x - 30 * s) + ' ' + P(y + 50 * s) + ' ' + P(x - 35 * s) + ' ' + P(y + 90 * s) + ' ' + P(x) + ' ' + P(y + 100 * s) +
      'C' + P(x + 35 * s) + ' ' + P(y + 90 * s) + ' ' + P(x + 30 * s) + ' ' + P(y + 50 * s) + ' ' + P(x) + ' ' + P(y) + 'Z');
  }
  function eyes(x, y, rr) {
    return [e('k', x - rr * 0.4, y, rr * 0.1, rr * 0.13, 'n'), e('k', x + rr * 0.4, y, rr * 0.1, rr * 0.13, 'n')];
  }
  function smile(x, y, rr) { return ln('k', 7, 'M' + P(x - rr * 0.3) + ' ' + P(y) + 'Q' + P(x) + ' ' + P(y + rr * 0.35) + ' ' + P(x + rr * 0.3) + ' ' + P(y)); }
  function ctrl(x, y, s) {
    function q(v) { return P(v * s); }
    return [tb('M' + (x + q(200)) + ' ' + y + 'L' + (x + q(240)) + ' ' + (y - q(150)), 14, 'v'),
      r('v', x, y, q(280), q(170), q(40)),
      e('k', x + q(70), y + q(85), q(36), q(36)), e('r', x + q(70), y + q(85), q(18), q(18), 'n'),
      e('k', x + q(210), y + q(85), q(36), q(36)), e('r', x + q(210), y + q(85), q(18), q(18), 'n'),
      r('y', x + q(110), y + q(25), q(60), q(30), q(8))];
  }
  function shirt(base, deco) {
    var body = 'M360 170L440 140Q500 220 560 140L640 170L840 330L760 440L690 380L690 860L310 860L310 380L240 440L160 330Z';
    return [p(base, body, 'b'), deco,
      p('w', 'M440 140L500 270L400 250L390 175Z'), p('w', 'M560 140L500 270L600 250L610 175Z'),
      ln('k', 7, 'M500 270L500 860'), e('k', 530, 380, 12, 12, 'n'), e('k', 530, 520, 12, 12, 'n'), e('k', 530, 660, 12, 12, 'n')];
  }
  function spiral(cx, cy, r0, r1, turns) {
    var d = '', i, N = 40, a, rr;
    for (i = 0; i <= N; i++) {
      a = i * turns * 2 * Math.PI / N; rr = r0 + (r1 - r0) * i / N;
      d += (i ? 'L' : 'M') + P(cx + rr * Math.cos(a)) + ' ' + P(cy + rr * Math.sin(a));
    }
    return d;
  }
  var i, j, k2;
  var dots = [], pat = [[1,1,1,0,1,0,1,1,1,0,1,1,0,1,1,1],[1,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0],[1,1,1,0,1,0,1,1,0,0,1,1,0,1,1,1],[0,0,1,0,1,0,1,0,0,0,1,0,1,0,0,1],[1,1,1,0,1,1,1,1,1,0,1,0,1,0,1,1]];
  for (i = 0; i < pat.length; i++) for (j = 0; j < 16; j++) {
    dots.push(e(pat[i][j] ? 'r' : 'b', 180 + j * 40, 290 + i * 46, 14, 14, 'n'));
  }
  var arrow = [];
  var dog = [tb('M205 560Q130 480 170 400', 34, 'o'),
    r('o', 250, 660, 52, 220, 20), r('o', 340, 680, 52, 200, 20), r('o', 500, 680, 52, 200, 20), r('o', 580, 660, 52, 220, 20),
    e('o', 420, 600, 220, 115), r('n', 250, 860, 52, 24, 10, 'n'),
    e('o', 640, 450, 105, 92), p('n', 'M575 380L545 500L615 460Z'),
    p('r', 'M710 465L870 400L850 535L730 520Z'),
    p('o', 'M700 410Q790 360 880 395L720 470Z'), p('o', 'M720 490L860 530Q820 575 735 545Z'),
    e('p', 810, 510, 26, 16, 'n'), e('k', 880, 395, 20, 16, 'n'), e('k', 685, 415, 12, 12, 'n'),
    ln('k', 7, 'M540 600Q560 680 560 760')];
  var rugS = [];
  for (i = 0; i < 4; i++) rugS.push(r('y', 600, 250 + i * 85, 280, 28, 0, 'i'));
  var fringe = [];
  for (i = 0; i < 8; i++) fringe.push(ln('k', 7, 'M' + (640 + i * 30) + ' 560L' + (640 + i * 30) + ' 600'));
  var sp1 = spiral(471, 336, 3, 18, 2.5), sp2 = spiral(529, 336, 3, 18, 2.5);

  Object.assign(R, K.N({
    '看流星': Q(['@bg b', star(120, 520, 26, 9, 4, 45, 'y'), star(850, 200, 30, 10, 4, 45, 'y'), star(600, 120, 22, 8, 4, 45, 'y'), star(180, 330, 20, 7, 4, 45, 'y'),
      p('w', 'M300 300L60 80L110 190L170 260Z'), ln('y', 16, 'M300 300L120 120'), ln('y', 16, 'M280 330L100 250'),
      e('y', 320, 320, 46, 46), e('w', 320, 320, 24, 24, 'n'),
      '@gr g 800', p('m', 'M-40 800Q300 700 700 800L-40 800Z'),
      G(650, 880, 520, { shirt: 'o', pants: 'b', hair: 'k', aR: [-0.08, -0.38] }), e('y', 590, 590, 20, 20)]),

    '寫生': Q(['@gr m 820', tb('M540 540L440 840', 18, 'n'), tb('M660 540L760 840', 18, 'n'), tb('M600 540L600 840', 18, 'n'),
      r('n', 470, 190, 260, 20, 6), r('w', 480, 210, 240, 320, 6), r('s', 495, 225, 210, 290, 4),
      p('g', 'M495 515L495 420L560 340L620 420L650 380L705 440L705 515Z'), e('y', 650, 280, 28, 28),
      r('n', 470, 535, 260, 22, 6),
      G(280, 880, 640, { shirt: 'p', pants: 'b', hair: 'n', aR: [0.3, -0.1], aL: [-0.1, 0.05] }),
      e('o', 170, 470, 56, 38), e('r', 150, 460, 10, 10, 'n'), e('b', 185, 480, 10, 10, 'n'), e('y', 200, 458, 10, 10, 'n'),
      tb('M520 380L510 420', 14, 'n')]),

    '口渴': Q(['@bg y', e('o', 160, 160, 80, 80), ln('o', 16, 'M160 40L160 60M40 160L60 160M75 75L90 90M245 75L230 90'),
      '@gr o 880',
      G(400, 900, 640, { shirt: 'b', pants: 'k', hair: 'k', sad: 1, aR: [-0.02, -0.2] }),
      e('p', 400, 408, 22, 32, 'n'), ln('k', 7, 'M400 390L400 425'),
      drop(310, 280, 0.6), drop(490, 250, 0.6), drop(330, 360, 0.5),
      p('w', 'M650 560L820 560L800 880L670 880Z'), p('s', 'M668 780L802 780L800 880L670 880Z', 'i'), ln('s', 7, 'M690 720L780 720'),
      ln('k', 7, 'M690 640L690 840')]),

    '頭暈': Q(['@gr m 880',
      G(500, 880, 640, { shirt: 'v', pants: 'b', hair: 'n', sad: 1, aR: [-0.02, -0.2], lL: [-0.06, 0.38], lR: [0.06, 0.38] }),
      e('w', 471, 336, 22, 22), ln('k', 7, sp1), e('w', 529, 336, 22, 22), ln('k', 7, sp2),
      star(360, 220, 26, 10, 4, 45, 'y'), star(650, 200, 26, 10, 4, 45, 'y'), star(500, 150, 26, 10, 4, 45, 'y'), star(320, 330, 20, 8, 4, 45, 'o'), star(690, 320, 20, 8, 4, 45, 'o'),
      ln('v', 7, 'M300 160Q400 90 500 110T700 150')]),

    '狗吠': Q(['@gr m 880', K.T(Q([dog]), { dx: -90 }),
      ln('s', 16, 'M830 330Q890 440 830 560'), ln('s', 16, 'M890 290Q970 440 890 600')]),

    '電子看板': Q(['@gr m 880', r('v', 300, 560, 40, 320, 6), r('v', 660, 560, 40, 320, 6), r('v', 380, 600, 240, 30, 6),
      r('k', 100, 220, 800, 350, 24), r('b', 130, 250, 740, 290, 12), dots,
      r('y', 150, 130, 700, 60, 12), r('y', 150, 190, 700, 30, 4, 'n')]),

    '拍灰塵': Q(['@gr m 880', r('n', 580, 180, 30, 700, 8), r('n', 880, 180, 30, 700, 8), r('n', 560, 160, 370, 40, 10),
      r('r', 620, 200, 260, 360, 14, 'b'), rugS, fringe, r('w', 640, 330, 220, 40, 6, 'i'),
      G(330, 880, 640, { shirt: 'g', pants: 'b', hair: 'k', aR: [0.25, -0.1] }),
      tb('M554 368L590 360', 16, 'n'), e('n', 600, 360, 28, 40),
      e('w', 520, 230, 55, 40), e('w', 480, 270, 40, 30), e('w', 540, 160, 40, 30), e('w', 450, 190, 35, 26),
      e('v', 560, 290, 7, 7, 'n'), e('v', 430, 240, 7, 7, 'n'), e('v', 500, 120, 7, 7, 'n')])
  }));
})(typeof globalThis !== 'undefined' ? globalThis : this);
