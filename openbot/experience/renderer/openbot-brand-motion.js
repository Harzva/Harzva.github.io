/* OpenBot product-mark lifecycle: occasional blink, paused when unseen. */
(function (root) {
  'use strict';
  if (!root || !root.document) return;

  var doc = root.document;
  var reduced = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var records = [];
  var observer = null;
  var scanQueued = false;

  function prefersReduced() { return !!(reduced && reduced.matches); }
  function randomDelay() { return 4800 + Math.round(Math.random() * 3600); }
  function isConnected(node) {
    return node && (node.isConnected === undefined ? doc.documentElement.contains(node) : node.isConnected);
  }

  function attach(mark) {
    if (!mark || !mark.matches || !mark.matches('.brand .logo .ob-brand-mark[data-ob-brand-eyes="true"]')) return;
    if (records.some(function (record) { return record.mark === mark; })) return;
    mark.dataset.obBrandMotion = 'attached';

    var nextTimer = null;
    var blinkTimer = null;
    var secondBlinkTimer = null;
    var pageVisible = doc.visibilityState !== 'hidden';
    var inViewport = true;
    var windowFocused = typeof doc.hasFocus !== 'function' || doc.hasFocus();
    var nativeVisible = true;
    var io = null;
    var nativeUnsubscribe = null;

    function clearTimers() {
      if (nextTimer) root.clearTimeout(nextTimer);
      if (blinkTimer) root.clearTimeout(blinkTimer);
      if (secondBlinkTimer) root.clearTimeout(secondBlinkTimer);
      nextTimer = blinkTimer = secondBlinkTimer = null;
      mark.classList.remove('is-blinking');
    }
    function canBlink() {
      return pageVisible && inViewport && windowFocused && nativeVisible && !prefersReduced() && mark.isConnected !== false;
    }
    function schedule(delay) {
      if (nextTimer) root.clearTimeout(nextTimer);
      nextTimer = null;
      if (!canBlink()) return;
      nextTimer = root.setTimeout(blink, delay == null ? randomDelay() : delay);
    }
    function finishBlink() {
      mark.classList.remove('is-blinking');
      blinkTimer = null;
      // A quiet occasional double blink gives the mark a little character
      // without turning the product identity into a looping animation.
      if (Math.random() < 0.14 && canBlink()) {
        secondBlinkTimer = root.setTimeout(function () {
          secondBlinkTimer = null;
          if (!canBlink()) return schedule();
          mark.classList.add('is-blinking');
          blinkTimer = root.setTimeout(finishBlink, 150);
        }, 125);
      } else {
        schedule();
      }
    }
    function blink() {
      nextTimer = null;
      if (!canBlink()) return;
      mark.classList.add('is-blinking');
      blinkTimer = root.setTimeout(finishBlink, 150);
    }
    function reconcile() {
      if (!canBlink()) clearTimers();
      else if (!nextTimer && !blinkTimer && !secondBlinkTimer) schedule(900);
    }
    function setViewport(value) {
      inViewport = value;
      reconcile();
    }
    function setPageVisible() {
      pageVisible = doc.visibilityState !== 'hidden';
      reconcile();
    }
    function setWindowFocused(value) {
      windowFocused = value;
      reconcile();
    }
    function setWindowBlurred() { setWindowFocused(false); }
    function setWindowFocusedEvent() { setWindowFocused(true); }
    function setNativeVisible(value) {
      nativeVisible = value !== false;
      reconcile();
    }

    if (root.IntersectionObserver) {
      io = new root.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { setViewport(entry.isIntersecting && entry.intersectionRatio > 0); });
      }, { threshold: 0.01 });
      io.observe(mark);
    }
    doc.addEventListener('visibilitychange', setPageVisible);
    root.addEventListener('blur', setWindowBlurred);
    root.addEventListener('focus', setWindowFocusedEvent);
    if (root.grokbot && typeof root.grokbot.onWindowVisibility === 'function') {
      try {
        var unsubscribe = root.grokbot.onWindowVisibility(setNativeVisible);
        if (typeof unsubscribe === 'function') nativeUnsubscribe = unsubscribe;
      } catch (error) {
        // The optional desktop bridge must never prevent the browser renderer
        // from mounting the quiet product mark.
      }
    }
    if (reduced) {
      if (reduced.addEventListener) reduced.addEventListener('change', reconcile);
      else if (reduced.addListener) reduced.addListener(reconcile);
    }
    var record = {
      mark: mark,
      cleanup: function () {
        clearTimers();
        if (io) io.disconnect();
        doc.removeEventListener('visibilitychange', setPageVisible);
        root.removeEventListener('blur', setWindowBlurred);
        root.removeEventListener('focus', setWindowFocusedEvent);
        if (nativeUnsubscribe) {
          try { nativeUnsubscribe(); } catch (error) {}
          nativeUnsubscribe = null;
        }
        if (reduced) {
          if (reduced.removeEventListener) reduced.removeEventListener('change', reconcile);
          else if (reduced.removeListener) reduced.removeListener(reconcile);
        }
        if (mark.dataset) delete mark.dataset.obBrandMotion;
      }
    };
    records.push(record);
    reconcile();
  }

  function scan() {
    scanQueued = false;
    var current = Array.from(doc.querySelectorAll('.brand .logo .ob-brand-mark[data-ob-brand-eyes="true"]'));
    current.forEach(attach);
    records.slice().forEach(function (record) {
      if (!isConnected(record.mark) || current.indexOf(record.mark) === -1) {
        record.cleanup();
        records.splice(records.indexOf(record), 1);
      }
    });
  }
  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    if (root.requestAnimationFrame) root.requestAnimationFrame(scan);
    else root.setTimeout(scan, 0);
  }
  function mount() {
    if (!doc.body) return;
    scan();
    if (!observer && root.MutationObserver) {
      observer = new root.MutationObserver(queueScan);
      observer.observe(doc.body, { childList: true, subtree: true });
    }
  }

  root.OpenBotBrandMotion = { mount: mount, attach: attach };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})(typeof window !== 'undefined' ? window : null);
