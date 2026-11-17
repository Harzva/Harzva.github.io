(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenBotGitHubAccounts = api;
})(typeof window === 'object' ? window : null, function (root) {
  'use strict';

  var ACTIONS = Object.freeze([
    { id: 'github.profile.read', zh: '读取个人资料', en: 'Read profile' },
    { id: 'github.repos.list', zh: '列出公开仓库', en: 'List public repositories' }
  ]);
  var CONNECTION_STATES = Object.freeze(['connected', 'credential_pending', 'reconnect_required',
    'disconnected_cleanup_pending', 'disconnected']);
  var BROKER_ERRORS = Object.freeze({
    BROKER_INVALID: ['请求无效。请刷新状态后重试。', 'The request was invalid. Refresh the status and try again.'],
    BROKER_DENIED: ['本机策略未允许此操作。', 'Local policy did not allow this action.'],
    BROKER_UNAVAILABLE: ['凭据服务暂不可用。请检查 OpenBao 后重试。', 'The credential service is temporarily unavailable. Check OpenBao and try again.'],
    BROKER_FAULT: ['凭据服务遇到错误。请检查 OpenBao 后重试。', 'The credential service reported a fault. Check OpenBao and try again.'],
    BROKER_CLOSED: ['凭据服务已关闭。请重新启动服务后重试。', 'The credential service is closed. Restart it and try again.'],
    BROKER_ABORTED: ['操作已取消。', 'The operation was canceled.'],
    BROKER_TIMEOUT: ['凭据服务响应超时。请重试。', 'The credential service timed out. Try again.'],
    BROKER_CAPACITY: ['凭据服务暂时繁忙。请稍后重试。', 'The credential service is busy. Try again shortly.'],
    BROKER_BUSY: ['另一个凭据操作正在进行。请稍后重试。', 'Another credential operation is in progress. Try again shortly.'],
    BROKER_REPLAY: ['授权请求已过期。请重新开始。', 'The authorization request has expired. Start again.'],
    BROKER_CALL_FAILED: ['本机凭据操作未完成。请检查服务状态后重试。', 'The local credential operation did not complete. Check the service and try again.'],
    BROKER_INVALID_RESPONSE: ['凭据服务返回了无法识别的状态。请刷新后重试。', 'The credential service returned an unknown status. Refresh and try again.'],
    BROKER_SETUP_CANCELED: ['没有选择安全连接文件。', 'No secure connection file was selected.']
  });
  var state = {
    card: null, bots: [], activeBotId: '', status: null, error: '', notice: '', loading: false,
    loaded: false, refreshEpoch: 0, accountUI: null, serviceNode: null, dialog: null,
    dialogMode: '', returnFocus: null, auth: null, authEpoch: 0, pollTimer: null,
    countdownTimer: null, access: null, busy: false
  };

  function tr(zh, en) {
    return root && root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function'
      ? root.OpenBotI18n.t(zh, en) : zh;
  }

  function make(tag, className, text) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function localized(node, zh, en) {
    node.setAttribute('data-i18n-zh', zh);
    node.setAttribute('data-i18n-en', en);
    node.textContent = tr(zh, en);
    return node;
  }

  function clean(value, limit) {
    if (typeof value !== 'string') return '';
    var result = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, limit || 160);
    // Credentials are never presentation data. Reject credential-shaped values
    // even if a malformed or future bridge projection puts one in a label.
    if (/(?:gh[pousr]_[A-Za-z0-9_]{16,}|github_pat_[A-Za-z0-9_]{16,}|-----BEGIN (?:OPENSSH|RSA|EC) PRIVATE KEY-----)/i.test(result)) return '';
    return result;
  }

  function actionError(result, fallback) {
    var error = new Error('Action failed');
    error.code = result && typeof result.code === 'string' ? result.code : (fallback || 'BROKER_CALL_FAILED');
    return error;
  }

  function checked(result, fallback) {
    if (!result || result.ok !== true) throw actionError(result, fallback);
    return result;
  }

  function invoke(action, input) {
    var bridge = root && root.grokbot;
    if (!bridge || typeof bridge.appConnectionsAction !== 'function') {
      var unavailable = new Error('Bridge unavailable');
      unavailable.code = 'BROKER_UNAVAILABLE';
      return Promise.reject(unavailable);
    }
    var request = { action: action };
    if (input && Object.keys(input).length) request.input = input;
    try {
      return Promise.resolve(bridge.appConnectionsAction(request)).then(function (result) {
        return checked(result, 'BROKER_CALL_FAILED');
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function errorText(error, fallback) {
    var code = error && typeof error.code === 'string' ? error.code : '';
    var copy = BROKER_ERRORS[code];
    if (copy) return tr(copy[0], copy[1]);
    return fallback || tr('操作未完成。请刷新状态后重试。', 'The action did not complete. Refresh the status and try again.');
  }

  function normalizeConnection(value) {
    value = value && typeof value === 'object' ? value : {};
    if (value.providerId !== 'github') return null;
    var id = clean(value.id, 160), status = CONNECTION_STATES.indexOf(value.status) >= 0 ? value.status : '';
    if (!id || !status) return null;
    return {
      id: id, providerId: 'github', label: clean(value.label, 100), login: clean(value.login, 100),
      status: status, scopes: Array.isArray(value.scopes) ? value.scopes.filter(function (item) {
        return item === 'read:user';
      }) : [], authType: clean(value.authType, 40)
    };
  }

  function normalizeGrant(value, deviceId) {
    value = value && typeof value === 'object' ? value : {};
    if (!deviceId || clean(value.deviceId, 160) !== deviceId) return null;
    var botId = clean(value.botId, 160), connectionId = clean(value.connectionId, 160);
    if (!botId || !connectionId) return null;
    var actions = Array.isArray(value.actions) ? value.actions.filter(function (item) {
      return ACTIONS.some(function (action) { return action.id === item; });
    }) : [];
    var activation = Array.isArray(value.activation) ? value.activation.map(function (item) {
      item = item && typeof item === 'object' ? item : {};
      return {
        action: ACTIONS.some(function (action) { return action.id === item.action; }) ? item.action : '',
        status: item.status === 'reactivated' ? 'reactivated' : item.status === 'pending' ? 'pending' : ''
      };
    }).filter(function (item) { return item.action && item.status; }) : [];
    var revision = Number.isSafeInteger(value.revision) && value.revision > 0 ? value.revision : null;
    return { deviceId: deviceId, botId: botId, connectionId: connectionId,
      revision: revision,
      actions: actions, activation: activation };
  }

  function normalizeStatus(value) {
    checked(value, 'BROKER_INVALID_RESPONSE');
    var phaseValues = ['unconfigured', 'configured', 'paired', 'fault', 'closed'];
    var phase = phaseValues.indexOf(value.phase) >= 0 ? value.phase : '';
    var deviceId = clean(value.deviceId, 160);
    return {
      configured: value.configured === true,
      paired: value.paired === true,
      metadataReady: value.metadataReady === true,
      ready: value.ready === true,
      fault: value.fault === true,
      phase: phase,
      deviceId: deviceId,
      connections: Array.isArray(value.connections) ? value.connections.map(normalizeConnection).filter(Boolean) : [],
      grants: Array.isArray(value.grants) ? value.grants.map(function (grant) { return normalizeGrant(grant, deviceId); }).filter(Boolean) : []
    };
  }

  function eligibleBots() {
    return state.bots.filter(function (bot) {
      return bot && typeof bot.id === 'string' && bot.id.trim() && bot.executionLocation !== 'remote' && bot.local !== false;
    }).map(function (bot) {
      return { id: clean(bot.id, 160), name: clean(bot.name || bot.displayName || bot.id, 100) };
    }).filter(function (bot) { return bot.id && bot.name; });
  }

  function isReady() {
    return !!(state.status && state.status.ready && !state.status.fault && state.status.paired && state.status.deviceId && !state.error);
  }

  function isMetadataReady() {
    return !!(state.status && state.status.metadataReady && state.status.paired && state.status.deviceId && !state.error);
  }

  function ownGrant(botId, connectionId) {
    if (!isMetadataReady()) return null;
    return state.status.grants.find(function (grant) {
      return grant.deviceId === state.status.deviceId && grant.botId === botId && grant.connectionId === connectionId;
    }) || null;
  }

  function formatStatus(value) {
    if (value === 'connected') return tr('已连接', 'Connected');
    if (value === 'credential_pending') return tr('凭据待完成', 'Credential pending');
    if (value === 'reconnect_required') return tr('GitHub 授权已撤销或失效', 'GitHub authorization was revoked or expired');
    if (value === 'disconnected_cleanup_pending') return tr('等待本机清理', 'Local cleanup pending');
    return tr('未连接', 'Not connected');
  }

  function accountStatus(value) {
    if (value === 'connected') return 'connected';
    if (value === 'credential_pending') return 'pending';
    if (value === 'reconnect_required') return 'reconnect-required';
    if (value === 'disconnected_cleanup_pending') return 'error';
    return 'disconnected';
  }

  function statusText() {
    if (state.loading) return tr('正在读取', 'Loading');
    if (state.error) return tr('状态不可用', 'Unavailable');
    if (!state.status || !state.status.configured) return tr('未配置', 'Not configured');
    if (!isReady()) return tr('服务暂不可用', 'Service unavailable');
    if (state.status.connections.some(function (connection) { return connection.status === 'connected'; })) return tr('已连接', 'Connected');
    if (state.status.connections.length) return tr('需要处理', 'Action needed');
    return tr('未连接', 'Not connected');
  }

  function refreshHeader() {
    if (!state.card) return;
    var status = state.card.querySelector('.apps-status');
    if (status) {
      status.textContent = statusText();
      var connected = isReady() && state.status.connections.some(function (item) { return item.status === 'connected'; });
      status.dataset.state = connected ? 'connected' : (state.error || (state.status && state.status.configured && !isReady()) ? 'error' : 'setup');
      state.card.classList.toggle('is-connected', connected);
      state.card.classList.toggle('is-unavailable', !!state.error || !!(state.status && state.status.configured && !isReady()));
    }
  }

  function prepareDescription(card) {
    var zh = '连接 GitHub 后，为每个本机 BOT 单独选择可读取的个人资料和公开仓库。';
    var en = 'Connect GitHub, then choose whether each local Bot can read your profile or public repositories.';
    var description = card.querySelector('.apps-description');
    var disclosure = card.querySelector('.openbot-app-description');
    var plannedGuide = card.querySelector('.apps-guide');
    if (plannedGuide) plannedGuide.hidden = true;
    if (disclosure) {
      var preview = disclosure.querySelector('.openbot-app-description-preview');
      var full = disclosure.querySelector('.openbot-app-description-full');
      if (preview) localized(preview, zh, en);
      if (full) localized(full, zh, en);
      return;
    }
    if (description) localized(description, zh, en);
  }

  function ensureServiceNode() {
    if (state.serviceNode && state.serviceNode.isConnected) return state.serviceNode;
    var card = state.card;
    if (!card) return null;
    var host = make('div', 'github-service-state');
    host.setAttribute('data-testid', 'github-service-state');
    var message = make('p', 'github-service-message');
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');
    message.setAttribute('data-testid', 'github-service-message');
    var actions = make('div', 'github-service-actions');
    var setup = make('button', 'btn github-service-setup');
    setup.type = 'button';
    setup.setAttribute('data-testid', 'github-openbao-setup');
    localized(setup, '选择安全连接文件', 'Choose secure connection file');
    setup.addEventListener('click', setupService);
    var refresh = make('button', 'btn github-service-refresh');
    refresh.type = 'button';
    refresh.setAttribute('data-testid', 'github-refresh-status');
    localized(refresh, '刷新状态', 'Refresh status');
    refresh.addEventListener('click', function () { refreshStatus(true); });
    var manage = make('button', 'btn github-service-manage');
    manage.type = 'button';
    manage.setAttribute('data-testid', 'github-manage-authorization');
    localized(manage, '管理 GitHub 授权', 'Manage GitHub authorization');
    manage.addEventListener('click', function () { invoke('manageGitHub').catch(showCardError); });
    actions.append(setup, refresh, manage);
    host.append(message, actions);
    var accountList = card.querySelector('[data-testid="app-account-list"]');
    card.insertBefore(host, accountList || null);
    state.serviceNode = host;
    return host;
  }

  function serviceCopy() {
    if (state.loading) return [tr('正在读取本机安全连接状态…', 'Reading local secure connection status…'), 'loading'];
    if (state.error) return [tr('无法读取 GitHub 连接状态，请刷新后重试。', 'GitHub connection status could not be read. Refresh and try again.'), 'error'];
    if (!state.status || !state.status.configured) return [tr('OpenBao 尚未配置。选择安全连接文件后才能连接 GitHub。', 'OpenBao is not configured. Choose a secure connection file before connecting GitHub.'), 'setup'];
    if (!isReady() && isMetadataReady()) return [tr('凭据服务暂不可用。仍可查看连接并撤销现有 BOT 权限或断开连接；新增授权已暂停。',
      'The credential service is temporarily unavailable. You can still review connections, revoke existing Bot access, or disconnect; new access is paused.'), 'unavailable'];
    if (!isReady()) return [tr('凭据服务暂不可用，连接和权限状态无法读取。请检查 OpenBao 后重试。',
      'The credential service is temporarily unavailable, so connection and access status cannot be read. Check OpenBao and try again.'), 'unavailable'];
    if (state.notice) return [state.notice, 'notice'];
    return ['', 'ready'];
  }

  function renderService() {
    var host = ensureServiceNode();
    if (!host) return;
    var message = host.querySelector('.github-service-message');
    var setup = host.querySelector('.github-service-setup');
    var refresh = host.querySelector('.github-service-refresh');
    var manage = host.querySelector('.github-service-manage');
    var copy = serviceCopy();
    message.textContent = copy[0];
    message.dataset.state = copy[1];
    host.dataset.state = copy[1];
    message.hidden = !copy[0];
    setup.hidden = state.loading || !!state.error || !state.status || state.status.configured;
    setup.disabled = state.loading || state.busy;
    refresh.hidden = false;
    refresh.disabled = state.loading || state.busy;
    var needsGitHubRepair = isMetadataReady() && state.status.connections.some(function (connection) {
      return connection.status === 'reconnect_required';
    });
    manage.hidden = !needsGitHubRepair;
    manage.disabled = state.loading || state.busy;
    host.querySelector('.github-service-actions').hidden = false;
  }

  function accountOptions() {
    var ready = isReady();
    var metadataReady = isMetadataReady();
    var connections = metadataReady && state.status ? state.status.connections : [];
    var accounts = connections.map(function (connection) {
      return { id: connection.id, label: connection.login ? '@' + connection.login : (connection.label || 'GitHub'),
        address: '', status: ready ? accountStatus(connection.status) : 'unavailable', canSendMail: false, isDefaultSender: false };
    });
    return {
      appId: 'github', available: true, accounts: accounts,
      loading: state.loading,
      error: state.error || (!metadataReady && state.status && state.status.configured ? 'BROKER_UNAVAILABLE' : ''),
      onOpenAccount: metadataReady ? function (connectionId) { openAccessDeferred(connectionId); return true; } : undefined,
      onAdd: ready ? function () { setTimeout(openAuthorization, 0); return true; } : undefined
    };
  }

  function render() {
    if (!state.card || !state.card.isConnected) return;
    prepareDescription(state.card);
    refreshHeader();
    if (root.OpenBotAppAccounts) state.accountUI = root.OpenBotAppAccounts.mount(state.card, accountOptions());
    renderService();
    if (root.OpenBotI18n && typeof root.OpenBotI18n.localize === 'function') root.OpenBotI18n.localize(state.card);
  }

  function refreshStatus(manual) {
    var epoch = ++state.refreshEpoch;
    state.loading = true;
    state.error = '';
    state.status = null;
    if (manual) state.notice = '';
    render();
    return invoke('status').then(function (result) {
      if (epoch !== state.refreshEpoch) return false;
      state.status = normalizeStatus(result);
      state.error = '';
      state.loaded = true;
      state.loading = false;
      render();
      return true;
    }).catch(function (error) {
      if (epoch !== state.refreshEpoch) return false;
      state.status = null;
      state.error = errorText(error, tr('无法读取 GitHub 连接状态，请刷新后重试。', 'GitHub connection status could not be read. Refresh and try again.'));
      state.loaded = true;
      state.loading = false;
      render();
      return false;
    });
  }

  function setupService() {
    if (state.busy) return;
    state.busy = true;
    state.notice = tr('正在选择安全连接文件…', 'Choose a secure connection file…');
    render();
    invoke('setup').then(function () {
      state.notice = tr('正在验证本机连接。', 'Checking the local connection.');
      return refreshStatus(true);
    }).catch(function (error) {
      if (error && error.code === 'BROKER_SETUP_CANCELED') {
        state.notice = tr('没有选择安全连接文件。', 'No secure connection file was selected.');
        state.error = '';
      } else {
        state.error = errorText(error);
      }
      state.loaded = true;
      state.loading = false;
      render();
    }).finally(function () {
      state.busy = false;
      render();
    });
  }

  function ensureDialog() {
    if (state.dialog && state.dialog.isConnected) return state.dialog;
    var dialog = make('dialog', 'github-connection-dialog');
    dialog.id = 'github-connection-dialog';
    dialog.setAttribute('aria-labelledby', 'github-dialog-title');
    dialog.setAttribute('data-testid', 'github-connection-dialog');
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      if (dialog.open) dialog.close();
    });
    dialog.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      if (dialog.open) dialog.close();
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', onDialogClose);
    var panel = root.document.querySelector('#set-panel-apps');
    (panel || root.document.body).appendChild(dialog);
    state.dialog = dialog;
    return dialog;
  }

  function dialogShell(mode, heading, description) {
    var dialog = ensureDialog();
    state.dialogMode = mode;
    dialog.replaceChildren();
    dialog.setAttribute('aria-describedby', 'github-dialog-description');
    var header = make('header', 'github-dialog-header');
    var title = localized(make('h3'), heading[0], heading[1]);
    title.id = 'github-dialog-title';
    var close = localized(make('button', 'btn github-dialog-close'), '关闭', 'Close');
    close.type = 'button';
    close.setAttribute('aria-label', tr('关闭 GitHub 对话框', 'Close GitHub dialog'));
    close.addEventListener('click', function () { if (dialog.open) dialog.close(); });
    header.append(title, close);
    dialog.appendChild(header);
    var note = localized(make('p', 'github-dialog-description'), description[0], description[1]);
    note.id = 'github-dialog-description';
    dialog.appendChild(note);
    return dialog;
  }

  function showDialog(dialog, focusNode) {
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', 'open');
    }
    if (focusNode && typeof focusNode.focus === 'function') focusNode.focus();
  }

  function onDialogClose() {
    if (state.dialogMode === 'authorization') cancelAuthorization();
    state.dialogMode = '';
    if (state.auth) {
      state.authEpoch++;
      clearTimeout(state.pollTimer);
      clearInterval(state.countdownTimer);
      state.auth = null;
    }
    state.access = null;
    var focus = state.returnFocus;
    state.returnFocus = null;
    if (focus && focus.isConnected && typeof focus.focus === 'function') focus.focus();
  }

  function openAuthorization() {
    if (!isReady() || state.busy) {
      state.notice = tr('凭据服务暂不可用。刷新状态后再试。', 'The credential service is unavailable. Refresh the status and try again.');
      render();
      return false;
    }
    state.returnFocus = root.document.activeElement;
    state.authEpoch++;
    var epoch = state.authEpoch;
    state.auth = { authorizationId: '', userCode: '', expiresAt: 0, pollAfterMs: 5000,
      status: 'starting', message: '', cancelSent: false };
    var dialog = dialogShell('authorization', ['连接 GitHub', 'Connect GitHub'],
      ['Bot Studio 会使用 GitHub 设备授权。授权范围仅包含 read:user；公开仓库列表是只读的公开数据。',
        'Bot Studio uses GitHub device authorization. The requested scope is limited to read:user; public repository listing is read-only public data.']);
    renderAuthorization();
    showDialog(dialog, dialog.querySelector('[data-testid="github-auth-cancel"]'));
    invoke('begin', { label: 'GitHub' }).then(function (result) {
      var authId = clean(result.authorizationId, 160);
      if (epoch !== state.authEpoch || !state.auth || !dialog.open) {
        if (authId) invoke('cancel', { authorizationId: authId }).catch(function () {});
        return;
      }
      var code = clean(result.userCode, 24);
      var expiry = expiryTime(result.expiresAt);
      if (!authId || !/^[A-Z0-9-]{4,24}$/i.test(code) || !expiry || expiry <= Date.now()) {
        state.auth.status = 'error';
        state.auth.message = tr('GitHub 未返回有效的设备验证码。请重新开始。', 'GitHub did not return a valid device code. Start again.');
        renderAuthorization();
        if (authId) invoke('cancel', { authorizationId: authId }).catch(function () {});
        return;
      }
      state.auth.authorizationId = authId;
      state.auth.userCode = code.toUpperCase();
      state.auth.expiresAt = expiry;
      state.auth.pollAfterMs = boundedPoll(result.pollAfterMs);
      state.auth.status = 'pending';
      state.auth.message = tr('在 GitHub 页面输入此验证码；Bot Studio 会在此窗口等待。', 'Enter this code on GitHub. Bot Studio will wait in this window.');
      renderAuthorization();
      state.countdownTimer = setInterval(updateCountdown, 1000);
      schedulePoll(epoch, state.auth.pollAfterMs);
    }).catch(function (error) {
      if (epoch !== state.authEpoch || !state.auth || !dialog.open) return;
      state.auth.status = 'error';
      state.auth.message = errorText(error, tr('无法开始 GitHub 授权。请重试。', 'GitHub authorization could not start. Try again.'));
      renderAuthorization();
    });
    return true;
  }

  function expiryTime(value) {
    if (typeof value === 'number' && isFinite(value)) return value < 100000000000 ? value * 1000 : value;
    if (typeof value === 'string') {
      var parsed = Date.parse(value);
      return isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  function boundedPoll(value) {
    var number = Number(value);
    if (!isFinite(number) || number <= 0) number = 5000;
    return Math.max(1500, Math.min(15000, number));
  }

  function renderAuthorization() {
    var auth = state.auth, dialog = state.dialog;
    if (!auth || !dialog || !dialog.open && state.dialogMode !== 'authorization') return;
    var activeTestId = dialog.contains(root.document.activeElement)
      ? root.document.activeElement.getAttribute('data-testid') : '';
    var codeBox = make('div', 'github-user-code-box');
    var label = localized(make('span', 'github-user-code-label'), '设备验证码', 'Device code');
    var code = make('strong', 'github-user-code', auth.userCode || tr('等待验证码…', 'Waiting for code…'));
    code.id = 'github-user-code';
    code.setAttribute('data-testid', 'github-user-code');
    codeBox.append(label, code);
    var message = make('p', 'github-auth-message', auth.message || tr('正在联系本机凭据服务…', 'Contacting the local credential service…'));
    message.id = 'github-auth-status';
    message.setAttribute('data-testid', 'github-auth-status');
    message.setAttribute('role', auth.status === 'error' ? 'alert' : 'status');
    message.setAttribute('aria-live', 'polite');
    message.dataset.state = auth.status;
    var timer = make('p', 'github-auth-expiry');
    timer.id = 'github-auth-expiry';
    if (auth.expiresAt) {
      var remaining = Math.max(0, Math.ceil((auth.expiresAt - Date.now()) / 1000));
      timer.textContent = tr('验证码有效期还剩 ' + remaining + ' 秒。', 'Code expires in ' + remaining + ' seconds.');
    }
    var actions = make('div', 'github-dialog-actions');
    var open = localized(make('button', 'btn primary'), '打开 GitHub', 'Open GitHub');
    open.type = 'button';
    open.id = 'github-open-device';
    open.setAttribute('data-testid', 'github-open-device');
    open.disabled = !auth.userCode || auth.status === 'error' || auth.status === 'expired';
    open.addEventListener('click', function () { invoke('openGitHub').catch(function (error) {
      if (state.auth) { state.auth.message = errorText(error); renderAuthorization(); }
    }); });
    var cancel = localized(make('button', 'btn'), '取消', 'Cancel');
    cancel.type = 'button';
    cancel.id = 'github-auth-cancel';
    cancel.setAttribute('data-testid', 'github-auth-cancel');
    cancel.addEventListener('click', function () { if (dialog.open) dialog.close(); });
    actions.append(open, cancel);
    dialog.replaceChildren(dialog.querySelector('.github-dialog-header'), dialog.querySelector('.github-dialog-description'), codeBox, timer, message, actions);
    var retry = make('button', 'btn github-auth-retry');
    if (auth.status === 'error' || auth.status === 'expired') {
      localized(retry, '重新开始', 'Start again');
      retry.type = 'button';
      retry.setAttribute('data-testid', 'github-auth-retry');
      retry.addEventListener('click', function () {
        if (dialog.open) dialog.close();
        openAuthorization();
      });
      actions.insertBefore(retry, cancel);
    }
    if (root.OpenBotI18n && typeof root.OpenBotI18n.localize === 'function') root.OpenBotI18n.localize(dialog);
    if (activeTestId) {
      var nextFocus = dialog.querySelector('[data-testid="' + activeTestId + '"]');
      if (nextFocus && typeof nextFocus.focus === 'function') nextFocus.focus();
    }
  }

  function updateCountdown() {
    var auth = state.auth, dialog = state.dialog;
    if (!auth || !dialog || !dialog.open || !auth.expiresAt) return;
    var timer = dialog.querySelector('#github-auth-expiry');
    if (!timer) return;
    var remaining = Math.max(0, Math.ceil((auth.expiresAt - Date.now()) / 1000));
    timer.textContent = tr('验证码有效期还剩 ' + remaining + ' 秒。', 'Code expires in ' + remaining + ' seconds.');
  }

  function schedulePoll(epoch, delay) {
    clearTimeout(state.pollTimer);
    var auth = state.auth;
    if (!auth || !auth.authorizationId || epoch !== state.authEpoch || state.dialogMode !== 'authorization' || !state.dialog || !state.dialog.open) return;
    var remaining = auth.expiresAt - Date.now();
    if (remaining <= 0) {
      auth.status = 'expired';
      auth.message = tr('验证码已过期。请重新开始授权。', 'The device code expired. Start authorization again.');
      renderAuthorization();
      cancelAuthorization();
      return;
    }
    state.pollTimer = setTimeout(function () { pollAuthorization(epoch); }, Math.min(delay, remaining));
  }

  function pollAuthorization(epoch) {
    var auth = state.auth;
    if (!auth || !auth.authorizationId || epoch !== state.authEpoch || state.dialogMode !== 'authorization' || !state.dialog || !state.dialog.open) return;
    if (Date.now() >= auth.expiresAt) {
      auth.status = 'expired';
      auth.message = tr('验证码已过期。请重新开始授权。', 'The device code expired. Start authorization again.');
      renderAuthorization();
      cancelAuthorization();
      return;
    }
    invoke('poll', { authorizationId: auth.authorizationId }).then(function (result) {
      if (epoch !== state.authEpoch || !state.auth || !state.dialog || !state.dialog.open) return;
      var status = clean(result.status, 40).toLowerCase();
      var connectedProjection = normalizeConnection(result.connection);
      if (status === 'connected' || connectedProjection && connectedProjection.status === 'connected') {
        clearTimeout(state.pollTimer);
        clearInterval(state.countdownTimer);
        state.auth = null;
        state.dialogMode = '';
        state.notice = tr('GitHub 账号已连接。请为各个 BOT 分别选择权限。', 'GitHub is connected. Choose permissions for each Bot separately.');
        state.dialog.close();
        refreshStatus(true);
        return;
      }
      if (status === 'expired' || status === 'denied' || status === 'canceled' || status === 'cancelled') {
        auth.status = status === 'expired' ? 'expired' : 'error';
        auth.message = status === 'expired'
          ? tr('验证码已过期。请重新开始授权。', 'The device code expired. Start authorization again.')
          : tr('GitHub 授权未完成。你可以重新开始。', 'GitHub authorization did not complete. You can start again.');
        renderAuthorization();
        return;
      }
      auth.status = 'pending';
      auth.message = tr('等待 GitHub 授权确认…', 'Waiting for GitHub authorization…');
      renderAuthorization();
      schedulePoll(epoch, boundedPoll(result.pollAfterMs || auth.pollAfterMs));
    }).catch(function (error) {
      if (epoch !== state.authEpoch || !state.auth || !state.dialog || !state.dialog.open) return;
      if (error && error.code === 'BROKER_ABORTED') return;
      auth.status = 'error';
      auth.message = errorText(error, tr('GitHub 授权状态暂不可用。请重试。', 'GitHub authorization status is unavailable. Try again.'));
      renderAuthorization();
    });
  }

  function cancelAuthorization() {
    var auth = state.auth;
    clearTimeout(state.pollTimer);
    clearInterval(state.countdownTimer);
    if (!auth || !auth.authorizationId || auth.cancelSent) return;
    auth.cancelSent = true;
    invoke('cancel', { authorizationId: auth.authorizationId }).catch(function () {});
  }

  function openAccessDeferred(connectionId) {
    var opener = root.document.activeElement;
    setTimeout(function () { openAccess(connectionId, opener); }, 0);
  }

  function openAccess(connectionId, opener) {
    if (!isMetadataReady()) return false;
    var connection = state.status.connections.find(function (item) { return item.id === connectionId; });
    if (!connection) return false;
    state.returnFocus = opener || root.document.activeElement;
    state.access = { connectionId: connectionId, connection: connection, botId: '', selections: Object.create(null), notice: '', busy: false };
    var bots = eligibleBots();
    var preferred = bots.find(function (bot) { return bot.id === state.activeBotId; });
    state.access.botId = preferred ? preferred.id : (bots[0] ? bots[0].id : '');
    var dialog = dialogShell('access', [connection.login ? '@' + connection.login + ' 的 Bot 权限' : 'GitHub Bot 权限',
      connection.login ? 'Bot access for @' + connection.login : 'GitHub Bot access'],
      ['只读权限按 BOT 单独保存。允许的操作不会自动启动。', 'Read-only permissions are saved per Bot. Granted actions do not start automatically.']);
    renderAccess();
    var first = dialog.querySelector('#github-bot-select') || dialog.querySelector('#github-action-profile');
    showDialog(dialog, first);
    return true;
  }

  function selectedActionsFromDOM() {
    return Array.from(state.dialog.querySelectorAll('[data-github-action]:checked')).map(function (input) { return input.value; });
  }

  function currentAccessBot() {
    return state.access ? state.access.botId : '';
  }

  function rememberActionSelections() {
    if (!state.access || !state.access.botId) return;
    state.access.selections[state.access.botId] = selectedActionsFromDOM();
  }

  function selectedActions() {
    return state.access && state.access.botId ? (state.access.selections[state.access.botId] || []).slice() : [];
  }

  function activationFor(grant, action) {
    if (!grant) return '';
    var item = grant.activation.find(function (entry) { return entry.action === action; });
    return item ? item.status : '';
  }

  function renderAccess() {
    var access = state.access, dialog = state.dialog;
    if (!access || !dialog || state.dialogMode !== 'access') return;
    var activeTestId = dialog.contains(root.document.activeElement)
      ? root.document.activeElement.getAttribute('data-testid') || '' : '';
    var connection = state.status && state.status.connections.find(function (item) { return item.id === access.connectionId; }) || access.connection;
    if (!connection) {
      dialog.close();
      return;
    }
    var bots = eligibleBots();
    var botSelect = make('select', 'github-bot-select');
    botSelect.id = 'github-bot-select';
    botSelect.setAttribute('data-testid', 'github-bot-select');
    var selectLabel = localized(make('label', 'github-access-field'), 'BOT', 'Bot');
    selectLabel.htmlFor = botSelect.id;
    bots.forEach(function (bot) {
      var option = make('option', '', bot.name);
      option.value = bot.id;
      botSelect.appendChild(option);
    });
    if (!bots.some(function (bot) { return bot.id === access.botId; })) access.botId = bots[0] ? bots[0].id : '';
    botSelect.value = access.botId;
    botSelect.disabled = access.busy || !bots.length;
    botSelect.addEventListener('change', function () {
      rememberActionSelections();
      access.botId = botSelect.value;
      ensureSelections(access.botId);
      renderAccess();
      var next = dialog.querySelector('#github-bot-select');
      if (next) next.focus();
    });

    var note = make('p', 'github-access-connection-state', formatStatus(connection.status));
    note.dataset.state = isReady() ? connection.status : 'service-unavailable';
    if (!isReady()) note.textContent = tr('凭据服务暂不可用。现有权限可查看、撤销或断开；新增授权和启用已暂停。',
      'The credential service is temporarily unavailable. Existing access can be reviewed, revoked, or disconnected; new grants and activation are paused.');
    else if (connection.status === 'reconnect_required') note.textContent = tr('GitHub 侧授权已撤销或失效。BOT 权限暂不可用。', 'GitHub authorization was revoked or expired. Bot access is unavailable.');
    else if (connection.status === 'credential_pending') note.textContent = tr('凭据尚未完成安全存储。BOT 权限暂不可用。', 'The credential is not securely stored yet. Bot access is unavailable.');
    else if (connection.status === 'disconnected_cleanup_pending') note.textContent = tr('连接已断开，等待本机清理完成。', 'The connection is disconnected and waiting for local cleanup.');

    var fieldset = make('fieldset', 'github-access-actions');
    var legend = localized(make('legend'), '允许此 BOT 执行的只读操作', 'Read-only actions allowed for this Bot');
    fieldset.appendChild(legend);
    var grant = access.botId ? ownGrant(access.botId, access.connectionId) : null;
    ensureSelections(access.botId);
    var currentSelection = selectedActions();
    ACTIONS.forEach(function (action, index) {
      var row = make('label', 'github-access-action');
      var input = make('input');
      input.type = 'checkbox';
      input.id = index === 0 ? 'github-action-profile' : 'github-action-repos';
      input.value = action.id;
      input.setAttribute('data-github-action', action.id);
      input.setAttribute('data-testid', 'github-action-' + (index === 0 ? 'profile' : 'repos'));
      input.checked = currentSelection.indexOf(action.id) >= 0;
      input.disabled = access.busy || !isReady() || connection.status !== 'connected' || !access.botId;
      input.addEventListener('change', function () {
        access.selections[access.botId] = selectedActionsFromDOM();
        renderAccess();
      });
      var label = localized(make('span'), action.zh, action.en);
      var allowed = !!(grant && grant.actions.indexOf(action.id) >= 0);
      var activation = activationFor(grant, action.id);
      var stateLabel = make('span', 'github-action-state', !allowed ? tr('未授权', 'Not granted') : activation === 'reactivated' ? tr('已启用', 'Enabled') : tr('待确认', 'Needs confirmation'));
      stateLabel.dataset.state = !allowed ? 'off' : activation === 'reactivated' ? 'active' : 'pending';
      row.append(input, label, stateLabel);
      fieldset.appendChild(row);
    });

    var message = make('p', 'github-access-message', access.notice);
    message.setAttribute('role', access.notice ? 'status' : 'note');
    message.setAttribute('aria-live', 'polite');
    message.hidden = !access.notice;
    var footer = make('div', 'github-dialog-actions github-access-footer');
    var grantButton = localized(make('button', 'btn primary'), '授权并启用', 'Grant and enable');
    grantButton.type = 'button';
    grantButton.id = 'github-grant-enable';
    grantButton.setAttribute('data-testid', 'github-grant-enable');
    grantButton.disabled = access.busy || !isReady() || !access.botId || !currentSelection.length || connection.status !== 'connected';
    grantButton.addEventListener('click', grantAndEnable);
    var confirmButton = localized(make('button', 'btn'), '确认本次启动', 'Confirm for this start');
    confirmButton.type = 'button';
    confirmButton.id = 'github-activate-pending';
    confirmButton.setAttribute('data-testid', 'github-activate-pending');
    var pendingSelected = currentSelection.filter(function (action) { return grant && grant.actions.indexOf(action) >= 0 && activationFor(grant, action) !== 'reactivated'; });
    confirmButton.disabled = access.busy || !isReady() || !pendingSelected.length || !grant || !grant.revision || connection.status !== 'connected';
    confirmButton.addEventListener('click', confirmSelected);
    confirmButton.hidden = !pendingSelected.length;
    var revokeButton = localized(make('button', 'btn github-revoke-button'), '撤销此 BOT 授权', 'Revoke this Bot');
    revokeButton.type = 'button';
    revokeButton.id = 'github-revoke-grant';
    revokeButton.setAttribute('data-testid', 'github-revoke-grant');
    revokeButton.disabled = access.busy || !isMetadataReady() || !grant;
    revokeButton.addEventListener('click', revokeSelected);
    var disconnectButton = localized(make('button', 'btn github-disconnect-button'),
      connection.status === 'disconnected_cleanup_pending' ? '重试本机清理' : '断开 GitHub',
      connection.status === 'disconnected_cleanup_pending' ? 'Retry local cleanup' : 'Disconnect GitHub');
    disconnectButton.type = 'button';
    disconnectButton.id = 'github-disconnect';
    disconnectButton.setAttribute('data-testid', 'github-disconnect');
    disconnectButton.disabled = access.busy || !isMetadataReady() || connection.status === 'disconnected';
    disconnectButton.addEventListener('click', disconnectConnection);
    footer.append(grantButton, confirmButton, revokeButton, disconnectButton);

    var scopeNote = localized(make('p', 'github-scope-note'),
      'GitHub OAuth 只请求 read:user。公开仓库读取使用公开数据，不授予写入、Issue 或 Pull Request 操作。',
      'GitHub OAuth requests only read:user. Public repository reads use public data; no write, issue, or pull request actions are granted.');
    dialog.replaceChildren(dialog.querySelector('.github-dialog-header'), dialog.querySelector('.github-dialog-description'), selectLabel, botSelect,
      note, fieldset, scopeNote, message, footer);
    if (!bots.length) {
      var empty = localized(make('p', 'github-access-empty'), '没有可授权的本机 BOT。', 'No local Bots are available to authorize.');
      dialog.insertBefore(empty, fieldset);
    }
    if (connection.status === 'reconnect_required') {
      var manage = localized(make('button', 'btn github-manage-provider'), '管理 GitHub 授权', 'Manage GitHub authorization');
      manage.type = 'button';
      manage.setAttribute('data-testid', 'github-manage-provider');
      manage.addEventListener('click', function () { invoke('manageGitHub').catch(function (error) { access.notice = errorText(error); renderAccess(); }); });
      dialog.insertBefore(manage, footer);
    }
    if (root.OpenBotI18n && typeof root.OpenBotI18n.localize === 'function') root.OpenBotI18n.localize(dialog);
    var restore = activeTestId && Array.from(dialog.querySelectorAll('[data-testid]')).find(function (node) {
      return node.getAttribute('data-testid') === activeTestId && !node.disabled;
    });
    if (restore && typeof restore.focus === 'function') restore.focus();
    else {
      var fallback = dialog.querySelector('button:not(:disabled), input:not(:disabled), select:not(:disabled)');
      if (fallback && typeof fallback.focus === 'function') fallback.focus();
    }
  }

  function ensureSelections(botId) {
    if (!state.access || !botId || Object.prototype.hasOwnProperty.call(state.access.selections, botId)) return;
    var grant = ownGrant(botId, state.access.connectionId);
    state.access.selections[botId] = grant ? grant.actions.slice() : [];
  }

  function setAccessBusy(message) {
    if (!state.access) return;
    state.access.busy = true;
    state.access.notice = message || tr('正在保存权限…', 'Saving access…');
    renderAccess();
  }

  function finishAccess(message, error) {
    if (!state.access) return;
    state.access.busy = false;
    state.access.notice = error ? errorText(error) : message;
    var current = state.status && state.status.connections.find(function (item) { return item.id === state.access.connectionId; });
    if (current) state.access.connection = current;
    renderAccess();
  }

  function grantAndEnable() {
    if (!state.access || state.access.busy) return;
    rememberActionSelections();
    var botId = currentAccessBot(), connectionId = state.access.connectionId, actions = selectedActions();
    if (!botId || !actions.length) return;
    setAccessBusy(tr('正在保存此 BOT 的 GitHub 权限…', 'Saving this Bot’s GitHub access…'));
    invoke('registerBot', { botId: botId }).then(function (registered) {
      if (state.status && state.status.deviceId && registered.deviceId !== state.status.deviceId) {
        var mismatch = new Error('Device mismatch'); mismatch.code = 'BROKER_DENIED'; throw mismatch;
      }
      return invoke('grant', { botId: botId, connectionId: connectionId, actions: actions });
    }).then(function (result) {
      var grant = result.grant && typeof result.grant === 'object' ? result.grant : {};
      var grantedActions = Array.isArray(grant.actions) ? grant.actions : [];
      if (grant.deviceId !== state.status.deviceId || grant.botId !== botId || grant.connectionId !== connectionId ||
          !actions.every(function (action) { return grantedActions.indexOf(action) >= 0; })) {
        var mismatchedGrant = new Error('Grant projection mismatch'); mismatchedGrant.code = 'BROKER_INVALID_RESPONSE'; throw mismatchedGrant;
      }
      var revision = grant.revision;
      if (!Number.isSafeInteger(revision) || revision <= 0) {
        var invalid = new Error('Grant revision missing'); invalid.code = 'BROKER_INVALID_RESPONSE'; throw invalid;
      }
      return actions.reduce(function (promise, action) {
        return promise.then(function () {
          return invoke('activate', { botId: botId, connectionId: connectionId, action: action, grantRevision: revision });
        });
      }, Promise.resolve());
    }).then(function () {
      return refreshStatus(false);
    }).then(function () {
      finishAccess(tr('此 BOT 的权限已保存；需等待状态刷新确认。', 'This Bot’s access was saved. Refresh the status to confirm it.'));
    }).catch(function (error) { finishAccess('', error); });
  }

  function confirmSelected() {
    if (!state.access || state.access.busy) return;
    rememberActionSelections();
    var botId = currentAccessBot(), connectionId = state.access.connectionId;
    var grant = ownGrant(botId, connectionId), revision = grant && grant.revision;
    var actions = selectedActions().filter(function (action) {
      return grant && grant.actions.indexOf(action) >= 0 && activationFor(grant, action) !== 'reactivated';
    });
    if (!grant || !Number.isSafeInteger(revision) || revision <= 0 || !actions.length) return;
    setAccessBusy(tr('正在确认所选操作可在本次启动中使用…', 'Confirming the selected actions for this start…'));
    actions.reduce(function (promise, action) {
      return promise.then(function () {
        return invoke('activate', { botId: botId, connectionId: connectionId, action: action, grantRevision: revision });
      });
    }, Promise.resolve()).then(function () { return refreshStatus(false); }).then(function () {
      finishAccess(tr('已提交本次启动确认。', 'The start confirmation was submitted.'));
    }).catch(function (error) { finishAccess('', error); });
  }

  function revokeSelected() {
    if (!state.access || state.access.busy || !isMetadataReady()) return;
    rememberActionSelections();
    var botId = currentAccessBot(), connectionId = state.access.connectionId;
    if (!ownGrant(botId, connectionId)) return;
    setAccessBusy(tr('正在撤销此 BOT 的权限…', 'Revoking this Bot’s access…'));
    invoke('revoke', { botId: botId, connectionId: connectionId }).then(function () { return refreshStatus(false); }).then(function () {
      if (state.access) state.access.selections[botId] = [];
      finishAccess(tr('此 BOT 的授权已撤销。其他 BOT 保持不变。', 'This Bot’s access was revoked. Other Bots are unchanged.'));
    }).catch(function (error) { finishAccess('', error); });
  }

  function disconnectConnection() {
    if (!state.access || state.access.busy || !isMetadataReady()) return;
    var connectionId = state.access.connectionId;
    var currentConnection = state.status && state.status.connections.find(function (item) { return item.id === connectionId; }) || state.access.connection;
    var shouldCleanup = !!(currentConnection && currentConnection.status === 'disconnected_cleanup_pending');
    var disconnectCompleted = shouldCleanup;
    setAccessBusy(tr('正在停止此 GitHub 连接并清理本机凭据…', 'Stopping this GitHub connection and cleaning up the local credential…'));
    var operation = shouldCleanup ? invoke('cleanup', { connectionId: connectionId }) : invoke('disconnect', { connectionId: connectionId }).then(function (result) {
      disconnectCompleted = true;
      var pending = result.cleanupPending === true || !!(result.connection && result.connection.status === 'disconnected_cleanup_pending');
      return pending ? invoke('cleanup', { connectionId: connectionId }) : result;
    });
    operation.then(function () { return refreshStatus(false); }).then(function () {
      finishAccess(tr('GitHub 连接已断开。各 BOT 的权限已停止。', 'GitHub is disconnected. Bot access has been stopped.'));
    }).catch(function (error) {
      if (disconnectCompleted) refreshStatus(false).then(function () { finishAccess('', error); });
      else finishAccess('', error);
    });
  }

  function showCardError(error) {
    state.notice = errorText(error);
    render();
  }

  function update(options) {
    options = options || {};
    if (options.card && options.card !== state.card) {
      state.card = options.card;
      state.serviceNode = null;
      state.accountUI = null;
      state.loaded = false;
      state.status = null;
      state.error = '';
      state.loading = false;
    }
    if (!state.card) return;
    state.bots = Array.isArray(options.bots) ? options.bots.slice() : [];
    state.activeBotId = clean(options.activeBotId, 160);
    prepareDescription(state.card);
    render();
    if (!state.loaded && !state.loading) refreshStatus(false);
  }

  function snapshot() {
    return {
      configured: !!(state.status && state.status.configured), ready: isReady(),
      connections: state.status ? state.status.connections.slice() : [],
      grants: state.status ? state.status.grants.slice() : [], loading: state.loading,
      error: state.error ? 'unavailable' : ''
    };
  }

  return Object.freeze({ update: update, refresh: function () { return refreshStatus(true); }, snapshot: snapshot,
    allowedActions: ACTIONS.map(function (action) { return action.id; }) });
});
