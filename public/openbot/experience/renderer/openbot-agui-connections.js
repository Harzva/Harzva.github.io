/* External AG-UI connection settings for the native App connections page. */
(function (root) {
  'use strict';

  var bridge = null;
  var initialized = false;
  var busy = false;
  var connections = [];
  var disclosure = null;
  var editing = null;
  var els = {};

  function t(zh, en, params) {
    return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en, params) :
      (root.document.documentElement.lang === 'en' ? en : zh);
  }

  function node(tag, className, text) {
    var element = root.document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function currentConnection(id) {
    return connections.find(function (item) { return item.id === id; }) || null;
  }

  function setStatus(message, isError) {
    if (!els.status) return;
    els.status.textContent = message || '';
    els.status.dataset.state = isError ? 'error' : 'idle';
  }

  function resultError(result, fallback) {
    return String(result && (result.message || result.error || result.code) || fallback);
  }

  function setBusy(value) {
    busy = value === true;
    if (els.form) {
      Array.prototype.forEach.call(els.form.querySelectorAll('input, button'), function (control) {
        control.disabled = busy;
      });
      if (!busy) {
        els.clearCredential.disabled = !editing || editing.hasCredential !== true;
        els.token.disabled = els.clearCredential.checked;
      }
    }
    if (els.add) els.add.disabled = busy;
    if (els.retry) els.retry.disabled = busy;
    if (els.list) {
      Array.prototype.forEach.call(els.list.querySelectorAll('button'), function (button) {
        button.disabled = busy;
      });
    }
  }

  function localeDisclosureText() {
    if (!disclosure) return '';
    var isEnglish = root.OpenBotI18n
      ? root.OpenBotI18n.locale === 'en'
      : root.document.documentElement.lang === 'en';
    return String(isEnglish ? disclosure.textEn || disclosure.text || '' : disclosure.text || disclosure.textEn || '');
  }

  function renderDisclosure() {
    if (!els.disclosure) return;
    els.disclosure.textContent = localeDisclosureText();
  }

  function resetForm(closeEditor) {
    if (!els.form) return;
    editing = null;
    els.form.reset();
    els.id.value = '';
    els.name.value = '';
    els.endpoint.value = '';
    els.token.value = '';
    els.token.disabled = false;
    els.clearCredential.checked = false;
    els.clearCredential.disabled = true;
    els.clearCredentialLabel.hidden = true;
    els.token.placeholder = t('输入 Bearer 令牌', 'Enter a Bearer token');
    els.summary.textContent = t('添加外部 Agent', 'Add external Agent');
    els.summary.hidden = true;
    els.cancel.hidden = true;
    els.editor.open = !closeEditor;
    updateCredentialNote();
  }

  function updateCredentialNote() {
    if (!els.tokenNote) return;
    if (editing && editing.hasCredential) {
      els.tokenNote.textContent = t('已保存的令牌不会回显；留空则保留。', 'The saved token is never returned; leave blank to keep it.');
    } else {
      els.tokenNote.textContent = t('可留空；令牌不会回读。', 'Optional. The token is never returned.');
    }
    if (editing && editing.hasCredential && els.endpoint.value.trim() !== editing.endpoint) {
      els.tokenNote.textContent = t('端点已更改：请重新输入令牌，或选择清除。', 'Endpoint changed: enter the token again or choose to clear it.');
    }
  }

  function openEdit(connection) {
    editing = connection;
    els.id.value = connection.id;
    els.name.value = connection.name;
    els.endpoint.value = connection.endpoint;
    els.token.value = '';
    els.token.disabled = false;
    els.clearCredential.checked = false;
    els.clearCredential.disabled = connection.hasCredential !== true;
    els.clearCredentialLabel.hidden = connection.hasCredential !== true;
    els.token.placeholder = connection.hasCredential === true
      ? t('留空保留已保存令牌', 'Leave blank to keep the saved token')
      : t('输入 Bearer 令牌', 'Enter a Bearer token');
    els.summary.textContent = t('编辑：{name}', 'Edit: {name}', { name: connection.name });
    els.summary.hidden = false;
    els.cancel.hidden = false;
    els.editor.open = true;
    updateCredentialNote();
    els.name.focus({ preventScroll: true });
  }

  function validateEndpoint(value) {
    var parsed;
    try { parsed = new URL(value); }
    catch (_) { return t('请输入有效的 HTTP(S) 端点。', 'Enter a valid HTTP(S) endpoint.'); }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
      return t('端点不能包含账号、密码、查询参数或片段。', 'The endpoint cannot contain credentials, a query, or a fragment.');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return t('端点必须使用 HTTPS；HTTP 仅限本机回环地址。', 'Use HTTPS; HTTP is allowed only for loopback addresses.');
    }
    if (parsed.protocol === 'http:') {
      var literalLoopback = /^http:\/\/(?:127\.0\.0\.1|\[::1\])(?::[0-9]+)?(?:\/|$)/i.test(value);
      if (!literalLoopback) return t('HTTP 端点仅允许 127.0.0.1 或 [::1]。', 'HTTP endpoints are limited to 127.0.0.1 or [::1].');
    }
    return '';
  }

  function renderList() {
    if (!els.list) return;
    els.list.replaceChildren();
    if (!connections.length) {
      els.empty.hidden = false;
      return;
    }
    els.empty.hidden = true;
    connections.forEach(function (connection) {
      var row = node('div', 'agui-connection-row');
      row.setAttribute('role', 'listitem');
      var copy = node('div', 'agui-connection-copy');
      copy.appendChild(node('strong', 'agui-connection-name', connection.name));
      copy.appendChild(node('code', 'agui-connection-endpoint', connection.endpoint));
      var credential = connection.hasCredential === true
        ? t('Bearer 已保存', 'Bearer saved')
        : t('无 Bearer', 'No Bearer');
      copy.appendChild(node('span', 'agui-connection-meta', credential));
      var actions = node('div', 'agui-connection-actions');
      var edit = node('button', 'btn agui-connection-edit', t('编辑', 'Edit'));
      edit.type = 'button';
      edit.setAttribute('aria-label', t('编辑 {name}', 'Edit {name}', { name: connection.name }));
      edit.addEventListener('click', function () { openEdit(connection); });
      var toggle = node('button', 'btn agui-connection-toggle', connection.enabled === true
        ? t('停用', 'Disable') : t('启用', 'Enable'));
      toggle.type = 'button';
      toggle.setAttribute('aria-label', connection.enabled === true
        ? t('停用 {name}', 'Disable {name}', { name: connection.name })
        : t('启用 {name}', 'Enable {name}', { name: connection.name }));
      toggle.addEventListener('click', function () { toggleConnection(connection); });
      actions.appendChild(edit);
      actions.appendChild(toggle);
      var state = node('span', 'agui-connection-state', connection.enabled === true
        ? t('已启用', 'Enabled') : t('已停用', 'Disabled'));
      state.dataset.enabled = connection.enabled === true ? 'true' : 'false';
      actions.appendChild(state);
      row.appendChild(copy);
      row.appendChild(actions);
      els.list.appendChild(row);
    });
  }

  function refresh() {
    if (!initialized) return Promise.resolve();
    if (!bridge || typeof bridge.aguiConnectionsStatus !== 'function') {
      connections = [];
      renderList();
      renderDisclosure();
      setStatus(t('外部 Agent 连接需要桌面版。', 'External Agent connections require the desktop app.'), true);
      if (els.retry) els.retry.hidden = true;
      return Promise.resolve(false);
    }
    setStatus(t('正在读取连接…', 'Reading connections…'), false);
    if (els.retry) els.retry.hidden = true;
    return Promise.resolve().then(function () {
      return bridge.aguiConnectionsStatus();
    }).then(function (result) {
      if (!result || result.ok !== true || !Array.isArray(result.connections)) {
        throw new Error(resultError(result, t('无法读取连接列表。', 'Could not read the connection list.')));
      }
      connections = result.connections.filter(function (item) {
        return item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.endpoint === 'string';
      }).map(function (item) {
        return { id: item.id, name: item.name, endpoint: item.endpoint,
          revision: item.revision, enabled: item.enabled === true, hasCredential: item.hasCredential === true };
      });
      disclosure = result.disclosure && typeof result.disclosure === 'object' ? {
        text: typeof result.disclosure.text === 'string' ? result.disclosure.text : '',
        textEn: typeof result.disclosure.textEn === 'string' ? result.disclosure.textEn : ''
      } : null;
      renderDisclosure();
      renderList();
      setStatus('', false);
      if (editing) {
        var current = currentConnection(editing.id);
        if (current) openEdit(current);
        else resetForm(true);
      }
      return true;
    }).catch(function (error) {
      setStatus(String(error && error.message || t('无法读取连接列表。', 'Could not read the connection list.')), true);
      if (els.retry) els.retry.hidden = false;
      return false;
    });
  }

  function action(request, successMessage) {
    if (busy) return Promise.resolve();
    if (!bridge || typeof bridge.aguiConnectionsAction !== 'function') {
      setStatus(t('桌面连接服务不可用。', 'The desktop connection service is unavailable.'), true);
      return Promise.resolve();
    }
    setBusy(true);
    setStatus(t('正在保存…', 'Saving…'), false);
    return Promise.resolve().then(function () {
      return bridge.aguiConnectionsAction(request);
    }).then(function (result) {
      if (!result || result.ok !== true) throw new Error(resultError(result, t('保存未完成。', 'The save did not complete.')));
      return refresh().then(function (refreshed) {
        if (successMessage) setStatus(refreshed ? successMessage : t('已保存，但无法刷新连接状态；请重试读取。', 'Saved, but the connection status could not be refreshed. Try loading again.'), !refreshed);
        return true;
      });
    }).catch(function (error) {
      var message = String(error && error.message || t('保存未完成。', 'The save did not complete.'));
      if (/revision|stale|conflict/i.test(String(error && (error.code || error.message) || ''))) {
        return refresh().then(function () {
          setStatus(message, true);
          return false;
        });
      }
      setStatus(message, true);
      return false;
    }).finally(function () {
      setBusy(false);
    });
  }

  function saveForm(event) {
    event.preventDefault();
    if (busy) return;
    var name = els.name.value.trim();
    var endpoint = els.endpoint.value.trim();
    if (!name) {
      setStatus(t('请输入连接名称。', 'Enter a connection name.'), true);
      els.name.focus();
      return;
    }
    if (name.length > 64) {
      setStatus(t('连接名称最多 64 个字符。', 'Connection names are limited to 64 characters.'), true);
      els.name.focus();
      return;
    }
    if (!endpoint) {
      setStatus(t('请输入端点。', 'Enter an endpoint.'), true);
      els.endpoint.focus();
      return;
    }
    var endpointError = validateEndpoint(endpoint);
    if (endpointError) {
      setStatus(endpointError, true);
      els.endpoint.focus();
      return;
    }
    var token = els.token.value;
    var clearCredential = els.clearCredential.checked;
    if (token && clearCredential) {
      setStatus(t('输入新令牌与清除令牌不能同时选择。', 'Enter a token or clear the saved token, not both.'), true);
      return;
    }
    if (editing && editing.hasCredential && endpoint !== editing.endpoint && !token && !clearCredential) {
      setStatus(t('端点已更改；请重新输入 Bearer 令牌，或选择清除。', 'The endpoint changed. Enter the Bearer token again or choose to clear it.'), true);
      els.token.focus();
      return;
    }
    var credential = clearCredential ? { operation: 'clear' } : token
      ? { operation: 'set', token: token } : { operation: 'keep' };
    var request = {
      action: 'save',
      name: name,
      endpoint: endpoint,
      enabled: true,
      credential: credential
    };
    if (editing) {
      request.id = editing.id;
      request.expectedRevision = editing.revision;
    }
    return action(request, t('连接已保存。', 'Connection saved.')).then(function (saved) {
      if (saved) resetForm(true);
    });
  }

  function toggleConnection(connection) {
    if (busy) return;
    if (connection.enabled === true) {
      return action({ action: 'disable', id: connection.id, expectedRevision: connection.revision },
        t('连接已停用。', 'Connection disabled.'));
    }
    return action({ action: 'save', id: connection.id, expectedRevision: connection.revision,
      name: connection.name, endpoint: connection.endpoint, enabled: true,
      credential: { operation: 'keep' } }, t('连接已启用。', 'Connection enabled.'));
  }

  function init(options) {
    bridge = options && options.bridge || bridge;
    if (initialized) return refresh();
    els.root = root.document.getElementById('agui-connections');
    if (!els.root) return Promise.resolve();
    els.status = root.document.getElementById('agui-connections-status');
    els.disclosure = root.document.getElementById('agui-connections-disclosure');
    els.list = root.document.getElementById('agui-connections-list');
    els.empty = root.document.getElementById('agui-connections-empty');
    els.add = root.document.getElementById('agui-connections-add');
    els.retry = root.document.getElementById('agui-connections-retry');
    els.editor = root.document.getElementById('agui-connections-editor');
    els.summary = root.document.getElementById('agui-connections-editor-summary');
    els.form = root.document.getElementById('agui-connections-form');
    els.id = root.document.getElementById('agui-connection-id');
    els.name = root.document.getElementById('agui-connection-name');
    els.endpoint = root.document.getElementById('agui-connection-endpoint');
    els.token = root.document.getElementById('agui-connection-token');
    els.tokenNote = root.document.getElementById('agui-connection-token-note');
    els.clearCredential = root.document.getElementById('agui-connection-clear-token');
    els.clearCredentialLabel = root.document.getElementById('agui-connection-clear-token-label');
    els.cancel = root.document.getElementById('agui-connection-cancel');
    if (!els.form || !els.list || !els.editor) return Promise.resolve();
    initialized = true;
    els.form.addEventListener('submit', saveForm);
    els.add.addEventListener('click', function () {
      resetForm(false);
      els.name.focus({ preventScroll: true });
    });
    els.cancel.addEventListener('click', function () { resetForm(true); });
    els.retry.addEventListener('click', refresh);
    els.endpoint.addEventListener('input', updateCredentialNote);
    els.clearCredential.addEventListener('change', function () {
      els.token.disabled = busy || els.clearCredential.checked;
    });
    els.editor.addEventListener('toggle', function () {
      if (!els.editor.open && editing && !busy) resetForm(true);
    });
    return refresh();
  }

  root.OpenBotAguiConnections = { init: init, refresh: refresh };
})(window);
