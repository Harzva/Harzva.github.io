(function (root) {
  'use strict';
  var doc = root.document, refs, pending = false, reading = false, readingPromise, sequence = 0, timer, lastStatus;
  function tr(zh, en) { return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function' ? root.OpenBotI18n.t(zh, en) : zh; }
  function node(tag, className, text) { var value = doc.createElement(tag); if (className) value.className = className; if (text) value.textContent = text; return value; }
  function api(action) {
    if (!root.grokbot || typeof root.grokbot.officeRuntimeAction !== 'function') return Promise.reject(new Error(tr('此版本尚未连接文档组件。', 'This version has no Office component connection.')));
    return root.grokbot.officeRuntimeAction({ action: action }).then(function (result) {
      if (!result || !result.ok) throw new Error(result && result.message || tr('无法完成文档组件操作。', 'The Office component operation failed.'));
      return result;
    });
  }
  function render(status) {
    if (!refs || !status) return;
    lastStatus = status;
    var busy = pending || ['downloading', 'installing'].indexOf(status.state) !== -1;
    var ready = status.ok, invalid = status.sourceState === 'invalid' || status.state === 'invalid';
    refs.title.textContent = tr('Office 文档组件', 'Office documents');
    refs.description.textContent = tr('用于 DSH 的 Word、PowerPoint、Excel 转换和页面预览，以及表格公式重算。需要时安装一次，App 更新后继续保留。', 'Provides DSH Office conversion, page previews and spreadsheet recalculation. Install when needed; the component is retained across App updates.');
    refs.status.textContent = status.state === 'downloading' ? tr('正在下载', 'Downloading') + (status.bytes ? ' · ' + (status.bytes / 1000000).toFixed(1) + ' / ' + (status.totalBytes / 1000000).toFixed(1) + ' MB' : '')
      : status.state === 'installing' ? tr('正在校验并试转文档…', 'Verifying and testing conversion…')
      : ready ? tr('已就绪', 'Ready') + ' · ' + status.version
      : invalid ? tr('校验未通过 · 原文件已保留', 'Verification failed · Existing files preserved') : tr('未安装', 'Not installed');
    refs.status.dataset.state = invalid ? 'error' : ready ? 'connected' : 'pending';
    refs.size.textContent = ready ? tr('已安装的组件不会随 App 更新删除。', 'App updates keep the installed component.')
      : invalid ? tr('安装目录需要恢复。请保留原文件，核查安装记录后再处理；不会自动覆盖。', 'The installation needs recovery. Preserve its files and inspect the installation record; it will not be overwritten automatically.')
      : tr('下载约 67.3 MB，安装后约 153.2 MB。离线可导入 .tgz 安装包，或从旧版 Bot Studio 提取。', 'Download: about 67.3 MB; installed: about 153.2 MB. Offline, import the .tgz package or retain it from an older Bot Studio App.');
    refs.download.textContent = tr('下载并安装', 'Download and install');
    refs.import.textContent = tr('导入离线包', 'Import offline package');
    refs.migrate.textContent = tr('从旧版保留', 'Retain from older App');
    refs.refresh.textContent = tr('检查状态', 'Check status');
    refs.cancel.textContent = tr('取消', 'Cancel');
    [refs.download, refs.import, refs.migrate].forEach(function (button) { button.disabled = busy || ready || invalid; });
    refs.refresh.disabled = busy || reading;
    refs.cancel.hidden = !busy; refs.cancel.disabled = !busy;
    refs.container.setAttribute('aria-busy', String(busy));
  }
  function read() {
    if (reading) return readingPromise;
    reading = true;
    var own = sequence;
    readingPromise = api('status').then(function (result) { if (own === sequence) render(result.status); }).catch(function (error) { if (refs && own === sequence) refs.message.textContent = error.message; }).finally(function () {
      reading = false; if (lastStatus) render(lastStatus);
    });
    return readingPromise;
  }
  function schedule() { clearTimeout(timer); if (pending) timer = setTimeout(function () { read().finally(schedule); }, 700); }
  function run(action) {
    if (pending) return;
    var own = ++sequence; pending = true; refs.message.textContent = ''; render(lastStatus || { state: 'missing' }); schedule();
    api(action).then(function (result) {
      if (own !== sequence) return;
      render(result.status);
      refs.message.textContent = result.canceled ? tr('已取消选择。', 'Selection cancelled.') : tr('文档组件已准备好。', 'The Office component is ready.');
    }).catch(function (error) { if (own === sequence) refs.message.textContent = error.message; }).finally(function () {
      if (own !== sequence) return;
      pending = false; sequence++; clearTimeout(timer);
      Promise.resolve(readingPromise).then(read);
    });
  }
  function build() {
    var container = doc.getElementById('office-runtime-root');
    if (!container || refs) return;
    refs = { container: container, title: node('h3'), description: node('p', 'apps-description'), status: node('p', 'desktop-plugin-status'), size: node('p', 'apps-description'), message: node('p', 'desktop-plugins-message') };
    refs.status.setAttribute('role', 'status'); refs.status.setAttribute('aria-live', 'polite');
    refs.message.setAttribute('role', 'status'); refs.message.setAttribute('aria-live', 'polite');
    var actions = node('div', 'desktop-plugin-actions');
    [['download', 'download'], ['import', 'import'], ['migrate', 'import-app']].forEach(function (entry) {
      refs[entry[0]] = node('button', entry[0] === 'download' ? 'btn primary' : 'btn'); refs[entry[0]].type = 'button';
      refs[entry[0]].dataset.officeAction = entry[1]; refs[entry[0]].addEventListener('click', function () { run(entry[1]); }); actions.appendChild(refs[entry[0]]);
    });
    refs.refresh = node('button', 'btn'); refs.refresh.type = 'button'; refs.refresh.dataset.officeAction = 'status'; refs.refresh.addEventListener('click', read); actions.appendChild(refs.refresh);
    refs.cancel = node('button', 'btn'); refs.cancel.type = 'button'; refs.cancel.dataset.officeAction = 'cancel'; refs.cancel.addEventListener('click', function () {
      refs.cancel.disabled = true;
      refs.message.textContent = tr('正在取消…', 'Cancelling…');
      api('cancel').catch(function (error) { refs.message.textContent = error.message; });
    }); actions.appendChild(refs.cancel);
    container.append(refs.title, refs.description, refs.status, refs.size, actions, refs.message);
    render({ state: 'missing' });
    var panel = doc.getElementById('set-panel-apps');
    if (panel && root.MutationObserver) new root.MutationObserver(function () { if (!panel.hidden) read(); }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    if (!panel || !panel.hidden) read();
  }
  root.OpenBotOfficeRuntime = { refresh: read, render: render };
  function start() { Promise.resolve(root.OpenBotI18n && root.OpenBotI18n.ready).then(build); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})(window);
