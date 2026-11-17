/**
 * 四层上下文组装（纯函数，主进程与渲染层共用）
 *
 * 设计目标：不把整段对话无限加长，每次请求按需组装四层：
 *   1. 人设卡 / 技能卡     —— 人格一致性，必带
 *   2. 记忆层             —— profile（长期画像）+ journal（事件日志）
 *   3. 滚动摘要           —— 更早对话折叠成摘要，随对话更新
 *   4. 按需再读           —— 被折叠的原文细节、被引用的文件内容
 *
 * 用法（Node）：const ctx = require('./context'); ctx.assemble(bot)
 * 用法（浏览器）：<script src="../src/context.js"> → window.GrokContext
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./bot-directory-context'), require('./personal-memory'), require('../renderer/openbot-personality'));
  else root.GrokContext = factory(root.OpenBotDirectoryContext, root.PersonalMemory, root.OpenBotPersonality);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (directoryContext, personalMemory, OpenBotPersonality) {
  'use strict';

  // Default user-facing prose, shared by chats, dispatch and meetings. Stored
  // messages and structured tool/model outputs are never shortened or rewritten.
  var RESPONSE_STYLE = '面向用户的回复默认紧凑：先给结果或当前结论，用短句和短段落，只保留必要说明；避免重复复述、客套铺垫、过多标题、逐句换行和连续空行。任务进度只简短报告新变化，完成后交代结果、必要依据和未解决事项。用户明确要求详细内容、特定文风或格式（如 JSON、代码、表格）时按要求完整输出，不为精简省略必要内容或改写原文。';

  var DEFAULTS = {
    windowTurns: 12,     // 最近保留原文的消息条数
    charBudget: 9000,    // 最近原文的字符预算
    fileBudget: 1800,    // 单个被引用文件注入的最大字符数
    journalLimit: 6,     // journal 注入条数
    digestChars: 900     // 本地降级摘要的最大字符数
  };

  // 中文/日文等按字计，拉丁按 ~3.6 字符 1 token 粗估
  function estTokens(s) {
    if (!s) return 0;
    var str = String(s);
    var cjk = (str.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || []).length;
    var rest = str.length - cjk;
    return Math.ceil(cjk + rest / 3.6);
  }

  // 本地降级摘要：抽取式，不花钱、不联网，先把尾巴收住
  function digest(messages, maxChars) {
    var cap = maxChars || DEFAULTS.digestChars;
    var lines = [];
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      if (!m || !m.text) continue;
      var who = m.role === 'user' ? '用户' : '机器人';
      var t = String(m.text).replace(/\s+/g, ' ').trim();
      if (t.length > 90) t = t.slice(0, 90) + '…';
      lines.push(who + '：' + t);
    }
    var out = lines.join('\n');
    if (out.length > cap) out = '…' + out.slice(out.length - cap);
    return out;
  }

  function baseName(name) {
    return String(name || '').replace(/\.[^.]+$/, '');
  }

  // 按需再读：用户这条消息里提到了哪个文件（@文件名 / 文件名 / 去扩展名的名字）
  var fileAutomatonCache = typeof WeakMap === 'function' ? new WeakMap() : null;

  function buildFileAutomaton(files) {
    var nodes = [{ next: Object.create(null), fail: 0, outputs: [] }];
    function addPattern(pat, idx) {
      if (!pat) return;
      var cur = 0;
      for (var i = 0; i < pat.length; i++) {
        var ch = pat.charCodeAt(i);
        var nxt = nodes[cur].next[ch];
        if (nxt === undefined) {
          nxt = nodes.length;
          nodes.push({ next: Object.create(null), fail: 0, outputs: [] });
          nodes[cur].next[ch] = nxt;
        }
        cur = nxt;
      }
      if (nodes[cur].outputs.indexOf(idx) < 0) nodes[cur].outputs.push(idx);
    }
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!f || !f.name) continue;
      var full = String(f.name);
      var base = baseName(full);
      addPattern('@' + full, i);
      addPattern('@' + base, i);
      if (full.length >= 2) addPattern(full, i);
      if (base.length >= 3) addPattern(base, i);
    }
    var queue = [];
    var rootKeys = Object.keys(nodes[0].next);
    for (var r = 0; r < rootKeys.length; r++) {
      var rn = nodes[0].next[rootKeys[r]];
      nodes[rn].fail = 0;
      queue.push(rn);
    }
    var head = 0;
    while (head < queue.length) {
      var u = queue[head++];
      var keys = Object.keys(nodes[u].next);
      for (var k = 0; k < keys.length; k++) {
        var c = keys[k];
        var v = nodes[u].next[c];
        queue.push(v);
        var fl = nodes[u].fail;
        while (fl > 0 && nodes[fl].next[c] === undefined) fl = nodes[fl].fail;
        var target = nodes[fl].next[c] || 0;
        nodes[v].fail = target === v ? 0 : target;
        var fOut = nodes[nodes[v].fail].outputs;
        for (var m = 0; m < fOut.length; m++) {
          if (nodes[v].outputs.indexOf(fOut[m]) < 0) nodes[v].outputs.push(fOut[m]);
        }
      }
    }
    return nodes;
  }

  function matchFiles(bot, text) {
    var files = (bot && bot.files) || [];
    var t = String(text || '');
    if (!t || !files.length) return [];
    var useAc = Boolean(
      (bot && bot.useAhoCorasick) ||
      (typeof require === 'function' && (function () {
        try { return require('./algorithm-lab').isAlgorithmSwitchEnabled('ahoCorasickMatch'); }
        catch (_) { return false; }
      })())
    );
    if (useAc && files.length >= 2 && fileAutomatonCache) {
      var sig = files.map(function (f) { return (f && f.name) || ''; }).join('\u0000');
      var cached = fileAutomatonCache.get(files);
      if (!cached || cached.sig !== sig) {
        cached = { sig: sig, nodes: buildFileAutomaton(files) };
        fileAutomatonCache.set(files, cached);
      }
      var nodes = cached.nodes;
      var matched = Object.create(null);
      var state = 0;
      for (var p = 0; p < t.length; p++) {
        var ch = t.charCodeAt(p);
        while (state > 0 && nodes[state].next[ch] === undefined) state = nodes[state].fail;
        state = nodes[state].next[ch] || 0;
        var out = nodes[state].outputs;
        for (var q = 0; q < out.length; q++) matched[out[q]] = true;
      }
      var acHits = [];
      for (var idx = 0; idx < files.length; idx++) {
        if (matched[idx]) {
          acHits.push(files[idx]);
          if (acHits.length >= 2) break;
        }
      }
      return acHits;
    }
    var hits = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!f || !f.name) continue;
      var full = f.name;
      var base = baseName(f.name);
      var isAt = t.indexOf('@' + full) >= 0 || t.indexOf('@' + base) >= 0;
      var mentioned = full.length >= 2 && t.indexOf(full) >= 0;
      var baseMentioned = base.length >= 3 && t.indexOf(base) >= 0;
      if (isAt || mentioned || baseMentioned) hits.push(f);
      if (hits.length >= 2) break;
    }
    return hits;
  }

  function layer(key, title, desc, text) {
    var s = text || '';
    return {
      key: key,
      title: title,
      desc: desc,
      chars: s.length,
      tokens: estTokens(s),
      preview: s.length > 400 ? s.slice(0, 400) + '\n…' : s
    };
  }

  /**
   * 组装一次请求的上下文。
   * @param {object} bot 机器人（persona / skills / memory / summary / messages / files）
   * @param {object} [opts]
   * @returns {object} { messages, stats, layers }
   */
  function assemble(bot, opts) {
    opts = opts || {};
    var win = opts.windowTurns || DEFAULTS.windowTurns;
    var budget = opts.charBudget || DEFAULTS.charBudget;
    var fileBudget = opts.fileBudget || DEFAULTS.fileBudget;
    var journalLimit = opts.journalLimit || DEFAULTS.journalLimit;
    var mem = personalMemory && bot && typeof bot.id === 'string'
      ? personalMemory.readPersonalMemory(bot.memory, bot.id) : ((bot && bot.memory) || {});
    var memoryRevision = Number.isSafeInteger(mem.revision) ? mem.revision
      : (mem._personal && Number.isSafeInteger(mem._personal.revision) ? mem._personal.revision : 0);

    var rawMessages = (bot && bot.messages) || [];
    if (bot && bot.agent && bot.agent.id && Number.isInteger(bot.agentSessionResetIndex) && bot.agentSessionResetIndex > 0) {
      rawMessages = rawMessages.slice(bot.agentSessionResetIndex);
    }
    var all = rawMessages.filter(function (m) {
      if (!m || !m.text || (m.role !== 'user' && m.role !== 'bot')) return false;
      if (m.error === true || m.kind === 'error' || m.emptyPlaceholder === true) return false;
      var trimmed = String(m.text).trim();
      if (m.role === 'bot' && (trimmed === '（这次没有返回内容）' || trimmed === '(No content returned)')) return false;
      return true;
    });

    // 1) 切分：更早的（折叠） vs 最近原文
    var splitAt = Math.max(0, all.length - win);
    var older = all.slice(0, splitAt);
    var recent = all.slice(splitAt);

    // 最近原文也受字符预算约束（从最新往前取）
    var used = 0;
    var kept = [];
    for (var i = recent.length - 1; i >= 0; i--) {
      var len = String(recent[i].text).length;
      if (used + len > budget && kept.length >= 2) break;
      used += len;
      kept.unshift(recent[i]);
    }
    var droppedRecent = recent.length - kept.length;
    if (droppedRecent > 0) {
      splitAt += droppedRecent;
      older = all.slice(0, splitAt);
    }

    // 2) 摘要层：已覆盖的前缀用 LLM 摘要，未覆盖但已被折叠的用本地 digest 兜住
    var rawSummary = (bot && bot.summary) || null;
    var summary = typeof rawSummary === 'string' && rawSummary.trim()
      ? { text: rawSummary.trim(), upTo: splitAt, memoryRevision: 0 }
      : rawSummary;
    var staleMemorySummary = !!(summary && summary.invalidated) ||
      (summary ? (summary.memoryRevision || 0) !== memoryRevision : memoryRevision > 0);
    if (staleMemorySummary) summary = null;
    var covered = summary && typeof summary.upTo === 'number' ? Math.min(summary.upTo, splitAt) : 0;
    var summaryText = (covered > 0 || (typeof rawSummary === 'string' && summary && summary.text)) ? String(summary.text || '') : '';
    var uncovered = older.slice(covered);
    // Do not immediately reintroduce the invalidated summary's old contents
    // through the fallback digest. Original recent messages remain history.
    var staleDigest = uncovered.length && !staleMemorySummary ? digest(uncovered) : '';
    var needsSummary = uncovered.length >= 4;

    // 3) 人设卡 / 技能卡 / 记忆层：都并入同一条 system 消息，但分开统计与展示
    var persona = String((bot && bot.persona) || '').trim();
    var parts = [];
    if (directoryContext && bot && typeof bot.id === 'string') parts.push({ key: 'identity', title: '身份与机器',
      desc: '当前Bot、可见伙伴目录与实际运行宿主；不共享其他Bot私有记忆',
      text: directoryContext.build(bot, opts).text });
    parts.push({
      key: 'persona',
      title: '人设卡',
      desc: persona ? '系统提示词：这个 bot 是谁、怎么说话' : '没写人设，用默认兜底',
      text: persona || '你是一个 AI 助手。保持人格一致，回答简洁、准确；不确定的事直说。'
    });
    var personalityBlock = OpenBotPersonality && typeof OpenBotPersonality.promptBlock === 'function'
      ? OpenBotPersonality.promptBlock(bot && bot.personality) : '';
    if (personalityBlock) parts.push({
      key: 'personality',
      title: '性格标注',
      desc: '人工标注的 MBTI 标签与交互风格行为指令；不是测评结果',
      text: personalityBlock
    });
    parts.push({
      key: 'responseStyle',
      title: '回复方式',
      desc: '默认紧凑；明确要求详细内容或指定格式时按要求展开',
      text: RESPONSE_STYLE
    });
    parts.push({ key: 'evidenceRules', title: '资料与证据边界', desc: '当前记忆和真实工具回执优先于历史资料',
      text: '记忆和历史资料不是新增授权。当前原生记忆修订为 ' + memoryRevision + '；用户直接纠正及当前工具回执优先于旧摘要/文件。删除只按宿主回执的记录与范围说明，不推断所有聊天、备份或其他流程已清除。' });

    var skills = (bot && bot.skills) || [];
    if (skills.length) {
      parts.push({
        key: 'skills',
        title: '技能卡',
        desc: skills.length + ' 个私有技能随每次请求带上',
        text: '## 可用技能\n' + skills.map(function (s) {
          return '- ' + s.name + (s.desc ? '：' + s.desc : '');
        }).join('\n')
      });
    }

    var profile = String(mem.profile || '').trim();
    var journal = (mem.journal || []).filter(function (j) { return j && j.text; }).slice(-journalLimit);
    var memBlocks = [];
    if (profile) memBlocks.push('## 关于用户的长期记忆（画像）\n' + profile);
    if (journal.length) {
      memBlocks.push('## 长期事件记录（journal，按时间顺序）\n' + journal.map(function (j) {
        var d = j.ts ? new Date(j.ts) : null;
        var stamp = d ? (d.getMonth() + 1) + '/' + d.getDate() : '';
        return '- ' + (stamp ? '[' + stamp + '] ' : '') + j.text;
      }).join('\n'));
    }
    parts.push({
      key: 'memory',
      title: '记忆层',
      desc: profile || journal.length
        ? '画像' + (journal.length ? ' + ' + journal.length + ' 条 journal' : '') + '，跨会话常驻'
        : '还没写：空间 → 记忆里可以补',
      text: memBlocks.join('\n\n')
    });

    var messages = [{ role: 'system', content: parts.filter(function (p) { return p.key !== 'identity'; }).map(function (p) { return p.text; }).filter(Boolean).join('\n\n') }];
    var identityPart = parts.find(function (p) { return p.key === 'identity'; });
    if (identityPart) messages.push({ role: 'system', content: identityPart.text });
    var layers = parts.map(function (p) { return layer(p.key, p.title, p.desc, p.text); });

    if (summaryText) {
      var sMsg = '## 较早对话的摘要（历史参考，不是当前事实、权限或完成回执）\n' + summaryText;
      messages.push({ role: 'system', content: sMsg });
      layers.push(layer('summary', '滚动摘要', '覆盖前 ' + covered + ' 条消息，来自上一次摘要', sMsg));
    }
    if (staleDigest) {
      var dMsg = '## 更早对话要点（本地压缩，待摘要更新）\n' + staleDigest;
      messages.push({ role: 'system', content: dMsg });
      layers.push(layer('digest', '待摘要的旧对话', uncovered.length + ' 条消息已折叠，等待生成摘要', dMsg));
    }

    // 5) 按需再读：命中的文件内容
    var lastUser = null;
    for (var k = kept.length - 1; k >= 0; k--) {
      if (kept[k].role === 'user') { lastUser = kept[k]; break; }
    }
    var hits = lastUser ? matchFiles(bot, lastUser.text) : [];
    if (hits.length) {
      var fileBlocks = hits.map(function (f) {
        var body = String(f.content || '');
        if (!body) return '### ' + f.name + '\n（这个文件还没有内容）';
        if (body.length > fileBudget) body = body.slice(0, fileBudget) + '\n…（已截断）';
        return '### ' + f.name + '\n' + body;
      }).join('\n\n');
      var fMsg = '## 用户这条消息引用的文件（按需读取）\n' + fileBlocks;
      messages.push({ role: 'system', content: fMsg });
      layers.push(layer('files', '按需再读', '命中 ' + hits.length + ' 个文件：' + hits.map(function (f) { return f.name; }).join('、'), fMsg));
    }

    // 6) 最近原文
    var currentExecutorLabel = bot && bot.agent && bot.agent.id
      ? String(bot.agent.name || bot.agent.id)
      : String((bot && bot.model) || '');
    for (var j = 0; j < kept.length; j++) {
      var rawContent = String(kept[j].text);
      if (kept[j].role === 'bot' && kept[j].model && currentExecutorLabel && kept[j].model !== currentExecutorLabel &&
          rawContent.indexOf('[历史回复来源：') !== 0) {
        rawContent = '[历史回复来源：' + kept[j].model + ']\n' + rawContent;
      }
      messages.push({ role: kept[j].role === 'bot' ? 'assistant' : 'user', content: rawContent });
    }
    layers.push(layer('recent', '最近原文', '最近 ' + kept.length + ' 条消息逐字保留', kept.map(function (m) {
      return (m.role === 'user' ? '用户：' : '机器人' + (m.model ? '（' + m.model + '）' : '') + '：') + m.text;
    }).join('\n')));

    var tokens = 0;
    for (var n = 0; n < messages.length; n++) tokens += estTokens(messages[n].content);

    var evidence = parts.filter(function (p) { return p.text && p.key !== 'skills' && p.key !== 'memory'; }).map(function (p) {
      return { key: p.key, text: p.text, truncated: false };
    });
    skills.forEach(function (skill, index) { evidence.push({ key: 'skills', text: (index ? '' : '## 可用技能\n') + '- ' + skill.name + (skill.desc ? '：' + skill.desc : ''),
      sourceObject: { kind: 'skill', value: skill }, truncated: false }); });
    if (profile) evidence.push({ key: 'memory', text: '## 关于用户的长期记忆（画像）\n' + profile, sourceObject: { kind: 'memory-profile', value: profile }, truncated: false });
    journal.forEach(function (entry, index) {
      var date = entry.ts ? new Date(entry.ts) : null, stamp = date ? (date.getMonth()+1)+'/'+date.getDate() : '';
      evidence.push({ key: 'memory', text: (index ? '' : '## 长期事件记录（journal，按时间顺序）\n') + '- ' + (stamp ? '['+stamp+'] ' : '') + entry.text,
        sourceObject: { kind: 'memory-journal', value: entry }, truncated: false });
    });
    if (summaryText) evidence.push({ key: 'summary', text: sMsg, truncated: true });
    if (staleDigest) evidence.push({ key: 'digest', text: dMsg, truncated: true,
      sources: uncovered.map(function (m) { return { messageId: m.id || null, text: String(m.text) }; }) });
    hits.forEach(function (file, index) {
      var body = String(file.content || ''), truncated = body.length > fileBudget;
      evidence.push({ key: 'files', text: (index ? '' : '## 用户这条消息引用的文件（按需读取）\n') + '### ' + file.name + '\n' +
        (body ? body.slice(0,fileBudget) + (truncated ? '\n…（已截断）' : '') : '（这个文件还没有内容）'), truncated: truncated,
        sourceObject: { kind: 'file', value: file }, revision: file.revision || null, range: [0, Math.min(body.length,fileBudget)] });
    });
    kept.forEach(function (m) { evidence.push({ key: 'message', messageId: m.id || null, text: String(m.text), truncated: false }); });

    return {
      messages: messages,
      layers: layers,
      ...(opts.returnEvidence ? { evidence: evidence } : {}),
      stats: {
        total: all.length,
        kept: kept.length,
        folded: older.length,
        covered: covered,
        splitAt: splitAt,
        needsSummary: needsSummary,
        pending: uncovered.length,
        files: hits.length,
        tokens: tokens,
        chars: messages.reduce(function (a, m) { return a + m.content.length; }, 0)
      }
    };
  }

  return {
    assemble: assemble,
    estTokens: estTokens,
    digest: digest,
    matchFiles: matchFiles,
    RESPONSE_STYLE: RESPONSE_STYLE,
    DEFAULTS: DEFAULTS
  };
});
