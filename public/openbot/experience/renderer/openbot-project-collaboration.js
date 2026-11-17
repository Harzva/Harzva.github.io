/* Native project collaboration mounts. All facts and writes come from the host bridge. */
(function (root) {
  'use strict';

  var countFields = [
    ['total', '总任务', 'Tasks'], ['notStarted', '未开始', 'Not started'],
    ['inProgress', '推进中', 'In progress'], ['waitingInput', '待输入', 'Waiting for input'],
    ['needsReview', '待验收', 'Needs review'], ['accepted', '已验收', 'Accepted'],
    ['failed', '失败', 'Failed'], ['stopped', '停止', 'Stopped'], ['unknown', '待核查', 'Unknown']
  ];
  var statuses = {
    business: { notStarted: ['未开始', 'Not started'], inProgress: ['推进中', 'In progress'], waitingInput: ['待输入', 'Waiting for input'], needsReview: ['待验收', 'Needs review'], accepted: ['已验收', 'Accepted'], failed: ['失败', 'Failed'], stopped: ['停止', 'Stopped'], unknown: ['待核查', 'Needs checking'] },
    runtime: { idle: ['待命', 'Idle'], queued: ['排队', 'Queued'], running: ['执行', 'Running'], awaitingApproval: ['等批准', 'Awaiting approval'], error: ['异常', 'Error'], unknown: ['未知', 'Unknown'] },
    handoff: { undispatched: ['未派发', 'Not dispatched'], dispatched: ['已派发', 'Dispatched'], running: ['执行中', 'Running'], resultSaved: ['成果已保存', 'Result saved'], ownerProcessing: ['负责人处理中', 'Owner processing'], unknown: ['待核查', 'Needs checking'], failed: ['失败', 'Failed'], stopped: ['停止', 'Stopped'] }
  };

  function tr(zh, en, params) {
    if (root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function') return root.OpenBotI18n.t(zh, en, params);
    return (root.document.documentElement.lang || '').toLowerCase().indexOf('en') === 0 ? en : zh;
  }
  function str(value, fallback) { return value === undefined || value === null ? (fallback === undefined ? '' : String(fallback)) : String(value); }
  function refId(ref) { return typeof ref === 'string' ? ref : ref && (ref.id || ref.botId || ref.instanceId) ? String(ref.id || ref.botId || ref.instanceId) : ''; }
  function el(tag, className, value) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = str(value);
    return node;
  }
  function button(label, className, action, focusKey) {
    var node = el('button', className || '', label);
    node.type = 'button';
    if (focusKey) node.dataset.opcFocus = focusKey;
    if (action) node.addEventListener('click', action);
    return node;
  }
  function label(text, control) {
    var node = el('label', 'opc-field-label', text);
    if (control) {
      if (control.id) node.htmlFor = control.id;
      node.append(control);
    }
    return node;
  }
  function field(tag, key, className) {
    var node = el(tag, className || 'opc-control');
    node.dataset.opcFocus = key;
    return node;
  }
  function textNode(value, className) { return el('span', className || '', value); }
  function errorOf(error) {
    var message = error && error.message ? String(error.message) : str(error, tr('请求失败。', 'Request failed.'));
    if (error && error.code && message === error.code) return message;
    return message;
  }
  function opId() {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    return 'opc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }
  function statusValue(item, type) {
    if (!item) return tr('未知', 'Unknown');
    if (item.label) return String(item.label);
    var codes = statuses[type] || {};
    var entry = codes[item.code];
    return entry ? tr(entry[0], entry[1]) : str(item.code, tr('未知', 'Unknown'));
  }
  function showDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    try { return date.toLocaleString(root.OpenBotI18n ? root.OpenBotI18n.locale : undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
    catch (_) { return date.toLocaleString(); }
  }
  function appendSelectOptions(select, options, selected) {
    select.replaceChildren();
    options.forEach(function (item) {
      var option = el('option', '', item.label);
      option.value = str(item.value);
      select.append(option);
    });
    if (selected !== undefined && Array.prototype.some.call(select.options, function (option) { return option.value === str(selected); })) select.value = str(selected);
  }
  function renderCounts(counts, compact) {
    var list = el('dl', compact ? 'opc-counts opc-counts-compact' : 'opc-counts');
    countFields.forEach(function (field) {
      var value = counts && Number.isFinite(Number(counts[field[0]])) ? Number(counts[field[0]]) : 0;
      if (compact && value === 0 && field[0] !== 'total') return;
      var item = el('div', 'opc-count');
      item.append(el('dt', '', tr(field[1], field[2])), el('dd', '', String(value)));
      list.append(item);
    });
    return list;
  }

  function create(options) {
    options = options || {};
    var bridge = options.bridge || root.grokbot;
    var getScope = options.getScope;
    var onNavigate = typeof options.onNavigate === 'function' ? options.onNavigate : function () {};
    var onOpenBot = typeof options.onOpenBot === 'function' ? options.onOpenBot : function () {};
    var engineeringMount = null;
    var chatMount = null;
    var enabled = false;
    var destroyed = false;
    var subscribed = false;
    var offChanged = null;
    var generation = 0;
    var securityEpoch = 0;
    var epochs = { space: 0, project: 0, conversation: 0, context: 0, result: 0, command: 0 };
    var scopeKey = '';
    var state = {
      space: null, project: null, selectedProjectId: '', selectedBotId: '', selectedTaskId: '',
      tab: 'tasks', conversation: null, context: null, result: null, pendingSubmission: null,
      busy: Object.create(null), status: '', statusTone: '', error: '', loading: false, showCreate: false
    };
    var drafts = { createGoal: '', createCriteria: '', createOwner: '', delegateGoal: '', delegateBot: '', message: '' };
    var teamSelection = Object.create(null);
    var watchController = null;
    var onOpenProjectWatch = typeof options.onOpenProjectWatch === 'function' ? options.onOpenProjectWatch : function () {};
    var onOpenWatchEvent = function (event) {
      if (watchController) watchController.openProject(event && event.detail);
    };

    function currentScope() {
      var value = null;
      try { value = typeof getScope === 'function' ? getScope() : null; } catch (_) { value = null; }
      if (!value || !value.spaceId || value.scopeRevision === undefined || value.scopeRevision === null) return null;
      return { spaceId: String(value.spaceId), scopeRevision: value.scopeRevision };
    }
    function keyForScope(scope) { return scope ? scope.spaceId + '|' + String(scope.scopeRevision) : ''; }
    function currentKey() { return keyForScope(currentScope()); }
    function hasApi() {
      return !!bridge && typeof bridge.projectCollaborationEnable === 'function' && typeof bridge.projectCollaboration === 'function';
    }
    function newTicket(kind) {
      epochs[kind] += 1;
      return { kind: kind, epoch: epochs[kind], generation: generation, securityEpoch: securityEpoch, scopeKey: currentKey() };
    }
    function live(ticket) {
      return !destroyed && !!ticket && ticket.generation === generation && ticket.securityEpoch === securityEpoch &&
        ticket.scopeKey === currentKey() && ticket.epoch === epochs[ticket.kind];
    }
    function ensureCurrentScope() {
      var scope = currentScope();
      if (!scope) throw Object.assign(new Error(tr('当前工作空间不可用。', 'The current workspace is unavailable.')), { code: 'SCOPE_UNAVAILABLE' });
      return scope;
    }
    function validateReply(reply, scope, ticket) {
      if (!live(ticket)) return false;
      if (!reply || reply.ok !== true || String(reply.spaceId) !== scope.spaceId || String(reply.scopeRevision) !== String(scope.scopeRevision)) {
        var failure = new Error(reply && (reply.message || reply.error) || tr('宿主没有返回当前工作空间的授权数据。', 'The host did not return authorized data for this workspace.'));
        if (reply && reply.code) failure.code = reply.code;
        throw failure;
      }
      return true;
    }
    async function call(method, selection, input, ticket) {
      var scope = ensureCurrentScope();
      if (!hasApi()) throw Object.assign(new Error(tr('当前版本未提供工程协作接口。', 'This version does not provide project collaboration.')), { code: 'UNSUPPORTED' });
      if (keyForScope(scope) !== ticket.scopeKey) return null;
      var payload = { method: method, spaceId: scope.spaceId, scopeRevision: scope.scopeRevision };
      if (selection && selection.projectId) payload.projectId = String(selection.projectId);
      if (selection && selection.botId) payload.botId = String(selection.botId);
      if (input !== undefined) payload.input = input;
      var reply = await bridge.projectCollaboration(payload);
      if (!validateReply(reply, scope, ticket)) return null;
      return reply.value;
    }
    function selection() {
      return {
        spaceId: ensureCurrentScope().spaceId,
        scopeRevision: ensureCurrentScope().scopeRevision,
        projectId: state.selectedProjectId || undefined,
        botId: state.selectedBotId || undefined
      };
    }
    function projectFor(id) {
      var candidates = state.space && Array.isArray(state.space.projects) ? state.space.projects : [];
      for (var i = 0; i < candidates.length; i++) if (String(candidates[i].id) === String(id)) return candidates[i];
      if (state.project && Array.isArray(state.project.projects)) {
        for (var j = 0; j < state.project.projects.length; j++) if (String(state.project.projects[j].id) === String(id)) return state.project.projects[j];
      }
      return null;
    }
    function bots() { return state.project && Array.isArray(state.project.bots) ? state.project.bots : []; }
    function botFor(ref) {
      var id = refId(ref);
      var all = bots();
      for (var i = 0; i < all.length; i++) if (refId(all[i]) === id || String(all[i].nativeBotId || '') === id) return all[i];
      if (state.space && Array.isArray(state.space.bots)) {
        for (var j = 0; j < state.space.bots.length; j++) if (refId(state.space.bots[j]) === id || String(state.space.bots[j].nativeBotId || '') === id) return state.space.bots[j];
      }
      return null;
    }
    function botName(ref) {
      var found = botFor(ref);
      return found ? (found.name || refId(found)) : ref ? refId(ref) : tr('未指定', 'Unassigned');
    }
    function tasks() { return state.project && Array.isArray(state.project.tasks) ? state.project.tasks : []; }
    function taskFor(id) {
      var all = tasks();
      for (var i = 0; i < all.length; i++) if (String(all[i].id) === String(id)) return all[i];
      return null;
    }
    function clearPrivate() {
      state.project = null;
      state.conversation = null;
      state.context = null;
      state.result = null;
      state.pendingSubmission = null;
      state.selectedTaskId = '';
      state.error = '';
      epochs.project++; epochs.conversation++; epochs.context++; epochs.result++;
    }
    function clearAllData() {
      state.space = null;
      clearPrivate();
    }
    function renderAll() { renderEngineering(); renderChatCard(); }
    function captureFocus(container) {
      var active = root.document.activeElement;
      if (!container || !active || !container.contains(active) || !active.dataset || !active.dataset.opcFocus) return null;
      return { key: active.dataset.opcFocus, start: typeof active.selectionStart === 'number' ? active.selectionStart : null, end: typeof active.selectionEnd === 'number' ? active.selectionEnd : null };
    }
    function restoreFocus(container, record) {
      if (!container || !record) return;
      var nodes = container.querySelectorAll('[data-opc-focus]');
      var target = null;
      for (var i = 0; i < nodes.length; i++) if (nodes[i].dataset.opcFocus === record.key) { target = nodes[i]; break; }
      if (!target || target.disabled) return;
      try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
      if (record.start !== null && typeof target.setSelectionRange === 'function') {
        try { target.setSelectionRange(record.start, record.end); } catch (_) { }
      }
    }
    function alignInScrollContainer(container, target, topInset) {
      if (!container || !target) return;
      var containerRect = container.getBoundingClientRect();
      var targetRect = target.getBoundingClientRect();
      var visibleTop = containerRect.top + container.clientTop;
      var delta = targetRect.top - visibleTop - (topInset || 0);
      if (Math.abs(delta) < 1) return;
      var maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      container.scrollTop = Math.max(0, Math.min(maxScroll, container.scrollTop + delta));
    }
    function replaceMount(mount, next) {
      if (!mount) return;
      var focus = captureFocus(mount);
      mount.replaceChildren(next);
      restoreFocus(mount, focus);
    }
    function setStatus(text, tone) {
      state.status = text || '';
      state.statusTone = tone || '';
      renderAll();
    }
    function statusBox() {
      var copy = state.error || state.status;
      if (!copy) return null;
      var box = el('p', 'opc-notice' + (state.error ? ' is-error' : state.statusTone ? ' is-' + state.statusTone : ''), copy);
      box.setAttribute('role', state.error ? 'alert' : 'status');
      box.setAttribute('aria-live', state.error ? 'assertive' : 'polite');
      return box;
    }
    function buttonForFeature() {
      var wrapper = el('div', 'opc-disabled-state');
      wrapper.append(el('h2', '', tr('工程协作', 'Project collaboration')));
      wrapper.append(el('p', '', hasApi() ? tr('按需读取当前空间里已授权的工程、任务与原始会话。启用后也不会自动派发任务。', 'Read authorized projects, tasks, and original conversations in the current space. Enabling does not dispatch work.') : tr('当前版本未提供工程协作接口。', 'This version does not provide project collaboration.')));
      var enable = button(tr('开启工程协作', 'Enable project collaboration'), 'opc-button opc-primary', enableFeature, 'enable-collaboration');
      enable.disabled = !hasApi();
      wrapper.append(enable);
      return wrapper;
    }
    function renderUnavailable() {
      return el('p', 'opc-empty', tr('当前版本未提供工程协作接口。', 'This version does not provide project collaboration.'));
    }

    async function enableFeature() {
      if (destroyed || enabled) return;
      if (!hasApi()) { state.error = tr('当前版本未提供工程协作接口。', 'This version does not provide project collaboration.'); renderAll(); return; }
      try {
        ensureCurrentScope();
        var response = await bridge.projectCollaborationEnable({ enabled: true });
        if (!response || response.ok !== true || response.enabled !== true) throw Object.assign(new Error(response && response.message || tr('未能开启工程协作。', 'Project collaboration could not be enabled.')), { code: response && response.code });
        enabled = true;
        state.error = '';
        subscribeChanges();
        renderAll();
        await refreshAll();
      } catch (error) {
        state.error = errorOf(error);
        clearAllData();
        renderAll();
      }
    }
    async function disableFeature() {
      generation++; securityEpoch++;
      enabled = false;
      unsubscribeChanges();
      clearAllData();
      state.status = tr('工程协作已关闭。', 'Project collaboration is off.');
      state.statusTone = 'muted';
      state.error = '';
      renderAll();
      if (bridge && typeof bridge.projectCollaborationEnable === 'function') {
        try { await bridge.projectCollaborationEnable({ enabled: false }); } catch (_) { }
      }
    }
    function subscribeChanges() {
      if (subscribed || !bridge || typeof bridge.onProjectCollaborationChanged !== 'function') return;
      try {
        offChanged = bridge.onProjectCollaborationChanged(onChanged);
        subscribed = true;
      } catch (_) { offChanged = null; }
    }
    function unsubscribeChanges() {
      if (typeof offChanged === 'function') { try { offChanged(); } catch (_) { } }
      offChanged = null; subscribed = false;
    }
    function onChanged(event) {
      if (!enabled || destroyed) return;
      var type = String(event && (event.type || event.reason) || 'changed');
      if (type === 'revoked' || type === 'disconnected' || type === 'invalidate') {
        securityEpoch++;
        // Keep only the opaque selection identity. All private content and
        // in-flight replies are discarded; refreshProject reauthorizes the ID
        // against the new task list before displaying any details.
        var reselectTaskId = state.selectedTaskId;
        clearAllData();
        if (type !== 'disconnected') state.selectedTaskId = reselectTaskId;
        state.error = type === 'disconnected' ? tr('宿主连接已断开。请重试以重新读取。', 'The host connection closed. Retry to read again.') : '';
        state.status = type === 'revoked' ? tr('访问权限已变化，正在重新核对授权。', 'Access changed; checking authorization again.') : '';
        renderAll();
        refreshAll();
        return;
      }
      if (type === 'changed' || type === 'change' || type === 'workspace-change' || type === 'facts-changed') {
        state.result = null;
        state.context = null;
        epochs.result++; epochs.context++;
        state.status = '';
        state.error = '';
        refreshAll();
      }
    }
    async function refreshAll() {
      if (!enabled || destroyed) return;
      var rootTicket = newTicket('space');
      var scope;
      try {
        scope = ensureCurrentScope();
        var rootView = await call('read', {}, undefined, rootTicket);
        if (!rootView || !live(rootTicket)) return;
        state.space = rootView;
        var projects = Array.isArray(rootView.projects) ? rootView.projects : [];
        if (state.selectedProjectId && !projects.some(function (p) { return String(p.id) === String(state.selectedProjectId); })) {
          state.selectedProjectId = '';
          state.selectedBotId = '';
          clearPrivate();
          state.status = tr('当前工程已不在授权列表中。', 'This project is no longer in the authorized list.');
        }
        if (state.selectedProjectId) {
          renderAll();
          await refreshProject();
        } else {
          clearPrivate();
          state.error = '';
          renderAll();
        }
      } catch (error) {
        if (!live(rootTicket)) return;
        var pendingSubmission = state.pendingSubmission;
        var selectedTaskId = state.selectedTaskId;
        clearAllData();
        state.pendingSubmission = pendingSubmission;
        state.selectedTaskId = selectedTaskId;
        state.error = errorOf(error);
        renderAll();
      }
    }
    async function refreshProject() {
      if (!enabled || !state.selectedProjectId || destroyed) return;
      var projectId = state.selectedProjectId;
      var ticket = newTicket('project');
      var summary = projectFor(projectId);
      if (state.selectedBotId && summary && Array.isArray(summary.botIds)) {
        var selectedBot = botFor(state.selectedBotId);
        var selectedRef = selectedBot ? refId(selectedBot) : state.selectedBotId;
        var selectedNative = selectedBot ? String(selectedBot.nativeBotId || '') : state.selectedBotId;
        if (!summary.botIds.some(function (id) { return refId(id) === selectedRef || String(id) === selectedRef || String(id) === selectedNative; })) state.selectedBotId = '';
      }
      var selectValue = { projectId: projectId, botId: state.selectedBotId };
      try {
        var project = await call('read', selectValue, undefined, ticket);
        if (!project || !live(ticket)) return;
        if (String(project.projectId || '') !== String(projectId)) throw new Error(tr('宿主返回了其他工程的数据。', 'The host returned data for a different project.'));
        state.project = project;
        state.error = '';
        var authorizedBots = bots();
        if (state.selectedBotId && !authorizedBots.some(function (item) { return refId(item) === state.selectedBotId || String(item.nativeBotId || '') === state.selectedBotId; })) {
          state.selectedBotId = '';
          clearPrivate();
          renderAll();
          await refreshProject();
          return;
        }
        if (!taskFor(state.selectedTaskId)) state.selectedTaskId = tasks()[0] ? String(tasks()[0].id) : '';
        renderAll();
        if (state.selectedTaskId) await loadConversation(state.selectedTaskId);
      } catch (error) {
        if (!live(ticket)) return;
        var pendingSubmission = state.pendingSubmission;
        var selectedTaskId = state.selectedTaskId;
        clearPrivate();
        state.pendingSubmission = pendingSubmission;
        state.selectedTaskId = selectedTaskId;
        state.error = errorOf(error);
        renderAll();
      }
    }
    async function refreshConversation(taskId) {
      if (!enabled || !state.selectedProjectId || !taskId) return;
      return loadConversation(taskId);
    }
    async function loadConversation(taskId) {
      var task = taskFor(taskId);
      if (!task) return;
      var ticket = newTicket('conversation');
      state.conversation = { taskId: String(task.id), loading: true, messages: [] };
      renderAll();
      try {
        var value = await call('conversation', selection(), { taskId: String(task.id) }, ticket);
        if (!value || !live(ticket) || String(state.selectedTaskId) !== String(task.id)) return;
        if (String(value.spaceId) !== currentScope().spaceId || String(value.projectId) !== String(state.selectedProjectId) || String(value.taskId) !== String(task.id)) throw new Error(tr('宿主会话与当前任务不匹配。', 'The host conversation does not match the selected task.'));
        state.conversation = value;
        state.error = '';
        if (state.pendingSubmission && String(state.pendingSubmission.taskId) === String(task.id)) {
          var persisted = (Array.isArray(value.messages) ? value.messages : []).some(function (message) {
            return (message.role === 'user' || message.role === 'human') && String(message.text || '') === String(state.pendingSubmission.text || '');
          });
          if (persisted) {
            state.pendingSubmission = null;
            drafts.message = '';
          }
        }
        renderAll();
      } catch (error) {
        if (!live(ticket)) return;
        state.conversation = null;
        state.error = errorOf(error);
        renderAll();
      }
    }
    async function loadContext() {
      if (!enabled || !state.selectedProjectId) return;
      var ticket = newTicket('context');
      state.context = null;
      state.status = tr('读取工程摘要…', 'Reading project summary…');
      state.statusTone = 'muted';
      renderAll();
      try {
        var value = await call('context', selection(), undefined, ticket);
        if (!value || !live(ticket)) return;
        state.context = value;
        state.status = tr('工程摘要已从宿主读取。', 'Project summary read from the host.');
        state.statusTone = 'success';
        state.error = '';
      } catch (error) {
        if (!live(ticket)) return;
        state.context = null;
        state.status = '';
        state.error = errorOf(error);
      }
      renderAll();
    }
    async function loadResult(taskId) {
      if (!enabled || !state.selectedProjectId) return;
      var task = taskFor(taskId);
      if (!task) return;
      var ticket = newTicket('result');
      state.result = { taskId: String(task.id), loading: true };
      state.status = tr('正在从宿主读取成果…', 'Reading the result from the host…');
      state.statusTone = 'muted';
      renderAll();
      try {
        var value = await call('result', selection(), { taskId: String(task.id) }, ticket);
        if (!value || !live(ticket) || String(state.selectedTaskId) !== String(task.id)) return;
        if (String(value.taskId || value.ref && value.ref.taskId || '') !== String(task.id) || !value.ref || !value.ref.runId || !value.digest || typeof value.text !== 'string') throw new Error(tr('宿主没有返回可确认的原始成果。', 'The host did not return a confirmed original result.'));
        state.result = value;
        state.status = tr('成果已读取。请查看后再确认验收。', 'Result loaded. Review it before confirming acceptance.');
        state.statusTone = 'success';
        state.error = '';
      } catch (error) {
        if (!live(ticket)) return;
        state.result = null;
        state.status = '';
        state.error = errorOf(error);
      }
      renderAll();
    }
    function invalidateForSelection() {
      generation++;
      securityEpoch++;
      clearAllData();
      state.status = '';
      state.error = '';
      renderAll();
    }
    function handleProjectWatchOpen(target) {
      var scope = currentScope();
      if (!scope || !target || String(target.spaceId || '') !== scope.spaceId ||
          (target.scopeRevision !== undefined && String(target.scopeRevision) !== String(scope.scopeRevision)) || !target.projectId) return;
      var projectId = String(target.projectId);
      if (projectId !== state.selectedProjectId) {
        state.selectedProjectId = projectId;
        state.selectedBotId = '';
        state.tab = 'tasks';
        invalidateForSelection();
      } else {
        state.tab = 'tasks';
        renderAll();
      }
      onOpenProjectWatch({ spaceId: scope.spaceId, scopeRevision: scope.scopeRevision, projectId: projectId, watchId: target.watchId || null });
      if (enabled) refreshAll();
      else enableFeature();
    }
    async function selectProject(projectId) {
      projectId = String(projectId || '');
      if (projectId === state.selectedProjectId) return;
      state.selectedProjectId = projectId;
      invalidateForSelection();
      if (enabled) await refreshAll();
    }
    async function selectBot(botId) {
      botId = String(botId || '');
      if (botId === state.selectedBotId) return;
      state.selectedBotId = botId;
      invalidateForSelection();
      if (enabled) await refreshAll();
    }
    async function selectTask(taskId) {
      taskId = String(taskId || '');
      if (taskId === state.selectedTaskId) return;
      state.selectedTaskId = taskId;
      state.conversation = null;
      state.context = null;
      state.result = null;
      state.pendingSubmission = null;
      state.status = '';
      state.error = '';
      epochs.conversation++; epochs.context++; epochs.result++;
      renderAll();
      if (taskId) await loadConversation(taskId);
    }
    async function submitCommand(input, { success, onDone, key, operationId } = {}) {
      if (!enabled || !state.selectedProjectId) return null;
      var ticket = newTicket('command');
      var useSelection = selection();
      state.busy[key || input.action] = true;
      state.error = '';
      state.status = tr('正在提交到宿主…', 'Submitting to the host…');
      state.statusTone = 'muted';
      renderAll();
      try {
        var value = await call('command', useSelection, Object.assign({ operationId: operationId || opId() }, input), ticket);
        if (!value || !live(ticket)) return null;
        var receipt = value.result || value;
        state.status = success || tr('请求已提交。', 'Request submitted.');
        state.statusTone = 'success';
        state.error = '';
        if (typeof onDone === 'function') await onDone(receipt, value);
        else await refreshAll();
        return value;
      } catch (error) {
        if (!live(ticket)) return null;
        state.status = '';
        state.error = errorOf(error);
        if (state.pendingSubmission && state.pendingSubmission.taskId === String(input.taskId || '')) {
          state.pendingSubmission.uncertain = !error.code;
          if (error.code) state.pendingSubmission = null;
        }
        if (error && /FORBIDDEN|REVOK|SOURCE_UNAVAILABLE|STALE_RESULT|PROJECT_NOT_FOUND|BOT_NOT_PROJECT_MEMBER/.test(String(error.code || ''))) {
          securityEpoch++;
          clearAllData();
        }
        renderAll();
        refreshAll();
        return null;
      } finally {
        if (live(ticket)) {
          state.busy[key || input.action] = false;
          renderAll();
        }
      }
    }
    async function createTask(form) {
      var goal = String(form.goal || '').trim();
      var criteria = String(form.criteria || '').trim();
      var ownerBotRef = String(form.owner || '').trim();
      if (!goal || !ownerBotRef) { state.error = tr('请填写目标并选择负责人。', 'Enter a goal and choose an owner.'); renderAll(); return; }
      var response = await submitCommand({ action: 'createTask', goal: goal, acceptanceCriteria: criteria, ownerBotRef: ownerBotRef }, {
        key: 'createTask', success: tr('新任务已交给宿主保存。', 'The host saved the new task.'),
        onDone: async function (receipt) {
          drafts.createGoal = ''; drafts.createCriteria = ''; state.showCreate = false;
          await refreshAll();
          var created = receipt && (receipt.entity && receipt.entity.id || receipt.taskId || receipt.id);
          if (created && taskFor(created)) await selectTask(created);
        }
      });
      return response;
    }
    async function delegateTask(task, form) {
      var assigneeBotRef = String(form.bot || '').trim();
      var goal = String(form.goal || '').trim();
      if (!task || !assigneeBotRef || !goal) { state.error = tr('请选择成员并说明委派目标。', 'Choose a member and describe the delegated work.'); renderAll(); return; }
      await submitCommand({ action: 'delegateTask', taskId: task.id, assigneeBotRef: assigneeBotRef, goal: goal }, {
        key: 'delegateTask', success: tr('委派请求已提交。', 'Delegation submitted.'), onDone: async function () { drafts.delegateGoal = ''; await refreshAll(); }
      });
    }
    async function sendMessage(task) {
      var text = String(drafts.message || '').trim();
      var conversation = state.conversation;
      if (!task || !text || state.pendingSubmission) return;
      if (task.asyncTeam && task.asyncTeam.schema) {
        state.error = tr('此任务使用团队协作入口，请通过“启动团队协作”发送。', 'This task uses team dispatch. Use “Start team collaboration” to send it.');
        renderAll(); return;
      }
      var threadId = conversation && conversation.taskId === task.id && conversation.threadId ? String(conversation.threadId) : '';
      var action = threadId ? 'sendThread' : 'startTask';
      state.pendingSubmission = { taskId: String(task.id), text: text, operationId: opId(), receipt: null, uncertain: false };
      renderAll();
      var sent = await submitCommand({ action: action, taskId: String(task.id), ...(threadId ? { threadId: threadId } : {}), text: text }, {
        key: 'sendMessage', operationId: state.pendingSubmission.operationId, success: tr('已提交；只会把宿主确认的原会话显示为消息。', 'Submitted. Only messages confirmed by the host conversation will appear.'),
        onDone: async function (receipt) {
          if (state.pendingSubmission) state.pendingSubmission.receipt = receipt;
          await refreshAll();
        }
      });
      if (!sent && state.pendingSubmission && state.pendingSubmission.taskId === String(task.id) && !state.pendingSubmission.uncertain) state.pendingSubmission = null;
    }
    async function acceptTask(task) {
      var result = state.result;
      if (!task || !result || result.taskId && String(result.taskId) !== String(task.id) || !result.ref || !result.digest) return;
      await submitCommand({ action: 'acceptTask', taskId: task.id, expectedRevision: task.revision, expectedRunId: result.ref.runId, summaryDigest: result.digest, criteriaSatisfied: true }, {
        key: 'acceptTask', success: tr('验收决定已写入宿主。', 'Acceptance was recorded by the host.'),
        onDone: async function () { state.result = null; await refreshAll(); }
      });
    }
    async function startTeam(task) {
      if (!task) return;
      var allowed = bots().filter(function (bot) { return refId(bot) !== refId(task.ownerBotRef); }).map(function (bot) { return String(bot.nativeBotId || ''); }).filter(Boolean);
      var chosen = (teamSelection[String(task.id)] || allowed).filter(function (id) { return allowed.indexOf(id) >= 0; });
      if (!chosen.length) { state.error = tr('当前工程没有可加入的其他成员。', 'No other authorized project members are available.'); renderAll(); return; }
      await submitCommand({ action: 'startTeamTask', taskId: task.id, expectedRevision: task.revision, memberBotIds: chosen.slice() }, {
        key: 'startTeamTask', success: tr('团队协作已提交给宿主。', 'Team collaboration was submitted to the host.'),
        onDone: async function () { await refreshAll(); }
      });
    }
    async function stopTeam(task) {
      if (!task) return;
      await submitCommand({ action: 'stopTeamTask', taskId: task.id }, {
        key: 'stopTeamTask', success: tr('停止团队协作的请求已提交。', 'The team stop request was submitted.'), onDone: async function () { await refreshAll(); }
      });
    }
    async function cancelRun(task, runId) {
      if (!task || !runId) return;
      await submitCommand({ action: 'cancelRun', taskId: task.id, runId: runId }, {
        key: 'cancelRun-' + runId, success: tr('停止请求已提交给宿主。', 'The stop request was submitted to the host.'), onDone: async function () { await refreshAll(); }
      });
    }
    async function refreshConversationAction(task) {
      state.status = tr('重新读取宿主原始会话…', 'Reloading the original host conversation…');
      state.statusTone = 'muted'; renderAll();
      await refreshConversation(task.id);
    }

    function titleBar() {
      var header = el('header', 'opc-header');
      var titleBlock = el('div', 'opc-title-block');
      titleBlock.append(el('h1', '', tr('工程协作', 'Project collaboration')));
      titleBlock.append(el('p', '', tr('工程任务、负责人和原始会话来自当前宿主工作空间。', 'Projects, task owners, and original conversations come from the current host workspace.')));
      header.append(titleBlock);
      if (enabled) {
        var controls = el('div', 'opc-toolbar-controls');
        var projectSelect = field('select', 'project-picker', 'opc-control');
        projectSelect.setAttribute('aria-label', tr('选择工程', 'Choose a project'));
        var projectOptions = [{ value: '', label: tr('空间总览', 'Space overview') }];
        (state.space && Array.isArray(state.space.projects) ? state.space.projects : []).forEach(function (project) { projectOptions.push({ value: project.id, label: project.name || project.id }); });
        appendSelectOptions(projectSelect, projectOptions, state.selectedProjectId);
        projectSelect.addEventListener('change', function () { selectProject(projectSelect.value); });
        var botSelect = field('select', 'chat-bot-picker', 'opc-control');
        botSelect.setAttribute('aria-label', tr('当前聊天 BOT', 'Current chat BOT'));
        var botOptions = [{ value: '', label: tr('未选择聊天 BOT', 'No chat BOT selected') }];
        bots().forEach(function (bot) { botOptions.push({ value: String(bot.nativeBotId || refId(bot)), label: bot.name || refId(bot) }); });
        appendSelectOptions(botSelect, botOptions, state.selectedBotId);
        botSelect.disabled = !state.selectedProjectId || !bots().length;
        botSelect.addEventListener('change', function () { selectBot(botSelect.value); });
        controls.append(label(tr('工程', 'Project'), projectSelect), label(tr('当前聊天 BOT', 'Current chat BOT'), botSelect));
        controls.append(button(tr('刷新', 'Refresh'), 'opc-button', refreshAll, 'refresh'));
        controls.append(button(tr('关闭工程协作', 'Turn off collaboration'), 'opc-link-button', disableFeature, 'disable'));
        header.append(controls);
      }
      return header;
    }
    function projectNavigation() {
      var nav = el('nav', 'opc-project-nav');
      nav.setAttribute('aria-label', tr('空间与工程', 'Space and projects'));
      var overview = button(tr('空间总览', 'Space overview'), 'opc-nav-item' + (!state.selectedProjectId ? ' is-current' : ''), function () { selectProject(''); }, 'nav-overview');
      overview.setAttribute('aria-current', !state.selectedProjectId ? 'page' : 'false');
      nav.append(overview);
      var heading = el('h2', 'opc-nav-heading', tr('工程', 'Projects'));
      nav.append(heading);
      var projects = state.space && Array.isArray(state.space.projects) ? state.space.projects : [];
      if (!projects.length) nav.append(el('p', 'opc-nav-empty', tr('尚无已授权工程。', 'No authorized projects.')));
      projects.forEach(function (project) {
        var control = button(project.name || project.id, 'opc-nav-item' + (String(project.id) === String(state.selectedProjectId) ? ' is-current' : ''), function () { selectProject(project.id); }, 'nav-project-' + project.id);
        control.setAttribute('aria-current', String(project.id) === String(state.selectedProjectId) ? 'page' : 'false');
        var owner = el('span', 'opc-nav-owner', botName(project.ownerBotRef));
        control.append(owner);
        nav.append(control);
      });
      return nav;
    }
    function overviewContent() {
      var section = el('section', 'opc-overview');
      section.setAttribute('aria-labelledby', 'opc-overview-title');
      var title = el('h2', '', tr('空间总览', 'Space overview')); title.id = 'opc-overview-title';
      section.append(title);
      section.append(el('p', 'opc-subtitle', tr('当前空间内已授权工程与负责人统计。', 'Authorized projects and owner summaries in this workspace.')));
      var tableWrap = el('div', 'opc-table-wrap');
      var table = el('table', 'opc-table opc-overview-table');
      var head = el('thead'); var row = el('tr');
      [tr('工程', 'Project'), tr('负责人 BOT', 'Owner BOT'), tr('任务统计', 'Task counts')].forEach(function (copy) { row.append(el('th', '', copy)); });
      head.append(row); table.append(head);
      var body = el('tbody');
      var projects = state.space && Array.isArray(state.space.projects) ? state.space.projects : [];
      projects.forEach(function (project) {
        var trNode = el('tr');
        var name = el('td'); var open = button(project.name || project.id, 'opc-table-link', function () { selectProject(project.id); }, 'overview-' + project.id); name.append(open);
        var owner = el('td', '', botName(project.ownerBotRef));
        var stats = el('td', 'opc-overview-counts'); stats.append(renderCounts(project.counts, true));
        trNode.append(name, owner, stats); body.append(trNode);
      });
      if (!projects.length) { var emptyRow = el('tr'); var emptyCell = el('td', 'opc-empty', tr('没有可显示的工程。', 'No projects to show.')); emptyCell.colSpan = 3; emptyRow.append(emptyCell); body.append(emptyRow); }
      table.append(body); tableWrap.append(table); section.append(tableWrap);
      return section;
    }
    function projectSummary(project) {
      var section = el('section', 'opc-project-summary');
      var h = el('div', 'opc-project-title');
      h.append(el('h2', '', project.name || project.id), el('span', 'opc-project-id', 'project ' + str(project.id)));
      section.append(h);
      var meta = el('p', 'opc-subtitle', tr('版本 ', 'Revision ') + str(state.project && state.project.revision, '—') + (state.project && state.project.observedAt ? ' · ' + tr('读取于 ', 'Read ') + showDate(state.project.observedAt) : ''));
      section.append(meta);
      section.append(renderCounts(project.counts, false));
      return section;
    }
    function taskTable() {
      var wrap = el('div', 'opc-table-wrap');
      var table = el('table', 'opc-table opc-task-table');
      table.setAttribute('aria-label', tr('工程任务', 'Project tasks'));
      var head = el('thead'); var row = el('tr');
      [tr('任务', 'Task'), tr('负责人 BOT', 'Owner BOT'), tr('业务状态', 'Business'), tr('BOT 运行', 'BOT runtime'), tr('交接状态', 'Handoff')].forEach(function (copy) { row.append(el('th', '', copy)); });
      head.append(row); table.append(head);
      var body = el('tbody');
      tasks().forEach(function (task) {
        var row = el('tr');
        if (String(task.id) === String(state.selectedTaskId)) row.className = 'is-selected';
        var goal = el('td');
        var choose = button(task.goal || task.id, 'opc-task-link', function () { selectTask(task.id); }, 'task-row-' + task.id);
        choose.setAttribute('aria-pressed', String(task.id) === String(state.selectedTaskId) ? 'true' : 'false');
        goal.append(choose);
        row.append(goal, el('td', '', botName(task.ownerBotRef)), statusCell(task.business, 'business'), statusCell(task.runtime, 'runtime'), statusCell(task.handoff, 'handoff'));
        body.append(row);
      });
      if (!tasks().length) { var empty = el('tr'); var cell = el('td', 'opc-empty', tr('当前工程没有任务。', 'This project has no tasks.')); cell.colSpan = 5; empty.append(cell); body.append(empty); }
      table.append(body); wrap.append(table); return wrap;
    }
    function statusCell(item, type) {
      var cell = el('td');
      var span = el('span', 'opc-status opc-status-' + type + ' opc-code-' + str(item && item.code, 'unknown'), statusValue(item, type));
      cell.append(span); return cell;
    }
    function detailField(caption, value) {
      var item = el('div', 'opc-detail-field');
      item.append(el('dt', '', caption), el('dd', '', value || '—'));
      return item;
    }
    function renderTeamMembers(task) {
      var team = task.asyncTeam;
      var section = el('section', 'opc-team-section');
      var heading = el('div', 'opc-section-heading-row');
      heading.append(el('h4', '', tr('团队协作', 'Team collaboration')));
      if (team && team.phase) heading.append(el('span', 'opc-plain-status', str(team.phase)));
      section.append(heading);
      var isTeamTask = !!(team && team.schema);
      var note = el('p', 'opc-subtitle', team && team.hasUnknown ? tr('团队结果来源待核查；请先检查宿主状态。', 'Team result provenance needs checking; inspect host status first.') : isTeamTask ? tr('这项任务通过宿主团队入口统一派发。普通消息不会启动团队执行。', 'This task is dispatched through the host team entry. Ordinary messages do not start team execution.') : tr('可以将这项现有任务交由宿主团队入口执行；这不会改变任务负责人。', 'Send this existing task through the host team entry. Its owner stays unchanged.'));
      section.append(note);
      var candidates = bots().filter(function (bot) { return refId(bot) !== refId(task.ownerBotRef); });
      var allowed = candidates.map(function (bot) { return String(bot.nativeBotId || ''); }).filter(Boolean);
      var chosen = teamSelection[String(task.id)];
      if (!chosen) chosen = allowed.slice();
      else chosen = chosen.filter(function (id) { return allowed.indexOf(id) >= 0; });
      teamSelection[String(task.id)] = chosen;
      var list = el('div', 'opc-team-member-list');
      candidates.forEach(function (bot) {
        var nativeId = String(bot.nativeBotId || '');
        var line = el('label', 'opc-team-member');
        var check = field('input', 'team-member-' + task.id + '-' + refId(bot), '');
        check.type = 'checkbox'; check.checked = !!nativeId && chosen.indexOf(nativeId) >= 0;
        check.disabled = !nativeId || !!(team && team.hasUnknown) || !!state.busy.startTeamTask;
        check.addEventListener('change', function () {
          var next = teamSelection[String(task.id)] || [];
          teamSelection[String(task.id)] = check.checked ? next.concat([nativeId]) : next.filter(function (id) { return id !== nativeId; });
        });
        line.append(check, el('span', '', bot.name || refId(bot)));
        if (!nativeId) line.append(el('span', 'opc-hint', tr('无原生 BOT 标识', 'Missing native BOT ID')));
        list.append(line);
      });
      if (!candidates.length) list.append(el('p', 'opc-empty', tr('没有可加入的其他成员。', 'No other members are available.')));
      section.append(list);
      var actions = el('div', 'opc-actions');
      if (team && ['planning', 'waiting', 'summarizing'].indexOf(team.phase) >= 0) {
        actions.append(button(tr('停止团队协作', 'Stop team collaboration'), 'opc-button opc-danger', function () { stopTeam(task); }, 'stop-team-' + task.id));
      } else {
        var start = button(tr('启动团队协作', 'Start team collaboration'), 'opc-button opc-primary', function () { startTeam(task); }, 'start-team-' + task.id);
        start.disabled = !!(team && team.hasUnknown) || !candidates.length || !candidates.every(function (bot) { return !!bot.nativeBotId; }) || !!state.busy.startTeamTask;
        actions.append(start);
      }
      section.append(actions);
      return section;
    }
    function renderTaskDetail() {
      var task = taskFor(state.selectedTaskId);
      if (!task) return el('p', 'opc-empty', tr('选择一项任务查看详情。', 'Select a task to view its details.'));
      var detail = el('section', 'opc-task-detail');
      var title = el('div', 'opc-section-heading-row');
      title.append(el('h3', '', task.goal || task.id));
      title.append(button(tr('收起', 'Collapse'), 'opc-link-button', function () { selectTask(''); }, 'collapse-task'));
      detail.append(title);
      detail.append(el('p', 'opc-entity-id', 'task ' + str(task.id) + ' · ' + tr('版本 ', 'revision ') + str(task.revision)));
      var fields = el('dl', 'opc-detail-grid');
      fields.append(detailField(tr('负责人 BOT', 'Owner BOT'), botName(task.ownerBotRef)), detailField(tr('业务状态', 'Business status'), statusValue(task.business, 'business')), detailField(tr('BOT 运行', 'BOT runtime'), statusValue(task.runtime, 'runtime')), detailField(tr('交接状态', 'Handoff'), statusValue(task.handoff, 'handoff')));
      detail.append(fields);
      var refs = Array.isArray(task.resultRefs) ? task.resultRefs : [];
      var resultRow = el('div', 'opc-result-ref-row');
      resultRow.append(el('strong', '', tr('成果引用', 'Result references')));
      resultRow.append(el('span', '', refs.length ? refs.map(function (item) { return refId(item) || str(item.type); }).join(' · ') : tr('宿主尚未提供可显示的成果引用。', 'The host has not provided a displayable result reference.')));
      detail.append(resultRow);
      var actionRow = el('div', 'opc-actions opc-task-actions');
      actionRow.append(button(tr('查看成果', 'View result'), 'opc-button', function () { loadResult(task.id); }, 'load-result-' + task.id));
      actionRow.append(button(tr('委派给成员', 'Delegate to member'), 'opc-button', function () { var form = detail.querySelector('.opc-delegate-form'); if (form) form.hidden = !form.hidden; }, 'toggle-delegate-' + task.id));
      detail.append(actionRow);
      var delegate = makeDelegateForm(task);
      detail.append(delegate);
      var team = renderTeamMembers(task); if (team) detail.append(team);
      var runs = Array.isArray(task.runIds) ? task.runIds : [];
      if (runs.length) {
        var runSection = el('section', 'opc-run-section');
        var runLabel = el('h4', '', tr('运行记录', 'Runs'));
        var select = field('select', 'cancel-run-' + task.id, 'opc-control opc-run-select');
        select.setAttribute('aria-label', tr('选择运行记录', 'Choose a run'));
        var runOptions = [{ value: '', label: tr('选择运行记录…', 'Choose a run…') }];
        runs.forEach(function (runId, index) { runOptions.push({ value: runId, label: 'run ' + str(runId) }); });
        appendSelectOptions(select, runOptions, '');
        var cancel = button(tr('请求停止', 'Request stop'), 'opc-button opc-danger', function () { cancelRun(task, select.value); }, 'cancel-run-action-' + task.id);
        cancel.disabled = !select.value || !!state.busy['cancelRun-' + select.value];
        select.addEventListener('change', function () { cancel.disabled = !select.value || !!state.busy['cancelRun-' + select.value]; });
        runSection.append(runLabel, select, cancel); detail.append(runSection);
      }
      if (state.result && String(state.result.taskId || state.result.ref && state.result.ref.taskId) === String(task.id)) detail.append(renderResult(task, state.result));
      return detail;
    }
    function makeDelegateForm(task) {
      var form = el('form', 'opc-delegate-form'); form.hidden = true;
      var heading = el('h4', '', tr('委派现有任务', 'Delegate this task'));
      var select = field('select', 'delegate-bot-' + task.id, 'opc-control');
      select.setAttribute('aria-label', tr('委派给成员 BOT', 'Delegate to member BOT'));
      var candidates = bots().filter(function (bot) { return refId(bot) !== refId(task.ownerBotRef); });
      var opts = candidates.map(function (bot) { return { value: refId(bot), label: bot.name || refId(bot) }; });
      appendSelectOptions(select, opts, drafts.delegateBot || opts[0] && opts[0].value || '');
      select.value = drafts.delegateBot && opts.some(function (o) { return o.value === drafts.delegateBot; }) ? drafts.delegateBot : select.value;
      select.addEventListener('change', function () { drafts.delegateBot = select.value; });
      var goal = field('textarea', 'delegate-goal', 'opc-control opc-textarea');
      goal.value = drafts.delegateGoal; goal.placeholder = tr('说明交给成员的具体工作', 'Describe the work for the member');
      goal.addEventListener('input', function () { drafts.delegateGoal = goal.value; });
      var submit = button(tr('提交委派', 'Submit delegation'), 'opc-button opc-primary'); submit.type = 'submit'; submit.disabled = !candidates.length;
      form.append(heading, label(tr('成员 BOT', 'Member BOT'), select), label(tr('委派目标', 'Delegation goal'), goal), submit);
      form.addEventListener('submit', function (event) { event.preventDefault(); delegateTask(task, { bot: select.value, goal: goal.value }); });
      return form;
    }
    function renderResult(task, result) {
      var section = el('section', 'opc-result');
      section.setAttribute('aria-live', 'polite');
      section.append(el('h4', '', tr('宿主成果', 'Host result')));
      if (result.loading) { section.append(el('p', 'opc-subtitle', tr('正在读取…', 'Loading…'))); return section; }
      section.append(el('p', 'opc-entity-id', 'run ' + str(result.ref && result.ref.runId) + ' · ' + tr('宿主版本 ', 'host revision ') + str(result.revision, '—')));
      var pre = el('pre', 'opc-result-text', result.text || '');
      section.append(pre);
      if (task.business && task.business.code === 'needsReview' && result.ref && result.ref.runId && result.digest) {
        var confirm = el('label', 'opc-accept-check');
        var check = field('input', 'acceptance-check-' + task.id, ''); check.type = 'checkbox';
        check.addEventListener('change', function () { accept.disabled = !check.checked || !!state.busy.acceptTask; });
        confirm.append(check, el('span', '', tr('我已查看成果，并确认符合本任务的验收标准。', 'I reviewed the result and confirm it meets the task criteria.')));
        var accept = button(tr('确认验收', 'Accept task'), 'opc-button opc-primary', function () { acceptTask(task); }, 'accept-task-' + task.id); accept.disabled = true;
        section.append(confirm, accept);
      }
      return section;
    }
    function taskTabs() {
      var tabs = el('div', 'opc-tabs');
      [['tasks', tr('任务', 'Tasks')], ['members', tr('成员', 'Members')]].forEach(function (item) {
        var control = button(item[1], 'opc-tab' + (state.tab === item[0] ? ' is-active' : ''), function () { state.tab = item[0]; renderAll(); }, 'tab-' + item[0]);
        control.setAttribute('aria-selected', state.tab === item[0] ? 'true' : 'false'); control.setAttribute('role', 'tab');
        tabs.append(control);
      });
      tabs.setAttribute('role', 'tablist');
      return tabs;
    }
    function memberList() {
      var section = el('section', 'opc-members');
      section.append(el('h3', '', tr('工程成员', 'Project members')));
      bots().forEach(function (bot) {
        var row = el('div', 'opc-member-row');
        var info = el('div', 'opc-member-info');
        info.append(el('strong', '', bot.name || refId(bot)));
        var scope = ['project-records', 'unified-workspace'].indexOf(String(bot.runtimeScope || '')) >= 0
          ? tr('本空间统一工作记录', 'Workspace project records')
          : str(bot.runtimeScope, tr('运行范围未说明', 'Runtime scope not specified'));
        info.append(el('span', 'opc-subtitle', tr('运行状态：', 'Runtime: ') + statusValue(bot.runtime, 'runtime') + ' · ' + scope));
        row.append(info);
        row.append(button(tr('打开 BOT', 'Open BOT'), 'opc-link-button', function () { onOpenBot(String(bot.nativeBotId || refId(bot))); }, 'open-bot-' + refId(bot)));
        section.append(row);
      });
      if (!bots().length) section.append(el('p', 'opc-empty', tr('没有可显示的工程成员。', 'No project members to show.')));
      return section;
    }
    function createTaskForm() {
      var form = el('form', 'opc-create-form');
      var heading = el('div', 'opc-section-heading-row');
      heading.append(el('h3', '', tr('新建任务', 'Create a task')));
      heading.append(button(tr('取消', 'Cancel'), 'opc-link-button', function () {
        state.showCreate = false;
        renderAll();
        restoreFocus(engineeringMount, { key: 'open-create-task', start: null, end: null });
      }, 'cancel-new-task'));
      var owner = field('select', 'create-task-owner', 'opc-control');
      owner.setAttribute('aria-label', tr('任务负责人 BOT', 'Task owner BOT'));
      var ownerOptions = bots().map(function (bot) { return { value: refId(bot), label: bot.name || refId(bot) }; });
      appendSelectOptions(owner, ownerOptions, drafts.createOwner || (state.project && state.project.projectId ? refId(projectFor(state.project.projectId).ownerBotRef) : ''));
      if (drafts.createOwner && ownerOptions.some(function (o) { return o.value === drafts.createOwner; })) owner.value = drafts.createOwner;
      owner.addEventListener('change', function () { drafts.createOwner = owner.value; });
      var goal = field('textarea', 'create-task-goal', 'opc-control opc-textarea');
      goal.value = drafts.createGoal; goal.placeholder = tr('描述需要完成的工作', 'Describe the work to be done');
      goal.addEventListener('input', function () { drafts.createGoal = goal.value; });
      var criteria = field('textarea', 'create-task-criteria', 'opc-control opc-textarea');
      criteria.value = drafts.createCriteria; criteria.placeholder = tr('写明可核对的验收标准', 'State verifiable acceptance criteria');
      criteria.addEventListener('input', function () { drafts.createCriteria = criteria.value; });
      var submit = button(tr('创建任务', 'Create task'), 'opc-button opc-primary'); submit.type = 'submit'; submit.disabled = !ownerOptions.length;
      form.append(heading, label(tr('目标', 'Goal'), goal), label(tr('验收标准', 'Acceptance criteria'), criteria), label(tr('负责人 BOT', 'Owner BOT'), owner), submit);
      form.addEventListener('submit', function (event) { event.preventDefault(); createTask({ goal: goal.value, criteria: criteria.value, owner: owner.value }); });
      return form;
    }
    function renderProjectBody() {
      var project = projectFor(state.selectedProjectId);
      if (!project || !state.project) {
        var loading = el('section', 'opc-project-main');
        loading.append(el('h2', '', project ? project.name : tr('工程', 'Project')));
        loading.append(el('p', 'opc-empty', state.loading ? tr('正在读取授权工程…', 'Loading authorized project…') : tr('选择一个工程以读取任务。', 'Choose a project to read its tasks.')));
        var notice = statusBox(); if (notice) loading.append(notice);
        return loading;
      }
      var section = el('section', 'opc-project-main');
      section.append(projectSummary(project));
      var watchMount = el('div', 'opc-project-watch-mount');
      section.append(watchMount);
      var tabs = taskTabs(); section.append(tabs);
      if (state.tab === 'members') section.append(memberList());
      else {
        var taskHeading = el('div', 'opc-section-heading-row opc-task-heading');
        taskHeading.append(el('h3', '', tr('任务', 'Tasks')));
        var newTask = button(tr('新建任务', 'New task'), 'opc-button opc-primary', function () {
          var form = section.querySelector('.opc-create-form');
          if (!form) return;
          state.showCreate = true;
          form.hidden = false;
          alignInScrollContainer(section, form.querySelector('.opc-section-heading-row'), 8);
          restoreFocus(section, { key: 'create-task-goal', start: null, end: null });
        }, 'open-create-task');
        taskHeading.append(newTask); section.append(taskHeading);
        var createForm = createTaskForm(); createForm.hidden = !state.showCreate; section.append(createForm);
        section.append(taskTable());
        section.append(renderTaskDetail());
      }
      var notice = statusBox(); if (notice) section.append(notice);
      return section;
    }
    function renderEngineering() {
      if (!engineeringMount || destroyed) return;
      var container = el('section', 'opc-engineering');
      container.setAttribute('aria-label', tr('工程协作', 'Project collaboration'));
      var title=titleBar();container.append(title);
      if (!enabled) { container.append(buttonForFeature()); replaceMount(engineeringMount, container); return; }
      if (!hasApi()) { container.append(renderUnavailable()); replaceMount(engineeringMount, container); return; }
      var scope=currentScope(), project=projectFor(state.selectedProjectId);
      if(scope&&scope.spaceId!=='personal'&&root.OpenBotTemporaryBots)root.OpenBotTemporaryBots.decorate(container,{kind:state.selectedProjectId?'project':'space',id:state.selectedProjectId||scope.spaceId,spaceId:scope.spaceId,label:project&&(project.name||project.id)||tr('工程空间','Engineering space')},title,30);
      var layout = el('div', 'opc-engineering-layout');
      layout.append(projectNavigation());
      layout.append(state.selectedProjectId ? renderProjectBody() : overviewContent());
      layout.append(renderTaskChat());
      container.append(layout);
      replaceMount(engineeringMount, container);
      if (watchController) {
        var watchMount = engineeringMount.querySelector('.opc-project-watch-mount');
        if (!watchMount || !state.selectedProjectId || !state.project) watchController.unmount();
        else {
          var summary = projectFor(state.selectedProjectId);
          watchController.mount(watchMount, {
            projectId: state.selectedProjectId,
            projectName: summary && (summary.name || summary.id) || '',
            bots: bots(), tasks: tasks(), rootBudget: null
          });
        }
      }
    }
    function renderTaskChat() {
      var panel = el('aside', 'opc-task-chat');
      panel.setAttribute('aria-label', tr('负责人 BOT 对话', 'Task owner BOT conversation'));
      if (!state.selectedProjectId) {
        panel.append(el('h2', '', tr('任务对话', 'Task conversation')));
        panel.append(el('p', 'opc-empty', tr('选择一个工程和任务后，可查看其负责 BOT 的原始会话。', 'Choose a project and task to view the owner BOT’s original conversation.')));
        return panel;
      }
      var task = taskFor(state.selectedTaskId);
      var top = el('div', 'opc-chat-heading');
      top.append(el('div', '', tr('负责人对话', 'Owner conversation')));
      top.append(el('p', 'opc-subtitle', task ? tr('负责人 BOT：', 'Owner BOT: ') + botName(task.ownerBotRef) + ' · ' + tr('当前聊天 BOT：', 'Current chat BOT: ') + (state.selectedBotId ? botName(state.selectedBotId) : tr('未选择', 'None')) : tr('选择任务后读取该任务负责人的原会话。', 'Select a task to read its owner’s original conversation.')));
      panel.append(top);
      var summary = projectFor(state.selectedProjectId);
      if (summary) {
        var summaryRow = el('div', 'opc-chat-project-summary');
        summaryRow.append(el('strong', '', summary.name || summary.id));
        summaryRow.append(renderCounts(summary.counts, true));
        panel.append(summaryRow);
        panel.append(button(tr('读取工程摘要', 'Read project summary'), 'opc-link-button', loadContext, 'load-context'));
      }
      if (!task) { panel.append(el('p', 'opc-empty', tr('当前工程没有选中任务。', 'No task is selected.'))); return panel; }
      var current = el('section', 'opc-chat-current');
      current.append(el('span', 'opc-subtitle', tr('当前任务', 'Current task')));
      current.append(el('strong', '', task.goal || task.id));
      current.append(el('span', 'opc-subtitle', tr('由 ', 'Executed by ') + botName(task.ownerBotRef)));
      panel.append(current);
      var messageList = el('div', 'opc-message-list');
      if (state.conversation && state.conversation.taskId === String(task.id)) {
        (Array.isArray(state.conversation.messages) ? state.conversation.messages : []).forEach(function (message) {
          if (message.unavailable || !message.text) return;
          var item = el('article', 'opc-message opc-message-' + (message.role === 'user' || message.role === 'human' ? 'user' : message.role === 'system' ? 'system' : 'assistant'));
          var header = el('div', 'opc-message-meta');
          var role = message.role === 'user' || message.role === 'human' ? tr('用户', 'User') : message.role === 'system' ? tr('系统', 'System') : botName(task.ownerBotRef);
          header.append(el('strong', '', role));
          var timestamp = showDate(message.createdAt); if (timestamp) header.append(el('time', '', timestamp));
          item.append(header, el('p', 'opc-message-text', message.text));
          messageList.append(item);
        });
        if (state.conversation.loading) messageList.append(el('p', 'opc-empty', tr('读取原始会话…', 'Loading original conversation…')));
        if (!state.conversation.loading && !state.conversation.messages?.length) messageList.append(el('p', 'opc-empty', tr('宿主尚未提供可恢复的对话消息。', 'The host has no recoverable conversation messages yet.')));
      } else {
        messageList.append(el('p', 'opc-empty', tr('读取原始任务会话中…', 'Reading the original task conversation…')));
      }
      if (state.pendingSubmission && String(state.pendingSubmission.taskId) === String(task.id)) {
        var pendingCopy = state.pendingSubmission.uncertain
          ? tr('请求状态尚未确认。请重新读取原会话核对，确认前不要再次发送。', 'The request status is unconfirmed. Reload the original conversation to check; do not send it again until verified.')
          : tr('消息已提交，等待宿主会话确认；确认前不会显示为 BOT 回复。', 'Message submitted; waiting for the host conversation to confirm it. It will not appear as a BOT reply before confirmation.');
        messageList.append(el('p', 'opc-pending-message', pendingCopy));
      }
      panel.append(messageList);
      if (!task.asyncTeam || !task.asyncTeam.schema) {
        var composer = el('form', 'opc-chat-composer');
        var textarea = field('textarea', 'task-message', 'opc-control opc-chat-input');
        textarea.value = drafts.message; textarea.placeholder = state.conversation && state.conversation.threadId ? tr('补充当前任务…', 'Follow up on this task…') : tr('首次发送会启动当前任务。', 'The first message starts this task.');
        textarea.disabled = !!state.pendingSubmission || !!state.busy.sendMessage;
        textarea.addEventListener('input', function () { drafts.message = textarea.value; });
        var send = button(state.conversation && state.conversation.threadId ? tr('补充现任务', 'Follow up') : tr('启动任务并发送', 'Start task and send'), 'opc-button opc-primary'); send.type = 'submit'; send.disabled = !drafts.message.trim() || !!state.pendingSubmission || !!state.busy.sendMessage;
        textarea.addEventListener('input', function () { send.disabled = !textarea.value.trim() || !!state.pendingSubmission || !!state.busy.sendMessage; });
        composer.append(textarea, send);
        composer.addEventListener('submit', function (event) { event.preventDefault(); sendMessage(task); });
        panel.append(composer);
      } else {
        panel.append(el('p', 'opc-chat-note', tr('团队任务只能通过宿主团队协作入口执行。', 'Team tasks run only through the host team collaboration entry.')));
      }
      var controls = el('div', 'opc-chat-actions');
      controls.append(button(tr('重新读取会话', 'Reload conversation'), 'opc-link-button', function () { refreshConversationAction(task); }, 'reload-conversation'));
      panel.append(controls);
      if (state.context) {
        var contextView = el('section', 'opc-context');
        contextView.append(el('h4', '', tr('工程摘要', 'Project summary')));
        var tasks = Array.isArray(state.context.tasks) ? state.context.tasks : [];
        tasks.forEach(function (entry) { contextView.append(el('p', '', str(entry.goal || entry.id))); });
        panel.append(contextView);
      }
      var notice = statusBox(); if (notice) panel.append(notice);
      return panel;
    }
    function renderChatCard() {
      if (!chatMount || destroyed) return;
      var card = el('section', 'opc-chat-card');
      card.setAttribute('aria-label', tr('工程摘要卡片', 'Project summary card'));
      if (!enabled) {
        chatMount.replaceChildren();
        return;
      }
      if (!hasApi()) { card.append(renderUnavailable()); replaceMount(chatMount, card); return; }
      var projectPicker = field('select', 'chat-card-project-picker', 'opc-control');
      projectPicker.setAttribute('aria-label', tr('当前工程', 'Current project'));
      var projectOptions = [{ value: '', label: tr('选择工程', 'Choose a project') }];
      (state.space && Array.isArray(state.space.projects) ? state.space.projects : []).forEach(function (item) {
        projectOptions.push({ value: item.id, label: item.name || item.id });
      });
      appendSelectOptions(projectPicker, projectOptions, state.selectedProjectId);
      projectPicker.disabled = projectOptions.length < 2;
      projectPicker.addEventListener('change', function () { selectProject(projectPicker.value); });
      var projectPickerRow = el('label', 'opc-card-project-picker', tr('当前工程', 'Current project'));
      projectPickerRow.append(projectPicker);
      card.append(projectPickerRow);
      var project = projectFor(state.selectedProjectId);
      if (!project) {
        card.append(el('h3', '', tr('工程摘要', 'Project summary')));
        card.append(el('p', 'opc-empty', tr('选择工程后显示任务摘要。', 'Choose a project to show its task summary.')));
        replaceMount(chatMount, card); return;
      }
      card.append(el('h3', '', project.name || project.id));
      card.append(renderCounts(project.counts, true));
      var allScopedTasks = state.space && Array.isArray(state.space.tasks)
        ? state.space.tasks.filter(function (task) { return String(task.projectId) === String(project.id); })
        : tasks();
      var scopedTasks = allScopedTasks.filter(function (task) { return !(task.parentTaskId || task.parentWorkTaskId); });
      var list = el('ul', 'opc-card-task-list');
      scopedTasks.slice(0, 4).forEach(function (task) {
        var item = el('li');
        var taskButton = button(task.goal || task.id, 'opc-task-link', function () { selectProject(project.id).then(function () { selectTask(task.id); }); }, 'card-task-' + task.id);
        item.append(taskButton, el('span', 'opc-subtitle', botName(task.ownerBotRef) + ' · ' + statusValue(task.business, 'business')));
        list.append(item);
      });
      if (!scopedTasks.length) list.append(el('li', 'opc-empty', tr('暂无任务。', 'No tasks yet.')));
      card.append(list);
      card.append(button(tr('打开工程', 'Open project'), 'opc-button', function () { onNavigate({ spaceId: currentScope() && currentScope().spaceId, projectId: project.id, botId: state.selectedBotId || undefined }); }, 'open-project'));
      var notice = statusBox(); if (notice) card.append(notice);
      replaceMount(chatMount, card);
    }

    function syncMountOptions(mountOptions) {
      mountOptions = mountOptions || {};
      var changed = false;
      if (Object.prototype.hasOwnProperty.call(mountOptions, 'projectId')) {
        var projectId = mountOptions.projectId ? String(mountOptions.projectId) : '';
        if (projectId !== state.selectedProjectId) {
          state.selectedProjectId = projectId;
          clearPrivate();
          changed = true;
        }
      }
      if (Object.prototype.hasOwnProperty.call(mountOptions, 'botId')) {
        var botId = mountOptions.botId ? String(mountOptions.botId) : '';
        if (botId !== state.selectedBotId) {
          state.selectedBotId = botId;
          clearPrivate();
          changed = true;
        }
      }
      return changed;
    }
    function mountEngineering(container, mountOptions) {
      engineeringMount = container || null;
      var changed = syncMountOptions(mountOptions);
      renderEngineering();
      if (enabled && (changed || !state.space)) refreshAll();
    }
    function mountChatCard(container, mountOptions) {
      chatMount = container || null;
      var changed = syncMountOptions(mountOptions);
      renderChatCard();
      if (enabled && (changed || !state.space)) refreshAll();
    }
    function handleScopeChange() {
      generation++; securityEpoch++;
      scopeKey = currentKey();
      state.selectedProjectId = '';
      state.selectedBotId = '';
      clearAllData();
      state.status = ''; state.statusTone = ''; state.error = '';
      if (watchController) watchController.handleScopeChange();
      renderAll();
      if (enabled) refreshAll();
    }
    function destroy() {
      if (destroyed) return;
      destroyed = true;
      root.removeEventListener('openbot-temporary-bots-changed', handleTemporaryChange);
      generation++; securityEpoch++;
      unsubscribeChanges();
      root.removeEventListener('openbot-project-watch-open', onOpenWatchEvent);
      if (watchController) watchController.destroy();
      clearAllData();
      if (engineeringMount) engineeringMount.replaceChildren();
      if (chatMount) chatMount.replaceChildren();
      engineeringMount = null; chatMount = null;
    }
    if (root.OpenBotProjectWatch && typeof root.OpenBotProjectWatch.create === 'function') {
      watchController = root.OpenBotProjectWatch.create({ bridge: bridge, getScope: getScope, onOpenProjectWatch: handleProjectWatchOpen });
      root.addEventListener('openbot-project-watch-open', onOpenWatchEvent);
    }
    root.addEventListener('openbot-temporary-bots-changed', handleTemporaryChange);
    function handleTemporaryChange(){if(enabled&&!destroyed)refreshAll();}
    scopeKey = currentKey();
    return { mountEngineering: mountEngineering, mountChatCard: mountChatCard, handleScopeChange: handleScopeChange, destroy: destroy, openProjectWatch: handleProjectWatchOpen };
  }

  root.OpenBotProjectCollaboration = { create: create };
})(window);
