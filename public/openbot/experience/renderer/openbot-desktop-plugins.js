(function (root) {
  'use strict';

  var doc = root.document;
  var state = {
    initialized: false,
    ready: false,
    loading: false,
    request: 0,
    plugins: [],
    action: null,
    proposal: null,
    committing: false,
    cancelRequestedFor: '',
    contributionPanels: Object.create(null),
    openScreen: {
      loaded: false,
      engine: { supported: null, status: null, action: '', error: '', feedback: '', canceling: false, cancelRequested: false, operationRequest: 0 },
      video: {
        supported: null, loadingBots: false, loadingRecordings: false, processing: false,
        canceling: false, cancelRequested: false, captions: true, annotation: '', bots: [], recordings: [],
        selectedBotId: '', selectedRecordingId: '', error: '', errorScope: '', feedback: '',
        botRequest: 0, recordingRequest: 0, processRequest: 0
      }
    },
    unsubscribe: null,
    observer: null
  };
  var els = {};

  function tr(zh, en, params) {
    return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function'
      ? root.OpenBotI18n.t(zh, en, params) : zh;
  }

  function node(tag, className, text) {
    var item = doc.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function append(parent) {
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]);
  }

  function button(label, operation, pluginId, className) {
    var item = node('button', 'btn desktop-plugin-action' + (className ? ' ' + className : ''), label);
    item.type = 'button';
    item.dataset.desktopPluginOperation = operation;
    if (pluginId) item.dataset.pluginId = pluginId;
    return item;
  }

  function contributionButton(label, operation, pluginId, className) {
    var item = node('button', 'btn desktop-plugin-contribution-action' + (className ? ' ' + className : ''), label);
    item.type = 'button';
    item.dataset.pluginContributionOperation = operation;
    if (pluginId) item.dataset.pluginId = pluginId;
    return item;
  }

  function apiMethod(name) {
    return root.grokbot && typeof root.grokbot[name] === 'function' ? root.grokbot[name] : null;
  }

  function safeError(error, fallback) {
    var value = error && typeof error.message === 'string' ? error.message : fallback;
    return String(value || fallback).slice(0, 500);
  }

  function call(action, input) {
    var method = apiMethod('desktopPluginAction');
    if (!method) return Promise.reject(new Error(tr('此功能需要更新后的 Bot Studio 桌面版。', 'Update the Bot Studio desktop app to manage plugins.')));
    return Promise.resolve().then(function () {
      return method.call(root.grokbot, { action: action, input: input || {} });
    }).then(function (result) {
      if (!result || result.ok === false) {
        var error = new Error(result && typeof result.message === 'string' && result.message
          ? result.message : tr('插件操作未完成。', 'The plugin action did not complete.'));
        error.code = result && result.code || 'DESKTOP_PLUGIN_FAILED';
        throw error;
      }
      return result;
    });
  }

  function setMessage(value, tone) {
    if (!els.message) return;
    els.message.textContent = value || '';
    els.message.dataset.state = tone || 'idle';
    els.message.hidden = !value;
  }

  function pluginName(plugin) {
    return typeof plugin.name === 'string' && plugin.name.trim()
      ? plugin.name.slice(0, 160) : String(plugin.id || tr('未知插件', 'Unknown plugin')).slice(0, 160);
  }

  function statusText(plugin) {
    if (plugin.changing) {
      return plugin.state === 'downloading'
        ? tr('正在准备安装包', 'Preparing package')
        : tr('正在处理', 'Working');
    }
    if (plugin.safeMode) return tr('已暂停', 'Paused');
    if (plugin.enabled) return tr('已启用', 'Enabled');
    if (plugin.installed) return tr('已停用', 'Disabled');
    return tr('未安装', 'Not installed');
  }

  function statusTone(plugin) {
    if (plugin.changing) return 'pending';
    if (plugin.safeMode) return 'error';
    return plugin.enabled ? 'connected' : 'idle';
  }

  function versionSummary(plugin) {
    var parts = [];
    if (plugin.installed && typeof plugin.version === 'string') {
      parts.push(tr('当前版本 {version}', 'Current version {version}', { version: plugin.version }));
    } else if (typeof plugin.availableVersion === 'string') {
      parts.push(tr('可安装版本 {version}', 'Available version {version}', { version: plugin.availableVersion }));
    }
    if (plugin.installed && plugin.updateAvailable && typeof plugin.availableVersion === 'string') {
      parts.push(tr('可更新至 {version}', 'Update available: {version}', { version: plugin.availableVersion }));
    }
    return parts.join(' · ') || tr('版本信息尚不可用', 'Version information is not available');
  }

  var capabilityLabels = {
    'terminal.read': ['读取终端状态和历史记录', 'Read terminal status and history'],
    'terminal.open': ['创建本机终端', 'Open a local terminal'],
    'terminal.write': ['输入命令并调整终端', 'Enter commands and control the terminal'],
    'terminal.configure': ['修改新终端的默认设置', 'Change defaults for new terminals'],
    'capture.observe': ['读取屏幕和应用画面', 'Read screen and application images'],
    'capture.record': ['录制画面、系统声音和所选麦克风', 'Record video, system sound and the selected microphone'],
    'capture.demo': ['执行已批准的应用演示操作', 'Perform approved application demonstrations'],
    'capture.narrate': ['生成配音成片', 'Create narrated videos']
  };

  function capabilityText(capability) {
    var label = capabilityLabels[String(capability)];
    return label ? tr(label[0], label[1]) : String(capability);
  }

  function operationText(operation) {
    var labels = {
      install: ['安装', 'Install'], update: ['更新', 'Update'], rollback: ['回退', 'Roll back'],
      enable: ['启用', 'Enable'], disable: ['停用', 'Disable'], uninstall: ['卸载', 'Uninstall']
    };
    var label = labels[operation] || labels.install;
    return tr(label[0], label[1]);
  }

  function actionDisabled(plugin, operation) {
    if (state.proposal || state.committing || state.loading || plugin.changing) return true;
    if (state.action && state.action.pluginId !== plugin.id) return true;
    var panel = state.contributionPanels[String(plugin.id || '')];
    if (panel && (panel.loading || panel.invoking)) return true;
    if ((operation === 'update' || operation === 'rollback') && plugin.busy) return true;
    return false;
  }

  function actionButton(parent, label, operation, plugin, className) {
    var item = button(label, operation, String(plugin.id || ''), className);
    item.disabled = actionDisabled(plugin, operation);
    parent.appendChild(item);
    return item;
  }

  function contributionPanel(plugin) {
    var id = String(plugin.id || '');
    var version = typeof plugin.version === 'string' ? plugin.version : '';
    var panel = state.contributionPanels[id];
    if (!panel || panel.version !== version) {
      panel = state.contributionPanels[id] = {
        version: version, expanded: false, loaded: false, loading: false, invoking: false,
        contributions: [], bots: [], contributionId: '', botId: '', paramsText: '{}',
        resultText: '', hasResult: false, message: '', error: '', loadError: '', blockedInvocationKey: ''
      };
    }
    return panel;
  }

  function contributionCall(action, input) {
    var method = apiMethod('desktopPluginContribution');
    if (!method) return Promise.reject(new Error(tr('请更新 Bot Studio 桌面版以使用插件功能。', 'Update the Bot Studio desktop app to use plugin features.')));
    return Promise.resolve().then(function () {
      return method.call(root.grokbot, { action: action, input: input || {} });
    }).then(function (result) {
      if (!result || result.ok === false) {
        var error = new Error(result && typeof result.message === 'string' && result.message
          ? result.message : tr('插件功能操作未完成。', 'The plugin feature action did not complete.'));
        error.code = result && result.code || 'DESKTOP_PLUGIN_CONTRIBUTION_FAILED';
        throw error;
      }
      return result;
    });
  }

  function formatJson(value) {
    var text;
    try { text = typeof value === 'string' ? value : JSON.stringify(value, null, 2); }
    catch (_) { text = tr('无法显示此 JSON 数据。', 'This JSON data cannot be displayed.'); }
    if (typeof text !== 'string') text = String(text);
    return text.length > 20000 ? text.slice(0, 20000) + '\n' + tr('[内容已截断]', '[Content truncated]') : text;
  }

  function parseInputObject(text) {
    var value;
    try { value = JSON.parse(text); }
    catch (_) { return { error: tr('请输入有效的 JSON 对象。', 'Enter a valid JSON object.') }; }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { error: tr('参数必须是 JSON 对象。', 'Parameters must be a JSON object.') };
    }
    return { value: value };
  }

  function invocationKey(pluginId, panel) {
    return [pluginId, panel.contributionId, panel.botId, panel.paramsText].join('\n');
  }

  function kindText(kind) {
    var labels = {
      tools: ['工具', 'Tool'], actions: ['操作', 'Action'], settings: ['设置', 'Setting'], panels: ['面板', 'Panel']
    };
    var label = labels[kind];
    return label ? tr(label[0], label[1]) : tr('功能', 'Feature');
  }

  function dedicatedEntryText(managedBy) {
    if (managedBy === 'terminal_manage') return tr(
      '此功能请在下方 DSH SuperTerminal 区域使用。',
      'Use this feature in the DSH SuperTerminal section below.'
    );
    if (managedBy === 'app_observe / app_demo') return tr(
      '此功能请使用聊天输入栏中的截图或录制入口。',
      'Use the screenshot or recording controls in the chat composer for this feature.'
    );
    return tr('此功能由专用入口管理。', 'Use this feature from its dedicated entry.');
  }

  function loadContributions(pluginId) {
    var plugin = state.plugins.find(function (item) { return item && item.id === pluginId; });
    if (!plugin || !plugin.enabled) return Promise.resolve(false);
    var panel = contributionPanel(plugin);
    if (panel.loaded || panel.loading) return Promise.resolve(true);
    panel.loading = true;
    panel.loadError = '';
    panel.message = tr('正在读取插件功能…', 'Loading plugin features…');
    render();
    var version = panel.version;
    return contributionCall('list', { pluginId: pluginId }).then(function (result) {
      var current = state.plugins.find(function (item) { return item && item.id === pluginId; });
      var activePanel = current && contributionPanel(current);
      if (!activePanel || activePanel.version !== version) return false;
      if (!Array.isArray(result.contributions) || !Array.isArray(result.bots)) throw new Error(tr('插件功能列表格式无效。', 'The plugin feature list is invalid.'));
      activePanel.contributions = result.contributions.filter(function (item) {
        return item && item.pluginId === pluginId && typeof item.id === 'string';
      }).slice(0, 100);
      activePanel.bots = result.bots.filter(function (item) { return item && typeof item.id === 'string'; }).slice(0, 100);
      activePanel.loaded = true;
      if (!activePanel.contributions.some(function (item) { return item.id === activePanel.contributionId; })) {
        activePanel.contributionId = activePanel.contributions.length ? activePanel.contributions[0].id : '';
      }
      activePanel.message = '';
      activePanel.loadError = '';
      render();
      return true;
    }).catch(function (error) {
      var current = state.plugins.find(function (item) { return item && item.id === pluginId; });
      var activePanel = current && contributionPanel(current);
      if (!activePanel || activePanel.version !== version) return false;
      activePanel.loadError = safeError(error, tr('无法读取插件功能。', 'Could not load plugin features.'));
      activePanel.message = '';
      render();
      return false;
    }).then(function (result) {
      var current = state.plugins.find(function (item) { return item && item.id === pluginId; });
      var activePanel = current && contributionPanel(current);
      if (activePanel && activePanel.version === version) activePanel.loading = false;
      render();
      return result;
    });
  }

  function renderContributionPanel(plugin, index) {
    var panel = contributionPanel(plugin);
    var details = node('details', 'desktop-plugin-contribution');
    details.open = panel.expanded;
    var summary = node('summary', '', tr('插件功能', 'Plugin features'));
    summary.id = 'desktop-plugin-features-' + index;
    details.appendChild(summary);
    details.addEventListener('toggle', function () {
      panel.expanded = details.open;
      if (details.open) loadContributions(plugin.id);
    });

    var body = node('div', 'desktop-plugin-contribution-body');
    if (panel.loading) {
      body.appendChild(node('p', 'desktop-plugin-contribution-status', panel.message || tr('正在读取插件功能…', 'Loading plugin features…')));
    } else if (panel.loadError) {
      var error = node('p', 'desktop-plugin-contribution-error', panel.loadError);
      error.setAttribute('role', 'status');
      body.appendChild(error);
      var retry = contributionButton(tr('重新读取', 'Reload'), 'load-contributions', String(plugin.id || ''));
      retry.id = 'desktop-plugin-features-reload-' + index;
      body.appendChild(retry);
    } else if (!panel.loaded) {
      body.appendChild(node('p', 'desktop-plugin-contribution-status', tr(
        '展开后读取已启用插件声明的功能。',
        'Open this section to load features declared by the enabled plugin.'
      )));
    } else if (!panel.contributions.length) {
      body.appendChild(node('p', 'desktop-plugin-contribution-status', tr('此插件没有可直接运行的功能。', 'This plugin has no directly runnable features.')));
    } else {
      var contributionLabel = node('label', 'desktop-plugin-field');
      var contributionSelect = doc.createElement('select');
      contributionSelect.id = 'desktop-plugin-contribution-select-' + index;
      contributionSelect.dataset.pluginId = String(plugin.id || '');
      contributionSelect.dataset.contributionField = 'contribution';
      contributionLabel.htmlFor = contributionSelect.id;
      contributionLabel.appendChild(node('span', '', tr('功能', 'Feature')));
      var contributionPlaceholder = node('option', '', tr('选择插件功能…', 'Select a plugin feature…'));
      contributionPlaceholder.value = '';
      contributionSelect.appendChild(contributionPlaceholder);
      panel.contributions.forEach(function (item) {
        var title = typeof item.title === 'string' && item.title ? item.title.slice(0, 160) : item.id.slice(0, 120);
        var option = node('option', '', title + ' · ' + kindText(item.kind));
        option.value = item.id;
        option.selected = item.id === panel.contributionId;
        contributionSelect.appendChild(option);
      });
      contributionSelect.value = panel.contributionId;
      contributionLabel.appendChild(contributionSelect);
      body.appendChild(contributionLabel);

      var selected = panel.contributions.find(function (item) { return item.id === panel.contributionId; }) || null;
      if (selected && typeof selected.description === 'string' && selected.description) {
        body.appendChild(node('p', 'desktop-plugin-contribution-description', selected.description.slice(0, 1000)));
      }

      if (selected) {
        var schemaDetails = node('details', 'desktop-plugin-schema');
        var schemaSummary = node('summary', '', tr('参数参考', 'Parameter reference'));
        schemaSummary.id = 'desktop-plugin-schema-summary-' + index;
        var schema = node('pre', 'desktop-plugin-schema-json', formatJson(selected.input || {}));
        schemaDetails.append(schemaSummary, schema);
        body.appendChild(schemaDetails);
      }

      if (selected && typeof selected.managedBy === 'string' && selected.managedBy) {
        body.appendChild(node('p', 'desktop-plugin-managed-note', dedicatedEntryText(selected.managedBy)));
        if (selected.managedBy === 'terminal_manage') {
          var goTerminal = contributionButton(tr('打开 DSH SuperTerminal', 'Open DSH SuperTerminal'), 'open-terminal-entry', String(plugin.id || ''));
          body.appendChild(goTerminal);
        }
      } else if (selected) {
        var botLabel = node('label', 'desktop-plugin-field');
        var botSelect = doc.createElement('select');
        botSelect.id = 'desktop-plugin-bot-select-' + index;
        botSelect.dataset.pluginId = String(plugin.id || '');
        botSelect.dataset.contributionField = 'bot';
        botLabel.htmlFor = botSelect.id;
        botLabel.appendChild(node('span', '', tr('BOT', 'BOT')));
        var botPlaceholder = node('option', '', tr('选择 BOT…', 'Select a BOT…'));
        botPlaceholder.value = '';
        botSelect.appendChild(botPlaceholder);
        panel.bots.forEach(function (item) {
          var option = node('option', '', String(item.name || item.id).slice(0, 120));
          option.value = item.id;
          option.selected = item.id === panel.botId;
          botSelect.appendChild(option);
        });
        botSelect.value = panel.botId;
        botSelect.disabled = panel.invoking || !panel.bots.length;
        botLabel.appendChild(botSelect);
        body.appendChild(botLabel);
        if (!panel.bots.length) {
          body.appendChild(node('p', 'desktop-plugin-input-note', tr('没有可用的本机个人 BOT。', 'No local personal Bots are available.')));
        }

        var paramsLabel = node('label', 'desktop-plugin-field desktop-plugin-params');
        var params = doc.createElement('textarea');
        params.id = 'desktop-plugin-params-' + index;
        params.dataset.pluginId = String(plugin.id || '');
        params.dataset.contributionField = 'params';
        params.rows = 4;
        params.maxLength = 65536;
        params.spellcheck = false;
        params.value = panel.paramsText;
        params.setAttribute('aria-describedby', 'desktop-plugin-params-note-' + index);
        paramsLabel.htmlFor = params.id;
        paramsLabel.appendChild(node('span', '', tr('JSON 参数', 'JSON parameters')));
        paramsLabel.appendChild(params);
        body.appendChild(paramsLabel);
        var parsed = parseInputObject(panel.paramsText);
        var invocationBlocked = panel.blockedInvocationKey === invocationKey(plugin.id, panel);
        var paramsNote = node('p', 'desktop-plugin-input-note', parsed.error || tr(
          '插件会按此功能声明的参数格式校验。执行时桌面版会另行确认。',
          'The plugin checks parameters against this feature’s schema. The desktop app will ask for confirmation before running it.'
        ));
        paramsNote.id = 'desktop-plugin-params-note-' + index;
        if (parsed.error) paramsNote.dataset.state = 'error';
        else if (invocationBlocked) {
          paramsNote.textContent = tr('上次调用未完成。为避免重复执行，请先核对结果或调整参数。', 'The last call did not complete. Check its result or change parameters before running it again.');
          paramsNote.dataset.state = 'error';
        }
        body.appendChild(paramsNote);

        var invokeActions = node('div', 'desktop-plugin-invoke-actions');
        var run = contributionButton(tr('运行', 'Run'), 'invoke-contribution', String(plugin.id || ''), 'primary');
        run.id = 'desktop-plugin-run-' + index;
        run.disabled = panel.invoking || !selected.id || !panel.botId || !!parsed.error || invocationBlocked;
        invokeActions.appendChild(run);
        if (panel.invoking) {
          var pending = node('span', 'desktop-plugin-contribution-status', panel.message || tr('等待桌面版确认…', 'Waiting for desktop confirmation…'));
          pending.setAttribute('role', 'status');
          pending.setAttribute('aria-live', 'polite');
          invokeActions.appendChild(pending);
        }
        body.appendChild(invokeActions);
        if (panel.message && !panel.invoking) {
          var completed = node('p', 'desktop-plugin-contribution-status', panel.message);
          completed.setAttribute('role', 'status');
          completed.setAttribute('aria-live', 'polite');
          body.appendChild(completed);
        }
        if (panel.error) {
          var invokeError = node('p', 'desktop-plugin-contribution-error', panel.error);
          invokeError.setAttribute('role', 'status');
          body.appendChild(invokeError);
        }
        if (panel.hasResult) {
          var result = node('pre', 'desktop-plugin-result', panel.resultText);
          result.setAttribute('role', 'status');
          result.setAttribute('aria-live', 'polite');
          body.appendChild(result);
        }
      }
    }
    details.appendChild(body);
    return details;
  }

  function setContributionResult(panel, value) {
    panel.resultText = formatJson(value);
    panel.hasResult = true;
  }

  function invokeContribution(pluginId) {
    var plugin = state.plugins.find(function (item) { return item && item.id === pluginId; });
    if (!plugin || !plugin.enabled || state.action || state.proposal || state.committing || state.loading) return Promise.resolve(false);
    var panel = contributionPanel(plugin);
    if (!panel.loaded || panel.loading || panel.invoking) return Promise.resolve(false);
    var contribution = panel.contributions.find(function (item) { return item.id === panel.contributionId; });
    if (!contribution || contribution.managedBy) return Promise.resolve(false);
    var parsed = parseInputObject(panel.paramsText);
    if (parsed.error) {
      panel.error = parsed.error;
      render();
      return Promise.resolve(false);
    }
    if (!panel.botId || !panel.bots.some(function (item) { return item.id === panel.botId; })) {
      panel.error = tr('请选择一个 BOT。', 'Choose a BOT.');
      render();
      return Promise.resolve(false);
    }
    var requestKey = invocationKey(pluginId, panel);
    if (panel.blockedInvocationKey === requestKey) return Promise.resolve(false);
    panel.invoking = true;
    panel.error = '';
    panel.hasResult = false;
    panel.message = tr('等待桌面版确认…', 'Waiting for desktop confirmation…');
    render();
    // The host presents the approval dialog and binds the selected plugin
    // version and BOT scope. This renderer sends this request exactly once.
    return contributionCall('invoke', {
      pluginId: pluginId,
      contributionId: contribution.id,
      botId: panel.botId,
      input: parsed.value
    }).then(function (response) {
      panel.message = tr('插件功能已完成。', 'Plugin feature completed.');
      panel.loadError = '';
      setContributionResult(panel, response.result);
      return true;
    }).catch(function (error) {
      panel.error = safeError(error, tr('插件功能未完成。', 'The plugin feature did not complete.'));
      panel.blockedInvocationKey = requestKey;
      panel.message = '';
      return false;
    }).then(function (result) {
      panel.invoking = false;
      render();
      return result;
    });
  }

  function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function openscreenEngineMethod() {
    return apiMethod('openScreenEngineAction');
  }

  function openscreenVideoMethod() {
    return apiMethod('openScreenVideoAction');
  }

  function openscreenFailure(result, fallback) {
    var failure = new Error(result && typeof result.message === 'string' && result.message
      ? result.message.slice(0, 500) : fallback);
    failure.code = result && typeof result.code === 'string' ? result.code : 'OPENSCREEN_ENGINE_FAILED';
    return failure;
  }

  function openscreenEngineVersion(status) {
    if (status && typeof status.availableVersion === 'string' && status.availableVersion) return status.availableVersion;
    return '';
  }

  function openscreenUpstreamVersion(status) {
    return status && typeof status.latestVersion === 'string' && status.latestVersion ? status.latestVersion : '';
  }

  function openscreenEngineBusy() {
    var engine = state.openScreen.engine;
    return !!engine.action || !!(engine.status && engine.status.busy === true);
  }

  function openscreenButton(label, operation, id, disabled, className) {
    var item = button(label, 'openscreen-' + operation, '', className);
    item.id = id;
    item.dataset.openScreenOperation = operation;
    item.disabled = !!disabled;
    return item;
  }

  function openscreenVideoButton(label, operation, id, disabled, className) {
    var item = contributionButton(label, 'openscreen-' + operation, '', className);
    item.id = id;
    item.dataset.openScreenOperation = operation;
    item.disabled = !!disabled;
    return item;
  }

  function openscreenEngineStatusText() {
    var engine = state.openScreen.engine;
    var status = engine.status;
    if (engine.supported === false) return tr('暂不可用', 'Unavailable');
    if ((engine.action === 'prepare-model' || engine.action === 'install' || engine.action === 'upgrade') && (engine.canceling || engine.cancelRequested)) {
      return engine.action === 'prepare-model'
        ? tr('正在停止字幕模型', 'Stopping captions model')
        : tr('正在停止运行环境下载', 'Stopping runtime download');
    }
    if (engine.action === 'status') return tr('正在读取状态', 'Reading status');
    if (engine.action === 'check') return tr('正在检查更新', 'Checking for updates');
    if (engine.action === 'install') return tr('正在安装运行环境', 'Installing runtime');
    if (engine.action === 'upgrade') return tr('正在升级运行环境', 'Upgrading runtime');
    if (engine.action === 'rollback') return tr('正在回退运行环境', 'Rolling back runtime');
    if (engine.action === 'prepare-model') return tr('正在准备字幕模型', 'Preparing captions model');
    if (status && status.busy === true) return tr('正在处理', 'Working');
    if (engine.error) return tr('状态不可用', 'Status unavailable');
    if (!status) return tr('状态未知', 'Unknown status');
    if (status.installed === true) return tr('运行环境已安装', 'Runtime installed');
    if (status.installed === false) return tr('运行环境未安装', 'Runtime not installed');
    return tr('状态未知', 'Unknown status');
  }

  function renderOpenScreenEngine() {
    var engine = state.openScreen.engine;
    var status = engine.status || {};
    var availableVersion = openscreenEngineVersion(status);
    var latestVersion = openscreenUpstreamVersion(status);
    var installed = status.installed === true;
    var reviewed = status.updateReviewed === true;
    var updateAvailable = installed && reviewed && latestVersion && latestVersion !== status.version;
    var busy = openscreenEngineBusy();
    var row = node('section', 'desktop-plugin-row desktop-openscreen-engine');
    row.dataset.pluginId = 'openscreen-engine';
    row.setAttribute('aria-labelledby', 'openscreen-engine-title');

    var top = node('div', 'desktop-plugin-row-top');
    var identity = node('div', 'desktop-plugin-identity');
    var heading = node('h4', '', tr('OpenScreen 运行环境', 'OpenScreen runtime'));
    heading.id = 'openscreen-engine-title';
    var stateLabel = node('span', 'desktop-plugin-status', openscreenEngineStatusText());
    stateLabel.id = 'openscreen-engine-status';
    stateLabel.tabIndex = -1;
    stateLabel.dataset.state = busy ? 'pending' : engine.error ? 'error' : installed ? 'connected' : 'idle';
    stateLabel.setAttribute('role', 'status');
    append(identity, heading, stateLabel);
    top.appendChild(identity);

    var versionParts = [];
    if (installed && typeof status.version === 'string' && status.version) {
      versionParts.push(tr('当前运行环境版本 {version}', 'Current runtime version {version}', { version: status.version }));
    } else if (availableVersion) {
      versionParts.push(tr('可安装已审核版本 {version}', 'Reviewed install version {version}', { version: availableVersion }));
    } else {
      versionParts.push(tr('版本信息尚不可用', 'Version information is not available'));
    }
    if (latestVersion) {
      var upstreamVersionLabel = tr('上游最新版 {version}', 'Upstream latest {version}', { version: latestVersion });
      var upstreamReviewLabel = status.updateReviewed === true ? tr('已审核', 'reviewed')
        : status.updateReviewed === false ? tr('未审核', 'not reviewed') : tr('待检查', 'review unknown');
      versionParts.push(upstreamVersionLabel + tr('（{status}）', ' ({status})', { status: upstreamReviewLabel }));
    }
    if (updateAvailable) {
      versionParts.push(tr('可升级至 {version}', 'Update available: {version}', { version: latestVersion }));
    }
    if (installed && typeof status.previousVersion === 'string' && status.previousVersion) {
      versionParts.push(tr('可回退至 {version}', 'Rollback available: {version}', { version: status.previousVersion }));
    }
    top.appendChild(node('p', 'desktop-plugin-version', versionParts.join(' · ')));
    row.appendChild(top);
    row.appendChild(node('p', 'desktop-plugin-note', tr(
      '运行环境与 Bot Studio 插件分开管理。',
      'The runtime is managed separately from the Bot Studio plugin.'
    )));

    if (engine.supported === false) {
      row.appendChild(node('p', 'desktop-plugin-note', tr(
        '此 Bot Studio 桌面版没有 OpenScreen 运行环境管理接口。',
        'This Bot Studio desktop build does not provide OpenScreen runtime controls.'
      )));
    }
    if (engine.error) {
      var engineError = node('p', 'desktop-plugin-error', engine.error);
      engineError.setAttribute('role', 'status');
      row.appendChild(engineError);
    }
    if (installed && status.modelReady === true) {
      row.appendChild(node('p', 'desktop-plugin-note', tr('字幕模型已准备。', 'The captions model is ready.')));
    } else if (installed) {
      row.appendChild(node('p', 'desktop-plugin-note', status.modelReady === false
        ? tr('字幕模型尚未准备；首次准备可能需要较长下载。', 'The captions model is not ready. First time preparation may take longer to download.')
        : tr('字幕模型状态未知；可按需准备。', 'The captions model status is unknown. You can prepare it when needed.')));
    }
    if (status.busy === true && !engine.action) {
      row.appendChild(node('p', 'desktop-plugin-note', tr(
        'OpenScreen 运行环境正在处理；完成后才能继续操作。',
        'The OpenScreen runtime is working. Wait for it to finish before starting another action.'
      )));
    }
    if (status.updateReviewed === false && (latestVersion || status.updateReason)) {
      var updateReason = String(status.updateReason || '').slice(0, 400);
      var repeatsReviewState = /(?:尚未完成|未完成|未通过).*兼容性核验|has not (?:passed|completed) compatibility review/i.test(updateReason);
      var reviewNote = latestVersion
        ? updateReason && !repeatsReviewState
          ? tr('上游最新版 {version} 尚未完成兼容性核验：{reason}', 'Upstream latest {version} has not passed compatibility review: {reason}', {
            version: latestVersion, reason: updateReason
          })
          : tr('上游最新版 {version} 尚未完成兼容性核验，当前不会提供此版本的安装或升级操作。', 'Upstream latest {version} has not passed compatibility review, so this version is not offered for install or upgrade.', { version: latestVersion })
        : updateReason || tr('版本尚未完成兼容性核验。', 'The version has not passed compatibility review.');
      row.appendChild(node('p', 'desktop-plugin-note', reviewNote));
    }
    if (engine.feedback) row.appendChild(node('p', 'desktop-plugin-note', engine.feedback));

    var actions = node('div', 'desktop-plugin-actions');
    var unavailable = engine.supported === false || !openscreenEngineMethod();
    if (!unavailable) {
      actions.appendChild(openscreenButton(tr('检查更新', 'Check for updates'), 'engine-check', 'openscreen-engine-check', busy));
      if (status.installed === false && availableVersion) {
        actions.appendChild(openscreenButton(
          tr('安装已审核运行环境 {version}', 'Install reviewed runtime {version}', { version: availableVersion }), 'engine-install', 'openscreen-engine-install', busy, 'primary'
        ));
      } else if (updateAvailable) {
        actions.appendChild(openscreenButton(
          tr('升级运行环境至 {version}', 'Upgrade runtime to {version}', { version: latestVersion }), 'engine-upgrade', 'openscreen-engine-upgrade', busy, 'primary'
        ));
      }
      if (installed && typeof status.previousVersion === 'string' && status.previousVersion) {
        actions.appendChild(openscreenButton(
          tr('回退运行环境至 {version}', 'Roll back runtime to {version}', { version: status.previousVersion }), 'engine-rollback', 'openscreen-engine-rollback', busy
        ));
      }
      if (engine.action === 'install' || engine.action === 'upgrade') {
        actions.appendChild(openscreenButton(
          engine.canceling || engine.cancelRequested ? tr('正在停止…', 'Stopping…') : tr('停止下载', 'Stop download'),
          'engine-cancel-engine', 'openscreen-engine-cancel-engine', engine.canceling || engine.cancelRequested, 'danger'
        ));
      }
      if (installed && status.modelReady !== true) {
        actions.appendChild(openscreenButton(
          engine.action === 'prepare-model' ? tr('正在准备字幕模型…', 'Preparing captions model…') : tr('准备字幕模型', 'Prepare captions model'),
          'engine-prepare-model', 'openscreen-engine-prepare-model', busy
        ));
      }
      if (engine.action === 'prepare-model') {
        actions.appendChild(openscreenButton(
          engine.canceling || engine.cancelRequested ? tr('正在停止…', 'Stopping…') : tr('停止准备', 'Stop preparation'),
          'engine-cancel-model', 'openscreen-engine-cancel-model', engine.canceling || engine.cancelRequested, 'danger'
        ));
      }
    }
    if (actions.children.length) row.appendChild(actions);
    return row;
  }

  function formatOpenScreenDuration(value) {
    var seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds < 0) return '';
    seconds = Math.floor(seconds);
    var minutes = Math.floor(seconds / 60);
    var remainder = String(seconds % 60).padStart(2, '0');
    return minutes + ':' + remainder;
  }

  function openScreenRecordingLabel(recording) {
    var parts = [];
    if (typeof recording.at === 'string' && recording.at) parts.push(recording.at.slice(0, 80));
    if (typeof recording.targetName === 'string' && recording.targetName) parts.push(recording.targetName.slice(0, 120));
    var duration = formatOpenScreenDuration(recording.durationSeconds);
    if (duration) parts.push(duration);
    return parts.join(' · ') || String(recording.recordingId || '');
  }

  function renderOpenScreenVideo() {
    var video = state.openScreen.video;
    var engineStatus = state.openScreen.engine.status;
    var modelReady = !!(engineStatus && engineStatus.installed === true && engineStatus.modelReady === true);
    var captionsNeedModel = video.captions && !modelReady;
    var processing = video.processing;
    var busy = processing || video.loadingBots || video.loadingRecordings;
    var row = node('section', 'desktop-plugin-row desktop-openscreen-video');
    row.dataset.pluginId = 'openscreen-video';
    row.setAttribute('aria-labelledby', 'openscreen-video-title');
    row.setAttribute('aria-busy', busy ? 'true' : 'false');

    var top = node('div', 'desktop-plugin-row-top');
    var identity = node('div', 'desktop-plugin-identity');
    var heading = node('h4', '', tr('录屏后处理', 'Recording post-processing'));
    heading.id = 'openscreen-video-title';
    var statusText = video.processing ? tr('正在处理', 'Processing')
      : video.loadingBots || video.loadingRecordings ? tr('正在读取', 'Loading')
        : video.supported === false || video.error ? tr('需要处理', 'Needs attention')
          : video.selectedRecordingId ? tr('已选择录屏', 'Recording selected') : tr('等待选择', 'Choose a recording');
    var status = node('span', 'desktop-plugin-status', statusText);
    status.id = 'openscreen-video-status';
    status.dataset.state = video.processing || video.loadingBots || video.loadingRecordings ? 'pending'
      : video.error || video.supported === false ? 'error' : video.selectedRecordingId ? 'connected' : 'idle';
    status.setAttribute('role', 'status');
    append(identity, heading, status);
    top.appendChild(identity);
    var plugin = state.plugins.find(function (item) { return item && item.id === 'openscreen'; });
    var videoDescription = processing || (plugin && plugin.installed && plugin.enabled)
      ? tr('为已保存的录屏添加字幕或文字标注。', 'Add captions or an annotation to a saved recording.')
      : plugin && plugin.installed
        ? tr('启用 OpenScreen 插件后即可处理录屏。', 'Enable the OpenScreen plugin to process recordings.')
        : tr('需要单独安装 OpenScreen 插件后才能添加字幕或文字标注。', 'Install the OpenScreen plugin separately to add captions or an annotation to a saved recording.');
    top.appendChild(node('p', 'desktop-plugin-version', videoDescription));
    row.appendChild(top);

    var body = node('div', 'desktop-plugin-contribution-body');
    if (video.supported === false) {
      body.appendChild(node('p', 'desktop-plugin-contribution-status', tr(
        '此 Bot Studio 桌面版没有录屏处理接口；请使用包含 OpenScreen 的桌面版。',
        'This Bot Studio desktop build does not provide recording processing. Update to a build with OpenScreen support.'
      )));
    }
    if (video.error) {
      var videoError = node('p', 'desktop-plugin-contribution-error', video.error);
      videoError.setAttribute('role', 'status');
      body.appendChild(videoError);
    }
    if (video.feedback) {
      var feedback = node('p', 'desktop-plugin-contribution-status', video.feedback);
      feedback.id = 'openscreen-video-feedback';
      feedback.setAttribute('role', 'status');
      body.appendChild(feedback);
    }
    if (captionsNeedModel) {
      var engine = state.openScreen.engine;
      var modelNote = node('p', 'desktop-plugin-contribution-status', engine.action === 'prepare-model'
        ? engine.canceling || engine.cancelRequested
          ? tr('正在停止字幕模型准备；这不会取消录屏处理。', 'Stopping captions model preparation; this does not cancel recording processing.')
          : tr('字幕模型正在准备；完成后即可添加字幕。', 'The captions model is being prepared. Captions will be available when it is ready.')
        : tr('添加字幕需要已准备的字幕模型。请在上方运行环境行单独准备；首次下载可能较久。关闭字幕后仍可只添加标注。',
          'Captions require a prepared model. Prepare it separately in the runtime section above; the first download may take longer. Turn captions off to process an annotation only.'));
      modelNote.id = 'openscreen-video-model-note';
      body.appendChild(modelNote);
    }

    var canEdit = video.supported !== false && !processing;
    var botField = node('label', 'desktop-plugin-field');
    botField.setAttribute('for', 'openscreen-video-bot');
    botField.appendChild(node('span', '', tr('BOT', 'Bot')));
    var botSelect = node('select');
    botSelect.id = 'openscreen-video-bot';
    botSelect.dataset.openScreenField = 'bot';
    botSelect.setAttribute('aria-label', tr('选择 BOT', 'Select a Bot'));
    botSelect.disabled = !canEdit || video.loadingBots || video.bots.length === 0;
    var botPlaceholder = node('option', '', video.loadingBots ? tr('正在读取 BOT…', 'Loading Bots…') : tr('选择 BOT', 'Select a Bot'));
    botPlaceholder.value = '';
    botSelect.appendChild(botPlaceholder);
    video.bots.forEach(function (bot) {
      var option = node('option', '', bot.name);
      option.value = bot.id;
      option.selected = bot.id === video.selectedBotId;
      botSelect.appendChild(option);
    });
    botField.appendChild(botSelect);
    body.appendChild(botField);

    var recordingField = node('label', 'desktop-plugin-field');
    recordingField.setAttribute('for', 'openscreen-video-recording');
    recordingField.appendChild(node('span', '', tr('录屏', 'Recording')));
    var recordingSelect = node('select');
    recordingSelect.id = 'openscreen-video-recording';
    recordingSelect.dataset.openScreenField = 'recording';
    recordingSelect.setAttribute('aria-label', tr('选择录屏', 'Select a recording'));
    recordingSelect.disabled = !canEdit || video.loadingRecordings || video.recordings.length === 0;
    var recordingPlaceholder = node('option', '', video.loadingRecordings
      ? tr('正在读取录屏…', 'Loading recordings…')
      : video.recordings.length ? tr('选择录屏', 'Select a recording') : tr('没有可用录屏', 'No recordings available'));
    recordingPlaceholder.value = '';
    recordingSelect.appendChild(recordingPlaceholder);
    video.recordings.forEach(function (recording) {
      var option = node('option', '', openScreenRecordingLabel(recording));
      option.value = recording.recordingId;
      option.selected = recording.recordingId === video.selectedRecordingId;
      recordingSelect.appendChild(option);
    });
    recordingField.appendChild(recordingSelect);
    body.appendChild(recordingField);

    if (video.supported !== false && !video.loadingBots && video.bots.length === 0) {
      body.appendChild(node('p', 'desktop-plugin-contribution-status', tr(
        '没有可选择的 BOT。', 'No Bots are available.'
      )));
    } else if (video.selectedBotId && !video.loadingRecordings && video.recordings.length === 0 && !video.error) {
      body.appendChild(node('p', 'desktop-plugin-contribution-status', tr(
        '这个 BOT 还没有可处理的录屏。', 'This Bot has no recordings to process yet.'
      )));
    }

    var captionField = node('label', 'desktop-plugin-field');
    captionField.appendChild(node('span', '', tr('字幕', 'Captions')));
    var captions = node('input');
    captions.type = 'checkbox';
    captions.id = 'openscreen-video-captions';
    captions.dataset.openScreenField = 'captions';
    captions.checked = video.captions;
    captions.disabled = !canEdit;
    captions.setAttribute('aria-label', tr('添加字幕', 'Add captions'));
    if (captionsNeedModel) captions.setAttribute('aria-describedby', 'openscreen-video-model-note');
    var captionControl = node('span');
    captionControl.appendChild(captions);
    captionField.appendChild(captionControl);
    body.appendChild(captionField);

    var annotationField = node('label', 'desktop-plugin-field');
    annotationField.setAttribute('for', 'openscreen-video-annotation');
    annotationField.appendChild(node('span', '', tr('标注文字', 'Annotation')));
    var annotation = node('textarea');
    annotation.id = 'openscreen-video-annotation';
    annotation.dataset.openScreenField = 'annotation';
    annotation.maxLength = 500;
    annotation.value = video.annotation;
    annotation.disabled = !canEdit;
    annotation.setAttribute('aria-label', tr('可选标注文字', 'Optional annotation'));
    annotation.placeholder = tr('可留空', 'Optional');
    annotationField.appendChild(annotation);
    body.appendChild(annotationField);

    var actions = node('div', 'desktop-plugin-invoke-actions');
    if (video.supported !== false && video.errorScope === 'bots') {
      actions.appendChild(openscreenVideoButton(tr('重试读取 BOT', 'Retry Bot list'), 'video-retry-bots', 'openscreen-video-retry-bots', busy));
    } else if (video.supported !== false && video.errorScope === 'recordings') {
      actions.appendChild(openscreenVideoButton(tr('重试读取录屏', 'Retry recordings'), 'video-retry-recordings', 'openscreen-video-retry-recordings', busy));
    }
    if (processing) {
      actions.appendChild(openscreenVideoButton(
        video.canceling || video.cancelRequested ? tr('正在停止…', 'Stopping…') : tr('停止处理', 'Stop processing'),
        'video-cancel', 'openscreen-video-cancel', video.canceling || video.cancelRequested, 'danger'
      ));
    } else {
      var processButton = openscreenVideoButton(
        tr('处理并保存', 'Process and save'), 'video-process', 'openscreen-video-process',
        !canEdit || video.loadingBots || video.loadingRecordings || !video.selectedBotId || !video.selectedRecordingId || captionsNeedModel, 'primary'
      );
      if (captionsNeedModel) processButton.setAttribute('aria-describedby', 'openscreen-video-model-note');
      actions.appendChild(processButton);
    }
    body.appendChild(actions);
    row.appendChild(body);
    return row;
  }

  function callOpenScreenVideo(request) {
    var method = openscreenVideoMethod();
    if (!method) {
      var error = new Error(tr('此 Bot Studio 桌面版没有录屏处理接口。', 'This Bot Studio desktop build does not provide recording processing.'));
      error.code = 'OPENSCREEN_BRIDGE_UNAVAILABLE';
      return Promise.reject(error);
    }
    state.openScreen.video.supported = true;
    return Promise.resolve().then(function () {
      return method.call(root.grokbot, request);
    }).then(function (result) {
      if (!result || result.ok !== true) throw openscreenFailure(result, tr('OpenScreen 操作未完成。', 'The OpenScreen action did not complete.'));
      return result;
    });
  }

  function loadOpenScreenRecordings(botId) {
    var video = state.openScreen.video;
    video.selectedBotId = botId || '';
    video.selectedRecordingId = '';
    video.recordings = [];
    video.error = '';
    video.errorScope = '';
    video.feedback = '';
    var request = ++video.recordingRequest;
    if (!botId || video.supported === false) {
      video.loadingRecordings = false;
      render();
      return Promise.resolve(false);
    }
    video.loadingRecordings = true;
    render();
    return callOpenScreenVideo({ action: 'listRecordings', botId: botId }).then(function (result) {
      if (request !== video.recordingRequest) return false;
      if (!Array.isArray(result.recordings)) throw new Error(tr('录屏列表格式无效。', 'The recording list is invalid.'));
      video.recordings = result.recordings.filter(function (item) {
        return isRecord(item) && (typeof item.recordingId === 'string' || typeof item.recordingId === 'number');
      }).map(function (item) {
        return {
          recordingId: String(item.recordingId),
          at: typeof item.at === 'string' ? item.at : '',
          durationSeconds: item.durationSeconds,
          targetName: typeof item.targetName === 'string' ? item.targetName : ''
        };
      });
      if (video.recordings.length) video.selectedRecordingId = video.recordings[0].recordingId;
      callOpenScreenVideo({action:'listJobs',botId:botId}).then(function(receipt){
        if(request!==video.recordingRequest||!Array.isArray(receipt.jobs)||!receipt.jobs.length)return;
        var last=receipt.jobs[0];if(last.state==='unknown')video.feedback=tr('上次处理结果未知，请检查保存位置后再操作。','The previous result is unknown; inspect the save location before retrying.');
        else if(last.state==='running'||last.state==='cancelling'){video.processing=true;video.jobId=last.id;video.feedback=tr('已有处理正在进行。','Processing is already running.');var resumed=++video.processRequest;watchOpenScreenJob(last.id,botId,resumed).catch(function(){video.error=tr('无法确认处理结果。','Could not confirm the result.');}).then(function(){if(resumed===video.processRequest){video.processing=false;video.jobId=null;render();}});}
        render();
      }).catch(function(){if(request===video.recordingRequest){video.error=tr('无法读取处理记录。','Could not read processing history.');render();}});
      video.error = '';
      video.errorScope = '';
      render();
      return true;
    }).catch(function (error) {
      if (request !== video.recordingRequest) return false;
      var bridgeUnavailable = error && error.code === 'OPENSCREEN_BRIDGE_UNAVAILABLE';
      video.supported = bridgeUnavailable ? false : true;
      video.error = bridgeUnavailable ? '' : safeError(error, tr('无法读取录屏列表。', 'Could not read recordings.'));
      video.errorScope = 'recordings';
      return false;
    }).then(function (result) {
      if (request === video.recordingRequest) {
        video.loadingRecordings = false;
        render();
      }
      return result;
    });
  }

  function loadOpenScreenBots() {
    var video = state.openScreen.video;
    if (video.processing) return Promise.resolve(false);
    var request = ++video.botRequest;
    video.loadingBots = true;
    video.error = '';
    video.errorScope = '';
    video.feedback = '';
    render();
    return callOpenScreenVideo({ action: 'listBots' }).then(function (result) {
      if (request !== video.botRequest) return false;
      if (!Array.isArray(result.bots)) throw new Error(tr('BOT 列表格式无效。', 'The Bot list is invalid.'));
      video.bots = result.bots.filter(function (item) {
        return isRecord(item) && (typeof item.id === 'string' || typeof item.id === 'number');
      }).map(function (item) {
        var id = String(item.id);
        return { id: id, name: typeof item.name === 'string' && item.name.trim() ? item.name.slice(0, 160) : id };
      });
      if (!video.bots.some(function (bot) { return bot.id === video.selectedBotId; })) {
        video.selectedBotId = video.bots.length ? video.bots[0].id : '';
      }
      video.loadingBots = false;
      render();
      return loadOpenScreenRecordings(video.selectedBotId);
    }).catch(function (error) {
      if (request !== video.botRequest) return false;
      var bridgeUnavailable = error && error.code === 'OPENSCREEN_BRIDGE_UNAVAILABLE';
      video.supported = bridgeUnavailable ? false : true;
      video.bots = [];
      video.recordings = [];
      video.selectedBotId = '';
      video.selectedRecordingId = '';
      video.error = bridgeUnavailable ? '' : safeError(error, tr('无法读取 BOT 列表。', 'Could not read the Bot list.'));
      video.errorScope = 'bots';
      return false;
    }).then(function (result) {
      if (request === video.botRequest) {
        video.loadingBots = false;
        render();
      }
      return result;
    });
  }

  function loadOpenScreenResources() {
    if (state.openScreen.loaded) return;
    state.openScreen.loaded = true;
    openScreenEngineAction('status');
    loadOpenScreenBots();
  }

  function openScreenEngineAction(action) {
    var engine = state.openScreen.engine;
    if (action === 'cancel-model') return cancelOpenScreenModel();
    if (action === 'cancel-engine') return cancelOpenScreenEngineDownload();
    if (engine.action) return Promise.resolve(false);
    var method = openscreenEngineMethod();
    if (!method) {
      engine.supported = false;
      engine.error = '';
      render();
      return Promise.resolve(false);
    }
    engine.supported = true;
    engine.action = action;
    if (action === 'prepare-model' || action === 'install' || action === 'upgrade') {
      engine.operationRequest++;
      engine.canceling = false;
      engine.cancelRequested = false;
    }
    engine.error = '';
    engine.feedback = '';
    render();
    var canceledWork = false;
    return Promise.resolve().then(function () {
      return method.call(root.grokbot, { action: action });
    }).then(function (result) {
      if (!result || result.ok !== true) throw openscreenFailure(result, tr('OpenScreen 操作未完成。', 'The OpenScreen action did not complete.'));
      if (isRecord(result.status)) {
        engine.status = result.status;
      } else if (action !== 'status') {
        return Promise.resolve(method.call(root.grokbot, { action: 'status' })).then(function (statusResult) {
          if (!statusResult || statusResult.ok !== true || !isRecord(statusResult.status)) {
            throw openscreenFailure(statusResult, tr('OpenScreen 操作已返回，但状态暂时无法确认。', 'The OpenScreen action returned, but its state could not be confirmed.'));
          }
          engine.status = statusResult.status;
          return statusResult;
        });
      } else {
        throw new Error(tr('OpenScreen 状态格式无效。', 'The OpenScreen status is invalid.'));
      }
      return result;
    }).then(function (result) {
      if (action !== 'status' && !canceledWork) {
        engine.feedback = action === 'prepare-model' && engine.status && engine.status.modelReady === true ? ''
          : result && typeof result.message === 'string' && result.message
          ? result.message.slice(0, 500)
          : action === 'check' ? tr('OpenScreen 状态已刷新。', 'OpenScreen status refreshed.')
            : action === 'install' ? tr('OpenScreen 运行环境安装完成。', 'OpenScreen runtime installation completed.')
              : action === 'upgrade' ? tr('OpenScreen 运行环境升级完成。', 'OpenScreen runtime upgrade completed.')
                : action === 'rollback' ? tr('OpenScreen 运行环境已回退。', 'OpenScreen runtime rolled back.')
                  : action === 'prepare-model' ? tr('字幕模型已准备。', 'Captions model prepared.') : '';
      }
      return true;
    }).catch(function (error) {
      if ((action === 'prepare-model' || action === 'install' || action === 'upgrade') && engine.cancelRequested && error && error.code === 'CANCELLED') {
        canceledWork = true;
        engine.error = '';
        engine.feedback = action === 'prepare-model'
          ? tr('字幕模型准备已停止。', 'Captions model preparation stopped.')
          : tr('运行环境下载已停止。', 'Runtime download stopped.');
        return Promise.resolve().then(function () {
          return method.call(root.grokbot, { action: 'status' });
        }).then(function (statusResult) {
          if (statusResult && statusResult.ok === true && isRecord(statusResult.status)) engine.status = statusResult.status;
          return false;
        }).catch(function () { return false; });
      }
      engine.error = safeError(error, tr('OpenScreen 操作未完成。', 'The OpenScreen action did not complete.'));
      return false;
    }).then(function (result) {
      engine.action = '';
      if (action === 'prepare-model' || action === 'install' || action === 'upgrade') {
        engine.canceling = false;
        engine.cancelRequested = false;
      }
      render();
      return result;
    });
  }

  function cancelOpenScreenModel() {
    var engine = state.openScreen.engine;
    if (engine.action !== 'prepare-model' || engine.canceling || engine.cancelRequested) return Promise.resolve(false);
    var method = openscreenEngineMethod();
    if (!method) return Promise.resolve(false);
    var operationRequest = engine.operationRequest;
    engine.canceling = true;
    engine.error = '';
    engine.feedback = '';
    render();
    return Promise.resolve().then(function () {
      return method.call(root.grokbot, { action: 'cancel-model' });
    }).then(function (result) {
      if (!result || result.ok !== true) throw openscreenFailure(result, tr('无法停止字幕模型准备。', 'Could not stop captions model preparation.'));
      if (engine.operationRequest !== operationRequest || engine.action !== 'prepare-model') return false;
      if (isRecord(result.status)) engine.status = result.status;
      if (engine.status && engine.status.modelReady === true) {
        engine.feedback = '';
      } else {
        engine.cancelRequested = true;
        engine.feedback = result.message || tr('正在停止字幕模型准备…', 'Stopping captions model preparation…');
      }
      return true;
    }).catch(function (error) {
      if (engine.operationRequest !== operationRequest || engine.action !== 'prepare-model') return false;
      engine.error = safeError(error, tr('无法停止字幕模型准备。', 'Could not stop captions model preparation.'));
      return false;
    }).then(function (result) {
      if (engine.operationRequest === operationRequest && engine.action === 'prepare-model') {
        engine.canceling = false;
        render();
      }
      return result;
    });
  }

  function cancelOpenScreenEngineDownload() {
    var engine = state.openScreen.engine;
    if (engine.action !== 'install' && engine.action !== 'upgrade') return Promise.resolve(false);
    if (engine.canceling || engine.cancelRequested) return Promise.resolve(false);
    var method = openscreenEngineMethod();
    if (!method) return Promise.resolve(false);
    var operation = engine.action;
    var operationRequest = engine.operationRequest;
    engine.canceling = true;
    engine.error = '';
    engine.feedback = '';
    render();
    return Promise.resolve().then(function () {
      return method.call(root.grokbot, { action: 'cancel-engine' });
    }).then(function (result) {
      if (!result || result.ok !== true) throw openscreenFailure(result, tr('无法停止运行环境下载。', 'Could not stop runtime download.'));
      if (engine.operationRequest !== operationRequest || engine.action !== operation) return false;
      if (isRecord(result.status)) engine.status = result.status;
      engine.cancelRequested = true;
      engine.feedback = result.message || tr('正在停止运行环境下载…', 'Stopping runtime download…');
      return true;
    }).catch(function (error) {
      if (engine.operationRequest !== operationRequest || engine.action !== operation) return false;
      engine.error = safeError(error, tr('无法停止运行环境下载。', 'Could not stop runtime download.'));
      return false;
    }).then(function (result) {
      if (engine.operationRequest === operationRequest && engine.action === operation) {
        engine.canceling = false;
        render();
      }
      return result;
    });
  }

  function watchOpenScreenJob(id,botId,request){
    var video=state.openScreen.video;return new Promise(function(resolve){root.setTimeout(resolve,500);}).then(function(){return callOpenScreenVideo({action:'status',botId:botId,jobId:id});}).then(function(result){if(request!==video.processRequest)return false;if(['running','cancelling'].indexOf(result.state)>=0)return watchOpenScreenJob(id,botId,request);video.feedback=result.message||({'completed':tr('处理完成。','Processing completed.'),'cancelled':tr('已停止处理。','Processing stopped.'),'unknown':tr('结果未知，请检查后再操作。','Result unknown; inspect before retrying.'),'expired':tr('结果已过期。','Result expired.')})[result.state]||tr('处理未完成。','Processing did not complete.');return result.state==='completed';});
  }
  function processOpenScreenVideo() {
    var video = state.openScreen.video;
    if (video.processing || !video.selectedBotId || !video.selectedRecordingId) return Promise.resolve(false);
    var request = ++video.processRequest;
    var input = {
      action: 'process', botId: video.selectedBotId, recordingId: video.selectedRecordingId,
      captions: !!video.captions, annotation: String(video.annotation || '').trim()
    };
    video.processing = true;
    video.canceling = false;
    video.cancelRequested = false;
    video.error = '';
    video.errorScope = '';
    video.feedback = '';
    render();
    function poll(id){return watchOpenScreenJob(id,input.botId,request);}
    return callOpenScreenVideo(input).then(function(result){if(request!==video.processRequest)return false;if(result.canceled){video.feedback=tr('已取消。','Cancelled.');return false;}video.jobId=result.id;return poll(result.id);}).catch(function(error){if(request===video.processRequest){video.error=safeError(error,tr('结果无法确认，请检查后再操作。','Result cannot be confirmed; inspect before retrying.'));video.errorScope='process';}return false;}).then(function(result){if(request===video.processRequest){video.processing=false;video.canceling=false;video.cancelRequested=false;video.jobId=null;render();}return result;});
  }
  function cancelOpenScreenVideo(){
    var video=state.openScreen.video;if(!video.processing||video.canceling||!video.jobId)return Promise.resolve(false);video.canceling=true;render();
    return callOpenScreenVideo({action:'cancel',botId:video.selectedBotId,jobId:video.jobId}).then(function(){video.cancelRequested=true;return true;}).catch(function(error){video.error=safeError(error,tr('无法停止处理。','Could not stop processing.'));return false;}).then(function(result){video.canceling=false;render();return result;});
  }

  function renderPlugin(plugin, index) {
    var row = node('section', 'desktop-plugin-row');
    row.dataset.pluginId = String(plugin.id || '');
    row.dataset.state = statusTone(plugin);
    row.setAttribute('aria-labelledby', 'desktop-plugin-name-' + index);

    var top = node('div', 'desktop-plugin-row-top');
    var identity = node('div', 'desktop-plugin-identity');
    var heading = node('h4', '', pluginName(plugin));
    heading.id = 'desktop-plugin-name-' + index;
    var status = node('span', 'desktop-plugin-status', statusText(plugin));
    status.dataset.state = statusTone(plugin);
    status.setAttribute('role', 'status');
    append(identity, heading, status);
    top.appendChild(identity);

    var version = node('p', 'desktop-plugin-version', versionSummary(plugin));
    top.appendChild(version);
    row.appendChild(top);

    if (plugin.error) {
      var error = node('p', 'desktop-plugin-error', String(plugin.error).slice(0, 500));
      error.setAttribute('role', 'status');
      row.appendChild(error);
    } else if (plugin.busy) {
      var busyNote = node('p', 'desktop-plugin-note', tr(
        '插件有正在进行的工作；结束后才能更新或回退。',
        'This plugin has work in progress. Finish it before updating or rolling back.'
      ));
      row.appendChild(busyNote);
    }

    if (!plugin.installed && plugin.legacy && (plugin.legacy.version || plugin.legacy.enabledIntent)) {
      row.appendChild(node('p', 'desktop-plugin-legacy-note', tr(
        '已有旧版配置，安装兼容版后继续使用；原配置和素材保留。',
        'A legacy setup exists. Install a compatible version to continue using it; existing settings and assets will be kept.'
      )));
    }

    var actions = node('div', 'desktop-plugin-actions');
    if (plugin.changing && plugin.state === 'downloading') {
      var cancelLabel = tr('取消准备', 'Cancel preparation');
      var cancel = button(cancelLabel, 'cancel-download', String(plugin.id || ''));
      cancel.disabled = state.cancelRequestedFor === plugin.id;
      actions.appendChild(cancel);
      var preparing = node('p', 'desktop-plugin-note', typeof plugin.totalBytes === 'number' && plugin.totalBytes > 0
        ? tr('正在准备约 {size} 的安装包…', 'Preparing a package of about {size}…', { size: formatBytes(plugin.totalBytes) })
        : tr('正在准备安装包…', 'Preparing package…'));
      row.appendChild(preparing);
    } else if (!plugin.installed) {
      actionButton(actions, tr('安装', 'Install'), 'install', plugin, 'primary');
    } else {
      if (plugin.enabled) actionButton(actions, tr('停用', 'Disable'), 'disable', plugin);
      else actionButton(actions, tr('启用', 'Enable'), 'enable', plugin, 'primary');
      if (plugin.updateAvailable) {
        actionButton(actions, tr('更新到 {version}', 'Update to {version}', { version: plugin.availableVersion || '' }), 'update', plugin, 'primary');
      }
      if (typeof plugin.previousVersion === 'string' && plugin.previousVersion) {
        actionButton(actions, tr('回退到 {version}', 'Roll back to {version}', { version: plugin.previousVersion }), 'rollback', plugin);
      }
      actionButton(actions, tr('卸载', 'Uninstall'), 'uninstall', plugin, 'desktop-plugin-uninstall');
    }
    if (actions.children.length) row.appendChild(actions);
    if (plugin.enabled) row.appendChild(renderContributionPanel(plugin, index));
    return row;
  }

  function render() {
    if (!els.list || !state.ready) return;
    var focusId = !state.proposal && els.root.contains(doc.activeElement) ? doc.activeElement.id : '';
    els.list.replaceChildren();
    if (!state.plugins.length) {
      els.list.appendChild(node('p', 'desktop-plugins-empty', tr('暂无可管理的桌面插件。', 'No desktop plugins are available.')));
    } else {
      state.plugins.forEach(function (plugin, index) {
        if (plugin && typeof plugin === 'object') els.list.appendChild(renderPlugin(plugin, index));
      });
    }
    els.list.appendChild(renderOpenScreenEngine());
    els.list.appendChild(renderOpenScreenVideo());
    if (els.refresh) els.refresh.disabled = state.loading || state.committing || !!state.action;
    if (els.importFile) els.importFile.disabled = state.loading || state.committing || !!state.action || !!state.proposal;
    if (state.proposal) renderProposal();
    if (focusId) {
      var restoreId = focusId;
      if (focusId === 'openscreen-video-process' && state.openScreen.video.processing) restoreId = 'openscreen-video-cancel';
      else if (focusId === 'openscreen-video-cancel' && !state.openScreen.video.processing) restoreId = 'openscreen-video-process';
      var restore = doc.getElementById(restoreId);
      if (restore && restore.disabled) restore = null;
      if (!restore && (focusId === 'openscreen-engine-cancel-model' || focusId === 'openscreen-engine-cancel-engine')) {
        var engineAction = state.openScreen.engine.action;
        var engineWorkActive = engineAction === 'prepare-model' || engineAction === 'install' || engineAction === 'upgrade';
        restore = doc.getElementById(engineWorkActive ? 'openscreen-engine-status' : 'openscreen-engine-check');
      }
      if (!restore && focusId.indexOf('openscreen-engine-') === 0) {
        var engineCheck = doc.getElementById('openscreen-engine-check');
        restore = engineCheck && !engineCheck.disabled ? engineCheck : doc.getElementById('openscreen-engine-status');
      }
      if (restore && els.root.contains(restore)) restore.focus({ preventScroll: true });
    }
  }

  function formatBytes(value) {
    var bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return Math.round(bytes) + ' B';
    var units = ['KB', 'MB', 'GB'];
    var unit = -1;
    do { bytes /= 1024; unit++; } while (bytes >= 1024 && unit < units.length - 1);
    return bytes.toFixed(bytes < 10 ? 1 : 0) + ' ' + units[unit];
  }

  function acceptList(result) {
    if (!result || !Array.isArray(result.plugins)) throw new Error(tr('插件列表格式无效。', 'The plugin list is invalid.'));
    state.plugins = result.plugins.filter(function (item) { return item && typeof item === 'object'; });
    state.plugins.forEach(function (plugin) {
      var id = String(plugin.id || '');
      var panel = state.contributionPanels[id];
      var version = typeof plugin.version === 'string' ? plugin.version : '';
      if (panel && (!plugin.enabled || !plugin.installed || panel.version !== version)) delete state.contributionPanels[id];
    });
    Object.keys(state.contributionPanels).forEach(function (id) {
      if (!state.plugins.some(function (plugin) { return String(plugin.id || '') === id; })) delete state.contributionPanels[id];
    });
    state.ready = true;
    state.refreshError = typeof result.refreshError === 'string' ? result.refreshError : '';
    render();
  }

  function readList() {
    var request = ++state.request;
    return call('list', {}).then(function (result) {
      if (request !== state.request) return null;
      acceptList(result);
      return result;
    });
  }

  function refresh() {
    if (state.loading || state.committing) return Promise.resolve(false);
    var request = ++state.request;
    state.loading = true;
    render();
    setMessage(tr('正在检查插件更新…', 'Checking for plugin updates…'), 'pending');
    return call('refresh', {}).then(function (result) {
      if (request !== state.request) return false;
      acceptList(result);
      if (state.refreshError) setMessage(tr('无法检查更新：{error}', 'Could not check for updates: {error}', { error: state.refreshError.slice(0, 300) }), 'error');
      else setMessage(tr('插件列表和更新状态已刷新。', 'Plugin list and update status refreshed.'), 'ok');
      return true;
    }).catch(function (error) {
      if (request !== state.request) return false;
      setMessage(safeError(error, tr('无法检查插件更新。', 'Could not check for plugin updates.')), 'error');
      return false;
    }).then(function (result) {
      state.loading = false;
      render();
      return result;
    });
  }

  function proposalEffects(operation, proposal) {
    if (operation === 'install') return tr('安装后插件默认停用，之后可手动启用。', 'The plugin will be installed disabled. You can enable it afterward.');
    if (operation === 'disable' || operation === 'uninstall') return tr(
      '此操作可能结束插件正在进行的工作。',
      'This action may stop work that is currently running in the plugin.'
    );
    if (operation === 'enable') return tr('确认后将启用此插件。', 'This plugin will be enabled after you confirm.');
    if (operation === 'update' || operation === 'rollback') {
      return proposal.enabled
        ? tr('操作后插件会保持启用。', 'The plugin will remain enabled after this change.')
        : tr('操作后插件会保持停用。', 'The plugin will remain disabled after this change.');
    }
    return '';
  }

  function confirmLabel(operation) {
    var labels = {
      install: ['确认并安装', 'Confirm install'], update: ['确认并更新', 'Confirm update'],
      rollback: ['确认回退', 'Confirm rollback'], enable: ['确认启用', 'Confirm enable'],
      disable: ['确认停用', 'Confirm disable'], uninstall: ['确认卸载', 'Confirm uninstall']
    };
    var label = labels[operation] || labels.install;
    return tr(label[0], label[1]);
  }

  function renderProposal() {
    var current = state.proposal;
    if (!current || !els.dialog) return;
    var proposal = current.proposal;
    var name = typeof proposal.name === 'string' && proposal.name ? proposal.name.slice(0, 160) : current.pluginName;
    els.reviewTitle.textContent = tr('{name} · {operation}', '{name} · {operation}', {
      name: name, operation: operationText(current.operation)
    });
    els.reviewOperation.textContent = operationText(current.operation);
    els.reviewVersion.textContent = typeof proposal.version === 'string' ? proposal.version.slice(0, 80) : tr('不可用', 'Unavailable');
    els.reviewCapabilities.replaceChildren();
    var capabilities = Array.isArray(proposal.capabilities) ? proposal.capabilities.slice(0, 40) : [];
    if (!capabilities.length) {
      els.reviewCapabilities.appendChild(node('li', '', tr('未列出额外功能', 'No additional features listed')));
    } else {
      capabilities.forEach(function (capability) {
        els.reviewCapabilities.appendChild(node('li', '', capabilityText(capability)));
      });
    }
    els.reviewEffect.textContent = proposalEffects(current.operation, proposal);
    els.reviewConfirm.textContent = confirmLabel(current.operation);
    var previous = typeof proposal.previousVersion === 'string' && proposal.previousVersion
      ? tr('当前版本：{version}', 'Current version: {version}', { version: proposal.previousVersion }) : '';
    els.reviewPrevious.textContent = previous;
    els.reviewPrevious.hidden = !previous;
    els.reviewConfirm.disabled = !!state.committing;
    els.reviewCancel.disabled = !!state.committing;
  }

  function openProposal(proposal, operation, plugin) {
    if (!proposal || typeof proposal.token !== 'string' || !proposal.token ||
        proposal.pluginId !== plugin.id || proposal.action !== operation) {
      throw new Error(tr('无法核对待确认的插件操作。', 'Could not verify the prepared plugin action.'));
    }
    state.proposal = {
      proposal: proposal,
      operation: operation,
      pluginId: plugin.id,
      pluginName: pluginName(plugin),
      returnFocus: doc.activeElement
    };
    renderProposal();
    if (typeof els.dialog.showModal === 'function') els.dialog.showModal();
    else throw new Error(tr('此窗口不支持操作确认。', 'This window cannot display the confirmation dialog.'));
  }

  function prepareOperation(pluginId, operation) {
    if (state.action || state.proposal || state.committing) return Promise.resolve(false);
    var plugin = state.plugins.find(function (item) { return item && item.id === pluginId; });
    if (!plugin) return Promise.resolve(false);
    var contributionState = state.contributionPanels[String(pluginId)];
    if (contributionState && (contributionState.loading || contributionState.invoking)) return Promise.resolve(false);
    state.action = { pluginId: pluginId, operation: operation };
    state.cancelRequestedFor = '';
    setMessage(tr('正在准备{operation}操作…', 'Preparing to {operation}…', { operation: operationText(operation).toLocaleLowerCase() }), 'pending');
    render();
    var input = { pluginId: pluginId, operation: operation };
    if ((operation === 'install' || operation === 'update') && typeof plugin.availableVersion === 'string') input.version = plugin.availableVersion;
    return call('prepare', input).then(function (result) {
      var proposal = result && result.proposal;
      if (state.cancelRequestedFor === pluginId) {
        state.cancelRequestedFor = '';
        if (proposal && typeof proposal.token === 'string') return call('discard', { token: proposal.token }).then(function () {
          setMessage(tr('已取消准备，未应用此插件更改。', 'Preparation cancelled. No plugin change was applied.'), 'idle');
          return readList();
        });
        setMessage(tr('已取消准备，未应用此插件更改。', 'Preparation cancelled. No plugin change was applied.'), 'idle');
        return readList();
      }
      openProposal(proposal, operation, plugin);
      setMessage(tr('操作已准备好。请核对版本和所需功能后再确认。', 'The action is ready. Review its version and requested features before confirming.'), 'pending');
      return true;
    }).catch(function (error) {
      if (state.cancelRequestedFor === pluginId) {
        state.cancelRequestedFor = '';
        setMessage(tr('已取消准备，未应用此插件更改。', 'Preparation cancelled. No plugin change was applied.'), 'idle');
        return readList().catch(function () { return null; });
      }
      setMessage(safeError(error, tr('无法准备插件操作。', 'Could not prepare the plugin action.')), 'error');
      return false;
    }).then(function (result) {
      if (state.action && state.action.pluginId === pluginId && state.action.operation === operation) state.action = null;
      render();
      return result;
    });
  }

  function importFromFile() {
    if (state.action || state.proposal || state.committing) return Promise.resolve(false);
    var method = apiMethod('importDesktopPlugin');
    if (!method) return Promise.resolve(false);
    state.action = { operation: 'import-local' };
    setMessage(tr('选择签名目录和安装包，然后在桌面窗口核对安装。', 'Choose the signed catalog and package, then review the installation in the desktop window.'), 'pending');
    render();
    return Promise.resolve().then(function () { return method.call(root.grokbot); }).then(function (result) {
      if (!result || result.ok === false) throw new Error(result && result.message || tr('插件安装未完成。', 'Plugin installation did not complete.'));
      if (result.canceled) setMessage(tr('已取消文件选择。', 'File selection cancelled.'), 'idle');
      else {
        state.request++;
        if (Array.isArray(result.plugins)) acceptList(result);
        setMessage(tr('插件已安装。启用后即可使用。', 'Plugin installed. Enable it to start using it.'), 'ok');
      }
      return true;
    }).catch(function (error) {
      setMessage(safeError(error, tr('插件安装未完成。', 'Plugin installation did not complete.')), 'error');
      return readList().catch(function () { return null; });
    }).then(function (result) { state.action = null; render(); return result; });
  }

  function cancelDownload(pluginId) {
    if (!pluginId || state.cancelRequestedFor === pluginId) return Promise.resolve(false);
    state.cancelRequestedFor = pluginId;
    setMessage(tr('正在取消插件准备…', 'Cancelling plugin preparation…'), 'pending');
    render();
    return call('cancel-download', { pluginId: pluginId }).then(function (result) {
      if (result && Array.isArray(result.plugins)) acceptList(result);
      setMessage(tr('已取消准备，未应用此插件更改。', 'Preparation cancelled. No plugin change was applied.'), 'idle');
      return true;
    }).catch(function (error) {
      state.cancelRequestedFor = '';
      setMessage(safeError(error, tr('无法取消插件准备。', 'Could not cancel plugin preparation.')), 'error');
      return false;
    }).then(function (result) { render(); return result; });
  }

  function closeReview() {
    var current = state.proposal;
    if (els.dialog && els.dialog.open) els.dialog.close();
    state.proposal = null;
    if (current && current.returnFocus && current.returnFocus.isConnected) current.returnFocus.focus({ preventScroll: true });
    render();
  }

  function discardProposal() {
    if (!state.proposal || state.committing) return Promise.resolve(false);
    var current = state.proposal;
    closeReview();
    setMessage(tr('已取消，未应用插件更改。', 'Cancelled. No plugin change was applied.'), 'idle');
    return call('discard', { token: current.proposal.token }).then(function () {
      return readList().catch(function () { return null; });
    }).catch(function (error) {
      setMessage(tr('未提交更改，但待确认操作未能清除：{error}', 'No change was submitted, but the pending action could not be cleared: {error}', {
        error: safeError(error, tr('未知错误', 'Unknown error'))
      }), 'error');
      return false;
    });
  }

  function commitProposal() {
    if (!state.proposal || state.committing) return Promise.resolve(false);
    var current = state.proposal;
    state.committing = true;
    renderProposal();
    setMessage(tr('正在应用已确认的插件操作…', 'Applying the confirmed plugin action…'), 'pending');
    render();
    return call('commit', { token: current.proposal.token }).then(function (result) {
      closeReview();
      state.request++;
      if (result && Array.isArray(result.plugins)) acceptList(result);
      setMessage(tr('插件操作已完成。', 'Plugin action completed.'), 'ok');
      if (!result || !Array.isArray(result.plugins)) return readList().catch(function (error) {
        setMessage(tr('插件操作已完成，但状态刷新失败：{error}', 'Plugin action completed, but its status could not be refreshed: {error}', {
          error: safeError(error, tr('未知错误', 'Unknown error'))
        }), 'error');
      });
      return true;
    }).catch(function (error) {
      // A commit is sent once. A failed or ambiguous response never enables a
      // second click with the same approval token.
      closeReview();
      state.request++;
      setMessage(safeError(error, tr('插件操作未完成。', 'The plugin action did not complete.')), 'error');
      return readList().catch(function () { return null; });
    }).then(function (result) {
      state.committing = false;
      render();
      return result;
    });
  }

  function handleClick(event) {
    var openscreenTarget = event.target && event.target.closest ? event.target.closest('[data-open-screen-operation]') : null;
    if (openscreenTarget && els.root.contains(openscreenTarget) && !openscreenTarget.disabled) {
      var openscreenOperation = openscreenTarget.dataset.openScreenOperation;
      if (openscreenOperation.indexOf('engine-') === 0) {
        openScreenEngineAction(openscreenOperation.slice('engine-'.length));
      } else if (openscreenOperation === 'video-retry-bots') loadOpenScreenBots();
      else if (openscreenOperation === 'video-retry-recordings') loadOpenScreenRecordings(state.openScreen.video.selectedBotId);
      else if (openscreenOperation === 'video-process') processOpenScreenVideo();
      else if (openscreenOperation === 'video-cancel') cancelOpenScreenVideo();
      return;
    }
    var contributionTarget = event.target && event.target.closest ? event.target.closest('[data-plugin-contribution-operation]') : null;
    if (contributionTarget && els.root.contains(contributionTarget) && !contributionTarget.disabled) {
      var contributionOperation = contributionTarget.dataset.pluginContributionOperation;
      var contributionPluginId = contributionTarget.dataset.pluginId || '';
      if (contributionOperation === 'load-contributions') loadContributions(contributionPluginId);
      else if (contributionOperation === 'invoke-contribution') invokeContribution(contributionPluginId);
      else if (contributionOperation === 'open-terminal-entry') {
        var terminalSection = doc.getElementById('superterminal-section');
        if (terminalSection) {
          terminalSection.scrollIntoView({ block: 'center' });
          var terminalTitle = terminalSection.querySelector('h3');
          if (terminalTitle) { terminalTitle.tabIndex = -1; terminalTitle.focus({ preventScroll: true }); }
        }
      }
      return;
    }
    var target = event.target && event.target.closest ? event.target.closest('[data-desktop-plugin-operation]') : null;
    if (!target || !els.root.contains(target) || target.disabled) return;
    var operation = target.dataset.desktopPluginOperation;
    if (operation === 'refresh') { refresh(); return; }
    if (operation === 'import-local') { importFromFile(); return; }
    if (operation === 'cancel-review') { discardProposal(); return; }
    if (operation === 'confirm-review') { commitProposal(); return; }
    var pluginId = target.dataset.pluginId || '';
    if (operation === 'cancel-download') { cancelDownload(pluginId); return; }
    prepareOperation(pluginId, operation);
  }

  function handleOpenScreenChange(event) {
    var target = event.target;
    if (!target || !target.dataset || !target.dataset.openScreenField) return;
    var video = state.openScreen.video;
    if (target.dataset.openScreenField === 'bot') {
      loadOpenScreenRecordings(target.value);
    } else if (target.dataset.openScreenField === 'recording') {
      video.selectedRecordingId = target.value || '';
      video.feedback = '';
      video.error = '';
      render();
    } else if (target.dataset.openScreenField === 'captions') {
      video.captions = !!target.checked;
      render();
    }
  }

  function handleOpenScreenInput(event) {
    var target = event.target;
    if (!target || !target.dataset || target.dataset.openScreenField !== 'annotation') return;
    state.openScreen.video.annotation = String(target.value || '').slice(0, 500);
  }

  function handleContributionChange(event) {
    var target = event.target;
    if (!target || !target.dataset || !target.dataset.contributionField) return;
    var pluginId = target.dataset.pluginId || '';
    var plugin = state.plugins.find(function (item) { return item && item.id === pluginId; });
    if (!plugin) return;
    var panel = contributionPanel(plugin);
    if (target.dataset.contributionField === 'contribution') {
      panel.contributionId = target.value;
      panel.paramsText = '{}';
      panel.hasResult = false;
      panel.message = '';
      panel.error = '';
    } else if (target.dataset.contributionField === 'bot') {
      panel.botId = target.value;
      panel.error = '';
    }
    render();
  }

  function handleContributionInput(event) {
    var target = event.target;
    if (!target || !target.dataset || target.dataset.contributionField !== 'params') return;
    var pluginId = target.dataset.pluginId || '';
    var plugin = state.plugins.find(function (item) { return item && item.id === pluginId; });
    if (!plugin) return;
    var panel = contributionPanel(plugin);
    panel.paramsText = target.value;
    panel.error = '';
    var parsed = parseInputObject(panel.paramsText);
    var invocationBlocked = panel.blockedInvocationKey === invocationKey(pluginId, panel);
    var index = state.plugins.indexOf(plugin);
    var note = doc.getElementById('desktop-plugin-params-note-' + index);
    if (note) {
      note.textContent = parsed.error || (invocationBlocked ? tr(
        '上次调用未完成。为避免重复执行，请先核对结果或调整参数。',
        'The last call did not complete. Check its result or change parameters before running it again.'
      ) : tr(
        '插件会按此功能声明的参数格式校验。执行时桌面版会另行确认。',
        'The plugin checks parameters against this feature’s schema. The desktop app will ask for confirmation before running it.'
      ));
      if (parsed.error || invocationBlocked) note.dataset.state = 'error'; else delete note.dataset.state;
    }
    var run = doc.getElementById('desktop-plugin-run-' + index);
    if (run) run.disabled = panel.invoking || !panel.botId || !!parsed.error || invocationBlocked;
  }

  function createDialog() {
    var dialog = node('dialog', 'desktop-plugin-review');
    dialog.id = 'desktop-plugin-review';
    dialog.setAttribute('aria-labelledby', 'desktop-plugin-review-title');
    dialog.setAttribute('aria-describedby', 'desktop-plugin-review-effect');
    var header = node('header', 'desktop-plugin-review-header');
    els.reviewTitle = node('h2', '', tr('核对插件操作', 'Review plugin action'));
    els.reviewTitle.id = 'desktop-plugin-review-title';
    var close = node('button', 'desktop-plugin-review-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', tr('取消操作', 'Cancel action'));
    close.dataset.desktopPluginOperation = 'cancel-review';
    append(header, els.reviewTitle, close);

    var details = node('dl', 'desktop-plugin-review-details');
    details.appendChild(node('dt', '', tr('操作', 'Action')));
    els.reviewOperation = node('dd', '');
    details.appendChild(els.reviewOperation);
    details.appendChild(node('dt', '', tr('目标版本', 'Target version')));
    els.reviewVersion = node('dd', '');
    details.appendChild(els.reviewVersion);
    els.reviewPrevious = node('p', 'desktop-plugin-review-previous');

    var capabilityHeading = node('h3', '', tr('所需功能', 'Requested features'));
    els.reviewCapabilities = node('ul', 'desktop-plugin-capabilities');
    els.reviewEffect = node('p', 'desktop-plugin-review-effect');
    els.reviewEffect.id = 'desktop-plugin-review-effect';
    var actions = node('footer', 'desktop-plugin-review-actions');
    els.reviewCancel = button(tr('取消', 'Cancel'), 'cancel-review', '');
    els.reviewConfirm = button(tr('确认', 'Confirm'), 'confirm-review', '', 'primary');
    append(actions, els.reviewCancel, els.reviewConfirm);
    append(dialog, header, details, els.reviewPrevious, capabilityHeading, els.reviewCapabilities, els.reviewEffect, actions);
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      discardProposal();
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog && !state.committing) discardProposal();
    });
    return dialog;
  }

  function build() {
    if (!doc || state.initialized) return state.initialized;
    els.root = doc.getElementById('desktop-plugins-root');
    if (!els.root) return false;
    state.initialized = true;
    els.root.replaceChildren();

    var header = node('header', 'desktop-plugins-header');
    var icon = node('span', 'desktop-plugins-icon');
    icon.setAttribute('aria-hidden', 'true');
    var svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    var paths = ['M7 4.5h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z', 'M9 9l2.5 2.5L9 14', 'M13 14h3'];
    paths.forEach(function (path) { var shape = doc.createElementNS('http://www.w3.org/2000/svg', 'path'); shape.setAttribute('d', path); svg.appendChild(shape); });
    icon.appendChild(svg);
    var heading = node('div', 'desktop-plugins-heading');
    var titleRow = node('div', 'desktop-plugins-title-row');
    var title = node('h3', '', tr('桌面插件', 'Desktop plugins'));
    els.refresh = button(tr('检查更新', 'Check for updates'), 'refresh', '', 'desktop-plugins-refresh');
    els.importFile = button(tr('从文件安装', 'Install from file'), 'import-local', '', 'desktop-plugins-refresh');
    els.importFile.id = 'desktop-plugin-import-file';
    els.importFile.hidden = !apiMethod('importDesktopPlugin');
    append(titleRow, title, els.importFile, els.refresh);
    var description = node('p', 'desktop-plugins-description', tr(
      '管理桌面版插件及其版本。安装前会显示版本和所需功能供你确认。',
      'Manage desktop plugins and their versions. Review the version and requested features before installing.'
    ));
    append(heading, titleRow, description);
    append(header, icon, heading);
    els.message = node('p', 'desktop-plugins-message');
    els.message.id = 'desktop-plugins-message';
    els.message.setAttribute('role', 'status');
    els.message.setAttribute('aria-live', 'polite');
    els.message.setAttribute('aria-atomic', 'true');
    els.list = node('div', 'desktop-plugins-list');
    els.dialog = createDialog();
    append(els.root, header, els.message, els.list, els.dialog);
    els.root.addEventListener('click', handleClick);
    els.root.addEventListener('change', handleContributionChange);
    els.root.addEventListener('change', handleOpenScreenChange);
    els.root.addEventListener('input', handleContributionInput);
    els.root.addEventListener('input', handleOpenScreenInput);
    setMessage(tr('打开此页时读取插件列表。', 'Plugin list will load when this section opens.'), 'idle');

    var panel = doc.getElementById('set-panel-apps');
    if (panel && typeof root.MutationObserver === 'function') {
      state.observer = new root.MutationObserver(function () {
        if (!panel.hidden) loadOpenScreenResources();
        if (!panel.hidden && !state.ready && !state.loading) readList().then(function () {
          setMessage(tr('插件列表已读取。', 'Plugin list loaded.'), 'ok');
        }).catch(function (error) {
          setMessage(safeError(error, tr('无法读取插件列表。', 'Could not read the plugin list.')), 'error');
        });
        else if (!panel.hidden && state.ready) refreshIfStale();
      });
      state.observer.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    }
    var subscribe = apiMethod('onDesktopPluginChanged');
    if (subscribe) {
      try {
        state.unsubscribe = subscribe.call(root.grokbot, function () {
          if (!panel || !panel.hidden) readList().catch(function () {});
        });
      } catch (_) { state.unsubscribe = null; }
    }
    return true;
  }

  function refreshIfStale() {
    if (!state.ready || state.loading || state.proposal || state.committing) return;
    readList().catch(function () {});
  }

  function start() {
    Promise.resolve(root.OpenBotI18n && root.OpenBotI18n.ready).then(function () {
      if (!build()) return;
      var panel = doc.getElementById('set-panel-apps');
      if (panel && !panel.hidden) {
        loadOpenScreenResources();
        readList().then(function () { setMessage(tr('插件列表已读取。', 'Plugin list loaded.'), 'ok'); }).catch(function (error) {
          setMessage(safeError(error, tr('无法读取插件列表。', 'Could not read the plugin list.')), 'error');
        });
      }
    });
  }

  var api = Object.freeze({ build: build, refresh: refresh, readList: readList, render: render });
  root.OpenBotDesktopPlugins = api;
  if (doc) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
})(window);
