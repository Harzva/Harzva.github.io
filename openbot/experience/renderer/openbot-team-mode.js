(function (root) {
  'use strict';

  /*
   * Human / AI handoff is a small owner-operated surface on top of the native
   * organization bridge. It does not create Bots, accounts, HTTP endpoints,
   * or a second chat store. Every employee, task, group message, and memory
   * still resolves through the existing native organization services.
   */
  var bridge = null;
  var onOpenSpaces = null;
  var onOrganizationState = null;
  var initialized = false;
  var open = false;
  var lifeEpoch = 0;
  var stateEpoch = 0;
  var chatEpoch = 0;
  var chatRequestEpoch = 0;
  var memoryEpoch = 0;
  var memoryRequestEpoch = 0;
  var composing = false;
  var refreshQueued = false;
  var focusBefore = null;
  var activeTab = 'tasks';
  var selectedSpaceId = '';
  var chatTargetBySpace = Object.create(null);
  var chatActorBySpace = Object.create(null);
  var memoryBotBySpace = Object.create(null);
  var state = { revision: 0, employees: [], tasks: [], organization: { bots: [], spaces: [], instances: [] } };
  var rawOrganization = null;
  var chatPane = null;
  var chatLoading = false;
  var chatRun = null;
  var memoryPane = null;
  var memoryLoading = false;
  var taskCreateOpen = false;
  var taskActions = Object.create(null);
  var employeeActions = Object.create(null);
  var memoryActionBusy = false;
  var taskDrafts = Object.create(null);
  var chatDrafts = Object.create(null);
  var completeDrafts = Object.create(null);
  var memoryDrafts = Object.create(null);
  var employeeDrafts = Object.create(null);
  var dom = Object.create(null);
  var unsubscribeTeam = null;
  var unsubscribeOrg = null;

  function tr(zh, en, params) {
    return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function' ? root.OpenBotI18n.t(zh, en, params) : zh;
  }
  function text(value, fallback) {
    if (value === undefined || value === null) return fallback === undefined ? '' : String(fallback);
    return String(value);
  }
  function id(value) { return value === undefined || value === null ? '' : String(value); }
  function make(tag, className, value) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = text(value);
    return node;
  }
  function button(idValue, className, value) {
    var node = make('button', className, value);
    node.type = 'button';
    if (idValue) node.id = idValue;
    return node;
  }
  function labelFor(input, value) {
    var label = make('label', '', value);
    if (input && input.id) label.htmlFor = input.id;
    return label;
  }
  function safeError(error) { return text(error && error.message, error || tr('请求失败。', 'Request failed.')); }
  function uid() {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    return 'team-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }
  function call(name, payload) {
    if (!bridge || typeof bridge[name] !== 'function') {
      return Promise.reject(new Error(tr('本人 / AI 接班服务尚未连接，请重新打开。', 'Human / AI handoff is disconnected. Reopen it.')));
    }
    var result;
    try { result = bridge[name](payload || {}); } catch (error) { return Promise.reject(error); }
    return Promise.resolve(result).then(function (value) {
      if (value && value.ok === false) {
        var error = new Error(value.message || tr('本人 / AI 接班请求失败。', 'Human / AI handoff request failed.'));
        if (value.code) error.code = value.code;
        throw error;
      }
      return value;
    });
  }
  function live(ticket) { return open && ticket === lifeEpoch; }
  function slug(value) { return id(value).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80) || 'item'; }
  function displayName(value, fallback) { return text(value || fallback || tr('未命名', 'Untitled')); }

  function normalizeOrganization(value) {
    var raw = value && typeof value === 'object' ? value : {};
    var bots = Array.isArray(raw.bots) ? raw.bots : [];
    var spaces = Array.isArray(raw.spaces) ? raw.spaces : [];
    return {
      organizationRevision: Number.isSafeInteger(raw.organizationRevision) ? raw.organizationRevision : 0,
      primaryBotId: id(raw.primaryBotId),
      bots: bots.filter(function (bot) { return bot && id(bot.id); }).map(function (bot) {
        return { id: id(bot.id), name: displayName(bot.name, bot.id), avatar: text(bot.avatar), color: text(bot.color), model: text(bot.model), unsupportedReason: text(bot.unsupportedReason) };
      }),
      spaces: spaces.filter(function (space) { return space && id(space.id); }).map(function (space) {
        var members = Array.isArray(space.memberBotIds) ? space.memberBotIds.map(id) : (Array.isArray(space.botIds) ? space.botIds.map(id) : []);
        return { id: id(space.id), name: displayName(space.name, space.id), memberBotIds: members, leaderBotId: id(space.leaderBotId), groupConversationId: id(space.groupConversationId) };
      }),
      instances: Array.isArray(raw.instances) ? raw.instances : []
    };
  }
  function normalizeEmployee(value) {
    var item = value && typeof value === 'object' ? value : {};
    return { botId: id(item.botId), name: displayName(item.name, item.botId), mode: item.mode === 'ai' ? 'ai' : 'human', available: item.available !== false, unavailableReason: text(item.unavailableReason) };
  }
  function normalizeTask(value) {
    var item = value && typeof value === 'object' ? value : {};
    return { id: id(item.id), spaceId: id(item.spaceId), title: text(item.title), description: text(item.description), assigneeBotId: item.assigneeBotId === null || item.assigneeBotId === undefined ? null : id(item.assigneeBotId), operatorType: item.operatorType === 'ai' ? 'ai' : 'human', status: text(item.status, 'open'), result: text(item.result), error: text(item.error), runId: item.runId ? id(item.runId) : '', requestId: item.requestId ? id(item.requestId) : '', createdAt: item.createdAt, updatedAt: item.updatedAt, sharedMemoryId: item.sharedMemoryId ? id(item.sharedMemoryId) : '' };
  }
  function normalizeState(value) {
    var raw = value && typeof value === 'object' ? value : {};
    rawOrganization = raw.organization && typeof raw.organization === 'object' ? raw.organization : null;
    return {
      revision: Number.isSafeInteger(raw.revision) ? raw.revision : 0,
      employees: Array.isArray(raw.employees) ? raw.employees.map(normalizeEmployee).filter(function (item) { return item.botId; }) : [],
      tasks: Array.isArray(raw.tasks) ? raw.tasks.map(normalizeTask).filter(function (item) { return item.id; }) : [],
      organization: normalizeOrganization(rawOrganization)
    };
  }
  function organizationBots() { return state.organization && Array.isArray(state.organization.bots) ? state.organization.bots : []; }
  function organizationSpaces() { return state.organization && Array.isArray(state.organization.spaces) ? state.organization.spaces : []; }
  function employeeFor(botId) {
    var key = id(botId);
    for (var i = 0; i < state.employees.length; i++) if (state.employees[i].botId === key) return state.employees[i];
    return null;
  }
  function botFor(botId) {
    var key = id(botId);
    for (var i = 0; i < organizationBots().length; i++) if (organizationBots()[i].id === key) return organizationBots()[i];
    return null;
  }
  function spaceFor(spaceId) {
    var key = id(spaceId);
    for (var i = 0; i < organizationSpaces().length; i++) if (organizationSpaces()[i].id === key) return organizationSpaces()[i];
    return null;
  }
  function currentSpace() { return spaceFor(selectedSpaceId); }
  function spaceMembers(space) { return space && Array.isArray(space.memberBotIds) ? space.memberBotIds : []; }
  function memberEmployees(space, includeUnavailable) {
    var members = spaceMembers(space);
    return state.employees.filter(function (employee) { return members.indexOf(employee.botId) >= 0 && (includeUnavailable || employee.available); });
  }
  function employeeName(botId) {
    var employee = employeeFor(botId), bot = botFor(botId);
    return employee ? employee.name : bot ? bot.name : tr('未指定', 'Unassigned');
  }
  function spaceLabel(space) {
    return space ? space.name : tr('请选择空间', 'Choose a space');
  }
  function statusLabel(value) {
    return ({ open: tr('待接取', 'Open'), claimed: tr('已接取', 'Claimed'), running: tr('执行中', 'Running'), review: tr('待验收', 'Needs review'), done: tr('已完成', 'Completed'), failed: tr('失败', 'Failed') })[value] || text(value);
  }
  function modeLabel(value) { return value === 'ai' ? tr('AI 接班', 'AI handoff') : tr('本人处理', 'Human'); }
  function statusClass(value) { return 'team-status team-status-' + slug(value); }
  function formatTime(value) {
    if (!value) return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    try { return date.toLocaleTimeString(root.OpenBotI18n ? root.OpenBotI18n.locale : 'zh-CN', { hour: '2-digit', minute: '2-digit' }); } catch (_) { return ''; }
  }

  function captureFocus() {
    var active = root.document.activeElement;
    if (!active || !dom.dialog || !dom.dialog.contains(active)) return null;
    var record = { id: active.id || '', key: active.dataset && active.dataset.teamFocusKey ? active.dataset.teamFocusKey : '', start: typeof active.selectionStart === 'number' ? active.selectionStart : null, end: typeof active.selectionEnd === 'number' ? active.selectionEnd : null };
    return record.id || record.key ? record : null;
  }
  function restoreFocus(record) {
    if (!record) return;
    var target = record.id ? root.document.getElementById(record.id) : null;
    if (!target && record.key && dom.dialog) {
      var candidates = dom.dialog.querySelectorAll('[data-team-focus-key]');
      for (var i = 0; i < candidates.length; i++) if (candidates[i].dataset.teamFocusKey === record.key) { target = candidates[i]; break; }
    }
    if (!target || target.disabled) return;
    setTimeout(function () {
      try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
      if (record.start !== null && typeof target.setSelectionRange === 'function') {
        try { target.setSelectionRange(record.start, record.end); } catch (_) { }
      }
    }, 0);
  }
  function rememberTaskDraft(spaceId, title, description, assigneeBotId) {
    var key = id(spaceId); taskDrafts[key] = { title: text(title), description: text(description), assigneeBotId: id(assigneeBotId) };
  }
  function taskDraft(spaceId) { return taskDrafts[id(spaceId)] || { title: '', description: '', assigneeBotId: '' }; }
  function chatDraft(spaceId) { return chatDrafts[id(spaceId)] || ''; }
  function memoryDraft(spaceId, botId) {
    var key = id(spaceId) + '|' + id(botId);
    if (!memoryDrafts[key]) memoryDrafts[key] = { text: '', kind: 'bot-space' };
    return memoryDrafts[key];
  }
  function employeeDraft(botId, record) {
    var key = id(botId);
    if (!employeeDrafts[key]) employeeDrafts[key] = { dirtyName: false, dirtyMode: false };
    var draft = employeeDrafts[key];
    if (!draft.dirtyName) draft.name = text(record && record.name);
    if (!draft.dirtyMode) draft.mode = record && record.mode === 'ai' ? 'ai' : 'human';
    return draft;
  }

  function ensureSelection() {
    var spaces = organizationSpaces();
    if (!spaces.length) { selectedSpaceId = ''; return; }
    if (!spaceFor(selectedSpaceId)) selectedSpaceId = spaces[0].id;
    var space = currentSpace();
    var members = memberEmployees(space, true);
    if (!members.length) members = state.employees.filter(function (employee) { return spaceMembers(space).indexOf(employee.botId) >= 0; });
    if (!chatTargetBySpace[space.id] || !members.some(function (item) { return item.botId === chatTargetBySpace[space.id] && item.mode === 'ai'; })) {
      var ai = members.filter(function (item) { return item.mode === 'ai'; })[0];
      chatTargetBySpace[space.id] = ai ? ai.botId : members[0] ? members[0].botId : '';
    }
    if (!chatActorBySpace[space.id] || !members.some(function (item) { return item.botId === chatActorBySpace[space.id]; })) chatActorBySpace[space.id] = members[0] ? members[0].botId : '';
    if (!memoryBotBySpace[space.id] || !members.some(function (item) { return item.botId === memoryBotBySpace[space.id]; })) memoryBotBySpace[space.id] = members[0] ? members[0].botId : '';
  }

  function setStatus(value, tone) {
    if (!dom.status) return;
    dom.status.textContent = value ? text(value) : '';
    if (tone) dom.status.dataset.tone = tone; else dom.status.removeAttribute('data-tone');
  }
  function notifyOrganization() {
    if (typeof onOrganizationState !== 'function' || !rawOrganization) return;
    try { onOrganizationState(rawOrganization); } catch (_) { }
  }
  function handleCompositionStart() { composing = true; }
  function handleCompositionEnd() {
    composing = false;
    if (refreshQueued) {
      refreshQueued = false;
      if (open) refreshState();
    }
  }

  function createDialog() {
    if (dom.overlay) return;
    var overlay = make('div', 'team-mode-overlay'); overlay.id = 'team-mode-dialog'; overlay.hidden = true; overlay.setAttribute('aria-hidden', 'true');
    var dialog = make('section', 'team-mode-window'); dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-labelledby', 'team-mode-title'); dialog.setAttribute('aria-describedby', 'team-mode-subtitle');
    var header = make('header', 'team-mode-header');
    var heading = make('div', 'team-mode-heading');
    var title = make('h2', 'team-mode-title', tr('本人 / AI 接班', 'Human / AI handoff')); title.id = 'team-mode-title';
    var subtitle = make('p', 'team-mode-subtitle', tr('本机拥有者为已有 BOT 维护成员档案、处理项目任务，并在本人操作与 AI 执行之间交接。此处不提供真人团队账号登录。', 'The local owner manages existing BOT profiles and project tasks, switching between manual handling and AI execution. Human team account sign-in is not available here.')); subtitle.id = 'team-mode-subtitle';
    heading.append(title, subtitle);
    var headerActions = make('div', 'team-mode-header-actions');
    var status = make('span', 'team-mode-status', ''); status.id = 'team-mode-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    var close = button('team-mode-close', 'team-mode-close', '×'); close.setAttribute('aria-label', tr('关闭本人 / AI 接班', 'Close human / AI handoff')); close.title = tr('关闭', 'Close');
    headerActions.append(status, close); header.append(heading, headerActions);

    var toolbar = make('div', 'team-mode-toolbar');
    var spaceField = make('div', 'team-mode-space-field');
    var spaceLabelNode = labelFor(null, tr('当前空间', 'Current space')); spaceLabelNode.htmlFor = 'team-space-select';
    var spaceSelect = make('select'); spaceSelect.id = 'team-space-select'; spaceSelect.setAttribute('aria-label', tr('选择当前空间', 'Choose current space'));
    var spaceAction = button('team-open-spaces', 'team-mode-secondary', tr('空间设置', 'Space settings')); spaceAction.addEventListener('click', function () { openSpaces(); });
    spaceField.append(spaceLabelNode, spaceSelect, spaceAction); toolbar.append(spaceField);

    var tabs = make('div', 'team-mode-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', tr('本人 / AI 接班页面', 'Human / AI handoff sections'));
    [['tasks', 'team-tab-tasks', tr('任务', 'Tasks')], ['people', 'team-tab-people', tr('成员 BOT', 'Member BOTs')], ['chat', 'team-tab-chat', tr('群聊', 'Group chat')], ['memory', 'team-tab-memory', tr('技能与记忆', 'Skills & memory')]].forEach(function (entry) {
      var tab = button(entry[1], 'team-mode-tab', entry[2]); tab.dataset.teamTab = entry[0]; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', 'team-panel-' + entry[0]); tab.addEventListener('click', function () { selectTab(entry[0]); }); tabs.appendChild(tab);
    });
    toolbar.append(tabs);
    var content = make('div', 'team-mode-content'); content.id = 'team-mode-content'; content.addEventListener('compositionstart', handleCompositionStart); content.addEventListener('compositionend', handleCompositionEnd);
    dialog.append(header, toolbar, content); overlay.appendChild(dialog); root.document.body.appendChild(overlay);
    overlay.addEventListener('click', function (event) { if (event.target === overlay) closeDialog(); });
    close.addEventListener('click', closeDialog);
    spaceSelect.addEventListener('change', function () { selectSpace(spaceSelect.value); });
    dom.overlay = overlay; dom.dialog = dialog; dom.content = content; dom.close = close; dom.status = status; dom.spaceSelect = spaceSelect; dom.tabs = tabs;
  }

  function renderSpaceSelect() {
    if (!dom.spaceSelect) return;
    dom.spaceSelect.replaceChildren();
    var spaces = organizationSpaces();
    if (!spaces.length) {
      var empty = make('option', '', tr('没有可用空间', 'No spaces available')); empty.value = ''; dom.spaceSelect.appendChild(empty); dom.spaceSelect.disabled = true; dom.spaceSelect.value = ''; return;
    }
    spaces.forEach(function (space) { var option = make('option', '', space.name); option.value = space.id; dom.spaceSelect.appendChild(option); });
    dom.spaceSelect.disabled = false; dom.spaceSelect.value = selectedSpaceId;
  }
  function renderTabs() {
    if (!dom.tabs) return;
    Array.prototype.forEach.call(dom.tabs.querySelectorAll('[role="tab"]'), function (tab) { var selected = tab.dataset.teamTab === activeTab; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; });
  }
  function render() {
    if (!open || !dom.content) return;
    if (composing) { refreshQueued = true; return; }
    var focus = captureFocus();
    renderSpaceSelect(); renderTabs();
    dom.content.replaceChildren(renderTab());
    restoreFocus(focus);
  }
  function renderTab() {
    if (activeTab === 'people') return renderPeople();
    if (activeTab === 'chat') return renderChat();
    if (activeTab === 'memory') return renderMemory();
    return renderTasks();
  }
  function selectTab(tab) {
    if (['tasks', 'people', 'chat', 'memory'].indexOf(tab) < 0) return;
    activeTab = tab; render();
    if (tab === 'chat') loadChat();
    if (tab === 'memory') loadMemory();
  }
  function selectSpace(spaceId) {
    var space = spaceFor(spaceId); if (!space) return;
    selectedSpaceId = space.id; ensureSelection(); chatEpoch++; memoryEpoch++; chatLoading = false; memoryLoading = false; chatPane = null; memoryPane = null; chatRun = null; taskCreateOpen = false; render();
    if (activeTab === 'chat') loadChat();
    if (activeTab === 'memory') loadMemory();
  }
  function openSpaces() {
    var selection = { spaceId: selectedSpaceId, botId: currentSpace() && currentSpace().leaderBotId ? currentSpace().leaderBotId : '' };
    closeDialog();
    if (typeof onOpenSpaces === 'function') setTimeout(function () { try { onOpenSpaces(selection); } catch (_) { } }, 0);
  }

  function emptyPanel(title, note, actionText, action) {
    var panel = make('section', 'team-empty'); panel.append(make('h3', '', title), make('p', '', note));
    if (actionText && action) { var actionButton = button('', 'team-mode-secondary', actionText); actionButton.addEventListener('click', action); panel.appendChild(actionButton); }
    return panel;
  }
  function sectionHeading(title, note, actionText, action) {
    var head = make('div', 'team-section-head'); var copy = make('div', 'team-section-copy'); copy.append(make('h3', '', title), make('p', '', note)); head.appendChild(copy);
    if (actionText && action) { var buttonNode = button('', 'team-mode-primary', actionText); buttonNode.addEventListener('click', action); head.appendChild(buttonNode); }
    return head;
  }

  function taskDraftForm(space) {
    var draft = taskDraft(space.id); var form = make('form', 'team-task-create'); form.id = 'team-task-create-form';
    var title = make('input'); title.id = 'team-task-title'; title.name = 'title'; title.required = true; title.maxLength = 160; title.placeholder = tr('例如：整理本周客户反馈', 'e.g. Summarize this week’s customer feedback'); title.value = draft.title; title.dataset.teamFocusKey = 'task-title';
    var description = make('textarea'); description.id = 'team-task-description'; description.name = 'description'; description.maxLength = 6000; description.rows = 3; description.placeholder = tr('补充任务说明（可选）', 'Add task details (optional)'); description.value = draft.description; description.dataset.teamFocusKey = 'task-description';
    var assignee = make('select'); assignee.id = 'team-task-assignee'; assignee.name = 'assigneeBotId'; assignee.dataset.teamFocusKey = 'task-assignee';
    var later = make('option', '', tr('稍后指定成员 BOT', 'Assign later')); later.value = ''; assignee.appendChild(later);
    memberEmployees(space, true).forEach(function (employee) { var option = make('option', '', employee.name + ' · ' + modeLabel(employee.mode)); option.value = employee.botId; assignee.appendChild(option); });
    assignee.value = draft.assigneeBotId || '';
    var titleField = make('div', 'team-field'); titleField.append(labelFor(title, tr('任务标题', 'Task title')), title);
    var descriptionField = make('div', 'team-field'); descriptionField.append(labelFor(description, tr('任务说明', 'Description')), description);
    var assigneeField = make('div', 'team-field'); assigneeField.append(labelFor(assignee, tr('指定成员 BOT', 'Assign member BOT')), assignee);
    var actions = make('div', 'team-form-actions'); var cancel = button('team-task-create-cancel', 'team-mode-secondary', tr('取消', 'Cancel')); cancel.addEventListener('click', function () { taskCreateOpen = false; render(); }); var submit = button('team-task-create-submit', 'team-mode-primary', tr('创建任务', 'Create task')); submit.type = 'submit'; actions.append(cancel, submit);
    form.append(titleField, descriptionField, assigneeField, actions);
    title.addEventListener('input', function () { rememberTaskDraft(space.id, title.value, description.value, assignee.value); });
    description.addEventListener('input', function () { rememberTaskDraft(space.id, title.value, description.value, assignee.value); });
    assignee.addEventListener('change', function () { rememberTaskDraft(space.id, title.value, description.value, assignee.value); });
    form.addEventListener('submit', function (event) { event.preventDefault(); createTask(space.id, title, description, assignee, submit); });
    return form;
  }
  function renderTasks() {
    var panel = make('section', 'team-panel'); panel.id = 'team-panel-tasks'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', 'team-tab-tasks');
    var space = currentSpace();
    panel.appendChild(sectionHeading(tr('团队任务', 'Team tasks'), tr('把真实工作交给本人或当前空间内已绑定的成员 BOT。', 'Assign real work to a person or a bound member BOT in the current space.'), space ? tr('新建任务', 'New task') : '', function () { taskCreateOpen = !taskCreateOpen; render(); }));
    if (!space) { panel.appendChild(make('p', 'team-inline-note', tr('开始前：先选择空间，再在“成员 BOT”页绑定现有 Bot，并在原生 Bot 设置中确认模型。', 'Before starting: choose a space, bind an existing Bot in Member BOTs, and confirm its model in native Bot settings.'))); panel.appendChild(emptyPanel(tr('先选择一个空间', 'Choose a space first'), tr('任务必须属于真实的原生空间。', 'Tasks belong to a real native space.'), tr('打开空间设置', 'Open space settings'), openSpaces)); return panel; }
    var members = memberEmployees(space, true);
    if (!members.length) panel.appendChild(make('p', 'team-inline-note team-note-warning', tr('当前空间还没有绑定成员 BOT。先在“成员 BOT”页绑定现有 Bot，并在原生 Bot 设置中确认模型。', 'No member BOT is bound to this space yet. Bind an existing Bot in Member BOTs and confirm its model in native Bot settings.')));
    if (taskCreateOpen) panel.appendChild(taskDraftForm(space));
    var list = make('div', 'team-task-list'); var tasks = state.tasks.filter(function (task) { return task.spaceId === space.id; }).sort(function (a, b) { return Number(b.createdAt || 0) - Number(a.createdAt || 0); });
    if (!tasks.length) list.appendChild(emptyPanel(tr('还没有任务', 'No tasks yet'), tr('创建一项真实工作，再决定由谁接手。', 'Create a real piece of work and decide who takes it.'), '', null));
    tasks.forEach(function (task) { list.appendChild(renderTask(task, space)); });
    panel.appendChild(list); return panel;
  }
  function renderTask(task, space) {
    var row = make('article', 'team-task-row'); row.dataset.taskId = task.id;
    var head = make('div', 'team-task-row-head'); var copy = make('div', 'team-task-copy'); copy.append(make('h4', 'team-task-title', task.title));
    var meta = make('p', 'team-task-meta', employeeName(task.assigneeBotId) + ' · ' + (task.assigneeBotId ? modeLabel(task.operatorType) : tr('未指定', 'Unassigned')) + (formatTime(task.updatedAt) ? ' · ' + formatTime(task.updatedAt) : '')); copy.appendChild(meta); head.appendChild(copy); head.appendChild(make('span', statusClass(task.status), statusLabel(task.status))); row.appendChild(head);
    if (task.description) row.appendChild(make('p', 'team-task-description', task.description));
    if (task.error) row.appendChild(make('p', 'team-task-error', task.error));
    if (task.result) { var result = make('div', 'team-task-result'); result.append(make('strong', '', tr('结果', 'Result')), make('p', '', task.result)); if (task.sharedMemoryId) result.appendChild(make('span', 'team-shared-note', tr('已明确共享到当前空间记忆', 'Explicitly shared to this space memory'))); row.appendChild(result); }
    var actions = make('div', 'team-task-actions'); renderTaskActions(actions, task, space); row.appendChild(actions); return row;
  }
  function taskActionButton(container, task, label, className, action) {
    var node = button('', className || 'team-mode-secondary', label); node.dataset.taskAction = task.id; node.disabled = !!taskActions[task.id]; node.addEventListener('click', action); container.appendChild(node); return node;
  }
  function renderTaskActions(container, task, space) {
    var assigned = employeeFor(task.assigneeBotId), fallback = memberEmployees(space, false)[0] || memberEmployees(space, true)[0];
    if (task.status === 'open') {
      var claimant = assigned || fallback;
      if (claimant) {
        taskActionButton(container, task, tr('本人接取', 'Claim for me'), 'team-mode-primary', function () { claimTask(task, claimant.botId, 'human'); });
        if (assigned && assigned.mode === 'ai') taskActionButton(container, task, tr('AI 执行', 'Run with AI'), 'team-mode-secondary', function () { claimTask(task, claimant.botId, 'ai'); });
      }
      else container.appendChild(make('span', 'team-inline-note', tr('先绑定一个空间成员。', 'Bind a space member first.')));
    } else if (task.status === 'claimed') {
      if (assigned && assigned.mode === 'ai') taskActionButton(container, task, tr('AI 执行', 'Run with AI'), 'team-mode-primary', function () { runTask(task); });
      taskActionButton(container, task, tr('停止并接回本人', 'Stop and take back'), 'team-mode-secondary', function () { stopTask(task); });
      if (task.operatorType === 'human') taskActionButton(container, task, tr('提交验收', 'Submit for review'), 'team-mode-secondary', function () { openCompleteDraft(task); });
    } else if (task.status === 'running') {
      taskActionButton(container, task, tr('停止并接回本人', 'Stop and take back'), 'team-mode-danger', function () { stopTask(task); });
    } else if (task.status === 'review') {
      taskActionButton(container, task, tr('验收结果', 'Review result'), 'team-mode-primary', function () { openCompleteDraft(task); });
    } else if (task.status === 'failed') {
      if (assigned && assigned.mode === 'ai') taskActionButton(container, task, tr('重试 AI', 'Retry AI'), 'team-mode-primary', function () { runTask(task); });
      taskActionButton(container, task, tr('重新接取', 'Claim again'), 'team-mode-secondary', function () { claimTask(task, task.assigneeBotId, 'human'); });
    }
    if (completeDrafts[task.id] !== undefined && (task.status === 'claimed' || task.status === 'review')) appendCompleteForm(container, task);
  }
  function openCompleteDraft(task) { completeDrafts[task.id] = completeDrafts[task.id] || { result: task.result || '', share: false }; render(); }
  function appendCompleteForm(container, task) {
    var draft = completeDrafts[task.id] || { result: task.result || '', share: false }; var form = make('form', 'team-complete-form'); form.dataset.taskId = task.id;
    var result = make('textarea'); result.id = 'team-task-result-' + slug(task.id); result.rows = 3; result.maxLength = 32000; result.placeholder = tr('填写可供本人核对的结果；共享时最多 8000 字。', 'Add a result for review; shared summaries are limited to 8000 characters.'); result.value = draft.result; result.dataset.teamFocusKey = 'complete-' + task.id;
    var field = make('div', 'team-field'); field.append(labelFor(result, tr('结果', 'Result')), result);
    var shareLabel = make('label', 'team-check'); var share = make('input'); share.type = 'checkbox'; share.checked = !!draft.share; share.id = 'team-task-share-' + slug(task.id); shareLabel.append(share, make('span', '', tr('明确共享到当前空间记忆', 'Explicitly share to this space memory')));
    var actions = make('div', 'team-form-actions'); var cancel = button('', 'team-mode-secondary', tr('取消', 'Cancel')); cancel.addEventListener('click', function () { delete completeDrafts[task.id]; render(); }); var submit = button('', 'team-mode-primary', tr('通过并保存', 'Approve and save')); submit.type = 'submit'; actions.append(cancel, submit); form.append(field, shareLabel, actions);
    result.addEventListener('input', function () { draft.result = result.value; }); share.addEventListener('change', function () { draft.share = share.checked; }); form.addEventListener('submit', function (event) { event.preventDefault(); completeTask(task, result, share, submit); }); container.appendChild(form);
  }
  function actionStart(taskId) { taskActions[taskId] = true; render(); }
  function actionEnd(taskId) { delete taskActions[taskId]; }
  function refreshAfterMutation(ticket, message) {
    return loadState(ticket).then(function () { if (live(ticket) && message) setStatus(message, 'ok'); });
  }
  function createTask(spaceId, title, description, assignee, submit) {
    var titleValue = title.value.trim(), descriptionValue = description.value.trim(), assigneeValue = assignee.value || '';
    if (!titleValue) { setStatus(tr('请填写任务标题。', 'Enter a task title.'), 'error'); title.focus(); return; }
    var ticket = lifeEpoch; submit.disabled = true; rememberTaskDraft(spaceId, titleValue, descriptionValue, assigneeValue); setStatus(tr('正在创建任务…', 'Creating task…'));
    call('teamTaskCreate', { spaceId: spaceId, title: titleValue, description: descriptionValue, assigneeBotId: assigneeValue || undefined }).then(function () { if (!live(ticket)) return; delete taskDrafts[spaceId]; taskCreateOpen = false; return refreshAfterMutation(ticket, tr('任务已创建。', 'Task created.')); }).catch(function (error) { if (live(ticket)) { submit.disabled = false; setStatus(tr('创建失败：', 'Could not create task: ') + safeError(error), 'error'); } });
  }
  function claimTask(task, botId, as) {
    if (!botId) return; var ticket = lifeEpoch; actionStart(task.id); setStatus(tr('正在接取任务…', 'Claiming task…'));
    call('teamTaskClaim', { taskId: task.id, botId: botId, as: as }).then(function () { if (live(ticket)) return refreshAfterMutation(ticket, as === 'ai' ? tr('任务已交给 AI 接班。', 'Task handed to AI.') : tr('任务已接回本人处理。', 'Task taken back by the owner.')); }).catch(function (error) { if (live(ticket)) setStatus(tr('接取失败：', 'Could not claim task: ') + safeError(error), 'error'); }).finally(function () { actionEnd(task.id); if (live(ticket)) render(); });
  }
  function runTask(task) {
    var ticket = lifeEpoch; actionStart(task.id); setStatus(tr('正在启动 AI 执行…', 'Starting AI execution…'));
    call('teamTaskRun', { taskId: task.id }).then(function () { if (live(ticket)) return refreshAfterMutation(ticket, tr('AI 已开始执行。', 'AI execution started.')); }).catch(function (error) { if (live(ticket)) setStatus(tr('执行失败：', 'Could not run task: ') + safeError(error), 'error'); }).finally(function () { actionEnd(task.id); if (live(ticket)) render(); });
  }
  function stopTask(task) {
    var ticket = lifeEpoch; actionStart(task.id); setStatus(tr('正在停止并接回…', 'Stopping and taking back…'));
    call('teamTaskStop', { taskId: task.id }).then(function () { if (live(ticket)) return refreshAfterMutation(ticket, tr('已停止执行，任务回到本人处理。', 'Execution stopped; task is back with the owner.')); }).catch(function (error) { if (live(ticket)) setStatus(tr('停止失败：', 'Could not stop task: ') + safeError(error), 'error'); }).finally(function () { actionEnd(task.id); if (live(ticket)) render(); });
  }
  function completeTask(task, result, share, submit) {
    var ticket = lifeEpoch, value = result.value.trim(), shareValue = !!share.checked;
    if (shareValue && (!value || value.length > 8000)) { setStatus(tr('共享结果需要填写不超过 8000 字的摘要。', 'A shared result needs a summary of 8000 characters or fewer.'), 'error'); result.focus(); return; }
    submit.disabled = true; setStatus(tr('正在保存验收结果…', 'Saving review result…'));
    var payload = { taskId: task.id, shareResult: shareValue }; if (!(task.status === 'review' && !shareValue && value === task.result.trim())) payload.result = value;
    call('teamTaskComplete', payload).then(function () { if (!live(ticket)) return; delete completeDrafts[task.id]; return refreshAfterMutation(ticket, shareValue ? tr('任务已验收并共享结果。', 'Task approved and result shared.') : tr('任务已验收。', 'Task approved.')); }).catch(function (error) { if (live(ticket)) { submit.disabled = false; setStatus(tr('验收失败：', 'Could not approve task: ') + safeError(error), 'error'); } });
  }

  function employeeRecords() {
    var records = [];
    organizationBots().forEach(function (bot) { var employee = employeeFor(bot.id); records.push(employee || { botId: bot.id, name: bot.name, mode: 'human', available: true, unavailableReason: '', bound: false }); });
    state.employees.forEach(function (employee) { if (!records.some(function (item) { return item.botId === employee.botId; })) records.push(employee); });
    return records;
  }
  function renderPeople() {
    var panel = make('section', 'team-panel'); panel.id = 'team-panel-people'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', 'team-tab-people');
    panel.appendChild(sectionHeading(tr('成员 BOT', 'Member BOTs'), tr('显示名称和接班方式绑定到已有 BOT；这些是本机成员档案，不是注册用户。', 'Display names and handoff modes belong to existing BOTs. These are local profiles, not registered users.')));
    panel.appendChild(make('p', 'team-inline-note', tr('本机拥有者负责保存成员档案；AI 已开启不等于执行器已核验。', 'The local owner saves local member profiles; enabling AI does not mean the executor is verified.')));
    var list = make('div', 'team-employee-list'); var records = employeeRecords();
    if (!records.length) list.appendChild(emptyPanel(tr('还没有可绑定的 Bot', 'No existing Bots to bind'), tr('请先在原生 Bot 设置中创建或保留一个 Bot。', 'Create or keep a Bot in native Bot settings first.'), '', null));
    records.forEach(function (record) { list.appendChild(renderEmployee(record)); }); panel.appendChild(list); return panel;
  }
  function renderEmployee(record) {
    var bound = !!employeeFor(record.botId), bot = botFor(record.botId), draft = employeeDraft(record.botId, record); var card = make('article', 'team-employee-card'); card.dataset.botId = record.botId;
    var head = make('div', 'team-employee-head'); var copy = make('div', 'team-employee-copy'); copy.append(make('h4', '', displayName(record.name, bot && bot.name)), make('p', '', bot ? (bound ? tr('已绑定现有 Bot · ', 'Bound to existing Bot · ') : tr('现有 Bot · 待绑定：', 'Existing Bot · Not bound: ')) + bot.name : tr('原生 Bot 不可用', 'Native Bot unavailable'))); head.appendChild(copy); var badge = make('span', record.available ? 'team-availability team-available' : 'team-availability team-unavailable', record.available ? tr('可用', 'Available') : tr('不可用', 'Unavailable')); head.appendChild(badge); card.appendChild(head);
    var form = make('form', 'team-employee-form'); var nameInput = make('input'); nameInput.id = 'team-employee-name-' + slug(record.botId); nameInput.name = 'name'; nameInput.maxLength = 120; nameInput.required = true; nameInput.value = draft.name; nameInput.dataset.teamFocusKey = 'employee-name-' + record.botId;
    var mode = make('select'); mode.id = 'team-employee-mode-' + slug(record.botId); mode.name = 'mode'; [['human', tr('本人处理', 'Human')], ['ai', tr('AI 接班', 'AI handoff')]].forEach(function (item) { var option = make('option', '', item[1]); option.value = item[0]; mode.appendChild(option); }); mode.value = draft.mode; mode.dataset.teamFocusKey = 'employee-mode-' + record.botId;
    var nameField = make('div', 'team-field'); nameField.append(labelFor(nameInput, tr('显示名称', 'Display name')), nameInput); var modeField = make('div', 'team-field'); modeField.append(labelFor(mode, tr('工作模式', 'Work mode')), mode);
    var actions = make('div', 'team-form-actions'); var save = button('team-employee-save-' + slug(record.botId), 'team-mode-primary', bound ? tr('保存成员档案', 'Save profile') : tr('启用接班', 'Enable handoff')); save.type = 'submit'; save.disabled = !!employeeActions[record.botId]; actions.appendChild(save); form.append(nameField, modeField, actions);
    if (!record.available && record.unavailableReason) form.appendChild(make('p', 'team-field-note team-note-warning', record.unavailableReason));
    nameInput.addEventListener('input', function () { draft.name = nameInput.value; draft.dirtyName = true; }); mode.addEventListener('change', function () { draft.mode = mode.value; draft.dirtyMode = true; }); form.addEventListener('submit', function (event) { event.preventDefault(); saveEmployee(record, nameInput, mode, save); }); card.appendChild(form); return card;
  }
  function saveEmployee(record, nameInput, mode, save) {
    var botId = id(record.botId), rawName = nameInput.value, name = rawName.trim(), modeValue = mode.value; if (!name) { setStatus(tr('请填写显示名称。', 'Enter a display name.'), 'error'); nameInput.focus(); return; }
    var ticket = lifeEpoch; employeeActions[record.botId] = true; save.disabled = true; setStatus(tr('正在保存成员档案…', 'Saving local member profile…'));
    call('teamEmployeeSave', { botId: botId, name: name, mode: modeValue, expectedRevision: state.revision }).then(function () {
      var draft = employeeDrafts[botId];
      if (draft) {
        if (draft.name === rawName) draft.dirtyName = false;
        if (draft.mode === modeValue) draft.dirtyMode = false;
        if (!draft.dirtyName && !draft.dirtyMode) delete employeeDrafts[botId];
      }
      if (live(ticket)) return refreshAfterMutation(ticket, tr('成员档案已保存。', 'Member profile saved.'));
    }).catch(function (error) { if (live(ticket)) { save.disabled = false; setStatus(tr('保存失败：', 'Could not save employee: ') + safeError(error), 'error'); } }).finally(function () { delete employeeActions[botId]; if (live(ticket)) render(); });
  }

  function normalizePane(value) {
    var raw = value && typeof value === 'object' ? value : {};
    return { messages: Array.isArray(raw.messages) ? raw.messages.filter(Boolean) : [], runs: Array.isArray(raw.runs) ? raw.runs.filter(Boolean) : [], memories: Array.isArray(raw.memories) ? raw.memories.filter(function (item) { return item && item.deleted !== true; }) : [] };
  }
  function currentChatTarget() { var space = currentSpace(); return space ? id(chatTargetBySpace[space.id]) : ''; }
  function currentChatActor() { var space = currentSpace(); return space ? id(chatActorBySpace[space.id]) : ''; }
  function currentChatBot() { return currentChatTarget() || currentChatActor(); }
  function currentMemoryBot() { var space = currentSpace(); return space ? id(memoryBotBySpace[space.id]) : ''; }
  function chatContextMatches(ticket, source) { return !!source && live(ticket) && chatEpoch === source.epoch && selectedSpaceId === source.spaceId && currentChatBot() === (source.viewBotId || source.botId); }
  function memoryContextMatches(ticket, source) { return !!source && live(ticket) && memoryEpoch === source.epoch && selectedSpaceId === source.spaceId && currentMemoryBot() === source.botId; }
  function renderChat() {
    var panel = make('section', 'team-panel team-chat-panel'); panel.id = 'team-panel-chat'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', 'team-tab-chat'); var space = currentSpace();
    panel.appendChild(sectionHeading(tr('团队群聊', 'Team group chat'), tr('真人消息和成员 BOT 回复会进入当前原生空间。群聊内容对当前空间成员可见。', 'Human messages and member BOT replies stay in the current native space. Group chat is visible to members of this space.')));
    if (!space) { panel.appendChild(emptyPanel(tr('先选择一个空间', 'Choose a space first'), tr('群聊必须属于真实的原生空间。', 'Group chat belongs to a real native space.'), tr('打开空间设置', 'Open space settings'), openSpaces)); return panel; }
    var members = memberEmployees(space, true); var aiMembers = members.filter(function (employee) { return employee.mode === 'ai'; });
    var controls = make('div', 'team-chat-controls');
    var target = make('select'); target.id = 'team-chat-target'; target.setAttribute('aria-label', tr('选择回复成员 BOT', 'Choose member BOT for reply')); aiMembers.forEach(function (employee) { var option = make('option', '', employee.name); option.value = employee.botId; target.appendChild(option); }); target.value = currentChatTarget(); target.disabled = !aiMembers.length; target.addEventListener('change', function () { chatTargetBySpace[space.id] = target.value; chatEpoch++; chatLoading = false; chatPane = null; chatRun = null; render(); loadChat(); });
    var actor = make('select'); actor.id = 'team-chat-actor'; actor.setAttribute('aria-label', tr('选择真人身份', 'Choose human identity')); members.forEach(function (employee) { var option = make('option', '', employee.name); option.value = employee.botId; actor.appendChild(option); }); actor.value = currentChatActor(); actor.disabled = !members.length; actor.addEventListener('change', function () { chatActorBySpace[space.id] = actor.value; chatEpoch++; chatLoading = false; chatPane = null; chatRun = null; render(); loadChat(); });
    var targetField = make('div', 'team-chat-control'); targetField.append(labelFor(target, tr('让成员 BOT 回复', 'Member BOT reply')), target); var actorField = make('div', 'team-chat-control'); actorField.append(labelFor(actor, tr('真人代表', 'Human identity')), actor); controls.append(actorField, targetField); panel.appendChild(controls);
    var note = make('p', 'team-inline-note', tr('真人发送不会调用模型；Bot 回复使用真实原生群聊执行。', 'Human send does not call a model; Bot replies use the real native group run.')); panel.appendChild(note);
    var messages = make('div', 'team-chat-messages'); messages.id = 'team-chat-messages';
    if (chatLoading) messages.appendChild(make('p', 'team-chat-empty', tr('正在读取群聊…', 'Loading group chat…')));
    else if (!chatPane || !chatPane.messages.length) messages.appendChild(make('p', 'team-chat-empty', tr('当前空间还没有消息。', 'No messages in this space yet.')));
    else chatPane.messages.forEach(function (message) { messages.appendChild(renderChatMessage(message, space)); });
    panel.appendChild(messages);
    if (chatRun) { var running = make('div', 'team-chat-running'); running.append(make('span', 'team-running-mark'), make('span', '', employeeName(chatRun.botId) + tr(' 正在回复…', ' is replying…'))); var stop = button('team-chat-stop', 'team-mode-danger', tr('停止', 'Stop')); stop.disabled = false; stop.addEventListener('click', stopChat); running.appendChild(stop); panel.appendChild(running); }
    var form = make('form', 'team-chat-composer'); var textarea = make('textarea'); textarea.id = 'team-chat-composer'; textarea.setAttribute('aria-label', tr('群聊消息', 'Group message')); textarea.rows = 2; textarea.maxLength = 8000; textarea.placeholder = tr('写一条群聊消息…', 'Write a group message…'); textarea.value = chatDraft(space.id); textarea.dataset.teamFocusKey = 'chat-composer';
    textarea.addEventListener('input', function () { chatDrafts[space.id] = textarea.value; });
    var actions = make('div', 'team-chat-actions'); var human = button('team-chat-send-human', 'team-mode-secondary', tr('作为真人发送', 'Send as human')); human.type = 'submit'; human.dataset.chatAction = 'human'; var ai = button('team-chat-send-ai', 'team-mode-primary', tr('让 Bot 回复', 'Ask Bot to reply')); ai.type = 'submit'; ai.dataset.chatAction = 'ai'; ai.disabled = !aiMembers.length || !!chatRun; actions.append(human, ai); form.append(textarea, actions); form.addEventListener('submit', function (event) { event.preventDefault(); sendChat(event.submitter && event.submitter.dataset.chatAction || 'human', space, textarea, human, ai); }); panel.appendChild(form); return panel;
  }
  function renderChatMessage(message, space) {
    var role = message.role === 'user' ? 'user' : 'assistant'; var row = make('article', 'team-chat-message team-chat-message-' + role); var speaker = message.speakerBotId ? employeeName(message.speakerBotId) : role === 'user' ? tr('本人 · 真人', 'Owner · Human') : tr('空间 Bot · AI 分身', 'Space Bot · AI avatar'); if (role === 'assistant' && message.speakerBotId) speaker += tr(' · AI 分身', ' · AI avatar'); row.append(make('span', 'team-chat-message-meta', speaker + (formatTime(message.at) ? ' · ' + formatTime(message.at) : '')), make('p', 'team-chat-message-text', text(message.text))); return row;
  }
  function loadChat() {
    var space = currentSpace(), botId = currentChatBot(); if (!open || !space || !botId) return;
    var ticket = lifeEpoch, selected = space.id, selectedBot = botId, epoch = chatEpoch, requestEpoch = ++chatRequestEpoch; chatLoading = true; render();
    call('orgWorkspaceView', { spaceId: selected, botId: selectedBot, mode: 'group' }).then(function (value) {
      if (!live(ticket) || requestEpoch !== chatRequestEpoch || chatEpoch !== epoch || selectedSpaceId !== selected || currentChatBot() !== selectedBot) return;
      chatPane = normalizePane(value); var running = chatPane.runs.filter(function (run) { return run.status === 'running'; }).slice(-1)[0]; chatRun = running && running.botId ? { runId: id(running.runId || running.id), botId: id(running.botId), viewBotId: selectedBot, spaceId: selected, epoch: epoch } : null;
    }).catch(function (error) { if (live(ticket) && requestEpoch === chatRequestEpoch && chatEpoch === epoch && selectedSpaceId === selected && currentChatBot() === selectedBot) setStatus(tr('读取群聊失败：', 'Could not load group chat: ') + safeError(error), 'error'); }).finally(function () {
      if (requestEpoch !== chatRequestEpoch || chatEpoch !== epoch || selectedSpaceId !== selected || currentChatBot() !== selectedBot) return;
      chatLoading = false; if (live(ticket)) render();
    });
  }
  function sendChat(kind, space, textarea, humanButton, aiButton) {
    var value = textarea.value.trim(); if (!value) { textarea.focus(); return; }
    var botId = kind === 'ai' ? currentChatTarget() : currentChatActor(); if (!botId) { setStatus(tr('请先绑定并选择成员 BOT。', 'Bind and choose an member BOT first.'), 'error'); return; }
    if (kind === 'ai' && !employeeFor(botId)) { setStatus(tr('请先在成员 BOT 页绑定此 Bot。', 'Bind this Bot in Member BOTs first.'), 'error'); return; }
    var ticket = lifeEpoch, requestId = uid(), original = value, source = { spaceId: id(space.id), botId: id(botId), viewBotId: currentChatBot() || id(botId), epoch: chatEpoch }; humanButton.disabled = true; aiButton.disabled = true; chatDrafts[source.spaceId] = ''; textarea.value = ''; setStatus(kind === 'ai' ? tr('已提交，等待成员 BOT 回复…', 'Submitted. Waiting for the member BOT…') : tr('正在发送真人消息…', 'Sending human message…'));
    call(kind === 'ai' ? 'teamChatSend' : 'teamPostMessage', { spaceId: source.spaceId, botId: source.botId, text: original, requestId: requestId }).then(function (receipt) {
      if (chatContextMatches(ticket, source) && kind === 'ai' && receipt && receipt.runId) chatRun = { runId: id(receipt.runId), botId: source.botId, viewBotId: source.viewBotId, spaceId: source.spaceId, epoch: source.epoch };
      return loadChatAfterSend(ticket, source);
    }).catch(function (error) { if (!chatDrafts[source.spaceId]) chatDrafts[source.spaceId] = original; if (chatContextMatches(ticket, source)) setStatus(tr('发送失败：', 'Could not send: ') + safeError(error), 'error'); }).finally(function () { if (chatContextMatches(ticket, source)) render(); });
  }
  function loadChatAfterSend(ticket, source) {
    if (!source || !source.spaceId || !source.botId) return Promise.resolve();
    return call('orgWorkspaceView', { spaceId: source.spaceId, botId: source.viewBotId || source.botId, mode: 'group' }).then(function (value) {
      if (!chatContextMatches(ticket, source)) return;
      chatPane = normalizePane(value); var running = chatPane.runs.filter(function (run) { return run.status === 'running'; }).slice(-1)[0]; chatRun = running && running.botId ? { runId: id(running.runId || running.id), botId: id(running.botId), viewBotId: source.viewBotId || source.botId, spaceId: source.spaceId, epoch: source.epoch } : null;
    });
  }
  function stopChat() {
    if (!chatRun || !chatRun.runId) return; var ticket = lifeEpoch, runId = chatRun.runId, source = { spaceId: id(chatRun.spaceId || selectedSpaceId), botId: id(chatRun.botId), viewBotId: id(chatRun.viewBotId || chatRun.botId), epoch: chatRun.epoch === undefined ? chatEpoch : chatRun.epoch }; setStatus(tr('正在停止群聊回复…', 'Stopping the group reply…'));
    call('orgWorkspaceStop', { runId: runId }).then(function () { if (!chatContextMatches(ticket, source)) return; chatRun = null; return loadChatAfterSend(ticket, source); }).then(function () { if (chatContextMatches(ticket, source)) { setStatus(tr('已停止这条回复。', 'Reply stopped.'), 'ok'); render(); } }).catch(function (error) { if (chatContextMatches(ticket, source)) setStatus(tr('停止失败：', 'Could not stop reply: ') + safeError(error), 'error'); });
  }

  function renderMemory() {
    var panel = make('section', 'team-panel'); panel.id = 'team-panel-memory'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', 'team-tab-memory'); var space = currentSpace();
    panel.appendChild(sectionHeading(tr('技能与记忆', 'Skills & memory'), tr('沿用原生空间记忆权限；详细空间、技能和实例设置仍在原生空间面板管理。', 'Uses native space memory permissions. Detailed space, skill, and instance settings stay in the native Spaces panel.')));
    if (!space) { panel.appendChild(emptyPanel(tr('先选择一个空间', 'Choose a space first'), tr('技能记忆属于真实的原生空间。', 'Skills and memory belong to a real native space.'), tr('打开空间设置', 'Open space settings'), openSpaces)); return panel; }
    var memberList = memberEmployees(space, true); var botId = currentMemoryBot() || (memberList[0] && memberList[0].botId) || space.leaderBotId;
    var controls = make('div', 'team-memory-controls'); var selector = make('select'); selector.id = 'team-memory-bot'; selector.setAttribute('aria-label', tr('选择记忆所属成员 BOT', 'Choose member BOT for memory')); memberList.forEach(function (employee) { var option = make('option', '', employee.name); option.value = employee.botId; selector.appendChild(option); }); selector.value = botId; selector.disabled = !memberList.length; selector.addEventListener('change', function () { memoryBotBySpace[space.id] = selector.value; memoryEpoch++; memoryLoading = false; memoryPane = null; render(); loadMemory(); }); var selectField = make('div', 'team-field'); selectField.append(labelFor(selector, tr('当前成员 BOT', 'Member BOT')), selector); var settings = button('team-open-space-memory-settings', 'team-mode-secondary', tr('打开空间技能设置', 'Open space skill settings')); settings.addEventListener('click', openSpaces); controls.append(selectField, settings); panel.appendChild(controls);
    panel.appendChild(make('p', 'team-inline-note', tr('“Bot × 空间”是本人空间私有记忆；“空间共享”会对当前空间成员可见。', '“Bot × Space” is private to this BOT in the space; “Shared in space” is visible to current members.')));
    var body = make('div', 'team-memory-body'); if (memoryLoading) body.appendChild(make('p', 'team-chat-empty', tr('正在读取记忆…', 'Loading memory…'))); else { var memories = memoryPane && Array.isArray(memoryPane.memories) ? memoryPane.memories : []; if (!memories.length) body.appendChild(make('p', 'team-chat-empty', tr('当前没有可用记忆。', 'No memory available.'))); memories.forEach(function (item) { body.appendChild(renderMemoryItem(item, space, botId)); }); }
    var draft = memoryDraft(space.id, botId); var form = make('form', 'team-memory-form'); form.id = 'team-memory-form'; var input = make('textarea'); input.id = 'team-memory-text'; input.rows = 3; input.maxLength = 8000; input.placeholder = tr('记录项目会复用的工作方法…', 'Record a reusable project working method…'); input.value = draft.text; input.dataset.teamFocusKey = 'memory-text'; input.addEventListener('input', function () { draft.text = input.value; }); var kind = make('select'); kind.id = 'team-memory-kind'; [['bot-space', tr('Bot × 空间（本人私有）', 'Bot × Space (private)')], ['space', tr('空间共享', 'Shared in space')]].forEach(function (item) { var option = make('option', '', item[1]); option.value = item[0]; kind.appendChild(option); }); kind.value = draft.kind; kind.addEventListener('change', function () { draft.kind = kind.value; }); var formActions = make('div', 'team-form-actions'); var add = button('team-memory-add', 'team-mode-primary', tr('保存记忆', 'Save memory')); add.type = 'submit'; form.append(make('div', 'team-field', null)); form.firstChild.append(labelFor(input, tr('新增一条记忆', 'Add memory')), input); var kindField = make('div', 'team-field'); kindField.append(labelFor(kind, tr('范围', 'Scope')), kind); form.append(kindField, formActions); formActions.append(add); form.addEventListener('submit', function (event) { event.preventDefault(); addMemory(space, botId, input, kind, add); }); body.appendChild(form); panel.appendChild(body); return panel;
  }
  function renderMemoryItem(item, space, botId) {
    var row = make('article', 'team-memory-item'); row.dataset.memoryId = id(item.id); var copy = make('div', 'team-memory-copy'); copy.append(make('p', 'team-memory-text', item.text), make('span', 'team-memory-kind', item.kind === 'space' ? tr('空间共享', 'Shared in space') : tr('Bot × 空间 · 本人私有', 'Bot × Space · Private'))); row.appendChild(copy);
    if (id(item.ownerBotId) === id(botId)) { var actions = make('div', 'team-memory-actions'); var remove = button('', 'team-mode-secondary', tr('删除', 'Delete')); remove.addEventListener('click', function () { removeMemory(item, space, botId); }); actions.appendChild(remove); row.appendChild(actions); }
    return row;
  }
  function loadMemory() {
    var space = currentSpace(), botId = currentMemoryBot() || (space && space.leaderBotId); if (!open || !space || !botId) return;
    var ticket = lifeEpoch, selected = space.id, selectedBot = botId, epoch = memoryEpoch, requestEpoch = ++memoryRequestEpoch; memoryLoading = true; render(); return call('orgWorkspaceView', { spaceId: selected, botId: selectedBot, mode: 'private' }).then(function (value) {
      if (!live(ticket) || requestEpoch !== memoryRequestEpoch || memoryEpoch !== epoch || selectedSpaceId !== selected || currentMemoryBot() !== selectedBot) return;
      memoryPane = normalizePane(value);
    }).catch(function (error) { if (live(ticket) && requestEpoch === memoryRequestEpoch && memoryEpoch === epoch && selectedSpaceId === selected && currentMemoryBot() === selectedBot) setStatus(tr('读取记忆失败：', 'Could not load memory: ') + safeError(error), 'error'); }).finally(function () {
      if (requestEpoch !== memoryRequestEpoch || memoryEpoch !== epoch || selectedSpaceId !== selected || currentMemoryBot() !== selectedBot) return;
      memoryLoading = false; if (live(ticket)) render();
    });
  }
  function memoryCommand(space, botId, command, message) {
    var ticket = lifeEpoch, source = { spaceId: id(space.id), botId: id(botId), epoch: memoryEpoch }; memoryActionBusy = true; setStatus(tr('正在更新记忆…', 'Updating memory…'));
    call('orgWorkspaceMemory', { spaceId: source.spaceId, botId: source.botId, command: command }).then(function () { if (!memoryContextMatches(ticket, source)) return; memoryPane = null; return loadMemory(); }).then(function () { if (memoryContextMatches(ticket, source)) setStatus(message || tr('记忆已更新。', 'Memory updated.'), 'ok'); }).catch(function (error) { if (memoryContextMatches(ticket, source)) setStatus(tr('记忆更新失败：', 'Could not update memory: ') + safeError(error), 'error'); }).finally(function () { memoryActionBusy = false; if (memoryContextMatches(ticket, source)) render(); });
  }
  function addMemory(space, botId, input, kind, add) {
    var value = input.value.trim(); if (!value) { setStatus(tr('记忆内容不能为空。', 'Memory content cannot be empty.'), 'error'); input.focus(); return; }
    var members = spaceMembers(space).slice(); var readers = kind.value === 'space' ? members : [botId]; var writers = [botId]; if (kind.value === 'space' && writers.some(function (writer) { return readers.indexOf(writer) < 0; })) writers = writers.filter(function (writer) { return readers.indexOf(writer) >= 0; });
    if (kind.value === 'space' && !readers.length) { setStatus(tr('空间共享需要至少一个空间成员。', 'Space sharing needs at least one member.'), 'error'); return; }
    add.disabled = true; memoryCommand(space, botId, { type: 'remember', record: { id: 'team_memory_' + uid().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 50), kind: kind.value, ownerBotId: botId, orgSpaceId: space.id, text: value, readerBotIds: readers, writerBotIds: writers, allowedOrgSpaceIds: kind.value === 'space' ? [space.id] : null, sourceRefs: [] } }, tr('记忆已保存。', 'Memory saved.'));
  }
  function removeMemory(item, space, botId) {
    if (typeof root.confirm === 'function' && !root.confirm(tr('删除这条记忆？', 'Delete this memory?'))) return;
    memoryCommand(space, botId, { type: 'remove', id: id(item.id), expectedVersion: item.version }, tr('记忆已删除。', 'Memory deleted.'));
  }

  function loadState(ticket) {
    var requestTicket = ticket === undefined ? lifeEpoch : ticket, requestEpoch = ++stateEpoch; setStatus(tr('正在读取团队状态…', 'Loading team state…'));
    return call('teamModeState').then(function (value) {
      if (!live(requestTicket) || requestEpoch !== stateEpoch) return value;
      state = normalizeState(value); ensureSelection(); notifyOrganization(); render();
      if (activeTab === 'chat') loadChat(); if (activeTab === 'memory') loadMemory(); setStatus(''); return value;
    }).catch(function (error) { if (live(requestTicket) && requestEpoch === stateEpoch) { state = normalizeState({ organization: rawOrganization || {} }); ensureSelection(); render(); setStatus(tr('读取团队状态失败：', 'Could not load team state: ') + safeError(error), 'error'); } });
  }
  function refreshState() { if (!open || composing) { refreshQueued = true; return Promise.resolve(); } return loadState(lifeEpoch); }
  function handleChanged() { if (!open) return; if (composing) { refreshQueued = true; return; } refreshState(); }

  function closeDialog() {
    if (!open) return;
    open = false; lifeEpoch++; stateEpoch++; chatEpoch++; memoryEpoch++; composing = false; refreshQueued = false; chatLoading = false; memoryLoading = false; memoryActionBusy = false; chatPane = null; memoryPane = null; chatRun = null; setStatus(''); if (dom.overlay) { dom.overlay.hidden = true; dom.overlay.setAttribute('aria-hidden', 'true'); }
    var target = focusBefore && focusBefore.isConnected ? focusBefore : focusBefore && focusBefore.id ? root.document.getElementById(focusBefore.id) : null; focusBefore = null; if (target && typeof target.focus === 'function') { try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); } }
  }
  function focusables() {
    if (!dom.dialog) return [];
    return Array.prototype.filter.call(dom.dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'), function (node) { return !node.hidden && node.offsetParent !== null; });
  }
  function handleKeydown(event) {
    if (!open) return;
    if (event.key === 'Escape' && !composing) { event.preventDefault(); event.stopImmediatePropagation(); closeDialog(); return; }
    if (event.key !== 'Tab') return;
    var list = focusables(); if (!list.length) return; var first = list[0], last = list[list.length - 1]; if (event.shiftKey && root.document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && root.document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function init(options) {
    if (initialized) return root.OpenBotTeamMode;
    options = options || {}; bridge = options.bridge || root.grokbot || null; onOpenSpaces = typeof options.onOpenSpaces === 'function' ? options.onOpenSpaces : null; onOrganizationState = typeof options.onOrganizationState === 'function' ? options.onOrganizationState : null; initialized = true; createDialog();
    root.document.addEventListener('keydown', handleKeydown, true);
    if (bridge && typeof bridge.onTeamModeChanged === 'function') { try { unsubscribeTeam = bridge.onTeamModeChanged(handleChanged); } catch (_) { unsubscribeTeam = null; } }
    if (bridge && typeof bridge.onOrgWorkspaceChanged === 'function') { try { unsubscribeOrg = bridge.onOrgWorkspaceChanged(handleChanged); } catch (_) { unsubscribeOrg = null; } }
    return root.OpenBotTeamMode;
  }
  function openDialog(options) {
    if (!initialized) return;
    options = options || {};
    if (open) { if (dom.close) dom.close.focus(); return; }
    focusBefore = options.opener && options.opener.isConnected ? options.opener : root.document.activeElement; activeTab = options.tab && ['tasks', 'people', 'chat', 'memory'].indexOf(options.tab) >= 0 ? options.tab : 'tasks'; open = true; lifeEpoch++; stateEpoch++; chatEpoch++; memoryEpoch++; chatLoading = false; memoryLoading = false; chatPane = null; memoryPane = null; chatRun = null;
    if (options.spaceId) selectedSpaceId = id(options.spaceId); if (dom.overlay) { dom.overlay.hidden = false; dom.overlay.setAttribute('aria-hidden', 'false'); }
    ensureSelection(); render(); setTimeout(function () { if (dom.close && open) dom.close.focus(); }, 0); loadState(lifeEpoch);
  }
  root.OpenBotTeamMode = { init: init, open: openDialog, close: closeDialog };
})(window);
