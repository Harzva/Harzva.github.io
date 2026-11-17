/* OpenBot · Cat Mascot & Animal Companion Family.
 * Original vector artwork for OpCat (喵码) & Animal Theme Skins.
 * Standalone SVG + CSS: no external images, fonts, scripts or remote URLs.
 * Conforms to openbot.skin-pack/1 specification.
 * Browser: OpenBotCatProduce.svg('opcat', {state:'thinking', size:128})
 * Node: require('./openbot-cat-characters.js')
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotCatProduce = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const tr = (zh, en, params) => {
    const i18n = typeof window === 'object' && window.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en, params) : zh;
  };

  const cssVar = (name, fallback) => `var(${name},${fallback})`;
  const bodyFill = fallback => cssVar('--ob-avatar-body-fill', fallback);
  const detailFill = fallback => cssVar('--ob-avatar-detail-fill', fallback);
  const faceFill = fallback => cssVar('--ob-avatar-face-fill', fallback);
  const faceInk = fallback => cssVar('--ob-avatar-face-ink', fallback);
  const mouthAccent = fallback => cssVar('--ob-avatar-mouth-accent', fallback);

  const characters = [
    {
      id: 'opcat',
      number: 33,
      name: tr('喵码 (蓝白猫)', 'OpCat (Cyber Blue)'),
      color: '#075BFF',
      group: 'cat',
      badge: '🐱',
      note: tr('Bot Studio 官方首席猫咪，科技发光项圈，一爪拍扁所有Bug', 'Official Bot Studio companion with cyber glowing collar'),
      motion: tr('科技立耳 · 灵动注视 · 揣手手', 'Erect cyber ears · gaze tracking · loaf')
    },
    {
      id: 'cat-ginger',
      number: 34,
      name: tr('大橘 (元气暖橘)', 'Ginger (Warm Tangerine)'),
      color: '#FF8A00',
      group: 'cat',
      badge: '🐾',
      note: tr('大橘为重，代码跑通！阳光般温暖的日常陪伴', 'Ginger warmth to keep your code running smoothly'),
      motion: tr('元气歪头 · 呼噜打哈欠 · 暖萌贴贴', 'Curious tilt · purr and yawn · nuzzle')
    },
    {
      id: 'cat-tuxedo',
      number: 35,
      name: tr('黑客猫 (黑曜礼服)', 'Tuxedo (Obsidian Hacker)'),
      color: '#181924',
      group: 'cat',
      badge: '🕶️',
      note: tr('黑夜敲代码的神秘极客，白手套配赛博荧光绿眼睛', 'Night-shift hacker cat with emerald eyes and white mittens'),
      motion: tr('优雅侧目 · 荧光微闪 · 矫健飞扑', 'Graceful side glance · neon blink · agile pounce')
    },
    {
      id: 'cat-calico',
      number: 36,
      name: tr('三花 (奶盖团子)', 'Calico (Mochi Calico)'),
      color: '#D27939',
      group: 'cat',
      badge: '🍡',
      note: tr('焦糖奶香糯米团子，软软糯糯揉一揉写代码更专注', 'Squishy caramel mochi calico for maximum stress relief'),
      motion: tr('软糯呼吸 · 娇羞眨单眼 · 踩奶呼噜', 'Squishy breathe · playful wink · kneading')
    },
    {
      id: 'dog-shiba',
      number: 37,
      name: tr('柴柴 (呆萌赤柴)', 'Shiba (Golden Inu)'),
      color: '#E5983B',
      group: 'dog',
      badge: '🐕',
      note: tr('治愈笑容与白眉毛，摇晃卷卷尾巴陪你攻克难题', 'Healing smile and wagging tail to conquer every bug'),
      motion: tr('开怀大笑 · 摇晃卷尾 · 欢快蹦跳', 'Beaming grin · tail wag · happy bounce')
    },
    {
      id: 'dog-corgi',
      number: 38,
      name: tr('柯基 (蜜桃短腿)', 'Corgi (Peach Shorty)'),
      color: '#F2A33A',
      group: 'dog',
      badge: '🍑',
      note: tr('大耳朵桃心屁股，虽然腿短但跑任务比谁都勤快', 'Big erect ears and bouncy peach butt, speedy helper'),
      motion: tr('大耳扇动 · 扭动电臀 · 扑地撒娇', 'Ear twitch · butt wiggle · playful crawl')
    }
  ];

  const states = [
    { id: 'idle', label: tr('待机', 'Idle') },
    { id: 'thinking', label: tr('思考', 'Thinking') },
    { id: 'peeking', label: tr('偷看', 'Peeking') },
    { id: 'done', label: tr('完成', 'Done') },
    { id: 'rest', label: tr('休息', 'Rest') },
    { id: 'alert', label: tr('警报', 'Alert') }
  ];

  const css = `
.obc-avatar{display:block;overflow:visible;isolation:isolate}
.obc-avatar .obc-body{transform-origin:64px 108px;animation:obc-breathe 6.5s ease-in-out infinite;animation-delay:var(--obf-phase,0s)}
.obc-avatar .obc-eye-lid{transform-box:fill-box;transform-origin:center;animation:obc-blink 7.5s linear infinite;animation-delay:var(--obf-phase,0s)}
.obc-avatar .obc-gaze{animation:obc-gaze 8.5s ease-in-out infinite;animation-delay:var(--obf-phase,0s);transform:translate(var(--ob-look-x,0px),var(--ob-look-y,0px))}
.obc-avatar .obc-tail{transform-origin:108px 106px;animation:obc-tail-sway 4s ease-in-out infinite;animation-delay:var(--obf-phase,0s)}
.obc-avatar .obc-ear-l{transform-origin:46px 42px;animation:obc-ear-l 9s ease-in-out infinite;animation-delay:var(--obf-phase,0s)}
.obc-avatar .obc-ear-r{transform-origin:82px 42px;animation:obc-ear-r 9s ease-in-out infinite;animation-delay:calc(var(--obf-phase,0s) - 0.4s)}
.obc-avatar .obc-whiskers{transform-origin:64px 84px;animation:obc-whisker-twitch 8s ease-in-out infinite}
.obc-avatar .obc-closed,.obc-avatar .obc-happy,.obc-avatar .obc-sleepy,.obc-avatar .obc-mouth-done,.obc-avatar .obc-mouth-rest,.obc-avatar .obc-mouth-alert,.obc-avatar .obc-spark,.obc-avatar .obc-paws-loaf{display:none}
.obc-avatar .obc-line{fill:none;stroke:${faceInk('#181924')};stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}

/* 思考状态 (Thinking) */
.obc-avatar[data-state="thinking"] .obc-gaze{animation:obc-think-gaze 4.5s ease-in-out infinite;transform:translate(1px,-3px)}
.obc-avatar[data-state="thinking"] .obc-body{transform:rotate(-2deg);animation:obc-think-bob 5s ease-in-out infinite}
.obc-avatar[data-state="thinking"] .obc-tail{animation-duration:2.5s}

