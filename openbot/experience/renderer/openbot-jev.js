(function (root) {
  'use strict';
  var api = root.grokbot, snapshot, target = 'global', dirty = false, profileDirty = false, busy = false;
  var profileEditingId = null, managerId = 'jev';
  var tr = function (zh, en) { return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en) : zh; };
  var el = function (id) { return root.document.getElementById('jev-' + id); };
  var labels = {
    keep: ['建议保留', 'Suggest keeping'], discard: ['无需新增记忆', 'No new memory'], review: ['需复核', 'Review'],
    coding: ['代码任务', 'Coding'], research: ['资料研究', 'Research'], writing: ['文字工作', 'Writing'],
    general: ['普通对话', 'General'], clarify: ['需要澄清', 'Clarify'],
    pass: ['支持通过', 'Supports passing'], fail: ['发现不符', 'Mismatch'], unknown: ['证据不足', 'Insufficient evidence'],
    memory: ['记忆筛选', 'Memory filtering'], routing: ['任务分流', 'Task routing'], quality: ['成果评审', 'Quality review']
  };
  function label(key) { return labels[key] ? tr.apply(null, labels[key]) : key; }
  function listProfiles() {
    var profiles = snapshot && Array.isArray(snapshot.classifiers) ? snapshot.classifiers.slice() : [];
    if (!profiles.some(function (profile) { return profile.id === 'jev'; })) {
      profiles.unshift({ id: 'jev', name: 'JEV', provider: 'typesafe', model: snapshot && snapshot.model || 'jev-1.13.0',
        hasKey: !!(snapshot && snapshot.hasKey), logo: 'assets/classifier-logos/typesafe.png' });
    }
    return profiles;
  }
  function listProviders() {
    if (snapshot && Array.isArray(snapshot.providers)) return snapshot.providers;
    return [
      { id: 'tierflow', name: 'TierFlow / TierSense', protocol: 'tiersense', logo: 'assets/classifier-logos/tierflow.svg',
        endpoint: 'https://tierflow.cn/tiersense/v1', model: 'TierSense', capabilities: ['memory', 'routing'] },
      { id: 'custom', name: 'Custom HTTP', protocol: 'custom', logo: 'assets/agent-logos/generic.svg', endpoint: '', model: '',
        capabilities: ['memory', 'routing', 'quality'] }
    ];
  }
  function findProfile(id) { return listProfiles().find(function (profile) { return profile.id === id; }) || null; }
  function findProvider(id) { return listProviders().find(function (provider) { return provider.id === id; }) || null; }
  function providerName(profile) {
    if (!profile) return '';
    var provider = findProvider(profile.provider);
    if (provider) return provider.name;
    if (profile.provider === 'typesafe') return 'Typesafe';
    return profile.provider || '';
  }
  function profileLogo(profile) {
    if (!profile) return '';
    var provider = findProvider(profile.provider), value = profile.logo || (provider && provider.logo) || '';
    // Logos are bundled renderer files. Do not turn persisted profile text into a remote image request.
    return /^assets\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.(?:png|svg|webp)$/.test(value) && !value.includes('..') ? value : '';
  }
  function classifierIdForTarget() {
    if (!snapshot) return 'jev';
    var settingsObj = snapshot.settings || {}, botsMap = settingsObj.bots || {}, botsList = Array.isArray(snapshot.bots) ? snapshot.bots : [];
    var globalId = settingsObj.classifierId || 'jev';
    if (target === 'global') return el('classifier') && el('classifier').value || globalId;
    var override = botsMap[target];
    if (el('mode') && el('mode').value === 'custom') {
      var bot = botsList.find(function (item) { return item.id === target; });
      return el('classifier') && el('classifier').value || (override && override.classifierId) || (bot && bot.effective && bot.effective.classifierId) || globalId;
    }
    return globalId;
  }
  function savedClassifierIdForTarget() {
    if (!snapshot) return 'jev';
    var settingsObj = snapshot.settings || {}, botsMap = settingsObj.bots || {}, botsList = Array.isArray(snapshot.bots) ? snapshot.bots : [];
    var globalId = settingsObj.classifierId || 'jev';
    if (target === 'global') return globalId;
    var override = botsMap[target];
    var bot = botsList.find(function (item) { return item.id === target; });
    return override && override.mode === 'custom'
      ? override.classifierId || (bot && bot.effective && bot.effective.classifierId) || globalId
      : globalId;
  }
  function effectiveProfile() { return findProfile(classifierIdForTarget()) || findProfile('jev'); }
  function isTierFlow(profile) { return !!profile && profile.provider === 'tierflow'; }
  function supportedFeatures(profile) {
    var provider = profile && findProvider(profile.provider);
    if (provider && Array.isArray(provider.capabilities)) return provider.capabilities;
    if (profile && Array.isArray(profile.capabilities)) return profile.capabilities;
    return ['memory', 'routing', 'quality'];
  }
  function featureLabel(key, profile) {
    if (isTierFlow(profile)) {
      if (key === 'memory') return tr('压缩与召回建议', 'Compression and recall advice');
      if (key === 'routing') return tr('任务难度', 'Task difficulty');
    }
    return label(key) + (key === 'quality' ? tr('（仅记录意见）', ' (record only)') : '');
  }
  function errorMessage(code) {
    var messages = {
      JEV_SETTINGS_CHANGED: ['配置已在别处更改。草稿保留；放弃修改并刷新后重试。', 'Settings changed elsewhere. Your draft is kept; discard and refresh before retrying.'],
      JEV_KEY_REQUIRED: ['此分类器尚未配置所需凭据。', 'This classifier needs credentials before it can be used.'],
      JEV_BUDGET_LIMIT: ['已达调用上限，稍后再试。', 'Request limit reached. Try later.'],
      JEV_AUTH_FAILED: ['密钥验证失败，请检查 API Key。', 'Authentication failed. Check the API key.'],
      JEV_CANCELLED: ['评估已取消或配置已更改。', 'Evaluation cancelled or settings changed.'],
      JEV_STORAGE_INVALID: ['本地配置或记录无法读取，未发送请求。', 'Local settings or records are unavailable. No request sent.'],
      CLASSIFIER_INPUT_INVALID: ['分类器配置无效，请检查名称、地址、模型和阈值。', 'The classifier profile is invalid. Check its name, endpoint, model, and threshold.'],
      CLASSIFIER_NOT_FOUND: ['找不到所选分类器。请刷新后重试。', 'The selected classifier was not found. Refresh and retry.'],
      CLASSIFIER_IN_USE: ['该分类器仍被全局默认或 BOT 使用，不能删除。', 'This classifier is still used by the global default or a BOT and cannot be removed.'],
      CLASSIFIER_BUILTIN: ['内置 JEV 分类器不能编辑或删除。', 'The built-in JEV classifier cannot be edited or removed.'],
      CLASSIFIER_ENDPOINT_INVALID: ['请求地址无效。请使用有效 HTTPS 地址，或本机 HTTP 地址。', 'The endpoint is invalid. Use HTTPS or a localhost HTTP address.'],
      CLASSIFIER_SERVICE_UNAVAILABLE: ['TierSense 未提供此服务。请检查账号权限与套餐状态后重试。', 'TierSense did not provide this service. Check account permissions and plan, then retry.'],
      JEV_RATE_LIMITED: ['服务请求过于频繁，请稍后重试。', 'The service rate limit was reached. Try again later.'],
      JEV_PROBE_FAILED: ['连接检查失败。请检查配置后重试。', 'The connection check failed. Check the profile and retry.'],
      JEV_UNAVAILABLE: ['分类服务暂时不可用。请检查地址后重试。', 'The classifier is unavailable. Check the endpoint and retry.'],
      JEV_TIMEOUT: ['分类服务响应超时。请稍后重试。', 'The classifier timed out. Try again later.'],
      JEV_RESPONSE_INVALID: ['分类器返回的数据格式无法识别。', 'The classifier returned an unsupported response.']
    };
    return messages[code] ? tr.apply(null, messages[code]) : tr('操作未成功，草稿已保留。请检查连接后重试。', 'Operation failed. Your draft is kept. Check the connection and retry.');
  }
  function note(message, error) {
    el('status').textContent = message;
    el('status').setAttribute('role', error ? 'alert' : 'status');
  }
  function profileNote(message, error) {
    el('profile-status').textContent = message;
    el('profile-status').setAttribute('role', error ? 'alert' : 'status');
  }
  function currentFeatures() {
    var profile = effectiveProfile(), supported = supportedFeatures(profile);
    return ['memory', 'routing', 'quality'].filter(function (key) { return supported.includes(key) && el(key).checked; });
  }
  function renderBrand() {
    var profile = effectiveProfile();
    if (!profile) return;
    var logo = el('profile-logo'), source = profileLogo(profile);
    logo.hidden = !source;
    if (source) { logo.src = source; logo.alt = ''; }
    el('profile-name').textContent = profile.name || (profile.id === 'jev' ? 'JEV' : profile.id);
    var meta = [providerName(profile), profile.model || ''].filter(Boolean).join(' · ');
    el('profile-meta').textContent = meta;
    el('model').textContent = profile.id === 'jev' ? snapshot.model : profile.model || '';
    var provider = findProvider(profile.provider);
    el('provider-description').textContent = provider && provider.description
      ? tr(provider.description, provider.descriptionEn || provider.description)
      : (profile.id === 'jev'
      ? tr('内置 JEV 分类器。可在全局默认中管理旧版 API Key。', 'Built-in JEV classifier. Manage its API key in Global defaults.')
      : '');
    var description = profile.provider === 'tierflow'
      ? tr('TierFlow 按当前消息评估任务难度，并提供压缩与召回建议；不会读取完整 Agent 上下文。结果仅供参考。', 'TierFlow evaluates the current message for task difficulty and compression or recall advice. It does not read the full Agent context. Results are advisory.')
      : profile.id === 'jev'
        ? tr('开启后将当前消息及少量相关记忆发送给 Typesafe，提供建议；不会自动改写记忆、派单或通过验收。', 'When enabled, sends the current message and limited relevant memories to Typesafe for advice. It does not edit memory, dispatch tasks, or approve results.')
        : tr('分类器根据当前消息和所选能力提供建议；不会自动改写记忆、派单或通过验收。', 'The classifier advises from the current message and selected capabilities. It does not edit memory, dispatch tasks, or approve results.');
    el('description').textContent = description;
  }
  function renderFeatureLabels() {
    var profile = effectiveProfile(), supported = supportedFeatures(profile), tierFlow = isTierFlow(profile);
    ['memory', 'routing', 'quality'].forEach(function (key) {
      el(key + '-label').textContent = featureLabel(key, profile);
      var allowed = supported.includes(key);
      if (!allowed) el(key).checked = false;
      el(key).disabled = busy || profileDirty || !snapshot || !allowed || (!['global'].includes(target) && el('mode').value !== 'custom');
    });
    el('quality-note').hidden = !tierFlow;
    if (tierFlow) el('quality-note').textContent = tr('TierFlow 不提供成果评审。', 'TierFlow does not provide quality review.');
  }
  function setOptions(select, items, getId, getText, selected) {
    select.replaceChildren();
    items.forEach(function (item) { select.add(new Option(getText(item), getId(item))); });
    if (items.some(function (item) { return getId(item) === selected; })) select.value = selected;
    else if (items.length) select.value = getId(items[0]);
  }
  function renderProfileOptions() {
    var profiles = listProfiles();
    setOptions(el('classifier'), profiles, function (profile) { return profile.id; }, function (profile) {
      return (profile.name || profile.id) + ' · ' + providerName(profile);
    }, classifierIdForTarget());
    setOptions(el('manage-classifier'), profiles, function (profile) { return profile.id; }, function (profile) {
      return (profile.name || profile.id) + ' · ' + providerName(profile);
    }, managerId);
    managerId = el('manage-classifier').value || 'jev';
    setOptions(el('provider'), listProviders(), function (provider) { return provider.id; }, function (provider) { return provider.name; }, el('provider').value);
    updateManagerActions();
  }
  function isProfileInUse(id) {
    if (!snapshot) return false;
    if ((snapshot.settings.classifierId || 'jev') === id) return true;
    var overrides = snapshot.settings.bots || {};
    return Object.keys(overrides).some(function (botId) { return overrides[botId].mode === 'custom' && overrides[botId].classifierId === id; }) ||
      snapshot.bots.some(function (bot) { return bot.effective && bot.effective.classifierId === id; });
  }
  function updateManagerActions() {
    var selected = findProfile(el('manage-classifier').value), blocked = busy || dirty || !snapshot || profileDirty;
    el('profile-edit').disabled = blocked || !selected || selected.id === 'jev' || !api.classifierSave;
    el('profile-delete').disabled = blocked || !selected || selected.id === 'jev' || isProfileInUse(selected.id) || !api.classifierRemove;
    el('profile-new').disabled = blocked || !api.classifierSave;
    if (!selected) el('manager-note').textContent = tr('暂无已保存分类器。', 'No saved classifiers.');
    else if (selected.id === 'jev') el('manager-note').textContent = tr('内置 JEV 保留固定模型；仅可在全局默认中设置其 API Key。', 'The built-in JEV profile keeps its pinned model; only its API key can be changed in Global defaults.');
    else if (isProfileInUse(selected.id)) el('manager-note').textContent = tr('当前分类器正在使用，需先切换全局默认或 BOT 设置才能删除。', 'This profile is in use. Change the global default or BOT settings before removing it.');
    else el('manager-note').textContent = tr('编辑只影响此分类器配置；正在使用的设置需单独选择。', 'Editing changes this profile only. Select it separately in the settings above to use it.');
  }
  function updateProfileProviderFields() {
    var provider = findProvider(el('provider').value), tierFlow = provider && provider.id === 'tierflow';
    el('endpoint').disabled = busy || tierFlow;
    el('profile-model').disabled = busy || tierFlow;
    el('instructions').disabled = busy || tierFlow;
    el('threshold').disabled = busy || tierFlow;
    el('endpoint-note').textContent = tierFlow ? tr('TierFlow 使用固定服务地址。', 'TierFlow uses its fixed service endpoint.') : '';
    el('profile-provider-note').textContent = provider && provider.description
      ? tr(provider.description, provider.descriptionEn || provider.description) : '';
    el('tierflow-options-note').hidden = !tierFlow;
    if (tierFlow) el('tierflow-options-note').textContent = tr('阈值与指令由 TierFlow 服务定义，无需设置。', 'TierFlow defines thresholds and instructions; no local settings are needed.');
  }
  function setEditorVisible(visible) {
    el('profile-form').hidden = !visible;
    if (visible) el('manage').open = true;
  }
  function startNewProfile() {
    if (busy || dirty || profileDirty) return;
    profileEditingId = null; profileDirty = true;
    var firstProvider = listProviders()[0];
    setOptions(el('provider'), listProviders(), function (provider) { return provider.id; }, function (provider) { return provider.name; }, firstProvider && firstProvider.id);
    el('profile-name-input').value = '';
    el('endpoint').value = firstProvider && firstProvider.endpoint || '';
    el('profile-model').value = firstProvider && firstProvider.model || '';
    el('instructions').value = '';
    el('threshold').value = '0.7';
    el('profile-key').value = ''; el('profile-clear-key').checked = false;
    el('profile-title').textContent = tr('新建分类器', 'New classifier');
    profileNote(''); setEditorVisible(true); updateProfileProviderFields(); updateControls();
  }
  function startEditProfile() {
    if (busy || dirty || profileDirty) return;
    var profile = findProfile(el('manage-classifier').value);
    if (!profile || profile.id === 'jev') { profileNote(errorMessage('CLASSIFIER_BUILTIN'), true); return; }
    profileEditingId = profile.id; profileDirty = false;
    setOptions(el('provider'), listProviders(), function (provider) { return provider.id; }, function (provider) { return provider.name; }, profile.provider);
    el('profile-name-input').value = profile.name || '';
    el('endpoint').value = profile.endpoint || '';
    el('profile-model').value = profile.model || '';
    el('instructions').value = profile.instructions || '';
    el('threshold').value = String(Number.isFinite(profile.threshold) ? profile.threshold : 0.7);
    el('profile-key').value = ''; el('profile-clear-key').checked = false;
    el('profile-key-note').textContent = profile.hasKey
      ? tr('已保存 API Key；留空保留。更改地址或供应商会清除旧密钥。', 'API key saved; leave blank to keep it. Changing the provider or endpoint clears it.')
      : tr('未保存 API Key。此服务可留空。', 'No API key saved. This service may work without one.');
    el('profile-title').textContent = tr('编辑分类器', 'Edit classifier');
    profileNote(''); setEditorVisible(true); updateProfileProviderFields(); updateControls();
  }
  function clearEditor() {
    profileDirty = false; profileEditingId = null; setEditorVisible(false); profileNote(''); updateControls();
  }
  function renderAdvice(receipt) {
    var advice = receipt.advice || {}, provider = receipt.provider || '', parts = [];
    if (provider === 'tierflow') {
      var memory = advice.memory;
      if (memory) {
        ['compression', 'recall'].forEach(function (kind) {
          var decision = memory[kind];
          if (!decision || typeof decision.predicted !== 'boolean') return;
          var name = kind === 'compression' ? tr('压缩建议', 'Compression') : tr('召回建议', 'Recall');
          var part = name + '：' + (decision.predicted ? tr('是', 'Yes') : tr('否', 'No'));
          if (Number.isFinite(decision.confidence)) part += ' · ' + tr('投票一致度 ', 'Vote agreement ') + Math.round(decision.confidence * 100) + '%';
          parts.push(part);
        });
      }
      var routing = advice.routing;
      if (routing && Number.isFinite(routing.score)) parts.push(tr('任务难度 ', 'Task difficulty ') + routing.score.toFixed(1) + '/10');
    } else {
      Object.keys(advice).forEach(function (key) {
        var value = advice[key];
        if (!value || typeof value !== 'object') return;
        var text = label(key) + '：' + label(value.recommendation || value.choice || 'unknown');
        if (Number.isFinite(value.confidence)) text += ' (' + Math.round(value.confidence * 100) + '%)';
        parts.push(text);
      });
    }
    return parts.length ? parts.join(' · ') : tr('没有可显示的建议。', 'No advice to display.');
  }
  function renderRecords() {
    if (!snapshot || !Array.isArray(snapshot.recent)) return;
    var container = el('records'); container.replaceChildren();
    var records = snapshot.recent.filter(function (receipt) { return target === 'global' || receipt.botId === target; });
    el('empty').hidden = records.length > 0;
    records.forEach(function (receipt) {
      var row = root.document.createElement('li'), heading = root.document.createElement('p');
      var bot = snapshot.bots.find(function (item) { return item.id === receipt.botId; });
      heading.textContent = (bot ? bot.name : tr('已移除 BOT', 'Removed BOT')) + ' · ' + new Date(receipt.createdAt).toLocaleString();
      row.appendChild(heading);
      var body = root.document.createElement('p');
      body.textContent = receipt.ok ? renderAdvice(receipt) : errorMessage(receipt.code);
      row.appendChild(body);
      var meta = root.document.createElement('p'); meta.className = 'jev-muted';
      var savedProfile = findProfile(receipt.classifierId);
      var provider = receipt.provider === 'typesafe' ? 'Typesafe' : (findProvider(receipt.provider) || {}).name || receipt.provider || '';
      var identity = [receipt.classifierName || (savedProfile && savedProfile.name), provider, receipt.model].filter(Boolean).join(' · ');
      var usage = receipt.usage && Number.isFinite(receipt.usage.inputTokens) ? receipt.usage.inputTokens + ' input tokens' : '';
      if (receipt.usage && Number.isFinite(receipt.usage.outputTokens)) usage += (usage ? ' · ' : '') + receipt.usage.outputTokens + ' output tokens';
      var knownCost = typeof receipt.estimatedCostUsd === 'number' && Number.isFinite(receipt.estimatedCostUsd);
      var cost = knownCost ? '≈ $' + receipt.estimatedCostUsd.toFixed(8) : tr('费用未知', 'Cost unknown');
      var accounting = usage ? [usage, cost].join(' · ') : knownCost
        ? tr('用量未知', 'Usage unknown') + ' · ' + cost
        : tr('用量与费用未知', 'Usage and cost unknown');
      var measure = [(Number.isFinite(receipt.latencyMs) ? receipt.latencyMs : 0) + ' ms', accounting].filter(Boolean);
      meta.textContent = [identity, measure.join(' · ')].filter(Boolean).join(' · ');
      row.appendChild(meta); container.appendChild(row);
    });
  }
  function fill() {
    if (!snapshot) return;
    renderProfileOptions();
    var override = target === 'global' ? null : snapshot.settings.bots[target];
    var config = override && override.mode === 'custom' ? override.features : snapshot.settings.features;
    el('enabled').checked = snapshot.settings.enabled;
    if (target !== 'global') el('mode').value = override ? override.mode : 'inherit';
    var scopedBot = target === 'global' ? null : snapshot.bots.find(function (bot) { return bot.id === target; });
    var selected = target === 'global' ? snapshot.settings.classifierId || 'jev'
      : override && override.mode === 'custom' ? override.classifierId || (scopedBot && scopedBot.effective && scopedBot.effective.classifierId) || snapshot.settings.classifierId || 'jev'
        : snapshot.settings.classifierId || 'jev';
    el('classifier').value = findProfile(selected) ? selected : 'jev';
    ['memory', 'routing', 'quality'].forEach(function (key) { el(key).checked = !!config[key]; });
    el('key').value = ''; el('clear-key').checked = false;
    el('key-note').textContent = snapshot.hasKey ? tr('已保存密钥；留空保留。', 'Key saved; leave blank to keep it.') : tr('尚未配置密钥。', 'No API key configured.');
    dirty = false; updateControls(); renderBrand(); renderFeatureLabels(); renderRecords();
  }
  function updateControls() {
    if (!snapshot) return;
    var global = target === 'global', profile = effectiveProfile(), mode = global || el('mode').value === 'custom';
    el('global-fields').hidden = !global; el('bot-fields').hidden = global;
    el('credential-fields').hidden = !global || !profile || profile.id !== 'jev'; el('preview').hidden = global;
    el('classifier-fields').hidden = !mode;
    // Keep the target selector reachable while a settings draft is dirty; its change handler rejects and reverts the switch.
    el('scope').disabled = busy;
    el('form').querySelectorAll('input, select, button').forEach(function (field) {
      field.disabled = busy || profileDirty || !snapshot;
    });
    el('profile-form').querySelectorAll('input, select, textarea, button').forEach(function (field) {
      field.disabled = busy;
    });
    el('save').disabled = busy || profileDirty || !dirty;
    el('discard').hidden = !dirty; el('discard').disabled = busy || profileDirty;
    el('probe').disabled = busy || dirty || profileDirty || !snapshot || (profile && (profile.id === 'jev' ? !snapshot.hasKey : profile.provider !== 'custom' && !profile.hasKey));
    el('refresh').disabled = busy || dirty || profileDirty;
    el('try').disabled = busy || dirty || profileDirty || !snapshot;
    el('clear').disabled = busy || !snapshot;
    renderFeatureLabels();
    renderBrand();
    updateProfileProviderFields();
    updateManagerActions();
  }
  async function refresh() {
    if (busy || dirty || profileDirty) return;
    busy = true; updateControls();
    try {
      var result = await api.jevStatus(); if (!result.ok) throw result;
      snapshot = result;
      var select = el('scope'); select.replaceChildren(new Option(tr('全局默认', 'Global defaults'), 'global'));
      result.bots.forEach(function (bot) { select.add(new Option(bot.name, bot.id)); });
      if (target !== 'global' && !result.bots.some(function (bot) { return bot.id === target; })) target = 'global';
      select.value = target; fill();
    } catch (error) { note(errorMessage(error.code), true); }
    finally { busy = false; updateControls(); }
  }
  async function save(event) {
    event.preventDefault(); if (busy || !snapshot || !dirty || profileDirty) return;
    var selectedProfile = effectiveProfile();
    var input = { revision: snapshot.settings.revision, target: target,
      features: Object.fromEntries(['memory', 'routing', 'quality'].map(function (key) {
        return [key, supportedFeatures(selectedProfile).includes(key) && el(key).checked];
      })) };
    if (target === 'global') {
      Object.assign(input, { enabled: el('enabled').checked, classifierId: classifierIdForTarget() });
      if (selectedProfile && selectedProfile.id === 'jev') Object.assign(input, { apiKey: el('key').value, clearKey: el('clear-key').checked });
    }
    else {
      input.mode = el('mode').value;
      if (input.mode === 'custom') input.classifierId = classifierIdForTarget();
    }
    busy = true; updateControls();
    try {
      var result = await api.jevSave(input); if (!result.ok) throw result;
      snapshot = result; fill(); note(tr('已保存。', 'Saved.'));
    } catch (error) { note(errorMessage(error.code), true); }
    finally { busy = false; updateControls(); }
  }
  async function saveProfile(event) {
    event.preventDefault(); if (busy || !snapshot || !profileDirty || dirty) return;
    var beforeIds = new Set(listProfiles().map(function (profile) { return profile.id; }));
    var provider = findProvider(el('provider').value);
    if (!provider) { profileNote(errorMessage('CLASSIFIER_INPUT_INVALID'), true); return; }
    var tierFlow = provider.id === 'tierflow';
    var input = { revision: snapshot.settings.revision, name: el('profile-name-input').value.trim(), provider: provider.id,
      endpoint: tierFlow ? provider.endpoint : el('endpoint').value.trim(), model: tierFlow ? provider.model : el('profile-model').value.trim(),
      instructions: tierFlow ? '' : el('instructions').value, threshold: tierFlow ? 0.7 : Number(el('threshold').value),
      apiKey: el('profile-key').value, clearKey: el('profile-clear-key').checked };
    if (profileEditingId) input.id = profileEditingId;
    busy = true; updateControls();
    try {
      var result = await api.classifierSave(input); if (!result.ok) throw result;
      snapshot = result;
      var created = profileEditingId || (result.classifiers || []).find(function (item) { return !beforeIds.has(item.id); })?.id;
      managerId = created || 'jev'; profileDirty = false; profileEditingId = null;
      setEditorVisible(false); fill(); profileNote(tr('分类器已保存。', 'Classifier saved.'));
    } catch (error) { profileNote(errorMessage(error.code), true); }
    finally { busy = false; updateControls(); }
  }
  async function removeProfile() {
    if (busy || dirty || profileDirty || !snapshot) return;
    var profile = findProfile(el('manage-classifier').value);
    if (!profile || profile.id === 'jev' || isProfileInUse(profile.id)) { updateManagerActions(); return; }
    if (!root.confirm(tr('删除分类器“', 'Remove classifier “') + profile.name + tr('”？此操作无法撤销。', '”? This cannot be undone.'))) return;
    busy = true; updateControls();
    try {
      var result = await api.classifierRemove({ revision: snapshot.settings.revision, id: profile.id }); if (!result.ok) throw result;
      snapshot = result; managerId = 'jev'; fill(); profileNote(tr('分类器已删除。', 'Classifier removed.'));
    } catch (error) { profileNote(errorMessage(error.code), true); }
    finally { busy = false; updateControls(); }
  }
  async function action(kind) {
    if (busy || dirty || profileDirty) return;
    busy = true; updateControls(); note(tr('正在处理…', 'Working…'));
    try {
      var classifierId = savedClassifierIdForTarget();
      var result = kind === 'probe' ? await api.jevProbe({ classifierId: classifierId }) : kind === 'clear' ? await api.jevClear()
        : await api.jevAdvise({ botId: target, text: el('text').value, features: currentFeatures() });
      if (!result.ok) throw result;
      if (kind === 'clear') { snapshot = result; renderRecords(); note(tr('已清除建议记录。', 'Advice records cleared.')); }
      else if (result.skipped) note(tr('此 BOT 未启用所选能力。', 'The selected capabilities are disabled for this BOT.'));
      else note(kind === 'probe' ? tr('连接成功：', 'Connected: ') + providerName(findProfile(classifierId)) + ' · ' + result.model + ' · ' + result.latencyMs + ' ms'
        : tr('建议已记录；不会自动修改记忆、派发任务或验收。', 'Advice recorded; it will not edit memory, dispatch tasks, or approve results.'));
    } catch (error) { note(errorMessage(error.code), true); }
    finally {
      try { var status = await api.jevStatus(); if (status.ok) { snapshot = status; renderRecords(); renderBrand(); } } catch (_) {}
      busy = false; updateControls();
    }
  }
  function init() {
    var section = el('settings'); if (!section) return;
    if (!api || !api.jevStatus) { section.dataset.appsUnavailable = 'true'; section.hidden = true; return; }
    delete section.dataset.appsUnavailable;
    var navigation = root.document.querySelector('#set-panel-apps .apps-pathways');
    if (navigation) {
      var link = root.document.createElement('a'); link.id = 'apps-path-jev'; link.href = '#jev-settings';
      link.textContent = tr('分类器辅助判断', 'Classifier assistance');
      link.addEventListener('click', function (event) {
        event.preventDefault();
        if (root.OpenBotDialogs && typeof root.OpenBotDialogs.settings === 'function') root.OpenBotDialogs.settings('plugins');
        section.scrollIntoView({ block: 'start' }); section.tabIndex = -1; section.focus({ preventScroll: true });
      });
      navigation.appendChild(link);
    }
    function field(id, zh, en, body) { return '<label for="jev-' + id + '"><span>' + tr(zh, en) + '</span>' + body + '</label>'; }
    section.innerHTML = '<h3 id="jev-title">' + tr('分类器辅助判断', 'Classifier assistance') + '</h3>' +
      '<p id="jev-description">' + tr('选择分类器后可查看其评估范围。结果仅供参考，不会自动改写记忆、派发任务或通过验收。', 'Choose a classifier to see its assessment scope. Results are advisory; they do not edit memory, dispatch tasks, or approve work.') + '</p>' +
      '<div class="jev-heading-actions">' + field('scope', '配置对象', 'Settings for', '<select id="jev-scope"><option value="global">' + tr('全局默认', 'Global defaults') + '</option></select>') +
      '<button type="button" class="btn" id="jev-refresh">' + tr('刷新', 'Refresh') + '</button></div>' +
      '<form id="jev-form"><div id="jev-global-fields"><label class="jev-check"><input type="checkbox" id="jev-enabled"><span>' + tr('默认启用辅助判断', 'Enable assistance by default') + '</span></label></div>' +
      '<div id="jev-bot-fields" hidden>' + field('mode', '此 BOT 的设置', 'This BOT', '<select id="jev-mode"><option value="inherit">' + tr('继承全局默认', 'Inherit global defaults') + '</option><option value="off">' + tr('关闭', 'Off') + '</option><option value="custom">' + tr('单独启用并配置', 'Enable with custom settings') + '</option></select>') + '</div>' +
      '<div id="jev-classifier-fields">' + field('classifier', '使用分类器', 'Classifier', '<select id="jev-classifier"></select>') + '</div>' +
      '<div class="jev-profile-brand" id="jev-profile-brand"><img id="jev-profile-logo" alt="" hidden><div><strong id="jev-profile-name"></strong><p class="jev-muted" id="jev-profile-meta"></p></div></div>' +
      '<p class="jev-muted" id="jev-provider-description"></p>' +
      '<fieldset><legend>' + tr('辅助能力', 'Capabilities') + '</legend>' + ['memory', 'routing', 'quality'].map(function (key) {
        return '<label class="jev-check"><input type="checkbox" id="jev-' + key + '"><span id="jev-' + key + '-label"></span></label>';
      }).join('') + '<p class="jev-muted" id="jev-quality-note" hidden></p></fieldset><div id="jev-credential-fields">' +
      field('key', 'JEV API Key', 'JEV API key', '<input type="password" id="jev-key" autocomplete="new-password" spellcheck="false" maxlength="512"><span class="jev-muted" id="jev-key-note"></span>') +
      '<label class="jev-check"><input type="checkbox" id="jev-clear-key"><span>' + tr('移除已保存的 JEV 密钥', 'Remove saved JEV key') + '</span></label></div>' +
      '<p class="jev-muted">' + tr('当前模型：', 'Current model: ') + '<code id="jev-model"></code></p>' +
      '<div class="jev-actions"><button type="submit" class="btn primary" id="jev-save">' + tr('保存', 'Save') + '</button><button type="button" class="btn" id="jev-discard" hidden>' + tr('放弃修改', 'Discard edits') + '</button><button type="button" class="btn" id="jev-probe">' + tr('检查连接', 'Check connection') + '</button></div></form>' +
      '<p id="jev-status" role="status" aria-live="polite"></p>' +
      '<details id="jev-manage"><summary>' + tr('管理分类器', 'Manage classifiers') + '</summary><p class="jev-muted" id="jev-manager-note"></p>' +
      '<div class="jev-profile-controls">' + field('manage-classifier', '已保存分类器', 'Saved classifiers', '<select id="jev-manage-classifier"></select>') +
      '<button type="button" class="btn" id="jev-profile-new">' + tr('新建', 'New') + '</button><button type="button" class="btn" id="jev-profile-edit">' + tr('编辑', 'Edit') + '</button><button type="button" class="btn" id="jev-profile-delete">' + tr('删除', 'Remove') + '</button></div>' +
      '<form id="jev-profile-form" hidden><p id="jev-profile-title"></p>' +
      field('profile-name-input', '名称', 'Name', '<input type="text" id="jev-profile-name-input" maxlength="100" autocomplete="off">') +
      field('provider', '供应商', 'Provider', '<select id="jev-provider"></select>') +
      '<p class="jev-muted" id="jev-profile-provider-note"></p>' +
      field('endpoint', '请求地址', 'Request endpoint', '<input type="url" id="jev-endpoint" maxlength="2048" autocomplete="url"><span class="jev-muted" id="jev-endpoint-note"></span>') +
      field('profile-model', '模型', 'Model', '<input type="text" id="jev-profile-model" maxlength="200" autocomplete="off">') +
      field('profile-key', 'API Key（可选）', 'API key (optional)', '<input type="password" id="jev-profile-key" autocomplete="new-password" spellcheck="false" maxlength="512"><span class="jev-muted" id="jev-profile-key-note">' + tr('密钥仅保存在本机配置中；留空保留已有密钥。', 'Keys stay in local settings; leave blank to keep the saved key.') + '</span>') +
      '<label class="jev-check"><input type="checkbox" id="jev-profile-clear-key"><span>' + tr('移除此分类器的密钥', 'Remove this classifier’s key') + '</span></label>' +
      '<div id="jev-tierflow-options-note" class="jev-provider-note" hidden></div>' +
      field('threshold', '判断阈值', 'Decision threshold', '<input type="number" id="jev-threshold" min="0" max="1" step="0.01" value="0.7">') +
      field('instructions', '分类器指令', 'Classifier instructions', '<textarea id="jev-instructions" rows="3" maxlength="4000"></textarea>') +
      '<div class="jev-actions"><button type="submit" class="btn primary" id="jev-profile-save">' + tr('保存分类器', 'Save classifier') + '</button><button type="button" class="btn" id="jev-profile-discard">' + tr('取消', 'Cancel') + '</button></div><p id="jev-profile-status" role="status" aria-live="polite"></p></form></details>' +
      '<details id="jev-preview" hidden><summary>' + tr('试评一条消息', 'Try a message') + '</summary>' + field('text', '消息内容', 'Message', '<textarea id="jev-text" rows="3" maxlength="6000"></textarea>') +
      '<button type="button" class="btn" id="jev-try">' + tr('获取建议', 'Get advice') + '</button></details>' +
      '<details><summary>' + tr('最近建议', 'Recent advice') + '</summary><p class="jev-muted">' + tr('TierFlow 的难度分是 0–10；投票一致度不是概率。其他分类器的置信度按返回值展示。每小时最多 60 次调用，最多保留 100 条记录。', 'TierFlow difficulty is scored from 0 to 10; vote agreement is not a probability. Other classifiers show their returned confidence. Up to 60 calls per hour; stores at most 100 records.') + '</p><p id="jev-empty">' + tr('暂无建议记录。', 'No advice recorded.') + '</p><ul id="jev-records"></ul><button type="button" class="btn" id="jev-clear">' + tr('清除记录', 'Clear records') + '</button></details>';
    el('scope').addEventListener('change', function () {
      if (dirty || profileDirty) { el('scope').value = target; note(tr('请先保存或放弃当前修改。', 'Save or discard the current edits first.'), true); return; }
      target = el('scope').value; el('text').value = ''; fill(); note('');
    });
    el('classifier').addEventListener('change', function () { dirty = true; if (isTierFlow(effectiveProfile())) el('quality').checked = false; updateControls(); });
    el('mode').addEventListener('change', function () { dirty = true; updateControls(); });
    el('form').addEventListener('input', function () { dirty = true; updateControls(); });
    el('form').addEventListener('change', function () { dirty = true; updateControls(); });
    el('form').addEventListener('submit', save);
    el('discard').addEventListener('click', function () { dirty = false; note(''); refresh(); });
    el('refresh').addEventListener('click', refresh);
    ['probe', 'clear', 'try'].forEach(function (key) { el(key).addEventListener('click', function () { action(key); }); });
    el('manage-classifier').addEventListener('change', function () {
      if (profileDirty) { el('manage-classifier').value = managerId; profileNote(tr('请先保存或取消当前编辑。', 'Save or cancel the current profile edit first.'), true); return; }
      managerId = el('manage-classifier').value; updateManagerActions(); profileNote('');
    });
    el('profile-new').addEventListener('click', startNewProfile);
    el('profile-edit').addEventListener('click', startEditProfile);
    el('profile-delete').addEventListener('click', removeProfile);
    el('provider').addEventListener('change', function () {
      var provider = findProvider(el('provider').value);
      if (provider) {
        el('endpoint').value = provider.endpoint || ''; el('profile-model').value = provider.model || '';
        el('profile-key').value = ''; el('profile-clear-key').checked = false;
      }
      profileDirty = true; updateProfileProviderFields(); updateControls();
    });
    el('profile-form').addEventListener('input', function () { profileDirty = true; updateControls(); });
    el('profile-form').addEventListener('change', function () { profileDirty = true; updateControls(); });
    el('profile-form').addEventListener('submit', saveProfile);
    el('profile-discard').addEventListener('click', clearEditor);
    var panel = root.document.getElementById('set-panel-apps');
    var observer = new MutationObserver(function () { if (!panel.hidden && !section.hidden && !dirty && !profileDirty) refresh(); });
    observer.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    observer.observe(section, { attributes: true, attributeFilter: ['hidden'] });
    refresh();
  }
  Promise.resolve(root.OpenBotI18n && root.OpenBotI18n.ready).then(function () {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  });
})(window);
