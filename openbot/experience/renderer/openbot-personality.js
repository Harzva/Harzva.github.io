/* Bot personality labels: manually annotated MBTI tag + interaction style.
 * Never presented as a psychometric measurement; `source` is always "manual".
 * Shared by the renderer (health center, Bot settings) and the host
 * (persona-layer prompt injection, health rows) through the UMD pattern. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotPersonality = api;
})(typeof window === 'object' ? window : this, function () {
  'use strict';

  var MBTI_TYPES = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
  var STYLES = ['challenger', 'builder', 'neutral', 'supporter'];
  var STYLE_LABEL = {
    challenger: ['反驳型', 'Challenger'],
    builder: ['建设型', 'Builder'],
    neutral: ['中立型', 'Neutral'],
    supporter: ['捧场型', 'Supporter'],
  };
  var STYLE_DIRECTIVE = {
    challenger: ['讨论方案时主动提出至少一条质疑或风险点；不接受"惯例如此"作为理由；先澄清前提再下结论；对观点直率、对人尊重；未被驳倒前保留立场。',
      'Raise at least one objection or risk when discussing a plan; never accept "that is how it is done" as a reason; clarify premises before concluding; be direct on ideas and respectful to people; hold your position until refuted.'],
    builder: ['优先给出可执行方案，再补充主要风险与前置条件；发现缺口时提出补法，而不是只指出问题。',
      'Lead with an actionable plan, then the key risks and preconditions; when you find a gap, propose how to close it instead of only flagging it.'],
    neutral: ['只陈述事实、依据与权衡，不主动站队；被要求表态时，先给出两边最强的理由。',
      'State facts, evidence and trade-offs without taking sides; when asked to pick one, present the strongest case for both first.'],
    supporter: ['先确认合理之处，再给增量建议；不空捧，赞许必须带具体依据。',
      'Acknowledge what works before adding suggestions; praise must cite specifics and never be empty flattery.'],
  };

  function tr(zh, en) {
    return typeof window === 'object' && window.OpenBotI18n && typeof window.OpenBotI18n.t === 'function'
      ? window.OpenBotI18n.t(zh, en) : zh;
  }

  function cleanText(value, max) {
    return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';
  }

  // Fail closed: anything unrecognized degrades to null rather than being
  // stored or shown. An empty annotation normalizes to null.
  function normalizePersonality(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var mbti = typeof raw.mbti === 'string' && MBTI_TYPES.indexOf(raw.mbti.trim().toUpperCase()) >= 0
      ? raw.mbti.trim().toUpperCase() : null;
    var style = typeof raw.interactionStyle === 'string' && STYLES.indexOf(raw.interactionStyle) >= 0
      ? raw.interactionStyle : null;
    var note = cleanText(raw.note, 100);
    var injection = raw.injection === false ? false : true;
    var updatedAt = typeof raw.updatedAt === 'number' && Number.isSafeInteger(raw.updatedAt) && raw.updatedAt > 0
      ? raw.updatedAt : 0;
    if (!mbti && !style && !note) return null;
    return { schema: 1, source: 'manual', mbti: mbti, interactionStyle: style, note: note, injection: injection, updatedAt: updatedAt };
  }

  function styleLabel(style) {
    var label = STYLE_LABEL[style];
    return label ? tr(label[0], label[1]) : '';
  }

  function mbtiType(value) {
    return typeof value === 'string' && MBTI_TYPES.indexOf(value) >= 0 ? value : null;
  }

  function interactionStyle(value) {
    return typeof value === 'string' && STYLES.indexOf(value) >= 0 ? value : '';
  }

  // Persona-layer injection text. Empty when unset, empty after normalization,
  // or when this Bot opts out via injection:false.
  function promptBlock(raw) {
    var p = normalizePersonality(raw);
    if (!p || p.injection === false) return '';
    var lines = [];
    var head = [];
    if (p.mbti) head.push('MBTI ' + p.mbti);
    if (p.interactionStyle) head.push(styleLabel(p.interactionStyle));
    if (head.length) lines.push('[性格 · 人工标注，非测评结果] ' + head.join(' · '));
    else lines.push('[性格 · 人工标注，非测评结果]');
    if (p.note) lines.push('补充：' + p.note);
    if (p.interactionStyle) lines.push(STYLE_DIRECTIVE[p.interactionStyle][0]);
    return lines.join('\n');
  }

  return {
    MBTI_TYPES: MBTI_TYPES,
    STYLES: STYLES,
    STYLE_LABEL: STYLE_LABEL,
    STYLE_DIRECTIVE: STYLE_DIRECTIVE,
    normalizePersonality: normalizePersonality,
    styleLabel: styleLabel,
    mbtiType: mbtiType,
    interactionStyle: interactionStyle,
    promptBlock: promptBlock,
  };
});
