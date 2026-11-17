/* Small, keyboard-friendly actions for persisted chat messages. */
(function (root) {
  'use strict';

  function tr(zh, en) {
    return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en) : zh;
  }

  function requestIdFor(message) {
    if (!message || typeof message !== 'object') return '';
    var value = message.requestId || message.runId;
    if (typeof value !== 'string' || !value.trim()) return '';
    return value;
  }

  function speechAvailable() {
    var speech = root.OpenBotReplySpeech;
    if (!speech || typeof speech.available !== 'function') return false;
    try { return speech.available() === true; } catch (_) { return false; }
  }

  function speakable(message) {
    var speech = root.OpenBotReplySpeech;
    if (speech && typeof speech.readable === 'function') {
      try { return speech.readable(message) === true; } catch (_) { return false; }
    }
    if (!message || message.role !== 'bot' || message.error || message.streaming || message.stopped) return false;
    if (message.kind === 'task' || message.kind === 'error' || message.kind === 'tool') return false;
    return String(message.text == null ? '' : message.text).trim().length > 0;
  }

  function speakerIcon() {
    return '<svg class="chat-message-speak-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
      + '<path d="M4 10v4h3l4 3V7l-4 3H4Z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M17.5 6.5a8 8 0 0 1 0 11"/></svg>';
  }

  function markup(message, index, botId) {
    if (!message || (message.role !== 'user' && message.role !== 'bot')) return '';
    var hasRequestId = !!requestIdFor(message);
    var canRetry = message.role === 'user' || message.error === true || message.kind === 'error';
    var isError = message.error === true || message.kind === 'error';
    var more = tr('更多消息操作', 'More message actions');
    var copy = tr('复制', 'Copy');
    var retryLabel = tr('重试', 'Retry');
    var request = tr('复制请求 ID', 'Copy request ID');
    var canSpeak = message.role === 'bot' && speakable(message) && speechAvailable();
    var speak = tr('朗读', 'Read aloud');
    var menuId = 'chat-message-menu-' + String(index).replace(/[^a-zA-Z0-9_-]/g, '') + '-' + String(botId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    return '<div class="chat-message-actions">'
      + (isError ? '<button type="button" class="chat-message-retry" data-chat-action="retry" aria-label="' + retryLabel + '" title="' + retryLabel + '">' + retryLabel + '</button>' : '')
      + (canSpeak ? '<button type="button" class="chat-message-speak" data-chat-action="speak" aria-label="' + speak + '" title="' + speak + '">' + speakerIcon() + '</button>' : '')
      + '<button type="button" class="chat-message-more" data-chat-action="toggle" aria-haspopup="menu" aria-expanded="false" aria-label="' + more + '" title="' + more + '" aria-controls="' + menuId + '">'
      + (root.OpenBotIcons ? root.OpenBotIcons.svg('more') : '<span aria-hidden="true">···</span>')
      + '</button><div class="chat-message-menu" id="' + menuId + '" role="menu" hidden>'
      + '<button type="button" role="menuitem" data-chat-action="copy">' + copy + '</button>'
      + (canRetry ? '<button type="button" role="menuitem" data-chat-action="retry">' + retryLabel + '</button>' : '')
      + (hasRequestId ? '<button type="button" role="menuitem" data-chat-action="copy-request-id">' + request + '</button>' : '')
      + '</div></div>';
  }

  function init(container, options) {
    if (!container || container.__openBotMessageActionsBound) return;
    options = options || {};
    container.__openBotMessageActionsBound = true;

    function closeActions(actions, restoreFocus) {
      if (!actions) return;
      var trigger = actions.querySelector('[data-chat-action="toggle"]');
      var menu = actions.querySelector('[role="menu"]');
      if (menu) menu.hidden = true;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus && trigger) trigger.focus();
    }

    function openActions(actions, focusLast) {
      if (!actions) return;
      container.querySelectorAll('.chat-message-actions').forEach(function (other) {
        if (other !== actions) closeActions(other, false);
      });
      var trigger = actions.querySelector('[data-chat-action="toggle"]');
      var menu = actions.querySelector('[role="menu"]');
      if (!trigger || !menu) return;
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      var items = menu.querySelectorAll('[role="menuitem"]');
      if (items.length) items[focusLast ? items.length - 1 : 0].focus();
    }

    container.addEventListener('click', function (event) {
      var control = event.target && event.target.closest ? event.target.closest('[data-chat-action]') : null;
      if (!control || !container.contains(control)) return;
      var action = control.dataset.chatAction;
      var actions = control.closest('.chat-message-actions');
      if (action === 'speak') {
        event.preventDefault();
        var messageNode = control.closest('.msg[data-chat-index]');
        var message = messageNode && typeof options.resolveMessage === 'function' ? options.resolveMessage(messageNode) : null;
        closeActions(actions, false);
        if (!speakable(message) || !speechAvailable() || typeof options.onSpeak !== 'function') return;
        try {
          var result = options.onSpeak(message, messageNode);
          if (result && typeof result.catch === 'function') result.catch(function () {});
        } catch (_) {}
        return;
      }
      if (action === 'toggle') {
        event.preventDefault();
        if (control.getAttribute('aria-expanded') === 'true') closeActions(actions, false);
        else openActions(actions, false);
        return;
      }
      if (action === 'retry') {
        event.preventDefault();
        var retryNode = control.closest('.msg[data-chat-index]');
        var retryMsg = retryNode && typeof options.resolveMessage === 'function' ? options.resolveMessage(retryNode) : null;
        closeActions(actions, false);
        if (retryMsg && typeof options.onRetry === 'function') options.onRetry(retryMsg, retryNode);
        return;
      }
      if (action !== 'copy' && action !== 'copy-request-id') return;
      var messageNode = control.closest('.msg[data-chat-index]');
      var message = messageNode && typeof options.resolveMessage === 'function' ? options.resolveMessage(messageNode) : null;
      if (!message) { closeActions(actions, false); return; }
      var text = action === 'copy-request-id' ? requestIdFor(message) : String(message.text == null ? '' : message.text);
      if (action === 'copy-request-id' && !text) { closeActions(actions, false); return; }
      closeActions(actions, false);
      if (typeof options.onCopy === 'function') options.onCopy(text, action === 'copy-request-id' ? 'requestId' : 'text', message);
    });

    container.addEventListener('keydown', function (event) {
      var control = event.target && event.target.closest ? event.target.closest('[data-chat-action]') : null;
      if (!control || !container.contains(control)) return;
      var actions = control.closest('.chat-message-actions');
      var menu = actions && actions.querySelector('[role="menu"]');
      if (control.dataset.chatAction === 'toggle' && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault(); openActions(actions, event.key === 'ArrowUp'); return;
      }
      if (!menu || menu.hidden) return;
      var items = Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"]'));
      var index = items.indexOf(control);
      if (event.key === 'Escape') { event.preventDefault(); closeActions(actions, true); }
      else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (items.length) items[(index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
      } else if (event.key === 'Home' && items.length) { event.preventDefault(); items[0].focus(); }
      else if (event.key === 'End' && items.length) { event.preventDefault(); items[items.length - 1].focus(); }
    });

    root.document.addEventListener('pointerdown', function (event) {
      if (container.contains(event.target)) {
        var actions = event.target.closest && event.target.closest('.chat-message-actions');
        container.querySelectorAll('.chat-message-actions').forEach(function (other) {
          if (other !== actions) closeActions(other, false);
        });
        return;
      }
      container.querySelectorAll('.chat-message-actions').forEach(function (actions) { closeActions(actions, false); });
    });
  }

  root.OpenBotChatMessageActions = { markup: markup, init: init, requestIdFor: requestIdFor };
})(window);
