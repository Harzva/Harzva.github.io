/* Compact, persistent playback controls for reading a completed Bot reply. */
(function (root) {
  'use strict';

  function create(options) {
    options = options || {};
    var mount = options.mount;
    if (!mount || !root.document) return { render: function () {}, destroy: function () {} };

    var region = null;
    var statusCopy = null;
    var stopButton = null;
    var dismissButton = null;
    var dismissedErrorKey = null;
    var lastOwnerId = '';
    var destroyed = false;

    function tr(zh, en) {
      if (typeof options.translate === 'function') {
        try { return options.translate(zh, en); } catch (_) {}
      }
      return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en) : zh;
    }

    function errorKey(status) {
      return String(status.revision == null ? '' : status.revision) + ':'
        + String(status.errorCode == null ? '' : status.errorCode);
    }

    function focusSpeechEntry() {
      var doc = root.document;
      var target = null;
      var entries = doc.querySelectorAll('#messages .chat-message-speak');
      for (var index = 0; index < entries.length; index++) {
        var messageNode = entries[index].closest('.msg[data-chat-bot-id]');
        if (messageNode && messageNode.dataset.chatBotId === lastOwnerId) {
          target = entries[index];
          break;
        }
      }
      if (!target) target = doc.getElementById('chat-input');
      if (!target || !target.isConnected || target.disabled || !target.getClientRects().length) return;
      try { target.focus({ preventScroll: true }); } catch (_) { try { target.focus(); } catch (__) {} }
    }

    function restoreActionFocus(button) {
      if (button && root.document.activeElement === button) focusSpeechEntry();
    }

    function setButtonHidden(button, hidden) {
      if (!button) return;
      if (hidden) restoreActionFocus(button);
      button.hidden = hidden;
    }

    function setStopDisabled(disabled) {
      if (!stopButton) return;
      var hadFocus = root.document.activeElement === stopButton;
      stopButton.disabled = disabled;
      if (disabled && hadFocus && (root.document.activeElement === stopButton || root.document.activeElement === root.document.body)) {
        focusSpeechEntry();
      }
    }

    function removeRegion() {
      restoreActionFocus(stopButton);
      restoreActionFocus(dismissButton);
      if (region && region.parentNode === mount) mount.removeChild(region);
      region = statusCopy = stopButton = dismissButton = null;
      mount.hidden = true;
    }

    function ensureRegion() {
      if (region) return;
      var doc = root.document;
      region = doc.createElement('div');
      region.className = 'reply-speech-bar';
      region.setAttribute('data-state', 'starting');

      statusCopy = doc.createElement('span');
      statusCopy.className = 'reply-speech-copy';
      statusCopy.setAttribute('role', 'status');
      statusCopy.setAttribute('aria-live', 'polite');
      statusCopy.setAttribute('aria-atomic', 'true');

      stopButton = doc.createElement('button');
      stopButton.type = 'button';
      stopButton.className = 'reply-speech-stop';
      stopButton.addEventListener('click', function () {
        if (stopButton.disabled || typeof options.onStop !== 'function') return;
        try {
          var result = options.onStop();
          if (result && typeof result.catch === 'function') result.catch(function () {});
        } catch (_) {}
      });

      dismissButton = doc.createElement('button');
      dismissButton.type = 'button';
      dismissButton.className = 'reply-speech-dismiss';
      dismissButton.addEventListener('click', function () {
        dismissedErrorKey = region && region.dataset.errorKey;
        removeRegion();
      });

      region.appendChild(statusCopy);
      region.appendChild(stopButton);
      region.appendChild(dismissButton);
      mount.appendChild(region);
    }

    function render(status, botName) {
      if (destroyed) return;
      status = status && typeof status === 'object' ? status : {};
      var state = String(status.state || 'idle');
      if (status.ownerId != null && String(status.ownerId)) lastOwnerId = String(status.ownerId);

      if (state === 'idle') {
        dismissedErrorKey = null;
        removeRegion();
        return;
      }

      if (state === 'error') {
        var key = errorKey(status);
        if (dismissedErrorKey === key) {
          removeRegion();
          return;
        }
        ensureRegion();
        mount.hidden = false;
        region.dataset.state = 'error';
        region.dataset.errorKey = key;
        region.dataset.hasError = 'true';
        statusCopy.textContent = tr('朗读未完成，可在消息上选择“朗读”重试。', 'Speech did not finish. Select Read aloud on the message to try again.');
        setButtonHidden(stopButton, true);
        setButtonHidden(dismissButton, false);
        dismissButton.textContent = tr('关闭', 'Dismiss');
        return;
      }

      if (state !== 'starting' && state !== 'speaking' && state !== 'stopping') {
        removeRegion();
        return;
      }

      dismissedErrorKey = null;
      ensureRegion();
      mount.hidden = false;
      region.dataset.state = state;
      delete region.dataset.errorKey;
      var errorCode = String(status.errorCode || '');
      var stopRetryable = state === 'stopping' && (errorCode === 'speech-stop-timeout' || errorCode === 'speech-stop-failed');
      var hasError = !!errorCode;
      if (state === 'stopping' && stopRetryable) {
        region.dataset.hasError = 'true';
        statusCopy.textContent = tr('尚未确认停止，请重试。', 'Playback has not confirmed stopping. Try again.');
      } else if (hasError) {
        region.dataset.hasError = 'true';
        statusCopy.textContent = tr('朗读操作未完成，可重试或停止当前播放。', 'The speech action did not complete. Retry or stop playback.');
      } else {
        delete region.dataset.hasError;
        if (state === 'starting') statusCopy.textContent = tr('正在准备朗读', 'Preparing speech');
        else if (state === 'stopping') statusCopy.textContent = tr('正在停止朗读', 'Stopping playback');
        else statusCopy.textContent = botName
          ? tr('正在朗读：', 'Reading aloud: ') + String(botName)
          : tr('正在朗读', 'Reading aloud');
      }
      setButtonHidden(stopButton, false);
      setStopDisabled(state === 'stopping' && !hasError);
      stopButton.textContent = stopRetryable ? tr('重试停止', 'Retry stop') : tr('停止播放', 'Stop playback');
      setButtonHidden(dismissButton, true);
    }

    function destroy() {
      destroyed = true;
      removeRegion();
    }

    mount.hidden = true;
    return { render: render, destroy: destroy };
  }

  root.OpenBotReplySpeechView = { create: create };
})(window);
