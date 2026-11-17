/* OpenBot · Theme Skin Registry & DSH Plugin Hub.
 * Manages standardized character series packs conforming to openbot.skin-pack/1.
 * Browser: OpenBotSkinRegistry.listSkinPacks()
 * Node: require('./openbot-skin-registry.js')
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotSkinRegistry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const tr = (zh, en, params) => {
    const i18n = typeof window === 'object' && window.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en, params) : zh;
  };

  const SCHEMA_VERSION = 'openbot.skin-pack/1';

  const BUILTIN_PACKS = [
    {
      id: 'openbot.skin.cats',
      seriesId: 'cats',
      name: tr('官方猫咪系列 (OpCat 家族)', 'Cat Series (OpCat Family)'),
      version: '1.0.0',
      badge: '🐱',
      category: 'animals',
      official: true,
      featured: true,
      description: tr('“标志即桌宠，桌宠即标志”；包含极客蓝白、元气暖橘、黑客黑猫、奶盖三花。专为程序员设计的终极陪伴，自带揣手手与抓Bug物理。',
        'Official OpCat family featuring Cyber Blue, Tangerine Ginger, Obsidian Tuxedo and Calico Mochi with cat loafing and bug hunter mechanics.'),
      author: { name: 'OpenBot Studio', url: 'https://openbot.harzva.online' },
      characters: ['opcat', 'cat-ginger', 'cat-tuxedo', 'cat-calico'],
      defaultCharacterId: 'opcat',
      tags: ['cat', 'opcat', 'mascot', 'cyber', 'kawaii']
    },
    {
      id: 'openbot.skin.ai-pals',
      seriesId: 'ai-pals',
      name: tr('AI 明星伙伴系列 (Clawd 家族)', 'AI Model Pals (Clawd & Friends)'),
      version: '1.0.0',
      badge: '🤖',
      category: 'ai',
      official: true,
      featured: true,
      description: tr('汇聚全球主流 AI 模型专属形象：主打 Claude 原版像素桌宠 Clawd（珊瑚橙软萌体，具备打字/思考/跳舞等18套原版动画）、ChatGPT 智慧光环、DeepSeek 湛蓝小鲸鱼、Grok 星环机器人、Antigravity 四芒星、Kimi 极客紫星与 Qwen 水晶灵石。',
        'All-star AI companion pack: Anthropic Claude official Clawd pixel mascot with 18 animations, ChatGPT wisdom halo, DeepSeek blue whale, Grok Saturn robot, Antigravity star, Kimi star and Qwen gem.'),
      author: { name: 'OpenBot Studio × OpenSource Community', url: 'https://github.com/jazzenchen/agent-hud-open' },
      characters: ['clawd', 'openai-spark', 'deepseek-whale', 'grok-saturn', 'antigravity-spark', 'kimi-star', 'qwen-gem'],
      defaultCharacterId: 'clawd',
      tags: ['claude', 'clawd', 'chatgpt', 'deepseek', 'grok', 'antigravity', 'kimi', 'qwen', 'pixel', 'mascot'],
      attribution: tr('致敬 Anthropic PBC (Clawd 像素精灵)、OpenAI、DeepSeek、xAI、Google DeepMind、Moonshot AI 与阿里巴巴通义，资源规范提取自开源仓库 jazzenchen/agent-hud-open。',
        'Attribution: Anthropic PBC (Clawd pixel sprites), OpenAI, DeepSeek, xAI, Google DeepMind, Moonshot AI, and Alibaba Qwen; extracted via jazzenchen/agent-hud-open.')
    },
    {
      id: 'openbot.skin.dogs',
      seriesId: 'dogs',
      name: tr('忠诚狗狗系列 (OpDog 家族)', 'Dog Series (OpDog Family)'),
      version: '1.0.0',
      badge: '🐕',
      category: 'animals',
      official: true,
      featured: false,
      description: tr('元气满满、摇尾应援的小伙伴；包含呆萌柴犬与短腿柯基，活泼热情，守护每一个自动化与长时构建任务。',
        'Loyal canine companions featuring Golden Shiba and Peach Corgi to cheer and watch over tasks.'),
      author: { name: 'OpenBot Studio', url: 'https://openbot.harzva.online' },
      characters: ['dog-shiba', 'dog-corgi'],
      defaultCharacterId: 'dog-shiba',
      tags: ['dog', 'corgi', 'shiba', 'cheer', 'companion']
    },
    {
      id: 'openbot.skin.shapes',
      seriesId: 'shapes',
      name: tr('极简几何系列 (原生经典)', 'Shape Series (Original Classics)'),
      version: '1.0.0',
      badge: '🔷',
      category: 'geometry',
      official: true,
      featured: false,
      description: tr('12 个原生极简几何角色（门门、芽芽、团团、啵啵、糯糯等），纯粹克制，高对比度，专注沉浸工作流。',
        '12 original geometric minimal characters (Peek, Sprout, TuanTuan, Capsule, Mochi, etc.) for focused coding.'),
      author: { name: 'OpenBot Studio', url: 'https://openbot.harzva.online' },
      characters: ['peek', 'sprout', 'tuantuan', 'bubble', 'fold', 'mochi', 'ghost', 'moon', 'curl', 'clover', 'seed', 'capsule'],
      defaultCharacterId: 'capsule',
      tags: ['minimal', 'geometry', 'classic']
    },
    {
      id: 'openbot.skin.fruits',
      seriesId: 'fruits',
      name: tr('鲜美果蔬系列 (果蔬乐园)', 'Produce Series (Fruit & Veggie)'),
      version: '1.0.0',
      badge: '🍓',
      category: 'produce',
      official: true,
      featured: false,
      description: tr('20 个鲜艳多汁的角色（草莓、桃子、香蕉、柠檬、蓝莓、闪闪、冻冻等），萌趣活泼，日常任务轻松愉快。',
        '20 vibrant and juicy characters (Strawberry, Peach, Banana, Lemon, Blueberry, Bolt, Jelly, etc.).'),
      author: { name: 'OpenBot Studio', url: 'https://openbot.harzva.online' },
      characters: ['strawberry', 'peach', 'banana', 'lemon', 'pear', 'watermelon', 'pineapple', 'blueberry', 'eggplant', 'chili', 'carrot', 'mushroom', 'peas', 'broccoli', 'garlic', 'pumpkin', 'cloud', 'bolt', 'jelly', 'ink'],
      defaultCharacterId: 'strawberry',
      tags: ['fruit', 'vegetable', 'nature', 'colorful']
    }
  ];

  let customPacks = [];

  function listSkinPacks() {
    return BUILTIN_PACKS.concat(customPacks);
  }

  function getSkinPack(idOrSeries) {
    return listSkinPacks().find(p => p.id === idOrSeries || p.seriesId === idOrSeries) || null;
  }

  function getSeriesForCharacter(charId) {
    const cleanId = String(charId || '').replace(/^pal-/, '');
    for (const pack of listSkinPacks()) {
      if (pack.characters.includes(cleanId)) return pack.seriesId;
    }
    return 'shapes';
  }

  function validateSkinManifest(manifest) {
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
      return { ok: false, error: tr('清单必须是非空 JSON 对象', 'Manifest must be a non-empty JSON object') };
    }
    if (manifest.schemaVersion !== SCHEMA_VERSION) {
      return { ok: false, error: tr('无效规范版本，必须为 ' + SCHEMA_VERSION, 'Invalid schemaVersion, expected ' + SCHEMA_VERSION) };
    }
    if (typeof manifest.id !== 'string' || !/^[a-z0-9_.-]+$/.test(manifest.id)) {
      return { ok: false, error: tr('无效包 ID (仅限小写字母/数字/连字符)', 'Invalid package id') };
    }
    if (typeof manifest.name !== 'string' || !manifest.name.trim()) {
      return { ok: false, error: tr('缺少名称字段 (name)', 'Missing name field') };
    }
    if (typeof manifest.seriesId !== 'string' || !/^[a-z0-9_.-]+$/i.test(manifest.seriesId)) {
      return { ok: false, error: tr('无效系列标识 (seriesId)', 'Invalid seriesId') };
    }
    if (manifest.badge !== undefined && typeof manifest.badge !== 'string') {
      return { ok: false, error: tr('徽标必须为文本 (badge)', 'Badge must be text') };
    }
    if (!Array.isArray(manifest.characters) || manifest.characters.length === 0) {
      return { ok: false, error: tr('皮肤包必须包含至少一个角色', 'Skin pack must contain at least one character') };
    }
    if (!manifest.characters.every(id => typeof id === 'string' && /^[a-z0-9_.-]+$/i.test(id))) {
      return { ok: false, error: tr('角色标识必须为文本标识符', 'Character ids must be text identifiers') };
    }
    return { ok: true, manifest };
  }

  function registerCustomSkinPack(manifest) {
    const val = validateSkinManifest(manifest);
    if (!val.ok) throw new Error(val.error);
    const existingIndex = customPacks.findIndex(p => p.id === manifest.id);
    if (existingIndex >= 0) {
      customPacks[existingIndex] = manifest;
    } else {
      customPacks.push(manifest);
    }
    return true;
  }

  function getActiveSeries() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('openbot:active-skin-series');
        if (stored && getSkinPack(stored)) return stored;
      }
    } catch (_) {}
    return 'cats';
  }

  function setActiveSeries(seriesId) {
    const pack = getSkinPack(seriesId);
    if (!pack) return false;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('openbot:active-skin-series', pack.seriesId);
      }
    } catch (_) {}
    return true;
  }

  return Object.freeze({
    SCHEMA_VERSION,
    listSkinPacks,
    getSkinPack,
    getSeriesForCharacter,
    validateSkinManifest,
    registerCustomSkinPack,
    getActiveSeries,
    setActiveSeries
  });
});
