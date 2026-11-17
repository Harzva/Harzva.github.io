(function (global) {
  'use strict';
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }
  function mount(root, options) {
    if (!root) return;
    var botId = options.botId, tr = options.tr || function (zh) { return zh; }, serial = 0;
    root.innerHTML = '<details data-executor-assets><summary>' + esc(tr('Bot 指令与执行器配置', 'Bot instructions and executor configuration')) +
      '</summary><div class="cfg-note" data-assets-status role="status"></div><div data-assets-content></div></details>';
    var details = root.querySelector('details'), status = root.querySelector('[data-assets-status]'), content = root.querySelector('[data-assets-content]');
    function current(ticket) { return ticket === serial && root.isConnected && root.contains(details) && options.getActiveBotId() === botId; }
    function list(rows, empty) {
      return rows.length ? '<ul>' + rows.map(function (row) { return '<li>' + esc(row) + '</li>'; }).join('') + '</ul>' : '<p class="cfg-note">' + esc(empty) + '</p>';
    }
    function dshBody(dsh) {
      if (dsh.status !== 'available') return '<p class="cfg-note">' + esc(dsh.status === 'not_configured' ?
        tr('此 Bot 尚无已保存的 DSH 插件配置。', 'This Bot has no saved DSH plugin configuration.') :
        tr('当前无法核验此 Bot 的 DSH 插件配置。', 'This Bot’s DSH plugin configuration could not be verified.')) + '</p>';
      return '<p class="cfg-note">' + esc(tr('来自已保存的配置；不代表本轮任务已加载或执行。', 'From saved configuration; this does not prove loading or execution in a turn.')) + '</p>' +
        list((dsh.plugins || []).map(function (row) { return row.id + ' · ' + (row.enabled ? tr('已配置启用', 'Configured on') : tr('已关闭', 'Off')); }), tr('未配置插件', 'No plugins configured')) +
        '<p class="cfg-note">' + esc(tr('可用工具配置', 'Configured tools')) + '</p>' + list(dsh.allowedTools || [], tr('未配置工具', 'No tools configured'));
    }
    async function load() {
      var ticket = ++serial;
      content.innerHTML = '';
      status.textContent = tr('正在读取当前 Bot 的配置…', 'Reading this Bot’s configuration…');
      try {
        if (!options.bridge || typeof options.bridge.getExecutorAssets !== 'function') throw new Error('unavailable');
        var result = await options.bridge.getExecutorAssets(botId);
        if (!current(ticket)) return;
        if (!result || result.ok !== true || result.botId !== botId || result.readOnly !== true) throw new Error('unverified');
        var binding = result.binding || {}, native = result.native, dsh = result.dsh || {};
        var fields = [[tr('固定执行器', 'Fixed executor'), binding.executorId], [tr('连接方式', 'Connection'), binding.transport],
          [tr('模型', 'Model'), binding.model || tr('沿用执行器配置', 'Executor configuration')]];
        if (native) fields.push(['Home', native.homeId || tr('由原生执行器管理', 'Managed by the native executor')]);
        var html = '<dl>' + fields.map(function (row) { return '<dt class="cfg-note">' + esc(row[0]) + '</dt><dd style="margin:0 0 8px;overflow-wrap:anywhere">' + esc(row[1]) + '</dd>'; }).join('') + '</dl>';
        html += '<div class="cfg-title">' + esc(tr('此 Bot 的指令文本', 'This Bot’s instruction text')) + '</div>' +
          '<p class="cfg-note">' + esc(tr('仅属于此 Bot。它们是对话指令，不是原生 Skill 或插件加载回执；可在 Bot 空间中编辑。', 'Private to this Bot. These are conversation instructions, not native Skill or plugin load receipts. Edit them in Bot space.')) + '</p>' +
          list((result.instructions && result.instructions.private || []).map(function (row) { return row.text; }), tr('尚未添加指令文本。', 'No instruction text yet.'));
        if (native) html += '<p class="cfg-note">' + esc(tr('原生 Skill / MCP 由此执行器自己的 Home 与配置管理。尚未取得加载回执；不会把 DSH 插件当作原生能力。', 'Native Skills and MCP are managed by this executor’s Home and configuration. Load receipts have not been observed; DSH plugins are not native capabilities.')) + '</p>';
        if (dsh.current) html += '<div class="cfg-title">DSH ' + esc(tr('插件配置', 'plugin configuration')) + '</div>' + dshBody(dsh);
        else if (dsh.status === 'available') html += '<details><summary>' + esc(tr('历史 DSH 配置（只读，当前不适用）', 'Historical DSH configuration (read-only, inactive)')) + '</summary>' + dshBody(dsh) + '</details>';
        content.innerHTML = html;
        status.textContent = tr('只读查看，不会安装、启用或启动执行器。', 'Read-only. Viewing does not install, enable or start an executor.');
      } catch (_) {
        if (current(ticket)) { content.innerHTML = ''; status.textContent = tr('配置尚未核验，请收起后重新打开。', 'Configuration is unverified. Close and reopen this section to try again.'); }
      }
    }
    details.addEventListener('toggle', function () { if (details.open) load(); else { serial++; content.innerHTML = ''; status.textContent = ''; } });
  }
  global.OpenBotExecutorAssets = { mount: mount };
})(window);
