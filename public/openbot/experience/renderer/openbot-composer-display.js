/* Reads only the explicitly supplied OpenBot textarea. Never edits or sends chat. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotComposerDisplay = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const integer = value => Number.isSafeInteger(value) && value >= 0 && value <= 0x7fffffff;
  function create({ input, primaryBotId, getContext, publish, clear,
    delayMs = 250, setTimer = setTimeout, cancelTimer = clearTimeout, onState = () => {} }) {
    if (!input?.addEventListener || !input?.removeEventListener || typeof primaryBotId !== 'string' || !primaryBotId || typeof getContext !== 'function' || typeof publish !== 'function' || typeof clear !== 'function' || !Number.isInteger(delayMs) || delayMs < 50 || delayMs > 2000) throw new Error('DISPLAY_BRIDGE_CONFIGURATION_INVALID');
    let enabled = false, closed = false, composing = false, timer = null, epoch = 0, counter = 0;
    let lastScope = null, lastSent = null, code = 'DISABLED';
    const listeners = [];
    function state(value) { code = value; try { onState(snapshot()); } catch (_) {} }
    function snapshot() { return { enabled, closed, composing, pending: timer !== null, code }; }
    function context() {
      try {
        const c = getContext();
        if (!c || c.primaryBotId !== primaryBotId || c.botId !== primaryBotId || c.visible !== true || typeof c.composerKey !== 'string' || !c.composerKey || c.composerKey.length > 200 || !integer(c.generation) || c.generation === 0 || !integer(c.revision) || !integer(c.primaryRevision ?? 0)) return null;
        return c;
      } catch (_) { return null; }
    }
    function scope(c) { return c && JSON.stringify([c.primaryBotId, c.botId, c.composerKey, c.generation, c.primaryRevision ?? 0]); }
    function focused() {
      const doc = input.ownerDocument;
      return input.isConnected === true && doc?.activeElement === input && doc.hidden !== true && typeof doc.hasFocus === 'function' && doc.hasFocus() === true;
    }
    function cancel() { ++epoch; if (timer !== null) cancelTimer(timer); timer = null; }
    function safeClear(reason) {
      try { Promise.resolve(clear(reason)).catch(() => state('DISPLAY_CLEAR_FAILED')); } catch (_) { state('DISPLAY_CLEAR_FAILED'); }
    }
    function invalidate(reason = 'scope-changed') {
      cancel(); lastSent = null; lastScope = scope(context());
      if (enabled && !closed) safeClear(reason);
      state('INVALIDATED');
    }
    function emit(expectedScope, ticket) {
      timer = null;
      if (!enabled || closed || ticket !== epoch || composing) return;
      const c = context();
      if (!c || scope(c) !== expectedScope || c.ready !== true || !focused()) { invalidate('scope-or-focus-changed'); return; }
      // Reading a committed input is not proof of WeType provenance, ASR final,
      // normal chat submission or persistence. This path never calls sendMessage.
      const text = input.value;
      if (typeof text !== 'string' || text.length > 8192) { state('DISPLAY_TEXT_INVALID'); return; }
      const signature = JSON.stringify([expectedScope, c.revision, text]);
      if (signature === lastSent) { state('UNCHANGED'); return; }
      if (counter === 0x7fffffff) { enabled = false; safeClear('counter-exhausted'); state('DISPLAY_COUNTER_EXHAUSTED'); return; }
      const utteranceId = 'cm-' + epoch + '-' + (++counter);
      lastSent = signature; lastScope = expectedScope;
      try {
        Promise.resolve(publish({ botId: primaryBotId, text, utteranceId,
          composerKey: c.composerKey, composerGeneration: c.generation, composerRevision: c.revision }))
          .then(result => { if (!closed && ticket === epoch) state(result?.accepted === true ? 'DISPLAY_ACCEPTED' : result?.code || 'DISPLAY_NOT_ACCEPTED'); })
          .catch(() => { if (!closed && ticket === epoch) state('DISPLAY_PUBLISH_FAILED'); });
      } catch (_) { state('DISPLAY_PUBLISH_FAILED'); }
    }
    function schedule() {
      if (!enabled || closed || composing) return;
      const c = context();
      if (!c || !focused()) { invalidate('scope-or-focus-changed'); return; }
      cancel(); const ticket = epoch, expectedScope = scope(c);
      // Existing composer handles its deferred final input first. A later input
      // cancels this timer; no polling or global keyboard interception exists.
      timer = setTimer(() => emit(expectedScope, ticket), delayMs);
    }
    function listen(target, type, fn) { if (target?.addEventListener) { target.addEventListener(type, fn); listeners.push([target, type, fn]); } }
    listen(input, 'input', schedule);
    listen(input, 'compositionstart', () => { composing = true; cancel(); });
    listen(input, 'compositionend', () => { composing = false; schedule(); });
    listen(input, 'blur', () => invalidate('composer-blur'));
    listen(input.ownerDocument?.defaultView, 'blur', () => invalidate('window-blur'));
    listen(input.ownerDocument, 'visibilitychange', () => { if (input.ownerDocument.hidden) invalidate('window-hidden'); });
    function setEnabled(value) {
      cancel(); lastSent = null;
      if (closed) return false;
      enabled = value === true; lastScope = scope(context());
      if (!enabled) safeClear('disabled');
      state(enabled ? 'ENABLED_WAITING_NEW_INPUT' : 'DISABLED');
      // Do not mirror an old draft merely because the feature was enabled.
      return enabled;
    }
    function scopeChanged() {
      const next = scope(context());
      if (next !== lastScope) invalidate('scope-changed');
      lastScope = next;
    }
    function close() {
      if (closed) return;
      cancel(); if (enabled) safeClear('closed');
      enabled = false; closed = true; lastSent = null;
      for (const [target, type, fn] of listeners) target.removeEventListener(type, fn);
      state('CLOSED');
    }
    return Object.freeze({ setEnabled, scopeChanged, invalidate, snapshot, close });
  }
  return { create };
});
