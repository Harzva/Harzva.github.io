(function (root) {
  'use strict';
  function tr(zh,en){return root.OpenBotI18n?root.OpenBotI18n.t(zh,en):zh;}
  function countLabel(value,zh,one,many){
    var english=typeof window==='object'&&window.OpenBotI18n&&window.OpenBotI18n.locale==='en';
    return english?new Intl.NumberFormat('en').format(Number(value))+' '+(Number(value)===1?one:(many||one+'s')):value+zh;
  }

  /*
   * Read-only Bot data surface. The host owns the bridge and supplies a
   * projection from botDashboardSnapshot; this module never asks the
   * organization workspace service for data and never mutates a Bot.
   */
  var state = {
    host: null,
    options: {},
    snapshot: null,
    query: {},
    root: null,
    scrollTop: 0,
    pendingFocus: '',
    pendingBotId: '',
    requireActivityEcho: false,
    activityQueryError: '',
    activityRequestVersion: 0,
    fleetMetric: 'invocations',
    fleetBotId: '',
    fleetRelation: '',
    fleetShowAll: false,
    healthRaw: null,
    healthProjection: null
  };

  var metricLabels = {
    botCount: 'Bot',
    spaceCount: tr('空间',"Space"),
    managedSpaceCount: tr('负责空间',"Spaces led"),
    memberSpaceCount: tr('参与空间',"Spaces joined"),
    invocations: tr('已记录调用',"Recorded calls"),
    taskCount: tr('当前保留任务',"Retained tasks"),
    activeTasks: tr('进行中（含排队）',"Active (including queued)"),
    startedTasks: tr('已启动',"Started"),
    doneTasks: tr('已完成',"Completed"),
    failedTasks: tr('失败',"Failed"),
    canceledTasks: tr('已取消',"Canceled"),
    interruptedTasks: tr('已中断',"Interrupted"),
    incomingDelegations: tr('收到派单',"Incoming delegations"),
    outgoingDelegations: tr('发出派单',"Outgoing delegations")
  };

  var metricOrder = [
    'botCount', 'spaceCount', 'managedSpaceCount', 'memberSpaceCount',
    'invocations', 'taskCount', 'activeTasks', 'startedTasks', 'doneTasks',
    'failedTasks', 'canceledTasks', 'interruptedTasks', 'incomingDelegations',
    'outgoingDelegations'
  ];

  function el(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = String(value);
    return node;
  }

  function button(id, className, value) {
    var node = el('button', className, value);
    node.type = 'button';
    if (id) node.id = id;
    return node;
  }

  function text(value, fallback) {
    var result = value === undefined || value === null ? '' : String(value);
    return result || (fallback || '');
  }

  function id(value) {
    return value === undefined || value === null ? '' : String(value);
  }

  function safeColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : '#5b8cff';
  }

  function roleLabel(bot,role){
    if(typeof root.OpenBotRoleLabelFor==='function')return root.OpenBotRoleLabelFor(bot||null,role);
    var api=root.OpenBotRoleLabels,language=root.OpenBotI18n&&root.OpenBotI18n.locale==='en'?'en':'zh';
    if(api&&typeof api.resolveRoleLabel==='function')return api.resolveRoleLabel(root.OpenBotRoleLabelState||{},bot||null,role,language);
    return ({primary:tr('主 BOT','Memory BOT'),leader:tr('组长','Group lead'),member:tr('成员 BOT','Member BOT')})[role]||'Bot';
  }

  function hasValue(value) {
    return value !== null && value !== undefined;
  }

  function tagLabel(value) {
    if (value && typeof value === 'object') return text(value.label || value.name || value.value, '');
    return text(value);
  }

  function number(value) {
    if (!hasValue(value)) return tr('未知',"Unknown");
    if (typeof value === 'number' && isFinite(value)) return root.OpenBotI18n ? root.OpenBotI18n.number(value) : String(value);
    if (/^\d+$/.test(String(value))) return root.OpenBotI18n ? root.OpenBotI18n.number(Number(value)) : String(value);
    return tr('未知',"Unknown");
  }

  function date(value) {
    if (value === undefined || value === null || value === '') return '';
    var parsed = new Date(value);
    if (isNaN(parsed.getTime())) return '';
    try {
      return parsed.toLocaleString(root.OpenBotI18n ? root.OpenBotI18n.locale : 'zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return parsed.toISOString();
    }
  }

  function avatarMarkup(bot, size) {
    if (!bot || !root.OpenBotAvatars || typeof root.OpenBotAvatars.markup !== 'function') return '';
    return root.OpenBotAvatars.markup(text(bot.avatar, 'orbit'), safeColor(bot.color), { size: size || 'list' });
  }

  function avatar(bot, size, className) {
    var holder = el('span', 'org-bot-dashboard-avatar' + (className ? ' ' + className : ''));
    holder.setAttribute('aria-hidden', 'true');
    var markup = avatarMarkup(bot, size);
    if (markup) holder.innerHTML = markup;
    else {
      holder.textContent = Array.from(String(text(bot && bot.name, '')).trim())[0] || '';
      if (!holder.textContent || /^[?？]$/.test(holder.textContent)) holder.innerHTML = '<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>';
      holder.style.background = safeColor(bot && bot.color);
    }
    return holder;
  }

  function publicBots(snapshot) {
    var list = Array.isArray(snapshot && snapshot.bots) ? snapshot.bots : [];
    if (list.length) return list;
    return Array.isArray(snapshot && snapshot.subjects) ? snapshot.subjects : [];
  }

  function botFor(snapshot, botId) {
    var list = publicBots(snapshot), target = id(botId);
    for (var i = 0; i < list.length; i++) if (id(list[i] && list[i].id) === target) return list[i];
    if (snapshot && snapshot.profile && id(snapshot.profile.id) === target) return snapshot.profile;
    return null;
  }

  function roleLabelForSpace(space,snapshot) {
    if (!space) return '';
    var role=space.role==='oversight'?'primary':space.role==='leader'?'leader':'member';
    var bot=role==='leader'?botFor(snapshot,space.leaderBotId):(snapshot&&snapshot.profile)||botFor(snapshot,snapshot&&snapshot.selectedBotId);
    return roleLabel(bot,role);
  }

  function viewLabel(snapshot) {
    var view = snapshot && snapshot.view;
    if(view==='ceo')return roleLabel(snapshot&&snapshot.profile,'primary')+tr(' 总览',' overview');
    if(view==='leader')return roleLabel(snapshot&&snapshot.profile,'leader')+tr(' 负责范围',' scope');
    return tr('Bot 记录',"Bot records");
  }

  function locationLabel(value) {
    return ({ local: tr('本机配置',"Local configuration"), node: tr('节点配置',"Node configuration"), remote: tr('远端配置',"Remote configuration"), unknown: tr('未知',"Unknown") })[value] || text(value, tr('未知',"Unknown"));
  }

  function summary(snapshot) {
    return snapshot && snapshot.summary && typeof snapshot.summary === 'object' ? snapshot.summary : {};
  }

  function hasActivity(snapshot) {
    return Boolean(snapshot && snapshot.activity && typeof snapshot.activity === 'object' &&
      typeof snapshot.activity.status === 'string');
  }

  function validTimeZone(value) {
    if (!value || typeof value !== 'string') return false;
    try { new Intl.DateTimeFormat('en-US', { timeZone: value }); return true; }
    catch (_) { return false; }
  }

  function localTimeZone() {
    try {
      var value = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return validTimeZone(value) ? value : '';
    } catch (_) { return ''; }
  }

  function copyQuery(value) {
    var result = {};
    Object.keys(value || {}).forEach(function (key) { result[key] = value[key]; });
    return result;
  }

  function initializeQuery(snapshot) {
    var activity = snapshot && snapshot.activity;
    var range = activity && activity.range || {};
    var query = copyQuery(state.query);
    if (!['today', '7d', '30d', 'custom'].includes(query.range)) {
      query.range = ['today', '7d', '30d', 'custom'].includes(range.preset) ? range.preset : '7d';
    }
    if (!['class', 'instance'].includes(query.scope)) query.scope = 'class';
    query.timeZone = validTimeZone(query.timeZone) ? query.timeZone :
      (validTimeZone(range.timeZone) ? range.timeZone : localTimeZone());
    if (query.range === 'custom') {
      if (!query.from && /^\d{4}-\d{2}-\d{2}$/.test(String(range.from || ''))) query.from = range.from;
      if (!query.to && /^\d{4}-\d{2}-\d{2}$/.test(String(range.to || ''))) query.to = range.to;
    } else {
      delete query.from;
      delete query.to;
    }
    if (query.scope !== 'instance') delete query.instanceId;
    return query;
  }

  function activityRequestMatches(activity, query) {
    if (!activity || typeof activity !== 'object') return false;
    var response = activity.request || activity.query;
    if (!response || typeof response !== 'object') return false;
    var expectedRange = query.range || '7d';
    if (response.range !== expectedRange) return false;
    if (expectedRange === 'custom' && (response.from !== query.from || response.to !== query.to)) return false;
    if (query.timeZone && response.timeZone !== query.timeZone) return false;
    if ((response.scope || 'class') !== (query.scope || 'class')) return false;
    if ((query.scope || 'class') === 'instance' && id(response.instanceId) !== id(query.instanceId)) return false;
    return true;
  }

  function activityRangeMatches(activity, query) {
    var range = activity && activity.range || {};
    if (range.preset !== (query.range || '7d')) return false;
    if (query.range === 'custom' && (range.from !== query.from || range.to !== query.to)) return false;
    if (query.timeZone && range.timeZone !== query.timeZone) return false;
    return true;
  }

  function selectedInstanceAvailable(activity, query) {
    if ((query.scope || 'class') !== 'instance') return true;
    var instances = Array.isArray(activity && activity.instances) ? activity.instances : [];
    return instances.some(function (instance) { return id(instance && instance.id) === id(query.instanceId); });
  }

  function requestedBotMatches(snapshot) {
    var expected = id(state.pendingBotId || state.query && state.query.botId);
    if (!expected) return true;
    var selected = id(snapshot && (snapshot.selectedBotId || snapshot.profile && snapshot.profile.id));
    return selected === expected;
  }

  function activityMatchesCurrentQuery(snapshot) {
    if (!hasActivity(snapshot) || !requestedBotMatches(snapshot) || !activityRangeMatches(snapshot.activity, state.query) ||
        !selectedInstanceAvailable(snapshot.activity, state.query)) return false;
    var response = snapshot.activity.request || snapshot.activity.query;
    if (state.requireActivityEcho || state.query.scope === 'instance') {
      return activityRequestMatches(snapshot.activity, state.query);
    }
    return !response || activityRequestMatches(snapshot.activity, state.query);
  }

  function selectBot(botId) {
    if (typeof state.options.onSelectBot !== 'function') return;
    state.pendingBotId = id(botId);
    requestFocus('profile');
    render();
    state.options.onSelectBot(id(botId), copyQuery(state.query));
  }

  function metricTitle(key, snapshot) {
    if (key === 'invocations' && snapshot && snapshot.view === 'leader') return tr('空间调用',"Space calls");
    if (key === 'taskCount' && snapshot && snapshot.view === 'leader') return tr('空间任务',"Space tasks");
    return metricLabels[key] || key;
  }

  function metricRow(key, value, snapshot) {
    var row = el('div', 'org-bot-dashboard-metric');
    row.dataset.metric = key;
    row.dataset.dashboardMetric = key;
    row.appendChild(el('span', 'org-bot-dashboard-metric-label', metricTitle(key, snapshot)));
    row.appendChild(el('strong', 'org-bot-dashboard-metric-value', number(value)));
    return row;
  }

  function appendMetrics(parent, values, snapshot, keys) {
    var shown = 0;
    (keys || metricOrder).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(values || {}, key)) return;
      parent.appendChild(metricRow(key, values[key], snapshot));
      shown += 1;
    });
    return shown;
  }

  function appendMetricNote(parent, message, tone) {
    var note = el('p', 'org-bot-dashboard-note' + (tone ? ' is-' + tone : ''), message);
    parent.appendChild(note);
    return note;
  }

  function renderLoading() {
    var rootView = el('div', 'org-bot-dashboard');
    rootView.id = 'org-bot-dashboard';
    rootView.appendChild(el('p', 'org-bot-dashboard-loading', tr('正在读取 Bot 数据…',"Loading Bot data…")));
    return rootView;
  }

  function renderError(snapshot) {
    var rootView = el('div', 'org-bot-dashboard');
    rootView.id = 'org-bot-dashboard';
    var panel = el('section', 'org-bot-dashboard-error');
    panel.id = 'org-bot-dashboard-error';
    panel.setAttribute('role', 'alert');
    panel.appendChild(el('strong', '', tr('Bot 数据暂不可用',"Bot data unavailable")));
    panel.appendChild(el('p', '', text(snapshot && snapshot.message, tr('读取数据失败，请稍后重试。',"Failed to load data. Try again later."))));
    var retry = button('org-bot-dashboard-retry', '', tr('重试',"Retry"));
    retry.addEventListener('click', function () {
      if (typeof state.options.onRefresh === 'function') state.options.onRefresh(state.query);
    });
    panel.appendChild(retry);
    rootView.appendChild(panel);
    return rootView;
  }

  function requestFocus(kind) {
    state.pendingFocus = kind || '';
  }

  function captureScroll() {
    if (!state.root) return;
    var scroll = state.root.querySelector('#org-bot-dashboard-scroll');
    if (scroll) state.scrollTop = scroll.scrollTop;
  }

  function restoreInteraction() {
    if (!state.root) return;
    var scroll = state.root.querySelector('#org-bot-dashboard-scroll');
    if (scroll) scroll.scrollTop = state.scrollTop;
    if (!state.pendingFocus) return;
    var target = null;
    if (state.pendingFocus === 'refresh') target = state.root.querySelector('#org-bot-dashboard-refresh');
    if (state.pendingFocus === 'profile') {
      target = state.root.querySelector('#org-bot-dashboard-subject');
      if (target && state.pendingBotId && id(target.dataset.dashboardSubject) !== state.pendingBotId) return;
    }
    if (state.pendingFocus === 'activity-range') target = state.root.querySelector('#org-bot-dashboard-activity-range');
    if (state.pendingFocus === 'activity-scope') target = state.root.querySelector('#org-bot-dashboard-activity-scope');
    if (state.pendingFocus === 'activity-instance') target = state.root.querySelector('#org-bot-dashboard-activity-instance');
    if (state.pendingFocus === 'activity-from') target = state.root.querySelector('#org-bot-dashboard-activity-from');
    if (state.pendingFocus === 'activity-to') target = state.root.querySelector('#org-bot-dashboard-activity-to');
    if (state.pendingFocus === 'fleet-metric') target = state.root.querySelector('#org-bot-dashboard-fleet-metric');
    if (state.pendingFocus.indexOf('fleet-bot:') === 0) {
      target = state.root.querySelector('[data-fleet-bot="' + state.pendingFocus.slice('fleet-bot:'.length) + '"]');
    }
    if (state.pendingFocus.indexOf('fleet-cell:') === 0) {
      target = state.root.querySelector('[data-fleet-cell="' + state.pendingFocus.slice('fleet-cell:'.length) + '"]');
    }
    if (state.pendingFocus === 'fleet-relation') target = state.root.querySelector('#org-bot-dashboard-fleet-relation-detail');
    if (!target && state.pendingFocus === 'refresh') target = state.root.querySelector('#org-bot-dashboard-retry');
    if (target && typeof target.focus === 'function') {
      // Refresh returns to the same place; changing subject should bring the
      // newly selected profile back into view so the scope change is legible.
      if (state.pendingFocus === 'refresh') target.focus({ preventScroll: true });
      else target.focus();
      state.pendingFocus = '';
    }
  }

  function renderToolbar(snapshot) {
    var toolbar = el('header', 'org-bot-dashboard-toolbar');
    toolbar.id = 'org-bot-dashboard-toolbar';
    var copy = el('div', 'org-bot-dashboard-toolbar-copy');
    copy.appendChild(el('h2', 'org-bot-dashboard-title', tr('Bot 数据面板',"Bot dashboard")));
    copy.appendChild(el('p', 'org-bot-dashboard-subtitle', tr('只显示已记录的调用、当前保留任务和已确认职责。',"Shows recorded calls, retained tasks, and confirmed responsibilities only.")));
    toolbar.appendChild(copy);
    var meta = el('div', 'org-bot-dashboard-toolbar-meta');
    meta.appendChild(el('span', 'org-bot-dashboard-view-label', viewLabel(snapshot)));
    if (snapshot && snapshot.at) meta.appendChild(el('span', 'org-bot-dashboard-at', tr('更新于 ',"Updated ") + date(snapshot.at)));
    toolbar.appendChild(meta);
    var subjects = Array.isArray(snapshot && snapshot.subjects) ? snapshot.subjects : publicBots(snapshot);
    if (subjects.length) {
      var select = document.createElement('select');
      select.id = 'org-bot-dashboard-subject-select';
      select.className = 'org-bot-dashboard-subject-select';
      select.setAttribute('aria-label', tr('查看 Bot',"View Bot"));
      select.title = tr('查看 Bot',"View Bot");
      subjects.forEach(function (subject) {
        if (!subject || !subject.id) return;
        var option = el('option', '', text(subject.name, subject.id));
        option.value = id(subject.id);
        select.appendChild(option);
      });
      var selected = id(state.pendingBotId || snapshot && snapshot.selectedBotId || snapshot && snapshot.profile && snapshot.profile.id);
      if (selected) select.value = selected;
      select.addEventListener('change', function () {
        selectBot(select.value);
      });
      toolbar.appendChild(select);
    }
    var refresh = button('org-bot-dashboard-refresh', 'org-bot-dashboard-refresh', tr('刷新',"Refresh"));
    refresh.setAttribute('aria-label', tr('刷新 Bot 数据',"Refresh Bot data"));
    refresh.addEventListener('click', function () {
      requestFocus('refresh');
      if (typeof state.options.onRefresh === 'function') state.options.onRefresh(state.query);
    });
    toolbar.appendChild(refresh);
    return toolbar;
  }

  function renderProfile(snapshot) {
    var profile = snapshot && snapshot.profile;
    if (!profile) return null;
    if (state.pendingBotId && id(profile.id) !== state.pendingBotId) return null;
    var section = el('section', 'org-bot-dashboard-profile');
    section.id = 'org-bot-dashboard-profile';
    var identity = el('div', 'org-bot-dashboard-profile-identity');
    identity.id = 'org-bot-dashboard-subject';
    identity.dataset.dashboardSubject = id(profile.id);
    identity.tabIndex = -1;
    identity.appendChild(avatar(profile, 'list', 'org-bot-dashboard-profile-avatar' + (profile.isPrimary ? ' is-primary' : '')));
    var copy = el('div', 'org-bot-dashboard-profile-copy');
    copy.appendChild(el('strong', 'org-bot-dashboard-profile-name', text(profile.name, tr('未命名 Bot',"Untitled Bot"))));
    var role = profile.isPrimary ? tr('主脑','Main Bot') : Number(profile.managedSpaceCount)>0 ? tr('空间负责人','Space lead') : 'Bot';
    copy.appendChild(el('span', 'org-bot-dashboard-profile-role', role));
    var model = [text(profile.model), text(profile.harness)].filter(Boolean).join(' · ');
    if (model) copy.appendChild(el('span', 'org-bot-dashboard-profile-meta', model));
    if (profile.executionLocation) copy.appendChild(el('span', 'org-bot-dashboard-profile-meta', tr('配置位置 · ',"Configuration location · ") + locationLabel(profile.executionLocation)));
    identity.appendChild(copy);
    var actions = el('div', 'org-bot-dashboard-profile-actions');
    if (profile.id && typeof state.options.onOpenBot === 'function') {
      var open = button('', 'org-bot-dashboard-open', tr('打开对话',"Open chat"));
      open.dataset.dashboardOpenBot = id(profile.id);
      open.addEventListener('click', function () { state.options.onOpenBot(id(profile.id)); });
      actions.appendChild(open);
    }
    identity.appendChild(actions);
    section.appendChild(identity);
    var details = el('div', 'org-bot-dashboard-responsibility');
    var fields = [
      [tr('职责',"Responsibility"), profile.title],
      [tr('分工',"Assignment"), profile.section],
      [tr('说明',"Description"), profile.description]
    ];
    fields.forEach(function (item) {
      if (!item[1]) return;
      var row = el('div', 'org-bot-dashboard-detail-row');
      row.appendChild(el('span', 'org-bot-dashboard-detail-label', item[0]));
      row.appendChild(el('span', 'org-bot-dashboard-detail-value', item[1]));
      details.appendChild(row);
    });
    if (Array.isArray(profile.specialties) && profile.specialties.length) {
      var specialties = el('div', 'org-bot-dashboard-detail-row');
      specialties.appendChild(el('span', 'org-bot-dashboard-detail-label', tr('专长',"Specialties")));
      specialties.appendChild(el('span', 'org-bot-dashboard-detail-value', profile.specialties.join('、')));
      details.appendChild(specialties);
    }
    if (Array.isArray(profile.tags) && profile.tags.length) {
      var tags = el('div', 'org-bot-dashboard-tags');
      tags.setAttribute('aria-label', tr('标签',"Tags"));
      profile.tags.forEach(function (tag) {
        var label = tagLabel(tag);
        if (label) tags.appendChild(el('span', 'org-bot-dashboard-tag', label));
      });
      details.appendChild(tags);
    }
    if (details.childNodes.length) section.appendChild(details);
    return section;
  }

  function renderSummary(snapshot) {
    var values = summary(snapshot);
    var section = el('section', 'org-bot-dashboard-section');
    section.id = 'org-bot-dashboard-summary';
    section.appendChild(el('h3', 'org-bot-dashboard-section-title', viewLabel(snapshot)));
    if (hasActivity(snapshot)) section.appendChild(el('p', 'org-bot-dashboard-section-note', tr(
      '调用与模型请求按当前时间范围统计；任务与空间为当前保留或已确认的数据。',
      'Calls and model requests use the selected range; tasks and spaces use retained or confirmed data.'
    )));
    var grid = el('div', 'org-bot-dashboard-metrics');
    var shown = appendMetrics(grid, values, snapshot, summaryKeys(snapshot));
    if (shown) section.appendChild(grid);
    else {
      var coverage = snapshot && snapshot.coverage || {};
      var note = snapshot && snapshot.view === 'leader' && coverage.taskScope === 'space-unattributed'
        ? tr('负责人任务暂未按空间归属，无法安全汇总。',"Lead tasks have no space attribution yet, so totals cannot be reliably calculated.")
        : tr('当前没有可核查的数据。',"No verifiable data available.");
      appendMetricNote(section, note);
    }
    return section;
  }

  function summaryKeys(snapshot) {
    if (snapshot && snapshot.view === 'leader') {
      return ['botCount', 'managedSpaceCount', 'memberSpaceCount', 'invocations', 'taskCount', 'activeTasks'];
    }
    if (snapshot && snapshot.view === 'bot') {
      return ['memberSpaceCount', 'managedSpaceCount', 'invocations', 'taskCount', 'activeTasks', 'doneTasks'];
    }
    return ['botCount', 'spaceCount', 'invocations', 'taskCount', 'activeTasks', 'doneTasks'];
  }

  function renderBots(snapshot) {
    var bots = publicBots(snapshot);
    if (!bots.length) return null;
    var section = el('section', 'org-bot-dashboard-section');
    section.id = 'org-bot-dashboard-bots';
    section.appendChild(el('h3', 'org-bot-dashboard-section-title', tr('Bot 记录',"Bot records")));
    var note = snapshot && snapshot.view === 'ceo' ? tr('每行只显示已确认的调用和任务统计。',"Each row shows confirmed call and task statistics only.") : tr('点击 Bot 查看其独立记录。',"Select a Bot to view its records.");
    section.appendChild(el('p', 'org-bot-dashboard-section-note', note));
    var list = el('div', 'org-bot-dashboard-bot-list');
    bots.forEach(function (bot) {
      if (!bot || !bot.id) return;
      var row = button('', 'org-bot-dashboard-bot-row');
      row.dataset.dashboardBot = id(bot.id);
      row.dataset.dashboardBotId = id(bot.id);
      row.setAttribute('aria-label', tr('查看 ',"View ") + text(bot.name, 'Bot') + tr(' 数据'," data"));
      row.appendChild(avatar(bot, 'list'));
      var copy = el('span', 'org-bot-dashboard-bot-copy');
      copy.appendChild(el('strong', 'org-bot-dashboard-bot-name', text(bot.name, bot.id)));
      var roles=[];
      if(bot.isPrimary)roles.push(roleLabel(bot,'primary'));
      if(Number(bot.managedSpaceCount)>0)roles.push(roleLabel(bot,'leader'));
      if(!roles.length)roles.push(roleLabel(bot,'member'));
      var role = roles.join(' · ');
      copy.appendChild(el('span', 'org-bot-dashboard-bot-role', role));
      var spaces = [];
      if (hasValue(bot.managedSpaceCount)) spaces.push(tr('负责 ',"Leading ") + countLabel(bot.managedSpaceCount,' 个空间','space'));
      if (hasValue(bot.memberSpaceCount)) spaces.push(tr('参与 ',"Joined ") + countLabel(bot.memberSpaceCount,' 个空间','space'));
      if (spaces.length) copy.appendChild(el('span', 'org-bot-dashboard-bot-meta', spaces.join(' · ')));
      row.appendChild(copy);
      var metrics = el('span', 'org-bot-dashboard-bot-metrics');
      var values = bot.metrics && typeof bot.metrics === 'object' ? bot.metrics : {};
      ['invocations', 'taskCount', 'activeTasks'].forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(values, key)) return;
        var metric = el('span', 'org-bot-dashboard-bot-metric');
        metric.dataset.metric = key;
        metric.dataset.dashboardMetric = key;
        metric.appendChild(el('span', 'org-bot-dashboard-bot-metric-label', metricLabels[key] || key));
        metric.appendChild(el('strong', 'org-bot-dashboard-bot-metric-value', number(values[key])));
        metrics.appendChild(metric);
      });
      if (!metrics.childNodes.length) metrics.appendChild(el('span', 'org-bot-dashboard-bot-unknown', tr('统计未知',"Statistics unknown")));
      row.appendChild(metrics);
      row.addEventListener('click', function () {
        selectBot(id(bot.id));
      });
      list.appendChild(row);
    });
    section.appendChild(list);
    return section;
  }

  function activityNumber(value) {
    return hasValue(value) && typeof value === 'number' && isFinite(value) ? number(value) : tr('未知', 'Unknown');
  }

  function durationLabel(value) {
    if (!hasValue(value) || typeof value !== 'number' || !isFinite(value) || value < 0) return tr('未知', 'Unknown');
    if (value < 1000) return number(Math.round(value)) + ' ms';
    if (value < 60000) return (value / 1000).toFixed(1) + ' s';
    return (value / 60000).toFixed(1) + ' min';
  }

  function dateRangeLabel(activity) {
    var range = activity && activity.range || {};
    var labels = {
      today: tr('今天', 'Today'),
      '7d': tr('最近 7 天', 'Last 7 days'),
      '30d': tr('最近 30 天', 'Last 30 days'),
      custom: tr('自定义范围', 'Custom range')
    };
    var label = labels[range.preset] || tr('所选范围', 'Selected range');
    if (range.from && range.to) label += ' · ' + range.from + ' – ' + range.to;
    return label;
  }

  function dispatchActivityQuery(patch, focusKind) {
    var next = copyQuery(state.query);
    Object.keys(patch || {}).forEach(function (key) { next[key] = patch[key]; });
    if (next.range !== 'custom') { delete next.from; delete next.to; }
    if (next.scope !== 'instance') delete next.instanceId;
    state.query = next;
    state.requireActivityEcho = true;
    state.activityQueryError = '';
    state.activityRequestVersion += 1;
    var version = state.activityRequestVersion;
    requestFocus(focusKind || 'activity-range');
    render();
    var callback = typeof state.options.onQueryChange === 'function' ? state.options.onQueryChange : state.options.onRefresh;
    if (typeof callback !== 'function') {
      state.activityQueryError = tr('无法读取所选范围。', 'The selected range could not be loaded.');
      render();
      return;
    }
    try {
      var result = callback(copyQuery(state.query));
      if (result && typeof result.catch === 'function') result.catch(function () {
        if (version !== state.activityRequestVersion) return;
        state.activityQueryError = tr('无法读取所选范围。', 'The selected range could not be loaded.');
        render();
      });
    } catch (_) {
      if (version !== state.activityRequestVersion) return;
      state.activityQueryError = tr('无法读取所选范围。', 'The selected range could not be loaded.');
      render();
    }
  }

  function setCustomDate(key, value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
      state.query[key] = value || '';
      state.requireActivityEcho = true;
      state.activityQueryError = tr('请选择有效的起止日期。', 'Choose valid start and end dates.');
      requestFocus('activity-' + key);
      render();
      return;
    }
    var next = copyQuery(state.query);
    next[key] = value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next.from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(next.to || '') || next.from > next.to) {
      state.query = next;
      state.requireActivityEcho = true;
      state.activityQueryError = tr('起始日期不能晚于结束日期。', 'The start date must be on or before the end date.');
      requestFocus('activity-' + key);
      render();
      return;
    }
    dispatchActivityQuery({ from: next.from, to: next.to }, 'activity-' + key);
  }

  function findSpace(snapshot, spaceId) {
    var spaces = Array.isArray(snapshot && snapshot.spaces) ? snapshot.spaces : [];
    for (var i = 0; i < spaces.length; i++) if (id(spaces[i] && spaces[i].id) === id(spaceId)) return spaces[i];
    return null;
  }

  function instanceLabel(instance, snapshot) {
    var bot = botFor(snapshot, instance && instance.botId);
    var space = findSpace(snapshot, instance && instance.spaceId);
    var parts = [];
    if (bot && bot.name) parts.push(bot.name);
    if (space && space.name) parts.push(space.name);
    if (instance && instance.revision !== undefined && instance.revision !== null) parts.push('r' + instance.revision);
    return parts.length ? parts.join(' · ') : text(instance && instance.id, tr('未知实例', 'Unknown instance'));
  }

  function renderActivityControls(activity, snapshot) {
    var controls = el('div', 'org-bot-dashboard-activity-controls');
    var query = state.query;
    var rangeField = el('label', 'org-bot-dashboard-activity-field');
    rangeField.appendChild(el('span', 'org-bot-dashboard-activity-label', tr('时间范围', 'Date range')));
    var rangeSelect = document.createElement('select');
    rangeSelect.id = 'org-bot-dashboard-activity-range';
    rangeSelect.setAttribute('aria-label', tr('时间范围', 'Date range'));
    [
      ['today', tr('今天', 'Today')],
      ['7d', tr('最近 7 天', 'Last 7 days')],
      ['30d', tr('最近 30 天', 'Last 30 days')],
      ['custom', tr('自定义', 'Custom')]
    ].forEach(function (item) {
      var option = el('option', '', item[1]); option.value = item[0]; rangeSelect.appendChild(option);
    });
    rangeSelect.value = query.range || '7d';
    rangeSelect.addEventListener('change', function () {
      var next = { range: rangeSelect.value };
      if (rangeSelect.value === 'custom') {
        var range = activity && activity.range || {};
        next.from = query.from || range.from || '';
        next.to = query.to || range.to || '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(next.from) || !/^\d{4}-\d{2}-\d{2}$/.test(next.to)) {
          state.query = Object.assign({}, query, next);
          state.activityQueryError = tr('请选择有效的起止日期。', 'Choose valid start and end dates.');
          state.requireActivityEcho = true;
          requestFocus('activity-range');
          render();
          return;
        }
      }
      dispatchActivityQuery(next, 'activity-range');
    });
    rangeField.appendChild(rangeSelect);
    controls.appendChild(rangeField);

    if (query.range === 'custom') {
      [['from', tr('从', 'From')], ['to', tr('到', 'To')]].forEach(function (item) {
        var dateField = el('label', 'org-bot-dashboard-activity-field org-bot-dashboard-activity-date');
        dateField.appendChild(el('span', 'org-bot-dashboard-activity-label', item[1]));
        var input = document.createElement('input'); input.type = 'date'; input.id = 'org-bot-dashboard-activity-' + item[0];
        input.value = query[item[0]] || '';
        input.setAttribute('aria-label', item[1]);
        input.addEventListener('change', function () { setCustomDate(item[0], input.value); });
        dateField.appendChild(input); controls.appendChild(dateField);
      });
    }

    var scopeField = el('label', 'org-bot-dashboard-activity-field');
    scopeField.appendChild(el('span', 'org-bot-dashboard-activity-label', tr('统计范围', 'Scope')));
    var scopeSelect = document.createElement('select');
    scopeSelect.id = 'org-bot-dashboard-activity-scope';
    scopeSelect.setAttribute('aria-label', tr('统计范围', 'Scope'));
    var classOption = el('option', '', tr('Bot 类别', 'Bot class')); classOption.value = 'class'; scopeSelect.appendChild(classOption);
    var instances = Array.isArray(activity && activity.instances) ? activity.instances : [];
    var instanceOption = el('option', '', tr('工作区实例', 'Workspace instance'));
    instanceOption.value = 'instance'; instanceOption.disabled = !instances.length; scopeSelect.appendChild(instanceOption);
    scopeSelect.value = query.scope || 'class';
    scopeSelect.addEventListener('change', function () {
      if (scopeSelect.value === 'instance') {
        var chosen = instances.some(function (item) { return id(item && item.id) === id(query.instanceId); })
          ? query.instanceId : instances.length ? id(instances[0].id) : '';
        dispatchActivityQuery({ scope: 'instance', instanceId: chosen }, 'activity-scope');
      } else dispatchActivityQuery({ scope: 'class' }, 'activity-scope');
    });
    scopeField.appendChild(scopeSelect); controls.appendChild(scopeField);

    if ((query.scope || 'class') === 'instance') {
      var instanceField = el('label', 'org-bot-dashboard-activity-field org-bot-dashboard-activity-instance');
      instanceField.appendChild(el('span', 'org-bot-dashboard-activity-label', tr('实例', 'Instance')));
      var instanceSelect = document.createElement('select'); instanceSelect.id = 'org-bot-dashboard-activity-instance';
      instanceSelect.setAttribute('aria-label', tr('工作区实例', 'Workspace instance'));
      if (!instances.length) {
        var unavailable = el('option', '', tr('无可验证实例', 'No verified instances'));
        unavailable.value = ''; instanceSelect.appendChild(unavailable); instanceSelect.disabled = true;
      }
      instances.forEach(function (instance) {
        if (!instance || !instance.id) return;
        var option = el('option', '', instanceLabel(instance, snapshot)); option.value = id(instance.id); instanceSelect.appendChild(option);
      });
      if (query.instanceId) instanceSelect.value = id(query.instanceId);
      instanceSelect.addEventListener('change', function () { dispatchActivityQuery({ scope: 'instance', instanceId: instanceSelect.value }, 'activity-instance'); });
      instanceField.appendChild(instanceSelect); controls.appendChild(instanceField);
    }

    var zone = validTimeZone(query.timeZone) ? query.timeZone : activity && activity.range && activity.range.timeZone;
    controls.appendChild(el('span', 'org-bot-dashboard-activity-zone',
      tr('时区：', 'Time zone: ') + text(zone, tr('未知', 'Unknown'))));
    return controls;
  }

  function activityMetric(parent, key, label, value, secondary) {
    var item = el('div', 'org-bot-dashboard-activity-metric');
    item.dataset.activityMetric = key;
    item.appendChild(el('dt', '', label));
    var dd = el('dd', '');
    dd.appendChild(el('strong', 'org-bot-dashboard-activity-value', value));
    if (secondary) dd.appendChild(el('span', 'org-bot-dashboard-activity-secondary', secondary));
    item.appendChild(dd); parent.appendChild(item);
  }

  function renderActivityMetrics(parent, activity) {
    var values = activity && activity.summary || {};
    var metrics = el('dl', 'org-bot-dashboard-activity-metrics');
    activityMetric(metrics, 'invocations', tr('记录调用', 'Recorded calls'), activityNumber(values.invocations));
    activityMetric(metrics, 'completed', tr('执行返回', 'Execution returned'), activityNumber(values.completed));
    activityMetric(metrics, 'failed', tr('执行失败', 'Execution failed'), activityNumber(values.failed));
    activityMetric(metrics, 'canceled', tr('已取消', 'Canceled'), activityNumber(values.canceled));
    activityMetric(metrics, 'interrupted', tr('已中断', 'Interrupted'), activityNumber(values.interrupted));
    activityMetric(metrics, 'active', tr('未记录终态', 'No terminal outcome recorded'), activityNumber(values.active));
    var durationCount = hasValue(values.measuredDurationCount) ? activityNumber(values.measuredDurationCount) : tr('未知', 'Unknown');
    var completedCount = hasValue(values.completed) ? activityNumber(values.completed) : tr('未知', 'Unknown');
    activityMetric(metrics, 'duration', tr('测得平均耗时', 'Measured average duration'), durationLabel(values.averageDurationMs),
      tr('测量样本 / 执行返回：', 'Measured / returned: ') + durationCount + ' / ' + completedCount);
    if (hasValue(values.modelRequests)) {
      activityMetric(metrics, 'model-requests', tr('模型请求（单独统计）', 'Model requests (separate)'), activityNumber(values.modelRequests));
    }
    parent.appendChild(metrics);
    parent.appendChild(el('p', 'org-bot-dashboard-activity-note', tr(
      '执行返回只表示执行器返回结果，不代表业务验收成功。',
      'Execution returned means the executor returned a result; it does not mean the work was accepted.'
    )));
  }

  function renderActivityTrend(parent, activity) {
    var trend = Array.isArray(activity && activity.trend) ? activity.trend : [];
    var section = el('section', 'org-bot-dashboard-activity-subsection');
    section.appendChild(el('h4', 'org-bot-dashboard-activity-subtitle', tr('每日调用', 'Calls by day')));
    if (!trend.length) {
      section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr('此范围没有可显示的每日趋势。', 'No daily trend is available for this range.')));
      parent.appendChild(section); return;
    }
    var max = trend.reduce(function (current, point) {
      return typeof point.invocations === 'number' && isFinite(point.invocations) ? Math.max(current, point.invocations) : current;
    }, 0);
    var table = document.createElement('table'); table.className = 'org-bot-dashboard-trend';
    var caption = el('caption', '', tr('所选范围内每天记录的调用次数。', 'Recorded invocation counts for each day in the selected range.'));
    table.appendChild(caption);
    var head = document.createElement('thead'), headRow = document.createElement('tr');
    [[tr('日期', 'Date'), 'date'], [tr('调用量', 'Calls'), 'calls'], [tr('覆盖', 'Coverage'), 'coverage']].forEach(function (item) {
      var th = el('th', '', item[0]); th.scope = 'col'; th.dataset.column = item[1]; headRow.appendChild(th);
    });
    head.appendChild(headRow); table.appendChild(head);
    var body = document.createElement('tbody');
    trend.forEach(function (point) {
      var row = document.createElement('tr');
      var dateCell = el('th', '', text(point.date, tr('未知日期', 'Unknown date'))); dateCell.scope = 'row'; row.appendChild(dateCell);
      var countCell = el('td', 'org-bot-dashboard-trend-count');
      var valueKnown = typeof point.invocations === 'number' && isFinite(point.invocations) && point.invocations >= 0;
      var track = el('span', 'org-bot-dashboard-trend-track'); track.setAttribute('aria-hidden', 'true');
      var bar = el('span', 'org-bot-dashboard-trend-bar');
      bar.style.width = (valueKnown && max > 0 ? Math.max(0, Math.min(100, point.invocations / max * 100)) : 0) + '%';
      track.appendChild(bar); countCell.appendChild(track);
      countCell.appendChild(el('span', 'org-bot-dashboard-trend-value', valueKnown ? number(point.invocations) : tr('未知', 'Unknown')));
      row.appendChild(countCell);
      var coverage = point.coverage === 'full' ? tr('完整', 'Full') : point.coverage === 'partial' ? tr('部分', 'Partial') : tr('无记录覆盖', 'No coverage');
      row.appendChild(el('td', 'org-bot-dashboard-trend-coverage', coverage));
      body.appendChild(row);
    });
    table.appendChild(body); section.appendChild(table); parent.appendChild(section);
  }

  function renderActivityBots(parent, activity, snapshot) {
    var rows = Array.isArray(activity && activity.bots) ? activity.bots : [];
    var section = el('section', 'org-bot-dashboard-activity-subsection');
    section.appendChild(el('h4', 'org-bot-dashboard-activity-subtitle', tr('Bot 调用', 'Bot calls')));
    if (!rows.length) {
      section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr('此范围没有已记录的 Bot 调用。', 'No Bot calls are recorded for this range.')));
      parent.appendChild(section); return;
    }
    var list = el('div', 'org-bot-dashboard-activity-bots');
    rows.forEach(function (item) {
      if (!item || !item.botId) return;
      var bot = botFor(snapshot, item.botId);
      var row = button('', 'org-bot-dashboard-activity-bot');
      row.dataset.activityBot = id(item.botId);
      row.appendChild(avatar(bot, 'list'));
      var copy = el('span', 'org-bot-dashboard-activity-bot-copy');
      copy.appendChild(el('strong', '', text(bot && bot.name, item.botId)));
      copy.appendChild(el('span', '', tr('区间调用', 'Calls in range')));
      row.appendChild(copy);
      row.appendChild(el('strong', 'org-bot-dashboard-activity-bot-count', activityNumber(item.invocations)));
      row.addEventListener('click', function () { selectBot(id(item.botId)); });
      list.appendChild(row);
    });
    section.appendChild(list); parent.appendChild(section);
  }

  function renderActivityPartners(parent, activity, snapshot) {
    var rows = Array.isArray(activity && activity.partners) ? activity.partners : [];
    var section = el('section', 'org-bot-dashboard-activity-subsection');
    section.appendChild(el('h4', 'org-bot-dashboard-activity-subtitle', tr('任务协作伙伴', 'Task collaboration partners')));
    section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr(
      '只统计有明确任务关联的去重伙伴关系；方向按当前 Bot 的委派关系记录。',
      'Counts deduplicated, explicitly linked task collaborations. Direction is relative to the selected Bot.'
    )));
    if (!rows.length) {
      section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr('此范围没有已记录的任务协作。', 'No task collaborations are recorded for this range.')));
      parent.appendChild(section); return;
    }
    var list = el('div', 'org-bot-dashboard-activity-partners');
    rows.forEach(function (partner) {
      if (!partner || !partner.botId) return;
      var bot = botFor(snapshot, partner.botId);
      var row = el('div', 'org-bot-dashboard-activity-partner');
      row.dataset.activityPartner = id(partner.botId);
      var identity = el('div', 'org-bot-dashboard-activity-partner-identity');
      identity.appendChild(avatar(bot, 'list'));
      identity.appendChild(el('strong', '', text(bot && bot.name, partner.botId)));
      row.appendChild(identity);
      var directions = el('div', 'org-bot-dashboard-activity-partner-direction');
      directions.appendChild(el('span', '', tr('收到', 'Incoming') + ' ' + activityNumber(partner.incoming)));
      directions.appendChild(el('span', '', tr('发出', 'Outgoing') + ' ' + activityNumber(partner.outgoing)));
      directions.appendChild(el('span', '', tr('任务对', 'Task pairs') + ' ' + activityNumber(partner.taskCount)));
      row.appendChild(directions);
      var results = el('div', 'org-bot-dashboard-activity-partner-results');
      results.appendChild(el('span', '', tr('执行返回', 'Execution returned') + ' ' + activityNumber(partner.completed)));
      results.appendChild(el('span', '', tr('执行失败', 'Execution failed') + ' ' + activityNumber(partner.failed)));
      results.appendChild(el('span', '', tr('已取消', 'Canceled') + ' ' + activityNumber(partner.canceled)));
      results.appendChild(el('span', '', tr('已中断', 'Interrupted') + ' ' + activityNumber(partner.interrupted)));
      results.appendChild(el('span', '', tr('结果未知', 'Outcome unknown') + ' ' + activityNumber(partner.unknownResults)));
      row.appendChild(results);
      var completion = el('div', 'org-bot-dashboard-activity-partner-completion');
      completion.appendChild(el('span', '', tr('用户验收标记', 'User completion check')));
      completion.appendChild(el('span', '', tr('确认', 'Confirmed') + ' ' + activityNumber(partner.completionConfirmed)));
      completion.appendChild(el('span', '', tr('未达成', 'Unmet') + ' ' + activityNumber(partner.completionUnmet)));
      completion.appendChild(el('span', '', tr('未知', 'Unknown') + ' ' + activityNumber(partner.completionUnknown)));
      row.appendChild(completion); list.appendChild(row);
    });
    section.appendChild(list); parent.appendChild(section);
  }

  function renderActivityCoverage(parent, activity) {
    var coverage = activity && activity.coverage || {};
    var section = el('section', 'org-bot-dashboard-activity-subsection org-bot-dashboard-activity-coverage');
    section.appendChild(el('h4', 'org-bot-dashboard-activity-subtitle', tr('覆盖范围', 'Coverage')));
    var facts = [];
    if (coverage.since) facts.push([tr('开始记录', 'Recording since'), date(coverage.since)]);
    if (coverage.retainedFrom) facts.push([tr('保留记录起点', 'Earliest retained record'), date(coverage.retainedFrom)]);
    if (coverage.truncated) facts.push([tr('保留上限', 'Retention limit'), tr('较早记录已裁剪', 'Earlier records were trimmed')]);
    if (coverage.partialDay) facts.push([tr('当前日期', 'Current day'), tr('尚未完整', 'Partial day')]);
    if (Array.isArray(coverage.gaps) && coverage.gaps.length) {
      facts.push([tr('覆盖缺口', 'Coverage gaps'), number(coverage.gaps.length)]);
    }
    facts.forEach(function (fact) {
      var row = el('div', 'org-bot-dashboard-activity-coverage-row');
      row.appendChild(el('span', '', fact[0])); row.appendChild(el('strong', '', fact[1])); section.appendChild(row);
    });
    section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr(
      '本视图仅统计当前可见的 Bot；已删除的伙伴不参与合计与排序。',
      'This view includes currently visible Bots; removed partners are excluded from its totals and rankings.'
    )));
    if (activity.status === 'ready' && !facts.length) {
      section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr('此查询没有报告覆盖缺口。', 'This query reported no coverage gaps.')));
    }
    parent.appendChild(section);
  }

  function renderActivity(snapshot) {
    var activity = snapshot.activity;
    var section = el('section', 'org-bot-dashboard-section org-bot-dashboard-activity');
    section.id = 'org-bot-dashboard-activity';
    section.appendChild(el('h3', 'org-bot-dashboard-section-title', tr('区间活动', 'Activity in range')));
    section.appendChild(renderActivityControls(activity, snapshot));
    section.appendChild(el('p', 'org-bot-dashboard-activity-range', dateRangeLabel(activity)));

    if (state.activityQueryError) {
      var error = el('p', 'org-bot-dashboard-activity-warning', state.activityQueryError);
      error.setAttribute('role', 'alert'); section.appendChild(error);
      return section;
    }
    if (state.query.scope === 'instance' && activity.status !== 'unavailable' && activity.status !== 'not-started' &&
        !selectedInstanceAvailable(activity, state.query)) {
      var invalidInstance = el('p', 'org-bot-dashboard-activity-warning', tr(
        '所选实例不再可用。请选择列表中的已记录实例。',
        'The selected instance is no longer available. Choose a recorded instance from the list.'
      ));
      invalidInstance.setAttribute('role', 'alert'); section.appendChild(invalidInstance);
      return section;
    }
    if (!activityMatchesCurrentQuery(snapshot)) {
      var pending = el('p', 'org-bot-dashboard-activity-pending', tr('正在读取所选范围…', 'Loading the selected range…'));
      pending.setAttribute('role', 'status'); pending.setAttribute('aria-live', 'polite'); section.appendChild(pending);
      return section;
    }
    if (activity.status === 'not-started') {
      var empty = el('p', 'org-bot-dashboard-activity-empty', tr('此版本尚未记录活动；数字未知，不代表零。', 'Activity has not been recorded yet; counts are unknown, not zero.'));
      empty.setAttribute('role', 'status'); section.appendChild(empty);
      renderActivityCoverage(section, activity);
      return section;
    }
    if (activity.status === 'unavailable') {
      var unavailable = el('p', 'org-bot-dashboard-activity-warning', tr('活动记录暂不可用；当前数字未知，不代表零。', 'Activity data is unavailable; counts are unknown, not zero.'));
      unavailable.setAttribute('role', 'alert'); section.appendChild(unavailable);
      renderActivityCoverage(section, activity);
      return section;
    }

    if (activity.status === 'degraded') {
      section.appendChild(el('p', 'org-bot-dashboard-activity-warning', tr(
        '覆盖不完整；下方计数可能低于实际记录。',
        'Coverage is incomplete; the counts below may be lower than actual activity.'
      )));
    }

    renderActivityMetrics(section, activity);
    renderActivityTrend(section, activity);
    renderActivityBots(section, activity, snapshot);
    renderActivityPartners(section, activity, snapshot);
    renderActivityCoverage(section, activity);
    return section;
  }

  function renderActivityLegacy(snapshot) {
    var details = document.createElement('details');
    details.className = 'org-bot-dashboard-activity-legacy';
    details.id = 'org-bot-dashboard-activity-legacy';
    var summaryNode = document.createElement('summary');
    summaryNode.textContent = tr('旧版累计与当前保留任务', 'Old-version totals and retained tasks');
    details.appendChild(summaryNode);
    details.appendChild(el('p', 'org-bot-dashboard-activity-note', tr(
      '旧版调用数为冻结的历史累计，与上方所选区间分开显示、不相加；任务数字是当前保留快照。',
      'Old-version call counts are frozen cumulative records, separate from the selected range and never added to it. Task counts are a current retained snapshot.'
    )));
    var values = summary(snapshot);
    var list = el('dl', 'org-bot-dashboard-activity-metrics org-bot-dashboard-activity-legacy-metrics');
    if (Object.prototype.hasOwnProperty.call(values, 'invocations')) {
      activityMetric(list, 'legacy-invocations', tr('旧版已记录累计', 'Old-version recorded cumulative'), activityNumber(values.invocations));
    }
    ['taskCount', 'activeTasks', 'startedTasks', 'doneTasks', 'failedTasks', 'canceledTasks', 'interruptedTasks', 'incomingDelegations', 'outgoingDelegations'].forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(values, key)) activityMetric(list, 'snapshot-' + key, metricLabels[key] || key, activityNumber(values[key]));
    });
    if (list.childNodes.length) details.appendChild(list);
    var coverage = renderCoverage(snapshot);
    if (coverage) details.appendChild(coverage);
    return details;
  }

  var fleetMetrics = [
    { key: 'invocations', label: tr('执行量', 'Calls') },
    { key: 'outgoing', label: tr('发出任务', 'Delegated') },
    { key: 'incoming', label: tr('收到任务', 'Received') },
    { key: 'partners', label: tr('伙伴数', 'Partners') },
    { key: 'tokens', label: tr('已知 tokens', 'Known tokens') },
    { key: 'issues', label: tr('异常率', 'Issue rate') },
    { key: 'modelRequests', label: tr('模型请求', 'Model requests') }
  ];

  function compactNumber(value) {
    if (!hasValue(value) || typeof value !== 'number' || !isFinite(value)) return tr('未知', 'Unknown');
    if (value >= 1000000000) return (value / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (value >= 1000000) return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return number(Math.round(value));
  }

  function percent(value) {
    if (!hasValue(value) || typeof value !== 'number' || !isFinite(value)) return tr('未知', 'Unknown');
    return Math.round(value * 100) + '%';
  }

  function fleetBot(snapshot, botId) {
    var fleet = snapshot && snapshot.activity && snapshot.activity.fleet;
    var rows = fleet && Array.isArray(fleet.bots) ? fleet.bots : [];
    for (var i = 0; i < rows.length; i++) if (id(rows[i] && rows[i].botId) === id(botId)) return rows[i];
    return null;
  }

  var HEALTH_LAYERS = ['bot', 'harness', 'model'];
  var HEALTH_LABELS = { bot: tr('Bot', 'Bot'), harness: tr('Harness', 'Harness'), model: tr('模型', 'Model') };
  var HEALTH_SHORT = { bot: 'B', harness: 'H', model: 'M' };
  var HEALTH_STATUS = {
    healthy: tr('正常', 'Healthy'),
    degraded: tr('待改善', 'Degraded'),
    unhealthy: tr('异常', 'Unhealthy'),
    unverified: tr('未验证', 'Unverified'),
    unchecked: tr('未检测', 'Not checked'),
    not_applicable: tr('不适用', 'N/A')
  };

  function healthStatusLabel(value) {
    return HEALTH_STATUS[value] || tr('未知', 'Unknown');
  }

  function healthScoreLabel(value) {
    return Number.isFinite(value) && value >= 0 && value <= 100 ? String(Math.round(value)) : '—';
  }

  function healthLayerFor(row, id) {
    return row && row.layers && row.layers[id] ? row.layers[id] : { status: 'unchecked', score: null, detailCode: '' };
  }

  function healthForBot(health, botId) {
    return health && health.byBot instanceof Map ? health.byBot.get(id(botId)) || null : null;
  }

  function healthStatusForLayer(row, id) {
    return healthLayerFor(row, id).status || 'unchecked';
  }

  function healthLayerSummary(counts) {
    counts = counts || {};
    var parts = [];
    if (counts.degraded) parts.push(tr(counts.degraded + ' 待改善', counts.degraded + ' degraded'));
    if (counts.unhealthy) parts.push(tr(counts.unhealthy + ' 异常', counts.unhealthy + ' failed'));
    if (counts.unverified) parts.push(tr(counts.unverified + ' 未验证', counts.unverified + ' unverified'));
    if (counts.unchecked) parts.push(tr(counts.unchecked + ' 未检测', counts.unchecked + ' not checked'));
    return parts.join(' · ') || tr('无异常记录', 'No issues');
  }

  function healthCodeLabel(code) {
    var labels = {
      binding_invalid: tr('Bot 绑定无效', 'Bot binding invalid'),
      wiring_missing: tr('Harness 不可用', 'Harness unavailable'),
      harness_locked: tr('Harness 运行锁未释放', 'Harness run lock is held'),
      harness_unavailable: tr('Harness 当前无法接入', 'Harness cannot be admitted'),
      harness_missing: tr('未检测到执行器程序', 'Executor is not installed'),
      executor_outcome_unknown: tr('上次执行结果未知', 'A prior outcome is unknown'),
      no_key: tr('缺少模型凭据', 'Model credential missing'),
      no_model: tr('未填写模型名称', 'Model name missing'),
      no_base_url: tr('服务地址缺失', 'Service address missing'),
      api_error: tr('模型服务拒绝请求', 'Provider rejected the request'),
      network: tr('无法连接模型服务', 'Cannot reach the provider'),
      timeout: tr('模型响应超时', 'Model timed out'),
      reply_empty: tr('模型没有返回文字', 'The model returned no text'),
      tool_missing: tr('模型没有发起工具调用', 'The model did not call the tool'),
      external_unsupported: tr('外部 Agent 未接入自检', 'External Agent is not probed'),
      native_unprobed: tr('CLI 登录与握手未验证', 'CLI login and handshake are unverified')
    };
    return labels[code] || '';
  }

  function healthProjectionFor(fleet) {
    if (!fleet || !Array.isArray(fleet.bots) || !state.healthRaw || !root.OpenBotFleetOfficeLink ||
        typeof root.OpenBotFleetOfficeLink.projectHealth !== 'function') return null;
    var visible = new Set(fleet.bots.map(function (bot) { return id(bot.botId); }));
    return root.OpenBotFleetOfficeLink.projectHealth(state.healthRaw, visible);
  }

  function fleetBotName(snapshot, botId) {
    var bot = botFor(snapshot, botId);
    return bot && bot.name ? bot.name : id(botId);
  }

  function fleetShortName(name) {
    var chars = Array.from(String(name || ''));
    return chars.length > 4 ? chars.slice(0, 4).join('') + '…' : chars.join('');
  }

  function fleetTokenTotal(bot) {
    var total = bot && bot.usage && bot.usage.tokens && bot.usage.tokens.total;
    return total && total.known > 0 && !total.overflow && typeof total.value === 'number' ? total.value : null;
  }

  function fleetUsageCoverage(bot) {
    var knownRuns = bot && hasValue(bot.knownUsageRuns) ? bot.knownUsageRuns : null;
    var missingRuns = bot && hasValue(bot.missingUsageRuns) ? bot.missingUsageRuns : null;
    if (knownRuns === null || missingRuns === null) return tr('未知', 'Unknown');
    var total = knownRuns + missingRuns;
    if (!total) return tr('无记录', 'No records');
    return tr('有报告 ', 'Reported ') + knownRuns + '/' + total;
  }

  function fleetCostLabel(bot) {
    var currencies = bot && bot.usage && bot.usage.cost && Array.isArray(bot.usage.cost.byCurrency)
      ? bot.usage.cost.byCurrency.filter(function (item) { return item && item.amount !== null && !item.overflow; })
      : [];
    if (!currencies.length) return tr('未知', 'Unknown');
    return currencies.map(function (item) {
      var amount = item.amount < 1 ? item.amount.toFixed(4) : item.amount.toFixed(2);
      return item.currency + ' ' + amount;
    }).join(' · ');
  }

  function fleetMetricValue(bot, key) {
    if (!bot) return null;
    if (key === 'invocations') return hasValue(bot.invocations) ? bot.invocations : null;
    if (key === 'modelRequests') return hasValue(bot.modelRequests) ? bot.modelRequests : null;
    if (key === 'outgoing') return hasValue(bot.outgoingTasks) ? bot.outgoingTasks : null;
    if (key === 'incoming') return hasValue(bot.incomingTasks) ? bot.incomingTasks : null;
    if (key === 'partners') return hasValue(bot.uniquePartnerCount) ? bot.uniquePartnerCount : null;
    if (key === 'tokens') return fleetTokenTotal(bot);
    if (key === 'issues') {
      if (!hasValue(bot.invocations) || bot.invocations < 3) return null;
      var issues = (bot.failed || 0) + (bot.interrupted || 0) + (bot.unknownResults || 0);
      return issues / bot.invocations;
    }
    return null;
  }

  function fleetMetricText(bot, key) {
    var value = fleetMetricValue(bot, key);
    if (value === null) return tr('未验证', 'Not verified');
    return key === 'issues' ? percent(value) : compactNumber(value);
  }

  function fleetMetricEvidence(bot, key) {
    if (key === 'issues') return tr('样本 ', 'Sample ') + number(bot.invocations || 0);
    if (key === 'tokens') return fleetUsageCoverage(bot);
    if (key === 'outgoing') return number(bot.uniquePartnerCount || 0) + tr(' 个伙伴', ' partners');
    if (key === 'incoming') return number(bot.uniquePartnerCount || 0) + tr(' 个伙伴', ' partners');
    if (key === 'partners') return tr('发出 ', 'Out ') + number(bot.outgoingTasks || 0) + ' · ' + tr('收到 ', 'In ') + number(bot.incomingTasks || 0);
    if (key === 'modelRequests') return number(bot.invocations || 0) + tr(' 次执行', ' calls');
    return number(bot.modelRequests || 0) + tr(' 模型请求', ' model requests');
  }

  function fleetMetricLabel(key) {
    for (var i = 0; i < fleetMetrics.length; i++) if (fleetMetrics[i].key === key) return fleetMetrics[i].label;
    return key;
  }

  function fleetSortedBots(fleet, key) {
    var rows = Array.isArray(fleet && fleet.bots) ? fleet.bots.slice() : [];
    rows.sort(function (a, b) {
      var left = fleetMetricValue(a, key), right = fleetMetricValue(b, key);
      if (left === null && right !== null) return 1;
      if (right === null && left !== null) return -1;
      if (left !== right) return right - left;
      return id(a.botId).localeCompare(id(b.botId));
    });
    return rows;
  }

  function fleetFocus(kind, value) {
    state.pendingFocus = kind + ':' + value;
  }

  function openHealth(botId, opener) {
    if (!root.OpenBotHealthCenter || typeof root.OpenBotHealthCenter.open !== 'function') return;
    root.OpenBotHealthCenter.open({ botId: id(botId), opener: opener || null });
  }

  function renderFleetHealthLayer(row, layerId) {
    var value = healthLayerFor(row, layerId);
    var status = value.status || 'unchecked';
    var node = el('div', 'org-bot-dashboard-fleet-health-layer is-' + status);
    node.dataset.healthLayer = layerId;
    node.dataset.healthStatus = status;
    node.appendChild(el('span', 'org-bot-dashboard-fleet-health-letter', HEALTH_SHORT[layerId]));
    node.appendChild(el('strong', '', healthScoreLabel(value.score)));
    node.title = HEALTH_LABELS[layerId] + ': ' + healthStatusLabel(status) +
      (value.score === null ? '' : ' · ' + value.score);
    return node;
  }

  function healthCell(row) {
    var cell = el('td', 'org-bot-dashboard-fleet-health');
    if (!row) {
      cell.textContent = tr('未读取', 'Not loaded');
      cell.classList.add('is-unavailable');
      return cell;
    }
    cell.dataset.healthBot = id(row.botId);
    cell.dataset.healthOverall = row.overall;
    var compact = el('span', 'org-bot-dashboard-fleet-health-compact');
    HEALTH_LAYERS.forEach(function (layerId) { compact.appendChild(renderFleetHealthLayer(row, layerId)); });
    cell.appendChild(compact);
    cell.setAttribute('aria-label', HEALTH_LAYERS.map(function (layerId) {
      var value = healthLayerFor(row, layerId);
      return HEALTH_LABELS[layerId] + ' ' + healthStatusLabel(value.status) +
        (value.score === null ? '' : ' ' + value.score);
    }).join(tr('；', '; ')));
    return cell;
  }

  function renderFleetHealth(fleet, snapshot) {
    var health = healthProjectionFor(fleet);
    var section = el('section', 'org-bot-dashboard-fleet-health-summary');
    section.id = 'org-bot-dashboard-fleet-health';
    var head = el('div', 'org-bot-dashboard-fleet-health-head');
    var copy = el('div', '');
    copy.appendChild(el('h4', 'org-bot-dashboard-activity-subtitle', tr('舰队健康', 'Fleet health')));
    copy.appendChild(el('p', 'org-bot-dashboard-activity-note', tr(
      'Bot 绑定、Harness 和模型连接分别计分；总体取最弱层。未验证不是 0 分，健康结论不会替代真实任务验收。',
      'Bot binding, Harness and model connection are scored independently; the weakest layer determines the overall state. Unverified is not zero, and health never replaces real task acceptance.'
    )));
    head.appendChild(copy);
    var actions = el('div', 'org-bot-dashboard-fleet-health-actions');
    if (health && health.at) actions.appendChild(el('span', 'org-bot-dashboard-fleet-health-at',
      tr('更新于 ', 'Updated ') + date(health.at)));
    var open = button('', 'org-bot-dashboard-fleet-health-open', tr('打开健康中心', 'Open health center'));
    open.addEventListener('click', function () { openHealth('', this); });
    actions.appendChild(open);
    head.appendChild(actions);
    section.appendChild(head);
    if (!health) {
      section.dataset.healthState = 'unavailable';
      section.appendChild(el('p', 'org-bot-dashboard-activity-pending', tr(
        '健康数据暂不可用；舰队排行与协作关系仍可查看。',
        'Health data is unavailable; fleet ranking and collaboration remain available.'
      )));
      return section;
    }
    section.dataset.healthState = health.summary.total ? 'ready' : 'empty';
    if (!health.summary.total) {
      section.appendChild(el('p', 'org-bot-dashboard-activity-pending', tr(
        '此范围没有可核查的健康记录。打开健康中心后可以检测 Bot。',
        'No verifiable health record is available in this range. Open the health center to check Bots.'
      )));
      return section;
    }
    var grid = el('div', 'org-bot-dashboard-fleet-health-grid');
    HEALTH_LAYERS.forEach(function (layerId) {
      var counts = health.summary.layers[layerId] || {};
      var card = el('div', 'org-bot-dashboard-fleet-health-card');
      card.dataset.healthMetric = layerId;
      var top = el('div', 'org-bot-dashboard-fleet-health-card-top');
      top.appendChild(el('span', '', HEALTH_LABELS[layerId]));
      var bad = (counts.unhealthy || 0) + (counts.degraded || 0);
      top.appendChild(el('strong', bad ? 'is-warning' : counts.healthy ? 'is-ok' : '',
        counts.healthy ? tr(counts.healthy + ' 正常', counts.healthy + ' OK') : tr('无正常记录', 'No healthy record')));
      card.appendChild(top);
      card.appendChild(el('p', '', healthLayerSummary(counts)));
      grid.appendChild(card);
    });
    var coverage = el('div', 'org-bot-dashboard-fleet-health-card is-coverage');
    var top = el('div', 'org-bot-dashboard-fleet-health-card-top');
    top.appendChild(el('span', '', tr('检测覆盖', 'Check coverage')));
    top.appendChild(el('strong', health.summary.unhealthy ? 'is-warning' : 'is-ok',
      number(health.summary.checked) + ' / ' + number(health.summary.total)));
    coverage.appendChild(top);
    coverage.appendChild(el('p', '', [
      health.summary.cooling ? tr('冷却 ' + health.summary.cooling, 'Cooling ' + health.summary.cooling) : '',
      health.summary.stale ? tr('已过期 ' + health.summary.stale, 'Stale ' + health.summary.stale) : '',
      health.summary.unverified ? tr('未验证 ' + health.summary.unverified, 'Unverified ' + health.summary.unverified) : ''
    ].filter(Boolean).join(' · ') || tr('无冷却或过期项', 'No cooling or stale items')));
    grid.appendChild(coverage);
    section.appendChild(grid);
    if (health.issues.length) {
      var issueLine = el('div', 'org-bot-dashboard-fleet-health-issues');
      issueLine.appendChild(el('strong', '', tr('需要处理 ', 'Needs attention ')));
      health.issues.slice(0, 3).forEach(function (row, index) {
        var chip = button('', 'org-bot-dashboard-fleet-health-issue', fleetBotName(snapshot, row.botId) +
          ' · ' + healthLayersShort(row));
        chip.addEventListener('click', function () {
          state.fleetBotId = row.botId;
          fleetFocus('fleet-bot', row.botId);
          render();
        });
        issueLine.appendChild(chip);
      });
      if (health.issues.length > 3) issueLine.appendChild(el('span', 'org-bot-dashboard-fleet-health-more',
        tr('还有 ' + (health.issues.length - 3) + ' 个', (health.issues.length - 3) + ' more')));
      section.appendChild(issueLine);
    }
    return section;
  }

  function healthLayersShort(row) {
    return HEALTH_LAYERS.map(function (layerId) {
      var value = healthLayerFor(row, layerId);
      return HEALTH_SHORT[layerId] + (value.score === null ? healthStatusLabel(value.status).slice(0, 2) : value.score);
    }).join(' ');
  }

  function renderFleetBotHealth(row) {
    var section = el('section', 'org-bot-dashboard-fleet-bot-health');
    section.dataset.healthBot = row ? id(row.botId) : '';
    var head = el('div', 'org-bot-dashboard-fleet-bot-health-head');
    head.appendChild(el('h5', '', tr('三层健康', 'Three-layer health')));
    var open = button('', 'org-bot-dashboard-fleet-health-open', tr('查看详情', 'View details'));
    open.addEventListener('click', function () { openHealth(state.fleetBotId, this); });
    head.appendChild(open);
    section.appendChild(head);
    if (!row) {
      section.dataset.healthState = 'unavailable';
      section.appendChild(el('p', 'org-bot-dashboard-activity-pending', tr(
        '这个 Bot 尚无健康检查记录。健康中心会分别检查 Bot 绑定、Harness 和模型连接。',
        'This Bot has no health record yet. The health center checks Bot binding, Harness and model connection separately.'
      )));
      return section;
    }
    section.dataset.healthState = row.overall;
    var meta = [
      tr('总体 ', 'Overall ') + healthStatusLabel(row.overall),
      row.checkedAt ? tr('最近检查 ', 'Last checked ') + date(row.checkedAt) : tr('尚未检查', 'Not checked'),
      row.cooling ? tr('冷却中', 'Cooling down') : '',
      row.stale ? tr('上次结果已过期', 'Last result is stale') : '',
      row.sharedWith > 1 ? tr('共享配置 ×' + row.sharedWith, 'Shared config ×' + row.sharedWith) : ''
    ].filter(Boolean).join(' · ');
    section.appendChild(el('p', 'org-bot-dashboard-fleet-bot-health-meta', meta));
    var grid = el('div', 'org-bot-dashboard-fleet-bot-health-grid');
    HEALTH_LAYERS.forEach(function (layerId) {
      var value = healthLayerFor(row, layerId);
      var card = el('div', 'org-bot-dashboard-fleet-bot-health-card is-' + value.status);
      card.dataset.healthLayer = layerId;
      card.dataset.healthStatus = value.status;
      card.appendChild(el('span', 'org-bot-dashboard-fleet-health-letter', HEALTH_SHORT[layerId]));
      var copy = el('span', 'org-bot-dashboard-fleet-bot-health-copy');
      copy.appendChild(el('strong', '', HEALTH_LABELS[layerId] + ' · ' + healthStatusLabel(value.status)));
      var reason = healthCodeLabel(value.detailCode);
      copy.appendChild(el('span', '', healthScoreLabel(value.score) + (reason ? ' · ' + reason : '')));
      card.appendChild(copy);
      grid.appendChild(card);
    });
    section.appendChild(grid);
    return section;
  }

  function renderFleetLeaderboard(fleet, snapshot, health) {
    var key = state.fleetMetric || 'invocations';
    var rows = fleetSortedBots(fleet, key);
    var section = el('section', 'org-bot-dashboard-fleet-subsection org-bot-dashboard-fleet-ranking');
    section.appendChild(el('h4', 'org-bot-dashboard-activity-subtitle', tr('Bot 排行榜', 'Bot leaderboard')));
    section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr(
      '按当前指标排序；零记录与未验证分开显示，缺失用量不会当成零。',
      'Sorted by the selected metric. Zero records and unverified values are shown separately; missing usage is never treated as zero.'
    )));
    if (!rows.length) {
      section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr('此范围没有可排行的 Bot。', 'No Bots can be ranked in this range.')));
      return section;
    }
    var wrap = el('div', 'org-bot-dashboard-fleet-table-wrap');
    var table = document.createElement('table');
    table.className = 'org-bot-dashboard-fleet-table';
    var caption = el('caption', '', tr('整个可见 Bot 舰队的排行榜。', 'Leaderboard across the visible Bot fleet.'));
    table.appendChild(caption);
    var head = document.createElement('thead'), headRow = document.createElement('tr');
    [[tr('排名', 'Rank'), 'rank'], [tr('Bot', 'Bot'), 'bot'], [fleetMetricLabel(key), 'metric'],
      [tr('发出 / 收到', 'Out / In'), 'direction'], [tr('伙伴', 'Partners'), 'partners'],
      [tr('三层健康', 'Health'), 'health'],
      [tr('失败 / 未知', 'Failed / unknown'), 'issues'], [tr('已知消耗', 'Known usage'), 'usage'],
      [tr('覆盖', 'Coverage'), 'coverage']].forEach(function (item) {
      var th = el('th', '', item[0]);
      th.scope = 'col';
      th.dataset.column = item[1];
      headRow.appendChild(th);
    });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = document.createElement('tbody');
    var limit = state.fleetShowAll ? rows.length : Math.min(rows.length, 15);
    for (var i = 0; i < limit; i++) {
      (function (bot, rank) {
        var row = document.createElement('tr');
        if (id(bot.botId) === id(state.fleetBotId)) row.className = 'is-selected';
        var rankCell = el('td', 'org-bot-dashboard-fleet-rank', number(rank));
        row.appendChild(rankCell);
        var botCell = document.createElement('th');
        botCell.scope = 'row';
        var open = button('', 'org-bot-dashboard-fleet-bot');
        open.dataset.fleetBot = id(bot.botId);
        open.setAttribute('aria-pressed', id(bot.botId) === id(state.fleetBotId) ? 'true' : 'false');
        open.setAttribute('aria-expanded', id(bot.botId) === id(state.fleetBotId) ? 'true' : 'false');
        open.setAttribute('aria-controls', 'org-bot-dashboard-fleet-detail');
        open.setAttribute('aria-label', tr('查看 ', 'View ') + fleetBotName(snapshot, bot.botId) + tr(' 的协作与消耗', ' collaboration and usage'));
        open.appendChild(avatar(botFor(snapshot, bot.botId), 'mini'));
        var copy = el('span', 'org-bot-dashboard-fleet-bot-copy');
        copy.appendChild(el('strong', '', fleetBotName(snapshot, bot.botId)));
        copy.appendChild(el('span', '', text(botFor(snapshot, bot.botId) && botFor(snapshot, bot.botId).harness, '')));
        open.appendChild(copy);
        open.addEventListener('click', function () {
          state.fleetBotId = id(bot.botId);
          fleetFocus('fleet-bot', id(bot.botId));
          render();
        });
        botCell.appendChild(open);
        row.appendChild(botCell);
        row.appendChild(el('td', 'org-bot-dashboard-fleet-metric',
          fleetMetricText(bot, key) + ' · ' + fleetMetricEvidence(bot, key)));
        row.appendChild(el('td', '', number(bot.outgoingTasks || 0) + ' / ' + number(bot.incomingTasks || 0)));
        row.appendChild(el('td', '', number(bot.uniquePartnerCount || 0)));
        row.appendChild(healthCell(healthForBot(health, bot.botId)));
        row.appendChild(el('td', '', number((bot.failed || 0) + (bot.interrupted || 0)) + ' / ' + number(bot.unknownResults || 0)));
        row.appendChild(el('td', 'org-bot-dashboard-fleet-usage',
          fleetTokenTotal(bot) === null ? tr('未知', 'Unknown') : compactNumber(fleetTokenTotal(bot)) + ' tokens'));
        row.appendChild(el('td', 'org-bot-dashboard-fleet-coverage', fleetUsageCoverage(bot)));
        body.appendChild(row);
      })(rows[i], i + 1);
    }
    table.appendChild(body);
    wrap.appendChild(table);
    section.appendChild(wrap);
    if (rows.length > 15) {
      var toggle = button('', 'org-bot-dashboard-fleet-toggle',
        state.fleetShowAll ? tr('只显示前 15 个', 'Show top 15') : tr('显示全部 ', 'Show all ') + rows.length);
      toggle.addEventListener('click', function () {
        state.fleetShowAll = !state.fleetShowAll;
        render();
      });
      section.appendChild(toggle);
    }
    return section;
  }

  function fleetPartnerRow(snapshot, partner, direction) {
    var row = el('div', 'org-bot-dashboard-fleet-partner');
    row.dataset.fleetPartner = id(partner.botId);
    row.appendChild(avatar(botFor(snapshot, partner.botId), 'mini'));
    var copy = el('span', 'org-bot-dashboard-fleet-partner-copy');
    copy.appendChild(el('strong', '', fleetBotName(snapshot, partner.botId)));
    copy.appendChild(el('span', '', direction));
    row.appendChild(copy);
    row.appendChild(el('strong', 'org-bot-dashboard-fleet-partner-count', number(partner.taskCount || 0)));
    return row;
  }

  function renderFleetBotDetail(fleet, snapshot, health) {
    var bot = fleetBot(snapshot, state.fleetBotId);
    if (!bot) return null;
    var section = el('section', 'org-bot-dashboard-fleet-detail');
    section.id = 'org-bot-dashboard-fleet-detail';
    var header = el('div', 'org-bot-dashboard-fleet-detail-head');
    var identity = el('div', 'org-bot-dashboard-fleet-detail-identity');
    identity.appendChild(avatar(botFor(snapshot, bot.botId), 'list'));
    var copy = el('div', '');
    copy.appendChild(el('strong', '', fleetBotName(snapshot, bot.botId)));
    var profile = botFor(snapshot, bot.botId);
    copy.appendChild(el('span', '', [text(profile && profile.roleLabel, 'Bot'),
      text(profile && profile.model, ''), text(profile && profile.harness, '')].filter(Boolean).join(' · ')));
    identity.appendChild(copy);
    header.appendChild(identity);
    var actions = el('div', 'org-bot-dashboard-fleet-detail-actions');
    var openProfile = button('', 'org-bot-dashboard-fleet-open-profile', tr('打开 Bot 数据', 'Open Bot data'));
    openProfile.addEventListener('click', function () { selectBot(bot.botId); });
    actions.appendChild(openProfile);
    var close = button('', 'org-bot-dashboard-fleet-close', tr('收起', 'Close'));
    close.setAttribute('aria-label', tr('收起 Bot 详情', 'Close Bot details'));
    close.addEventListener('click', function () {
      state.fleetBotId = '';
      render();
    });
    actions.appendChild(close);
    header.appendChild(actions);
    section.appendChild(header);
    section.appendChild(renderFleetBotHealth(healthForBot(health, bot.botId)));

    var metrics = el('dl', 'org-bot-dashboard-fleet-detail-metrics');
    [
      [tr('执行量', 'Calls'), number(bot.invocations || 0)],
      [tr('模型请求', 'Model requests'), number(bot.modelRequests || 0)],
      [tr('发出任务 / 关系', 'Delegated / relations'), number(bot.outgoingTasks || 0) + ' / ' + number(bot.outgoingRelations || 0)],
      [tr('收到任务 / 关系', 'Received / relations'), number(bot.incomingTasks || 0) + ' / ' + number(bot.incomingRelations || 0)],
      [tr('独立伙伴', 'Unique partners'), number(bot.uniquePartnerCount || 0)],
      [tr('执行返回 / 失败', 'Returned / failed'), number(bot.completed || 0) + ' / ' + number(bot.failed || 0)],
      [tr('结果未知', 'Outcome unknown'), number(bot.unknownResults || 0)],
      [tr('验收确认 / 未达成', 'Accepted / unmet'), number(bot.completionConfirmed || 0) + ' / ' + number(bot.completionUnmet || 0)],
      [tr('平均耗时', 'Average duration'), durationLabel(bot.averageDurationMs)],
      [tr('tokens 输入', 'Input tokens'), compactNumber(bot.usage && bot.usage.tokens.input.known > 0 ? bot.usage.tokens.input.value : null)],
      [tr('tokens 输出', 'Output tokens'), compactNumber(bot.usage && bot.usage.tokens.output.known > 0 ? bot.usage.tokens.output.value : null)],
      [tr('tokens 合计', 'Total tokens'), compactNumber(fleetTokenTotal(bot))],
      [tr('缓存命中', 'Cache hits'), compactNumber(bot.usage && bot.usage.cache.hit.known > 0 ? bot.usage.cache.hit.value : null)],
      [tr('实际报告成本', 'Reported cost'), fleetCostLabel(bot)],
      [tr('用量覆盖', 'Usage coverage'), fleetUsageCoverage(bot)]
    ].forEach(function (item) {
      var row = el('div', 'org-bot-dashboard-fleet-detail-metric');
      row.appendChild(el('dt', '', item[0]));
      row.appendChild(el('dd', '', item[1]));
      metrics.appendChild(row);
    });
    section.appendChild(metrics);

    var partners = el('div', 'org-bot-dashboard-fleet-detail-partners');
    var outgoing = el('div', 'org-bot-dashboard-fleet-detail-column');
    outgoing.appendChild(el('h5', '', tr('最常派任务给', 'Delegates most to')));
    if (Array.isArray(bot.topOutgoing) && bot.topOutgoing.length) {
      bot.topOutgoing.forEach(function (partner) {
        outgoing.appendChild(fleetPartnerRow(snapshot, partner, tr('发出', 'Outgoing')));
      });
    } else outgoing.appendChild(el('p', 'org-bot-dashboard-activity-note', tr('此范围没有明确派单记录。', 'No explicit delegation is recorded in this range.')));
    partners.appendChild(outgoing);
    var incoming = el('div', 'org-bot-dashboard-fleet-detail-column');
    incoming.appendChild(el('h5', '', tr('最常收到谁的任务', 'Receives most from')));
    if (Array.isArray(bot.topIncoming) && bot.topIncoming.length) {
      bot.topIncoming.forEach(function (partner) {
        incoming.appendChild(fleetPartnerRow(snapshot, partner, tr('收到', 'Incoming')));
      });
    } else incoming.appendChild(el('p', 'org-bot-dashboard-activity-note', tr('此范围没有明确接单记录。', 'No explicit incoming task is recorded in this range.')));
    partners.appendChild(incoming);
    section.appendChild(partners);
    section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr(
      '“常找谁”是观测到的任务派发频率，不代表偏好或情感；样本过小时不据此推断关系。',
      '“Works most with” reflects observed task delegation frequency, not preference or sentiment. Small samples do not establish a relationship.'
    )));
    return section;
  }

  function renderFleetMatrix(fleet, snapshot) {
    var botIds = Array.isArray(fleet && fleet.matrix && fleet.matrix.botIds) ? fleet.matrix.botIds : [];
    var cells = Array.isArray(fleet && fleet.matrix && fleet.matrix.cells) ? fleet.matrix.cells : [];
    var section = el('section', 'org-bot-dashboard-fleet-subsection org-bot-dashboard-fleet-matrix');
    section.appendChild(el('h4', 'org-bot-dashboard-activity-subtitle', tr('协作关系矩阵', 'Collaboration matrix')));
    section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr(
      '行是委托方，列是承接方；数字是去重后的任务对数量。A → B 与 B → A 分开计数。',
      'Rows are delegators and columns are receivers. Numbers are deduplicated task pairs; A → B and B → A are counted separately.'
    )));
    if (!botIds.length) {
      section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr('此范围没有明确的任务协作边。', 'No explicit task collaboration edges are recorded in this range.')));
      return section;
    }
    var byCell = {};
    var max = 0;
    cells.forEach(function (cell) {
      byCell[cell.fromBotId + '|' + cell.toBotId] = cell;
      if (cell.taskCount > max) max = cell.taskCount;
    });
    var wrap = el('div', 'org-bot-dashboard-fleet-matrix-wrap');
    var table = document.createElement('table');
    table.className = 'org-bot-dashboard-fleet-matrix-table';
    var caption = el('caption', '', tr('Bot 之间的任务委托矩阵。', 'Task delegation matrix between Bots.'));
    table.appendChild(caption);
    var head = document.createElement('thead'), headRow = document.createElement('tr');
    var corner = el('th', '', tr('委托方 ↓ / 承接方 →', 'Delegator ↓ / Receiver →'));
    corner.scope = 'col';
    headRow.appendChild(corner);
    botIds.forEach(function (targetId) {
      var th = el('th', '', fleetShortName(fleetBotName(snapshot, targetId)));
      th.scope = 'col';
      th.title = fleetBotName(snapshot, targetId);
      headRow.appendChild(th);
    });
    head.appendChild(headRow);
    table.appendChild(head);
    var body = document.createElement('tbody');
    botIds.forEach(function (sourceId) {
      var row = document.createElement('tr');
      var th = el('th', '', fleetBotName(snapshot, sourceId));
      th.scope = 'row';
      th.title = fleetBotName(snapshot, sourceId);
      row.appendChild(th);
      botIds.forEach(function (targetId) {
        var td = document.createElement('td');
        var cell = byCell[sourceId + '|' + targetId];
        if (!cell || !cell.taskCount) {
          var empty = el('span', 'org-bot-dashboard-fleet-cell is-empty', '·');
          empty.setAttribute('aria-hidden', 'true');
          td.appendChild(empty);
        } else {
          var level = max ? Math.max(1, Math.ceil(cell.taskCount / max * 4)) : 1;
          var value = button('', 'org-bot-dashboard-fleet-cell is-level-' + level, number(cell.taskCount));
          value.dataset.fleetCell = sourceId + '|' + targetId;
          value.setAttribute('aria-expanded', state.fleetRelation === sourceId + '|' + targetId ? 'true' : 'false');
          value.setAttribute('aria-controls', 'org-bot-dashboard-fleet-relation-detail');
          value.setAttribute('aria-label', fleetBotName(snapshot, sourceId) + tr(' 派给 ', ' to ') +
            fleetBotName(snapshot, targetId) + tr('：', ': ') + number(cell.taskCount) + tr(' 个任务对', ' task pairs'));
          value.addEventListener('click', function () {
            state.fleetRelation = sourceId + '|' + targetId;
            fleetFocus('fleet-cell', sourceId + '|' + targetId);
            render();
          });
          td.appendChild(value);
        }
        row.appendChild(td);
      });
      body.appendChild(row);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    section.appendChild(wrap);
    if (botIds.length > 10) {
      section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr(
        '矩阵较宽，可横向滚动；表头固定。改用下方 Top 关系表也可以查看同一批数据。',
        'The matrix scrolls horizontally with a sticky header. The Top relationships table below exposes the same data.'
      )));
    }
    if (cells.length) {
      var top = el('div', 'org-bot-dashboard-fleet-top-relations');
      top.appendChild(el('h5', '', tr('Top 关系', 'Top relationships')));
      var list = el('div', 'org-bot-dashboard-fleet-relation-list');
      cells.slice(0, 8).forEach(function (cell) {
        var row = button('', 'org-bot-dashboard-fleet-relation');
        row.dataset.fleetRelationRow = cell.fromBotId + '|' + cell.toBotId;
        row.setAttribute('aria-expanded', state.fleetRelation === cell.fromBotId + '|' + cell.toBotId ? 'true' : 'false');
        row.setAttribute('aria-controls', 'org-bot-dashboard-fleet-relation-detail');
        row.appendChild(el('span', '', fleetBotName(snapshot, cell.fromBotId)));
        row.appendChild(el('span', 'org-bot-dashboard-fleet-relation-arrow', '→'));
        row.appendChild(el('span', '', fleetBotName(snapshot, cell.toBotId)));
        row.appendChild(el('strong', '', number(cell.taskCount)));
        row.addEventListener('click', function () {
          state.fleetRelation = cell.fromBotId + '|' + cell.toBotId;
          state.pendingFocus = 'fleet-relation';
          render();
        });
        list.appendChild(row);
      });
      top.appendChild(list);
      section.appendChild(top);
    }
    return section;
  }

  function renderFleetRelation(fleet, snapshot) {
    if (!state.fleetRelation) return null;
    var parts = state.fleetRelation.split('|');
    var cells = Array.isArray(fleet && fleet.matrix && fleet.matrix.cells) ? fleet.matrix.cells : [];
    var cell = null;
    for (var i = 0; i < cells.length; i++) if (cells[i].fromBotId === parts[0] && cells[i].toBotId === parts[1]) cell = cells[i];
    if (!cell) return null;
    var panel = el('section', 'org-bot-dashboard-fleet-relation-detail');
    panel.id = 'org-bot-dashboard-fleet-relation-detail';
    panel.tabIndex = -1;
    var header = el('div', 'org-bot-dashboard-fleet-detail-head');
    var title = el('div', '');
    title.appendChild(el('strong', '', fleetBotName(snapshot, cell.fromBotId) + ' → ' + fleetBotName(snapshot, cell.toBotId)));
    title.appendChild(el('span', '', tr('任务对 ', 'Task pairs ') + number(cell.taskCount)));
    header.appendChild(title);
    var close = button('', 'org-bot-dashboard-fleet-close', tr('收起', 'Close'));
    close.setAttribute('aria-label', tr('收起关系详情', 'Close relationship details'));
    close.addEventListener('click', function () {
      state.fleetRelation = '';
      render();
    });
    header.appendChild(close);
    panel.appendChild(header);
    var facts = [
      [tr('自主 / 用户 / 固定 / 未知', 'Autonomous / user / fixed / unknown'),
        number(cell.selection.autonomous) + ' / ' + number(cell.selection.user) + ' / ' + number(cell.selection.fixed) + ' / ' + number(cell.selection.unknown)],
      [tr('执行返回 / 失败 / 取消 / 中断', 'Returned / failed / canceled / interrupted'),
        number(cell.completed) + ' / ' + number(cell.failed) + ' / ' + number(cell.canceled) + ' / ' + number(cell.interrupted)],
      [tr('结果未知', 'Outcome unknown'), number(cell.unknownResults)],
      [tr('验收确认 / 未达成 / 未知', 'Accepted / unmet / unknown'),
        number(cell.completionConfirmed) + ' / ' + number(cell.completionUnmet) + ' / ' + number(cell.completionUnknown)],
      [tr('测得平均耗时', 'Measured average duration'), durationLabel(cell.averageDurationMs) + ' · ' + number(cell.measuredDurationCount || 0) + tr(' 个样本', ' samples')]
    ];
    var list = el('dl', 'org-bot-dashboard-fleet-detail-metrics');
    facts.forEach(function (fact) {
      var row = el('div', 'org-bot-dashboard-fleet-detail-metric');
      row.appendChild(el('dt', '', fact[0]));
      row.appendChild(el('dd', '', fact[1]));
      list.appendChild(row);
    });
    panel.appendChild(list);
    panel.appendChild(el('p', 'org-bot-dashboard-activity-note', tr(
      '执行返回不等于业务验收成功；验收标记仅在用户或任务明确记录时计入。',
      'Returned execution does not mean business acceptance. Completion marks count only when explicitly recorded.'
    )));
    return panel;
  }

  function renderFleetInsights(fleet, snapshot) {
    var insights = fleet && fleet.insights || {};
    var section = el('section', 'org-bot-dashboard-fleet-subsection org-bot-dashboard-fleet-insights');
    section.appendChild(el('h4', 'org-bot-dashboard-activity-subtitle', tr('关系洞察', 'Relationship insights')));
    section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr(
      '这些是观测提示，不是对 Bot 性格或偏好的判断；证据不足时不生成结论。',
      'These are observational prompts, not claims about a Bot’s personality or preference. Weak evidence yields no conclusion.'
    )));
    var cards = [
      [tr('协作枢纽', 'Hubs'), insights.hubs, function (item) {
        return number(item.outgoingTasks) + tr(' 个任务 · ', ' tasks · ') + number(item.uniquePartners) + tr(' 个伙伴', ' partners');
      }],
      [tr('交付瓶颈', 'Delivery bottlenecks'), insights.bottlenecks, function (item) {
        return number(item.outgoingTasks) + tr(' 个任务 · 失败 ', ' tasks · failed ') + number(item.failed) + tr(' · 未知 ', ' · unknown ') + number(item.unknown);
      }],
      [tr('资源热点', 'Resource hotspots'), insights.resourceHotspots, function (item) {
        return number(item.modelRequests) + tr(' 模型请求 / ', ' model requests / ') + number(item.invocations) + tr(' 次执行', ' calls');
      }],
      [tr('单向依赖', 'One-way dependencies'), insights.oneWay, function (item) {
        return fleetBotName(snapshot, item.fromBotId) + ' → ' + fleetBotName(snapshot, item.toBotId) + ' · ' + number(item.taskCount);
      }],
      [tr('互惠伙伴', 'Reciprocal partners'), insights.reciprocal, function (item) {
        return fleetBotName(snapshot, item.fromBotId) + ' ↔ ' + fleetBotName(snapshot, item.toBotId) + ' · ' + number(item.outgoing) + '/' + number(item.incoming);
      }],
      [tr('协作孤岛', 'Isolated Bots'), insights.isolated, function (item) {
        return number(item.invocations) + tr(' 次执行 · 无明确协作边', ' calls · no explicit collaboration edge');
      }]
    ];
    var shown = 0;
    var grid = el('div', 'org-bot-dashboard-fleet-insight-grid');
    cards.forEach(function (card) {
      var items = Array.isArray(card[1]) ? card[1] : [];
      if (!items.length) return;
      shown++;
      var box = el('div', 'org-bot-dashboard-fleet-insight');
      box.appendChild(el('h5', '', card[0]));
      var list = el('ul', '');
      items.forEach(function (item) {
        var li = document.createElement('li');
        var name = el('strong', '', fleetBotName(snapshot, item.botId || item.fromBotId));
        li.appendChild(name);
        li.appendChild(el('span', '', card[2](item)));
        list.appendChild(li);
      });
      box.appendChild(list);
      grid.appendChild(box);
    });
    if (shown) section.appendChild(grid);
    else section.appendChild(el('p', 'org-bot-dashboard-activity-note', tr('当前样本没有形成可报告的关系模式。', 'The current sample does not establish a reportable relationship pattern.')));
    return section;
  }

  function renderFleetUsage(fleet, snapshot) {
    var rows = Array.isArray(fleet && fleet.bots) ? fleet.bots.filter(function (bot) {
      return (bot.invocations || 0) + (bot.modelRequests || 0) > 0;
    }) : [];
    var details = document.createElement('details');
    details.className = 'org-bot-dashboard-fleet-usage';
    details.id = 'org-bot-dashboard-fleet-usage';
    var summaryNode = document.createElement('summary');
    summaryNode.textContent = tr('每个 Bot 的消耗明细（', 'Usage by Bot (') + rows.length + tr(' 个）', ')');
    details.appendChild(summaryNode);
    details.appendChild(el('p', 'org-bot-dashboard-activity-note', tr(
      '只显示模型或执行器实际报告的用量；缺失、未知与溢出不会写成零。共享模型连接的余额不重复计入每个 Bot。',
      'Shows usage actually reported by the model or executor. Missing, unknown and overflowed values are never written as zero. Shared model connection balances are not duplicated per Bot.'
    )));
    if (!rows.length) {
      details.appendChild(el('p', 'org-bot-dashboard-activity-note', tr('此范围没有可核对的用量记录。', 'No verifiable usage is recorded in this range.')));
      return details;
    }
    var wrap = el('div', 'org-bot-dashboard-fleet-table-wrap');
    var table = document.createElement('table');
    table.className = 'org-bot-dashboard-fleet-table org-bot-dashboard-fleet-usage-table';
    var head = document.createElement('thead'), headRow = document.createElement('tr');
    [[tr('Bot', 'Bot'), 'bot'], [tr('输入', 'Input'), 'input'], [tr('输出', 'Output'), 'output'],
      [tr('合计', 'Total'), 'total'], [tr('缓存命中', 'Cache hit'), 'cache'],
      [tr('成本', 'Cost'), 'cost'], [tr('覆盖', 'Coverage'), 'coverage']].forEach(function (item) {
      var th = el('th', '', item[0]);
      th.scope = 'col'; th.dataset.column = item[1]; headRow.appendChild(th);
    });
    head.appendChild(headRow); table.appendChild(head);
    var body = document.createElement('tbody');
    rows.forEach(function (bot) {
      var row = document.createElement('tr');
      var th = el('th', '', fleetBotName(snapshot, bot.botId)); th.scope = 'row'; row.appendChild(th);
      var usage = bot.usage || {};
      [['input', usage.tokens && usage.tokens.input], ['output', usage.tokens && usage.tokens.output],
        ['total', usage.tokens && usage.tokens.total], ['cache', usage.cache && usage.cache.hit]].forEach(function (item) {
        var metric = item[1];
        row.appendChild(el('td', '', metric && metric.known > 0 && !metric.overflow && typeof metric.value === 'number'
          ? compactNumber(metric.value) : tr('未知', 'Unknown')));
      });
      row.appendChild(el('td', 'org-bot-dashboard-fleet-usage', fleetCostLabel(bot)));
      row.appendChild(el('td', 'org-bot-dashboard-fleet-coverage', fleetUsageCoverage(bot)));
      body.appendChild(row);
    });
    table.appendChild(body); wrap.appendChild(table); details.appendChild(wrap);
    return details;
  }

  function renderFleet(snapshot) {
    var activity = snapshot && snapshot.activity;
    var fleet = activity && activity.fleet;
    if (!fleet || !Array.isArray(fleet.bots)) return null;
    if (!activityMatchesCurrentQuery(snapshot)) return null;
    var health = healthProjectionFor(fleet);
    var section = el('section', 'org-bot-dashboard-section org-bot-dashboard-fleet');
    section.id = 'org-bot-dashboard-fleet';
    var head = el('div', 'org-bot-dashboard-fleet-head');
    var copy = el('div', '');
    copy.appendChild(el('h3', 'org-bot-dashboard-section-title', tr('总控台 · Bot 舰队', 'Control room · Bot fleet')));
    copy.appendChild(el('p', 'org-bot-dashboard-section-note', tr(
      '排行榜、协作矩阵与消耗全部来自同一活动账本和同一时间范围。',
      'Leaderboard, collaboration matrix and usage all come from the same activity ledger and date range.'
    )));
    head.appendChild(copy);
    var control = el('label', 'org-bot-dashboard-fleet-control');
    control.appendChild(el('span', '', tr('排行依据', 'Rank by')));
    var select = document.createElement('select');
    select.id = 'org-bot-dashboard-fleet-metric';
    select.setAttribute('aria-label', tr('排行榜指标', 'Leaderboard metric'));
    fleetMetrics.forEach(function (item) {
      var option = el('option', '', item.label);
      option.value = item.key;
      select.appendChild(option);
    });
    select.value = state.fleetMetric || 'invocations';
    select.addEventListener('change', function () {
      state.fleetMetric = select.value;
      state.pendingFocus = 'fleet-metric';
      render();
    });
    control.appendChild(select);
    head.appendChild(control);
    section.appendChild(head);
    section.appendChild(renderFleetHealth(fleet, snapshot));
    section.appendChild(renderFleetLeaderboard(fleet, snapshot, health));
    var detail = renderFleetBotDetail(fleet, snapshot, health);
    if (detail) section.appendChild(detail);
    section.appendChild(renderFleetMatrix(fleet, snapshot));
    var relation = renderFleetRelation(fleet, snapshot);
    if (relation) section.appendChild(relation);
    section.appendChild(renderFleetInsights(fleet, snapshot));
    section.appendChild(renderFleetUsage(fleet, snapshot));
    return section;
  }

  function renderSpaces(snapshot) {
    var spaces = Array.isArray(snapshot && snapshot.spaces) ? snapshot.spaces : [];
    if (!spaces.length) return null;
    var section = el('section', 'org-bot-dashboard-section');
    section.id = 'org-bot-dashboard-spaces';
    section.appendChild(el('h3', 'org-bot-dashboard-section-title', tr('空间与职责',"Spaces and responsibilities")));
    var list = el('div', 'org-bot-dashboard-space-list');
    spaces.forEach(function (space) {
      if (!space || !space.id) return;
      var row = button('', 'org-bot-dashboard-space-row');
      row.dataset.dashboardSpace = id(space.id);
      row.dataset.dashboardSpaceId = id(space.id);
      var leader = botFor(snapshot, space.leaderBotId);
      row.appendChild(avatar(leader, 'mini'));
      var copy = el('span', 'org-bot-dashboard-space-copy');
      copy.appendChild(el('strong', 'org-bot-dashboard-space-name', text(space.name, tr('未命名空间',"Untitled space"))));
      var meta = [roleLabelForSpace(space,snapshot)];
      if (hasValue(space.memberCount)) meta.push(countLabel(space.memberCount,' 个 Bot','Bot'));
      if (leader && leader.name) meta.push(roleLabel(leader,'leader')+' · '+leader.name);
      copy.appendChild(el('span', 'org-bot-dashboard-space-meta', meta.join(' · ')));
      row.appendChild(copy);
      row.addEventListener('click', function () {
        if (typeof state.options.onOpenSpace === 'function') {
          state.options.onOpenSpace({ spaceId: id(space.id), botId: id(space.leaderBotId), mode: 'group' });
        }
      });
      list.appendChild(row);
    });
    section.appendChild(list);
    return section;
  }

  function renderCoverage(snapshot) {
    var coverage = snapshot && snapshot.coverage;
    if (!coverage || typeof coverage !== 'object') return null;
    var section = el('section', 'org-bot-dashboard-section org-bot-dashboard-coverage');
    section.id = 'org-bot-dashboard-coverage';
    section.appendChild(el('h3', 'org-bot-dashboard-section-title', tr('数据范围',"Data coverage")));
    var rows = el('div', 'org-bot-dashboard-coverage-list');
    if (coverage.callsSince) {
      var since = el('div', 'org-bot-dashboard-coverage-row');
      since.appendChild(el('span', 'org-bot-dashboard-detail-label', tr('调用记录',"Call records")));
      since.appendChild(el('span', 'org-bot-dashboard-detail-value', tr('从 ',"From ") + date(coverage.callsSince) + tr(' 起'," onward")));
      rows.appendChild(since);
    }
    if (coverage.callsStatus) {
      var status = el('div', 'org-bot-dashboard-coverage-row');
      status.appendChild(el('span', 'org-bot-dashboard-detail-label', tr('调用状态',"Call status")));
      status.appendChild(el('span', 'org-bot-dashboard-detail-value', ({
        'not-started': tr('尚未开始记录',"Recording has not started"), recorded: tr('已记录',"Recorded"), unavailable: tr('暂不可用',"Unavailable")
      })[coverage.callsStatus] || tr('暂不可用',"Unavailable")));
      rows.appendChild(status);
    }
    if (coverage.taskNote) {
      var taskNote = el('div', 'org-bot-dashboard-coverage-row');
      taskNote.appendChild(el('span', 'org-bot-dashboard-detail-label', tr('任务口径',"Task definition")));
      taskNote.appendChild(el('span', 'org-bot-dashboard-detail-value', snapshot.view==='leader' ? tr('现有任务没有可靠的空间归属，团队任务数暂未知；未将成员的其他任务计入空间。','Existing tasks lack reliable space attribution, so team task counts are unknown. Members’ other tasks are excluded.') : tr('仅当前 Bot 的已保留任务和当前已连接节点投影，按任务 ID 去重；不是完整历史。活动含排队与执行中，已开始以真实开始时间为准；完成表示执行返回，不代表业务验收成功。','Includes retained tasks for this Bot and projections from currently connected nodes, deduplicated by task ID. This is not a complete history. Active includes queued and running tasks. Started requires an actual start time. Completed means execution returned, rather than business acceptance.')));
      rows.appendChild(taskNote);
    }
    if (coverage.callsNote) {
      var callsNote = el('div', 'org-bot-dashboard-coverage-row');
      callsNote.appendChild(el('span', 'org-bot-dashboard-detail-label', tr('调用口径',"Call definition")));
      callsNote.appendChild(el('span', 'org-bot-dashboard-detail-value', snapshot.view==='leader' ? tr('仅统计当前成员在这些负责空间内、本机已记录且明确归属的调用尝试；不计其他空间或私聊。远端独立 Node、微信和 MCP 入口未汇总；旧历史未知，不等于零。','Counts locally recorded call attempts explicitly attributed to current members in these led spaces. Other spaces and direct chats are excluded. Independent remote nodes, WeChat, and MCP entry points are not aggregated. Earlier history is unknown, rather than zero.') : tr('仅统计本版起本机宿主已记录的当前 Bot 调用入口尝试，不是模型轮次或成功次数。远端独立 Node、微信和 MCP 入口未汇总；旧历史未知，不与任务、工具或 CLI 记录相加。','Counts call entry attempts recorded locally for this Bot since this version, rather than model turns or successes. Independent remote nodes, WeChat, and MCP entry points are not aggregated. Earlier history is unknown. These counts are not added to task, tool, or CLI records.')));
      rows.appendChild(callsNote);
    }
    if (coverage.taskScope === 'space-unattributed') appendMetricNote(rows, tr('部分任务没有空间归属，未按负责人或成员关系推算。',"Some tasks lack space attribution. Lead and member relationships are not used to infer it."), 'warning');
    var errorLabels = {
      ORGANIZATION_UNAVAILABLE: tr('组织资料暂不可安全读取，空间统计未知。',"Organization data cannot be safely read. Space statistics are unknown."),
      CALLS_UNAVAILABLE: tr('调用尝试暂不可读取；旧历史未知，不等于零。',"Call attempts are unavailable. Earlier history is unknown, rather than zero."),
      TASK_RECORDS_INCOMPLETE: tr('部分任务记录不完整，任务统计可能未知。',"Some task records are incomplete; task statistics may be unknown."),
      DUPLICATE_TASK_IDS: tr('任务记录存在重复编号，重复项未重复计数。',"Duplicate task IDs exist. Duplicates are counted once.")
    };
    if (Array.isArray(coverage.errors)) coverage.errors.forEach(function (message) {
      if (!message) return;
      appendMetricNote(rows, errorLabels[message] || tr('部分覆盖信息暂不可用。',"Some coverage information is unavailable."), 'warning');
    });
    if (rows.childNodes.length) section.appendChild(rows);
    else appendMetricNote(section, tr('当前没有额外的覆盖说明。',"No additional coverage notes."));
    return section;
  }

  function renderReady(snapshot) {
    var rootView = el('div', 'org-bot-dashboard');
    rootView.id = 'org-bot-dashboard';
    rootView.appendChild(renderToolbar(snapshot));
    var scroll = el('div', 'org-bot-dashboard-scroll');
    scroll.id = 'org-bot-dashboard-scroll';
    var content = el('div', 'org-bot-dashboard-content');
    var organization = snapshot && snapshot.organization || {};
    if (organization.status && organization.status !== 'ready') {
      var notice = el('div', 'org-bot-dashboard-organization');
      notice.id = 'org-bot-dashboard-organization';
      notice.setAttribute('role', organization.status === 'unavailable' ? 'alert' : 'status');
      notice.appendChild(el('strong', '', organization.status === 'uninitialized' ? tr('组织数据尚未初始化',"Organization data is not initialized") : tr('组织数据暂不可用',"Organization data unavailable")));
      notice.appendChild(el('span', '', organization.status==='uninitialized' ? tr('尚未创建工作空间。','No spaces have been created.') : tr('组织资料暂不可安全读取，空间统计未知。','Organization data cannot be safely read. Space statistics are unknown.')));
      content.appendChild(notice);
    }
    if (!requestedBotMatches(snapshot)) {
      var waitingForBot = el('p', 'org-bot-dashboard-activity-pending', tr(
        '正在读取所选 Bot 的数据…', 'Loading data for the selected Bot…'
      ));
      waitingForBot.setAttribute('role', 'status'); waitingForBot.setAttribute('aria-live', 'polite');
      content.appendChild(waitingForBot);
      scroll.appendChild(content); rootView.appendChild(scroll); return rootView;
    }
    var profile = renderProfile(snapshot);
    if (profile) content.appendChild(profile);
    var activityEnabled = hasActivity(snapshot);
    content.appendChild(renderSummary(snapshot));
    if (activityEnabled) {
      var fleet = renderFleet(snapshot);
      if (fleet) content.appendChild(fleet);
      content.appendChild(renderActivity(snapshot));
      content.appendChild(renderActivityLegacy(snapshot));
    } else {
      var bots = renderBots(snapshot);
      if (bots) content.appendChild(bots);
    }
    var spaces = renderSpaces(snapshot);
    if (spaces) content.appendChild(spaces);
    if (!activityEnabled) {
      var coverage = renderCoverage(snapshot);
      if (coverage) content.appendChild(coverage);
    }
    if (!profile && !bots && !spaces) {
      var empty = el('section', 'org-bot-dashboard-empty');
      empty.id = 'org-bot-dashboard-empty';
      empty.appendChild(el('strong', '', tr('当前没有可核查的数据',"No verifiable data available")));
      empty.appendChild(el('span', '', tr('真实调用、任务或职责出现后，这里会显示对应记录。',"Records appear here when calls, tasks, or responsibilities are recorded.")));
      content.appendChild(empty);
    }
    scroll.appendChild(content);
    rootView.appendChild(scroll);
    return rootView;
  }

  function render() {
    if (!state.host) return;
    captureScroll();
    var snapshot = state.snapshot;
    state.host.replaceChildren();
    var view;
    if (!snapshot || snapshot.loading) view = renderLoading();
    else if (snapshot.ok === false) view = renderError(snapshot);
    else view = renderReady(snapshot);
    state.root = view;
    state.host.appendChild(view);
    restoreInteraction();
  }

  function update(snapshot) {
    state.snapshot = snapshot && typeof snapshot === 'object' ? snapshot : { ok: false, message: tr('Bot 数据返回无效。',"Invalid Bot data returned.") };
    if (hasActivity(state.snapshot)) {
      state.query = initializeQuery(state.snapshot);
      if (state.pendingBotId && requestedBotMatches(state.snapshot)) state.pendingBotId = '';
      if (state.requireActivityEcho && requestedBotMatches(state.snapshot) &&
          activityRangeMatches(state.snapshot.activity, state.query) && activityRequestMatches(state.snapshot.activity, state.query)) {
        state.requireActivityEcho = false;
      }
    }
    render();
  }

  function updateHealth(snapshot) {
    state.healthRaw = snapshot && typeof snapshot === 'object' ? snapshot : null;
    render();
  }

  function mount(host, options) {
    if (!host) return null;
    state.host = host;
    state.options = options || {};
    state.query = copyQuery(state.options.query || {});
    state.pendingBotId = '';
    state.requireActivityEcho = false;
    state.activityQueryError = '';
    state.activityRequestVersion = 0;
    state.fleetMetric = 'invocations';
    state.fleetBotId = '';
    state.fleetRelation = '';
    state.fleetShowAll = false;
    state.healthRaw = state.options.health || null;
    update(state.options.snapshot || { loading: true });
    return {
      update: update,
      updateHealth: updateHealth,
      setQuery: function (query) { state.query = Object.assign({}, state.query, query || {}); if (hasActivity(state.snapshot)) state.query = initializeQuery(state.snapshot); },
      destroy: function () {
        if (state.host) state.host.replaceChildren();
        state.host = null;
        state.root = null;
        state.snapshot = null;
        state.options = {};
        state.query = {};
        state.scrollTop = 0;
        state.pendingFocus = '';
        state.pendingBotId = '';
        state.requireActivityEcho = false;
        state.activityQueryError = '';
        state.activityRequestVersion = 0;
        state.fleetMetric = 'invocations';
        state.fleetBotId = '';
        state.fleetRelation = '';
        state.fleetShowAll = false;
        state.healthRaw = null;
        state.healthProjection = null;
      }
    };
  }

  root.OpenBotBotDashboard = { mount: mount, update: update, destroy: function () {} };
}(window));
