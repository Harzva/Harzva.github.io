'use strict';

(function () {
  var tr = function (zh, en) { return window.OpenBotI18n ? window.OpenBotI18n.t(zh, en) : zh; };
  var cache = Object.create(null);
  var bindings = Object.create(null);
  var keys = ['Enter','Tab','Escape','Backspace','Ctrl+A','Ctrl+S','Ctrl+O','Ctrl+N','Ctrl+W','Ctrl+L','Ctrl+C','Ctrl+V','Ctrl+X','Ctrl+Z','Alt+Tab','Alt+F4','Delete','Home','End','PageUp','PageDown','Shift+Tab','F2','F5'];
  var apps = ['editor','files','browser'];
  var appLabels = {editor:tr("编辑器", "Editor"), files:tr("文件管理器", "File manager"), browser:tr("浏览器", "Browser")};
  var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var bridge = function () { return window.OpenBotBridge || window.grokbot || null; };
  var stateFor = function (botId, fallback) {
    var id = String(botId || '');
    if (!cache[id]) cache[id] = { botId:id, hostId:'', screenDriverId:'linux-desktop', screenId:'', generation:0, inputRevision:0, running:false, owner:'agent', loading:false, busy:false, available:false, configured:false, blocked:false, desktopEnabled:false, cleanupRequired:false, permissionRevision:0, driver:null, files:[], filesLoaded:false, filesNotice:'', taskNotice:'', shot:null, error:'', recoveryNeeded:false, pollFailures:0, statusAt:0, captureAt:0, requestToken:0, previewToken:0, previewSequence:0, previewPending:false, previewSupported:false, draftsByHost:null };
    if (fallback && !cache[id].statusAt) {
      // The browser workbench shares this render path. Only carry the node
      // identity into the desktop cache; browser screen ids and generations
      // must never become desktop targets before the first status reply.
      if (fallback.hostId !== undefined) cache[id].hostId = fallback.hostId || '';
      cache[id].remote = fallback.remote === true || fallback.executionLocation === 'node';
    }
    return cache[id];
  };
  var target = function (st, includeInput) {
    var shot = st.shot || {}, out = {};
    ['hostId','screenDriverId','screenId','generation'].forEach(function (key) { var value = shot[key] !== undefined && shot[key] !== null && shot[key] !== '' ? shot[key] : st[key]; if (value !== undefined && value !== null && value !== '') out[key] = value; });
    if (includeInput) out.inputRevision = shot.inputRevision !== undefined ? shot.inputRevision : Number(st.inputRevision || 0);
    return out;
  };
  var hasFrame = function (st) { var shot = st.shot; return !!(!st.recoveryNeeded && shot && shot.dataUrl && ['hostId','screenDriverId','screenId','generation','inputRevision'].every(function (key) { return shot[key] !== undefined && shot[key] !== null && shot[key] !== '' && shot[key] === st[key]; })); };
  var statusValue = function (result) {
    if (!result || typeof result !== 'object') return result;
    return result.status && typeof result.status === 'object' ? Object.assign({}, result, result.status) : result;
  };
  var remoteStatusForBot = function (bot, execution) {
    if (!bot || bot.executionLocation !== 'node') return null;
    var rows = execution && Array.isArray(execution.nodes) ? execution.nodes : [];
    var requestedHostId = String(bot.nodeHostId || execution && execution.defaultHostId || '');
    var row = requestedHostId ? rows.filter(function (item) {
      return String(item.hostId || item.host && item.host.id || '') === requestedHostId;
    })[0] : null;
    if (!row && execution && execution.host && (!requestedHostId || String(execution.host.id || '') === requestedHostId)) row = execution;
    var hostId = String(row && (row.hostId || row.host && row.host.id) || requestedHostId || '');
    var hostName = String(row && (row.name || row.host && row.host.name) || hostId || tr('远端主机', 'Remote host'));
    var remoteBot = row && Array.isArray(row.bots) ? row.bots.filter(function (item) { return item && item.id === bot.id; })[0] : null;
    var plans = remoteBot && Array.isArray(remoteBot.plans) ? remoteBot.plans : [];
    var selectedPlan = remoteBot && remoteBot.plan || plans.filter(function (item) {
      return item && item.apiExecution && item.apiExecution.mode === 'browser';
    })[0] || plans[0] || null;
    var model = selectedPlan && selectedPlan.apiExecution && typeof selectedPlan.apiExecution.model === 'string'
      ? selectedPlan.apiExecution.model : '';
    var desktopDriver = remoteBot && Array.isArray(remoteBot.screenDrivers)
      ? remoteBot.screenDrivers.filter(function (item) { return item && item.id === 'linux-desktop'; })[0] : null;
    var capabilities = desktopDriver && Array.isArray(desktopDriver.capabilities) ? desktopDriver.capabilities : [];
    var connected = !!(row && row.connected === true);
    var modelAvailable = !!(connected && remoteBot && remoteBot.available === true && model);
    var available = !!(modelAvailable && remoteBot.toolsEnabled === true);
    var status = !execution ? 'unreported' : !row ? 'host-missing' : !connected ? 'disconnected' : !remoteBot ? 'bot-missing' :
      remoteBot.available !== true ? 'not-ready' : !model ? 'model-unreported' : remoteBot.toolsEnabled === true ? 'ready' : 'tools-disabled';
    var stateLabel = status === 'unreported' ? tr('远端状态未读取', 'Remote status not read')
      : status === 'host-missing' ? tr('找不到绑定主机状态', 'Pinned host status not found')
      : status === 'disconnected' ? tr('主机未连接', 'Host not connected')
      : status === 'bot-missing' ? tr('节点未提供此 Bot', 'Bot not reported by node')
      : status === 'not-ready' ? tr('远端模型或执行配置未就绪', 'Remote model or execution is not configured')
      : status === 'model-unreported' ? tr('节点未报告模型', 'Model not reported by node')
      : status === 'tools-disabled' ? tr('模型可用 · 工具未启用', 'Model ready · tools disabled')
      : tr('远端可执行', 'Ready on node');
    var modelLabel = model || tr('模型未配置', 'Model not configured');
    var summary = hostName + ' · ' + tr('模型 ', 'Model ') + modelLabel + ' · ' + stateLabel;
    var title = tr('远端主机：', 'Remote host: ') + hostName + (hostId && hostId !== hostName ? ' (' + hostId + ')' : '') +
      ' · ' + tr('模型：', 'Model: ') + modelLabel + ' · ' + tr('状态：', 'Status: ') + stateLabel;
    // A desktop status reply crosses the node control channel, so when that
    // reply still succeeds the host is reachable even if the execution row is
    // stale; keep the connection verdict, but let the label say so.
    var seen = cache[String(bot.id)];
    var desktopReachable = !!(seen && seen.statusAt > 0 && seen.available === true && seen.recoveryNeeded !== true &&
      (!seen.hostId || String(seen.hostId) === hostId));
    if (desktopReachable && (status === 'disconnected' || status === 'host-missing' || status === 'unreported')) {
      var reachableLabel = tr('桌面连接正常 · 执行状态待刷新', 'Desktop reachable · execution status pending refresh');
      summary = hostName + ' · ' + reachableLabel;
      title = tr('远端主机：', 'Remote host: ') + hostName + ' · ' + reachableLabel;
    }
    return { hostId:hostId, hostName:hostName, connected:connected, botFound:!!remoteBot, model:model,
      modelConfigured:!!model, modelAvailable:modelAvailable, available:available, botAvailable:!!(remoteBot && remoteBot.available === true),
      toolsEnabled:!!(remoteBot && remoteBot.toolsEnabled === true), status:status, stateLabel:stateLabel,
      summary:summary, title:title, desktopArtifactSupported:capabilities.indexOf('workspace-file-verification') >= 0 };
  };
  var draftsForHost = function (st, hostId) {
    var key = String(hostId || '');
    if (!st.draftsByHost || typeof st.draftsByHost !== 'object') {
      st.draftsByHost = Object.create(null);
      var legacy = {};
      if (st.taskDraft !== undefined) legacy.instruction = String(st.taskDraft);
      if (st.artifactNameDraft !== undefined) legacy.artifactName = String(st.artifactNameDraft);
      if (st.artifactContentDraft !== undefined) legacy.artifactContent = String(st.artifactContentDraft);
      if (st.artifactOpen === true) legacy.artifactOpen = true;
      if (Object.keys(legacy).length) st.draftsByHost[key] = legacy;
    }
    if (!st.draftsByHost[key]) st.draftsByHost[key] = {};
    return st.draftsByHost[key];
  };
  var utf8Length = function (value) {
    return encodeURIComponent(value).replace(/%[0-9a-f]{2}/gi, 'x').length;
  };
  var apply = function (st, result) {
    var value = statusValue(result) || {};
    if (value.botId && String(value.botId) !== String(st.botId) || value.screenDriverId && value.screenDriverId !== 'linux-desktop') return false;
    if (result && result.ok === false) { st.error = result.message || result.reason || tr("云桌面状态不可用", "Cloud desktop status is unavailable"); return false; }
    var identityChanged = ['hostId','screenDriverId','screenId'].some(function (key) { return value[key] !== undefined && value[key] !== st[key]; });
    if (!identityChanged && (value.generation !== undefined && value.generation < st.generation ||
        (value.generation === undefined || value.generation === st.generation) && value.inputRevision !== undefined && value.inputRevision < st.inputRevision)) return false;
    if (identityChanged || value.generation !== undefined && value.generation !== st.generation ||
        value.inputRevision !== undefined && value.inputRevision !== st.inputRevision || value.running === false) st.shot = null;
    if (identityChanged || value.running === false) { st.files = []; st.filesLoaded = false; st.filesNotice = ''; }
    if (identityChanged) { st.driver = null; st.previewSupported = false; }
    if (value.hostId !== undefined) st.hostId = value.hostId || '';
    if (value.screenDriverId !== undefined) st.screenDriverId = value.screenDriverId || 'linux-desktop';
    if (value.screenId !== undefined) st.screenId = value.screenId || '';
    ['generation','inputRevision','running','owner','desktopEnabled','cleanupRequired','permissionRevision','available','configured','blocked','reason','title'].forEach(function (key) { if (value[key] !== undefined) st[key] = value[key]; });
    if (value.driver) st.driver = value.driver;
    if (value.description) st.description = value.description;
    st.statusAt = Date.now();
    if (value.reason && value.available === false) st.error = value.reason;
    else if (!value.reason) st.error = '';
    return true;
  };
  var request = function (st, operation, extra) {
    var api = bridge();
    if (!api || typeof api.desktopRequest !== 'function') return Promise.reject(new Error(tr("当前版本没有云桌面接口", "This version has no cloud desktop interface")));
    var needsInputRevision = operation === 'input' || operation === 'launch' || operation === 'control' || operation === 'close' || operation === 'files' || operation === 'preview';
    var body = { botId: st.botId, operation: operation, screenDriverId:'linux-desktop' };
    if (operation !== 'status' && operation !== 'permission') Object.assign(body, target(st, needsInputRevision));
    if (operation === 'permission' && st.hostId) body.hostId = st.hostId;
    // The desktop driver is a separate target from the browser screen that
    // owns this card, even while the first status request is in flight.
    body.screenDriverId = 'linux-desktop';
    return api.desktopRequest(Object.assign(body, extra || {}));
  };
  var connectionFailed = function (st, message) {
    st.error = message || tr("云桌面连接中断", "Cloud desktop connection interrupted");
    st.shot = null; st.captureAt = 0;
    // Replies issued before this failure cannot become input authority after
    // a later status recovery. Let that recovery request a fresh capture.
    ++st.requestToken; ++st.previewToken; st.loading = false; st.previewPending = false;
    st.recoveryNeeded = true;
    st.pollFailures = Math.min(3, Number(st.pollFailures || 0) + 1);
  };
  var refresh = function (st, repaint) {
    if (st.busy) return Promise.resolve(st);
    st.busy = true;
    return Promise.resolve().then(function () { return request(st, 'status'); }).then(function (r) {
      if (r && r.ok === true && apply(st, r)) {
        st.recoveryNeeded = false;
        st.previewSupported = statusValue(r).previewSupported === true;
        if (!st.running) st.pollFailures = 0;
      } else connectionFailed(st, r && (r.message || r.reason) || st.error || tr("云桌面状态读取失败", "Could not read cloud desktop status"));
    }).catch(function (e) { connectionFailed(st, e.message || tr("云桌面状态读取失败", "Could not read cloud desktop status")); }).then(function () {
      st.statusAt = Date.now(); st.busy = false;
      if (repaint) repaint(); return st;
    });
  };
  var capture = function (st, repaint) {
    if (st.loading || st.busy || st.pendingClick || st.recoveryNeeded || !st.running) return Promise.resolve(st);
    var token = ++st.requestToken, requested = target(st, true); st.loading = true;
    return Promise.resolve().then(function () {
      if (token !== st.requestToken) return null;
      return request(st, 'capture');
    }).then(function (r) {
      // Keep the frame the user actually clicked while distinguishing a
      // single click from a double click. A repaint would dispose its timer.
      if (token !== st.requestToken || st.pendingClick || st.recoveryNeeded) return;
      if (!r || r.ok !== true) throw new Error((r && r.message) || tr("截图失败", "Screenshot failed"));
      var shot = r.shot && typeof r.shot === 'object' ? r.shot : r;
      var frame = Object.assign({}, shot);
      ['hostId','screenDriverId','screenId','generation','inputRevision'].forEach(function (key) {
        if (r[key] !== undefined) frame[key] = r[key];
      });
      var stale = ['hostId','screenDriverId','screenId','generation'].some(function (key) {
        return frame[key] === undefined || frame[key] !== requested[key] || frame[key] !== st[key];
      });
      if (stale || !st.running || !Number.isSafeInteger(frame.inputRevision) ||
          frame.inputRevision < st.inputRevision || frame.inputRevision < requested.inputRevision || !apply(st, frame)) return;
      st.previewSequence = 0; st.shot = frame; st.captureAt = Date.now(); st.error = ''; st.pollFailures = 0;
    }).catch(function (e) {
      if (token === st.requestToken) {
        connectionFailed(st, e.message || tr("截图失败", "Screenshot failed"));
        if (repaint && !st.pendingClick) repaint();
      }
    }).then(function () { if (token === st.requestToken) { st.loading = false; if (repaint && !st.pendingClick) repaint(); } return st; });
  };
  var preview = function (st, repaint) {
    if (st.previewSupported !== true || st.previewPending || st.loading || st.busy || st.pendingClick || st.recoveryNeeded || !st.running) return Promise.resolve(st);
    var token = ++st.previewToken, boundary = st.requestToken, requested = target(st, true);
    var previousSequence = Number(st.previewSequence || 0), updated = false; st.previewPending = true;
    return Promise.resolve().then(function () {
      if (token !== st.previewToken || boundary !== st.requestToken) return null;
      return request(st, 'preview');
    }).then(function (r) {
      if (token !== st.previewToken || boundary !== st.requestToken || st.pendingClick || st.recoveryNeeded) return;
      if (!r || r.ok !== true) throw new Error((r && r.message) || tr('桌面画面读取失败', 'Desktop preview failed'));
      var frame = Object.assign({}, r.shot && typeof r.shot === 'object' ? r.shot : r);
      ['hostId','screenDriverId','screenId','generation','inputRevision'].forEach(function (key) {
        if (r[key] !== undefined) frame[key] = r[key];
      });
      var stale = ['hostId','screenDriverId','screenId','generation','inputRevision'].some(function (key) {
        return frame[key] === undefined || frame[key] !== requested[key] || frame[key] !== st[key];
      });
      if (stale || !st.running || !Number.isSafeInteger(frame.previewSequence) || frame.previewSequence <= previousSequence ||
          frame.previewSequence <= Number(st.previewSequence || 0) || !apply(st, frame)) return;
      st.previewSequence = frame.previewSequence; st.shot = frame; st.captureAt = Date.now(); st.error = ''; st.pollFailures = 0; updated = true;
    }).catch(function (e) {
      if (token === st.previewToken && boundary === st.requestToken) {
        connectionFailed(st, e.message || tr('桌面画面读取失败', 'Desktop preview failed'));
        if (repaint && !st.pendingClick) repaint();
      }
    }).then(function () {
      if (token === st.previewToken) {
        st.previewPending = false;
        if (updated && repaint && !st.pendingClick && boundary === st.requestToken) repaint();
      }
      return st;
    });
  };
  // Reconcile read-only status before observing again. Recovery never reopens
  // a session, takes control, or repeats an input/file transfer.
  var observe = function (st, repaint, checkStatus) {
    if (!checkStatus && !st.recoveryNeeded && st.available && !st.blocked) return capture(st, repaint);
    return refresh(st, null).then(function () {
      if (!st.recoveryNeeded && st.running && st.available && !st.blocked) return capture(st, repaint);
      if (repaint) repaint();
      return st;
    });
  };
  var html = function (opts) {
    opts = opts || {}; var b = opts.bot || {}, st = stateFor(b.id, opts.state), remote = b.executionLocation === 'node' || st.remote === true;
    if (!remote) return '';
    var remoteStatus = opts.remoteStatus || null;
    var currentHostId = String(remoteStatus && remoteStatus.hostId || st.hostId || b.nodeHostId || '');
    var draft = draftsForHost(st, currentHostId);
    var taskDraft = draft.instruction !== undefined ? String(draft.instruction) : '';
    var artifactNameDraft = draft.artifactName !== undefined ? String(draft.artifactName) : '';
    var artifactContentDraft = draft.artifactContent !== undefined ? String(draft.artifactContent) : '';
    var d = st.driver || {}, hasStatus = st.statusAt > 0, blocked = st.blocked === true || d.blocked === true, available = hasStatus ? st.available === true : st.available === true || d.available === true, configured = st.configured === true || d.configured === true, sessionReady = st.running === true && available && !blocked && st.cleanupRequired !== true, ready = sessionReady && !st.recoveryNeeded;
    var status = st.cleanupRequired === true ? tr('待重试关闭','Close retry needed') : st.recoveryNeeded ? tr('连接待恢复','Connection recovery needed') : ready ? (st.owner === 'human' ? tr('人工接管','Human control') : tr('bot 控制','Bot control')) : available ? tr('已连接，未启动','Connected, not started') : configured ? tr('待检查','Check needed') : tr('节点未提供','Not provided by node');
    var mark = st.recoveryNeeded ? 'error' : ready ? 'ready' : (st.busy || st.loading ? 'loading' : st.error ? 'error' : 'idle');
    var placeholderTitle = st.cleanupRequired ? tr('桌面关闭待确认','Desktop closure unconfirmed') : st.recoveryNeeded ? tr('等待桌面连接恢复','Waiting for desktop reconnection') : available ? (ready ? tr('等待桌面截图','Waiting for a screenshot') : tr('云桌面尚未启动','Cloud desktop is not running')) : tr('云端桌面不可用','Cloud desktop unavailable');
    var placeholderNote = st.cleanupRequired ? tr('点击“重试关闭”核对并清理当前会话。','Click “Retry close” to check and clean up the current session.') : st.recoveryNeeded ? tr('正在重新检查连接，也可点击“刷新状态”重试。','Rechecking the connection; you can also click “Refresh status” to retry.') : available ? tr('点击“启动桌面”创建当前主机上的独立虚拟桌面会话。','Click “Start desktop” to create an independent virtual desktop session on this host.') : d.reason || tr('当前节点尚未配置并通过桌面运行时探测。','This node has not configured and passed desktop runtime checks.');
    var frame = st.shot && st.shot.dataUrl ? '<img data-ob-desktop-img src="'+esc(st.shot.dataUrl)+'" alt="'+esc(tr('云端 Linux 桌面截图','Cloud Linux desktop screenshot'))+'">' : '<div class="ob-desktop-placeholder"><strong>'+esc(placeholderTitle)+'</strong>'+esc(st.error || placeholderNote)+'</div>';
    var permission = (available || st.desktopEnabled === true) ? '<button class="btn '+(st.desktopEnabled === true ? '' : 'primary')+'" data-ob-desktop-permission data-enabled="'+(st.desktopEnabled === true ? 'false' : 'true')+'" '+(st.busy || (!available && st.desktopEnabled !== true) ? 'disabled' : '')+'>'+esc(st.desktopEnabled === true ? tr('关闭桌面权限','Revoke desktop access') : tr('开启桌面权限','Allow desktop access'))+'</button>' : '';
    var controls = available ? '<button class="btn primary" data-ob-desktop-open '+(st.running || st.busy || st.cleanupRequired ? 'disabled':'')+'>'+esc(tr('启动桌面','Start desktop'))+'</button><button class="btn" data-ob-desktop-refresh '+(st.busy ? 'disabled':'')+'>'+esc(tr('刷新状态','Refresh status'))+'</button>'+permission : '<button class="btn" data-ob-desktop-refresh '+(st.busy ? 'disabled':'')+'>'+esc(tr('重新检查','Check again'))+'</button>'+permission;
    var frameActionDisabled = st.busy || st.loading || !hasFrame(st);
    if (sessionReady) controls += '<button class="btn" data-ob-desktop-control="'+(st.owner === 'human' ? 'release' : 'takeover')+'" '+(frameActionDisabled ? 'disabled' : '')+'>'+esc(st.owner === 'human' ? tr('交还 Bot','Return to Bot') : tr('接管桌面','Take control'))+'</button><button class="btn" data-ob-desktop-capture '+(st.busy || st.loading ? 'disabled' : '')+'>'+esc(tr('刷新预览','Refresh preview'))+'</button><button class="btn danger" data-ob-desktop-close '+(st.busy ? 'disabled' : '')+'>'+esc(tr('关闭桌面','Close desktop'))+'</button>';
    else if (st.cleanupRequired === true) controls += '<button class="btn danger" data-ob-desktop-retry-close '+(st.busy ? 'disabled' : '')+'>'+esc(tr('重试关闭','Retry close'))+'</button>';
    var disabled = !(ready && st.owner === 'human' && hasFrame(st) && !st.loading && !st.busy);
    var dispatchEnabled = st.desktopEnabled === true && !st.cleanupRequired && !st.recoveryNeeded && !st.busy;
    // A stale execution row can drop this Bot while the live desktop reply
    // still reports the node's driver; that live capability keeps the
    // artifact verification form available instead of claiming the node
    // never reported it.
    var liveArtifact = !!(d.capabilities && d.capabilities.indexOf('workspace-file-verification') >= 0);
    var artifactSupported = remoteStatus
      ? remoteStatus.desktopArtifactSupported === true || liveArtifact
      : liveArtifact;
    var selectedKey = st.selectedKey && keys.indexOf(st.selectedKey) >= 0 ? st.selectedKey : keys[0];
    var draftText = st.draftText !== undefined ? st.draftText : '';
    var taskNotice = st.taskId && st.taskHostId && st.taskHostId !== st.hostId ? tr('任务已在原节点提交，请到任务面板核对。','Task submitted on the original node. Check the task panel.') : st.taskNotice;
    var keyOptions = keys.map(function (key) { return '<option value="'+esc(key)+'"'+(key === selectedKey ? ' selected' : '')+'>'+esc(key)+'</option>'; }).join('');
    var files = Array.isArray(st.files) && st.files.length ? st.files.map(function (file) { return '<div class="ob-desktop-file-row"><span class="ob-desktop-file-name" title="'+esc(file.name)+'">'+esc(file.name)+'</span><span class="ob-desktop-file-meta">'+esc(file.size)+' B</span><button type="button" data-ob-desktop-save="'+esc(file.name)+'" '+(disabled ? 'disabled' : '')+'>'+esc(tr('保存','Save'))+'</button></div>'; }).join('') : '<div class="ob-desktop-note">'+esc(st.filesLoaded ? tr('工作目录暂无文件。','The working directory is empty.') : tr('尚未读取工作目录，点击“刷新文件”查看。','Click “Refresh files” to read the working directory.'))+'</div>';
    var remoteSummary = remoteStatus ? remoteStatus.summary : '';
    var desktopSubtitle = st.previewSupported === true
      ? tr('共享主机上的独立虚拟桌面 · 约 2 帧/秒只读观看 · 受控输入','An independent virtual desktop on a shared host · Read-only viewing at about 2 fps · Controlled input')
      : tr('共享主机上的独立虚拟桌面 · 通过截图与受控输入操作','An independent virtual desktop on a shared host · Operated through screenshots and controlled input');
    var contextLine = remoteSummary ? '<div class="ob-desktop-subtitle" title="'+esc(remoteStatus.title || remoteSummary)+'">'+esc(remoteSummary)+'</div>' : '';
    var artifactMarkup = artifactSupported
      ? '<details class="ob-desktop-artifact" data-ob-desktop-artifact-details'+(draft.artifactOpen ? ' open' : '')+'><summary>'+esc(tr('保存后核验（可选）','Verify a saved file (optional)'))+'</summary>'
        + '<div class="ob-desktop-artifact-form"><p>'+esc(tr('填写工作目录中的文件名和预期 UTF-8 内容；完成时会逐字节核对。内容可为空，最多 1 MiB，换行也会参与核验。','Enter a working-directory filename and expected UTF-8 contents. Completion is checked byte for byte; contents may be empty and can include line breaks (1 MiB max).'))+'</p>'
        + '<label>'+esc(tr('文件名','Filename'))+'<input type="text" maxlength="160" data-ob-desktop-artifact-name value="'+esc(artifactNameDraft)+'" placeholder="'+esc(tr('例如：报告.txt','e.g. report.txt'))+'" '+(dispatchEnabled ? '' : 'disabled')+'></label>'
        + '<label>'+esc(tr('预期文件内容','Expected file contents'))+'<textarea data-ob-desktop-artifact-content maxlength="1048576" '+(dispatchEnabled ? '' : 'disabled')+'>'+esc(artifactContentDraft)+'</textarea></label></div></details>'
      : '<div class="ob-desktop-artifact-unavailable" role="note">'+esc(tr('当前节点未报告文件完成核验能力；此选项不可用。','This node does not report file completion verification; this option is unavailable.'))+'</div>';
    return '<section class="ob-desktop-workbench" data-ob-desktop data-bot-id="'+esc(b.id)+'" aria-label="'+esc(tr('云端 Linux 桌面','Cloud Linux desktop'))+'">'
      + '<div class="ob-desktop-head"><div><div class="ob-desktop-title">'+esc(tr('云端 Linux 桌面','Cloud Linux desktop'))+'</div>'+contextLine+'<div class="ob-desktop-subtitle">'+esc(desktopSubtitle)+'</div></div><span class="ob-desktop-runtime"><i class="ob-desktop-runtime-mark" data-state="'+mark+'"></i>'+esc(status)+'</span></div>'
      + '<div class="ob-desktop-toolbar">'+controls+'<button class="btn" data-ob-desktop-launch="editor" '+(ready && !st.busy?'':'disabled')+'>'+esc(tr('编辑器','Editor'))+'</button><button class="btn" data-ob-desktop-launch="files" '+(ready && !st.busy?'':'disabled')+'>'+esc(tr('文件管理器','File manager'))+'</button><button class="btn" data-ob-desktop-launch="browser" '+(ready && !st.busy?'':'disabled')+'>'+esc(tr('浏览器','Browser'))+'</button></div>'
      + '<div class="ob-desktop-frame" data-busy="'+(st.loading?'true':'false')+'">'+frame+'</div>'
      + '<div class="ob-desktop-meta"><span class="'+(st.error || st.actionNotice?'error':'')+'">'+esc(st.error || st.actionNotice || (st.captureAt ? tr('画面来自当前会话 · 可点击画面发送坐标','Current session screenshot · Click the preview to send coordinates') : tr('观看不会自动接管桌面','Viewing does not take control')) )+'</span><span>'+esc(ready ? '1280 × 820' : tr('未启动','Not started'))+'</span></div>'
      + '<div class="ob-desktop-controls"><div class="ob-desktop-key-row"><select data-ob-desktop-key aria-label="'+esc(tr('云桌面快捷键','Cloud desktop shortcut'))+'" '+(disabled?'disabled':'')+'>'+keyOptions+'</select><button class="btn" data-ob-desktop-send-key '+(disabled?'disabled':'')+'>'+esc(tr('发送按键','Send key'))+'</button></div></div>'
      + '<div class="ob-desktop-input-row"><textarea data-ob-desktop-text placeholder="'+esc(tr('接管后输入 UTF-8 文本到当前应用','Take control to enter UTF-8 text in the current app'))+'" '+(disabled?'disabled':'')+'>'+esc(draftText)+'</textarea><button class="btn" data-ob-desktop-send-text '+(disabled?'disabled':'')+'>'+esc(tr('粘贴文本','Paste text'))+'</button></div>'
      + '<div class="ob-desktop-files"><div class="ob-desktop-files-head"><span class="ob-desktop-files-title">'+esc(tr('云端工作目录','Cloud working directory'))+'</span><span><button class="btn" data-ob-desktop-files '+(ready && !st.busy?'':'disabled')+'>'+esc(tr('刷新文件','Refresh files'))+'</button><button class="btn" data-ob-desktop-import '+(disabled?'disabled':'')+'>'+esc(tr('导入文件','Import file'))+'</button></span></div><div class="ob-desktop-file-list">'+files+'</div><div class="ob-desktop-note" role="status">'+esc(st.filesNotice || '')+'</div></div>'
      + '<div class="ob-desktop-task"><div class="ob-desktop-task-row"><input data-ob-desktop-task value="'+esc(taskDraft)+'" placeholder="'+esc(tr('交给云桌面 Bot 的任务，例如：打开编辑器保存一份说明','Give the cloud desktop Bot a task, e.g. save a note in the editor'))+'" '+(dispatchEnabled ? '' : 'disabled')+'><button class="btn" data-ob-desktop-dispatch '+(dispatchEnabled ? '' : 'disabled')+'>'+esc(tr('派发桌面任务','Dispatch desktop task'))+'</button></div><div class="ob-desktop-task-status" data-ob-desktop-task-status role="status">'+esc(taskNotice || tr('任务状态由现有审批与任务面板返回。','See the approval and task panels for task status.'))+'</div>'+artifactMarkup+'</div>'
      + '<div class="ob-desktop-note">'+esc(tr('桌面权限独立于浏览器权限；查看不会接管，输入前需要明确接管。每次操作都绑定当前截图版本。','Desktop access is separate from browser access. Take control before entering input. Each operation uses the current screenshot version.'))+'</div></section>';
  };
  var bind = function (root, bot, options) {
    options = options || {}; var card = root && root.querySelector('[data-ob-desktop][data-bot-id="'+String(bot.id).replace(/"/g,'')+'"]'); if (!card) return;
    if (card.__obDesktopBinding && typeof card.__obDesktopBinding.dispose === 'function') card.__obDesktopBinding.dispose();
    var listeners = [], listen = function (targetNode, eventName, handler) {
      if (!targetNode || typeof targetNode.addEventListener !== 'function') return;
      targetNode.addEventListener(eventName, handler);
      listeners.push(function () { targetNode.removeEventListener(eventName, handler); });
    };
    var st = stateFor(bot.id, options.state), remoteStatus = options.remoteStatus || null,
      currentHostId = String(remoteStatus && remoteStatus.hostId || st.hostId || bot.nodeHostId || ''),
      draft = draftsForHost(st, currentHostId), d = st.driver || {},
      liveArtifact = !!(d.capabilities && d.capabilities.indexOf('workspace-file-verification') >= 0),
      artifactSupported = remoteStatus
        ? remoteStatus.desktopArtifactSupported === true || liveArtifact
        : liveArtifact,
      repaint = options.rerender || function () {}, timer = card.__obTimer;
    var selectedKey = st.selectedKey && keys.indexOf(st.selectedKey) >= 0 ? st.selectedKey : keys[0];
    var draftText = st.draftText !== undefined ? st.draftText : '';
    var taskDraft = draft.instruction !== undefined ? String(draft.instruction) : '';
    if (timer) clearTimeout(timer);
    var rerender = function () {
      if (document.body.contains(card)) { repaint(); return; }
      // An action receipt can replace the card before its follow-up capture
      // returns. Paint the current binding instead of waiting for another poll.
      var current = bindings[String(bot.id)];
      if (current && current.repaint !== rerender) current.repaint();
    };
    var run = function (fn, mutation, input, screenReceipt) {
      if (st.busy) return Promise.resolve({ ok:false, pending:true });
      st.busy = true;
      if (mutation) { ++st.requestToken; ++st.previewToken; st.loading = false; st.previewPending = false; }
      return Promise.resolve().then(fn).catch(function (e) {
        return { ok:false, message:e.message || tr("云桌面操作失败", "Cloud desktop operation failed"), code:e.code, receiptUnconfirmed:true,
          actionApplied:input === true || e.actionApplied === true,
          requiresObservation:input === true || e.requiresObservation === true };
      }).then(function (r) {
        if (!r || r.ok !== true) {
          r = r || { ok:false, message:tr("云桌面操作失败", "Cloud desktop operation failed"), receiptUnconfirmed:true };
          if (!r.canceled) st.error = r.message || tr("云桌面操作失败", "Cloud desktop operation failed");
          if (r.actionApplied || r.requiresObservation) {
            st.shot = null; st.captureAt = 0;
            st.actionNotice = (r.message || tr("操作回执未确认", "Operation acknowledgement unconfirmed")) + tr("；操作可能已执行，请核对画面后再继续。", "; the operation may have run. Check the preview before continuing.");
          }
          return r;
        }
        if (screenReceipt !== false) {
          if (!apply(st, r)) return { ok:false, message:tr("桌面已变化，请刷新后重试", "The desktop has changed. Refresh before trying again.") };
          st.recoveryNeeded = false;
          if (!st.running) st.pollFailures = 0;
        }
        if (input || st.running === false) st.actionNotice = '';
        return r;
      }).finally(function () { st.busy = false; rerender(); });
    };
    var schedule = function () {
      if (disposed || document.hidden || !document.body.contains(card)) return;
      clearTimeout(card.__obTimer);
      var delay = st.running && !st.recoveryNeeded ? (st.previewSupported === true ? 500 : 2000) * Math.pow(2, Math.min(3, Number(st.pollFailures || 0)))
        : st.recoveryNeeded ? 2000 * Math.pow(2, Math.min(3, Number(st.pollFailures || 0))) : 10000;
      card.__obTimer = setTimeout(function () {
        card.__obTimer = 0;
        if (disposed || document.hidden || !document.body.contains(card)) return;
        var pending = !st.busy && !st.pendingClick
          ? (st.running && !st.recoveryNeeded && st.previewSupported === true ? preview(st, rerender) : observe(st, rerender, !st.running)) : Promise.resolve(st);
        pending.finally(schedule);
      }, delay);
    };
    // A status request may already be in flight when the host rerenders the
    // same Bot card. Do not turn that pending request into a synchronous
    // rebind loop; the owner of the in-flight request will repaint once.
    var needsInitialStatus = !st.busy && !st.recoveryNeeded && (!st.statusAt || (Date.now() - st.statusAt > 1500));
    var initial = (needsInitialStatus ? refresh(st, null) : Promise.resolve(st)).then(function () { if (needsInitialStatus && st.running) return capture(st, rerender); if (needsInitialStatus) rerender(); }).finally(schedule); if (initial && typeof initial.catch === 'function') initial.catch(function () {});
    var q = function (operation, extra) { return run(function () { return request(st, operation, extra); }, operation !== 'files', operation === 'input' || operation === 'launch'); };
    var observeAfter = function (r) { if (r && (r.ok === true || r.actionApplied || r.requiresObservation)) return capture(st, rerender); };
    listen(card.querySelector('[data-ob-desktop-open]'), 'click', function () { q('open').then(observeAfter); });
    listen(card.querySelector('[data-ob-desktop-refresh]'), 'click', function () { observe(st, rerender, true); });
    listen(card.querySelector('[data-ob-desktop-capture]'), 'click', function () { observe(st, rerender); });
    var preserveCloseError = function (message) {
      var error = message || st.error || tr("桌面关闭未确认，请重试关闭", "Desktop closure is unconfirmed. Retry closing it.");
      return refresh(st, function () { st.error = error; repaint(); });
    };
    var closeDesktop = function () {
      q('close').then(function (r) {
        if (r.ok === true) { st.running=false; st.shot=null; st.cleanupRequired = r.cleanupRequired === true; st.captureAt=0; rerender(); }
        else preserveCloseError(r.message || st.error);
      });
    };
    listen(card.querySelector('[data-ob-desktop-close]'), 'click', closeDesktop);
    listen(card.querySelector('[data-ob-desktop-retry-close]'), 'click', closeDesktop);
    listen(card.querySelector('[data-ob-desktop-control]'), 'click', function (event) { var command=event.currentTarget.dataset.obDesktopControl; q('control', { command:command }).then(function (r) { if (r.ok === true && command === 'takeover') capture(st, rerender); }); });
    listen(card.querySelector('[data-ob-desktop-permission]'), 'click', function (event) { if (st.busy) return; var enabled = event.currentTarget.dataset.enabled === 'true'; var prompt = enabled ? tr("开启云端桌面权限后，这个 Bot 可以在共享主机上的独立虚拟桌面操作完整桌面。是否继续？", "Allow this Bot to operate a full desktop in an independent virtual desktop on the shared host?") : tr("关闭云端桌面权限后，桌面输入、应用启动和桌面任务会停止。是否继续？", "Revoke desktop access? Desktop input, app launches and desktop tasks will stop."); if (!window.confirm(prompt)) return; q('permission',{enabled:enabled,permissionRevision:Number(st.permissionRevision||0)}).then(function(r){ if (r.ok === true && !enabled) { st.running=false; st.owner='agent'; st.shot=null; st.captureAt=0; } rerender(); }); });
    Array.prototype.forEach.call(card.querySelectorAll('[data-ob-desktop-launch]'), function (button) { listen(button, 'click', function () { if (st.busy) return; if (!hasFrame(st)) { st.error=tr("请先刷新当前桌面截图", "Refresh the current desktop screenshot first"); rerender(); return; } q('launch',{app:button.dataset.obDesktopLaunch}).then(observeAfter); }); });
    var img=card.querySelector('[data-ob-desktop-img]'); if (img) {
      var clickTimer=0;
      var clickAt=function(event, button, clickCount){ if (st.busy || st.owner !== 'human' || !hasFrame(st)) return; var box=img.getBoundingClientRect(), shot=st.shot||{}; if(!box.width||!box.height)return; q('input',{action:{type:'click',button:button||'left',clickCount:clickCount||1,x:Math.round((event.clientX-box.left)*(Number(shot.width||1280)/box.width)),y:Math.round((event.clientY-box.top)*(Number(shot.height||820)/box.height))}}).then(observeAfter); };
      var clickLeft=function(event){
        if (st.busy || st.owner !== 'human' || !hasFrame(st)) return;
        var snapshot={clientX:event.clientX,clientY:event.clientY};
        clearTimeout(clickTimer);
        if (event.detail >= 2) { clickTimer=0; st.pendingClick=false; clickAt(snapshot,'left',2); return; }
        st.pendingClick=true;
        clickTimer=setTimeout(function(){clickTimer=0;st.pendingClick=false;clickAt(snapshot,'left',1);},500);
      };
      listen(img, 'click', clickLeft);
      listen(img, 'contextmenu', function(e){e.preventDefault();clearTimeout(clickTimer);clickTimer=0;st.pendingClick=false;clickAt(e,'right',1);});
      listeners.push(function(){clearTimeout(clickTimer);st.pendingClick=false;});
    }
    var keyInput = card.querySelector('[data-ob-desktop-key]');
    if (keyInput) { keyInput.value = selectedKey; listen(keyInput, 'change', function () { st.selectedKey = keyInput.value; }); }
    var textInput = card.querySelector('[data-ob-desktop-text]');
    if (textInput) { textInput.value = draftText; listen(textInput, 'input', function () { st.draftText = textInput.value; }); }
    var taskInput = card.querySelector('[data-ob-desktop-task]');
    if (taskInput) { taskInput.value = taskDraft; listen(taskInput, 'input', function () { draft.instruction = taskInput.value; st.taskDraft = taskInput.value; }); }
    var artifactDetails = card.querySelector('[data-ob-desktop-artifact-details]');
    if (artifactDetails) {
      artifactDetails.open = draft.artifactOpen === true;
      listen(artifactDetails, 'toggle', function () { draft.artifactOpen = artifactDetails.open === true; st.artifactOpen = artifactDetails.open === true; });
    }
    var artifactNameInput = card.querySelector('[data-ob-desktop-artifact-name]');
    if (artifactNameInput) {
      artifactNameInput.value = draft.artifactName !== undefined ? String(draft.artifactName) : '';
      listen(artifactNameInput, 'input', function () { draft.artifactName = artifactNameInput.value; st.artifactNameDraft = artifactNameInput.value; });
    }
    var artifactContentInput = card.querySelector('[data-ob-desktop-artifact-content]');
    if (artifactContentInput) {
      artifactContentInput.value = draft.artifactContent !== undefined ? String(draft.artifactContent) : '';
      listen(artifactContentInput, 'input', function () { draft.artifactContent = artifactContentInput.value; st.artifactContentDraft = artifactContentInput.value; });
    }
    listen(card.querySelector('[data-ob-desktop-send-key]'), 'click', function(){if(st.busy||!hasFrame(st))return;var select=card.querySelector('[data-ob-desktop-key]'); if(select) { st.selectedKey = select.value; q('input',{action:{type:'key',key:select.value}}).then(observeAfter); }});
    listen(card.querySelector('[data-ob-desktop-send-text]'), 'click', function(){if(st.busy||!hasFrame(st))return;var text=card.querySelector('[data-ob-desktop-text]'); if(!text||!text.value)return; var sentText=text.value; st.draftText = sentText; q('input',{action:{type:'type',text:sentText}}).then(function(r){if(r.ok===true&&st.draftText===sentText){if(text.value===sentText)text.value='';st.draftText='';}return observeAfter(r);});});
    var loadFiles = function () {
      var notice = st.filesNotice;
      return q('files').then(function (r) {
        if (r.ok === true && (Array.isArray(r.files) || Array.isArray(r.data))) {
          st.files = Array.isArray(r.files) ? r.files : r.data; st.filesLoaded = true;
        } else if (!r.canceled && !r.pending) st.filesNotice = (notice ? notice+tr("。", ". ") : '')+(r.message || tr("未能读取工作目录，请重试刷新文件。", "Could not read the working directory. Refresh files to try again."));
        rerender(); return r;
      });
    };
    listen(card.querySelector('[data-ob-desktop-files]'), 'click', function(){if(st.busy)return;st.filesNotice='';loadFiles();});
    Array.prototype.forEach.call(card.querySelectorAll('[data-ob-desktop-save]'),function(button){listen(button, 'click', function(){
      var api=bridge();
      if(api&&api.desktopSaveFile) run(function(){return api.desktopSaveFile({botId:bot.id,name:button.dataset.obDesktopSave,hostId:st.hostId,screenDriverId:'linux-desktop',screenId:st.screenId,generation:st.generation,inputRevision:st.inputRevision});},false,false,false).then(function(r){
        if (r.ok === true) st.filesNotice=tr("已保存 ", "Saved ")+(r.name || button.dataset.obDesktopSave);
        else if (!r.canceled && !r.pending) st.filesNotice=r.message || tr("文件保存未确认。", "File save is unconfirmed.");
        rerender();
      });
    });});
    listen(card.querySelector('[data-ob-desktop-import]'), 'click', function(){
      var api=bridge();
      if(api&&api.desktopSelectFile) run(function(){return api.desktopSelectFile(Object.assign({botId:bot.id},target(st,true)));},true,true).then(function(r){
        if (r.ok === true) {
          st.filesNotice=tr("已导入 ", "Imported ")+(r.name || tr("文件", "file"));
          return loadFiles().then(function(){return observeAfter(r);});
        }
        return observeAfter(r);
      });
    });
    listen(card.querySelector('[data-ob-desktop-dispatch]'), 'click', function(){
      if(st.busy || st.recoveryNeeded)return;
      var input=card.querySelector('[data-ob-desktop-task]'),out=card.querySelector('[data-ob-desktop-task-status]');
      if(!input||!input.value.trim())return;
      var api=bridge();if(!api||!api.dispatchTask)return;
      var instruction=input.value.trim(), submittedHost=currentHostId || st.hostId;
      var artifactName=artifactNameInput ? String(artifactNameInput.value || '') : '';
      var artifactContent=artifactContentInput ? String(artifactContentInput.value || '') : '';
      var desktopArtifact;
      if (artifactSupported && artifactName.trim()) {
        if (artifactName.length > 160 || artifactName.charAt(0) === '.' || /[/\\\0-\x1f\x7f]/.test(artifactName)) {
          st.taskNotice=tr('文件名必须是工作目录中的单个名称，最多 160 个字符且不能以点开头。','Use one filename from the working directory, up to 160 characters, and do not start it with a dot.');
          if(out)out.textContent=st.taskNotice;
          return;
        }
        var expectedBytes;
        try { expectedBytes=utf8Length(artifactContent); } catch (_) { expectedBytes=-1; }
        if (expectedBytes < 0) {
          st.taskNotice=tr('预期内容含有无效的 UTF-8 字符。','Expected contents contain invalid Unicode characters.');
          if(out)out.textContent=st.taskNotice;
          return;
        }
        if (expectedBytes > 1024 * 1024) {
          st.taskNotice=tr('预期 UTF-8 内容不能超过 1 MiB。','Expected UTF-8 contents must not exceed 1 MiB.');
          if(out)out.textContent=st.taskNotice;
          return;
        }
        desktopArtifact={name:artifactName,content:artifactContent};
      }
      st.taskId='';
      st.taskHostId='';
      st.taskNotice=tr("正在提交桌面任务…", "Submitting desktop task…");out.textContent=st.taskNotice;
      run(function(){var requestBody={botId:bot.id,hostId:submittedHost,title:tr("云端桌面任务", "Cloud desktop task"),instruction:instruction,mode:'desktop'};if(desktopArtifact)requestBody.desktopArtifact=desktopArtifact;return api.dispatchTask(requestBody);},true,false,false).then(function(r){
        var task=r&&r.task;
        if(r&&r.ok===true&&task&&task.id&&task.botId===bot.id&&task.hostId===submittedHost&&task.screenDriverId==='linux-desktop'){
          st.taskId=task.id;
          st.taskHostId=submittedHost;
          st.taskNotice=st.hostId === submittedHost ? tr("任务已提交，执行进度与结果请查看任务面板。", "Task submitted. See the task panel for progress and results.") : tr("任务已在原节点提交，请到任务面板核对。", "Task submitted on the original node. Check the task panel.");
        } else {
          st.taskNotice=r&&r.message?r.message:'';
          if (!r || r.ok !== false || r.receiptUnconfirmed || !st.taskNotice) st.taskNotice += (st.taskNotice ? tr('；','; ') : '')+tr("未确认任务提交结果，请先查看任务面板，避免重复派发。", "Task submission is unconfirmed. Check the task panel before dispatching again.");
        }
        rerender();
      });
    });
    var bindId = String(bot.id), previous = bindings[bindId];
    if (previous && typeof previous.dispose === 'function') previous.dispose();
    var onVisibility = function(){
      if (!document.body.contains(card)) { dispose(); return; }
      if (document.hidden) { clearTimeout(card.__obTimer); card.__obTimer=0; ++st.previewToken; st.previewPending=false; return; }
      observe(st,rerender,true).finally(schedule);
    };
    var disposed = false;
    var observer = typeof MutationObserver === 'function' ? new MutationObserver(function(){ if (!document.body.contains(card)) dispose(); }) : null;
    var dispose = function(){
      if (disposed) return;
      disposed = true;
      ++st.previewToken; st.previewPending = false;
      clearTimeout(card.__obTimer);
      card.__obTimer = 0;
      listeners.splice(0).forEach(function (remove) { remove(); });
      if (observer) observer.disconnect();
      if (card.__obDesktopBinding && card.__obDesktopBinding.dispose === dispose) delete card.__obDesktopBinding;
      if (bindings[bindId] && bindings[bindId].dispose === dispose) delete bindings[bindId];
    };
    bindings[bindId] = { dispose:dispose, repaint:rerender };
    listen(document, 'visibilitychange', onVisibility);
    if (observer && document.body) observer.observe(document.body, { childList:true, subtree:true });
    card.__obDesktopBinding = { dispose:dispose };
  };
  window.OpenBotDesktop = { html:html, bind:bind, stateFor:stateFor, capture:capture, preview:preview, remoteStatusForBot:remoteStatusForBot };
})();
