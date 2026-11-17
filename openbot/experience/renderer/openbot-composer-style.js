(function (root) {
  'use strict';
  if (root.OpenBotComposerStyle) return;
  var KEY = 'openbot.composer-shape.v1';
  var shapes = ['pill', 'soft', 'compact'];
  var shape = 'pill';
  var editors = new WeakMap();
  function tr(zh, en) { return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en) : zh; }
  function name(value) {
    return value === 'pill' ? tr('胶囊', 'Capsule') : value === 'soft' ? tr('圆润', 'Rounded') : tr('微圆', 'Subtle');
  }
  function next() { return shapes[(shapes.indexOf(shape) + 1) % shapes.length]; }
  function paintControl(button) {
    button.dataset.composerShape = shape;
    button.querySelector('[data-composer-shape-label]').textContent = tr('圆角：', 'Shape: ') + name(shape);
    var label = tr('输入框圆角：', 'Input shape: ') + name(shape) + tr('；点击切换为', '; switch to ') + name(next());
    button.setAttribute('aria-label', label);
    button.title = label;
    button.querySelector('rect').setAttribute('rx', shape === 'pill' ? '6' : shape === 'soft' ? '3.5' : '1.5');
  }
  function apply(value, persist) {
    shape = shapes.indexOf(value) >= 0 ? value : 'pill';
    document.body.dataset.openbotComposerShape = shape;
    document.querySelectorAll('[data-openbot-composer-shape-control]').forEach(paintControl);
    if (persist) {
      try { root.localStorage.setItem(KEY, shape); } catch (_) { /* Keep the current window usable when storage is unavailable. */ }
    }
  }
  function createControl() {
    var button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-openbot-composer-shape-control', '');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 20 20'); svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.5');
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '2'); rect.setAttribute('y', '4'); rect.setAttribute('width', '16'); rect.setAttribute('height', '12');
    svg.appendChild(rect); button.appendChild(svg);
    var label = document.createElement('span'); label.setAttribute('data-composer-shape-label', ''); button.appendChild(label);
    button.addEventListener('click', function () { apply(next(), true); });
    paintControl(button);
    return button;
  }
  function resizeInput(input) {
    var editor = editors.get(input);
    if (!editor || editor.frame) return;
    editor.frame = root.requestAnimationFrame(function () {
      editor.frame = 0;
      if (!input.isConnected || !input.clientWidth) return;
      var width = input.clientWidth, text = input.value;
      if (editor.width === width && editor.text === text) return;
      editor.width = width; editor.text = text;
      var scroll = input.scrollTop;
      input.style.height = 'auto';
      var style = root.getComputedStyle(input);
      var border = (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);
      var height = Math.max(parseFloat(style.minHeight) || 40, input.scrollHeight + border);
      var max = parseFloat(style.maxHeight) || 220;
      input.style.height = Math.min(max, height) + 'px';
      input.style.overflowY = height > max ? 'auto' : 'hidden';
      input.scrollTop = scroll;
    });
  }
  function watchInput(input) {
    if (editors.has(input)) return editors.get(input).dispose;
    var editor = { frame: 0, width: -1, text: null, observer: null, dispose: null };
    var schedule = function () { resizeInput(input); };
    editor.dispose = function () {
      root.cancelAnimationFrame(editor.frame);
      if (editor.observer) editor.observer.disconnect();
      input.removeEventListener('input', schedule);
      editors.delete(input);
    };
    editors.set(input, editor); input.addEventListener('input', schedule);
    if (root.ResizeObserver) { editor.observer = new root.ResizeObserver(schedule); editor.observer.observe(input); }
    resizeInput(input);
    return editor.dispose;
  }
  root.OpenBotComposerStyle = { createControl: createControl, resizeInput: resizeInput, watchInput: watchInput };
  try { shape = root.localStorage.getItem(KEY) || 'pill'; } catch (_) {}
  apply(shape, false);
  var legacy = document.querySelector('.composer-tools-actions');
  if (legacy && !legacy.querySelector('[data-openbot-composer-shape-control]')) legacy.appendChild(createControl());
  if (root.MutationObserver) new root.MutationObserver(function () { apply(shape, false); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  root.addEventListener('storage', function (event) { if (event.key === KEY) apply(event.newValue, false); });
})(window);
