(function (root) {
  'use strict';
  var R = root.ReferenceRecipes || require('../reference-recipes.js');
  var K = root.ReferenceKit || require('../reference-kit.js');
  var Q = K.Q;
  function rd(n) { return Math.round(n); }
  function P(pts) {
    var d = '';
    for (var i = 0; i < pts.length; i++) d += (i ? 'L' : 'M') + rd(pts[i][0]) + ' ' + rd(pts[i][1]);
    return d;
  }
  /* 兩層管狀線 */
  function TB(c, pts) { return Q(['-k64|' + P(pts), '-' + c + '34|' + P(pts)]); }
  /* 手臂：從肩膀出發，pts 為相對肩膀的位移（以身高為 1，絕對方向），最後畫手掌 */
  function ARM(x, y, h, side, rel, c) {
    var sx = x + side * 0.1 * h, sy = y - 0.7 * h, pts = [[sx, sy]], i;
    for (i = 0; i < rel.length; i++) pts.push([sx + rel[i][0] * h, sy + rel[i][1] * h]);
    var e = pts[pts.length - 1], r = Math.max(30, 0.05 * h);
    return Q(['-k64|' + P(pts), '-' + c + '34|' + P(pts), 'y|E' + rd(e[0]) + ' ' + rd(e[1]) + ' ' + rd(r) + ' ' + rd(r)]);
  }
  function DROP(c, x, y, s) {
    return Q([c + '|M' + rd(x) + ' ' + rd(y - s) + 'Q' + rd(x + 0.9 * s) + ' ' + rd(y + 0.4 * s) + ' ' + rd(x) + ' ' + rd(y + 0.9 * s) + 'Q' + rd(x - 0.9 * s) + ' ' + rd(y + 0.4 * s) + ' ' + rd(x) + ' ' + rd(y - s) + 'Z']);
  }
  function HEART(c, cx, cy, s) {
    return Q([c + '|M' + rd(cx) + ' ' + rd(cy + s) + 'C' + rd(cx - 1.5 * s) + ' ' + rd(cy - 0.2 * s) + ' ' + rd(cx - 0.9 * s) + ' ' + rd(cy - 1.1 * s) + ' ' + rd(cx) + ' ' + rd(cy - 0.4 * s) + 'C' + rd(cx + 0.9 * s) + ' ' + rd(cy - 1.1 * s) + ' ' + rd(cx + 1.5 * s) + ' ' + rd(cy - 0.2 * s) + ' ' + rd(cx) + ' ' + rd(cy + s) + 'Z']);
  }
  function ST(c, cx, cy, r) {
    var d = '';
    for (var i = 0; i < 10; i++) {
      var a = ((i * 36 - 90) * Math.PI) / 180, rr = i % 2 ? r * 0.45 : r;
      d += (i ? 'L' : 'M') + rd(cx + Math.cos(a) * rr) + ' ' + rd(cy + Math.sin(a) * rr);
    }
    return c + '|' + d + 'Z';
  }
  function QM(c, cx, cy, s) {
    return Q(['-' + c + '16|M' + rd(cx - s) + ' ' + rd(cy - 0.6 * s) + 'Q' + rd(cx - s) + ' ' + rd(cy - 1.3 * s) + ' ' + rd(cx) + ' ' + rd(cy - 1.3 * s) + 'Q' + rd(cx + s) + ' ' + rd(cy - 1.3 * s) + ' ' + rd(cx + s) + ' ' + rd(cy - 0.6 * s) + 'Q' + rd(cx + s) + ' ' + rd(cy - 0.1 * s) + ' ' + rd(cx) + ' ' + rd(cy + 0.2 * s) + 'L' + rd(cx) + ' ' + rd(cy + 0.6 * s), c + '|E' + rd(cx) + ' ' + rd(cy + 1.1 * s) + ' ' + rd(0.14 * s) + ' ' + rd(0.14 * s) + '|n']);
  }
  function EX(c, cx, cy, s) {
    return Q(['-' + c + '16|M' + rd(cx) + ' ' + rd(cy - s) + 'L' + rd(cx) + ' ' + rd(cy + 0.3 * s), c + '|E' + rd(cx) + ' ' + rd(cy + 0.8 * s) + ' ' + rd(0.14 * s) + ' ' + rd(0.14 * s) + '|n']);
  }
  /* 臉部覆蓋：x,y,h 同 K.guy；o.base 為特寫（自己畫眼睛） */
  function FACE(x, y, h, o) {
    var sk = o.skin || 'y', hy = y - 0.86 * h, e = 0.045 * h, ey = hy + 0.01 * h, my = hy + 0.06 * h, L = [], s, ex, bx, by, ox, oy, ix, iy, d;
    var mw = o.big ? 16 : 7, bw = o.big ? 34 : 16, k = o.look || 0;
    var ew = o.eyes || (o.base ? 'dots' : '');
    function patch(px, py, rx, ry) { L.push(sk + '|E' + rd(px) + ' ' + rd(py) + ' ' + rd(rx) + ' ' + rd(ry) + '|n'); }
    if (o.cheek) { for (s = -1; s <= 1; s += 2) L.push('p|E' + rd(x + s * 0.082 * h) + ' ' + rd(hy + 0.045 * h) + ' ' + rd(0.03 * h) + ' ' + rd(0.018 * h) + '|n'); }
    for (s = -1; s <= 1; s += 2) {
      ex = x + s * e;
      if (ew === 'happy' || ew === 'closed' || ew === 'x') patch(ex, ey, 0.034 * h, 0.034 * h);
      if (ew === 'happy') L.push('-k' + mw + '|M' + rd(ex - 0.028 * h) + ' ' + rd(ey + 0.012 * h) + 'Q' + rd(ex) + ' ' + rd(ey - 0.036 * h) + ' ' + rd(ex + 0.028 * h) + ' ' + rd(ey + 0.012 * h));
      else if (ew === 'closed') L.push('-k' + mw + '|M' + rd(ex - 0.028 * h) + ' ' + rd(ey - 0.008 * h) + 'Q' + rd(ex) + ' ' + rd(ey + 0.036 * h) + ' ' + rd(ex + 0.028 * h) + ' ' + rd(ey - 0.008 * h));
      else if (ew === 'x') L.push('-k' + mw + '|M' + rd(ex - 0.022 * h) + ' ' + rd(ey - 0.022 * h) + 'L' + rd(ex + 0.022 * h) + ' ' + rd(ey + 0.022 * h) + 'M' + rd(ex + 0.022 * h) + ' ' + rd(ey - 0.022 * h) + 'L' + rd(ex - 0.022 * h) + ' ' + rd(ey + 0.022 * h));
      else if (ew === 'wide' || ew === 'side') {
        L.push('w|E' + rd(ex) + ' ' + rd(ey) + ' ' + rd(0.036 * h) + ' ' + rd(0.04 * h));
        L.push('k|E' + rd(ex + k * 0.02 * h) + ' ' + rd(ey) + ' ' + rd(0.015 * h) + ' ' + rd(0.018 * h) + '|n');
      } else if (ew === 'dots') {
        L.push('k|E' + rd(ex) + ' ' + rd(ey) + ' ' + rd(0.016 * h) + ' ' + rd(0.021 * h) + '|n');
      }
      var bk = o.brow;
      if (bk) {
        bx = x + s * e; by = hy - 0.04 * h; ox = bx + s * 0.034 * h; ix = bx - s * 0.034 * h;
        if (bk === 'worry') { oy = by + 0.02 * h; iy = by - 0.02 * h; }
        else if (bk === 'angry') { oy = by - 0.015 * h; iy = by + 0.025 * h; }
        else if (bk === 'flat') { oy = by; iy = by; }
        else { oy = by - 0.03 * h; iy = by - 0.03 * h; }
        if (bk === 'raise' && s === 1) { oy -= 0.025 * h; iy -= 0.025 * h; }
        L.push('-k' + bw + '|M' + rd(ox) + ' ' + rd(oy) + 'L' + rd(ix) + ' ' + rd(iy));
      }
    }
    var m = o.mouth;
    if (m) {
      patch(x, my + 0.005 * h, 0.075 * h, 0.05 * h);
      if (m === 'smile') L.push('-k' + mw + '|M' + rd(x - 0.045 * h) + ' ' + rd(my) + 'Q' + rd(x) + ' ' + rd(my + 0.04 * h) + ' ' + rd(x + 0.045 * h) + ' ' + rd(my));
      else if (m === 'flat') L.push('-k' + mw + '|M' + rd(x - 0.04 * h) + ' ' + rd(my + 0.01 * h) + 'L' + rd(x + 0.04 * h) + ' ' + rd(my + 0.01 * h));
      else if (m === 'sad') L.push('-k' + mw + '|M' + rd(x - 0.042 * h) + ' ' + rd(my + 0.02 * h) + 'Q' + rd(x) + ' ' + rd(my - 0.03 * h) + ' ' + rd(x + 0.042 * h) + ' ' + rd(my + 0.02 * h));
      else if (m === 'wavy') L.push('-k' + mw + '|M' + rd(x - 0.05 * h) + ' ' + rd(my + 0.01 * h) + 'Q' + rd(x - 0.03 * h) + ' ' + rd(my - 0.015 * h) + ' ' + rd(x - 0.01 * h) + ' ' + rd(my + 0.01 * h) + 'T' + rd(x + 0.03 * h) + ' ' + rd(my + 0.01 * h) + 'T' + rd(x + 0.05 * h) + ' ' + rd(my + 0.01 * h));
      else if (m === 'o') L.push('k|E' + rd(x) + ' ' + rd(my + 0.012 * h) + ' ' + rd(0.024 * h) + ' ' + rd(0.034 * h) + '|n');
      else if (m === 'small') L.push('k|E' + rd(x) + ' ' + rd(my + 0.01 * h) + ' ' + rd(0.014 * h) + ' ' + rd(0.016 * h) + '|n');
      else if (m === 'open') { L.push('k|M' + rd(x - 0.055 * h) + ' ' + rd(my - 0.005 * h) + 'Q' + rd(x) + ' ' + rd(my + 0.1 * h) + ' ' + rd(x + 0.055 * h) + ' ' + rd(my - 0.005 * h) + 'Z'); L.push('r|E' + rd(x) + ' ' + rd(my + 0.048 * h) + ' ' + rd(0.026 * h) + ' ' + rd(0.014 * h) + '|n'); }
      else if (m === 'grin') { L.push('w|M' + rd(x - 0.06 * h) + ' ' + rd(my - 0.005 * h) + 'Q' + rd(x) + ' ' + rd(my + 0.1 * h) + ' ' + rd(x + 0.06 * h) + ' ' + rd(my - 0.005 * h) + 'Z'); L.push('-k' + mw + '|M' + rd(x - 0.06 * h) + ' ' + rd(my + 0.012 * h) + 'L' + rd(x + 0.06 * h) + ' ' + rd(my + 0.012 * h)); }
      else if (m === 'teeth') { L.push('w|R' + rd(x - 0.05 * h) + ' ' + rd(my - 0.008 * h) + ' ' + rd(0.1 * h) + ' ' + rd(0.045 * h) + ' ' + rd(0.01 * h)); L.push('-k' + mw + '|M' + rd(x) + ' ' + rd(my - 0.008 * h) + 'L' + rd(x) + ' ' + rd(my + 0.037 * h) + 'M' + rd(x - 0.05 * h) + ' ' + rd(my + 0.0145 * h) + 'L' + rd(x + 0.05 * h) + ' ' + rd(my + 0.0145 * h)); }
      else if (m === 'zig') L.push('-k' + mw + '|M' + rd(x - 0.05 * h) + ' ' + rd(my + 0.02 * h) + 'L' + rd(x - 0.025 * h) + ' ' + rd(my) + 'L' + rd(x) + ' ' + rd(my + 0.02 * h) + 'L' + rd(x + 0.025 * h) + ' ' + rd(my) + 'L' + rd(x + 0.05 * h) + ' ' + rd(my + 0.02 * h));
      else if (m === 'curl') L.push('-k' + mw + '|M' + rd(x - 0.045 * h) + ' ' + rd(my + 0.03 * h) + 'Q' + rd(x) + ' ' + rd(my + 0.005 * h) + ' ' + rd(x + 0.05 * h) + ' ' + rd(my - 0.025 * h));
      else if (m === 'kiss') { L.push('r|M' + rd(x - 0.04 * h) + ' ' + rd(my + 0.012 * h) + 'Q' + rd(x - 0.02 * h) + ' ' + rd(my - 0.025 * h) + ' ' + rd(x) + ' ' + rd(my - 0.005 * h) + 'Q' + rd(x + 0.02 * h) + ' ' + rd(my - 0.025 * h) + ' ' + rd(x + 0.04 * h) + ' ' + rd(my + 0.012 * h) + 'Q' + rd(x) + ' ' + rd(my + 0.05 * h) + ' ' + rd(x - 0.04 * h) + ' ' + rd(my + 0.012 * h) + 'Z'); }
    }
    return Q(L);
  }
  /* 特寫大臉：cx,cy 臉中心，R 半徑 */
  function CF(cx, cy, R, o) {
    var h = R / 0.13, o2 = {}, kk;
    for (kk in o) o2[kk] = o[kk];
    o2.base = 1; o2.big = 1; if (!o2.mouth) o2.mouth = 'smile';
    var hc = o.hair || 'n';
    return Q(['y|E' + rd(cx - R) + ' ' + rd(cy + 0.05 * R) + ' ' + rd(0.14 * R) + ' ' + rd(0.22 * R), 'y|E' + rd(cx + R) + ' ' + rd(cy + 0.05 * R) + ' ' + rd(0.14 * R) + ' ' + rd(0.22 * R), 'y|E' + rd(cx) + ' ' + rd(cy) + ' ' + rd(R) + ' ' + rd(R), hc + '|M' + rd(cx - 0.89 * R) + ' ' + rd(cy - 0.45 * R) + 'A' + rd(R) + ' ' + rd(R) + ' 0 0 1 ' + rd(cx + 0.89 * R) + ' ' + rd(cy - 0.45 * R) + 'Q' + rd(cx) + ' ' + rd(cy - 0.8 * R) + ' ' + rd(cx - 0.89 * R) + ' ' + rd(cy - 0.45 * R) + 'Z', FACE(cx, cy + 0.86 * h, h, o2)]);
  }
  /* 站著的人：預設手臂隱藏，由 ARM 自己畫 */
  function G(x, y, h, o) {
    var q = {}, kk;
    for (kk in o) q[kk] = o[kk];
    if (!q.aL) q.aL = [0, 0.01];
    if (!q.aR) q.aR = [0, 0.01];
    return K.guy(x, y, h, q);
  }
  function SHAKE(x, y, s) {
    return Q(['-k7|M' + rd(x - s) + ' ' + rd(y - s * 0.6) + 'L' + rd(x - 1.5 * s) + ' ' + rd(y - s * 0.9), '-k7|M' + rd(x - s) + ' ' + rd(y) + 'L' + rd(x - 1.6 * s) + ' ' + rd(y), '-k7|M' + rd(x - s) + ' ' + rd(y + s * 0.6) + 'L' + rd(x - 1.5 * s) + ' ' + rd(y + s * 0.9)]);
  }
  function BUB(cx, cy, rx, ry, tx, ty) {
    return Q(['w|E' + rd(cx) + ' ' + rd(cy) + ' ' + rx + ' ' + ry, 'w|E' + rd(tx + (cx - tx) * 0.12) + ' ' + rd(ty + (cy - ty) * 0.12) + ' 24 20', 'w|E' + rd(tx + (cx - tx) * 0.3) + ' ' + rd(ty + (cy - ty) * 0.3) + ' 34 28']);
  }
  function CLD(c, x, y, s) {
    return Q([c + '|E' + rd(x) + ' ' + rd(y) + ' ' + rd(80 * s) + ' ' + rd(34 * s), c + '|E' + rd(x - 50 * s) + ' ' + rd(y + 10 * s) + ' ' + rd(50 * s) + ' ' + rd(28 * s), c + '|E' + rd(x + 60 * s) + ' ' + rd(y + 10 * s) + ' ' + rd(56 * s) + ' ' + rd(28 * s)]);
  }
  var X = 500, Y = 930, H = 720;
  var SIT = function (x) { return Q(['n|R230 330 40 340 8', 'n|R230 640 320 40 10', '-n34|M250 680L250 930M520 680L520 930', '-k7|M120 935L880 935']); };
  Object.assign(R, K.N({
    '招手': Q(['@bg s', '@gr m 900', G(X, Y, H, { shirt: 'r', pants: 'b' }), FACE(X, Y, H, { eyes: 'happy', mouth: 'smile', cheek: 1 }), ARM(X, Y, H, -1, [[-0.07, 0.3]], 'r'), ARM(X, Y, H, 1, [[0.16, -0.02], [0.24, -0.3]], 'r'), '-k7|M770 190Q830 230 810 290', '-k7|M820 160Q890 220 860 300', '-k7|M650 170Q620 210 640 260', 'p|E150 860 16 16', 'y|E860 900 16 16']),
    '握拳': Q(['@bg y', 'b|R300 790 400 160 20', 'y|R270 420 460 380 80', 'y|E345 430 58 82', 'y|E445 410 58 86', 'y|E545 410 58 86', 'y|E645 430 58 82', '-k7|M345 490L345 580M445 480L445 580M545 480L545 580M645 490L645 580', 'y|E480 650 200 70 -6', '-k7|M310 700Q480 620 650 660', 'r|M120 230L220 290M880 230L780 290M500 90L500 190', '-r16|M110 480L190 480M890 480L810 480']),
    '叉腰': Q(['@bg s', '@gr m 930', G(X, Y, H, { shirt: 'r', pants: 'b' }), FACE(X, Y, H, { eyes: 'happy', mouth: 'grin' }), ARM(X, Y, H, -1, [[-0.2, 0.08], [-0.03, 0.25]], 'r'), ARM(X, Y, H, 1, [[0.2, 0.08], [0.03, 0.25]], 'r'), ST('y', 190, 230, 36), ST('y', 820, 260, 30)]),
    '抱胸': Q(['@bg w', G(X, Y, H, { shirt: 'v', pants: 'k' }), FACE(X, Y, H, { eyes: 'side', brow: 'flat', mouth: 'flat', look: 1 }), ARM(X, Y, H, -1, [[-0.02, 0.14], [0.22, 0.12]], 'v'), ARM(X, Y, H, 1, [[0.02, 0.19], [-0.22, 0.18]], 'v'), '-k7|M300 180L340 210M700 180L660 210']),
    '托腮': Q([G(X, Y, H, { shirt: 'g', pants: 'b' }), FACE(X, Y, H, { eyes: 'closed', mouth: 'smile', cheek: 1 }), ARM(X, Y, H, -1, [[-0.02, 0.14], [0.22, 0.19]], 'g'), ARM(X, Y, H, 1, [[0.03, 0.17], [-0.05, -0.025]], 'g'), BUB(790, 200, 140, 100, 620, 330), HEART('p', 790, 200, 50), 'p|E220 700 20 20']),
    '抱頭': Q(['@bg v', G(X, Y, H, { shirt: 'b', pants: 'k' }), FACE(X, Y, H, { eyes: 'closed', brow: 'worry', mouth: 'open' }), ARM(X, Y, H, -1, [[-0.17, -0.05], [-0.04, -0.175]], 'b'), ARM(X, Y, H, 1, [[0.17, -0.05], [0.04, -0.175]], 'b'), '-k7|M180 220Q220 160 280 200Q240 260 200 230', '-k7|M820 220Q780 160 720 200Q760 260 800 230', DROP('s', 650, 220, 22), EX('r', 850, 480, 60)]),
    '流淚': Q(['@bg s', 's|E500 940 240 30', G(X, Y, H, { shirt: 'p', pants: 'b' }), FACE(X, Y, H, { eyes: 'closed', brow: 'worry', mouth: 'sad' }), ARM(X, Y, H, -1, [[-0.07, 0.3]], 'p'), ARM(X, Y, H, 1, [[0.07, 0.3]], 'p'), '-s16|M468 335Q452 430 470 520Q480 600 440 700', '-s16|M532 335Q548 430 530 520Q520 600 560 700', DROP('s', 380, 480, 20), DROP('s', 640, 520, 20), DROP('s', 440, 800, 16), DROP('s', 570, 820, 16)]),
    '咬牙': Q(['@bg o', CF(500, 500, 300, { brow: 'angry', mouth: 'teeth', eyes: 'dots' }), '-r16|M740 240L800 240M770 210L770 270', '-k16|M790 330L840 300M800 380L860 380', DROP('s', 790, 470, 34), '-w16|M170 260L220 300M150 330L210 340']),
    '親親': Q(['@bg p', CF(450, 520, 270, { eyes: 'closed', mouth: 'kiss', cheek: 1, brow: 'raise' }), HEART('r', 780, 300, 70), HEART('p', 870, 470, 44), HEART('r', 700, 150, 38), '-r16|M720 380L760 420']),
    '摸頭': Q(['@bg y', G(420, Y, H, { shirt: 'b', pants: 'k' }), FACE(420, Y, H, { eyes: 'happy', mouth: 'smile' }), ARM(420, Y, H, -1, [[-0.07, 0.3]], 'b'), G(650, Y, 420, { shirt: 'r', pants: 'b', hair: 'k' }), FACE(650, Y, 420, { eyes: 'happy', mouth: 'grin', cheek: 1 }), ARM(420, Y, H, 1, [[0.1, 0.05], [0.18, 0.1]], 'b'), HEART('p', 800, 360, 40), HEART('r', 700, 290, 26), '-k7|M600 470L580 450M690 470L710 450']),
    '拍肩': Q(['@bg s', '@gr m 930', G(640, Y, H, { shirt: 'o', pants: 'k' }), FACE(640, Y, H, { eyes: 'wide', mouth: 'o' }), ARM(640, Y, H, 1, [[0.07, 0.3]], 'o'), G(320, Y, H, { shirt: 'g', pants: 'b' }), FACE(320, Y, H, { eyes: 'happy', mouth: 'smile' }), ARM(320, Y, H, -1, [[-0.07, 0.3]], 'g'), ARM(320, Y, H, 1, [[0.1, -0.04], [0.23, 0.0]], 'g'), '-k7|M520 330L500 300M550 380L530 360M520 450L495 455']),
    '擺手': Q(['@bg w', G(X, Y, H, { shirt: 'v', pants: 'k' }), FACE(X, Y, H, { eyes: 'closed', brow: 'flat', mouth: 'flat' }), ARM(X, Y, H, -1, [[-0.07, 0.3]], 'v'), ARM(X, Y, H, 1, [[0.18, 0.0], [0.2, -0.28]], 'v'), '-k7|M770 170Q820 230 790 300', '-k7|M830 180Q890 240 860 320', '-k7|M690 180Q650 230 680 290', 'r|E820 760 90 90', 'w|E820 760 58 58|n', 'r|M770 810L870 710L885 725L785 825Z', '-k7|M280 190L330 230']),
    '彎腰': Q(['@gr m 930', '-k64|M520 640L515 890', '-b34|M520 640L515 890', '-k64|M470 640L465 890', '-b34|M470 640L465 890', 'k|E470 915 50 20', 'k|E520 915 50 20', 'r|E625 600 165 72 -15', TB('r', [[760, 590], [800, 770]]), 'y|E802 790 34 34', CF(865, 650, 76, { mouth: 'smile' }), 'y|E850 915 34 14', '-k7|M820 880L880 880', '-k7|M520 330Q740 220 850 440', 'k|M810 440L870 460L850 390Z']),
    '蹲下': Q(['@bg s', '@gr m 880', TB('b', [[430, 660], [320, 730], [390, 870]]), TB('b', [[570, 660], [680, 730], [610, 870]]), 'k|E390 895 55 22', 'k|E610 895 55 22', 'g|E500 560 110 140', TB('g', [[420, 480], [340, 620], [330, 735]]), TB('g', [[580, 480], [660, 620], [670, 735]]), 'y|E330 745 32 32', 'y|E670 745 32 32', CF(500, 350, 82, { eyes: 'side', mouth: 'smile', look: 0 }), '-g16|M820 900Q830 840 820 790', 'p|E820 770 30 22', 'y|E820 770 10 10|n', 'g|E790 860 30 12 20|n']),
    '撐下巴': Q(['@bg y', 'n|R0 640 1000 360', K.guy(500, 1060, 900, { shirt: 'b', pants: 'k', aL: [0, 0.01], aR: [0, 0.01] }), FACE(500, 1060, 900, { eyes: 'side', mouth: 'smile', look: 1 }), 'w|R550 590 300 40 6', '-k7|M570 610L830 610', ARM(500, 1060, 900, -1, [[0.0, 0.23], [0.067, -0.022]], 'b'), ARM(500, 1060, 900, 1, [[0.0, 0.23], [-0.067, -0.022]], 'b'), 'r|R100 560 120 90 8', '-k7|M110 590L210 590']),
    '掏耳朵': Q(['@bg s', CF(430, 520, 260, { eyes: 'closed', mouth: 'smile', cheek: 1 }), 'y|E690 540 62 100', '-n16|M690 490Q725 540 690 590', '-k34|M930 210L700 545', '-v16|M930 210L700 545', 'y|E695 550 16 16', '-k7|M800 200L850 150M870 300L930 290']),
    '抓癢': Q(['@bg w', G(X, Y, H, { shirt: 'g', pants: 'b' }), FACE(X, Y, H, { eyes: 'closed', mouth: 'grin' }), ARM(X, Y, H, -1, [[-0.12, 0.12], [-0.1, 0.3]], 'g'), ARM(X, Y, H, 1, [[-0.1, 0.18], [-0.24, 0.06]], 'g'), 'r|E350 480 14 14|n', 'r|E320 520 12 12|n', 'r|E380 540 12 12|n', '-r7|M260 460L290 440M250 520L280 520M270 580L300 570', 'k|E170 330 14 10|n', 'w|E160 318 14 8 -30|n', '-k7|M175 335L215 390']),
    '嘻笑': Q(['@bg y', G(X, Y, H, { shirt: 'p', pants: 'b' }), FACE(X, Y, H, { eyes: 'happy', mouth: 'grin', cheek: 1 }), ARM(X, Y, H, -1, [[0.03, 0.15], [0.1, 0.22]], 'p'), ARM(X, Y, H, 1, [[-0.03, 0.15], [-0.1, 0.22]], 'p'), DROP('s', 400, 330, 16), DROP('s', 600, 330, 16), '-k7|M320 260L270 230M330 320L260 320M680 260L730 230M670 320L740 320', '-k7|M400 560Q380 600 400 640M600 560Q620 600 600 640']),
    '深呼吸': Q(['@bg s', '@gr m 880', 'n|R120 640 40 250 8', 'g|E140 560 130 130', 'n|R840 680 36 210 8', 'g|E858 610 110 110', G(X, Y, H, { shirt: 'w', pants: 'b' }), FACE(X, Y, H, { eyes: 'closed', mouth: 'small', cheek: 1 }), ARM(X, Y, H, -1, [[-0.18, 0.1], [-0.3, 0.0]], 'w'), ARM(X, Y, H, 1, [[0.18, 0.1], [0.3, 0.0]], 'w'), '-b16|M300 290L430 340', 'b|M410 310L450 345L405 370Z|n', '-b16|M700 290L570 340', 'b|M590 310L550 345L595 370Z|n', '-b7|M250 420Q310 400 360 420']),
    '打嗝': Q(['@bg w', G(X, Y, H, { shirt: 'y', pants: 'b' }), FACE(X, Y, H, { eyes: 'wide', mouth: 'o', cheek: 1 }), ARM(X, Y, H, -1, [[-0.12, 0.15], [-0.15, 0.25]], 'y'), 'r|R300 580 70 110 14', 'w|R300 620 70 36|n', ARM(X, Y, H, 1, [[0.06, 0.04], [-0.09, -0.09]], 'y'), 's|E560 270 14 14', 's|E600 220 22 22', 's|E650 160 30 30', 's|E720 90 38 38', '-k7|M330 560L330 590']),
    '豎拇指': Q(['@bg y', 'b|R640 480 250 250 20', 'y|R400 450 270 280 50', 'y|R250 470 260 66 33', 'y|R250 540 260 66 33', 'y|R250 610 260 66 33', 'y|R250 680 260 66 33', 'y|R410 180 120 340 55', '-k7|M290 536L500 536M290 606L500 606M290 676L500 676', 'y|R410 500 40 40 10|n', ST('r', 800, 220, 60), ST('o', 190, 270, 40), '-r16|M620 120L660 190M720 90L730 160']),
    '抱拳': Q(['@bg r', G(X, Y, H, { shirt: 'y', pants: 'k', hair: 'k' }), FACE(X, Y, H, { eyes: 'dots', brow: 'flat', mouth: 'flat' }), ARM(X, Y, H, -1, [[-0.03, 0.14], [0.1, 0.12]], 'y'), ARM(X, Y, H, 1, [[0.03, 0.14], [-0.1, 0.12]], 'y'), 'y|E500 515 40 34', '-k7|M480 510L520 510', '-k7|M200 920L800 920']),
    '作揖': Q(['@bg y', G(X, Y, H, { shirt: 'r', pants: 'k', hair: 'k' }), FACE(X, Y, H, { eyes: 'closed', mouth: 'smile' }), ARM(X, Y, H, -1, [[-0.16, 0.06], [0.07, -0.06]], 'r'), ARM(X, Y, H, 1, [[0.16, 0.06], [-0.07, -0.06]], 'r'), 'y|E500 385 34 30', '-b16|M780 200Q880 400 790 620', 'b|M750 560L800 650L840 570Z|n', 'r|R120 140 60 90 20', '-y7|M150 130L150 100', '-y7|M120 190L180 190']),
    '跪下': Q(['@bg s', '@gr m 880', TB('b', [[560, 860], [330, 868]]), 'k|E300 880 44 20', TB('b', [[545, 650], [565, 860]]), 'k|M525 850L600 850L600 880L525 880Z', 'r|E545 500 90 155', TB('r', [[520, 380], [600, 520], [596, 640]]), 'y|E596 655 32 32', CF(560, 290, 80, { eyes: 'closed', mouth: 'sad', brow: 'worry' }), 'v|E700 900 60 12|n', '-k7|M740 880L790 860M760 905L820 905']),
    '踮腳': Q(['@bg w', '@gr m 940', 'n|R560 160 400 36 4', 'o|R650 70 100 90 14', 'n|R640 50 120 30 8', G(X, 870, H, { shirt: 'o', pants: 'b' }), FACE(X, 870, H, { eyes: 'dots', mouth: 'o' }), ARM(X, 870, H, -1, [[-0.07, 0.3]], 'o'), ARM(X, 870, H, 1, [[0.06, -0.14], [0.14, -0.28]], 'o'), 'k|M420 868L470 868L452 935L418 935Z', 'k|M530 868L580 868L582 935L548 935Z', '-r16|M200 800L200 560', 'r|M150 580L200 500L250 580Z|n']),
    '抖腳': Q(['@bg w', SIT(), TB('b', [[390, 630], [650, 640], [660, 870]]), 'k|E675 900 50 20', TB('b', [[380, 610], [640, 610], [690, 830]]), 'k|E705 855 55 22', 'r|E375 470 90 165', TB('r', [[380, 380], [470, 480], [610, 560]]), 'y|E618 568 30 30', CF(395, 255, 80, { eyes: 'side', brow: 'flat', mouth: 'flat', look: 1 }), '-k7|M770 770Q820 810 775 850', '-k7|M820 750Q880 810 825 870', '-k7|M850 840L890 860']),
    '翹腳': Q(['@bg w', SIT(), TB('b', [[390, 640], [610, 650], [615, 880]]), 'k|E630 905 50 20', 'r|E375 470 90 165', TB('b', [[380, 610], [670, 560], [790, 760]]), 'k|E815 780 55 24 -50', TB('r', [[380, 380], [470, 480], [600, 480]]), 'y|E605 480 30 30', 'w|M570 440L650 440L640 505Q610 525 580 505Z', '-k7|M650 460Q690 470 645 485', '-k7|M590 420Q580 390 600 370M625 420Q615 390 635 370', CF(395, 255, 80, { eyes: 'closed', mouth: 'smile' })]),
    '轉圈': Q(['@bg y', '@gr m 940', G(X, Y, H, { shirt: 'p', pants: 'p', lL: [-0.05, 0.38], lR: [0.15, 0.28] }), FACE(X, Y, H, { eyes: 'happy', mouth: 'grin', cheek: 1 }), ARM(X, Y, H, -1, [[-0.26, -0.02]], 'p'), ARM(X, Y, H, 1, [[0.26, -0.02]], 'p'), '-b16|M150 760Q150 900 500 920Q850 900 850 760', 'b|M810 740L850 800L890 730Z|n', ST('r', 250, 190, 34), ST('b', 760, 160, 30), ST('o', 500, 80, 24)]),
    '噓聲': Q(['@bg b', 'y|E820 170 70 70', 'b|E850 150 58 58|n', ST('y', 150, 150, 26), ST('y', 300, 80, 20), G(X, Y, H, { shirt: 'w', pants: 'v' }), FACE(X, Y, H, { eyes: 'side', brow: 'raise', mouth: 'flat', look: 1 }), ARM(X, Y, H, -1, [[-0.07, 0.3]], 'w'), ARM(X, Y, H, 1, [[0.06, 0.04], [-0.07, -0.105]], 'w'), 'y|R492 320 26 76 12', '-w7|M590 300Q630 330 590 370', '-w7|M410 300Q370 330 410 370']),
    '蹙眉': Q(['@bg y', 'o|E830 170 90 90', '-o16|M830 50L830 20M690 170L660 170M970 170L1000 170M730 90L710 70M930 90L950 70', CF(450, 540, 280, { brow: 'angry', mouth: 'flat', eyes: 'closed' }), '-k7|M420 330L425 400M480 330L478 400', '-k7|M520 330L522 400M570 330L568 400']),
    '張望': Q(['@bg s', '@gr m 800', 'g|M500 800L720 480L940 800Z', 'v|M720 480L780 560L720 590L680 560Z|n', G(380, Y, H, { shirt: 'o', pants: 'b' }), FACE(380, Y, H, { eyes: 'side', mouth: 'o', look: 1 }), ARM(380, Y, H, -1, [[-0.07, 0.3]], 'o'), ARM(380, Y, H, 1, [[0.08, -0.12], [-0.04, -0.235]], 'o'), 'y|R340 228 100 30 12', '-k7|M500 300L880 320M500 330L880 380', 'y|E850 140 60 60', '-k7|M260 160L300 200']),
    '偷看': Q(['@bg w', G(470, Y, H, { shirt: 'b', pants: 'k' }), FACE(470, Y, H, { eyes: 'side', brow: 'raise', mouth: 'flat', look: 1 }), 'v|R500 0 500 1000', '-k7|M500 0L500 1000', '-k7|M500 200L1000 200M500 400L1000 400M500 600L1000 600M500 800L1000 800', 'y|R470 470 40 66 16', 'y|R470 540 40 66 16', 'y|R470 610 40 66 16', '-k7|M360 190L330 160']),
    '昏倒': Q(['@bg s', '@gr m 790', 'v|E530 830 400 30|n', TB('b', [[640, 740], [830, 750]]), TB('b', [[640, 770], [830, 790]]), 'k|E845 750 24 40', 'k|E845 790 24 40', 'r|E510 730 150 70', TB('r', [[430, 720], [380, 830]]), TB('r', [[440, 700], [350, 780]]), 'y|E375 840 28 28', CF(300, 680, 76, { eyes: 'x', mouth: 'o' }), ST('y', 240, 460, 40), ST('o', 340, 400, 30), ST('y', 440, 470, 36), '-k7|M180 540Q300 440 420 540']),
    '撇嘴': Q(['@bg v', CF(500, 520, 290, { eyes: 'side', brow: 'raise', mouth: 'curl', look: -1 }), '-k16|M600 700Q660 690 700 660', '-k7|M170 330L240 300M830 330L760 300']),
    '咂嘴': Q(['@bg s', CF(430, 520, 270, { eyes: 'side', brow: 'raise', mouth: 'small', look: 1 }), '-k16|M600 690Q650 710 680 670', '-k16|M650 640Q720 680 750 600', '-k16|M700 590Q790 660 810 530', '-k7|M170 360Q140 420 170 480']),
    '抿笑': Q(['@bg p', CF(500, 520, 290, { eyes: 'happy', mouth: 'smile', cheek: 1, brow: 'raise' }), '-k16|M410 700L400 680M590 700L600 680', 'p|E330 620 50 28|n', 'p|E670 620 50 28|n', HEART('r', 830, 250, 40), HEART('p', 160, 250, 30)]),
    '皺鼻': Q(['@bg m', CF(480, 540, 280, { brow: 'angry', mouth: 'wavy', eyes: 'closed' }), 'y|E480 590 50 40', '-k16|M420 570Q480 540 540 570M430 610Q480 585 530 610', '-g16|M820 780Q870 700 820 640Q770 580 820 520', '-g16|M900 800Q940 740 900 690', CLD('m', 810, 440, 0.9)]),
    '揉眼睛': Q(['@bg b', 'y|E820 150 70 70', 'b|E850 130 58 58|n', ST('y', 160, 140, 26), ST('y', 340, 80, 20), G(X, Y, H, { shirt: 'w', pants: 'v' }), FACE(X, Y, H, { eyes: 'closed', brow: 'flat', mouth: 'o' }), ARM(X, Y, H, -1, [[-0.07, 0.3]], 'w'), ARM(X, Y, H, 1, [[0.06, 0.0], [-0.055, -0.15]], 'w'), '-w7|M610 270L650 250M620 320L670 320']),
    '噘嘴': Q(['@bg y', 'y|E230 650 80 65', 'y|E770 650 80 65', CF(500, 520, 290, { brow: 'angry', mouth: 'small', eyes: 'side', cheek: 1, look: 1 }), '-k7|M170 280L230 320M830 280L770 320']),
    '吹氣': Q(['@bg s', '@gr n 890', G(300, Y, H, { shirt: 'g', pants: 'b' }), FACE(300, Y, H, { eyes: 'closed', mouth: 'small', cheek: 1 }), ARM(300, Y, H, -1, [[-0.07, 0.3]], 'g'), ARM(300, Y, H, 1, [[0.07, 0.3]], 'g'), 'n|R580 760 340 130 14', 'p|R600 650 300 120 14', 'r|R740 520 40 130 8', 'o|M760 520Q800 480 880 470Q820 520 780 540Z', '-w16|M370 350Q480 330 590 380', '-w16|M380 400Q500 390 600 430', '-w16|M370 450Q480 470 580 480'])
  }));
})(typeof globalThis !== 'undefined' ? globalThis : this);
