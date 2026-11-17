/* Workbench-only binding coordinator. No draft writes, audio capture or chat sends. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./openbot-composer-display'));
  else root.OpenBotVoiceDisplayControl = factory(root.OpenBotComposerDisplay);
})(typeof globalThis === 'object' ? globalThis : this, function (ComposerDisplay) {
  'use strict';
  function create({ bridge, input, getContext, getPrimary, onState = () => {}, composerOptions = {} }) {
    let host = { enabled: false, code: 'DISABLED' }, binding = null, composer = null;
    let primaryId = '', epoch = 0, busy = false, closed = false, code = '', allowResume = true;
    let serial = Promise.resolve(), off = null, reading = false;
    const doc = input.ownerDocument, win = doc.defaultView;
    const available = !!(bridge && ['hardwareVoiceDisplayStatus', 'hardwareVoiceDisplaySetEnabled',
      'hardwareVoiceDisplayPublish', 'hardwareVoiceDisplayClear'].every(k => typeof bridge[k] === 'function'));
    function primary() { const p = getPrimary(); return p && typeof p.id === 'string' && p.id ? p : null; }
    function focused() { return doc.hidden !== true && doc.hasFocus() === true; }
    function snapshot() {
      const p = primary();
      return { available, enabled: host.enabled === true && host.botId === p?.id,
        attached: !!binding, busy, primaryId: p?.id || '', primaryName: p?.name || '',
        botId: host.botId || null, code: code || host.publisher?.code || host.code || 'DISABLED',
        mode: host.mode || null, preferredMode: host.preferredMode || null };
    }
    function notify() { if (!closed) try { onState(snapshot()); } catch (_) {} }
    function dropComposer() { if (composer) composer.close(); composer = null; binding = null; }
    function attach(result, id) {
      dropComposer();
      const fixedBinding = result.bindingId;
      binding = fixedBinding;
      composer = ComposerDisplay.create({ ...composerOptions, input, primaryBotId: id, getContext,
        publish: value => bridge.hardwareVoiceDisplayPublish({ ...value, bindingId: fixedBinding }),
        clear: () => bridge.hardwareVoiceDisplayClear({ bindingId: fixedBinding }),
        onState: value => { code = value.code; notify(); } });
      composer.setEnabled(true);
    }
    function acceptHost(value) {
      if (!value || typeof value.enabled !== 'boolean') return;
      // The IPC status shape contains no binding capability. Never derive one.
      host = { enabled: value.enabled, botId: value.botId || null, code: value.code,
        publisher: value.publisher, mode: value.mode, preferredMode: value.preferredMode };
      if (!host.enabled || host.botId !== primary()?.id) { dropComposer(); code = host.code || 'DISABLED'; }
      notify();
    }
    function chooseMode(mode) {
      const value = mode === 'usb-display';
      const ticket = ++epoch, id = primary()?.id;
      allowResume = false; busy = true; code = ''; dropComposer(); notify();
      const job = serial.then(async () => {
        if (closed || ticket !== epoch) return snapshot();
        if (!available || mode !== 'off' && (!id || !focused())) {
          code = !available ? 'DISPLAY_API_UNAVAILABLE' : !id ? 'DISPLAY_PRIMARY_UNAVAILABLE' : 'DISPLAY_WINDOW_UNFOCUSED';
          return snapshot();
        }
        const result = mode === 'ptt'
          ? await bridge.hardwareVoiceUsePttMode()
          : await bridge.hardwareVoiceDisplaySetEnabled(value === true);
        if (closed || ticket !== epoch || value === true && primary()?.id !== id) {
          // Finish revoking this stale enable before the next queued user choice.
          if (value === true && result?.enabled === true) await bridge.hardwareVoiceDisplaySetEnabled(false);
          return snapshot();
        }
        acceptHost(result);
        if (value === true && result?.enabled === true && result.botId === id && typeof result.bindingId === 'string' && result.bindingId) attach(result, id);
        else code = result?.code || (value === true ? 'DISPLAY_ENABLE_DENIED' : 'DISABLED');
        return snapshot();
      }).catch(() => {
        if (!closed && ticket === epoch) { code = 'DISPLAY_CONTROL_FAILED'; dropComposer(); }
        return snapshot();
      }).finally(() => { if (ticket === epoch) { busy = false; notify(); } });
      serial = job.then(() => {});
      return job;
    }
    function setEnabled(value) { return chooseMode(value === true ? 'usb-display' : 'off'); }
    function usePttMode() { return chooseMode('ptt'); }
    function resume() {
      if (!closed && !busy && allowResume && !binding && focused() && host.enabled === true && host.botId === primary()?.id) setEnabled(true);
    }
    function sync() {
      if (closed) return;
      const next = primary()?.id || '';
      if (primaryId && next !== primaryId) {
        ++epoch; busy = false; allowResume = false; dropComposer();
        host = { enabled: false, code: 'DISPLAY_PRIMARY_CHANGED' }; code = 'DISPLAY_PRIMARY_CHANGED';
        // Main independently revokes the old binding when authoritative primary changes.
      }
      primaryId = next;
      composer?.scopeChanged(); notify(); resume();
    }
    function refresh() {
      if (!available || closed || reading) return Promise.resolve(snapshot());
      reading = true; const ticket = epoch;
      return Promise.resolve(bridge.hardwareVoiceDisplayStatus()).then(value => {
        if (!closed && ticket === epoch) { acceptHost(value); sync(); }
        return snapshot();
      }).catch(() => { if (!closed && ticket === epoch) { code = 'DISPLAY_STATUS_UNAVAILABLE'; notify(); } return snapshot(); })
        .finally(() => { reading = false; });
    }
    function close() {
      if (closed) return; closed = true; ++epoch; dropComposer();
      if (typeof off === 'function') off();
      win?.removeEventListener('focus', resume); win?.removeEventListener('pagehide', close);
    }
    if (available && typeof bridge.onHardwareVoiceDisplayChanged === 'function') off = bridge.onHardwareVoiceDisplayChanged(value => { if (!closed) { acceptHost(value); sync(); } });
    win?.addEventListener('focus', resume); win?.addEventListener('pagehide', close);
    sync(); refresh();
    return Object.freeze({ snapshot, setEnabled, usePttMode, sync, refresh, close });
  }
  return { create };
});
