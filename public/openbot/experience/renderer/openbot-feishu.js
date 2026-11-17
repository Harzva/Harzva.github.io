(function (root) {
  'use strict';

  function tr(zh, en, params) {
    return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en, params) : zh;
  }
  function byId(id) { return root.document.getElementById(id); }
  function element(tag, className, text) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function setMessage(message, state) {
    if (!els.message) return;
    els.message.textContent = message || '';
    els.message.dataset.state = state || 'idle';
  }

  var els = {};
  var state = {
    loaded: false,
    accountError: '',
    busy: false,
    mode: null,
    selectedId: null,
    hasSecret: false,
    baseline: null,
    snapshot: null,
    returnFocus: null,
    resultText: '',
    pollTimer: null
  };

  var errorText = {
    FEISHU_CREDENTIALS_FAILED: ['飞书凭据或权限检查失败，请核对 App ID、Secret 和消息权限。', 'Feishu credential or permission check failed. Verify the App ID, secret and messaging permissions.'],
    FEISHU_CONNECTION_FAILED: ['飞书连接失败，请核对应用配置并刷新状态。', 'The Feishu connection failed. Check the app settings and refresh its status.'],
    FEISHU_DELIVERY_FAILED: ['消息未能交给指定 BOT。', 'The message could not be delivered to the selected BOT.'],
    BOT_UNAVAILABLE: ['指定 BOT 当前不可用，请选择可用的本机 BOT。', 'The selected BOT is unavailable. Choose an available local BOT.'],
    STATE_WRITE_FAILED: ['连接配置保存失败。请检查本机私有配置目录后重试。', 'The connection could not be saved. Check the local private configuration directory and try again.'],
    PRIVATE_STATE_REQUIRED: ['本机配置目录权限不安全，连接未开放。', 'The local configuration directory has unsafe permissions. The connection was not opened.'],
    STATE_UNAVAILABLE: ['本机连接配置无法安全读取。', 'The local connection configuration could not be read safely.'],
    FEISHU_SECRET_REQUIRED: ['请输入飞书 App Secret。', 'Enter the Feishu App Secret.'],
    FEISHU_APP_EXISTS: ['该飞书应用已配置为另一个连接。', 'This Feishu app is already configured by another connection.'],
    FEISHU_BOT_OPEN_ID_REQUIRED: ['配置群聊名单时必须填写机器人 Open ID。', 'Enter the bot Open ID when configuring group chats.'],
    FEISHU_ALLOWLIST_REQUIRED: ['请至少添加一个允许用户 ID。', 'Add at least one allowed user ID.'],
    FEISHU_RESULT_NOT_FOUND: ['未找到这条消息的完整记录。', 'The full message record could not be found.']
  };

  function errorFromResult(result, fallbackCode) {
    var error = new Error(result && result.message ? String(result.message) : 'Request failed');
    error.code = result && result.code ? String(result.code) : (fallbackCode || 'FEISHU_ACTION_FAILED');
    return error;
  }
  function formatError(error) {
    var code = String(error && error.code || '');
    var pair = errorText[code];
    if (pair) return tr(pair[0], pair[1]);
    if (error && error.message) return String(error.message);
    return tr('飞书操作失败，请刷新状态后重试。', 'The Feishu action failed. Refresh the status and try again.');
  }
  function bridgeCall(name, args) {
    var bridge = root.grokbot;
    if (!bridge || typeof bridge[name] !== 'function') {
      var unavailable = new Error(tr('飞书桌面连接不可用。', 'The Feishu desktop bridge is unavailable.'));
      unavailable.code = 'FEISHU_BRIDGE_UNAVAILABLE';
      throw unavailable;
    }
    return Promise.resolve(bridge[name].apply(bridge, args || []));
  }
  function requireOk(result, fallbackCode) {
    if (!result || result.ok !== true) throw errorFromResult(result, fallbackCode);
    return result;
  }
  function safeString(value) { return typeof value === 'string' ? value : ''; }
  function stringList(value) {
    return Array.isArray(value) ? value.filter(function (item) { return typeof item === 'string' && item.trim(); }).map(function (item) { return item.trim(); }) : [];
  }
  function normalizeRecent(item) {
    item = item && typeof item === 'object' ? item : {};
    var requestId = safeString(item.requestId || item.id);
    return {
      id: requestId,
      requestId: requestId,
      status: safeString(item.status),
      error: safeString(item.error),
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null
    };
  }
  function normalizeConnection(item) {
    item = item && typeof item === 'object' ? item : {};
    return {
      id: safeString(item.id),
      name: safeString(item.name),
      appId: safeString(item.appId),
      botId: safeString(item.botId),
      botOpenId: safeString(item.botOpenId),
      allowedUsers: stringList(item.allowedUsers),
      allowedGroups: stringList(item.allowedGroups),
      hasSecret: item.hasSecret === true,
      state: safeString(item.state),
      error: safeString(item.error),
      counts: item.counts && typeof item.counts === 'object' ? item.counts : null,
      lastEventAt: item.lastEventAt || null,
      recent: Array.isArray(item.recent) ? item.recent.map(normalizeRecent) : []
    };
  }
  function normalizeBot(item) {
    item = item && typeof item === 'object' ? item : {};
    return {
      id: safeString(item.id),
      name: safeString(item.name || item.id),
      available: item.available === true,
      reason: safeString(item.reason)
    };
  }
  function normalizeStatus(value) {
    if (!value || value.ok !== true || !Array.isArray(value.connections) || !Array.isArray(value.bots)) {
      throw errorFromResult(value, 'FEISHU_STATUS_INVALID');
    }
    return {
      connections: value.connections.map(normalizeConnection).filter(function (connection) { return !!connection.id; }),
      bots: value.bots.map(normalizeBot).filter(function (bot) { return !!bot.id; })
    };
  }
  function connectionById(id) {
    if (!state.snapshot || !id) return null;
    for (var i = 0; i < state.snapshot.connections.length; i += 1) {
      if (state.snapshot.connections[i].id === id) return state.snapshot.connections[i];
    }
    return null;
  }
  function selectedConnection() { return connectionById(state.selectedId); }
  function selectedBot(id) {
    if (!state.snapshot || !id) return null;
    for (var i = 0; i < state.snapshot.bots.length; i += 1) {
      if (state.snapshot.bots[i].id === id) return state.snapshot.bots[i];
    }
    return null;
  }
  function stateLabel(value) {
    if (value === 'connected') return tr('已连接', 'Connected');
    if (value === 'connecting') return tr('正在连接', 'Connecting');
    if (value === 'disconnected') return tr('已断开', 'Disconnected');
    if (value === 'failed') return tr('连接失败', 'Connection failed');
    return tr('未知状态', 'Unknown state');
  }
  function stateTone(value) {
    if (value === 'connected') return 'connected';
    if (value === 'connecting') return 'pending';
    if (value === 'failed') return 'error';
    return 'idle';
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
  function parseIds(value) {
    var seen = Object.create(null);
    return String(value || '').split(/[\n,;]+/).map(function (item) { return item.trim(); }).filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
  function formValues() {
    return {
      name: els.name.value.trim(),
      appId: els.appId.value.trim(),
      appSecret: els.appSecret.value,
      botId: els.botId.value,
      botOpenId: els.botOpenId.value.trim(),
      allowedUsers: parseIds(els.allowedUsers.value),
      allowedGroups: parseIds(els.allowedGroups.value)
    };
  }
  function comparable(values) {
    return JSON.stringify({
      name: values.name,
      appId: values.appId,
      botId: values.botId,
      botOpenId: values.botOpenId,
      allowedUsers: values.allowedUsers,
      allowedGroups: values.allowedGroups
    });
  }
  function isDirty() {
    if (!state.baseline) return false;
    return els.appSecret.value.length > 0 || comparable(formValues()) !== comparable(state.baseline);
  }
  function showFieldError(field, message) {
    setMessage(message, 'error');
    if (field) {
      field.focus();
      if (typeof field.reportValidity === 'function') field.reportValidity();
    }
  }
  function validateForm() {
    var values = formValues();
    if (!values.name) return showFieldError(els.name, tr('请填写连接名称。', 'Enter a connection name.'));
    if (!values.appId) return showFieldError(els.appId, tr('请填写飞书 App ID。', 'Enter the Feishu App ID.'));
    if (!values.appSecret && !state.hasSecret) return showFieldError(els.appSecret, tr('请填写飞书 App Secret。', 'Enter the Feishu App Secret.'));
    if (!values.botId || !selectedBot(values.botId) || !selectedBot(values.botId).available) {
      return showFieldError(els.botId, tr('请选择一个可用的本机 BOT。', 'Choose an available local BOT.'));
    }
    if (!values.allowedUsers.length) return showFieldError(els.allowedUsers, tr('请至少添加一个允许用户 ID。', 'Add at least one allowed user ID.'));
    if (values.allowedGroups.length && !values.botOpenId) {
      return showFieldError(els.botOpenId, tr('配置群聊名单时必须填写机器人 Open ID。', 'Enter the bot Open ID when configuring group chats.'));
    }
    return values;
  }

  function renderBotOptions(selectedId) {
    var bots = state.snapshot ? state.snapshot.bots : [];
    var selected = selectedId || '';
    els.botId.replaceChildren();
    var empty = element('option', '', tr('选择 BOT…', 'Select a BOT…'));
    empty.value = '';
    els.botId.appendChild(empty);
    bots.forEach(function (bot) {
      var option = element('option');
      option.value = bot.id;
      option.textContent = bot.name + (bot.available ? '' : ' — ' + (bot.reason || tr('不可用', 'Unavailable')));
      option.disabled = !bot.available;
      els.botId.appendChild(option);
    });
    if (selected && !bots.some(function (bot) { return bot.id === selected; })) {
      var missing = element('option', '', selected + ' — ' + tr('BOT 不可用', 'BOT unavailable'));
      missing.value = selected;
      missing.disabled = true;
      els.botId.appendChild(missing);
    }
    els.botId.value = selected;
  }
  function renderConnectionOptions() {
    var current = state.selectedId || '';
    els.connectionList.replaceChildren();
    var placeholder = element('option', '', state.mode === 'new' ? tr('新建连接', 'New connection') : tr('选择连接…', 'Select a connection…'));
    placeholder.value = '';
    els.connectionList.appendChild(placeholder);
    (state.snapshot ? state.snapshot.connections : []).forEach(function (connection) {
      var option = element('option');
      option.value = connection.id;
      option.textContent = connection.name + ' · ' + stateLabel(connection.state);
      els.connectionList.appendChild(option);
    });
    els.connectionList.value = current;
  }
  function renderForm(connection) {
    state.mode = connection ? 'edit' : 'new';
    state.selectedId = connection ? connection.id : null;
    state.hasSecret = !!(connection && connection.hasSecret);
    els.name.value = connection ? connection.name : '';
    els.appId.value = connection ? connection.appId : '';
    els.appSecret.value = '';
    els.appSecret.placeholder = state.hasSecret
      ? tr('已保存密钥；留空可保留', 'Saved secret; leave blank to keep it')
      : tr('输入飞书 App Secret', 'Enter Feishu App Secret');
    els.botOpenId.value = connection ? connection.botOpenId : '';
    els.allowedUsers.value = connection ? connection.allowedUsers.join('\n') : '';
    els.allowedGroups.value = connection ? connection.allowedGroups.join('\n') : '';
    renderBotOptions(connection ? connection.botId : '');
    state.baseline = connection ? {
      name: connection.name,
      appId: connection.appId,
      botId: connection.botId,
      botOpenId: connection.botOpenId,
      allowedUsers: connection.allowedUsers.slice(),
      allowedGroups: connection.allowedGroups.slice()
    } : { name: '', appId: '', botId: '', botOpenId: '', allowedUsers: [], allowedGroups: [] };
    renderConnectionOptions();
    renderRecent(connection);
    renderConnectionState(connection);
    updateActions();
  }
  function renderConnectionState(connection) {
    if (!state.loaded) {
      els.status.textContent = tr('尚未读取', 'Not checked');
      els.status.dataset.state = 'idle';
    } else if (!connection) {
      els.status.textContent = state.snapshot && state.snapshot.connections.length
        ? tr('新建连接', 'New connection')
        : tr('尚无连接', 'No connections');
      els.status.dataset.state = 'idle';
    } else {
      els.status.textContent = stateLabel(connection.state);
      els.status.dataset.state = stateTone(connection.state);
    }
  }
  function renderRecent(connection) {
    els.recentList.replaceChildren();
    var recent = connection && Array.isArray(connection.recent) ? connection.recent : [];
    els.recentEmpty.hidden = recent.length > 0;
    els.lastEvent.textContent = connection && connection.lastEventAt
      ? tr('最近活动：{time}', 'Last activity: {time}', { time: formatTime(connection.lastEventAt) })
      : '';
    recent.forEach(function (item) {
      if (!item.requestId) return;
      var row = element('li', 'feishu-recent-row');
      var copy = element('div', 'feishu-recent-copy');
      copy.appendChild(element('strong', '', statusForRecent(item.status)));
      var details = [formatTime(item.updatedAt || item.createdAt)];
      if (item.error) details.push(item.error);
      copy.appendChild(element('span', '', details.join(' · ')));
      var view = element('button', 'btn feishu-view-request', tr('查看完整记录', 'View full record'));
      view.type = 'button';
      view.dataset.feishuAction = 'view';
      view.dataset.requestId = item.requestId;
      view.setAttribute('aria-label', tr('查看消息完整记录 {id}', 'View full message record {id}', { id: item.requestId }));
      row.appendChild(copy);
      row.appendChild(view);
      els.recentList.appendChild(row);
    });
    if (!els.recentList.children.length) els.recentEmpty.hidden = false;
  }
  function render() {
    var connection = selectedConnection();
    renderConnectionOptions();
    renderConnectionState(connection);
    renderRecent(connection);
    updateActions();
  }
  function updateActions() {
    if (!els.form) return;
    var connection = selectedConnection();
    var dirty = isDirty();
    var editable = state.loaded && !state.busy;
    [els.name, els.appId, els.appSecret, els.botId, els.botOpenId, els.allowedUsers, els.allowedGroups].forEach(function (field) {
      field.disabled = !editable;
    });
    els.connectionList.disabled = !state.loaded || state.busy;
    els.add.disabled = !state.loaded || state.busy;
    els.refresh.disabled = state.busy;
    els.save.disabled = !editable || !dirty;
    var savedClean = !!connection && !dirty && !state.busy;
    var selectedBotIsAvailable = !!(connection && selectedBot(connection.botId) && selectedBot(connection.botId).available);
    els.probe.disabled = !savedClean || !connection.hasSecret;
    els.connect.disabled = !savedClean || !connection.hasSecret || !selectedBotIsAvailable || connection.state === 'connected' || connection.state === 'connecting';
    els.disconnect.disabled = !connection || state.busy || (connection.state !== 'connected' && connection.state !== 'connecting');
    els.disconnect.hidden = !connection || (connection.state !== 'connected' && connection.state !== 'connecting');
    els.connect.hidden = !!(connection && (connection.state === 'connected' || connection.state === 'connecting'));
    els.remove.disabled = !connection || state.busy;
    els.remove.hidden = !connection;
    els.discard.hidden = !dirty;
    els.discard.disabled = state.busy;
    els.recentList.querySelectorAll('button[data-feishu-action="view"]').forEach(function (button) { button.disabled = state.busy; });
    syncStatusPoll();
  }
  function loadSelected(id) {
    var connection = connectionById(id);
    renderForm(connection);
  }
  function applySnapshot(value, options) {
    options = options || {};
    var next = normalizeStatus(value);
    var priorId = state.selectedId;
    var priorMode = state.mode;
    var dirty = isDirty();
    state.snapshot = next;
    state.loaded = true;
    state.accountError = '';
    var nextId = null;
    if (options.preferredId && connectionByIdIn(next, options.preferredId)) nextId = options.preferredId;
    else if (priorId && connectionByIdIn(next, priorId)) nextId = priorId;
    else if (dirty && priorMode === 'edit') nextId = priorId;
    else if (priorMode === 'new' && !options.preferredId) nextId = null;
    else if (next.connections.length) nextId = next.connections[0].id;
    state.selectedId = nextId;
    if (!state.mode || options.forceForm || !dirty || priorId !== nextId || (priorMode !== 'new' && !nextId)) {
      loadSelected(nextId);
    } else {
      renderBotOptions(els.botId.value);
      render();
    }
    publishAccounts();
  }
  function publishAccounts() {
    root.document.dispatchEvent(new root.CustomEvent('openbot:feishu-accounts'));
  }
  function connectionByIdIn(snapshot, id) {
    return !!(snapshot && snapshot.connections.some(function (connection) { return connection.id === id; }));
  }
  function setBusy(value, message) {
    state.busy = !!value;
    if (message) setMessage(message, value ? 'pending' : 'idle');
    updateActions();
  }
  function panelIsVisible() {
    return !!(els.panel && !els.panel.hidden && els.settingsMask && !els.settingsMask.classList.contains('hidden') && !root.document.hidden);
  }
  function connectionNeedsStatusPoll(connection) {
    return !!(connection && (connection.state === 'connecting' || connection.state === 'connected'));
  }
  function stopStatusPoll() {
    if (state.pollTimer !== null) root.clearTimeout(state.pollTimer);
    state.pollTimer = null;
  }
  function syncStatusPoll() {
    stopStatusPoll();
    var connection = selectedConnection();
    if (!panelIsVisible() || state.busy || !state.loaded || isDirty() || (els.requestDialog && els.requestDialog.open) || !connectionNeedsStatusPoll(connection)) return;
    state.pollTimer = root.setTimeout(function () {
      state.pollTimer = null;
      if (panelIsVisible() && !state.busy && !isDirty() && !(els.requestDialog && els.requestDialog.open)) {
        refreshStatus({ silent: true });
      }
    }, 2000);
  }
  async function refreshStatus(options) {
    options = options || {};
    var silent = options.silent === true;
    if (state.busy || (silent && (!panelIsVisible() || isDirty() || (els.requestDialog && els.requestDialog.open)))) {
      syncStatusPoll();
      return;
    }
    if (silent) {
      state.busy = true;
      updateActions();
    } else {
      setBusy(true, tr('正在读取飞书连接状态…', 'Reading Feishu connection status…'));
    }
    try {
      var result = requireOk(await bridgeCall('feishuStatus'), 'FEISHU_STATUS_FAILED');
      applySnapshot(result);
      var connection = selectedConnection();
      if (!silent) {
        if (connection && connection.state === 'failed' && connection.error) setMessage(connection.error, 'error');
        else if (!state.snapshot.connections.length) setMessage(tr('尚无飞书连接。新建连接以开始配置。', 'No Feishu connections yet. Add one to begin.'), 'idle');
        else setMessage('', 'idle');
      }
    } catch (error) {
      state.accountError = tr('连接状态读取失败，请刷新重试。', 'Could not read connection status. Refresh to try again.');
      publishAccounts();
      if (!silent) {
        state.loaded = false;
        els.status.textContent = tr('状态不可用', 'Status unavailable');
        els.status.dataset.state = 'error';
        setMessage(formatError(error), 'error');
      }
    } finally {
      state.busy = false;
      updateActions();
    }
  }
  function setMutationStatus(result, method, oldIds) {
    var status = result && result.status;
    if (!status) throw errorFromResult({ code: 'FEISHU_STATUS_INVALID', message: tr('连接结果缺少状态。', 'The connection result did not include its status.') });
    var preferredId = state.selectedId;
    if (method === 'feishuSave' && !preferredId) {
      var next = normalizeStatus(status);
      var fresh = next.connections.filter(function (connection) {
        return oldIds.indexOf(connection.id) < 0 && connection.appId === els.appId.value.trim();
      })[0];
      if (!fresh) fresh = next.connections.filter(function (connection) { return connection.appId === els.appId.value.trim(); })[0];
      preferredId = fresh ? fresh.id : null;
      if (!preferredId) {
        applySnapshot(status, { forceForm: true });
        return;
      }
    }
    applySnapshot(status, { preferredId: preferredId || undefined, forceForm: true });
  }
  async function saveConnection(event) {
    if (event) event.preventDefault();
    if (state.busy || !state.loaded) return;
    var values = validateForm();
    if (!values) return;
    var payload = {
      name: values.name,
      appId: values.appId,
      botId: values.botId,
      botOpenId: values.botOpenId,
      allowedUsers: values.allowedUsers,
      allowedGroups: values.allowedGroups
    };
    if (state.selectedId) payload.id = state.selectedId;
    if (values.appSecret) payload.appSecret = values.appSecret;
    var oldIds = state.snapshot.connections.map(function (connection) { return connection.id; });
    state.busy = true;
    setMessage(tr('正在保存飞书连接…', 'Saving Feishu connection…'), 'pending');
    updateActions();
    try {
      var result = requireOk(await bridgeCall('feishuSave', [payload]), 'FEISHU_SAVE_FAILED');
      els.appSecret.value = '';
      setMutationStatus(result, 'feishuSave', oldIds);
      setMessage(tr('飞书连接已保存。检查凭据或连接前，请确认飞书应用权限与事件订阅。', 'Feishu connection saved. Check the app permissions and event subscription before probing or connecting.'), 'ok');
    } catch (error) {
      setMessage(formatError(error), 'error');
    } finally {
      state.busy = false;
      updateActions();
    }
  }
  async function runConnectionAction(method, successMessage) {
    var connection = selectedConnection();
    if (!connection || state.busy || isDirty()) return;
    state.busy = true;
    setMessage(tr('正在检查…', 'Working…'), 'pending');
    updateActions();
    try {
      var result = requireOk(await bridgeCall(method, [{ id: connection.id }]), method.toUpperCase() + '_FAILED');
      if (method === 'feishuProbe') {
        if (result.health === true) {
          setMessage(tr('应用凭据验证通过；消息权限与事件订阅需在飞书确认。连接状态未改变。', 'App credentials verified. Confirm messaging permissions and event subscriptions in Feishu. The connection state did not change.'), 'ok');
        } else {
          setMessage(tr('凭据或权限检查未通过。', 'Credential or permission check did not pass.'), 'error');
        }
      } else {
        setMutationStatus(result, method, []);
        var updated = selectedConnection();
        var description = updated ? stateLabel(updated.state) : '';
        setMessage((description ? tr('连接状态：{state}', 'Connection state: {state}', { state: description }) : successMessage), updated && updated.state === 'failed' ? 'error' : 'ok');
      }
    } catch (error) {
      setMessage(formatError(error), 'error');
    } finally {
      state.busy = false;
      updateActions();
    }
  }
  async function removeConnection() {
    var connection = selectedConnection();
    if (!connection || state.busy || isDirty()) return;
    state.busy = true;
    setMessage(tr('正在移除飞书连接…', 'Removing Feishu connection…'), 'pending');
    updateActions();
    try {
      var result = requireOk(await bridgeCall('feishuRemove', [{ id: connection.id }]), 'FEISHU_REMOVE_FAILED');
      var status = result.status;
      state.selectedId = null;
      state.mode = 'new';
      state.baseline = null;
      applySnapshot(status, { forceForm: true });
      if (state.snapshot.connections.length) setMessage(tr('飞书连接已移除。', 'Feishu connection removed.'), 'ok');
      else setMessage(tr('飞书连接已移除。可以新建另一个连接。', 'Feishu connection removed. You can add another connection.'), 'ok');
    } catch (error) {
      setMessage(formatError(error), 'error');
    } finally {
      state.busy = false;
      updateActions();
    }
  }
  function discardEdits() {
    if (state.busy) return;
    var connection = selectedConnection();
    loadSelected(connection ? connection.id : null);
    setMessage(tr('未保存的修改已放弃。', 'Unsaved edits were discarded.'), 'idle');
    els.name.focus();
  }
  function startNewConnection() {
    if (state.busy || !state.loaded) return;
    if (isDirty()) {
      setMessage(tr('先保存或放弃当前修改，再新建连接。', 'Save or discard the current edits before adding another connection.'), 'error');
      els.discard.focus();
      return;
    }
    loadSelected(null);
    setMessage(tr('新建飞书连接。保存后才能检查凭据或连接。', 'New Feishu connection. Save it before checking credentials or connecting.'), 'idle');
    els.name.focus();
  }
  function selectConnection() {
    var id = els.connectionList.value || null;
    if (id === state.selectedId) return;
    if (isDirty()) {
      els.connectionList.value = state.selectedId || '';
      setMessage(tr('先保存或放弃当前修改，再切换连接。', 'Save or discard the current edits before switching connections.'), 'error');
      els.discard.focus();
      return;
    }
    loadSelected(id);
    setMessage('', 'idle');
  }

  function accountEditor() {
    var editor = byId('feishu-account-editor');
    if (editor) editor.open = true;
    return editor;
  }
  function accountGuard() {
    if (state.busy || !state.loaded || state.accountError) throw new Error(tr('连接状态尚未就绪，请稍后重试。', 'Connection status is not ready. Try again shortly.'));
    if (isDirty()) {
      accountEditor();
      throw Object.assign(new Error('Unsaved edits'), { code: 'ACCOUNT_UNSAVED_CHANGES' });
    }
  }
  root.OpenBotFeishuAccounts = Object.freeze({
    snapshot: function () {
      return { loaded: state.loaded, error: state.accountError,
        connections: state.snapshot ? state.snapshot.connections.map(function (connection) {
          return { id: connection.id, name: connection.name, appId: connection.appId,
            state: state.accountError ? 'unknown' : connection.state };
        }) : [] };
    },
    open: function (id) {
      accountGuard();
      if (!connectionById(id)) throw new Error(tr('此连接已不存在，请刷新。', 'This connection no longer exists. Refresh the list.'));
      accountEditor();
      els.connectionList.value = id;
      selectConnection();
      els.name.focus();
      return true;
    },
    add: function () {
      accountGuard();
      accountEditor();
      startNewConnection();
      return true;
    }
  });

  function statusForRecent(value) {
    var status = String(value || '');
    var labels = {
      completed: ['已完成', 'Completed'],
      done: ['已完成', 'Completed'],
      failed: ['失败', 'Failed'],
      cancelled: ['已取消', 'Cancelled'],
      running: ['处理中', 'Processing'],
      pending: ['处理中', 'Processing']
    };
    return labels[status] ? tr(labels[status][0], labels[status][1]) : (status || tr('已收到消息', 'Message received'));
  }
  function openRequest(button) {
    var connection = selectedConnection();
    var requestId = button && button.dataset.requestId;
    if (!connection || !requestId || state.busy) return;
    var dialog = els.requestDialog;
    state.returnFocus = button;
    state.busy = true;
    button.disabled = true;
    setMessage(tr('正在读取消息完整记录…', 'Loading the full message record…'), 'pending');
    updateActions();
    bridgeCall('feishuView', [{ id: connection.id, requestId: requestId }]).then(function (result) {
      requireOk(result, 'FEISHU_VIEW_FAILED');
      var request = result.request || {};
      var receipt = result.receipt || {};
      state.resultText = safeString(request.text);
      els.requestInput.textContent = safeString(request.input);
      els.requestFullText.textContent = state.resultText || safeString(request.error) || safeString(receipt.error) || tr('没有保存回复正文。', 'No reply text was saved.');
      var status = statusForRecent(request.status || receipt.status);
      var time = formatTime(request.updatedAt || receipt.updatedAt || request.createdAt || receipt.createdAt);
      var note = [status, time];
      if (request.truncated === true) note.push(tr('展示内容超过界面上限，当前为已保存文本的截断版本。', 'The saved output exceeds this view limit; the displayed text is truncated.'));
      if (request.error || receipt.error) note.push(safeString(request.error || receipt.error));
      els.requestStatus.textContent = note.filter(Boolean).join(' · ');
      els.copyResult.disabled = !state.resultText;
      els.copyStatus.textContent = '';
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else setMessage(tr('此系统不支持打开消息详情窗口。', 'This system cannot open the message details dialog.'), 'error');
      if (state.resultText) els.requestFullText.focus({ preventScroll: true });
      setMessage('', 'idle');
    }).catch(function (error) {
      setMessage(formatError(error), 'error');
    }).finally(function () {
      state.busy = false;
      if (button && button.isConnected) button.disabled = false;
      updateActions();
    });
  }
  async function copyResult() {
    if (!state.resultText) return;
    try {
      if (root.navigator.clipboard && typeof root.navigator.clipboard.writeText === 'function') {
        await root.navigator.clipboard.writeText(state.resultText);
      } else {
        var field = element('textarea');
        field.value = state.resultText;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.left = '-10000px';
        root.document.body.appendChild(field);
        field.select();
        var copied = root.document.execCommand && root.document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      els.copyStatus.textContent = tr('完整结果已复制。', 'Full result copied.');
    } catch (_) {
      els.copyStatus.textContent = tr('无法复制。请选中上方文本并手动复制。', 'Could not copy. Select the text above and copy it manually.');
    }
  }
  function clearRequestDialog() {
    state.resultText = '';
    els.requestInput.textContent = '';
    els.requestFullText.textContent = '';
    els.requestStatus.textContent = '';
    els.copyStatus.textContent = '';
    if (state.returnFocus && state.returnFocus.isConnected) state.returnFocus.focus({ preventScroll: true });
    state.returnFocus = null;
    syncStatusPoll();
  }
  function onRecentClick(event) {
    var button = event.target.closest('button[data-feishu-action="view"]');
    if (button) openRequest(button);
  }
  function onInput() { updateActions(); }
  function init() {
    els.panel = byId('set-panel-apps');
    els.settingsMask = byId('set-mask');
    els.form = byId('feishu-form');
    if (!els.panel || !els.form) return;
    els.connectionList = byId('feishu-connection-list');
    els.add = byId('feishu-add-connection');
    els.refresh = byId('feishu-refresh');
    els.status = byId('feishu-status');
    els.message = byId('feishu-message');
    els.name = byId('feishu-name');
    els.appId = byId('feishu-app-id');
    els.appSecret = byId('feishu-app-secret');
    els.botId = byId('feishu-bot-id');
    els.botOpenId = byId('feishu-bot-open-id');
    els.allowedUsers = byId('feishu-allowed-users');
    els.allowedGroups = byId('feishu-allowed-groups');
    els.save = byId('feishu-save');
    els.discard = byId('feishu-discard');
    els.probe = byId('feishu-probe');
    els.connect = byId('feishu-connect');
    els.disconnect = byId('feishu-disconnect');
    els.remove = byId('feishu-remove');
    els.recentEmpty = byId('feishu-recent-empty');
    els.recentList = byId('feishu-recent-requests');
    els.lastEvent = byId('feishu-last-event');
    els.requestDialog = byId('feishu-request-dialog');
    els.requestStatus = byId('feishu-request-status');
    els.requestInput = byId('feishu-request-input');
    els.requestFullText = byId('feishu-request-full-text');
    els.copyResult = byId('feishu-copy-result');
    els.copyStatus = byId('feishu-copy-status');

    // The account roster is the single connection picker. Keep its existing
    // fields and handlers for compatibility, without a second visible picker.
    var layout = els.form.closest('.feishu-layout');
    if (layout && root.OpenBotAppAccounts) {
      var editor = element('details', 'app-account-editor');
      editor.id = 'feishu-account-editor';
      editor.appendChild(element('summary', '', tr('连接设置', 'Connection settings')));
      layout.parentNode.insertBefore(editor, layout);
      editor.appendChild(layout);
      layout.classList.add('has-account-list');
      layout.querySelector('.feishu-connections').hidden = true;
    }

    els.refresh.addEventListener('click', refreshStatus);
    els.add.addEventListener('click', startNewConnection);
    els.connectionList.addEventListener('change', selectConnection);
    els.form.addEventListener('submit', saveConnection);
    [els.name, els.appId, els.appSecret, els.botId, els.botOpenId, els.allowedUsers, els.allowedGroups].forEach(function (field) {
      field.addEventListener('input', onInput);
      field.addEventListener('change', onInput);
    });
    els.discard.addEventListener('click', discardEdits);
    els.probe.addEventListener('click', function () { runConnectionAction('feishuProbe'); });
    els.connect.addEventListener('click', function () { runConnectionAction('feishuConnect'); });
    els.disconnect.addEventListener('click', function () { runConnectionAction('feishuDisconnect'); });
    els.remove.addEventListener('click', removeConnection);
    els.recentList.addEventListener('click', onRecentClick);
    els.copyResult.addEventListener('click', copyResult);
    byId('feishu-request-close').addEventListener('click', function () { els.requestDialog.close(); });
    els.requestDialog.addEventListener('close', clearRequestDialog);
    els.requestDialog.addEventListener('cancel', function () { clearRequestDialog(); });

    var wasVisible = !els.panel.hidden && els.settingsMask && !els.settingsMask.classList.contains('hidden');
    function onVisibilityChange() {
      if (panelIsVisible() && connectionNeedsStatusPoll(selectedConnection())) refreshStatus({ silent: true });
      else syncStatusPoll();
    }
    root.document.addEventListener('visibilitychange', onVisibilityChange);
    if (typeof root.MutationObserver === 'function') {
      var observer = new root.MutationObserver(function () {
        var visible = !els.panel.hidden && els.settingsMask && !els.settingsMask.classList.contains('hidden');
        if (!wasVisible && visible) refreshStatus();
        else if (!visible) syncStatusPoll();
        wasVisible = visible;
      });
      observer.observe(els.panel, { attributes: true, attributeFilter: ['hidden'] });
      if (els.settingsMask) observer.observe(els.settingsMask, { attributes: true, attributeFilter: ['class', 'hidden'] });
    }
    if (wasVisible) refreshStatus();
    updateActions();
  }
  function start() {
    Promise.resolve(root.OpenBotI18n && root.OpenBotI18n.ready).then(init);
  }
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window);
