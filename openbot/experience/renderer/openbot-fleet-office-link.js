/* Read-only, display-only bridge between the fleet dashboard and the office. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotFleetOfficeLink = api;
})(typeof window === 'object' ? window : this, function () {
  'use strict';

  function integer(value) {
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  }

  function botId(value) {
    return typeof value === 'string' && value.length > 0 && value.length <= 200 ? value : '';
  }

  function partner(value) {
    if (!value || typeof value !== 'object') return null;
    var id = botId(value.botId);
    var taskCount = integer(value.taskCount);
    return id && taskCount ? { botId: id, taskCount: taskCount } : null;
  }

  function ratio(numerator, denominator) {
    return denominator > 0 ? numerator / denominator : null;
  }

  function coverage(known, missing) {
    var total = known + missing;
    return total > 0 ? Math.round((known / total) * 100) : null;
  }

  function project(fleet, visibleIds) {
    if (!fleet || typeof fleet !== 'object' || !Array.isArray(fleet.bots)) return null;
    var visible = visibleIds == null ? null : typeof visibleIds.has === 'function' ? visibleIds : new Set(visibleIds);
    var cells = fleet.matrix && Array.isArray(fleet.matrix.cells) ? fleet.matrix.cells : [];
    var issues = new Map();
    var cellMap = new Map();
    for (var index = 0; index < cells.length && index < 5000; index++) {
      var cell = cells[index];
      if (!cell || typeof cell !== 'object') continue;
      var fromId = botId(cell.fromBotId);
      var toId = botId(cell.toBotId);
      if (!fromId || !toId) continue;
      var taskCount = integer(cell.taskCount);
      var issueCount = integer(cell.failed) + integer(cell.unknownResults) + integer(cell.interrupted);
      issues.set(fromId, (issues.get(fromId) || 0) + issueCount);
      var key = fromId + '\u0000' + toId;
      cellMap.set(key, (cellMap.get(key) || 0) + taskCount);
    }

    var bots = [];
    var seen = new Set();
    var rank = 0;
    for (var rowIndex = 0; rowIndex < fleet.bots.length && rowIndex < 1000; rowIndex++) {
      var row = fleet.bots[rowIndex];
      if (!row || typeof row !== 'object') continue;
      var id = botId(row.botId);
      if (!id || seen.has(id) || (visible && !visible.has(id))) continue;
      seen.add(id);
      var invocations = integer(row.invocations);
      var modelRequests = integer(row.modelRequests);
      var outgoingTasks = integer(row.outgoingTasks);
      var incomingTasks = integer(row.incomingTasks);
      var outgoingRelations = integer(row.outgoingRelations);
      var incomingRelations = integer(row.incomingRelations);
      var knownUsageRuns = integer(row.knownUsageRuns);
      var missingUsageRuns = integer(row.missingUsageRuns);
      var partnerCount = integer(row.uniquePartnerCount);
      var outgoingIssueCount = issues.get(id) || 0;
      var activity = invocations > 0 || modelRequests > 0 || outgoingTasks > 0 || incomingTasks > 0;
      if (invocations > 0) rank++;
      bots.push({
        botId: id,
        rank: invocations > 0 ? rank : null,
        invocations: invocations,
        modelRequests: modelRequests,
        outgoingTasks: outgoingTasks,
        incomingTasks: incomingTasks,
        outgoingRelations: outgoingRelations,
        incomingRelations: incomingRelations,
        partnerCount: partnerCount,
        outgoingIssues: outgoingIssueCount,
        issueRate: ratio(outgoingIssueCount, outgoingTasks),
        usageKnownRuns: knownUsageRuns,
        usageMissingRuns: missingUsageRuns,
        usageCoverage: coverage(knownUsageRuns, missingUsageRuns),
        topOutgoing: partner(Array.isArray(row.topOutgoing) ? row.topOutgoing[0] : null),
        topIncoming: partner(Array.isArray(row.topIncoming) ? row.topIncoming[0] : null),
        hasActivity: activity
      });
    }

    var botById = new Map(bots.map(function (bot) { return [bot.botId, bot]; }));
    var insightRows = fleet.insights && typeof fleet.insights === 'object' ? fleet.insights : {};
    function firstInsight(key, map) {
      var list = Array.isArray(insightRows[key]) ? insightRows[key] : [];
      for (var i = 0; i < list.length && i < 20; i++) {
        var item = list[i];
        if (item && botById.has(item.botId)) return map(item, botById.get(item.botId));
      }
      return null;
    }

    var hub = firstInsight('hubs', function (item, bot) {
      return { botId: bot.botId, outgoingTasks: integer(item.outgoingTasks) || bot.outgoingTasks,
        uniquePartners: integer(item.uniquePartners) || bot.partnerCount };
    });
    var bottleneck = firstInsight('bottlenecks', function (item, bot) {
      var failed = integer(item.failed), unknown = integer(item.unknown);
      var total = integer(item.outgoingTasks) || bot.outgoingTasks;
      return { botId: bot.botId, outgoingTasks: total, failed: failed, unknown: unknown,
        issues: failed + unknown, rate: ratio(failed + unknown, total) };
    });
    var hotspot = firstInsight('resourceHotspots', function (item, bot) {
      return { botId: bot.botId, modelRequests: integer(item.modelRequests) || bot.modelRequests,
        invocations: integer(item.invocations) || bot.invocations };
    });

    var isolated = null;
    var isolatedCount = 0;
    for (var botIndex = 0; botIndex < bots.length; botIndex++) {
      if (bots[botIndex].invocations > 0 && bots[botIndex].partnerCount === 0) {
        isolatedCount++;
        if (!isolated) isolated = { botId: bots[botIndex].botId, invocations: bots[botIndex].invocations };
      }
    }

    var reciprocal = null;
    var reciprocalList = Array.isArray(insightRows.reciprocal) ? insightRows.reciprocal : [];
    for (var reciprocalIndex = 0; reciprocalIndex < reciprocalList.length && reciprocalIndex < 20; reciprocalIndex++) {
      var relation = reciprocalList[reciprocalIndex];
      var fromBotId = relation && botId(relation.fromBotId);
      var toBotId = relation && botId(relation.toBotId);
      if (fromBotId && toBotId && botById.has(fromBotId) && botById.has(toBotId)) {
        reciprocal = { fromBotId: fromBotId, toBotId: toBotId, outgoing: integer(relation.outgoing),
          incoming: integer(relation.incoming) };
        break;
      }
    }
    var reciprocalPairs = 0;
    var oneWayLinks = 0;
    cellMap.forEach(function (forwardCount, cellKey) {
      if (forwardCount < 2) return;
      var parts = cellKey.split('\u0000');
      var a = parts[0], b = parts[1];
      if (!a || !b || a === b || a > b || !botById.has(a) || !botById.has(b)) return;
      var forward = cellMap.get(a + '\u0000' + b) || 0;
      var reverse = cellMap.get(b + '\u0000' + a) || 0;
      if (forward >= 2 && reverse >= 2) reciprocalPairs++;
      else if (reverse === 0) oneWayLinks++;
    });
    var summary = {
      botCount: bots.length,
      activeBots: bots.filter(function (bot) { return bot.hasActivity; }).length,
      totalInvocations: bots.reduce(function (sum, bot) { return sum + bot.invocations; }, 0),
      totalDelegations: bots.reduce(function (sum, bot) { return sum + bot.outgoingTasks; }, 0),
      knownUsageRuns: bots.reduce(function (sum, bot) { return sum + bot.usageKnownRuns; }, 0),
      missingUsageRuns: bots.reduce(function (sum, bot) { return sum + bot.usageMissingRuns; }, 0),
      reciprocalPairs: reciprocalPairs,
      oneWayLinks: oneWayLinks,
      isolatedCount: isolatedCount
    };
    summary.usageCoverage = coverage(summary.knownUsageRuns, summary.missingUsageRuns);

    return {
      bots: bots,
      summary: summary,
      signals: { hub: hub, bottleneck: bottleneck, hotspot: hotspot, isolated: isolated,
        reciprocal: reciprocal, isolatedCount: isolatedCount }
    };
  }

  var HEALTH_LAYER_IDS = ['bot', 'harness', 'model'];
  var HEALTH_STATUSES = new Set(['healthy', 'degraded', 'unhealthy', 'unverified', 'unchecked', 'not_applicable']);

  function healthStatus(value) {
    return HEALTH_STATUSES.has(value) ? value : 'unchecked';
  }

  function healthScore(value) {
    return Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value) : null;
  }

  function healthLayer(value) {
    var source = value && typeof value === 'object' ? value : {};
    return {
      status: healthStatus(source.status),
      score: healthScore(source.score),
      detailCode: typeof source.detailCode === 'string' ? source.detailCode.slice(0, 40) : ''
    };
  }

  function healthRowOf(row) {
    if (!row || typeof row !== 'object') return null;
    var botId = botIdOf(row.id);
    if (!botId) return null;
    var layers = {};
    HEALTH_LAYER_IDS.forEach(function (id) { layers[id] = healthLayer(row.layers && row.layers[id]); });
    var status = typeof row.status === 'string' ? row.status : '';
    var overall = healthStatus(row.overall || row.status);
    return {
      botId: botId,
      status: status === 'stale' || status === 'checking' ? status : overall,
      overall: overall,
      layers: layers,
      bottleneck: HEALTH_LAYER_IDS.indexOf(row.bottleneck) >= 0 ? row.bottleneck : null,
      checkedAt: Number.isFinite(row.checkedAt) && row.checkedAt > 0 ? row.checkedAt : null,
      stale: row.stale === true || status === 'stale',
      cooling: row.cooling === true,
      sharedWith: integer(row.sharedWith) || 1
    };
  }

  function botIdOf(value) {
    return botId(value);
  }

  function healthRank(status) {
    if (status === 'unhealthy') return 0;
    if (status === 'degraded') return 1;
    if (status === 'unverified') return 2;
    if (status === 'unchecked') return 3;
    if (status === 'not_applicable') return 4;
    return 5;
  }

  function projectHealth(snapshot, visibleIds) {
    if (!snapshot || typeof snapshot !== 'object' || !Array.isArray(snapshot.rows)) return null;
    var visible = visibleIds == null ? null : typeof visibleIds.has === 'function' ? visibleIds : new Set(visibleIds);
    var rows = [];
    var byBot = new Map();
    for (var index = 0; index < snapshot.rows.length && index < 2000; index++) {
      var row = healthRowOf(snapshot.rows[index]);
      if (!row || byBot.has(row.botId) || (visible && !visible.has(row.botId))) continue;
      byBot.set(row.botId, row);
      rows.push(row);
    }
    var summary = {
      total: rows.length,
      checked: 0,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      unverified: 0,
      unchecked: 0,
      stale: 0,
      cooling: 0,
      layers: {
        bot: { healthy: 0, degraded: 0, unhealthy: 0, unverified: 0, unchecked: 0 },
        harness: { healthy: 0, degraded: 0, unhealthy: 0, unverified: 0, unchecked: 0 },
        model: { healthy: 0, degraded: 0, unhealthy: 0, unverified: 0, unchecked: 0 }
      }
    };
    rows.forEach(function (row) {
      if (row.overall !== 'unchecked') summary.checked++;
      if (Object.prototype.hasOwnProperty.call(summary, row.overall)) summary[row.overall]++;
      if (row.stale) summary.stale++;
      if (row.cooling) summary.cooling++;
      HEALTH_LAYER_IDS.forEach(function (id) {
        var status = row.layers[id].status;
        if (Object.prototype.hasOwnProperty.call(summary.layers[id], status)) summary.layers[id][status]++;
      });
    });
    var issues = rows
      .filter(function (row) {
        return row.overall === 'unhealthy' || row.overall === 'degraded' ||
          HEALTH_LAYER_IDS.some(function (id) {
            return row.layers[id].status === 'unhealthy' || row.layers[id].status === 'degraded';
          });
      })
      .sort(function (left, right) {
        var rank = healthRank(left.overall) - healthRank(right.overall);
        if (rank) return rank;
        return (right.checkedAt || 0) - (left.checkedAt || 0);
      });
    summary.needsAttention = issues.length;
    return {
      at: Number.isFinite(snapshot.at) && snapshot.at > 0 ? snapshot.at : null,
      warning: snapshot.warning === true || Boolean(snapshot.warning),
      rows: rows,
      byBot: byBot,
      issues: issues,
      summary: summary
    };
  }

  return { project: project, projectHealth: projectHealth };
});
