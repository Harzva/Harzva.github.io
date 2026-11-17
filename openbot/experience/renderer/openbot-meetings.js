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
   * The meeting room is an isolated renderer surface.  It intentionally has
   * its own DOM owner and bridge calls so a temporary meeting cannot become a
   * persistent organization space or reuse the ordinary chat history.
   */
  var bridge = null;
  var initialized = false;
  var open = false;
  var lifeEpoch = 0;
  var viewEpoch = 0;
  var stateReadSeq = 0;
  var meetingReadSeq = 0;
  var scheduleReadSeq = 0;
  var operationSeq = 0;
  var activeOperation = null;
  var unsubscribe = null;
  var scheduleUnsubscribe = null;
  var focusBefore = null;
  var selectedMeetingId = '';
  var lastMeetingId = '';
  var selectedScheduleId = '';
  var activeKind = 'meeting';
  var groupChatIntent = false;
  var screen = 'home';
  var meetingTab = 'discussion';
  var model = { revision: 0, bots: [], meetings: [], groupChats: [], limits: { minParticipants: 2, maxParticipants: 8 } };
  var scheduleModel = { revision: 0, schedules: [], limits: {} };
  var meetingView = null;
  var newDraft = { title: '', topic: '', participantBotIds: [], chairBotId: '', timing: 'now', start: '' };
  var onGroupCreated = null;
  var groupChatDraft = { title: '', participantBotIds: [] };
  var proposalDrafts = Object.create(null);
  var meetingDrafts = Object.create(null);
  var statusMessage = '';
  var statusTone = '';
  var mainError = '';
  var scheduleError = '';
  var busy = false;
  var closing = false;
  var composing = false;
  var refreshQueued = false;
  var scheduleRefreshQueued = false;
  var dom = Object.create(null);

  function el(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined && value !== null) node.textContent = String(value);
    return node;
  }

  function button(id, className, value) {
    var node = el('button', className, value);
    node.type = 'button';
    if (id) node.id = id;
    return node;
  }

  function text(value, fallback) {
    var result = value === undefined || value === null ? '' : String(value);
    return result || (fallback || '');
  }

  function id(value) {
    return value === undefined || value === null ? '' : String(value);
  }

  function safeColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : '#5b8cff';
  }

  function requestId(prefix) {
    var seed = prefix || 'meeting';
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return seed + '-' + root.crypto.randomUUID();
    return seed + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  function localTimeZone() {
    try {
      return (root.Intl && root.Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';
    } catch (_) {
      return 'UTC';
    }
  }

  function nextLocalMinuteValue() {
    var date = new Date(Date.now());
    date.setSeconds(0, 0);
    date.setMinutes(date.getMinutes() + 1);
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0') + 'T' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function localDateTimeToIso(value) {
    var raw = text(value).trim();
    var match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(raw);
    if (!match) throw new Error(tr('请选择预约日期和时间。',"Choose a date and time."));
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var hour = Number(match[4]);
    var minute = Number(match[5]);
    if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) throw new Error(tr('预约时间格式无效。',"Invalid scheduled time format."));
    var date = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute) {
      throw new Error(tr('预约时间在当前时区不存在，请重新选择。',"That time does not exist in this time zone. Choose another time."));
    }
    if (date.getTime() <= Date.now()) throw new Error(tr('预约时间必须晚于当前时间。',"Scheduled time must be in the future."));
    return date.toISOString();
  }

  function scheduleRepeatLabel(value) {
    return ({ once: tr('预约一次',"One time"), weekly: tr('每周',"Weekly"), monthly: tr('每月',"Monthly") })[value] || tr('预约一次',"One time");
  }

  function scheduleStatusLabel(value) {
    return ({ active: tr('已预约',"Scheduled"), cancelled: tr('已取消',"Canceled"), completed: tr('已完成',"Completed") })[value] || tr('已预约',"Scheduled");
  }

  function scheduleStatusClass(value) {
    return value === 'active' ? 'is-scheduled' : value === 'cancelled' ? 'is-cancelled' : 'is-completed';
  }

  function occurrenceStatusLabel(value) {
    return ({ running: tr('进行中',"In progress"), completed: tr('已完成',"Completed"), failed: tr('失败',"Failed"), cancelled: tr('已取消',"Canceled"), interrupted: tr('已中断',"Interrupted"), missed: tr('已错过',"Missed") })[value] || tr('未知状态',"Unknown status");
  }

  function occurrenceStatusClass(value) {
    return value === 'completed' ? 'is-completed' : value === 'failed' || value === 'missed' ? 'is-failed' : value === 'interrupted' ? 'is-interrupted' : value === 'running' ? 'is-running' : 'is-cancelled';
  }

  function call(name, args) {
    if (!bridge || typeof bridge[name] !== 'function') {
      return Promise.reject(new Error(tr('会议室服务尚未连接，请重新打开桌面版。',"Meeting service is disconnected. Reopen the desktop app.")));
    }
    var result;
    try {
      result = args === undefined ? bridge[name]() : bridge[name](args);
    } catch (error) {
      return Promise.reject(error);
    }
    return Promise.resolve(result);
  }

  function setStatus(message, tone) {
    statusMessage = message ? String(message) : '';
    statusTone = tone || '';
    if (!dom.status) return;
    dom.status.textContent = statusMessage;
    if (statusTone) dom.status.dataset.tone = statusTone;
    else dom.status.removeAttribute('data-tone');
  }

  function combinedError(primary) {
    var errors = [];
    [primary, scheduleError].forEach(function (value) {
      var item = text(value);
      if (item && errors.indexOf(item) < 0) errors.push(item);
    });
    return errors.join(' · ');
  }

  function normalizeLimits(value) {
    var source = value && typeof value === 'object' ? value : {};
    var min = Number(source.minParticipants || source.min || 2);
    var max = Number(source.maxParticipants || source.participants || source.max || 8);
    if (!isFinite(min) || min < 2) min = 2;
    if (!isFinite(max) || max < min) max = Math.max(8, min);
    var groupMax = Number(source.groupParticipants);
    return { minParticipants: Math.floor(min), maxParticipants: Math.floor(max),
      groupParticipants: Number.isSafeInteger(groupMax) && groupMax >= min ? groupMax : Math.floor(max) };
  }

  function normalizeBot(raw) {
    if (!raw || typeof raw !== 'object' || !raw.id) return null;
    var bot = {
      id: id(raw.id),
      name: text(raw.name, raw.id),
      avatar: text(raw.avatar, 'orbit'),
      color: safeColor(raw.color),
      title: text(raw.title),
      description: text(raw.description)
    };
    if (raw.model) bot.model = text(raw.model);
    if (raw.harness) bot.harness = text(raw.harness);
    bot.groupChatUnsupportedReason = text(raw.groupChatUnsupportedReason ?? raw.unsupportedReason);
    if (raw.unsupportedReason) bot.unsupportedReason = text(raw.unsupportedReason);
    return bot;
  }

  function normalizeSummary(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var status = ['open', 'closing', 'closed'].indexOf(raw.status) >= 0 ? raw.status : 'closed';
    return {
      id: id(raw.id),
      title: text(raw.title, raw.kind === 'group-chat' ? tr('未命名群聊',"Untitled chat") : tr('未命名会议',"Untitled meeting")),
      kind: raw.kind === 'group-chat' ? 'group-chat' : 'meeting',
      topic: text(raw.topic),
      temporaryBotIds: Array.isArray(raw.temporaryBotIds) ? raw.temporaryBotIds.map(id) : [],
      permanentBotIds: Array.isArray(raw.permanentBotIds) ? raw.permanentBotIds.map(id) : [],
      participantBotIds: Array.isArray(raw.participantBotIds) ? raw.participantBotIds.map(id) : [],
      participants: Array.isArray(raw.participants) ? raw.participants.map(normalizeBot).filter(Boolean) : [],
      sourceGroups: (Array.isArray(raw.sourceGroups) ? raw.sourceGroups : []).filter(group => group && Array.isArray(group.participantBotIds)),
      chairBotId: id(raw.chairBotId),
      status: status,
      createdAt: raw.createdAt,
      closedAt: raw.closedAt,
      lastMessageAt: raw.lastMessageAt,
      hasProposal: raw.hasProposal === true,
      activeRun: raw.activeRun && typeof raw.activeRun === 'object' ? normalizeRun(raw.activeRun) : null
    };
  }

  function normalizeRun(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    return {
      id: id(raw.id || raw.runId),
      runId: id(raw.runId || raw.id),
      requestId: id(raw.requestId),
      status: text(raw.status),
      error: text(raw.error),
      kind: text(raw.kind),
      botId: id(raw.currentBotId || raw.botId || raw.speakerBotId),
      speakerBotId: id(raw.currentBotId || raw.speakerBotId || raw.botId),
      currentBotId: id(raw.currentBotId),
      startedAt: raw.startedAt,
      endedAt: raw.endedAt,
      stopping: raw.stopping === true,
      completedSpeakers: Number.isFinite(Number(raw.completedSpeakers)) ? Number(raw.completedSpeakers) : 0,
      totalSpeakers: Number.isFinite(Number(raw.totalSpeakers)) ? Number(raw.totalSpeakers) : 0,
      progress: text(raw.progress)
    };
  }

  function normalizeOccurrence(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var allowed = ['running', 'completed', 'failed', 'cancelled', 'interrupted', 'missed'];
    return {
      id: id(raw.id),
      scheduledAt: raw.scheduledAt,
      status: allowed.indexOf(raw.status) >= 0 ? raw.status : 'missed',
      meetingId: id(raw.meetingId),
      discussionRunId: id(raw.discussionRunId),
      finishRunId: id(raw.finishRunId),
      error: text(raw.error),
      startedAt: raw.startedAt,
      endedAt: raw.endedAt
    };
  }

  function normalizeSchedule(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var allowed = ['active', 'cancelled', 'completed'];
    var repeat = ['once', 'weekly', 'monthly'].indexOf(raw.repeat) >= 0 ? raw.repeat : 'once';
    var occurrences = Array.isArray(raw.occurrences) ? raw.occurrences.map(normalizeOccurrence).filter(function (item) { return item.id; }) : [];
    return {
      id: id(raw.id),
      title: text(raw.title, tr('未命名预约',"Untitled schedule")),
      topic: text(raw.topic),
      temporaryBotIds: Array.isArray(raw.temporaryBotIds) ? raw.temporaryBotIds.map(id) : [],
      participantBotIds: Array.isArray(raw.participantBotIds) ? raw.participantBotIds.map(id) : [],
      chairBotId: id(raw.chairBotId),
      startsAt: raw.startsAt,
      timeZone: text(raw.timeZone, localTimeZone()),
      repeat: repeat,
      status: allowed.indexOf(raw.status) >= 0 ? raw.status : 'active',
      nextAt: raw.nextAt || null,
      createdAt: raw.createdAt,
      cancelledAt: raw.cancelledAt,
      occurrences: occurrences
    };
  }

  function normalizeScheduleState(value) {
    value = value && typeof value === 'object' ? value : {};
    var schedules = [];
    (Array.isArray(value.schedules) ? value.schedules : []).forEach(function (raw) {
      var schedule = normalizeSchedule(raw);
      if (!schedule.id || schedules.some(function (item) { return item.id === schedule.id; })) return;
      schedules.push(schedule);
    });
    schedules.sort(function (a, b) {
      var aActive = a.status === 'active' ? 0 : 1;
      var bActive = b.status === 'active' ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      var at = new Date(a.nextAt || a.startsAt || a.createdAt || 0).getTime();
      var bt = new Date(b.nextAt || b.startsAt || b.createdAt || 0).getTime();
      return (isNaN(at) ? 0 : at) - (isNaN(bt) ? 0 : bt);
    });
    return {
      revision: Number.isSafeInteger(value.revision) ? value.revision : 0,
      schedules: schedules,
      limits: value.limits && typeof value.limits === 'object' ? value.limits : {}
    };
  }

  function normalizeState(value) {
    value = value && typeof value === 'object' ? value : {};
    var bots = [];
    (Array.isArray(value.bots) ? value.bots : []).forEach(function (raw) {
      var bot = normalizeBot(raw);
      if (!bot || bots.some(function (item) { return item.id === bot.id; })) return;
      bots.push(bot);
    });
    var meetings = [];
    (Array.isArray(value.meetings) ? value.meetings : []).forEach(function (raw) {
      var summary = normalizeSummary(raw);
      if (!summary.id || meetings.some(function (item) { return item.id === summary.id; })) return;
      meetings.push(summary);
    });
    var groupChats = [];
    (Array.isArray(value.groupChats) ? value.groupChats : []).forEach(function (raw) {
      var summary = normalizeSummary(raw);
      if (!summary.id || groupChats.some(function (item) { return item.id === summary.id; })) return;
      summary.kind = 'group-chat';
      groupChats.push(summary);
    });
    meetings.sort(function (a, b) {
      var at = new Date(a.createdAt || 0).getTime();
      var bt = new Date(b.createdAt || 0).getTime();
      return (isNaN(bt) ? 0 : bt) - (isNaN(at) ? 0 : at);
    });
    groupChats.sort(function (a, b) {
      var at = Number(a.lastMessageAt) || new Date(a.createdAt || 0).getTime();
      var bt = Number(b.lastMessageAt) || new Date(b.createdAt || 0).getTime();
      return (isNaN(bt) ? 0 : bt) - (isNaN(at) ? 0 : at);
    });
    return {
      revision: Number.isSafeInteger(value.revision) ? value.revision : 0,
      bots: bots,
      meetings: meetings,
      groupChats: groupChats,
      limits: normalizeLimits(value.limits)
    };
  }

  function normalizeMeeting(value) {
    value = value && typeof value === 'object' ? value : {};
    var summary = normalizeSummary(value.meeting || value.summary || value);
    var participantSource = Array.isArray(value.participants)
      ? value.participants
      : (value.meeting && Array.isArray(value.meeting.participants) ? value.meeting.participants : []);
    var messages = Array.isArray(value.messages) ? value.messages : [];
    var runs = Array.isArray(value.runs) ? value.runs : [];
    return {
      meeting: summary,
      participants: participantSource.map(normalizeBot).filter(Boolean),
      messages: messages.filter(function (item) { return item && typeof item === 'object'; }).map(function (item) {
        return {
          id: id(item.id),
          role: item.role === 'user' ? 'user' : 'assistant',
          speakerBotId: id(item.speakerBotId),
          speakerName: text(item.speakerName),
          text: text(item.text),
          at: item.at,
          runId: id(item.runId)
        };
      }),
      runs: runs.filter(function (item) { return item && typeof item === 'object'; }).map(normalizeRun),
      proposal: value.proposal && typeof value.proposal === 'object' ? {
        text: text(value.proposal.text),
        at: value.proposal.at,
        authorBotId: id(value.proposal.authorBotId),
        runId: id(value.proposal.runId),
        source: value.proposal.source === 'manual' ? 'manual' : 'model'
      } : null
    };
  }

  function botById(botId) {
    var wanted = id(botId);
    if (meetingView && Array.isArray(meetingView.participants)) {
      for (var i = 0; i < meetingView.participants.length; i += 1) if (meetingView.participants[i].id === wanted) return meetingView.participants[i];
    }
    for (var j = 0; j < model.bots.length; j += 1) if (model.bots[j].id === wanted) return model.bots[j];
    return null;
  }

  function participantBots(summary) {
    var ids = summary && Array.isArray(summary.participantBotIds) ? summary.participantBotIds : [];
    return ids.map(botById).filter(Boolean);
  }

  function avatar(bot, size, className) {
    var holder = el('span', 'ob-meetings-avatar' + (className ? ' ' + className : ''));
    holder.setAttribute('aria-hidden', 'true');
    holder.dataset.size = size || 'list';
    if (bot && root.OpenBotAvatars && typeof root.OpenBotAvatars.markup === 'function') {
      holder.innerHTML = root.OpenBotAvatars.markup(bot.avatar, safeColor(bot.color), { size: size || 'list' });
    } else {
      holder.textContent = Array.from(String(bot ? text(bot.name, '') : '').trim())[0] || '';
      if (!holder.textContent || /^[?？]$/.test(holder.textContent)) holder.innerHTML = '<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>';
      holder.style.background = bot ? safeColor(bot.color) : '#5b8cff';
    }
    return holder;
  }

  function formatTime(value, withDate, timeZone) {
    if (value === undefined || value === null || value === '') return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    try {
      var options = withDate ? { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' } : { hour: '2-digit', minute: '2-digit' };
      if (timeZone) options.timeZone = timeZone;
      return date.toLocaleString(root.OpenBotI18n ? root.OpenBotI18n.locale : 'zh-CN', options);
    } catch (_) {
      return date.toISOString();
    }
  }

  function statusLabel(value) {
    return ({ open: tr('进行中',"In progress"), closing: tr('结束中',"Closing"), closed: tr('已归档',"Archived") })[value] || tr('已归档',"Archived");
  }

  function statusClass(value) {
    return value === 'open' ? 'is-open' : value === 'closing' ? 'is-closing' : 'is-closed';
  }

  function meetingTitle(summary) {
    return summary ? text(summary.title, tr('未命名会议',"Untitled meeting")) : tr('未命名会议',"Untitled meeting");
  }

  function groupChatTitle(summary) {
    return summary ? text(summary.title, tr('未命名群聊',"Untitled chat")) : tr('未命名群聊',"Untitled chat");
  }

  function isGroupSurface() {
    return activeKind === 'group-chat';
  }

  function applySurfaceChrome() {
    if (!dom.title) return;
    var groupSurface = isGroupSurface();
    dom.title.textContent = groupSurface ? tr('群聊',"Chats") : tr('会议室',"Meetings");
    dom.subtitle.textContent = groupSurface
      ? tr('与选定的 Bot 在本机聊天。',"Private chats with the Bots you choose.")
      : tr('召集 Bot 讨论方案；结束后会议解散，记录和最终方案永久留档。',"Bring Bots together to discuss a plan. When the meeting ends, its transcript and final proposal remain archived.");
    dom.indexTitle.textContent = groupSurface ? tr('群聊',"Chats") : tr('会议',"Meetings");
    dom.newButton.textContent = tr('新建',"New");
    dom.newButton.setAttribute('aria-label', groupSurface ? tr('新建群聊',"New chat") : tr('新建会议',"New meeting"));
    if (dom.window) {
      if (groupSurface) {
        dom.window.setAttribute('role', 'region');
        dom.window.setAttribute('aria-label', tr('群聊内容',"Chat conversation"));
        dom.window.removeAttribute('aria-modal');
        dom.close.setAttribute('aria-label', tr('返回当前聊天',"Return to the current chat"));
        dom.close.title = tr('返回当前聊天',"Return to the current chat");
      } else {
        dom.window.setAttribute('role', 'dialog');
        dom.window.setAttribute('aria-modal', 'true');
        dom.window.removeAttribute('aria-label');
        dom.close.setAttribute('aria-label', tr('关闭会议室',"Close Meetings"));
        dom.close.title = tr('关闭',"Close");
      }
    }
  }

  function mountSurface() {
    if (!dom.overlay) return;
    var groupSurface = isGroupSurface();
    var host = groupSurface ? document.getElementById('chat-panel') : null;
    if (host) {
      host.classList.add('ob-group-chat-host');
      if (dom.overlay.parentNode !== host) host.appendChild(dom.overlay);
      dom.overlay.classList.add('ob-group-chat-dialog');
      dom.overlay.classList.remove('ob-group-chat-dialog-fallback');
      return;
    }
    if (groupSurface) {
      dom.overlay.classList.add('ob-group-chat-dialog-fallback');
      dom.overlay.classList.remove('ob-group-chat-dialog');
      if (dom.overlay.parentNode !== document.body) document.body.appendChild(dom.overlay);
      return;
    }
    mountSurfaceToBody();
  }

  function mountSurfaceToBody() {
    if (!dom.overlay) return;
    var previousHost = dom.overlay.parentNode;
    if (previousHost && previousHost.classList) previousHost.classList.remove('ob-group-chat-host');
    dom.overlay.classList.remove('ob-group-chat-dialog', 'ob-group-chat-dialog-fallback');
    if (dom.overlay.parentNode !== document.body) document.body.appendChild(dom.overlay);
  }

  function speakerName(message) {
    if (!message || message.role === 'user') return tr('你',"You");
    if(message.speakerName)return message.speakerName;
    var bot = botById(message.speakerBotId);
    return bot ? bot.name : (message.speakerBotId ? 'Bot ' + message.speakerBotId : 'Bot');
  }

  function chairName(summary) {
    var chair = botById(summary && summary.chairBotId);
    return chair ? chair.name : tr('未指定主持',"No chair assigned");
  }

  function hasActiveRun() {
    if (!meetingView || !meetingView.meeting || meetingView.meeting.status === 'closed') return false;
    if (meetingView.meeting.activeRun && isRunActive(meetingView.meeting.activeRun)) return true;
    return meetingView.runs.some(isRunActive);
  }

  function isRunActive(run) {
    if (!run) return false;
    return run.stopping === true || ['running', 'queued', 'pending', 'active', 'in_progress'].indexOf(run.status) >= 0;
  }

  function currentActiveRun() {
    if (!meetingView) return null;
    if (meetingView.meeting && meetingView.meeting.activeRun && isRunActive(meetingView.meeting.activeRun)) return meetingView.meeting.activeRun;
    for (var i = meetingView.runs.length - 1; i >= 0; i -= 1) {
      if (isRunActive(meetingView.runs[i])) return meetingView.runs[i];
    }
    return null;
  }

  function latestFailedRunError() {
    if (!meetingView || !Array.isArray(meetingView.runs) || !meetingView.runs.length) return '';
    var last = meetingView.runs[meetingView.runs.length - 1];
    return last && last.status === 'failed' && last.error ? last.error : '';
  }

  function nextRoundLabel(run) {
    var round = Number(run && run.round);
    if (!isFinite(round) || round < 1) {
      var count = meetingView && Array.isArray(meetingView.runs) ? meetingView.runs.length : 0;
      round = Math.max(1, count);
    }
    return tr('第 ',"Round ") + Math.floor(round) + tr(' 轮',"");
  }

  function focusTarget(target) {
    if (target && typeof target.focus === 'function') {
      try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
    }
  }

  function invalidateOperations() {
    operationSeq += 1;
    activeOperation = null;
    busy = false;
  }

  function beginOperation(kind, meetingId, scheduleId) {
    operationSeq += 1;
    activeOperation = { token: operationSeq, kind: kind, meetingId: id(meetingId), scheduleId: id(scheduleId), life: lifeEpoch };
    busy = true;
    return activeOperation;
  }

  function isCurrentOperation(operation) {
    return !!operation && open && activeOperation === operation && operation.token === operationSeq && operation.life === lifeEpoch && (!operation.meetingId || operation.meetingId === selectedMeetingId) && (!operation.scheduleId || operation.scheduleId === selectedScheduleId);
  }

  function endOperation(operation) {
    if (activeOperation !== operation) return;
    activeOperation = null;
    busy = false;
  }

  function captureInputState() {
    var active = document.activeElement;
    if (!active || !dom.main || !dom.main.contains(active) || !active.id) return null;
    var state = { id: active.id, tag: active.tagName, focused: true };
    if (typeof active.value === 'string') {
      state.value = active.value;
      state.start = typeof active.selectionStart === 'number' ? active.selectionStart : null;
      state.end = typeof active.selectionEnd === 'number' ? active.selectionEnd : null;
      state.direction = active.selectionDirection || 'none';
    }
    return state;
  }

  function restoreInputState(state) {
    if (!state || !state.id) return;
    var target = document.getElementById(state.id);
    if (!target) return;
    if (typeof state.value === 'string' && typeof target.value === 'string' && target.value !== state.value && !target.disabled) target.value = state.value;
    if (!target.disabled) focusTarget(target);
    if (typeof state.start === 'number' && typeof target.setSelectionRange === 'function' && !target.disabled) {
      try { target.setSelectionRange(state.start, state.end, state.direction); } catch (_) { /* selection can be stale after a resize */ }
    }
  }

  function wireComposition(node) {
    if (!node) return;
    node.addEventListener('compositionstart', function () { composing = true; });
    node.addEventListener('compositionend', function () {
      composing = false;
      if (refreshQueued) {
        refreshQueued = false;
        handleChanged();
      }
      if (scheduleRefreshQueued) {
        scheduleRefreshQueued = false;
        handleSchedulesChanged();
      }
    });
  }

  function createModal() {
    if (dom.overlay) return;
    var overlay = el('div', 'ob-meetings-dialog');
    overlay.id = 'ob-meetings-dialog';
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    var win = el('section', 'ob-meetings-window');
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'true');
    win.setAttribute('aria-labelledby', 'ob-meetings-title');
    win.setAttribute('aria-describedby', 'ob-meetings-subtitle');
    var header = el('header', 'ob-meetings-header');
    var heading = el('div', 'ob-meetings-heading');
    var title = el('h2', 'ob-meetings-title', tr('会议室',"Meetings"));
    title.id = 'ob-meetings-title';
    var subtitle = el('p', 'ob-meetings-subtitle', tr('召集 Bot 讨论方案；结束后会议解散，记录和最终方案永久留档。',"Bring Bots together to discuss a plan. When the meeting ends, its transcript and final proposal remain archived."));
    subtitle.id = 'ob-meetings-subtitle';
    heading.append(title, subtitle);
    var close = button('ob-meetings-close', 'ob-meetings-close', '×');
    close.setAttribute('aria-label', tr('关闭会议室',"Close Meetings"));
    close.title = tr('关闭',"Close");
    header.append(heading, close);
    var status = el('p', 'ob-meetings-status');
    status.id = 'ob-meetings-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    var layout = el('div', 'ob-meetings-layout');
    var aside = el('aside', 'ob-meetings-index');
    aside.setAttribute('aria-label', tr('会议列表',"Meeting list"));
    var indexHead = el('div', 'ob-meetings-index-head');
    var indexTitle = el('h3', 'ob-meetings-index-title', tr('会议',"Meetings"));
    indexHead.appendChild(indexTitle);
    var newButton = button('ob-meetings-new', 'ob-meetings-new', tr('新建',"New"));
    newButton.setAttribute('aria-label', tr('新建会议',"New meeting"));
    indexHead.appendChild(newButton);
    var list = el('div', 'ob-meetings-list');
    list.id = 'ob-meetings-list';
    aside.append(indexHead, list);
    var main = el('main', 'ob-meetings-main');
    main.id = 'ob-meetings-main';
    layout.append(aside, main);
    win.append(header, status, layout);
    overlay.appendChild(win);
    document.body.appendChild(overlay);
    overlay.dataset.botPageBlock='40';dom.overlay = overlay;
    dom.window = win;
    dom.status = status;
    dom.list = list;
    dom.main = main;
    dom.title = title;
    dom.subtitle = subtitle;
    dom.indexTitle = indexTitle;
    dom.close = close;
    dom.newButton = newButton;
    close.addEventListener('click', closeDialog);
    newButton.addEventListener('click', function () {
      if (isGroupSurface()) {
        startNewGroupChat();
        return;
      }
      invalidateOperations();
      selectedMeetingId = '';
      selectedScheduleId = '';
      meetingView = null;
      closing = false;
      screen = 'new';
      mainError = '';
      setStatus('');
      render();
      var name = document.getElementById('ob-meetings-new-title');
      focusTarget(name);
    });
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeDialog();
    });
  }

  function renderList() {
    if (!dom.list) return;
    dom.list.replaceChildren();
    if (isGroupSurface()) {
      return;
    }
    var openMeetings = model.meetings.filter(function (item) { return item.status !== 'closed'; });
    var closedMeetings = model.meetings.filter(function (item) { return item.status === 'closed'; });
    function group(title, items) {
      if (!items.length) return;
      var heading = el('h4', 'ob-meetings-list-group', title);
      dom.list.appendChild(heading);
      items.forEach(function (summary) {
        var item = button('', 'ob-meetings-list-item');
        item.dataset.meetingId = summary.id;
        item.dataset.status = summary.status;
        item.setAttribute('aria-current', String(summary.id === selectedMeetingId));
        var copy = el('span', 'ob-meetings-list-copy');
        copy.appendChild(el('strong', 'ob-meetings-list-name', meetingTitle(summary)));
        var meta = [statusLabel(summary.status), summary.hasProposal ? tr('已有方案',"Proposal saved") : '', formatTime(summary.closedAt || summary.createdAt, false)].filter(Boolean).join(' · ');
        copy.appendChild(el('span', 'ob-meetings-list-meta', meta));
        item.appendChild(copy);
        item.appendChild(el('span', 'ob-meetings-list-count', String(summary.participantBotIds.length)));
        item.addEventListener('click', function () { selectMeeting(summary.id); });
        dom.list.appendChild(item);
      });
    }
    if (scheduleModel.schedules.length) {
      var scheduleHeading = el('h4', 'ob-meetings-list-group', tr('预约',"Schedules"));
      dom.list.appendChild(scheduleHeading);
      scheduleModel.schedules.forEach(function (schedule) {
        var item = button('', 'ob-meetings-list-item ob-meetings-schedule-list-item');
        item.dataset.scheduleId = schedule.id;
        item.dataset.status = schedule.status;
        item.setAttribute('aria-current', String(schedule.id === selectedScheduleId));
        var copy = el('span', 'ob-meetings-list-copy');
        copy.appendChild(el('strong', 'ob-meetings-list-name', schedule.title));
        var when = schedule.nextAt || (schedule.status === 'active' ? schedule.startsAt : null);
        var meta = [scheduleStatusLabel(schedule.status), scheduleRepeatLabel(schedule.repeat), formatTime(when, false, schedule.timeZone)].filter(Boolean).join(' · ');
        copy.appendChild(el('span', 'ob-meetings-list-meta', meta));
        item.appendChild(copy);
        item.appendChild(el('span', 'ob-meetings-list-count', String(schedule.participantBotIds.length)));
        item.addEventListener('click', function () { selectSchedule(schedule.id); });
        dom.list.appendChild(item);
      });
    }
    group(tr('进行中',"In progress"), openMeetings);
    group(tr('归档',"Archive"), closedMeetings);
    if (!model.meetings.length && !scheduleModel.schedules.length) dom.list.appendChild(el('p', 'ob-meetings-list-empty', tr('还没有会议记录',"No meeting records yet")));
  }

  function groupParticipantBots(summary) {
    if (meetingView && meetingView.meeting && summary && meetingView.meeting.id === summary.id && Array.isArray(meetingView.participants) && meetingView.participants.length) return meetingView.participants;
    if (summary && Array.isArray(summary.participants) && summary.participants.length) return summary.participants;
    var ids = summary && Array.isArray(summary.participantBotIds) ? summary.participantBotIds : [];
    return ids.map(botById).filter(Boolean);
  }

  function scheduleParticipantBots(schedule) {
    var ids = schedule && Array.isArray(schedule.participantBotIds) ? schedule.participantBotIds : [];
    return ids.map(botById).filter(Boolean);
  }

  function renderScheduleParticipants(schedule) {
    var section = el('section', 'ob-meetings-participant-strip ob-meetings-schedule-participants');
    section.setAttribute('aria-label', tr('预约参会 Bot',"Scheduled participants"));
    scheduleParticipantBots(schedule).forEach(function (bot) {
      var person = el('div', 'ob-meetings-person' + (bot.id === schedule.chairBotId ? ' is-chair' : ''));
      person.appendChild(avatar(bot, 'mini'));
      var copy = el('span', 'ob-meetings-person-copy');
      copy.appendChild(el('strong', '', bot.name));
      copy.appendChild(el('span', '', bot.id === schedule.chairBotId ? tr('主持',"Chair") : tr('参会',"Participant")));
      person.appendChild(copy);
      section.appendChild(person);
    });
    return section;
  }

  function renderScheduleDetail(schedule) {
    var panel = el('section', 'ob-meetings-schedule');
    panel.id = 'ob-meetings-schedule-detail';
    var head = el('header', 'ob-meetings-schedule-head');
    var copy = el('div', 'ob-meetings-schedule-copy');
    copy.appendChild(el('h3', '', schedule.title));
    var next = schedule.status === 'active' ? schedule.nextAt : null;
    var whenText = next ? formatTime(next, true, schedule.timeZone) : (schedule.status === 'active' ? tr('暂无下一次时间',"No next occurrence") : tr('没有后续预约',"No future occurrences"));
    copy.appendChild(el('p', '', scheduleRepeatLabel(schedule.repeat) + ' · ' + whenText));
    copy.appendChild(el('span', 'ob-meetings-schedule-timezone', tr('预约时区 · ',"Time zone · ") + schedule.timeZone));
    head.appendChild(copy);
    var actions = el('div', 'ob-meetings-meeting-actions');
    var status = el('span', 'ob-meetings-status-chip ' + scheduleStatusClass(schedule.status), scheduleStatusLabel(schedule.status));
    status.dataset.status = schedule.status;
    actions.appendChild(status);
    if (schedule.status === 'active') {
      var cancel = button('ob-meetings-schedule-cancel', 'ob-meetings-secondary ob-meetings-schedule-cancel', tr('取消后续预约',"Cancel future occurrences"));
      cancel.disabled = busy;
      cancel.addEventListener('click', function () { cancelSchedule(schedule.id); });
      actions.appendChild(cancel);
    }
    head.appendChild(actions);
    panel.appendChild(head);
    panel.appendChild(renderScheduleParticipants(schedule));
    var content = el('div', 'ob-meetings-schedule-content');
    if (schedule.topic) {
      content.appendChild(el('h4', 'ob-meetings-schedule-section-title', tr('讨论主题',"Discussion topic")));
      content.appendChild(el('p', 'ob-meetings-schedule-topic', schedule.topic));
    }
    content.appendChild(el('h4', 'ob-meetings-schedule-section-title', tr('运行记录',"Run history")));
    var occurrences = el('div', 'ob-meetings-occurrences');
    if (!schedule.occurrences.length) {
      occurrences.appendChild(el('p', 'ob-meetings-muted', tr('到时间后，运行记录会显示在这里。',"Run history appears here after the scheduled time.")));
    } else {
      schedule.occurrences.slice().reverse().forEach(function (occurrence) {
        var row = el('article', 'ob-meetings-occurrence');
        row.dataset.occurrenceId = occurrence.id;
        if (occurrence.meetingId) row.dataset.meetingId = occurrence.meetingId;
        var rowCopy = el('div', 'ob-meetings-occurrence-copy');
        rowCopy.appendChild(el('strong', '', formatTime(occurrence.scheduledAt, true, schedule.timeZone) || tr('未记录时间',"Time not recorded")));
        var rowMeta = el('span', 'ob-meetings-occurrence-meta');
        rowMeta.appendChild(el('span', 'ob-meetings-occurrence-status ' + occurrenceStatusClass(occurrence.status), occurrenceStatusLabel(occurrence.status)));
        if (occurrence.startedAt) rowMeta.appendChild(el('span', '', tr('开始 ',"Started ") + formatTime(occurrence.startedAt, false, schedule.timeZone)));
        if (occurrence.endedAt) rowMeta.appendChild(el('span', '', tr('结束 ',"Ended ") + formatTime(occurrence.endedAt, false, schedule.timeZone)));
        rowCopy.appendChild(rowMeta);
        if (occurrence.error) rowCopy.appendChild(el('span', 'ob-meetings-occurrence-error', occurrence.error));
        row.appendChild(rowCopy);
        if (occurrence.meetingId) {
          var link = button('', 'ob-meetings-occurrence-link', tr('查看会议记录',"View meeting transcript"));
          link.dataset.meetingId = occurrence.meetingId;
          link.setAttribute('aria-label', tr('查看 ',"View ") + (formatTime(occurrence.scheduledAt, true, schedule.timeZone) || tr('这次',"this meeting")) + tr(' 的会议记录'," transcript"));
          link.addEventListener('click', function () { selectMeeting(occurrence.meetingId); });
          row.appendChild(link);
        }
        occurrences.appendChild(row);
      });
    }
    content.appendChild(occurrences);
    content.appendChild(el('p', 'ob-meetings-schedule-note', tr('重复规则按预约时区计算；到时需要 Bot Studio 正在运行。错过的预约不会补开；每月 31 日在没有该日期的月份跳过，夏令时不存在的本地时间跳过。',"Recurrence uses the scheduled time zone. Bot Studio must be running at that time. Missed meetings are skipped. Monthly meetings on the 31st skip months without that date; nonexistent local times during daylight saving changes are also skipped.")));
    if (mainError) content.appendChild(el('p', 'ob-meetings-inline-error', mainError));
    panel.appendChild(content);
    return panel;
  }

  function renderEmptyHome() {
    var panel = el('section', 'ob-meetings-empty');
    panel.appendChild(el('h3', 'ob-meetings-empty-title', tr('召集几个 Bot 开会',"Bring Bots together")));
    panel.appendChild(el('p', 'ob-meetings-empty-note', tr('选择 2–8 个可用 Bot，指定主持人，立即开始或安排时间讨论。会议结束后会保存完整记录和最终方案。',"Choose 2–8 available Bots and a chair. Start now or schedule a discussion. The full transcript and final proposal are saved when the meeting ends.")));
    var create = button('ob-meetings-empty-create', 'ob-meetings-primary', tr('新建会议',"New meeting"));
    create.addEventListener('click', function () {
      invalidateOperations();
      selectedMeetingId = '';
      selectedScheduleId = '';
      meetingView = null;
      closing = false;
      screen = 'new';
      render();
      focusTarget(document.getElementById('ob-meetings-new-title'));
    });
    panel.appendChild(create);
    if (mainError) panel.appendChild(el('p', 'ob-meetings-inline-error', mainError));
    dom.main.appendChild(panel);
  }

  function renderEmptyGroupChat() {
    var panel = el('section', 'ob-meetings-empty ob-group-chat-empty');
    panel.appendChild(el('h3', 'ob-meetings-empty-title', tr('群聊',"Chats")));
    panel.appendChild(el('p', 'ob-meetings-empty-note', tr('从左侧打开一个群聊，或新建群聊。',"Open a chat from the sidebar or start a new one.")));
    var create = button('ob-group-chat-empty-create', 'ob-meetings-primary', tr('新建群聊',"New chat"));
    create.addEventListener('click', startNewGroupChat);
    panel.appendChild(create);
    if (mainError) panel.appendChild(el('p', 'ob-meetings-inline-error', mainError));
    dom.main.appendChild(panel);
  }

  function renderOpeningGroupChat() {
    var panel = el('section', 'ob-meetings-empty ob-group-chat-opening');
    panel.setAttribute('role', 'status');
    panel.appendChild(el('p', 'ob-meetings-empty-note', tr('正在打开群聊…',"Opening chat…")));
    if (mainError) panel.appendChild(el('p', 'ob-meetings-inline-error', mainError));
    dom.main.appendChild(panel);
  }

  function renderNewMeeting() {
    var allowedIds = model.bots.filter(function (bot) { return !bot.unsupportedReason; }).map(function (bot) { return bot.id; });
    newDraft.participantBotIds = newDraft.participantBotIds.filter(function (botId) { return allowedIds.indexOf(botId) >= 0; });
    if (newDraft.participantBotIds.indexOf(newDraft.chairBotId) < 0) newDraft.chairBotId = newDraft.participantBotIds[0] || '';
    var panel = el('form', 'ob-meetings-new-panel');
    panel.id = 'ob-meetings-new-form';
    panel.addEventListener('submit', submitCreate);
    var create = null;
    function syncSubmitAvailability() {
      if (!create) return;
      var validStart = newDraft.timing === 'now' || !!newDraft.start;
      var valid = newDraft.title.trim() && newDraft.topic.trim() && newDraft.participantBotIds.length >= model.limits.minParticipants && newDraft.participantBotIds.length <= model.limits.maxParticipants && newDraft.chairBotId && validStart;
      create.disabled = !valid || busy;
      create.textContent = newDraft.timing === 'now' ? tr('创建会议',"Create meeting") : tr('保存预约',"Save schedule");
    }
    var top = el('div', 'ob-meetings-panel-heading');
    top.appendChild(el('h3', '', tr('新建会议',"New meeting")));
    top.appendChild(el('p', '', tr('可以立即开始，也可以预约一次或重复会议；结束后讨论记录仍会保留在归档中。',"Start now or schedule a one-time or recurring meeting. The discussion stays in the archive after it ends.")));
    panel.appendChild(top);

    var titleField = el('div', 'ob-meetings-field');
    var titleLabel = el('label', '', tr('会议名称',"Meeting name"));
    titleLabel.htmlFor = 'ob-meetings-new-title';
    var titleInput = el('input');
    titleInput.id = 'ob-meetings-new-title';
    titleInput.maxLength = 120;
    titleInput.required = true;
    titleInput.placeholder = tr('例如：Q4 产品方向讨论',"e.g. Q4 product planning");
    titleInput.value = newDraft.title;
    titleInput.addEventListener('input', function () { newDraft.title = titleInput.value; syncSubmitAvailability(); });
    wireComposition(titleInput);
    titleField.append(titleLabel, titleInput);
    panel.appendChild(titleField);

    var topicField = el('div', 'ob-meetings-field');
    var topicLabel = el('label', '', tr('讨论主题',"Discussion topic"));
    topicLabel.htmlFor = 'ob-meetings-new-topic';
    var topicInput = el('textarea');
    topicInput.id = 'ob-meetings-new-topic';
    topicInput.rows = 3;
    topicInput.maxLength = 8000;
    topicInput.required = true;
    topicInput.placeholder = tr('要一起解决什么问题？',"What should the group work through?");
    topicInput.value = newDraft.topic;
    topicInput.addEventListener('input', function () { newDraft.topic = topicInput.value; syncSubmitAvailability(); });
    wireComposition(topicInput);
    topicField.append(topicLabel, topicInput);
    panel.appendChild(topicField);

    if (['now', 'once', 'weekly', 'monthly'].indexOf(newDraft.timing) < 0) newDraft.timing = 'now';
    var timingField = el('div', 'ob-meetings-field ob-meetings-timing-field');
    var timingLabel = el('label', '', tr('开始时间',"Start time"));
    timingLabel.htmlFor = 'ob-meetings-new-timing';
    var timing = document.createElement('select');
    timing.id = 'ob-meetings-new-timing';
    [['now', tr('立即开会',"Start now")], ['once', tr('预约一次',"One time")], ['weekly', tr('每周',"Weekly")], ['monthly', tr('每月',"Monthly")]].forEach(function (item) {
      var option = el('option', '', item[1]);
      option.value = item[0];
      option.selected = item[0] === newDraft.timing;
      timing.appendChild(option);
    });
    timing.addEventListener('change', function () {
      newDraft.timing = timing.value;
      mainError = '';
      render();
      focusTarget(document.getElementById('ob-meetings-new-timing'));
    });
    timingField.append(timingLabel, timing);
    panel.appendChild(timingField);

    var scheduleFields = el('div', 'ob-meetings-schedule-fields');
    scheduleFields.id = 'ob-meetings-new-schedule-fields';
    scheduleFields.hidden = newDraft.timing === 'now';
    var startField = el('div', 'ob-meetings-field');
    var startLabel = el('label', '', tr('日期与时间',"Date and time"));
    startLabel.htmlFor = 'ob-meetings-new-start';
    var startInput = el('input');
    startInput.type = 'datetime-local';
    startInput.id = 'ob-meetings-new-start';
    startInput.min = nextLocalMinuteValue();
    startInput.value = newDraft.start;
    startInput.required = newDraft.timing !== 'now';
    startInput.disabled = newDraft.timing === 'now';
    startInput.addEventListener('input', function () { newDraft.start = startInput.value; syncSubmitAvailability(); });
    startField.append(startLabel, startInput);
    var timezoneField = el('div', 'ob-meetings-field ob-meetings-timezone-field');
    var timezoneLabel = el('label', '', tr('时区',"Time zone"));
    timezoneLabel.htmlFor = 'ob-meetings-new-timezone';
    var timezoneInput = el('input');
    timezoneInput.type = 'text';
    timezoneInput.id = 'ob-meetings-new-timezone';
    timezoneInput.value = localTimeZone();
    timezoneInput.readOnly = true;
    timezoneField.append(timezoneLabel, timezoneInput);
    scheduleFields.append(startField, timezoneField);
    scheduleFields.appendChild(el('p', 'ob-meetings-schedule-note', tr('使用本地时间；到时需要 Bot Studio 正在运行。错过的预约不会补开。每月 31 日在没有该日期的月份跳过，夏令时不存在的本地时间跳过。',"Uses local time. Bot Studio must be running at the scheduled time. Missed meetings are skipped. Monthly meetings on the 31st skip months without that date; nonexistent local times during daylight saving changes are also skipped.")));
    panel.appendChild(scheduleFields);

    var participantsField = el('fieldset', 'ob-meetings-field ob-meetings-participants-field');
    participantsField.appendChild(el('legend', '', tr('参会 Bot',"Participants")));
    participantsField.appendChild(el('p', 'ob-meetings-field-note', tr('至少 ',"Minimum ") + model.limits.minParticipants + tr(' 个，最多 ',", maximum ") + model.limits.maxParticipants + tr(' 个；暂不可用的 Bot 不可选择。',". Unavailable Bots cannot be selected.")));
    var participantList = el('div', 'ob-meetings-participant-options');
    var available = model.bots.filter(function (bot) { return !bot.unsupportedReason; });
    if (!available.length) participantList.appendChild(el('p', 'ob-meetings-muted', tr('当前没有可用的 Bot。',"No Bots available.")));
    model.bots.forEach(function (bot, index) {
      var label = el('label', 'ob-meetings-participant-option' + (bot.unsupportedReason ? ' is-disabled' : ''));
      var check = el('input');
      check.type = 'checkbox';
      check.id = 'ob-meetings-participant-' + index;
      check.value = bot.id;
      check.dataset.botId = bot.id;
      check.checked = newDraft.participantBotIds.indexOf(bot.id) >= 0;
      check.disabled = !!bot.unsupportedReason;
      check.addEventListener('change', function () {
        if (check.checked) {
          if (newDraft.participantBotIds.indexOf(bot.id) < 0) newDraft.participantBotIds.push(bot.id);
        } else {
          newDraft.participantBotIds = newDraft.participantBotIds.filter(function (value) { return value !== bot.id; });
        }
        if (newDraft.participantBotIds.indexOf(newDraft.chairBotId) < 0) newDraft.chairBotId = newDraft.participantBotIds[0] || '';
        syncSubmitAvailability();
        render();
      });
      var copy = el('span', 'ob-meetings-participant-copy');
      copy.appendChild(avatar(bot, 'mini'));
      var words = el('span', 'ob-meetings-participant-words');
      words.appendChild(el('strong', '', bot.name));
      words.appendChild(el('span', '', bot.unsupportedReason ? tr('暂不可用 · ',"Unavailable · ") + reasonLabel(bot.unsupportedReason) : (bot.model || tr('可参加',"Available"))));
      copy.appendChild(words);
      label.append(check, copy);
      participantList.appendChild(label);
    });
    participantsField.appendChild(participantList);
    panel.appendChild(participantsField);

    var chairField = el('div', 'ob-meetings-field');
    var chairLabel = el('label', '', tr('主持 Bot',"Chair Bot"));
    chairLabel.htmlFor = 'ob-meetings-new-chair';
    var chair = document.createElement('select');
    chair.id = 'ob-meetings-new-chair';
    chair.disabled = !newDraft.participantBotIds.length;
    newDraft.participantBotIds.forEach(function (botId) {
      var bot = botById(botId);
      if (!bot) return;
      var option = el('option', '', bot.name);
      option.value = bot.id;
      chair.appendChild(option);
    });
    if (newDraft.participantBotIds.indexOf(newDraft.chairBotId) < 0) newDraft.chairBotId = newDraft.participantBotIds[0] || '';
    chair.value = newDraft.chairBotId;
    chair.addEventListener('change', function () { newDraft.chairBotId = chair.value; syncSubmitAvailability(); });
    chairField.append(chairLabel, chair);
    panel.appendChild(chairField);

    var actions = el('div', 'ob-meetings-form-actions');
    var cancel = button('ob-meetings-new-cancel', 'ob-meetings-secondary', tr('返回会议列表',"Back to meetings"));
    cancel.addEventListener('click', function () { screen = 'home'; mainError = ''; render(); });
    create = button('ob-meetings-new-submit', 'ob-meetings-primary', tr('创建会议',"Create meeting"));
    create.type = 'submit';
    syncSubmitAvailability();
    actions.append(cancel, create);
    panel.appendChild(actions);
    if (mainError) panel.appendChild(el('p', 'ob-meetings-inline-error', mainError));
    dom.main.appendChild(panel);
  }

  function startNewGroupChat() {
    invalidateOperations();
    activeKind = 'group-chat';
    groupChatIntent = true;
    selectedMeetingId = '';
    selectedScheduleId = '';
    meetingView = null;
    closing = false;
    screen = 'group-new';
    groupChatDraft = { title: '', participantBotIds: [] };
    mainError = '';
    setStatus('');
    render({ preserveInput: false });
    focusTarget(document.getElementById('ob-group-chat-new-title'));
  }

  function renderNewGroupChat() {
    var allowedBots = model.bots.filter(function (bot) { return !bot.groupChatUnsupportedReason; });
    var allowedIds = allowedBots.map(function (bot) { return bot.id; });
    groupChatDraft.participantBotIds = groupChatDraft.participantBotIds.filter(function (botId) { return allowedIds.indexOf(botId) >= 0; });
    var minimum = Math.max(2, model.limits.minParticipants);
    var maximum = model.limits.groupParticipants;
    var panel = el('form', 'ob-meetings-new-panel ob-group-chat-new-panel');
    panel.id = 'ob-group-chat-new-form';
    panel.addEventListener('submit', submitCreateGroupChat);

    var top = el('div', 'ob-meetings-panel-heading');
    top.appendChild(el('h3', '', tr('新建群聊',"New chat")));
    top.appendChild(el('p', '', tr('选好 Bot 后即可进入群聊；创建时不会自动发送消息。',"Choose the Bots to include, then open the chat. Nothing is sent automatically.")));
    panel.appendChild(top);

    var titleField = el('div', 'ob-meetings-field');
    var titleLabel = el('label', '', tr('群名（可选）',"Chat name (optional)"));
    titleLabel.htmlFor = 'ob-group-chat-new-title';
    var titleInput = el('input');
    titleInput.id = 'ob-group-chat-new-title';
    titleInput.maxLength = 120;
    titleInput.autocomplete = 'off';
    titleInput.placeholder = tr('例如：产品讨论',"e.g. Product discussion");
    titleInput.value = groupChatDraft.title;
    titleInput.addEventListener('input', function () { groupChatDraft.title = titleInput.value; });
    wireComposition(titleInput);
    titleField.append(titleLabel, titleInput);
    panel.appendChild(titleField);

    var membersField = el('fieldset', 'ob-meetings-field ob-group-chat-members-field');
    membersField.appendChild(el('legend', '', tr('选择 Bot',"Choose Bots")));
    membersField.appendChild(el('p', 'ob-meetings-field-note', tr('至少选择 ',"Choose at least ") + minimum + tr(' 个可用 Bot。最多 ' ," available Bots. Up to ") + maximum + tr(' 个。暂不可用的 Bot 不可选择。',". Unavailable Bots cannot be selected.")));
    var participantList = el('div', 'ob-meetings-participant-options ob-group-chat-participant-options');
    if (!allowedBots.length) participantList.appendChild(el('p', 'ob-meetings-muted', tr('当前没有可用的 Bot。',"No Bots are currently available.")));
    var create = null;
    var count = el('p', 'ob-meetings-field-note ob-group-chat-selected-count');
    count.id = 'ob-group-chat-selected-count';
    function syncAvailability() {
      var chosen = groupChatDraft.participantBotIds.length;
      count.textContent = countLabel(chosen, ' 个 Bot', 'Bot');
      if (!create) return;
      create.disabled = chosen < minimum || chosen > maximum || busy;
    }
    model.bots.forEach(function (bot, index) {
      var label = el('label', 'ob-meetings-participant-option ob-group-chat-participant-option' + (bot.groupChatUnsupportedReason ? ' is-disabled' : ''));
      var check = el('input');
      check.type = 'checkbox';
      check.id = 'ob-group-chat-participant-' + index;
      check.name = 'participantBotIds';
      check.value = bot.id;
      check.dataset.botId = bot.id;
      check.checked = groupChatDraft.participantBotIds.indexOf(bot.id) >= 0;
      check.disabled = !!bot.groupChatUnsupportedReason || (!check.checked && groupChatDraft.participantBotIds.length >= maximum);
      check.addEventListener('change', function () {
        if (check.checked) {
          if (groupChatDraft.participantBotIds.indexOf(bot.id) < 0) groupChatDraft.participantBotIds.push(bot.id);
        } else {
          groupChatDraft.participantBotIds = groupChatDraft.participantBotIds.filter(function (value) { return value !== bot.id; });
        }
        mainError = '';
        render();
      });
      var copy = el('span', 'ob-meetings-participant-copy');
      copy.appendChild(avatar(bot, 'mini'));
      var words = el('span', 'ob-meetings-participant-words');
      words.appendChild(el('strong', '', bot.name));
      words.appendChild(el('span', '', bot.groupChatUnsupportedReason ? tr('暂不可用 · ',"Unavailable · ") + reasonLabel(bot.groupChatUnsupportedReason) : (bot.model || tr('可加入群聊',"Available for chats"))));
      copy.appendChild(words);
      label.append(check, copy);
      participantList.appendChild(label);
    });
    membersField.append(count, participantList);
    panel.appendChild(membersField);

    var actions = el('div', 'ob-meetings-form-actions');
    var cancel = button('ob-group-chat-new-cancel', 'ob-meetings-secondary', tr('取消',"Cancel"));
    cancel.addEventListener('click', function () { screen = 'home'; mainError = ''; render({ preserveInput: false }); });
    create = button('ob-group-chat-create', 'ob-meetings-primary', tr('创建并进入群聊',"Create and open chat"));
    create.type = 'submit';
    syncAvailability();
    actions.append(cancel, create);
    panel.appendChild(actions);
    if (mainError) panel.appendChild(el('p', 'ob-meetings-inline-error', mainError));
    dom.main.appendChild(panel);
  }

  function submitCreateGroupChat(event) {
    event.preventDefault();
    if (busy) return;
    var participantBotIds = groupChatDraft.participantBotIds.slice();
    var minimum = Math.max(2, model.limits.minParticipants);
    var maximum = model.limits.groupParticipants;
    if (participantBotIds.length < minimum || participantBotIds.length > maximum) {
      mainError = tr('请选择至少 2 个可用 Bot。',"Choose at least two available Bots.");
      render();
      return;
    }
    var args = {
      kind: 'group-chat',
      participantBotIds: participantBotIds,
      requestId: requestId('group-chat')
    };
    var title = text(groupChatDraft.title).trim();
    if (title) args.title = title;
    var operation = beginOperation('group-chat-create', '');
    mainError = '';
    setStatus(tr('正在创建群聊…',"Creating chat…"));
    render();
    call('meetingCreate', args).then(function (result) {
      if (!isCurrentOperation(operation)) return;
      var chatId = id(result && result.meetingId);
      endOperation(operation);
      if (!chatId) {
        mainError = tr('未能打开新群聊，请重试。',"Could not open the new chat. Try again.");
        setStatus(mainError, 'error');
        render();
        return;
      }
      if (onGroupCreated) {
        var assignGroup = onGroupCreated;
        onGroupCreated = null;
        assignGroup(chatId);
      }
      selectedMeetingId = chatId;
      selectedScheduleId = '';
      activeKind = 'group-chat';
      groupChatIntent = true;
      screen = 'home';
      meetingView = null;
      closing = false;
      groupChatDraft = { title: '', participantBotIds: [] };
      viewEpoch += 1;
      setStatus(result && result.duplicate ? tr('已打开群聊。',"Chat opened.") : tr('群聊已创建。',"Chat created."), 'ok');
      render();
      loadState(lifeEpoch, true);
    }).catch(function (error) {
      if (!isCurrentOperation(operation)) return;
      endOperation(operation);
      mainError = text(error && error.message, tr('创建群聊失败。',"Failed to create chat."));
      setStatus(mainError, 'error');
      render();
    });
  }

  function renderParticipants(summary) {
    var section = el('section', 'ob-meetings-participant-strip');
    section.setAttribute('aria-label', tr('参会 Bot',"Participants"));
    participantBots(summary).forEach(function (bot) {
      var person = el('div', 'ob-meetings-person' + (bot.id === summary.chairBotId ? ' is-chair' : ''));
      person.appendChild(avatar(bot, 'mini'));
      var copy = el('span', 'ob-meetings-person-copy');
      copy.appendChild(el('strong', '', bot.name));
      copy.appendChild(el('span', '', bot.id === summary.chairBotId ? tr('主持',"Chair") : (summary.temporaryBotIds||[]).indexOf(bot.id)>=0?tr('临时 · 离开页面退出','Temporary · leaves with page'):tr('参会',"Participant")));
      person.appendChild(copy);
      section.appendChild(person);
    });
    return section;
  }

  function renderRunBanner(summary) {
    var run = currentActiveRun();
    if (!run || !hasActiveRun()) return null;
    var banner = el('div', 'ob-meetings-run-banner');
    banner.dataset.runId = run.runId;
    banner.dataset.runStatus = run.status;
    banner.dataset.runKind = run.kind;
    var bot = botById(run.botId || run.speakerBotId || (summary && summary.chairBotId));
    var copy = el('div', 'ob-meetings-run-copy');
    var runLabel = run.stopping ? tr('正在停止',"Stopping") : run.kind === 'finish' ? tr('正在整理最终方案',"Preparing final proposal") : run.status === 'queued' ? tr('等待发言',"Waiting to speak") : tr('正在发言',"Speaking");
    var progress = run.totalSpeakers > 0 ? tr(' · 已完成 '," · Completed ") + run.completedSpeakers + '/' + run.totalSpeakers : '';
    copy.appendChild(el('strong', '', runLabel + ' · ' + nextRoundLabel(run) + progress));
    copy.appendChild(el('span', '', bot ? bot.name + (run.stopping ? tr(' 正在停止'," is stopping") : tr(' 正在参与讨论'," is joining the discussion")) : (run.stopping ? tr('Bot 正在停止',"Bot is stopping") : tr('Bot 正在参与讨论',"Bot is joining the discussion"))));
    if (run.progress) copy.appendChild(el('span', '', run.progress));
    banner.appendChild(copy);
    var stop = button('ob-meetings-stop-run', 'ob-meetings-stop', tr('停止这一轮',"Stop this round"));
    stop.disabled = busy || !run.runId || run.stopping || summary.status === 'closed';
    stop.addEventListener('click', function () { stopRun(run.runId); });
    banner.appendChild(stop);
    return banner;
  }

  function renderMessages(options) {
    options = options || {};
    var list = el('div', 'ob-meetings-messages');
    list.id = options.id || 'ob-meetings-messages';
    if (!meetingView.messages.length) {
      list.appendChild(el('p', 'ob-meetings-chat-empty', options.emptyText || tr('会议还没有发言。先告诉 Bot 你希望解决的问题。',"No messages yet. Tell the Bots what you want to resolve.")));
      return list;
    }
    meetingView.messages.forEach(function (message) {
      var row = el('article', 'ob-meetings-message');
      row.dataset.role = message.role;
      row.dataset.speakerBotId = message.speakerBotId;
      row.dataset.runId = message.runId;
      var bot = message.role === 'assistant' ? botById(message.speakerBotId) : null;
      if (bot) row.appendChild(avatar(bot, 'message'));
      else if (message.role === 'user' && !options.groupChat) row.appendChild(el('span', 'ob-meetings-user-avatar', tr('你',"You")));
      var body = el('div', 'ob-meetings-message-body');
      var meta = el('div', 'ob-meetings-message-meta');
      meta.appendChild(el('strong', '', speakerName(message)));
      var when = formatTime(message.at, false);
      if (when) meta.appendChild(el('span', '', when));
      body.appendChild(meta);
      body.appendChild(el('p', 'ob-meetings-message-text', message.text));
      row.appendChild(body);
      list.appendChild(row);
    });
    return list;
  }

  function renderDiscussion(summary) {
    var section = el('div', 'ob-meetings-discussion');
    var runBanner = renderRunBanner(summary);
    if (runBanner) section.appendChild(runBanner);
    var runError = latestFailedRunError();
    if (runError) section.appendChild(el('p', 'ob-meetings-run-error', runError));
    if (mainError && mainError !== runError) section.appendChild(el('p', 'ob-meetings-inline-error', mainError));
    section.appendChild(renderMessages());
    var composer = el('form', 'ob-meetings-composer');
    var input = el('textarea');
    input.id = 'ob-meetings-composer-input';
    input.rows = 1;
    input.maxLength = 8000;
    input.placeholder = summary.status === 'closed' ? tr('会议已归档，不能继续发言',"This meeting is archived. New messages are disabled.") : tr('输入要讨论的问题…',"Enter a topic to discuss…");
    input.disabled = summary.status !== 'open' || busy || closing || hasActiveRun();
    var draft = meetingDrafts[summary.id];
    input.value = draft === undefined ? '' : draft;
    input.addEventListener('input', function () { meetingDrafts[summary.id] = input.value; });
    input.addEventListener('keydown', function (event) {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        composer.requestSubmit ? composer.requestSubmit() : sendMessage(input.value);
      }
    });
    wireComposition(input);
    var send = button('ob-meetings-send', 'ob-meetings-primary', tr('发送',"Send"));
    send.type = 'submit';
    send.disabled = summary.status !== 'open' || busy || closing || hasActiveRun();
    composer.addEventListener('submit', function (event) {
      event.preventDefault();
      sendMessage(input.value);
    });
    composer.append(input, send);
    section.appendChild(composer);
    return section;
  }

  function renderGroupChatMembers(summary) {
    var section = el('section', 'ob-meetings-participant-strip ob-group-chat-members');
    section.setAttribute('aria-label', tr('群聊成员',"Chat members"));
    groupParticipantBots(summary).forEach(function (bot) {
      var member = el('div', 'ob-group-chat-member');
      member.appendChild(avatar(bot, 'mini'));
      member.appendChild(el('strong', '', bot.name));
      var origins = summary.sourceGroups.filter(group => group.participantBotIds.includes(bot.id));
      if (origins.length) {
        member.title = origins.map(function (group) {
          var peers = groupParticipantBots(summary).filter(peer => peer.id !== bot.id && group.participantBotIds.includes(peer.id));
          return group.title + (peers.length ? ' · ' + peers.map(peer => peer.name).join('、') : '');
        }).join('\n');
        member.tabIndex = 0;
        member.setAttribute('aria-label', bot.name + ' · ' + member.title);
      }
      section.appendChild(member);
    });
    return section;
  }

  function renderGroupChatRunBanner(summary) {
    var run = currentActiveRun();
    if (!run || !hasActiveRun()) return null;
    var banner = el('div', 'ob-meetings-run-banner ob-group-chat-run-banner');
    banner.dataset.runId = run.runId;
    banner.dataset.runStatus = run.status;
    var bot = botById(run.currentBotId || run.botId || run.speakerBotId);
    var copy = el('div', 'ob-meetings-run-copy');
    copy.appendChild(el('strong', '', run.stopping ? tr('正在停止',"Stopping") : tr('正在回复',"Replying")));
    copy.appendChild(el('span', '', bot ? bot.name : tr('群成员正在回复',"A chat member is replying")));
    if (run.progress) copy.appendChild(el('span', '', run.progress));
    banner.appendChild(copy);
    var stop = button('ob-group-chat-stop-run', 'ob-meetings-stop', tr('停止回复',"Stop reply"));
    stop.disabled = busy || !run.runId || run.stopping || summary.status !== 'open';
    stop.addEventListener('click', function () { stopRun(run.runId); });
    banner.appendChild(stop);
    return banner;
  }

  function renderGroupChatComposer(summary) {
    var composer = el('form', 'ob-meetings-composer ob-group-chat-composer');
    var input = el('textarea');
    input.id = 'ob-group-chat-composer-input';
    input.rows = 1;
    input.maxLength = 8000;
    input.setAttribute('aria-label', tr('给群聊发消息',"Message this chat"));
    input.placeholder = summary.status === 'open' ? tr('给群聊发消息…',"Message this chat…") : tr('群聊已关闭',"This chat is closed");
    input.disabled = summary.status !== 'open' || busy || closing || hasActiveRun();
    var draft = meetingDrafts[summary.id];
    input.value = draft === undefined ? '' : draft;
    input.addEventListener('input', function () { meetingDrafts[summary.id] = input.value; });
    input.addEventListener('keydown', function (event) {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        composer.requestSubmit ? composer.requestSubmit() : sendMessage(input.value);
      }
    });
    wireComposition(input);
    var send = button('ob-group-chat-send', 'ob-meetings-primary', tr('发送',"Send"));
    send.type = 'submit';
    send.disabled = summary.status !== 'open' || busy || closing || hasActiveRun();
    composer.addEventListener('submit', function (event) {
      event.preventDefault();
      sendMessage(input.value);
    });
    composer.append(input, send);
    return composer;
  }

  function groupReplyNote(error, summary) {
    if (!error) return '';
    var run = meetingView.runs.at(-1);
    var replies = meetingView.messages.filter(message => message.runId === run.runId && message.role === 'assistant');
    // A group replies in join order, existing members always keep their slots.
    var order = summary.participantBotIds;
    var knownTurn = run.kind === 'discussion' && replies.every((message, index) => message.speakerBotId === order[index]);
    var memberId = knownTurn ? order[replies.length] : null;
    var speaker = groupParticipantBots(summary).find(bot => bot.id === memberId);
    var name = speaker?.name || tr('这位伙伴', 'This member');
    if (error.includes('远端节点未连接') || error.includes('REMOTE_DISCONNECTED')) {
      return tr(name + ' 这次没连上。等它连上，再发条消息就好。',
        name + ' couldn’t connect this time. Send another message once it’s back.');
    }
    if (error.includes('节点版本') || error.includes('REMOTE_GROUP_CHAT_UNAVAILABLE')) {
      return tr(name + ' 在群里了。更新它所在设备上的 Bot Studio 后，它就可以一起聊了。',
        name + ' is in the chat. Update Bot Studio on its device so it can join the conversation.');
    }
    if (error.includes('节点未授权') || error.includes('REMOTE_GROUP_BOT_UNAVAILABLE')) {
      return tr(name + ' 还需要群聊发言权限。可以检查一下它的连接和授权。',
        name + ' needs permission to reply here. Check its connection and permissions.');
    }
    return tr('这次没等到完整的回复。你可以稍后再试。', 'The reply didn’t come through. You can try again in a little while.');
  }

  function renderGroupChat(summary) {
    var panel = el('section', 'ob-meetings-meeting ob-group-chat');
    panel.id = 'ob-group-chat-detail';
    panel.setAttribute('aria-label', tr('群聊',"Group chat"));
    var head = el('header', 'ob-meetings-meeting-head ob-group-chat-head');
    var copy = el('div', 'ob-meetings-meeting-copy');
    copy.appendChild(el('h3', '', groupChatTitle(summary)));
    copy.appendChild(el('span', 'ob-meetings-meeting-meta', countLabel(groupParticipantBots(summary).length, ' 个 Bot', 'Bot')));
    head.appendChild(copy);
    panel.appendChild(head);
    panel.appendChild(renderGroupChatMembers(summary));
    var runBanner = renderGroupChatRunBanner(summary);
    if (runBanner) panel.appendChild(runBanner);
    var runError = latestFailedRunError();

    if (mainError && mainError !== runError) panel.appendChild(el('p', 'ob-meetings-inline-error ob-group-chat-error', mainError));
    var messages = renderMessages({
      id: 'ob-group-chat-messages', groupChat: true,
      emptyText: tr('想聊点什么？', 'What’s on your mind?')
    });
    if (runError) {
      var note = el('p', 'ob-group-chat-reply-note', groupReplyNote(runError, summary));
      note.setAttribute('role', 'status');
      messages.appendChild(note);
    }
    panel.appendChild(messages);
    panel.appendChild(renderGroupChatComposer(summary));
    dom.main.appendChild(panel);
  }

  function renderProposal(summary) {
    var section = el('div', 'ob-meetings-proposal');
    var runBanner = renderRunBanner(summary);
    if (runBanner) section.appendChild(runBanner);
    var runError = latestFailedRunError();
    if (runError) section.appendChild(el('p', 'ob-meetings-run-error', runError));
    section.appendChild(el('h3', '', tr('最终方案',"Final proposal")));
    section.appendChild(el('p', 'ob-meetings-panel-note', summary.status === 'closed' ? tr('会议已归档，下面是本次会议保存的最终方案。',"This meeting is archived. Its saved final proposal is shown below.") : tr('可手动整理方案；留空时由主持 Bot 根据讨论内容总结。',"Write a proposal, or leave this blank for the chair Bot to summarize the discussion.")));
    if (summary.status === 'closed') {
      var proposal = meetingView.proposal;
      if (proposal && proposal.text) {
        section.appendChild(el('div', 'ob-meetings-proposal-readonly', proposal.text));
        var author = botById(proposal.authorBotId);
        var source = proposal.source === 'manual' ? tr('人工整理',"Written manually") : tr('主持 Bot 总结',"Summarized by chair Bot");
        section.appendChild(el('p', 'ob-meetings-proposal-meta', [source, author ? author.name : '', formatTime(proposal.at, true)].filter(Boolean).join(' · ')));
      } else {
        section.appendChild(el('p', 'ob-meetings-muted', tr('这次会议没有保存方案文本。',"No proposal text was saved for this meeting.")));
      }
      var exportButton = button('ob-meetings-export', 'ob-meetings-secondary', tr('导出会议记录 MD',"Export transcript as Markdown"));
      exportButton.disabled = busy;
      exportButton.addEventListener('click', exportMeeting);
      section.appendChild(el('div', 'ob-meetings-proposal-actions')).appendChild(exportButton);
      return section;
    }
    var textarea = el('textarea');
    textarea.id = 'ob-meetings-proposal-input';
    textarea.rows = 10;
    textarea.maxLength = 128000;
    textarea.placeholder = tr('整理结论、负责人或下一步行动…',"Summarize decisions, owners, or next steps…");
    var draft = Object.prototype.hasOwnProperty.call(proposalDrafts, summary.id) ? proposalDrafts[summary.id] : '';
    textarea.value = draft;
    textarea.disabled = busy || closing || hasActiveRun();
    textarea.addEventListener('input', function () {
      proposalDrafts[summary.id] = textarea.value;
      if (finish) finish.textContent = textarea.value.trim() ? tr('保存方案并结束',"Save proposal and end") : tr('结束并由主持总结',"End and let chair summarize");
    });
    wireComposition(textarea);
    section.appendChild(textarea);
    var actions = el('div', 'ob-meetings-proposal-actions');
    var back = button('ob-meetings-proposal-back', 'ob-meetings-secondary', tr('返回讨论',"Back to discussion"));
    back.disabled = busy || closing;
    back.addEventListener('click', function () { meetingTab = 'discussion'; render(); });
    var finish = button('ob-meetings-finish', 'ob-meetings-primary', draft.trim() ? tr('保存方案并结束',"Save proposal and end") : tr('结束并由主持总结',"End and let chair summarize"));
    finish.disabled = busy || closing || hasActiveRun();
    finish.addEventListener('click', function () {
      var currentDraft = textarea.value;
      proposalDrafts[summary.id] = currentDraft;
      finishMeeting(currentDraft);
    });
    actions.append(back, finish);
    section.appendChild(actions);
    if (mainError && mainError !== runError) section.appendChild(el('p', 'ob-meetings-inline-error', mainError));
    return section;
  }

  function renderMeeting() {
    var view = meetingView;
    if (!view || !view.meeting) {
      renderEmptyHome();
      return;
    }
    var summary = view.meeting;
    if (summary.kind === 'group-chat') {
      renderGroupChat(summary);
      return;
    }
    var panel = el('section', 'ob-meetings-meeting');
    var head = el('header', 'ob-meetings-meeting-head');
    var copy = el('div', 'ob-meetings-meeting-copy');
    copy.appendChild(el('h3', '', meetingTitle(summary)));
    if (summary.topic) copy.appendChild(el('p', '', summary.topic));
    copy.appendChild(el('span', 'ob-meetings-meeting-meta', countLabel(participantBots(summary).length,' 个 Bot','Bot')+tr(' · 主持 ',' · Chair: ') + chairName(summary)));
    head.appendChild(copy);
    var headActions = el('div', 'ob-meetings-meeting-actions');
    var status = el('span', 'ob-meetings-status-chip ' + statusClass(summary.status), statusLabel(summary.status));
    status.dataset.status = summary.status;
    headActions.appendChild(status);
    if(root.OpenBotTemporaryBots){root.OpenBotTemporaryBots.decorate(panel,{kind:'meeting',id:summary.id,label:meetingTitle(summary)},summary.status==='open'?headActions:null,40);if(summary.status!=='open')panel.setAttribute('aria-disabled','true');}
    if (summary.status === 'open') {
      var finish = button('ob-meetings-finish-open', 'ob-meetings-secondary', tr('结束会议',"End meeting"));
      finish.disabled = busy || closing;
      finish.addEventListener('click', function () { meetingTab = 'proposal'; render(); });
      headActions.appendChild(finish);
    }
    head.appendChild(headActions);
    panel.appendChild(head);
    panel.appendChild(renderParticipants(summary));
    var tabs = el('div', 'ob-meetings-tabs');
    var discussion = button('ob-meetings-tab-discussion', '', tr('讨论',"Discussion"));
    discussion.setAttribute('aria-selected', String(meetingTab === 'discussion'));
    var proposal = button('ob-meetings-tab-proposal', '', tr('最终方案',"Final proposal"));
    proposal.setAttribute('aria-selected', String(meetingTab === 'proposal'));
    discussion.addEventListener('click', function () { meetingTab = 'discussion'; render(); });
    proposal.addEventListener('click', function () { meetingTab = 'proposal'; render(); });
    tabs.append(discussion, proposal);
    panel.appendChild(tabs);
    if (meetingTab === 'proposal') panel.appendChild(renderProposal(summary));
    else panel.appendChild(renderDiscussion(summary));
    if (summary.status === 'closed') panel.appendChild(el('p', 'ob-meetings-archive-note', tr('已归档：会议记录可查看和导出，不能继续发言。',"Archived: view or export the transcript. New messages are disabled.")));
    dom.main.appendChild(panel);
  }

  function render(options) {
    if (!dom.main) return;
    mountSurface();
    applySurfaceChrome();
    var inputState = !(options && options.preserveInput === false) ? captureInputState() : null;
    renderList();
    dom.main.replaceChildren();
    if (screen === 'group-new' && activeKind === 'group-chat') renderNewGroupChat();
    else if (screen === 'new') renderNewMeeting();
    else if (isGroupSurface() && selectedMeetingId && !meetingView) renderOpeningGroupChat();
    else if (activeKind === 'group-chat' && !selectedMeetingId) renderEmptyGroupChat();
    else if (screen === 'schedule' && selectedScheduleId) {
      var schedule = scheduleModel.schedules.find(function (item) { return item.id === selectedScheduleId; });
      if (schedule) dom.main.appendChild(renderScheduleDetail(schedule));
      else renderEmptyHome();
    }
    else if (selectedMeetingId && meetingView) renderMeeting();
    else renderEmptyHome();
    if (statusMessage) setStatus(statusMessage, statusTone);
    restoreInputState(inputState);
  }

  function loadState(epoch, preserveStatus) {
    var read = ++stateReadSeq;
    var loadingMessage = isGroupSurface() ? tr('正在读取群聊…',"Loading chats…") : tr('正在读取会议记录…',"Loading meeting records…");
    if (!preserveStatus) setStatus(loadingMessage);
    return call('meetingState').then(function (value) {
      if (!open || epoch !== lifeEpoch || read !== stateReadSeq) return null;
      var wasPending = activeKind === 'pending';
      model = normalizeState(value);
      if (selectedMeetingId) {
        var foundGroupChat = model.groupChats.some(function (item) { return item.id === selectedMeetingId; });
        var foundMeeting = model.meetings.some(function (item) { return item.id === selectedMeetingId; });
        if (foundGroupChat) {
          activeKind = 'group-chat';
          groupChatIntent = true;
          selectedScheduleId = '';
          if (screen === 'opening') screen = 'home';
        } else if (foundMeeting && groupChatIntent) {
          selectedMeetingId = '';
          meetingView = null;
          activeKind = 'group-chat';
          screen = 'home';
          mainError = tr('这个群聊暂时不可用。',"This chat is unavailable.");
        } else if (foundMeeting) {
          activeKind = 'meeting';
          groupChatIntent = false;
          lastMeetingId = selectedMeetingId;
          if (screen === 'opening') screen = 'home';
        } else if (activeKind === 'pending' || activeKind === 'group-chat') {
          var expectedGroupChat = groupChatIntent;
          selectedMeetingId = '';
          meetingView = null;
          screen = 'home';
          if (expectedGroupChat) {
            activeKind = 'group-chat';
            mainError = tr('找不到这个群聊。',"This chat could not be found.");
          } else if (activeKind === 'pending') {
            activeKind = 'meeting';
            groupChatIntent = false;
          }
        } else {
          selectedMeetingId = '';
          meetingView = null;
          screen = 'home';
        }
      }
      if (!selectedMeetingId && screen !== 'new' && screen !== 'schedule' && screen !== 'group-new') screen = 'home';
      if (statusMessage === loadingMessage) setStatus('');
      render();
      if (wasPending && activeKind === 'meeting') loadSchedules(epoch, true);
      if (selectedMeetingId) return loadMeeting(selectedMeetingId, viewEpoch);
      return model;
    }).catch(function (error) {
      if (!open || epoch !== lifeEpoch || read !== stateReadSeq) return null;
      mainError = isGroupSurface()
        ? text(error && error.message, tr('读取群聊失败。',"Failed to load chats."))
        : combinedError(text(error && error.message, tr('读取会议记录失败。',"Failed to load meeting records.")));
      setStatus(mainError, 'error');
      render();
      return null;
    });
  }

  function loadSchedules(epoch, preserveStatus) {
    if (!bridge || typeof bridge.meetingScheduleState !== 'function') return Promise.resolve(scheduleModel);
    var read = ++scheduleReadSeq;
    if (!preserveStatus) setStatus(tr('正在读取预约…',"Loading schedules…"));
    return call('meetingScheduleState').then(function (value) {
      if (!open || epoch !== lifeEpoch || read !== scheduleReadSeq) return null;
      scheduleModel = normalizeScheduleState(value);
      var previousScheduleError = scheduleError;
      scheduleError = '';
      if (mainError === previousScheduleError) mainError = '';
      if (selectedScheduleId && !scheduleModel.schedules.some(function (item) { return item.id === selectedScheduleId; })) {
        selectedScheduleId = '';
        if (screen === 'schedule') screen = 'home';
      }
      if (statusMessage === tr('正在读取预约…',"Loading schedules…")) setStatus('');
      render();
      return scheduleModel;
    }).catch(function (error) {
      if (!open || epoch !== lifeEpoch || read !== scheduleReadSeq) return null;
      scheduleError = text(error && error.message, tr('读取预约失败。',"Failed to load schedules."));
      mainError = scheduleError;
      setStatus(mainError, 'error');
      render();
      return null;
    });
  }

  function loadMeeting(meetingId, epoch) {
    var targetId = id(meetingId);
    if (!targetId) return Promise.resolve(null);
    var read = ++meetingReadSeq;
    setStatus(isGroupSurface() ? tr('正在读取群聊…',"Loading chat…") : tr('正在读取会议…',"Loading meeting…"));
    return call('meetingView', { meetingId: targetId }).then(function (value) {
      if (!open || epoch !== viewEpoch || targetId !== selectedMeetingId || read !== meetingReadSeq) return null;
      var loadedView = normalizeMeeting(value);
      if (groupChatIntent && loadedView.meeting.kind !== 'group-chat') {
        selectedMeetingId = '';
        meetingView = null;
        activeKind = 'group-chat';
        screen = 'home';
        mainError = tr('这个群聊暂时不可用。',"This chat is unavailable.");
        setStatus(mainError, 'error');
        render();
        return null;
      }
      meetingView = loadedView;
      if (meetingView.meeting.kind === 'group-chat') {
        activeKind = 'group-chat';
        groupChatIntent = true;
      } else if (activeKind === 'pending') {
        activeKind = 'meeting';
        groupChatIntent = false;
      }
      if (activeKind === 'meeting') lastMeetingId = targetId;
      if (meetingView.meeting.status === 'closed') closing = false;
      else if (meetingView.meeting.status === 'closing') closing = true;
      else if (meetingView.meeting.status === 'open') closing = false;
      var currentMeetingId = meetingView.meeting.id;
      if (meetingView.proposal && meetingView.proposal.text && !Object.prototype.hasOwnProperty.call(proposalDrafts, currentMeetingId)) {
        proposalDrafts[currentMeetingId] = meetingView.proposal.text;
      }
      mainError = activeKind === 'group-chat' ? latestFailedRunError() : combinedError(latestFailedRunError());
      setStatus('');
      render();
      return meetingView;
    }).catch(function (error) {
      if (!open || epoch !== viewEpoch || targetId !== selectedMeetingId || read !== meetingReadSeq) return null;
      mainError = isGroupSurface()
        ? text(error && error.message, tr('读取群聊失败。',"Failed to load chat."))
        : combinedError(text(error && error.message, tr('读取会议失败。',"Failed to load meeting.")));
      setStatus(mainError, 'error');
      render();
      return null;
    });
  }

  function selectMeeting(meetingId) {
    invalidateOperations();
    selectedMeetingId = id(meetingId);
    lastMeetingId = selectedMeetingId;
    activeKind = 'meeting';
    groupChatIntent = false;
    selectedScheduleId = '';
    meetingView = null;
    closing = false;
    screen = 'home';
    meetingTab = 'discussion';
    mainError = scheduleError;
    viewEpoch += 1;
    render({ preserveInput: false });
    loadMeeting(selectedMeetingId, viewEpoch);
  }

  function selectSchedule(scheduleId) {
    invalidateOperations();
    activeKind = 'meeting';
    groupChatIntent = false;
    selectedScheduleId = id(scheduleId);
    selectedMeetingId = '';
    meetingView = null;
    closing = false;
    screen = 'schedule';
    mainError = scheduleError;
    render({ preserveInput: false });
  }

  function selectGroupChat(groupChatId) {
    invalidateOperations();
    selectedMeetingId = id(groupChatId);
    selectedScheduleId = '';
    activeKind = 'group-chat';
    groupChatIntent = true;
    meetingView = null;
    closing = false;
    screen = 'home';
    mainError = '';
    viewEpoch += 1;
    render({ preserveInput: false });
    loadMeeting(selectedMeetingId, viewEpoch);
  }

  function submitCreate(event) {
    event.preventDefault();
    if (busy) return;
    var participantBotIds = newDraft.participantBotIds.slice();
    if (!newDraft.title.trim() || !newDraft.topic.trim() || participantBotIds.length < model.limits.minParticipants || participantBotIds.length > model.limits.maxParticipants || participantBotIds.indexOf(newDraft.chairBotId) < 0) {
      mainError = tr('请填写会议名称、讨论主题，并选择符合数量要求的参会 Bot 与主持人。',"Enter a meeting name and topic, then choose the required number of participants and a chair.");
      setStatus(mainError, 'error');
      render();
      return;
    }
    var timing = ['now', 'once', 'weekly', 'monthly'].indexOf(newDraft.timing) >= 0 ? newDraft.timing : 'now';
    var startsAt = null;
    if (timing !== 'now') {
      try {
        startsAt = localDateTimeToIso(newDraft.start);
      } catch (error) {
        mainError = text(error && error.message, tr('请选择有效的预约时间。',"Choose a valid scheduled time."));
        setStatus(mainError, 'error');
        render();
        return;
      }
    }
    if (timing !== 'now') {
      var scheduleOperation = beginOperation('schedule-create', '', '');
      mainError = '';
      setStatus(tr('正在保存预约…',"Saving schedule…"));
      call('meetingScheduleCreate', {
        title: newDraft.title.trim(),
        topic: newDraft.topic.trim(),
        participantBotIds: participantBotIds,
        chairBotId: newDraft.chairBotId,
        startsAt: startsAt,
        timeZone: localTimeZone(),
        repeat: timing === 'once' ? 'once' : timing,
        requestId: requestId('schedule')
      }).then(function (result) {
        if (!isCurrentOperation(scheduleOperation)) return;
        endOperation(scheduleOperation);
        selectedMeetingId = '';
        selectedScheduleId = id(result && (result.scheduleId || result.id));
        meetingView = null;
        screen = selectedScheduleId ? 'schedule' : 'home';
        newDraft = { title: '', topic: '', participantBotIds: [], chairBotId: '', timing: 'now', start: '' };
        setStatus(result && result.duplicate ? tr('已打开已有预约。',"Existing schedule opened.") : tr('预约已创建。',"Schedule created."), 'ok');
        render();
        loadSchedules(lifeEpoch, true);
      }).catch(function (error) {
        if (!isCurrentOperation(scheduleOperation)) return;
        endOperation(scheduleOperation);
        mainError = text(error && error.message, tr('保存预约失败。',"Failed to save schedule."));
        setStatus(mainError, 'error');
        render();
      });
      return;
    }
    var operation = beginOperation('create', '');
    mainError = '';
    setStatus(tr('正在创建会议…',"Creating meeting…"));
    call('meetingCreate', {
      title: newDraft.title.trim(),
      topic: newDraft.topic.trim(),
      participantBotIds: participantBotIds,
      chairBotId: newDraft.chairBotId,
      requestId: requestId('create')
    }).then(function (result) {
      if (!isCurrentOperation(operation)) return;
      endOperation(operation);
      selectedMeetingId = id(result && result.meetingId);
      meetingView = null;
      screen = 'home';
      meetingTab = 'discussion';
      newDraft = { title: '', topic: '', participantBotIds: [], chairBotId: '', timing: 'now', start: '' };
      viewEpoch += 1;
      setStatus(result && result.duplicate ? tr('已打开已有会议。',"Existing meeting opened.") : tr('会议已创建。',"Meeting created."), 'ok');
      render();
      loadState(lifeEpoch, true);
    }).catch(function (error) {
      if (!isCurrentOperation(operation)) return;
      endOperation(operation);
      mainError = text(error && error.message, tr('创建会议失败。',"Failed to create meeting."));
      setStatus(mainError, 'error');
      render();
    });
  }

  function cancelSchedule(scheduleId) {
    var wanted = id(scheduleId);
    var schedule = scheduleModel.schedules.find(function (item) { return item.id === wanted; });
    if (!schedule || schedule.status !== 'active' || busy) return;
    var operation = beginOperation('schedule-cancel', '', wanted);
    mainError = '';
    setStatus(tr('正在取消后续预约…',"Canceling future occurrences…"));
    render();
    call('meetingScheduleCancel', { scheduleId: wanted }).then(function () {
      if (!isCurrentOperation(operation)) return;
      endOperation(operation);
      setStatus(tr('已取消后续预约。',"Future occurrences canceled."), 'ok');
      loadSchedules(lifeEpoch, true);
    }).catch(function (error) {
      if (!isCurrentOperation(operation)) return;
      endOperation(operation);
      mainError = text(error && error.message, tr('取消预约失败。',"Failed to cancel schedule."));
      setStatus(mainError, 'error');
      render();
    });
  }

  function sendMessage(value) {
    if (!meetingView || !meetingView.meeting || meetingView.meeting.status !== 'open' || busy || closing || hasActiveRun()) return;
    var body = text(value).trim();
    if (!body) return;
    var meetingId = meetingView.meeting.id;
    meetingDrafts[meetingId] = '';
    var operation = beginOperation('send', meetingId);
    mainError = '';
    setStatus(activeKind === 'group-chat' ? tr('正在发送消息…',"Sending message…") : tr('正在请求 Bot 发言…',"Requesting a Bot response…"));
    render({ preserveInput: false });
    call('meetingSend', { meetingId: meetingId, text: body, requestId: requestId('send') }).then(function () {
      if (!isCurrentOperation(operation)) return;
      endOperation(operation);
      setStatus('');
      loadMeeting(meetingId, viewEpoch);
    }).catch(function (error) {
      if (!isCurrentOperation(operation)) return;
      endOperation(operation);
      meetingDrafts[meetingId] = body;
      mainError = text(error && error.message, activeKind === 'group-chat' ? tr('发送失败，请重试。',"Message failed to send. Try again.") : tr('发送失败，会议仍可继续。',"Send failed. The meeting can continue."));
      setStatus(mainError, 'error');
      render();
    });
  }

  function stopRun(runId) {
    if (!meetingView || !meetingView.meeting || !runId || busy) return;
    var meetingId = meetingView.meeting.id;
    var operation = beginOperation('stop', meetingId);
    setStatus(activeKind === 'group-chat' ? tr('正在停止回复…',"Stopping reply…") : tr('正在停止这一轮…',"Stopping this round…"));
    render();
    call('meetingStop', { meetingId: meetingId, runId: id(runId) }).then(function () {
      if (!isCurrentOperation(operation)) return;
      endOperation(operation);
      setStatus(activeKind === 'group-chat' ? tr('已请求停止回复。',"Stop requested.") : tr('已请求停止。',"Stop requested."), 'ok');
      loadMeeting(meetingId, viewEpoch);
    }).catch(function (error) {
      if (!isCurrentOperation(operation)) return;
      endOperation(operation);
      mainError = text(error && error.message, activeKind === 'group-chat' ? tr('停止回复失败。',"Could not stop the reply.") : tr('停止失败。',"Failed to stop."));
      setStatus(mainError, 'error');
      render();
    });
  }

  function finishMeeting(value) {
    if (!meetingView || !meetingView.meeting || meetingView.meeting.status !== 'open' || busy || closing || hasActiveRun()) return;
    var meetingId = meetingView.meeting.id;
    var proposalText = text(value).trim();
    var operation = beginOperation('finish', meetingId);
    closing = true;
    mainError = '';
    setStatus(tr('正在结束会议并保存方案…',"Ending meeting and saving proposal…"));
    render();
    var args = { meetingId: meetingId, requestId: requestId('finish') };
    if (proposalText) args.proposalText = proposalText;
    call('meetingFinish', args).then(function () {
      if (!isCurrentOperation(operation)) return;
      endOperation(operation);
      setStatus(tr('会议正在归档，等待最终方案…',"Archiving meeting. Waiting for the final proposal…"), 'ok');
      loadMeeting(meetingId, viewEpoch);
      loadState(lifeEpoch, true);
    }).catch(function (error) {
      if (!isCurrentOperation(operation)) return;
      endOperation(operation);
      closing = false;
      mainError = text(error && error.message, tr('结束失败，会议仍保持进行中。',"Failed to end meeting. It remains in progress."));
      setStatus(mainError, 'error');
      render();
    });
  }

  function downloadText(filename, content) {
    var blob = new Blob([String(content || '')], { type: 'text/markdown;charset=utf-8' });
    var url = root.URL && root.URL.createObjectURL ? root.URL.createObjectURL(blob) : '';
    if (!url) throw new Error(tr('当前环境不支持导出文件。',"File export is unavailable in this environment."));
    var link = document.createElement('a');
    link.href = url;
    link.download = text(filename, 'meeting.md');
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { if (root.URL && root.URL.revokeObjectURL) root.URL.revokeObjectURL(url); }, 0);
  }

  function exportMeeting() {
    if (!meetingView || !meetingView.meeting || busy) return;
    var meetingId = meetingView.meeting.id;
    var operation = beginOperation('export', meetingId);
    setStatus(tr('正在准备会议记录…',"Preparing meeting transcript…"));
    render();
    call('meetingExport', { meetingId: meetingId }).then(function (result) {
      if (!isCurrentOperation(operation)) return;
      downloadText(result && result.filename, result && result.markdown);
      endOperation(operation);
      setStatus(tr('会议记录已导出。',"Meeting transcript exported."), 'ok');
      render();
    }).catch(function (error) {
      if (!isCurrentOperation(operation)) return;
      endOperation(operation);
      setStatus(text(error && error.message, tr('导出失败。',"Export failed.")), 'error');
      render();
    });
  }

  function handleChanged() {
    if (!open) return;
    if (composing) {
      refreshQueued = true;
      return;
    }
    var epoch = lifeEpoch;
    loadState(epoch, true);
  }

  function handleSchedulesChanged() {
    if (!open) return;
    if (composing) {
      scheduleRefreshQueued = true;
      return;
    }
    loadSchedules(lifeEpoch, true);
  }

  function closeDialog(options) {
    if (!open) return;
    options = options || {};
    open = false;
    onGroupCreated = null;
    lifeEpoch += 1;
    viewEpoch += 1;
    stateReadSeq += 1;
    meetingReadSeq += 1;
    scheduleReadSeq += 1;
    invalidateOperations();
    busy = false;
    closing = false;
    composing = false;
    refreshQueued = false;
    scheduleRefreshQueued = false;
    if (dom.overlay) {
      dom.overlay.hidden = true;
      dom.overlay.setAttribute('aria-hidden', 'true');
      mountSurfaceToBody();
    }
    setStatus('');
    var target = options.restoreFocus === false ? null : (focusBefore && focusBefore.isConnected ? focusBefore : null);
    focusBefore = null;
    focusTarget(target);
  }

  function openDialog(options) {
    options = options || {};
    if (!initialized) init(options);
    createModal();
    focusBefore = options.opener || document.activeElement;
    open = true;
    lifeEpoch += 1;
    viewEpoch += 1;
    stateReadSeq += 1;
    meetingReadSeq += 1;
    scheduleReadSeq += 1;
    onGroupCreated = options.newGroupChat && typeof options.onGroupCreated === 'function' ? options.onGroupCreated : null;
    var explicitMeeting = Object.prototype.hasOwnProperty.call(options, 'meetingId');
    if (options.newGroupChat) {
      activeKind = 'group-chat';
      groupChatIntent = true;
      selectedMeetingId = '';
      selectedScheduleId = '';
      groupChatDraft = { title: '', participantBotIds: [] };
      screen = 'group-new';
    } else if (explicitMeeting) {
      selectedMeetingId = id(options.meetingId);
      selectedScheduleId = '';
      groupChatIntent = !!options.groupChat;
      activeKind = selectedMeetingId ? (groupChatIntent ? 'group-chat' : 'pending') : 'meeting';
      screen = selectedMeetingId ? 'opening' : 'home';
    } else if (options.newMeeting) {
      activeKind = 'meeting';
      groupChatIntent = false;
      selectedMeetingId = '';
      selectedScheduleId = '';
      screen = 'new';
    } else if (options.scheduleId) {
      activeKind = 'meeting';
      groupChatIntent = false;
      selectedMeetingId = '';
      selectedScheduleId = id(options.scheduleId);
      screen = 'schedule';
    } else {
      activeKind = 'meeting';
      groupChatIntent = false;
      selectedMeetingId = lastMeetingId;
      if (selectedMeetingId) selectedScheduleId = '';
      screen = selectedMeetingId ? 'home' : (selectedScheduleId ? 'schedule' : 'home');
    }
    meetingTab = options.tab === 'proposal' ? 'proposal' : 'discussion';
    meetingView = null;
    mainError = '';
    invalidateOperations();
    closing = false;
    composing = false;
    refreshQueued = false;
    dom.overlay.hidden = false;
    dom.overlay.setAttribute('aria-hidden', 'false');
    render();
    var epoch = lifeEpoch;
    loadState(epoch);
    if (activeKind === 'meeting') loadSchedules(epoch, true);
    setTimeout(function () {
      if (activeKind === 'group-chat' && screen === 'group-new') focusTarget(document.getElementById('ob-group-chat-new-title'));
      else focusTarget(dom.close);
    }, 0);
  }

  function init(options) {
    if (initialized) return root.OpenBotMeetings;
    initialized = true;
    options = options || {};
    bridge = Object.prototype.hasOwnProperty.call(options, 'bridge')
      ? options.bridge
      : (options && typeof options.meetingState === 'function' ? options : (root.grokbot || null));
    createModal();
    root.addEventListener('openbot-temporary-bots-changed',handleChanged);
    if (bridge && typeof bridge.onMeetingsChanged === 'function') {
      try { unsubscribe = bridge.onMeetingsChanged(handleChanged); } catch (_) { unsubscribe = null; }
    }
    if (bridge && typeof bridge.onMeetingSchedulesChanged === 'function') {
      try { scheduleUnsubscribe = bridge.onMeetingSchedulesChanged(handleSchedulesChanged); } catch (_) { scheduleUnsubscribe = null; }
    }
    document.addEventListener('keydown', function (event) {
      if (!open || event.key !== 'Escape' || event.target.closest('.ob-bot-drag__dialog')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDialog();
    });
    return root.OpenBotMeetings;
  }

  root.OpenBotMeetings = {
    init: init,
    open: openDialog,
    close: closeDialog,
    getState: function () { return JSON.parse(JSON.stringify(model)); },
    getSchedules: function () { return JSON.parse(JSON.stringify(scheduleModel)); },
    refresh: handleChanged,
    getMeeting: function () { return meetingView ? JSON.parse(JSON.stringify(meetingView)) : null; },
    isGroupChatOpen: function () { return open && activeKind === 'group-chat'; }
  };
})(window);
