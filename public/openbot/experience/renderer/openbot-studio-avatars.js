/* Bot Studio role and B-O-T-S-T-U-D-I-O letter vector avatars. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OpenBotStudioAvatars = factory();
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  function tr(zh, en) {
    var i18n = typeof window === 'object' && window.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en) : zh;
  }
  var raw = [
    { id: 'studio-kb', file: 'role-knowledge.svg', tone: '#8FBA4B', zh: '知识库蛇', en: 'KB Snake', zhDesc: '书环小蛇，整理与检索知识库', enDesc: 'Coiled book snake for knowledge retrieval' },
    { id: 'studio-support', file: 'role-support.svg', tone: '#54BFF3', zh: '客服泡泡', en: 'Support Bubble', zhDesc: '佩戴耳机的对话气泡，负责客服与接待', enDesc: 'Headset speech bubble for customer support' },
    { id: 'studio-acceptance', file: 'role-acceptance.svg', tone: '#A38AF7', zh: '验收折页', en: 'Acceptance Card', zhDesc: '带绿色对勾的折角任务卡，专职验收核对', enDesc: 'Folded task card with verification check' },
    { id: 'studio-b', file: 'letter-b.svg', tone: '#234A36', zh: 'B · 双镜', en: 'B · Goggles', zhDesc: 'Bot Studio 字母家族 B · 双镜 Bot', enDesc: 'Bot Studio letter B · Goggles Bot' },
    { id: 'studio-o1', file: 'letter-o1.svg', tone: '#4D91A0', zh: 'O · 镜头', en: 'O · Lens', zhDesc: 'Bot Studio 字母家族 O · 镜头 Bot', enDesc: 'Bot Studio letter O · Lens Bot' },
    { id: 'studio-t1', file: 'letter-t1.svg', tone: '#E4AC78', zh: 'T · 工具', en: 'T · Tool', zhDesc: 'Bot Studio 字母家族 T · 工具 Bot', enDesc: 'Bot Studio letter T · Tool Bot' },
    { id: 'studio-s', file: 'letter-s.svg', tone: '#91B353', zh: 'S · 曲线', en: 'S · Curve', zhDesc: 'Bot Studio 字母家族 S · 曲线精灵', enDesc: 'Bot Studio letter S · Curve Sprite' },
    { id: 'studio-t2', file: 'letter-t2.svg', tone: '#69B7D0', zh: 'T · 灯塔', en: 'T · Beacon', zhDesc: 'Bot Studio 字母家族 T · 灯塔', enDesc: 'Bot Studio letter T · Beacon' },
    { id: 'studio-u', file: 'letter-u.svg', tone: '#DE9B6B', zh: 'U · 收纳', en: 'U · Basket', zhDesc: 'Bot Studio 字母家族 U · 收纳篮', enDesc: 'Bot Studio letter U · Basket' },
    { id: 'studio-d', file: 'letter-d.svg', tone: '#9C8BDD', zh: 'D · 折页', en: 'D · Fold', zhDesc: 'Bot Studio 字母家族 D · 折页', enDesc: 'Bot Studio letter D · Fold' },
    { id: 'studio-i', file: 'letter-i.svg', tone: '#55B5C2', zh: 'I · 信标', en: 'I · Signal', zhDesc: 'Bot Studio 字母家族 I · 信标', enDesc: 'Bot Studio letter I · Signal' },
    { id: 'studio-o2', file: 'letter-o2.svg', tone: '#EBA562', zh: 'O · 轨道', en: 'O · Orbit', zhDesc: 'Bot Studio 字母家族 O · 轨道', enDesc: 'Bot Studio letter O · Orbit' }
  ];
  var characters = Object.freeze(raw.map(function (item) {
    return Object.freeze({
      id: item.id,
      file: item.file,
      tone: item.tone,
      name: tr(item.zh, item.en),
      desc: tr(item.zhDesc, item.enDesc)
    });
  }));
  var byId = new Map(characters.map(function (c) { return [c.id, c]; }));
  function fileFor(id) {
    var item = byId.get(id);
    return item ? item.file : null;
  }
  return Object.freeze({
    characters: characters,
    ids: Object.freeze(characters.map(function (c) { return c.id; })),
    fileFor: fileFor
  });
});
