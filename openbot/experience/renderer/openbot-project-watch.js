/* Native project watch UI. All watch state and mutations come from the host bridge. */
(function (root) {
  'use strict';

  var DAY = 24 * 60 * 60 * 1000;
  function tr(zh, en, params) {
    if (root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function') return root.OpenBotI18n.t(zh, en, params);
    return (root.document.documentElement.lang || '').toLowerCase().indexOf('en') === 0 ? en : zh;
  }
  function str(value, fallback) { return value === undefined || value === null ? (fallback === undefined ? '' : String(fallback)) : String(value); }
  function idOf(value) { return typeof value === 'string' ? value : value && (value.id || value.botId || value.instanceId) ? String(value.id || value.botId || value.instanceId) : ''; }
  function el(tag, className, value) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = str(value);
    return node;
  }
  function makeButton(label, className, action, focusKey) {
    var node = el('button', className || 'pw-button', label);
    node.type = 'button';
    if (focusKey) node.dataset.pwFocus = focusKey;
    if (action) node.addEventListener('click', action);
    return node;
  }
  function statusCopy(watch) {
    if (!watch) return tr('未开启', 'Off');
    if (watch.status === 'needs_user' || watch.phase === 'needs_user') return tr('需要你决定', 'Needs your decision');
    if (watch.status === 'paused') return tr('已暂停', 'Paused');
    if (watch.status === 'expired') return tr('已到期', 'Expired');
    if (watch.status === 'completed') return tr('工程条件已满足', 'Project criteria met');
    if (watch.status === 'stopped') return tr('已停止', 'Stopped');
    if (watch.phase === 'advancing') return tr('正在按计划推进', 'Advancing approved work');
    if (watch.phase === 'queued') return tr('等待开始', 'Queued');
    if (watch.phase === 'waiting_dependency') return tr('等待依赖', 'Waiting for a dependency');
    return watch.mode === 'advance' ? tr('正在关注并按计划推进', 'Watching and advancing the approved plan') : tr('正在关注并提醒', 'Watching and notifying');
  }
  function phaseCopy(watch) {
    if (!watch) return '';
    var phases = {
      observing: [tr('检查工程状态', 'Checking project state')],
      advancing: [tr('正在推进获准步骤', 'Advancing an approved step')],
      waiting_dependency: [tr('等待所选任务依赖满足', 'Waiting for selected task dependencies')],
      queued: [tr('所选任务已排队', 'Selected task is queued')],
      needs_user: [tr('处理决定后可重新核查', 'Resolve the decision before checking again')],
      paused: [tr('不会进行新的定时检查', 'Scheduled checks are paused')],
      expired: [tr('期限已结束', 'The watch period has ended')],
      completed: [tr('依据工程验收状态记录', 'Recorded from project acceptance state')],
      stopped: [tr('不会再发起关注动作', 'No further watch actions will start')]
    };
    return phases[watch.phase] ? phases[watch.phase][0] : '';
  }
  function showDate(value) {
    if (!value) return tr('尚无记录', 'No record yet');
    var date = new Date(value);
    if (isNaN(date.getTime())) return tr('未知', 'Unknown');
    try { return date.toLocaleString(root.OpenBotI18n ? root.OpenBotI18n.locale : undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
    catch (_) { return date.toLocaleString(); }
  }
  function budgetText(budget, max, key) {
    var used = budget && Number.isFinite(Number(budget[key])) ? Number(budget[key]) : 0;
    var cap = max && Number.isFinite(Number(max[key])) ? Number(max[key]) : null;
    return cap === null ? String(used) : used + ' / ' + cap;
  }

  function create(options) {
    options = options || {};
    var bridge = options.bridge || root.grokbot;
    var getScope = options.getScope;
    var onOpenProjectWatch = typeof options.onOpenProjectWatch === 'function' ? options.onOpenProjectWatch : function () {};
    var mountNode = null;
    var context = null;
    var contextKey = '';
    var generation = 0;
    var readEpoch = 0;
    var commandEpoch = 0;
    var eventEpoch = 0;
    var destroyed = false;
    var state = { data: null, watch: null, loading: false, busy: false, error: '', readFailed: false, notice: '', expanded: false, showForm: false, unsupported: false };
    var drafts = Object.create(null);
    var hostOptionsByKey = Object.create(null);
    var draft = null;
    var offChanged = null;
    var offOpen = null;

    function currentScope() {
      var value = null;
      try { value = typeof getScope === 'function' ? getScope() : null; } catch (_) { value = null; }
      if (!value || !value.spaceId || value.scopeRevision === undefined || value.scopeRevision === null) return null;
      return { spaceId: String(value.spaceId), scopeRevision: value.scopeRevision };
    }
    function makeKey(scope, projectId) { return scope ? scope.spaceId + '|' + String(scope.scopeRevision) + '|' + String(projectId || '') : ''; }
    function live(ticket) {
      var scope = currentScope();
      return !destroyed && !!context && ticket.generation === generation && ticket.key === contextKey &&
        ticket.key === makeKey(scope, context.projectId);
    }
    function scopeForCall() {
      var scope = currentScope();
      if (!scope || !context || !context.projectId) throw new Error(tr('当前工程范围不可用。', 'The current project scope is unavailable.'));
      return scope;
    }
    function nowTicket() { return { generation: generation, key: contextKey }; }
    function hasStateApi() { return !!bridge && typeof bridge.projectWatchState === 'function'; }
    function hasCommandApi() { return !!bridge && typeof bridge.projectWatchCommand === 'function'; }
    function defaultDraft() {
      var bots = context && Array.isArray(context.bots) ? context.bots : [];
      var supervisor = bots.find(function (item) { return item.supervisorEligible === true; });
      var timezone = 'UTC';
      try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || timezone; } catch (_) { }
      return {
        supervisorBotId: supervisor ? String(supervisor.botId) : '', objective: '', criteria: '', mode: 'observe',
        taskIds: [], memberBotIds: [], expiresDays: '7', intervalMinutes: '30', stalledMinutes: '120',
        restartAllowed: false, notificationsEnabled: true, quietEnabled: false, quietStart: '22', quietEnd: '8', timeZone: timezone,
        modelRequests: String(context && context.rootBudget ? context.rootBudget.modelRequests : ''),
        toolCalls: String(context && context.rootBudget ? context.rootBudget.toolCalls : '')
      };
    }
    function saveDraft() { if (contextKey && draft) drafts[contextKey] = draft; }
    function draftForContext() {
      if (!drafts[contextKey]) drafts[contextKey] = defaultDraft();
      return drafts[contextKey];
    }
    function setDraft(key, value) { if (!draft) return; draft[key] = value; saveDraft(); syncSubmitAvailability(); }
    function eligibleSupervisors() { return context && Array.isArray(context.bots) ? context.bots.filter(function (bot) { return bot.supervisorEligible === true; }) : []; }
    function eligibleMembers() {
      var selectedOwners = selectedTaskOwners();
      return context && Array.isArray(context.bots) ? context.bots.filter(function (bot) {
        var botRef = idOf(bot.botRef);
        return bot.available === true && String(bot.botId) !== String(draft && draft.supervisorBotId || '') && !selectedOwners.has(botRef);
      }) : [];
    }
    function availableTasks() {
      return context && Array.isArray(context.tasks) ? context.tasks.filter(function (task) { return task.status === 'ready' && task.adoptable !== false; }) : [];
    }
    function selectedTasks() {
      var all = availableTasks(), ids = draft ? draft.taskIds : [];
      return ids.map(function (id) { return all.find(function (task) { return String(task.id) === String(id); }); }).filter(Boolean);
    }
    function selectedTaskOwners() {
      var result = new Set();
      selectedTasks().forEach(function (task) { var id = idOf(task.ownerBotRef); if (id) result.add(id); });
      return result;
    }
    function botName(ref) {
      var id = idOf(ref);
      var bots = context && Array.isArray(context.bots) ? context.bots : [];
      var bot = bots.find(function (item) { return idOf(item.botRef) === id || String(item.botId) === id; });
      return bot ? String(bot.name || tr('未命名 BOT', 'Unnamed BOT')) : tr('负责人不可用', 'Owner unavailable');
    }
    function validBudget() {
      var defaults = context && context.rootBudget;
      if (!defaults || !Number.isSafeInteger(Number(defaults.modelRequests)) || !Number.isSafeInteger(Number(defaults.toolCalls))) return false;
      var requests = Number(draft && draft.modelRequests), tools = Number(draft && draft.toolCalls);
      return Number.isSafeInteger(requests) && requests >= 0 && requests <= Number(defaults.modelRequests) &&
        Number.isSafeInteger(tools) && tools >= 0 && tools <= Number(defaults.toolCalls);
    }
    function formValid() {
      if (!hasCommandApi() || !draft || !draft.objective.trim() || !draft.supervisorBotId || state.busy) return false;
      if (draft.mode === 'advance') {
        if (!selectedTasks().length || !draft.memberBotIds.length || !validBudget()) return false;
        if (!draft.memberBotIds.every(function (id) { return eligibleMembers().some(function (bot) { return String(bot.botId) === String(id); }); })) return false;
      }
      if (!Number.isSafeInteger(Number(draft.expiresDays)) || Number(draft.expiresDays) < 1 ||
          !Number.isSafeInteger(Number(draft.intervalMinutes)) || Number(draft.intervalMinutes) < 1 ||
          !Number.isSafeInteger(Number(draft.stalledMinutes)) || Number(draft.stalledMinutes) < 1) return false;
      if (draft.quietEnabled && (!Number.isInteger(Number(draft.quietStart)) || !Number.isInteger(Number(draft.quietEnd)) || Number(draft.quietStart) < 0 || Number(draft.quietStart) > 23 || Number(draft.quietEnd) < 0 || Number(draft.quietEnd) > 23 || Number(draft.quietStart) === Number(draft.quietEnd))) return false;
      return true;
    }
    function syncSubmitAvailability() {
      if (!mountNode) return;
      var submit = mountNode.querySelector('[data-pw-focus="start-project-watch"]');
      if (submit) submit.disabled = !formValid() || state.loading || !eligibleSupervisors().length;
    }
    function stateReply(value, key) {
      if (!value || typeof value !== 'object') throw new Error(tr('宿主没有返回工程关注状态。', 'The host returned no project watch state.'));
      if (value.projectId && String(value.projectId) !== String(key.split('|').slice(-1)[0])) throw new Error(tr('宿主返回了其他工程的关注状态。', 'The host returned watch state for another project.'));
      var candidate = value.watch || null;
      if (candidate && candidate.projectId && String(candidate.projectId) !== String(key.split('|').slice(-1)[0])) throw new Error(tr('宿主返回了其他工程的关注状态。', 'The host returned watch state for another project.'));
      state.data = value;
      state.watch = candidate;
      state.readFailed = false;
      var hostOptions = hostOptionsByKey[key] || (hostOptionsByKey[key] = {});
      if (Array.isArray(value.bots)) hostOptions.bots = value.bots;
      if (Array.isArray(value.tasks)) hostOptions.tasks = value.tasks;
      if (value.rootBudget && typeof value.rootBudget === 'object') hostOptions.rootBudget = value.rootBudget;
      if (value.allowedScope !== undefined) hostOptions.allowedScope = value.allowedScope;
      Object.assign(context, hostOptions);
      if (draft) {
        var supervisor = eligibleSupervisors()[0];
        if (!draft.supervisorBotId && supervisor) draft.supervisorBotId = String(supervisor.botId);
        if (context.rootBudget) {
          if (!draft.modelRequests) draft.modelRequests = String(context.rootBudget.modelRequests);
          if (!draft.toolCalls) draft.toolCalls = String(context.rootBudget.toolCalls);
        }
        saveDraft();
      }
    }
    async function refresh() {
      if (!context || destroyed) return;
      if (!hasStateApi()) { state.loading = false; state.unsupported = true; state.error = ''; render(); return; }
      var ticket = nowTicket(), epoch = ++readEpoch, scope;
      state.loading = true; state.error = ''; render();
      try {
        scope = scopeForCall();
        var reply = await bridge.projectWatchState({ spaceId: scope.spaceId, scopeRevision: scope.scopeRevision, projectId: context.projectId });
        if (!live(ticket) || epoch !== readEpoch) return;
        if (!reply || reply.ok !== true) throw new Error(reply && (reply.message || reply.error) || tr('读取工程关注状态失败。', 'Could not read project watch state.'));
        stateReply(reply.value, contextKey);
        state.loading = false; state.unsupported = false; state.error = ''; state.readFailed = false;
      } catch (error) {
        if (!live(ticket) || epoch !== readEpoch) return;
        state.loading = false; state.readFailed = true; state.error = error && error.message ? String(error.message) : tr('读取工程关注状态失败。', 'Could not read project watch state.');
      }
      render();
    }
    function revision(watch) { return watch && Number.isSafeInteger(watch.revision) ? watch.revision : null; }
    function unwrapWatch(value) {
      if (value && value.watch) return value.watch;
      return value && typeof value === 'object' ? value : null;
    }
    function isTerminal(watch) { return !!watch && ['stopped', 'completed'].indexOf(watch.status) >= 0; }
    function messageForError(error) {
      var code = error && error.code ? String(error.code) : '';
      if (code === 'PW_STALE' || code === 'WATCH_STALE') return tr('关注状态已更新，请检查后重试。', 'The watch changed. Review its current state and try again.');
      if (code === 'PW_SUPERVISOR_FORBIDDEN' || code === 'PW_SUPERVISOR_UNAVAILABLE') return tr('所选 Supervisor 已不可用，请重新选择。', 'The selected Supervisor is no longer available. Choose another.');
      if (code === 'PW_TASK_NOT_ADOPTABLE' || code === 'PW_TASK_CHANGED') return tr('所选任务已变化，请重新选择任务。', 'A selected task changed. Review the task selection.');
      return error && error.message ? String(error.message) : tr('请求未完成。输入已保留。', 'The request did not complete. Your input is still here.');
    }
    async function command(action, fields) {
      if (!hasCommandApi() || state.busy || !context) return;
      var ticket = nowTicket(), epoch = ++commandEpoch, watch = state.watch, expected = revision(watch);
      if (watch && action !== 'create' && expected === null) { state.error = tr('无法核对关注版本，暂时不能更改。', 'The watch revision cannot be checked, so it cannot be changed yet.'); render(); return; }
      var scope;
      try { scope = scopeForCall(); } catch (error) { state.error = messageForError(error); render(); return; }
      var commandEventEpoch = eventEpoch;
      var payload = Object.assign({ spaceId: scope.spaceId, scopeRevision: scope.scopeRevision, projectId: context.projectId, action: action }, fields || {});
      if (watch && action !== 'create') { payload.watchId = watch.watchId || watch.id; payload.expectedRevision = expected; }
      state.busy = true; state.error = ''; state.notice = ''; render();
      try {
        var reply = await bridge.projectWatchCommand(payload);
        if (!live(ticket) || epoch !== commandEpoch || commandEventEpoch !== eventEpoch) {
          if (live(ticket)) { state.busy = false; render(); }
          return;
        }
        if (!reply || reply.ok !== true) throw Object.assign(new Error(reply && (reply.message || reply.error) || tr('请求未完成。', 'The request did not complete.')), { code: reply && reply.code });
        var next = unwrapWatch(reply.value);
        if (!next || !next.status || next.projectId && String(next.projectId) !== String(context.projectId)) throw new Error(tr('宿主没有确认工程关注状态。', 'The host did not confirm the project watch state.'));
        if (watch && revision(next) !== null && revision(watch) !== null && revision(next) < revision(watch)) { await refresh(); return; }
        state.watch = next;
        state.showForm = false;
        state.error = '';
        state.notice = cancellationNotice(next, action);
        state.noticeTone = next.status === 'stopped' && unknownActionCount(next) ? 'warning' : 'success';
        saveDraft();
        if (action === 'create') { state.watch = next; }
        render();
        await refresh();
      } catch (error) {
        if (!live(ticket) || epoch !== commandEpoch || commandEventEpoch !== eventEpoch) {
          if (live(ticket)) { state.busy = false; render(); }
          return;
        }
        state.busy = false; state.error = messageForError(error); render();
        return;
      }
      state.busy = false; render();
    }
    function unknownActionCount(watch) {
      var actions = watch && watch.actions && typeof watch.actions === 'object' ? Object.values(watch.actions) : [];
      return actions.filter(function (action) { return ['cancel_unknown', 'unknown', 'intent'].indexOf(action.status) >= 0; }).length;
    }
    function cancellationNotice(watch, action) {
      var unknown = unknownActionCount(watch);
      if (['stop', 'pause', 'revoke'].indexOf(action) >= 0 && unknown) return tr('关注已停止新动作；有 ', 'New watch actions are blocked; ') + unknown + tr(' 项既有工作仍待核查。', ' existing task(s) still need reconciliation.');
      if (action === 'stop' || action === 'revoke') return tr('关注已停止。', 'The watch has stopped.');
      if (action === 'pause') return tr('关注已暂停。', 'The watch is paused.');
      if (action === 'resume' || action === 'resolve') return tr('已重新核查关注状态。', 'The watch state will be checked again.');
      if (action === 'create') return tr('工程关注已开启。', 'Project watch is on.');
      return '';
    }
    function syncSubscriptions() {
      if (!bridge) return;
      if (!offChanged && typeof bridge.onProjectWatchChanged === 'function') {
        try { offChanged = bridge.onProjectWatchChanged(function (event) {
          if (!context || !event || String(event.spaceId || '') !== currentScope()?.spaceId || String(event.projectId || '') !== String(context.projectId)) return;
          eventEpoch++; commandEpoch++; state.busy = false; refresh();
        }); } catch (_) { offChanged = null; }
      }
      if (!offOpen && typeof bridge.onProjectWatchOpen === 'function') {
        try { offOpen = bridge.onProjectWatchOpen(function (event) {
          var scope = currentScope();
          if (!event || !scope || String(event.spaceId || '') !== scope.spaceId || String(event.projectId || '') === '') return;
          if (event.scopeRevision !== undefined && String(event.scopeRevision) !== String(scope.scopeRevision)) return;
          onOpenProjectWatch({ spaceId: scope.spaceId, scopeRevision: scope.scopeRevision, projectId: String(event.projectId), watchId: event.watchId || null });
        }); } catch (_) { offOpen = null; }
      }
    }
    function focusRecord(container) {
      var active = root.document.activeElement;
      if (!container || !active || !container.contains(active) || !active.dataset || !active.dataset.pwFocus) return null;
      return { key: active.dataset.pwFocus, start: typeof active.selectionStart === 'number' ? active.selectionStart : null, end: typeof active.selectionEnd === 'number' ? active.selectionEnd : null };
    }
    function restoreFocus(container, record) {
      if (!container || !record) return;
      var nodes = container.querySelectorAll('[data-pw-focus]'), target = null;
      for (var i = 0; i < nodes.length; i++) if (nodes[i].dataset.pwFocus === record.key) { target = nodes[i]; break; }
      if (!target || target.disabled) return;
      try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
      if (record.start !== null && typeof target.setSelectionRange === 'function') { try { target.setSelectionRange(record.start, record.end); } catch (_) { } }
    }
    function replaceContent(next) {
      if (!mountNode) return;
      var focus = focusRecord(mountNode);
      mountNode.replaceChildren(next);
      restoreFocus(mountNode, focus);
    }
    function fieldLabel(copy, control) {
      var label = el('label', 'pw-field-label', copy);
      if (control.id) label.htmlFor = control.id;
      label.append(control); return label;
    }
    function textControl(key, value, options) {
      options = options || {};
      var control = el(options.multiline ? 'textarea' : 'input', 'pw-control');
      if (!options.multiline) control.type = options.type || 'text';
      control.id = 'project-watch-' + key;
      control.value = str(value);
      control.dataset.pwFocus = key;
      if (options.placeholder) control.placeholder = options.placeholder;
      if (options.min !== undefined) control.min = String(options.min);
      if (options.max !== undefined) control.max = String(options.max);
      if (options.step) control.step = String(options.step);
      if (options.maxLength) control.maxLength = options.maxLength;
      control.addEventListener('input', function () { setDraft(key, control.value); });
      return control;
    }
    function checkbox(copy, checked, key, disabled) {
      var label = el('label', 'pw-check');
      var input = el('input'); input.type = 'checkbox'; input.checked = !!checked; input.dataset.pwFocus = key; input.disabled = !!disabled;
      input.addEventListener('change', function () { setDraft(key, input.checked); render(); });
      label.append(input, el('span', '', copy)); return label;
    }
    function makeRadio(copy, description, value) {
      var label = el('label', 'pw-mode-option');
      var control = el('input'); control.type = 'radio'; control.name = 'project-watch-mode-' + contextKey.replace(/[^a-z0-9]/gi, '-'); control.value = value; control.checked = draft.mode === value; control.dataset.pwFocus = 'mode-' + value;
      control.addEventListener('change', function () { if (control.checked) { setDraft('mode', value); if (value !== 'advance') setDraft('memberBotIds', []); render(); } });
      var body = el('span', 'pw-mode-copy'); body.append(el('strong', '', copy), el('span', '', description)); label.append(control, body); return label;
    }
    function addSelection(input, list, value) {
      var has = list.indexOf(value) >= 0;
      if (input.checked && !has) list.push(value);
      else if (!input.checked && has) list.splice(list.indexOf(value), 1);
    }
    function renderTaskPicker(form) {
      var section = el('fieldset', 'pw-choice-group'); section.append(el('legend', '', tr('选择已有可执行任务', 'Choose existing executable tasks')));
      var tasks = availableTasks();
      if (!tasks.length) section.append(el('p', 'pw-muted', tr('当前没有可按计划推进的已有任务。', 'No existing tasks are currently eligible for plan advancement.')));
      tasks.forEach(function (task) {
        var label = el('label', 'pw-choice-row'); var input = el('input'); input.type = 'checkbox'; input.checked = draft.taskIds.indexOf(String(task.id)) >= 0; input.dataset.pwFocus = 'task-' + task.id;
        input.addEventListener('change', function () {
          addSelection(input, draft.taskIds, String(task.id));
          draft.memberBotIds = draft.memberBotIds.filter(function (id) { return eligibleMembers().some(function (bot) { return String(bot.botId) === String(id); }); });
          saveDraft(); render();
        });
        var text = el('span', 'pw-choice-copy'); text.append(el('strong', '', task.goal || tr('未命名任务', 'Untitled task')), el('span', '', tr('负责人：', 'Owner: ') + botName(task.ownerBotRef)));
        label.append(input, text); section.append(label);
      });
      if (draft.taskIds.length) {
        var order = el('ol', 'pw-step-order');
        selectedTasks().forEach(function (task, index) {
          var row = el('li', 'pw-step');
          var move = el('div', 'pw-step-controls');
          var up = makeButton(tr('上移', 'Move up'), 'pw-text-button', function () { if (!index) return; var id = draft.taskIds.splice(index, 1)[0]; draft.taskIds.splice(index - 1, 0, id); saveDraft(); render(); }, 'step-up-' + task.id);
          var down = makeButton(tr('下移', 'Move down'), 'pw-text-button', function () { if (index >= draft.taskIds.length - 1) return; var id = draft.taskIds.splice(index, 1)[0]; draft.taskIds.splice(index + 1, 0, id); saveDraft(); render(); }, 'step-down-' + task.id);
          up.disabled = index === 0; down.disabled = index === draft.taskIds.length - 1; move.append(up, down);
          row.append(el('span', 'pw-step-number', String(index + 1)), el('span', 'pw-step-title', task.goal || tr('未命名任务', 'Untitled task')), move); order.append(row);
        });
        section.append(el('p', 'pw-hint', tr('按此顺序依次推进；原负责人保留。', 'Tasks advance in this order; their original owners remain responsible.')), order);
      }
      form.append(section);
    }
    function renderMemberPicker(form) {
      var section = el('fieldset', 'pw-choice-group'); section.append(el('legend', '', tr('可选候选成员 BOT', 'Eligible member BOTs')));
      selectedTasks().forEach(function (task) {
        var owner = el('p', 'pw-owner-line', (task.goal || tr('任务', 'Task')) + ' · ' + tr('负责人：', 'Owner: ') + botName(task.ownerBotRef)); section.append(owner);
      });
      var candidates = eligibleMembers();
      if (!candidates.length) section.append(el('p', 'pw-muted', tr('没有可用于所选步骤的候选成员。', 'No eligible member BOT is available for the selected steps.')));
      candidates.forEach(function (bot) {
        var label = el('label', 'pw-choice-row'); var input = el('input'); input.type = 'checkbox'; input.checked = draft.memberBotIds.indexOf(String(bot.botId)) >= 0; input.dataset.pwFocus = 'member-' + bot.botId;
        input.addEventListener('change', function () { addSelection(input, draft.memberBotIds, String(bot.botId)); saveDraft(); render(); });
        var text = el('span', 'pw-choice-copy'); text.append(el('strong', '', bot.name || bot.botId), el('span', '', tr('可用于此工程的受限执行范围', 'Available within this project’s restricted execution scope')));
        label.append(input, text); section.append(label);
      });
      form.append(section);
    }
    function renderAdvanced(form) {
      var details = el('details', 'pw-advanced');
      var summary = el('summary', '', tr('周期、重启与提醒', 'Schedule, restart and notifications'));
      details.append(summary);
      details.append(el('p', 'pw-hint', tr('仅在 Bot Studio 运行时持续检查；重新打开后，按重启授权恢复自动推进。', 'Checks run only while Bot Studio is open. After reopening, automatic advancement resumes according to its restart authorization.')));
      var schedule = el('div', 'pw-inline-fields');
      schedule.append(fieldLabel(tr('检查间隔（分钟）', 'Check interval (minutes)'), textControl('intervalMinutes', draft.intervalMinutes, { type: 'number', min: 1, step: 1 })));
      schedule.append(fieldLabel(tr('无进展后重新评估（分钟）', 'Reassess after no progress (minutes)'), textControl('stalledMinutes', draft.stalledMinutes, { type: 'number', min: 1, step: 1 })));
      details.append(schedule);
      details.append(fieldLabel(tr('验收标准（可选）', 'Acceptance criteria (optional)'), textControl('criteria', draft.criteria, { multiline: true, placeholder: tr('说明哪些工程状态或结果值得提醒', 'Describe which project state or result matters for notifications'), maxLength: 4000 })));
      details.append(checkbox(tr('应用重启后按本合同继续', 'Continue under this contract after app restart'), draft.restartAllowed, 'restartAllowed'));
      details.append(checkbox(tr('允许发送关注提醒', 'Allow watch notifications'), draft.notificationsEnabled, 'notificationsEnabled'));
      var quiet = el('div', 'pw-quiet-hours'); quiet.append(checkbox(tr('设置免打扰时段', 'Set quiet hours'), draft.quietEnabled, 'quietEnabled'));
      if (draft.quietEnabled) {
        var hours = el('div', 'pw-inline-fields');
        hours.append(fieldLabel(tr('开始时刻（本地小时）', 'Start hour (local time)'), textControl('quietStart', draft.quietStart, { type: 'number', min: 0, max: 23, step: 1 })));
        hours.append(fieldLabel(tr('结束时刻（本地小时）', 'End hour (local time)'), textControl('quietEnd', draft.quietEnd, { type: 'number', min: 0, max: 23, step: 1 })));
        quiet.append(hours, el('p', 'pw-hint', tr('时区：', 'Time zone: ') + draft.timeZone));
      }
      details.append(quiet); form.append(details);
    }
    function budgetBlock(form) {
      var budget = context && context.rootBudget;
      var section = el('section', 'pw-budget'); section.append(el('h4', '', tr('本关注期的执行预算上限', 'Execution budget for this watch period')));
      if (!budget || !Number.isSafeInteger(Number(budget.modelRequests)) || !Number.isSafeInteger(Number(budget.toolCalls))) {
        section.append(el('p', 'pw-error-copy', tr('宿主未提供可强制的请求与工具调用上限，按计划推进暂不可用。', 'The host has not provided enforceable request and tool limits. Plan advancement is unavailable.')));
        form.append(section); return;
      }
      var controls = el('div', 'pw-inline-fields');
      controls.append(fieldLabel(tr('最多模型请求', 'Model request cap'), textControl('modelRequests', draft.modelRequests, { type: 'number', min: 0, max: budget.modelRequests, step: 1 })));
      controls.append(fieldLabel(tr('最多工具调用', 'Tool call cap'), textControl('toolCalls', draft.toolCalls, { type: 'number', min: 0, max: budget.toolCalls, step: 1 })));
      section.append(controls, el('p', 'pw-hint', tr('默认上限来自当前执行策略；可调低，不能调高。', 'Defaults come from the current execution policy. You can lower them, not raise them.')));
      form.append(section);
    }
    function renderForm() {
      draft = draftForContext();
      var form = el('form', 'pw-form');
      var titleRow = el('div', 'pw-section-heading'); titleRow.append(el('h3', '', tr('开启工程关注', 'Start project watch')));
      titleRow.append(makeButton(tr('取消', 'Cancel'), 'pw-text-button', function () { state.showForm = false; state.error = ''; render(); }, 'cancel-watch-form'));
      form.append(titleRow);
      var supervisors = eligibleSupervisors();
      var supervisor = el('select', 'pw-control'); supervisor.id = 'project-watch-supervisor'; supervisor.dataset.pwFocus = 'supervisorBotId';
      var placeholder = el('option', '', tr('选择工程内可用的 Supervisor BOT', 'Choose an available Supervisor BOT')); placeholder.value = ''; supervisor.append(placeholder);
      supervisors.forEach(function (bot) { var option = el('option', '', bot.name || bot.botId); option.value = String(bot.botId); supervisor.append(option); });
      supervisor.value = draft.supervisorBotId; supervisor.addEventListener('change', function () { setDraft('supervisorBotId', supervisor.value); draft.memberBotIds = []; saveDraft(); render(); });
      form.append(fieldLabel(tr('Supervisor BOT', 'Supervisor BOT'), supervisor));
      if (!supervisors.length) form.append(el('p', 'pw-error-copy', tr('当前工程没有满足 Supervisor 条件的 BOT。', 'No BOT in this project currently meets the Supervisor requirements.')));
      form.append(fieldLabel(tr('关注目标', 'Watch objective'), textControl('objective', draft.objective, { multiline: true, placeholder: tr('描述希望 Supervisor 持续关注的工程结果', 'Describe the project outcome for the Supervisor to watch'), maxLength: 8000 })));
      var modes = el('fieldset', 'pw-mode-group'); modes.append(el('legend', '', tr('授权方式', 'Permission mode')));
      modes.append(makeRadio(tr('关注并提醒', 'Watch and notify'), tr('读取已授权的工程状态并提醒；不启动执行 BOT。', 'Read authorized project state and notify you; no execution BOT is started.'), 'observe'));
      var advance = makeRadio(tr('按已授权计划推进', 'Advance the approved plan'), tr('仅推进下面明确选择的已有任务，并沿用原负责人、检查和人工验收。', 'Advance only the selected existing tasks, preserving their owners, checks and human acceptance.'), 'advance');
      if (!availableTasks().length || !eligibleMembers().length || !validBudget()) advance.querySelector('input').disabled = true;
      modes.append(advance); form.append(modes);
      if (draft.mode === 'advance') {
        renderTaskPicker(form);
        renderMemberPicker(form);
        budgetBlock(form);
        form.append(el('p', 'pw-context-summary', tr('上下文范围：只请求当前工程和所选任务目标；本次不开通会话或文件正文。宿主将在开启时重新核验成员、权限与受限执行范围。', 'Context scope: current project and selected task goals only; no conversation or file bodies are requested. The host will recheck membership, permission and restricted execution scope when you start.')));
      } else {
        form.append(el('p', 'pw-context-summary', tr('范围：读取当前工程状态与任务目标；不会读取会话正文，也不会启动执行 BOT。', 'Scope: read project state and task goals; conversation bodies are not read and no execution BOT is started.')));
      }
      var length = el('select', 'pw-control'); length.id = 'project-watch-expiry'; length.dataset.pwFocus = 'expiresDays';
      [['1', tr('1 天', '1 day')], ['3', tr('3 天', '3 days')], ['7', tr('7 天', '7 days')], ['14', tr('14 天', '14 days')]].forEach(function (item) { var option = el('option', '', item[1]); option.value = item[0]; length.append(option); });
      length.value = draft.expiresDays; length.addEventListener('change', function () { setDraft('expiresDays', length.value); });
      form.append(fieldLabel(tr('关注期限', 'Watch period'), length));
      renderAdvanced(form);
      var actions = el('div', 'pw-form-actions');
      var submit = makeButton(draft.mode === 'advance' ? tr('开启并授权按计划推进', 'Start and authorize approved plan advancement') : tr('开启关注并提醒', 'Start watching and notifying'), 'pw-button pw-primary', null, 'start-project-watch');
      submit.disabled = !formValid() || state.loading || !supervisors.length;
      submit.addEventListener('click', function () { if (typeof form.requestSubmit === 'function') form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
      actions.append(submit); form.append(actions);
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!formValid()) return;
        var now = Date.now(), payload = {
          supervisorBotId: draft.supervisorBotId, objective: draft.objective.trim(), criteria: draft.criteria.trim() ? [draft.criteria.trim()] : [], mode: draft.mode,
          taskIds: draft.mode === 'advance' ? draft.taskIds.slice() : [], memberBotIds: draft.mode === 'advance' ? draft.memberBotIds.slice() : [], contextRefs: [],
          expiresAt: now + Number(draft.expiresDays) * DAY, intervalMs: Number(draft.intervalMinutes) * 60 * 1000,
          stalledAfterMs: Number(draft.stalledMinutes) * 60 * 1000, restartAllowed: !!draft.restartAllowed,
          notificationsEnabled: !!draft.notificationsEnabled
        };
        if (draft.mode === 'advance') payload.rootBudget = { modelRequests: Number(draft.modelRequests), toolCalls: Number(draft.toolCalls) };
        if (draft.quietEnabled) payload.quietHours = { startHour: Number(draft.quietStart), endHour: Number(draft.quietEnd), timeZone: draft.timeZone };
        command('create', payload);
      });
      return form;
    }
    function renderWatch() {
      var wrap = el('section', 'pw-root');
      wrap.setAttribute('aria-label', tr('Supervisor 工程关注', 'Supervisor project watch'));
      var scope = currentScope();
      if (scope) { wrap.dataset.pwSpaceId = scope.spaceId; wrap.dataset.pwScopeRevision = String(scope.scopeRevision); }
      if (context && context.projectId) wrap.dataset.pwProjectId = String(context.projectId);
      if (state.unsupported) {
        wrap.append(el('p', 'pw-muted', tr('当前版本未提供工程关注接口。', 'This version does not provide project watch.')));
        return wrap;
      }
      var watch = state.watch;
      if (state.loading && !watch) { wrap.append(el('p', 'pw-muted', tr('正在读取关注状态…', 'Loading watch state…'))); return wrap; }
      if (!watch) {
        var empty = el('div', 'pw-summary-row');
        var copy = el('div', 'pw-summary-copy'); copy.append(el('strong', '', state.readFailed ? tr('关注状态暂不可用', 'Watch state unavailable') : tr('Supervisor 持续关注', 'Supervisor project watch')), el('span', '', state.readFailed ? tr('读取失败前不会假定关注已关闭。', 'The watch is not assumed off when its state cannot be read.') : state.loading ? tr('正在核对工程状态…', 'Checking project state…') : tr('当前工程尚未开启关注。', 'This project is not being watched.')));
        var start = makeButton(tr('开启', 'Start'), 'pw-button pw-primary', function () { state.showForm = true; state.error = ''; draft = draftForContext(); render(); }, 'open-watch-form');
        start.disabled = state.loading || state.readFailed || !hasCommandApi() || state.busy; empty.append(copy, start);
        if (state.readFailed) empty.append(makeButton(tr('重试读取', 'Retry'), 'pw-button', refresh, 'retry-watch-state'));
        wrap.append(empty);
      } else {
        wrap.dataset.pwWatchId = String(watch.watchId || watch.id || '');
        var summary = el('div', 'pw-summary-row');
        var identity = el('div', 'pw-summary-copy');
        identity.append(el('strong', '', tr('Supervisor 关注：', 'Supervisor watch: ') + statusCopy(watch)));
        identity.append(el('span', '', phaseCopy(watch)));
        var buttons = el('div', 'pw-actions');
        if (!isTerminal(watch)) {
          if (watch.status === 'paused') buttons.append(makeButton(tr('继续关注', 'Resume'), 'pw-button', function () { command('resume'); }, 'resume-watch'));
          else if (watch.status === 'needs_user') buttons.append(makeButton(tr('重新核查', 'Recheck'), 'pw-button', function () { command('resolve'); }, 'resolve-watch'));
          else if (watch.status !== 'expired') buttons.append(makeButton(tr('暂停', 'Pause'), 'pw-button', function () { command('pause'); }, 'pause-watch'));
          buttons.append(makeButton(tr('停止关注', 'Stop watch'), 'pw-button pw-danger', function () { command('stop'); }, 'stop-watch'));
          Array.prototype.forEach.call(buttons.querySelectorAll('button'), function (button) { button.disabled = state.busy; });
        }
        buttons.append(makeButton(state.expanded ? tr('收起详情', 'Hide details') : tr('关注详情', 'Watch details'), 'pw-text-button', function () { state.expanded = !state.expanded; render(); }, 'toggle-watch-details'));
        summary.append(identity, buttons); wrap.append(summary);
        var metadata = el('div', 'pw-meta');
        metadata.append(el('span', '', tr('最近检查：', 'Last check: ') + showDate(watch.lastObservedAt)));
        metadata.append(el('span', '', tr('下次检查：', 'Next check: ') + showDate(watch.nextCheckAt)));
        if (watch.mode === 'advance') metadata.append(el('span', '', tr('预算：模型 ', 'Budget: model ') + budgetText(watch.budget, watch.rootBudget || watch.budget && watch.budget.rootLimits, 'modelRequests') + tr('，工具 ', ', tools ') + budgetText(watch.budget, watch.rootBudget || watch.budget && watch.budget.rootLimits, 'toolCalls')));
        else metadata.append(el('span', '', tr('执行预算：不分派 BOT', 'Execution budget: no BOT dispatch')));
        wrap.append(metadata);
        if (watch.decision && watch.decision.message) {
          var decision = el('p', 'pw-decision', watch.decision.message); decision.setAttribute('role', 'status'); wrap.append(decision);
        }
        if (state.expanded) wrap.append(renderDetails(watch));
        if (isTerminal(watch) && !state.showForm) {
          var restartRow = el('div', 'pw-restart-row');
          restartRow.append(makeButton(tr('开启新的工程关注', 'Start a new project watch'), 'pw-button', function () { state.showForm = true; state.error = ''; draft = draftForContext(); render(); }, 'open-new-watch-form'));
          wrap.append(restartRow);
        }
      }
      if (state.showForm && (!watch || isTerminal(watch)) && !state.readFailed) wrap.append(renderForm());
      if (state.error) { var error = el('p', 'pw-error', state.error); error.setAttribute('role', 'alert'); wrap.append(error); }
      if (state.notice) { var notice = el('p', 'pw-notice' + (state.noticeTone === 'warning' ? ' is-warning' : ''), state.notice); notice.setAttribute('role', 'status'); wrap.append(notice); }
      return wrap;
    }
    function renderDetails(watch) {
      var section = el('div', 'pw-details');
      section.append(el('p', 'pw-detail-objective', watch.objective || tr('未提供关注目标。', 'No watch objective was provided.')));
      var owners = (watch.steps || []).map(function (step) {
        var task = (context && context.tasks || []).find(function (item) { return String(item.id) === String(step.taskId); });
        return task ? (task.goal || tr('任务', 'Task')) + ' · ' + tr('负责人：', 'Owner: ') + botName(task.ownerBotRef) : '';
      }).filter(Boolean);
      if (owners.length) section.append(el('p', 'pw-detail-scope', tr('获准步骤与负责人：', 'Approved steps and owners: ') + owners.join('；')));
      if (watch.allowedBotIds && Array.isArray(watch.allowedBotIds)) {
        var members = watch.allowedBotIds.map(function (id) { return botName(id); });
        section.append(el('p', 'pw-detail-scope', tr('允许使用的 BOT：', 'Allowed BOTs: ') + members.join('、')));
      }
      section.append(el('p', 'pw-detail-scope', tr('期限：', 'Expires: ') + showDate(watch.expiresAt) + ' · ' + tr('重启继续：', 'Resume after restart: ') + (watch.restartAllowed ? tr('允许', 'Yes') : tr('不允许', 'No'))));
      if (watch.budget) section.append(el('p', 'pw-detail-scope', tr('已用预算：', 'Budget used: ') + budgetText(watch.budget, watch.rootBudget || watch.budget.rootLimits, 'modelRequests') + tr(' 次模型请求，', ' model requests, ') + budgetText(watch.budget, watch.rootBudget || watch.budget.rootLimits, 'toolCalls') + tr(' 次工具调用。', ' tool calls.')));
      var actions = watch.actions && typeof watch.actions === 'object' ? Object.values(watch.actions) : [];
      var unresolved = actions.filter(function (action) { return ['intent', 'unknown', 'cancel_unknown', 'admitted'].indexOf(action.status) >= 0; }).length;
      if (unresolved) section.append(el('p', 'pw-error-copy', tr('仍有 ', 'There are ') + unresolved + tr(' 项既有执行需要核查；重新授权前会先核对。', ' existing execution(s) to reconcile before any new authorization.')));
      return section;
    }
    function render() {
      if (!mountNode || destroyed) return;
      replaceContent(renderWatch());
    }
    function mount(container, nextContext) {
      mountNode = container || null;
      if (destroyed) return;
      if (!mountNode) { unmount(); return; }
      var scope = currentScope();
      var next = Object.assign({}, nextContext || {});
      next.projectId = String(next.projectId || '');
      var nextKey = makeKey(scope, next.projectId);
      var cachedHostOptions = hostOptionsByKey[nextKey];
      if (cachedHostOptions) Object.assign(next, cachedHostOptions);
      context = next;
      if (nextKey !== contextKey) {
        generation++; readEpoch++; commandEpoch++; eventEpoch++;
        contextKey = nextKey;
        state.data = null; state.watch = null; state.error = ''; state.readFailed = false; state.notice = ''; state.loading = !!next.projectId; state.showForm = false; state.expanded = false; state.busy = false; state.unsupported = false;
        draft = draftForContext();
        render();
        if (next.projectId) refresh();
      } else {
        render();
        // renderEngineering can remount this control during its own refreshes.
        // Revalidate against the host instead of losing host-only eligibility
        // fields to the less-specific collaboration projection passed by it.
        if (next.projectId) refresh();
      }
      syncSubscriptions();
    }
    function unmount() {
      generation++; readEpoch++; commandEpoch++; eventEpoch++;
      mountNode = null; context = null; contextKey = '';
      state.data = null; state.watch = null; state.error = ''; state.readFailed = false; state.notice = ''; state.loading = false; state.showForm = false; state.expanded = false; state.busy = false; state.unsupported = false;
    }
    function openProject(event) {
      var scope = currentScope();
      if (!scope || !event || String(event.spaceId || '') !== scope.spaceId || (event.scopeRevision !== undefined && String(event.scopeRevision) !== String(scope.scopeRevision))) return;
      onOpenProjectWatch(event);
    }
    function destroy() {
      if (destroyed) return;
      destroyed = true; generation++; readEpoch++; commandEpoch++; eventEpoch++;
      if (typeof offChanged === 'function') { try { offChanged(); } catch (_) { } }
      if (typeof offOpen === 'function') { try { offOpen(); } catch (_) { } }
      offChanged = null; offOpen = null;
      if (mountNode) mountNode.replaceChildren();
      mountNode = null; context = null;
    }
    syncSubscriptions();
    return { mount: mount, unmount: unmount, refresh: refresh, openProject: openProject, handleScopeChange: function () { unmount(); }, destroy: destroy };
  }

  function openProjectWatch(detail) {
    if (!detail || !detail.spaceId || !detail.projectId) return false;
    var event;
    try { event = new root.CustomEvent('openbot-project-watch-open', { detail: detail }); }
    catch (_) { event = root.document.createEvent('CustomEvent'); event.initCustomEvent('openbot-project-watch-open', false, false, detail); }
    root.dispatchEvent(event); return true;
  }
  root.OpenBotProjectWatch = { create: create, openProjectWatch: openProjectWatch };
})(window);
