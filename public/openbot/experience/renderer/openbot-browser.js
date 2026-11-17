/*
 * OpenBot browser workbench.
 *
 * The renderer owns the toolbar and the read-only preview.  The main process
 * owns the BrowserWindow/WebContentsView and decides whether a command is
 * allowed.  In particular, this module never receives or forwards a file
 * path: uploads are identified by the artifact id returned by the native
 * picker.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(null, true);
  else root.OpenBotBrowser = factory(root, false);
}(typeof window !== 'undefined' ? window : this, function (root, isModule) {
  'use strict';
  function tr(zh,en){return root&&root.OpenBotI18n?root.OpenBotI18n.t(zh,en):zh;}

  var hasDocument = !isModule && root && root.document;

  function asString(value) { return value == null ? '' : String(value); }
  function esc(value) {
    return asString(value).replace(/[&<>"']/g, function (ch) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch];
    });
  }
  function firstString() {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] != null && asString(arguments[i]).trim()) return asString(arguments[i]).trim();
    }
    return '';
  }
  function icon(name) {
    var path = {
      back:'<path d="m14 5-7 7 7 7"/><path d="M7 12h11"/>',
      forward:'<path d="m10 5 7 7-7 7"/><path d="M17 12H6"/>',
      reload:'<path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M19 5v5h-5"/>',
      plus:'<path d="M12 5v14M5 12h14"/>',
      close:'<path d="m6 6 12 12M18 6 6 18"/>',
      upload:'<path d="M12 15V4"/><path d="m8 8 4-4 4 4"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
      download:'<path d="M12 4v11"/><path d="m8 11 4 4 4-4"/><path d="M5 19h14"/>',
      more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
      record:'<circle cx="12" cy="12" r="7" fill="currentColor" stroke="none"/>'
    }[name] || '';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }

  function normalizeTabs(value) {
    if (!Array.isArray(value)) return [];
    return value.map(function (tab, index) {
      tab = tab && typeof tab === 'object' ? tab : {};
      // Prefer the stable page id returned by the node browser. Renderer-only
      // fallbacks must not replace it, or subsequent tab commands can target
      // the wrong page after a state refresh.
      var id = firstString(tab.pageId, tab.id, tab.tabId, tab.ref, tab.reference);
      if (!id) id = 'tab-' + index;
      return {
        id: id,
        title: firstString(tab.title, tab.name, tab.url) || tr('新标签页',"New tab"),
        url: firstString(tab.url, tab.href),
        active: tab.active === true || tab.selected === true
      };
    });
  }

  function normalizeFiles(value) {
    if (!Array.isArray(value)) return [];
    return value.map(function (file, index) {
      file = file && typeof file === 'object' ? file : {};
      var artifactId = firstString(file.artifactId, file.id, file.ref, file.fileId);
      if (!artifactId) artifactId = 'artifact-' + index;
      return {
        artifactId: artifactId,
        name: firstString(file.name, file.filename, file.title) || tr('浏览器文件',"Browser files"),
        kind: firstString(file.kind, file.mimeType, file.type),
        direction: firstString(file.direction),
        status: firstString(file.status),
        size: file.bytes !== undefined ? file.bytes : file.size,
        downloadable: firstString(file.direction) === 'download' && firstString(file.status) === 'ready'
      };
    });
  }

  function targetOptionsForState(state) {
    state = state && typeof state === 'object' ? state : {};
    var target = {};
    ['hostId', 'screenDriverId', 'screenId', 'generation', 'inputRevision'].forEach(function (key) {
      var value = state[key];
      // A fresh renderer state carries zero-valued revision defaults, while
      // an unopened ScreenManager has no inputRevision field at all. Do not
      // turn that harmless default into a stale-screen assertion on the
      // initial browser state read. Once a session is running, zero is a
      // valid revision and must be forwarded for concurrency checks.
      if (!state.running && (key === 'generation' || key === 'inputRevision') && Number(value) === 0) return;
      if (value !== undefined && value !== null && value !== '') target[key] = value;
    });
    return target;
  }

  function clipBounds(rect, viewportWidth, viewportHeight) {
    if (!rect || typeof rect !== 'object') return null;
    var width = Math.max(1, Number(viewportWidth) || 1);
    var height = Math.max(1, Number(viewportHeight) || 1);
    var left = Math.max(0, Number(rect.left) || 0);
    var top = Math.max(0, Number(rect.top) || 0);
    var right = Math.min(width, Number(rect.right) || 0);
    var bottom = Math.min(height, Number(rect.bottom) || 0);
    if (right <= left || bottom <= top) return null;
    return {
      x:Math.round(left),
      y:Math.round(top),
      width:Math.max(1, Math.round(right - left)),
      height:Math.max(1, Math.round(bottom - top))
    };
  }

  function statusObject(raw) {
    if (!raw || typeof raw !== 'object') return {};
    if (raw.status && typeof raw.status === 'object') return raw.status;
    if (raw.browser && typeof raw.browser === 'object') return raw.browser;
    return raw;
  }

  function previewFrom(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var status = statusObject(raw);
    var shot = status.shot && typeof status.shot === 'object' ? status.shot : {};
    var preview = status.preview && typeof status.preview === 'object' ? status.preview : {};
    return firstString(
      raw.previewDataUrl, raw.dataUrl, raw.screenshot,
      status.previewDataUrl, status.dataUrl, status.screenshot,
      shot.dataUrl, shot.image, preview.dataUrl, preview.image,
      raw.image && (raw.image.dataUrl || raw.image.url),
      status.image && (status.image.dataUrl || status.image.url)
    );
  }

  function normalizeState(raw, fallback) {
    var source = statusObject(raw);
    var base = fallback && typeof fallback === 'object' ? fallback : {};
    var tabs = Array.isArray(raw && raw.tabs) ? raw.tabs : source.tabs;
    var files = Array.isArray(raw && raw.files) ? raw.files : source.files;
    var dialog = raw && raw.dialog !== undefined ? raw.dialog : source.dialog;
    var location = firstString(source.executionLocation, source.location, source.target, base.executionLocation);
    var remote = source.remote === true || raw && raw.remote === true || base.remote === true || location === 'node' || location === 'cloud' || location === 'remote';
    var running = source.running !== undefined ? !!source.running : (base.running !== undefined ? !!base.running : true);
    var owner = source.owner === 'human' || source.owner === 'agent' ? source.owner : (base.owner === 'human' ? 'human' : 'agent');
    var url = firstString(source.url, source.href, source.address, base.url);
    var title = firstString(source.title, source.pageTitle, base.title);
    var tabList = normalizeTabs(tabs);
    var activeTabId = firstString(source.activeTabId, source.activeTab, base.activeTabId);
    if (!activeTabId && tabList.length) {
      var active = tabList.filter(function (tab) { return tab.active; })[0];
      activeTabId = active ? active.id : tabList[0].id;
    }
    if (!url && activeTabId) {
      var activeTab = tabList.filter(function (tab) { return tab.id === activeTabId; })[0];
      if (activeTab) url = activeTab.url;
    }
    var state = {
      botId: firstString(source.botId, raw && raw.botId, base.botId),
      running: running,
      owner: owner,
      remote: remote,
      location: location,
      url: url,
      title: title,
      tabs: tabList.length ? tabList : normalizeTabs(base.tabs),
      activeTabId: activeTabId || base.activeTabId || '',
      files: normalizeFiles(files).length ? normalizeFiles(files) : normalizeFiles(base.files),
      dialog: dialog || null,
      previewDataUrl: previewFrom(raw) || base.previewDataUrl || '',
      embedded: raw && raw.embedded !== undefined ? !!raw.embedded : !!base.embedded,
      error: firstString(raw && raw.error, raw && raw.message && raw.ok === false ? raw.message : '', source.error, source.lastError, base.error),
      notice: firstString(source.notice, raw && raw.notice, base.notice),
      hostId: firstString(source.hostId, raw && raw.hostId, base.hostId),
      screenDriverId: firstString(source.screenDriverId, raw && raw.screenDriverId, base.screenDriverId),
      screenId: firstString(source.screenId, raw && raw.screenId, base.screenId),
      generation: source.generation !== undefined ? source.generation : (raw && raw.generation !== undefined ? raw.generation : base.generation),
      inputRevision: source.inputRevision !== undefined ? source.inputRevision : (raw && raw.inputRevision !== undefined ? raw.inputRevision : base.inputRevision),
      recordingActive: source.recordingActive !== undefined ? source.recordingActive === true : (raw && raw.recordingActive !== undefined ? raw.recordingActive === true : base.recordingActive === true),
      previewWidth: Number(source.width || source.previewWidth || (source.shot && source.shot.width) || base.previewWidth || 0) || 0,
      previewHeight: Number(source.height || source.previewHeight || (source.shot && source.shot.height) || base.previewHeight || 0) || 0,
      controlState: base.controlState || '',
      loading: base.loading === true,
      updatedAt: Date.now()
    };
    if (!state.title && state.url) state.title = state.url;
    if (!state.running && !state.previewDataUrl && !state.url) state.embedded = false;
    return state;
  }

  function normalizeAddress(value) {
    var text = asString(value).trim();
    if (!text) return { ok:false, message:tr('先输入网页地址',"Enter a web address first") };
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) text = 'https://' + text;
    try {
      var url = new URL(text);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok:false, message:tr('只支持 http 或 https 地址',"Only HTTP and HTTPS addresses are supported") };
      return { ok:true, url:url.href };
    } catch (_) {
      return { ok:false, message:tr('网页地址格式不正确',"Invalid web address") };
    }
  }

  function commandPayload(type, values) {
    var command = { type:type };
    if (values && typeof values === 'object') Object.keys(values).forEach(function (key) {
      if (values[key] !== undefined) command[key] = values[key];
    });
    return command;
  }

  function browserMarkup(options) {
    options = options || {};
    var bot = options.bot || {};
    var state = normalizeState(options.state, { botId:bot.id, owner:'agent', running:false, executionLocation:bot.executionLocation, remote:bot.executionLocation === 'node' });
    var firstTab = state.tabs[0];
    var url = state.url || (firstTab && firstTab.url) || '';
    return '<section class="ob-browser-workbench" data-openbot-browser data-bot-id="' + esc(bot.id || state.botId) + tr('" aria-label="内置浏览器" aria-busy="false">',"\" aria-label=\"Browser\" aria-busy=\"false\">")
      + '<div class="ob-browser-head">'
      +   tr('<div class="ob-browser-heading"><div class="ob-browser-title">内置浏览器</div><div class="ob-browser-subtitle" data-browser-subtitle>每个 Bot 使用自己的浏览器会话；网页任务优先在这里执行</div></div>',"<div class=\"ob-browser-heading\"><div class=\"ob-browser-title\">Browser</div><div class=\"ob-browser-subtitle\" data-browser-subtitle>Each Bot has its own browser session. Web tasks run here first.</div></div>")
      +   tr('<div class="ob-browser-runtime"><span class="ob-browser-runtime-mark" data-browser-runtime-mark></span><span data-browser-runtime-label>本机</span><span aria-hidden="true">·</span><span data-browser-state-label>Bot 控制</span></div>',"<div class=\"ob-browser-runtime\"><span class=\"ob-browser-runtime-mark\" data-browser-runtime-mark></span><span data-browser-runtime-label>Local</span><span aria-hidden=\"true\">·</span><span data-browser-state-label>Bot control</span></div>")
      + '</div>'
      + tr('<div class="ob-browser-toolbar" role="toolbar" aria-label="浏览器导航">',"<div class=\"ob-browser-toolbar\" role=\"toolbar\" aria-label=\"Browser navigation\">")
      +   tr('<button type="button" class="ob-browser-icon-button" data-browser-command="back" aria-label="后退" title="后退">',"<button type=\"button\" class=\"ob-browser-icon-button\" data-browser-command=\"back\" aria-label=\"Back\" title=\"Back\">") + icon('back') + '</button>'
      +   tr('<button type="button" class="ob-browser-icon-button" data-browser-command="forward" aria-label="前进" title="前进">',"<button type=\"button\" class=\"ob-browser-icon-button\" data-browser-command=\"forward\" aria-label=\"Forward\" title=\"Forward\">") + icon('forward') + '</button>'
      +   tr('<input class="ob-browser-address" data-browser-address aria-label="网页地址" autocomplete="url" spellcheck="false" placeholder="输入网页地址，按 Enter 打开" value="',"<input class=\"ob-browser-address\" data-browser-address aria-label=\"Web address\" autocomplete=\"url\" spellcheck=\"false\" placeholder=\"Enter a web address and press Enter\" value=\"") + esc(url) + '">'
      +   tr('<button type="button" class="ob-browser-icon-button" data-browser-command="reload" aria-label="重新载入" title="重新载入">',"<button type=\"button\" class=\"ob-browser-icon-button\" data-browser-command=\"reload\" aria-label=\"Reload\" title=\"Reload\">") + icon('reload') + '</button>'
      +   '<button type="button" class="ob-browser-action" data-browser-upload>' + icon('upload') + tr('<span>上传</span></button>',"<span>Upload</span></button>")
      +   '<div class="ob-browser-more-wrap">'
      +     tr('<button type="button" class="ob-browser-icon-button" data-browser-more aria-label="更多浏览器工具" title="更多浏览器工具" aria-haspopup="dialog" aria-expanded="false" aria-controls="browser-more-tools">',"<button type=\"button\" class=\"ob-browser-icon-button\" data-browser-more aria-label=\"More browser tools\" title=\"More browser tools\" aria-haspopup=\"dialog\" aria-expanded=\"false\" aria-controls=\"browser-more-tools\">") + icon('more') + '</button>'
      +     '<div class="ob-browser-more" id="browser-more-tools" data-browser-more-menu role="dialog" aria-label="' + esc(tr('浏览器工具','Browser tools')) + '" hidden>'
      +       '<button type="button" class="ob-browser-action primary ob-browser-record-action" data-browser-record>' + icon('record') + tr('录制当前网页','Record current page') + '</button>'
      +       '<label class="ob-browser-record-audio"><span>' + tr('音频','Audio') + '</span><select data-browser-record-audio aria-label="' + esc(tr('录制音频','Recording audio')) + '"><option value="system">' + tr('系统声音','System audio') + '</option><option value="system-and-microphone">' + tr('系统声音和麦克风','System audio and microphone') + '</option></select></label>'
      +       '<p class="ob-browser-record-note" data-browser-record-note role="status" aria-live="polite"></p>'
      +       '<button type="button" class="ob-browser-action ob-browser-record-setup" data-browser-record-setup hidden>' + tr('打开采集插件设置','Open capture plugin setup') + '</button>'
      +     '</div>'
      +   '</div>'
      + '</div>'
      + tr('<div class="ob-browser-tabs" data-browser-tabs role="tablist" aria-label="浏览器标签页"></div>',"<div class=\"ob-browser-tabs\" data-browser-tabs role=\"tablist\" aria-label=\"Browser tabs\"></div>")
      + '<div class="ob-browser-stage" data-browser-stage>'
      +   tr('<div class="ob-browser-preview" data-browser-preview data-readonly="true"><div class="ob-browser-preview-image" data-browser-preview-image role="img" aria-label="浏览器只读预览" hidden></div><div class="ob-browser-empty" data-browser-empty><strong>还没有浏览器会话</strong><span data-browser-empty-copy>输入地址后，Bot 会在自己的隔离浏览器里打开网页。</span></div><span class="ob-browser-preview-note" data-browser-preview-note hidden>Bot 控制 · 只读预览</span></div>',"<div class=\"ob-browser-preview\" data-browser-preview data-readonly=\"true\"><div class=\"ob-browser-preview-image\" data-browser-preview-image role=\"img\" aria-label=\"Read-only browser preview\" hidden></div><div class=\"ob-browser-empty\" data-browser-empty><strong>No browser session yet</strong><span data-browser-empty-copy>Enter an address to open a page in this Bot's isolated browser.</span></div><span class=\"ob-browser-preview-note\" data-browser-preview-note hidden>Bot control · Read-only preview</span></div>")
      +   tr('<div class="ob-browser-embed-host" data-browser-embed-host hidden aria-label="人工接管后的浏览器页面"></div>',"<div class=\"ob-browser-embed-host\" data-browser-embed-host hidden aria-label=\"Browser page under your control\"></div>")
      +   tr('<div class="ob-browser-dialog" data-browser-dialog hidden><div class="ob-browser-dialog-copy"><strong>网页需要确认</strong><span data-browser-dialog-message></span></div><div class="ob-browser-dialog-actions"><button type="button" class="ob-browser-action" data-browser-dialog-reject>取消</button><button type="button" class="ob-browser-action primary" data-browser-dialog-accept>允许</button></div></div>',"<div class=\"ob-browser-dialog\" data-browser-dialog hidden><div class=\"ob-browser-dialog-copy\"><strong>Page confirmation required</strong><span data-browser-dialog-message></span></div><div class=\"ob-browser-dialog-actions\"><button type=\"button\" class=\"ob-browser-action\" data-browser-dialog-reject>Cancel</button><button type=\"button\" class=\"ob-browser-action primary\" data-browser-dialog-accept>Allow</button></div></div>")
      + '</div>'
      + '<div class="ob-browser-foot">'
      +   tr('<div class="ob-browser-foot-note" data-browser-foot-note>网页任务由 Bot 执行；你可以随时接管同一浏览器会话。</div>',"<div class=\"ob-browser-foot-note\" data-browser-foot-note>Bots handle web tasks. You can take over the same browser session at any time.</div>")
      +   '<div class="ob-browser-error" data-browser-error hidden role="status" aria-live="polite"></div>'
      +   tr('<div class="ob-browser-remote-input" data-browser-remote-input hidden><input type="text" data-browser-remote-field aria-label="发送到远程浏览器" placeholder="接管后输入到远程浏览器"><button type="button" class="ob-browser-action" data-browser-remote-send>发送</button></div>',"<div class=\"ob-browser-remote-input\" data-browser-remote-input hidden><input type=\"text\" data-browser-remote-field aria-label=\"Send to remote browser\" placeholder=\"Take over to type in the remote browser\"><button type=\"button\" class=\"ob-browser-action\" data-browser-remote-send>Send</button></div>")
      +   '<div class="ob-browser-controls">'
      +     tr('<button type="button" class="ob-browser-action" data-browser-watch>刷新预览</button>',"<button type=\"button\" class=\"ob-browser-action\" data-browser-watch>Refresh preview</button>")
      +     tr('<button type="button" class="ob-browser-action primary" data-browser-takeover>接管浏览器</button>',"<button type=\"button\" class=\"ob-browser-action primary\" data-browser-takeover>Take over browser</button>")
      +     tr('<button type="button" class="ob-browser-action" data-browser-return hidden>交还 Bot</button>',"<button type=\"button\" class=\"ob-browser-action\" data-browser-return hidden>Return to Bot</button>")
      +     tr('<button type="button" class="ob-browser-action ob-browser-fallback" data-browser-fallback hidden>浏览器画面操作</button>',"<button type=\"button\" class=\"ob-browser-action ob-browser-fallback\" data-browser-fallback hidden>Browser screen controls</button>")
      +   '</div>'
      + '</div>'
      + tr('<div class="ob-browser-files" data-browser-files><div class="ob-browser-files-head"><span class="ob-browser-files-title">浏览器文件</span><span class="ob-browser-files-count" data-browser-files-count></span></div><div class="ob-browser-file-list" data-browser-file-list></div></div>',"<div class=\"ob-browser-files\" data-browser-files><div class=\"ob-browser-files-head\"><span class=\"ob-browser-files-title\">Browser files</span><span class=\"ob-browser-files-count\" data-browser-files-count></span></div><div class=\"ob-browser-file-list\" data-browser-file-list></div></div>")
      + '</section>';
  }

  function mount(host, options) {
    options = options || {};
    if (!hasDocument || !host || !host.querySelector) return { refresh:function () { return Promise.resolve(); }, destroy:function () {} };
    var bot = options.bot || {};
    var botId = firstString(options.botId, bot.id, host.getAttribute('data-bot-id'));
    var bridge = options.bridge || root.grokbot || null;
    var state = normalizeState(options.state, { botId:botId, owner:'agent', running:false, executionLocation:bot.executionLocation, remote:bot.executionLocation === 'node' });
    var epoch = 0;
    var destroyed = false;
    var pollTimer = 0;
    var pollBusy = false;
    var embedBusy = false;
    var embedQueued = false;
    var embedRequest = 0;
    var embedWanted = false;
    var resizeFrame = 0;
    var resizeObserver = null;
    var overlayObserver = null;
    var unsubscribers = [];
    var onWindowResize = null;
    var onScroll = null;
    var onVisibility = null;
    var onMoreOutsidePointer = null;
    var refs = {
      address:host.querySelector('[data-browser-address]'),
      tabs:host.querySelector('[data-browser-tabs]'),
      stage:host.querySelector('[data-browser-stage]'),
      preview:host.querySelector('[data-browser-preview]'),
      image:host.querySelector('[data-browser-preview-image]'),
      empty:host.querySelector('[data-browser-empty]'),
      emptyCopy:host.querySelector('[data-browser-empty-copy]'),
      previewNote:host.querySelector('[data-browser-preview-note]'),
      embed:host.querySelector('[data-browser-embed-host]'),
      dialog:host.querySelector('[data-browser-dialog]'),
      dialogMessage:host.querySelector('[data-browser-dialog-message]'),
      error:host.querySelector('[data-browser-error]'),
      subtitle:host.querySelector('[data-browser-subtitle]'),
      runtimeMark:host.querySelector('[data-browser-runtime-mark]'),
      runtimeLabel:host.querySelector('[data-browser-runtime-label]'),
      stateLabel:host.querySelector('[data-browser-state-label]'),
      footNote:host.querySelector('[data-browser-foot-note]'),
      watch:host.querySelector('[data-browser-watch]'),
      takeover:host.querySelector('[data-browser-takeover]'),
      returnButton:host.querySelector('[data-browser-return]'),
      fallback:host.querySelector('[data-browser-fallback]'),
      files:host.querySelector('[data-browser-files]'),
      filesCount:host.querySelector('[data-browser-files-count]'),
      fileList:host.querySelector('[data-browser-file-list]'),
      remoteInput:host.querySelector('[data-browser-remote-input]'),
      remoteField:host.querySelector('[data-browser-remote-field]'),
      remoteSend:host.querySelector('[data-browser-remote-send]'),
      more:host.querySelector('[data-browser-more]'),
      moreMenu:host.querySelector('[data-browser-more-menu]'),
      record:host.querySelector('[data-browser-record]'),
      recordAudio:host.querySelector('[data-browser-record-audio]'),
      recordNote:host.querySelector('[data-browser-record-note]'),
      recordSetup:host.querySelector('[data-browser-record-setup]')
    };
    var recording = options.recording || root.appRecordingUi || null;
    var pluginStatus = null;
    var pluginStatusFailed = false;
    var pluginCheckBusy = false;
    var recordStartBusy = false;

    function isHuman() { return state.owner === 'human'; }
    function hasSession() { return !!(state.running || state.url || state.tabs.length || state.previewDataUrl); }
    function browserRecordingReadiness() {
      if (state.remote) return { ready:false, reason:tr('远程浏览器不能从这台 Mac 录制。','Remote browser pages cannot be recorded from this Mac.') };
      if (state.running !== true || !normalizeAddress(state.url).ok) return { ready:false, reason:tr('先在本机浏览器中打开一个网页。','Open a page in the local browser first.') };
      if (!isHuman()) return { ready:false, reason:tr('先接管浏览器，再开始录制。录制不会替你接管。','Take over the browser before recording. Recording will not take control for you.') };
      if (state.recordingActive || recordStartBusy || recording && recording.currentActive && recording.currentActive()) {
        return { ready:false, reason:tr('录制进行中；停止、预览和保存都在录制状态栏中。','A recording is active. Stop, preview and save it from the recording status bar.') };
      }
      if (!recording || typeof recording.startBrowser !== 'function') return { ready:false, reason:tr('当前版本没有网页录制服务。','Browser recording is unavailable in this build.') };
      if (pluginCheckBusy) return { ready:false, reason:tr('正在检查采集插件…','Checking the capture plugin…') };
      if (pluginStatus && (pluginStatus.installed !== true || pluginStatus.enabled !== true)) {
        return { ready:false, reason:tr('网页录制需要已启用的采集插件。','Browser recording needs the capture plugin installed and enabled.') };
      }
      if (pluginStatusFailed) return { ready:false, reason:tr('采集插件状态暂不可用；请打开插件设置重试。','Capture plugin status is unavailable. Open plugin setup to retry.') };
      return { ready:true, reason:recordAudioMode() === 'system'
        ? tr('系统声音为全系统音频；录制最长 3 分钟，不保证覆盖完整原视频。不会自动播放。','System audio captures all system sound. Clips are limited to 3 minutes and may not include the full source video. Nothing will autoplay.')
        : tr('会录制全系统声音和麦克风；最长 3 分钟，不保证覆盖完整原视频。不会自动播放。','Captures all system sound and microphone. Clips are limited to 3 minutes and may not include the full source video. Nothing will autoplay.') };
    }
    function recordAudioMode() { return refs.recordAudio && refs.recordAudio.value === 'system-and-microphone' ? 'system-and-microphone' : 'system'; }
    function setMoreOpen(open, restoreFocus) {
      open = !!open;
      if (refs.moreMenu) refs.moreMenu.hidden = !open;
      if (refs.more) refs.more.setAttribute('aria-expanded', String(open));
      if (!open && restoreFocus && refs.more) refs.more.focus({ preventScroll:true });
      if (open) refreshCapturePluginStatus();
      renderRecordMenu();
    }
    function renderRecordMenu() {
      if (!refs.moreMenu) return;
      var readiness = browserRecordingReadiness();
      if (refs.record) refs.record.disabled = !readiness.ready || state.loading;
      if (refs.recordAudio) refs.recordAudio.disabled = !isHuman() || state.remote || state.recordingActive || recordStartBusy;
      if (refs.recordNote) refs.recordNote.textContent = readiness.reason;
      if (refs.recordSetup) {
        var needsPlugin = pluginStatusFailed || pluginStatus && (pluginStatus.installed !== true || pluginStatus.enabled !== true);
        refs.recordSetup.hidden = !needsPlugin || state.remote || !hasSession();
        refs.recordSetup.textContent = pluginStatus && pluginStatus.installed === true
          ? tr('打开采集插件设置','Open capture plugin settings')
          : tr('打开下载与安装','Open download and install');
      }
    }
    function refreshCapturePluginStatus() {
      if (!bridge || typeof bridge.capturePluginStatus !== 'function' || pluginCheckBusy) { renderRecordMenu(); return Promise.resolve(pluginStatus); }
      pluginCheckBusy = true; renderRecordMenu();
      return Promise.resolve().then(function () { return bridge.capturePluginStatus(); }).then(function (result) {
        if (!result || result.ok !== true || !result.status) throw new Error(errorMessage(result, tr('无法读取采集插件状态','Could not read capture plugin status')));
        pluginStatus = result.status;
        pluginStatusFailed = false;
        return pluginStatus;
      }).catch(function (error) {
        pluginStatus = null;
        pluginStatusFailed = true;
        if (refs.recordNote) refs.recordNote.textContent = errorMessage(error, tr('无法读取采集插件状态','Could not read capture plugin status'));
        return null;
      }).then(function (result) { pluginCheckBusy = false; renderRecordMenu(); return result; });
    }
    function openCapturePluginSetup() {
      setMoreOpen(false, false);
      var observation = options.captureUi;
      if (!observation || typeof observation.openRecordingMenu !== 'function') {
        setError(tr('请在聊天输入区的采集菜单中安装并启用屏幕与应用采集插件。','Install and enable the capture plugin from the chat composer capture menu.'));
        return Promise.resolve(false);
      }
      return Promise.resolve(observation.openRecordingMenu()).then(function (opened) {
        if (!opened) setError(tr('请先返回此 Bot 的聊天页，再从采集菜单安装或启用插件。','Return to this Bot’s chat page and use the capture menu to install or enable the plugin.'));
        return opened;
      });
    }
    function startBrowserRecording() {
      var readiness = browserRecordingReadiness();
      if (!readiness.ready) { if (refs.recordNote) refs.recordNote.textContent = readiness.reason; return Promise.resolve(false); }
      if (!recording || typeof recording.startBrowser !== 'function') return Promise.resolve(false);
      var audioMode = recordAudioMode();
      var targetName = firstString(state.title, state.url);
      recordStartBusy = true; renderRecordMenu(); setError(''); setMoreOpen(false, false);
      ++epoch;
      return Promise.resolve(recording.startBrowser(botId, audioMode, targetName)).then(function () {
        state.recordingActive = true;
        state.embedded = false;
        embedWanted = false;
        render();
        return state;
      }).catch(function (error) {
        var code = firstString(error && error.code, error && error.errorCode);
        if (code === 'CAPTURE_PLUGIN_NOT_ENABLED') return openCapturePluginSetup();
        setError(errorMessage(error, tr('网页录制没有开始','Browser recording did not start')));
        return state;
      }).then(function (result) { recordStartBusy = false; renderRecordMenu(); return result; });
    }
    function getCommandApi() { return bridge && typeof bridge.browserCommand === 'function' ? bridge.browserCommand : null; }
    function errorMessage(value, fallback) {
      var code = firstString(value && value.code, value && value.errorCode);
      if (code === 'BROWSER_DOM_UNAVAILABLE' || code === 'NODE_BROWSER_UPGRADE_REQUIRED') return tr('当前节点未提供新版浏览器能力，请升级节点',"This node does not support the new browser features. Upgrade the node.");
      return firstString(value && value.message, value && value.error, value) || fallback || tr('浏览器操作没有完成',"Browser operation did not complete");
    }
    function callCommand(command) {
      var api = getCommandApi();
      if (!api) return Promise.reject(new Error(tr('当前桌面版还没有内置浏览器接口',"This desktop version does not provide the browser API")));
      try { return Promise.resolve(api.call(bridge, botId, command, targetOptions())); }
      catch (e) { return Promise.reject(e); }
    }
    function targetOptions() {
      return targetOptionsForState(state);
    }
    function callLegacy(name, args) {
      if (!bridge || typeof bridge[name] !== 'function') return Promise.reject(new Error(tr('当前桌面版还没有 ',"This desktop version does not provide the ") + name + tr(' 接口'," API")));
      try { return Promise.resolve(bridge[name].apply(bridge, args || [])); }
      catch (e) { return Promise.reject(e); }
    }
    function applyResult(result) {
      if (!result || typeof result !== 'object') return state;
      if (result.ok === false) throw new Error(errorMessage(result, tr('浏览器操作失败',"Browser operation failed")));
      var next = normalizeState(result, state);
      Object.keys(next).forEach(function (key) { state[key] = next[key]; });
      if (result.status && typeof result.status === 'object') {
        var status = normalizeState(result.status, state);
        Object.keys(status).forEach(function (key) { state[key] = status[key]; });
      }
      render();
      return state;
    }
    function setError(message) {
      state.error = asString(message || '');
      if (refs.error) {
        refs.error.textContent = state.error;
        refs.error.hidden = !state.error;
      }
      render();
    }
    function setBusy(value) {
      state.loading = !!value;
      host.setAttribute('aria-busy', state.loading ? 'true' : 'false');
      render();
    }
    function visibleElement(selector) {
      var element = root.document.querySelector(selector);
      return !!(element && !element.classList.contains('hidden') && !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');
    }
    function browserBlockingDialogs() {
      return ['app-recording-preview-dialog', 'openbot-game-space-dialog'].map(function (id) {
        return root.document.getElementById(id);
      }).filter(Boolean);
    }
    function embedBlocked() {
      var space = root.document.getElementById('space-view');
      if (space && (space.classList.contains('hidden') || space.hasAttribute('hidden'))) return true;
      if (browserBlockingDialogs().some(function (dialog) { return dialog.open === true; })) return true;
      return ['#modal-mask', '#set-mask', '#ctx-mask', '#agent-mask', '#task-mask', '#node-mask', '#org-drawer'].some(visibleElement);
    }
    function canEmbed() { return !root.document.hidden && !embedBlocked(); }
    function currentBounds() {
      var rect = refs.embed && refs.embed.getBoundingClientRect ? refs.embed.getBoundingClientRect() : refs.stage.getBoundingClientRect();
      var viewportWidth = Math.max(1, Number(root.innerWidth || (root.document.documentElement && root.document.documentElement.clientWidth) || 1));
      var viewportHeight = Math.max(1, Number(root.innerHeight || (root.document.documentElement && root.document.documentElement.clientHeight) || 1));
      return clipBounds(rect, viewportWidth, viewportHeight);
    }
    function embed(visible) {
      if (state.recordingActive) return Promise.resolve({ ok:true, embedded:false, recordingActive:true });
      if (!bridge || typeof bridge.browserEmbed !== 'function' || !botId) return Promise.resolve();
      if (visible && !canEmbed()) visible = false;
      var bounds = visible ? currentBounds() : null;
      if (visible && !bounds) visible = false;
      var request = ++embedRequest;
      if (!visible) {
        state.embedded = false;
        render();
      }
      if (embedBusy && visible) {
        embedQueued = true;
        return Promise.resolve(state);
      }
      embedBusy = true;
      var payload = { visible:!!visible, bounds:bounds || { x:0, y:0, width:1, height:1 } };
      Object.assign(payload, targetOptions());
      var pending;
      try { pending = Promise.resolve(bridge.browserEmbed(botId, payload)); }
      catch (e) { pending = Promise.reject(e); }
      return pending.then(function (result) {
        if (destroyed || request !== embedRequest) return result;
        if (result && result.ok === false) throw new Error(errorMessage(result, tr('浏览器页面没有切换到工作区',"Browser page could not be shown in the Workspace")));
        if (result && result.recordingActive === true) {
          state.recordingActive = true;
          state.embedded = result.embedded === true;
          embedWanted = false;
        } else if (state.recordingActive) {
          state.embedded = false;
          embedWanted = false;
        } else state.embedded = result && result.embedded !== undefined ? result.embedded === true : !!visible;
        render();
        return result;
      }).catch(function (error) {
        if (!destroyed && request === embedRequest) {
          state.embedded = false;
          if (visible) setError(errorMessage(error, tr('浏览器页面没有切换到工作区',"Browser page could not be shown in the Workspace")));
        }
        return null;
      }).then(function (result) {
        embedBusy = false;
        if (embedQueued && !destroyed) {
          embedQueued = false;
          syncEmbed();
        }
        return result;
      });
    }
    function syncEmbed() {
      if (destroyed || state.recordingActive) return Promise.resolve(state);
      var wanted = isHuman() && embedWanted && canEmbed();
      if (wanted === !!state.embedded && !embedBusy) return Promise.resolve(state);
      return embed(wanted);
    }
    function scheduleEmbed() {
      if (state.recordingActive) return;
      if (resizeFrame) return;
      resizeFrame = root.requestAnimationFrame ? root.requestAnimationFrame(function () { resizeFrame = 0; if (isHuman() && embedWanted) syncEmbed(); }) : setTimeout(function () { resizeFrame = 0; if (isHuman() && embedWanted) syncEmbed(); }, 0);
    }
    function renderTabs() {
      if (!refs.tabs) return;
      refs.tabs.replaceChildren();
      state.tabs.forEach(function (tab) {
        var button = root.document.createElement('div');
        button.className = 'ob-browser-tab';
        button.setAttribute('role', 'tab');
        button.setAttribute('tabindex', state.recordingActive ? '-1' : '0');
        button.setAttribute('aria-disabled', String(state.recordingActive));
        button.setAttribute('aria-selected', tab.id === state.activeTabId ? 'true' : 'false');
        button.dataset.browserTab = tab.id;
        button.title = tab.url || tab.title;
        var label = root.document.createElement('span');
        label.className = 'ob-browser-tab-label';
        label.textContent = tab.title || tr('新标签页',"New tab");
        var close = root.document.createElement('span');
        close.className = 'ob-browser-tab-close';
        close.setAttribute('role', 'button');
        close.setAttribute('tabindex', state.recordingActive ? '-1' : '0');
        close.setAttribute('aria-disabled', String(state.recordingActive));
        close.setAttribute('aria-label', tr('关闭 ',"Close ") + (tab.title || tr('此标签页',"this tab")));
        close.innerHTML = icon('close');
        close.addEventListener('click', function (event) { event.stopPropagation(); if(!state.recordingActive)runCommand('close-tab', { tabId:tab.id }); });
        close.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); if(!state.recordingActive)runCommand('close-tab', { tabId:tab.id }); } });
        button.append(label, close);
        button.addEventListener('click', function () { if(!state.recordingActive)runCommand('tab', { tabId:tab.id }); });
        button.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if(!state.recordingActive)runCommand('tab', { tabId:tab.id }); } });
        refs.tabs.append(button);
      });
      var add = root.document.createElement('button');
      add.type = 'button'; add.className = 'ob-browser-new-tab'; add.dataset.browserNewTab = 'true';
      add.setAttribute('aria-label', tr('新建标签页',"New tab")); add.title = tr('新建标签页',"New tab"); add.innerHTML = icon('plus');
      add.disabled = !isHuman() || state.loading || state.recordingActive;
      add.addEventListener('click', function () { runCommand('new-tab', {}); });
      refs.tabs.append(add);
    }
    function saveDownload(artifactId) {
      if (!bridge || typeof bridge.browserSaveDownload !== 'function') { setError(tr('当前桌面版还没有下载文件接口',"This desktop version does not provide file downloads")); return Promise.resolve(state); }
      setError(''); setBusy(true);
      var pending;
      try { pending = Promise.resolve(bridge.browserSaveDownload(botId, artifactId, targetOptions())); }
      catch (e) { pending = Promise.reject(e); }
      return pending.then(function (result) {
        if (result && result.ok === false) throw new Error(errorMessage(result, tr('下载文件失败',"Failed to download file")));
        state.notice = tr('文件已保存',"File saved"); render(); return result;
      }).catch(function (error) { setError(errorMessage(error, tr('下载文件失败',"Failed to download file"))); return state; })
        .then(function (result) { setBusy(false); return result || state; });
    }
    function renderFiles() {
      if (!refs.files || !refs.fileList) return;
      refs.fileList.replaceChildren();
      var files = state.files || [];
      refs.files.classList.toggle('has-files', files.length > 0);
      if (refs.filesCount) refs.filesCount.textContent = files.length ? files.length + tr(' 个',"") : '';
      files.forEach(function (file) {
        var row = root.document.createElement('div'); row.className = 'ob-browser-file-row';
        var name = root.document.createElement('span'); name.className = 'ob-browser-file-name'; name.textContent = file.name;
        var kind = root.document.createElement('span'); kind.className = 'ob-browser-file-kind';
        var statusLabel = { ready:tr('已就绪',"Ready"), pending:tr('处理中',"Processing"), failed:tr('失败',"Failed") }[file.status] || '';
        kind.textContent = statusLabel || file.kind || (file.direction === 'upload' ? tr('附件',"Attachment") : tr('文件',"File"));
        row.append(name, kind);
        if (file.downloadable && file.status !== 'pending' && file.status !== 'failed') {
          var download = root.document.createElement('button'); download.type = 'button'; download.textContent = tr('下载',"Download"); download.setAttribute('aria-label', tr('下载 ',"Download ") + file.name);
          download.addEventListener('click', function () { saveDownload(file.artifactId); });
          row.append(download);
        }
        refs.fileList.append(row);
      });
    }
    function render() {
      if (destroyed) return;
      host.dataset.owner = state.owner;
      host.dataset.location = state.remote ? 'cloud' : 'local';
      host.setAttribute('aria-busy', state.loading ? 'true' : 'false');
      var interactive = isHuman() && !state.loading;
      var has = hasSession();
      if (refs.address && document.activeElement !== refs.address) refs.address.value = state.url || '';
      if (refs.runtimeLabel) refs.runtimeLabel.textContent = state.remote ? tr('云端容器',"Cloud container") : tr('本机',"Local");
      if (refs.stateLabel) refs.stateLabel.textContent = state.recordingActive ? tr('正在录制',"Recording") : isHuman() ? tr('人工接管',"Your control") : (state.error ? tr('浏览器异常',"Browser error") : (has ? tr('Bot 控制',"Bot control") : tr('未启动',"Not started")));
      if (refs.runtimeMark) { refs.runtimeMark.dataset.state = state.error ? 'error' : (state.loading ? 'loading' : (state.recordingActive ? 'recording' : (has ? 'ready' : 'idle'))); }
      if (refs.subtitle) refs.subtitle.textContent = state.remote ? tr('浏览器在云端隔离容器中运行，预览与任务共用同一会话',"The browser runs in an isolated cloud container. Preview and tasks share the same session.") : tr('网页任务优先在本机内置浏览器中执行；你可以随时接管同一会话',"Web tasks run in the local browser first. You can take over the same session at any time.");
      if (refs.footNote) refs.footNote.textContent = state.recordingActive
        ? tr('当前网页在独立浏览器窗口中录制；停止、预览和保存请使用录制状态栏。',"The page is recording in a separate browser window. Use the recording status bar to stop, preview or save.")
        : state.notice || (isHuman() ? (state.remote ? tr('你正在查看云端浏览器；输入和点击会沿用同一个远程会话。',"You are viewing the cloud browser. Typing and clicks use the same remote session.") : tr('你正在操作同一浏览器会话；交还 Bot 后会恢复只读预览。',"You control the same browser session. Return it to the Bot to restore read-only preview.")) : tr('网页任务由 Bot 执行；你可以随时接管同一浏览器会话。',"Bots handle web tasks. You can take over the same browser session at any time."));
      if (refs.error) { refs.error.textContent = state.error || ''; refs.error.hidden = !state.error; }
      if (refs.image) {
        refs.image.hidden = !state.previewDataUrl || state.recordingActive;
        if (state.previewDataUrl) refs.image.style.backgroundImage = 'url("' + state.previewDataUrl.replace(/"/g, '%22') + '")';
      }
      if (refs.empty) refs.empty.hidden = !!state.previewDataUrl && !state.recordingActive;
      if (refs.emptyCopy) refs.emptyCopy.textContent = state.recordingActive ? tr('网页正在独立浏览器窗口中录制；录制状态栏可停止、预览或保存。',"The page is recording in a separate browser window. Stop, preview or save it from the recording status bar.") : state.error ? tr('预览暂时不可用，请稍后刷新或使用浏览器画面操作。',"Preview is unavailable. Refresh later or use browser screen controls.") : (has ? tr('正在等待当前浏览器画面。点“刷新预览”读取最新状态。',"Waiting for the browser view. Choose “Refresh preview” for the latest state.") : tr('输入地址后，Bot 会在自己的隔离浏览器里打开网页。',"Enter an address to open a page in this Bot's isolated browser."));
      if (refs.previewNote) { refs.previewNote.hidden = !(state.recordingActive || state.previewDataUrl && !(isHuman() && state.embedded)); refs.previewNote.textContent = state.recordingActive ? tr('网页正在独立窗口录制',"Recording in a separate browser window") : tr('Bot 控制 · 只读预览',"Bot control · Read-only preview"); }
      if (refs.preview) { refs.preview.hidden = !!(isHuman() && state.embedded) && !state.recordingActive; refs.preview.dataset.readonly = isHuman() ? 'false' : 'true'; }
      if (refs.embed) refs.embed.hidden = state.recordingActive || !(isHuman() && state.embedded);
      if (refs.remoteInput) refs.remoteInput.hidden = !(isHuman() && state.remote);
      if (refs.remoteField) refs.remoteField.disabled = !(isHuman() && state.remote) || state.loading;
      if (refs.remoteSend) refs.remoteSend.disabled = !(isHuman() && state.remote) || state.loading;
      if (refs.watch) refs.watch.disabled = !has || state.loading || state.recordingActive;
      if (refs.takeover) { refs.takeover.hidden = isHuman(); refs.takeover.disabled = !has || state.loading; }
      if (refs.returnButton) { refs.returnButton.hidden = !isHuman(); refs.returnButton.disabled = state.loading || state.recordingActive; }
      if (refs.fallback) refs.fallback.hidden = state.recordingActive || typeof options.onFallback !== 'function' || (!state.remote && !state.error && !!getCommandApi());
      Array.prototype.forEach.call(host.querySelectorAll('[data-browser-command]'), function (button) {
        button.disabled = !interactive || !has || state.recordingActive;
      });
      var uploadButton=host.querySelector('[data-browser-upload]');
      if(uploadButton)uploadButton.disabled=!interactive||!has||state.recordingActive;
      if (refs.address) refs.address.disabled = !interactive && has || state.recordingActive;
      renderTabs(); renderFiles();
      var dialog = state.dialog && typeof state.dialog === 'object' ? state.dialog : null;
      if (refs.dialog) refs.dialog.hidden = !dialog;
      if (refs.dialogMessage && dialog) refs.dialogMessage.textContent = firstString(dialog.message, dialog.text, dialog.prompt) || tr('页面请求继续操作',"The page requests confirmation to continue");
      if (refs.dialog) {
        var dialogButtons = refs.dialog.querySelectorAll('button');
        Array.prototype.forEach.call(dialogButtons, function (button) { button.disabled = !interactive || state.loading || state.recordingActive; });
      }
      renderRecordMenu();
    }
    function capturePreview() {
      if (state.recordingActive) return Promise.resolve();
      var name = typeof bridge.captureScreen === 'function' ? 'captureScreen' : (typeof bridge.screenCapture === 'function' ? 'screenCapture' : '');
      if (!name) return Promise.resolve();
      return callLegacy(name, [botId]).then(function (result) {
        if (!result || result.ok === false) throw new Error(errorMessage(result, tr('预览暂时不可用',"Preview unavailable")));
        applyResult(result);
      });
    }
    function remoteAct(action) {
      if (!isHuman() || !state.remote) { setError(tr('远程浏览器需要先接管',"Take over the remote browser first")); return Promise.resolve(state); }
      var name = typeof bridge.actScreen === 'function' ? 'actScreen' : (typeof bridge.screenAct === 'function' ? 'screenAct' : '');
      if (!name) { setError(tr('当前桌面版还没有远程输入接口',"This desktop version does not provide remote input")); return Promise.resolve(state); }
      return callLegacy(name, [botId, action, targetOptions()]).then(function (result) {
        if (result && result.ok === false) throw new Error(errorMessage(result, tr('远程输入没有生效',"Remote input did not take effect")));
        return capturePreview();
      }).catch(function (error) { setError(errorMessage(error, tr('远程输入没有生效',"Remote input did not take effect"))); return state; });
    }
    function remoteSend() {
      var text = refs.remoteField ? refs.remoteField.value.trim() : '';
      if (!text) return;
      remoteAct({ type:'type', text:text }).then(function () {
        return remoteAct({ type:'key', key:'Enter' });
      }).then(function () { if (refs.remoteField) refs.remoteField.value = ''; });
    }
    function remoteClick(event) {
      if (!isHuman() || !state.remote || !state.previewDataUrl || !refs.image) return;
      var box = refs.image.getBoundingClientRect();
      if (!box.width || !box.height) return;
      var width = state.previewWidth || box.width;
      var height = state.previewHeight || box.height;
      var scale = Math.min(box.width / width, box.height / height);
      var drawnWidth = width * scale, drawnHeight = height * scale;
      var left = box.left + (box.width - drawnWidth) / 2, top = box.top + (box.height - drawnHeight) / 2;
      var x = Math.round((event.clientX - left) / scale);
      var y = Math.round((event.clientY - top) / scale);
      if (x < 0 || y < 0 || x > width || y > height) return;
      remoteAct({ type:'click', x:x, y:y });
    }
    function refresh(forceCapture) {
      var current = ++epoch;
      if (pollBusy) return Promise.resolve(state);
      pollBusy = true;
      var pending;
      if (getCommandApi()) pending = callCommand(commandPayload('state'));
      else if (bridge && typeof bridge.screenStatus === 'function') pending = callLegacy('screenStatus', [botId]);
      else pending = Promise.resolve(state);
      return pending.then(function (result) {
        if (destroyed || current !== epoch) return state;
        if (result && result.ok === false) throw new Error(errorMessage(result, tr('读取浏览器状态失败',"Failed to load browser status")));
        applyResult(result || {});
        // An unopened browser has a valid empty state but no screen frame to
        // capture. Calling the legacy capture endpoint here turns that normal
        // state into a misleading “虚拟屏幕还没启动” error.
        if (!hasSession()) return null;
        if (state.owner === 'human' && !state.remote && !state.recordingActive && !state.embedded && bridge && typeof bridge.browserEmbed === 'function' && canEmbed()) {
          embedWanted = true; state.embedded = true; render();
          return embed(true).then(function () { return forceCapture || !state.previewDataUrl ? capturePreview() : null; });
        }
        if (state.recordingActive) return null;
        if (forceCapture || !state.previewDataUrl) return capturePreview();
        return null;
      }).catch(function (error) {
        if (!destroyed && current === epoch) setError(errorMessage(error, tr('读取浏览器状态失败',"Failed to load browser status")));
        return null;
      }).then(function () {
        pollBusy = false;
        if (!destroyed) schedulePoll();
        return state;
      });
    }
    function schedulePoll() {
      clearTimeout(pollTimer); pollTimer = 0;
      if (destroyed || root.document.hidden) return;
      pollTimer = setTimeout(function () { refresh(false); }, 2200);
    }
    function commandWithResult(command) {
      if (state.recordingActive) { setError(tr('录制期间不能切换标签或网页。','Tabs and navigation are unavailable while recording.')); return Promise.resolve(state); }
      if (!isHuman()) { setError(tr('先接管浏览器后才能修改网页',"Take over the browser before changing the page")); return Promise.resolve(state); }
      setError(''); setBusy(true);
      var current = ++epoch;
      return callCommand(command).then(function (result) {
        if (destroyed || current !== epoch) return state;
        applyResult(result || {});
        return refresh(true);
      }).catch(function (error) {
        if (!destroyed && current === epoch) setError(errorMessage(error, tr('浏览器操作失败',"Browser operation failed")));
        return state;
      }).then(function (result) { setBusy(false); return result || state; });
    }
    function openAddress(value) {
      var parsed = normalizeAddress(value);
      if (!parsed.ok) { if (refs.address) refs.address.setAttribute('aria-invalid', 'true'); setError(parsed.message); return Promise.resolve(state); }
      if (refs.address) refs.address.removeAttribute('aria-invalid');
      if (!hasSession() || (bridge && !getCommandApi() && (bridge.openScreen || bridge.screenOpen))) {
        var openName = typeof bridge.openScreen === 'function' ? 'openScreen' : (typeof bridge.screenOpen === 'function' ? 'screenOpen' : '');
        if (!openName) { setError(tr('当前桌面版还没有打开网页接口',"This desktop version does not provide page navigation")); return Promise.resolve(state); }
        setError(''); setBusy(true); var current = ++epoch;
        return callLegacy(openName, [botId, parsed.url]).then(function (result) {
          if (destroyed || current !== epoch) return state;
          applyResult(result || { url:parsed.url, running:true });
          return refresh(true);
        }).catch(function (error) { if (!destroyed && current === epoch) setError(errorMessage(error, tr('网页没有打开',"The page did not open"))); return state; }).then(function (result) { setBusy(false); return result || state; });
      }
      var tabCommand = state.activeTabId
        ? commandPayload('tab', { tabId:state.activeTabId, url:parsed.url })
        : commandPayload('new-tab', { url:parsed.url });
      return commandWithResult(tabCommand);
    }
    function runCommand(type, values) {
      if (type === 'navigate') return openAddress(values && values.url);
      if (type === 'watch') return refresh(true);
      return commandWithResult(commandPayload(type, values));
    }
    function takeover() {
      if (state.recordingActive) { setError(tr('请先停止录制，再接管浏览器。','Stop recording before taking over the browser.')); return Promise.resolve(state); }
      if (!hasSession()) { setError(tr('还没有打开的浏览器会话',"No browser session is open")); return Promise.resolve(state); }
      setError(''); setBusy(true); var current = ++epoch;
      var pending = bridge && typeof bridge.screenControl === 'function' ? callLegacy('screenControl', [botId, 'takeover', targetOptions()]) : (getCommandApi() ? callCommand(commandPayload('takeover')) : Promise.reject(new Error(tr('当前桌面版还没有接管接口',"This desktop version does not provide browser takeover"))));
      return pending.then(function (result) {
        if (destroyed || current !== epoch) return state;
        applyResult(result || { owner:'human' });
        state.owner = 'human'; state.embedded = true; embedWanted = true; render();
        return embed(true).then(function () { return refresh(false); });
      }).catch(function (error) { if (!destroyed && current === epoch) setError(errorMessage(error, tr('接管浏览器失败',"Failed to take over browser"))); return state; }).then(function (result) { setBusy(false); return result || state; });
    }
    function returnToBot() {
      if (state.recordingActive) { setError(tr('请先停止录制，再交还浏览器。','Stop recording before returning the browser to the Bot.')); return Promise.resolve(state); }
      setError(''); setBusy(true); var current = ++epoch;
      embedWanted = false;
      var pending = bridge && typeof bridge.screenControl === 'function' ? callLegacy('screenControl', [botId, 'release', targetOptions()]) : (getCommandApi() ? callCommand(commandPayload('return')) : Promise.reject(new Error(tr('当前桌面版还没有交还接口',"This desktop version does not provide browser return"))));
      return embed(false).then(function () { return pending; }).then(function (result) {
        if (destroyed || current !== epoch) return state;
        applyResult(result || { owner:'agent', embedded:false });
        state.owner = 'agent'; state.embedded = false; render();
        return refresh(false);
      }).catch(function (error) { if (!destroyed && current === epoch) setError(errorMessage(error, tr('交还浏览器失败',"Failed to return browser to Bot"))); return state; }).then(function (result) { setBusy(false); return result || state; });
    }
    function upload() {
      if (!isHuman()) { setError(tr('上传文件前请先接管浏览器',"Take over the browser before uploading files")); return Promise.resolve(state); }
      if (!bridge || typeof bridge.browserSelectUpload !== 'function') { setError(tr('当前桌面版还没有上传文件接口',"This desktop version does not provide file uploads")); return Promise.resolve(state); }
      setError(''); setBusy(true);
      var pending;
      try { pending = Promise.resolve(bridge.browserSelectUpload(botId, targetOptions())); } catch (e) { pending = Promise.reject(e); }
      return pending.then(function (picked) {
        if (!picked || picked.canceled) return null;
        if (picked.ok === false) throw new Error(errorMessage(picked, tr('选择文件失败',"Failed to select file")));
        var artifactId = firstString(picked.artifactId, picked.fileId, picked.id, picked.ref);
        if (!artifactId) throw new Error(tr('文件没有返回任务引用',"No task reference was returned for the file"));
        var exists = (state.files || []).some(function (file) { return file.artifactId === artifactId; });
        if (!exists) state.files = [{ artifactId:artifactId, name:firstString(picked.name, picked.filename) || tr('浏览器上传附件',"Browser upload attachment"), kind:tr('附件',"Attachment"), direction:'upload', status:tr('已登记',"Registered"), downloadable:false }].concat(state.files || []);
        if (picked.files || picked.tabs || picked.status) applyResult(picked);
        state.notice = tr('已添加附件，交还 Bot 后可用于网页上传',"Attachment added. Return the browser to the Bot to use it for web uploads."); render();
        return refresh(false);
      }).then(function (result) { if (result) return result; return state; })
        .catch(function (error) { if (!destroyed) setError(errorMessage(error, tr('上传文件失败',"Failed to upload file"))); return state; })
        .then(function (result) { setBusy(false); return result || state; });
    }
    function bindEvents() {
      Array.prototype.forEach.call(host.querySelectorAll('[data-browser-command]'), function (button) {
        button.addEventListener('click', function () { runCommand(button.dataset.browserCommand); });
      });
      if (refs.address) refs.address.addEventListener('keydown', function (event) {
        if (event.isComposing || event.keyCode === 229 || event.key !== 'Enter') return;
        event.preventDefault(); openAddress(refs.address.value);
      });
      if (refs.watch) refs.watch.addEventListener('click', function () { runCommand('watch'); });
      if (refs.takeover) refs.takeover.addEventListener('click', takeover);
      if (refs.returnButton) refs.returnButton.addEventListener('click', returnToBot);
      if (refs.fallback && typeof options.onFallback === 'function') refs.fallback.addEventListener('click', options.onFallback);
      var uploadButton = host.querySelector('[data-browser-upload]');
      if (uploadButton) uploadButton.addEventListener('click', upload);
      if (refs.more) refs.more.addEventListener('click', function () { setMoreOpen(!refs.moreMenu || refs.moreMenu.hidden, false); });
      if (refs.record) refs.record.addEventListener('click', startBrowserRecording);
      if (refs.recordSetup) refs.recordSetup.addEventListener('click', openCapturePluginSetup);
      if (refs.moreMenu) {
        refs.moreMenu.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') { event.preventDefault(); setMoreOpen(false, true); }
        });
        refs.moreMenu.addEventListener('focusout', function () {
          setTimeout(function () { if (refs.moreMenu && !refs.moreMenu.contains(root.document.activeElement) && root.document.activeElement !== refs.more) setMoreOpen(false, false); }, 0);
        });
      }
      if (refs.recordAudio) refs.recordAudio.addEventListener('change', renderRecordMenu);
      if (refs.moreMenu) {
        onMoreOutsidePointer = function (event) {
          if (!refs.moreMenu.hidden && !refs.moreMenu.contains(event.target) && refs.more !== event.target && !refs.more.contains(event.target)) setMoreOpen(false, false);
        };
        root.document.addEventListener('pointerdown', onMoreOutsidePointer);
      }
      if (refs.remoteSend) refs.remoteSend.addEventListener('click', remoteSend);
      if (refs.remoteField) refs.remoteField.addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); remoteSend(); } });
      if (refs.preview) refs.preview.addEventListener('click', remoteClick);
      var accept = host.querySelector('[data-browser-dialog-accept]');
      var reject = host.querySelector('[data-browser-dialog-reject]');
      if (accept) accept.addEventListener('click', function () { commandWithResult(commandPayload('dialog', { accept:true })); });
      if (reject) reject.addEventListener('click', function () { commandWithResult(commandPayload('dialog', { accept:false })); });
      if (bridge && typeof bridge.onScreenUpdate === 'function') {
        var off = bridge.onScreenUpdate(function (update) {
          if (destroyed || !update) return;
          var item = update.screen || update;
          if (item.botId && String(item.botId) !== String(botId)) return;
          try { applyResult(item); } catch (_) {}
        });
        if (typeof off === 'function') unsubscribers.push(off);
      }
      if (bridge && typeof bridge.onBrowserUpdate === 'function') {
        var offBrowser = bridge.onBrowserUpdate(function (update) {
          if (!destroyed && update && (!update.botId || String(update.botId) === String(botId))) { try { applyResult(update); } catch (_) {} }
        });
        if (typeof offBrowser === 'function') unsubscribers.push(offBrowser);
      }
      if (typeof root.ResizeObserver === 'function' && refs.embed) {
        resizeObserver = new root.ResizeObserver(function () { if (isHuman() && embedWanted) scheduleEmbed(); });
        resizeObserver.observe(refs.embed);
      }
      onWindowResize = scheduleEmbed;
      root.addEventListener('resize', onWindowResize);
      onScroll = function () { if (isHuman() && embedWanted) scheduleEmbed(); };
      root.addEventListener('scroll', onScroll, true);
      if (typeof root.MutationObserver === 'function') {
        var observedBrowserDialogs = [];
        function observeBrowserDialogs() {
          browserBlockingDialogs().forEach(function (dialog) {
            if (observedBrowserDialogs.indexOf(dialog) >= 0) return;
            observedBrowserDialogs.push(dialog);
            overlayObserver.observe(dialog, { attributes:true, attributeFilter:['open'] });
          });
        }
        overlayObserver = new root.MutationObserver(function (records) {
          if (destroyed || !isHuman()) return;
          observeBrowserDialogs();
          var browserDialogs = browserBlockingDialogs();
          var dialogChanged = !!(records && records.some(function (record) {
            if (browserDialogs.indexOf(record.target) >= 0 && record.attributeName === 'open') return true;
            return record.type === 'childList' && record.target === root.document.body
              && browserDialogs.some(function (dialog) { return dialog.open === true; });
          }));
          var dialogClosed = !!(records && records.some(function (record) {
            return browserDialogs.indexOf(record.target) >= 0 && record.attributeName === 'open' && record.target.open !== true;
          }));
          if (dialogClosed && !state.recordingActive && !state.remote && hasSession()) embedWanted = true;
          if (embedWanted || dialogChanged) syncEmbed();
        });
        var embedWatch = [root.document.body, root.document.getElementById('space-view')].concat(browserBlockingDialogs(), ['#modal-mask', '#set-mask', '#ctx-mask', '#agent-mask', '#task-mask', '#node-mask', '#org-drawer'])
          .map(function (target) { return typeof target === 'string' ? root.document.querySelector(target) : target; })
          .filter(Boolean);
        embedWatch.forEach(function (target) {
          overlayObserver.observe(target, {
            attributes:true,
            attributeFilter:['class', 'hidden', 'aria-hidden', 'data-view', 'open'],
            childList:target === root.document.body
          });
        });
        observeBrowserDialogs();
      }
      onVisibility = function () {
        if (destroyed) return;
        if (state.recordingActive) { render(); return; }
        if (root.document.hidden) { if (isHuman() && state.embedded) embed(false); }
        else { render(); refresh(false); if (isHuman() && embedWanted) syncEmbed(); }
      };
      root.document.addEventListener('visibilitychange', onVisibility);
    }
    bindEvents(); render(); refresh(false);
    return {
      refresh:refresh,
      command:runCommand,
      takeover:takeover,
      returnToBot:returnToBot,
      state:function () { return state; },
      destroy:function () {
        if (destroyed) return;
        destroyed = true; ++epoch; clearTimeout(pollTimer); if (resizeFrame) { if (root.cancelAnimationFrame) root.cancelAnimationFrame(resizeFrame); else clearTimeout(resizeFrame); resizeFrame = 0; }
        if (resizeObserver) resizeObserver.disconnect();
        if (overlayObserver) overlayObserver.disconnect();
        unsubscribers.forEach(function (off) { try { off(); } catch (_) {} });
        if (onWindowResize) root.removeEventListener('resize', onWindowResize);
        if (onScroll) root.removeEventListener('scroll', onScroll, true);
        if (onVisibility) root.document.removeEventListener('visibilitychange', onVisibility);
        if (onMoreOutsidePointer) root.document.removeEventListener('pointerdown', onMoreOutsidePointer);
        embedWanted = false;
        if (isHuman() && !state.recordingActive) embed(false);
      }
    };
  }

  return {
    html:browserMarkup,
    mount:mount,
    escapeHtml:esc,
    normalizeTabs:normalizeTabs,
    normalizeFiles:normalizeFiles,
    normalizeState:normalizeState,
    targetOptionsForState:targetOptionsForState,
    clipBounds:clipBounds,
    normalizeAddress:normalizeAddress,
    commandPayload:commandPayload,
    browserRecordingReadiness:function (state) {
      state = state && typeof state === 'object' ? state : {};
      if (state.remote === true || state.executionLocation === 'node' || state.executionLocation === 'cloud') return { ready:false, reason:'remote' };
      if (state.running !== true || !normalizeAddress(state.url).ok) return { ready:false, reason:'unopened' };
      if (state.owner !== 'human') return { ready:false, reason:'takeover-required' };
      if (state.recordingActive) return { ready:false, reason:'recording-active' };
      return { ready:true, reason:'' };
    }
  };
}));
