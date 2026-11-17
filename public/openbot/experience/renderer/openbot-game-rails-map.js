(function (root) {
  'use strict';
  // 展示几何：由内核 src/game-rails/map-data.cjs 生成（坐标与线路一一对应，
  // test/game-rails.test.js 交叉校验两者，防止漂移）。调色板为展示用原创配色。
  var PALETTE = {
  "red": "#c2453a",
  "orange": "#d97c2b",
  "yellow": "#c99a26",
  "green": "#4f8a54",
  "blue": "#3e6fa6",
  "purple": "#7b5ea0",
  "black": "#3c4046",
  "white": "#8d8a80",
  "gray": "#9aa0a8"
};
  var CITIES = [
    { id: "beigang", name: "北港", x: 120, y: 92 },
    { id: "yunling", name: "云岭", x: 330, y: 58 },
    { id: "cangyuan", name: "苍原", x: 560, y: 70 },
    { id: "dongwang", name: "东望", x: 826, y: 84 },
    { id: "tiegu", name: "铁谷", x: 200, y: 214 },
    { id: "xinghu", name: "星湖", x: 430, y: 192 },
    { id: "changqiao", name: "长桥", x: 664, y: 204 },
    { id: "fengxia", name: "风峡", x: 902, y: 196 },
    { id: "shimen", name: "石门", x: 116, y: 344 },
    { id: "qingmai", name: "青麦", x: 352, y: 332 },
    { id: "tongshan", name: "铜山", x: 592, y: 330 },
    { id: "baitan", name: "白滩", x: 836, y: 322 },
    { id: "yanze", name: "盐泽", x: 198, y: 474 },
    { id: "shazhou", name: "沙洲", x: 432, y: 470 },
    { id: "mulin", name: "暮林", x: 662, y: 474 },
    { id: "luoxia", name: "落霞", x: 884, y: 470 },
    { id: "jinsui", name: "金穗", x: 326, y: 584 },
    { id: "nanping", name: "南屏", x: 622, y: 582 }
  ];
  var ROUTES = [
    { id: "r01", from: "beigang", to: "yunling", color: "blue", length: 2 },
    { id: "r02", from: "yunling", to: "cangyuan", color: "green", length: 2 },
    { id: "r03", from: "cangyuan", to: "dongwang", color: "white", length: 2 },
    { id: "r04", from: "dongwang", to: "fengxia", color: "black", length: 1 },
    { id: "r05", from: "beigang", to: "tiegu", color: "orange", length: 2 },
    { id: "r06", from: "yunling", to: "tiegu", color: "yellow", length: 1 },
    { id: "r07", from: "yunling", to: "xinghu", color: "purple", length: 2 },
    { id: "r08", from: "cangyuan", to: "xinghu", color: "white", length: 2 },
    { id: "r09", from: "cangyuan", to: "changqiao", color: "red", length: 2 },
    { id: "r10", from: "dongwang", to: "changqiao", color: "green", length: 2 },
    { id: "r11", from: "fengxia", to: "changqiao", color: "orange", length: 3 },
    { id: "r12", from: "tiegu", to: "shimen", color: "blue", length: 2 },
    { id: "r13", from: "tiegu", to: "qingmai", color: "red", length: 2 },
    { id: "r14", from: "xinghu", to: "qingmai", color: "yellow", length: 2 },
    { id: "r15", from: "xinghu", to: "tongshan", color: "green", length: 3 },
    { id: "r16", from: "changqiao", to: "tongshan", color: "blue", length: 1 },
    { id: "r17", from: "changqiao", to: "baitan", color: "purple", length: 2 },
    { id: "r18", from: "fengxia", to: "baitan", color: "yellow", length: 2 },
    { id: "r19", from: "shimen", to: "yanze", color: "gray", length: 2 },
    { id: "r20", from: "shimen", to: "qingmai", color: "purple", length: 3 },
    { id: "r21", from: "qingmai", to: "shazhou", color: "white", length: 2 },
    { id: "r22", from: "qingmai", to: "yanze", color: "orange", length: 2 },
    { id: "r23", from: "tongshan", to: "mulin", color: "black", length: 2 },
    { id: "r24", from: "tongshan", to: "baitan", color: "gray", length: 2 },
    { id: "r25", from: "baitan", to: "luoxia", color: "green", length: 2 },
    { id: "r26", from: "yanze", to: "jinsui", color: "yellow", length: 2 },
    { id: "r27", from: "shazhou", to: "jinsui", color: "blue", length: 2 },
    { id: "r28", from: "shazhou", to: "mulin", color: "red", length: 3 },
    { id: "r29", from: "mulin", to: "nanping", color: "green", length: 1 },
    { id: "r30", from: "mulin", to: "luoxia", color: "purple", length: 2 },
    { id: "r31", from: "jinsui", to: "nanping", color: "black", length: 2 },
    { id: "r32", from: "luoxia", to: "nanping", color: "white", length: 2 },
    { id: "r33", from: "tongshan", to: "shazhou", color: "orange", length: 1 }
  ];
  var byId = function (list) {
    var map = Object.create(null);
    list.forEach(function (item) { map[item.id] = item; });
    return map;
  };
  var api = Object.freeze({
    CITIES: Object.freeze(CITIES.map(function (city) { return Object.freeze(city); })),
    ROUTES: Object.freeze(ROUTES.map(function (route) { return Object.freeze(route); })),
    cityById: Object.freeze(byId(CITIES)),
    routeById: Object.freeze(byId(ROUTES)),
    palette: Object.freeze(PALETTE),
    color: function (name) { return PALETTE[name] || PALETTE.gray; }
  });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotGameRailsMap = api;
})(typeof window === 'object' ? window : globalThis);
