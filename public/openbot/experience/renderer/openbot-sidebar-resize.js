/* User-controlled BOT sidebar width. Viewport changes alone never collapse it. */
(function (root) {
  'use strict';
  var MIN_WIDTH = 60;
  var MAX_WIDTH = 360;
  var COMPACT_WIDTH = 112;
  var DEFAULT_KEY = 'openbot.sidebar.width.v1';
  var EXPANDED_KEY = 'openbot.sidebar.expanded-width.v1';
  var initialized = false;

  function defaultWidth() {
    var value = parseFloat(root.getComputedStyle(root.document.documentElement).getPropertyValue('--ob-sidebar-width'));
    return Number.isFinite(value) ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, value)) : 248;
  }

  function savedWidth() {
    try {
      var value = parseFloat(root.localStorage.getItem(DEFAULT_KEY));
      return Number.isFinite(value) ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, value)) : null;
    } catch (_) { return null; }
  }

  function init() {
    if (initialized) return;
    var sidebar = root.document.getElementById('sidebar');
    var handle = root.document.getElementById('sidebar-resize-handle');
    var app = root.document.getElementById('app');
    if (!sidebar || !handle || !app || !root.document.getElementById('btn-toggle-sidebar')) return;
    initialized = true;

    var toggle = root.document.getElementById('btn-toggle-sidebar');
    var mac = /mac/i.test(root.navigator.platform);
    var shortcut = mac ? '⇧⌘S' : 'Ctrl+Shift+S';
    var expandedWidth = null;
    try {
      var saved = Number(root.localStorage.getItem(EXPANDED_KEY));
      if (saved > COMPACT_WIDTH && saved <= MAX_WIDTH) expandedWidth = saved;
    } catch (_) {}

    function rememberExpanded(width) {
      if (width <= COMPACT_WIDTH || width > MAX_WIDTH) return;
      expandedWidth = Math.round(width);
      try { root.localStorage.setItem(EXPANDED_KEY,String(expandedWidth)); } catch (_) {}
    }
    function updateToggle(compact) {
      toggle.setAttribute('aria-expanded', String(!compact));
      toggle.setAttribute('aria-keyshortcuts', mac ? 'Meta+Shift+S' : 'Control+Shift+S');
      var zh = compact ? '展开侧栏' : '收起侧栏', en = compact ? 'Expand sidebar' : 'Collapse sidebar';
      for (var pair of [['zh',zh],['en',en]]) {
        toggle.setAttribute('data-i18n-aria-label-'+pair[0],pair[1]);
        toggle.setAttribute('data-i18n-title-'+pair[0],pair[1]+' ('+shortcut+')');
      }
      var label = root.document.documentElement.lang.startsWith('en') ? en : zh;
      toggle.setAttribute('aria-label',label);
      toggle.title=label+' ('+shortcut+')';
    }
    function apply(width, manual, persist) {
      width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(width)));
      if (manual) {
        sidebar.style.width = width + 'px';
        sidebar.style.flexBasis = width + 'px';
        sidebar.dataset.manualWidth = 'true';
        sidebar.dataset.compact = width <= COMPACT_WIDTH ? 'true' : 'false';
      } else {
        sidebar.style.removeProperty('width');
        sidebar.style.removeProperty('flex-basis');
        delete sidebar.dataset.manualWidth;
        delete sidebar.dataset.compact;
      }
      handle.setAttribute('aria-valuenow', String(width));
      updateToggle(manual && width <= COMPACT_WIDTH);
      if (persist) {
        if (width > COMPACT_WIDTH) rememberExpanded(width);
        try {
          if (manual) root.localStorage.setItem(DEFAULT_KEY, String(width));
          else root.localStorage.removeItem(DEFAULT_KEY);
        } catch (_) { /* Width remains usable for this window when storage is unavailable. */ }
      }
    }

    var stored = savedWidth();
    if (stored !== null) apply(stored, true, false);
    else apply(sidebar.getBoundingClientRect().width || defaultWidth(), false, false);

    function toggleWidth() {
      if (drag) return;
      var width = sidebar.getBoundingClientRect().width;
      if (sidebar.dataset.compact === 'true') {
        apply(expandedWidth || defaultWidth(), true, true);
      } else {
        rememberExpanded(width);
        apply(MIN_WIDTH, true, true);
      }
    }
    toggle.addEventListener('click', toggleWidth);
    root.document.addEventListener('keydown', function(event) {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.altKey || !event.shiftKey ||
          event.key.toLowerCase() !== 's' || (mac ? !event.metaKey || event.ctrlKey : !event.ctrlKey || event.metaKey)) return;
      var editor = event.target.closest?.('input,textarea,[contenteditable="true"]');
      if (editor && editor.id !== 'chat-input') return;
      if (root.document.querySelector('dialog[open],#modal-mask:not(.hidden)') || toggle.getClientRects().length === 0) return;
      event.preventDefault(); toggleWidth();
    });

    var drag = null;
    handle.addEventListener('pointerdown', function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      drag = { pointerId: event.pointerId, startWidth:sidebar.getBoundingClientRect().width };
      handle.setPointerCapture(event.pointerId);
      root.document.body.dataset.sidebarResizing = 'true';
      apply(event.clientX - app.getBoundingClientRect().left, true, false);
    });
    handle.addEventListener('pointermove', function (event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      apply(event.clientX - app.getBoundingClientRect().left, true, false);
    });
    function endDrag(event) {
      if (!drag || (event && event.pointerId !== undefined && event.pointerId !== drag.pointerId)) return;
      var width = sidebar.getBoundingClientRect().width || defaultWidth();
      rememberExpanded(width > COMPACT_WIDTH ? width : drag.startWidth);
      drag = null;
      delete root.document.body.dataset.sidebarResizing;
      try { root.localStorage.setItem(DEFAULT_KEY, String(Math.round(width))); } catch (_) { /* Keep the width in this window. */ }
    }
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
    handle.addEventListener('lostpointercapture', endDrag);
    handle.addEventListener('dblclick', function () { apply(defaultWidth(), false, true); });
    handle.addEventListener('keydown', function (event) {
      var width = sidebar.getBoundingClientRect().width || defaultWidth();
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        var step = event.shiftKey ? 32 : 12;
        apply(width + (event.key === 'ArrowRight' ? step : -step), true, true);
      } else if (event.key === 'Home') {
        event.preventDefault(); apply(defaultWidth(), false, true);
      } else if (event.key === 'End') {
        event.preventDefault(); apply(MAX_WIDTH, true, true);
      }
    });
    root.addEventListener('resize', function () {
      if (!sidebar.dataset.manualWidth) handle.setAttribute('aria-valuenow', String(Math.round(sidebar.getBoundingClientRect().width || defaultWidth())));
    });
  }

  root.OpenBotSidebarResize = { init: init };
})(window);
