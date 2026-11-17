(function (root) {
  'use strict';

  var document = root.document;
  var state = {
    initialized: false,
    busy: '',
    status: null,
    message: '',
    messageState: 'idle',
    statusRequest: 0,
    unsubscribe: null,
    visible: false,
    dialogOpen: false,
    dialogRequest: 0,
    botRequest: 0,
    botId: '',
    bots: [],
    contexts: Object.create(null),
    activeContext: null,
    activeTerminalId: '',
    currentSessionId: '',
    viewerId: makeId('viewer'),
    pollTimer: 0,
    pollRequest: 0,
    polling: false,
    historyTimer: 0,
    historyExpanded: false,
    resizeObserver: null,
    configDirty: false,
    configSaved: null,
    returnFocus: null
  };
  var els = {};

  function tr(zh, en, params) {
    return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function'
      ? root.OpenBotI18n.t(zh, en, params) : zh;
  }

  function node(tag, className, text) {
    var item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function append(parent) {
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]);
  }

  function makeId(prefix) {
    try { if (root.crypto && typeof root.crypto.randomUUID === 'function') return prefix + '_' + root.crypto.randomUUID(); } catch (_) { }
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
  }

  function apiMethod(name) {
    return root.grokbot && typeof root.grokbot[name] === 'function' ? root.grokbot[name] : null;
  }

  function callApi(name, args) {
    var method = apiMethod(name);
    if (!method) return Promise.reject(new Error(tr('此功能需要更新后的 Bot Studio 桌面版。', 'This feature requires an updated Bot Studio desktop app.')));
    return Promise.resolve().then(function () { return method.apply(root.grokbot, args || []); });
  }

  function invoke(botId, operation, args) {
    return callApi('superterminalInvoke', [{ botId: botId, operation: operation, args: args || {} }]);
  }

  function errorFromResult(result, fallback) {
    if (result && result.ok === false) {
      var error = new Error(typeof result.message === 'string' && result.message ? result.message : fallback);
      error.code = result.code || 'TERMINAL_FAILED';
      return error;
    }
    return null;
  }

  function resultOrThrow(result, fallback) {
    var error = errorFromResult(result, fallback);
    if (error) throw error;
    return result;
  }

  function showMessage(value, tone, target) {
    target = target || els.message;
    if (!target) return;
    target.textContent = value || '';
    target.dataset.state = tone || 'idle';
  }

  function icon(container) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.7');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    var paths = ['M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17V7A1.5 1.5 0 0 1 5 5.5Z', 'm7.5 9 2.5 2.5-2.5 2.5', 'M12.5 14h4'];
    paths.forEach(function (path) {
      var item = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      item.setAttribute('d', path);
      svg.appendChild(item);
    });
    container.setAttribute('aria-hidden', 'true');
    container.appendChild(svg);
  }

  function button(id, label, action, className) {
    var item = node('button', 'btn' + (className ? ' ' + className : ''), label);
    item.type = 'button';
    item.id = id;
    item.dataset.superterminalAction = action;
    return item;
  }

  function labeledField(id, label, control) {
    var wrapper = node('label', 'superterminal-field');
    wrapper.htmlFor = id;
    append(wrapper, node('span', '', label), control);
    return wrapper;
  }

  function makeSelect(id) {
    var select = document.createElement('select');
    select.id = id;
    return select;
  }

  function option(value, label, disabled) {
    var item = node('option', '', label);
    item.value = value;
    if (disabled) item.disabled = true;
    return item;
  }

  function build() {
    var host = document.getElementById('superterminal-root');
    if (!host || state.initialized) return false;
    state.initialized = true;
    host.replaceChildren();
    var section = document.getElementById('superterminal-section');
    if (section) section.classList.add('apps-card', 'apps-superterminal-card');

    var header = node('header', 'superterminal-header');
    var mark = node('span', 'superterminal-icon');
    icon(mark);
    var heading = node('div', 'superterminal-heading');
    var titleRow = node('div', 'superterminal-title-row');
    var title = node('h3', '', tr('DSH SuperTerminal', 'DSH SuperTerminal'));
    title.id = 'superterminal-title';
    els.status = node('span', 'superterminal-status', tr('尚未读取', 'Not checked'));
    els.status.id = 'superterminal-status';
    els.status.setAttribute('role', 'status');
    els.status.setAttribute('aria-live', 'polite');
    els.status.dataset.state = 'idle';
    els.refresh = button('superterminal-refresh', tr('刷新', 'Refresh'), 'refresh');
    var statusWrap = node('div', 'superterminal-status-wrap');
    append(statusWrap, els.status, els.refresh);
    append(titleRow, title, statusWrap);
    var description = node('p', 'superterminal-description', tr(
      '为本机个人 Bot 打开独立工作目录中的终端。终端仅在你主动打开时启动。',
      'Open a terminal in a separate local workspace for a personal Bot. A terminal starts only when you open one.'
    ));
    append(heading, titleRow, description);
    append(header, mark, heading);
    host.appendChild(header);

    els.message = node('p', 'superterminal-message');
    els.message.id = 'superterminal-message';
    els.message.setAttribute('role', 'status');
    els.message.setAttribute('aria-live', 'polite');
    host.appendChild(els.message);

    els.installed = node('p', 'superterminal-installed');
    els.installed.id = 'superterminal-installed';
    host.appendChild(els.installed);

    var actions = node('div', 'superterminal-actions');
    els.install = button('superterminal-install', tr('安装插件', 'Install plugin'), 'install', 'primary');
    els.enable = button('superterminal-enable', tr('启用', 'Enable'), 'enable', 'primary');
    els.disable = button('superterminal-disable', tr('停用', 'Disable'), 'disable');
    els.open = button('superterminal-open', tr('打开 Bot 终端', 'Open Bot terminal'), 'open', 'primary');
    append(actions, els.install, els.enable, els.disable, els.open);
    host.appendChild(actions);

    var config = node('details', 'superterminal-config');
    config.id = 'superterminal-config-details';
    var configSummary = node('summary', '', tr('新终端设置', 'New terminal settings'));
    var configHint = node('p', 'superterminal-field-note', tr(
      '仅影响新建的终端；不会更改 Bot 的设置。',
      'Applies to new terminals only and does not change Bot settings.'
    ));
    var fields = node('div', 'superterminal-fields');
    els.rows = document.createElement('input');
    els.rows.id = 'superterminal-rows';
    els.rows.name = 'rows';
    els.rows.type = 'number';
    els.rows.min = '2';
    els.rows.max = '500';
    els.rows.step = '1';
    els.cols = document.createElement('input');
    els.cols.id = 'superterminal-cols';
    els.cols.name = 'cols';
    els.cols.type = 'number';
    els.cols.min = '10';
    els.cols.max = '1000';
    els.cols.step = '1';
    els.defaultLauncher = makeSelect('superterminal-default-launcher');
    append(fields,
      labeledField(els.rows.id, tr('行数', 'Rows'), els.rows),
      labeledField(els.cols.id, tr('列数', 'Columns'), els.cols),
      labeledField(els.defaultLauncher.id, tr('默认启动器', 'Default launcher'), els.defaultLauncher));
    var configForm = node('form', 'superterminal-config-form');
    configForm.id = 'superterminal-config-form';
    configForm.noValidate = true;
    els.saveConfig = node('button', 'btn primary', tr('保存设置', 'Save settings'));
    els.saveConfig.type = 'submit';
    els.saveConfig.id = 'superterminal-save-config';
    append(configForm, fields, configHint, els.saveConfig);
    append(config, configSummary, configForm);
    host.appendChild(config);

    els.openNote = node('p', 'superterminal-field-note', tr(
      '终端仅接入本机个人 Bot。共享群组和远端节点暂不支持。',
      'Terminals are available for local personal Bots. Shared groups and remote nodes are not supported.'
    ));
    host.appendChild(els.openNote);

    buildDialog(host);
    bindEvents(configForm);
    renderStatus();
    watchVisibility();
    subscribeChanges();
    setMessage(apiMethod('superterminalStatus')
      ? tr('打开此页时读取本机插件状态，不会自动安装或启用。', 'Local plugin status is read when this page opens; the plugin is never installed or enabled automatically.')
      : tr('此功能需要 Bot Studio 桌面版。', 'This feature requires the Bot Studio desktop app.'), apiMethod('superterminalStatus') ? 'idle' : 'error');
    return true;
  }

  function buildDialog(host) {
    els.dialog = document.createElement('dialog');
    els.dialog.id = 'superterminal-dialog';
    els.dialog.className = 'superterminal-dialog';
    els.dialog.setAttribute('aria-labelledby', 'superterminal-dialog-title');
    var dialogHeader = node('header', 'superterminal-dialog-header');
    var dialogHeading = node('div', 'superterminal-dialog-heading');
    var dialogTitle = node('h2', '', tr('Bot 终端', 'Bot terminal'));
    dialogTitle.id = 'superterminal-dialog-title';
    var dialogDescription = node('p', '', tr(
      '命令在所选 Bot 的本机工作目录中运行。终端输出只表示进程输出。',
      'Commands run in the selected Bot’s local workspace. Terminal output reports process output only.'
    ));
    els.dialogClose = button('superterminal-dialog-close', tr('关闭', 'Close'), 'close-dialog');
    append(dialogHeading, dialogTitle, dialogDescription);
    append(dialogHeader, dialogHeading, els.dialogClose);

    var toolbar = node('div', 'superterminal-toolbar');
    els.botSelect = makeSelect('superterminal-bot-select');
    els.launcherSelect = makeSelect('superterminal-launcher-select');
    append(toolbar,
      labeledField(els.botSelect.id, tr('Bot', 'Bot'), els.botSelect),
      labeledField(els.launcherSelect.id, tr('启动器', 'Launcher'), els.launcherSelect));
    els.newTerminal = button('superterminal-new', tr('新建终端', 'New terminal'), 'new-terminal', 'primary');
    toolbar.appendChild(els.newTerminal);

    els.cwd = node('p', 'superterminal-location');
    els.cwd.id = 'superterminal-location';
    els.cwd.setAttribute('aria-live', 'polite');
    els.tabs = node('div', 'superterminal-tabs');
    els.tabs.id = 'superterminal-terminal-tabs';
    els.tabs.setAttribute('role', 'tablist');
    els.tabs.setAttribute('aria-label', tr('终端标签', 'Terminal tabs'));
    els.dialogMessage = node('p', 'superterminal-dialog-message');
    els.dialogMessage.id = 'superterminal-dialog-message';
    els.dialogMessage.setAttribute('role', 'status');
    els.dialogMessage.setAttribute('aria-live', 'polite');
    els.empty = node('p', 'superterminal-empty', tr('此 Bot 尚无终端。选择启动器后新建一个终端。', 'This Bot has no terminals yet. Choose a launcher to open one.'));
    els.empty.id = 'superterminal-empty';
    var outputFrame = node('section', 'superterminal-output-frame');
    outputFrame.setAttribute('aria-label', tr('终端输出', 'Terminal output'));
    var outputHeader = node('div', 'superterminal-output-header');
    els.terminalState = node('span', 'superterminal-terminal-state', tr('未连接', 'Not connected'));
    els.terminalState.id = 'superterminal-terminal-state';
    els.outputNote = node('span', 'superterminal-output-note', tr('只显示真实终端输出', 'Shows live terminal output'));
    append(outputHeader, els.terminalState, els.outputNote);
    els.outputBlank = node('p', 'superterminal-output-blank', tr('此处会显示终端输出。', 'Terminal output will appear here.'));
    els.output = node('div', 'superterminal-output');
    els.output.id = 'superterminal-terminal-output';
    els.output.setAttribute('aria-label', tr('终端输出', 'Terminal output'));
    els.output.setAttribute('aria-live', 'off');
    append(outputFrame, outputHeader, els.outputBlank, els.output);

    els.historyDetails = node('details', 'superterminal-history');
    els.historyDetails.id = 'superterminal-command-history';
    els.historySummary = node('summary', 'superterminal-history-summary');
    els.historyTitle = node('span', '', tr('命令历史', 'Command history'));
    els.historyCount = node('span', 'superterminal-history-count', '');
    append(els.historySummary, els.historyTitle, els.historyCount);
    var historyPanel = node('div', 'superterminal-history-panel');
    var historyTop = node('div', 'superterminal-history-top');
    els.historyNote = node('p', 'superterminal-history-note', tr(
      '重跑会在此终端的当前目录发送一条已完成的单行命令；需要空闲提示符。',
      'Run again sends a completed single-line command in this terminal’s current directory and requires an idle prompt.'
    ));
    els.historyRefresh = button('superterminal-history-refresh', tr('刷新', 'Refresh'), 'history-refresh');
    append(historyTop, els.historyNote, els.historyRefresh);
    var historyFilters = node('div', 'superterminal-history-filters');
    els.historySearch = document.createElement('input');
    els.historySearch.id = 'superterminal-history-search';
    els.historySearch.type = 'search';
    els.historySearch.autocomplete = 'off';
    els.historySearch.maxLength = 160;
    els.historySearch.placeholder = tr('搜索命令和输出…', 'Search commands and output…');
    els.historySearch.setAttribute('aria-label', tr('搜索命令历史', 'Search command history'));
    els.historyFilter = makeSelect('superterminal-history-filter');
    els.historyFilter.setAttribute('aria-label', tr('按状态筛选命令历史', 'Filter command history by status'));
    [
      ['all', tr('全部状态', 'All statuses')],
      ['succeeded', tr('已完成', 'Succeeded')],
      ['failed', tr('失败', 'Failed')],
      ['running', tr('运行中', 'Running')],
      ['interrupted', tr('已中断', 'Interrupted')]
    ].forEach(function (item) { els.historyFilter.appendChild(option(item[0], item[1], false)); });
    append(historyFilters, els.historySearch, els.historyFilter);
    els.historyStatus = node('p', 'superterminal-history-status');
    els.historyStatus.id = 'superterminal-history-status';
    els.historyStatus.setAttribute('role', 'status');
    els.historyStatus.setAttribute('aria-live', 'polite');
    els.historyList = node('ol', 'superterminal-history-list');
    els.historyList.id = 'superterminal-history-list';
    els.historyList.setAttribute('aria-label', tr('命令历史记录', 'Command history records'));
    append(historyPanel, historyTop, historyFilters, els.historyStatus, els.historyList);
    append(els.historyDetails, els.historySummary, historyPanel);

    var controlRow = node('div', 'superterminal-control-row');
    var leaseGroup = node('div', 'superterminal-lease-actions');
    els.takeControl = button('superterminal-take-control', tr('接管输入', 'Take control'), 'take-control');
    els.stop = button('superterminal-stop', tr('停止终端', 'Stop terminal'), 'stop', 'danger');
    append(leaseGroup, els.takeControl, els.stop);
    var commandForm = node('form', 'superterminal-command-form');
    commandForm.id = 'superterminal-command-form';
    els.command = document.createElement('input');
    els.command.id = 'superterminal-command-input';
    els.command.type = 'text';
    els.command.name = 'command';
    els.command.autocomplete = 'off';
    els.command.spellcheck = false;
    els.command.setAttribute('aria-label', tr('输入命令', 'Enter a command'));
    els.command.placeholder = tr('输入一条命令…', 'Enter a command…');
    els.command.setAttribute('aria-describedby', 'superterminal-command-note');
    els.send = node('button', 'btn primary', tr('发送', 'Send'));
    els.send.type = 'submit';
    els.send.id = 'superterminal-send';
    append(commandForm, els.command, els.send);
    append(controlRow, leaseGroup, commandForm);
    els.commandNote = node('p', 'superterminal-command-note', tr(
      '先接管输入再发送命令。输入控制不会随轮询自动取得。',
      'Take control before sending a command. Reading output never takes control.'
    ));
    els.commandNote.id = 'superterminal-command-note';

    append(els.dialog, dialogHeader, toolbar, els.cwd, els.tabs, els.dialogMessage, els.empty,
      outputFrame, els.historyDetails, controlRow, els.commandNote);
    host.appendChild(els.dialog);
    if (typeof root.ResizeObserver === 'function') {
      state.resizeObserver = new root.ResizeObserver(function () {
        var session = currentSession();
        if (session) scheduleTerminalResize(session);
      });
      state.resizeObserver.observe(els.output);
    }
  }

  function bindEvents(configForm) {
    els.refresh.addEventListener('click', refreshStatus);
    els.install.addEventListener('click', function () { runPluginAction('install'); });
    els.enable.addEventListener('click', function () { runPluginAction('enable'); });
    els.disable.addEventListener('click', function () { runPluginAction('disable'); });
    els.open.addEventListener('click', openDialog);
    els.rows.addEventListener('input', markConfigDirty);
    els.cols.addEventListener('input', markConfigDirty);
    els.defaultLauncher.addEventListener('change', markConfigDirty);
    configForm.addEventListener('submit', saveConfig);
    els.dialogClose.addEventListener('click', function () { if (els.dialog.open) els.dialog.close(); });
    els.dialog.addEventListener('cancel', function (event) {
      if (state.busy) { event.preventDefault(); return; }
      stopPoll();
    });
    els.dialog.addEventListener('close', onDialogClose);
    els.historyDetails.addEventListener('toggle', onHistoryToggle);
    els.historyRefresh.addEventListener('click', function () { loadCommandHistory(currentSession(), true); });
    els.historySearch.addEventListener('input', function () { renderCommandHistory(currentSession()); });
    els.historyFilter.addEventListener('change', function () { renderCommandHistory(currentSession()); });
    els.historyList.addEventListener('click', onHistoryActionClick);
    els.botSelect.addEventListener('change', function () { selectBot(els.botSelect.value); });
    els.launcherSelect.addEventListener('change', function () {
      if (state.activeContext) state.activeContext.launcherExplicit = true;
      updateDialogControls();
    });
    els.newTerminal.addEventListener('click', openTerminal);
    els.tabs.addEventListener('click', onTabClick);
    els.tabs.addEventListener('keydown', onTabKeydown);
    els.takeControl.addEventListener('click', takeControl);
    els.stop.addEventListener('click', stopTerminal);
    els.command.addEventListener('input', saveDraft);
    els.command.addEventListener('keydown', onCommandKeydown);
    els.commandForm = document.getElementById('superterminal-command-form');
    els.commandForm.addEventListener('submit', sendCommand);
    document.addEventListener('visibilitychange', onDocumentVisibility);
  }

  function markConfigDirty() {
    state.configDirty = true;
    updateControls();
  }

  function setMessage(value, tone) {
    state.message = value || '';
    state.messageState = tone || 'idle';
    showMessage(state.message, state.messageState, els.message);
  }

  function currentConfig() {
    return {
      rows: Number(els.rows.value),
      cols: Number(els.cols.value),
      defaultLauncher: els.defaultLauncher.value
    };
  }

  function configMatches(a, b) {
    return !!a && !!b && a.rows === b.rows && a.cols === b.cols && a.defaultLauncher === b.defaultLauncher;
  }

  function syncConfigInputs(settings, force) {
    if (!settings || (!force && state.configDirty)) return;
    els.rows.value = String(settings.rows);
    els.cols.value = String(settings.cols);
    fillLauncherOptions(els.defaultLauncher, state.status && state.status.launchers, settings.defaultLauncher, true);
    state.configSaved = { rows: settings.rows, cols: settings.cols, defaultLauncher: settings.defaultLauncher };
    state.configDirty = false;
  }

  function fillLauncherOptions(select, launchers, selected, includeUnavailable) {
    var current = selected == null ? select.value : String(selected);
    select.replaceChildren();
    var list = Array.isArray(launchers) ? launchers : [];
    if (!list.length) {
      select.appendChild(option('', tr('没有可用启动器', 'No launchers available'), true));
      return;
    }
    list.forEach(function (launcher) {
      if (!launcher || typeof launcher.id !== 'string') return;
      if (!includeUnavailable && launcher.available !== true) return;
      var label = String(launcher.label || launcher.id);
      if (launcher.available !== true) label += tr('（不可用）', ' (unavailable)');
      var item = option(launcher.id, label, launcher.available !== true);
      select.appendChild(item);
    });
    if (current && Array.prototype.some.call(select.options, function (item) { return item.value === current; })) select.value = current;
    else if (select.options.length) select.selectedIndex = 0;
  }

  function applyStatus(status) {
    state.status = status && typeof status === 'object' ? status : null;
    if (state.status) syncConfigInputs(state.status.settings, false);
    renderStatus();
  }

  function renderStatus() {
    var status = state.status;
    var available = status && Array.isArray(status.launchers) ? status.launchers.filter(function (item) { return item && item.available === true; }) : [];
    var label;
    if (!status) label = tr('尚未读取', 'Not checked');
    else if (status.error) label = tr('需要修复', 'Needs attention');
    else if (!status.installed) label = tr('未安装', 'Not installed');
    else if (status.enabled) label = tr('已启用', 'Enabled');
    else label = tr('已停用', 'Disabled');
    els.status.textContent = label;
    els.status.dataset.state = !status ? 'idle' : status.error ? 'error' : status.enabled ? 'active' : status.installed ? 'idle' : 'off';
    if (!status) {
      els.installed.textContent = '';
      els.installed.hidden = true;
    } else {
      var info = [];
      if (status.installed && status.version) info.push(tr('版本 {version}', 'Version {version}', { version: status.version }));
      if (status.backend) info.push(status.backend);
      info.push(tr('{count} 个启动器可用', '{count} launchers available', { count: available.length }));
      if (Number.isFinite(status.activeTerminals)) info.push(tr('{count} 个终端正在运行', '{count} active terminals', { count: status.activeTerminals }));
      els.installed.textContent = info.join(' · ');
      els.installed.hidden = false;
    }
    if (status && status.error) setMessage(String(status.error), 'error');
    updateControls();
    renderLauncherSelects();
  }

  function renderLauncherSelects() {
    var launchers = state.status && state.status.launchers;
    if (els.defaultLauncher && state.status && state.status.settings) {
      var wanted = state.configDirty ? els.defaultLauncher.value : state.status.settings.defaultLauncher;
      fillLauncherOptions(els.defaultLauncher, launchers, wanted, true);
    }
    if (els.launcherSelect) {
      var selected = els.launcherSelect.value;
      fillLauncherOptions(els.launcherSelect, launchers, selected || (state.status && state.status.settings && state.status.settings.defaultLauncher), false);
    }
  }

  function updateControls() {
    var status = state.status;
    var busy = !!state.busy;
    els.refresh.disabled = busy;
    els.install.hidden = !!(status && status.installed);
    els.enable.hidden = !(status && status.installed && !status.enabled);
    els.disable.hidden = !(status && status.installed && status.enabled);
    els.install.disabled = busy || !apiMethod('superterminalInstall');
    els.enable.disabled = busy || !apiMethod('superterminalEnable');
    els.disable.disabled = busy || !apiMethod('superterminalDisable');
    els.open.disabled = busy || !status || !status.enabled || !apiMethod('superterminalInvoke');
    els.rows.disabled = busy || !status || !status.installed;
    els.cols.disabled = busy || !status || !status.installed;
    els.defaultLauncher.disabled = busy || !status || !status.installed || !Array.isArray(status.launchers) || !status.launchers.length;
    var cfg = status && status.settings ? currentConfig() : null;
    els.saveConfig.disabled = busy || !status || !status.installed || !validConfig(cfg, status) || !state.configDirty || configMatches(cfg, state.configSaved);
    if (els.dialog && els.dialog.open) updateDialogControls();
  }

  function validConfig(config, status) {
    if (!config || !Number.isInteger(config.rows) || config.rows < 2 || config.rows > 500 ||
        !Number.isInteger(config.cols) || config.cols < 10 || config.cols > 1000 || !config.defaultLauncher) return false;
    return Array.isArray(status.launchers) && status.launchers.some(function (item) { return item && item.id === config.defaultLauncher; });
  }

  function refreshStatus() {
    if (!state.initialized) return Promise.resolve();
    var method = apiMethod('superterminalStatus');
    var request = ++state.statusRequest;
    if (!method) {
      state.status = null;
      renderStatus();
      setMessage(tr('此功能需要 Bot Studio 桌面版。', 'This feature requires the Bot Studio desktop app.'), 'error');
      return Promise.resolve();
    }
    state.busy = state.busy || 'status';
    if (!state.message || state.messageState === 'idle') setMessage(tr('正在读取本机插件状态…', 'Reading local plugin status…'), 'pending');
    updateControls();
    return callApi('superterminalStatus').then(function (result) {
      if (request !== state.statusRequest || !isSettingsVisible()) return;
      resultOrThrow(result, tr('无法读取插件状态。', 'Could not read plugin status.'));
      if (!result.status || typeof result.status !== 'object') throw new Error(tr('插件返回的状态无效。', 'The plugin returned an invalid status.'));
      applyStatus(result.status);
      if (!state.busy || state.busy === 'status') setMessage(tr('插件状态已刷新。', 'Plugin status refreshed.'), 'ok');
    }).catch(function (error) {
      if (request !== state.statusRequest) return;
      setMessage(error.message || tr('无法读取插件状态。', 'Could not read plugin status.'), 'error');
    }).then(function () {
      if (state.busy === 'status') state.busy = '';
      updateControls();
    });
  }

  function runPluginAction(operation) {
    if (state.busy) return;
    state.busy = operation;
    setMessage(actionMessage(operation, 'pending'), 'pending');
    updateControls();
    var method = operation === 'install' ? 'superterminalInstall' : operation === 'enable' ? 'superterminalEnable' : 'superterminalDisable';
    return callApi(method).then(function (result) {
      resultOrThrow(result, actionMessage(operation, 'error'));
      if (!result.status || typeof result.status !== 'object') throw new Error(tr('插件返回的状态无效。', 'The plugin returned an invalid status.'));
      applyStatus(result.status);
      setMessage(actionMessage(operation, 'ok'), 'ok');
    }).catch(function (error) {
      setMessage(error.message || actionMessage(operation, 'error'), 'error');
      if (error.code === 'REVISION_CONFLICT') refreshStatus();
    }).then(function () {
      state.busy = '';
      updateControls();
    });
  }

  function actionMessage(operation, tone) {
    var copy = {
      install: {
        pending: tr('正在安装本地插件…', 'Installing the local plugin…'),
        ok: tr('SuperTerminal 插件已安装。', 'SuperTerminal plugin installed.'),
        error: tr('安装插件失败。', 'Plugin installation failed.')
      },
      enable: {
        pending: tr('正在启用终端服务…', 'Enabling the terminal service…'),
        ok: tr('终端服务已启用。', 'Terminal service is enabled.'),
        error: tr('启用终端服务失败。', 'Could not enable the terminal service.')
      },
      disable: {
        pending: tr('正在停止终端服务…', 'Stopping the terminal service…'),
        ok: tr('终端服务已停用。', 'Terminal service is disabled.'),
        error: tr('停用终端服务失败。', 'Could not disable the terminal service.')
      }
    };
    return copy[operation][tone];
  }

  function saveConfig(event) {
    event.preventDefault();
    if (state.busy || !state.status) return;
    var config = currentConfig();
    if (!validConfig(config, state.status)) {
      setMessage(tr('请检查行数、列数和启动器。', 'Check the rows, columns and launcher.'), 'error');
      return;
    }
    state.busy = 'configure';
    setMessage(tr('正在保存终端设置…', 'Saving terminal settings…'), 'pending');
    updateControls();
    return callApi('superterminalConfigure', [{
      expectedRevision: state.status.revision,
      rows: config.rows,
      cols: config.cols,
      defaultLauncher: config.defaultLauncher
    }]).then(function (result) {
      resultOrThrow(result, tr('终端设置没有保存。', 'Terminal settings were not saved.'));
      if (!result.status || typeof result.status !== 'object') throw new Error(tr('插件返回的状态无效。', 'The plugin returned an invalid status.'));
      state.configDirty = false;
      applyStatus(result.status);
      syncConfigInputs(result.status.settings, true);
      setMessage(tr('终端设置已保存。', 'Terminal settings saved.'), 'ok');
    }).catch(function (error) {
      setMessage(error.message || tr('终端设置没有保存。', 'Terminal settings were not saved.'), 'error');
      if (error.code === 'REVISION_CONFLICT') refreshStatus();
    }).then(function () {
      state.busy = '';
      updateControls();
    });
  }

  function isSettingsVisible() {
    var panel = document.getElementById('set-panel-apps');
    var mask = document.getElementById('set-mask');
    return !!(panel && !panel.hidden && mask && !mask.classList.contains('hidden') && !document.hidden);
  }

  function isTerminalVisible() {
    return !!(state.dialogOpen && els.dialog && els.dialog.open && !document.hidden);
  }

  function watchVisibility() {
    var panel = document.getElementById('set-panel-apps');
    var mask = document.getElementById('set-mask');
    if (!panel) return;
    var wasVisible = isSettingsVisible();
    state.visible = wasVisible;
    if (wasVisible) refreshStatus();
    function onChange() {
      var visible = isSettingsVisible();
      if (visible && !wasVisible) refreshStatus();
      if (!visible && state.dialogOpen && els.dialog.open) els.dialog.close();
      wasVisible = visible;
      state.visible = visible;
    }
    if (typeof root.MutationObserver === 'function') {
      var observer = new root.MutationObserver(onChange);
      observer.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
      if (mask) observer.observe(mask, { attributes: true, attributeFilter: ['class', 'hidden'] });
    }
    document.addEventListener('visibilitychange', onChange);
  }

  function onDocumentVisibility() {
    if (!document.hidden && isSettingsVisible() && !state.status) refreshStatus();
    if (document.hidden) stopPoll();
    else if (isTerminalVisible()) startPoll();
  }

  function subscribeChanges() {
    var method = apiMethod('onSuperterminalChanged');
    if (!method || state.unsubscribe) return;
    try {
      var off = method.call(root.grokbot, function (payload) {
        if (!payload || payload.ok === false) return;
        if (isSettingsVisible()) refreshStatus();
        if (isTerminalVisible() && state.activeContext) refreshTerminals(state.activeContext, state.botRequest, false);
      });
      if (typeof off === 'function') {
        state.unsubscribe = off;
        root.addEventListener('pagehide', unsubscribeChanges, { once: true });
      }
    } catch (_) { state.unsubscribe = null; }
  }

  function unsubscribeChanges() {
    if (typeof state.unsubscribe === 'function') {
      try { state.unsubscribe(); } catch (_) { }
    }
    state.unsubscribe = null;
  }

  function openDialog() {
    if (state.busy || !state.status || !state.status.enabled || els.dialog.open) return;
    state.returnFocus = document.activeElement;
    state.dialogOpen = true;
    state.dialogRequest++;
    state.botId = '';
    state.activeContext = null;
    state.activeTerminalId = '';
    state.currentSessionId = '';
    state.bots = [];
    els.dialogMessage.textContent = '';
    renderBots();
    renderSessions(null);
    updateDialogControls();
    try { els.dialog.showModal(); } catch (_) { els.dialog.setAttribute('open', 'open'); }
    var generation = state.dialogRequest;
    setDialogMessage(tr('正在读取本机 Bot…', 'Loading local Bots…'), 'pending');
    loadProfileBots(generation).then(function (bots) {
      if (!isTerminalVisible() || generation !== state.dialogRequest) return;
      state.bots = bots;
      renderBots();
      if (bots.length) {
        els.botSelect.focus();
        setDialogMessage(tr('请选择要打开终端的 Bot。', 'Choose a Bot for this terminal.'), 'idle');
      } else {
        setDialogMessage(tr('没有可用的本机个人 Bot。远端节点和共享群组暂不支持。', 'No local personal Bots are available. Remote nodes and shared groups are not supported.'), 'error');
      }
      updateDialogControls();
    }).catch(function (error) {
      if (generation !== state.dialogRequest) return;
      setDialogMessage(error.message || tr('无法读取本机 Bot。', 'Could not load local Bots.'), 'error');
    });
  }

  function loadProfileBots(generation) {
    return callApi('loadState').then(function (snapshot) {
      if (!snapshot || !Array.isArray(snapshot.bots)) throw new Error(tr('无法读取 Bot 档案。', 'Could not read the Bot profile.'));
      return snapshot.bots.filter(isLocalPersonalBot).map(function (bot) {
        return { id: String(bot.id), name: String(bot.name || bot.id) };
      });
    });
  }

  function isLocalPersonalBot(bot) {
    if (!bot || typeof bot.id !== 'string' || !bot.id.trim()) return false;
    var location = String(bot.executionLocation || 'local').toLowerCase();
    if (location !== 'local' || bot.nodeHostId || bot.orgSpaceId || bot.organizationId || bot.groupId || bot.sharedGroupId) return false;
    if (bot.isOrganizationInstance === true || bot.isGroupBot === true || bot.scope === 'group' || bot.scope === 'organization') return false;
    var scope = bot.scope;
    if (scope && typeof scope === 'object' && (scope.orgSpaceId || scope.spaceId || scope.mode === 'group' || scope.mode === 'organization')) return false;
    return true;
  }

  function renderBots() {
    if (!els.botSelect) return;
    var current = state.botId;
    els.botSelect.replaceChildren();
    els.botSelect.appendChild(option('', tr('选择 Bot…', 'Choose a Bot…'), false));
    state.bots.forEach(function (bot) {
      els.botSelect.appendChild(option(bot.id, bot.name, false));
    });
    els.botSelect.value = current;
  }

  function selectBot(botId) {
    if (!state.dialogOpen) return;
    stopHistoryPoll();
    invalidateAllHistoryRequests();
    stopPoll();
    state.pollRequest++;
    state.botRequest++;
    state.botId = String(botId || '');
    state.activeTerminalId = '';
    state.currentSessionId = '';
    state.activeContext = state.botId ? contextFor(state.botId) : null;
    if (state.activeContext) {
      state.activeContext.launcherExplicit = false;
      state.activeContext.settingsLoading = true;
      state.activeContext.settingsLoaded = false;
      state.activeContext.settingsError = '';
      els.launcherSelect.value = '';
    }
    renderSessions(state.activeContext);
    updateDialogControls();
    if (state.activeContext) {
      refreshTerminals(state.activeContext, state.botRequest, true);
      refreshBotTerminalSettings(state.activeContext, state.botRequest);
    } else {
      els.cwd.textContent = '';
      setDialogMessage('', 'idle');
    }
  }

  function contextFor(botId) {
    if (!state.contexts[botId]) state.contexts[botId] = {
      botId: botId, sessions: [], selectedId: '', cwd: '', generation: 0, listBusy: false, listError: '',
      terminalSettings: null, settingsLoading: false, settingsLoaded: false, settingsError: '', settingsRequest: 0,
      launcherExplicit: false
    };
    return state.contexts[botId];
  }

  function refreshBotTerminalSettings(context, generation) {
    if (!context || !state.dialogOpen) return Promise.resolve();
    var request = ++context.settingsRequest;
    context.settingsLoading = true;
    context.settingsLoaded = false;
    updateDialogControls();
    return invoke(context.botId, 'settings', {}).then(function (result) {
      resultOrThrow(result, tr('无法读取此 Bot 的终端设置。', 'Could not read this Bot’s terminal settings.'));
      if (!isTerminalVisible() || state.activeContext !== context || generation !== state.botRequest || request !== context.settingsRequest) return;
      if (!result.settings || typeof result.settings !== 'object') throw new Error(tr('Bot 终端设置返回格式无效。', 'The Bot terminal settings response is invalid.'));
      context.terminalSettings = result.settings;
      context.settingsError = '';
      context.settingsLoaded = true;
      context.settingsLoading = false;
      applyBotLauncherDefault(context);
    }).catch(function (error) {
      if (!isTerminalVisible() || state.activeContext !== context || generation !== state.botRequest || request !== context.settingsRequest) return;
      context.terminalSettings = null;
      context.settingsError = error && error.message ? error.message : tr('无法读取此 Bot 的终端设置。', 'Could not read this Bot’s terminal settings.');
      context.settingsLoaded = true;
      context.settingsLoading = false;
      applyBotLauncherDefault(context);
      setDialogMessage(tr('未能读取 Bot 专属启动器默认值，暂用全局默认值。', 'Could not read this Bot’s launcher default; using the global default.'), 'error');
    }).then(function () {
      if (isTerminalVisible() && state.activeContext === context && generation === state.botRequest && request === context.settingsRequest) {
        updateDialogControls();
      }
    });
  }

  function applyBotLauncherDefault(context) {
    if (!context || context.launcherExplicit) return;
    var desired = context.terminalSettings && context.terminalSettings.defaultLauncher ||
      state.status && state.status.settings && state.status.settings.defaultLauncher || '';
    if (desired && Array.prototype.some.call(els.launcherSelect.options, function (item) { return item.value === desired; })) {
      els.launcherSelect.value = desired;
    }
  }

  function refreshTerminals(context, generation, announce) {
    if (!context || !state.dialogOpen) return Promise.resolve();
    var token = ++context.generation;
    context.listBusy = true;
    if (announce) setDialogMessage(tr('正在读取终端…', 'Loading terminals…'), 'pending');
    return invoke(context.botId, 'list', {}).then(function (result) {
      resultOrThrow(result, tr('无法读取终端列表。', 'Could not read terminal list.'));
      if (!isTerminalVisible() || state.activeContext !== context || generation !== state.botRequest || token !== context.generation) return;
      context.cwd = typeof result.cwd === 'string' ? result.cwd : '';
      mergeSessions(context, result.terminals);
      context.listError = '';
      updateLauncherChoices(result.launchers);
      renderSessions(context);
      updateDialogControls();
      setDialogMessage('', 'idle');
      if (context.selectedId) startPoll();
    }).catch(function (error) {
      if (!isTerminalVisible() || state.activeContext !== context || generation !== state.botRequest || token !== context.generation) return;
      context.listError = error.message || tr('无法读取终端列表。', 'Could not read terminal list.');
      setDialogMessage(context.listError, 'error');
      renderSessions(context);
    }).then(function () {
      if (token === context.generation) context.listBusy = false;
      updateDialogControls();
    });
  }

  function mergeSessions(context, incoming) {
    var old = Object.create(null);
    context.sessions.forEach(function (session) { old[session.id] = session; });
    var sessions = (Array.isArray(incoming) ? incoming : []).filter(function (item) { return item && typeof item.id === 'string'; }).map(function (item) {
      var session = old[item.id] || newSession(context.botId, item);
      session.launcher = String(item.launcher || session.launcher || 'shell');
      session.state = String(item.state || session.state || 'unknown');
      session.rows = Number.isInteger(item.rows) ? item.rows : session.rows;
      session.cols = Number.isInteger(item.cols) ? item.cols : session.cols;
      session.writer = item.writer || null;
      session.exitCode = item.exitCode;
      if (session.terminal && (session.terminal.rows !== session.rows || session.terminal.cols !== session.cols)) {
        session.terminal.resize(session.cols, session.rows);
      }
      return session;
    });
    old && Object.keys(old).forEach(function (id) {
      if (!sessions.some(function (item) { return item.id === id; })) disposeSessionTerminal(old[id]);
    });
    context.sessions = sessions;
    if (context.selectedId && !sessions.some(function (item) { return item.id === context.selectedId; })) context.selectedId = '';
    if (state.activeContext === context) state.activeTerminalId = context.selectedId;
  }

  function newSession(botId, summary) {
    return {
      id: summary.id,
      botId: botId,
      launcher: summary.launcher || 'shell',
      state: summary.state || 'starting',
      rows: Number.isInteger(summary.rows) ? summary.rows : 24,
      cols: Number.isInteger(summary.cols) ? summary.cols : 100,
      writer: summary.writer || null,
      exitCode: summary.exitCode,
      lease: null,
      nextSequence: null,
      draft: '',
      readOffset: 0,
      readPending: false,
      historyRecords: [],
      historyStatus: 'idle',
      historyReason: '',
      historyTruncated: false,
      historyTotal: 0,
      historyLoading: false,
      historyLoaded: false,
      historyRequest: 0,
      terminal: null,
      terminalElement: null,
      fitAddon: null,
      writeQueue: Promise.resolve(),
      pendingInputChars: 0,
      resizeTimer: 0,
      resizing: false,
      busy: '',
      writeUnknown: false
    };
  }

  function updateLauncherChoices(launchers) {
    if (Array.isArray(launchers)) {
      if (state.status) state.status.launchers = launchers;
      var context = state.activeContext;
      var selectedLauncher = context && context.launcherExplicit ? els.launcherSelect.value :
        context && context.terminalSettings && context.terminalSettings.defaultLauncher ||
        (state.status && state.status.settings && state.status.settings.defaultLauncher);
      fillLauncherOptions(els.launcherSelect, launchers, selectedLauncher, false);
      fillLauncherOptions(els.defaultLauncher, launchers, state.configDirty ? els.defaultLauncher.value : (state.status && state.status.settings && state.status.settings.defaultLauncher), true);
      applyBotLauncherDefault(context);
    }
  }

  function openTerminal() {
    var context = state.activeContext;
    var launcher = els.launcherSelect.value;
    if (!context || !context.botId || !launcher || state.busy || !state.status || !state.status.enabled) return;
    var found = state.status.launchers && state.status.launchers.some(function (item) { return item && item.id === launcher && item.available === true; });
    if (!found) {
      setDialogMessage(tr('此启动器当前不可用。', 'This launcher is not currently available.'), 'error');
      return;
    }
    var generation = state.botRequest;
    var requestId = makeId('open');
    state.busy = 'open';
    setDialogMessage(tr('正在打开终端…', 'Opening terminal…'), 'pending');
    updateDialogControls();
    invoke(context.botId, 'open', { requestId: requestId, launcher: launcher }).then(function (result) {
      resultOrThrow(result, tr('无法打开终端。', 'Could not open the terminal.'));
      if (!isTerminalVisible() || state.activeContext !== context || generation !== state.botRequest) return;
      var session = newSession(context.botId, result);
      context.sessions = context.sessions.filter(function (item) { return item.id !== session.id; });
      context.sessions.push(session);
      context.selectedId = session.id;
      state.activeTerminalId = session.id;
      state.currentSessionId = session.id;
      updateLauncherChoices(result.launchers || state.status.launchers);
      renderSessions(context);
      setDialogMessage(tr('终端已打开。接管输入后即可发送命令。', 'Terminal opened. Take control before sending commands.'), 'ok');
      updateDialogControls();
      startPoll();
    }).catch(function (error) {
      if (generation !== state.botRequest) return;
      setDialogMessage(error.message || tr('无法打开终端。', 'Could not open the terminal.'), 'error');
    }).then(function () {
      state.busy = '';
      updateDialogControls();
    });
  }

  function renderSessions(context) {
    if (!els.tabs) return;
    var focusedId = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.terminalId : '';
    els.tabs.replaceChildren();
    if (!context || !context.sessions.length) {
      els.empty.hidden = !(context && context.sessions.length === 0);
      els.tabs.hidden = true;
      els.cwd.textContent = context && context.cwd ? tr('工作目录：{cwd}', 'Working directory: {cwd}', { cwd: context.cwd }) : '';
      resetOutput(null);
      renderHistoryForSession(null);
      state.activeTerminalId = '';
      state.currentSessionId = '';
      updateDialogControls();
      return;
    }
    els.empty.hidden = true;
    els.tabs.hidden = false;
    context.sessions.forEach(function (session, index) {
      var bot = state.bots.find(function (item) { return item.id === context.botId; });
      var launcher = launcherLabel(session.launcher);
      var label = launcher + ' ' + (index + 1);
      var tab = node('button', 'superterminal-tab', label);
      tab.type = 'button';
      tab.id = 'superterminal-tab-' + safeId(session.id);
      tab.dataset.terminalId = session.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(session.id === context.selectedId));
      tab.setAttribute('aria-controls', 'superterminal-terminal-output');
      tab.title = (bot ? bot.name + ' · ' : '') + launcher + ' · ' + terminalStateLabel(session.state);
      if (session.id === context.selectedId) tab.classList.add('selected');
      els.tabs.appendChild(tab);
    });
    if (focusedId && els.tabs.querySelector('[data-terminal-id="' + cssEscape(focusedId) + '"]')) {
      els.tabs.querySelector('[data-terminal-id="' + cssEscape(focusedId) + '"]').focus();
    }
    state.activeTerminalId = context.selectedId;
    selectSession(context, context.selectedId, true);
    updateDialogControls();
  }

  function cssEscape(value) {
    if (root.CSS && typeof root.CSS.escape === 'function') return root.CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function safeId(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'terminal';
  }

  function onTabClick(event) {
    var tab = event.target.closest('[data-terminal-id]');
    if (!tab || !state.activeContext) return;
    state.activeContext.selectedId = tab.dataset.terminalId;
    selectSession(state.activeContext, state.activeContext.selectedId, false);
  }

  function onTabKeydown(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    var tabs = Array.prototype.slice.call(els.tabs.querySelectorAll('[role="tab"]'));
    var index = tabs.indexOf(document.activeElement);
    if (index < 0 || !tabs.length) return;
    event.preventDefault();
    var next = (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
  }

  function selectSession(context, terminalId, preserveFocus) {
    var previousSession = context && context.sessions.find(function (item) { return item.id === state.currentSessionId; });
    stopHistoryPoll();
    if (previousSession && previousSession.id !== terminalId) invalidateHistoryRequest(previousSession);
    stopPoll();
    state.pollRequest++;
    context.selectedId = terminalId || '';
    state.activeTerminalId = context.selectedId;
    var session = context.sessions.find(function (item) { return item.id === context.selectedId; }) || null;
    state.currentSessionId = session ? session.id : '';
    Object.keys(state.contexts).forEach(function (botId) {
      state.contexts[botId].sessions.forEach(updateTerminalInput);
    });
    Array.prototype.forEach.call(els.tabs.querySelectorAll('[role="tab"]'), function (tab) {
      var selected = tab.dataset.terminalId === state.activeTerminalId;
      tab.setAttribute('aria-selected', String(selected));
      tab.classList.toggle('selected', selected);
    });
    if (!session) {
      els.command.value = '';
      resetOutput(null);
      renderHistoryForSession(null);
      renderControlState(null);
      return;
    }
    els.cwd.textContent = context.cwd ? tr('工作目录：{cwd}', 'Working directory: {cwd}', { cwd: context.cwd }) : '';
    els.command.value = session.draft || '';
    updateOutput(session, false);
    renderHistoryForSession(session);
    renderControlState(session);
    if (!preserveFocus) setDialogMessage('', 'idle');
    updateDialogControls();
    startPoll();
  }

  function resetOutput(session) {
    Array.prototype.forEach.call(els.output.children, function (child) { child.hidden = true; });
    els.output.hidden = true;
    els.outputBlank.hidden = false;
    els.terminalState.textContent = session ? terminalStateLabel(session.state) : tr('未连接', 'Not connected');
    els.terminalState.dataset.state = session ? stateToken(session.state) : 'idle';
  }

  function updateOutput(session, keepScroll) {
    if (!session) { resetOutput(session); return; }
    els.output.hidden = false;
    els.outputBlank.hidden = false;
    var terminalElement = ensureTerminal(session);
    Array.prototype.forEach.call(els.output.children, function (child) {
      child.hidden = child !== terminalElement;
    });
    if (terminalElement) els.outputBlank.hidden = true;
    els.terminalState.textContent = terminalStateLabel(session.state);
    els.terminalState.dataset.state = stateToken(session.state);
    if (terminalElement) {
      updateTerminalInput(session);
      scheduleTerminalResize(session);
    }
  }

  function ensureTerminal(session) {
    if (session.terminalElement) return session.terminalElement;
    var TerminalCtor = root.Terminal;
    var FitAddonCtor = root.FitAddon && root.FitAddon.FitAddon;
    if (typeof TerminalCtor !== 'function' || typeof FitAddonCtor !== 'function') {
      session.terminalUnavailable = true;
      els.outputBlank.textContent = tr('终端组件未加载，无法显示实时 PTY。', 'The terminal renderer did not load; live PTY output is unavailable.');
      setDialogMessage(tr('终端组件未加载。', 'The terminal renderer did not load.'), 'error');
      return null;
    }
    var element = node('div', 'superterminal-xterm-pane');
    element.setAttribute('role', 'application');
    element.setAttribute('aria-label', tr('交互式终端', 'Interactive terminal'));
    element.tabIndex = 0;
    element.hidden = true;
    els.output.appendChild(element);
    var terminal = new TerminalCtor({
      cols: session.cols,
      rows: session.rows,
      scrollback: 3000,
      cursorBlink: true,
      cursorStyle: 'block',
      convertEol: false,
      disableStdin: true,
      fontSize: 12,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      theme: { background: '#11151b', foreground: '#e4ebf4', cursor: '#9ac1ff', selectionBackground: '#38587c' }
    });
    var fitAddon = new FitAddonCtor();
    terminal.loadAddon(fitAddon);
    terminal.open(element);
    terminal.onData(function (data) {
      if (inputAllowed(session)) queueInput(session, data);
    });
    element.addEventListener('pointerdown', function () {
      if (inputAllowed(session)) terminal.focus();
    });
    session.terminal = terminal;
    session.terminalElement = element;
    session.fitAddon = fitAddon;
    updateTerminalInput(session);
    return element;
  }

  function inputAllowed(session) {
    return !!(session && currentSession() === session && isTerminalVisible() &&
      session.lease && !session.writeUnknown && session.state === 'running' && session.busy !== 'claim' && session.busy !== 'close');
  }

  function queuedInputAllowed(session, terminalId, lease) {
    return !!(session && session.id === terminalId && session.lease === lease && !session.writeUnknown &&
      session.state === 'running' && session.busy !== 'claim' && session.busy !== 'close' &&
      state.status && state.status.enabled && state.busy !== 'disable');
  }

  function updateTerminalInput(session) {
    if (!session || !session.terminal) return;
    session.terminal.options.disableStdin = !inputAllowed(session);
    if (session.terminalElement) session.terminalElement.classList.toggle('has-input-control', inputAllowed(session));
  }

  function lockInput(session, message) {
    session.writeUnknown = true;
    session.lease = null;
    session.nextSequence = null;
    session.pendingInputChars = 0;
    updateTerminalInput(session);
    if (currentSession() === session) {
      setDialogMessage(message || tr('未能确认输入是否送达，输入已暂停。请重新接管并检查终端；内容不会自动重发。',
        'Input delivery is uncertain, so input is paused. Take control again and inspect the terminal; queued input will not be retried.'), 'error');
      updateDialogControls();
    }
  }

  function queueInput(session, data, onSent) {
    if (!inputAllowed(session) || typeof data !== 'string' || !data) return Promise.resolve(false);
    if (session.pendingInputChars + data.length > 1024 * 1024) {
      lockInput(session, tr('待发送输入超过 1 MiB，输入已暂停。请重新接管后分段粘贴。',
        'Queued input exceeded 1 MiB. Input is paused; take control again and paste in smaller sections.'));
      return Promise.resolve(false);
    }
    var lease = session.lease;
    var terminalId = session.id;
    session.pendingInputChars += data.length;
    var task = session.writeQueue.then(function () {
      session.pendingInputChars = Math.max(0, session.pendingInputChars - data.length);
      if (!queuedInputAllowed(session, terminalId, lease)) return false;
      if (!Number.isSafeInteger(session.nextSequence)) {
        lockInput(session, tr('输入顺序未知，输入已暂停。请重新接管后再继续。', 'The input sequence is unknown, so input is paused. Take control again to continue.'));
        return false;
      }
      var sequence = session.nextSequence;
      return invoke(session.botId, 'write', { terminalId: terminalId, lease: lease, sequence: sequence, data: data }).then(function (result) {
        resultOrThrow(result, tr('输入送达未确认。上一段不会自动重发。', 'Input delivery was not confirmed. The previous input will not be retried.'));
        if (!Number.isSafeInteger(result.nextSequence) || result.nextSequence <= sequence) {
          throw new Error(tr('终端未返回有效的输入顺序。', 'The terminal returned an invalid input sequence.'));
        }
        if (session.lease !== lease || session.id !== terminalId) return false;
        session.nextSequence = result.nextSequence;
        if (typeof onSent === 'function') onSent();
        return true;
      });
    }).catch(function (error) {
      lockInput(session, error && error.message ? error.message + ' ' + tr('请检查终端后重新接管；上一段不会自动重发。', 'Inspect the terminal, then take control again; the previous input will not be retried.') : undefined);
      return false;
    });
    session.writeQueue = task.then(function () {});
    return task;
  }

  function scheduleTerminalResize(session) {
    if (!session || !session.terminal || !session.fitAddon || session.resizeTimer || !session.lease || session.writeUnknown) return;
    session.resizeTimer = root.setTimeout(function () {
      session.resizeTimer = 0;
      resizeTerminal(session);
    }, 120);
  }

  function resizeTerminal(session) {
    if (!session || !session.terminal || !session.fitAddon || !inputAllowed(session) || session.resizing ||
        els.output.clientWidth < 16 || els.output.clientHeight < 16) return Promise.resolve(false);
    try { session.fitAddon.fit(); } catch (_) { return Promise.resolve(false); }
    var cols = session.terminal.cols;
    var rows = session.terminal.rows;
    if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 2 || rows < 1 || (cols === session.cols && rows === session.rows)) return Promise.resolve(true);
    session.resizing = true;
    var lease = session.lease;
    return invoke(session.botId, 'resize', { terminalId: session.id, lease: lease, rows: rows, cols: cols }).then(function (result) {
      resultOrThrow(result, tr('终端大小暂未同步。', 'The terminal size could not be synchronized.'));
      if (session.lease === lease) {
        session.rows = rows;
        session.cols = cols;
      }
      return true;
    }).catch(function () {
      lockInput(session, tr('终端大小暂未同步，输入已暂停。请重新接管后重试。', 'The terminal size could not be synchronized, so input is paused. Take control again to retry.'));
      return false;
    }).then(function (ok) {
      session.resizing = false;
      if (inputAllowed(session) && (session.terminal.cols !== session.cols || session.terminal.rows !== session.rows)) scheduleTerminalResize(session);
      return ok;
    });
  }

  function disposeSessionTerminal(session) {
    if (!session) return;
    if (session.resizeTimer) root.clearTimeout(session.resizeTimer);
    session.resizeTimer = 0;
    if (session.terminal && typeof session.terminal.dispose === 'function') session.terminal.dispose();
    if (session.terminalElement && session.terminalElement.parentNode) session.terminalElement.parentNode.removeChild(session.terminalElement);
    session.terminal = null;
    session.terminalElement = null;
    session.fitAddon = null;
  }

  function terminalStateLabel(value) {
    var map = {
      starting: tr('正在启动', 'Starting'),
      running: tr('运行中', 'Running'),
      closing: tr('正在停止', 'Stopping'),
      exited: tr('已退出', 'Exited'),
      error: tr('异常', 'Error'),
      'cleanup-error': tr('清理失败', 'Cleanup failed'),
      disconnected: tr('连接中断', 'Disconnected')
    };
    return map[value] || String(value || tr('未知', 'Unknown'));
  }

  function stateToken(value) {
    return String(value || '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  function launcherLabel(id) {
    var launchers = state.status && state.status.launchers || [];
    var found = launchers.find(function (item) { return item && item.id === id; });
    return String(found && found.label || id || 'Shell');
  }

  function renderControlState(session) {
    if (session) updateTerminalInput(session);
    var hasSession = !!session;
    var running = hasSession && ['running', 'cleanup-error', 'disconnected'].indexOf(session.state) >= 0;
    var settled = hasSession && session.state === 'exited';
    var busy = hasSession && !!session.busy;
    els.takeControl.hidden = !hasSession || !!session.lease || !running;
    els.takeControl.disabled = busy || !!state.busy;
    els.stop.hidden = !hasSession;
    els.stop.disabled = busy || !!state.busy || (!session.lease && !settled);
    els.stop.textContent = settled ? tr('关闭终端', 'Close terminal') : tr('停止终端', 'Stop terminal');
    els.command.disabled = !hasSession || !session.lease || session.writeUnknown || session.state !== 'running' || busy || !!state.busy;
    els.send.disabled = !hasSession || !session.lease || session.writeUnknown || session.state !== 'running' || busy || !!state.busy || !els.command.value.trim();
    els.commandNote.textContent = terminalCommandNote(session);
  }

  function updateDialogControls() {
    if (!els.dialog) return;
    var context = state.activeContext;
    var session = context && context.sessions.find(function (item) { return item.id === context.selectedId; });
    if (session) updateTerminalInput(session);
    var launchers = state.status && state.status.launchers || [];
    var available = launchers.some(function (item) { return item && item.id === els.launcherSelect.value && item.available === true; });
    els.botSelect.disabled = !state.bots.length || !!state.busy;
    els.dialogClose.disabled = !!state.busy;
    els.launcherSelect.disabled = !state.status || !state.status.enabled || !!state.busy || !context || !!(context && context.settingsLoading);
    els.newTerminal.disabled = !context || !state.status || !state.status.enabled || !available || !!state.busy ||
      !!context.settingsLoading || !context.settingsLoaded || (context.sessions.length >= 12);
    els.newTerminal.title = context && context.settingsLoading
      ? tr('正在读取此 Bot 的终端默认设置。', 'Reading this Bot’s terminal defaults.') : '';
    els.takeControl.hidden = !session || !!session.lease || ['running', 'cleanup-error', 'disconnected'].indexOf(session.state) < 0;
    els.takeControl.disabled = !session || !!session.busy || !!state.busy;
    els.stop.hidden = !session;
    els.stop.disabled = !session || !!session.busy || !!state.busy || (!session.lease && session.state !== 'exited');
    els.stop.textContent = session && session.state === 'exited' ? tr('关闭终端', 'Close terminal') : tr('停止终端', 'Stop terminal');
    els.command.disabled = !session || !session.lease || session.writeUnknown || session.state !== 'running' || !!session.busy || !!state.busy;
    els.send.disabled = !session || !session.lease || session.writeUnknown || session.state !== 'running' || !!session.busy || !!state.busy || !els.command.value.trim();
    els.commandNote.textContent = terminalCommandNote(session);
    els.commandForm.hidden = !session;
    els.commandNote.hidden = !session;
    updateHistoryActionControls(session);
    if (session) {
      els.terminalState.textContent = terminalStateLabel(session.state);
      els.terminalState.dataset.state = stateToken(session.state);
    }
  }

  function terminalCommandNote(session) {
    if (!session) return '';
    if (session.state === 'exited') {
      return tr('Shell 已结束；可查看终端输出和命令历史，但不能再发送输入。', 'Shell has ended. You can inspect terminal output and command history, but cannot send input.');
    }
    if (session.writeUnknown) {
      return tr('输入状态不确定，已暂停发送。请检查终端后重新接管；命令不会自动重发。', 'Input is paused because delivery is uncertain. Inspect the terminal and take control again; commands are never retried automatically.');
    }
    if (session.lease && session.state === 'running') {
      return tr('已接管输入：可在上方终端交互，下方输入框可选用于单条命令。', 'You control input: interact in the terminal above, or use the field below for a single command.');
    }
    if (session.state !== 'running') {
      return tr('终端当前状态为 {state}，暂不可发送输入。', 'Input is unavailable while the terminal is {state}.', { state: terminalStateLabel(session.state) });
    }
    return tr('先接管输入再使用终端。读取输出不会自动取得控制。', 'Take control before using the terminal. Reading output never takes control.');
  }

  function onHistoryToggle() {
    if (!els.historyDetails || els.historyDetails.hidden) return;
    state.historyExpanded = !!els.historyDetails.open;
    stopHistoryPoll();
    var session = currentSession();
    if (!state.historyExpanded) {
      if (session) invalidateHistoryRequest(session);
      return;
    }
    if (session) loadCommandHistory(session);
  }

  function renderHistoryForSession(session) {
    if (!els.historyDetails) return;
    if (!session) {
      stopHistoryPoll();
      state.historyExpanded = false;
      els.historyDetails.open = false;
      els.historyDetails.hidden = true;
      els.historyCount.textContent = '';
      els.historyStatus.textContent = '';
      els.historyList.replaceChildren();
      els.historySearch.value = '';
      els.historyFilter.value = 'all';
      return;
    }
    els.historyDetails.hidden = false;
    els.historyDetails.open = state.historyExpanded;
    if (session.launcher !== 'shell') {
      session.historyStatus = 'unsupported';
      session.historyReason = tr('命令历史仅适用于 Shell 终端。', 'Command history is available for Shell terminals only.');
      session.historyLoaded = true;
      session.historyRecords = [];
      session.historyTotal = 0;
      session.historyTruncated = false;
    }
    renderCommandHistory(session);
    updateHistoryActionControls(session);
    if (state.historyExpanded && session.launcher === 'shell') {
      if (!session.historyLoaded) loadCommandHistory(session);
      else scheduleHistoryPoll(session);
    }
  }

  function updateHistoryActionControls(session) {
    if (!els.historyDetails) return;
    els.historyDetails.hidden = !session;
    if (!session) return;
    var shell = session.launcher === 'shell';
    var unsupported = session.historyStatus === 'unsupported';
    els.historyRefresh.hidden = !shell || unsupported;
    els.historyRefresh.disabled = !!session.historyLoading;
    els.historySearch.hidden = !shell || unsupported;
    els.historyFilter.hidden = !shell || unsupported;
    if (!shell || unsupported) {
      els.historyNote.textContent = session.historyReason || tr('命令历史仅适用于 Shell 终端。', 'Command history is available for Shell terminals only.');
      els.historyNote.dataset.state = 'unsupported';
    } else if (session.historyStatus === 'ended') {
      els.historyNote.textContent = tr(
        'Shell 已结束；可查看保留记录或复制完整命令，无法重跑。',
        'The Shell has ended. You can inspect retained records and copy complete commands; rerun is unavailable.'
      );
      els.historyNote.dataset.state = 'ended';
    } else {
      els.historyNote.textContent = tr(
        '重跑会在此终端的当前目录提示符发送已完成的单行命令；需要接管输入、空闲提示符，且没有待提交的输入。',
        'Run again submits a completed single-line command in this terminal’s current directory. Take control first; the prompt must be idle with no partially typed input.'
      );
      els.historyNote.dataset.state = 'idle';
    }
    Array.prototype.forEach.call(els.historyList.querySelectorAll('[data-history-action]'), function (action) {
      var record = findHistoryRecord(session, action.dataset.commandId);
      if (action.dataset.historyAction === 'copy') {
        action.disabled = !record || !!record.commandTruncated;
      } else if (action.dataset.historyAction === 'rerun') {
        action.disabled = !canRerunHistoryRecord(session, record);
      }
    });
  }

  function onHistoryActionClick(event) {
    var action = event.target.closest('[data-history-action]');
    if (!action || action.disabled) return;
    var session = currentSession();
    var record = session && findHistoryRecord(session, action.dataset.commandId);
    if (!session || !record || action.dataset.commandId !== record.id) return;
    if (action.dataset.historyAction === 'copy') copyHistoryCommand(record);
    else if (action.dataset.historyAction === 'rerun') rerunHistoryCommand(session, record);
  }

  function findHistoryRecord(session, id) {
    if (!session || !Array.isArray(session.historyRecords)) return null;
    return session.historyRecords.find(function (record) { return record && record.id === id; }) || null;
  }

  function canRerunHistoryRecord(session, record) {
    return !!(session && record && session.launcher === 'shell' &&
      session.historyStatus === 'ready' &&
      ['succeeded', 'failed'].indexOf(record.status) >= 0 &&
      typeof record.command === 'string' && record.command.trim() && !record.commandTruncated &&
      !/[\x00-\x1f\x7f]/.test(record.command) &&
      session.lease && !session.writeUnknown && session.state === 'running' && !session.busy && !state.busy &&
      Number.isSafeInteger(session.nextSequence) && session.pendingInputChars === 0 &&
      currentSession() === session && !String(els.command.value || '').trim());
  }

  function copyHistoryCommand(record) {
    if (!record || record.commandTruncated || typeof record.command !== 'string') return;
    var clipboard = root.navigator && root.navigator.clipboard;
    var copied = clipboard && typeof clipboard.writeText === 'function'
      ? Promise.resolve().then(function () { return clipboard.writeText(record.command); }).catch(function () { return copyWithExecCommand(record.command); })
      : Promise.resolve().then(function () { return copyWithExecCommand(record.command); });
    copied.then(function () {
      setDialogMessage(tr('命令已复制。', 'Command copied.'), 'ok');
    }).catch(function () {
      setDialogMessage(tr('无法复制命令。请手动选择命令文本。', 'Could not copy the command. Select the command text manually.'), 'error');
    });
  }

  function copyWithExecCommand(value) {
    if (!document.execCommand) return Promise.reject(new Error('Clipboard unavailable'));
    var active = document.activeElement;
    var field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', 'readonly');
    field.className = 'superterminal-copy-buffer';
    document.body.appendChild(field);
    field.select();
    var copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
    field.remove();
    if (active && active.isConnected && typeof active.focus === 'function') active.focus();
    return copied ? Promise.resolve() : Promise.reject(new Error('Clipboard copy failed'));
  }

  function rerunHistoryCommand(session, record) {
    if (!canRerunHistoryRecord(session, record)) return;
    session.busy = 'rerun';
    updateDialogControls();
    setDialogMessage(tr('正在当前终端重新运行命令…', 'Running the command again in this terminal…'), 'pending');
    queueHistoryRerun(session, record.id).then(function (sent) {
      if (sent && currentSession() === session) {
        setDialogMessage(tr('命令已发送到当前终端。', 'Command sent to the current terminal.'), 'ok');
      } else if (!session.writeUnknown && currentSession() === session) {
        setDialogMessage(tr('终端状态已变化，未重新运行命令。', 'The terminal state changed; the command was not rerun.'), 'error');
      }
    }).then(function () {
      if (session.busy === 'rerun') session.busy = '';
      updateTerminalInput(session);
      updateDialogControls();
    });
  }

  function queueHistoryRerun(session, commandId) {
    var lease = session.lease;
    var terminalId = session.id;
    var task = session.writeQueue.then(function () {
      if (!queuedInputAllowed(session, terminalId, lease)) return false;
      if (!Number.isSafeInteger(session.nextSequence)) {
        lockInput(session, tr('输入顺序未知，命令未重跑。请重新接管后检查终端。', 'The input sequence is unknown, so the command was not rerun. Take control again and inspect the terminal.'));
        return false;
      }
      var sequence = session.nextSequence;
      return invoke(session.botId, 'rerun', {
        terminalId: terminalId,
        commandId: commandId,
        lease: lease,
        sequence: sequence
      }).then(function (result) {
        resultOrThrow(result, tr('无法重新运行命令。', 'Could not rerun the command.'));
        if (!Number.isSafeInteger(result.nextSequence) || result.nextSequence <= sequence) {
          throw new Error(tr('终端未返回有效的输入顺序。', 'The terminal returned an invalid input sequence.'));
        }
        if (session.lease !== lease || session.id !== terminalId) return false;
        session.nextSequence = result.nextSequence;
        return true;
      }).catch(function (error) {
        lockInput(session, error && error.message
          ? error.message + ' ' + tr('请检查终端后重新接管；命令不会自动重发。', 'Inspect the terminal, then take control again; the command will not be retried.')
          : undefined);
        return false;
      });
    });
    session.writeQueue = task.then(function () {});
    return task;
  }

  function renderCommandHistory(session) {
    if (!els.historyDetails || !els.historyList || !session) return;
    var shell = session.launcher === 'shell';
    var unavailable = !shell || session.historyStatus === 'unsupported';
    els.historyRefresh.hidden = unavailable;
    els.historyRefresh.disabled = !!session.historyLoading;
    els.historySearch.hidden = unavailable;
    els.historyFilter.hidden = unavailable;
    if (unavailable) {
      els.historyNote.textContent = session.historyReason || tr('命令历史仅适用于 Shell 终端。', 'Command history is available for Shell terminals only.');
      els.historyStatus.textContent = session.historyReason || tr('此启动器不提供命令历史。', 'Command history is unavailable for this launcher.');
      els.historyStatus.dataset.state = 'unsupported';
      els.historyCount.textContent = tr('不可用', 'Unavailable');
      els.historyList.replaceChildren();
      return;
    }
    if (session.historyStatus === 'ended') {
      els.historyNote.textContent = tr(
        'Shell 已结束；可查看保留记录或复制完整命令，无法重跑。',
        'The Shell has ended. You can inspect retained records and copy complete commands; rerun is unavailable.'
      );
      els.historyNote.dataset.state = 'ended';
    } else {
      els.historyNote.textContent = tr(
        '重跑会在此终端的当前目录提示符发送已完成的单行命令；需要接管输入、空闲提示符，且没有待提交的输入。',
        'Run again submits a completed single-line command in this terminal’s current directory. Take control first; the prompt must be idle with no partially typed input.'
      );
      els.historyNote.dataset.state = 'idle';
    }
    if (session.historyStatus === 'loading' && !session.historyLoaded) {
      els.historyStatus.textContent = tr('正在读取最近的命令…', 'Loading recent commands…');
      els.historyStatus.dataset.state = 'loading';
      els.historyCount.textContent = tr('读取中', 'Loading');
      return;
    }
    if (session.historyStatus === 'starting' && !session.historyLoaded) {
      els.historyStatus.textContent = session.historyReason || tr('正在等待 Shell 开始记录命令。', 'Waiting for the Shell to start recording commands.');
      els.historyStatus.dataset.state = 'loading';
      els.historyCount.textContent = tr('启动中', 'Starting');
      els.historyList.replaceChildren();
      return;
    }
    if (session.historyStatus === 'idle') {
      els.historyStatus.textContent = tr('展开此区域以读取最近的命令。', 'Expand this section to load recent commands.');
      els.historyStatus.dataset.state = 'idle';
      els.historyCount.textContent = '';
      els.historyList.replaceChildren();
      return;
    }

    var records = Array.isArray(session.historyRecords) ? session.historyRecords : [];
    var query = String(els.historySearch.value || '').trim().toLocaleLowerCase();
    var filter = els.historyFilter.value || 'all';
    var shown = records.filter(function (record) {
      if (filter !== 'all' && record.status !== filter) return false;
      if (!query) return true;
      return (String(record.command || '') + '\n' + String(record.output || '')).toLocaleLowerCase().indexOf(query) >= 0;
    });
    var listScrollTop = els.historyList.scrollTop;
    var expandedOutput = Object.create(null);
    Array.prototype.forEach.call(els.historyList.querySelectorAll('li[data-command-id]'), function (item) {
      var outputDetails = item.querySelector('.superterminal-history-output-details');
      if (outputDetails && outputDetails.open) expandedOutput[item.dataset.commandId] = true;
    });
    var total = Number.isSafeInteger(session.historyTotal) && session.historyTotal >= 0 ? session.historyTotal : records.length;
    els.historyCount.textContent = total > records.length
      ? tr('{count} / 共 {total} 条', '{count} of {total}', { count: records.length, total: total })
      : tr('保留 {count} 条', '{count} retained', { count: records.length });
    var statusText = '';
    var statusState = 'ready';
    if (session.historyStatus === 'loading') {
      statusText = tr('正在刷新；保留上次读取的记录。', 'Refreshing; keeping the last loaded records.');
      statusState = 'loading';
    } else if (session.historyStatus === 'starting') {
      statusText = session.historyReason || tr('正在等待 Shell 开始记录命令。', 'Waiting for the Shell to start recording commands.');
      statusState = 'loading';
    } else if (session.historyStatus === 'error') {
      statusText = tr('{reason} 已保留上次读取的记录。', '{reason} The last loaded records are preserved.', {
        reason: session.historyReason || tr('无法刷新命令历史。', 'Could not refresh command history.')
      });
      statusState = 'error';
    } else if (session.historyStatus === 'unavailable') {
      statusText = session.historyReason || tr('此 Shell 未提供命令记录；终端仍可正常使用。', 'Command recording is unavailable in this Shell; terminal access remains available.');
      statusState = 'unsupported';
    } else if (session.historyStatus === 'ended') {
      statusText = tr('Shell 已结束；以下为保留的命令记录。', 'The Shell has ended; retained command records are shown below.');
      statusState = 'idle';
    } else if (!records.length) {
      statusText = tr('尚无命令记录。通过下方输入框或终端提示符发送的命令会显示在这里。', 'No command records yet. Commands sent from the field or shell prompt will appear here.');
    } else if (!shown.length) {
      statusText = tr('没有匹配的命令。', 'No matching commands.');
    } else if (shown.length !== records.length) {
      statusText = tr('显示 {shown} / {total} 条保留记录。', 'Showing {shown} of {total} retained records.', { shown: shown.length, total: records.length });
    } else if (session.historyTruncated || total > records.length) {
      statusText = tr('仅显示最近 {count} 条；搜索只筛选这些保留记录。', 'Showing the latest {count}; search filters only these retained records.', { count: records.length });
    } else {
      statusText = tr('共 {count} 条命令记录。', '{count} command records.', { count: records.length });
    }
    els.historyStatus.textContent = statusText;
    els.historyStatus.dataset.state = statusState;
    els.historyList.replaceChildren();
    if (!shown.length && records.length) {
      els.historyList.appendChild(node('li', 'superterminal-history-empty', tr('没有匹配的命令。', 'No matching commands.')));
    } else {
      shown.forEach(function (record) { els.historyList.appendChild(renderHistoryRecord(session, record)); });
    }
    Array.prototype.forEach.call(els.historyList.querySelectorAll('li[data-command-id]'), function (item) {
      var outputDetails = item.querySelector('.superterminal-history-output-details');
      if (outputDetails && expandedOutput[item.dataset.commandId]) outputDetails.open = true;
    });
    els.historyList.scrollTop = listScrollTop;
    updateHistoryActionControls(session);
  }

  function renderHistoryRecord(session, record) {
    var item = node('li', 'superterminal-history-item');
    item.dataset.commandId = record.id;
    var top = node('div', 'superterminal-history-record-top');
    var state = node('span', 'superterminal-history-record-state', historyStateLabel(record.status));
    state.dataset.state = stateToken(record.status);
    var details = [];
    var started = formatHistoryTimestamp(record.startedAt);
    if (started) details.push(started);
    if (Number.isFinite(record.durationMs) && record.durationMs >= 0) details.push(formatDuration(record.durationMs));
    if (Number.isInteger(record.exitCode)) details.push(tr('退出码 {code}', 'Exit {code}', { code: record.exitCode }));
    var meta = node('span', 'superterminal-history-record-meta', details.join(' · '));
    var actions = node('div', 'superterminal-history-actions');
    var copy = button('', tr('复制', 'Copy'), 'history-copy');
    copy.dataset.historyAction = 'copy';
    copy.dataset.commandId = record.id;
    copy.setAttribute('aria-label', tr('复制命令', 'Copy command'));
    copy.title = record.commandTruncated
      ? tr('命令已截断，无法复制完整内容。', 'The command is truncated and cannot be copied in full.')
      : tr('复制完整命令', 'Copy full command');
    var rerun = button('', tr('重跑', 'Run again'), 'history-rerun');
    rerun.dataset.historyAction = 'rerun';
    rerun.dataset.commandId = record.id;
    rerun.setAttribute('aria-label', tr('在当前终端重跑单行命令', 'Rerun the single-line command in this terminal'));
    rerun.title = tr('在当前目录的空闲 Shell 提示符运行单行命令。', 'Run the single-line command at an idle Shell prompt in the current directory.');
    append(actions, copy, rerun);
    append(top, state, meta, actions);
    var command = node('code', 'superterminal-history-command', String(record.command || ''));
    var commandBlock = node('div', 'superterminal-history-command-block');
    commandBlock.appendChild(command);
    if (record.commandTruncated) commandBlock.appendChild(node('span', 'superterminal-history-truncated', tr('命令已截断；不能复制或重跑。', 'Command truncated; copy and rerun are unavailable.')));
    item.appendChild(top);
    item.appendChild(commandBlock);
    var output = typeof record.output === 'string' ? record.output : '';
    if (output) {
      var retainedOutput = cleanHistoryOutput(output);
      var preview = retainedOutput.trim();
      if (preview.length > 120) preview = preview.slice(0, 120).replace(/\s+$/, '') + '…';
      var outputDetails = node('details', 'superterminal-history-output-details');
      var outputSummary = node('summary', '');
      var outputLabel = node('span', '', tr('输出', 'Output'));
      var outputSnippet = node('span', 'superterminal-history-output-snippet', preview || tr('无可显示文本', 'No printable text'));
      append(outputSummary, outputLabel, outputSnippet);
      if (record.outputTruncated) {
        outputSummary.appendChild(node('span', 'superterminal-history-output-truncated', tr('已截断', 'Truncated')));
      }
      outputDetails.appendChild(outputSummary);
      outputDetails.appendChild(node('pre', 'superterminal-history-output-full', retainedOutput));
      item.appendChild(outputDetails);
    }
    return item;
  }

  function cleanHistoryOutput(value) {
    return String(value || '')
      .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '')
      .replace(/\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g, '')
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '�');
  }

  function historyStateLabel(value) {
    var labels = {
      succeeded: tr('已完成', 'Succeeded'),
      failed: tr('失败', 'Failed'),
      running: tr('运行中', 'Running'),
      interrupted: tr('已中断', 'Interrupted')
    };
    return labels[value] || String(value || tr('未知', 'Unknown'));
  }

  function formatHistoryTimestamp(value) {
    if (value === undefined || value === null || value === '') return '';
    var date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    try { return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date); }
    catch (_) { return date.toLocaleTimeString(); }
  }

  function formatDuration(value) {
    if (value < 1000) return tr('<1s', '<1s');
    var seconds = value / 1000;
    var displayed = seconds < 10 ? seconds.toFixed(1) : Math.round(seconds);
    return tr('{seconds}s', '{seconds}s', { seconds: displayed });
  }

  function loadCommandHistory(session) {
    if (!session || session.launcher !== 'shell' || !state.historyExpanded || !els.historyDetails.open ||
        !isTerminalVisible() || currentSession() !== session || !state.activeContext) return Promise.resolve(false);
    if (session.historyLoading) return Promise.resolve(false);
    var context = state.activeContext;
    var botRequest = state.botRequest;
    var request = ++session.historyRequest;
    session.historyLoading = true;
    session.historyStatus = 'loading';
    session.historyReason = '';
    renderCommandHistory(session);
    return invoke(session.botId, 'commands', { terminalId: session.id, lastN: 50 }).then(function (result) {
      resultOrThrow(result, tr('无法读取命令历史。', 'Could not load command history.'));
      if (!historyRequestCurrent(request, botRequest, context, session)) return false;
      if (!result || result.terminalId !== session.id) {
        throw new Error(tr('命令历史与当前终端不匹配。', 'The command history does not match the selected terminal.'));
      }
      var status = result.status || 'ready';
      if (status === 'unsupported') {
        session.historyStatus = 'unsupported';
        session.historyReason = String(result.reason || tr('此 Shell 环境未提供命令历史。', 'Command history is unavailable for this Shell environment.'));
        session.historyRecords = [];
        session.historyTotal = 0;
        session.historyTruncated = false;
        session.historyLoaded = true;
        return false;
      }
      if (!Array.isArray(result.records)) throw new Error(tr('命令历史返回格式无效。', 'The command history response is invalid.'));
      session.historyRecords = result.records.filter(function (record) {
        return record && typeof record.id === 'string' && typeof record.command === 'string';
      });
      session.historyTotal = Number.isSafeInteger(result.total) && result.total >= 0 ? result.total : session.historyRecords.length;
      session.historyTruncated = result.truncated === true;
      session.historyReason = String(result.reason || '');
      if (['ready', 'starting', 'unavailable', 'ended'].indexOf(status) < 0) {
        throw new Error(String(result.reason || tr('命令历史暂不可用。', 'Command history is temporarily unavailable.')));
      }
      session.historyStatus = status;
      if (status !== 'starting') session.historyLoaded = true;
      return status === 'ready' || status === 'ended';
    }).catch(function (error) {
      if (!historyRequestCurrent(request, botRequest, context, session)) return false;
      session.historyStatus = 'error';
      session.historyReason = error && error.message ? error.message : tr('无法读取命令历史。', 'Could not load command history.');
      return false;
    }).then(function (loaded) {
      if (session.historyRequest !== request) return loaded;
      session.historyLoading = false;
      if (historyRequestCurrent(request, botRequest, context, session)) {
        renderCommandHistory(session);
        updateHistoryActionControls(session);
        if (session.historyStatus === 'ready' || session.historyStatus === 'starting') scheduleHistoryPoll(session);
      }
      return loaded;
    });
  }

  function historyRequestCurrent(request, botRequest, context, session) {
    return isTerminalVisible() && state.historyExpanded && els.historyDetails.open &&
      session.historyRequest === request && botRequest === state.botRequest &&
      state.activeContext === context && context.selectedId === session.id && currentSession() === session &&
      context.sessions.indexOf(session) >= 0;
  }

  function scheduleHistoryPoll(session) {
    stopHistoryPoll();
    if (!session || ['ready', 'starting'].indexOf(session.historyStatus) < 0 || !state.historyExpanded || !els.historyDetails.open ||
        !isTerminalVisible() || currentSession() !== session) return;
    state.historyTimer = root.setTimeout(function () {
      state.historyTimer = 0;
      if (!els.historyDetails.open || !state.historyExpanded || currentSession() !== session) return;
      if (els.historySearch === document.activeElement || els.historyFilter === document.activeElement ||
          els.historyList.contains(document.activeElement)) {
        scheduleHistoryPoll(session);
        return;
      }
      loadCommandHistory(session);
    }, 2500);
  }

  function stopHistoryPoll() {
    if (state.historyTimer) root.clearTimeout(state.historyTimer);
    state.historyTimer = 0;
  }

  function invalidateHistoryRequest(session) {
    if (!session) return;
    session.historyRequest++;
    session.historyLoading = false;
    if (session.historyStatus === 'loading') session.historyStatus = session.historyLoaded ? 'ready' : 'idle';
  }

  function invalidateAllHistoryRequests() {
    Object.keys(state.contexts).forEach(function (botId) {
      state.contexts[botId].sessions.forEach(invalidateHistoryRequest);
    });
  }

  function setDialogMessage(value, tone) {
    showMessage(value, tone, els.dialogMessage);
  }

  function onDialogClose() {
    state.dialogOpen = false;
    state.dialogRequest++;
    state.botRequest++;
    state.pollRequest++;
    state.historyExpanded = false;
    if (els.historyDetails) els.historyDetails.open = false;
    stopHistoryPoll();
    invalidateAllHistoryRequests();
    stopPoll();
    Object.keys(state.contexts).forEach(function (botId) {
      state.contexts[botId].sessions.forEach(updateTerminalInput);
    });
    state.activeContext = null;
    state.activeTerminalId = '';
    state.currentSessionId = '';
    if (state.returnFocus && state.returnFocus.isConnected && isSettingsVisible()) {
      state.returnFocus.focus();
    }
    state.returnFocus = null;
  }

  function saveDraft() {
    var session = currentSession();
    if (!session) return;
    session.draft = els.command.value;
    renderControlState(session);
  }

  function currentSession() {
    if (!state.activeContext || !state.activeContext.selectedId) return null;
    return state.activeContext.sessions.find(function (item) { return item.id === state.activeContext.selectedId; }) || null;
  }

  function onCommandKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (!els.send.disabled) els.commandForm.requestSubmit ? els.commandForm.requestSubmit() : els.send.click();
    }
  }

  function sendCommand(event) {
    event.preventDefault();
    var session = currentSession();
    var command = els.command.value;
    if (!session || !session.lease || session.state !== 'running' || session.busy || !command.trim()) return;
    if (!Number.isSafeInteger(session.nextSequence)) {
      setDialogMessage(tr('输入顺序未知。请重新接管终端后再发送。', 'The input sequence is unknown. Take control again before sending.'), 'error');
      lockInput(session);
      return;
    }
    var expectedDraft = command;
    session.busy = 'write';
    updateDialogControls();
    setDialogMessage(tr('正在发送命令…', 'Sending command…'), 'pending');
    queueInput(session, command + '\r', function () {
      if (currentSession() === session && els.command.value === expectedDraft) {
        els.command.value = '';
        session.draft = '';
      }
      setDialogMessage(tr('命令已发送。', 'Command sent.'), 'ok');
    }).then(function () {
      if (session.busy === 'write') session.busy = '';
      updateTerminalInput(session);
      updateDialogControls();
    });
  }

  function takeControl() {
    var session = currentSession();
    if (!session || session.busy || state.busy || ['running', 'cleanup-error', 'disconnected'].indexOf(session.state) < 0) return;
    session.busy = 'claim';
    updateDialogControls();
    setDialogMessage(tr('正在接管终端输入…', 'Taking control of terminal input…'), 'pending');
    invoke(session.botId, 'claim', { terminalId: session.id, viewerId: state.viewerId }).then(function (result) {
      resultOrThrow(result, tr('无法接管终端输入。', 'Could not take control of terminal input.'));
      if (currentSession() !== session) return;
      if (typeof result.lease !== 'string' || !Number.isSafeInteger(result.nextSequence)) throw new Error(tr('终端未返回有效的输入租约。', 'The terminal did not return a valid input lease.'));
      session.lease = result.lease;
      session.nextSequence = result.nextSequence;
      session.writeUnknown = false;
      renderControlState(session);
      session.busy = '';
      updateTerminalInput(session);
      return resizeTerminal(session).then(function () {
        if (session.lease && currentSession() === session) {
          setDialogMessage(tr('已接管此终端。可在终端中使用键盘、方向键、粘贴和 Ctrl-C。', 'You now control this terminal. Keyboard input, arrows, paste and Ctrl-C are available in the terminal.'), 'ok');
          if (session.terminal) session.terminal.focus();
        }
      });
    }).catch(function (error) {
      setDialogMessage(error.message || tr('无法接管终端输入。', 'Could not take control of terminal input.'), 'error');
    }).then(function () {
      session.busy = '';
      updateDialogControls();
    });
  }

  function stopTerminal() {
    var session = currentSession();
    if (!session || session.busy || state.busy) return;
    if (session.state !== 'exited' && !session.lease) {
      setDialogMessage(tr('先接管输入，再停止此终端。', 'Take control before stopping this terminal.'), 'error');
      return;
    }
    var context = state.activeContext;
    var generation = state.botRequest;
    session.busy = 'close';
    updateTerminalInput(session);
    stopPoll();
    state.pollRequest++;
    updateDialogControls();
    setDialogMessage(session.state === 'exited' ? tr('正在关闭终端…', 'Closing terminal…') : tr('正在停止终端…', 'Stopping terminal…'), 'pending');
    invoke(session.botId, 'close', { terminalId: session.id, lease: session.lease || undefined }).then(function (result) {
      resultOrThrow(result, tr('无法停止终端。', 'Could not stop the terminal.'));
      if (!isTerminalVisible() || state.activeContext !== context || generation !== state.botRequest) return;
      context.sessions = context.sessions.filter(function (item) { return item.id !== session.id; });
      disposeSessionTerminal(session);
      context.selectedId = context.sessions.length ? context.sessions[0].id : '';
      state.activeTerminalId = context.selectedId;
      state.currentSessionId = context.selectedId;
      renderSessions(context);
      setDialogMessage(tr('终端已停止。', 'Terminal stopped.'), 'ok');
      if (context.selectedId) startPoll();
      refreshStatus();
    }).catch(function (error) {
      setDialogMessage(error.message || tr('无法停止终端。', 'Could not stop the terminal.'), 'error');
      if (error.code && /LEASE|CONTROL/i.test(error.code)) {
        session.lease = null;
        session.nextSequence = null;
        renderControlState(session);
      }
      if (session.state === 'cleanup-error') renderControlState(session);
    }).then(function () {
      session.busy = '';
      updateDialogControls();
    });
  }

  function startPoll() {
    stopPoll();
    if (!isTerminalVisible() || !state.activeContext || !state.activeContext.selectedId) return;
    pollSelectedTerminal();
  }

  function stopPoll() {
    if (state.pollTimer) root.clearTimeout(state.pollTimer);
    state.pollTimer = 0;
    state.pollRequest++;
    state.polling = false;
  }

  function pollSelectedTerminal() {
    if (!isTerminalVisible() || state.polling || !state.activeContext) return;
    var context = state.activeContext;
    var session = currentSession();
    if (!session || session.readPending) return;
    var request = ++state.pollRequest;
    var botRequest = state.botRequest;
    var contextGeneration = context.generation;
    state.polling = true;
    invoke(session.botId, 'read', { terminalId: session.id, offset: session.readOffset }).then(function (result) {
      resultOrThrow(result, tr('无法读取终端输出。', 'Could not read terminal output.'));
      if (!pollCurrent(request, botRequest, context, session, contextGeneration)) return;
      if (result.gap) {
        if (session.terminal) session.terminal.reset();
        session.readOffset = Number.isSafeInteger(result.baseOffset) ? result.baseOffset : 0;
        setDialogMessage(tr('较早输出已被清理，正在读取保留的终端内容。', 'Older output has been cleared; reading the retained terminal content.'), 'idle');
        state.polling = false;
        state.pollRequest++;
        state.pollTimer = root.setTimeout(pollSelectedTerminal, 35);
        return;
      }
      if (typeof result.state === 'string') session.state = result.state;
      if (result.exitCode !== undefined) session.exitCode = result.exitCode;
      updateOutput(session, false);
      if (typeof result.data === 'string' && result.data) {
        session.readPending = true;
        return new Promise(function (resolve) {
          var nextOffset = Number.isSafeInteger(result.nextOffset) ? result.nextOffset : session.readOffset + result.data.length;
          ensureTerminal(session);
          if (!session.terminal) { session.readPending = false; resolve(); return; }
          session.terminal.write(result.data, function () {
            if (state.contexts[session.botId] === context && contextGeneration === context.generation &&
                context.sessions.indexOf(session) >= 0 && nextOffset >= session.readOffset) {
              session.readOffset = nextOffset;
            }
            session.readPending = false;
            if (currentSession() === session) {
              renderControlState(session);
              updateDialogControls();
            }
            resolve();
            if (request !== state.pollRequest && isTerminalVisible() && currentSession() === session) startPoll();
          });
        });
      }
      if (Number.isSafeInteger(result.nextOffset)) session.readOffset = result.nextOffset;
      renderControlState(session);
      updateDialogControls();
    }).catch(function (error) {
      session.readPending = false;
      if (!pollCurrent(request, botRequest, context, session, contextGeneration)) return;
      setDialogMessage(error.message || tr('无法读取终端输出。', 'Could not read terminal output.'), 'error');
      if (error.code === 'NOT_FOUND' || error.code === 'TERMINAL_SCOPE') {
        refreshTerminals(context, state.botRequest, false);
      }
    }).then(function () {
      if (request !== state.pollRequest) return;
      state.polling = false;
      if (isTerminalVisible() && state.activeContext === context && context.selectedId === session.id) {
        state.pollTimer = root.setTimeout(pollSelectedTerminal, 700);
      }
    });
  }

  function pollCurrent(request, botRequest, context, session, contextGeneration) {
    return isTerminalVisible() && request === state.pollRequest && botRequest === state.botRequest &&
      state.activeContext === context && context.selectedId === session.id && context.generation === contextGeneration;
  }

  function start() {
    Promise.resolve(root.OpenBotI18n && root.OpenBotI18n.ready).then(function () {
      if (!build()) return;
      if (isSettingsVisible()) refreshStatus();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window);
