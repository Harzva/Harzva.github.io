/* global grokbot */
(function(){
  'use strict';
  function tr(zh,en){var i18n=typeof window==='object'?window.OpenBotI18n:null;return i18n?i18n.t(zh,en):zh;}
  function countLabel(value,zh,one,many){
    var english=typeof window==='object'&&window.OpenBotI18n&&window.OpenBotI18n.locale==='en';
    return english?new Intl.NumberFormat('en').format(Number(value))+' '+(Number(value)===1?one:(many||one+'s')):value+zh;
  }

  var state = {
    bridge: null,
    onState: null,
    onOpenBot: null,
    onClose: null,
    esc: null,
    root: null,
    bound: false,
    initialized: false,
    open: false,
    busy: false,
    requestId: 0,
    snapshot: null,
    drafts: Object.create(null),
    focusBefore: null
  };

  function query(selector, context){
    return (context || document).querySelector(selector);
  }

  function queryAll(selector, context){
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function own(object, key){
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function text(value, fallback){
    if (value == null || value === '') return fallback || '';
    return String(value);
  }

  function list(value){
    if (!Array.isArray(value)) return [];
    return value.map(function(item){ return text(item).trim(); }).filter(Boolean);
  }

  function finiteNumber(value){
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && isFinite(Number(value))) return Number(value);
    return null;
  }

  function formatDate(value){
    if (value == null || value === '') return '';
    var date = new Date(value);
    if (!isNaN(date.getTime())) {
      try { return date.toLocaleString(window.OpenBotI18n ? window.OpenBotI18n.locale : 'zh-CN', { hour12:false }); } catch (_) { return date.toISOString(); }
    }
    return String(value);
  }

  function formatPercent(value){
    var number = finiteNumber(value);
    if (number == null) return tr('未知',"Unknown");
    return Math.max(0, Math.min(100, number)) + '%';
  }

  function normalizedStatus(value){
    return String(value == null ? '' : value).trim().toLowerCase();
  }

  function errorFrom(value, fallback){
    if (value instanceof Error) return value;
    var message = value && value.message ? value.message : (fallback || tr('智能体工作空间暂时不可用',"Local agents unavailable"));
    var error = new Error(String(message));
    if (value && value.code) error.code = value.code;
    return error;
  }

  function callBridge(method, payload){
    var bridge = state.bridge || window.grokbot;
    if (!bridge || typeof bridge[method] !== 'function') {
      var unavailable = new Error(tr('桌面版尚未提供 ',"The desktop app does not provide the ") + method + tr(' 接口'," API"));
      unavailable.code = 'MISSING_BRIDGE_METHOD';
      return Promise.reject(unavailable);
    }
    try {
      return Promise.resolve(bridge[method](payload || {})).then(function(result){
        if (!result || result.ok === false) {
          var rejected = errorFrom(result, tr('智能体工作空间请求未完成',"Local agent request did not complete"));
          if (result && result.code) rejected.code = result.code;
          throw rejected;
        }
        return result;
      });
    } catch (error) {
      return Promise.reject(errorFrom(error));
    }
  }

  function notifyParent(snapshot){
    if (typeof state.onState !== 'function') return;
    try { state.onState(snapshot); } catch (error) { console.warn('[agent-workspace] onState failed', error); }
  }

  function setStatus(message, tone){
    var status = query('#aw-status', state.root);
    if (!status) return;
    status.textContent = message || '';
    if (tone) status.setAttribute('data-tone', tone); else status.removeAttribute('data-tone');
  }

  function setBusy(busy){
    state.busy = !!busy;
    if (!state.root) return;
    if (state.busy) state.root.setAttribute('aria-busy', 'true');
    else state.root.removeAttribute('aria-busy');

    var onboard = query('#aw-onboard', state.root);
    var refresh = query('#aw-refresh', state.root);
    if (onboard) onboard.disabled = state.busy || onboard.getAttribute('data-no-agents') === 'true';
    if (refresh) refresh.disabled = state.busy;

    queryAll('button:not([data-aw-close]), select, textarea', state.root).forEach(function(control){
      if (control === onboard || control === refresh) return;
      if (state.busy) {
        // Requests can overlap (for example a refresh followed immediately by
        // closing and reopening the dialog). Preserve the original disabled
        // state only once; overwriting it on every setBusy(true) call would
        // turn a temporarily disabled control into a permanently disabled one.
        if (!control.hasAttribute('data-aw-busy-disabled')) {
          control.setAttribute('data-aw-busy-disabled', control.disabled ? 'true' : 'false');
        }
        control.disabled = true;
      } else {
        var previous = control.getAttribute('data-aw-busy-disabled');
        if (previous != null) {
          control.disabled = previous === 'true';
          control.removeAttribute('data-aw-busy-disabled');
        }
      }
    });
  }

  function setLoading(loading){
    var loadingNode = query('#aw-loading', state.root);
    if (loadingNode) loadingNode.hidden = !loading;
    if (loading && !state.snapshot) {
      var empty = query('#aw-empty', state.root);
      var listNode = query('#aw-agent-list', state.root);
      var missing = query('#aw-missing', state.root);
      if (empty) empty.hidden = true;
      if (listNode) listNode.hidden = true;
      if (missing) missing.hidden = true;
    }
  }

  function setError(error){
    var errorNode = query('#aw-error', state.root);
    var messageNode = query('#aw-error-message', state.root);
    if (!errorNode) return;
    var message = error && error.message ? error.message : tr('请稍后重试',"Try again later");
    if (messageNode) messageNode.textContent = message;
    errorNode.hidden = false;
    setLoading(false);
    if (!state.snapshot) {
      var empty = query('#aw-empty', state.root);
      var listNode = query('#aw-agent-list', state.root);
      var missing = query('#aw-missing', state.root);
      if (empty) empty.hidden = true;
      if (listNode) listNode.hidden = true;
      if (missing) missing.hidden = true;
    }
  }

  function clearError(){
    var errorNode = query('#aw-error', state.root);
    if (errorNode) errorNode.hidden = true;
  }

  function agentFor(bot, agents){
    var id = bot && bot.agentId != null ? String(bot.agentId) : '';
    return agents.filter(function(agent){ return agent && String(agent.id) === id; })[0] || null;
  }

  function isInstalled(bot, agent){
    if (!bot || bot.installed !== true) return false;
    if (agent && agent.installed === false) return false;
    return true;
  }

  function draftFor(bot){
    var id = bot && bot.id != null ? String(bot.id) : '';
    var canonical = {
      model: bot && bot.model != null ? String(bot.model) : '',
      reasoningEffort: bot && bot.reasoningEffort != null ? String(bot.reasoningEffort) : '',
      specialties: list(bot && bot.specialties)
    };
    var existing = id ? state.drafts[id] : null;
    if (!existing) {
      return { model:canonical.model, reasoningEffort:canonical.reasoningEffort,
        specialties:canonical.specialties.slice(), baseline:canonical,
        dirty:{ model:false, reasoningEffort:false, specialties:false } };
    }
    // A refresh may replace the authoritative value while the user is editing
    // another field. Adopt every clean field from the new snapshot and retain
    // only the values that are genuinely unsaved.
    existing.baseline = existing.baseline || {};
    existing.dirty = existing.dirty || {};
    ['model', 'reasoningEffort', 'specialties'].forEach(function(field){
      var matchesCanonical = field === 'specialties' ? sameList(existing[field], canonical[field]) : String(existing[field] == null ? '' : existing[field]) === canonical[field];
      if (existing.dirty[field] === true && matchesCanonical) {
        existing.dirty[field] = false;
      }
      if (existing.dirty[field] !== true) {
        existing[field] = field === 'specialties' ? canonical[field].slice() : canonical[field];
        existing.baseline[field] = field === 'specialties' ? canonical[field].slice() : canonical[field];
        existing.dirty[field] = false;
      }
    });
    if (!existing.dirty.model && !existing.dirty.reasoningEffort && !existing.dirty.specialties) {
      delete state.drafts[id];
      return { model:canonical.model, reasoningEffort:canonical.reasoningEffort,
        specialties:canonical.specialties.slice(), baseline:canonical,
        dirty:{ model:false, reasoningEffort:false, specialties:false } };
    }
    return existing;
  }

  function sameList(left, right){
    left = list(left); right = list(right);
    if (left.length !== right.length) return false;
    for (var index = 0; index < left.length; index += 1) if (left[index] !== right[index]) return false;
    return true;
  }

  function setDraftField(draft, field, value){
    var next = field === 'specialties' ? list(value) : String(value == null ? '' : value);
    var baseline = draft.baseline && draft.baseline[field];
    var equal = field === 'specialties' ? sameList(next, baseline) : next === String(baseline == null ? '' : baseline);
    draft[field] = next;
    draft.dirty = draft.dirty || {};
    draft.dirty[field] = !equal;
    if (!draft.dirty.model && !draft.dirty.reasoningEffort && !draft.dirty.specialties) return false;
    return true;
  }

  function modelStatusLabel(status){
    var normalized = normalizedStatus(status);
    if (normalized === 'live' || normalized === 'available' || normalized === 'ok') return tr('模型信息已读取',"Model information loaded");
    if (normalized === 'unavailable' || normalized === 'unsupported' || normalized === 'none') return tr('模型沿用本机配置',"Uses the agent's local model configuration");
    if (normalized === 'stale') return tr('模型信息已过期',"Model information is stale");
    return tr('模型信息未知',"Model information unknown");
  }

  function modelList(bot){
    if (!bot || normalizedStatus(bot.modelStatus) !== 'live' || !Array.isArray(bot.models)) return [];
    return bot.models.filter(function(model){ return model && model.id != null; });
  }

  function findModel(bot, modelId){
    var models = modelList(bot);
    for (var index = 0; index < models.length; index += 1) {
      if (String(models[index].id) === String(modelId || '')) return models[index];
    }
    return null;
  }

  function renderModelOptions(bot, draft){
    var models = modelList(bot);
    var current = draft.model || '';
    if (!models.length) {
      if (current) return '<option value="' + escapeHtml(current) + tr('" selected>当前配置：',"\" selected>Current configuration: ") + escapeHtml(current) + '</option>';
      return '<option value="">' + escapeHtml(modelStatusLabel(bot && bot.modelStatus)) + '</option>';
    }
    var options = [tr('<option value="">使用智能体默认模型</option>',"<option value=\"\">Use agent's default model</option>")];
    var found = false;
    models.forEach(function(model){
      var id = String(model.id);
      var selected = id === current;
      if (selected) found = true;
      options.push('<option value="' + escapeHtml(id) + '"' + (selected ? ' selected' : '') + '>' + escapeHtml(text(model.name, id)) + '</option>');
    });
    if (current && !found) {
      options.push('<option value="' + escapeHtml(current) + tr('" selected>当前返回值：',"\" selected>Current reported value: ") + escapeHtml(current) + '</option>');
    }
    return options.join('');
  }

  function renderReasoningOptions(bot, draft){
    var model = findModel(bot, draft.model);
    var efforts = model && Array.isArray(model.reasoningEfforts) ? list(model.reasoningEfforts) : [];
    var current = draft.reasoningEffort || '';
    if (!efforts.length) {
      if (current) return '<option value="' + escapeHtml(current) + tr('" selected>当前返回值：',"\" selected>Current reported value: ") + escapeHtml(current) + '</option>';
      return '<option value="">' + (model ? tr('该模型未返回思考强度选项',"This model did not report reasoning effort options") : tr('请选择模型后查看',"Choose a model to view options")) + '</option>';
    }
    var options = [tr('<option value="">使用智能体默认强度</option>',"<option value=\"\">Use agent's default effort</option>")];
    var found = false;
    efforts.forEach(function(effort){
      var selected = effort === current;
      if (selected) found = true;
      options.push('<option value="' + escapeHtml(effort) + '"' + (selected ? ' selected' : '') + '>' + escapeHtml(effort) + '</option>');
    });
    if (current && !found) options.push('<option value="' + escapeHtml(current) + tr('" selected>当前返回值：',"\" selected>Current reported value: ") + escapeHtml(current) + '</option>');
    return options.join('');
  }

  function quotaInfo(bot){
    var summary = bot && bot.quotaSummary && typeof bot.quotaSummary === 'object' ? bot.quotaSummary : {};
    var quota = bot && bot.quota && typeof bot.quota === 'object' ? bot.quota : {};
    var rawState = summary.state || quota.status || 'unknown';
    var status = normalizedStatus(rawState) || 'unknown';
    var labels = {
      available:tr('额度可用',"Quota available"), ok:tr('额度可用',"Quota available"), healthy:tr('额度可用',"Quota available"),
      low:tr('额度偏低',"Quota low"), limited:tr('额度受限',"Quota limited"),
      exhausted:tr('额度已耗尽',"Quota exhausted"), depleted:tr('额度已耗尽',"Quota exhausted"),
      stale:tr('额度信息已过期',"Quota information is stale"), unavailable:tr('额度不可用',"Quota unavailable"), unknown:tr('额度未知',"Quota unknown")
    };
    var tone = status === 'available' || status === 'ok' || status === 'healthy' ? 'ok' : (status === 'low' || status === 'limited' || status === 'stale' ? 'warn' : (status === 'exhausted' || status === 'depleted' || status === 'unavailable' ? 'error' : ''));
    var remaining = summary.remainingPercent;
    if (remaining == null && quota.remainingPercent != null) remaining = quota.remainingPercent;
    var resetAt = summary.resetAt || quota.resetAt || '';
    var source = quota.source || summary.source || '';
    var observedAt = quota.observedAt || summary.observedAt || '';
    var buckets = Array.isArray(quota.buckets) ? quota.buckets : [];
    if (!buckets.length && quota.buckets && typeof quota.buckets === 'object') {
      Object.keys(quota.buckets).forEach(function(key){
        var item = quota.buckets[key];
        if (item && typeof item === 'object') buckets.push(Object.assign({ name:key }, item));
        else buckets.push({ name:key, remainingPercent:item });
      });
    }
    var rawRestrictions = Array.isArray(quota.restrictions) ? quota.restrictions : (Array.isArray(summary.restrictions) ? summary.restrictions : []);
    var restrictions = rawRestrictions.map(function(item){
      if (item && typeof item === 'object') {
        var label = [item.type, item.limitId || item.id, item.message].filter(Boolean).join(' · ');
        return label || JSON.stringify(item);
      }
      return text(item);
    }).filter(Boolean);
    return {
      label: labels[status] || text(rawState, tr('额度未知',"Quota unknown")),
      tone: tone,
      remaining: formatPercent(remaining),
      resetAt: formatDate(resetAt),
      source: text(source),
      observedAt: formatDate(observedAt),
      buckets: buckets,
      restrictions: restrictions
    };
  }

  function renderQuota(bot){
    var info = quotaInfo(bot);
    var bucketHtml = info.buckets.slice(0, 6).map(function(bucket){
      var name = text(bucket && (bucket.name || bucket.id || bucket.label), tr('额度桶',"Quota bucket"));
      var value = bucket && bucket.remainingPercent != null ? formatPercent(bucket.remainingPercent) : tr('未知',"Unknown");
      var reset = bucket && bucket.resetAt ? tr(' · 重置 '," · Resets ") + formatDate(bucket.resetAt) : '';
      var duration = bucket && bucket.windowMinutes != null ? bucket.windowMinutes : (bucket && bucket.windowDurationMins != null ? bucket.windowDurationMins : null);
      var window = duration != null ? ' · ' + duration + tr(' 分钟窗口',"-minute window") : '';
      return '<div class="aw-quota-line"><span>' + escapeHtml(name) + '</span><span>' + escapeHtml(value + window + reset) + '</span></div>';
    }).join('');
    var restrictionHtml = info.restrictions.length ? '<ul class="aw-restrictions">' + info.restrictions.slice(0, 5).map(function(item){ return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul>' : '';
    var metadata = [];
    if (info.source) metadata.push(tr('来源：',"Source: ") + info.source);
    if (info.observedAt) metadata.push(tr('观测：',"Observed: ") + info.observedAt);
    if (!metadata.length) metadata.push(tr('来源与观测时间未返回',"Source and observation time were not reported"));
    return '<div class="aw-quota">' +
      tr('<div class="aw-quota-head"><strong>额度</strong><span class="aw-quota-state"',"<div class=\"aw-quota-head\"><strong>Quota</strong><span class=\"aw-quota-state\"") + (info.tone ? ' data-tone="' + info.tone + '"' : '') + '>' + escapeHtml(info.label) + '</span></div>' +
      tr('<div class="aw-quota-line"><span>剩余</span><span>',"<div class=\"aw-quota-line\"><span>Remaining</span><span>") + escapeHtml(info.remaining) + '</span></div>' +
      (info.resetAt ? tr('<div class="aw-quota-line"><span>重置时间</span><span>',"<div class=\"aw-quota-line\"><span>Resets at</span><span>") + escapeHtml(info.resetAt) + '</span></div>' : '') +
      bucketHtml + restrictionHtml +
      '<p class="aw-quota-meta">' + escapeHtml(metadata.join(' · ')) + '</p>' +
      '</div>';
  }

  function renderFeatures(agent){
    var raw = agent && agent.features;
    var features = Array.isArray(raw) ? list(raw) : [];
    if (!features.length && raw && typeof raw === 'object') {
      features = Object.keys(raw).filter(function(key){ return raw[key] !== false && raw[key] != null && raw[key] !== 'unknown'; }).map(function(key){
        var value = raw[key];
        if (value === true) return key;
        return key + tr('：',': ') + String(value);
      });
    }
    if (!features.length) return '';
    return tr('<div class="aw-feature-list" aria-label="智能体特性">',"<div class=\"aw-feature-list\" aria-label=\"Agent capabilities\">") + features.slice(0, 8).map(function(feature){ return '<span class="aw-feature">' + escapeHtml(feature) + '</span>'; }).join('') + '</div>';
  }

  function renderSpecialtyPreview(specialties){
    var values = list(specialties);
    if (!values.length) return '';
    return tr('<div class="aw-specialty-preview" aria-label="已配置的擅长任务">',"<div class=\"aw-specialty-preview\" aria-label=\"Configured specialties\">") + values.slice(0, 6).map(function(item){ return '<span class="aw-specialty">' + escapeHtml(item) + '</span>'; }).join('') + '</div>';
  }

  function renderInstallation(agent, bot){
    var values = [];
    if (agent && agent.path) values.push(tr('<span>路径：<code>',"<span>Path: <code>") + escapeHtml(agent.path) + '</code></span>');
    if (agent && agent.bin) values.push(tr('<span>命令：<code>',"<span>Command: <code>") + escapeHtml(agent.bin) + '</code></span>');
    if (!values.length && bot && bot.version) values.push(tr('<span>版本：<code>',"<span>Version: <code>") + escapeHtml(bot.version) + '</code></span>');
    return values.length ? '<div class="aw-installation">' + values.join('<br>') + '</div>' : '';
  }

  // Only built-in catalog descriptions are product copy; custom descriptions stay intact.
  function agentDescription(agent){
    var defaults={
"codex":["一次性 exec 调用，使用 Codex workspace-write 沙箱；批准策略沿用本机配置","One-shot exec calls in the Codex workspace-write sandbox, using local approval settings"],
"claude":["Anthropic 官方编码 CLI，stream-json 事件流","Official Anthropic coding CLI with stream-json events"],
"gemini":["Google 开源 CLI；此预设使用一次性命令行调用","Google open-source CLI; this preset uses one-shot calls"],
"kimi":["Kimi 编码 CLI，原样流式文本输出；ACP 需按已安装版本配置","Kimi coding CLI with unmodified streaming text; configure ACP for the installed version"],
"qwen":["通义千问智能体；新绑定默认 ACP，兼容原 CLI 入口","Qwen agent; new bindings default to ACP, with the original CLI entry point retained"],
"grok":["Grok 构建型 CLI；输出解析兼容部分 JSON 事件，未声明 ACP","Grok coding CLI with partial JSON event support; ACP is not declared"],
"agy":["支持 stream-json 双工的单文件 agent CLI","Single-file agent CLI with duplex stream-json support"],
"pi":["pi-coding-agent，非交互 -p + json 输出","pi-coding-agent with noninteractive -p and JSON output"],
"opencode":["开源编码智能体，可起 ACP 服务","Open-source coding agent with ACP server support"],
"cursor-agent":["Cursor 的命令行智能体","Cursor command-line agent"],
"goose":["Block 开源智能体；此预设使用一次性命令行调用","Block open-source agent; this preset uses one-shot calls"],
"copilot":["GitHub Copilot 的命令行智能体","GitHub Copilot command-line agent"],
"amp":["Sourcegraph 的终端智能体","Sourcegraph terminal agent"],
"codebuddy":["腾讯 CodeBuddy 命令行智能体，通过公开 ACP 协议接入；不是 WorkBuddy 桌面；权限由该 CLI 自身配置管理","Tencent CodeBuddy CLI via public ACP; separate from WorkBuddy Desktop. Permissions follow the CLI configuration"],
"aider":["老牌结对编程 CLI，一问一答模式","Pair-programming CLI using one-shot question and answer calls"]
    };
    var value=text(agent&&agent.desc),copy=agent&&defaults[agent.id];
    var suffix='；权限由该 CLI 自身配置管理';
    var base=value.endsWith(suffix)?value.slice(0,-suffix.length):value;
    if (copy&&base===copy[0]) return tr(copy[0],copy[1])+(value!==base?tr(suffix,'; permissions follow the CLI configuration'):'');
    return copy&&value===copy[0]?tr(copy[0],copy[1]):value;
  }
  function renderBotCard(bot, agents){
    var agent = agentFor(bot, agents);
    var available = isInstalled(bot, agent);
    var needsSetup = bot && bot.needsSetup === true;
    var draft = draftFor(bot);
    var modelOptions = modelList(bot);
    var modelStatus = normalizedStatus(bot && bot.modelStatus);
    var canChooseModel = available && modelStatus === 'live' && modelOptions.length > 0;
    var canEdit = available && !needsSetup;
    var canChat = available && !needsSetup;
    var statusLabel = needsSetup ? (available ? tr('需要重新绑定',"Rebind required") : tr('需重新绑定 · 智能体不可用',"Rebind required · Agent unavailable")) : (available ? (modelStatus === 'live' ? tr('已绑定',"Bound") : tr('已绑定 · ',"Bound · ") + modelStatusLabel(bot.modelStatus)) : tr('智能体不可用',"Agent unavailable"));
    var statusTone = needsSetup ? (available ? 'warn' : 'error') : (available ? 'ok' : 'error');
    var botId = text(bot && bot.id);
    var name = text(bot && bot.name, agent && agent.name ? agent.name + ' Bot' : tr('未命名 Bot',"Untitled Bot"));
    var vendor = text(bot && bot.vendor, agent && agent.vendor);
    var version = text(bot && bot.version, agent && agent.version);
    var meta = [vendor, version ? 'v' + version : ''].filter(Boolean).join(' · ');
    if (!meta) meta = tr('本机智能体',"Local agent");
    var description = agentDescription(agent) || tr('由这个 Bot 管理对应的本地智能体。','This Bot manages its corresponding local agent.');
    var modelNote = modelOptions.length ? modelStatusLabel(bot.modelStatus) : modelStatusLabel(bot.modelStatus);
    var effortModel = findModel(bot, draft.model);
    var efforts = effortModel && Array.isArray(effortModel.reasoningEfforts) ? list(effortModel.reasoningEfforts) : [];
    var detailsMeta = needsSetup ? tr('需重新绑定',"Rebind required") : (modelStatus === 'live' && modelOptions.length ? tr('可选模型 ',"Available models: ") + modelOptions.length + tr(' 个',"") : tr('模型信息未知',"Model information unknown"));
    var specialtiesText = list(draft.specialties).join('\n');
    var setupNote = needsSetup ? tr('<p class="aw-setup-note">工作空间配置已导入；重新绑定本机智能体后，才能打开对话或修改模型、思考强度和擅长任务。</p>',"<p class=\"aw-setup-note\">Workspace configuration imported. Rebind the local agent to open chats or edit its model, reasoning effort, and specialties.</p>") : '';
    var setupAction = needsSetup ? '<div class="aw-setup-actions"><button class="btn primary" type="button" data-aw-rebind' + (available ? '' : ' disabled') + tr('>重新绑定本机智能体</button><span>',">Rebind local agent</button><span>") + (available ? tr('确认当前本机程序后恢复执行与配置编辑。',"Confirm the local program to resume execution and configuration editing.") : tr('本机程序当前不可用，恢复安装后再绑定。',"The local program is unavailable. Restore its installation before rebinding.")) + '</span></div>' : '';
    var modelDisabled = !canChooseModel || needsSetup;
    // A reasoning selector with no real options should be inert. This also
    // prevents a stale effort from being submitted after switching to the
    // adapter's default model.
    var effortDisabled = !canEdit || !efforts.length;
    return '<article class="aw-agent-card" data-aw-bot="' + escapeHtml(botId) + '" data-installed="' + (available ? 'true' : 'false') + '" data-needs-setup="' + (needsSetup ? 'true' : 'false') + '">' +
      '<div class="aw-agent-card-header"><div class="aw-agent-card-heading"><div class="aw-agent-name">' + escapeHtml(name) + '</div><div class="aw-agent-meta">' + escapeHtml(meta) + (bot && bot.agentId != null ? tr(' · 智能体 '," · Agent ") + escapeHtml(bot.agentId) : '') + '</div></div><span class="aw-state-chip" data-tone="' + statusTone + '">' + escapeHtml(statusLabel) + '</span></div>' +
      '<p class="aw-agent-description">' + escapeHtml(description) + '</p>' +
      setupNote +
      setupAction +
      renderFeatures({ features: bot.features || (agent && agent.features) }) + renderSpecialtyPreview(draft.specialties) +
      '<details class="aw-details" data-aw-details="' + escapeHtml(botId) + tr('"><summary><span>配置与额度</span><span class="aw-disclosure-meta">',"\"><summary><span>Configuration and quota</span><span class=\"aw-disclosure-meta\">") + escapeHtml(detailsMeta) + '</span></summary>' +
        '<div class="aw-detail-body"><div class="aw-config-grid">' +
          '<div class="aw-field"><label for="aw-model-' + escapeHtml(botId) + tr('">模型</label><select class="t" id="aw-model-',"\">Model</label><select class=\"t\" id=\"aw-model-") + escapeHtml(botId) + '" data-aw-model' + (modelDisabled ? ' disabled' : '') + '>' + renderModelOptions(bot, draft) + '</select><p class="aw-model-note">' + escapeHtml(modelNote) + '</p></div>' +
          '<div class="aw-field"><label for="aw-effort-' + escapeHtml(botId) + tr('">思考强度</label><select class="t" id="aw-effort-',"\">Reasoning effort</label><select class=\"t\" id=\"aw-effort-") + escapeHtml(botId) + '" data-aw-effort' + (effortDisabled ? ' disabled' : '') + '>' + renderReasoningOptions(bot, draft) + '</select><p class="aw-model-note">' + (efforts.length ? escapeHtml(countLabel(efforts.length,' 个实际返回选项','reported option')) : tr('未返回可选强度',"No effort options reported")) + '</p></div>' +
        '</div>' +
        '<div class="aw-specialty-field"><label for="aw-specialties-' + escapeHtml(botId) + tr('">擅长任务（每行一项，也可用逗号分隔）</label><textarea class="t" id="aw-specialties-',"\">Specialties (one per line or separated by commas)</label><textarea class=\"t\" id=\"aw-specialties-") + escapeHtml(botId) + tr('" data-aw-specialties placeholder="例如：代码审查\n资料整理"','" data-aw-specialties placeholder="e.g. Code review\nResearch organization"') + (canEdit ? '' : ' disabled') + '>' + escapeHtml(specialtiesText) + tr('</textarea><p class="aw-configuration-note">职责说明来自本机智能体探测结果；这里保存的是你给这个 Bot 的任务标签。</p></div>',"</textarea><p class=\"aw-configuration-note\">Responsibility descriptions come from local agent detection. This field stores the task tags you assign to this Bot.</p></div>") +
        renderQuota(bot) + renderInstallation(agent, bot) +
      '</div></details>' +
      tr('<div class="aw-agent-actions"><button class="btn" type="button" data-aw-inspect>读取最新状态</button><button class="btn" type="button" data-aw-chat',"<div class=\"aw-agent-actions\"><button class=\"btn\" type=\"button\" data-aw-inspect>Refresh status</button><button class=\"btn\" type=\"button\" data-aw-chat") + (canChat ? '' : ' disabled') + tr('>打开对话</button><button class="btn primary" type="button" data-aw-save',">Open chat</button><button class=\"btn primary\" type=\"button\" data-aw-save") + (canEdit ? '' : ' disabled') + tr('>保存</button><span class="aw-agent-row-status" data-aw-row-status role="status" aria-live="polite"></span></div>',">Save</button><span class=\"aw-agent-row-status\" data-aw-row-status role=\"status\" aria-live=\"polite\"></span></div>") +
      '</article>';
  }

  function renderCandidates(agents, bots){
    var bound = Object.create(null);
    bots.forEach(function(bot){ if (bot && bot.agentId != null) bound[String(bot.agentId)] = true; });
    var candidates = agents.filter(function(agent){ return agent && agent.installed === true && !bound[String(agent.id)]; });
    if (!candidates.length) return '';
    return tr('<section class="aw-candidates"><div class="aw-candidates-title">已检测到可接入智能体</div><p class="aw-candidates-note">点击上方“一键接入已安装智能体”，为下面的本机程序创建对应 Bot。</p><div class="aw-candidate-list">',"<section class=\"aw-candidates\"><div class=\"aw-candidates-title\">Detected agents ready to connect</div><p class=\"aw-candidates-note\">Choose “Connect installed agents” above to create a Bot for each local program below.</p><div class=\"aw-candidate-list\">") + candidates.map(function(agent){
      var meta = [text(agent.vendor), agent.version ? 'v' + agent.version : ''].filter(Boolean).join(' · ');
      return '<div class="aw-candidate-row"><div><div class="aw-candidate-name">' + escapeHtml(text(agent.name, tr('未命名智能体',"Untitled agent"))) + '</div><div class="aw-candidate-meta">' + escapeHtml(meta || tr('已安装，等待绑定',"Installed, awaiting binding")) + tr('</div></div><span class="aw-state-chip" data-tone="ok">待接入</span></div>',"</div></div><span class=\"aw-state-chip\" data-tone=\"ok\">Not connected</span></div>");
    }).join('') + '</div></section>';
  }

  function renderMissing(agents, bots){
    var rows = [];
    var seen = Object.create(null);
    agents.filter(function(agent){ return agent && agent.installed === false; }).forEach(function(agent){
      var id = 'agent:' + String(agent.id);
      if (seen[id]) return;
      seen[id] = true;
      rows.push({ name:text(agent.name, tr('未命名智能体',"Untitled agent")), meta:[text(agent.vendor), agent.version ? 'v' + agent.version : tr('未安装',"Not installed")].filter(Boolean).join(' · '), path:agent.path || agent.bin || '' });
    });
    bots.filter(function(bot){ return bot && bot.installed === false; }).forEach(function(bot){
      var id = 'bot:' + String(bot.id);
      if (seen[id]) return;
      seen[id] = true;
      rows.push({ name:text(bot.name, tr('未命名 Bot',"Untitled Bot")), meta:tr('对应智能体不可用或未安装',"Agent unavailable or not installed"), path:'' });
    });
    if (!rows.length) return '';
    return rows.map(function(row){
      return '<div class="aw-missing-row"><div class="aw-missing-name">' + escapeHtml(row.name) + '</div><div class="aw-missing-meta">' + escapeHtml(row.meta) + (row.path ? ' · <code>' + escapeHtml(row.path) + '</code>' : '') + '</div></div>';
    }).join('');
  }

  function renderAdapters(agents, warning){
    var rows = agents.map(function(agent){
      var protocols = Object.keys(agent.transports || {}).filter(function(key){ return agent.transports[key] === true; }).map(function(key){ return key.toUpperCase(); }).join(' / ');
      return '<div class="aw-missing-row"><div class="aw-missing-name">' + escapeHtml(agent.name) + ' · ' + escapeHtml(protocols) + '</div><div class="aw-missing-meta">' +
        escapeHtml(agent.installed ? tr('程序已检测 · 登录与协议能力尚未核实', 'Program detected · authentication and protocol capabilities unverified') : tr('未检测到程序', 'Program not detected')) + '</div></div>';
    }).join('');
    return '<details class="aw-details" data-aw-details="adapter-market"><summary><span>' + tr('适配器与扩展', 'Adapters and extensions') + '</span><span class="aw-disclosure-meta">' + agents.length + '</span></summary><div class="aw-detail-body">' +
      '<p class="aw-model-note">' + tr('导入 JSON 适配清单，复用已有智能体程序。清单声明、安装检测和真实协议能力分别核验。', 'Import a JSON adapter manifest for existing agent software. Declarations, installation detection and protocol capabilities are verified separately.') + '</p>' +
      '<button class="btn" type="button" data-aw-adapter-import>' + tr('导入本机适配器…', 'Import local adapter…') + '</button>' +
      (warning ? '<p role="alert" class="aw-setup-note">' + escapeHtml(warning) + '</p>' : '') + rows +
      '<p class="aw-model-note">' + tr('WorkBuddy 尚未接通；它与 CodeBuddy CLI 独立。其桌面认证与官方云端授权需要各自适配。文档、会议等工作能力沿用插件、连接器和技能入口。', 'WorkBuddy is not connected and is separate from CodeBuddy CLI. Desktop authentication and official cloud authorization need separate adapters. Document and meeting capabilities use plugins, connectors and skills.') + '</p></div></details>';
  }

  function render(snapshot){
    if (!state.root) return;
    state.snapshot = snapshot || {};
    clearError();
    setLoading(false);
    var workspace = state.snapshot.workspace && typeof state.snapshot.workspace === 'object' ? state.snapshot.workspace : {};
    var agents = Array.isArray(state.snapshot.agents) ? state.snapshot.agents : [];
    var bots = Array.isArray(state.snapshot.bots) ? state.snapshot.bots : [];
    var installedAgents = agents.filter(function(agent){ return agent && agent.installed === true; });
    var title = query('#aw-workspace-title', state.root);
    var meta = query('#aw-workspace-meta', state.root);
    if (title) title.textContent = workspace.name==='智能体工作空间'?tr('智能体工作空间','Local agents'):text(workspace.name,tr('智能体工作空间','Local agents'));
    if (meta) meta.textContent = countLabel(installedAgents.length,' 个已安装智能体','installed agent')+' · '+countLabel(bots.length,' 个已绑定 Bot','bound Bot');

    var listNode = query('#aw-agent-list', state.root);
    var empty = query('#aw-empty', state.root);
    var missing = query('#aw-missing', state.root);
    var missingList = query('#aw-missing-list', state.root);
    var missingCount = query('#aw-missing-count', state.root);
    var oldOpen = Object.create(null);
    queryAll('[data-aw-details]', listNode).forEach(function(details){ oldOpen[details.getAttribute('data-aw-details')] = details.open; });

    var listHtml = renderCandidates(agents, bots) + bots.map(function(bot){ return renderBotCard(bot, agents); }).join('') + renderAdapters(agents, state.snapshot.adapterWarning);
    if (listNode) {
      listNode.innerHTML = listHtml;
      listNode.hidden = !listHtml;
      queryAll('[data-aw-details]', listNode).forEach(function(details){
        var id = details.getAttribute('data-aw-details');
        details.open = own(oldOpen, id) ? oldOpen[id] : false;
      });
    }

    var missingHtml = renderMissing(agents, bots);
    if (missingList) missingList.innerHTML = missingHtml;
    if (missingCount) {
      var count = missingHtml ? queryAll('.aw-missing-row', missingList).length : 0;
      missingCount.textContent = count ? '(' + count + ')' : '';
    }
    if (missing) missing.hidden = !missingHtml;
    if (empty) empty.hidden = !!listHtml || installedAgents.length > 0;

    var onboard = query('#aw-onboard', state.root);
    if (onboard) {
      onboard.setAttribute('data-no-agents', installedAgents.length ? 'false' : 'true');
      onboard.disabled = state.busy || !installedAgents.length;
    }
    if (!listHtml && !installedAgents.length && missingHtml) {
      if (empty) empty.hidden = true;
    }
    setBusy(state.busy);
  }

  function snapshotFocus(){
    var active = document.activeElement;
    if (!active || !state.root || !state.root.contains(active)) return null;
    var card = active.closest ? active.closest('[data-aw-bot]') : null;
    return {
      id: active.id || '',
      botId: card ? card.getAttribute('data-aw-bot') : '',
      field: active.getAttribute ? (active.getAttribute('data-aw-model') != null ? 'model' : (active.getAttribute('data-aw-effort') != null ? 'effort' : (active.getAttribute('data-aw-specialties') != null ? 'specialties' : ''))) : ''
    };
  }

  function restoreFocus(snapshot){
    if (!snapshot) return;
    var target = snapshot.id ? document.getElementById(snapshot.id) : null;
    if (!target && snapshot.botId && snapshot.field) {
      var escapedId = window.CSS && typeof window.CSS.escape === 'function' ? window.CSS.escape(snapshot.botId) : String(snapshot.botId).replace(/(["\\])/g, '\\$1');
      target = query('[data-aw-bot="' + escapedId + '"] [data-aw-' + snapshot.field + ']', state.root);
    }
    if (target && typeof target.focus === 'function') target.focus();
  }

  function acceptSnapshot(snapshot, message, tone){
    render(snapshot);
    notifyParent(snapshot);
    var errors = snapshot && Array.isArray(snapshot.errors) ? snapshot.errors.filter(function(item){ return item && (item.message || item.code); }) : [];
    if (errors.length) {
      var detail = errors.slice(0, 2).map(function(item){ return text(item.message, item.code || tr('读取失败',"Failed to load")); }).join(tr('；','; '));
      if (errors.length > 2) detail += tr('；另有 ',"; plus ") + (errors.length - 2) + tr(' 项未完成'," incomplete");
      setStatus((message || tr('工作空间已更新',"Local agents updated")) + tr('，但部分状态未读取：',", but some status information could not be loaded: ") + detail, 'warn');
    } else if (message) {
      setStatus(message, tone || 'ok');
    }
  }

  function request(method, payload, busyMessage, successMessage){
    if (!state.root) return Promise.reject(new Error(tr('智能体工作空间尚未初始化',"Local agents are not initialized")));
    var requestId = ++state.requestId;
    var focus = snapshotFocus();
    setBusy(true);
    setLoading(!state.snapshot);
    if (busyMessage) setStatus(busyMessage);
    return callBridge(method, payload).then(function(snapshot){
      if (requestId !== state.requestId) return snapshot;
      state.busy = false;
      acceptSnapshot(snapshot, successMessage, 'ok');
      restoreFocus(focus);
      setBusy(false);
      return snapshot;
    }).catch(function(error){
      if (requestId !== state.requestId) throw error;
      state.busy = false;
      setError(errorFrom(error));
      setStatus(error && error.message ? error.message : tr('请求失败',"Request failed"), 'error');
      setBusy(false);
      throw error;
    });
  }

  function expose(promise){
    // The click handlers consume failures, but callers such as a legacy
    // openAgents wrapper may intentionally ignore the returned Promise. Mark
    // it handled here without hiding the rejection from callers that await it.
    promise.catch(function(){});
    return promise;
  }

  function open(){
    ensureInitialized();
    if (!state.root) return Promise.reject(new Error(tr('智能体工作空间元素不存在',"Local agents view is missing")));
    if (!state.open) {
      var active = document.activeElement;
      state.focusBefore = active && active !== document.body ? active : null;
    }
    state.open = true;
    state.root.classList.remove('hidden');
    state.root.setAttribute('aria-hidden', 'false');
    if (!state.snapshot) {
      setLoading(true);
      setStatus(tr('正在读取本机智能体…',"Loading local agents…"));
    }
    var promise = expose(request('agentWorkspaceSnapshot', {}, '', tr('已同步智能体工作空间',"Local agents synced")));
    window.setTimeout(function(){
      var button = query('#aw-refresh', state.root) || query('#aw-onboard', state.root);
      if (button && !state.busy) button.focus();
    }, 0);
    return promise;
  }

  function close(){
    ensureInitialized();
    if (!state.root) return;
    state.requestId += 1;
    state.open = false;
    // Restore controls before hiding the dialog. The in-flight promise is
    // invalidated above, so its eventual completion cannot re-disable them.
    setBusy(false);
    state.root.classList.add('hidden');
    state.root.setAttribute('aria-hidden', 'true');
    state.root.removeAttribute('aria-busy');
    var focus = state.focusBefore;
    state.focusBefore = null;
    if (typeof state.onClose === 'function') {
      try { state.onClose(); } catch (error) { console.warn('[agent-workspace] onClose failed', error); }
    }
    if (focus && focus.isConnected && typeof focus.focus === 'function') focus.focus();
  }

  function refresh(){
    ensureInitialized();
    if (!state.root) return Promise.reject(new Error(tr('智能体工作空间尚未初始化',"Local agents are not initialized")));
    return expose(request('refreshAgentWorkspace', {}, tr('正在刷新本机智能体状态…',"Refreshing local agent status…"), tr('已刷新本机智能体状态',"Local agent status refreshed")));
  }

  function onboard(){
    ensureInitialized();
    return expose(request('onboardAgentWorkspace', {}, tr('正在接入智能体并读取可用状态…',"Connecting agents and checking availability…"), tr('已更新智能体工作空间',"Local agents updated")));
  }

  function botFromEvent(target){
    var card = target && target.closest ? target.closest('[data-aw-bot]') : null;
    if (!card) return null;
    var id = card.getAttribute('data-aw-bot');
    var bots = state.snapshot && Array.isArray(state.snapshot.bots) ? state.snapshot.bots : [];
    for (var index = 0; index < bots.length; index += 1) if (String(bots[index].id) === String(id)) return { card:card, bot:bots[index], id:String(id) };
    return { card:card, bot:null, id:String(id) };
  }

  function parseSpecialties(value){
    return String(value || '').split(/[\n,，]/).map(function(item){ return item.trim(); }).filter(Boolean).slice(0, 24);
  }

  function updateDraftFromCard(item){
    if (!item || !item.id) return null;
    var draft = draftFor(item.bot || { id:item.id });
    var model = query('[data-aw-model]', item.card);
    var effort = query('[data-aw-effort]', item.card);
    var specialties = query('[data-aw-specialties]', item.card);
    if (model) setDraftField(draft, 'model', model.value || '');
    if (effort) setDraftField(draft, 'reasoningEffort', effort.value || '');
    if (specialties) setDraftField(draft, 'specialties', parseSpecialties(specialties.value));
    if (draft.dirty && (draft.dirty.model || draft.dirty.reasoningEffort || draft.dirty.specialties)) state.drafts[item.id] = draft;
    else delete state.drafts[item.id];
    return draft;
  }

  function syncEffortSelect(item){
    if (!item || !item.bot) return;
    var draft = updateDraftFromCard(item);
    var effort = query('[data-aw-effort]', item.card);
    if (!effort) return;
    var options = renderReasoningOptions(item.bot, draft);
    effort.innerHTML = options;
    var model = findModel(item.bot, draft.model);
    var efforts = model && Array.isArray(model.reasoningEfforts) ? list(model.reasoningEfforts) : [];
    var nextEffort = '';
    if (model && efforts.length) {
      nextEffort = efforts.indexOf(draft.reasoningEffort) >= 0 ? draft.reasoningEffort :
        (model.defaultReasoningEffort && efforts.indexOf(String(model.defaultReasoningEffort)) >= 0 ? String(model.defaultReasoningEffort) : '');
    }
    if (draft.reasoningEffort !== nextEffort) setDraftField(draft, 'reasoningEffort', nextEffort);
    effort.disabled = !efforts.length || item.bot.installed !== true || item.bot.needsSetup === true;
    effort.value = draft.reasoningEffort || '';
  }

  function setRowStatus(card, message, tone){
    var node = query('[data-aw-row-status]', card);
    if (!node) return;
    node.textContent = message || '';
    if (tone) node.setAttribute('data-tone', tone); else node.removeAttribute('data-tone');
  }

  function inspectBot(item){
    if (!item || !item.id) return;
    setRowStatus(item.card, tr('正在读取…',"Loading…"));
    request('refreshAgentWorkspace', { botId:item.id }, tr('正在读取该 Bot 的最新状态…',"Loading the latest status for this Bot…"), tr('已读取最新状态',"Latest status loaded")).catch(function(error){ setRowStatus(item.card, error.message || tr('读取失败',"Failed to load"), 'error'); });
  }

  function rebindBot(item){
    if (!item || !item.id || !item.bot || item.bot.needsSetup !== true || item.bot.installed !== true) return;
    // The imported model/effort/specialties stay read-only until the host
    // confirms this exact local agent again. The rebind call is explicit and
    // scoped to the host Bot; the global onboard action remains create-only.
    delete state.drafts[item.id];
    setRowStatus(item.card, tr('正在重新绑定…',"Rebinding…"));
    request('onboardAgentWorkspace', { botId:item.id }, tr('正在重新绑定本机智能体…',"Rebinding local agent…"), tr('已重新绑定本机智能体',"Local agent rebound")).then(function(){
      setRowStatus(item.card, tr('已重新绑定',"Rebound"), 'ok');
    }).catch(function(error){ setRowStatus(item.card, error.message || tr('重新绑定失败',"Rebind failed"), 'error'); });
  }

  function configureBot(item){
    if (!item || !item.id || !item.bot || item.bot.installed !== true) return;
    var draft = updateDraftFromCard(item);
    var modelControl = query('[data-aw-model]', item.card);
    var effortControl = query('[data-aw-effort]', item.card);
    var payload = { botId:item.id, specialties:draft.specialties };
    // Preserve an existing model when the adapter has not returned a live
    // inventory. Sending it back for validation would turn a specialties-only
    // edit into a false MODEL_UNAVAILABLE failure.
    if (modelControl && !modelControl.disabled) {
      payload.model = draft.model || null;
      // Selecting the default model also clears any previously selected
      // reasoning effort, even while the effort control is disabled because
      // the default has no model-specific options.
      payload.reasoningEffort = effortControl && !effortControl.disabled ? (draft.reasoningEffort || null) : null;
    } else if (effortControl && !effortControl.disabled) {
      payload.reasoningEffort = draft.reasoningEffort || null;
    }
    setRowStatus(item.card, tr('正在保存…',"Saving…"));
    request('configureAgentWorkspace', payload, tr('正在保存 Bot 配置…',"Saving Bot configuration…"), tr('已保存 Bot 配置',"Bot configuration saved")).then(function(){
      setRowStatus(item.card, tr('已保存',"Saved"), 'ok');
    }).catch(function(error){ setRowStatus(item.card, error.message || tr('保存失败',"Save failed"), 'error'); });
  }

  function openBot(item){
    if (!item || !item.id || !item.bot || item.bot.installed !== true || typeof state.onOpenBot !== 'function') return;
    try { state.onOpenBot(item.id, item.bot); } catch (error) { setRowStatus(item.card, error.message || tr('无法打开对话',"Unable to open chat"), 'error'); }
  }

  function bind(){
    if (!state.root || state.bound) return;
    state.bound = true;
    state.root.classList.add('aw-mask');
    state.root.setAttribute('aria-hidden', 'true');
    state.root.addEventListener('click', function(event){
      var target = event.target;
      if (target === state.root) { close(); return; }
      var closeButton = target.closest ? target.closest('[data-aw-close]') : null;
      if (closeButton) { event.preventDefault(); close(); return; }
      if (target.closest && target.closest('#aw-refresh')) { event.preventDefault(); refresh().catch(function(){}); return; }
      if (target.closest && target.closest('#aw-onboard')) { event.preventDefault(); onboard().catch(function(){}); return; }
      if (target.closest && target.closest('#aw-error-retry')) { event.preventDefault(); refresh().catch(function(){}); return; }
      if (target.closest && target.closest('[data-aw-adapter-import]')) { event.preventDefault(); request('importAgentAdapter', {}, tr('正在审核适配器…', 'Reviewing adapter…'), tr('已更新适配器目录', 'Adapter catalog updated')).catch(function(){}); return; }
      var item = botFromEvent(target);
      if (!item) return;
      if (target.closest('[data-aw-rebind]')) { event.preventDefault(); rebindBot(item); return; }
      if (target.closest('[data-aw-inspect]')) { event.preventDefault(); inspectBot(item); return; }
      if (target.closest('[data-aw-save]')) { event.preventDefault(); configureBot(item); return; }
      if (target.closest('[data-aw-chat]')) { event.preventDefault(); openBot(item); return; }
    });
    state.root.addEventListener('input', function(event){
      var target = event.target;
      if (!target || !target.closest) return;
      var item = botFromEvent(target);
      if (!item) return;
      if (target.matches('[data-aw-specialties]')) updateDraftFromCard(item);
    });
    state.root.addEventListener('change', function(event){
      var target = event.target;
      var item = botFromEvent(target);
      if (!item) return;
      if (target.matches('[data-aw-model]')) syncEffortSelect(item);
      else if (target.matches('[data-aw-effort], [data-aw-specialties]')) updateDraftFromCard(item);
    });
    document.addEventListener('keydown', function(event){
      if (!state.open || event.key !== 'Escape') return;
      if (typeof state.esc === 'function') {
        try { if (state.esc(event) === true) return; } catch (_) {}
      }
      event.preventDefault();
      close();
    });
  }

  function init(options){
    options = options || {};
    if (options.bridge) state.bridge = options.bridge;
    else if (!state.bridge && window.grokbot) state.bridge = window.grokbot;
    if (own(options, 'onState')) state.onState = options.onState;
    if (own(options, 'onOpenBot')) state.onOpenBot = options.onOpenBot;
    if (own(options, 'onClose')) state.onClose = options.onClose;
    if (own(options, 'esc')) state.esc = options.esc;
    state.root = state.root || document.getElementById('agent-mask');
    state.initialized = true;
    bind();
    return api;
  }

  function ensureInitialized(){
    if (!state.initialized) init({ bridge:window.grokbot });
    else if (!state.bridge && window.grokbot) state.bridge = window.grokbot;
  }

  var api = { init:init, open:open, close:close, refresh:refresh };
  window.OpenBotAgentWorkspace = api;
})();
