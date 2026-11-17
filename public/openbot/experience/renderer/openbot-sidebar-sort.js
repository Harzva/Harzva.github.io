/* Local list layout. The shared Bot pointer controller owns capture, Escape and click suppression. */
(function (root) {
  'use strict';

  function ordered(bots, order) {
    var rank = new Map(order.map(function (id, index) { return [id, index]; }));
    return bots.slice().sort(function (a, b) {
      return (rank.get(a.id) ?? rank.size) - (rank.get(b.id) ?? rank.size);
    });
  }

  // Only the slots occupied by this visible lane participate in the reorder.
  // A search or Space projection therefore leaves other Bots at their own slots.
  function insertAt(order, lane, id, anchor, after) {
    var participants = new Set(lane.concat(id));
    var next = lane.filter(function (item) { return item !== id; });
    var at = anchor ? next.indexOf(anchor) + Number(after) : next.length;
    next.splice(at, 0, id);
    var cursor = 0;
    return order.map(function (item) { return participants.has(item) ? next[cursor++] : item; });
  }

  function create(options) {
    var list = options.list;
    var active = null, marker = null, deferred = false;
    var chatBusy = false;
    var frame = 0, speed = 0, pointerX = 0, pointerY = 0;

    function source(node) {
      if (!node) return null;
      var room = node.closest('[data-sidebar-chat-id]');
      if (room && list.contains(room) && node.closest('button[data-shortcut="room"]')) return room;
      if (node.closest('input,textarea,[contenteditable="true"],button:not(.bot-select),[role="menu"]')) return null;
      var row = node.closest('.bot-item');
      return row && list.contains(row) && row.parentElement.hasAttribute('data-sidebar-sort-zone') ? row : null;
    }

    function begin(row, intent, onPreview) {
      if (!list.contains(row)) return;
      var context = options.context();
      var roomId = row.dataset.sidebarChatId;
      if (roomId ? !context.chatEnabled : !context.visibleIds.includes(row.dataset.id)) return;
      active = {row: row, roomId: roomId, intent: intent, key: context.key, chatEnabled: context.chatEnabled === true,
        requestId: 'drag-' + root.crypto.randomUUID(), onPreview: onPreview};
      var anchorTop = row.getBoundingClientRect().top;
      list.dataset.sidebarDragging = 'true';
      list.dataset.sidebarDragIntent = intent;
      // Empty-lane targets only enter the flow for a sort gesture. Compensate
      // their height so the row under the pointer does not jump on mouse-down.
      var shiftedTop = row.getBoundingClientRect().top;
      if (Math.abs(shiftedTop - anchorTop) >= .5) list.scrollTop += shiftedTop - anchorTop;
    }

    function isCurrent(context) {
      return active && list.contains(active.row) && context.key === active.key &&
        (context.chatEnabled === true) === active.chatEnabled;
    }

    function clearMarker(node) {
      if (!node) return;
      delete node.dataset.botDropPosition;
      delete node.dataset.botDropLayout;
      delete node.dataset.botDropEdge;
    }

    function previewKey(next) {
      return next ? [next.position, next.layout || '', next.edge || '', Boolean(next.layoutChange)].join('|') : '';
    }

    function mark(next) {
      if (marker && (!next || marker.node !== next.node)) clearMarker(marker.node);
      if (marker && marker.zone && (!next || marker.zone !== next.zone)) delete marker.zone.dataset.botDropLayoutPreview;
      if (next) {
        next.node.dataset.botDropPosition = next.position;
        if (next.layout) next.node.dataset.botDropLayout = next.layout;
        else delete next.node.dataset.botDropLayout;
        if (next.edge) next.node.dataset.botDropEdge = next.edge;
        else delete next.node.dataset.botDropEdge;
        if (next.zone) {
          if (next.layoutChange) next.zone.dataset.botDropLayoutPreview = 'grid';
          else delete next.zone.dataset.botDropLayoutPreview;
        }
      }
      var previous = previewKey(marker);
      marker = next;
      if (active && active.onPreview && previous !== previewKey(next)) {
        active.onPreview(next ? {
          position: next.position,
          layout: next.layout || '',
          edge: next.edge || '',
          layoutChange: Boolean(next.layoutChange)
        } : null);
      }
    }

    function chatTarget(node, id, position) {
      var chat = options.getChat && options.getChat();
      var botId = active.row.dataset.id;
      var eligible = chat && !chatBusy && (position === 'merge' ? chat.canMerge(botId, id) : chat.canAdd(botId, id));
      return eligible ? {node: node, anchor: id, position: position} : null;
    }

    function locate(x, y) {
      var node = document.elementFromPoint(x, y);
      if (!node || !list.contains(node) || node.closest('[role="menu"]')) return null;
      var row = node.closest('.bot-item');
      if (!active.roomId && row && row.dataset.id === active.row.dataset.id) return null;
      var room = node.closest('[data-sidebar-chat-id]');
      if (active.roomId) {
        if (!active.chatEnabled) return null;
        var chat = options.getChat();
        if (active.intent === 'chat') {
          return room && !chatBusy && chat.canMergeRooms(active.roomId, room.dataset.sidebarChatId)
            ? {node: room, anchor: room.dataset.sidebarChatId, position: 'merge-rooms'} : null;
        }
        var home = node.closest('[data-sidebar-sort-zone="group"]');
        return home && home.dataset.groupId !== active.row.dataset.sidebarRoomHome
          ? {node: home, position: 'inside', groupId: home.dataset.groupId} : null;
      }
      if (active.intent === 'chat') {
        if (!active.chatEnabled) return null;
        if (room) return chatTarget(room, room.dataset.sidebarChatId, 'add');
        return row ? chatTarget(row, row.dataset.id, 'merge') : null;
      }
      if (room) return null;
      var zone = node.closest('[data-sidebar-sort-zone]');
      if (!zone) return null;
      if (!row) return {zone: zone, node: zone, position: 'inside'};
      var bounds = row.getBoundingClientRect();
      var compact = Boolean(list.closest('[data-compact="true"]'));
      var gridGroup = zone.matches('.bot-list-group[data-group-layout="grid"]') ? zone : null;
      var gridColumns = gridGroup ? getComputedStyle(gridGroup).gridTemplateColumns.split(/\s+/).filter(Boolean).length : 0;
      var pinRail = zone.hasAttribute('data-sidebar-pin-rail');
      var horizontal = !compact && (pinRail || gridColumns > 1);
      var fraction = horizontal ? (x - bounds.left) / bounds.width : (y - bounds.top) / bounds.height;
      var after = fraction >= 0.5;
      var listGroup = zone.matches('.bot-list-group[data-group-layout="list"]');
      var rightZone = !compact && listGroup && bounds.width >= 180 && x >= bounds.right - 58;
      if (rightZone) {
        return {zone: zone, node: row, position: 'after', anchor: row.dataset.id,
          layout: 'grid', edge: 'right', layoutChange: true};
      }
      return {zone: zone, node: row, position: after ? 'after' : 'before', anchor: row.dataset.id,
        layout: pinRail || gridColumns ? 'grid' : 'list',
        edge: horizontal ? (after ? 'right' : 'left') : (after ? 'bottom' : 'top')};
    }

    function scrollStep() {
      frame = 0;
      if (!active || !speed) return;
      var top = list.scrollTop;
      list.scrollTop += speed;
      if (list.scrollTop === top) return;
      mark(locate(pointerX, pointerY));
      frame = root.requestAnimationFrame(scrollStep);
    }

    function target(x, y) {
      if (!active || !list.contains(active.row)) return null;
      var bounds = list.getBoundingClientRect();
      pointerX = x;
      pointerY = y;
      speed = 0;
      if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
        var edge = 30;
        if (y < bounds.top + edge) speed = -Math.ceil((bounds.top + edge - y) / 3);
        else if (y > bounds.bottom - edge) speed = Math.ceil((y - bounds.bottom + edge) / 3);
      }
      if (speed && !frame) frame = root.requestAnimationFrame(scrollStep);
      mark(locate(pointerX, pointerY));
      return marker;
    }

    function finish() {
      if (frame) root.cancelAnimationFrame(frame);
      frame = speed = 0;
      mark(null);
      active = null;
      delete list.dataset.sidebarDragging;
      delete list.dataset.sidebarDragIntent;
      if (deferred) {
        deferred = false;
        options.render();
      }
    }

    function deferRender() {
      if (!active) return false;
      if (!isCurrent(options.context())) {
        deferred = false;
        finish();
        return false;
      }
      deferred = true;
      return true;
    }

    async function commitChat(place, id, requestId) {
      var chat = options.getChat();
      chatBusy = true;
      finish();
      try {
        if (place.position === 'merge-rooms') return await chat.mergeRooms(id, place.anchor, requestId);
        if (place.position === 'merge') return await chat.create(id, place.anchor, requestId);
        return await chat.add(id, place.anchor, requestId);
      } finally { chatBusy = false; }
    }

    function drop(place) {
      if (!active || !place || !list.contains(place.node)) return;
      var context = options.context(), id = active.row.dataset.id;
      if (!isCurrent(context)) return;
      if (active.roomId) {
        var chat = options.getChat();
        var roomId = active.roomId;
        if (!context.chatEnabled || !chat) return;
        if (active.intent === 'chat' && place.position === 'merge-rooms' && !chatBusy && chat.canMergeRooms(roomId, place.anchor)) {
          return commitChat(place, roomId, active.requestId);
        }
        if (active.intent === 'sort' && place.position === 'inside' && place.node.dataset.groupId === place.groupId) {
          finish();
          return chat.moveRoom(roomId, place.groupId);
        }
        return;
      }
      if (!context.visibleIds.includes(id)) return;
      if (active.intent === 'chat') {
        if (!context.chatEnabled || (place.position !== 'merge' && place.position !== 'add') ||
            (place.position === 'merge' && !context.visibleIds.includes(place.anchor)) ||
            !chatTarget(place.node, place.anchor, place.position)) return;
        return commitChat(place, id, active.requestId);
      }
      return commitLayout(id,place,context);
    }

    function explainRejected(x, y) {
      // Give feedback only when a completed avatar drag lands on a concrete chat target.
      if (!active || active.intent !== 'chat' || !active.chatEnabled || !isCurrent(options.context())) return;
      var node = document.elementFromPoint(x,y);
      if (!node || !list.contains(node) || node.closest('[role="menu"]')) return;
      var room = node.closest('[data-sidebar-chat-id]');
      var row = node.closest('.bot-item');
      var chat = options.getChat();
      if (room) chat?.explainRejected?.(active.roomId ? 'merge-rooms' : 'add', active.roomId || active.row.dataset.id, room.dataset.sidebarChatId);
      else if (row && !active.roomId && row !== active.row) chat?.explainRejected?.('merge', active.row.dataset.id, row.dataset.id);
    }

    function moveBeside(row, neighbor, after) {
      var zone = row.parentElement, context = options.context();
      if (!list.contains(row) || neighbor.parentElement !== zone || !zone.hasAttribute('data-sidebar-sort-zone') ||
          !context.visibleIds.includes(row.dataset.id) || !context.visibleIds.includes(neighbor.dataset.id)) return false;
      return commitLayout(row.dataset.id, {zone:zone, anchor:neighbor.dataset.id, position:after?'after':'before'}, context);
    }

    function commitLayout(id, place, context) {
      var org = options.read();
      var zone = place.zone.dataset.sidebarSortZone;
      var globalPin = zone === 'pins', groupPin = zone === 'group-pins';
      var groupId = place.zone.dataset.groupId;
      var group = org.groups.find(function (g) { return g.id === groupId; });
      if ((groupId || groupPin) && !group) return;
      var lane = Array.from(place.zone.querySelectorAll(':scope > .bot-item'), function (el) { return el.dataset.id; });
      if (place.anchor && !lane.includes(place.anchor)) return;
      var after = place.position === 'after';
      if (globalPin || groupPin) {
        var pins = globalPin ? org.pins : group.pins;
        var nextPins = insertAt(pins.includes(id) ? pins : pins.concat(id), lane, id, place.anchor, after);
        if (globalPin) org.pins = nextPins;
        else group.pins = nextPins;
      } else {
        var all = new Set(context.allIds);
        var order = Array.from(new Set(org.order.filter(function (item) { return all.has(item); }).concat(context.allIds)));
        // A collapsed heading is an append target even though none of its rows are mounted.
        if (!lane.length && !place.zone.hasAttribute('data-sidebar-empty-drop')) {
          var visible = new Set(context.visibleIds);
          var grouped = new Set(org.groups.flatMap(function (g) { return g.botIds; }));
          lane = order.filter(function (item) {
            return visible.has(item) && !org.pins.includes(item) &&
              (group ? group.botIds.includes(item) && !(group.pins || []).includes(item) : !grouped.has(item));
          });
        }
        org.order = insertAt(order, lane, id, place.anchor, after);
      }
      if (!globalPin) {
        org.pins = org.pins.filter(function (item) { return item !== id; });
        org.groups.forEach(function (g) {
          if (g !== group) g.botIds = g.botIds.filter(function (item) { return item !== id; });
          if (g !== group || !groupPin) g.pins = (g.pins || []).filter(function (item) { return item !== id; });
        });
        if (group && !group.botIds.includes(id)) group.botIds.push(id);
      }
      if (place.layout === 'grid' && place.layoutChange && !globalPin && !groupPin &&
          place.zone.matches('.bot-list-group')) {
        if (!org.groupLayouts || typeof org.groupLayouts !== 'object' || Array.isArray(org.groupLayouts)) {
          org.groupLayouts = Object.create(null);
        }
        org.groupLayouts[groupId || options.ungroupedLayoutId || '@ungrouped'] = 'grid';
      }
      // write() rerenders on success. A failed write still releases the gesture.
      finish();
      return options.write(org);
    }

    // The keyboard action goes through the same eligibility and request receipt as a drop.
    function openMergePicker(roomId, opener) {
      var chat = options.getChat();
      if (!options.context().chatEnabled || !chat) return;
      var rooms = chat.getRooms();
      var current = rooms.find(room => room.id === roomId);
      if (!current || document.getElementById('sidebar-room-merge-picker')) return;
      var candidates = rooms.filter(room => chat.canMergeRooms(roomId, room.id));
      var dialog = document.createElement('dialog');
      dialog.id = 'sidebar-room-merge-picker';
      dialog.className = 'ob-bot-drag__dialog';
      dialog.setAttribute('aria-labelledby', 'sidebar-room-merge-title');
      var t = (zh, en) => root.OpenBotI18n?.t(zh, en) || zh;
      function item(tag, cls, value) {
        var node = document.createElement(tag);
        node.className = cls;
        node.textContent = value;
        return node;
      }
      var header = item('header', 'ob-bot-drag__dialog-header', '');
      var title = item('h2', 'ob-bot-drag__dialog-title', t('合并群聊', 'Merge group chats'));
      title.id = 'sidebar-room-merge-title';
      var cancel = item('button', 'ob-bot-drag__close', '×');
      cancel.type = 'button';
      cancel.setAttribute('aria-label', t('关闭', 'Close'));
      cancel.onclick = () => dialog.close();
      header.append(title, cancel);
      var note = item('p', 'ob-bot-drag__temporary-note',
        t('选择与「' + current.name + '」合并的群。原群会保留。', 'Choose a chat to merge with “' + current.name + '”. Both originals are kept.'));
      var entries = item('div', 'ob-bot-drag__candidates', '');
      var status = item('p', 'ob-bot-drag__dialog-status', '');
      status.setAttribute('role', 'status');
      for (const target of candidates) {
        var label = rooms.some(other => other.id !== target.id && other.name === target.name)
          ? target.name + ' · ' + target.id.slice(-8) : target.name;
        var button = item('button', 'ob-bot-drag__candidate', label);
        button.type = 'button';
        button.onclick = async function () {
          if (!options.context().chatEnabled || !chat.canMergeRooms(roomId, target.id)) {
            status.textContent = t('群聊状态已变化，请重新选择。', 'The chat has changed. Choose again.');
            return;
          }
          entries.inert = true;
          try {
            if (await chat.mergeRooms(roomId, target.id, 'merge-' + root.crypto.randomUUID())) dialog.close();
            else status.textContent = t('未完成合并，请查看群聊状态。', 'Merge incomplete. Check the group status.');
          } catch (error) { status.textContent = error.message; }
          finally { entries.inert = false; }
        };
        entries.append(button);
      }
      if (!candidates.length) status.textContent = t('当前没有可合并的其他群聊。', 'No other chats are available to merge.');
      dialog.append(header, note, entries, status);
      dialog.addEventListener('close', function () {
        dialog.remove();
        if (opener?.isConnected) opener.focus({preventScroll: true});
      }, {once: true});
      document.body.append(dialog);
      dialog.showModal();
    }
    root.OpenBotSidebarRoomMerge = {openPicker: openMergePicker};

    return {explainRejected: explainRejected, moveBeside: moveBeside, source: source, begin: begin, target: target, drop: drop, finish: finish, deferRender: deferRender};
  }
  root.OpenBotSidebarSort = {ordered: ordered, create: create};
})(window);
