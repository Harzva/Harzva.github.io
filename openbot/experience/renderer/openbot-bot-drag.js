(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenBotBotDrag = api;
})(typeof window === 'object' ? window : globalThis, function (root) {
  'use strict';

  var ALLOWED_KINDS = new Set(['space', 'project', 'meeting', 'group']);
  var DRAG_THRESHOLD = 6;
  var CLICK_GUARD_MS = 650;
  var FEEDBACK_MS = 2400;

  function tr(zh, en) {
    var i18n = root && root.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en) : zh;
  }

  function element(tag, className, text) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function errorMessage(error) {
    var message = error && error.message ? error.message : String(error || '');
    return message.trim().slice(0, 260) || tr('操作未能完成。', 'The action could not be completed.');
  }

  function normalizeTarget(value) {
    if (!value || !ALLOWED_KINDS.has(String(value.kind || ''))) return null;
    var id = String(value.id || '').trim();
    if (!id) return null;
    return {
      kind: String(value.kind),
      id: id,
      label: String(value.label || id).trim().slice(0, 180) || id
    };
  }

  function supportedColor(value) {
    var color = String(value || '').trim();
    if (!color || color.length > 48) return '';
    if (root.CSS && typeof root.CSS.supports === 'function') {
      return root.CSS.supports('color', color) ? color : '';
    }
    return /^#[0-9a-f]{3,8}$/i.test(color) ? color : '';
  }

  function isDisabled(node) {
    return !node || node.getAttribute('aria-disabled') === 'true' ||
      node.hasAttribute('disabled') || node.matches(':disabled');
  }

  function init(options) {
    options = options || {};
    var doc = root && root.document;
    if (!doc || !doc.body) throw new Error('OpenBotBotDrag needs a document body.');

    var getBot = typeof options.getBot === 'function' ? options.getBot : function () { return null; };
    var getCandidates = typeof options.getCandidates === 'function'
      ? options.getCandidates
      : function () { return Promise.resolve([]); };
    var onDrop = typeof options.onDrop === 'function'
      ? options.onDrop
      : function () { return Promise.reject(new Error('Bot participation is not connected.')); };
    var onError = typeof options.onError === 'function' ? options.onError : function () {};
    var sidebarSort = options.sidebarSort;
    var alive = true;
    var pending = false;
    var armed = null;
    var drag = null;
    var pickerTarget = null;
    var pickerOpener = null;
    var pickerRequest = 0;
    var feedbackTimer = 0;
    var animationFrame = 0;
    var clickGuard = null;
    var clickGuardTimer = 0;
    var dropTarget = null;
    var reducedMotion = !!(root.matchMedia &&
      root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var motionQuery = root.matchMedia
      ? root.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

    var overlay = element('div', 'ob-bot-drag__overlay');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    var tether = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tether.setAttribute('class', 'ob-bot-drag__tether');
    tether.setAttribute('aria-hidden', 'true');
    var bodyPath = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    bodyPath.setAttribute('class', 'ob-bot-drag__tether-body');
    var shinePath = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    shinePath.setAttribute('class', 'ob-bot-drag__tether-shine');
    tether.append(bodyPath, shinePath);

    var ghost = element('div', 'ob-bot-drag__ghost');
    var ghostAvatar = element('div', 'ob-bot-drag__ghost-avatar');
    var ghostLabel = element('div', 'ob-bot-drag__ghost-label');
    ghostLabel.setAttribute('aria-hidden', 'true');
    var hint = element('div', 'ob-bot-drag__hint');
    hint.setAttribute('role', 'presentation');
    ghost.append(ghostAvatar, ghostLabel);
    overlay.append(tether, ghost, hint);
    doc.body.appendChild(overlay);

    var feedback = element('div', 'ob-bot-drag__feedback');
    feedback.hidden = true;
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.setAttribute('aria-atomic', 'true');
    doc.body.appendChild(feedback);

    var dialog = element('dialog', 'ob-bot-drag__dialog');
    dialog.setAttribute('aria-labelledby', 'ob-bot-drag-title');
    dialog.setAttribute('aria-describedby', 'ob-bot-drag-temporary-note');
    var dialogHeader = element('header', 'ob-bot-drag__dialog-header');
    var dialogHeading = element('h2', 'ob-bot-drag__dialog-title');
    dialogHeading.id = 'ob-bot-drag-title';
    var closeButton = element('button', 'ob-bot-drag__close');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', tr('关闭机器人选择器', 'Close Bot picker'));
    closeButton.appendChild(element('span', '', '×'));
    dialogHeader.append(dialogHeading, closeButton);
    var temporaryNote = element('p', 'ob-bot-drag__temporary-note');
    temporaryNote.id = 'ob-bot-drag-temporary-note';
    var dialogStatus = element('div', 'ob-bot-drag__dialog-status');
    dialogStatus.setAttribute('role', 'status');
    dialogStatus.setAttribute('aria-live', 'polite');
    dialogStatus.setAttribute('aria-atomic', 'true');
    var candidateList = element('div', 'ob-bot-drag__candidates');
    candidateList.setAttribute('role', 'group');
    candidateList.setAttribute('aria-label', tr('可选机器人', 'Available Bots'));
    var emptyState = element('p', 'ob-bot-drag__empty');
    emptyState.hidden = true;
    var dialogFooter = element('footer', 'ob-bot-drag__dialog-footer');
    var cancelButton = element('button', 'ob-bot-drag__cancel',
      tr('取消', 'Cancel'));
    cancelButton.type = 'button';
    dialogFooter.appendChild(cancelButton);
    dialog.append(dialogHeader, temporaryNote, dialogStatus, candidateList, emptyState, dialogFooter);
    doc.body.appendChild(dialog);

    var removers = [];
    function listen(node, type, handler, listenerOptions) {
      node.addEventListener(type, handler, listenerOptions);
      removers.push(function () { node.removeEventListener(type, handler, listenerOptions); });
    }

    function callOnError(error) {
      try { onError(error); } catch (callbackError) {
        if (root.console && typeof root.console.error === 'function') {
          root.console.error('OpenBotBotDrag onError callback failed.', callbackError);
        }
      }
    }

    function setDialogStatus(message, tone) {
      dialogStatus.textContent = message || '';
      dialogStatus.dataset.tone = tone || '';
      dialogStatus.setAttribute('aria-live', tone === 'error' ? 'assertive' : 'polite');
    }

    function setFeedback(message, tone) {
      if (!alive) return;
      root.clearTimeout(feedbackTimer);
      feedback.textContent = message || '';
      feedback.dataset.tone = tone || '';
      feedback.setAttribute('aria-live', tone === 'error' ? 'assertive' : 'polite');
      feedback.hidden = !message;
      if (message && tone !== 'pending') {
        feedbackTimer = root.setTimeout(function () {
          if (!pending && alive) feedback.hidden = true;
        }, FEEDBACK_MS);
      }
    }

    function setDropTarget(next) {
      if (dropTarget === next) return;
      if (dropTarget) dropTarget.removeAttribute('data-ob-bot-drag-over');
      dropTarget = next || null;
      if (dropTarget) dropTarget.setAttribute('data-ob-bot-drag-over', 'true');
    }

    function targetAt(x, y) {
      var underneath = doc.elementFromPoint(x, y);
      var node = underneath && underneath.closest
        ? underneath.closest('[data-bot-drop-kind][data-bot-drop-id]')
        : null;
      if (!node || !doc.documentElement.contains(node) || isDisabled(node)) return null;
      return node;
    }

    function targetFromNode(node) {
      if (!node) return null;
      return normalizeTarget({
        kind: node.dataset.botDropKind,
        id: node.dataset.botDropId,
        label: node.dataset.botDropLabel || node.getAttribute('aria-label') || node.textContent
      });
    }

    function participantLabel(target) {
      return target && target.kind === 'meeting'
        ? tr('临时参会者', 'Temporary participant')
        : tr('临时访客', 'Temporary guest');
    }

    function leaveHint(target) {
      var role = participantLabel(target);
      return tr(role + ' · 离开此页面时退出', role + ' · leaves when you leave this page');
    }

    function setHintPosition(x, y) {
      var action = drag && drag.sidebarPreview;
      var chatHint = action === 'merge-rooms' ? tr('松开以合并为新群聊', 'Release to merge into a new chat') :
        action === 'merge' ? tr('松开以新建群聊', 'Release to create a group chat') :
        action === 'add' ? tr('松开以加入群聊', 'Release to add to group chat') : '';
      var cardHint = drag && drag.sidebarRow && drag.sidebarPreviewLayoutChange
        ? tr('松开以卡片排列', 'Release for card layout') : '';
      if (!chatHint && !cardHint && drag && drag.sidebarRow && !drag.target) {
        hint.style.display = 'none';
        return;
      }
      var text = chatHint || cardHint || leaveHint(drag && drag.target);
      if (hint.textContent !== text) hint.textContent = text;
      hint.style.display = '';
      var hintRect = hint.getBoundingClientRect();
      var left = Math.min(Math.max(8, x + 18), Math.max(8, root.innerWidth - hintRect.width - 8));
      var top = y + 24;
      if (top + hintRect.height > root.innerHeight - 8) top = y - hintRect.height - 18;
      hint.style.left = Math.round(Math.max(8, left)) + 'px';
      hint.style.top = Math.round(Math.max(8, top)) + 'px';
    }

    function avatarElement(source) {
      if (source.matches && source.matches('.sidebar-room-avatars, .ob-avatar, .avatar')) return source;
      return source.querySelector ? source.querySelector('.ob-avatar, .avatar') : null;
    }

    function setGhostAvatar(source, record) {
      ghostAvatar.replaceChildren();
      var sourceAvatar = avatarElement(source);
      if (sourceAvatar) {
        var clone = sourceAvatar.cloneNode(true);
        clone.removeAttribute('id');
        clone.removeAttribute('data-bot-drag-id');
        clone.removeAttribute('tabindex');
        clone.removeAttribute('aria-label');
        clone.setAttribute('aria-hidden', 'true');
        ghostAvatar.appendChild(clone);
        var bounds = sourceAvatar.getBoundingClientRect();
        ghostAvatar.style.width = Math.max(24, Math.min(64, bounds.width || 36)) + 'px';
        ghostAvatar.style.height = Math.max(24, Math.min(64, bounds.height || 36)) + 'px';
      } else if (root.OpenBotAvatars && typeof root.OpenBotAvatars.markup === 'function') {
        var helper = root.OpenBotAvatars;
        var avatarId = record && (record.avatar || record.avatarId);
        if (!avatarId && record && record.id && helper.defaultForId) avatarId = helper.defaultForId(record.id);
        var template = doc.createElement('template');
        template.innerHTML = helper.markup(avatarId, record && record.color, { size: 'mini' });
        ghostAvatar.appendChild(template.content.cloneNode(true));
      } else {
        ghostAvatar.appendChild(element('span', 'ob-bot-drag__fallback-avatar',
          String((record && record.name) || 'B').trim().charAt(0).toUpperCase() || 'B'));
      }
      var color = supportedColor(record && (record.color || record.tone));
      if (!color && sourceAvatar) {
        color = supportedColor(root.getComputedStyle(sourceAvatar).getPropertyValue('--ob-accent'));
      }
      if (color) overlay.style.setProperty('--ob-bot-drag-color', color);
    }

    function resolveBot(id) {
      try { return Promise.resolve(getBot(id)); }
      catch (error) { return Promise.reject(error); }
    }

    function getPointerOrigin(session) {
      var bounds = session.source.getBoundingClientRect();
      return {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2
      };
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function drawTether(session) {
      var preview = session && session.sidebarPreview;
      var show = !reducedMotion && (preview === 'merge' || preview === 'add' || preview === 'merge-rooms');
      tether.toggleAttribute('hidden', !show);
      if (!show) {
        bodyPath.setAttribute('d', '');
        shinePath.setAttribute('d', '');
        return;
      }
      var origin = getPointerOrigin(session);
      var endX = session.tailX;
      var endY = session.tailY;
      var dx = endX - origin.x;
      var dy = endY - origin.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 1) {
        bodyPath.setAttribute('d', '');
        shinePath.setAttribute('d', '');
        return;
      }
      var ux = dx / distance;
      var uy = dy / distance;
      var px = -uy;
      var py = ux;
      var lagX = session.pointerX - session.tailX;
      var lagY = session.pointerY - session.tailY;
      var bend = clamp(lagX * px + lagY * py, -14, 14);
      var startWidth = 3;
      var endWidth = clamp(9 + distance * 0.025, 12, 26);
      var c1x = origin.x + ux * distance * 0.32 + px * bend * 0.45;
      var c1y = origin.y + uy * distance * 0.32 + py * bend * 0.45;
      var c2x = origin.x + ux * distance * 0.76 + px * bend;
      var c2y = origin.y + uy * distance * 0.76 + py * bend;
      var p0x = origin.x;
      var p0y = origin.y;
      var p3x = endX;
      var p3y = endY;
      var d = [
        'M', p0x + px * startWidth, p0y + py * startWidth,
        'C', c1x + px * startWidth, c1y + py * startWidth,
        c2x + px * endWidth, c2y + py * endWidth,
        p3x + px * endWidth, p3y + py * endWidth,
        'Q', p3x + px * endWidth * 0.92, p3y + py * endWidth * 0.92, p3x, p3y,
        'Q', p3x - px * endWidth * 0.92, p3y - py * endWidth * 0.92,
        p3x - px * endWidth, p3y - py * endWidth,
        'C', c2x - px * endWidth, c2y - py * endWidth,
        c1x - px * startWidth, c1y - py * startWidth,
        p0x - px * startWidth, p0y - py * startWidth,
        'Q', p0x, p0y, p0x + px * startWidth, p0y + py * startWidth,
        'Z'
      ].join(' ');
      bodyPath.setAttribute('d', d);
      var shine = [
        'M', origin.x + px * 1.2, origin.y + py * 1.2,
        'C', c1x + px * 1.8, c1y + py * 1.8,
        c2x + px * 3.5, c2y + py * 3.5,
        p3x + px * Math.min(5, endWidth * 0.42),
        p3y + py * Math.min(5, endWidth * 0.42)
      ].join(' ');
      shinePath.setAttribute('d', shine);
    }

    function positionGhost(session) {
      var rect = ghost.getBoundingClientRect();
      var width = rect.width || 36;
      var height = rect.height || 36;
      ghost.style.left = Math.round(session.pointerX - width / 2) + 'px';
      ghost.style.top = Math.round(session.pointerY - height / 2) + 'px';
      setHintPosition(session.pointerX, session.pointerY);
    }

    function setGhostPreview(session) {
      var card = Boolean(session && session.sidebarIntent === 'sort' && session.sidebarPreviewLayoutChange);
      if (card) ghost.dataset.layout = 'card';
      else delete ghost.dataset.layout;
    }

    function renderDrag(session) {
      if (!alive || !session) return;
      positionGhost(session);
      drawTether(session);
      if (session.stage === 'dragging' && session.sidebarIntent === 'chat' && !reducedMotion) {
        var dx = session.pointerX - session.tailX;
        var dy = session.pointerY - session.tailY;
        session.tailVx = (session.tailVx + dx * 0.24) * 0.69;
        session.tailVy = (session.tailVy + dy * 0.24) * 0.69;
        session.tailX += session.tailVx;
        session.tailY += session.tailVy;
        var lagX = session.pointerX - session.tailX;
        var lagY = session.pointerY - session.tailY;
        var lagLength = Math.sqrt(lagX * lagX + lagY * lagY);
        if (lagLength > 20) {
          session.tailX = session.pointerX - lagX / lagLength * 20;
          session.tailY = session.pointerY - lagY / lagLength * 20;
        }
        animationFrame = root.requestAnimationFrame(function () {
          animationFrame = 0;
          renderDrag(session);
        });
      }
    }

    function startDrag(session, event) {
      if (!alive || pending || drag !== session) return;
      session.stage = 'dragging';
      // A normal press focuses the row. Once it becomes a drag, return the
      // editing caret immediately, without moving focus again after async work.
      var editor = session.previousEditor;
      if (editor && editor.isConnected && session.sidebarRow.contains(doc.activeElement)) {
        editor.focus({ preventScroll: true });
        if (session.selection && editor.value === session.selection.value) {
          editor.setSelectionRange(session.selection.start, session.selection.end, session.selection.direction);
        }
      }
      session.pointerX = event.clientX;
      session.pointerY = event.clientY;
      session.tailX = event.clientX;
      session.tailY = event.clientY;
      session.tailVx = 0;
      session.tailVy = 0;
      if (session.sidebarRow) sidebarSort.begin(session.sidebarRow, session.sidebarIntent, function (preview) {
        session.sidebarPreview = preview && preview.position || null;
        session.sidebarPreviewLayout = preview && preview.layout || '';
        session.sidebarPreviewLayoutChange = Boolean(preview && preview.layoutChange);
        if (drag === session) {
          setGhostPreview(session);
          positionGhost(session);
          setHintPosition(session.pointerX, session.pointerY);
        }
      });
      setGhostAvatar(session.source, null);
      var sourceLabel = session.sidebarRow && session.sidebarRow.querySelector('.bot-name-text');
      if (!sourceLabel && session.sidebarRow) {
        var sourceName = session.sidebarRow.querySelector('.bname');
        if (sourceName) {
          sourceLabel = sourceName.cloneNode(true);
          sourceLabel.querySelectorAll('.primary-mark, .bsub, .bot-type-tags').forEach(function (node) { node.remove(); });
        }
      }
      ghostLabel.textContent = sourceLabel ? String(sourceLabel.textContent || '').trim().slice(0, 80) : '';
      delete ghost.dataset.layout;
      session.source.setAttribute('data-ob-bot-drag-source', 'true');
      overlay.hidden = false;
      overlay.dataset.state = 'dragging';
      hint.textContent = leaveHint(null);
      ghost.dataset.pending = 'false';
      try {
        if (session.source.setPointerCapture) session.source.setPointerCapture(session.pointerId);
      } catch (_) {}
      if (!session.roomId) resolveBot(session.botId).then(function (record) {
        if (!alive || drag !== session || !record) return;
        session.record = record;
        var color = supportedColor(record.color || record.tone);
        if (color) overlay.style.setProperty('--ob-bot-drag-color', color);
        var name = record.name ? String(record.name) : '';
        if (name) overlay.dataset.botName = name.slice(0, 80);
      }).catch(function () {});
      if (event.cancelable) event.preventDefault();
      renderDrag(session);
    }

    function updateTarget(session, event) {
      session.sidebarTarget = session.sidebarRow && sidebarSort.target(event.clientX, event.clientY);
      setGhostPreview(session);
      var next = !session.sidebarTarget && session.canJoin && targetAt(event.clientX, event.clientY);
      setDropTarget(next);
      session.targetNode = next;
      session.target = targetFromNode(next);
      if (session.target) overlay.dataset.targetKind = session.target.kind;
      else delete overlay.dataset.targetKind;
    }

    function makeClickGuard(session, targetNode) {
      clickGuard = {
        source: session.source,
        downTarget: session.downTarget,
        target: targetNode,
        expires: Date.now() + CLICK_GUARD_MS
      };
      root.clearTimeout(clickGuardTimer);
      clickGuardTimer = root.setTimeout(function () {
        clickGuard = null;
      }, CLICK_GUARD_MS);
    }

    function releaseCapture(session) {
      try {
        if (session.source.hasPointerCapture &&
            session.source.hasPointerCapture(session.pointerId) &&
            session.source.releasePointerCapture) {
          session.source.releasePointerCapture(session.pointerId);
        }
      } catch (_) {}
    }

    function stopAnimation() {
      if (animationFrame) {
        root.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    }

    function hideDrag(session) {
      stopAnimation();
      if (session && session.source) session.source.removeAttribute('data-ob-bot-drag-source');
      if (session && session.source) releaseCapture(session);
      if (session && session.sidebarRow) sidebarSort.finish();
      overlay.hidden = true;
      delete ghost.dataset.layout;
      delete overlay.dataset.state;
      delete overlay.dataset.targetKind;
      delete overlay.dataset.botName;
      overlay.style.removeProperty('--ob-bot-drag-color');
      hint.style.display = '';
      hint.style.left = '';
      hint.style.top = '';
      setDropTarget(null);
      if (session) {
        session.stage = 'ended';
        session.targetNode = null;
      }
    }

    function cancelDrag() {
      var session = drag || armed;
      if (!session) return;
      drag = null;
      armed = null;
      hideDrag(session);
    }

    function showDropFeedback(botName, target, tone, error) {
      var subject = botName || tr('机器人', 'Bot');
      if (tone === 'pending') {
        setFeedback(tr('正在加入…', 'Joining…'), 'pending');
      } else if (tone === 'success') {
        var role = participantLabel(target).toLowerCase();
        setFeedback(tr(subject + ' 已作为' + role + '加入。', subject + ' joined as a ' + role + '.'), 'success');
      } else {
        var detail = errorMessage(error);
        setFeedback(tr('无法加入：' + detail, 'Could not join: ' + detail), 'error');
      }
    }

    function explicitFailure(result) {
      return result === false || !!(result && typeof result === 'object' &&
        (result.ok === false || result.accepted === false));
    }

    async function performDrop(botId, target, botName, source) {
      if (!alive || pending) return false;
      pending = true;
      if (source === 'drag') {
        overlay.dataset.state = 'pending';
        ghost.dataset.pending = 'true';
        showDropFeedback(botName, target, 'pending');
      } else {
        setDialogStatus(tr('正在加入…', 'Joining…'), 'pending');
      }
      try {
        var result = await onDrop({
          botId: String(botId),
          kind: target.kind,
          id: target.id,
          label: target.label
        });
        if (explicitFailure(result)) {
          throw new Error(result && result.message
            ? String(result.message)
            : tr('目标未接受此机器人。', 'The destination did not accept this Bot.'));
        }
        if (source === 'picker') closePicker(true);
        showDropFeedback(botName, target, 'success');
        return true;
      } catch (error) {
        callOnError(error);
        if (source === 'picker') {
          setDialogStatus(tr('无法加入：' + errorMessage(error),
            'Could not join: ' + errorMessage(error)), 'error');
        } else {
          showDropFeedback(botName, target, 'error', error);
        }
        return false;
      } finally {
        pending = false;
        if (source === 'drag') hideDrag(null);
        if (source === 'picker') updateCandidateDisabledState();
      }
    }

    function updateCandidateDisabledState() {
      var buttons = candidateList.querySelectorAll('[data-bot-candidate-id]');
      buttons.forEach(function (button) {
        var baseDisabled = button.dataset.disabled === 'true';
        button.disabled = pending || baseDisabled;
      });
    }

    function closePicker(restoreFocus) {
      pickerRequest += 1;
      if (dialog.open) {
        try { dialog.close(); } catch (_) {}
      }
      if (restoreFocus !== false) {
        var opener = pickerOpener;
        if (opener && opener.isConnected && typeof opener.focus === 'function') {
          root.requestAnimationFrame(function () {
            if (opener.isConnected) {
              try { opener.focus({ preventScroll: true }); } catch (_) { opener.focus(); }
            }
          });
        }
      }
      pickerTarget = null;
      pickerOpener = null;
      candidateList.replaceChildren();
      emptyState.hidden = true;
      setDialogStatus('', '');
    }

    function candidateAvatar(record) {
      var wrapper = element('span', 'ob-bot-drag__candidate-avatar');
      var helper = root.OpenBotAvatars;
      if (helper && typeof helper.markup === 'function') {
        var avatarId = record.avatar || record.avatarId;
        if (!avatarId && record.id && helper.defaultForId) avatarId = helper.defaultForId(record.id);
        var template = doc.createElement('template');
        template.innerHTML = helper.markup(avatarId, record.color || record.tone, { size: 'mini' });
        wrapper.appendChild(template.content.cloneNode(true));
      } else {
        var first = String(record.name || record.id || 'B').trim().charAt(0);
        wrapper.appendChild(element('span', 'ob-bot-drag__fallback-avatar', first.toUpperCase() || 'B'));
      }
      return wrapper;
    }

    async function hydrateCandidate(candidate) {
      if (candidate.avatar || candidate.avatarId) return candidate;
      try {
        var record = await resolveBot(candidate.id);
        if (record && typeof record === 'object') {
          return Object.assign({}, record, candidate);
        }
      } catch (_) {}
      return candidate;
    }

    function renderCandidates(candidates, requestId) {
      if (!alive || requestId !== pickerRequest || !dialog.open) return;
      candidateList.replaceChildren();
      var values = Array.isArray(candidates) ? candidates : [];
      if (!values.length) {
        emptyState.textContent = tr('没有可选择的机器人。', 'No Bots are available for this destination.');
        emptyState.hidden = false;
        return;
      }
      emptyState.hidden = true;
      values.forEach(function (candidate) {
        if (!candidate || candidate.id === undefined || candidate.id === null) return;
        var record = candidate;
        var reason = String(record.reason || '');
        var joined = !!record.joined;
        var unavailable = !!reason || joined;
        var row = element('button', 'ob-bot-drag__candidate');
        row.type = 'button';
        row.dataset.botCandidateId = String(record.id);
        row.dataset.disabled = unavailable ? 'true' : 'false';
        row.disabled = unavailable || pending;
        row.appendChild(candidateAvatar(record));
        var copy = element('span', 'ob-bot-drag__candidate-copy');
        copy.appendChild(element('strong', 'ob-bot-drag__candidate-name',
          String(record.name || tr('未命名机器人', 'Unnamed Bot'))));
        var detail = reason || (joined ? tr('已在此空间中', 'Already in this space') : '');
        if (detail) copy.appendChild(element('span', 'ob-bot-drag__candidate-reason', detail));
        row.appendChild(copy);
        candidateList.appendChild(row);
        row.addEventListener('click', async function () {
          if (pending || row.disabled || !pickerTarget) return;
          updateCandidateDisabledState();
          Array.from(candidateList.querySelectorAll('[data-bot-candidate-id]')).forEach(function (item) {
            item.disabled = true;
          });
          var botName = String(record.name || tr('机器人', 'Bot'));
          var accepted = await performDrop(record.id, pickerTarget, botName, 'picker');
          if (!accepted && alive) updateCandidateDisabledState();
        });
      });
      var firstEnabled = candidateList.querySelector('button:not(:disabled)');
      if (firstEnabled) firstEnabled.focus({ preventScroll: true });
      else closeButton.focus({ preventScroll: true });
    }

    async function openPicker(targetValue, opener) {
      if (!alive || pending) return false;
      var target = normalizeTarget(targetValue);
      if (!target) {
        var error = new Error(tr('目标空间无效。', 'The destination is not valid.'));
        callOnError(error);
        setFeedback(errorMessage(error), 'error');
        return false;
      }
      if (drag) cancelDrag();
      var wasOpen = dialog.open;
      if (!wasOpen) closePicker(false);
      pickerTarget = target;
      if (opener || !wasOpen) pickerOpener = opener || doc.activeElement;
      dialogHeading.textContent = tr('选择机器人 · ' + target.label, 'Choose a Bot · ' + target.label);
      temporaryNote.textContent = leaveHint(target);
      setDialogStatus(tr('正在读取机器人…', 'Loading Bots…'), 'pending');
      emptyState.hidden = true;
      if (!wasOpen) {
        try {
          if (typeof dialog.showModal === 'function') dialog.showModal();
          else {
            dialog.setAttribute('open', '');
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');
          }
        } catch (error) {
          callOnError(error);
          setDialogStatus(tr('无法打开机器人选择器。', 'The Bot picker could not be opened.'), 'error');
          return false;
        }
      }
      var requestId = ++pickerRequest;
      closeButton.focus({ preventScroll: true });
      try {
        var result = await getCandidates(target);
        if (!alive || requestId !== pickerRequest || !dialog.open) return false;
        var values = Array.isArray(result) ? result : [];
        var hydrated = await Promise.all(values.map(hydrateCandidate));
        if (!alive || requestId !== pickerRequest || !dialog.open) return false;
        setDialogStatus('', '');
        renderCandidates(hydrated, requestId);
        return true;
      } catch (error) {
        if (!alive || requestId !== pickerRequest || !dialog.open) return false;
        callOnError(error);
        candidateList.replaceChildren();
        emptyState.hidden = true;
        setDialogStatus(tr('无法读取机器人：' + errorMessage(error),
          'Could not load Bots: ' + errorMessage(error)), 'error');
        return false;
      }
    }

    function onPointerDown(event) {
      if (!alive || pending || event.button !== 0 || armed || drag) return;
      if (!event.target || !event.target.closest) return;
      var source = event.target.closest('[data-bot-drag-id]');
      var sidebarRow = sidebarSort && sidebarSort.source(event.target);
      if (sidebarRow && !event.isTrusted) return;
      // The row button covers the passive avatar and name. Resolve the starting
      // surface once, even when pointer capture later retargets events.
      var row = event.target.closest('#bot-list .bot-item');
      var sidebarIntent = null;
      var roomId = sidebarRow && sidebarRow.dataset.sidebarChatId;
      if (roomId) {
        source = sidebarRow.querySelector('.sidebar-room-avatars');
        if (!source) return;
        sidebarIntent = source.contains(event.target) || sidebarRow.closest('[data-compact="true"]') ? 'chat' : 'sort';
      } else if (row) {
        if (event.target.closest('button:not(.bot-select), input, textarea, [contenteditable="true"], [role="menu"]')) return;
        var stack = row.querySelector('.bot-avatar-stack[data-bot-drag-id]');
        var face = stack && avatarElement(stack);
        if (!face) return;
        var bounds = face.getBoundingClientRect();
        var overAvatar = !!row.closest('[data-compact="true"]') ||
          (event.clientX >= bounds.left && event.clientX < bounds.right &&
           event.clientY >= bounds.top && event.clientY < bounds.bottom);
        var meta = row.querySelector('.meta');
        var avatarOnly = !!meta && getComputedStyle(meta).display === 'none';
        sidebarIntent = overAvatar && !avatarOnly ? 'chat' : 'sort';
        if (!sidebarRow && !overAvatar) return;
        source = stack;
      }
      var canJoin = !roomId && !!source && sidebarIntent !== 'sort' && typeof options.onDrop === 'function';
      if ((!canJoin && !sidebarRow) || !source || isDisabled(source) || !doc.documentElement.contains(source)) return;
      var botId = String(source.dataset.botDragId || '').trim();
      if (!botId && !roomId) return;
      var editor = sidebarRow && doc.activeElement;
      if (!editor || !editor.matches('textarea, input, [contenteditable="true"]')) editor = null;
      armed = {
        source: source,
        downTarget: event.target,
        sidebarRow: sidebarRow,
        sidebarIntent: sidebarIntent,
        previousEditor: editor,
        selection: editor && typeof editor.selectionStart === 'number'
          ? { start: editor.selectionStart, end: editor.selectionEnd, direction: editor.selectionDirection, value: editor.value } : null,
        canJoin: canJoin,
        botId: botId,
        roomId: roomId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY
      };
    }

    function onPointerMove(event) {
      var session = drag || armed;
      if (session && session.pointerId === event.pointerId && session.sidebarRow &&
          (event.clientX < 0 || event.clientX >= root.innerWidth || event.clientY < 0 || event.clientY >= root.innerHeight)) {
        makeClickGuard(session, null);
        cancelDrag();
        return;
      }
      if (drag) {
        if (event.pointerId !== drag.pointerId || drag.stage !== 'dragging') return;
      } else {
        if (!armed || event.pointerId !== armed.pointerId) return;
        var dx = event.clientX - armed.startX;
        var dy = event.clientY - armed.startY;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        drag = armed;
        armed = null;
        startDrag(drag, event);
      }
      if (!drag || drag.pointerId !== event.pointerId || drag.stage !== 'dragging') return;
      if (event.cancelable) event.preventDefault();
      drag.pointerX = event.clientX;
      drag.pointerY = event.clientY;
      updateTarget(drag, event);
      positionGhost(drag);
      if (reducedMotion) drawTether(drag);
      else if (!animationFrame) renderDrag(drag);
    }

    function onPointerUp(event) {
      if (armed && event.pointerId === armed.pointerId) {
        armed = null;
        return;
      }
      if (!drag || event.pointerId !== drag.pointerId || drag.stage !== 'dragging') return;
      drag.pointerX = event.clientX;
      drag.pointerY = event.clientY;
      updateTarget(drag, event);
      var session = drag;
      var node = session.targetNode;
      var target = session.target;
      drag = null;
      armed = null;
      makeClickGuard(session, session.sidebarTarget ? session.sidebarTarget.node : node);
      releaseCapture(session);
      if (session.sidebarRow && !session.sidebarRow.isConnected) {
        hideDrag(session);
        return;
      }
      if (session.sidebarTarget) {
        try {
          var result = sidebarSort.drop(session.sidebarTarget);
          if (result && typeof result.catch === 'function') result.catch(callOnError);
        }
        finally { hideDrag(session); }
        return;
      }
      if (!node || !target || isDisabled(node)) {
        if (session.sidebarRow) sidebarSort.explainRejected?.(event.clientX, event.clientY);
        hideDrag(session);
        return;
      }
      session.stage = 'pending';
      session.target = target;
      session.targetNode = node;
      setDropTarget(node);
      performDrop(session.botId, target,
        session.record && session.record.name ? String(session.record.name) : '',
        'drag').finally(function () {
          if (!alive) return;
          hideDrag(session);
        });
    }

    function onPointerCancel(event) {
      if (armed && event.pointerId === armed.pointerId) {
        armed = null;
        return;
      }
      if (drag && event.pointerId === drag.pointerId) cancelDrag();
    }

    function onKeyDown(event) {
      if (event.key === 'Escape' && (drag || armed)) {
        event.preventDefault();
        event.stopPropagation();
        makeClickGuard(drag || armed, null);
        cancelDrag();
      }
    }

    function onWindowBlur() {
      if (drag) makeClickGuard(drag, null);
      cancelDrag();
    }

    function onVisibilityChange() {
      if (doc.visibilityState === 'hidden') onWindowBlur();
    }

    function onClick(event) {
      if (!clickGuard || event.detail === 0 || Date.now() > clickGuard.expires) return;
      var path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      var guarded = path.indexOf(clickGuard.source) >= 0 ||
        (clickGuard.downTarget && path.indexOf(clickGuard.downTarget) >= 0) ||
        (clickGuard.target && path.indexOf(clickGuard.target) >= 0);
      if (!guarded) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      clickGuard = null;
      root.clearTimeout(clickGuardTimer);
    }

    function onDialogCancel(event) {
      event.preventDefault();
      closePicker(true);
    }

    function onDialogClose() {
      var opener = pickerOpener;
      pickerRequest += 1;
      pickerTarget = null;
      pickerOpener = null;
      candidateList.replaceChildren();
      emptyState.hidden = true;
      setDialogStatus('', '');
      if (opener && opener.isConnected && typeof opener.focus === 'function') {
        root.requestAnimationFrame(function () {
          if (opener.isConnected) {
            try { opener.focus({ preventScroll: true }); } catch (_) { opener.focus(); }
          }
        });
      }
    }

    function onDialogClick(event) {
      if (event.target === dialog) closePicker(true);
    }

    function onCloseButton() { closePicker(true); }

    function onMotionChange(event) {
      reducedMotion = !!event.matches;
      if (!drag) return;
      if (reducedMotion) {
        stopAnimation();
        drag.tailX = drag.pointerX;
        drag.tailY = drag.pointerY;
        drawTether(drag);
      } else if (drag.stage === 'dragging' && !animationFrame) {
        renderDrag(drag);
      }
    }

    listen(doc, 'pointerdown', onPointerDown, true);
    listen(doc, 'pointermove', onPointerMove, { capture: true, passive: false });
    listen(doc, 'pointerup', onPointerUp, true);
    listen(doc, 'pointercancel', onPointerCancel, true);
    listen(doc, 'click', onClick, true);
    listen(doc, 'keydown', onKeyDown, true);
    listen(root, 'blur', onWindowBlur);
    listen(doc, 'visibilitychange', onVisibilityChange);
    listen(dialog, 'cancel', onDialogCancel);
    listen(dialog, 'close', onDialogClose);
    listen(dialog, 'click', onDialogClick);
    listen(closeButton, 'click', onCloseButton);
    listen(cancelButton, 'click', onCloseButton);
    if (motionQuery) {
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', onMotionChange);
        removers.push(function () { motionQuery.removeEventListener('change', onMotionChange); });
      } else if (motionQuery.addListener) {
        motionQuery.addListener(onMotionChange);
        removers.push(function () { motionQuery.removeListener(onMotionChange); });
      }
    }

    function destroy() {
      if (!alive) return;
      alive = false;
      cancelDrag();
      closePicker(true);
      root.clearTimeout(feedbackTimer);
      root.clearTimeout(clickGuardTimer);
      stopAnimation();
      removers.forEach(function (remove) { remove(); });
      removers = [];
      if (feedback.isConnected) feedback.remove();
      if (overlay.isConnected) overlay.remove();
      if (dialog.isConnected) dialog.remove();
      clickGuard = null;
    }

    return {
      openPicker: openPicker,
      destroy: destroy
    };
  }

  return { init: init };
});