/* 偷看状态 (Peeking) */
.obc-avatar[data-state="peeking"] .obc-body{transform:translateX(-3px) rotate(-3deg);animation:obc-peek 6s ease-in-out infinite}
.obc-avatar[data-state="peeking"] .obc-gaze{transform:translate(3px,0)}

/* 任务完成 (Done) */
.obc-avatar[data-state="done"] .obc-body{animation:obc-celebrate .7s cubic-bezier(.34,1.56,.64,1) 1}
.obc-avatar[data-state="done"] .obc-open{display:none}
.obc-avatar[data-state="done"] .obc-happy,.obc-avatar[data-state="done"] .obc-mouth-done,.obc-avatar[data-state="done"] .obc-spark{display:inline}
.obc-avatar[data-state="done"] .obc-spark{animation:obc-spark .7s ease-out 1;transform-origin:112px 24px}

/* 揣手手打瞌睡 (Rest / Cat Loaf) */
.obc-avatar[data-state="rest"] .obc-open,.obc-avatar[data-state="rest"] .obc-happy,.obc-avatar[data-state="rest"] .obc-mouth-idle{display:none}
.obc-avatar[data-state="rest"] .obc-closed,.obc-avatar[data-state="rest"] .obc-mouth-rest,.obc-avatar[data-state="rest"] .obc-paws-loaf{display:inline}
.obc-avatar[data-state="rest"] .obc-body{animation:obc-loaf-rest 7s ease-in-out infinite;transform:scale(1.05,0.92) translateY(3px)}
.obc-avatar[data-state="rest"] .obc-eye-lid,.obc-avatar[data-state="rest"] .obc-gaze,.obc-avatar[data-state="rest"] .obc-tail{animation:none}

