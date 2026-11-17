/* Minimal host for the upstream DSH client slots. Requests stay inside this origin. */
(function () {
  'use strict';

  const prefix = 'openbot-dsh-hub:';
  const params = new URLSearchParams(location.search);
  const language = params.get('lang') === 'zh' ? 'zh' : 'en';
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  const send = (name, fields = {}) => {
    // The parent is a local file: URL. Only send presentation events; the
    // renderer separately verifies the message source and this frame's origin.
    window.parent.postMessage({ ...fields, type: prefix + name }, '*');
  };

  const runtime = window.OpenBotDshReact;
  const slots = new Map();
  const dictionaries = new Map();
  const effects = [];
  const close = () => send('close');
  const host = {
    effect(start) {
      const dispose = start();
      if (typeof dispose === 'function') effects.push(dispose);
    },
    locale: {
      register(namespace, entries) { dictionaries.set(namespace, entries); },
      bind(namespace) {
        const entries = dictionaries.get(namespace);
        return (key, values = {}) => {
          const entry = entries?.[language]?.[key] ?? entries?.en?.[key] ?? key;
          return entry.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) => (
            Object.hasOwn(values, name) ? String(values[name]) : match
          ));
        };
      }
    },
    slots: {
      inject(_name, register) { return register(); },
      register(slot, component) { slots.set(slot.name, { slot, component }); }
    },
    get(name) {
      return name === 'layout' ? { selectPanel: (panel) => { if (panel === null) close(); } } : undefined;
    }
  };

  let root;
  window.__ModuleLoader__ = Object.freeze({
    load({ id, factory }) {
      try {
        if (id !== '@dsh-fish/hub' || root || !runtime) throw new Error('Unexpected Hub client');
        const client = factory((name) => {
          if (name === 'react') return runtime.React;
          if (name === 'react/jsx-runtime') return runtime.jsxRuntime;
          throw new Error('Unsupported Hub dependency: ' + name);
        });
        client.apply(host);
        const { slot, component } = slots.get('main') || {};
        if (slot?.key !== client.PANEL_ID || typeof component !== 'function') throw new Error('Hub slot unavailable');

        const React = runtime.React;
        class MarketErrorBoundary extends React.Component {
          state = { failed: false };
          static getDerivedStateFromError() { return { failed: true }; }
          componentDidCatch() { send('error'); }
          render() { return this.state.failed ? null : this.props.children; }
        }
        const props = { t: host.locale.bind(slot.locale), ...slot.inject?.() };
        function Market() {
          React.useEffect(() => { send('ready'); }, []);
          return React.createElement(component, props);
        }
        root = runtime.createRoot(document.getElementById('hub-root'));
        root.render(React.createElement(MarketErrorBoundary, null, React.createElement(Market)));
      } catch (error) {
        console.error('dsh.fish client could not start', error);
        send('error');
      }
    }
  });

  // Upstream has its own Escape handler for artifact details. One Escape
  // closes that detail; only the next returns from the market to conversation.
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || document.querySelector('.dshFish__modalOverlay')) return;
    event.preventDefault();
    close();
  }, true);

  // The frame cannot open popups or navigate its parent. Forward only actual
  // link activations, without granting the embedded page any preload methods.
  const openLink = (event) => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || anchor.getAttribute('href').startsWith('#')) return;
    event.preventDefault();
    if (!event.isTrusted || (event.type === 'auxclick' && event.button !== 1)) return;
    let url;
    try { url = new URL(anchor.href); } catch { return; }
    if (url.protocol === 'https:' && !url.username && !url.password) send('external', { url: url.href });
  };
  document.addEventListener('click', openLink, true);
  document.addEventListener('auxclick', openLink, true);

  window.addEventListener('pagehide', () => {
    root?.unmount();
    for (const dispose of effects.reverse()) dispose();
  }, { once: true });
}());
