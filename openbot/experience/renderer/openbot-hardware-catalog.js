(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenBotHardwareCatalog = api;
})(typeof window === 'object' ? window : null, function () {
  'use strict';

  // Owner-facing OS inventory and a separate adapter roadmap. Explicit refresh
  // reads OS metadata only; it never opens serial ports or authorizes a Bot.
  var entries = Object.freeze([
    Object.freeze({ id: 'xiaoai', name: '小爱音箱', icon: 'speaker',
      description: '计划让音箱播报 Bot 的回复与任务结果。',
      requirements: '需支持的音箱型号和小米账号授权。首个验证目标为 Play 增强版（L05C）。',
      connection: '局域网 · 账号授权',
      next: '待接入产品：设备选择、Bot 权限与播报入口。语音交办与连续对话另行验证。',
      guideUrl: 'https://github.com/XiaoMi/ha_xiaomi_home', guideLabel: '查看小米官方接入项目' }),
    Object.freeze({ id: 'm5stack', name: 'M5Stack', icon: 'display',
      description: '让设备屏幕显示 Bot 状态，并按已适配固件接收交互。',
      connection: 'USB 串口 · 型号与固件需核对',
      requirements: '需核对具体板型、当前固件和串口占用；USB 名称不能证明固件已适配。',
      next: '已识别设备可在本机清单查看。控制接入待加入，不自动刷机或抢占其他程序。',
      guideUrl: 'https://docs.m5stack.com/en/', guideLabel: '查看 M5Stack 官方文档' }),
    Object.freeze({ id: 'xiaodu', name: '小度音箱与智能屏', icon: 'display',
      description: '计划通过官方接口播报结果、发送设备指令。',
      connection: '网络 · 官方服务',
      requirements: '需支持的设备、开发者应用及用户账号授权。',
      next: '待完成：接入官方 MCP、选择设备、播报实测。语音交办需要单独的技能入口。',
      guideUrl: 'https://developer.dueros.baidu.com/doc/dueros-bot-platform/mcp-server/prepare/prepare_markdown', guideLabel: '查看小度官方接入文档' }),
    Object.freeze({ id: 'home-assistant', name: '家庭设备', icon: 'home',
      description: '计划通过 Home Assistant 连接灯、空调、窗帘和传感器。',
      connection: '家庭网关 · 网络',
      requirements: '需已运行的 Home Assistant、兼容设备及明确的设备授权。',
      next: '待完成：连接家庭服务、选择 Bot 可用设备、控制后读回真实状态。',
      guideUrl: 'https://www.home-assistant.io/integrations/mcp_server/', guideLabel: '查看 Home Assistant 接入文档' }),
    Object.freeze({ id: 'smart-scale', name: '智能电子秤', icon: 'scale',
      description: '计划接收称重记录，供获授权的 Bot 查询和汇总。',
      connection: '蓝牙 · 需本地接收节点',
      requirements: '需支持的具体型号；蓝牙秤还需附近的接收节点。',
      next: '待完成：读取稳定测量值、确认记录归属、去除重复记录。',
      guideUrl: 'https://esphome.io/components/sensor/xiaomi_miscale/', guideLabel: '查看已适配的电子秤型号' })
  ]);
  var entryEnglish = {
    xiaoai: { name: 'Xiao AI speakers', description: 'Planned: announce Bot replies and task results.',
      requirements: 'Requires a supported speaker model and Xiaomi account authorization. The first validation target is Play Enhanced (L05C).',
      connection: 'Local network · Account authorization', next: 'Planned: device selection, Bot permissions, and announcements. Voice requests and continuous conversation need separate validation.', guideLabel: 'View Xiaomi’s official integration project' },
    m5stack: { name: 'M5Stack', description: 'Display Bot status and receive interactions through compatible firmware.',
      connection: 'USB serial · Verify model and firmware', requirements: 'Verify the board model, current firmware, and serial-port availability. A USB name does not establish firmware compatibility.',
      next: 'Recognized devices appear in the local inventory. Control integration is planned; no automatic flashing or taking over other apps.', guideLabel: 'View official M5Stack documentation' },
    xiaodu: { name: 'Xiaodu speakers and smart displays', description: 'Planned: announce results and send device commands through official interfaces.',
      connection: 'Network · Official service', requirements: 'Requires a supported device, developer app, and user account authorization.',
      next: 'Planned: official MCP integration, device selection, and announcement testing. Voice requests need a separate skill entry point.', guideLabel: 'View official Xiaodu integration documentation' },
    'home-assistant': { name: 'Home devices', description: 'Planned: connect lights, air conditioners, curtains, and sensors through Home Assistant.',
      connection: 'Home gateway · Network', requirements: 'Requires a running Home Assistant instance, compatible devices, and explicit device authorization.',
      next: 'Planned: connect the home service, select devices available to a Bot, and read back actual state after control.', guideLabel: 'View Home Assistant integration documentation' },
    'smart-scale': { name: 'Smart scales', description: 'Planned: receive weighing records for authorized Bots to query and summarize.',
      connection: 'Bluetooth · Local receiver required', requirements: 'Requires a supported model. Bluetooth scales also need a nearby receiver.',
      next: 'Planned: read stable measurements, confirm record ownership, and remove duplicates.', guideLabel: 'View supported scale models' }
  };
  // Original category symbols, not manufacturer logos.
  var paths = {
    speaker: '<rect x="6" y="3" width="12" height="18" rx="4"/><path d="M9 7h6M9 11h6"/><circle cx="12" cy="16" r="2"/>',
    display: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6m-3-4v4M8 10h1m6 0h1"/>',
    home: '<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/>',
    scale: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10a5 5 0 0 1 10 0H7Zm5 0 2-3M8 17h8"/>'
  };
  function el(doc, tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  var transports = { usb: 'USB', bluetooth: '蓝牙', builtin: '本机内置',
    display: '系统显示 · 接口未报告', virtual: '虚拟设备', unknown: '接口未知' };
  var connections = { connected: '已连接', disconnected: '未连接', available: '系统可用', unknown: '状态未知' };
  var capabilities = { serial: '串口', keyboard: '键盘', mouse: '鼠标', display: '显示',
    'audio-input': '音频输入', 'audio-output': '音频输出' };
  var transportEnglish = { usb: 'USB', bluetooth: 'Bluetooth', builtin: 'Built-in', display: 'System display · Interface not reported', virtual: 'Virtual device', unknown: 'Unknown interface' };
  var connectionEnglish = { connected: 'Connected', disconnected: 'Disconnected', available: 'Available to the system', unknown: 'Unknown state' };
  var capabilityEnglish = { serial: 'Serial', keyboard: 'Keyboard', mouse: 'Mouse', display: 'Display', 'audio-input': 'Audio input', 'audio-output': 'Audio output' };
  var phoneApps = Object.freeze([
    Object.freeze({ package: 'com.android.settings', zh: '系统设置', en: 'Settings' }),
    Object.freeze({ package: 'com.sankuai.meituan', zh: '美团', en: 'Meituan' }),
    Object.freeze({ package: 'com.sankuai.meituan.takeoutnew', zh: '美团外卖', en: 'Meituan delivery' })
  ]);
  function tr(doc, zh, en) { return doc.documentElement.lang === 'en' ? en : zh; }
  function mountInventory(doc, section) {
    var searchSummary = section.querySelector('summary'), searchKeywords = searchSummary.dataset.settingKeywords;
    var area = el(doc, 'div', 'hardware-host'), top = el(doc, 'div', 'hardware-host-heading');
    var title = el(doc, 'h3', '', tr(doc, '这台设备的硬件', 'This device’s hardware'));
    var refresh = el(doc, 'button', 'btn hardware-refresh');
    refresh.type = 'button'; refresh.id = 'hardware-refresh';
    var icons = doc.defaultView && doc.defaultView.OpenBotIcons;
    if (icons) refresh.innerHTML = icons.svg('refresh');
    var refreshLabel = el(doc, 'span', '', tr(doc, '查看设备', 'View devices'));
    refresh.append(refreshLabel);
    refresh.setAttribute('aria-label', tr(doc, '查看本机设备', 'View local devices'));
    refresh.title = tr(doc, '只读查看本机设备', 'Read-only local device inventory');
    var status = el(doc, 'p', 'hardware-host-status', tr(doc, '按宿主查看 USB、蓝牙、内置设备和系统端点。', 'View USB, Bluetooth, built-in devices, and system endpoints on this device.'));
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    var content = el(doc, 'div', 'hardware-host-content');
    top.append(title, refresh); area.append(top, status, content); section.append(area);
    refresh.addEventListener('click', async function () {
      var api = doc.defaultView && doc.defaultView.grokbot;
      if (!api || typeof api.hardwareInventory !== 'function') {
        status.textContent = tr(doc, '请在支持本机清单的桌面版本中查看。', 'Use a desktop build that supports local device inventory.'); return;
      }
      var hadFocus = doc.activeElement === refresh;
      refresh.disabled = true; refreshLabel.textContent = tr(doc, '检查中…', 'Checking…'); area.setAttribute('aria-busy', 'true');
      try {
        var result = await api.hardwareInventory();
        if (!result || result.schema !== 'openbot-hardware-inventory-v1' || !result.host || !Array.isArray(result.devices)) throw Error('Invalid inventory');
        var platform = { darwin: 'macOS', win32: 'Windows', linux: 'Linux' }[result.host.platform] || tr(doc, '本机', 'Local device');
        title.textContent = (result.host.name || tr(doc, '这台设备', 'This device')) + ' · ' + platform;
        var expanded = new Set(Array.from(content.querySelectorAll('details[open]'), function (node) { return node.dataset.group; }));
        content.replaceChildren();
        var all = result.devices.filter(function (d) { return d && d.hostId === result.host.id; }).slice(0, 128);
        var groups = [
          { name: tr(doc, '连接的设备', 'Connected devices'), filter: function (d) { return !d.systemEndpoint && d.kind !== 'hub' && d.connection !== 'disconnected'; } },
          { name: tr(doc, '系统端点', 'System endpoints'), folded: true, filter: function (d) { return !!d.systemEndpoint; } },
          { name: tr(doc, '已配对但未连接', 'Paired but disconnected'), folded: true, filter: function (d) { return d.connection === 'disconnected'; } },
          { name: tr(doc, 'USB 连接层级', 'USB hierarchy'), folded: true, filter: function (d) { return d.kind === 'hub'; } }
        ];
        groups.forEach(function (group) {
          var devices = all.filter(group.filter);
          if (!devices.length) return;
          var target = content;
          if (group.folded) {
            target = el(doc, 'details', 'hardware-host-more apps-guide');
            target.dataset.group = group.name;
            target.open = expanded.has(group.name);
            target.append(el(doc, 'summary', '', group.name + ' · ' + devices.length)); content.append(target);
          } else content.append(el(doc, 'h4', 'hardware-host-group', group.name));
          var rows = el(doc, 'ul', 'hardware-host-list');
          devices.forEach(function (device) {
            var row = el(doc, 'li', 'hardware-host-device'); row.dataset.deviceId = device.id;
            var copy = el(doc, 'div', 'hardware-host-copy');
            copy.append(el(doc, 'span', 'hardware-device-name', device.name));
            var parts = [tr(doc, transports[device.transport] || '接口未知', transportEnglish[device.transport] || 'Unknown interface')];
            var caps = (Array.isArray(device.capabilities) ? device.capabilities : []).map(function (c) { return capabilities[c] && tr(doc, capabilities[c], capabilityEnglish[c]); }).filter(Boolean);
            if (caps.length) parts.push(caps.join(tr(doc, '、', ', ')));
            var parent = device.parentId && all.find(function (d) { return d.id === device.parentId; });
            if (parent) parts.push(tr(doc, '经 ', 'Via ') + parent.name);
            if (device.access === 'busy') parts.push(tr(doc, '由其他程序使用', 'In use by another app'));
            else if (device.access === 'unknown') parts.push(tr(doc, '占用状态未知', 'Availability unknown'));
            copy.append(el(doc, 'span', 'hardware-device-description', parts.join(' · ')));
            var state = tr(doc, connections[device.connection] || '状态未知', connectionEnglish[device.connection] || 'Unknown state');
            row.append(copy, el(doc, 'span', 'hardware-device-status', state)); rows.append(row);
          });
          target.append(rows);
        });
        if (!all.length) content.append(el(doc, 'p', 'hardware-host-empty', tr(doc, '本次没有读到设备记录。', 'No device records were returned.')));
        var time = Number.isFinite(result.observedAt) ? new Date(result.observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        status.textContent = (time ? time + ' · ' : '') + tr(doc, '识别不代表已授权 Bot 操作。局域网设备需通过对应连接器接入。', 'Discovery does not authorize Bot actions. Connect network devices through their respective connectors.');
        if (Array.isArray(result.warnings) && result.warnings.length) {
          content.append(el(doc, 'p', 'hardware-host-warning', result.warnings.slice(0, 4).join(' ')));
        }
        searchSummary.dataset.settingKeywords = searchKeywords + ' ' + title.textContent + ' ' + content.textContent;
      } catch (_) {
        status.textContent = tr(doc, '检查未完成，请稍后重试。已有清单可能已过时。', 'Check incomplete. Try again later; the existing inventory may be out of date.');
      } finally {
        refresh.disabled = false; refreshLabel.textContent = tr(doc, '刷新', 'Refresh'); area.removeAttribute('aria-busy');
        refresh.setAttribute('aria-label', tr(doc, '刷新本机设备', 'Refresh local devices')); refresh.title = tr(doc, '刷新本机设备', 'Refresh local devices');
        // A disabled focused button loses focus in Chromium. Restore only if
        // the user has not moved to another control while inventory was read.
        if (hadFocus && doc.activeElement === doc.body) refresh.focus({ preventScroll: true });
      }
    });
  }
  function normalizePhoneList(result) {
    if (!result || result.ok !== true) throw Error(result && result.message || 'Phone discovery failed');
    // Accept both the flat preload contract and the host's wrapped list result.
    var devices = Array.isArray(result.devices) ? result.devices : result.devices && result.devices.devices;
    if (!Array.isArray(devices) || !Array.isArray(result.bots)) throw Error('Phone discovery returned an invalid list');
    return { devices: devices.filter(function (device) { return device && typeof device.id === 'string'; }),
      bots: result.bots.filter(function (bot) { return bot && typeof bot.id === 'string' && typeof bot.name === 'string'; }) };
  }
  function phoneState(device) {
    if (device.state === 'device' || device.state === 'online') return { state: 'online', zh: '在线', en: 'Online' };
    if (device.state === 'unauthorized') return { state: 'unauthorized', zh: '待在手机上允许 USB 调试', en: 'Allow USB debugging on the phone' };
    if (device.state === 'offline' || device.state === 'disconnected') return { state: 'offline', zh: '离线', en: 'Offline' };
    if (device.state === 'error') return { state: 'error', zh: '连接错误', en: 'Connection error' };
    return { state: 'unknown', zh: '状态未知', en: 'Unknown state' };
  }
  function phoneGrant(device, botId) {
    return (Array.isArray(device.grants) ? device.grants : []).find(function (grant) { return grant && grant.botId === botId; }) || null;
  }
  function normalizedPackages(packages) {
    return Array.from(new Set(Array.isArray(packages) ? packages.filter(function (name) {
      return phoneApps.some(function (app) { return app.package === name; });
    }) : [])).sort();
  }
  function samePackages(left, right) {
    var a = normalizedPackages(left), b = normalizedPackages(right);
    return a.length === b.length && a.every(function (value, index) { return value === b[index]; });
  }
  function mountAndroidPhones(doc, section) {
    var area = el(doc, 'div', 'hardware-phone-panel');
    area.id = 'hardware-phone-panel';
    var heading = el(doc, 'div', 'hardware-phone-heading');
    var title = el(doc, 'h3', '', tr(doc, 'Android 手机', 'Android phones'));
    var refresh = el(doc, 'button', 'btn hardware-phone-refresh', tr(doc, '刷新 Android', 'Refresh Android'));
    refresh.type = 'button'; refresh.id = 'hardware-phone-refresh';
    refresh.setAttribute('aria-label', tr(doc, '刷新 Android 手机列表', 'Refresh Android phone list'));
    var status = el(doc, 'p', 'hardware-phone-status', tr(doc,
      '选择“刷新 Android”后查找 USB 连接的手机。发现设备不代表已授权 Bot 操作。',
      'Select Refresh Android to discover USB-connected phones. Discovery does not authorize Bot control.'));
    status.id = 'hardware-phone-status';
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
    var list = el(doc, 'div', 'hardware-phone-list');
    var state = { devices: [], bots: [], hasResult: false, stale: false, pending: false };
    var selectedBots = new Map(), drafts = new Map(), feedback = new Map(), pendingActions = new Map();
    heading.append(title, refresh); area.append(heading, status, list); section.append(area);

    function api() { return doc.defaultView && doc.defaultView.grokbot; }
    function currentBotId(device) {
      var selected = selectedBots.get(device.id);
      if (state.bots.some(function (bot) { return bot.id === selected; })) return selected;
      // Preselect an actual returned Bot that already has a saved grant so
      // revocation remains available when the phone is offline or unauthorized.
      if (phoneState(device).state === 'online') return '';
      var grantedBot = state.bots.find(function (bot) { return !!phoneGrant(device, bot.id); });
      return grantedBot ? grantedBot.id : '';
    }
    function currentPackages(device, botId) {
      var draft = drafts.get(device.id);
      if (draft && draft.botId === botId) return normalizedPackages(draft.packages);
      var grant = phoneGrant(device, botId);
      return normalizedPackages(grant && grant.packages);
    }
    function syncSave(row, device, botSelect) {
      var button = row.querySelector('.hardware-phone-save');
      if (!button) return;
      var botId = botSelect.value;
      var grant = phoneGrant(device, botId);
      var selected = Array.from(row.querySelectorAll('.hardware-phone-app input:checked')).map(function (input) { return input.value; });
      var hasSelection = selected.length > 0;
      var changed = !samePackages(selected, grant && grant.packages);
      var online = phoneState(device).state === 'online';
      var revoke = !!grant && (!online || !hasSelection);
      var pending = pendingActions.get(device.id) === 'grant';
      var bot = state.bots.find(function (item) { return item.id === botId; });
      button.textContent = !botId ? tr(doc, '选择 Bot', 'Choose Bot') : revoke
        ? tr(doc, '撤销授权', 'Revoke access') : hasSelection
        ? grant ? changed ? tr(doc, '保存授权', 'Save access') : tr(doc, '已授权', 'Access granted')
          : tr(doc, '授权', 'Grant access')
        : tr(doc, '选择应用', 'Choose apps');
      button.disabled = !botId || pending || (revoke ? false : !online || !changed || !hasSelection);
      button.setAttribute('aria-label', bot ? tr(doc,
        (revoke ? '撤销 ' : '为 ') + bot.name + (revoke ? ' 在 ' : ' 保存 ') + String(device.name || 'Android') + (revoke ? ' 上的手机应用授权' : ' 的手机应用授权'),
        (revoke ? 'Revoke phone app access on ' : 'Save phone app access on ') + String(device.name || 'Android') + ' for ' + bot.name) : tr(doc,
        '先选择 Bot 和应用', 'Choose a Bot and apps first'));
    }
    function renderDevice(device) {
      var row = el(doc, 'article', 'hardware-phone-device');
      row.dataset.deviceId = device.id;
      var rowHeading = el(doc, 'div', 'hardware-phone-device-heading');
      var copy = el(doc, 'div', 'hardware-phone-copy');
      var name = el(doc, 'strong', 'hardware-phone-name', String(device.name || 'Android').slice(0, 100));
      name.id = 'hardware-phone-name-' + state.devices.indexOf(device);
      row.setAttribute('aria-labelledby', name.id);
      var stateLabel = phoneState(device);
      var stateNode = el(doc, 'span', 'hardware-phone-device-state', tr(doc, stateLabel.zh, stateLabel.en));
      stateNode.dataset.state = stateLabel.state;
      if (state.stale) stateNode.textContent = tr(doc, '上次读取 · ', 'Last read · ') + stateNode.textContent;
      copy.append(name);
      rowHeading.append(copy, stateNode); row.append(rowHeading);

      var taskText = device.busy ? tr(doc, '有任务正在使用此手机。', 'A task is using this phone.') : tr(doc, '当前没有活动任务。', 'No active task.');
      if (device.busy && typeof device.activeTask === 'string' && device.activeTask.trim()) taskText = device.activeTask.slice(0, 160);
      else if (device.busy && device.activeTask && typeof device.activeTask.name === 'string') taskText = device.activeTask.name.slice(0, 160);
      var task = el(doc, 'p', 'hardware-phone-task', taskText);
      task.dataset.active = device.busy ? 'true' : 'false';
      row.append(task);

      var controls = el(doc, 'div', 'hardware-phone-controls');
      var botField = el(doc, 'label', 'hardware-phone-field');
      botField.append(el(doc, 'span', '', tr(doc, 'Bot', 'Bot')));
      var botSelect = el(doc, 'select', 't hardware-phone-bot');
      botSelect.setAttribute('aria-label', tr(doc,
        '选择可使用 ' + String(device.name || 'Android') + ' 的 Bot',
        'Choose a Bot for ' + String(device.name || 'Android')));
      var placeholder = el(doc, 'option', '', tr(doc, '选择 Bot', 'Choose a Bot'));
      placeholder.value = ''; botSelect.append(placeholder);
      state.bots.forEach(function (bot) { var option = el(doc, 'option', '', bot.name); option.value = bot.id; botSelect.append(option); });
      botSelect.value = currentBotId(device);
      botField.append(botSelect);

      var appField = el(doc, 'fieldset', 'hardware-phone-apps');
      appField.append(el(doc, 'legend', '', tr(doc, '可用应用', 'Allowed apps')));
      var enabled = phoneState(device).state === 'online' && state.bots.length > 0 && !!botSelect.value;
      var selected = new Set(currentPackages(device, botSelect.value));
      phoneApps.forEach(function (app) {
        var label = el(doc, 'label', 'hardware-phone-app');
        var input = el(doc, 'input'); input.type = 'checkbox'; input.value = app.package;
        input.checked = selected.has(app.package); input.disabled = !enabled;
        label.append(input, el(doc, 'span', '', tr(doc, app.zh, app.en))); appField.append(label);
        input.addEventListener('change', function () {
          drafts.set(device.id, { botId: botSelect.value,
            packages: Array.from(row.querySelectorAll('.hardware-phone-app input:checked')).map(function (checkbox) { return checkbox.value; }) });
          syncSave(row, device, botSelect);
        });
      });
      botSelect.disabled = state.bots.length === 0;
      botSelect.addEventListener('change', function () {
        selectedBots.set(device.id, botSelect.value);
        drafts.delete(device.id);
        var packages = new Set(currentPackages(device, botSelect.value));
        Array.from(row.querySelectorAll('.hardware-phone-app input')).forEach(function (input) {
          input.checked = packages.has(input.value);
          input.disabled = phoneState(device).state !== 'online' || !botSelect.value;
        });
        syncSave(row, device, botSelect);
      });

      var actions = el(doc, 'div', 'hardware-phone-actions');
      var save = el(doc, 'button', 'btn hardware-phone-save', tr(doc, '授权', 'Grant access'));
      save.type = 'button'; save.addEventListener('click', async function () {
        var bridge = api(), botId = botSelect.value;
        if (!bridge || typeof bridge.androidPhoneGrant !== 'function') {
          feedback.set(device.id, tr(doc, '当前桌面版无法保存手机授权。', 'Phone access is unavailable in this desktop build.'));
          renderDevices(); return;
        }
        var online = phoneState(device).state === 'online';
        var packages = online ? Array.from(row.querySelectorAll('.hardware-phone-app input:checked')).map(function (input) { return input.value; }) : [];
        if (!botId || !state.bots.some(function (bot) { return bot.id === botId; })) return;
        if (!packages.length && !phoneGrant(device, botId)) return;
        pendingActions.set(device.id, 'grant'); save.disabled = true; save.textContent = tr(doc, '保存中…', 'Saving…');
        try {
          var result = await bridge.androidPhoneGrant({ deviceId: device.id, botId: botId, packages: packages, enabled: packages.length > 0 });
          if (!result || result.ok !== true) throw Error(result && result.message || tr(doc, '授权未保存。', 'Access was not saved.'));
          var index = state.devices.findIndex(function (item) { return item.id === device.id; });
          if (index >= 0 && Array.isArray(result.grants)) state.devices[index].grants = result.grants;
          else if (index >= 0) {
            state.devices[index].grants = (state.devices[index].grants || []).filter(function (grant) { return grant.botId !== botId; });
            if (packages.length) state.devices[index].grants.push({ botId: botId, packages: packages.slice() });
          }
          drafts.delete(device.id); feedback.set(device.id, packages.length ? tr(doc, '手机应用授权已保存。', 'Phone app access saved.') : tr(doc, '手机应用授权已撤销。', 'Phone app access revoked.'));
        } catch (error) {
          feedback.set(device.id, tr(doc, '授权操作失败：', 'Access update failed: ') + String(error && error.message || error));
        } finally {
          pendingActions.delete(device.id); renderDevices();
          var updated = Array.from(list.querySelectorAll('.hardware-phone-device')).find(function (item) { return item.dataset.deviceId === device.id; });
          var focus = updated && (updated.querySelector('.hardware-phone-save:not(:disabled)') || updated.querySelector('.hardware-phone-stop'));
          if (focus) focus.focus({ preventScroll: true });
        }
      });
      var stop = el(doc, 'button', 'btn hardware-phone-stop', tr(doc, '停止任务', 'Stop task'));
      stop.type = 'button'; stop.disabled = !device.busy;
      stop.setAttribute('aria-label', tr(doc,
        '停止 ' + String(device.name || 'Android') + ' 上的活动任务',
        'Stop the active task on ' + String(device.name || 'Android')));
      stop.addEventListener('click', async function () {
        var bridge = api();
        if (!bridge || typeof bridge.androidPhoneStop !== 'function') {
          feedback.set(device.id, tr(doc, '当前桌面版无法停止手机任务。', 'Phone task control is unavailable in this desktop build.'));
          renderDevices(); return;
        }
        pendingActions.set(device.id, 'stop'); stop.disabled = true; stop.textContent = tr(doc, '停止中…', 'Stopping…');
        try {
          var result = await bridge.androidPhoneStop({ deviceId: device.id });
          if (!result || result.ok !== true) throw Error(result && result.message || tr(doc, '停止请求未完成。', 'Stop request did not complete.'));
          if (result.draining === false) device.busy = false;
          feedback.set(device.id, result.draining === true
            ? tr(doc, '已请求停止，任务正在收尾；刷新 Android 手机列表后确认状态。', 'Stop requested; the task is finishing. Refresh the Android phone list to confirm its state.')
            : result.draining === false
              ? tr(doc, '已请求停止。', 'Stop requested.')
              : tr(doc, '已发送停止请求；刷新 Android 手机列表后确认状态。', 'Stop request sent. Refresh the Android phone list to confirm its state.'));
        } catch (error) {
          feedback.set(device.id, tr(doc, '停止失败：', 'Stop failed: ') + String(error && error.message || error));
        } finally {
          pendingActions.delete(device.id); renderDevices();
          var updated = Array.from(list.querySelectorAll('.hardware-phone-device')).find(function (item) { return item.dataset.deviceId === device.id; });
          var focus = updated && updated.querySelector('.hardware-phone-stop');
          if (focus) focus.focus({ preventScroll: true });
        }
      });
      actions.append(save, stop);
      controls.append(botField, appField, actions);
      row.append(controls);
      syncSave(row, device, botSelect);
      var notice = feedback.get(device.id);
      if (notice) {
        var message = el(doc, 'p', 'hardware-phone-feedback', notice);
        message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite'); row.append(message);
      }
      return row;
    }
    function renderDevices() {
      list.replaceChildren();
      state.devices.forEach(function (device) { list.append(renderDevice(device)); });
      if (state.hasResult && !state.devices.length) list.append(el(doc, 'p', 'hardware-phone-empty', tr(doc, '未发现 Android 手机。检查 USB 调试后可再次刷新 Android。', 'No Android phones found. Check USB debugging and refresh Android again.')));
      if (state.hasResult && state.devices.length && !state.bots.length) list.append(el(doc, 'p', 'hardware-phone-empty', tr(doc, '没有可授权的本机 Bot。', 'No local Bots are available for phone access.')));
    }
    refresh.addEventListener('click', async function () {
      var bridge = api();
      if (!bridge || typeof bridge.androidPhoneList !== 'function') {
        status.textContent = tr(doc, '当前桌面版无法发现 Android 手机。', 'Android phone discovery is unavailable in this desktop build.');
        status.dataset.state = 'error'; return;
      }
      state.pending = true; refresh.disabled = true; refresh.textContent = tr(doc, '正在查找 Android…', 'Searching for Android…');
      area.setAttribute('aria-busy', 'true'); status.dataset.state = 'pending';
      try {
        var result = normalizePhoneList(await bridge.androidPhoneList());
        state.devices = result.devices; state.bots = result.bots; state.hasResult = true; state.stale = false;
        feedback.clear();
        var online = state.devices.filter(function (device) { return phoneState(device).state === 'online'; }).length;
        status.textContent = tr(doc,
          '已发现 ' + state.devices.length + ' 部手机，其中 ' + online + ' 部在线。发现设备不代表已授权 Bot 操作。',
          state.devices.length + ' phones found; ' + online + ' online. Discovery does not authorize Bot control.');
        status.dataset.state = 'ready';
        renderDevices();
      } catch (error) {
        state.stale = state.hasResult;
        var detail = String(error && error.message || error || tr(doc, '未知错误', 'Unknown error'));
        status.textContent = tr(doc, 'Android 刷新失败：', 'Android refresh failed: ') + detail + (state.hasResult ? tr(doc, ' 显示的是上次读取结果。', ' Showing the previous result.') : '');
        status.dataset.state = 'error'; renderDevices();
      } finally {
        state.pending = false; refresh.disabled = false; refresh.textContent = tr(doc, '刷新 Android', 'Refresh Android');
        area.removeAttribute('aria-busy');
      }
    });
    return area;
  }
  function mount(panel) {
    if (!panel || !panel.ownerDocument || panel.querySelector('#apps-hardware')) return false;
    var doc = panel.ownerDocument;
    var section = el(doc, 'details', 'apps-hardware apps-guide');
    section.id = 'apps-hardware';
    var summary = el(doc, 'summary');
    summary.id = 'apps-hardware-open';
    // Search scrolls its indexed element into view. Index the visible heading,
    // not the full expanded section, which can be taller than the viewport.
    summary.dataset.setting = tr(doc, '硬件设备 · 连接你的物理世界', 'Hardware devices · Connect your physical devices');
    summary.dataset.settingControl = summary.id;
    summary.dataset.settingKeywords = '连接硬件 物理世界 待加入 计划 todo to do list Android 安卓 手机 USB调试 adb 美团 美团外卖 Meituan delivery Settings 设置 权限 授权 停止任务 phone device discovery grant revoke stop 小爱 小米 小度 音箱 Play 增强版 L05C M5Stack USB Type-C 显示器 鼠标 键盘 宿主 设备 接口 WiFi 家庭 智能家居 Home Assistant Matter 蓝牙 电子秤 体重秤 ' +
      entries.map(function (item) { return [item.name, item.description, item.connection, item.requirements, item.next, item.guideLabel].join(' '); }).join(' ');
    var label = el(doc, 'span', 'apps-hardware-label');
    label.append(el(doc, 'span', 'apps-hardware-title', tr(doc, '硬件设备', 'Hardware devices')), el(doc, 'span', 'apps-hardware-subtitle', tr(doc, '连接你的物理世界', 'Connect your physical devices')));
    summary.append(label);
    section.append(summary);
    mountAndroidPhones(doc, section);
    mountInventory(doc, section);
    var usbHardware = panel.querySelector('#hardware-section');
    if (usbHardware) section.append(usbHardware);
    var plans = el(doc, 'details', 'hardware-plans apps-guide');
    var plansSummary = el(doc, 'summary');
    plansSummary.append(el(doc, 'span', '', tr(doc, '接入计划', 'Integration plans')), el(doc, 'span', 'hardware-plan-count', entries.length + tr(doc, ' 项待加入', ' planned integrations')));
    plans.append(plansSummary, el(doc, 'p', '', tr(doc, '以下控制连接器尚待加入；查看设备清单不会授予操作权限。', 'These control connectors are planned. Viewing device inventory does not grant permission to operate them.')));
    var grid = el(doc, 'div', 'apps-hardware-list');
    entries.forEach(function (item) {
      var copy = {};
      ['name', 'description', 'connection', 'requirements', 'next', 'guideLabel'].forEach(function (key) {
        copy[key] = tr(doc, item[key], entryEnglish[item.id][key]);
      });
      var card = el(doc, 'details', 'hardware-device');
      card.dataset.hardware = item.id;
      card.dataset.supportLevel = 'planned';
      var header = el(doc, 'summary'), icon = el(doc, 'span', 'hardware-device-icon');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" focusable="false">' + paths[item.icon] + '</svg>';
      var heading = el(doc, 'span', 'hardware-device-copy');
      heading.append(el(doc, 'span', 'hardware-device-name', copy.name), el(doc, 'span', 'hardware-device-description', copy.description));
      header.append(icon, heading, el(doc, 'span', 'hardware-device-status', tr(doc, '待加入', 'Planned'))); card.append(header);
      var guide = el(doc, 'div', 'hardware-device-plan');
      guide.append(el(doc, 'p', '', tr(doc, '连接方式：', 'Connection: ') + copy.connection), el(doc, 'p', '', copy.requirements), el(doc, 'p', '', copy.next));
      var link = el(doc, 'a', 'apps-developer-link', copy.guideLabel);
      link.href = item.guideUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', copy.guideLabel + tr(doc, '（外部浏览器）', ' (external browser)'));
      guide.append(link); card.append(guide); grid.append(card);
    });
    plans.append(grid); section.append(plans);
    var target = panel.querySelector('.apps-target') || panel.firstChild;
    panel.insertBefore(section, target);
    var software = el(doc, 'h3', 'apps-software-title', tr(doc, '软件应用', 'Software apps'));
    software.id = 'apps-software-title';
    panel.insertBefore(software, target);
    return true;
  }
  return Object.freeze({ entries: entries, mount: mount });
});
