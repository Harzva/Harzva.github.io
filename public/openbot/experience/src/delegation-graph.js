(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OpenBotDelegationGraph = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // A read-only projection of retained dispatches, not a second task store.
  // parentTaskId refers to the action ledger, never a TaskBoard parent.
  var STATUSES = ['queued', 'running', 'done', 'failed', 'canceled', 'interrupted'];
  function text(value, limit) {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, limit) : '';
  }
  function identifier(value) {
    return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/.test(value) ? value : '';
  }
  function botIdentifier(value) {
    return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value) &&
      ['__proto__', 'constructor', 'prototype'].indexOf(value) < 0 ? value : '';
  }
  function timestamp(value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
  }
  function source(task, runs) {
    if (task.dispatchSource === 'user' && !task.delegatorBotId && !task.delegatorBotName) {
      return { type: 'user', provenance: 'recorded', label: '你', botId: '' };
    }
    if (task.dispatchSource === 'bot' && botIdentifier(task.delegatorBotId)) {
      return { type: 'bot', provenance: 'recorded', botId: task.delegatorBotId,
        label: text(task.delegatorBotName, 80) };
    }
    // Only genuinely old records may use the retained parent run as evidence.
    // An invalid explicit source is not converted into a different claim.
    if (task.dispatchSource == null || task.dispatchSource === '') {
      var run = runs.get(identifier(task.parentRunId));
      if (run && run.botId) return { type: 'bot', provenance: 'parent-run', botId: run.botId, label: run.label };
    }
    return { type: 'unknown', provenance: 'unrecorded', label: '来源未记录', botId: '' };
  }
  function priority(task) {
    if (task.status === 'queued' || task.status === 'running') return 0;
    return task.resultPending === true ? 1 : 2;
  }

  function build(input) {
    var data = input || {}, bots = new Map(), runs = new Map(), tasks = new Map();
    (Array.isArray(data.bots) ? data.bots : []).forEach(function (bot) {
      if (bot && botIdentifier(bot.id)) bots.set(bot.id, { label: text(bot.name, 80) || bot.id });
    });
    (Array.isArray(data.runs) ? data.runs : []).forEach(function (run) {
      if (!run || !identifier(run.id) || !botIdentifier(run.botId)) return;
      if (runs.has(run.id) && (!runs.get(run.id) || runs.get(run.id).botId !== run.botId)) {
        runs.set(run.id, null); // Conflicting evidence cannot establish a source.
      } else if (!runs.has(run.id)) runs.set(run.id, { botId: run.botId, label: text(run.botName, 80) });
    });
    (Array.isArray(data.tasks) ? data.tasks : []).forEach(function (task) {
      if (task && identifier(task.id) && !tasks.has(task.id)) tasks.set(task.id, task);
    });
    var ordered = Array.from(tasks.values()).sort(function (a, b) {
      return priority(a) - priority(b) || timestamp(b.createdAt) - timestamp(a.createdAt) || a.id.localeCompare(b.id);
    });
    var cap = typeof data.maxTasks === 'number' && Number.isFinite(data.maxTasks)
      ? Math.max(1, Math.min(120, Math.floor(data.maxTasks))) : 60;
    var selected = ordered.slice(0, cap), nodes = [], edges = [], actors = new Map(), groups = new Map();
    var unknownSources = 0, activeTasks = 0;
    selected.forEach(function (task) {
      var origin = source(task, runs), actorId = 'actor:' + origin.type + (origin.botId ? ':' + encodeURIComponent(origin.botId) : '');
      var known = origin.type !== 'unknown', sourceBot = bots.get(origin.botId);
      if (!known) unknownSources++;
      if (task.status === 'queued' || task.status === 'running') activeTasks++;
      if (!actors.has(actorId)) {
        var actor = { id: actorId, kind: 'actor', actorType: origin.type, botId: origin.botId,
          label: origin.type === 'bot' ? ((sourceBot && sourceBot.label) || origin.label || origin.botId) : origin.label,
          missing: origin.type === 'bot' && !sourceBot, provenance: origin.provenance };
        actors.set(actorId, actor); nodes.push(actor); groups.set(actorId, []);
      } else {
        var existingActor = actors.get(actorId);
        if (existingActor.provenance !== origin.provenance) existingActor.provenance = 'mixed';
        if (origin.type === 'bot' && !sourceBot && existingActor.label === origin.botId && origin.label) existingActor.label = origin.label;
      }
      var ownerId = botIdentifier(task.botId), owner = bots.get(ownerId), taskId = 'task:' + encodeURIComponent(task.id);
      nodes.push({ id: taskId, kind: 'task', taskId: task.id, botId: ownerId,
        botName: (owner && owner.label) || text(task.botName, 80) || ownerId || '接收 Bot 未记录',
        botMissing: !owner, agentName: text(task.agentName, 80) || text(task.agentId, 80) || '执行器未记录',
        title: text(task.title, 80) || '未命名任务', status: STATUSES.indexOf(task.status) >= 0 ? task.status : 'unknown',
        resultPending: task.resultPending === true, resultError: text(task.resultError, 800),
        preview: text(task.preview, 400), error: text(task.error, 800), createdAt: timestamp(task.createdAt),
        parentRunId: identifier(task.parentRunId), parentTaskId: identifier(task.parentTaskId),
        sourceActorId: actorId, sourceKnown: known, provenance: origin.provenance });
      groups.get(actorId).push(taskId);
      edges.push({ id: 'dispatch:' + encodeURIComponent(task.id), source: actorId, target: taskId,
        kind: known ? 'dispatch' : 'unrecorded', known: known, provenance: origin.provenance });
    });
    return { nodes: nodes, edges: edges,
      groups: Array.from(groups, function (entry) { return { actorId: entry[0], taskIds: entry[1] }; }),
      stats: { totalTasks: ordered.length, shownTasks: selected.length, omittedTasks: ordered.length - selected.length,
        unknownSources: unknownSources, activeTasks: activeTasks } };
  }

  // Entity view: tasks explain relations, but never become canvas vertices.
  // Keep the evidence rules in build() as the single source of truth.
  function buildBotGraph(input) {
    var data = input || {}, base = build(data), bots = new Map(), entities = new Map(), taskIdSets = new Map(), relations = new Map();
    (Array.isArray(data.bots) ? data.bots : []).forEach(function (bot) {
      if (!bot || !botIdentifier(bot.id)) return;
      bots.set(bot.id, { id: bot.id, label: text(bot.name, 80) || bot.id,
        avatar: text(bot.avatar, 80), color: typeof bot.color === 'string' && /^#[0-9a-f]{6}$/i.test(bot.color) ? bot.color : null });
    });
    function entity(kind, botId, label) {
      var id = kind === 'bot' ? 'bot:' + encodeURIComponent(botId) : kind === 'unknown-target' ? 'target:unknown' : 'source:' + kind;
      if (!entities.has(id)) {
        var bot = bots.get(botId);
        entities.set(id, { id: id, kind: kind === 'unknown-target' ? 'unknown' : kind, botId: kind === 'bot' ? botId : '',
          label: bot ? bot.label : label, avatar: bot ? bot.avatar : '', color: bot ? bot.color : null,
          missing: kind === 'bot' && !bot, taskIds: [], incomingTaskCount: 0, outgoingTaskCount: 0, activeTasks: 0 });
        taskIdSets.set(id, new Set());
      } else if (kind === 'bot') {
        var existing = entities.get(id);
        if (existing.missing && existing.label === botId && label && label !== botId) existing.label = label;
      }
      return entities.get(id);
    }
    var actors = new Map(base.nodes.filter(function (node) { return node.kind === 'actor'; })
      .map(function (node) { return [node.id, node]; }));
    var details = base.nodes.filter(function (node) { return node.kind === 'task'; }).map(function (task) {
      var actor = actors.get(task.sourceActorId);
      var from = entity(actor.actorType, actor.botId, actor.label);
      var to = task.botId ? entity('bot', task.botId, task.botName) : entity('unknown-target', '', '接收 Bot 未记录');
      var relationId = 'relation:' + encodeURIComponent(from.id) + '>' + encodeURIComponent(to.id);
      if (!relations.has(relationId)) relations.set(relationId, { id: relationId, source: from.id, target: to.id,
        kind: task.sourceKnown && task.botId ? 'delegation' : 'unrecorded', known: !!(task.sourceKnown && task.botId),
        taskIds: [], taskCount: 0, activeTasks: 0, pendingResults: 0, statusCounts: {}, provenance: task.provenance });
      var relation = relations.get(relationId), active = task.status === 'running' || task.status === 'queued';
      relation.taskIds.push(task.taskId); relation.taskCount++;
      if (active) relation.activeTasks++;
      if (task.resultPending) relation.pendingResults++;
      relation.statusCounts[task.status] = (relation.statusCounts[task.status] || 0) + 1;
      if (relation.provenance !== task.provenance) relation.provenance = 'mixed';
      from.outgoingTaskCount++; to.incomingTaskCount++;
      var useSetDedup = typeof require === 'function' && (function () {
        try { return require('./algorithm-lab').isAlgorithmSwitchEnabled('unionFindCommunities'); } catch (_) { return false; }
      })();
      [from, to].forEach(function (node) {
        if (useSetDedup) {
          var seenSet = taskIdSets.get(node.id);
          if (seenSet.has(task.taskId)) return;
          seenSet.add(task.taskId);
        } else {
          if (node.taskIds.indexOf(task.taskId) >= 0) return;
        }
        node.taskIds.push(task.taskId); if (active) node.activeTasks++;
      });
      return Object.assign({}, task, { sourceNodeId: from.id, targetNodeId: to.id });
    });
    // Referenced endpoints are never severed. Idle Bots have no invented links.
    var entityCap = Math.max(120, entities.size);
    bots.forEach(function (bot) {
      if (entities.size < entityCap) entity('bot', bot.id, bot.label);
    });
    var allBotIds = new Set(bots.keys()), shownBots = 0;
    entities.forEach(function (node) {
      if (node.kind === 'bot') { allBotIds.add(node.botId); shownBots++; }
    });
    return { nodes: Array.from(entities.values()), edges: Array.from(relations.values()), tasks: details,
      stats: Object.assign({}, base.stats, { totalBots: allBotIds.size, shownBots: shownBots,
        omittedBots: allBotIds.size - shownBots, relationCount: relations.size }) };
  }

  return { build: build, buildBotGraph: buildBotGraph };
});
