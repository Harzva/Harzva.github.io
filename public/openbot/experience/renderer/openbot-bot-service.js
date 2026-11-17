(function (root) {
  'use strict';

  function tr(zh, en, params) {
    return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en, params) : zh;
  }
  function byId(id) { return root.document.getElementById(id); }
  function isAppsVisible() {
    return !!(panel && !panel.hidden && settingsMask && !settingsMask.classList.contains('hidden'));
  }
  function element(tag, className, text) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  var panel, settingsMask, statusMessage, serviceStateLabel, portInput, agUiEnabledInput, botSelect, publishButton;
  var publicationsHost, emptyPublications, tokenDialog, tokenInput, tokenStatus, returnFocus;
  var returnFocusPublicationId = '';
  var snapshot = null, loaded = false, pending = false, portDirty = false;
  var drafts = Object.create(null), confirmation = null;

  var unavailableReasons = {
    CLI_ACP_UNSUPPORTED: ['CLI/ACP 执行器尚不支持 BOT 服务。', 'CLI/ACP Bots are not supported by the BOT service.'],
    REMOTE_BOT_UNSUPPORTED: ['远程 BOT 暂不支持本机服务发布。', 'Remote Bots cannot be published by the local service.'],
    MODEL_UNCONFIGURED: ['BOT 尚未配置可用模型。', 'Configure an available model for this BOT first.'],
    HARNESS_UNSUPPORTED: ['当前执行器尚不支持 BOT 服务发布。', 'This execution harness is not supported by the BOT service.']
  };

  var errorTranslations = {
    INVALID_ARGUMENT: ['输入无效，请检查名称、端口、权限和配额。', 'The settings are invalid. Check the name, port, permissions, and quota.'],
    PRIVATE_STATE_REQUIRED: ['服务目录权限不安全；服务未开放。请检查私有目录后重试。', 'The service directory permissions are unsafe. No service was opened. Check the private directory and try again.'],
    STATE_UNAVAILABLE: ['服务配置无法安全读取；服务未开放。请恢复私有配置后重试。', 'The service configuration could not be read safely. No service was opened. Restore the private configuration and try again.'],
    STATE_WRITE_FAILED: ['服务配置保存失败，请检查目录后重试。', 'The service configuration could not be saved. Check the directory and try again.'],
    SERVICE_CLOSED: ['服务管理器已关闭，请重新打开 Bot Studio。', 'The service manager has closed. Reopen Bot Studio and try again.'],
    STOP_REQUIRED: ['请先停止服务，再修改监听端口。', 'Stop the service before changing its port.'],
    SERVICE_RELOAD_FAILED: ['服务配置更新失败，入口已停止。请刷新状态后重试。', 'The service configuration update failed and the listener stopped. Refresh the status and try again.'],
    EADDRINUSE: ['监听端口已被占用，请修改端口后重试。', 'The port is already in use. Choose another port and try again.'],
    SERVICE_START_FAILED: ['服务启动失败，请检查 BOT 配置和私有服务目录后重试。', 'The service could not start. Check the BOT configuration and private service directory, then try again.'],
    PUBLICATION_REQUIRED: ['请先选择并发布一个可用的本机 API BOT。', 'Publish an available local API BOT first.'],
    BOT_NOT_FOUND: ['该 BOT 不存在或已不可用，请刷新列表。', 'This BOT no longer exists or is unavailable. Refresh the list.'],
    CLI_ACP_UNSUPPORTED: ['CLI/ACP 执行器尚不支持 BOT 服务。', 'CLI/ACP Bots are not supported by the BOT service.'],
    REMOTE_BOT_UNSUPPORTED: ['远程 BOT 暂不支持本机服务发布。', 'Remote Bots cannot be published by the local service.'],
    HARNESS_UNSUPPORTED: ['当前执行器尚不支持 BOT 服务发布。', 'This execution harness is not supported by the BOT service.'],
    MODEL_UNCONFIGURED: ['BOT 尚未配置可用模型。', 'Configure an available model for this BOT first.'],
    PUBLICATION_NOT_FOUND: ['服务发布记录不存在，请刷新列表。', 'The publication no longer exists. Refresh the list.'],
    GRANT_NOT_FOUND: ['调用者不存在或已撤销，请刷新列表。', 'The caller no longer exists or has already been revoked. Refresh the list.']
  };

  function isEnglish() {
    return root.OpenBotI18n && root.OpenBotI18n.locale === 'en';
  }
  function reasonText(code) {
    var entry = unavailableReasons[String(code || '')];
    return entry ? tr(entry[0], entry[1]) : (code ? tr('暂不可发布（{code}）', 'Unavailable ({code})', { code: String(code) }) : tr('暂不可发布', 'Unavailable'));
  }
  function formatError(error) {
    var code = error && String(error.code || '');
    var message = error && String(error.message || '');
    if (code && errorTranslations[code]) {
      var pair = errorTranslations[code];
      return (isEnglish() ? pair[1] : (message || pair[0])) + ' [' + code + ']';
    }
    if (code) {
      return (isEnglish() ? 'The request failed. Refresh the service status and try again.' : (message || '操作失败，请刷新状态后重试。')) + ' [' + code + ']';
    }
    return message || tr('操作失败，请刷新状态后重试。', 'The request failed. Refresh the service status and try again.');
  }
  function formatStatusError(value) {
    var message = String(value || '');
    if (!isEnglish()) return message;
    if (message.indexOf('配置无法安全读取') >= 0) return 'The service configuration could not be read safely. No listener was opened. Restore the private configuration and restart OpenBot.';
    if (message.indexOf('配置更新未成功') >= 0) return 'The service configuration update failed and the listener stopped. Try starting it again.';
    if (message.indexOf('回滚未完成') >= 0) return 'Credential rollback did not finish and the service stopped. Restore the private configuration before restarting.';
    return 'The service reported an error. Refresh the status and try again.';
  }
  function showMessage(message, state) {
    if (!statusMessage) return;
    statusMessage.textContent = message || '';
    statusMessage.dataset.state = state || 'idle';
  }
  function failFromResult(result) {
    var error = new Error(result && result.message ? String(result.message) : 'Request failed');
    if (result && result.code) error.code = String(result.code);
    throw error;
  }
  function statusShape(value) {
    return !!(value && value.ok === true && typeof value.running === 'boolean');
  }
  function readBridgeMethod(name) {
    var bridge = root.grokbot;
    if (!bridge || typeof bridge[name] !== 'function') {
      var error = new Error('BOT service bridge is unavailable');
      error.code = 'BOT_SERVICE_BRIDGE_UNAVAILABLE';
      throw error;
    }
    return bridge[name].bind(bridge);
  }
  function takeSnapshot(value) {
    if (!statusShape(value)) failFromResult(value || { code: 'BOT_SERVICE_STATUS_INVALID', message: '服务状态格式无效。' });
    snapshot = value;
    loaded = true;
    render();
  }
  function formatNumber(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
    return root.OpenBotI18n ? root.OpenBotI18n.number(value) : String(value);
  }
  function formatTime(value) {
    if (!value) return '—';
    var date = new Date(value);
    if (!Number.isFinite(date.getTime())) return String(value);
    try {
      return date.toLocaleString(root.OpenBotI18n ? root.OpenBotI18n.locale : 'zh-CN', {
        year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (_) { return date.toISOString(); }
  }
  function setDisabledState(button, disabled) {
    if (!button) return;
    button.setAttribute('data-disabled-state', disabled ? 'true' : 'false');
  }
  function syncActions() {
    root.document.querySelectorAll('#bot-service-settings [data-bot-service-action]').forEach(function (button) {
      button.disabled = pending || button.getAttribute('data-disabled-state') === 'true';
    });
    if (botSelect) botSelect.disabled = pending || !loaded;
    if (publicationsHost) publicationsHost.querySelectorAll('.bot-service-grant-form input').forEach(function (input) {
      var publication = snapshot && snapshot.publications && snapshot.publications.find(function (item) {
        return item.id === input.form.getAttribute('data-publication-id');
      });
      input.disabled = pending || !loaded || !publication || !publication.available;
    });
  }
  function renderServiceState() {
    if (!serviceStateLabel) return;
    if (!loaded || !snapshot) {
      serviceStateLabel.textContent = tr('尚未读取', 'Not checked');
      serviceStateLabel.dataset.state = 'idle';
      return;
    }
    var running = !!snapshot.running;
    serviceStateLabel.textContent = running
      ? tr('运行中 · 端口 {port}', 'Running · port {port}', { port: snapshot.port })
      : tr('已停止 · 端口 {port}', 'Stopped · port {port}', { port: snapshot.port });
    serviceStateLabel.dataset.state = running ? 'ready' : 'idle';
  }
  function renderMetrics() {
    var metrics = snapshot && snapshot.metrics || {};
    byId('bot-service-requests').textContent = formatNumber(metrics.requests);
    byId('bot-service-failures').textContent = formatNumber(metrics.failures);
    byId('bot-service-in-flight').textContent = formatNumber(metrics.inFlight);
    byId('bot-service-last-access').textContent = formatTime(metrics.lastAccessAt);
    var url = snapshot && typeof snapshot.url === 'string' ? snapshot.url : '';
    byId('bot-service-base-url').textContent = url;
    setDisabledState(byId('bot-service-copy-base'), !url);
  }
  function syncPort() {
    var running = !!(snapshot && snapshot.running);
    if (loaded && snapshot && !portDirty) portInput.value = String(snapshot.port || 4818);
    portInput.disabled = pending || running;
    var valid = portInput.checkValidity() && Number.isInteger(Number(portInput.value));
    setDisabledState(byId('bot-service-configure'), !loaded || running || !portDirty || !valid);
  }
  function renderAgUiSetting() {
    if (!agUiEnabledInput) return;
    agUiEnabledInput.checked = !!(loaded && snapshot && snapshot.agUiEnabled === true);
    setDisabledState(agUiEnabledInput, !loaded || !snapshot || !!snapshot.running);
  }
  function findBot(id) {
    return (snapshot && Array.isArray(snapshot.bots) ? snapshot.bots : []).find(function (bot) { return bot.id === id; });
  }
  function publishedBotIds() {
    return new Set((snapshot && Array.isArray(snapshot.publications) ? snapshot.publications : []).map(function (publication) { return publication.botId; }));
  }
  function renderBots() {
    var selected = botSelect.value;
    var published = publishedBotIds();
    var placeholder = element('option', '', tr('选择 BOT…', 'Select a BOT…'));
    placeholder.value = '';
    botSelect.replaceChildren(placeholder);
    var bots = snapshot && Array.isArray(snapshot.bots) ? snapshot.bots : [];
    bots.forEach(function (bot) {
      var id = String(bot.id || '');
      var name = String(bot.name || id || tr('未命名 BOT', 'Unnamed BOT'));
      var unavailable = !bot.available;
      var alreadyPublished = published.has(id);
      var option = element('option');
      option.value = id;
      option.textContent = name + (alreadyPublished ? ' — ' + tr('已发布', 'Already published') : unavailable ? ' — ' + reasonText(bot.reason) : '');
      option.disabled = unavailable || alreadyPublished;
      if (unavailable && bot.reason) option.title = reasonText(bot.reason);
      botSelect.appendChild(option);
    });
    if (selected && Array.from(botSelect.options).some(function (option) { return option.value === selected && !option.disabled; })) botSelect.value = selected;
    else botSelect.value = '';
    if (!bots.length && loaded) {
      byId('bot-service-bot-note').textContent = tr('没有可发布的 BOT。先创建 BOT 并配置可用的本机 API 模型。', 'No Bots are available. Create a BOT and configure a local API model first.');
    } else {
      byId('bot-service-bot-note').textContent = tr('CLI/ACP、远程 BOT 和未配置模型的 BOT 不可发布。每个 BOT 只创建一条固定发布。', 'CLI/ACP Bots, remote Bots, and Bots without a configured model are unavailable. Each BOT has one publication.');
    }
    setDisabledState(publishButton, !loaded || !botSelect.value || !findBot(botSelect.value) || !findBot(botSelect.value).available);
  }
  function translatedTaskStatus(value) {
    var status = String(value || '');
    var key = status.toLowerCase();
    var known = {
      queued: ['排队中', 'Queued'], waiting: ['等待中', 'Waiting'], pending: ['等待中', 'Pending'],
      running: ['运行中', 'Running'], in_progress: ['运行中', 'In progress'], 'in-progress': ['运行中', 'In progress'],
      completed: ['已完成', 'Completed'], done: ['已完成', 'Done'], succeeded: ['已完成', 'Completed'], success: ['已完成', 'Completed'],
      failed: ['失败', 'Failed'], error: ['失败', 'Failed'], interrupted: ['已中断', 'Interrupted'], cancelled: ['已取消', 'Cancelled'], canceled: ['已取消', 'Cancelled'],
      needs_approval: ['等待批准', 'Needs approval'], awaiting_approval: ['等待批准', 'Awaiting approval']
    };
    return known[key] ? tr(known[key][0], known[key][1]) : status || '—';
  }
  function translatedScope(scope) {
    var value = String(scope || '');
    var key = value.toLowerCase();
    if (key === 'bot:read' || key === 'read' || key === 'read_only') return tr('只读', 'Read only');
    if (key === 'bot:invoke' || key === 'invoke' || key === 'call') return tr('调用 BOT', 'Invoke BOT');
    if (key === 'bot:cancel' || key === 'cancel') return tr('取消调用', 'Cancel calls');
    return value;
  }
  function callerPermissions(grant) {
    var scopes = Array.isArray(grant.scopes) ? grant.scopes : [];
    return scopes.length ? scopes.map(translatedScope).join(' · ') : '—';
  }
  function ensureDraft(publicationId) {
    if (!drafts[publicationId]) drafts[publicationId] = { name: '', readOnly: true, requestsPerMinute: '60' };
    return drafts[publicationId];
  }
  function saveDraft(form) {
    if (!form) return;
    var publicationId = form.getAttribute('data-publication-id');
    if (!publicationId) return;
    var draft = ensureDraft(publicationId);
    var name = form.elements.namedItem('name');
    var readOnly = form.elements.namedItem('readOnly');
    var rate = form.elements.namedItem('requestsPerMinute');
    if (name) draft.name = name.value;
    if (readOnly) draft.readOnly = readOnly.checked;
    if (rate) draft.requestsPerMinute = rate.value;
  }
  function saveAllDrafts() {
    if (!publicationsHost) return;
    publicationsHost.querySelectorAll('.bot-service-grant-form').forEach(saveDraft);
  }
  function resetDraft(publicationId) {
    drafts[publicationId] = { name: '', readOnly: true, requestsPerMinute: '60' };
    var form = Array.from(publicationsHost.querySelectorAll('.bot-service-grant-form')).find(function (item) {
      return item.getAttribute('data-publication-id') === publicationId;
    });
    if (!form) return;
    var name = form.elements.namedItem('name');
    var readOnly = form.elements.namedItem('readOnly');
    var rate = form.elements.namedItem('requestsPerMinute');
    if (name) name.value = '';
    if (readOnly) readOnly.checked = true;
    if (rate) rate.value = '60';
  }
  function createActionButton(label, action, publicationId, disabled) {
    var button = element('button', 'btn', label);
    button.type = 'button';
    button.setAttribute('data-bot-service-action', '');
    button.setAttribute('data-action', action);
    button.setAttribute('data-publication-id', publicationId);
    setDisabledState(button, !!disabled);
    return button;
  }
  function makeAddress(label, url, kind, publicationId) {
    var row = element('div', 'bot-service-address');
    row.setAttribute('data-endpoint', kind);
    row.setAttribute('data-publication-id', publicationId);
    row.appendChild(element('span', '', label));
    var code = element('code', '', url || '—');
    code.setAttribute('data-endpoint-value', kind);
    row.appendChild(code);
    var copy = createActionButton(tr('复制', 'Copy'), 'copy-' + kind, publicationId, !url);
    copy.addEventListener('click', function () { copyText(url, tr('地址已复制。', 'Address copied.')); });
    row.appendChild(copy);
    return row;
  }
  function renderRecent(publication, container) {
    var recent = Array.isArray(publication.recent) ? publication.recent.slice(0, 5) : [];
    if (!recent.length) return;
    var heading = element('div', 'bot-service-callers-heading');
    var title = element('h5', '', tr('最近请求', 'Recent requests'));
    heading.appendChild(title);
    container.appendChild(heading);
    var list = element('ul', 'bot-service-caller-list bot-service-recent-list');
    recent.forEach(function (task) {
      var item = element('li', 'bot-service-caller');
      var main = element('span', 'bot-service-caller-main');
      main.appendChild(element('span', 'bot-service-caller-name', String(task.id || '—')));
      main.appendChild(element('span', 'bot-service-caller-meta', translatedTaskStatus(task.status) + ' · ' + formatTime(task.updatedAt || task.createdAt)));
      item.appendChild(main);
      list.appendChild(item);
    });
    container.appendChild(list);
  }
  function renderGrant(publication, grant, list) {
    var item = element('li', 'bot-service-caller');
    item.setAttribute('data-publication-id', String(publication.id || ''));
    item.setAttribute('data-grant-id', String(grant.id || ''));
    var main = element('span', 'bot-service-caller-main');
    main.appendChild(element('span', 'bot-service-caller-name', String(grant.name || grant.id || '—')));
    main.appendChild(element('span', 'bot-service-caller-meta', callerPermissions(grant) + ' · ' + tr('{count} 次/分钟', '{count} requests/min', { count: formatNumber(grant.requestsPerMinute) })));
    item.appendChild(main);
    var confirmRevoke = confirmation && confirmation.action === 'revoke' && confirmation.grantId === grant.id;
    if (confirmRevoke) {
      var confirm = element('span', 'bot-service-confirm');
      confirm.appendChild(element('span', '', tr('撤销后立即拒绝新请求并取消在途任务。', 'Revoking blocks new requests and cancels this caller’s active tasks.')));
      var cancel = createActionButton(tr('取消', 'Cancel'), 'cancel-confirm', publication.id, false);
      cancel.setAttribute('data-grant-id', grant.id);
      confirm.appendChild(cancel);
      var accept = createActionButton(tr('确认撤销', 'Revoke caller'), 'revoke', publication.id, false);
      accept.setAttribute('data-grant-id', grant.id);
      confirm.appendChild(accept);
      item.appendChild(confirm);
    } else {
      var revoke = createActionButton(tr('撤销', 'Revoke'), 'arm-revoke', publication.id, false);
      revoke.setAttribute('data-grant-id', grant.id);
      item.appendChild(revoke);
    }
    list.appendChild(item);
  }
  function renderGrantForm(publication, container) {
    var form = element('form', 'bot-service-grant-form');
    form.setAttribute('data-action', 'grant');
    form.setAttribute('data-publication-id', String(publication.id || ''));
    var draft = ensureDraft(String(publication.id || ''));

    var nameLabel = element('label', 'bot-service-field');
    nameLabel.appendChild(element('span', '', tr('调用者名称', 'Caller name')));
    var name = element('input');
    name.type = 'text'; name.name = 'name'; name.maxLength = 80; name.required = true;
    name.autocomplete = 'off'; name.value = draft.name;
    name.placeholder = tr('例如：飞书后端', 'e.g. Feishu backend');
    nameLabel.appendChild(name);
    form.appendChild(nameLabel);

    var permission = element('label', 'bot-service-readonly');
    var readOnly = element('input');
    readOnly.type = 'checkbox'; readOnly.name = 'readOnly'; readOnly.checked = draft.readOnly !== false;
    permission.appendChild(readOnly);
    permission.appendChild(element('span', '', tr('只读（不允许任务调用）', 'Read only (no task invocation)')));
    form.appendChild(permission);

    var rateLabel = element('label', 'bot-service-field');
    rateLabel.appendChild(element('span', '', tr('每分钟请求数', 'Requests per minute')));
    var rate = element('input');
    rate.type = 'number'; rate.name = 'requestsPerMinute'; rate.inputMode = 'numeric'; rate.min = '10'; rate.max = '600'; rate.step = '1';
    rate.required = true; rate.value = draft.requestsPerMinute || '60';
    rateLabel.appendChild(rate);
    form.appendChild(rateLabel);

    var grant = element('button', 'btn', tr('创建调用者', 'Create caller'));
    grant.type = 'submit'; grant.setAttribute('data-bot-service-action', ''); grant.setAttribute('data-action', 'grant');
    grant.setAttribute('data-publication-id', String(publication.id || ''));
    var unavailable = !publication.available;
    setDisabledState(grant, unavailable);
    form.appendChild(grant);
    container.appendChild(form);
  }
  function renderPublication(publication) {
    var id = String(publication.id || '');
    var article = element('article', 'bot-service-publication');
    article.setAttribute('data-publication-id', id);
    var heading = element('header', 'bot-service-publication-heading');
    var title = element('span', 'bot-service-publication-title');
    title.appendChild(element('strong', '', String(publication.name || publication.botId || id)));
    if (publication.botId) title.appendChild(element('code', '', String(publication.botId)));
    heading.appendChild(title);
    var status = element('span', 'bot-service-publication-state', publication.available ? tr('可用', 'Available') : tr('不可用', 'Unavailable'));
    status.dataset.state = publication.available ? 'ready' : 'idle';
    heading.appendChild(status);
    var actions = element('div', 'bot-service-publication-actions');
    if (confirmation && confirmation.action === 'remove' && confirmation.publicationId === id) {
      var confirmRemove = element('span', 'bot-service-confirm');
      confirmRemove.appendChild(element('span', '', tr('移除会撤销此发布的所有调用者。', 'Removing this publication revokes all of its callers.')));
      var cancel = createActionButton(tr('取消', 'Cancel'), 'cancel-confirm', id, false);
      confirmRemove.appendChild(cancel);
      confirmRemove.appendChild(createActionButton(tr('确认移除', 'Remove BOT'), 'remove', id, false));
      actions.appendChild(confirmRemove);
    } else {
      actions.appendChild(createActionButton(tr('移除', 'Remove'), 'arm-remove', id, false));
    }
    heading.appendChild(actions);
    article.appendChild(heading);

    if (!publication.available) {
      var bot = findBot(publication.botId);
      article.appendChild(element('p', 'bot-service-field-note', reasonText(bot && bot.reason)));
    }

    var addresses = element('div', 'bot-service-addresses');
    addresses.appendChild(makeAddress('API', String(publication.apiUrl || ''), 'api', id));
    addresses.appendChild(makeAddress('MCP', String(publication.mcpUrl || ''), 'mcp', id));
    if (snapshot && snapshot.agUiEnabled === true && snapshot.running && typeof publication.agUiUrl === 'string' && publication.agUiUrl) {
      addresses.appendChild(makeAddress('AG-UI', publication.agUiUrl, 'ag-ui', id));
    }
    article.appendChild(addresses);

    var grants = Array.isArray(publication.grants) ? publication.grants : [];
    var callersHeading = element('div', 'bot-service-callers-heading');
    callersHeading.appendChild(element('h5', '', tr('调用者', 'Callers')));
    callersHeading.appendChild(element('span', 'bot-service-field-note', tr('可为不同客户端分别授权', 'Create a separate grant for each client')));
    article.appendChild(callersHeading);
    if (grants.length) {
      var list = element('ul', 'bot-service-caller-list');
      grants.forEach(function (grant) { renderGrant(publication, grant, list); });
      article.appendChild(list);
    } else {
      article.appendChild(element('p', 'bot-service-field-note', tr('还没有调用者。', 'No callers yet.')));
    }
    renderGrantForm(publication, article);
    renderRecent(publication, article);
    return article;
  }
  function renderPublications() {
    saveAllDrafts();
    var publications = snapshot && Array.isArray(snapshot.publications) ? snapshot.publications : [];
    publicationsHost.replaceChildren();
    emptyPublications.hidden = publications.length > 0;
    publications.forEach(function (publication) { publicationsHost.appendChild(renderPublication(publication)); });
  }
  function render() {
    renderServiceState();
    byId('bot-service-start').hidden = !!(snapshot && snapshot.running);
    byId('bot-service-stop').hidden = !loaded || !(snapshot && snapshot.running);
    setDisabledState(byId('bot-service-start'), !loaded || !snapshot || snapshot.running);
    setDisabledState(byId('bot-service-stop'), !loaded || !snapshot || !snapshot.running);
    if (loaded && snapshot && !portDirty) portInput.value = String(snapshot.port || 4818);
    renderMetrics();
    renderBots();
    renderPublications();
    renderAgUiSetting();
    syncPort();
    syncActions();
    if (snapshot && snapshot.error) showMessage(formatStatusError(snapshot.error), 'error');
  }
  async function refreshStatus() {
    if (pending) return;
    pending = true;
    showMessage(tr('正在读取服务状态…', 'Reading service status…'), 'pending');
    syncActions(); syncPort();
    try {
      var result = await readBridgeMethod('botServiceStatus')();
      if (!result || result.ok !== true) failFromResult(result || { code: 'BOT_SERVICE_STATUS_FAILED', message: '读取服务状态失败。' });
      takeSnapshot(result);
      if (snapshot.error) showMessage(formatStatusError(snapshot.error), 'error');
      else showMessage('', 'idle');
    } catch (error) {
      showMessage(formatError(error), 'error');
    } finally {
      pending = false;
      syncActions(); syncPort();
    }
  }
  async function runMutation(method, args, options) {
    options = options || {};
    if (pending) return;
    pending = true;
    showMessage(tr('正在保存…', 'Saving…'), 'pending');
    syncActions(); syncPort();
    var grantResult = null;
    try {
      var result = await readBridgeMethod(method)(args);
      if (!result || result.ok !== true) failFromResult(result || { code: 'BOT_SERVICE_ACTION_FAILED', message: '服务操作失败。' });
      var next = result.status && statusShape(result.status) ? result.status : result;
      if (next !== result && typeof result.agUiEnabled === 'boolean' && typeof next.agUiEnabled !== 'boolean') {
        next = Object.assign({}, next, { agUiEnabled: result.agUiEnabled });
      }
      if (!statusShape(next)) failFromResult(next || { code: 'BOT_SERVICE_STATUS_INVALID', message: '服务状态格式无效。' });
      if (method === 'botServiceGrant') grantResult = result;
      if (method === 'botServiceConfigure' && args && Object.prototype.hasOwnProperty.call(args, 'port')) portDirty = false;
      if (method === 'botServicePublish') botSelect.value = '';
      if (options.clearDraft) resetDraft(options.clearDraft);
      if (options.clearConfirmation) confirmation = null;
      takeSnapshot(next);
      if (method === 'botServiceGrant') {
        if (typeof result.token !== 'string' || !result.token) {
          showMessage(tr('调用者已创建，但未收到一次性令牌。请刷新并撤销该调用者后重试。', 'The caller was created, but its one-time token was not returned. Refresh and revoke that caller before retrying.'), 'error');
        } else {
          showMessage(tr('调用者已创建。请复制并安全保存令牌。', 'Caller created. Copy the token and store it securely.'), 'ok');
          showToken(result.token, args && args.publicationId);
          result.token = '';
        }
      } else if (snapshot.error) {
        showMessage(formatStatusError(snapshot.error), 'error');
      } else if (method === 'botServiceRemove') {
        showMessage(tr('BOT 发布与相关调用者已移除。', 'The BOT publication and its callers were removed.'), 'ok');
      } else if (method === 'botServiceRevoke') {
        showMessage(tr('调用者已撤销。', 'Caller revoked.'), 'ok');
      } else if (method === 'botServicePublish') {
        showMessage(tr('BOT 已发布。', 'BOT published.'), 'ok');
      } else if (method === 'botServiceStart') {
        showMessage(tr('本机服务已启动。', 'The local service started.'), 'ok');
      } else if (method === 'botServiceStop') {
        showMessage(tr('本机服务已停止。', 'The local service stopped.'), 'ok');
      } else if (method === 'botServiceConfigure') {
        if (args && typeof args.agUiEnabled === 'boolean') {
          showMessage(args.agUiEnabled ? tr('AG-UI 观察接口已启用。', 'AG-UI observation is enabled.') : tr('AG-UI 观察接口已关闭。', 'AG-UI observation is disabled.'), 'ok');
        } else {
          showMessage(tr('服务端口已保存。', 'Service port saved.'), 'ok');
        }
      }
    } catch (error) {
      if (grantResult && grantResult.status && statusShape(grantResult.status)) takeSnapshot(grantResult.status);
      showMessage(formatError(error), 'error');
    } finally {
      pending = false;
      render();
      syncActions(); syncPort();
    }
  }
  async function copyText(value, message, targetStatus) {
    if (!value) return;
    try {
      if (root.navigator.clipboard && typeof root.navigator.clipboard.writeText === 'function') {
        await root.navigator.clipboard.writeText(value);
      } else {
        var field = element('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed'; field.style.opacity = '0'; field.style.pointerEvents = 'none';
        root.document.body.appendChild(field); field.select();
        var copied = root.document.execCommand('copy');
        field.value = ''; field.remove();
        if (!copied) throw new Error('Clipboard access is unavailable');
      }
      if (targetStatus) targetStatus.textContent = message;
      else showMessage(message, 'ok');
    } catch (error) {
      var text = tr('复制失败，请手动选择并复制。', 'Could not copy. Select and copy the value manually.');
      if (targetStatus) targetStatus.textContent = text;
      else showMessage(text, 'error');
    }
  }
  function showToken(token, publicationId) {
    if (!tokenDialog || typeof tokenDialog.showModal !== 'function') {
      showMessage(tr('当前窗口不能安全显示令牌。请关闭本次结果并重试。', 'This window cannot safely display the token. Close this result and try again.'), 'error');
      return;
    }
    tokenInput.value = String(token);
    tokenStatus.textContent = '';
    returnFocus = root.document.activeElement;
    returnFocusPublicationId = String(publicationId || '');
    try {
      tokenDialog.showModal();
      byId('bot-service-token-copy').focus();
    } catch (_) {
      clearToken();
      showMessage(tr('无法打开令牌窗口。请刷新状态后重试。', 'Could not open the token dialog. Refresh the status and try again.'), 'error');
    }
  }
  function clearToken() {
    if (tokenInput) tokenInput.value = '';
    if (tokenStatus) tokenStatus.textContent = '';
  }
  function closeToken() {
    clearToken();
    if (tokenDialog && tokenDialog.open) tokenDialog.close();
  }
  function afterTokenDialogClose() {
    clearToken();
    var focus = returnFocus;
    var publicationId = returnFocusPublicationId;
    returnFocus = null;
    returnFocusPublicationId = '';
    if (!isAppsVisible()) return;
    if (publicationId && publicationsHost) {
      var candidates = publicationsHost.querySelectorAll('form[data-action="grant"][data-publication-id] button[type="submit"]');
      var candidate = Array.from(candidates).find(function (button) {
        return button.form && button.form.getAttribute('data-publication-id') === publicationId && !button.disabled;
      });
      if (candidate) {
        try { candidate.focus({ preventScroll: true }); } catch (_) { candidate.focus(); }
        return;
      }
    }
    if (focus && focus !== root.document.body && focus !== root.document.documentElement && focus.isConnected && !focus.disabled) {
      try { focus.focus({ preventScroll: true }); } catch (_) { focus.focus(); }
      return;
    }
    var fallback = byId('bot-service-refresh');
    if (fallback && !fallback.disabled) fallback.focus();
  }
  function armConfirmation(action, publicationId, grantId) {
    confirmation = { action: action, publicationId: publicationId, grantId: grantId || '' };
    renderPublications();
  }
  function onPublicationClick(event) {
    var button = event.target.closest('button[data-action]');
    if (!button || pending) return;
    var action = button.getAttribute('data-action');
    var publicationId = button.getAttribute('data-publication-id') || '';
    var grantId = button.getAttribute('data-grant-id') || '';
    if (action === 'arm-remove') { armConfirmation('remove', publicationId); return; }
    if (action === 'arm-revoke') { armConfirmation('revoke', publicationId, grantId); return; }
    if (action === 'cancel-confirm') { confirmation = null; renderPublications(); return; }
    if (action === 'remove') { runMutation('botServiceRemove', { publicationId: publicationId }, { clearConfirmation: true }); return; }
    if (action === 'revoke') { runMutation('botServiceRevoke', { grantId: grantId }, { clearConfirmation: true }); return; }
  }
  function onGrantSubmit(event) {
    var form = event.target.closest('form[data-action="grant"]');
    if (!form) return;
    event.preventDefault();
    saveDraft(form);
    if (!form.reportValidity()) return;
    var publicationId = form.getAttribute('data-publication-id');
    var name = String(form.elements.namedItem('name').value || '').trim();
    var rate = Number(form.elements.namedItem('requestsPerMinute').value);
    if (!Number.isInteger(rate) || rate < 10 || rate > 600) {
      showMessage(tr('配额必须在每分钟 10–600 次之间。', 'Quota must be between 10 and 600 requests per minute.'), 'error');
      return;
    }
    runMutation('botServiceGrant', {
      publicationId: publicationId, name: name,
      readOnly: form.elements.namedItem('readOnly').checked,
      requestsPerMinute: rate
    }, { clearDraft: publicationId });
  }
  function onPublishSubmit(event) {
    if (event.target !== byId('bot-service-publish-form')) return;
    event.preventDefault();
    var botId = botSelect.value;
    if (!botId) {
      showMessage(tr('请选择一个可发布的 BOT。', 'Select an available BOT to publish.'), 'error');
      return;
    }
    runMutation('botServicePublish', { botId: botId });
  }
  function onTokenDialogClose() {
    afterTokenDialogClose();
  }
  function syncStaticButtons() {
    renderServiceState();
    setDisabledState(byId('bot-service-refresh'), false);
    setDisabledState(byId('bot-service-start'), !loaded || !snapshot || snapshot.running);
    setDisabledState(byId('bot-service-stop'), !loaded || !snapshot || !snapshot.running);
    setDisabledState(publishButton, true);
    setDisabledState(byId('bot-service-copy-base'), true);
    renderAgUiSetting();
    syncPort();
    renderMetrics();
    syncActions();
  }
  function init() {
    panel = byId('set-panel-apps');
    settingsMask = byId('set-mask');
    if (!panel || !byId('bot-service-settings')) return;
    statusMessage = byId('bot-service-message');
    serviceStateLabel = byId('bot-service-state');
    portInput = byId('bot-service-port');
    agUiEnabledInput = byId('bot-service-agui-enabled');
    botSelect = byId('bot-service-bot-select');
    publishButton = byId('bot-service-publish-button');
    publicationsHost = byId('bot-service-publications');
    emptyPublications = byId('bot-service-publications-empty');
    tokenDialog = byId('bot-service-token-dialog');
    tokenInput = byId('bot-service-token-value');
    tokenStatus = byId('bot-service-token-status');

    byId('bot-service-refresh').addEventListener('click', refreshStatus);
    byId('bot-service-configure').addEventListener('click', function () {
      if (!portInput.checkValidity() || !Number.isInteger(Number(portInput.value))) {
        showMessage(tr('端口必须是 1024–65535 的整数。', 'Port must be an integer from 1024 to 65535.'), 'error');
        portInput.reportValidity(); return;
      }
      runMutation('botServiceConfigure', { port: Number(portInput.value) });
    });
    agUiEnabledInput.addEventListener('change', function () {
      if (pending || !loaded || !snapshot || snapshot.running) {
        renderAgUiSetting(); syncActions();
        return;
      }
      runMutation('botServiceConfigure', { agUiEnabled: agUiEnabledInput.checked });
    });
    byId('bot-service-start').addEventListener('click', function () { runMutation('botServiceStart'); });
    byId('bot-service-stop').addEventListener('click', function () { runMutation('botServiceStop'); });
    byId('bot-service-copy-base').addEventListener('click', function () {
      copyText(snapshot && snapshot.url, tr('服务地址已复制。', 'Service address copied.'));
    });
    portInput.addEventListener('input', function () {
      portDirty = !snapshot || portInput.value !== String(snapshot.port);
      syncPort(); syncActions();
    });
    botSelect.addEventListener('change', function () { renderBots(); syncActions(); });
    byId('bot-service-publish-form').addEventListener('submit', onPublishSubmit);
    publicationsHost.addEventListener('click', onPublicationClick);
    publicationsHost.addEventListener('input', function (event) { saveDraft(event.target.closest('.bot-service-grant-form')); });
    publicationsHost.addEventListener('change', function (event) { saveDraft(event.target.closest('.bot-service-grant-form')); });
    publicationsHost.addEventListener('submit', onGrantSubmit);
    byId('bot-service-token-copy').addEventListener('click', function () {
      copyText(tokenInput.value, tr('令牌已复制。', 'Token copied.'), tokenStatus);
    });
    byId('bot-service-token-close').addEventListener('click', closeToken);
    tokenDialog.addEventListener('close', onTokenDialogClose);
    tokenDialog.addEventListener('cancel', clearToken);
    syncStaticButtons();

    var wasVisible = isAppsVisible();
    if (typeof root.MutationObserver === 'function') {
      var observer = new root.MutationObserver(function () {
        var visible = isAppsVisible();
        if (wasVisible && !visible && tokenDialog.open) closeToken();
        if (!wasVisible && visible) refreshStatus();
        wasVisible = visible;
      });
      observer.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
      if (settingsMask) observer.observe(settingsMask, { attributes: true, attributeFilter: ['class', 'hidden'] });
    }
    if (wasVisible) refreshStatus();
    else syncStaticButtons();
  }

  function start() {
    Promise.resolve(root.OpenBotI18n && root.OpenBotI18n.ready).then(init);
  }
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window);
