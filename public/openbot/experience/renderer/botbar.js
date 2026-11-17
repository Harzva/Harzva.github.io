(function () {
  'use strict';
  const api = window.openbotBotBar, $ = id => document.getElementById(id);
  const tr = (zh, en) => window.OpenBotI18n ? window.OpenBotI18n.t(zh, en) : zh;
  window.OpenBotI18n?.localize(document);
  let view, page = 0, dirty = false, pointer = null, dragQueue = Promise.resolve(), gesture = 0;
  const nodes = new Map();
  let renderedSection = null;
  const collaboration = window.OpenBotBotbarCollaboration.create({call, report:error});
  const labels = {idle: ['待命', 'Ready'], queued: ['排队中', 'Queued'], thinking: ['思考中', 'Thinking'],
    working: ['工作中', 'Working'], running: ['执行中', 'Running'], waiting: ['待审批', 'Approval'],
    done: ['已完成', 'Done'], error: ['出错', 'Error'], interrupted: ['已中断', 'Interrupted']};
  const attention = bot => bot.waitingCount > 0 || ['waiting', 'error', 'interrupted'].includes(bot.status);
  function error(message) { $('bar-error').textContent = message; $('bar-error').hidden = !message; }
  async function call(method, input) {
    try {
      if (typeof api?.[method] !== 'function') throw new Error('Bridge unavailable');
      const next = await api[method](input);
      error('');
      if (next?.layout) render(next);
      else if (next?.view?.layout) render(next.view);
      return next;
    } catch {
      error(tr('操作未完成，请重试。', 'The action failed. Try again.'));
      return null;
    }
  }
  function makeBot(bot) {
    const item = document.createElement('div'); item.className = 'bar-bot-item'; item.setAttribute('role', 'listitem');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'bar-bot-button'; button.dataset.botId = bot.id;
    const avatar = document.createElement('span'); avatar.className = 'bar-bot-avatar'; avatar.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span'); name.className = 'bar-bot-label';
    const status = document.createElement('span'); status.className = 'bar-bot-status';
    button.append(avatar, name, status); item.append(button);
    button.addEventListener('click', () => call('open', bot.id));
    return {item, button, avatar, name, status};
  }
  function render(next) {
    if (!next || !Array.isArray(next.bots) || !next.layout) return;
    view = next;
    collaboration.render(view);
    const people = view.section === 'people', list = people ? view.collaboration.people : view.bots;
    if (renderedSection !== view.section) { for (const node of nodes.values()) node.item.remove(); nodes.clear(); page = 0; renderedSection = view.section; }
    const capacity = Math.max(1, view.layout.capacity || 8), pages = Math.max(1, Math.ceil(list.length / capacity));
    page = Math.max(0, Math.min(page, pages - 1));
    const visible = list.slice(page * capacity, (page + 1) * capacity), ids = new Set(visible.map(b => b.id));
    document.body.dataset.edge = view.layout.edge;
    document.body.dataset.orientation = view.layout.orientation;
    document.body.dataset.expanded = String(view.layout.expanded);
    document.body.dataset.dragging = String(view.layout.dragging);
    document.body.dataset.motion = String(view.settings.motion);
    $('bar-name').textContent = view.settings.name; document.title = view.settings.name;
    $('botbar').setAttribute('aria-label', view.settings.name);
    $('bar-name').title = view.settings.name;
    $('bar-settings').hidden = !view.layout.expanded || !!view.layout.panel;
    $('bar-people').setAttribute('aria-pressed', String(people));
    $('bar-agents').setAttribute('aria-pressed', String(!people));
    $('bar-inbox').setAttribute('aria-expanded', String(view.layout.panel === 'inbox'));
    const pendingTasks = view.collaboration.tasks.filter(collaboration.pending).length;
    $('bar-inbox').textContent = tr('消息与任务', 'Inbox') + (pendingTasks ? ' ' + pendingTasks : '');
    $('bar-inbox').title = tr('近期同事消息 · ' + pendingTasks + ' 项待处理任务', 'Recent messages · ' + pendingTasks + ' tasks requiring your action');
    $('bar-more').setAttribute('aria-expanded', String(view.layout.expanded && !view.layout.panel));
    $('bar-pager').hidden = pages === 1;
    $('bar-page').textContent = (page + 1) + '/' + pages;
    $('bar-previous').disabled = page === 0; $('bar-next').disabled = page === pages - 1;
    const needs = view.bots.filter(attention).length;
    $('bar-attention').hidden = needs === 0;
    $('bar-attention').textContent = tr(needs + ' 待处理', needs + ' need attention');
    $('bar-attention').title = tr('定位需要处理的 BOT', 'Find a BOT that needs attention');
    $('bar-empty').hidden = list.length !== 0;
    $('bar-bots').hidden = list.length === 0;
    $('bar-empty-text').textContent = people ? view.collaboration.connection === 'connected' ? tr('加入团队后显示真人同事', 'Join a team to see colleagues') : collaboration.label(view.collaboration.connection) : tr('还没有 Agent BOT', 'No Agent BOTs yet');
    $('bar-create').textContent = people ? tr('打开团队', 'Open team') : tr('去创建伙伴', 'Create a BOT');
    const focused = document.activeElement?.dataset.botId;
    for (const [id, node] of nodes) if (!ids.has(id)) { node.item.remove(); nodes.delete(id); }
    visible.forEach((bot, index) => {
      let node = nodes.get(bot.id);
      if (!node) { node = people ? collaboration.personNode(bot) : makeBot(bot); nodes.set(bot.id, node); }
      const at = $('bar-bots').children[index];
      if (at !== node.item) $('bar-bots').insertBefore(node.item, at || null);
      if (people) { collaboration.updatePerson(node, bot); return; }
      const avatarKey = bot.avatar + ':' + bot.color;
      if (node.avatar.dataset.key !== avatarKey) {
        node.avatar.innerHTML = window.OpenBotAvatars.markup(bot.avatar, bot.color, {size: 'list'});
        node.avatar.dataset.key = avatarKey;
      }
      const status = bot.waitingCount > 0 ? 'waiting' : bot.status;
      node.name.textContent = bot.name;
      const label = labels[status] || labels.idle;
      node.status.textContent = tr(...label) + (bot.activeCount > 1 && ['running', 'working', 'thinking'].includes(status) ? ' ' + bot.activeCount : bot.waitingCount > 1 ? ' ' + bot.waitingCount : '');
      node.button.dataset.status = status; node.button.dataset.active = String(view.activeId === bot.id);
      node.button.setAttribute('aria-label', bot.name + ' · ' + node.status.textContent);
      node.button.title = bot.name + ' · ' + node.status.textContent;
      window.OpenBotAvatars.setExpression(node.avatar.querySelector('.ob-avatar'), status);
    });
    if (focused && ![...$('bar-bots').querySelectorAll('button')].some(button => button.dataset.botId === focused)) (nodes.values().next().value?.button || $('bar-create')).focus();
    if (!dirty) { $('bar-name-input').value = view.settings.name; $('bar-motion').checked = view.settings.motion; }
    for (const button of document.querySelectorAll('.dock-actions button')) button.setAttribute('aria-pressed', String(button.dataset.edge === view.layout.edge));
    if (view.warning) error(tr('设置恢复时遇到问题，原文件已保留。', 'Settings could not be fully restored. The original file was kept.'));
    else if (view.truncated) error(tr('BOT 数量较多，其余伙伴请在主窗口查看。', 'More BOTs are available in the main window.'));
  }
  $('bar-previous').addEventListener('click', () => { page--; render(view); });
  $('bar-next').addEventListener('click', () => { page++; render(view); });
  $('bar-attention').addEventListener('click', async () => {
    if (!view) return;
    if (view.section !== 'agents') await call('section', 'agents');
    const index = view.bots.findIndex(attention);
    if (index >= 0) { page = Math.floor(index / view.layout.capacity); render(view); nodes.get(view.bots[index].id)?.button.focus(); }
  });
  $('bar-more').addEventListener('click', async () => {
    const expanded = !view?.layout.expanded || !!view?.layout.panel;
    if (!expanded) dirty = false;
    const result = await call('expand', expanded);
    if (result && expanded) $('bar-name-input').focus();
  });
  $('bar-create').addEventListener('click', () => call('open', view?.section === 'people' ? {kind:'team'} : null));
  $('bar-people').addEventListener('click', () => call('section', 'people'));
  $('bar-agents').addEventListener('click', () => call('section', 'agents'));
  $('bar-inbox').addEventListener('click', async () => { const result = await call('panel', view?.layout.panel === 'inbox' ? '' : 'inbox'); if (result?.layout.panel) $('bar-collaboration').querySelector('button')?.focus(); });
  $('bar-hide').addEventListener('click', () => call('hide'));
  $('bar-name-input').addEventListener('input', () => { dirty = true; });
  $('bar-motion').addEventListener('change', () => { dirty = true; });
  $('bar-settings-form').addEventListener('submit', async event => {
    event.preventDefault();
    const name = $('bar-name-input').value.trim();
    if (!name) { error(tr('请输入显示名称。', 'Enter a display name.')); $('bar-name-input').focus(); return; }
    const result = await call('configure', {name, motion: $('bar-motion').checked});
    if (result) { dirty = false; await call('expand', false); $('bar-more').focus(); }
  });
  for (const button of document.querySelectorAll('.dock-actions button')) button.addEventListener('click', () => call('dock', button.dataset.edge));
  $('bar-bots').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...$('bar-bots').querySelectorAll('button')], index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1)));
    buttons[next].focus();
  });
  const handle = $('bar-drag');
  handle.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer) return;
    event.preventDefault();
    pointer = {id: event.pointerId, x: event.screenX, y: event.screenY, active: false, ending: false, generation: ++gesture};
    handle.setPointerCapture(event.pointerId);
  });
  // A native window resize/reposition can release Chromium's pointer capture.
  // Keep the gesture listeners on the document so its final move/up still lands.
  document.addEventListener('pointermove', event => {
    if (!pointer || pointer.ending || pointer.id !== event.pointerId) return;
    if (pointer.active && event.buttons === 0) { endPointer(false); return; }
    if (!pointer.active && Math.hypot(event.screenX - pointer.x, event.screenY - pointer.y) < 6) return;
    const p = pointer;
    if (!p.active) {
      p.active = true; dirty = false;
      dragQueue = dragQueue.then(() => call('dragStart', {x: p.x, y: p.y}));
    }
    // Coalesce pointer events while an IPC round trip is in flight.
    p.latest = {x: event.screenX, y: event.screenY};
    if (p.queued) return;
    p.queued = true;
    dragQueue = dragQueue.then(async () => {
      while (p.latest && !p.ending) { const latest = p.latest; p.latest = null; await call('dragMove', latest); }
      p.queued = false;
    });
  }, true);
  function endPointer(cancel) {
    if (!pointer || pointer.ending) return;
    const p = pointer; p.ending = true;
    dragQueue = dragQueue.then(async () => {
      if (p.active) {
        if (!cancel && p.latest) await call('dragMove', p.latest);
        await call('dragEnd', cancel);
      }
      if (pointer === p) pointer = null;
      if (handle.hasPointerCapture(p.id)) handle.releasePointerCapture(p.id);
    });
  }
  document.addEventListener('pointerup', () => endPointer(false), true);
  document.addEventListener('pointercancel', () => endPointer(true), true);
  handle.addEventListener('lostpointercapture', event => endPointer(event.buttons !== 0));
  window.addEventListener('blur', () => endPointer(true));
  document.addEventListener('keydown', async event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (pointer) { endPointer(true); return; }
    if (view?.layout.expanded) { const target = view.layout.panel ? 'bar-inbox' : 'bar-more'; dirty = false; await call('expand', false); $(target).focus(); }
  });
  document.addEventListener('visibilitychange', () => { document.body.dataset.hidden = String(document.hidden); if (document.hidden) endPointer(true); });
  api?.onUpdate(render);
  call('state');
})();