/* 警报抓Bug状态 (Alert) */
.obc-avatar[data-state="alert"] .obc-mouth-idle{display:none}
.obc-avatar[data-state="alert"] .obc-mouth-alert{display:inline}
.obc-avatar[data-state="alert"] .obc-ear-l{transform:rotate(-6deg)}
.obc-avatar[data-state="alert"] .obc-ear-r{transform:rotate(6deg)}
.obc-avatar[data-state="alert"] .obc-body{animation:obc-alert-shake .3s ease-in-out infinite}

/* 关键帧动画 */
@keyframes obc-blink{0%,32%,38%,100%{transform:scaleY(1)}35%,36%{transform:scaleY(.06)}}
@keyframes obc-gaze{0%,20%,65%,100%{transform:translate(var(--ob-look-x,1.5px),var(--ob-look-y,-1px))}30%,50%{transform:translate(var(--ob-look-x,-1.8px),var(--ob-look-y,0px))}75%,88%{transform:translate(var(--ob-look-x,1px),var(--ob-look-y,-2px))}}
@keyframes obc-breathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-1px) scale(1.012,.988)}}
@keyframes obc-tail-sway{0%,100%{transform:rotate(0deg)}50%{transform:rotate(14deg)}}
@keyframes obc-ear-l{0%,40%,100%{transform:rotate(0)}44%{transform:rotate(-5deg)}48%{transform:rotate(3deg)}}
@keyframes obc-ear-r{0%,42%,100%{transform:rotate(0)}46%{transform:rotate(5deg)}50%{transform:rotate(-3deg)}}
@keyframes obc-whisker-twitch{0%,85%,100%{transform:scale(1)}90%{transform:scale(1.04,.96)}95%{transform:scale(.98,1.02)}}
@keyframes obc-celebrate{0%,100%{transform:translateY(0) scale(1)}25%{transform:scale(1.05,.94)}55%{transform:translateY(-7px) scale(.96,1.04)}80%{transform:translateY(0) scale(1.03,.97)}}
@keyframes obc-spark{0%{opacity:0;transform:scale(.4)}55%,100%{opacity:1;transform:scale(1)}}
@keyframes obc-loaf-rest{0%,100%{transform:scale(1.05,0.92) translateY(3px)}50%{transform:scale(1.06,0.90) translateY(4px)}}
@keyframes obc-think-gaze{0%,100%{transform:translate(1px,-3px)}40%,75%{transform:translate(2.5px,-2px)}}
@keyframes obc-think-bob{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(1.5deg)}}
@keyframes obc-peek{0%,100%{transform:translateX(-1px) rotate(-1deg)}40%,70%{transform:translateX(-4px) rotate(-3deg)}}
@keyframes obc-alert-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-1px)}75%{transform:translateX(1px)}}
@media(prefers-reduced-motion:reduce){.obc-avatar *{animation:none!important;transition:none!important}}
`;

  function catEyes(lx, rx, y, eyeColor = '#181924') {
    const r = 7.8, h = 10.5;
    return `
