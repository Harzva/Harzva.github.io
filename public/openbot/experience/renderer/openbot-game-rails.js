(function (root) {
  'use strict';
  // 铁道计划牌桌：按游戏真实空间关系布局——地图居中（城市/线路/归属）、
  // 面上市场与座位供给环绕、观察者手牌与任务票固定在下方。
  // 只消费宿主投影后的公开观察（table），拿不到种子、牌堆顺序或对手手牌。
  var state = null;

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
  function mapModule() { return root.OpenBotGameRailsMap || (typeof require === 'function' ? require('./openbot-game-rails-map.js') : null); }
  function piece(label) {
    var registry = root.OpenBotGameArt;
    if (registry && typeof registry.resolve === 'function') {
      var art = null;
      try { art = registry.resolve(label, 'rails'); } catch (_) { }
      if (art && art.src) {
        var image = el('img', 'obgs-piece-art obgs-card is-rails');
        image.src = art.src;
        image.alt = value(art.alt, label);
        image.title = label;
        image.draggable = false;
        image.decoding = 'async';
        return image;
      }
    }
    var fallback = el('span', 'obgs-card obgs-piece-unavailable', label);
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', label);
    return fallback;
  }

  function svgNode(tag, attrs) {
    var item = root.document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) for (var key in attrs) if (Object.hasOwn(attrs, key)) item.setAttribute(key, attrs[key]);
    return item;
  }
  function railBand(a, b) {
    // 两道铁轨 + 枕木的简化画法：底层粗带 + 中线虚线。
    var band = svgNode('g', { class: 'obgs-rail-band' });
    band.appendChild(svgNode('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'stroke-linecap': 'round' }));
    band.appendChild(svgNode('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'stroke-linecap': 'butt', class: 'obgs-rail-ties' }));
    return band;
  }
  function trainMarker(x, y, color) {
    var marker = svgNode('g', { transform: 'translate(' + (x - 11) + ' ' + (y - 7) + ')', class: 'obgs-rail-train' });
    marker.appendChild(svgNode('path', { d: 'M2 9h8L14 3h6a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H2Z M3 1h5v4H3Z', fill: color }));
    marker.appendChild(svgNode('rect', { x: 1, y: 12, width: 22, height: 2.6, rx: 1.3, fill: color }));
    marker.appendChild(svgNode('circle', { cx: 6, cy: 15.6, r: 2.4, fill: color }));
    marker.appendChild(svgNode('circle', { cx: 13, cy: 15.6, r: 2.4, fill: color }));
    marker.appendChild(svgNode('circle', { cx: 19, cy: 15.6, r: 2.4, fill: color }));
    return marker;
  }

  function renderMap(table, helpers) {
    var map = mapModule();
    var svg = svgNode('svg', { viewBox: '0 0 960 640', class: 'obgs-rails-map', role: 'img',
      'aria-label': tr('铁道计划地图：城市与线路归属', 'Rails map: cities and route ownership') });
    var claims = {};
    (table.routes || []).forEach(function (route) { claims[route.id] = route.claimedBy || null; });
    map.ROUTES.forEach(function (route) {
      var a = map.cityById[route.from], b = map.cityById[route.to];
      var owner = claims[route.id];
      var ownerBot = owner ? helpers.botById(owner) : null;
      var ownerColor = ownerBot && /^#[0-9a-f]{6}$/i.test(String(ownerBot.color)) ? String(ownerBot.color) : '#57606d';
      var band = railBand(a, b);
      band.classList.add(owner ? 'is-claimed' : 'is-open');
      band.querySelector('line').setAttribute('stroke', owner ? ownerColor : map.color(route.color));
      band.dataset.railsRoute = route.id;
      svg.appendChild(band);
      if (owner) svg.appendChild(trainMarker((a.x + b.x) / 2, (a.y + b.y) / 2, ownerColor));
    });
    map.CITIES.forEach(function (city) {
      var dot = svgNode('g', { class: 'obgs-rails-city', transform: 'translate(' + city.x + ' ' + city.y + ')' });
      dot.appendChild(svgNode('circle', { r: 7, class: 'obgs-rails-city-dot' }));
      dot.appendChild(svgNode('circle', { r: 2.8, class: 'obgs-rails-city-core' }));
      var label = svgNode('text', { x: 0, y: -12, 'text-anchor': 'middle', class: 'obgs-rails-city-name' });
      label.textContent = city.name;
      dot.appendChild(label);
      svg.appendChild(dot);
    });
    return svg;
  }

  function renderSeats(table, helpers) {
    var row = el('div', 'obgs-seats obgs-rails-seats');
    row.setAttribute('aria-label', tr('牌桌座位', 'Table seats'));
    (table.players || []).forEach(function (player) {
      var bot = helpers.botById(player.botId);
      var chip = el('article', 'obgs-seat obgs-rails-seat' + (String(player.botId) === String(table.currentBotId) ? ' is-current' : ''));
      if (String(player.botId) === String(table.currentBotId)) chip.setAttribute('aria-current', 'true');
      var head = el('div', 'obgs-seat-head');
      var face = el('span', 'obgs-seat-avatar');
      helpers.avatar(face, bot, 'mini');
      append(head, face);
      var identity = el('div', 'obgs-seat-identity');
      append(identity, el('strong', 'obgs-seat-name', bot ? helpers.botName(bot) : helpers.botLabel(player.botId)));
      append(identity, el('span', 'obgs-seat-role', tr('{routes} 条线路', '{routes} routes', { routes: Number(player.routes) || 0 })));
      append(head, identity);
      var supply = el('span', 'obgs-rails-supply');
      var supplyPiece = piece('车皮');
      supplyPiece.classList.add('obgs-rails-supply-art');
      append(supply, supplyPiece);
      append(supply, el('span', 'obgs-seat-count', tr('{count} 节', '{count} left', { count: Number(player.trains) || 0 })));
      append(head, supply);
      chip.appendChild(head);
      row.appendChild(chip);
    });
    return row;
  }

  function renderMarket(table) {
    var market = el('div', 'obgs-rails-market');
    append(market, el('h4', 'obgs-subsection-title', tr('面上车皮市场', 'Face-up market')));
    var row = el('div', 'obgs-piece-row obgs-card-row obgs-rails-market-row');
    var slots = Array.isArray(table.market) ? table.market : [];
    for (var i = 0; i < 5; i++) {
      var slot = el('span', 'obgs-rails-market-slot');
      if (slots[i]) append(slot, piece(slots[i]));
      else { slot.classList.add('is-empty'); slot.setAttribute('aria-label', tr('空位', 'Empty slot')); }
      row.appendChild(slot);
    }
    market.appendChild(row);
    var counts = el('p', 'obgs-quiet obgs-rails-supply-line',
      tr('牌堆 {deck} · 弃牌 {discard} · 任务 {tickets} · 机车达 3 张整排重补',
        'Deck {deck} · discards {discard} · tickets {tickets} · 3 locomotives reset the row',
        { deck: Number(table.deckCount) || 0, discard: Number(table.discardCount) || 0, tickets: Number(table.ticketDeckCount) || 0 }));
    market.appendChild(counts);
    return market;
  }

  function renderOwnHand(player) {
    if (!player || !player.hand) return null;
    var hand = el('div', 'obgs-rails-own-hand');
    append(hand, el('h4', 'obgs-subsection-title', tr('你的车皮手牌', 'Your train cards')));
    var row = el('div', 'obgs-piece-row obgs-card-row');
    var names = { red: '红车皮', orange: '橙车皮', yellow: '黄车皮', green: '绿车皮', blue: '蓝车皮', purple: '紫车皮', black: '黑车皮', white: '白车皮', loc: '机车' };
    Object.keys(names).forEach(function (color) {
      var count = Number(player.hand[color]) || 0;
      if (!count) return;
      var chip = el('span', 'obgs-rails-hand-chip');
      append(chip, piece(names[color]));
      append(chip, el('span', 'obgs-rails-hand-count', '×' + count));
      row.appendChild(chip);
    });
    if (!row.children.length) append(row, el('span', 'obgs-quiet', tr('手牌为空。', 'No cards in hand.')));
    hand.appendChild(row);
    if (Array.isArray(player.tickets) && player.tickets.length) {
      append(hand, el('h4', 'obgs-subsection-title obgs-rails-tickets-title', tr('你的任务票', 'Your tickets')));
      var tickets = el('div', 'obgs-rails-own-tickets');
      player.tickets.forEach(function (label) {
        var card = el('span', 'obgs-rails-ticket');
        append(card, piece('任务票'));
        append(card, el('span', 'obgs-rails-ticket-label', label));
        tickets.appendChild(card);
      });
      hand.appendChild(tickets);
    }
    return hand;
  }

  function renderOffer(table) {
    if (!table.offer) return null;
    var offer = el('div', 'obgs-rails-offer');
    append(offer, el('h4', 'obgs-subsection-title', tr('当前任务选择（至少保留 {count} 张）', 'Ticket choice (keep at least {count})', { count: Number(table.minKeep) || 1 })));
    var row = el('div', 'obgs-rails-own-tickets');
    (table.offer || []).forEach(function (label) {
      var card = el('span', 'obgs-rails-ticket');
      append(card, piece('任务票'));
      append(card, el('span', 'obgs-rails-ticket-label', label));
      row.appendChild(card);
    });
    offer.appendChild(row);
    return offer;
  }

  function renderSettlement(table, helpers) {
    var players = (table.players || []).filter(function (player) { return Array.isArray(player.tickets) && player.tickets.length; });
    if (!table.result || !players.length) return null;
    var strip = el('div', 'obgs-rails-settlement');
    players.forEach(function (player) {
      var bot = helpers.botById(player.botId);
      var line = el('p', 'obgs-rails-settlement-line');
      append(line, el('strong', '', bot ? helpers.botName(bot) : helpers.botLabel(player.botId)));
      append(line, el('span', '', ' ' + player.tickets.join('　')));
      strip.appendChild(line);
    });
    return strip;
  }

  function render(host, context) {
    var table = context.table;
    var helpers = context.helpers;
    var board = el('div', 'obgs-rails-board');
    var mapCell = el('div', 'obgs-rails-map-cell');
    mapCell.appendChild(renderMap(table, helpers));
    var settlement = renderSettlement(table, helpers);
    if (settlement) mapCell.appendChild(settlement);
    board.appendChild(mapCell);
    var side = el('div', 'obgs-rails-side-cell');
    side.appendChild(renderMarket(table));
    side.appendChild(renderSeats(table, helpers));
    board.appendChild(side);
    var own = (table.players || []).find(function (player) { return String(player.botId) === String(context.viewBotId); });
    var hand = renderOwnHand(own);
    if (hand) board.appendChild(hand);
    var offer = renderOffer(table);
    if (offer) board.appendChild(offer);
    host.appendChild(board);
  }
  state = { render: render };
  if (typeof module === 'object' && module.exports) module.exports = state;
  else root.OpenBotGameRails = Object.freeze(state);
})(typeof window === 'object' ? window : globalThis);
