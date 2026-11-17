(function (root) {
  'use strict';

  function tr(zh, en) {
    return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function' ? root.OpenBotI18n.t(zh, en) : zh;
  }

  var DETAIL = {
    binding_ok: tr('Bot 绑定有效', 'Bot binding is valid'),
    binding_invalid: tr('Bot 绑定无效，请重新选择执行器', 'Bot binding is invalid; choose an executor again'),
    binding_unverified: tr('Bot 绑定尚未检查', 'Bot binding has not been checked'),
    config_ok: tr('模型配置正常', 'Model configuration is OK'),
    no_provider: tr('未选择模型服务', 'No provider selected'),
    no_model: tr('未填写模型名称', 'No model configured'),
    no_key: tr('未配置模型凭据', 'No model credential'),
    no_base_url: tr('服务地址缺失', 'Missing service address'),
    wiring_ok: tr('Harness 已接线，未发现静态阻断', 'Harness is wired with no static blocker'),
    wiring_missing: tr('Harness 不可用', 'Harness unavailable'),
    wiring_unverified: tr('Harness 尚未检查', 'Harness has not been checked'),
    harness_locked: tr('Harness 保留了上次运行锁，需核查现场', 'Harness retains a prior run lock; inspect it'),
    harness_unavailable: tr('Harness 当前无法接入', 'Harness cannot be admitted'),
    harness_missing: tr('未检测到执行器程序', 'Executor program is not installed'),
    harness_detection_unavailable: tr('执行器检测不可用', 'Executor detection is unavailable'),
    native_unprobed: tr('CLI 执行器尚未接入自检', 'CLI executor is not probed here'),
    native_login_unverified: tr('已检测到执行器程序；登录与握手未验证',
      'Executor is installed; login and protocol handshake are unverified'),
    remote_unprobed: tr('节点端 Harness 尚未接入自检', 'Remote harness is not probed here'),
    executor_outcome_unknown: tr('上次执行结果未知，Harness 暂不能接新任务；请核对原执行记录并记录核对结果',
      'Last run outcome is unknown; the harness cannot admit a new run. Inspect the original execution record and record its verified outcome'),
    external_unsupported: tr('外部 AG-UI 执行器，尚未接入自检', 'External AG-UI executor; not probed here'),
    reply_ok: tr('已回复“你好”', 'Replied to hello'),
    reply_empty: tr('没有返回文字', 'Empty reply'),
    tool_ok: tr('能发起工具调用', 'Tool call works'),
    tool_missing: tr('没有发起工具调用', 'No tool call returned'),
    tool_other: tr('调用了错误的工具', 'Called an unexpected tool'),
    api_error: tr('模型服务拒绝请求', 'Provider rejected the request'),
    login_required: tr('需要重新登录', 'Login required'),
    network: tr('无法连接模型服务', 'Cannot reach the provider'),
    timeout: tr('模型响应超时', 'Model timed out'),
    invalid_response: tr('模型返回格式无效', 'Invalid model response'),
    truncated: tr('回答被截断', 'Response truncated'),
    response_too_large: tr('响应过大', 'Response too large'),
    invalid_url: tr('服务地址无效', 'Invalid service address'),
    aborted: tr('检测已取消', 'Check canceled'),
    agent_missing: tr('找不到绑定的智能体', 'Bound agent missing'),
    provider_invalid: tr('模型服务配置无效', 'Invalid provider configuration'),
    not_checked: tr('未检测', 'Not checked'),
    check_failed: tr('检测失败', 'Check failed'),
    unknown: tr('未知原因', 'Unknown reason'),
  };

  var STATUS = {
    healthy: tr('健康', 'Healthy'),
    degraded: tr('待改善', 'Degraded'),
    unhealthy: tr('不健康', 'Unhealthy'),
    unchecked: tr('待检测', 'Not checked'),
    stale: tr('已过期', 'Stale'),
    checking: tr('检测中', 'Checking'),
    unverified: tr('未验证', 'Unverified'),
    unknown: tr('未知', 'Unknown'),
    not_applicable: tr('不适用', 'N/A'),
  };

  var LAYERS = ['bot', 'harness', 'model'];
  var LAYER_LABEL = {
    bot: tr('Bot 绑定', 'Bot binding'),
    harness: tr('Harness', 'Harness'),
    model: tr('模型', 'Model'),
  };
  var CHECK_LABEL = {
    binding: tr('Bot 绑定', 'Bot binding'),
    config: tr('模型配置', 'Model config'),
    hello: tr('你好回复', 'Hello'),
    tools: tr('工具调用', 'Tools'),
    wiring: tr('Harness', 'Harness'),
  };
  var CHECK_ORDER = { bot: ['binding'], harness: ['wiring'], model: ['config', 'hello', 'tools'] };
  var FILTERS = [
    { id: 'all', label: tr('全部', 'All') },
    { id: 'issues', label: tr('异常', 'Issues') },
    { id: 'model', label: tr('模型异常', 'Model issues') },
    { id: 'harness', label: tr('Harness 异常', 'Harness issues') },
    { id: 'unverified', label: tr('未验证', 'Unverified') },
    { id: 'cooling', label: tr('冷却中', 'Cooling') },
  ];
  var STYLE_FILTER_IDS = ['challenger', 'builder', 'neutral', 'supporter', 'unlabeled'];
  var SORTS = [
    { id: 'status', label: tr('异常优先', 'Issues first') },
    { id: 'tokens', label: tr('Token 最多', 'Most tokens') },
    { id: 'replies', label: tr('发言最多', 'Most replies') },
    { id: 'partners', label: tr('互动最多', 'Most social') },
    { id: 'recent', label: tr('最近活跃', 'Recently active') },
  ];
  var VIEWS = [
    { id: 'cards', label: tr('卡片', 'Cards') },
    { id: 'list', label: tr('列表', 'List') },
  ];
  var VIEW_KEY = 'ob-health-view';
  var TAB_KEY = 'ob-health-tab';
  var TABS = [
    { id: 'bots', label: tr('BOT', 'BOTS') },
    { id: 'harness', label: tr('Harness', 'HARNESS') },
    { id: 'providers', label: tr('供应商·模型', 'PROVIDERS') },
  ];

  function initialTab() {
    try { return window.localStorage && TABS.some((tab) => tab.id === window.localStorage.getItem(TAB_KEY))
      ? window.localStorage.getItem(TAB_KEY) : 'bots'; }
    catch (_) { return 'bots'; }
  }

  function persistTab() {
    try { if (window.localStorage) window.localStorage.setItem(TAB_KEY, state.tab); } catch (_) {}
  }

  var LAMP_LABEL = {
    ok: tr('正常', 'OK'),
    warn: tr('待改善', 'Degraded'),
    bad: tr('异常', 'Unhealthy'),
    unknown: tr('未知', 'Unknown'),
  };

  function lampOfStatus(status) {
    if (status === 'healthy') return 'ok';
    if (status === 'degraded' || status === 'stale') return 'warn';
    if (status === 'unhealthy') return 'bad';
    return 'unknown';
  }

  function providerLamp(provider) {
    if (!provider || !Array.isArray(provider.models) || !provider.models.length) return 'unknown';
    var lamps = provider.models.map(function (model) {
      if (!model || !model.status || model.status === 'unprobed') return 'unknown';
      return lampOfStatus(model.status === 'healthy' ? 'healthy' : model.status);
    });
    if (lamps.indexOf('bad') >= 0) return 'bad';
    if (lamps.indexOf('warn') >= 0) return 'warn';
    if (lamps.indexOf('unknown') >= 0) return 'unknown';
    return 'ok';
  }

  function needsAttention(row) {
    var execution = row && row.execution || {};
    return Boolean(row && (row.stale || ['stale', 'checking', 'unchecked', 'unverified', 'unknown'].includes(row.status) || baseStatus(row) !== 'healthy' ||
      execution.blocked || execution.unknownOutcome || execution.pendingApproval));
  }

  function botScopeRows() {
    return state.rows.filter(function (row) {
      return matchesFilter(row) && matchesSearch(row) && (!state.attentionOnly || needsAttention(row));
    });
  }

  function tabCount(id) {
    if (id === 'bots') {
      return botScopeRows().filter(needsAttention).length;
    }
    if (id === 'harness') {
      return (state.harnesses || []).filter(function (row) { return row.lamp !== 'ok'; }).length;
    }
    var selected = (state.providers || []).find(function (row) { return row.id === state.drill; });
    return selected ? (selected.models || []).filter(function (model) { return lampOfStatus(model.status) !== 'ok'; }).length
      : (state.providers || []).filter(function (row) { return providerLamp(row) !== 'ok'; }).length;
  }

  function renderTabs() {
    if (!dom.tabs) return;
    if (dom.body) dom.body.setAttribute('aria-labelledby', 'ob-health-tab-' + state.tab);
    TABS.forEach(function (tab) {
      var node = dom.tabs.querySelector('[data-tab="' + tab.id + '"]');
      if (!node) {
        node = button(tab.label, 'ob-health-tab');
        node.dataset.tab = tab.id;
        node.id = 'ob-health-tab-' + tab.id;
        node.setAttribute('role', 'tab');
        node.setAttribute('aria-controls', 'ob-health-body');
        node.addEventListener('click', function () {
          if (state.tab === tab.id) return;
          state.tab = tab.id;
          state.drill = '';
          persistTab();
          setProgress('');
          if (dom.body) dom.body.scrollTop = 0;
          if (tab.id === 'providers') loadProviders();
          if (tab.id === 'harness') loadHarnesses();
          render();
        });
        node.addEventListener('keydown', function (event) {
          var index = TABS.findIndex(function (item) { return item.id === state.tab; });
          var next = -1;
          if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
          if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = TABS.length - 1;
          if (next < 0 || next === index) return;
          event.preventDefault();
          var target = dom.tabs.querySelector('[data-tab="' + TABS[next].id + '"]');
          if (target) { target.focus(); target.click(); }
        });
        dom.tabs.appendChild(node);
      }
      // Update in place so a render (including async tab load) never destroys
      // the focused tab button.
      node.textContent = '';
      node.appendChild(document.createTextNode(tab.label));
      node.setAttribute('aria-selected', state.tab === tab.id ? 'true' : 'false');
      node.tabIndex = state.tab === tab.id ? 0 : -1;
      node.classList.toggle('is-active', state.tab === tab.id);
      var count = tabCount(tab.id);
      if (count > 0) {
        var badge = el('span', 'ob-health-tabcount', String(count));
        badge.setAttribute('aria-label', tr(count + ' 项需要关注', count + ' need attention'));
        node.appendChild(badge);
      }
    });
  }

  function initialView() {
    try { return window.localStorage && window.localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'cards'; }
    catch (_) { return 'cards'; }
  }

  function persistView() {
    try { if (window.localStorage) window.localStorage.setItem(VIEW_KEY, state.view); } catch (_) {}
  }

  var state = {
    rows: [], at: 0, warning: '', loading: false, error: '',
    running: 0, filter: 'all', sort: 'status', search: '', focusBotId: '', attentionOnly: false, expanded: Object.create(null),
    view: initialView(),
    tab: initialTab(),
    drill: '',
    providers: null, providersAt: 0, providersLoading: false, providersError: '',
    harnesses: null, harnessesAt: 0, harnessesLoading: false, harnessesError: '',
    trends: Object.create(null),
    suggestions: Object.create(null), suggestionLoading: Object.create(null),
    suggestionActions: Object.create(null),
    scheduler: null, schedulerLoading: false, schedulerError: '',
    historySource: Object.create(null), requestSequence: 0, batchSequence: 0,
  };
  var dom = {};
  var office = { availability: null, readAt: 0 };
  var focusBefore = null;
  var keyHandler = null;
  var onCloseCallback = null;
  var schedulerFocusId = '';

  function detailText(code, meta) {
    var status = meta && Number(meta.httpStatus);
    if (code === 'api_error' && status) {
      if (status === 401 || status === 403) return tr('凭据被拒绝，请更新 API Key（HTTP ' + status + '）',
        'Credential rejected; update the API key (HTTP ' + status + ')');
      if (status === 404) return tr('模型或接口不存在（HTTP 404）', 'Model or endpoint not found (HTTP 404)');
      if (status === 408) return tr('模型服务响应超时（HTTP 408）', 'Provider timed out (HTTP 408)');
      if (status === 429) return tr('请求受限或额度不足（HTTP 429）', 'Rate limited or out of quota (HTTP 429)');
      if (status >= 500) return tr('模型服务暂时不可用（HTTP ' + status + '）',
        'Provider temporarily unavailable (HTTP ' + status + ')');
    }
    var text = DETAIL[code] || DETAIL.unknown;
    if (code === 'api_error' && status) text += '（HTTP ' + status + '）';
    return text;
  }

  function el(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = String(value);
    return node;
  }

  function button(label, className) {
    var node = el('button', className || 'ob-health-btn', label);
    node.type = 'button';
    return node;
  }

  function timeAgo(ms) {
    if (!ms) return tr('从未检测', 'Never checked');
    var diff = Date.now() - ms;
    if (diff < 60000) return tr('刚刚', 'just now');
    if (diff < 3600000) return Math.round(diff / 60000) + tr(' 分钟前', ' min ago');
    if (diff < 86400000) return Math.round(diff / 3600000) + tr(' 小时前', ' h ago');
    return Math.round(diff / 86400000) + tr(' 天前', ' d ago');
  }

  function elapsed(ms) {
    if (!Number.isFinite(ms) || ms < 0) return '';
    return ms < 1000 ? Math.round(ms) + 'ms' : (ms / 1000).toFixed(1) + 's';
  }

  function isCooling(row) {
    return Boolean(row && row.restUntil && row.restUntil > Date.now());
  }

  // Manually annotated personality; re-normalized here so a stale or damaged
  // host record can never render invented labels.
  function personalityOf(row) {
    var raw = row && row.personality;
    if (!raw) return null;
    if (typeof root.OpenBotPersonality === 'object' && root.OpenBotPersonality.normalizePersonality) {
      return root.OpenBotPersonality.normalizePersonality(raw);
    }
    return raw && typeof raw === 'object' && (raw.mbti || raw.interactionStyle || raw.note) ? raw : null;
  }

  function layer(row, id) {
    return row && row.layers && row.layers[id] ? row.layers[id] : { status: 'unchecked', score: null, detailCode: 'not_checked' };
  }

  function baseStatus(row) {
    return row && row.overall ? row.overall : row.status;
  }

  function displayStatus(row) {
    if (row.status === 'stale') {
      var base = STATUS[baseStatus(row)] || STATUS.unchecked;
      return tr('上次' + base + ' · 已过期', 'Last ' + base + ' · stale');
    }
    return STATUS[row.status] || STATUS[baseStatus(row)] || row.status;
  }

  function statusRank(row) {
    var status = baseStatus(row);
    if (status === 'unhealthy') return 0;
    if (status === 'degraded') return 1;
    if (status === 'unverified') return 2;
    if (row.status === 'stale') return 3;
    if (status === 'unchecked') return 4;
    if (row.status === 'checking') return 5;
    if (status === 'healthy') return 6;
    return 7;
  }

  function sortedRows(rows) {
    return rows.slice().sort(function (a, b) {
      var ua = usageOf(a);
      var ub = usageOf(b);
      if (state.sort === 'tokens') {
        if (ub.totalTokens !== ua.totalTokens) return ub.totalTokens - ua.totalTokens;
        if (ub.meteredRuns !== ua.meteredRuns) return ub.meteredRuns - ua.meteredRuns;
        if (ub.botReplies !== ua.botReplies) return ub.botReplies - ua.botReplies;
      } else if (state.sort === 'replies') {
        if (ub.botReplies !== ua.botReplies) return ub.botReplies - ua.botReplies;
        if (ub.totalMessages !== ua.totalMessages) return ub.totalMessages - ua.totalMessages;
        if (ub.totalTokens !== ua.totalTokens) return ub.totalTokens - ua.totalTokens;
      } else if (state.sort === 'partners') {
        if (ub.botInteractions !== ua.botInteractions) return ub.botInteractions - ua.botInteractions;
        if (ub.partnerCount !== ua.partnerCount) return ub.partnerCount - ua.partnerCount;
        if (ub.botReplies !== ua.botReplies) return ub.botReplies - ua.botReplies;
      } else if (state.sort === 'recent') {
        if (ub.lastActiveAt !== ua.lastActiveAt) return (ub.lastActiveAt || 0) - (ua.lastActiveAt || 0);
        if (ub.botReplies !== ua.botReplies) return ub.botReplies - ua.botReplies;
      }
      var rank = statusRank(a) - statusRank(b);
      if (rank) return rank;
      return String(a.name || a.id).localeCompare(String(b.name || b.id));
    });
  }

  function usageOf(row) {
    var u = row && row.usage && typeof row.usage === 'object' ? row.usage : {};
    var num = function (v) { return Number.isFinite(v) && v >= 0 ? Math.trunc(v) : 0; };
    return {
      botReplies: num(u.botReplies),
      userMessages: num(u.userMessages),
      totalMessages: num(u.totalMessages),
      invocations: num(u.invocations),
      meteredRuns: num(u.meteredRuns),
      inputTokens: num(u.inputTokens),
      outputTokens: num(u.outputTokens),
      totalTokens: num(u.totalTokens),
      cachedTokens: num(u.cachedTokens),
      partnerCount: num(u.partnerCount),
      botInteractions: num(u.botInteractions),
      topPartner: u.topPartner && typeof u.topPartner === 'object' ? {
        botId: String(u.topPartner.botId || ''),
        name: String(u.topPartner.name || u.topPartner.botId || ''),
        avatar: String(u.topPartner.avatar || ''),
        color: String(u.topPartner.color || ''),
        interactions: num(u.topPartner.interactions),
        delegations: num(u.topPartner.delegations),
        chatRooms: num(u.topPartner.chatRooms),
        chatTurns: num(u.topPartner.chatTurns),
      } : null,
      spaces: Array.isArray(u.spaces) ? u.spaces.slice(0, 3).map(function (space) {
        return space && typeof space === 'object' ? {
          spaceId: String(space.spaceId || ''),
          name: String(space.name || space.spaceId || ''),
          replies: num(space.replies),
          invocations: num(space.invocations),
          lastActiveAt: num(space.lastActiveAt) || null,
          role: ['leader', 'member', 'guest'].includes(space.role) ? space.role : 'guest',
        } : null;
      }).filter(Boolean) : [],
      spaceCount: num(u.spaceCount),
      lastActiveAt: num(u.lastActiveAt) || null,
    };
  }

  function formatExact(value) {
    var n = Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0;
    return n.toLocaleString('en-US');
  }

  function formatCompact(value) {
    var n = Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0;
    if (n >= 1000000) return (n / 1000000).toFixed(n >= 10000000 ? 1 : 2).replace(/\.?0+$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  // The pixel office (Habblaud plaza) renders presence from host state and
  // route lights from the availability read model. The list reuses exactly
  // those projections so the two views can never disagree.
  var PRESENCE_FALLBACK = {
    idle: tr('待命', 'Ready'), queued: tr('排队中', 'Queued'), thinking: tr('思考中', 'Thinking'),
    working: tr('执行中', 'Running'), waiting: tr('等你批准', 'Awaiting your approval'),
    done: tr('已完成', 'Completed'), error: tr('执行失败', 'Run failed'), interrupted: tr('已中断', 'Interrupted'),
  };
  var LIGHT_LABEL = {
    on: tr('路线可用', 'Route ready'), dim: tr('路线受限', 'Route degraded'),
    off: tr('路线不可用', 'Route unavailable'), unknown: tr('路线未知', 'Route unknown'),
  };

  function officeBridge() {
    var bridge = root.OpenBotHealthOfficeBridge;
    if (typeof bridge !== 'function') return null;
    try { return bridge() || null; } catch (_) { return null; }
  }

  function officePresence(row) {
    var ctx = officeBridge();
    var fn = ctx && typeof ctx.presenceFor === 'function' ? ctx.presenceFor : null;
    if (!fn) return null;
    try {
      var presence = fn(row.id);
      return presence && typeof presence.status === 'string' ? presence : null;
    } catch (_) { return null; }
  }

  function officeRoute(row) {
    var bots = office.availability && Array.isArray(office.availability.bots) ? office.availability.bots : [];
    return bots.find(function (item) { return item && item.botId === row.id; }) || null;
  }

  function presenceLabel(status) {
    var labels = root.OpenBotPresence && root.OpenBotPresence.labels;
    return (labels && labels[status]) || PRESENCE_FALLBACK[status] || status;
  }

  function loadOfficeAvailability() {
    if (!root.grokbot || typeof root.grokbot.officeAvailability !== 'function') return Promise.resolve();
    return Promise.resolve().then(function () { return root.grokbot.officeAvailability(); }).then(function (next) {
      office.availability = next && Array.isArray(next.bots) ? next : null;
      office.readAt = Date.now();
      if (dom.overlay && !dom.overlay.hidden && state.view === 'list') render();
    }).catch(function () { office.availability = null; });
  }

  function checkOf(row, id) {
    return (row.checks || []).find(function (item) { return item.id === id; });
  }

  function summarize() {
    var out = {
      total: botScopeRows().length, healthy: 0, degraded: 0, unhealthy: 0,
      unchecked: 0, unverified: 0, stale: 0, cooling: 0,
      usage: {
        botReplies: 0, userMessages: 0, invocations: 0, meteredRuns: 0,
        inputTokens: 0, outputTokens: 0, totalTokens: 0, cachedTokens: 0,
      },
      layers: {
        bot: { healthy: 0, degraded: 0, unhealthy: 0, unverified: 0 },
        harness: { healthy: 0, degraded: 0, unhealthy: 0, unverified: 0 },
        model: { healthy: 0, degraded: 0, unhealthy: 0, unverified: 0 },
      },
    };
    botScopeRows().forEach(function (row) {
      var status = baseStatus(row);
      if (!needsAttention(row) && status === 'healthy') out.healthy += 1;
      else if (status !== 'healthy' && out[status] !== undefined) out[status] += 1;
      if (row.status === 'stale') out.stale += 1;
      if (isCooling(row)) out.cooling += 1;
      var u = usageOf(row);
      out.usage.botReplies += u.botReplies;
      out.usage.userMessages += u.userMessages;
      out.usage.invocations += u.invocations;
      out.usage.meteredRuns += u.meteredRuns;
      out.usage.inputTokens += u.inputTokens;
      out.usage.outputTokens += u.outputTokens;
      out.usage.totalTokens += u.totalTokens;
      out.usage.cachedTokens += u.cachedTokens;
      LAYERS.forEach(function (id) {
        var statusOfLayer = row.stale || row.status === 'stale' ? 'unverified' : layer(row, id).status;
        if (out.layers[id][statusOfLayer] !== undefined) out.layers[id][statusOfLayer] += 1;
      });
    });
    return out;
  }

  function addSummaryChip(classSuffix, text, title) {
    var chip = el('span', 'ob-health-chip ob-health-chip-' + classSuffix, text);
    if (title) chip.title = title;
    dom.summary.appendChild(chip);
    return chip;
  }

  function layerSummary(id, counts) {
    var label = LAYER_LABEL[id];
    var parts = [];
    if (counts.healthy) parts.push(tr(counts.healthy + ' 正常', counts.healthy + ' OK'));
    if (counts.degraded) parts.push(tr(counts.degraded + ' 待改善', counts.degraded + ' degraded'));
    if (counts.unhealthy) parts.push(tr(counts.unhealthy + ' 异常', counts.unhealthy + ' failed'));
    if (counts.unverified) parts.push(tr(counts.unverified + ' 未验证', counts.unverified + ' unverified'));
    return label + ' ' + (parts.join(' · ') || tr('待检测', 'not checked'));
  }

  function renderSummary() {
    if (!dom.summary) return;
    dom.summary.textContent = '';
    var attention = tabCount(state.tab);
    var scopeAt = state.tab === 'providers' ? state.providersAt : state.tab === 'harness' ? state.harnessesAt : state.at;
    var scopeName = state.tab === 'bots' ? tr('当前 Bot 范围', 'Current Bot scope')
      : state.tab === 'harness' ? 'Harness' : state.drill ? tr('当前供应商模型', 'Models in this provider') : tr('供应商', 'Providers');
    var scopeChip = addSummaryChip('total', scopeName + ' · ' + tr('需关注 ' + attention, attention + ' need attention'));
    scopeChip.title = tr('异常、过期与未验证条目的并集；未知不会当作正常。', 'Union of issues, stale and unverified items; unknown is not healthy.');
    if (state.tab === 'bots') {
      var inspectAttention = button(state.attentionOnly ? tr('返回筛选范围', 'Return to scope') : tr('查看需关注', 'Show attention'), 'ob-health-btn ob-health-quiet');
      inspectAttention.dataset.action = 'show-attention';
      inspectAttention.setAttribute('aria-pressed', state.attentionOnly ? 'true' : 'false');
      inspectAttention.addEventListener('click', function () { state.attentionOnly = !state.attentionOnly; render(); });
      dom.summary.appendChild(inspectAttention);
    }
    if (scopeAt) addSummaryChip('muted', tr('读取于 ', 'Read ') + timeAgo(scopeAt), new Date(scopeAt).toLocaleString());
    if (state.tab !== 'bots') return;
    var s = summarize();
    addSummaryChip('total', tr('当前 ' + s.total + ' / 全部 ' + state.rows.length + ' 个 Bot', s.total + ' / ' + state.rows.length + ' Bots'));
    addSummaryChip('stat', tr('累计发言 ' + formatCompact(s.usage.botReplies) + ' 次', 'Replies ' + formatCompact(s.usage.botReplies)),
      tr('当前范围 Bot 累计发言 ' + formatExact(s.usage.botReplies) + ' 次 · 收到消息 ' + formatExact(s.usage.userMessages) +
        ' 条 · 记录调用 ' + formatExact(s.usage.invocations) + ' 次',
        'Total Bot replies: ' + formatExact(s.usage.botReplies) + ' · User messages: ' + formatExact(s.usage.userMessages) +
        ' · Invocations: ' + formatExact(s.usage.invocations)));
    var fleetTokenText = s.usage.meteredRuns > 0
      ? tr('累计 Token ' + formatCompact(s.usage.totalTokens), 'Tokens ' + formatCompact(s.usage.totalTokens))
      : ((s.usage.botReplies > 0 || s.usage.invocations > 0) ? tr('Token 未上报', 'Tokens unreported') : tr('累计 Token 0', 'Tokens 0'));
    var fleetTokenTitle = s.usage.meteredRuns > 0
      ? tr('已计量合计 ' + formatExact(s.usage.totalTokens) + ' Token（输入 ' + formatExact(s.usage.inputTokens) +
          ' · 输出 ' + formatExact(s.usage.outputTokens) +
          (s.usage.cachedTokens ? ' · 缓存命中 ' + formatExact(s.usage.cachedTokens) : '') +
          ' · 已计量 ' + formatExact(s.usage.meteredRuns) + ' 次调用）',
          'Metered total: ' + formatExact(s.usage.totalTokens) + ' tokens (in ' + formatExact(s.usage.inputTokens) +
          ' · out ' + formatExact(s.usage.outputTokens) + ' · ' + formatExact(s.usage.meteredRuns) + ' metered runs)')
      : tr('当前尚无模型接口上报的 Token 计量记录（CLI 订阅模式或早期对话可能不返回 Token 数量）',
          'No provider-reported token records yet');
    addSummaryChip('stat', fleetTokenText, fleetTokenTitle);
    if (state.focusBotId) {
      var focused = state.rows.find(function (row) { return row.id === state.focusBotId; });
      var focusedName = focused ? focused.name : state.focusBotId;
        var clear = button(tr('仅看 ' + focusedName + (focused ? '' : '（已不可用）') + ' ×', 'Only ' + focusedName + (focused ? '' : ' (unavailable)') + ' ×'), 'ob-health-chip ob-health-chip-focus');
        clear.setAttribute('aria-label', tr('清除 Bot 筛选：' + focusedName, 'Clear Bot filter: ' + focusedName));
        clear.addEventListener('click', function () {
          state.focusBotId = '';
          render();
        });
        dom.summary.appendChild(clear);
    }
    if (s.healthy) addSummaryChip('ok', tr('已验证正常 ' + s.healthy, s.healthy + ' verified healthy'));
    if (s.unhealthy) addSummaryChip('bad', tr('总异常 ' + s.unhealthy, s.unhealthy + ' unhealthy'));
    if (s.degraded) addSummaryChip('warn', tr('待改善 ' + s.degraded, s.degraded + ' degraded'));
    if (s.unverified) addSummaryChip('muted', tr('未验证 ' + s.unverified, s.unverified + ' unverified'));
    if (s.unchecked) addSummaryChip('muted', tr('待检测 ' + s.unchecked, s.unchecked + ' unchecked'));
    if (s.stale) addSummaryChip('muted', tr('证据过期 ' + s.stale, s.stale + ' stale'));
    if (s.cooling) addSummaryChip('warn', tr('冷却 ' + s.cooling, 'Cooling ' + s.cooling));
    LAYERS.forEach(function (id) {
      var count = s.layers[id];
      var suffix = count.unhealthy ? 'bad' : count.degraded || count.unverified ? 'warn' : count.healthy ? 'ok' : 'muted';
      addSummaryChip(suffix, layerSummary(id, count));
    });
  }

  function hasIdentity(row) {
    return Boolean(row && row.identityKey && !row.external);
  }

  function canCheck(row) {
    var execution = row && row.execution || {};
    var unknownRun = execution.unknownOutcome || (row && row.checks || []).some(function (check) {
      return check && check.detailCode === 'executor_outcome_unknown';
    });
    return Boolean(row && !unknownRun && (hasIdentity(row) || row.external));
  }

  function layerTitle(row, id) {
    var value = layer(row, id);
    var ids = CHECK_ORDER[id] || [];
    var first = ids.map(function (checkId) { return checkOf(row, checkId); }).find(function (item) {
      return item && (item.status === 'fail' || item.status === 'unverified');
    });
    return (value.status === 'healthy' ? '' : (STATUS[value.status] || '') + ' · ') +
      (first ? detailText(first.detailCode, first) : '');
  }

  function renderLayerSegment(row, id) {
    var value = layer(row, id);
    var status = value.status || 'unchecked';
    var node = el('div', 'ob-health-layer ob-health-layer-' + status);
    node.dataset.layer = id;
    node.dataset.status = status;
    node.title = layerTitle(row, id);
    var top = el('div', 'ob-health-layer-top');
    top.appendChild(el('span', 'ob-health-layer-label', LAYER_LABEL[id]));
    top.appendChild(el('span', 'ob-health-layer-state', STATUS[status] || status));
    node.appendChild(top);
    var score = Number.isFinite(value.score) ? String(value.score) : '—';
    node.appendChild(el('strong', 'ob-health-layer-score', score));
    return node;
  }

  function issueText(row) {
    if (row.status === 'stale') return tr('结果已过期；下列分数是上次检查，不代表当前状态。',
      'Results are stale; the values below are from the last check, not the current state.');
    var id = row.bottleneck;
    if (!id) return '';
    var value = layer(row, id);
    if (value.status === 'healthy') return '';
    var check = (CHECK_ORDER[id] || []).map(function (checkId) { return checkOf(row, checkId); }).find(function (item) {
      return item && (item.status === 'fail' || item.status === 'unverified');
    });
    if (!check) return LAYER_LABEL[id] + '：' + (STATUS[value.status] || value.status);
    var reason = LAYER_LABEL[id] + '：' + detailText(check.detailCode, check);
    if (check.reason) reason += ' · ' + check.reason;
    return reason;
  }

  function renderCheck(check) {
    var item = el('div', 'ob-health-check-row ob-health-check-' + check.status);
    var head = el('div', 'ob-health-check-head');
    head.appendChild(el('span', 'ob-health-check-name', CHECK_LABEL[check.id] || check.id));
    var status = check.status === 'pass' ? tr('通过', 'Pass') : check.status === 'fail' ? tr('失败', 'Fail') :
      check.status === 'skip' ? tr('未执行', 'Skipped') : tr('未验证', 'Unverified');
    head.appendChild(el('span', 'ob-health-check-result', status));
    item.appendChild(head);
    var reason = detailText(check.detailCode, check);
    if (check.ms) reason += ' · ' + elapsed(check.ms);
    if (check.reason) reason += ' · ' + check.reason;
    item.appendChild(el('p', 'ob-health-check-reason', reason));
    if (check.sample) item.appendChild(el('p', 'ob-health-sample', tr('回复示例：', 'Reply: ') + '“' + check.sample + '”'));
    return item;
  }

  function renderMiniAvatar(peer, identities) {
    var wrap = el('span', 'ob-health-partner-avatar');
    wrap.setAttribute('aria-hidden', 'true');
    var avatars = root.OpenBotAvatars;
    var peerId = peer && (peer.id || peer.botId);
    if (avatars && typeof avatars.markup === 'function') {
      wrap.innerHTML = avatars.markup(peer && peer.avatar, safeColor(peer && peer.color), {
        size: 'list',
        pose: 'idle',
        identity: identities && peerId ? identities.get(peerId) : undefined,
      });
      return wrap;
    }
    var fb = el('span', 'ob-health-partner-avatar-fallback',
      Array.from(String((peer && (peer.name || peerId)) || '?').trim())[0] || 'B');
    fb.style.background = safeColor(peer && peer.color);
    wrap.appendChild(fb);
    return wrap;
  }

  function spotlightBot(targetBotId) {
    if (!targetBotId || !dom.body) return;
    var targetRow = state.rows.find(function (item) { return item.id === targetBotId; });
    if (!targetRow) return;
    if (!matchesFilter(targetRow) || !matchesSearch(targetRow)) {
      state.focusBotId = '';
      state.filter = 'all';
      state.search = '';
      if (dom.search) dom.search.value = '';
      render();
    }
    var cards = dom.body.querySelectorAll('.ob-health-card, .ob-health-listrow');
    var found = null;
    for (var i = 0; i < cards.length; i += 1) {
      if (cards[i].dataset.botId === targetBotId) {
        found = cards[i];
        break;
      }
    }
    if (!found) return;
    if (typeof found.scrollIntoView === 'function') {
      found.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    found.classList.remove('is-spotlight');
    void found.offsetWidth;
    found.classList.add('is-spotlight');
    setTimeout(function () { found.classList.remove('is-spotlight'); }, 1400);
    var expandBtn = found.querySelector('.ob-health-expand');
    if (expandBtn && typeof expandBtn.focus === 'function') expandBtn.focus({ preventScroll: true });
  }

  function jumpToBot(targetBotId) {
    state.tab = 'bots';
    state.drill = '';
    state.focusBotId = targetBotId;
    state.filter = 'all';
    state.attentionOnly = false;
    state.search = '';
    if (dom.search) dom.search.value = '';
    persistTab();
    render();
    setTimeout(function () { spotlightBot(targetBotId); }, 0);
  }

  function renderUsageStrip(row, identities) {
    var u = usageOf(row);
    var strip = el('div', 'ob-health-usage');
    var repliesItem = el('div', 'ob-health-usage-item');
    repliesItem.dataset.metric = 'replies';
    repliesItem.appendChild(el('span', 'ob-health-usage-label', tr('发言', 'Replies')));
    repliesItem.appendChild(el('strong', 'ob-health-usage-val', tr(formatCompact(u.botReplies) + ' 次', formatCompact(u.botReplies))));
    var replySub = u.userMessages > 0
      ? tr('收到 ' + formatCompact(u.userMessages) + ' 条', formatCompact(u.userMessages) + ' in')
      : (u.invocations > 0 ? tr('调用 ' + formatCompact(u.invocations) + ' 次', formatCompact(u.invocations) + ' runs') : '');
    if (replySub) repliesItem.appendChild(el('span', 'ob-health-usage-sub', replySub));
    repliesItem.title = tr('累计发言（Bot 回复）' + formatExact(u.botReplies) + ' 次 · 收到用户消息 ' +
      formatExact(u.userMessages) + ' 条 · 记录调用 ' + formatExact(u.invocations) + ' 次',
      'Bot replies: ' + formatExact(u.botReplies) + ' · User messages: ' + formatExact(u.userMessages) +
      ' · Invocations: ' + formatExact(u.invocations));

    var tokenItem = el('div', 'ob-health-usage-item');
    tokenItem.dataset.metric = 'tokens';
    tokenItem.appendChild(el('span', 'ob-health-usage-label', 'Token'));
    if (u.meteredRuns > 0) {
      tokenItem.appendChild(el('strong', 'ob-health-usage-val', formatCompact(u.totalTokens)));
      tokenItem.appendChild(el('span', 'ob-health-usage-sub',
        tr('入 ' + formatCompact(u.inputTokens) + ' · 出 ' + formatCompact(u.outputTokens),
          'in ' + formatCompact(u.inputTokens) + ' · out ' + formatCompact(u.outputTokens))));
      tokenItem.title = tr('累计 Token ' + formatExact(u.totalTokens) + '（输入 ' + formatExact(u.inputTokens) +
        ' · 输出 ' + formatExact(u.outputTokens) +
        (u.cachedTokens ? ' · 缓存命中 ' + formatExact(u.cachedTokens) : '') +
        ' · 已计量 ' + formatExact(u.meteredRuns) + ' 次调用）',
        'Total tokens: ' + formatExact(u.totalTokens) + ' (in ' + formatExact(u.inputTokens) +
        ' · out ' + formatExact(u.outputTokens) + ' · ' + formatExact(u.meteredRuns) + ' metered runs)');
    } else if (u.botReplies > 0 || u.invocations > 0) {
      tokenItem.classList.add('is-muted');
      tokenItem.appendChild(el('strong', 'ob-health-usage-val', tr('未上报', 'Unreported')));
      tokenItem.title = tr('该 Bot 已有对话/调用记录，但所用执行器（如 CLI 订阅或早期会话）未返回 Token 计量数据',
        'Conversations exist, but the executor did not report token counts');
    } else {
      tokenItem.classList.add('is-muted');
      tokenItem.appendChild(el('strong', 'ob-health-usage-val', '0'));
      tokenItem.title = tr('尚无对话或 Token 消耗记录', 'No conversations or token usage yet');
    }

    strip.appendChild(repliesItem);
    strip.appendChild(tokenItem);
    if (u.topPartner && u.topPartner.name) {
      var partnerRow = u.topPartner.botId
        ? state.rows.find(function (item) { return item.id === u.topPartner.botId; })
        : null;
      var partnerNode = partnerRow
        ? button('', 'ob-health-partner ob-health-partner-jump')
        : el('div', 'ob-health-partner');
      if (partnerRow) partnerNode.textContent = '';
      partnerNode.dataset.partnerBotId = u.topPartner.botId;
      partnerNode.appendChild(el('span', 'ob-health-usage-label', tr('常搭档', 'Top peer')));
      partnerNode.appendChild(renderMiniAvatar(partnerRow || u.topPartner, identities));
      partnerNode.appendChild(el('strong', 'ob-health-partner-name', partnerRow ? partnerRow.name : u.topPartner.name));
      var pBits = [];
      if (u.topPartner.chatRooms > 0) pBits.push(tr('群聊 ' + u.topPartner.chatRooms + ' 场', u.topPartner.chatRooms + ' rooms'));
      if (u.topPartner.delegations > 0) pBits.push(tr('协作 ' + u.topPartner.delegations + ' 次', u.topPartner.delegations + ' tasks'));
      if (u.partnerCount > 1) pBits.push(tr('共 ' + u.partnerCount + ' 位伙伴', u.partnerCount + ' peers'));
      if (pBits.length) partnerNode.appendChild(el('span', 'ob-health-usage-sub', pBits.join(' · ')));
      if (partnerRow) {
        partnerNode.appendChild(el('span', 'ob-health-partner-arrow', '→'));
        partnerNode.setAttribute('aria-label', tr('定位常搭档 Bot：' + partnerRow.name, 'Locate peer Bot: ' + partnerRow.name));
        partnerNode.addEventListener('click', function () { spotlightBot(partnerRow.id); });
      }
      var peerDisplayName = partnerRow ? partnerRow.name : u.topPartner.name;
      partnerNode.title = tr('最常同场群聊或任务协作的 Bot：' + peerDisplayName +
        '（群聊/会议 ' + u.topPartner.chatRooms + ' 场、发言 ' + u.topPartner.chatTurns + ' 次、任务派单 ' + u.topPartner.delegations + ' 次' +
        (partnerRow ? ' · 点击定位到该 Bot 卡片' : '') + '）',
        'Top peer Bot: ' + peerDisplayName);
      strip.appendChild(partnerNode);
    }
    return strip;
  }

  function percentText(value) {
    return Number.isFinite(value) ? Math.round(value * 1000) / 10 + '%' : tr('数据不足', 'Not enough data');
  }

  function targetStamp(row) {
    var execution = row && row.execution || {};
    return JSON.stringify([row && row.identityKey || '', row && row.bindingIdentityKey || '',
      row && row.bindingRevision || '', row && row.layerIdentityKeys || {}, execution.runId || '', execution.requestId || '']);
  }

  function currentRow(botId) {
    return state.rows.find(function (row) { return row.id === botId; }) || null;
  }

  function evidenceIdentityKey(row, id) {
    row = row || {};
    var identities = row.layerIdentityKeys || {};
    var layers = row.layers || {};
    var selectedLayer = layers[id === 'binding' ? 'bot' : id] || layers[id] || {};
    // Empty is an intentional unknown identity, not a request to fall back.
    if (typeof identities[id] === 'string') return identities[id];
    if (typeof selectedLayer.identityKey === 'string') return selectedLayer.identityKey;
    return id === 'model' && typeof row.identityKey === 'string' ? row.identityKey : '';
  }

  var SOURCE_LABELS = {
    all: tr('全部来源（事件）', 'All sources (events)'), manual: tr('手动探测', 'Manual probes'),
    scheduled: tr('定时探测', 'Scheduled probes'), proactive: tr('主动探测', 'Proactive probes'),
    traffic: tr('真实运行观测', 'Business observations'), unknown: tr('来源未知', 'Unknown source'),
  };

  function sparkline(buckets, hours) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 240 28');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', tr('最近 ' + hours + ' 小时健康趋势，空白表示没有采样', 'Health trend for the last ' + hours + ' hours; gaps mean no samples'));
    svg.classList.add('ob-health-spark');
    function emptySpark() {
      var empty = document.createElementNS(ns, 'line');
      empty.setAttribute('x1', '0'); empty.setAttribute('x2', '240');
      empty.setAttribute('y1', '14'); empty.setAttribute('y2', '14');
      empty.setAttribute('class', 'ob-health-spark-empty');
      svg.appendChild(empty);
      return svg;
    }
    if (!Array.isArray(buckets) || !buckets.length) return emptySpark();
    var now = Date.now();
    var from = now - hours * 60 * 60 * 1000;
    // A bucket with only `unknown` samples is missing evidence, not degraded
    // health; omit it so the line keeps an honest gap.
    var scored = buckets.filter(function (bucket) {
      return (bucket.ok || 0) + (bucket.degraded || 0) + (bucket.down || 0) > 0;
    }).map(function (bucket) {
      var score = bucket.down > 0 ? 2 : bucket.degraded > 0 ? 1 : bucket.ok > 0 ? 0 : 1;
      return { at: bucket.hour + 30 * 60 * 1000, score: score };
    }).sort(function (a, b) { return a.at - b.at; });
    if (!scored.length) return emptySpark();
    var segments = [];
    var segment = [];
    var prev = null;
    scored.forEach(function (point) {
      if (prev && point.at - prev.at > 90 * 60 * 1000 && segment.length) {
        segments.push(segment);
        segment = [];
      }
      segment.push(point);
      prev = point;
    });
    if (segment.length) segments.push(segment);
    segments.forEach(function (list) {
      var d = list.map(function (point, index) {
        var x = Math.max(0, Math.min(240, ((point.at - from) / (hours * 60 * 60 * 1000)) * 240));
        var y = 4 + point.score * 9;
        return (index ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }).join(' ');
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', 'ob-health-sparkline');
      svg.appendChild(path);
      if (list.length === 1) {
        var circle = document.createElementNS(ns, 'circle');
        var only = list[0];
        circle.setAttribute('cx', String(Math.max(0, Math.min(240, ((only.at - from) / (hours * 60 * 60 * 1000)) * 240))));
        circle.setAttribute('cy', String(4 + only.score * 9));
        circle.setAttribute('r', '2');
        circle.setAttribute('class', 'ob-health-sparkdot');
        svg.appendChild(circle);
      }
    });
    return svg;
  }

  function renderTrendSection(row) {
    var section = el('section', 'ob-health-detail-section ob-health-detail-trends');
    section.dataset.trendFor = row.id;
    var head = el('div', 'ob-health-detail-head');
    head.appendChild(el('h4', 'ob-health-detail-title', tr('健康趋势 · 最近 72 小时', 'Health trend · last 72 hours')));
    var source = el('select', 'ob-health-history-source');
    source.setAttribute('aria-label', tr('健康历史证据来源', 'Health history source'));
    Object.keys(SOURCE_LABELS).forEach(function (id) {
      var option = el('option', '', SOURCE_LABELS[id]); option.value = id; source.appendChild(option);
    });
    source.value = state.historySource[row.id] || 'all';
    source.addEventListener('change', function () {
      state.historySource[row.id] = source.value;
      delete state.trends[row.id];
      loadTrend(row.id);
    });
    head.appendChild(source);
    section.appendChild(head);
    var evidenceLabel = row.identityKey ? tr('按各层当前身份 · 模型指纹 ', 'Current identity per layer · model fingerprint ') + row.identityKey.slice(-8)
      : tr('模型身份尚未确认；旧证据单独标注', 'Model identity unconfirmed; legacy evidence is labeled separately');
    section.appendChild(el('p', 'ob-health-evidence-scope', evidenceLabel + tr(
      ' · 保留事件统计；缺口不插值，不能重建请求成功率。',
      ' · retained events; gaps are not interpolated and request success rates cannot be reconstructed.')));
    ['binding', 'harness', 'model'].forEach(function (id) {
      var line = el('div', 'ob-health-trendrow');
      line.dataset.trendLayer = id;
      line.appendChild(el('span', 'ob-health-trendlabel', id === 'binding' ? tr('Bot 绑定', 'Bot binding') : id === 'harness' ? 'Harness' : tr('模型', 'Model')));
      var chart = el('span', 'ob-health-trendchart');
      chart.appendChild(sparkline([], 72));
      line.appendChild(chart);
      line.appendChild(el('span', 'ob-health-trendsummary', tr('正在读取…', 'Loading…')));
      section.appendChild(line);
    });
    return section;
  }

  function paintTrend(botId) {
    var cached = state.trends[botId];
    if (!cached || !cached.data || !cached.data.layers || cached.target !== targetStamp(currentRow(botId))) return;
    var section = document.querySelector('[data-trend-for="' + botId + '"]');
    if (!section) return;
    ['binding', 'harness', 'model'].forEach(function (id) {
      var line = section.querySelector('[data-trend-layer="' + id + '"]');
      if (!line) return;
      var layer = cached.data.layers[id] || {};
      var s = layer.summary || {};
      var selectedRow = currentRow(botId) || {};
      var expectedIdentity = evidenceIdentityKey(selectedRow, id);
      var scoped = (s.identityScope === 'selected_identity' || s.identityScope === 'unidentified') && s.identityKey === expectedIdentity;
      var chart = line.querySelector('.ob-health-trendchart');
      if (chart) {
        chart.textContent = '';
        chart.appendChild(sparkline(scoped ? layer.trend || [] : [], 72));
      }
      var summary = line.querySelector('.ob-health-trendsummary');
      if (summary) {
        var bits = [];
        if (!scoped) {
          summary.textContent = tr('旧证据 · 身份范围未确认，请刷新当前检测。', 'Legacy evidence · identity scope unconfirmed; refresh the current check.');
          return;
        }
        bits.push(tr('24h 保留事件 ' + (s.eventCount24h || s.samples24h || 0) + ' 条', (s.eventCount24h || s.samples24h || 0) + ' retained events / 24h'));
        bits.push(tr('已知事件正常占比 ' + percentText(s.availability24h), 'healthy share of known events ' + percentText(s.availability24h)));
        if (s.unknownEvents24h) bits.push(tr('状态未知 ' + s.unknownEvents24h + ' 条', s.unknownEvents24h + ' unknown-status events'));
        bits.push(Number.isFinite(s.latencyP95Ms24h) ? tr('事件延迟 P95 ', 'Event latency P95 ') + s.latencyP95Ms24h + 'ms'
          : tr('延迟未观测', 'Latency unobserved'));
        var sources = s.sources24h;
        if (sources && typeof sources === 'object') {
          var distribution = Object.keys(SOURCE_LABELS).filter(function (source) { return source !== 'all' && sources[source] > 0; })
            .map(function (source) { return SOURCE_LABELS[source] + ' ' + sources[source]; });
          bits.push(distribution.join(' / ') || tr('来源未观测', 'Sources unobserved'));
        } else bits.push(tr('来源分布不可重建', 'Source distribution unavailable'));
        if (s.identityScope === 'unidentified') bits.push(tr('身份未知的旧证据', 'Unidentified legacy evidence'));
        if (s.lastAt) bits.push(timeAgo(s.lastAt));
        summary.textContent = bits.join(' · ');
        summary.title = tr('仅当前身份、来源与时间窗内的保留事件；少于 5 条已知状态事件时不显示比例。P95 仅基于有延迟的保留事件。',
          'Retained events in this identity, source and time window only. Ratios need five known-status events; P95 uses only retained events with latency.');
      }
    });
  }

  function loadTrend(botId) {
    var row = currentRow(botId);
    if (!row) return;
    var target = targetStamp(row);
    var selectedSource = state.historySource[botId] || 'all';
    var cached = state.trends[botId];
    if (cached && !cached.error && cached.target === target && cached.source === selectedSource && (cached.loading || Date.now() - cached.at < 30000)) {
      paintTrend(botId);
      return;
    }
    var request = { loading: true, at: Date.now(), target: target, source: selectedSource };
    state.trends[botId] = request;
    var query = { botId: botId, hours: 72, identityKey: row.identityKey || '' };
    if (selectedSource !== 'all') query.source = selectedSource;
    root.grokbot.botHealthHistory(query).then(function (result) {
      if (state.trends[botId] !== request || targetStamp(currentRow(botId)) !== target) return;
      if (!result || result.ok === false) throw new Error((result && result.message) || 'history unavailable');
      state.trends[botId] = { at: Date.now(), data: result, target: target, source: selectedSource };
      paintTrend(botId);
    }).catch(function () {
      if (state.trends[botId] !== request || targetStamp(currentRow(botId)) !== target) return;
      state.trends[botId] = { at: Date.now(), error: true, target: target, source: selectedSource };
      var section = document.querySelector('[data-trend-for="' + botId + '"]');
      if (section) {
        section.querySelectorAll('.ob-health-trendsummary').forEach(function (node) {
          node.textContent = tr('历史暂不可用', 'History unavailable');
        });
      }
    });
  }

  function severityLabel(severity) {
    if (severity === 'critical') return tr('严重', 'Critical');
    if (severity === 'warn') return tr('注意', 'Warning');
    return tr('提示', 'Info');
  }

  var SUGGESTION_STATE_LABEL = {
    pending: tr('待处理', 'Pending'), acknowledged: tr('已知悉', 'Acknowledged'),
    snoozed: tr('已静音 · 未修复', 'Muted · unresolved'), handling: tr('处理中 · 待核验', 'Handling · unverified'),
    pending_verify: tr('处理待核验', 'Pending verification'), resolved: tr('已处理', 'Resolved'),
  };

  function suggestionState(suggestion) {
    var status = suggestion.state && typeof suggestion.state === 'object' ? suggestion.state.status : suggestion.state;
    if (status === 'resolved' && !(suggestion.ownerReceipt && suggestion.ownerReceipt.receiptId)) return 'pending_verify';
    return SUGGESTION_STATE_LABEL[status] ? status : 'pending';
  }

  function performSuggestionAction(botId, suggestion, kind, cached) {
    var key = botId + ':' + suggestion.intentId + ':' + (suggestion.revision || '');
    var action = state.suggestionActions[key] || {};
    if (action.pending) return;
    var row = currentRow(botId);
    if (!row || cached.target !== targetStamp(row)) return;
    action.pending = true;
    action.message = '';
    state.suggestionActions[key] = action;
    paintSuggestions(botId);
    if (!action.ids) action.ids = {};
    var payload = { botId: botId, intentId: suggestion.intentId, revision: suggestion.revision || '',
      kind: kind, identityKey: suggestion.target && suggestion.target.identityKey || '',
      actionId: action.ids[kind] || newBatchId('suggestion') };
    action.ids[kind] = payload.actionId;
    var promise;
    if (root.grokbot && typeof root.grokbot.botHealthSuggestionAction === 'function' && suggestion.revision) {
      promise = Promise.resolve().then(function () { return root.grokbot.botHealthSuggestionAction(payload); });
    } else if (kind === 'snooze' && root.grokbot && typeof root.grokbot.botHealthSuggestionAdopt === 'function') {
      promise = Promise.resolve().then(function () { return root.grokbot.botHealthSuggestionAdopt(payload); });
    } else promise = Promise.resolve({ ok: false, message: tr('处理入口暂不可用', 'Action channel unavailable') });
    promise.then(function (result) {
      if (state.suggestions[botId] !== cached || cached.target !== targetStamp(currentRow(botId))) return;
      if (!result || result.ok === false) {
        action.message = result && result.message || tr('状态未保存，请刷新核对。', 'State was not saved; refresh to verify.');
        return;
      }
      // A successful legacy adopt only means its cooldown was saved.
      var status = result.state && typeof result.state === 'object' ? result.state.status : result.state;
      if (!status && kind === 'snooze') status = 'snoozed';
      suggestion.ownerReceipt = result.ownerReceipt || result.state && result.state.ownerReceipt || null;
      suggestion.state = status || (kind === 'open_handler' ? 'handling' : 'pending_verify');
      action.message = result.message || SUGGESTION_STATE_LABEL[suggestionState(suggestion)] || '';
      if (kind === 'open_handler') {
        var bridge = typeof root.OpenBotHealthOwnerBridge === 'function' ? root.OpenBotHealthOwnerBridge() : null;
        if (!result.navigation || !bridge || typeof bridge.openHandler !== 'function') {
          action.message = tr('原处理入口暂不可用；尚未打开，也未修复。', 'Original entry unavailable; it was not opened and the finding is unresolved.');
        } else {
          return Promise.resolve(bridge.openHandler(result.navigation)).then(function (opened) {
            if (opened === false) action.message = tr('目标已不可用；请刷新核对原标识。', 'The target is unavailable; refresh to inspect its original identity.');
          });
        }
      }
    }).catch(function () {
      action.message = tr('结果尚未确认，请刷新核对；未标记已处理。', 'Result unconfirmed; refresh to verify. It has not been marked resolved.');
    }).finally(function () {
      action.pending = false;
      if (state.suggestions[botId] === cached) paintSuggestions(botId);
    });
  }

  function paintSuggestions(botId) {
    var cached = state.suggestions[botId];
    if (!cached || !cached.data || cached.target !== targetStamp(currentRow(botId))) return;
    var host = document.querySelector('[data-suggestions-for="' + botId + '"]');
    if (!host) return;
    var list = host.querySelector('.ob-health-suggestionlist');
    if (!list) return;
    list.textContent = '';
    var suggestions = (Array.isArray(cached.data.suggestions) ? cached.data.suggestions : []).concat(
      (Array.isArray(cached.data.suppressed) ? cached.data.suppressed : []).filter(function (item) { return item.reason === 'cooldown'; }));
    if (!suggestions.length) {
      list.appendChild(el('p', 'ob-health-empty', tr('本轮没有建议。', 'No suggestions in this pass.')));
      return;
    }
    suggestions.forEach(function (suggestion) {
      var card = el('article', 'ob-health-suggestion ob-health-suggestion-' + (suggestion.severity || 'info'));
      card.dataset.intent = suggestion.intentId;
      var head = el('div', 'ob-health-suggestion-head');
      head.appendChild(el('span', 'ob-health-severity', severityLabel(suggestion.severity)));
      head.appendChild(el('strong', 'ob-health-suggestion-title', tr(suggestion.titleZh, suggestion.titleEn)));
      var current = suggestionState(suggestion);
      head.appendChild(el('span', 'ob-health-suggestion-state', SUGGESTION_STATE_LABEL[current]));
      card.appendChild(head);
      card.appendChild(el('p', 'ob-health-suggestion-body', tr(suggestion.bodyZh, suggestion.bodyEn)));
      if (Array.isArray(suggestion.evidence) && suggestion.evidence.length) {
        var details = el('details', 'ob-health-evidence');
        details.appendChild(el('summary', '', tr('查看依据', 'Show evidence')));
        var code = el('code', '', suggestion.evidence.join('；'));
        details.appendChild(code);
        card.appendChild(details);
      }
      var actions = el('div', 'ob-health-suggestion-actions');
      var actionState = state.suggestionActions[botId + ':' + suggestion.intentId + ':' + (suggestion.revision || '')] || {};
      var handler = suggestion.handler || {};
      function actionButton(kind, label, className) {
        var node = button(label, className || 'ob-health-btn ob-health-quiet');
        node.dataset.action = kind;
        node.disabled = Boolean(actionState.pending || current === 'resolved');
        node.addEventListener('click', function () { performSuggestionAction(botId, suggestion, kind, cached); });
        return node;
      }
      if (handler.kind && handler.kind !== 'none') {
        actions.appendChild(actionButton('open_handler', handler.kind === 'owner_run' ? tr('核对原执行记录', 'Inspect original run') : tr('去处理', 'Handle'), 'ob-health-btn'));
      }
      var mute = actionButton('snooze', current === 'snoozed' ? tr('已静音 48h', 'Muted for 48h') : tr('静音 48h', 'Mute for 48h'), 'ob-health-btn ob-health-adopt ob-health-quiet');
      if (current === 'snoozed') mute.disabled = true;
      actions.appendChild(mute);
      if (suggestion.revision) {
        var more = el('details', 'ob-health-suggestion-more');
        more.appendChild(el('summary', '', tr('更多', 'More')));
        more.appendChild(actionButton('acknowledge', tr('记为已知悉', 'Acknowledge')));
        if (handler.kind && handler.kind !== 'none') more.appendChild(actionButton('verify', tr('核验处理结果', 'Verify resolution')));
        actions.appendChild(more);
      }
      var message = el('span', 'ob-health-suggestion-message', actionState.pending ? tr('正在核对…', 'Checking…') : actionState.message || '');
      message.setAttribute('role', 'status');
      actions.appendChild(message);
      card.appendChild(actions);
      list.appendChild(card);
    });
  }

  function loadSuggestions(botId) {
    var row = currentRow(botId);
    if (!row) return;
    var target = targetStamp(row);
    var cached = state.suggestions[botId];
    if (cached && !cached.error && cached.target === target && (cached.loading || Date.now() - cached.at < 30000)) {
      paintSuggestions(botId);
      return;
    }
    state.suggestionLoading[botId] = true;
    var request = { loading: true, at: Date.now(), target: target };
    state.suggestions[botId] = request;
    root.grokbot.botHealthSuggestions({ botId: botId }).then(function (result) {
      if (state.suggestions[botId] !== request || targetStamp(currentRow(botId)) !== target) return;
      if (!result || result.ok === false) throw new Error((result && result.message) || 'suggestions unavailable');
      var found = (result.bots || []).find(function (row) { return row.botId === botId; }) || { suggestions: [], suppressed: [] };
      state.suggestions[botId] = { at: Date.now(), data: found, target: target };
      state.suggestionLoading[botId] = false;
      paintSuggestions(botId);
    }).catch(function () {
      if (state.suggestions[botId] !== request || targetStamp(currentRow(botId)) !== target) return;
      state.suggestionLoading[botId] = false;
      state.suggestions[botId] = { at: Date.now(), error: true, target: target };
      var host = document.querySelector('[data-suggestions-for="' + botId + '"]');
      if (host) {
        var list = host.querySelector('.ob-health-suggestionlist');
        if (list) {
          list.textContent = '';
          list.appendChild(el('p', 'ob-health-empty', tr('建议暂不可用', 'Suggestions unavailable')));
        }
      }
    });
  }

  function renderSuggestionsSection(row) {
    var section = el('section', 'ob-health-detail-section ob-health-detail-suggestions');
    section.dataset.suggestionsFor = row.id;
    var head = el('div', 'ob-health-detail-head');
    head.appendChild(el('h4', 'ob-health-detail-title', tr('建议与处理', 'Suggestions & handling')));
    head.appendChild(el('span', 'ob-health-detail-score', tr('静音不代表修复；处理结果以原记录核验为准', 'Mute is not a fix; resolution requires original-owner verification')));
    section.appendChild(head);
    var list = el('div', 'ob-health-suggestionlist');
    if (state.suggestionLoading[row.id]) {
      list.appendChild(el('p', 'ob-health-empty', tr('正在分析本 Bot 的证据…', 'Analyzing local evidence…')));
    } else if (state.suggestions[row.id] && state.suggestions[row.id].error) {
      list.appendChild(el('p', 'ob-health-empty', tr('建议暂不可用', 'Suggestions unavailable')));
    } else {
      list.appendChild(el('p', 'ob-health-empty', tr('展开后读取建议…', 'Suggestions load when expanded…')));
    }
    section.appendChild(list);
    return section;
  }

  function ensureDetailData(row) {
    if (!row) return;
    loadTrend(row.id);
    loadSuggestions(row.id);
  }

  function renderDetail(row) {
    var detail = el('div', 'ob-health-detail');
    detail.id = 'ob-health-detail-' + row.id;
    detail.hidden = !state.expanded[row.id];

    var u = usageOf(row);
    var usageBox = el('section', 'ob-health-detail-section ob-health-detail-usage');
    var usageHead = el('div', 'ob-health-detail-head');
    usageHead.appendChild(el('h4', 'ob-health-detail-title', tr('会话与 Token 统计', 'Conversation & token stats')));
    var usageRight = el('div', 'ob-health-detail-actions');
    usageRight.appendChild(el('span', 'ob-health-detail-score',
      u.lastActiveAt ? tr('最近活跃：' + timeAgo(u.lastActiveAt), 'Last active: ' + timeAgo(u.lastActiveAt))
        : tr('暂无对话记录', 'No activity yet')));
    if (!row.external && typeof root.OpenBotSelectBotFromHealth === 'function') {
      var jumpChat = button(tr('去对话', 'Open chat'), 'ob-health-btn ob-health-detail-btn ob-health-jump-chat');
      jumpChat.addEventListener('click', function () {
        closeDialog({ restoreFocus: false });
        root.OpenBotSelectBotFromHealth(row.id);
      });
      usageRight.appendChild(jumpChat);
    }
    if (root.OpenBotOrgWorkspaces && typeof root.OpenBotOrgWorkspaces.open === 'function') {
      var jumpDash = button(tr('协作分析', 'Analytics'), 'ob-health-btn ob-health-detail-btn ob-health-jump-dashboard');
      jumpDash.addEventListener('click', function () {
        var openerEl = focusBefore || null;
        closeDialog({ restoreFocus: false });
        root.OpenBotOrgWorkspaces.open({ view: 'dashboard', botId: row.id, opener: openerEl });
      });
      usageRight.appendChild(jumpDash);
    }
    usageHead.appendChild(usageRight);
    usageBox.appendChild(usageHead);
    var usageGrid = el('div', 'ob-health-detail-usage-grid');
    var addStatCell = function (label, val, note) {
      var cell = el('div', 'ob-health-detail-stat');
      cell.appendChild(el('span', 'ob-health-detail-stat-label', label));
      cell.appendChild(el('strong', 'ob-health-detail-stat-val', val));
      if (note) cell.appendChild(el('span', 'ob-health-detail-stat-note', note));
      usageGrid.appendChild(cell);
    };
    addStatCell(tr('发言次数（Bot 回复）', 'Bot replies'), tr(formatExact(u.botReplies) + ' 次', formatExact(u.botReplies)),
      tr('收到用户消息 ' + formatExact(u.userMessages) + ' 条 · 共 ' + formatExact(u.totalMessages) + ' 条消息',
        formatExact(u.userMessages) + ' user msgs · ' + formatExact(u.totalMessages) + ' total'));
    addStatCell(tr('执行调用与计量', 'Invocations'), tr(formatExact(u.invocations) + ' 次', formatExact(u.invocations)),
      tr('其中 ' + formatExact(u.meteredRuns) + ' 次上报了 Token 明细',
        formatExact(u.meteredRuns) + ' runs reported token counts'));
    addStatCell(tr('累计总 Token', 'Total tokens'),
      u.meteredRuns > 0 ? formatExact(u.totalTokens) : ((u.botReplies > 0 || u.invocations > 0) ? tr('未上报', 'Unreported') : '0'),
      u.meteredRuns > 0
        ? tr('输入 ' + formatExact(u.inputTokens) + ' · 输出 ' + formatExact(u.outputTokens) +
            (u.cachedTokens ? ' · 缓存命中 ' + formatExact(u.cachedTokens) : ''),
            'In ' + formatExact(u.inputTokens) + ' · Out ' + formatExact(u.outputTokens))
        : tr('仅统计模型服务真实返回的 Token 数值', 'Counts actual provider-reported tokens only'));
    addStatCell(tr('常互动 Bot（群聊 / 协作）', 'Top peer Bot'),
      u.topPartner ? u.topPartner.name : tr('暂无', 'None yet'),
      u.topPartner
        ? tr('共 ' + formatExact(u.partnerCount) + ' 位伙伴 · 群聊 ' + formatExact(u.topPartner.chatRooms) +
            ' 场 · 协作派单 ' + formatExact(u.topPartner.delegations) + ' 次',
            formatExact(u.partnerCount) + ' peers · ' + formatExact(u.topPartner.chatRooms) + ' rooms · ' +
            formatExact(u.topPartner.delegations) + ' delegations')
        : tr('尚无群聊同场或跨 Bot 派单记录', 'No multi-Bot room or delegation records yet'));
    usageBox.appendChild(usageGrid);
    detail.appendChild(usageBox);
    detail.appendChild(renderTrendSection(row));
    detail.appendChild(renderSuggestionsSection(row));

    LAYERS.forEach(function (id) {
      var value = layer(row, id);
      var section = el('section', 'ob-health-detail-section');
      var head = el('div', 'ob-health-detail-head');
      head.appendChild(el('h4', 'ob-health-detail-title', LAYER_LABEL[id]));
      var score = Number.isFinite(value.score) ? String(value.score) : '—';
      var tail = el('div', 'ob-health-detail-actions');
      tail.appendChild(el('span', 'ob-health-detail-score', score + ' · ' + (STATUS[value.status] || value.status)));
      if (id === 'model' && row.providerId) {
        var providerJump = button(tr('供应商视图', 'Provider view'), 'ob-health-btn ob-health-detail-btn');
        providerJump.addEventListener('click', function () {
          state.tab = 'providers';
          state.drill = row.providerId;
          persistTab();
          loadProviders();
          if (dom.body) dom.body.scrollTop = 0;
          render();
        });
        tail.appendChild(providerJump);
      }
      head.appendChild(tail);
      section.appendChild(head);
      (CHECK_ORDER[id] || []).forEach(function (checkId) {
        var found = checkOf(row, checkId);
        if (found) section.appendChild(renderCheck(found));
      });
      detail.appendChild(section);
    });
    return detail;
  }

  function safeColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : '#5b8cff';
  }

  function renderAvatar(row, identities) {
    var wrap = el('span', 'ob-health-avatar');
    wrap.setAttribute('aria-hidden', 'true');
    var avatars = root.OpenBotAvatars;
    if (avatars && typeof avatars.markup === 'function') {
      var pose = row && row.status === 'checking' ? 'thinking' : 'idle';
      wrap.innerHTML = avatars.markup(row && row.avatar, safeColor(row && row.color), {
        size: 'list',
        pose: pose,
        identity: identities && row ? identities.get(row.id) : undefined,
      });
      return wrap;
    }
    var fallback = el('span', 'ob-health-avatar-fallback',
      Array.from(String((row && (row.name || row.id)) || '?').trim())[0] || 'B');
    fallback.style.background = safeColor(row && row.color);
    wrap.appendChild(fallback);
    return wrap;
  }

  function renderCard(row, identities) {
    var card = el('article', 'ob-health-card');
    card.dataset.botId = row.id;
    card.dataset.status = row.status;
    card.dataset.overall = baseStatus(row);
    card.dataset.cooling = isCooling(row) ? '1' : '0';
    if (state.expanded[row.id]) card.classList.add('is-expanded');

    var head = el('div', 'ob-health-card-head');
    head.appendChild(renderAvatar(row, identities));
    var identity = el('div', 'ob-health-identity');
    identity.appendChild(el('h3', 'ob-health-name', row.name));
    var meta = [
      row.inherited ? tr('默认配置', 'default') : row.providerId || tr('未选服务', 'no provider'),
      row.model || tr('未选模型', 'no model'),
      row.harness ? 'harness: ' + row.harness : '',
    ].filter(Boolean).join(' · ');
    identity.appendChild(el('p', 'ob-health-meta', meta));
    var traits = personalityOf(row);
    if (traits && root.OpenBotPersonality) {
      var badges = el('div', 'ob-health-badges');
      if (traits.mbti) badges.appendChild(el('span', 'ob-health-mbti', traits.mbti));
      if (traits.interactionStyle) {
        var chip = el('span', 'ob-health-stylechip ob-health-style-' + traits.interactionStyle,
          root.OpenBotPersonality.styleLabel(traits.interactionStyle));
        badges.appendChild(chip);
      }
      badges.title = tr('人工标注 · 非测评结果' + (traits.note ? ' · ' + traits.note : ''),
        'Manually annotated · not a psychometric result' + (traits.note ? ' · ' + traits.note : ''));
      identity.appendChild(badges);
    }
    var status = el('span', 'ob-health-status ob-health-status-' + (row.status === 'stale' ? 'stale' : baseStatus(row)),
      displayStatus(row));
    head.appendChild(identity);
    head.appendChild(status);
    card.appendChild(head);

    var layers = el('div', 'ob-health-layers');
    LAYERS.forEach(function (id) { layers.appendChild(renderLayerSegment(row, id)); });
    card.appendChild(layers);
    card.appendChild(renderUsageStrip(row, identities));

    var issue = issueText(row);
    if (issue) card.appendChild(el('p', 'ob-health-issue', issue));

    var bits = [];
    if (row.sharedWith > 1) bits.push(tr('共享 ×' + row.sharedWith, 'Shared ×' + row.sharedWith));
    if (isCooling(row)) {
      var seconds = Math.max(1, Math.ceil((row.restUntil - Date.now()) / 1000));
      bits.push(tr('冷却 ' + seconds + 's', 'Cooling ' + seconds + 's'));
    }
    var hello = checkOf(row, 'hello');
    var tools = checkOf(row, 'tools');
    if (hello && hello.ms) bits.push(tr('你好 ' + elapsed(hello.ms), 'Hello ' + elapsed(hello.ms)));
    if (tools && tools.ms) bits.push(tr('工具 ' + elapsed(tools.ms), 'Tools ' + elapsed(tools.ms)));
    if (row.checkedAt) bits.push(timeAgo(row.checkedAt));
    var foot = el('div', 'ob-health-card-foot');
    foot.appendChild(el('div', 'ob-health-foot-meta', bits.join(' · ') || tr('尚未检测', 'Not checked')));
    var actions = el('div', 'ob-health-card-actions');
    var expand = button(state.expanded[row.id] ? tr('收起', 'Hide') : tr('详情', 'Details'), 'ob-health-btn ob-health-expand');
    expand.setAttribute('aria-expanded', state.expanded[row.id] ? 'true' : 'false');
    expand.setAttribute('aria-controls', 'ob-health-detail-' + row.id);
    var run = button(row.status === 'checking' ? tr('检测中…', 'Checking…') : isCooling(row) ? tr('冷却中', 'Cooling down') : tr('检测', 'Check'),
      'ob-health-btn ob-health-card-run');
    run.disabled = !canCheck(row) || state.running > 0 || row.status === 'checking';
    if (isCooling(row)) run.title = tr('上次被限流或服务异常，检测仍受当前冷却与预算保护；请在冷却结束后重试。',
      'The last check was rate-limited or the provider failed. Checks remain subject to cooldown and budget; retry after cooldown.');
    expand.addEventListener('click', function () {
      state.expanded[row.id] = !state.expanded[row.id];
      card.classList.toggle('is-expanded', state.expanded[row.id]);
      var details = document.getElementById('ob-health-detail-' + row.id);
      if (details) details.hidden = !state.expanded[row.id];
      if (state.expanded[row.id]) ensureDetailData(row);
      expand.textContent = state.expanded[row.id] ? tr('收起', 'Hide') : tr('详情', 'Details');
      expand.setAttribute('aria-expanded', state.expanded[row.id] ? 'true' : 'false');
    });
    run.addEventListener('click', function () { runQueue([row], { force: true }); });
    var advice = button(tr('建议', 'Advice'), 'ob-health-btn ob-health-card-advice');
    advice.addEventListener('click', function () {
      if (!state.expanded[row.id]) {
        state.expanded[row.id] = true;
        card.classList.add('is-expanded');
        var details = document.getElementById('ob-health-detail-' + row.id);
        if (details) details.hidden = false;
        expand.textContent = tr('收起', 'Hide');
        expand.setAttribute('aria-expanded', 'true');
      }
      ensureDetailData(row);
      var target = card.querySelector('[data-suggestions-for="' + row.id + '"]');
      if (target && typeof target.scrollIntoView === 'function') target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    actions.appendChild(expand);
    actions.appendChild(advice);
    actions.appendChild(run);
    foot.appendChild(actions);
    card.appendChild(foot);
    card.appendChild(renderDetail(row));
    if (state.expanded[row.id]) setTimeout(function () { ensureDetailData(row); }, 0);
    return card;
  }

  function matchesFilter(row) {
    if (state.focusBotId && row.id !== state.focusBotId) return false;
    if (STYLE_FILTER_IDS.indexOf(state.filter) >= 0) {
      var traits = personalityOf(row);
      if (state.filter === 'unlabeled') return !traits;
      return Boolean(traits && traits.interactionStyle === state.filter);
    }
    if (state.filter === 'issues') return ['unhealthy', 'degraded'].includes(baseStatus(row));
    if (state.filter === 'model') return ['unhealthy', 'degraded'].includes(layer(row, 'model').status);
    if (state.filter === 'harness') return ['unhealthy', 'degraded'].includes(layer(row, 'harness').status);
    if (state.filter === 'unverified') return ['unverified', 'unchecked', 'checking', 'unknown'].includes(baseStatus(row));
    if (state.filter === 'cooling') return isCooling(row);
    return true;
  }

  function matchesSearch(row) {
    var query = String(state.search || '').trim().toLocaleLowerCase();
    if (!query) return true;
    var u = usageOf(row);
    var spaceNames = u.spaces.map(function (space) { return space.name; });
    var traits = personalityOf(row);
    var traitTexts = traits && root.OpenBotPersonality
      ? [traits.mbti, root.OpenBotPersonality.styleLabel(traits.interactionStyle), traits.note]
      : [];
    return [row.name, row.id, row.providerId, row.model, row.harness,
      u.topPartner && u.topPartner.name, displayStatus(row)].concat(spaceNames, traitTexts)
      .filter(Boolean).join(' ').toLocaleLowerCase().includes(query);
  }

  function renderViews() {
    if (!dom.views) return;
    dom.views.textContent = '';
    VIEWS.forEach(function (view) {
      var node = button(view.label, 'ob-health-view');
      node.dataset.view = view.id;
      node.setAttribute('aria-pressed', state.view === view.id ? 'true' : 'false');
      if (state.view === view.id) node.classList.add('is-active');
      node.addEventListener('click', function () {
        if (state.view === view.id) return;
        state.view = view.id;
        persistView();
        if (dom.body) dom.body.scrollTop = 0;
        if (state.view === 'list' && Date.now() - office.readAt > 15000) loadOfficeAvailability();
        render();
      });
      dom.views.appendChild(node);
    });
  }

  function renderFilters() {
    if (!dom.filters) return;
    dom.filters.textContent = '';
    FILTERS.forEach(function (filter) {
      var node = button(filter.label, 'ob-health-filter');
      node.dataset.filter = filter.id;
      node.setAttribute('aria-pressed', state.filter === filter.id ? 'true' : 'false');
      if (state.filter === filter.id) node.classList.add('is-active');
      node.addEventListener('click', function () {
        state.filter = filter.id;
        if (dom.body) dom.body.scrollTop = 0;
        render();
      });
      dom.filters.appendChild(node);
    });
    if (root.OpenBotPersonality) {
      var divider = el('span', 'ob-health-filterdivider');
      divider.setAttribute('aria-hidden', 'true');
      dom.filters.appendChild(divider);
      var unlabeled = button(tr('未标注', 'Unlabeled'), 'ob-health-filter');
      unlabeled.dataset.filter = 'unlabeled';
      unlabeled.setAttribute('aria-pressed', state.filter === 'unlabeled' ? 'true' : 'false');
      if (state.filter === 'unlabeled') unlabeled.classList.add('is-active');
      unlabeled.title = tr('只看还没有性格标注的 Bot', 'Only Bots without a personality annotation');
      unlabeled.addEventListener('click', function () {
        state.filter = 'unlabeled';
        if (dom.body) dom.body.scrollTop = 0;
        render();
      });
      dom.filters.appendChild(unlabeled);
      root.OpenBotPersonality.STYLES.forEach(function (styleId) {
        var node = button(root.OpenBotPersonality.styleLabel(styleId), 'ob-health-filter ob-health-filterstyle ob-health-filterstyle-' + styleId);
        node.dataset.filter = styleId;
        node.setAttribute('aria-pressed', state.filter === styleId ? 'true' : 'false');
        if (state.filter === styleId) node.classList.add('is-active');
        node.title = tr('只看「' + root.OpenBotPersonality.styleLabel(styleId) + '」交互风格的 Bot', 'Only ' + styleId + ' Bots');
        node.addEventListener('click', function () {
          state.filter = styleId;
          if (dom.body) dom.body.scrollTop = 0;
          render();
        });
        dom.filters.appendChild(node);
      });
    }
    if (dom.sorts) {
      dom.sorts.textContent = '';
      SORTS.forEach(function (sortOpt) {
        var sbtn = button(sortOpt.label, 'ob-health-sort');
        sbtn.dataset.sort = sortOpt.id;
        sbtn.setAttribute('aria-pressed', state.sort === sortOpt.id ? 'true' : 'false');
        if (state.sort === sortOpt.id) sbtn.classList.add('is-active');
        sbtn.addEventListener('click', function () {
          state.sort = sortOpt.id;
          if (dom.body) dom.body.scrollTop = 0;
          render();
        });
        dom.sorts.appendChild(sbtn);
      });
    }
  }

  function loadProviders(options) {
    var force = options && options.force === true;
    if (state.providersLoading) return Promise.resolve();
    if (!force && state.providers && Date.now() - state.providersAt < 15000) return Promise.resolve();
    state.providersLoading = true;
    state.providersError = '';
    if (state.tab === 'providers') render();
    return root.grokbot.botHealthProviders().then(function (result) {
      state.providersLoading = false;
      if (!result || result.ok === false) {
        state.providersError = (result && result.message) || tr('无法读取供应商与模型', 'Unable to read providers and models');
        state.providers = [];
      } else {
        state.providers = Array.isArray(result.providers) ? result.providers : [];
        state.providersAt = result.at || Date.now();
      }
      if (state.tab === 'providers') render();
    }).catch(function (error) {
      state.providersLoading = false;
      state.providers = [];
      state.providersError = (error && error.message) || tr('无法读取供应商与模型', 'Unable to read providers and models');
      if (state.tab === 'providers') render();
    });
  }

  function loadHarnesses(options) {
    var force = options && options.force === true;
    if (state.harnessesLoading) return Promise.resolve();
    if (!force && state.harnesses && Date.now() - state.harnessesAt < 15000) return Promise.resolve();
    state.harnessesLoading = true;
    state.harnessesError = '';
    if (state.tab === 'harness') render();
    return root.grokbot.botHealthHarness().then(function (result) {
      state.harnessesLoading = false;
      if (!result || result.ok === false) {
        state.harnessesError = (result && result.message) || tr('无法读取 Harness', 'Unable to read Harness status');
        state.harnesses = [];
      } else {
        state.harnesses = Array.isArray(result.harnesses) ? result.harnesses : [];
        state.harnessesAt = result.at || Date.now();
      }
      if (state.tab === 'harness') render();
    }).catch(function (error) {
      state.harnessesLoading = false;
      state.harnesses = [];
      state.harnessesError = (error && error.message) || tr('无法读取 Harness', 'Unable to read Harness status');
      if (state.tab === 'harness') render();
    });
  }

  function renderLamp(lamp, label) {
    var wrap = el('span', 'ob-health-lamp ob-health-lamp-' + lamp);
    wrap.appendChild(el('span', 'ob-health-lampdot'));
    wrap.appendChild(el('span', 'ob-health-lamptext', label || LAMP_LABEL[lamp] || LAMP_LABEL.unknown));
    return wrap;
  }

  function tabHeading(text, note) {
    var head = el('div', 'ob-health-tabhead');
    head.appendChild(el('h3', 'ob-health-tabtitle', text));
    if (note) head.appendChild(el('p', 'ob-health-tabnote', note));
    return head;
  }

  function renderProviderModel(provider, model) {
    var row = el('div', 'ob-health-modelrow');
    row.dataset.model = model.model;
    var lamp = model.status === 'unprobed' || !model.status ? 'unknown' : lampOfStatus(model.status);
    row.appendChild(renderLamp(lamp, model.status === 'unprobed' ? tr('未观测', 'Not observed') : (STATUS[model.status] || model.status)));
    var main = el('div', 'ob-health-modelmain');
    main.appendChild(el('strong', 'ob-health-modelname', model.model));
    var meta = [];
    if (model.identityKey) meta.push(tr('凭据指纹 ·' + model.identityKey.slice(-4), 'key fingerprint ·' + model.identityKey.slice(-4)));
    else meta.push(tr('无健康回执', 'no health receipt'));
    if (model.checkedAt) meta.push(timeAgo(model.checkedAt));
    else if (model.status === 'unprobed') meta.push(tr('未被任何 Bot 使用', 'not used by any Bot'));
    if (model.cooling) meta.push(tr('冷却中', 'cooling'));
    main.appendChild(el('span', 'ob-health-modelmeta', meta.join(' · ')));
    if (model.status === 'unprobed') {
      main.appendChild(el('span', 'ob-health-modelhonest',
        tr('未知 ≠ 不可用：尚无健康回执；实际使用后由检测写入。', 'Unknown ≠ unavailable: no receipt yet; a real check will record it.')));
    }
    row.appendChild(main);
    var botsWrap = el('div', 'ob-health-modelbots');
    if (Array.isArray(model.sharedBots) && model.sharedBots.length) {
      model.sharedBots.forEach(function (bot) {
        var chip = button(bot.name, 'ob-health-botchip');
        chip.dataset.botId = bot.botId;
        chip.title = tr('在 BOT 页定位 ' + bot.name, 'Open ' + bot.name + ' in the BOT tab');
        chip.addEventListener('click', function () { jumpToBot(bot.botId); });
        botsWrap.appendChild(chip);
      });
    } else {
      botsWrap.appendChild(el('span', 'ob-health-cell-empty', tr('暂无 Bot 使用', 'No Bots')));
    }
    row.appendChild(botsWrap);
    return row;
  }

  function renderProvidersTab() {
    if (state.providersLoading && !state.providers) {
      dom.body.appendChild(el('p', 'ob-health-empty', tr('正在读取供应商与模型…', 'Loading providers and models…')));
      return;
    }
    if (state.providersError) {
      dom.body.appendChild(el('p', 'ob-health-error', state.providersError));
      return;
    }
    var providers = state.providers || [];
    if (!providers.length) {
      dom.body.appendChild(el('p', 'ob-health-empty', tr('还没有配置模型服务。', 'No model providers configured yet.')));
      return;
    }
    if (state.drill) {
      var provider = providers.find(function (row) { return row.id === state.drill; });
      if (!provider) {
        var returnToProviders = button(tr('← 全部供应商', '← All providers'), 'ob-health-btn ob-health-back');
        returnToProviders.addEventListener('click', function () { state.drill = ''; render(); });
        dom.body.appendChild(returnToProviders);
        dom.body.appendChild(el('p', 'ob-health-error', tr('所选供应商已不可用：', 'Selected provider is unavailable: ') + state.drill));
        return;
      } else {
        var back = button(tr('← 全部供应商', '← All providers'), 'ob-health-btn ob-health-back');
        back.addEventListener('click', function () { state.drill = ''; render(); });
        var head = tabHeading(provider.name, tr('按凭据身份列出模型；未使用的模型诚实标为未观测。',
          'Models are grouped by credential identity; unused models stay honestly unobserved.'));
        head.insertBefore(back, head.firstChild);
        dom.body.appendChild(head);
        var list = el('div', 'ob-health-modellist');
        provider.models.forEach(function (model) { list.appendChild(renderProviderModel(provider, model)); });
        dom.body.appendChild(list);
        return;
      }
    }
    dom.body.appendChild(tabHeading(tr('供应商 · 模型', 'Providers · Models'),
      tr('按供应商下钻；灯色取旗下模型身份回执的最坏值。未知不等于不可用。',
        'Drill into a provider; the lamp is the worst model identity receipt. Unknown is not unavailable.')));
    var grid = el('div', 'ob-health-providers');
    providers.forEach(function (provider) {
      var lamp = providerLamp(provider);
      var card = el('button', 'ob-health-provider ob-health-lampborder-' + lamp);
      card.type = 'button';
      card.dataset.providerId = provider.id;
      var top = el('div', 'ob-health-provider-head');
      top.appendChild(renderLamp(lamp));
      top.appendChild(el('span', 'ob-health-providerkey', provider.hasKey ? tr('已配置凭据', 'Key configured') : tr('未配置凭据', 'No key')));
      card.appendChild(top);
      card.appendChild(el('strong', 'ob-health-providername', provider.name));
      card.appendChild(el('span', 'ob-health-providermeta',
        tr((provider.models || []).length + ' 个模型 · ' + (provider.usedBy || []).length + ' 个 Bot 使用',
          (provider.models || []).length + ' models · ' + (provider.usedBy || []).length + ' Bots')));
      var models = el('div', 'ob-health-providerchips');
      (provider.models || []).slice(0, 4).forEach(function (model) {
        var chip = el('span', 'ob-health-modelchip', model.model);
        chip.title = model.status === 'unprobed' ? tr('未观测', 'Not observed') : (STATUS[model.status] || model.status);
        models.appendChild(chip);
      });
      if ((provider.models || []).length > 4) models.appendChild(el('span', 'ob-health-modelchip', '+' + (provider.models.length - 4)));
      card.appendChild(models);
      card.addEventListener('click', function () {
        state.drill = provider.id;
        if (dom.body) dom.body.scrollTop = 0;
        render();
      });
      grid.appendChild(card);
    });
    dom.body.appendChild(grid);
    dom.body.appendChild(el('p', 'ob-health-listnote',
      tr('凭据只以 SHA-256 身份指纹尾 4 位展示；页面不读取、不显示 API Key。',
        'Credentials appear only as the last 4 hex characters of a SHA-256 identity fingerprint; API keys are never read into this view.')));
  }

  function renderHarnessTab() {
    if (state.harnessesLoading && !state.harnesses) {
      dom.body.appendChild(el('p', 'ob-health-empty', tr('正在读取 Harness…', 'Loading Harness status…')));
      return;
    }
    if (state.harnessesError) {
      dom.body.appendChild(el('p', 'ob-health-error', state.harnessesError));
      return;
    }
    var harnesses = state.harnesses || [];
    if (!harnesses.length) {
      dom.body.appendChild(el('p', 'ob-health-empty', tr('还没有 Harness 记录。', 'No Harness records yet.')));
      return;
    }
    dom.body.appendChild(tabHeading(tr('Harness', 'Harness'),
      tr('每个执行器独立一行；成员 Bot 的最弱 Harness 层决定灯色。原生/远端未自检时保持“未知”。',
        'One row per executor; the weakest member Harness layer sets the lamp. Native/remote unprobed stays unknown.')));
    var grid = el('div', 'ob-health-harnesses');
    harnesses.forEach(function (harness) {
      var card = el('article', 'ob-health-harness ob-health-lampborder-' + harness.lamp);
      card.dataset.harness = harness.id;
      var head = el('div', 'ob-health-harness-head');
      head.appendChild(renderLamp(harness.lamp));
      var kind = el('span', 'ob-health-harnesskind', harness.kind === 'native' ? tr('原生', 'Native') : 'API');
      head.appendChild(kind);
      card.appendChild(head);
      card.appendChild(el('strong', 'ob-health-harnessname', harness.name));
      var reconLabel = {
        configured: tr('已接线', 'Wired'),
        installed: tr('已安装 · 登录未验证', 'Installed · login unverified'),
        missing: tr('未检测到程序', 'Program not found'),
        blocked: tr('暂不可接入', 'Temporarily blocked'),
        unprobed: tr('尚未自检', 'Not probed'),
        unknown: tr('未知', 'Unknown'),
      };
      card.appendChild(el('span', 'ob-health-harnessmeta',
        (reconLabel[harness.recon] || reconLabel.unknown) + ' · ' +
        tr((harness.counts.ok || 0) + ' 正常 / ' + (harness.counts.bad || 0) + ' 异常 / ' +
          (harness.counts.warn || 0) + ' 待改善', (harness.counts.ok || 0) + ' OK / ' +
          (harness.counts.bad || 0) + ' failed / ' + (harness.counts.warn || 0) + ' degraded')));
      var members = el('div', 'ob-health-harnessmembers');
      harness.members.forEach(function (bot) {
        var chip = button(bot.name, 'ob-health-botchip ob-health-botharness-' + lampOfStatus(bot.status));
        chip.dataset.botId = bot.botId;
        chip.title = tr('Harness 层：' + (STATUS[bot.status] || bot.status), 'Harness layer: ' + bot.status);
        chip.addEventListener('click', function () { jumpToBot(bot.botId); });
        members.appendChild(chip);
      });
      card.appendChild(members);
      if (harness.detailCodes && harness.detailCodes.length) {
        card.appendChild(el('span', 'ob-health-harnesscodes', harness.detailCodes.join(' · ')));
      }
      grid.appendChild(card);
    });
    dom.body.appendChild(grid);
  }

  function schedulerIntervalLabel(minutes) {
    var value = Number(minutes) || 360;
    if (value < 60) return value + tr(' 分钟', ' min');
    return (Math.round((value / 60) * 10) / 10) + tr(' 小时', ' h');
  }

  function schedulerStatusText() {
    var s = state.scheduler;
    if (!s) return state.schedulerError || tr('自动检测状态暂不可用', 'Auto-check state unavailable');
    if (s.requiresReconfirmation) return tr('需重新确认授权 · 当前不会自动发送请求', 'Authorization needs reconfirmation · no automatic requests');
    if (s.persistFailed) return tr('设置或预算未保存 · 已停止新请求', 'Settings or budget not saved · new requests stopped');
    if (s.draining || (!s.enabled && s.running)) return tr('已停止新请求 · 正在等待已发送请求结束', 'New requests stopped · draining requests already sent');
    if (!s.enabled) return tr('已关闭 · 不会自动发出模型请求', 'Off · no automatic model requests');
    if (s.running) return tr('正在自动检测…', 'Auto-check running…');
    if (s.backoffUntil && s.backoffUntil > Date.now()) {
      return tr('失败退避至 ' + new Date(s.backoffUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'Backing off until ' + new Date(s.backoffUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    var parts = [
      tr('每 ' + schedulerIntervalLabel(s.config.intervalMinutes) + ' 最多 ' + s.config.maxPerCycle + ' 个',
        'Up to ' + s.config.maxPerCycle + ' every ' + schedulerIntervalLabel(s.config.intervalMinutes)),
      tr('今日 ' + s.spentToday + '/' + s.dailyBudget, 'Today ' + s.spentToday + '/' + s.dailyBudget),
    ];
    if (s.lastRunAt) {
      parts.push(tr('上次 ' + timeAgo(s.lastRunAt), 'Last ' + timeAgo(s.lastRunAt)));
    }
    if (s.nextRunAt) {
      parts.push(tr('下次 ' + new Date(s.nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'Next ' + new Date(s.nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })));
    }
    return parts.join(' · ');
  }

  function renderScheduler() {
    if (!dom.scheduler) return;
    var activeId = document.activeElement && document.activeElement.id;
    if (activeId && activeId.indexOf('ob-health-scheduler') === 0) schedulerFocusId = activeId;
    dom.scheduler.textContent = '';
    var s = state.scheduler;
    var head = el('div', 'ob-health-scheduler-head');
    var label = el('label', 'ob-health-scheduler-switch');
    label.title = tr('默认关闭；开启后由 Bot Studio 后台按间隔发起小规模真实模型检测，可能产生费用。',
      'Off by default; when on, Bot Studio makes small real model probes on a schedule and may cost money.');
    var toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.id = 'ob-health-scheduler-toggle';
    toggle.checked = Boolean(s && s.enabled);
    toggle.disabled = state.schedulerLoading || !s;
    toggle.addEventListener('change', function () {
      var patch = { enabled: toggle.checked };
      // Only a fresh, explicit enable action reconfirms a prior unclean or
      // invalid session. Loading state and editing intervals never do this.
      if (toggle.checked && s && s.requiresReconfirmation) patch.reconfirm = true;
      configureScheduler(patch);
    });
    label.appendChild(toggle);
    label.appendChild(el('span', 'ob-health-scheduler-name', tr('自动检测', 'Auto-check')));
    head.appendChild(label);
    var select = document.createElement('select');
    select.id = 'ob-health-scheduler-interval';
    select.className = 'ob-health-scheduler-interval';
    select.disabled = state.schedulerLoading || !s;
    select.setAttribute('aria-label', tr('自动检测间隔', 'Auto-check interval'));
    select.title = tr('每天预算与每轮上限保持不变；改间隔会重新排下一次检测。',
      'The daily budget and per-cycle cap stay fixed; changing the interval reschedules the next run.');
    var intervals = [60, 360, 1440];
    var current = s && s.config ? Number(s.config.intervalMinutes) : 360;
    if (intervals.indexOf(current) < 0) intervals.push(current);
    intervals.sort(function (a, b) { return a - b; }).forEach(function (value) {
      var option = document.createElement('option');
      option.value = String(value);
      option.textContent = tr('每 ' + schedulerIntervalLabel(value), 'Every ' + schedulerIntervalLabel(value));
      select.appendChild(option);
    });
    select.value = String(current);
    select.addEventListener('change', function () {
      configureScheduler({ intervalMinutes: Number(select.value) });
    });
    head.appendChild(select);
    var status = el('span', 'ob-health-scheduler-status ' + (s && s.enabled ? 'is-on' : 'is-off'),
      state.schedulerLoading ? tr('正在保存…', 'Saving…') : schedulerStatusText());
    status.setAttribute('role', 'status');
    head.appendChild(status);
    dom.scheduler.appendChild(head);
    if (s && s.requiresReconfirmation) {
      dom.scheduler.appendChild(el('p', 'ob-health-scheduler-warn', tr(
        '上次自动检测会话未确认安全结束，或授权范围已变更。再次开启表示确认本会话的小规模模型探测，可能产生费用。',
        'The prior auto-check session did not finish cleanly or its authorization scope changed. Enable again to authorize small model probes for this session; they may incur costs.')));
    }
    if (s && s.enabled) {
      dom.scheduler.appendChild(el('p', 'ob-health-scheduler-warn', tr(
        '会自动发出小规模真实模型请求，可能产生费用；共享配置复用结果，429/5xx 与失败会退避。',
        'Makes small real model requests automatically and may cost money; shared configs reuse results, 429/5xx and failures back off.')));
    }
    if (state.schedulerError) dom.scheduler.appendChild(el('p', 'ob-health-scheduler-error', state.schedulerError));
    if (schedulerFocusId) {
      var restored = document.getElementById(schedulerFocusId);
      if (restored && !restored.disabled && typeof restored.focus === 'function') {
        restored.focus();
        schedulerFocusId = '';
      }
    }
  }

  function loadScheduler() {
    if (!root.grokbot || typeof root.grokbot.botHealthSchedulerState !== 'function') return Promise.resolve();
    state.schedulerLoading = true;
    return root.grokbot.botHealthSchedulerState().then(function (next) {
      state.schedulerLoading = false;
      if (next && next.ok === false) {
        state.scheduler = null;
        state.schedulerError = next.message || tr('无法读取自动检测状态', 'Unable to read auto-check state');
      } else {
        state.scheduler = next || null;
        state.schedulerError = '';
      }
      renderScheduler();
    }).catch(function () {
      state.schedulerLoading = false;
      state.schedulerError = tr('无法读取自动检测状态', 'Unable to read auto-check state');
      renderScheduler();
    });
  }

  function configureScheduler(patch) {
    if (!root.grokbot || typeof root.grokbot.botHealthSchedulerConfigure !== 'function') return Promise.resolve();
    state.schedulerLoading = true;
    renderScheduler();
    return root.grokbot.botHealthSchedulerConfigure(patch).then(function (next) {
      state.schedulerLoading = false;
      if (next && next.ok === false) {
        if (next.requiresReconfirmation !== undefined) state.scheduler = next;
        state.schedulerError = next.message || tr('无法保存自动检测设置', 'Unable to save auto-check settings');
      } else {
        state.scheduler = next || state.scheduler;
        state.schedulerError = '';
      }
      renderScheduler();
    }).catch(function () {
      state.schedulerLoading = false;
      state.schedulerError = tr('无法保存自动检测设置', 'Unable to save auto-check settings');
      renderScheduler();
    });
  }

  function render() {
    if (!dom.body) return;
    renderTabs();
    renderSummary();
    renderViews();
    renderFilters();
    renderScheduler();
    var showBotTools = state.tab === 'bots';
    if (dom.toolbar) dom.toolbar.hidden = !showBotTools;
    if (dom.note) dom.note.hidden = !showBotTools;
    if (dom.controls) dom.controls.hidden = !showBotTools;
    if (dom.progress) dom.progress.hidden = !showBotTools;
    dom.body.textContent = '';
    if (state.tab === 'providers') {
      renderProvidersTab();
      return;
    }
    if (state.tab === 'harness') {
      renderHarnessTab();
      return;
    }
    if (state.error) {
      dom.body.appendChild(el('p', 'ob-health-error', state.error));
      return;
    }
    if (state.loading && !state.rows.length) {
      dom.body.appendChild(el('p', 'ob-health-empty', tr('正在读取 Bot 列表…', 'Loading Bots…')));
      return;
    }
    if (!state.rows.length) {
      dom.body.appendChild(el('p', 'ob-health-empty', tr('还没有 Bot。', 'No Bots yet.')));
      return;
    }
    var rows = sortedRows(botScopeRows());
    if (!rows.length) {
      dom.body.appendChild(el('p', 'ob-health-empty', tr('没有符合当前筛选的 Bot。', 'No Bots match this filter.')));
    } else {
      var identities = root.OpenBotAvatars && typeof root.OpenBotAvatars.sidebarIdentities === 'function'
        ? root.OpenBotAvatars.sidebarIdentities(state.rows)
        : null;
      if (state.view === 'list') {
        dom.body.appendChild(renderList(rows, identities));
      } else {
        var grid = el('div', 'ob-health-grid');
        rows.forEach(function (row) { grid.appendChild(renderCard(row, identities)); });
        dom.body.appendChild(grid);
      }
    }
    dom.runAll.disabled = state.running > 0 || !botScopeRows().some(canCheck);
    dom.runIssues.disabled = state.running > 0 || !botScopeRows().some(function (row) {
      return canCheck(row) && needsAttention(row);
    });
  }

  function openCardFor(botId) {
    if (state.view !== 'cards') {
      state.view = 'cards';
      persistView();
      renderViews();
    }
    render();
    spotlightBot(botId);
  }

  var LIST_COLUMNS = [
    { id: 'bot', label: tr('Bot', 'Bot') },
    { id: 'status', label: tr('状态', 'Status'), sort: 'status' },
    { id: 'replies', label: tr('发言', 'Replies'), sort: 'replies' },
    { id: 'tokens', label: 'Token', sort: 'tokens' },
    { id: 'partner', label: tr('常搭档', 'Top peer'), sort: 'partners' },
    { id: 'spaces', label: tr('空间', 'Spaces') },
    { id: 'personality', label: tr('性格', 'Personality') },
    { id: 'office', label: tr('办公室', 'Office') },
    { id: 'recent', label: tr('最近活跃', 'Last active'), sort: 'recent' },
    { id: 'actions', label: '' },
  ];

  function spaceRoleLabel(role) {
    if (role === 'leader') return tr('负责', 'Lead');
    if (role === 'member') return tr('成员', 'Member');
    return tr('参与', 'Guest');
  }

  function renderSpacesCell(row) {
    var u = usageOf(row);
    var cell = el('td', 'ob-health-cell-spaces');
    if (!u.spaces.length) {
      cell.appendChild(el('span', 'ob-health-cell-empty', '—'));
      cell.title = tr('尚无空间归属或空间内活动记录', 'No space membership or activity recorded yet');
      return cell;
    }
    var lines = el('div', 'ob-health-cell-spacebits');
    u.spaces.forEach(function (space) {
      var bit = el('span', 'ob-health-spacebit ob-health-spacebit-' + space.role);
      bit.appendChild(el('span', 'ob-health-spacebit-role', spaceRoleLabel(space.role)));
      bit.appendChild(el('span', 'ob-health-spacebit-name', space.name));
      var activity = space.invocations + space.replies;
      if (activity > 0) bit.appendChild(el('span', 'ob-health-spacebit-count', formatCompact(activity)));
      var detail = tr((space.role === 'leader' ? '负责空间' : space.role === 'member' ? '成员空间' : '参与空间') + '：' + space.name +
        '（调用 ' + formatExact(space.invocations) + ' 次 · 发言 ' + formatExact(space.replies) + ' 次' +
        (space.lastActiveAt ? ' · 最近 ' + timeAgo(space.lastActiveAt) : '') + '）',
        'Space: ' + space.name);
      bit.title = detail;
      lines.appendChild(bit);
    });
    cell.appendChild(lines);
    if (u.spaceCount > u.spaces.length) {
      cell.appendChild(el('span', 'ob-health-cell-sub',
        tr('共 ' + u.spaceCount + ' 个空间', u.spaceCount + ' spaces')));
    }
    return cell;
  }

  function renderOfficeCell(row) {
    var cell = el('td', 'ob-health-cell-office');
    var presence = officePresence(row);
    var route = officeRoute(row);
    if (presence) {
      var who = el('span', 'ob-health-officepresence ob-health-presence-' + presence.status);
      who.appendChild(el('span', 'ob-health-presencedot'));
      who.appendChild(el('span', 'ob-health-presencetext', presenceLabel(presence.status) +
        (presence.activeCount > 0 ? ' ×' + presence.activeCount : '')));
      who.title = tr('与像素办公室同一实时状态：' + presenceLabel(presence.status),
        'Same live projection as the pixel office: ' + presenceLabel(presence.status));
      cell.appendChild(who);
    }
    if (route) {
      var light = ['on', 'dim', 'off'].includes(route.light) ? route.light : 'unknown';
      var line = el('span', 'ob-health-officelight ob-health-light-' + light);
      line.appendChild(el('span', 'ob-health-lightdot'));
      line.appendChild(el('span', 'ob-health-lighttext', LIGHT_LABEL[light]));
      var remaining = route.quota && Number.isFinite(route.quota.remainingPercent)
        ? Math.round(route.quota.remainingPercent) : null;
      line.title = tr('办公室工位路线灯：' + LIGHT_LABEL[light] +
        (remaining !== null ? ' · 剩余额度 ' + remaining + '%' : ''),
        'Office route light: ' + light);
      var quota = route.quota && typeof route.quota.state === 'string' ? route.quota.state : '';
      if (quota && quota !== 'unknown') line.title += ' · ' + quota;
      cell.appendChild(line);
    }
    if (!presence && !route) cell.appendChild(el('span', 'ob-health-cell-empty', '—'));
    return cell;
  }

  function renderListRow(row, identities) {
    var u = usageOf(row);
    var rowEl = el('tr', 'ob-health-listrow');
    rowEl.dataset.botId = row.id;
    rowEl.dataset.status = row.status;
    rowEl.dataset.overall = baseStatus(row);
    if (state.focusBotId === row.id) rowEl.classList.add('is-focus');

    var botCell = el('td', 'ob-health-cell-bot');
    botCell.appendChild(renderAvatar(row, identities));
    var botText = el('div', 'ob-health-cell-bottext');
    botText.appendChild(el('span', 'ob-health-cell-name', row.name));
    botText.appendChild(el('span', 'ob-health-cell-meta', [
      row.inherited ? tr('默认配置', 'default') : row.providerId || tr('未选服务', 'no provider'),
      row.model || tr('未选模型', 'no model'),
    ].filter(Boolean).join(' · ')));
    botCell.appendChild(botText);
    botCell.title = tr('打开 ' + row.name + ' 的卡片详情', 'Open card details for ' + row.name);
    botCell.addEventListener('click', function () { openCardFor(row.id); });
    rowEl.appendChild(botCell);

    var statusCell = el('td', 'ob-health-cell-status ob-health-cellstatus-' + (row.status === 'stale' ? 'stale' : baseStatus(row)));
    statusCell.appendChild(el('span', 'ob-health-statusdot'));
    statusCell.appendChild(el('span', 'ob-health-cellstatuslabel', displayStatus(row)));
    if (Number.isFinite(row.score)) statusCell.appendChild(el('span', 'ob-health-cellstatusscore', String(row.score)));
    rowEl.appendChild(statusCell);

    var repliesCell = el('td', 'ob-health-cell-num');
    repliesCell.appendChild(el('strong', 'ob-health-cellnumval', formatCompact(u.botReplies)));
    if (u.userMessages > 0) {
      repliesCell.appendChild(el('span', 'ob-health-cell-sub',
        tr('收 ' + formatCompact(u.userMessages), formatCompact(u.userMessages) + ' in')));
    }
    repliesCell.title = tr('累计发言 ' + formatExact(u.botReplies) + ' 次 · 收到消息 ' + formatExact(u.userMessages) + ' 条',
      'Replies: ' + formatExact(u.botReplies) + ' · User messages: ' + formatExact(u.userMessages));
    rowEl.appendChild(repliesCell);

    var tokenCell = el('td', 'ob-health-cell-num');
    if (u.meteredRuns > 0) {
      tokenCell.appendChild(el('strong', 'ob-health-cellnumval', formatCompact(u.totalTokens)));
      tokenCell.appendChild(el('span', 'ob-health-cell-sub',
        tr('入 ' + formatCompact(u.inputTokens) + ' · 出 ' + formatCompact(u.outputTokens),
          'in ' + formatCompact(u.inputTokens) + ' · out ' + formatCompact(u.outputTokens))));
      tokenCell.title = tr('累计 Token ' + formatExact(u.totalTokens) + '（已计量 ' + formatExact(u.meteredRuns) + ' 次）',
        'Tokens: ' + formatExact(u.totalTokens) + ' (' + formatExact(u.meteredRuns) + ' metered runs)');
    } else {
      tokenCell.classList.add('is-muted');
      tokenCell.appendChild(el('strong', 'ob-health-cellnumval',
        (u.botReplies > 0 || u.invocations > 0) ? tr('未上报', 'Unreported') : '0'));
      tokenCell.title = tr('该 Bot 暂无模型接口上报的 Token 明细', 'No provider-reported token details yet');
    }
    rowEl.appendChild(tokenCell);

    var partnerCell = el('td', 'ob-health-cell-partner');
    if (u.topPartner && u.topPartner.name) {
      partnerCell.appendChild(el('span', 'ob-health-cellpartnername', u.topPartner.name));
      var bits = [];
      if (u.topPartner.delegations > 0) bits.push(tr('协作 ' + u.topPartner.delegations, u.topPartner.delegations + ' tasks'));
      if (u.topPartner.chatRooms > 0) bits.push(tr('群聊 ' + u.topPartner.chatRooms, u.topPartner.chatRooms + ' rooms'));
      if (bits.length) partnerCell.appendChild(el('span', 'ob-health-cell-sub', bits.join(' · ')));
      partnerCell.title = tr('最常搭档：' + u.topPartner.name + '（共 ' + formatExact(u.partnerCount) + ' 位伙伴）',
        'Top peer: ' + u.topPartner.name);
      if (u.topPartner.botId && state.rows.some(function (item) { return item.id === u.topPartner.botId; })) {
        partnerCell.classList.add('is-jumpable');
        partnerCell.addEventListener('click', function (event) {
          event.stopPropagation();
          spotlightBot(u.topPartner.botId);
        });
      }
    } else {
      partnerCell.appendChild(el('span', 'ob-health-cell-empty', '—'));
    }
    rowEl.appendChild(partnerCell);

    rowEl.appendChild(renderSpacesCell(row));

    var traitsCell = el('td', 'ob-health-cell-traits');
    var rowTraits = personalityOf(row);
    if (rowTraits && root.OpenBotPersonality) {
      var traitBits = el('div', 'ob-health-celltraitbits');
      if (rowTraits.mbti) traitBits.appendChild(el('span', 'ob-health-mbti', rowTraits.mbti));
      if (rowTraits.interactionStyle) {
        traitBits.appendChild(el('span', 'ob-health-stylechip ob-health-style-' + rowTraits.interactionStyle,
          root.OpenBotPersonality.styleLabel(rowTraits.interactionStyle)));
      }
      traitsCell.appendChild(traitBits);
      traitsCell.title = tr('人工标注 · 非测评结果' + (rowTraits.note ? ' · ' + rowTraits.note : ''),
        'Manually annotated · not a psychometric result' + (rowTraits.note ? ' · ' + rowTraits.note : ''));
    } else {
      traitsCell.appendChild(el('span', 'ob-health-cell-empty', '—'));
      traitsCell.title = tr('尚未标注性格；可在 Bot 设置中人工标注', 'No personality annotation yet; set it in Bot settings');
    }
    rowEl.appendChild(traitsCell);

    rowEl.appendChild(renderOfficeCell(row));

    var recentCell = el('td', 'ob-health-cell-num ob-health-cell-recent');
    recentCell.appendChild(el('span', 'ob-health-cellrecent', u.lastActiveAt ? timeAgo(u.lastActiveAt) : '—'));
    recentCell.title = u.lastActiveAt ? tr('最近活跃：' + new Date(u.lastActiveAt).toLocaleString(), 'Last active') :
      tr('暂无活动记录', 'No activity yet');
    rowEl.appendChild(recentCell);

    var actionsCell = el('td', 'ob-health-cell-actions');
    var detail = button(tr('详情', 'Details'), 'ob-health-btn ob-health-listdetail');
    detail.addEventListener('click', function () { openCardFor(row.id); });
    actionsCell.appendChild(detail);
    rowEl.appendChild(actionsCell);
    return rowEl;
  }

  function renderList(rows, identities) {
    var wrap = el('div', 'ob-health-listwrap');
    var table = el('table', 'ob-health-list');
    table.setAttribute('aria-label', tr('Bot 列表视图', 'Bot list view'));
    var thead = el('thead', 'ob-health-listhead');
    var headRow = el('tr', 'ob-health-listheadrow');
    LIST_COLUMNS.forEach(function (column) {
      var th = el('th', 'ob-health-listcol', column.label);
      th.scope = 'col';
      th.dataset.col = column.id;
      if (column.sort) {
        th.classList.add('is-sortable');
        th.tabIndex = 0;
        th.setAttribute('aria-sort', state.sort === column.sort ? 'descending' : 'none');
        th.title = tr('按「' + column.label + '」排序', 'Sort by ' + column.label);
        var activate = function () {
          state.sort = column.sort;
          if (dom.body) dom.body.scrollTop = 0;
          render();
        };
        th.addEventListener('click', activate);
        th.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
        });
        if (state.sort === column.sort) th.classList.add('is-active');
      }
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = el('tbody', 'ob-health-listbody');
    rows.forEach(function (row) { tbody.appendChild(renderListRow(row, identities)); });
    table.appendChild(tbody);
    wrap.appendChild(table);
    wrap.appendChild(el('p', 'ob-health-listnote', tr(
      '列表与像素办公室共用同一实时在线状态投影；“空间”列为组织空间的归属与活动合计。',
      'The list shares the pixel office live presence projection; Spaces shows organization membership and activity.')));
    return wrap;
  }

  function setProgress(text) {
    if (dom.progress) dom.progress.textContent = text || '';
  }

  function applyResult(botId, health) {
    var row = state.rows.find(function (item) { return item.id === botId; });
    if (!row) return;
    row.status = health.status;
    row.overall = health.overall || health.status;
    row.stale = Boolean(health.stale);
    row.score = health.score;
    row.layers = health.layers || row.layers;
    row.bottleneck = health.bottleneck || null;
    row.detailCode = health.detailCode || '';
    row.checks = health.checks || [];
    row.sample = health.sample || '';
    row.checkedAt = Number.isFinite(health.checkedAt) && health.checkedAt > 0 ? health.checkedAt : null;
    row.expiresAt = health.expiresAt || null;
    row.restUntil = health.restUntil || 0;
    row.cooling = Boolean(health.cooling);
    if (Object.prototype.hasOwnProperty.call(health, 'identityKey')) {
      var priorIdentity = row.identityKey;
      row.identityKey = typeof health.identityKey === 'string' ? health.identityKey : '';
      // When no new layer map accompanied a changed/cleared model identity,
      // invalidate the old model key rather than retaining its evidence.
      if (!health.layerIdentityKeys) row.layerIdentityKeys = Object.assign({}, row.layerIdentityKeys || {}, { model: row.identityKey });
      if (priorIdentity !== row.identityKey && !health.layers) {
        row.layers = Object.assign({}, row.layers || {}, { model: { status: 'unchecked', score: null, detailCode: 'not_checked' } });
      }
    }
    if (health.bindingIdentityKey !== undefined) row.bindingIdentityKey = health.bindingIdentityKey;
    if (health.bindingRevision !== undefined) row.bindingRevision = health.bindingRevision;
    if (health.layerIdentityKeys) row.layerIdentityKeys = health.layerIdentityKeys;
    if (health.execution) row.execution = health.execution;
    delete state.trends[botId];
    delete state.suggestions[botId];
  }

  function newBatchId(prefix) {
    state.batchSequence += 1;
    return prefix + '-' + (root.crypto && typeof root.crypto.randomUUID === 'function' ? root.crypto.randomUUID()
      : Date.now().toString(36) + '-' + state.batchSequence.toString(36) + '-' + Math.random().toString(36).slice(2));
  }

  function runQueue(rows, options) {
    options = options || {};
    var force = options.force === true;
    var candidates = (rows || []).filter(canCheck);
    var targets = candidates.filter(function (row) { return !isCooling(row); }).map(function (row) {
      return { botId: row.id, target: targetStamp(row) };
    });
    var skipped = candidates.length - targets.length;
    if (!targets.length) {
      if (skipped) setProgress(tr('有 ' + skipped + ' 个配置仍在冷却中；本轮跳过，请在冷却结束后重试。',
        skipped + ' configurations are cooling down and were skipped; retry after cooldown.'));
      return;
    }
    if (state.running > 0) return;
    var index = 0;
    var done = 0;
    var batchId = newBatchId('manual-health');
    var ended = false;
    var failures = 0;
    function finishBatch() {
      if (ended || done < targets.length) return;
      ended = true;
      var finalMessage = tr('本轮检测结束：' + done + ' 个 Bot' + (failures ? '，' + failures + ' 项未取得回执。' : '。'),
        'Checks finished: ' + done + ' Bots' + (failures ? '; ' + failures + ' receipts unavailable.' : '.'));
      setProgress(finalMessage);
      if (root.grokbot && typeof root.grokbot.botHealthCheckBatchEnd === 'function') {
        Promise.resolve().then(function () { return root.grokbot.botHealthCheckBatchEnd({ batchId: batchId }); }).then(function (result) {
          if (result && result.ok === false) setProgress(finalMessage + ' ' + (result.message || tr('批次收尾未确认。', 'Batch finalization unconfirmed.')));
        }).catch(function () { setProgress(finalMessage + tr(' 批次收尾未确认。', ' Batch finalization unconfirmed.')); });
      }
      loadScheduler();
    }
    setProgress(tr('准备检测 ' + targets.length + ' 个 Bot' + (skipped ? '，跳过 ' + skipped + ' 个冷却中的配置' : '') + '…',
      'Preparing ' + targets.length + ' Bots' + (skipped ? ', skipping ' + skipped + ' cooling' : '') + '…'));
    function next() {
      var row = null;
      var requestedTarget = '';
      // A queued row is only an admission candidate. A later snapshot can
      // revoke it, replace its identity or reveal an unknown execution result.
      // Re-read immediately before IPC and preserve the initially selected
      // identity; never silently retarget the user's batch.
      while (index < targets.length) {
        var queued = targets[index++];
        var candidate = currentRow(queued.botId);
        if (candidate && canCheck(candidate) && !isCooling(candidate) && targetStamp(candidate) === queued.target) {
          row = candidate;
          requestedTarget = queued.target;
          break;
        }
        failures += 1;
        done += 1;
      }
      if (!row) { finishBatch(); return; }
      state.running += 1;
      row.status = 'checking';
      render();
      setProgress(tr('正在检测 ' + row.name + '（' + (done + 1) + '/' + targets.length + '）',
        'Checking ' + row.name + ' (' + (done + 1) + '/' + targets.length + ')'));
      root.grokbot.botHealthCheck(row.id, { force: force, batchId: batchId }).then(function (result) {
        if (targetStamp(currentRow(row.id)) !== requestedTarget) { failures += 1; return; }
        if (result && result.health) applyResult(row.id, result.health);
        else {
          failures += 1;
          row.status = 'unchecked';
          row.overall = 'unchecked';
        }
      }).catch(function () {
        failures += 1;
        row.status = 'unchecked';
        row.overall = 'unchecked';
      }).then(function () {
        state.running -= 1;
        done += 1;
        render();
        finishBatch();
        next();
      });
      if (state.running < 2) next();
    }
    render();
    next();
  }

  function load() {
    var requestSequence = ++state.requestSequence;
    state.loading = true;
    state.error = '';
    render();
    return root.grokbot.botHealthSnapshot().then(function (snapshot) {
      if (requestSequence !== state.requestSequence) return;
      state.loading = false;
      if (!snapshot || snapshot.ok === false) {
        state.error = (snapshot && snapshot.message) || tr('无法读取健康状态', 'Unable to read health state');
        render();
        return;
      }
      state.rows = Array.isArray(snapshot.rows) ? snapshot.rows : [];
      state.at = snapshot.at || Date.now();
      state.warning = snapshot.warning || '';
      if (state.warning) setProgress(state.warning);
      render();
    }).catch(function (error) {
      if (requestSequence !== state.requestSequence) return;
      state.loading = false;
      state.error = (error && error.message) || tr('无法读取健康状态', 'Unable to read health state');
      render();
    });
  }

  function closeDialog(options) {
    if (!dom.overlay || dom.overlay.hidden) return;
    dom.overlay.hidden = true;
    dom.overlay.setAttribute('aria-hidden', 'true');
    var cb = onCloseCallback;
    onCloseCallback = null;
    if (typeof cb === 'function') {
      try { cb(); } catch (_) {}
    }
    var restore = !(options && options.restoreFocus === false);
    if (restore && focusBefore && typeof focusBefore.focus === 'function' && document.contains(focusBefore)) focusBefore.focus();
  }

  function ensureModal() {
    if (dom.overlay) return;
    var overlay = el('div', 'ob-health-overlay');
    overlay.id = 'ob-health-dialog';
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    var win = el('div', 'ob-health-window');
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'true');
    win.setAttribute('aria-labelledby', 'ob-health-title');
    var header = el('div', 'ob-health-header');
    var heading = el('div', 'ob-health-heading');
    var title = el('h2', 'ob-health-title', tr('Bot 健康中心', 'Bot health center'));
    title.id = 'ob-health-title';
    heading.appendChild(title);
    heading.appendChild(el('p', 'ob-health-subtitle', tr('分别查看 Bot 绑定、Harness、模型连接及每个 Bot 的发言次数与 Token 用量统计；健康状态取最弱环节。',
      'Bot binding, Harness, model connections, and per-Bot reply & token usage statistics; weakest layer sets overall health.')));
    var close = button(tr('关闭', 'Close'), 'ob-health-close');
    close.setAttribute('aria-label', tr('关闭健康中心', 'Close health center'));
    header.appendChild(heading);
    header.appendChild(close);
    var tabs = el('div', 'ob-health-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', tr('健康视角', 'Health views'));
    var toolbar = el('div', 'ob-health-toolbar');
    var summary = el('div', 'ob-health-summary');
    var actions = el('div', 'ob-health-actions');
    var runAll = button(tr('检测当前范围', 'Check current scope'), 'ob-health-btn ob-health-primary');
    var runIssues = button(tr('检测需关注项', 'Check attention'), 'ob-health-btn');
    var openDashboard = button(tr('关系与数据面板', 'Fleet dashboard'), 'ob-health-btn');
    var openOffice = button(tr('办公室', 'Office'), 'ob-health-btn');
    var refresh = button(tr('刷新', 'Refresh'), 'ob-health-btn ob-health-quiet');
    runAll.id = 'ob-health-run-all';
    runIssues.id = 'ob-health-run-issues';
    openDashboard.id = 'ob-health-open-dashboard';
    openDashboard.title = tr('打开 Bot 舰队数据面板，查看完整协作关系矩阵、互惠伙伴与趋势',
      'Open Bot fleet dashboard for full collaboration matrix, reciprocal partners, and trends');
    openOffice.id = 'ob-health-open-office';
    openOffice.title = tr('打开像素办公室，查看各 Bot 的实时工位与路线状态',
      'Open the pixel office to see live desks and route lights');
    refresh.id = 'ob-health-refresh';
    actions.appendChild(runAll);
    actions.appendChild(runIssues);
    actions.appendChild(openDashboard);
    actions.appendChild(openOffice);
    actions.appendChild(refresh);
    toolbar.appendChild(summary);
    toolbar.appendChild(actions);
    var note = el('p', 'ob-health-note', tr('仅模型连接证据可以共享；Bot 绑定与执行状态分别判断。检测可能发出真实模型请求；统计与建议读取本地记录。自动检测默认关闭。',
      'Only model connection evidence is shared; Bot binding and execution state are judged separately. Checks may make real model requests; statistics and suggestions use local records. Auto-check is off by default.'));
    note.title = tr('手动批次按真实模型请求计入共享预算；失败会按回执退避。远端或原生执行器缺少受权探测能力时显示未验证，不会以本机模型请求代替。',
      'Manual batches count real model requests against the shared budget and back off according to receipts. Unverified remote or native capability is not replaced by a local model request.');
    var progress = el('p', 'ob-health-progress');
    progress.setAttribute('role', 'status');
    progress.setAttribute('aria-live', 'polite');
    var controls = el('div', 'ob-health-controls');
    var views = el('div', 'ob-health-views');
    views.setAttribute('role', 'group');
    views.setAttribute('aria-label', tr('视图切换', 'View mode'));
    var search = el('input', 'ob-health-search');
    search.type = 'search';
    search.id = 'ob-health-search';
    search.placeholder = tr('搜索 Bot、模型、搭档…', 'Search Bot, model, peer…');
    search.setAttribute('aria-label', tr('搜索 Bot', 'Search Bots'));
    search.addEventListener('input', function () {
      state.search = search.value;
      render();
    });
    var filters = el('div', 'ob-health-filters');
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', tr('筛选 Bot', 'Filter Bots'));
    var sorts = el('div', 'ob-health-sorts');
    sorts.setAttribute('role', 'group');
    sorts.setAttribute('aria-label', tr('排序方式', 'Sort Bots'));
    var scheduler = el('div', 'ob-health-scheduler');
    scheduler.id = 'ob-health-scheduler';
    controls.appendChild(scheduler);
    controls.appendChild(views);
    controls.appendChild(search);
    controls.appendChild(filters);
    controls.appendChild(sorts);
    var body = el('div', 'ob-health-body');
    body.id = 'ob-health-body';
    body.setAttribute('role', 'tabpanel');
    win.appendChild(header);
    win.appendChild(tabs);
    win.appendChild(toolbar);
    win.appendChild(note);
    win.appendChild(progress);
    win.appendChild(controls);
    win.appendChild(body);
    overlay.appendChild(win);
    document.body.appendChild(overlay);
    dom = {
      overlay: overlay, win: win, body: body, summary: summary, progress: progress,
      filters: filters, sorts: sorts, search: search, runAll: runAll, runIssues: runIssues,
      refresh: refresh, close: close, views: views, tabs: tabs, toolbar: toolbar, note: note,
      controls: controls, scheduler: scheduler,
    };
    close.addEventListener('click', closeDialog);
    overlay.addEventListener('mousedown', function (event) { if (event.target === overlay) closeDialog(); });
    runAll.addEventListener('click', function () { runQueue(botScopeRows().filter(canCheck)); });
    runIssues.addEventListener('click', function () {
      runQueue(botScopeRows().filter(function (row) { return canCheck(row) && needsAttention(row); }));
    });
    openDashboard.addEventListener('click', function () {
      var targetBotId = state.focusBotId || '';
      var openerEl = focusBefore || null;
      closeDialog({ restoreFocus: false });
      if (root.OpenBotOrgWorkspaces && typeof root.OpenBotOrgWorkspaces.open === 'function') {
        root.OpenBotOrgWorkspaces.open({ view: 'dashboard', botId: targetBotId, opener: openerEl });
      }
    });
    refresh.addEventListener('click', function () { loadOfficeAvailability(); loadScheduler(); load(); });
    openOffice.addEventListener('click', function () {
      var ctx = officeBridge();
      if (!ctx || typeof ctx.openOffice !== 'function') return;
      var openerEl = focusBefore || null;
      closeDialog({ restoreFocus: false });
      ctx.openOffice(openerEl);
    });
  }

  function open(options) {
    options = options || {};
    ensureModal();
    focusBefore = options.opener || document.activeElement;
    onCloseCallback = typeof options.onClose === 'function' ? options.onClose : null;
    state.focusBotId = typeof options.botId === 'string' && options.botId.length > 0 && options.botId.length <= 200
      ? options.botId : '';
    dom.overlay.hidden = false;
    dom.overlay.setAttribute('aria-hidden', 'false');
    if (dom.body) dom.body.scrollTop = 0;
    setProgress('');
    loadOfficeAvailability();
    loadScheduler();
    var loaded = load();
    if (state.tab === 'providers') loadProviders();
    if (state.tab === 'harness') loadHarnesses();
    if (options.autoRun === 'all' || options.autoRun === 'issues') {
      var mode = options.autoRun;
      Promise.resolve(loaded).then(function () {
        if (!dom.overlay || dom.overlay.hidden) return;
        if (mode === 'issues') {
          runQueue(botScopeRows().filter(function (row) { return canCheck(row) && needsAttention(row); }));
        } else {
          runQueue(state.rows.filter(canCheck));
        }
      });
    }
    if (!keyHandler) {
      keyHandler = function (event) {
        if (event.key === 'Escape' && dom.overlay && !dom.overlay.hidden) {
          event.preventDefault();
          event.stopImmediatePropagation();
          closeDialog();
        }
      };
      document.addEventListener('keydown', keyHandler);
    }
    setTimeout(function () { if (dom.close) dom.close.focus(); }, 0);
  }

  root.OpenBotHealthCenter = { open: open, close: closeDialog };
})(typeof window === 'object' ? window : this);
