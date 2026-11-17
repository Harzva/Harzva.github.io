(function (root) {
  'use strict';

  function tr(zh, en) { return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en) : zh; }

  function node(tag, className, text) {
    var item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function formatWhen(value) {
    if (!value) return tr('时间未知', 'Unknown time');
    var time = Date.parse(value);
    if (!Number.isFinite(time)) return tr('时间未知', 'Unknown time');
    var delta = Date.now() - time;
    if (delta >= 0 && delta < 60 * 60 * 1000) return tr('刚刚', 'Just now');
    if (delta >= 0 && delta < 24 * 60 * 60 * 1000) return tr(Math.max(1, Math.round(delta / 3600000)) + ' 小时前', Math.max(1, Math.round(delta / 3600000)) + 'h ago');
    try {
      return new Intl.DateTimeFormat(document.documentElement.lang.startsWith('en') ? 'en' : 'zh-CN',
        { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(time));
    } catch (_) {
      return new Date(time).toLocaleString();
    }
  }

  function create(options) {
    options = options || {};
    var bridge = options.bridge;
    var rootEl = document.getElementById('mem-migrate-root');
    if (!rootEl || !bridge || typeof bridge.memoryMigrationSources !== 'function') return null;
    if (rootEl.dataset.mounted === 'true') return null;
    rootEl.dataset.mounted = 'true';

    var els = {
      source: document.getElementById('mem-migrate-source'),
      provider: document.getElementById('mem-migrate-provider'),
      scan: document.getElementById('mem-migrate-scan'),
      note: document.getElementById('mem-migrate-source-note'),
      browse: document.getElementById('mem-migrate-browse'),
      list: document.getElementById('mem-migrate-list'),
      mode: document.getElementById('mem-migrate-mode'),
      existingField: document.getElementById('mem-migrate-existing-field'),
      existing: document.getElementById('mem-migrate-existing'),
      preview: document.getElementById('mem-migrate-preview'),
      count: document.getElementById('mem-migrate-count'),
      apply: document.getElementById('mem-migrate-apply'),
      status: document.getElementById('mem-migrate-status'),
      magpie: document.getElementById('mem-migrate-magpie')
    };
    if (Object.keys(els).some(function (key) { return !els[key]; })) return null;

    var state = {
      busy: false,
      sources: [],
      sessions: [],
      selected: new Set(),
      providers: [],
      providerId: '',
      model: '',
      sourceId: '',
      previewId: ''
    };

    function setStatus(message, kind) {
      els.status.textContent = message || '';
      els.status.classList.toggle('is-error', kind === 'error');
      els.status.classList.toggle('is-ok', kind === 'ok');
    }

    function setBusy(busy) {
      state.busy = busy;
      rootEl.dataset.busy = busy ? 'true' : 'false';
      els.scan.disabled = busy;
      els.source.disabled = busy || !state.sources.length;
      els.provider.disabled = busy || !state.providers.length;
      els.mode.disabled = busy;
      els.existing.disabled = busy;
      syncApply();
    }

    function syncApply() {
      var mode = els.mode.value;
      var needsBot = mode === 'existing';
      var tooMany = state.selected.size > 20;
      els.existingField.hidden = !needsBot;
      var ready = !state.busy && state.selected.size > 0 && !tooMany && (!needsBot || !!els.existing.value);
      els.apply.disabled = !ready;
      els.apply.textContent = state.selected.size
        ? tr('导入所选 · ' + state.selected.size + ' 个', 'Import ' + state.selected.size + ' selected')
        : tr('导入所选', 'Import selected');
      els.count.textContent = state.sessions.length
        ? tr('共 ' + state.sessions.length + ' 个会话，已选 ' + state.selected.size + ' 个' +
          (tooMany ? '（一次最多导入 20 个）' : ''),
          state.sessions.length + ' conversations · ' + state.selected.size + ' selected' +
          (tooMany ? ' (max 20 per import)' : ''))
        : '';
    }

    function fillSources(activeProfileId) {
      els.source.replaceChildren();
      state.sources.forEach(function (source) {
        var label = source.label;
        if (Number.isFinite(source.sessionCount)) label += ' · ' + source.sessionCount + tr(' 个会话', ' conversations');
        if (source.status === 'missing') label += tr(' · 未检测到', ' · not found');
        else if (source.status === 'empty') label += tr(' · 无会话', ' · empty');
        var option = new Option(label, source.id);
        option.disabled = source.status === 'missing';
        els.source.add(option);
      });
      var preferred = state.sources.find(function (source) { return source.kind === 'grok-bot' && source.sessionCount > 0; }) ||
        state.sources.find(function (source) { return source.sessionCount > 0; }) ||
        state.sources[0];
      if (preferred) els.source.value = preferred.id;
      els.source.disabled = state.busy || !state.sources.length;
      state.providerId = activeProfileId || (state.providers[0] && state.providers[0].id) || '';
      if (els.provider.value) state.providerId = els.provider.value;
      setNote();
    }

    function fillProviders(activeProfileId) {
      els.provider.replaceChildren();
      if (!state.providers.length) {
        els.provider.add(new Option(tr('未配置模型连接', 'No model connection'), ''));
      }
      state.providers.forEach(function (provider) {
        els.provider.add(new Option(provider.name + (provider.model ? ' · ' + provider.model : ''), provider.id));
      });
      var preferred = activeProfileId && state.providers.some(function (p) { return p.id === activeProfileId; })
        ? activeProfileId : (state.providers[0] && state.providers[0].id) || '';
      if (preferred) els.provider.value = preferred;
      state.providerId = els.provider.value;
      syncProvider();
      els.provider.disabled = state.busy || !state.providers.length;
    }

    function syncProvider() {
      var provider = state.providers.find(function (row) { return row.id === els.provider.value; });
      state.providerId = els.provider.value;
      state.model = provider ? provider.model : '';
    }

    function setNote() {
      var source = state.sources.find(function (row) { return row.id === els.source.value; });
      state.sourceId = els.source.value;
      if (!source) { els.note.textContent = ''; return; }
      var detail = source.kind === 'grok-bot'
        ? tr('只读取本机 Grok Bot 的会话副本，不修改原应用。', 'Reads local Grok Bot conversation replicas without changing the original app.')
        : tr('来源：' + (source.detail || '本机智能体') + ' · 只读', 'Source: ' + (source.detail || 'local agent') + ' · read-only');
      if (source.status === 'missing') detail = tr('没有找到这个来源的数据目录。', 'This source directory was not found.');
      if (source.status === 'empty') detail = tr('来源存在，但没有可导入的会话。', 'The source exists but has no importable conversations.');
      if (source.status === 'partial') detail += tr(' · 部分内容可能无法读取', ' · some content may be unreadable');
      els.note.textContent = detail;
    }

    function renderSessions() {
      els.list.replaceChildren();
      els.list.hidden = !state.sessions.length;
      if (!state.sessions.length) return;
      var head = node('div', 'mem-session-head');
      var all = node('label', 'mem-session-all');
      var allBox = document.createElement('input');
      allBox.type = 'checkbox';
      allBox.checked = state.sessions.every(function (row) { return state.selected.has(row.id); });
      allBox.addEventListener('change', function () {
        state.selected.clear();
        if (allBox.checked) {
          state.sessions.slice(0, 20).forEach(function (row) { state.selected.add(row.id); });
          if (state.sessions.length > 20) {
            setStatus(tr('一次最多导入 20 个会话，已选择最近 20 个。', 'Up to 20 conversations per import; the 20 most recent are selected.'));
          }
        }
        renderSessions();
        syncApply();
      });
      all.appendChild(allBox);
      all.appendChild(node('span', '', tr('全选', 'Select all')));
      head.appendChild(all);
      head.appendChild(node('span', 'mem-session-head-note', tr('会话按最近更新时间排序', 'Most recent first')));
      els.list.appendChild(head);
      state.sessions.forEach(function (session, index) {
        var row = node('div', 'mem-session');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'mem-session-' + index;
        checkbox.checked = state.selected.has(session.id);
        checkbox.addEventListener('change', function () {
          if (checkbox.checked) state.selected.add(session.id);
          else state.selected.delete(session.id);
          syncApply();
        });
        row.appendChild(checkbox);
        var main = node('div', 'mem-session-main');
        var title = node('label', 'mem-session-title', session.title || tr('未命名会话', 'Untitled conversation'));
        title.setAttribute('for', checkbox.id);
        main.appendChild(title);
        var meta = [];
        meta.push(formatWhen(session.updatedAt));
        meta.push(Number.isFinite(session.messageCount) ? tr(session.messageCount + ' 条消息', session.messageCount + ' messages')
          : tr('预览后统计', 'Count on preview'));
        if (session.model) meta.push(session.model);
        main.appendChild(node('span', 'mem-session-meta', meta.join(' · ')));
        row.appendChild(main);
        var preview = node('button', 'mem-session-preview', state.previewId === session.id ? tr('收起', 'Hide') : tr('预览', 'Preview'));
        preview.type = 'button';
        preview.addEventListener('click', function () { togglePreview(session); });
        row.appendChild(preview);
        els.list.appendChild(row);
      });
    }

    function togglePreview(session) {
      if (state.previewId === session.id) {
        state.previewId = '';
        els.preview.hidden = true;
        els.preview.replaceChildren();
        els.browse.dataset.preview = 'false';
        renderSessions();
        return;
      }
      state.previewId = session.id;
      els.preview.hidden = false;
      els.browse.dataset.preview = 'true';
      els.preview.replaceChildren(node('div', 'mem-preview-loading', tr('正在读取预览…', 'Reading preview…')));
      renderSessions();
      bridge.memoryMigrationPreview({ sourceId: state.sourceId, sessionId: session.id }).then(function (result) {
        if (state.previewId !== session.id) return;
        if (!result || result.ok !== true) {
          els.preview.replaceChildren(node('div', 'mem-preview-error', (result && result.message) || tr('预览失败。', 'Preview failed.')));
          return;
        }
        els.preview.replaceChildren();
        var head = node('div', 'mem-preview-head');
        head.appendChild(node('strong', '', result.session.title || session.title));
        var facts = [tr('前 ' + result.messages.length + ' 条 / 共 ' + result.total + ' 条', 'First ' + result.messages.length + ' of ' + result.total)];
        if (result.coverage && result.coverage.status === 'partial') facts.push(tr('部分内容已截断', 'partially truncated'));
        if (result.redactions) facts.push(tr('已脱敏 ' + result.redactions + ' 处', result.redactions + ' redacted'));
        head.appendChild(node('span', 'mem-preview-facts', facts.join(' · ')));
        var close = node('button', 'mem-preview-close', '×');
        close.type = 'button';
        close.setAttribute('aria-label', tr('关闭预览', 'Close preview'));
        close.addEventListener('click', function () { state.previewId = ''; els.preview.hidden = true; els.preview.replaceChildren(); els.browse.dataset.preview = 'false'; renderSessions(); });
        head.appendChild(close);
        els.preview.appendChild(head);
        result.messages.forEach(function (message) {
          var row = node('div', 'mem-preview-message');
          row.dataset.role = message.role;
          row.appendChild(node('span', 'mem-preview-role', message.role === 'user' ? tr('用户', 'User') : tr('助手', 'Assistant')));
          var previewText = node('div', 'mem-preview-text');
          if (message.role !== 'user' && window.OpenBotMarkdown && typeof window.OpenBotMarkdown.render === 'function'){
            previewText.className += ' uw-thread-markdown';
            previewText.appendChild(window.OpenBotMarkdown.render(String(message.text == null ? '' : message.text), { links:true }));
          } else {
            previewText.textContent = String(message.text == null ? '' : message.text);
          }
          row.appendChild(previewText);
          els.preview.appendChild(row);
        });
        if (result.total > result.messages.length) els.preview.appendChild(node('p', 'mem-preview-more', tr('仅显示开头部分，导入时会按上限保留完整文本。', 'Only the beginning is shown; the import keeps full text up to the limit.')));
      }).catch(function () {
        if (state.previewId !== session.id) return;
        els.preview.replaceChildren(node('div', 'mem-preview-error', tr('预览失败。', 'Preview failed.')));
      });
    }

    function loadSessions() {
      var sourceId = els.source.value;
      if (!sourceId) return Promise.resolve();
      state.sourceId = sourceId;
      state.selected.clear();
      state.previewId = '';
      els.preview.hidden = true;
      els.preview.replaceChildren();
      els.browse.dataset.preview = 'false';
      setBusy(true);
      setStatus(tr('正在读取会话列表…', 'Reading conversations…'));
      return bridge.memoryMigrationSessions({ sourceId: sourceId }).then(function (result) {
        if (!result || result.ok !== true) {
          state.sessions = [];
          renderSessions();
          setStatus((result && result.message) || tr('无法读取会话。', 'Could not read conversations.'), 'error');
          return;
        }
        state.sessions = result.sessions || [];
        renderSessions();
        var warnings = Array.isArray(result.warnings) ? result.warnings : [];
        if (!state.sessions.length) setStatus(tr('这个来源没有可导入的会话。', 'No importable conversations in this source.'));
        else if (warnings.length) setStatus(tr('已读取 ' + state.sessions.length + ' 个会话（部分内容可能无法读取）。',
          'Loaded ' + state.sessions.length + ' conversations (some content may be unreadable).'));
        else setStatus(tr('已读取 ' + state.sessions.length + ' 个会话。', 'Loaded ' + state.sessions.length + ' conversations.'), 'ok');
      }).catch(function () {
        state.sessions = [];
        renderSessions();
        setStatus(tr('无法读取会话。', 'Could not read conversations.'), 'error');
      }).then(function () { setBusy(false); });
    }

    function scan() {
      setBusy(true);
      setStatus(tr('正在扫描本机会话来源…', 'Scanning local conversation sources…'));
      bridge.memoryMigrationSources().then(function (result) {
        if (!result || result.ok !== true) {
          setStatus((result && result.message) || tr('扫描失败。', 'Scan failed.'), 'error');
          setBusy(false);
          return;
        }
        state.sources = Array.isArray(result.sources) ? result.sources : [];
        state.providers = Array.isArray(result.providers) ? result.providers : [];
        var magpie = result.magpie || {};
        els.magpie.hidden = !magpie.available;
        if (magpie.available) {
          var magpieText = tr('Magpie 索引：发现 ' + magpie.sessionCount + ' 个会话、' + magpie.agentCount + ' 个智能体',
            'Magpie index: ' + magpie.sessionCount + ' conversations across ' + magpie.agentCount + ' agents');
          if (magpie.addedSources) magpieText += tr('，补充 ' + magpie.addedSources + ' 个来源', ', ' + magpie.addedSources + ' extra sources');
          magpieText += tr('。它是会话文件索引，正文仍从原智能体读取，无需重复导入。',
            '. It indexes transcript files; Bot Studio reads the originals, so nothing is duplicated.');
          els.magpie.textContent = magpieText;
        }
        fillProviders(result.activeProfileId || '');
        fillSources(result.activeProfileId || '');
        els.existing.replaceChildren();
        var bots = typeof options.getBots === 'function' ? options.getBots() : [];
        bots.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }).forEach(function (bot) {
          els.existing.add(new Option(bot.name, bot.id));
        });
        setBusy(false);
        if (!state.sources.length) {
          setStatus(tr('没有发现可读取的会话来源。', 'No readable conversation sources were found.'), 'error');
          return;
        }
        setStatus('');
        loadSessions();
      }).catch(function () {
        setStatus(tr('扫描失败。', 'Scan failed.'), 'error');
        setBusy(false);
      });
    }

    function apply() {
      if (state.busy || !state.selected.size) return;
      if (state.selected.size > 20) {
        setStatus(tr('一次最多导入 20 个会话，请减少选择。', 'Import up to 20 conversations at a time.'), 'error');
        return;
      }
      var mode = els.mode.value;
      var botId = els.existing.value;
      if (mode === 'existing' && !botId) {
        setStatus(tr('请选择要并入的 BOT。', 'Choose a target Bot.'), 'error');
        return;
      }
      var count = state.selected.size;
      var targetBot = (options.getBots() || []).find(function (bot) { return bot.id === botId; });
      var prompt = mode === 'new'
        ? tr('将把 ' + count + ' 个会话分别导入为新的 BOT。来源不会修改，重复内容会自动跳过。继续？',
          'Import ' + count + ' conversations as new Bots? Sources stay unchanged and duplicates are skipped.')
        : tr('将把 ' + count + ' 个会话并入“' + (targetBot ? targetBot.name : '') + '”。重复内容会自动跳过。继续？',
          'Merge ' + count + ' conversations into "' + (targetBot ? targetBot.name : '') + '"? Duplicates are skipped.');
      if (typeof root.confirm === 'function' && !root.confirm(prompt)) return;
      setBusy(true);
      setStatus(tr('正在导入…', 'Importing…'));
      bridge.memoryMigrationApply({
        sourceId: state.sourceId,
        sessionIds: Array.from(state.selected),
        providerId: state.providerId,
        model: state.model,
        target: { mode: mode, botId: mode === 'existing' ? botId : undefined }
      }).then(function (result) {
        if (!result || result.ok !== true) {
          setStatus((result && result.message) || tr('导入失败。', 'Import failed.'), 'error');
          return;
        }
        var parts = [];
        if (result.created && result.created.length) {
          parts.push(tr('新建 ' + result.created.length + ' 个 BOT：' + result.created.map(function (row) { return row.name; }).join('、'),
            'Created ' + result.created.length + ' Bots: ' + result.created.map(function (row) { return row.name; }).join(', ')));
        }
        if (result.merged) {
          parts.push(tr('并入“' + result.merged.botName + '”：新增 ' + result.merged.added + ' 条，跳过重复 ' + result.merged.skipped + ' 条',
            'Merged into "' + result.merged.botName + '": ' + result.merged.added + ' added, ' + result.merged.skipped + ' duplicates skipped'));
        }
        if (result.reused && result.reused.length) {
          var reusedAdded = result.reused.reduce(function (sum, row) { return sum + row.messages; }, 0);
          var reusedSkipped = result.reused.reduce(function (sum, row) { return sum + row.skipped; }, 0);
          parts.push(tr('已存在 ' + result.reused.length + ' 个 BOT：新增 ' + reusedAdded + ' 条，跳过重复 ' + reusedSkipped + ' 条',
            'Matched ' + result.reused.length + ' existing Bots: ' + reusedAdded + ' added, ' + reusedSkipped + ' duplicates skipped'));
        }
        if (result.redactions) parts.push(tr('已脱敏 ' + result.redactions + ' 处', result.redactions + ' secrets redacted'));
        setStatus(parts.join('；'), 'ok');
        state.selected.clear();
        state.previewId = '';
        els.preview.hidden = true;
        els.preview.replaceChildren();
        els.browse.dataset.preview = 'false';
        renderSessions();
        syncApply();
      }).catch(function () {
        setStatus(tr('导入失败，未写入任何会话。', 'Import failed; nothing was written.'), 'error');
      }).then(function () { setBusy(false); });
    }

    els.scan.addEventListener('click', scan);
    els.source.addEventListener('change', function () { setNote(); loadSessions(); });
    els.provider.addEventListener('change', syncProvider);
    els.mode.addEventListener('change', syncApply);
    els.existing.addEventListener('change', syncApply);
    els.apply.addEventListener('click', apply);
    syncApply();

    return { scan: scan, reload: loadSessions };
  }

  root.OpenBotMemoryMigration = { create: create };
})(window);
