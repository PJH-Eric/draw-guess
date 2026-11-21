/* ===== svgui.js — 立體 SVG 按鈕、標題 LOGO、玩家頭像、工具圖示 =====
 *
 * 按鈕外觀是依元素實際尺寸即時畫出來的 SVG，所以縮放時不會被拉扁，
 * 也保證有「上層面 + 較深底座 + 高光」的區塊立體感。
 * 文字仍然是 HTML，不會烘焙進圖裡，方便本地化與螢幕閱讀器。
 *
 * 所有圖示都是自己畫的 SVG（有 viewBox、可縮放描邊），不靠 emoji 當核心視覺。
 */
(function (w) {
  'use strict';
  var INK = '#4A3B55';

  var PALETTE = {
    grape: ['#C9B6F5', '#A48FDB'],
    peach: ['#FFC2B4', '#E89C8B'],
    mint:  ['#A9E7D2', '#79C6AC'],
    sky:   ['#AED9F5', '#7FB4DA'],
    lemon: ['#FFE3A0', '#E7C263'],
    cream: ['#FFF0DE', '#E6D2B4'],
    rose:  ['#FFB8CF', '#E88CAA'],
    gray:  ['#E9E3EE', '#C8BFD1']
  };

  /* 玩家頭像用的 8 組配色，依座位順序循環，方便一眼認人 */
  var FACES = [
    { body: '#FFE0C2', dark: '#F0BC8E', accent: '#FFB8CF' },
    { body: '#AED9F5', dark: '#7FB4DA', accent: '#FFFFFF' },
    { body: '#A9E7D2', dark: '#79C6AC', accent: '#FFF7E0' },
    { body: '#FFC2B4', dark: '#E89C8B', accent: '#FFF0DE' },
    { body: '#C9B6F5', dark: '#A48FDB', accent: '#FFE3A0' },
    { body: '#FFE3A0', dark: '#E7C263', accent: '#FFB8CF' },
    { body: '#FFB8CF', dark: '#E88CAA', accent: '#AED9F5' },
    { body: '#E3CBAE', dark: '#C2A17C', accent: '#A9E7D2' }
  ];

  /* ---- 立體按鈕 ---- */
  function paint(el) {
    var wpx = el.offsetWidth, hpx = el.offsetHeight;
    if (!wpx || !hpx) return;
    var cs = getComputedStyle(el);
    var d = parseFloat(cs.getPropertyValue('--d')) || 8;
    var key = el.getAttribute('data-color') || 'cream';
    var c = PALETTE[key] || PALETTE.cream;
    var faceH = hpx - d - 4;
    if (faceH < 10) return;
    var r = Math.min(20, faceH / 2.2);
    var svg = el.querySelector('.b3-svg');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'b3-svg');
      svg.setAttribute('aria-hidden', 'true');
      el.insertBefore(svg, el.firstChild);
    }
    svg.setAttribute('viewBox', '0 0 ' + wpx + ' ' + hpx);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.innerHTML =
      '<rect x="2" y="' + (2 + d) + '" width="' + (wpx - 4) + '" height="' + faceH + '" rx="' + r + '" fill="' + c[1] + '" stroke="' + INK + '" stroke-width="3"/>' +
      '<g class="b3-face">' +
      '<rect x="2" y="2" width="' + (wpx - 4) + '" height="' + faceH + '" rx="' + r + '" fill="' + c[0] + '" stroke="' + INK + '" stroke-width="3"/>' +
      '<rect x="' + (r * 0.55 + 4) + '" y="7" width="' + Math.max(4, wpx - 8 - r * 1.1) + '" height="' + Math.max(4, faceH * 0.36) + '" rx="' + (r * 0.5) + '" fill="#FFFFFF" opacity="0.45"/>' +
      '</g>';
  }

  var ro = w.ResizeObserver ? new ResizeObserver(function (list) {
    for (var i = 0; i < list.length; i++) paint(list[i].target);
  }) : null;

  function decorate(el) {
    if (el.dataset.b3) return;
    el.dataset.b3 = '1';
    var lbl = document.createElement('span');
    lbl.className = 'b3-lbl';
    lbl.innerHTML = el.innerHTML;
    el.innerHTML = '';
    el.appendChild(lbl);
    paint(el);
    if (ro) ro.observe(el); else w.addEventListener('resize', function () { paint(el); });

    var press = function () { if (!el.disabled) el.classList.add('press'); };
    var release = function () { el.classList.remove('press'); };
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointerleave', release);
    el.addEventListener('pointercancel', release);
  }

  function decorateAll(root) {
    var list = (root || document).querySelectorAll('.btn3d');
    for (var i = 0; i < list.length; i++) decorate(list[i]);
  }
  function repaintAll(root) {
    var list = (root || document).querySelectorAll('.btn3d');
    for (var i = 0; i < list.length; i++) paint(list[i]);
  }
  function setLabel(el, html) {
    var lbl = el.querySelector('.b3-lbl');
    if (lbl) lbl.innerHTML = html; else el.innerHTML = html;
  }
  function setColor(el, key) {
    el.setAttribute('data-color', key);
    paint(el);
  }

  /* ---------------------------------------------------------- 頭像 */

  /**
   * 圓臉頭像。
   * mood: idle | happy | think | draw | win | sad
   * seat 決定配色，讓同一個人在席位卡、計分板、猜題紀錄都是同一個顏色。
   */
  function face(seat, mood, label) {
    var c = FACES[((seat | 0) % FACES.length + FACES.length) % FACES.length];
    var m = mood || 'idle';
    var eyes, mouth, extra = '';

    if (m === 'happy' || m === 'win') {
      eyes = '<path d="M30 52 q8 -11 16 0M54 52 q8 -11 16 0" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>';
      mouth = '<path d="M36 66 q14 14 28 0" fill="none" stroke="' + INK + '" stroke-width="4.5" stroke-linecap="round"/>';
    } else if (m === 'sad') {
      eyes = '<path d="M30 50 q8 10 16 0M54 50 q8 10 16 0" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>';
      mouth = '<path d="M36 72 q14 -12 28 0" fill="none" stroke="' + INK + '" stroke-width="4.5" stroke-linecap="round"/>';
    } else if (m === 'think') {
      eyes = '<circle cx="38" cy="52" r="6" fill="' + INK + '"/><path d="M54 52 h16" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>';
      mouth = '<path d="M40 68 h16" stroke="' + INK + '" stroke-width="4.5" stroke-linecap="round"/>';
      extra = '<circle cx="80" cy="26" r="6" fill="#FFFFFF" stroke="' + INK + '" stroke-width="3"/>' +
              '<circle cx="90" cy="14" r="4" fill="#FFFFFF" stroke="' + INK + '" stroke-width="2.5"/>';
    } else {
      eyes = '<circle cx="38" cy="52" r="6.5" fill="' + INK + '"/><circle cx="62" cy="52" r="6.5" fill="' + INK + '"/>' +
             '<circle cx="40.5" cy="49.5" r="2" fill="#FFF"/><circle cx="64.5" cy="49.5" r="2" fill="#FFF"/>';
      mouth = '<path d="M40 66 q10 9 20 0" fill="none" stroke="' + INK + '" stroke-width="4.5" stroke-linecap="round"/>';
    }

    if (m === 'draw') {
      /* 正在畫畫：手上多一支筆 */
      extra += '<g transform="rotate(35 82 62)">' +
        '<rect x="76" y="34" width="12" height="40" rx="3" fill="#FFE3A0" stroke="' + INK + '" stroke-width="3"/>' +
        '<path d="M76 74 L82 88 L88 74 Z" fill="#FFF0DE" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
        '</g>';
    }

    return '<svg viewBox="0 0 100 100" role="img" aria-label="' + (label || (globalThis.I18N ? globalThis.I18N.t("text.331") : "玩家頭像")) + '">' +
      '<circle cx="50" cy="55" r="40" fill="' + c.dark + '"/>' +
      '<circle cx="50" cy="52" r="40" fill="' + c.body + '" stroke="' + INK + '" stroke-width="5"/>' +
      '<path d="M18 34 q14 -18 32 -18 q18 0 32 18 q-16 -8 -32 -8 q-16 0 -32 8 Z" fill="' + c.dark + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
      eyes + mouth +
      '<ellipse cx="26" cy="64" rx="7" ry="4.5" fill="' + c.accent + '" opacity="0.85"/>' +
      '<ellipse cx="74" cy="64" rx="7" ry="4.5" fill="' + c.accent + '" opacity="0.85"/>' +
      extra +
      '</svg>';
  }

  /* ---------------------------------------------------------- 圖示 */

  function ico(inner, label, box) {
    return '<svg viewBox="0 0 ' + (box || 100) + ' ' + (box || 100) + '" role="img" aria-label="' + label + '">' + inner + '</svg>';
  }
  var S = 'stroke="' + INK + '" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"';

  var ICONS = {
    pen: function () {
      return ico('<g transform="rotate(42 50 50)">' +
        '<path d="M40 24 V68 L50 87 L60 68 V24 Z" fill="#FFE3A0" ' + S + '/>' +
        '<path d="M40 24 V16 Q40 12 44 12 H56 Q60 12 60 16 V24" fill="#FFB8CF" ' + S + '/>' +
        '<path d="M40 30 H60 M50 35 V65 M40 68 L50 73 L60 68" fill="none" ' + S + '/>' +
        '<path d="M46 80 L50 87 L54 80 Z" fill="' + INK + '"/></g>', (globalThis.I18N ? globalThis.I18N.t("text.330") : "鉛筆"));
    },
    brush: function () {
      return ico('<g transform="rotate(35 50 50)">' +
        '<path d="M44 43 V18 Q44 11 50 11 Q56 11 56 18 V43" fill="#AED9F5" ' + S + '/>' +
        '<path d="M35 43 H65 V60 H35 Z" fill="#DCD5E6" ' + S + '/>' +
        '<path d="M35 60 H65 L69 84 Q50 91 31 84 Z" fill="#E3B787" ' + S + '/>' +
        '<path d="M42 69 L40 85 M51 69 V87 M59 69 L61 85" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/></g>', (globalThis.I18N ? globalThis.I18N.t("text.329") : "筆刷"));
    },
    erase: function () {
      return ico('<path d="M16 59 L54 21 Q58 17 62 21 L83 42 Q87 46 83 50 L49 84 H36 Z" fill="#FFB8CF" ' + S + '/>' +
        '<path d="M16 59 L35 40 L66 71 L49 84 H36 Z" fill="#FFFDF8" ' + S + '/>' +
        '<path d="M60 84 H87" fill="none" ' + S + '/>', (globalThis.I18N ? globalThis.I18N.t("text.328") : "橡皮擦"));
    },
    line: function () {
      return ico('<path d="M20 80 L80 20" ' + S + ' fill="none"/>', (globalThis.I18N ? globalThis.I18N.t("text.327") : "直線"));
    },
    rect: function () {
      return ico('<rect x="16" y="24" width="68" height="52" rx="1" fill="none" ' + S + '/>', (globalThis.I18N ? globalThis.I18N.t("text.326") : "矩形"));
    },
    ellipse: function () {
      return ico('<ellipse cx="50" cy="50" rx="34" ry="26" fill="none" ' + S + '/>', (globalThis.I18N ? globalThis.I18N.t("text.325") : "橢圓"));
    },
    fill: function () {
      return ico('<path d="M26 28 Q20 12 32 12 Q43 12 48 28" fill="none" ' + S + '/>' +
        '<path d="M18 49 L43 24 L74 55 L48 81 Q43 86 38 81 L18 61 Q12 55 18 49 Z" fill="#E3DFEA" ' + S + '/>' +
        '<path d="M18 55 H68 L48 81 Q43 86 38 81 Z" fill="#A9E7D2" ' + S + '/>' +
        '<path d="M43 24 L76 57" fill="none" ' + S + '/>' +
        '<path d="M80 59 Q91 74 91 80 A11 11 0 0 1 69 80 Q69 74 80 59 Z" fill="#7FB4DA" ' + S + '/>', (globalThis.I18N ? globalThis.I18N.t("text.324") : "油漆桶"));
    },
    undo: function () {
      return ico('<path d="M30 42 H62 a20 20 0 0 1 0 40 H40" fill="none" ' + S + '/>' +
        '<path d="M44 26 L26 42 L44 58" fill="none" ' + S + '/>', (globalThis.I18N ? globalThis.I18N.t("text.323") : "復原"));
    },
    redo: function () {
      return ico('<path d="M70 42 H38 a20 20 0 0 0 0 40 H60" fill="none" ' + S + '/>' +
        '<path d="M56 26 L74 42 L56 58" fill="none" ' + S + '/>', (globalThis.I18N ? globalThis.I18N.t("text.322") : "重做"));
    },
    trash: function () {
      return ico('<path d="M24 30 H76" ' + S + ' fill="none"/>' +
        '<path d="M40 30 V20 H60 V30" fill="#FFC2B4" ' + S + '/>' +
        '<path d="M30 30 L34 84 H66 L70 30 Z" fill="#FFF0DE" ' + S + '/>' +
        '<path d="M44 42 V72 M56 42 V72" ' + S + ' fill="none"/>', (globalThis.I18N ? globalThis.I18N.t("text.321") : "全部清除"));
    },
    gear: function () {
      var teeth = '';
      for (var i = 0; i < 8; i++) {
        teeth += '<rect x="43" y="4" width="14" height="20" rx="4" fill="#FFF0DE" ' + S +
          ' transform="rotate(' + (i * 45) + ' 50 50)"/>';
      }
      return ico(teeth +
        '<circle cx="50" cy="50" r="28" fill="#FFF0DE" ' + S + '/>' +
        '<circle cx="50" cy="50" r="11" fill="#C9B6F5" ' + S + '/>', (globalThis.I18N ? globalThis.I18N.t("text.320") : "設定"));
    },
    palette: function () {
      return ico('<path d="M50 14 a36 36 0 1 0 0 72 q10 0 10 -8 q0 -8 6 -8 h10 a14 14 0 0 0 14 -14 A36 36 0 0 0 50 14 Z" fill="#FFF0DE" ' + S + '/>' +
        '<circle cx="34" cy="38" r="7" fill="#D2444F"/><circle cx="56" cy="30" r="7" fill="#5FBF95"/>' +
        '<circle cx="72" cy="46" r="7" fill="#7FB4DA"/><circle cx="32" cy="62" r="7" fill="#E7C263"/>', (globalThis.I18N ? globalThis.I18N.t("text.319") : "調色盤"));
    },
    trophy: function () {
      return ico('<path d="M32 18 H68 V44 a18 18 0 0 1 -36 0 Z" fill="#FFE3A0" ' + S + '/>' +
        '<path d="M32 24 H20 a12 12 0 0 0 12 14 M68 24 H80 a12 12 0 0 1 -12 14" fill="none" ' + S + '/>' +
        '<path d="M50 62 V74 M36 74 H64 M30 86 H70 V74 H30 Z" fill="#E7C263" ' + S + '/>', (globalThis.I18N ? globalThis.I18N.t("text.318") : "獎盃"));
    },
    eye: function () {
      return ico('<path d="M10 50 q40 -34 80 0 q-40 34 -80 0 Z" fill="#FFF0DE" ' + S + '/>' +
        '<circle cx="50" cy="50" r="14" fill="#AED9F5" ' + S + '/>', (globalThis.I18N ? globalThis.I18N.t("text.317") : "觀戰"));
    },
    clock: function () {
      return ico('<circle cx="50" cy="52" r="34" fill="#FFF0DE" ' + S + '/>' +
        '<path d="M50 52 V32 M50 52 L66 60" ' + S + ' fill="none"/>', (globalThis.I18N ? globalThis.I18N.t("text.316") : "倒數"));
    },
    chat: function () {
      return ico('<path d="M16 26 H84 V66 H50 L32 82 V66 H16 Z" fill="#AED9F5" ' + S + '/>' +
        '<circle cx="36" cy="46" r="4.5" fill="' + INK + '"/><circle cx="50" cy="46" r="4.5" fill="' + INK + '"/><circle cx="64" cy="46" r="4.5" fill="' + INK + '"/>', (globalThis.I18N ? globalThis.I18N.t("text.315") : "猜題紀錄"));
    },
    board: function () {
      return ico('<rect x="14" y="18" width="72" height="56" rx="6" fill="#FFFDF8" ' + S + '/>' +
        '<path d="M26 60 q12 -26 22 -14 q8 10 16 -6" fill="none" stroke="#E88CAA" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M40 74 V86 M60 74 V86 M32 86 H68" ' + S + ' fill="none"/>', (globalThis.I18N ? globalThis.I18N.t("text.314") : "畫板"));
    },
    /* 以下是純裝飾圖示：外層元素自己有 aria-label 或 aria-hidden，所以這裡不給名稱 */
    refresh: function () {
      return ico('<path d="M78 42 A30 30 0 1 0 80 58" fill="none" ' + S + '/>' +
        '<path d="M82 18 V44 H56" fill="none" ' + S + '/>', '');
    },
    home: function () {
      return ico('<path d="M14 50 L50 18 L86 50 V84 H14 Z" fill="#FFE3A0" ' + S + '/>' +
        '<rect x="41" y="58" width="18" height="26" fill="#FFFDF8" ' + S + '/>', '');
    },
    tag: function () {
      return ico('<path d="M16 16 H50 L86 52 L52 86 L16 50 Z" fill="#C9B6F5" ' + S + '/>' +
        '<circle cx="36" cy="36" r="6" fill="#FFFDF8" ' + S + '/>', '');
    },
    ruler: function () {
      return ico('<rect x="10" y="32" width="80" height="36" rx="6" fill="#FFE3A0" ' + S + '/>' +
        '<path d="M28 32 V48 M44 32 V54 M60 32 V48 M76 32 V54" fill="none" ' + S + '/>', '');
    },
    clipboard: function () {
      return ico('<rect x="20" y="20" width="60" height="68" rx="9" fill="#FFFDF8" ' + S + '/>' +
        '<rect x="35" y="10" width="30" height="18" rx="6" fill="#FFE3A0" ' + S + '/>' +
        '<path d="M34 48 H66 M34 62 H66 M34 76 H54" fill="none" ' + S + '/>', '');
    },
    gamepad: function () {
      return ico('<path d="M26 32 H74 Q92 32 92 54 Q92 78 77 78 Q68 78 62 67 H38 Q32 78 23 78 Q8 78 8 54 Q8 32 26 32 Z" fill="#AED9F5" ' + S + '/>' +
        '<path d="M29 47 V63 M21 55 H37" fill="none" ' + S + '/>' +
        '<circle cx="65" cy="49" r="5" fill="' + INK + '"/><circle cx="77" cy="60" r="5" fill="' + INK + '"/>', '');
    },
    music: function () {
      return ico('<path d="M38 72 V24 L80 14 V62" fill="none" ' + S + '/>' +
        '<ellipse cx="27" cy="73" rx="13" ry="10" fill="#FFB8CF" ' + S + '/>' +
        '<ellipse cx="69" cy="63" rx="13" ry="10" fill="#FFB8CF" ' + S + '/>', '');
    },
    globe: function () {
      return ico('<circle cx="50" cy="50" r="36" fill="#AED9F5" ' + S + '/>' +
        '<ellipse cx="50" cy="50" rx="16" ry="36" fill="none" ' + S + '/>' +
        '<path d="M14 50 H86" fill="none" ' + S + '/>', '');
    },
    help: function () {
      return ico('<circle cx="50" cy="50" r="36" fill="#FFE3A0" ' + S + '/>' +
        '<path d="M37 41 Q37 27 50 27 Q63 27 63 40 Q63 49 50 53 V60" fill="none" ' + S + '/>' +
        '<circle cx="50" cy="73" r="5" fill="' + INK + '"/>', '');
    },
    person: function () {
      return ico('<circle cx="50" cy="33" r="17" fill="#FFE3A0" ' + S + '/>' +
        '<path d="M18 88 Q22 58 50 58 Q78 58 82 88 Z" fill="#A9E7D2" ' + S + '/>', '');
    },
    flag: function () {
      return ico('<path d="M26 12 V90" fill="none" ' + S + '/>' +
        '<path d="M26 18 H80 L66 37 L80 56 H26 Z" fill="#FFB8CF" ' + S + '/>', '');
    },
    plug: function () {
      return ico('<path d="M36 10 V32 M64 10 V32" fill="none" ' + S + '/>' +
        '<path d="M22 32 H78 V50 Q78 70 50 70 Q22 70 22 50 Z" fill="#C9B6F5" ' + S + '/>' +
        '<path d="M50 70 V92" fill="none" ' + S + '/>', '');
    },
    crown: function () {
      return ico('<path d="M12 78 L18 30 L37 54 L50 20 L63 54 L82 30 L88 78 Z" fill="#FFE3A0" ' + S + '/>' +
        '<circle cx="50" cy="62" r="5" fill="#E88CAA"/>', '');
    },
    people: function () {
      return ico('<circle cx="36" cy="36" r="16" fill="#FFE3A0" ' + S + '/>' +
        '<circle cx="68" cy="42" r="12" fill="#AED9F5" ' + S + '/>' +
        '<path d="M12 84 q4 -24 24 -24 q20 0 24 24 Z" fill="#FFE3A0" ' + S + '/>' +
        '<path d="M60 84 q4 -18 16 -18 q12 0 14 18 Z" fill="#AED9F5" ' + S + '/>', (globalThis.I18N ? globalThis.I18N.t("text.034") : "玩家"));
    },
    /* 畫圖傳話：兩張小畫用箭頭往下傳，最後變成一個對話框（純裝飾） */
    telephone: function () {
      return ico('<rect x="8" y="12" width="30" height="30" rx="5" fill="#FFB8CF" ' + S + '/>' +
        '<path d="M14 34 L21 24 L27 31 L31 27 L33 34" fill="none" ' + S + '/>' +
        '<rect x="56" y="12" width="30" height="30" rx="5" fill="#AED9F5" ' + S + '/>' +
        '<circle cx="71" cy="27" r="7" fill="#FFE3A0" ' + S + '/>' +
        '<path d="M40 27 H52 M47 21 L53 27 L47 33" fill="none" ' + S + '/>' +
        '<path d="M71 46 V54 M65 50 L71 56 L77 50" fill="none" ' + S + '/>' +
        '<path d="M24 60 H84 Q90 60 90 66 V80 Q90 86 84 86 H40 L28 94 L30 86 H24 Q18 86 18 80 V66 Q18 60 24 60 Z" fill="#A9E7D2" ' + S + '/>' +
        '<circle cx="40" cy="73" r="3.5" fill="#28354b"/><circle cx="54" cy="73" r="3.5" fill="#28354b"/><circle cx="68" cy="73" r="3.5" fill="#28354b"/>', '');
    },
    /* 接力：一枝當接力棒的鉛筆，前後兩道箭頭表示「交給下一個人」（純裝飾） */
    relay: function () {
      return ico('<path d="M14 64 Q14 30 46 26" fill="none" ' + S + '/>' +
        '<path d="M38 16 L48 26 L38 36" fill="none" ' + S + '/>' +
        '<path d="M86 36 Q86 70 54 74" fill="none" ' + S + '/>' +
        '<path d="M62 64 L52 74 L62 84" fill="none" ' + S + '/>' +
        '<g transform="rotate(45 50 50)"><rect x="42" y="30" width="16" height="34" rx="3" fill="#FFE3A0" ' + S + '/>' +
        '<path d="M42 64 L50 76 L58 64 Z" fill="#FFB8CF" ' + S + '/></g>', '');
    }
  };

  function icon(name, label) {
    var f = ICONS[name];
    return f ? f(label) : '';
  }

  /* ---------------------------------------------------------- LOGO */

  function escText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function logo() {
    var title = globalThis.I18N ? globalThis.I18N.t('logo.title') : '你畫我猜';
    /* 牌子的高度配合內容（畫板 48–124、筆尖到 128）：上下留白一樣多，
       以前牌子比內容高一截，標題看起來浮在上半部、下面空一塊。
       畫板的線、筆、問號泡泡各自包一層 <g>，進場動畫由 CSS（.lg-*）負責。 */
    return '<svg viewBox="0 0 520 172" role="img" aria-label="' + escText(title) + '">' +
      '<defs>' +
      '<linearGradient id="dgSky" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#FFF6E8"/><stop offset="1" stop-color="#FFE9F2"/>' +
      '</linearGradient>' +
      '</defs>' +
      '<rect x="14" y="16" width="492" height="140" rx="40" fill="url(#dgSky)" stroke="' + INK + '" stroke-width="7"/>' +
      /* 左邊：畫板與筆 */
      '<rect x="44" y="48" width="96" height="76" rx="10" fill="#FFFDF8" stroke="' + INK + '" stroke-width="6"/>' +
      '<path class="lg-line" pathLength="100" d="M58 106 q16 -34 30 -18 q10 12 22 -10" fill="none" stroke="#E88CAA" stroke-width="7" stroke-linecap="round"/>' +
      '<circle class="lg-dot" cx="74" cy="70" r="7" fill="#7FB4DA"/>' +
      '<g class="lg-pen"><g transform="rotate(30 138 108)">' +
      '<rect x="130" y="62" width="16" height="48" rx="4" fill="#FFE3A0" stroke="' + INK + '" stroke-width="5"/>' +
      '<path d="M130 110 L138 128 L146 110 Z" fill="#FFF0DE" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>' +
      '</g></g>' +
      /* 文字 */
      /* 字級 58：四個字寬 232，落在筆尖（x≈166）與泡泡（x=420）之間，不再互相壓到 */
      '<text class="lg-title" x="290" y="107" text-anchor="middle" font-size="58" font-weight="900" fill="#6E4FBF" ' +
      'stroke="' + INK + '" stroke-width="7" paint-order="stroke" ' +
      'font-family="Yuanti TC, PingFang TC, Microsoft JhengHei, Noto Sans TC, sans-serif"' +
      /* 英文標題比四個中文字長，縮小並往上提一點才放得進畫板與泡泡之間 */
      (title.length > 6 ? ' style="font-size:35px" dy="-8"' : '') + '>' + escText(title) + '</text>' +
      /* 右邊：問號泡泡 */
      '<g class="lg-bubble">' +
      '<path d="M420 38 H492 V84 H458 L442 98 V84 H420 Z" fill="#C9B6F5" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<text x="456" y="74" text-anchor="middle" font-size="36" font-weight="900" fill="#FFFDF8" ' +
      'stroke="' + INK + '" stroke-width="5" paint-order="stroke" font-family="system-ui, sans-serif">?</text>' +
      '</g>' +
      '</svg>';
  }

  /* ------------------------------------------------------ 背景裝飾 */

  function decorateBackground(el, count) {
    if (!el) return;
    var n = count || 12;
    var colors = ['#FFE3A0', '#C9B6F5', '#A9E7D2', '#FFB8CF', '#AED9F5'];
    var html = '';
    for (var i = 0; i < n; i++) {
      var size = 28 + (i * 37) % 64;
      html += '<span style="left:' + ((i * 83) % 100) + '%;top:' + ((i * 47) % 100) + '%;' +
        'width:' + size + 'px;height:' + size + 'px;background:' + colors[i % colors.length] + ';' +
        'animation-duration:' + (10 + (i % 7) * 3) + 's;animation-delay:-' + (i * 1.7) + 's"></span>';
    }
    el.innerHTML = html;
  }

  w.SvgUI = {
    PALETTE: PALETTE,
    FACES: FACES,
    INK: INK,
    decorateAll: decorateAll,
    repaintAll: repaintAll,
    setLabel: setLabel,
    setColor: setColor,
    face: face,
    icon: icon,
    ICONS: ICONS,
    logo: logo,
    decorateBackground: decorateBackground
  };
}(window));
