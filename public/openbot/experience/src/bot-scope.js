/* Bot classification is metadata. Space membership comes only from the host. */
(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenBotScope = api;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  var TYPES = ['role', 'style', 'skill', 'custom'], MAX_TAGS = 24, MAX_LABEL = 40;
  function cleanLabel(value) {
    return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_LABEL) : '';
  }
  function normalizeTags(value) {
    var result = [], seen = new Set();
    if (!Array.isArray(value)) return result;
    value.slice(0, 200).forEach(function(tag) {
      if (!tag || typeof tag !== 'object' || !TYPES.includes(tag.type)) return;
      var label = cleanLabel(tag.label), key = tag.type + ':' + label;
      if (!label || seen.has(key) || result.length >= MAX_TAGS) return;
      seen.add(key); result.push({ type: tag.type, label: label });
    });
    return result;
  }
  function validTags(value) {
    if (!Array.isArray(value) || value.length > MAX_TAGS || Object.keys(value).length !== value.length) return false;
    var normalized = normalizeTags(value);
    return normalized.length === value.length && value.every(function(tag, index) {
      return tag && typeof tag === 'object' && !Array.isArray(tag) &&
        Object.keys(tag).length === 2 && Object.keys(tag).every(function(key) { return key === 'type' || key === 'label'; }) &&
        tag.type === normalized[index].type && tag.label === normalized[index].label;
    });
  }
  function mode(input) {
    return ['all', 'jarvis', 'space'].includes(input.botMode) ? input.botMode : input.orgMinimal === true ? 'jarvis' : 'all';
  }
  // A display collection only: do not remove these Bots from execution or
  // organization projections. The effective primary always stays reachable.
  function normalizeHiddenBotIds(input) {
    input = input || {};
    var bots = Array.isArray(input.bots) ? input.bots.filter(function(bot) { return bot && typeof bot.id === 'string'; }) : [];
    var ids = new Set(bots.map(function(bot) { return bot.id; }));
    var primary = ids.has(input.primaryBotId) ? input.primaryBotId : bots[0] && bots[0].id;
    var result = [], seen = new Set();
    (Array.isArray(input.hiddenBotIds) ? input.hiddenBotIds.slice(0, 500) : []).forEach(function(botId) {
      if (typeof botId !== 'string' || botId === primary || !ids.has(botId) || seen.has(botId)) return;
      seen.add(botId); result.push(botId);
    });
    return result;
  }
  function spaces(organization) {
    var source = organization && (organization.organization || organization);
    return source && Array.isArray(source.spaces) ? source.spaces : [];
  }
  function tagsForBot(bot, organization) {
    var tags = normalizeTags(bot && bot.tags);
    spaces(organization).forEach(function(space) {
      if (bot && space && Array.isArray(space.memberBotIds) && space.memberBotIds.includes(bot.id)) {
        tags.push({ type: 'space', id: space.id, label: String(space.name || space.id) });
      }
    });
    return tags;
  }
  function project(input) {
    input = input || {};
    var bots = Array.isArray(input.bots) ? input.bots.filter(function(bot) { return bot && typeof bot.id === 'string'; }) : [];
    var selectedMode = mode(input), space = null, ids;
    if (selectedMode === 'jarvis') ids = bots.filter(function(bot) { return bot.id === input.primaryBotId; }).map(function(bot) { return bot.id; });
    else if (selectedMode === 'space') {
      space = spaces(input.organization).find(function(item) { return item && item.id === input.activeSpaceId; }) || null;
      ids = space && Array.isArray(space.memberBotIds) ? bots.filter(function(bot) { return space.memberBotIds.includes(bot.id); }).map(function(bot) { return bot.id; }) : [];
    } else ids = bots.map(function(bot) { return bot.id; });
    var active = ids.includes(input.activeId) ? input.activeId : space && ids.includes(space.leaderBotId) ? space.leaderBotId : ids[0] || null;
    return { mode: selectedMode, space: space, visibleBotIds: ids, activeBotId: active };
  }
  return Object.freeze({ TYPES: TYPES, MAX_TAGS: MAX_TAGS, MAX_LABEL: MAX_LABEL, normalizeTags: normalizeTags,
    validTags: validTags, mode: mode, normalizeHiddenBotIds: normalizeHiddenBotIds, tagsForBot: tagsForBot, project: project });
});
