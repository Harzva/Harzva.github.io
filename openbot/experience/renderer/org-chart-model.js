(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotOrgChartModel = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  function tr(zh,en){var i18n=typeof window==='object'?window.OpenBotI18n:null;return i18n?i18n.t(zh,en):zh;}

  function text(value, limit) {
    return typeof value === 'string' ? value.slice(0, limit || 160) : '';
  }
  function id(value) {
    return typeof value === 'string' && value.trim() && value.length <= 300 ? value : '';
  }
  function uniqueIds(values) {
    var seen = Object.create(null);
    return (Array.isArray(values) ? values : []).filter(function (value) {
      var key = id(value);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function build(snapshot) {
    snapshot = snapshot && typeof snapshot === 'object' ? snapshot : {};
    var bots = [], byBot = Object.create(null), spaces = [], seenSpaces = Object.create(null);
    (Array.isArray(snapshot.bots) ? snapshot.bots : []).forEach(function (raw) {
      if (!raw || !id(raw.id) || byBot[raw.id]) return;
      var bot = { id: raw.id, name: text(raw.name) || raw.id,
        avatar: text(raw.avatar, 300) || 'orbit', color: /^#[a-f0-9]{6}$/i.test(raw.color || '') ? raw.color : '#5b8cff',
        model: text(raw.model), harness: text(raw.harness), unsupportedReason: text(raw.unsupportedReason, 300) };
      byBot[bot.id] = bot;
      bots.push(bot);
    });
    (Array.isArray(snapshot.spaces) ? snapshot.spaces : []).forEach(function (raw) {
      if (!raw || !id(raw.id) || seenSpaces[raw.id] || !id(raw.leaderBotId)) return;
      seenSpaces[raw.id] = true;
      var members = uniqueIds(raw.memberBotIds);
      // The host validates membership. Preserve a damaged reference visibly,
      // rather than silently selecting another leader or changing membership.
      spaces.push({ id: raw.id, name: text(raw.name) || tr('未命名空间',"Untitled space"), leaderBotId: raw.leaderBotId,
        memberBotIds: members, invalidMembership: members.indexOf(raw.leaderBotId) < 0 });
    });
    var memberships = Object.create(null);
    spaces.forEach(function (space) {
      space.memberBotIds.forEach(function (botId) {
        if (!memberships[botId]) memberships[botId] = [];
        memberships[botId].push(space.id);
      });
    });
    var primaryId = id(snapshot.primaryBotId), nodes = [], edges = [];
    function instance(botId, kind, spaceId) {
      var bot = byBot[botId], spaceIds = (memberships[botId] || []).slice();
      var node = { id: kind + ':' + JSON.stringify([spaceId || '', botId]), botId: botId, kind: kind,
        spaceId: spaceId || '', name: bot ? bot.name : tr('Bot 不在当前目录',"Bot is not in the current directory"),
        avatar: bot ? bot.avatar : 'orbit', color: bot ? bot.color : '#7a7a7a',
        model: bot ? bot.model : '', harness: bot ? bot.harness : '',
        missing: !bot, unsupportedReason: bot ? bot.unsupportedReason : tr('当前目录无法找到这个 Bot',"This Bot could not be found in the current directory"),
        isPrimary: botId === primaryId, sharedSpaceCount: spaceIds.length, spaceIds: spaceIds };
      nodes.push(node);
      return node;
    }
    // An explicit host identity is required. Never promote the first Bot merely
    // because a legacy snapshot omitted the primary identity.
    var ceo = primaryId && byBot[primaryId] ? instance(primaryId, 'ceo', '') : null;
    var groups = spaces.map(function (space) {
      var leader = instance(space.leaderBotId, 'leader', space.id);
      var members = space.memberBotIds.filter(function (botId) { return botId !== space.leaderBotId; })
        .map(function (botId) { return instance(botId, 'member', space.id); });
      if (ceo) edges.push({ id: 'oversight:' + JSON.stringify(space.id), source: ceo.id, target: leader.id,
        kind: 'oversight', spaceId: space.id, sameIdentity: ceo.botId === leader.botId });
      members.forEach(function (member) {
        edges.push({ id: 'membership:' + JSON.stringify([space.id, member.botId]), source: leader.id,
          target: member.id, kind: 'membership', spaceId: space.id, sameIdentity: false });
      });
      return { id: space.id, spaceId: space.id, name: space.name, leader: leader, members: members,
        memberCount: space.memberBotIds.length, isPrimaryLed: leader.isPrimary, invalidMembership: space.invalidMembership };
    });
    var unassigned = bots.filter(function (bot) { return bot.id !== primaryId && !memberships[bot.id]; })
      .map(function (bot) { return instance(bot.id, 'unassigned', ''); });
    return { schema: 1, revision: Number.isSafeInteger(snapshot.revision) ? snapshot.revision : 0,
      primaryBotId: primaryId, ceo: ceo, groups: groups, unassigned: unassigned, nodes: nodes, edges: edges,
      stats: { botCount: bots.length, spaceCount: groups.length, unassignedBotCount: unassigned.length,
        sharedBotCount: bots.filter(function (bot) { return (memberships[bot.id] || []).length > 1; }).length } };
  }
  return Object.freeze({ build: build });
});
