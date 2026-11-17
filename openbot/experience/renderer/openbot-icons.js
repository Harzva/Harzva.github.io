/* OpenBot utility icons. Original 24-unit vectors, MIT (same license as OpenBot). */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) { root.OpenBotIcons = api; api.mount(root.document); }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var brand = typeof module === 'object' && module.exports ? require('./openbot-brand') : window.OpenBotBrand;
  var paths = {
    board: '<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/><path d="M3 14h7m4 0h7"/>',
    chat: '<path d="M8 19H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-6l-5 3v-3Z"/><path d="M7 9h10M7 13h7"/>',
    folder: '<path d="M3 8V6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Zm0 2h18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    pencil: '<path d="m15 5 4 4M4 20l4.5-1L20 7.5a2.8 2.8 0 0 0-4-4L4.5 15 4 20Z"/>',
    more: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 9 3 3-3 3M13 15h4"/>',
    dispatch: '<rect x="3" y="9" width="12" height="12" rx="2.5"/><path d="M10 14 21 3m-7 0h7v7"/>',
    organization: '<rect x="8" y="3" width="8" height="6" rx="1.5"/><rect x="2.5" y="16" width="7" height="5" rx="1.5"/><rect x="14.5" y="16" width="7" height="5" rx="1.5"/><path d="M12 9v4m-6 3v-3h12v3"/>',
    context: '<rect x="7" y="3" width="13" height="16" rx="2"/><path d="M16 22H6a2 2 0 0 1-2-2V7M11 8h5M11 12h5"/>',
    settings: '<path d="m10 3-.6 2.4-2 .9L5.2 5 3 8.8l1.7 1.6v2.4L3 14.4l2.2 3.8 2.2-1.3 2 .9.6 2.4h4l.6-2.4 2-.9 2.2 1.3 2.2-3.8-1.7-1.6v-2.4L21 8.8 18.8 5l-2.2 1.3-2-.9L14 3h-4Z"/><circle cx="12" cy="11.6" r="3.1"/>',
    inspector: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M15 4v16M18 9v6"/>',
    inspectorClose: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M15 4v16m-5-11-3 3 3 3"/>',
    monitor: '<rect x="3" y="4" width="18" height="13" rx="2.5"/><path d="M12 17v4M8 21h8"/>',
    hand: '<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11m0-5V5a1.5 1.5 0 0 1 3 0v6m0-4.5a1.5 1.5 0 0 1 3 0V12m0-2a1.5 1.5 0 0 1 3 0v4.5a6.5 6.5 0 0 1-6.5 6.5H12a6 6 0 0 1-4.6-2.2l-4-4.8a1.5 1.5 0 0 1 2.2-2l2.4 2V12Z"/>',
    play: '<path d="m8 4 12 8-12 8V4Z"/>',
    external: '<path d="M13 4h7v7m0-7L10 14M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    minimize: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M8 16h8"/>',
    refresh: '<path d="M20 10a8 8 0 0 0-14-4L3 9m0-5v5h5m-4 5a8 8 0 0 0 14 4l3-3m0 5v-5h-5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="m3 3 18 18M10 5.2a11.6 11.6 0 0 1 2-.2c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.1M6.2 6.2A18.7 18.7 0 0 0 2 12s3.5 7 10 7a11.7 11.7 0 0 0 5.1-1.2M10 10a2.8 2.8 0 0 0 4 4"/>',
    arrowUp: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
    arrowLeft: '<path d="M19 12H5m7 7-7-7 7-7"/>',
    send: '<path d="m3 4 18 8-18 8 3-8-3-8Zm3 8h15"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4.5 4.5L19 7"/>',
    cloud: '<path d="M6.5 18a4.5 4.5 0 1 1-.1-9A6 6 0 0 1 18 7.5h.5a5.25 5.25 0 1 1 0 10.5h-12Z"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    upload: '<path d="M12 15V3m-5 5 5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    plug: '<path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v4"/>',
    key: '<circle cx="8" cy="8" r="5"/><path d="m11.5 11.5 9 9M16 16l3-3m-6 0 3-3"/>',
    shield: '<path d="m12 3 8 3v6c0 4.5-4 7.8-8 9-4-1.2-8-4.5-8-9V6l8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    document: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8M8 17h5"/>',
    pin: '<path d="M9.5 3h5l-.8 4.6 3.3 2.9v1.5H7v-1.5l3.3-2.9L9.5 3Z"/><path d="M12 12v9"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M9.5 12h5"/>'
  };
  function svg(name, decorative) {
    if (name === 'openbot') return brand.svg('blue', undefined, decorative === true);
    if (!paths[name]) return '';
    return '<svg class="ob-icon" data-ob-icon="'+name+'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+paths[name]+'</svg>';
  }
  function mount(doc) {
    var observer, queued = false;
    var mappings = {
      'btn-cloud':'cloud', 'btn-agents':'terminal', 'btn-hidden-bots':'folder', 'btn-new-bot':'plus', 'empty-new':'plus',
      'btn-task':'dispatch', 'btn-organize':'organization', 'btn-jarvis-toggle':'organization', 'btn-ctx':'context', 'btn-space-mode':'folder', 'btn-settings':'settings', 'btn-more':'more', 'btn-bot-dashboard':'board', 'btn-meetings':'chat',
      'btn-pin-active-bot':'pin', 'btn-hide-active-bot':'archive',
      'menu-cloud':'cloud', 'menu-agents':'terminal', 'menu-app-settings':'settings',
      'ws-screen-shot':'refresh', 'ws-screen-send':'send', 'set-node':'cloud',
      'set-fleet-export':'download', 'set-fleet-import':'upload', 'set-test':'plug', 'set-save':'check',
      'org-close':'close', 'ctx-close':'close', 'agent-refresh':'refresh',
      'fleet-export':'download', 'fleet-import':'upload', 'fleet-push':'upload', 'fleet-pull':'download'
    };
    function decorateButton(button, name) {
      if (!button || !name) return;
      var current = button.querySelector(':scope > .ob-icon');
      var label = button.textContent.trim();
      if (!current || current.getAttribute('data-ob-icon') !== name) {
        if (current) current.remove();
        button.insertAdjacentHTML('afterbegin', svg(name));
      }
      button.classList.add('ob-icon-action');
      if (label && !button.querySelector(':scope > .ob-action-label')) {
        var span = doc.createElement('span'); span.className = 'ob-action-label';
        Array.from(button.childNodes).filter(function(n){ return !(n.nodeType === 1 && n.classList.contains('ob-icon')); }).forEach(function(n){ span.appendChild(n); });
        // The native new-bot control used an ASCII plus before the vector existed.
        if (button.id === 'btn-new-bot') span.textContent = label.replace(/^\+\s*/, '');
        button.appendChild(span);
      }
      if (label && (!button.hasAttribute('aria-label') || button.dataset.obLabel === 'generated')) {
        var accessible = label.replace(/^\+\s*/, '');
        if (button.getAttribute('aria-label') !== accessible) button.setAttribute('aria-label', accessible);
        button.dataset.obLabel = 'generated';
      }
      if (['btn-ctx','toggle-config','org-close'].includes(button.id)) {
        if (!button.dataset.obOriginalTitle) button.dataset.obOriginalTitle = button.title || 'label';
        button.title = button.dataset.obOriginalTitle === 'label' ? label : button.dataset.obOriginalTitle;
      }
    }
    function decorateMark(node) {
      if (!node) return;
      // Only the product identity gets the living eye detail. Empty-state hint
      // marks remain the quiet static identity and never compete with the Bot.
      var isProductMark = node.matches && node.matches('.brand .logo');
      var current = node.querySelector('[data-ob-icon="openbot"]');
      if (current && (!isProductMark || current.hasAttribute('data-ob-brand-eyes'))) return;
      node.innerHTML = svg('openbot', isProductMark);
    }
    function controlState(button, state, cues) {
      if (!button) return false;
      if (button.dataset.controlState) return button.dataset.controlState === state;
      var label=button.textContent.trim();
      // Legacy screen controls use authored labels; recognize both locales.
      return cues.some(function(cue){return label===cue||label.indexOf(cue+' ')===0;});
    }
    function render() {
      queued = false; observer.disconnect();
      try {
        Object.keys(mappings).forEach(function(id){ decorateButton(doc.getElementById(id), mappings[id]); });
        var panel = doc.getElementById('toggle-config');
        decorateButton(panel, panel && (panel.getAttribute('aria-expanded')==='true'||controlState(panel,'open',['隐藏设置','收起 Bot 设置','Hide settings','Collapse Bot settings'])) ? 'inspectorClose' : 'inspector');
        var control = doc.getElementById('ws-screen-control');
        decorateButton(control, controlState(control,'human',['交还 Bot','Return to Bot']) ? 'play' : 'hand');
        var show = doc.getElementById('ws-screen-show');
        decorateButton(show, controlState(show,'visible',['隐藏','隐藏屏幕','Hide','Hide screen']) ? 'minimize' : 'external');
        var toggle = doc.getElementById('ws-screen-toggle');
        decorateButton(toggle, controlState(toggle,'running',['关闭','关闭屏幕','Close','Close screen']) ? 'eyeOff' : 'eye');
        var send = doc.getElementById('btn-send');
        decorateButton(send, send && send.classList.contains('stop') ? 'stop' : 'arrowUp');
        doc.querySelectorAll('.view-tab').forEach(function(b){ decorateButton(b, b.dataset.view === 'board' ? 'board' : b.dataset.view === 'space' ? 'folder' : 'chat'); });
        doc.querySelectorAll('.hint-action').forEach(function(b){ decorateButton(b, b.dataset.action === 'agent' ? 'terminal' : 'settings'); });
        doc.querySelectorAll('[data-approval-allow]').forEach(function(b){ decorateButton(b, 'check'); });
        doc.querySelectorAll('[data-approval-deny],[data-approval-stop]').forEach(function(b){ decorateButton(b, b.hasAttribute('data-approval-stop') ? 'stop' : 'close'); });
        decorateMark(doc.querySelector('.brand .logo'));
        doc.querySelectorAll('.hint-mark').forEach(decorateMark);
        doc.querySelectorAll('.screen-workspace-placeholder').forEach(function(el){
          if (el.querySelector('.ob-placeholder-copy')) return;
          var copy = doc.createElement('span'); copy.className = 'ob-placeholder-copy';
          while (el.firstChild) copy.appendChild(el.firstChild);
          el.insertAdjacentHTML('afterbegin', svg('monitor')); el.appendChild(copy);
        });
      } finally {
        observer.observe(doc.body, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['class','title'] });
      }
    }
    function schedule() { if (!queued) { queued = true; rootRequest(render); } }
    function rootRequest(fn) { doc.defaultView.requestAnimationFrame(fn); }
    function start() { observer = new doc.defaultView.MutationObserver(schedule); render(); }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start, {once:true});
    else start();
  }
  return { names:['openbot'].concat(Object.keys(paths)), svg:svg, mount:mount };
});
