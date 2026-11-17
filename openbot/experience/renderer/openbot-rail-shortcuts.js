(function (root) {
  'use strict';

  var STORAGE_KEY = 'openbot.rail.shortcuts.v1';
  var DEFAULT_SHORTCUTS = Object.freeze(['bot-health', 'skin-market']);

  var SHORTCUT_CATALOG = Object.freeze([
    {
      key: 'bot-health',
      group: 'panels',
      buttonId: 'btn-rail-health',
      zh: 'Bot 健康中心',
      en: 'Bot health center',
      descZh: '分层健康检测、Token 用量与常搭档互动统计',
      descEn: 'Layered health checks, Token usage & partner stats',
      svg: '<svg class="ob-icon" data-ob-icon="bot-health" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20.5s-7-4.4-7-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7 3.3c0 5.8-7 10.2-7 10.2Z"/><path d="M7.8 12h2.1l1.3-2.6 1.8 5 1.3-2.4h1.9"/></svg>'
    },
    {
      key: 'skin-market',
      group: 'panels',
      buttonId: 'btn-rail-skin',
      zh: '主题皮肤与桌宠',
      en: 'Themes & desktop pets',
      descZh: '切换界面皮肤、Bot 头像形象与桌面伴侣',
      descEn: 'Switch UI themes, Bot avatars & desktop companions',
      svg: '<svg class="ob-icon" data-ob-icon="skin-market" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3a9 9 0 0 0 0 18h1.3a2.2 2.2 0 0 0 1.6-3.7 1.8 1.8 0 0 1 1.3-3h1.3A3.5 3.5 0 0 0 21 10.8C21 6.4 16.9 3 12 3Z"/><circle cx="7.8" cy="10.5" r=".9" fill="currentColor"/><circle cx="10.6" cy="7.5" r=".9" fill="currentColor"/><circle cx="14.6" cy="7.8" r=".9" fill="currentColor"/></svg>'
    },
    {
      key: 'bot-dashboard',
      group: 'panels',
      buttonId: 'btn-rail-shortcut-bot-dashboard',
      zh: 'Bot 关系与数据面板',
      en: 'Bot relationship dashboard',
      descZh: '查看舰队派工排行、协作关系图谱与运行指标',
      descEn: 'Inspect fleet dispatch rankings & collaboration graph',
      svg: '<svg class="ob-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4" y="13" width="3.6" height="7" rx="1"/><rect x="10.2" y="8.5" width="3.6" height="11.5" rx="1"/><rect x="16.4" y="4" width="3.6" height="16" rx="1"/></svg>'
    },
    {
      key: 'local-agents',
      group: 'panels',
      buttonId: 'btn-rail-shortcut-local-agents',
      zh: '智能体工作空间',
      en: 'Local agents',
      descZh: '发现并管理本机 CLI / ACP 智能体执行器',
      descEn: 'Discover and manage local CLI / ACP agents',
      svg: '<svg class="ob-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="m7.5 10 3 2.5-3 2.5M12.5 15h4"/></svg>'
    },
    {
      key: 'cloud-connect',
      group: 'panels',
      buttonId: 'btn-rail-shortcut-cloud-connect',
      zh: '连接云端',
      en: 'Connect cloud',
      descZh: '管理远程主机、SSH 隧道与云端节点 Bot',
      descEn: 'Manage remote hosts, SSH tunnels & cloud Bots',
      svg: '<svg class="ob-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6.5 18.5h11a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.3 9.2 3.8 3.8 0 0 0 6.5 18.5Z"/></svg>'
    },
    {
      key: 'human-team',
      group: 'panels',
      buttonId: 'btn-rail-shortcut-human-team',
      zh: '小组协作',
      en: 'Group collaboration',
      descZh: '查看多人协作空间、成员分工与协同动态',
      descEn: 'Open team collaboration spaces and member views',
      svg: '<svg class="ob-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9.5" r="2.3"/><path d="M16 14.5a4.5 4.5 0 0 1 4.5 4.5"/></svg>'
    },
    {
      key: 'settings-general',
      group: 'settings',
      settingsSection: 'general',
      buttonId: 'btn-rail-shortcut-settings-general',
      zh: '常规设置',
      en: 'General settings',
      descZh: '直达设置 · 常规（主题外观、语言、侧栏视角与偏好）',
      descEn: 'Open Settings -> General (appearance, language & views)',
      svg: '<svg class="ob-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 7h9M17 7h3M15 5v4M4 12h3M11 12h9M9 10v4M4 17h11M19 17h1M17 15v4"/></svg>'
    },
    {
      key: 'settings-model',
      group: 'settings',
      settingsSection: 'model',
      buttonId: 'btn-rail-shortcut-settings-model',
      zh: '模型接入设置',
      en: 'API & model settings',
      descZh: '直达设置 · 模型接入（API 配置、密钥与网关地址）',
      descEn: 'Open Settings -> API connection (models, keys & endpoints)',
      svg: '<svg class="ob-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 3v4M15 3v4M6.5 7h11v4.5a5.5 5.5 0 0 1-5.5 5.5 5.5 5.5 0 0 1-5.5-5.5V7ZM12 17v4"/></svg>'
    },
    {
      key: 'settings-apps',
      group: 'settings',
      settingsSection: 'apps',
      buttonId: 'btn-rail-shortcut-settings-apps',
      zh: '应用连接设置',
      en: 'App connections',
      descZh: '直达设置 · 应用连接（GitHub、网盘、日历与对外服务）',
      descEn: 'Open Settings -> App connections (GitHub, cloud drives & APIs)',
      svg: '<svg class="ob-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><path d="M14 17h6M17 14v6"/></svg>'
    },
    {
      key: 'settings-plugins',
      group: 'settings',
      settingsSection: 'plugins',
      buttonId: 'btn-rail-shortcut-settings-plugins',
      zh: '插件与组件设置',
      en: 'Plugins & components',
      descZh: '直达设置 · 插件与组件（DSH Hub、终端与运行环境）',
      descEn: 'Open Settings -> Plugins & components (DSH Hub & runtimes)',
      svg: '<svg class="ob-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Z"/><path d="M4.5 7.2 12 11.4l7.5-4.2M12 11.4V21"/></svg>'
    },
    {
      key: 'settings-channels',
      group: 'settings',
      settingsSection: 'channels',
      buttonId: 'btn-rail-shortcut-settings-channels',
      zh: '消息与设备设置',
      en: 'Channels & devices',
      descZh: '直达设置 · 消息与设备（飞书、微信、钉钉、语音与硬件）',
      descEn: 'Open Settings -> Channels & devices (messaging, voice & USB)',
      svg: '<svg class="ob-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 5.5h14a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H9.5L5 20.5V17H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z"/><path d="M8.5 11.2h.01M12 11.2h.01M15.5 11.2h.01"/></svg>'
    },
    {
      key: 'settings-data',
      group: 'settings',
      settingsSection: 'data',
      buttonId: 'btn-rail-shortcut-settings-data',
      zh: '数据与同步设置',
      en: 'Data & sync',
      descZh: '直达设置 · 数据与同步（存储位置、记忆迁移与导入导出）',
      descEn: 'Open Settings -> Data and sync (storage, migration & backups)',
      svg: '<svg class="ob-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><ellipse cx="12" cy="6" rx="7.5" ry="2.8"/><path d="M4.5 6v6c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8V6"/><path d="M4.5 12v6c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8v-6"/></svg>'
    }
  ]);

  var TOP_TOOLS_CATALOG = Object.freeze([
    { id: 'btn-search-bots', zh: '搜索 Bot', en: 'Search Bots', group: 'upper' },
    { id: 'btn-sidebar-filter', zh: '列表显示', en: 'Visible groups', group: 'upper' },
    { id: 'btn-sidebar-suggest', zh: '智能分组', en: 'Smart groups', group: 'upper' },
    { id: 'btn-sidebar-create', zh: '新建入口', en: 'Create menu', group: 'upper' },
    { id: 'btn-pin-active-bot', zh: '固定当前 Bot', en: 'Pin Bot', group: 'lower' },
    { id: 'btn-hide-active-bot', zh: '隐藏当前 Bot', en: 'Hide Bot', group: 'lower' }
  ]);

  var CATALOG_BY_KEY = Object.create(null);
  var SECTION_TO_KEY = Object.create(null);
  SHORTCUT_CATALOG.forEach(function (item) {
    CATALOG_BY_KEY[item.key] = item;
    if (item.settingsSection) SECTION_TO_KEY[item.settingsSection] = item.key;
  });

  var TOP_TOOL_BY_ID = Object.create(null);
  TOP_TOOLS_CATALOG.forEach(function (item) {
    TOP_TOOL_BY_ID[item.id] = item;
  });

  function tr(zh, en) {
    return root && root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function'
      ? root.OpenBotI18n.t(zh, en)
      : zh;
  }

  function normalizeConfig(raw) {
    var shortcuts = null;
    var hiddenTopTools = [];
    if (raw && typeof raw === 'object') {
      if (Array.isArray(raw.shortcuts)) {
        var seen = Object.create(null);
        shortcuts = [];
        raw.shortcuts.forEach(function (key) {
          var k = String(key || '').trim();
          if (CATALOG_BY_KEY[k] && !seen[k]) {
            seen[k] = true;
            shortcuts.push(k);
          }
        });
      }
      if (Array.isArray(raw.hiddenTopTools)) {
        var seenTools = Object.create(null);
        raw.hiddenTopTools.forEach(function (id) {
          var tid = String(id || '').trim();
          if (TOP_TOOL_BY_ID[tid] && !seenTools[tid]) {
            seenTools[tid] = true;
            hiddenTopTools.push(tid);
          }
        });
      }
    }
    return {
      version: 1,
      shortcuts: shortcuts === null ? DEFAULT_SHORTCUTS.slice() : shortcuts,
      hiddenTopTools: hiddenTopTools
    };
  }

  function createStore(storage) {
    function read() {
      if (!storage || typeof storage.getItem !== 'function') return normalizeConfig(null);
      try {
        var text = storage.getItem(STORAGE_KEY);
        if (!text) return normalizeConfig(null);
        return normalizeConfig(JSON.parse(text));
      } catch (_) {
        return normalizeConfig(null);
      }
    }
    function write(cfg) {
      var normalized = normalizeConfig(cfg);
      if (storage && typeof storage.setItem === 'function') {
        try {
          storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        } catch (_) {}
      }
      return normalized;
    }
    return { read: read, write: write };
  }

  var state = normalizeConfig(null);
  var rawStorage = null;
  try {
    rawStorage = root && root.localStorage ? root.localStorage : null;
  } catch (_) {
    rawStorage = null;
  }
  var store = createStore(rawStorage);
  var buttonPool = Object.create(null);
  var dialogBackdrop = null;
  var dialogOpener = null;
  var onOpenTargetCallback = null;
  var initialized = false;
  var currentSettingsSearching = false;

  function currentSettingsSection() {
    if (root && root.OpenBotDialogs && typeof root.OpenBotDialogs.getSection === 'function') {
      return root.OpenBotDialogs.getSection();
    }
    var activeTab = typeof document !== 'undefined' && document.querySelector('[data-settings-tab][aria-selected="true"]');
    return (activeTab && activeTab.dataset && activeTab.dataset.settingsTab) || 'general';
  }

  function ensureShortcutButton(item) {
    if (buttonPool[item.key]) return buttonPool[item.key];
    var existing = typeof document !== 'undefined' ? document.getElementById(item.buttonId) : null;
    if (existing) {
      existing.dataset.railShortcut = item.key;
      buttonPool[item.key] = existing;
      return existing;
    }
    if (typeof document === 'undefined') return null;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = item.buttonId;
    btn.className = 'ob-rail-action';
    btn.dataset.railShortcut = item.key;
    var label = tr(item.zh, item.en);
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.dataset.i18nTitleZh = item.zh;
    btn.dataset.i18nTitleEn = item.en;
    btn.dataset.i18nAriaLabelZh = item.zh;
    btn.dataset.i18nAriaLabelEn = item.en;
    btn.innerHTML = item.svg;
    btn.addEventListener('click', function () {
      if (typeof onOpenTargetCallback === 'function') {
        onOpenTargetCallback(item.key, btn);
      }
    });
    buttonPool[item.key] = btn;
    return btn;
  }

  function applyRailDOM() {
    if (typeof document === 'undefined') return;
    var slot = document.getElementById('rail-custom-shortcuts');
    if (slot) {
      // Stash existing buttons before reordering so attached listeners stay intact
      Array.from(slot.querySelectorAll('button[data-rail-shortcut], #btn-rail-health, #btn-rail-skin')).forEach(function (el) {
        var k = el.dataset.railShortcut || (el.id === 'btn-rail-health' ? 'bot-health' : el.id === 'btn-rail-skin' ? 'skin-market' : '');
        if (k) {
          el.dataset.railShortcut = k;
          buttonPool[k] = el;
        }
        if (el.parentNode === slot) slot.removeChild(el);
      });
      state.shortcuts.forEach(function (key) {
        var item = CATALOG_BY_KEY[key];
        if (!item) return;
        var btn = ensureShortcutButton(item);
        if (btn) {
          var label = tr(item.zh, item.en);
          btn.title = label;
          btn.setAttribute('aria-label', label);
          slot.appendChild(btn);
        }
      });
      slot.hidden = state.shortcuts.length === 0;
    }

    // Apply top Bot tools visibility without clobbering Jarvis `hidden` attribute
    var hiddenSet = Object.create(null);
    state.hiddenTopTools.forEach(function (id) { hiddenSet[id] = true; });
    var anyUpperVisible = false;
    var anyLowerVisible = false;
    TOP_TOOLS_CATALOG.forEach(function (tool) {
      var el = document.getElementById(tool.id);
      var isHidden = Boolean(hiddenSet[tool.id]);
      if (el) el.classList.toggle('ob-rail-tool-hidden', isHidden);
      if (!isHidden) {
        if (tool.group === 'upper') anyUpperVisible = true;
        else anyLowerVisible = true;
      }
    });
    var topDivider = document.querySelector('#sidebar-bot-tools > .ob-rail-divider');
    if (topDivider) {
      topDivider.classList.toggle('ob-rail-tool-hidden', !(anyUpperVisible && anyLowerVisible));
    }

    syncSettingsHeaderPin();
    syncGeneralSettingsSummary();
  }

  function syncSettingsHeaderPin() {
    if (typeof document === 'undefined') return;
    var wrap = document.getElementById('set-page-rail-actions');
    var pinBtn = document.getElementById('set-pin-to-rail');
    if (!wrap || !pinBtn) return;
    var section = currentSettingsSection();
    var shortcutKey = SECTION_TO_KEY[section];
    if (currentSettingsSearching || !shortcutKey) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    var isPinned = state.shortcuts.indexOf(shortcutKey) >= 0;
    pinBtn.dataset.railShortcutKey = shortcutKey;
    pinBtn.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
    pinBtn.textContent = isPinned
      ? tr('✓ 已在左侧栏', '✓ Pinned to rail')
      : tr('+ 添加到左侧栏', '+ Pin to left rail');
    pinBtn.title = isPinned
      ? tr('点击从最左侧边栏移除此设置入口', 'Click to remove this settings shortcut from the left rail')
      : tr('将此设置分类添加到最左侧边栏快捷显示', 'Add this settings category to the leftmost rail');
  }

  function syncGeneralSettingsSummary() {
    if (typeof document === 'undefined') return;
    var summary = document.getElementById('set-rail-shortcuts-summary');
    if (!summary) return;
    if (!state.shortcuts.length) {
      summary.textContent = tr('当前未固定快捷入口；点击右侧按钮可随时添加。', 'No shortcuts pinned yet. Click Manage to add items.');
      return;
    }
    var names = state.shortcuts
      .map(function (k) { return CATALOG_BY_KEY[k] ? tr(CATALOG_BY_KEY[k].zh, CATALOG_BY_KEY[k].en) : ''; })
      .filter(Boolean);
    summary.textContent = tr('当前已显示：', 'Currently shown: ') + names.join('、');
  }

  function commit(next) {
    state = store.write(next);
    applyRailDOM();
    if (dialogBackdrop && !dialogBackdrop.hidden) {
      renderDialog();
    }
    return getState();
  }

  function getState() {
    return {
      version: 1,
      shortcuts: state.shortcuts.slice(),
      hiddenTopTools: state.hiddenTopTools.slice()
    };
  }

  function hasShortcut(key) {
    return state.shortcuts.indexOf(key) >= 0;
  }

  function addShortcut(key) {
    if (!CATALOG_BY_KEY[key]) return getState();
    if (hasShortcut(key)) return getState();
    return commit({
      shortcuts: state.shortcuts.concat([key]),
      hiddenTopTools: state.hiddenTopTools
    });
  }

  function removeShortcut(key) {
    if (!hasShortcut(key)) return getState();
    return commit({
      shortcuts: state.shortcuts.filter(function (k) { return k !== key; }),
      hiddenTopTools: state.hiddenTopTools
    });
  }

  function toggleShortcut(key) {
    return hasShortcut(key) ? removeShortcut(key) : addShortcut(key);
  }

  function moveShortcut(key, delta) {
    var idx = state.shortcuts.indexOf(key);
    if (idx < 0) return getState();
    var targetIdx = idx + (delta < 0 ? -1 : 1);
    if (targetIdx < 0 || targetIdx >= state.shortcuts.length) return getState();
    var next = state.shortcuts.slice();
    var item = next[idx];
    next.splice(idx, 1);
    next.splice(targetIdx, 0, item);
    return commit({
      shortcuts: next,
      hiddenTopTools: state.hiddenTopTools
    });
  }

  function toggleTopTool(toolId) {
    if (!TOP_TOOL_BY_ID[toolId]) return getState();
    var idx = state.hiddenTopTools.indexOf(toolId);
    var nextHidden = idx >= 0
      ? state.hiddenTopTools.filter(function (id) { return id !== toolId; })
      : state.hiddenTopTools.concat([toolId]);
    return commit({
      shortcuts: state.shortcuts,
      hiddenTopTools: nextHidden
    });
  }

  function resetDefaults() {
    return commit({
      shortcuts: DEFAULT_SHORTCUTS.slice(),
      hiddenTopTools: []
    });
  }

  function ensureDialog() {
    if (dialogBackdrop) return dialogBackdrop;
    if (typeof document === 'undefined') return null;

    var backdrop = document.createElement('div');
    backdrop.id = 'ob-rail-customizer-dialog';
    backdrop.className = 'ob-rail-customizer-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML =
      '<div class="ob-rail-customizer-surface" role="dialog" aria-modal="true" aria-labelledby="ob-rail-customizer-title">' +
        '<header class="ob-rail-customizer-head">' +
          '<div class="ob-rail-customizer-title-wrap">' +
            '<div class="ob-rail-customizer-title-row">' +
              '<h3 class="ob-rail-customizer-title" id="ob-rail-customizer-title"></h3>' +
              '<span class="ob-rail-customizer-badge" id="ob-rail-customizer-count"></span>' +
            '</div>' +
            '<p class="ob-rail-customizer-sub" id="ob-rail-customizer-sub"></p>' +
          '</div>' +
          '<div class="ob-rail-customizer-head-actions">' +
            '<button type="button" class="ob-rail-customizer-reset" id="ob-rail-customizer-reset"></button>' +
            '<button type="button" class="ob-rail-customizer-close" id="ob-rail-customizer-close" aria-label="关闭">×</button>' +
          '</div>' +
        '</header>' +
        '<div class="ob-rail-customizer-body">' +
          '<section class="ob-rail-customizer-section" aria-labelledby="ob-rail-sec-active">' +
            '<div class="ob-rail-customizer-section-head"><h4 id="ob-rail-sec-active"></h4><span id="ob-rail-sec-active-hint"></span></div>' +
            '<div class="ob-rail-active-list" id="ob-rail-active-list"></div>' +
          '</section>' +
          '<section class="ob-rail-customizer-section" aria-labelledby="ob-rail-sec-settings">' +
            '<div class="ob-rail-customizer-section-head"><h4 id="ob-rail-sec-settings"></h4><span id="ob-rail-sec-settings-hint"></span></div>' +
            '<div class="ob-rail-catalog-grid" id="ob-rail-catalog-settings"></div>' +
          '</section>' +
          '<section class="ob-rail-customizer-section" aria-labelledby="ob-rail-sec-panels">' +
            '<div class="ob-rail-customizer-section-head"><h4 id="ob-rail-sec-panels"></h4><span id="ob-rail-sec-panels-hint"></span></div>' +
            '<div class="ob-rail-catalog-grid" id="ob-rail-catalog-panels"></div>' +
          '</section>' +
          '<section class="ob-rail-customizer-section" aria-labelledby="ob-rail-sec-toptools">' +
            '<div class="ob-rail-customizer-section-head"><h4 id="ob-rail-sec-toptools"></h4><span id="ob-rail-sec-toptools-hint"></span></div>' +
            '<div class="ob-rail-toptools-grid" id="ob-rail-toptools-list"></div>' +
          '</section>' +
        '</div>' +
      '</div>';

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) {
        close();
        return;
      }
      var btn = e.target.closest('button[data-rail-customizer-action]');
      if (!btn) return;
      var action = btn.dataset.railCustomizerAction;
      var key = btn.dataset.railKey || '';
      if (action === 'toggle' && key) toggleShortcut(key);
      else if (action === 'remove' && key) removeShortcut(key);
      else if (action === 'up' && key) moveShortcut(key, -1);
      else if (action === 'down' && key) moveShortcut(key, 1);
      else if (action === 'toptool' && key) toggleTopTool(key);
    });

    backdrop.querySelector('#ob-rail-customizer-close').addEventListener('click', function () {
      close();
    });
    backdrop.querySelector('#ob-rail-customizer-reset').addEventListener('click', function () {
      resetDefaults();
    });

    document.addEventListener('keydown', function (e) {
      if (!dialogBackdrop || dialogBackdrop.hidden) return;
      if (e.key === 'Escape' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    }, true);

    document.body.appendChild(backdrop);
    dialogBackdrop = backdrop;
    return backdrop;
  }

  function renderCatalogGroup(container, groupName) {
    container.replaceChildren();
    SHORTCUT_CATALOG.filter(function (item) { return item.group === groupName; }).forEach(function (item) {
      var added = hasShortcut(item.key);
      var card = document.createElement('div');
      card.className = 'ob-rail-catalog-card' + (added ? ' is-added' : '');
      card.dataset.railCard = item.key;

      var icon = document.createElement('span');
      icon.className = 'ob-rail-item-icon';
      icon.innerHTML = item.svg;

      var copy = document.createElement('div');
      copy.className = 'ob-rail-catalog-copy';
      var title = document.createElement('strong');
      title.className = 'ob-rail-catalog-title';
      title.textContent = tr(item.zh, item.en);
      var desc = document.createElement('span');
      desc.className = 'ob-rail-catalog-desc';
      desc.textContent = tr(item.descZh, item.descEn);
      desc.title = desc.textContent;
      copy.append(title, desc);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ob-rail-toggle-btn';
      btn.dataset.railCustomizerAction = 'toggle';
      btn.dataset.railKey = item.key;
      btn.setAttribute('aria-pressed', added ? 'true' : 'false');
      btn.textContent = added ? tr('✓ 已添加', '✓ Added') : tr('+ 添加', '+ Add');
      btn.setAttribute(
        'aria-label',
        (added ? tr('从左侧栏移除 ', 'Remove from left rail: ') : tr('添加到左侧栏 ', 'Add to left rail: ')) + tr(item.zh, item.en)
      );

      card.append(icon, copy, btn);
      container.appendChild(card);
    });
  }

  function renderDialog() {
    var backdrop = ensureDialog();
    if (!backdrop) return;

    backdrop.querySelector('#ob-rail-customizer-title').textContent = tr('管理侧边栏快捷显示', 'Customize left rail shortcuts');
    backdrop.querySelector('#ob-rail-customizer-count').textContent = tr(
      '已显示 ' + state.shortcuts.length + ' 项',
      state.shortcuts.length + ' pinned'
    );
    backdrop.querySelector('#ob-rail-customizer-sub').textContent = tr(
      '自由添加、移除或调整最左侧边栏的常用设置与功能快捷入口。更改立即生效。',
      'Add, remove, or reorder quick-access tools and settings in the leftmost rail. Changes apply immediately.'
    );
    backdrop.querySelector('#ob-rail-customizer-reset').textContent = tr('恢复默认', 'Restore defaults');
    backdrop.querySelector('#ob-rail-customizer-close').setAttribute('aria-label', tr('关闭侧边栏管理', 'Close customizer'));
    backdrop.querySelector('#ob-rail-customizer-close').title = tr('关闭', 'Close');

    backdrop.querySelector('#ob-rail-sec-active').textContent = tr('当前左侧栏快捷入口', 'Pinned on left rail');
    backdrop.querySelector('#ob-rail-sec-active-hint').textContent = tr('自上而下排列，可调整顺序或移除', 'Ordered top to bottom');

    var activeList = backdrop.querySelector('#ob-rail-active-list');
    activeList.replaceChildren();
    if (!state.shortcuts.length) {
      var empty = document.createElement('p');
      empty.className = 'ob-rail-active-empty';
      empty.textContent = tr('当前未固定快捷入口，可从下方列表点击「+ 添加」放入左侧栏。', 'No shortcuts pinned. Click "+ Add" below to pin items.');
      activeList.appendChild(empty);
    } else {
      state.shortcuts.forEach(function (key, idx) {
        var item = CATALOG_BY_KEY[key];
        if (!item) return;
        var row = document.createElement('div');
        row.className = 'ob-rail-active-row';
        row.dataset.railActiveKey = key;

        var icon = document.createElement('span');
        icon.className = 'ob-rail-item-icon';
        icon.innerHTML = item.svg;

        var main = document.createElement('div');
        main.className = 'ob-rail-active-main';
        var name = document.createElement('span');
        name.className = 'ob-rail-active-name';
        name.textContent = tr(item.zh, item.en);
        var tag = document.createElement('span');
        tag.className = 'ob-rail-active-tag';
        tag.textContent = item.group === 'settings' ? tr('设置直达', 'Settings') : tr('全局入口', 'Panel');
        main.append(name, tag);

        var actions = document.createElement('div');
        actions.className = 'ob-rail-active-actions';

        var upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'ob-rail-mini-btn';
        upBtn.dataset.railCustomizerAction = 'up';
        upBtn.dataset.railKey = key;
        upBtn.disabled = idx === 0;
        upBtn.textContent = '↑';
        upBtn.title = tr('上移', 'Move up');
        upBtn.setAttribute('aria-label', tr('上移 ', 'Move up: ') + tr(item.zh, item.en));

        var downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.className = 'ob-rail-mini-btn';
        downBtn.dataset.railCustomizerAction = 'down';
        downBtn.dataset.railKey = key;
        downBtn.disabled = idx === state.shortcuts.length - 1;
        downBtn.textContent = '↓';
        downBtn.title = tr('下移', 'Move down');
        downBtn.setAttribute('aria-label', tr('下移 ', 'Move down: ') + tr(item.zh, item.en));

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'ob-rail-mini-btn is-remove';
        removeBtn.dataset.railCustomizerAction = 'remove';
        removeBtn.dataset.railKey = key;
        removeBtn.textContent = tr('移除', 'Remove');
        removeBtn.setAttribute('aria-label', tr('移除 ', 'Remove: ') + tr(item.zh, item.en));

        actions.append(upBtn, downBtn, removeBtn);
        row.append(icon, main, actions);
        activeList.appendChild(row);
      });
    }

    backdrop.querySelector('#ob-rail-sec-settings').textContent = tr('常用设置页直达', 'Settings page shortcuts');
    backdrop.querySelector('#ob-rail-sec-settings-hint').textContent = tr('添加到左侧栏后，点击可直接打开对应设置分类', 'Open a specific Settings category in one click');
    renderCatalogGroup(backdrop.querySelector('#ob-rail-catalog-settings'), 'settings');

    backdrop.querySelector('#ob-rail-sec-panels').textContent = tr('全局面板与工作空间', 'Global panels & workspaces');
    backdrop.querySelector('#ob-rail-sec-panels-hint').textContent = tr('把高频使用的总控面板或协作窗口放在手边', 'Pin frequently used panels and workspaces');
    renderCatalogGroup(backdrop.querySelector('#ob-rail-catalog-panels'), 'panels');

    backdrop.querySelector('#ob-rail-sec-toptools').textContent = tr('顶部 Bot 工具图标', 'Top Bot tool icons');
    backdrop.querySelector('#ob-rail-sec-toptools-hint').textContent = tr('按需精简左侧栏上方的辅助按钮', 'Show or hide upper Bot list controls');
    var topGrid = backdrop.querySelector('#ob-rail-toptools-list');
    topGrid.replaceChildren();
    TOP_TOOLS_CATALOG.forEach(function (tool) {
      var shown = state.hiddenTopTools.indexOf(tool.id) < 0;
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ob-rail-toptool-chip';
      chip.dataset.railCustomizerAction = 'toptool';
      chip.dataset.railKey = tool.id;
      chip.setAttribute('aria-pressed', shown ? 'true' : 'false');
      var label = document.createElement('span');
      label.textContent = tr(tool.zh, tool.en);
      var st = document.createElement('span');
      st.className = 'ob-rail-toptool-state';
      st.textContent = shown ? tr('显示', 'Shown') : tr('隐藏', 'Hidden');
      chip.append(label, st);
      topGrid.appendChild(chip);
    });
  }

  function syncCustomizeButtonExpanded(expanded) {
    if (typeof document === 'undefined') return;
    var btn = document.getElementById('btn-rail-customize');
    if (!btn) return;
    btn.classList.toggle('is-active', Boolean(expanded));
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  function open(options) {
    var opts = options || {};
    var backdrop = ensureDialog();
    if (!backdrop) return;
    dialogOpener = opts.opener || (typeof document !== 'undefined' ? document.activeElement : null);
    renderDialog();
    backdrop.hidden = false;
    syncCustomizeButtonExpanded(true);
    var closeBtn = backdrop.querySelector('#ob-rail-customizer-close');
    if (closeBtn && typeof closeBtn.focus === 'function') {
      closeBtn.focus({ preventScroll: true });
    }
  }

  function close(options) {
    var opts = options || {};
    if (!dialogBackdrop || dialogBackdrop.hidden) return;
    dialogBackdrop.hidden = true;
    syncCustomizeButtonExpanded(false);
    var target = dialogOpener;
    dialogOpener = null;
    if (opts.restoreFocus === false) return;
    if (target && target.isConnected && target.getClientRects && target.getClientRects().length && typeof target.focus === 'function') {
      target.focus({ preventScroll: true });
    }
  }

  function isOpen() {
    return Boolean(dialogBackdrop && !dialogBackdrop.hidden);
  }

  function init(options) {
    var opts = options || {};
    if (opts.storage) store = createStore(opts.storage);
    if (typeof opts.onOpenTarget === 'function') onOpenTargetCallback = opts.onOpenTarget;
    state = store.read();
    applyRailDOM();

    if (initialized || typeof document === 'undefined') return;
    initialized = true;

    var customizeBtn = document.getElementById('btn-rail-customize');
    if (customizeBtn) {
      customizeBtn.addEventListener('click', function () {
        if (isOpen()) close();
        else open({ opener: customizeBtn });
      });
    }

    var rail = document.getElementById('app-rail');
    if (rail) {
      rail.addEventListener('contextmenu', function (e) {
        if (e.target && e.target.closest && e.target.closest('input, textarea, #sidebar-group-filter, #sidebar-create-menu')) return;
        e.preventDefault();
        open({ opener: customizeBtn || e.target });
      });
    }

    var pinBtn = document.getElementById('set-pin-to-rail');
    if (pinBtn) {
      pinBtn.addEventListener('click', function () {
        var key = pinBtn.dataset.railShortcutKey || SECTION_TO_KEY[currentSettingsSection()];
        if (key) toggleShortcut(key);
      });
    }

    var manageInHeader = document.getElementById('set-manage-rail');
    if (manageInHeader) {
      manageInHeader.addEventListener('click', function () {
        open({ opener: manageInHeader });
      });
    }

    var manageInGeneral = document.getElementById('set-open-rail-customizer');
    if (manageInGeneral) {
      manageInGeneral.addEventListener('click', function () {
        open({ opener: manageInGeneral });
      });
    }

    document.addEventListener('openbot:settings-section-change', function (e) {
      currentSettingsSearching = Boolean(e && e.detail && e.detail.searching);
      syncSettingsHeaderPin();
    });
  }

  var api = Object.freeze({
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_SHORTCUTS: DEFAULT_SHORTCUTS,
    SHORTCUT_CATALOG: SHORTCUT_CATALOG,
    TOP_TOOLS_CATALOG: TOP_TOOLS_CATALOG,
    normalizeConfig: normalizeConfig,
    createStore: createStore,
    init: init,
    open: open,
    close: close,
    isOpen: isOpen,
    getState: getState,
    hasShortcut: hasShortcut,
    addShortcut: addShortcut,
    removeShortcut: removeShortcut,
    toggleShortcut: toggleShortcut,
    moveShortcut: moveShortcut,
    toggleTopTool: toggleTopTool,
    resetDefaults: resetDefaults,
    syncSettingsHeaderPin: syncSettingsHeaderPin
  });

  if (root) root.OpenBotRailShortcuts = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
