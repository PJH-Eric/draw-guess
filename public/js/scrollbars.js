/* 自訂滑軌不改動原始捲動容器，保留觸控慣性、滾輪與原有鍵盤操作。 */
(function (w, d) {
  'use strict';
  var selector = '.screen,.overlay-card,.settings-body,.aside-body,.playbar,.guessfeed,.paint-controls,' +
    '.ruledd-list,.chatlist,.playerstrip,.toolrow-tools,.toolrow-colors,.toolscroll,.result-share-dialog,.dropdown-list';
  var records = new Map();
  var frame = 0;
  var discover = true;
  var serial = 0;
  var dragging = null;
  var observer = w.ResizeObserver ? new w.ResizeObserver(schedule) : null;

  function schedule() {
    if (!frame) frame = w.requestAnimationFrame(update);
  }

  function label() {
    return w.I18N ? w.I18N.t('scrollbar.label') : '捲動內容';
  }

  function makeRail(target, axis) {
    var rail = d.createElement('div');
    var thumb = d.createElement('span');
    rail.className = 'scroll-rail';
    rail.dataset.axis = axis;
    rail.setAttribute('role', 'scrollbar');
    rail.setAttribute('aria-orientation', axis === 'y' ? 'vertical' : 'horizontal');
    rail.setAttribute('aria-controls', target.id);
    rail.setAttribute('aria-valuemin', '0');
    rail.tabIndex = 0;
    thumb.className = 'scroll-thumb';
    rail.appendChild(thumb);
    d.body.appendChild(rail);
    var item = { target: target, axis: axis, rail: rail, thumb: thumb, length: 0, size: 0, max: 0 };
    rail.addEventListener('pointerdown', function (ev) {
      if (ev.button !== 0) return;
      ev.preventDefault();
      var rect = rail.getBoundingClientRect();
      var point = axis === 'y' ? ev.clientY - rect.top : ev.clientX - rect.left;
      var offset = item.max ? position(item) / item.max * (item.length - item.size) : 0;
      var grab = ev.target === thumb ? point - offset : item.size / 2;
      dragging = { item: item, pointer: ev.pointerId, grab: grab };
      rail.classList.add('dragging');
      rail.setPointerCapture(ev.pointerId);
      move(ev);
    });
    rail.addEventListener('pointermove', move);
    rail.addEventListener('pointerup', release);
    rail.addEventListener('pointercancel', release);
    rail.addEventListener('lostpointercapture', release);
    rail.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var delta = axis === 'y' ? ev.deltaY : (ev.deltaX || ev.deltaY);
      var scale = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? item.length : 1;
      setPosition(item, position(item) + delta * scale);
    }, { passive: false });
    rail.addEventListener('keydown', function (ev) {
      var step = axis === 'y' ? target.clientHeight : target.clientWidth;
      var value = position(item);
      if (ev.key === 'Home') value = 0;
      else if (ev.key === 'End') value = item.max;
      else if (ev.key === 'PageDown') value += step * 0.9;
      else if (ev.key === 'PageUp') value -= step * 0.9;
      else if (ev.key === (axis === 'y' ? 'ArrowDown' : 'ArrowRight')) value += 40;
      else if (ev.key === (axis === 'y' ? 'ArrowUp' : 'ArrowLeft')) value -= 40;
      else return;
      ev.preventDefault();
      ev.stopPropagation();
      setPosition(item, value);
    });
    return item;
  }

  function position(item) {
    return item.axis === 'y' ? item.target.scrollTop : item.target.scrollLeft;
  }

  function setPosition(item, value) {
    item.target[item.axis === 'y' ? 'scrollTop' : 'scrollLeft'] = Math.max(0, Math.min(item.max, value));
    schedule();
  }

  function move(ev) {
    if (!dragging || ev.pointerId !== dragging.pointer) return;
    var item = dragging.item;
    var rect = item.rail.getBoundingClientRect();
    var point = item.axis === 'y' ? ev.clientY - rect.top : ev.clientX - rect.left;
    setPosition(item, (point - dragging.grab) / Math.max(1, item.length - item.size) * item.max);
  }

  function release() {
    if (!dragging) return;
    dragging.item.rail.classList.remove('dragging');
    dragging = null;
  }

  function layout(item) {
    var target = item.target;
    var style = w.getComputedStyle(target);
    var vertical = item.axis === 'y';
    var client = vertical ? target.clientHeight : target.clientWidth;
    var total = vertical ? target.scrollHeight : target.scrollWidth;
    var overflow = vertical ? style.overflowY : style.overflowX;
    var rail = item.rail;
    rail.hidden = !/^(auto|scroll)$/.test(overflow) || total <= client + 1 || !target.getClientRects().length;
    if (rail.hidden) return;
    var rect = target.getBoundingClientRect();
    var bounds = { left: Math.max(0, rect.left), top: Math.max(0, rect.top),
      right: Math.min(w.innerWidth, rect.right), bottom: Math.min(w.innerHeight, rect.bottom) };
    var z = 1;
    for (var parent = target; parent && parent !== d.documentElement; parent = parent.parentElement) {
      var cs = w.getComputedStyle(parent);
      z = Math.max(z, parseInt(cs.zIndex, 10) || 0);
      if (parent !== target && /(hidden|auto|scroll|clip)/.test(cs.overflowX + cs.overflowY)) {
        var clip = parent.getBoundingClientRect();
        bounds.left = Math.max(bounds.left, clip.left);
        bounds.top = Math.max(bounds.top, clip.top);
        bounds.right = Math.min(bounds.right, clip.right);
        bounds.bottom = Math.min(bounds.bottom, clip.bottom);
      }
    }
    item.length = (vertical ? bounds.bottom - bounds.top : bounds.right - bounds.left) - 8;
    rail.hidden = item.length < 30 || bounds.right - bounds.left < 14 || bounds.bottom - bounds.top < 14 || style.visibility === 'hidden';
    if (rail.hidden) return;
    item.max = total - client;
    item.size = Math.min(item.length, Math.max(24, item.length * client / total));
    /* 工具列那幾條橫向帶子只有一顆按鈕高，滑軌疊在裡面會蓋掉按鈕下緣；
       改成細一號、貼在帶子下方的列間空隙。 */
    var slim = !vertical && target.matches('.toolrow-tools,.toolrow-colors,.toolscroll');
    rail.toggleAttribute('data-slim', slim);
    var railTop = vertical ? bounds.top + 4 : (slim ? Math.min(bounds.bottom - 1, w.innerHeight - 8) : bounds.bottom - 12);
    rail.style.cssText = 'z-index:' + (z + 1) + ';left:' + (vertical ? bounds.right - 13 : bounds.left + 4) +
      'px;top:' + railTop + 'px;width:' +
      (vertical ? 12 : item.length) + 'px;height:' + (vertical ? item.length : (slim ? 8 : 12)) + 'px';
    var offset = Math.max(0, Math.min(item.max, position(item))) / item.max * (item.length - item.size);
    item.thumb.style[vertical ? 'height' : 'width'] = item.size + 'px';
    item.thumb.style.transform = 'translate' + (vertical ? 'Y' : 'X') + '(' + offset + 'px)';
    rail.setAttribute('aria-label', label());
    rail.setAttribute('aria-valuemax', String(Math.round(item.max)));
    rail.setAttribute('aria-valuenow', String(Math.round(position(item))));
  }

  function update() {
    frame = 0;
    if (discover) {
      discover = false;
      d.querySelectorAll(selector).forEach(function (target) {
        if (records.has(target)) return;
        if (!target.id) target.id = 'scroll-region-' + (++serial);
        records.set(target, [makeRail(target, 'y'), makeRail(target, 'x')]);
        if (observer) observer.observe(target);
      });
    }
    records.forEach(function (items, target) {
      if (!target.isConnected) {
        items.forEach(function (item) { item.rail.remove(); });
        if (observer) observer.unobserve(target);
        records.delete(target);
      } else items.forEach(layout);
    });
  }

  d.documentElement.classList.add('custom-scrollbars');
  new w.MutationObserver(function (changes) {
    var contentChanged = changes.some(function (change) {
      return !change.target.closest || !change.target.closest('.scroll-rail');
    });
    if (contentChanged) { discover = true; schedule(); }
  }).observe(d.body, { childList: true, subtree: true, characterData: true, attributes: true,
    attributeFilter: ['class', 'hidden', 'style', 'aria-hidden'] });
  d.addEventListener('scroll', schedule, true);
  d.addEventListener('transitionend', schedule, true);
  w.addEventListener('resize', schedule);
  if (w.visualViewport) w.visualViewport.addEventListener('resize', schedule);
  schedule();
})(window, document);
