(function (root) {
  'use strict';
  function tr(zh,en){return root.OpenBotI18n?root.OpenBotI18n.t(zh,en):zh;}
  var bridge, drag, active = null, epoch = 0, observer, getBots = function () { return []; }, onError = function () {};
  function key(target) { return target ? [target.kind, target.id, target.spaceId || ''].join(':') : ''; }
  function visible(node) { return !!node && node.isConnected && !!node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden'; }
  function readTarget(node) {
    return { kind: node.dataset.botDropKind, id: node.dataset.botDropId, label: node.dataset.botDropLabel || '',
      ...(node.dataset.botDropSpaceId ? { spaceId: node.dataset.botDropSpaceId } : {}) };
  }
  function currentPage() {
    var blockers = Array.from(document.querySelectorAll('[data-bot-page-block]')).filter(visible);
    var blocker = blockers.sort(function (a, b) { return Number(b.dataset.botPageBlock) - Number(a.dataset.botPageBlock); })[0];
    var pages = Array.from((blocker || document).querySelectorAll('[data-bot-page]')).filter(function(node){return visible(node)&&node.getAttribute('aria-disabled')!=='true';});
    return pages.sort(function (a, b) { return Number(b.dataset.botPage) - Number(a.dataset.botPage); })[0] || null;
  }
  function checked(value){if(value&&value.ok===false)throw Object.assign(new Error(value.message||'临时参与失败'),{code:value.code});return value;}
  function report(error) { onError(error && error.message || String(error)); }
  function release(record) {
    if (!record) return;
    record.promise.then(function (lease) { return lease&&lease.token?bridge.temporaryBotLeave({ token: lease.token }).then(checked):null; }).catch(function(error){if(error.code!=='TEMP_PAGE_STALE'&&error.message!=='页面已离开，请重新选择')report(error);});
  }
  function syncPage() {
    if (!bridge) return;
    var page = currentPage(), target = page ? readTarget(page) : null;
    if (key(target) === key(active && active.target)) return;
    var previous = active; active = null; epoch++; release(previous);
    if (!target) return;
    var ticket = epoch;
    var record = { target: target, epoch: ticket, promise: Promise.resolve().then(function () {
      if (ticket !== epoch) throw new Error('页面已离开，请重新选择');
      return bridge.temporaryBotEnter({kind:target.kind,id:target.id,...(target.spaceId?{spaceId:target.spaceId}:{})}).then(checked);
    }) };
    active = record;
    record.promise.catch(function (error) { if (active === record) report(error); });
  }
  async function candidates(target) {
    syncPage();
    if (!active || key(target) !== key(active.target)) throw new Error('请在当前空间或会议页面邀请 Bot');
    if (target.kind === 'meeting') {
      var state = await bridge.meetingState(), detail = await bridge.meetingView({ meetingId: target.id });
      var meeting = detail.meeting;
      return state.bots.map(function (bot) { return Object.assign({}, bot, {
        joined: meeting.participantBotIds.indexOf(bot.id) >= 0,
        reason: meeting.status !== 'open' ? '会议已结束' : meeting.activeRun ? '请等待本轮结束' : bot.unsupportedReason || ''
      }); });
    }
    var value = await bridge.orgWorkspaceState();
    var space = value.spaces.find(function (item) { return item.id === (target.spaceId || target.id); });
    if (!space) throw new Error('请选择组织空间；个人空间的 Bot 已全部可用');
    return value.bots.map(function (bot) { return Object.assign({}, bot, { joined: space.memberBotIds.indexOf(bot.id) >= 0, reason: bot.unsupportedReason || '' }); });
  }
  async function join(payload) {
    syncPage();
    var record = active;
    // The drag contract carries only kind/id. The visible page supplies scope.
    if (!record || payload.kind !== record.target.kind || payload.id !== record.target.id) throw new Error('目标页面已离开，未加入 Bot');
    var lease = await record.promise;
    if (active !== record) throw new Error('目标页面已离开，未加入 Bot');
    var result = checked(await bridge.temporaryBotJoin({ token: lease.token, botId: payload.botId }));
    if (active !== record) throw new Error('已离开页面，临时参与已结束');
    if (root.OpenBotOrgWorkspaces) await root.OpenBotOrgWorkspaces.refresh();
    root.dispatchEvent(new CustomEvent('openbot-temporary-bots-changed'));
    return result;
  }
  function decorate(element, target, controls, priority) {
    element.dataset.botPage = String(priority || 10);
    element.dataset.botDropKind = target.kind; element.dataset.botDropId = target.id;
    element.dataset.botDropLabel = target.label || '';
    if (target.spaceId) element.dataset.botDropSpaceId = target.spaceId;
    if (controls) {
      var invite = document.createElement('button'); invite.type = 'button'; invite.className = 'bot-temporary-invite';
      invite.textContent = tr('临时邀请 Bot','Invite Bot temporarily'); invite.title = tr('选择或拖入 Bot；离开此页面后自动退出','Choose or drag a Bot; it leaves when you leave this page');
      invite.addEventListener('click', function () { syncPage(); if (drag) drag.openPicker(target, invite); });
      controls.appendChild(invite);
      var hint = document.createElement('span'); hint.className = 'bot-temporary-hint'; hint.textContent = tr('离开页面自动退出','Leaves when you leave this page'); controls.appendChild(hint);
    }
  }
  function init(options) {
    if (drag) return;
    if (!options.bridge || typeof options.bridge.temporaryBotEnter !== 'function') {
      if (options.sidebarSort) drag = root.OpenBotBotDrag.init({ sidebarSort: options.sidebarSort });
      return;
    }
    bridge = options.bridge; getBots = options.getBots || getBots; onError = options.onError || onError;
    drag = root.OpenBotBotDrag.init({ sidebarSort: options.sidebarSort, getBot: function (id) { return getBots().find(function (bot) { return bot.id === id; }); },
      getCandidates: function (target) { syncPage(); return candidates(active && target.kind === active.target.kind && target.id === active.target.id ? active.target : target); },
      onDrop: join, onError: report });
    observer = new MutationObserver(syncPage);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'class', 'style', 'data-bot-drop-id'] });
    root.addEventListener('beforeunload', function () { var previous = active; active = null; epoch++; release(previous); });
    syncPage();
  }
  root.OpenBotTemporaryBots = { init: init, decorate: decorate, sync: syncPage };
})(window);
