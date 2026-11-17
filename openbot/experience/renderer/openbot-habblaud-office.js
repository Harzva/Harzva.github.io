(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotHabblaudOffice = api;
})(typeof window === 'object' ? window : this, function () {
  'use strict';

  var sessions = new WeakMap();
  var timeFormatters = new Map();
  function setText(element, value) { if (element.textContent !== value) element.textContent = value; }
  function setAttr(element, name, value) {
    if (value == null) { if (element.hasAttribute(name)) element.removeAttribute(name); }
    else if (element.getAttribute(name) !== String(value)) element.setAttribute(name, value);
  }
  function indexRooms(state, snapshot) {
    state.roomsById = new Map(); state.roomsByHarness = new Map();
    roomsOf(snapshot).forEach(function (room) {
      state.roomsById.set(room.id, room);
      var harness = room.openbot && room.openbot.harnessId;
      if (harness && !state.roomsByHarness.has(harness)) state.roomsByHarness.set(harness, room.id);
    });
  }
  function indexedRoom(state, agent) {
    if (!agent) return null;
    if (state.roomsById.has(agent.roomId)) return agent.roomId;
    var harness = agent.openbot && agent.openbot.harnessId;
    return state.roomsByHarness.get(harness) || (state.roomsById.has('harness:' + harness) ? 'harness:' + harness : null);
  }
  var VALID_PRESENCE = new Set(['idle', 'queued', 'thinking', 'working', 'waiting', 'done', 'error', 'interrupted']);

  function english(options) { return !!options && String(options.locale || '').toLowerCase().indexOf('en') === 0; }
  function copy(options) {
    return english(options) ? {
      zoomOut: 'Zoom out', zoomIn: 'Zoom in', fit: 'Fit plaza', canvas: 'Habblaud Harness plaza. Select a Bot to open it.',
      bots: 'Bots in Harness houses', listHeading: 'Bots in these houses', empty: 'No Bots are visible in this scope.',
      harness: 'Harness', models: 'Models', games: 'Games', modelTitle: 'Assigned model workstations',
      modelNote: 'Shows models assigned to visible Bots. Task activity and route availability are separate.',
      modelEmpty: 'No Bots are visible in this scope.', unreported: 'Model not reported',
      routeReady: 'Available', quotaAvailable: 'Quota available', quotaUnknown: 'Quota unknown',
      quotaLow: 'Low quota', quotaDepleted: 'Quota exhausted', routeUnavailable: 'Route unavailable',
      bindingUnavailable: 'No route bound', checking: 'Checking', stale: 'Last check expired', notChecked: 'Not checked',
      healthy: 'Connection healthy', unknown: 'Availability unknown', checked: 'Checked', observed: 'Quota observed',
      halls: 'Halls', hallsLabel: 'Browse Agent halls', hallsTitle: 'Agent halls', hallsNote: 'Hall setup is separate from each Bot’s route quota.',
      hallSearch: 'Search halls', hallSearchLabel: 'Search all Agent halls', hallCount: 'halls', hallEmpty: 'No halls are available in this scope.',
      hallNoMatch: 'No matching halls.', hallClose: 'Close hall directory', hallTypeApi: 'API', hallTypeNative: 'Native', hallTypeUnknown: 'Type unknown',
      installed: 'Installed', notInstalled: 'Not installed', installUnknown: 'Install status unknown',
      configured: 'Configured', notConfigured: 'Not configured', configUnknown: 'Configuration unknown', readinessUnknown: 'Readiness unknown',
      noBots: 'No Bots', bot: 'Bot',
      fleetTitle: 'Bot fleet', fleetWindow: 'Last 7 days', fleetDashboard: 'Dashboard',
      fleetLoading: 'Loading fleet activity for the last 7 days…', fleetUnavailable: 'Fleet activity is unavailable.',
      fleetRetry: 'Retry', fleetEmpty: 'No fleet activity recorded in the last 7 days.',
      fleetActive: 'with activity', fleetCalls: 'calls', fleetDelegations: 'delegations',
      fleetUsage: 'usage reported', fleetUpdated: 'Updated', fleetNoRecord: 'No records in 7 days',
      fleetCallsShort: 'calls', fleetModelsShort: 'model requests', fleetCommonPartner: 'to',
      fleetNoPartner: 'No collaboration', fleetOutgoing: 'out', fleetIncoming: 'in',
      fleetIssues: 'unfinished', fleetPartners: 'partners', fleetIsolatedBots: 'Bots',
      fleetHub: 'Dispatch hub', fleetBottleneck: 'Delivery bottleneck', fleetHotspot: 'Resource hotspot',
      fleetIsolated: 'Isolated', fleetReciprocal: 'Mutual work', fleetUnknown: 'Unknown',
      fleetLocate: 'Locate on the office map', fleetDetailCalls: 'Calls', fleetDetailOutgoing: 'Sent',
      fleetDetailIncoming: 'Received', fleetDetailIssues: 'Unfinished', fleetDetailCoverage: 'Usage reported',
      fleetDetailTopOut: 'Most sent to', fleetDetailTopIn: 'Most received from', fleetDetailRank: 'Rank',
      healthTitle: 'Health', healthOpen: 'Health center', healthUnavailable: 'Health data unavailable.',
      healthBot: 'Bot', healthHarness: 'Harness', healthModel: 'Model', healthHealthy: 'Healthy',
      healthDegraded: 'Needs attention', healthUnhealthy: 'Failed', healthUnverified: 'Unverified',
      healthUnchecked: 'Not checked', healthSummary: 'Health'
    } : {
      zoomOut: '缩小', zoomIn: '放大', fit: '显示整个广场', canvas: 'Habblaud Harness 广场。选择 Bot 可打开对应会话。',
      bots: 'Harness 房屋中的 Bot', listHeading: '已入驻 Bot', empty: '当前范围内没有可见 Bot。',
      harness: 'Harness', models: '大模型', games: '游戏', modelTitle: 'Bot 已绑定模型工位',
      modelNote: '仅显示当前可见 Bot 的模型绑定；任务状态与路由可用性分别显示。',
      modelEmpty: '当前范围内没有可见 Bot。', unreported: '模型未报告',
      routeReady: '可用', quotaAvailable: '额度可用', quotaUnknown: '额度未知',
      quotaLow: '额度偏低', quotaDepleted: '额度已耗尽', routeUnavailable: '路由不可用',
      bindingUnavailable: '未绑定路由', checking: '检查中', stale: '上次检查已过期', notChecked: '尚未检查',
      healthy: '连接正常', unknown: '可用性未知', checked: '检查时间', observed: '额度更新时间',
      halls: '大厅', hallsLabel: '浏览 Agent 大厅', hallsTitle: 'Agent 大厅', hallsNote: '大厅配置状态与单个 Bot 的路由额度分开显示。',
      hallSearch: '搜索大厅', hallSearchLabel: '搜索全部 Agent 大厅', hallCount: '个大厅', hallEmpty: '当前范围内没有可用大厅。',
      hallNoMatch: '没有匹配的大厅。', hallClose: '关闭大厅目录', hallTypeApi: 'API', hallTypeNative: '本机', hallTypeUnknown: '类型未知',
      installed: '已安装', notInstalled: '未安装', installUnknown: '安装状态未知',
      configured: '已配置', notConfigured: '未配置', configUnknown: '配置状态未知', readinessUnknown: '可用状态未知',
      noBots: '未入驻 Bot', bot: '个 Bot',
      fleetTitle: 'Bot 舰队', fleetWindow: '近 7 天', fleetDashboard: '数据面板',
      fleetLoading: '正在读取近 7 天舰队数据…', fleetUnavailable: '舰队数据暂不可用。',
      fleetRetry: '重试', fleetEmpty: '近 7 天暂无舰队活动记录。',
      fleetActive: '个有记录', fleetCalls: '次调用', fleetDelegations: '次派单',
      fleetUsage: '用量覆盖', fleetUpdated: '更新于', fleetNoRecord: '近 7 天无记录',
      fleetCallsShort: '次调用', fleetModelsShort: '次模型请求', fleetCommonPartner: '常找',
      fleetNoPartner: '暂无协作', fleetOutgoing: '发出', fleetIncoming: '收到',
      fleetIssues: '未完成', fleetPartners: '个伙伴', fleetIsolatedBots: '个',
      fleetHub: '调度枢纽', fleetBottleneck: '交付瓶颈', fleetHotspot: '资源热点',
      fleetIsolated: '协作孤岛', fleetReciprocal: '双向协作', fleetUnknown: '未知',
      fleetLocate: '在地图定位', fleetDetailCalls: '调用', fleetDetailOutgoing: '发出',
      fleetDetailIncoming: '收到', fleetDetailIssues: '未完成', fleetDetailCoverage: '用量覆盖',
      fleetDetailTopOut: '最常派给', fleetDetailTopIn: '最常收到', fleetDetailRank: '排名',
      healthTitle: '健康', healthOpen: '健康中心', healthUnavailable: '健康数据暂不可用。',
      healthBot: 'Bot', healthHarness: 'Harness', healthModel: '模型', healthHealthy: '正常',
      healthDegraded: '待改善', healthUnhealthy: '异常', healthUnverified: '未验证',
      healthUnchecked: '未检测', healthSummary: '健康'
    };
  }
  function agentIdSet(snapshot) {
    var ids = new Set();
    (snapshot && Array.isArray(snapshot.agents) ? snapshot.agents : []).forEach(function (agent) {
      if (agent && agent.openbot && typeof agent.id === 'string') ids.add(agent.id);
    });
    return ids;
  }
  function roomsOf(snapshot) {
    return snapshot && Array.isArray(snapshot.rooms) ? snapshot.rooms.filter(function (room) {
      return room && typeof room.id === 'string' && room.id.length > 0;
    }) : [];
  }
  function roomIdSet(snapshot) { return new Set(roomsOf(snapshot).map(function (room) { return room.id; })); }
  function selectedAgent(snapshot) {
    var agents = snapshot && Array.isArray(snapshot.agents) ? snapshot.agents : [];
    return agents.find(function (agent) { return agent && agent.openbot && agent.openbot.selected; }) || null;
  }
  function roomForAgent(snapshot, agent) {
    if (!agent) return null;
    var rooms = roomsOf(snapshot);
    var direct = typeof agent.roomId === 'string' && rooms.find(function (room) { return room.id === agent.roomId; });
    if (direct) return direct.id;
    var harnessId = agent.openbot && agent.openbot.harnessId;
    if (typeof harnessId !== 'string' || !harnessId) return null;
    var matching = rooms.find(function (room) {
      return room.openbot && room.openbot.harnessId === harnessId;
    }) || rooms.find(function (room) { return room.id === 'harness:' + harnessId; });
    return matching ? matching.id : null;
  }
  function selectedAgentRoom(snapshot) { return roomForAgent(snapshot, selectedAgent(snapshot)); }
  function sameScope(a, b) { return String(a || 'global') === String(b || 'global'); }
  function safePresence(agent) {
    var status = agent && agent.openbot && agent.openbot.status;
    return VALID_PRESENCE.has(status) ? status : 'idle';
  }

  function routeLabel(agent, options) {
    var labels = copy(options);
    var route = agent && agent.openbot || {};
    var reason = route.reason || '';
    var health = route.health && route.health.state || 'unknown';
    var quota = route.quota && route.quota.state || 'unknown';
    var quotaStatus = quota === 'available' ? labels.quotaAvailable : quota === 'low' ? labels.quotaLow : quota === 'depleted' ? labels.quotaDepleted : labels.quotaUnknown;
    if (reason === 'quota-depleted' || quota === 'depleted') return labels.quotaDepleted;
    if (reason === 'binding-unavailable') return labels.bindingUnavailable;
    if (reason === 'health-unavailable' || health === 'unavailable') return labels.routeUnavailable + (quota === 'unknown' ? '' : ' · ' + quotaStatus);
    if (reason === 'health-checking' || health === 'checking') return labels.checking + (quota === 'unknown' ? '' : ' · ' + quotaStatus);
    if (reason === 'health-stale' || health === 'stale') return labels.stale + (quota === 'unknown' ? '' : ' · ' + quotaStatus);
    if (reason === 'quota-low' || quota === 'low') return health === 'healthy' ? labels.healthy + ' · ' + labels.quotaLow : labels.notChecked + ' · ' + labels.quotaLow;
    if (health === 'healthy' && quota === 'available' && route.light === 'on') return labels.routeReady;
    if (health === 'healthy') return labels.healthy + ' · ' + quotaStatus;
    if (reason === 'not-observed' || health === 'unknown') return labels.notChecked + ' · ' + quotaStatus;
    return labels.unknown + ' · ' + quotaStatus;
  }

  function routeTitle(agent, options) {
    var labels = copy(options);
    var route = agent && agent.openbot || {};
    var healthAt = route.health && route.health.checkedAt;
    var quotaAt = route.quota && route.quota.observedAt;
    function time(value) {
      var epoch = typeof value === 'number' ? value : typeof value === 'string' ? Date.parse(value) : NaN;
      if (!Number.isFinite(epoch)) return '';
      try {
        var locale = english(options) ? 'en' : 'zh-CN';
        if (!timeFormatters.has(locale)) timeFormatters.set(locale, new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }));
        return timeFormatters.get(locale).format(new Date(epoch));
      } catch (_) { return new Date(epoch).toLocaleString(); }
    }
    var healthTime = time(healthAt);
    var quotaTime = time(quotaAt);
    var title = routeLabel(agent, options);
    if (healthTime) title += ' · ' + labels.checked + ': ' + healthTime;
    if (quotaTime) title += ' · ' + labels.observed + ': ' + quotaTime;
    return title;
  }

  function routeLight(agent) {
    var value = agent && agent.openbot && agent.openbot.light;
    return value === 'on' || value === 'dim' || value === 'off' ? value : 'unknown';
  }

  function modelKey(agent, options) {
    var model = String(agent && agent.openbot && agent.openbot.model || '').trim();
    return model || copy(options).unreported;
  }

  function makeShell(container, options) {
    container.innerHTML = '<section class="ob-habblaud-office">'
      + '<div class="ob-habblaud-toolbar" role="group" aria-label="Office controls">'
      + '<div class="ob-habblaud-wordmark">Habblaud</div>'
      + '<button type="button" class="ob-habblaud-halls-toggle" data-office-halls aria-expanded="false" aria-controls="office-hall-directory"></button>'
      + '<div class="ob-habblaud-plazas" role="group">'
      + '<button type="button" data-office-plaza="harness"></button>'
      + '<button type="button" data-office-plaza="models"></button>'
      + '</div>'
      + '<button type="button" class="ob-habblaud-games" data-office-games></button>'
      + '<div class="ob-habblaud-camera">'
      + '<button type="button" data-habblaud-action="zoom-out"></button>'
      + '<button type="button" data-habblaud-action="fit"></button>'
      + '<button type="button" data-habblaud-action="overview"></button>'
      + '<button type="button" data-habblaud-action="zoom-in"></button>'
      + '</div></div>'
      + '<div class="ob-habblaud-stage" data-office-view="harness"><canvas class="ob-habblaud-canvas" tabindex="0" aria-describedby="office-map-help"></canvas><p class="ob-habblaud-map-help" id="office-map-help"></p>'
      + '<div class="ob-habblaud-location" role="status" aria-live="polite" hidden></div>'
      + '<section class="ob-habblaud-hall-directory" id="office-hall-directory" data-office-hall-directory hidden aria-label="Agent halls">'
      + '<header class="ob-habblaud-hall-header"><div><h3></h3><p></p></div><button type="button" data-office-halls-close></button></header>'
      + '<label class="ob-habblaud-hall-search"><span class="ob-habblaud-visually-hidden"></span><input type="search" data-office-hall-search autocomplete="off" spellcheck="false"></label>'
      + '<div class="ob-habblaud-hall-results" data-office-hall-results role="status" aria-live="polite"></div>'
      + '<ul class="ob-habblaud-hall-list" data-office-hall-list></ul>'
      + '<div class="ob-habblaud-hall-empty" data-office-hall-empty role="status" aria-live="polite" hidden></div>'
      + '</section>'
      + '<section class="ob-habblaud-model-plaza" hidden aria-label="Assigned model workstations">'
      + '<header class="ob-habblaud-model-header"><div><h3></h3><p></p></div></header>'
      + '<div class="ob-habblaud-model-groups"></div>'
      + '<div class="ob-habblaud-model-empty" role="status" aria-live="polite" hidden></div>'
      + '</section></div>'
      + '<section class="ob-habblaud-fleet" data-office-fleet hidden aria-label="Bot fleet">'
      + '<div class="ob-habblaud-fleet-head"><span class="ob-habblaud-fleet-title" data-office-fleet-title></span>'
      + '<span class="ob-habblaud-fleet-at" data-office-fleet-at></span>'
      + '<button type="button" class="ob-habblaud-fleet-retry" data-office-fleet-retry hidden></button>'
      + '<button type="button" class="ob-habblaud-fleet-health-open" data-office-health-open hidden></button>'
      + '<button type="button" class="ob-habblaud-fleet-open" data-office-fleet-open hidden></button></div>'
      + '<div class="ob-habblaud-fleet-summary" data-office-fleet-summary role="status" aria-live="polite"></div>'
      + '<div class="ob-habblaud-fleet-health-line" data-office-health-line hidden><span data-office-health-summary></span></div>'
      + '<div class="ob-habblaud-fleet-signals" data-office-fleet-signals>'
      + '<button type="button" class="ob-habblaud-fleet-signal is-hub" data-office-fleet-signal="hub" data-office-fleet-bot="" hidden><span class="ob-habblaud-fleet-signal-label"></span><span class="ob-habblaud-fleet-signal-value"></span></button>'
      + '<button type="button" class="ob-habblaud-fleet-signal is-bottleneck" data-office-fleet-signal="bottleneck" data-office-fleet-bot="" hidden><span class="ob-habblaud-fleet-signal-label"></span><span class="ob-habblaud-fleet-signal-value"></span></button>'
      + '<button type="button" class="ob-habblaud-fleet-signal is-hotspot" data-office-fleet-signal="hotspot" data-office-fleet-bot="" hidden><span class="ob-habblaud-fleet-signal-label"></span><span class="ob-habblaud-fleet-signal-value"></span></button>'
      + '<button type="button" class="ob-habblaud-fleet-signal is-reciprocal" data-office-fleet-signal="reciprocal" data-office-fleet-bot="" hidden><span class="ob-habblaud-fleet-signal-label"></span><span class="ob-habblaud-fleet-signal-value"></span></button>'
      + '<button type="button" class="ob-habblaud-fleet-signal is-isolated" data-office-fleet-signal="isolated" data-office-fleet-bot="" hidden><span class="ob-habblaud-fleet-signal-label"></span><span class="ob-habblaud-fleet-signal-value"></span></button>'
      + '</div></section>'
      + '<div class="ob-habblaud-list-header"><div class="ob-habblaud-agents-heading"></div>'
      + '<button type="button" class="ob-habblaud-details" data-office-details aria-pressed="false"></button>'
      + '<input class="ob-habblaud-bot-search" type="search" data-office-bot-search autocomplete="off" spellcheck="false"></div>'
      + '<ul class="ob-habblaud-agents"></ul>'
      + '<div class="ob-habblaud-empty" role="status" aria-live="polite" hidden></div>'
      + '</section>';

    var view = container.querySelector('.ob-habblaud-office');
    var controls = view.querySelector('.ob-habblaud-camera');
    var canvas = view.querySelector('canvas');
    var list = view.querySelector('.ob-habblaud-agents');
    return {
      view: view,
      controls: controls,
      wordmark: view.querySelector('.ob-habblaud-wordmark'),
      stage: view.querySelector('.ob-habblaud-stage'),
      canvas: canvas,
      mapHelp: view.querySelector('.ob-habblaud-map-help'),
      list: list,
      location: view.querySelector('.ob-habblaud-location'),
      detailsButton: view.querySelector('[data-office-details]'),
      botSearch: view.querySelector('[data-office-bot-search]'),
      listHeader: view.querySelector('.ob-habblaud-list-header'),
      listHeading: view.querySelector('.ob-habblaud-agents-heading'),
      empty: view.querySelector('.ob-habblaud-empty'),
      plazaNav: view.querySelector('.ob-habblaud-plazas'),
      plazaButtons: view.querySelectorAll('button[data-office-plaza]'),
      hallsButton: view.querySelector('[data-office-halls]'),
      hallDirectory: view.querySelector('[data-office-hall-directory]'),
      hallTitle: view.querySelector('.ob-habblaud-hall-header h3'),
      hallNote: view.querySelector('.ob-habblaud-hall-header p'),
      hallClose: view.querySelector('[data-office-halls-close]'),
      hallSearchLabel: view.querySelector('.ob-habblaud-hall-search span'),
      hallSearch: view.querySelector('[data-office-hall-search]'),
      hallResults: view.querySelector('[data-office-hall-results]'),
      hallList: view.querySelector('[data-office-hall-list]'),
      hallEmpty: view.querySelector('[data-office-hall-empty]'),
      gamesButton: view.querySelector('[data-office-games]'),
      modelPanel: view.querySelector('.ob-habblaud-model-plaza'),
      modelHeading: view.querySelector('.ob-habblaud-model-header h3'),
      modelNote: view.querySelector('.ob-habblaud-model-header p'),
      modelGroups: view.querySelector('.ob-habblaud-model-groups'),
      modelEmpty: view.querySelector('.ob-habblaud-model-empty'),
      fleetPanel: view.querySelector('[data-office-fleet]'),
      fleetTitle: view.querySelector('[data-office-fleet-title]'),
      fleetAt: view.querySelector('[data-office-fleet-at]'),
      fleetRetry: view.querySelector('[data-office-fleet-retry]'),
      fleetOpen: view.querySelector('[data-office-fleet-open]'),
      fleetSummary: view.querySelector('[data-office-fleet-summary]'),
      healthLine: view.querySelector('[data-office-health-line]'),
      healthSummary: view.querySelector('[data-office-health-summary]'),
      healthOpen: view.querySelector('[data-office-health-open]'),
      fleetSignals: {
        hub: view.querySelector('[data-office-fleet-signal="hub"]'),
        bottleneck: view.querySelector('[data-office-fleet-signal="bottleneck"]'),
        hotspot: view.querySelector('[data-office-fleet-signal="hotspot"]'),
        reciprocal: view.querySelector('[data-office-fleet-signal="reciprocal"]'),
        isolated: view.querySelector('[data-office-fleet-signal="isolated"]')
      },
      rows: new Map(),
      hallRows: new Map(),
      groups: new Map()
    };
  }

  function renderLabels(state) {
    var labels = copy(state.options);
    var isEnglish = english(state.options);
    if (state.wordmark) state.wordmark.textContent = isEnglish ? 'Office' : '办公空间';
    state.view.setAttribute('aria-label', isEnglish ? 'Habblaud office' : 'Habblaud 办公室');
    state.controls.setAttribute('aria-label', isEnglish ? 'Office controls' : '办公室控制');
    state.plazaNav.setAttribute('aria-label', isEnglish ? 'Choose a plaza' : '选择广场');
    var roomCount = roomsOf(state.store && state.store.snapshot).length;
    state.hallsButton.textContent = labels.halls + ' ' + roomCount;
    state.hallsButton.setAttribute('aria-label', labels.hallsLabel + ', ' + roomCount + ' ' + labels.hallCount);
    state.hallsButton.title = state.hallsButton.getAttribute('aria-label');
    state.hallsButton.setAttribute('aria-expanded', state.hallDirectory.hidden ? 'false' : 'true');
    state.hallTitle.textContent = labels.hallsTitle;
    state.hallNote.textContent = labels.hallsNote;
    state.hallClose.textContent = '×';
    state.hallClose.setAttribute('aria-label', labels.hallClose);
    state.hallClose.title = labels.hallClose;
    state.hallSearchLabel.textContent = labels.hallSearchLabel;
    state.hallSearch.setAttribute('aria-label', labels.hallSearchLabel);
    state.hallSearch.placeholder = labels.hallSearch;
    state.hallList.setAttribute('aria-label', labels.hallsTitle);
    state.hallDirectory.setAttribute('aria-label', labels.hallsTitle);
    state.hallEmpty.textContent = roomCount ? labels.hallNoMatch : labels.hallEmpty;
    state.gamesButton.hidden = typeof state.options.onOpenGames !== 'function';
    state.view.querySelector('[data-habblaud-action="zoom-out"]').textContent = '−';
    state.view.querySelector('[data-habblaud-action="zoom-out"]').setAttribute('aria-label', labels.zoomOut);
    state.view.querySelector('[data-habblaud-action="zoom-out"]').title = labels.zoomOut;
    state.view.querySelector('[data-habblaud-action="fit"]').textContent = isEnglish ? 'Focus' : '聚焦';
    var overviewButton = state.view.querySelector('[data-habblaud-action="overview"]');
    overviewButton.textContent = isEnglish ? 'Overview' : '全景';
    overviewButton.title = labels.fit;
    overviewButton.setAttribute('aria-label', (isEnglish ? 'Overview: ' : '全景：') + labels.fit);
    state.view.querySelector('[data-habblaud-action="fit"]').setAttribute('aria-label', isEnglish ? 'Focus selected office' : '聚焦所选办公室');
    state.view.querySelector('[data-habblaud-action="fit"]').title = isEnglish ? 'Focus selected office' : '聚焦所选办公室';
    state.view.querySelector('[data-habblaud-action="zoom-in"]').textContent = '+';
    state.view.querySelector('[data-habblaud-action="zoom-in"]').setAttribute('aria-label', labels.zoomIn);
    state.view.querySelector('[data-habblaud-action="zoom-in"]').title = labels.zoomIn;
    state.plazaButtons[0].textContent = labels.harness;
    state.plazaButtons[0].setAttribute('aria-label', isEnglish ? 'Harness plaza' : 'Harness 广场');
    state.plazaButtons[1].textContent = labels.models;
    state.plazaButtons[1].setAttribute('aria-label', isEnglish ? 'Model plaza' : '大模型广场');
    state.gamesButton.textContent = labels.games;
    state.gamesButton.setAttribute('aria-label', isEnglish ? 'Open games hall' : '打开游戏大厅');
    state.gamesButton.title = state.gamesButton.getAttribute('aria-label');
    state.view.querySelector('.ob-habblaud-toolbar').setAttribute('aria-label', isEnglish ? 'Office controls' : '办公室控制');
    state.canvas.setAttribute('role', 'region');
    state.canvas.setAttribute('aria-roledescription', isEnglish ? 'Interactive map' : '交互地图');
    state.canvas.setAttribute('aria-label', isEnglish ? 'Office map' : '办公室地图');
    state.canvas.setAttribute('aria-keyshortcuts', 'ArrowUp ArrowDown ArrowLeft ArrowRight + - 0');
    setText(state.mapHelp, isEnglish ? 'Drag to move · Scroll to zoom · Arrow keys to move · 0 for overview' : '拖动移动 · 滚轮缩放 · 方向键移动 · 0 全景');
    state.canvas.title = state.mapHelp.textContent;
    if (state.plaza === 'models' || !state.hallDirectory.hidden) {
      state.canvas.setAttribute('aria-hidden', 'true');
      state.canvas.tabIndex = -1;
    } else {
      state.canvas.removeAttribute('aria-hidden');
      state.canvas.tabIndex = 0;
    }
    state.controls.hidden = state.plaza === 'models';
    renderDetailsControl(state);
    state.botSearch.placeholder = isEnglish ? 'Search Bots, executors or models' : '搜索 Bot、执行器或模型';
    state.botSearch.setAttribute('aria-label', state.botSearch.placeholder);
    state.botSearch.title = isEnglish ? 'Enter locates a single result · Esc clears · ⌘/Ctrl F searches this office' : 'Enter 定位唯一结果 · Esc 清空 · ⌘/Ctrl F 搜索办公室';
    state.listHeading.setAttribute('role', 'status');
    state.listHeading.setAttribute('aria-live', 'polite');
    state.controls.querySelectorAll('button').forEach(function (button) { button.disabled = state.roomIds.size === 0; });
    state.list.setAttribute('aria-label', labels.bots);
    state.modelPanel.setAttribute('aria-label', labels.modelTitle);
    state.modelHeading.textContent = labels.modelTitle;
    state.modelNote.textContent = labels.modelNote;
    state.modelGroups.setAttribute('aria-label', labels.modelTitle);
    state.plazaButtons[0].setAttribute('aria-pressed', state.plaza === 'harness' ? 'true' : 'false');
    state.plazaButtons[1].setAttribute('aria-pressed', state.plaza === 'models' ? 'true' : 'false');
    state.plazaButtons[0].classList.toggle('is-active', state.plaza === 'harness');
    state.plazaButtons[1].classList.toggle('is-active', state.plaza === 'models');
    state.stage.dataset.officeView = state.plaza;
    state.view.dataset.officeView = state.plaza;
    // Keep search ahead of model results in both visual and keyboard reading order.
    if (state.plaza === 'models' && state.listHeader.nextElementSibling !== state.stage) state.view.insertBefore(state.listHeader, state.stage);
    else if (state.plaza === 'harness' && state.stage.nextElementSibling !== state.listHeader) state.view.insertBefore(state.listHeader, state.list);
    state.canvas.dataset.officePlaza = state.plaza;
    state.canvas.dataset.reducedMotion = state.options.reducedMotion ? 'true' : 'false';
    state.view.dataset.reducedMotion = state.options.reducedMotion ? 'true' : 'false';
    state.modelPanel.hidden = state.plaza !== 'models';
    state.list.hidden = state.plaza !== 'harness';
    state.listHeading.hidden = false;
    updateLocation(state);
    state.empty.hidden = state.plaza !== 'harness' || state.rows.size > 0;
    state.modelEmpty.hidden = state.plaza !== 'models' || state.rows.size > 0;
  }

  function createStore() {
    var listeners = new Set();
    return {
      snapshot: null,
      on: function (event, callback) {
        if (event !== 'snapshot' || typeof callback !== 'function') return function () {};
        listeners.add(callback);
        return function () { listeners.delete(callback); };
      },
      publish: function (snapshot) {
        this.snapshot = snapshot || null;
        listeners.forEach(function (callback) { callback(this.snapshot); }, this);
      }
    };
  }

  function destroyWorld(state) {
    if (state.motionTimer) clearTimeout(state.motionTimer);
    state.motionTimer = null;
    if (state.resizeFrame) window.cancelAnimationFrame(state.resizeFrame);
    state.resizeFrame = null;
    state.motionSuspended = false;
    if (state.offSelect) state.offSelect();
    state.offSelect = null;
    if (state.world) state.world.destroy();
    state.world = null;
  }

  function pauseAfter(state, delay) {
    if (state.motionTimer) clearTimeout(state.motionTimer);
    state.motionTimer = null;
    if (state.plaza === 'models') return;
    if (!state.options.reducedMotion || !state.world || typeof state.world.setSuspended !== 'function') return;
    var world = state.world;
    state.motionTimer = setTimeout(function () {
      state.motionTimer = null;
      if (sessions.get(state.container) !== state || state.world !== world || !state.options.reducedMotion) return;
      world.setSuspended(true);
      state.motionSuspended = true;
    }, delay);
  }

  function resumeForInteraction(state) {
    state.lastInteractionAt = Date.now();
    if (state.plaza === 'models') return;
    if (!state.options.reducedMotion || !state.world || typeof state.world.setSuspended !== 'function') return;
    if (state.motionTimer) clearTimeout(state.motionTimer);
    state.motionTimer = null;
    if (state.motionSuspended) {
      state.world.setSuspended(false);
      state.motionSuspended = false;
    }
    pauseAfter(state, 600);
  }

  function syncMotion(state, previousPreference) {
    if (!state.world) return;
    if (state.plaza === 'models') {
      if (state.motionTimer) clearTimeout(state.motionTimer);
      state.motionTimer = null;
      if (!state.motionSuspended && typeof state.world.setSuspended === 'function') state.world.setSuspended(true);
      state.motionSuspended = true;
      return;
    }
    if (!state.options.reducedMotion) {
      if (state.motionTimer) clearTimeout(state.motionTimer);
      state.motionTimer = null;
      if (state.motionSuspended && typeof state.world.setSuspended === 'function') state.world.setSuspended(false);
      state.motionSuspended = false;
      return;
    }
    // A fresh frame reflects the new snapshot or preference, then the scene pauses.
    var delay = previousPreference === true && state.lastInteractionAt && Date.now() - state.lastInteractionAt < 600
      ? Math.max(80, 600 - (Date.now() - state.lastInteractionAt)) : 80;
    if (state.motionSuspended && typeof state.world.setSuspended === 'function') {
      state.world.setSuspended(false);
      state.motionSuspended = false;
    }
    pauseAfter(state, delay);
  }

  function redrawAfterResize(state) {
    if (document.hidden || state.plaza === 'models' || !state.options.reducedMotion || !state.world || typeof state.world.setSuspended !== 'function') return;
    var elapsed = state.lastInteractionAt ? Date.now() - state.lastInteractionAt : Infinity;
    var delay = elapsed < 600 ? Math.max(120, 600 - elapsed) : 120;
    if (state.motionTimer) clearTimeout(state.motionTimer);
    state.motionTimer = null;
    if (state.motionSuspended) {
      state.world.setSuspended(false);
      state.motionSuspended = false;
    }
    // The renderer notices canvas size changes in its RAF loop and repaints
    // there. Wake it briefly so a suspended canvas is not left cleared.
    pauseAfter(state, delay);
  }

  function selectHall(state, roomId, options) {
    options = options || {};
    if (!state.world || typeof state.world.select !== 'function' || !state.roomIds.has(roomId)) return false;
    state.roomSelection = roomId;
    state.cameraIntent = { type: 'room', id: roomId };
    state.lastInteractionAt = Date.now();
    if (options.userInitiated) state.userNavigated = true;
    if (state.plaza === 'models' && options.deferWhenHidden) {
      state.pendingHallFocus = roomId;
      updateHallSelection(state);
      return true;
    }
    if (state.options.reducedMotion && state.motionSuspended && typeof state.world.setSuspended === 'function') {
      state.world.setSuspended(false);
      state.motionSuspended = false;
    }
    state.suppressSelectionCallback = true;
    try { state.world.select({ type: 'room', id: roomId }, { focus: true }); }
    finally { state.suppressSelectionCallback = false; }
    state.pendingHallFocus = null;
    updateHallSelection(state);
    if (state.options.reducedMotion) pauseAfter(state, 600);
    return true;
  }

  function focusInitialHall(state, snapshot) {
    var roomId = selectedAgentRoom(snapshot) || (roomsOf(snapshot)[0] && roomsOf(snapshot)[0].id);
    if (!roomId || !selectHall(state, roomId, { deferWhenHidden: true })) return null;
    return roomId;
  }

  function refocusInitialHallAfterFirstFrame(state, roomId, world) {
    if (!roomId || typeof window !== 'object' || typeof window.requestAnimationFrame !== 'function') return;
    // The Habblaud runtime frames the complete building on its first initialized
    // RAF. A focus requested during mount can be overwritten by that overview.
    // Re-apply the room focus after that frame, unless the user has started
    // navigating or opened the directory in the meantime.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (sessions.get(state.container) !== state || state.world !== world) return;
        if (!state.roomIds.has(roomId) || state.roomSelection !== roomId || state.userNavigated || !state.hallDirectory.hidden || state.plaza !== 'harness') return;
        selectHall(state, roomId);
      });
    });
  }

  function setHallDirectory(state, open, restoreFocus) {
    state.hallDirectory.hidden = !open;
    state.canvas.tabIndex = open || state.plaza === 'models' ? -1 : 0;
    state.canvas.inert = open;
    if (open || state.plaza === 'models') state.canvas.setAttribute('aria-hidden', 'true');
    else state.canvas.removeAttribute('aria-hidden');
    state.hallsButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      state.hallsButton.classList.add('is-active');
      state.hallSearch.focus();
    } else {
      state.hallsButton.classList.remove('is-active');
      if (restoreFocus) {
        state.hallsButton.focus();
        if (state.pendingHallFocus && state.roomIds.has(state.pendingHallFocus)) selectHall(state, state.pendingHallFocus);
      }
    }
  }

  function createWorld(state) {
    var runtime = typeof window === 'object' ? window.OpenBotHabblaudRuntime : null;
    if (!runtime || typeof runtime.createWorld !== 'function') throw new Error('Habblaud runtime is unavailable');
    var locale = english(state.options) ? 'en' : 'zh-CN';
    if (typeof runtime.initializeLocale === 'function') runtime.initializeLocale(locale);
    else if (typeof runtime.setLocale === 'function') runtime.setLocale(locale);
    state.world = runtime.createWorld(state.canvas, state.store);
    if (typeof state.world.setOptions === 'function') state.world.setOptions({
      theme: 'none',
      dayNight: true,
      daylight: 'auto',
      showNames: true,
      // Status stays in the Bot list. Habblaud's simulated dialogue is hidden so it cannot read as Bot output.
      bubbles: 'none',
      liveliness: state.options.reducedMotion ? 'calm' : 'normal',
      followSelected: false
    });
    if (typeof state.world.onSelect === 'function') {
      state.offSelect = state.world.onSelect(function (selection) {
        var id = selection && selection.type === 'agent' ? selection.id : null;
        state.roomSelection = selection && selection.type === 'room' && state.roomIds.has(selection.id) ? selection.id : null;
        state.worldSelection = id && state.agentIds.has(id) ? id : null;
        updateRowSelection(state);
        updateHallSelection(state);
        if (!state.suppressSelectionCallback && state.worldSelection && typeof state.options.onSelectBot === 'function') {
          state.options.onSelectBot(state.worldSelection);
        }
      });
    }
    state.canvas.dataset.reducedMotion = state.options.reducedMotion ? 'true' : 'false';
    var focusedInitialHall = focusInitialHall(state, state.store.snapshot);
    refocusInitialHallAfterFirstFrame(state, focusedInitialHall, state.world);
    if (state.plaza === 'models') {
      if (typeof state.world.setSuspended === 'function') {
        state.world.setSuspended(true);
        state.motionSuspended = true;
      }
    } else pauseAfter(state, focusedInitialHall && state.options.reducedMotion ? 500 : 60);
  }

  function setPlaza(state, plaza) {
    if (plaza !== 'harness' && plaza !== 'models') return;
    if (state.plaza === plaza) return;
    if (plaza === 'models' && !state.hallDirectory.hidden) setHallDirectory(state, false, false);
    state.plaza = plaza;
    renderLabels(state);
    renderAgents(state, state.store.snapshot);
    if (!state.world || typeof state.world.setSuspended !== 'function') return;
    if (plaza === 'models') {
      if (state.motionTimer) clearTimeout(state.motionTimer);
      state.motionTimer = null;
      state.world.setSuspended(true);
      state.motionSuspended = true;
    } else {
      if (state.motionSuspended) state.world.setSuspended(false);
      state.motionSuspended = false;
      if (state.pendingHallFocus && state.roomIds.has(state.pendingHallFocus)) selectHall(state, state.pendingHallFocus);
      syncMotion(state, !!state.options.reducedMotion);
    }
  }

  function updateRowSelection(state) {
    state.rows.forEach(function (row, id) {
      var current = !!row.agent.openbot.selected;
      var focused = state.worldSelection === id;
      row.button.classList.toggle('is-current', current);
      row.button.classList.toggle('is-world-selected', focused);
      row.li.classList.toggle('is-room-selected', !!state.roomSelection && indexedRoom(state, row.agent) === state.roomSelection);
      setAttr(row.button, 'aria-current', current ? 'page' : null);
      setAttr(row.locate, 'aria-label', (english(state.options) ? 'Locate on map: ' : '在地图定位：') + String(row.agent.name || id) + (focused ? (english(state.options) ? ' (located)' : '（已定位）') : ''));
      row.locate.classList.toggle('is-located', focused);
    });
  }

  function avatarSignature(agent) {
    var p = agent && agent.openbot || {};
    return [p.avatar || '', p.color || '', p.status || ''].join('\u001f');
  }

  function buildRow(state, agent) {
    var li = document.createElement('li');
    li.className = 'ob-habblaud-agent-item';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'ob-habblaud-agent';
    button.setAttribute('data-habblaud-agent', agent.id);
    button.setAttribute('data-office-actor', agent.id);
    var avatarWrap = document.createElement('span');
    avatarWrap.className = 'ob-habblaud-avatar-wrap';
    var avatar = document.createElement('span');
    avatar.className = 'ob-habblaud-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    var rank = document.createElement('span');
    rank.className = 'ob-habblaud-rank';
    rank.hidden = true;
    avatarWrap.appendChild(avatar);
    avatarWrap.appendChild(rank);
    var text = document.createElement('span');
    text.className = 'ob-habblaud-agent-copy';
    var name = document.createElement('span');
    name.className = 'ob-habblaud-agent-name';
    var status = document.createElement('span');
    status.className = 'ob-habblaud-agent-status';
    var route = document.createElement('span');
    route.className = 'ob-habblaud-agent-route';
    var fleet = document.createElement('span');
    fleet.className = 'ob-habblaud-agent-fleet';
    fleet.hidden = true;
    var health = document.createElement('span');
    health.className = 'ob-habblaud-agent-health';
    health.hidden = true;
    text.appendChild(name);
    text.appendChild(status);
    text.appendChild(route);
    text.appendChild(fleet);
    text.appendChild(health);
    button.appendChild(avatarWrap);
    button.appendChild(text);
    li.appendChild(button);
    var locate = document.createElement('button');
    locate.type = 'button';
    locate.className = 'ob-habblaud-locate';
    locate.setAttribute('data-office-locate', agent.id);
    locate.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>';
    li.appendChild(locate);
    var row = { li: li, button: button, locate: locate, avatarWrap: avatarWrap, avatar: avatar, rank: rank,
      name: name, status: status, route: route, fleet: fleet, health: health, agent: agent, avatarSignature: '' };
    state.rows.set(agent.id, row);
    return row;
  }

  function ensureModelGroup(state, model) {
    var group = state.groups.get(model);
    if (group) return group;
    var element = document.createElement('section');
    element.className = 'ob-habblaud-model-group';
    element.setAttribute('data-model-group', model);
    var heading = document.createElement('h4');
    heading.className = 'ob-habblaud-model-name';
    heading.textContent = model;
    var count = document.createElement('span');
    count.className = 'ob-habblaud-model-count';
    var list = document.createElement('ul');
    list.className = 'ob-habblaud-model-agents';
    list.setAttribute('aria-label', model);
    element.appendChild(heading);
    element.appendChild(count);
    element.appendChild(list);
    group = { element: element, heading: heading, count: count, list: list, agents: [] };
    state.groups.set(model, group);
    return group;
  }

  function placeRows(state, rows, list) {
    var nextRow = list.firstElementChild;
    rows.forEach(function (row) {
      if (row.li !== nextRow) list.insertBefore(row.li, nextRow);
      nextRow = row.li.nextElementSibling;
    });
  }

  function hallKindLabel(hall, labels) {
    var kind = hall && hall.openbot && hall.openbot.kind;
    return kind === 'api' ? labels.hallTypeApi : kind === 'native' ? labels.hallTypeNative : labels.hallTypeUnknown;
  }

  function catalogState(value, yes, no, unknown) {
    return value === 'yes' ? yes : value === 'no' ? no : unknown;
  }

  function hallOccupancy(hall, labels, isEnglish) {
    var count = hall && hall.openbot && hall.openbot.occupants;
    if (!Number.isSafeInteger(count) || count < 0) return isEnglish ? 'Occupancy unknown' : '入住人数未知';
    if (count === 0) return labels.noBots;
    return isEnglish ? count + (count === 1 ? ' Bot' : ' Bots') : count + ' ' + labels.bot;
  }

  function hallSearchText(hall, labels, isEnglish) {
    var meta = hall && hall.openbot || {};
    return [hall && hall.name, hall && hall.id, meta.harnessId, hallKindLabel(hall, labels), catalogState(meta.installed, labels.installed, labels.notInstalled, labels.installUnknown),
      catalogState(meta.configured, labels.configured, labels.notConfigured, labels.configUnknown), labels.readinessUnknown,
      hallOccupancy(hall, labels, isEnglish)].join(' ').toLocaleLowerCase(isEnglish ? 'en' : 'zh-CN');
  }

  function buildHallRow(state, hall) {
    var li = document.createElement('li');
    li.className = 'ob-habblaud-hall-item';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'ob-habblaud-hall';
    button.setAttribute('data-office-hall', hall.id);
    var heading = document.createElement('span');
    heading.className = 'ob-habblaud-hall-name';
    var occupancy = document.createElement('span');
    occupancy.className = 'ob-habblaud-hall-occupancy';
    var meta = document.createElement('span');
    meta.className = 'ob-habblaud-hall-meta';
    button.appendChild(heading);
    button.appendChild(occupancy);
    button.appendChild(meta);
    li.appendChild(button);
    var row = { li: li, button: button, heading: heading, occupancy: occupancy, meta: meta, hall: hall };
    state.hallRows.set(hall.id, row);
    return row;
  }

  function updateLocation(state) {
    var snapshot = state.store && state.store.snapshot;
    var actor = snapshot && (snapshot.agents || []).find(function (agent) { return agent.id === state.worldSelection; });
    var roomId = state.roomSelection || indexedRoom(state, actor);
    var hall = state.roomsById.get(roomId);
    state.location.hidden = !hall || state.plaza !== 'harness';
    var label = hall ? (english(state.options) ? 'Selected: ' : '已选：') + hall.name : '';
    if (actor && hall) label += ' · ' + actor.name;
    if (state.location.textContent !== label) state.location.textContent = label;
  }

  function renderDetailsControl(state) {
    var isEnglish = english(state.options);
    state.detailsButton.textContent = state.showRouteDetails
      ? (isEnglish ? 'Hide details' : '收起详情') : (isEnglish ? 'Connection details' : '连接与额度');
    state.detailsButton.setAttribute('aria-label', state.showRouteDetails
      ? (isEnglish ? 'Hide unobserved connection and quota details' : '收起尚未观测的连接与额度详情')
      : (isEnglish ? 'Show unobserved connection and quota details' : '显示尚未观测的连接与额度详情'));
    state.detailsButton.setAttribute('aria-pressed', state.showRouteDetails ? 'true' : 'false');
  }

  function unobservedRoute(agent) {
    var route = agent.openbot || {};
    return (!route.reason || route.reason === 'unknown' || route.reason === 'not-observed') && routeLight(agent) === 'unknown'
      && (!route.health || !route.health.state || route.health.state === 'unknown')
      && (!route.quota || !route.quota.state || route.quota.state === 'unknown');
  }

  function updateHallSelection(state) {
    state.hallRows.forEach(function (row, id) {
      setAttr(row.button, 'aria-pressed', state.roomSelection === id ? 'true' : 'false');
      row.button.classList.toggle('is-selected', state.roomSelection === id);
    });
    updateRowSelection(state);
    updateLocation(state);
  }

  function renderHalls(state, snapshot) {
    var labels = copy(state.options);
    var isEnglish = english(state.options);
    var halls = roomsOf(snapshot);
    var query = String(state.hallSearch.value || '').trim().toLocaleLowerCase(isEnglish ? 'en' : 'zh-CN');
    var visible = halls.filter(function (hall) { return !query || hallSearchText(hall, labels, isEnglish).indexOf(query) >= 0; });
    var visibleIds = new Set(halls.map(function (hall) { return hall.id; }));
    var active = document.activeElement;
    var focusedHall = state.view.contains(active) && active && active.matches && active.matches('[data-office-hall]') ? active : null;
    state.hallRows.forEach(function (row, id) {
      if (visibleIds.has(id)) return;
      row.li.remove();
      state.hallRows.delete(id);
    });
    var matchedIds = new Set(visible.map(function (hall) { return hall.id; }));
    state.hallRows.forEach(function (row, id) { if (!matchedIds.has(id)) row.li.remove(); });
    var rows = visible.map(function (hall) {
      var row = state.hallRows.get(hall.id) || buildHallRow(state, hall);
      var meta = hall.openbot || {};
      var name = String(hall.name || hall.id);
      var kind = hallKindLabel(hall, labels);
      var installed = catalogState(meta.installed, labels.installed, labels.notInstalled, labels.installUnknown);
      var configured = catalogState(meta.configured, labels.configured, labels.notConfigured, labels.configUnknown);
      var occupancy = hallOccupancy(hall, labels, isEnglish);
      var readiness = labels.readinessUnknown;
      row.hall = hall;
      row.heading.textContent = name;
      row.heading.title = name;
      row.occupancy.textContent = occupancy;
      row.meta.textContent = [kind, installed].join(' · ');
      row.button.setAttribute('data-harness-id', typeof meta.harnessId === 'string' ? meta.harnessId : '');
      row.button.setAttribute('data-office-kind', typeof meta.kind === 'string' ? meta.kind : 'unknown');
      row.button.setAttribute('data-office-installed', typeof meta.installed === 'string' ? meta.installed : 'unknown');
      row.button.setAttribute('data-office-configured', typeof meta.configured === 'string' ? meta.configured : 'unknown');
      row.button.setAttribute('data-office-readiness', typeof meta.readiness === 'string' ? meta.readiness : 'unknown');
      row.button.setAttribute('data-office-occupants', Number.isSafeInteger(meta.occupants) && meta.occupants >= 0 ? String(meta.occupants) : 'unknown');
      var accessibleSummary = name + '. ' + kind + '. ' + installed + '. ' + configured + '. ' + readiness + '. ' + occupancy;
      row.button.setAttribute('aria-label', accessibleSummary);
      row.button.title = accessibleSummary;
      return row;
    });
    placeRows(state, rows, state.hallList);
    state.hallResults.textContent = isEnglish
      ? visible.length + ' of ' + halls.length + ' halls'
      : '显示 ' + visible.length + ' / ' + halls.length + ' 个大厅';
    state.hallEmpty.hidden = visible.length > 0;
    state.hallEmpty.textContent = halls.length ? labels.hallNoMatch : labels.hallEmpty;
    if (focusedHall && focusedHall.isConnected && document.activeElement !== focusedHall) {
      try { focusedHall.focus({ preventScroll: true }); }
      catch (_) { focusedHall.focus(); }
    } else if (focusedHall && !focusedHall.isConnected && !state.hallDirectory.hidden) {
      state.hallSearch.focus();
    }
    updateHallSelection(state);
  }

  function fleetNumber(value, options) {
    var number = Number.isSafeInteger(value) && value > 0 ? value : 0;
    try {
      return new Intl.NumberFormat(english(options) ? 'en' : 'zh-CN').format(number);
    } catch (_) {
      return String(number);
    }
  }

  function fleetTime(value, options) {
    if (!Number.isFinite(value)) return '';
    try {
      var locale = english(options) ? 'en' : 'zh-CN';
      if (!timeFormatters.has(locale + ':fleet')) timeFormatters.set(locale + ':fleet',
        new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }));
      return timeFormatters.get(locale + ':fleet').format(new Date(value));
    } catch (_) {
      return new Date(value).toLocaleTimeString();
    }
  }

  function fleetName(state, id) {
    return (state.fleetNames && state.fleetNames.get(id)) || String(id || '');
  }

  function fleetPartnerName(state, partner) {
    return partner && partner.botId ? fleetName(state, partner.botId) : '';
  }

  function fleetRowMeta(state, entry) {
    if (!entry) return '';
    var labels = copy(state.options);
    if (!entry.hasActivity) return labels.fleetNoRecord;
    var parts = [];
    if (entry.invocations > 0) parts.push(fleetNumber(entry.invocations, state.options) + ' ' + labels.fleetCallsShort);
    else if (entry.modelRequests > 0) parts.push(fleetNumber(entry.modelRequests, state.options) + ' ' + labels.fleetModelsShort);
    if (entry.topOutgoing) {
      parts.push(labels.fleetCommonPartner + ' ' + fleetPartnerName(state, entry.topOutgoing) +
        ' ' + fleetNumber(entry.topOutgoing.taskCount, state.options));
    } else if (entry.outgoingTasks > 0) {
      parts.push(labels.fleetOutgoing + ' ' + fleetNumber(entry.outgoingTasks, state.options));
    } else if (entry.incomingTasks > 0) {
      parts.push(labels.fleetIncoming + ' ' + fleetNumber(entry.incomingTasks, state.options));
    }
    return parts.join(' · ');
  }

  function healthStatusLabel(state, value) {
    var labels = copy(state.options);
    return ({
      healthy: labels.healthHealthy,
      degraded: labels.healthDegraded,
      unhealthy: labels.healthUnhealthy,
      unverified: labels.healthUnverified,
      unchecked: labels.healthUnchecked
    })[value] || labels.healthUnchecked;
  }

  function healthLayerText(state, entry, layerId, letter, label) {
    var layer = entry && entry.layers && entry.layers[layerId];
    if (!layer) return letter + '—';
    if (Number.isFinite(layer.score) && layer.score >= 0 && layer.score <= 100) return letter + Math.round(layer.score);
    return letter + healthStatusLabel(state, layer.status);
  }

  function healthRowMeta(state, entry) {
    if (!entry) return '';
    var labels = copy(state.options);
    return labels.healthSummary + ' ' + [
      healthLayerText(state, entry, 'bot', 'B', labels.healthBot),
      healthLayerText(state, entry, 'harness', 'H', labels.healthHarness),
      healthLayerText(state, entry, 'model', 'M', labels.healthModel)
    ].join(' · ');
  }

  function healthRowDetail(state, entry) {
    if (!entry) return '';
    var labels = copy(state.options);
    return [
      [labels.healthBot, 'bot'], [labels.healthHarness, 'harness'], [labels.healthModel, 'model']
    ].map(function (item) {
      var layer = entry.layers && entry.layers[item[1]] || { status: 'unchecked', score: null };
      return item[0] + ': ' + healthStatusLabel(state, layer.status) +
        (Number.isFinite(layer.score) ? ' ' + Math.round(layer.score) : '');
    }).join(' · ');
  }

  function fleetRowDetail(state, entry) {
    if (!entry) return '';
    var labels = copy(state.options), parts = [];
    if (entry.rank) parts.push(labels.fleetDetailRank + ' ' + entry.rank);
    parts.push(labels.fleetDetailCalls + ' ' + fleetNumber(entry.invocations, state.options));
    if (entry.modelRequests) parts.push(fleetNumber(entry.modelRequests, state.options) + ' ' + labels.fleetModelsShort);
    parts.push(labels.fleetDetailOutgoing + ' ' + fleetNumber(entry.outgoingTasks, state.options) +
      ' (' + fleetNumber(entry.partnerCount, state.options) + ' ' + labels.fleetPartners + ')');
    parts.push(labels.fleetDetailIncoming + ' ' + fleetNumber(entry.incomingTasks, state.options));
    if (entry.outgoingTasks) {
      parts.push(labels.fleetDetailIssues + ' ' + fleetNumber(entry.outgoingIssues, state.options) +
        '/' + fleetNumber(entry.outgoingTasks, state.options));
    }
    if (entry.usageCoverage == null) parts.push(labels.fleetDetailCoverage + ' ' + labels.fleetUnknown);
    else {
      parts.push(labels.fleetDetailCoverage + ' ' + entry.usageCoverage + '% (' +
        fleetNumber(entry.usageKnownRuns, state.options) + '/' +
        fleetNumber(entry.usageKnownRuns + entry.usageMissingRuns, state.options) + ')');
    }
    if (entry.topOutgoing) parts.push(labels.fleetDetailTopOut + ' ' + fleetPartnerName(state, entry.topOutgoing) +
      ' ' + fleetNumber(entry.topOutgoing.taskCount, state.options));
    if (entry.topIncoming) parts.push(labels.fleetDetailTopIn + ' ' + fleetPartnerName(state, entry.topIncoming) +
      ' ' + fleetNumber(entry.topIncoming.taskCount, state.options));
    return parts.join(' · ');
  }

  function setFleetSignal(state, key, label, value, botId) {
    var node = state.fleetSignals[key];
    if (!node) return;
    var active = !!(value && botId);
    node.hidden = !active;
    if (!active) return;
    setText(node.querySelector('.ob-habblaud-fleet-signal-label'), label);
    setText(node.querySelector('.ob-habblaud-fleet-signal-value'), value);
    setAttr(node, 'data-office-fleet-bot', botId);
    var copyText = copy(state.options);
    var accessible = label + ': ' + value + '. ' + copyText.fleetLocate;
    setAttr(node, 'aria-label', accessible);
    node.title = accessible;
  }

  function renderFleet(state, snapshot) {
    var optedIn = Object.prototype.hasOwnProperty.call(state.options || {}, 'fleet') ||
      Object.prototype.hasOwnProperty.call(state.options || {}, 'fleetStatus');
    if (!optedIn) {
      state.fleetPanel.hidden = true;
      state.fleetById = null;
      state.healthById = null;
      return;
    }
    var labels = copy(state.options);
    var fleet = state.options.fleet || null;
    var health = state.options.health || null;
    var healthOptedIn = Object.prototype.hasOwnProperty.call(state.options || {}, 'health') ||
      Object.prototype.hasOwnProperty.call(state.options || {}, 'healthStatus');
    if (state.fleetRef !== fleet) {
      state.fleetRef = fleet;
      state.fleetById = fleet && Array.isArray(fleet.bots) ? new Map(fleet.bots.map(function (bot) {
        return [bot.botId, bot];
      })) : null;
    }
    state.healthById = health && health.byBot instanceof Map ? health.byBot : null;
    state.fleetNames = new Map();
    (snapshot && Array.isArray(snapshot.agents) ? snapshot.agents : []).forEach(function (agent) {
      if (agent && typeof agent.id === 'string') state.fleetNames.set(agent.id, String(agent.name || agent.id));
    });
    var status = ['loading', 'ready', 'unavailable', 'error'].includes(state.options.fleetStatus)
      ? state.options.fleetStatus : fleet ? 'ready' : 'unavailable';
    state.fleetPanel.hidden = state.plaza === 'models';
    state.fleetPanel.dataset.fleetState = status;
    state.fleetPanel.setAttribute('aria-label', labels.fleetTitle);
    setText(state.fleetTitle, labels.fleetTitle + ' · ' + labels.fleetWindow);
    setText(state.fleetAt, Number.isFinite(state.options.fleetAt)
      ? labels.fleetUpdated + ' ' + fleetTime(state.options.fleetAt, state.options) : '');
    state.fleetRetry.hidden = !['unavailable', 'error'].includes(status) ||
      typeof state.options.onRefreshFleet !== 'function';
    state.fleetRetry.textContent = labels.fleetRetry;
    state.fleetOpen.hidden = typeof state.options.onOpenDashboard !== 'function';
    state.fleetOpen.textContent = labels.fleetDashboard;

    var summary = fleet && fleet.summary || null;
    var summaryText = labels.fleetLoading;
    if (['unavailable', 'error'].includes(status)) summaryText = labels.fleetUnavailable;
    else if (status === 'ready') {
      if (!summary || !summary.activeBots) summaryText = labels.fleetEmpty;
      else {
        var parts = [
          fleetNumber(summary.activeBots, state.options) + '/' + fleetNumber(summary.botCount, state.options) +
            ' ' + labels.fleetActive,
          fleetNumber(summary.totalInvocations, state.options) + ' ' + labels.fleetCalls,
          fleetNumber(summary.totalDelegations, state.options) + ' ' + labels.fleetDelegations
        ];
        if (Number.isSafeInteger(summary.usageCoverage)) {
          parts.push(labels.fleetUsage + ' ' + summary.usageCoverage + '%');
        }
        summaryText = parts.join(' · ');
      }
    }
    setText(state.fleetSummary, summaryText);

    if (!healthOptedIn) {
      state.healthLine.hidden = true;
      state.healthOpen.hidden = true;
    } else {
      var healthState = ['loading', 'ready', 'unavailable', 'error'].includes(state.options.healthStatus)
        ? state.options.healthStatus : health ? 'ready' : 'unavailable';
      var healthText = labels.healthUnavailable;
      if (healthState === 'loading') healthText = english(state.options) ? 'Loading health status…' : '正在读取健康状态…';
      else if (health && health.summary && health.summary.total) {
        var hs = health.summary;
        var layerCounts = hs.layers || {};
        function healthyCount(id) {
          var count = layerCounts[id] && layerCounts[id].healthy || 0;
          return fleetNumber(count, state.options) + '/' + fleetNumber(hs.total, state.options);
        }
        healthText = labels.healthSummary + ' · ' + [
          labels.healthBot + ' ' + healthyCount('bot'),
          labels.healthHarness + ' ' + healthyCount('harness'),
          labels.healthModel + ' ' + healthyCount('model')
        ].join(' · ') + ' · ' + (english(state.options) ? 'Checked ' : '已检测 ') +
          fleetNumber(hs.checked, state.options) + '/' + fleetNumber(hs.total, state.options);
      } else if (healthState === 'ready') healthText = english(state.options) ? 'No health records in this range.' : '此范围暂无健康记录。';
      state.healthLine.hidden = false;
      state.healthLine.dataset.healthState = healthState;
      setText(state.healthSummary, healthText);
      state.healthOpen.hidden = typeof state.options.onOpenHealth !== 'function';
      state.healthOpen.textContent = labels.healthOpen;
      state.healthOpen.setAttribute('aria-label', labels.healthOpen);
      state.healthOpen.title = labels.healthOpen;
    }

    var signals = status === 'ready' && fleet && fleet.signals || {};
    var hub = signals.hub;
    setFleetSignal(state, 'hub', labels.fleetHub, hub
      ? fleetName(state, hub.botId) + ' · ' + fleetNumber(hub.outgoingTasks, state.options) + ' ' +
        labels.fleetOutgoing + ' / ' + fleetNumber(hub.uniquePartners, state.options) + ' ' + labels.fleetPartners
      : '', hub && hub.botId);
    var bottleneck = signals.bottleneck;
    setFleetSignal(state, 'bottleneck', labels.fleetBottleneck, bottleneck
      ? fleetName(state, bottleneck.botId) + ' · ' + fleetNumber(bottleneck.issues, state.options) + '/' +
        fleetNumber(bottleneck.outgoingTasks, state.options) + ' ' + labels.fleetIssues
      : '', bottleneck && bottleneck.botId);
    var hotspot = signals.hotspot;
    setFleetSignal(state, 'hotspot', labels.fleetHotspot, hotspot
      ? fleetName(state, hotspot.botId) + ' · ' + fleetNumber(hotspot.modelRequests, state.options) + ' ' +
        labels.fleetModelsShort
      : '', hotspot && hotspot.botId);
    var reciprocal = signals.reciprocal;
    setFleetSignal(state, 'reciprocal', labels.fleetReciprocal, reciprocal
      ? fleetName(state, reciprocal.fromBotId) + ' ⇄ ' + fleetName(state, reciprocal.toBotId) + ' · ' +
        fleetNumber((reciprocal.outgoing || 0) + (reciprocal.incoming || 0), state.options) + ' ' +
        labels.fleetCallsShort
      : '', reciprocal && reciprocal.fromBotId);
    var isolated = signals.isolated;
    var isolatedCount = summary && summary.isolatedCount || 0;
    setFleetSignal(state, 'isolated', labels.fleetIsolated, isolated
      ? fleetNumber(isolatedCount, state.options) + ' ' +
        (english(state.options) && isolatedCount === 1 ? 'Bot' : labels.fleetIsolatedBots) + ' · ' +
        fleetName(state, isolated.botId)
      : '', isolated && isolated.botId);
  }

  function renderAgents(state, snapshot) {
    renderFleet(state, snapshot);
    var allAgents = snapshot && Array.isArray(snapshot.agents) ? snapshot.agents.filter(function (agent) {
      return agent && agent.openbot && typeof agent.id === 'string';
    }) : [];
    var query = state.botSearch.value.trim().toLocaleLowerCase();
    var agents = allAgents.filter(function (agent) {
      var route = agent.openbot;
      return !query || [agent.name, route.harnessName, route.harnessId, route.model, route.label, route.status]
        .join(' ').toLocaleLowerCase().indexOf(query) >= 0;
    });
    state.searchResults = agents.map(function (agent) { return agent.id; });
    state.view.classList.toggle('has-no-bots', agents.length === 0);
    var visible = new Set(state.searchResults);
    var activeElement = document.activeElement;
    var focusedElement = state.view.contains(activeElement) && activeElement && activeElement.matches && activeElement.matches('[data-office-actor], [data-office-locate]') ? activeElement : null;
    var focusedId = focusedElement && (focusedElement.getAttribute('data-office-actor') || focusedElement.getAttribute('data-office-locate'));
    var previousOrder = focusedElement ? Array.from(state.view.querySelectorAll('[data-office-actor]')).map(function (button) {
      return button.getAttribute('data-office-actor');
    }) : [];
    state.rows.forEach(function (row, id) {
      if (visible.has(id)) return;
      row.li.remove();
      state.rows.delete(id);
    });
    var grouped = new Map();
    agents.forEach(function (agent) {
      var row = state.rows.get(agent.id) || buildRow(state, agent);
      row.agent = agent;
      var fleetEntry = state.fleetById ? state.fleetById.get(agent.id) || null : null;
      var fleetText = fleetRowMeta(state, fleetEntry);
      var fleetDetail = fleetRowDetail(state, fleetEntry);
      var healthEntry = state.healthById ? state.healthById.get(agent.id) || null : null;
      var healthText = healthRowMeta(state, healthEntry);
      var healthDetail = healthRowDetail(state, healthEntry);
      var name = String(agent.name || agent.id);
      var taskStatus = String(agent.openbot.label || agent.openbot.status || '');
      var healthStatus = routeLabel(agent, state.options);
      var light = routeLight(agent);
      var presentation = JSON.stringify([name, taskStatus, agent.openbot, state.options.locale, state.showRouteDetails,
        fleetText, fleetDetail, healthText, healthDetail]);
      if (row.presentation !== presentation) {
        row.presentation = presentation;
        setText(row.name, name);
        row.name.title = name;
        setText(row.status, taskStatus);
        row.status.title = taskStatus;
        var compactUnknown = !state.showRouteDetails && unobservedRoute(agent);
        setText(row.route, compactUnknown ? copy(state.options).notChecked : healthStatus);
        row.route.hidden = false;
        row.route.classList.toggle('is-unobserved', compactUnknown);
        row.locate.title = (english(state.options) ? 'Locate on map: ' : '在地图定位：') + name;
        row.locate.setAttribute('aria-label', row.locate.title);
        var presence = safePresence(agent);
        row.status.setAttribute('data-presence', presence);
        row.button.setAttribute('data-presence', presence);
        row.li.setAttribute('data-presence', presence);
        row.route.setAttribute('data-office-light', light);
        row.route.setAttribute('data-light-state', light);
        row.route.setAttribute('title', routeTitle(agent, state.options));
        row.button.setAttribute('data-office-light', light);
        row.button.setAttribute('data-light-state', light);
        setText(row.fleet, fleetText);
        row.fleet.hidden = !fleetText;
        row.fleet.title = fleetDetail;
        setText(row.health, healthText);
        row.health.hidden = !healthText;
        row.health.title = healthDetail;
        row.rank.hidden = !fleetEntry || !fleetEntry.rank;
        if (fleetEntry && fleetEntry.rank) {
          setText(row.rank, '#' + fleetEntry.rank);
          row.rank.className = 'ob-habblaud-rank' +
            (fleetEntry.rank === 1 ? ' is-first' : fleetEntry.rank === 2 ? ' is-second' : fleetEntry.rank === 3 ? ' is-third' : '');
          row.rank.setAttribute('aria-label', copy(state.options).fleetDetailRank + ' ' + fleetEntry.rank);
        }
        row.button.setAttribute('aria-label', name + (english(state.options) ? ', task: ' : '，任务：') + taskStatus +
          (english(state.options) ? ', route: ' : '，路由：') + healthStatus +
          (fleetText ? (english(state.options) ? ', fleet: ' : '，舰队：') + fleetText : '') +
          (healthText ? (english(state.options) ? ', health: ' : '，健康：') + healthDetail : '') +
          (english(state.options) ? ', open Bot' : '，打开 Bot'));
      }
      // The host creates a fresh callback on each update. Compare its output so
      // equivalent callbacks do not replace the avatar DOM, while changed
      // renderers and fallback initials still take effect.
      var signature = avatarSignature(agent);
      var initial = String(agent.name || agent.id).slice(0, 1);
      if (signature !== row.avatarSignature || row.avatarRenderer !== state.options.avatarMarkup || row.avatarInitial !== initial) {
        row.avatarSignature = signature;
        row.avatarRenderer = state.options.avatarMarkup;
        row.avatarInitial = initial;
        var markup = '';
        if (typeof state.options.avatarMarkup === 'function') {
          try { markup = state.options.avatarMarkup(agent) || ''; } catch (_) { markup = ''; }
        }
        markup = String(markup);
        if (markup) {
          if (row.avatarMode !== 'markup' || row.avatarMarkup !== markup) row.avatar.innerHTML = markup;
          row.avatarMode = 'markup'; row.avatarMarkup = markup;
        } else {
          if (row.avatarMode !== 'text' || row.avatar.textContent !== initial) row.avatar.textContent = initial;
          row.avatarMode = 'text'; row.avatarMarkup = '';
        }
      }
      if (state.plaza === 'models') {
        var key = modelKey(agent, state.options);
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(row);
      }
    });
    if (state.plaza === 'models') {
      var modelNames = Array.from(grouped.keys()).sort(function (a, b) { return a.localeCompare(b, english(state.options) ? 'en' : 'zh-CN'); });
      var activeGroups = new Set(modelNames);
      state.groups.forEach(function (group, key) {
        if (activeGroups.has(key)) return;
        group.element.remove();
        state.groups.delete(key);
      });
      var nextGroup = state.modelGroups.firstElementChild;
      modelNames.forEach(function (model) {
        var group = ensureModelGroup(state, model);
        group.heading.textContent = model;
        group.heading.title = model;
        group.agents = grouped.get(model);
        group.count.textContent = String(group.agents.length);
        group.count.setAttribute('aria-label', group.agents.length + (english(state.options) ? ' Bots' : ' 个 Bot'));
        group.list.setAttribute('aria-label', model + (english(state.options) ? ' assigned Bots' : ' 已绑定的 Bot'));
        if (group.element !== nextGroup) state.modelGroups.insertBefore(group.element, nextGroup);
        nextGroup = group.element.nextElementSibling;
        placeRows(state, group.agents, group.list);
      });
      state.list.replaceChildren();
    } else {
      placeRows(state, agents.map(function (agent) { return state.rows.get(agent.id); }), state.list);
      state.groups.forEach(function (group) { group.list.replaceChildren(); });
      state.modelGroups.replaceChildren();
      state.groups.clear();
    }
    state.empty.hidden = state.plaza !== 'harness' || agents.length > 0;
    var emptyText = query && allAgents.length ? (english(state.options) ? 'No matching Bots. Clear the search to show all Bots.' : '没有匹配的 Bot，清空搜索可显示全部。') : copy(state.options).empty;
    state.empty.textContent = agents.length ? '' : emptyText;
    state.modelEmpty.hidden = state.plaza !== 'models' || agents.length > 0;
    state.modelEmpty.textContent = agents.length ? '' : emptyText;
    if (focusedElement && focusedElement.isConnected && document.activeElement !== focusedElement && typeof focusedElement.focus === 'function') {
      try { focusedElement.focus({ preventScroll: true }); }
      catch (_) { focusedElement.focus(); }
    } else if (focusedElement && !focusedElement.isConnected) {
      // Keep keyboard navigation in the office if a live update removes its focused Bot.
      var index = previousOrder.indexOf(focusedId);
      var nearby = previousOrder.slice(index + 1).concat(previousOrder.slice(0, index).reverse());
      var nextId = nearby.find(function (id) { return visible.has(id); }) || (agents[0] && agents[0].id);
      var nextRow = state.rows.get(nextId);
      var nextFocus = nextRow ? (focusedElement.hasAttribute('data-office-locate') ? nextRow.locate : nextRow.button) : (query ? state.botSearch : state.plazaButtons[0]);
      nextFocus.focus({ preventScroll: true });
    }
    var waiting = agents.filter(function (agent) { return safePresence(agent) === 'waiting'; }).length;
    var summary = (english(state.options) ? 'Bots · ' : '已入驻 Bot · ') + agents.length + (query ? ' / ' + allAgents.length : '')
      + (waiting ? (english(state.options) ? ' · Awaiting confirmation: ' : ' · 待确认：') + waiting : '');
    if (query && agents.length === 1) summary += english(state.options) ? ' · Enter to locate' : ' · Enter 定位';
    if (state.listHeading.textContent !== summary) state.listHeading.textContent = summary;
    state.detailsButton.hidden = agents.length === 0;
    renderDetailsControl(state);
    updateRowSelection(state);
    updateLocation(state);
  }

  function locateFromList(state, id) {
    if (!state.agentIds.has(id) || !state.world) return;
    state.userNavigated = true;
    if (state.plaza !== 'harness') setPlaza(state, 'harness');
    setHallDirectory(state, false, false);
    resumeForInteraction(state);
    var snapshot = state.store && state.store.snapshot;
    var agent = snapshot && (snapshot.agents || []).find(function (a) { return a && a.id === id; });
    var roomId = indexedRoom(state, agent);
    state.suppressSelectionCallback = true;
    try {
      if (roomId && state.roomIds.has(roomId) && typeof state.world.focusRoom === 'function') {
        state.world.select({ type: 'agent', id: id }, { focus: false });
        state.world.focusRoom(roomId);
        state.cameraIntent = { type: 'room', id: roomId };
        state.roomSelection = roomId;
      } else {
        state.world.select({ type: 'agent', id: id }, { focus: true });
        state.cameraIntent = { type: 'agent', id: id };
        state.roomSelection = roomId || null;
      }
    } finally {
      state.suppressSelectionCallback = false;
    }
    state.worldSelection = id;
    updateRowSelection(state);
    updateHallSelection(state);
    updateLocation(state);
    var row = state.rows.get(id);
    if (row) row.locate.focus({ preventScroll: true });
  }

  function selectFromList(state, id) {
    if (!state.agentIds.has(id) || !state.world) return;
    resumeForInteraction(state);
    state.suppressSelectionCallback = true;
    try { state.world.select({ type: 'agent', id: id }, { focus: true }); }
    finally { state.suppressSelectionCallback = false; }
    state.worldSelection = id;
    updateRowSelection(state);
    var select = state.options.onSelectBot;
    if (typeof select === 'function') select(id);
  }

  function bindEvents(container, state) {
    state.onClick = function (event) {
      var locate = event.target && event.target.closest ? event.target.closest('[data-office-locate]') : null;
      if (locate && state.view.contains(locate)) {
        locateFromList(state, locate.getAttribute('data-office-locate'));
        return;
      }
      var details = event.target && event.target.closest ? event.target.closest('[data-office-details]') : null;
      if (details && state.view.contains(details)) {
        state.showRouteDetails = !state.showRouteDetails;
        renderAgents(state, state.store.snapshot);
        return;
      }
      var action = event.target && event.target.closest ? event.target.closest('[data-habblaud-action]') : null;
      if (action && state.view.contains(action)) {
        if (!state.world) return;
        state.userNavigated = true;
        resumeForInteraction(state);
        state.cameraIntent = null;
        if (action.dataset.habblaudAction === 'zoom-out') state.world.zoomBy(0.82);
        else if (action.dataset.habblaudAction === 'zoom-in') state.world.zoomBy(1.22);
        else if (action.dataset.habblaudAction === 'fit') {
          var snapshot = state.store.snapshot;
          var focusedAgent = snapshot && (snapshot.agents || []).find(function (agent) { return agent.id === state.worldSelection; });
          var focusId = state.roomSelection || roomForAgent(snapshot, focusedAgent) || selectedAgentRoom(snapshot) || (roomsOf(snapshot)[0] || {}).id;
          if (focusId) selectHall(state, focusId, { userInitiated: true });
          else state.world.overview();
        } else if (action.dataset.habblaudAction === 'overview') state.world.overview();
        return;
      }
      var plaza = event.target && event.target.closest ? event.target.closest('button[data-office-plaza]') : null;
      if (plaza && state.view.contains(plaza)) {
        state.userNavigated = true;
        setPlaza(state, plaza.getAttribute('data-office-plaza'));
        return;
      }
      var hallsButton = event.target && event.target.closest ? event.target.closest('button[data-office-halls]') : null;
      if (hallsButton && state.view.contains(hallsButton)) {
        state.userNavigated = true;
        if (state.plaza !== 'harness') setPlaza(state, 'harness');
        setHallDirectory(state, state.hallDirectory.hidden, false);
        return;
      }
      var hallsClose = event.target && event.target.closest ? event.target.closest('[data-office-halls-close]') : null;
      if (hallsClose && state.view.contains(hallsClose)) {
        setHallDirectory(state, false, true);
        return;
      }
      var hall = event.target && event.target.closest ? event.target.closest('button[data-office-hall]') : null;
      if (hall && state.view.contains(hall)) {
        var roomId = hall.getAttribute('data-office-hall');
        if (state.plaza !== 'harness') setPlaza(state, 'harness');
        if (selectHall(state, roomId, { userInitiated: true })) {
          setHallDirectory(state, false, false);
          try { state.canvas.focus({ preventScroll: true }); }
          catch (_) { state.canvas.focus(); }
        }
        return;
      }
      var games = event.target && event.target.closest ? event.target.closest('[data-office-games]') : null;
      if (games && state.view.contains(games)) {
        if (typeof state.options.onOpenGames === 'function') state.options.onOpenGames(games);
        return;
      }
      var fleetOpen = event.target && event.target.closest ? event.target.closest('[data-office-fleet-open]') : null;
      if (fleetOpen && state.view.contains(fleetOpen)) {
        if (typeof state.options.onOpenDashboard === 'function') state.options.onOpenDashboard(fleetOpen);
        return;
      }
      var healthOpen = event.target && event.target.closest ? event.target.closest('[data-office-health-open]') : null;
      if (healthOpen && state.view.contains(healthOpen)) {
        if (typeof state.options.onOpenHealth === 'function') state.options.onOpenHealth(healthOpen);
        return;
      }
      var fleetRetry = event.target && event.target.closest ? event.target.closest('[data-office-fleet-retry]') : null;
      if (fleetRetry && state.view.contains(fleetRetry)) {
        if (typeof state.options.onRefreshFleet === 'function') state.options.onRefreshFleet();
        return;
      }
      var fleetBot = event.target && event.target.closest ? event.target.closest('[data-office-fleet-bot]') : null;
      if (fleetBot && state.view.contains(fleetBot)) {
        var fleetBotId = fleetBot.getAttribute('data-office-fleet-bot');
        if (fleetBotId) locateFromList(state, fleetBotId);
        return;
      }
      var row = event.target && event.target.closest ? event.target.closest('[data-office-actor]') : null;
      if (row && state.view.contains(row)) selectFromList(state, row.getAttribute('data-office-actor'));
    };
    container.addEventListener('click', state.onClick);
    state.onBotSearch = function () { renderAgents(state, state.store.snapshot); };
    state.botSearch.addEventListener('input', state.onBotSearch);
    function cameraKey(event) {
      return !event.ctrlKey && !event.metaKey && !event.altKey && /^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|[wasdWASD+=_0-])$/.test(event.key);
    }
    function moveListFocus(event, buttons, search, current) {
      if (!buttons.length) return;
      event.preventDefault(); event.stopPropagation();
      var next = current;
      if (event.key === 'Home') next = buttons[0];
      else if (event.key === 'End') next = buttons[buttons.length - 1];
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        var origin = current.getBoundingClientRect(), right = event.key === 'ArrowRight', nearest = Infinity;
        buttons.forEach(function (button) {
          var rect = button.getBoundingClientRect(), dx = rect.left - origin.left;
          if ((right ? dx > 2 : dx < -2)) {
            var score = Math.abs(dx) * 1000 + Math.abs(rect.top - origin.top);
            if (score < nearest) { nearest = score; next = button; }
          }
        });
      }
      else {
        var box = current.getBoundingClientRect(), down = event.key === 'ArrowDown', distance = Infinity;
        buttons.forEach(function (button) {
          var other = button.getBoundingClientRect(), dy = other.top - box.top;
          if ((down ? dy > 2 : dy < -2)) {
            var score = Math.abs(dy) * 1000 + Math.abs(other.left - box.left);
            if (score < distance) { distance = score; next = button; }
          }
        });
        if (next === current && !down) next = search;
      }
      if (next) next.focus();
    }
    state.onOfficeKeyDown = function (event) {
      if (event.isComposing) return;
      var target = event.target;
      // The engine listens at window scope. Only the focused map owns camera keys.
      if (target !== state.canvas && cameraKey(event)) event.stopPropagation();
      var actor = target && target.closest && target.closest('[data-office-actor], [data-office-locate]');
      if (actor && !event.ctrlKey && !event.metaKey && !event.altKey && /^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Home|End)$/.test(event.key)) {
        var buttons = Array.from((state.plaza === 'models' ? state.modelGroups : state.list).querySelectorAll('[data-office-actor]'));
        moveListFocus(event, buttons, state.botSearch, actor.closest('li').querySelector('[data-office-actor]'));
        return;
      }
      if ((event.metaKey || event.ctrlKey) && !event.altKey && String(event.key).toLowerCase() === 'f') {
        event.preventDefault(); event.stopPropagation();
        var search = state.hallDirectory.hidden ? state.botSearch : state.hallSearch;
        search.focus(); search.select();
      } else if (event.target === state.botSearch) {
        if (event.key === 'Escape') {
          event.preventDefault(); event.stopPropagation();
          state.botSearch.value = ''; renderAgents(state, state.store.snapshot);
        } else if (event.key === 'ArrowDown' && state.searchResults.length) {
          event.preventDefault();
          var firstResult = (state.plaza === 'models' ? state.modelGroups : state.list).querySelector('[data-office-actor]');
          if (firstResult) firstResult.focus();
        } else if (event.key === 'Enter' && state.botSearch.value.trim() && state.searchResults.length === 1) {
          event.preventDefault(); locateFromList(state, state.searchResults[0]);
        }
      }
    };
    container.addEventListener('keydown', state.onOfficeKeyDown);
    state.onHallSearch = function () { state.userNavigated = true; renderHalls(state, state.store.snapshot); };
    state.hallSearch.addEventListener('input', state.onHallSearch);
    state.onHallKeyDown = function (event) {
      if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (state.hallDirectory.hidden) return;
      var buttons = Array.from(state.hallList.querySelectorAll('[data-office-hall]'));
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation();
        if (state.hallSearch.value) { state.hallSearch.value = ''; renderHalls(state, state.store.snapshot); state.hallSearch.focus(); }
        else setHallDirectory(state, false, true);
      } else if (event.target === state.hallSearch) {
        if (event.key === 'ArrowDown' && buttons.length) { event.preventDefault(); event.stopPropagation(); buttons[0].focus(); }
        else if (event.key === 'Enter' && state.hallSearch.value.trim() && buttons.length === 1) { event.preventDefault(); event.stopPropagation(); buttons[0].click(); }
      } else if (buttons.indexOf(event.target) >= 0 && /^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Home|End)$/.test(event.key)) {
        moveListFocus(event, buttons, state.hallSearch, event.target);
      }
    };
    state.hallDirectory.addEventListener('keydown', state.onHallKeyDown);
    state.onCanvasInteraction = function (event) {
      if (event && ((event.type === 'pointermove' && !event.buttons) || (event.type === 'keydown' && !cameraKey(event)))) return;
      if (event && (event.type === 'pointerdown' || event.type === 'wheel' || (event.type === 'keydown' && cameraKey(event)))) {
        state.userNavigated = true; state.cameraIntent = null;
      }
      resumeForInteraction(state);
    };
    state.onAvatarReady = function () { redrawAfterResize(state); };
    state.canvas.addEventListener('habblaud-avatar-ready', state.onAvatarReady);
    ['pointerdown', 'pointermove', 'wheel', 'keydown'].forEach(function (type) {
      state.canvas.addEventListener(type, state.onCanvasInteraction, { passive: type === 'wheel' });
    });
    state.onStageResize = function () {
      redrawAfterResize(state);
      var size = state.canvas.clientWidth + 'x' + state.canvas.clientHeight;
      if (size === state.lastStageSize) return;
      state.lastStageSize = size;
      if (state.resizeFrame) window.cancelAnimationFrame(state.resizeFrame);
      state.resizeFrame = null;
      var world = state.world, intent = state.cameraIntent;
      if (!world || !intent || state.plaza !== 'harness' || document.hidden) return;
      // Let the engine consume the new canvas size before fitting the selected object.
      state.resizeFrame = window.requestAnimationFrame(function () {
        state.resizeFrame = window.requestAnimationFrame(function () {
          state.resizeFrame = null;
          if (sessions.get(container) !== state || state.world !== world || state.cameraIntent !== intent || state.plaza !== 'harness') return;
          resumeForInteraction(state);
          if (intent.type === 'room' && state.roomIds.has(intent.id)) world.focusRoom(intent.id);
          else if (intent.type === 'agent' && state.agentIds.has(intent.id)) world.focusAgent(intent.id, { follow: false });
        });
      });
    };
    if (typeof window === 'object' && typeof window.ResizeObserver === 'function') {
      state.resizeObserver = new window.ResizeObserver(state.onStageResize);
      state.resizeObserver.observe(state.stage);
    }
    if (typeof window === 'object') {
      window.addEventListener('resize', state.onStageResize);
      state.windowResizeListenerAttached = true;
    }
    state.onVisibilityChange = function () {
      if (!document.hidden) redrawAfterResize(state);
    };
    document.addEventListener('visibilitychange', state.onVisibilityChange);
  }

  function mount(container, snapshot, options) {
    if (!container) return false;
    destroy(container);
    var state = makeShell(container, options || {});
    state.container = container;
    state.options = options || {};
    state.scopeKey = state.options.scopeKey || 'global';
    state.agentIds = agentIdSet(snapshot);
    state.roomIds = roomIdSet(snapshot);
    indexRooms(state, snapshot);
    state.plaza = 'harness';
    state.worldSelection = null;
    state.roomSelection = null;
    state.pendingHallFocus = null;
    state.activeAgentRoomId = selectedAgentRoom(snapshot);
    state.userNavigated = false;
    state.cameraIntent = null;
    state.resizeFrame = null;
    state.lastStageSize = '';
    state.searchResults = [];
    state.showRouteDetails = false;
    state.motionTimer = null;
    state.motionSuspended = false;
    state.lastInteractionAt = 0;
    state.resizeObserver = null;
    state.onStageResize = null;
    state.onVisibilityChange = null;
    state.windowResizeListenerAttached = false;
    state.suppressSelectionCallback = false;
    state.store = createStore();
    state.store.publish(snapshot);
    sessions.set(container, state);
    bindEvents(container, state);
    renderLabels(state);
    renderHalls(state, snapshot);
    renderAgents(state, snapshot);
    createWorld(state);
    return true;
  }

  function update(container, snapshot, options) {
    var state = sessions.get(container);
    if (!state) return mount(container, snapshot, options);
    var nextOptions = options || state.options;
    var previousPreference = !!state.options.reducedMotion;
    var nextIds = agentIdSet(snapshot);
    var nextRoomIds = roomIdSet(snapshot);
    var nextActiveRoom = selectedAgentRoom(snapshot);
    var previousActiveRoom = state.activeAgentRoomId;
    var hadRooms = state.roomIds.size > 0;
    var removedAgent = false;
    var removedRoom = false;
    state.agentIds.forEach(function (id) { if (!nextIds.has(id)) removedAgent = true; });
    state.roomIds.forEach(function (id) { if (!nextRoomIds.has(id)) removedRoom = true; });
    var recreate = removedAgent || removedRoom || !sameScope(state.scopeKey, nextOptions.scopeKey);
    if (!sameScope(state.scopeKey, nextOptions.scopeKey)) { state.botSearch.value = ''; state.hallSearch.value = ''; }
    state.options = nextOptions;
    state.scopeKey = nextOptions.scopeKey || 'global';
    state.agentIds = nextIds;
    state.roomIds = nextRoomIds;
    indexRooms(state, snapshot);
    state.activeAgentRoomId = nextActiveRoom;
    if (!nextRoomIds.has(state.roomSelection)) state.roomSelection = null;
    if (!nextRoomIds.has(state.pendingHallFocus)) state.pendingHallFocus = null;
    if (recreate) {
      state.worldSelection = null;
      state.roomSelection = null;
    }
    state.store.snapshot = snapshot || null;
    renderLabels(state);
    renderHalls(state, snapshot);
    renderAgents(state, snapshot);
    if (typeof window === 'object' && window.OpenBotHabblaudRuntime) {
      var runtime = window.OpenBotHabblaudRuntime;
      var locale = english(state.options) ? 'en' : 'zh-CN';
      if (typeof runtime.initializeLocale === 'function') runtime.initializeLocale(locale);
      else if (typeof runtime.setLocale === 'function') runtime.setLocale(locale);
    }
    if (recreate) {
      destroyWorld(state);
      createWorld(state);
    } else {
      state.store.publish(snapshot);
      if (state.world && typeof state.world.setOptions === 'function') {
        state.world.setOptions({ liveliness: state.options.reducedMotion ? 'calm' : 'normal' });
      }
      var hallToFocus = nextActiveRoom && nextActiveRoom !== previousActiveRoom ? nextActiveRoom : null;
      if (!hallToFocus && !hadRooms && nextRoomIds.size > 0 && !state.userNavigated && !state.roomSelection) {
        var firstHall = roomsOf(snapshot)[0];
        hallToFocus = firstHall ? firstHall.id : null;
      }
      if (hallToFocus) {
        if (state.hallDirectory.contains(document.activeElement)) state.pendingHallFocus = hallToFocus;
        else if (state.plaza === 'harness') selectHall(state, hallToFocus);
        else state.pendingHallFocus = hallToFocus;
      }
      syncMotion(state, previousPreference);
    }
    return true;
  }

  function destroy(container) {
    if (!container) return false;
    var state = sessions.get(container);
    if (!state) return false;
    container.removeEventListener('click', state.onClick);
    container.removeEventListener('keydown', state.onOfficeKeyDown);
    state.botSearch.removeEventListener('input', state.onBotSearch);
    if (state.resizeFrame) window.cancelAnimationFrame(state.resizeFrame);
    state.hallSearch.removeEventListener('input', state.onHallSearch);
    state.hallDirectory.removeEventListener('keydown', state.onHallKeyDown);
    ['pointerdown', 'pointermove', 'wheel', 'keydown'].forEach(function (type) {
      state.canvas.removeEventListener(type, state.onCanvasInteraction);
    });
    if (state.resizeObserver) state.resizeObserver.disconnect();
    if (state.windowResizeListenerAttached && typeof window === 'object') window.removeEventListener('resize', state.onStageResize);
    state.canvas.removeEventListener('habblaud-avatar-ready', state.onAvatarReady);
    document.removeEventListener('visibilitychange', state.onVisibilityChange);
    destroyWorld(state);
    state.rows.clear();
    state.hallRows.clear();
    sessions.delete(container);
    container.innerHTML = '';
    return true;
  }

  return { mount: mount, update: update, destroy: destroy };
});
