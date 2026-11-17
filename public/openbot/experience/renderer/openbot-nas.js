(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenBotNas = api;
})(typeof window === 'object' ? window : null, function (windowRoot) {
  'use strict';

  var mounted = new WeakMap();

  function tr(zh, en, params) {
    var i18n = windowRoot && windowRoot.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en, params) : zh;
  }

  function el(doc, tag, className, text) {
    var item = doc.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined && text !== null) item.textContent = text;
    return item;
  }

  function safeText(value, max) {
    if (typeof value !== 'string') return '';
    return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max || 200);
  }

  function safeErrorMessage(error) {
    // Host errors can contain local paths or transport details. Keep the UI
    // actionable without echoing those details into the renderer.
    return tr('操作未完成，请重试或打开插件管理。', 'The action did not complete. Retry or open plugin management.');
  }

  function normalizePlugin(value) {
    var plugin = value && typeof value === 'object' ? value : {};
    return {
      installed: plugin.installed === true,
      enabled: plugin.enabled === true,
      state: safeText(plugin.state, 80),
      version: safeText(plugin.version, 80),
      hasError: Boolean(plugin.error)
    };
  }

  function normalizeOverview(value) {
    if (!value || typeof value !== 'object' || !Array.isArray(value.nodes)) return null;
    var seenNodes = new Set();
    return {
      selectedBotId: safeText(value.selectedBotId, 128),
      nodes: value.nodes.slice(0, 50).reduce(function (nodes, candidate) {
        if (!candidate || typeof candidate !== 'object') return nodes;
        var id = safeText(candidate.id, 128);
        var hostId = safeText(candidate.hostId, 128);
        if (!id || seenNodes.has(id)) return nodes;
        seenNodes.add(id);
        var seenBots = new Set();
        var bots = Array.isArray(candidate.bots) ? candidate.bots.slice(0, 100).reduce(function (items, bot) {
          if (!bot || typeof bot !== 'object') return items;
          var botId = safeText(bot.id, 128);
          if (!botId || seenBots.has(botId)) return items;
          seenBots.add(botId);
          items.push({
            id: botId,
            name: safeText(bot.name, 200) || tr('未命名 BOT', 'Unnamed Bot'),
            desktopAvailable: bot.desktopAvailable === true
          });
          return items;
        }, []) : [];
        nodes.push({
          id: id,
          hostId: hostId,
          name: safeText(candidate.name, 200) || tr('未命名节点', 'Unnamed node'),
          connected: candidate.connected === true,
          bots: bots
        });
        return nodes;
      }, [])
    };
  }

  function init(options) {
    options = options || {};
    var bridge = options.bridge;
    var container = options.root;
    if (!container || !container.ownerDocument) throw new TypeError('NAS root element is required');
    var previous = mounted.get(container);
    if (previous) {
      if (bridge) previous.setBridge(bridge);
      return previous;
    }

    var doc = container.ownerDocument;
    var state = {
      plugin: null,
      overview: null,
      loading: false,
      error: false,
      actionBusy: false,
      importBusy: false,
      message: '',
      messageState: 'idle',
      revision: 0,
      destroyed: false,
      pending: new Map(),
      unsubscribeNavigation: null,
      unsubscribeCancelled: null,
      unsubscribePluginChanged: null,
      refreshQueued: false
    };
    var onNavigate = typeof options.onNavigate === 'function' ? options.onNavigate : null;
    var onManagePlugin = typeof options.onManagePlugin === 'function' ? options.onManagePlugin : null;

    function isEnabled() {
      return !!(state.plugin && state.plugin.installed && state.plugin.enabled);
    }

    function setMessage(message, tone) {
      state.message = message || '';
      state.messageState = tone || 'idle';
      render();
    }

    function button(docRef, label, action, className, key) {
      var item = el(docRef, 'button', 'btn nas-app-button' + (className ? ' ' + className : ''), label);
      item.type = 'button';
      item.dataset.nasAction = action;
      if (key) item.dataset.nasKey = key;
      return item;
    }

    function renderStatus() {
      if (state.loading) return tr('正在读取', 'Loading');
      if (state.error) return tr('状态不可用', 'Status unavailable');
      if (!state.plugin || !state.plugin.installed) return tr('未安装', 'Not installed');
      if (!state.plugin.enabled) return tr('已停用', 'Disabled');
      return tr('已启用', 'Enabled');
    }

    function render() {
      if (state.destroyed) return;
      var active = doc.activeElement;
      var focusAction = active && container.contains(active) ? active.dataset.nasAction : '';
      var focusKey = active && container.contains(active) ? active.dataset.nasKey : '';
      container.setAttribute('aria-busy', state.loading || state.actionBusy || state.importBusy ? 'true' : 'false');
      container.replaceChildren();

      var section = el(doc, 'section', 'nas-app');
      section.setAttribute('aria-labelledby', 'nas-app-title');
      var heading = el(doc, 'header', 'nas-app-heading');
      var titleGroup = el(doc, 'div', 'nas-app-title-group');
      var title = el(doc, 'h3', '', 'NAS');
      title.id = 'nas-app-title';
      var subtitle = el(doc, 'p', 'nas-app-description', tr(
        '查看已保存的 NAS 或远程主机节点，并打开对应 BOT。原 NAS 系统不受影响。',
        'View saved NAS or remote host nodes and open a specific Bot. The NAS operating system is unchanged.'
      ));
      titleGroup.append(title, subtitle);
      var headerActions = el(doc, 'div', 'nas-app-header-actions');
      var status = el(doc, 'span', 'nas-app-status', renderStatus());
      status.setAttribute('role', 'status');
      status.dataset.state = state.error ? 'error' : isEnabled() ? 'connected' : 'idle';
      if (state.plugin && state.plugin.installed && state.plugin.version) {
        status.title = tr('插件版本 {version}', 'Plugin version {version}', { version: state.plugin.version });
      }
      headerActions.appendChild(status);
      var refreshButton = button(doc, tr('刷新', 'Refresh'), 'refresh', '', 'refresh');
      refreshButton.disabled = state.loading || state.actionBusy || state.importBusy;
      headerActions.appendChild(refreshButton);
      heading.append(titleGroup, headerActions);
      section.appendChild(heading);

      var message = el(doc, 'p', 'nas-app-message' + (state.messageState === 'error' ? ' is-error' : ''), state.message);
      message.setAttribute('role', state.messageState === 'error' ? 'alert' : 'status');
      message.setAttribute('aria-live', state.messageState === 'error' ? 'assertive' : 'polite');
      message.hidden = !state.message;
      section.appendChild(message);

      var actions = el(doc, 'div', 'nas-app-actions');
      if (state.plugin && !state.plugin.installed) {
        actions.appendChild(button(doc, state.importBusy ? tr('正在打开…', 'Opening…') : tr('从文件安装插件', 'Install plugin from file'), 'import', 'nas-app-install', 'import'));
      }
      if (onManagePlugin) actions.appendChild(button(doc, tr('插件管理', 'Plugin management'), 'manage', '', 'manage'));
      if (isEnabled()) actions.appendChild(button(doc, tr('打开连接', 'Open connections'), 'open-connection', '', 'connection'));
      Array.from(actions.querySelectorAll('button')).forEach(function (item) {
        if (state.loading || state.actionBusy || state.importBusy) item.disabled = true;
      });
      if (actions.childNodes.length) section.appendChild(actions);

      if (state.loading && !state.plugin) {
        var loading = el(doc, 'p', 'nas-app-empty', tr('正在读取插件和节点状态…', 'Reading plugin and node status…'));
        loading.setAttribute('aria-live', 'polite');
        section.appendChild(loading);
      } else if (state.error) {
        var retry = el(doc, 'div', 'nas-app-empty');
        retry.appendChild(el(doc, 'p', '', tr('无法读取 NAS 插件状态。', 'Could not read NAS plugin status.')));
        retry.appendChild(button(doc, tr('重试', 'Retry'), 'refresh', '', 'retry'));
        section.appendChild(retry);
      } else if (state.plugin && state.plugin.installed && !state.plugin.enabled) {
        section.appendChild(el(doc, 'p', 'nas-app-empty', tr(
          'NAS 插件已停用。可在插件管理中查看或启用。',
          'The NAS plugin is disabled. Review or enable it in plugin management.'
        )));
      } else if (isEnabled()) {
        var overview = state.overview;
        if (!overview) {
          section.appendChild(el(doc, 'p', 'nas-app-empty', tr(
            '节点状态暂不可用，请刷新重试。',
            'Node status is unavailable. Refresh to try again.'
          )));
        } else if (!overview.nodes.length) {
          section.appendChild(el(doc, 'p', 'nas-app-empty', tr(
            '没有已保存的 NAS 或远程主机节点。',
            'No saved NAS or remote host nodes.'
          )));
        } else {
          var list = el(doc, 'div', 'nas-app-nodes');
          list.setAttribute('role', 'list');
          list.setAttribute('aria-label', tr('已保存的 NAS 或远程主机节点', 'Saved NAS or remote host nodes'));
          overview.nodes.forEach(function (entry) {
            var row = el(doc, 'section', 'nas-app-node');
            row.setAttribute('role', 'listitem');
            var rowHeader = el(doc, 'div', 'nas-app-node-heading');
            var nodeTitle = el(doc, 'strong', 'nas-app-node-name', entry.name);
            var nodeState = el(doc, 'span', 'nas-app-node-state', entry.connected
              ? tr('已连接', 'Connected') : !entry.hostId ? tr('未核验', 'Unverified') : tr('未连接', 'Disconnected'));
            nodeState.dataset.state = entry.connected ? 'connected' : 'offline';
            rowHeader.append(nodeTitle, nodeState);
            row.appendChild(rowHeader);
            if (!entry.bots.length) {
              var emptyNodeText = !entry.connected
                ? tr('核验并连接后可查看此节点上的 BOT。', 'Verify and connect this node to view its Bots.')
                : tr('此节点当前没有可用 BOT。', 'No Bots are currently available on this node.');
              row.appendChild(el(doc, 'p', 'nas-app-node-empty', emptyNodeText));
            } else {
              var bots = el(doc, 'div', 'nas-app-bots');
              entry.bots.forEach(function (bot) {
                var botRow = el(doc, 'div', 'nas-app-bot');
                var botName = el(doc, 'span', 'nas-app-bot-name', bot.name);
                if (overview.selectedBotId && overview.selectedBotId === bot.id) {
                  botName.appendChild(el(doc, 'span', 'nas-app-selected', tr('当前 BOT', 'Selected')));
                }
                var botActions = el(doc, 'div', 'nas-app-bot-actions');
                var desktop = button(doc, tr('桌面', 'Desktop'), 'open-desktop', '', 'desktop:' + entry.id + ':' + bot.id);
                var workspace = button(doc, tr('工作区文件', 'Workspace files'), 'open-workspace', '', 'workspace:' + entry.id + ':' + bot.id);
                [desktop, workspace].forEach(function (item) {
                  item.dataset.nodeId = entry.id;
                  item.dataset.hostId = entry.hostId;
                  item.dataset.botId = bot.id;
                  item.setAttribute('aria-label', tr(
                    '在 {node} 中打开 {bot} 的 {view}',
                    'Open {bot} {view} on {node}',
                    { node: entry.name, bot: bot.name, view: item.dataset.nasAction === 'open-desktop' ? tr('桌面', 'desktop') : tr('工作区文件', 'workspace files') }
                  ));
                  item.disabled = !entry.connected || !entry.hostId || !bot.desktopAvailable || state.loading || state.actionBusy;
                });
                botActions.append(desktop, workspace);
                botRow.append(botName, botActions);
                bots.appendChild(botRow);
              });
              row.appendChild(bots);
            }
            list.appendChild(row);
          });
          section.appendChild(list);
        }
      }
      container.appendChild(section);
      if (focusAction) {
        var selector = '[data-nas-action="' + focusAction + '"]' + (focusKey ? '[data-nas-key="' + escapeSelector(focusKey) + '"]' : '');
        var restore = container.querySelector(selector);
        if (restore && !restore.disabled) restore.focus({ preventScroll: true });
      }
    }

    function escapeSelector(value) {
      if (windowRoot && windowRoot.CSS && typeof windowRoot.CSS.escape === 'function') return windowRoot.CSS.escape(value);
      return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    }

    function parseStatus(result) {
      if (!result || typeof result !== 'object' || result.ok === false) throw new Error('NAS status unavailable');
      if (!result.plugin || typeof result.plugin !== 'object') throw new Error('NAS plugin status unavailable');
      state.plugin = normalizePlugin(result.plugin);
      state.overview = state.plugin.installed && state.plugin.enabled ? normalizeOverview(result.overview) : null;
      state.error = false;
      if (state.plugin.hasError) {
        state.message = tr('插件状态存在问题，请在插件管理中查看。', 'The plugin reported a problem. Review it in plugin management.');
        state.messageState = 'error';
      } else {
        state.message = '';
        state.messageState = 'idle';
      }
    }

    function refresh() {
      if (state.destroyed || state.loading) return Promise.resolve(false);
      var request = ++state.revision;
      state.loading = true;
      state.error = false;
      state.message = '';
      state.messageState = 'idle';
      render();
      if (!bridge || typeof bridge.nasPlugin !== 'function') {
        state.loading = false;
        state.error = true;
        state.message = tr('此 Bot Studio 桌面版暂不支持 NAS 插件。', 'This Bot Studio desktop version does not support the NAS plugin.');
        state.messageState = 'error';
        render();
        return Promise.resolve(false);
      }
      return Promise.resolve().then(function () {
        return bridge.nasPlugin({ action: 'status' });
      }).then(function (result) {
        if (state.destroyed || request !== state.revision) return false;
        parseStatus(result);
        return true;
      }).catch(function () {
        if (state.destroyed || request !== state.revision) return false;
        state.error = true;
        state.message = tr('无法读取 NAS 插件状态，请重试。', 'Could not read NAS plugin status. Try again.');
        state.messageState = 'error';
        return false;
      }).then(function (ok) {
        if (state.destroyed || request !== state.revision) return false;
        state.loading = false;
        render();
        if (state.refreshQueued) {
          state.refreshQueued = false;
          Promise.resolve().then(refresh);
        }
        return ok;
      });
    }

    function validNavigation(intent) {
      if (!intent || typeof intent !== 'object') return null;
      var requestId = safeText(intent.requestId, 128);
      var view = intent.view;
      if (!requestId || !isEnabled() || ['connection', 'desktop', 'workspace'].indexOf(view) < 0) return null;
      var result = { requestId: requestId, view: view };
      if (view !== 'connection') {
        result.nodeId = safeText(intent.nodeId, 128);
        result.hostId = safeText(intent.hostId, 128);
        result.botId = safeText(intent.botId, 128);
        if (!result.nodeId || !result.hostId || !result.botId) return null;
        var nodeRecord = state.overview && state.overview.nodes.find(function (item) { return item.id === result.nodeId && item.hostId === result.hostId; });
        var botRecord = nodeRecord && nodeRecord.bots.find(function (item) { return item.id === result.botId; });
        if (!nodeRecord || !nodeRecord.connected || !botRecord) return null;
        if (view === 'desktop' && !botRecord.desktopAvailable) return null;
      }
      return result;
    }

    function handleNavigation(intent) {
      var navigation = validNavigation(intent);
      if (!navigation || state.pending.has(navigation.requestId) || !bridge || typeof bridge.nasNavigation !== 'function') return;
      var pending = { cancelled: false };
      state.pending.set(navigation.requestId, pending);
      Promise.resolve().then(function () {
        return bridge.nasNavigation({ action: 'claim', requestId: navigation.requestId });
      }).then(function (claim) {
        if (!claim || claim.ok !== true) return null;
        var opened = false;
        return Promise.resolve().then(function () {
          if (pending.cancelled || state.destroyed || !onNavigate) return false;
          return onNavigate(navigation);
        }).then(function (result) {
          opened = result !== false && !pending.cancelled;
          return Promise.resolve(bridge.nasNavigation({ action: 'complete', requestId: navigation.requestId, opened: opened }));
        }).catch(function () {
          setMessage(safeErrorMessage(), 'error');
          return Promise.resolve().then(function () {
            return bridge.nasNavigation({ action: 'complete', requestId: navigation.requestId, opened: false });
          }).catch(function () {});
        });
      }).catch(function () {
        setMessage(safeErrorMessage(), 'error');
      }).finally(function () {
        state.pending.delete(navigation.requestId);
      });
    }

    function cancelNavigation(event) {
      var requestId = safeText(event && typeof event === 'object' ? event.requestId : event, 128);
      var pending = requestId && state.pending.get(requestId);
      if (pending) pending.cancelled = true;
    }

    function invoke(method, input) {
      if (!bridge || typeof bridge.nasPlugin !== 'function') return Promise.reject(new Error('NAS plugin API unavailable'));
      return Promise.resolve(bridge.nasPlugin({ action: 'invoke', method: method, input: input || {} })).then(function (result) {
        if (!result || result.ok === false) throw new Error('NAS action failed');
        return result;
      });
    }

    function manage() {
      if (!onManagePlugin) return Promise.resolve(false);
      try { return Promise.resolve(onManagePlugin('nas')); }
      catch (_) { return Promise.reject(new Error('Plugin management did not open')); }
    }

    function importPlugin() {
      if (state.importBusy || state.loading || state.actionBusy) return Promise.resolve(false);
      state.importBusy = true;
      state.message = '';
      render();
      var result = bridge && typeof bridge.nasPlugin === 'function'
        ? Promise.resolve().then(function () { return bridge.nasPlugin({ action: 'import' }); })
        : Promise.reject(new Error('Plugin import is unavailable'));
      return result.then(function (value) {
        if (!value || value.ok === false) throw new Error('Plugin import did not complete');
        if (value.canceled === true) {
          state.message = tr('已取消安装。', 'Installation cancelled.');
          state.messageState = 'idle';
          return false;
        }
        state.message = tr('已提交安装操作。', 'Install request submitted.');
        state.messageState = 'idle';
        return refresh().then(function () { return true; });
      }).catch(function () {
        if (!state.destroyed) {
          state.message = tr('此版本暂不支持从文件安装，请打开插件管理。', 'Install from file is unavailable in this version. Open plugin management.');
          state.messageState = 'error';
          render();
        }
        return false;
      }).finally(function () {
        if (!state.destroyed) {
          state.importBusy = false;
          render();
        }
      });
    }

    function handleClick(event) {
      var target = event.target && event.target.closest ? event.target.closest('[data-nas-action]') : null;
      if (!target || !container.contains(target) || target.disabled || state.destroyed) return;
      var action = target.dataset.nasAction;
      if (action === 'refresh') { refresh(); return; }
      if (action === 'manage') {
        manage().catch(function () { setMessage(safeErrorMessage(), 'error'); });
        return;
      }
      if (action === 'import') { importPlugin(); return; }
      var input = action === 'open-connection' ? {} : {
        nodeId: target.dataset.nodeId,
        hostId: target.dataset.hostId,
        botId: target.dataset.botId
      };
      var method = action;
      if (['open-connection', 'open-desktop', 'open-workspace'].indexOf(method) < 0) return;
      state.actionBusy = true;
      state.message = '';
      render();
      invoke(method, input).catch(function () {
        if (!state.destroyed) setMessage(safeErrorMessage(), 'error');
      }).finally(function () {
        if (!state.destroyed) {
          state.actionBusy = false;
          render();
        }
      });
    }

    function subscribe() {
      if (!bridge) return;
      if (typeof bridge.onNasNavigation === 'function') {
        try { state.unsubscribeNavigation = bridge.onNasNavigation(handleNavigation); } catch (_) { state.unsubscribeNavigation = null; }
      }
      if (typeof bridge.onNasNavigationCancelled === 'function') {
        try { state.unsubscribeCancelled = bridge.onNasNavigationCancelled(cancelNavigation); } catch (_) { state.unsubscribeCancelled = null; }
      }
      if (typeof bridge.onDesktopPluginChanged === 'function') {
        try {
          state.unsubscribePluginChanged = bridge.onDesktopPluginChanged(function () {
            if (state.loading) state.refreshQueued = true;
            else refresh();
          });
        } catch (_) { state.unsubscribePluginChanged = null; }
      }
    }

    container.addEventListener('click', handleClick);
    subscribe();

    var instance = {
      refresh: refresh,
      setBridge: function (nextBridge) {
        bridge = nextBridge;
        if (state.unsubscribeNavigation) state.unsubscribeNavigation();
        if (state.unsubscribeCancelled) state.unsubscribeCancelled();
        if (state.unsubscribePluginChanged) state.unsubscribePluginChanged();
        state.unsubscribeNavigation = state.unsubscribeCancelled = state.unsubscribePluginChanged = null;
        subscribe();
      },
      destroy: function () {
        if (state.destroyed) return;
        state.destroyed = true;
        state.revision++;
        container.removeEventListener('click', handleClick);
        if (state.unsubscribeNavigation) state.unsubscribeNavigation();
        if (state.unsubscribeCancelled) state.unsubscribeCancelled();
        if (state.unsubscribePluginChanged) state.unsubscribePluginChanged();
        state.pending.forEach(function (pending) { pending.cancelled = true; });
        state.pending.clear();
        container.replaceChildren();
        mounted.delete(container);
      }
    };
    mounted.set(container, instance);
    render();
    return instance;
  }

  return { init: init };
});
