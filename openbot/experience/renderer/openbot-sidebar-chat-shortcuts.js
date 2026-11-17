/* Personal sidebar navigation. Only references are persisted; the two services own the records. */
(function (root) {
  'use strict';

  function create(options) {
    const { bridge, tr, personal, openSpace, openRoom, closeSpaceMenu, notify } = options;
    const doc = root.document;
    const list = doc.getElementById('bot-list');
    const createButton = doc.getElementById('btn-sidebar-create');
    const picker = doc.getElementById('sidebar-workspace-picker');
    const select = picker.querySelector('select');
    const submit = picker.querySelector('[type=submit]');
    const pickerStatus = picker.querySelector('[role=status]');
    let rooms = [], spaces = [], roomRequest = 0, spaceRequest = 0;
    let accountKey = null, accountRevision = 0, navigationRevision = 0;
    let groupMemberReasons = new Map();
    let renderedHost = null, renderedLinks = null;
    let participantLimit = 8;
    const pendingDropKey = 'openbot.sidebar.pending-group-drop.v1';
    let pendingDrop = null, dropInFlight = false, checkingDrop = null, reportedUnknown = null;
    try {
      const stored = JSON.parse(root.localStorage.getItem(pendingDropKey));
      if (stored && typeof stored.requestId === 'string' && stored.requestId) {
        const validId = key => typeof stored[key] === 'string' && stored[key].length > 0;
        if (validId('sourceRoomId') && validId('targetRoomId') && stored.sourceRoomId !== stored.targetRoomId) {
          pendingDrop = {sourceRoomId:stored.sourceRoomId,targetRoomId:stored.targetRoomId,requestId:stored.requestId};
        } else if (validId('sourceBotId') && validId('meetingId') !== validId('targetBotId')) {
          pendingDrop = {sourceBotId:stored.sourceBotId,requestId:stored.requestId,
            ...(stored.meetingId ? {meetingId:stored.meetingId} : {targetBotId:stored.targetBotId})};
        }
      }
    } catch (_) {}
    function rosterSignature() {
      const bots = options.getBots?.() || [];
      return JSON.stringify(bots.map(bot => [bot.id, !!bot.agent, bot.workspaceBinding != null, bot.nodeHostId || '',
        bot.executionLocation || '', bot.harness || '', bot.providerId || '', bot.model || '', bot.groupChatUnsupportedReason, bot.unsupportedReason || '']));
    }
    let rosterKey = rosterSignature();
    let workspaceDrag = null;
    const workspaceDragType = 'application/x-openbot-workspace-shortcut';

    function storedSpaces() {
      if (!accountKey) return [];
      try {
        const saved = JSON.parse(root.localStorage.getItem('openbot.sidebar.workspace-links.v1.' + accountKey));
        return Array.isArray(saved) ? saved.filter(id => typeof id === 'string') : [];
      } catch (_) { return []; }
    }

    function saveSpaces(ids) {
      if (!accountKey || !personal()) return false;
      try {
        root.localStorage.setItem('openbot.sidebar.workspace-links.v1.' + accountKey, JSON.stringify([...new Set(ids)]));
      } catch (_) {
        notify(tr('工作空间快捷方式未保存', 'Could not save workspace shortcuts'));
        return false;
      }
      render();
      return true;
    }

    function label(record, collection) {
      const twins = collection.filter(other => other.id !== record.id && other.name === record.name);
      if (!twins.length) return record.name;
      const suffix = record.id.slice(-6);
      return record.name + ' · ' + (twins.some(other => other.id.endsWith(suffix)) ? record.id : suffix);
    }

    function render() {
      const active = personal();
      const currentRoster = rosterSignature();
      if (currentRoster !== rosterKey) {
        rosterKey = currentRoster;
        groupMemberReasons.clear();
        refreshRooms();
      }
      for (const item of doc.querySelectorAll('[data-sidebar-personal]')) item.hidden = !active;
      if (!active && picker.open) picker.close();
      const host = doc.getElementById('sidebar-chat-shortcuts');
      if (!host) return;
      const query = doc.getElementById('sidebar-bot-searchbar').hidden ? '' : doc.getElementById('sidebar-bot-search').value.trim().toLocaleLowerCase();
      const pinned = storedSpaces();
      const visibleSpaces = spaces.filter(space => pinned.includes(space.id));
      const botsById = new Map((options.getBots?.() || []).map(bot => [bot.id, bot]));
      const hidden = new Set(options.getHiddenBotIds?.() || []);
      const org = options.readOrganization();
      const layout = root.OpenBotSidebarRoomLayout;
      const slots = new Map([...list.querySelectorAll('[data-sidebar-room-slot]')].map(slot => [slot.dataset.sidebarRoomSlot,slot]));
      function faces(room) {
        const members = [...new Set(room.members)];
        return { count: members.length, faces: members.slice(0, 4).map(id => {
          const bot = botsById.get(id);
          return bot && !hidden.has(id) ? {avatar:bot.avatar, color:bot.color, identity:options.getIdentity?.(id)} : null;
        }) };
      }
      function links(records) {
        return records.map(item => ({ id: item.id, caption: label(item, records), ...(item.members ? faces(item) : {}) }))
          .filter(item => !query || item.caption.toLocaleLowerCase().includes(query) ||
            item.count != null && layout.roomMatches({id:item.id,name:item.caption},org,query));
      }
      const roomEntries = active ? links(rooms) : [];
      const sections = [];
      if (active && org.collectRooms) sections.push({type:'room',heading:tr('群聊','Group chats'),icon:'chat',entries:roomEntries});
      else for (const [home] of slots) {
        sections.push({type:'room',home,heading:tr('群聊','Group chats'),icon:'chat',
          entries:roomEntries.filter(item => layout.roomHome(org,item.id) === home)});
      }
      if (active) sections.push({type:'space',heading:tr('工作空间','Workspaces'),icon:'folder',entries:links(visibleSpaces)});
      const removeLabel = tr('移除快捷方式','Remove shortcut');
      const signature = JSON.stringify([sections,org.roomHomes,removeLabel]);
      const noBots = list.querySelector('p.space-sidebar-empty');
      if (noBots) noBots.hidden = !!(query && sections.some(section => section.entries.length));
      if (host === renderedHost && signature === renderedLinks) return;
      const focused = list.contains(doc.activeElement) && doc.activeElement.dataset.recordId ? doc.activeElement.dataset : null;
      const fragment = doc.createDocumentFragment();
      for (const slot of slots.values()) slot.replaceChildren();
      for (const {entries,type,home,heading,icon} of sections) {
        if (!entries.length) continue;
        const group = home === undefined ? doc.createElement('section') : slots.get(home);
        if (home === undefined) {
          const title = doc.createElement('h3');
          title.className = 'bot-list-group-heading';
          title.textContent = heading;
          if (type === 'room') {
            title.dataset.sidebarCollectedHeading = '';
            const more = doc.createElement('button');
            more.className = 'bot-group-manage';
            more.type = 'button';
            more.dataset.sidebarCollectedMore = '';
            more.textContent = '⋯';
            more.setAttribute('aria-label',tr('群聊置顶选项','Pinned chat options'));
            more.setAttribute('aria-haspopup','menu');
            title.append(more);
          }
          group.append(title);
        }
        for (const item of entries) {
          const row = doc.createElement('div');
          row.className = 'sidebar-chat-row';
          if (type === 'room') {
            row.dataset.sidebarChatId = item.id;
            row.dataset.sidebarRoomHome = layout.roomHome(org,item.id);
          }
          const button = doc.createElement('button');
          button.type = 'button';
          button.className = 'sidebar-chat-link';
          button.dataset.shortcut = type;
          button.dataset.recordId = item.id;
          button.title = heading + ' · ' + item.caption;
          if (type === 'room' && item.count) {
            button.title += ' · ' + tr('{count} 位成员', '{count} members', {count:item.count});
            const stack = doc.createElement('span');
            stack.className = 'sidebar-room-avatars';
            stack.dataset.count = item.faces.length;
            stack.setAttribute('aria-hidden','true');
            for (const face of item.faces) {
              const disc = doc.createElement('span');
              disc.className = 'sidebar-room-face';
              disc.innerHTML = face ? root.OpenBotAvatars.markup(face.avatar, face.color, {size:'mini', identity:face.identity})
                : root.OpenBotAvatars.neutralMarkup;
              stack.append(disc);
            }
            if (item.count > item.faces.length) {
              const overflow = doc.createElement('span');
              overflow.className = 'sidebar-room-overflow';
              overflow.textContent = '…';
              stack.append(overflow);
            }
            button.append(stack);
          } else button.innerHTML = root.OpenBotIcons.svg(icon, true);
          button.setAttribute('aria-label', button.title);
          const caption = doc.createElement('span');
          caption.className = 'sidebar-shortcut-caption';
          caption.textContent = item.caption;
          button.append(caption);
          row.append(button);
          if (type === 'room') {
            const more = doc.createElement('button');
            more.type = 'button';
            more.className = 'sidebar-room-more';
            more.dataset.recordId = item.id;
            more.textContent = '⋯';
            more.title = tr('群聊操作','Chat actions') + ' · ' + item.caption;
            more.setAttribute('aria-label',more.title);
            more.setAttribute('aria-haspopup','menu');
            more.setAttribute('aria-expanded','false');
            row.append(more);
          }
          if (type === 'space') {
            const remove = doc.createElement('button');
            remove.type = 'button';
            remove.className = 'sidebar-shortcut-remove';
            remove.dataset.shortcut = 'remove';
            remove.dataset.recordId = item.id;
            remove.setAttribute('aria-label', removeLabel + ' · ' + item.caption);
            remove.title = remove.getAttribute('aria-label');
            remove.innerHTML = root.OpenBotIcons.svg('minus', true);
            row.append(remove);
          }
          group.append(row);
        }
        if (home === undefined) fragment.append(group);
      }
      // Background refreshes should preserve an existing focused action.
      host.replaceChildren(fragment);
      renderedHost = host;
      renderedLinks = signature;
      if (focused) {
        const next = [...list.querySelectorAll('button')].find(button =>
          button.dataset.recordId === focused.recordId && button.dataset.shortcut === focused.shortcut);
        (next || createButton).focus({ preventScroll: true });
      }
    }

    async function refreshRooms() {
      const ticket = ++roomRequest;
      try {
        const result = await bridge.meetingState();
        if (ticket !== roomRequest) return;
        groupMemberReasons = new Map((result?.bots || []).map(bot => [bot.id, bot.groupChatUnsupportedReason ?? bot.unsupportedReason ?? '']));
        participantLimit = result?.limits?.groupParticipants || result?.limits?.participants || 8;
        const next = new Map();
        for (const item of Array.isArray(result?.groupChats) ? result.groupChats : []) {
          if (!item || typeof item.id !== 'string' || !item.id || typeof item.title !== 'string' ||
              item.hidden === true || item.accessible === false) continue;
          next.set(item.id,{id:item.id,name:item.title,members:Array.isArray(item.participantBotIds) ? item.participantBotIds : [],busy:!!item.activeRun});
        }
        const previousLayout = JSON.stringify(rooms.map(room => [room.id,room.name]));
        rooms = [...next.values()];
        if (previousLayout !== JSON.stringify(rooms.map(room => [room.id,room.name]))) {
          options.refreshLayout();
          return;
        }
      } catch (_) {
        if (ticket !== roomRequest) return;
        // Keep known links when storage is temporarily unavailable.
        groupMemberReasons.clear();
      }
      render();
    }

    function memberReason(id) {
      if (options.getHiddenBotIds?.().includes(id)) return tr('当前范围不允许此成员加入群聊。', 'This member is outside the current scope.');
      if (!groupMemberReasons.has(id)) return tr('暂时无法确认成员资格，请刷新群聊后重试。', 'Membership is unavailable. Refresh the chat and try again.');
      return groupMemberReasons.get(id);
    }

    function dropReason(kind, sourceId, targetId) {
      if (!personal()) return tr('请在个人侧栏中操作群聊。', 'Open the personal sidebar to manage chats.');
      if (kind === 'merge') {
        if (sourceId === targetId) return tr('请选择另一个 Bot 建群。', 'Choose another Bot to create a chat.');
        return memberReason(sourceId) || memberReason(targetId);
      }
      const target = rooms.find(room => room.id === targetId);
      const source = kind === 'merge-rooms' ? rooms.find(room => room.id === sourceId) : null;
      if (!target || (kind === 'merge-rooms' && !source)) return tr('目标群聊已不可用。', 'The chat is no longer available.');
      if (source && source.id === target.id) return tr('请选择另一个群聊合并。', 'Choose a different chat to merge.');
      if (!source && target.members.includes(sourceId)) return tr('这个 Bot 已在群聊中。', 'This Bot is already in the chat.');
      if (target.busy || source?.busy) return tr('群聊正在回复，结束后再试。', 'Wait for the current chat reply to finish.');
      if (target.members.length < 2 || (source && source.members.length < 2)) return tr('群聊成员资料不完整，请刷新后重试。', 'Refresh the chat to update its members.');
      const union = new Set([...target.members, ...(source ? source.members : [sourceId])]);
      if (union.size > participantLimit) return tr('群聊最多可容纳 {count} 个 Bot。', 'A chat can have up to {count} Bots.', {count: participantLimit});
      for (const id of union) {
        const reason = memberReason(id);
        if (reason) return reason;
      }
      return '';
    }

    const canMerge = (source,target) => !dropReason('merge',source,target);
    const canAdd = (source,target) => !dropReason('add',source,target);
    const canMergeRooms = (source,target) => !dropReason('merge-rooms',source,target);

    function moveRoom(id,home) {
      if (!personal() || !rooms.some(room => room.id === id)) return false;
      return options.saveHome(id,home);
    }
    function saveCreatedHome(input,result) {
      if (result?.outcome === 'absent' || !result?.meetingId || !personal() || !input.targetRoomId && !input.targetBotId) return;
      const org = options.readOrganization();
      if (root.OpenBotSidebarRoomLayout.roomHome(org,result.meetingId)) return;
      const home = input.targetRoomId ? root.OpenBotSidebarRoomLayout.roomHome(org,input.targetRoomId) :
        org.groups.find(group => group.botIds.includes(input.targetBotId))?.id;
      if (home && !options.saveHome(result.meetingId,home)) notify(tr('群聊已创建，可在侧栏调整归属。','Chat created. You can move it from the sidebar.'));
    }

    function forgetDrop() {
      pendingDrop = null;
      reportedUnknown = null;
      try { root.localStorage.removeItem(pendingDropKey); } catch (_) {}
    }

    function confirmed(input, result) {
      const names = { title: result.title, name: result.memberName };
      if (input.targetRoomId) return tr('已合并为新群聊「{title}」','Merged into new chat “{title}”',names);
      const message = input.targetBotId ? tr('已创建「{title}」', 'Created “{title}”', names)
        : tr('已将 {name} 加入「{title}」', 'Added {name} to “{title}”', names);
      const remote = [input.sourceBotId, input.targetBotId].some(id => {
        const signal = id && options.getRemoteSignal?.(id);
        return signal && signal.state !== 'online';
      });
      return remote ? message + tr('。远端 Bot 连接节点后即可发言。', '. The remote Bot can reply once its node is connected.') : message;
    }

    function reportUnknown(input) {
      if (reportedUnknown === input.requestId) return;
      reportedUnknown = input.requestId;
      notify(tr('群聊变更结果待核对，重开后会自动检查。', 'The group change is unconfirmed. It will be checked when you reopen.'));
    }

    function confirmedMessage() {
      return tr('已核对，上次群聊变更已保存。', 'Checked the previous group change. It was saved.');
    }

    function requestDrop(input) {
      return input.sourceRoomId ? bridge.meetingGroupMerge(input) : bridge.meetingGroupDrop(input);
    }
    async function verifyDrop(input) {
      try { return await requestDrop({ ...input, verifyOnly: true }); }
      catch (_) { return { outcome: 'unknown' }; }
    }

    async function recoverDrop() {
      if (!pendingDrop || dropInFlight || !personal()) return;
      if (checkingDrop) return checkingDrop;
      const input = pendingDrop;
      checkingDrop = (async () => {
        const result = await verifyDrop(input);
        if (pendingDrop !== input) return;
        if (result?.meetingId || ['confirmed', 'absent'].includes(result?.outcome)) {
          saveCreatedHome(input,result);
          forgetDrop();
          refreshRooms();
          if (personal()) notify(result.outcome === 'absent'
            ? tr('已核对，上次群聊变更未保存。', 'Checked the previous group change. It was not saved.') : confirmedMessage());
        } else if (personal()) reportUnknown(input);
      })().finally(() => { checkingDrop = null; });
      return checkingDrop;
    }

    async function drop(input, allowed) {
      if (dropInFlight) { notify(tr('正在保存群聊变更，请稍候。','A chat change is being saved.')); return false; }
      if (!allowed || !input.requestId) return false;
      if (pendingDrop) { await recoverDrop(); return false; }
      const intent = navigationRevision;
      // Save the gesture before invoking the host. A disconnect or renderer
      // restart can only verify this ID; it never replays a write.
      try { root.localStorage.setItem(pendingDropKey, JSON.stringify(input)); }
      catch (_) {
        notify(tr('无法保存群聊请求，请稍后重试。', 'Could not save the group request. Please try again.'));
        return false;
      }
      pendingDrop = input;
      dropInFlight = true;
      let result, failure;
      try {
        try { result = await requestDrop(input); }
        catch (error) { failure = error.message; }
        if (result?.outcome === 'unknown' || (!result?.meetingId && result?.outcome !== 'rejected')) {
          const receipt = await verifyDrop(input);
          if (receipt?.meetingId || ['confirmed', 'absent'].includes(receipt?.outcome)) result = receipt;
          else result = { outcome: 'unknown' };
        }
        if (result?.outcome === 'unknown') {
          if (intent === navigationRevision && personal()) reportUnknown(input);
          refreshRooms();
          return false;
        }
        saveCreatedHome(input,result);
        forgetDrop();
        const saved = !!result?.meetingId || result?.outcome === 'confirmed';
        if (intent === navigationRevision && personal()) {
          if (result?.outcome === 'confirmed') notify(confirmedMessage());
          else if (result?.meetingId) {
            notify(result.duplicate && !failure && input.meetingId
              ? tr('{name} 已在「{title}」中', '{name} is already in “{title}”', { name: result.memberName, title: result.title })
              : confirmed(input, result));
          } else notify(result?.message || failure || tr('未能更新群聊', 'Could not update the group chat'));
        }
        if (saved) refreshRooms();
        return saved;
      } finally { dropInFlight = false; }
    }

    function showOptions() {
      if (!picker.open) return;
      const current = select.value;
      const pinned = storedSpaces();
      const available = spaces.filter(space => !pinned.includes(space.id));
      select.replaceChildren(...available.map(space => new Option(label(space, spaces), space.id)));
      if (available.some(space => space.id === current)) select.value = current;
      submit.disabled = select.disabled = !available.length;
      pickerStatus.textContent = available.length ? '' : tr('没有可添加的工作空间', 'No workspaces to add');
    }

    async function refreshSpaces() {
      const ticket = ++spaceRequest;
      try {
        const result = await bridge.orgWorkspaceState();
        if (ticket !== spaceRequest) return false;
        if (!result || result.ok === false || !Array.isArray(result.spaces)) throw new Error();
        spaces = result.spaces.filter(space => space && typeof space.id === 'string' && space.id && typeof space.name === 'string' &&
          !space.archivedAt && !space.archived && space.status !== 'archived' && space.accessible !== false);
        render();
        showOptions();
        return result;
      } catch (_) {
        if (ticket !== spaceRequest) return false;
        spaces = [];
        render();
        showOptions();
        if (picker.open) pickerStatus.textContent = tr('无法读取工作空间', 'Could not load workspaces');
        return false;
      }
    }

    function setAccount(status) {
      let key = null;
      if (status?.connected === false && typeof status.configured === 'boolean') key = 'local';
      if (status?.connected === true && typeof status.account?.id === 'string' && status.account.id) {
        key = 'account.' + status.account.id;
      }
      if (key === accountKey) return;
      accountKey = key;
      spaceRequest++;
      spaces = [];
      if (picker.open) picker.close();
      render();
      if (key && storedSpaces().length) refreshSpaces();
    }

    async function inspectAccount() {
      const revision = ++accountRevision;
      try {
        const result = await bridge.platformAccountAction({ action: 'status', input: {} });
        if (revision === accountRevision) setAccount(result?.ok ? result.status || result : null);
      } catch (_) { if (revision === accountRevision) setAccount(null); }
      return revision === accountRevision ? accountKey : null;
    }

    async function authorizedSpace(account, id, intent) {
      if (!account || !personal() || accountKey !== account) return null;
      const request = spaceRequest + 1;
      const snapshot = await refreshSpaces();
      if (!snapshot || intent !== navigationRevision || account !== accountKey) return null;
      const verified = await inspectAccount();
      return request === spaceRequest && verified === account && accountKey === account && intent === navigationRevision && personal() &&
        spaces.some(space => space.id === id) ? snapshot : null;
    }

    async function pinSpace(account, id, intent, fromPicker) {
      const snapshot = await authorizedSpace(account, id, intent);
      if (!snapshot || (fromPicker && !picker.open)) return false;
      const saved = storedSpaces();
      return saved.includes(id) || saveSpaces(saved.concat(id));
    }

    async function openPicker() {
      const intent = ++navigationRevision;
      if (!personal() || picker.open) return;
      await inspectAccount();
      if (!personal() || picker.open || intent !== navigationRevision) return;
      if (!accountKey) {
        notify(tr('无法确认工作空间账号，请重试', 'Could not verify the workspace account. Try again.'));
        return;
      }
      select.replaceChildren();
      submit.disabled = select.disabled = true;
      pickerStatus.textContent = tr('正在读取工作空间…', 'Loading workspaces…');
      picker.showModal();
      refreshSpaces();
    }

    list.addEventListener('click', async event => {
      const button = event.target.closest('[data-shortcut]');
      if (!button || !personal()) return;
      const id = button.dataset.recordId, intent = ++navigationRevision;
      if (button.dataset.shortcut === 'room') {
        if (rooms.some(room => room.id === id)) openRoom({ meetingId: id, groupChat: true, opener: button });
      } else if (button.dataset.shortcut === 'remove') {
        const account = accountKey;
        if (account && await inspectAccount() === account && intent === navigationRevision && personal()) {
          saveSpaces(storedSpaces().filter(spaceId => spaceId !== id));
        }
      } else if (button.dataset.shortcut === 'space') {
        const account = accountKey;
        const snapshot = await authorizedSpace(account, id, intent);
        if (intent !== navigationRevision || account !== accountKey || !personal() || !storedSpaces().includes(id)) return;
        if (snapshot) openSpace(id, snapshot);
        else notify(tr('无法打开这个工作空间', 'Could not open this workspace'));
      }
    });
    picker.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      const account = accountKey, id = select.value;
      if (!id || !account || !personal()) return;
      submit.disabled = true;
      if (await pinSpace(account, id, ++navigationRevision, true)) picker.close();
    });
    // Other applications and files can supply text and even the MIME type.
    // Require a drag that started from our live, visible native space switcher.
    doc.addEventListener('dragstart', event => {
      workspaceDrag = null;
      const source = event.target.closest?.('#space-mode-menu:not(.hidden) [data-space-mode-select][draggable="true"]');
      if (!source || !personal() || !accountKey || !event.dataTransfer) return;
      const marker = root.crypto.randomUUID();
      workspaceDrag = { id: source.dataset.spaceModeSelect, account: accountKey, marker };
      event.dataTransfer.setData(workspaceDragType, marker);
      event.dataTransfer.effectAllowed = 'copy';
    });
    doc.addEventListener('dragend', () => { workspaceDrag = null; });
    const sidebar = doc.getElementById('sidebar');
    function acceptsDrag(event) {
      return workspaceDrag && workspaceDrag.account === accountKey && personal() &&
        Array.from(event.dataTransfer?.types || []).includes(workspaceDragType);
    }
    sidebar.addEventListener('dragover', event => {
      if (!acceptsDrag(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    });
    sidebar.addEventListener('drop', async event => {
      if (!acceptsDrag(event) || event.dataTransfer.getData(workspaceDragType) !== workspaceDrag.marker) return;
      event.preventDefault();
      const drag = workspaceDrag;
      workspaceDrag = null;
      const intent = ++navigationRevision;
      closeSpaceMenu();
      if (!await pinSpace(drag.account, drag.id, intent, false) && personal() && intent === navigationRevision) {
        notify(tr('无法添加这个工作空间', 'Could not add this workspace'));
      }
    });
    picker.querySelector('[data-dismiss]').addEventListener('click', () => picker.close());
    picker.addEventListener('close', () => { if (personal()) createButton.focus(); });
    function identityChanged(detail) { accountRevision++; setAccount(detail); }
    doc.addEventListener('openbot:platform-account-status', event => identityChanged(event.detail));
    doc.addEventListener('openbot:platform-account-closed', inspectAccount);
    if (bridge.onMeetingsChanged) bridge.onMeetingsChanged(refreshRooms);
    if (bridge.onOrgWorkspaceChanged) bridge.onOrgWorkspaceChanged(() => { if (accountKey && (picker.open || storedSpaces().length)) refreshSpaces(); });
    refreshRooms();
    root.addEventListener('focus', recoverDrop);
    recoverDrop();
    inspectAccount();
    return { render, openPicker, identityChanged, canMerge, canAdd, canDragToChat:id => !memberReason(id),
      getRooms: () => personal() ? rooms.map(room => ({...room,members:room.members.slice()})) : [],
      canMergeRooms,moveRoom,
      explainRejected(kind,source,target) {
        const reason = dropReason(kind,source,target);
        if (reason) notify(reason);
      },
      mergeRooms: (sourceRoomId,targetRoomId,requestId) => drop({sourceRoomId,targetRoomId,requestId},canMergeRooms(sourceRoomId,targetRoomId)),
      create: (sourceBotId, targetBotId, requestId) => drop({ sourceBotId, targetBotId, requestId }, canMerge(sourceBotId, targetBotId)),
      add: (sourceBotId, meetingId, requestId) => drop({ sourceBotId, meetingId, requestId }, canAdd(sourceBotId, meetingId)),
      cancelNavigation: () => { navigationRevision++; } };
  }

  root.OpenBotSidebarChatShortcuts = { create };
})(window);
