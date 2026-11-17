(function (root) {
  'use strict';
  function tr(zh,en){return root.OpenBotI18n?root.OpenBotI18n.t(zh,en):zh;}
  // Compatibility for known system-owned unsupportedReason fields from workspace/meeting services.
  // Unknown and custom reasons remain source data; availability checks keep the original value.
  function reasonLabel(value){
    var copy=[
      ["该Bot的CLI/智能体会话尚未支持工作空间隔离，请选择API Bot。","This Bot’s CLI or agent session does not support space isolation yet. Choose an API Bot."],
      ["远端Bot尚未接通工作空间会话。","Remote Bots do not support space conversations yet."],
      ["会议暂不支持 CLI 或绑定智能体，请选择本机 API Bot。","Meetings do not support CLI or bound agents yet. Choose a local API Bot."],
      ["会议暂不支持远端或节点 Bot，请选择本机 API Bot。","Meetings do not support remote or node Bots yet. Choose a local API Bot."],
      ["会议不支持这个 Harness，请为 Bot 选择 DSH、Pi 或 legacy。","Meetings do not support this runtime. Choose DSH, Pi, or legacy for this Bot."]
    ];
    for(var i=0;i<copy.length;i++)if(value===copy[i][0])return tr(copy[i][0],copy[i][1]);
    return value;
  }
  function countLabel(value,zh,one,many){
    var english=typeof window==='object'&&window.OpenBotI18n&&window.OpenBotI18n.locale==='en';
    return english?new Intl.NumberFormat('en').format(Number(value))+' '+(Number(value)===1?one:(many||one+'s')):value+zh;
  }

  /*
   * The organization chart is a small view on top of the trusted organization
   * projection.  It deliberately owns no organization state and never turns
   * a relationship into a task or an execution status.  The workspace host
   * decides what opening a selected Bot means.
   */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var state = {
    host: null,
    options: {},
    snapshot: null,
    projection: null,
    projectionError: null,
    selectedId: '',
    collapsed: Object.create(null),
    scroll: null,
    canvas: null,
    edgeLayer: null,
    nodeLayer: null,
    detail: null,
    resizeObserver: null,
    resizeHandler: null,
    drawFrame: 0,
    groupEdgeMarkerSequence: 0
  };

  function text(value, fallback) {
    var result = value === undefined || value === null ? '' : String(value);
    return result || (fallback || '');
  }

  function el(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = String(value);
    return node;
  }

  function svg(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
    return node;
  }

  function safeColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : '#5b8cff';
  }

  function roleLabel(node, role) {
    var bot = null, bots = state.snapshot && Array.isArray(state.snapshot.bots) ? state.snapshot.bots : [];
    for (var i = 0; i < bots.length; i++) if (bots[i] && bots[i].id === (node && node.botId)) { bot = bots[i]; break; }
    bot = bot || node || {};
    if (typeof root.OpenBotRoleLabelFor === 'function') return root.OpenBotRoleLabelFor(bot, role);
    var api = root.OpenBotRoleLabels, language = root.OpenBotI18n && root.OpenBotI18n.locale === 'en' ? 'en' : 'zh';
    if (api && typeof api.resolveRoleLabel === 'function') return api.resolveRoleLabel(root.OpenBotRoleLabelState || {}, bot, role, language);
    return ({primary:tr('主 BOT','Memory BOT'),leader:tr('组长','Group lead'),member:tr('成员 BOT','Member BOT')})[role] || 'Bot';
  }

  function nodeRole(node) {
    if (!node) return 'Bot';
    if (node.kind === 'ceo') return roleLabel(node, 'primary');
    if (node.kind === 'leader') return node.isPrimary ? roleLabel(node, 'leader') + ' · ' + roleLabel(node, 'primary') : roleLabel(node, 'leader');
    if (node.kind === 'unassigned') return tr('未加入空间的 BOT',"BOT outside a space");
    return node.isPrimary ? roleLabel(node, 'member') + ' · ' + roleLabel(node, 'primary') : roleLabel(node, 'member');
  }

  function roleMarks(node, className) {
    var labels = [];
    if (node && node.isPrimary) labels.push({ kind:'primary', symbol:'★', title:roleLabel(node, 'primary') });
    if (node && node.kind === 'leader') labels.push({ kind:'space-lead', symbol:'◇', title:roleLabel(node, 'leader') });
    if (!labels.length) return null;
    var host = el('span', className || 'org-chart-avatar-role-marks');
    host.setAttribute('aria-hidden', 'true');
    labels.forEach(function (item) {
      var mark = el('span', 'org-chart-avatar-role-mark org-chart-avatar-role-mark-' + item.kind, item.symbol);
      mark.title = item.title;
      host.appendChild(mark);
    });
    return host;
  }

  function modelLine(node) {
    if (!node) return '';
    var parts = [];
    if (node.model) parts.push(node.model);
    if (node.harness) parts.push(node.harness);
    // unsupportedReason belongs to a scoped space entry. Do not present it as
    // a global Bot/offline status on the CEO or unassigned identity card.
    if (node.unsupportedReason && node.spaceId) parts.push(tr('空间入口暂不可用',"Space unavailable"));
    return parts.join(' · ');
  }

  function avatarMarkup(node, size) {
    if (!node || !root.OpenBotAvatars || typeof root.OpenBotAvatars.markup !== 'function') return '';
    return root.OpenBotAvatars.markup(node.avatar, safeColor(node.color), { size: size || 'mini' });
  }

  function avatar(node, size) {
    var holder = el('span', 'org-chart-avatar org-chart-avatar-' + (size || 'member'));
    holder.setAttribute('aria-hidden', 'true');
    var markup = avatarMarkup(node, size === 'ceo' ? 'header' : size === 'leader' ? 'list' : 'mini');
    if (markup) holder.innerHTML = markup;
    else {
      holder.textContent = Array.from(String(text(node && node.name, '')).trim())[0] || '';
      if (!holder.textContent || /^[?？]$/.test(holder.textContent)) holder.innerHTML = '<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>';
      holder.style.background = safeColor(node && node.color);
    }
    var marks = roleMarks(node);
    if (marks) holder.appendChild(marks);
    return holder;
  }

  function findNode(nodeId) {
    var projection = state.projection;
    if (!projection || !Array.isArray(projection.nodes)) return null;
    for (var i = 0; i < projection.nodes.length; i++) {
      if (projection.nodes[i].id === nodeId) return projection.nodes[i];
    }
    return null;
  }

  function findSpace(spaceId) {
    var projection = state.projection;
    if (!projection || !Array.isArray(projection.groups)) return null;
    for (var i = 0; i < projection.groups.length; i++) {
      if (projection.groups[i].spaceId === spaceId) return projection.groups[i];
    }
    return null;
  }

  function selectNode(node) {
    if (!node) return;
    state.selectedId = node.id;
    renderSelection();
  }

  function selectedNode() {
    return findNode(state.selectedId);
  }

  function isLinked(node) {
    var selected = selectedNode();
    return !!(selected && node && selected.id !== node.id && selected.botId && selected.botId === node.botId);
  }

  function makeNode(node, variant) {
    var button = el('button', 'org-chart-node org-chart-node-' + (variant || node.kind));
    button.type = 'button';
    button.dataset.nodeId = node.id;
    button.dataset.botId = node.botId || '';
    button.dataset.kind = node.kind || '';
    button.dataset.spaceId = node.spaceId || '';
    var selected = state.selectedId === node.id;
    var linked = isLinked(node);
    button.setAttribute('aria-label', tr('选择 ',"Select ") + text(node.name, 'Bot') + tr('，',', ') + nodeRole(node) + (linked ? tr('，同一 Bot 已在其他空间出现',"; this Bot also appears in other spaces") : ''));
    button.setAttribute('aria-pressed', String(selected));
    if (selected) button.classList.add('is-selected');
    if (linked) { button.classList.add('is-linked'); button.dataset.linkedBot = 'true'; }
    button.appendChild(avatar(node, variant || node.kind));
    var copy = el('span', 'org-chart-node-copy');
    copy.appendChild(el('strong', 'org-chart-node-name', text(node.name, 'Bot')));
    var nodeRoleText = nodeRole(node);
    var nodeRoleElement = el('span', 'org-chart-node-role', nodeRoleText);
    nodeRoleElement.title = nodeRoleText;
    copy.appendChild(nodeRoleElement);
    var meta = modelLine(node);
    if (meta) copy.appendChild(el('span', 'org-chart-node-meta', meta));
    if (node.sharedSpaceCount > 1) copy.appendChild(el('span', 'org-chart-node-shared', tr('跨 ',"Across ") + countLabel(node.sharedSpaceCount,' 个空间','space')));
    button.appendChild(copy);
    button.addEventListener('click', function () { selectNode(node); });
    return button;
  }

  function groupHeader(group) {
    var header = el('header', 'org-chart-group-header');
    var title = el('div', 'org-chart-group-title-wrap');
    title.appendChild(el('h3', 'org-chart-group-title', group.name));
    var count = group.memberCount === 1 ? tr('1 个 Bot',"1 Bot") : String(group.memberCount) + tr(' 个 Bot'," Bots");
    title.appendChild(el('span', 'org-chart-group-meta', count + (group.isPrimaryLed ? ' · ' + roleLabel(group.leader, 'primary') + tr('兼任', ' also leads') : '')));
    if (group.invalidMembership) title.appendChild(el('span', 'org-chart-group-warning', tr('成员关系待修复',"Membership needs repair")));
    header.appendChild(title);
    var collapse = el('button', 'org-chart-collapse', state.collapsed[group.spaceId] ? tr('展开',"Expand") : tr('收起',"Collapse"));
    collapse.type = 'button';
    collapse.dataset.collapseSpaceId = group.spaceId;
    collapse.setAttribute('aria-expanded', String(!state.collapsed[group.spaceId]));
    collapse.setAttribute('aria-label', (state.collapsed[group.spaceId] ? tr('展开',"Expand") : tr('收起',"Collapse")) + tr('空间 ',"Space ") + group.name);
    collapse.addEventListener('click', function (event) {
      event.stopPropagation();
      state.collapsed[group.spaceId] = !state.collapsed[group.spaceId];
      renderChartBody();
    });
    header.appendChild(collapse);
    return header;
  }

  function groupLane(group) {
    var lane = el('section', 'org-chart-group' + (state.projection && state.projection.ceo ? ' has-ceo' : ''));
    lane.dataset.spaceId = group.spaceId;
    lane.setAttribute('aria-label', group.name + tr('组织关系',"Organization"));
    var groupEdges = svg('svg', { 'class': 'org-chart-group-edges', role: 'presentation', focusable: 'false',
      'data-arrow-id': 'org-chart-arrow-group-' + state.groupEdgeMarkerSequence++ });
    lane.appendChild(groupEdges);
    lane.appendChild(groupHeader(group));
    var leaderBlock = el('div', 'org-chart-leader-block');
    leaderBlock.appendChild(el('span', 'org-chart-section-label', roleLabel(group.leader, 'leader')));
    leaderBlock.appendChild(makeNode(group.leader, 'leader'));
    lane.appendChild(leaderBlock);
    if (!state.collapsed[group.spaceId]) {
      var members = el('div', 'org-chart-members' + (group.members.length ? ' has-members' : ''));
      members.appendChild(el('span', 'org-chart-section-label', roleLabel(group.members[0] || group.leader, 'member')));
      var memberGrid = el('div', 'org-chart-member-grid');
      if (!group.members.length) memberGrid.appendChild(el('span', 'org-chart-no-members', tr('暂无其他成员',"No other members")));
      group.members.forEach(function (member) { memberGrid.appendChild(makeNode(member, 'member')); });
      members.appendChild(memberGrid);
      lane.appendChild(members);
    }
    return lane;
  }

  function unassignedLane(nodes) {
    if (!nodes || !nodes.length) return null;
    var lane = el('section', 'org-chart-group org-chart-unassigned');
    lane.dataset.spaceId = '';
    var header = el('header', 'org-chart-group-header');
    var title = el('div', 'org-chart-group-title-wrap');
    title.appendChild(el('h3', 'org-chart-group-title', tr('未加入空间的 BOT',"BOTs outside a space")));
    title.appendChild(el('span', 'org-chart-group-meta', countLabel(nodes.length,' 个 BOT 尚未加入空间','BOT has not joined a space','BOTs have not joined a space')));
    header.appendChild(title);
    lane.appendChild(header);
    var grid = el('div', 'org-chart-unassigned-grid');
    nodes.forEach(function (node) { grid.appendChild(makeNode(node, 'unassigned')); });
    lane.appendChild(grid);
    return lane;
  }

  function detailFor(node) {
    var detail = el('section', 'org-chart-detail');
    detail.id = 'org-chart-node-detail';
    detail.setAttribute('aria-live', 'polite');
    detail.setAttribute('aria-label', tr('组织节点详情',"Organization node details"));
    if (!node) {
      detail.appendChild(el('span', 'org-chart-detail-empty', tr('选择 ', 'Select ') + roleLabel({botId:state.projection && state.projection.primaryBotId}, 'primary') + '、' + roleLabel(null, 'leader') + ' ' + tr('或 ', 'or ') + roleLabel(null, 'member') + tr(' 查看详情。', ' to view details.')));
      return detail;
    }
    var copy = el('div', 'org-chart-detail-copy');
    copy.appendChild(el('strong', 'org-chart-detail-name', node.name));
    var detailRoleText = nodeRole(node);
    var detailRoleElement = el('span', 'org-chart-detail-role', detailRoleText);
    detailRoleElement.title = detailRoleText;
    copy.appendChild(detailRoleElement);
    var meta = modelLine(node);
    if (meta) copy.appendChild(el('span', 'org-chart-detail-meta', meta));
    if (node.sharedSpaceCount > 1) copy.appendChild(el('span', 'org-chart-detail-meta', tr('已加入 ',"Joined ") + countLabel(node.sharedSpaceCount,' 个空间','space')));
    if (node.spaceId && node.unsupportedReason) copy.appendChild(el('span', 'org-chart-detail-warning', reasonLabel(node.unsupportedReason)));
    detail.appendChild(avatar(node, node.kind === 'ceo' ? 'ceo' : node.kind === 'leader' ? 'leader' : 'member'));
    detail.appendChild(copy);
    var actions = el('div', 'org-chart-detail-actions');
    var open = el('button', 'org-chart-detail-open');
    open.type = 'button';
    open.id = 'org-chart-enter';
    if (node.spaceId) {
      open.textContent = node.kind === 'member' ? tr('与 TA 私聊',"Direct chat") : tr('进入空间群聊',"Open space group chat");
      open.setAttribute('aria-label', open.textContent + tr('：',': ') + text(node.name, 'Bot'));
      open.dataset.nodeAction = 'open-space';
      open.addEventListener('click', function () {
        if (typeof state.options.onOpenSpace === 'function') state.options.onOpenSpace({ spaceId: node.spaceId, botId: node.botId, mode: node.kind === 'member' ? 'private' : 'group' });
      });
    } else {
      open.textContent = tr('打开对话',"Open chat");
      open.setAttribute('aria-label', tr('打开对话：',"Open chat: ") + text(node.name, 'Bot'));
      open.dataset.nodeAction = 'open-bot';
      open.addEventListener('click', function () {
        if (typeof state.options.onOpenBot === 'function') state.options.onOpenBot(node.botId);
      });
    }
    // A scoped space entry may be unavailable while the Bot itself remains
    // available through the ordinary global conversation.
    if (node.spaceId && node.unsupportedReason) {
      open.disabled = true;
      open.title = reasonLabel(node.unsupportedReason);
    }
    actions.appendChild(open);
    if (node.botId && typeof state.options.onOpenDashboard === 'function') {
      var dashboard = el('button', 'org-chart-detail-data', tr('查看数据',"View data"));
      dashboard.type = 'button';
      dashboard.id = 'org-chart-view-data';
      dashboard.dataset.nodeAction = 'open-dashboard';
      dashboard.setAttribute('aria-label', tr('查看数据：',"View data: ") + text(node.name, 'Bot'));
      dashboard.addEventListener('click', function () {
        var scope = node.kind === 'ceo' ? 'ceo' : node.kind === 'leader' ? 'leader' : 'bot';
        state.options.onOpenDashboard({ view: scope, botId: node.botId, spaceId: node.spaceId || '' });
      });
      actions.appendChild(dashboard);
    }
    detail.appendChild(actions);
    return detail;
  }

  function renderSelection() {
    if (!state.detail) return;
    state.detail.replaceWith(detailFor(findNode(state.selectedId)));
    state.detail = document.getElementById('org-chart-node-detail');
    if (state.nodeLayer) {
      Array.prototype.forEach.call(state.nodeLayer.querySelectorAll('[data-node-id]'), function (node) {
        var selected = node.dataset.nodeId === state.selectedId;
        var linked = !selected && !!(selectedNode() && node.dataset.botId && selectedNode().botId === node.dataset.botId);
        node.classList.toggle('is-selected', selected);
        node.classList.toggle('is-linked', linked);
        if (linked) node.dataset.linkedBot = 'true'; else node.removeAttribute('data-linked-bot');
        node.setAttribute('aria-pressed', String(selected));
      });
    }
  }

  function cancelScheduledEdges() {
    if (!state.drawFrame) return;
    if (root.cancelAnimationFrame) root.cancelAnimationFrame(state.drawFrame);
    else if (root.clearTimeout) root.clearTimeout(state.drawFrame);
    state.drawFrame = 0;
  }

  function scheduleEdges() {
    if (state.drawFrame) return;
    var raf = root.requestAnimationFrame || function (callback) { return root.setTimeout(callback, 0); };
    state.drawFrame = raf(function () { state.drawFrame = 0; drawEdges(); });
  }

  function groupElement(spaceId) {
    if (!state.nodeLayer) return null;
    var groups = state.nodeLayer.querySelectorAll('.org-chart-group[data-space-id]');
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].dataset.spaceId === String(spaceId || '')) return groups[i];
    }
    return null;
  }

  function addArrowMarker() {
    var defs = svg('defs', {});
    var marker = svg('marker', { id: 'org-chart-arrow', markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5,
      orient: 'auto', markerUnits: 'userSpaceOnUse', viewBox: '0 0 7 7' });
    marker.appendChild(svg('path', { d: 'M 1 1 L 6 3.5 L 1 6', fill: 'none', stroke: 'context-stroke',
      'stroke-width': 1.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    defs.appendChild(marker);
    state.edgeLayer.appendChild(defs);
  }

  function addLocalArrowMarker(layer) {
    var defs = svg('defs', {});
    var marker = svg('marker', { id: layer.dataset.arrowId, markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5,
      orient: 'auto', markerUnits: 'userSpaceOnUse', viewBox: '0 0 7 7' });
    marker.appendChild(svg('path', { d: 'M 1 1 L 6 3.5 L 1 6', fill: 'none', stroke: 'context-stroke',
      'stroke-width': 1.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    defs.appendChild(marker);
    layer.appendChild(defs);
  }

  function curvedPath(sourceX, sourceY, targetX, targetY) {
    var dx = targetX - sourceX, dy = Math.max(0, targetY - sourceY);
    if (dy === 0 && Math.abs(dx) > 0) {
      var side = dx < 0 ? -1 : 1;
      var handle = Math.min(26, Math.max(2, Math.abs(dx) * 0.34));
      var bend = Math.min(6, Math.max(1, Math.abs(dx) * 0.045));
      return 'M ' + sourceX + ' ' + sourceY + ' C ' + (sourceX + side * handle) + ' ' + (sourceY + bend) + ', ' +
        (targetX - side * handle) + ' ' + (targetY + bend) + ', ' + targetX + ' ' + targetY;
    }
    var reach = Math.min(42, Math.max(8, Math.abs(dx) * 0.18));
    var vertical = Math.min(74, Math.max(8, dy * 0.42));
    var direction = dx < 0 ? -1 : 1;
    var firstX = sourceX + (dx === 0 ? 3 : direction * reach);
    var secondX = targetX - (dx === 0 ? 3 : direction * reach);
    var firstY = sourceY + Math.min(vertical, Math.max(7, dy * 0.5));
    var secondY = targetY - Math.min(vertical, Math.max(7, dy * 0.5));
    // Keep very short local stems gentle instead of allowing the handles to
    // reverse direction when a responsive layout nearly touches two nodes.
    if (dy < 16) { firstY = sourceY + dy / 2; secondY = firstY; }
    return 'M ' + sourceX + ' ' + sourceY + ' C ' + firstX + ' ' + firstY + ', ' + secondX + ' ' + secondY + ', ' + targetX + ' ' + targetY;
  }

  function membershipBranchPath(sourceX, sourceY, targetX, targetY) {
    var dx = targetX - sourceX;
    if (Math.abs(targetY - sourceY) > 0.5 || Math.abs(dx) < 0.5) return curvedPath(sourceX, sourceY, targetX, targetY);
    var direction = dx < 0 ? -1 : 1;
    var span = Math.abs(dx);
    var handle = Math.min(24, Math.max(6, span * 0.32));
    // A few pixels of lift keep the short connector readable as a curve at
    // compact widths without turning it into a decorative wave.
    var bend = Math.min(5, Math.max(3.6, span * 0.18));
    return 'M ' + sourceX + ' ' + sourceY + ' C ' + (sourceX + direction * handle) + ' ' + (sourceY + bend) + ', ' +
      (targetX - direction * handle) + ' ' + (targetY + bend) + ', ' + targetX + ' ' + targetY;
  }

  function drawMembershipGroup(spaceId, edges) {
    var group = groupElement(spaceId), layer = group && group.querySelector('.org-chart-group-edges');
    if (!group || !layer) return;
    var bounds = group.getBoundingClientRect();
    var pairs = edges.map(function (edge) { return { edge:edge, source:findNodeElement(edge.source), target:findNodeElement(edge.target) }; })
      .filter(function (pair) { return pair.source && pair.target; });
    if (!pairs.length) return;

    function addMembershipPath(pair, startX, startY, endX, endY) {
      var path = svg('path', { d:membershipBranchPath(startX,startY,endX,endY),
        'class':'org-chart-edge org-chart-edge-membership', 'data-edge-id':pair.edge.id,
        'data-edge-kind':'membership', 'data-source-node-id':pair.edge.source, 'data-target-node-id':pair.edge.target });
      path.setAttribute('aria-hidden','true');
      path.setAttribute('marker-end','url(#' + layer.dataset.arrowId + ')');
      layer.appendChild(path);
    }

    // Every member count uses the same tree routing: one quiet vertical trunk
    // in each grid gutter and short curved branches into adjacent card edges.
    // This keeps even a two-member group from drawing through the section
    // label and visually breaking under its opaque background.
    var memberNodes = pairs.map(function (pair) { return pair.target; });
    var membersSection = group.querySelector('.org-chart-members.has-members');
    function measureMemberColumns() {
      var measuredRects = memberNodes.map(function (node) { return { node:node, rect:node.getBoundingClientRect() }; });
      var measuredColumns = [];
      measuredRects.slice().sort(function (a,b) { return (a.rect.left+a.rect.width/2)-(b.rect.left+b.rect.width/2); }).forEach(function (item) {
        var center = item.rect.left + item.rect.width / 2;
        var column = measuredColumns.filter(function (candidate) { return Math.abs(candidate.center-center) < 8; })[0];
        if (!column) { column = { center:center, left:item.rect.left, right:item.rect.right }; measuredColumns.push(column); }
        else { column.center = (column.center + center) / 2; column.left = Math.min(column.left,item.rect.left); column.right = Math.max(column.right,item.rect.right); }
      });
      measuredColumns.sort(function (a,b) { return a.center-b.center; });
      return { rects:measuredRects, columns:measuredColumns };
    }
    var measured = measureMemberColumns();
    if (membersSection) membersSection.classList.toggle('has-single-member-column', measured.columns.length === 1);
    measured = measureMemberColumns();
    var rects = measured.rects, columns = measured.columns;

    var leaders = pairs[0].source.getBoundingClientRect();
    var sourceX = leaders.left - bounds.left + leaders.width / 2;
    var sourceY = leaders.bottom - bounds.top;
    var rowTop = Math.min.apply(null, rects.map(function (item) { return item.rect.top; })) - bounds.top;
    var rowCenters = rects.map(function (item) { return item.rect.top + item.rect.height / 2 - bounds.top; });
    var lastRowCenter = Math.max.apply(null, rowCenters);
    var rails = [];
    if (columns.length === 1) {
      // The compact single-column layout reserves a right gutter so that each
      // member branch remains visible and stays clear of the left section label.
      rails.push(columns[0].right - bounds.left + 22);
    } else {
      for (var i = 0; i < columns.length - 1; i++) rails.push((columns[i].right + columns[i + 1].left) / 2 - bounds.left);
    }
    var railTops = rails.map(function (railX) {
      var topY = Math.max(sourceY + 2, rowTop - 8);
      var rootPath = svg('path', { d:curvedPath(sourceX,sourceY,railX,topY),
        'class':'org-chart-edge org-chart-edge-membership-trunk org-chart-edge-membership-trunk-root',
        'data-edge-kind':'membership-trunk' });
      rootPath.setAttribute('aria-hidden','true');
      layer.appendChild(rootPath);
      var trunk = svg('path', { d:curvedPath(railX,topY,railX,lastRowCenter),
        'class':'org-chart-edge org-chart-edge-membership-trunk', 'data-edge-kind':'membership-trunk' });
      trunk.setAttribute('aria-hidden','true');
      layer.appendChild(trunk);
      return railX;
    });

    pairs.forEach(function (pair) {
      var target = pair.target.getBoundingClientRect();
      var center = target.left - bounds.left + target.width / 2;
      var rail = railTops.reduce(function (best,candidate) {
        return Math.abs(candidate-center) < Math.abs(best-center) ? candidate : best;
      }, railTops[0]);
      var targetCenterY = target.top - bounds.top + target.height / 2;
      var towardLeft = rail < center;
      var endX = towardLeft ? target.left - bounds.left - 4 : target.right - bounds.left + 4;
      addMembershipPath(pair,rail,targetCenterY,endX,targetCenterY);
    });
  }

  function drawEdges() {
    if (!state.canvas || !state.edgeLayer || !state.projection) return;
    var canvasRect = state.canvas.getBoundingClientRect();
    var width = Math.max(state.canvas.clientWidth, state.canvas.scrollWidth);
    var height = Math.max(state.canvas.clientHeight, state.canvas.scrollHeight);
    state.edgeLayer.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    state.edgeLayer.setAttribute('width', width);
    state.edgeLayer.setAttribute('height', height);
    while (state.edgeLayer.firstChild) state.edgeLayer.removeChild(state.edgeLayer.firstChild);
    addArrowMarker();
    var groupLayers = state.nodeLayer.querySelectorAll('.org-chart-group-edges');
    Array.prototype.forEach.call(groupLayers, function (layer) {
      var group = layer.parentElement, rect = group.getBoundingClientRect();
      var groupWidth = Math.max(1, rect.width), groupHeight = Math.max(1, rect.height);
      layer.setAttribute('viewBox', '0 0 ' + groupWidth + ' ' + groupHeight);
      layer.setAttribute('width', groupWidth);
      layer.setAttribute('height', groupHeight);
      while (layer.firstChild) layer.removeChild(layer.firstChild);
      addLocalArrowMarker(layer);
      var header = group.querySelector('.org-chart-group-header');
      var leader = group.querySelector('.org-chart-node-leader');
      if (header && leader && group.classList.contains('has-ceo')) {
        var headerRect = header.getBoundingClientRect(), leaderRect = leader.getBoundingClientRect();
        var startX = groupWidth / 2, startY = headerRect.bottom - rect.top;
        var endX = leaderRect.left - rect.left + leaderRect.width / 2;
        var endY = Math.max(startY + 2, leaderRect.top - rect.top - 4);
        var leadStem = svg('path', { d: curvedPath(startX, startY, endX, endY),
          'class': 'org-chart-edge org-chart-edge-leader-gutter', 'data-edge-kind': 'leader-gutter' });
        leadStem.setAttribute('aria-hidden', 'true');
        leadStem.setAttribute('marker-end', 'url(#' + layer.dataset.arrowId + ')');
        layer.appendChild(leadStem);
      }
    });
    var membershipBySpace = Object.create(null);
    (state.projection.edges || []).forEach(function (edge) {
      var source = findNodeElement(edge.source);
      var target = findNodeElement(edge.target);
      if (!source || !target) return;
      var sourceRect = source.getBoundingClientRect(), targetRect = target.getBoundingClientRect();
      var sourceX = sourceRect.left - canvasRect.left + sourceRect.width / 2;
      var sourceY = sourceRect.bottom - canvasRect.top;
      var targetX = targetRect.left - canvasRect.left + targetRect.width / 2;
      var targetY = targetRect.top - canvasRect.top;
      if (edge.kind === 'oversight') {
        // First-row spaces sit below the primary Bot and can use a direct
        // curve. Later rows route down the outside-left gutter before turning
        // across the whitespace above the destination row; a global SVG path
        // must never disappear under an earlier, tall space card.
        var group = groupElement(edge.spaceId), groupRect = group && group.getBoundingClientRect();
        var groups = state.nodeLayer.querySelector('.org-chart-groups');
        var groupsRect = groups && groups.getBoundingClientRect();
        if (groupRect) {
          targetX = groupRect.left - canvasRect.left + groupRect.width / 2;
          targetY = groupRect.top - canvasRect.top - 4;
        }
        var oversightPath = curvedPath(sourceX, sourceY, targetX, targetY);
        if(groupRect&&groupsRect&&groupRect.top>groupsRect.top+2){
          var firstRow=Array.prototype.filter.call(groups.querySelectorAll('.org-chart-group'),function(item){
            return item.getBoundingClientRect().top<=groupsRect.top+2;
          }).map(function(item){return item.getBoundingClientRect();}).sort(function(a,b){return a.left-b.left;});
          var targetColumn=0,targetDistance=Infinity;
          firstRow.forEach(function(item,index){var distance=Math.abs((item.left+item.width/2)-groupRect.left-groupRect.width/2);if(distance<targetDistance){targetDistance=distance;targetColumn=index;}});
          var railX=targetColumn===0?groupsRect.left-canvasRect.left-12:
            (firstRow[targetColumn-1].right+firstRow[targetColumn].left)/2-canvasRect.left;
          var railStartY=sourceY+12;
          var firstReach=Math.min(38,Math.max(16,(sourceX-railX)*.18));
          var lastReach=Math.min(42,Math.max(18,(targetX-railX)*.16));
          var verticalReach=Math.min(48,Math.max(14,(targetY-railStartY)*.14));
          var firstDirection=railX<sourceX?-1:1,lastDirection=targetX<railX?-1:1;
          var turnRadius=Math.min(12,Math.max(10,Math.min(lastReach,verticalReach)));
          oversightPath='M '+sourceX+' '+sourceY+' C '+(sourceX+firstDirection*firstReach)+' '+(sourceY+8)+', '+(railX-firstDirection*12)+' '+railStartY+', '+railX+' '+railStartY+
            ' C '+railX+' '+(railStartY+verticalReach)+', '+railX+' '+(targetY-verticalReach)+', '+railX+' '+(targetY-turnRadius)+
            ' Q '+railX+' '+targetY+' '+(railX+lastDirection*turnRadius)+' '+targetY+
            ' C '+(railX+lastDirection*lastReach)+' '+targetY+', '+(targetX-lastDirection*lastReach)+' '+targetY+', '+targetX+' '+targetY;
        }
        var oversight = svg('path', { d: oversightPath,
          'class': 'org-chart-edge org-chart-edge-oversight', 'data-edge-id': edge.id,
          'data-edge-kind': edge.kind || 'oversight' });
        oversight.setAttribute('aria-hidden', 'true');
        oversight.setAttribute('marker-end', 'url(#org-chart-arrow)');
        state.edgeLayer.appendChild(oversight);
        return;
      }
      if (edge.kind === 'membership') {
        (membershipBySpace[edge.spaceId] || (membershipBySpace[edge.spaceId]=[])).push(edge);
      }
    });
    Object.keys(membershipBySpace).forEach(function (spaceId) { drawMembershipGroup(spaceId,membershipBySpace[spaceId]); });
  }

  function findNodeElement(nodeId) {
    if (!state.nodeLayer) return null;
    var nodes = state.nodeLayer.querySelectorAll('[data-node-id]');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].dataset.nodeId === nodeId) return nodes[i];
    }
    return null;
  }

  function preserveViewState() {
    var result = null;
    if (state.scroll) {
      result = { left: state.scroll.scrollLeft || 0, top: state.scroll.scrollTop || 0 };
      var active = document.activeElement;
      if (active && state.nodeLayer && state.nodeLayer.contains(active)) {
        if (active.dataset && active.dataset.nodeId) result.nodeId = active.dataset.nodeId;
        else if (active.dataset && active.dataset.collapseSpaceId) result.collapseSpaceId = active.dataset.collapseSpaceId;
        else if (active.id) result.id = active.id;
      }
    }
    return result;
  }

  function restoreViewState(saved) {
    if (!saved || !state.scroll) return;
    state.scroll.scrollLeft = saved.left || 0;
    state.scroll.scrollTop = saved.top || 0;
    var target = null;
    if (saved.nodeId) target = findNodeElement(saved.nodeId);
    if (!target && saved.collapseSpaceId && state.nodeLayer) {
      var collapseButtons = state.nodeLayer.querySelectorAll('[data-collapse-space-id]');
      for (var i = 0; i < collapseButtons.length; i++) {
        if (collapseButtons[i].dataset.collapseSpaceId === saved.collapseSpaceId) { target = collapseButtons[i]; break; }
      }
    }
    if (!target && saved.id) target = document.getElementById(saved.id);
    if (target && typeof target.focus === 'function') {
      try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
    }
  }

  function unavailableView(error) {
    var panel = el('section', 'org-chart-unavailable');
    panel.id = 'org-chart-unavailable';
    panel.setAttribute('role', 'alert');
    panel.appendChild(el('strong', '', tr('组织图暂不可用',"Organization chart unavailable")));
    panel.appendChild(el('span', '', error && error.message ? error.message : tr('组织图投影模块未连接，请重新打开工作空间后重试。',"Organization chart module is disconnected. Reopen Spaces and retry.")));
    var retry = el('button', 'org-chart-retry', tr('重试',"Retry"));
    retry.type = 'button';
    retry.id = 'org-chart-retry';
    retry.addEventListener('click', function () {
      if (typeof state.options.onRetry === 'function') state.options.onRetry();
      else render(state.snapshot || {});
    });
    panel.appendChild(retry);
    return panel;
  }

  function renderChartBody() {
    if (!state.host) return;
    // Collapse/expand rebuilds the body directly, so release the previous
    // observer and frame here as well as in the full snapshot render path.
    if (state.resizeObserver) { state.resizeObserver.disconnect(); state.resizeObserver = null; }
    if (state.resizeHandler) { root.removeEventListener('resize', state.resizeHandler); state.resizeHandler = null; }
    cancelScheduledEdges();
    state.groupEdgeMarkerSequence = 0;
    var saved = preserveViewState();
    state.host.replaceChildren();
    var projection = state.projection || { ceo: null, groups: [], unassigned: [], stats: {} };
    var rootView = el('div', 'org-chart');
    rootView.id = 'org-chart';
    rootView.setAttribute('aria-label', tr('本机 BOT 标签：', 'Local BOT labels: ') + roleLabel({botId:state.projection && state.projection.primaryBotId}, 'primary') + '、' + roleLabel(null, 'leader') + tr('和成员；不表示真人团队', ' and members; not a human team'));
    if (state.projectionError) {
      rootView.appendChild(unavailableView(state.projectionError));
      var unavailableShell = el('div', 'org-chart-view-shell');
      unavailableShell.id = 'org-chart-view';
      unavailableShell.appendChild(rootView);
      state.host.appendChild(unavailableShell);
      state.detail = null;
      return;
    }
    var toolbar = el('div', 'org-chart-toolbar');
    var summary = el('div', 'org-chart-summary');
    var stats = projection.stats || {};
    var summaryTitleText = tr('BOT 标签：', 'BOT labels: ') + roleLabel({botId:state.projection && state.projection.primaryBotId}, 'primary') + ' · ' + roleLabel(null, 'leader') + ' · ' + roleLabel(null, 'member');
    var summaryTitle = el('strong', 'org-chart-summary-title', summaryTitleText);
    summaryTitle.title = summaryTitleText;
    summary.appendChild(summaryTitle);
    var bits = [];
    if (stats.spaceCount != null) bits.push(countLabel(stats.spaceCount,' 个空间','space'));
    if (stats.botCount != null) bits.push(countLabel(stats.botCount,' 个 Bot','Bot'));
    if (stats.sharedBotCount) bits.push(stats.sharedBotCount + tr(' 个跨空间'," across spaces"));
    if (stats.unassignedBotCount) bits.push(stats.unassignedBotCount + tr(' 个未分配'," unassigned"));
    summary.appendChild(el('span', 'org-chart-summary-meta', bits.join(' · ')));
    toolbar.appendChild(summary);
    var fit = el('button', 'org-chart-fit', tr('定位', 'Locate ') + roleLabel({botId:state.projection && state.projection.primaryBotId}, 'primary'));
    fit.type = 'button';
    fit.id = 'org-chart-fit';
    fit.addEventListener('click', function () {
      if (!state.scroll) return;
      state.scroll.scrollLeft = 0;
      state.scroll.scrollTop = 0;
      var ceo = state.nodeLayer && state.nodeLayer.querySelector('[data-kind="ceo"]');
      if (ceo && typeof ceo.scrollIntoView === 'function') ceo.scrollIntoView({ block: 'start', inline: 'center' });
      scheduleEdges();
    });
    toolbar.appendChild(fit);
    rootView.appendChild(toolbar);
    var scroll = el('div', 'org-chart-scroll');
    scroll.id = 'org-chart-stage';
    var canvas = el('div', 'org-chart-canvas');
    var edges = svg('svg', { 'class': 'org-chart-edges', role: 'presentation', focusable: 'false' });
    canvas.appendChild(edges);
    state.scroll = scroll;
    state.canvas = canvas;
    state.edgeLayer = edges;
    state.nodeLayer = canvas;
    if (projection.ceo) {
      var ceoSection = el('section', 'org-chart-ceo-section');
      ceoSection.appendChild(el('span', 'org-chart-section-label', roleLabel(projection.ceo, 'primary')));
      ceoSection.appendChild(makeNode(projection.ceo, 'ceo'));
      canvas.appendChild(ceoSection);
    } else {
      var missing = el('div', 'org-chart-missing-ceo');
      missing.appendChild(el('strong', '', tr('尚未设置', 'No ') + roleLabel(null, 'primary')));
      missing.appendChild(el('span', '', tr('组织图只展示已确认的组织身份，不会猜测负责人。',"The chart shows confirmed organization roles only. Leads are never inferred.")));
      canvas.appendChild(missing);
    }
    var groups = el('div', 'org-chart-groups');
    (projection.groups || []).forEach(function (group) { groups.appendChild(groupLane(group)); });
    if (projection.unassigned && projection.unassigned.length) {
      var unassigned = unassignedLane(projection.unassigned);
      if (unassigned) groups.appendChild(unassigned);
    }
    if (!projection.groups.length && !projection.unassigned.length) {
      groups.appendChild(el('div', 'org-chart-no-groups', tr('还没有空间或可归属的 Bot。',"No spaces or assigned Bots yet.")));
    }
    canvas.appendChild(groups);
    scroll.appendChild(canvas);
    rootView.appendChild(scroll);
    state.detail = detailFor(findNode(state.selectedId));
    rootView.appendChild(state.detail);
    var chartShell = el('div', 'org-chart-view-shell');
    chartShell.id = 'org-chart-view';
    chartShell.appendChild(rootView);
    state.host.appendChild(chartShell);
    if (root.ResizeObserver) {
      state.resizeObserver = new root.ResizeObserver(scheduleEdges);
      state.resizeObserver.observe(chartShell || rootView);
    } else {
      state.resizeHandler = scheduleEdges;
      root.addEventListener('resize', state.resizeHandler);
    }
    restoreViewState(saved);
    scheduleEdges();
  }

  function render(snapshot) {
    state.snapshot = snapshot && typeof snapshot === 'object' ? snapshot : {};
    state.projectionError = null;
    try {
      if (!root.OpenBotOrgChartModel || typeof root.OpenBotOrgChartModel.build !== 'function') {
        throw new Error(tr('组织图投影模块未加载',"Organization chart module not loaded"));
      }
      state.projection = root.OpenBotOrgChartModel.build(state.snapshot);
      if (!state.projection || typeof state.projection !== 'object') throw new Error(tr('组织图投影返回无效数据',"Organization chart returned invalid data"));
    } catch (error) {
      state.projectionError = error instanceof Error ? error : new Error(tr('组织图投影失败',"Organization chart projection failed"));
      state.projection = null;
    }
    if (!findNode(state.selectedId)) state.selectedId = '';
    if (state.resizeObserver) { state.resizeObserver.disconnect(); state.resizeObserver = null; }
    if (state.resizeHandler) { root.removeEventListener('resize', state.resizeHandler); state.resizeHandler = null; }
    if (state.host) renderChartBody();
  }

  function mount(host, options) {
    if (!host) return null;
    state.host = host;
    state.options = options || {};
    render(state.options.snapshot || {});
    return {
      update: function (snapshot) { render(snapshot); },
      destroy: function () {
        cancelScheduledEdges();
        if (state.resizeObserver) state.resizeObserver.disconnect();
        if (state.resizeHandler) root.removeEventListener('resize', state.resizeHandler);
        state.resizeObserver = null;
        state.resizeHandler = null;
        if (state.host) state.host.replaceChildren();
        state.host = null;
        state.scroll = null;
        state.canvas = null;
        state.edgeLayer = null;
        state.nodeLayer = null;
        state.detail = null;
      }
    };
  }

  root.OpenBotOrgChart = { mount: mount, update: render, destroy: function () {} };
}(window));
