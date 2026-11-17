/**
 * 文件查看窗口逻辑。内容一律经 openbot-view: 协议取（令牌在主进程），
 * 本文件不做任何路径拼接。Markdown/HTML 文本用 fetch 取回后本地渲染。
 */
'use strict';

(function () {
  const tr = (zh, en) => window.OpenBotI18n ? window.OpenBotI18n.t(zh, en) : zh;
  if (window.OpenBotI18n) window.OpenBotI18n.localize(document);
  const $ = (sel) => document.querySelector(sel);
  const el = {
    icon: $('#fv-icon'), name: $('#fv-name'), meta: $('#fv-meta'),
    toggle: $('#fv-toggle'), reveal: $('#fv-reveal'), system: $('#fv-system'),
    body: $('#fv-body'), foot: $('#fv-foot')
  };
  const KIND_ICONS = { markdown: 'MD', html: '<>', image: '🖼', video: '▶', audio: '♪', text: 'TXT', pdf: 'PDF', unknown: 'FILE' };
  const KIND_LABELS = { markdown: 'Markdown', html: tr("HTML（脚本不执行）", "HTML (scripts disabled)"), image: tr("图片", "Image"), video: tr("视频", "Video"), audio: tr("音频", "Audio"), text: tr("文本", "Text"), pdf: tr("PDF（不预览）", "PDF (no preview)"), unknown: tr("未知类型（不预览）", "Unknown type (no preview)") };
  const BIG_TEXT_BYTES = 1024 * 1024;

  let current = null;   // 主进程推送的 { viewUrl, name, kind, mime, size, botName, ts }
  let showingSource = false;
  let renderEpoch = 0;
  let pendingRead = null;

  function beginRender() {
    if (pendingRead) pendingRead.abort();
    pendingRead = new AbortController();
    return { item: current, epoch: ++renderEpoch, signal: pendingRead.signal };
  }

  function isCurrent(read) {
    return read.epoch === renderEpoch && read.item === current && !read.signal.aborted;
  }

  function formatSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }

  function clear(elBody) {
    while (elBody.firstChild) elBody.removeChild(elBody.firstChild);
  }

  function div(className, textContent) {
    const node = document.createElement('div');
    if (className) node.className = className;
    if (textContent != null) node.textContent = textContent;
    return node;
  }

  function pre(className, content) {
    const node = document.createElement('pre');
    node.className = className;
    node.textContent = String(content == null ? '' : content);
    return node;
  }

  async function fetchText(url, label, signal) {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(label + tr("读取失败（", " could not be read (") + res.status + tr("）", ")"));
    return res.text();
  }

  function mediaFallback(kind) {
    return div('fv-error', tr("这类", "This ") + (KIND_LABELS[kind] || tr("文件", "file")) + tr("无法在窗口内播放，可以用右上角「用系统应用打开」。", " cannot be played here. Choose Open in App instead."));
  }

  function renderMedia(tagName, className, item) {
    const wrap = div('fv-media-wrap');
    const media = document.createElement(tagName);
    if (className) media.className = className;
    media.controls = tagName !== 'img';
    media.src = item.viewUrl;
    media.addEventListener('error', () => {
      if (current === item) wrap.replaceChildren(mediaFallback(item.kind));
    });
    wrap.appendChild(media);
    return wrap;
  }

  function renderTextInto(body, content, truncated) {
    body.appendChild(pre('fv-text', content));
    if (truncated) body.appendChild(div('fv-note', tr("文件较大，这里只显示前 1 MB；完整内容请用「用系统应用打开」。", "This preview shows the first 1 MB. Choose Open in App for the full file.")));
  }

  function renderStatic(kind, content) {
    clear(el.body);
    showingSource = false;
    if (kind === 'markdown' && window.OpenBotMarkdown) {
      const wrap = div('fv-md');
      wrap.appendChild(window.OpenBotMarkdown.render(content));
      el.body.appendChild(wrap);
      return;
    }
    renderTextInto(el.body, content);
  }

  function showSource(content) {
    clear(el.body);
    el.body.appendChild(pre('fv-source', content));
    showingSource = true;
  }

  async function render() {
    if (!current) return;
    const read = beginRender();
    const item = read.item;
    showingSource = false;
    clear(el.body);
    el.foot.hidden = true;
    el.icon.textContent = KIND_ICONS[item.kind] || 'FILE';
    el.name.textContent = item.name;
    const parts = [KIND_LABELS[item.kind] || tr("文件", "file"), formatSize(item.size)];
    if (item.botName) parts.push(tr("来自 ", "From ") + item.botName);
    el.meta.textContent = parts.join(' · ');
    el.reveal.disabled = false;
    el.system.disabled = false;

    // 大文本提示；PDF/未知类型不预览。
    if (item.kind === 'pdf' || item.kind === 'unknown') {
      clear(el.body);
      el.body.appendChild(div('fv-note', tr("Bot Studio 不预览这类文件，用右上角「用系统应用打开」即可。", "This file type has no preview. Choose Open in App to view it.")));
      el.toggle.hidden = true;
      el.foot.hidden = true;
      return;
    }
    if (item.size > BIG_TEXT_BYTES && ['markdown', 'html', 'text'].includes(item.kind)) {
      clear(el.body);
      el.body.appendChild(div('fv-note', tr("文件超过 1 MB，查看器不载入；用右上角「用系统应用打开」。", "The file exceeds 1 MB. Choose Open in App to view it.")));
      el.toggle.hidden = true;
      el.foot.hidden = true;
      return;
    }

    el.toggle.hidden = !(item.kind === 'markdown' || item.kind === 'html');
    el.toggle.textContent = item.kind === 'html' ? tr("看源码", "View Source") : tr("看原文", "View Source");

    try {
      if (item.kind === 'image') { clear(el.body); el.body.appendChild(renderMedia('img', 'fv-media', item)); }
      else if (item.kind === 'video') { clear(el.body); el.body.appendChild(renderMedia('video', null, item)); }
      else if (item.kind === 'audio') { clear(el.body); el.body.appendChild(renderMedia('audio', null, item)); }
      else if (item.kind === 'html') {
        clear(el.body);
        const wrap = div('fv-frame-wrap');
        const frame = document.createElement('iframe');
        frame.className = 'fv-frame';
        // sandbox 不含任何 token：脚本不执行、同源访问被禁止，静态渲染而已。
        frame.setAttribute('sandbox', '');
        frame.src = item.viewUrl;
        wrap.appendChild(frame);
        const note = div('fv-note', tr("HTML 预览不执行脚本、不加载页面里引用的其他资源。", "HTML previews do not run scripts or load referenced resources."));
        wrap.appendChild(note);
        el.body.appendChild(wrap);
        el.foot.hidden = false;
        el.foot.textContent = tr("沙箱预览：脚本禁用 · 相对路径资源不加载", "Sandboxed preview · Scripts and relative resources are disabled");
      } else {
        const content = await fetchText(item.viewUrl, tr("文件", "file"), read.signal);
        if (!isCurrent(read)) return;
        if (item.kind === 'text' && item.size > BIG_TEXT_BYTES) {
          clear(el.body);
          renderTextInto(el.body, content.slice(0, BIG_TEXT_BYTES), true);
        } else {
          renderStatic(item.kind, content);
        }
        el.foot.hidden = true;
      }
    } catch (error) {
      if (!isCurrent(read)) return;
      clear(el.body);
      el.body.appendChild(div('fv-error', tr("内容读取失败：", "Could not read the file: ") + (error && error.message ? error.message : error)));
    }
  }

  el.toggle.addEventListener('click', async () => {
    if (!current || el.toggle.hidden) return;
    if (showingSource) { await render(); return; }
    const read = beginRender();
    try {
      const content = await fetchText(read.item.viewUrl, tr("文件", "file"), read.signal);
      if (!isCurrent(read)) return;
      showSource(content);
      el.toggle.textContent = read.item.kind === 'html' ? tr("看预览", "View Preview") : tr("看渲染", "View Preview");
    } catch (error) {
      if (!isCurrent(read)) return;
      clear(el.body);
      el.body.appendChild(div('fv-error', tr("内容读取失败：", "Could not read the file: ") + (error && error.message ? error.message : error)));
    }
  });
  el.reveal.addEventListener('click', () => { if (current && window.openbotViewer) window.openbotViewer.reveal(); });
  el.system.addEventListener('click', () => { if (current && window.openbotViewer) window.openbotViewer.systemOpen(); });
  window.addEventListener('pagehide', () => {
    renderEpoch++;
    if (pendingRead) pendingRead.abort();
  });

  if (window.openbotViewer) {
    window.openbotViewer.onOpen((payload) => {
      if (!payload || !payload.viewUrl) return;
      current = payload;
      render();
    });
  }
})();
