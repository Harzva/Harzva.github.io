/* Per-Bot executor switching for the native chat header. */
(function (root) {
  'use strict';

  var callbacks = {};
  var bridge = null;
  var observer = null;
  var initialized = false;
  var composerTrigger = null;
  var openerTrigger = null;
  var overlay = null;
  var dialog = null;
  var els = {};
  var opened = false;
  var expectedOwner = null;
  var epoch = 0;
  var botId = '';
  var catalog = [];
  var defaultExecutorId = '';
  var snapshot = null;
  var selectedId = '';
  var selectedTransport = '';
  var modelDrafts = Object.create(null);
  var apiModelCache = Object.create(null);
  var apiModelSequence = 0;
  var apiModelIdentityKey = '';
  var apiModelsMaxAge = 45000;
  var apiSourceDraft = '';
  var planModelDrafts = Object.create(null);
  var planModelCache = Object.create(null);
  var planHomeInfo = null;
  var activeOptionId = '';
  var loading = false;
  var reloadPending = false;
  var actionBusy = false;
  var actionError = '';
  var actionNotice = '';
  var acpConfiguration = null;
  var acpConfigurationContext = '';
  var acpConfigurationLoading = false;
  var acpInitializationBusy = false;
  var acpOperationKind = '';
  var acpAuthMethodId = '';
  var acpConfigurationError = '';
  var acpConfigurationErrorKind = '';
  var acpConfigurationSequence = 0;
  var acpOperationContext = null;
  var acpStopBusy = false;
  var acpStopRequested = false;
  var acpStopError = '';
  var acpNotice = '';
  var reviewRunId = null;
  var subscribed = false;
  var apiModelsConfigSubscribed = false;
  var planIndicator = null;
  var planIndicatorLabel = null;
  var planUsageButton = null;
  var planCancelButton = null;
  var planIndicatorKey = '';
  var planIndicatorRequest = 0;
  var planIndicatorPending = '';
  var planIndicatorBusy = false;
  var planIndicatorSubscribed = false;

  var logoFiles = {
    dsh: 'dsh.svg', pi: 'pi.svg', legacy: 'legacy.svg', codex: 'codex.svg',
    claude: 'claude.svg', gemini: 'gemini.svg', kimi: 'kimi.svg', qwen: 'qwen.svg',
    grok: 'grok.svg', agy: 'agy.svg', opencode: 'opencode.svg',
    'cursor-agent': 'cursor-agent.svg', goose: 'goose.svg', copilot: 'copilot.svg',
    amp: 'amp.svg', aider: 'aider.png', codebuddy: 'codebuddy.svg', cline: 'cline.svg'
  };

  var shortNames = {
    dsh: 'DeepSeek', pi: 'Pi', legacy: 'Bot Studio',
    codex: 'Codex', claude: 'Claude', gemini: 'Gemini', kimi: 'Kimi', qwen: 'Qwen',
    grok: 'Grok', agy: 'Antigravity', opencode: 'OpenCode',
    'cursor-agent': 'Cursor', goose: 'Goose', copilot: 'Copilot', amp: 'Amp',
    aider: 'Aider', codebuddy: 'CodeBuddy', workbuddy: 'WorkBuddy', cline: 'Cline'
  };

  function t(zh, en, params) {
    return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en, params) : (root.document.documentElement.lang === 'en' ? en : zh);
  }

  function tokenCount(value) {
    if (!Number.isSafeInteger(value) || value <= 0) return '';
    if (value >= 1000000) return (value / 1000000).toFixed(value % 1000000 ? 1 : 0) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(value % 1000 ? 1 : 0) + 'K';
    return String(value);
  }

  function capabilitySourceLabel(source) {
    if (source === 'local-override') return t('本地覆盖', 'local override');
    if (source === 'provider-catalog') return t('目录', 'catalog');
    if (source === 'codex-catalog') return t('Codex 目录', 'Codex catalog');
    if (source === 'builtin-catalog') return t('内置目录', 'built-in catalog');
    return t('未知', 'unknown');
  }

  function modelCapabilitySummary(item) {
    var window = tokenCount(item && item.contextWindowTokens);
    var output = tokenCount(item && item.maxOutputTokens);
    if (!window) return t('窗口未知 · 字符回退', 'window unknown · character fallback');
    return t('窗口 {window} · 输出 {output} · {source}', 'window {window} · output {output} · {source}', {
      window: window, output: output || t('未知', 'unknown'), source: capabilitySourceLabel(item && item.capabilitySource)
    });
  }

  function make(tag, className, text) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function callResult(promise) {
    return Promise.resolve(promise).then(function (result) {
      if (!result || result.ok !== true) {
        var error = new Error(result && result.message || t('请求未完成，请重试。', 'The request did not complete. Try again.'));
        error.code = result && result.code || 'EXECUTOR_REQUEST_FAILED';
        throw error;
      }
      return result;
    });
  }

  function activeBot() {
    try { return callbacks.getActiveBot ? callbacks.getActiveBot() : null; }
    catch (_) { return null; }
  }

  function executorIdForBot(bot) {
    if (!bot) return '';
    if (bot.executorBinding && typeof bot.executorBinding.executorId === 'string' && bot.executorBinding.executorId) {
      return bot.executorBinding.executorId;
    }
    return bot.agent && bot.agent.id ? 'agent:' + String(bot.agent.id) : String(bot.harness || 'dsh');
  }

  function isAguiExecutorId(id) {
    return /^agui:[a-f0-9]{16}$/.test(String(id || ''));
  }

  function aguiRequiresLocalExecutor(row) {
    var bot = activeBot();
    return !!(row && isAguiExecutorId(row.id) && bot && bot.executionLocation === 'node');
  }

  function aguiNodeLocationMessage() {
    return t('请先结束或核查此 Bot 的节点工作，在“任务与屏幕位置”切回本机，再切换到 AG-UI。',
      'Finish or review this Bot’s Node work, return it to This Mac in Task and screen location, then switch to AG-UI.');
  }

  function brandForId(id) {
    if (id && id.indexOf('agent:') === 0) return id.slice(6);
    return id || 'generic';
  }

  function logoFileForId(id) {
    return logoFiles[brandForId(id)] || 'generic.svg';
  }

  function logoElement(id, className) {
    var frame = make('span', className || 'ob-executor-switch-logo');
    var brand = brandForId(id);
    frame.dataset.brand = brand;
    frame.setAttribute('aria-hidden', 'true');
    var img = root.document.createElement('img');
    img.alt = '';
    img.width = 24;
    img.height = 24;
    img.decoding = 'async';
    var darkSource = null;
    if (brand === 'workbuddy') {
      var picture = root.document.createElement('picture');
      darkSource = root.document.createElement('source');
      darkSource.media = '(prefers-color-scheme: dark)';
      darkSource.srcset = 'assets/agent-hud/workbuddy-dark.png';
      picture.appendChild(darkSource);
      img.src = 'assets/agent-hud/workbuddy-light.png';
      picture.appendChild(img);
      frame.appendChild(picture);
    } else {
      img.src = 'assets/agent-logos/' + logoFileForId(id);
      frame.appendChild(img);
    }
    img.addEventListener('error', function () {
      if (!img.dataset.fallback) {
        img.dataset.fallback = 'true';
        if (darkSource) darkSource.removeAttribute('srcset');
        img.src = 'assets/agent-logos/generic.svg';
      } else {
        img.remove();
        if (!frame.querySelector('[data-visual-fallback]')) frame.insertAdjacentHTML('beforeend', '<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>');
      }
    });
    return frame;
  }

  function executorName(id, bot) {
    var entry = catalog.find(function (row) { return row.id === id; });
    if (entry && entry.name) return entry.name;
    if (isAguiExecutorId(id)) return t('外部 AG-UI', 'External AG-UI');
    if (id && id.indexOf('agent:') === 0) {
      var key = id.slice(6);
      return bot && bot.agent && bot.agent.name || shortNames[key] || key.replace(/[-_]/g, ' ');
    }
    return shortNames[id] || id || t('执行器', 'Executor');
  }

  var builtInCodexCliDescription = '一次性 exec 调用，使用 Codex workspace-write 沙箱；批准策略沿用本机配置';
  var catalogDescriptionCopy = {
    dsh: ['默认执行器', 'Default executor'],
    pi: ['可选执行器', 'Optional executor'],
    legacy: ['原有工具循环', 'Original tool loop'],
    'agent:codex': ['App Server 使用 Home 持续会话；Codex CLI 为一次性调用。',
      'App Server: persistent Home session; Codex CLI: one-shot calls.'],
    'agent:claude': ['Anthropic 官方编码 CLI，stream-json 事件流；权限由该 CLI 自身配置管理',
      'Official Anthropic coding CLI with stream-json events; permissions follow the CLI configuration'],
    'agent:gemini': ['Google 开源 CLI；此预设使用一次性命令行调用；权限由该 CLI 自身配置管理',
      'Google open-source CLI; this preset uses one-shot calls; permissions follow the CLI configuration'],
    'agent:kimi': ['Kimi Code；新建 Bot 默认公开 ACP，保留原 CLI 入口；权限由该 CLI 自身配置管理',
      'Kimi Code; new Bots default to public ACP, while the original CLI entry point remains available; permissions follow the CLI configuration'],
    'agent:qwen': ['通义千问智能体；新绑定默认 ACP，兼容原 CLI 入口；权限由该 CLI 自身配置管理',
      'Qwen agent; new bindings default to ACP, with the original CLI entry point retained; permissions follow the CLI configuration'],
    'agent:grok': ['Grok 构建型 CLI；输出解析兼容部分 JSON 事件，未声明 ACP；权限由该 CLI 自身配置管理',
      'Grok coding CLI; output parsing supports some JSON events, and ACP is not declared; permissions follow the CLI configuration'],
    'agent:agy': ['Google Antigravity 命令行智能体，使用 agy 启动；权限由该 CLI 自身配置管理',
      'Google Antigravity CLI, launched with agy; permissions follow the CLI configuration'],
    'agent:pi': ['pi-coding-agent，非交互 -p + json 输出；权限由该 CLI 自身配置管理',
      'pi-coding-agent with noninteractive -p and JSON output; permissions follow the CLI configuration'],
    'agent:opencode': ['开源编码智能体，可起 ACP 服务；权限由该 CLI 自身配置管理',
      'Open-source coding agent with ACP server support; permissions follow the CLI configuration'],
    'agent:cursor-agent': ['Cursor 的命令行智能体；权限由该 CLI 自身配置管理',
      'Cursor command-line agent; permissions follow the CLI configuration'],
    'agent:goose': ['Block 开源智能体；此预设使用一次性命令行调用；权限由该 CLI 自身配置管理',
      'Block open-source agent; this preset uses one-shot calls; permissions follow the CLI configuration'],
    'agent:copilot': ['GitHub Copilot 的命令行智能体；权限由该 CLI 自身配置管理',
      'GitHub Copilot command-line agent; permissions follow the CLI configuration'],
    'agent:amp': ['Sourcegraph 的终端智能体；权限由该 CLI 自身配置管理',
      'Sourcegraph terminal agent; permissions follow the CLI configuration'],
    'agent:aider': ['老牌结对编程 CLI，一问一答模式；权限由该 CLI 自身配置管理',
      'Pair-programming CLI using one-shot question and answer calls; permissions follow the CLI configuration'],
    'agent:codebuddy': ['腾讯 CodeBuddy 命令行智能体，通过公开 ACP 协议接入；不是 WorkBuddy 桌面；权限由该 CLI 自身配置管理',
      'Tencent CodeBuddy CLI via public ACP; separate from WorkBuddy Desktop. Permissions follow the CLI configuration'],
    'agent:workbuddy': ['使用 WorkBuddy App 配套执行器和原生登录，通过 ACP 执行任务；权限由该 CLI 自身配置管理',
      'WorkBuddy Desktop via its companion executor and native sign-in over ACP; permissions follow its native configuration'],
    'agent:cline': ['Cline CLI，通过公开 ACP 接入；权限由该 CLI 自身配置管理',
      'Cline CLI via public ACP; permissions follow the CLI configuration']
  };

  function executorDescription(row) {
    var description = row && typeof row.description === 'string' ? row.description : '';
    var copy = row && catalogDescriptionCopy[row.id];
    var isEnglish = root.OpenBotI18n
      ? root.OpenBotI18n.locale === 'en'
      : root.document.documentElement.lang === 'en';
    // Localize only exact built-in catalog copy; native/custom executor
    // descriptions remain exactly as supplied by their catalog entry.
    if (row && row.id === 'agent:codex' && description === builtInCodexCliDescription && copy) {
      return isEnglish ? copy[1] : copy[0];
    }
    return isEnglish && copy && description === copy[0] ? copy[1] : description;
  }

  function harnessLabels(row) {
    var transports = row && row.transports || {};
    var labels = [];
    if (transports.appserver) labels.push('App Server');
    if (transports.cli) labels.push('CLI');
    if (transports.acp) labels.push('ACP');
    if (transports.api) labels.push('API');
    if (transports.agui) labels.push('AG-UI');
    return labels;
  }

  function modelSourceText(row) {
    if (!row) return '';
    if (row.kind === 'api') return t('模型来自下方所选连接', 'Models come from the connection selected below');
    if (row.kind === 'agui') return t('模型来源：远端 AG-UI 配置', 'Models: remote AG-UI configuration');
    var sources = [];
    if (row.transports && row.transports.appserver) sources.push(t('Codex 目录', 'Codex catalog'));
    if (row.transports && row.transports.acp) sources.push(t('ACP 协商', 'ACP negotiation'));
    if (row.transports && row.transports.cli) sources.push(t('CLI 默认/参数', 'CLI default/flag'));
    return sources.length
      ? t('模型来源：{sources}', 'Models: {sources}', { sources: sources.join(' · ') })
      : t('模型来源：未知', 'Models: unknown');
  }

  function apiInventory(row) {
    var context = apiModelContextFor(row);
    var record = context && apiModelCache[context.key];
    if (record && Array.isArray(record.models) && record.models.length) {
      return { models: record.models, status: record.status || 'cached' };
    }
    return null;
  }

  function modelInventory(row) {
    var known = row.kind === 'api' ? apiInventory(row) : null;
    if (known && known.models.length) {
      var names = known.models.map(function (item) {
        return item && (item.name || item.id) || '';
      }).filter(Boolean);
      var title = names.join('、');
      var shown = names.slice(0, 3).join('、');
      var count = names.length;
      var prefix = known.status === 'live' || known.status === 'ready'
        ? t('可获取模型：{models}', 'Models available: {models}', { models: shown })
        : t('已缓存模型：{models}', 'Cached models: {models}', { models: shown });
      return {
        text: prefix + (count > 3 ? t(' 等 {count} 个', ' + {count} total', { count: count }) : ''),
        title: t('可获取模型（{count}）：{models}', 'Available models ({count}): {models}', { count: count, models: title }),
        state: known.status === 'live' || known.status === 'ready' ? 'available' : 'cached'
      };
    }
    if (row.kind === 'api') {
      return { text: t('模型状态：未知 · 选择后读取当前 API 连接', 'Models: unknown · read from this API connection after selecting'),
        title: t('当前执行器还没有读取模型列表', 'This executor has not read its model list yet'), state: 'unknown' };
    }
    if (row.kind === 'agui') {
      return { text: t('模型状态：由远端 AG-UI 配置管理', 'Models: managed by the remote AG-UI configuration'),
        title: t('Bot Studio 不读取远端 AG-UI 的模型列表', 'Bot Studio does not read the remote AG-UI model list'), state: 'unknown' };
    }
    if (row.transports && row.transports.appserver) {
      return { text: t('模型状态：未知 · 需 Codex 登录后读取目录', 'Models: unknown · read the catalog after Codex sign-in'),
        title: t('Codex 模型目录尚未读取', 'The Codex model catalog has not been read'), state: 'unknown' };
    }
    if (row.transports && row.transports.acp) {
      return { text: t('模型状态：未知 · 由 ACP 协商获取', 'Models: unknown · discovered through ACP negotiation'),
        title: t('ACP 模型列表在选中并建立会话后读取', 'The ACP model list is read after selecting and establishing a session'), state: 'unknown' };
    }
    return { text: t('模型状态：使用 CLI 默认模型', 'Models: CLI default'),
      title: t('此执行器由 CLI 自身选择默认模型', 'This executor uses the model selected by its CLI'), state: 'unknown' };
  }

  function makeTrigger() {
    var button = make('button', 'ob-executor-switch-trigger ob-executor-switch-trigger-composer');
    button.type = 'button';
    button.dataset.executorSwitchTrigger = 'true';
    button.dataset.executorSwitchScope = 'composer';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'ob-executor-switch-overlay');
    button.setAttribute('aria-expanded', 'false');
    var logo = make('span', 'ob-executor-switch-trigger-logo');
    var name = make('span', 'ob-executor-switch-trigger-name');
    var chevron = make('span', 'ob-executor-switch-trigger-chevron');
    chevron.setAttribute('aria-hidden', 'true');
    button.appendChild(logo);
    button.appendChild(name);
    button.appendChild(chevron);
    button.addEventListener('click', function () { open(button); });
    return button;
  }

  function applyTrigger(element, bot) {
    if (!element || !bot) return '';
    var id = executorIdForBot(bot);
    var name = executorName(id, bot);
    var label = t('执行器：{name}', 'Executor: {name}', { name: name });
    var key = id + '|' + name;
    if (element.dataset.executorSwitchKey !== key) {
      var logoWrap = element.querySelector('.ob-executor-switch-trigger-logo');
      logoWrap.replaceChildren(logoElement(id, 'ob-executor-switch-logo'));
      element.querySelector('.ob-executor-switch-trigger-name').textContent = shortNames[brandForId(id)] || name;
      element.setAttribute('aria-label', label);
      element.title = t('此 Bot 的执行器设置：{name}', 'This Bot’s executor settings: {name}', { name: name });
      element.dataset.executorSwitchKey = key;
    }
    element.setAttribute('aria-expanded', opened ? 'true' : 'false');
    return key;
  }

  function updateTrigger(bot) {
    if (!bot) return;
    if (composerTrigger) applyTrigger(composerTrigger, bot);
  }

  function mountTrigger(bot) {
    if (!bot || typeof bridge.inspectExecutor !== 'function' || typeof bridge.switchExecutor !== 'function') return;
    if (bot.executionLocation === 'node') {
      // A node Bot uses the executor configured on its node. The local switch
      // only changes this machine's binding; change the execution location
      // through Settings before offering local executor choices.
      if (composerTrigger && composerTrigger.isConnected) composerTrigger.remove();
      composerTrigger = null;
      return;
    }
    var composerMount = root.document.getElementById('composer-executor-mount');
    if (composerMount) {
      if (!composerTrigger || !composerTrigger.isConnected) {
        composerTrigger = makeTrigger();
      }
      if (composerTrigger.parentElement !== composerMount) composerMount.appendChild(composerTrigger);
    } else if (composerTrigger && composerTrigger.isConnected) {
      composerTrigger.remove();
      composerTrigger = null;
    }
    updateTrigger(bot);
  }

  function planHomeIdForBot(bot) {
    var binding = bot && bot.executorBinding || {};
    var transport = binding.transport || bot && bot.agent && bot.agent.transport || '';
    if (!bot || executorIdForBot(bot) !== 'agent:codex' || transport !== 'appserver') return '';
    return String(binding.codexHomeId || bot.agent && bot.agent.codexHomeId || '');
  }

  function planHomeIdForSelection(row, transport) {
    var binding = snapshot && snapshot.binding;
    if (!row || row.id !== 'agent:codex' || transport !== 'appserver' || !binding ||
        binding.executorId !== row.id || binding.transport !== 'appserver') return '';
    return String(binding.codexHomeId || '');
  }

  function planContextKey(homeId, accountId) {
    return String(homeId || '') + '|' + String(accountId || '');
  }

  function planContextForSelection(row, transport) {
    var homeId = planHomeIdForSelection(row, transport);
    if (!homeId) return null;
    if (!bridge || typeof bridge.multiCodexHomeAction !== 'function') return null;
    var info = planHomeInfo && planHomeInfo.homeId === homeId ? planHomeInfo : null;
    if (!info) return { homeId: homeId, loading: true, authKind: 'checking' };
    if (info.planLogin && ['awaiting-browser', 'finishing'].includes(info.planLogin.status)) {
      return { homeId: homeId, authKind: 'pending', loading: false, planLogin: info.planLogin };
    }
    if (info.authKind === 'native-codex') return null;
    if (info.authKind === 'chatgpt-plan') {
      var account = info.account || null;
      return {
        homeId: homeId,
        account: account,
        accountId: account && account.id || '',
        authKind: 'chatgpt-plan',
        available: info.planAvailable === true,
        enabled: info.planAvailable === true && !!account && account.status === 'connected' &&
          account.requiresSignIn !== true && account.planEnabled === true,
        status: account && account.status || '',
        loading: false
      };
    }
    return { homeId: homeId, authKind: 'unavailable', loading: false };
  }

  function currentPlanModelContext() {
    var row = selectedRow();
    var context = planContextForSelection(row, selectedTransport);
    return context && context.authKind === 'chatgpt-plan' && context.enabled
      ? context : null;
  }

  function planModelCacheFor(context) {
    if (!context || !context.accountId) return null;
    return planModelCache[planContextKey(context.homeId, context.accountId)] || null;
  }

  function planModelDraftKey(context) {
    return context ? planContextKey(context.homeId, context.accountId) : '';
  }

  function refreshBoundPlanModels() {
    var context = currentPlanModelContext();
    if (!context || !context.homeId || !context.accountId || !bridge ||
        typeof bridge.multiCodexHomeAction !== 'function') return;
    var key = planContextKey(context.homeId, context.accountId);
    var record = planModelCache[key] || { models: null, loading: false, error: '' };
    if (record.loading) return;
    record.loading = true;
    record.error = '';
    planModelCache[key] = record;
    var request = (record.request || 0) + 1;
    record.request = request;
    renderSettings();
    Promise.resolve().then(function () {
      return bridge.multiCodexHomeAction({ action: 'planModels', input: { homeId: context.homeId } });
    }).then(function (result) {
      if (!result || result.ok !== true || !Array.isArray(result.models)) {
        throw new Error(result && (result.message || result.code) || 'CHATGPT_MODEL_LIST_INVALID');
      }
      var models = result.models.filter(function (item) {
        return item && typeof item.id === 'string' && item.id && typeof item.name === 'string' && item.name;
      });
      if (record.request !== request) return;
      record.models = models;
      record.error = '';
    }).catch(function (error) {
      if (record.request !== request) return;
      record.error = String(error && error.message || 'CHATGPT_MODEL_LIST_FAILED');
    }).finally(function () {
      if (record.request !== request) return;
      record.loading = false;
      renderSettings();
      if (els.submit) els.submit.disabled = !canSwitchCurrent();
    });
  }

  function onPlanModelChange() {
    var context = currentPlanModelContext();
    var record = planModelCacheFor(context);
    var value = String(els.planModelSelect && els.planModelSelect.value || '');
    if (!context || !record || !Array.isArray(record.models) ||
        (value && !record.models.some(function (item) { return item.id === value; }))) return;
    planModelDrafts[planModelDraftKey(context)] = value;
    renderStatus();
    if (els.submit) els.submit.disabled = !canSwitchCurrent();
  }

  function setPlanIndicator(message, state, hasAccount, pending) {
    if (!planIndicator || !planIndicatorLabel) return;
    planIndicator.hidden = false;
    planIndicator.dataset.state = state || 'idle';
    planIndicatorLabel.textContent = message || '';
    if (planUsageButton) {
      planUsageButton.hidden = !hasAccount;
      planUsageButton.disabled = planIndicatorBusy;
      planUsageButton.textContent = t('管理用量', 'Manage usage');
    }
    if (planCancelButton) {
      planCancelButton.hidden = !pending;
      planCancelButton.disabled = planIndicatorBusy;
      planCancelButton.textContent = t('取消登录', 'Cancel sign-in');
    }
  }

  function planIdentity(account) { return account && (account.label || account.email) || ''; }

  function updatePlanIndicator(bot, force) {
    planIndicator = root.document.getElementById('chat-plan-usage');
    planIndicatorLabel = root.document.getElementById('chat-plan-usage-label');
    planUsageButton = root.document.getElementById('chat-plan-usage-manage');
    planCancelButton = root.document.getElementById('chat-plan-usage-cancel');
    if (!planIndicator || !planIndicatorLabel) return;
    if (!callbacks.isChatView || callbacks.isChatView() !== true) {
      var hadPlan = !!planHomeInfo;
      planIndicatorRequest += 1;
      planIndicatorKey = '';
      planIndicatorPending = '';
      planHomeInfo = null;
      planIndicator.hidden = true;
      if (opened && hadPlan) render();
      return;
    }
    var homeId = planHomeIdForBot(bot);
    if (!homeId || !bridge || typeof bridge.multiCodexHomeAction !== 'function') {
      var clearedPlan = !!planHomeInfo;
      planIndicatorRequest += 1;
      planIndicatorKey = '';
      planIndicatorPending = '';
      planHomeInfo = null;
      planIndicator.hidden = true;
      if (opened && clearedPlan) render();
      return;
    }
    var key = String(bot.id) + '|' + homeId;
    if (!force && key === planIndicatorKey && (planIndicatorPending === key ||
        (planHomeInfo && planHomeInfo.homeId === homeId))) return;
    planIndicatorKey = key;
    planIndicatorPending = key;
    var request = ++planIndicatorRequest;
    setPlanIndicator(t('正在读取 ChatGPT 订阅状态…', 'Checking ChatGPT subscription status…'), 'idle', false, false);
    Promise.resolve().then(function () {
      return bridge.multiCodexHomeAction({ action: 'status', input: {} });
    }).then(function (result) {
      if (request !== planIndicatorRequest || planIndicatorKey !== key) return;
      if (!result || result.ok !== true || !result.status) {
        planHomeInfo = { homeId: homeId, authKind: 'unavailable' };
        setPlanIndicator(t('无法读取此 Home 的认证状态。', 'Could not read this Home’s authentication status.'), 'error', false, false);
        if (opened) render();
        return;
      }
      var home = (result.status.homes || []).find(function (item) { return item && item.id === homeId; });
      if (!home) {
        planHomeInfo = { homeId: homeId, authKind: 'unavailable' };
        setPlanIndicator(t('订阅状态不可用；不会改用原生账号。', 'Subscription status is unavailable; native account sign-in is not a fallback.'), 'error', false, false);
        if (opened) render();
        return;
      }
      var loginPending = !!home.planLogin && ['awaiting-browser', 'finishing'].includes(home.planLogin.status);
      if (home.authKind !== 'chatgpt-plan') {
        planHomeInfo = { homeId: homeId, authKind: home.authKind || 'native-codex', planLogin: home.planLogin || null };
        if (loginPending) {
          setPlanIndicator(home.planLogin.status === 'finishing'
            ? t('正在完成 ChatGPT 授权…', 'Finishing ChatGPT authorization…')
            : t('等待在浏览器中完成 ChatGPT 登录。', 'Waiting for ChatGPT sign-in in your browser.'), 'pending', false, true);
        } else if (home.authKind === 'unavailable') {
          setPlanIndicator(t('订阅状态不可用；不会改用原生账号。', 'Subscription status is unavailable; native account sign-in is not a fallback.'), 'error', false, false);
        } else {
          planIndicator.hidden = true;
        }
        if (opened) render();
        return;
      }
      if (!result.status.plan || result.status.plan.available !== true) {
        planHomeInfo = { homeId: homeId, authKind: 'unavailable', planLogin: home.planLogin || null };
        setPlanIndicator(t('订阅状态不可用；不会改用原生账号。', 'Subscription status is unavailable; native account sign-in is not a fallback.'), 'error', false, false);
        if (opened) render();
        return;
      }
      var account = home.planAccount || null;
      var pending = loginPending;
      planHomeInfo = {
        homeId: homeId,
        authKind: 'chatgpt-plan',
        account: account,
        planLogin: home.planLogin || null,
        planAvailable: !!(result.status.plan && result.status.plan.available === true)
      };
      var message;
      var state = 'idle';
      if (pending) {
        message = home.planLogin.status === 'finishing'
          ? t('正在完成 ChatGPT 授权…', 'Finishing ChatGPT authorization…')
          : t('等待在浏览器中完成 ChatGPT 登录。', 'Waiting for ChatGPT sign-in in your browser.');
        state = 'pending';
      } else if (!account) {
        message = t('此 Home 尚未关联 ChatGPT 账号。', 'No ChatGPT account is associated with this Home.');
      } else {
        var identity = planIdentity(account);
        if (account.status === 'connected' && account.requiresSignIn !== true && account.planEnabled === true) {
          message = t('使用 ChatGPT 订阅', 'Using ChatGPT subscription') + (identity ? ' · ' + identity : '');
          state = 'ready';
        } else if (account.status === 'connected' && account.planEnabled !== true) {
          message = t('需允许使用 ChatGPT 订阅；请前往 Codex 多账号补充许可。',
            'Allow ChatGPT plan use in Codex Accounts before using this subscription.') + (identity ? ' · ' + identity : '');
        } else if (account.status === 'signed-out') {
          message = t('ChatGPT 账号已退出。', 'ChatGPT account is signed out.');
        } else if (account.status === 'expired') {
          message = t('ChatGPT 授权已过期，请重新登录。', 'ChatGPT authorization has expired. Sign in again.');
        } else if (account.requiresSignIn === true) {
          message = t('ChatGPT 授权需要重新登录。', 'ChatGPT authorization needs sign-in.');
        } else if (account.status === 'signing-out') {
          message = t('正在安全退出 ChatGPT…', 'Signing out of ChatGPT safely…');
          state = 'pending';
        } else {
          message = t('ChatGPT 授权状态不可用。', 'ChatGPT authorization is unavailable.');
          state = 'error';
        }
        if (account.remoteRevocationConfirmed === false) {
          message += ' ' + t('远端撤销未确认。', 'Remote revocation was not confirmed.');
          state = 'error';
        }
      }
      setPlanIndicator(message, state, true, pending);
      if (opened) render();
    }).catch(function () {
      if (request !== planIndicatorRequest || planIndicatorKey !== key) return;
      planHomeInfo = { homeId: homeId, authKind: 'unavailable' };
      setPlanIndicator(t('无法读取此 Home 的认证状态。', 'Could not read this Home’s authentication status.'), 'error', false, false);
      if (opened) render();
    }).finally(function () {
      if (request === planIndicatorRequest) planIndicatorPending = '';
    });
  }

  function invokePlanIndicatorAction(action) {
    if (planIndicatorBusy || !bridge || typeof bridge.multiCodexHomeAction !== 'function') return;
    var bot = activeBot();
    var homeId = planHomeIdForBot(bot);
    if (!homeId) return;
    var input = action === 'planUsage' ? {} : { homeId: homeId };
    planIndicatorBusy = true;
    setPlanIndicator(action === 'planUsage'
      ? t('正在打开 ChatGPT 用量设置…', 'Opening ChatGPT usage settings…')
      : t('正在取消 ChatGPT 登录…', 'Canceling ChatGPT sign-in…'), 'pending', true, action === 'planCancelSignIn');
    Promise.resolve().then(function () {
      return bridge.multiCodexHomeAction({ action: action, input: input });
    }).then(function (result) {
      if (!result || result.ok !== true) throw new Error(result && (result.message || result.code) || 'CHATGPT_ACTION_FAILED');
      if (action === 'planUsage') setPlanIndicator(t('ChatGPT 用量设置已打开。', 'ChatGPT usage settings opened.'), 'ready', true, false);
      else setPlanIndicator(t('ChatGPT 登录已取消。', 'ChatGPT sign-in canceled.'), 'idle', true, false);
      updatePlanIndicator(activeBot(), true);
    }).catch(function (error) {
      setPlanIndicator(String(error && error.message || t('操作未完成。', 'The action did not complete.')), 'error', true, action === 'planCancelSignIn');
    }).finally(function () {
      planIndicatorBusy = false;
      if (planUsageButton) planUsageButton.disabled = false;
      if (planCancelButton) planCancelButton.disabled = false;
    });
  }

  function bindPlanIndicatorActions() {
    planUsageButton = root.document.getElementById('chat-plan-usage-manage');
    planCancelButton = root.document.getElementById('chat-plan-usage-cancel');
    if (!planUsageButton || !planCancelButton) return;
    planUsageButton.addEventListener('click', function () { invokePlanIndicatorAction('planUsage'); });
    planCancelButton.addEventListener('click', function () { invokePlanIndicatorAction('planCancelSignIn'); });
  }

  function activeSession(token, requestedBotId) {
    if (!opened || token !== epoch || botId !== requestedBotId) return false;
    var current = activeBot();
    if (expectedOwner && (!current || String(current.id) !== expectedOwner.botId ||
        String(current.executorBinding && current.executorBinding.revision) !== expectedOwner.bindingRevision)) {
      closeDialog(true);
      return false;
    }
    return current && current.id === requestedBotId;
  }

  function makeDialog() {
    overlay = make('div', 'ob-executor-switch-overlay');
    overlay.id = 'ob-executor-switch-overlay';
    overlay.hidden = true;
    overlay.dataset.executorSwitchOverlay = 'true';
    dialog = make('section', 'ob-executor-switch-dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'ob-executor-switch-title');
    dialog.setAttribute('aria-describedby', 'ob-executor-switch-description');
    overlay.appendChild(dialog);

    var top = make('div', 'ob-executor-switch-top');
    var heading = make('div', 'ob-executor-switch-heading');
    var title = make('h2', '', t('执行器设置', 'Executor settings'));
    title.id = 'ob-executor-switch-title';
    var description = make('p', '', t('查看此 Bot 的固定执行器，并管理它的模型设置。', 'View this Bot’s fixed executor and manage its model settings.'));
    description.id = 'ob-executor-switch-description';
    heading.appendChild(title);
    heading.appendChild(description);
    var close = make('button', 'ob-executor-switch-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', t('关闭', 'Close'));
    close.dataset.executorSwitchClose = 'true';
    close.addEventListener('click', function () { closeDialog(true); });
    top.appendChild(heading);
    top.appendChild(close);
    dialog.appendChild(top);

    var status = make('div', 'ob-executor-switch-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    els.status = status;
    dialog.appendChild(status);

    var searchGroup = make('div', 'ob-executor-switch-search-group');
    var searchLabel = make('label', '', t('查找执行器', 'Find an executor'));
    searchLabel.htmlFor = 'ob-executor-switch-search';
    var search = make('input', 'ob-executor-switch-search');
    search.type = 'search';
    search.id = 'ob-executor-switch-search';
    search.autocomplete = 'off';
    search.placeholder = t('搜索名称或 ID', 'Search by name or ID');
    search.dataset.executorSwitchSearch = 'true';
    search.addEventListener('input', function () { renderOptions(); });
    search.addEventListener('keydown', onSearchKeydown);
    searchGroup.appendChild(searchLabel);
    searchGroup.appendChild(search);
    dialog.appendChild(searchGroup);
    els.search = search;

    var list = make('div', 'ob-executor-switch-options');
    list.id = 'ob-executor-switch-options';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', t('可用执行器', 'Executors'));
    list.dataset.executorSwitchOptions = 'true';
    list.addEventListener('click', onOptionClick);
    list.addEventListener('pointerover', onOptionPointerOver);
    els.options = list;
    dialog.appendChild(list);
    var empty = make('div', 'ob-executor-switch-empty', t('没有匹配的执行器。', 'No matching executors.'));
    empty.hidden = true;
    els.empty = empty;
    dialog.appendChild(empty);

    var error = make('div', 'ob-executor-switch-error');
    error.hidden = true;
    error.setAttribute('role', 'alert');
    var errorText = make('span', 'ob-executor-switch-error-text');
    var retry = make('button', 'ob-executor-switch-text-button', t('重试', 'Retry'));
    retry.type = 'button';
    retry.dataset.executorSwitchRetry = 'true';
    retry.addEventListener('click', retryLoad);
    error.appendChild(errorText);
    error.appendChild(retry);
    els.error = error;
    els.errorText = errorText;
    els.retry = retry;
    dialog.appendChild(error);

    var settings = make('div', 'ob-executor-switch-settings');
    els.settings = settings;
    var transportGroup = make('div', 'ob-executor-switch-field');
    var transportLabel = make('label', '', t('协议', 'Protocol'));
    transportLabel.htmlFor = 'ob-executor-switch-transport';
    var transport = make('select', 'ob-executor-switch-select');
    transport.id = 'ob-executor-switch-transport';
    transport.dataset.executorSwitchTransport = 'true';
    transport.addEventListener('change', onTransportChange);
    transportGroup.appendChild(transportLabel);
    transportGroup.appendChild(transport);
    els.transportGroup = transportGroup;
    els.transport = transport;
    settings.appendChild(transportGroup);

    var apiSourceGroup = make('div', 'ob-executor-switch-field ob-executor-switch-api-source');
    apiSourceGroup.hidden = true;
    var apiSourceLabel = make('label', '', t('模型来源', 'Model source'));
    apiSourceLabel.htmlFor = 'ob-executor-switch-api-source';
    var apiSource = make('select', 'ob-executor-switch-select');
    apiSource.id = apiSourceLabel.htmlFor;
    apiSource.dataset.executorSwitchApiSource = 'true';
    apiSource.addEventListener('change', onApiSourceChange);
    apiSourceGroup.appendChild(apiSourceLabel);
    apiSourceGroup.appendChild(apiSource);
    settings.appendChild(apiSourceGroup);
    els.apiSourceGroup = apiSourceGroup;
    els.apiSource = apiSource;

    var modelGroup = make('div', 'ob-executor-switch-field');
    var modelLabelRow = make('div', 'ob-executor-switch-model-label-row');
    var modelLabel = make('label', '', t('模型 ID', 'Model ID'));
    modelLabel.htmlFor = 'ob-executor-switch-model';
    modelLabelRow.appendChild(modelLabel);
    var apiModelRefresh = make('button', 'ob-executor-switch-text-button ob-executor-switch-api-model-refresh', t('刷新', 'Refresh'));
    apiModelRefresh.type = 'button';
    apiModelRefresh.dataset.executorSwitchApiModelRefresh = 'true';
    apiModelRefresh.hidden = true;
    apiModelRefresh.addEventListener('click', refreshApiModels);
    modelLabelRow.appendChild(apiModelRefresh);
    modelGroup.appendChild(modelLabelRow);
    var apiModelSelect = make('select', 'ob-executor-switch-select ob-executor-switch-api-model');
    apiModelSelect.id = 'ob-executor-switch-api-model';
    apiModelSelect.dataset.executorSwitchApiModel = 'true';
    apiModelSelect.hidden = true;
    apiModelSelect.addEventListener('change', onApiModelChange);
    modelGroup.appendChild(apiModelSelect);
    var apiModelState = make('p', 'ob-executor-switch-api-model-state');
    apiModelState.id = 'ob-executor-switch-api-model-state';
    apiModelState.hidden = true;
    apiModelState.setAttribute('role', 'status');
    apiModelState.setAttribute('aria-live', 'polite');
    modelGroup.appendChild(apiModelState);
    var model = make('input', 'ob-executor-switch-model');
    model.id = 'ob-executor-switch-model';
    model.type = 'text';
    model.autocomplete = 'off';
    model.spellcheck = false;
    model.maxLength = 120;
    model.placeholder = t('输入当前 API 配置中的模型 ID', 'Enter a model ID from the current API configuration');
    model.dataset.executorSwitchModel = 'true';
    model.addEventListener('input', onModelInput);
    modelGroup.appendChild(model);
    var planModelSelect = make('select', 'ob-executor-switch-select ob-executor-switch-plan-model');
    planModelSelect.id = 'ob-executor-switch-plan-model';
    planModelSelect.dataset.executorSwitchPlanModel = 'true';
    planModelSelect.hidden = true;
    planModelSelect.addEventListener('change', onPlanModelChange);
    modelGroup.appendChild(planModelSelect);
    var planModelState = make('p', 'ob-executor-switch-plan-model-state');
    planModelState.hidden = true;
    planModelState.setAttribute('role', 'status');
    planModelState.setAttribute('aria-live', 'polite');
    modelGroup.appendChild(planModelState);
    var planModelRefresh = make('button', 'ob-executor-switch-text-button ob-executor-switch-plan-model-refresh', t('刷新订阅模型', 'Refresh plan models'));
    planModelRefresh.type = 'button';
    planModelRefresh.dataset.executorSwitchPlanModelRefresh = 'true';
    planModelRefresh.hidden = true;
    planModelRefresh.addEventListener('click', refreshBoundPlanModels);
    modelGroup.appendChild(planModelRefresh);
    els.modelGroup = modelGroup;
    els.model = model;
    els.modelLabel = modelLabel;
    els.apiModelSelect = apiModelSelect;
    els.apiModelState = apiModelState;
    els.apiModelRefresh = apiModelRefresh;
    els.planModelSelect = planModelSelect;
    els.planModelState = planModelState;
    els.planModelRefresh = planModelRefresh;
    settings.appendChild(modelGroup);
    dialog.appendChild(settings);

    var acpPanel = make('section', 'ob-executor-switch-acp');
    acpPanel.hidden = true;
    var acpHeading = make('div', 'ob-executor-switch-acp-heading');
    var acpTitle = make('h3', '', t('ACP 模型', 'ACP model'));
    var acpIntro = make('p', '', t('初始化只打开当前绑定的 ACP 会话，不发送提示词。登录状态仍未知，也不代表任务已通过。',
      'Initialization opens the currently bound ACP session without a prompt. Login remains unknown, and no task is run or verified.'));
    acpHeading.appendChild(acpTitle);
    acpHeading.appendChild(acpIntro);
    acpPanel.appendChild(acpHeading);

    var acpStatus = make('div', 'ob-executor-switch-acp-status');
    acpStatus.setAttribute('role', 'status');
    acpStatus.setAttribute('aria-live', 'polite');
    els.acpStatus = acpStatus;
    acpPanel.appendChild(acpStatus);

    var acpCurrent = make('p', 'ob-executor-switch-acp-current');
    acpCurrent.hidden = true;
    els.acpCurrent = acpCurrent;
    acpPanel.appendChild(acpCurrent);

    var acpModelGroup = make('div', 'ob-executor-switch-field ob-executor-switch-acp-model-group');
    var acpModelLabel = make('label', '', t('ACP 提供的模型', 'Model offered by ACP'));
    acpModelLabel.htmlFor = 'ob-executor-switch-acp-model';
    var acpModel = make('select', 'ob-executor-switch-select ob-executor-switch-acp-model');
    acpModel.id = 'ob-executor-switch-acp-model';
    acpModel.dataset.executorSwitchAcpModel = 'true';
    acpModel.addEventListener('change', onAcpModelChange);
    acpModelGroup.appendChild(acpModelLabel);
    acpModelGroup.appendChild(acpModel);
    els.acpModelGroup = acpModelGroup;
    els.acpModel = acpModel;
    acpPanel.appendChild(acpModelGroup);

    var acpDetails = make('p', 'ob-executor-switch-acp-details');
    acpDetails.hidden = true;
    els.acpDetails = acpDetails;
    acpPanel.appendChild(acpDetails);

    var acpAuthMethodGroup = make('div', 'ob-executor-switch-field ob-executor-switch-acp-auth-group');
    acpAuthMethodGroup.hidden = true;
    var acpAuthMethodLabel = make('label', '', t('登录方式', 'Sign-in method'));
    acpAuthMethodLabel.htmlFor = 'ob-executor-switch-acp-auth-method';
    var acpAuthMethod = make('select', 'ob-executor-switch-select ob-executor-switch-acp-auth-method');
    acpAuthMethod.id = 'ob-executor-switch-acp-auth-method';
    acpAuthMethod.dataset.executorSwitchAcpAuthMethod = 'true';
    acpAuthMethod.addEventListener('change', onAcpAuthMethodChange);
    acpAuthMethodGroup.appendChild(acpAuthMethodLabel);
    acpAuthMethodGroup.appendChild(acpAuthMethod);
    els.acpAuthMethodGroup = acpAuthMethodGroup;
    els.acpAuthMethod = acpAuthMethod;
    acpPanel.appendChild(acpAuthMethodGroup);

    var acpAuthNote = make('p', 'ob-executor-switch-acp-auth-note', t(
      '此操作会打开执行器提供的授权流程；已有登录状态可能被替换。请在打开的页面完成，Bot Studio 不会收集密码。',
      'This opens the executor’s sign-in flow and may replace an existing login. Finish in the opened page; Bot Studio never collects your password.'));
    acpAuthNote.id = 'ob-executor-switch-acp-auth-note';
    acpAuthNote.hidden = true;
    els.acpAuthNote = acpAuthNote;
    acpPanel.appendChild(acpAuthNote);

    var acpActions = make('div', 'ob-executor-switch-acp-actions');
    var acpInitialize = make('button', 'ob-executor-switch-acp-initialize', t('初始化 ACP 会话', 'Initialize ACP session'));
    acpInitialize.type = 'button';
    acpInitialize.dataset.executorSwitchAcpInitialize = 'true';
    acpInitialize.addEventListener('click', initializeAcp);
    var acpLogin = make('button', 'ob-executor-switch-acp-initialize ob-executor-switch-acp-login', t('登录', 'Sign in'));
    acpLogin.type = 'button';
    acpLogin.dataset.executorSwitchAcpLogin = 'true';
    acpLogin.addEventListener('click', authenticateAcp);
    var acpRetry = make('button', 'ob-executor-switch-text-button ob-executor-switch-acp-retry', t('重试读取', 'Retry read'));
    acpRetry.type = 'button';
    acpRetry.dataset.executorSwitchAcpRetry = 'true';
    acpRetry.addEventListener('click', retryAcpConfiguration);
    var acpStop = make('button', 'ob-executor-switch-stop ob-executor-switch-acp-stop', t('停止初始化', 'Stop initialization'));
    acpStop.type = 'button';
    acpStop.dataset.executorSwitchAcpStop = 'true';
    acpStop.addEventListener('click', stopAcpInitialization);
    var acpRefresh = make('button', 'ob-executor-switch-text-button ob-executor-switch-acp-refresh', t('刷新配置', 'Refresh configuration'));
    acpRefresh.type = 'button';
    acpRefresh.dataset.executorSwitchAcpRefresh = 'true';
    acpRefresh.addEventListener('click', function () { readAcpConfiguration(true); });
    acpActions.appendChild(acpInitialize);
    acpActions.appendChild(acpLogin);
    acpActions.appendChild(acpRetry);
    acpActions.appendChild(acpStop);
    acpActions.appendChild(acpRefresh);
    els.acpActions = acpActions;
    els.acpInitialize = acpInitialize;
    els.acpLogin = acpLogin;
    els.acpRetry = acpRetry;
    els.acpStop = acpStop;
    els.acpRefresh = acpRefresh;
    acpPanel.appendChild(acpActions);
    els.acpPanel = acpPanel;
    dialog.appendChild(acpPanel);

    var running = make('div', 'ob-executor-switch-running');
    running.hidden = true;
    var runningCopy = make('span', '', t('此 Bot 仍有一轮执行中。先停止本轮，再单独保存模型设置。', 'This Bot still has a turn running. Stop the turn, then save model settings separately.'));
    var stop = make('button', 'ob-executor-switch-stop', t('停止本轮', 'Stop this turn'));
    stop.type = 'button';
    stop.dataset.executorSwitchStop = 'true';
    stop.addEventListener('click', stopTurn);
    running.appendChild(runningCopy);
    running.appendChild(stop);
    els.running = running;
    els.runningCopy = runningCopy;
    els.stop = stop;
    dialog.appendChild(running);

    var review = make('div', 'ob-executor-switch-review');
    review.hidden = true;
    var reviewCopy = make('p', '', t('请核对上一轮发生了什么，再记录核对结果。保存后可以发送新消息，系统不会重发上一轮。', 'Check what happened on the last turn, then record your review. You can send a new message after saving; the previous turn will not be replayed.'));
    var reason = make('p', 'ob-executor-switch-reason');
    var noteLabel = make('label', '', t('核对记录', 'Review note'));
    noteLabel.htmlFor = 'ob-executor-switch-note';
    var note = make('textarea', 'ob-executor-switch-note');
    note.id = 'ob-executor-switch-note';
    note.maxLength = 2000;
    note.rows = 3;
    note.placeholder = t('说明你检查到的实际结果。', 'Describe the actual outcome you checked.');
    note.dataset.executorSwitchNote = 'true';
    note.addEventListener('input', function () { renderStatus(); });
    var confirmRow = make('label', 'ob-executor-switch-confirm');
    var checkbox = root.document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.executorSwitchConfirm = 'true';
    checkbox.addEventListener('change', function () { renderStatus(); });
    var confirmText = make('span', '', t('我已检查这轮执行的实际结果。', 'I reviewed the actual outcome of this turn.'));
    confirmRow.appendChild(checkbox);
    confirmRow.appendChild(confirmText);
    var resolve = make('button', 'ob-executor-switch-resolve', t('记录核对结果', 'Record review'));
    resolve.type = 'button';
    resolve.dataset.executorSwitchResolve = 'true';
    resolve.addEventListener('click', resolveUnknown);
    review.appendChild(reviewCopy);
    review.appendChild(reason);
    review.appendChild(noteLabel);
    review.appendChild(note);
    review.appendChild(confirmRow);
    review.appendChild(resolve);
    els.review = review;
    els.reason = reason;
    els.note = note;
    els.confirm = checkbox;
    els.resolve = resolve;
    dialog.appendChild(review);

    var footer = make('div', 'ob-executor-switch-footer');
    var footerNote = make('span', 'ob-executor-switch-footer-note');
    var cancel = make('button', 'ob-executor-switch-cancel', t('取消', 'Cancel'));
    cancel.type = 'button';
    cancel.dataset.executorSwitchCancel = 'true';
    cancel.addEventListener('click', function () { closeDialog(true); });
    var submit = make('button', 'ob-executor-switch-submit', t('执行器设置', 'Executor settings'));
    submit.type = 'button';
    submit.dataset.executorSwitchSubmit = 'true';
    submit.addEventListener('click', switchExecutor);
    footer.appendChild(footerNote);
    footer.appendChild(cancel);
    footer.appendChild(submit);
    els.footerNote = footerNote;
    els.cancel = cancel;
    els.submit = submit;
    dialog.appendChild(footer);

    overlay.addEventListener('pointerdown', function (event) {
      if (event.target === overlay) closeDialog(true);
    });
    root.document.body.appendChild(overlay);
  }

  function listMatches() {
    var query = String(els.search.value || '').trim().toLocaleLowerCase();
    var rows = catalog.filter(function(row){return snapshot && snapshot.binding && row.id === snapshot.binding.executorId;});
    if (!query) return rows;
    return rows.filter(function (row) {
      return [row.name, row.id, row.description, executorDescription(row), harnessLabels(row).join(' '), modelSourceText(row)]
        .join(' ').toLocaleLowerCase().indexOf(query) >= 0;
    });
  }

  function statusLabel(row) {
    if (row.id === defaultExecutorId) return t('默认', 'Default');
    if (row.kind === 'api') return t('API', 'API');
    if (row.kind === 'agui') return row.available === true ? t('已启用', 'Enabled') : t('已停用', 'Disabled');
    return row.available === true ? t('已检测到程序', 'Program detected') : t('未检测到程序', 'Program not found');
  }

  function renderOptions() {
    if (!els.options) return;
    var rows = listMatches();
    var fragment = root.document.createDocumentFragment();
    rows.forEach(function (row, index) {
      var option = make('div', 'ob-executor-switch-option');
      option.id = 'ob-executor-option-' + index;
      option.dataset.executorId = row.id;
      option.setAttribute('role', 'option');
      var selected = row.id === selectedId;
      var available = row.available === true;
      var selectable = available && !actionBusy;
      option.setAttribute('aria-selected', selected ? 'true' : 'false');
      option.setAttribute('aria-disabled', selectable ? 'false' : 'true');
      if (selected) option.classList.add('is-selected');
      if (row.id === activeOptionId) option.classList.add('is-active');
      if (!available) option.classList.add('is-unavailable');
      if (available && actionBusy) option.classList.add('is-busy');
      option.appendChild(logoElement(row.id, 'ob-executor-switch-option-logo'));
      var copy = make('span', 'ob-executor-switch-option-copy');
      var name = make('span', 'ob-executor-switch-option-name', row.name || row.id);
      var descriptionText = executorDescription(row);
      var description = make('span', 'ob-executor-switch-option-description', descriptionText);
      copy.appendChild(name);
      if (descriptionText) copy.appendChild(description);
      var labels = harnessLabels(row);
      if (labels.length) {
        var badges = make('span', 'ob-executor-switch-option-badges');
        labels.forEach(function (label) {
          badges.appendChild(make('span', 'ob-executor-switch-badge', label));
        });
        copy.appendChild(badges);
      }
      var inventory = modelInventory(row);
      var inventoryLine = make('span', 'ob-executor-switch-option-models', inventory.text);
      inventoryLine.dataset.state = inventory.state;
      inventoryLine.title = inventory.title;
      copy.appendChild(inventoryLine);
      copy.appendChild(make('span', 'ob-executor-switch-option-source', modelSourceText(row)));
      option.appendChild(copy);
      var meta = make('span', 'ob-executor-switch-option-meta', statusLabel(row));
      option.appendChild(meta);
      var check = make('span', 'ob-executor-switch-option-check', '✓');
      check.setAttribute('aria-hidden', 'true');
      option.appendChild(check);
      fragment.appendChild(option);
    });
    els.options.replaceChildren(fragment);
    els.options.hidden = rows.length === 0 || catalog.length === 0;
    els.empty.hidden = rows.length !== 0 || catalog.length === 0 || loading;
    if (activeOptionId) {
      var active = Array.prototype.find.call(els.options.querySelectorAll('[data-executor-id]'), function (option) {
        return option.dataset.executorId === activeOptionId;
      });
      if (active) {
        els.search.setAttribute('aria-activedescendant', active.id);
        active.scrollIntoView({ block: 'nearest' });
      } else {
        activeOptionId = '';
        els.search.removeAttribute('aria-activedescendant');
      }
    } else {
      els.search.removeAttribute('aria-activedescendant');
    }
  }

  function selectedRow() {
    return catalog.find(function (row) { return snapshot && snapshot.binding && row.id === snapshot.binding.executorId && row.id === selectedId; }) || null;
  }

  function transportKeys(row) {
    if (!row || row.kind !== 'native' || !row.transportCapabilities) return [];
    return Object.keys(row.transportCapabilities).filter(function (key) {
      return snapshot && snapshot.binding && row.id === snapshot.binding.executorId && key === snapshot.binding.transport && row.transportCapabilities[key] && row.transports && row.transports[key] === true;
    });
  }

  function transportLabel(value) {
    if (value === 'acp') return 'ACP';
    if (value === 'cli') return 'CLI';
    if (value === 'appserver') return 'App Server';
    return value;
  }

  function needsCodexHome(row, transport) {
    if (!row || row.id !== 'agent:codex' || transport !== 'appserver') return false;
    var binding = snapshot && snapshot.binding;
    return !(binding && binding.executorId === row.id && binding.transport === 'appserver' &&
      typeof binding.codexHomeId === 'string' && binding.codexHomeId);
  }

  function modelKey(id, transport) { return id + '|' + (transport || ''); }

  function apiBotSettingsIdentity(bot) {
    if (!bot || typeof bot.id !== 'string' || !bot.id) return '';
    var settingsRevision = Number.isSafeInteger(bot.settingsRevision) && bot.settingsRevision >= 0
      ? bot.settingsRevision : 0;
    var binding = bot.executorBinding;
    return JSON.stringify([bot.id, String(bot.providerId || ''), settingsRevision, String(bot.model || ''),
      String(bot.harness || ''), bot.agent && bot.agent.id || '', bot.agent && bot.agent.model || '',
      bot.agent && bot.agent.transport || '', binding && binding.executorId, binding && binding.transport,
      binding && binding.revision, binding && binding.generation]);
  }

  function apiBindingCacheKey(binding, botIdentity) {
    if (!binding) return '';
    return JSON.stringify([botIdentity || apiModelIdentityKey, binding.executorId || '', binding.transport || '',
      binding.revision, binding.generation || '', binding.providerId || '', binding.model || '']);
  }

  function apiModelContextFor(row) {
    var binding = snapshot && snapshot.binding;
    var bot = activeBot();
    var botIdentity = apiBotSettingsIdentity(bot);
    if (!row || row.kind !== 'api' || !botIdentity || String(bot.id) !== botId ||
        !binding || !Number.isSafeInteger(binding.revision)) return null;
    var context = {
      epoch: epoch,
      botId: botId,
      executorId: row.id,
      revision: binding.revision,
      generation: binding.generation,
      botIdentity: botIdentity,
      providerId: alternateApiSource()
    };
    context.key = JSON.stringify([context.botId, context.executorId, context.revision, context.generation, context.botIdentity, context.providerId]);
    return context;
  }

  function alternateApiSource() {
    var sources = snapshot && snapshot.apiSources;
    return sources && apiSourceDraft !== sources.currentId &&
      sources.options.some(function (option) { return option.id === apiSourceDraft; }) ? apiSourceDraft : '';
  }

  function apiModelDraftKey(executorId, providerId) {
    return modelKey(executorId, providerId ? 'api-source:' + providerId : '');
  }

  function renderApiSource(show) {
    var sources = show && snapshot && snapshot.apiSources;
    els.apiSourceGroup.hidden = !sources || !sources.options.length;
    if (els.apiSourceGroup.hidden) return;
    var options = sources.options.slice();
    if (!options.some(function (row) { return row.id === sources.currentId; })) {
      options.unshift({ id: sources.currentId, kind: sources.current.kind, label: sources.current.label });
    }
    var key = JSON.stringify([options, sources.currentId]);
    if (els.apiSource.dataset.renderKey !== key) {
      var optionsFragment = root.document.createDocumentFragment();
      options.forEach(function (row) {
        var option = make('option');
        option.value = row.id;
        var label = row.kind === 'magpie' ? 'Magpie' : row.kind === 'deepseek' ? 'DeepSeek' : row.label || t('当前连接', 'Current connection');
        if (row.kind && options.filter(function (item) { return item.kind === row.kind; }).length > 1 && row.label !== label) label += ' · ' + row.label;
        option.textContent = label + (row.id === sources.currentId ? t('（当前）', ' (current)') : '');
        optionsFragment.appendChild(option);
      });
      els.apiSource.replaceChildren(optionsFragment);
      els.apiSource.dataset.renderKey = key;
    }
    els.apiSource.value = alternateApiSource() || sources.currentId;
    els.apiSource.disabled = loading || actionBusy;
  }

  function onApiSourceChange() {
    if (loading || actionBusy || !selectedRow() || selectedRow().kind !== 'api') return;
    apiSourceDraft = els.apiSource.value;
    invalidateApiModelRequests(false);
    expireApiModels();
    actionError = '';
    actionNotice = '';
    render();
  }

  function apiModelRecordFor(row) {
    var context = apiModelContextFor(row);
    return context ? apiModelCache[context.key] || null : null;
  }

  function clearApiModelDrafts() {
    catalog.forEach(function (row) {
      if (row && row.kind === 'api') Object.keys(modelDrafts).forEach(function (key) {
        if (key.startsWith(row.id + '|')) delete modelDrafts[key];
      });
    });
  }

  function invalidateApiModelRequests(clearCache) {
    apiModelSequence += 1;
    if (clearCache) {
      apiModelCache = Object.create(null);
      return;
    }
    Object.keys(apiModelCache).forEach(function (key) {
      if (apiModelCache[key] && apiModelCache[key].status === 'loading') delete apiModelCache[key];
    });
  }

  function expireApiModels() {
    Object.keys(apiModelCache).forEach(function (key) {
      var record = apiModelCache[key];
      if (record.status !== 'ready' || record.fallback || Date.now() - record.readAt >= apiModelsMaxAge) delete apiModelCache[key];
    });
  }

  function apiModelRequestIsCurrent(context, record) {
    var binding = snapshot && snapshot.binding;
    return activeSession(context.epoch, context.botId) && selectedId === context.executorId &&
      binding && binding.revision === context.revision && binding.generation === context.generation &&
      apiBotSettingsIdentity(activeBot()) === context.botIdentity &&
      alternateApiSource() === context.providerId &&
      apiModelSequence === context.sequence && apiModelCache[context.key] === record &&
      record.sequence === context.sequence;
  }

  function ensureApiModels(force) {
    if (actionBusy || loading) return false;
    var row = selectedRow();
    var context = apiModelContextFor(row);
    if (!context) return false;
    var existing = apiModelCache[context.key];
    if (!force && existing && (existing.status === 'ready' || existing.status === 'empty' || existing.status === 'error' || existing.status === 'stale' ||
        (existing.status === 'loading' && existing.sequence === apiModelSequence))) return false;

    context.sequence = ++apiModelSequence;
    var record = {
      status: 'loading', sequence: context.sequence, models: null, preferredModel: '',
      providerId: '', providerName: '', error: ''
    };
    apiModelCache[context.key] = record;
    if (!bridge || typeof bridge.listExecutorModels !== 'function') {
      record.status = 'error';
      record.error = 'MODEL_LIST_UNAVAILABLE';
      return true;
    }

    var request;
    try {
      request = bridge.listExecutorModels({
        botId: context.botId,
        executorId: context.executorId,
        expectedRevision: context.revision,
        ...(context.providerId ? { providerId: context.providerId } : {})
      });
    } catch (error) {
      request = Promise.reject(error);
    }
    callResult(request).then(function (result) {
      if (!apiModelRequestIsCurrent(context, record)) return;
      if (result.botId !== context.botId || result.executorId !== context.executorId ||
          (context.providerId && result.providerId !== context.providerId)) {
        record.status = 'error';
        record.error = 'MODEL_LIST_CONTEXT_MISMATCH';
        render();
        return;
      }
      if (result.bindingRevision !== context.revision || result.bindingGeneration !== context.generation) {
        record.status = 'stale';
        record.error = '';
        render();
        return;
      }
      if (!Array.isArray(result.models)) {
        record.status = 'error';
        record.error = 'INVALID_MODEL_LIST_RESPONSE';
        render();
        return;
      }
      var seen = Object.create(null);
      record.models = result.models.filter(function (item) {
        if (!item || typeof item.id !== 'string' || !item.id || Object.prototype.hasOwnProperty.call(seen, item.id)) return false;
        seen[item.id] = true;
        return true;
      }).map(function (item) {
        return { id: item.id, name: typeof item.name === 'string' && item.name ? item.name : item.id };
      });
      record.preferredModel = typeof result.preferredModel === 'string' ? result.preferredModel : '';
      record.providerId = typeof result.providerId === 'string' ? result.providerId : '';
      record.providerName = typeof result.providerName === 'string' ? result.providerName : '';
      if (!record.models.length && !context.providerId) {
        var emptyBot = activeBot();
        var emptyFallback = String((emptyBot && emptyBot.model) || result.preferredModel || 'deepseek-flash').trim();
        if (emptyFallback) {
          record.models = [{ id: emptyFallback, name: emptyFallback }];
          record.preferredModel = emptyFallback;
          record.fallback = true;
        }
      }
      record.status = record.models.length ? 'ready' : 'empty';
      record.readAt = Date.now();
      var draftKey = apiModelDraftKey(context.executorId, context.providerId);
      var draft = String(modelDrafts[draftKey] || '');
      if (draft && !record.models.some(function (item) { return item.id === draft; })) delete modelDrafts[draftKey];
      render();
    }).catch(function (error) {
      if (!apiModelRequestIsCurrent(context, record)) return;
      record.error = String(error && error.code || 'MODEL_LIST_FAILED');
      var changed = ['EXECUTOR_STALE_REVISION', 'EXECUTOR_MODELS_CHANGED', 'EXECUTOR_SOURCE_UNAVAILABLE'].includes(record.error);
      if (!context.providerId && record.error !== 'NO_KEY' && !changed) {
        var curBot = activeBot();
        var fallbackModel = String((curBot && curBot.model) || 'deepseek-flash').trim();
        if (fallbackModel) {
          record.models = [{ id: fallbackModel, name: fallbackModel }];
          record.preferredModel = fallbackModel;
          record.status = 'ready';
          record.fallback = true;
          render();
          return;
        }
      }
      record.status = changed ? 'stale' : 'error';
      render();
    });
    return true;
  }

  function refreshApiModels() {
    var row = selectedRow();
    if (!opened || !row || row.kind !== 'api' || loading || actionBusy) return;
    var record = apiModelRecordFor(row);
    if (!apiModelContextFor(row)) {
      retryLoad();
      return;
    }
    if (record && record.status === 'stale') {
      invalidateApiModelRequests(true);
      retryLoad();
      return;
    }
    ensureApiModels(true);
    render();
  }

  function seedModel(row, transport) {
    if (!row) return '';
    var key = modelKey(row.id, transport);
    if (Object.prototype.hasOwnProperty.call(modelDrafts, key)) return modelDrafts[key];
    var binding = snapshot && snapshot.binding;
    if (binding && binding.executorId === row.id && (!transport || binding.transport === transport)) {
      return String(binding.model || '');
    }
    return '';
  }

  function setSelection(id) {
    var row = catalog.find(function (candidate) { return candidate.id === id; });
    if (!row || !snapshot || !snapshot.binding || id !== snapshot.binding.executorId || row.available !== true || actionBusy) return;
    var oldRow = selectedRow();
    var oldTransport = selectedTransport;
    if (oldRow && oldRow.kind === 'api' && els.apiModelSelect) {
      var oldRecord = apiModelRecordFor(oldRow);
      var oldValue = String(els.apiModelSelect.value || '');
      if (oldRecord && oldRecord.status === 'ready' && oldRecord.models.some(function (item) { return item.id === oldValue; })) {
        modelDrafts[apiModelDraftKey(oldRow.id, alternateApiSource())] = oldValue;
      }
    } else if (oldRow && els.model && modelSupports(oldRow, oldTransport)) {
      modelDrafts[modelKey(oldRow.id, oldTransport)] = els.model.value;
    }
    invalidateApiModelRequests(false);
    selectedId = row.id;
    var keys = transportKeys(row);
    var binding = snapshot && snapshot.binding;
    selectedTransport = binding && binding.executorId === row.id && keys.indexOf(binding.transport) >= 0
      ? binding.transport : (keys.indexOf(row.transport) >= 0 ? row.transport : (keys[0] || ''));
    activeOptionId = row.id;
    acpNotice = '';
    syncAcpConfiguration(false);
    if (row.kind === 'api' && !loading) ensureApiModels(false);
    render();
  }

  function setActiveOption(id) {
    var row = catalog.find(function (candidate) { return candidate.id === id; });
    if (!row || row.available !== true) return;
    activeOptionId = id;
    Array.prototype.forEach.call(els.options.querySelectorAll('[data-executor-id]'), function (option) {
      option.classList.toggle('is-active', option.dataset.executorId === id);
    });
    var target = Array.prototype.find.call(els.options.querySelectorAll('[data-executor-id]'), function (option) {
      return option.dataset.executorId === id;
    });
    if (target) {
      els.search.setAttribute('aria-activedescendant', target.id);
      target.scrollIntoView({ block: 'nearest' });
    }
  }

  function onOptionClick(event) {
    var option = event.target.closest('[data-executor-id]');
    if (option) setSelection(option.dataset.executorId);
  }

  function onOptionPointerOver(event) {
    var option = event.target.closest('[data-executor-id]');
    if (option && option.getAttribute('aria-disabled') !== 'true') setActiveOption(option.dataset.executorId);
  }

  function moveOption(direction, toEnd) {
    var rows = listMatches().filter(function (row) { return row.available === true; });
    if (!rows.length) { activeOptionId = ''; renderOptions(); return; }
    var index = rows.findIndex(function (row) { return row.id === activeOptionId; });
    if (toEnd === 'start') index = 0;
    else if (toEnd === 'end') index = rows.length - 1;
    else index = index < 0 ? (direction < 0 ? rows.length - 1 : 0) : (index + direction + rows.length) % rows.length;
    setActiveOption(rows[index].id);
  }

  function onSearchKeydown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveOption(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      moveOption(0, event.key === 'Home' ? 'start' : 'end');
    } else if (event.key === 'Enter') {
      var row = catalog.find(function (candidate) { return candidate.id === activeOptionId; });
      if (!row && listMatches().filter(function (candidate) { return candidate.available === true; }).length === 1) {
        row = listMatches().filter(function (candidate) { return candidate.available === true; })[0];
      }
      if (row) { event.preventDefault(); setSelection(row.id); }
    }
  }

  function modelSupports(row, transport) {
    if (!row) return false;
    if (row.kind === 'agui') return false;
    var caps = row.kind === 'native' && row.transportCapabilities && row.transportCapabilities[transport]
      ? row.transportCapabilities[transport] : row.capabilities;
    return !!(caps && caps.modelSelectionSupported === true);
  }

  function hasModelInput(row, transport) { return !!row && modelSupports(row, transport); }

  function isAcpSelection(row, transport) {
    return !!row && row.kind === 'native' && transport === 'acp';
  }

  function isBoundAcpSelection(row, transport) {
    var binding = snapshot && snapshot.binding;
    return isAcpSelection(row, transport) && !!binding && binding.executorId === row.id && binding.transport === transport;
  }

  function acpContextKey(binding) {
    if (!binding) return '';
    return JSON.stringify([botId, binding.executorId, binding.transport, binding.generation, binding.revision]);
  }

  function invalidateAcpConfiguration() {
    acpConfigurationSequence += 1;
    acpConfiguration = null;
    acpConfigurationContext = '';
    acpConfigurationLoading = false;
    acpAuthMethodId = '';
    acpConfigurationError = '';
    acpConfigurationErrorKind = '';
    acpStopBusy = false;
    acpStopRequested = false;
    acpStopError = '';
  }

  function captureAcpContext(sequence) {
    var binding = snapshot && snapshot.binding;
    if (!binding) return null;
    return {
      sequence: sequence,
      epoch: epoch,
      botId: botId,
      executorId: selectedId,
      transport: selectedTransport,
      generation: binding.generation,
      revision: binding.revision,
      key: acpContextKey(binding)
    };
  }

  function acpContextStillCurrent(context, checkRevision) {
    if (!context || context.sequence !== acpConfigurationSequence || !acpContextIdentityStillCurrent(context)) return false;
    var binding = snapshot && snapshot.binding;
    return !checkRevision || binding.revision === context.revision;
  }

  function acpContextIdentityStillCurrent(context) {
    if (!context || !activeSession(context.epoch, context.botId) ||
        selectedId !== context.executorId || selectedTransport !== context.transport) return false;
    var binding = snapshot && snapshot.binding;
    return !!binding && binding.executorId === context.executorId && binding.transport === context.transport &&
      binding.generation === context.generation;
  }

  function currentAcpConfiguration() {
    if (!isBoundAcpSelection(selectedRow(), selectedTransport)) return null;
    return acpConfigurationContext === acpContextKey(snapshot.binding) ? acpConfiguration : null;
  }

  function acpModelOptions(configuration) {
    if (!configuration || configuration.initialized !== true || configuration.authentication === 'required' ||
        configuration.modelConfiguration !== 'available' ||
        !Array.isArray(configuration.modelOptions) || !configuration.modelOptions.length) return [];
    var seen = Object.create(null);
    var options = [];
    for (var i = 0; i < configuration.modelOptions.length; i += 1) {
      var choice = configuration.modelOptions[i];
      if (!choice || typeof choice.value !== 'string' || !choice.value || seen[choice.value]) return [];
      seen[choice.value] = true;
      options.push({ value: choice.value, name: typeof choice.name === 'string' && choice.name ? choice.name : choice.value });
    }
    return options;
  }

  function acpAuthMethodOptions(configuration) {
    if (!configuration || configuration.authentication !== 'required' || !Array.isArray(configuration.authMethods)) return [];
    var seen = Object.create(null);
    var methods = [];
    for (var i = 0; i < configuration.authMethods.length; i += 1) {
      var method = configuration.authMethods[i];
      if (!method || typeof method.id !== 'string' || !method.id || typeof method.name !== 'string' || !method.name ||
          typeof method.type !== 'string' || !method.type || method.type === 'terminal' || seen[method.id]) continue;
      seen[method.id] = true;
      methods.push({ id: method.id, name: method.name, type: method.type });
    }
    return methods;
  }

  function currentAcpAuthMethodId() {
    var configuration = currentAcpConfiguration();
    var methods = acpAuthMethodOptions(configuration);
    if (!configuration || !methods.length || !els.acpAuthMethod) return '';
    return methods.some(function (method) { return method.id === els.acpAuthMethod.value; }) ? els.acpAuthMethod.value : '';
  }

  function currentAcpModelValue() {
    var configuration = currentAcpConfiguration();
    var options = acpModelOptions(configuration);
    if (!configuration || !options.length || !els.acpModel) return '';
    return options.some(function (choice) { return choice.value === els.acpModel.value; }) ? els.acpModel.value : '';
  }

  function readAcpConfiguration(force, preserveError) {
    var row = selectedRow();
    if (!opened || !isBoundAcpSelection(row, selectedTransport)) {
      invalidateAcpConfiguration();
      render();
      return;
    }
    var binding = snapshot.binding;
    var key = acpContextKey(binding);
    if (!force && (acpConfigurationLoading || (acpConfiguration && acpConfigurationContext === key))) return;
    if (!bridge || typeof bridge.getExecutorConfiguration !== 'function') {
      acpConfigurationError = t('ACP 配置读取接口不可用。', 'ACP configuration is unavailable.');
      acpConfigurationErrorKind = 'read';
      render();
      return;
    }

    var sequence = ++acpConfigurationSequence;
    var context = captureAcpContext(sequence);
    acpConfiguration = null;
    acpConfigurationContext = '';
    acpConfigurationLoading = true;
    if (!preserveError) {
      acpConfigurationError = '';
      acpConfigurationErrorKind = '';
    }
    acpStopError = '';
    render();
    callResult(bridge.getExecutorConfiguration(context.botId)).then(function (result) {
      if (!acpContextStillCurrent(context, true)) return;
      var returnedBinding = result.binding;
      if (!returnedBinding || returnedBinding.executorId !== context.executorId ||
          returnedBinding.transport !== context.transport || returnedBinding.generation !== context.generation ||
          returnedBinding.revision !== context.revision) {
        acpConfigurationLoading = false;
        loadData(context.epoch, context.botId, true);
        return;
      }
      acpConfiguration = result;
      acpConfigurationContext = context.key;
      acpConfigurationLoading = false;
      if (preserveError && acpConfigurationErrorKind === 'authenticate' && result.authentication === 'authenticated') {
        acpConfigurationError = '';
        acpConfigurationErrorKind = '';
      }
      render();
    }).catch(function (error) {
      if (!acpContextStillCurrent(context, true)) return;
      acpConfigurationLoading = false;
      acpConfigurationError = apiFailureMessage(error);
      acpConfigurationErrorKind = 'read';
      render();
    });
  }

  function syncAcpConfiguration(force) {
    if (isBoundAcpSelection(selectedRow(), selectedTransport)) readAcpConfiguration(force === true);
    else {
      invalidateAcpConfiguration();
      render();
    }
  }

  function currentStatus() {
    return snapshot && snapshot.state && snapshot.state.status || (loading ? 'loading' : 'unavailable');
  }

  function renderApiModelControls(row) {
    var context = apiModelContextFor(row);
    var record = context && apiModelCache[context.key];
    var models = record && Array.isArray(record.models) ? record.models : [];
    var binding = snapshot && snapshot.binding;
    var savedModel = !context?.providerId && binding && binding.executorId === row.id && binding.model != null
      ? String(binding.model) : '';
    var hasModel = function (value) {
      return !!value && models.some(function (item) { return item.id === value; });
    };
    var savedUnavailable = !!savedModel && !!record && (record.status === 'ready' || record.status === 'empty') &&
      !hasModel(savedModel);
    var signature = JSON.stringify({
      key: context && context.key,
      status: record && record.status,
      models: models,
      preferredModel: record && record.preferredModel,
      providerId: record && record.providerId,
      providerName: record && record.providerName,
      error: record && record.error,
      savedModel: savedModel
    });
    if (els.apiModelSelect.dataset.renderKey !== signature) {
      var options = root.document.createDocumentFragment();
      var placeholder = root.document.createElement('option');
      placeholder.value = '';
      placeholder.disabled = !!context?.providerId;
      placeholder.textContent = record && record.status === 'loading'
        ? t('正在读取模型…', 'Loading models…')
        : !context || (record && record.status === 'stale')
          ? t('请刷新执行器状态', 'Refresh executor status')
          : record && record.status === 'error'
            ? t('无法读取模型', 'Could not read models')
            : record && record.status === 'empty'
              ? t('没有可用模型', 'No models available')
              : t('选择模型…', 'Choose a model…');
      options.appendChild(placeholder);
      if (savedUnavailable) {
        var unavailable = root.document.createElement('option');
        unavailable.value = savedModel;
        unavailable.disabled = true;
        unavailable.textContent = t('已保存模型（当前不可用）：{model}',
          'Saved model (currently unavailable): {model}', { model: savedModel });
        options.appendChild(unavailable);
      }
      if (record && record.status === 'ready') {
        models.forEach(function (item) {
          var option = root.document.createElement('option');
          option.value = item.id;
          option.textContent = (item.name === item.id ? item.id : item.name + ' · ' + item.id) + ' · ' + modelCapabilitySummary(item);
          options.appendChild(option);
        });
      }
      els.apiModelSelect.replaceChildren(options);
      var draft = String(modelDrafts[apiModelDraftKey(row.id, context?.providerId)] || '');
      var selectedValue = hasModel(draft) ? draft : (hasModel(savedModel) ? savedModel :
        (savedUnavailable ? savedModel : (!context?.providerId && hasModel(record && record.preferredModel) ? record.preferredModel : '')));
      els.apiModelSelect.value = selectedValue;
      els.apiModelSelect.dataset.renderKey = signature;
    }

    var state = 'loading';
    var stateText = t('正在读取 API 配置中的模型…', 'Reading models from the API configuration…');
    if (!context) {
      state = 'stale';
      stateText = t('当前执行器绑定无法读取。刷新状态后再读模型。',
        'The current executor binding is unavailable. Refresh its status before reading models.');
    } else if (record && record.status === 'stale') {
      state = 'stale';
      stateText = t('绑定版本已变化。请重新读取模型列表。', 'The binding changed. Read the model list again.');
    } else if (record && record.status === 'error') {
      state = 'error';
      stateText = record.error === 'NO_KEY'
        ? t('此执行器尚未配置 API 连接密钥。请先检查 API 连接设置。',
          'This executor has no API connection key configured. Check its API connection settings first.')
        : t('无法读取当前 API 配置的模型列表。', 'Could not read models from the current API configuration.');
    } else if (record && record.status === 'empty') {
      state = 'empty';
      stateText = t('当前 API 配置没有提供可用模型。', 'The current API configuration returned no models.');
    } else if (record && record.status === 'ready') {
      state = 'ready';
      var source = (snapshot.apiSources?.options || []).find(function (item) { return item.id === record.providerId; });
      var sourceName = source?.kind === 'magpie' ? 'Magpie' : source?.kind === 'deepseek' ? 'DeepSeek' : record.providerName;
      stateText = sourceName
        ? t('{provider} · {count} 个模型', '{provider} · {count} models', { provider: sourceName, count: models.length })
        : t('{count} 个可用模型', '{count} models available', { count: models.length });
      if (!els.apiModelSelect.value) stateText += ' · ' + t('请选择模型', 'Choose a model');
      if (context.providerId) stateText += ' · ' + t('保存后切换来源', 'Source changes on save');
      var selectedModel = models.find(function (item) { return item.id === els.apiModelSelect.value; });
      if (selectedModel) stateText += ' · ' + modelCapabilitySummary(selectedModel);
    }
    if (savedUnavailable) {
      state = 'unavailable';
      stateText += (stateText ? ' ' : '') + t('已保存模型 {model} 不在当前列表中。',
        'Saved model {model} is not in this list.', { model: savedModel });
    }
    els.apiModelState.textContent = stateText;
    els.apiModelState.dataset.state = state;
    els.apiModelSelect.disabled = actionBusy || loading || !record || record.status !== 'ready' || models.length === 0;
    els.apiModelSelect.required = true;
    if (record && record.status === 'loading') els.apiModelSelect.setAttribute('aria-busy', 'true');
    else els.apiModelSelect.removeAttribute('aria-busy');
    els.apiModelSelect.setAttribute('aria-required', 'true');
    els.apiModelSelect.setAttribute('aria-describedby', els.apiModelState.id);
    els.apiModelRefresh.disabled = actionBusy || loading || !!(record && record.status === 'loading');
    els.apiModelRefresh.textContent = record && record.status === 'loading'
      ? t('读取中…', 'Loading…')
      : state === 'error' || state === 'stale'
        ? t('重试', 'Retry') : t('刷新', 'Refresh');
    els.apiModelRefresh.setAttribute('aria-label', state === 'error' || state === 'stale'
      ? t('重试读取模型列表', 'Retry reading the model list')
      : t('刷新模型列表', 'Refresh the model list'));
  }

  function renderSettings() {
    var row = selectedRow();
    var transports = transportKeys(row);
    var showTransport = transports.length > 0;
    els.transportGroup.hidden = !showTransport;
    if (showTransport) {
      var key = row.id + '|' + transports.join(',') + '|' + selectedTransport;
      if (els.transport.dataset.renderKey !== key) {
        var options = root.document.createDocumentFragment();
        transports.forEach(function (transport) {
          var option = root.document.createElement('option');
          option.value = transport;
          option.textContent = transportLabel(transport);
          options.appendChild(option);
        });
        els.transport.replaceChildren(options);
        els.transport.value = selectedTransport;
        els.transport.dataset.renderKey = key;
      }
    }
    els.transport.disabled = true;

    var apiPicker = !!row && row.kind === 'api';
    renderApiSource(apiPicker);
    var showModel = apiPicker || (hasModelInput(row, selectedTransport) && !isAcpSelection(row, selectedTransport));
    var planContext = showModel && !apiPicker ? planContextForSelection(row, selectedTransport) : null;
    var planPicker = !!planContext;
    els.modelGroup.hidden = !showModel;
    els.apiModelSelect.hidden = !apiPicker;
    els.apiModelState.hidden = !apiPicker;
    els.apiModelRefresh.hidden = !apiPicker;
    els.planModelSelect.hidden = !planPicker;
    els.planModelState.hidden = !planPicker;
    els.planModelRefresh.hidden = !planPicker || planContext.authKind !== 'chatgpt-plan';
    if (!apiPicker) {
      els.apiModelSelect.required = false;
      els.apiModelSelect.removeAttribute('aria-required');
      els.apiModelSelect.removeAttribute('aria-describedby');
      els.apiModelSelect.removeAttribute('aria-busy');
    }
    if (showModel) {
      els.model.hidden = planPicker || apiPicker;
      els.model.required = false;
      els.model.removeAttribute('aria-required');
      if (planPicker) {
        els.modelLabel.htmlFor = els.planModelSelect.id;
        els.modelLabel.textContent = t('ChatGPT 订阅模型', 'ChatGPT plan model');
        var cache = planModelCacheFor(planContext);
        var modelOptions = cache && Array.isArray(cache.models) ? cache.models : null;
        var contextKey = planContextKey(planContext.homeId, planContext.accountId || '');
        var binding = snapshot && snapshot.binding;
        var savedPlanModel = binding && binding.model != null ? String(binding.model) : '';
        var optionSignature = JSON.stringify({ context: contextKey, authKind: planContext.authKind,
          enabled: planContext.enabled === true, models: modelOptions, saved: savedPlanModel });
        if (els.planModelSelect.dataset.renderKey !== optionSignature) {
          var options = root.document.createDocumentFragment();
          var placeholder = root.document.createElement('option');
          placeholder.value = '';
          placeholder.textContent = planContext.authKind === 'checking'
            ? t('正在读取 Home 授权状态…', 'Checking Home authorization…')
            : planContext.authKind === 'pending'
              ? t('等待完成 ChatGPT 登录', 'Waiting for ChatGPT sign-in')
              : planContext.authKind === 'unavailable'
                ? t('订阅状态不可用', 'Plan status unavailable')
                : !planContext.enabled
                  ? t('先在 Codex 多账号中启用此订阅', 'Enable this plan in Codex Accounts first')
                  : !modelOptions
                    ? t('先刷新此账号的模型列表', 'Refresh this account’s model list first')
                    : t('选择此账号的模型…', 'Choose a model from this account…');
          options.appendChild(placeholder);
          if (Array.isArray(modelOptions)) {
            if (savedPlanModel && !modelOptions.some(function (item) { return item.id === savedPlanModel; })) {
              var savedOption = root.document.createElement('option');
              savedOption.value = savedPlanModel;
              savedOption.textContent = t('已保存模型（不在当前列表中）：{model}',
                'Saved model (not in the current list): {model}', { model: savedPlanModel });
              savedOption.disabled = true;
              options.appendChild(savedOption);
            }
            modelOptions.forEach(function (item) {
              var option = root.document.createElement('option');
              option.value = item.id;
              option.textContent = item.name + (item.name === item.id ? '' : ' · ' + item.id) + ' · ' + modelCapabilitySummary(item);
              options.appendChild(option);
            });
          }
          els.planModelSelect.replaceChildren(options);
          var draftKey = planModelDraftKey(planContext);
          var draft = draftKey && Object.prototype.hasOwnProperty.call(planModelDrafts, draftKey)
            ? planModelDrafts[draftKey] : '';
          var selectedValue = modelOptions && draft && modelOptions.some(function (item) { return item.id === draft; })
            ? draft : (modelOptions && savedPlanModel && modelOptions.some(function (item) { return item.id === savedPlanModel; })
              ? savedPlanModel : (savedPlanModel && modelOptions && !modelOptions.some(function (item) { return item.id === savedPlanModel; })
                ? savedPlanModel : ''));
          els.planModelSelect.value = selectedValue;
          els.planModelSelect.dataset.renderKey = optionSignature;
        }
        els.planModelSelect.disabled = actionBusy || loading || !planContext.enabled ||
          !Array.isArray(modelOptions) || modelOptions.length === 0;
        els.planModelRefresh.disabled = actionBusy || loading || !planContext.enabled || !!(cache && cache.loading);
        els.planModelRefresh.textContent = cache && cache.loading
          ? t('正在读取…', 'Reading…') : t('刷新订阅模型', 'Refresh plan models');
        var modelState;
        if (planContext.authKind === 'checking') modelState = t('正在读取 Home 授权状态。', 'Checking Home authorization.');
        else if (planContext.authKind === 'pending') modelState = t('ChatGPT 登录仍在等待中；模型不可用。', 'ChatGPT sign-in is still pending; models are unavailable.');
        else if (planContext.authKind === 'unavailable') modelState = t('订阅状态不可用；不会改用原生账号或其他模型来源。', 'Plan status is unavailable; native account or other model sources are not used as a fallback.');
        else if (!planContext.account) modelState = t('此 Home 尚未关联 ChatGPT 账号。', 'No ChatGPT account is associated with this Home.');
        else if (planContext.account.status === 'signed-out') {
          modelState = t('ChatGPT 账号已退出；请前往 Codex 多账号重新登录。', 'The ChatGPT account is signed out. Sign in again in Codex Accounts.');
        } else if (planContext.account.status === 'expired') {
          modelState = t('ChatGPT 授权已过期；请前往 Codex 多账号重新登录。', 'ChatGPT authorization has expired. Sign in again in Codex Accounts.');
        } else if (planContext.account.status === 'connected' && planContext.account.planEnabled !== true) {
          modelState = t('需允许使用 ChatGPT 订阅；请前往 Codex 多账号补充许可，同意前不会读取模型。',
            'Allow ChatGPT plan use in Codex Accounts first; models stay unread until you consent.');
        } else if (planContext.account.status !== 'connected' || planContext.account.requiresSignIn === true) {
          modelState = t('请先在 Codex 多账号中完成 ChatGPT 登录。', 'Complete ChatGPT sign-in in Codex Accounts first.');
        } else if (!planContext.enabled) modelState = t('此账号尚未允许使用 ChatGPT 订阅；同意前不会读取模型。', 'This account has not consented to plan use; models stay unread until you consent.');
        else if (cache && cache.loading) modelState = t('正在读取此账号的模型列表…', 'Reading this account’s model list…');
        else if (cache && cache.error) modelState = t('模型列表刷新失败（{code}）。可重试。', 'Model refresh failed ({code}). You can retry.', { code: cache.error });
        else if (!modelOptions) modelState = t('模型列表尚未读取；请明确刷新。', 'Models have not been read. Refresh explicitly.');
        else if (!modelOptions.length) modelState = t('此账号没有提供可选模型。', 'This account returned no selectable models.');
        else modelState = t('已读取 {count} 个模型；顺序来自此账号。', '{count} models loaded in the order returned by this account.', { count: modelOptions.length });
        var selectedPlanModel = modelOptions && modelOptions.find(function (item) { return item.id === els.planModelSelect.value; });
        if (selectedPlanModel) modelState += ' · ' + modelCapabilitySummary(selectedPlanModel);
        var identity = planContext.account && (planContext.account.label || planContext.account.email);
        els.planModelState.textContent = (identity ? t('账号：{identity} · ', 'Account: {identity} · ', { identity: identity }) : '') + modelState;
      } else if (apiPicker) {
        els.modelLabel.htmlFor = els.apiModelSelect.id;
        els.modelLabel.textContent = t('模型', 'Model');
        if (!loading) ensureApiModels(false);
        renderApiModelControls(row);
      } else {
        els.modelLabel.htmlFor = els.model.id;
        els.modelLabel.textContent = t('模型 ID', 'Model ID');
        var keyForModel = modelKey(row.id, selectedTransport);
        var modelValue = Object.prototype.hasOwnProperty.call(modelDrafts, keyForModel)
          ? modelDrafts[keyForModel] : seedModel(row, selectedTransport);
        if (els.model.dataset.renderKey !== keyForModel || els.model.value !== modelValue) {
          els.model.value = modelValue;
          els.model.dataset.renderKey = keyForModel;
        }
        var required = row.kind === 'api';
        els.model.required = required;
        els.model.placeholder = required
          ? t('输入当前 API 配置中的模型 ID', 'Enter a model ID from the current API configuration')
          : (row.id === 'agent:codex' && selectedTransport === 'appserver'
            ? t('留空沿用 Home 默认模型', 'Leave empty for the Home default')
            : t('留空以使用此协议的默认模型', 'Leave empty to use this protocol’s default model'));
        els.model.setAttribute('aria-required', required ? 'true' : 'false');
        els.model.disabled = actionBusy || loading;
      }
    } else {
      els.model.hidden = false;
      els.apiModelSelect.hidden = true;
      els.apiModelState.hidden = true;
      els.apiModelRefresh.hidden = true;
      els.planModelSelect.hidden = true;
      els.planModelState.hidden = true;
      els.planModelRefresh.hidden = true;
      els.model.required = false;
      els.model.removeAttribute('aria-required');
      els.model.disabled = true;
      els.apiModelSelect.disabled = true;
      els.apiModelSelect.required = false;
      els.apiModelSelect.removeAttribute('aria-required');
      els.apiModelSelect.removeAttribute('aria-describedby');
      els.apiModelSelect.removeAttribute('aria-busy');
    }
    els.settings.hidden = els.transportGroup.hidden && els.modelGroup.hidden;
  }

  function renderAcpConfiguration() {
    var row = selectedRow();
    var isAcp = isAcpSelection(row, selectedTransport);
    els.acpPanel.hidden = !isAcp;
    if (!isAcp) return;

    var binding = snapshot && snapshot.binding;
    var isBound = isBoundAcpSelection(row, selectedTransport);
    var configuration = currentAcpConfiguration();
    var options = acpModelOptions(configuration);
    var authMethods = acpAuthMethodOptions(configuration);
    var authRequired = !!configuration && configuration.authentication === 'required';
    var showAuth = isBound && authRequired && authMethods.length > 0;
    var idle = currentStatus() === 'idle' && snapshot && snapshot.busy !== true;
    var revisionReady = !!(binding && Number.isSafeInteger(binding.revision));
    var canInitialize = isBound && idle && revisionReady && !loading && !actionBusy && !acpConfigurationLoading &&
      !(configuration && configuration.busy === true) && !authRequired;
    var canAuthenticate = showAuth && idle && revisionReady && !loading && !actionBusy && !acpConfigurationLoading &&
      !(configuration && configuration.busy === true);

    var statusText;
    if (!snapshot || loading) statusText = t('正在读取 Bot 绑定…', 'Reading this Bot’s binding…');
    else if (!isBound) statusText = t('先切换并绑定此 ACP 执行器，再初始化以读取真实模型选项。切换本身不会启动会话或任务。',
      'Switch this Bot to the ACP executor first. Then initialize it to read real model options. Switching alone starts no session or task.');
    else if (acpInitializationBusy && acpOperationKind === 'authenticate') statusText = t('正在等待执行器完成登录；请在打开的授权页面继续，不会运行任务。',
      'Waiting for the executor sign-in flow. Continue in its authorization page; no task is running.');
    else if (acpInitializationBusy) statusText = t('正在打开当前绑定的 ACP 会话；不会发送提示词。',
      'Opening the bound ACP session. No prompt is being sent.');
    else if (acpConfigurationLoading) statusText = t('正在读取已有 ACP 会话配置；此读取不会启动进程。',
      'Reading existing ACP session configuration. This read does not start a process.');
    else if (acpConfigurationError) statusText = acpConfigurationError;
    else if (!configuration) statusText = t('ACP 配置尚未读取。可以重试读取，或在空闲时明确初始化。',
      'ACP configuration has not been read. Retry the read, or explicitly initialize while idle.');
    else if (configuration.busy === true || snapshot.busy === true || currentStatus() !== 'idle') statusText = t('当前执行器忙碌或待核对；请先让本轮结束并完成必要核查。',
      'The executor is busy or needs review. Let the current turn settle and complete any required review first.');
    else if (authRequired && !authMethods.length) statusText = t('ACP 报告需要登录，但没有提供可用的登录方式。请刷新配置后重试。',
      'ACP reports that sign-in is required but offers no supported method. Refresh the configuration and try again.');
    else if (authRequired) statusText = t('ACP 报告需要登录。选择一种执行器提供的方式继续。',
      'ACP reports that sign-in is required. Choose a method offered by the executor to continue.');
    else if (configuration.initialized !== true) statusText = t('ACP 会话尚未初始化。初始化会打开当前绑定的执行器，不发送提示词。',
      'The ACP session is not initialized. Initialization opens the bound executor without a prompt.');
    else if (configuration.modelConfiguration === 'ambiguous') statusText = t('ACP 暴露了多个模型设置，当前无法安全确定要用哪一个。',
      'ACP exposes multiple model settings, so the model control cannot identify one safely.');
    else if (configuration.modelConfiguration !== 'available' || !options.length) statusText = t('ACP 会话没有提供可验证的模型选项；此处不会猜测或补造选项。',
      'The ACP session did not provide a selectable model option. No options are guessed or added here.');
    else if (!currentAcpModelValue()) statusText = t('请选择 ACP 实际提供的模型。保存后，下次任务会重新握手确认。',
      'Choose a model offered by ACP. After saving, the next task will handshake again to confirm it.');
    else statusText = t('选择并保存模型后，下次任务会重新握手确认。',
      'After saving the selected model, the next task will handshake again to confirm it.');
    els.acpStatus.dataset.state = acpConfigurationError || acpStopError ? 'error' : acpInitializationBusy || acpConfigurationLoading ? 'busy' : 'normal';
    if (acpStopError) statusText += ' ' + t('停止请求失败：{error}', 'Stop request failed: {error}', { error: acpStopError });
    if (acpNotice) statusText += ' ' + acpNotice;
    els.acpStatus.textContent = statusText;

    var boundModel = isBound && binding && binding.model != null ? String(binding.model) : '';
    var reportedModel = configuration && configuration.initialized === true && configuration.currentModel != null
      ? String(configuration.currentModel) : '';
    if (reportedModel) {
      els.acpCurrent.textContent = t('ACP 当前报告的模型：{model}', 'Model currently reported by ACP: {model}', { model: reportedModel });
      els.acpCurrent.hidden = false;
    } else if (boundModel) {
      els.acpCurrent.textContent = t('已保存的模型：{model}（本会话未重新验证）',
        'Stored model: {model} (not revalidated in this session)', { model: boundModel });
      els.acpCurrent.hidden = false;
    } else {
      els.acpCurrent.textContent = '';
      els.acpCurrent.hidden = true;
    }

    var optionSignature = configuration && acpConfigurationContext
      ? acpConfigurationContext + '|' + JSON.stringify({
        options: options,
        currentModel: configuration.currentModel == null ? null : configuration.currentModel,
        modelConfiguration: configuration.modelConfiguration
      }) : 'empty|' + (binding ? acpContextKey(binding) : '') + '|' + (!isBound ? row.id + '|' + selectedTransport : '');
    var hasOptions = isBound && options.length > 0;
    if (els.acpModel.dataset.renderKey !== optionSignature) {
      var optionNodes = root.document.createDocumentFragment();
      if (hasOptions) {
        var placeholder = root.document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = t('选择模型…', 'Choose a model…');
        optionNodes.appendChild(placeholder);
        options.forEach(function (choice) {
          var option = root.document.createElement('option');
          option.value = choice.value;
          option.textContent = choice.name;
          optionNodes.appendChild(option);
        });
      }
      els.acpModel.replaceChildren(optionNodes);
      if (hasOptions) {
        var draftKey = modelKey(row.id, selectedTransport);
        var draft = modelDrafts[draftKey];
        var choice = options.find(function (item) { return item.value === draft; });
        if (!choice && configuration.currentModel != null) {
          choice = options.find(function (item) { return item.value === String(configuration.currentModel); });
        }
        if (!choice && boundModel) choice = options.find(function (item) { return item.value === boundModel; });
        els.acpModel.value = choice ? choice.value : '';
        if (choice) modelDrafts[draftKey] = choice.value;
      } else {
        els.acpModel.value = '';
      }
      els.acpModel.dataset.renderKey = optionSignature;
    }
    els.acpModelGroup.hidden = !hasOptions;
    els.acpModel.disabled = actionBusy || loading || !idle || !!(configuration && configuration.busy === true);
    if (hasOptions) {
      els.acpModel.setAttribute('aria-describedby', 'ob-executor-switch-acp-status');
      els.acpStatus.id = 'ob-executor-switch-acp-status';
    } else {
      els.acpModel.removeAttribute('aria-describedby');
    }

    var authSignature = configuration && acpConfigurationContext
      ? acpConfigurationContext + '|auth|' + JSON.stringify(authMethods)
      : 'empty|' + (binding ? acpContextKey(binding) : '');
    if (els.acpAuthMethod.dataset.renderKey !== authSignature) {
      var authNodes = root.document.createDocumentFragment();
      var authPlaceholder = root.document.createElement('option');
      authPlaceholder.value = '';
      authPlaceholder.textContent = t('选择登录方式…', 'Choose a sign-in method…');
      authNodes.appendChild(authPlaceholder);
      authMethods.forEach(function (method) {
        var option = root.document.createElement('option');
        option.value = method.id;
        option.textContent = method.name;
        authNodes.appendChild(option);
      });
      els.acpAuthMethod.replaceChildren(authNodes);
      var authChoice = authMethods.find(function (method) { return method.id === acpAuthMethodId; });
      els.acpAuthMethod.value = authChoice ? authChoice.id : '';
      if (configuration && configuration.authentication === 'required') acpAuthMethodId = authChoice ? authChoice.id : '';
      els.acpAuthMethod.dataset.renderKey = authSignature;
    }
    els.acpAuthMethodGroup.hidden = !showAuth;
    els.acpAuthMethod.disabled = actionBusy || loading || !idle || !!(configuration && configuration.busy === true);
    els.acpAuthNote.hidden = !showAuth;
    if (showAuth) {
      els.acpAuthMethod.setAttribute('aria-describedby', 'ob-executor-switch-acp-auth-note');
      els.acpLogin.setAttribute('aria-describedby', 'ob-executor-switch-acp-auth-note');
    } else {
      els.acpAuthMethod.removeAttribute('aria-describedby');
      els.acpLogin.removeAttribute('aria-describedby');
    }

    var details = [];
    if (configuration && configuration.initialized === true && configuration.authentication !== 'required') {
      if (configuration.authentication === 'authenticated') {
        details.push(t('已登录；订阅调用仍待验证', 'Signed in; plan access is still unverified'));
      } else {
        details.push(t('会话已建立，订阅调用待验证', 'Session established; plan access is still unverified'));
      }
      if (configuration.protocol) details.push(t('协议 {protocol}', 'Protocol {protocol}', { protocol: String(configuration.protocol) }));
      var agentInfo = configuration.agentInfo;
      if (agentInfo && typeof agentInfo === 'object') {
        var agentName = [agentInfo.name, agentInfo.version].filter(Boolean).map(String).join(' ');
        if (agentName) details.push(t('智能体 {name}', 'Agent {name}', { name: agentName }));
      }
    }
    els.acpDetails.textContent = details.join(' · ');
    els.acpDetails.hidden = details.length === 0;

    els.acpInitialize.hidden = !canInitialize || !!(configuration && configuration.initialized === true) ||
      acpConfigurationErrorKind === 'read';
    els.acpInitialize.textContent = acpConfigurationErrorKind === 'initialize'
      ? t('重试初始化', 'Retry initialization') : t('初始化 ACP 会话', 'Initialize ACP session');
    els.acpInitialize.disabled = !canInitialize;
    els.acpLogin.hidden = !showAuth || acpConfigurationErrorKind === 'read';
    els.acpLogin.textContent = acpConfigurationErrorKind === 'authenticate'
      ? t('重试登录', 'Retry sign-in') : t('登录', 'Sign in');
    els.acpLogin.disabled = !canAuthenticate || !currentAcpAuthMethodId();
    els.acpRetry.hidden = !isBound || !acpConfigurationError || acpConfigurationErrorKind !== 'read';
    els.acpRetry.disabled = acpConfigurationLoading || actionBusy;
    els.acpStop.hidden = !acpInitializationBusy;
    els.acpStop.textContent = acpStopError ? t('重试停止', 'Retry stop') : acpStopRequested ? t('已请求停止', 'Stop requested') :
      acpOperationKind === 'authenticate' ? t('停止登录', 'Stop sign-in') : t('停止初始化', 'Stop initialization');
    els.acpStop.disabled = acpStopBusy || acpStopRequested;
    els.acpRefresh.hidden = !isBound || !configuration ||
      (configuration.initialized !== true && !authRequired) || acpInitializationBusy;
    els.acpRefresh.disabled = acpConfigurationLoading || actionBusy;
  }

  function renderStatus() {
    var status = currentStatus();
    var busy = !!(snapshot && snapshot.busy);
    var binding = snapshot && snapshot.binding;
    var isAgui = !!binding && isAguiExecutorId(binding.executorId);
    var currentName = binding ? executorName(binding.executorId, activeBot()) : t('当前执行器', 'Current executor');
    if (binding && String(binding.executorId || '').indexOf('agent:') === 0 && binding.transport) {
      currentName += ' · ' + transportLabel(binding.transport);
    }
    var summary = '';
    if (loading && !snapshot) summary = t('{name} · 正在核对状态…', '{name} · Checking status…', { name: executorName(selectedId, activeBot()) });
    else if (!snapshot) summary = t('当前执行器状态无法读取。重试后再继续。', 'The current executor state could not be read. Retry before continuing.');
    else if (status === 'running') summary = t('{name} 正在执行。', '{name} is running.', { name: currentName });
    else if (status === 'unknown') summary = t('{name} 上一轮的结果待核对。', 'The last turn on {name} needs review.', { name: currentName });
    else if (busy) summary = t('{name} 当前正忙，暂不能保存模型设置。', '{name} is busy and cannot save model settings yet.', { name: currentName });
    else summary = t('当前：{name} · 空闲', 'Current: {name} · Idle', { name: currentName });
    if (actionNotice) summary += ' ' + actionNotice;
    els.status.textContent = summary;
    els.status.dataset.state = status;
    els.running.hidden = status !== 'running';
    if (els.runningCopy) els.runningCopy.textContent = isAgui
      ? t('正在等待外部 Agent。停止等待不会确认远端任务已停止。', 'Waiting for the external Agent. Stopping the wait does not confirm the remote task stopped.')
      : t('此 Bot 仍有一轮执行中。先停止本轮，再单独保存模型设置。', 'This Bot still has a turn running. Stop the turn, then save model settings separately.');
    els.stop.textContent = isAgui ? t('停止等待', 'Stop waiting') : t('停止本轮', 'Stop this turn');
    els.review.hidden = status !== 'unknown';
    els.stop.disabled = actionBusy || !snapshot;
    els.resolve.disabled = actionBusy || !snapshot || busy || !snapshot.state || !snapshot.state.runId ||
      !els.confirm.checked || !els.note.value.trim();
    if (status === 'unknown' && snapshot && snapshot.state) {
      var runId = String(snapshot.state.runId || '');
      if (reviewRunId !== null && runId !== reviewRunId) {
        els.confirm.checked = false;
        els.note.value = '';
      }
      reviewRunId = runId;
      var reason = String(snapshot.state.reason || '');
      els.reason.textContent = reason ? t('待核对原因：{reason}', 'Review reason: {reason}', { reason: reason.slice(0, 240) }) : '';
      els.reason.hidden = !reason;
      els.note.disabled = actionBusy || busy || !runId;
      els.confirm.disabled = actionBusy || busy || !runId;
    }
  }

  function renderError() {
    var message = actionError || (loading && !catalog.length ? '' : '');
    els.error.hidden = !message;
    els.errorText.textContent = message;
    els.retry.hidden = loading;
  }

  function render() {
    if (!opened || !dialog) return;
    renderOptions();
    renderSettings();
    renderAcpConfiguration();
    renderStatus();
    renderError();
    var row = selectedRow();
    var binding = snapshot && snapshot.binding;
    var status = currentStatus();
    var canSwitch = canSwitchCurrent();
    var needsLocalForAgui = aguiRequiresLocalExecutor(row);
    els.submit.disabled = !canSwitch;
    els.submit.textContent = actionBusy ? t('正在保存…', 'Saving…') : t('保存模型设置', 'Save model settings');
    els.cancel.disabled = false;
    var footerNote = '';
    if (status === 'running') footerNote = t('停止后仍需单独保存模型设置。', 'Stop first, then save model settings separately.');
    else if (status === 'unknown') footerNote = t('先记录人工核对结果。', 'Record a human review before changing model settings.');
    else if (needsLocalForAgui) footerNote = aguiNodeLocationMessage();
    else if (needsCodexHome(row, selectedTransport)) footerNote = t('请先在「Codex 多账号」中为此 Bot 绑定一个 Home。', 'Bind a Home to this Bot in Codex Accounts before editing App Server model settings.');
    else if (row && row.id === 'agent:codex' && selectedTransport === 'appserver') {
      footerNote = t('App Server 使用此 Bot 绑定 Home 的持续会话；留空模型沿用该 Home 的默认模型。保存不会启动新一轮。', 'App Server uses this Bot’s persistent Home session. An empty model keeps that Home’s default; saving does not start a turn.');
    } else if (row && row.available !== true) footerNote = t('此程序尚未检测到。', 'This program was not detected.');
    else if (row && binding && isAcpSelection(row, selectedTransport) && !isBoundAcpSelection(row, selectedTransport)) {
      footerNote = t('先切换到此 ACP 执行器，之后再明确初始化。', 'Switch to this ACP executor first, then initialize it explicitly.');
    }
    els.footerNote.textContent = footerNote;
    if (needsCodexHome(row, selectedTransport) && status === 'idle') {
      var openHomesBtn = make('button', 'ob-executor-switch-inline-link', t('前往 Codex 多账号绑定 Home', 'Open Codex Accounts to bind a Home'));
      openHomesBtn.type = 'button';
      openHomesBtn.dataset.executorOpenCodexHomes = 'true';
      openHomesBtn.style.marginLeft = '8px';
      openHomesBtn.addEventListener('click', function () {
        closeDialog(false);
        if (callbacks && typeof callbacks.onOpenCodexHomes === 'function') {
          callbacks.onOpenCodexHomes();
          return;
        }
        var settingsNav = root.document.querySelector('[data-nav="settings"], #nav-settings, #btn-settings');
        if (settingsNav && typeof settingsNav.click === 'function') settingsNav.click();
        setTimeout(function () {
          var appsTab = root.document.querySelector('[data-settings-tab="apps"]');
          if (appsTab && typeof appsTab.click === 'function') appsTab.click();
          var target = root.document.querySelector('#multi-codex-home-section, #multi-codex-home-root, #settings-codex-homes, [data-settings-section="codex-homes"], [data-codex-homes-root]');
          if (target && typeof target.scrollIntoView === 'function') target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      });
      els.footerNote.appendChild(openHomesBtn);
    }
    keepFocusInsideDialog();
  }

  function renderInitialSelection(preserveDraft) {
    var binding = snapshot && snapshot.binding;
    selectedId = binding && typeof binding.executorId === 'string' ? binding.executorId : '';
    selectedTransport = binding && typeof binding.transport === 'string' ? binding.transport : '';
  }

  function loadData(token, requestedBotId, preserveDraft) {
    if (preserveDraft && (loading || actionBusy)) {
      reloadPending = true;
      return;
    }
    var previousSnapshot = preserveDraft ? snapshot : null;
    var previousIdentity = apiModelIdentityKey;
    var previousBindingKey = previousSnapshot && apiBindingCacheKey(previousSnapshot.binding, previousIdentity);
    loading = true;
    actionError = '';
    if (!preserveDraft) {
      catalog = [];
      defaultExecutorId = '';
      snapshot = null;
    }
    if (preserveDraft) render();
    var data = typeof bridge.inspectExecutorSettings === 'function'
      ? callResult(bridge.inspectExecutorSettings(requestedBotId)).then(function (inspection) {
        if (inspection.botId !== requestedBotId || !inspection.row ||
            inspection.row.id !== (inspection.binding && inspection.binding.executorId))
          throw new Error(t('无法读取当前执行器。', 'Could not read the current executor.'));
        return [{ executors: [inspection.row], defaultExecutorId: 'dsh' }, inspection];
      })
      : Promise.all([callResult(bridge.listExecutors()), callResult(bridge.inspectExecutor(requestedBotId))]);
    return data.then(function (results) {
      if (!activeSession(token, requestedBotId)) return;
      var inventory = results[0];
      var inspection = results[1];
      if (expectedOwner && (!inspection || inspection.ok !== true ||
          String(inspection.botId) !== expectedOwner.botId ||
          String(inspection.binding && inspection.binding.revision) !== expectedOwner.bindingRevision ||
          !inspection.state || inspection.state.runId !== expectedOwner.runId ||
          String(inspection.state.execution && inspection.state.execution.routeKey || '') !== expectedOwner.routeKey)) {
        throw new Error(t('原执行记录或绑定已变化，请刷新健康中心后重新核查。', 'The original run or binding changed. Refresh the health center before reviewing it.'));
      }
      var nextIdentity = apiBotSettingsIdentity(activeBot());
      var nextBindingKey = apiBindingCacheKey(inspection && inspection.binding, nextIdentity);
      if (previousIdentity !== nextIdentity || (previousSnapshot && previousBindingKey !== nextBindingKey)) {
        apiSourceDraft = '';
        invalidateApiModelRequests(true);
        clearApiModelDrafts();
        invalidateAcpConfiguration();
      }
      apiModelIdentityKey = nextIdentity;
      if (!inspection || !inspection.binding || typeof inspection.binding.executorId !== 'string' || !inspection.binding.executorId) throw new Error(t('此 Bot 的执行器绑定需要核查。', 'This Bot’s executor binding needs review.'));
      catalog = Array.isArray(inventory.executors) ? inventory.executors.filter(function(row){return row.id === inspection.binding.executorId;}) : [];
      defaultExecutorId = inventory.defaultExecutorId || '';
      snapshot = inspection;
      renderInitialSelection(preserveDraft);
      var current = activeBot();
      if (current && executorIdForBot(current) === inspection.binding.executorId && !selectedId) selectedId = inspection.binding.executorId;
      loading = false;
      render();
      updateTrigger(current);
      syncAcpConfiguration(false);
    }).catch(function (error) {
      if (!activeSession(token, requestedBotId)) return;
      loading = false;
      invalidateApiModelRequests(true);
      clearApiModelDrafts();
      snapshot = null;
      actionError = String(error && error.message || error || t('读取失败，请重试。', 'Could not load the executor state. Retry.'));
      render();
    }).finally(function () {
      if (activeSession(token, requestedBotId) && reloadPending && !loading && !actionBusy) {
        reloadPending = false;
        loadData(token, requestedBotId, true);
      }
    });
  }

  function retryLoad() {
    if (!opened || loading || actionBusy) return;
    var token = epoch;
    loadData(token, botId, true);
  }

  function open(sourceTrigger, ownerTarget) {
    var bot = activeBot();
    if (!initialized || !bot || !bridge || opened) return false;
    if (ownerTarget && (String(bot.id) !== ownerTarget.botId ||
        String(bot.executorBinding && bot.executorBinding.revision) !== String(ownerTarget.bindingRevision))) return false;
    expectedOwner = ownerTarget ? Object.assign({}, ownerTarget) : null;
    opened = true;
    openerTrigger = sourceTrigger && sourceTrigger.isConnected ? sourceTrigger : null;
    botId = String(bot.id);
    epoch += 1;
    var token = epoch;
    catalog = [];
    defaultExecutorId = '';
    snapshot = null;
    selectedId = executorIdForBot(bot);
    selectedTransport = bot.executorBinding && bot.executorBinding.transport || (bot.agent && bot.agent.transport) || '';
    modelDrafts = Object.create(null);
    apiSourceDraft = '';
    var nextApiIdentity = apiBotSettingsIdentity(bot);
    invalidateApiModelRequests(apiModelIdentityKey !== nextApiIdentity || !!expectedOwner);
    apiModelIdentityKey = nextApiIdentity;
    expireApiModels();
    invalidateAcpConfiguration();
    acpInitializationBusy = false;
    acpOperationKind = '';
    acpOperationContext = null;
    acpNotice = '';
    activeOptionId = '';
    loading = true;
    reloadPending = false;
    actionBusy = false;
    actionError = '';
    actionNotice = '';
    reviewRunId = null;
    els.search.value = '';
    els.note.value = '';
    els.confirm.checked = false;
    overlay.hidden = false;
    if (composerTrigger) composerTrigger.setAttribute('aria-expanded', 'true');
    render();
    var requestedBotId = botId;
    // Let the dialog paint and accept keyboard input before requesting host data.
    root.requestAnimationFrame(function () {
      if (!activeSession(token, requestedBotId)) return;
      els.search.focus({ preventScroll: true });
      root.setTimeout(function () {
        if (activeSession(token, requestedBotId)) loadData(token, requestedBotId, false);
      }, 0);
    });
    return true;
  }

  function closeDialog(restoreFocus) {
    if (!opened) return;
    opened = false;
    expectedOwner = null;
    epoch += 1;
    invalidateApiModelRequests(false);
    loading = false;
    reloadPending = false;
    actionBusy = false;
    acpInitializationBusy = false;
    acpOperationKind = '';
    acpOperationContext = null;
    acpNotice = '';
    invalidateAcpConfiguration();
    overlay.hidden = true;
    if (composerTrigger) composerTrigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) {
      root.requestAnimationFrame(function () {
        var currentTrigger = openerTrigger && openerTrigger.isConnected
          ? openerTrigger
          : composerTrigger;
        openerTrigger = null;
        if (currentTrigger && currentTrigger.isConnected) currentTrigger.focus({ preventScroll: true });
      });
    } else {
      openerTrigger = null;
    }
  }

  function apiFailureMessage(error) {
    return String(error && error.message || error || t('操作失败。所选内容已保留，请重试。', 'The action failed. Your selection is still here; try again.'));
  }

  function perform(method, request, successMessage, after) {
    if (!opened || actionBusy) return;
    var token = epoch;
    var requestedBotId = botId;
    actionBusy = true;
    actionError = '';
    actionNotice = '';
    render();
    callResult(bridge[method](request)).then(function (result) {
      if (!activeSession(token, requestedBotId)) return;
      var priorBinding = snapshot && snapshot.binding;
      snapshot = { ...result, apiSources: result.apiSources || snapshot?.apiSources };
      actionBusy = false;
      actionNotice = successMessage;
      var bindingChanged = method === 'switchExecutor' && priorBinding && result.binding &&
        (priorBinding.executorId !== result.binding.executorId || priorBinding.transport !== result.binding.transport ||
          priorBinding.generation !== result.binding.generation || priorBinding.revision !== result.binding.revision);
      if (bindingChanged) {
        invalidateAcpConfiguration();
        invalidateApiModelRequests(true);
        clearApiModelDrafts();
      }
      if (after) after(result);
      var current = activeBot();
      updateTrigger(current);
      render();
      if (bindingChanged) syncAcpConfiguration(false);
    }).catch(function (error) {
      if (!activeSession(token, requestedBotId)) return;
      actionBusy = false;
      invalidateApiModelRequests(true);
      clearApiModelDrafts();
      if (!request.providerId) snapshot = null;
      actionError = apiFailureMessage(error);
      actionNotice = '';
      render();
    }).finally(function () {
      if (activeSession(token, requestedBotId) && reloadPending && !loading && !actionBusy) {
        reloadPending = false;
        loadData(token, requestedBotId, true);
      }
    });
  }

  function refreshInspectionAfterAcpFailure(context, refreshConfiguration, kind) {
    if (!bridge || typeof bridge.inspectExecutor !== 'function' || !acpContextIdentityStillCurrent(context)) return;
    callResult(bridge.inspectExecutor(context.botId)).then(function (inspection) {
      if (!acpContextIdentityStillCurrent(context)) return;
      var binding = inspection && inspection.binding;
      if (!binding || binding.executorId !== context.executorId || binding.transport !== context.transport ||
          binding.generation !== context.generation) {
        snapshot = inspection || null;
        actionError = kind === 'authenticate'
          ? t('登录期间绑定已变化。请重新读取当前执行器状态。', 'The binding changed during sign-in. Read the current executor state again.')
          : t('初始化期间绑定已变化。请重新读取当前执行器状态。', 'The binding changed during initialization. Read the current executor state again.');
        render();
        return;
      }
      snapshot = inspection;
      render();
      if (refreshConfiguration) readAcpConfiguration(true, true);
    }).catch(function (error) {
      if (!acpContextIdentityStillCurrent(context)) return;
      snapshot = null;
      actionError = apiFailureMessage(error);
      render();
    });
  }

  function runAcpOperation(kind, methodId) {
    var authenticating = kind === 'authenticate';
    var binding = snapshot && snapshot.binding;
    var row = selectedRow();
    var configuration = currentAcpConfiguration();
    if (!isBoundAcpSelection(row, selectedTransport) || !binding || currentStatus() !== 'idle' ||
        snapshot.busy === true || loading || actionBusy || acpConfigurationLoading ||
        (configuration && configuration.busy === true) || !Number.isSafeInteger(binding.revision)) return;
    var methods = acpAuthMethodOptions(configuration);
    if (authenticating && (!methodId || !methods.some(function (method) { return method.id === methodId; }))) return;
    var method = authenticating ? 'authenticateExecutor' : 'initializeExecutor';
    if (!bridge || typeof bridge[method] !== 'function') {
      acpConfigurationError = authenticating
        ? t('ACP 登录接口不可用。', 'ACP sign-in is unavailable.')
        : t('ACP 初始化接口不可用。', 'ACP initialization is unavailable.');
      acpConfigurationErrorKind = kind;
      render();
      return;
    }

    var sequence = ++acpConfigurationSequence;
    var context = captureAcpContext(sequence);
    acpOperationContext = context;
    if (!authenticating) {
      acpConfiguration = null;
      acpConfigurationContext = '';
    }
    acpConfigurationError = '';
    acpConfigurationErrorKind = '';
    acpConfigurationLoading = false;
    acpInitializationBusy = true;
    acpOperationKind = kind;
    acpStopBusy = false;
    acpStopRequested = false;
    acpStopError = '';
    acpNotice = '';
    actionBusy = true;
    actionError = '';
    actionNotice = '';
    render();

    var request = { botId: context.botId, expectedRevision: context.revision };
    if (authenticating) request.methodId = methodId;
    callResult(bridge[method](request)).then(function (result) {
      if (!acpContextStillCurrent(context, false)) return;
      var operatedBinding = result.binding;
      if (!operatedBinding || operatedBinding.executorId !== context.executorId ||
          operatedBinding.transport !== context.transport || operatedBinding.generation !== context.generation ||
          !Number.isSafeInteger(operatedBinding.revision) || operatedBinding.revision <= context.revision) {
        throw new Error(authenticating
          ? t('登录没有返回更新后的绑定版本。请读取当前状态后重试。', 'Sign-in did not return a newer binding revision. Read the current state before retrying.')
          : t('初始化没有返回更新后的绑定版本。请读取当前状态后重试。', 'Initialization did not return a newer binding revision. Read the current state before retrying.'));
      }
      return callResult(bridge.inspectExecutor(context.botId)).then(function (inspection) {
        if (!acpContextStillCurrent(context, false)) return;
        var inspectedBinding = inspection && inspection.binding;
        if (!inspectedBinding || inspectedBinding.executorId !== context.executorId ||
            inspectedBinding.transport !== context.transport || inspectedBinding.generation !== context.generation ||
            !Number.isSafeInteger(inspectedBinding.revision) || inspectedBinding.revision < operatedBinding.revision) {
          throw new Error(authenticating
            ? t('登录后无法确认当前绑定。请重新读取状态。', 'The current binding could not be confirmed after sign-in. Read the state again.')
            : t('初始化后无法确认当前绑定。请重新读取状态。', 'The current binding could not be confirmed after initialization. Read the state again.'));
        }
        snapshot = inspection;
        acpInitializationBusy = false;
        acpOperationKind = '';
        actionBusy = false;
        acpOperationContext = null;
        acpNotice = '';
        actionNotice = '';
        invalidateAcpConfiguration();
        render();
        readAcpConfiguration(true);
      });
    }).catch(function (error) {
      if (!acpContextStillCurrent(context, false)) return;
      acpConfigurationSequence += 1;
      acpConfigurationLoading = false;
      if (!authenticating) {
        acpConfiguration = null;
        acpConfigurationContext = '';
      }
      acpConfigurationError = apiFailureMessage(error);
      acpConfigurationErrorKind = kind;
      acpInitializationBusy = false;
      acpOperationKind = '';
      acpStopBusy = false;
      acpStopRequested = false;
      acpStopError = '';
      acpOperationContext = null;
      actionBusy = false;
      acpNotice = '';
      render();
      refreshInspectionAfterAcpFailure(context, authenticating, kind);
    });
  }

  function initializeAcp() {
    runAcpOperation('initialize', '');
  }

  function authenticateAcp() {
    runAcpOperation('authenticate', currentAcpAuthMethodId());
  }

  function stopAcpInitialization() {
    var context = acpOperationContext;
    if (!acpInitializationBusy || !context || acpStopBusy || acpStopRequested ||
        !bridge || typeof bridge.stopExecutor !== 'function' || !acpContextStillCurrent(context, false)) return;
    acpStopBusy = true;
    acpStopError = '';
    render();
    callResult(bridge.stopExecutor(context.botId)).then(function (result) {
      if (!acpContextStillCurrent(context, false)) return;
      var binding = result.binding;
      if (!binding || binding.executorId !== context.executorId || binding.transport !== context.transport ||
          binding.generation !== context.generation) return;
      snapshot = result;
      acpStopBusy = false;
      acpStopRequested = true;
      acpNotice = t('已请求停止当前操作；等待宿主确认状态。',
        'Stop requested. Waiting for the host to confirm the current state.');
      render();
    }).catch(function (error) {
      if (!acpContextStillCurrent(context, false)) return;
      acpStopBusy = false;
      acpStopRequested = false;
      acpStopError = apiFailureMessage(error);
      render();
    });
  }

  function retryAcpConfiguration() {
    if (acpConfigurationErrorKind === 'initialize') initializeAcp();
    else if (acpConfigurationErrorKind === 'authenticate') authenticateAcp();
    else if (acpConfigurationErrorKind === 'read') readAcpConfiguration(true);
  }

  function onAcpModelChange() {
    var row = selectedRow();
    if (!row || !isBoundAcpSelection(row, selectedTransport)) return;
    var options = acpModelOptions(currentAcpConfiguration());
    var value = String(els.acpModel.value || '');
    if (value && !options.some(function (choice) { return choice.value === value; })) return;
    modelDrafts[modelKey(row.id, selectedTransport)] = value;
    acpNotice = '';
    if (acpConfigurationError) {
      acpConfigurationError = '';
      acpConfigurationErrorKind = '';
    }
    render();
  }

  function onAcpAuthMethodChange() {
    var methods = acpAuthMethodOptions(currentAcpConfiguration());
    var methodId = String(els.acpAuthMethod.value || '');
    if (methodId && !methods.some(function (method) { return method.id === methodId; })) return;
    acpAuthMethodId = methodId;
    acpNotice = '';
    if (acpConfigurationErrorKind === 'authenticate') {
      acpConfigurationError = '';
      acpConfigurationErrorKind = '';
    }
    render();
  }

  function stopTurn() {
    if (!snapshot || !snapshot.binding || currentStatus() !== 'running') return;
    actionNotice = '';
    var agui = isAguiExecutorId(snapshot.binding.executorId);
    perform('stopExecutor', botId, agui
      ? t('已停止本机等待；远端任务是否停止尚未确认。请核对结果。', 'Local waiting stopped; the remote task may still be running. Review its outcome.')
      : t('停止请求已返回；请按当前状态继续。', 'The stop request returned. Continue based on the current state.'));
  }

  function resolveUnknown() {
    if (!snapshot || !snapshot.binding || !snapshot.state || currentStatus() !== 'unknown') return;
    var note = String(els.note.value || '').trim();
    if (!els.confirm.checked || !note || !snapshot.state.runId) return;
    var request = {
      botId: botId,
      runId: snapshot.state.runId,
      expectedRevision: snapshot.binding.revision,
      confirmed: true,
      note: note
    };
    perform('resolveExecutor', request, t('核对记录已保存。现在可以发送新消息。', 'Review recorded. You can now send a new message.'), function () {
      els.note.value = '';
      els.confirm.checked = false;
    });
  }

  function switchExecutor() {
    var row = selectedRow();
    var binding = snapshot && snapshot.binding;
    if (!row || !binding || row.available !== true || currentStatus() !== 'idle' || snapshot.busy === true) return;
    if (aguiRequiresLocalExecutor(row)) {
      actionError = aguiNodeLocationMessage();
      render();
      return;
    }
    var transport = row.kind === 'native' ? selectedTransport : '';
    if (row.id !== binding.executorId || transport !== String(binding.transport || '')) return;
    if (needsCodexHome(row, transport)) {
      actionError = t('请先在「Codex 多账号」中为此 Bot 绑定一个 Home。', 'Bind a Home to this Bot in Codex Accounts before editing App Server model settings.');
      render();
      return;
    }
    var planContext = planContextForSelection(row, transport);
    var planCache = planModelCacheFor(planContext);
    var planModelValue = String(els.planModelSelect && els.planModelSelect.value || '');
    if (planContext && (planContext.authKind !== 'chatgpt-plan' || !planContext.enabled ||
        !planCache || !Array.isArray(planCache.models) ||
        !planCache.models.some(function (item) { return item.id === planModelValue; }))) {
      actionError = t('请先确认此 Home 的订阅许可并刷新可用模型。', 'Confirm this Home’s plan access and refresh its available models first.');
      render();
      return;
    }
    var model = '';
    if (isAcpSelection(row, transport)) model = currentAcpModelValue();
    else if (planContext) model = planModelValue;
    else if (row.kind === 'api') {
      var apiContext = apiModelContextFor(row);
      var apiRecord = apiContext && apiModelCache[apiContext.key];
      model = String(els.apiModelSelect && els.apiModelSelect.value || '');
      if (!apiRecord || apiRecord.status !== 'ready' || !Array.isArray(apiRecord.models) ||
          !apiRecord.models.some(function (item) { return item.id === model; })) {
        actionError = t('请选择当前 API 配置提供的可用模型。', 'Choose a model offered by the current API configuration.');
        render();
        if (apiRecord && apiRecord.status === 'error') els.apiModelRefresh.focus({ preventScroll: true });
        else if (!els.apiModelSelect.disabled) els.apiModelSelect.focus({ preventScroll: true });
        return;
      }
    } else if (modelSupports(row, transport)) model = String(els.model.value || '').trim();
    var requestId = root.crypto && typeof root.crypto.randomUUID === 'function'
      ? root.crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    var request = {
      botId: botId,
      executorId: row.id,
      expectedRevision: binding.revision,
      requestId: requestId
    };
    if (transport) request.transport = transport;
    if (row.id === 'agent:codex' && transport === 'appserver' && binding.executorId === 'agent:codex' && binding.codexHomeId) request.codexHomeId = binding.codexHomeId;
    if (model) request.model = model;
    if (row.kind === 'api' && apiContext?.providerId) request.providerId = apiContext.providerId;
    perform('switchExecutor', request, t('模型设置已保存。', 'Model settings saved.'), function (result) {
      if (result.binding) {
        apiSourceDraft = '';
        selectedId = result.binding.executorId;
        selectedTransport = result.binding.transport || '';
        modelDrafts[modelKey(selectedId, selectedTransport)] = String(result.binding.model || '');
        activeOptionId = selectedId;
      }
    });
  }

  function onTransportChange() {
    selectedTransport = snapshot && snapshot.binding ? String(snapshot.binding.transport || '') : '';
    if (els.transport) els.transport.value = selectedTransport;
  }

  function onModelInput() {
    var row = selectedRow();
    if (!row) return;
    modelDrafts[modelKey(row.id, selectedTransport)] = els.model.value;
    if (actionError) { actionError = ''; renderError(); }
    if (els.submit) els.submit.disabled = !canSwitchCurrent();
  }

  function onApiModelChange() {
    var row = selectedRow();
    var context = apiModelContextFor(row);
    var record = context && apiModelCache[context.key];
    var value = String(els.apiModelSelect && els.apiModelSelect.value || '');
    if (!row || !record || record.status !== 'ready' || !Array.isArray(record.models) ||
        (value && !record.models.some(function (item) { return item.id === value; }))) return;
    var key = apiModelDraftKey(row.id, context?.providerId);
    if (value) modelDrafts[key] = value;
    else delete modelDrafts[key];
    actionError = '';
    render();
  }

  function canSwitchCurrent() {
    var row = selectedRow();
    var binding = snapshot && snapshot.binding;
    var status = currentStatus();
    if (!row || row.available !== true || !binding || status !== 'idle' || snapshot.busy === true ||
        loading || actionBusy || !Number.isSafeInteger(binding.revision)) return false;
    if (aguiRequiresLocalExecutor(row)) return false;
    var targetTransport = row.kind === 'native' ? selectedTransport : '';
    if (row.id !== binding.executorId || targetTransport !== String(binding.transport || '')) return false;
    if (needsCodexHome(row, targetTransport)) return false;
    var sameBinding = binding.executorId === row.id && String(binding.transport || '') === String(targetTransport);
    var planContext = planContextForSelection(row, targetTransport);
    if (planContext) {
      var planCache = planModelCacheFor(planContext);
      var planModel = String(els.planModelSelect && els.planModelSelect.value || '');
      if (planContext.authKind !== 'chatgpt-plan' || !planContext.enabled || !planCache ||
          !Array.isArray(planCache.models) || !planCache.models.some(function (item) { return item.id === planModel; })) return false;
      return !(sameBinding && String(binding.model || '') === planModel);
    }
    if (isAcpSelection(row, targetTransport)) {
      if (!sameBinding) return true;
      var acpModel = currentAcpModelValue();
      return !!acpModel && String(binding.model || '') !== acpModel;
    }
    if (row.kind === 'api') {
      var apiContext = apiModelContextFor(row);
      var apiRecord = apiContext && apiModelCache[apiContext.key];
      var apiModel = String(els.apiModelSelect && els.apiModelSelect.value || '');
      if (!apiRecord || apiRecord.status !== 'ready' || !Array.isArray(apiRecord.models) ||
          !apiRecord.models.some(function (item) { return item.id === apiModel; })) return false;
      return !!apiContext.providerId || !(sameBinding && String(binding.model || '') === apiModel);
    }
    var supports = row && modelSupports(row, selectedTransport);
    var model = supports ? String(els.model.value || '').trim() : '';
    var noChange = sameBinding && (!supports || String(binding.model || '') === model);
    return !(row.kind === 'api' && supports && !model) && !noChange;
  }

  function onDialogKeydown(event) {
    if (!opened || !dialog) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeDialog(true);
      return;
    }
    if (event.key !== 'Tab') return;
    var focusable = focusableInDialog();
    if (!focusable.length) { event.preventDefault(); return; }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (!dialog.contains(root.document.activeElement)) { event.preventDefault(); first.focus({ preventScroll: true }); return; }
    if (event.shiftKey && root.document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && root.document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function focusableInDialog() {
    if (!dialog) return [];
    return Array.prototype.slice.call(dialog.querySelectorAll('button:not(:disabled):not([hidden]), input:not(:disabled):not([hidden]), select:not(:disabled):not([hidden]), textarea:not(:disabled):not([hidden])'))
      .filter(function (node) { return node.getClientRects().length > 0; });
  }

  function keepFocusInsideDialog() {
    if (!opened || !dialog || dialog.contains(root.document.activeElement)) return;
    var focusable = focusableInDialog();
    var target = els.search && !els.search.disabled && els.search.getClientRects().length > 0
      ? els.search : focusable[0];
    if (target) target.focus({ preventScroll: true });
  }

  function onDocumentFocus(event) {
    if (opened && dialog && !dialog.contains(event.target)) keepFocusInsideDialog();
  }

  function onStateChanged() {
    var bot = activeBot();
    var nextApiIdentity = apiBotSettingsIdentity(bot);
    if (apiModelIdentityKey !== nextApiIdentity) {
      apiSourceDraft = '';
      invalidateApiModelRequests(true);
      clearApiModelDrafts();
      apiModelIdentityKey = nextApiIdentity;
    }
    if (opened) {
      var token = epoch;
      var requestedBotId = botId;
      loadData(token, requestedBotId, true);
    }
    updatePlanIndicator(bot, false);
  }

  function onExecutorConfigChanged() {
    invalidateApiModelRequests(true);
    clearApiModelDrafts();
    apiModelIdentityKey = apiBotSettingsIdentity(activeBot());
    if (!opened) return;
    if (loading) { reloadPending = true; return; }
    if (selectedRow() && selectedRow().kind === 'api') loadData(epoch, botId, true);
    else render();
  }

  function sync() {
    if (!initialized) return;
    var bot = activeBot();
    var nextId = bot ? String(bot.id) : '';
    var nextApiIdentity = apiBotSettingsIdentity(bot);
    var apiIdentityChanged = apiModelIdentityKey !== nextApiIdentity;
    if (opened && (!bot || !callbacks.isChatView || callbacks.isChatView() !== true || botId !== nextId)) closeDialog(false);
    if (botId === nextId && apiIdentityChanged) {
      invalidateApiModelRequests(true);
      clearApiModelDrafts();
    }
    if (botId && botId !== nextId) {
      invalidateApiModelRequests(true);
      clearApiModelDrafts();
      catalog = [];
      snapshot = null;
      selectedId = '';
      selectedTransport = '';
      modelDrafts = Object.create(null);
    }
    if (!bot || !bridge || !callbacks.isChatView || callbacks.isChatView() !== true) {
      updatePlanIndicator(bot, false);
      if (composerTrigger && composerTrigger.isConnected) composerTrigger.remove();
      composerTrigger = null;
      return;
    }
    botId = nextId;
    apiModelIdentityKey = nextApiIdentity;
    mountTrigger(bot);
    if (apiIdentityChanged && opened) {
      loadData(epoch, botId, true);
    }
    updatePlanIndicator(bot, false);
  }

  function init(options) {
    if (initialized) return;
    callbacks = options || {};
    bridge = callbacks.bridge || root.grokbot || null;
    if (!bridge || typeof bridge.listExecutors !== 'function') return;
    initialized = true;
    bindPlanIndicatorActions();
    makeDialog();
    root.document.addEventListener('keydown', onDialogKeydown, true);
    root.document.addEventListener('focusin', onDocumentFocus, true);
    var header = root.document.getElementById('bot-header');
    sync();
    if (header && root.MutationObserver) {
      observer = new root.MutationObserver(function () { sync(); });
      observer.observe(header, { childList: true });
    }
    if (!subscribed && typeof bridge.onStateChanged === 'function') {
      subscribed = true;
      bridge.onStateChanged(onStateChanged);
    }
    if (!apiModelsConfigSubscribed && typeof bridge.onConfigChanged === 'function') {
      apiModelsConfigSubscribed = true;
      bridge.onConfigChanged(onExecutorConfigChanged);
    }
    if (!planIndicatorSubscribed && typeof bridge.onMultiCodexHomeChanged === 'function') {
      planIndicatorSubscribed = true;
      bridge.onMultiCodexHomeChanged(function () { updatePlanIndicator(activeBot(), true); });
    }
  }

  root.OpenBotExecutorSwitch = {
    init: init,
    sync: sync,
    open: open,
    close: closeDialog
  };
})(window);
