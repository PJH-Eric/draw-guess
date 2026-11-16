/* 以自訂清單呈現 select，原始欄位只保留值與 change 事件相容性。 */
(function (w, d) {
  'use strict';
  var entries = new Map();
  var opened = null;
  var frame = 0;

  function close(restore) {
    if (!opened) return;
    var entry = opened;
    opened = null;
    entry.list.hidden = true;
    entry.button.setAttribute('aria-expanded', 'false');
    if (restore) entry.button.focus();
  }

  function place(entry) {
    var rect = entry.button.getBoundingClientRect();
    var body = entry.select.closest('.settings-body');
    var bounds = body ? body.getBoundingClientRect() : { top: 8, bottom: w.innerHeight - 8 };
    var below = Math.min(w.innerHeight - 8, bounds.bottom) - rect.bottom - 6;
    var above = rect.top - Math.max(8, bounds.top) - 6;
    var up = below < 160 && above > below;
    var height = Math.min(260, Math.max(50, up ? above : below));
    entry.list.style.cssText = 'left:' + Math.max(8, rect.left) + 'px;width:' + Math.min(rect.width, w.innerWidth - 16) +
      'px;max-height:' + height + 'px;' + (up ? 'bottom:' + (w.innerHeight - rect.top + 6) : 'top:' + (rect.bottom + 6)) + 'px';
  }

  function open(entry) {
    if (opened === entry) { close(true); return; }
    close(false);
    opened = entry;
    entry.list.hidden = false;
    entry.button.setAttribute('aria-expanded', 'true');
    place(entry);
    var selected = entry.list.querySelector('[aria-selected=true]') || entry.list.firstElementChild;
    if (selected) { selected.focus(); selected.scrollIntoView({ block: 'nearest' }); }
  }

  function sync(entry) {
    var options = Array.from(entry.select.options);
    var signature = options.map(function (option) { return option.value + ':' + option.textContent; }).join('|');
    if (entry.signature !== signature) {
      entry.signature = signature;
      entry.list.textContent = '';
      options.forEach(function (option) {
        var item = d.createElement('button');
        item.type = 'button';
        item.className = 'dropdown-option';
        item.setAttribute('role', 'option');
        item.dataset.value = option.value;
        item.textContent = option.textContent;
        item.disabled = option.disabled;
        item.addEventListener('click', function () {
          entry.select.value = option.value;
          entry.select.dispatchEvent(new Event('change', { bubbles: true }));
          sync(entry);
          close(true);
        });
        entry.list.appendChild(item);
      });
    }
    var selected = options.find(function (option) { return option.selected; });
    entry.caption.textContent = selected ? selected.textContent : '';
    entry.button.disabled = entry.select.disabled;
    entry.list.querySelectorAll('.dropdown-option').forEach(function (item) {
      item.setAttribute('aria-selected', String(item.dataset.value === entry.select.value));
    });
  }

  function mount(select) {
    var wrapper = d.createElement('div');
    var button = d.createElement('button');
    var caption = d.createElement('span');
    var list = d.createElement('div');
    wrapper.className = 'dropdown-root';
    button.type = 'button';
    button.id = select.id + '-button';
    button.className = 'dropdown-button';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', select.id + '-list');
    var label = d.querySelector('label[for="' + select.id + '"]');
    if (label) {
      var labelText = label.querySelector('span') || label;
      if (!labelText.id) labelText.id = select.id + '-label';
      button.setAttribute('aria-labelledby', labelText.id);
      label.addEventListener('click', function (ev) {
        if (!ev.target.closest('.dropdown-root')) { ev.preventDefault(); button.focus(); }
      });
    }
    button.appendChild(caption);
    list.id = select.id + '-list';
    list.className = 'dropdown-list';
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    select.hidden = true;
    select.setAttribute('aria-hidden', 'true');
    select.after(wrapper);
    wrapper.appendChild(button);
    wrapper.appendChild(list);
    var entry = { select: select, button: button, caption: caption, list: list, signature: null };
    entries.set(select, entry);
    button.addEventListener('click', function () { open(entry); });
    select.addEventListener('change', function () { sync(entry); });
    sync(entry);
  }

  function refresh() {
    frame = 0;
    d.querySelectorAll('select').forEach(function (select) {
      if (!entries.has(select)) mount(select);
    });
    entries.forEach(function (entry, select) {
      if (!select.isConnected) { if (opened === entry) close(false); entries.delete(select); }
      else sync(entry);
    });
  }

  d.addEventListener('pointerdown', function (ev) {
    var rail = ev.target.closest('.scroll-rail');
    if (opened && rail && rail.getAttribute('aria-controls') === opened.list.id) return;
    if (opened && !opened.button.contains(ev.target) && !opened.list.contains(ev.target)) close(false);
  }, true);
  d.addEventListener('keydown', function (ev) {
    var entry = opened;
    if (!entry) {
      entry = Array.from(entries.values()).find(function (item) { return item.button === ev.target; });
      if (entry && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) { ev.preventDefault(); open(entry); }
      return;
    }
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); close(true); return; }
    if (ev.key === 'Tab') { close(false); return; }
    if ((ev.key === 'Enter' || ev.key === ' ') && d.activeElement.closest('.dropdown-option')) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      d.activeElement.click();
      return;
    }
    var items = Array.from(entry.list.querySelectorAll('button:not(:disabled)'));
    var index = items.indexOf(d.activeElement);
    var next = ev.key === 'Home' ? 0 : ev.key === 'End' ? items.length - 1 :
      ev.key === 'ArrowDown' ? Math.min(items.length - 1, index + 1) : ev.key === 'ArrowUp' ? Math.max(0, index - 1) : -1;
    if (next >= 0) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      items[next].focus();
      items[next].scrollIntoView({ block: 'nearest' });
    }
  }, true);
  d.addEventListener('scroll', function (ev) { if (opened && !opened.list.contains(ev.target)) place(opened); }, true);
  w.addEventListener('resize', function () { if (opened) place(opened); });
  new MutationObserver(function (changes) {
    if (changes.some(function (change) {
      return change.target.tagName === 'SELECT' || change.target.tagName === 'OPTION' ||
        Array.from(change.addedNodes).some(function (node) { return node.nodeType === 1 && (node.tagName === 'SELECT' || node.querySelector('select')); });
    }) && !frame) frame = w.requestAnimationFrame(refresh);
  }).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'selected'] });
  refresh();
})(window, document);