<g class="obc-eye-lid">
  <!-- 左眼 -->
  <g class="obc-eye-l" transform="translate(${lx} ${y})">
    <g class="obc-open">
      <ellipse rx="${r}" ry="${h}" fill="${faceFill('#FFFFFF')}"/>
      <g class="obc-gaze">
        <ellipse rx="${r * 0.58}" ry="${h * 0.72}" fill="${eyeColor}"/>
        <circle cx="2.2" cy="-3.0" r="2.4" fill="#FFFFFF"/>
        <circle cx="-1.5" cy="2.2" r="1.2" fill="#FFFFFF"/>
      </g>
    </g>
    <path class="obc-line obc-happy" d="M${-r * 0.7} 1Q0 ${-h * 0.6} ${r * 0.7} 1"/>
    <path class="obc-line obc-closed" d="M${-r * 0.7} 0Q0 ${h * 0.65} ${r * 0.7} 0"/>
  </g>
  <!-- 右眼 -->
  <g class="obc-eye-r" transform="translate(${rx} ${y})">
    <g class="obc-open">
      <ellipse rx="${r}" ry="${h}" fill="${faceFill('#FFFFFF')}"/>
      <g class="obc-gaze">
        <ellipse rx="${r * 0.58}" ry="${h * 0.72}" fill="${eyeColor}"/>
        <circle cx="2.2" cy="-3.0" r="2.4" fill="#FFFFFF"/>
        <circle cx="-1.5" cy="2.2" r="1.2" fill="#FFFFFF"/>
      </g>
    </g>
    <path class="obc-line obc-happy" d="M${-r * 0.7} 1Q0 ${-h * 0.6} ${r * 0.7} 1"/>
    <path class="obc-line obc-closed" d="M${-r * 0.7} 0Q0 ${h * 0.65} ${r * 0.7} 0"/>
  </g>
</g>`;
  }

  function catMouth(cx, cy, noseColor = '#FF7088') {
    return `
<!-- 腮红 -->
<ellipse cx="${cx - 24}" cy="${cy + 2}" rx="5.5" ry="3.2" fill="#FFAEC0" opacity="0.6"/>
<ellipse cx="${cx + 24}" cy="${cy + 2}" rx="5.5" ry="3.2" fill="#FFAEC0" opacity="0.6"/>
<!-- 鼻子 -->
<polygon points="${cx - 2.5},${cy - 3} ${cx + 2.5},${cy - 3} ${cx},${cy}" fill="${noseColor}"/>
<!-- 经典三瓣嘴 (ω) -->
<path class="obc-line obc-mouth-idle" d="M${cx} ${cy} Q${cx - 4.5} ${cy + 5.5} ${cx - 9} ${cy + 2.5} M${cx} ${cy} Q${cx + 4.5} ${cy + 5.5} ${cx + 9} ${cy + 2.5}"/>
<!-- 开心完成笑嘴 -->
<path class="obc-line obc-mouth-done" d="M${cx - 6} ${cy} Q${cx} ${cy + 7} ${cx + 6} ${cy}"/>
<!-- 打瞌睡微抿嘴 -->
<path class="obc-line obc-mouth-rest" d="M${cx - 4} ${cy + 1} H${cx + 4}"/>
<!-- 警报张口 -->
<ellipse class="obc-line obc-mouth-alert" cx="${cx}" cy="${cy + 3}" rx="3.5" ry="4.5" fill="${mouthAccent('#FF727A')}"/>`;
  }

  function catWhiskers(cx, cy, color = '#FFFFFF', opacity = 0.9) {
    return `
<g class="obc-whiskers" stroke="${color}" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="${opacity}">
  <!-- 左胡须 -->
  <path d="M${cx - 20} ${cy - 1} Q${cx - 36} ${cy - 4} ${cx - 48} ${cy + 1}"/>
  <path d="M${cx - 19} ${cy + 5} Q${cx - 35} ${cy + 7} ${cx - 46} ${cy + 13}"/>
  <!-- 右胡须 -->
  <path d="M${cx + 20} ${cy - 1} Q${cx + 36} ${cy - 4} ${cx + 48} ${cy + 1}"/>
  <path d="M${cx + 19} ${cy + 5} Q${cx + 35} ${cy + 7} ${cx + 46} ${cy + 13}"/>
</g>`;
  }

  function drawing(id) {
    switch (id) {
      case 'opcat':
      case 'cat-blue':
        return `
<!-- 尾巴 -->
<path class="obc-tail" d="M96 100 Q116 92 112 72 Q106 60 94 65" fill="none" stroke="${detailFill('#0E65FF')}" stroke-width="9.5" stroke-linecap="round"/>
<!-- 身体主体: 极客蓝 -->
<path class="obc-base" d="M30 114 C22 114 18 96 25 76 C30 58 45 44 64 44 C83 44 98 58 103 76 C110 96 106 114 98 114 C85 119 43 119 30 114 Z" fill="${bodyFill('#075BFF')}"/>
<!-- 左耳 -->
<g class="obc-ear-l">
  <path d="M32 58 L42 22 C44 16 52 14 55 20 L66 45 Z" fill="${bodyFill('#075BFF')}"/>
  <path d="M38 50 L45 26 C46 24 50 23 52 26 L58 44 Z" fill="#FF8CA3"/>
