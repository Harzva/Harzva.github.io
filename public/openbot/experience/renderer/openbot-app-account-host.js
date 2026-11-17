(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenBotAppAccountHost = api;
})(typeof window === 'object' ? window : null, function (root) {
  'use strict';
  var controls = new Map(), snapshot = {}, listening = false;
  function text(value, limit) {
    return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, limit || 160) : '';
  }
  // Read-only projections. Credentials, allowlists and message contents never
  // enter the generic account component. A saved binding is not a live login.
  function telegramAccounts(bots, statuses) {
    var seen = new Set();
    return (Array.isArray(bots) ? bots : []).filter(function (bot) {
      return bot && bot.channels && bot.channels.telegram && bot.channels.telegram.connected === true;
    }).map(function (bot) {
      var runtime = statuses && statuses[bot.id] || {};
      var username = text(runtime.username, 100), identity = username ? username.toLowerCase() : String(bot.id);
      if (seen.has(identity)) return null;
      seen.add(identity);
      return { id: text(bot.id, 160), label: username || text(bot.name),
        address: username ? '@' + username : '', status: runtime.lastError ? 'error' : runtime.running ? 'connected' : 'saved',
        canSendMail: false, isDefaultSender: false };
    }).filter(Boolean);
  }
  function feishuAccounts(value) {
    return (value && Array.isArray(value.connections) ? value.connections : []).map(function (connection) {
      return { id: text(connection.id), label: text(connection.name), address: text(connection.appId),
        status: ['connected', 'connecting', 'unknown'].indexOf(connection.state) >= 0 ? connection.state : connection.state === 'failed' ? 'error' : 'saved',
        canSendMail: false, isDefaultSender: false };
    });
  }
  function update(options) {
    if (!root || !root.OpenBotAppAccounts) return;
    snapshot = Object.assign({}, snapshot, options || {});
    var grid = root.document.querySelector('#set-panel-apps .apps-grid');
    if (!grid) return;
    var feishu = root.OpenBotFeishuAccounts;
    var feishuState = feishu ? feishu.snapshot() : { loaded: false, connections: [] };
    grid.querySelectorAll('.apps-card[data-app]').forEach(function (card) {
      var appId = card.dataset.app, accounts = [], config = { appId: appId, available: false, accounts: accounts,
        loading: false, error: '', onOpenAccount: undefined, onAdd: undefined };
      if (appId === 'github' && root.OpenBotGitHubAccounts) {
        root.OpenBotGitHubAccounts.update({ card: card, bots: snapshot.bots, activeBotId: snapshot.activeBotId });
        return;
      }
      if (appId === 'telegram') {
        config.available = Boolean(snapshot.bridge && snapshot.bridge.channelStatus);
        config.accounts = telegramAccounts(snapshot.bots, snapshot.channelStatus);
        config.onOpenAccount = snapshot.openTelegram;
        // Reuse the original connect action; no second connect button.
      } else if (appId === 'feishu') {
        config.available = Boolean(snapshot.bridge && snapshot.bridge.feishuStatus);
        config.loading = !feishuState.loaded && !feishuState.error;
        config.error = feishuState.error || '';
        config.accounts = feishuAccounts(feishuState);
        if (feishuState.loaded && feishu) {
          config.onOpenAccount = feishu.open;
          config.onAdd = feishu.add;
        }
      }
      if (controls.has(appId)) controls.get(appId).update(config);
      else controls.set(appId, root.OpenBotAppAccounts.mount(card, config));
    });
    if (!listening) {
      root.document.addEventListener('openbot:feishu-accounts', function () { update(); });
      listening = true;
    }
  }
  return Object.freeze({ update: update, telegramAccounts: telegramAccounts, feishuAccounts: feishuAccounts });
});
