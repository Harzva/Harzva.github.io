(function (root) {
  'use strict';

  var states = new WeakMap();
  var delegates = new WeakMap();
  var mountSnapshots = new WeakMap();
  var expandedByContainer = new WeakMap();
  var nextId = 1;
  var exchangeState = null;
  var pendingExchangeTrigger = null;
  var executionLogoFiles = {
    dsh: 'dsh.svg', pi: 'pi.svg', legacy: 'legacy.svg', codex: 'codex.svg',
    claude: 'claude.svg', gemini: 'gemini.svg', kimi: 'kimi.svg', qwen: 'qwen.svg',
    grok: 'grok.svg', agy: 'agy.svg', opencode: 'opencode.svg',
    'cursor-agent': 'cursor-agent.svg', goose: 'goose.svg', copilot: 'copilot.svg',
    amp: 'amp.svg', aider: 'aider.png', codebuddy: 'codebuddy.svg', cline: 'cline.svg'
  };
  var executionNames = {
    dsh: 'DeepSeek Harness', pi: 'Pi Core', legacy: 'Bot Studio', codex: 'Codex', claude: 'Claude',
    gemini: 'Gemini', kimi: 'Kimi', qwen: 'Qwen', grok: 'Grok', agy: 'Antigravity',
    opencode: 'OpenCode', 'cursor-agent': 'Cursor', goose: 'Goose', copilot: 'Copilot',
    amp: 'Amp', aider: 'Aider', codebuddy: 'CodeBuddy', cline: 'Cline'
  };
  var traceIdentifier = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/;
  var traceVersion = /^[A-Za-z0-9][A-Za-z0-9.+_-]{0,79}$/;

  function tr(zh, en) {
    return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function'
      ? root.OpenBotI18n.t(zh, en)
      : (root.document.documentElement.lang === 'en' ? en : zh);
  }

  function text(value) {
    return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  }

  function detailText(value) {
    if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
    if (value && typeof value === 'object' && typeof value.message === 'string') return value.message.trim();
    return '';
  }

  function timestamp(value) {
    if (typeof value === 'number' && isFinite(value)) {
      if (value <= 0) return null;
      return value < 100000000000 ? value * 1000 : value;
    }
    if (typeof value !== 'string' || !value.trim()) return null;
    var numeric = Number(value);
    if (isFinite(numeric)) {
      if (numeric <= 0) return null;
      return numeric < 100000000000 ? numeric * 1000 : numeric;
    }
    var parsed = Date.parse(value);
    return isFinite(parsed) ? parsed : null;
  }

  function uniqueValues(values) {
    var seen = new Set();
    return (Array.isArray(values) ? values : []).map(text).filter(function (value) {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  function makeBotMap(bots) {
    var map = new Map();
    (Array.isArray(bots) ? bots : []).forEach(function (bot) {
      if (bot && bot.id != null) map.set(String(bot.id), bot);
    });
    return map;
  }

  function peersFor(group, botMap) {
    var items = Array.isArray(group.items) ? group.items : [];
    var ids = uniqueValues(group.peerIds);
    if (!ids.length) ids = uniqueValues(items.map(function (item) { return item && item.peerId; }));
    return ids.map(function (id) {
      var related = items.filter(function (item) { return item && String(item.peerId || '') === id; });
      var deleted = related.some(function (item) { return item.deleted === true; });
      var bot = deleted ? null : (botMap.get(id) || null);
      var itemName = '';
      related.some(function (item) {
        itemName = text(item.peerName);
        return !!itemName;
      });
      return {
        id: id,
        bot: bot,
        deleted: deleted,
        name: bot ? text(bot.name) : (itemName || (deleted ? tr('已删除的 Bot', 'Removed Bot') : tr('不可用的 Bot', 'Unavailable Bot')))
      };
    });
  }

  function tasksFor(group) {
    var ids = uniqueValues(group.taskIds);
    var items = Array.isArray(group.items) ? group.items : [];
    var byId = new Map();
    items.forEach(function (item) {
      var id = item && text(item.taskId);
      if (id && !byId.has(id)) byId.set(id, item);
    });
    if (!ids.length) ids = Array.from(byId.keys());
    return ids.map(function (id) {
      return byId.get(id) || { taskId: id };
    });
  }

  function taskCount(group, tasks) {
    return uniqueValues((Array.isArray(group.taskIds) ? group.taskIds : []).concat(tasks.map(function (item) { return item.taskId; }))).length;
  }

  function directionLabel(direction) {
    if (direction === 'sent') return tr('已交给', 'Handed off to');
    if (direction === 'received') return tr('任务来自', 'Task from');
    if (direction === 'returned') return tr('结果来自', 'Results from');
    return tr('任务反馈', 'Task update');
  }

  function taskStatus(item) {
    var event = item && item.executionEvent;
    var eventPhase = event && event.schema === 1 && event.type === 'task.snapshot' && typeof event.phase === 'string'
      ? event.phase.toLowerCase() : '';
    var authoritative = {
      queued: ['排队中', 'Queued'], running: ['运行中', 'Running'], completed: ['已完成', 'Completed'],
      failed: ['失败', 'Failed'], canceled: ['已取消', 'Cancelled'], interrupted: ['已中断', 'Interrupted'],
      unknown: ['结果未知', 'Outcome unknown'], unmet: ['未达到要求', 'Requirements unmet'],
      'result-pending': ['结果尚未保存', 'Result not saved yet']
    };
    if (authoritative[eventPhase]) return tr(authoritative[eventPhase][0], authoritative[eventPhase][1]);

    var value = text(item.status || item.phase);
    if (value) {
      var key = value.toLowerCase();
      if (item.resultPending === true && ['done', 'completed', 'succeeded', 'success'].indexOf(key) >= 0) return tr('结果尚未保存', 'Result not saved yet');
      var labels = {
        queued: ['排队中', 'Queued'], running: ['运行中', 'Running'], started: ['已开始', 'Started'],
        working: ['处理中', 'Working'], waiting: ['等待中', 'Waiting'], done: ['已完成', 'Completed'],
        completed: ['已完成', 'Completed'], succeeded: ['已完成', 'Completed'], success: ['已完成', 'Completed'],
        failed: ['失败', 'Failed'], error: ['出错', 'Error'], cancelled: ['已取消', 'Cancelled'],
        canceled: ['已取消', 'Cancelled'], interrupted: ['已中断', 'Interrupted'], stopped: ['已停止', 'Stopped']
      };
      return labels[key] ? tr(labels[key][0], labels[key][1]) : value;
    }
    return item.resultPending === true ? tr('结果尚未保存', 'Result not saved yet') : '';
  }

  function executionRecord(item) {
    var value = item && item.execution;
    if (!value || value.schema !== 1 || !traceIdentifier.test(text(value.runId)) ||
        !traceIdentifier.test(text(value.executorId)) || !Number.isSafeInteger(value.generation) || value.generation < 0 ||
        [null, 'cli', 'acp'].indexOf(value.transport) < 0) return null;
    return value;
  }

  function appendExecutionAttribution(meta, item) {
    var record = executionRecord(item);
    if (!record) return;
    var id = text(record.executorId);
    var brand = id.indexOf('agent:') === 0 ? id.slice(6) : id;
    var name = id === 'pi' ? 'Pi Core' : id === 'agent:pi' ? 'Pi CLI' : (executionNames[brand] || brand);
    if (!name) return;

    var attribution = element('span', 'chat-handoff-exchange-executor');
    attribution.dataset.executorAttribution = '';
    attribution.title = tr('执行器：' + name, 'Executor: ' + name);
    var versions = [];
    if (traceVersion.test(text(record.adapterVersion))) versions.push(tr('适配版本 ', 'Adapter ') + text(record.adapterVersion));
    if (traceVersion.test(text(record.agentVersion))) versions.push(tr('智能体版本 ', 'Agent ') + text(record.agentVersion));
    if (versions.length) attribution.title += ' · ' + versions.join(' · ');

    var logo = element('span', 'chat-handoff-exchange-executor-logo');
    logo.dataset.brand = executionLogoFiles[brand] ? brand : 'generic';
    logo.setAttribute('aria-hidden', 'true');
    var image = root.document.createElement('img');
    image.alt = '';
    image.width = 14;
    image.height = 14;
    image.decoding = 'async';
    image.src = 'assets/agent-logos/' + (executionLogoFiles[brand] || 'generic.svg');
    image.addEventListener('error', function () {
      if (!image.dataset.fallback) {
        image.dataset.fallback = 'true';
        image.src = 'assets/agent-logos/generic.svg';
      } else {
        image.remove();
        if (!logo.querySelector('[data-visual-fallback]')) logo.insertAdjacentHTML('beforeend', '<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>');
      }
    });
    logo.appendChild(image);
    attribution.appendChild(logo);
    attribution.appendChild(root.document.createTextNode(' ' + name));
    meta.appendChild(attribution);
  }

  function avatarMarkup(bot, options) {
    if (!bot) return '';
    if (typeof options.avatarMarkup === 'function') {
      try {
        var supplied = options.avatarMarkup(bot);
        return typeof supplied === 'string' ? supplied : '';
      } catch (_) { return ''; }
    }
    if (root.OpenBotAvatars && typeof root.OpenBotAvatars.markup === 'function') {
      return root.OpenBotAvatars.markup(bot.avatar, bot.color, { size: 'list', pose: 'idle' });
    }
    return '';
  }

  function appendAvatar(host, peer, options) {
    host.setAttribute('aria-hidden', 'true');
    var face = element('span', 'chat-handoff-avatar');
    var markup = peer && peer.bot ? avatarMarkup(peer.bot, options) : '';
    if (markup) face.innerHTML = markup;
    else face.classList.add('chat-handoff-avatar--neutral');
    host.appendChild(face);
  }

  function element(tag, className, content) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = content;
    return node;
  }

  function avatarButton(peer, options) {
    var button = element('button', 'chat-handoff-peer-open');
    button.type = 'button';
    button.dataset.handoffOpenBot = peer.id;
    button.dataset.handoffAction = 'open-bot';
    button.setAttribute('aria-label', tr('打开', 'Open') + ' ' + peer.name);
    button.title = peer.name + (peer.deleted ? tr(' · 已删除', ' · Removed') : (!peer.bot ? tr(' · 不可用', ' · Unavailable') : ''));
    button.disabled = !peer.bot || peer.deleted || typeof options.onOpenBot !== 'function';
    var avatar = element('span', 'chat-handoff-peer-avatar');
    appendAvatar(avatar, peer, options);
    button.appendChild(avatar);
    return button;
  }

  function iconControl(tag, icon, label) {
    var control = element(tag, 'chat-handoff-action');
    if (tag === 'button') control.type = 'button';
    control.setAttribute('aria-label', label);
    control.title = label;
    var markup = root.OpenBotIcons && root.OpenBotIcons.svg(icon, true);
    if (markup) control.innerHTML = markup;
    else control.appendChild(element('span', '', icon === 'more' ? '⋯' : icon === 'chat' ? '↔' : '↗'));
    return control;
  }

  function appendPair(host, source, peer, options, direction) {
    var pair = element('span', 'chat-handoff-pair');
    var from = direction === 'sent' ? source : peer;
    var to = direction === 'sent' ? peer : source;
    if (from) pair.appendChild(avatarButton(from, options));
    if (from && to) {
      var arrow = element('span', 'chat-handoff-pair-arrow', '→');
      arrow.setAttribute('aria-hidden', 'true');
      pair.appendChild(arrow);
    }
    if (to) pair.appendChild(avatarButton(to, options));
    host.appendChild(pair);
  }

  function appendTaskDetail(list, item, options, peers, source, direction) {
    var id = text(item.taskId);
    if (!id) return;
    var row = element('li', 'chat-handoff-task');
    row.dataset.handoffTask = id;
    var peerId = text(item.peerId);
    if (!peerId && peers.length === 1) peerId = peers[0].id;
    var peer = peers.filter(function (candidate) { return candidate.id === peerId; })[0];
    if (!peer && peerId) peer = { id: peerId, name: text(item.peerName) || tr('不可用的 Bot', 'Unavailable Bot'), bot: null };
    appendPair(row, source, peer, options, direction);
    var copy = element('div', 'chat-handoff-task-copy');
    var title = text(item.title) || id;
    var meta = element('div', 'chat-handoff-task-meta');
    if (peer) {
      var name = element('span', 'chat-handoff-peer-name', peer.name);
      name.title = peer.name;
      meta.appendChild(name);
      if (peer.deleted || !peer.bot) meta.appendChild(element('span', 'chat-handoff-peer-state', peer.deleted ? tr('已删除', 'Removed') : tr('不可用', 'Unavailable')));
    }
    var status = taskStatus(item);
    if (status) meta.appendChild(element('span', 'chat-handoff-task-status', status));
    copy.appendChild(meta);
    copy.appendChild(element('span', 'chat-handoff-task-title', title));
    row.appendChild(copy);

    var actions = element('div', 'chat-handoff-task-actions');
    var open = iconControl('button', 'external', tr('打开任务：', 'Open task: ') + title);
    open.dataset.handoffOpenTask = id;
    open.dataset.handoffAction = 'open-task';
    open.disabled = typeof options.onOpenTask !== 'function';
    actions.appendChild(open);

    if (peerId) {
      var exchange = iconControl('button', 'chat', tr('查看任务交流：', 'View task exchange: ') + title);
      exchange.dataset.handoffOpenExchange = '';
      exchange.dataset.handoffOpenExchangePeer = peerId;
      exchange.dataset.handoffOpenExchangeTask = id;
      exchange.dataset.handoffAction = 'open-exchange';
      exchange.setAttribute('aria-haspopup', 'dialog');
      exchange.disabled = typeof options.onOpenExchange !== 'function';
      actions.appendChild(exchange);
    }
    var more = element('details', 'chat-handoff-overflow');
    more.dataset.handoffMenuTask = id;
    var summary = iconControl('summary', 'more', tr('更多操作：', 'More actions: ') + title);
    summary.dataset.handoffAction = 'more';
    summary.dataset.handoffMenuTask = id;
    more.appendChild(summary);
    var menu = element('div', 'chat-handoff-menu');
    var copyId = element('button', 'chat-handoff-action', tr('复制 ID', 'Copy ID'));
    copyId.type = 'button';
    copyId.dataset.handoffCopyId = id;
    copyId.dataset.handoffAction = 'copy-id';
    copyId.setAttribute('aria-label', tr('复制任务 ID：', 'Copy task ID: ') + id);
    copyId.disabled = typeof options.onCopyId !== 'function';
    menu.appendChild(copyId);
    more.appendChild(menu);
    actions.appendChild(more);
    row.appendChild(actions);
    list.appendChild(row);
  }

  function buildRow(group, options, botMap, expanded) {
    var row = element('div', 'chat-handoff-row');
    row.dataset.chatHandoff = String(group.id);
    row.dataset.direction = ['sent', 'received', 'returned', 'feedback'].indexOf(group.direction) >= 0 ? group.direction : 'feedback';

    var peers = peersFor(group, botMap);
    var sourceBot = botMap.get(text(options.botId));
    var source = sourceBot ? exchangePeer(sourceBot, options) : null;
    var tasks = tasksFor(group);
    var count = taskCount(group, tasks);
    var summary = element('div', 'chat-handoff-summary');
    if (source) summary.appendChild(avatarButton(source, options));
    summary.appendChild(element('span', 'chat-handoff-label', directionLabel(row.dataset.direction)));
    peers.slice(0, 3).forEach(function (peer) { summary.appendChild(avatarButton(peer, options)); });
    if (peers.length > 3) summary.appendChild(element('span', 'chat-handoff-more', '+' + (peers.length - 3)));
    var toggle = element('button', 'chat-handoff-toggle');
    toggle.type = 'button';
    toggle.dataset.handoffToggle = '';
    toggle.dataset.handoffAction = 'toggle';
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    var detailsId = 'chat-handoff-details-' + (nextId++);
    toggle.setAttribute('aria-controls', detailsId);
    toggle.appendChild(element('span', 'chat-handoff-task-count', count ? tr(count + ' 项任务', count + (count === 1 ? ' task' : ' tasks')) : tr('任务详情', 'Task details')));
    var chevron = element('span', 'chat-handoff-chevron', '⌄');
    chevron.setAttribute('aria-hidden', 'true');
    toggle.appendChild(chevron);
    summary.appendChild(toggle);
    if (peers.length === 1 && tasks.length === 1 && typeof options.onOpenExchange === 'function') {
      var directPeerId = text(tasks[0].peerId) || peers[0].id;
      var directTaskId = text(tasks[0].taskId);
      if (directPeerId && directTaskId) {
        var direct = iconControl('button', 'chat', tr('查看与 ', 'View exchange with ') + peers[0].name);
        direct.dataset.handoffDirectExchange = '';
        direct.dataset.handoffDirectExchangePeer = directPeerId;
        direct.dataset.handoffDirectExchangeTask = directTaskId;
        direct.dataset.handoffAction = 'open-exchange';
        direct.setAttribute('aria-haspopup', 'dialog');
        summary.appendChild(direct);
      }
    }
    row.appendChild(summary);

    var details = element('div', 'chat-handoff-details');
    details.dataset.handoffDetails = '';
    details.id = detailsId;
    details.hidden = !expanded;
    if (tasks.length) {
      var taskList = element('ul', 'chat-handoff-task-list');
      taskList.setAttribute('aria-label', tr('BOT 与任务', 'Bots and tasks'));
      tasks.forEach(function (item) { appendTaskDetail(taskList, item, options, peers, source, row.dataset.direction); });
      details.appendChild(taskList);
    } else {
      details.appendChild(element('p', 'chat-handoff-empty', tr('没有可显示的任务详情。', 'No task details are available.')));
    }
    row.appendChild(details);
    return row;
  }

  function findMessageTimeline(container, messages) {
    return Array.prototype.slice.call(container.querySelectorAll('.msg[data-chat-index]')).map(function (node) {
      var index = Number(node.dataset.chatIndex);
      var message = Array.isArray(messages) && isFinite(index) ? messages[index] : null;
      var at = message && timestamp(message.ts);
      return at == null ? null : { node: node, index: index, at: at };
    }).filter(Boolean).sort(function (a, b) { return a.index - b.index; });
  }

  function insertionSlot(group, timeline) {
    var at = timestamp(group.at);
    if (at == null || !timeline.length) return null;
    var previous = null;
    for (var i = 0; i < timeline.length; i++) {
      if (timeline[i].at <= at) previous = timeline[i];
      else return { side: 'before', node: timeline[i].node };
    }
    return previous ? { side: 'after', node: previous.node } : { side: 'before', node: timeline[0].node };
  }

  function activeFocus(container) {
    var active = root.document.activeElement;
    var row = active && active.closest ? active.closest('[data-chat-handoff]') : null;
    if (!row || !container.contains(row)) return null;
    var task = active.closest('[data-handoff-task]');
    return {
      id: row.dataset.chatHandoff,
      action: active.dataset ? active.dataset.handoffAction : '',
      taskId: active.dataset ? (active.dataset.handoffOpenTask || active.dataset.handoffCopyId || active.dataset.handoffOpenExchangeTask || active.dataset.handoffDirectExchangeTask || active.dataset.handoffMenuTask || (task && task.dataset.handoffTask) || '') : '',
      peerId: active.dataset ? (active.dataset.handoffOpenBot || active.dataset.handoffOpenExchangePeer || active.dataset.handoffDirectExchangePeer || '') : ''
    };
  }

  function restoreFocus(container, saved) {
    if (!saved) return;
    var rows = container.querySelectorAll('[data-chat-handoff]');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row.dataset.chatHandoff !== saved.id) continue;
      var candidates = row.querySelectorAll('[data-handoff-action]');
      for (var j = 0; j < candidates.length; j++) {
        var candidate = candidates[j];
        if (candidate.dataset.handoffAction !== saved.action) continue;
        var task = candidate.closest('[data-handoff-task]');
        if (saved.taskId && candidate.dataset.handoffOpenTask !== saved.taskId && candidate.dataset.handoffCopyId !== saved.taskId && candidate.dataset.handoffOpenExchangeTask !== saved.taskId && candidate.dataset.handoffDirectExchangeTask !== saved.taskId && candidate.dataset.handoffMenuTask !== saved.taskId && (!task || task.dataset.handoffTask !== saved.taskId)) continue;
        if (saved.peerId && candidate.dataset.handoffOpenBot !== saved.peerId && candidate.dataset.handoffOpenExchangePeer !== saved.peerId && candidate.dataset.handoffDirectExchangePeer !== saved.peerId) continue;
        if (!candidate.disabled) candidate.focus({ preventScroll: true });
        return;
      }
    }
  }

  function setExpanded(row, expanded) {
    var toggle = row.querySelector('[data-handoff-toggle]');
    var details = row.querySelector('[data-handoff-details]');
    if (!toggle || !details) return;
    details.hidden = !expanded;
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  function rememberExpanded(container, id, expanded) {
    if (!container || !id) return;
    var expandedIds = expandedByContainer.get(container) || new Set();
    if (expanded) expandedIds.add(String(id));
    else expandedIds.delete(String(id));
    expandedByContainer.set(container, expandedIds);
  }

  function ensureDelegates(container) {
    if (delegates.has(container)) return;
    var click = function (event) {
      var state = states.get(container);
      if (!state || !event.target || !event.target.closest) return;
      var control = event.target.closest('[data-handoff-toggle], [data-handoff-open-task], [data-handoff-open-bot], [data-handoff-copy-id], [data-handoff-open-exchange], [data-handoff-direct-exchange]');
      if (!control || !container.contains(control) || control.disabled) return;
      if (control.hasAttribute('data-handoff-direct-exchange') || control.hasAttribute('data-handoff-open-exchange')) {
        if (typeof state.onOpenExchange === 'function') {
          var peerId = control.dataset.handoffDirectExchangePeer || control.dataset.handoffOpenExchangePeer;
          var taskId = control.dataset.handoffDirectExchangeTask || control.dataset.handoffOpenExchangeTask;
          if (peerId && taskId) {
            var ownerRow = control.closest('[data-chat-handoff]');
            pendingExchangeTrigger = {
              container: container,
              control: control,
              groupId: ownerRow ? ownerRow.dataset.chatHandoff : '',
              action: control.dataset.handoffAction || '',
              direct: control.hasAttribute('data-handoff-direct-exchange'),
              peerId: peerId,
              taskId: taskId
            };
            state.onOpenExchange(peerId, taskId);
          }
        }
        return;
      }
      if (control.hasAttribute('data-handoff-toggle')) {
        var row = control.closest('[data-chat-handoff]');
        if (row) {
          var expanded = control.getAttribute('aria-expanded') !== 'true';
          setExpanded(row, expanded);
          rememberExpanded(container, row.dataset.chatHandoff, expanded);
        }
        return;
      }
      if (control.hasAttribute('data-handoff-open-task') && typeof state.onOpenTask === 'function') state.onOpenTask(control.dataset.handoffOpenTask);
      else if (control.hasAttribute('data-handoff-open-bot') && typeof state.onOpenBot === 'function') state.onOpenBot(control.dataset.handoffOpenBot);
      else if (control.hasAttribute('data-handoff-copy-id') && typeof state.onCopyId === 'function') {
        state.onCopyId(control.dataset.handoffCopyId);
        var menu = control.closest('details.chat-handoff-overflow');
        if (menu) { menu.open = false; menu.querySelector('summary').focus({ preventScroll: true }); }
      }
    };
    var keydown = function (event) {
      if (event.key !== 'Escape' || !event.target || !event.target.closest) return;
      var row = event.target.closest('[data-chat-handoff]');
      if (!row || !container.contains(row)) return;
      var menu = event.target.closest('details.chat-handoff-overflow[open]');
      if (menu) {
        event.preventDefault();
        event.stopPropagation();
        menu.open = false;
        menu.querySelector('summary').focus({ preventScroll: true });
        return;
      }
      var toggle = row.querySelector('[data-handoff-toggle]');
      if (!toggle || toggle.getAttribute('aria-expanded') !== 'true') return;
      event.preventDefault();
      event.stopPropagation();
      setExpanded(row, false);
      rememberExpanded(container, row.dataset.chatHandoff, false);
      toggle.focus({ preventScroll: true });
    };
    var dismissMenus = function (event) {
      Array.prototype.forEach.call(container.querySelectorAll('details.chat-handoff-overflow[open]'), function (menu) {
        if (!menu.contains(event.target)) menu.open = false;
      });
    };
    container.addEventListener('click', click);
    container.addEventListener('keydown', keydown);
    root.document.addEventListener('pointerdown', dismissMenus);
    root.document.addEventListener('focusin', dismissMenus);
    delegates.set(container, { click: click, keydown: keydown, dismissMenus: dismissMenus });
  }

  function botId(bot) { return bot && bot.id != null ? String(bot.id) : ''; }

  function exchangePeer(bot, options) {
    var deleted = !!(bot && bot.deleted === true);
    var peer = {
      id: botId(bot),
      bot: deleted ? null : bot,
      deleted: deleted,
      name: text(bot && bot.name) || (deleted ? tr('已删除的 Bot', 'Removed Bot') : tr('不可用的 Bot', 'Unavailable Bot'))
    };
    return peer;
  }

  function formatExchangeTime(value, withDate) {
    var at = timestamp(value);
    if (at == null) return '';
    try {
      var locale = (root.OpenBotI18n && root.OpenBotI18n.locale) || root.document.documentElement.lang || undefined;
      return new Intl.DateTimeFormat(locale, withDate
        ? { year: 'numeric', month: 'short', day: 'numeric' }
        : { hour: 'numeric', minute: '2-digit' }).format(new Date(at));
    } catch (_) { return ''; }
  }

  function exchangeItems(items) {
    return (Array.isArray(items) ? items : []).map(function (item, index) {
      return { item: item || {}, index: index, at: timestamp(item && item.at) };
    }).filter(function (record) {
      var kind = record.item.kind;
      return kind === 'dispatch' || kind === 'result' || kind === 'feedback';
    }).sort(function (a, b) {
      if (a.at == null && b.at == null) return a.index - b.index;
      if (a.at == null) return 1;
      if (b.at == null) return -1;
      return a.at - b.at || a.index - b.index;
    });
  }

  function exchangeKind(kind) {
    if (kind === 'dispatch') return tr('任务指令', 'Task instruction');
    if (kind === 'result') return tr('任务结果', 'Task result');
    return tr('任务反馈', 'Task feedback');
  }

  function exchangeActor(item, sourceBot, peerBot) {
    var from = text(item.fromBotId);
    if (from && from === botId(sourceBot)) return { bot: sourceBot, side: 'source' };
    if (from && from === botId(peerBot)) return { bot: peerBot, side: 'peer' };
    return { bot: null, side: 'unknown' };
  }

  function exchangeName(actor) {
    return actor.bot
      ? (text(actor.bot.name) || tr('Bot', 'Bot'))
      : tr('未知的 Bot', 'Unknown Bot');
  }

  function appendExchangeItem(list, record, state) {
    var item = record.item;
    var bodyText = typeof item.text === 'string' ? item.text : (typeof item.text === 'number' ? String(item.text) : '');
    var errorText = detailText(item.error) || (item.error === true ? tr('任务发生错误。', 'The task reported an error.') : '');
    var resultError = detailText(item.resultError) || (item.resultError === true ? tr('任务结果发生错误。', 'The task result reported an error.') : '');
    var status = taskStatus(item);
    var pending = item.resultPending === true || !!(item.executionEvent && item.executionEvent.phase === 'result-pending');
    var hasVisibleContent = !!bodyText.trim() || !!errorText || !!resultError || !!status || pending;
    if (!hasVisibleContent) return;

    var actor = exchangeActor(item, state.options.sourceBot, state.options.peerBot);
    var name = exchangeName(actor);
    if (record.at != null) {
      var dateLabel = formatExchangeTime(record.at, true);
      if (dateLabel && dateLabel !== state.lastDate) {
        var separator = element('div', 'chat-handoff-exchange-date', dateLabel);
        separator.setAttribute('role', 'separator');
        list.appendChild(separator);
        state.lastDate = dateLabel;
      }
    }

    var row = element('article', 'chat-handoff-exchange-item');
    row.dataset.kind = item.kind;
    row.dataset.side = actor.side;
    if (item.taskId != null) row.dataset.taskId = text(item.taskId);
    var face = avatarButton(exchangePeer(actor.bot, state.options), state.options);
    face.classList.add('chat-handoff-exchange-avatar');
    face.dataset.handoffExchangeBot = botId(actor.bot);
    face.dataset.handoffExchangeOrigin = item.kind + ':' + text(item.taskId) + ':' + record.at;
    row.appendChild(face);

    var body = element('div', 'chat-handoff-exchange-body');
    var meta = element('div', 'chat-handoff-exchange-meta');
    meta.appendChild(element('strong', 'chat-handoff-exchange-name', name));
    meta.appendChild(element('span', 'chat-handoff-exchange-kind', exchangeKind(item.kind)));
    appendExecutionAttribution(meta, item);
    if (record.at != null) {
      var time = formatExchangeTime(record.at, false);
      if (time) meta.appendChild(element('time', 'chat-handoff-exchange-time', time));
    }
    body.appendChild(meta);

    if (bodyText.trim()) body.appendChild(element('div', 'chat-handoff-exchange-bubble', bodyText));
    if (errorText) body.appendChild(element('div', 'chat-handoff-exchange-error', errorText));
    if (resultError) body.appendChild(element('div', 'chat-handoff-exchange-error', resultError));

    var badges = element('div', 'chat-handoff-exchange-badges');
    if (status && !(pending && status === tr('结果尚未保存', 'Result not saved yet'))) badges.appendChild(element('span', 'chat-handoff-exchange-status', status));
    if (pending) badges.appendChild(element('span', 'chat-handoff-exchange-pending', tr('结果尚未保存', 'Result not saved yet')));
    if (badges.childNodes.length) body.appendChild(badges);

    var taskId = text(item.taskId);
    if (taskId && typeof state.options.onOpenTask === 'function') {
      var openTask = iconControl('button', 'external', tr('打开任务：', 'Open task: ') + taskId);
      openTask.classList.add('chat-handoff-exchange-open-task');
      openTask.dataset.handoffExchangeTask = taskId;
      openTask.setAttribute('aria-label', tr('打开任务：', 'Open task: ') + taskId);
      body.appendChild(openTask);
    }
    row.appendChild(body);
    list.appendChild(row);
  }

  function buildExchangeContent(state) {
    var source = exchangePeer(state.options.sourceBot, state.options);
    var peer = exchangePeer(state.options.peerBot, state.options);
    var header = element('div', 'chat-handoff-exchange-heading');
    header.id = state.titleId;
    header.appendChild(element('span', 'chat-handoff-exchange-heading-title', tr('任务交流', 'Task exchange')));
    var pair = element('div', 'chat-handoff-exchange-pair');
    var sourceFace = avatarButton(source, state.options);
    sourceFace.dataset.handoffExchangeBot = source.id;
    sourceFace.dataset.handoffExchangeOrigin = 'header';
    pair.appendChild(sourceFace);
    pair.appendChild(element('span', 'chat-handoff-exchange-pair-name', source.name));
    var peerFace = avatarButton(peer, state.options);
    peerFace.dataset.handoffExchangeBot = peer.id;
    peerFace.dataset.handoffExchangeOrigin = 'header';
    pair.appendChild(peerFace);
    pair.appendChild(element('span', 'chat-handoff-exchange-pair-name', peer.name));
    header.appendChild(pair);
    header.appendChild(element('p', 'chat-handoff-exchange-note', tr('仅显示已留存的任务指令与结果。', 'Only retained task instructions and results are shown.')));
    state.heading.replaceChildren(header);

    var content = state.content;
    content.replaceChildren();
    state.lastDate = '';
    if (state.options.loading === true) {
      var loading = element('p', 'chat-handoff-exchange-state', tr('正在读取已留存的交流…', 'Loading retained exchange…'));
      loading.setAttribute('role', 'status');
      content.appendChild(loading);
      return;
    }
    if (state.options.error) {
      var error = element('p', 'chat-handoff-exchange-error', detailText(state.options.error) || tr('无法读取这段任务交流。', 'Could not load this task exchange.'));
      error.setAttribute('role', 'alert');
      content.appendChild(error);
      return;
    }

    var taskCountValue = Number(state.options.taskCount);
    var omittedValue = Number(state.options.omittedTasks);
    if (isFinite(taskCountValue) && taskCountValue >= 0 && isFinite(omittedValue) && omittedValue > 0) {
      content.appendChild(element('p', 'chat-handoff-exchange-omitted', tr('显示 ' + taskCountValue + ' 项任务；另有 ' + omittedValue + ' 项未显示。', 'Showing ' + taskCountValue + ' tasks; ' + omittedValue + ' omitted.')));
    }
    var timeline = element('div', 'chat-handoff-exchange-timeline');
    timeline.dataset.chatHandoffExchangeTimeline = '';
    timeline.setAttribute('aria-label', tr('任务交流记录', 'Task exchange history'));
    var ordered = exchangeItems(state.options.items);
    ordered.forEach(function (record) { appendExchangeItem(timeline, record, state); });
    if (!timeline.querySelector('.chat-handoff-exchange-item')) {
      timeline.appendChild(element('p', 'chat-handoff-exchange-empty', tr('没有可显示的已留存任务指令或结果。', 'No retained task instructions or results are available.')));
    }
    content.appendChild(timeline);
  }

  function exchangeFocusables(dialog) {
    return Array.prototype.slice.call(dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(function (node) {
      return !node.hidden && node.getAttribute('aria-hidden') !== 'true';
    });
  }

  function closeExchange(notify) {
    var state = exchangeState;
    if (!state) { pendingExchangeTrigger = null; return false; }
    exchangeState = null;
    if (state.overlay.parentNode) state.overlay.parentNode.removeChild(state.overlay);
    var opener = state.opener && state.opener.isConnected ? state.opener : findEquivalentExchangeOpener(state.openerRef);
    if (opener && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
    if (notify && typeof state.options.onClose === 'function') state.options.onClose();
    return true;
  }

  function findEquivalentExchangeOpener(reference) {
    if (!reference || !reference.container || !reference.container.isConnected) return null;
    var rows = reference.container.querySelectorAll('[data-chat-handoff]');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row.dataset.chatHandoff !== reference.groupId) continue;
      var candidates = row.querySelectorAll('[data-handoff-action]');
      for (var j = 0; j < candidates.length; j++) {
        var candidate = candidates[j];
        if (candidate.disabled || candidate.dataset.handoffAction !== reference.action) continue;
        var taskId = candidate.dataset.handoffDirectExchangeTask || candidate.dataset.handoffOpenExchangeTask || '';
        var peerId = candidate.dataset.handoffDirectExchangePeer || candidate.dataset.handoffOpenExchangePeer || '';
        if (taskId === reference.taskId && peerId === reference.peerId) {
          if (!reference.direct) {
            setExpanded(row, true);
            rememberExpanded(reference.container, row.dataset.chatHandoff, true);
          }
          return candidate;
        }
      }
    }
    return null;
  }

  function createExchangeShell(opener, openerRef) {
    var overlay = element('div', 'chat-handoff-exchange-scrim');
    overlay.dataset.chatHandoffExchange = '';
    var dialog = element('section', 'chat-handoff-exchange-dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'chat-handoff-exchange-title-' + nextId);
    var titleId = 'chat-handoff-exchange-title-' + (nextId++);
    dialog.setAttribute('aria-labelledby', titleId);
    var heading = element('div', 'chat-handoff-exchange-header');
    var headingContent = element('div', 'chat-handoff-exchange-header-content');
    var close = iconControl('button', 'close', tr('关闭任务交流', 'Close task exchange'));
    close.classList.add('chat-handoff-exchange-close');
    close.dataset.chatHandoffExchangeClose = '';
    close.setAttribute('aria-label', tr('关闭任务交流', 'Close task exchange'));
    heading.appendChild(headingContent);
    heading.appendChild(close);
    var content = element('div', 'chat-handoff-exchange-content');
    dialog.appendChild(heading);
    dialog.appendChild(content);
    overlay.appendChild(dialog);
    var state = {
      overlay: overlay,
      dialog: dialog,
      heading: headingContent,
      content: content,
      close: close,
      opener: opener,
      openerRef: openerRef,
      titleId: titleId,
      options: {},
      loadedOnce: false,
      lastDate: ''
    };
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay || (event.target.closest && event.target.closest('[data-chat-handoff-exchange-close]'))) closeExchange(true);
    });
    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeExchange(true);
        return;
      }
      if (event.key !== 'Tab') return;
      event.stopPropagation();
      var focusables = exchangeFocusables(dialog);
      if (!focusables.length) {
        event.preventDefault();
        close.focus();
        return;
      }
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && (root.document.activeElement === first || !dialog.contains(root.document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (root.document.activeElement === last || !dialog.contains(root.document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    });
    dialog.addEventListener('click', function (event) {
      var bot = event.target && event.target.closest ? event.target.closest('[data-handoff-exchange-bot]') : null;
      if (bot && dialog.contains(bot) && !bot.disabled && exchangeState && typeof exchangeState.options.onOpenBot === 'function') {
        var onOpenBot = exchangeState.options.onOpenBot;
        closeExchange(true);
        onOpenBot(bot.dataset.handoffExchangeBot);
        return;
      }
      var button = event.target && event.target.closest ? event.target.closest('[data-handoff-exchange-task]') : null;
      if (!button || !dialog.contains(button) || !exchangeState) return;
      if (typeof exchangeState.options.onOpenTask === 'function') exchangeState.options.onOpenTask(button.dataset.handoffExchangeTask);
    });
    return state;
  }

  function openExchange(options) {
    options = options || {};
    var opener = root.document.activeElement;
    var openerRef = pendingExchangeTrigger;
    pendingExchangeTrigger = null;
    var state = exchangeState;
    var isNew = !state;
    var samePair = false;
    var oldScrollTop = 0;
    var oldFocusTask = '';
    var oldFocusBot = '';
    var oldFocusOrigin = '';
    if (state) {
      oldScrollTop = state.content.scrollTop;
      var active = root.document.activeElement;
      oldFocusTask = active && active.dataset ? (active.dataset.handoffExchangeTask || '') : '';
      oldFocusBot = active && active.dataset ? (active.dataset.handoffExchangeBot || '') : '';
      oldFocusOrigin = active && active.dataset ? (active.dataset.handoffExchangeOrigin || '') : '';
      samePair = botId(state.options.sourceBot) === botId(options.sourceBot) && botId(state.options.peerBot) === botId(options.peerBot);
      if (!samePair) {
        oldScrollTop = 0;
        oldFocusTask = '';
        oldFocusBot = '';
        state.loadedOnce = false;
      }
    } else {
      if (openerRef && openerRef.control && openerRef.control.isConnected) opener = openerRef.control;
      state = createExchangeShell(opener, openerRef);
      exchangeState = state;
      root.document.body.appendChild(state.overlay);
    }
    state.options = options;
    var completeLoad = options.loading !== true && !options.error;
    var shouldSelectTask = completeLoad && !state.loadedOnce;
    buildExchangeContent(state);
    if (isNew) state.close.focus({ preventScroll: true });
    else if (!shouldSelectTask) {
      state.content.scrollTop = oldScrollTop;
      if (oldFocusTask) {
        var buttons = state.dialog.querySelectorAll('[data-handoff-exchange-task]');
        var restored = false;
        for (var i = 0; i < buttons.length; i++) {
          if (buttons[i].dataset.handoffExchangeTask === oldFocusTask) { buttons[i].focus({ preventScroll: true }); restored = true; break; }
        }
        if (!restored && !state.dialog.contains(root.document.activeElement)) state.close.focus({ preventScroll: true });
      }
      if (oldFocusBot) {
        var faces = state.dialog.querySelectorAll('[data-handoff-exchange-bot]');
        for (var f = 0; f < faces.length; f++) {
          if (faces[f].dataset.handoffExchangeBot === oldFocusBot && faces[f].dataset.handoffExchangeOrigin === oldFocusOrigin && !faces[f].disabled) { faces[f].focus({ preventScroll: true }); break; }
        }
        if (!state.dialog.contains(root.document.activeElement)) state.close.focus({ preventScroll: true });
      }
    }
    if (completeLoad && !state.loadedOnce) {
      state.loadedOnce = true;
      var selectedTaskId = text(options.selectedTaskId);
      if (selectedTaskId) {
        var articles = state.content.querySelectorAll('article[data-task-id]');
        for (var j = 0; j < articles.length; j++) {
          if (articles[j].dataset.taskId !== selectedTaskId) continue;
          var contentBounds = state.content.getBoundingClientRect();
          var articleBounds = articles[j].getBoundingClientRect();
          state.content.scrollTop += articleBounds.top - contentBounds.top - Math.max(0, (state.content.clientHeight - articleBounds.height) / 2);
          break;
        }
      }
    }
    if (!isNew && shouldSelectTask && !state.dialog.contains(root.document.activeElement)) state.close.focus({ preventScroll: true });
    return state.dialog;
  }

  function removeOwn(container) {
    Array.prototype.forEach.call(container.querySelectorAll('[data-chat-handoff]'), function (node) { node.remove(); });
    Array.prototype.forEach.call(container.querySelectorAll('[data-chat-handoff-section]'), function (node) { node.remove(); });
  }

  function groupFingerprint(group) {
    var items = Array.isArray(group.items) ? group.items : [];
    return [
      String(group.id), text(group.direction), timestamp(group.at), uniqueValues(group.taskIds), uniqueValues(group.peerIds),
      items.map(function (item) {
        item = item || {};
        return [text(item.taskId), text(item.peerId), text(item.peerName), item.deleted === true,
          text(item.title), text(item.status), text(item.phase), taskStatus(item), timestamp(item.at),
          typeof item.text === 'string' ? item.text : text(item.text), detailText(item.error), detailText(item.resultError), item.resultPending === true];
      })
    ];
  }

  function mountFingerprint(groups, bots, options) {
    var botValues = (Array.isArray(bots) ? bots : []).filter(function (bot) { return bot && bot.id != null; }).map(function (bot) {
      return [String(bot.id), text(bot.name), text(bot.avatar), text(bot.color), bot.deleted === true];
    }).sort(function (a, b) { return a[0].localeCompare(b[0]); });
    var behavior = [typeof options.onOpenTask === 'function', typeof options.onOpenBot === 'function', typeof options.onCopyId === 'function', typeof options.onOpenExchange === 'function'];
    return JSON.stringify([text(options.botId), tr('任务', 'Tasks'), groups.map(groupFingerprint), botValues, behavior]);
  }

  function sameTimeline(a, b) {
    if (!a || a.length !== b.length) return false;
    for (var i = 0; i < b.length; i++) {
      if (a[i].node !== b[i].node || a[i].index !== b[i].index || a[i].at !== b[i].at) return false;
    }
    return true;
  }

  function mount(container, options) {
    if (!container) return;
    options = options || {};
    var oldExpanded = new Set(expandedByContainer.get(container) || []);
    Array.prototype.forEach.call(container.querySelectorAll('[data-chat-handoff]'), function (row) {
      var toggle = row.querySelector('[data-handoff-toggle]');
      if (toggle && toggle.getAttribute('aria-expanded') === 'true') oldExpanded.add(row.dataset.chatHandoff);
    });
    var focused = activeFocus(container);
    var openMenus = Array.prototype.map.call(container.querySelectorAll('details.chat-handoff-overflow[open]'), function (menu) {
      return [menu.closest('[data-chat-handoff]').dataset.chatHandoff, menu.dataset.handoffMenuTask];
    });
    var groupList = Array.isArray(options.groups) ? options.groups : [];
    var previousOrder = new Map();
    groupList.forEach(function (group, index) { if (group && group.id != null && !previousOrder.has(String(group.id))) previousOrder.set(String(group.id), index); });
    var groups = groupList.filter(function (group) { return group && group.id != null; }).slice().sort(function (a, b) {
      var aAt = timestamp(a.at), bAt = timestamp(b.at);
      if (aAt != null && bAt != null && aAt !== bAt) return aAt - bAt;
      if (aAt != null && bAt == null) return -1;
      if (aAt == null && bAt != null) return 1;
      return previousOrder.get(String(a.id)) - previousOrder.get(String(b.id));
    });
    var seen = new Set();
    groups = groups.filter(function (group) {
      var id = String(group.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    oldExpanded = new Set(Array.from(oldExpanded).filter(function (id) { return seen.has(id); }));
    expandedByContainer.set(container, oldExpanded);

    var state = {
      onOpenTask: options.onOpenTask,
      onOpenBot: options.onOpenBot,
      onCopyId: options.onCopyId,
      onOpenExchange: options.onOpenExchange
    };
    states.set(container, state);
    ensureDelegates(container);
    var botMap = makeBotMap(options.bots);
    var timeline = findMessageTimeline(container, options.messages);
    var fingerprint = mountFingerprint(groups, options.bots, options);
    var noTimestampCount = groups.filter(function (group) { return insertionSlot(group, timeline) == null; }).length;
    var currentRows = container.querySelectorAll('[data-chat-handoff]');
    var currentSections = container.querySelectorAll('[data-chat-handoff-section]');
    var expectedIds = new Set(groups.map(function (group) { return String(group.id); }));
    var currentIds = new Set(Array.prototype.map.call(currentRows, function (row) { return row.dataset.chatHandoff; }));
    var snapshot = mountSnapshots.get(container);
    var rowsMatch = currentRows.length === groups.length && currentIds.size === expectedIds.size && Array.from(expectedIds).every(function (id) { return currentIds.has(id); });
    var sectionsMatch = currentSections.length === (noTimestampCount ? 1 : 0);
    if (snapshot && snapshot.fingerprint === fingerprint && sameTimeline(snapshot.timeline, timeline) && rowsMatch && sectionsMatch) return;

    removeOwn(container);
    if (!groups.length) {
      mountSnapshots.set(container, { fingerprint: fingerprint, timeline: timeline });
      return;
    }

    var insertions = [];
    var noTimestamp = [];
    groups.forEach(function (group) {
      var row = buildRow(group, options, botMap, oldExpanded.has(String(group.id)));
      var slot = insertionSlot(group, timeline);
      if (slot) insertions.push({ slot: slot, row: row });
      else noTimestamp.push(row);
    });

    var slotGroups = new Map();
    insertions.forEach(function (insertion) {
      var key = insertion.slot.side + ':' + timeline.findIndex(function (item) { return item.node === insertion.slot.node; });
      if (!slotGroups.has(key)) slotGroups.set(key, { slot: insertion.slot, rows: [] });
      slotGroups.get(key).rows.push(insertion.row);
    });
    slotGroups.forEach(function (entry) {
      var fragment = root.document.createDocumentFragment();
      entry.rows.forEach(function (row) { fragment.appendChild(row); });
      if (entry.slot.side === 'before') entry.slot.node.before(fragment);
      else entry.slot.node.after(fragment);
    });

    if (noTimestamp.length) {
      var section = element('section', 'chat-handoff-section');
      section.dataset.chatHandoffSection = '';
      section.setAttribute('aria-label', tr('Bot 任务动态', 'Bot task updates'));
      section.appendChild(element('h3', 'chat-handoff-section-heading', tr('Bot 任务动态', 'Bot task updates')));
      noTimestamp.forEach(function (row) { section.appendChild(row); });
      container.appendChild(section);
    }
    Array.prototype.forEach.call(container.querySelectorAll('details.chat-handoff-overflow'), function (menu) {
      menu.open = openMenus.some(function (saved) { return saved[0] === menu.closest('[data-chat-handoff]').dataset.chatHandoff && saved[1] === menu.dataset.handoffMenuTask; });
    });
    restoreFocus(container, focused);
    mountSnapshots.set(container, { fingerprint: fingerprint, timeline: timeline });
  }

  function clear(container) {
    if (!container) return;
    removeOwn(container);
    states.delete(container);
    mountSnapshots.delete(container);
    expandedByContainer.delete(container);
    if (pendingExchangeTrigger && pendingExchangeTrigger.container === container) pendingExchangeTrigger = null;
    var listeners = delegates.get(container);
    if (listeners) {
      container.removeEventListener('click', listeners.click);
      container.removeEventListener('keydown', listeners.keydown);
      root.document.removeEventListener('pointerdown', listeners.dismissMenus);
      root.document.removeEventListener('focusin', listeners.dismissMenus);
      delegates.delete(container);
    }
  }

  root.OpenBotChatHandoffs = {
    mount: mount,
    clear: clear,
    openExchange: openExchange,
    closeExchange: function () { return closeExchange(false); }
  };
})(window);
