(function (root) {
  'use strict';
  // 市场面板：市场源管理（可校验的目录索引）、Bot 模板浏览与安装、已安装状态与监督任务。
  // 没有嵌入远程网页或第三方脚本：模板内容经主进程按 openbot.market.registry/1 校验后
  // 以文本呈现；安装走用户确认的计划，实际 Bot 以导入回报的真实 ID 为准。
  var api, callbacks, dialog, status, opener, fleetButton;
  var tab = 'templates', selected = '', entries = [], failures = [], sources = [], installs = [], missions = [];
  var epoch = 0, permissionViewEpoch = 0, projectWatchViewEpoch = 0, busy = false, loading = false, fleetOpening = false, projectWatchRefresh = null;
  var search, list, detail, tabs;

  function tr(zh, en) { return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en) : zh; }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function button(text, action, cls) { var b = el('button', cls || '', text); b.type = 'button'; b.addEventListener('click', action); return b; }
  function message(text, error) { status.textContent = text || ''; status.dataset.error = error ? 'true' : 'false'; }
  async function request(promise) { var r = await promise; if (!r || !r.ok) throw new Error(r && r.message || tr('请求未完成，请重试', 'Request failed, try again')); return r.data; }
  async function openFleetMarket() {
    if (fleetOpening) return;
    if (!api || typeof api.openFleetMarket !== 'function') {
      message(tr('应用与版本管理暂不可用。', 'Apps & versions is unavailable.'), true);
      return;
    }
    fleetOpening = true;
    if (fleetButton) {
      fleetButton.disabled = true;
      fleetButton.setAttribute('aria-busy', 'true');
    }
    message(tr('正在打开应用与版本管理…', 'Opening Apps & versions…'));
    try {
      var result = await api.openFleetMarket();
      if (result === false || (result && result.ok === false)) {
        throw new Error(result && result.message || tr('无法打开应用与版本管理。', 'Could not open Apps & versions.'));
      }
      message(tr('应用与版本管理已在独立窗口打开。', 'Apps & versions opened in a separate window.'));
    } catch (error) {
      message(error && error.message || tr('无法打开应用与版本管理。', 'Could not open Apps & versions.'), true);
    } finally {
      fleetOpening = false;
      if (fleetButton) {
        fleetButton.disabled = false;
        fleetButton.removeAttribute('aria-busy');
      }
    }
  }
  function close() { if(root.OpenBotGameMarket)root.OpenBotGameMarket.cancelPreview(); epoch++; dialog.close(); if (opener && opener.isConnected) opener.focus(); }
  function esc(v) { return v; } // 渲染只用 textContent，不做 HTML 拼接。

  function installFor(entryId) { return installs.find(function (r) { return r.entryId === entryId; }) || null; }
  function botMissions(botId) { return missions.filter(function (m) { return m.supervisorBotId === botId; }); }
  function visibleRequirements(entryId, requirements) {
    var rows = Array.isArray(requirements) ? requirements : [];
    if (entryId !== 'awesome/supervisor') return rows;
    // The legacy role manifest says supervision requires general BOT-management
    // authority (usually the primary BOT). That claim predates the host-scoped
    // personal-task grant displayed below and would contradict its actual scope.
    return rows.filter(function (requirement) {
      return !/(?:机器人管理权限|bot management permissions?).*(?:主\s*BOT|primary\s*BOT|primary bot)/i.test(String(requirement || ''));
    });
  }

  async function loadAll(refresh) {
    var id = ++epoch; loading = true; message(tr('正在读取市场…', 'Loading market…'));
    try {
      var results = await Promise.allSettled([
        request(api.marketTemplates()),
        request(api.marketInstallStatus()),
        request(api.supervisionList())
      ]);
      if (id !== epoch || !dialog.open) return;
      var failure = results.find(function (r) { return r.status === 'rejected'; });
      if (results[0].status === 'fulfilled') { entries = results[0].value.entries || []; failures = results[0].value.failures || []; sources = results[0].value.sources || []; }
      if (results[1].status === 'fulfilled') installs = results[1].value || [];
      if (results[2].status === 'fulfilled') missions = results[2].value || [];
      if (refresh && results[0].status === 'fulfilled') {
        var refreshes = await Promise.allSettled(sources.filter(function (s) { return s.enabled !== false; })
          .map(function (s) { return request(api.marketRefreshSource({ id: s.id })); }));
        var ok = refreshes.find(function (r) { return r.status === 'fulfilled'; });
        if (ok) sources = ok.value;
      }
      loading = false;
      if (failure && results[0].status === 'rejected') message(failure.reason.message, true);
      else if (failures.length) message(tr('部分市场源暂不可用：', 'Some sources are unavailable: ') + failures.map(function (f) { return f.label; }).join('、'), true);
      else message(noteText(), false);
      render();
    } catch (error) { if (id === epoch && dialog.open) { loading = false; message(error.message, true); render(); } }
  }

  function noteText() {
    if (tab === 'games') return tr('游戏按需下载到本机，可单独卸载。', 'Games download to local storage and can be uninstalled individually.');
    if (tab === 'sources') return tr('市场源是可校验的目录索引；添加前会先读取验证。', 'Sources are verifiable catalog indexes; each is validated before it is added.');
    if (tab === 'installed') return installs.length
      ? installs.length + tr(' 个模板已安装；安装不授予执行权限。', ' template(s) installed; installing grants no execution rights.')
      : tr('还没有从市场安装模板。', 'No templates installed yet.');
    return entries.length
      ? entries.length + tr(' 份模板，来自 ' + sources.filter(function (s) { return s.enabled !== false; }).length + ' 个启用源', ' template(s) from enabled sources')
      : tr('目录尚未加载。', 'Catalog not loaded yet.');
  }

  /* ---------- Bot 模板 ---------- */
  function renderTemplates() {
    var query = search.value.trim().toLowerCase();
    var rows = entries.filter(function (item) {
      return [item.name, item.summary, item.id, item.sourceLabel].join(' ').toLowerCase().includes(query);
    });
    if (!rows.some(function (item) { return item.id === selected; })) selected = rows[0] ? rows[0].id : '';
    detail.replaceChildren();
    list.replaceChildren();
    rows.forEach(function (item) {
      var row = button('', function () { selected = item.id; render(); }); row.className = 'ob-market-row'; row.dataset.marketId = item.id;
      row.setAttribute('aria-current', String(selected === item.id));
      var mark = installFor(item.id) ? tr('已安装', 'Installed') : (item.verified ? tr('已验证', 'Verified') : tr('未验证', 'Unverified'));
      row.append(el('strong', '', item.name), el('span', '', item.sourceLabel + ' · ' + mark));
      list.append(row);
    });
    if (!rows.length) list.append(el('p', 'ob-market-note', loading ? tr('正在读取目录…', 'Loading catalog…') : (query ? tr('没有找到匹配项。试试更短的关键词。', 'No matches. Try shorter keywords.') : tr('目录为空，可在“市场源”里检查来源。', 'Catalog is empty; check sources.'))));
    renderTemplateDetail(rows.find(function (item) { return item.id === selected; }));
  }

  async function renderTemplateDetail(item) {
    detail.replaceChildren();
    if (!item) { detail.append(el('p', 'ob-market-note', tr('选择一份模板，查看职责、来源与要求。', 'Select a template to see its role, source and requirements.'))); return; }
    detail.append(el('h3', '', item.name), el('p', 'ob-market-description', item.summary));
    detail.append(el('p', 'ob-market-note', (item.verified ? tr('已验证', 'Verified') : tr('未验证', 'Unverified')) + ' · ' + item.id + ' · ' + tr('来源', 'Source') + '：' + item.sourceLabel));
    var versions = (item.versions || []).map(function (v) { return v.version; }).join('、');
    if (versions) detail.append(el('p', 'ob-market-note', tr('版本', 'Versions') + '：' + versions));

    var install = installFor(item.id);
    if (install) {
      renderInstallState(install, { inline: true });
      return;
    }
    var go = button(tr('查看安装计划…', 'Review install plan…'), function () { planAndInstall(item); }, 'ob-market-primary');
    go.id = 'ob-market-install'; detail.append(go);
    detail.append(el('p', 'ob-market-note', tr('安装只创建可编辑的 BOT 配置；不连接账号、不授予工具或屏幕权限。', 'Installing only creates an editable bot; it connects no accounts and grants no tool or screen permissions.')));

    try {
      var data = await request(api.marketTemplateDetail({ entryId: item.id }));
      if (!dialog.open || selected !== item.id) return;
      var manifest = data.manifest || {};
      var templateRequirements = visibleRequirements(item.id, manifest['x-requires']);
      if (templateRequirements.length) {
        var req = el('div', 'ob-market-requirements'); req.append(el('h4', '', tr('需要的前提', 'Requirements')));
        templateRequirements.forEach(function (r) { req.append(el('li', '', r)); });
        detail.append(req);
      }
      var guidance = manifest.guidance || {};
      if (guidance.welcome) detail.append(el('p', 'ob-market-note', tr('首次引导', 'Onboarding') + '：' + guidance.welcome));
      if (guidance.taskExamples && guidance.taskExamples[0]) {
        var ex = el('details', 'ob-market-advanced');
        ex.append(el('summary', '', tr('示例任务', 'Example task')),
          el('p', 'ob-market-persona', guidance.taskExamples[0].title + '\n' + guidance.taskExamples[0].prompt));
        detail.append(ex);
      }
      if (manifest.bot && manifest.bot.persona) {
        var persona = el('details', 'ob-market-advanced');
        persona.append(el('summary', '', tr('查看完整职责', 'Full role text')), el('p', 'ob-market-persona', manifest.bot.persona));
        detail.append(persona);
      }
    } catch (error) { if (dialog.open && selected === item.id) detail.append(el('p', 'ob-market-note', tr('详情暂不可读：', 'Details unavailable: ') + error.message)); }
  }

  /* ---------- 安装计划与确认 ---------- */
  async function planAndInstall(item, retrying) {
    if (busy) return;
    message(tr('正在生成安装计划…', 'Building install plan…'));
    var plan;
    try { plan = await request(api.marketPlanTemplate({ entryId: item.id, version: retrying && retrying.version })); }
    catch (error) { message(error.message, true); return; }
    if (!plan.ok) { message((plan.errors || []).join('；') || tr('无法生成安装计划', 'Cannot build an install plan'), true); return; }
    message('');
    showPlanDialog(item, plan);
  }

  function showPlanDialog(item, plan) {
    var confirm_ = el('dialog', 'ob-market-plan'); confirm_.id = 'ob-market-plan';
    var head = el('header'); head.append(el('h3', '', tr('安装计划 · ', 'Install plan · ') + item.name));
    var body = el('div', 'ob-market-plan-body');
    plan.bots.forEach(function (bot) {
      body.append(el('p', '', tr('将创建 BOT', 'Will create bot') + '：' + bot.name + '（' + bot.templateId + '）'));
    });
    (plan.warnings || []).forEach(function (w) { body.append(el('p', 'ob-market-note', w)); });
    if (plan.needs && (plan.needs.tools || plan.needs.screen)) {
      body.append(el('p', 'ob-market-note', tr('模板声明需要工具/屏幕能力；安装不会授予，配置阶段仍由你确认。', 'The template declares tool/screen needs; installing grants none — you confirm at configuration time.')));
    }
    var planRequirements = visibleRequirements(item.id, plan.requirements);
    if (planRequirements.length) {
      var req = el('div', 'ob-market-requirements'); req.append(el('h4', '', tr('需要的前提', 'Requirements')));
      planRequirements.forEach(function (r) { req.append(el('li', '', r)); });
      body.append(req);
    }
    body.append(el('p', 'ob-market-note', tr('来源：', 'Source: ') + plan.source.label + ' · ' + tr('版本', 'version') + ' ' + plan.version));
    var actions = el('div', 'ob-market-plan-actions');
    var installBtn = button(tr('确认安装', 'Install'), async function () {
      busy = true; installBtn.disabled = true;
      message(tr('正在安装…', 'Installing…'));
      try {
        var result = await request(api.marketInstallTemplate({ entryId: item.id, version: plan.version }));
        confirm_.close(); confirm_.remove();
        await reloadStatus();
        busy = false;
        if (result.alreadyInstalled) message(tr('已安装过这份模板：', 'Already installed: ') + result.botName, false);
        else message(tr('已安装为 BOT：', 'Installed as bot: ') + result.botName, false);
        tab = 'installed'; selected = result.entryId; syncTabs(); render();
      } catch (error) { message(error.message, true); busy = false; installBtn.disabled = false; }
    }, 'ob-market-primary');
    var cancel = button(tr('取消', 'Cancel'), function () { confirm_.close(); confirm_.remove(); focusOpener(); });
    actions.append(installBtn, cancel);
    confirm_.append(head, body, actions);
    confirm_.addEventListener('cancel', function (event) { event.preventDefault(); confirm_.close(); confirm_.remove(); focusOpener(); });
    document.body.append(confirm_); confirm_.showModal(); installBtn.focus();
  }

  /* ---------- 已安装：配置状态与监督任务 ---------- */
  function configLabel(install) {
    if (!install.botAlive) return tr('BOT 已被删除，可重新安装', 'Bot was deleted; you can reinstall');
    var missing = [];
    if (!install.bot.model) missing.push(tr('模型', 'model'));
    if (!install.bot.toolsEnabled) missing.push(tr('工具权限', 'tools'));
    if (install.entryId === 'awesome/supervisor') {
      var permission = install.supervisionPermission;
      if (!permission || permission.botId !== install.botId || permission.enabled !== true || permission.eligible !== true) {
        missing.push(permission && permission.eligible === false
          ? tr('监督授权不可用', 'supervision permission unavailable')
          : tr('任务监督授权', 'task supervision permission'));
      }
    }
    return missing.length ? tr('待配置：', 'Needs setup: ') + missing.join(tr('、', ', ')) : tr('已可使用', 'Ready');
  }

  function validPermission(permission, botId) {
    return !!permission && permission.botId === botId && typeof permission.enabled === 'boolean' &&
      typeof permission.eligible === 'boolean' && Number.isSafeInteger(permission.revision) && permission.revision >= 0;
  }

  function renderSupervisionPermission(install) {
    var viewId = ++permissionViewEpoch;
    var section = el('section', 'ob-market-supervision-permission');
    var head = el('div', 'ob-market-supervision-permission-head');
    head.append(el('h4', '', tr('任务监督授权', 'Task supervision permission')));
    var state = el('span', 'ob-market-permission-state', tr('正在读取…', 'Checking…'));
    state.setAttribute('role', 'status');
    head.append(state);
    var scope = el('p', 'ob-market-note', tr(
      '仅适用于这台 Mac 上、你逐项批准的个人任务；无需更换主 BOT。此授权不提供一般 BOT 管理权或私有记忆访问，工具仍需在 BOT 设置中单独开启。',
      'For your individually approved personal tasks on this Mac only; no primary bot switch is needed. This grants no general bot management or private-memory access. Tools must still be enabled separately in bot settings.'
    ));
    var reason = el('p', 'ob-market-note ob-market-permission-reason');
    var actions = el('div', 'ob-market-permission-actions');
    section.append(head, scope, reason, actions);
    detail.append(section);

    function isCurrentView() {
      return viewId === permissionViewEpoch && dialog && dialog.open && tab === 'installed' &&
        selected === install.entryId && section.isConnected;
    }

    function unavailable(errorText) {
      state.textContent = tr('状态不可用', 'Status unavailable');
      state.dataset.state = 'unknown';
      reason.textContent = errorText || tr('无法读取宿主返回的监督授权状态。', 'Could not read the host supervision-permission state.');
      actions.replaceChildren();
      var retry = button(tr('重试读取', 'Retry'), readPermission);
      retry.disabled = busy;
      actions.append(retry);
    }

    function showPermission(permission) {
      if (!validPermission(permission, install.botId)) {
        unavailable(tr('宿主返回的授权状态不完整或与此 BOT 不匹配；为安全起见，当前不能更改授权。',
          'The host returned an incomplete permission state or a different bot ID. Changes are disabled for safety.'));
        return;
      }
      var current = permission;
      state.textContent = permission.enabled
        ? (permission.eligible ? tr('已授权', 'Authorized') : tr('已授权 · 当前不可用', 'Authorized · unavailable'))
        : (permission.eligible ? tr('未授权', 'Not authorized') : tr('暂不可用', 'Unavailable'));
      state.dataset.state = permission.enabled ? (permission.eligible ? 'enabled' : 'ineligible') : 'disabled';
      reason.textContent = permission.eligible ? '' : (permission.reason || tr('宿主当前不允许启用监督授权。', 'The host currently does not allow supervision permission.'));
      actions.replaceChildren();
      if (permission.enabled) {
        var revoke = button(tr('撤销授权', 'Revoke permission'), function () {
          showPermissionConfirmation(install, current, false, revoke);
        }, 'ob-market-permission-revoke');
        revoke.id = 'ob-market-supervision-permission-revoke';
        revoke.disabled = busy;
        actions.append(revoke);
      } else {
        var grant = button(tr('授予授权', 'Grant permission'), function () {
          showPermissionConfirmation(install, current, true, grant);
        }, 'ob-market-primary ob-market-permission-grant');
        grant.id = 'ob-market-supervision-permission-grant';
        grant.disabled = busy || !permission.eligible || !install.botAlive;
        actions.append(grant);
      }
    }

    async function readPermission() {
      state.textContent = tr('正在读取…', 'Checking…');
      state.dataset.state = 'loading';
      reason.textContent = '';
      actions.replaceChildren();
      try {
        if (typeof api.supervisionPermissionGet !== 'function') throw new Error(tr('当前宿主版本不支持读取监督授权。', 'This host version cannot read supervision permissions.'));
        var permission = await request(api.supervisionPermissionGet({ botId: install.botId }));
        if (!isCurrentView()) return;
        showPermission(permission);
      } catch (error) {
        if (isCurrentView()) unavailable(error.message);
      }
    }

    readPermission();
  }

  function showPermissionConfirmation(install, permission, enabled, trigger) {
    if (busy || !validPermission(permission, install.botId) || (enabled && (!permission.eligible || permission.enabled)) || (!enabled && !permission.enabled)) return;
    var confirm_ = el('dialog', 'ob-market-plan ob-market-supervision-permission-dialog');
    confirm_.id = 'ob-market-supervision-permission-dialog';
    var title = el('h3', '', enabled ? tr('启用任务监督？', 'Enable task supervision?') : tr('撤销任务监督授权？', 'Revoke task supervision permission?'));
    title.id = 'ob-market-supervision-permission-confirm-title';
    confirm_.setAttribute('aria-labelledby', title.id);
    var head = el('header');
    head.append(title);
    var body = el('div', 'ob-market-plan-body');
    if (enabled) {
      body.append(
        el('p', '', tr('这会允许此 BOT 在本机监督你逐项批准的个人任务；无需更换主 BOT。', 'This lets the bot supervise your individually approved personal tasks on this Mac; no primary bot switch is needed.')),
        el('p', 'ob-market-note', tr('每项任务仍需你单独明确批准。授权不会开启工具，也不会提供一般 BOT 管理权或私有记忆访问；如需工具，仍要在 BOT 设置里单独开启。', 'You must still approve each task explicitly. This does not enable tools or grant general bot management or private-memory access. Enable tools separately in bot settings if needed.'))
      );
    } else {
      body.append(
        el('p', '', tr('撤销会持久停止此 BOT 托管的监督任务。', 'Revoking will persistently stop missions hosted by this bot.')),
        el('p', 'ob-market-note', tr('以后重新授权不会恢复已停止的任务；要继续时，需要在对话里重新明确授权。', 'Reauthorizing later will not restore stopped missions. To continue, explicitly authorize the task again in chat.'))
      );
    }
    var actions = el('div', 'ob-market-plan-actions');
    var confirmButton = button(enabled ? tr('确认授权', 'Confirm permission') : tr('确认撤销', 'Confirm revocation'), async function () {
      if (busy) return;
      busy = true;
      confirmButton.disabled = true;
      cancel.disabled = true;
      try {
        var changed = await request(api.supervisionPermissionSet({
          botId: install.botId, enabled: enabled, expectedRevision: permission.revision
        }));
        if (!validPermission(changed, install.botId) || changed.enabled !== enabled) {
          throw new Error(tr('宿主未确认所请求的授权状态。', 'The host did not confirm the requested permission state.'));
        }
        confirm_.close(); confirm_.remove();
        await loadAll(false);
        var refreshed = installs.find(function (record) { return record.entryId === install.entryId && record.botId === install.botId; });
        var actual = refreshed && refreshed.supervisionPermission;
        busy = false;
        render();
        if (validPermission(actual, install.botId) && actual.enabled === enabled) {
          message(enabled ? tr('任务监督授权已保存。', 'Task supervision permission saved.') : tr('监督授权已撤销；托管任务已停止。', 'Permission revoked; hosted missions stopped.'), false);
        } else {
          message(tr('操作已提交，但无法确认最新授权状态。请刷新市场后核对；页面不会自行标记为已授权。',
            'The change was submitted, but the latest permission state could not be confirmed. Refresh the market to check; the page will not mark it authorized on its own.'), true);
        }
      } catch (error) {
        var errorText = error && error.message || tr('授权操作失败。', 'Permission change failed.');
        confirm_.close(); confirm_.remove();
        await loadAll(false);
        busy = false;
        render();
        message(errorText, true);
        if (trigger && trigger.isConnected) trigger.focus();
      }
    }, 'ob-market-primary');
    confirmButton.id = 'ob-market-supervision-permission-confirm';
    var cancel = button(tr('取消', 'Cancel'), function () {
      if (busy) return;
      confirm_.close(); confirm_.remove();
      if (trigger && trigger.isConnected) trigger.focus();
    });
    cancel.id = 'ob-market-supervision-permission-cancel';
    actions.append(confirmButton, cancel);
    confirm_.append(head, body, actions);
    confirm_.addEventListener('cancel', function (event) {
      event.preventDefault();
      if (busy) return;
      confirm_.close(); confirm_.remove();
      if (trigger && trigger.isConnected) trigger.focus();
    });
    document.body.append(confirm_);
    confirm_.showModal();
    confirmButton.focus();
  }

  function renderInstalled() {
    list.replaceChildren(); detail.replaceChildren();
    if (!installs.length) { list.append(el('p', 'ob-market-note', tr('还没有从市场安装模板。到“Bot 模板”里选择并安装。', 'Nothing installed yet. Pick a template under Bot templates.'))); return; }
    var query = search.value.trim().toLowerCase();
    var rows = installs.filter(function (r) { return [r.botName, r.entryId, r.version].join(' ').toLowerCase().includes(query); });
    if (!rows.some(function (r) { return r.entryId === selected; })) selected = rows[0] ? rows[0].entryId : '';
    rows.forEach(function (r) {
      var row = button('', function () { selected = r.entryId; render(); }); row.className = 'ob-market-row'; row.dataset.marketId = r.entryId;
      row.setAttribute('aria-current', String(selected === r.entryId));
      var mark = !r.botAlive ? tr('已删除', 'Deleted') : configLabel(r);
      // 行上直接显示进行中的任务状态，监督中/待人处理一眼可见。
      var liveMission = botMissions(r.botId).find(function (m) { return m.status === 'active' || m.status === 'needs_user'; });
      if (liveMission) mark += ' · ' + (liveMission.status === 'active' ? tr('监督中', 'Supervising') : tr('待人处理', 'Needs you'));
      row.append(el('strong', '', r.botName), el('span', '', mark));
      list.append(row);
    });
    var current = rows.find(function (r) { return r.entryId === selected; });
    if (current) renderInstallState(current, { inline: false });
  }

  function renderInstallState(install) {
    var watchViewId = ++projectWatchViewEpoch;
    detail.replaceChildren();
    detail.append(el('h3', '', install.botName));
    detail.append(el('p', 'ob-market-note', install.entryId + ' · ' + install.version + ' · ' + tr('来源', 'Source') + '：' + install.sourceId));
    var config = el('p', '', configLabel(install));
    detail.append(config);
    if (!install.botAlive) {
      var again = button(tr('重新安装', 'Reinstall'), function () {
        var entry = entries.find(function (e) { return e.id === install.entryId; });
        if (entry) { tab = 'templates'; syncTabs(); selected = entry.id; render(); planAndInstall(entry); }
        else message(tr('目录里暂无此模板；请先刷新或检查市场源。', 'Template not in catalog; refresh or check sources.'), true);
      }, 'ob-market-primary');
      detail.append(again);
    } else {
      var open = button(tr('打开这个 BOT', 'Open this bot'), function () { close(); callbacks.openBot(install.botId); }, 'ob-market-primary');
      detail.append(open);
      // 配置清单：模板声明的前提逐条呈现，能核对的（模型/工具）给出实际状态。
      var reqs = visibleRequirements(install.entryId, install.requirements);
      if (reqs.length) {
        var checklist = el('ul', 'ob-market-requirements');
        reqs.forEach(function (r) {
          var state = '';
          if (/API 模型|API model/i.test(r)) state = install.bot.model ? ' ✓' : ' · ' + tr('待配置', 'todo');
          else if (/工具|tools/i.test(r)) state = install.bot.toolsEnabled ? ' ✓' : ' · ' + tr('待开启', 'todo');
          checklist.append(el('li', '', r + state));
        });
        detail.append(checklist);
      }
      var hint = el('p', 'ob-market-note',
        install.bot.model ? tr('模型已选择。', 'Model selected.') : tr('先在 BOT 设置里选择本机 API 模型。', 'Choose a local API model in bot settings first.'));
      detail.append(hint);
    }
    if (install.entryId === 'awesome/supervisor') renderSupervisionPermission(install);
    var missions = botMissions(install.botId);
    if (missions.length) {
      var section = el('section', 'ob-market-missions'); section.append(el('h4', '', tr('监督任务', 'Supervised missions')));
      missions.forEach(function (m) { section.append(missionRow(m)); });
      detail.append(section);
    } else if (install.botAlive) {
      detail.append(el('p', 'ob-market-note', tr('还没有监督中的任务。打开 BOT，按首次引导交办原目标、完成标准、执行 BOT 和轮数。', 'No missions yet. Open the bot and hand over an objective, acceptance criteria, executor and round budget.')));
    }
    if (install.entryId === 'awesome/supervisor' && install.botAlive) renderProjectWatches(install, watchViewId);
    var advanced = el('details', 'ob-market-advanced');
    advanced.append(el('summary', '', tr('安装记录', 'Install record')),
      el('p', 'ob-market-note', tr('安装时间', 'Installed at') + '：' + install.installedAt),
      el('p', 'ob-market-note', tr('权限：模板声明的工具/屏幕权限未随安装授予。', 'Permissions: tool/screen needs declared by the template were not granted on install.')));
    var remove = button(tr('移除安装关联', 'Unlink install record'), async function () {
      if (busy) return; busy = true;
      try { await request(api.marketUninstallTemplate({ entryId: install.entryId })); await reloadStatus(); message(tr('已移除安装关联；BOT 与聊天保留。', 'Install record removed; bot and chats remain.')); }
      catch (error) { message(error.message, true); }
      busy = false; render();
    });
    remove.disabled = busy;
    advanced.append(remove);
    detail.append(advanced);
  }

  function projectWatchStatus(watch) {
    if (watch.status === 'needs_user' || watch.phase === 'needs_user') return tr('需要你决定', 'Needs your decision');
    if (watch.status === 'paused') return tr('已暂停', 'Paused');
    if (watch.status === 'expired') return tr('已到期', 'Expired');
    if (watch.status === 'completed') return tr('工程条件已满足', 'Project criteria met');
    if (watch.status === 'stopped') return tr('已停止', 'Stopped');
    if (watch.phase === 'advancing') return tr('正在按计划推进', 'Advancing approved work');
    if (watch.phase === 'queued') return tr('等待开始', 'Queued');
    if (watch.phase === 'waiting_dependency') return tr('等待依赖', 'Waiting for a dependency');
    return watch.mode === 'advance' ? tr('关注并按计划推进', 'Watching and advancing') : tr('关注并提醒', 'Watching and notifying');
  }

  function watchTime(value) {
    if (!value) return tr('尚无记录', 'No record yet');
    var date = new Date(value);
    if (isNaN(date.getTime())) return tr('未知', 'Unknown');
    try { return date.toLocaleString(root.OpenBotI18n ? root.OpenBotI18n.locale : undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
    catch (_) { return date.toLocaleString(); }
  }

  function renderProjectWatches(install, viewId) {
    var section = el('section', 'ob-market-project-watches');
    var heading = el('div', 'ob-market-project-watches-head');
    heading.append(el('h4', '', tr('工程关注', 'Project watches')));
    var stateLabel = el('span', 'ob-market-project-watches-state', tr('正在读取…', 'Checking…'));
    stateLabel.setAttribute('role', 'status'); heading.append(stateLabel); section.append(heading);
    detail.append(section);

    function currentView() {
      return viewId === projectWatchViewEpoch && dialog && dialog.open && tab === 'installed' &&
        selected === install.entryId && section.isConnected;
    }
    function showError(copy) {
      if (!currentView()) return;
      section.replaceChildren(heading);
      stateLabel.textContent = tr('状态不可用', 'Status unavailable');
      stateLabel.dataset.state = 'unknown';
      section.append(el('p', 'ob-market-note ob-market-project-watches-error', copy));
      var retry = button(tr('重试读取', 'Retry'), function () { read(); });
      section.append(retry);
    }
    function rowForWatch(watch, scope) {
      var row = el('div', 'ob-market-project-watch');
      var title = watch.projectName || tr('工程关注', 'Project watch');
      var main = el('div', 'ob-market-project-watch-main');
      var head = el('div', 'ob-market-project-watch-title');
      head.append(el('strong', '', title), el('span', '', projectWatchStatus(watch)));
      main.append(head);
      if (watch.objective) main.append(el('p', 'ob-market-project-watch-objective', watch.objective));
      var meta = tr('最近检查：', 'Last check: ') + watchTime(watch.lastObservedAt);
      if (['stopped', 'completed', 'expired'].indexOf(watch.status) < 0) meta += ' · ' + tr('下次：', 'Next: ') + watchTime(watch.nextCheckAt);
      main.append(el('p', 'ob-market-note ob-market-project-watch-meta', meta));
      if (watch.decision && watch.decision.message) main.append(el('p', 'ob-market-project-watch-decision', watch.decision.message));
      var open = button(tr('打开工程', 'Open project'), function () {
        if (!root.OpenBotProjectWatch || typeof root.OpenBotProjectWatch.openProjectWatch !== 'function') {
          message(tr('工程关注入口暂不可用。', 'The project watch entry is unavailable.'), true); return;
        }
        root.OpenBotProjectWatch.openProjectWatch({ spaceId: scope.spaceId, scopeRevision: scope.scopeRevision, projectId: watch.projectId, watchId: watch.watchId || watch.id });
        close();
      }, 'ob-market-project-watch-open');
      open.dataset.watchOpen = 'true';
      row.append(main, open); return row;
    }
    async function read() {
      if (currentView()) {
        section.replaceChildren(heading);
        stateLabel.textContent = tr('正在读取…', 'Checking…');
        stateLabel.dataset.state = 'loading';
        section.append(heading);
      }
      if (!api || typeof api.projectWatchState !== 'function') { showError(tr('当前宿主版本不支持读取工程关注。', 'This host version cannot read project watches.')); return; }
      var scope = typeof callbacks.getScope === 'function' ? callbacks.getScope() : null;
      if (!scope || !scope.spaceId || scope.scopeRevision === undefined) { showError(tr('当前工作空间不可用。', 'The current workspace is unavailable.')); return; }
      try {
        var reply = await api.projectWatchState({ spaceId: scope.spaceId, scopeRevision: scope.scopeRevision, supervisorBotId: install.botId });
        if (!currentView()) return;
        if (!reply || reply.ok !== true || !reply.value || !Array.isArray(reply.value.watches)) throw new Error(reply && (reply.message || reply.error) || tr('宿主没有返回关注列表。', 'The host returned no watch list.'));
        var all = reply.value.watches.filter(function (watch) { return String(watch.supervisorBotId || '') === String(install.botId); });
        if (!all.length) {
          stateLabel.textContent = tr('没有工程关注', 'No project watches'); stateLabel.dataset.state = 'empty';
          section.append(el('p', 'ob-market-note', tr('此 Supervisor 尚未关注工程。可以从工程页开启同一条关注记录。', 'This Supervisor is not watching a project yet. Start a watch from the project view.')));
          return;
        }
        all.sort(function (a, b) { return Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0); });
        var active = all.filter(function (watch) { return ['stopped', 'completed'].indexOf(watch.status) < 0; });
        var finished = all.filter(function (watch) { return ['stopped', 'completed'].indexOf(watch.status) >= 0; });
        stateLabel.textContent = active.length ? active.length + tr(' 条进行中', ' active') : tr('没有进行中的关注', 'No active watches');
        stateLabel.dataset.state = active.length ? 'active' : 'empty';
        active.forEach(function (watch) { section.append(rowForWatch(watch, scope)); });
        if (finished.length) {
          var details = el('details', 'ob-market-project-watches-history');
          details.append(el('summary', '', tr('已结束的关注', 'Ended watches')));
          finished.forEach(function (watch) { details.append(rowForWatch(watch, scope)); });
          section.append(details);
        }
      } catch (error) { showError(error.message || tr('读取工程关注失败。', 'Could not read project watches.')); }
    }
    projectWatchRefresh = read;
    read();
  }

  function checkKindLabel(check) {
    var kind = check && check.kind || 'file-contains';
    if (kind === 'node-check') return tr('Node 语法检查', 'Node syntax check');
    if (kind === 'node-test') return tr('Node 测试', 'Node tests');
    return tr('文本内容检查', 'Text content check');
  }

  function stageLabel(stage) {
    if (stage === 'worker') return tr('执行阶段', 'worker stage');
    if (stage === 'complete') return tr('完成前', 'before completion');
    return tr('自动验收', 'automatic verification');
  }

  function missionChecks(m) {
    if (m.checkContract && Array.isArray(m.checkContract.checks)) return m.checkContract.checks;
    return Array.isArray(m.checks) ? m.checks : [];
  }

  function shortHash(value) {
    return typeof value === 'string' && value ? value.slice(0, 12) + (value.length > 12 ? '…' : '') : '';
  }

  function fullHash(value) {
    return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value) ? value : shortHash(value);
  }

  function bytesLabel(value) {
    if (!Number.isFinite(value) || value < 0) return '';
    if (value >= 1024 * 1024) return (value / (1024 * 1024)).toFixed(1).replace(/\.0$/, '') + ' MiB';
    if (value >= 1024) return (value / 1024).toFixed(1).replace(/\.0$/, '') + ' KiB';
    return Math.round(value) + ' B';
  }

  function safeEvidenceText(value, m) {
    var text = String(value == null ? '' : value);
    var roots = [m && m.checkContract && m.checkContract.cwd, m && m.cwd,
      m && m.checkContract && m.checkContract.node && m.checkContract.node.path];
    roots.forEach(function (rootPath) {
      if (typeof rootPath === 'string' && rootPath) text = text.split(rootPath).join(tr('执行工作区', 'project workspace'));
    });
    // Node errors may include absolute host paths. Keep the diagnostic text but redact home/temp roots.
    text = text.replace(/(?:file:\/\/)?\/(?:Users|home)\/[^\s"'<>]+/g, tr('本机路径', 'local path'));
    text = text.replace(/(?:file:\/\/)?\/(?:private\/)?(?:tmp|var\/folders)\/[^\s"'<>]+/g, tr('本机临时路径', 'local temporary path'));
    text = text.replace(/[A-Za-z]:\\(?:Users|Documents and Settings)\\[^\s"'<>]+/g, tr('本机路径', 'local path'));
    return text;
  }

  function safeCheckFile(file) {
    if (typeof file !== 'string' || !file || /^(?:\/|[A-Za-z]:[\\/])/.test(file) || file.split(/[\\/]/).some(function (part) { return part === '..'; })) {
      return tr('工作区内文件', 'workspace file');
    }
    return file;
  }

  function verificationState(m, checks) {
    if (!checks.length) return null;
    var verification = m.verification || {};
    var results = Array.isArray(m.checksResult) ? m.checksResult : [];
    if (verification.phase === 'running') {
      if (m.status === 'active') return { state: 'running', text: tr('自动验收进行中 · ', 'Automatic verification running · ') + stageLabel(verification.stage) };
      if (m.status === 'paused') return { state: 'neutral', text: tr('已停止 · 自动验收不会继续或重新派发', 'Stopped · verification will not continue or re-dispatch') };
      return { state: 'attention', text: tr('自动验收已中断 · 等待人工核查', 'Automatic verification interrupted · review needed') };
    }
    if (verification.phase === 'done') {
      var passed = results.filter(function (r) { return r && r.ok === true; }).length;
      var failed = results.filter(function (r) { return r && r.ok === false; }).length;
      var unknown = results.filter(function (r) { return !r || (r.ok !== true && r.ok !== false); }).length;
      var missing = Math.max(0, checks.length - results.length) + unknown;
      var state = failed ? 'attention' : (results.length && passed === checks.length && !missing ? 'done' : 'neutral');
      var record = results.length ? tr(passed + '/' + checks.length + ' 项通过', passed + '/' + checks.length + ' passed') : tr('回执未提供', 'receipt unavailable');
      if (failed) record += tr(' · ' + failed + ' 项未通过', ' · ' + failed + ' failed');
      if (missing) record += tr(' · ' + missing + ' 项无通过回执', ' · ' + missing + ' without a passing receipt');
      return { state: state, text: tr('自动验收已记录 · ', 'Automatic verification recorded · ') + stageLabel(verification.stage) + ' · ' + record };
    }
    if (m.status === 'paused') return { state: 'neutral', text: tr('已停止 · 验收不会继续或重新派发', 'Stopped · verification will not continue or re-dispatch') };
    if (m.status === 'needs_user') return { state: 'attention', text: tr('等待人工处理 · 尚无当前验收回执', 'Needs you · no current verification receipt') };
    if (m.status === 'complete') return { state: 'attention', text: tr('任务已结束 · 没有自动验收回执', 'Mission ended · no automatic verification receipt') };
    return { state: 'neutral', text: tr('等待自动验收 · 每轮及完成前运行', 'Waiting for automatic verification · runs each round and before completion') };
  }

  function countLabel(summary) {
    if (!summary || typeof summary !== 'object') return '';
    var labels = [
      ['tests', tr('测试', 'tests')], ['passed', tr('通过', 'passed')],
      ['failed', tr('失败', 'failed')], ['cancelled', tr('已取消', 'cancelled')],
      ['skipped', tr('跳过', 'skipped')], ['todo', tr('待办', 'todo')],
      ['suites', tr('套件', 'suites')]
    ];
    return labels.filter(function (entry) { return Number.isInteger(summary[entry[0]]); })
      .map(function (entry) { return entry[1] + ' ' + summary[entry[0]]; }).join(' · ');
  }

  function appendCheckScope(box, m, checks) {
    var contract = m.checkContract || {};
    var hasNode = checks.some(function (check) { return check && typeof check.kind === 'string' && check.kind.indexOf('node-') === 0; });
    var hasNodeTest = checks.some(function (check) { return check && check.kind === 'node-test'; });
    var scope = el('div', 'ob-market-check-scope');
    scope.append(el('p', 'ob-market-note', contract.repeat === 'each-round-and-before-completion'
      ? tr('每轮及完成前自动复核。', 'Rechecked each round and before completion.')
      : tr('已配置的工程检查范围：', 'Configured project checks:')));
    var planned = el('ul', 'ob-market-check-list');
    checks.forEach(function (check) {
      var line = checkKindLabel(check) + ' · ' + safeCheckFile(check && check.file);
      if (check && Number.isInteger(check.timeoutMs)) line += ' · ' + tr('限时 ', 'limit ') + Math.round(check.timeoutMs / 1000) + tr(' 秒', ' s');
      planned.append(el('li', '', line));
    });
    scope.append(planned);
    var node = contract.node;
    if (node && typeof node === 'object') {
      var nodeText = tr('Node ', 'Node ') + (node.version || tr('版本未知', 'version unknown'));
      if (node.sha256) nodeText += ' · sha256 ' + fullHash(node.sha256);
      scope.append(el('p', 'ob-market-note', nodeText));
    }
    if (hasNodeTest) scope.append(el('p', 'ob-market-note ob-market-check-policy', tr(
      'Node 测试会执行项目代码，以当前用户权限运行，不处于操作系统沙箱内。',
      'Node tests execute project code with your account permissions, outside an OS sandbox.'
    )));
    scope.append(el('p', 'ob-market-note ob-market-check-policy', tr(
      '关闭 App 后执行暂停；重启后需确认才恢复。主动停止后不会自动重新派发。',
      'Closing the app pauses execution; resuming after restart requires confirmation. Manual stop does not re-dispatch.'
    )));
    if (hasNode) scope.append(el('p', 'ob-market-note ob-market-check-policy', tr(
      '有界工程检查：最多 5,000 个普通文件 / 64 MiB，单文件 8 MiB；仅排除 .git，node_modules 计入，拒绝链接。此范围不代表通用工程验收。',
      'Bounded project checks: up to 5,000 regular files / 64 MiB, 8 MiB per file; only .git is excluded, node_modules counts, and links are rejected. This is not a general engineering acceptance guarantee.'
    )));
    box.append(scope);
  }

  function appendCheckReceipts(box, m, plannedChecks) {
    var results = Array.isArray(m.checksResult) ? m.checksResult : [];
    var verification = m.verification || {};
    var heading = verification.phase === 'running'
      ? tr('最近已保存回执', 'Most recently saved receipts')
      : tr('最近回执', 'Latest receipts');
    box.append(el('h5', 'ob-market-check-heading', heading));
    if (!results.length) {
      box.append(el('p', 'ob-market-note', verification.phase === 'running'
        ? tr('本次自动验收仍在运行，尚无回执；未运行的检查不视为通过。', 'Automatic verification is still running with no receipt yet; checks that have not run are not passes.')
        : tr('尚无验收回执；未运行的检查不视为通过。', 'No verification receipt yet; checks that have not run are not passes.')));
      return;
    }
    results.forEach(function (result) {
      var check = result || {};
      var kind = checkKindLabel(check);
      var state = check.ok === true ? 'pass' : (check.ok === false ? 'fail' : 'unknown');
      var statusText = state === 'pass' ? tr('通过', 'Passed') : (state === 'fail' ? tr('未通过', 'Failed') : tr('结果未知', 'Result unknown'));
      var receipt = el('details', 'ob-market-check-receipt');
      var summary = el('summary');
      summary.append(el('span', 'ob-market-check-result ob-market-check-result-' + state, statusText),
        el('span', 'ob-market-check-name', kind + ' · ' + safeCheckFile(check.file)));
      receipt.append(summary);
      var body = el('div', 'ob-market-check-receipt-body');
      if (check.kind === 'node-check' || check.kind === 'node-test') {
        var exitCode = Number.isInteger(check.exitCode) ? String(check.exitCode) : tr('未返回', 'not returned');
        body.append(el('p', 'ob-market-note', tr('退出码：', 'Exit code: ') + exitCode));
      }
      var tests = countLabel(check.summary);
      if (tests) body.append(el('p', 'ob-market-note', tests));
      if (check.sha256) {
        var artifactHash = el('p', 'ob-market-note ob-market-check-hash-line');
        artifactHash.append(document.createTextNode(tr('产物 sha256：', 'Artifact sha256: ')), el('code', 'ob-market-check-hash', fullHash(check.sha256)));
        body.append(artifactHash);
      }
      if (check.inputs && typeof check.inputs === 'object') {
        var inputs = check.inputs;
        var snapshot = tr('输入快照：', 'Input snapshot: ');
        if (Number.isInteger(inputs.files)) snapshot += inputs.files + tr(' 个文件', ' files');
        if (Number.isFinite(inputs.bytes)) snapshot += (snapshot.endsWith('：') || snapshot.endsWith(':') ? '' : ' · ') + bytesLabel(inputs.bytes);
        var snapshotLine = el('p', 'ob-market-note ob-market-check-hash-line');
        snapshotLine.append(document.createTextNode(snapshot));
        if (inputs.sha256) snapshotLine.append(document.createTextNode(' · sha256 '), el('code', 'ob-market-check-hash', fullHash(inputs.sha256)));
        if (Array.isArray(inputs.excluded) && inputs.excluded.length) snapshotLine.append(document.createTextNode(' · ' + tr('排除 ', 'excluded ') + inputs.excluded.join(', ')));
        body.append(snapshotLine);
      }
      if (check.receiptId) body.append(el('p', 'ob-market-note', tr('回执 ID：', 'Receipt ID: ') + String(check.receiptId).slice(0, 12)));
      var errors = [];
      if (check.error) errors.push(check.error);
      if (Array.isArray(check.errors)) check.errors.forEach(function (error) { if (error) errors.push(error); });
      else if (typeof check.errors === 'string' && check.errors) errors.push(check.errors);
      if (!check.ok && !errors.length) errors.push(tr('失败原因未返回。', 'Failure reason was not returned.'));
      errors.slice(0, 3).forEach(function (error) {
        var message = typeof error === 'string' ? error : (error.message || error.error || '');
        if (message) body.append(el('p', 'ob-market-note ob-market-check-error', safeEvidenceText(message, m)));
      });
      if (errors.length > 3) body.append(el('p', 'ob-market-note', tr('另有 ', 'And ') + (errors.length - 3) + tr(' 条错误详情。', ' more error details.')));
      receipt.append(body); box.append(receipt);
    });
    var missing = Math.max(0, (plannedChecks || []).length - results.length);
    if (missing) box.append(el('p', 'ob-market-note', tr(
      missing + ' 项尚无回执；未运行的检查不视为通过。',
      missing + ' check(s) have no receipt; checks that have not run are not passes.'
    )));
  }

  function missionRow(m) {
    var statusText = {
      active: tr('监督中', 'Supervising'), complete: tr('已验收完成', 'Accepted'), paused: tr('已停止', 'Stopped'),
      needs_user: tr('待人处理', 'Needs you'), unknown: m.status
    }[m.status] || m.status;
    var box = el('div', 'ob-market-mission'); box.dataset.missionId = m.id;
    var head = el('div', 'ob-market-mission-head');
    var badge = el('span', 'ob-market-status ob-market-status-' + m.status, statusText);
    head.append(badge, el('strong', '', tr('第 ', 'Round ') + m.round + '/' + m.maxRounds + tr(' 轮', '')));
    if (m.status === 'active') {
      var stop = button(tr('停止托管', 'Stop supervising'), async function () {
        if (busy) return; busy = true; stop.disabled = true;
        try { await request(api.supervisionStop({ missionId: m.id })); message(tr('已请求停止；已发生的操作仍需核查。', 'Stop requested; completed actions still need review.')); }
        catch (error) { message(error.message, true); }
        busy = false; await reloadStatus(); render();
      }, 'ob-market-stop');
      head.append(stop);
    }
    box.append(head);
    var checksPlan = missionChecks(m);
    var verification = verificationState(m, checksPlan);
    if (verification) {
      var state = el('p', 'ob-market-note ob-market-verification-state', verification.text);
      state.dataset.state = verification.state;
      box.append(state);
    }
    box.append(el('p', 'ob-market-mission-goal', m.objective));
    box.append(el('p', 'ob-market-note', tr('执行者', 'Executor') + '：' + (m.workerBotName || m.workerBotId) + (m.workerAgent ? ' · ' + m.workerAgent : '') +
      (m.workerMissing ? tr('（BOT 已删除）', ' (bot deleted)') : '')));
    var last = (m.history || [])[m.history.length - 1];
    if (last) box.append(el('p', 'ob-market-note', tr('最近判断', 'Latest decision') + '：' + last.action + ' · ' + last.reason));
    if (m.reason) box.append(el('p', 'ob-market-note', safeEvidenceText(m.reason, m)));
    if (checksPlan.length || (Array.isArray(m.checksResult) && m.checksResult.length)) {
      var checks = el('details', 'ob-market-advanced ob-market-checks');
      checks.append(el('summary', '', tr('工程验收范围与回执', 'Project check scope and receipts')));
      if (checksPlan.length) appendCheckScope(checks, m, checksPlan);
      else checks.append(el('p', 'ob-market-note', tr('当前任务没有可显示的检查范围。', 'No check scope is available for this mission.')));
      appendCheckReceipts(checks, m, checksPlan);
      box.append(checks);
    }
    if (m.status === 'needs_user' || m.status === 'paused') {
      var resume = button(tr('打开监督 BOT 处理', 'Open supervisor bot'), function () { close(); callbacks.openBot(m.supervisorBotId); });
      box.append(resume, el('p', 'ob-market-note', tr('重新托管需要你在对话中再次明确授权。', 'Re-hosting requires your explicit authorization again in chat.')));
    }
    return box;
  }

  /* ---------- 市场源 ---------- */
  function renderSources() {
    list.replaceChildren(); detail.replaceChildren();
    var current = sources.find(function (s) { return s.id === selected; }) || sources[0];
    if (current) selected = current.id;
    sources.forEach(function (s) {
      var row = button('', function () { selected = s.id; render(); }); row.className = 'ob-market-row'; row.dataset.marketId = s.id;
      row.setAttribute('aria-current', String(selected === s.id));
      row.append(el('strong', '', s.label), el('span', '', s.builtin ? tr('默认源', 'Default') : tr('自添加', 'Added')));
      list.append(row);
    });
    if (!sources.length) list.append(el('p', 'ob-market-note', tr('没有市场源。', 'No sources.')));
    if (!current) return;
    detail.append(el('h3', '', current.label));
    detail.append(el('p', 'ob-market-note', current.url));
    var st = current.status || { state: 'unread' };
    if (current.enabled === false) detail.append(el('p', '', tr('已停用', 'Disabled')));
    else if (st.state === 'ok') detail.append(el('p', '', tr('正常 · ', 'OK · ') + st.entries + tr(' 条 · 更新于 ', ' entries · updated ') + (st.updatedAt || '')));
    else if (st.state === 'error') detail.append(el('p', 'ob-market-note', tr('读取失败：', 'Failed: ') + st.error));
    else detail.append(el('p', 'ob-market-note', tr('尚未读取；点击“刷新”。', 'Not read yet; click Refresh.')));
    var actions = el('div', 'ob-market-plan-actions');
    if (current.enabled !== false) {
      var refresh = button(tr('刷新', 'Refresh'), async function () {
        if (busy) return; busy = true;
        try { sources = await request(api.marketRefreshSource({ id: current.id })); message(tr('已刷新。', 'Refreshed.')); }
        catch (error) { message(error.message, true); }
        busy = false; render();
      });
      actions.append(refresh);
      var disable = button(tr('停用', 'Disable'), async function () {
        try { sources = await request(api.marketSetSourceEnabled({ id: current.id, enabled: false })); message(tr('已停用；目录不再读取该源。', 'Disabled; its catalog is no longer read.')); }
        catch (error) { message(error.message, true); }
        render();
      });
      actions.append(disable);
    } else {
      var enable = button(tr('启用', 'Enable'), async function () {
        try { sources = await request(api.marketSetSourceEnabled({ id: current.id, enabled: true })); message(tr('已启用。', 'Enabled.')); }
        catch (error) { message(error.message, true); }
        render();
      });
      actions.append(enable);
    }
    if (!current.builtin) {
      var removeBtn = button(tr('移除', 'Remove'), async function () {
        try { sources = await request(api.marketRemoveSource({ id: current.id })); message(tr('已移除该市场源。', 'Source removed.')); selected = ''; }
        catch (error) { message(error.message, true); }
        render();
      });
      actions.append(removeBtn);
    }
    detail.append(actions);
    if (current.builtin) detail.append(el('p', 'ob-market-note', tr('默认源不能移除，只能停用。', 'The default source can be disabled but not removed.')));

    var add = el('form', 'ob-market-addsource');
    var urlInput = el('input'); urlInput.type = 'url'; urlInput.placeholder = 'https://example.com/registry/index.json';
    urlInput.setAttribute('aria-label', tr('市场索引地址', 'Registry index URL')); urlInput.required = true;
    var labelInput = el('input'); labelInput.type = 'text'; labelInput.placeholder = tr('名称（可选）', 'Label (optional)');
    labelInput.setAttribute('aria-label', tr('名称', 'Label'));
    var submit = button(tr('添加市场源…', 'Add source…'), function () { add.dispatchEvent(new Event('submit')); });
    submit.type = 'submit';
    add.append(el('h4', '', tr('添加市场源', 'Add a market source')), urlInput, labelInput, submit);
    add.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (busy) return; busy = true;
      message(tr('正在验证该市场索引…', 'Validating the index…'));
      try {
        sources = await request(api.marketAddSource({ url: urlInput.value.trim(), label: labelInput.value.trim() }));
        message(tr('已添加市场源。', 'Source added.')); urlInput.value = ''; labelInput.value = '';
        await loadAll(false);
      } catch (error) { message(error.message, true); }
      busy = false; render();
    });
    detail.append(add);
  }

  /* ---------- 渲染框架 ---------- */
  function render() {
    if (tab === 'games') {
      if(root.OpenBotGameMarket && api.gameMarketList) root.OpenBotGameMarket.mount({api:api,list:list,detail:detail,search:search,message:message,isActive:function(){return tab==='games'&&dialog.open;}});
      else {list.replaceChildren();detail.replaceChildren();detail.append(el('p','ob-market-note','游戏插件宿主尚未接入。'));}
    }
    else if (tab === 'templates') renderTemplates();

    else if (tab === 'installed') renderInstalled();
    else renderSources();
  }

  async function reloadStatus() {
    var results = await Promise.allSettled([request(api.marketInstallStatus()), request(api.supervisionList())]);
    if (results[0].status === 'fulfilled') installs = results[0].value || [];
    if (results[1].status === 'fulfilled') missions = results[1].value || [];
  }

  function syncTabs() { tabs.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tab === tab)); }); }

  function focusOpener() { if (opener && opener.isConnected) opener.focus(); }

  function init(options) {
    if (dialog) return;
    api = options.bridge; callbacks = options;
    if (api && typeof api.onProjectWatchChanged === 'function') {
      try {
        api.onProjectWatchChanged(function (event) {
          var scope = typeof callbacks.getScope === 'function' ? callbacks.getScope() : null;
          if (!event || !scope || String(event.spaceId || '') !== String(scope.spaceId || '') ||
              !dialog || !dialog.open || tab !== 'installed' || selected !== 'awesome/supervisor' ||
              typeof projectWatchRefresh !== 'function') return;
          projectWatchRefresh();
        });
      } catch (_) { /* The list still refreshes whenever the Supervisor panel is opened. */ }
    }
    dialog = el('dialog', 'ob-market'); dialog.id = 'ob-market';
    dialog.setAttribute('aria-labelledby', 'ob-market-title');
    var header = el('header'); var title = el('h2', '', tr('市场', 'Market')); title.id = 'ob-market-title';
    var headerActions = el('div', 'ob-market-header-actions');
    fleetButton = button(tr('应用与版本管理', 'Apps & versions'), openFleetMarket, 'ob-market-fleet-open');
    fleetButton.id = 'ob-market-fleet-open';
    var closeButton = button(tr('关闭', 'Close'), close);
    headerActions.append(fleetButton, closeButton);
    header.append(title, headerActions);
    tabs = el('nav', 'ob-market-tabs'); tabs.setAttribute('aria-label', tr('市场分区', 'Market sections'));
    [['games', tr('游戏', 'Games')], ['templates', tr('Bot 模板', 'Bot templates')], ['installed', tr('已安装', 'Installed')], ['sources', tr('市场源', 'Sources')]].forEach(function (pair) {
      var b = button(pair[1], function () {
        if (busy || tab === pair[0]) return;
        if(tab==='games' && root.OpenBotGameMarket)root.OpenBotGameMarket.cancelPreview();
        tab = pair[0]; selected = ''; search.value = ''; syncTabs(); render();
      }); b.dataset.tab = pair[0]; tabs.append(b);
    });
    search = el('input'); search.type = 'search'; search.placeholder = tr('搜索市场', 'Search market');
    search.setAttribute('aria-label', tr('搜索市场', 'Search market'));
    search.addEventListener('input', function () { render(); });
    var refresh = button(tr('刷新', 'Refresh'), function () { if (!busy) loadAll(true); }); refresh.id = 'ob-market-refresh';
    var toolbar = el('div', 'ob-market-toolbar'); toolbar.append(tabs, search, refresh);
    var body = el('div', 'ob-market-body');
    list = el('div', 'ob-market-list'); list.setAttribute('aria-label', tr('市场条目', 'Market entries'));
    detail = el('article', 'ob-market-detail');
    body.append(list, detail);
    status = el('p', 'ob-market-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    dialog.append(header, toolbar, body, status);
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
    document.body.append(dialog);
    syncTabs();
    if (api && typeof api.onSupervisionUpdate === 'function') {
      api.onSupervisionUpdate(function () {
        if (!dialog || !dialog.open) return;
        reloadStatus().then(function () { if (dialog.open && tab === 'installed') render(); }).catch(function () {});
      });
    }
  }

  root.OpenBotMarket = {
    init: init,
    open: function (options) {
      opener = options && options.opener || document.activeElement;
      dialog.showModal(); render(); search.focus();
      loadAll(false);
    }
  };
})(window);
