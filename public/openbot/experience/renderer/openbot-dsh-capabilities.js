/* The current Bot's DSH bindings and inspected capabilities. */
(function (root) {
  'use strict';

  const views = new WeakMap();
  let nextId = 0;
  const tr = (zh, en) => root.OpenBotI18n ? root.OpenBotI18n.t(zh, en) :
    (document.documentElement.lang.startsWith('en') ? en : zh);
  const array = value => Array.isArray(value) ? value : [];
  const text = value => typeof value === 'string' ? value : '';
  const hash = /^[a-f0-9]{64}$/i;

  function element(tag, className, value) {
    const node = document.createElement(tag);
    node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function button(className, label, handler) {
    const control = element('button', className, label);
    control.type = 'button';
    control.addEventListener('click', handler);
    return control;
  }

  function isCurrent(view) {
    return views.get(view.container) === view && view.container.isConnected;
  }

  function preferenceOf(value) {
    if (typeof value?.autoInstall !== 'boolean' || !Number.isSafeInteger(value.revision) || value.revision < 0) return null;
    return { autoInstall: value.autoInstall, revision: value.revision };
  }

  function stateOf(result, botId) {
    const state = result?.state ?? result;
    if (result?.ok === false || (result?.botId !== undefined && String(result.botId) !== botId) ||
        String(state?.profile ?? '') !== botId || !Array.isArray(state.boundPlugins)) throw new Error('Unexpected DSH state');
    return state;
  }

  function projections(state) {
    const items = [];
    const seen = new Set();
    const pending = state?.pendingActivation;
    for (const entry of array(state?.boundPlugins)) {
      const key = text(entry?.artifactId) || text(entry?.id);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      items.push({ ...entry, key });
    }
    const pendingId = text(pending?.artifactId);
    if (pendingId && !seen.has(pendingId)) {
      const admitted = array(state?.admitted).find(entry => entry?.artifactId === pendingId);
      items.push({ ...admitted, key: pendingId, artifactId: pendingId, version: text(pending.version),
        enabled: false, status: 'pending' });
    }
    return items;
  }

  function verifiedTools(entry) {
    const fingerprint = text(entry.source?.bundleSha256);
    if (!hash.test(fingerprint) || fingerprint !== entry.inspection?.bundleSha256 || !Array.isArray(entry.inspection?.tools)) return null;
    return new Set(entry.inspection.tools.filter(name => typeof name === 'string' && name));
  }

  function bindingLabel(entry, tools) {
    if (entry.status === 'pending' || entry.status === 'admitted') return tr('待启用', 'Pending');
    if (entry.status === 'unavailable' || entry.status === 'disabled' || entry.enabled === false) return tr('不可用', 'Unavailable');
    return entry.enabled === true && tools ? tr('已绑定', 'Bound') : tr('未核验', 'Unverified');
  }

  function keyFocus(node, key) {
    node.dataset.obDshFocus = key;
    return node;
  }

  function appendTools(section, entry, verified) {
    if (!verified) {
      section.append(element('p', 'ob-dsh-cap__meta', tr('尚未核验此版本的工具。', 'Tools for this version have not been verified.')));
      return;
    }
    const capabilities = array(entry.capabilities);
    const shown = new Set();
    for (const capability of capabilities) {
      const names = Array.from(new Set(array(capability?.tools).filter(name => verified.has(name))));
      if (!names.length) continue;
      const allowed = new Set(capability.enabled === true ? array(capability.allowedTools) : []);
      const group = element('div', 'ob-dsh-cap__capability');
      const title = text(capability.title) || text(capability.id);
      if (title) group.append(element('p', 'ob-dsh-cap__capability-title', title));
      const list = element('ul', 'ob-dsh-cap__tools');
      for (const name of names) {
        shown.add(name);
        const tool = element('li', 'ob-dsh-cap__tool');
        tool.append(element('code', 'ob-dsh-cap__tool-name', name));
        if (!allowed.has(name)) tool.append(element('span', 'ob-dsh-cap__meta', tr('未授权', 'Not allowed')));
        list.append(tool);
      }
      group.append(list);
      section.append(group);
    }
    const unassigned = Array.from(verified).filter(name => !shown.has(name));
    if (unassigned.length) {
      const list = element('ul', 'ob-dsh-cap__tools');
      for (const name of unassigned) {
        const tool = element('li', 'ob-dsh-cap__tool');
        tool.append(element('code', 'ob-dsh-cap__tool-name', name), element('span', 'ob-dsh-cap__meta', tr('未授权', 'Not allowed')));
        list.append(tool);
      }
      section.append(list);
    }
    if (!verified.size) section.append(element('p', 'ob-dsh-cap__meta', tr('未发现工具。', 'No tools were found.')));
  }

  function showFeedback(view, value, failed = false) {
    view.feedback.textContent = value;
    view.feedback.classList.toggle('is-error', failed);
  }

  function mutationMessage(error) {
    switch (error?.code) {
      case 'DSH_HUB_BUSY': return tr('请等当前任务结束后再更改。', 'Wait for the current task to finish before making changes.');
      case 'STALE_REVISION': return tr('插件设置已变化，请重试。', 'Plugin settings have changed. Try again.');
      case 'DSH_HUB_APPROVAL_DENIED': return tr('未批准此更改。', 'This change was not approved.');
      default: return tr('未能确认此更改，请重试。', 'Could not confirm the change. Try again.');
    }
  }

  function configureControls(view) {
    const canRead = view.supported && typeof view.bridge?.getDshHubState === 'function';
    view.add.hidden = !view.supported;
    view.add.disabled = !canRead || view.mutating || typeof view.onOpenMarket !== 'function';
    view.add.setAttribute('aria-disabled', String(view.add.disabled || !!view.opening));
    view.settings.hidden = !view.supported;
    view.toggle.disabled = !view.preference || view.loading || view.mutating ||
      typeof view.bridge?.setDshHubAutoInstall !== 'function';
    view.toggle.checked = view.preference?.autoInstall === true;
    view.list.querySelectorAll('[data-ob-dsh-remove]').forEach(control => { control.disabled = view.loading || view.mutating; });
  }

  function pluginRow(view, entry, expanded) {
    const title = text(entry.title) || text(entry.source?.packageName) || entry.key;
    const version = text(entry.version);
    const tools = verifiedTools(entry);
    const row = element('details', 'ob-dsh-cap__plugin');
    row.dataset.obDshPlugin = entry.key;
    row.open = expanded;
    const summary = keyFocus(element('summary', 'ob-dsh-cap__summary'), 'plugin:' + entry.key);
    const name = element('span', 'ob-dsh-cap__identity');
    const nameLabel = element('span', 'ob-dsh-cap__name', title);
    nameLabel.title = title;
    name.append(nameLabel);
    if (version) name.append(element('span', 'ob-dsh-cap__meta', version));
    summary.append(name, element('span', 'ob-dsh-cap__state', bindingLabel(entry, tools)));
    row.append(summary);

    const body = element('div', 'ob-dsh-cap__detail');
    const source = text(entry.source?.packageName) || text(entry.artifactId);
    if (source) {
      const origin = entry.source?.type === 'git' ? 'Git' : (entry.source?.packageName ? 'npm' : 'dsh.fish');
      const label = tr('来源', 'Source') + ' · ' + origin;
      const line = element('p', 'ob-dsh-cap__source', label + ' ');
      line.append(element('code', 'ob-dsh-cap__tool-name', source + (version ? '@' + version : '')));
      body.append(line);
    }
    if (entry.status === 'pending') {
      body.append(element('p', 'ob-dsh-cap__meta', tr('等待当前工具批次完成。', 'Waiting for the current tool batch to finish.')));
    } else if (entry.enabled === true) {
      body.append(element('p', 'ob-dsh-cap__meta', tr(
        '此 Bot 的配置已绑定该插件，后续任务会尝试装配。',
        'This plugin is bound in this Bot’s settings and will be loaded when available in future tasks.')));
    }
    appendTools(body, entry, tools);
    if (entry.enabled === true && entry.artifactId && typeof view.bridge?.dshHubAction === 'function') {
      const remove = keyFocus(button('ob-dsh-cap__action ob-dsh-cap__remove', tr('解除绑定', 'Unbind'), () => {
        if (!isCurrent(view) || !remove.isConnected || remove.disabled) return;
        void mutate(view, () => view.bridge.dshHubAction({ botId: view.botId, action: 'remove', artifactId: entry.artifactId }),
          result => {
            const receipt = result?.result ?? result;
            if (receipt?.artifactId !== entry.artifactId || receipt?.enabled !== false) throw new Error('Unexpected DSH unbind receipt');
          });
      }), 'remove:' + entry.key);
      remove.dataset.obDshRemove = '';
      body.append(remove);
    }
    row.append(body);
    return row;
  }

  function renderList(view) {
    const list = view.list;
    const expanded = new Set(Array.from(list.querySelectorAll('details[open]')).map(row => row.dataset.obDshPlugin));
    const focused = list.contains(document.activeElement) ? document.activeElement.dataset.obDshFocus : '';
    const scroll = view.container.scrollTop;
    list.replaceChildren();
    if (!view.supported) {
      list.append(element('p', 'ob-dsh-cap__meta', tr('当前 Bot 不支持 DSH 插件。', 'This Bot does not support DSH plugins.')));
    } else if (view.loadFailed) {
      const note = element('p', 'ob-dsh-cap__meta', tr('未能读取此 Bot 的插件。', 'Could not load this Bot’s plugins.'));
      note.setAttribute('role', 'status');
      list.append(note, keyFocus(button('ob-dsh-cap__action', tr('重试', 'Retry'), () => void load(view)), 'retry'));
    } else if (!view.state) {
      const note = element('p', 'ob-dsh-cap__meta', tr('正在读取插件…', 'Loading plugins…'));
      note.setAttribute('role', 'status');
      list.append(note);
    } else {
      const items = projections(view.state);
      if (items.length) {
        for (const item of items) list.append(pluginRow(view, item, expanded.has(item.key)));
      } else {
        list.append(element('p', 'ob-dsh-cap__meta', tr('此 Bot 还没有绑定插件。', 'This Bot has no bound plugins.')));
      }
    }
    configureControls(view);
    if (focused) {
      const target = Array.from(list.querySelectorAll('[data-ob-dsh-focus]'))
        .find(item => item.dataset.obDshFocus === focused && !item.disabled);
      (target || view.add).focus({ preventScroll: true });
    }
    view.container.scrollTop = scroll;
  }

  async function load(view) {
    if (!isCurrent(view) || !view.supported || view.mutating) return false;
    const ticket = ++view.epoch;
    view.loading = true;
    configureControls(view);
    try {
      if (typeof view.bridge?.getDshHubState !== 'function') throw new Error('DSH state unavailable');
      const result = await view.bridge.getDshHubState({ botId: view.botId });
      if (!isCurrent(view) || view.epoch !== ticket) return false;
      view.state = stateOf(result, view.botId);
      view.preference = preferenceOf(view.state.preference);
      view.loadFailed = false;
      return true;
    } catch (_) {
      if (!isCurrent(view) || view.epoch !== ticket) return false;
      view.state = null;
      view.preference = null;
      view.loadFailed = true;
      return false;
    } finally {
      if (isCurrent(view) && view.epoch === ticket) {
        view.loading = false;
        renderList(view);
      }
    }
  }

  async function mutate(view, request, confirm) {
    if (!isCurrent(view) || view.loading || view.mutating) return;
    const focused = document.activeElement;
    const focusKey = view.list.contains(focused) ? focused.dataset.obDshFocus : '';
    view.mutating = true;
    showFeedback(view, tr('正在保存…', 'Saving…'));
    configureControls(view);
    try {
      const result = await request();
      if (!isCurrent(view)) return;
      if (result?.ok === false) throw result;
      if (result?.botId !== undefined && String(result.botId) !== view.botId) throw new Error('Unexpected DSH mutation scope');
      confirm(result);
      showFeedback(view, '');
    } catch (error) {
      if (isCurrent(view)) showFeedback(view, mutationMessage(error), true);
    } finally {
      if (isCurrent(view)) {
        view.mutating = false;
        await load(view);
        if (isCurrent(view) && document.activeElement === document.body) {
          const replacement = focusKey && Array.from(view.list.querySelectorAll('[data-ob-dsh-focus]'))
            .find(control => control.dataset.obDshFocus === focusKey);
          const target = focused === view.toggle ? view.toggle : replacement || (focusKey ? view.add : null);
          if (target && !target.disabled) target.focus({ preventScroll: true });
        }
      }
    }
  }

  async function openMarket(view) {
    if (!isCurrent(view) || view.add.disabled || view.opening) return;
    view.opening = true;
    configureControls(view);
    showFeedback(view, '');
    try {
      const result = await view.onOpenMarket({ botId: view.botId, scopeKey: view.scopeKey,
        onClose: () => { if (isCurrent(view)) void load(view); } });
      if (result === false || result?.ok === false) throw new Error('Could not open Hub');
    } catch (_) {
      if (isCurrent(view)) showFeedback(view, tr('未能打开插件市场。', 'Could not open the plugin market.'), true);
    } finally {
      if (isCurrent(view)) {
        view.opening = false;
        configureControls(view);
      }
    }
  }

  function dispose(container) {
    const view = views.get(container);
    if (!view) return;
    views.delete(container);
    view.epoch++;
    container.replaceChildren();
  }

  function refresh(container, scope) {
    const view = views.get(container);
    if (!view || (scope && (String(scope.botId) !== view.botId || String(scope.scopeKey) !== view.scopeKey))) {
      return Promise.resolve(false);
    }
    return load(view);
  }

  function mount(container, options = {}) {
    if (!container || typeof container.replaceChildren !== 'function') return false;
    const botId = text(options.botId), scopeKey = text(options.scopeKey), supported = options.supported === true;
    const previous = views.get(container);
    if (previous && previous.botId === botId && previous.scopeKey === scopeKey && previous.supported === supported &&
        previous.bridge === options.bridge) {
      previous.onOpenMarket = options.onOpenMarket;
      configureControls(previous);
      return true;
    }
    dispose(container);
    if (!botId || !scopeKey) return false;

    const view = { container, botId, scopeKey, supported, bridge: options.bridge, onOpenMarket: options.onOpenMarket,
      epoch: 0, state: null, preference: null };
    views.set(container, view);
    const shell = element('div', 'ob-dsh-cap');
    const header = element('header', 'ob-dsh-cap__header');
    view.add = button('ob-dsh-cap__action', tr('+ 添加插件', '+ Add plugin'), () => void openMarket(view));
    header.append(element('h2', 'ob-dsh-cap__title', tr('DSH 插件', 'DSH plugins')), view.add);
    view.list = element('div', 'ob-dsh-cap__list');
    view.settings = element('div', 'ob-dsh-cap__settings');
    const switchRow = element('label', 'ob-dsh-cap__switch');
    view.toggle = element('input', 'ob-dsh-cap__checkbox');
    view.toggle.type = 'checkbox';
    const help = element('p', 'ob-dsh-cap__meta', tr(
      '允许此 Bot 在需要时安装并运行插件代码。安装脚本不会执行；设置仅影响后续任务。',
      'Let this Bot install and run plugin code as needed. Install scripts are blocked. Applies to future tasks.'));
    help.id = 'ob-dsh-cap-help-' + (++nextId);
    view.toggle.setAttribute('aria-describedby', help.id);
    view.toggle.addEventListener('change', () => {
      if (!isCurrent(view) || !view.preference || view.toggle.disabled) return;
      const enabled = view.toggle.checked;
      const expectedRevision = view.preference.revision;
      void mutate(view, () => view.bridge.setDshHubAutoInstall({ botId, enabled, expectedRevision }), result => {
        const saved = preferenceOf(result?.preference ?? result?.result ?? result);
        if (!saved || saved.autoInstall !== enabled || saved.revision < expectedRevision) throw new Error('Unexpected DSH preference receipt');
        view.preference = saved;
      });
    });
    switchRow.append(element('span', '', tr('按需安装插件', 'Install plugins as needed')), view.toggle);
    view.settings.append(switchRow, help);
    view.feedback = element('p', 'ob-dsh-cap__feedback');
    view.feedback.setAttribute('role', 'status');
    shell.append(header, view.list, view.settings, view.feedback);
    container.replaceChildren(shell);
    container.scrollTop = 0;
    renderList(view);
    if (supported) void load(view);
    return true;
  }

  root.OpenBotDshCapabilities = Object.freeze({ mount, refresh, dispose });
})(window);