</g>
<!-- 右耳 -->
<g class="obc-ear-r">
  <path d="M96 58 L86 22 C84 16 76 14 73 20 L62 45 Z" fill="${bodyFill('#075BFF')}"/>
  <path d="M90 50 L83 26 C82 24 78 23 76 26 L70 44 Z" fill="#FF8CA3"/>
</g>
<!-- 白奶盖面颊与腹部 -->
<path d="M42 74 C42 62 51 55 64 55 C77 55 86 62 86 74 C86 98 76 110 64 110 C52 110 42 98 42 74 Z" fill="${faceFill('#FFFFFF')}"/>
<!-- 五官 -->
${catEyes(54, 74, 71, '#181924')}
${catMouth(64, 79)}
${catWhiskers(64, 77, '#FFFFFF')}
<!-- 科技项圈与发光金环吊坠 (Bot Studio 核心符号) -->
<path d="M50 96 Q64 104 78 96" fill="none" stroke="#043CB5" stroke-width="5" stroke-linecap="round"/>
<circle cx="64" cy="103" r="7" fill="#FFCA28"/>
<circle cx="64" cy="103" r="3.2" fill="#075BFF"/>
<!-- 揣手手小爪爪 -->
<ellipse cx="54" cy="112" rx="7.5" ry="5.5" fill="#FFFFFF"/>
<ellipse cx="74" cy="112" rx="7.5" ry="5.5" fill="#FFFFFF"/>
<!-- 揣手姿态补强 -->
<g class="obc-paws-loaf">
  <ellipse cx="64" cy="113" rx="14" ry="5" fill="#FFFFFF"/>
</g>`;

      case 'cat-ginger':
        return `
<!-- 尾巴: 暖橘 -->
<path class="obc-tail" d="M96 100 Q116 92 112 72 Q106 60 94 65" fill="none" stroke="#E66E00" stroke-width="9.5" stroke-linecap="round"/>
<!-- 身体主体: 暖橘 -->
<path class="obc-base" d="M30 114 C22 114 18 96 25 76 C30 58 45 44 64 44 C83 44 98 58 103 76 C110 96 106 114 98 114 C85 119 43 119 30 114 Z" fill="${bodyFill('#FF8A00')}"/>
<!-- 虎斑花纹 -->
<path d="M64 45 L64 53 M59 47 L60 52 M69 47 L68 52" stroke="#E66E00" stroke-width="2.5" stroke-linecap="round"/>
<path d="M28 72 L36 75 M29 80 L38 81 M100 72 L92 75 M99 80 L90 81" stroke="#E66E00" stroke-width="2.5" stroke-linecap="round"/>
<!-- 左耳 -->
<g class="obc-ear-l">
  <path d="M32 58 L42 22 C44 16 52 14 55 20 L66 45 Z" fill="${bodyFill('#FF8A00')}"/>
  <path d="M38 50 L45 26 C46 24 50 23 52 26 L58 44 Z" fill="#FFAEC0"/>
</g>
<!-- 右耳 -->
<g class="obc-ear-r">
  <path d="M96 58 L86 22 C84 16 76 14 73 20 L62 45 Z" fill="${bodyFill('#FF8A00')}"/>
  <path d="M90 50 L83 26 C82 24 78 23 76 26 L70 44 Z" fill="#FFAEC0"/>
