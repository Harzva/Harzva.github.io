(function (root) {
  'use strict';

  var state = null;
  var stateError = '';
  var dialog = null;
  var body = null;
  var headerStatus = null;
  var skinSelect = null;
  var skinPreference = 'native';
  var skinStorageKey = 'openbot.gameSpace.skin.v1';
  var closeButton = null;
  var opener = null;
  var isOpen = false;
  var unsubscribe = null;
  var passiveSubscription = false;
  var refreshId = 0;
  var replayId = 0;
  var selectedSpaceId = '';
  var selectedHallId = '';
  var spaceFormOpen = false;
  var hallFormOpen = false;
  var replayOpen = false;
  var replayRoundId = '';
  var replayTurn = 0;
  var replayData = null;
  var activeView = 'leaderboard';
  var activeChatChannel = 'table';
  var chatPanelState = 'auto';
  var chatOpenedAt = 0;
  var chatComposingKey = '';
  var chatFocusMessageId = '';
  var chatFocusComposerKey = '';
  var speechRefreshTimer = null;
  var speechAnimatedIds = new Set();
  var chatReadMessageIds = Object.create(null);
  var chatScrollState = Object.create(null);
  var chatFollowLatest = Object.create(null);
  var chatDrafts = Object.create(null);
  var chatPending = Object.create(null);
  var chatErrors = Object.create(null);
  var chatRetries = Object.create(null);
  var viewBotByHall = Object.create(null);
  var pendingModelHallId = '';
  var busyAction = '';
  var pauseAction = false;
  var actionError = '';
  var composingSearchKey = '';
  var modelApprovedHalls = new Set();
  // Search and filter state stays local to the view. It never changes game
  // membership, table state, or the benchmark aggregates returned by the host.
  var viewFilters = {
    spaceQuery: '',
    hallQuery: '',
    hallGame: 'all',
    hallStatus: 'all',
    spaceBotQuery: '',
    hallBotQuery: ''
  };

  var recordingSetupHallId = '';
  var recordingOwnerByHall = Object.create(null);
  var recordingDurationByHall = Object.create(null);
  var recordingStatus = null;
  var recordingStatusLoaded = false;
  var recordingStatusError = '';
  var recordingActive = null;
  var recordingRecent = null;
  var recordingRecords = [];
  var recordingBots = [];
  var recordingBusy = '';
  var recordingError = '';
  var recordingPluginStatus = null;
  var recordingPluginBusy = false;
  var recordingPluginError = '';
  var recordingPollTimer = 0;
  var recordingPollBusy = false;
  var recordingRequestId = 0;
  var recordingSubscription = null;
  var recordingUiReady = false;
  var recordingPreviewDialog = null;
  var recordingPreviewTitle = null;
  var recordingPreviewVideo = null;
  var recordingPreviewMessage = null;
  var recordingPreviewRetry = null;
  var recordingPreviewAttach = null;
  var recordingPreviewCurrent = null;
  var recordingPreviewEpoch = 0;
  var recordingAttachedIds = Object.create(null);
  var renderBotsOverride = null;
  var spectatorLanguage = '';
  var drafts = {
    spaceName: '',
    spaceMemberBotIds: [],
    hallName: '',
    hallBotIds: [],
    gameId: 'doudizhu',
    controller: 'rules',
    communication: 'table-talk'
  };

  function tr(zh, en, params) {
    if (spectatorLanguage) {
      var selected = spectatorLanguage === 'en' && typeof en === 'string' ? en : zh;
      if (params) selected = String(selected).replace(/\{([a-zA-Z0-9_]+)\}/g, function (match, key) {
        return Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match;
      });
      return selected;
    }
    return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function'
      ? root.OpenBotI18n.t(zh, en, params)
      : zh;
  }

  function value(input, fallback) {
    return input === undefined || input === null ? (fallback === undefined ? '' : String(fallback)) : String(input);
  }

  function node(tag, className, content) {
    var item = root.document.createElement(tag);
    if (className) item.className = className;
    if (content !== undefined && content !== null) item.textContent = value(content);
    return item;
  }

  function append(parent, child) {
    if (child) parent.appendChild(child);
    return child;
  }

  function setFocusKey(item, key) {
    if (item && key) item.dataset.gsFocusKey = key;
    return item;
  }

  function button(label, action, className, disabled) {
    var item = node('button', className || 'obgs-button', label);
    item.type = 'button';
    if (action) item.dataset.gsAction = action;
    item.disabled = Boolean(disabled);
    return item;
  }

  function botId(bot) { return bot && bot.id !== undefined && bot.id !== null ? String(bot.id) : ''; }
  function botName(bot) { return value(bot && bot.name, botId(bot) || tr('未知 BOT', 'Unknown BOT')); }
  function safeColor(color) { return /^#[0-9a-f]{6}$/i.test(String(color || '')) ? String(color) : ''; }

  function normalizeChat(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var lobbies = raw.lobbies && typeof raw.lobbies === 'object' ? raw.lobbies : {};
    var tables = raw.tables && typeof raw.tables === 'object' ? raw.tables : {};
    return {
      schema: raw.schema === 'openbot.game-chat/1' ? raw.schema : 'openbot.game-chat/1',
      revision: Number.isSafeInteger(raw.revision) ? raw.revision : 0,
      self: raw.self && typeof raw.self === 'object' ? raw.self : { id: 'local-human', name: '我', kind: 'human' },
      limits: raw.limits && typeof raw.limits === 'object' ? raw.limits : { humanText: 280, botText: 80, retainedPerChannel: 200 },
      lobbies: lobbies,
      tables: tables
    };
  }

  function chatMessages(channel, scopeId) {
    var chat = state && state.chat;
    if (!chat || !scopeId) return [];
    var source = channel === 'table' ? chat.tables : chat.lobbies;
    var list = source && Array.isArray(source[String(scopeId)]) ? source[String(scopeId)] : [];
    return list.filter(function (message) {
      return message && message.channel === channel && message.id !== undefined && message.sender
        && typeof message.sender.id === 'string' && typeof message.text === 'string';
    });
  }

  function chatScopeKey(channel, spaceId, hallId) {
    return channel === 'table' ? 'table:' + String(hallId || '') : 'lobby:' + String(spaceId || '');
  }

  function chatScopeMessages(channel, spaceId, hallId) {
    return chatMessages(channel, channel === 'table' ? hallId : spaceId);
  }

  function chatScopeIsRendered(channel, scopeKey, spaceId, hallId) {
    if (!isOpen || activeView !== 'hall' || !isChatPanelVisible()) return false;
    var currentSpace = selectedSpace();
    if (!currentSpace || String(currentSpace.id) !== String(spaceId)) return false;
    var currentHall = selectedHall();
    var renderedChannel = currentHall ? activeChatChannel : 'lobby';
    var renderedScopeKey = chatScopeKey(renderedChannel, String(currentSpace.id), currentHall ? String(currentHall.id) : '');
    if (renderedChannel !== channel || renderedScopeKey !== scopeKey) return false;
    return channel !== 'table' || (currentHall && String(currentHall.id) === String(hallId));
  }

  function unreadCount(channel, spaceId, hallId) {
    var key = chatScopeKey(channel, spaceId, hallId);
    var seen = chatReadMessageIds[key] || Object.create(null);
    return chatScopeMessages(channel, spaceId, hallId).filter(function (message) {
      return message.sender.kind !== 'human' && !seen[String(message.id)];
    }).length;
  }

  function markChatRead(channel, spaceId, hallId, messages) {
    var key = chatScopeKey(channel, spaceId, hallId);
    var seen = chatReadMessageIds[key] || (chatReadMessageIds[key] = Object.create(null));
    (messages || chatScopeMessages(channel, spaceId, hallId)).forEach(function (message) {
      if (message && message.id !== undefined) seen[String(message.id)] = true;
    });
  }

  function seedChatReadState() {
    if (!state || !state.chat) return;
    Object.keys(state.chat.lobbies || {}).forEach(function (spaceId) { markChatRead('lobby', spaceId, '', state.chat.lobbies[spaceId]); });
    Object.keys(state.chat.tables || {}).forEach(function (hallId) { markChatRead('table', '', hallId, state.chat.tables[hallId]); });
  }

  function isNarrowChatLayout() {
    try { return Boolean(root.matchMedia && root.matchMedia('(max-width: 1380px)').matches); }
    catch (_) { return false; }
  }

  function isChatPanelVisible() {
    return chatPanelState === 'open' || (chatPanelState === 'auto' && !isNarrowChatLayout());
  }

  function chatTextLength(text) { return Array.from(String(text || '')).length; }

  function readSkinPreference() {
    try {
      var stored = root.localStorage && root.localStorage.getItem(skinStorageKey);
      return stored === 'classic-qq' ? 'classic-qq' : 'native';
    } catch (_) { return 'native'; }
  }

  function applySkinPreference(nextSkin, persist) {
    skinPreference = nextSkin === 'classic-qq' ? 'classic-qq' : 'native';
    if (dialog) dialog.dataset.skin = skinPreference;
    if (skinSelect && skinSelect.value !== skinPreference) skinSelect.value = skinPreference;
    if (persist) {
      try {
        if (root.localStorage) root.localStorage.setItem(skinStorageKey, skinPreference);
      } catch (_) { }
    }
  }

  function botById(id) {
    var bots = Array.isArray(renderBotsOverride) ? renderBotsOverride : (state && Array.isArray(state.bots) ? state.bots : []);
    for (var i = 0; i < bots.length; i++) if (botId(bots[i]) === String(id)) return bots[i];
    return null;
  }

  function botLabel(id) {
    var bot = botById(id);
    return bot ? botName(bot) : value(id, tr('未知 BOT', 'Unknown BOT'));
  }

  // The host publishes its registered games with every state payload; the UI
  // never decides by itself that 3 seats means one particular game.
  function games() { return state && Array.isArray(state.games) ? state.games : []; }
  function gameMeta(gameId) {
    var list = games();
    for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(gameId)) return list[i];
    return null;
  }
  function gameSeatsText(meta) {
    if (!meta) return '';
    var min = Number(meta.minSeats), max = Number(meta.maxSeats);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return '';
    return min === max ? tr('{count} 个 BOT', '{count} BOTs', { count: min }) : tr('{min}–{max} 个 BOT', '{min}–{max} BOTs', { min: min, max: max });
  }
  function canSeat(meta, count) {
    return Boolean(meta) && count >= Number(meta.minSeats) && count <= Number(meta.maxSeats);
  }
  function needsPerspective(hall) {
    var meta = hall ? gameMeta(hall.game) : null;
    return Boolean(meta && meta.playerPerspective);
  }

  function avatar(host, bot, size) {
    if (!host || !bot) return;
    if (root.OpenBotAvatars && typeof root.OpenBotAvatars.markup === 'function') {
      // The existing helper normalizes avatar IDs and validates colors before it emits its local SVG markup.
      var template = root.document.createElement('template');
      template.innerHTML = root.OpenBotAvatars.markup(bot.avatar, safeColor(bot.color), { size: size || 'mini', pose: 'idle' });
      if (template.content.firstElementChild) host.appendChild(template.content.firstElementChild);
      return;
    }
    var fallback = node('span', 'obgs-avatar-fallback', botName(bot).slice(0, 1));
    if (safeColor(bot.color)) fallback.style.setProperty('--obgs-bot-color', safeColor(bot.color));
    host.appendChild(fallback);
  }

  function focusRecord() {
    if (!dialog || !dialog.contains(root.document.activeElement)) return null;
    var active = root.document.activeElement;
    var key = active.dataset && active.dataset.gsFocusKey ? active.dataset.gsFocusKey : '';
    if (!key) return null;
    return {
      key: key,
      start: typeof active.selectionStart === 'number' ? active.selectionStart : null,
      end: typeof active.selectionEnd === 'number' ? active.selectionEnd : null,
      direction: typeof active.selectionDirection === 'string' ? active.selectionDirection : 'none'
    };
  }

  function restoreFocus(record) {
    if (!record || !dialog) return;
    root.setTimeout(function () {
      // A second render can replace the node before this focus task runs
      // (compositionend followed by the browser's final input event). Resolve
      // by stable key at execution time so queued focus never targets a stale
      // element from an earlier render.
      var candidates = dialog.querySelectorAll('[data-gs-focus-key]');
      var target = null;
      for (var i = 0; i < candidates.length; i++) {
        if (candidates[i].dataset.gsFocusKey === record.key) { target = candidates[i]; break; }
      }
      if (!target || target.disabled) return;
      try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
      if (record.start !== null && typeof target.setSelectionRange === 'function') {
        try { target.setSelectionRange(record.start, record.end, record.direction); } catch (_) { }
      }
    }, 0);
  }

  function createSkinPicker() {
    var picker = node('label', 'obgs-skin-picker');
    append(picker, node('span', 'obgs-skin-label', tr('皮肤', 'Skin')));
    skinSelect = node('select', 'obgs-skin-select');
    skinSelect.id = 'obgs-skin-select';
    skinSelect.dataset.gsSkinSelect = 'true';
    skinSelect.setAttribute('aria-label', tr('游戏大厅皮肤', 'Game hall skin'));
    setFocusKey(skinSelect, 'skin-select');
    var nativeOption = node('option', '', tr('原生', 'Native'));
    nativeOption.value = 'native';
    var classicOption = node('option', '', tr('经典大厅', 'Classic hall'));
    classicOption.value = 'classic-qq';
    skinSelect.appendChild(nativeOption);
    skinSelect.appendChild(classicOption);
    skinSelect.value = skinPreference;
    picker.appendChild(skinSelect);
    return picker;
  }

  function ensureDialog() {
    if (dialog && dialog.isConnected) return;
    skinPreference = readSkinPreference();
    dialog = node('dialog', 'obgs-dialog');
    dialog.id = 'openbot-game-space-dialog';
    dialog.dataset.skin = skinPreference;
    dialog.setAttribute('aria-labelledby', 'obgs-title');
    dialog.tabIndex = -1;

    var window = node('div', 'obgs-window');
    var header = node('header', 'obgs-header');
    var heading = node('div', 'obgs-heading');
    var title = node('h1', 'obgs-title', tr('游戏空间', 'Game spaces'));
    title.id = 'obgs-title';
    var subtitle = node('p', 'obgs-subtitle', tr('查看排行榜并管理独立牌局。', 'Review rankings and manage independent tables.'));
    append(heading, title);
    append(heading, subtitle);
    headerStatus = node('div', 'obgs-header-status');
    headerStatus.setAttribute('role', 'status');
    headerStatus.setAttribute('aria-live', 'polite');
    closeButton = button(tr('关闭', 'Close'), 'close', 'obgs-close');
    closeButton.id = 'obgs-close';
    setFocusKey(closeButton, 'close');
    header.appendChild(heading);
    header.appendChild(headerStatus);
    header.appendChild(createSkinPicker());
    header.appendChild(closeButton);
    body = node('div', 'obgs-body');
    window.appendChild(header);
    window.appendChild(body);
    dialog.appendChild(window);

    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      close();
    });
    dialog.addEventListener('close', onClosed);
    dialog.addEventListener('keydown', trapTab);
    dialog.addEventListener('scroll', onChatScroll, true);
    dialog.addEventListener('click', onClick);
    dialog.addEventListener('input', onInput);
    dialog.addEventListener('compositionstart', onCompositionStart);
    dialog.addEventListener('compositionend', onCompositionEnd);
    dialog.addEventListener('change', onChange);
    dialog.addEventListener('submit', onSubmit);
    root.document.body.appendChild(dialog);
    ensureRoomRecordingUi();
  }

  function trapTab(event) {
    if (!dialog) return;
    var composer = event.target && event.target.closest ? event.target.closest('[data-gs-chat-composer]') : null;
    if (composer && event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      var form = composer.closest('form');
      if (form && typeof form.requestSubmit === 'function') form.requestSubmit();
      return;
    }
    var chatTab = event.target && event.target.closest ? event.target.closest('[data-gs-chat-channel]') : null;
    if (chatTab && dialog.contains(chatTab) && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) >= 0) {
      var chatTabs = Array.prototype.filter.call(dialog.querySelectorAll('[data-gs-chat-channel]'), function (item) { return !item.disabled; });
      var chatIndex = chatTabs.indexOf(chatTab);
      var nextChatIndex = event.key === 'Home' ? 0 : event.key === 'End' ? chatTabs.length - 1
        : (chatIndex + (event.key === 'ArrowRight' ? 1 : chatTabs.length - 1)) % chatTabs.length;
      if (chatTabs[nextChatIndex]) { event.preventDefault(); chatTabs[nextChatIndex].click(); }
      return;
    }
    var viewTab = event.target && event.target.closest ? event.target.closest('[data-gs-view]') : null;
    if (viewTab && dialog.contains(viewTab) && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) >= 0) {
      var tabs = Array.prototype.slice.call(dialog.querySelectorAll('[data-gs-view]'));
      var index = tabs.indexOf(viewTab);
      var nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      if (tabs[nextIndex]) { event.preventDefault(); tabs[nextIndex].click(); }
      return;
    }
    if (event.key !== 'Tab') return;
    var items = dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
    var focusable = Array.prototype.filter.call(items, function (item) { return item.offsetParent !== null && item.tabIndex !== -1; });
    if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && root.document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && root.document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function onClosed() {
    isOpen = false;
    composingSearchKey = '';
    chatComposingKey = '';
    if (root.OpenBotGameBenchmark && typeof root.OpenBotGameBenchmark.cancelComposition === 'function') root.OpenBotGameBenchmark.cancelComposition();
    replayId += 1;
    if (speechRefreshTimer) root.clearTimeout(speechRefreshTimer);
    speechRefreshTimer = null;
    pendingModelHallId = '';
    if (typeof unsubscribe === 'function') {
      try { unsubscribe(); } catch (_) { }
    }
    if (unsubscribe) passiveSubscription = false;
    unsubscribe = null;
    var target = opener;
    opener = null;
    if (target && target.isConnected && typeof target.focus === 'function') {
      root.setTimeout(function () { try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); } }, 0);
    }
  }

  function close() {
    if (!dialog) return;
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
    else {
      dialog.removeAttribute('open');
      onClosed();
    }
  }

  function showStatus(message, tone) {
    if (!headerStatus) return;
    headerStatus.textContent = value(message);
    headerStatus.dataset.tone = tone || '';
  }

  function normalizeState(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    return {
      revision: Number.isSafeInteger(raw.revision) ? raw.revision : 0,
      bots: Array.isArray(raw.bots) ? raw.bots.filter(function (bot) { return bot && bot.id !== undefined; }) : [],
      spaces: Array.isArray(raw.spaces) ? raw.spaces.filter(function (space) { return space && space.id !== undefined; }) : [],
      games: Array.isArray(raw.games) ? raw.games.filter(function (game) { return game && game.id !== undefined; }) : [],
      halls: Array.isArray(raw.halls) ? raw.halls.filter(function (hall) { return hall && hall.id !== undefined; }) : [],
      chat: normalizeChat(raw.chat)
    };
  }

  function statePayload(raw) {
    if (raw && raw.ok === false) {
      throw new Error(raw.message || tr('读取游戏空间失败。', 'Could not load game spaces.'));
    }
    if (raw && raw.state && typeof raw.state === 'object') raw = raw.state;
    if (!raw || !Number.isSafeInteger(raw.revision)
      || !Array.isArray(raw.bots) || !Array.isArray(raw.spaces) || !Array.isArray(raw.halls)) {
      throw new Error(tr('游戏空间状态格式无效。', 'Game-space state is invalid.'));
    }
    return raw;
  }

  function spaces() { return state && Array.isArray(state.spaces) ? state.spaces : []; }
  function halls() { return state && Array.isArray(state.halls) ? state.halls : []; }
  function hallsFor(spaceId) { return halls().filter(function (hall) { return String(hall.spaceId) === String(spaceId); }); }
  function selectedSpace() {
    var list = spaces();
    for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(selectedSpaceId)) return list[i];
    return null;
  }
  function selectedHall() {
    var list = hallsFor(selectedSpaceId);
    for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(selectedHallId)) return list[i];
    return null;
  }
  function ensureViewerBot(hall) {
    if (!hall) return '';
    var id = String(hall.id);
    var ids = Array.isArray(hall.botIds) ? hall.botIds.map(String) : [];
    if (!ids.length && hall.table && Array.isArray(hall.table.players)) {
      ids = hall.table.players.map(function (player) { return String(player.botId); });
    }
    var selected = String(viewBotByHall[id] || '');
    if (selected && ids.indexOf(selected) >= 0) return selected;
    selected = ids.length ? ids[0] : '';
    if (selected) viewBotByHall[id] = selected;
    return selected;
  }
  function stateViewOptions(hallOverride) {
    var hall = hallOverride || selectedHall();
    if (!hall || !needsPerspective(hall)) return null;
    var viewerId = ensureViewerBot(hall);
    if (!viewerId) return null;
    var viewBotIds = {};
    viewBotIds[String(hall.id)] = viewerId;
    return { perspective: 'player', viewBotIds: viewBotIds };
  }
  function memberBots(space) {
    var ids = space && Array.isArray(space.memberBotIds) ? space.memberBotIds.map(String) : [];
    return (state && state.bots ? state.bots : []).filter(function (bot) { return ids.indexOf(botId(bot)) >= 0; });
  }

  function searchText(input) {
    return String(input || '').normalize('NFKC').trim().toLocaleLowerCase();
  }
  function matchesSearch(haystack, query) {
    var needle = searchText(query);
    return !needle || searchText(haystack).indexOf(needle) >= 0;
  }
  function searchField(id, key, placeholder, ariaLabel, currentValue) {
    var field = node('input', 'obgs-search');
    field.type = 'search';
    field.id = id;
    field.value = currentValue || '';
    field.placeholder = placeholder;
    field.setAttribute('aria-label', ariaLabel);
    field.autocomplete = 'off';
    field.dataset.gsSearch = key;
    setFocusKey(field, key);
    return field;
  }
  function filterSelect(id, key, ariaLabel, values, currentValue) {
    var select = node('select', 'obgs-filter-select');
    select.id = id;
    select.setAttribute('aria-label', ariaLabel);
    select.dataset.gsViewFilter = key;
    setFocusKey(select, key);
    values.forEach(function (entry) {
      var option = node('option', '', entry[1]);
      option.value = entry[0];
      select.appendChild(option);
    });
    select.value = currentValue;
    return select;
  }

  function acceptState(raw) {
    var next = normalizeState(raw);
    if (state && next.revision < state.revision) return false;
    var changedRevision = state && next.revision !== state.revision;
    state = next;
    if (activeView !== 'hall' || !isOpen) seedChatReadState();
    if (changedRevision && root.OpenBotGameBenchmark && typeof root.OpenBotGameBenchmark.invalidate === 'function') root.OpenBotGameBenchmark.invalidate();
    stateError = '';
    var space = selectedSpace();
    if (!space) selectedSpaceId = spaces().length ? String(spaces()[0].id) : '';
    var availableHalls = hallsFor(selectedSpaceId);
    var hall = selectedHall();
    if (!hall) selectedHallId = availableHalls.length ? String(availableHalls[0].id) : '';
    var activeHall = selectedHall();
    if (activeHall) ensureViewerBot(activeHall);
    if (pendingModelHallId && !halls().some(function (item) { return String(item.id) === pendingModelHallId; })) pendingModelHallId = '';
    return true;
  }

  async function refresh() {
    var bridge = root.grokbot;
    if (!bridge || typeof bridge.gameSpaceState !== 'function') {
      stateError = tr('游戏空间接口尚未连接。', 'Game-space API is unavailable.');
      if (isOpen) render();
      return null;
    }
    var requestId = ++refreshId;
    showStatus(tr('正在读取…', 'Loading…'));
    try {
      var viewOptions = stateViewOptions();
      var result = await bridge.gameSpaceState(viewOptions || undefined);
      if (!isOpen || requestId !== refreshId) return null;
      acceptState(statePayload(result));
      var hall = selectedHall();
      if (hall && needsPerspective(hall) && !viewOptions && stateViewOptions(hall)) {
        result = await bridge.gameSpaceState(stateViewOptions(hall));
        if (!isOpen || requestId !== refreshId) return null;
        acceptState(statePayload(result));
      }
      showStatus('');
      render();
      return state;
    } catch (error) {
      if (!isOpen || requestId !== refreshId) return null;
      stateError = value(error && error.message, tr('读取游戏空间失败。', 'Could not load game spaces.'));
      showStatus(tr('读取失败', 'Could not load'), 'error');
      render();
      return null;
    }
  }

  function subscribe() {
    var bridge = root.grokbot;
    if (passiveSubscription || !bridge || typeof bridge.onGameSpaceChanged !== 'function') return;
    var callback = function (next) {
      if (!isOpen) return;
      if (next && typeof next === 'object' && Number.isSafeInteger(next.revision)
        && Array.isArray(next.bots) && Array.isArray(next.spaces) && Array.isArray(next.halls)) {
        if (needsPerspective(selectedHall())) refresh();
        else { acceptState(next); render(); }
      } else refresh();
    };
    try {
      var result = bridge.onGameSpaceChanged(callback);
      if (typeof result === 'function') unsubscribe = result;
      else if (result && typeof result.unsubscribe === 'function') unsubscribe = function () { result.unsubscribe(); };
      else if (typeof bridge.offGameSpaceChanged === 'function') unsubscribe = function () { bridge.offGameSpaceChanged(callback); };
      else passiveSubscription = true;
    } catch (_) { unsubscribe = null; }
  }

  function buttonBusy() { return Boolean(busyAction); }

  function captureChatScrollState() {
    if (!dialog) return;
    var log = dialog.querySelector('.obgs-chat-log');
    if (!log) return;
    var key = log.dataset.gsChatScopeKey;
    if (chatFollowLatest[key]) {
      chatScrollState[key] = { top: 0, stickToBottom: true };
      return;
    }
    var gap = log.scrollHeight - log.scrollTop - log.clientHeight;
    chatScrollState[key] = { top: log.scrollTop, stickToBottom: gap <= 34 };
  }

  function restoreChatScrollState() {
    if (!dialog) return;
    var log = dialog.querySelector('.obgs-chat-log');
    if (!log || !isChatPanelVisible()) return;
    var key = log.dataset.gsChatScopeKey;
    var saved = chatScrollState[key];
    if (saved && !saved.stickToBottom) log.scrollTop = saved.top;
    else log.scrollTop = log.scrollHeight;
    var gap = log.scrollHeight - log.scrollTop - log.clientHeight;
    chatScrollState[key] = { top: log.scrollTop, stickToBottom: gap <= 34 };
    delete chatFollowLatest[key];
    if (chatScrollState[key].stickToBottom) {
      markChatRead(log.dataset.gsChatChannel, log.dataset.gsChatSpaceId, log.dataset.gsChatHallId, chatMessages(log.dataset.gsChatChannel, log.dataset.gsChatChannel === 'table' ? log.dataset.gsChatHallId : log.dataset.gsChatSpaceId));
      var latestButton = dialog.querySelector('.obgs-chat-latest');
      if (latestButton) latestButton.remove();
    }
  }

  function onChatScroll(event) {
    var log = event.target;
    if (!log || !log.classList || !log.classList.contains('obgs-chat-log')) return;
    var gap = log.scrollHeight - log.scrollTop - log.clientHeight;
    var atBottom = gap <= 34;
    chatScrollState[log.dataset.gsChatScopeKey] = { top: log.scrollTop, stickToBottom: atBottom };
    if (atBottom && isChatPanelVisible() && log.dataset.gsChatChannel === activeChatChannel) {
      var messages = chatMessages(log.dataset.gsChatChannel, log.dataset.gsChatChannel === 'table' ? log.dataset.gsChatHallId : log.dataset.gsChatSpaceId);
      markChatRead(log.dataset.gsChatChannel, log.dataset.gsChatSpaceId, log.dataset.gsChatHallId, messages);
      var latestButton = dialog.querySelector('.obgs-chat-latest');
      if (latestButton) latestButton.remove();
    }
    updateChatUnreadBadges();
  }

  function updateChatUnreadBadges() {
    if (!dialog) return;
    var space = selectedSpace();
    var hall = selectedHall();
    var spaceId = space ? String(space.id) : '';
    var hallId = hall ? String(hall.id) : '';
    var tableUnread = hall ? unreadCount('table', spaceId, hallId) : 0;
    var lobbyUnread = space ? unreadCount('lobby', spaceId, '') : 0;
    var tabs = dialog.querySelectorAll('[data-gs-chat-channel]');
    Array.prototype.forEach.call(tabs, function (tab) {
      var count = tab.dataset.gsChatChannel === 'table' ? tableUnread : lobbyUnread;
      var badge = tab.querySelector('.obgs-chat-unread');
      if (!badge) return;
      badge.textContent = count ? String(count) : '';
      badge.hidden = !count;
      tab.setAttribute('aria-label', (tab.dataset.gsChatChannel === 'table' ? tr('牌桌', 'Table') : tr('大厅', 'Lobby')) + (count ? tr('，{count} 条未读', ', {count} unread', { count: count }) : ''));
    });
    var toggleBadge = dialog.querySelector('.obgs-chat-toggle-count');
    if (toggleBadge) {
      var total = tableUnread + lobbyUnread;
      toggleBadge.textContent = total ? String(total) : '';
      toggleBadge.hidden = !total;
    }
  }

  function restorePendingChatFocus() {
    if (!dialog) return;
    if (chatFocusComposerKey) {
      var composerKey = chatFocusComposerKey;
      chatFocusComposerKey = '';
      root.setTimeout(function () {
        var controls = dialog && dialog.querySelectorAll('[data-gs-focus-key]');
        if (!controls) return;
        for (var i = 0; i < controls.length; i++) {
          if (controls[i].dataset.gsFocusKey === composerKey && !controls[i].disabled) {
            controls[i].focus();
            try { controls[i].setSelectionRange(controls[i].value.length, controls[i].value.length); } catch (_) { }
            return;
          }
        }
      }, 0);
    }
    if (chatFocusMessageId) {
      var messageId = chatFocusMessageId;
      chatFocusMessageId = '';
      root.setTimeout(function () {
        var messages = dialog && dialog.querySelectorAll('.obgs-chat-message[data-gs-chat-message-id]');
        if (!messages) return;
        for (var i = 0; i < messages.length; i++) {
          if (messages[i].dataset.gsChatMessageId !== messageId) continue;
          var target = messages[i];
          try { target.scrollIntoView({ block: 'nearest' }); } catch (_) { }
          target.classList.add('is-focused');
          try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
          root.setTimeout(function () { target.classList.remove('is-focused'); }, 1800);
          return;
        }
      }, 0);
    }
  }

  function render() {
    if (!body) return;
    // State refreshes can arrive while an IME candidate is open. Keep the
    // focused input node alive until compositionend so the candidate window,
    // caret, and uncommitted text remain attached to the same control.
    if (composingSearchKey || chatComposingKey) return;
    captureChatScrollState();
    if (dialog) dialog.dataset.view = activeView;
    var focus = focusRecord();
    var currentHall = selectedHall();
    var layout = node('div', 'obgs-layout' + (activeView === 'leaderboard' ? ' is-benchmark' : '')
      + (activeView !== 'leaderboard' && currentHall && currentHall.game === 'doudizhu' ? ' is-doudizhu' : '')
      + (activeView !== 'leaderboard' && currentHall && currentHall.game === 'sealed-bid' ? ' is-sealed-bid' : '')
      + (activeView !== 'leaderboard' && currentHall && currentHall.game === 'rails' ? ' is-rails' : '')
      + (activeView !== 'leaderboard' && currentHall && currentHall.game === 'tycoon' ? ' is-tycoon' : '')
      + (activeView !== 'leaderboard' && currentHall && currentHall.game === 'caravan' ? ' is-caravan' : '')
      + (activeView !== 'leaderboard' && currentHall && currentHall.game === 'lantern-watch' ? ' is-lantern-watch' : ''));
    var main = node('main', 'obgs-main');
    if (activeView !== 'leaderboard') {
      var rail = node('aside', 'obgs-space-rail');
      rail.setAttribute('aria-label', tr('游戏空间列表', 'Game-space list'));
      renderSpaceRail(rail);
      layout.appendChild(rail);
    }
    renderMain(main);
    layout.appendChild(main);
    body.replaceChildren(layout);
    restoreFocus(focus);
    restoreChatScrollState();
    restorePendingChatFocus();
    updateChatUnreadBadges();
  }

  function renderSpaceRail(host) {
    var head = node('div', 'obgs-rail-head');
    append(head, node('h2', '', tr('空间', 'Spaces')));
    if (spaces().length) {
      var createSpaceButton = button(tr('新建空间', 'New space'), 'toggle-space-form', 'obgs-text-button', false);
      createSpaceButton.id = 'obgs-space-create-toggle';
      append(head, createSpaceButton);
      setFocusKey(head.lastChild, 'space-create-toggle');
    }
    host.appendChild(head);
    if (spaces().length) {
      var searchWrap = node('div', 'obgs-search-wrap obgs-space-search-wrap');
      searchWrap.appendChild(searchField('obgs-space-search', 'spaceQuery', tr('查找空间', 'Find a space'), tr('按空间名称查找', 'Search spaces by name'), viewFilters.spaceQuery));
      host.appendChild(searchWrap);
    }
    var list = node('nav', 'obgs-space-list');
    list.setAttribute('aria-label', tr('选择游戏空间', 'Select a game space'));
    if (!state) {
      append(list, node('p', 'obgs-quiet', tr('正在读取空间…', 'Loading spaces…')));
    } else if (!spaces().length) {
      append(list, node('p', 'obgs-quiet', tr('还没有空间。', 'No spaces yet.')));
    } else {
      var visibleSpaces = spaces().filter(function (space) { return matchesSearch(space.name, viewFilters.spaceQuery); });
      if (!visibleSpaces.length) {
        var emptyMatch = node('div', 'obgs-filter-empty');
        append(emptyMatch, node('p', 'obgs-quiet', tr('没有符合名称的空间。', 'No spaces match this name.')));
        emptyMatch.appendChild(setFocusKey(button(tr('清除搜索', 'Clear search'), 'clear-space-search', 'obgs-text-button'), 'spaceQuery'));
        list.appendChild(emptyMatch);
      }
      visibleSpaces.forEach(function (space) {
        var item = button('', 'select-space', 'obgs-space-item', false);
        item.dataset.gsSpaceId = String(space.id);
        item.setAttribute('aria-current', String(space.id) === String(selectedSpaceId) ? 'page' : 'false');
        setFocusKey(item, 'space-' + String(space.id));
        append(item, node('strong', 'obgs-space-name', value(space.name, tr('未命名空间', 'Untitled space'))));
        var meta = node('span', 'obgs-space-meta', tr('{halls} 个牌局 · {bots} 个 BOT', '{halls} tables · {bots} BOTs', {
          halls: hallsFor(space.id).length,
          bots: Array.isArray(space.memberBotIds) ? space.memberBotIds.length : 0
        }));
        append(item, meta);
        list.appendChild(item);
      });
    }
    host.appendChild(list);
  }

  function renderMain(host) {
    renderViewNav(host);
    if (activeView === 'leaderboard') {
      var benchmark = node('section', 'obgs-benchmark-host');
      benchmark.id = 'obgs-benchmark-host';
      host.appendChild(benchmark);
      if (root.OpenBotGameBenchmark && typeof root.OpenBotGameBenchmark.render === 'function') {
        root.OpenBotGameBenchmark.render(benchmark, { bridge: root.grokbot, tr: tr, avatar: avatar, games: games() });
      } else {
        append(benchmark, node('p', 'obgs-quiet', tr('排行榜组件尚未加载。', 'The leaderboard view is unavailable.')));
      }
      return;
    }
    if (stateError) {
      var failed = node('section', 'obgs-empty-state');
      append(failed, node('h2', '', tr('无法读取游戏空间', 'Game spaces could not load')));
      append(failed, node('p', '', stateError));
      append(failed, button(tr('重试', 'Retry'), 'retry', 'obgs-primary', false));
      host.appendChild(failed);
      return;
    }
    if (!state) {
      append(host, node('p', 'obgs-loading', tr('正在读取游戏空间…', 'Loading game spaces…')));
      return;
    }
    var space = selectedSpace();
    if (!space) {
      var empty = node('section', 'obgs-empty-state');
      append(empty, node('h2', '', tr('创建第一个游戏空间', 'Create your first game space')));
      append(empty, node('p', '', tr('空间保留成员 BOT；每个空间可以创建多张独立牌桌。', 'A space keeps its BOT members and can hold multiple independent tables.')));
      if (!spaceFormOpen) empty.appendChild(button(tr('新建空间', 'New space'), 'toggle-space-form', 'obgs-primary', buttonBusy() || state.bots.length < 2));
      if (actionError) {
        var emptyError = node('p', 'obgs-action-error', actionError);
        emptyError.setAttribute('role', 'alert');
        empty.appendChild(emptyError);
      }
      if (spaceFormOpen) append(empty, renderSpaceForm());
      if (!state.bots.length) append(empty, node('p', 'obgs-empty-note', tr('当前没有可用 BOT。先在 Bot Studio 中创建至少两个 BOT。', 'No BOTs are available. Create at least two BOTs in Bot Studio first.')));
      host.appendChild(empty);
      return;
    }

    var spaceHead = node('section', 'obgs-workspace-head');
    var spaceCopy = node('div', 'obgs-space-copy');
    append(spaceCopy, node('h2', 'obgs-workspace-title', value(space.name, tr('未命名空间', 'Untitled space'))));
    append(spaceCopy, node('p', 'obgs-space-member-count', tr('{count} 个成员 BOT', '{count} member BOTs', { count: Array.isArray(space.memberBotIds) ? space.memberBotIds.length : 0 })));
    spaceHead.appendChild(spaceCopy);
    var memberList = node('div', 'obgs-members');
    memberList.setAttribute('aria-label', tr('空间成员', 'Space members'));
    memberBots(space).forEach(function (bot) {
      var person = node('span', 'obgs-member');
      var face = node('span', 'obgs-member-avatar'); avatar(face, bot, 'mini');
      append(person, face);
      append(person, node('span', 'obgs-member-name', botName(bot)));
      memberList.appendChild(person);
    });
    if (!memberList.childElementCount) append(memberList, node('span', 'obgs-quiet', tr('成员 BOT 暂不可用。', 'Member BOTs are unavailable.')));
    spaceHead.appendChild(memberList);
    var hallToggle = button(tr('新建牌局', 'New table'), 'toggle-hall-form', 'obgs-primary', false);
    hallToggle.id = 'obgs-hall-create-toggle';
    setFocusKey(hallToggle, 'hall-create-toggle');
    spaceHead.appendChild(hallToggle);
    host.appendChild(spaceHead);

    if (actionError) {
      var error = node('p', 'obgs-action-error', actionError);
      error.setAttribute('role', 'alert');
      host.appendChild(error);
    }
    if (spaceFormOpen) host.appendChild(renderSpaceForm());
    if (hallFormOpen) host.appendChild(renderHallForm(space));

    var grid = node('div', 'obgs-workspace-grid');
    var hallRail = node('aside', 'obgs-hall-rail');
    var available = hallsFor(space.id);
    var visibleHalls = available.filter(function (hall) {
      var haystack = [hall.name, gameLabel(hall.game), hall.game, statusLabel(hall.status)]
        .concat((hall.botIds || []).map(botLabel)).join(' ');
      return matchesSearch(haystack, viewFilters.hallQuery)
        && (viewFilters.hallGame === 'all' || String(hall.game) === viewFilters.hallGame)
        && (viewFilters.hallStatus === 'all' || String(hall.status) === viewFilters.hallStatus);
    });
    var hallListHead = node('div', 'obgs-list-head');
    append(hallListHead, node('h3', 'obgs-list-title', tr('牌桌', 'Tables')));
    append(hallListHead, node('span', 'obgs-list-count', tr('{visible} / {total}', '{visible} / {total}', { visible: visibleHalls.length, total: available.length })));
    hallRail.appendChild(hallListHead);
    if (available.length) {
      var hallSearchWrap = node('div', 'obgs-search-wrap obgs-hall-search-wrap');
      hallSearchWrap.appendChild(searchField('obgs-hall-search', 'hallQuery', tr('查找牌桌或成员', 'Find a table or member'), tr('按牌桌、游戏或成员名称查找', 'Search tables, games, or member names'), viewFilters.hallQuery));
      hallRail.appendChild(hallSearchWrap);
      var hallFilterRow = node('div', 'obgs-list-filters');
      hallFilterRow.appendChild(filterSelect('obgs-hall-game-filter', 'hallGame', tr('按游戏筛选', 'Filter by game'),
        [['all', tr('所有游戏', 'All games')]].concat(games().map(function (meta) { return [String(meta.id), gameLabel(meta.id)]; })), viewFilters.hallGame));
      hallFilterRow.appendChild(filterSelect('obgs-hall-status-filter', 'hallStatus', tr('按状态筛选', 'Filter by status'), [
        ['all', tr('所有状态', 'All statuses')], ['waiting', tr('待开始', 'Waiting')], ['running', tr('进行中', 'In progress')],
        ['paused', tr('已暂停', 'Paused')], ['finished', tr('已结束', 'Finished')]
      ], viewFilters.hallStatus));
      hallRail.appendChild(hallFilterRow);
    }
    var hallList = node('nav', 'obgs-hall-list');
    hallList.setAttribute('aria-label', tr('选择牌局', 'Select a table'));
    if (!available.length) {
      append(hallList, node('p', 'obgs-quiet', tr('这个空间还没有牌局。', 'This space has no tables yet.')));
    } else if (!visibleHalls.length) {
      var noTableMatch = node('div', 'obgs-filter-empty');
      append(noTableMatch, node('p', 'obgs-quiet', tr('没有符合条件的牌桌。', 'No tables match these filters.')));
      noTableMatch.appendChild(setFocusKey(button(tr('清除筛选', 'Clear filters'), 'clear-hall-filters', 'obgs-text-button'), 'hallQuery'));
      hallList.appendChild(noTableMatch);
    } else {
      visibleHalls.forEach(function (hall) {
        var item = button('', 'select-hall', 'obgs-hall-item', false);
        item.dataset.gsHallId = String(hall.id);
        item.setAttribute('aria-current', String(hall.id) === String(selectedHallId) ? 'page' : 'false');
        setFocusKey(item, 'hall-' + String(hall.id));
        append(item, node('strong', 'obgs-hall-name', value(hall.name, tr('未命名牌局', 'Untitled table'))));
        var meta = node('span', 'obgs-hall-meta');
        append(meta, renderGameLabel(hall.game));
        append(meta, node('span', 'obgs-status-text', statusLabel(hall.status)));
        item.appendChild(meta);
        hallList.appendChild(item);
      });
    }
    hallRail.appendChild(hallList);
    grid.appendChild(hallRail);
    var detail = node('section', 'obgs-detail');
    var hall = selectedHall();
    if (hall && visibleHalls.indexOf(hall) < 0) {
      var filteredActive = node('div', 'obgs-filter-note');
      append(filteredActive, node('span', '', tr('当前查看的牌桌不符合列表筛选。', 'The table in view is outside the current filters.')));
      filteredActive.appendChild(setFocusKey(button(tr('清除筛选', 'Clear filters'), 'clear-hall-filters', 'obgs-text-button'), 'hallQuery'));
      detail.appendChild(filteredActive);
    }
    if (hall) renderHall(detail, hall);
    else {
      var noHall = node('div', 'obgs-empty-state obgs-no-hall');
      append(noHall, node('h3', '', tr('选择或新建一张牌局', 'Select or create a table')));
      append(noHall, node('p', '', games().map(function (meta) {
        return tr('{game} 需要 {seats}', '{game} uses {seats}', { game: gameLabel(meta.id), seats: gameSeatsText(meta) });
      }).join('；') || tr('选择游戏后即可创建牌局。', 'Choose a game to create a table.')));
      var noHallLayout = node('div', 'obgs-table-social-layout');
      noHallLayout.dataset.gsChatState = chatPanelState;
      var noHallColumn = node('div', 'obgs-game-column');
      noHall.appendChild(renderChatToggle());
      noHallColumn.appendChild(noHall);
      noHallLayout.appendChild(noHallColumn);
      noHallLayout.appendChild(renderChatPanel(String(space.id), null));
      detail.appendChild(noHallLayout);
    }
    grid.appendChild(detail);
    host.appendChild(grid);
  }

  function renderViewNav(host) {
    var nav = node('nav', 'obgs-view-nav');
    nav.setAttribute('aria-label', tr('游戏空间视图', 'Game-space views'));
    nav.setAttribute('role', 'tablist');
    [
      { id: 'hall', label: tr('大厅', 'Hall') },
      { id: 'leaderboard', label: tr('排行榜', 'Leaderboard') }
    ].forEach(function (entry) {
      var tab = button(entry.label, 'select-view', 'obgs-view-tab' + (activeView === entry.id ? ' is-selected' : ''), false);
      setFocusKey(tab, 'view-' + entry.id);
      tab.id = entry.id === 'hall' ? 'obgs-view-hall' : 'obgs-view-leaderboard';
      tab.dataset.gsView = entry.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', activeView === entry.id ? 'true' : 'false');
      tab.setAttribute('tabindex', activeView === entry.id ? '0' : '-1');
      nav.appendChild(tab);
    });
    host.appendChild(nav);
  }

  function renderSpaceForm() {
    var form = node('form', 'obgs-create-form');
    form.id = 'obgs-space-create-form';
    form.dataset.gsForm = 'space';
    append(form, node('h3', 'obgs-form-title', tr('新建空间', 'New space')));
    var nameWrap = node('div', 'obgs-field');
    var nameLabel = node('label', '', tr('空间名称', 'Space name'));
    nameLabel.htmlFor = 'obgs-space-name';
    var nameInput = node('input', '');
    nameInput.id = 'obgs-space-name';
    nameInput.type = 'text';
    nameInput.maxLength = 80;
    nameInput.required = true;
    nameInput.value = drafts.spaceName;
    nameInput.placeholder = tr('例如：周末牌局', 'For example, Weekend games');
    nameInput.dataset.gsDraft = 'spaceName';
    setFocusKey(nameInput, 'space-name');
    nameWrap.appendChild(nameLabel);
    nameWrap.appendChild(nameInput);
    form.appendChild(nameWrap);

    var fieldset = node('fieldset', 'obgs-bot-picker');
    append(fieldset, node('legend', '', tr('空间成员 BOT（至少 2 个）', 'Member BOTs (at least 2)')));
    var selected = drafts.spaceMemberBotIds;
    if (!state.bots.length) append(fieldset, node('p', 'obgs-quiet', tr('当前没有可选 BOT。', 'No BOTs are available.')));
    var botSearch = node('div', 'obgs-search-wrap obgs-picker-search');
    botSearch.appendChild(searchField('obgs-space-bot-search', 'spaceBotQuery', tr('按名称或 ID 查找 BOT', 'Find a BOT by name or ID'), tr('查找空间成员 BOT', 'Search member BOTs'), viewFilters.spaceBotQuery));
    fieldset.appendChild(botSearch);
    var matchingBots = state.bots.filter(function (bot) { return matchesSearch([botName(bot), botId(bot)].join(' '), viewFilters.spaceBotQuery); });
    append(fieldset, node('p', 'obgs-picker-count', tr('已选 {selected} 个 · 显示 {visible} / {total}', '{selected} selected · showing {visible} / {total}', { selected: selected.length, visible: matchingBots.length, total: state.bots.length })));
    if (state.bots.length && !matchingBots.length) append(fieldset, node('p', 'obgs-filter-empty-copy', tr('没有符合名称或 ID 的 BOT。', 'No BOTs match this name or ID.')));
    matchingBots.forEach(function (bot) {
      var id = botId(bot);
      var label = node('label', 'obgs-bot-option');
      var check = node('input', '');
      check.type = 'checkbox';
      check.value = id;
      check.checked = selected.indexOf(id) >= 0;
      check.dataset.gsField = 'space-member';
      setFocusKey(check, 'space-member-' + id);
      var face = node('span', 'obgs-option-avatar'); avatar(face, bot, 'mini');
      append(label, check);
      append(label, face);
      var name = node('span', 'obgs-option-name', botName(bot));
      name.title = botName(bot);
      append(label, name);
      fieldset.appendChild(label);
    });
    append(form, fieldset);
    append(form, node('p', 'obgs-form-note', tr('空间可包含多个 BOT；牌局按所选游戏人数从成员中取用。', 'A space can include more BOTs. Each table uses as many members as its game allows.')));
    var actions = node('div', 'obgs-form-actions');
    var submit = node('button', 'obgs-primary', tr('创建空间', 'Create space'));
    submit.type = 'submit';
    submit.disabled = buttonBusy() || state.bots.length < 2;
    append(actions, submit);
    append(actions, button(tr('取消', 'Cancel'), 'cancel-space-form', 'obgs-text-button', buttonBusy()));
    append(form, actions);
    return form;
  }

  function renderHallForm(space) {
    var form = node('form', 'obgs-create-form obgs-hall-form');
    form.id = 'obgs-hall-create-form';
    form.dataset.gsForm = 'hall';
    append(form, node('h3', 'obgs-form-title', tr('新建牌局', 'New table')));
    var nameWrap = node('div', 'obgs-field');
    var label = node('label', '', tr('牌局名称', 'Table name'));
    label.htmlFor = 'obgs-hall-name';
    var nameInput = node('input', '');
    nameInput.id = 'obgs-hall-name';
    nameInput.type = 'text';
    nameInput.maxLength = 80;
    nameInput.required = true;
    nameInput.value = drafts.hallName;
    nameInput.placeholder = tr('例如：东风桌', 'For example, East wind table');
    nameInput.dataset.gsDraft = 'hallName';
    setFocusKey(nameInput, 'hall-name');
    nameWrap.appendChild(label);
    nameWrap.appendChild(nameInput);
    form.appendChild(nameWrap);

    var meta = gameMeta(drafts.gameId) || games()[0] || null;
    var gameField = node('div', 'obgs-field obgs-game-field');
    var gameLabelNode = node('label', '', tr('游戏', 'Game'));
    gameLabelNode.htmlFor = 'obgs-hall-game';
    var gameSelect = node('select', '');
    gameSelect.id = 'obgs-hall-game';
    gameSelect.dataset.gsDraft = 'gameId';
    setFocusKey(gameSelect, 'hall-game');
    games().forEach(function (entry) {
      var option = node('option', '', gameLabel(entry.id) + ' · ' + gameSeatsText(entry));
      option.value = entry.id;
      gameSelect.appendChild(option);
    });
    gameSelect.value = meta ? meta.id : '';
    gameSelect.disabled = buttonBusy() || !games().length;
    gameField.appendChild(gameLabelNode);
    gameField.appendChild(gameSelect);
    form.appendChild(gameField);

    var fieldset = node('fieldset', 'obgs-bot-picker');
    append(fieldset, node('legend', '', tr('参赛 BOT（{game} 需要 {seats}）', 'Players ({game} uses {seats})', {
      game: meta ? gameLabel(meta.id) : tr('游戏', 'the game'),
      seats: meta ? gameSeatsText(meta) : tr('若干', 'some')
    })));
    var memberIds = space && Array.isArray(space.memberBotIds) ? space.memberBotIds.map(String) : [];
    var candidates = (state.bots || []).filter(function (bot) { return memberIds.indexOf(botId(bot)) >= 0; });
    var botSearch = node('div', 'obgs-search-wrap obgs-picker-search');
    botSearch.appendChild(searchField('obgs-hall-bot-search', 'hallBotQuery', tr('按名称或 ID 查找 BOT', 'Find a BOT by name or ID'), tr('查找参赛 BOT', 'Search players'), viewFilters.hallBotQuery));
    fieldset.appendChild(botSearch);
    var matchingCandidates = candidates.filter(function (bot) { return matchesSearch([botName(bot), botId(bot)].join(' '), viewFilters.hallBotQuery); });
    append(fieldset, node('p', 'obgs-picker-count', tr('已选 {selected} · 显示 {visible} / {total}', '{selected} selected · showing {visible} / {total}', { selected: drafts.hallBotIds.length, visible: matchingCandidates.length, total: candidates.length })));
    var maxSeats = meta ? Number(meta.maxSeats) : 0;
    if (!candidates.length) append(fieldset, node('p', 'obgs-quiet', tr('这个空间暂时没有可用成员 BOT。', 'This space has no available member BOTs.')));
    if (candidates.length && !matchingCandidates.length) append(fieldset, node('p', 'obgs-filter-empty-copy', tr('没有符合名称或 ID 的 BOT；已选 BOT 仍会保留。', 'No BOTs match this name or ID; current selections remain.')));
    matchingCandidates.forEach(function (bot) {
      var id = botId(bot);
      var chosen = drafts.hallBotIds.indexOf(id) >= 0;
      var limitReached = drafts.hallBotIds.length >= maxSeats && !chosen;
      var item = node('label', 'obgs-bot-option');
      var check = node('input', '');
      check.type = 'checkbox';
      check.value = id;
      check.checked = chosen;
      check.disabled = limitReached;
      check.dataset.gsField = 'hall-bot';
      setFocusKey(check, 'hall-bot-' + id);
      var face = node('span', 'obgs-option-avatar'); avatar(face, bot, 'mini');
      append(item, check);
      append(item, face);
      var name = node('span', 'obgs-option-name', botName(bot));
      name.title = botName(bot);
      append(item, name);
      fieldset.appendChild(item);
    });
    form.appendChild(fieldset);
    var count = drafts.hallBotIds.length;
    append(form, node('p', 'obgs-form-note obgs-game-choice', meta
      ? (canSeat(meta, count)
        ? tr('{game}：已选 {count} 个 BOT，符合 {seats}。', '{game}: {count} BOTs selected, which fits {seats}.', { game: gameLabel(meta.id), count: count, seats: gameSeatsText(meta) })
        : tr('{game} 需要 {seats}，当前选了 {count} 个。', '{game} needs {seats}; {count} selected.', { game: gameLabel(meta.id), seats: gameSeatsText(meta), count: count }))
      : tr('当前没有已注册的游戏。', 'No game is registered.')));

    var controllerField = node('div', 'obgs-field obgs-controller-field');
    var controllerLabel = node('label', '', tr('对局方式', 'Controller'));
    controllerLabel.htmlFor = 'obgs-controller';
    var controller = node('select', '');
    controller.id = 'obgs-controller';
    controller.dataset.gsDraft = 'controller';
    setFocusKey(controller, 'hall-controller');
    var rulesOption = node('option', '', tr('规则 BOT（不调用模型）', 'Rules BOT (no model calls)'));
    rulesOption.value = 'rules';
    var modelOption = node('option', '', tr('BOT 模型（会产生调用）', 'BOT model (makes model calls)'));
    modelOption.value = 'model';
    controller.appendChild(rulesOption);
    controller.appendChild(modelOption);
    controller.value = drafts.controller === 'model' ? 'model' : 'rules';
    controllerField.appendChild(controllerLabel);
    controllerField.appendChild(controller);
    form.appendChild(controllerField);
    var communicationField = node('fieldset', 'obgs-communication-choice');
    append(communicationField, node('legend', '', tr('桌内交流', 'Table chat')));
    [
      ['table-talk', tr('允许聊天', 'Allow chat')],
      ['silent', tr('安静对局', 'Quiet table')]
    ].forEach(function (entry) {
      var option = node('label', 'obgs-communication-option');
      var radio = node('input', '');
      radio.type = 'radio';
      radio.name = 'obgs-hall-communication';
      radio.value = entry[0];
      radio.checked = drafts.communication === entry[0];
      radio.dataset.gsDraft = 'communication';
      setFocusKey(radio, 'hall-communication-' + entry[0]);
      append(option, radio);
      append(option, node('span', '', entry[1]));
      communicationField.appendChild(option);
    });
    form.appendChild(communicationField);
    append(form, node('p', 'obgs-form-note', tr('设置在创建后固定；安静对局不纳入允许聊天的排行榜。', 'This choice stays fixed for the table. Quiet-table results are ranked separately from games with chat.')));
    append(form, node('p', 'obgs-form-note', drafts.controller === 'model'
      ? tr('模型牌局只会在你确认启动后发起调用。', 'Model calls start only after you confirm the table start.')
      : tr('规则 BOT 完全在本机按规则推进，不调用模型。', 'Rules BOTs play locally and do not call a model.')));
    var actions = node('div', 'obgs-form-actions');
    var submit = node('button', 'obgs-primary', tr('创建牌局', 'Create table'));
    submit.type = 'submit';
    submit.disabled = buttonBusy() || !meta || !canSeat(meta, count) || !candidates.length;
    append(actions, submit);
    append(actions, button(tr('取消', 'Cancel'), 'cancel-hall-form', 'obgs-text-button', buttonBusy()));
    form.appendChild(actions);
    return form;
  }

  function roomRecordingEntryButton(hall) {
    if (!hall) return null;
    var active = recordingActive;
    var label = tr('录制', 'Record');
    var disabled = false;
    if (active) {
      if (isRoomRecordingActive(active)) {
        var sameHall = activeRecordingHallId(active) === String(hall.id);
        label = sameHall ? tr('录制中', 'Recording') : tr('已有房间录制', 'Room recording active');
        disabled = !sameHall;
      } else label = tr('采集占用中', 'Capture in use');
    }
    var item = button(label, 'toggle-recording-setup', 'obgs-secondary obgs-recording-entry', disabled);
    item.dataset.gsHallId = String(hall.id);
    item.setAttribute('aria-expanded', String(recordingSetupHallId === String(hall.id)));
    item.setAttribute('aria-controls', 'obgs-room-recording-setup');
    setFocusKey(item, 'recording-entry-' + String(hall.id));
    return item;
  }

  function roomRecordingBotName(id) {
    id = String(id || '');
    var matches = recordingBots || [];
    for (var i = 0; i < matches.length; i++) if (String(matches[i].id) === id) return value(matches[i].name, id);
    return botLabel(id);
  }

  function roomRecordingStatusLabel(status) {
    if (!roomRecordingBridge()) return tr('录制服务尚未连接。', 'The game-room recording service is not connected.');
    if (!recordingStatusLoaded) return tr('正在检查房间录制服务…', 'Checking room recording service…');
    if (recordingStatusError) return recordingStatusError;
    if (status && status.supported === false) return value(status.message, tr('此环境暂不支持录制。', 'Recording is not supported in this environment.'));
    if (status && status.available === false) return value(status.message, tr('录制当前不可用。', 'Recording is currently unavailable.'));
    return '';
  }

  function isRoomRecordingActive(active) {
    var scope = active && active.scope;
    return !!(scope && typeof scope === 'object' && scope.viewBotId === 'public-spectator'
      && recordingText(scope.spaceId, 128) && recordingText(scope.hallId, 128)
      && recordingText(scope.matchId, 128) && recordingText(scope.initiatorBotId, 128));
  }

  function roomRecordingPluginInfo() {
    if (recordingPluginStatus) return recordingPluginStatus;
    return recordingStatus && (recordingStatus.plugin || recordingStatus.capturePlugin) || null;
  }

  function roomRecordingPluginBlocked() {
    var plugin = roomRecordingPluginInfo();
    return !!(plugin && (plugin.installed !== true || plugin.enabled !== true));
  }

  function renderRoomRecordingSetup(hall) {
    var hallId = String(hall.id);
    var selectedOwner = String(recordingOwnerByHall[hallId] || '');
    var ownerChoices = (recordingBots || []).map(function (bot) { return String(bot.id || ''); }).filter(Boolean);
    if (!ownerChoices.length) {
      ownerChoices = Array.isArray(hall.botIds) ? hall.botIds.map(String) : [];
      if (!ownerChoices.length && hall.table && Array.isArray(hall.table.players)) {
        ownerChoices = hall.table.players.map(function (player) { return String(player.botId || ''); }).filter(Boolean);
      }
    }
    if (selectedOwner && ownerChoices.indexOf(selectedOwner) < 0) {
      selectedOwner = '';
      recordingOwnerByHall[hallId] = '';
    }
    var panel = node('section', 'obgs-recording-setup');
    panel.id = 'obgs-room-recording-setup';
    panel.setAttribute('aria-labelledby', 'obgs-room-recording-title');
    var top = node('div', 'obgs-recording-setup-head');
    var setupTitle = node('h4', '', tr('录制牌局', 'Record this table'));
    setupTitle.id = 'obgs-room-recording-title';
    append(top, setupTitle);
    append(top, node('p', '', tr('只录制公共观战画面，不录入任何私牌或玩家视角。', 'Records the public spectator view only; private hands and player views are excluded.')));
    panel.appendChild(top);

    var fields = node('div', 'obgs-recording-fields');
    var ownerField = node('div', 'obgs-field obgs-recording-owner');
    var ownerLabel = node('label', '', tr('素材所属 Bot', 'Recording owner Bot'));
    ownerLabel.htmlFor = 'obgs-recording-owner';
    var ownerSelect = node('select', '');
    ownerSelect.id = 'obgs-recording-owner';
    ownerSelect.dataset.gsRecordingOwner = hallId;
    ownerSelect.setAttribute('aria-label', tr('选择此牌局素材所属 Bot', 'Choose the Bot that owns this table recording'));
    setFocusKey(ownerSelect, 'recording-owner-' + hallId);
    var emptyOption = node('option', '', tr('先选择一个 Bot…', 'Choose a Bot…'));
    emptyOption.value = '';
    ownerSelect.appendChild(emptyOption);
    ownerChoices.forEach(function (id) {
      var option = node('option', '', roomRecordingBotName(id));
      option.value = id;
      ownerSelect.appendChild(option);
    });
    ownerSelect.value = selectedOwner;
    ownerField.appendChild(ownerLabel);
    ownerField.appendChild(ownerSelect);
    fields.appendChild(ownerField);
    var durationField = node('div', 'obgs-field obgs-recording-duration');
    var durationLabel = node('label', '', tr('最长时长', 'Maximum duration'));
    durationLabel.htmlFor = 'obgs-recording-duration';
    var durationSelect = node('select', '');
    durationSelect.id = 'obgs-recording-duration';
    durationSelect.dataset.gsRecordingDuration = hallId;
    setFocusKey(durationSelect, 'recording-duration-' + hallId);
    [[30, tr('30 秒', '30 seconds')], [60, tr('60 秒', '60 seconds')], [120, tr('120 秒', '120 seconds')], [180, tr('180 秒', '180 seconds')]].forEach(function (entry) {
      var option = node('option', '', entry[1]);
      option.value = String(entry[0]);
      durationSelect.appendChild(option);
    });
    durationSelect.value = String(recordingDurationByHall[hallId] || 180);
    durationField.appendChild(durationLabel);
    durationField.appendChild(durationSelect);
    fields.appendChild(durationField);
    panel.appendChild(fields);
    if (!ownerChoices.length && recordingStatusLoaded) {
      var noOwners = node('p', 'obgs-recording-status', tr('当前牌局没有可选的素材所属 Bot。', 'No Bot is available to own a recording for this table.'));
      noOwners.setAttribute('role', 'status');
      panel.appendChild(noOwners);
    }

    append(panel, node('p', 'obgs-recording-audio', tr('音轨：系统声音 + 麦克风。', 'Audio: system sound + microphone.')));
    append(panel, node('p', 'obgs-recording-scope', tr('观战范围：公共视角 · 最多 180 秒。', 'View: public spectator · up to 180 seconds.')));

    var statusMessage = roomRecordingStatusLabel(recordingStatus);
    var plugin = roomRecordingPluginInfo();
    var pluginUnavailable = roomRecordingPluginBlocked();
    if (recordingActive && !isRoomRecordingActive(recordingActive)) {
      statusMessage = tr('已有屏幕录制正在进行。请先在全局录制状态栏停止，再录制牌局。', 'A screen recording is already active. Stop it in the global recording bar before recording this table.');
    } else if (isRoomRecordingActive(recordingActive)) {
      statusMessage = tr('此牌局正在录制。可在这里或全局录制状态栏停止。', 'This table is recording. Stop it here or in the global recording bar.');
    }
    if (!statusMessage && recordingPluginBusy) statusMessage = tr('正在检查采集插件…', 'Checking the capture plugin…');
    if (!statusMessage && recordingPluginError) statusMessage = recordingPluginError;
    if (!statusMessage && pluginUnavailable) statusMessage = plugin.installed === true
      ? tr('采集插件已安装，请先启用。', 'The capture plugin is installed; enable it to record.')
      : tr('需要安装采集插件才能录制。', 'Install the capture plugin to record.');
    if (!statusMessage && recordingStatus && recordingStatus.message) statusMessage = value(recordingStatus.message, '');
    if (statusMessage) {
      var availability = node('p', 'obgs-recording-status', statusMessage);
      availability.setAttribute('role', recordingStatusError || recordingPluginError ? 'alert' : 'status');
      availability.dataset.error = String(!!(recordingStatusError || recordingPluginError));
      panel.appendChild(availability);
    }
    if (recordingError) {
      var error = node('p', 'obgs-recording-error', recordingError);
      error.setAttribute('role', 'alert');
      error.setAttribute('aria-live', 'assertive');
      panel.appendChild(error);
    }

    var recordings = renderRoomRecordingList(hall, selectedOwner);
    if (recordings) panel.appendChild(recordings);

    var actions = node('div', 'obgs-recording-actions');
    var activeForHall = isRoomRecordingActive(recordingActive) && activeRecordingHallId(recordingActive) === hallId;
    if (activeForHall) {
      var retryStop = recordingActive.state === 'stopping' && recordingActive.cleanupUnconfirmed === true;
      var stopLabel = recordingBusy === 'stop'
        ? tr(retryStop ? '正在重试停止…' : '正在停止…', retryStop ? 'Retrying stop…' : 'Stopping…')
        : tr(retryStop ? '重试停止' : '停止录制', retryStop ? 'Retry stop' : 'Stop recording');
      var stopButton = button(stopLabel, 'stop-room-recording', 'obgs-secondary obgs-room-recording-stop');
      stopButton.dataset.gsHallId = hallId;
      stopButton.disabled = recordingBusy !== '' || recordingActive.state === 'stopping' && !retryStop;
      setFocusKey(stopButton, 'recording-stop-' + hallId);
      actions.appendChild(stopButton);
    } else {
      var startButton = button(recordingBusy === 'start' ? tr('正在开始…', 'Starting…') : tr('开始录制', 'Start recording'), 'start-room-recording', 'obgs-primary');
      startButton.dataset.gsHallId = hallId;
      startButton.disabled = recordingBusy !== '' || !!recordingActive || !selectedOwner || !roomRecordingBridge() || !recordingStatusLoaded
        || !!recordingStatusError || !!(recordingStatus && (recordingStatus.supported === false || recordingStatus.available === false))
        || recordingPluginBusy || !!recordingPluginError || pluginUnavailable;
      setFocusKey(startButton, 'recording-start-' + hallId);
      actions.appendChild(startButton);
    }
    if (pluginUnavailable || recordingPluginError || !recordingPluginStatus && !roomRecordingPluginInfo()) {
      var pluginButton = button(tr('打开采集插件入口', 'Open capture plugin'), 'open-capture-plugin', 'obgs-text-button', false);
      pluginButton.setAttribute('aria-label', tr('打开现有截图与录制插件入口', 'Open the existing screenshot and recording plugin entry'));
      setFocusKey(pluginButton, 'recording-plugin-' + hallId);
      actions.appendChild(pluginButton);
    }
    panel.appendChild(actions);
    return panel;
  }

  function renderRoomRecordingList(hall, ownerId) {
    ownerId = String(ownerId || '');
    if (!ownerId) return null;
    var hallId = String(hall && hall.id || '');
    var items = (recordingRecords || []).filter(function (item) {
      return item && item.hallId === hallId && item.botId === ownerId && !recordingAttachedIds[item.recordingId];
    });
    if (recordingRecent && recordingRecent.hallId === hallId && recordingRecent.botId === ownerId
      && !recordingAttachedIds[recordingRecent.recordingId]
      && !items.some(function (item) { return item.recordingId === recordingRecent.recordingId; })) {
      items.unshift(recordingRecent);
    }
    if (!items.length) return null;
    var section = node('section', 'obgs-recording-list');
    section.setAttribute('aria-label', tr('未发送的房间录制', 'Unsent game-room recordings'));
    append(section, node('h5', '', tr('已保存录制', 'Saved recordings')));
    var list = node('ul', 'obgs-recording-list-items');
    items.forEach(function (item) {
      var row = node('li', 'obgs-recording-list-row');
      var summary = node('div', 'obgs-recording-list-summary');
      append(summary, node('strong', '', roomRecordingBotName(item.botId)));
      append(summary, node('span', '', tr('公共观战 · {duration}', 'Public spectator · {duration}', {
        duration: recordingDuration(item.durationSeconds)
      })));
      row.appendChild(summary);
      var actions = node('div', 'obgs-recording-list-actions');
      var preview = button(tr('预览', 'Preview'), 'preview-room-recording', 'obgs-text-button');
      preview.dataset.gsRecordingId = item.recordingId;
      preview.setAttribute('aria-label', tr('预览 {bot} 的牌局录制', 'Preview recording for {bot}', { bot: roomRecordingBotName(item.botId) }));
      setFocusKey(preview, 'recording-list-preview-' + item.recordingId);
      actions.appendChild(preview);
      var send = button(tr('发送到聊天', 'Send to chat'), 'attach-room-recording', 'obgs-primary');
      send.dataset.gsRecordingId = item.recordingId;
      send.setAttribute('aria-label', tr('将 {bot} 的牌局录制发送到所属 Bot 聊天', 'Send {bot} table recording to its owner Bot chat', { bot: roomRecordingBotName(item.botId) }));
      send.disabled = recordingBusy === 'attach';
      setFocusKey(send, 'recording-list-attach-' + item.recordingId);
      actions.appendChild(send);
      row.appendChild(actions);
      list.appendChild(row);
    });
    section.appendChild(list);
    return section;
  }

  function renderHall(host, hall) {
    var header = node('header', 'obgs-hall-head');
    var copy = node('div', 'obgs-hall-copy');
    append(copy, node('h3', 'obgs-hall-title', value(hall.name, tr('未命名牌局', 'Untitled table'))));
    var meta = node('div', 'obgs-hall-meta-line');
    append(meta, renderGameLabel(hall.game));
    append(meta, statusBadge(hall.status));
    append(meta, node('span', 'obgs-controller-label', controllerLabel(hall.controller)));
    append(meta, node('span', 'obgs-communication-label', communicationLabel(hall)));
    if (hall.game === 'mahjong' && hall.controller === 'rules') {
      append(meta, node('span', 'obgs-spectator-note', tr('观战 · BOT 自动对局', 'Spectating · BOTs play automatically')));
    }
    copy.appendChild(meta);
    header.appendChild(copy);
    var actions = node('div', 'obgs-hall-actions');
    append(actions, hallAction(hall));
    var recordingButton = roomRecordingEntryButton(hall);
    if (recordingButton) actions.appendChild(recordingButton);
    if (!replayOpen) actions.appendChild(renderChatToggle());
    if (Array.isArray(hall.rounds) && hall.rounds.length) {
      var replayButton = button(replayOpen ? tr('退出回放', 'Exit replay') : tr('回放', 'Replay'), 'toggle-replay', 'obgs-text-button', buttonBusy());
      replayButton.id = 'obgs-replay-toggle';
      setFocusKey(replayButton, 'replay-toggle');
      actions.appendChild(replayButton);
    }
    header.appendChild(actions);
    host.appendChild(header);
    if (recordingSetupHallId === String(hall.id)) host.appendChild(renderRoomRecordingSetup(hall));
    if (needsPerspective(hall)) host.appendChild(renderViewerPicker(hall));
    if (hall.error) {
      var hallError = node('p', 'obgs-hall-error', hall.error);
      hallError.setAttribute('role', 'alert');
      hallError.setAttribute('aria-live', 'assertive');
      hallError.id = 'obgs-hall-error';
      host.appendChild(hallError);
      if (hall.controller === 'model' && hall.status === 'paused') {
        var retryHint = node('p', 'obgs-error-hint', tr('本轮没有推进。单步会再次调用模型；开始前请确认 BOT 接口可用。', 'This turn did not advance. Step retries with another model call; check the BOT connection first.'));
        retryHint.id = 'obgs-model-retry-hint';
        host.appendChild(retryHint);
      }
    }
    host.appendChild(renderRulesNote(hall.game));
    if (pendingModelHallId === String(hall.id)) host.appendChild(renderModelConfirm(hall));
    if (replayOpen) host.appendChild(renderReplayPanel(hall));
    var table = replayOpen ? replayData && replayData.table : hall.table;
    var messages = replayOpen ? replayData && replayData.messages : hall.messages;
    var result = replayOpen ? replayData && replayData.result : hall.result;
    if (!result && table && table.result) result = table.result;
    if (replayOpen && !replayData) {
      host.appendChild(node('p', 'obgs-loading', tr('正在读取回放…', 'Loading replay…')));
      return;
    }
    var socialLayout = node('div', 'obgs-table-social-layout');
    socialLayout.dataset.gsChatState = chatPanelState;
    var gameColumn = node('div', 'obgs-game-column');
    if (replayOpen && replayData && !replayData.table) {
      gameColumn.appendChild(node('p', 'obgs-empty-note', tr('这个回合没有可显示的公开牌桌快照。', 'No public table snapshot is available for this turn.')));
    } else if (!table) {
      var waiting = node('div', 'obgs-empty-state obgs-table-empty');
      append(waiting, node('h4', '', hall.status === 'running' ? tr('牌局正在准备', 'Preparing the table') : tr('牌局尚未开始', 'Table has not started')));
      append(waiting, node('p', '', hall.status === 'running'
        ? tr('等待本机牌局状态更新。', 'Waiting for the local table state.')
        : tr('开始后会显示当前座位、手牌数量与牌局事件。', 'Seats, hand counts, and table events appear after the game starts.')));
      gameColumn.appendChild(waiting);
    } else {
      gameColumn.appendChild(renderBoard(hall, table, result, replayOpen));
    }
    if (messages && messages.length) gameColumn.appendChild(renderMessages(messages));
    socialLayout.appendChild(gameColumn);
    if (!replayOpen) socialLayout.appendChild(renderChatPanel(String(hall.spaceId), hall));
    host.appendChild(socialLayout);
  }

  function renderChatPanel(spaceId, hall) {
    var channel = hall ? activeChatChannel : 'lobby';
    var hallId = hall ? String(hall.id) : '';
    var scopeId = channel === 'table' ? hallId : String(spaceId || '');
    var scopeKey = chatScopeKey(channel, spaceId, hallId);
    var messages = chatScopeMessages(channel, spaceId, hallId);
    var savedScroll = chatScrollState[scopeKey];
    // A newly opened chat and a chat already following the latest message both
    // start at the bottom. Mark those messages read before building the badges
    // so the unread action cannot flash for a frame while scroll is restored.
    if (isChatPanelVisible() && channel === activeChatChannel && (!savedScroll || savedScroll.stickToBottom)) {
      markChatRead(channel, String(spaceId || ''), hallId, messages);
    }
    var limits = state && state.chat && state.chat.limits ? state.chat.limits : {};
    var maxText = Number(channel === 'table' ? limits.humanText : limits.humanText) || 280;
    var disabledReason = !hall && channel === 'table' ? tr('先选择一张牌桌。', 'Select a table first.')
      : channel === 'table' && hall && hall.communication !== 'table-talk' ? tr('本桌为安静对局，未开放聊天。', 'Chat is disabled for this quiet table.') : '';
    var panel = node('aside', 'obgs-chat-panel');
    panel.id = 'obgs-chat-panel';
    panel.setAttribute('aria-label', tr('游戏聊天', 'Game chat'));
    var tabs = node('nav', 'obgs-chat-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', tr('聊天频道', 'Chat channels'));
    [
      { id: 'table', label: tr('牌桌', 'Table'), disabled: !hall },
      { id: 'lobby', label: tr('大厅', 'Lobby'), disabled: false }
    ].forEach(function (entry) {
      var tab = button('', 'select-chat-channel', 'obgs-chat-tab' + (channel === entry.id ? ' is-selected' : ''), entry.disabled);
      tab.id = entry.id === 'table' ? 'obgs-chat-channel-table' : 'obgs-chat-channel-lobby';
      tab.dataset.gsChatChannel = entry.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', channel === entry.id ? 'true' : 'false');
      tab.setAttribute('tabindex', channel === entry.id ? '0' : '-1');
      setFocusKey(tab, 'chat-tab-' + entry.id);
      append(tab, node('span', '', entry.label));
      var badge = node('span', 'obgs-chat-unread');
      var unread = hall || entry.id === 'lobby' ? unreadCount(entry.id, String(spaceId || ''), hallId) : 0;
      badge.textContent = unread ? String(unread) : '';
      badge.hidden = !unread;
      badge.setAttribute('aria-hidden', 'true');
      tab.appendChild(badge);
      tabs.appendChild(tab);
    });
    panel.appendChild(tabs);

    var log = node('ol', 'obgs-chat-log');
    log.id = 'obgs-chat-log';
    log.setAttribute('aria-label', channel === 'table' ? tr('牌桌聊天记录', 'Table chat history') : tr('大厅聊天记录', 'Lobby chat history'));
    log.dataset.gsChatChannel = channel;
    log.dataset.gsChatScopeKey = scopeKey;
    log.dataset.gsChatSpaceId = String(spaceId || '');
    log.dataset.gsChatHallId = hallId;
    var visibleMessages = messages.slice(-200);
    if (!visibleMessages.length) {
      var empty = node('li', 'obgs-chat-empty', disabledReason || (channel === 'table'
        ? tr('牌桌里还没有聊天。', 'No one has chatted at this table yet.')
        : tr('大厅里还没有聊天。', 'No one has chatted in this lobby yet.')));
      log.appendChild(empty);
    } else {
      visibleMessages.forEach(function (message) {
        var row = node('li', 'obgs-chat-message');
        row.dataset.gsChatMessageId = String(message.id);
        row.dataset.gsChatSenderId = String(message.sender.id);
        row.dataset.gsChatSenderSource = String(message.sender.source || '');
        row.dataset.gsChatSenderKind = String(message.sender.kind || '');
        row.tabIndex = -1;
        var author = node('div', 'obgs-chat-author');
        append(author, node('strong', 'obgs-chat-name', chatSenderName(message.sender)));
        var senderKind = chatSenderKind(message.sender);
        if (senderKind) append(author, node('span', 'obgs-chat-kind', senderKind));
        append(row, author);
        append(row, node('p', 'obgs-chat-text', message.text));
        log.appendChild(row);
      });
    }
    panel.appendChild(log);

    var unread = unreadCount(channel, String(spaceId || ''), hallId);
    if (unread) {
      var latest = button(tr('{count} 条新消息 · 回到最新', '{count} new messages · Jump to latest', { count: unread }), 'chat-latest', 'obgs-chat-latest');
      latest.setAttribute('aria-label', tr('滚动到最新聊天消息', 'Scroll to the latest chat message'));
      panel.appendChild(latest);
    }

    var quick = node('div', 'obgs-chat-quick');
    quick.setAttribute('aria-label', tr('快捷短句', 'Quick phrases'));
    [
      tr('这手打得漂亮！', 'Nice move!'),
      tr('轮到你啦', 'Your turn.'),
      tr('慢慢来，稳住。', 'Take your time.')
    ].forEach(function (entry, index) {
      var phrase = button(entry, 'quick-chat', 'obgs-chat-phrase', Boolean(disabledReason || chatPending[scopeKey]));
      phrase.dataset.gsQuickText = entry;
      phrase.dataset.gsChatIndex = String(index);
      quick.appendChild(phrase);
    });
    panel.appendChild(quick);

    var form = node('form', 'obgs-chat-composer-form');
    form.dataset.gsChatForm = 'true';
    form.dataset.gsChatScopeKey = scopeKey;
    var composerLabel = node('label', 'obgs-chat-composer-label', tr('发送消息', 'Message'));
    composerLabel.htmlFor = 'obgs-chat-composer';
    form.appendChild(composerLabel);
    var composerRow = node('div', 'obgs-chat-composer-row');
    var composer = node('textarea', 'obgs-chat-composer');
    composer.id = 'obgs-chat-composer';
    composer.rows = 2;
    composer.value = chatDrafts[scopeKey] || '';
    composer.maxLength = maxText * 2;
    composer.disabled = Boolean(disabledReason || chatPending[scopeKey]);
    composer.placeholder = disabledReason || tr('说点什么…', 'Say something…');
    composer.setAttribute('aria-label', channel === 'table' ? tr('发送牌桌消息', 'Send a table message') : tr('发送大厅消息', 'Send a lobby message'));
    composer.dataset.gsChatComposer = 'true';
    composer.dataset.gsChatScopeKey = scopeKey;
    composer.dataset.gsChatChannel = channel;
    setFocusKey(composer, 'chat-composer-' + scopeKey);
    composerRow.appendChild(composer);
    var send = node('button', 'obgs-primary obgs-chat-send', chatPending[scopeKey] ? tr('发送中…', 'Sending…') : tr('发送', 'Send'));
    send.id = 'obgs-chat-send';
    send.type = 'submit';
    send.disabled = Boolean(disabledReason || chatPending[scopeKey] || !String(composer.value).trim() || chatTextLength(composer.value) > maxText);
    setFocusKey(send, 'chat-send-' + scopeKey);
    composerRow.appendChild(send);
    form.appendChild(composerRow);
    var composerFooter = node('div', 'obgs-chat-composer-footer');
    var count = node('span', 'obgs-chat-count' + (chatTextLength(composer.value) > maxText ? ' is-over-limit' : ''), chatTextLength(composer.value) + ' / ' + maxText);
    count.dataset.gsChatCount = 'true';
    composerFooter.appendChild(count);
    if (disabledReason) append(composerFooter, node('span', 'obgs-chat-disabled-note', disabledReason));
    else append(composerFooter, node('span', 'obgs-chat-limit-note', tr('最多 {count} 个字符', 'Up to {count} characters', { count: maxText })));
    form.appendChild(composerFooter);
    if (chatPending[scopeKey]) append(form, node('p', 'obgs-chat-status', tr('正在发送…', 'Sending…')));
    if (chatErrors[scopeKey]) {
      var error = node('div', 'obgs-chat-error');
      error.setAttribute('role', 'alert');
      append(error, node('span', '', chatErrors[scopeKey]));
      var retry = button(tr('重试', 'Retry'), 'retry-chat', 'obgs-text-button');
      retry.dataset.gsChatScopeKey = scopeKey;
      retry.disabled = Boolean(chatPending[scopeKey]);
      error.appendChild(retry);
      form.appendChild(error);
    }
    panel.appendChild(form);
    return panel;
  }

  function chatSenderKind(sender) {
    if (!sender || sender.kind === 'human' || (state && state.chat && state.chat.self && sender.id === state.chat.self.id)) return '';
    if (sender.source === 'model') return tr('模型', 'Model');
    if (sender.source === 'rules') return tr('预设台词', 'Preset line');
    return tr('BOT', 'BOT');
  }

  function chatSenderName(sender) {
    if (!sender) return tr('未知 BOT', 'Unknown BOT');
    if (sender.kind === 'human' || (state && state.chat && state.chat.self && sender.id === state.chat.self.id)) return tr('我', 'Me');
    return sender.name || botLabel(sender.id);
  }

  function renderChatToggle() {
    var buttonNode = button('', 'toggle-chat', 'obgs-text-button obgs-chat-toggle');
    buttonNode.id = 'obgs-chat-toggle';
    buttonNode.setAttribute('aria-expanded', isChatPanelVisible() ? 'true' : 'false');
    setFocusKey(buttonNode, 'chat-toggle');
    append(buttonNode, node('span', '', isChatPanelVisible() ? tr('收起聊天', 'Hide chat') : tr('打开聊天', 'Open chat')));
    var space = selectedSpace();
    var hall = selectedHall();
    var count = node('span', 'obgs-chat-toggle-count');
    count.textContent = String((hall ? unreadCount('table', String(space && space.id || ''), String(hall.id)) : 0)
      + (space ? unreadCount('lobby', String(space.id), '') : 0));
    count.hidden = count.textContent === '0';
    buttonNode.appendChild(count);
    return buttonNode;
  }

  function recentTableSpeech(hall, table, isReplay) {
    var messagesByBot = Object.create(null);
    if (!hall || !table || isReplay || hall.status === 'finished' || hall.communication !== 'table-talk') {
      if (speechRefreshTimer) root.clearTimeout(speechRefreshTimer);
      speechRefreshTimer = null;
      return messagesByBot;
    }
    var rounds = Array.isArray(hall.rounds) ? hall.rounds : [];
    var currentRound = rounds.length ? rounds[rounds.length - 1] : null;
    var roundId = String(currentRound && currentRound.id !== undefined ? currentRound.id : table.roundId || '');
    if (!roundId) return messagesByBot;
    var ids = Array.isArray(hall.botIds) ? hall.botIds.map(String)
      : (Array.isArray(table.players) ? table.players.map(function (player) { return String(player.botId); }) : []);
    var now = Date.now();
    var nearestExpiry = 0;
    chatMessages('table', hall.id).forEach(function (message) {
      var createdAt = Number(message.createdAt);
      var senderId = String(message.sender.id);
      if (message.sender.kind !== 'bot' || ids.indexOf(senderId) < 0 || String(message.roundId || '') !== roundId
        || !Number.isFinite(createdAt) || createdAt <= chatOpenedAt || createdAt > now || now - createdAt >= 7000) return;
      if (!messagesByBot[senderId] || Number(messagesByBot[senderId].createdAt) < createdAt) messagesByBot[senderId] = message;
      var expiry = createdAt + 7000;
      if (!nearestExpiry || expiry < nearestExpiry) nearestExpiry = expiry;
    });
    if (speechRefreshTimer) root.clearTimeout(speechRefreshTimer);
    speechRefreshTimer = nearestExpiry
      ? root.setTimeout(function () { speechRefreshTimer = null; if (isOpen) render(); }, Math.max(20, nearestExpiry - now + 20))
      : null;
    return messagesByBot;
  }

  function renderViewerPicker(hall) {
    var ids = Array.isArray(hall.botIds) ? hall.botIds.map(String) : [];
    if (!ids.length) return node('div', 'obgs-viewer-control');
    var wrap = node('div', 'obgs-viewer-control');
    var label = node('label', '', tr('观战视角', 'View as'));
    label.htmlFor = 'obgs-view-bot';
    var select = node('select', 'obgs-viewer-select');
    select.id = 'obgs-view-bot';
    select.dataset.gsViewBot = 'true';
    select.setAttribute('aria-label', tr('观战视角', 'View as'));
    setFocusKey(select, 'view-bot');
    ids.forEach(function (id) {
      var option = node('option', '', botLabel(id));
      option.value = id;
      select.appendChild(option);
    });
    select.value = ensureViewerBot(hall);
    wrap.appendChild(label);
    wrap.appendChild(select);
    return wrap;
  }

  function hallAction(hall) {
    var status = String(hall.status || 'waiting');
    var active = status === 'running';
    var paused = status === 'paused';
    var finished = status === 'finished';
    var action, label, style;
    if (active) {
      action = 'pause'; label = tr('暂停', 'Pause'); style = 'obgs-secondary';
    } else if (finished) {
      action = 'new-round'; label = tr('新一局', 'New round'); style = 'obgs-primary';
    } else if (paused) {
      action = 'resume'; label = tr('继续', 'Resume'); style = 'obgs-primary';
    } else {
      action = 'start'; label = hall.controller === 'model' ? tr('开始并调用模型', 'Start with model calls') : tr('开始对局', 'Start table'); style = 'obgs-primary';
    }
    var actionDisabled = action === 'pause'
      ? pauseAction || (buttonBusy() && busyAction !== 'step') || replayOpen
      : buttonBusy() || replayOpen;
    var item = button(label, action, style, actionDisabled);
    item.id = action === 'pause' ? 'obgs-hall-pause'
      : action === 'new-round' ? 'obgs-hall-new-round'
        : 'obgs-hall-primary-action';
    setFocusKey(item, 'hall-primary-action');
    if (hall.controller === 'model' && (status === 'waiting' || paused)) {
      item.setAttribute('aria-describedby', 'obgs-model-call-note');
    }
    var wrap = node('div', 'obgs-action-group');
    wrap.appendChild(item);
    if (paused) {
      var step = button(hall.controller === 'model' ? tr('单步调用模型', 'Step with model') : tr('单步', 'Step'), 'step', 'obgs-secondary', buttonBusy() || replayOpen);
      step.id = 'obgs-hall-step';
      setFocusKey(step, 'hall-step');
      wrap.appendChild(step);
    }
    return wrap;
  }

  function renderRulesNote(game) {
    var note = node('details', 'obgs-rules-note');
    var summary = node('summary', '', tr('本局规则范围', 'Rules for this table'));
    note.appendChild(summary);
    var meta = gameMeta(game);
    var text = meta ? tr(meta.summary, meta.summaryEn) : tr('这款游戏的规则摘要暂不可用。', 'No rules summary is registered for this game.');
    append(note, node('p', 'obgs-rules-copy', text));
    return note;
  }

  function renderModelConfirm(hall) {
    var box = node('section', 'obgs-model-confirm');
    append(box, node('p', '', tr('启动这张牌局会调用 BOT 模型，并可能产生模型用量。', 'Starting this table calls BOT models and may use your model quota.')));
    var actions = node('div', 'obgs-model-confirm-actions');
    var confirm = button(tr('确认并启动', 'Confirm and start'), 'confirm-model-start', 'obgs-primary', buttonBusy());
    confirm.id = 'obgs-model-confirm-start';
    append(actions, confirm);
    append(actions, button(tr('取消', 'Cancel'), 'cancel-model-start', 'obgs-text-button', buttonBusy()));
    box.appendChild(actions);
    return box;
  }

  function renderReplayPanel(hall) {
    var panel = node('section', 'obgs-replay-panel');
    var tools = node('div', 'obgs-replay-tools');
    var label = node('label', '', tr('回合', 'Round'));
    label.htmlFor = 'obgs-replay-round';
    var select = node('select', '');
    select.id = 'obgs-replay-round';
    select.dataset.gsReplayRound = 'true';
    setFocusKey(select, 'replay-round');
    var rounds = Array.isArray(hall.rounds) ? hall.rounds : [];
    rounds.forEach(function (round, index) {
      var option = node('option', '', tr('第 {number} 局 · {game}', 'Round {number} · {game}', { number: index + 1, game: gameLabel(round.game || hall.game) }));
      option.value = String(round.id);
      select.appendChild(option);
    });
    if (!replayRoundId && rounds.length) replayRoundId = String(rounds[rounds.length - 1].id);
    select.value = replayRoundId;
    tools.appendChild(label);
    tools.appendChild(select);
    var rangeLabel = node('label', '', tr('回合进度', 'Turn'));
    rangeLabel.htmlFor = 'obgs-replay-turn';
    var range = node('input', 'obgs-replay-range');
    range.id = 'obgs-replay-turn';
    range.type = 'range';
    range.min = '0';
    var round = rounds.find(function (item) { return String(item.id) === String(replayRoundId); }) || rounds[rounds.length - 1];
    var total = replayData && Number.isFinite(Number(replayData.total)) ? Number(replayData.total) : roundTurnCount(round);
    range.max = String(Math.max(0, total));
    range.value = String(Math.min(replayTurn, Math.max(0, total)));
    range.dataset.gsReplayTurn = 'true';
    setFocusKey(range, 'replay-turn');
    var turnCount = node('span', 'obgs-replay-count', tr('{turn} / {total}', '{turn} / {total}', { turn: replayTurn, total: Math.max(0, total) }));
    tools.appendChild(rangeLabel);
    tools.appendChild(range);
    tools.appendChild(turnCount);
    panel.appendChild(tools);
    return panel;
  }

  function roundTurnCount(round) {
    if (!round) return 0;
    if (Array.isArray(round.turns)) return round.turns.length;
    var n = Number(round.turns);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function renderBoard(hall, table, result, isReplay, isPublicSpectator) {
    var section = node('section', 'obgs-board');
    var currentId = value(table.currentBotId);
    var currentBot = botById(currentId);
    var summary = node('div', 'obgs-board-summary');
    var turnCopy = node('div', 'obgs-turn-copy');
    turnCopy.setAttribute('role', 'status');
    turnCopy.setAttribute('aria-live', 'polite');
    append(turnCopy, node('span', 'obgs-turn-label', isReplay ? tr('回放视图', 'Replay') : tr('当前回合', 'Current turn')));
    append(turnCopy, node('strong', 'obgs-turn-name', currentBot ? botName(currentBot) : currentId ? botLabel(currentId) : result ? tr('本局已结束', 'Round finished') : tr('等待首轮出牌', 'Waiting for the first move')));
    append(turnCopy, node('span', 'obgs-turn-meta', tr('第 {turn} 手 · {phase}', 'Turn {turn} · {phase}', { turn: Number(table.turn) || 0, phase: phaseLabel(table.phase) })));
    summary.appendChild(turnCopy);
    var extra = node('div', 'obgs-board-extra');
    if (hall.game === 'mahjong' && table.wallRemaining !== undefined) append(extra, node('span', '', tr('牌墙剩余 {count}', '{count} tiles left', { count: Number(table.wallRemaining) || 0 })));
    if (hall.game === 'sealed-bid' && table.lot) {
      append(extra, node('span', '', tr('藏品 {index} / {total}', 'Lot {index} / {total}', { index: Number(table.lot.index) + 1, total: Number(table.lot.total) || 8 })));
      append(extra, node('span', '', tr('已成交 {count}', '{count} sold', { count: Array.isArray(table.awards) ? table.awards.length : 0 })));
    }
    summary.appendChild(extra);
    section.appendChild(summary);
    // Doudizhu's three-seat table is tall; put its compact winner and score
    // strip before the board so a finished result is visible without scrolling.
    if (hall.game === 'doudizhu' && result) {
      var resultSummary = renderResult(result);
      resultSummary.classList.add('is-compact');
      section.appendChild(resultSummary);
    }

    var players = Array.isArray(table.players) ? table.players : [];
    var speechByBot = recentTableSpeech(hall, table, isReplay);
    var tableMessages = chatScopeMessages('table', hall.spaceId, hall.id);
    function seatOptions(player, extra) {
      var id = String(player && player.botId !== undefined ? player.botId : '');
      var options = Object.assign({
        speech: speechByBot[id] || null,
        hasChat: !isReplay && tableMessages.some(function (message) { return message.sender.id === id; }),
        hasSpeechSlot: !isReplay && hall.status !== 'finished' && hall.communication !== 'silent' && tableMessages.some(function (message) {
          return message.sender.kind === 'bot' && message.sender.id === id;
        }),
        isReplay: isReplay,
        tableId: String(hall.id),
        spaceId: String(hall.spaceId)
      }, extra || {});
      return options;
    }
    if (hall.game === 'sealed-bid') {
      section.appendChild(renderSealedBidTable(hall, table, players, currentId, result, seatOptions));
      if (result) section.appendChild(renderResult(result));
      return section;
    }
    if (hall.game === 'doudizhu') {
      section.appendChild(renderDoudizhuTable(hall, table, players, currentId, result, isPublicSpectator, seatOptions));
      return section;
    }
    if (hall.game === 'rails' && root.OpenBotGameRails && typeof root.OpenBotGameRails.render === 'function') {
      var railsTable = Object.assign({}, table);
      var railsViewerId = isPublicSpectator ? '' : String(hall.viewBotId || '');
      if (result) railsTable.result = result;
      if (isPublicSpectator || (!result && (!railsViewerId || railsViewerId !== String(table.currentBotId || '')))) delete railsTable.offer;
      root.OpenBotGameRails.render(section, {
        table: railsTable,
        result: result,
        viewBotId: railsViewerId,
        isPublicSpectator: Boolean(isPublicSpectator),
        helpers: { botById: botById, botName: botName, botLabel: botLabel, avatar: avatar }
      });
      if (result) section.appendChild(renderResult(result));
      return section;
    }
    if (hall.game === 'tycoon' && root.OpenBotGameTycoon && typeof root.OpenBotGameTycoon.render === 'function') {
      root.OpenBotGameTycoon.render(section, {
        table: table,
        result: result,
        viewBotId: isPublicSpectator ? '' : String(hall.viewBotId || ''),
        isPublicSpectator: Boolean(isPublicSpectator),
        helpers: { botById: botById, botName: botName, botLabel: botLabel, avatar: avatar }
      });
      if (result) section.appendChild(renderResult(result));
      return section;
    }
    if (hall.game === 'caravan') {
      section.appendChild(renderCaravanTable(hall, table, players, currentId, result, Boolean(isPublicSpectator)));
      if (result) section.appendChild(renderResult(result));
      return section;
    }
    if (hall.game === 'lantern-watch') {
      section.appendChild(renderLanternWatchTable(hall, table, players, currentId, result, Boolean(isPublicSpectator)));
      if (result) section.appendChild(renderResult(result));
      return section;
    }
    var seats = node('div', 'obgs-seats');
    seats.setAttribute('aria-label', tr('牌桌座位', 'Table seats'));
    players.forEach(function (player, index) {
      var position = index % 2 === 0 ? 'left' : 'right';
      seats.appendChild(renderSeat(player, currentId, hall.game, seatOptions(player, { position: position })));
    });
    if (!players.length) append(seats, node('p', 'obgs-empty-note', tr('当前牌桌没有公开座位信息。', 'No public seat information is available.')));
    section.appendChild(seats);

    {
      var discards = Array.isArray(table.discards) ? table.discards : [];
      var discardArea = node('div', 'obgs-discard-area');
      append(discardArea, node('h4', 'obgs-subsection-title', tr('弃牌', 'Discards')));
      if (table.pending && table.pending.tile) {
        append(discardArea, node('p', 'obgs-pending-tile', tr('{name} 打出 {tile}，等待回应', '{name} played {tile}; waiting for responses', { name: botLabel(table.pending.botId), tile: value(table.pending.tile) })));
      }
      if (discards.length) {
        var discardList = node('div', 'obgs-discard-list');
        discards.forEach(function (discard) {
          var piece = node('span', 'obgs-discard-piece');
          append(piece, node('span', 'obgs-discard-owner', botLabel(discard.botId)));
          append(piece, renderPiece(value(discard.tile, '—'), 'tiles'));
          discardList.appendChild(piece);
        });
        discardArea.appendChild(discardList);
      } else append(discardArea, node('p', 'obgs-quiet', tr('还没有弃牌。', 'No tiles have been discarded.')));
      section.appendChild(discardArea);
    }
    if (result) section.appendChild(renderResult(result));
    return section;
  }

  // 灯塔守夜牌桌：四座塔按真实方位（北/东/南/西）排布，灯罩叠在塔身上，
  // 风暴落在塔顶。守夜人席位、各家得分与上一轮结算都放在牌桌周围。
  function renderLanternWatchTable(hall, table, players, currentId, result, isPublicSpectator) {
    var board = node('div', 'obgs-lw-table');
    board.id = 'obgs-lantern-watch-board';
    board.setAttribute('aria-label', tr('灯塔守夜牌桌', 'Lantern Watch table'));
    var english = spectatorLanguage ? spectatorLanguage === 'en' : Boolean(root.OpenBotI18n && root.OpenBotI18n.locale === 'en');
    function towerLabel(tower) { return english && tower.labelEn ? tower.labelEn : tower.label; }
    var towers = Array.isArray(table.towers) ? table.towers : [];
    var candidates = Array.isArray(table.candidates) ? table.candidates : [];
    if (!towers.length) {
      append(board, node('p', 'obgs-empty-note', tr('当前牌桌没有灯塔信息。', 'No tower information is available.')));
      return board;
    }
    var neededByTower = {};
    candidates.forEach(function (candidate) { neededByTower[candidate.tower] = candidate.needed; });
    var counts = Array.isArray(table.lampCounts) && (!isPublicSpectator || result) ? table.lampCounts : null;

    var field = node('div', 'obgs-lw-field');
    field.setAttribute('aria-label', tr('四座灯塔', 'The four towers'));
    // 塔按方位排布：北在上、东在右、南在下、西在左。
    var layout = { north: 'is-north', east: 'is-east', south: 'is-south', west: 'is-west' };
    towers.forEach(function (tower) {
      var cell = node('div', 'obgs-lw-tower ' + (layout[tower.id] || ''));
      cell.dataset.gsTower = String(tower.index);
      var isCandidate = tower.isCandidate;
      if (isCandidate) cell.classList.add('is-candidate');
      var art = node('div', 'obgs-lw-tower-art');
      var img = node('img', 'obgs-lw-tower-img');
      img.src = 'assets/game/towers/' + tower.id + '.svg';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.decoding = 'async';
      art.appendChild(img);
      // 风暴落在塔顶：结算后公开，未结算时不显示。
      if (result && table.lastRound && table.lastRound.stormTower === tower.index) {
        var storm = node('img', 'obgs-lw-storm');
        storm.src = 'assets/game/towers/storm.svg';
        storm.alt = tr('风暴', 'Storm');
        art.appendChild(storm);
      }
      cell.appendChild(art);

      var lamps = node('div', 'obgs-lw-lamps');
      lamps.setAttribute('aria-label', tr('{name} 上的灯', 'Lamps on {name}', { name: towerLabel(tower) }));
      var lampCount = counts ? Number(counts[tower.index]) || 0 : null;
      if (lampCount === null) {
        // 未结算时各塔灯数是私有的，只对候选塔显示所需灯数——
        // 非候选塔这一轮不可能落风暴，没有「需要几盏」这回事。
        var neededHere = Number(neededByTower[tower.index]) || 0;
        if (neededHere) append(lamps, node('span', 'obgs-lw-needed', tr('需 {n} 盏', '{n} needed', { n: neededHere })));
        else append(lamps, node('span', 'obgs-lw-quiet', tr('本轮无风暴', 'No storm')));
      } else {
        for (var i = 0; i < lampCount; i++) {
          var lamp = node('img', 'obgs-lw-lamp');
          lamp.src = 'assets/game/towers/lamp.svg';
          lamp.alt = tr('灯', 'Lamp');
          lamp.setAttribute('aria-hidden', 'true');
          lamps.appendChild(lamp);
        }
        if (!lampCount) append(lamps, node('span', 'obgs-lw-quiet', tr('无灯', 'No lamps')));
        var needed = Number(neededByTower[tower.index]) || 0;
        if (needed) {
          var ok = lampCount >= needed;
          append(lamps, node('span', 'obgs-lw-needed' + (ok ? ' is-held' : ''), tr('需 {n} 盏', '· {n} needed', { n: needed })));
        }
      }
      cell.appendChild(lamps);
      append(cell, node('span', 'obgs-lw-tower-name', towerLabel(tower)));
      field.appendChild(cell);
    });
    board.appendChild(field);

    // 各家得分与守夜人身份。
    var seats = node('div', 'obgs-lw-seats');
    seats.setAttribute('aria-label', tr('各席位', 'Seats'));
    players.forEach(function (player) {
      var entry = node('div', 'obgs-lw-seat' + (String(player.botId) === String(currentId) ? ' is-current' : ''));
      if (String(player.botId) === String(currentId)) entry.setAttribute('aria-current', 'true');
      var face = node('span', 'obgs-seat-avatar');
      avatar(face, botById(player.botId), 'mini');
      entry.appendChild(face);
      var name = node('span', 'obgs-lw-seat-name', botLabel(player.botId));
      entry.appendChild(name);
      append(entry, node('span', 'obgs-lw-seat-score', tr('{n} 分', '{n} pts', { n: Number(player.score) || 0 })));
      if (player.isWatchman) entry.appendChild(node('span', 'obgs-lw-watchman', tr('守夜人', 'Watchman')));
      if (player.deployed) entry.appendChild(node('span', 'obgs-lw-deployed', tr('已布防', 'Deployed')));
      seats.appendChild(entry);
    });
    board.appendChild(seats);

    // 上一轮结算。
    if (table.lastRound) {
      var last = node('div', 'obgs-lw-last');
      append(last, node('h4', 'obgs-subsection-title', tr('上一轮', 'Last round')));
      append(last, node('p', 'obgs-quiet', table.lastRound.held
        ? tr('风暴落在{place}，被守住了。', 'The storm hit {place} and was held.', { place: english ? (table.lastRound.stormTowerLabelEn || table.lastRound.stormTowerLabel) : table.lastRound.stormTowerLabel })
        : tr('风暴落在{place}，没守住。', 'The storm hit {place} and got through.', { place: english ? (table.lastRound.stormTowerLabelEn || table.lastRound.stormTowerLabel) : table.lastRound.stormTowerLabel })));
      board.appendChild(last);
    }
    return board;
  }

  function renderDoudizhuTable(hall, table, players, currentId, result, isPublicSpectator, seatOptions) {
    var board = node('div', 'obgs-dz-table');
    board.id = 'obgs-doudizhu-board';
    board.setAttribute('aria-label', tr('斗地主三方牌桌', 'Three-player Doudizhu table'));
    var ordered = [];
    var ids = Array.isArray(hall.botIds) ? hall.botIds.map(String) : players.map(function (player) { return String(player.botId); });
    ids.forEach(function (id) {
      var player = players.find(function (item) { return String(item.botId) === id; });
      if (player) ordered.push(player);
    });
    players.forEach(function (player) {
      if (!ordered.some(function (item) { return String(item.botId) === String(player.botId); })) ordered.push(player);
    });
    if (!ordered.length) {
      append(board, node('p', 'obgs-empty-note', tr('当前牌桌没有公开座位信息。', 'No public seat information is available.')));
      return board;
    }
    var viewerId = isPublicSpectator ? '' : ensureViewerBot(hall);
    var viewerIndex = isPublicSpectator ? 0 : ordered.findIndex(function (player) { return String(player.botId) === viewerId; });
    if (viewerIndex < 0) viewerIndex = 0;
    var leftPlayer = ordered[(viewerIndex + 1) % ordered.length];
    var rightPlayer = ordered[(viewerIndex + 2) % ordered.length];
    var ownPlayer = ordered[viewerIndex];
    var leftOptions = seatOptions(leftPlayer, { position: 'left', revealHand: Boolean(result) });
    var rightOptions = seatOptions(rightPlayer, { position: 'right', revealHand: Boolean(result) });
    var ownOptions = seatOptions(ownPlayer, { position: 'bottom', isViewer: true, revealHand: true });
    if (leftOptions.speech || rightOptions.speech) {
      board.classList.add('has-top-speech', 'has-side-speech');
    }
    var top = node('div', 'obgs-dz-top');
    top.appendChild(renderSeat(leftPlayer, currentId, 'doudizhu', leftOptions));

    var center = node('section', 'obgs-dz-center');
    if (leftOptions.speech || rightOptions.speech) center.classList.add('has-side-speech');
    center.setAttribute('aria-label', tr('底牌与最近出牌', 'Bottom cards and last play'));
    var centerHead = node('div', 'obgs-dz-center-head');
    var bottom = node('div', 'obgs-dz-bottom-cards');
    append(bottom, node('h4', 'obgs-subsection-title', tr('底牌', 'Bottom cards')));
    if (Array.isArray(table.bottom) && table.bottom.length) {
      var bottomRow = renderCardRow(table.bottom, 'cards');
      bottomRow.classList.add('obgs-dz-center-cards');
      bottom.appendChild(bottomRow);
    } else append(bottom, node('p', 'obgs-quiet', tr('叫分结束后显示。', 'Shown after bidding.')));
    centerHead.appendChild(bottom);
    var multiplier = node('div', 'obgs-dz-multiplier');
    append(multiplier, node('span', '', tr('倍数', 'Multiplier')));
    append(multiplier, node('strong', '', String(Math.max(1, Number(table.multiplier) || 1)) + '×'));
    centerHead.appendChild(multiplier);
    center.appendChild(centerHead);

    var bids = Array.isArray(table.bids) ? table.bids : [];
    if (bids.length) {
      var bidLine = node('div', 'obgs-dz-bids');
      bidLine.setAttribute('aria-label', tr('叫分', 'Bids'));
      bids.forEach(function (bid) {
        var entry = node('span', 'obgs-dz-bid');
        append(entry, node('strong', '', botLabel(bid.botId)));
        append(entry, node('span', '', Number(bid.amount) ? tr('{amount} 分', '{amount}', { amount: bid.amount }) : tr('不叫', 'Pass')));
        bidLine.appendChild(entry);
      });
      center.appendChild(bidLine);
    }

    var play = node('div', 'obgs-dz-last-play');
    if (table.lastPlay && Array.isArray(table.lastPlay.cards) && table.lastPlay.cards.length) {
      var playHead = node('div', 'obgs-play-head');
      append(playHead, node('span', '', botLabel(table.lastPlay.botId)));
      append(playHead, node('span', 'obgs-play-pattern', patternLabel(table.lastPlay.label)));
      play.appendChild(playHead);
      var playRow = renderCardRow(table.lastPlay.cards, 'cards');
      playRow.classList.add('obgs-dz-play-cards');
      play.appendChild(playRow);
    } else {
      append(play, node('h4', 'obgs-subsection-title', tr('最近出牌', 'Last play')));
      append(play, node('p', 'obgs-quiet', tr('还没有出牌。', 'No cards have been played yet.')));
    }
    center.appendChild(play);
    top.appendChild(center);
    top.appendChild(renderSeat(rightPlayer, currentId, 'doudizhu', rightOptions));
    board.appendChild(top);

    var bottomSeat = node('div', 'obgs-dz-bottom-seat');
    bottomSeat.appendChild(renderSeat(ownPlayer, currentId, 'doudizhu', ownOptions));
    board.appendChild(bottomSeat);
    return board;
  }

  function auctionPositions(count) {
    return ({
      2: ['top-center'],
      3: ['left', 'right'],
      4: ['left', 'top-center', 'right'],
      5: ['left', 'top-left', 'top-right', 'right'],
      6: ['left', 'top-left', 'top-center', 'top-right', 'right']
    })[count] || ['left', 'top-left', 'top-center', 'top-right', 'right'];
  }

  function renderSealedBidTable(hall, table, players, currentId, result, seatOptions) {
    var board = node('div', 'obgs-sb-table');
    board.id = 'obgs-sealed-bid-board';
    board.setAttribute('aria-label', tr('暗标拍卖会牌桌', 'Sealed-bid auction table'));
    var ids = Array.isArray(hall.botIds) ? hall.botIds.map(String) : players.map(function (player) { return String(player.botId); });
    var ordered = [];
    ids.forEach(function (id) {
      var player = players.find(function (item) { return String(item.botId) === id; });
      if (player) ordered.push(player);
    });
    players.forEach(function (player) {
      if (!ordered.some(function (item) { return String(item.botId) === String(player.botId); })) ordered.push(player);
    });
    if (!ordered.length) {
      append(board, node('p', 'obgs-empty-note', tr('当前牌桌没有公开座位信息。', 'No public seat information is available.')));
      return board;
    }
    var viewerId = ensureViewerBot(hall);
    var viewerIndex = ordered.findIndex(function (player) { return String(player.botId) === String(viewerId); });
    if (viewerIndex < 0) viewerIndex = 0;
    var pose = auctionPositions(ordered.length);
    var others = [];
    for (var step = 1; step < ordered.length; step++) others.push(ordered[(viewerIndex + step) % ordered.length]);
    var grid = node('div', 'obgs-sb-grid');
    var placed = {};
    others.forEach(function (player, index) {
      var position = pose[index] || pose[pose.length - 1];
      placed[position] = true;
      grid.appendChild(renderAuctionSeat(player, currentId, position, String(player.botId) === String(viewerId), table, seatOptions(player)));
    });
    var center = renderAuctionLot(table, hall);
    center.dataset.gsSeatPosition = 'center';
    grid.appendChild(center);
    var own = node('div', 'obgs-sb-bottom');
    var ownOptions = seatOptions(ordered[viewerIndex]);
    own.appendChild(renderAuctionSeat(ordered[viewerIndex], currentId, 'bottom', true, table, ownOptions));
    grid.appendChild(own);
    board.appendChild(grid);
    if (!placed['top-center'] && !placed['left'] && !placed['right']) {
      // Two-seat tables still need an opponent; ensure the ring never collapses.
      var fallbackPlayer = ordered[(viewerIndex + 1) % ordered.length];
      var fallback = renderAuctionSeat(fallbackPlayer, currentId, 'top-center', false, table, seatOptions(fallbackPlayer));
      grid.appendChild(fallback);
    }
    var awards = Array.isArray(table.awards) ? table.awards : [];
    var unsold = Array.isArray(table.unsold) ? table.unsold : [];
    var strip = node('div', 'obgs-sb-awards');
    append(strip, node('h4', 'obgs-subsection-title', tr('成交记录', 'Hammer prices')));
    if (!awards.length && !unsold.length) append(strip, node('p', 'obgs-quiet', tr('还没有藏品成交。', 'No lot has been sold yet.')));
    else {
      var list = node('div', 'obgs-sb-award-list');
      var lots = Array.isArray(table.lot && table.lot.total) ? table.lot.total : 8;
      var lotLookup = {};
      (hall.table && hall.table.players || []).forEach(function (player) {
        (Array.isArray(player.lots) ? player.lots : []).forEach(function (lot) { lotLookup[lot.name] = lot; });
      });
      awards.forEach(function (award) {
        var entry = node('span', 'obgs-sb-award');
        append(entry, node('span', 'obgs-sb-award-index', tr('第 {n} 件', 'Lot {n}', { n: Number(award.index) + 1 })));
        append(entry, node('strong', '', botLabel(award.botId)));
        append(entry, node('span', 'obgs-sb-award-price', tr('{price} 银', '{price} silver', { price: award.price })));
        list.appendChild(entry);
      });
      unsold.forEach(function (index) {
        var entry = node('span', 'obgs-sb-award is-unsold');
        append(entry, node('span', 'obgs-sb-award-index', tr('第 {n} 件', 'Lot {n}', { n: Number(index) + 1 })));
        append(entry, node('span', '', tr('流拍', 'Unsold')));
        list.appendChild(entry);
      });
      strip.appendChild(list);
    }
    board.appendChild(strip);
    return board;
  }

  function renderAuctionSeat(player, currentId, position, isViewer, table, options) {
    options = Object.assign({}, options || {}, { position: position });
    var bot = botById(player.botId);
    var seat = node('article', 'obgs-sb-seat is-position-' + position
      + (String(player.botId) === String(currentId) ? ' is-current' : '')
      + (player.passed ? ' is-out' : ''));
    if (options.hasSpeechSlot && position !== 'bottom') seat.classList.add('has-speech-slot');
    if (options.speech && String(options.speech.sender && options.speech.sender.id) === String(player.botId)) seat.classList.add('has-speech');
    seat.dataset.gsSeatPosition = position;
    if (String(player.botId) === String(currentId)) seat.setAttribute('aria-current', 'true');
    var head = node('div', 'obgs-seat-head');
    head.appendChild(renderSeatVisual(player.botId, bot, options));
    var identity = node('div', 'obgs-seat-identity');
    append(identity, node('strong', 'obgs-seat-name', bot ? botName(bot) : botLabel(player.botId)));
    var state = player.passed ? tr('已退出本件', 'Out of this lot')
      : player.highBid !== null && player.highBid !== undefined ? tr('领先 {amount} 银', 'Leading at {amount}', { amount: player.highBid })
        : tr('在场', 'Bidding');
    append(identity, node('span', 'obgs-seat-role', state));
    head.appendChild(identity);
    seat.appendChild(head);

    var stats = node('div', 'obgs-sb-stats');
    append(stats, node('span', 'obgs-sb-spent', tr('已花 {amount}', 'Spent {amount}', { amount: Number(player.spent) || 0 })));
    if (player.remaining !== undefined && player.remaining !== null) {
      append(stats, node('span', 'obgs-sb-remaining', tr('余 {amount}', '{amount} left', { amount: Number(player.remaining) || 0 })));
    }
    if (player.favorLabel) {
      append(stats, node('span', 'obgs-sb-favor', tr('偏好 {family} ×2', 'Favours {family} ×2', { family: tr(player.favorLabel, player.favorLabelEn || player.favorLabel) })));
    }
    seat.appendChild(stats);

    if (Array.isArray(player.lots) && player.lots.length) {
      var row = node('div', 'obgs-sb-lot-row');
      player.lots.slice(0, 6).forEach(function (lot) {
        var piece = renderPiece(lot.family, 'lots');
        piece.title = lot.name;
        row.appendChild(piece);
      });
      if (player.lots.length > 6) append(row, node('span', 'obgs-quiet', '+' + (player.lots.length - 6)));
      seat.appendChild(row);
    }
    return seat;
  }

  function renderAuctionLot(table, hall) {
    var center = node('section', 'obgs-sb-center');
    center.setAttribute('aria-label', tr('当前藏品', 'Current lot'));
    var lot = table.lot || null;
    var result = table.result || null;
    if (result && result.breakdown) {
      // The table itself must answer "who won": the generic result panel sits
      // below the fold on a 960px window.
      var winners = Array.isArray(result.winnerBotIds) ? result.winnerBotIds : [];
      append(center, node('h4', 'obgs-subsection-title', winners.length
        ? tr('拍卖结束 · {names} 获胜', 'Auction closed · {names} won', { names: winners.map(botLabel).join('、') })
        : tr('拍卖结束 · 无人出价', 'Auction closed · no sale')));
      var best = result.breakdown.slice().sort(function (a, b) { return b.score - a.score; });
      var top = node('ol', 'obgs-sb-breakdown');
      best.forEach(function (row) {
        var line = node('li', 'obgs-sb-breakdown-row');
        append(line, node('span', 'obgs-sb-breakdown-name', botLabel(row.botId)));
        append(line, node('span', 'obgs-sb-breakdown-favor', tr('偏好 {family}', 'Favours {family}', { family: tr(row.favorLabel || '', row.favorLabelEn || row.favorLabel || '') })));
        append(line, node('span', 'obgs-sb-breakdown-detail', tr('藏品 {value} + 组合 {bonus} · 花 {spent}/{purse}', 'Lots {value} + set {bonus} · spent {spent}/{purse}', {
          value: row.value, bonus: row.bonus, spent: row.spent, purse: row.purse
        })));
        append(line, node('strong', 'obgs-sb-breakdown-score', String(row.score)));
        top.appendChild(line);
      });
      center.appendChild(top);
      return center;
    }
    if (!lot) {
      append(center, node('p', 'obgs-quiet', tr('等待下一件藏品。', 'Waiting for the next lot.')));
      return center;
    }
    var head = node('div', 'obgs-sb-lot-head');
    append(head, node('span', 'obgs-sb-lot-index', tr('第 {index} / {total} 件', 'Lot {index} / {total}', { index: Number(lot.index) + 1, total: Number(lot.total) || 8 })));
    append(head, node('span', 'obgs-sb-lot-family', tr(lot.familyLabel, lot.familyLabelEn || lot.familyLabel)));
    center.appendChild(head);
    var art = node('div', 'obgs-sb-lot-art');
    art.appendChild(renderPiece(lot.family, 'lots'));
    center.appendChild(art);
    append(center, node('h4', 'obgs-sb-lot-name', tr(lot.name, lot.nameEn || lot.name)));
    var base = node('div', 'obgs-sb-lot-base');
    append(base, node('span', '', tr('底价 {base}', 'Base {base}', { base: lot.base })));
    if (table.setBonus) append(base, node('span', '', tr('同门 {size} 件 +{points}', '{size} of a family +{points}', { size: table.setBonus.size, points: table.setBonus.points })));
    center.appendChild(base);
    var high = node('div', 'obgs-sb-lot-high');
    if (table.high && table.high.amount) {
      append(high, node('span', '', tr('当前最高 {amount} 银', 'Top bid {amount}', { amount: table.high.amount })));
      append(high, node('strong', '', botLabel(table.high.botId)));
    } else append(high, node('span', 'obgs-quiet', tr('还没有人出价。', 'No bid yet.')));
    center.appendChild(high);
    var active = Array.isArray(table.activeBotIds) ? table.activeBotIds : [];
    append(center, node('p', 'obgs-sb-active', tr('仍在竞价：{names}', 'Still in: {names}', {
      names: active.length ? active.map(botLabel).join('、') : tr('无', 'none')
    })));
    return center;
  }

  // Caravan Routes: the board is drawn from the same generated layout the
  // rules engine uses, so seats read the map exactly as the engine judged it.
  var CARAVAN_SEAT_COLORS = ['#bf713e', '#7b718d', '#548d80', '#828951', '#8f5b52'];

  function caravanBoard() { return root.OpenBotCaravanMap || null; }

  function caravanSeatColor(hall, botId) {
    var ids = Array.isArray(hall.botIds) ? hall.botIds.map(String) : [];
    var index = ids.indexOf(String(botId));
    return index >= 0 ? CARAVAN_SEAT_COLORS[index % CARAVAN_SEAT_COLORS.length] : '#8b8b93';
  }

  function svgNode(tag, attrs) {
    var item = root.document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var key in attrs) if (Object.prototype.hasOwnProperty.call(attrs, key)) item.setAttribute(key, attrs[key]);
    return item;
  }

  function caravanGoods(board, id) {
    for (var i = 0; i < board.goods.length; i++) if (board.goods[i].id === id) return board.goods[i];
    return null;
  }

  function caravanGoodsColor(board, id) {
    if (id === board.anyColor) return '#9aa0a6';
    var good = caravanGoods(board, id);
    return good ? good.color : '#9aa0a6';
  }

  function renderCaravanTable(hall, table, players, currentId, result, isPublicSpectator) {
    var wrap = node('div', 'obgs-cv-table');
    wrap.id = 'obgs-caravan-board';
    wrap.setAttribute('aria-label', tr('驿路通商地图', 'Caravan board'));
    var board = caravanBoard();
    if (!board) {
      append(wrap, node('p', 'obgs-empty-note', tr('地图模块未加载。', 'The board layout is unavailable.')));
      return wrap;
    }
    wrap.appendChild(renderCaravanMap(hall, table, board));
    var panels = node('div', 'obgs-cv-panels');
    panels.appendChild(renderCaravanSeason(table, board));
    panels.appendChild(renderCaravanMarket(table));
    panels.appendChild(renderCaravanClaims(hall, table, board));
    wrap.appendChild(panels);
    wrap.appendChild(renderCaravanPlayers(hall, table, players, currentId, result, isPublicSpectator));
    if (result && Array.isArray(result.details)) wrap.appendChild(renderCaravanBreakdown(hall, result));
    return wrap;
  }

  function renderCaravanMap(hall, table, board) {
    var frame = node('div', 'obgs-cv-frame');
    var svg = svgNode('svg', { viewBox: '0 0 ' + board.view.width + ' ' + board.view.height,
      preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': tr('驿路通商线路图', 'Caravan route map') });
    svg.setAttribute('class', 'obgs-cv-map');
    var back = svgNode('rect', { x: 0, y: 0, width: board.view.width, height: board.view.height, rx: 18,
      fill: 'var(--bg-board, #f4efe4)' });
    svg.appendChild(back);
    // Decorative terrain: three hand-authored landmasses and one river, purely
    // ornamental and never part of the rules.
    svg.appendChild(svgNode('path', { d: 'M0 210 C120 150 210 190 300 140 C370 105 430 150 520 120 C600 95 660 130 760 110 L1000 150 L1000 0 L0 0 Z',
      fill: 'color-mix(in srgb, #8b8f6d 22%, transparent)' }));
    svg.appendChild(svgNode('path', { d: 'M0 470 C120 430 200 500 320 520 C430 540 520 470 640 500 C740 524 850 560 1000 520 L1000 620 L0 620 Z',
      fill: 'color-mix(in srgb, #6f8a86 18%, transparent)' }));
    svg.appendChild(svgNode('path', { d: 'M610 250 C680 300 700 350 760 400 C820 450 860 470 940 470',
      fill: 'none', stroke: 'color-mix(in srgb, #4b7f96 30%, transparent)', 'stroke-width': 16, 'stroke-linecap': 'round' }));
    var ownerOf = {};
    (Array.isArray(table.routes) ? table.routes : []).forEach(function (route) { ownerOf[route.id] = route.ownerBotId; });
    var byCity = {};
    board.cities.forEach(function (city) { byCity[city.id] = city; });
    board.routes.forEach(function (route) {
      var a = byCity[route.from], b = byCity[route.to];
      if (!a || !b) return;
      var owner = ownerOf[route.id];
      var paint = owner ? caravanSeatColor(hall, owner) : caravanGoodsColor(board, route.color);
      svg.appendChild(svgNode('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: 'var(--bg-panel, #fafafa)',
        'stroke-width': 15, 'stroke-linecap': 'round' }));
      var line = svgNode('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: paint,
        'stroke-width': owner ? 9 : 6, 'stroke-linecap': 'round' });
      if (!owner && route.color === board.anyColor) line.setAttribute('stroke-dasharray', '13 9');
      svg.appendChild(line);
      // One wagon slot per unit of cost: the line itself tells you the price.
      for (var i = 0; i < route.length; i++) {
        var t = (i + 0.5) / route.length;
        svg.appendChild(svgNode('circle', { cx: a.x + (b.x - a.x) * t, cy: a.y + (b.y - a.y) * t, r: 5.5,
          fill: owner ? 'var(--bg-panel, #fafafa)' : 'var(--bg-panel, #fafafa)', stroke: paint, 'stroke-width': 2.4 }));
      }
    });
    board.cities.forEach(function (city) {
      svg.appendChild(svgNode('circle', { cx: city.x, cy: city.y, r: 15, fill: 'var(--bg-panel, #fafafa)',
        stroke: 'var(--text-2, #51515a)', 'stroke-width': 2.4 }));
      svg.appendChild(svgNode('circle', { cx: city.x, cy: city.y, r: 4.5, fill: 'var(--text-3, #686871)' }));
    });
    frame.appendChild(svg);
    var labels = node('div', 'obgs-cv-cities');
    labels.setAttribute('aria-hidden', 'true');
    board.cities.forEach(function (city) {
      var label = node('span', 'obgs-cv-city', value(root.OpenBotI18n && root.OpenBotI18n.isEnglish && root.OpenBotI18n.isEnglish() ? city.en : city.zh));
      label.style.left = (city.x / board.view.width * 100) + '%';
      label.style.top = (city.y / board.view.height * 100) + '%';
      labels.appendChild(label);
    });
    frame.appendChild(labels);
    return frame;
  }

  function renderCaravanSeason(table, board) {
    var panel = node('section', 'obgs-cv-panel');
    append(panel, node('h4', 'obgs-subsection-title', tr('季节行情', 'Season')));
    var season = table && table.season ? table.season : null;
    if (!season) { append(panel, node('p', 'obgs-quiet', tr('行情暂不可用。', 'No season is published.'))); return panel; }
    var row = node('div', 'obgs-cv-season');
    var swatch = node('span', 'obgs-cv-swatch');
    swatch.style.background = caravanGoodsColor(board, season.hot);
    row.appendChild(swatch);
    var hot = caravanGoods(board, season.hot);
    append(row, node('strong', 'obgs-cv-season-name', hot ? value(hot.zh) : value(season.hot)));
    append(row, node('span', 'obgs-cv-season-mult', tr('×2', '×2')));
    panel.appendChild(row);
    var order = Array.isArray(season.order) ? season.order : [];
    var next = order[(Number(season.index) + 1) % order.length];
    var nextGood = caravanGoods(board, next);
    append(panel, node('p', 'obgs-cv-note', nextGood
      ? tr('下一段行情：{goods}（届时该色线路翻倍）', 'Next season: {goods} (that cargo scores double)', { goods: value(nextGood.zh) })
      : tr('线路按长度计点。', 'Corridors score by length.')));
    if (table.finalTurns !== null && table.finalTurns !== undefined) {
      append(panel, node('p', 'obgs-cv-final', tr('最后一轮：还剩 {count} 手', 'Final round: {count} turns left', { count: Number(table.finalTurns) || 0 })));
    }
    return panel;
  }

  function renderCaravanMarket(table) {
    var panel = node('section', 'obgs-cv-panel');
    append(panel, node('h4', 'obgs-subsection-title', tr('货市', 'Market')));
    var supply = table && table.supply ? table.supply : {};
    var list = node('div', 'obgs-piece-row obgs-goods-row obgs-cv-market');
    var market = Array.isArray(supply.market) ? supply.market : [];
    if (!market.length) append(panel, node('p', 'obgs-quiet', tr('货市已空。', 'The market is empty.')));
    else market.forEach(function (label) { list.appendChild(renderPiece(value(label), 'caravan')); });
    panel.appendChild(list);
    append(panel, node('p', 'obgs-cv-note', tr('牌堆 {deck} · 弃牌 {discard} · 密契 {contracts}',
      'Draw {deck} · discard {discard} · contracts {contracts}', {
        deck: Number(supply.deck) || 0, discard: Number(supply.discard) || 0, contracts: Number(supply.contractDeck) || 0
      })));
    return panel;
  }

  function renderCaravanClaims(hall, table, board) {
    var panel = node('section', 'obgs-cv-panel');
    append(panel, node('h4', 'obgs-subsection-title', tr('已占线路', 'Claimed corridors')));
    var routes = Array.isArray(table.routes) ? table.routes : [];
    var byCity = {};
    board.cities.forEach(function (city) { byCity[city.id] = city; });
    var claimed = routes.filter(function (route) { return route.ownerBotId; });
    if (!claimed.length) { append(panel, node('p', 'obgs-quiet', tr('还没有线路被占。', 'No corridor is claimed yet.'))); return panel; }
    var groups = {};
    claimed.forEach(function (route) {
      var key = String(route.ownerBotId);
      if (!groups[key]) groups[key] = [];
      groups[key].push(route);
    });
    var list = node('ul', 'obgs-cv-claims');
    Object.keys(groups).forEach(function (owner) {
      var line = node('li', 'obgs-cv-claim');
      var dot = node('span', 'obgs-cv-dot');
      dot.style.background = caravanSeatColor(hall, owner);
      line.appendChild(dot);
      append(line, node('strong', '', botLabel(owner)));
      var names = groups[owner].map(function (route) {
        var a = byCity[route.from], b = byCity[route.to];
        var text = (a ? value(a.zh) : route.from) + '–' + (b ? value(b.zh) : route.to);
        return text + ' +' + (Number(route.points) || 0);
      }).join('，');
      append(line, node('span', 'obgs-cv-claim-list', names));
      list.appendChild(line);
    });
    panel.appendChild(list);
    return panel;
  }

  function renderCaravanPlayers(hall, table, players, currentId, result, isPublicSpectator) {
    var wrap = node('div', 'obgs-cv-players');
    wrap.setAttribute('aria-label', tr('商队', 'Caravans'));
    var viewerId = isPublicSpectator ? '' : String(hall.viewBotId || '');
    var board = caravanBoard();
    (Array.isArray(players) ? players : []).forEach(function (player) {
      var bot = botById(player.botId);
      var seat = node('article', 'obgs-cv-player' + (String(player.botId) === String(currentId) ? ' is-current' : ''));
      if (String(player.botId) === String(currentId)) seat.setAttribute('aria-current', 'true');
      var head = node('div', 'obgs-seat-head');
      var face = node('span', 'obgs-seat-avatar');
      avatar(face, bot, 'mini');
      head.appendChild(face);
      var identity = node('div', 'obgs-seat-identity');
      append(identity, node('strong', 'obgs-seat-name', bot ? botName(bot) : botLabel(player.botId)));
      append(identity, node('span', 'obgs-seat-role', tr('车队 {left}/{total}', 'Wagons {left}/{total}', {
        left: Number(player.wagons) === undefined ? 0 : Number(player.wagons),
        total: Number(table.wagonStart) || 0
      })));
      head.appendChild(identity);
      var stats = node('div', 'obgs-cv-stats');
      append(stats, node('span', 'obgs-cv-stat', tr('线路 {points}', 'Routes {points}', { points: Number(player.routePoints) || 0 })));
      append(stats, node('span', 'obgs-cv-stat', tr('已占 {count} 段', '{count} corridors', { count: Number(player.claimed) || 0 })));
      append(stats, node('span', 'obgs-cv-stat', tr('密契 {count} 张', '{count} contracts', { count: Number(player.contractCount) || 0 })));
      if (!isPublicSpectator && String(player.botId) === String(viewerId) && Array.isArray(player.contracts)) {
        var board1 = board || caravanBoard();
        append(stats, node('span', 'obgs-cv-stat is-private', player.contracts.map(function (contract) {
          return value(contractLabel(board1, contract.from)) + '–' + value(contractLabel(board1, contract.to))
            + ' ' + value(contract.value) + (contract.done ? tr('（已达成）', ' (done)') : tr('（未达成）', ' (open)'));
        }).join('；') || tr('暂无密契', 'No contracts')));
      }
      seat.appendChild(head);
      seat.appendChild(stats);
      if (!isPublicSpectator && Array.isArray(player.hand)) {
        var hand = node('div', 'obgs-piece-row obgs-goods-row obgs-hand');
        if (player.hand.length) {
          player.hand.forEach(function (label) { hand.appendChild(renderPiece(value(label), 'caravan')); });
        } else {
          append(hand, node('span', 'obgs-cv-hand-empty', tr('手牌已用尽', 'Hand spent')));
        }
        seat.appendChild(hand);
      } else if (Number(player.count)) {
        seat.appendChild(renderConcealedHand(Math.min(6, Math.max(0, Math.floor(Number(player.count)))), 'caravan'));
      }
      if (result && Array.isArray(result.details)) {
        var detail = null;
        result.details.forEach(function (row) { if (String(row.botId) === String(player.botId)) detail = row; });
        if (detail) {
          append(seat, node('p', 'obgs-cv-note', tr('结算 {score} 分（线路 {routes} · 密契 {contracts} · 最长车队 {bonus}）',
            'Settles at {score} (routes {routes} · contracts {contracts} · longest caravan {bonus})', {
              score: Number(detail.score) || 0, routes: Number(detail.routePoints) || 0,
              contracts: Number(detail.contractScore) || 0, bonus: Number(detail.networkBonus) || 0
            })));
        }
      }
      wrap.appendChild(seat);
    });
    if (!wrap.childElementCount) append(wrap, node('p', 'obgs-empty-note', tr('当前牌桌没有公开座位信息。', 'No public seat information is available.')));
    return wrap;
  }

  function contractLabel(board, id) {
    for (var i = 0; i < board.cities.length; i++) if (board.cities[i].id === id) return board.cities[i].zh;
    return id;
  }

  function renderCaravanBreakdown(hall, result) {
    var panel = node('section', 'obgs-cv-result');
    append(panel, node('h4', 'obgs-subsection-title', tr('结算明细', 'Score breakdown')));
    var rows = node('ul', 'obgs-cv-breakdown');
    result.details.forEach(function (row) {
      var line = node('li', 'obgs-cv-breakdown-row');
      var dot = node('span', 'obgs-cv-dot');
      dot.style.background = caravanSeatColor(hall, row.botId);
      line.appendChild(dot);
      append(line, node('strong', 'obgs-cv-breakdown-name', botLabel(row.botId)));
      append(line, node('span', 'obgs-cv-breakdown-detail', tr('线路 {routes} + 长度 {length} · 密契 {done}/{all}（{points}）· 最长车队 {network}',
        'Corridors {routes} + length {length} · contracts {done}/{all} ({points}) · longest caravan {network}', {
          routes: Number(row.routePoints) || 0, length: Number(row.network) || 0,
          done: Number(row.completed) || 0, all: Array.isArray(row.contracts) ? row.contracts.length : 0,
          points: Number(row.contractScore) || 0, network: Number(row.networkBonus) || 0
        })));
      append(line, node('span', 'obgs-cv-breakdown-score', String(Number(row.score) || 0)));
      rows.appendChild(line);
    });
    panel.appendChild(rows);
    if (result.draw) append(panel, node('p', 'obgs-cv-note', tr('本局出现并列第一。', 'This round ended in a shared win.')));
    return panel;
  }

  function renderSeat(player, currentId, game, options) {
    options = options || {};
    var bot = botById(player.botId);
    var seat = node('article', 'obgs-seat' + (String(player.botId) === String(currentId) ? ' is-current' : ''));
    if (options.hasSpeechSlot && options.position !== 'bottom') seat.classList.add('has-speech-slot');
    if (options.speech && String(options.speech.sender && options.speech.sender.id) === String(player.botId)) seat.classList.add('has-speech');
    if (options.position) {
      seat.dataset.gsSeatPosition = options.position;
      seat.classList.add('obgs-dz-seat', 'is-position-' + options.position);
    }
    if (String(player.botId) === String(currentId)) seat.setAttribute('aria-current', 'true');
    var head = node('div', 'obgs-seat-head');
    head.appendChild(renderSeatVisual(player.botId, bot, options));
    var identity = node('div', 'obgs-seat-identity');
    append(identity, node('strong', 'obgs-seat-name', bot ? botName(bot) : botLabel(player.botId)));
    var role = roleLabel(player.role);
    if (role) append(identity, node('span', 'obgs-seat-role', role));
    head.appendChild(identity);
    var count = Number(player.count);
    var countLabel = game === 'mahjong' ? tr('{count} 张', '{count} tiles', { count: Number.isFinite(count) ? count : 0 }) : tr('{count} 张手牌', '{count} cards', { count: Number.isFinite(count) ? count : 0 });
    append(head, node('span', 'obgs-seat-count', countLabel));
    seat.appendChild(head);
    var showHand = Array.isArray(player.hand) && player.hand.length
      && (game !== 'doudizhu' || options.isViewer || options.revealHand);
    if (showHand) {
      var hand = renderCardRow(player.hand, game === 'mahjong' ? 'tiles' : 'cards');
      hand.classList.add('obgs-hand');
      if (options.position === 'bottom' && game === 'doudizhu') hand.classList.add('obgs-dz-own-hand');
      if (options.position === 'bottom' && game === 'doudizhu') {
        var scroll = node('div', 'obgs-dz-own-hand-scroll');
        scroll.appendChild(hand);
        seat.appendChild(scroll);
      } else seat.appendChild(hand);
    } else {
      var concealedCount = Number(player.count);
      var visibleBacks = Number.isFinite(concealedCount) ? Math.min(6, Math.max(0, Math.floor(concealedCount))) : 0;
      if (visibleBacks) seat.appendChild(renderConcealedHand(visibleBacks, game === 'mahjong' ? 'tiles' : 'cards'));
    }
    if (game === 'mahjong' && Array.isArray(player.melds) && player.melds.length) {
      var melds = node('div', 'obgs-meld-list');
      player.melds.forEach(function (meld) {
        var group = node('div', 'obgs-meld');
        append(group, node('span', 'obgs-meld-type', meldLabel(meld.type)));
        if (Array.isArray(meld.cards)) group.appendChild(renderCardRow(meld.cards, 'tiles'));
        melds.appendChild(group);
      });
      seat.appendChild(melds);
    }
    return seat;
  }

  function renderSeatVisual(botIdValue, bot, options) {
    options = options || {};
    var id = String(botIdValue);
    var visual = node('span', 'obgs-seat-visual');
    if (options.position) visual.dataset.gsSpeechPosition = options.position;
    var hasChat = Boolean(options.hasChat && !options.isReplay);
    var face = hasChat
      ? button('', 'focus-chat-sender', 'obgs-seat-avatar obgs-seat-avatar-button')
      : node('span', 'obgs-seat-avatar');
    if (hasChat) {
      face.dataset.gsBotId = id;
      face.setAttribute('aria-label', tr('查看 {name} 的牌桌聊天记录', 'View {name} in table chat', { name: bot ? botName(bot) : botLabel(id) }));
    }
    avatar(face, bot, 'mini');
    visual.appendChild(face);
    var speech = options.speech;
    if (speech && String(speech.sender && speech.sender.id) === id) {
      var bubble = button('', 'focus-chat-message', 'obgs-speech-bubble');
      bubble.appendChild(node('span', 'obgs-speech-text', speech.text));
      bubble.dataset.gsChatBubble = 'true';
      bubble.dataset.gsChatMessageId = String(speech.id);
      bubble.dataset.gsChatSenderId = id;
      bubble.dataset.gsChatSenderSource = String(speech.sender.source || '');
      bubble.dataset.gsChatSenderKind = String(speech.sender.kind || '');
      bubble.dataset.gsChatCreatedAt = String(Number(speech.createdAt) || 0);
      bubble.setAttribute('aria-label', tr('查看 {name} 的聊天消息：{text}', 'View {name}\'s chat message: {text}', {
        name: speech.sender.name || (bot ? botName(bot) : botLabel(id)), text: speech.text
      }));
      bubble.title = tr('打开这条聊天消息', 'Open this chat message');
      if (!speechAnimatedIds.has(String(speech.id))) {
        bubble.classList.add('is-entering');
        speechAnimatedIds.add(String(speech.id));
      }
      visual.appendChild(bubble);
    }
    return visual;
  }

  function renderCardRow(cards, type) {
    var row = node('div', type === 'tiles' ? 'obgs-piece-row obgs-tile-row' : 'obgs-piece-row obgs-card-row');
    cards.forEach(function (card) {
      var label = value(card);
      row.appendChild(renderPiece(label, type));
    });
    return row;
  }

  function renderConcealedHand(count, type) {
    var row = node('div', 'obgs-piece-row obgs-concealed-hand');
    row.classList.add(type === 'tiles' ? 'obgs-tile-row' : 'obgs-card-row');
    var backLabel = type === 'tiles' ? '■' : 'back';
    for (var i = 0; i < count; i++) {
      var piece = renderPiece(backLabel, type);
      row.appendChild(piece);
    }
    return row;
  }

  function renderPiece(label, type) {
    var kind = type === 'tiles' ? 'obgs-tile' : type === 'lots' ? 'obgs-lot' : 'obgs-card';
    var className = kind + (/[♥♦]/.test(label) ? ' is-red' : '');
    var registry = root.OpenBotGameArt;
    var art = null;
    try {
      if (registry && typeof registry.resolve === 'function') art = registry.resolve(label, type);
    } catch (_) { }

    if (!art || !art.src) {
      var fallback = node('span', className + ' obgs-piece-unavailable', label);
      fallback.title = label;
      fallback.setAttribute('role', 'img');
      fallback.setAttribute('aria-label', label);
      return fallback;
    }

    var image = node('img', className + ' obgs-piece-art');
    image.src = art.src;
    image.alt = value(art.alt, label);
    image.title = label;
    image.draggable = false;
    image.decoding = 'async';
    if (art.kind === 'mahjong' || art.kind === 'poker' || art.kind === 'caravan') image.classList.add('is-' + art.kind);
    if (art.back) image.classList.add('is-back');
    return image;
  }

  function renderMessages(messages) {
    var section = node('section', 'obgs-messages');
    var head = node('div', 'obgs-messages-head');
    append(head, node('h4', 'obgs-subsection-title', tr('牌局进展', 'Game progress')));
    var list = Array.isArray(messages) ? messages.slice(-60) : [];
    append(head, node('span', 'obgs-message-count', String(list.length)));
    section.appendChild(head);
    if (!list.length) {
      append(section, node('p', 'obgs-quiet', tr('牌局消息将在这里显示。', 'Table messages will appear here.')));
      return section;
    }
    var log = node('ol', 'obgs-message-list');
    log.setAttribute('aria-label', tr('牌局进展记录', 'Game progress log'));
    list.forEach(function (message) {
      var row = node('li', 'obgs-message');
      append(row, node('strong', 'obgs-message-author', botLabel(message.botId)));
      append(row, node('p', 'obgs-message-text', value(message.text)));
      log.appendChild(row);
    });
    section.appendChild(log);
    return section;
  }

  function roomRecordingBridge() {
    var bridge = root.grokbot;
    return bridge && typeof bridge.gameRoomRecording === 'function' ? bridge : null;
  }

  function recordingText(input, max) {
    return typeof input === 'string' ? input.trim().slice(0, max || 180) : '';
  }

  function recordingDuration(seconds) {
    seconds = Math.max(0, Math.floor(Number(seconds) || 0));
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }

  function activeRecordingHallId(active) {
    return String(active && active.scope && active.scope.hallId || active && active.hallId || '');
  }

  function activeRecordingBotId(active) {
    return String(active && (active.botId || active.scope && active.scope.initiatorBotId) || '');
  }

  function recordingHallName(hallId) {
    var list = state && Array.isArray(state.halls) ? state.halls : [];
    for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(hallId)) return value(list[i].name, tr('牌局', 'Table'));
    return recordingText(recordingActive && recordingActive.scope && recordingActive.scope.hallName, 100)
      || recordingText(recordingRecent && recordingRecent.scope && recordingRecent.scope.hallName, 100)
      || (hallId ? String(hallId) : tr('牌局', 'Table'));
  }

  function safeRoomRecordingMetadata(input, fallback) {
    input = input && typeof input === 'object' ? input : {};
    fallback = fallback && typeof fallback === 'object' ? fallback : {};
    var source = input.metadata && typeof input.metadata === 'object' ? input.metadata : input;
    var fallbackScope = fallback.scope && typeof fallback.scope === 'object' ? fallback.scope : {};
    var scope = source.scope && typeof source.scope === 'object' ? source.scope : fallbackScope;
    var recordingId = recordingText(source.recordingId || fallback.recordingId, 128);
    if (!/^[a-f0-9]{32}$/i.test(recordingId)) return null;
    var output = {
      recordingId: recordingId,
      source: 'application',
      audio: { system: true, microphone: true },
      targetName: recordingText(source.targetName || fallback.targetName || recordingHallName(scope.hallId || fallback.hallId), 120),
      systemAudioScope: recordingText(source.systemAudioScope || fallback.systemAudioScope, 100) || 'system-wide',
      scope: {
        spaceId: recordingText(scope.spaceId, 128),
        hallId: recordingText(scope.hallId || fallback.hallId, 128),
        matchId: recordingText(scope.matchId, 128),
        viewBotId: 'public-spectator',
        initiatorBotId: recordingText(scope.initiatorBotId || source.botId || fallback.botId, 128)
      }
    };
    ['at', 'width', 'height', 'durationSeconds', 'bytes', 'frameCount'].forEach(function (key) {
      var number = Number(source[key]);
      if (Number.isFinite(number) && number >= 0 && (key !== 'width' && key !== 'height' || Number.isInteger(number))) output[key] = number;
    });
    if (typeof source.stopReason === 'string') output.stopReason = recordingText(source.stopReason, 100);
    return output;
  }

  function normalizeRoomRecording(input, fallback) {
    if (!input || typeof input !== 'object') return null;
    fallback = fallback && typeof fallback === 'object' ? fallback : {};
    var rawMetadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : input;
    var metadata = safeRoomRecordingMetadata(rawMetadata, fallback);
    if (!metadata) return null;
    var scope = metadata.scope;
    var botId = recordingText(input.botId || rawMetadata.botId || scope.initiatorBotId || fallback.botId, 128);
    return {
      recordingId: metadata.recordingId,
      botId: botId,
      hallId: scope.hallId || recordingText(input.hallId || fallback.hallId, 128),
      scope: scope,
      metadata: metadata,
      durationSeconds: Number(metadata.durationSeconds) || 0,
      mediaUrl: recordingText(input.mediaUrl, 1000),
      poster: recordingText(input.dataUrl || input.poster || rawMetadata.dataUrl || rawMetadata.poster, 2 * 1024 * 1024),
      targetName: recordingText(input.targetName || rawMetadata.targetName || metadata.targetName, 120),
      systemAudioScope: recordingText(input.systemAudioScope || rawMetadata.systemAudioScope || metadata.systemAudioScope, 100) || 'system-wide',
      attached: !!recordingAttachedIds[metadata.recordingId]
    };
  }

  function roomRecordingRenderState() {
    return JSON.stringify([recordingStatus, recordingStatusLoaded, recordingStatusError,
      recordingBots, recordingActive, recordingRecent, recordingRecords, recordingPluginStatus]);
  }

  function acceptRoomRecordingStatus(raw, fallback) {
    if (!raw || typeof raw !== 'object') return false;
    var previousRenderState = roomRecordingRenderState();
    if (raw.ok === false) {
      recordingStatusError = recordingText(raw.message, 320) || tr('无法读取房间录制状态。', 'Could not read game-room recording status.');
      recordingStatusLoaded = true;
      if (isOpen && roomRecordingRenderState() !== previousRenderState) render();
      return false;
    }
    var next = raw.status && typeof raw.status === 'object' ? raw.status : raw;
    recordingStatus = next;
    recordingStatusLoaded = true;
    recordingStatusError = '';
    if (Array.isArray(next.bots)) recordingBots = next.bots.filter(function (item) {
      return item && item.id !== undefined && item.id !== null;
    }).map(function (item) {
      return { id: String(item.id), name: recordingText(item.name, 100) || String(item.id), avatar: recordingText(item.avatar, 120), color: safeColor(item.color) };
    });
    if (Object.prototype.hasOwnProperty.call(next, 'active')) {
      recordingActive = next.active && typeof next.active === 'object' ? next.active : null;
    }
    var queryBotId = String(fallback && fallback.botId || '');
    if (Object.prototype.hasOwnProperty.call(next, 'recent') && (queryBotId || next.recent)) {
      var recent = normalizeRoomRecording(next.recent, fallback);
      if (!recent || recordingAttachedIds[recent.recordingId]) recordingRecent = null;
      else recordingRecent = recent;
    }
    if (Array.isArray(next.recordings)) {
      recordingRecords = next.recordings.map(function (item) { return normalizeRoomRecording(item, fallback); })
        .filter(function (item) { return item && !recordingAttachedIds[item.recordingId]; });
      if (queryBotId && !Object.prototype.hasOwnProperty.call(next, 'recent')) recordingRecent = recordingRecords[0] || null;
      if (queryBotId && Object.prototype.hasOwnProperty.call(next, 'recent') && !recordingRecent && recordingRecords.length) recordingRecent = recordingRecords[0];
    }
    if (next.plugin || next.capturePlugin) recordingPluginStatus = next.plugin || next.capturePlugin;
    // Unchanged one-second polls must not replace an open native select/menu.
    // Actual capability, ownership and recording changes still render promptly.
    if (isOpen && roomRecordingRenderState() !== previousRenderState) render();
    ensureRoomRecordingPoll();
    return true;
  }

  async function refreshRoomRecordingStatus(hallId, botId) {
    var bridge = roomRecordingBridge();
    if (!bridge) {
      recordingStatusLoaded = false;
      recordingStatusError = tr('房间录制服务尚未连接。', 'The game-room recording service is not connected.');
      if (isOpen) render();
      return null;
    }
    var requestId = ++recordingRequestId;
    var request = { action: 'status', viewBotId: 'public-spectator' };
    hallId = String(hallId || '');
    botId = String(botId || '');
    if (hallId) request.hallId = hallId;
    if (botId) request.botId = botId;
    try {
      var result = await bridge.gameRoomRecording(request);
      if (requestId !== recordingRequestId) return null;
      acceptRoomRecordingStatus(result, { hallId: hallId, botId: botId });
      return result;
    } catch (error) {
      if (requestId !== recordingRequestId) return null;
      var previousRenderState = roomRecordingRenderState();
      recordingStatusLoaded = true;
      recordingStatusError = recordingText(error && error.message || String(error), 320) || tr('无法读取房间录制状态。', 'Could not read game-room recording status.');
      if (isOpen && roomRecordingRenderState() !== previousRenderState) render();
      ensureRoomRecordingPoll();
      return null;
    }
  }

  async function refreshRoomRecordingPluginStatus() {
    var bridge = root.grokbot;
    if (!bridge || typeof bridge.capturePluginStatus !== 'function') return null;
    recordingPluginBusy = true;
    recordingPluginError = '';
    if (isOpen) render();
    try {
      var result = await bridge.capturePluginStatus();
      if (!result || result.ok !== true || !result.status) throw new Error(result && result.message || tr('无法读取采集插件状态。', 'Could not read capture plugin status.'));
      recordingPluginStatus = result.status;
      if (isOpen) render();
      return result.status;
    } catch (error) {
      recordingPluginError = recordingText(error && error.message || String(error), 320) || tr('无法读取采集插件状态。', 'Could not read capture plugin status.');
      if (isOpen) render();
      return null;
    } finally {
      recordingPluginBusy = false;
      if (isOpen) render();
    }
  }

  function roomRecordingScope(hallId, botId) {
    var hall = halls().find(function (item) { return String(item.id) === String(hallId); });
    var space = hall && spaces().find(function (item) { return String(item.id) === String(hall.spaceId); });
    return {
      spaceId: String(space && space.id || ''),
      hallId: String(hallId || ''),
      matchId: String(hall && hall.table && (hall.table.matchId || hall.table.roundId) || ''),
      viewBotId: 'public-spectator',
      initiatorBotId: String(botId || '')
    };
  }

  async function startRoomRecording(hallId) {
    var bridge = roomRecordingBridge();
    hallId = String(hallId || '');
    var botId = String(recordingOwnerByHall[hallId] || '');
    if (!bridge) { recordingError = tr('房间录制服务尚未连接。', 'The game-room recording service is not connected.'); render(); return false; }
    if (!botId) { recordingError = tr('请先明确选择素材所属 Bot。', 'Choose the Bot that owns this recording first.'); render(); return false; }
    if (recordingActive || recordingBusy) {
      recordingError = isRoomRecordingActive(recordingActive)
        ? tr('已有房间录制正在进行。', 'A game-room recording is already active.')
        : tr('已有屏幕录制正在进行，请先停止后再录制牌局。', 'A screen recording is already active. Stop it before recording this table.');
      render();
      return false;
    }
    if (roomRecordingPluginBlocked()) { recordingError = tr('请先启用采集插件，再开始录制。', 'Enable the capture plugin before recording.'); render(); return false; }
    var duration = Number(recordingDurationByHall[hallId] || 180);
    if ([30, 60, 120, 180].indexOf(duration) < 0) duration = 180;
    recordingBusy = 'start';
    recordingError = '';
    render();
    try {
      var result = await bridge.gameRoomRecording({ action: 'start', hallId: hallId, botId: botId,
        viewBotId: 'public-spectator', maxDurationSeconds: duration });
      if (!result || result.ok !== true) throw new Error(result && result.message || tr('无法开始牌局录制。', 'Could not start game-room recording.'));
      recordingRecent = null;
      if (result.status || Object.prototype.hasOwnProperty.call(result, 'active')) acceptRoomRecordingStatus(result, { hallId: hallId, botId: botId });
      if (result.active && typeof result.active === 'object') recordingActive = result.active;
      if (!recordingActive) await refreshRoomRecordingStatus(hallId, botId);
      if (isOpen) render();
        return true;
    } catch (error) {
      recordingError = recordingText(error && error.message || String(error), 320) || tr('无法开始牌局录制。', 'Could not start game-room recording.');
      if (isOpen) render();
        return false;
    } finally {
      recordingBusy = '';
      if (isOpen) render();
        ensureRoomRecordingPoll();
    }
  }

  async function stopRoomRecording(hallId) {
    var bridge = roomRecordingBridge();
    var active = recordingActive;
    hallId = String(hallId || '');
    if (!bridge || !isRoomRecordingActive(active) || activeRecordingHallId(active) !== hallId || recordingBusy) return false;
    var retryStop = active.state === 'stopping' && active.cleanupUnconfirmed === true;
    if (active.state === 'stopping' && !retryStop) return false;
    var recordingId = recordingText(active.recordingId, 128);
    if (!recordingId) {
      recordingError = tr('录制编号不可用，无法停止。', 'The recording ID is unavailable, so it cannot be stopped.');
      render();
      return false;
    }
    var botId = activeRecordingBotId(active);
    recordingBusy = 'stop';
    recordingError = '';
    render();
    try {
      var result = await bridge.gameRoomRecording({ action: 'stop', hallId: hallId, botId: botId,
        recordingId: recordingId, viewBotId: 'public-spectator' });
      if (!result || result.ok !== true) throw new Error(result && result.message || tr('录制尚未确认停止。', 'The recording has not been confirmed stopped.'));
      if (result.status || Object.prototype.hasOwnProperty.call(result, 'active')) acceptRoomRecordingStatus(result, { hallId: hallId, botId: botId });
      if (result.active && typeof result.active === 'object') recordingActive = result.active;
      else if (!result.status && !Object.prototype.hasOwnProperty.call(result, 'active')) await refreshRoomRecordingStatus(hallId, botId);
      if (isOpen) render();
      return true;
    } catch (error) {
      recordingError = recordingText(error && error.message || String(error), 320) || tr('停止录制失败。', 'Could not stop recording.');
      await refreshRoomRecordingStatus(hallId, botId);
      if (isOpen) render();
      return false;
    } finally {
      recordingBusy = '';
      if (isOpen) render();
      ensureRoomRecordingPoll();
    }
  }

  function validRecordingMediaUrl(input) {
    return typeof input === 'string' && /^openbot-recording:\/\/[A-Za-z0-9._~-]{1,256}\/[a-f0-9]{32}$/i.test(input);
  }

  function validRecordingPoster(input) {
    return typeof input === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(input);
  }

  function ensureRoomRecordingPreview() {
    if (recordingPreviewDialog && recordingPreviewDialog.isConnected) return;
    recordingPreviewDialog = node('dialog', 'ogrs-preview');
    recordingPreviewDialog.id = 'obgs-room-recording-preview';
    recordingPreviewDialog.setAttribute('aria-labelledby', 'ogrs-preview-title');
    var header = node('header', 'ogrs-preview-header');
    recordingPreviewTitle = node('h2', '', tr('房间录制预览', 'Game-room recording preview'));
    recordingPreviewTitle.id = 'ogrs-preview-title';
    var closeButton = button(tr('关闭', 'Close'), '', 'ogrs-preview-close');
    closeButton.setAttribute('aria-label', tr('关闭录制预览', 'Close recording preview'));
    header.appendChild(recordingPreviewTitle);
    header.appendChild(closeButton);
    recordingPreviewVideo = node('video', 'ogrs-preview-video');
    recordingPreviewVideo.controls = true;
    recordingPreviewVideo.playsInline = true;
    recordingPreviewVideo.preload = 'metadata';
    recordingPreviewMessage = node('p', 'ogrs-preview-message');
    recordingPreviewMessage.setAttribute('role', 'status');
    recordingPreviewMessage.setAttribute('aria-live', 'polite');
    var actions = node('div', 'ogrs-preview-actions');
    recordingPreviewRetry = button(tr('重新读取', 'Reload'), '', 'obgs-text-button');
    recordingPreviewAttach = button(tr('附到 Bot 聊天', 'Attach to Bot chat'), '', 'obgs-primary');
    actions.appendChild(recordingPreviewRetry);
    actions.appendChild(recordingPreviewAttach);
    recordingPreviewDialog.appendChild(header);
    recordingPreviewDialog.appendChild(recordingPreviewVideo);
    recordingPreviewDialog.appendChild(recordingPreviewMessage);
    recordingPreviewDialog.appendChild(actions);
    root.document.body.appendChild(recordingPreviewDialog);
    closeButton.addEventListener('click', function () { if (recordingPreviewDialog.open) recordingPreviewDialog.close(); });
    recordingPreviewRetry.addEventListener('click', function () { loadRoomRecordingPreview(true); });
    recordingPreviewAttach.addEventListener('click', function () { attachRoomRecording(); });
    recordingPreviewDialog.addEventListener('close', clearRoomRecordingPreviewSource);
    recordingPreviewDialog.addEventListener('click', function (event) { if (event.target === recordingPreviewDialog) recordingPreviewDialog.close(); });
    recordingPreviewVideo.addEventListener('error', function () {
      if (recordingPreviewDialog.open) setRoomRecordingPreviewMessage(tr('视频读取失败，可以重新读取后再播放。', 'The video could not be loaded. Reload it to play.'), true);
    });
  }

  function setRoomRecordingPreviewMessage(message, isError) {
    if (!recordingPreviewMessage) return;
    recordingPreviewMessage.textContent = message || '';
    recordingPreviewMessage.hidden = !message;
    recordingPreviewMessage.dataset.error = String(!!isError);
  }

  function clearRoomRecordingPreviewSource() {
    recordingPreviewEpoch++;
    recordingPreviewCurrent = null;
    if (!recordingPreviewVideo) return;
    recordingPreviewVideo.pause();
    recordingPreviewVideo.removeAttribute('src');
    recordingPreviewVideo.removeAttribute('poster');
    recordingPreviewVideo.load();
  }

  async function loadRoomRecordingPreview(retry) {
    var current = recordingPreviewCurrent || recordingRecent;
    var bridge = roomRecordingBridge();
    if (!current || !bridge) return false;
    ensureRoomRecordingPreview();
    var epoch = ++recordingPreviewEpoch;
    recordingPreviewCurrent = current;
    recordingPreviewRetry.hidden = true;
    if (recordingPreviewVideo) {
      recordingPreviewVideo.pause();
      recordingPreviewVideo.removeAttribute('src');
      recordingPreviewVideo.removeAttribute('poster');
      recordingPreviewVideo.hidden = true;
      recordingPreviewVideo.load();
    }
    setRoomRecordingPreviewMessage(retry ? tr('正在重新读取录制…', 'Reloading recording…') : tr('正在读取录制…', 'Loading recording…'), false);
    if (!recordingPreviewDialog.open) recordingPreviewDialog.showModal();
    try {
      var result = await bridge.gameRoomRecording({ action: 'read', hallId: current.hallId, botId: current.botId,
        viewBotId: 'public-spectator', recordingId: current.recordingId });
      if (epoch !== recordingPreviewEpoch || !recordingPreviewDialog.open) return false;
      if (!result || result.ok !== true) throw new Error(result && result.message || tr('无法读取这段房间录制。', 'Could not read this game-room recording.'));
      var url = recordingText(result.mediaUrl, 1000);
      if (!validRecordingMediaUrl(url)) throw new Error(tr('录制地址无效。', 'The recording URL is invalid.'));
      if (validRecordingPoster(result.dataUrl || result.poster)) recordingPreviewVideo.poster = result.dataUrl || result.poster;
      recordingPreviewVideo.src = url;
      recordingPreviewVideo.hidden = false;
      recordingPreviewVideo.load();
      recordingPreviewRetry.hidden = true;
      setRoomRecordingPreviewMessage('', false);
      return true;
    } catch (error) {
      if (epoch !== recordingPreviewEpoch) return false;
      setRoomRecordingPreviewMessage(recordingText(error && error.message || String(error), 320) || tr('无法读取录制。', 'Could not read the recording.'), true);
      recordingPreviewRetry.hidden = false;
      return false;
    }
  }

  function findRoomRecording(recordingId) {
    recordingId = String(recordingId || '');
    if (!recordingId) return null;
    if (recordingRecent && recordingRecent.recordingId === recordingId) return recordingRecent;
    for (var i = 0; i < recordingRecords.length; i++) {
      if (recordingRecords[i] && recordingRecords[i].recordingId === recordingId) return recordingRecords[i];
    }
    return null;
  }

  function openRoomRecordingPreview(item) {
    item = item || recordingRecent;
    if (!item || recordingAttachedIds[item.recordingId]) return false;
    ensureRoomRecordingPreview();
    var owner = roomRecordingBotName(item.botId);
    recordingPreviewTitle.textContent = tr('房间录制预览', 'Game-room recording preview') + ' · ' + owner;
    recordingPreviewAttach.hidden = !!item.attached;
    recordingPreviewAttach.disabled = recordingBusy === 'attach';
    recordingPreviewCurrent = item;
    return loadRoomRecordingPreview(false);
  }

  async function attachRoomRecording(selectedRecording) {
    var item = selectedRecording || recordingPreviewCurrent || recordingRecent;
    var bridge = roomRecordingBridge();
    if (!item || !bridge || recordingBusy) return false;
    recordingBusy = 'attach';
    recordingError = '';
    if (recordingPreviewAttach) recordingPreviewAttach.disabled = true;
    if (isOpen) render();
    try {
      var authorization = await bridge.gameRoomRecording({ action: 'attach', hallId: item.hallId, botId: item.botId,
        viewBotId: 'public-spectator', recordingId: item.recordingId });
      if (!authorization || authorization.ok !== true) throw new Error(authorization && authorization.message || tr('无法附加房间录制。', 'Could not attach the game-room recording.'));
      var metadata = safeRoomRecordingMetadata(authorization.metadata || item.metadata, item);
      if (!metadata) throw new Error(tr('房间录制信息无效，未发送。', 'The recording metadata is invalid; nothing was sent.'));
      var sender = typeof root.OpenBotRoomRecordingSend === 'function' ? root.OpenBotRoomRecordingSend
        : (typeof root.sendBotMessage === 'function' ? root.sendBotMessage : null);
      if (!sender) throw new Error(tr('Bot 聊天发送入口尚未连接。', 'The Bot chat sender is not connected.'));
      var sent = await Promise.resolve(sender(String(authorization.botId || item.botId), tr('帮我看看这段房间录制', 'Please review this game-room recording'), null, metadata));
      if (sent === false || sent && sent.ok === false) throw new Error(sent && sent.message || tr('录制没有发送；可以重试。', 'The recording was not sent; you can retry.'));
      recordingAttachedIds[item.recordingId] = true;
      recordingRecords = recordingRecords.filter(function (recording) { return recording.recordingId !== item.recordingId; });
      if (recordingRecent && recordingRecent.recordingId === item.recordingId) recordingRecent = recordingRecords[0] || null;
      if (recordingPreviewDialog && recordingPreviewDialog.open) recordingPreviewDialog.close();
      refreshRoomRecordingStatus(item.hallId, item.botId);
      if (isOpen) render();
        return true;
    } catch (error) {
      recordingError = recordingText(error && error.message || String(error), 320) || tr('无法附加房间录制。', 'Could not attach the game-room recording.');
      if (recordingPreviewAttach) recordingPreviewAttach.disabled = false;
      if (recordingPreviewDialog && recordingPreviewDialog.open) setRoomRecordingPreviewMessage(recordingError, true);
      if (isOpen) render();
        return false;
    } finally {
      recordingBusy = '';
      if (isOpen) render();
      }
  }

  function ensureRoomRecordingUi() {
    if (recordingUiReady || !root.document || !root.document.body || !root.grokbot) return;
    recordingUiReady = true;
    subscribeRoomRecordingEvents();
    refreshRoomRecordingStatus('', '');
    root.document.addEventListener('visibilitychange', function () {
      if (root.document.visibilityState === 'visible') ensureRoomRecordingPoll();
      else if (recordingPollTimer) { root.clearTimeout(recordingPollTimer); recordingPollTimer = 0; }
    });
  }

  // The host's existing #app-recording-status owns global placement and Stop for every source.

  function subscribeRoomRecordingEvents() {
    if (recordingSubscription) return;
    var bridge = root.grokbot;
    if (!bridge || typeof bridge.onGameRoomRecordingChanged !== 'function') return;
    var callback = function (result) {
      if (result && typeof result === 'object' && (Object.prototype.hasOwnProperty.call(result, 'active') || result.status)) {
        acceptRoomRecordingStatus(result, { hallId: recordingSetupHallId || selectedHallId, botId: recordingOwnerByHall[recordingSetupHallId || selectedHallId] || '' });
      } else refreshRoomRecordingStatus(recordingSetupHallId || selectedHallId, recordingOwnerByHall[recordingSetupHallId || selectedHallId] || '');
    };
    try {
      var result = bridge.onGameRoomRecordingChanged(callback);
      if (typeof result === 'function') recordingSubscription = result;
      else if (result && typeof result.unsubscribe === 'function') recordingSubscription = function () { result.unsubscribe(); };
      else if (typeof bridge.offGameRoomRecordingChanged === 'function') recordingSubscription = function () { bridge.offGameRoomRecordingChanged(callback); };
      else recordingSubscription = true;
    } catch (_) { recordingSubscription = null; }
  }

  function ensureRoomRecordingPoll() {
    if (recordingPollTimer || recordingPollBusy || !roomRecordingBridge()) return;
    if (!isRoomRecordingActive(recordingActive) && !(isOpen && recordingSetupHallId)) return;
    if (root.document && root.document.visibilityState === 'hidden') return;
    recordingPollTimer = root.setTimeout(function () {
      recordingPollTimer = 0;
      pollRoomRecordingStatus();
    }, 1000);
  }

  async function pollRoomRecordingStatus() {
    if (recordingPollBusy) { ensureRoomRecordingPoll(); return; }
    if (!isRoomRecordingActive(recordingActive) && !(isOpen && recordingSetupHallId)) return;
    recordingPollBusy = true;
    try {
      var active = recordingActive;
      var roomActive = isRoomRecordingActive(active);
      var hallId = roomActive ? activeRecordingHallId(active) : recordingSetupHallId || selectedHallId;
      var botId = roomActive ? activeRecordingBotId(active) : recordingOwnerByHall[hallId] || '';
      await refreshRoomRecordingStatus(hallId, botId);
    } finally {
      recordingPollBusy = false;
      ensureRoomRecordingPoll();
    }
  }

  function openExistingCapturePluginEntry() {
    var captureButton = root.document && root.document.getElementById('app-observe-button');
    if (!captureButton) {
      recordingError = tr('找不到现有截图与录制插件入口。', 'The existing screenshot and recording plugin entry was not found.');
      if (isOpen) render();
      return false;
    }
    close();
    root.setTimeout(function () {
      if (!captureButton.isConnected || captureButton.hidden || captureButton.disabled) {
        recordingError = tr('请先返回聊天页，再从输入栏打开采集插件。', 'Return to chat and open the capture plugin from the composer.');
        if (isOpen) render();
        return;
      }
      captureButton.click();
      var focusRecordMode = function () {
        var mode = root.document.querySelector('#app-observation-menu [data-observation-mode="record"]');
        if (mode && !mode.hidden) mode.click();
      };
      if (typeof root.requestAnimationFrame === 'function') root.requestAnimationFrame(focusRecordMode);
      else root.setTimeout(focusRecordMode, 0);
    }, 0);
    return true;
  }

  function renderResult(result) {
    var section = node('section', 'obgs-result');
    var winners = Array.isArray(result.winnerBotIds) ? result.winnerBotIds : [];
    append(section, node('h4', 'obgs-subsection-title', winners.length
      ? tr('本局结果 · {names} 获胜', 'Result · {names} won', { names: winners.map(botLabel).join('、') })
      : tr('本局结束', 'Round complete')));
    var reason = resultReason(result.reason);
    if (reason) append(section, node('p', 'obgs-result-reason', reason));
    var scores = result.scores && typeof result.scores === 'object' ? result.scores : {};
    var scoreList = node('ul', 'obgs-score-list');
    Object.keys(scores).forEach(function (id) {
      var line = node('li', 'obgs-score');
      append(line, node('span', '', botLabel(id)));
      append(line, node('strong', '', signed(Number(scores[id]))));
      scoreList.appendChild(line);
    });
    if (scoreList.childElementCount) section.appendChild(scoreList);
    return section;
  }

  function signed(number) { return Number.isFinite(number) && number > 0 ? '+' + number : String(Number.isFinite(number) ? number : 0); }

  function statusBadge(status) {
    var badge = node('span', 'obgs-status obgs-status-' + safeClass(status), statusLabel(status));
    return badge;
  }

  function safeClass(input) { return /^[a-z0-9_-]+$/i.test(String(input || '')) ? String(input) : 'unknown'; }

  function statusLabel(status) {
    return ({ waiting: tr('待开始', 'Waiting'), running: tr('进行中', 'Running'), paused: tr('已暂停', 'Paused'), finished: tr('已结束', 'Finished') })[status] || value(status, tr('未知状态', 'Unknown status'));
  }

  function gameLabel(game) {
    var meta = gameMeta(game);
    if (meta) return tr(meta.name, meta.nameEn);
    return value(game, tr('未指定游戏', 'Unknown game'));
  }

  function renderGameLabel(game) {
    var label = node('span', 'obgs-game-label');
    var meta = gameMeta(game);
    var iconPath = meta && /^assets\/game\/icons\/[a-z0-9-]+\.svg$/.test(String(meta.icon)) ? String(meta.icon) : '';
    if (iconPath) {
      var icon = node('img', 'obgs-game-icon');
      icon.src = iconPath;
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');
      icon.decoding = 'async';
      label.appendChild(icon);
    }
    label.appendChild(node('span', '', gameLabel(game)));
    return label;
  }

  function controllerLabel(controller) {
    return controller === 'model' ? tr('BOT 模型（会产生调用）', 'BOT model (model calls)') : tr('规则 BOT（不调用模型）', 'Rules BOT (no model calls)');
  }

  function communicationLabel(hall) {
    return hall && hall.communication === 'table-talk' ? tr('允许聊天', 'Chat allowed') : tr('安静对局', 'Quiet table');
  }

  function phaseLabel(phase) {
    return ({ bid: tr('叫分', 'Bidding'), play: tr('出牌', 'Playing'), discard: tr('打牌', 'Discarding'), claim: tr('响应', 'Claiming'), auction: tr('竞价', 'Auction'), finished: tr('已结束', 'Finished') })[phase] || value(phase, tr('等待开始', 'Waiting'));
  }

  function roleLabel(role) {
    return ({ landlord: tr('地主', 'Landlord'), farmer: tr('农民', 'Farmer'), east: tr('东风', 'East'), south: tr('南风', 'South'), west: tr('西风', 'West'), north: tr('北风', 'North') })[role] || value(role);
  }

  function meldLabel(type) {
    return ({ chow: tr('吃', 'Chow'), pung: tr('碰', 'Pung'), kong: tr('杠', 'Kong'), 'concealed-kong': tr('暗杠', 'Concealed kong') })[type] || value(type);
  }

  function patternLabel(pattern) {
    return ({ single: tr('单张', 'Single'), pair: tr('对子', 'Pair'), triple: tr('三张', 'Triple'), bomb: tr('炸弹', 'Bomb'), rocket: tr('王炸', 'Rocket'), straight: tr('顺子', 'Straight'), 'pair-run': tr('连对', 'Pair run'), 'triple-run': tr('飞机', 'Triple run'), 'triple-single': tr('三带一', 'Triple with single'), 'triple-pair': tr('三带二', 'Triple with pair'), 'airplane-single': tr('飞机带单', 'Airplane with singles'), 'airplane-pair': tr('飞机带对', 'Airplane with pairs'), 'four-singles': tr('四带二', 'Four with singles'), 'four-pairs': tr('四带两对', 'Four with pairs') })[pattern] || value(pattern);
  }

  function resultReason(reason) {
    return ({ 'hand-empty': tr('一方打完手牌。', 'A side emptied its hand.'), 'discard-win': tr('点炮胡牌。', 'Won on a discard.'), 'self-draw': tr('自摸胡牌。', 'Won by self-draw.'), 'wall-empty': tr('牌墙摸完，本局流局。', 'The wall ran out; the round is a draw.'), 'lots-sold': tr('按藏品估值加同门组合奖励计分；余银不计分。', 'Scored on lot value plus family set bonuses; leftover silver scores nothing.'), 'no-sale': tr('全部藏品流拍，本局无胜者。', 'Every lot went unsold; no winner this round.') })[reason] || value(reason);
  }

  async function submitCommand(input) {
    var bridge = root.grokbot;
    if (!state || !bridge || typeof bridge.gameSpaceCommand !== 'function' || busyAction) return null;
    busyAction = input.type;
    actionError = '';
    showStatus(tr('正在提交…', 'Saving…'));
    render();
    var beforeSpaceIds = new Set(spaces().map(function (space) { return String(space.id); }));
    var beforeHallIds = new Set(halls().map(function (hall) { return String(hall.id); }));
    try {
      var actionHall = input.hallId !== undefined
        ? halls().find(function (hall) { return String(hall.id) === String(input.hallId); })
        : selectedHall();
      var payload = Object.assign({}, input, stateViewOptions(actionHall) || {}, { expectedRevision: state.revision });
      var result = await bridge.gameSpaceCommand(payload);
      if (result && result.ok === false) throw Object.assign(new Error(result.message || tr('牌局操作失败。', 'Game-space command failed.')), { code: result.code });
      var next = result && result.state && Array.isArray(result.state.spaces) ? result.state : result;
      if (next && Array.isArray(next.spaces)) acceptState(next);
      else await refresh();
      if (input.type === 'create-space') {
        var createdSpace = spaces().find(function (space) { return !beforeSpaceIds.has(String(space.id)); });
        if (createdSpace) {
          selectedSpaceId = String(createdSpace.id);
          selectedHallId = '';
          spaceFormOpen = false;
          drafts.spaceName = '';
          drafts.spaceMemberBotIds = [];
        }
      } else if (input.type === 'create-hall') {
        var createdHall = halls().find(function (hall) { return !beforeHallIds.has(String(hall.id)); });
        if (createdHall) {
          selectedHallId = String(createdHall.id);
          hallFormOpen = false;
          drafts.hallName = '';
          drafts.hallBotIds = [];
          drafts.controller = 'rules';
          drafts.communication = 'table-talk';
        }
      } else if (input.type === 'new-round') {
        modelApprovedHalls.delete(String(input.hallId));
      }
      actionError = '';
      if (root.OpenBotGameBenchmark && typeof root.OpenBotGameBenchmark.invalidate === 'function') root.OpenBotGameBenchmark.invalidate();
      showStatus('');
      return result;
    } catch (error) {
      actionError = value(error && error.message, tr('牌局操作失败，请重试。', 'The game-space action failed. Try again.'));
      showStatus(tr('操作失败', 'Action failed'), 'error');
      try { await refresh(); } catch (_) { }
      return null;
    } finally {
      busyAction = '';
      if (isOpen) render();
    }
  }

  function newChatClientMessageId() {
    try {
      if (root.crypto && typeof root.crypto.randomUUID === 'function') return 'ui_' + root.crypto.randomUUID();
    } catch (_) { }
    return 'ui_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 14);
  }

  async function submitChat(channel, scopeKey, retryOnly, restoreFocusAfterSend) {
    var bridge = root.grokbot;
    var space = selectedSpace();
    var hall = channel === 'table' ? selectedHall() : null;
    var submissionSpaceId = space ? String(space.id) : '';
    var submissionHallId = hall ? String(hall.id) : '';
    var composerFocusKey = 'chat-composer-' + scopeKey;
    var sendFocusKey = 'chat-send-' + scopeKey;
    var activeElement = root.document && root.document.activeElement;
    var activeFocusKey = activeElement && activeElement.dataset ? activeElement.dataset.gsFocusKey : '';
    restoreFocusAfterSend = Boolean(restoreFocusAfterSend || activeFocusKey === composerFocusKey || activeFocusKey === sendFocusKey);
    var text = String(chatDrafts[scopeKey] || '').trim();
    var retry = chatRetries[scopeKey];
    if (!space || !text || chatPending[scopeKey]) return null;
    if (channel === 'table' && (!hall || hall.communication !== 'table-talk')) return null;
    if (!bridge || typeof bridge.gameSpaceCommand !== 'function') {
      chatErrors[scopeKey] = tr('聊天接口尚未连接。', 'The chat API is unavailable.');
      render();
      return null;
    }
    var limit = Number(state && state.chat && state.chat.limits && state.chat.limits.humanText) || 280;
    if (chatTextLength(text) > limit) {
      chatErrors[scopeKey] = tr('消息超过 {count} 个字符。', 'Messages are limited to {count} characters.', { count: limit });
      render();
      return null;
    }
    if (retryOnly && (!retry || retry.text !== text)) return null;
    var clientMessageId = retry && retry.text === text ? retry.clientMessageId : newChatClientMessageId();
    var request = {
      type: 'send-chat',
      channel: channel,
      spaceId: String(space.id),
      text: text,
      clientMessageId: clientMessageId
    };
    if (channel === 'table') request.hallId = String(hall.id);
    Object.assign(request, stateViewOptions(hall) || {});
    chatPending[scopeKey] = true;
    chatErrors[scopeKey] = '';
    chatRetries[scopeKey] = { clientMessageId: clientMessageId, text: text };
    render();
    try {
      var result = await bridge.gameSpaceCommand(request);
      if (result && result.ok === false) throw new Error(result.message || tr('发送聊天消息失败。', 'Could not send the chat message.'));
      var next = statePayload(result);
      acceptState(next);
      if (String(chatDrafts[scopeKey] || '').trim() === text) chatDrafts[scopeKey] = '';
      chatErrors[scopeKey] = '';
      chatRetries[scopeKey] = null;
      chatFollowLatest[scopeKey] = true;
      return result;
    } catch (error) {
      chatErrors[scopeKey] = value(error && error.message, tr('发送失败，请重试。', 'Message failed to send. Try again.'));
      return null;
    } finally {
      chatPending[scopeKey] = false;
      if (restoreFocusAfterSend && chatScopeIsRendered(channel, scopeKey, submissionSpaceId, submissionHallId)) {
        var focusAtCompletion = root.document && root.document.activeElement;
        var completionFocusKey = focusAtCompletion && focusAtCompletion.dataset ? focusAtCompletion.dataset.gsFocusKey : '';
        var focusWasLostToPendingRender = !focusAtCompletion || focusAtCompletion === root.document.body || focusAtCompletion === dialog;
        if (focusWasLostToPendingRender || completionFocusKey === composerFocusKey || completionFocusKey === sendFocusKey) {
          chatFocusComposerKey = composerFocusKey;
        }
      }
      if (isOpen) render();
    }
  }

  async function submitPause(hallId) {
    var bridge = root.grokbot;
    if (!bridge || typeof bridge.gameSpaceState !== 'function' || typeof bridge.gameSpaceCommand !== 'function' || pauseAction) return null;
    pauseAction = true;
    actionError = '';
    showStatus(tr('正在暂停…', 'Pausing…'));
    render();
    try {
      for (var attempt = 0; attempt < 2; attempt++) {
        var pauseHall = halls().find(function (hall) { return String(hall.id) === String(hallId); });
        var latest = statePayload(await bridge.gameSpaceState(stateViewOptions(pauseHall) || undefined));
        if (!isOpen) return null;
        acceptState(latest);
        var currentHall = halls().find(function (hall) { return String(hall.id) === String(hallId); });
        if (!currentHall) throw new Error(tr('找不到这张牌局。', 'This table is no longer available.'));
        if (currentHall.status !== 'running') {
          showStatus('');
          return state;
        }
        try {
          var result = await bridge.gameSpaceCommand(Object.assign({
            type: 'pause',
            hallId: currentHall.id,
            expectedRevision: state.revision
          }, stateViewOptions(currentHall) || {}));
          if (result && result.ok === false) {
            throw Object.assign(new Error(result.message || tr('暂停牌局失败。', 'Could not pause the table.')), { code: result.code });
          }
          if (result && result.state && Array.isArray(result.state.halls)) acceptState(statePayload(result));
          else if (result && Array.isArray(result.halls)) acceptState(statePayload(result));
          else await refresh();
          actionError = '';
          if (root.OpenBotGameBenchmark && typeof root.OpenBotGameBenchmark.invalidate === 'function') root.OpenBotGameBenchmark.invalidate();
          showStatus('');
          return result;
        } catch (error) {
          if (error && error.code === 'GAME_STALE_REVISION' && attempt === 0) continue;
          throw error;
        }
      }
    } catch (error) {
      actionError = value(error && error.message, tr('暂停牌局失败，请重试。', 'Could not pause the table. Try again.'));
      showStatus(tr('操作失败', 'Action failed'), 'error');
      try { await refresh(); } catch (_) { }
      return null;
    } finally {
      pauseAction = false;
      if (isOpen) render();
    }
    return null;
  }

  function requestStart(hall) {
    if (!hall) return;
    var hallId = String(hall.id);
    if (hall.controller === 'model' && !modelApprovedHalls.has(hallId)) {
      pendingModelHallId = hallId;
      render();
      var confirm = dialog && dialog.querySelector('[data-gs-action="confirm-model-start"]');
      if (confirm) confirm.focus();
      return;
    }
    submitCommand({ type: 'start', hallId: hall.id });
  }

  async function loadReplay(hallId, roundId, turn) {
    var bridge = root.grokbot;
    if (!bridge || typeof bridge.gameSpaceReplay !== 'function') {
      actionError = tr('回放接口尚未连接。', 'Replay API is unavailable.');
      render();
      return;
    }
    var requestId = ++replayId;
    replayData = null;
    replayTurn = Number(turn) || 0;
    replayRoundId = String(roundId || '');
    render();
    try {
      var replayHall = halls().find(function (hall) { return String(hall.id) === String(hallId); });
      var replayOptions = { hallId: hallId, roundId: roundId, turn: replayTurn };
      var replayViewer = replayHall && needsPerspective(replayHall) ? ensureViewerBot(replayHall) : '';
      if (replayViewer) replayOptions.viewBotId = replayViewer;
      var result = await bridge.gameSpaceReplay(replayOptions);
      if (!isOpen || requestId !== replayId) return;
      if (result && result.ok === false) throw new Error(result.message || tr('读取回放失败。', 'Could not load replay.'));
      replayData = result;
      if (Number.isFinite(Number(result.turn))) replayTurn = Number(result.turn);
      actionError = '';
      render();
    } catch (error) {
      if (!isOpen || requestId !== replayId) return;
      actionError = value(error && error.message, tr('读取回放失败。', 'Could not load replay.'));
      render();
    }
  }

  function onClick(event) {
    var target = event.target && event.target.closest ? event.target.closest('[data-gs-action]') : null;
    if (!target || !dialog.contains(target)) return;
    var action = target.dataset.gsAction;
    if (action === 'close') { close(); return; }
    if (action === 'toggle-chat') {
      chatPanelState = isChatPanelVisible() ? 'closed' : 'open';
      render();
      return;
    }
    if (action === 'select-chat-channel') {
      if (target.disabled) return;
      activeChatChannel = target.dataset.gsChatChannel === 'lobby' ? 'lobby' : 'table';
      render();
      return;
    }
    if (action === 'quick-chat') {
      var quickSpace = selectedSpace();
      var quickHall = selectedHall();
      if (!quickSpace) return;
      var quickChannel = quickHall ? activeChatChannel : 'lobby';
      var quickScopeKey = chatScopeKey(quickChannel, String(quickSpace.id), quickHall ? String(quickHall.id) : '');
      chatDrafts[quickScopeKey] = String(target.dataset.gsQuickText || '');
      chatErrors[quickScopeKey] = '';
      if (chatRetries[quickScopeKey] && chatRetries[quickScopeKey].text !== chatDrafts[quickScopeKey]) chatRetries[quickScopeKey] = null;
      chatFocusComposerKey = 'chat-composer-' + quickScopeKey;
      render();
      return;
    }
    if (action === 'retry-chat') {
      var retrySpace = selectedSpace();
      var retryHall = selectedHall();
      var retryChannel = retryHall ? activeChatChannel : 'lobby';
      var retryScopeKey = String(target.dataset.gsChatScopeKey || '');
      if (retrySpace && retryScopeKey) submitChat(retryChannel, retryScopeKey, true);
      return;
    }
    if (action === 'chat-latest') {
      var latestLog = dialog.querySelector('.obgs-chat-log');
      if (latestLog) {
        latestLog.scrollTop = latestLog.scrollHeight;
        chatScrollState[latestLog.dataset.gsChatScopeKey] = { top: latestLog.scrollTop, stickToBottom: true };
        markChatRead(latestLog.dataset.gsChatChannel, latestLog.dataset.gsChatSpaceId, latestLog.dataset.gsChatHallId,
          chatMessages(latestLog.dataset.gsChatChannel, latestLog.dataset.gsChatChannel === 'table' ? latestLog.dataset.gsChatHallId : latestLog.dataset.gsChatSpaceId));
      }
      updateChatUnreadBadges();
      target.remove();
      return;
    }
    if (action === 'focus-chat-message') {
      var bubbleMessageId = String(target.dataset.gsChatMessageId || '');
      if (!bubbleMessageId) return;
      activeChatChannel = 'table';
      chatPanelState = 'open';
      chatFocusMessageId = bubbleMessageId;
      render();
      return;
    }
    if (action === 'focus-chat-sender') {
      var senderHall = selectedHall();
      var senderId = String(target.dataset.gsBotId || '');
      if (!senderHall || !senderId) return;
      var senderMessages = chatMessages('table', senderHall.id);
      for (var senderIndex = senderMessages.length - 1; senderIndex >= 0; senderIndex--) {
        if (senderMessages[senderIndex].sender.id === senderId) {
          activeChatChannel = 'table';
          chatPanelState = 'open';
          chatFocusMessageId = String(senderMessages[senderIndex].id);
          render();
          return;
        }
      }
      return;
    }
    if (action === 'retry') { refresh(); return; }
    if (action === 'clear-space-search') { viewFilters.spaceQuery = ''; render(); return; }
    if (action === 'clear-hall-filters') {
      viewFilters.hallQuery = '';
      viewFilters.hallGame = 'all';
      viewFilters.hallStatus = 'all';
      render();
      return;
    }
    if (action === 'select-view') {
      var nextView = target.dataset.gsView;
      if (nextView === 'hall' || nextView === 'leaderboard') {
        activeView = nextView;
        if (nextView === 'hall' && root.OpenBotGameBenchmark && typeof root.OpenBotGameBenchmark.invalidate === 'function') root.OpenBotGameBenchmark.invalidate();
        render();
        if (nextView === 'hall' && !state) refresh();
      }
      return;
    }
    if (action === 'toggle-space-form') {
      spaceFormOpen = !spaceFormOpen;
      if (spaceFormOpen) { hallFormOpen = false; drafts.spaceName = ''; drafts.spaceMemberBotIds = []; }
      render();
      return;
    }
    if (action === 'toggle-hall-form') {
      hallFormOpen = !hallFormOpen;
      if (hallFormOpen) {
        spaceFormOpen = false;
        drafts.hallName = '';
        drafts.hallBotIds = [];
        drafts.controller = 'rules';
      }
      render();
      return;
    }
    if (action === 'cancel-space-form') { spaceFormOpen = false; render(); return; }
    if (action === 'cancel-hall-form') { hallFormOpen = false; render(); return; }
    if (action === 'select-space') {
      selectedSpaceId = String(target.dataset.gsSpaceId || '');
      var nextHalls = hallsFor(selectedSpaceId);
      selectedHallId = nextHalls.length ? String(nextHalls[0].id) : '';
      recordingSetupHallId = '';
      hallFormOpen = false;
      replayOpen = false;
      pendingModelHallId = '';
      render();
      if (selectedHall()) refresh();
      return;
    }
    if (action === 'select-hall') {
      selectedHallId = String(target.dataset.gsHallId || '');
      recordingSetupHallId = '';
      replayOpen = false;
      replayData = null;
      pendingModelHallId = '';
      render();
      if (selectedHall() && needsPerspective(selectedHall())) refresh();
      return;
    }
    if (action === 'toggle-recording-setup') {
      var setupHallId = String(target.dataset.gsHallId || selectedHallId || '');
      if (isRoomRecordingActive(recordingActive) && activeRecordingHallId(recordingActive) !== setupHallId) return;
      recordingSetupHallId = recordingSetupHallId === setupHallId ? '' : setupHallId;
      if (recordingSetupHallId) {
        recordingBots = [];
        recordingRecords = [];
        recordingStatus = null;
        recordingStatusLoaded = false;
        recordingStatusError = '';
      }
      recordingError = '';
      render();
      if (recordingSetupHallId) {
        refreshRoomRecordingStatus(setupHallId, recordingOwnerByHall[setupHallId] || '');
        refreshRoomRecordingPluginStatus();
      }
      return;
    }
    if (action === 'start-room-recording') {
      startRoomRecording(String(target.dataset.gsHallId || selectedHallId));
      return;
    }
    if (action === 'stop-room-recording') {
      stopRoomRecording(String(target.dataset.gsHallId || selectedHallId));
      return;
    }
    if (action === 'open-capture-plugin') {
      openExistingCapturePluginEntry();
      return;
    }
    if (action === 'preview-room-recording') {
      openRoomRecordingPreview(findRoomRecording(target.dataset.gsRecordingId));
      return;
    }
    if (action === 'attach-room-recording') {
      attachRoomRecording(findRoomRecording(target.dataset.gsRecordingId));
      return;
    }
    if (action === 'confirm-model-start') {
      var confirmedHall = selectedHall();
      if (confirmedHall && String(confirmedHall.id) === pendingModelHallId) {
        modelApprovedHalls.add(String(confirmedHall.id));
        pendingModelHallId = '';
        submitCommand({ type: 'start', hallId: confirmedHall.id });
      }
      return;
    }
    if (action === 'cancel-model-start') { pendingModelHallId = ''; render(); return; }
    if (action === 'start' || action === 'resume') { requestStart(selectedHall()); return; }
    if (action === 'pause') {
      var activeHall = selectedHall();
      if (activeHall) submitPause(activeHall.id);
      return;
    }
    if (action === 'step' || action === 'new-round') {
      var hall = selectedHall();
      if (!hall) return;
      if (action === 'new-round' && hall.controller === 'model') modelApprovedHalls.delete(String(hall.id));
      submitCommand({ type: action === 'new-round' ? 'new-round' : action, hallId: hall.id });
      return;
    }
    if (action === 'toggle-replay') {
      var replayHall = selectedHall();
      if (!replayHall) return;
      replayOpen = !replayOpen;
      actionError = '';
      if (!replayOpen) { replayData = null; replayRoundId = ''; }
      else {
        var rounds = Array.isArray(replayHall.rounds) ? replayHall.rounds : [];
        var lastRound = rounds[rounds.length - 1];
        if (lastRound && lastRound.id !== undefined) loadReplay(replayHall.id, lastRound.id, 0);
      }
      render();
      return;
    }
  }

  function onInput(event) {
    var target = event.target;
    if (!target) return;
    if (target.dataset.gsChatComposer === 'true') {
      var scopeKey = target.dataset.gsChatScopeKey;
      var draft = String(target.value || '');
      chatDrafts[scopeKey] = draft;
      if (event.isComposing) chatComposingKey = scopeKey;
      if (chatRetries[scopeKey] && chatRetries[scopeKey].text !== draft.trim()) chatRetries[scopeKey] = null;
      if (chatErrors[scopeKey]) chatErrors[scopeKey] = '';
      var form = target.closest('form');
      var maxText = Number(state && state.chat && state.chat.limits && state.chat.limits.humanText) || 280;
      var length = chatTextLength(draft);
      var counter = form && form.querySelector('[data-gs-chat-count]');
      var send = form && form.querySelector('.obgs-chat-send');
      if (counter) {
        counter.textContent = length + ' / ' + maxText;
        counter.classList.toggle('is-over-limit', length > maxText);
      }
      if (send) send.disabled = Boolean(target.disabled || chatPending[scopeKey] || !draft.trim() || length > maxText);
      var error = form && form.querySelector('.obgs-chat-error');
      if (error && !chatErrors[scopeKey]) error.remove();
      return;
    }
    if (target.dataset.gsSearch) {
      viewFilters[target.dataset.gsSearch] = target.value;
      if (event.isComposing) composingSearchKey = target.dataset.gsSearch;
      if (composingSearchKey === target.dataset.gsSearch) return;
      render();
      return;
    }
    if (target.dataset.gsDraft === 'spaceName') drafts.spaceName = target.value;
    else if (target.dataset.gsDraft === 'hallName') drafts.hallName = target.value;
    else if (target.dataset.gsDraft === 'gameId') drafts.gameId = String(target.value || '');
    else if (target.dataset.gsDraft === 'controller') drafts.controller = target.value === 'model' ? 'model' : 'rules';
    else if (target.dataset.gsDraft === 'communication') drafts.communication = target.value === 'silent' ? 'silent' : 'table-talk';
    if (target.dataset.gsDraft && (event.isComposing || composingSearchKey === 'draft:' + target.dataset.gsDraft)) {
      composingSearchKey = 'draft:' + target.dataset.gsDraft;
      return;
    }
  }

  function onCompositionStart(event) {
    var target = event.target;
    if (!target || !target.dataset) return;
    if (target.dataset.gsSearch) composingSearchKey = target.dataset.gsSearch;
    else if (target.dataset.gsBenchmarkSearch === 'true') composingSearchKey = 'benchmark-search';
    else if (target.dataset.gsChatComposer === 'true') chatComposingKey = target.dataset.gsChatScopeKey;
    else if (target.dataset.gsDraft === 'spaceName' || target.dataset.gsDraft === 'hallName') composingSearchKey = 'draft:' + target.dataset.gsDraft;
  }

  function onCompositionEnd(event) {
    var target = event.target;
    if (!target || !target.dataset) return;
    var key = target.dataset.gsSearch || (target.dataset.gsBenchmarkSearch === 'true' ? 'benchmark-search' : '');
    if (!key && (target.dataset.gsDraft === 'spaceName' || target.dataset.gsDraft === 'hallName')) key = 'draft:' + target.dataset.gsDraft;
    if (target.dataset.gsChatComposer === 'true') {
      var chatKey = target.dataset.gsChatScopeKey;
      if (chatKey !== chatComposingKey) return;
      chatDrafts[chatKey] = String(target.value || '');
      chatComposingKey = '';
      root.setTimeout(function () { if (isOpen) render(); }, 0);
      return;
    }
    if (key !== composingSearchKey) return;
    if (target.dataset.gsSearch) viewFilters[key] = target.value;
    else if (target.dataset.gsDraft === 'spaceName') drafts.spaceName = target.value;
    else if (target.dataset.gsDraft === 'hallName') drafts.hallName = target.value;
    composingSearchKey = '';
    // Let the browser deliver the final non-composing input event first.
    root.setTimeout(function () { if (isOpen) render(); }, 0);
  }

  function onChange(event) {
    var target = event.target;
    if (!target) return;
    if (target.dataset.gsRecordingOwner !== undefined) {
      var recordingHallId = String(target.dataset.gsRecordingOwner || '');
      recordingOwnerByHall[recordingHallId] = String(target.value || '');
      recordingError = '';
      recordingRecords = [];
      recordingStatus = null;
      recordingStatusLoaded = false;
      recordingStatusError = '';
      render();
      refreshRoomRecordingStatus(recordingHallId, recordingOwnerByHall[recordingHallId]);
    } else if (target.dataset.gsRecordingDuration !== undefined) {
      var duration = Number(target.value);
      if ([30, 60, 120, 180].indexOf(duration) >= 0) recordingDurationByHall[String(target.dataset.gsRecordingDuration)] = duration;
      render();
    } else if (target.dataset.gsViewFilter) {
      viewFilters[target.dataset.gsViewFilter] = target.value;
      render();
    } else if (target.hasAttribute('data-gs-skin-select')) {
      applySkinPreference(target.value, true);
    } else if (target.dataset.gsViewBot) {
      var viewerHall = selectedHall();
      if (!viewerHall || !needsPerspective(viewerHall)) return;
      var candidate = String(target.value);
      var knownBots = Array.isArray(viewerHall.botIds) ? viewerHall.botIds.map(String) : [];
      if (knownBots.indexOf(candidate) < 0) return;
      viewBotByHall[String(viewerHall.id)] = candidate;
      if (replayOpen && replayRoundId) loadReplay(viewerHall.id, replayRoundId, replayTurn);
      else refresh();
    } else if (target.dataset.gsField === 'space-member') {
      var spaceId = String(target.value);
      var spaceIds = drafts.spaceMemberBotIds.slice();
      if (target.checked && spaceIds.indexOf(spaceId) < 0) spaceIds.push(spaceId);
      if (!target.checked) spaceIds = spaceIds.filter(function (id) { return id !== spaceId; });
      drafts.spaceMemberBotIds = spaceIds;
      render();
    } else if (target.dataset.gsField === 'hall-bot') {
      var hallId = String(target.value);
      var hallIds = drafts.hallBotIds.slice();
      var seatMeta = gameMeta(drafts.gameId);
      var seatLimit = seatMeta ? Number(seatMeta.maxSeats) : 0;
      if (target.checked && hallIds.indexOf(hallId) < 0 && hallIds.length < seatLimit) hallIds.push(hallId);
      if (!target.checked) hallIds = hallIds.filter(function (id) { return id !== hallId; });
      drafts.hallBotIds = hallIds;
      render();
    } else if (target.dataset.gsDraft === 'gameId') {
      drafts.gameId = String(target.value || '');
      var nextMeta = gameMeta(drafts.gameId);
      // Keep the selection but never carry more seats than the new game allows.
      if (nextMeta) drafts.hallBotIds = drafts.hallBotIds.slice(0, Number(nextMeta.maxSeats));
      render();
    } else if (target.dataset.gsDraft === 'controller') {
      drafts.controller = target.value === 'model' ? 'model' : 'rules';
      render();
    } else if (target.dataset.gsDraft === 'communication') {
      drafts.communication = target.value === 'silent' ? 'silent' : 'table-talk';
    } else if (target.dataset.gsReplayRound) {
      var roundHall = selectedHall();
      if (roundHall) loadReplay(roundHall.id, target.value, 0);
    } else if (target.dataset.gsReplayTurn) {
      var currentHall = selectedHall();
      if (currentHall) loadReplay(currentHall.id, replayRoundId, Number(target.value));
    }
  }

  function onSubmit(event) {
    var form = event.target;
    if (!form || !form.dataset) return;
    if (form.dataset.gsChatForm === 'true') {
      event.preventDefault();
      var channel = activeChatChannel;
      var hall = selectedHall();
      var space = selectedSpace();
      if (!space) return;
      if (!hall) channel = 'lobby';
      var scopeKey = chatScopeKey(channel, String(space.id), hall ? String(hall.id) : '');
      var expectedComposerKey = 'chat-composer-' + scopeKey;
      var expectedSendKey = 'chat-send-' + scopeKey;
      var activeFocusKey = root.document.activeElement && root.document.activeElement.dataset
        ? root.document.activeElement.dataset.gsFocusKey : '';
      var submitterFocusKey = event.submitter && event.submitter.dataset ? event.submitter.dataset.gsFocusKey : '';
      var restoreFocus = [expectedComposerKey, expectedSendKey].indexOf(activeFocusKey) >= 0
        || [expectedComposerKey, expectedSendKey].indexOf(submitterFocusKey) >= 0;
      submitChat(channel, scopeKey, false, restoreFocus);
      return;
    }
    if (!form.dataset.gsForm) return;
    event.preventDefault();
    if (form.dataset.gsForm === 'space') {
      var name = drafts.spaceName.trim();
      if (!name || drafts.spaceMemberBotIds.length < 2) {
        actionError = tr('请输入空间名称，并至少选择 2 个 BOT。', 'Enter a space name and select at least 2 BOTs.');
        render();
        return;
      }
      submitCommand({ type: 'create-space', name: name, memberBotIds: drafts.spaceMemberBotIds.slice() });
    } else if (form.dataset.gsForm === 'hall') {
      var hallName = drafts.hallName.trim();
      var chosenGame = gameMeta(drafts.gameId) || games()[0] || null;
      if (!hallName || !chosenGame || !canSeat(chosenGame, drafts.hallBotIds.length)) {
        actionError = chosenGame
          ? tr('请输入牌局名称；{game} 需要 {seats}。', 'Enter a table name; {game} needs {seats}.', { game: gameLabel(chosenGame.id), seats: gameSeatsText(chosenGame) })
          : tr('当前没有已注册的游戏。', 'No game is registered.');
        render();
        return;
      }
      submitCommand({ type: 'create-hall', spaceId: selectedSpaceId, name: hallName, gameId: chosenGame.id, botIds: drafts.hallBotIds.slice(), controller: drafts.controller, communication: drafts.communication === 'silent' ? 'silent' : 'table-talk' });
    }
  }

  function open(options) {
    ensureDialog();
    if (isOpen) { refresh(); return Promise.resolve(state); }
    options = options || {};
    opener = options.opener || root.document.activeElement;
    isOpen = true;
    chatOpenedAt = Date.now();
    chatPanelState = 'auto';
    chatComposingKey = '';
    seedChatReadState();
    if (speechRefreshTimer) root.clearTimeout(speechRefreshTimer);
    speechRefreshTimer = null;
    replayId += 1;
    stateError = '';
    actionError = '';
    replayOpen = false;
    replayData = null;
    try {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } catch (_) { dialog.setAttribute('open', ''); }
    subscribe();
    render();
    root.setTimeout(function () { if (isOpen && closeButton) closeButton.focus(); }, 0);
    var load = refresh();
    load.then(function () {
      if (isOpen && selectedHall()) refreshRoomRecordingStatus(String(selectedHall().id), recordingOwnerByHall[String(selectedHall().id)] || '');
    });
    return load;
  }

  function safeSpectatorHall(input) {
    if (!input || typeof input !== 'object') return null;
    function text(item, max) { return typeof item === 'string' || typeof item === 'number' ? String(item).slice(0, max || 160) : ''; }
    function number(item, fallback) { var n = Number(item); return Number.isFinite(n) ? n : fallback === undefined ? 0 : fallback; }
    function boundedList(items, limit, maxLength) {
      return Array.isArray(items) ? items.slice(0, limit).filter(function (item) { return typeof item === 'string' || typeof item === 'number'; }).map(function (item) { return String(item).slice(0, maxLength || 80); }) : [];
    }
    function safePieces(items) {
      return Array.isArray(items) ? items.slice(0, 64).filter(function (item) { return typeof item === 'string' || typeof item === 'number'; }).map(function (item) { return String(item).slice(0, 40); }) : [];
    }
    var rawTable = input.table && typeof input.table === 'object' ? input.table : null;
    var rawResult = input.result && typeof input.result === 'object' ? input.result : rawTable && rawTable.result;
    var hasResult = Boolean(rawResult && typeof rawResult === 'object');
    var knownGames = ['doudizhu', 'mahjong', 'sealed-bid', 'rails', 'tycoon', 'caravan', 'lantern-watch'];
    var gameId = knownGames.indexOf(input.game) >= 0 ? input.game : 'unknown';
    var players = rawTable && Array.isArray(rawTable.players) ? rawTable.players.slice(0, 8).map(function (player) {
      if (!player || typeof player !== 'object') return null;
      var safePlayer = { botId: text(player.botId, 128), count: Number(player.count) || 0 };
      if (typeof player.name === 'string') safePlayer.name = text(player.name, 100);
      if (gameId === 'rails') {
        safePlayer.trains = Math.max(0, number(player.trains));
        safePlayer.routes = Math.max(0, number(player.routes));
        if (hasResult && Array.isArray(player.tickets)) safePlayer.tickets = boundedList(player.tickets, 24, 120);
      } else if (gameId === 'tycoon') {
        safePlayer.cash = number(player.cash);
        safePlayer.position = Math.max(0, Math.min(23, Math.floor(number(player.position))));
        safePlayer.bankrupt = player.bankrupt === true;
        safePlayer.properties = Array.isArray(player.properties) ? player.properties.slice(0, 24).map(function (item) { return Math.max(0, Math.min(23, Math.floor(number(item)))); }) : [];
        safePlayer.netWorth = number(player.netWorth);
      } else if (gameId === 'caravan') {
        safePlayer.wagons = Math.max(0, number(player.wagons));
        safePlayer.routePoints = number(player.routePoints);
        safePlayer.contractCount = Math.max(0, number(player.contractCount));
        safePlayer.claimed = Math.max(0, number(player.claimed));
        // An empty hand is public state; a non-empty hand stays concealed here.
        if (safePlayer.count === 0) safePlayer.hand = [];
      } else if (gameId === 'lantern-watch') {
        safePlayer.score = number(player.score);
        safePlayer.isWatchman = player.isWatchman === true;
        safePlayer.deployed = player.deployed === true;
      } else {
        if (typeof player.role === 'string') safePlayer.role = text(player.role, 40);
        if (Array.isArray(player.melds)) safePlayer.melds = player.melds.slice(0, 8).map(function (meld) {
          return meld && typeof meld === 'object' ? { type: text(meld.type, 40), tiles: safePieces(meld.tiles) } : null;
        }).filter(Boolean);
      }
      return safePlayer.botId ? safePlayer : null;
    }).filter(Boolean) : [];
    var botList = Array.isArray(input.bots) ? input.bots.slice(0, 20).filter(function (bot) {
      return bot && bot.id !== undefined && bot.id !== null;
    }).map(function (bot) {
      return { id: text(bot.id, 128), name: text(bot.name, 100) || text(bot.id, 128), avatar: text(bot.avatar, 120), color: safeColor(bot.color) };
    }) : [];
    players.forEach(function (player) {
      if (!botList.some(function (bot) { return bot.id === player.botId; })) {
        botList.push({ id: player.botId, name: player.name || player.botId, avatar: '', color: '' });
      }
    });
    var safeHall = {
      id: text(input.id, 128),
      name: text(input.name, 120) || tr('牌局', 'Table'),
      game: gameId,
      status: text(input.status, 40),
      controller: input.controller === 'model' ? 'model' : 'rules',
      botIds: Array.isArray(input.botIds) ? input.botIds.slice(0, 8).map(function (id) { return text(id, 128); }).filter(Boolean) : players.map(function (player) { return player.botId; }),
      bots: botList,
      messages: Array.isArray(input.messages) ? input.messages.slice(-60).filter(function (message) { return message && typeof message === 'object'; }).map(function (message) {
        return { botId: text(message.botId, 128), text: text(message.text, 1200) };
      }) : []
    };
    if (rawTable) {
      var safeTable = { players: players, turn: Number(rawTable.turn) || 0, phase: text(rawTable.phase, 40), currentBotId: text(rawTable.currentBotId, 128) };
      if (['doudizhu', 'mahjong', 'sealed-bid'].indexOf(gameId) >= 0) {
        if (Number.isFinite(Number(rawTable.wallRemaining))) safeTable.wallRemaining = Math.max(0, Number(rawTable.wallRemaining));
        if (Array.isArray(rawTable.discards)) safeTable.discards = rawTable.discards.slice(-120).filter(function (item) { return item && typeof item === 'object'; }).map(function (item) {
          return { botId: text(item.botId, 128), tile: text(item.tile, 40) };
        });
        if (rawTable.pending && typeof rawTable.pending === 'object') safeTable.pending = { botId: text(rawTable.pending.botId, 128), tile: text(rawTable.pending.tile, 40) };
        if (Array.isArray(rawTable.bottom)) safeTable.bottom = safePieces(rawTable.bottom);
        if (Array.isArray(rawTable.bids)) safeTable.bids = rawTable.bids.slice(0, 8).filter(function (item) { return item && typeof item === 'object'; }).map(function (item) {
          return { botId: text(item.botId, 128), amount: Number(item.amount) || 0 };
        });
        if (rawTable.lastPlay && typeof rawTable.lastPlay === 'object') safeTable.lastPlay = {
          botId: text(rawTable.lastPlay.botId, 128), label: text(rawTable.lastPlay.label, 40), cards: safePieces(rawTable.lastPlay.cards)
        };
        if (Number.isFinite(Number(rawTable.multiplier))) safeTable.multiplier = Math.max(1, Number(rawTable.multiplier));
      }
      if (gameId === 'rails') {
        safeTable.market = Array.isArray(rawTable.market) ? rawTable.market.slice(0, 5).map(function (item) { return typeof item === 'string' || typeof item === 'number' ? text(item, 40) : null; }) : [];
        ['deckCount', 'discardCount', 'ticketDeckCount'].forEach(function (key) { safeTable[key] = Math.max(0, number(rawTable[key])); });
        safeTable.routes = Array.isArray(rawTable.routes) ? rawTable.routes.slice(0, 64).map(function (route) {
          return route && typeof route === 'object' ? { id: text(route.id, 40), from: text(route.from, 80), to: text(route.to, 80), color: text(route.color, 20), length: Math.max(0, number(route.length)), claimedBy: route.claimedBy ? text(route.claimedBy, 128) : null } : null;
        }).filter(Boolean) : [];
      } else if (gameId === 'tycoon') {
        safeTable.tiles = Array.isArray(rawTable.tiles) ? rawTable.tiles.slice(0, 24).map(function (tile) {
          return tile && typeof tile === 'object' ? { index: Math.max(0, Math.min(23, Math.floor(number(tile.index)))), name: text(tile.name, 80), kind: text(tile.kind, 24), group: tile.group ? text(tile.group, 24) : null, price: Number.isFinite(Number(tile.price)) ? Number(tile.price) : null, owner: tile.owner ? text(tile.owner, 128) : null, level: Math.max(0, Math.min(3, Math.floor(number(tile.level)))) } : null;
        }).filter(Boolean) : [];
        if (rawTable.lastRoll && typeof rawTable.lastRoll === 'object') safeTable.lastRoll = { botId: text(rawTable.lastRoll.botId, 128), dice: Array.isArray(rawTable.lastRoll.dice) ? rawTable.lastRoll.dice.slice(0, 2).map(function (die) { return Math.max(1, Math.min(6, Math.floor(number(die, 1)))); }) : [] };
        if (rawTable.lastEvent && typeof rawTable.lastEvent === 'object') safeTable.lastEvent = { botId: text(rawTable.lastEvent.botId, 128), text: text(rawTable.lastEvent.text, 240) };
        safeTable.eventDeckCount = Math.max(0, number(rawTable.eventDeckCount));
      } else if (gameId === 'caravan') {
        safeTable.season = rawTable.season && typeof rawTable.season === 'object' ? { index: Math.max(0, number(rawTable.season.index)), hot: text(rawTable.season.hot, 24), order: boundedList(rawTable.season.order, 8, 24), roundsPerSeason: Math.max(0, number(rawTable.season.roundsPerSeason)) } : null;
        var supply = rawTable.supply && typeof rawTable.supply === 'object' ? rawTable.supply : {};
        safeTable.supply = { deck: Math.max(0, number(supply.deck)), discard: Math.max(0, number(supply.discard)), market: boundedList(supply.market, 8, 40), contractDeck: Math.max(0, number(supply.contractDeck)) };
        safeTable.finalTurns = rawTable.finalTurns === null ? null : Math.max(0, number(rawTable.finalTurns));
        safeTable.wagonStart = Math.max(0, number(rawTable.wagonStart));
        safeTable.routes = Array.isArray(rawTable.routes) ? rawTable.routes.slice(0, 64).map(function (route) {
          return route && typeof route === 'object' ? { id: text(route.id, 40), from: text(route.from, 80), to: text(route.to, 80), length: Math.max(0, number(route.length)), color: text(route.color, 24), ownerBotId: route.ownerBotId ? text(route.ownerBotId, 128) : null, points: Math.max(0, number(route.points)) } : null;
        }).filter(Boolean) : [];
      } else if (gameId === 'lantern-watch') {
        safeTable.candidates = Array.isArray(rawTable.candidates) ? rawTable.candidates.slice(0, 4).map(function (item) {
          return item && typeof item === 'object' ? { tower: Math.max(0, Math.min(3, Math.floor(number(item.tower)))), id: text(item.id, 24), label: text(item.label, 40), labelEn: text(item.labelEn, 40), needed: Math.max(0, Math.floor(number(item.needed))) } : null;
        }).filter(Boolean) : [];
        safeTable.towers = Array.isArray(rawTable.towers) ? rawTable.towers.slice(0, 4).map(function (item) {
          return item && typeof item === 'object' ? { index: Math.max(0, Math.min(3, Math.floor(number(item.index)))), id: text(item.id, 24), label: text(item.label, 40), labelEn: text(item.labelEn, 40), isCandidate: item.isCandidate === true } : null;
        }).filter(Boolean) : [];
        safeTable.lampCounts = hasResult && Array.isArray(rawTable.lampCounts) ? rawTable.lampCounts.slice(0, 4).map(function (count) { return Math.max(0, Math.min(2, Math.floor(number(count)))); }) : null;
        if (Array.isArray(rawTable.heldTowers)) safeTable.heldTowers = rawTable.heldTowers.slice(0, 4).map(function (tower) { return Math.max(0, Math.min(3, Math.floor(number(tower)))); });
        safeTable.lampsAvailable = Math.max(0, number(rawTable.lampsAvailable));
        if (rawTable.lastRound && typeof rawTable.lastRound === 'object') safeTable.lastRound = {
          held: rawTable.lastRound.held === true,
          stormTower: Number.isFinite(Number(rawTable.lastRound.stormTower)) ? Math.max(0, Math.min(3, Math.floor(number(rawTable.lastRound.stormTower)))) : null,
          stormTowerLabel: text(rawTable.lastRound.stormTowerLabel, 40),
          stormTowerLabelEn: text(rawTable.lastRound.stormTowerLabelEn, 40),
          heldTowers: Array.isArray(rawTable.lastRound.heldTowers) ? rawTable.lastRound.heldTowers.slice(0, 4).map(function (tower) { return Math.max(0, Math.min(3, Math.floor(number(tower)))); }) : []
        };
      }
      safeHall.table = safeTable;
    }
    if (hasResult) {
      var scores = {};
      if (rawResult.scores && typeof rawResult.scores === 'object') Object.keys(rawResult.scores).slice(0, 8).forEach(function (id) {
        var score = Number(rawResult.scores[id]);
        if (Number.isFinite(score)) scores[text(id, 128)] = score;
      });
      safeHall.result = {
        winnerBotIds: Array.isArray(rawResult.winnerBotIds) ? rawResult.winnerBotIds.slice(0, 8).map(function (id) { return text(id, 128); }) : [],
        reason: text(rawResult.reason, 100),
        scores: scores
      };
      if (gameId === 'caravan' && Array.isArray(rawResult.details)) {
        safeHall.result.details = rawResult.details.slice(0, 8).map(function (row) {
          return row && typeof row === 'object' ? {
            botId: text(row.botId, 128), routePoints: number(row.routePoints), claimed: Math.max(0, number(row.claimed)),
            spent: Math.max(0, number(row.spent)), wagons: Math.max(0, number(row.wagons)),
            contracts: Array.isArray(row.contracts) ? row.contracts.slice(0, 16).map(function (contract) { return contract && typeof contract === 'object' ? { value: number(contract.value), done: contract.done === true } : null; }).filter(Boolean) : [],
            completed: Math.max(0, number(row.completed)), contractScore: number(row.contractScore), network: Math.max(0, number(row.network)),
            networkBonus: number(row.networkBonus), score: number(row.score)
          } : null;
        }).filter(Boolean);
        safeHall.result.draw = rawResult.draw === true;
      }
    }
    return safeHall;
  }

  function renderSpectator(host, publicHall) {
    if (!host || !host.appendChild) return null;
    host.replaceChildren();
    var safeHall = safeSpectatorHall(publicHall);
    if (!safeHall) {
      append(host, node('p', 'obgs-empty-note', tr('公共观战数据不可用。', 'Public spectator data is unavailable.')));
      return null;
    }
    var previousBots = renderBotsOverride;
    renderBotsOverride = safeHall.bots;
    try {
      if (safeHall.table) host.appendChild(renderBoard(safeHall, safeHall.table, safeHall.result || null, false, true));
      else {
        var empty = node('div', 'obgs-empty-state obgs-table-empty');
        append(empty, node('h3', '', tr('牌局画面暂不可用', 'The table view is unavailable')));
        append(empty, node('p', '', tr('当前没有可显示的公共牌桌状态。', 'There is no public table state to display.')));
        host.appendChild(empty);
      }
      host.appendChild(renderMessages(safeHall.messages));
    } finally {
      renderBotsOverride = previousBots;
    }
    return safeHall;
  }

  function setSpectatorLanguage(language) {
    spectatorLanguage = language === 'en' ? 'en' : 'zh-CN';
  }

  root.OpenBotGameSpace = { open: open, close: close, renderSpectator: renderSpectator, setSpectatorLanguage: setSpectatorLanguage };
  ensureRoomRecordingUi();
})(window);
