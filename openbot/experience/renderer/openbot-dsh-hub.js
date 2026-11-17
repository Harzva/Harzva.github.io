/* OpenBot owns the dialog and the origin; dsh.fish owns the embedded market. */
(function () {
  'use strict';

  const prefix = 'openbot-dsh-hub:';
  let current;

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function close() {
    const view = current;
    if (!view) return false;
    current = undefined;
    window.clearTimeout(view.timeout);
    window.removeEventListener('message', view.receive);
    if (view.dialog.open) view.dialog.close();
    view.dialog.remove();
    if (view.restoreFocus?.isConnected) view.restoreFocus.focus({ preventScroll: true });
    if (typeof view.onClose === 'function') view.onClose({ botId: view.botId, url: view.url });
    return true;
  }

  function open({ botId, url, title, onClose, onOpenLink } = {}) {
    if (typeof botId !== 'string' || !botId || typeof url !== 'string') return false;
    let frameUrl;
    try { frameUrl = new URL(url); } catch { return false; }
    if (frameUrl.protocol !== 'openbot-dsh:' || !/^[a-z0-9-]+$/.test(frameUrl.hostname) ||
        frameUrl.username || frameUrl.password || frameUrl.port ||
        !['/', '/index.html'].includes(frameUrl.pathname)) return false;

    if (current?.url === url && current.botId === botId) return true;
    close();
    const isZh = document.documentElement.lang.toLowerCase().startsWith('zh');
    const label = title || (isZh ? 'DSH 插件市场' : 'DSH plugin market');
    frameUrl.pathname = '/index.html';
    frameUrl.search = 'lang=' + (isZh ? 'zh' : 'en');
    frameUrl.hash = '';
    // WHATWG URL.origin reports 'null' for custom schemes. Electron's
    // registered standard protocol still has a tuple security origin.
    const origin = frameUrl.protocol + '//' + frameUrl.host;

    const dialog = makeElement('dialog', 'ob-dsh-hub');
    dialog.setAttribute('aria-label', label);
    const loading = makeElement('div', 'ob-dsh-hub__loading');
    const status = makeElement('p', 'ob-dsh-hub__status', isZh ? '正在打开 DSH 插件市场…' : 'Opening the DSH plugin market…');
    status.setAttribute('role', 'status');
    const dismiss = makeElement('button', 'ob-dsh-hub__dismiss', isZh ? '返回对话' : 'Back to conversation');
    dismiss.type = 'button';
    dismiss.autofocus = true;
    dismiss.addEventListener('click', close);
    loading.append(status, dismiss);

    const frame = makeElement('iframe', 'ob-dsh-hub__frame');
    frame.title = label;
    frame.hidden = true;
    // The upstream search form needs its submit event. The child CSP still
    // blocks all form navigation through form-action 'none'.
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    frame.referrerPolicy = 'no-referrer';
    const view = {
      botId, url, onClose, dialog, restoreFocus: document.activeElement,
      receive(event) {
        if (current !== view || event.origin !== origin || event.source !== frame.contentWindow) return;
        const message = event.data;
        if (message?.type === prefix + 'ready' && frame.hidden) {
          window.clearTimeout(view.timeout);
          frame.hidden = false;
          loading.hidden = true;
          frame.focus();
        } else if (message?.type === prefix + 'error') {
          fail();
        } else if (message?.type === prefix + 'close') {
          close();
        } else if (message?.type === prefix + 'external' && typeof onOpenLink === 'function' &&
                   typeof message.url === 'string' && message.url.length <= 4096) {
          let external;
          try { external = new URL(message.url); } catch { return; }
          if (external.protocol === 'https:' && external.hostname && !external.username && !external.password) {
            onOpenLink(external.href);
          }
        }
      }
    };
    function fail() {
      if (current !== view) return;
      window.clearTimeout(view.timeout);
      frame.remove();
      loading.hidden = false;
      status.textContent = isZh ? '无法打开 DSH 插件市场。请返回后重试。' : 'Could not open the DSH plugin market. Go back and try again.';
      dismiss.focus();
    }

    current = view;
    window.addEventListener('message', view.receive);
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => { if (current === view) close(); });
    dialog.append(loading, frame);
    frame.src = frameUrl.href;
    document.body.append(dialog);
    dialog.showModal();
    view.timeout = window.setTimeout(fail, 10000);
    return true;
  }

  window.OpenBotDshHub = Object.freeze({ open, close });
}());
