(function (root) {
  'use strict';

  var activeRoot = null;
  var context = null;
  var contextKey = '';
  var epoch = 0;
  var state = freshState();

  function tr(zh, en) {
    return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function' ? root.OpenBotI18n.t(zh, en) : zh;
  }

  function text(input, fallback) {
    if (input === undefined || input === null) return fallback === undefined ? '' : String(fallback);
    return String(input);
  }

  function element(tag, className, label) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (label !== undefined && label !== null) node.textContent = String(label);
    return node;
  }

  function append(parent, child) {
    if (child) parent.appendChild(child);
    return child;
  }

  function button(label, action, focusKey, className) {
    var node = element('button', className || 'ht-button ht-quiet', label);
    node.type = 'button';
    node.dataset.companyAction = action;
    if (focusKey) node.dataset.focusKey = focusKey;
    return node;
  }

  function freshState() {
    return {
      teamId: '',
      teamName: '',
      departments: [],
      accountId: '',
      call: null,
      errorText: null,
      status: null,
      statusLoaded: false,
      statusLoading: false,
      statusRefreshRequested: false,
      statusError: '',
      sources: [],
      sourcesLoaded: false,
      sourcesLoading: false,
      sourceId: '',
      sourceError: '',
      projects: [],
      projectsLoaded: false,
      projectError: '',
      documents: [],
      documentsLoaded: false,
      documentError: '',
      catalogLoading: false,
      catalogEpoch: 0,
      projectId: '',
      threads: [],
      threadsLoaded: false,
      threadsLoading: false,
      threadsEpoch: 0,
      threadsCursor: null,
      threadsTotal: null,
      threadError: '',
      selectedThreadId: '',
      selectedDocumentId: '',
      previewEpoch: 0,
      preview: null,
      reportProject: '',
      reportTitle: '',
      reportText: '',
      reportKind: 'work-report',
      reportVisibility: 'private',
      reportDepartmentId: '',
      reportEpoch: 0,
      reportLoading: false,
      visibility: 'private',
      departmentId: '',
      previewLoading: false,
      stageLoading: false,
      syncLoading: false,
      pauseLoading: false,
      retryingOperationId: '',
      notice: '',
      watchRequested: false,
      error: ''
    };
  }

  function resetState() {
    epoch += 1;
    state = freshState();
  }

  function captureFocus(panel) {
    var active = root.document.activeElement;
    if (!panel || !active || !panel.contains(active)) return null;
    var selection = null;
    try {
      selection = { start: active.selectionStart, end: active.selectionEnd, direction: active.selectionDirection };
    } catch (_) { selection = null; }
    return { key: active.getAttribute('data-focus-key'), selection: selection };
  }

  function restoreFocus(panel, snapshot) {
    if (!panel || !snapshot || !snapshot.key) return;
    var nodes = panel.querySelectorAll('[data-focus-key]');
    var target = null;
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i].getAttribute('data-focus-key') === snapshot.key) {
        target = nodes[i];
        break;
      }
    }
    if (!target || typeof target.focus !== 'function') return;
    try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
    if (snapshot.selection && typeof target.setSelectionRange === 'function') {
      try { target.setSelectionRange(snapshot.selection.start, snapshot.selection.end, snapshot.selection.direction); } catch (_) { /* Non-text controls have no selection range. */ }
    }
  }

  function bind(panel) {
    if (panel.dataset.companyDataBound === 'true') return;
    panel.dataset.companyDataBound = 'true';
    panel.addEventListener('click', handleClick);
    panel.addEventListener('change', handleChange);
    panel.addEventListener('input', handleInput);
  }

  function current(ticket) {
    return ticket === epoch && !!context && context.teamId === state.teamId;
  }

  function ticket() {
    return epoch;
  }

  function unwrap(response) {
    if (response && Object.prototype.hasOwnProperty.call(response, 'result')) return response.result;
    return response;
  }

  function invoke(action, input) {
    if (!state.call) return Promise.reject(new Error('HT_CLIENT_NOT_CONFIGURED'));
    try { return Promise.resolve(state.call(action, input || {})).then(unwrap); }
    catch (error) { return Promise.reject(error); }
  }

  function errorCopy(error) {
    if (state.errorText && typeof state.errorText === 'function') {
      try { return state.errorText(error); } catch (_) { /* Use the local generic message. */ }
    }
    var code = error && typeof error.code === 'string' ? error.code : '';
    if (/^(?:HT|ZC|ZW|ZWA)_[A-Z0-9_]{1,64}$/.test(code)) {
      return tr('操作未完成：' + code, 'The operation did not complete: ' + code);
    }
    return tr('操作未完成。请检查连接和权限后重试。', 'The operation did not complete. Check the connection and access, then try again.');
  }

  function clearMessages() {
    state.error = '';
    state.notice = '';
  }

  function updateReportField(name, value) {
    var fields = {
      project: 'reportProject',
      title: 'reportTitle',
      text: 'reportText',
      kind: 'reportKind',
      visibility: 'reportVisibility',
      department: 'reportDepartmentId'
    };
    var key = fields[name];
    if (!key || state[key] === value) return;
    state[key] = value;
    if (name === 'visibility' && value !== 'department') state.reportDepartmentId = '';
    var shouldRender = false;
    if (state.reportLoading) {
      state.reportEpoch += 1;
      state.reportLoading = false;
      shouldRender = true;
    }
    if (state.preview && state.preview.manualReport) {
      state.previewEpoch += 1;
      state.preview = null;
      shouldRender = true;
    }
    if (state.error) {
      state.error = '';
      shouldRender = true;
    }
    if (shouldRender) {
      clearMessages();
      render();
    }
  }

  function readStatus(force) {
    if (!state.teamId || !state.call) return Promise.resolve(null);
    if (state.statusLoading) {
      if (force) state.statusRefreshRequested = true;
      return Promise.resolve(null);
    }
    if (state.statusLoaded && !force) return Promise.resolve(state.status);
    var request = ticket();
    state.statusLoading = true;
    state.statusError = '';
    render();
    return invoke('collectionStatus', { teamId: state.teamId }).then(function (result) {
      if (!current(request)) return null;
      if (state.statusRefreshRequested) return null;
      if (result && result.teamId && result.teamId !== state.teamId) throw new Error('HT_STALE_REVISION');
      state.status = result && typeof result === 'object' ? result : null;
      state.statusLoaded = true;
      state.statusError = '';
      render();
      return state.status;
    }).catch(function (error) {
      if (current(request)) {
        state.statusLoaded = false;
        state.statusError = errorCopy(error);
        render();
      }
      return null;
    }).finally(function () {
      if (current(request)) {
        state.statusLoading = false;
        render();
        if (state.statusRefreshRequested) {
          state.statusRefreshRequested = false;
          readStatus(true);
        }
      }
    });
  }

  function loadSources() {
    if (state.sourcesLoading || !state.teamId) return;
    var request = ticket();
    clearMessages();
    state.sourcesLoading = true;
    state.sourceError = '';
    render();
    invoke('collectionSources', { teamId: state.teamId }).then(function (result) {
      if (!current(request)) return;
      state.sources = result && Array.isArray(result.sources) ? result.sources.filter(function (source) {
        return source && typeof source.id === 'string' && source.id.length > 0;
      }) : [];
      state.sourcesLoaded = true;
      if (!state.sources.some(function (source) { return source.id === state.sourceId; })) {
        state.sourceId = '';
        state.catalogEpoch += 1;
        state.catalogLoading = false;
        state.threadsEpoch += 1;
        state.threadsLoading = false;
        state.previewEpoch += 1;
        state.previewLoading = false;
        state.projects = [];
        state.projectsLoaded = false;
        state.documents = [];
        state.documentsLoaded = false;
        state.threads = [];
        state.threadsLoaded = false;
        state.threadsCursor = null;
        state.threadsTotal = null;
        state.selectedThreadId = '';
        state.selectedDocumentId = '';
        state.preview = null;
      }
      render();
    }).catch(function (error) {
      if (current(request)) {
        state.sourceError = errorCopy(error);
        render();
      }
    }).finally(function () {
      if (current(request)) {
        state.sourcesLoading = false;
        render();
      }
    });
  }

  function selectedSource() {
    for (var i = 0; i < state.sources.length; i += 1) {
      if (state.sources[i].id === state.sourceId) return state.sources[i];
    }
    return null;
  }

  function loadCatalog() {
    if (!state.sourceId || state.catalogLoading) return;
    var request = ticket();
    var sourceId = state.sourceId;
    var catalogRequest = ++state.catalogEpoch;
    clearMessages();
    state.catalogLoading = true;
    state.projects = [];
    state.projectsLoaded = false;
    state.projectError = '';
    state.documents = [];
    state.documentsLoaded = false;
    state.documentError = '';
    state.projectId = '';
    state.threads = [];
    state.threadsLoaded = false;
    state.threadsEpoch += 1;
    state.threadsLoading = false;
    state.threadsCursor = null;
    state.threadsTotal = null;
    state.threadError = '';
    state.selectedThreadId = '';
    state.selectedDocumentId = '';
    state.previewEpoch += 1;
    state.previewLoading = false;
    state.preview = null;
    render();
    return Promise.allSettled([
      invoke('collectionProjects', { teamId: state.teamId, sourceId: sourceId }),
      invoke('collectionDocuments', { teamId: state.teamId, sourceId: sourceId })
    ]).then(function (results) {
      if (!current(request) || sourceId !== state.sourceId || catalogRequest !== state.catalogEpoch) return;
      if (results[0].status === 'fulfilled') {
        var projectRows = results[0].value && Array.isArray(results[0].value.projects) ? results[0].value.projects : [];
        state.projects = projectRows.filter(function (project) { return project && typeof project.id === 'string' && project.id.length > 0; });
        state.projectsLoaded = true;
        if (!state.projects.some(function (project) { return project.id === state.projectId; })) state.projectId = '';
      } else {
        state.projectError = errorCopy(results[0].reason);
      }
      if (results[1].status === 'fulfilled') {
        var documentRows = results[1].value && Array.isArray(results[1].value.documents) ? results[1].value.documents : [];
        state.documents = documentRows.filter(function (document) { return document && typeof document.id === 'string' && document.id.length > 0; });
        state.documentsLoaded = true;
        if (!state.documents.some(function (document) { return document.id === state.selectedDocumentId; })) state.selectedDocumentId = '';
      } else {
        state.documentError = errorCopy(results[1].reason);
      }
      if (!state.selectedDocumentId && !state.selectedThreadId) state.preview = null;
      render();
    }).finally(function () {
      if (current(request) && sourceId === state.sourceId && catalogRequest === state.catalogEpoch) {
        state.catalogLoading = false;
        render();
      }
    });
  }

  function loadThreads(appendPage) {
    if (!state.sourceId || !state.projectsLoaded || state.catalogLoading || state.threadsLoading) return;
    var request = ticket();
    var sourceId = state.sourceId;
    var cursor = appendPage ? state.threadsCursor : null;
    var projectId = state.projectId;
    var threadsRequest = ++state.threadsEpoch;
    var input = { teamId: state.teamId, sourceId: sourceId };
    if (projectId) input.projectId = projectId;
    if (cursor) input.cursor = cursor;
    clearMessages();
    state.threadsLoading = true;
    state.threadError = '';
    render();
    invoke('collectionThreads', input).then(function (result) {
      if (!current(request) || sourceId !== state.sourceId || projectId !== state.projectId || threadsRequest !== state.threadsEpoch) return;
      var page = result && Array.isArray(result.items) ? result.items : (result && Array.isArray(result.threads) ? result.threads : []);
      page = page.filter(function (thread) { return thread && typeof thread.id === 'string' && thread.id.length > 0; });
      if (appendPage) {
        var seen = Object.create(null);
        state.threads.forEach(function (thread) { if (thread && thread.id) seen[thread.id] = true; });
        page.forEach(function (thread) {
          if (thread && thread.id && !seen[thread.id]) {
            seen[thread.id] = true;
            state.threads.push(thread);
          }
        });
      } else {
        state.threads = page.slice();
        state.selectedThreadId = '';
        state.selectedDocumentId = '';
        state.preview = null;
      }
      state.threadsCursor = result && result.nextCursor ? result.nextCursor : null;
      state.threadsTotal = Number.isFinite(Number(result && result.total)) ? Number(result.total) : null;
      state.threadsLoaded = true;
      render();
    }).catch(function (error) {
      if (current(request) && sourceId === state.sourceId && projectId === state.projectId && threadsRequest === state.threadsEpoch) {
        state.threadError = errorCopy(error);
        render();
      }
    }).finally(function () {
      if (current(request) && sourceId === state.sourceId && projectId === state.projectId && threadsRequest === state.threadsEpoch) {
        state.threadsLoading = false;
        render();
      }
    });
  }

  function selectedThread() {
    for (var i = 0; i < state.threads.length; i += 1) {
      if (state.threads[i] && state.threads[i].id === state.selectedThreadId) return state.threads[i];
    }
    return null;
  }

  function previewSelected() {
    var source = selectedSource();
    var thread = selectedThread();
    var documentId = state.selectedDocumentId;
    if (!source || (!thread && !documentId)) return;
    if (state.visibility === 'department' && !state.departmentId) {
      state.error = tr('请选择现有部门工作空间。', 'Choose an existing department workspace.');
      render();
      return;
    }
    var request = ticket();
    var previewRequest = ++state.previewEpoch;
    state.reportEpoch += 1;
    state.reportLoading = false;
    var visibility = state.visibility;
    var departmentId = state.departmentId;
    clearMessages();
    state.previewLoading = true;
    state.preview = null;
    state.watchRequested = false;
    render();
    var input = {
      teamId: state.teamId,
      sourceId: source.id,
      visibility: visibility
    };
    if (documentId) input.documentId = documentId;
    else input.threadId = thread.id;
    if (visibility === 'department') input.departmentId = departmentId;
    invoke('collectionPreview', input).then(function (result) {
      if (!current(request) || source.id !== state.sourceId ||
          previewRequest !== state.previewEpoch ||
          visibility !== state.visibility || departmentId !== state.departmentId ||
          (documentId && documentId !== state.selectedDocumentId) ||
          (!documentId && (!thread || thread.id !== state.selectedThreadId))) return;
      if (!result || !result.previewId || !result.record || !Array.isArray(result.record.messages)) {
        throw new Error('HT_PREVIEW_INVALID');
      }
      state.preview = {
        previewId: result.previewId,
        record: result.record,
        contentSha256: result.contentSha256 || '',
        sourceId: source.id,
        threadId: documentId ? '' : thread.id,
        documentId: documentId || '',
        visibility: visibility,
        departmentId: visibility === 'department' ? departmentId : ''
      };
      render();
    }).catch(function (error) {
      if (current(request) && previewRequest === state.previewEpoch && source.id === state.sourceId &&
          visibility === state.visibility && departmentId === state.departmentId &&
          (documentId ? documentId === state.selectedDocumentId : thread && thread.id === state.selectedThreadId)) {
        state.error = errorCopy(error);
        state.preview = null;
        render();
      }
    }).finally(function () {
      if (current(request) && previewRequest === state.previewEpoch) {
        state.previewLoading = false;
        render();
      }
    });
  }

  function previewReport() {
    if (state.reportLoading || state.stageLoading || state.syncLoading) return;
    var title = state.reportTitle.trim();
    var reportText = state.reportText.trim();
    var projectInput = state.reportProject.trim();
    var project = projectInput || title;
    var kind = state.reportKind;
    var visibility = state.reportVisibility;
    var departmentId = state.reportDepartmentId;
    if (!title) {
      state.error = tr('请填写记录标题。', 'Enter a title for this record.');
      render();
      return;
    }
    if (!reportText) {
      state.error = tr('请填写工作记录或汇报内容。', 'Enter the work record or report text.');
      render();
      return;
    }
    if (visibility === 'department' && !state.departments.some(function (department) { return department.id === departmentId; })) {
      state.error = tr('请选择现有部门工作空间。', 'Choose an existing department workspace.');
      render();
      return;
    }
    var request = ticket();
    var previewRequest = ++state.previewEpoch;
    var reportRequest = ++state.reportEpoch;
    state.previewLoading = false;
    state.preview = null;
    state.watchRequested = false;
    clearMessages();
    state.reportLoading = true;
    render();
    var input = {
      teamId: state.teamId,
      title: title,
      text: reportText,
      project: project,
      kind: kind,
      visibility: visibility
    };
    if (visibility === 'department') input.departmentId = departmentId;
    invoke('collectionReport', input).then(function (result) {
      if (!current(request) || reportRequest !== state.reportEpoch || previewRequest !== state.previewEpoch ||
          title !== state.reportTitle.trim() || reportText !== state.reportText.trim() ||
          projectInput !== state.reportProject.trim() || kind !== state.reportKind ||
          visibility !== state.reportVisibility || departmentId !== state.reportDepartmentId) return;
      if (!result || !result.previewId || !result.record || !Array.isArray(result.record.messages)) {
        throw new Error('HT_PREVIEW_INVALID');
      }
      state.preview = {
        previewId: result.previewId,
        record: result.record,
        contentSha256: result.contentSha256 || '',
        sourceId: '',
        threadId: '',
        documentId: '',
        manualReport: true,
        project: project,
        visibility: visibility,
        departmentId: visibility === 'department' ? departmentId : ''
      };
      render();
    }).catch(function (error) {
      if (current(request) && reportRequest === state.reportEpoch && previewRequest === state.previewEpoch) {
        state.error = errorCopy(error);
        state.preview = null;
        render();
      }
    }).finally(function () {
      if (current(request) && reportRequest === state.reportEpoch) {
        state.reportLoading = false;
        render();
      }
    });
  }

  function statusShape(result) {
    return !!(result && typeof result === 'object' && result.teamId && result.counts && Array.isArray(result.entries));
  }

  function confirmStage() {
    var preview = state.preview;
    if (!preview || state.stageLoading) return;
    var watch = !!state.watchRequested && !preview.manualReport;
    var request = ticket();
    clearMessages();
    state.stageLoading = true;
    render();
    invoke('collectionStage', { teamId: state.teamId, previewId: preview.previewId, watch: watch }).then(function (result) {
      if (!current(request)) return null;
      if (result && result.teamId && result.teamId !== state.teamId) throw new Error('HT_STALE_REVISION');
      state.preview = null;
      state.watchRequested = false;
      if (preview.manualReport) {
        state.reportProject = '';
        state.reportTitle = '';
        state.reportText = '';
      }
      state.notice = tr('已加入同步队列；同步结果仍待确认。', 'Added to the sync queue; the sync result is still pending confirmation.');
      if (statusShape(result)) state.status = result;
      return readStatus(true);
    }).catch(function (error) {
      if (current(request)) {
        state.error = errorCopy(error);
        render();
      }
      return null;
    }).finally(function () {
      if (current(request)) {
        state.stageLoading = false;
        render();
      }
    });
  }

  function syncNow() {
    if (state.syncLoading || state.stageLoading) return;
    var request = ticket();
    clearMessages();
    state.syncLoading = true;
    render();
    invoke('collectionSync', { teamId: state.teamId }).then(function (result) {
      if (!current(request)) return null;
      if (result && result.teamId && result.teamId !== state.teamId) throw new Error('HT_STALE_REVISION');
      state.notice = tr('同步请求已返回，正在读取服务器状态。', 'The sync request returned. Reading the server status.');
      if (statusShape(result)) state.status = result;
      return readStatus(true);
    }).catch(function (error) {
      if (current(request)) {
        state.error = errorCopy(error);
        render();
      }
      return readStatus(true);
    }).finally(function () {
      if (current(request)) {
        state.syncLoading = false;
        render();
      }
    });
  }

  function pauseWatching() {
    if (state.pauseLoading || !state.teamId) return;
    var request = ticket();
    clearMessages();
    state.pauseLoading = true;
    render();
    invoke('collectionPause', { teamId: state.teamId }).then(function (result) {
      if (!current(request)) return null;
      if (result && result.teamId && result.teamId !== state.teamId) throw new Error('HT_STALE_REVISION');
      state.notice = tr('已请求暂停资料持续同步，正在核对状态。', 'Continuous record sync pause requested. Checking its status.');
      if (statusShape(result)) state.status = result;
      return readStatus(true);
    }).catch(function (error) {
      if (current(request)) {
        state.error = errorCopy(error);
        render();
      }
      return readStatus(true);
    }).finally(function () {
      if (current(request)) {
        state.pauseLoading = false;
        render();
      }
    });
  }

  function retryOperation(operationId) {
    if (!operationId || state.retryingOperationId) return;
    var request = ticket();
    clearMessages();
    state.retryingOperationId = operationId;
    render();
    invoke('collectionRetry', { teamId: state.teamId, operationId: operationId }).then(function (result) {
      if (!current(request)) return null;
      if (result && result.teamId && result.teamId !== state.teamId) throw new Error('HT_STALE_REVISION');
      state.notice = tr('重试请求已返回，正在核对最新状态。', 'The retry request returned. Checking the latest status.');
      if (statusShape(result)) state.status = result;
      return readStatus(true);
    }).catch(function (error) {
      if (current(request)) {
        state.error = errorCopy(error);
        render();
      }
      return readStatus(true);
    }).finally(function () {
      if (current(request)) {
        state.retryingOperationId = '';
        render();
      }
    });
  }

  function counts() {
    var counts = state.status && state.status.counts || {};
    var entries = state.status && Array.isArray(state.status.entries) ? state.status.entries : [];
    function count(name, statusName) {
      if (Number.isFinite(Number(counts[name]))) return Math.max(0, Number(counts[name]));
      return entries.filter(function (entry) { return entry && entry.status === statusName; }).length;
    }
    return {
      total: Number.isFinite(Number(counts.total)) ? Math.max(0, Number(counts.total)) : entries.length,
      pending: count('pending', 'pending'),
      confirmed: count('confirmed', 'confirmed'),
      unknown: count('unknown', 'unknown'),
      rejected: count('rejected', 'rejected')
    };
  }

  function countLine(label, value) {
    var item = element('span', 'od-count');
    append(item, element('strong', '', String(value)));
    append(item, element('span', '', label));
    return item;
  }

  function statusLabel(status) {
    if (status === 'pending') return tr('待同步', 'Pending');
    if (status === 'confirmed') return tr('已确认', 'Confirmed');
    if (status === 'unknown') return tr('结果未知', 'Result unknown');
    if (status === 'rejected') return tr('被拒绝', 'Rejected');
    return status ? tr('状态：' + status, 'Status: ' + status) : tr('状态未知', 'Unknown status');
  }

  function kindLabel(kind) {
    if (kind === 'work-report') return tr('工作汇报', 'Work report');
    if (kind === 'work-record') return tr('工作记录', 'Work record');
    if (kind === 'conversation') return tr('对话', 'Conversation');
    if (kind === 'memory') return tr('记忆', 'Memory');
    if (kind === 'rule') return tr('规则', 'Rule');
    if (kind === 'skill') return tr('技能', 'Skill');
    return kind ? String(kind) : tr('资料', 'Record');
  }

  function visibilityLabel(visibility, departmentName) {
    if (visibility === 'team') return tr('全团队成员', 'Entire team');
    if (visibility === 'department') return departmentName || tr('指定部门', 'Selected department');
    return tr('仅本人', 'Private to me');
  }

  function departmentName(id) {
    for (var i = 0; i < state.departments.length; i += 1) {
      if (state.departments[i].id === id) return state.departments[i].name;
    }
    return '';
  }

  function appendHeading(parent) {
    var heading = element('div', 'od-heading');
    append(heading, element('h2', '', tr('团队资料', 'Team records')));
    append(heading, element('p', '', text(state.teamName)));
    append(parent, heading);
  }

  function appendStatus(parent) {
    var section = element('section', 'od-section');
    var head = element('div', 'od-section-head');
    append(head, element('h3', '', tr('同步状态', 'Sync status')));
    var refresh = button(state.statusLoading ? tr('正在读取…', 'Reading…') : tr('刷新状态', 'Refresh status'), 'refresh-status', 'company-refresh-status');
    if (state.statusLoading) refresh.disabled = true;
    append(head, refresh);
    append(section, head);
    if (!state.statusLoaded && !state.statusError) {
      append(section, element('p', 'od-muted', state.statusLoading ? tr('正在读取队列状态…', 'Reading queue status…') : tr('尚未读取队列状态。', 'Queue status has not been read.')));
    }
    if (state.statusError) append(section, element('p', 'od-error', state.statusError));
    if (state.statusLoaded && state.status) {
      var tally = counts();
      var countsLine = element('div', 'od-counts');
      append(countsLine, countLine(tr('全部', 'Total'), tally.total));
      append(countsLine, countLine(tr('待同步', 'Pending'), tally.pending));
      append(countsLine, countLine(tr('已确认', 'Confirmed'), tally.confirmed));
      append(countsLine, countLine(tr('结果未知', 'Unknown'), tally.unknown));
      append(countsLine, countLine(tr('被拒绝', 'Rejected'), tally.rejected));
      append(section, countsLine);

      var watchCount = Number(state.status.watchCount);
      var watchLine = element('div', 'od-watch-line');
      append(watchLine, element('p', 'od-muted', state.status.watching
        ? tr('资料持续同步正在运行。', 'Continuous record sync is active.')
        : watchCount > 0 ? tr('资料持续同步已暂停。', 'Continuous record sync is paused.') : tr('没有开启资料持续同步。', 'Continuous record sync is off.')));
      if (state.status.watching === true) {
        var pause = button(state.pauseLoading ? tr('正在暂停…', 'Pausing…') : tr('暂停持续同步', 'Pause continuous sync'), 'pause', 'company-pause');
        pause.disabled = state.pauseLoading;
        append(watchLine, pause);
      }
      append(section, watchLine);
      if (state.status.lastError) append(section, element('p', 'od-error', text(state.status.lastError)));

      var entries = Array.isArray(state.status.entries) ? state.status.entries : [];
      if (entries.length) {
        var list = element('div', 'od-queue');
        entries.forEach(function (entry, index) {
          if (!entry || typeof entry !== 'object') return;
          var row = element('article', 'od-queue-row');
          var main = element('div', 'od-row-main');
          append(main, element('strong', '', text(entry.title, tr('未命名记录', 'Untitled record'))));
          append(main, element('p', 'od-row-meta', kindLabel(entry.kind) + ' · ' + statusLabel(entry.status)));
          if (entry.error) append(main, element('p', 'od-error', text(entry.error)));
          if (entry.revision) append(main, element('p', 'od-row-meta', tr('版本 ', 'Revision ') + text(entry.revision)));
          append(row, main);
          if ((entry.status === 'unknown' || entry.status === 'rejected') && entry.operationId) {
            var retry = button(state.retryingOperationId === entry.operationId ? tr('正在重试…', 'Retrying…') : tr('重试', 'Retry'), 'retry', 'company-retry-' + index);
            retry.dataset.operationId = entry.operationId;
            retry.disabled = !!state.retryingOperationId;
            append(row, retry);
          }
          append(list, row);
        });
        append(section, list);
      } else {
        append(section, element('p', 'od-empty', tr('同步队列为空。', 'The sync queue is empty.')));
      }
      if (tally.pending > 0) {
        var syncActions = element('div', 'od-actions');
        var sync = button(state.syncLoading ? tr('正在同步…', 'Syncing…') : tr('立即同步', 'Sync now'), 'sync', 'company-sync', 'ht-button ht-primary');
        sync.disabled = state.syncLoading || state.stageLoading;
        append(syncActions, sync);
        append(section, syncActions);
      }
    }
    append(parent, section);
  }

  function appendManualReport(parent) {
    var section = element('section', 'od-section od-report-section');
    var head = element('div', 'od-section-head');
    append(head, element('h3', '', tr('手动工作记录或汇报', 'Manual work record or report')));
    append(section, head);
    append(section, element('p', 'od-muted', tr('填写标题和内容后先预览，再确认加入同步队列。项目留空时将使用标题作为项目名。', 'Enter a title and content, preview them, then confirm adding the record to the sync queue. If project is blank, the title becomes the project name.')));

    var fields = element('div', 'od-report-fields');
    function inputField(labelText, name, focusKey, value, maxLength) {
      var label = element('label', 'ht-field');
      append(label, element('span', '', labelText));
      var input = element('input');
      input.type = 'text';
      input.value = value;
      input.maxLength = maxLength;
      input.disabled = state.reportLoading || state.stageLoading;
      input.dataset.companyReportField = name;
      input.dataset.focusKey = focusKey;
      append(label, input);
      return label;
    }
    append(fields, inputField(tr('项目（可选）', 'Project (optional)'), 'project', 'company-report-project', state.reportProject, 240));
    append(fields, inputField(tr('标题', 'Title'), 'title', 'company-report-title', state.reportTitle, 180));

    var kindLabelNode = element('label', 'ht-field');
    append(kindLabelNode, element('span', '', tr('类型', 'Type')));
    var kindSelect = element('select');
    kindSelect.disabled = state.reportLoading || state.stageLoading;
    kindSelect.dataset.companyReportField = 'kind';
    kindSelect.dataset.focusKey = 'company-report-kind';
    [
      ['work-report', tr('工作汇报', 'Work report')],
      ['work-record', tr('工作记录', 'Work record')]
    ].forEach(function (item) {
      var option = element('option', '', item[1]);
      option.value = item[0];
      option.selected = state.reportKind === item[0];
      kindSelect.appendChild(option);
    });
    kindSelect.value = state.reportKind;
    append(kindLabelNode, kindSelect);
    append(fields, kindLabelNode);

    var visibilityLabelNode = element('label', 'ht-field');
    append(visibilityLabelNode, element('span', '', tr('可见范围', 'Visibility')));
    var visibilitySelect = element('select');
    visibilitySelect.disabled = state.reportLoading || state.stageLoading;
    visibilitySelect.dataset.companyReportField = 'visibility';
    visibilitySelect.dataset.focusKey = 'company-report-visibility';
    [
      ['private', tr('仅本人', 'Private to me')],
      ['team', tr('全团队', 'Entire team')],
      ['department', tr('指定部门', 'Department')]
    ].forEach(function (item) {
      var option = element('option', '', item[1]);
      option.value = item[0];
      option.selected = state.reportVisibility === item[0];
      visibilitySelect.appendChild(option);
    });
    visibilitySelect.value = state.reportVisibility;
    append(visibilityLabelNode, visibilitySelect);
    append(fields, visibilityLabelNode);

    var textLabel = element('label', 'ht-field od-report-wide');
    append(textLabel, element('span', '', tr('工作内容', 'Work details')));
    var textArea = element('textarea');
    textArea.rows = 4;
    textArea.maxLength = 32000;
    textArea.value = state.reportText;
    textArea.disabled = state.reportLoading || state.stageLoading;
    textArea.dataset.companyReportField = 'text';
    textArea.dataset.focusKey = 'company-report-text';
    textArea.placeholder = tr('记录进展、结果或后续事项…', 'Record progress, outcomes or next steps…');
    append(textLabel, textArea);
    append(fields, textLabel);

    if (state.reportVisibility === 'department') {
      var departmentLabel = element('label', 'ht-field od-report-wide');
      append(departmentLabel, element('span', '', tr('部门工作空间', 'Department workspace')));
      var departmentSelect = element('select');
      departmentSelect.disabled = state.reportLoading || state.stageLoading || !state.departments.length;
      departmentSelect.dataset.companyReportField = 'department';
      departmentSelect.dataset.focusKey = 'company-report-department';
      var placeholder = element('option', '', tr('选择部门', 'Choose a department'));
      placeholder.value = '';
      departmentSelect.appendChild(placeholder);
      state.departments.forEach(function (department) {
        var option = element('option', '', department.name);
        option.value = department.id;
        option.selected = department.id === state.reportDepartmentId;
        departmentSelect.appendChild(option);
      });
      departmentSelect.value = state.reportDepartmentId;
      append(departmentLabel, departmentSelect);
      append(fields, departmentLabel);
      if (!state.departments.length) append(section, element('p', 'od-muted', tr('当前团队没有可选的部门工作空间。', 'The selected team has no department workspaces to choose from.')));
    }

    append(section, fields);
    var actions = element('div', 'od-actions');
    var preview = button(state.reportLoading ? tr('正在生成预览…', 'Preparing preview…') : tr('预览记录', 'Preview record'), 'report-preview', 'company-report-preview', 'ht-button');
    preview.disabled = state.reportLoading || state.stageLoading || state.syncLoading;
    append(actions, preview);
    append(section, actions);
    append(parent, section);
  }

  function appendSources(parent) {
    var section = element('section', 'od-section');
    var head = element('div', 'od-section-head');
    append(head, element('h3', '', tr('从现有来源添加', 'Add from an existing source')));
    var load = button(state.sourcesLoaded ? tr('重新读取来源', 'Reload sources') : tr('读取来源', 'Read sources'), 'sources', 'company-sources');
    load.disabled = state.sourcesLoading;
    append(head, load);
    append(section, head);
    append(section, element('p', 'od-muted', tr('打开此页不会扫描对话。来源和会话只在你选择读取后列出。', 'Opening this page does not scan conversations. Sources and conversations are listed only when you choose to read them.')));
    if (state.sourceError) append(section, element('p', 'od-error', state.sourceError));
    if (state.sourcesLoading) append(section, element('p', 'od-muted', tr('正在读取可用来源…', 'Reading available sources…')));
    if (state.sourcesLoaded && !state.sources.length) append(section, element('p', 'od-empty', tr('没有可用的会话来源。', 'No conversation sources are available.')));

    if (state.sources.length) {
      var sourceLabel = element('label', 'ht-field od-source-field');
      append(sourceLabel, element('span', '', tr('来源', 'Source')));
      var sourceSelect = element('select');
      sourceSelect.dataset.companyChange = 'source';
      sourceSelect.dataset.focusKey = 'company-source';
      var placeholder = element('option', '', tr('选择来源', 'Choose a source'));
      placeholder.value = '';
      sourceSelect.appendChild(placeholder);
      state.sources.forEach(function (source) {
        var label = text(source.label, source.id);
        var runtime = text(source.runtime || source.sourceType);
        var status = text(source.status);
        var option = element('option', '', label + (runtime ? ' · ' + runtime : '') + (status ? ' · ' + status : ''));
        option.value = source.id;
        option.selected = source.id === state.sourceId;
        sourceSelect.appendChild(option);
      });
      sourceSelect.value = state.sourceId;
      append(sourceLabel, sourceSelect);
      append(section, sourceLabel);
      if (state.sourceId) {
        var catalogActions = element('div', 'od-actions');
        var readCatalog = button(state.catalogLoading ? tr('正在读取项目和资料…', 'Reading projects and records…') : state.projectsLoaded || state.documentsLoaded ? tr('重新读取项目和资料', 'Reload projects and records') : tr('读取项目和资料', 'Read projects and records'), 'catalog', 'company-catalog');
        readCatalog.disabled = state.catalogLoading;
        append(catalogActions, readCatalog);
        append(section, catalogActions);
        if (state.catalogLoading) append(section, element('p', 'od-muted', tr('正在读取所选来源的项目和工作资料…', 'Reading projects and work records from the selected source…')));

        if (state.projectError) append(section, element('p', 'od-error', tr('项目列表：', 'Projects: ') + state.projectError));
        if (state.documentError) append(section, element('p', 'od-error', tr('工作资料：', 'Work records: ') + state.documentError));

        if (state.projectsLoaded) {
          var projectLabel = element('label', 'ht-field od-source-field');
          append(projectLabel, element('span', '', tr('项目范围', 'Project')));
          var projectSelect = element('select');
          projectSelect.dataset.companyChange = 'project';
          projectSelect.dataset.focusKey = 'company-project';
          var unassigned = element('option', '', tr('未关联工程', 'Unassigned conversations'));
          unassigned.value = '';
          unassigned.selected = !state.projectId;
          projectSelect.appendChild(unassigned);
          state.projects.forEach(function (project) {
            var option = element('option', '', text(project.name, project.id));
            option.value = project.id;
            option.selected = project.id === state.projectId;
            projectSelect.appendChild(option);
          });
          projectSelect.value = state.projectId;
          append(projectLabel, projectSelect);
          append(section, projectLabel);

          var threadActions = element('div', 'od-actions');
          var readThreads = button(state.threadsLoading ? tr('正在读取会话…', 'Reading conversations…') : state.threadsLoaded ? tr('重新读取会话', 'Reload conversations') : tr('读取会话', 'Read conversations'), 'threads', 'company-threads');
          readThreads.disabled = state.threadsLoading || state.catalogLoading;
          append(threadActions, readThreads);
          if (state.threadsTotal !== null) append(threadActions, element('span', 'od-muted', tr('共 ', 'Total ') + state.threadsTotal));
          append(section, threadActions);
        }
        if (state.threadError) append(section, element('p', 'od-error', state.threadError));
        if (state.threadsLoading) append(section, element('p', 'od-muted', tr('正在读取所选项目的会话…', 'Reading conversations from the selected project…')));
        if (state.threadsLoaded && !state.threads.length) append(section, element('p', 'od-empty', tr('此项目范围没有可显示的会话。', 'There are no conversations in this project scope.')));
        if (state.threads.length) {
          var threadList = element('div', 'od-thread-list');
          state.threads.forEach(function (thread, index) {
            if (!thread || typeof thread.id !== 'string') return;
            var threadButton = button(text(thread.title, tr('未命名会话', 'Untitled conversation')), 'thread', 'company-thread-' + index, 'od-thread');
            threadButton.dataset.threadId = thread.id;
            threadButton.setAttribute('aria-current', thread.id === state.selectedThreadId ? 'true' : 'false');
            append(threadList, threadButton);
          });
          append(section, threadList);
          if (state.threadsCursor) {
            var more = button(state.threadsLoading ? tr('正在读取…', 'Reading…') : tr('读取更多会话', 'Load more conversations'), 'threads-more', 'company-threads-more');
            more.disabled = state.threadsLoading;
            append(section, more);
          }
        }

        if (state.documentsLoaded) {
          append(section, element('h4', 'od-subheading', tr('工作资料', 'Work records')));
          if (!state.documents.length) {
            append(section, element('p', 'od-empty', tr('此来源没有可显示的工作资料。', 'This source has no work records to show.')));
          } else {
            var documentList = element('div', 'od-document-list');
            state.documents.forEach(function (document, index) {
              var documentButton = button(text(document.title, tr('未命名资料', 'Untitled record')), 'document', 'company-document-' + index, 'od-document');
              documentButton.dataset.documentId = document.id;
              documentButton.setAttribute('aria-current', document.id === state.selectedDocumentId ? 'true' : 'false');
              append(documentButton, element('span', 'od-row-meta', kindLabel(document.kind)));
              append(documentList, documentButton);
            });
            append(section, documentList);
          }
        }
        if (state.selectedThreadId || state.selectedDocumentId) appendScopeControls(section);
      }
    }
    append(parent, section);
  }

  function appendScopeControls(parent) {
    var controls = element('div', 'od-scope');
    var visibility = element('label', 'ht-field');
    append(visibility, element('span', '', tr('可见范围', 'Visibility')));
    var select = element('select');
    select.dataset.companyChange = 'visibility';
    select.dataset.focusKey = 'company-visibility';
    [
      ['private', tr('仅本人', 'Private to me')],
      ['team', tr('全团队', 'Entire team')],
      ['department', tr('指定部门', 'Department')]
    ].forEach(function (item) {
      var option = element('option', '', item[1]);
      option.value = item[0];
      option.selected = state.visibility === item[0];
      select.appendChild(option);
    });
    append(visibility, select);
    append(controls, visibility);
    if (state.visibility === 'department') {
      var department = element('label', 'ht-field');
      append(department, element('span', '', tr('部门工作空间', 'Department workspace')));
      var departmentSelect = element('select');
      departmentSelect.dataset.companyChange = 'department';
      departmentSelect.dataset.focusKey = 'company-department';
      var placeholder = element('option', '', tr('选择部门', 'Choose a department'));
      placeholder.value = '';
      departmentSelect.appendChild(placeholder);
      state.departments.forEach(function (item) {
        var option = element('option', '', item.name);
        option.value = item.id;
        option.selected = item.id === state.departmentId;
        departmentSelect.appendChild(option);
      });
      departmentSelect.value = state.departmentId;
      append(department, departmentSelect);
      append(controls, department);
      if (!state.departments.length) append(controls, element('p', 'od-muted', tr('当前团队没有可选的部门工作空间。', 'The selected team has no department workspaces to choose from.')));
    }
    append(parent, controls);
    var preview = button(state.previewLoading ? tr('正在生成预览…', 'Preparing preview…') : tr('预览所选内容', 'Preview selected item'), 'preview', 'company-preview', 'ht-button');
    preview.disabled = state.previewLoading || (state.visibility === 'department' && !state.departmentId);
    append(parent, preview);
  }

  function appendPreview(parent) {
    if (!state.preview) return;
    var preview = state.preview;
    var record = preview.record || {};
    var source = selectedSource();
    var section = element('section', 'od-preview');
    append(section, element('h3', '', tr('核对预览', 'Review preview')));
    var details = element('dl', 'od-destination');
    var detailRows = [
      [tr('目标团队', 'Team'), state.teamName],
      [tr('服务器', 'Server'), text(state.status && state.status.nodeURL, tr('由团队服务配置', 'Configured team service'))]
    ];
    if (preview.manualReport) {
      detailRows.push([tr('项目', 'Project'), preview.project || tr('未指定项目', 'No project specified')]);
    } else {
      detailRows.push([tr('来源', 'Source'), source ? text(source.label, source.id) : preview.sourceId]);
    }
    detailRows = detailRows.concat([
      [tr('可见范围', 'Visibility'), visibilityLabel(preview.visibility, departmentName(preview.departmentId))],
      [tr('记录', 'Record'), text(record.title, tr('未命名记录', 'Untitled record'))],
      [tr('类型', 'Type'), kindLabel(record.kind)]
    ]);
    detailRows.forEach(function (pair) {
      var row = element('div', 'od-destination-row');
      append(row, element('dt', '', pair[0]));
      append(row, element('dd', '', pair[1]));
      append(details, row);
    });
    append(section, details);
    if (record.coverage && record.coverage.status) {
      append(section, element('p', record.coverage.status === 'partial' ? 'od-error' : 'od-muted',
        record.coverage.status === 'partial'
          ? tr('预览内容不完整：请核对可用范围后再加入队列。', 'The preview is incomplete. Review its coverage before adding it to the queue.')
          : tr('预览内容范围已显示。', 'The preview coverage is shown.')));
      if (record.coverage.reason) append(section, element('p', 'od-row-meta', text(record.coverage.reason)));
    }
    var messages = element('div', 'od-preview-messages');
    (Array.isArray(record.messages) ? record.messages : []).forEach(function (message) {
      var item = element('article', 'od-preview-message');
      var role = message && message.role === 'assistant' ? tr('助手', 'Assistant') : tr('用户', 'User');
      append(item, element('strong', '', role));
      append(item, element('p', '', text(message && message.text)));
      messages.appendChild(item);
    });
    if (!record.messages || !record.messages.length) append(messages, element('p', 'od-empty', tr('预览中没有可显示的消息。', 'The preview contains no displayable messages.')));
    append(section, messages);
    var confirm = element('div', 'od-confirm');
    if (!preview.manualReport) {
      var watch = element('label', 'ht-check');
      var watchInput = element('input');
      watchInput.type = 'checkbox';
      watchInput.checked = state.watchRequested;
      watchInput.dataset.companyWatch = 'true';
      watchInput.dataset.companyChange = 'watch';
      watchInput.dataset.focusKey = 'company-watch';
      append(watch, watchInput);
      append(watch, element('span', '', tr('持续同步这条资料（每30秒检查，可暂停）', 'Keep this record in sync (checks every 30s; pausable)')));
      append(confirm, watch);
    }
    var destinationReady = !!(state.statusLoaded && state.status && typeof state.status.nodeURL === 'string' && state.status.nodeURL.trim());
    if (!destinationReady) {
      append(confirm, element('p', 'od-error', tr('同步目标尚未验证。刷新状态并确认服务器地址后，才能加入队列。', 'The sync destination is not verified yet. Refresh status and confirm the server address before adding this item to the queue.')));
    }
    var confirmationCopy;
    if (preview.manualReport || !state.watchRequested) {
      confirmationCopy = tr(
        '核对以上目标、范围和内容后，确认加入同步队列。之后需要手动开始同步。',
        'Review the destination, scope and content, then add this item to the queue. You can start syncing manually afterward.'
      );
    } else {
      confirmationCopy = tr(
        '核对以上目标、范围和内容后，确认加入队列。加入后会每30秒检查并同步更新，可随时暂停。也可点击“立即同步”马上上传。',
        'Review the destination, scope and content, then confirm. Updates are checked and synced every 30 seconds after you add this item; you can pause at any time. Select “Sync now” to upload immediately.'
      );
    }
    append(confirm, element('p', 'od-muted', confirmationCopy));
    var stage = button(state.stageLoading ? tr('正在加入队列…', 'Adding to queue…') : tr('确认加入同步队列', 'Add to sync queue'), 'stage', 'company-stage', 'ht-button ht-primary');
    stage.disabled = state.stageLoading || state.syncLoading || !destinationReady;
    append(confirm, stage);
    append(section, confirm);
    append(parent, section);
  }

  function render() {
    if (!activeRoot || !activeRoot.isConnected) return;
    var focus = captureFocus(activeRoot);
    var oldThreadList = activeRoot.querySelector('.od-thread-list');
    var threadScroll = oldThreadList ? oldThreadList.scrollTop : 0;
    var oldMessages = activeRoot.querySelector('.od-preview-messages');
    var messageScroll = oldMessages ? oldMessages.scrollTop : 0;
    var panel = element('div', 'od-panel');
    panel.setAttribute('aria-busy', String(state.statusLoading || state.sourcesLoading || state.threadsLoading || state.previewLoading || state.reportLoading || state.stageLoading || state.syncLoading || state.pauseLoading));
    appendHeading(panel);
    if (state.notice) append(panel, element('p', 'od-notice', state.notice));
    if (state.error) append(panel, element('p', 'od-error', state.error));
    appendStatus(panel);
    appendManualReport(panel);
    if (state.preview && state.preview.manualReport) appendPreview(panel);
    appendSources(panel);
    if (!state.preview || !state.preview.manualReport) appendPreview(panel);
    activeRoot.replaceChildren(panel);
    var newThreadList = activeRoot.querySelector('.od-thread-list');
    if (newThreadList) newThreadList.scrollTop = threadScroll;
    var newMessages = activeRoot.querySelector('.od-preview-messages');
    if (newMessages) newMessages.scrollTop = messageScroll;
    restoreFocus(panel, focus);
  }

  function handleClick(event) {
    event.stopPropagation();
    var target = event.target && event.target.closest ? event.target.closest('[data-company-action]') : null;
    if (!target || !activeRoot || !activeRoot.contains(target) || target.disabled) return;
    var action = target.dataset.companyAction;
    if (action === 'refresh-status') { readStatus(true); return; }
    if (action === 'sources') { loadSources(); return; }
    if (action === 'catalog') { loadCatalog(); return; }
    if (action === 'threads') { loadThreads(false); return; }
    if (action === 'threads-more') { loadThreads(true); return; }
    if (action === 'report-preview') { previewReport(); return; }
    if (action === 'thread') {
      if (target.dataset.threadId !== state.selectedThreadId) {
        clearMessages();
        state.previewEpoch += 1;
        state.previewLoading = false;
        state.selectedThreadId = target.dataset.threadId || '';
        state.selectedDocumentId = '';
        state.preview = null;
        render();
      }
      return;
    }
    if (action === 'document') {
      if (target.dataset.documentId !== state.selectedDocumentId) {
        clearMessages();
        state.previewEpoch += 1;
        state.previewLoading = false;
        state.selectedDocumentId = target.dataset.documentId || '';
        state.selectedThreadId = '';
        state.preview = null;
        render();
      }
      return;
    }
    if (action === 'preview') { previewSelected(); return; }
    if (action === 'stage') { confirmStage(); return; }
    if (action === 'sync') { syncNow(); return; }
    if (action === 'pause') { pauseWatching(); return; }
    if (action === 'retry') { retryOperation(target.dataset.operationId); }
  }

  function handleChange(event) {
    event.stopPropagation();
    var target = event.target;
    if (!target || !activeRoot || !activeRoot.contains(target)) return;
    if (target.dataset.companyChange === 'watch') {
      state.watchRequested = !!target.checked;
      render();
      return;
    }
    if (target.dataset.companyReportField) {
      var reportField = target.dataset.companyReportField;
      updateReportField(reportField, target.value || '');
      if (reportField === 'visibility') render();
      return;
    }
    if (target.dataset.companyChange === 'source') {
      clearMessages();
      state.sourceId = target.value || '';
      state.catalogEpoch += 1;
      state.projects = [];
      state.projectsLoaded = false;
      state.projectError = '';
      state.documents = [];
      state.documentsLoaded = false;
      state.documentError = '';
      state.catalogLoading = false;
      state.projectId = '';
      state.threadsEpoch += 1;
      state.threads = [];
      state.threadsLoaded = false;
      state.threadsLoading = false;
      state.threadsCursor = null;
      state.threadsTotal = null;
      state.threadError = '';
      state.selectedThreadId = '';
      state.selectedDocumentId = '';
      state.previewEpoch += 1;
      state.previewLoading = false;
      state.preview = null;
      render();
      return;
    }
    if (target.dataset.companyChange === 'project') {
      clearMessages();
      state.projectId = target.value || '';
      state.threadsEpoch += 1;
      state.threadsLoading = false;
      state.threads = [];
      state.threadsLoaded = false;
      state.threadsCursor = null;
      state.threadsTotal = null;
      state.threadError = '';
      state.selectedThreadId = '';
      state.previewEpoch += 1;
      state.previewLoading = false;
      if (!state.preview || !state.preview.documentId) state.preview = null;
      render();
      return;
    }
    if (target.dataset.companyChange === 'visibility') {
      clearMessages();
      state.visibility = target.value;
      state.departmentId = '';
      state.previewEpoch += 1;
      state.previewLoading = false;
      state.preview = null;
      render();
      return;
    }
    if (target.dataset.companyChange === 'department') {
      clearMessages();
      state.departmentId = target.value || '';
      state.previewEpoch += 1;
      state.previewLoading = false;
      state.preview = null;
      render();
    }
  }

  function handleInput(event) {
    event.stopPropagation();
    var target = event.target;
    if (!target || !activeRoot || !activeRoot.contains(target) || !target.dataset.companyReportField) return;
    updateReportField(target.dataset.companyReportField, target.value || '');
  }

  function mount(target, nextContext) {
    if (!nextContext || !nextContext.teamId || typeof nextContext.call !== 'function') {
      if (contextKey) resetState();
      contextKey = '';
      context = null;
      activeRoot = null;
      return;
    }
    var nextKey = [nextContext.sessionId || '', nextContext.accountId || '', nextContext.teamId].join('|');
    if (nextKey !== contextKey) {
      resetState();
      contextKey = nextKey;
      state.teamId = nextContext.teamId;
    }
    context = nextContext;
    state.teamId = nextContext.teamId;
    state.teamName = text(nextContext.teamName);
    state.accountId = text(nextContext.accountId);
    state.departments = Array.isArray(nextContext.departments) ? nextContext.departments.filter(function (item) {
      return item && typeof item.id === 'string' && typeof item.name === 'string';
    }).map(function (item) { return { id: item.id, name: item.name }; }) : [];
    function hasDepartment(id) {
      return !!id && state.departments.some(function (item) { return item.id === id; });
    }
    var staleDepartmentPreview = state.preview && state.preview.visibility === 'department' && !hasDepartment(state.preview.departmentId);
    var staleDepartmentRequest = state.reportLoading && state.reportVisibility === 'department' && !hasDepartment(state.reportDepartmentId);
    if (state.departmentId && !hasDepartment(state.departmentId)) state.departmentId = '';
    if (state.reportDepartmentId && !hasDepartment(state.reportDepartmentId)) state.reportDepartmentId = '';
    if (staleDepartmentPreview || staleDepartmentRequest) {
      state.previewEpoch += 1;
      state.reportEpoch += 1;
      state.preview = null;
      state.previewLoading = false;
      state.reportLoading = false;
      state.error = tr('部门工作空间已变化，请重新选择并预览。', 'The department workspace changed. Choose it again and prepare a new preview.');
    }
    state.call = nextContext.call;
    state.errorText = nextContext.errorText;
    activeRoot = target || null;
    if (!activeRoot) return;
    bind(activeRoot);
    render();
    if (!state.statusLoaded && !state.statusLoading) readStatus(false);
  }

  root.OpenBotCompanyData = { mount: mount };
})(window);
