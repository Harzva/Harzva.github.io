/*
 * Bot-to-Bot delegation graph.
 *
 * The main process owns the projection. This file only lays out the entity
 * nodes and aggregated relations, then exposes retained task details when a
 * node or arrow is selected. Tasks never become canvas nodes.
 */
(function (global) {
  'use strict';
  function tr(zh,en){return global.OpenBotI18n?global.OpenBotI18n.t(zh,en):zh;}
  function countLabel(value,zh,one,many){
    var english=typeof window==='object'&&window.OpenBotI18n&&window.OpenBotI18n.locale==='en';
    return english?new Intl.NumberFormat('en').format(Number(value))+' '+(Number(value)===1?one:(many||one+'s')):value+zh;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var STATUS_LABELS = {
    queued: tr('排队中',"Queued"),
    running: tr('执行中',"Running"),
    done: tr('已完成',"Completed"),
    failed: tr('失败',"Failed"),
    canceled: tr('已取消',"Canceled"),
    interrupted: tr('已中断',"Interrupted")
  };

  function text(value) { return String(value == null ? '' : value).trim(); }
  function create(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (value != null) node.textContent = value;
    return node;
  }
  function svg(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }
  function taskId(task) { return text(task && (task.taskId || task.id)); }
  function taskTitle(task) { return text(task && task.title) || taskId(task) || tr('未命名任务',"Untitled task"); }
  function statusLabel(task) {
    var status = text(task && task.status);
    return STATUS_LABELS[status] || text(task && task.statusText) || status || tr('等待',"Waiting");
  }
  function statusClass(status) { return 'delegation-status-' + (text(status) || 'unknown').replace(/[^a-z0-9_-]/gi, ''); }
  function isErrorTask(task) {
    return !!(task && (task.resultError || task.status === 'failed' || task.status === 'interrupted' || task.status === 'canceled'));
  }
  function taskSummary(task) {
    if (!task) return '';
    if (task.resultError) return tr('结果保存失败：',"Failed to save result: ") + text(task.resultError);
    if (task.resultPending) return tr('结果待保存；已有结果会在下次启动时补偿。',"Result pending save. Existing results will be recovered at the next launch.");
    var status = text(task.status);
    var value = (status === 'failed' || status === 'interrupted' || status === 'canceled')
      ? (task.error || task.preview) : (task.preview || task.error);
    return text(value).replace(/\s+/g, ' ').slice(0, 240);
  }
  function unique(values) {
    var seen = Object.create(null), out = [];
    (Array.isArray(values) ? values : []).forEach(function (value) {
      var id = text(value);
      if (!id || seen[id]) return;
      seen[id] = true;
      out.push(id);
    });
    return out;
  }
  function nodeKind(node) {
    var kind = text(node && node.kind);
    return kind === 'bot' || kind === 'user' || kind === 'unknown' ? kind : 'unknown';
  }
  function nodeLabel(node) {
    var kind = nodeKind(node);
    if (kind === 'user') return text(node && node.label) || tr('你',"You");
    if (kind === 'unknown') return text(node && node.label) || tr('来源未记录',"Source not recorded");
    return text(node && node.label) || text(node && node.botId) || tr('未知 Bot',"Unknown Bot");
  }
  function nodeKindLabel(node) {
    var kind = nodeKind(node);
    if (kind === 'user') return tr('用户',"User");
    if (kind === 'unknown') return tr('来源未记录',"Source not recorded");
    return node && node.missing ? tr('Bot · 不在当前列表',"Bot · Not in current list") : 'Bot';
  }
  function nodeMap(nodes) {
    var map = Object.create(null);
    (Array.isArray(nodes) ? nodes : []).forEach(function (node) {
      if (node && text(node.id)) map[text(node.id)] = node;
    });
    return map;
  }
  function taskMap(tasks) {
    var map = Object.create(null);
    (Array.isArray(tasks) ? tasks : []).forEach(function (task) {
      var id = taskId(task);
      if (id) map[id] = task;
    });
    return map;
  }
  function normalize(projection) {
    var nodes = Array.isArray(projection && projection.nodes) ? projection.nodes.filter(function (node) {
      return node && text(node.id) && (node.kind === 'bot' || node.kind === 'user' || node.kind === 'unknown');
    }) : [];
    var tasks = Array.isArray(projection && projection.tasks) ? projection.tasks.filter(Boolean) : [];
    var byNode = nodeMap(nodes), byTask = taskMap(tasks);
    var edges = Array.isArray(projection && projection.edges) ? projection.edges.filter(function (edge) {
      return edge && text(edge.source) && text(edge.target) && byNode[text(edge.source)] && byNode[text(edge.target)];
    }).map(function (edge) {
      var copy = Object.assign({}, edge);
      copy.id = text(copy.id) || 'relation:' + text(copy.source) + '>' + text(copy.target);
      copy.taskIds = unique(copy.taskIds);
      return copy;
    }) : [];
    return { nodes: nodes, edges: edges, tasks: tasks, byNode: byNode, byTask: byTask, stats: projection && projection.stats || {} };
  }

  function neutralAvatar(kind) {
    var wrap = create('span', 'delegation-neutral-avatar delegation-neutral-' + (kind === 'user' ? 'user' : 'unknown'));
    wrap.setAttribute('aria-hidden', 'true');
    var icon = svg('svg', { viewBox: '0 0 24 24', focusable: 'false' });
    if (kind === 'user') {
      icon.appendChild(svg('circle', { cx: '12', cy: '8', r: '3.2' }));
      icon.appendChild(svg('path', { d: 'M5.2 19c.7-3.2 3.1-5 6.8-5s6.1 1.8 6.8 5' }));
    } else {
      icon.appendChild(svg('circle', { cx: '12', cy: '12', r: '8.2' }));
      icon.appendChild(svg('path', { d: 'M9.2 9.2c.5-1.1 1.5-1.8 2.8-1.8 1.7 0 2.8 1 2.8 2.4 0 1.8-1.8 2.1-2.6 3.2-.3.4-.4.8-.4 1.2' }));
      icon.appendChild(svg('circle', { cx: '12', cy: '17.2', r: '0.8' }));
    }
    wrap.appendChild(icon);
    return wrap;
  }
  function appendAvatar(parent, node, options) {
    var kind = nodeKind(node);
    if (kind === 'bot' && !node.missing && options && typeof options.avatarMarkup === 'function') {
      var markup = options.avatarMarkup(node, !!(options.activeNodeId && options.activeNodeId === node.id));
      if (markup) {
        var holder = create('span', 'delegation-node-avatar');
        holder.innerHTML = markup;
        parent.appendChild(holder);
        return;
      }
    }
    var neutral = create('span', 'delegation-node-avatar');
    neutral.appendChild(neutralAvatar(kind));
    parent.appendChild(neutral);
  }
  function sourceName(task, nodes) {
    var source = task && nodes[text(task.sourceNodeId)];
    return source ? nodeLabel(source) : (text(task && (task.delegatorBotName || task.sourceLabel)) || tr('来源未记录',"Source not recorded"));
  }
  function targetName(task, nodes) {
    var target = task && nodes[text(task.targetNodeId)];
    return target ? nodeLabel(target) : (text(task && (task.botName || task.botId)) || tr('接收 Bot 未记录',"Recipient Bot not recorded"));
  }
  function appendLabelValue(parent, label, value, extraClass) {
    var row = create('div', 'delegation-detail-row');
    row.appendChild(create('span', 'delegation-detail-label', label));
    row.appendChild(create('span', 'delegation-detail-value' + (extraClass ? ' ' + extraClass : ''), value));
    parent.appendChild(row);
  }

  function renderTaskDetail(detail, task, normalized, onOpenTask, backSelection, onTaskSelect) {
    detail.innerHTML = '';
    if (!task) {
      detail.appendChild(create('div', 'delegation-detail-empty', tr('选择一个机器人或箭头查看关联任务。',"Select a Bot or arrow to view related tasks.")));
      return;
    }
    if (typeof onTaskSelect === 'function') onTaskSelect(task);
    var head = create('div', 'delegation-detail-head');
    var titleWrap = create('div', 'delegation-detail-title-wrap is-selected');
    titleWrap.dataset.graphTask = taskId(task);
    titleWrap.tabIndex = 0;
    titleWrap.setAttribute('aria-label', tr('当前任务 ',"Current task: ") + taskTitle(task));
    titleWrap.appendChild(create('div', 'delegation-detail-kicker', tr('任务详情',"Task details")));
    titleWrap.appendChild(create('h4', 'delegation-detail-title', taskTitle(task)));
    head.appendChild(titleWrap);
    head.appendChild(create('span', 'delegation-status ' + statusClass(task.status), statusLabel(task)));
    detail.appendChild(head);
    if (backSelection) {
      var back = create('button', 'delegation-detail-back', tr('返回关系详情',"Back to relationship details"));
      back.type = 'button';
      back.addEventListener('click', function () { renderSelectionDetail(detail, backSelection, normalized, onOpenTask, onTaskSelect); });
      detail.appendChild(back);
    }
    var meta = create('div', 'delegation-detail-meta');
    appendLabelValue(meta, tr('发起者',"Initiator"), sourceName(task, normalized.byNode), task.sourceNodeId === 'source:unknown' ? 'is-unknown' : '');
    appendLabelValue(meta, tr('接收 Bot',"Recipient Bot"), targetName(task, normalized.byNode), task.botMissing ? 'is-missing' : '');
    appendLabelValue(meta, tr('执行器',"Executor"), text(task.agentName) || tr('执行器未记录',"Executor not recorded"));
    detail.appendChild(meta);
    var summary = taskSummary(task);
    if (summary) {
      var result = create('div', 'delegation-detail-result' + (isErrorTask(task) ? ' is-error' : ''));
      result.appendChild(create('div', 'delegation-detail-result-label', isErrorTask(task) ? tr('说明',"Description") : tr('结果摘要',"Result summary")));
      result.appendChild(create('div', 'delegation-detail-result-text', summary));
      detail.appendChild(result);
    }
    var actions = create('div', 'delegation-detail-actions');
    var open = create('button', 'btn delegation-open-session', tr('打开原 Bot 会话',"Open original Bot chat"));
    open.type = 'button';
    if (text(task.botId)) open.dataset.graphOpen = text(task.botId);
    if (task.botMissing || !text(task.botId)) {
      open.disabled = true;
      open.title = tr('原 Bot 不在当前列表，无法打开会话',"The original Bot is not in the current list. Its chat cannot be opened.");
      open.textContent = tr('原 Bot 不在当前列表',"Original Bot is not in the current list");
    } else if (typeof onOpenTask === 'function') {
      open.addEventListener('click', function () { onOpenTask(task); });
    }
    actions.appendChild(open);
    detail.appendChild(actions);
  }
  function appendTaskList(detail, tasks, normalized, selection, onOpenTask, onTaskSelect) {
    var list = create('div', 'delegation-detail-task-list');
    tasks.forEach(function (task) {
      var button = create('button', 'delegation-detail-task');
      button.type = 'button';
      button.dataset.graphTask = taskId(task);
      button.setAttribute('aria-label', tr('查看任务 ',"View task: ") + taskTitle(task));
      var top = create('span', 'delegation-detail-task-top');
      top.appendChild(create('span', 'delegation-detail-task-title', taskTitle(task)));
      top.appendChild(create('span', 'delegation-status ' + statusClass(task.status), statusLabel(task)));
      button.appendChild(top);
      button.appendChild(create('span', 'delegation-detail-task-flow', sourceName(task, normalized.byNode) + ' → ' + targetName(task, normalized.byNode)));
      var summary = taskSummary(task);
      if (summary) button.appendChild(create('span', 'delegation-detail-task-summary' + (isErrorTask(task) ? ' is-error' : ''), summary));
      button.addEventListener('click', function () { renderTaskDetail(detail, task, normalized, onOpenTask, selection, onTaskSelect); });
      list.appendChild(button);
    });
    detail.appendChild(list);
  }
  function selectionTitle(selection, normalized) {
    if (selection.type === 'relation') return nodeLabel(normalized.byNode[selection.edge.source]) + ' → ' + nodeLabel(normalized.byNode[selection.edge.target]);
    return nodeLabel(selection.node);
  }
  function renderSelectionDetail(detail, selection, normalized, onOpenTask, onTaskSelect) {
    // A node/relation selection supersedes any task that was previously open.
    // Clear the parent selection before rebuilding the list so a later live
    // task push cannot restore the stale task detail over this selection.
    if (typeof onTaskSelect === 'function') onTaskSelect(null);
    detail.innerHTML = '';
    var head = create('div', 'delegation-detail-head');
    var titleWrap = create('div', 'delegation-detail-title-wrap');
    titleWrap.appendChild(create('div', 'delegation-detail-kicker', selection.type === 'relation' ? tr('关系详情',"Relationship details") : tr('机器人详情',"Bot details")));
    titleWrap.appendChild(create('h4', 'delegation-detail-title', selectionTitle(selection, normalized)));
    head.appendChild(titleWrap);
    head.appendChild(create('span', 'delegation-detail-count', countLabel(selection.tasks.length,' 条任务','task')));
    detail.appendChild(head);
    var note = selection.type === 'relation'
      ? ((selection.edge.known === false || selection.edge.kind === 'unrecorded') ? tr('这条关系的来源没有完整记录。',"The source of this relationship was not fully recorded.") : tr('同一方向的任务已合并到一条箭头。',"Tasks in the same direction are combined into one arrow."))
      : (nodeKind(selection.node) === 'bot' && selection.node.missing ? tr('该 Bot 已不在当前列表，保留历史名称。',"This Bot is no longer in the current list. Its historical name is retained.") : tr('可查看该 Bot 发起或接收的任务。',"View tasks initiated or received by this Bot."));
    detail.appendChild(create('div', 'delegation-detail-note', note));
    if (!selection.tasks.length) {
      detail.appendChild(create('div', 'delegation-detail-empty', tr('这条关系目前没有可查看的任务。',"No tasks are available for this relationship.")));
      return;
    }
    appendTaskList(detail, selection.tasks, normalized, selection, onOpenTask, onTaskSelect);
  }

  function sortNodes(a, b) { return nodeLabel(a).localeCompare(nodeLabel(b), global.OpenBotI18n ? global.OpenBotI18n.locale : 'zh-CN') || text(a.id).localeCompare(text(b)); }
  function layout(normalized) {
    var nodes = normalized.nodes.slice(), byId = normalized.byNode;
    var incident = Object.create(null), indegree = Object.create(null);
    nodes.forEach(function (node) { incident[node.id] = false; indegree[node.id] = 0; });
    normalized.edges.forEach(function (edge) {
      if (!byId[edge.source] || !byId[edge.target]) return;
      incident[edge.source] = true;
      incident[edge.target] = true;
      if (edge.source !== edge.target) indegree[edge.target] += 1;
    });
    var connected = nodes.filter(function (node) { return incident[node.id]; });
    var idle = nodes.filter(function (node) { return !incident[node.id]; }).sort(sortNodes);
    var rank = Object.create(null);
    var sources = connected.filter(function (node) { return indegree[node.id] === 0; }).sort(sortNodes);
    if (!sources.length) sources = connected.slice().sort(sortNodes).filter(function (node, index) { return index % 2 === 0; });
    var queue = sources.slice();
    sources.forEach(function (node) { rank[node.id] = 0; });
    while (queue.length) {
      var current = queue.shift(), currentRank = rank[current.id] || 0;
      normalized.edges.forEach(function (edge) {
        if (edge.source !== current.id || !byId[edge.target] || edge.target === edge.source) return;
        var nextRank = currentRank + 1;
        if (rank[edge.target] == null) {
          rank[edge.target] = nextRank;
          queue.push(byId[edge.target]);
        }
      });
    }
    connected.forEach(function (node, index) { if (rank[node.id] == null) rank[node.id] = index % 2; });
    var maxRank = 0;
    connected.forEach(function (node) { maxRank = Math.max(maxRank, rank[node.id] || 0); });
    var padX = 28, padY = 24, nodeWidth = 144, nodeHeight = 116, rowGap = 34, colGap = 112;
    var columns = [];
    for (var c = 0; c <= maxRank; c++) columns.push([]);
    connected.forEach(function (node) { columns[rank[node.id] || 0].push(node); });
    columns.forEach(function (column) { column.sort(sortNodes); });
    var maxRows = columns.reduce(function (max, column) { return Math.max(max, column.length); }, 0);
    var width = Math.max(680, padX * 2 + (maxRank + 1) * nodeWidth + maxRank * colGap);
    var relationHeight = Math.max(146, padY * 2 + maxRows * nodeHeight + Math.max(0, maxRows - 1) * rowGap);
    var positions = Object.create(null);
    columns.forEach(function (column, columnIndex) {
      var columnHeight = column.length * nodeHeight + Math.max(0, column.length - 1) * rowGap;
      var startY = padY + Math.max(0, (relationHeight - padY * 2 - columnHeight) / 2);
      column.forEach(function (node, rowIndex) {
        var x = padX + columnIndex * (nodeWidth + colGap), y = startY + rowIndex * (nodeHeight + rowGap);
        positions[node.id] = { x: x, y: y, width: nodeWidth, height: nodeHeight, rank: columnIndex, anchorLeft: x + (nodeWidth - 54) / 2, anchorRight: x + (nodeWidth + 54) / 2, anchorY: y + 27 };
      });
    });
    var idleTop = relationHeight + (connected.length && idle.length ? 52 : 22);
    if (idle.length) {
      var idleColumns = Math.max(1, Math.min(3, Math.floor((width - padX * 2 + colGap) / (nodeWidth + colGap))));
      var idleRows = Math.ceil(idle.length / idleColumns);
      idle.forEach(function (node, index) {
        var columnIndex = index % idleColumns, rowIndex = Math.floor(index / idleColumns);
        var idleX = padX + columnIndex * (nodeWidth + colGap), idleY = idleTop + 30 + rowIndex * (nodeHeight + rowGap);
        positions[node.id] = { x: idleX, y: idleY, width: nodeWidth, height: nodeHeight, rank: -1, anchorLeft: idleX + (nodeWidth - 54) / 2, anchorRight: idleX + (nodeWidth + 54) / 2, anchorY: idleY + 27 };
      });
      relationHeight = idleTop + 30 + idleRows * nodeHeight + Math.max(0, idleRows - 1) * rowGap + padY;
    }
    return { positions: positions, width: width, height: relationHeight, connected: connected, idle: idle, idleTop: idleTop };
  }
  function relationGeometry(edge, positions, edgeIndex, edgeCount) {
    var source = positions[edge.source], target = positions[edge.target];
    if (!source || !target) return null;
    var sx, sy, ex, ey, path, labelX, labelY;
    if (edge.source === edge.target) {
      sx = source.anchorRight; sy = source.anchorY - 12;
      ex = source.anchorRight; ey = source.anchorY + 12;
      var loopOut = 72 + (edgeIndex % 2) * 18;
      path = 'M ' + sx + ' ' + sy + ' C ' + (source.x + source.width + loopOut) + ' ' + (source.y - 18) + ' ' + (source.x + source.width + loopOut) + ' ' + (source.y + source.height + 18) + ' ' + ex + ' ' + ey;
      labelX = source.x + source.width + loopOut - 26; labelY = source.y + source.height / 2 - 11;
    } else {
      var forward = target.x > source.x;
      sx = source.anchorRight; sy = source.anchorY;
      if (forward) {
        ex = target.anchorLeft; ey = target.anchorY;
        var bend = Math.max(44, Math.abs(ex - sx) * .38), offset = edgeCount > 1 ? (edgeIndex - (edgeCount - 1) / 2) * 20 : 0;
        path = 'M ' + sx + ' ' + sy + ' C ' + (sx + bend) + ' ' + (sy + offset) + ' ' + (ex - bend) + ' ' + (ey + offset) + ' ' + ex + ' ' + ey;
        labelX = (sx + ex) / 2 - 42; labelY = (sy + ey) / 2 + offset - 12;
      } else {
        ex = target.anchorRight; ey = target.anchorY;
        var backBend = Math.max(64, Math.abs(ex - sx) * .45), backOffset = edgeCount > 1 ? (edgeIndex - (edgeCount - 1) / 2) * 20 : 0;
        path = 'M ' + sx + ' ' + sy + ' C ' + (sx + backBend) + ' ' + (sy + 58 + backOffset) + ' ' + (ex + backBend) + ' ' + (ey + 58 + backOffset) + ' ' + ex + ' ' + ey;
        labelX = (sx + ex) / 2 - 42 + backBend / 2; labelY = (sy + ey) / 2 + 52 + backOffset - 12;
      }
    }
    return { path: path, labelX: labelX, labelY: labelY };
  }
  function pairIndex(edges, edge) {
    var samePair = edges.filter(function (item) { return item.source === edge.source && item.target === edge.target; });
    return { index: Math.max(0, samePair.indexOf(edge)), count: samePair.length };
  }
  function renderEmpty(container, message, note) {
    var empty = create('div', 'delegation-graph-empty');
    empty.appendChild(create('div', 'delegation-graph-empty-title', message));
    if (note) empty.appendChild(create('div', 'delegation-graph-empty-note', note));
    container.appendChild(empty);
  }
  function relationTasks(edge, normalized) { return unique(edge && edge.taskIds).map(function (id) { return normalized.byTask[id]; }).filter(Boolean); }
  function nodeTasks(node, normalized) {
    var ids = unique(node && node.taskIds);
    if (!ids.length) normalized.tasks.forEach(function (task) { if (task.sourceNodeId === node.id || task.targetNodeId === node.id) ids.push(taskId(task)); });
    return ids.map(function (id) { return normalized.byTask[id]; }).filter(Boolean);
  }

  function render(container, projection, options) {
    if (!container) return;
    if (typeof container.__delegationGraphCleanup === 'function') container.__delegationGraphCleanup();
    container.innerHTML = '';
    container.className = 'delegation-graph-root';
    options = options || {};
    var normalized = normalize(projection);
    if (!projection || !Array.isArray(projection.nodes)) return renderEmpty(container, tr('关系图暂未加载',"Relationship graph not loaded"), tr('数据回来后会显示真实的 Bot→Bot 关系。',"Recorded Bot-to-Bot relationships appear when data is loaded."));
    if (!normalized.nodes.length) return renderEmpty(container, tr('暂无可显示的 Bot',"No Bots to show"), tr('当前没有常驻 Bot 或已记录的来源。',"No persistent Bots or recorded sources are available."));

    var stats = normalized.stats || {}, summary = create('div', 'delegation-graph-summary'), summaryBits = [];
    summaryBits.push(countLabel(stats.totalBots != null ? stats.totalBots : normalized.nodes.filter(function (node) { return nodeKind(node) === 'bot'; }).length,' 个 Bot','Bot'));
    summaryBits.push(countLabel(stats.relationCount != null ? stats.relationCount : normalized.edges.length,' 条关系','relationship'));
    if (stats.activeTasks) summaryBits.push(String(stats.activeTasks) + tr(' 条进行中'," active"));
    if (stats.unknownSources) summaryBits.push(countLabel(stats.unknownSources,' 个来源未记录','source not recorded','sources not recorded'));
    if (stats.omittedTasks) summaryBits.push(tr('另有 ',"Plus ") + countLabel(stats.omittedTasks,' 条任务未显示','task not shown','tasks not shown'));
    if (stats.omittedBots) summaryBits.push(tr('另有 ',"Plus ") + countLabel(stats.omittedBots,' 个 Bot 未显示','Bot not shown','Bots not shown'));
    summary.textContent = summaryBits.join(' · ');
    container.appendChild(summary);
    container.appendChild(create('div', 'delegation-graph-note', tr('箭头表示 Bot 之间的已记录委派；点击 Bot 或箭头查看关联任务。',"Arrows show recorded delegations between Bots. Select a Bot or arrow to view related tasks.")));

    var graph = create('div', 'delegation-graph-canvas');
    graph.setAttribute('role', 'list'); graph.setAttribute('aria-label', tr('Bot 委派关系图',"Bot delegation graph"));
    var scroll = create('div', 'delegation-graph-scroll'), stage = create('div', 'delegation-graph-stage'), layoutInfo = layout(normalized);
    stage.style.width = layoutInfo.width + 'px'; stage.style.height = layoutInfo.height + 'px';
    scroll.appendChild(stage); graph.appendChild(scroll); container.appendChild(graph);
    var svgLayer = svg('svg', { 'class': 'delegation-relation-layer', role: 'group', 'aria-label': tr('委派关系箭头',"Delegation arrows"), focusable: 'false', viewBox: '0 0 ' + layoutInfo.width + ' ' + layoutInfo.height, width: layoutInfo.width, height: layoutInfo.height });
    var defs = svg('defs'), marker = svg('marker', { id: 'delegation-arrow', viewBox: '0 0 8 8', refX: '7', refY: '4', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
    marker.appendChild(svg('path', { d: 'M 0 0 L 8 4 L 0 8 z' })); defs.appendChild(marker); svgLayer.appendChild(defs); stage.appendChild(svgLayer);
    var nodeLayer = create('div', 'delegation-node-layer'); stage.appendChild(nodeLayer);
    var detail = create('section', 'delegation-detail'); detail.id = 'delegation-task-detail'; detail.setAttribute('aria-live', 'polite'); detail.setAttribute('aria-label', tr('选中关系详情',"Selected relationship details")); container.appendChild(detail);

    function clearSelection() {
      Array.prototype.forEach.call(stage.querySelectorAll('[data-graph-node].is-selected, [data-graph-relation].is-selected, .delegation-edge-hit.is-selected'), function (element) {
        element.classList.remove('is-selected'); element.setAttribute('aria-pressed', 'false');
      });
    }
    function selectNode(node, button) {
      clearSelection(); button.classList.add('is-selected'); button.setAttribute('aria-pressed', 'true');
      renderSelectionDetail(detail, { type: 'node', node: node, tasks: nodeTasks(node, normalized) }, normalized, options.onOpenTask, options.onTaskSelect);
      if (typeof options.onGraphSelect === 'function') options.onGraphSelect({ type: 'node', id: node.id });
    }
    function selectRelation(edge, path, hit) {
      clearSelection();
      path.classList.add('is-selected'); path.setAttribute('aria-pressed', 'true');
      if (hit) hit.classList.add('is-selected');
      renderSelectionDetail(detail, { type: 'relation', edge: edge, tasks: relationTasks(edge, normalized) }, normalized, options.onOpenTask, options.onTaskSelect);
      if (typeof options.onGraphSelect === 'function') options.onGraphSelect({ type: 'relation', id: edge.id });
    }

    normalized.edges.forEach(function (edge) {
      var pair = pairIndex(normalized.edges, edge), geometry = relationGeometry(edge, layoutInfo.positions, pair.index, pair.count);
      if (!geometry) return;
      var path = svg('path', { d: geometry.path, 'class': 'delegation-relation-path' });
      path.dataset.graphRelation = edge.id; path.dataset.graphSource = edge.source; path.dataset.graphTarget = edge.target; path.setAttribute('data-edge-known', edge.known === false || edge.kind === 'unrecorded' ? 'false' : 'true'); path.setAttribute('marker-end', 'url(#delegation-arrow)');
      path.setAttribute('tabindex', '0'); path.setAttribute('role', 'button'); path.setAttribute('aria-pressed', 'false');
      path.setAttribute('aria-label', tr('查看 ',"View ") + nodeLabel(normalized.byNode[edge.source]) + tr(' 到 '," to ") + nodeLabel(normalized.byNode[edge.target]) + tr(' 的 ',": ") + countLabel(edge.taskCount,' 条任务','task'));
      path.classList.toggle('is-unknown', edge.known === false || edge.kind === 'unrecorded'); svgLayer.appendChild(path);
      var hit = create('button', 'delegation-edge-hit' + (edge.known === false || edge.kind === 'unrecorded' ? ' is-unknown' : ''));
      hit.type = 'button'; hit.dataset.graphEdgeSelect = edge.id; hit.dataset.graphSource = edge.source; hit.dataset.graphTarget = edge.target; hit.dataset.edgeKnown = edge.known === false || edge.kind === 'unrecorded' ? 'false' : 'true'; hit.setAttribute('aria-pressed', 'false');
      hit.setAttribute('aria-label', tr('查看 ',"View ") + nodeLabel(normalized.byNode[edge.source]) + tr(' 到 '," to ") + nodeLabel(normalized.byNode[edge.target]) + tr(' 的 ',": ") + countLabel(edge.taskCount,' 条任务','task'));
      hit.style.left = Math.max(4, geometry.labelX) + 'px'; hit.style.top = Math.max(4, geometry.labelY) + 'px';
      hit.appendChild(create('span', 'delegation-edge-count', countLabel(edge.taskCount != null ? edge.taskCount : relationTasks(edge, normalized).length,' 条任务','task')));
      path.addEventListener('click', function () { selectRelation(edge, path, hit); });
      path.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectRelation(edge, path, hit); }
      });
      hit.addEventListener('click', function () { selectRelation(edge, path, hit); }); nodeLayer.appendChild(hit);
    });
    normalized.nodes.forEach(function (node) {
      var position = layoutInfo.positions[node.id]; if (!position) return;
      var button = create('button', 'delegation-graph-node' + (nodeKind(node) === 'bot' ? ' delegation-bot-node' : ' delegation-source-node') + (node.missing ? ' is-missing' : '') + (position.rank < 0 ? ' is-idle' : ''));
      button.type = 'button'; button.dataset.graphNode = node.id;
      if (nodeKind(node) === 'bot' && text(node.botId)) button.dataset.graphBot = text(node.botId);
      button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-label', tr('查看 ',"View ") + nodeLabel(node) + tr(' 的关联任务'," related tasks")); button.style.left = position.x + 'px'; button.style.top = position.y + 'px';
      appendAvatar(button, node, options);
      var copy = create('span', 'delegation-node-copy'); copy.appendChild(create('strong', 'delegation-node-name', nodeLabel(node))); copy.appendChild(create('span', 'delegation-node-kind', nodeKindLabel(node)));
      var taskCount = Number(node.taskIds && node.taskIds.length || 0), relationCount = Number(node.incomingTaskCount || 0) + Number(node.outgoingTaskCount || 0);
      var metaText = taskCount ? countLabel(taskCount,' 条任务','task') : (relationCount ? countLabel(relationCount,' 条任务','task') : tr('无连接',"No connections")); if (node.activeTasks) metaText += ' · ' + node.activeTasks + tr(' 进行中'," active");
      copy.appendChild(create('span', 'delegation-node-meta', metaText)); button.appendChild(copy); button.addEventListener('click', function () { selectNode(node, button); }); nodeLayer.appendChild(button);
    });
    if (layoutInfo.idle.length) {
      var idleHeading = create('div', 'delegation-idle-heading', tr('未连接的当前 Bot',"Current Bots without connections")); idleHeading.style.left = '28px'; idleHeading.style.top = layoutInfo.idleTop + 'px'; nodeLayer.appendChild(idleHeading);
    }
    function findStageElement(attribute, value) {
      var matches = stage.querySelectorAll('[' + attribute + ']');
      for (var i = 0; i < matches.length; i++) if (matches[i].getAttribute(attribute) === value) return matches[i];
      return null;
    }
    var selectedTaskId = text(options.selectedTaskId), selectedTask = selectedTaskId && normalized.byTask[selectedTaskId];
    var selectedRelation = normalized.edges.filter(function (edge) { return edge.id === text(options.selectedRelationId); })[0];
    var selectedNode = normalized.nodes.filter(function (node) { return node.id === text(options.selectedNodeId); })[0];
    if (selectedTask) {
      renderTaskDetail(detail, selectedTask, normalized, options.onOpenTask, null, options.onTaskSelect);
      var selectedTaskRelation = normalized.edges.filter(function (edge) { return edge.taskIds.indexOf(taskId(selectedTask)) >= 0; })[0];
      if (selectedTaskRelation) {
        var selectedTaskPath = findStageElement('data-graph-relation', selectedTaskRelation.id);
        var selectedTaskHit = findStageElement('data-graph-edge-select', selectedTaskRelation.id);
        if (selectedTaskPath) { selectedTaskPath.classList.add('is-selected'); selectedTaskPath.setAttribute('aria-pressed', 'true'); }
        if (selectedTaskHit) selectedTaskHit.classList.add('is-selected');
      }
    } else if (selectedRelation) {
      var selectedPath = findStageElement('data-graph-relation', selectedRelation.id);
      var selectedHit = findStageElement('data-graph-edge-select', selectedRelation.id);
      if (selectedPath) { selectedPath.classList.add('is-selected'); selectedPath.setAttribute('aria-pressed', 'true'); }
      if (selectedHit) selectedHit.classList.add('is-selected');
      renderSelectionDetail(detail, { type: 'relation', edge: selectedRelation, tasks: relationTasks(selectedRelation, normalized) }, normalized, options.onOpenTask, options.onTaskSelect);
    } else if (selectedNode) {
      var selectedNodeButton = findStageElement('data-graph-node', selectedNode.id);
      if (selectedNodeButton) { selectedNodeButton.classList.add('is-selected'); selectedNodeButton.setAttribute('aria-pressed', 'true'); }
      renderSelectionDetail(detail, { type: 'node', node: selectedNode, tasks: nodeTasks(selectedNode, normalized) }, normalized, options.onOpenTask, options.onTaskSelect);
    } else {
      detail.appendChild(create('div', 'delegation-detail-empty', tr('选择一个机器人或箭头查看关联任务。',"Select a Bot or arrow to view related tasks.")));
    }
    var schedule = function () { svgLayer.setAttribute('viewBox', '0 0 ' + layoutInfo.width + ' ' + layoutInfo.height); };
    if (typeof global.requestAnimationFrame === 'function') global.requestAnimationFrame(schedule); else setTimeout(schedule, 0);
    var resizeHandler = schedule;
    if (global.ResizeObserver) {
      var observer = new global.ResizeObserver(schedule); observer.observe(container); container.__delegationGraphCleanup = function () { observer.disconnect(); };
    } else {
      global.addEventListener('resize', resizeHandler); container.__delegationGraphCleanup = function () { global.removeEventListener('resize', resizeHandler); };
    }
  }

  global.OpenBotDelegationGraphView = { render: render };
}(window));
