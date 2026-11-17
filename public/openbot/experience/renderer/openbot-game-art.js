(function (root) {
  'use strict';
  // Static allowlist: labels remain the rules engine's public display values.
  // This module never receives hidden card IDs or a filesystem path.
  var entries = Object.create(null);
  var suits = { '♠': 'S', '♥': 'H', '♣': 'C', '♦': 'D' };
  var ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  Object.keys(suits).forEach(function (suit) {
    ranks.forEach(function (rank) {
      var key = suit + rank;
      entries['cards:' + key] = { src: 'assets/game/poker/' + (rank === '10' ? 'T' : rank) + suits[suit] + '.svg', alt: key, kind: 'poker', back: false };
    });
  });
  entries['cards:小王'] = { src: 'assets/game/poker/2J.svg', alt: '小王', kind: 'poker', back: false };
  entries['cards:大王'] = { src: 'assets/game/poker/1J.svg', alt: '大王', kind: 'poker', back: false };
  entries['cards:back'] = { src: 'assets/game/poker/1B.svg', alt: '未公开的扑克牌', kind: 'poker', back: true };
  ['万','筒','条'].forEach(function (suit, index) {
    for (var rank = 1; rank <= 9; rank++) entries['tiles:' + rank + suit] = {
      src: 'assets/game/mahjong/' + ['Man','Pin','Sou'][index] + rank + '.svg', alt: rank + suit, kind: 'mahjong', back: false
    };
  });
  ['东','南','西','北','中','发','白'].forEach(function (label, index) {
    entries['tiles:' + label] = { src: 'assets/game/mahjong/' + ['Ton','Nan','Shaa','Pei','Chun','Hatsu','Haku'][index] + '.svg', alt: label, kind: 'mahjong', back: false };
  });
  entries['tiles:■'] = { src: 'assets/game/mahjong/Back.svg', alt: '未公开的麻将牌', kind: 'mahjong', back: true };
  // Rails: engine labels remain the keys, while vector cards supply their faces.
  var railCards = { '红车皮': 'red', '橙车皮': 'orange', '黄车皮': 'yellow', '绿车皮': 'green', '蓝车皮': 'blue', '紫车皮': 'purple', '黑车皮': 'black', '白车皮': 'white' };
  Object.keys(railCards).forEach(function (label) {
    entries['rails:' + label] = { src: 'assets/game/rails/train-' + railCards[label] + '.svg', alt: label, kind: 'rails', back: false };
  });
  entries['rails:机车'] = { src: 'assets/game/rails/train-loc.svg', alt: '机车', kind: 'rails', back: false };
  entries['rails:任务票'] = { src: 'assets/game/rails/ticket.svg', alt: '运输任务票', kind: 'rails', back: false };
  entries['rails:车皮'] = { src: 'assets/game/rails/train-piece.svg', alt: '火车棋子', kind: 'rails', back: false };
  // Sealed-Bid Auction lots: one original vector motif per family, so a lot is
  // always recognisable as an object rather than a number.
  [['tea', '茶器'], ['silk', '绸缎'], ['porcelain', '瓷器'], ['jade', '玉器'], ['ink', '墨与砚'], ['lacquer', '漆器']].forEach(function (pair) {
    entries['lots:' + pair[0]] = { src: 'assets/game/lots/' + pair[0] + '.svg', alt: pair[1] + '藏品', kind: 'lot', back: false };
  });
  // Caravan goods use the engine's public labels and include a real card back.
  [['茶', 'tea'], ['丝', 'silk'], ['瓷', 'porcelain'], ['玉', 'jade'], ['驼票', 'camel']].forEach(function (pair) {
    entries['caravan:' + pair[0]] = { src: 'assets/game/caravan/' + pair[1] + '.svg', alt: pair[0], kind: 'caravan', back: false };
  });
  entries['caravan:back'] = { src: 'assets/game/caravan/back.svg', alt: '未公开的货票', kind: 'caravan', back: true };
  Object.keys(entries).forEach(function (key) { Object.freeze(entries[key]); });
  Object.freeze(entries);
  var api = Object.freeze({
    resolve: function (label, type) { return entries[type + ':' + String(label)] || null; },
    inventory: function () { return Object.keys(entries).map(function (key) { return Object.assign({ key: key }, entries[key]); }); }
  });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotGameArt = api;
})(typeof window === 'object' ? window : globalThis);
