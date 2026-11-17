(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenBotAppUse = api;
})(typeof window === 'object' ? window : null, function (root) {
  'use strict';

  var instanceSequence = 0;
  var WECHAT_BUNDLE = 'com.tencent.xinWeChat';

  function tr(zh, en) {
    var i18n = root && root.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en) : zh;
  }

  function node(doc, tag, className, text) {
    var el = doc.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function cleanText(value, max) {
    if (typeof value !== 'string') return '';
    return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 120);
  }

  function unsafeProductText(value) {
    return /(?:APP_USE|WECHAT)_[A-Z0-9_]+|(?:^|[\s(])\/(?:Users|Applications|Volumes|private|System|Library)\/|file:\/\/|\bcom\.[A-Za-z0-9._-]+|\b(?:bundle\s*id|target\s*id|window\s*(?:id|handle)|process\s*id|pid|runtime\s*(?:id|identifier)|provenance|authorization\s*id)\b/i.test(value);
  }

  function friendlyAppName(binding) {
    var bundleId = binding && binding.application && binding.application.bundleId;
    if (typeof bundleId === 'string' && bundleId.toLowerCase() === WECHAT_BUNDLE.toLowerCase() || binding && binding.adapter && binding.adapter.id === 'wechat') {
      return tr('微信', 'WeChat');
    }
    var label = cleanText(binding && binding.label, 100);
    if (label && label !== bundleId && !unsafeProductText(label)) return label;
    if (typeof bundleId !== 'string' || bundleId.length > 512 || /[\\/]|^file:/i.test(bundleId)) return tr('已绑定应用', 'Bound app');
    var part = bundleId.split(/[./]/).filter(Boolean).pop() || '';
    part = part.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!part || /^[0-9._-]+$/.test(part) || unsafeProductText(part)) return tr('已绑定应用', 'Bound app');
    return part.replace(/\b[a-z]/g, function (letter) { return letter.toUpperCase(); }).slice(0, 80);
  }

  function isWeChat(binding) {
    var bundleId = binding && binding.application && binding.application.bundleId;
    return typeof bundleId === 'string' && bundleId.toLowerCase() === WECHAT_BUNDLE.toLowerCase() ||
      !!(binding && binding.adapter && binding.adapter.id === 'wechat');
  }

  function errorCopy(error, action) {
    var code = error && typeof error.code === 'string' ? error.code : '';
    var message = cleanText(error && error.message, 240);
    if (code === 'WECHAT_COMPATIBILITY_UNVERIFIED') {
      return tr('微信仅支持被动只读；不支持观察窗口变化或操作应用。请选择“读取当前可见内容”后重试。',
        'WeChat supports passive read-only access only; window watching and app actions are unsupported. Choose “Read visible content” and try again.');
    }
    if (code === 'APP_USE_CAPABILITY_UNSUPPORTED') {
      return tr('所选应用不支持这项权限。请改选只读，或选择支持此权限的应用。',
        'The selected app does not support this access level. Choose read-only or an app that supports it.');
    }
    if (code === 'APP_USE_UNAVAILABLE' || code === 'APP_USE_MANAGEMENT_REQUIRED') {
      return tr('应用绑定管理暂不可用。', 'App binding management is currently unavailable.');
    }
    if (code === 'APP_USE_MANAGEMENT_BUSY') {
      if (action === 'stop_watch') return tr('此 Bot 的其他操作仍在结束。请刷新绑定列表后重试停止观察。',
        'Another operation for this Bot is still finishing. Refresh the bound app list before retrying watch stop.');
      return tr('此 Bot 的应用变更仍在处理中。请稍后重试。', 'An app change for this Bot is still finishing. Try again shortly.');
    }
    if (code === 'APP_USE_MANAGEMENT_CLOSED') {
      return tr('应用绑定管理正在关闭，请稍后重新打开。', 'App binding management is closing. Reopen it in a moment.');
    }
    if (code === 'MAC_COMPUTER_UNAVAILABLE') {
      return tr('应用访问暂不可用，请稍后重试。', 'App access is temporarily unavailable. Try again later.');
    }
    if (code === 'MAC_COMPUTER_PASSIVE_UNSUPPORTED') {
      return tr('此应用不支持只读访问。', 'This app does not support read-only access.');
    }
    if (code === 'MAC_COMPUTER_FUSED') {
      return tr('另一个应用访问请求仍在结束，请稍后重试。', 'Another app access request is still finishing. Try again shortly.');
    }
    if (code === 'AGENT_CLEANUP_FAILED') {
      if (action === 'stop_watch') return tr('观察清理未确认；面板保持打开。请刷新状态后重试停止。',
        'Watch cleanup was not confirmed; this panel stays open. Refresh its state before retrying stop.');
      return tr('无法确认应用变更已取消。此窗口保持打开；请重试取消。',
        'Could not confirm the app change was canceled. This panel stays open; retry cancellation.');
    }
    if (code === 'APP_USE_TARGET_UNAVAILABLE') {
      return tr('没有找到可绑定的应用窗口。请打开目标应用后重试。', 'No eligible app window was found. Open the app and try again.');
    }
    if (code === 'APP_USE_BINDING_BUSY') {
      return tr('当前 Bot 正在处理另一个应用操作。', 'Another app operation is already in progress for this Bot.');
    }
    if (code === 'APP_USE_BINDING_REVISION_MISMATCH' || code === 'APP_USE_BINDING_REVOKED') {
      return tr('此绑定已更新。请刷新列表后重试。', 'This binding has changed. Refresh the list and try again.');
    }
    if (code === 'DENIED' || code === 'APP_USE_APPROVAL_REQUIRED') {
      return action === 'bind' ? tr('绑定未获批准，未创建绑定。', 'The binding was not approved; no app was added.') : tr('操作未获批准。', 'The action was not approved.');
    }
    if (code === 'APP_USE_OPERATION_NOT_FOUND') return tr('当前没有需要取消的应用变更。', 'There is no app change to cancel.');
    if (action === 'receipts') return tr('无法读取发送记录。请刷新记录后重试。', 'Could not load Send records. Refresh records and try again.');
    if (action === 'receipt') return tr('无法读取这条记录。请刷新记录后重试。', 'Could not load this record. Refresh records and try again.');
    if (action === 'resolve_receipt') return tr('无法确认备注是否已保存。请刷新记录查看当前状态。', 'Could not confirm whether the note was saved. Refresh records to read the current state.');
    if (action === 'stop_watch') return tr('无法确认观察已停止。请刷新绑定列表查看状态；清理未确认前不要假定它已停止。',
      'Could not confirm the watch stopped. Refresh the bound app list; do not assume cleanup finished.');
    if (message && !unsafeProductText(message)) return message;
    if (action === 'list') return tr('无法读取已绑定应用。请稍后重试。', 'Could not load bound apps. Try again.');
    if (action === 'stop') return tr('无法确认应用变更已取消。此窗口保持打开；请重试取消。', 'Could not confirm the app change was canceled. This panel stays open; retry cancellation.');
    if (action === 'revoke') return tr('无法移除此应用。请刷新列表后重试。', 'Could not remove this app. Refresh the list and try again.');
    return tr('无法绑定应用。请重试。', 'Could not bind the app. Try again.');
  }

  function validBinding(binding) {
    return !!binding && typeof binding === 'object' && typeof binding.bindingId === 'string' && binding.bindingId.length > 0 &&
      Number.isSafeInteger(binding.revision) && binding.revision > 0 && binding.application &&
      typeof binding.application.bundleId === 'string' && typeof binding.status === 'string';
  }

  function validWatch(watch) {
    function nullableClock(value) { return value === null || typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER; }
    return !!watch && typeof watch === 'object' &&
      typeof watch.watchRef === 'string' && /^app-use-watch:[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(watch.watchRef) &&
      Number.isSafeInteger(watch.revision) && watch.revision > 0 &&
      ['active', 'paused', 'completed', 'canceled', 'cleanup_failed'].indexOf(watch.state) >= 0 &&
      ['window', 'conversation'].indexOf(watch.scopeKind) >= 0 &&
      typeof watch.reason === 'string' && watch.reason.length <= 128 &&
      ['attempts', 'successfulTicks', 'skippedTicks'].every(function (field) {
        return Number.isSafeInteger(watch[field]) && watch[field] >= 0;
      }) && nullableClock(watch.asOf) && nullableClock(watch.remainingMilliseconds) &&
      nullableClock(watch.nextDue) && nullableClock(watch.pausedSince) && typeof watch.expiryUnchecked === 'boolean';
  }

  function validIntentRef(ref) {
    return !!ref && typeof ref === 'object' && Number.isSafeInteger(ref.journalEpoch) && ref.journalEpoch > 0 &&
      typeof ref.requestId === 'string' && /^app-use:[0-9]+:[A-Za-z0-9_-]{1,128}$/.test(ref.requestId) &&
      typeof ref.digest === 'string' && /^[a-f0-9]{64}$/i.test(ref.digest);
  }

  function sameIntentRef(left, right) {
    return validIntentRef(left) && validIntentRef(right) && left.journalEpoch === right.journalEpoch &&
      left.requestId === right.requestId && left.digest === right.digest;
  }

  function intentKey(ref) {
    return validIntentRef(ref) ? [ref.journalEpoch, ref.requestId, ref.digest].join('\u0000') : '';
  }

  function validReceiptSummary(receipt) {
    return !!receipt && typeof receipt === 'object' && validIntentRef(receipt.intentRef) && typeof receipt.status === 'string';
  }

  function validReceiptDetail(receipt, expectedRef) {
    return !!receipt && typeof receipt === 'object' && sameIntentRef(receipt.intentRef, expectedRef) &&
      typeof receipt.status === 'string' && typeof receipt.body === 'string' &&
      (receipt.userResolution == null || typeof receipt.userResolution === 'object' &&
        ['dismissed', 'user_verified_observation'].indexOf(receipt.userResolution.kind) >= 0 &&
        typeof receipt.userResolution.statement === 'string');
  }

  function receiptStatusLabel(status) {
    var labels = {
      unknown: tr('结果未知', 'Unknown'),
      prepared: tr('待处理', 'Prepared'),
      dispatching: tr('处理中', 'In progress'),
      dispatched_unconfirmed: tr('结果未确认', 'Unconfirmed'),
      observed_in_window: tr('窗口中已观察', 'Observed in window'),
      blocked: tr('已阻止', 'Blocked'),
      denied: tr('已拒绝', 'Denied'),
      rejected: tr('已拒绝', 'Rejected'),
      failed: tr('失败', 'Failed'),
      canceled: tr('已取消', 'Canceled'),
      expired: tr('已过期', 'Expired'),
      invalidated: tr('已失效', 'Invalidated')
    };
    return Object.prototype.hasOwnProperty.call(labels, status) ? labels[status] : tr('状态未知', 'Status unknown');
  }

  function displayDate(value) {
    var date = typeof value === 'number' && Number.isFinite(value) ? new Date(value) :
      typeof value === 'string' ? new Date(value) : null;
    if (!date || !Number.isFinite(date.getTime())) return '';
    try { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date); }
    catch (_) { return date.toLocaleString(); }
  }

  function create(options) {
    options = options || {};
    var doc = options.document || root && root.document;
    if (!doc) return { open: function () {}, onBotChanged: function () {}, close: function () {} };
    var instanceId = ++instanceSequence;
    var dialog = node(doc, 'dialog', 'app-use-dialog');
    dialog.id = 'app-use-dialog-' + instanceId;
    dialog.setAttribute('aria-labelledby', 'app-use-title-' + instanceId);
    dialog.setAttribute('aria-describedby', 'app-use-note-' + instanceId);

    var panel = node(doc, 'section', 'app-use-panel');
    var header = node(doc, 'header', 'app-use-header');
    var heading = node(doc, 'div', 'app-use-heading');
    var title = node(doc, 'h2', '', tr('绑定应用', 'Bound apps'));
    title.id = 'app-use-title-' + instanceId;
    var botName = node(doc, 'p', 'app-use-bot-name');
    var closeButton = node(doc, 'button', 'app-use-close', '×');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', tr('关闭应用绑定', 'Close bound apps'));
    heading.append(title, botName);
    header.append(heading, closeButton);

    var note = node(doc, 'p', 'app-use-note', tr(
      '绑定仅记录此 Bot 可使用的应用；每次任务仍需当前授权。',
      'A binding records which app this Bot may use. Each task still needs approval.'));
    note.id = 'app-use-note-' + instanceId;
    note.setAttribute('role', 'note');
    var wechatNote = node(doc, 'p', 'app-use-wechat-note', tr(
      '微信：仅被动只读；不支持观察窗口变化或操作应用。账号和会话未核实，发送不可用。',
      'WeChat: passive read-only only. Window watching and app actions are unsupported; the account and conversation are unverified, so sending is unavailable.'));
    wechatNote.hidden = true;
    var status = node(doc, 'p', 'app-use-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    var list = node(doc, 'div', 'app-use-list');
    list.setAttribute('role', 'list');
    list.setAttribute('aria-label', tr('已绑定应用', 'Bound apps'));

    var access = node(doc, 'fieldset', 'app-use-access');
    var accessLegend = node(doc, 'legend', '', tr('新绑定的访问权限', 'Access for new bindings'));
    function accessChoice(value, labelText, detailText, checked) {
      var label = node(doc, 'label', 'app-use-access-choice');
      var radio = node(doc, 'input');
      radio.type = 'radio'; radio.name = 'app-use-access-' + instanceId; radio.value = value; radio.checked = !!checked;
      var copy = node(doc, 'span', 'app-use-access-copy');
      copy.append(node(doc, 'strong', '', labelText), node(doc, 'span', '', detailText));
      label.append(radio, copy);
      return { label: label, radio: radio };
    }
    var readChoice = accessChoice('read_visible', tr('只读', 'Read only'),
      tr('读取当前可见内容', 'Read visible content'), true);
    var actChoice = accessChoice('act', tr('读取并操作', 'Read and interact'),
      tr('仅适用于受支持的应用；微信不支持操作权限。', 'For supported apps only; WeChat does not support app actions.'), false);
    var watchChoice = accessChoice('watch_visible', tr('读取并观察窗口变化', 'Read and watch visible window changes'),
      tr('观察窗口中的可见变化；不判断消息状态。微信暂不支持。', 'Observe visible window changes only; this does not determine message status. Not supported for WeChat.'), false);
    access.append(accessLegend, readChoice.label, actChoice.label, watchChoice.label);

    var actionRow = node(doc, 'div', 'app-use-actions');
    var bindButton = node(doc, 'button', 'btn primary app-use-bind', tr('绑定应用…', 'Bind app…'));
    bindButton.type = 'button';
    var refreshButton = node(doc, 'button', 'btn app-use-refresh', tr('刷新', 'Refresh'));
    refreshButton.type = 'button';
    actionRow.append(bindButton, refreshButton);
    var cancelButton = node(doc, 'button', 'btn danger app-use-cancel-operation', tr('取消应用变更', 'Cancel app change'));
    cancelButton.type = 'button';
    cancelButton.hidden = true;
    var footer = node(doc, 'footer', 'app-use-footer');
    var doneButton = node(doc, 'button', 'btn app-use-done', tr('完成', 'Done'));
    doneButton.type = 'button';
    footer.append(cancelButton, doneButton);

    panel.append(header, note, wechatNote, status, list, access, actionRow, footer);
    dialog.appendChild(panel);
    doc.body.appendChild(dialog);

    var state = {
      open: false, epoch: 0, botId: '', botName: '', opener: null,
      bindings: null, operation: null, error: '', message: '', unavailable: false,
      confirming: null, receiptPanel: null, contextStale: false, needsStop: false, needsStopAction: '', closeAfterStop: false,
      closeAfterWatchStop: false, yieldedApproval: null
    };
    var stopPromise = null;
    var seenBindingApprovalIds = Object.create(null);
    var seenBindingApprovalOrder = [];

    function rememberBindingApproval(id) {
      seenBindingApprovalIds[id] = true;
      seenBindingApprovalOrder.push(id);
      if (seenBindingApprovalOrder.length > 32) {
        var expiredId = seenBindingApprovalOrder.shift();
        delete seenBindingApprovalIds[expiredId];
      }
    }

    function activeBotId() {
      if (typeof options.getActiveBotId === 'function') return String(options.getActiveBotId() || '');
      if (typeof options.getActiveBot === 'function') {
        var active = options.getActiveBot();
        return active && active.id ? String(active.id) : '';
      }
      return state.botId;
    }

    function apiAvailable() {
      return !!(root && root.grokbot && typeof root.grokbot.appUseManage === 'function');
    }

    function callApi(args) {
      if (!apiAvailable()) return Promise.reject(Object.assign(new Error('APP_USE_UNAVAILABLE'), { code: 'APP_USE_UNAVAILABLE' }));
      try { return Promise.resolve(root.grokbot.appUseManage(args)); }
      catch (error) { return Promise.reject(error); }
    }

    function isCurrent(epoch, botId) {
      return state.open && state.epoch === epoch && state.botId === botId;
    }

    function isOwnerBindingApproval(approval) {
      return !!approval && approval.name === 'app_use' && approval.title === '绑定应用' &&
        typeof approval.id === 'string' && approval.id.length > 0 && typeof approval.botId === 'string' && approval.botId.length > 0 &&
        typeof approval.runId === 'string' && approval.runId.indexOf('app-use-management-') === 0;
    }

    function approvalMatches(yielded, event) {
      return !!yielded && !!event && event.id === yielded.id && event.botId === yielded.botId && event.runId === yielded.runId;
    }

    function finishBindingApproval(operation) {
      var yielded = state.yieldedApproval;
      if (!yielded || yielded.operation !== operation) return false;
      var canResume = state.open && state.operation === operation && state.epoch === yielded.epoch &&
        state.botId === yielded.botId && !state.contextStale && activeBotId() === yielded.botId && dialog.isConnected;
      state.yieldedApproval = null;
      if (canResume && !dialog.open) dialog.showModal();
      return true;
    }

    function finishStoppedBindingApproval(allowStaleContext) {
      var yielded = state.yieldedApproval;
      if (!yielded) return false;
      var canResume = state.open && state.botId === yielded.botId &&
        (allowStaleContext === true || !state.contextStale && activeBotId() === yielded.botId) && dialog.isConnected;
      state.yieldedApproval = null;
      if (canResume && !dialog.open) dialog.showModal();
      return true;
    }

    function yieldForBindingApproval(approval) {
      if (!isOwnerBindingApproval(approval) || seenBindingApprovalIds[approval.id]) return false;
      rememberBindingApproval(approval.id);
      var operation = state.operation;
      if (!state.open || state.contextStale || !operation || operation.action !== 'bind' ||
          state.yieldedApproval || operation.bindingApprovalId || approval.botId !== state.botId || activeBotId() !== state.botId) return false;
      operation.bindingApprovalId = approval.id;
      state.yieldedApproval = {
        id: approval.id, botId: approval.botId, runId: approval.runId,
        epoch: state.epoch, operation: operation
      };
      if (dialog.open) dialog.close();
      return true;
    }

    function resumeForBindingApproval(event) {
      var yielded = state.yieldedApproval;
      if (!approvalMatches(yielded, event) || state.operation !== yielded.operation ||
          state.epoch !== yielded.epoch || state.contextStale || !state.open ||
          state.botId !== yielded.botId || activeBotId() !== yielded.botId || !dialog.isConnected) return false;
      state.yieldedApproval = null;
      if (!dialog.open) dialog.showModal();
      return true;
    }

    function cancelForBindingApproval(approval) {
      var yielded = state.yieldedApproval;
      if (!approvalMatches(yielded, approval)) return false;
      if (state.operation === yielded.operation && state.open && state.epoch === yielded.epoch &&
          !state.contextStale && activeBotId() === yielded.botId) {
        stopOperation(false);
        return true;
      }
      return !!(state.operation && state.operation.action === 'stop' && state.needsStopAction === 'bind');
    }

    function currentOperation(operation) {
      if (!operation || !isCurrent(operation.epoch, operation.botId) || state.operation !== operation) return false;
      var hasBotGetter = typeof options.getActiveBotId === 'function' || typeof options.getActiveBot === 'function';
      if (operation.action !== 'stop' && hasBotGetter && activeBotId() !== operation.botId) {
        if (operation.action === 'stop_watch') {
          state.contextStale = true;
          state.closeAfterWatchStop = true;
          state.message = tr('正在等待观察清理完成，然后关闭此 Bot 的面板…', 'Waiting for watch cleanup to finish before closing this Bot panel…');
          state.error = '';
          render();
          return true;
        }
        onBotChanged(activeBotId());
        return false;
      }
      return true;
    }

    function setStatus(text, isError) {
      state.message = text || '';
      state.error = isError ? state.message : '';
      render();
    }

    function capabilities() {
      if (actChoice.radio.checked) return ['read_visible', 'act'];
      if (watchChoice.radio.checked) return ['read_visible', 'watch_visible'];
      return ['read_visible'];
    }

    function capabilityText(binding) {
      var caps = Array.isArray(binding.capabilities) ? binding.capabilities : [];
      var labels = [];
      if (caps.indexOf('read_visible') >= 0) labels.push(tr('读取当前可见内容', 'Read visible content'));
      if (caps.indexOf('act') >= 0) labels.push(tr('操作应用', 'App interaction'));
      if (caps.indexOf('watch_visible') >= 0) labels.push(tr('观察可见窗口变化', 'Observe visible window changes'));
      return labels.length ? labels.join(' · ') : tr('无可用权限', 'No access available');
    }

    function watchRows(binding) {
      if (!Array.isArray(binding.watches)) return [];
      var seen = Object.create(null);
      return binding.watches.filter(function (watch) {
        if (!validWatch(watch) || seen[watch.watchRef]) return false;
        seen[watch.watchRef] = true;
        return true;
      }).slice(0, 8);
    }

    function watchProjectionInvalid(binding) {
      if (binding.watches === undefined) return false;
      if (!Array.isArray(binding.watches) || binding.watches.length > 8) return true;
      var seen = Object.create(null);
      return binding.watches.some(function (watch) {
        if (!validWatch(watch) || seen[watch.watchRef]) return true;
        seen[watch.watchRef] = true;
        return false;
      });
    }

    function watchStateLabel(watch) {
      var labels = {
        active: tr('上次报告：活动中', 'Last reported: active'),
        paused: tr('上次报告：已暂停', 'Last reported: paused'),
        completed: tr('已完成', 'Completed'),
        canceled: tr('已取消', 'Canceled'),
        cleanup_failed: tr('清理未确认', 'Cleanup not confirmed')
      };
      return labels[watch.state] || tr('状态未知', 'Status unknown');
    }

    function watchReasonLabel(reason) {
      var labels = {
        APP_USE_WATCH_AUTHORITY_REVOKED: tr('授权已撤销', 'Authority was revoked'),
        APP_USE_WATCH_BUSY: tr('其他操作正忙', 'Another operation was busy'),
        APP_USE_WATCH_CANCELED: tr('观察已取消', 'Watch was canceled'),
        APP_USE_WATCH_CLEANUP_FAILED: tr('清理未确认', 'Cleanup was not confirmed'),
        APP_USE_WATCH_CLOCK_INVALID: tr('计时状态不可用', 'Clock state is unavailable'),
        APP_USE_WATCH_EXPIRED: tr('观察时限已结束', 'Watch duration ended'),
        APP_USE_WATCH_IDENTITY_CHANGED: tr('窗口身份已变化', 'Window identity changed'),
        APP_USE_WATCH_IDENTITY_UNVERIFIED: tr('窗口身份未核实', 'Window identity was not verified'),
        APP_USE_WATCH_MAX_ATTEMPTS: tr('已达到尝试次数上限', 'Attempt limit reached'),
        APP_USE_WATCH_NOT_DUE: tr('尚未到下次观察时间', 'Not due for another observation'),
        APP_USE_WATCH_PAUSED: tr('窗口暂不可观察', 'Window is temporarily unavailable'),
        APP_USE_WATCH_PAUSE_EXPIRED: tr('暂停时间已结束', 'Pause limit reached'),
        APP_USE_WATCH_STOPPED: tr('由用户停止', 'Stopped by the owner'),
        APP_USE_WATCH_TARGET_INVALID: tr('窗口目标已不可用', 'Window target is unavailable'),
        APP_USE_WATCH_TERMINAL: tr('观察已结束', 'Watch has ended'),
        INCOMPLETE_OCR: tr('可见内容可能不完整', 'Visible content may be incomplete')
      };
      return Object.prototype.hasOwnProperty.call(labels, reason)
        ? labels[reason]
        : tr('原因不可用', 'Reason unavailable');
    }

    function watchScopeLabel(scopeKind) {
      return scopeKind === 'conversation'
        ? tr('会话观察', 'Conversation watch')
        : tr('窗口观察', 'Window watch');
    }

    function watchSnapshotText(value) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return '';
      return tr('上次状态样本已记录', 'Last status sample recorded');
    }

    function watchRemainingText(value) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return '';
      var seconds = Math.ceil(value / 1000);
      return tr('上次核查时剩余约 ' + seconds + ' 秒', 'About ' + seconds + ' seconds remained at the last check');
    }

    function canStopWatch(binding, watch) {
      return canReviewBinding(binding) && validWatch(watch) &&
        ['active', 'paused', 'cleanup_failed'].indexOf(watch.state) >= 0;
    }

    function replaceWatchProjection(bindingId, nextWatch) {
      if (!state.bindings || !validWatch(nextWatch)) return;
      state.bindings = state.bindings.map(function (binding) {
        if (binding.bindingId !== bindingId || !Array.isArray(binding.watches)) return binding;
        return Object.assign({}, binding, {
          watches: binding.watches.map(function (watch) {
            return watch && watch.watchRef === nextWatch.watchRef ? nextWatch : watch;
          })
        });
      });
    }

    function bindingStatus(binding) {
      if (binding.status === 'active') return tr('已绑定', 'Bound');
      if (binding.status === 'revoked') return tr('已移除', 'Removed');
      if (binding.status === 'unavailable' || binding.status === 'error') return tr('暂不可用', 'Unavailable');
      return tr('状态未知', 'Status unknown');
    }

    function canReviewBinding(binding) {
      return binding && (binding.status === 'active' || binding.status === 'revoked');
    }

    function isCurrentReceiptPanel(bindingId, revision) {
      return !!state.receiptPanel && state.receiptPanel.bindingId === bindingId && state.receiptPanel.revision === revision;
    }

    function receiptRequest(binding, action, intentRef, extra) {
      var args = {
        action: action,
        botId: state.botId,
        bindingId: binding.bindingId,
        revision: binding.revision
      };
      if (validIntentRef(intentRef)) {
        args.journalEpoch = intentRef.journalEpoch;
        args.requestId = intentRef.requestId;
        args.digest = intentRef.digest;
      }
      return Object.assign(args, extra || {});
    }

    function clearReceiptForm(panel) {
      if (!panel) return;
      panel.selectedRef = null;
      panel.selectedSummary = null;
      panel.receipt = null;
      panel.resolution = '';
      panel.statement = '';
      panel.resolutionUncertain = false;
    }

    function receiptFailure(action, error) {
      return errorCopy(error || {}, action);
    }

    function staleReceiptBinding(operation) {
      state.operation = null;
      state.receiptPanel = null;
      state.message = tr('此绑定已更新。记录选择和备注表单已清除；正在刷新绑定列表。',
        'This binding has changed. The record selection and note form were cleared; refreshing the bound app list.');
      state.error = '';
      render();
      loadBindings(true);
      return operation;
    }

    function handleReceiptFailure(operation, action, error) {
      if (!currentOperation(operation)) return;
      var normalized = error || {};
      if (normalized.code === 'APP_USE_BINDING_REVISION_MISMATCH' || normalized.code === 'APP_USE_BINDING_REVOKED') {
        staleReceiptBinding(operation);
        return;
      }
      markApiUnavailable(normalized);
      state.operation = null;
      if (action === 'resolve_receipt' && normalized.code === 'APP_USE_RESOLUTION_CONFLICT' && state.receiptPanel) {
        clearReceiptForm(state.receiptPanel);
        state.receiptPanel.needsExplicitRefresh = true;
        state.receiptPanel.error = tr('此记录已变化。请刷新发送记录后重新查看。', 'This record has changed. Refresh Send records before reviewing it again.');
        state.message = '';
        state.error = '';
        render();
        return;
      }
      if (state.receiptPanel) {
        state.receiptPanel.error = receiptFailure(action, normalized);
        if (action === 'resolve_receipt') {
          state.receiptPanel.resolutionUncertain = true;
          state.receiptPanel.needsExplicitRefresh = true;
        }
      }
      state.message = '';
      state.error = '';
      render();
    }

    function staleWatchBinding(operation) {
      state.operation = null;
      if (state.receiptPanel && state.receiptPanel.bindingId === operation.bindingId) state.receiptPanel = null;
      state.message = tr('此绑定已更新。正在刷新绑定列表；没有重试停止请求。',
        'This binding has changed. Refreshing the bound app list; the stop request was not retried.');
      state.error = '';
      render();
      var closeAfter = state.closeAfterWatchStop;
      state.closeAfterWatchStop = false;
      loadBindings(true).then(function () {
        if (closeAfter && state.open && state.botId === operation.botId) closeNow();
      });
    }

    function stopWatch(binding, watch) {
      if (!state.open || state.operation || state.contextStale || state.unavailable || !apiAvailable() ||
        !validBinding(binding) || !canStopWatch(binding, watch)) return Promise.resolve();
      var operation = beginOperation('stop_watch', {
        bindingId: binding.bindingId,
        revision: binding.revision,
        watchRef: watch.watchRef
      });
      var request = {
        action: 'stop_watch',
        botId: operation.botId,
        bindingId: binding.bindingId,
        revision: binding.revision,
        watchRef: watch.watchRef
      };
      return callApi(request).then(function (result) {
        if (!currentOperation(operation)) return;
        var nextWatch = result && result.watch;
        if (result && (result.code === 'APP_USE_BINDING_REVISION_MISMATCH' || result.code === 'APP_USE_BINDING_REVOKED')) {
          staleWatchBinding(operation);
          return;
        }
        if (validWatch(nextWatch)) replaceWatchProjection(binding.bindingId, nextWatch);
        if (!result || result.ok !== true || !validWatch(nextWatch) ||
          nextWatch.watchRef !== operation.watchRef || nextWatch.state === 'cleanup_failed' ||
          nextWatch.state === 'active' || nextWatch.state === 'paused') {
          state.operation = null;
          state.closeAfterWatchStop = false;
          state.message = nextWatch && nextWatch.state === 'cleanup_failed'
            ? tr('清理未确认；观察没有标记为已停止。可重试停止或刷新状态。', 'Cleanup was not confirmed; the watch was not marked stopped. Retry stop or refresh its state.')
            : errorCopy({ code: result && result.code, message: result && result.message }, 'stop_watch');
          state.error = state.message;
          render();
          return;
        }
        state.operation = null;
        state.message = nextWatch.state === 'canceled'
          ? tr('观察已停止。正在刷新绑定列表…', 'Watch stopped. Refreshing the bound app list…')
          : tr('观察已结束。正在刷新绑定列表…', 'Watch has ended. Refreshing the bound app list…');
        state.error = '';
        render();
        var closeAfter = state.closeAfterWatchStop;
        state.closeAfterWatchStop = false;
        loadBindings(true).then(function () {
          if (closeAfter && state.open && state.botId === operation.botId) closeNow();
        });
      }).catch(function (error) {
        if (!currentOperation(operation)) return;
        if (error && (error.code === 'APP_USE_BINDING_REVISION_MISMATCH' || error.code === 'APP_USE_BINDING_REVOKED')) {
          staleWatchBinding(operation);
          return;
        }
        if (error && validWatch(error.watch)) replaceWatchProjection(binding.bindingId, error.watch);
        state.operation = null;
        state.closeAfterWatchStop = false;
        state.message = error && error.watch && error.watch.state === 'cleanup_failed'
          ? tr('清理未确认；观察没有标记为已停止。请重试停止或刷新状态。', 'Cleanup was not confirmed; the watch was not marked stopped. Retry stop or refresh its state.')
          : errorCopy(error, 'stop_watch');
        state.error = state.message;
        render();
      });
    }

    function statusHasResolution(summary, receipt) {
      return !!(summary && summary.hasUserResolution || receipt && receipt.userResolution);
    }

    function canSubmitReceipt(panel, receipt) {
      return !!panel && !!receipt && receipt.status === 'unknown' && !statusHasResolution(panel.selectedSummary, receipt) &&
        ['dismissed', 'user_verified_observation'].indexOf(panel.resolution) >= 0 &&
        typeof panel.statement === 'string' && panel.statement.trim().length > 0 && panel.statement.length <= 1000 &&
        !panel.resolutionUncertain && !panel.needsExplicitRefresh && !state.operation && !state.contextStale && !state.unavailable && apiAvailable();
    }

    function loadReceiptPage(binding, cursor, append) {
      if (!state.open || state.contextStale || state.operation || !apiAvailable() || state.unavailable || !validBinding(binding) || !isCurrentReceiptPanel(binding.bindingId, binding.revision)) return Promise.resolve();
      var panelState = state.receiptPanel;
      panelState.error = '';
      if (!append) {
        panelState.receipts = [];
        panelState.nextCursor = null;
        panelState.total = 0;
        panelState.loaded = false;
        panelState.needsExplicitRefresh = false;
        panelState.resolutionUncertain = false;
        panelState.notice = '';
        clearReceiptForm(panelState);
      }
      var operation = beginOperation('receipts', { bindingId: binding.bindingId, revision: binding.revision });
      panelState.loading = true;
      var args = receiptRequest(binding, 'receipts');
      if (cursor !== null && cursor !== undefined) args.cursor = cursor;
      render();
      return callApi(args).then(function (result) {
        if (!currentOperation(operation) || !isCurrentReceiptPanel(operation.bindingId, operation.revision)) return;
        if (!result || result.ok !== true || !Array.isArray(result.receipts) ||
          !(result.nextCursor === null || typeof result.nextCursor === 'string') || !Number.isSafeInteger(result.total) || result.total < 0 ||
          result.receipts.some(function (item) { return !validReceiptSummary(item); })) {
          panelState.loading = false;
          handleReceiptFailure(operation, 'receipts', { code: result && result.code, message: result && result.message });
          return;
        }
        var seen = Object.create(null);
        var receipts = append ? panelState.receipts.slice() : [];
        receipts.forEach(function (item) { seen[intentKey(item.intentRef)] = true; });
        result.receipts.forEach(function (item) {
          var key = intentKey(item.intentRef);
          if (!seen[key]) { seen[key] = true; receipts.push(item); }
        });
        state.operation = null;
        panelState.loading = false;
        panelState.loaded = true;
        panelState.receipts = receipts;
        panelState.nextCursor = result.nextCursor;
        panelState.total = result.total;
        panelState.error = '';
        render();
      }).catch(function (error) {
        if (!currentOperation(operation) || !isCurrentReceiptPanel(operation.bindingId, operation.revision)) return;
        panelState.loading = false;
        handleReceiptFailure(operation, 'receipts', error);
      });
    }

    function openReceipts(binding) {
      if (!state.open || state.operation || state.contextStale || state.unavailable || !apiAvailable() || !validBinding(binding) || !canReviewBinding(binding)) return;
      if (isCurrentReceiptPanel(binding.bindingId, binding.revision)) {
        state.receiptPanel = null;
        state.message = '';
        state.error = '';
        render();
        return;
      }
      state.confirming = null;
      state.message = '';
      state.error = '';
      state.receiptPanel = {
        bindingId: binding.bindingId,
        revision: binding.revision,
        receipts: [],
        nextCursor: null,
        total: 0,
        loaded: false,
        loading: false,
        selectedRef: null,
        selectedSummary: null,
        receipt: null,
        resolution: '',
        statement: '',
        needsExplicitRefresh: false,
        resolutionUncertain: false,
        notice: '',
        error: ''
      };
      render();
      loadReceiptPage(binding, null, false);
    }

    function selectReceipt(binding, summary) {
      var panelState = state.receiptPanel;
      if (!state.open || state.operation || !panelState || !isCurrentReceiptPanel(binding.bindingId, binding.revision) || !validReceiptSummary(summary)) return;
      clearReceiptForm(panelState);
      panelState.selectedRef = summary.intentRef;
      panelState.selectedSummary = summary;
      panelState.error = '';
      var operation = beginOperation('receipt', { bindingId: binding.bindingId, revision: binding.revision, intentRef: summary.intentRef });
      return callApi(receiptRequest(binding, 'receipt', summary.intentRef)).then(function (result) {
        if (!currentOperation(operation) || !isCurrentReceiptPanel(operation.bindingId, operation.revision) ||
          !sameIntentRef(panelState.selectedRef, operation.intentRef)) return;
        if (!result || result.ok !== true || !validReceiptDetail(result.receipt, operation.intentRef)) {
          handleReceiptFailure(operation, 'receipt', { code: result && result.code, message: result && result.message });
          return;
        }
        state.operation = null;
        panelState.receipt = result.receipt;
        panelState.error = '';
        render();
      }).catch(function (error) {
        if (!currentOperation(operation) || !isCurrentReceiptPanel(operation.bindingId, operation.revision)) return;
        handleReceiptFailure(operation, 'receipt', error);
      });
    }

    function resolveReceipt(binding) {
      var panelState = state.receiptPanel;
      var receipt = panelState && panelState.receipt;
      if (!canSubmitReceipt(panelState, receipt) || !validBinding(binding) || !sameIntentRef(panelState.selectedRef, receipt.intentRef)) return;
      var resolution = panelState.resolution;
      var statement = panelState.statement;
      var intentRef = panelState.selectedRef;
      panelState.error = '';
      var operation = beginOperation('resolve_receipt', {
        bindingId: binding.bindingId,
        revision: binding.revision,
        intentRef: intentRef
      });
      return callApi(receiptRequest(binding, 'resolve_receipt', intentRef, { resolution: resolution, statement: statement })).then(function (result) {
        if (!currentOperation(operation) || !isCurrentReceiptPanel(operation.bindingId, operation.revision) ||
          !sameIntentRef(panelState.selectedRef, operation.intentRef)) return;
        if (!result || result.ok !== true || !validReceiptDetail(result.receipt, operation.intentRef)) {
          handleReceiptFailure(operation, 'resolve_receipt', { code: result && result.code, message: result && result.message });
          return;
        }
        state.operation = null;
        panelState.receipt = result.receipt;
        panelState.resolution = '';
        panelState.statement = '';
        panelState.needsExplicitRefresh = false;
        panelState.resolutionUncertain = false;
        panelState.notice = '';
        panelState.error = '';
        panelState.receipts = panelState.receipts.map(function (item) {
          return sameIntentRef(item.intentRef, result.receipt.intentRef) ? Object.assign({}, item, { hasUserResolution: !!result.receipt.userResolution, status: result.receipt.status }) : item;
        });
        state.message = result.receipt.status === 'unknown' && result.receipt.userResolution
          ? tr('备注已记录；结果仍为未知。', 'The note was recorded; the result remains unknown.')
          : tr('记录已更新。请刷新记录确认当前状态。', 'The record response was received. Refresh records to confirm its current state.');
        state.error = '';
        render();
      }).catch(function (error) {
        if (!currentOperation(operation) || !isCurrentReceiptPanel(operation.bindingId, operation.revision)) return;
        handleReceiptFailure(operation, 'resolve_receipt', error);
      });
    }

    function recordedLabel(value) {
      var label = cleanText(value, 160);
      return label && !unsafeProductText(label) ? label : '';
    }

    function makeReceiptSummary(binding, summary, panelState) {
      var item = node(doc, 'div', 'app-use-receipt-item');
      item.setAttribute('role', 'listitem');
      var button = node(doc, 'button', 'app-use-receipt-summary');
      button.type = 'button';
      var selected = sameIntentRef(panelState.selectedRef, summary.intentRef);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      var main = node(doc, 'span', 'app-use-receipt-summary-main');
      main.appendChild(node(doc, 'span', 'app-use-receipt-status', receiptStatusLabel(summary.status)));
      if (summary.hasUserResolution) main.appendChild(node(doc, 'span', 'app-use-receipt-note-mark', tr('已记录人工备注', 'Human note recorded')));
      var date = displayDate(summary.updatedAt || summary.createdAt);
      var time = node(doc, 'span', 'app-use-receipt-time', date);
      button.append(main, time);
      button.disabled = !!state.operation || panelState.needsExplicitRefresh || state.contextStale || state.unavailable || !apiAvailable();
      button.addEventListener('click', function () { selectReceipt(binding, summary); });
      item.appendChild(button);
      return item;
    }

    function makeReceiptPanel(binding) {
      var panelState = state.receiptPanel;
      if (!panelState || !isCurrentReceiptPanel(binding.bindingId, binding.revision)) return null;
      var section = node(doc, 'section', 'app-use-receipts');
      section.setAttribute('aria-label', tr('发送记录', 'Send records'));
      var head = node(doc, 'div', 'app-use-receipts-head');
      head.appendChild(node(doc, 'h3', 'app-use-receipts-title', tr('发送记录', 'Send records')));
      var controls = node(doc, 'div', 'app-use-receipts-controls');
      var refreshRecords = node(doc, 'button', 'btn app-use-refresh-receipts', tr('刷新记录', 'Refresh records'));
      refreshRecords.type = 'button';
      refreshRecords.disabled = !!state.operation || state.contextStale || state.unavailable || !apiAvailable();
      refreshRecords.addEventListener('click', function () { loadReceiptPage(binding, null, false); });
      var hideRecords = node(doc, 'button', 'btn app-use-hide-receipts', tr('收起', 'Hide'));
      hideRecords.type = 'button';
      hideRecords.disabled = !!state.operation;
      hideRecords.addEventListener('click', function () {
        state.receiptPanel = null;
        state.message = '';
        state.error = '';
        render();
      });
      controls.append(refreshRecords, hideRecords);
      head.appendChild(controls);
      section.appendChild(head);

      if (panelState.notice) {
        var notice = node(doc, 'p', 'app-use-receipts-notice', panelState.notice);
        notice.setAttribute('role', 'status');
        section.appendChild(notice);
      }

      if (panelState.error) {
        var error = node(doc, 'p', 'app-use-receipts-error', panelState.error);
        error.setAttribute('role', 'status');
        section.appendChild(error);
      } else if (!panelState.loaded) {
        if (!panelState.notice) section.appendChild(node(doc, 'p', 'app-use-receipts-empty', tr('正在读取发送记录…', 'Loading Send records…')));
      } else if (!panelState.receipts.length) {
        section.appendChild(node(doc, 'p', 'app-use-receipts-empty', tr('没有发送记录。', 'No Send records.')));
      } else {
        var count = node(doc, 'p', 'app-use-receipts-count', tr(
          '已显示 ' + panelState.receipts.length + ' / ' + panelState.total + ' 条记录',
          'Showing ' + panelState.receipts.length + ' of ' + panelState.total + ' records'));
        section.appendChild(count);
        var items = node(doc, 'div', 'app-use-receipts-list');
        items.setAttribute('role', 'list');
        items.setAttribute('aria-label', tr('发送记录', 'Send records'));
        panelState.receipts.forEach(function (summary) { items.appendChild(makeReceiptSummary(binding, summary, panelState)); });
        section.appendChild(items);
        if (panelState.nextCursor !== null) {
          var more = node(doc, 'button', 'btn app-use-receipts-more', panelState.loading
            ? tr('正在读取…', 'Loading…')
            : tr('加载更多', 'Load more'));
          more.type = 'button';
          more.disabled = !!state.operation || state.contextStale || state.unavailable || !apiAvailable();
          more.addEventListener('click', function () { loadReceiptPage(binding, panelState.nextCursor, true); });
          section.appendChild(more);
        }
      }

      if (panelState.receipt && panelState.selectedRef) {
        var receipt = panelState.receipt;
        var detail = node(doc, 'div', 'app-use-receipt-detail');
        var statusLine = node(doc, 'div', 'app-use-receipt-detail-status');
        var statusLabel = node(doc, 'strong', 'app-use-receipt-status', receiptStatusLabel(receipt.status));
        statusLabel.dataset.state = receipt.status === 'unknown' ? 'unknown' : 'other';
        statusLine.appendChild(statusLabel);
        if (statusHasResolution(panelState.selectedSummary, receipt)) {
          statusLine.appendChild(node(doc, 'span', 'app-use-receipt-note-mark', tr('已记录人工备注', 'Human note recorded')));
        }
        detail.appendChild(statusLine);

        var account = recordedLabel(receipt.accountLabel);
        var conversation = recordedLabel(receipt.conversationLabel);
        if (account) detail.appendChild(node(doc, 'p', 'app-use-receipt-target', tr('记录的账号：', 'Recorded account: ') + account));
        else if (typeof receipt.accountLabel === 'string' && receipt.accountLabel.trim()) {
          detail.appendChild(node(doc, 'p', 'app-use-receipt-target', tr('记录的账号标签不可用。', 'Recorded account label unavailable.')));
        }
        if (conversation) detail.appendChild(node(doc, 'p', 'app-use-receipt-target', tr('记录的会话：', 'Recorded conversation: ') + conversation));
        else if (typeof receipt.conversationLabel === 'string' && receipt.conversationLabel.trim()) {
          detail.appendChild(node(doc, 'p', 'app-use-receipt-target', tr('记录的会话标签不可用。', 'Recorded conversation label unavailable.')));
        }
        var body = node(doc, 'pre', 'app-use-receipt-body');
        body.textContent = receipt.body;
        body.setAttribute('aria-label', tr('原始消息内容', 'Original message body'));
        detail.appendChild(body);

        if (receipt.userResolution) {
          var resolutionLabel = receipt.userResolution.kind === 'dismissed'
            ? tr('用户选择：暂不处理', 'User note: dismissed')
            : tr('用户选择：已在窗口核实观察', 'User note: verified observation');
          var resolution = node(doc, 'div', 'app-use-receipt-resolution');
          resolution.appendChild(node(doc, 'p', 'app-use-receipt-resolution-label', resolutionLabel));
          var statement = node(doc, 'p', 'app-use-receipt-resolution-statement');
          statement.textContent = receipt.userResolution.statement;
          resolution.appendChild(statement);
          detail.appendChild(resolution);
        }

        if (receipt.status === 'unknown' && !statusHasResolution(panelState.selectedSummary, receipt)) {
          var form = node(doc, 'div', 'app-use-resolution-form');
          var legend = node(doc, 'p', 'app-use-resolution-label', tr('添加人工备注', 'Add a human note'));
          form.appendChild(legend);
          var choices = node(doc, 'fieldset', 'app-use-resolution-choices');
          var choiceLegend = node(doc, 'legend', '', tr('选择备注类型', 'Choose a note type'));
          choices.appendChild(choiceLegend);
          [
            ['dismissed', tr('暂不处理此未知结果', 'Dismiss this unknown result')],
            ['user_verified_observation', tr('我已在应用窗口核实观察', 'I verified the observation in the app window')]
          ].forEach(function (choice) {
            var label = node(doc, 'label', 'app-use-resolution-choice');
            var radio = node(doc, 'input');
            radio.type = 'radio';
            radio.name = 'app-use-resolution-' + instanceId;
            radio.value = choice[0];
            radio.checked = panelState.resolution === choice[0];
            radio.disabled = !!state.operation || panelState.needsExplicitRefresh || state.contextStale || state.unavailable || !apiAvailable();
            radio.addEventListener('change', function () {
              if (radio.checked) panelState.resolution = radio.value;
              saveNote.disabled = !canSubmitReceipt(panelState, receipt);
            });
            label.append(radio, node(doc, 'span', '', choice[1]));
            choices.appendChild(label);
          });
          form.appendChild(choices);
          var statementLabel = node(doc, 'label', 'app-use-resolution-statement-label', tr('备注', 'Statement'));
          var statementInput = node(doc, 'textarea', 'app-use-resolution-statement');
          statementInput.maxLength = 1000;
          statementInput.rows = 3;
          statementInput.value = panelState.statement;
          statementInput.disabled = !!state.operation || panelState.needsExplicitRefresh || state.contextStale || state.unavailable || !apiAvailable();
          statementInput.setAttribute('aria-label', tr('备注，最多 1000 个字符', 'Statement, up to 1000 characters'));
          statementInput.addEventListener('input', function () {
            panelState.statement = statementInput.value;
            saveNote.disabled = !canSubmitReceipt(panelState, receipt);
          });
          statementLabel.appendChild(statementInput);
          form.appendChild(statementLabel);
          var formActions = node(doc, 'div', 'app-use-resolution-actions');
          var saveNote = node(doc, 'button', 'btn primary app-use-resolution-save', tr('保存备注', 'Save note'));
          saveNote.type = 'button';
          saveNote.disabled = !canSubmitReceipt(panelState, receipt);
          saveNote.addEventListener('click', function () { resolveReceipt(binding); });
          formActions.appendChild(saveNote);
          form.appendChild(formActions);
          detail.appendChild(form);
        }
        section.appendChild(detail);
      }
      return section;
    }

    function makeWatchPanel(binding) {
      if (binding.watches === undefined) return null;
      var section = node(doc, 'section', 'app-use-watches');
      section.setAttribute('aria-label', tr('可见窗口观察记录', 'Visible window watch records'));
      var heading = node(doc, 'h3', 'app-use-watches-title', tr('窗口观察', 'Window watches'));
      section.appendChild(heading);

      if (watchProjectionInvalid(binding)) {
        var invalid = node(doc, 'p', 'app-use-watch-error', tr('观察状态不可用。请刷新绑定列表。', 'Watch details are unavailable. Refresh the bound app list.'));
        invalid.setAttribute('role', 'status');
        section.appendChild(invalid);
        return section;
      }

      var watches = watchRows(binding);
      if (!watches.length) {
        section.appendChild(node(doc, 'p', 'app-use-watch-empty', tr('没有观察记录。', 'No watch records.')));
        return section;
      }

      var listItems = node(doc, 'div', 'app-use-watch-list');
      listItems.setAttribute('role', 'list');
      listItems.setAttribute('aria-label', tr('观察记录', 'Watch records'));
      watches.forEach(function (watch) {
        var item = node(doc, 'article', 'app-use-watch-item');
        item.setAttribute('role', 'listitem');
        var top = node(doc, 'div', 'app-use-watch-top');
        var labels = node(doc, 'div', 'app-use-watch-copy');
        labels.appendChild(node(doc, 'strong', 'app-use-watch-scope', watchScopeLabel(watch.scopeKind)));
        labels.appendChild(node(doc, 'span', 'app-use-watch-state', watchStateLabel(watch)));
        var stopping = !!(state.operation && state.operation.action === 'stop_watch' && state.operation.watchRef === watch.watchRef);
        if (canStopWatch(binding, watch)) {
          var stop = node(doc, 'button', 'btn app-use-watch-stop', stopping
            ? tr('正在停止…', 'Stopping…')
            : tr('停止观察', 'Stop watch'));
          stop.type = 'button';
          stop.disabled = stopping || !!state.operation || state.contextStale || state.unavailable || !apiAvailable();
          stop.addEventListener('click', function () { stopWatch(binding, watch); });
          top.append(labels, stop);
        } else {
          top.appendChild(labels);
        }
        item.appendChild(top);

        var counters = tr(
          '成功观察 ' + watch.successfulTicks + ' 次 · 尝试 ' + watch.attempts + ' 次 · 跳过 ' + watch.skippedTicks + ' 次',
          watch.successfulTicks + ' successful ticks · ' + watch.attempts + ' attempts · ' + watch.skippedTicks + ' skipped');
        item.appendChild(node(doc, 'p', 'app-use-watch-counters', counters));
        if (watch.reason) item.appendChild(node(doc, 'p', 'app-use-watch-reason', watchReasonLabel(watch.reason)));

        var snapshotText = watchSnapshotText(watch.asOf);
        if (snapshotText) item.appendChild(node(doc, 'p', 'app-use-watch-asof', snapshotText));
        if (watch.expiryUnchecked) {
          item.appendChild(node(doc, 'p', 'app-use-watch-expiry', tr('上次状态／剩余时间尚未刷新。', 'Last reported state; remaining time has not been refreshed.')));
        } else {
          var remaining = watchRemainingText(watch.remainingMilliseconds);
          if (remaining) item.appendChild(node(doc, 'p', 'app-use-watch-expiry', remaining));
        }
        listItems.appendChild(item);
      });
      section.appendChild(listItems);
      return section;
    }

    function makeBindingRow(binding) {
      var row = node(doc, 'article', 'app-use-binding');
      row.setAttribute('role', 'listitem');
      var top = node(doc, 'div', 'app-use-binding-top');
      var copy = node(doc, 'div', 'app-use-binding-copy');
      copy.append(node(doc, 'strong', 'app-use-binding-name', friendlyAppName(binding)));
      copy.append(node(doc, 'p', 'app-use-binding-meta', bindingStatus(binding) + ' · ' + capabilityText(binding)));
      var actions = node(doc, 'div', 'app-use-binding-actions');
      var statusActive = binding.status === 'active';
      if (canReviewBinding(binding)) {
        var reviewing = isCurrentReceiptPanel(binding.bindingId, binding.revision);
        var review = node(doc, 'button', 'btn app-use-receipts-open', reviewing
          ? tr('收起记录', 'Hide records')
          : tr('发送记录', 'Send records'));
        review.type = 'button';
        review.setAttribute('aria-expanded', reviewing ? 'true' : 'false');
        review.disabled = !!state.operation || state.contextStale || state.unavailable || !apiAvailable();
        review.addEventListener('click', function () { openReceipts(binding); });
        actions.appendChild(review);
      }
      if (statusActive && !(state.operation && state.operation.action === 'revoke' && state.operation.bindingId === binding.bindingId)) {
        var revoke = node(doc, 'button', 'btn danger app-use-revoke', tr('移除', 'Revoke'));
        revoke.type = 'button';
        revoke.disabled = !!state.operation || state.contextStale || state.unavailable || !apiAvailable();
        revoke.addEventListener('click', function () { state.confirming = binding; state.message = ''; state.error = ''; render(); });
        actions.appendChild(revoke);
      } else if (statusActive && state.operation && state.operation.action === 'revoke' && state.operation.bindingId === binding.bindingId) {
        actions.appendChild(node(doc, 'span', 'app-use-binding-pending', tr('处理中…', 'Working…')));
      }
      top.append(copy, actions);
      row.appendChild(top);

      if (state.confirming && state.confirming.bindingId === binding.bindingId) {
        var confirm = node(doc, 'div', 'app-use-confirm');
        var prompt = node(doc, 'p', '', tr('从此 Bot 移除此应用？此 Bot 将无法再使用它。', 'Remove this app from this Bot? The Bot will no longer be able to use it.'));
        var confirmActions = node(doc, 'div', 'app-use-confirm-actions');
        var keep = node(doc, 'button', 'btn', tr('取消', 'Cancel'));
        keep.type = 'button'; keep.addEventListener('click', function () { state.confirming = null; render(); });
        var remove = node(doc, 'button', 'btn danger', tr('确认移除', 'Remove app'));
        remove.type = 'button'; remove.addEventListener('click', function () { revokeBinding(binding); });
        confirmActions.append(keep, remove);
        confirm.append(prompt, confirmActions);
        row.appendChild(confirm);
      }
      var watchPanel = makeWatchPanel(binding);
      if (watchPanel) row.appendChild(watchPanel);
      var receiptPanel = makeReceiptPanel(binding);
      if (receiptPanel) row.appendChild(receiptPanel);
      return row;
    }

    function renderList() {
      list.replaceChildren();
      list.classList.toggle('app-use-list-expanded', !!state.receiptPanel);
      wechatNote.hidden = !(state.bindings || []).some(function (binding) { return isWeChat(binding) && binding.status === 'active'; });
      if (state.bindings === null) return;
      if (!state.bindings.length) {
        list.appendChild(node(doc, 'p', 'app-use-empty', tr('此 Bot 尚未绑定应用。', 'No apps are bound to this Bot yet.')));
        return;
      }
      state.bindings.forEach(function (binding) { list.appendChild(makeBindingRow(binding)); });
    }

    function render() {
      if (!state.open) return;
      botName.textContent = state.botName || tr('当前 Bot', 'Current Bot');
      renderList();
      var operation = state.operation;
      var busy = !!operation;
      var api = apiAvailable() && !state.unavailable;
      bindButton.disabled = !api || busy || state.contextStale;
      readChoice.radio.disabled = !api || busy || state.contextStale;
      actChoice.radio.disabled = !api || busy || state.contextStale;
      watchChoice.radio.disabled = !api || busy || state.contextStale;
      refreshButton.disabled = !api || busy || state.contextStale;
      access.hidden = !!state.receiptPanel;
      actionRow.hidden = !!state.receiptPanel;
      doneButton.disabled = !!(state.needsStop || operation && operation.action === 'stop_watch' || state.contextStale && operation && operation.action !== 'stop');
      cancelButton.hidden = !(operation && ['bind', 'revoke', 'receipts', 'receipt', 'resolve_receipt'].indexOf(operation.action) >= 0 || state.needsStop);
      cancelButton.disabled = !!(operation && operation.action === 'stop');
      if (operation && operation.action === 'stop') cancelButton.textContent = tr('正在取消操作…', 'Canceling action…');
      else if (state.needsStop && state.closeAfterStop) cancelButton.textContent = tr('重试取消并关闭', 'Retry cancellation and close');
      else if (state.needsStop && ['receipts', 'receipt', 'resolve_receipt'].indexOf(state.needsStopAction) >= 0) cancelButton.textContent = tr('重试取消记录操作', 'Retry canceling receipt action');
      else if (state.needsStop) cancelButton.textContent = tr('重试取消应用变更', 'Retry app change cancellation');
      else if (operation && operation.action === 'bind') cancelButton.textContent = tr('取消绑定', 'Cancel binding');
      else if (operation && operation.action === 'revoke') cancelButton.textContent = tr('取消移除', 'Cancel removal');
      else if (operation && ['receipts', 'receipt', 'resolve_receipt'].indexOf(operation.action) >= 0) cancelButton.textContent = tr('取消记录操作', 'Cancel receipt action');
      else cancelButton.textContent = tr('取消应用变更', 'Cancel app change');
      refreshButton.textContent = operation && operation.action === 'list' ? tr('正在刷新…', 'Refreshing…') : tr('刷新', 'Refresh');
      bindButton.textContent = operation && operation.action === 'bind' ? tr('正在选择应用…', 'Choosing app…') : tr('绑定应用…', 'Bind app…');
      status.textContent = state.message || (busy && operation.action === 'list' ? tr('正在读取绑定…', 'Loading bound apps…') : '');
      status.hidden = !status.textContent;
      status.dataset.error = state.error ? 'true' : 'false';
      if (!apiAvailable()) {
        status.textContent = tr('此版本暂不支持应用绑定管理。', 'App binding management is unavailable in this version.');
        status.hidden = false; status.dataset.error = 'true'; bindButton.disabled = true; refreshButton.disabled = true;
      } else if (state.unavailable) {
        status.textContent = state.message || tr('应用绑定管理暂不可用。', 'App binding management is currently unavailable.');
        status.hidden = false; status.dataset.error = 'true'; bindButton.disabled = true; refreshButton.disabled = true;
      }
    }

    function beginOperation(action, extra) {
      var operation = Object.assign({ action: action, botId: state.botId, epoch: state.epoch }, extra || {});
      state.operation = operation;
      state.message = '';
      state.error = '';
      render();
      return operation;
    }

    function markApiUnavailable(error) {
      if (error && (error.code === 'APP_USE_UNAVAILABLE' || error.code === 'APP_USE_MANAGEMENT_CLOSED')) state.unavailable = true;
    }

    function loadBindings(preserveMessage) {
      if (!state.open || state.contextStale || state.operation) return Promise.resolve();
      var retainedMessage = preserveMessage ? state.message : '';
      state.bindings = null;
      state.confirming = null;
      var operation = beginOperation('list');
      return callApi({ action: 'list', botId: operation.botId }).then(function (result) {
        if (!currentOperation(operation)) return;
        if (!result || result.ok !== true || !Array.isArray(result.bindings)) {
          var error = { code: result && result.code, message: result && result.message };
          markApiUnavailable(error);
          state.operation = null; state.bindings = null; state.message = errorCopy(error, 'list'); state.error = state.message;
          render(); return;
        }
        var rows = result.bindings.filter(validBinding);
        if (rows.length !== result.bindings.length) {
          state.operation = null; state.bindings = null;
          state.message = tr('无法确认绑定列表。请刷新后重试。', 'Could not verify the bound app list. Refresh and try again.');
          state.error = state.message; render(); return;
        }
        if (state.receiptPanel) {
          var selectedBinding = rows.find(function (binding) { return binding.bindingId === state.receiptPanel.bindingId; });
          if (!selectedBinding || selectedBinding.revision !== state.receiptPanel.revision || !canReviewBinding(selectedBinding)) state.receiptPanel = null;
        }
        state.operation = null; state.bindings = rows; state.message = retainedMessage; state.error = ''; render();
      }).catch(function (error) {
        if (!currentOperation(operation)) return;
        markApiUnavailable(error);
        state.operation = null; state.bindings = null; state.message = errorCopy(error, 'list'); state.error = state.message; render();
      });
    }

    function bindApp() {
      if (!state.open || state.operation || state.contextStale || state.unavailable || !apiAvailable()) return;
      state.confirming = null;
      var operation = beginOperation('bind');
      callApi({ action: 'bind', botId: operation.botId, capabilities: capabilities() }).then(function (result) {
        if (!currentOperation(operation)) return;
        if (!result || result.ok !== true || !result.binding || !validBinding(result.binding)) {
          var error = { code: result && result.code, message: result && result.message };
          markApiUnavailable(error);
          finishBindingApproval(operation);
          state.operation = null; state.message = errorCopy(error, 'bind'); state.error = state.message; render();
          return;
        }
        finishBindingApproval(operation);
        state.operation = null;
        state.bindings = (state.bindings || []).filter(function (binding) { return binding.bindingId !== result.binding.bindingId; }).concat([result.binding]);
        state.message = tr('应用已绑定到此 Bot。', 'App bound to this Bot.'); state.error = '';
        render();
      }).catch(function (error) {
        if (!currentOperation(operation)) return;
        markApiUnavailable(error);
        finishBindingApproval(operation);
        state.operation = null; state.message = errorCopy(error, 'bind'); state.error = state.message; render();
      });
    }

    function revokeBinding(binding) {
      if (!state.open || state.operation || state.contextStale || state.unavailable || !apiAvailable() || !validBinding(binding)) return;
      state.confirming = null;
      var operation = beginOperation('revoke', { bindingId: binding.bindingId });
      callApi({ action: 'revoke', botId: operation.botId, bindingId: binding.bindingId, revision: binding.revision }).then(function (result) {
        if (!currentOperation(operation)) return;
        if (!result || result.ok !== true) {
          var error = { code: result && result.code, message: result && result.message };
          markApiUnavailable(error);
          state.operation = null; state.message = errorCopy(error, 'revoke'); state.error = state.message; render();
          return;
        }
        state.operation = null;
        state.message = tr('应用已从此 Bot 移除。', 'App removed from this Bot.'); state.error = ''; render();
        loadBindings(true);
      }).catch(function (error) {
        if (!currentOperation(operation)) return;
        markApiUnavailable(error);
        state.operation = null; state.message = errorCopy(error, 'revoke'); state.error = state.message; render();
      });
    }

    function closeNow() {
      state.epoch++;
      state.open = false;
      state.operation = null;
      state.receiptPanel = null;
      state.needsStop = false;
      state.needsStopAction = '';
      state.closeAfterStop = false;
      state.contextStale = false;
      state.closeAfterWatchStop = false;
      state.yieldedApproval = null;
      state.confirming = null;
      if (dialog.open) dialog.close();
      if (state.opener && typeof state.opener.focus === 'function') state.opener.focus({ preventScroll: true });
      state.opener = null;
    }

    function stopOperation(closeAfter) {
      if (!state.open) return Promise.resolve(false);
      if (stopPromise) return stopPromise;
      var botId = state.botId;
      var interruptedAction = state.operation && state.operation.action !== 'stop'
        ? state.operation.action
        : state.needsStopAction;
      var receiptAction = ['receipts', 'receipt', 'resolve_receipt'].indexOf(interruptedAction) >= 0;
      state.epoch++;
      var epoch = state.epoch;
      state.operation = { action: 'stop', botId: botId, epoch: epoch };
      state.needsStop = false;
      state.needsStopAction = interruptedAction || '';
      state.closeAfterStop = !!closeAfter;
      if (receiptAction && state.receiptPanel) {
        state.receiptPanel.loading = false;
        clearReceiptForm(state.receiptPanel);
        if (interruptedAction === 'resolve_receipt') {
          state.receiptPanel.needsExplicitRefresh = true;
          state.receiptPanel.notice = tr('请刷新发送记录，查看备注是否已保存。', 'Refresh Send records to check whether the note was saved.');
          state.receiptPanel.error = '';
        } else {
          state.receiptPanel.notice = tr('记录操作已取消。请刷新发送记录后继续。', 'Receipt action canceled. Refresh Send records to continue.');
        }
      }
      state.message = receiptAction
        ? tr('正在取消记录操作…', 'Canceling the receipt action…')
        : tr('正在取消此应用变更并等待完成…', 'Canceling this app change and waiting for it to finish…');
      state.error = '';
      render();
      stopPromise = callApi({ action: 'stop', botId: botId }).then(function (result) {
        if (!isCurrent(epoch, botId)) return false;
        if (!result || result.ok !== true) throw Object.assign(new Error(result && result.message || 'APP_USE_STOP_FAILED'), { code: result && result.code, message: result && result.message });
        state.operation = null;
        if (state.closeAfterStop) { closeNow(); return true; }
        finishStoppedBindingApproval(false);
        state.message = interruptedAction === 'resolve_receipt'
          ? tr('取消请求已完成。请刷新发送记录，查看备注是否已保存。', 'Cancellation finished. Refresh Send records to check whether the note was saved.')
          : receiptAction
            ? tr('记录操作已取消。需要时请刷新发送记录。', 'Receipt action canceled. Refresh Send records when needed.')
            : result.stopped === false
              ? tr('当前没有需要取消的应用变更。', 'There was no app change to cancel.')
              : result.stopped === true
                ? tr('应用变更已取消。', 'App change canceled.')
                : tr('取消请求已完成。', 'Cancellation finished.');
        state.needsStopAction = '';
        state.error = '';
        render();
        loadBindings(true);
        return true;
      }).catch(function (error) {
        if (!isCurrent(epoch, botId)) return false;
        markApiUnavailable(error);
        state.operation = null;
        state.needsStop = true;
        state.needsStopAction = interruptedAction || '';
        finishStoppedBindingApproval(true);
        state.message = receiptAction
          ? tr('无法确认记录操作已取消。此窗口保持打开；请重试取消。', 'Could not confirm the receipt action was canceled. This panel stays open; retry cancellation.')
          : errorCopy(error, 'stop');
        if (receiptAction && state.receiptPanel) state.receiptPanel.notice = '';
        state.error = state.message;
        render();
        return false;
      }).finally(function () { stopPromise = null; });
      return stopPromise;
    }

    function requestClose() {
      if (!state.open) return;
      if (state.operation && state.operation.action === 'stop') {
        state.closeAfterStop = true;
        render();
        return;
      }
      if (state.operation && state.operation.action === 'stop_watch') {
        state.closeAfterWatchStop = true;
        state.message = tr('正在等待观察清理完成，然后关闭面板…', 'Waiting for watch cleanup to finish before closing…');
        state.error = '';
        render();
        return;
      }
      if (state.operation && state.operation.action !== 'list' && state.operation.action !== 'stop' || state.needsStop || state.contextStale) {
        stopOperation(true);
        return;
      }
      closeNow();
    }

    function open(context) {
      context = context || {};
      var botId = String(context.botId || '');
      if (!botId) return;
      if (state.open && state.botId !== botId) { onBotChanged(botId); return; }
      if (state.open && state.botId === botId) {
        state.opener = context.opener || state.opener;
        if (!state.operation) loadBindings();
        return;
      }
      state.epoch++;
      state.open = true;
      state.botId = botId;
      state.botName = cleanText(context.botName, 80) || tr('当前 Bot', 'Current Bot');
      state.opener = context.opener || null;
      state.bindings = null;
      state.operation = null;
      state.error = '';
      state.message = '';
      state.unavailable = false;
      state.confirming = null;
      state.contextStale = false;
      state.needsStop = false;
      state.needsStopAction = '';
      state.closeAfterStop = false;
      state.closeAfterWatchStop = false;
      state.yieldedApproval = null;
      readChoice.radio.checked = true;
      actChoice.radio.checked = false;
      watchChoice.radio.checked = false;
      if (!dialog.open) dialog.showModal();
      render();
      loadBindings();
      closeButton.focus({ preventScroll: true });
    }

    function onBotChanged(nextBotId) {
      if (!state.open || String(nextBotId || '') === state.botId) return;
      state.contextStale = true;
      state.message = state.operation && state.operation.action === 'stop_watch'
        ? tr('正在等待观察清理完成，然后关闭此 Bot 的面板…', 'Waiting for watch cleanup to finish before closing this Bot panel…')
        : tr('正在切换 Bot，并取消当前应用变更…', 'Switching Bots and canceling the current app change…');
      state.error = '';
      render();
      if (state.operation && state.operation.action === 'stop') { state.closeAfterStop = true; render(); }
      else if (state.operation && state.operation.action === 'stop_watch') { state.closeAfterWatchStop = true; render(); }
      else if (state.operation && state.operation.action !== 'list' || state.needsStop) stopOperation(true);
      else closeNow();
    }

    closeButton.addEventListener('click', requestClose);
    doneButton.addEventListener('click', requestClose);
    bindButton.addEventListener('click', bindApp);
    refreshButton.addEventListener('click', function () {
      state.receiptPanel = null;
      loadBindings();
    });
    cancelButton.addEventListener('click', function () { stopOperation(!!state.closeAfterStop); });
    readChoice.radio.addEventListener('change', render);
    actChoice.radio.addEventListener('change', render);
    watchChoice.radio.addEventListener('change', render);
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); requestClose(); });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) requestClose(); });

    return {
      open: open,
      close: requestClose,
      onBotChanged: onBotChanged,
      onBindingApprovalPending: yieldForBindingApproval,
      onBindingApprovalResolved: resumeForBindingApproval,
      onBindingApprovalCancelRequested: cancelForBindingApproval,
      refresh: loadBindings,
      element: dialog
    };
  }

  return { create: create, friendlyAppName: friendlyAppName, isWeChat: isWeChat, errorCopy: errorCopy };
});
