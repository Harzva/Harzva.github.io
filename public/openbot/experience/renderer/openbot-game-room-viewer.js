(function () {
  'use strict';

  var bridge = window.roomCapture;
  var board = document.getElementById('ogrv-board');
  var title = document.getElementById('ogrv-title');
  var scopeCopy = document.getElementById('ogrv-scope-copy');
  var statusNode = document.getElementById('ogrv-status');
  var errorNode = document.getElementById('ogrv-error');
  var stopButton = document.getElementById('ogrv-stop');
  var latestSnapshot = null;
  var stopBusy = false;
  var unsubscribe = null;

  function tr(zh, en) {
    return latestSnapshot && latestSnapshot.language === 'en' ? en : zh;
  }

  function text(value, max) {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    return String(value).slice(0, max || 160);
  }

  function showError(message) {
    errorNode.textContent = message || '';
    errorNode.hidden = !message;
  }

  function duration(seconds) {
    var value = Math.max(0, Math.floor(Number(seconds) || 0));
    return String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
  }

  function activeSeconds(active) {
    var started = Number(active && active.startedAt);
    if (started > 0 && started < 1000000000000) started *= 1000;
    return started > 0 ? Math.max(0, Math.floor((Date.now() - started) / 1000)) : 0;
  }

  function isRoomRecording(active) {
    var scope = active && active.scope;
    return !!(scope && typeof scope === 'object' && scope.viewBotId === 'public-spectator'
      && text(scope.spaceId, 128) && text(scope.hallId, 128) && text(scope.matchId, 128)
      && text(scope.initiatorBotId, 128));
  }

  function publicBotName(snapshot, botId) {
    botId = String(botId || '');
    var bots = snapshot && Array.isArray(snapshot.bots) ? snapshot.bots : [];
    for (var i = 0; i < bots.length; i++) if (String(bots[i] && bots[i].id) === botId) return text(bots[i].name, 100) || botId;
    var players = snapshot && snapshot.publicHall && snapshot.publicHall.table && Array.isArray(snapshot.publicHall.table.players)
      ? snapshot.publicHall.table.players : [];
    for (var j = 0; j < players.length; j++) if (String(players[j] && players[j].botId) === botId) return text(players[j].name, 100) || botId;
    return botId || tr('牌局', 'Table');
  }

  function updateHeader(snapshot) {
    var hall = snapshot.publicHall || {};
    var scope = snapshot.scope || {};
    var active = snapshot.status && snapshot.status.active;
    title.textContent = text(hall.name, 120) || tr('公共观战', 'Public spectator');
    var matchId = text(scope.matchId, 80);
    scopeCopy.textContent = tr('公共观战画面 · 不含私牌', 'Public spectator view · no private hands') + (matchId ? ' · ' + matchId : '');
    if (active && !isRoomRecording(active)) {
      statusNode.textContent = tr('已有其他屏幕录制正在进行。', 'Another screen recording is active.');
      stopButton.hidden = true;
      stopButton.disabled = true;
    } else if (active) {
      var stateText = active.state === 'stopping' ? tr('正在停止录制', 'Stopping recording')
        : active.state === 'starting' ? tr('正在开始录制', 'Starting recording') : tr('正在录制', 'Recording');
      var activeScope = active.scope || {};
      var activeHallId = text(activeScope.hallId || active.hallId, 80);
      var currentHallId = text(scope.hallId, 80);
      var otherHall = activeHallId && currentHallId && activeHallId !== currentHallId;
      statusNode.textContent = stateText + (otherHall ? ' · ' + tr('其他牌局', 'another table') + ' ' + activeHallId : '')
        + ' · ' + publicBotName(snapshot, active.botId || activeScope.initiatorBotId)
        + ' · ' + duration(activeSeconds(active));
      stopButton.hidden = false;
      var retry = active.state === 'stopping' && active.cleanupUnconfirmed === true;
      stopButton.disabled = stopBusy || active.state === 'stopping' && !retry;
      stopButton.textContent = stopBusy ? tr(retry ? '正在重试停止…' : '正在停止…', retry ? 'Retrying stop…' : 'Stopping…')
        : tr(retry ? '重试停止' : '停止录制', retry ? 'Retry stop' : 'Stop recording');
    } else {
      statusNode.textContent = snapshot.status && text(snapshot.status.message, 260) || tr('公共观战已连接', 'Public spectator connected');
      stopButton.hidden = true;
      stopButton.disabled = true;
    }
  }

  function updateAppearance(snapshot) {
    var appearance = snapshot.appearance;
    var dark = appearance === 'dark' || appearance && appearance.mode === 'dark';
    document.documentElement.dataset.appearance = dark ? 'dark' : 'light';
    var language = snapshot.language === 'en' ? 'en' : 'zh-CN';
    document.documentElement.lang = language;
    if (window.OpenBotGameSpace && window.OpenBotGameSpace.setSpectatorLanguage) {
      window.OpenBotGameSpace.setSpectatorLanguage(language);
    }
  }

  function publicProjection(snapshot) {
    var hall = snapshot.publicHall;
    if (!hall || typeof hall !== 'object') return null;
    var projection = {};
    Object.keys(hall).forEach(function (key) { projection[key] = hall[key]; });
    var bots = Array.isArray(snapshot.bots) ? snapshot.bots : (Array.isArray(hall.bots) ? hall.bots : []);
    projection.bots = bots.filter(function (bot) { return bot && bot.id !== undefined && bot.id !== null; }).map(function (bot) {
      return { id: String(bot.id), name: text(bot.name, 100), avatar: text(bot.avatar, 120), color: text(bot.color, 16) };
    });
    return projection;
  }

  function renderSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
      showError(tr('公共观战快照不可用。', 'The public spectator snapshot is unavailable.'));
      return;
    }
    latestSnapshot = snapshot;
    updateAppearance(snapshot);
    var scope = snapshot.scope;
    if (!scope || typeof scope !== 'object' || scope.viewBotId !== 'public-spectator') {
      showError(tr('录制范围不是公共观战视角。', 'The capture scope is not the public spectator view.'));
      board.replaceChildren();
      stopButton.hidden = true;
      return;
    }
    if (!snapshot.publicHall || text(snapshot.publicHall.id, 128) !== text(scope.hallId, 128)) {
      showError(tr('牌局快照与公共观战范围不匹配。', 'The table snapshot does not match the public spectator scope.'));
      board.replaceChildren();
      updateHeader(snapshot);
      return;
    }
    var projection = publicProjection(snapshot);
    if (!projection || !window.OpenBotGameSpace || typeof window.OpenBotGameSpace.renderSpectator !== 'function') {
      showError(tr('公共牌桌渲染器不可用。', 'The public table renderer is unavailable.'));
      return;
    }
    showError('');
    updateHeader(snapshot);
    var safeHall = window.OpenBotGameSpace.renderSpectator(board, projection);
    if (!safeHall) showError(tr('公共牌桌数据不可用。', 'Public table data is unavailable.'));
  }

  async function refreshSnapshot() {
    if (!bridge || typeof bridge.snapshot !== 'function') {
      showError(tr('公共观战宿主接口尚未连接。', 'The public spectator host API is not connected.'));
      statusNode.textContent = tr('无法读取牌局', 'Unable to read table');
      return null;
    }
    try {
      var snapshot = await bridge.snapshot();
      renderSnapshot(snapshot);
      return snapshot;
    } catch (error) {
      showError(text(error && error.message || String(error), 320) || tr('读取公共观战画面失败。', 'Could not read the public spectator view.'));
      return null;
    }
  }

  async function stopRecording() {
    if (!bridge || typeof bridge.stop !== 'function' || stopBusy || !latestSnapshot || !latestSnapshot.status || !latestSnapshot.status.active) return;
    stopBusy = true;
    updateHeader(latestSnapshot);
    try {
      var result = await bridge.stop();
      if (result && result.ok === false) throw new Error(result.message || tr('录制尚未确认停止。', 'The recording has not been confirmed stopped.'));
      showError('');
      await refreshSnapshot();
    } catch (error) {
      showError(text(error && error.message || String(error), 320) || tr('停止录制失败。', 'Could not stop recording.'));
      await refreshSnapshot();
    } finally {
      stopBusy = false;
      if (latestSnapshot) updateHeader(latestSnapshot);
    }
  }

  stopButton.addEventListener('click', stopRecording);

  if (bridge && typeof bridge.onChanged === 'function') {
    try {
      var result = bridge.onChanged(function (snapshot) {
        if (snapshot && typeof snapshot === 'object') renderSnapshot(snapshot);
        else refreshSnapshot();
      });
      if (typeof result === 'function') unsubscribe = result;
      else if (result && typeof result.unsubscribe === 'function') unsubscribe = function () { result.unsubscribe(); };
    } catch (error) {
      showError(text(error && error.message || String(error), 320));
    }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') refreshSnapshot();
  });
  window.addEventListener('beforeunload', function () {
    if (typeof unsubscribe === 'function') { try { unsubscribe(); } catch (_) { } }
  });

  refreshSnapshot();
})();
