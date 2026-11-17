/* Local project discovery and Meta Profile recommendation surfaces. */
(function (root) {
  'use strict';

  var activeDialog = null;
  var retryableActions = ['scan', 'analyze', 'apply', 'export', 'import'];
  var busyStatuses = ['scanning', 'analyzing', 'applying'];

  function tr(zh, en) {
    return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en) : zh;
  }

  function el(tag, className, text) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function button(label, className, handler) {
    var node = el('button', className || '', label);
    node.type = 'button';
    if (handler) node.addEventListener('click', handler);
    return node;
  }

  function operationId() {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
      var random = Math.random() * 16 | 0;
      return (char === 'x' ? random : random & 3 | 8).toString(16);
    });
  }

  function clone(value) {
    if (!value || typeof value !== 'object') return value;
    try { return JSON.parse(JSON.stringify(value)); } catch (error) { return value; }
  }

  function errorText(value, fallback) {
    if (typeof value === 'string' && value) return value;
    if (value && typeof value === 'object') {
      if (typeof value.message === 'string' && value.message) return value.message;
      if (typeof value.error === 'string' && value.error) return value.error;
    }
    return fallback || tr('操作失败，请重试。', 'The operation failed. Try again.');
  }

  function validateScope(scope) {
    if (!scope || !scope.spaceId || scope.scopeRevision === undefined || scope.scopeRevision === null) {
      throw new Error(tr('当前工作空间范围不可用。', 'The current workspace scope is unavailable.'));
    }
  }

  function validateResponse(result, scope, requireOk) {
    if (!result || typeof result !== 'object') throw new Error(tr('未收到本机发现回执。', 'No local discovery response was received.'));
    if (result.ok === false || requireOk && result.ok !== true) throw new Error(errorText(result, tr('本机发现服务未确认此操作。', 'The local discovery service did not confirm this action.')));
    var responseScope = result.scope || result;
    if (responseScope.spaceId !== undefined && String(responseScope.spaceId) !== String(scope.spaceId) ||
        responseScope.scopeRevision !== undefined && String(responseScope.scopeRevision) !== String(scope.scopeRevision)) {
      throw new Error(tr('工作空间已变化，已忽略过期回执。', 'The workspace changed; the stale response was ignored.'));
    }
    return result;
  }

  function invoke(action, input, scope) {
    validateScope(scope);
    var api = root.api && typeof root.api.localDiscovery === 'function' ? root.api : root.grokbot;
    if (!api || typeof api.localDiscovery !== 'function') {
      return Promise.reject(new Error(tr('本机发现服务暂不可用。', 'Local discovery is not available yet.')));
    }
    return Promise.resolve(api.localDiscovery(action, Object.assign({ scope: {
      spaceId: String(scope.spaceId), scopeRevision: scope.scopeRevision
    } }, input || {}))).then(function (result) {
      return validateResponse(result, scope, action !== 'state');
    });
  }

  function threadRefFrom(result) {
    if (result && result.threadRef && result.threadRef.type && result.threadRef.id !== undefined) return result.threadRef;
    if (result && result.entity && result.entity.type === 'Thread' && result.entity.id !== undefined) return { type: 'Thread', id: result.entity.id };
    if (result && result.threadId !== undefined && result.threadId !== null) return { type: 'Thread', id: result.threadId };
    return null;
  }

  function projectChat(options) {
    options = options || {};
    var scope = options.scope;
    return invoke('projectChat', {
      projectId: String(options.projectId || ''),
      operationId: String(options.operationId || operationId()),
      title: options.title ? String(options.title) : undefined
    }, scope).then(function (result) {
      if (!threadRefFrom(result)) throw new Error(errorText(result, tr('项目会话没有返回可打开的会话引用。', 'Project chat did not return a thread reference that can be opened.')));
      return result;
    });
  }

  function continueHistory(options) {
    options = options || {};
    var historyRef = options.historyRef || {};
    if (!options.scope || String(options.scope.spaceId) !== 'personal') {
      return Promise.reject(new Error(tr('仅个人空间支持 Codex 历史接续。', 'Codex history continuation is available in the personal space only.')));
    }
    var resultInput = {
      projectId: String(options.projectId || ''),
      operationId: String(options.operationId || operationId()),
      sourceId: String(historyRef.sourceId || options.sourceId || ''),
      sourceThreadId: String(historyRef.sourceThreadId || historyRef.threadId || options.sourceThreadId || options.threadId || ''),
      explicitSelection: true
    };
    if (options.title) resultInput.title = String(options.title);
    return invoke('continueHistory', resultInput, options.scope).then(function (result) {
      if (!threadRefFrom(result)) throw new Error(errorText(result, tr('接续没有返回可打开的新 Bot Studio 会话。', 'Continuation did not return a new Bot Studio thread that can be opened.')));
      if (result.nativeResume === true) throw new Error(tr('来源请求了原生恢复；此入口仅支持创建新的 Bot Studio 接续会话。', 'The source requested native resume; this entry only supports a new Bot Studio continuation thread.'));
      return result;
    });
  }

  function continueNative(options) {
    options = options || {};
    var historyRef = options.historyRef || {};
    var mode = String(options.mode || '');
    if (mode !== 'fork' && mode !== 'resume') {
      return Promise.reject(new Error(tr('请选择 Codex 原生分支或原会话接续方式。', 'Choose a Codex native fork or original-session continuation mode.')));
    }
    if (!options.scope || String(options.scope.spaceId) !== 'personal') {
      return Promise.reject(new Error(tr('仅个人空间支持 Codex 原生接续。', 'Codex native continuation is available in the personal space only.')));
    }
    var resultInput = {
      projectId: String(options.projectId || ''),
      operationId: String(options.operationId || operationId()),
      sourceId: String(historyRef.sourceId || ''),
      sourceThreadId: String(historyRef.sourceThreadId || ''),
      explicitSelection: true,
      mode: mode
    };
    if (options.title) resultInput.title = String(options.title);
    return invoke('continueNative', resultInput, options.scope).then(function (result) {
      if (!threadRefFrom(result)) throw new Error(errorText(result, tr('原生接续没有返回可打开的 Bot Studio 会话。', 'Native continuation did not return an Bot Studio thread that can be opened.')));
      var expectedMode = mode === 'fork' ? 'native-fork-pending' : 'native-resume-pending';
      if (result.nativeResume !== false || result.mode !== expectedMode) {
        throw new Error(tr('接续回执未确认这是待发送的 Codex 绑定；原会话尚未执行。', 'The receipt did not confirm a pending Codex binding; the original session has not been run.'));
      }
      return result;
    });
  }

  function stateObject(result) {
    if (!result || typeof result !== 'object') return { status: 'idle', roots: [], inventory: null, proposal: null, applyStarted: false };
    return Object.assign({ status: 'idle', roots: [], inventory: null, proposal: null, applyStarted: false }, result, {
      roots: Array.isArray(result.roots) ? result.roots : [],
      inventory: result.inventory || null,
      proposal: result.proposal || null
    });
  }

  function formatCount(value) {
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'number' && isFinite(value)) return value;
    return null;
  }

  function rootLabel(item) {
    if (typeof item === 'string') return item;
    return String(item && (item.path || item.canonicalPath || item.name || item.id) || '');
  }

  function projectLabel(project) {
    return String(project && (project.name || project.title || project.canonicalPath || project.path || project.id) || '');
  }

  function botLabel(bot) {
    var name = String(bot && (bot.name || bot.title || bot.id) || '');
    var role = String(bot && bot.role || '');
    return role ? name + ' — ' + role : name;
  }

  function statusLabel(status) {
    var labels = {
      idle: ['尚未开始', 'Not started'], scanning: ['扫描中', 'Scanning'], scanned: ['扫描完成', 'Scan complete'],
      analyzing: ['分析中', 'Analyzing'], ready: ['建议已就绪', 'Recommendations ready'], applying: ['正在初始化', 'Applying initialization'],
      applied: ['初始化完成', 'Initialized'], failed: ['失败', 'Failed'], cancelled: ['已停止', 'Stopped']
    };
    var pair = labels[String(status || '')];
    return pair ? tr(pair[0], pair[1]) : String(status || '');
  }

  function currentWorkspaceMatches(options) {
    if (typeof options.getCurrentScope !== 'function') return true;
    var current = options.getCurrentScope();
    return !!current && String(current.spaceId) === String(options.scope.spaceId) &&
      String(current.scopeRevision) === String(options.scope.scopeRevision);
  }

  function DiscoveryDialog(options) {
    this.options = options || {};
    this.scope = options.scope;
    this.projects = Array.isArray(options.projects) ? options.projects : [];
    this.state = { status: 'idle', roots: [], inventory: null, proposal: null, applyStarted: false };
    this.draftProposal = null;
    this.lastAction = '';
    this.operationIds = Object.create(null);
    this.actionError = '';
    this.exportReceipt = null;
    this.localAction = '';
    this.stopPending = false;
    this.pollTimer = 0;
    this.polling = false;
    this.closed = false;
    this.priorFocus = root.document.activeElement;
    this._onKeyDown = this.onKeyDown.bind(this);
    this.mount();
  }

  DiscoveryDialog.prototype.mount = function () {
    var self = this;
    this.overlay = el('div', 'owld-overlay');
    this.dialog = el('section', 'owld-dialog');
    this.dialog.dataset.owldModal = 'true';
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');
    this.dialog.setAttribute('aria-labelledby', 'owld-title');
    this.dialog.tabIndex = -1;
    var header = el('header', 'owld-header');
    var titleGroup = el('div', 'owld-title-group');
    var title = el('h2', '', tr('扫描本机', 'Scan this computer'));
    title.id = 'owld-title';
    titleGroup.appendChild(title);
    titleGroup.appendChild(el('p', '', tr('先选择目录；扫描完成后再生成可编辑的 Meta Profile 建议。', 'Choose folders first. After scanning, review and edit the Meta Profile recommendations.')));
    header.appendChild(titleGroup);
    this.closeButton = button(tr('关闭', 'Close'), 'owld-close', function () { self.requestClose(); });
    this.closeButton.dataset.owldAction = 'close';
    this.closeButton.setAttribute('aria-label', tr('关闭扫描面板', 'Close scan panel'));
    header.appendChild(this.closeButton);
    this.dialog.appendChild(header);
    this.content = el('div', 'owld-content');
    this.dialog.appendChild(this.content);
    this.footer = el('footer', 'owld-footer');
    this.dialog.appendChild(this.footer);
    this.overlay.appendChild(this.dialog);
    root.document.body.appendChild(this.overlay);
    root.document.addEventListener('keydown', this._onKeyDown, true);
    this.render();
    this.dialog.focus();
    this.loadState().then(function () { self.startPollingIfNeeded(); });
  };

  DiscoveryDialog.prototype.isBusy = function () {
    return !!this.localAction || !!this.stopPending || busyStatuses.indexOf(String(this.state.status || '')) >= 0;
  };

  DiscoveryDialog.prototype.applicationComplete = function () {
    return String(this.state.application && this.state.application.status || '') === 'complete';
  };

  DiscoveryDialog.prototype.planLocked = function () {
    return this.state.status === 'applied' || this.state.applyStarted === true;
  };

  DiscoveryDialog.prototype.canStartDiscovery = function () {
    return this.state.applyStarted !== true || this.applicationComplete();
  };

  DiscoveryDialog.prototype.syncState = function (result, action) {
    this.state = stateObject(result);
    if (this.state.proposal) {
      if (!this.draftProposal || this.state.applyStarted === true || action === 'analyze' || action === 'import') {
        this.draftProposal = clone(this.state.proposal);
      }
    } else if (this.state.applyStarted !== true) {
      this.draftProposal = null;
    }
  };

  DiscoveryDialog.prototype.ensureScope = function () {
    if (this.closed) throw new Error(tr('扫描面板已关闭。', 'The scan panel is closed.'));
    if (!currentWorkspaceMatches(this.options)) throw new Error(tr('工作空间已切换，请关闭并重新打开扫描面板。', 'The workspace changed. Close and reopen the scan panel.'));
  };

  DiscoveryDialog.prototype.loadState = function () {
    var self = this;
    try { this.ensureScope(); } catch (error) { this.actionError = error.message; this.render(); return Promise.resolve(false); }
    return invoke('state', {}, this.scope).then(function (result) {
      if (self.closed) return false;
      self.syncState(result, 'state');
      self.actionError = '';
      self.releaseCompletedOperation();
      self.render();
      return true;
    }).catch(function (error) {
      if (!self.closed) { self.actionError = errorText(error, tr('无法读取扫描状态。', 'Unable to read discovery state.')); self.render(); }
      return false;
    });
  };

  DiscoveryDialog.prototype.releaseCompletedOperation = function () {
    if (this.state.status === 'failed' || busyStatuses.indexOf(String(this.state.status || '')) >= 0) return;
    if (this.state.applyStarted === true && (this.state.status === 'cancelled' || this.state.status === 'failed')) return;
    if (this.lastAction) this.operationIds[this.lastAction] = '';
  };

  DiscoveryDialog.prototype.startPollingIfNeeded = function () {
    var self = this;
    if (this.closed || this.pollTimer || !this.isBusy()) return;
    this.pollTimer = root.setTimeout(function () {
      self.pollTimer = 0;
      if (self.closed || self.polling || !self.isBusy()) return;
      self.polling = true;
      invoke('state', {}, self.scope).then(function (result) {
        if (self.closed) return;
        self.syncState(result, 'state');
        self.releaseCompletedOperation();
        self.render();
      }).catch(function (error) {
        if (!self.closed) { self.actionError = errorText(error, tr('无法更新扫描进度。', 'Unable to refresh discovery progress.')); self.render(); }
      }).finally(function () {
        self.polling = false;
        self.startPollingIfNeeded();
      });
    }, 850);
  };

  DiscoveryDialog.prototype.runAction = function (action, input, options) {
    var self = this;
    options = options || {};
    try { this.ensureScope(); } catch (error) { this.actionError = error.message; this.render(); return Promise.resolve(false); }
    if (this.localAction && !options.allowConcurrent) return Promise.resolve(false);
    if (!this.operationIds[action] || options.newOperation) this.operationIds[action] = operationId();
    this.localAction = action;
    this.lastAction = action;
    if (action === 'scan' || action === 'analyze' || action === 'selectAgents') this.draftProposal = null;
    this.actionError = '';
    this.exportReceipt = null;
    this.render();
    this.startPollingIfNeeded();
    return invoke(action, Object.assign({ operationId: this.operationIds[action] }, input || {}), this.scope).then(function (result) {
      if (self.closed) return false;
      if (result.roots || result.inventory || result.proposal || result.status) {
        self.syncState(result, action);
      } else if (action !== 'export') {
        return self.loadState().then(function (loaded) {
          if (!loaded && action === 'apply') throw new Error(tr('没有收到初始化回执。', 'No initialization receipt was received.'));
          return true;
        });
      }
      if (action === 'apply' && ['applying', 'applied', 'failed', 'cancelled'].indexOf(String(self.state.status)) < 0) {
        throw new Error(tr('初始化回执没有可识别的状态。', 'The initialization receipt did not include a recognized status.'));
      }
      if (action === 'export' && result.canceled !== true) {
        if (result.path) self.exportReceipt = { path: String(result.path) };
        else if (result.json !== undefined) self.exportReceipt = { json: result.json, fileName: result.fileName };
        else throw new Error(tr('导出服务没有返回文件路径或 JSON 内容。', 'Export did not return a file path or JSON content.'));
      }
      if (action === 'export' || action === 'chooseRoots' || busyStatuses.indexOf(String(self.state.status || '')) < 0 && self.state.status !== 'failed') {
        self.operationIds[action] = '';
      }
      self.actionError = '';
      self.render();
      return true;
    }).catch(function (error) {
      if (!self.closed) {
        self.actionError = errorText(error, tr('操作失败，请检查状态后重试。', 'The operation failed. Check the status, then retry.'));
        if (self.state.status === 'failed' && self.state.error) self.actionError = errorText(self.state.error, self.actionError);
        self.render();
      }
      return false;
    }).finally(function () {
      if (self.closed) return;
      self.localAction = '';
      self.stopPending = false;
      self.render();
      self.startPollingIfNeeded();
    });
  };

  DiscoveryDialog.prototype.chooseRoots = function () {
    return this.runAction('chooseRoots', {}, { newOperation: true });
  };

  DiscoveryDialog.prototype.importProfile = function () { return this.runAction('import', {}); };

  DiscoveryDialog.prototype.scan = function () { return this.runAction('scan', { selectedAgentIds: this.state.selectedAgentIds || [] }); };

  DiscoveryDialog.prototype.analyze = function () { return this.runAction('analyze', {}); };

  DiscoveryDialog.prototype.apply = function () {
    if (!this.draftProposal) return Promise.resolve(false);
    return this.runAction('apply', { proposal: clone(this.draftProposal) });
  };

  DiscoveryDialog.prototype.export = function () {
    if (!this.draftProposal) return Promise.resolve(false);
    return this.runAction('export', { proposal: clone(this.draftProposal) });
  };

  DiscoveryDialog.prototype.cancel = function () {
    var self = this;
    if (this.stopPending) return Promise.resolve(false);
    this.stopPending = true;
    this.actionError = '';
    this.render();
    return invoke('cancel', { operationId: this.operationIds[this.localAction || this.lastAction] || '' }, this.scope).then(function (result) {
      if (self.closed) return false;
      if (result.status || result.roots || result.inventory || result.proposal) self.syncState(result, 'cancel');
      self.stopPending = false;
      self.actionError = '';
      self.render();
      return true;
    }).catch(function (error) {
      if (!self.closed) { self.stopPending = false; self.actionError = errorText(error, tr('停止请求未确认；操作仍可能在运行。', 'Stop was not confirmed; the operation may still be running.')); self.render(); }
      return false;
    }).finally(function () { self.startPollingIfNeeded(); });
  };

  DiscoveryDialog.prototype.retry = function () {
    var action = String(this.state.retryAction || this.lastAction || '');
    if (retryableActions.indexOf(action) < 0) return this.loadState();
    if (!this.operationIds[action]) this.operationIds[action] = operationId();
    if (action === 'apply') return this.apply();
    if (action === 'export') return this.export();
    if (action === 'scan') return this.scan();
    return this.runAction(action, {});
  };

  DiscoveryDialog.prototype.onKeyDown = function (event) {
    if (this.closed || !this.overlay.contains(event.target)) return;
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusable = Array.from(this.dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'))
      .filter(function (node) { return !node.hidden && node.getAttribute('aria-hidden') !== 'true'; });
    if (!focusable.length) { event.preventDefault(); this.dialog.focus(); return; }
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (root.document.activeElement === first || !this.dialog.contains(root.document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && root.document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  DiscoveryDialog.prototype.requestClose = function () {
    this.close();
  };

  DiscoveryDialog.prototype.close = function () {
    if (this.closed) return;
    this.closed = true;
    if (this.pollTimer) root.clearTimeout(this.pollTimer);
    root.document.removeEventListener('keydown', this._onKeyDown, true);
    if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
    if (this.priorFocus && typeof this.priorFocus.focus === 'function') this.priorFocus.focus();
    if (activeDialog === this) activeDialog = null;
  };

  DiscoveryDialog.prototype.render = function () {
    if (this.closed) return;
    var self = this;
    var active = root.document.activeElement;
    var hadDialogFocus = this.overlay.contains(active);
    var focusKey = active && active.dataset && active.dataset.owldFocusKey;
    var selection = focusKey && typeof active.selectionStart === 'number' ? [active.selectionStart, active.selectionEnd] : null;
    this.content.replaceChildren();
    this.footer.replaceChildren();
    var busy = this.isBusy();
    this.closeButton.disabled = false;

    var rootSection = el('section', 'owld-section');
    rootSection.appendChild(el('h3', '', tr('已选目录', 'Selected folders')));
    rootSection.appendChild(el('p', 'owld-help', tr('只扫描所选目录和勾选的智能体来源；本轮仅读取入口元数据，不读取对话正文或凭据，也不会运行项目。', 'Scan selected folders and checked agent sources only. This scan reads entry metadata, without conversation bodies or credentials, and does not run projects.')));
    var roots = this.state.roots.filter(function (item) { return typeof item === 'string' || !item || item.selected !== false; });
    if (!roots.length) rootSection.appendChild(el('div', 'owld-empty', tr('尚未选择目录。', 'No folders selected yet.')));
    else {
      var rootList = el('ul', 'owld-root-list');
      roots.forEach(function (item) {
        var row = el('li', 'owld-root-row');
        var label = rootLabel(item);
        row.appendChild(el('strong', '', String(item && item.name || label)));
        if (item && item.path && String(item.path) !== String(item.name || '')) row.appendChild(el('span', '', String(item.path)));
        rootList.appendChild(row);
      });
      rootSection.appendChild(rootList);
    }
    var rootActions = el('div', 'owld-root-actions');
    var choose = button(busy ? tr('正在处理…', 'Working…') : tr('选择目录…', 'Choose folders…'), 'owld-secondary', function () { self.chooseRoots(); });
    choose.dataset.owldAction = 'choose-roots';
    choose.disabled = busy || !this.canStartDiscovery();
    rootActions.appendChild(choose);
    var importing = this.localAction === 'import';
    var importButton = button(importing ? tr('正在导入…', 'Importing…') : tr('导入 Meta Profile…', 'Import Meta Profile…'), 'owld-secondary owld-import-profile', function () { self.importProfile(); });
    importButton.dataset.owldAction = 'import';
    importButton.disabled = busy || !this.canStartDiscovery();
    rootActions.appendChild(importButton);
    rootSection.appendChild(rootActions);
    this.content.appendChild(rootSection);

    var agents = el('section', 'owld-section owld-agents');
    agents.appendChild(el('h3', '', tr('导入智能体', 'Import from agents')));
    agents.appendChild(el('p', 'owld-help', tr('首次默认勾选 Codex，可多选。未检测到的来源不可选；检测到配置不代表已登录。', 'Codex is checked on first use when detected. You can select multiple sources. Configuration detection does not confirm sign-in.')));
    var agentList = el('div', 'owld-agent-list');
    var selectedIds = this.state.selectedAgentIds || [];
    (this.state.agentOptions || []).forEach(function (source) {
      var row = el('label', 'owld-agent-choice' + (source.available ? '' : ' is-unavailable'));
      var input = el('input'); input.type = 'checkbox'; input.checked = source.available && selectedIds.indexOf(source.id) >= 0;
      input.disabled = !source.available || busy || !self.canStartDiscovery();
      input.dataset.owldAgent = source.id; input.dataset.owldFocusKey = 'agent-' + source.id;
      input.addEventListener('change', function () {
        var next = selectedIds.filter(function (id) { return id !== source.id; });
        if (input.checked) next.push(source.id);
        self.runAction('selectAgents', { selectedAgentIds: next });
      });
      row.appendChild(input);
      var copy = el('span', 'owld-agent-copy');
      copy.appendChild(el('strong', '', source.label));
      copy.appendChild(el('span', '', source.status === 'detected' ? tr('已检测到', 'Detected') : source.status === 'unreadable' ? tr('无法读取，请检查目录权限', 'Cannot read; check folder permissions') : tr('未检测到', 'Not detected')));
      row.appendChild(copy); agentList.appendChild(row);
    });
    agents.appendChild(agentList);
    if (!(this.state.agentOptions || []).length) agents.appendChild(el('p', 'owld-help', tr('正在检测本机智能体…', 'Detecting local agents…')));
    else agents.appendChild(el('p', 'owld-help', selectedIds.length ? tr('已选择 ' + selectedIds.length + ' 个智能体来源。', selectedIds.length + ' agent source(s) selected.') : tr('未选择智能体来源，本轮只扫描项目目录。', 'No agent sources selected. This scan will include project folders only.')));
    var refreshAgents = button(tr('重新检测', 'Detect again'), 'owld-link', function () { self.loadState(); });
    refreshAgents.disabled = busy; refreshAgents.dataset.owldAction = 'refresh-agents';
    agents.appendChild(refreshAgents);
    this.content.appendChild(agents);

    if (this.state.inventory) this.renderInventory(this.content);
    if (this.draftProposal) this.renderProposal(this.content);

    var status = el('div', 'owld-status' + (this.actionError || this.state.status === 'failed' ? ' is-error' : ''));
    status.setAttribute('role', this.actionError || this.state.status === 'failed' ? 'alert' : 'status');
    status.setAttribute('aria-live', this.actionError || this.state.status === 'failed' ? 'assertive' : 'polite');
    var statusText = this.actionError || (this.state.error ? errorText(this.state.error) : statusLabel(this.state.status));
    status.appendChild(el('span', 'owld-status-label', statusText));
    if (busyStatuses.indexOf(String(this.state.status || '')) >= 0 && this.state.progress && typeof this.state.progress === 'object') {
      this.appendProgress(status, this.state.progress, this.state.status);
    }
    this.footer.appendChild(status);

    var footerLeft = el('div', 'owld-footer-left');
    var retryAction = String(this.state.retryAction || this.lastAction || '');
    var canRetry = (!this.planLocked() || retryAction === 'import' && this.applicationComplete()) && (this.state.status === 'failed' || this.actionError) && retryableActions.indexOf(retryAction) >= 0;
    if (busy) {
      var canStop = busyStatuses.indexOf(String(this.state.status || '')) >= 0 || ['scan', 'analyze', 'apply'].indexOf(String(this.localAction || '')) >= 0;
      if (canStop) {
        var stop = button(this.stopPending ? tr('正在停止…', 'Stopping…') : tr('停止', 'Stop'), 'owld-stop', function () { self.cancel(); });
        stop.dataset.owldStop = 'true';
        stop.dataset.owldAction = 'stop';
        stop.disabled = this.stopPending;
        footerLeft.appendChild(stop);
      } else footerLeft.appendChild(el('span', 'owld-working', tr('正在处理…', 'Working…')));
    } else {
      if (roots.length && this.canStartDiscovery() && !(canRetry && retryAction === 'scan')) {
        var scan = button(tr('扫描所选目录', 'Scan selected folders'), 'owld-secondary', function () { self.scan(); });
        scan.dataset.owldAction = 'scan';
        footerLeft.appendChild(scan);
      }
      if (this.canStartDiscovery() && this.state.inventory && this.state.inventory.status !== 'aborted' && ['scanned', 'ready', 'failed', 'cancelled'].indexOf(String(this.state.status)) >= 0 && !(canRetry && retryAction === 'analyze')) {
        var analyze = button(this.state.status === 'ready' ? tr('重新分析', 'Analyze again') : tr('分析建议', 'Analyze recommendations'), this.draftProposal ? 'owld-secondary' : 'owld-primary', function () { self.analyze(); });
        analyze.dataset.owldAction = 'analyze';
        footerLeft.appendChild(analyze);
      }
      if (canRetry) {
        var retry = button(tr('重试', 'Retry'), 'owld-secondary', function () { self.retry(); });
        retry.dataset.owldAction = 'retry';
        footerLeft.appendChild(retry);
      }
      if (this.state.status === 'failed') footerLeft.appendChild(button(tr('刷新状态', 'Refresh status'), 'owld-link', function () { self.loadState(); }));
    }
    this.footer.appendChild(footerLeft);
    var footerRight = el('div', 'owld-footer-right');
    var canResumeApply = this.state.applyStarted === true && (this.state.status === 'failed' || this.state.status === 'cancelled');
    var canApply = this.draftProposal && (this.state.status === 'ready' || this.state.status === 'failed' || this.state.status === 'cancelled');
    if (this.draftProposal && (canApply || this.state.status === 'applied')) {
      var exportButton = button(tr('导出 JSON', 'Export JSON'), 'owld-secondary', function () { self.export(); });
      exportButton.dataset.owldAction = 'export';
      if (!(canRetry && retryAction === 'export')) footerRight.appendChild(exportButton);
      if (canApply && !(canRetry && retryAction === 'apply')) {
        var applyButton = button(canResumeApply ? tr('继续初始化', 'Resume initialization') : tr('应用初始化', 'Apply initialization'), 'owld-primary', function () { self.apply(); });
        applyButton.dataset.owldAction = 'apply';
        footerRight.appendChild(applyButton);
      }
    }
    this.footer.appendChild(footerRight);
    if (this.state.status === 'applied' && this.state.application) this.renderApplicationReceipt(this.content);
    if (this.exportReceipt) this.renderExportReceipt(this.content);

    if (focusKey) {
      var next = Array.from(this.dialog.querySelectorAll('[data-owld-focus-key]')).find(function (node) { return node.dataset.owldFocusKey === focusKey; });
      if (next) { next.focus(); if (selection) try { next.setSelectionRange(selection[0], selection[1]); } catch (error) {} }
    }
    if (hadDialogFocus && !this.dialog.contains(root.document.activeElement)) this.dialog.focus();
  };

  DiscoveryDialog.prototype.appendProgress = function (host, progress, status) {
    var rawMessage = typeof progress.message === 'string' ? progress.message.trim() : '';
    var phase = String(progress.phase || rawMessage || '').trim().toLowerCase();
    var message = '';
    if (phase && phase !== String(status || '').toLowerCase()) {
      if (/scan|discover|inventory/.test(phase)) message = tr('正在读取所选目录…', 'Reading selected folders…');
      else if (/analy|recommend|profile/.test(phase)) message = tr('正在整理建议…', 'Preparing recommendations…');
      else if (/apply|initial|creat|bind/.test(phase)) message = tr('正在初始化所选内容…', 'Initializing selected items…');
      else if (rawMessage && rawMessage.toLowerCase() !== phase) message = rawMessage;
    }
    if (message) host.appendChild(el('span', 'owld-progress-copy', message));
    if (!message && Number.isFinite(Number(progress.projects))) {
      var projects = Number(progress.projects);
      host.appendChild(el('span', 'owld-progress-copy', tr('已发现 ' + projects + ' 个项目', projects + ' project(s) found')));
    }
    var completed = Number(progress.completed), total = Number(progress.total), percent = Number(progress.percent);
    if (isFinite(completed) && isFinite(total) && total > 0) percent = Math.max(0, Math.min(100, completed / total * 100));
    if (isFinite(percent) && percent >= 0) {
      var bar = el('progress', 'owld-progress');
      bar.max = 100; bar.value = Math.max(0, Math.min(100, percent));
      bar.setAttribute('aria-label', tr('扫描进度', 'Scan progress'));
      host.appendChild(bar);
      if (isFinite(completed) && isFinite(total) && total > 0) host.appendChild(el('span', 'owld-progress-count', completed + ' / ' + total));
    }
  };

  DiscoveryDialog.prototype.renderInventory = function (host) {
    var inventory = this.state.inventory || {};
    var coverage = inventory.coverage && typeof inventory.coverage === 'object' ? inventory.coverage : null;
    var section = el('section', 'owld-section');
    section.appendChild(el('h3', '', tr('扫描结果', 'Scan results')));
    var metrics = [
      ['projects', tr('项目', 'Projects')], ['evidence', tr('证据', 'Evidence')], ['agentSources', tr('智能体来源', 'Agent sources')],
      ['skills', tr('Skills', 'Skills')], ['memorySources', tr('记忆来源', 'Memory sources')]
    ];
    var summary = el('div', 'owld-counts');
    metrics.forEach(function (item) {
      var count = formatCount(inventory[item[0]]);
      if (count === null && inventory.counts) count = formatCount(inventory.counts[item[0]]);
      if (count === null) return;
      var metric = el('div', 'owld-count');
      metric.appendChild(el('strong', '', String(count)));
      metric.appendChild(el('span', '', item[1]));
      summary.appendChild(metric);
    });
    if (summary.childNodes.length) section.appendChild(summary);
    if (coverage && coverage.complete === false) {
      var partial = tr('本轮扫描覆盖不完整；仍可基于已发现项目生成建议。', 'This scan has partial coverage. Recommendations can still use the projects that were found.');
      if (coverage.limitsReached) partial += ' ' + tr('已触及扫描限制。', 'A scan limit was reached.');
      section.appendChild(el('div', 'owld-coverage-note', partial));
    }
    if (coverage && Array.isArray(coverage.exceptions) && coverage.exceptions.length) {
      var exceptions = el('ul', 'owld-exceptions');
      coverage.exceptions.forEach(function (item) {
        var description = item && (item.message || [item.code, item.path].filter(Boolean).join(' · ')) || item;
        exceptions.appendChild(el('li', '', String(description)));
      });
      section.appendChild(exceptions);
    }
    host.appendChild(section);
  };

  DiscoveryDialog.prototype.renderApplicationReceipt = function (host) {
    var application = this.state.application || {};
    var entities = application.entities && typeof application.entities === 'object' ? application.entities : {};
    var section = el('section', 'owld-application-receipt');
    section.appendChild(el('h3', '', tr('初始化结果', 'Initialization result')));
    var metrics = [
      ['workspaces', tr('工作空间', 'Workspaces')], ['projects', tr('项目', 'Projects')],
      ['bots', tr('BOT', 'BOTs')], ['roots', tr('目录绑定', 'Folder bindings')]
    ];
    var summary = el('div', 'owld-counts');
    metrics.forEach(function (entry) {
      var list = Array.isArray(entities[entry[0]]) ? entities[entry[0]] : [];
      var metric = el('div', 'owld-count');
      metric.appendChild(el('strong', '', String(list.length)));
      metric.appendChild(el('span', '', entry[1]));
      summary.appendChild(metric);
    });
    section.appendChild(summary);
    var names = [];
    metrics.forEach(function (entry) {
      var list = Array.isArray(entities[entry[0]]) ? entities[entry[0]] : [];
      list.forEach(function (entity) {
        if (!entity || typeof entity !== 'object') return;
        var label = entity.name || entity.title || entity.id;
        if (label) names.push(entry[1] + ' · ' + String(label));
      });
    });
    if (names.length) {
      var entityList = el('ul', 'owld-application-entities');
      names.forEach(function (name) { entityList.appendChild(el('li', '', name)); });
      section.appendChild(entityList);
    }
    if (Array.isArray(application.warnings) && application.warnings.length) {
      section.appendChild(el('p', 'owld-help', tr('有 ' + application.warnings.length + ' 项需要后续检查。', application.warnings.length + ' item(s) need follow-up.')));
    }
    host.appendChild(section);
  };

  DiscoveryDialog.prototype.renderProposal = function (host) {
    var self = this;
    var proposal = this.draftProposal || {};
    var locked = this.planLocked();
    var inventoryProjects = Array.isArray(this.state.inventory && this.state.inventory.projects) ? this.state.inventory.projects : [];
    var bots = Array.isArray(proposal.bots) ? proposal.bots : [];
    var workspaces = Array.isArray(proposal.workspaces) ? proposal.workspaces : [];
    var section = el('section', 'owld-section owld-proposal');
    section.appendChild(el('h3', '', tr('Meta Profile 建议', 'Meta Profile recommendations')));
    section.appendChild(el('p', 'owld-help', tr('建议由 DSH + DeepSeek Flash 生成；应用前可修改名称、项目和 BOT 成员。', 'Recommendations use DSH + DeepSeek Flash. Edit workspace names, projects, and BOT members before applying.')));
    if (locked) {
      var hasCompletedApplication = this.applicationComplete() || this.state.status === 'applied';
      var recoveryPending = this.state.applyStarted === true && ['failed', 'cancelled'].indexOf(String(this.state.status || '')) >= 0;
      var lockedCopy = hasCompletedApplication
        ? tr('初始化已完成。可以重新扫描目录或导入 Meta Profile。', 'Initialization is complete. You can scan folders again or import a Meta Profile.')
        : recoveryPending
          ? tr('初始化计划已冻结。请继续初始化，完成后可重新扫描目录。', 'The initialization plan is frozen. Resume it to finish; you can scan again after it completes.')
          : tr('初始化正在进行，方案已锁定；完成后可重新扫描目录。', 'Initialization is in progress and the plan is locked. You can scan folders again when it completes.');
      section.appendChild(el('p', 'owld-coverage-note', lockedCopy));
    }
    if (!workspaces.length) section.appendChild(el('div', 'owld-empty', tr('服务未返回工作空间建议。', 'The service returned no workspace recommendations.')));
    workspaces.forEach(function (workspace, index) {
      var item = el('section', 'owld-workspace');
      var fieldWrap = el('label', 'owld-field');
      var nameLabel = el('span', '', tr('工作空间名称', 'Workspace name'));
      var name = el('input', ''); name.type = 'text'; name.value = String(workspace.name || '');
      name.disabled = locked;
      name.dataset.owldWorkspaceName = String(workspace.id || index);
      name.dataset.owldFocusKey = 'workspace-name-' + String(workspace.id || index);
      name.setAttribute('aria-label', tr('工作空间名称 ', 'Workspace name ') + String(index + 1));
      name.addEventListener('input', function () { if (!locked) workspace.name = name.value; });
      fieldWrap.append(nameLabel, name);
      item.appendChild(fieldWrap);
      if (workspace.reason) item.appendChild(el('p', 'owld-reason', String(workspace.reason)));

      var projectsWrap = el('fieldset', 'owld-choice-group');
      projectsWrap.appendChild(el('legend', '', tr('选择项目', 'Select projects')));
      var projectIds = Array.isArray(workspace.projectIds) ? workspace.projectIds.map(String) : [];
      var projectsById = Object.create(null);
      inventoryProjects.forEach(function (project) { if (project && project.id !== undefined) projectsById[String(project.id)] = project; });
      var projectCandidates = inventoryProjects.slice();
      projectIds.forEach(function (id) { if (!projectsById[id]) projectCandidates.push({ id: id, name: id }); });
      if (!projectCandidates.length) projectsWrap.appendChild(el('div', 'owld-empty', tr('没有可选择的项目。', 'No projects are available to select.')));
      projectCandidates.forEach(function (project) {
        var id = String(project && project.id !== undefined ? project.id : '');
        if (!id) return;
        var label = el('label', 'owld-choice');
        var input = el('input', ''); input.type = 'checkbox'; input.checked = projectIds.indexOf(id) >= 0;
        input.disabled = locked;
        input.dataset.owldProjectId = id;
        input.dataset.owldFocusKey = 'workspace-' + String(workspace.id || index) + '-project-' + id;
        input.addEventListener('change', function () {
          if (locked) return;
          var next = Array.isArray(workspace.projectIds) ? workspace.projectIds.map(String) : [];
          workspace.projectIds = input.checked ? (next.indexOf(id) >= 0 ? next : next.concat([id])) : next.filter(function (value) { return value !== id; });
        });
        label.appendChild(input);
        var copy = el('span', 'owld-choice-copy');
        copy.appendChild(el('strong', '', projectLabel(project)));
        var path = project.canonicalPath || project.path || project.representativePath;
        if (path) copy.appendChild(el('span', '', String(path)));
        label.appendChild(copy); projectsWrap.appendChild(label);
      });
      item.appendChild(projectsWrap);

      var botsWrap = el('fieldset', 'owld-choice-group');
      botsWrap.appendChild(el('legend', '', tr('BOT 成员', 'BOT members')));
      var botIds = Array.isArray(workspace.botIds) ? workspace.botIds.map(String) : [];
      if (!bots.length) botsWrap.appendChild(el('div', 'owld-empty', tr('没有可选择的 BOT 建议。', 'No BOT recommendations are available to select.')));
      bots.forEach(function (bot) {
        if (!bot || bot.id === undefined) return;
        var id = String(bot.id);
        var label = el('label', 'owld-choice');
        var input = el('input', ''); input.type = 'checkbox'; input.checked = botIds.indexOf(id) >= 0;
        input.disabled = locked;
        input.dataset.owldBotId = id;
        input.dataset.owldFocusKey = 'workspace-' + String(workspace.id || index) + '-bot-' + id;
        input.addEventListener('change', function () {
          if (locked) return;
          var next = Array.isArray(workspace.botIds) ? workspace.botIds.map(String) : [];
          workspace.botIds = input.checked ? (next.indexOf(id) >= 0 ? next : next.concat([id])) : next.filter(function (value) { return value !== id; });
        });
        label.appendChild(input);
        var copy = el('span', 'owld-choice-copy');
        copy.appendChild(el('strong', '', botLabel(bot)));
        var disposition = bot.action === 'reuse' ? tr('复用现有 BOT', 'Reuse existing BOT') : bot.action === 'create' ? tr('建议新建', 'Recommended to create') : '';
        if (disposition) copy.appendChild(el('span', '', disposition));
        label.appendChild(copy); botsWrap.appendChild(label);
      });
      item.appendChild(botsWrap);
      section.appendChild(item);
    });
    host.appendChild(section);
  };

  DiscoveryDialog.prototype.renderExportReceipt = function (host) {
    var receipt = this.exportReceipt;
    var node = el('div', 'owld-export-receipt', tr('JSON 已导出。', 'JSON exported.'));
    node.dataset.owldExportReceipt = 'true';
    if (receipt.path) node.appendChild(el('span', '', receipt.path));
    else if (receipt.json !== undefined) {
      var json = typeof receipt.json === 'string' ? receipt.json : JSON.stringify(receipt.json, null, 2);
      var download = button(tr('下载 JSON', 'Download JSON'), 'owld-link', function () {
        var blob = new root.Blob([json], { type: 'application/json' });
        var url = root.URL.createObjectURL(blob);
        var link = el('a', '');
        link.href = url;
        link.download = String(receipt.fileName || 'openbot-meta-profile.json').replace(/[\\/:*?"<>|]+/g, '-');
        link.click();
        root.setTimeout(function () { root.URL.revokeObjectURL(url); }, 1000);
      });
      download.dataset.owldAction = 'download-json';
      node.appendChild(download);
    }
    host.appendChild(node);
  };

  root.OpenBotLocalDiscovery = {
    open: function (options) {
      options = options || {};
      if (activeDialog && !activeDialog.closed) { activeDialog.dialog.focus(); return activeDialog; }
      try { validateScope(options.scope); } catch (error) { return null; }
      if (String(options.scope.spaceId) !== 'personal') return null;
      activeDialog = new DiscoveryDialog(options);
      return activeDialog;
    },
    projectChat: projectChat,
    continueHistory: continueHistory,
    continueNative: continueNative
  };
})(window);
