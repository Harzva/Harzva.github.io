(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenBotAppAccounts = api;
})(typeof window === 'object' ? window : null, function (root) {
  'use strict';

  var mounted = new WeakMap();
  var instanceSequence = 0;

  function tr(zh, en) {
    var i18n = root && root.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en) : zh;
  }

  function node(doc, tag, className, text) {
    var el = doc.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function safeAvatarURL(value) {
    if (typeof value !== 'string' || value.length > 1500000) return '';
    if (/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(value)) return value;
    if (!/^(?:\.\/)?assets\/[a-z0-9_./-]+$/i.test(value)) return '';
    var parts = value.replace(/^\.\//, '').split('/');
    if (parts.some(function (part) { return !part || part === '.' || part === '..'; })) return '';
    return value;
  }

  function normalizedAccounts(value) {
    if (!Array.isArray(value)) return [];
    var seen = new Set();
    return value.filter(function (account) {
      if (!account || typeof account !== 'object' || account.id === undefined || account.id === null) return false;
      var id = String(account.id).trim();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    }).map(function (account) {
      return {
        id: String(account.id).trim(),
        label: typeof account.label === 'string' ? account.label.trim() : '',
        address: typeof account.address === 'string' ? account.address.trim() : '',
        avatarUrl: safeAvatarURL(account.avatarUrl),
        status: typeof account.status === 'string' ? account.status : '',
        canSendMail: account.canSendMail === true,
        isDefaultSender: account.isDefaultSender === true
      };
    });
  }

  function initials(account) {
    var name = account.label || account.address;
    var first = name ? Array.from(name.trim())[0] : '';
    return first && first !== '?' && first !== '？' ? first : '';
  }

  function statusText(value) {
    var key = String(value || '').trim().toLowerCase().replace(/[ _]+/g, '-');
    if (key === 'connected' || key === 'active' || key === 'authorized' || key === 'ready' || key === '已连接') return tr('已连接', 'Connected');
    if (key === 'saved') return tr('已保存，尚未连接', 'Saved, not connected');
    if (key === 'disconnected' || key === 'offline' || key === 'disabled' || key === 'not-connected' || key === '未连接') return tr('未连接', 'Not connected');
    if (key === 'expired' || key === 'needs-reconnect' || key === 'reconnect-required' || key === 'invalid' || key === '需要重新连接') return tr('需要重新连接', 'Reconnect required');
    if (key === 'error') return tr('连接异常', 'Connection error');
    if (key === 'pending' || key === 'waiting' || key === 'awaiting-verification' || key === '等待确认') return tr('等待确认', 'Waiting for confirmation');
    if (key === 'connecting' || key === 'loading') return tr('连接中', 'Connecting');
    return tr('状态未知', 'Status unknown');
  }

  function statusState(value, stale) {
    if (stale) return 'unknown';
    var key = String(value || '').trim().toLowerCase().replace(/[ _]+/g, '-');
    if (key === 'connected' || key === 'active' || key === 'authorized' || key === 'ready') return 'connected';
    if (key === 'error') return 'error';
    if (key === 'connecting' || key === 'loading') return 'connecting';
    if (key === 'saved' || key === 'disconnected' || key === 'offline' || key === 'disabled' || key === 'not-connected') return 'saved';
    return 'unknown';
  }

  function accountIdentity(account) {
    return account.label || account.address || tr('未命名账号', 'Unnamed account');
  }

  function setLocalizedText(el, zh, en) {
    el.setAttribute('data-i18n-zh', zh);
    el.setAttribute('data-i18n-en', en);
    el.textContent = tr(zh, en);
  }

  function mountDescription(card, doc, instanceId) {
    var existing = card.querySelector('[data-testid="app-account-description"]');
    if (existing) {
      var existingSummary = existing.querySelector('[data-testid="app-account-description-summary"]');
      var existingFull = existing.querySelector('[data-testid="app-account-description-details"]');
      if (existingFull) existingFull.id = instanceId + '-description';
      if (existingSummary) existingSummary.setAttribute('aria-controls', instanceId + '-description');
      return existing;
    }
    var original = card.querySelector('.apps-description');
    if (!original) return null;

    var currentText = original.textContent.trim();
    var zh = original.getAttribute('data-i18n-zh') || currentText;
    var en = original.getAttribute('data-i18n-en') || currentText;
    var disclosure = node(doc, 'details', (original.className || 'apps-description') + ' openbot-app-description');
    disclosure.setAttribute('data-testid', 'app-account-description');
    var summary = node(doc, 'summary', 'openbot-app-description-summary');
    summary.setAttribute('data-testid', 'app-account-description-summary');
    summary.setAttribute('aria-controls', instanceId + '-description');
    var preview = node(doc, 'span', 'openbot-app-description-preview');
    setLocalizedText(preview, zh, en);
    var collapse = node(doc, 'span', 'openbot-app-description-collapse');
    setLocalizedText(collapse, '收起说明', 'Collapse description');
    summary.append(preview, collapse);
    disclosure.appendChild(summary);

    var full = node(doc, 'p', 'openbot-app-description-full');
    full.id = instanceId + '-description';
    full.setAttribute('data-testid', 'app-account-description-details');
    setLocalizedText(full, zh, en);
    disclosure.appendChild(full);
    original.replaceWith(disclosure);
    return disclosure;
  }

  function mount(card, initialOptions) {
    if (!card || !card.ownerDocument) return null;
    var existing = mounted.get(card);
    if (existing) {
      existing.update(initialOptions || {});
      return existing;
    }

    var doc = card.ownerDocument;
    var appId = String((initialOptions && initialOptions.appId) || card.getAttribute('data-app') || 'app');
    var instanceId = 'openbot-app-accounts-' + (++instanceSequence);
    card.setAttribute('data-testid', 'app-account-card');
    mountDescription(card, doc, instanceId);
    var header = card.querySelector(':scope > header') || card.querySelector('header');
    var logo = header && header.querySelector('.app-connection-icon');
    var bubbles = node(doc, 'span', 'openbot-app-account-bubbles');
    bubbles.setAttribute('role', 'group');
    bubbles.setAttribute('aria-label', tr('账号', 'Accounts'));
    if (header) header.insertBefore(bubbles, logo && logo.parentNode === header ? logo.nextSibling : header.firstChild);

    var details = node(doc, 'details', 'openbot-app-account-list');
    details.id = instanceId;
    details.setAttribute('data-testid', 'app-account-list');
    details.setAttribute('data-app-id', appId);
    var summary = node(doc, 'summary', 'openbot-app-account-summary');
    summary.setAttribute('data-testid', 'app-account-list-summary');
    summary.setAttribute('aria-controls', instanceId + '-content');
    var summaryLabel = node(doc, 'span', 'openbot-app-account-summary-label');
    var summaryCount = node(doc, 'span', 'openbot-app-account-summary-count');
    summary.appendChild(summaryLabel);
    summary.appendChild(summaryCount);
    details.appendChild(summary);
    var content = node(doc, 'div', 'openbot-app-account-content');
    content.id = instanceId + '-content';
    details.appendChild(content);
    card.appendChild(details);

    var opts = {};
    var localFeedback = '';
    var destroyed = false;
    var pendingAction = null;
    var lastBubbleId = '';
    var expandedEntryIds = new Set();
    var handlers = {
      click: onCardClick,
      keydown: onDetailsKeydown,
      toggle: syncBubbleState,
      error: onAvatarError
    };

    function currentAccounts() { return normalizedAccounts(opts.accounts); }
    function appName() {
      var title = card.querySelector('h3');
      return title && title.textContent.trim() || appId;
    }
    function showStateError() { return !!opts.error; }

    function updateBubbleState() {
      var expanded = details.open ? 'true' : 'false';
      Array.from(bubbles.querySelectorAll('.openbot-app-account-bubble')).forEach(function (button) {
        button.setAttribute('aria-expanded', expanded);
      });
    }

    function syncBubbleState() {
      updateBubbleState();
    }

    function addAvatar(parent, account, className) {
      var avatar = node(doc, 'span', className || 'openbot-app-account-avatar');
      avatar.setAttribute('data-testid', 'app-account-avatar');
      avatar.setAttribute('aria-hidden', 'true');
      var fallback = node(doc, 'span', 'openbot-app-account-initial', initials(account));
      fallback.setAttribute('data-testid', 'app-account-avatar-fallback');
      if (!fallback.textContent) fallback.innerHTML = '<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>';
      var url = account.avatarUrl;
      if (url) {
        var image = node(doc, 'img', 'openbot-app-account-photo');
        image.setAttribute('data-testid', 'app-account-avatar-image');
        image.alt = '';
        image.hidden = true;
        image.decoding = 'async';
        image.loading = 'eager';
        avatar.appendChild(fallback);
        avatar.appendChild(image);
        image.addEventListener('load', function () {
          if (!destroyed) {
            image.hidden = false;
            fallback.hidden = true;
          }
        }, { once: true });
        image.setAttribute('src', url);
      } else {
        avatar.appendChild(fallback);
      }
      parent.appendChild(avatar);
      return avatar;
    }

    function makeBubble(account) {
      var button = node(doc, 'button', 'openbot-app-account-bubble');
      button.type = 'button';
      button.setAttribute('data-testid', 'app-account-bubble');
      button.setAttribute('data-account-id', account.id);
      button.setAttribute('aria-controls', instanceId + '-content');
      button.setAttribute('aria-expanded', details.open ? 'true' : 'false');
      button.setAttribute('aria-label', tr('在账号列表中查看 ' + accountIdentity(account), 'Show ' + accountIdentity(account) + ' in the account list'));
      button.title = accountIdentity(account);
      var face = node(doc, 'span', 'openbot-app-account-bubble-face');
      button.appendChild(face);
      addAvatar(button.firstChild, account, 'openbot-app-account-avatar');
      return button;
    }

    function makeMoreBubble(extraCount, focusAccountId) {
      var button = node(doc, 'button', 'openbot-app-account-bubble openbot-app-account-more', '+' + (extraCount > 99 ? '99+' : String(extraCount)));
      button.type = 'button';
      button.setAttribute('data-testid', 'app-account-more');
      button.setAttribute('data-account-id', focusAccountId || '');
      button.setAttribute('aria-controls', instanceId + '-content');
      button.setAttribute('aria-expanded', details.open ? 'true' : 'false');
      button.setAttribute('aria-label', tr('查看其余 ' + extraCount + ' 个账号', 'Show ' + extraCount + ' more accounts'));
      button.title = button.getAttribute('aria-label');
      return button;
    }

    function makeRow(account, stale) {
      var row = node(doc, 'div', 'openbot-app-account-row');
      row.tabIndex = -1;
      row.setAttribute('data-testid', 'app-account-row');
      row.setAttribute('data-account-id', account.id);
      var avatar = node(doc, 'span', 'openbot-app-account-row-avatar');
      addAvatar(avatar, account);
      row.appendChild(avatar);

      var identity = node(doc, 'div', 'openbot-app-account-identity');
      var entry = node(doc, 'details', 'openbot-app-account-entry');
      entry.setAttribute('data-testid', 'app-account-entry');
      entry.setAttribute('data-account-id', account.id);
      entry.open = expandedEntryIds.has(account.id);
      var entrySummary = node(doc, 'summary', 'openbot-app-account-entry-summary');
      entrySummary.setAttribute('data-testid', 'app-account-entry-summary');
      var detailsId = instanceId + '-account-' + encodeURIComponent(account.id);
      entrySummary.setAttribute('aria-controls', detailsId);
      var accessibleIdentity = accountIdentity(account) + (account.address && account.address !== accountIdentity(account) ? '，' + account.address : '');
      entrySummary.setAttribute('aria-label', tr('查看账号详情：' + accessibleIdentity, 'Show account details: ' + accessibleIdentity));
      var preview = node(doc, 'span', 'openbot-app-account-entry-preview');
      preview.appendChild(node(doc, 'strong', 'openbot-app-account-name', accountIdentity(account)));
      if (account.address && account.label && account.address !== account.label) {
        var address = node(doc, 'span', 'openbot-app-account-address', account.address);
        address.setAttribute('data-testid', 'app-account-address-preview');
        preview.appendChild(address);
      }
      entrySummary.appendChild(preview);
      entry.appendChild(entrySummary);

      var fullDetails = node(doc, 'div', 'openbot-app-account-entry-details');
      fullDetails.id = detailsId;
      fullDetails.setAttribute('data-testid', 'app-account-entry-details');
      fullDetails.appendChild(node(doc, 'strong', 'openbot-app-account-entry-full-name', accountIdentity(account)));
      if (account.address && account.address !== accountIdentity(account)) {
        var fullAddress = node(doc, 'span', 'openbot-app-account-entry-full-address', account.address);
        fullAddress.setAttribute('data-testid', 'app-account-entry-full-address');
        fullDetails.appendChild(fullAddress);
      }
      entry.appendChild(fullDetails);
      entry.addEventListener('toggle', function () {
        if (!entry.isConnected) return;
        if (entry.open) expandedEntryIds.add(account.id);
        else expandedEntryIds.delete(account.id);
      });
      identity.appendChild(entry);

      var state = node(doc, 'span', 'openbot-app-account-status', stale ? tr('状态未知', 'Status unknown') : statusText(account.status));
      state.setAttribute('data-state', statusState(account.status, stale));
      identity.appendChild(state);
      if (!stale && account.canSendMail && account.isDefaultSender) {
        identity.appendChild(node(doc, 'span', 'openbot-app-account-default', tr('默认发信', 'Default sender')));
      }
      row.appendChild(identity);

      if (typeof opts.onOpenAccount === 'function') {
        var manage = node(doc, 'button', 'openbot-app-account-manage', tr('管理', 'Manage'));
        manage.type = 'button';
        manage.setAttribute('data-testid', 'app-account-manage');
        manage.setAttribute('data-account-id', account.id);
        manage.setAttribute('aria-label', tr('管理账号 ' + accountIdentity(account), 'Manage account ' + accountIdentity(account)));
        row.appendChild(manage);
      }
      return row;
    }

    function currentFocusKey() {
      var active = doc.activeElement;
      if (!active || !card.contains(active)) return null;
      if (active.matches && active.matches('[data-testid="app-account-entry-summary"]')) {
        var entry = active.closest('[data-testid="app-account-entry"]');
        if (entry) return { kind: 'entry-summary', id: entry.getAttribute('data-account-id') };
      }
      if (active === summary) return { kind: 'summary' };
      if (active === details.querySelector('.openbot-app-account-add')) return { kind: 'add' };
      if (active.matches && active.matches('.openbot-app-account-bubble')) return { kind: 'bubble', id: active.getAttribute('data-account-id') };
      var idNode = active.closest && active.closest('[data-account-id]');
      if (idNode) return { kind: active.classList.contains('openbot-app-account-manage') ? 'manage' : 'row', id: idNode.getAttribute('data-account-id') };
      return null;
    }

    function restoreFocus(key) {
      if (!key || destroyed) return;
      if (key.kind === 'summary') { summary.focus(); return; }
      if (key.kind === 'entry-summary') {
        var matchingEntry = Array.from(content.querySelectorAll('[data-testid="app-account-entry"]')).find(function (item) {
          return item.getAttribute('data-account-id') === key.id;
        });
        var entrySummary = matchingEntry && matchingEntry.querySelector('[data-testid="app-account-entry-summary"]');
        if (entrySummary) entrySummary.focus(); else summary.focus();
        return;
      }
      if (key.kind === 'add') {
        var add = content.querySelector('.openbot-app-account-add');
        if (add) add.focus();
        else summary.focus();
        return;
      }
      if (key.kind === 'bubble') {
        var matchingBubble = Array.from(bubbles.querySelectorAll('.openbot-app-account-bubble')).find(function (item) {
          return item.getAttribute('data-account-id') === key.id;
        });
        if (matchingBubble) matchingBubble.focus();
        else summary.focus();
        return;
      }
      var row = Array.from(content.querySelectorAll('.openbot-app-account-row')).find(function (item) {
        return item.getAttribute('data-account-id') === key.id;
      });
      if (!row) { summary.focus(); return; }
      if (key.kind === 'manage') {
        var manage = row.querySelector('.openbot-app-account-manage');
        if (manage) manage.focus(); else row.focus();
      } else row.focus();
    }

    function render() {
      var focusKey = currentFocusKey();
      var accounts = currentAccounts();
      Array.from(content.querySelectorAll('[data-testid="app-account-entry"]')).forEach(function (entry) {
        var id = entry.getAttribute('data-account-id');
        if (entry.open) expandedEntryIds.add(id);
        else expandedEntryIds.delete(id);
      });
      var currentIds = new Set(accounts.map(function (account) { return account.id; }));
      Array.from(expandedEntryIds).forEach(function (id) {
        if (!currentIds.has(id)) expandedEntryIds.delete(id);
      });
      var stale = showStateError();
      var showBubbles = stale ? [] : accounts;
      bubbles.replaceChildren();
      bubbles.hidden = !showBubbles.length;
      bubbles.setAttribute('aria-label', tr(appName() + ' 账号', appName() + ' accounts'));
      details.setAttribute('data-app-id', appId);
      showBubbles.slice(0, 2).forEach(function (account) {
        bubbles.appendChild(makeBubble(account));
      });
      if (showBubbles.length > 2) bubbles.appendChild(makeMoreBubble(showBubbles.length - 2, showBubbles[2].id));

      summaryLabel.textContent = tr('账号', 'Accounts');
      summaryCount.textContent = !stale && accounts.length ? String(accounts.length) : '';
      content.replaceChildren();

      if (opts.loading) {
        content.appendChild(node(doc, 'p', 'openbot-app-account-message', tr('正在读取账号…', 'Loading accounts…')));
      }
      if (stale) {
        var error = node(doc, 'p', 'openbot-app-account-message is-error', tr('账号状态读取失败，暂不显示连接状态。', 'Could not read account status. Connection states are hidden.'));
        error.setAttribute('role', 'alert');
        content.appendChild(error);
      }

      if (!accounts.length && !opts.loading && !stale) {
        var emptyCopy = opts.available === false
          ? tr('尚未提供此应用的连接器。', 'A connector for this app is not available yet.')
          : tr('尚未连接账号。', 'No account is connected yet.');
        content.appendChild(node(doc, 'p', 'openbot-app-account-message', emptyCopy));
      }
      accounts.forEach(function (account) {
        var row = makeRow(account, stale);
        var manage = row.querySelector('.openbot-app-account-manage');
        if (manage && pendingAction && pendingAction.action === 'manage' && pendingAction.accountId === account.id) manage.disabled = true;
        content.appendChild(row);
      });

      if (typeof opts.onAdd === 'function') {
        var add = node(doc, 'button', 'openbot-app-account-add', tr('添加账号', 'Add account'));
        add.type = 'button';
        add.setAttribute('data-testid', 'app-account-add');
        add.setAttribute('data-action', 'add');
        if (pendingAction && pendingAction.action === 'add') add.disabled = true;
        content.appendChild(add);
      }
      if (localFeedback) {
        var feedback = node(doc, 'p', 'openbot-app-account-feedback', localFeedback);
        feedback.setAttribute('role', 'status');
        feedback.setAttribute('aria-live', 'polite');
        content.appendChild(feedback);
      }
      updateBubbleState();
      restoreFocus(focusKey);
    }

    function focusRow(id) {
      if (!id) { summary.focus(); return; }
      var row = Array.from(content.querySelectorAll('.openbot-app-account-row')).find(function (item) {
        return item.getAttribute('data-account-id') === id;
      });
      if (row) row.focus(); else summary.focus();
    }

    function finishAction(button, action, accountId, result, rejected) {
      if (destroyed || !card.isConnected) return;
      if (button && button.isConnected) button.disabled = false;
      var code = rejected && typeof rejected.code === 'string' ? rejected.code
        : result && typeof result.code === 'string' ? result.code : '';
      var failed = !!rejected || result === false || result && result.ok === false;
      pendingAction = null;
      if (code === 'ACCOUNT_UNSAVED_CHANGES') {
        localFeedback = tr('先保存或放弃当前修改，再切换账号。', 'Save or discard the current changes before switching accounts.');
      } else {
        localFeedback = failed
          ? tr('操作未完成，请检查当前编辑状态后重试。', 'The action did not complete. Check the current edit state and try again.')
          : '';
      }
      render();
      if (action === 'manage' && failed) {
        var row = Array.from(content.querySelectorAll('.openbot-app-account-row')).find(function (item) {
          return item.getAttribute('data-account-id') === accountId;
        });
        var manage = row && row.querySelector('.openbot-app-account-manage');
        if (manage) manage.focus(); else summary.focus();
      } else if (action === 'add' && failed) {
        var add = content.querySelector('.openbot-app-account-add');
        if (add) add.focus(); else summary.focus();
      }
    }

    function runAction(action, button, accountId) {
      var callback = action === 'manage' ? opts.onOpenAccount : opts.onAdd;
      if (typeof callback !== 'function' || pendingAction) return;
      pendingAction = { action: action, accountId: accountId };
      if (button) button.disabled = true;
      localFeedback = '';
      var result;
      try {
        result = action === 'manage' ? callback(accountId) : callback(appId);
      } catch (error) {
        finishAction(button, action, accountId, null, error || true);
        return;
      }
      Promise.resolve(result).then(function (value) {
        finishAction(button, action, accountId, value, false);
      }, function (error) {
        finishAction(button, action, accountId, null, error || true);
      });
    }

    function onCardClick(event) {
      var summaryTarget = event.target && event.target.closest && event.target.closest('summary');
      if (summaryTarget === summary) {
        lastBubbleId = '';
        return;
      }
      var target = event.target && event.target.closest && event.target.closest('button');
      if (!target || !card.contains(target)) return;
      if (target.classList.contains('openbot-app-account-bubble')) {
        lastBubbleId = target.getAttribute('data-account-id') || '';
        details.open = true;
        updateBubbleState();
        focusRow(target.getAttribute('data-account-id'));
        return;
      }
      if (target.classList.contains('openbot-app-account-manage')) {
        var id = target.getAttribute('data-account-id');
        lastBubbleId = '';
        details.open = true;
        runAction('manage', target, id);
        return;
      }
      if (target.classList.contains('openbot-app-account-add')) runAction('add', target, '');
    }

    function onDetailsKeydown(event) {
      if (event.target === summary && (event.key === 'Enter' || event.key === ' ')) lastBubbleId = '';
      if (event.key !== 'Escape') return;

      var entry = event.target.closest && event.target.closest('[data-testid="app-account-entry"]');
      if (entry && entry.open) {
        event.preventDefault();
        event.stopPropagation();
        entry.open = false;
        var entrySummary = entry.querySelector('[data-testid="app-account-entry-summary"]');
        if (entrySummary) entrySummary.focus();
        return;
      }

      var description = event.target.closest && event.target.closest('[data-testid="app-account-description"]');
      if (description && description.open) {
        event.preventDefault();
        event.stopPropagation();
        description.open = false;
        var descriptionSummary = description.querySelector('[data-testid="app-account-description-summary"]');
        if (descriptionSummary) descriptionSummary.focus();
        return;
      }

      if (!details.open || !details.contains(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      details.open = false;
      updateBubbleState();
      var origin = Array.from(bubbles.querySelectorAll('.openbot-app-account-bubble')).find(function (item) {
        return item.getAttribute('data-account-id') === lastBubbleId;
      });
      if (origin) origin.focus(); else summary.focus();
    }

    function onAvatarError(event) {
      var image = event.target;
      if (!image || !image.classList || !image.classList.contains('openbot-app-account-photo')) return;
      image.hidden = true;
      var fallback = image.parentNode && image.parentNode.querySelector('.openbot-app-account-initial');
      if (fallback) fallback.hidden = false;
      image.removeAttribute('src');
    }

    card.addEventListener('click', handlers.click);
    card.addEventListener('keydown', handlers.keydown);
    details.addEventListener('toggle', handlers.toggle);
    card.addEventListener('error', handlers.error, true);

    var instance = {
      update: function (next) {
        if (destroyed) return instance;
        next = next || {};
        ['appId', 'accounts', 'loading', 'error', 'available', 'onOpenAccount', 'onAdd'].forEach(function (key) {
          if (Object.prototype.hasOwnProperty.call(next, key)) opts[key] = next[key];
        });
        if (opts.appId) appId = String(opts.appId);
        render();
        return instance;
      },
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        card.removeEventListener('click', handlers.click);
        card.removeEventListener('keydown', handlers.keydown);
        details.removeEventListener('toggle', handlers.toggle);
        card.removeEventListener('error', handlers.error, true);
        if (bubbles.parentNode) bubbles.remove();
        if (details.parentNode) details.remove();
        mounted.delete(card);
      }
    };
    mounted.set(card, instance);
    instance.update(initialOptions || {});
    return instance;
  }

  return Object.freeze({ mount: mount });
});