</g>
<!-- 奶黄面颊 -->
<path d="M44 76 C44 65 52 58 64 58 C76 58 84 65 84 76 C84 98 76 110 64 110 C52 110 44 98 44 76 Z" fill="${faceFill('#FFF4D6')}"/>
<!-- 五官 -->
${catEyes(54, 74, 71, '#3E2405')}
${catMouth(64, 79, '#FF7088')}
${catWhiskers(64, 77, '#D46300', 0.85)}
<!-- 撞色蓝项圈与暖金铃铛 -->
<path d="M50 96 Q64 104 78 96" fill="none" stroke="#075BFF" stroke-width="5" stroke-linecap="round"/>
<circle cx="64" cy="103" r="6" fill="#FFD23F"/>
<!-- 萌爪爪 -->
<ellipse cx="54" cy="112" rx="7.5" ry="5.5" fill="#FFF4D6"/>
<ellipse cx="74" cy="112" rx="7.5" ry="5.5" fill="#FFF4D6"/>`;

      case 'cat-tuxedo':
        return `
<!-- 尾巴: 黑猫白尖 -->
<path class="obc-tail" d="M96 100 Q116 92 112 72 Q106 60 94 65" fill="none" stroke="#181924" stroke-width="9.5" stroke-linecap="round"/>
<circle cx="95" cy="65" r="4.8" fill="#F5F6FA"/>
<!-- 身体主体: 曜石黑 -->
<path class="obc-base" d="M30 114 C22 114 18 96 25 76 C30 58 45 44 64 44 C83 44 98 58 103 76 C110 96 106 114 98 114 C85 119 43 119 30 114 Z" fill="${bodyFill('#181924')}"/>
<!-- 耳朵 -->
<g class="obc-ear-l"><path d="M32 58 L42 22 C44 16 52 14 55 20 L66 45 Z" fill="${bodyFill('#181924')}"/><path d="M38 50 L45 26 C46 24 50 23 52 26 L58 44 Z" fill="#383A4A"/></g>
<g class="obc-ear-r"><path d="M96 58 L86 22 C84 16 76 14 73 20 L62 45 Z" fill="${bodyFill('#181924')}"/><path d="M90 50 L83 26 C82 24 78 23 76 26 L70 44 Z" fill="#383A4A"/></g>
<!-- 白燕尾服胸腹 -->
<polygon points="64,68 50,98 64,110 78,98" fill="#F5F6FA"/>
<ellipse cx="64" cy="80" rx="16" ry="11" fill="#F5F6FA"/>
<!-- 荧光绿赛博猫眼 -->
${catEyes(54, 74, 71, '#00E5A3')}
${catMouth(64, 79, '#FF7088')}
${catWhiskers(64, 77, '#FFFFFF', 0.95)}
<!-- 银白项圈与冰蓝宝石 -->
<path d="M50 96 Q64 104 78 96" fill="none" stroke="#E2E8F0" stroke-width="4.5" stroke-linecap="round"/>
<circle cx="64" cy="103" r="5" fill="#00E5FF"/>
<!-- 白手套萌爪 -->
<ellipse cx="54" cy="112" rx="7.5" ry="5.5" fill="#F5F6FA"/>
<ellipse cx="74" cy="112" rx="7.5" ry="5.5" fill="#F5F6FA"/>`;

      case 'cat-calico':
        return `
<!-- 尾巴: 斑纹尾 -->
<path class="obc-tail" d="M96 100 Q116 92 112 72 Q106 60 94 65" fill="none" stroke="#D27939" stroke-width="9.5" stroke-linecap="round"/>
<!-- 身体主体: 奶白团子 -->
<path class="obc-base" d="M30 114 C22 114 18 96 25 76 C30 58 45 44 64 44 C83 44 98 58 103 76 C110 96 106 114 98 114 C85 119 43 119 30 114 Z" fill="${bodyFill('#FBF9F5')}"/>
<!-- 焦糖与灰碳三花斑块 -->
<path d="M30 65 C26 48 38 32 52 30 L55 46 Z" fill="#D27939"/>
<path d="M84 46 C94 48 104 60 102 78 L88 74 Z" fill="#3D3F47"/>
<path d="M26 88 C24 98 32 108 42 110 L38 94 Z" fill="#D27939"/>
<!-- 耳朵 -->
<g class="obc-ear-l"><path d="M32 58 L42 22 C44 16 52 14 55 20 L66 45 Z" fill="#D27939"/><path d="M38 50 L45 26 C46 24 50 23 52 26 L58 44 Z" fill="#FFAEC0"/></g>
<g class="obc-ear-r"><path d="M96 58 L86 22 C84 16 76 14 73 20 L62 45 Z" fill="#3D3F47"/><path d="M90 50 L83 26 C82 24 78 23 76 26 L70 44 Z" fill="#FFAEC0"/></g>
<!-- 面部五官 -->
${catEyes(54, 74, 71, '#2D2013')}
${catMouth(64, 79, '#FF7088')}
${catWhiskers(64, 77, '#3D3F47', 0.75)}
<!-- 柔红编织项圈 -->
<path d="M50 96 Q64 104 78 96" fill="none" stroke="#F43F5E" stroke-width="4.5" stroke-linecap="round"/>
<circle cx="64" cy="103" r="5" fill="#FBBF24"/>
<!-- 软糯爪爪 -->
<ellipse cx="54" cy="112" rx="7.5" ry="5.5" fill="#FBF9F5"/>
<ellipse cx="74" cy="112" rx="7.5" ry="5.5" fill="#FBF9F5"/>`;

      case 'dog-shiba':
        return `
