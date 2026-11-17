/* Personal sidebar metadata. Room records, histories and members stay in the meeting service. */
(function (root) {
  'use strict';

  function normalizeHomes(value, groups) {
    const valid = new Set(groups.map(group => group.id));
    return Object.fromEntries(Object.entries(value && typeof value === 'object' && !Array.isArray(value) ? value : {})
      .filter(([roomId, groupId]) => roomId && valid.has(groupId)));
  }

  function roomHome(org, roomId) {
    return Object.hasOwn(org.roomHomes || {}, roomId) ? org.roomHomes[roomId] : '';
  }

  function assign(org, roomId, groupId) {
    if (!roomId || (groupId && !org.groups.some(group => group.id === groupId))) return false;
    const homes = new Map(Object.entries(org.roomHomes || {}));
    if (groupId) homes.set(roomId, groupId);
    else homes.delete(roomId);
    org.roomHomes = Object.fromEntries(homes);
    return true;
  }

  function roomMatches(room, org, query) {
    if (!query || room.name.toLocaleLowerCase().includes(query)) return true;
    const home = roomHome(org, room.id);
    return org.groups.some(group => group.id === home && group.name.toLocaleLowerCase().includes(query));
  }

  // Preserve slots outside the current projection (hidden groups, other spaces, opposite pin state).
  function reorder(org, groupId, targetId, after, visibleIds) {
    const group = org.groups.find(item => item.id === groupId);
    if (!group || targetId === groupId) return false;
    const visible = new Set(visibleIds);
    const lane = org.groups.filter(item => visible.has(item.id) && !!item.pinned === !!group.pinned);
    if (!lane.includes(group) || !lane.some(item => item.id === targetId)) return false;
    const next = lane.filter(item => item !== group);
    next.splice(next.findIndex(item => item.id === targetId) + Number(after), 0, group);
    if (next.every((item,index) => lane[index] === item)) return false;
    const slots = new Set(lane);
    let cursor = 0;
    org.groups = org.groups.map(item => slots.has(item) ? next[cursor++] : item);
    return true;
  }

  function mount(options) {
    const {list, read, write, tr, personal, edit, createIn, changeRoomGroup, merge, canMerge} = options;
    const doc = list.ownerDocument;
    const menu = doc.createElement('div');
    menu.id = 'sidebar-layout-menu';
    menu.setAttribute('role','menu');
    menu.hidden = true;
    doc.body.append(menu);
    let trigger = null, drag = null, marked = null;

    function close(focus) {
      if (menu.hidden) return;
      menu.hidden = true;
      menu.replaceChildren();
      trigger?.setAttribute('aria-expanded','false');
      if (focus && trigger?.isConnected) trigger.focus({preventScroll:true});
      trigger = null;
    }

    function visibleGroups() {
      return [...list.querySelectorAll(':scope > .bot-list-group[data-group-id]')]
        .map(section => section.dataset.groupId).filter(Boolean);
    }

    function stateFor(groupId) {
      const org = read();
      const group = org.groups.find(item => item.id === groupId);
      if (!group) return null;
      const visible = visibleGroups();
      const lane = org.groups.filter(item => visible.includes(item.id) && !!item.pinned === !!group.pinned);
      const index = lane.findIndex(item => item.id === groupId);
      return {org, group, visible, lane, index};
    }

    function focusHeading(groupId) {
      [...list.querySelectorAll('[data-collapse-sidebar-group]')].find(button => button.dataset.collapseSidebarGroup === groupId)?.focus({preventScroll:true});
    }

    function step(groupId, direction) {
      const state = stateFor(groupId);
      const target = state?.lane[state.index + direction];
      if (!target || !reorder(state.org,groupId,target.id,direction > 0,state.visible)) return;
      if (write(state.org)) focusHeading(groupId);
    }

    function add(title, action, disabled = false) {
      const button = doc.createElement('button');
      button.type = 'button';
      button.setAttribute('role','menuitem');
      button.textContent = title;
      button.disabled = disabled;
      button.addEventListener('click', () => { close(true); action(); });
      menu.append(button);
    }

    function open(node, x, y) {
      close(false);
      const room = node.closest('[data-sidebar-chat-id]');
      const heading = node.closest('.bot-group-heading-row');
      const groupId = heading?.closest('[data-group-id]')?.dataset.groupId;
      if (room && personal()) {
        const id = room.dataset.sidebarChatId;
        trigger = room.querySelector('.sidebar-room-more') || room.querySelector('.sidebar-chat-link');
        add(tr('移到分组…','Move to group…'), () => changeRoomGroup(id));
        add(tr('合并群聊…','Merge chats…'), () => merge(id,room.querySelector('.sidebar-chat-link')), !canMerge(id));
      } else if (groupId) {
        const state = stateFor(groupId);
        if (!state || state.index < 0) return false;
        trigger = heading.querySelector('[data-edit-sidebar-group]');
        add(tr('重命名','Rename'), () => edit({group:groupId}));
        add(tr('上移','Move up'), () => step(groupId,-1), state.index === 0);
        add(tr('下移','Move down'), () => step(groupId,1), state.index === state.lane.length - 1);
        add(state.group.pinned ? tr('取消置顶分组','Unpin group') : tr('置顶分组','Pin group'), () => {
          const latest = stateFor(groupId);
          if (!latest) return;
          latest.group.pinned = !latest.group.pinned;
          if (write(latest.org)) focusHeading(groupId);
        });
        if (personal()) add(tr('在此分组建群聊','Start chat in this group'), () => createIn(groupId,heading.querySelector('button')));
        add(tr('解散分组…','Dissolve group…'), () => edit({group:groupId,confirmDissolve:true}));
      } else if (node.closest('[data-sidebar-collected-heading]') && personal()) {
        trigger = node.closest('[data-sidebar-collected-heading]').querySelector('button');
        add(tr('取消集中置顶','Stop pinning chats together'), () => {
          const org = read(); org.collectRooms = false; write(org);
        });
      } else return false;
      const rect = trigger.getBoundingClientRect();
      trigger.setAttribute('aria-expanded','true');
      menu.hidden = false;
      menu.setAttribute('aria-label',tr('侧栏操作','Sidebar actions'));
      const size = menu.getBoundingClientRect();
      menu.style.left = Math.max(4,Math.min(x ?? rect.left,root.innerWidth-size.width-4))+'px';
      menu.style.top = Math.max(4,Math.min(y ?? rect.bottom,root.innerHeight-size.height-4))+'px';
      menu.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
      return true;
    }

    const target = '[data-sidebar-chat-id],.bot-group-heading-row,[data-sidebar-collected-heading]';
    list.addEventListener('contextmenu', event => {
      if (event.target.closest(target) && open(event.target,event.clientX,event.clientY)) event.preventDefault();
    });
    list.addEventListener('click', event => {
      if (event.target.closest('.sidebar-room-more,[data-edit-sidebar-group],[data-sidebar-collected-more]')) open(event.target);
    });
    list.addEventListener('keydown', event => {
      if (event.key === 'ContextMenu' || event.shiftKey && event.key === 'F10') {
        if (event.target.closest(target) && open(event.target)) event.preventDefault();
        return;
      }
      const id = event.target.closest('.bot-group-heading-row')?.parentElement.dataset.groupId;
      if (id && event.altKey && ['ArrowUp','ArrowDown'].includes(event.key)) {
        event.preventDefault();
        step(id,event.key === 'ArrowUp' ? -1 : 1);
      }
    });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
      if (!['ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const buttons = [...menu.querySelectorAll('button:not(:disabled)')];
      const index = buttons.indexOf(doc.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length-1 :
        (index + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    });
    doc.addEventListener('pointerdown', e => { if (!menu.contains(e.target) && !e.target.closest('.sidebar-room-more,[data-edit-sidebar-group],[data-sidebar-collected-more]')) close(false); });
    doc.addEventListener('focusin', e => { if (!menu.contains(e.target) && e.target !== trigger) close(false); });
    root.addEventListener('blur', () => close(false));
    function clearMark() {
      if (marked) delete marked.dataset.groupDrop;
      marked = null;
    }
    function finish() {
      clearMark(); drag = null; delete list.dataset.movingGroup;
    }
    list.addEventListener('dragstart', e => {
      const heading = e.target.closest('[data-group-drag]');
      const id = heading?.dataset.groupDrag;
      if (!id || !e.dataTransfer) return;
      const state = stateFor(id);
      if (!state || state.lane.length < 2) { e.preventDefault(); return; }
      const marker = root.crypto.randomUUID();
      drag = {id, marker, scope:options.scope()};
      list.dataset.movingGroup='true';
      e.dataTransfer.setData('application/x-openbot-sidebar-group',marker);
      e.dataTransfer.effectAllowed='move';
    });
    function placement(e) {
      if (!drag || drag.scope !== options.scope()) return null;
      const section = e.target.closest('.bot-list-group[data-group-id]');
      const state = stateFor(drag.id);
      const id = section?.dataset.groupId;
      if (!id || id === drag.id || !state?.lane.some(group => group.id === id)) return null;
      const rect = section.getBoundingClientRect();
      return {section, state, id, after:e.clientY >= rect.top + rect.height/2};
    }
    list.addEventListener('dragover', e => {
      if (!drag) return;
      const place = placement(e); clearMark();
      if (!place) return;
      e.preventDefault(); e.dataTransfer.dropEffect='move';
      marked=place.section; marked.dataset.groupDrop=place.after?'after':'before';
    });
    list.addEventListener('dragleave', e => { if (drag && !list.contains(e.relatedTarget)) clearMark(); });
    list.addEventListener('drop', e => {
      if (!drag) return;
      const place = placement(e), {id,marker} = drag; finish();
      if (!place || e.dataTransfer.getData('application/x-openbot-sidebar-group') !== marker) return;
      e.preventDefault();
      if (reorder(place.state.org,id,place.id,place.after,place.state.visible) && write(place.state.org)) focusHeading(id);
    });
    doc.addEventListener('dragend',finish);
    return {close};
  }

  const api = {normalizeHomes,roomHome,assign,roomMatches,reorder,mount};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotSidebarRoomLayout = api;
})(typeof window === 'undefined' ? globalThis : window);
