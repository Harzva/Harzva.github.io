window.OpenBotPublicPreviewVersion = "1.0.33";
/* Public, synthetic product walkthrough. No bridge, network or persisted state. */
(function () {
  'use strict';
  var english = new URLSearchParams(location.search).get('uiLanguage') === 'en';
  var pairs = english ? [
    ['Help me prepare the next OpenBot preview.', 'Start with three checks: the source version, the installation path and the documentation. Keep each result easy to verify.'],
    ['How should the team divide the work?', 'HarvisBrain keeps the goal and gathers results. ScoutBot can review documentation; DesignBot can check the interface.'],
    ['Can I keep one conversation?', 'Yes. Brain mode keeps the main Bot in view. Open the workspace whenever you want to inspect the team.'],
    ['Where do models run?', 'Choose your own model and Harness for each Bot. This public preview runs the interface only; it does not call a model.'],
    ['What happens to unfinished work?', 'The app records task state. An interrupted task needs an explicit decision before actions are repeated.'],
    ['Can I use my own computer?', 'Start on a Mac and add a self-hosted Node when you need remote execution. Each connection and permission is explicit.'],
    ['How do I find an earlier question?', 'Hover or focus the small history marks. Open the full directory, or use the arrow keys to browse.'],
    ['Let me explore the interface.', 'Try the Bot settings, the Board or Brain mode. These are the same interface components used by the desktop app.']
  ] : [
    ['帮我梳理 OpenBot 下一次预览的准备工作。', '先确认三件事：源码版本、安装路径和文档入口。每一项都留下可以核对的结果。'],
    ['我们可以怎样分工？', 'HarvisBrain 保持目标并汇总结果；ScoutBot 可以核对文档，DesignBot 可以检查界面。'],
    ['我希望平时只保留一个对话。', '可以切换到贾维斯模式，由主脑承接对话。需要时再展开工作区，查看伙伴和已有记录。'],
    ['每个 Bot 都能选择自己的模型吗？', '模型和 Harness 可以按 Bot 配置。这里是公开界面演示，不连接模型，也不会产生模型回复。'],
    ['没有完成的任务应该怎样处理？', '应用记录任务状态。发生中断时先确认下一步，避免静默重复有副作用的操作。'],
    ['一定需要云服务器吗？', '可以先在 Mac 使用，再按需要连接自建 Node。连接目标和执行权限都应明确配置。'],
    ['长聊天里怎样找到之前的问题？', '悬停或聚焦侧边刻度可以预览问答，也能展开完整目录。进入导航后，用方向键浏览问题。'],
    ['让我自己点点看。', '可以切换 Bot、打开矩阵、查看设置或进入贾维斯模式。这里直接使用桌面 App 的同一套界面组件。']
  ];
  function bot(id, name, avatar, persona, entries) {
    return { id: id, name: name, avatar: avatar, color: '#075bff', model: '', harness: 'dsh', toolsEnabled: false,
      containerEnabled: false, persona: persona, messages: entries.flatMap(function (pair, i) {
        return [{ role: 'user', text: pair[0], ts: 1792483200000 + i * 2000 },
          { role: 'bot', text: pair[1], ts: 1792483201000 + i * 2000 }];
      }), files: [], skills: [], channels: {}, memory: { profile: '', journal: [] } };
  }
  var bots = [bot('preview-brain', 'HarvisBrain', 'orbit', english ? 'Keep the goal clear and gather results.' : '明确目标，拆解工作，汇总可核对的结果。', pairs),
    bot('preview-scout', 'ScoutBot', 'pal-sprout', english ? 'Review sources and documentation.' : '核对来源与文档，区分事实和待验证事项。',
      [[english ? 'Review the setup guide.' : '核对上手文档。', english ? 'I would separate local, LAN and remote setup, then check the prerequisites for each.' : '我会把本机、同 Wi-Fi 和远端节点分开整理，再核对各自的准备条件。']]),
    bot('preview-design', 'DesignBot', 'pal-tuantuan', english ? 'Check clear, compact interfaces.' : '检查界面层级、可读性和交互边界。',
      [[english ? 'Review the conversation view.' : '检查聊天界面的细节。', english ? 'I would check light and dark themes, long messages, keyboard focus and the compact window.' : '我会检查深浅主题、长消息、键盘焦点，以及窄窗口中的布局。']])];
  var compact = innerWidth < 680;
  window.OpenBotPublicDemoFixture = { version: 7, bots: bots, activeId: bots[0].id, primaryBotId: bots[0].id,
    configOpen: false, orgMinimal: compact, botMode: compact ? 'jarvis' : 'all', view: 'chat', showProgress: true, showToolDetails: false,
    showBotInteractions: true, chatHistorySide: 'left', shared: { files: [], skills: [] } };
  // A small public-demo protocol, never an App bridge. Only fixed, read-only
  // navigation steps are accepted from this iframe's own embedding page.
  var session = '', epoch = 0, generation = 0, edited = false, composing = false;
  var lastActivity = -Infinity, lastMove = -Infinity, stateQueued = false;
  var expectedParent = new URL(location.href).origin;
  var scenes = { brain: 'preview-brain', scout: 'preview-scout', design: 'preview-design', board: '' };
  function visible(element) { return !!(element && element.getClientRects().length); }
  function editable(element) { return !!(element && element.matches('input,textarea,select,[contenteditable="true"],[contenteditable=""]')); }
  function currentScene() {
    if (document.body && document.body.dataset.view === 'board') return 'board';
    var selected = document.querySelector('#bot-list .bot-item.active');
    var id = selected && selected.dataset.id;
    return Object.keys(scenes).find(function (key) { return scenes[key] === id; }) || '';
  }
  function blockedReason() {
    if (edited) return 'edited';
    if (document.body && document.body.dataset.botMode && document.body.dataset.botMode !== 'all') return 'mode';
    if (composing || (document.hasFocus() && editable(document.activeElement))) return 'editing';
    if (String(window.getSelection() || '').trim()) return 'selection';
    if (Array.from(document.querySelectorAll('dialog[open],[role="dialog"],[role="menu"],[popover],.del-confirm:not(.hidden)')).some(visible)) return 'dialog';
    return '';
  }
  function post(type, data) {
    if (!session) return;
    parent.postMessage(Object.assign({ type: type, version: 1, session: session }, data), expectedParent);
  }
  function reportState() {
    var reason = blockedReason();
    post('openbot-preview-state', { blocked: !!reason, edited: edited, reason: reason, scene: currentScene() });
  }
  function queueState() {
    if (stateQueued) return;
    stateQueued = true;
    requestAnimationFrame(function () { stateQueued = false; reportState(); });
  }
  function onIntent(event) {
    if (!event.isTrusted) return;
    // Preserve modified sessions, including private native drafts belonging to
    // a different Bot. Only an explicit frame reset clears this flag.
    if (['beforeinput', 'input', 'change', 'compositionstart'].indexOf(event.type) >= 0) edited = true;
    if (event.type === 'click' && event.target instanceof Element && event.target.closest(
      '.avatar-option,.swatch,[data-tag-remove],#cfg-tag-add,#del-yes,#cfg-unbind,#btn-send,' +
      '[data-del-file],[data-del-skill],[data-del-journal],[data-import-file],[data-import-skill],' +
      '[data-remove-shared-file],[data-remove-shared-skill]')) edited = true;
    if (event.type === 'compositionstart') composing = true;
    if (event.type === 'compositionend') composing = false;
    var now = performance.now();
    if (event.type === 'pointermove' && now - lastMove < 100) return;
    if (event.type === 'pointermove') lastMove = now;
    lastActivity = now;
    generation += 1;
    post('openbot-preview-activity', { kind: event.type, edited: edited });
    queueState();
  }
  ['pointermove', 'pointerdown', 'click', 'keydown', 'wheel', 'touchstart', 'touchmove', 'beforeinput', 'input', 'change', 'compositionstart', 'compositionend', 'dragstart'].forEach(function (type) {
    document.addEventListener(type, onIntent, { capture: true, passive: true });
  });
  // Focus and native programmatic scroll are not physical user input. Focus is
  // only a guard; otherwise native navigation could stop its own demonstration.
  ['focusin', 'focusout', 'selectionchange'].forEach(function (type) { document.addEventListener(type, queueState); });
  window.addEventListener('focus', queueState);
  window.addEventListener('blur', queueState);
  document.addEventListener('visibilitychange', function () { generation += 1; queueState(); });
  function click(selector) {
    var element = document.querySelector(selector);
    if (!visible(element) || element.disabled) return false;
    element.click();
    return true;
  }
  function showScene(scene) {
    // No sends, edits, permissions, connections, execution or arbitrary targets.
    if (scene === 'board') return click('#bot-header .view-tab[data-view="board"]');
    // A manually chosen scope may hide a worker. Preflight before switching
    // views so an unavailable scene never partially navigates the App.
    if (!visible(document.querySelector('#bot-list [data-id="' + scenes[scene] + '"] .bot-select'))) return false;
    if (!click('#bot-header .view-tab[data-view="chat"]')) return false;
    return click('#bot-list [data-id="' + scenes[scene] + '"] .bot-select');
  }
  window.addEventListener('message', function (event) {
    if (event.source !== parent || event.origin !== expectedParent) return;
    var m = event.data;
    if (!m || m.type !== 'openbot-preview-control' || m.version !== 1 ||
      typeof m.session !== 'string' || !/^[a-f0-9]{32}$/.test(m.session) ||
      !Number.isSafeInteger(m.epoch) || m.epoch < 0) return;
    if (m.action === 'connect') {
      if (session && m.session !== session) return;
      session = m.session; epoch = Math.max(epoch, m.epoch); reportState(); return;
    }
    if (!session || m.session !== session || m.epoch < epoch) return;
    if (m.action === 'stop') { epoch = m.epoch; generation += 1; reportState(); return; }
    if (m.action !== 'show' || !Object.prototype.hasOwnProperty.call(scenes, m.scene) ||
      ['auto', 'manual'].indexOf(m.mode) < 0 || !Number.isSafeInteger(m.requestId) || m.requestId < 1) return;
    epoch = m.epoch;
    var reason = blockedReason();
    if (!reason && document.hidden) reason = 'hidden';
    if (!reason && m.mode === 'auto' && performance.now() - lastActivity < 20000) reason = 'activity';
    if (reason) {
      post('openbot-preview-result', { epoch: epoch, requestId: m.requestId, ok: false, scene: m.scene, reason: reason });
      reportState(); return;
    }
    var ownGeneration = ++generation, ownEpoch = epoch;
    var ok = showScene(m.scene);
    requestAnimationFrame(function () {
      if (generation !== ownGeneration || epoch !== ownEpoch) return;
      // Give acknowledgement only after the real renderer has mounted the
      // requested state. The parent never infers success from a timer alone.
      var actual = currentScene();
      post('openbot-preview-result', { epoch: ownEpoch, requestId: m.requestId,
        ok: ok && actual === m.scene, scene: m.scene, reason: ok && actual === m.scene ? '' : 'unavailable' });
      reportState();
    });
  });
  document.addEventListener('DOMContentLoaded', function () {
    var version = document.getElementById('app-ver');
    if (version && window.OpenBotPublicPreviewVersion) version.textContent = 'v' + window.OpenBotPublicPreviewVersion;
    // Readiness is reported only after the real App has mounted its controls.
    var attempts = 0;
    var timer = setInterval(function () {
      if (document.querySelector('#chat-input') && document.querySelector('#bot-list .bot-item')) {
        clearInterval(timer); parent.postMessage({ type: 'openbot-preview-ready', version: 1, demoProtocol: 1, appVersion: window.OpenBotPublicPreviewVersion }, expectedParent);
      } else if (++attempts >= 100) clearInterval(timer);
    }, 50);
  }, { once: true });
})();
