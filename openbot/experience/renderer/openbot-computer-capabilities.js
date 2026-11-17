/* Read-only capability details. The composer owns the explicit per-run choice. */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenBotComputerCapabilities = api;
})(typeof window === 'object' ? window : null, function (root) {
  'use strict';
  function translate(zh, en) { return root && root.OpenBotI18n ? root.OpenBotI18n.t(zh, en) : en; }
  function render(container, snapshot, options) {
    if (!container || !container.ownerDocument) return null;
    var doc = container.ownerDocument, tr = options && options.tr || translate;
    while (container.firstChild) container.removeChild(container.firstChild);
    var value = snapshot && typeof snapshot === 'object' ? snapshot : {};
    function add(tag, parent, text, className) {
      var element = doc.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = String(text);
      parent.appendChild(element); return element;
    }
    function stateName(state) {
      return state === 'ready' ? tr('可用', 'Available') : state === 'disabled' ? tr('未启用', 'Off')
        : state === 'unsupported' ? tr('尚未支持', 'Not supported') : tr('尚未确认', 'Not verified');
    }
    function note(capability) {
      return capability && typeof capability.reason === 'string'
        ? tr(capability.reasonZh || capability.reason, capability.reason) : tr('尚未取得能力信息。', 'Capability information is not available yet.');
    }
    var target = value.target || {}, executor = value.executor || {};
    var where = target.kind === 'node' ? tr('所选节点', 'Selected node') : tr('这台电脑', 'This device');
    var overview = add('p', container, where + ' · ' + tr('网页操作', 'Website control') + ': ' + stateName(value.browserDom && value.browserDom.state), 'cfg-note');
    overview.setAttribute('role', 'status');
    var details = add('details', container, undefined, 'space-help');
    add('summary', details, tr('查看电脑操作能力', 'Computer control details'));
    var list = add('dl', details);
    var entries = [
      [tr('执行位置', 'Runs on'), where + (target.verified ? '' : ' · ' + tr('尚未确认连接', 'Connection not verified'))],
      [tr('执行器', 'Executor'), typeof executor.name === 'string' && executor.name || tr('尚未确认', 'Not verified')],
      [tr('网页控件', 'Website controls'), stateName(value.browserDom && value.browserDom.state) + ' — ' + note(value.browserDom)],
      [tr('截图与坐标', 'Screenshots and pointer'), stateName(value.browserVisual && value.browserVisual.state) + ' — ' + note(value.browserVisual)],
      [tr('系统桌面', 'System desktop'), stateName(value.nativeDesktop && value.nativeDesktop.state) + ' — ' + note(value.nativeDesktop)],
      [tr('远程观看与接管', 'Remote viewing and takeover'), stateName(value.remoteDesktop && value.remoteDesktop.state) + ' — ' + note(value.remoteDesktop)]
    ];
    entries.forEach(function (entry) { add('dt', list, entry[0]); add('dd', list, entry[1]); });
    if (value.cuaComputer && typeof value.cuaComputer === 'object') {
      var cua = value.cuaComputer;
      var cuaState = value.nativeCuaSupported === true
        ? tr('执行时核查', 'Checked when used') : stateName(cua.state);
      var cuaRow = add('p', details, undefined, 'cfg-note');
      cuaRow.setAttribute('role', 'status');
      add('strong', cuaRow, tr('本机应用（CUA）', 'Local apps (CUA)'));
      add('span', cuaRow, ' · ' + cuaState + ' — ' + note(cua));
    }
    add('p', details, value.permissionMode === 'per-turn'
      ? tr('在输入区选择本轮操作方式，再逐步批准动作。保留已绑定执行器的登录环境与权限设置。此信息本身不会授权。', 'Choose the control mode for this turn, then approve each action. The bound executor keeps its login environment and permission settings. Viewing these details grants no access.')
      : value.requestRequired
      ? tr('开始对话前，在输入区选择本轮操作方式；仍需相应工具权限。此信息不会更改权限。', 'Choose the control mode beside the message box for this run. The relevant tool permissions still apply. Viewing these details does not change permissions.')
      : tr('工具开关与每步授权继续生效。此信息不会更改权限。', 'The tool setting and action approvals still apply. Viewing these details does not change permissions.'), 'cfg-note');
    return { overview: overview, details: details };
  }
  return { render: render };
});
