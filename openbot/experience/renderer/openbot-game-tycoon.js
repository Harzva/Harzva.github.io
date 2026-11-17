(function (root) {
  'use strict';
  // 大富翁牌桌：24 格 8×6 环形棋盘居中，右栏为对局状态（骰子、资产榜、机会记录）。
  // 只消费宿主投影后的公开观察（全部信息本就公开），拿不到机会牌堆顺序或种子。
  function tr(zh, en, params) {
    return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function'
      ? root.OpenBotI18n.t(zh, en, params)
      : zh;
  }
  function value(input, fallback) {
    return input === undefined || input === null ? (fallback === undefined ? '' : String(input)) : String(input);
  }
  function el(tag, className, content) {
    var item = root.document.createElement(tag);
    if (className) item.className = className;
    if (content !== undefined && content !== null) item.textContent = value(content);
    return item;
  }
  function append(parent, child) { if (child) parent.appendChild(child); return child; }
  function mapModule() { return root.OpenBotGameTycoonMap || (typeof require === 'function' ? require('./openbot-game-tycoon-map.js') : null); }
  function botColor(bot, fallback) {
    return bot && /^#[0-9a-f]{6}$/i.test(String(bot.color)) ? String(bot.color) : fallback || '#57606d';
  }
  // 小型内联图标：硬币（红利/工资）、问号（机会）、盾（保险）、百分号（税）。
  function icon(kind, color) {
    var svg = root.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('class', 'obgt-tile-icon');
    var add = function (tag, attrs) {
      var item = root.document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (var key in attrs) if (Object.hasOwn(attrs, key)) item.setAttribute(key, attrs[key]);
      svg.appendChild(item);
    };
    if (kind === 'coin') {
      add('circle', { cx: 10, cy: 10, r: 7, fill: 'none', stroke: color, 'stroke-width': 2 });
      add('path', { d: 'M10 5.5v9M7.5 7.5h5M7.5 12.5h5', stroke: color, 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' });
    } else if (kind === 'event') {
      add('path', { d: 'M6.5 7.2a3.5 3.5 0 1 1 5 3.2c-1.2.7-1.5 1.3-1.5 2.6', stroke: color, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' });
      add('circle', { cx: 10, cy: 15.6, r: 1.4, fill: color });
    } else if (kind === 'shield') {
      add('path', { d: 'M10 3.5 15.5 5.6v4.6c0 3.4-2.3 5.6-5.5 6.7-3.2-1.1-5.5-3.3-5.5-6.7V5.6Z', fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round' });
    } else if (kind === 'tax') {
      add('path', { d: 'M6 14 14 6M8 6.8a1.4 1.4 0 1 1 0 .01M12 13.2a1.4 1.4 0 1 1 0 .01', stroke: color, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' });
    } else if (kind === 'flag') {
      add('path', { d: 'M6 16V4m0 1h8l-2.4 2.6L14 10H6', stroke: color, 'stroke-width': 2, fill: 'none', 'stroke-linejoin': 'round' });
    }
    return svg;
  }

  function tileMeta(tile) {
    if (tile.kind === 'start') return { icon: 'flag', note: tr('薪水 {n}', 'Salary {n}', { n: 200 }) };
    if (tile.kind === 'bonus') return { icon: 'coin', note: tr('红利 {n}', 'Bonus {n}', { n: tile.amount }) };
    if (tile.kind === 'event') return { icon: 'event', note: tr('机会', 'Chance') };
    if (tile.kind === 'fee') return { icon: 'shield', note: tr('固定 {n}', 'Fee {n}', { n: tile.amount }) };
    if (tile.kind === 'tax') return { icon: 'tax', note: tr('现金 {n}%', 'Cash {n}%', { n: tile.rate }) };
    return { icon: null, note: tr('{n} 元', '{n}', { n: tile.price }) };
  }
  function pipRow(level) {
    var pips = el('span', 'obgt-level');
    for (var i = 0; i < 3; i++) {
      var pip = el('span', 'obgt-level-pip' + (i < level ? ' is-on' : ''));
      pips.appendChild(pip);
    }
    return pips;
  }

  function renderTile(tile, table, helpers) {
    var map = mapModule();
    var meta = tileMeta(tile);
    var ownerBot = tile.owner ? helpers.botById(tile.owner) : null;
    var cell = el('div', 'obgt-tile is-' + tile.kind + (ownerBot ? ' is-owned' : '')
      + (tile.group ? ' is-group-' + tile.group : ''));
    cell.style.gridArea = (tile.row + 1) + ' / ' + (tile.col + 1);
    cell.dataset.tycoonTile = String(tile.index);
    var band = el('span', 'obgt-tile-band');
    if (tile.group) band.style.background = map.color(tile.group);
    else if (tile.kind === 'start') band.style.background = 'var(--accent, #4a89e8)';
    else band.style.background = 'var(--text-3, #b9b6ad)';
    append(cell, band);
    var head = el('span', 'obgt-tile-head');
    append(head, el('span', 'obgt-tile-name', tile.name));
    if (meta.icon) append(head, icon(meta.icon, 'currentColor'));
    append(cell, head);
    append(cell, el('span', 'obgt-tile-note', meta.note));
    var foot = el('span', 'obgt-tile-foot');
    if (ownerBot) {
      var dot = el('span', 'obgt-owner-dot');
      dot.style.background = botColor(ownerBot);
      append(foot, dot);
      append(foot, el('span', 'obgt-owner-name', helpers.botName(ownerBot)));
    }
    if (tile.kind === 'prop' && tile.level > 0) append(foot, pipRow(tile.level));
    if (foot.children.length) append(cell, foot);
    return cell;
  }

  function renderTokens(table, helpers) {
    var layer = el('div', 'obgt-tokens');
    (table.players || []).forEach(function (player) {
      if (player.bankrupt) return;
      var map = mapModule();
      var tile = map.TILES.filter(function (item) { return item.index === player.position; })[0];
      if (!tile) return;
      var bot = helpers.botById(player.botId);
      var token = el('span', 'obgt-token');
      token.dataset.tycoonToken = String(player.botId);
      token.title = helpers.botLabel(player.botId);
      var face = el('span', 'obgt-token-avatar');
      helpers.avatar(face, bot, 'mini');
      var ring = el('span', 'obgt-token-ring');
      ring.style.borderColor = botColor(bot);
      append(token, ring);
      append(token, face);
      if (String(player.botId) === String(table.currentBotId)) token.classList.add('is-current');
      token.style.left = 'calc(' + ((tile.col + 0.5) / map.COLS * 100) + '% - 12px)';
      token.style.top = 'calc(' + ((tile.row + 0.85) / map.ROWS * 100) + '% - 12px)';
      layer.appendChild(token);
    });
    return layer;
  }

  function renderDice(table) {
    var box = el('div', 'obgt-dice');
    append(box, el('h4', 'obgs-subsection-title', tr('骰子', 'Dice')));
    var row = el('div', 'obgt-dice-row');
    var dice = table.lastRoll ? table.lastRoll.dice : null;
    for (var d = 0; d < 2; d++) {
      var die = el('span', 'obgt-die' + (dice ? '' : ' is-idle'));
      for (var pip = 1; pip <= 9; pip++) {
        var positions = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
        var on = dice ? positions[dice[d]].indexOf(pip) >= 0 : false;
        die.appendChild(el('span', 'obgt-die-pip' + (on ? ' is-on' : '')));
      }
      row.appendChild(die);
    }
    append(box, row);
    append(box, el('p', 'obgs-quiet obgt-dice-note', table.lastRoll
      ? tr('{name} 掷出 {a} + {b}', '{name} rolled {a} + {b}',
        { name: value(table.lastRoll.botId), a: dice[0], b: dice[1] })
      : tr('等待摇骰', 'Waiting for the roll')));
    return box;
  }

  function renderStandings(table, helpers) {
    var box = el('div', 'obgt-standings');
    append(box, el('h4', 'obgs-subsection-title', tr('资产榜', 'Net worth')));
    var rows = (table.players || []).slice().sort(function (a, b) { return b.netWorth - a.netWorth; });
    rows.forEach(function (player) {
      var bot = helpers.botById(player.botId);
      var row = el('div', 'obgt-standing' + (String(player.botId) === String(table.currentBotId) ? ' is-current' : '')
        + (player.bankrupt ? ' is-bankrupt' : ''));
      var dot = el('span', 'obgt-owner-dot');
      dot.style.background = botColor(bot);
      append(row, dot);
      append(row, el('span', 'obgt-standing-name', bot ? helpers.botName(bot) : helpers.botLabel(player.botId)));
      append(row, el('span', 'obgt-standing-cash', tr('现金 {n}', 'Cash {n}', { n: player.cash })));
      append(row, el('span', 'obgt-standing-worth', tr('身价 {n}', 'Worth {n}', { n: player.netWorth })));
      if (player.bankrupt) append(row, el('span', 'obgt-standing-badge', tr('破产', 'Bankrupt')));
      box.appendChild(row);
    });
    return box;
  }

  function renderEventLog(table) {
    var box = el('div', 'obgt-event-note');
    append(box, el('h4', 'obgs-subsection-title', tr('最近机会', 'Last chance')));
    append(box, el('p', 'obgs-quiet', table.lastEvent
      ? tr('{name}：{text}', '{name}: {text}', { name: value(table.lastEvent.botId), text: table.lastEvent.text })
      : tr('还没有人抽到机会卡。', 'No chance card drawn yet.')));
    append(box, el('p', 'obgs-quiet', tr('机会牌堆剩 {count} 张（顺序对玩家隐藏）。', 'Event deck holds {count} cards (order hidden).',
      { count: Number(table.eventDeckCount) || 0 })));
    return box;
  }

  function render(host, context) {
    var table = context.table;
    var helpers = context.helpers;
    var map = mapModule();
    var board = el('div', 'obgt-board');
    var ringWrap = el('div', 'obgt-ring-wrap');
    var ring = el('div', 'obgt-ring');
    ring.style.gridTemplateColumns = 'repeat(' + map.COLS + ', minmax(0, 1fr))';
    ring.style.gridTemplateRows = 'repeat(' + map.ROWS + ', minmax(0, 1fr))';
    ring.setAttribute('aria-label', tr('大富翁棋盘：24 格环形地产', 'Tycoon board: 24-tile property ring'));
    map.TILES.forEach(function (geometry) {
      var state = (table.tiles || []).filter(function (item) { return Number(item.index) === geometry.index; })[0] || {};
      // 几何（行列）必须取自地图模块；观察数据只提供归属与等级。
      var tile = Object.assign({}, geometry, state);
      ring.appendChild(renderTile(tile, table, helpers));
    });
    append(ringWrap, ring);
    append(ringWrap, renderTokens(table, helpers));
    var center = el('div', 'obgt-center');
    append(center, el('strong', 'obgt-center-title', tr('大富翁', 'Tycoon')));
    append(center, el('span', 'obgt-center-sub', tr('24 格环形地产 · 双骰子 · 15 轮按身价结算',
      '24-tile ring · two dice · 15 rounds by net worth')));
    ring.appendChild(center);
    board.appendChild(ringWrap);
    var side = el('div', 'obgt-side');
    append(side, renderDice(table));
    append(side, renderStandings(table, helpers));
    append(side, renderEventLog(table));
    board.appendChild(side);
    host.appendChild(board);
  }

  var api = { render: render };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotGameTycoon = Object.freeze(api);
})(typeof window === 'object' ? window : globalThis);
