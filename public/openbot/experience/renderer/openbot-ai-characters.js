/* OpenBot · AI Mascot & Model Companion Family.
 * Character artwork for Clawd (Anthropic Claude), Sparky (ChatGPT), DeepWhale (DeepSeek),
 * StarGrok (Grok), AntiStar (Antigravity), KimiStar (Kimi), and QwenGem (Qwen).
 * Standalone SVG + CSS: no external network requests or remote assets.
 * Conforms to openbot.skin-pack/1 specification.
 * Browser: OpenBotAIProduce.svg('clawd', {state:'thinking', size:128})
 * Node: require('./openbot-ai-characters.js')
 */
(function (root, factory) {
  let spritesData = null;
  if (typeof module === 'object' && module.exports) {
    try { spritesData = require('./openbot-clawd-sprites-data.js'); } catch (_) {}
  } else {
    spritesData = root.OpenBotClawdSpritesData || (typeof OpenBotClawdSpritesData !== 'undefined' ? OpenBotClawdSpritesData : null);
  }
  const api = factory(spritesData);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotAIProduce = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (initialSpritesData) {
  'use strict';

  const tr = (zh, en, params) => {
    const i18n = typeof window === 'object' && window.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en, params) : zh;
  };

  const cssVar = (name, fallback) => `var(${name},${fallback})`;

  function getSpritesData() {
    if (initialSpritesData) return initialSpritesData;
    if (typeof globalThis !== 'undefined' && globalThis.OpenBotClawdSpritesData) return globalThis.OpenBotClawdSpritesData;
    if (typeof window !== 'undefined' && window.OpenBotClawdSpritesData) return window.OpenBotClawdSpritesData;
    return null;
  }

  // --- Clawd Sprite Decoding & SVG Vectorization ---
  function value36(text) { return /^[0-9a-z]+$/i.test(text) ? parseInt(text, 36) : NaN; }
  function paletteIndex(value) { return value === '.' ? 255 : value36(value); }

  const decodedClips = new Map();

  function decodeClip(rawClip) {
    if (!rawClip || !rawClip.base) return null;
    let frame = Uint8Array.from(rawClip.base, v => paletteIndex(v));
    const frames = [new Uint8Array(frame)];
    if (Array.isArray(rawClip.deltas)) {
      for (const delta of rawClip.deltas) {
        frame = new Uint8Array(frame);
        for (const change of delta.split(',')) {
          if (change.length >= 2) {
            frame[value36(change.slice(0, -1))] = paletteIndex(change.slice(-1));
          }
        }
        frames.push(frame);
      }
    }
    return {
      w: rawClip.w,
      h: rawClip.h,
      palette: rawClip.palette || ['#141413', '#be684d', '#d97757'],
      frames: frames,
      anchor: rawClip.a0 || [0, 0, rawClip.w, rawClip.h]
    };
  }

  function getClip(clipName) {
    if (decodedClips.has(clipName)) return decodedClips.get(clipName);
    const data = getSpritesData();
    if (!data || !data.sprites || !data.sprites[clipName]) return null;
    const decoded = decodeClip(data.sprites[clipName]);
    if (decoded) decodedClips.set(clipName, decoded);
    return decoded;
  }

  function frameToPaths(clip, frameIndex) {
    const safeIdx = Math.max(0, Math.min(frameIndex, clip.frames.length - 1));
    const frame = clip.frames[safeIdx];
    const pathsByColor = {};
    for (let y = 0; y < clip.h; y++) {
      let curCol = -1, startX = 0, span = 0;
      for (let x = 0; x <= clip.w; x++) {
        const col = x < clip.w ? frame[y * clip.w + x] : 255;
        if (col === curCol && col !== 255) {
          span++;
        } else {
          if (curCol !== 255 && curCol !== -1 && span > 0) {
            if (!pathsByColor[curCol]) pathsByColor[curCol] = '';
            pathsByColor[curCol] += `M${startX} ${y}h${span}v1h-${span}z`;
          }
          curCol = col;
          startX = x;
          span = 1;
        }
      }
    }
    return { w: clip.w, h: clip.h, palette: clip.palette, pathsByColor };
  }

  function generateClawdSvg(clipName, frameIndex, size, stateClass) {
    const clip = getClip(clipName) || getClip('Swaying');
    if (!clip) {
      // Fallback vector Clawd if data is still loading
      return `<svg class="obf-avatar ob-ai-avatar ob-ai-clawd ${stateClass||''}" viewBox="0 0 28 17" width="${size||128}" height="${size||128}" shape-rendering="crispEdges">
        <path fill="#141413" d="M8 3h2v1h-2zM18 3h2v1h-2zM8 4h2v1h-2zM18 4h2v1h-2z"/>
        <path fill="#d97757" d="M6 1h16v1h-16zM6 2h16v1h-16zM6 3h2v1h-2zM10 3h8v1h-8zM20 3h2v1h-2zM6 4h2v1h-2zM10 4h8v1h-8zM20 4h2v1h-2zM2 5h24v1h-24zM2 6h24v1h-24zM2 7h24v1h-24zM2 8h24v1h-24zM6 9h16v1h-16zM6 10h16v1h-16zM6 11h16v1h-16zM6 12h16v1h-16zM6 13h2v1h-2zM10 13h2v1h-2zM16 13h2v1h-2zM20 13h2v1h-2zM6 14h2v1h-2zM10 14h2v1h-2zM16 14h2v1h-2zM20 14h2v1h-2zM6 15h2v1h-2zM10 15h2v1h-2zM16 15h2v1h-2zM20 15h2v1h-2zM6 16h2v1h-2zM10 16h2v1h-2zM16 16h2v1h-2zM20 16h2v1h-2z"/>
      </svg>`;
    }
    const { w, h, palette, pathsByColor } = frameToPaths(clip, frameIndex);
    let paths = '';
    for (const [colIdx, d] of Object.entries(pathsByColor)) {
      paths += `<path fill="${palette[colIdx]}" d="${d}"/>`;
    }
    return `<svg class="obf-avatar ob-ai-avatar ob-ai-clawd ${stateClass||''}" viewBox="0 0 ${w} ${h}" width="${size||128}" height="${size||128}" shape-rendering="crispEdges">${paths}</svg>`;
  }

  // State mappings for Clawd
  const clawdStateClips = {
    idle: { clip: 'Swaying', frame: 0 },
    thinking: { clip: 'Thinking', frame: 12 },
    working: { clip: 'Laptop', frame: 18 },
    done: { clip: 'DancingHappy', frame: 8 },
    error: { clip: 'Dizzy', frame: 8 },
    alert: { clip: 'Facepalm', frame: 12 },
    pet: { clip: 'JumpingHappy', frame: 6 },
    wave: { clip: 'Waving', frame: 7 },
    rest: { clip: 'Meditating', frame: 20 },
    cheer: { clip: 'Excited', frame: 8 }
  };

  const characters = [
    {
      id: 'clawd',
      number: 39,
      name: tr('Clawd (克劳德)', 'Clawd (Anthropic Pixel Mascot)'),
      color: '#D97757',
      group: 'ai',
      badge: '🦀',
      note: tr('Claude 官方经典像素桌宠，呆萌软糯，拥有打字、思考、跳舞等 18 套原版动画 (Anthropic PBC 原创)',
        'Anthropic official Claude desktop pixel companion with 18 original animation clips'),
      motion: tr('打字 · 沉思 · 胜利跳舞 · 软萌摇摆', 'Laptop typing · thinking · victory dance · swaying'),
      attribution: 'Anthropic PBC / Clawd Quest (via jazzenchen/agent-hud-open)'
    },
    {
      id: 'openai-spark',
      number: 40,
      name: tr('Sparky (ChatGPT)', 'Sparky (ChatGPT / OpenAI)'),
      color: '#10A37F',
      group: 'ai',
      badge: '🟢',
      note: tr('翠绿智慧光环，灵动旋转与注视，陪伴思维火花迸发 (致敬 OpenAI Codex/ChatGPT)',
        'Emerald wisdom halo companion with rotating spiral and expressive gaze'),
      motion: tr('光环旋转 · 灵动注视 · 思考脉冲', 'Spiral rotate · expressive gaze · thinking pulse'),
      attribution: 'OpenAI / Codex (via jazzenchen/agent-hud-open)'
    },
    {
      id: 'deepseek-whale',
      number: 41,
      name: tr('DeepWhale (DeepSeek)', 'DeepWhale (DeepSeek Whale)'),
      color: '#3F5AE6',
      group: 'ai',
      badge: '🐋',
      note: tr('湛蓝深海小鲸鱼，扑腾双鳍与软萌白肚皮，探索深邃逻辑 (致敬 DeepSeek)',
        'Ocean blue baby whale companion with fluttering fins and soft belly'),
      motion: tr('摇动小鱼鳍 · 欢快吐泡泡 · 跃水欢呼', 'Fluttering fins · blowing bubbles · joyful breach'),
      attribution: 'DeepSeek / DeepSeek AI (via jazzenchen/agent-hud-open)'
    },
    {
      id: 'grok-saturn',
      number: 42,
      name: tr('StarGrok (Grok)', 'StarGrok (Grok / xAI)'),
      color: '#1F2328',
      group: 'ai',
      badge: '🪐',
      note: tr('带土星光环的极客小机器人，幽默机智，环绕公转与倾角微动 (致敬 xAI Grok)',
        'Tech robot companion with a tilted orbiting Saturn ring and witty visor eyes'),
      motion: tr('星环倾转 · 陀螺自旋 · 眨单眼', 'Ring wobble · gyroscope spin · playful wink'),
      attribution: 'xAI / Grok (via jazzenchen/agent-hud-open)'
    },
    {
      id: 'antigravity-spark',
      number: 43,
      name: tr('AntiStar (Antigravity)', 'AntiStar (Google Antigravity)'),
      color: '#4285F4',
      group: 'ai',
      badge: '✨',
      note: tr('璀璨四芒星火花体，零重力悬浮跃动，折射灵感光芒 (致敬 Google DeepMind)',
        'Zero-gravity 4-point diamond star companion with satellite orbital sparks'),
      motion: tr('零重力悬浮 · 星芒伸缩 · 辉光闪耀', 'Zero-g float · star breathing · nova glow'),
      attribution: 'Google DeepMind / Antigravity'
    },
    {
      id: 'kimi-star',
      number: 44,
      name: tr('KimiStar (Kimi)', 'KimiStar (Moonshot Kimi)'),
      color: '#7E57C2',
      group: 'ai',
      badge: '⭐',
      note: tr('极客紫星折纸伴侣，长文本思维敏捷穿梭 (致敬 Moonshot AI Kimi)',
        'Origami purple star companion with agile pulse and long-context vision'),
      motion: tr('星角舒展 · 快速穿梭 · 欢快脉动', 'Star expand · warp dash · happy pulse'),
      attribution: 'Moonshot AI / Kimi (via jazzenchen/agent-hud-open)'
    },
    {
      id: 'qwen-gem',
      number: 45,
      name: tr('QwenGem (Qwen)', 'QwenGem (Alibaba Qwen)'),
      color: '#6F42C1',
      group: 'ai',
      badge: '💎',
      note: tr('通义多面水晶灵石，折射全能智慧，晶莹剔透 (致敬 Alibaba Qwen)',
        'Multi-faceted polyhedron crystal companion with luminous core'),
      motion: tr('水晶微转 · 棱镜折光 · 核心共鸣', 'Crystal orbit · prism glare · core glow'),
      attribution: 'Alibaba Cloud / Qwen (via jazzenchen/agent-hud-open)'
    }
  ];

  let nextUid = 0;
  function svg(id, options) {
    const opts = options || {};
    const state = opts.state || 'idle';
    const size = opts.size || 128;
    const ink = '#24242A';
    const uid = `obai-${++nextUid}`;

    if (id === 'clawd') {
      const mapping = clawdStateClips[state] || clawdStateClips.idle;
      const frameIdx = typeof opts.frame === 'number' ? opts.frame : mapping.frame;
      const clipName = opts.clip || mapping.clip;
      return generateClawdSvg(clipName, frameIdx, size, `ob-ai-state-${state}`);
    }

    if (id === 'openai-spark') {
      // 6-bladed Archimedean spiral ring + cute expressive eyes
      const isSpinning = state === 'working' || state === 'thinking';
      const eyeL = state === 'done' ? 'M54 62 Q59 56 64 62' : (state === 'pet' ? 'M54 60 Q59 54 64 60' : 'M59 64 a3 3 0 1 0 0.01 0');
      const eyeR = state === 'done' ? 'M64 62 Q69 56 74 62' : (state === 'pet' ? 'M64 60 Q69 54 74 60' : 'M69 64 a3 3 0 1 0 0.01 0');
      return `<svg class="obf-avatar ob-ai-avatar ob-ai-openai ob-ai-state-${state}" viewBox="0 0 128 128" width="${size}" height="${size}" shape-rendering="geometricPrecision">
        <defs>
          <linearGradient id="${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10A37F"/>
            <stop offset="100%" stop-color="#0B6B54"/>
          </linearGradient>
        </defs>
        <g class="ob-ai-group ${isSpinning?'ob-ai-spark-spin':''}" transform-origin="64 64">
          <!-- 6-petal spiral nodes -->
          <circle cx="64" cy="64" r="44" fill="none" stroke="#10A37F" stroke-width="8" stroke-dasharray="14 9" stroke-linecap="round" opacity="0.95"/>
          <g fill="none" stroke="url(#${uid})" stroke-width="7" stroke-linecap="round">
            <path d="M64 24 C78 24 88 34 88 48 C88 56 82 62 76 66"/>
            <path d="M64 24 C78 24 88 34 88 48 C88 56 82 62 76 66" transform="rotate(60 64 64)"/>
            <path d="M64 24 C78 24 88 34 88 48 C88 56 82 62 76 66" transform="rotate(120 64 64)"/>
            <path d="M64 24 C78 24 88 34 88 48 C88 56 82 62 76 66" transform="rotate(180 64 64)"/>
            <path d="M64 24 C78 24 88 34 88 48 C88 56 82 62 76 66" transform="rotate(240 64 64)"/>
            <path d="M64 24 C78 24 88 34 88 48 C88 56 82 62 76 66" transform="rotate(300 64 64)"/>
          </g>
          <!-- Center glow hub -->
          <circle cx="64" cy="64" r="22" fill="#E6F7F2" stroke="#10A37F" stroke-width="3"/>
          <circle cx="64" cy="64" r="16" fill="#10A37F" opacity="0.15"/>
        </g>
        <!-- Expressive face -->
        <g class="ob-ai-face ob-face" fill="${ink}" stroke="${ink}" stroke-width="${state==='done'||state==='pet'?3:0}">
          <path d="${eyeL}"/>
          <path d="${eyeR}"/>
          <path d="M62 71 Q64 73 66 71" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>
        </g>
      </svg>`;
    }

    if (id === 'deepseek-whale') {
      // DeepSeek Whale with fluttery fins, soft white belly & blowhole bubble
      const isExcited = state === 'done' || state === 'pet';
      return `<svg class="obf-avatar ob-ai-avatar ob-ai-deepseek ob-ai-state-${state}" viewBox="0 0 128 128" width="${size}" height="${size}" shape-rendering="geometricPrecision">
        <defs>
          <linearGradient id="${uid}" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stop-color="#4C68FF"/>
            <stop offset="100%" stop-color="#2844D4"/>
          </linearGradient>
        </defs>
        <!-- Whale tail fin -->
        <path class="ob-ai-whale-tail" d="M22 66 C14 56 12 48 10 44 C16 48 26 54 28 62 C30 54 40 48 46 44 C44 48 42 56 34 66 Z" fill="#2844D4"/>
        <!-- Whale main body -->
        <path class="ob-ai-whale-body" d="M26 64 C26 44 46 36 72 36 C102 36 114 54 114 68 C114 84 98 94 72 94 C46 94 26 84 26 64 Z" fill="url(#${uid})"/>
        <!-- Soft belly -->
        <path d="M42 76 C52 86 86 88 106 72 C108 78 100 86 80 90 C56 94 44 88 42 76 Z" fill="#DCE5FF"/>
        <!-- Pectoral flipper / fin -->
        <path class="ob-ai-whale-fin" d="M58 72 C50 78 44 88 48 92 C54 94 66 84 70 76 Z" fill="#2844D4"/>
        <!-- Blowhole bubble if thinking / working -->
        ${state === 'thinking' || state === 'working' ? '<circle cx="68" cy="24" r="5" fill="#4C68FF" opacity="0.75"/><circle cx="74" cy="14" r="3" fill="#6E84FF" opacity="0.6"/>' : ''}
        <!-- Eyes & smile -->
        <g class="ob-ai-face ob-face">
          ${isExcited ? '<path d="M92 56 Q97 50 102 56" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>' :
            '<circle cx="97" cy="56" r="4.5" fill="#FFFFFF"/><circle cx="98" cy="56" r="2.5" fill="#0D1636"/><circle cx="99.5" cy="54.5" r="1.2" fill="#FFFFFF"/>'}
          <path d="M92 68 Q98 73 104 68" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
        </g>
      </svg>`;
    }

    if (id === 'grok-saturn') {
      // Tech robot + tilted Saturn ring
      return `<svg class="obf-avatar ob-ai-avatar ob-ai-grok ob-ai-state-${state}" viewBox="0 0 128 128" width="${size}" height="${size}" shape-rendering="geometricPrecision">
        <defs>
          <linearGradient id="${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E2E4E9"/>
            <stop offset="100%" stop-color="#8C919B"/>
          </linearGradient>
        </defs>
        <!-- Antenna -->
        <line x1="64" y1="36" x2="64" y2="24" stroke="#8C919B" stroke-width="3" stroke-linecap="round"/>
        <circle cx="64" cy="22" r="4" fill="#FF5252"/>
        <!-- Back of Saturn Ring -->
        <ellipse class="ob-ai-saturn-back" cx="64" cy="68" rx="54" ry="14" fill="none" stroke="url(#${uid})" stroke-width="8" transform="rotate(-15 64 68)" stroke-dasharray="140 200"/>
        <!-- Robot Body -->
        <rect x="36" y="36" width="56" height="56" rx="20" fill="#1C1F26" stroke="#2E3440" stroke-width="2"/>
        <!-- Visor Screen -->
        <rect x="42" y="46" width="44" height="24" rx="8" fill="#0B0D11"/>
        <!-- Glowing Eyes in Visor -->
        <g class="ob-ai-face ob-face">
          ${state === 'done' || state === 'pet' ?
            '<path d="M48 58 Q53 52 58 58" fill="none" stroke="#00E5FF" stroke-width="3" stroke-linecap="round"/><path d="M70 58 Q75 52 80 58" fill="none" stroke="#00E5FF" stroke-width="3" stroke-linecap="round"/>' :
            '<rect class="obx-pupil" x="48" y="52" width="10" height="12" rx="3" fill="#00E5FF"/><rect class="obx-pupil" x="70" y="52" width="10" height="12" rx="3" fill="#00E5FF"/>'}
        </g>
        <!-- Front of Saturn Ring -->
        <ellipse class="ob-ai-saturn-front" cx="64" cy="68" rx="54" ry="14" fill="none" stroke="url(#${uid})" stroke-width="8" transform="rotate(-15 64 68)" stroke-dasharray="0 140 180 0"/>
      </svg>`;
    }

    if (id === 'antigravity-spark') {
      // 4-point diamond star + zero-g orbital crystals
      return `<svg class="obf-avatar ob-ai-avatar ob-ai-antigravity ob-ai-state-${state}" viewBox="0 0 128 128" width="${size}" height="${size}" shape-rendering="geometricPrecision">
        <defs>
          <linearGradient id="${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4285F4"/>
            <stop offset="50%" stop-color="#8AB4F8"/>
            <stop offset="100%" stop-color="#34A853"/>
          </linearGradient>
        </defs>
        <!-- Orbiting Zero-G Shards -->
        <circle class="ob-ai-ag-orb ob-ai-ag-orb1" cx="24" cy="40" r="4.5" fill="#FBBC05"/>
        <circle class="ob-ai-ag-orb ob-ai-ag-orb2" cx="104" cy="46" r="3.5" fill="#EA4335"/>
        <circle class="ob-ai-ag-orb ob-ai-ag-orb3" cx="96" cy="98" r="4" fill="#34A853"/>
        <!-- 4-Point Diamond Star Body -->
        <path class="ob-ai-ag-star" d="M64 16 Q64 64 112 64 Q64 64 64 112 Q64 64 16 64 Q64 64 64 16 Z" fill="url(#${uid})"/>
        <!-- Inner Core Diamond -->
        <polygon points="64,36 84,64 64,92 44,64" fill="#FFFFFF" opacity="0.35"/>
        <!-- Cute Face -->
        <g class="ob-ai-face ob-face" fill="${ink}">
          ${state === 'done' || state === 'pet' ?
            '<path d="M54 62 Q59 56 64 62" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/><path d="M64 62 Q69 56 74 62" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>' :
            '<circle cx="58" cy="62" r="3.5" fill="#FFFFFF"/><circle cx="70" cy="62" r="3.5" fill="#FFFFFF"/><circle cx="59" cy="61" r="1.5" fill="#1A73E8"/><circle cx="71" cy="61" r="1.5" fill="#1A73E8"/>'}
          <path d="M61 70 Q64 73 67 70" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
        </g>
      </svg>`;
    }

    if (id === 'kimi-star') {
      // 8-point origami purple star
      return `<svg class="obf-avatar ob-ai-avatar ob-ai-kimi ob-ai-state-${state}" viewBox="0 0 128 128" width="${size}" height="${size}" shape-rendering="geometricPrecision">
        <defs>
          <linearGradient id="${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#9C27B0"/>
            <stop offset="100%" stop-color="#673AB7"/>
          </linearGradient>
        </defs>
        <!-- 8-Point Star -->
        <polygon class="ob-ai-kimi-body" points="64,18 76,46 104,36 94,64 114,84 86,88 76,116 64,94 44,110 48,84 20,78 38,56 24,32 52,38" fill="url(#${uid})"/>
        <!-- Center Glow Badge -->
        <circle cx="64" cy="64" r="20" fill="#E1BEE7" opacity="0.9"/>
        <!-- Cute Face -->
        <g class="ob-ai-face ob-face" fill="${ink}">
          ${state === 'done' || state === 'pet' ?
            '<path d="M54 62 Q59 56 64 62" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/><path d="M64 62 Q69 56 74 62" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>' :
            '<circle cx="58" cy="62" r="3" fill="${ink}"/><circle cx="70" cy="62" r="3" fill="${ink}"/>'}
          <path d="M61 69 Q64 72 67 69" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>
        </g>
      </svg>`;
    }

    if (id === 'qwen-gem') {
      // Faceted hexagon crystal
      return `<svg class="obf-avatar ob-ai-avatar ob-ai-qwen ob-ai-state-${state}" viewBox="0 0 128 128" width="${size}" height="${size}" shape-rendering="geometricPrecision">
        <defs>
          <linearGradient id="${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8A63D2"/>
            <stop offset="100%" stop-color="#58359E"/>
          </linearGradient>
        </defs>
        <!-- Faceted Hexagon Base -->
        <polygon points="64,20 102,42 102,86 64,108 26,86 26,42" fill="url(#${uid})"/>
        <!-- Facet lines -->
        <polygon points="64,20 102,42 64,56 26,42" fill="#9D7CE0" opacity="0.5"/>
        <polygon points="26,42 64,56 64,108 26,86" fill="#4B2C87" opacity="0.4"/>
        <polygon points="102,42 102,86 64,108 64,56" fill="#754DC5" opacity="0.4"/>
        <!-- Crystal core -->
        <circle cx="64" cy="68" r="16" fill="#FFFFFF" opacity="0.25"/>
        <!-- Face -->
        <g class="ob-ai-face ob-face">
          ${state === 'done' || state === 'pet' ?
            '<path d="M54 66 Q59 60 64 66" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/><path d="M64 66 Q69 60 74 66" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>' :
            '<circle cx="58" cy="66" r="3.2" fill="#FFFFFF"/><circle cx="70" cy="66" r="3.2" fill="#FFFFFF"/>'}
          <path d="M61 74 Q64 77 67 74" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
        </g>
      </svg>`;
    }

    return `<svg class="obf-avatar ob-ai-avatar" viewBox="0 0 128 128" width="${size}" height="${size}"><circle cx="64" cy="64" r="48" fill="#4285F4"/></svg>`;
  }

  const css = `
    @keyframes obAiSparkSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes obAiWhaleSwim {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-4px) rotate(-2deg); }
    }
    @keyframes obAiWhaleFin {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(12deg); }
    }
    @keyframes obAiSaturnWobble {
      0%, 100% { transform: rotate(-15deg); }
      50% { transform: rotate(-10deg); }
    }
    @keyframes obAiAgFloat {
      0%, 100% { transform: translateY(0px) scale(1); }
      50% { transform: translateY(-5px) scale(1.02); }
    }
    @keyframes obAiClawdBounce {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-3px); }
    }

    .ob-ai-avatar { display: inline-block; vertical-align: middle; overflow: visible; }
    .ob-ai-avatar.ob-ai-clawd { image-rendering: pixelated; shape-rendering: crispEdges; }
    .ob-ai-clawd.ob-ai-state-idle { animation: obAiClawdBounce 2.4s ease-in-out infinite; }
    .ob-ai-spark-spin { animation: obAiSparkSpin 12s linear infinite; transform-origin: 64px 64px; }
    .ob-ai-state-working .ob-ai-spark-spin { animation-duration: 2s; }
    .ob-ai-deepseek { animation: obAiWhaleSwim 3s ease-in-out infinite; }
    .ob-ai-whale-fin { transform-origin: 60px 72px; animation: obAiWhaleFin 1.8s ease-in-out infinite; }
    .ob-ai-saturn-front, .ob-ai-saturn-back { transform-origin: 64px 68px; animation: obAiSaturnWobble 4s ease-in-out infinite; }
    .ob-ai-antigravity { animation: obAiAgFloat 3.5s ease-in-out infinite; }
  `;

  return Object.freeze({
    characters: Object.freeze(characters),
    states: Object.freeze(['idle', 'thinking', 'working', 'done', 'error', 'alert', 'pet', 'wave', 'rest']),
    svg: svg,
    css: css,
    getClawdClip: getClip,
    generateClawdSvg: generateClawdSvg,
    clawdStateClips: clawdStateClips
  });
});
