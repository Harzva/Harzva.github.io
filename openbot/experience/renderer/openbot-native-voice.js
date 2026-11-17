(function (root) {
  'use strict';
  var mounted = new WeakMap();
  // One lane across mounts preserves create→clear ordering when settings closes
  // before an IPC pairing response returns and is immediately opened again.
  var pairingLane = Promise.resolve();
  function tr(zh, en, params) {
    return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function' ? root.OpenBotI18n.t(zh, en, params) :
      (params ? zh.replace(/\{(\w+)\}/g, function (_, key) { return String(params[key]); }) : zh);
  }
  function make(tag, className, text) { var node = root.document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; }
  function button(text, kind) { var node = make('button', 'nvv-button' + (kind ? ' nvv-' + kind : ''), text); node.type = 'button'; return node; }
  function lane(task) { var pending = pairingLane.then(task, task); pairingLane = pending.catch(function () {}); return pending; }
  function mount(target, options) {
    if (!target) return function () {};
    if (mounted.has(target)) return mounted.get(target);
    var bridge = root.grokbot, disposed = false, busy = false, server = null, selection = null;
    var sequence = 0, pairEpoch = 0, actionEpoch = 0, pendingPair = false, expiresAt = 0, code = '', deadline = null, poll = null;
    var botsSignature = null, devicesSignature = null, pairingDevices = null;
    var aborter = new AbortController(), off, observer;
    var panel = make('div', 'nvv-panel');
    var heading = make('div', 'nvv-heading'), title = make('h3', '', tr('Android 原生语音', 'Android voice'));
    var status = make('p', 'nvv-state', tr('正在读取连接状态…', 'Reading connection status…'));
    status.setAttribute('role', 'status'); heading.append(title, status); panel.append(heading);
    panel.append(make('p', 'nvv-description', tr('手机收音与播放。按住说话，松开发送，再按打断回复。', 'Record and play on your phone. Hold to talk, release to send, and press again to interrupt.')));
    var controls = make('div', 'nvv-controls');
    function field(label, id) { var node = make('label', 'nvv-field'), select = make('select'); node.htmlFor = id; select.id = id; node.append(make('span', '', label), select); controls.append(node); return select; }
    var address = field(tr('本机局域网地址', 'Mac network address'), 'nvv-address');
    var voice = field(tr('播放声音', 'Voice'), 'nvv-voice');
    ['Vivian', 'Ryan'].forEach(function (name) { var option = make('option', '', name); option.value = name; voice.append(option); });
    var start = button(tr('开启原生语音', 'Start voice'), 'primary'), stop = button(tr('停止服务', 'Stop service'), 'danger'), refreshButton = button(tr('刷新状态', 'Refresh status'));
    start.id = 'nvv-start'; stop.id = 'nvv-stop'; refreshButton.id = 'nvv-refresh'; stop.hidden = true; controls.append(start, stop, refreshButton); panel.append(controls);
    panel.append(make('p', 'nvv-help', tr('停止服务会中断当前原生手机语音，保留已配对授权。手机网页与 ESP32 连接不受此操作影响。', 'Stopping interrupts native phone voice and keeps pairing grants. Web and ESP32 connections are unaffected by this action.')));
    var recovery = make('p', 'nvv-message'); recovery.id = 'nvv-recovery'; recovery.hidden = true; recovery.dataset.kind = 'error'; recovery.setAttribute('role', 'status'); panel.append(recovery);
    var message = make('p', 'nvv-message'); message.id = 'nvv-message'; message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite'); panel.append(message);
    var origin = make('p', 'nvv-origin'); origin.id = 'nvv-origin'; origin.hidden = true; panel.append(origin);
    var setup = make('section', 'nvv-section'); setup.hidden = true; setup.id = 'nvv-setup';
    var setupHead = make('div', 'nvv-section-head'); setupHead.append(make('h4', '', tr('配对 Android 手机', 'Pair an Android phone'))); setup.append(setupHead);
    setup.append(make('p', 'nvv-help', tr('在手机端原生语音 App 中导入公开证书，与此处逐字核对指纹，再输入一次性配对码。证书不含私钥，仅供该 App 信任此 Mac，无需安装系统证书。', 'In the Android voice app, import the public certificate and compare its fingerprint character by character with this Mac, then enter the one-time code. The certificate has no private key and is trusted only in this app; no system certificate is needed.')));
    var certificate = make('div', 'nvv-certificate'), exportCertificate = button(tr('导出公开证书', 'Export public certificate'));
    exportCertificate.id = 'nvv-export'; var fingerprint = make('code', 'nvv-fingerprint'); fingerprint.id = 'nvv-fingerprint';
    certificate.append(exportCertificate, make('span', 'nvv-cert-label', 'SHA-256'), fingerprint); setup.append(certificate);
    setup.append(make('p', 'nvv-help', tr('仅为本次配对授权勾选的 Bot。更改勾选会作废未使用的配对码，不改变已配对手机的授权。', 'Select Bots for this pairing. Changing the selection invalidates the unused code and keeps existing phone grants.')));
    var bots = make('div', 'nvv-bots'); bots.id = 'nvv-bots'; setup.append(bots);
    var create = button(tr('生成配对码', 'Create pairing code'), 'primary'); create.id = 'nvv-pair'; setup.append(create);
    var pairing = make('div', 'nvv-pairing'); pairing.id = 'nvv-pairing'; pairing.hidden = true;
    var codeLabel = make('label', 'nvv-field', tr('一次性配对码', 'One-time pairing code')); codeLabel.htmlFor = 'nvv-code';
    var codeInput = make('textarea', 'nvv-code'); codeInput.id = 'nvv-code'; codeInput.readOnly = true; codeInput.rows = 2; codeInput.spellcheck = false; codeInput.autocomplete = 'off'; codeLabel.append(codeInput);
    var pairActions = make('div', 'nvv-pair-actions'), copy = button(tr('复制配对码', 'Copy code')), cancel = button(tr('作废配对码', 'Invalidate code'));
    copy.id = 'nvv-copy'; cancel.id = 'nvv-cancel'; pairActions.append(copy, cancel);
    var expiry = make('p', 'nvv-help'); expiry.id = 'nvv-expiry'; pairing.append(codeLabel, pairActions, expiry, make('p', 'nvv-help', tr('仅作废未使用的配对码。已配对手机请在下方撤销授权。', 'Only invalidates an unused code. To remove a paired phone, revoke its access below.'))); setup.append(pairing); panel.append(setup);
    var devicesSection = make('section', 'nvv-section'); devicesSection.id = 'nvv-devices-section'; devicesSection.hidden = true;
    devicesSection.append(make('h4', '', tr('已配对手机', 'Paired phones')), make('p', 'nvv-help', tr('撤销会使这台手机的授权立即失效，并终止它当前的原生语音会话。', 'Revoking access immediately invalidates this phone’s grant and ends its current native voice session.'))); var devices = make('div', 'nvv-devices'); devices.id = 'nvv-devices'; devicesSection.append(devices); panel.append(devicesSection);
    panel.append(make('p', 'nvv-help nvv-footnote', tr('A 标准语音：手机收音与播放，Mac 负责语音识别、Bot 调用和语音合成。Mac 需保持运行，并与手机处于同一局域网；Mac 离线时无法使用此语音服务。Bot 沿用原有模型和工具权限。', 'Standard voice (A): the phone records and plays audio; the Mac handles speech recognition, Bot calls and speech synthesis. Keep the Mac running on the same local network as your phone. Voice is unavailable while the Mac is offline. Bots keep their existing models and tool permissions.')));
    target.replaceChildren(panel);
    function visible() { return !root.document.hidden && target.isConnected && target.getClientRects().length > 0; }
    function say(text, error) { if (disposed) return; message.textContent = text || ''; message.dataset.kind = error ? 'error' : ''; }
    function action(type, input) {
      if (!bridge || typeof bridge.nativeVoiceAction !== 'function') return Promise.reject(new Error('UNAVAILABLE'));
      return Promise.resolve(bridge.nativeVoiceAction({ action: type, input: input || {} })).then(function (result) {
        if (!result || result.ok === false) throw Object.assign(new Error('ACTION_FAILED'), { code: result && result.code }); return result;
      });
    }
    function friendly(error) {
      var key = error && error.code;
      if (key === 'NATIVE_LOG_DIR_UNAVAILABLE' || key === 'LOCAL_TTS_LOG_DIR_UNAVAILABLE') return tr('无法准备本地语音日志目录，请检查目录位置和写入权限。', 'Unable to prepare the local voice log directory. Check its location and write permissions.');
      if (key === 'NATIVE_CLEANUP_UNKNOWN' || key === 'VOICE_PROVIDER_CLEANUP_UNKNOWN') return tr('尚未确认语音停止，已阻止重新开启。手机扬声器是否停止播放仍需确认。页面每 2.5 秒检查一次，也可点击“刷新状态”；若状态持续不变，请保留当前状态以便排查。', 'Voice has not confirmed it stopped, so restarting is blocked. Phone speaker playback may not have stopped. This page checks every 2.5 seconds; you can also select Refresh status. If this persists, preserve the current state for troubleshooting.');
      if (key === 'MOBILE_ADDRESS_UNAVAILABLE') return tr('所选网络地址已不可用，请重新选择。', 'This network address is no longer available. Select another address.');
      if (key === 'NATIVE_SCOPE_INVALID' || key === 'MOBILE_SCOPE_INVALID') return tr('Bot 授权范围已变化，请重新选择。', 'Bot access changed. Select the Bots again.');
      if (key === 'NATIVE_PORT_CONFLICT' || key === 'EADDRINUSE') return tr('连接端口正被占用，请停止冲突服务后重试。', 'The connection port is in use. Stop the conflicting service and try again.');
      return tr('操作未完成，请检查连接状态后重试。', 'The operation did not finish. Check the connection status and try again.');
    }
    function clearPair(invalidate) {
      var hadPair = pendingPair || !!code; pairEpoch++; pairingDevices = null; code = ''; expiresAt = 0; pendingPair = false;
      root.clearTimeout(deadline); deadline = null; codeInput.value = ''; pairing.hidden = true;
      if (invalidate && hadPair) return lane(function () { return action('clear-pairing'); }).catch(function (error) { say(friendly(error), true); });
      return Promise.resolve();
    }
    function updateControls() {
      var running = !!(server && server.running), changing = busy || !!(server && server.changing), blocked = !!(server && server.blocked);
      address.disabled = changing || running || blocked; voice.disabled = changing || running || blocked;
      start.hidden = running || blocked; start.disabled = changing || blocked || !address.value;
      stop.hidden = blocked || !running && !(server && server.changing);
      // Stop remains available while a provider warms up; manager fences startup.
      stop.disabled = blocked || busy && !(server && server.changing);
      create.disabled = changing || blocked || !running || !selection || !selection.size || pendingPair;
      exportCertificate.disabled = changing || blocked || !(server && server.certificate);
      copy.disabled = blocked; cancel.disabled = blocked;
      bots.querySelectorAll('input').forEach(function (input) { input.disabled = changing || blocked || !running; });
      devices.querySelectorAll('button').forEach(function (node) { node.disabled = changing || blocked || node.dataset.inactive === 'true'; });
    }
    function render(value) {
      if (disposed || !value || value.ok === false) return;
      server = value;
      var oldAddress = address.value, available = value.addresses || [];
      address.replaceChildren(); available.forEach(function (row) { var item = make('option', '', row.label || row.address); item.value = row.address; address.append(item); });
      if (!available.length) { var empty = make('option', '', tr('没有可用的局域网地址', 'No network address available')); empty.value = ''; address.append(empty); }
      var savedAvailable = available.some(function (row) { return row.address === value.address; });
      if (value.running && value.address && !savedAvailable) {
        var bound = make('option', '', value.address + ' · ' + tr('已绑定地址', 'Bound address')); bound.value = value.address; address.append(bound);
      }
      if (value.running) address.value = value.address || '';
      else if (available.some(function (row) { return row.address === oldAddress; })) address.value = oldAddress;
      else address.value = savedAvailable ? value.address : (available[0] && available[0].address) || '';
      if (value.running || !voice.dataset.edited) voice.value = value.voice === 'Ryan' ? 'Ryan' : 'Vivian';
      var connectionCount = Number(value.connections) || 0;
      var onlineText = connectionCount === 1 ? tr('服务已开启 · 1 台手机在线', 'Service running · 1 phone online') : tr('服务已开启 · {count} 台手机在线', 'Service running · {count} phones online', { count: connectionCount });
      status.textContent = value.blocked ? tr('停止状态未确认', 'Stop not confirmed') : value.changing ? tr('正在准备语音服务…', 'Preparing voice…') : value.running ? onlineText : tr('服务未开启', 'Service stopped');
      status.dataset.online = value.running ? 'true' : 'false';
      // Once status arrives, the recovery region owns cleanup feedback. Keep
      // unrelated action errors intact, but do not duplicate or retain this one.
      if (message.textContent === friendly({ code: 'NATIVE_CLEANUP_UNKNOWN' })) say('');
      recovery.hidden = !value.blocked; recovery.textContent = value.blocked ? friendly({ code: 'NATIVE_CLEANUP_UNKNOWN' }) : '';
      origin.hidden = !value.running || !value.origin; origin.textContent = value.origin || '';
      setup.hidden = !value.running; devicesSection.hidden = !value.running;
      fingerprint.textContent = value.certificate && value.certificate.fingerprint || tr('尚不可用', 'Not available');
      var rows = value.bots || [], allowed = new Set(rows.map(function (row) { return row.id; }));
      if (selection === null) selection = new Set(options && allowed.has(options.currentBotId) ? [options.currentBotId] : []);
      var removed = false; selection.forEach(function (id) { if (!allowed.has(id)) { selection.delete(id); removed = true; } });
      if (removed || pairingDevices && (value.devices || []).some(function (row) { return !pairingDevices.has(row.id); })) clearPair(true);
      var nextBotsSignature = JSON.stringify(rows);
      if (nextBotsSignature !== botsSignature) {
      botsSignature = nextBotsSignature; bots.replaceChildren(); rows.forEach(function (row) { var label = make('label', 'nvv-bot'), input = make('input'); input.type = 'checkbox'; input.value = row.id; input.checked = selection.has(row.id);
        input.addEventListener('change', function () { if (input.checked) selection.add(row.id); else selection.delete(row.id); clearPair(true); updateControls(); }, { signal: aborter.signal });
        label.append(input, make('span', '', row.name || row.id)); bots.append(label); });
      if (!rows.length) bots.append(make('p', 'nvv-help', tr('没有可授权的 Bot。', 'No Bots are available to authorize.')));
      }
      var nextDevicesSignature = JSON.stringify([value.devices || [], rows, (value.devices || []).map(function (row) { return Number(row.expiresAt) <= Date.now(); })]);
      if (nextDevicesSignature !== devicesSignature) {
      devicesSignature = nextDevicesSignature; devices.replaceChildren(); (value.devices || []).forEach(function (row) {
        var item = make('div', 'nvv-device'), text = make('div', 'nvv-device-copy'); text.append(make('span', 'nvv-device-name', row.name || tr('Android 手机', 'Android phone')));
        var revoked = row.revokedAt != null, expired = Number(row.expiresAt) <= Date.now();
        var botNames = (row.botIds || []).map(function (id) { var bot = rows.find(function (b) { return b.id === id; }); return bot ? bot.name || id : id; }).join(tr('、', ', '));
        text.append(make('span', 'nvv-help', (revoked ? tr('已撤销', 'Revoked') : expired ? tr('已过期', 'Expired') : tr('已配对', 'Paired')) + (botNames ? ' · ' + botNames : '')));
        var revoke = button(tr('撤销授权', 'Revoke access'), 'danger'); revoke.dataset.inactive = revoked || expired ? 'true' : 'false';
        revoke.addEventListener('click', function () { run('revoke', { deviceId: row.id }); }, { signal: aborter.signal }); item.append(text, revoke); devices.append(item);
      });
      if (!(value.devices || []).length) devices.append(make('p', 'nvv-help', tr('还没有已配对手机。', 'No phones are paired yet.')));
      }
      if (!value.running) clearPair(true);
      if (value.error && !value.blocked && !message.textContent) say(friendly({ code: value.error }), true);
      updateControls();
    }
    function refresh() {
      var current = ++sequence;
      if (!bridge || typeof bridge.nativeVoiceStatus !== 'function') { say(tr('当前版本尚未提供原生手机语音。', 'This version does not support native phone voice.'), true); start.disabled = true; return Promise.resolve(); }
      return Promise.resolve(bridge.nativeVoiceStatus()).then(function (value) { if (!disposed && current === sequence) render(value); }, function () { if (!disposed && current === sequence) say(tr('读取状态失败，请稍后重试。', 'Could not read the status. Try again shortly.'), true); });
    }
    function run(type, input) {
      if (disposed || server && server.blocked || busy && type !== 'stop') return;
      var operation = ++actionEpoch; busy = true; say(''); updateControls();
      var clearing = ['start', 'stop', 'revoke'].includes(type) ? clearPair(true) : Promise.resolve();
      clearing.then(function () { return action(type, input); }).then(function (value) {
        if (disposed || operation !== actionEpoch) return;
        if (type === 'export-certificate') say(value.canceled ? '' : tr('公开证书已导出，请在手机 App 中导入并核对指纹。', 'Certificate exported. Import it in the phone app and compare the fingerprint.'));
        else if (type === 'revoke') say(tr('已撤销这台手机的授权。', 'Access revoked for this phone.'));
      }, function (error) { if (operation === actionEpoch) say(friendly(error), true); }).finally(function () { if (operation === actionEpoch) { busy = false; if (!disposed) { updateControls(); refresh(); } } });
    }
    function tickExpiry() {
      if (!code || disposed) return;
      var left = Math.ceil((expiresAt - Date.now()) / 1000);
      if (left <= 0) { clearPair(true); say(tr('配对码已过期，请重新生成。', 'Pairing code expired. Create a new one.')); return; }
      expiry.textContent = left === 1 ? tr('1 秒后失效，仅可使用一次。', 'Expires in 1 second. Can be used once.') : tr('{seconds} 秒后失效，仅可使用一次。', 'Expires in {seconds} seconds. Can be used once.', { seconds: left });
      deadline = root.setTimeout(tickExpiry, 1000);
    }
    start.addEventListener('click', function () { run('start', { address: address.value, voice: voice.value }); }, { signal: aborter.signal });
    stop.addEventListener('click', function () { run('stop'); }, { signal: aborter.signal });
    refreshButton.addEventListener('click', function () {
      if (disposed || refreshButton.disabled) return;
      refreshButton.disabled = true; say('');
      refresh().finally(function () { if (!disposed) refreshButton.disabled = false; });
    }, { signal: aborter.signal });
    voice.addEventListener('change', function () { voice.dataset.edited = 'true'; }, { signal: aborter.signal });
    address.addEventListener('change', updateControls, { signal: aborter.signal });
    exportCertificate.addEventListener('click', function () { run('export-certificate'); }, { signal: aborter.signal });
    cancel.addEventListener('click', function () { clearPair(true); updateControls(); }, { signal: aborter.signal });
    copy.addEventListener('click', function () {
      if (!code || Date.now() >= expiresAt) return;
      var value = code;
      if (root.navigator.clipboard) root.navigator.clipboard.writeText(value).then(function () { if (value === code) say(tr('配对码已复制。', 'Pairing code copied.')); }, function () { say(tr('复制未完成，请选中配对码手动复制。', 'Copy failed. Select the code and copy it manually.'), true); });
      else { codeInput.focus(); codeInput.select(); say(tr('请复制已选中的配对码。', 'Copy the selected code.')); }
    }, { signal: aborter.signal });
    create.addEventListener('click', function () {
      if (disposed || busy || !server || !server.running || server.blocked || server.changing || pendingPair || !selection || !selection.size || !visible()) return;
      clearPair(true); var epoch = ++pairEpoch, grants = Array.from(selection); pairingDevices = new Set((server && server.devices || []).map(function (row) { return row.id; })); pendingPair = true; say(''); updateControls();
      lane(function () { return action('pair', { botIds: grants }); }).then(function (value) {
        if (disposed || epoch !== pairEpoch || !visible()) return;
        if (!/^np1_[A-Za-z0-9_-]{43}$/.test(value.code || '') || !Number.isSafeInteger(value.expiresAt) || value.expiresAt <= Date.now()) throw new Error('PAIR_INVALID');
        pendingPair = false; code = value.code; expiresAt = value.expiresAt; codeInput.value = code; pairing.hidden = false; tickExpiry();
      }).catch(function (error) { if (!disposed && epoch === pairEpoch) { clearPair(true); say(friendly(error), true); } }).finally(function () { if (!disposed && epoch === pairEpoch) { pendingPair = false; updateControls(); } });
    }, { signal: aborter.signal });
    function visibility() { if (!visible()) clearPair(true); else refresh(); }
    root.document.addEventListener('visibilitychange', visibility, { signal: aborter.signal });
    observer = new MutationObserver(function () { if (!visible() && (pendingPair || code)) clearPair(true); });
    var ancestor = target; while (ancestor && ancestor !== root.document) { observer.observe(ancestor, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] }); ancestor = ancestor.parentElement; }
    if (bridge && typeof bridge.onNativeVoiceChanged === 'function') off = bridge.onNativeVoiceChanged(function (value) { sequence++; render(value); });
    poll = root.setInterval(function () { if (!disposed && visible()) refresh(); }, 2500);
    function dispose() { if (disposed) return; clearPair(true); disposed = true; sequence++; aborter.abort(); observer.disconnect(); if (off) off(); root.clearInterval(poll); mounted.delete(target); }
    mounted.set(target, dispose); refresh(); return dispose;
  }
  root.OpenBotNativeVoice = { mount: mount };
})(window);
