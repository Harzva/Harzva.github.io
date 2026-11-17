(function (root) {
  'use strict';

  var document = root.document;
  var state = {
    initialized: false,
    visible: false,
    status: null,
    busy: '',
    statusRequest: 0,
    statusLoading: false,
    statusPromise: null,
    statusQueued: false,
    statusQueuedQuiet: true,
    pollTimer: 0,
    unsubscribe: null,
    plan: null,
    planSignature: '',
    planModels: Object.create(null),
    planSignOutConfirm: Object.create(null),
    bindingDrafts: Object.create(null),
    loginHints: Object.create(null),
    message: '',
    messageState: 'idle'
  };
  var els = {};

  function tr(zh, en, params) {
    return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function'
      ? root.OpenBotI18n.t(zh, en, params) : zh;
  }

  function node(tag, className, text) {
    var item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined && text !== null) item.textContent = String(text);
    return item;
  }

  function append(parent) {
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]);
  }

  function button(label, action, className, focusKey) {
    var item = node('button', 'btn' + (className ? ' ' + className : ''), label);
    item.type = 'button';
    item.dataset.mcAction = action || '';
    if (focusKey) item.dataset.mcFocusKey = focusKey;
    return item;
  }

  function field(id, labelText, control, className) {
    var wrapper = node('label', 'multi-home-field' + (className ? ' ' + className : ''));
    wrapper.htmlFor = id;
    append(wrapper, node('span', '', labelText), control);
    return wrapper;
  }

  function apiMethod(name) {
    return root.grokbot && typeof root.grokbot[name] === 'function' ? root.grokbot[name] : null;
  }

  function callAction(action, input) {
    var method = apiMethod('multiCodexHomeAction');
    if (!method) return Promise.reject(new Error(tr(
      '此功能需要更新后的 Bot Studio 桌面版。',
      'This feature requires an updated Bot Studio desktop app.'
    )));
    return Promise.resolve().then(function () {
      return method.call(root.grokbot, { action: action, input: input || {} });
    });
  }

  function resultOrThrow(result, fallback) {
    if (result && result.ok === true) return result;
    var code = result && result.code;
    var message = result && result.message;
    var error = new Error(errorText({ code: code, message: message }, fallback));
    error.code = code || 'MULTI_CODEX_HOME_FAILED';
    throw error;
  }

  function safeText(value) {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') return String(value.message || value.code || '');
    return '';
  }

  function errorText(value, fallback) {
    var code = typeof value === 'string' ? value : value && value.code;
    var message = value && typeof value === 'object' ? safeText(value.message) : '';
    var known = {
      CODEX_HOME_BUSY: [
        'Home 正在执行任务或有活动终端，或执行状态尚未确认；请先处理后重试。',
        'A task or terminal is active on this Home, or its execution state is unconfirmed. Resolve it before retrying.'
      ],
      CODEX_LOGIN_BUSY: [
        '另一个 Home 正在登录；请完成或取消该登录后再试。',
        'Another Home is signing in. Complete or cancel that sign-in, then try again.'
      ],
      EXECUTOR_BUSY: [
        '此 BOT 有正在执行的任务或活动终端，暂时无法切换执行器。',
        'This BOT has an active task or terminal, so its executor cannot be changed yet.'
      ],
      EXECUTOR_STALE_REVISION: [
        'BOT 设置已变化；刷新状态后重新选择。',
        'The BOT settings changed. Refresh status and choose it again.'
      ],
      CODEX_HOME_IDENTITY_CHANGED: [
        'Home 文件夹身份已变化；请刷新并检查路径。',
        'The Home folder identity changed. Refresh status and check its path.'
      ],
      CODEX_BINARY_CHANGED: [
        'Codex CLI 文件已变化；请刷新状态后重试。',
        'The Codex CLI changed. Refresh status before trying again.'
      ],
      CODEX_HOME_OPERATION_STALE: [
        'Home 服务状态已变化；请刷新后重试。',
        'The Home server state changed. Refresh before trying again.'
      ],
      CODEX_LOGIN_NOT_PENDING: [
        '当前没有可取消的登录。',
        'There is no sign-in waiting to be canceled.'
      ],
      CODEX_LOGIN_BROWSER_FAILED: [
        '浏览器未能打开登录页，登录已取消。请检查默认浏览器后重试。',
        'The sign-in page could not be opened, so sign-in was canceled. Check your default browser and try again.'
      ],
      CHATGPT_PLAN_NOT_ENABLED: [
        '此账号尚未允许使用 ChatGPT 订阅。请明确同意后再刷新模型。',
        'This account has not allowed ChatGPT plan use. Give explicit consent before refreshing models.'
      ],
      CHATGPT_SIGN_IN_REQUIRED: [
        'ChatGPT 授权需要续期或重新登录。',
        'ChatGPT authorization needs renewal or sign-in.'
      ],
      CHATGPT_LOGIN_NOT_PENDING: [
        '当前没有等待中的 ChatGPT 登录。',
        'There is no pending ChatGPT sign-in to cancel.'
      ],
      CHATGPT_MODEL_LIST_INVALID: [
        'ChatGPT 未返回可用的模型列表。',
        'ChatGPT did not return a usable model list.'
      ],
      CHATGPT_HOME_HAS_NATIVE_AUTH: [
        '此 Home 已有原生 Codex 认证；请勿切换其认证方式。',
        'This Home already has native Codex authentication and cannot switch authentication modes.'
      ],
      CHATGPT_HOME_NOT_EMPTY: [
        'ChatGPT 订阅只能关联到新建且未使用的空 Home。',
        'ChatGPT plan can only be attached to a newly created, unused empty Home.'
      ],
      CHATGPT_HOME_ALREADY_ATTACHED: [
        '此 Home 已关联到另一个 ChatGPT 账号。',
        'This Home is already associated with another ChatGPT account.'
      ],
      CHATGPT_CONFIG_UNSAFE: [
        '此 Home 或项目配置不符合 ChatGPT 订阅执行要求。任务未发送；请检查 Home 和项目配置后重试。',
        'The Home or project configuration does not meet ChatGPT plan execution requirements. The task was not sent; check the Home and project configuration, then retry.'
      ],
      CHATGPT_CONFIG_CHANGED: [
        '检查后，Home 或项目配置发生变化。任务未发送；请检查 Home 和项目配置后重试。',
        'The Home or project configuration changed after the check. The task was not sent; check the Home and project configuration, then retry.'
      ],
      CODEX_RUNTIME_UNAVAILABLE: [
        '未检测到 Codex 运行时。安装 Codex CLI 或 Codex 桌面版后重试。',
        'No Codex runtime was detected. Install Codex CLI or Codex desktop, then retry.'
      ]
    };
    if (code && known[code]) return tr(known[code][0], known[code][1]);
    if (message && message !== code) return message;
    return code || fallback || tr('本机 Codex 操作失败。', 'The local Codex operation failed.');
  }

  function codexRuntimeAvailable() {
    return !!(state.status && state.status.runtime && state.status.runtime.available === true);
  }

  function codexRuntimeMissingText() {
    return tr(
      '未检测到 Codex 运行时。安装 Codex CLI 或 Codex 桌面版后，才能启动 App Server、原生登录、检查账号和绑定 BOT；Home 管理仍可使用。',
      'No Codex runtime detected. Install Codex CLI or Codex desktop to start App Servers, use native sign-in/account checks, and bind Bots. Home management remains available.'
    );
  }

  function codexRuntimeSourceLabel(source) {
    switch (source) {
      case 'chatgpt-desktop': return tr('ChatGPT 桌面版', 'ChatGPT desktop');
      case 'codex-desktop': return tr('Codex 桌面版', 'Codex desktop');
      case 'local-cli': return tr('本机 Codex CLI', 'local Codex CLI');
      default: return tr('来源未提供', 'source not reported');
    }
  }

  function codexRuntimeSummary(runtime) {
    if (!runtime || runtime.available !== true) return codexRuntimeMissingText();
    var summary = tr('已检测到 Codex 运行时：{source}', 'Codex runtime detected: {source}', {
      source: codexRuntimeSourceLabel(runtime.source)
    });
    return runtime.path ? summary + ' · ' + String(runtime.path) : summary;
  }

  function setMessage(value, tone) {
    state.message = value || '';
    state.messageState = tone || 'idle';
    if (!els.message) return;
    els.message.textContent = state.message;
    els.message.dataset.state = state.messageState;
  }

  function build() {
    var host = document.getElementById('multi-codex-home-root');
    if (!host || state.initialized) return false;
    state.initialized = true;
    host.replaceChildren();

    var section = document.getElementById('multi-codex-home-section');
    if (section) section.classList.add('apps-card', 'apps-multi-codex-home-card');

    var header = node('header', 'multi-home-header');
    var heading = node('div', 'multi-home-heading');
    var titleRow = node('div', 'multi-home-title-row');
    var title = node('h3', '', tr('Codex 多账号', 'Codex accounts'));
    title.id = 'multi-codex-home-title';
    els.status = node('span', 'multi-home-status', tr('尚未读取', 'Not checked'));
    els.status.id = 'multi-codex-home-status';
    els.status.setAttribute('role', 'status');
    els.status.setAttribute('aria-live', 'polite');
    els.status.dataset.state = 'idle';
    els.refresh = button(tr('刷新', 'Refresh'), 'refresh', '', 'refresh');
    titleRow.append(title, els.status, els.refresh);
    var description = node('p', 'multi-home-description', tr(
      '每个 Home 使用独立账号与配置；每个 Home 的 Codex App Server 可单独启动和停止。',
      'Each Home keeps its own account and configuration. Its Codex App Server can be started and stopped separately.'
    ));
    heading.append(titleRow, description);
    header.appendChild(heading);
    host.appendChild(header);

    els.message = node('p', 'multi-home-message');
    els.message.id = 'multi-codex-home-message';
    els.message.setAttribute('role', 'status');
    els.message.setAttribute('aria-live', 'polite');
    els.message.setAttribute('aria-atomic', 'true');
    host.appendChild(els.message);

    els.meta = node('p', 'multi-home-meta');
    els.meta.id = 'multi-codex-home-meta';
    host.appendChild(els.meta);

    els.homesTitle = node('h4', 'multi-home-section-title', tr('Homes', 'Homes'));
    els.homeList = node('ul', 'multi-home-list');
    els.homeList.id = 'multi-codex-home-list';
    els.homeList.setAttribute('aria-labelledby', 'multi-codex-home-homes-title');
    els.homesTitle.id = 'multi-codex-home-homes-title';
    var homeSection = node('section', 'multi-home-homes');
    homeSection.setAttribute('aria-labelledby', els.homesTitle.id);
    append(homeSection, els.homesTitle, els.homeList);
    host.appendChild(homeSection);

    buildEditor(host);

    els.refresh._mcDisabled = function () { return !apiMethod('multiCodexHomeAction'); };
    els.refresh.addEventListener('click', function () { refreshStatus(false); });
    renderStatus();
    setMessage(apiMethod('multiCodexHomeAction')
      ? tr('打开此页时读取本机 Codex 状态；不会自动启动服务或登录。', 'Local Codex status is read when this page opens. Services and sign-in are never started automatically.')
      : tr('此功能需要 Bot Studio 桌面版。', 'This feature requires the Bot Studio desktop app.'),
      apiMethod('multiCodexHomeAction') ? 'idle' : 'error');
    updateControls();
    subscribeChanges();
    watchVisibility();
    return true;
  }

  function buildEditor(host) {
    els.editor = node('details', 'multi-home-editor');
    els.editorSummary = node('summary', '', tr('创建或导入 Home', 'Create or import a Home'));
    var editorBody = node('div', 'multi-home-editor-body');
    var editorIntro = node('p', 'multi-home-editor-note', tr(
      '先预览名称、路径和操作，再明确确认创建或导入。导入会沿用该 Home 现有的配置与认证文件。',
      'Preview the name, path and actions first, then explicitly confirm. Import uses the Home’s existing configuration and authentication files.'
    ));
    els.editorForm = document.createElement('form');
    els.editorForm.id = 'multi-codex-home-editor-form';

    els.kind = document.createElement('select');
    els.kind.id = 'multi-codex-home-kind';
    els.kind.dataset.mcFocusKey = 'editor-kind';
    els.kind.append(
      makeOption('create', tr('新建空 Home', 'Create an empty Home')),
      makeOption('import', tr('导入已有 Home', 'Import an existing Home'))
    );
    els.alias = document.createElement('input');
    els.alias.id = 'multi-codex-home-alias';
    els.alias.name = 'alias';
    els.alias.autocomplete = 'off';
    els.alias.required = true;
    els.alias.maxLength = 64;
    els.alias.dataset.mcFocusKey = 'editor-alias';
    els.alias.placeholder = tr('例如：work', 'For example: work');
    els.label = document.createElement('input');
    els.label.id = 'multi-codex-home-label';
    els.label.name = 'label';
    els.label.autocomplete = 'off';
    els.label.maxLength = 100;
    els.label.dataset.mcFocusKey = 'editor-label';
    els.label.placeholder = tr('显示名称', 'Display name');
    els.path = document.createElement('input');
    els.path.id = 'multi-codex-home-path';
    els.path.name = 'path';
    els.path.autocomplete = 'off';
    els.path.spellcheck = false;
    els.path.placeholder = tr('已有 Home 的绝对路径', 'Absolute path to an existing Home');
    els.path.dataset.mcFocusKey = 'editor-path';

    els.kindField = field(els.kind.id, tr('操作', 'Action'), els.kind);
    els.aliasField = field(els.alias.id, tr('别名', 'Alias'), els.alias);
    els.labelField = field(els.label.id, tr('名称', 'Name'), els.label);
    els.pathField = field(els.path.id, tr('Home 路径', 'Home path'), els.path, 'multi-home-path-field');
    var formFields = node('div', 'multi-home-editor-fields');
    append(formFields, els.kindField, els.aliasField, els.labelField, els.pathField);
    els.pathTools = node('div', 'multi-home-path-tools');
    els.choosePath = button(tr('选择文件夹', 'Choose folder'), 'choose-import', '', 'choose-path');
    els.scan = button(tr('扫描已有 Home', 'Find existing Homes'), 'scan', '', 'scan-homes');
    append(els.pathTools, els.choosePath, els.scan);
    els.scanResults = node('div', 'multi-home-scan-results');
    els.scanResults.hidden = true;
    els.previewButton = document.createElement('button');
    els.previewButton.type = 'submit';
    els.previewButton.className = 'btn primary';
    els.previewButton.dataset.mcFocusKey = 'preview-plan';
    els.previewButton.textContent = tr('预览变更', 'Preview changes');
    var formActions = node('div', 'multi-home-actions');
    formActions.appendChild(els.previewButton);
    append(els.editorForm, formFields, els.pathTools, els.scanResults, formActions);

    els.planPreview = node('section', 'multi-home-plan-preview');
    els.planPreview.id = 'multi-codex-home-plan-preview';
    els.planPreview.hidden = true;
    els.planPreview.setAttribute('aria-live', 'polite');
    append(editorBody, editorIntro, els.editorForm, els.planPreview);
    append(els.editor, els.editorSummary, editorBody);
    host.appendChild(els.editor);

    els.kind.addEventListener('change', function () {
      syncEditorFields();
      clearPlan();
      updateControls();
    });
    [els.alias, els.label, els.path].forEach(function (control) {
      control.addEventListener('input', clearPlan);
    });
    els.editorForm.addEventListener('submit', function (event) {
      event.preventDefault();
      previewPlan();
    });
    els.choosePath.addEventListener('click', chooseImportPath);
    els.scan.addEventListener('click', scanHomes);
    syncEditorFields();
  }

  function makeOption(value, text) {
    var item = node('option', '', text);
    item.value = value;
    return item;
  }

  function subscribeChanges() {
    var subscribe = apiMethod('onMultiCodexHomeChanged');
    if (!subscribe || state.unsubscribe) return;
    try {
      var unsubscribe = subscribe.call(root.grokbot, function () {
        if (state.visible && !state.busy) refreshStatus(true);
      });
      if (typeof unsubscribe === 'function') {
        state.unsubscribe = unsubscribe;
        if (typeof root.addEventListener === 'function') root.addEventListener('pagehide', unsubscribeChanges, { once: true });
      }
    } catch (_) { state.unsubscribe = null; }
  }

  function unsubscribeChanges() {
    if (typeof state.unsubscribe === 'function') {
      try { state.unsubscribe(); } catch (_) { }
    }
    state.unsubscribe = null;
  }

  function watchVisibility() {
    var panel = document.getElementById('set-panel-apps');
    var mask = document.getElementById('set-mask');
    var section = document.getElementById('multi-codex-home-section');
    if (!panel) return;
    function onChange() {
      var visible = isVisible();
      if (visible === state.visible) return;
      state.visible = visible;
      if (visible) {
        refreshStatus(false);
        schedulePoll();
      } else {
        stopPoll();
        state.statusRequest++;
      }
    }
    document.addEventListener('visibilitychange', onChange);
    if (typeof root.MutationObserver === 'function') {
      var observer = new root.MutationObserver(onChange);
      observer.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
      if (mask) observer.observe(mask, { attributes: true, attributeFilter: ['class', 'hidden'] });
      if (section) observer.observe(section, { attributes: true, attributeFilter: ['hidden'] });
    }
    state.visible = isVisible();
    if (state.visible) {
      refreshStatus(false);
      schedulePoll();
    }
  }

  function isVisible() {
    var panel = document.getElementById('set-panel-apps');
    var mask = document.getElementById('set-mask');
    var section = document.getElementById('multi-codex-home-section');
    return !!(panel && !panel.hidden && (!mask || !mask.classList.contains('hidden')) &&
      (!section || !section.hidden) && !document.hidden);
  }

  function schedulePoll() {
    stopPoll();
    if (!state.visible) return;
    state.pollTimer = root.setTimeout(function () {
      state.pollTimer = 0;
      if (!state.visible) return;
      refreshStatus(true).then(schedulePoll);
    }, 25000);
  }

  function stopPoll() {
    if (state.pollTimer) root.clearTimeout(state.pollTimer);
    state.pollTimer = 0;
  }

  function refreshStatus(quiet) {
    if (!state.initialized || state.busy) return Promise.resolve();
    if (state.statusLoading) {
      state.statusQueued = true;
      state.statusQueuedQuiet = state.statusQueuedQuiet && !!quiet;
      return state.statusPromise || Promise.resolve();
    }
    state.statusLoading = true;
    var request = ++state.statusRequest;
    if (!apiMethod('multiCodexHomeAction')) {
      state.statusLoading = false;
      state.status = null;
      renderStatus();
      setMessage(tr('此功能需要 Bot Studio 桌面版。', 'This feature requires the Bot Studio desktop app.'), 'error');
      updateControls();
      return Promise.resolve();
    }
    if (!quiet) setMessage(tr('正在读取本机 Codex 状态…', 'Reading local Codex status…'), 'pending');
    updateControls();
    var promise = callAction('status').then(function (result) {
      if (request !== state.statusRequest || !state.visible) return;
      resultOrThrow(result, tr('无法读取 Codex Home 状态。', 'Could not read Codex Home status.'));
      if (!result.status || typeof result.status !== 'object') throw new Error(tr('Codex Home 状态无效。', 'Codex Home returned an invalid status.'));
      state.status = result.status;
      renderStatus();
      if (!quiet) setMessage(tr('状态已刷新。', 'Status refreshed.'), 'ok');
      else if (state.messageState === 'pending') setMessage('', 'idle');
    }).catch(function (error) {
      if (request !== state.statusRequest || !state.visible) return;
      setMessage(error.message || tr('无法读取 Codex Home 状态。', 'Could not read Codex Home status.'), 'error');
    }).then(function () {
      if (request === state.statusRequest) updateControls();
      state.statusLoading = false;
      if (state.statusQueued && state.visible && !state.busy) {
        var nextQuiet = state.statusQueuedQuiet;
        state.statusQueued = false;
        state.statusQueuedQuiet = true;
        return refreshStatus(nextQuiet);
      }
    });
    state.statusPromise = promise;
    return promise;
  }

  function renderStatus() {
    var status = state.status;
    if (!status) {
      els.status.textContent = tr('尚未读取', 'Not checked');
      els.status.dataset.state = 'idle';
      els.meta.textContent = '';
      renderHomes();
      updateControls();
      return;
    }
    if (status.error) {
      els.status.textContent = tr('需要处理', 'Needs attention');
      els.status.dataset.state = 'error';
    } else if (status.available === false) {
      els.status.textContent = tr('CodexHome Manager 不可用', 'CodexHome Manager unavailable');
      els.status.dataset.state = 'error';
    } else if (status.available === true) {
      els.status.textContent = status.version
        ? tr('CodexHome Manager {version}', 'CodexHome Manager {version}', { version: status.version })
        : tr('CodexHome Manager 可用', 'CodexHome Manager available');
      els.status.dataset.state = 'ready';
    } else {
      els.status.textContent = tr('状态已读取', 'Status read');
      els.status.dataset.state = 'idle';
    }
    var meta = [];
    if (status.registryPath) meta.push(tr('Home 注册表：{path}', 'Home registry: {path}', { path: status.registryPath }));
    meta.push(codexRuntimeSummary(status.runtime));
    if (status.error) meta.push(errorText(status.error, tr('Codex Home 状态异常。', 'Codex Home status needs attention.')));
    els.meta.textContent = meta.join(' · ');
    renderHomes();
    updateControls();
  }

  function renderHomes() {
    if (!els.homeList) return;
    var focus = captureFocus();
    captureBindingDrafts();
    els.homeList.replaceChildren();
    var homes = state.status && Array.isArray(state.status.homes) ? state.status.homes : [];
    if (!homes.length) {
      var emptyText = state.status
        ? tr('尚无 Home。展开“创建或导入 Home”以开始。', 'No Homes yet. Open “Create or import a Home” to begin.')
        : tr('正在等待本机状态。', 'Waiting for local status.');
      var empty = node('li', 'multi-home-empty', emptyText);
      els.homeList.appendChild(empty);
      return;
    }
    var fragment = document.createDocumentFragment();
    homes.forEach(function (home, index) {
      if (!home || typeof home.id !== 'string') return;
      fragment.appendChild(renderHome(home, index));
    });
    els.homeList.appendChild(fragment);
    restoreFocus(focus);
  }

  function captureFocus() {
    var active = document.activeElement;
    if (!active || !els.root || !els.root.contains(active) || !active.dataset.mcFocusKey) return null;
    return {
      key: active.dataset.mcFocusKey,
      selectionStart: typeof active.selectionStart === 'number' ? active.selectionStart : null,
      selectionEnd: typeof active.selectionEnd === 'number' ? active.selectionEnd : null
    };
  }

  function restoreFocus(focus) {
    if (!focus) return;
    var controls = els.root.querySelectorAll('[data-mc-focus-key]');
    for (var i = 0; i < controls.length; i++) {
      if (controls[i].dataset.mcFocusKey !== focus.key) continue;
      try { controls[i].focus({ preventScroll: true }); } catch (_) { controls[i].focus(); }
      if (focus.selectionStart !== null && typeof controls[i].setSelectionRange === 'function') {
        try { controls[i].setSelectionRange(focus.selectionStart, focus.selectionEnd); } catch (_) { }
      }
      return;
    }
  }

  function captureBindingDrafts() {
    if (!els.homeList) return;
    Array.prototype.forEach.call(els.homeList.querySelectorAll('[data-home-id]'), function (row) {
      var id = row.dataset.homeId;
      var botSelect = row.querySelector('[data-mc-bind-bot]');
      var model = row.querySelector('[data-mc-bind-model]');
      if (id && botSelect) {
        state.bindingDrafts[id] = { botId: botSelect.value || '', model: model ? model.value : '' };
      }
    });
  }

  function renderHome(home, index) {
    var row = node('li', 'multi-home-row');
    row.dataset.homeId = home.id;
    var heading = node('div', 'multi-home-row-heading');
    var name = node('h5', 'multi-home-name', home.label || home.alias || home.id);
    append(heading, name);
    if (home.alias && home.label && home.alias !== home.label) {
      heading.appendChild(node('span', 'multi-home-alias', tr('别名：{alias}', 'Alias: {alias}', { alias: home.alias })));
    }
    var homeState = node('span', 'multi-home-home-state', home.available === false
      ? tr('路径不可用', 'Path unavailable') : tr('本机 Home', 'Local Home'));
    homeState.dataset.state = home.available === false ? 'error' : 'idle';
    heading.appendChild(homeState);
    var path = node('p', 'multi-home-path', home.path || tr('路径未提供', 'Path not provided'));
    var facts = node('p', 'multi-home-facts');
    var authText = home.hasAuth === true
      ? tr('认证文件存在；账号登录状态尚未确认。', 'Authentication file exists; sign-in is not confirmed.')
      : tr('未发现认证文件。', 'No authentication file found.');
    var configText = home.hasConfig === true
      ? tr('Codex 配置存在。', 'Codex configuration found.')
      : tr('未发现 Codex 配置。', 'No Codex configuration found.');
    var authKind = home.authKind || 'native-codex';
    var authSource = planLoginPending(home)
      ? tr('认证来源：ChatGPT 订阅（登录等待中）', 'Authentication: ChatGPT plan (sign-in pending)')
      : authKind === 'chatgpt-plan'
      ? tr('认证来源：ChatGPT 订阅', 'Authentication: ChatGPT plan')
      : authKind === 'unavailable'
        ? tr('认证来源不可用；不会回退到原生登录。', 'Authentication is unavailable; native sign-in will not be used as a fallback.')
        : tr('认证来源：原生 Codex Home', 'Authentication: native Codex Home');
    facts.textContent = authSource + ' · ' + authText + ' ' + configText;
    append(row, heading, path, facts);

    var loginOutcome = renderPlanLoginOutcome(home);
    if (loginOutcome) row.appendChild(loginOutcome);

    var server = findServer(home.id);
    var serverBlock = renderServer(home, server);
    row.appendChild(serverBlock);
    if (authKind === 'chatgpt-plan' || planLoginPending(home)) row.appendChild(renderPlanControls(home));
    row.appendChild(renderBinding(home, index));
    return row;
  }

  function planLoginPending(home) {
    var status = String(home && home.planLogin && home.planLogin.status || '');
    return status === 'awaiting-browser' || status === 'finishing';
  }

  function renderPlanLoginOutcome(home) {
    var login = home && home.planLogin;
    var status = String(login && login.status || '');
    if (!['completed', 'failed', 'canceled'].includes(status)) return null;
    var message;
    if (status === 'completed') {
      message = tr('最近一次 ChatGPT 登录已完成；实际用量只会在 BOT 任务完成后标记为已验证。',
        'The latest ChatGPT sign-in completed. Actual use is verified only after a BOT task completes.');
    } else if (status === 'canceled') {
      message = tr('最近一次 ChatGPT 登录已取消。', 'The latest ChatGPT sign-in was canceled.');
    } else {
      var failure = login.error ? errorText(login.error, tr('未知错误', 'unknown error')) : tr('未知错误', 'unknown error');
      message = tr('最近一次 ChatGPT 登录未完成：{error}', 'The latest ChatGPT sign-in did not complete: {error}', { error: failure });
    }
    var outcome = node('p', 'multi-home-plan-login-outcome', message);
    outcome.dataset.state = status === 'failed' ? 'error' : status === 'completed' ? 'ready' : 'idle';
    outcome.setAttribute('role', status === 'failed' ? 'alert' : 'status');
    return outcome;
  }

  function findServer(homeId) {
    var servers = state.status && Array.isArray(state.status.servers) ? state.status.servers : [];
    for (var i = 0; i < servers.length; i++) if (servers[i] && servers[i].id === homeId) return servers[i];
    return null;
  }

  function serverState(server) {
    return String(server && server.state || 'stopped').toLowerCase().replace(/_/g, '-');
  }

  function serverStateLabel(value) {
    switch (value) {
      case 'running': return tr('运行中', 'Running');
      case 'starting': return tr('正在启动', 'Starting');
      case 'stopping': return tr('正在停止', 'Stopping');
      case 'stopped': return tr('已停止', 'Stopped');
      case 'failed': case 'error': return tr('启动失败', 'Failed');
      default: return value ? value : tr('已停止', 'Stopped');
    }
  }

  function renderServer(home, server) {
    var block = node('section', 'multi-home-server');
    var authKind = home.authKind || 'native-codex';
    var planHome = authKind === 'chatgpt-plan' || planLoginPending(home);
    var unavailable = authKind === 'unavailable';
    var top = node('div', 'multi-home-server-top');
    var title = node('h6', '', tr('Home App Server', 'Home App Server'));
    var statusText = serverState(server);
    var status = node('span', 'multi-home-server-state', serverStateLabel(statusText));
    status.dataset.state = statusText === 'running' ? 'ready'
      : statusText === 'failed' || statusText === 'error' ? 'error'
        : ['starting', 'stopping'].includes(statusText) ? 'pending' : 'idle';
    append(top, title, status);
    block.appendChild(top);
    if (statusText === 'running' && server && server.pid) {
      block.appendChild(node('p', 'multi-home-server-meta', tr('进程 ID：{pid}', 'PID: {pid}', { pid: server.pid })));
    }
    var nativeHome = authKind === 'native-codex' && !planLoginPending(home);
    var account = nativeHome && server && server.account;
    if (account && typeof account === 'object') {
      var accountParts = [];
      if (account.email) accountParts.push(String(account.email));
      else if (account.type === 'apiKey') accountParts.push(tr('API 密钥认证', 'API key authentication'));
      else accountParts.push(tr('账号信息已检查', 'Account details checked'));
      if (account.planType) accountParts.push(tr('方案：{plan}', 'Plan: {plan}', { plan: account.planType }));
      block.appendChild(node('p', 'multi-home-account', tr('账号：{account}', 'Account: {account}', { account: accountParts.join(' · ') })));
    } else if (nativeHome && statusText === 'running') {
      block.appendChild(node('p', 'multi-home-server-meta', tr('账号尚未检查。', 'Account has not been checked.')));
    }
    if (server && server.error) block.appendChild(node('p', 'multi-home-inline-error', safeText(server.error)));
    var actions = node('div', 'multi-home-actions');
    var runtimeReady = codexRuntimeAvailable();
    var available = runtimeReady && !unavailable && !(state.status && state.status.available === false) && home.available !== false;
    var transitioning = statusText === 'starting' || statusText === 'stopping';
    if (statusText === 'running') {
      var stop = button(tr('停止服务', 'Stop server'), 'stop', 'danger', 'server-stop-' + home.id);
      stop._mcDisabled = function () { return statusText !== 'running'; };
      stop.addEventListener('click', function () { mutate('stop', { homeId: home.id }, tr('正在停止 App Server…', 'Stopping the App Server…'), tr('App Server 已停止。', 'App Server stopped.')); });
      actions.appendChild(stop);
    } else if (unavailable) {
      actions.appendChild(node('span', 'multi-home-server-meta', tr(
        '认证模块不可用；无法启动此 Home。', 'Authentication is unavailable; this Home cannot be started.'
      )));
    } else if (!planHome) {
      var start = button(tr('启动服务', 'Start server'), 'start', 'primary', 'server-start-' + home.id);
      start._mcDisabled = function () { return !available || transitioning; };
      start.title = !runtimeReady ? codexRuntimeMissingText()
        : available ? '' : tr('需要可用的 Codex CLI 和 Home 路径。', 'A usable Codex CLI and Home path are required.');
      start.addEventListener('click', function () { mutate('start', { homeId: home.id }, tr('正在启动 App Server…', 'Starting the App Server…'), tr('App Server 已启动。', 'App Server started.')); });
      actions.appendChild(start);
    } else {
      actions.appendChild(node('span', 'multi-home-server-meta', tr(
        planLoginPending(home) ? 'ChatGPT 登录完成前，BOT 任务保持暂停。' : '服务由此 Home 的 BOT 任务按需启动。',
        planLoginPending(home) ? 'BOT tasks stay paused until ChatGPT sign-in finishes.' : 'The server starts when a BOT runs a task with this Home.'
      )));
    }
    if (unavailable) {
      actions.appendChild(node('span', 'multi-home-inline-error', tr(
        '认证模块不可用；已禁用运行、绑定和登录。',
        'Authentication is unavailable. Run, bind and sign-in actions are disabled.'
      )));
    } else if (nativeHome) {
      var checkAccount = button(tr('检查账号', 'Check account'), 'refresh-account', '', 'account-check-' + home.id);
      checkAccount._mcDisabled = function () { return statusText !== 'running' || !codexRuntimeAvailable(); };
      checkAccount.addEventListener('click', function () { mutate('refreshAccount', { homeId: home.id }, tr('正在读取账号信息…', 'Reading account details…'), tr('账号信息已刷新。', 'Account details refreshed.')); });
      actions.appendChild(checkAccount);
    }
    if (transitioning) actions.appendChild(node('span', 'multi-home-pending', statusStateDescription(statusText)));
    block.appendChild(actions);

    var login = nativeHome && server && server.login;
    var loginState = String(login && login.status || 'idle').toLowerCase();
    var hint = state.loginHints[home.id];
    if (['completed', 'failed', 'canceled', 'idle'].includes(loginState) && hint) {
      if (loginState !== 'idle') delete state.loginHints[home.id];
      hint = null;
    }
    if (nativeHome && (loginState !== 'idle' || hint)) {
      var loginBlock = node('div', 'multi-home-login-state');
      var loginLabel = loginState === 'pending' || (hint && loginState === 'idle')
        ? tr('等待完成登录', 'Waiting for sign-in')
        : loginState === 'starting' ? tr('正在准备登录…', 'Preparing sign-in…')
          : loginState === 'canceling' ? tr('正在取消登录…', 'Canceling sign-in…')
            : loginState === 'completed' ? tr('登录已完成；可检查账号。', 'Sign-in complete; you can check the account.')
              : loginState === 'failed' ? tr('登录失败，请查看错误并重试。', 'Sign-in failed. Review the error and try again.')
                : loginState === 'canceled' ? tr('登录已取消。', 'Sign-in canceled.')
                  : tr('登录状态：{state}', 'Sign-in status: {state}', { state: loginState });
      loginBlock.appendChild(node('p', loginState === 'failed' ? 'multi-home-inline-error' : 'multi-home-login-copy', loginLabel));
      var code = hint && hint.userCode;
      if (code) loginBlock.appendChild(node('p', 'multi-home-login-code', tr('验证码：{code}', 'Code: {code}', { code: code })));
      var verificationUrl = hint && hint.verificationUrl;
      if (verificationUrl) {
        loginBlock.appendChild(node('p', 'multi-home-login-verification', tr('验证网址：{url}', 'Verification page: {url}', { url: verificationUrl })));
      } else if (!code && hint && hint.type === 'chatgptDeviceCode' && loginState === 'pending') {
        loginBlock.appendChild(node('p', 'multi-home-server-meta', tr('设备码未返回；请查看打开的登录页。', 'No device code was returned; check the opened sign-in page.')));
      }
      if (['pending', 'starting'].includes(loginState) || (hint && loginState === 'idle')) {
        var cancel = button(tr('取消登录', 'Cancel sign-in'), 'cancel-login', 'danger', 'login-cancel-' + home.id);
        cancel._mcDisabled = function () { return loginState === 'canceling'; };
        cancel.addEventListener('click', function () { mutate('cancelLogin', { homeId: home.id }, tr('正在取消登录…', 'Canceling sign-in…'), tr('登录已取消。', 'Sign-in canceled.')); });
        loginBlock.appendChild(cancel);
      }
      if (server && server.login && server.login.error) loginBlock.appendChild(node('p', 'multi-home-inline-error', errorText(server.login.error)));
      block.appendChild(loginBlock);
    }

    if (nativeHome) {
      var loginControls = node('div', 'multi-home-login-controls');
      var loginType = document.createElement('select');
      loginType.className = 'multi-home-compact-select';
      loginType.dataset.mcLoginType = home.id;
      loginType.dataset.mcFocusKey = 'login-type-' + home.id;
      loginType._mcDisabled = function () {
        return !codexRuntimeAvailable() || !['idle', 'completed', 'failed', 'canceled'].includes(loginState);
      };
      loginType.setAttribute('aria-label', tr('登录方式', 'Sign-in method'));
      loginType.append(makeOption('', tr('选择登录方式', 'Choose sign-in method')),
        makeOption('chatgpt', tr('ChatGPT 登录', 'ChatGPT sign-in')),
        makeOption('chatgptDeviceCode', tr('设备码登录', 'Device code sign-in')));
      loginType.addEventListener('change', updateControls);
      var signIn = button(tr('开始登录', 'Sign in'), 'login', '', 'login-start-' + home.id);
      signIn._mcDisabled = function () {
        return !codexRuntimeAvailable() || !(state.status && state.status.available === true) || home.available === false ||
          !['idle', 'completed', 'failed', 'canceled'].includes(loginState) || !loginType.value;
      };
      signIn.addEventListener('click', function () {
        if (!loginType.value) {
          setMessage(tr('先选择一种登录方式。', 'Choose a sign-in method first.'), 'error');
          loginType.focus();
          return;
        }
        var type = loginType.value;
        mutate('login', { homeId: home.id, type: type }, tr('正在启动登录…', 'Starting sign-in…'), tr('登录已启动，请在打开的页面完成操作。', 'Sign-in started. Complete it in the opened page.'), function (result) {
          var loginResult = result.login || {};
          state.loginHints[home.id] = {
            type: type,
            userCode: safeText(loginResult.userCode),
            verificationUrl: type === 'chatgptDeviceCode' ? safeText(loginResult.verificationUrl) : ''
          };
        });
      });
      append(loginControls, loginType, signIn);
      if (home.planEligible === true && home.hasAuth !== true && home.available !== false &&
          state.status && state.status.plan && state.status.plan.available === true) {
        var planSignIn = button(tr('Continue with ChatGPT', 'Continue with ChatGPT'), 'plan-sign-in', '', 'plan-sign-in-' + home.id);
        planSignIn.addEventListener('click', function () {
          mutate('planSignIn', { homeId: home.id }, tr('正在打开 ChatGPT 登录…', 'Opening ChatGPT sign-in…'),
            tr('请在浏览器中完成 ChatGPT 登录。', 'Complete ChatGPT sign-in in your browser.'));
        });
        loginControls.appendChild(planSignIn);
      }
      if (nativeHome) block.appendChild(loginControls);
      if (nativeHome && home.hasAuth === true && home.planEligible === true &&
          state.status && state.status.plan && state.status.plan.available === true) {
        block.appendChild(node('p', 'multi-home-plan-note', tr(
          '此 Home 已有原生认证，不能改用 ChatGPT 订阅。',
          'This Home already has native credentials and cannot switch to ChatGPT plan.'
        )));
      }
    }
    return block;
  }

  function planModelKey(home) {
    var account = home && home.planAccount;
    return String(home && home.id || '') + '|' + String(account && account.id || '');
  }

  function planModelsFor(home) {
    var key = planModelKey(home);
    return key && state.planModels[key] && Array.isArray(state.planModels[key].models)
      ? state.planModels[key].models : [];
  }

  function planStatusLabel(account) {
    if (!account) return tr('尚未关联 ChatGPT 账号。', 'No ChatGPT account is associated yet.');
    var label = account.label || account.email || '';
    var identity = label ? tr('账号：{identity}', 'Account: {identity}', { identity: label }) : '';
    var stateText;
    switch (account.status) {
      case 'connected': stateText = account.requiresSignIn
        ? account.planEnabled === true
          ? tr('需要重新登录', 'Sign-in required')
          : tr('需要允许使用 ChatGPT 订阅', 'ChatGPT plan permission is required')
        : account.planEnabled ? tr('已授权使用 ChatGPT 订阅', 'Authorized to use ChatGPT plan')
          : tr('已授权身份；尚未允许使用订阅', 'Identity authorized; plan use is not enabled'); break;
      case 'incomplete': stateText = tr('授权未完成', 'Authorization incomplete'); break;
      case 'signed-out': stateText = tr('已退出登录', 'Signed out'); break;
      case 'expired': stateText = tr('授权已过期', 'Authorization expired'); break;
      case 'signing-out': stateText = tr('正在安全退出…', 'Signing out…'); break;
      case 'unavailable': stateText = tr('授权状态不可用', 'Authorization status unavailable'); break;
      default: stateText = tr('授权状态未知', 'Authorization status unknown');
    }
    var parts = [identity, stateText].filter(Boolean);
    if (account.verifiedUseAt) parts.push(tr('已验证完成调用', 'Completed use verified'));
    else if (account.status === 'connected') parts.push(tr('尚无已验证的完成调用', 'No completed use has been verified'));
    if (account.remoteRevocationConfirmed === false) parts.push(tr(
      '远端撤销未确认；本地凭据已退出。',
      'Remote revocation was not confirmed; local credentials are signed out.'
    ));
    return parts.join(' · ');
  }

  function renderPlanControls(home) {
    var block = node('section', 'multi-home-plan-auth');
    var title = node('h6', '', tr('ChatGPT 订阅', 'ChatGPT plan'));
    var account = home.planAccount || null;
    var login = home.planLogin || null;
    var loginStatus = String(login && login.status || 'idle');
    block.appendChild(title);
    block.appendChild(node('p', 'multi-home-plan-account', planStatusLabel(account)));

    if (loginStatus === 'awaiting-browser' || loginStatus === 'finishing') {
      block.appendChild(node('p', 'multi-home-plan-pending', tr(
        loginStatus === 'finishing' ? '正在完成 ChatGPT 授权…' : '等待在浏览器中完成 ChatGPT 登录。',
        loginStatus === 'finishing' ? 'Finishing ChatGPT authorization…' : 'Waiting for ChatGPT sign-in in your browser.'
      )));
      var cancel = button(tr('取消登录', 'Cancel sign-in'), 'plan-cancel-sign-in', 'danger', 'plan-cancel-' + home.id);
      cancel.addEventListener('click', function () {
        mutate('planCancelSignIn', { homeId: home.id }, tr('正在取消登录…', 'Canceling sign-in…'),
          tr('ChatGPT 登录已取消。', 'ChatGPT sign-in canceled.'));
      });
      block.appendChild(cancel);
    } else if (!state.status || !state.status.plan || state.status.plan.available !== true) {
      block.appendChild(node('p', 'multi-home-inline-error', tr(
        'ChatGPT 订阅授权模块不可用。原生 Codex 登录不会作为回退。',
        'ChatGPT plan authorization is unavailable. Native Codex sign-in is not used as a fallback.'
      )));
    } else {
      var connectedAccount = !!account && account.status === 'connected';
      var connected = connectedAccount && account.requiresSignIn !== true;
      var canUse = connected && account.planEnabled === true;
      var canManageAccount = !!account && account.status !== 'signed-out' && account.status !== 'signing-out';
      var needsPlanConsent = connectedAccount && account.planEnabled !== true;
      if (!account || ['incomplete', 'signed-out', 'expired'].includes(account.status) ||
          (account.requiresSignIn === true && !needsPlanConsent)) {
        var signIn = button(tr('Continue with ChatGPT', 'Continue with ChatGPT'), 'plan-sign-in', '', 'plan-sign-in-' + home.id);
        signIn._mcDisabled = function () { return home.available === false || state.status.plan.available !== true; };
        signIn.addEventListener('click', function () {
          mutate('planSignIn', { homeId: home.id }, tr('正在打开 ChatGPT 登录…', 'Opening ChatGPT sign-in…'),
            tr('请在浏览器中完成 ChatGPT 登录。', 'Complete ChatGPT sign-in in your browser.'));
        });
        block.appendChild(signIn);
      }
      if (needsPlanConsent) {
        block.appendChild(node('p', 'multi-home-plan-note', tr(
          '此 ChatGPT 账号已连接，但尚未允许订阅调用。明确同意前不会使用订阅或读取模型。',
          'This ChatGPT account is connected, but plan access has not been allowed. Subscription requests and model lists stay disabled until you consent.'
        )));
        var consent = button(tr('允许使用 ChatGPT 订阅', 'Allow ChatGPT plan use'), 'plan-enable-use', 'primary', 'plan-consent-' + home.id);
        consent._mcDisabled = function () { return home.available === false || state.status.plan.available !== true; };
        consent.addEventListener('click', function () {
          mutate('planSignIn', { homeId: home.id, consent: true }, tr('正在更新订阅许可…', 'Updating plan consent…'),
            tr('请在浏览器中确认 ChatGPT 订阅许可。', 'Confirm ChatGPT plan access in your browser.'));
        });
        block.appendChild(consent);
      }
      if (canManageAccount) {
        var signOut = button(tr('退出 ChatGPT 账号', 'Sign out of ChatGPT'), 'plan-sign-out', 'danger', 'plan-sign-out-' + home.id);
        signOut.addEventListener('click', function () {
          state.planSignOutConfirm[home.id] = true;
          renderHomes();
        });
        block.appendChild(signOut);
      }
      if (account && account.status === 'connected' && account.welcomeSeen === false) {
        var welcome = node('div', 'multi-home-plan-welcome');
        welcome.setAttribute('role', 'note');
        welcome.appendChild(node('p', '', tr(
          canUse
            ? '此 Home 的 BOT 请求会使用你的 ChatGPT plan / credits。已授权不等于调用已验证；只有任务完成后才记录已验证使用。'
            : '再次同意启用后，此 Home 的 BOT 请求会使用你的 ChatGPT plan / credits。授权和模型列表不代表调用已验证。',
          canUse
            ? 'BOT requests from this Home use your ChatGPT plan / credits. Authorization alone does not verify a model call; only a completed task does.'
            : 'After you consent to enable plan use, BOT requests from this Home use your ChatGPT plan / credits. Authorization and model lists do not verify a call.'
        )));
        var welcomeActions = node('div', 'multi-home-plan-actions');
        var acknowledge = button(tr('知道了', 'Got it'), 'plan-acknowledge', '', 'plan-acknowledge-' + home.id);
        acknowledge.addEventListener('click', function () {
          mutate('planAcknowledge', { homeId: home.id }, tr('正在保存确认…', 'Saving acknowledgment…'),
            tr('订阅说明已确认。', 'Plan notice acknowledged.'));
        });
        var welcomeUsage = button(tr('管理用量', 'Manage usage'), 'plan-usage', '', 'plan-usage-' + home.id);
        welcomeUsage.addEventListener('click', openPlanUsage);
        welcomeActions.append(acknowledge, welcomeUsage);
        welcome.appendChild(welcomeActions);
        block.appendChild(welcome);
      } else if (account && account.remoteRevocationConfirmed === false) {
        var revokeHelp = node('p', 'multi-home-plan-revocation', tr(
          '远端撤销尚未确认。可在 ChatGPT 用量设置查看账号状态。',
          'Remote revocation was not confirmed. Check the account in ChatGPT usage settings.'
        ));
        block.appendChild(revokeHelp);
      }
      if (account && account.status !== 'signed-out' && account.status !== 'signing-out') {
        var actions = node('div', 'multi-home-plan-actions');
        if (!(account.status === 'connected' && account.welcomeSeen === false)) {
          var usage = button(tr('管理用量', 'Manage usage'), 'plan-usage', '', 'plan-usage-' + home.id);
          usage.addEventListener('click', openPlanUsage);
          actions.appendChild(usage);
        }
        if (canUse) {
          var refreshModels = button(tr('刷新订阅模型', 'Refresh plan models'), 'plan-models', '', 'plan-models-' + home.id);
          refreshModels.addEventListener('click', function () { refreshPlanModels(home); });
          actions.appendChild(refreshModels);
          var models = planModelsFor(home);
          block.appendChild(actions);
          block.appendChild(node('p', 'multi-home-plan-model-state', models.length
            ? tr('模型列表已读取 {count} 项。', '{count} models loaded.', { count: models.length })
            : tr('尚未读取此账号的模型列表。', 'Models have not been loaded for this account.')));
        } else block.appendChild(actions);
      }
      if (account && account.status === 'signed-out' && account.remoteRevocationConfirmed === false) {
        var signedOutActions = node('div', 'multi-home-plan-actions');
        var signedOutUsage = button(tr('管理用量', 'Manage usage'), 'plan-usage', '', 'plan-usage-' + home.id);
        signedOutUsage.addEventListener('click', openPlanUsage);
        signedOutActions.appendChild(signedOutUsage);
        block.appendChild(signedOutActions);
      }
    }

    if (state.planSignOutConfirm[home.id]) {
      var confirmation = node('div', 'multi-home-plan-signout-confirm');
      confirmation.setAttribute('role', 'group');
      confirmation.setAttribute('aria-label', tr('确认退出 ChatGPT 账号', 'Confirm ChatGPT sign-out'));
      confirmation.appendChild(node('p', '', tr(
        '退出会停止此账号关联的任务，并尝试撤销远端授权。',
        'Signing out stops tasks linked to this account and attempts to revoke remote authorization.'
      )));
      var confirmActions = node('div', 'multi-home-plan-actions');
      var cancelConfirm = button(tr('取消', 'Cancel'), 'plan-sign-out-cancel', '', 'plan-signout-cancel-' + home.id);
      cancelConfirm.addEventListener('click', function () { delete state.planSignOutConfirm[home.id]; renderHomes(); });
      var confirmSignOut = button(tr('确认退出', 'Confirm sign out'), 'plan-sign-out-confirm', 'danger', 'plan-signout-confirm-' + home.id);
      confirmSignOut.addEventListener('click', function () {
        delete state.planSignOutConfirm[home.id];
        mutate('planSignOut', { homeId: home.id }, tr('正在安全退出 ChatGPT…', 'Signing out of ChatGPT…'),
          tr('已从本机退出 ChatGPT。', 'Signed out of ChatGPT on this device.'));
      });
      confirmActions.append(cancelConfirm, confirmSignOut);
      confirmation.appendChild(confirmActions);
      block.appendChild(confirmation);
    }
    return block;
  }

  function openPlanUsage() {
    mutate('planUsage', {}, tr('正在打开 ChatGPT 用量设置…', 'Opening ChatGPT usage settings…'),
      tr('ChatGPT 用量设置已打开。', 'ChatGPT usage settings opened.'));
  }

  function refreshPlanModels(home) {
    if (state.busy || !home || !home.planAccount || home.planAccount.status !== 'connected' || home.planAccount.planEnabled !== true) return;
    mutate('planModels', { homeId: home.id }, tr('正在读取订阅模型…', 'Reading ChatGPT plan models…'),
      tr('订阅模型已刷新。', 'Plan models refreshed.'), function (result) {
        var models = Array.isArray(result.models) ? result.models : [];
        state.planModels[planModelKey(home)] = { models: models.filter(function (model) {
          return model && typeof model.id === 'string' && model.id && typeof model.name === 'string' && model.name;
        }) };
      });
  }

  function statusStateDescription(status) {
    return status === 'starting'
      ? tr('服务正在启动。', 'The server is starting.')
      : tr('服务正在停止。', 'The server is stopping.');
  }

  function renderBinding(home, index) {
    var block = node('section', 'multi-home-binding');
    var authKind = home.authKind || 'native-codex';
    var planHome = authKind === 'chatgpt-plan';
    var runtimeMissing = !codexRuntimeAvailable();
    var unavailable = authKind === 'unavailable' || planLoginPending(home) || runtimeMissing;
    var planModels = planHome ? planModelsFor(home) : [];
    var planCanSelect = planHome && home.planAccount && home.planAccount.status === 'connected' &&
      home.planAccount.planEnabled === true && state.status && state.status.plan && state.status.plan.available === true;
    var title = node('h6', '', tr('BOT 绑定', 'BOT binding'));
    block.appendChild(title);
    var bots = state.status && Array.isArray(state.status.bots) ? state.status.bots : [];
    var boundBots = bots.filter(function (bot) { return bot && bot.binding && bot.binding.codexHomeId === home.id; });
    block.appendChild(node('p', 'multi-home-bound-list', boundBots.length
      ? tr('当前绑定：{bots}', 'Currently bound: {bots}', { bots: boundBots.map(function (bot) { return bot.name || bot.id; }).join('、') })
      : tr('尚无 BOT 使用此 Home。', 'No BOT is bound to this Home.')));

    var fields = node('div', 'multi-home-binding-fields');
    var select = document.createElement('select');
    select.id = 'multi-codex-home-bot-' + index;
    select.dataset.mcBindBot = home.id;
    select.dataset.mcFocusKey = 'bind-bot-' + home.id;
    select._mcDisabled = function () { return bots.length === 0 || unavailable; };
    select.setAttribute('aria-label', tr('选择本机 BOT', 'Choose a local BOT'));
    select.appendChild(makeOption('', tr('选择 BOT…', 'Choose a BOT…')));
    bots.forEach(function (bot) {
      if (!bot || typeof bot.id !== 'string') return;
      var option = makeOption(bot.id, bot.name || bot.id);
      option.disabled = !!bot.busy;
      select.appendChild(option);
    });
    var draft = state.bindingDrafts[home.id] || { botId: '', model: '' };
    if (draft.botId && bots.some(function (bot) { return bot && bot.id === draft.botId; })) select.value = draft.botId;
    if (!bots.length) block.appendChild(node('p', 'multi-home-bound-list', tr('没有可绑定的本机 BOT。', 'No local BOTs are available to bind.')));
    if (runtimeMissing) block.appendChild(node('p', 'multi-home-inline-error', tr(
      '绑定 BOT 需要已安装的 Codex 运行时。',
      'BOT binding requires an installed Codex runtime.'
    )));
    if (planLoginPending(home)) block.appendChild(node('p', 'multi-home-inline-error', tr(
      'ChatGPT 登录完成前暂停此 Home 的 BOT 绑定。', 'BOT binding is paused until ChatGPT sign-in finishes.'
    )));
    var model = document.createElement(planHome ? 'select' : 'input');
    if (!planHome) model.type = 'text';
    model.id = 'multi-codex-home-model-' + index;
    model.dataset.mcBindModel = home.id;
    model.dataset.mcFocusKey = 'bind-model-' + home.id;
    model._mcDisabled = function () { return bots.length === 0 || unavailable || planHome && !planCanSelect; };
    if (planHome) {
      model.dataset.mcPlanModelSelect = home.id;
      model.setAttribute('aria-label', tr('ChatGPT 订阅模型', 'ChatGPT plan model'));
      model.appendChild(makeOption('', planCanSelect
        ? tr('选择此账号的模型…', 'Choose a model from this account…')
        : tr('先读取此账号的模型列表', 'Refresh this account’s model list first')));
      planModels.forEach(function (item) {
        model.appendChild(makeOption(item.id, item.name + (item.name === item.id ? '' : ' · ' + item.id)));
      });
      var selectedBot = bots.find(function (bot) { return bot && bot.id === select.value; });
      var savedModel = draft.model || (selectedBot && selectedBot.binding && selectedBot.binding.codexHomeId === home.id
        ? selectedBot.binding.model || '' : '');
      if (savedModel && planModels.length && !planModels.some(function (item) { return item.id === savedModel; })) {
        var preserved = makeOption(savedModel, tr('当前已保存模型（不在刷新列表中）：{model}',
          'Saved model (not in refreshed list): {model}', { model: savedModel }));
        preserved.disabled = true;
        model.appendChild(preserved);
      }
      if (savedModel && Array.prototype.some.call(model.options, function (option) { return option.value === savedModel; })) model.value = savedModel;
    } else {
      model.autocomplete = 'off';
      model.placeholder = tr('留空使用 Home 默认模型', 'Leave empty for the Home default');
      model.setAttribute('aria-label', tr('可选模型', 'Optional model'));
      model.value = draft.model || '';
    }
    var selectField = field(select.id, tr('本机 BOT', 'Local BOT'), select);
    var modelField = field(model.id, planHome ? tr('ChatGPT 订阅模型', 'ChatGPT plan model') : tr('模型（可选）', 'Model (optional)'), model);
    append(fields, selectField, modelField);
    block.appendChild(fields);
    var preview = node('div', 'multi-home-bind-preview');
    preview.hidden = true;
    var previewText = node('p', 'multi-home-bind-preview-copy');
    var bindButton = button(tr('确认绑定', 'Confirm binding'), 'bind', 'primary', 'bind-button-' + home.id);
    bindButton.disabled = true;
    bindButton._mcDisabled = function () { return true; };
    append(preview, previewText, bindButton);
    block.appendChild(preview);

    function updatePreview() {
      var selected = bots.find(function (bot) { return bot && bot.id === select.value; });
      state.bindingDrafts[home.id] = { botId: select.value || '', model: model.value };
      if (!selected) {
        preview.hidden = true;
        bindButton.disabled = true;
        return;
      }
      preview.hidden = false;
      var modelName = model.value.trim() || (planHome ? tr('尚未选择', 'Not selected') : tr('Home 默认模型', 'Home default model'));
      previewText.textContent = planHome
        ? tr('确认后，{bot} 将使用此 Home 的 ChatGPT 订阅与所选模型，并重置当前执行会话。模型：{model}。',
          'Confirming switches {bot} to this Home’s ChatGPT plan and selected model, then resets its current execution session. Model: {model}.',
          { bot: selected.name || selected.id, model: modelName })
        : tr('确认后，{bot} 将改用此 Home 的 Codex 执行器，并重置当前执行会话。模型：{model}。',
          'Confirming switches {bot} to a Codex executor using this Home and resets its current execution session. Model: {model}.',
          { bot: selected.name || selected.id, model: modelName });
      var sameBinding = selected.binding && selected.binding.codexHomeId === home.id && (selected.binding.model || '') === model.value.trim();
      var validPlanModel = !planHome || planCanSelect && planModels.some(function (item) { return item.id === model.value; });
      bindButton.disabled = !!state.busy || unavailable || !validPlanModel || !home.available || !state.status || state.status.available !== true ||
        !!selected.busy || sameBinding || !Number.isInteger(selected.binding && selected.binding.revision);
      bindButton._mcDisabled = function () {
        var latestBot = bots.find(function (bot) { return bot && bot.id === select.value; });
        if (!latestBot) return true;
        var unchanged = latestBot.binding && latestBot.binding.codexHomeId === home.id && (latestBot.binding.model || '') === model.value.trim();
        var selectedPlanModel = !planHome || planCanSelect && planModels.some(function (item) { return item.id === model.value; });
        return unavailable || !selectedPlanModel || !home.available || !state.status || state.status.available !== true || !!latestBot.busy || unchanged ||
          !Number.isInteger(latestBot.binding && latestBot.binding.revision);
      };
      if (selected.busy) previewText.textContent += ' ' + tr('此 BOT 正在运行，暂时无法切换。', 'This BOT is busy and cannot be switched now.');
    }
    select.addEventListener('change', updatePreview);
    model.addEventListener(planHome ? 'change' : 'input', updatePreview);
    bindButton.addEventListener('click', function () {
      var selected = bots.find(function (bot) { return bot && bot.id === select.value; });
      if (!selected || !Number.isInteger(selected.binding && selected.binding.revision)) return;
      var input = { botId: selected.id, homeId: home.id, expectedRevision: selected.binding.revision };
      if (model.value.trim()) input.model = model.value.trim();
      mutate('bind', input, tr('正在切换 BOT 执行器…', 'Switching the BOT executor…'), tr('BOT 已绑定到此 Home。', 'BOT is bound to this Home.'));
    });
    updatePreview();
    return block;
  }

  function updateControls() {
    if (!els.refresh || !els.root) return;
    var busy = !!state.busy;
    els.choosePath._mcDisabled = function () { return els.kind.value !== 'import'; };
    els.scan._mcDisabled = function () { return els.kind.value !== 'import'; };
    els.previewButton._mcDisabled = function () { return !apiMethod('multiCodexHomeAction'); };
    [els.kind, els.alias, els.label, els.path].forEach(function (control) {
      control._mcDisabled = function () { return false; };
    });
    els.root.querySelectorAll('button[data-mc-action], input, select').forEach(function (control) {
      var blocked = typeof control._mcDisabled === 'function' ? control._mcDisabled() : false;
      control.disabled = busy || blocked;
    });
  }

  function mutate(action, input, pendingText, successText, afterSuccess) {
    if (state.busy) return Promise.resolve();
    state.busy = action;
    setMessage(pendingText, 'pending');
    updateControls();
    return callAction(action, input).then(function (result) {
      resultOrThrow(result, tr('本机 Codex 操作失败。', 'The local Codex operation failed.'));
      if (typeof afterSuccess === 'function') afterSuccess(result);
      setMessage(successText, 'ok');
      return result;
    }).catch(function (error) {
      setMessage(error.message || tr('本机 Codex 操作失败。', 'The local Codex operation failed.'), 'error');
      return null;
    }).then(function (result) {
      state.busy = '';
      updateControls();
      if (result && state.visible) {
        return refreshStatus(true).then(function () {
          if (state.messageState === 'error') return;
          setMessage(successText, 'ok');
        });
      }
      return undefined;
    });
  }

  function syncEditorFields() {
    var importing = els.kind.value === 'import';
    els.pathField.hidden = !importing;
    els.pathTools.hidden = !importing;
    els.scanResults.hidden = !importing || !els.scanResults.hasChildNodes();
  }

  function editorInput() {
    var alias = els.alias.value.trim();
    var label = els.label.value.trim() || alias;
    var input = { kind: els.kind.value, alias: alias, label: label };
    if (input.kind === 'import') input.path = els.path.value.trim();
    return input;
  }

  function signature(input) {
    return [input.kind, input.alias, input.label, input.path || ''].join('\n');
  }

  function clearPlan() {
    state.plan = null;
    state.planSignature = '';
    if (els.planPreview) {
      els.planPreview.replaceChildren();
      els.planPreview.hidden = true;
    }
  }

  function previewPlan() {
    if (state.busy) return Promise.resolve();
    var input = editorInput();
    if (!input.alias || (input.kind === 'import' && !input.path)) {
      setMessage(input.kind === 'import'
        ? tr('填写 Home 别名并选择或输入路径。', 'Enter a Home alias and choose or enter its path.')
        : tr('填写 Home 别名。', 'Enter a Home alias.'), 'error');
      (input.kind === 'import' && !input.path ? els.path : els.alias).focus();
      return Promise.resolve();
    }
    state.busy = 'plan';
    clearPlan();
    setMessage(tr('正在生成变更预览…', 'Preparing a change preview…'), 'pending');
    updateControls();
    var planSignature = signature(input);
    return callAction('plan', input).then(function (result) {
      resultOrThrow(result, tr('无法预览 Home 变更。', 'Could not preview the Home change.'));
      if (!result.plan || typeof result.plan !== 'object') throw new Error(tr('Home 预览无效。', 'The Home preview is invalid.'));
      if (planSignature !== signature(editorInput())) {
        setMessage(tr('表单已变化，请重新预览。', 'The form changed. Preview it again.'), 'error');
        return;
      }
      state.plan = result.plan;
      state.planSignature = planSignature;
      renderPlan();
      setMessage(tr('请核对准确路径和操作，再确认应用。', 'Review the exact path and actions before applying.'), 'pending');
    }).catch(function (error) {
      setMessage(error.message || tr('无法预览 Home 变更。', 'Could not preview the Home change.'), 'error');
    }).then(function () {
      state.busy = '';
      updateControls();
    });
  }

  function renderPlan() {
    els.planPreview.replaceChildren();
    els.planPreview.hidden = !state.plan;
    if (!state.plan) return;
    var plan = state.plan;
    var title = node('h5', '', tr('变更预览', 'Change preview'));
    var summary = node('dl', 'multi-home-plan-summary');
    addDefinition(summary, tr('操作', 'Action'), plan.kind === 'create' ? tr('新建 Home', 'Create Home') : tr('导入 Home', 'Import Home'));
    addDefinition(summary, tr('名称', 'Name'), plan.label || plan.alias || '');
    addDefinition(summary, tr('别名', 'Alias'), plan.alias || '');
    addDefinition(summary, tr('完整路径', 'Full path'), plan.path || '');
    els.planPreview.append(title, summary);
    var actions = Array.isArray(plan.actions) ? plan.actions : [];
    if (actions.length) {
      var actionTitle = node('h6', '', tr('将执行', 'Actions'));
      var actionList = node('ul', 'multi-home-plan-list');
      actions.forEach(function (action) { actionList.appendChild(node('li', '', formatPlanItem(action))); });
      append(els.planPreview, actionTitle, actionList);
    }
    var warnings = Array.isArray(plan.warnings) ? plan.warnings : [];
    if (warnings.length) {
      var warningTitle = node('h6', 'multi-home-warning-title', tr('注意', 'Review'));
      var warningList = node('ul', 'multi-home-warning-list');
      warnings.forEach(function (warning) { warningList.appendChild(node('li', '', formatPlanItem(warning))); });
      append(els.planPreview, warningTitle, warningList);
    }
    var applyActions = node('div', 'multi-home-actions');
    var apply = button(plan.kind === 'create' ? tr('确认创建 Home', 'Create Home') : tr('确认导入 Home', 'Import Home'), 'apply-plan', 'primary', 'apply-plan');
    apply.addEventListener('click', applyPlan);
    applyActions.appendChild(apply);
    els.planPreview.appendChild(applyActions);
  }

  function addDefinition(list, term, description) {
    list.append(node('dt', '', term), node('dd', '', description));
  }

  function formatPlanItem(item) {
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    if (!item || typeof item !== 'object') return '';
    return String(item.label || item.description || item.action || item.path || item.kind || '');
  }

  function applyPlan() {
    if (!state.plan || state.busy || state.planSignature !== signature(editorInput())) return;
    var plan = state.plan;
    state.busy = 'apply';
    setMessage(plan.kind === 'create' ? tr('正在创建 Home…', 'Creating the Home…') : tr('正在导入 Home…', 'Importing the Home…'), 'pending');
    updateControls();
    callAction('apply', { planId: plan.id }).then(function (result) {
      resultOrThrow(result, tr('无法应用 Home 变更。', 'Could not apply the Home change.'));
      els.alias.value = '';
      els.label.value = '';
      els.path.value = '';
      els.scanResults.replaceChildren();
      els.scanResults.hidden = true;
      clearPlan();
      setMessage(plan.kind === 'create' ? tr('Home 已创建。', 'Home created.') : tr('Home 已导入。', 'Home imported.'), 'ok');
      return plan.kind === 'create' ? tr('Home 已创建。', 'Home created.') : tr('Home 已导入。', 'Home imported.');
    }).catch(function (error) {
      setMessage(error.message || tr('无法应用 Home 变更。', 'Could not apply the Home change.'), 'error');
      return null;
    }).then(function (successText) {
      state.busy = '';
      updateControls();
      if (successText && state.visible) return refreshStatus(true).then(function () {
        if (state.messageState !== 'error') setMessage(successText, 'ok');
      });
      return undefined;
    });
  }

  function chooseImportPath() {
    if (state.busy || els.kind.value !== 'import') return;
    state.busy = 'choose-import';
    setMessage(tr('正在打开文件夹选择器…', 'Opening the folder picker…'), 'pending');
    updateControls();
    callAction('chooseImport').then(function (result) {
      resultOrThrow(result, tr('无法选择 Home 文件夹。', 'Could not choose a Home folder.'));
      if (result.cancelled) {
        setMessage(tr('未选择文件夹。', 'No folder selected.'), 'idle');
        return;
      }
      if (typeof result.path === 'string' && result.path) {
        els.path.value = result.path;
        if (!els.alias.value.trim()) els.alias.value = result.label || result.id || '';
        if (!els.label.value.trim()) els.label.value = result.label || result.alias || '';
        clearPlan();
        setMessage(tr('路径已填入；预览后再确认导入。', 'Path added. Preview it before confirming the import.'), 'ok');
      }
    }).catch(function (error) {
      setMessage(error.message || tr('无法选择 Home 文件夹。', 'Could not choose a Home folder.'), 'error');
    }).then(function () {
      state.busy = '';
      updateControls();
    });
  }

  function scanHomes() {
    if (state.busy || els.kind.value !== 'import') return;
    state.busy = 'scan';
    setMessage(tr('正在扫描可导入的 Home…', 'Looking for Homes to import…'), 'pending');
    updateControls();
    callAction('scan').then(function (result) {
      resultOrThrow(result, tr('无法扫描 Home。', 'Could not scan Homes.'));
      renderCandidates(Array.isArray(result.candidates) ? result.candidates : []);
      setMessage(result.candidates && result.candidates.length
        ? tr('选择一个候选项后仍需预览并确认。', 'Choose a candidate, then preview and confirm it.')
        : tr('没有发现可导入的 Home。', 'No importable Homes were found.'), 'ok');
    }).catch(function (error) {
      setMessage(error.message || tr('无法扫描 Home。', 'Could not scan Homes.'), 'error');
    }).then(function () {
      state.busy = '';
      updateControls();
    });
  }

  function renderCandidates(candidates) {
    els.scanResults.replaceChildren();
    els.scanResults.hidden = !candidates.length;
    if (!candidates.length) return;
    var label = node('label', 'multi-home-field multi-home-candidate-field');
    var select = document.createElement('select');
    select.id = 'multi-codex-home-candidate';
    select.dataset.mcFocusKey = 'candidate';
    select.appendChild(makeOption('', tr('选择发现的 Home…', 'Choose a discovered Home…')));
    candidates.forEach(function (candidate, index) {
      var item = makeOption(String(index), (candidate.label || candidate.id || candidate.path) + ' — ' + candidate.path);
      select.appendChild(item);
    });
    label.htmlFor = select.id;
    label.append(node('span', '', tr('发现的 Home', 'Discovered Homes')), select);
    select.addEventListener('change', function () {
      var candidate = candidates[Number(select.value)];
      if (!candidate) return;
      els.path.value = candidate.path || '';
      if (!els.alias.value.trim()) els.alias.value = candidate.id || candidate.label || '';
      if (!els.label.value.trim()) els.label.value = candidate.label || candidate.alias || '';
      clearPlan();
      setMessage(tr('候选路径已填入；预览后再确认导入。', 'Candidate path added. Preview it before confirming the import.'), 'ok');
    });
    els.scanResults.appendChild(label);
  }

  if (document) {
    els.root = null;
    function start() {
      els.root = document.getElementById('multi-codex-home-root');
      build();
      els.root = document.getElementById('multi-codex-home-root');
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
})(typeof window === 'object' ? window : globalThis);
