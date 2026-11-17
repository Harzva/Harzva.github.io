(function (root) {
  'use strict';

  var document = root.document;
  var state = {
    initialized: false,
    snapshot: null,
    busy: '',
    lastError: '',
    message: '',
    messageState: 'idle',
    request: 0,
    unsubscribe: null,
    visible: false,
    detailsOpen: Object.create(null),
    refreshAfterBusy: false,
    ptt: {
      phase: 'idle', pressHeld: false, pressSource: '', pointerId: null,
      turnEpoch: null, captureId: '', deviceId: '', terminalReason: '', terminalTurnEpoch: null,
      startPending: false, queuedAction: null, request: 0, error: '', errorCode: '',
      feedbackTimer: null, refreshContentAfterPtt: false, skipFocusRestore: false
    },
    mirror: { busy: false, request: 0, deviceId: '', dataUrl: '', at: null, error: '', auto: false, timer: null }
  };
  var els = {};

  function tr(zh, en, params) {
    return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function'
      ? root.OpenBotI18n.t(zh, en, params) : zh;
  }

  function node(tag, className, text) {
    var item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined && text !== null) item.textContent = String(text);
    return item;
  }

  function append(parent) {
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]);
  }

  function stringValue(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : '';
  }

  function finiteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  function apiMethod(name) {
    return root.grokbot && typeof root.grokbot[name] === 'function' ? root.grokbot[name] : null;
  }

  function displaySnapshot(snapshot) {
    return snapshot && snapshot.display && typeof snapshot.display === 'object' ? snapshot.display : null;
  }

  function gatewaySnapshot(snapshot) {
    return snapshot && snapshot.gateway && typeof snapshot.gateway === 'object' ? snapshot.gateway : null;
  }

  function displayForDevice(snapshot, device) {
    var display = displaySnapshot(snapshot);
    var displayId = display && stringValue(display.deviceId);
    return displayId && device && String(device.id || '') === displayId ? display : null;
  }

  function syncForDevice(snapshot, device) {
    var display = displaySnapshot(snapshot);
    if (display) return displayForDevice(snapshot, device);
    return device && device.sync && typeof device.sync === 'object' ? device.sync : null;
  }

  function gatewayDeviceFor(snapshot, deviceId) {
    var gateway = gatewaySnapshot(snapshot);
    var devices = gateway && Array.isArray(gateway.devices) ? gateway.devices : [];
    var id = stringValue(deviceId);
    return id ? devices.find(function (device) { return device && String(device.id || '') === id; }) || null : null;
  }

  function pttSnapshot(snapshot) {
    var bridge = snapshot && snapshot.bridge && typeof snapshot.bridge === 'object' ? snapshot.bridge : null;
    return bridge && bridge.ptt && typeof bridge.ptt === 'object' ? bridge.ptt : null;
  }

  function pttMethodsAvailable() {
    return !!(apiMethod('hardwarePttStart') && apiMethod('hardwarePttStop') && apiMethod('hardwarePttCancel'));
  }

  function pttReasonText(code) {
    var known = Object.create(null);
    known.VOICE_RUNTIME_UNAVAILABLE = tr('Mac 语音服务尚未就绪。请检查服务状态后重试。', 'The Mac voice service is not ready. Check its status and try again.');
    known.HARDWARE_PTT_PROTOCOL_UNSUPPORTED = tr('当前固件不支持此按住说话协议。', 'The current firmware does not support the required push-to-talk protocol.');
    known.HARDWARE_PTT_UNSUPPORTED = tr('当前固件未声明按住说话能力。', 'The current firmware does not advertise push-to-talk support.');
    known.HARDWARE_TARGET_UNAVAILABLE = tr('尚未设置可用的对话 Bot。', 'No available conversation Bot is selected.');
    known.HARDWARE_DEVICE_UNAVAILABLE = tr('语音设备当前未连接。', 'The voice device is not connected.');
    known.HARDWARE_PTT_STOP_UNCONFIRMED = tr('设备尚未确认停止收音；本轮不会发送。请检查连接后重试。', 'The device has not confirmed that recording stopped; this turn will not be sent. Check the connection and try again.');
    known.HARDWARE_PTT_STOP_TIMEOUT = known.HARDWARE_PTT_STOP_UNCONFIRMED;
    known.HARDWARE_PTT_STALE = tr('设备语音会话已变化；本轮已丢弃，请重新按住说话。', 'The device voice session changed. This turn was discarded; hold to talk again.');
    known.HARDWARE_PTT_BUSY = tr('上一轮收音尚未结束。等待设备确认后重试。', 'The previous capture has not finished. Wait for device confirmation and try again.');
    known.QWEN_TTS_PROFILE_REQUIRED = tr('尚未配置语音合成配置；完成设置后可按住说话。', 'Speech synthesis is not configured; finish voice settings to use push-to-talk.');
    known.LOCAL_TTS_NOT_READY = tr('Mac 本地语音服务尚未就绪。', 'The Mac local voice service is not ready.');
    known.LOCAL_TTS_RUNTIME_MISSING = known.LOCAL_TTS_NOT_READY;
    known.LOCAL_TTS_MODEL_MISSING = known.LOCAL_TTS_NOT_READY;
    known.LOCAL_TTS_START_TIMEOUT = known.LOCAL_TTS_NOT_READY;
    known.LOCAL_TTS_START_FAILED = known.LOCAL_TTS_NOT_READY;
    known.LOCAL_TTS_PROCESS_FAILED = known.LOCAL_TTS_NOT_READY;
    known.LOCAL_TTS_PROCESS_EXITED = known.LOCAL_TTS_NOT_READY;
    known.LOCAL_TTS_WARMUP_FAILED = known.LOCAL_TTS_NOT_READY;
    known.LOCAL_TTS_WARMUP_LIMIT = known.LOCAL_TTS_NOT_READY;
    known.AUDIO_RUNTIME_UNAVAILABLE = tr('Mac 音频输入尚未就绪。', 'Mac audio input is not ready.');
    known.AUDIO_CAPTURE_UNAVAILABLE = known.AUDIO_RUNTIME_UNAVAILABLE;
    if (Object.prototype.hasOwnProperty.call(known, code)) return known[code];
    if (/^AUDIO_/.test(code)) return tr('Mac 音频输入发生错误；本轮不会发送。', 'Mac audio input reported an error; this turn will not be sent.');
    return '';
  }

  function pttUnavailableReason(snapshot) {
    var bridge = snapshot && snapshot.bridge && typeof snapshot.bridge === 'object' ? snapshot.bridge : null;
    var ptt = pttSnapshot(snapshot);
    var runtime = bridge && bridge.runtime && typeof bridge.runtime === 'object' ? bridge.runtime : null;
    var runtimeControl = runtime && runtime.control && typeof runtime.control === 'object' ? runtime.control : null;
    var reason = stringValue(bridge && bridge.reason) || (bridge && bridge.available !== true ? stringValue(bridge.error) : '');
    if (!bridge) return tr('语音状态尚未读取，按住说话暂不可用。', 'Voice readiness has not been read; push-to-talk is unavailable.');
    if (bridge.muted === true || bridge.state === 'muted' || runtime && runtime.muted === true || runtimeControl && runtimeControl.status === 'muted') {
      return tr('语音输入已静音，解除静音后可按住说话。', 'Voice input is muted. Unmute it to use push-to-talk.');
    }
    if (reason) return pttReasonText(reason) || tr('语音服务未就绪：{reason}', 'Voice service is not ready: {reason}', { reason: reason.slice(0, 100) });
    if (bridge.available !== true) {
      if (bridge.status === 'unavailable' || runtime && ['unavailable', 'closed', 'rebinding'].indexOf(runtime.bindingState) >= 0) {
        return tr('语音主机未就绪，按住说话已停用。', 'The voice host is not ready; push-to-talk is disabled.');
      }
      return tr('语音就绪状态未知，按住说话已停用。', 'Voice readiness is unknown; push-to-talk is disabled.');
    }
    if (bridge.connected !== true) return tr('语音设备未连接；连接后可按住说话。', 'The voice device is not connected; connect it to use push-to-talk.');
    if (!ptt) return tr('固件按住说话能力尚未读取。', 'Firmware push-to-talk capability has not been read.');
    if (ptt.supported !== true) {
      return pttReasonText('HARDWARE_PTT_PROTOCOL_UNSUPPORTED');
    }
    if (!pttMethodsAvailable()) return tr('此桌面版尚未提供按住、松开和取消接口。', 'This desktop build does not provide push, release, and cancel controls.');
    return '';
  }

  function pttReady(snapshot) {
    return pttUnavailableReason(snapshot) === '';
  }

  function pttResultError(result, fallback) {
    if (result && result.ok === true) return null;
    var error = new Error(stringValue(result && result.message) || fallback);
    error.code = stringValue(result && result.code) || 'HARDWARE_PTT_FAILED';
    return error;
  }

  function pttErrorText(error) {
    var code = stringValue(error && error.code);
    var known = pttReasonText(code);
    if (known) return known;
    var message = stringValue(error && error.message);
    return message && message !== 'API_UNAVAILABLE'
      ? message.slice(0, 180)
      : tr('按住说话操作失败，请检查设备与语音连接。', 'Push-to-talk failed. Check the device and voice connection.');
  }

  function callApi(name, args) {
    var method = apiMethod(name);
    if (!method) return Promise.reject(new Error('API_UNAVAILABLE'));
    return Promise.resolve().then(function () { return method.apply(root.grokbot, args || []); });
  }

  function button(label, action, id) {
    var item = node('button', 'btn', label);
    item.type = 'button';
    item.dataset.hardwareAction = action;
    if (id) item.id = id;
    return item;
  }

  function icon(container) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.7');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    var paths = [
      'M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5Z',
      'M9 8h6M9 12h6M9 16h2',
      'M3.5 8v2M3.5 14v2M20.5 8v2M20.5 14v2'
    ];
    paths.forEach(function (path) {
      var shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      shape.setAttribute('d', path);
      svg.appendChild(shape);
    });
    container.setAttribute('aria-hidden', 'true');
    container.appendChild(svg);
  }

  function visibleInSettings() {
    var panel = document.getElementById('set-panel-apps');
    var mask = document.getElementById('set-mask');
    if (!(panel && !panel.hidden && mask && !mask.classList.contains('hidden') && !document.hidden)) return false;
    var section = document.getElementById('hardware-section');
    for (var parent = section && section.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS' && !parent.open) return false;
    }
    return true;
  }

  function createAvatar(bot) {
    var wrapper = node('span', 'hardware-avatar');
    var avatars = root.OpenBotAvatars;
    var avatarId = bot && stringValue(bot.avatar);
    if (avatarId && avatars && Array.isArray(avatars.ids) && avatars.ids.indexOf(avatarId) >= 0 && typeof avatars.markup === 'function') {
      var template = document.createElement('template');
      template.innerHTML = avatars.markup(bot.avatar, bot.color, { size: 'companion', pose: 'idle' });
      if (template.content.firstElementChild) wrapper.appendChild(template.content.firstElementChild);
    }
    if (!wrapper.firstChild) wrapper.hidden = true;
    wrapper.setAttribute('aria-hidden', 'true');
    return wrapper;
  }

  function formatDate(value) {
    var time = finiteNumber(value);
    if (time === null || !Number.isFinite(new Date(time).getTime())) return tr('未读取', 'Not read');
    try {
      if (root.OpenBotI18n && typeof root.OpenBotI18n.date === 'function') {
        return root.OpenBotI18n.date(time, { dateStyle: 'medium', timeStyle: 'short' });
      }
    } catch (_) { }
    return new Date(time).toLocaleString();
  }

  function formatBytes(value) {
    var bytes = finiteNumber(value);
    if (bytes === null || bytes < 0) return tr('未读取', 'Not read');
    var units = ['B', 'KB', 'MB', 'GB'];
    var amount = bytes;
    var unit = 0;
    while (amount >= 1024 && unit < units.length - 1) {
      amount /= 1024;
      unit++;
    }
    var rounded = Math.round(amount * 10) / 10;
    var number = root.OpenBotI18n && typeof root.OpenBotI18n.number === 'function'
      ? root.OpenBotI18n.number(rounded, { maximumFractionDigits: 1 }) : String(rounded);
    return number + ' ' + units[unit];
  }

  function unknown(value) {
    if (value === null || value === undefined || value === '') return tr('未读取', 'Not read');
    if (typeof value === 'number' && !Number.isFinite(value)) return tr('未读取', 'Not read');
    if (typeof value !== 'string' && typeof value !== 'number') return tr('未读取', 'Not read');
    return String(value);
  }

  function setFeedback(message, tone) {
    state.message = message || '';
    state.messageState = tone || 'idle';
    if (!els.message) return;
    els.message.textContent = state.message;
    els.message.dataset.state = state.messageState;
  }

  function validSnapshot(value) {
    return !!value && typeof value === 'object' && typeof value.available === 'boolean' && Array.isArray(value.devices);
  }

  function unwrapSnapshot(value) {
    if (value && value.ok === false) {
      var failure = new Error('REQUEST_FAILED');
      failure.code = value.code || 'REQUEST_FAILED';
      throw failure;
    }
    var snapshot = value && value.snapshot ? value.snapshot : value;
    if (!validSnapshot(snapshot)) throw new Error('INVALID_SNAPSHOT');
    return snapshot;
  }

  function rememberDetails() {
    if (!els.content) return;
    Array.prototype.forEach.call(els.content.querySelectorAll('details[data-hardware-details]'), function (item) {
      state.detailsOpen[item.dataset.hardwareDetails] = item.open;
    });
  }

  function captureActionFocus() {
    var active = document.activeElement;
    if (!active) return null;
    if (active.dataset && active.dataset.hardwareAction) {
      return { type: 'action', action: active.dataset.hardwareAction, deviceId: active.dataset.deviceId || '' };
    }
    if (active.dataset && active.dataset.hardwarePtt === 'true') return { type: 'ptt' };
    if (active.tagName === 'SUMMARY' && active.parentElement && active.parentElement.dataset.hardwareDetails) {
      return { type: 'summary', key: active.parentElement.dataset.hardwareDetails };
    }
    return null;
  }

  function restoreActionFocus(info) {
    if (!info || !els.host) return;
    if (info.type === 'ptt') {
      var pttButton = els.host.querySelector('[data-hardware-ptt="true"]');
      if (pttButton && !pttButton.disabled) {
        try { pttButton.focus({ preventScroll: true }); } catch (_) { pttButton.focus(); }
      }
      return;
    }
    if (info.type === 'summary') {
      var details = els.host.querySelectorAll('details[data-hardware-details]');
      for (var d = 0; d < details.length; d++) {
        if (details[d].dataset.hardwareDetails === info.key) {
          try { details[d].querySelector('summary').focus({ preventScroll: true }); } catch (_) { details[d].querySelector('summary').focus(); }
          return;
        }
      }
    }
    var items = els.host.querySelectorAll('[data-hardware-action]');
    for (var i = 0; i < items.length; i++) {
      if (info.type === 'action' && items[i].dataset.hardwareAction === info.action && (items[i].dataset.deviceId || '') === info.deviceId) {
        try { items[i].focus({ preventScroll: true }); } catch (_) { items[i].focus(); }
        return;
      }
    }
  }

  function setDetailsOpen(details, key) {
    details.dataset.hardwareDetails = key;
    details.open = state.detailsOpen[key] === true;
    return details;
  }

  function fact(label, value, note) {
    var wrapper = node('div', 'hardware-fact');
    var term = node('dt', '', label);
    var description = node('dd', '', value);
    append(wrapper, term, description);
    if (note) wrapper.appendChild(node('p', 'hardware-fact-note', note));
    return wrapper;
  }

  function wirelessName(id) {
    if (id === 'wifi-2.4') return 'Wi-Fi 2.4 GHz';
    if (id === 'ble5') return 'Bluetooth LE 5';
    return tr('其他无线能力', 'Other wireless capability');
  }

  function runtimeState(value) {
    var known = Object.create(null);
    known.wifi_configuring = tr('等待 Wi-Fi 配网', 'Waiting for Wi-Fi setup');
    known.wifi_connected = tr('Wi-Fi 已连接', 'Wi-Fi connected');
    known.wifi_disconnected = tr('Wi-Fi 未连接', 'Wi-Fi not connected');
    known.starting = tr('设备启动中', 'Device starting');
    known.running = tr('运行中', 'Running');
    known.idle = tr('待机', 'Idle');
    known.error = tr('设备报告错误', 'Device reported an error');
    return Object.prototype.hasOwnProperty.call(known, value) ? known[value] : tr('未读取', 'Not read');
  }

  function runtimeObservationNote(runtime, field) {
    var observedAt = runtime ? finiteNumber(runtime[field]) : null;
    if (observedAt === null && runtime) observedAt = finiteNumber(runtime.observedAt);
    return observedAt !== null
      ? tr('最近观测 {time} · 非实时', 'Last observed {time} · not live', { time: formatDate(observedAt) })
      : tr('非实时观测', 'Not a live reading');
  }

  function currentFirmwareBlock(firmware) {
    if (!firmware || typeof firmware !== 'object' || Array.isArray(firmware)) return null;
    var block = node('div', 'hardware-current-firmware');
    block.appendChild(node('h5', 'hardware-current-firmware-title', tr('当前固件（设备回读）', 'Current firmware (device readback)')));
    var facts = node('dl', 'hardware-facts hardware-current-firmware-facts');
    var chip = stringValue(firmware.chip);
    if (chip.toLowerCase() === 'esp32s3') chip = 'ESP32-S3';
    var protocolVersion = finiteNumber(firmware.protocolVersion);
    append(facts,
      fact(tr('芯片', 'Chip'), chip || tr('未读取', 'Not read')),
      fact(tr('板型', 'Board'), stringValue(firmware.board) || tr('未读取', 'Not read')),
      fact(tr('版本', 'Version'), stringValue(firmware.version) || tr('未读取', 'Not read')),
      fact(tr('同步协议', 'Sync protocol'), protocolVersion === null ? tr('未读取', 'Not read') : String(protocolVersion)));
    var fullHash = stringValue(firmware.elfSha256);
    var validHash = /^[0-9a-f]{64}$/i.test(fullHash);
    var hashFact = fact(
      tr('固件 ELF SHA-256', 'Firmware ELF SHA-256'),
      validHash ? fullHash.slice(0, 12) + '…' : tr('未读取', 'Not read')
    );
    if (validHash) {
      var hashValue = hashFact.querySelector('dd');
      hashValue.title = fullHash;
      hashValue.classList.add('hardware-firmware-hash-value');
    }
    facts.appendChild(hashFact);
    block.appendChild(facts);
    return block;
  }

  // Source references describe the board firmware family; they are not a live button-capability query.
  var BOARD_BUTTON_REFERENCES = {
    'zhengchen-minicam-wifi': [
      {
        label: 'BOOT（用户键）',
        current: tr('当前固件：单击开始/停止对话（等同唤醒）；设备启动中单击进入配网模式。', 'Current firmware: click starts/stops the conversation (same as the wake word); click during startup enters Wi-Fi config mode.'),
        note: tr('对应 GPIO 11。厂商 2.2.6.6 镜像存在该键构造证据；当前行为以设备回读的固件版本为准。', 'GPIO 11. The vendor 2.2.6.6 image has constructor evidence for this key; current behavior follows the firmware version read back from the device.')
      },
      {
        label: tr('左/右音量键', 'Left/right volume keys'),
        current: tr('已接入：按一下音量 -10 / +10（恢复厂商行为）。', 'Wired: one press changes volume by -10 / +10 (vendor behavior restored).'),
        note: tr('左右键共用 GPIO 9 的 ADC 分压电路（左=减、右=加）；这是厂商 2.2.6.6 的原始行为。', 'Both keys share the ADC resistor ladder on GPIO 9 (left = down, right = up); this is the original vendor 2.2.6.6 behavior.')
      }
    ]
  };

  function buttonsBlock(firmware) {
    if (!firmware || typeof firmware !== 'object' || Array.isArray(firmware)) return null;
    var board = stringValue(firmware.board);
    var buttons = board ? BOARD_BUTTON_REFERENCES[board] : null;
    if (!buttons) return null;
    var block = node('div', 'hardware-current-firmware hardware-buttons');
    block.appendChild(node('h5', 'hardware-current-firmware-title', tr('按键（源码参考）', 'Buttons (source reference)')));
    var facts = node('dl', 'hardware-facts hardware-current-firmware-facts');
    buttons.forEach(function (buttonRef) {
      facts.appendChild(fact(buttonRef.label, buttonRef.current, buttonRef.note));
    });
    facts.appendChild(fact(
      tr('重设为其他功能', 'Reassigning to other actions'),
      tr('需要先更新设备固件接入按键；之后即可在 Bot Studio 设置中为每个动作指定按键。', 'A firmware update must wire the button first; afterwards Bot Studio settings can assign each action to a button.')
    ));
    block.appendChild(facts);
    block.appendChild(node('p', 'hardware-observed', tr(
      '来源：板型「{board}」的固件源码参考，非设备实时查询；设备固件当前未上报按键能力。',
      'Source: firmware source reference for board "{board}"; not a live device query. The device firmware does not currently report button capabilities.',
      { board: board }
    )));
    return block;
  }

  function wifiSignalText(value) {
    if (value === 'strong') return tr('强', 'Strong');
    if (value === 'medium') return tr('中', 'Medium');
    if (value === 'weak') return tr('弱', 'Weak');
    return tr('未读取', 'Not read');
  }

  function wifiSignalValue(live) {
    var signal = wifiSignalText(live && live.wifiSignal);
    var ssid = stringValue(live && live.wifiSsid);
    return ssid ? signal + ' · ' + ssid : signal;
  }

  function screenSyncLabel(status) {
    switch (status) {
      case 'offline': return tr('屏幕控制器离线', 'Display controller offline');
      case 'needs-firmware': return tr('设备固件尚不支持屏幕形象同步', 'Device firmware does not support screen companion sync yet');
      case 'rendering': return tr('正在生成屏幕形象', 'Rendering screen companion');
      case 'downloading': return tr('正在传输屏幕形象', 'Transferring screen companion');
      case 'clearing': return tr('正在清除屏幕形象', 'Clearing screen companion');
      case 'disabled': return tr('屏幕形象同步已停用', 'Screen companion sync is disabled');
      case 'synced': return tr('设备已回读确认形象', 'Device readback confirmed the companion');
      case 'error': return tr('屏幕形象同步失败', 'Screen companion sync failed');
      default: return tr('屏幕同步状态未读取', 'Screen sync state not read');
    }
  }

  function screenSyncTone(status) {
    if (status === 'synced') return 'synced';
    if (status === 'error') return 'error';
    if (status === 'rendering' || status === 'downloading' || status === 'clearing' || status === 'needs-firmware') return 'pending';
    if (status === 'offline') return 'offline';
    if (status === 'disabled') return 'disabled';
    return 'unknown';
  }

  function screenSyncNote(status) {
    switch (status) {
      case 'offline': return tr('屏幕控制器目前不可达。', 'The display controller is currently unreachable.');
      case 'needs-firmware': return tr('当前屏幕动画未同步到设备。', 'Screen animation is not currently synced to the device.');
      case 'rendering': return tr('正在为当前桌面伙伴生成设备屏幕动画。', 'Preparing a screen animation for the current desktop companion.');
      case 'downloading': return tr('正在向设备传输屏幕动画。', 'Transferring the screen animation to the device.');
      case 'clearing': return tr('正在清除设备上的屏幕动画。', 'Clearing the screen animation from the device.');
      case 'disabled': return tr('设备屏幕形象同步当前已停用。', 'Screen companion sync is currently disabled.');
      case 'synced': return tr('设备已回读 Bot 身份、版本与 SHA-256，全部匹配。', 'Device readback matched the Bot identity, revision, and SHA-256.');
      case 'error': return tr('屏幕形象同步未完成，请检查设备连接后重试。', 'Screen companion sync did not complete. Check the device connection and retry.');
      default: return tr('尚未收到屏幕同步状态。', 'No screen sync status has been reported.');
    }
  }

  function screenSyncPolicyLabel(policy) {
    if (policy === 'follow-desktop') return tr('跟随桌面伙伴', 'Follow desktop companion');
    if (policy === 'disabled') return tr('已停用', 'Disabled');
    return tr('策略未读取', 'Policy not read');
  }

  function infoDisclosure(device, display) {
    var details = setDetailsOpen(node('details', 'hardware-info'), 'info:' + device.id);
    var summary = node('summary', '', tr('硬件、固件与能力', 'Hardware, firmware and capabilities'));
    details.appendChild(summary);
    var body = node('div', 'hardware-info-body');
    var info = device.info;
    if (!info || typeof info !== 'object') {
      body.appendChild(node('p', 'hardware-empty-info', tr(
        '尚未读取设备探测信息。可读取设备状态，或导入已有探测报告。',
        'No device details have been read. Read the device status or import an existing probe report.'
      )));
    } else {
      var facts = node('dl', 'hardware-facts');
      append(facts,
        fact(tr('芯片', 'Chip'), unknown(info.chip)),
        fact(tr('板型', 'Board'), unknown(info.board)),
        fact(tr('固件（记录）', 'Firmware (recorded)'), unknown(info.firmware)),
        fact(tr('Flash', 'Flash'), formatBytes(info.flashBytes)),
        fact(tr('PSRAM', 'PSRAM'), formatBytes(info.psramBytes)),
        fact(tr('资源空间', 'Asset space'), formatBytes(info.assetsBytes)));

      var screen = info.screen && typeof info.screen === 'object' ? info.screen : null;
      var screenText = screen
        ? unknown(screen.controller) + ' · ' + (screen.width && screen.height ? screen.width + ' × ' + screen.height : tr('尺寸未读取', 'Size not read'))
        : tr('未读取', 'Not read');
      var screenNote = screen && screen.evidence === 'reference'
        ? tr('同板型源码参考，非设备查询', 'Reference from the same board source; not queried from this device')
        : screen && screen.evidence === 'observed'
          ? tr('设备已报告', 'Reported by the device') : '';
      facts.appendChild(fact(tr('屏幕', 'Display'), screenText, screenNote));
      facts.appendChild(fact(tr('摄像头', 'Camera'), unknown(info.camera)));
      facts.appendChild(fact(tr('音频', 'Audio'), unknown(info.audio)));

      var wireless = Array.isArray(info.wireless) && info.wireless.length
        ? info.wireless.map(function (item) {
          return wirelessName(item) + ' · ' + tr('支持 · 连接状态未读取', 'Supported · connection state not read');
        }).join('；')
        : tr('未读取', 'Not read');
      facts.appendChild(fact(tr('无线能力', 'Wireless'), wireless));

      body.appendChild(facts);

      var source = device.infoSource === 'imported-probe'
        ? tr('导入的探测记录', 'Imported probe report')
        : device.infoSource === 'serial-log'
          ? tr('串口读取记录', 'Serial reading') : tr('来源未读取', 'Source not read');
      body.appendChild(node('p', 'hardware-observed', tr(
        '信息来源：{source} · 最近观测：{time} · 非实时',
        'Source: {source} · Last observed: {time} · not live',
        { source: source, time: formatDate(device.infoObservedAt) }
      )));
    }
    var live = display && display.live && typeof display.live === 'object' ? display.live : null;
    if (live) {
      var liveFacts = node('dl', 'hardware-facts hardware-live-facts');
      append(liveFacts,
        fact(tr('音量', 'Volume'), Number.isInteger(live.volume) ? String(live.volume) + ' / 100' : tr('未读取', 'Not read')),
        fact(tr('Wi-Fi 信号', 'Wi-Fi signal'), wifiSignalValue(live)),
        fact(tr('屏幕亮度', 'Brightness'), Number.isInteger(live.brightness) ? String(live.brightness) + ' / 100' : tr('未读取', 'Not read')));
      body.appendChild(node('h5', 'hardware-current-firmware-title', tr('设备实时状态', 'Live device status')));
      body.appendChild(liveFacts);
      body.appendChild(node('p', 'hardware-observed', tr(
        '设备读数：{time}', 'Device reading: {time}', { time: formatDate(live.readAt) }
      )));
    }
    var firmware = display && display.firmware && typeof display.firmware === 'object' ? display.firmware : null;
    var liveFirmware = currentFirmwareBlock(firmware);
    if (liveFirmware) body.appendChild(liveFirmware);
    var liveButtons = buttonsBlock(firmware);
    if (liveButtons) body.appendChild(liveButtons);
    var runtime = device.runtime && typeof device.runtime === 'object' ? device.runtime : null;
    var runtimeFacts = node('dl', 'hardware-facts hardware-runtime-facts');
    runtimeFacts.appendChild(fact(
      tr('历史运行状态', 'Historical runtime state'),
      runtime ? runtimeState(runtime.state) : tr('未读取', 'Not read'),
      runtime ? runtimeObservationNote(runtime, 'stateObservedAt') : ''
    ));
    runtimeFacts.appendChild(fact(
      tr('网络地址（最近读取）', 'Network address (last read)'),
      runtime && stringValue(runtime.ipAddress) ? stringValue(runtime.ipAddress) : tr('未读取', 'Not read'),
      runtime ? runtimeObservationNote(runtime, 'ipObservedAt') : ''
    ));
    if (runtime && finiteNumber(runtime.freeSramBytes) !== null) {
      runtimeFacts.appendChild(fact(
        tr('可用 SRAM', 'Free SRAM'),
        formatBytes(runtime.freeSramBytes),
        runtimeObservationNote(runtime, 'freeSramObservedAt')
      ));
    }
    body.appendChild(runtimeFacts);
    details.appendChild(body);
    return details;
  }

  function serialLabel(device) {
    var serial = device.serial && typeof device.serial === 'object' ? device.serial : {};
    var status = serial.status;
    if (state.busy === 'probe:' + device.id || status === 'reading') return { label: tr('正在读取…', 'Reading…'), tone: 'pending' };
    if (status === 'ok') return { label: tr('读取完成', 'Read complete'), tone: 'ok' };
    if (status === 'silent') return { label: tr('设备未回应', 'No response from device'), tone: 'error' };
    if (status === 'busy') return { label: tr('串口正忙', 'Serial port busy'), tone: 'error' };
    if (status === 'error') {
      var errorText = stringValue(serial.error || '');
      var busyError = /busy|in use|EBUSY|resource busy/i.test(errorText);
      return busyError
        ? { label: tr('串口正忙', 'Serial port busy'), tone: 'error' }
        : { label: tr('读取失败', 'Read failed'), tone: 'error' };
    }
    return { label: tr('尚未读取', 'Not checked'), tone: 'idle' };
  }

  function gatewayLinkText(snapshot, deviceId) {
    var gateway = gatewaySnapshot(snapshot);
    if (!gateway) return tr('Bot Studio 状态未读取', 'Bot Studio status not read');
    if (gateway.running === false) return tr('Bot Studio 网关未运行', 'Bot Studio gateway is not running');
    var gatewayDevice = gatewayDeviceFor(snapshot, deviceId);
    if (!gatewayDevice) return gateway.running === true
      ? tr('Bot Studio 设备状态未读取', 'Bot Studio device status not read')
      : tr('Bot Studio 状态未读取', 'Bot Studio status not read');
    if (gatewayDevice.connected === true) {
      return gatewayDevice.ready === false
        ? tr('Bot Studio 网关已连接 · 控制未就绪', 'Bot Studio gateway connected · control not ready')
        : tr('Bot Studio 网关已接通', 'Bot Studio gateway connected');
    }
    if (gatewayDevice.connected === false) return tr('Bot Studio 网关未接通', 'Bot Studio gateway not connected');
    return tr('Bot Studio 网关状态未读取', 'Bot Studio gateway status not read');
  }

  function mirrorTargetDevice(snapshot) {
    var display = displaySnapshot(snapshot);
    var deviceId = display && stringValue(display.deviceId);
    if (!deviceId || !snapshot || !Array.isArray(snapshot.devices)) return null;
    var gateway = gatewaySnapshot(snapshot);
    var gatewayDevice = gatewayDeviceFor(snapshot, deviceId);
    if (!gateway || gateway.running !== true || !gatewayDevice || gatewayDevice.connected !== true || gatewayDevice.ready !== true ||
      display.status === 'offline') return null;
    var displaySessionId = stringValue(display.sessionId);
    if (displaySessionId && stringValue(gatewayDevice.sessionId) !== displaySessionId) return null;
    if (display.generation !== undefined && display.generation !== null &&
      String(gatewayDevice.generation === undefined ? '' : gatewayDevice.generation) !== String(display.generation)) return null;
    var device = snapshot.devices.find(function (item) {
      return item && String(item.id || '') === deviceId;
    });
    return device ? { device: device, display: display, deviceId: deviceId } : null;
  }

  function validFrameDataUrl(value) {
    return typeof value === 'string' && value.length <= 8 * 1024 * 1024 &&
      /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(value);
  }

  function mirrorSection(device, display, snapshot) {
    if (!display || !display.deviceId || String(display.deviceId) !== String(device.id || '')) return null;
    var targetAvailable = !!mirrorTargetDevice(snapshot);
    var mirror = node('div', 'hardware-mirror');
    var mirrorHead = node('div', 'hardware-mirror-head');
    var snapButton = button(tr('抓取屏幕（1:1）', 'Capture screen (1:1)'), 'snapshot', 'hardware-snapshot-btn');
    snapButton.dataset.deviceId = String(device.id || '');
    snapButton.disabled = !targetAvailable || state.mirror.busy || !apiMethod('hardwareSnapshot');
    snapButton.setAttribute('aria-label', tr('抓取 {name} 屏幕原像素快照', 'Capture a native-pixel screen frame from {name}', {
      name: stringValue(device.name) || tr('USB 设备', 'USB device')
    }));
    mirrorHead.appendChild(snapButton);
    var autoLabel = node('label', 'hardware-mirror-auto');
    var autoBox = node('input');
    autoBox.type = 'checkbox';
    autoBox.dataset.hardwareAction = 'snapshot-auto';
    autoBox.dataset.deviceId = String(device.id || '');
    autoBox.checked = state.mirror.auto === true;
    autoBox.disabled = !targetAvailable || !apiMethod('hardwareSnapshot');
    autoBox.setAttribute('aria-label', tr('每 2 秒自动刷新设备屏幕快照', 'Refresh the device screen snapshot every 2 seconds'));
    autoLabel.appendChild(autoBox);
    autoLabel.appendChild(node('span', '', tr('每 2 秒自动刷新', 'Auto refresh every 2s')));
    mirrorHead.appendChild(autoLabel);
    mirror.appendChild(mirrorHead);
    if (!apiMethod('hardwareSnapshot')) {
      mirror.appendChild(node('p', 'hardware-sync-note', tr('屏幕快照接口尚未接入。', 'The screen snapshot API is not connected yet.')));
    } else if (state.mirror.busy && state.mirror.deviceId === String(device.id || '')) {
      mirror.appendChild(node('p', 'hardware-sync-note', tr('正在抓取设备屏幕…', 'Capturing device screen…')));
    } else if (state.mirror.error && state.mirror.deviceId === String(device.id || '')) {
      mirror.appendChild(node('p', 'hardware-sync-note hardware-mirror-error', state.mirror.error));
    } else if (state.mirror.dataUrl && state.mirror.deviceId === String(device.id || '')) {
      var img = node('img', 'hardware-mirror-img');
      img.src = state.mirror.dataUrl;
      img.width = 320;
      img.height = 240;
      img.alt = tr('设备屏幕镜像（320×240 原像素）', 'Device screen mirror (320×240 native pixels)');
      mirror.appendChild(img);
      mirror.appendChild(node('p', 'hardware-sync-note', tr(
        '抓取于 {time} · 320×240 原像素 1:1，不经摄像头。',
        'Captured at {time} · 320×240 native pixels, 1:1, no camera involved.',
        { time: formatDate(state.mirror.at) }
      )));
    } else {
      mirror.appendChild(node('p', 'hardware-sync-note', tr(
        '点击抓取后在此显示设备屏幕的 1:1 镜像。',
        'Capture the screen to show a 1:1 mirror of the device framebuffer here.'
      )));
    }
    return mirror;
  }

  function displaySyncSection(snapshot) {
    var display = displaySnapshot(snapshot);
    if (!display) return null;
    var section = node('section', 'hardware-display');
    var heading = node('div', 'hardware-display-heading');
    heading.appendChild(node('h4', '', tr('屏幕形象同步', 'Screen companion sync')));
    var status = stringValue(display.status);
    var badge = node('span', 'hardware-display-status', screenSyncLabel(status));
    badge.dataset.status = status || 'unknown';
    badge.dataset.state = screenSyncTone(status);
    heading.appendChild(badge);
    section.appendChild(heading);
    var facts = node('dl', 'hardware-facts hardware-display-facts');
    facts.appendChild(fact(tr('同步策略', 'Sync policy'), screenSyncPolicyLabel(stringValue(display.policy))));
    var live = display.live && typeof display.live === 'object' ? display.live : null;
    if (live) {
      facts.appendChild(fact(tr('音量', 'Volume'), Number.isInteger(live.volume) ? String(live.volume) + ' / 100' : tr('未读取', 'Not read')));
      facts.appendChild(fact(tr('Wi-Fi 信号', 'Wi-Fi signal'), wifiSignalValue(live)));
    }
    section.appendChild(facts);
    section.appendChild(node('p', 'hardware-display-note', screenSyncNote(status)));
    var firmware = currentFirmwareBlock(display.firmware);
    if (firmware) section.appendChild(firmware);
    var buttons = buttonsBlock(display.firmware);
    if (buttons) section.appendChild(buttons);
    return section;
  }

  function deviceRow(device, snapshot) {
    var display = displayForDevice(snapshot, device);
    var sync = syncForDevice(snapshot, device);
    var live = sync && sync.live && typeof sync.live === 'object' ? sync.live : null;
    var linkDeviceId = display ? display.deviceId : device.id;
    var gatewayDevice = gatewayDeviceFor(snapshot, linkDeviceId);
    var row = node('article', 'hardware-device');
    row.classList.toggle('hardware-device-connected', device.connected === true);
    var main = node('div', 'hardware-device-main');
    var top = node('div', 'hardware-device-title-row');
    var identity = [stringValue(device.manufacturer), stringValue(device.product)].filter(Boolean).join(' ');
    var name = identity || stringValue(device.name) || tr('USB 串口设备', 'USB serial device');
    var title = node('h5', 'hardware-device-name', name);
    title.title = name;
    var connected = device.connected === true;
    var stateLabel = device.connected === true
      ? tr('已连接', 'Connected')
      : device.connected === false ? tr('离线', 'Offline') : tr('连接状态未读取', 'Connection state not read');
    var stateBadge = node('span', 'hardware-device-status', stateLabel);
    stateBadge.dataset.state = device.connected === true ? 'connected' : device.connected === false ? 'offline' : 'unknown';
    append(top, title, stateBadge);
    main.appendChild(top);

    var metaParts = [];
    if (stringValue(device.name) && identity && device.name.trim() !== identity) metaParts.push(stringValue(device.name));
    metaParts.push(tr('USB 串口', 'USB serial'));
    main.appendChild(node('p', 'hardware-device-meta', metaParts.join(' · ')));
    var port = stringValue(device.port);
    var portText = port || tr('未读取', 'Not read');
    var portLine = node('p', 'hardware-port', tr('端口：{port}', 'Port: {port}', { port: portText }));
    if (port) portLine.title = port;
    main.appendChild(portLine);
    if (device.connected === false && finiteNumber(device.lastSeenAt) !== null) {
      main.appendChild(node('p', 'hardware-last-seen', tr(
        '最近发现：{time}', 'Last seen: {time}', { time: formatDate(device.lastSeenAt) }
      )));
    }

    var read = serialLabel(device);
    var serial = device.serial && typeof device.serial === 'object' ? device.serial : {};
    var serialText = read.label;
    if (finiteNumber(serial.checkedAt) !== null) {
      serialText += ' · ' + tr('最近读取 {time}', 'Last read {time}', { time: formatDate(serial.checkedAt) });
    }
    if (read.tone === 'ok' && finiteNumber(serial.bytes) !== null) {
      serialText += ' · ' + tr('收到 {count} 字节', 'Received {count} bytes', { count: serial.bytes });
    }
    if (read.tone === 'error' && (serial.status === 'busy' || /busy|in use|EBUSY|resource busy/i.test(String(serial.error || '')))) {
      serialText += ' · ' + tr('关闭其他串口工具后重试', 'Close other serial tools and retry');
    }
    main.appendChild(node('p', 'hardware-serial-state', serialText)).dataset.state = read.tone;
    var syncStatus = sync ? stringValue(sync.status) : '';
    var syncLine = node('p', 'hardware-device-sync', screenSyncLabel(syncStatus));
    syncLine.dataset.status = syncStatus || 'unknown';
    syncLine.dataset.state = screenSyncTone(syncStatus);
    main.appendChild(syncLine);
    if (sync) main.appendChild(node('p', 'hardware-sync-note', screenSyncNote(syncStatus)));
    if (live || gatewayDevice) {
      var liveParts = [];
      if (live && Number.isInteger(live.volume)) liveParts.push(tr('音量 {v}/100', 'Volume {v}/100', { v: live.volume }));
      if (live && live.wifiSignal) liveParts.push(tr('Wi-Fi {s}', 'Wi-Fi {s}', { s: wifiSignalText(live.wifiSignal) }));
      liveParts.push(gatewayLinkText(snapshot, linkDeviceId));
      var liveLine = node('p', 'hardware-live-status', liveParts.join(' · '));
      var linkConnected = gatewayDevice && gatewayDevice.connected === true;
      liveLine.dataset.state = linkConnected ? 'connected' : gatewayDevice && gatewayDevice.connected === false ? 'offline' : 'pending';
      if (live && finiteNumber(live.readAt) !== null) liveLine.title = tr(
        '设备读数于 {time}', 'Device reading at {time}', { time: formatDate(live.readAt) }
      );
      main.appendChild(liveLine);
    }
    row.appendChild(main);

    var actions = node('div', 'hardware-device-actions');
    var reading = state.busy === 'probe:' + device.id || (device.serial && device.serial.status === 'reading');
    var readButton = button(reading ? tr('正在读取…', 'Reading…') : tr('读取状态', 'Read status'), 'probe');
    readButton.dataset.deviceId = String(device.id || '');
    readButton.disabled = !connected || !!state.busy || reading || !!(state.snapshot && state.snapshot.checking);
    readButton.setAttribute('aria-label', tr('读取 {name} 状态', 'Read status for {name}', { name: name }));
    readButton.title = connected ? tr('只读探测此 USB 串口设备', 'Read this USB serial device') : tr('设备连接后可读取状态', 'Read status when the device is connected');
    actions.appendChild(readButton);
    row.appendChild(actions);
    row.appendChild(infoDisclosure(device, display));
    var mirror = mirrorSection(device, display, snapshot);
    if (mirror) row.appendChild(mirror);
    return row;
  }

  function gatewayStatusText(gateway, gatewayDevices) {
    if (!gateway) return tr('状态未读取', 'Status not read');
    if (gateway.running === false) return tr('未运行', 'Not running');
    if (gateway.running !== true) return tr('状态未读取', 'Status not read');
    var connected = gatewayDevices.filter(function (device) { return device.connected === true; }).length;
    return connected
      ? tr('运行中 · {count} 台设备已连接', 'Running · {count} devices connected', { count: connected })
      : tr('运行中 · 等待设备连接', 'Running · waiting for a device');
  }

  function gatewayDeviceStatusText(device) {
    if (device.connected === true) return device.ready === true
      ? tr('已连接 · 控制就绪', 'Connected · control ready')
      : device.ready === false ? tr('已连接 · 控制未就绪', 'Connected · control not ready') : tr('已连接', 'Connected');
    return device.connected === false ? tr('未连接', 'Disconnected') : tr('状态未读取', 'Status not read');
  }

  function voiceSection(snapshot) {
    var section = node('section', 'hardware-voice');
    var bridge = snapshot && snapshot.bridge && typeof snapshot.bridge === 'object' ? snapshot.bridge : null;
    var gateway = gatewaySnapshot(snapshot);
    var gatewayDevices = gateway && Array.isArray(gateway.devices)
      ? gateway.devices.filter(function (device) { return device && typeof device === 'object'; }) : [];
    var legacyVoiceNeedsBridge = !!(snapshot && Array.isArray(snapshot.devices) && snapshot.devices.some(function (device) {
      return device && device.voice && device.voice.status === 'needs-bridge';
    }));
    var reason = stringValue(bridge && bridge.reason) || stringValue(snapshot && snapshot.bridgeError);
    var voiceConnected = !!(bridge && bridge.connected === true);
    var voiceReady = !!(voiceConnected && bridge.available === true);
    var voiceUnavailable = !!(bridge && bridge.available === false);
    var voiceLabel;
    var voiceTone;
    if (voiceReady) {
      voiceLabel = tr('Wi-Fi 语音已就绪', 'Wi-Fi voice ready');
      voiceTone = 'connected';
    } else if (voiceUnavailable) {
      voiceLabel = tr('语音未就绪', 'Voice not ready');
      voiceTone = 'error';
    } else if (bridge && bridge.available !== true) {
      voiceLabel = tr('语音就绪状态未读取', 'Voice readiness not read');
      voiceTone = 'offline';
    } else if (bridge && bridge.enabled === true) {
      voiceLabel = tr('等待设备认证', 'Waiting for device authentication');
      voiceTone = 'pending';
    } else if (!bridge && legacyVoiceNeedsBridge) {
      voiceLabel = tr('语音对话待接入', 'Voice conversation awaiting connection');
      voiceTone = 'pending';
    } else if (reason) {
      voiceLabel = tr('语音连接需检查', 'Voice connection needs attention');
      voiceTone = 'error';
    } else if (bridge) {
      voiceLabel = voiceConnected
        ? tr('设备已连接 · 语音未就绪', 'Device connected · voice not ready')
        : tr('Wi-Fi 语音未接通', 'Wi-Fi voice not connected');
      voiceTone = voiceConnected ? 'pending' : 'offline';
    } else {
      voiceLabel = tr('语音状态未读取', 'Voice status not read');
      voiceTone = 'offline';
    }

    var heading = node('div', 'hardware-voice-heading');
    heading.appendChild(node('h4', '', tr('语音输入与屏幕', 'Voice input and display')));
    var badge = node('span', 'hardware-voice-status', voiceLabel);
    badge.dataset.state = voiceTone;
    heading.appendChild(badge);
    section.appendChild(heading);

    var target = bridge && bridge.target && typeof bridge.target === 'object'
      ? bridge.target
      : snapshot && snapshot.companion && snapshot.companion.bot && typeof snapshot.companion.bot === 'object'
        ? snapshot.companion.bot : null;
    var targetName = target && stringValue(target.name) ? stringValue(target.name) : tr('尚未设置', 'Not set');
    var voiceConnectionText = bridge
      ? voiceConnected ? tr('已连接', 'Connected') : bridge.available === false ? tr('暂不可用', 'Unavailable') : tr('未连接', 'Not connected')
      : tr('未读取', 'Not read');
    var voiceStatusText = bridge
      ? voiceReady ? tr('已就绪', 'Ready') : voiceLabel
      : tr('未读取', 'Not read');
    var facts = node('dl', 'hardware-voice-facts');
    append(facts,
      fact(tr('Wi-Fi 网关', 'Wi-Fi gateway'), gatewayStatusText(gateway, gatewayDevices)),
      fact(tr('已连接设备', 'Connected devices'), String(gatewayDevices.filter(function (device) { return device.connected === true; }).length)),
      fact(tr('语音连接', 'Voice connection'), voiceConnectionText),
      fact(tr('对话 Bot', 'Conversation Bot'), targetName),
      fact(tr('语音就绪', 'Voice readiness'), voiceStatusText));
    section.appendChild(facts);

    var usbLabel = node('label', 'hardware-mirror-auto');
    var usbToggle = node('input');
    usbToggle.type = 'checkbox';
    usbToggle.id = 'hardware-usb-text-display';
    usbToggle.dataset.hardwareAction = 'usb-text-display';
    usbToggle.setAttribute('aria-describedby', 'hardware-usb-text-note hardware-usb-text-status');
    append(usbLabel, usbToggle, node('span', '', tr('USB 文字上屏（微信输入法）', 'USB text on device (WeType)')));
    var usbNote = node('p', 'hardware-ptt-note', tr(
      '仅显示当前主 Bot 输入框的文字；识别状态未知，不会自动发送。',
      'Shows text from the main Bot composer. Recognition status is unknown; messages are not sent automatically.'
    ));
    usbNote.id = 'hardware-usb-text-note';
    var usbStatus = node('p', 'hardware-ptt-note');
    usbStatus.id = 'hardware-usb-text-status';
    usbStatus.setAttribute('role', 'status');
    usbStatus.setAttribute('aria-live', 'polite');
    append(section, usbLabel, usbNote, usbStatus);
    var wifiMode = button(tr('使用 Wi-Fi 语音', 'Use Wi-Fi voice'), 'wifi-voice-mode', 'hardware-wifi-voice-mode');
    section.appendChild(wifiMode);
    els.usbTextToggle = usbToggle;
    els.usbTextStatus = usbStatus;
    els.wifiVoiceMode = wifiMode;
    renderVoiceDisplayPresentation();

    var ptt = node('div', 'hardware-ptt-candidate');
    var pttButton = node('button', 'btn hardware-ptt-button', '');
    pttButton.type = 'button';
    pttButton.id = 'hardware-ptt-button';
    pttButton.dataset.hardwarePtt = 'true';
    pttButton.setAttribute('aria-describedby', 'hardware-ptt-note');
    var pttButtonLabel = node('span', '', '');
    pttButton.appendChild(pttButtonLabel);
    ptt.appendChild(pttButton);
    var note = node('p', 'hardware-ptt-note', '');
    note.id = 'hardware-ptt-note';
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    note.setAttribute('aria-atomic', 'true');
    ptt.appendChild(note);
    els.pttButton = pttButton;
    els.pttButtonLabel = pttButtonLabel;
    els.pttStatus = note;
    section.appendChild(ptt);
    renderPttPresentation();
    if (gatewayDevices.length) {
      var diagnostics = setDetailsOpen(node('details', 'hardware-gateway-devices'), 'gateway-diagnostics');
      diagnostics.appendChild(node('summary', '', tr('网关设备状态', 'Gateway device status')));
      var list = node('div', 'hardware-gateway-list');
      gatewayDevices.forEach(function (device) {
        var item = node('div', 'hardware-gateway-device');
        var row = node('div', 'hardware-gateway-device-row');
        var id = stringValue(device.id) || tr('设备 ID 未读取', 'Device ID not read');
        var name = node('strong', 'hardware-gateway-device-id', id);
        name.title = id;
        var stateText = gatewayDeviceStatusText(device);
        var state = node('span', 'hardware-gateway-device-status', stateText);
        state.dataset.state = device.connected === true ? 'connected' : device.connected === false ? 'offline' : 'unknown';
        append(row, name, state);
        item.appendChild(row);
        if (stringValue(device.state)) item.appendChild(node('p', 'hardware-gateway-device-meta', stringValue(device.state)));
        list.appendChild(item);
      });
      diagnostics.appendChild(list);
      section.appendChild(diagnostics);
    }
    section.appendChild(node('p', 'hardware-voice-note', tr(
      '设备通过 Wi-Fi 接入 Bot Studio 网关；网关连接状态不会被当作语音会话已就绪。',
      'Devices connect to the Bot Studio gateway over Wi-Fi; gateway connectivity does not imply a ready voice session.'
    )));
    return section;
  }

  function renderPttPresentation() {
    var pttUi = state.ptt;
    if (!els.pttButton || !els.pttStatus) return;
    var bridge = state.snapshot && state.snapshot.bridge && typeof state.snapshot.bridge === 'object'
      ? state.snapshot.bridge : null;
    var ptt = pttSnapshot(state.snapshot);
    var bridgeState = stringValue(bridge && bridge.state);
    var unavailable = pttUnavailableReason(state.snapshot);
    var ready = unavailable === '';
    var stopPending = !!((ptt && ptt.stopPending === true) || bridgeState === 'stopping');
    var recording = !!((ptt && ptt.recording === true) || bridge && bridge.recording === true || bridgeState === 'recording' || pttUi.phase === 'recording');
    var externalRecording = recording && !pttUi.pressHeld && !pttUi.startPending && pttUi.phase === 'idle';
    var snapshotEpoch = ptt && Number.isSafeInteger(ptt.turnEpoch) ? ptt.turnEpoch : null;
    var snapshotCaptureId = stringValue(ptt && ptt.captureId);
    var localTerminalCurrent = !!pttUi.terminalReason &&
      !(Number.isSafeInteger(pttUi.terminalTurnEpoch) && Number.isSafeInteger(snapshotEpoch) && pttUi.terminalTurnEpoch !== snapshotEpoch) &&
      !(pttUi.captureId && snapshotCaptureId && pttUi.captureId !== snapshotCaptureId);
    var snapshotTerminalCurrent = !!(ptt && stringValue(ptt.terminalReason)) && !pttUi.startPending &&
      !(Number.isSafeInteger(pttUi.turnEpoch) && Number.isSafeInteger(snapshotEpoch) && pttUi.turnEpoch !== snapshotEpoch) &&
      !(pttUi.captureId && snapshotCaptureId && pttUi.captureId !== snapshotCaptureId);
    var terminalReason = snapshotTerminalCurrent ? stringValue(ptt.terminalReason) : localTerminalCurrent ? pttUi.terminalReason : '';
    var voiceError = stringValue(bridge && bridge.errorMessage);
    var phase = pttUi.phase;
    var buttonLabel = tr('按住说话', 'Hold to talk');
    var statusText = '';
    var tone = 'idle';

    if (!ready) {
      statusText = unavailable;
      tone = /未就绪|不可用|不支持|静音|未知|错误/.test(unavailable) ? 'error' : 'pending';
    } else if (stopPending) {
      buttonLabel = tr('等待停止确认…', 'Waiting for stop confirmation…');
      statusText = terminalReason === 'limit_cancel'
        ? tr('已到 30 秒上限，本轮已取消且不会发送；等待设备确认停止收音。', 'The 30-second limit was reached. This turn is cancelled and will not be sent; waiting for device stop confirmation.')
        : terminalReason === 'cancel'
          ? tr('本轮已取消且不会发送；等待设备确认停止收音。', 'This turn is cancelled and will not be sent; waiting for device stop confirmation.')
          : tr('正在等待设备确认停止收音；确认前本轮不会发送。', 'Waiting for the device to confirm recording has stopped; this turn will not be sent before confirmation.');
      if (voiceError) statusText += ' ' + pttErrorText({ message: voiceError, code: stringValue(bridge && bridge.error) });
      tone = 'pending';
    } else if (phase === 'starting') {
      buttonLabel = tr('正在开始…', 'Starting…');
      statusText = tr('正在准备本轮输入；松开会结束收音，随后显示识别与回复状态。', 'Preparing this input turn. Releasing ends recording; recognition and reply status will appear here.');
      tone = 'pending';
    } else if (phase === 'cancelling') {
      buttonLabel = tr('正在取消…', 'Cancelling…');
      statusText = tr('正在丢弃本轮；不会发送。', 'Discarding this turn; it will not be sent.');
      tone = 'pending';
    } else if (bridgeState === 'transcribing') {
      buttonLabel = tr('正在识别…', 'Transcribing…');
      statusText = tr('设备已确认停止收音，正在识别语音。', 'The device confirmed that recording stopped; speech is being transcribed.');
      tone = 'pending';
    } else if (bridgeState === 'speaking') {
      buttonLabel = tr('按住打断并说话', 'Hold to interrupt and talk');
      statusText = tr('回复正在播报；按住会打断播报并开始新一轮。', 'A reply is playing. Hold to interrupt it and start a new turn.');
      tone = 'pending';
    } else if (phase === 'stopping') {
      buttonLabel = tr('等待停止确认…', 'Waiting for stop confirmation…');
      statusText = tr('正在等待设备确认停止收音；确认后才会开始识别。', 'Waiting for the device to confirm recording has stopped; transcription starts after that confirmation.');
      tone = 'pending';
    } else if (phase === 'error') {
      buttonLabel = tr('按住重试', 'Hold to retry');
      statusText = pttUi.error || tr('按住说话操作失败。', 'Push-to-talk failed.');
      tone = 'error';
    } else if (voiceError || stringValue(bridge && bridge.error) || bridgeState === 'error') {
      buttonLabel = tr('按住重试', 'Hold to retry');
      statusText = voiceError
        ? pttErrorText({ message: voiceError })
        : pttErrorText({ code: stringValue(bridge && bridge.error) });
      tone = 'error';
    } else if (ptt && ptt.cancellationPending === true) {
      statusText = tr('正在取消上一轮输入。', 'Cancelling the previous input turn.');
      tone = 'pending';
    } else if (recording) {
      if (pttUi.pressHeld || pttUi.startPending) {
        buttonLabel = tr('正在收音 · 松开结束', 'Recording · release to stop');
        statusText = tr('正在收音。正常松开会结束收音并进入识别；失焦、取消或达到 30 秒上限会取消且不会发送。', 'Recording. A normal release ends capture and begins transcription; focus loss, cancellation, or the 30-second limit cancels without sending.');
      } else {
        buttonLabel = tr('设备正在收音', 'Device is recording');
        statusText = tr('设备端已有一轮收音；请等待它结束后再按住说话。', 'The device already has an active capture. Wait for it to finish before using push-to-talk.');
      }
      tone = 'pending';
    } else if (terminalReason === 'limit_cancel') {
      statusText = tr('已到 30 秒上限，本轮已取消且不会发送。', 'The 30-second limit was reached. This turn was cancelled and will not be sent.');
      tone = 'error';
    } else if (terminalReason === 'cancel' || phase === 'cancelled') {
      statusText = ptt && ptt.deviceStopConfirmed === true
        ? tr('本轮已取消未发送；设备已确认停止收音。', 'This turn was cancelled without sending; the device confirmed that recording stopped.')
        : tr('本轮已取消，不会发送。', 'This turn was cancelled and will not be sent.');
      tone = 'idle';
    } else if ((phase === 'stopped' && localTerminalCurrent) || terminalReason === 'user_release') {
      statusText = tr('设备已确认停止收音；当前尚无可确认的识别或回复状态。', 'The device confirmed that recording stopped; no recognition or reply status is available yet.');
      tone = 'pending';
    } else {
      statusText = tr('按住开始收音，松开结束；此处会显示识别与回复状态。失焦或达到 30 秒上限会取消且不会发送。', 'Hold to record and release to stop. Recognition and reply status appear here. Focus loss or the 30-second limit cancels without sending.');
      tone = 'ready';
    }

    var operationBusy = phase === 'starting' || phase === 'stopping' || phase === 'cancelling' || stopPending || !!(ptt && ptt.cancellationPending === true);
    els.pttButton.disabled = (!ready || operationBusy || externalRecording) && !pttUi.pressHeld;
    els.pttButton.classList.toggle('primary', ready && !operationBusy && !externalRecording);
    els.pttButton.dataset.state = phase;
    els.pttButton.setAttribute('aria-pressed', pttUi.pressHeld ? 'true' : 'false');
    els.pttButton.setAttribute('aria-busy', operationBusy ? 'true' : 'false');
    els.pttButton.setAttribute('aria-label', ready
      ? (bridgeState === 'speaking'
        ? tr('按住可打断播报。Ctrl 仅在此按钮聚焦且窗口在前台时可用。', 'Hold to interrupt playback. Ctrl works only while this button is focused in the foreground window.')
        : tr('按住开始收音，松开结束收音。Ctrl 仅在此按钮聚焦且窗口在前台时可用。', 'Hold to record and release to stop. Ctrl works only while this button is focused in the foreground window.'))
      : buttonLabel + ' — ' + unavailable);
    els.pttButton.title = statusText;
    if (els.pttButtonLabel) els.pttButtonLabel.textContent = buttonLabel;
    els.pttStatus.textContent = statusText;
    els.pttStatus.dataset.state = tone;
  }

  function renderVoiceDisplayPresentation() {
    if (!els.usbTextToggle || !els.usbTextStatus) return;
    var control = root.openBotVoiceDisplay;
    var value = control && control.snapshot();
    els.usbTextToggle.checked = !!(value && value.enabled);
    els.usbTextToggle.disabled = !value || !value.available || !!value.busy || !value.primaryId;
    if (els.wifiVoiceMode) {
      els.wifiVoiceMode.hidden = !value || value.preferredMode === null || value.preferredMode === 'ptt';
      els.wifiVoiceMode.disabled = !value || value.busy || !apiMethod('hardwareVoiceUsePttMode');
    }
    var message;
    if (!value || !value.available) message = tr('文字上屏接口暂不可用。', 'Text display is unavailable.');
    else if (!value.primaryId) message = tr('请先设置主 Bot。', 'Set a main Bot first.');
    else if (value.busy) message = tr('正在切换输入模式…', 'Switching input mode…');
    else if (value.code === 'DISPLAY_PRIMARY_CHANGED') message = tr('主 Bot 已更改，请重新开启文字上屏。', 'The main Bot changed. Enable text display again.');
    else if (/PAIRING/.test(value.code)) message = tr('设备配对尚未完成。', 'Finish pairing the device first.');
    else if (/ACK|TRANSPORT|SESSION_BLOCKED|CLEANUP/.test(value.code)) message = tr('设备未确认操作，请检查连接后重新开启。', 'The device did not confirm the operation. Check its connection and enable again.');
    else if (/FAILED|DENIED|CONTROL_FAILED|STATUS_UNAVAILABLE/.test(value.code)) message = tr('文字上屏未就绪，请检查设备连接。', 'Text display is not ready. Check the device connection.');
    else if (value.enabled && value.code === 'DISPLAY_ACCEPTED') message = tr('设备已接受输入文字。', 'The device accepted the input text.');
    else if (value.enabled) message = tr('已开启；等待主 Bot 的新输入和设备确认。', 'Enabled; waiting for new main Bot input and device confirmation.');
    else message = tr('已关闭。', 'Off.');
    var target = value && value.primaryId ? tr('主 Bot：{name}', 'Main Bot: {name}', { name: value.primaryName || value.primaryId }) : '';
    els.usbTextStatus.textContent = target ? target + ' · ' + message : message;
  }

  function buttonForPttTarget(target) {
    return target && target.closest ? target.closest('[data-hardware-ptt="true"]') : null;
  }

  function pttScopeLost(snapshot) {
    var ptt = state.ptt;
    if (!ptt.pressHeld || ptt.startPending || !ptt.deviceId) return false;
    var bridge = snapshot && snapshot.bridge && typeof snapshot.bridge === 'object' ? snapshot.bridge : null;
    if (!bridge || String(bridge.deviceId || '') !== ptt.deviceId || bridge.connected !== true || bridge.available !== true) return true;
    if (ptt.turnEpoch !== null || ptt.captureId) {
      var current = pttSnapshot(snapshot);
      if (!current || !Number.isSafeInteger(current.turnEpoch) || !stringValue(current.captureId) ||
          current.turnEpoch !== ptt.turnEpoch || current.captureId !== ptt.captureId) return true;
    }
    return false;
  }

  function handlePttSnapshot(snapshot) {
    if (pttScopeLost(snapshot)) cancelPttForFocusLoss('device-change');
  }

  function clearPttFeedback() {
    if (state.ptt.feedbackTimer) {
      clearTimeout(state.ptt.feedbackTimer);
      state.ptt.feedbackTimer = null;
    }
  }

  function startPtt(source, pointerId) {
    var ptt = state.ptt;
    var bridge = state.snapshot && state.snapshot.bridge && typeof state.snapshot.bridge === 'object' ? state.snapshot.bridge : null;
    if (!pttReady(state.snapshot) || !visibleInSettings() || document.hidden || ptt.pressHeld || ptt.startPending ||
        ptt.phase === 'stopping' || ptt.phase === 'cancelling') return false;
    clearPttFeedback();
    ptt.request++;
    var request = ptt.request;
    ptt.pressHeld = true;
    ptt.pressSource = source;
    ptt.pointerId = source === 'pointer' ? pointerId : null;
    ptt.turnEpoch = null;
    ptt.captureId = '';
    ptt.deviceId = stringValue(bridge && bridge.deviceId);
    ptt.terminalReason = '';
    ptt.terminalTurnEpoch = null;
    ptt.startPending = true;
    ptt.queuedAction = null;
    ptt.error = '';
    ptt.errorCode = '';
    ptt.phase = 'starting';
    renderPttPresentation();

    callApi('hardwarePttStart', []).then(function (result) {
      if (request !== ptt.request) {
        if (result && result.ok === true && Number.isSafeInteger(result.turnEpoch) && stringValue(result.captureId)) {
          return callApi('hardwarePttCancel', [{ turnEpoch: result.turnEpoch, captureId: stringValue(result.captureId), reason: 'stale_start' }]);
        }
        return null;
      }
      var failure = pttResultError(result, tr('设备未接受按住说话请求。', 'The device did not accept the push-to-talk request.'));
      if (failure) throw failure;
      if (!Number.isSafeInteger(result.turnEpoch) || !stringValue(result.captureId) || !stringValue(result.deviceId)) {
        throw Object.assign(new Error('设备未返回有效的语音轮次标识。'), { code: 'HARDWARE_PTT_SCOPE_MISSING' });
      }
      if (ptt.deviceId && stringValue(result.deviceId) !== ptt.deviceId) {
        callApi('hardwarePttCancel', [{ turnEpoch: result.turnEpoch, captureId: stringValue(result.captureId), reason: 'stale_start' }]).catch(function () {});
        throw Object.assign(new Error('设备语音会话已变化；本轮已丢弃。'), { code: 'HARDWARE_PTT_STALE' });
      }
      ptt.startPending = false;
      ptt.turnEpoch = result.turnEpoch;
      ptt.captureId = stringValue(result.captureId);
      ptt.deviceId = stringValue(result.deviceId);
      if (ptt.queuedAction) {
        var queued = ptt.queuedAction;
        ptt.queuedAction = null;
        return settlePtt(queued.kind, queued.reason, request);
      }
      if (!ptt.pressHeld || !visibleInSettings() || document.hidden) {
        return settlePtt('cancel', 'start_scope_lost', request);
      }
      ptt.phase = 'recording';
      renderPttPresentation();
      return null;
    }).catch(function (error) {
      if (request !== ptt.request) return;
      ptt.startPending = false;
      ptt.pressHeld = false;
      ptt.pressSource = '';
      ptt.pointerId = null;
      ptt.turnEpoch = null;
      ptt.captureId = '';
      ptt.queuedAction = null;
      ptt.phase = 'error';
      ptt.errorCode = stringValue(error && error.code);
      ptt.error = pttErrorText(error);
      render();
    });
    return true;
  }

  function settlePtt(kind, reason, request) {
    var ptt = state.ptt;
    if (request !== ptt.request) return Promise.resolve();
    if (ptt.startPending) {
      ptt.queuedAction = { kind: kind, reason: reason || '' };
      ptt.phase = kind === 'stop' ? 'stopping' : 'cancelling';
      render();
      return Promise.resolve();
    }
    if (!Number.isSafeInteger(ptt.turnEpoch) || !ptt.captureId) {
      ptt.phase = 'error';
      ptt.errorCode = 'HARDWARE_PTT_SCOPE_MISSING';
      ptt.error = tr('没有当前语音轮次可结束或取消。', 'There is no current voice turn to stop or cancel.');
      render();
      return Promise.resolve();
    }
    var turnEpoch = ptt.turnEpoch;
    var captureId = ptt.captureId;
    ptt.phase = kind === 'stop' ? 'stopping' : 'cancelling';
    ptt.error = '';
    ptt.errorCode = '';
    render();
    var method = kind === 'stop' ? 'hardwarePttStop' : 'hardwarePttCancel';
    var payload = kind === 'stop'
      ? { turnEpoch: turnEpoch, captureId: captureId }
      : { turnEpoch: turnEpoch, captureId: captureId, reason: reason || 'cancelled' };
    return callApi(method, [payload]).then(function (result) {
      var failure = pttResultError(result, kind === 'stop'
        ? tr('设备未确认停止收音。', 'The device did not confirm that recording stopped.')
        : tr('设备未接受按住说话取消。', 'The device did not accept the push-to-talk cancellation.'));
      if (failure) throw failure;
      if (request !== ptt.request || ptt.turnEpoch !== turnEpoch || ptt.captureId !== captureId) return;
      if (result && result.turnEpoch !== undefined && result.turnEpoch !== turnEpoch ||
          result && result.captureId !== undefined && stringValue(result.captureId) !== captureId) {
        throw Object.assign(new Error('设备返回了不匹配的语音轮次。'), { code: 'HARDWARE_PTT_STALE' });
      }
      var resultReason = stringValue(result && result.reason);
      var explicitUserRelease = result && result.cancelled === false && resultReason === 'user_release';
      var cancelled = !explicitUserRelease && (!!(result && result.cancelled === true) || resultReason === 'limit_cancel' || resultReason === 'cancel' || kind === 'cancel');
      ptt.terminalReason = resultReason || (cancelled ? 'cancel' : 'user_release');
      ptt.terminalTurnEpoch = turnEpoch;
      ptt.phase = cancelled ? 'cancelled' : 'stopped';
      ptt.error = '';
      ptt.errorCode = '';
      renderPttPresentation();
      if (!cancelled) {
        ptt.feedbackTimer = setTimeout(function () {
          ptt.feedbackTimer = null;
          if (ptt.request === request && ptt.phase === 'stopped') {
            ptt.phase = 'idle';
            renderPttPresentation();
          }
        }, 2200);
      }
    }).catch(function (error) {
      if (request !== ptt.request) return;
      ptt.phase = 'error';
      ptt.errorCode = stringValue(error && error.code);
      ptt.error = pttErrorText(error);
      render();
    });
  }

  function releasePtt(kind, reason, source, pointerId) {
    var ptt = state.ptt;
    if (!ptt.pressHeld || (source && ptt.pressSource !== source)) return;
    if (source === 'pointer' && ptt.pointerId !== null && pointerId !== ptt.pointerId) return;
    var activeTarget = els.pttButton;
    var activePointer = ptt.pointerId;
    ptt.pressHeld = false;
    ptt.pressSource = '';
    ptt.pointerId = null;
    if (kind === 'cancel') ptt.skipFocusRestore = true;
    if (source === 'pointer' && activeTarget && activePointer !== null) {
      try { if (activeTarget.hasPointerCapture(activePointer)) activeTarget.releasePointerCapture(activePointer); } catch (_) { }
    }
    if (ptt.startPending) {
      ptt.queuedAction = { kind: kind, reason: reason || '' };
      ptt.phase = kind === 'stop' ? 'stopping' : 'cancelling';
      render();
      return;
    }
    settlePtt(kind, reason, ptt.request);
  }

  function onPttPointerDown(event) {
    var target = buttonForPttTarget(event.target);
    if (!target || target.disabled || event.button !== 0) return;
    event.preventDefault();
    try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
    try { target.setPointerCapture(event.pointerId); } catch (_) { }
    startPtt('pointer', event.pointerId);
  }

  function onPttPointerUp(event) {
    releasePtt('stop', '', 'pointer', event.pointerId);
  }

  function onPttPointerCancel(event) {
    releasePtt('cancel', 'pointercancel', 'pointer', event.pointerId);
  }

  function onPttLostPointerCapture(event) {
    releasePtt('cancel', 'lostcapture', 'pointer', event.pointerId);
  }

  function onPttKeyDown(event) {
    var ptt = state.ptt;
    if (ptt.pressHeld && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      releasePtt('cancel', 'escape', ptt.pressSource, ptt.pointerId);
      return;
    }
    if (ptt.pressHeld && ptt.pressSource === 'keyboard-ctrl' && event.key !== 'Control') {
      event.preventDefault();
      releasePtt('cancel', 'keyboard-chord', 'keyboard-ctrl');
      return;
    }
    var target = buttonForPttTarget(event.target);
    if (!target || target.disabled || document.hidden || !visibleInSettings()) return;
    if (event.key === 'Control') {
      var foreground = typeof document.hasFocus !== 'function' || document.hasFocus();
      if (document.activeElement !== target || !foreground || event.altKey || event.metaKey || event.shiftKey || event.repeat) return;
      event.preventDefault();
      startPtt('keyboard-ctrl', null);
      return;
    }
    var source = event.key === ' ' || event.code === 'Space'
      ? 'keyboard-space' : event.key === 'Enter' ? 'keyboard-enter' : '';
    if (!source || event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    startPtt(source, null);
  }

  function onPttKeyUp(event) {
    if (event.key === 'Control') releasePtt('stop', '', 'keyboard-ctrl');
    else if (event.key === ' ' || event.code === 'Space') releasePtt('stop', '', 'keyboard-space');
    else if (event.key === 'Enter') releasePtt('stop', '', 'keyboard-enter');
  }

  function cancelPttForFocusLoss(reason) {
    if (!state.ptt.pressHeld) return;
    state.ptt.skipFocusRestore = true;
    releasePtt('cancel', reason, state.ptt.pressSource, state.ptt.pointerId);
  }

  function onPttWindowBlur() {
    cancelPttForFocusLoss('blur');
  }

  function onPttVisibilityChange() {
    if (document.hidden) cancelPttForFocusLoss('hidden');
  }

  function disposePttListeners() {
    if (!state.ptt.listenersAttached) return;
    if (els.host) els.host.removeEventListener('pointerdown', onPttPointerDown);
    document.removeEventListener('pointerup', onPttPointerUp, true);
    document.removeEventListener('pointercancel', onPttPointerCancel, true);
    document.removeEventListener('lostpointercapture', onPttLostPointerCapture, true);
    document.removeEventListener('keydown', onPttKeyDown, true);
    document.removeEventListener('keyup', onPttKeyUp, true);
    root.removeEventListener('blur', onPttWindowBlur);
    document.removeEventListener('visibilitychange', onPttVisibilityChange);
    state.ptt.listenersAttached = false;
  }

  function onPttPageHide() {
    cancelPttForFocusLoss('page-closed');
    clearPttFeedback();
    disposePttListeners();
  }

  function companionSection(snapshot) {
    var section = node('section', 'hardware-companion');
    var heading = node('h4', '', tr('Bot 分身', 'BOT avatar'));
    var companion = snapshot && snapshot.companion && typeof snapshot.companion === 'object' ? snapshot.companion : null;
    var bot = companion && companion.bot && typeof companion.bot === 'object' ? companion.bot : null;
    var bridge = snapshot && snapshot.bridge && typeof snapshot.bridge === 'object' ? snapshot.bridge : null;
    var voiceTarget = bridge && bridge.target && typeof bridge.target === 'object' ? bridge.target : null;
    var sameVoiceBot = !!(bridge && bridge.available === true && bridge.connected === true && bot && voiceTarget &&
      stringValue(bot.id) && stringValue(bot.id) === stringValue(voiceTarget.id));
    var row = node('div', 'hardware-companion-row');
    row.appendChild(createAvatar(bot));
    var identity = node('div', 'hardware-companion-identity');
    identity.appendChild(node('span', 'hardware-target-label', tr('当前目标 Bot', 'Current target Bot')));
    var details = node('div', 'hardware-companion-details');
    var name = bot && stringValue(bot.name) ? stringValue(bot.name) : tr('尚未设置', 'Not set');
    var nameNode = node('strong', 'hardware-companion-name', name);
    nameNode.title = name;
    var presence = companion && companion.presence && typeof companion.presence === 'object' ? companion.presence : null;
    var presenceText = presence && stringValue(presence.label)
      ? stringValue(presence.label)
      : companion && companion.enabled === true
        ? tr('状态未读取', 'Status not read')
        : companion && companion.enabled === false
          ? tr('未启用', 'Not enabled') : tr('尚未读取', 'Not checked');
    append(details, nameNode, node('span', 'hardware-presence', presenceText));
    identity.appendChild(details);
    append(row, identity);
    section.appendChild(heading);
    section.appendChild(row);

    var rule = node('div', 'hardware-sync-rule');
    var ruleLabel = node('span', 'hardware-sync-label', tr('设备目标', 'Device target'));
    var ruleValue = node('strong', 'hardware-sync-policy', tr('跟随桌面伙伴（默认）', 'Follow desktop companion (default)'));
    append(rule, ruleLabel, ruleValue);
    section.appendChild(rule);
    var companionNote = sameVoiceBot
      ? tr('设备对话已接通，并沿用当前 Bot 的身份、上下文与记忆；屏幕镜像与形象同步请看设备信息。',
        'Device conversation is connected and uses this Bot’s identity, context and memory. Screen mirroring and avatar sync are listed with device information.')
      : bridge && bridge.available === true && bridge.connected === true
        ? tr('语音已就绪，但当前对话 Bot 与桌面伙伴不同；设备对话按语音目标 Bot 处理。屏幕镜像与形象同步请看设备信息。',
          'Voice is ready, but the conversation Bot differs from the desktop companion; device conversation uses the voice target. Screen mirroring and avatar sync are listed with device information.')
        : tr('设备端对话尚待接入；接入后将沿用此 Bot 的身份、上下文与记忆。',
          'Device conversations are not connected yet. Once connected, they will use this Bot’s identity, context and memory.');
    section.appendChild(node('p', 'hardware-companion-note', companionNote));
    return section;
  }

  function emptyState(snapshot) {
    if (state.busy === 'status' || state.busy === 'refresh' || (snapshot && snapshot.checking)) {
      return node('p', 'hardware-empty', tr('正在检查 USB 串口设备…', 'Checking USB serial devices…'));
    }
    if (state.lastError || !snapshot || snapshot.error || snapshot.available !== true) {
      return node('p', 'hardware-empty hardware-empty-error', state.lastError || snapshot && snapshot.error
        ? tr('无法读取 USB 设备状态。请重试。', 'Could not read USB device status. Try again.')
        : tr('硬件发现暂不可用。请稍后重试。', 'Hardware discovery is temporarily unavailable. Try again later.'));
    }
    return node('p', 'hardware-empty', tr(
      '未发现设备。连接 ESP32 等 USB 串口设备后会显示在这里。',
      'No devices found. ESP32 and other USB serial devices will appear here when connected.'
    ));
  }

  function renderContent() {
    if (!els.content) return;
    // Keep the pressed control attached until its matching release/cancel event.
    // Snapshot updates can arrive during a hold and must not swallow pointerup.
    if (state.ptt.pressHeld) {
      state.ptt.refreshContentAfterPtt = true;
      return;
    }
    state.ptt.refreshContentAfterPtt = false;
    rememberDetails();
    var focus = state.ptt.skipFocusRestore ? null : captureActionFocus();
    state.ptt.skipFocusRestore = false;
    var snapshot = state.snapshot;
    var fragment = document.createDocumentFragment();

    var devicesSection = node('section', 'hardware-devices');
    var headingRow = node('div', 'hardware-section-heading');
    var deviceHeading = node('h4', '', tr('USB 串口设备', 'USB serial devices'));
    var devices = snapshot && Array.isArray(snapshot.devices) ? snapshot.devices : [];
    var count = node('span', 'hardware-device-count', tr('{count} 项记录', '{count} records', { count: devices.length }));
    append(headingRow, deviceHeading, count);
    devicesSection.appendChild(headingRow);

    if (!devices.length) devicesSection.appendChild(emptyState(snapshot));
    else {
      var list = node('div', 'hardware-device-list');
      devices.forEach(function (device) {
        if (device && typeof device === 'object') list.appendChild(deviceRow(device, snapshot));
      });
      devicesSection.appendChild(list);
      if (snapshot && (snapshot.error || snapshot.available === false || state.lastError)) {
        devicesSection.appendChild(node('p', 'hardware-list-note', tr(
          '设备发现遇到问题；仍显示最近已知设备记录。',
          'Discovery encountered a problem; recently known device records are still shown.'
        )));
      }
    }
    fragment.appendChild(devicesSection);

    var hasDisplayRow = devices.some(function (device) { return !!displayForDevice(snapshot, device); });
    if (!hasDisplayRow) {
      var display = displaySyncSection(snapshot);
      if (display) fragment.appendChild(display);
    }
    fragment.appendChild(companionSection(snapshot));
    fragment.appendChild(voiceSection(snapshot));

    var importDetails = setDetailsOpen(node('details', 'hardware-import'), 'import');
    importDetails.appendChild(node('summary', '', tr('导入探测信息', 'Import probe information')));
    var importBody = node('div', 'hardware-import-body');
    importBody.appendChild(node('p', 'hardware-import-note', tr(
      '选择已有的设备探测报告，补充硬件、固件与能力记录。',
      'Choose an existing device probe report to add hardware, firmware and capability details.'
    )));
    els.import = button(state.busy === 'import' ? tr('正在导入…', 'Importing…') : tr('选择报告…', 'Choose report…'), 'import', 'hardware-import-button');
    els.import.disabled = !!state.busy;
    importBody.appendChild(els.import);
    importDetails.appendChild(importBody);
    fragment.appendChild(importDetails);

    els.content.replaceChildren(fragment);
    restoreActionFocus(focus);
  }

  function renderHeader() {
    if (!els.status) return;
    var snapshot = state.snapshot;
    var checking = !!state.busy || !!(snapshot && snapshot.checking);
    var connected = snapshot && Array.isArray(snapshot.devices)
      ? snapshot.devices.filter(function (device) { return device && device.connected === true; }).length : 0;
    if (checking) {
      els.status.textContent = tr('检查中', 'Checking');
      els.status.dataset.state = 'pending';
    } else if (state.lastError || (snapshot && snapshot.error)) {
      els.status.textContent = tr('需检查', 'Needs attention');
      els.status.dataset.state = 'error';
    } else if (!snapshot) {
      els.status.textContent = tr('尚未读取', 'Not checked');
      els.status.dataset.state = 'idle';
    } else if (snapshot.available !== true) {
      els.status.textContent = tr('暂不可用', 'Unavailable');
      els.status.dataset.state = 'error';
    } else if (connected) {
      els.status.textContent = tr('{count} 个 USB 已连接', '{count} USB connected', { count: connected });
      els.status.dataset.state = 'connected';
    } else if (snapshot.devices && snapshot.devices.length) {
      els.status.textContent = tr('USB 未连接', 'USB not connected');
      els.status.dataset.state = 'offline';
    } else {
      els.status.textContent = tr('未发现设备', 'No devices found');
      els.status.dataset.state = 'idle';
    }
    if (els.refresh) {
      els.refresh.disabled = !!state.busy || !!(snapshot && snapshot.checking);
      els.refresh.textContent = state.busy === 'refresh' || state.busy === 'status' || (snapshot && snapshot.checking)
        ? tr('正在刷新 USB 串口…', 'Refreshing USB serial…') : tr('刷新 USB 串口', 'Refresh USB serial');
    }
    if (els.checkedAt) {
      els.checkedAt.textContent = snapshot && finiteNumber(snapshot.checkedAt) !== null
        ? tr('最近检查：{time}', 'Last checked: {time}', { time: formatDate(snapshot.checkedAt) })
        : tr('最近检查：未读取', 'Last checked: not read');
    }
  }

  function render() {
    renderHeader();
    renderContent();
    renderPttPresentation();
    if (els.message) {
      els.message.textContent = state.message;
      els.message.dataset.state = state.messageState;
    }
    scheduleMirrorAuto();
  }

  function build() {
    var host = document.getElementById('hardware-root');
    if (!host || state.initialized) return false;
    state.initialized = true;
    els.host = host;
    host.replaceChildren();
    var section = document.getElementById('hardware-section');
    if (section) section.classList.add('apps-card', 'apps-hardware-card');

    var header = node('header', 'hardware-header');
    var mark = node('span', 'hardware-icon');
    icon(mark);
    var heading = node('div', 'hardware-heading');
    var titleRow = node('div', 'hardware-title-row');
    var title = node('h3', '', tr('已连接硬件', 'Connected hardware'));
    title.id = 'hardware-title';
    els.status = node('span', 'hardware-status', tr('尚未读取', 'Not checked'));
    els.status.id = 'hardware-status';
    els.status.dataset.state = 'idle';
    els.refresh = button(tr('刷新 USB 串口', 'Refresh USB serial'), 'refresh', 'hardware-usb-refresh');
    els.refresh.setAttribute('aria-label', tr('刷新 USB 串口设备', 'Refresh USB serial devices'));
    var statusWrap = node('div', 'hardware-status-wrap');
    append(statusWrap, els.status, els.refresh);
    append(titleRow, title, statusWrap);
    heading.appendChild(titleRow);
    heading.appendChild(node('p', 'hardware-description', tr(
      '查看 ESP32 等 USB 串口设备。读取状态为 115200 被动读取，不重置或刷写。',
      'View ESP32 and other USB serial devices. Status reads passively at 115200 baud without resetting or flashing.'
    )));
    els.checkedAt = node('p', 'hardware-checked-at', tr('最近检查：未读取', 'Last checked: not read'));
    heading.appendChild(els.checkedAt);
    append(header, mark, heading);
    host.appendChild(header);

    els.message = node('p', 'hardware-message');
    els.message.id = 'hardware-message';
    els.message.setAttribute('role', 'status');
    els.message.setAttribute('aria-live', 'polite');
    els.message.setAttribute('aria-atomic', 'true');
    host.appendChild(els.message);
    els.content = node('div', 'hardware-content');
    host.appendChild(els.content);

    host.addEventListener('click', onClick);
    host.addEventListener('change', onControlChange);
    host.addEventListener('pointerdown', onPttPointerDown);
    document.addEventListener('pointerup', onPttPointerUp, true);
    document.addEventListener('pointercancel', onPttPointerCancel, true);
    document.addEventListener('lostpointercapture', onPttLostPointerCapture, true);
    document.addEventListener('keydown', onPttKeyDown, true);
    document.addEventListener('keyup', onPttKeyUp, true);
    root.addEventListener('blur', onPttWindowBlur);
    root.addEventListener('openbot:voice-display-changed', renderVoiceDisplayPresentation);
    document.addEventListener('visibilitychange', onPttVisibilityChange);
    state.ptt.listenersAttached = true;
    root.addEventListener('pagehide', onMirrorPageHide, { once: true });
    root.addEventListener('pagehide', onPttPageHide, { once: true });
    setFeedback(apiMethod('hardwareStatus')
      ? tr('打开此页时读取 USB 硬件状态。', 'USB hardware status is read when this page opens.')
      : tr('此功能需要更新后的 Bot Studio 桌面版。', 'This feature requires an updated Bot Studio desktop app.'),
    apiMethod('hardwareStatus') ? 'idle' : 'error');
    render();
    watchVisibility();
    subscribeChanges();
    return true;
  }

  function errorKind(error) {
    var code = String(error && error.code || '');
    var message = String(error && error.message || '');
    if (/BUSY|EBUSY|PORT_IN_USE/i.test(code) || /busy|in use|EBUSY|resource busy/i.test(message)) return 'busy';
    if (/TIMEOUT|TIMED_OUT/i.test(code) || /timed? out|timeout/i.test(message)) return 'timeout';
    if (/DISCONNECT|NOT_FOUND|DEVICE_GONE/i.test(code) || /disconnect|not found|device gone/i.test(message)) return 'offline';
    if (code === 'API_UNAVAILABLE') return 'unavailable';
    return 'error';
  }

  function failureMessage(action, error) {
    var kind = errorKind(error);
    if (action.indexOf('probe:') === 0 && kind === 'busy') return tr(
      '串口当前被占用。关闭其他串口工具后重试。',
      'The serial port is in use. Close other serial tools and retry.'
    );
    if (action.indexOf('probe:') === 0 && kind === 'offline') return tr(
      '设备已断开。刷新设备列表后重试。',
      'The device disconnected. Refresh the device list and retry.'
    );
    if (action.indexOf('probe:') === 0 && kind === 'timeout') return tr(
      '读取超时。请确认设备仍连接后重试。',
      'The device read timed out. Check that it is still connected and retry.'
    );
    if (kind === 'unavailable') return tr(
      '此功能需要更新后的 Bot Studio 桌面版。',
      'This feature requires an updated Bot Studio desktop app.'
    );
    if (action === 'import') return tr(
      '无法导入探测信息。请选择有效的设备报告后重试。',
      'Could not import the probe information. Choose a valid device report and retry.'
    );
    if (action === 'refresh') return tr(
      '无法刷新 USB 设备列表。请重试。',
      'Could not refresh the USB device list. Try again.'
    );
    if (action.indexOf('probe:') === 0) return tr(
      '读取设备状态失败。请确认设备仍连接后重试。',
      'Could not read device status. Check that the device is connected and retry.'
    );
    return tr('无法读取硬件状态。请重试。', 'Could not read hardware status. Try again.');
  }

  function mirrorIdentity(snapshot) {
    var display = displaySnapshot(snapshot);
    var deviceId = display && stringValue(display.deviceId);
    if (!deviceId) return '';
    var active = display.active && typeof display.active === 'object' ? display.active : {};
    var firmware = display.firmware && typeof display.firmware === 'object' ? display.firmware : {};
    var gatewayDevice = gatewayDeviceFor(snapshot, deviceId) || {};
    var session = gatewayDevice.session && typeof gatewayDevice.session === 'object' ? gatewayDevice.session : {};
    var gateway = gatewaySnapshot(snapshot);
    var identityParts = [deviceId, stringValue(display.sessionId), String(display.generation === undefined ? '' : display.generation),
      stringValue(display.status), stringValue(active.botId), stringValue(active.revision),
      stringValue(active.sha256), stringValue(firmware.elfSha256), stringValue(firmware.version),
      gateway ? String(gateway.running === true) : 'gateway-not-read'];
    ['sessionId', 'generation', 'epoch', 'connectionId', 'revision'].forEach(function (key) {
      identityParts.push(String(gatewayDevice[key] === undefined ? '' : gatewayDevice[key]));
    });
    identityParts.push(String(gatewayDevice.connected === undefined ? '' : gatewayDevice.connected));
    identityParts.push(String(gatewayDevice.ready === undefined ? '' : gatewayDevice.ready));
    identityParts.push(stringValue(gatewayDevice.state));
    identityParts.push(stringValue(session.id), String(session.generation === undefined ? '' : session.generation));
    return identityParts.join('\u001f');
  }

  function clearMirrorTimer() {
    if (state.mirror.timer) {
      clearTimeout(state.mirror.timer);
      state.mirror.timer = null;
    }
  }

  function invalidateMirrorRequest(clearImage) {
    state.mirror.request++;
    state.mirror.busy = false;
    state.mirror.error = '';
    if (clearImage) {
      state.mirror.dataUrl = '';
      state.mirror.at = null;
    }
  }

  function reconcileMirrorTarget(snapshot) {
    var identity = mirrorIdentity(snapshot);
    if (state.mirror.targetKey && identity !== state.mirror.targetKey) {
      clearMirrorTimer();
      invalidateMirrorRequest(true);
    }
    state.mirror.targetKey = identity;
    var target = mirrorTargetDevice(snapshot);
    if (!target && state.mirror.deviceId && !state.mirror.busy) {
      state.mirror.dataUrl = '';
      state.mirror.at = null;
      state.mirror.error = '';
    }
  }

  function mirrorFailureMessage(error) {
    var code = stringValue(error && error.code) || stringValue(error && error.message);
    if (/OFFLINE|DISPLAY_UNAVAILABLE/.test(code)) return tr('设备屏幕当前不可达。请检查设备连接后重试。', 'The device screen is unavailable. Check the device connection and retry.');
    if (/SNAPSHOT_UNSUPPORTED|DISPLAY_UNSUPPORTED/.test(code)) return tr('设备固件暂不支持屏幕快照。', 'This device firmware does not support screen snapshots.');
    if (code === 'API_UNAVAILABLE') return tr('屏幕快照接口尚未接入。', 'The screen snapshot API is not connected yet.');
    return tr('抓取设备屏幕失败，请重试。', 'Could not capture the device screen. Try again.');
  }

  function snapshotScreen(deviceId) {
    if (state.mirror.busy || !visibleInSettings()) return Promise.resolve();
    var target = mirrorTargetDevice(state.snapshot);
    var requestedId = String(deviceId || '');
    if (!target || target.deviceId !== requestedId || !apiMethod('hardwareSnapshot')) return Promise.resolve();
    var identity = mirrorIdentity(state.snapshot);
    var request = ++state.mirror.request;
    state.mirror.busy = true;
    state.mirror.deviceId = requestedId;
    state.mirror.targetKey = identity;
    state.mirror.error = '';
    render();
    return callApi('hardwareSnapshot', []).then(function (result) {
      if (request !== state.mirror.request) return;
      var latestTarget = mirrorTargetDevice(state.snapshot);
      if (!visibleInSettings() || !latestTarget || latestTarget.deviceId !== requestedId || mirrorIdentity(state.snapshot) !== identity) {
        clearMirrorTimer();
        invalidateMirrorRequest(false);
        return;
      }
      state.mirror.busy = false;
      if (result && result.ok === true && validFrameDataUrl(result.dataUrl)) {
        state.mirror.dataUrl = result.dataUrl;
        state.mirror.at = finiteNumber(result.at) !== null ? result.at : Date.now();
      } else {
        state.mirror.error = mirrorFailureMessage({ code: result && result.code || 'SNAPSHOT_FAILED' });
      }
      render();
    }).catch(function (error) {
      if (request !== state.mirror.request) return;
      if (!visibleInSettings() || mirrorIdentity(state.snapshot) !== identity) {
        clearMirrorTimer();
        invalidateMirrorRequest(false);
        return;
      }
      state.mirror.busy = false;
      state.mirror.error = mirrorFailureMessage(error);
      render();
    });
  }

  function setMirrorAuto(value) {
    state.mirror.auto = value === true;
    scheduleMirrorAuto();
  }

  function scheduleMirrorAuto() {
    clearMirrorTimer();
    if (!state.mirror.auto || !visibleInSettings() || state.mirror.busy) return;
    var target = mirrorTargetDevice(state.snapshot);
    if (!target) return;
    state.mirror.timer = setTimeout(function () {
      state.mirror.timer = null;
      var latest = mirrorTargetDevice(state.snapshot);
      if (visibleInSettings() && latest && latest.deviceId === target.deviceId) snapshotScreen(target.deviceId);
    }, 2000);
  }

  function applySnapshot(snapshot) {
    handlePttSnapshot(snapshot);
    reconcileMirrorTarget(snapshot);
    state.snapshot = snapshot;
    state.lastError = '';
    render();
  }

  function snapshotFeedback(snapshot, successText) {
    if (snapshot.error || snapshot.available !== true) {
      state.lastError = tr('硬件发现暂不可用。仍保留最近已知设备记录。', 'Hardware discovery is unavailable. Recently known device records were kept.');
      setFeedback(state.lastError, 'error');
    } else setFeedback(successText, 'ok');
  }

  function finishBusy(action) {
    if (state.busy === action) state.busy = '';
    render();
    if (!visibleInSettings()) return;
    if (state.refreshAfterBusy) {
      state.refreshAfterBusy = false;
      readStatus();
    }
  }

  function requestSnapshot(method, action, args, successText) {
    if (state.busy) return Promise.resolve();
    state.busy = action;
    state.lastError = '';
    var request = ++state.request;
    setFeedback(action === 'status'
      ? tr('正在读取 USB 硬件状态…', 'Reading USB hardware status…')
      : tr('正在刷新 USB 设备列表…', 'Refreshing the USB device list…'), 'pending');
    render();
    return callApi(method, args).then(function (result) {
      if (request !== state.request || !visibleInSettings()) return;
      var snapshot = unwrapSnapshot(result);
      applySnapshot(snapshot);
      snapshotFeedback(snapshot, successText);
    }).catch(function (error) {
      if (request !== state.request) return;
      state.lastError = failureMessage(action, error);
      setFeedback(state.lastError, 'error');
      render();
    }).then(function () {
      finishBusy(action);
    });
  }

  function readStatus() {
    return requestSnapshot('hardwareStatus', 'status', [], tr('硬件状态已读取。', 'Hardware status was read.'));
  }

  function refresh() {
    return requestSnapshot('hardwareRefresh', 'refresh', [], tr('设备列表已刷新。', 'Device list refreshed.'));
  }

  function probeMessage(snapshot, deviceId) {
    var device = snapshot && Array.isArray(snapshot.devices)
      ? snapshot.devices.find(function (item) { return item && String(item.id || '') === String(deviceId); }) : null;
    var status = device && device.serial && device.serial.status;
    if (status === 'ok') return { text: tr('设备状态已读取。', 'Device status was read.'), tone: 'ok' };
    if (status === 'silent') return { text: tr('设备未回应；保留最近已知信息。', 'The device did not respond; recently known information was kept.'), tone: 'error' };
    if (status === 'busy') return { text: tr('串口当前被占用。关闭其他串口工具后重试。', 'The serial port is in use. Close other serial tools and retry.'), tone: 'error' };
    if (status === 'error') return { text: tr('读取设备状态失败。请确认设备仍连接后重试。', 'Could not read device status. Check that the device is connected and retry.'), tone: 'error' };
    return { text: tr('探测已结束；设备没有报告可读状态。', 'The probe ended without a readable device status.'), tone: 'idle' };
  }

  function probe(deviceId) {
    if (state.busy) return Promise.resolve();
    var action = 'probe:' + deviceId;
    state.busy = action;
    state.lastError = '';
    var request = ++state.request;
    setFeedback(tr('正在读取设备状态…', 'Reading device status…'), 'pending');
    render();
    return callApi('hardwareProbe', [deviceId]).then(function (result) {
      if (request !== state.request || !visibleInSettings()) return;
      var snapshot = unwrapSnapshot(result);
      applySnapshot(snapshot);
      var feedback = probeMessage(snapshot, deviceId);
      setFeedback(feedback.text, feedback.tone);
    }).catch(function (error) {
      if (request !== state.request) return;
      state.lastError = failureMessage(action, error);
      setFeedback(state.lastError, 'error');
      render();
    }).then(function () {
      finishBusy(action);
    });
  }

  function importReport() {
    if (state.busy) return Promise.resolve();
    var action = 'import';
    state.busy = action;
    state.lastError = '';
    var request = ++state.request;
    setFeedback(tr('选择设备探测报告…', 'Choose a device probe report…'), 'pending');
    render();
    return callApi('hardwareImportReport').then(function (result) {
      if (request !== state.request || !visibleInSettings()) return;
      if (result && result.ok === false) {
        var failure = new Error('REQUEST_FAILED');
        failure.code = result.code || 'REQUEST_FAILED';
        throw failure;
      }
      if (result && result.canceled === true) {
        setFeedback(tr('已取消导入，现有设备信息未更改。', 'Import canceled. Existing device information was kept.'), 'idle');
        return;
      }
      if (result && result.snapshot) {
        var imported = unwrapSnapshot(result.snapshot);
        applySnapshot(imported);
        snapshotFeedback(imported, tr('探测信息已导入并刷新。', 'Probe information was imported and refreshed.'));
        return;
      }
      return callApi('hardwareStatus').then(function (value) {
        if (request !== state.request || !visibleInSettings()) return;
        var updated = unwrapSnapshot(value);
        applySnapshot(updated);
        snapshotFeedback(updated, tr('探测信息已导入并刷新。', 'Probe information was imported and refreshed.'));
      });
    }).catch(function (error) {
      if (request !== state.request) return;
      state.lastError = failureMessage(action, error);
      setFeedback(state.lastError, 'error');
      render();
    }).then(function () {
      finishBusy(action);
    });
  }

  function onClick(event) {
    var target = event.target && event.target.closest ? event.target.closest('[data-hardware-action]') : null;
    if (!target || target.disabled || !els.host.contains(target)) return;
    var action = target.dataset.hardwareAction;
    if (action === 'refresh') refresh();
    else if (action === 'wifi-voice-mode' && root.openBotVoiceDisplay) root.openBotVoiceDisplay.usePttMode().then(readStatus);
    else if (action === 'probe' && target.dataset.deviceId) probe(target.dataset.deviceId);
    else if (action === 'snapshot' && target.dataset.deviceId) snapshotScreen(target.dataset.deviceId);
    else if (action === 'import') importReport();
  }

  function onControlChange(event) {
    var target = event.target;
    if (target && target.dataset && target.dataset.hardwareAction === 'usb-text-display' && els.host.contains(target)) {
      if (root.openBotVoiceDisplay) root.openBotVoiceDisplay.setEnabled(target.checked);
      return;
    }
    if (!target || !target.matches || !target.matches('[data-hardware-action="snapshot-auto"]') || !els.host.contains(target)) return;
    setMirrorAuto(target.checked);
  }

  function onMirrorPageHide() {
    clearMirrorTimer();
    invalidateMirrorRequest(false);
  }

  function eventSnapshot(payload) {
    if (validSnapshot(payload)) return payload;
    if (payload && validSnapshot(payload.snapshot)) return payload.snapshot;
    return null;
  }

  function subscribeChanges() {
    var method = apiMethod('onHardwareChanged');
    if (!method || state.unsubscribe) return;
    try {
      var off = method.call(root.grokbot, function (payload) {
        if (!visibleInSettings()) return;
        var incoming = eventSnapshot(payload);
        if (incoming) handlePttSnapshot(incoming);
        if (state.busy) {
          state.refreshAfterBusy = true;
          return;
        }
        if (incoming) {
          state.request++;
          applySnapshot(incoming);
        } else readStatus();
      });
      if (typeof off === 'function') state.unsubscribe = off;
    } catch (_) { state.unsubscribe = null; }
    if (state.unsubscribe) root.addEventListener('pagehide', unsubscribeChanges, { once: true });
  }

  function unsubscribeChanges() {
    if (typeof state.unsubscribe === 'function') {
      try { state.unsubscribe(); } catch (_) { }
    }
    state.unsubscribe = null;
  }

  function watchVisibility() {
    var panel = document.getElementById('set-panel-apps');
    var mask = document.getElementById('set-mask');
    if (!panel) return;
    var wasVisible = visibleInSettings();
    state.visible = wasVisible;
    if (wasVisible) readStatus();
    function onChange() {
      var visible = visibleInSettings();
      if (visible && !wasVisible) {
        state.request++;
        readStatus();
      }
      if (!visible && wasVisible) {
        cancelPttForFocusLoss('settings-hidden');
        clearMirrorTimer();
        invalidateMirrorRequest(false);
        state.request++;
        state.busy = '';
        state.refreshAfterBusy = false;
        render();
      }
      wasVisible = visible;
      state.visible = visible;
    }
    if (typeof root.MutationObserver === 'function') {
      var observer = new root.MutationObserver(onChange);
      observer.observe(panel, { attributes: true, attributeFilter: ['hidden', 'open'], childList: true, subtree: true });
      if (mask) observer.observe(mask, { attributes: true, attributeFilter: ['class', 'hidden'] });
    }
    document.addEventListener('visibilitychange', onChange);
  }

  function init() {
    if (!state.initialized && document.getElementById('hardware-root')) build();
  }

  function start() {
    Promise.resolve(root.OpenBotI18n && root.OpenBotI18n.ready).then(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window);