<!-- 柴柴尾巴 (卷尾) -->
<path class="obc-tail" d="M96 100 Q118 84 108 66 Q98 56 94 70" fill="none" stroke="#C9781B" stroke-width="9.5" stroke-linecap="round"/>
<!-- 身体主体: 柴犬赤金 -->
<path class="obc-base" d="M30 114 C22 114 18 96 25 76 C30 58 45 44 64 44 C83 44 98 58 103 76 C110 96 106 114 98 114 C85 119 43 119 30 114 Z" fill="${bodyFill('#E5983B')}"/>
<!-- 柴犬三角形三角立耳 -->
<g class="obc-ear-l"><path d="M34 56 L44 26 C46 22 52 20 56 25 L65 48 Z" fill="#C9781B"/><path d="M40 48 L46 30 C47 28 50 27 52 30 L57 44 Z" fill="#FFF1DC"/></g>
<g class="obc-ear-r"><path d="M94 56 L84 26 C82 22 76 20 72 25 L63 48 Z" fill="#C9781B"/><path d="M88 48 L82 30 C81 28 78 27 76 30 L71 44 Z" fill="#FFF1DC"/></g>
<!-- 柴犬标志性白眉毛小圆点 -->
<circle cx="52" cy="58" r="3.2" fill="#FFFFFF"/>
<circle cx="76" cy="58" r="3.2" fill="#FFFFFF"/>
<!-- 白面颊 -->
<path d="M42 76 C42 66 52 60 64 60 C76 60 86 66 86 76 C86 98 76 110 64 110 C52 110 42 98 42 76 Z" fill="${faceFill('#FFFFFF')}"/>
<!-- 眼睛 -->
${catEyes(54, 74, 71, '#2D1B07')}
<!-- 柴犬湿漉漉黑鼻子与吐舌笑嘴 -->
<ellipse cx="64" cy="78" rx="4.5" ry="3.2" fill="#181924"/>
<path class="obc-line obc-mouth-idle" d="M60 81 Q64 85 68 81"/>
<path class="obc-line obc-mouth-done" d="M58 80 Q64 88 70 80"/>
<!-- 吐出粉粉小舌头 -->
<path d="M62 82 C62 86 66 86 66 82 Z" fill="#FF8496"/>
<!-- 绿领巾唐草纹项圈 -->
<path d="M50 96 Q64 104 78 96" fill="none" stroke="#10B981" stroke-width="5" stroke-linecap="round"/>
<circle cx="64" cy="103" r="5" fill="#FFCA28"/>
<!-- 萌爪爪 -->
<ellipse cx="54" cy="112" rx="7.5" ry="5.5" fill="#FFFFFF"/>
<ellipse cx="74" cy="112" rx="7.5" ry="5.5" fill="#FFFFFF"/>`;

      case 'dog-corgi':
        return `
