(function (root) {
  'use strict';

  var filters = { source: 'demo', game: 'all', dimension: 'users', communication: 'silent', query: '' };
  var result = null;
  var resultKey = '';
  var error = '';
  var loading = false;
  var requestId = 0;
  var options = null;
  var currentHost = null;
  var composingSearch = false;
  var LOGO_FILES = {
    dsh: 'dsh.svg', pi: 'pi.svg', legacy: 'legacy.svg', codex: 'codex.svg', claude: 'claude.svg',
    gemini: 'gemini.svg', kimi: 'kimi.svg', qwen: 'qwen.svg', grok: 'grok.svg', agy: 'agy.svg',
    opencode: 'opencode.svg', 'cursor-agent': 'cursor-agent.svg', goose: 'goose.svg', copilot: 'copilot.svg',
    amp: 'amp.svg', aider: 'aider.png', codebuddy: 'codebuddy.svg', cline: 'cline.svg', generic: 'generic.svg'
  };

  function text(value) { return value === undefined || value === null ? '' : String(value); }
  function tr(zh, en, params) {
    return options && typeof options.tr === 'function' ? options.tr(zh, en, params) : zh;
  }
  function node(tag, className, content) {
    var item = root.document.createElement(tag);
    if (className) item.className = className;
    if (content !== undefined && content !== null) item.textContent = text(content);
    return item;
  }
  function append(parent, child) { if (child) parent.appendChild(child); return child; }
  function currentKey() { return [filters.source, filters.game, filters.dimension, filters.communication].join('|'); }
  function safeLogoSrc(input) {
    var match = String(input || '').match(/(?:^|\/)agent-logos\/([a-z0-9-]+)\.(svg|png)$/i);
    var key = match ? match[1].toLowerCase() : 'generic';
    return 'assets/agent-logos/' + (LOGO_FILES[key] || 'generic.svg');
  }
  function iconSrc(game) {
    var meta = gameMeta(game);
    return meta && /^assets\/game\/icons\/[a-z0-9-]+\.svg$/.test(text(meta.icon)) ? text(meta.icon) : '';
  }
  // Registered games come from the host with every state payload; the filter
  // list and its icons are built from that, never from a hardcoded pair.
  function gameList() {
    if (options && Array.isArray(options.games) && options.games.length) return options.games;
    if (result && Array.isArray(result.games) && result.games.length) return result.games;
    return [];
  }
  function gameMeta(game) {
    var list = gameList();
    for (var i = 0; i < list.length; i++) if (text(list[i].id) === text(game)) return list[i];
    return null;
  }
  function gameName(game) {
    var meta = gameMeta(game);
    return meta ? tr(meta.name, meta.nameEn || meta.name) : text(game);
  }
  function request(host) {
    var bridge = options && options.bridge;
    var requestKey = currentKey();
    if (!bridge || typeof bridge.gameSpaceBenchmark !== 'function') {
      error = tr('排行榜接口尚未连接。', 'The leaderboard API is unavailable.');
      loading = false;
      paint(host);
      return;
    }
    var id = ++requestId;
    loading = true;
    error = '';
    paint(host);
    Promise.resolve(bridge.gameSpaceBenchmark({ source: filters.source, game: filters.game, dimension: filters.dimension, communication: filters.communication }))
      .then(function (data) {
        if (id !== requestId) return;
        if (data && data.ok === false) throw new Error(data.message || tr('读取排行榜失败。', 'Could not load leaderboard data.'));
        result = data && data.data ? data.data : data;
        if (!result || result.schema !== 'openbot.game-benchmark/1' || !Array.isArray(result.rows)) {
          throw new Error(tr('排行榜数据格式无效。', 'Leaderboard data is invalid.'));
        }
        resultKey = requestKey;
        loading = false;
        paint(currentHost);
      })
      .catch(function (cause) {
        if (id !== requestId) return;
        error = text(cause && cause.message) || tr('读取排行榜失败。', 'Could not load leaderboard data.');
        loading = false;
        result = null;
        resultKey = '';
        paint(currentHost);
      });
  }

  function paint(host) {
    if (!host) return;
    // Benchmark requests can finish while the user is composing a query.
    // Defer the repaint so the native IME candidate and selection stay bound
    // to the live input until compositionend.
    if (composingSearch) return;
    var active = root.document.activeElement;
    var focusKey = host.contains(active) && active.dataset ? active.dataset.gsFocusKey : '';
    var selection = focusKey ? {
      start: typeof active.selectionStart === 'number' ? active.selectionStart : null,
      end: typeof active.selectionEnd === 'number' ? active.selectionEnd : null,
      direction: typeof active.selectionDirection === 'string' ? active.selectionDirection : 'none'
    } : null;
    host.replaceChildren();
    var toolbar = node('div', 'obgb-toolbar');
    var title = node('h2', 'obgb-title', tr('排行榜', 'Leaderboard'));
    toolbar.appendChild(title);
    var filtersRow = node('div', 'obgb-filters');
    filtersRow.appendChild(renderFilter('source', tr('数据来源', 'Source'), 'obgs-benchmark-source', [
      ['demo', tr('模拟数据', 'Demo data')], ['local', tr('本机对局', 'Local matches')]
    ]));
    filtersRow.appendChild(renderFilter('game', tr('游戏', 'Game'), 'obgs-benchmark-game',
      [['all', tr('全部游戏', 'All games')]].concat(gameList().map(function (meta) { return [text(meta.id), gameName(meta.id)]; }))));
    filtersRow.appendChild(renderFilter('communication', tr('桌内交流', 'Table chat'), 'obgs-benchmark-communication', [
      ['silent', tr('安静对局', 'Quiet games')], ['table-talk', tr('允许聊天', 'Chat allowed')]
    ]));
    toolbar.appendChild(filtersRow);
    host.appendChild(toolbar);
    host.appendChild(renderDimensionTabs());

    if (loading && resultKey !== currentKey()) {
      append(host, node('p', 'obgb-state', tr('正在读取排行榜…', 'Loading leaderboard…')));
      restoreBenchmarkFocus(host, focusKey);
      return;
    }
    if (error) {
      var errorBox = node('div', 'obgb-error');
      append(errorBox, node('p', '', error));
      var retry = node('button', 'obgs-secondary', tr('重试', 'Retry'));
      retry.type = 'button';
      retry.dataset.gsBenchmarkRetry = 'true';
      retry.dataset.gsFocusKey = 'benchmark-retry';
      errorBox.appendChild(retry);
      host.appendChild(errorBox);
      restoreBenchmarkFocus(host, focusKey);
      return;
    }
    if (!result || resultKey !== currentKey()) {
      append(host, node('p', 'obgb-state', tr('正在读取排行榜…', 'Loading leaderboard…')));
      restoreBenchmarkFocus(host, focusKey);
      return;
    }
    host.appendChild(renderSummary(result));
    append(host, node('p', 'obgb-communication-note', filters.communication === 'table-talk'
      ? tr('当前仅统计开启桌内聊天的对局；安静对局会单独计入另一组排行榜。', 'This view ranks games with table chat only. Quiet games appear in a separate leaderboard.')
      : tr('当前仅统计安静对局；开启桌内聊天的对局会单独计入另一组排行榜。演示数据仅包含安静对局。', 'This view ranks quiet games only. Games with table chat appear separately; demo data contains quiet games only.')));
    if (filters.source === 'local' && filters.dimension === 'models') {
      append(host, node('p', 'obgb-explainer', tr(
        '只统计已完成且关联到当前模型 ID 的 DSH 调用对局；规则 BOT 和无法归属模型的参与不计入。',
        'Only completed DSH-call matches linked to a stable model ID are ranked. Rules BOTs and unattributed participations are excluded.'
      )));
    }
    if (filters.source === 'local' && filters.dimension === 'models' && result.rows.length === 0) {
      var emptyModel = node('section', 'obgb-explanation');
      append(emptyModel, node('h3', '', tr('暂时没有可验证的模型成绩', 'No verifiable model results yet')));
      append(emptyModel, node('p', '', tr(
        '本机排行只纳入已完成且能关联到当前模型 ID 的 DSH 调用对局。规则 BOT、未记录模型 ID 或 ID 中途变化的参与不计入模型榜。',
        'Local model rankings include completed DSH-call matches with a stable model ID. Rules BOTs, missing IDs, and IDs that changed during a match are excluded.'
      )));
      if (Number(result.excluded) > 0) append(emptyModel, node('p', 'obgb-excluded', tr('已排除 {count} 次无法归属模型的参与。', '{count} participations could not be attributed to a model.', { count: formatNumber(result.excluded) })));
      host.appendChild(emptyModel);
      restoreBenchmarkFocus(host, focusKey);
      return;
    }
    if (!result.rows.length) {
      append(host, node('p', 'obgb-state', tr('当前筛选下还没有已完成对局。', 'No completed matches for these filters yet.')));
      restoreBenchmarkFocus(host, focusKey);
      return;
    }
    var identityTools = node('div', 'obgb-identity-tools');
    var identitySearchLabel = node('label', 'obgb-search-label', tr('查找身份', 'Find an identity'));
    identitySearchLabel.htmlFor = 'obgs-benchmark-search';
    var identitySearch = node('input', 'obgb-search');
    identitySearch.id = 'obgs-benchmark-search';
    identitySearch.type = 'search';
    identitySearch.value = filters.query;
    identitySearch.placeholder = tr('名称、ID 或 Harness', 'Name, ID, or harness');
    identitySearch.setAttribute('aria-label', tr('按名称、ID 或 Harness 搜索排行榜身份', 'Search leaderboard identities by name, ID, or harness'));
    identitySearch.autocomplete = 'off';
    identitySearch.dataset.gsBenchmarkSearch = 'true';
    identitySearch.dataset.gsFocusKey = 'benchmark-search';
    identityTools.appendChild(identitySearchLabel);
    identityTools.appendChild(identitySearch);
    var matchingRows = result.rows.filter(function (row) {
      var visibleName = filters.source === 'local' && row.id === 'local-user' ? tr('本机用户', 'Local user') : text(row.name);
      var haystack = [visibleName, row.name, row.id, row.logo, row.harness, row.model].join(' ');
      return matchesQuery(haystack, filters.query);
    });
    var matchCount = node('span', 'obgb-match-count', tr('显示 {visible} / {total} 个身份', 'Showing {visible} of {total} identities', { visible: matchingRows.length, total: result.rows.length }));
    matchCount.setAttribute('role', 'status');
    matchCount.setAttribute('aria-live', 'polite');
    identityTools.appendChild(matchCount);
    host.appendChild(identityTools);
    if (!matchingRows.length) {
      append(host, node('p', 'obgb-state obgb-search-empty', tr('没有匹配的身份；清除搜索可恢复全部结果。', 'No identities match. Clear the search to show all results.')));
    } else {
      host.appendChild(renderTable(result, matchingRows));
    }
    append(host, node('p', 'obgb-method-note', tr(
      '胜率 = 胜场 ÷ 参赛席次（和局计入分母）；全部游戏按总样本汇总。',
      'Win rate = wins ÷ participations (draws count in the denominator); all-game rates aggregate all samples.'
    )));
    if (Number(result.excluded) > 0) append(host, node('p', 'obgb-excluded', tr('{count} 次参与未计入此维度。', '{count} participations were excluded from this dimension.', { count: formatNumber(result.excluded) })));
    restoreBenchmarkFocus(host, focusKey, selection);
  }

  function restoreBenchmarkFocus(host, focusKey, selection) {
    if (!focusKey) return;
    var controls = host.querySelectorAll('[data-gs-focus-key]');
    for (var i = 0; i < controls.length; i++) {
      if (controls[i].dataset.gsFocusKey !== focusKey || controls[i].disabled) continue;
      try { controls[i].focus({ preventScroll: true }); } catch (_) { controls[i].focus(); }
      if (selection && selection.start !== null && typeof controls[i].setSelectionRange === 'function') {
        try { controls[i].setSelectionRange(selection.start, selection.end, selection.direction); } catch (_) { }
      }
      return;
    }
  }

  function renderFilter(key, labelText, id, values) {
    var wrap = node('label', 'obgb-filter');
    wrap.htmlFor = id;
    append(wrap, node('span', '', labelText));
    var select = node('select', 'obgb-select');
    select.id = id;
    select.dataset.gsBenchmarkFilter = key;
    select.dataset.gsFocusKey = 'benchmark-filter-' + key;
    values.forEach(function (entry) {
      var option = node('option', '', entry[1]);
      option.value = entry[0];
      if (key === 'communication' && filters.source === 'demo' && entry[0] === 'table-talk') option.disabled = true;
      select.appendChild(option);
    });
    select.value = filters[key];
    wrap.appendChild(select);
    if (key === 'game') {
      var icons = node('span', 'obgb-filter-icons');
      if (filters.game === 'all') {
        gameList().forEach(function (meta) { append(icons, gameIcon(text(meta.id))); });
      } else append(icons, gameIcon(filters.game));
      wrap.appendChild(icons);
    }
    return wrap;
  }

  function renderDimensionTabs() {
    var tabs = node('div', 'obgb-dimensions');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', tr('排行榜维度', 'Leaderboard category'));
    [
      ['users', tr('用户', 'Users')],
      ['harnesses', tr('Harness', 'Harnesses')],
      ['models', tr('大模型', 'Models')]
    ].forEach(function (entry) {
      var button = node('button', 'obgb-dimension' + (filters.dimension === entry[0] ? ' is-selected' : ''), entry[1]);
      button.type = 'button';
      button.dataset.gsBenchmarkDimension = entry[0];
      button.dataset.gsFocusKey = 'benchmark-dimension-' + entry[0];
      button.id = 'obgs-benchmark-dimension-' + entry[0];
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', filters.dimension === entry[0] ? 'true' : 'false');
      button.setAttribute('tabindex', filters.dimension === entry[0] ? '0' : '-1');
      tabs.appendChild(button);
    });
    return tabs;
  }

  function gameIcon(game) {
    var src = iconSrc(game);
    if (!src) return null;
    var img = node('img', 'obgb-game-icon');
    img.src = src;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.decoding = 'async';
    return img;
  }

  function renderSummary(data) {
    var summary = node('div', 'obgb-summary');
    var meta = node('span', 'obgb-summary-game');
    if (filters.game === 'all') {
      gameList().forEach(function (entry) { meta.appendChild(gameIcon(text(entry.id))); });
      append(meta, node('strong', '', tr('全部游戏', 'All games')));
    } else {
      meta.appendChild(gameIcon(filters.game));
      append(meta, node('strong', '', gameName(filters.game)));
    }
    summary.appendChild(meta);
    var facts = node('div', 'obgb-summary-facts');
    if (data.isSimulation) append(facts, node('strong', 'obgb-source-mark is-demo', tr('模拟数据', 'Demo data')));
    else append(facts, node('strong', 'obgb-source-mark', tr('本机对局', 'Local matches')));
    append(facts, node('span', '', tr('{count} 场 · {plays} 次参与', '{count} matches · {plays} participations', { count: formatNumber(data.matches), plays: formatNumber(data.participations) })));
    summary.appendChild(facts);
    if (data.isSimulation) append(summary, node('span', 'obgb-simulation-note', tr('演示数据，不代表真实成绩', 'Illustrative data; not real performance')));
    return summary;
  }

  function matchesQuery(input, query) {
    var needle = text(query).normalize('NFKC').trim().toLocaleLowerCase();
    return !needle || text(input).normalize('NFKC').toLocaleLowerCase().indexOf(needle) >= 0;
  }

  function renderTable(data, rows) {
    var wrap = node('div', 'obgb-table-wrap');
    var table = node('table', 'obgb-table');
    var head = node('thead', '');
    var header = node('tr', '');
      [tr('排名', 'Rank'), tr('身份', 'Identity'), tr('胜率', 'Win rate'), tr('胜 / 负 / 和', 'W / L / D'), tr('参赛席次', 'Seats played')].forEach(function (label) {
      append(header, node('th', '', label));
    });
    head.appendChild(header);
    table.appendChild(head);
    var body = node('tbody', '');
    rows.forEach(function (row) {
      var trNode = node('tr', 'obgb-row');
      append(trNode, node('td', 'obgb-rank', String(row.rank)));
      var identity = node('td', 'obgb-identity-cell');
      var identityWrap = node('div', 'obgb-identity');
      if (filters.dimension === 'users' && options && typeof options.avatar === 'function') {
        var avatarFrame = node('span', 'obgb-avatar');
        options.avatar(avatarFrame, { id: row.id, name: row.name, avatar: row.avatar, color: row.color }, 'mini');
        identityWrap.appendChild(avatarFrame);
      } else {
        var logo = node('span', 'obgb-logo');
        var image = node('img', '');
        image.src = safeLogoSrc(row.logo);
        image.alt = '';
        image.decoding = 'async';
        image.onerror = function () {
          image.onerror = null;
          var neutral = document.createElement('span'); neutral.innerHTML = '<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>';
          image.replaceWith(neutral.firstElementChild);
        };
        logo.appendChild(image);
        identityWrap.appendChild(logo);
      }
      var displayName = filters.source === 'local' && row.id === 'local-user' ? tr('本机用户', 'Local user') : text(row.name);
      append(identityWrap, node('strong', 'obgb-name', displayName));
      identity.appendChild(identityWrap);
      trNode.appendChild(identity);
      append(trNode, node('td', 'obgb-rate', ((Number(row.winRate) || 0) * 100).toFixed(1) + '%'));
      append(trNode, node('td', 'obgb-record', [row.wins, row.losses, row.draws].map(formatNumber).join(' / ')));
      append(trNode, node('td', 'obgb-played', formatNumber(row.played)));
      body.appendChild(trNode);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    return wrap;
  }

  function formatNumber(input) {
    var number = Number(input);
    return Number.isFinite(number) ? number.toLocaleString() : '0';
  }

  function handleChange(event) {
    var target = event.target;
    if (!target || !target.dataset || !target.dataset.gsBenchmarkFilter) return;
    var key = target.dataset.gsBenchmarkFilter;
    if (key !== 'source' && key !== 'game' && key !== 'communication') return;
    filters[key] = target.value;
    if (key === 'source' && filters.source === 'demo') filters.communication = 'silent';
    request(currentHost);
  }

  function handleInput(event) {
    var target = event.target;
    if (!target || !target.dataset || target.dataset.gsBenchmarkSearch !== 'true') return;
    filters.query = target.value;
    if (event.isComposing) composingSearch = true;
    if (composingSearch) return;
    paint(currentHost);
  }

  function handleCompositionStart(event) {
    var target = event.target;
    if (target && target.dataset && target.dataset.gsBenchmarkSearch === 'true') composingSearch = true;
  }

  function handleCompositionEnd(event) {
    var target = event.target;
    if (!target || !target.dataset || target.dataset.gsBenchmarkSearch !== 'true') return;
    filters.query = target.value;
    composingSearch = false;
    root.setTimeout(function () { if (currentHost && currentHost.isConnected) paint(currentHost); }, 0);
  }

  function handleClick(event) {
    var target = event.target && event.target.closest ? event.target.closest('[data-gs-benchmark-dimension],[data-gs-benchmark-retry]') : null;
    if (!target || !currentHost || !currentHost.contains(target)) return;
    if (target.dataset.gsBenchmarkRetry) { request(currentHost); return; }
    var dimension = target.dataset.gsBenchmarkDimension;
    if (dimension && ['users', 'harnesses', 'models'].indexOf(dimension) >= 0 && filters.dimension !== dimension) {
      filters.dimension = dimension;
      request(currentHost);
    }
  }

  function handleKeydown(event) {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) < 0) return;
    var active = event.target && event.target.closest ? event.target.closest('[data-gs-benchmark-dimension]') : null;
    if (!active || !currentHost || !currentHost.contains(active)) return;
    var tabs = Array.prototype.slice.call(currentHost.querySelectorAll('[data-gs-benchmark-dimension]'));
    var index = tabs.indexOf(active);
    var nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    if (tabs[nextIndex]) {
      event.preventDefault();
      try { tabs[nextIndex].focus({ preventScroll: true }); } catch (_) { tabs[nextIndex].focus(); }
      tabs[nextIndex].click();
    }
  }

  function render(host, nextOptions) {
    currentHost = host;
    options = nextOptions || options || {};
    if (!host.dataset.obgbEvents) {
      host.dataset.obgbEvents = 'true';
      host.addEventListener('change', handleChange);
      host.addEventListener('click', handleClick);
      host.addEventListener('keydown', handleKeydown);
      host.addEventListener('input', handleInput);
      host.addEventListener('compositionstart', handleCompositionStart);
      host.addEventListener('compositionend', handleCompositionEnd);
    }
    paint(host);
    if (resultKey !== currentKey() && !loading) request(host);
  }

  function invalidate() {
    resultKey = '';
    requestId += 1;
    loading = false;
  }

  function cancelComposition() { composingSearch = false; }

  root.OpenBotGameBenchmark = { render: render, invalidate: invalidate, cancelComposition: cancelComposition };
})(window);
