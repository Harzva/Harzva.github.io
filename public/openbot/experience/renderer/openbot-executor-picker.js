/* Accessible, local-only executor picker for the New Bot dialog. */
(function (root) {
  'use strict';

  var executors = [];
  var defaultExecutorId = '';
  var activeId = '';
  var initialized = false;
  var callbacks = {};
  var els = {};

  var brandFiles = {
    dsh: 'dsh.svg',
    pi: 'pi.svg',
    legacy: 'legacy.svg',
    codex: 'codex.svg',
    claude: 'claude.svg',
    gemini: 'gemini.svg',
    kimi: 'kimi.svg',
    qwen: 'qwen.svg',
    grok: 'grok.svg',
    agy: 'agy.svg',
    opencode: 'opencode.svg',
    'cursor-agent': 'cursor-agent.svg',
    goose: 'goose.svg',
    copilot: 'copilot.svg',
    amp: 'amp.svg',
    aider: 'aider.png',
    codebuddy: 'codebuddy.svg',
    cline: 'cline.svg'
  };

  function t(zh, en, params) {
    return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en, params) : (root.document.documentElement.lang === 'en' ? en : zh);
  }

  function logoFile(executor) {
    var brand = logoBrand(executor);
    return brandFiles[brand] || 'generic.svg';
  }

  function logoBrand(executor) {
    if (!executor) return 'generic';
    var id = String(executor.id || '');
    if (id.indexOf('agent:') === 0) {
      var nativeId = id.slice(6);
      return nativeIds.indexOf(nativeId) >= 0 ? nativeId : 'generic';
    }
    return ['dsh', 'pi', 'legacy'].indexOf(id) >= 0 ? id : 'generic';
  }

  var nativeIds = [
    'codex', 'claude', 'gemini', 'kimi', 'qwen', 'grok', 'agy', 'pi',
    'opencode', 'cursor-agent', 'goose', 'copilot', 'amp', 'aider', 'codebuddy', 'workbuddy', 'cline'
  ];

  function createLogo(executor, containerClass) {
    var wrap = root.document.createElement('span');
    wrap.className = containerClass;
    wrap.dataset.brand = logoBrand(executor);
    wrap.setAttribute('aria-hidden', 'true');

    var fallback = root.document.createElement('span');
    fallback.className = 'executor-logo-plain';
    fallback.setAttribute('aria-hidden', 'true');
    fallback.innerHTML = '<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>';
    fallback.style.background = 'none';
    wrap.appendChild(fallback);

    var image = root.document.createElement('img');
    image.alt = '';
    image.width = 24;
    image.height = 24;
    image.decoding = 'async';
    var darkSource = null;
    if (logoBrand(executor) === 'workbuddy') {
      var picture = root.document.createElement('picture');
      darkSource = root.document.createElement('source');
      darkSource.media = '(prefers-color-scheme: dark)';
      darkSource.srcset = 'assets/agent-hud/workbuddy-dark.png';
      picture.appendChild(darkSource);
      image.src = 'assets/agent-hud/workbuddy-light.png';
      picture.appendChild(image);
      wrap.appendChild(picture);
    } else {
      image.src = 'assets/agent-logos/' + logoFile(executor);
      wrap.appendChild(image);
    }
    image.addEventListener('error', function () {
      if (!image.dataset.genericFallback) {
        image.dataset.genericFallback = 'true';
        if (darkSource) darkSource.removeAttribute('srcset');
        image.src = 'assets/agent-logos/generic.svg';
      } else {
        image.hidden = true;
        wrap.classList.add('is-fallback');
      }
    });
    return wrap;
  }

  function statusFor(executor) {
    if (executor.id === defaultExecutorId) {
      return { code: 'default', text: t('默认', 'Default') };
    }
    if (executor.available === true) {
      return { code: 'available', text: t('可用', 'Available') };
    }
    return { code: 'missing', text: t('未检测到', 'Not detected') };
  }

  function filteredExecutors() {
    var query = String(els.search.value || '').trim().toLocaleLowerCase();
    if (!query) return executors.slice();
    return executors.filter(function (executor) {
      return [executor.name, executor.id, executor.description].join(' ').toLocaleLowerCase().indexOf(query) >= 0;
    });
  }

  function setActive(id) {
    activeId = id || '';
    var options = els.options.querySelectorAll('[data-executor-id]');
    Array.prototype.forEach.call(options, function (option) {
      var active = option.dataset.executorId === activeId;
      option.classList.toggle('is-active', active);
    });
    var activeOption = activeId ? Array.prototype.slice.call(options).find(function (option) {
      return option.dataset.executorId === activeId;
    }) : null;
    if (activeOption) {
      els.search.setAttribute('aria-activedescendant', activeOption.id);
      if (activeOption.scrollIntoView) activeOption.scrollIntoView({ block: 'nearest' });
    } else {
      els.search.removeAttribute('aria-activedescendant');
    }
  }

  function renderOptions() {
    if (!els.options) return;
    var selectedId = callbacks.getSelectedId ? callbacks.getSelectedId() : '';
    var visible = filteredExecutors();
    var fragment = root.document.createDocumentFragment();
    activeId = '';

    visible.forEach(function (executor, index) {
      var option = root.document.createElement('div');
      option.className = 'executor-option';
      option.id = 'm-executor-option-' + index;
      option.dataset.executorId = executor.id;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', executor.id === selectedId ? 'true' : 'false');
      option.setAttribute('aria-disabled', executor.available === true ? 'false' : 'true');
      if (executor.available !== true) option.classList.add('is-unavailable');
      if (executor.id === selectedId) option.classList.add('is-selected');

      option.appendChild(createLogo(executor, 'executor-option-logo'));

      var copy = root.document.createElement('span');
      copy.className = 'executor-option-copy';
      var name = root.document.createElement('span');
      name.className = 'executor-option-name';
      name.textContent = executor.name;
      copy.appendChild(name);
      option.appendChild(copy);

      var status = statusFor(executor);
      var badge = root.document.createElement('span');
      badge.className = 'executor-status';
      badge.dataset.state = status.code;
      badge.textContent = status.text;
      option.appendChild(badge);

      var check = root.document.createElement('span');
      check.className = 'executor-selected-mark';
      check.setAttribute('aria-hidden', 'true');
      check.textContent = '✓';
      option.appendChild(check);
      fragment.appendChild(option);
    });

    els.options.replaceChildren(fragment);
    var empty = visible.length === 0;
    els.empty.classList.toggle('hidden', !empty);
    els.options.classList.toggle('is-empty', empty);
    setActive('');
  }

  function syncCurrent() {
    var selectedId = callbacks.getSelectedId ? callbacks.getSelectedId() : '';
    var selected = executors.find(function (executor) { return executor.id === selectedId; });
    els.trigger.disabled = !!(els.nativeSelect && els.nativeSelect.disabled);
    els.trigger.setAttribute('aria-expanded', els.popover.classList.contains('hidden') ? 'false' : 'true');

    els.currentLogo.replaceChildren();
    if (selected) {
      els.currentLogo.appendChild(createLogo(selected, 'executor-current-logo-image'));
      els.currentName.textContent = selected.name;
      els.trigger.setAttribute('aria-label', t('执行器：{name}', 'Executor: {name}', { name: selected.name }));
    } else {
      els.currentName.textContent = t('请选择执行器', 'Choose an executor');
      els.trigger.setAttribute('aria-label', t('执行器', 'Executor'));
    }
    if (!els.popover.classList.contains('hidden')) renderOptions();
  }

  function open(initialDirection) {
    if (!initialized || els.trigger.disabled) return;
    els.search.value = '';
    els.popover.classList.remove('hidden');
    els.trigger.setAttribute('aria-expanded', 'true');
    renderOptions();
    if (initialDirection) moveActive(initialDirection);
    els.search.focus({ preventScroll: true });
  }

  function close(restoreFocus) {
    if (!initialized) return;
    var wasOpen = !els.popover.classList.contains('hidden');
    els.popover.classList.add('hidden');
    els.trigger.setAttribute('aria-expanded', 'false');
    activeId = '';
    els.search.removeAttribute('aria-activedescendant');
    if (restoreFocus && wasOpen && !els.trigger.disabled) els.trigger.focus({ preventScroll: true });
  }

  function moveActive(direction) {
    var visible = filteredExecutors().filter(function (executor) { return executor.available === true; });
    if (!visible.length) {
      setActive('');
      return;
    }
    var currentIndex = visible.findIndex(function (executor) { return executor.id === activeId; });
    var nextIndex;
    if (currentIndex < 0) nextIndex = direction < 0 ? visible.length - 1 : 0;
    else nextIndex = (currentIndex + direction + visible.length) % visible.length;
    setActive(visible[nextIndex].id);
  }

  function jumpActive(toEnd) {
    var visible = filteredExecutors().filter(function (executor) { return executor.available === true; });
    setActive(visible.length ? visible[toEnd ? visible.length - 1 : 0].id : '');
  }

  function choose(id) {
    var executor = executors.find(function (item) { return item.id === id; });
    if (!executor || executor.available !== true || els.trigger.disabled) return;
    if (callbacks.onSelect) callbacks.onSelect(id);
    close(true);
  }

  function init(options) {
    if (initialized) return;
    callbacks = options || {};
    els.nativeSelect = root.document.getElementById('m-executor');
    els.trigger = root.document.getElementById('m-executor-trigger');
    els.currentLogo = root.document.getElementById('m-executor-current-logo');
    els.currentName = root.document.getElementById('m-executor-current-name');
    els.popover = root.document.getElementById('m-executor-popover');
    els.search = root.document.getElementById('m-executor-search');
    els.options = root.document.getElementById('m-executor-options');
    els.empty = root.document.getElementById('m-executor-empty');
    if (!els.trigger || !els.popover || !els.search || !els.options || !els.empty) return;
    initialized = true;

    els.trigger.addEventListener('click', function () {
      if (els.popover.classList.contains('hidden')) open();
      else close(false);
    });
    els.search.addEventListener('input', function () {
      renderOptions();
    });
    els.search.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        moveActive(event.key === 'ArrowDown' ? 1 : -1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        jumpActive(event.key === 'End');
      } else if (event.key === 'Enter') {
        event.preventDefault();
        var eligible = filteredExecutors().filter(function (executor) { return executor.available === true; });
        if (activeId) choose(activeId);
        else if (eligible.length === 1) choose(eligible[0].id);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      } else if (event.key === 'Tab') {
        close(false);
      }
    });
    els.trigger.addEventListener('keydown', function (event) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].indexOf(event.key) < 0) return;
      event.preventDefault();
      open(event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0);
    });
    els.options.addEventListener('pointerdown', function (event) {
      if (event.target.closest('[data-executor-id]')) event.preventDefault();
    });
    els.options.addEventListener('pointerover', function (event) {
      var option = event.target.closest('[data-executor-id]');
      if (option && option.getAttribute('aria-disabled') !== 'true') setActive(option.dataset.executorId);
    });
    els.options.addEventListener('click', function (event) {
      var option = event.target.closest('[data-executor-id]');
      if (option) choose(option.dataset.executorId);
    });
    root.document.addEventListener('pointerdown', function (event) {
      var picker = root.document.getElementById('m-executor-picker');
      if (picker && !picker.contains(event.target)) close(false);
    });
    syncCurrent();
  }

  function setExecutors(list, defaultId) {
    executors = Array.isArray(list) ? list.slice() : [];
    defaultExecutorId = typeof defaultId === 'string' ? defaultId : '';
    if (!initialized) return;
    renderOptions();
    syncCurrent();
  }

  function reset() {
    close(false);
    executors = [];
    defaultExecutorId = '';
    if (initialized) {
      els.search.value = '';
      renderOptions();
      syncCurrent();
    }
  }

  root.OpenBotExecutorPicker = {
    init: init,
    setExecutors: setExecutors,
    reset: reset,
    sync: syncCurrent,
    close: close
  };
})(window);