<!-- 柯基心形桃子屁股短尾 -->
<circle cx="100" cy="98" r="5" fill="#FFFFFF"/>
<!-- 身体主体: 柯基黄白 -->
<path class="obc-base" d="M30 114 C22 114 18 96 25 76 C30 58 45 44 64 44 C83 44 98 58 103 76 C110 96 106 114 98 114 C85 119 43 119 30 114 Z" fill="${bodyFill('#F2A33A')}"/>
<!-- 柯基标志性大圆弧立耳 -->
<g class="obc-ear-l"><path d="M30 60 L36 18 C38 10 50 10 55 18 L64 46 Z" fill="#DB8718"/><path d="M36 50 L42 22 C43 18 48 18 50 22 L56 42 Z" fill="#FFAEC0"/></g>
<g class="obc-ear-r"><path d="M98 60 L92 18 C90 10 78 10 73 18 L64 46 Z" fill="#DB8718"/><path d="M92 50 L86 22 C85 18 80 18 78 22 L72 42 Z" fill="#FFAEC0"/></g>
<!-- 柯基脑门正中白鼻线 (Blaze) -->
<polygon points="64,44 61,64 67,64" fill="#FFFFFF"/>
<path d="M42 74 C42 62 51 55 64 55 C77 55 86 62 86 74 C86 98 76 110 64 110 C52 110 42 98 42 74 Z" fill="${faceFill('#FFFFFF')}"/>
<!-- 眼睛 -->
${catEyes(54, 74, 71, '#2D1B07')}
<!-- 鼻子与咧嘴笑 -->
<ellipse cx="64" cy="78" rx="4.5" ry="3.2" fill="#181924"/>
<path class="obc-line obc-mouth-idle" d="M58 81 Q64 87 70 81"/>
<path class="obc-line obc-mouth-done" d="M56 79 Q64 89 72 79"/>
<!-- 红色经典项圈 -->
<path d="M50 96 Q64 104 78 96" fill="none" stroke="#EF4444" stroke-width="5" stroke-linecap="round"/>
<circle cx="64" cy="103" r="5" fill="#FBBF24"/>
<!-- 柯基标志性小短腿 -->
<ellipse cx="54" cy="114" rx="7.5" ry="4.5" fill="#FFFFFF"/>
<ellipse cx="74" cy="114" rx="7.5" ry="4.5" fill="#FFFFFF"/>`;

      default:
        throw new Error('Unknown cat/dog character: ' + id);
    }
  }

  function escapeAttr(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  }

  function svg(id = 'opcat', options = {}) {
    const index = characters.findIndex(c => c.id === id);
    const character = characters[index < 0 ? 0 : index];
    const state = states.some(s => s.id === options.state) ? options.state : 'idle';
    const motion = ['off', 'paused'].includes(options.motion) ? options.motion : 'auto';
    const size = Number.isFinite(options.size) ? Math.min(2048, Math.max(12, Math.round(options.size))) : 128;
    const phase = Number.isFinite(options.phase) ? Math.min(0, Math.max(-60, options.phase)) : -(Math.max(0, index) * .57);
    const label = options.label || `${character.name} · ${states.find(s => s.id === state).label}`;

    return `<svg xmlns="http://www.w3.org/2000/svg" class="obc-avatar" data-character="${character.id}" data-state="${state}" data-motion="${motion}" width="${size}" height="${size}" viewBox="0 0 128 128" role="img" aria-label="${escapeAttr(label)}" style="--obf-phase:${phase}s">
<title>${escapeAttr(label)}</title>${options.withStyle === false ? '' : `<style>${css}</style>`}<g class="obc-body">${drawing(character.id)}</g><path class="obc-spark" d="M110 16L113 10M117 24L123 22" stroke="#FFCB3F" stroke-width="3.5" stroke-linecap="round" fill="none"/></svg>`;
  }

  function setState(element, state) {
    if (!element || !element.matches('svg.obc-avatar')) return false;
    const validState = states.find(s => s.id === state);
    const character = characters.find(c => c.id === element.dataset.character);
    if (!validState || !character) return false;
    const label = `${character.name} · ${validState.label}`;
    const title = element.querySelector('title');
    if (element.dataset.state !== state) element.dataset.state = state;
    if (element.getAttribute('aria-label') !== label) element.setAttribute('aria-label', label);
    if (title && title.textContent !== label) title.textContent = label;
    return true;
  }

  return Object.freeze({
    characters: Object.freeze(characters.map(Object.freeze)),
    states: Object.freeze(states.map(Object.freeze)),
    css,
    svg,
    setState
  });
});
