(function (root) {
  'use strict';

  var mounted = new WeakMap();
  function tr(zh, en, params) {
    var i18n = root.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en, params) : (params ? String(zh).replace(/\{([a-zA-Z0-9_]+)\}/g, function (match, key) { return Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match; }) : zh);
  }
  function make(tag, className, text) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }
  function button(id, text, className, type) {
    var node = make('button', 'mwb-button ' + (className || ''), text);
    node.id = id;
    node.type = type || 'button';
    return node;
  }
  function template() {
    var panel = make('div', 'mwb-panel');
    panel.innerHTML = [
      '<div class="mwb-heading"><h3>' + tr('手机连接', 'Mobile access') + '</h3><p id="mwb-state"></p></div>',
      '<p class="mwb-description">' + tr('仅在你启动时开放本机局域网连接。扫码设备只能访问你明确勾选的 Bot。', 'Local network access starts only when you choose to start it. A scanned device can access only the Bots you select.') + '</p>',
      '<div class="mwb-service-row">',
      '<label class="mwb-field" for="mwb-address"><span>' + tr('连接地址', 'Connection address') + '</span><select id="mwb-address"></select></label>',
      '<button id="mwb-start" class="mwb-button mwb-button-primary" type="button">' + tr('启动', 'Start') + '</button>',
      '<button id="mwb-stop" class="mwb-button mwb-button-danger" type="button" hidden>' + tr('停止服务', 'Stop service') + '</button>',
      '</div>',
      '<p id="mwb-status" class="mwb-status" role="status" aria-live="polite"></p>',
      '<p id="mwb-origins" class="mwb-origins" hidden></p>',
      '<section id="mwb-pairing" class="mwb-section" hidden aria-labelledby="mwb-pairing-title">',
      '<div class="mwb-section-head"><h4 id="mwb-pairing-title">' + tr('选择可连接的 Bot', 'Choose which Bots can connect') + '</h4><button id="mwb-create-qr" class="mwb-button mwb-button-primary" type="button" disabled>' + tr('生成二维码', 'Create QR code') + '</button></div>',
      '<p class="mwb-help">' + tr('至少勾选一个 Bot。授权范围仅包含所选 Bot。', 'Select at least one Bot. Access is limited to your selection.') + '</p>',
      '<div id="mwb-bot-list" class="mwb-bot-list"></div>',
      '<p id="mwb-bot-empty" class="mwb-empty" hidden>' + tr('没有可授权的 Bot。', 'No Bots are available to authorize.') + '</p>',
      '<div id="mwb-qr-panel" class="mwb-qr-panel" hidden>',
      '<img id="mwb-qr-image" class="mwb-qr-image" alt="' + tr('手机配对二维码', 'Phone pairing QR code') + '">',
      '<p id="mwb-qr-copy" class="mwb-qr-copy" role="status" aria-live="polite"></p>',
      '<button id="mwb-qr-close" class="mwb-qr-close" type="button" aria-label="' + tr('关闭二维码', 'Close QR code') + '">×</button>',
      '</div>',
      '</section>',
      '<section id="mwb-devices-section" class="mwb-section" hidden aria-labelledby="mwb-devices-title">',
      '<div class="mwb-section-head"><h4 id="mwb-devices-title">' + tr('已连接设备', 'Connected devices') + '</h4></div>',
      '<div id="mwb-device-list" class="mwb-device-list"></div>',
      '<p id="mwb-device-empty" class="mwb-empty" hidden>' + tr('还没有已连接的设备。', 'No devices are connected yet.') + '</p>',
      '</section>',
      '<details id="mwb-certificate" class="mwb-disclosure">',
      '<summary>' + tr('首次连接与证书', 'First connection and certificate') + '</summary>',
      '<p class="mwb-cert-copy">' + tr('首次连接手机前，请导出公开 CA 证书，并按照手机系统提示安装和信任。不要忽略或绕过浏览器的证书警告。', 'Before connecting a phone for the first time, export the public CA certificate and install and trust it using the phone’s system settings. Do not ignore or bypass browser certificate warnings.') + '</p>',
      '<div class="mwb-cert-meta"><span>' + tr('SHA-256 指纹', 'SHA-256 fingerprint') + '</span><code id="mwb-fingerprint">' + tr('尚不可用', 'Not available') + '</code><span id="mwb-expiry"></span></div>',
      '<button id="mwb-export-certificate" class="mwb-button" type="button">' + tr('导出公开证书', 'Export public certificate') + '</button>',
      '</details>'
    ].join('');
    return panel;
  }

  function mount(target, options) {
    var element = typeof target === 'string' ? root.document.querySelector(target) : target;
    if (!element) return function () {};
    var previous = mounted.get(element);
    if (previous) return previous.dispose;

    var bridge = root.grokbot;
    var opts = options || {};
    var currentBotId = opts.currentBotId || element.dataset.currentBotId || '';
    var selectedBotIds = null;
    var state = null;
    var busy = false;
    var disposed = false;
    var qrData = '';
    var qrTimer = null;
    var qrPollTimer = null;
    var qrBaselineDevices = null;
    var clearPairingPromise = Promise.resolve();
    var statusSequence = 0;
    var eventOff = null;
    var observer = null;
    var aborter = new AbortController();
    element.replaceChildren(template());

    var refs = {
      state: element.querySelector('#mwb-state'), address: element.querySelector('#mwb-address'),
      start: element.querySelector('#mwb-start'), stop: element.querySelector('#mwb-stop'),
      status: element.querySelector('#mwb-status'), origins: element.querySelector('#mwb-origins'),
      pairing: element.querySelector('#mwb-pairing'), bots: element.querySelector('#mwb-bot-list'),
      botEmpty: element.querySelector('#mwb-bot-empty'), createQr: element.querySelector('#mwb-create-qr'),
      qrPanel: element.querySelector('#mwb-qr-panel'), qrImage: element.querySelector('#mwb-qr-image'),
      qrCopy: element.querySelector('#mwb-qr-copy'), qrClose: element.querySelector('#mwb-qr-close'),
      devicesSection: element.querySelector('#mwb-devices-section'), devices: element.querySelector('#mwb-device-list'),
      deviceEmpty: element.querySelector('#mwb-device-empty'), certificate: element.querySelector('#mwb-certificate'),
      fingerprint: element.querySelector('#mwb-fingerprint'), expiry: element.querySelector('#mwb-expiry'),
      exportCertificate: element.querySelector('#mwb-export-certificate')
    };

    function setMessage(message, kind) {
      refs.status.textContent = message || '';
      if (kind) refs.status.dataset.state = kind;
      else refs.status.removeAttribute('data-state');
    }
    function invalidatePairing() {
      clearPairingPromise = action('clear-pairing', {}).catch(function () { /* The visible QR is cleared; never recreate it implicitly. */ });
      return clearPairingPromise;
    }
    function clearQr(invalidate) {
      var hadQr = !!qrData || !refs.qrPanel.hidden;
      if (qrTimer) root.clearTimeout(qrTimer);
      if (qrPollTimer) root.clearTimeout(qrPollTimer);
      qrTimer = null;
      qrPollTimer = null;
      qrBaselineDevices = null;
      qrData = '';
      refs.qrImage.removeAttribute('src');
      refs.qrCopy.textContent = '';
      // A hidden settings section is observed too. Reassigning hidden=true
      // here would create an endless MutationObserver loop when no QR exists.
      if (!refs.qrPanel.hidden) refs.qrPanel.hidden = true;
      if (invalidate && hadQr) invalidatePairing();
      return clearPairingPromise;
    }
    function isHidden(node) {
      return !!(node && (node.hidden || node.classList.contains('hidden') || root.getComputedStyle(node).display === 'none'));
    }
    function settingsVisible() {
      var appsPanel = root.document.getElementById('set-panel-apps');
      var settingsMask = root.document.getElementById('set-mask');
      return !isHidden(element) && !isHidden(appsPanel) && !isHidden(settingsMask);
    }
    function scheduleQrRefresh() {
      if (qrPollTimer) root.clearTimeout(qrPollTimer);
      qrPollTimer = null;
      if (disposed || !qrData || refs.qrPanel.hidden || !settingsVisible()) return;
      qrPollTimer = root.setTimeout(function () {
        qrPollTimer = null;
        refresh();
      }, 2000);
    }
    function action(name, input) {
      if (!bridge || typeof bridge.mobileWebAction !== 'function') return Promise.reject(new Error(tr('手机连接暂不可用。', 'Mobile access is unavailable.')));
      return Promise.resolve(bridge.mobileWebAction({ action: name, input: input || {} }));
    }
    function createBotOption(bot, checked) {
      var label = make('label', 'mwb-bot-option');
      var input = root.document.createElement('input');
      input.type = 'checkbox'; input.value = String(bot.id); input.checked = checked;
      input.setAttribute('aria-label', bot.name || String(bot.id));
      label.appendChild(input);
      label.appendChild(make('span', '', bot.name || bot.id));
      return label;
    }
    function formatLastSeen(value) {
      if (!value) return tr('最近活动未知', 'Activity time unknown');
      var date = new Date(value);
      if (Number.isNaN(date.getTime())) return tr('最近活动未知', 'Activity time unknown');
      try { return new Intl.DateTimeFormat(root.OpenBotI18n && root.OpenBotI18n.locale === 'en' ? 'en' : 'zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(date); }
      catch (_) { return date.toLocaleString(); }
    }
    function renderDevices(devices) {
      refs.devices.replaceChildren();
      var list = Array.isArray(devices) ? devices.filter(function (device) { return !device.revokedAt && Number(device.expiresAt) > Date.now(); }) : [];
      refs.devicesSection.hidden = !(state && state.running);
      refs.deviceEmpty.hidden = list.length > 0;
      list.forEach(function (device) {
        var row = make('div', 'mwb-device-row');
        var copy = make('div', 'mwb-device-copy');
        var names = Array.isArray(device.botIds) ? device.botIds.map(function (id) {
          var bot = (state.bots || []).find(function (item) { return String(item.id) === String(id); });
          return bot ? bot.name : String(id);
        }) : [];
        copy.appendChild(make('span', 'mwb-device-name', device.name || tr('未命名设备', 'Unnamed device')));
        copy.appendChild(make('span', 'mwb-device-meta', tr('{count} 个 Bot · 授权于 {time}', '{count} Bots · Authorized {time}', { count: names.length, time: formatLastSeen(device.createdAt) })));
        if (names.length) copy.appendChild(make('span', 'mwb-device-meta', names.join(' · ')));
        var revoke = button('', tr('撤销', 'Revoke'), 'mwb-button-danger');
        revoke.setAttribute('aria-label', tr('撤销 {name} 的设备授权', 'Revoke device access for {name}', { name: device.name || tr('未命名设备', 'unnamed device') }));
        revoke.addEventListener('click', function () {
          var prompt = tr('撤销 {name} 的访问权限？', 'Revoke access for {name}?', { name: device.name || tr('此设备', 'this device') });
          if (typeof root.confirm === 'function' && !root.confirm(prompt)) return;
          runAction('revoke', { deviceId: device.id }, tr('设备授权已撤销。', 'Device access revoked.'));
        }, { signal: aborter.signal });
        row.appendChild(copy); row.appendChild(revoke); refs.devices.appendChild(row);
      });
    }
    function render(value) {
      if (disposed || !value) return;
      state = value;
      var addresses = Array.isArray(value.addresses) ? value.addresses : [];
      var previousAddress = refs.address.value;
      refs.address.replaceChildren();
      addresses.forEach(function (entry) {
        var option = root.document.createElement('option');
        option.value = entry.address || '';
        option.textContent = entry.label || entry.address || '';
        refs.address.appendChild(option);
      });
      if (addresses.some(function (entry) { return entry.address === previousAddress; })) refs.address.value = previousAddress;
      refs.address.disabled = addresses.length === 0 || !!value.running;
      refs.start.hidden = !!value.running;
      refs.stop.hidden = !value.running;
      refs.start.disabled = busy || addresses.length === 0;
      refs.stop.disabled = busy;
      refs.state.textContent = value.running ? tr('运行中', 'Running') : value.enabled ? tr('已启用，未运行', 'Enabled, not running') : tr('已关闭', 'Off');
      refs.origins.hidden = !value.running;
      refs.origins.textContent = value.running ? (value.origin || '') : '';
      refs.pairing.hidden = !value.running;
      refs.devicesSection.hidden = !value.running;
      var bots = Array.isArray(value.bots) ? value.bots : [];
      if (selectedBotIds === null) {
        selectedBotIds = new Set();
        if (currentBotId && bots.some(function (bot) { return String(bot.id) === String(currentBotId); })) selectedBotIds.add(String(currentBotId));
      }
      Array.from(selectedBotIds).forEach(function (id) {
        if (!bots.some(function (bot) { return String(bot.id) === id; })) selectedBotIds.delete(id);
      });
      refs.bots.replaceChildren();
      bots.forEach(function (bot) { refs.bots.appendChild(createBotOption(bot, selectedBotIds.has(String(bot.id)))); });
      refs.botEmpty.hidden = bots.length > 0;
      refs.createQr.disabled = busy || selectedBotIds.size === 0 || !value.running;
      var certificate = value.certificate || {};
      refs.fingerprint.textContent = certificate.fingerprint || tr('尚不可用', 'Not available');
      refs.expiry.textContent = certificate.expiresAt ? tr('有效期至 {date}', 'Expires {date}', { date: formatLastSeen(certificate.expiresAt) }) : '';
      refs.exportCertificate.disabled = busy || !certificate.fingerprint;
      if (value.error) setMessage(String(value.error), 'error');
      else if (!busy && refs.status.dataset.state === 'error') setMessage('');
      if (!value.running && !addresses.length && !value.error && !busy) {
        setMessage(tr('没有可用的局域网地址。请检查电脑的网络连接。', 'No local network address is available. Check the computer’s network.'), 'error');
      }
      if (!value.running) clearQr(true);
      renderDevices(value.devices);
      if (qrData && !refs.qrPanel.hidden) {
        var knownDevices = qrBaselineDevices || new Set();
        var newlyConnected = (Array.isArray(value.devices) ? value.devices : []).find(function (device) { return !knownDevices.has(String(device.id)); });
        if (newlyConnected) {
          clearQr(true);
          setMessage(tr('{name} 已连接。', '{name} connected.', { name: newlyConnected.name || tr('手机', 'Phone') }), 'success');
        } else scheduleQrRefresh();
      }
      if (root.OpenBotI18n && typeof root.OpenBotI18n.localize === 'function') root.OpenBotI18n.localize(element);
    }
    function refresh() {
      if (disposed || !bridge || typeof bridge.mobileWebStatus !== 'function') {
        if (!disposed) setMessage(tr('手机连接状态暂不可用。', 'Mobile access status is unavailable.'), 'error');
        return Promise.resolve();
      }
      var sequence = ++statusSequence;
      return Promise.resolve(bridge.mobileWebStatus()).then(function (value) {
        if (sequence === statusSequence) render(value);
      }).catch(function (error) {
        if (sequence === statusSequence) setMessage(error && error.message || tr('无法读取手机连接状态。', 'Could not read mobile access status.'), 'error');
        scheduleQrRefresh();
      });
    }
    function runAction(name, input, successText) {
      if (busy) return Promise.resolve();
      busy = true;
      setMessage(tr('正在处理…', 'Working…'));
      refs.start.disabled = refs.stop.disabled = refs.createQr.disabled = refs.exportCertificate.disabled = true;
      return action(name, input).then(function (result) {
        if (!result || result.ok === false) throw new Error(result && (result.message || result.error) || tr('操作失败，请重试。', 'The action failed. Try again.'));
        if (result.canceled) { setMessage(''); return; }
        setMessage(successText || '', successText ? 'success' : '');
        if (name === 'stop') clearQr(true);
        return refresh();
      }).catch(function (error) {
        setMessage(error && error.message || tr('操作失败，请重试。', 'The action failed. Try again.'), 'error');
      }).finally(function () {
        busy = false;
        if (!disposed) {
          refs.start.disabled = !state || !(state.addresses || []).length;
          refs.stop.disabled = false;
          refs.createQr.disabled = !state || !state.running || !selectedBotIds || selectedBotIds.size === 0;
          refs.exportCertificate.disabled = !state || !(state.certificate && state.certificate.fingerprint);
        }
      });
    }

    refs.start.addEventListener('click', function () {
      if (!refs.address.value) return;
      runAction('start', { address: refs.address.value }, tr('手机连接已启动。', 'Mobile access started.'));
    }, { signal: aborter.signal });
    refs.stop.addEventListener('click', function () {
      runAction('stop', {}, tr('手机连接已停止。', 'Mobile access stopped.'));
    }, { signal: aborter.signal });
    refs.bots.addEventListener('change', function (event) {
      if (!event.target || event.target.type !== 'checkbox') return;
      var id = String(event.target.value);
      if (event.target.checked) selectedBotIds.add(id); else selectedBotIds.delete(id);
      refs.createQr.disabled = busy || !state || !state.running || selectedBotIds.size === 0;
    }, { signal: aborter.signal });
    refs.createQr.addEventListener('click', function () {
      if (!selectedBotIds || selectedBotIds.size === 0) return;
      busy = true;
      var existingDeviceIds = (state && Array.isArray(state.devices) ? state.devices : []).map(function (device) { return String(device.id); });
      var botIds = Array.from(selectedBotIds);
      setMessage(tr('正在生成一次性二维码…', 'Creating a one-time QR code…'));
      refs.createQr.disabled = true;
      clearQr(true).then(function () {
        qrBaselineDevices = new Set(existingDeviceIds);
        return action('pair', { botIds: botIds });
      }).then(function (result) {
        if (!result || !result.ok || typeof result.qrDataUrl !== 'string' || !result.qrDataUrl.startsWith('data:image/')) {
          throw new Error(result && result.error || tr('无法生成二维码，请重试。', 'Could not create the QR code. Try again.'));
        }
        if (disposed) {
          return invalidatePairing();
        }
        qrData = result.qrDataUrl;
        refs.qrImage.src = qrData;
        refs.qrCopy.textContent = tr('请在手机上扫描。二维码只显示这一次。{expiry}', 'Scan with your phone. This QR code is shown only once. {expiry}', { expiry: result.expiresAt ? tr('有效期至 {date}', 'Expires {date}', { date: formatLastSeen(result.expiresAt) }) : '' });
        refs.qrPanel.hidden = false;
        var expiry = result.expiresAt ? new Date(result.expiresAt).getTime() : NaN;
        var delay = Number.isFinite(expiry) ? Math.max(0, expiry - Date.now()) : 5 * 60 * 1000;
        qrTimer = root.setTimeout(function () { clearQr(true); setMessage(tr('二维码已过期，请重新生成。', 'The QR code expired. Create a new one.'), 'error'); }, delay);
        setMessage('');
        scheduleQrRefresh();
      }).catch(function (error) {
        invalidatePairing();
        if (!disposed) setMessage(error && error.message || tr('无法生成二维码，请重试。', 'Could not create the QR code. Try again.'), 'error');
      }).finally(function () {
        busy = false;
        if (!disposed) refs.createQr.disabled = !state || !state.running || !selectedBotIds || selectedBotIds.size === 0;
      });
    }, { signal: aborter.signal });
    refs.qrClose.addEventListener('click', function () { clearQr(true); }, { signal: aborter.signal });
    refs.exportCertificate.addEventListener('click', function () {
      runAction('export-certificate', {}, tr('公开证书已导出。', 'Public certificate exported.'));
    }, { signal: aborter.signal });

    if (bridge && typeof bridge.onMobileWebChanged === 'function') {
      try {
        var onChanged = function (value) {
          if (value && typeof value === 'object' && ('running' in value || 'addresses' in value)) render(value);
          else refresh();
        };
        var subscription = bridge.onMobileWebChanged(onChanged);
        if (typeof subscription === 'function') eventOff = subscription;
      } catch (_) { eventOff = null; }
    }
    observer = new MutationObserver(function () {
      if (!settingsVisible() || (refs.qrPanel.hidden && qrData)) clearQr(true);
      else scheduleQrRefresh();
    });
    observer.observe(element, { attributes: true, attributeFilter: ['class', 'hidden', 'style'], subtree: true });
    var appsPanel = root.document.getElementById('set-panel-apps');
    var settingsMask = root.document.getElementById('set-mask');
    if (appsPanel) observer.observe(appsPanel, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
    if (settingsMask) observer.observe(settingsMask, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
    refresh();

    var controller = { dispose: function () {
      if (disposed) return;
      disposed = true;
      statusSequence++;
      clearQr(true);
      aborter.abort();
      if (observer) observer.disconnect();
      if (eventOff) { try { eventOff(); } catch (_) {} }
      element.replaceChildren();
      mounted.delete(element);
    } };
    mounted.set(element, controller);
    return controller.dispose;
  }

  root.OpenBotMobileWeb = { mount: mount };
})(window);
