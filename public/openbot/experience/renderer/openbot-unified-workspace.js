/* Unified BOT / project / file navigation and workspace detail surfaces. */
(function (root) {
  'use strict';

  var VIEWS = ['bots', 'projects', 'files'];
  var viewLabels = {
    bots: ['BOT', 'BOTs'],
    projects: ['会话', 'Sessions'],
    files: ['文件', 'Files']
  };
  var executorBrands = {
    dsh: 'dsh', pi: 'pi', legacy: 'legacy', codex: 'codex', claude: 'claude', gemini: 'gemini', kimi: 'kimi', qwen: 'qwen',
    grok: 'grok', agy: 'agy', opencode: 'opencode', 'cursor-agent': 'cursor-agent', goose: 'goose', copilot: 'copilot',
    amp: 'amp', aider: 'aider', codebuddy: 'codebuddy', cline: 'cline'
  };
  var relationLabels = {
    bot_owns_project: ['负责项目', 'Owns project'],
    bot_participates_project: ['参与项目', 'Participates in project'],
    project_binds_root: ['项目目录', 'Project directory'],
    task_in_project: ['所属项目', 'Project'],
    task_uses_thread: ['任务会话', 'Task thread'],
    task_delegates_task: ['委派任务', 'Delegated task'],
    bot_owns_root: ['负责目录', 'Owns root'],
    run_in_root: ['执行目录', 'Run root'],
    run_reads_file: ['读取文件', 'Read file'],
    run_modifies_file: ['修改文件', 'Modified file'],
    file_produced_by_task: ['任务产物', 'Task artifact']
  };
  var entityTypeLabels = {
    BotInstanceRef: ['BOT', 'BOT'], Project: ['工程', 'Project'], WorkTask: ['任务', 'Task'],
    Thread: ['会话', 'Thread'], RootBinding: ['目录', 'Folder'], Run: ['执行记录', 'Run'],
    FileRef: ['文件引用', 'File reference']
  };
  var statusLabels = {
    unsupported: ['已发现，历史格式待适配', 'Detected; history format unsupported'],
    draft: ['草稿', 'Draft'], ready: ['待开始', 'Ready'], running: ['运行中', 'Running'],
    waiting_input: ['等待输入', 'Waiting for input'], awaiting_review: ['等待验收', 'Awaiting review'],
    completed: ['已完成', 'Completed'], done: ['已完成', 'Completed'], failed: ['失败', 'Failed'], canceled: ['已取消', 'Canceled'],
    online: ['在线', 'Online'], offline: ['离线', 'Offline'], unavailable: ['不可用', 'Unavailable'],
    denied: ['无权访问', 'Access denied'], stale: ['索引过期', 'Index stale'],
    indexing: ['索引中', 'Indexing'], partial: ['部分覆盖', 'Partial coverage'],
    unindexed: ['尚未索引', 'Not indexed'], revoked: ['权限已撤回', 'Access revoked'], replaced: ['目录已更换', 'Folder was replaced'],
    paused: ['已暂停', 'Paused'], needs_repair: ['待修复回传', 'Return needs repair'], returned: ['已回传', 'Returned'],
    blocked_missing_output: ['输出正文缺失，回传受阻', 'Output missing; return blocked'],
    missing: ['缺失', 'Missing'], corrupt: ['损坏', 'Corrupt'], available: ['可用', 'Available'],
    ready_index: ['已完成索引', 'Index ready'], active: ['活跃', 'Active']
  };
  var operationCounter = 0;
  var operationIds = new Map();

  function tr(zh, en) {
    return root.OpenBotI18n ? root.OpenBotI18n.t(zh, en) : zh;
  }

  function tokenCount(value) {
    if (!Number.isSafeInteger(value) || value <= 0) return '';
    if (value >= 1000000) return (value / 1000000).toFixed(value % 1000000 ? 1 : 0) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(value % 1000 ? 1 : 0) + 'K';
    return String(value);
  }

  function capabilitySourceLabel(source) {
    if (source === 'local-override') return tr('本地覆盖', 'Local override');
    if (source === 'provider-catalog') return tr('目录', 'Catalog');
    if (source === 'codex-catalog') return tr('Codex 目录', 'Codex catalog');
    if (source === 'builtin-catalog') return tr('内置目录', 'Built-in catalog');
    return tr('未知', 'Unknown');
  }

  function capabilityValue(value) {
    var label = tokenCount(value);
    return label || tr('未知', 'Unknown');
  }

  function executionChoiceDisplayLabel(choiceId, label) {
    if (String(choiceId || '') === 'codex-appserver') return tr('Codex · App Server', 'Codex · App Server');
    return label;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function button(label, className, handler, title) {
    var node = el('button', className || '', label);
    node.type = 'button';
    if (title) node.title = title;
    if (handler) node.addEventListener('click', handler);
    return node;
  }

  function normalizeRef(ref) {
    if (!ref || typeof ref !== 'object' || !ref.type || ref.id === undefined || ref.id === null) return null;
    return { type: String(ref.type), id: String(ref.id) };
  }

  function refKey(ref) {
    ref = normalizeRef(ref);
    return ref ? ref.type + ':' + ref.id : '';
  }

  function formatStatus(value) {
    var entry = statusLabels[String(value || '').toLowerCase()];
    if (entry) return tr(entry[0], entry[1]);
    return value ? String(value).replace(/[_-]+/g, ' ') : '';
  }

  function formatEntityType(value) {
    var type = String(value || '');
    var entry = entityTypeLabels[type];
    return entry ? tr(entry[0], entry[1]) : type;
  }

  function safeName(entity) {
    return String(entity && (entity.name || entity.title || entity.goal || entity.id) || '');
  }

  function makeOperationId() {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    operationCounter += 1;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
      var random = Math.random() * 16 | 0;
      return (char === 'x' ? random : (random & 3 | 8)).toString(16);
    });
  }

  function isPromise(value) { return value && typeof value.then === 'function'; }

  // These projections never infer files, task ownership or acceptance from reply text.
  function threadWorkbenchActive(run) {
    return !!run && ['queued', 'running', 'waiting_input'].indexOf(String(run.status || '').toLowerCase()) >= 0;
  }

  function threadWorkbenchLatestRun(runs) {
    return (Array.isArray(runs) ? runs : []).map(function (run, index) { return { run: run, index: index }; })
      .filter(function (item) { return item.run; }).sort(function (left, right) {
        if (Number.isSafeInteger(left.run.createdRevision) && Number.isSafeInteger(right.run.createdRevision) && left.run.createdRevision !== right.run.createdRevision) return right.run.createdRevision - left.run.createdRevision;
        var a = Date.parse(left.run.createdAt || left.run.startedAt || '') || 0;
        var b = Date.parse(right.run.createdAt || right.run.startedAt || '') || 0;
        return b - a || right.index - left.index;
      }).map(function (item) { return item.run; })[0] || null;
  }

  function threadWorkbenchOutput(run, messages) {
    if (!run || run.status !== 'done' || run.outcomeUnknown || run.outputError || run.error || run.archivedAt || run.deletedAt || run.asyncAttempt ||
        ['missing', 'corrupt'].indexOf(run.outputStatus) >= 0 || run.returnStatus === 'blocked_missing_output') return null;
    return (Array.isArray(messages) ? messages : []).find(function (message) {
      return message && message.role === 'bot' && !message.resultRef && message.id === run.outputMessageId &&
        message.runId === run.id && message.sourceAvailable !== false && message.resultAvailable !== false &&
        ['missing', 'corrupt'].indexOf(message.outputStatus) < 0 && typeof message.text === 'string' && !!message.text.trim();
    }) || null;
  }

  function threadWorkbenchFiles(taskDetail) {
    var task = taskDetail && taskDetail.entity;
    if (!task || task.type !== 'WorkTask') return [];
    var seen = new Set();
    return (taskDetail.relations || []).filter(function (relation) {
      var file = relation && relation.subjectRef, target = relation && relation.objectRef;
      if (!relation || relation.endedAt || relation.predicate !== 'file_produced_by_task' ||
          !file || file.type !== 'FileRef' || !file.id || !target || target.type !== 'WorkTask' || String(target.id) !== String(task.id) || seen.has(String(file.id))) return false;
      seen.add(String(file.id)); return true;
    }).map(function (relation) { return { ref: { type: 'FileRef', id: String(relation.subjectRef.id) }, label: relation.subjectLabel || '' }; });
  }

  function threadWorkbenchCompletion(task, thread, runs, messages, runId) {
    if (!task || task.status !== 'awaiting_review' || task.sourceRef || task.asyncTeam || task.asyncParent || task.archivedAt || task.deletedAt ||
        !thread || thread.kind === 'team-attempt' || !thread.messageSourceRef ||
        thread.messageSourceRef.sourceType !== 'unified-thread' || String(thread.primaryTaskId || thread.taskId || '') !== String(task.id)) return false;
    runs = Array.isArray(runs) ? runs : [];
    if (runs.some(function (run) { return threadWorkbenchActive(run) || run.status === 'needs_review' || run.outcomeUnknown; })) return false;
    var latest = threadWorkbenchLatestRun(runs);
    return !!(latest && String(latest.id) === String(runId) && String(latest.threadId) === String(thread.id) &&
      latest.taskRef && latest.taskRef.type === 'WorkTask' && String(latest.taskRef.id) === String(task.id) &&
      threadWorkbenchOutput(latest, messages));
  }

  function create(options) {
    options = options || {};
    var bridge = options.bridge || root.grokbot;
    var getScope = options.getScope;
    var getLegacyState = options.getLegacyState || function () { return {}; };
    var getSidebarPreferences = options.getSidebarPreferences || function () { return {}; };
    var openBot = options.openBot || function () {};
    var openBotSettings = options.openBotSettings || function () {};
    var onViewChange = options.onViewChange || function () {};
    var showLegacyContent = options.showLegacyContent || function () {};
    var sidebarMount = options.sidebarMount;
    var contentMount = options.contentMount;
    var associationsMount = options.associationsMount;
    var associationEpoch=0, associationKey='', associationStatus='idle', associationDetail=null, associationExpanded={};
    var historyMount = options.historyMount;
    var historyDisclosure = historyMount && historyMount.closest('details');
    var onOpenHistory = options.onOpenHistory || function () {};
    var contextMount, contextOriginKey = '', sidebarRenderedView = '';
    var sidebarPositions = Object.create(null), contextExpanded = new Set();
    var navigationMount, switcherMount, listMount, contentRoot, pageHeader, pageHost, composerHost;
    var switcherMarkupKey = '';
    var view = 'bots';
    var viewInteractionRevision = 0;
    var lastNavigationMode = null;
    var lastNotifiedView = '';
    var scope = null;
    var snapshot = null;
    var started = false;
    var stopped = false;
    var refreshEpoch = 0;
    var detailEpoch = 0;
    var searchEpoch = 0;
    var treeEpoch = 0;
    var treeRequests = new Map();
    var navStatus = '';
    var commandStatus = '';
    var eventUnsubscribe = null;
    var pageCache = new Map();
    var backStack = [];
    var currentPageKey = '';
    var legacyReturnPageKey = '';
    var legacyHop = false;
    var localExpanded = { projects: Object.create(null), roots: Object.create(null), dirs: Object.create(null) };
    var treeCache = new Map();
    var projectSummaries = new Map();
    var projectSummaryRequests = new Map();
    var treeLoading = new Set();
    var treeErrors = new Map();
    var treeCursors = new Map();
    var pinnedProjectRootIds = new Map();
    var projectNavigationRequests = new Map();
    var indexCoverage = new Map();
    var indexLoading = new Set();
    var indexErrors = new Map();
    var indexRequests = new Map();
    var indexRequestSequence = 0;
    var revokedIndexRoots = new Set();
    var activeSearch = null;
    var searchQueryId = '';
    var searchResults = [];
    var searchCoverage = null;
    var searchComplete = false;
    var searchError = '';
    var searchNotice = '';
    var fileRefreshTimer = 0;
    var selectedRootId = '';
    var queryText = '';
    var searchKind = 'name';
    var caseSensitive = false;
    var searchRange = 'root';
    var composerState = { threadId: '', composing: false, pendingThreadId: null, drafts: new Map() };
    // Fire-and-forget native warm-up. A short completed-result window avoids
    // duplicate open events; switching visibility always supersedes it.
    var warmThreadCache = new Map();
    var WARM_THREAD_DEDUPE_MS = 30000;
    var composerInput = null;
    var composerStyleCleanup = null;
    var composerSend = null;
    var composerRun = null;
    var composerStatus = null;
    var composerLabel = null;
    var composerSelectionTimer = 0;
    var composerDraftEpochs = new Map();
    var composerInputRevision = 0;
    var legacyComposerSelection = null;
    var composerSelectionSuppressed = false;
    var composerSuppressionTimer = 0;
    var actionOperationIds = new WeakMap();
    var relocateOperations = new Map();
    // Lives outside rendered nodes: refreshes cannot unlock or replay a completion write.
    var threadCompletions = new Map();
    var codexHistoryEpoch = 0;
    var codexHistoryState = { scopeKey: '', sources: null, loading: false, error: '', projects: new Map(), epoch: 0 };
    var codexQueryTimers = new Map();
    var codexHistoryPreferenceEpoch = 0;
    var codexHistoryPreferenceBusy = false;
    var codexHistoryPendingValue = null;
    var fileParticipationEpoch = 0;
    var fileParticipationPollTimer = 0;
    var fileParticipationExpandedKey = '';
    var fileParticipationState = { key: '', pageKey: '', data: null, loading: false, error: '', epoch: 0 };
    var fileParticipationVisibilityHandler = null;
    var experimentRenderEpoch = 0;
    var experimentButtonBound = false;
    var lastExperimentEnabled = null;
    var experimentPreferenceQueue = null;
    var experimentPreferenceUnsaved = false;
    var experimentPreferenceSaving = false;
    var experimentCollapsedSections = {};
    var experimentAssociationEpoch = 0;
    var experimentAssociationKey = '';
    var experimentAssociationCache = new Map();
    var experimentAssociationInflight = new Map();
    var experimentProjectRoleRequests = new Map();
    var experimentSectionExpanded = Object.create(null);
    var experimentNativeState = {
      scopeKey: '', epoch: 0, loading: false, loaded: false, error: '', sources: [], items: [], total: 0, partial: false, warnings: []
    };

    function getCurrentScope() {
      var next = typeof getScope === 'function' ? getScope() : null;
      if (!next || !next.spaceId || next.scopeRevision === undefined) return null;
      return { spaceId: String(next.spaceId), scopeRevision: next.scopeRevision };
    }

    function sameScope(a, b) {
      return !!a && !!b && String(a.spaceId) === String(b.spaceId) && String(a.scopeRevision) === String(b.scopeRevision);
    }

    function validResponse(response, expectedScope) {
      return !!response && response.ok === true &&
        String(response.spaceId) === String(expectedScope.spaceId) &&
        String(response.scopeRevision) === String(expectedScope.scopeRevision) &&
        sameScope(expectedScope, getCurrentScope());
    }

    function prefs() {
      return snapshot && snapshot.preferences && typeof snapshot.preferences === 'object' ? snapshot.preferences : {};
    }

    function experimentEnabled() {
      var settings = {};
      try { settings = getSidebarPreferences() || {}; } catch (_) {}
      return settings.workspacePerspectiveExperiment === true;
    }

    function experimentViewLabels(name) {
      if (name === 'projects') return [tr('任务会话', 'Task Sessions'), tr('任务会话', 'Task Sessions')];
      var labels = viewLabels[name] || [name, name];
      return [tr(labels[0], labels[1]), tr(labels[0], labels[1])];
    }

    function experimentCategories() {
      if (view === 'bots') return ['tasks', 'files'];
      if (view === 'projects') return ['bots', 'files'];
      return ['bots', 'tasks'];
    }

    function experimentCategoryLabel(category) {
      var labels = {
        bots: [tr('BOT', 'BOTs'), tr('BOT', 'BOTs')],
        tasks: [tr('任务会话', 'Task Sessions'), tr('任务会话', 'Task Sessions')],
        files: [tr('文件', 'Files'), tr('文件', 'Files')]
      };
      return labels[category] || [category, category];
    }

    // The centre object, not the left rail, drives both association sections.
    // Pure perspective changes never rewrite this anchor.
    function experimentAnchor() {
      var page = currentPage();
      if (page) {
        if (page.codex) {
          // A native history source without a verified unified Thread mapping
          // keeps its own identity. It never receives a synthesized Thread.
          return { kind: 'tasks', ref: null, native: true,
            key: page.key, label: pageTitle(page), page: page };
        }
        var ref = normalizeRef(page.ref);
        if (!ref) return null;
        var kind = ref.type === 'BotInstanceRef' ? 'bots'
          : ['Thread', 'WorkTask', 'Project', 'Run'].indexOf(ref.type) >= 0 ? 'tasks'
          : ['FileRef', 'RootBinding'].indexOf(ref.type) >= 0 ? 'files' : '';
        if (!kind) return null;
        var key = refKey(ref);
        if (ref.type === 'FileRef') {
          var revision = page.file && page.file.revision !== undefined ? page.file.revision : page.ref.revision;
          key += '|' + String(page.ref.rootId || page.file && page.file.rootId || '') + '|' + String(revision === undefined ? '' : revision);
        }
        return { kind: kind, ref: ref, key: key, label: pageTitle(page), page: page };
      }
      var legacyBot = legacyContextBot();
      if (!legacyBot) return null;
      var botRef = { type: 'BotInstanceRef', id: String(legacyBot.id || legacyBot.botId) };
      return { kind: 'bots', ref: botRef, key: refKey(botRef), label: safeName(legacyBot), bot: legacyBot };
    }

    function experimentAnchorKey(anchor, current) {
      if (!anchor || !current) return '';
      return [current.spaceId, current.scopeRevision, anchor.key,
        String(snapshot && snapshot.revision !== undefined ? snapshot.revision : '')].join('|');
    }

    function experimentAssociationCacheEntry(key) {
      var cached = experimentAssociationCache.get(key);
      if (cached) return cached;
      return { key: key, loading: true, detail: null, detailError: null, rootDetail: null, rootDetailError: null,
        participation: null, participationError: null };
    }

    function experimentFetchAssociations(anchor, current, key) {
      if (experimentAssociationCache.has(key)) return Promise.resolve(experimentAssociationCache.get(key));
      if (experimentAssociationInflight.has(key)) return experimentAssociationInflight.get(key);
      if (!anchor || !anchor.ref) {
        var nativeUnavailable = { key: key, loading: false, detail: null,
          detailError: new Error(tr('此原生会话尚无核实的统一关联。', 'No verified unified links exist for this native session.')),
          rootDetail: null, rootDetailError: null, participation: null, participationError: null };
        experimentAssociationCache.set(key, nativeUnavailable);
        return Promise.resolve(nativeUnavailable);
      }
      if (!bridge || typeof bridge.unifiedWorkspaceDetail !== 'function') {
        var unavailable = { key: key, loading: false, detail: null, detailError: new Error(tr('关联服务尚不可用。', 'Linked information is unavailable.')),
          rootDetail: null, rootDetailError: null, participation: null, participationError: null };
        experimentAssociationCache.set(key, unavailable);
        return Promise.resolve(unavailable);
      }
      var request = Promise.resolve().then(function () {
        var detailRequest = Promise.resolve(bridge.unifiedWorkspaceDetail({
          spaceId: current.spaceId, scopeRevision: current.scopeRevision, ref: anchor.ref
        })).then(function (result) {
          // Browsing an indexed file doesn't create a workspace relation entity.
          // Treat exact-scope absence separately from a stale or denied response.
          if (anchor.ref.type === 'FileRef' && anchor.page && anchor.page.file && anchor.page.file.identityVerified === true &&
              result && result.ok === false && result.code === 'NOT_FOUND' &&
              sameScope(result, current) && sameScope(current, getCurrentScope())) return null;
          if (!validResponse(result, current)) throw new Error(tr('关联暂不可用，请重试。', 'Links are temporarily unavailable. Try again.'));
          return result;
        });
        if (anchor.ref.type !== 'FileRef') {
          return detailRequest.then(function (detail) {
            return { detail: detail, detailError: null, rootDetail: null, rootDetailError: null, participation: null, participationError: null };
          }, function (error) {
            return { detail: null, detailError: error, rootDetail: null, rootDetailError: null, participation: null, participationError: null };
          });
        }
        var revision = anchor.page.file && anchor.page.file.revision !== undefined
          ? anchor.page.file.revision : anchor.page.ref.revision;
        var rootId = anchor.page.file && anchor.page.file.rootId || anchor.page.ref.rootId;
        var participationRequest;
        if (!rootId || revision === undefined || revision === null || typeof bridge.unifiedWorkspaceFileParticipation !== 'function') {
          participationRequest = Promise.reject(new Error(tr('打开文件版本后可读取协作记录。', 'Open a verified file version to read collaboration records.')));
        } else {
          participationRequest = Promise.resolve(bridge.unifiedWorkspaceFileParticipation({
            spaceId: current.spaceId, scopeRevision: current.scopeRevision,
            rootId: String(rootId), fileId: String(anchor.ref.id), expectedRevision: revision
          })).then(function (result) {
            if (!validResponse(result, current) || String(result.rootId) !== String(rootId) ||
                String(result.fileId) !== String(anchor.ref.id) || String(result.revision) !== String(revision)) {
              throw new Error(tr('文件关联暂不可用，请重试。', 'File links are temporarily unavailable. Try again.'));
            }
            return result;
          });
        }
        var rootRequest = rootId
          ? Promise.resolve(bridge.unifiedWorkspaceDetail({
            spaceId: current.spaceId, scopeRevision: current.scopeRevision, ref: { type: 'RootBinding', id: String(rootId) }
          })).then(function (result) {
            if (!validResponse(result, current)) throw new Error(tr('目录关联资料已过期，未显示。', 'Folder link information is stale and was not shown.'));
            return result;
          })
          : Promise.resolve(null);
        return Promise.allSettled([detailRequest, participationRequest, rootRequest]).then(function (settled) {
          return {
            detail: settled[0].status === 'fulfilled' ? settled[0].value : null,
            detailError: settled[0].status === 'rejected' ? settled[0].reason : null,
            participation: settled[1].status === 'fulfilled' ? settled[1].value : null,
            participationError: settled[1].status === 'rejected' ? settled[1].reason : null,
            rootDetail: settled[2].status === 'fulfilled' ? settled[2].value : null,
            rootDetailError: settled[2].status === 'rejected' ? settled[2].reason : null
          };
        });
      }).then(function (entry) {
        entry.key = key; entry.loading = false;
        experimentAssociationCache.set(key, entry);
        experimentAssociationInflight.delete(key);
        return entry;
      });
      experimentAssociationInflight.set(key, request);
      return request;
    }

    function experimentRefLabel(ref, fallback) {
      var normalized = normalizeRef(ref);
      if (!normalized) return fallback || '';
      var collection = { BotInstanceRef: 'bots', Thread: 'threads', Project: 'projects', WorkTask: 'tasks', Run: 'runs', RootBinding: 'roots', FileRef: 'files' }[normalized.type];
      var entity = collection && (snapshot[collection] || []).find(function (item) { return String(item.id) === normalized.id; });
      if (entity) return safeName(entity);
      return fallback || normalized.id;
    }

    function experimentBotEntries(anchor, data) {
      var entries = [], seen = new Map();
      if (!anchor || !anchor.ref) return entries;
      function add(ref, label, role) {
        var normalized = normalizeRef(ref);
        if (!normalized || normalized.type !== 'BotInstanceRef' || /^threadexec_/.test(normalized.id)) return;
        var key = normalized.id;
        var entry = seen.get(key);
        if (!entry) {
          var bot = (snapshot.bots || []).find(function (item) {
            return String(item.id) === normalized.id;
          });
          entry = { ref: normalized, label: experimentRefLabel(normalized, label), roles: [],
            settingsId: String(bot && (bot.botId || bot.id) || normalized.id) };
          seen.set(key, entry);
          entries.push(entry);
        }
        if (label && entry.label === normalized.id) entry.label = experimentRefLabel(normalized, label);
        if (role && entry.roles.indexOf(role) < 0) entry.roles.push(role);
      }
      if (anchor.ref.type === 'BotInstanceRef') add(anchor.ref, anchor.label, tr('当前 BOT', 'Current BOT'));
      var detail = data && data.detail;
      function addRelations(source) {
        (source && source.relations || []).forEach(function (relation) {
          if (!relation || relation.endedAt) return;
          var subject = normalizeRef(relation.subjectRef), object = normalizeRef(relation.objectRef);
          var botRef = subject && subject.type === 'BotInstanceRef' ? subject : object && object.type === 'BotInstanceRef' ? object : null;
          if (!botRef) return;
          var role = relation.predicate === 'bot_owns_project' ? tr('工程管理', 'Project manager')
            : relation.predicate === 'bot_participates_project' ? tr('工程协作', 'Project collaborator')
            : relation.predicate === 'bot_participates_thread' ? tr('会话参与', 'Thread participant')
            : relation.predicate === 'bot_owns_root' ? tr('目录授权', 'Folder access') : '';
          if (role) add(botRef, relation.subjectLabel || relation.objectLabel, role);
        });
      }
      addRelations(data && data.rootDetail);
      if (detail) {
        addRelations(detail);
        var entity = detail.entity || {};
        add(entity.botRef, '', tr('实际执行器', 'Actual executor'));
        add(entity.participatingBotRef, '', tr('会话参与', 'Thread participant'));
        add(entity.ownerBotRef, '', tr('工程管理', 'Project manager'));
        if (entity.type === 'Run') add(entity.executorBotRef, '', tr('实际执行器', 'Actual executor'));
        (detail.threads || []).forEach(function (thread) {
          add(thread.botRef, '', tr('实际执行器', 'Actual executor'));
          add(thread.participatingBotRef, '', tr('会话参与', 'Thread participant'));
        });
      }
      var participation = data && data.participation;
      (participation && participation.participants || []).forEach(function (participant) {
        if (!participant || participant.kind !== 'bot') return;
        add(participant.actorRef, participant.name, participant.status === 'working' ? tr('正在协作', 'Working now') : tr('文件协作', 'File collaboration'));
      });
      return entries;
    }

    function experimentTaskEntries(anchor, data) {
      var entries = [], seen = new Set();
      if (!anchor || !anchor.ref) return entries;
      function add(thread, role) {
        if (!thread || thread.kind !== 'task' || thread.archivedAt || thread.deletedAt) return;
        var key = String(thread.id);
        if (seen.has(key)) return;
        seen.add(key);
        entries.push({ ref: { type: 'Thread', id: key }, label: safeName(thread), roles: role ? [role] : [] });
      }
      var detail = data && data.detail;
      if (detail) {
        if (detail.entity && detail.entity.type === 'Thread') add(detail.entity, tr('当前任务会话', 'Current task session'));
        (detail.threads || []).forEach(function (thread) { add(thread, tr('关联', 'Linked')); });
      }
      (snapshot.threads || []).forEach(function (thread) {
        if (!thread || thread.kind !== 'task' || thread.archivedAt || thread.deletedAt) return;
        if (anchor.ref.type === 'BotInstanceRef' &&
            (String(thread.botRef && thread.botRef.id || '') === anchor.ref.id ||
             String(thread.participatingBotRef && thread.participatingBotRef.id || '') === anchor.ref.id)) add(thread, tr('BOT 参与', 'BOT involved'));
        if (anchor.ref.type === 'Project' && String(projectIdForThread(thread, snapshot.tasks || [])) === anchor.ref.id) add(thread, tr('所属工程', 'In project'));
        if (anchor.ref.type === 'WorkTask' && String(threadTaskId(thread)) === anchor.ref.id) add(thread, tr('所属任务', 'For task'));
        if (anchor.ref.type === 'Thread' && String(thread.id) === anchor.ref.id) add(thread, tr('当前任务会话', 'Current task session'));
      });
      (data && data.participation && data.participation.records || []).forEach(function (record) {
        var ref = record && record.threadRef;
        if (ref && ref.type === 'Thread') {
          var thread = (snapshot.threads || []).find(function (item) { return String(item.id) === String(ref.id); });
          if (thread) add(thread, tr('文件协作', 'File collaboration'));
          return;
        }
        var taskRef = record && record.taskRef;
        if (record && record.action === 'deliverable_confirmed' && taskRef && taskRef.type === 'WorkTask' &&
            data.participation && String(record.sourceRevision) === String(data.participation.revision)) {
          (snapshot.threads || []).filter(function (item) { return threadTaskId(item) === String(taskRef.id); })
            .forEach(function (item) { add(item, tr('交付文件', 'Deliverable file')); });
        }
      });
      return entries;
    }

    function experimentNativeStateForScope(current) {
      var key = codexScopeKey(current);
      if (experimentNativeState.scopeKey !== key) {
        experimentNativeState = {
          scopeKey: key, epoch: experimentNativeState.epoch + 1, loading: false, loaded: false,
          error: '', sources: [], items: [], total: 0, partial: false, warnings: []
        };
      }
      return experimentNativeState;
    }

    function experimentNativeRead(current, request) {
      var read = prefs().agentHistoryEnabled === true
        ? bridge && bridge.unifiedWorkspaceAgentHistory
        : bridge && bridge.unifiedWorkspaceCodexHistory;
      if (typeof read !== 'function') return Promise.reject(new Error(tr('原生任务来源暂不可用。', 'Native task sources are unavailable.')));
      return Promise.resolve(read(Object.assign({
        spaceId: current.spaceId, scopeRevision: current.scopeRevision
      }, request))).then(function (result) {
        if (!validResponse(result, current)) throw new Error(tr('原生任务来源响应已过期，未显示。', 'The native task-source response was stale and was not shown.'));
        return result;
      });
    }

    function experimentNativeMappedThread(item) {
      if (!item || !item.thread || !item.source) return null;
      return (snapshot && snapshot.threads || []).find(function (thread) {
        var continuation = thread && thread.nativeContinuation;
        return thread && thread.kind === 'task' && continuation && String(continuation.sourceId || '') === String(item.source.id || '') &&
          String(continuation.sourceThreadId || '') === String(item.thread.id || '');
      }) || null;
    }

    function experimentNativeMappingForThread(thread) {
      if (!thread || thread.kind !== 'task' || !thread.nativeContinuation) return null;
      return experimentNativeState.items.find(function (item) {
        return String(item.thread && item.thread.id || '') === String(thread.nativeContinuation.sourceThreadId || '') &&
          String(item.source && item.source.id || '') === String(thread.nativeContinuation.sourceId || '');
      }) || null;
    }

    function loadExperimentNativeTaskSessions(current, force) {
      var state = experimentNativeStateForScope(current);
      var epoch = state.epoch;
      if (!current || current.spaceId !== 'personal' || !codexHistoryEnabled()) return Promise.resolve(false);
      if (state.loading || state.loaded && !force) return Promise.resolve(false);
      state.loading = true;
      state.error = '';
      state.warnings = [];
      if (force) state.items = [];
      var fresh = function () {
        return !stopped && epoch === state.epoch && experimentNativeState === state && sameScope(current, getCurrentScope()) && codexHistoryEnabled();
      };
      var collected = [];
      var total = 0;
      var partial = false;
      var warningSet = new Set();
      var sources = [];
      return experimentNativeRead(current, { action: 'sources' }).then(function (result) {
        if (!fresh()) return false;
        sources = (Array.isArray(result.sources) ? result.sources : []).filter(function (source) {
          return source && source.id && ['available', 'partial'].includes(String(source.status));
        });
        state.sources = sources.map(function (source) {
          return { id: source.id, label: source.label || source.id, status: source.status };
        });
        if (!sources.length) return true;
        if (sources.length > 8) partial = true;
        var sourceQueue = sources.slice(0, 8);
        return sourceQueue.reduce(function (chain, source) {
          return chain.then(function () {
            if (!fresh()) return;
            return experimentNativeRead(current, { action: 'projects', sourceId: String(source.id) }).then(function (projectsResult) {
              if (!fresh()) return;
              (projectsResult.warnings || []).forEach(function (warning) { warningSet.add(String(warning)); });
              var groups = (Array.isArray(projectsResult.projects) ? projectsResult.projects : [])
                .filter(function (project) { return Number(project.threadCount) > 0; });
              if (groups.length > 4) partial = true;
              groups.slice(0, 4).forEach(function (project) {
                total += Math.max(0, Number(project.threadCount) || 0);
              });
              var unassigned = projectsResult.unassigned || {};
              var unassignedCount = Math.max(0, Number(unassigned.threadCount) || 0);
              total += unassignedCount;
              var requests = groups.slice(0, 4).map(function (project) {
                return { project: project, projectId: project.id, label: project.name || project.nativeId || project.id };
              });
              if (unassignedCount) requests.push({ project: null, projectId: null,
                label: tr('未归工程会话', 'Projectless sessions') });
              return requests.reduce(function (projectChain, group) {
                return projectChain.then(function () {
                  if (!fresh()) return;
                  var body = { action: 'threads', sourceId: String(source.id), archived: false, limit: 12 };
                  if (group.projectId !== null) body.projectId = String(group.projectId);
                  return experimentNativeRead(current, body).then(function (threadsResult) {
                    if (!fresh()) return;
                    (threadsResult.warnings || []).forEach(function (warning) { warningSet.add(String(warning)); });
                    if (threadsResult.nextCursor) partial = true;
                    (Array.isArray(threadsResult.items) ? threadsResult.items : []).forEach(function (thread) {
                      if (!thread || !thread.id) return;
                      collected.push({ source: source, streamLabel: group.label, thread: thread });
                    });
                  }).catch(function (error) {
                    warningSet.add(error && error.code || 'NATIVE_TASK_SOURCE_PARTIAL');
                  });
                });
              }, Promise.resolve());
            }).catch(function (error) {
              warningSet.add(error && error.code || 'NATIVE_TASK_SOURCE_PARTIAL');
            });
          });
        }, Promise.resolve()).then(function () {
          if (!fresh()) return false;
          var seen = new Set();
          collected = collected.filter(function (item) {
            var key = String(item.source.id) + ':' + String(item.thread.id);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          if (collected.length > 50) partial = true;
          state.items = collected.slice(0, 50);
          state.total = Math.max(total, collected.length);
          state.partial = partial || collected.length < total;
          state.warnings = Array.from(warningSet).slice(0, 12);
          return true;
        });
      }).catch(function (error) {
        if (!fresh()) return false;
        state.error = messageForError(error, tr('无法读取原生任务会话。', 'Unable to read native task sessions.'));
        return false;
      }).finally(function () {
        if (epoch !== state.epoch || experimentNativeState !== state) return;
        state.loading = false;
        state.loaded = !state.error;
        if (experimentEnabled() && view === 'projects' && !stopped && sameScope(current, getCurrentScope())) renderSidebar();
      });
    }

    function renderExperimentNativeTaskSessions(host) {
      var current = getCurrentScope();
      if (!current || current.spaceId !== 'personal' || !codexHistoryEnabled()) return;
      var state = experimentNativeStateForScope(current);
      var section = el('details', 'ouw-experiment-native-tasks');
      section.dataset.ouwExperimentNativeTasks = 'true';
      section.open = state.loaded;
      var summary = el('summary', '', tr('原生任务会话', 'Native task sessions'));
      summary.appendChild(el('span', 'ouw-experiment-native-count',
        state.loading ? '…' : state.loaded ? String(state.items.length) : ''));
      section.appendChild(summary);
      section.appendChild(el('p', 'ouw-list-status is-muted', tr(
        '按各来源原有身份只读展示。没有核实接续映射时，右栏关联标记为不可用；查看与显式建立续作绑定仍使用原入口。',
        'Shown read-only under each source identity. Without a verified continuation mapping, linked information is unavailable; viewing and explicitly creating a continuation binding stay on the original entry.'
      )));
      if (!state.loaded && !state.loading && !state.error) {
        loadExperimentNativeTaskSessions(current, false);
      }
      if (state.loading) section.appendChild(el('div', 'ouw-list-status', tr('正在读取原生任务来源…', 'Reading native task sources…')));
      if (state.error) {
        var error = el('div', 'ouw-list-status is-error', state.error);
        error.setAttribute('role', 'alert');
        section.appendChild(error);
        section.appendChild(button(tr('重试', 'Retry'), 'ouw-inline-action', function () {
          loadExperimentNativeTaskSessions(current, true);
        }, tr('重试读取原生任务会话', 'Retry native task sessions')));
      }
      var unmapped = state.items.filter(function (item) { return !experimentNativeMappedThread(item); });
      if (state.loaded && !unmapped.length && !state.loading) {
        section.appendChild(el('div', 'ouw-subtle-empty',
          tr('没有尚未归并的原生任务会话。', 'No unmapped native task sessions.')));
      }
      unmapped.forEach(function (item) {
        var thread = item.thread;
        var row = button('', 'ouw-related-row ouw-experiment-native-task-row', function () {
          openCodexThread(item.source, thread);
        });
        row.dataset.ouwExperimentNativeTask = String(thread.id);
        row.dataset.ouwNativeSource = String(item.source.id);
        row.appendChild(el('span', 'ouw-exp-assoc-icon', 'T'));
        var copy = el('span', 'ouw-exp-assoc-copy');
        copy.appendChild(el('span', 'ouw-exp-assoc-name', String(thread.title || thread.nativeId || tr('未命名会话', 'Untitled session'))));
        copy.appendChild(el('span', 'ouw-exp-assoc-role',
          tr('原生来源 · ', 'Native source · ') + String(item.streamLabel || item.source.label || item.source.id) +
          tr(' · 只读查看，可显式建立续作绑定', ' · read-only view; explicit continuation binding available')));
        row.appendChild(copy);
        section.appendChild(row);
      });
      if (state.loaded && state.partial) {
        var coverage = el('div', 'ouw-list-status is-muted',
          tr('已显示 ' + state.items.length + ' / ' + state.total + ' 条原生会话；其余仍可在历史来源中继续浏览。',
            'Showing ' + state.items.length + ' / ' + state.total + ' native sessions; browse the rest in their history sources.'));
        coverage.dataset.ouwExperimentNativeCoverage = 'partial';
        section.appendChild(coverage);
      }
      if (state.warnings.length) {
        var warning = el('div', 'ouw-list-status is-muted',
          tr('部分原生来源本次未完整读取。', 'Some native sources were not fully readable this time.'));
        warning.dataset.ouwExperimentNativeWarning = state.warnings.join(',');
        section.appendChild(warning);
      }
      host.appendChild(section);
    }

    function experimentFileEntries(anchor, data) {
      var entries = [], seen = new Set();
      if (!anchor || !anchor.ref) return entries;
      function add(ref, label, rootId, role) {
        var normalized = normalizeRef(ref);
        if (!normalized || ['FileRef', 'RootBinding'].indexOf(normalized.type) < 0) return;
        var key = normalized.type + ':' + normalized.id;
        if (seen.has(key)) return;
        seen.add(key);
        entries.push({ ref: normalized, label: label || normalized.id, rootId: rootId || normalized.rootId || '', roles: role ? [role] : [] });
      }
      if (anchor.ref.type === 'FileRef') add(anchor.ref, anchor.label, anchor.ref.rootId, tr('当前文件', 'Current file'));
      var detail = data && data.detail;
      if (detail) {
        (detail.files || []).forEach(function (file) { add({ type: 'FileRef', id: String(file.id), rootId: file.rootId }, file.relativePath || safeName(file), file.rootId); });
        (detail.roots || []).forEach(function (root) { add({ type: 'RootBinding', id: String(root.id) }, safeName(root)); });
        (detail.relations || []).forEach(function (relation) {
          if (!relation || relation.endedAt) return;
          [relation.subjectRef, relation.objectRef].forEach(function (ref) {
            var normalized = normalizeRef(ref);
            if (!normalized || normalized.type !== 'FileRef') return;
            var isSubject = relation.subjectRef && normalized.type === relation.subjectRef.type && normalized.id === String(relation.subjectRef.id);
            add(normalized, isSubject ? relation.subjectLabel : relation.objectLabel, normalized.rootId);
          });
        });
      }
      return entries;
    }

    function experimentSectionMeta(category, anchor, data) {
      if (!anchor || !anchor.ref) {
        return { loading: false, unavailable: true,
          error: tr('此原生会话尚无核实的统一关联。', 'No verified unified links exist for this native session.') };
      }
      var loading = !data || data.loading;
      var error = '';
      if (data && !data.loading) {
        error = data.detailError ? messageForError(data.detailError) : '';
      }
      return { loading: loading, error: error };
    }

    function saveExperimentCollapsedSections(next) {
      experimentCollapsedSections = Object.assign({}, next || {});
      saveExperimentPreferencePatch({ experimentalCollapsedSections: experimentCollapsedSections });
    }

    function renderExperimentAssociationSection(host, category, anchor, data) {
      var labels = experimentCategoryLabel(category);
      var entries = category === 'bots' ? experimentBotEntries(anchor, data)
        : category === 'tasks' ? experimentTaskEntries(anchor, data) : experimentFileEntries(anchor, data);
      var meta = experimentSectionMeta(category, anchor, data);
      var collapsed = experimentCollapsedSections[category] === true;
      var section = el('section', 'ouw-exp-assoc-section');
      section.dataset.ouwAssocSection = category;
      section.dataset.state = meta.loading ? 'loading' : meta.error ? 'error' : entries.length ? 'ready' : 'empty';
      var heading = el('div', 'ouw-exp-assoc-heading');
      var toggle = button('', 'ouw-exp-assoc-toggle', function () {
        var next = Object.assign({}, experimentCollapsedSections);
        next[category] = !collapsed;
        saveExperimentCollapsedSections(next);
        syncExperimentAssociations(false);
      });
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-controls', 'ouw-exp-assoc-body-' + category);
      toggle.appendChild(el('span', 'ouw-exp-assoc-chevron'));
      toggle.appendChild(el('span', 'ouw-exp-assoc-title', tr(labels[0], labels[1])));
      toggle.appendChild(el('span', 'ouw-exp-assoc-count', meta.loading ? '…' : String(entries.length)));
      toggle.dataset.ouwAssocToggle = category;
      heading.appendChild(toggle);
      section.appendChild(heading);
      var body = el('div', 'ouw-exp-assoc-body');
      body.id = 'ouw-exp-assoc-body-' + category;
      body.hidden = collapsed;
      section.appendChild(body);
      if (meta.loading) {
        var loading = el('p', 'ouw-exp-assoc-status', tr('正在读取…', 'Loading…'));
        loading.setAttribute('role', 'status');
        body.appendChild(loading);
        return section;
      }
      if (meta.error) {
        var error = el('p', 'ouw-exp-assoc-status is-error', meta.error);
        error.setAttribute('role', 'alert');
        body.appendChild(error);
        if (!meta.unavailable) {
          var retry = button(tr('重试', 'Retry'), 'ouw-exp-assoc-retry', function () {
            experimentAssociationCache.delete(experimentAnchorKey(anchor, getCurrentScope()));
            syncExperimentAssociations(true);
          });
          retry.dataset.ouwAssocRetry = category;
          body.appendChild(retry);
        }
        return section;
      }
      if (!entries.length) {
        var empty = category === 'tasks'
          ? tr('没有已记录的独立任务会话。BOT 日常聊天不在这里。', 'No recorded standalone task sessions. BOT daily chats are not listed here.')
          : category === 'bots'
            ? tr('没有已记录的关联 BOT。', 'No linked BOTs recorded.')
            : tr('没有已记录的关联文件。', 'No linked files recorded.');
        body.appendChild(el('p', 'ouw-exp-assoc-status', empty));
        return section;
      }
      var expanded = experimentSectionExpanded[category] === true;
      var list = el('div', 'ouw-exp-assoc-list');
      entries.slice(0, expanded ? entries.length : 12).forEach(function (entry) {
        var row = el('div', 'ouw-exp-assoc-row');
        var current = currentPageKey === refKey(entry.ref);
        var open = button('', 'ouw-exp-assoc-open', function () {
          if (currentPageKey === refKey(entry.ref)) return;
          openEntity(entry.ref);
          syncExperimentAssociations(false);
        }, entry.label);
        open.dataset.ouwAssocRef = refKey(entry.ref);
        open.dataset.ouwAssocType = entry.ref.type;
        if (current) { open.setAttribute('aria-current', 'page'); row.dataset.current = 'true'; }
        var icon = el('span', 'ouw-exp-assoc-icon');
        icon.dataset.kind = entry.ref.type === 'BotInstanceRef' ? 'bot' : entry.ref.type === 'Thread' ? 'task'
          : entry.ref.type === 'RootBinding' ? 'folder' : 'file';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = entry.ref.type === 'BotInstanceRef' ? String(entry.label || '?').slice(0, 1).toUpperCase()
          : entry.ref.type === 'Thread' ? 'T' : entry.ref.type === 'RootBinding' ? '/' : 'F';
        open.appendChild(icon);
        var copy = el('span', 'ouw-exp-assoc-copy');
        copy.appendChild(el('span', 'ouw-exp-assoc-name', entry.label));
        if (entry.roles && entry.roles.length) copy.appendChild(el('span', 'ouw-exp-assoc-role', entry.roles.join(' · ')));
        open.appendChild(copy);
        if (current) open.appendChild(el('span', 'ouw-exp-assoc-current', tr('当前', 'Current')));
        row.appendChild(open);
        if (entry.ref.type === 'BotInstanceRef') {
          var settings = button(tr('设置', 'Settings'), 'ouw-exp-assoc-settings', function () { openBotSettings(entry.settingsId); });
          settings.dataset.ouwAssocBotSettings = entry.ref.id;
          settings.setAttribute('aria-label', tr('打开 ' + entry.label + ' 的设置', 'Open settings for ' + entry.label));
          row.appendChild(settings);
        }
        list.appendChild(row);
      });
      body.appendChild(list);
      var shownFiles = entries.filter(function (entry) { return entry.ref.type === 'FileRef'; }).length;
      var filesTruncated = category === 'files' && data && data.detail &&
        (data.detail.filesTruncated === true ||
          Number.isSafeInteger(data.detail.filesTotal) && data.detail.filesTotal > shownFiles);
      if (filesTruncated) {
        var totalFiles = Number.isSafeInteger(data.detail.filesTotal) ? data.detail.filesTotal : shownFiles;
        var coverage = el('p', 'ouw-exp-assoc-status',
          tr('已显示 ' + shownFiles + ' 条登记，当前空间共有 ' + totalFiles + ' 条。',
            'Showing ' + shownFiles + ' registered files; ' + totalFiles + ' are available in this space.'));
        coverage.dataset.ouwAssocCoverage = category;
        coverage.setAttribute('role', 'status');
        body.appendChild(coverage);
        var continueButton = button(tr('在文件视角继续浏览', 'Continue in Files'),
          'ouw-exp-assoc-more', function () { setView('files'); });
        continueButton.dataset.ouwAssocContinue = category;
        body.appendChild(continueButton);
      }
      if (entries.length > 12) {
        var more = button(expanded ? tr('收起', 'Show fewer') : tr('查看全部 ' + entries.length + ' 项', 'View all ' + entries.length),
          'ouw-exp-assoc-more', function () {
            experimentSectionExpanded[category] = !expanded;
            syncExperimentAssociations(false);
          });
        more.dataset.ouwAssocMore = category;
        more.setAttribute('aria-expanded', String(expanded));
        body.appendChild(more);
      }
      return section;
    }

    function renderExperimentAssociations(anchor, data) {
      if (!associationsMount) return;
      associationsMount.replaceChildren();
      associationsMount.dataset.mode = 'experiment';
      associationsMount.dataset.state = data && data.loading ? 'loading' : 'ready';
      if (!anchor) {
        var empty = el('div', 'ouw-exp-assoc-empty');
        empty.appendChild(el('strong', '', tr('选择一个工作对象', 'Select a working object')));
        empty.appendChild(el('p', '', tr('打开 BOT、任务会话或文件后，这里会显示另外两类已记录关联。', 'Open a BOT, task session or file to see the other two recorded perspectives here.')));
        associationsMount.appendChild(empty);
        return;
      }
      var header = el('div', 'ouw-exp-assoc-anchor');
      header.appendChild(el('span', 'ouw-exp-assoc-anchor-kind', experimentCategoryLabel(anchor.kind)[0]));
      header.appendChild(el('strong', 'ouw-exp-assoc-anchor-title', anchor.label || refKey(anchor.ref)));
      associationsMount.appendChild(header);
      if (anchor.ref && anchor.ref.type === 'FileRef' && data && !data.loading &&
          (data.detailError || data.participationError || data.rootDetailError)) {
        // All sections depend on the same verified file identity. Never show
        // stale or partial rows as current, or repeat the same retry per section.
        associationsMount.dataset.state = 'error';
        var notice = el('div', 'ouw-exp-assoc-empty ouw-file-links-unavailable');
        var status = el('p', 'ouw-exp-assoc-status is-error',
          tr('暂时无法核实此文件的关联。文件预览不受影响。', 'Links for this file could not be verified. You can still view the file preview.'));
        status.setAttribute('role', 'status');
        notice.appendChild(status);
        var retry = button(tr('重试关联', 'Retry links'), 'ouw-exp-assoc-retry', function () {
          experimentAssociationCache.delete(experimentAnchorKey(anchor, getCurrentScope()));
          syncExperimentAssociations(true);
          var activePage = currentPage();
          if (isVisibleFilePage(activePage)) requestFileParticipation(activePage, true);
        });
        retry.dataset.ouwAssocRetry = 'file';
        notice.appendChild(retry);
        associationsMount.appendChild(notice);
        var failedFilePage = currentPage();
        if (isVisibleFilePage(failedFilePage)) updateFileParticipationView(failedFilePage);
        return;
      }
      experimentCategories().forEach(function (category) {
        associationsMount.appendChild(renderExperimentAssociationSection(associationsMount, category, anchor, data));
      });
      if (!data || !data.loading) {
        var readyFilePage = currentPage();
        if (isVisibleFilePage(readyFilePage)) updateFileParticipationView(readyFilePage);
      }
    }

    function syncExperimentAssociations(force) {
      if (!associationsMount || stopped) return Promise.resolve(false);
      var current = getCurrentScope();
      var anchor = current ? experimentAnchor() : null;
      if (!current || !anchor) {
        experimentAssociationEpoch += 1;
        experimentAssociationKey = '';
        renderExperimentAssociations(null, null);
        return Promise.resolve(false);
      }
      var key = experimentAnchorKey(anchor, current);
      if (key !== experimentAssociationKey) {
        experimentAssociationKey = key;
        experimentAssociationEpoch += 1;
      }
      var epoch = ++experimentAssociationEpoch;
      var data = force ? null : experimentAssociationCache.get(key);
      renderExperimentAssociations(anchor, data || { loading: true });
      return experimentFetchAssociations(anchor, current, key).then(function (entry) {
        if (stopped || epoch !== experimentAssociationEpoch || key !== experimentAssociationKey ||
            !sameScope(current, getCurrentScope())) return false;
        renderExperimentAssociations(anchor, entry);
        return true;
      }).catch(function (error) {
        if (stopped || epoch !== experimentAssociationEpoch || key !== experimentAssociationKey ||
            !sameScope(current, getCurrentScope())) return false;
        renderExperimentAssociations(anchor, { loading: false, detailError: error, detail: null, participation: null, participationError: null });
        return false;
      });
    }

    function syncExperimentPreferenceState() {
      var p = prefs();
      var collapsed = p.experimentalCollapsedSections;
      experimentCollapsedSections = collapsed && typeof collapsed === 'object' && !Array.isArray(collapsed)
        ? Object.assign({}, collapsed) : {};
    }

    function focusedNavigation() {
      if (experimentEnabled()) return false;
      var settings={};try{settings=getSidebarPreferences()||{};}catch(_){}
      return settings.sidebarNavigationMode!=='views';
    }

    function sidebarViews() {
      if (experimentEnabled()) return VIEWS.slice();
      if(focusedNavigation())return ['bots'];
      var settings = {};
      try { settings = getSidebarPreferences() || {}; } catch (error) {}
      var selected = new Set(Array.isArray(settings.sidebarViews) ? settings.sidebarViews.filter(function (name) { return VIEWS.indexOf(name) >= 0; }) : VIEWS);
      return VIEWS.filter(function (name) { return selected.has(name); }).length
        ? VIEWS.filter(function (name) { return selected.has(name); })
        : VIEWS.slice();
    }

    function sidebarSwitchStyle() {
      var settings = {};
      try { settings = getSidebarPreferences() || {}; } catch (error) {}
      return settings.sidebarSwitchStyle === 'dropdown' ? 'dropdown' : 'tabs';
    }

    function ensureVisibleView() {
      var visible = sidebarViews();
      if (visible.indexOf(view) >= 0) return false;
      view = visible[0];
      return true;
    }

    function mergePreferences(patch) {
      var current = prefs();
      var next = Object.assign({}, current, patch || {});
      if (patch && patch.expanded) next.expanded = Object.assign({}, current.expanded || {}, patch.expanded);
      if (patch && patch.queries) next.queries = Object.assign({}, current.queries || {}, patch.queries);
      return next;
    }

    function loadLocalPreferences() {
      var p = prefs();
      if (experimentEnabled()) {
        view = VIEWS.indexOf(p.experimentalMainPerspective) >= 0 ? p.experimentalMainPerspective : 'bots';
      } else if (VIEWS.indexOf(p.navigationView) >= 0) view = p.navigationView;
      syncExperimentPreferenceState();
      if (p.expanded && typeof p.expanded === 'object') {
        ['projects', 'roots', 'dirs', 'legacyHistory'].forEach(function (key) {
          if (p.expanded[key] && typeof p.expanded[key] === 'object') localExpanded[key] = Object.assign(Object.create(null), p.expanded[key]);
        });
      }
      selectedRootId = p.selectedRootId ? String(p.selectedRootId) : '';
      if (p.queries && typeof p.queries === 'object') {
        queryText = String(p.queries.text || '');
        searchKind = p.queries.kind === 'content' ? 'content' : 'name';
        caseSensitive = p.queries.caseSensitive === true;
        searchRange = p.queries.range === 'space' ? 'space' : 'root';
      }
    }

    function showStatus(target, message, kind) {
      if (!target) return;
      target.textContent = message || '';
      target.classList.toggle('is-error', kind === 'error');
      target.classList.toggle('is-muted', kind === 'muted');
      target.hidden = !message;
      if (message) target.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    }

    function setNavStatus(message, kind) {
      navStatus = message || '';
      if (navigationMount) {
        var status = navigationMount.querySelector('.ouw-nav-status');
        if (status) showStatus(status, navStatus, kind);
      }
    }

    function setCommandStatus(message, kind) {
      commandStatus = message || '';
      if (pageHeader) {
        var status = pageHeader.querySelector('.ouw-command-status');
        if (status) showStatus(status, commandStatus, kind);
      }
    }

    function messageForError(error, fallback) {
      if (error && (error.code === 'CODEX_HISTORY_SOURCE_CHANGED' || error.message === 'CODEX_HISTORY_SOURCE_CHANGED')) return tr('来源正在更新，暂未取得一致的历史快照。请稍后重试。', 'This source is updating. A consistent history snapshot is not available yet. Retry shortly.');
      if (error && error.message) return String(error.message);
      if (error && error.code) return tr('操作失败：' + error.code, 'Action failed: ' + error.code);
      return fallback || tr('暂时无法读取，请稍后重试。', 'Unable to load this view right now. Try again later.');
    }

    function commandError(result, fallback) {
      var error = new Error(messageForError(result, fallback));
      if (result && result.code) error.code = String(result.code);
      error.result = result;
      return error;
    }

    function isUnknownOutcome(error) {
      var code = String(error && error.code || '');
      return /(?:COMMIT_)?UNCERTAIN|UNKNOWN_OUTCOME|OUTCOME_UNKNOWN|TIMEOUT|ECONNRESET|WORKER_EXITED|CHANNEL_CLOSED/.test(code) || !!(error && error.unknownOutcome);
    }

    function stablePayload(payload) {
      if (payload === null || typeof payload !== 'object') return JSON.stringify(payload);
      if (Array.isArray(payload)) return '[' + payload.map(stablePayload).join(',') + ']';
      return '{' + Object.keys(payload).sort().map(function (key) { return JSON.stringify(key) + ':' + stablePayload(payload[key]); }).join(',') + '}';
    }

    function createShell() {
      navigationMount = el('div', 'ouw-sidebar');
      navigationMount.setAttribute('aria-label', tr('统一工作空间导航', 'Unified workspace navigation'));
      navigationMount.setAttribute('data-ouw-owned', 'true');
      switcherMount = el('div', 'ouw-switcher');
      switcherMount.setAttribute('aria-label', tr('工作空间视角', 'Workspace views'));
      document.addEventListener('focusout', function (event) {
        if (event.target && event.target.id === 'chat-input') captureLegacyComposerSelection();
      }, true);
      navigationMount.appendChild(switcherMount);
      contextMount = el('section', 'ouw-context');
      contextMount.hidden = true;
      contextMount.setAttribute('aria-label', tr('工作上下文', 'Working context'));
      navigationMount.appendChild(contextMount);
      var back = button(tr('返回工作视图', 'Return to workspace view'), 'ouw-return-legacy', returnFromLegacy);
      back.hidden = true;
      navigationMount.appendChild(back);
      var navStatusNode = el('div', 'ouw-nav-status');
      navStatusNode.hidden = true;
      navigationMount.appendChild(navStatusNode);
      listMount = el('div', 'ouw-sidebar-list');
      listMount.id = 'ouw-list-panel';
      listMount.setAttribute('role', 'tabpanel');
      listMount.setAttribute('data-ouw-list', 'true');
      navigationMount.appendChild(listMount);
      sidebarMount.appendChild(navigationMount);

      contentRoot = el('section', 'ouw-content');
      contentRoot.hidden = true;
      contentRoot.setAttribute('aria-label', tr('统一工作空间内容', 'Unified workspace content'));
      var header = el('header', 'ouw-content-header');
      pageHeader = header;
      var backButton = button(tr('返回', 'Back'), 'ouw-back-button', goBack);
      backButton.dataset.ouwBack = 'true';
      backButton.hidden = true;
      header.appendChild(backButton);
      var title = el('h1', 'ouw-content-title', '');
      title.dataset.ouwTitle = 'true';
      title.tabIndex = -1;
      header.appendChild(title);
      var headerSpacer = el('span', 'ouw-header-spacer');
      header.appendChild(headerSpacer);
      var closeButton = button(tr('返回对话', 'Return to chat'), 'ouw-close-button', closeWorkspacePage);
      closeButton.dataset.ouwClose = 'true';
      header.appendChild(closeButton);
      var commandStatusNode = el('div', 'ouw-command-status');
      commandStatusNode.hidden = true;
      header.appendChild(commandStatusNode);
      contentRoot.appendChild(header);
      pageHost = el('div', 'ouw-page-host');
      pageHost.setAttribute('aria-live', 'polite');
      contentRoot.appendChild(pageHost);
      composerHost = el('div', 'ouw-composer-host');
      createComposer();
      contentRoot.appendChild(composerHost);
      contentMount.appendChild(contentRoot);
    }

    function setSwitcherState() {
      if (!navigationMount) return;
      var visible = sidebarViews();
      var style = sidebarSwitchStyle();
      syncExperimentButton();
      switcherMount.hidden=focusedNavigation()||experimentEnabled();
      var key = style + ':' + visible.join(',');
      if (switcherMount && switcherMarkupKey !== key) {
        var activeControl = document.activeElement && switcherMount.contains(document.activeElement) ? document.activeElement : null;
        var activeView = activeControl && (activeControl.dataset.ouwView || activeControl.value) || '';
        switcherMount.replaceChildren();
        switcherMount.dataset.style = style;
        switcherMount.style.setProperty('--ouw-view-count', String(visible.length));
        if (style === 'dropdown') {
          switcherMount.setAttribute('role', 'group');
          switcherMount.removeAttribute('aria-orientation');
          var select = el('select', 'ouw-switcher-select');
          select.setAttribute('aria-label', tr('工作空间视角', 'Workspace views'));
          select.title = tr('切换工作空间视角', 'Switch workspace view');
          select.setAttribute('aria-controls', 'ouw-list-panel');
          visible.forEach(function (name) {
            var labels = viewLabels[name];
            var option = el('option', '', tr(labels[0], labels[1]));
            option.value = name;
            select.appendChild(option);
          });
          select.value = visible.indexOf(view) >= 0 ? view : visible[0];
          select.addEventListener('change', function () { setView(select.value); });
          select.addEventListener('pointerdown', captureLegacyComposerSelection, true);
          switcherMount.appendChild(select);
          if (listMount) {
            listMount.setAttribute('role', 'region');
            listMount.removeAttribute('aria-labelledby');
            listMount.setAttribute('aria-label', tr('工作空间视角列表', 'Workspace view list'));
          }
        } else {
          switcherMount.setAttribute('role', 'tablist');
          switcherMount.setAttribute('aria-orientation', 'horizontal');
          if (listMount) {
            listMount.setAttribute('role', 'tabpanel');
            listMount.removeAttribute('aria-label');
          }
          visible.forEach(function (name) {
            var labels = viewLabels[name];
            var item = button(tr(labels[0], labels[1]), 'ouw-switcher-tab', function () { setView(name); });
            item.title = tr(labels[0], labels[1]);
            item.dataset.ouwView = name;
            item.id = 'ouw-view-' + name;
            item.setAttribute('role', 'tab');
            item.setAttribute('aria-selected', 'false');
            item.setAttribute('aria-controls', 'ouw-list-panel');
            item.addEventListener('pointerdown', captureLegacyComposerSelection, true);
            item.addEventListener('keydown', function (event) {
              var index = visible.indexOf(name), nextIndex = index;
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % visible.length;
              else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index + visible.length - 1) % visible.length;
              else if (event.key === 'Home') nextIndex = 0;
              else if (event.key === 'End') nextIndex = visible.length - 1;
              else return;
              event.preventDefault();
              var next = visible[nextIndex];
              setView(next);
              var nextTab = switcherMount.querySelector('[data-ouw-view="' + next + '"]');
              if (nextTab) nextTab.focus();
            });
            switcherMount.appendChild(item);
          });
        }
        switcherMarkupKey = key;
        if (activeControl && activeView && visible.indexOf(activeView) >= 0) {
          var replacement = style === 'dropdown' ? switcherMount.querySelector('.ouw-switcher-select') : switcherMount.querySelector('[data-ouw-view="' + activeView + '"]');
          if (replacement) replacement.focus({ preventScroll:true });
        }
      }
      if (style === 'dropdown') {
        var select = switcherMount && switcherMount.querySelector('.ouw-switcher-select');
        if (select && visible.indexOf(view) >= 0) select.value = view;
      } else if (switcherMount) {
        switcherMount.querySelectorAll('[data-ouw-view]').forEach(function (item) {
          var selected = item.dataset.ouwView === view;
          item.setAttribute('aria-selected', selected ? 'true' : 'false');
          item.tabIndex = selected ? 0 : -1;
          if (selected && listMount) listMount.setAttribute('aria-labelledby', item.id);
        });
      }
      var returnButton = navigationMount.querySelector('.ouw-return-legacy');
      if (returnButton) returnButton.hidden = !legacyHop;
    }

    function experimentNextView() {
      var index = VIEWS.indexOf(view);
      return VIEWS[(index + 1) % VIEWS.length];
    }

    function syncExperimentButton() {
      var buttonNode = document.querySelector('#btn-workspace-perspective');
      if (!buttonNode) return;
      var enabled = experimentEnabled();
      buttonNode.hidden = !enabled;
      if (!enabled) return;
      var current = experimentViewLabels(view);
      var next = experimentViewLabels(experimentNextView());
      var label = tr('当前视角：' + current[0] + '；下一视角：' + next[0] + '。点击切换。',
        'Current view: ' + current[1] + '. Next: ' + next[1] + '. Click to switch.');
      buttonNode.setAttribute('aria-label', label);
      buttonNode.title = label;
      buttonNode.dataset.perspective = view;
      buttonNode.dataset.nextPerspective = experimentNextView();
      Array.prototype.forEach.call(buttonNode.querySelectorAll('[data-perspective-icon]'), function (icon) {
        icon.hidden = icon.dataset.perspectiveIcon !== view;
      });
      if (!experimentButtonBound) {
        experimentButtonBound = true;
        buttonNode.addEventListener('pointerdown', captureLegacyComposerSelection, true);
        buttonNode.addEventListener('keydown', function (event) {
          if ((event.key === 'Enter' || event.key === ' ') && event.repeat) event.preventDefault();
        });
        buttonNode.addEventListener('click', function () {
          if (!experimentEnabled()) return;
          captureLegacyComposerSelection();
          setView(experimentNextView());
        });
      }
    }

    function ensureExperimentPreferenceQueue() {
      if (experimentPreferenceQueue || !root.OpenBotPreferenceSaveQueue) return experimentPreferenceQueue;
      experimentPreferenceQueue = root.OpenBotPreferenceSaveQueue.create({
        write: function (spaceId, patch, context) {
          if (!bridge || typeof bridge.unifiedWorkspaceCommand !== 'function') throw new Error(tr('偏好保存服务尚不可用。', 'Preference saving is unavailable.'));
          var request = {
            spaceId: spaceId,
            scopeRevision: context.scopeRevision,
            operationId: makeOperationId(),
            action: 'savePreferences',
            patch: patch
          };
          return Promise.resolve(bridge.unifiedWorkspaceCommand(request)).then(function (result) {
            if (!result || result.ok !== true || String(result.spaceId) !== String(spaceId) ||
                String(result.scopeRevision) !== String(context.scopeRevision)) {
              throw commandError(result, tr('视角偏好未能保存。', 'The perspective preference could not be saved.'));
            }
            return result;
          });
        },
        onSettled: function (outcome) {
          var current = getCurrentScope();
          if (!current || String(outcome.spaceId) !== String(current.spaceId) ||
              String(outcome.scopeRevision) !== String(current.scopeRevision)) return;
          if (!outcome.latest) {
            experimentPreferenceSaving = true;
            return;
          }
          experimentPreferenceSaving = false;
          if (outcome.ok) {
            experimentPreferenceUnsaved = false;
            // Navigation preferences are not workspace data. Advancing the
            // local data revision here would invalidate every association
            // cache entry after each perspective click and force a full
            // detail refetch on the next frame.
            if (navStatus === tr('正在保存视角…', 'Saving view…')) setNavStatus('', '');
          } else {
            experimentPreferenceUnsaved = true;
            setNavStatus(messageForError(outcome.error, tr('视角已切换，但偏好尚未保存。', 'The view changed, but its preference was not saved.')), 'error');
          }
        }
      });
      return experimentPreferenceQueue;
    }

    function saveExperimentPreferencePatch(patch) {
      var current = getCurrentScope();
      if (!current || !bridge) return Promise.resolve(false);
      if (snapshot) snapshot.preferences = mergePreferences(patch);
      var queue = ensureExperimentPreferenceQueue();
      if (!queue) return Promise.resolve(false);
      experimentPreferenceSaving = true;
      experimentPreferenceUnsaved = false;
      // Perspective persistence is a background preference write. A visible
      // "saving" line on every click turns rapid switching into seconds of
      // layout churn; failures below remain explicit and actionable.
      return queue.enqueue(current.spaceId, patch, { scopeRevision: current.scopeRevision }).promise.then(function (outcome) {
        return !!outcome.ok;
      });
    }

    function syncSidebarPreferences() {
      if (!navigationMount || !sameScope(scope, getCurrentScope())) return false;
      var previousView=view, focused=focusedNavigation(), experiment=experimentEnabled();
      var experimentToggled=lastExperimentEnabled!==null&&lastExperimentEnabled!==experiment;
      if(experiment){
        var experimentalView=prefs().experimentalMainPerspective;
        if(VIEWS.indexOf(experimentalView)>=0)view=experimentalView;
        if(experimentToggled)saveExperimentPreferencePatch({experimentalMainPerspective:view});
      }else if(experimentToggled){
        var navigationView=prefs().navigationView;
        view=focused?(sidebarViews()[0]||'bots'):(sidebarViews().indexOf(navigationView)>=0?navigationView:sidebarViews()[0]);
      }else if(lastNavigationMode==='focused'&&!focused&&sidebarViews().indexOf(prefs().navigationView)>=0)view=prefs().navigationView;
      lastNavigationMode=focused?'focused':'views';
      lastExperimentEnabled=experiment;
      syncExperimentPreferenceState();
      var changed = ensureVisibleView() || previousView!==view;
      setSwitcherState();
      if (changed) {
        navStatus = '';
        renderSidebar();
        restoreLegacyComposerSelectionSoon();
        if(!experiment&&!focusedNavigation())savePreferences({ navigationView: view }, { render: false });
        if(experiment)saveExperimentPreferencePatch({experimentalMainPerspective:view});
      }
      syncCentralRootTreeProjection(currentPage());
      renderContext();
      syncBotAssociations();
      return changed;
    }

    function rootById(id) {
      return (snapshot && Array.isArray(snapshot.roots) ? snapshot.roots : []).find(function (rootItem) { return String(rootItem.id) === String(id); }) || null;
    }

    function threadTaskId(thread) {
      return String(thread && (thread.taskId || thread.primaryTaskId) || '');
    }

    function taskForThread(thread, tasks) {
      var taskId = threadTaskId(thread);
      return taskId ? (tasks || []).find(function (task) { return String(task.id) === taskId; }) || null : null;
    }

    function projectIdForThread(thread, tasks) {
      var task = taskForThread(thread, tasks);
      return task ? String(task.primaryProjectId || '') : String(thread && thread.primaryProjectId || '');
    }

    function threadContextLabel(ref) {
      if (!ref || !ref.type || !ref.id) return '';
      var id = String(ref.id);
      if (ref.type === 'Project') {
        var project = (snapshot && snapshot.projects || []).find(function (item) { return String(item.id) === id; });
        return project ? safeName(project) : id;
      }
      if (ref.type === 'WorkTask') {
        var task = (snapshot && snapshot.tasks || []).find(function (item) { return String(item.id) === id; });
        return task ? safeName(task) : id;
      }
      if (ref.type === 'RootBinding') {
        var rootItem = rootById(id);
        if (!rootItem) return id;
        var name = safeName(rootItem);
        var path = String(rootItem.canonicalPath || rootItem.path || rootItem.locator || '');
        return path && path !== name ? name + ' · ' + path : (path || name || id);
      }
      return id;
    }

    function selectedProjectId() {
      var page = currentPage();
      return page && page.ref && page.ref.type === 'Project' ? page.ref.id : '';
    }

    function visibleProjectDetailId() {
      var page = currentPage();
      return page && page.ref && page.ref.type === 'Project' && page.node && !page.node.hidden &&
        contentRoot && !contentRoot.hidden && contentMount && !contentMount.hidden ? String(page.ref.id) : '';
    }

    function syncProjectTaskActions() {
      if (!listMount) return;
      var activeProjectId = visibleProjectDetailId();
      listMount.querySelectorAll('[data-ouw-project-task-action]').forEach(function (action) {
        action.hidden = String(action.dataset.ouwProjectTaskAction || '') === activeProjectId;
      });
    }

    function scopeForSearch() {
      if (searchRange === 'space') return (snapshot && snapshot.roots || []).map(function (item) { return String(item.id); });
      return selectedRootId ? [selectedRootId] : [];
    }

    // Derive cross-view shortcuts only from scoped DTOs and recorded relations.
    // Switching a projection never selects another conversation or starts work.
    function legacyContextBot() {
      var legacy = getLegacyState() || {};
      var activeId = String(legacy.activeBotId || legacy.botId || '');
      if (!activeId || (Array.isArray(legacy.bots) && !legacy.bots.some(function (item) { return String(item.id) === activeId; }))) return null;
      return (snapshot && snapshot.bots || []).find(function (item) { return String(item.botId || item.id) === activeId; });
    }

    // A separate scoped projection of the native current Bot. It never uses
    // the last opened page as authority, nor widens an empty result globally.
    function clearBotAssociations(){
      associationEpoch++;associationKey='';associationStatus='idle';associationDetail=null;associationExpanded={};
      if(associationsMount){associationsMount.replaceChildren();associationsMount.dataset.state='empty';delete associationsMount.dataset.botId;}
    }
    function currentAssociationKey(){
      var current=getCurrentScope(),legacy=getLegacyState()||{};
      return current?String(current.spaceId)+'|'+String(current.scopeRevision)+'|'+String(legacy.activeBotId||legacy.botId||''):'';
    }
    function associationMessage(message,state){
      if(!associationsMount)return;
      associationsMount.replaceChildren();associationsMount.dataset.state=state;
      associationsMount.tabIndex=0;
      var note=el('p','bot-associations-empty',message);note.setAttribute('role',state==='error'?'alert':'status');associationsMount.appendChild(note);
    }
    function botAssociationMode(){
      var mode=associationsMount.dataset.mode;
      return mode==='projects'||mode==='files'?mode:'sessions';
    }
    function renderBotAssociations(detail,key){
      if(!associationsMount||key!==currentAssociationKey())return;
      var mode=botAssociationMode();
      var sameProjection=associationsMount.dataset.renderedMode===mode&&associationsMount.dataset.renderedKey===key;
      var focus=sameProjection&&document.activeElement&&associationsMount.contains(document.activeElement)?document.activeElement.dataset.botRelatedRef:'';
      var scroll=sameProjection?associationsMount.scrollTop:0;
      associationsMount.dataset.renderedMode=mode;associationsMount.dataset.renderedKey=key;
      associationsMount.replaceChildren();associationsMount.dataset.state='ready';
      var heading=el('h2','bot-associations-title',safeName(detail.entity));heading.title=safeName(detail.entity);associationsMount.appendChild(heading);
      function openRelated(ref,control){
        if(key!==currentAssociationKey()||associationDetail!==detail||botAssociationMode()!==mode||(control&&!associationsMount.contains(control)))return;
        openEntity(ref);
      }
      function group(name,label,items,emptyLabel){
        var section=el('section','bot-associations-section');section.dataset.botRelatedKind=name;section.dataset.botRelatedSection=name;
        var header=el('h3','bot-associations-heading',label);section.appendChild(header);
        var list=el('div','bot-associations-list');
        function fill(limit){
          list.replaceChildren();
          items.slice(0,limit).forEach(function(item){
            var control=button(item.label,'bot-associations-link',function(){openRelated(item.ref,control);},item.label);
            control.dataset.botRelatedRef=refKey(item.ref);control.dataset.botRelatedType=item.ref.type;
            control.setAttribute(item.ref.type==='Thread'?'data-bot-related-thread':item.ref.type==='Project'?'data-bot-related-project':'data-bot-related-file',item.ref.id);
            if(item.ref.type==='RootBinding')control.setAttribute('data-bot-related-root-binding',item.ref.id);
            if(currentPageKey===refKey(item.ref))control.setAttribute('aria-current','true');
            list.appendChild(control);
          });
          if(!items.length)list.appendChild(el('p','bot-associations-empty',emptyLabel));
        }
        var expanded=!!associationExpanded[name];
        fill(expanded?items.length:12);section.appendChild(list);
        if(items.length>12){
          var more=button(tr('查看全部 '+items.length+' 项','View all '+items.length),'bot-associations-more',function(){
            if(key!==currentAssociationKey()||associationDetail!==detail||botAssociationMode()!==mode||!associationsMount.contains(more))return;
            expanded=!expanded;associationExpanded[name]=expanded;fill(expanded?items.length:12);
            more.textContent=expanded?tr('收起','Show fewer'):tr('查看全部 '+items.length+' 项','View all '+items.length);
            more.setAttribute('aria-expanded',String(expanded));
          });
          more.setAttribute('aria-expanded',String(expanded));more.textContent=expanded?tr('收起','Show fewer'):tr('查看全部 '+items.length+' 项','View all '+items.length);more.dataset.botRelatedRef='more:'+name;section.appendChild(more);
        }
        associationsMount.appendChild(section);return section;
      }
      var sessions=(detail.threads||[]).map(function(thread){return {ref:{type:'Thread',id:String(thread.id)},label:safeName(thread)};});
      var projects=[],seenProjects=new Set();
      (detail.relations||[]).forEach(function(relation){
        if(relation.endedAt||['bot_owns_project','bot_participates_project'].indexOf(relation.predicate)<0||!relation.subjectRef||String(relation.subjectRef.id)!==String(detail.entity.id)||!relation.objectRef||relation.objectRef.type!=='Project')return;
        var id=String(relation.objectRef.id);if(seenProjects.has(id))return;seenProjects.add(id);
        projects.push({ref:{type:'Project',id:id},label:relation.objectLabel||tr('项目','Project')});
      });
      var files=(detail.files||[]).map(function(file){return {ref:{type:'FileRef',id:String(file.id),rootId:file.rootId},label:file.relativePath||safeName(file)};});
      var roots=(detail.roots||[]).map(function(folder){return {ref:{type:'RootBinding',id:String(folder.id)},label:safeName(folder)};});
      if(mode==='files'){
        var filesSection=group('files',tr('文件','Files'),files.concat(roots),tr('暂无文件','No files'));
        if(detail.filesTruncated)filesSection.appendChild(el('p','bot-associations-empty',tr('已登记 '+detail.filesTotal+' 个文件，更多文件可在关联目录中查看。',detail.filesTotal+' registered files. Open a linked folder to browse more.')));
      }else if(mode==='projects'){
        group('projects',tr('关联工程','Linked projects'),projects,tr('此 Bot 暂无关联工程。','This Bot has no linked projects.'));
      }else{
        group('sessions',tr('会话','Sessions'),sessions,tr('暂无会话','No sessions'));
      }
      if(associationsMount.querySelector('button'))associationsMount.removeAttribute('tabindex');
      else associationsMount.tabIndex=0;
      if(focus){var replacement=Array.from(associationsMount.querySelectorAll('[data-bot-related-ref]')).find(function(item){return item.dataset.botRelatedRef===focus;});if(replacement)replacement.focus({preventScroll:true});}
      associationsMount.scrollTop=scroll;
    }
    function syncBotAssociations(force){
      if(!associationsMount||stopped)return Promise.resolve(false);
      if(experimentEnabled())return syncExperimentAssociations(force);
      var current=getCurrentScope(),key=currentAssociationKey();
      var snapshotValid=!!snapshot&&sameScope(scope,current)&&String(snapshot.spaceId)===String(current&&current.spaceId)&&String(snapshot.scopeRevision)===String(current&&current.scopeRevision);
      var bot=snapshotValid?legacyContextBot():null;
      var requestKey=key+'|'+String(snapshot&&snapshot.revision)+'|'+String(bot&&bot.id||'');
      if(force||associationKey!==requestKey){
        associationEpoch++;associationKey=requestKey;associationStatus='idle';associationDetail=null;associationExpanded={};
        associationsMount.replaceChildren();associationsMount.dataset.state='empty';delete associationsMount.dataset.botId;
      }
      if(!current||!bot){
        associationMessage(snapshotValid?tr('当前空间中没有此 Bot 的关联资料。','No linked information for this Bot in the current space.'):tr('正在核对当前 Bot…','Checking the current Bot…'),snapshotValid?'empty':'loading');
        return Promise.resolve(false);
      }
      associationsMount.dataset.botId=String(bot.botId||bot.id);
      if(associationStatus==='ready'){renderBotAssociations(associationDetail,key);return Promise.resolve(true);}
      if(associationStatus==='loading'||associationStatus==='error')return Promise.resolve(false);
      if(associationsMount.hidden||associationsMount.closest('[hidden]'))return Promise.resolve(false);
      if(!bridge||typeof bridge.unifiedWorkspaceDetail!=='function'){associationMessage(tr('暂时无法读取关联资料。','Linked information is unavailable.'),'error');return Promise.resolve(false);}
      var ticket=++associationEpoch,expectedBot=String(bot.id);associationStatus='loading';
      associationMessage(tr('正在读取…','Loading…'),'loading');
      return Promise.resolve().then(function(){return bridge.unifiedWorkspaceDetail({spaceId:current.spaceId,scopeRevision:current.scopeRevision,ref:{type:'BotInstanceRef',id:expectedBot}});}).then(function(result){
        if(ticket!==associationEpoch||key!==currentAssociationKey()||requestKey!==associationKey)return false;
        if(!validResponse(result,current)||!result.entity||result.entity.type!=='BotInstanceRef'||String(result.entity.id)!==expectedBot)throw new Error('Unavailable association');
        associationStatus='ready';associationDetail=result;renderBotAssociations(result,key);return true;
      }).catch(function(){
        if(ticket!==associationEpoch||key!==currentAssociationKey()||requestKey!==associationKey)return false;
        associationStatus='error';associationDetail=null;associationMessage(tr('关联资料未能读取。','Could not load linked information.'),'error');
        var retry=button(tr('重试','Retry'),'bot-associations-retry',function(){if(key===currentAssociationKey())syncBotAssociations(true);});associationsMount.appendChild(retry);return false;
      });
    }

    function contextPage() {
      var explicit = pageCache.get(contextOriginKey) || currentPage();
      if (explicit) return explicit;
      var bot = legacyContextBot();
      return bot ? pageCache.get('BotInstanceRef:' + String(bot.id)) || null : null;
    }

    function contextTargets(page) {
      var groups = { bots: [], projects: [], files: [] }, seen = new Set();
      function add(ref, label, metadata) {
        ref = normalizeRef(ref);
        if (!ref || seen.has(refKey(ref))) return;
        var group = ref.type === 'BotInstanceRef' ? 'bots' : ['Thread', 'WorkTask', 'Project'].indexOf(ref.type) >= 0 ? 'projects' : ['FileRef', 'RootBinding'].indexOf(ref.type) >= 0 ? 'files' : '';
        if (!group) return;
        seen.add(refKey(ref));
        var collection = { BotInstanceRef: 'bots', Thread: 'threads', WorkTask: 'tasks', Project: 'projects', RootBinding: 'roots' }[ref.type];
        var entity = (snapshot[collection] || []).find(function (item) { return String(item.id) === ref.id; });
        groups[group].push({ ref: Object.assign({}, metadata || {}, ref), label: label || safeName(entity) || formatEntityType(ref.type) });
      }
      var detail = page && !page.error && page.detail;
      var entity = detail && detail.entity;
      if (!page) {
        var legacy = getLegacyState() || {};
        entity = (snapshot.bots || []).find(function (item) { return String(item.botId || item.id) === String(legacy.activeBotId || legacy.botId || ''); });
        if (entity) entity = Object.assign({}, entity, { type: 'BotInstanceRef' });
      }
      if (!entity) return groups;
      add(entity, safeName(entity));
      add(entity.botRef || entity.ownerBotRef || entity.executorBotRef);
      if (entity.threadId) add({ type: 'Thread', id: entity.threadId });
      if (entity.rootId) add({ type: 'RootBinding', id: entity.rootId });
      var task = page && page.threadTaskDetail;
      var taskId = entity.type === 'WorkTask' ? entity.id : entity.primaryTaskId || entity.taskId;
      if (task && !page.threadTaskError) {
        add(task.entity.ownerBotRef);
        add({ type: 'WorkTask', id: task.entity.id }, safeName(task.entity));
      }
      var relatedThreads = detail && detail.threads || [];
      relatedThreads.forEach(function (thread) { add({ type: 'Thread', id: thread.id }, safeName(thread)); });
      (snapshot.threads || []).forEach(function (thread) {
        if (entity.type === 'BotInstanceRef' && thread.botRef && String(thread.botRef.id) === String(entity.id) || taskId && String(threadTaskId(thread)) === String(taskId)) add({ type: 'Thread', id: thread.id }, safeName(thread));
      });
      (detail && detail.roots || []).forEach(function (item) { add({ type: 'RootBinding', id: item.id }, safeName(item)); });
      (detail && detail.files || []).forEach(function (item) { add({ type: 'FileRef', id: item.id }, item.relativePath || safeName(item), { rootId: item.rootId }); });
      var relations = (detail && detail.relations || []).concat(task && !page.threadTaskError && task.relations || []);
      relations.forEach(function (relation) {
        if (!relation || relation.endedAt) return;
        var subject = normalizeRef(relation.subjectRef), object = normalizeRef(relation.objectRef);
        if (!subject || !object) return;
        if (relation.predicate === 'file_produced_by_task' && object.type === 'WorkTask' && (String(object.id) === String(taskId) || entity.type === 'FileRef' && String(subject.id) === String(entity.id))) {
          add(subject, relation.subjectLabel);
          (snapshot.threads || []).filter(function (thread) { return String(threadTaskId(thread)) === object.id; }).forEach(function (thread) { add({ type: 'Thread', id: thread.id }, safeName(thread)); add(thread.botRef); });
        }
      });
      return groups;
    }

    function refreshContextOrigin() {
      var origin = contextPage();
      if (!origin || origin === currentPage()) return;
      if (origin.ref.type === 'FileRef') loadFileReference(origin);
      else loadDetail(origin);
      renderContext();
    }

    function renderContext() {
      if (!contextMount) return;
      var activeKey = document.activeElement && contextMount.contains(document.activeElement) ? document.activeElement.dataset.ouwContextRef : '';
      contextMount.replaceChildren();
      contextMount.hidden = true;
      if (activeKey) {
        var fallback = switcherMount.querySelector('[aria-selected="true"], select');
        if (fallback) fallback.focus({ preventScroll: true });
      }
      if (focusedNavigation() || !snapshot || !sameScope(scope, getCurrentScope())) return;
      var page = contextPage();
      if (!page && !currentPageKey) {
        var bot = legacyContextBot();
        if (bot) {
          page = getPage({ type: 'BotInstanceRef', id: String(bot.id) });
          loadDetail(page);
          return;
        }
      }
      if (page && (page.codex || page.error || page.loading)) return;
      var targets = contextTargets(page), items = targets[view];
      var origin = page && page.ref || targets.bots[0] && targets.bots[0].ref;
      if (!origin) return;
      contextMount.hidden = false;
      var titleText = page ? pageTitle(page) : targets.bots[0].label;
      var title = el('div', 'ouw-context-title', titleText);
      title.title = titleText;
      contextMount.appendChild(title);
      var labels = { bots: ['关联 BOT', 'Related BOTs'], projects: ['关联会话与任务', 'Related sessions and tasks'], files: ['关联文件与目录', 'Related files and folders'] };
      var expansionKey = refKey(origin) + ':' + view;
      var expanded = contextExpanded.has(expansionKey);
      var caption = el('span', 'ouw-context-caption', tr(labels[view][0], labels[view][1]));
      caption.id = 'ouw-context-caption';
      contextMount.appendChild(caption);
      var links = el('div', 'ouw-context-links');
      links.id = 'ouw-context-links';
      links.setAttribute('role', 'group');
      links.setAttribute('aria-labelledby', caption.id);
      items.slice(0, expanded ? items.length : 4).forEach(function (item) {
        var link = button(item.label, 'ouw-context-link', function () {
          var anchor = page && page.key || '';
          openEntity(item.ref);
          contextOriginKey = anchor;
          renderContext();
          pageHeader.querySelector('[data-ouw-title]').focus({ preventScroll: true });
        }, item.label);
        link.dataset.ouwContextRef = refKey(item.ref);
        if (currentPageKey === refKey(item.ref)) link.setAttribute('aria-current', 'true');
        links.appendChild(link);
      });
      if (!items.length) links.appendChild(el('span', 'ouw-context-caption', tr('暂无已登记关联，可在下方浏览全部。', 'No recorded links. Browse all below.')));
      contextMount.appendChild(links);
      if (items.length > 4) {
        var more = button(expanded ? tr('收起关联', 'Show fewer') : tr('显示全部 ' + items.length + ' 项', 'Show all ' + items.length), 'ouw-context-locate', function () {
          if (expanded) contextExpanded.delete(expansionKey); else contextExpanded.add(expansionKey);
          renderContext();
        });
        more.dataset.ouwContextRef = 'more';
        more.setAttribute('aria-expanded', String(expanded));
        more.setAttribute('aria-controls', links.id);
        contextMount.appendChild(more);
      }
      var row = Array.from(listMount.querySelectorAll('[data-ouw-row-ref]')).find(function (item) { return item.dataset.ouwRowRef === currentPageKey; });
      if (row) {
        var locate = button(tr('定位当前项', 'Locate current item'), 'ouw-context-locate', function () {
          row.scrollIntoView({ block: 'nearest', behavior: 'auto' }); row.focus({ preventScroll: true });
        });
        locate.dataset.ouwContextRef = 'locate'; contextMount.appendChild(locate);
      }
      if (activeKey) {
        var replacement = Array.from(contextMount.querySelectorAll('[data-ouw-context-ref]')).find(function (node) { return node.dataset.ouwContextRef === activeKey; });
        if (replacement) replacement.focus({ preventScroll: true });
      }
    }

    function markSidebarFocusTargets() {
      var counts = Object.create(null);
      listMount.querySelectorAll('button, input, select, summary, [tabindex]').forEach(function (node) {
        var owner = node.closest('[data-ouw-row-ref], [data-ouw-root-id], [data-ouw-project-id]');
        var identity = owner && (owner.dataset.ouwRowRef || owner.dataset.ouwRootId || owner.dataset.ouwProjectId) || '';
        var key = identity + ':' + (node.id || node.getAttribute('aria-label') || node.getAttribute('title') || node.className + ':' + node.textContent);
        counts[key] = (counts[key] || 0) + 1;
        node.dataset.ouwFocusKey = key + ':' + counts[key];
      });
    }

    function renderSidebar() {
      renderImportedHistory();
      syncBotAssociations();
      if (!listMount) return;
      closeProjectActionMenus(false);
      var viewChanged = ensureVisibleView();
      var activeElement = document.activeElement;
      var previousView = sidebarRenderedView;
      if (previousView) sidebarPositions[previousView] = listMount.scrollTop;
      var focusKey = previousView === view && listMount.contains(activeElement) && activeElement.dataset.ouwFocusKey;
      sidebarRenderedView = view;
      var restoreSearchFocus = !!(activeElement && activeElement.classList && activeElement.classList.contains('ouw-search-input') && listMount.contains(activeElement));
      var searchSelection = restoreSearchFocus ? [activeElement.selectionStart, activeElement.selectionEnd] : null;
      setSwitcherState();
      if (lastNotifiedView !== view) {
        lastNotifiedView = view;
        try { onViewChange(view, { experiment: experimentEnabled(), perspectiveOnly: true }); } catch (error) {}
      }
      if (viewChanged && snapshot && !focusedNavigation() && !experimentEnabled()) savePreferences({ navigationView: view }, { render: false });
      listMount.replaceChildren();
      listMount.classList.remove('ouw-files-list');
      renderContext();
      var statusNode = el('div', 'ouw-list-status');
      if (!snapshot) {
        showStatus(statusNode, navStatus || tr('正在读取…', 'Loading…'), 'muted');
        listMount.appendChild(statusNode);
        return;
      }
      var recovery = snapshot.startupRecovery;
      if (recovery && Array.isArray(recovery.issues) && recovery.issues.length) {
        var recoveryAlert = el('div', 'ouw-recovery-alert');
        recoveryAlert.setAttribute('role', 'alert');
        recoveryAlert.appendChild(el('strong', '', tr('启动恢复需要核查', 'Startup recovery needs review')));
        recoveryAlert.appendChild(el('span', '', tr('没有自动重发执行请求。请检查下面的执行记录或恢复授权来源。', 'No execution request was automatically resent. Inspect the Run records or restore the authorized source.')));
        recovery.issues.forEach(function (issue) {
          var issueLabel = [issue.code, issue.recoveryAction].filter(Boolean).join(' · ');
          if (issueLabel) recoveryAlert.appendChild(el('small', '', issueLabel));
        });
        listMount.appendChild(recoveryAlert);
      }
      var p = prefs();
      if (p.status && p.status !== 'ready') {
        showStatus(statusNode, formatStatus(p.status), 'muted');
        listMount.appendChild(statusNode);
      }
      // The host's Bot list already supplies selection, avatars and primary
      // ordering. Keep this shared navigation free of a second Bot summary.
      if (experimentEnabled() && view === 'projects') renderExperimentTaskSessionsList(listMount);
      else if (view === 'projects') renderProjectsList(listMount);
      else if (view === 'files') renderFilesList(listMount);
      if (navStatus) {
        var footer = el('div', 'ouw-inline-status');
        showStatus(footer, navStatus, 'error');
        listMount.appendChild(footer);
      }
      if (restoreSearchFocus) {
        var nextSearch = listMount.querySelector('.ouw-search-input');
        if (nextSearch) {
          nextSearch.focus();
          try { nextSearch.setSelectionRange(searchSelection[0], searchSelection[1]); } catch (error) {}
        }
      }
      markSidebarFocusTargets();
      if (focusKey && !restoreSearchFocus) {
        var replacement = Array.from(listMount.querySelectorAll('[data-ouw-focus-key]')).find(function (node) { return node.dataset.ouwFocusKey === focusKey; });
        if (replacement) replacement.focus({ preventScroll: true });
      }
      listMount.scrollTop = sidebarPositions[view] || 0;
      updateSidebarCurrent();
    }

    function openLegacyBot(bot) {
      if (currentPageKey) rememberLegacyReturn(currentPageKey);
      showWorkspace(false);
      // 单行化 #5：隐藏详情路径同样清当前页标识并同步行高亮。
      currentPageKey = '';
      updateSidebarCurrent();
      if (experimentEnabled()) syncExperimentAssociations(false);
      try { openBot(String(bot && (bot.botId || bot.id) || '')); } catch (error) { setNavStatus(messageForError(error), 'error'); }
    }

    function openBotRelations(botOrId) {
      var id = String(botOrId && (botOrId.id || botOrId.botId) || botOrId || '');
      var expectedScope = getCurrentScope();
      if (!expectedScope) {
        setNavStatus(tr('请选择一个空间后再打开 Bot 会话。', 'Select a space before opening this Bot’s sessions.'), 'error');
        return false;
      }
      var snapshotCurrent = snapshot && String(snapshot.spaceId || '') === expectedScope.spaceId &&
        String(snapshot.scopeRevision) === String(expectedScope.scopeRevision);
      if (!snapshotCurrent) {
        setNavStatus(tr('正在核对当前空间中的 Bot…', 'Checking this Bot in the current space…'), 'muted');
        return refresh().then(function (loaded) {
          if (!sameScope(expectedScope, getCurrentScope())) return false;
          if (!loaded) {
            if (!snapshot || String(snapshot.spaceId || '') !== expectedScope.spaceId || String(snapshot.scopeRevision) !== String(expectedScope.scopeRevision)) {
              setNavStatus(tr('当前空间清单尚未读取完成，未打开旧 Bot 详情。请重试。', 'The current space list is not available yet. The old Bot detail was not opened; please retry.'), 'error');
            }
            return false;
          }
          return openBotRelations(id);
        });
      }
      var bot = (snapshot && snapshot.bots || []).find(function (item) { return String(item.id) === id || String(item.botId) === id; });
      if (!bot) {
        setNavStatus(tr('当前空间中找不到此 BOT。', 'This BOT is not available in the current space.'), 'error');
        return false;
      }
      openEntity({ type: 'BotInstanceRef', id: String(bot.id) });
      return true;
    }

    function renderProjectsList(host) {
      var projects = Array.isArray(snapshot.projects) ? snapshot.projects : [];
      var tasks = Array.isArray(snapshot.tasks) ? snapshot.tasks : [];
      var threads = Array.isArray(snapshot.threads) ? snapshot.threads : [];
      var activeProjectId = visibleProjectDetailId();
      var titleRow = el('div', 'ouw-list-heading-row');
      titleRow.appendChild(sectionHeading(tr('会话', 'Sessions')));
      var actions = el('div', 'ouw-list-actions');
      var discoveryButton = button(tr('扫描本机', 'Scan this computer'), 'ouw-small-action', openLocalDiscovery);
      discoveryButton.dataset.ouwAction = 'scan-local';
      var discoveryScope = getCurrentScope();
      discoveryButton.disabled = !discoveryScope || String(discoveryScope.spaceId) !== 'personal';
      if (discoveryButton.disabled) discoveryButton.title = tr('仅个人空间可用', 'Available in personal space only');
      actions.appendChild(discoveryButton);
      actions.appendChild(button(tr('项目+', 'Project +'), 'ouw-small-action', openCreateProjectForm));
      var newThreadAction = button(tr('新建任务会话', 'New task session'), 'ouw-small-action', openCreateThreadForm);
      newThreadAction.dataset.ouwNewTaskThread = 'true';
      newThreadAction.hidden = !!activeProjectId;
      actions.appendChild(newThreadAction);
      titleRow.appendChild(actions);
      host.appendChild(titleRow);
      if (!projects.length && !tasks.length && !threads.length) {
        host.appendChild(emptyState(tr('这里还没有 Bot Studio 工程或任务。', 'No Bot Studio projects or tasks yet.')));
      }
      projects.forEach(function (project) {
        if (!project || !project.id) return;
        var group = el('section', 'ouw-project-group ouw-engineering-card');
        group.dataset.ouwProjectId = String(project.id);
        var titleRow = el('div', 'ouw-project-row');
        var expanded = localExpanded.projects[String(project.id)] !== false;
        var disclosure = button(expanded ? '⌄' : '›', 'ouw-disclosure', function () {
          localExpanded.projects[String(project.id)] = !expanded;
          savePreferences({ expanded: { projects: Object.assign({}, localExpanded.projects) } });
          renderSidebar();
        });
        disclosure.setAttribute('aria-expanded', String(expanded));
        disclosure.setAttribute('aria-label', expanded ? tr('折叠项目', 'Collapse project') : tr('展开项目', 'Expand project'));
        titleRow.appendChild(disclosure);
        titleRow.appendChild(button(safeName(project), 'ouw-project-title', function () { openEntity({ type: 'Project', id: project.id }); }, safeName(project)));
        if (project.status) titleRow.appendChild(el('span', 'ouw-project-status', formatStatus(project.status)));
        var actionMenu = createProjectActionMenu(project);
        titleRow.appendChild(actionMenu.trigger);
        group.appendChild(titleRow);
        group.appendChild(actionMenu.menu);
        group.addEventListener('contextmenu', function (event) {
          if (event.target && event.target.closest && event.target.closest('.ouw-project-menu')) return;
          if (event.target && event.target.closest && event.target.closest('.ouw-task-row,.ouw-thread-row')) return;
          event.preventDefault();
          openProjectActionMenu(actionMenu.menu, actionMenu.trigger);
        });
        if (project.description) group.appendChild(el('div', 'ouw-project-description', project.description));
        var evidence = el('div', 'ouw-project-evidence ouw-project-evidence-compact');
        evidence.dataset.ouwProjectEvidence = String(project.id);
        group.appendChild(evidence);
        loadProjectEvidence(project, evidence);
        if (expanded) {
          var projectTasks = tasks.filter(function (task) { return String(task.primaryProjectId || '') === String(project.id); });
          var projectDirectThreads = threads.filter(function (thread) {
            return String(projectIdForThread(thread, tasks)) === String(project.id) && !taskForThread(thread, tasks);
          });
          if (!projectTasks.length && !projectDirectThreads.length) group.appendChild(el('div', 'ouw-subtle-empty', tr('暂无任务或会话', 'No tasks or threads yet')));
          projectTasks.forEach(function (task) {
            group.appendChild(taskRow(task, 1));
            threads.filter(function (thread) { return String(threadTaskId(thread)) === String(task.id); }).forEach(function (thread) {
              group.appendChild(threadRow(thread, 2));
            });
          });
          if (projectDirectThreads.length) {
            group.appendChild(el('div', 'ouw-section-heading ouw-project-direct-thread-heading', tr('会话', 'Threads')));
            projectDirectThreads.forEach(function (thread) { group.appendChild(threadRow(thread, 1)); });
          }
          var createTaskAction = button(tr('新建任务', 'New task'), 'ouw-inline-action', function () { openCreateTaskForm(project.id); });
          createTaskAction.dataset.ouwProjectTaskAction = String(project.id);
          createTaskAction.hidden = String(project.id) === activeProjectId;
          group.appendChild(createTaskAction);
        }
        host.appendChild(group);
      });
      var unassignedTasks = tasks.filter(function (task) { return !task.primaryProjectId || !projects.some(function (p) { return String(p.id) === String(task.primaryProjectId); }); });
      var unassignedThreads = threads.filter(function (thread) {
        if (taskForThread(thread, tasks)) return false;
        var projectId = projectIdForThread(thread, tasks);
        return !projectId || !projects.some(function (project) { return String(project.id) === projectId; });
      });
      if (unassignedTasks.length || unassignedThreads.length) {
        host.appendChild(sectionHeading(tr('未归项目', 'Unassigned')));
        unassignedTasks.forEach(function (task) {
          host.appendChild(taskRow(task, 0));
          threads.filter(function (thread) { return threadTaskId(thread) === String(task.id); }).forEach(function (thread) { host.appendChild(threadRow(thread, 1)); });
        });
        unassignedThreads.forEach(function (thread) { host.appendChild(threadRow(thread, 0)); });
      }
      // M8/M12 UI 补全：记忆提案审批面板与跨 BOT 等待面板。
      renderMemoryProposalPanel(host);
      renderBotWaitsPanel(host);
    }

    function renderExperimentProjectRoles(target, detail) {
      if (!target) return;
      target.replaceChildren();
      var roleMap = new Map();
      (detail.relations || []).forEach(function (relation) {
        if (relation.endedAt || ['bot_owns_project', 'bot_participates_project'].indexOf(relation.predicate) < 0 ||
            !relation.subjectRef || relation.subjectRef.type !== 'BotInstanceRef' || !relation.objectRef ||
            relation.objectRef.type !== 'Project') return;
        var id = String(relation.subjectRef.id);
        var entry = roleMap.get(id) || { ref: relation.subjectRef, name: relation.subjectLabel || id, roles: [] };
        var role = relation.predicate === 'bot_owns_project' ? tr('工程管理', 'Project manager') : tr('工程协作', 'Project collaborator');
        if (entry.roles.indexOf(role) < 0) entry.roles.push(role);
        roleMap.set(id, entry);
      });
      var roles = Array.from(roleMap.values());
      if (!roles.length) target.appendChild(el('div', 'ouw-experiment-role-empty', tr('尚未关联管理 BOT', 'No managing BOT recorded')));
      roles.slice(0, 12).forEach(function (entry) {
        var row = el('div', 'ouw-experiment-role');
        row.appendChild(el('span', 'ouw-experiment-role-kind', entry.roles.join(' · ')));
        row.appendChild(button(entry.name, 'ouw-experiment-role-bot', function () {
          openEntity({ type: 'BotInstanceRef', id: entry.ref.id });
        }, entry.name));
        row.dataset.ouwProjectBotRole = entry.roles.join(',');
        target.appendChild(row);
      });
      var executors = [];
      (detail.runs || []).forEach(function (run) {
        var adapterId = String(run && run.adapterId || '');
        if (adapterId && executors.indexOf(adapterId) < 0) executors.push(adapterId);
      });
      var executorRow = el('div', 'ouw-experiment-role ouw-experiment-executors');
      executorRow.appendChild(el('span', 'ouw-experiment-role-kind', tr('实际执行器', 'Actual executors')));
      executorRow.appendChild(el('span', 'ouw-experiment-role-value', executors.length ? executors.join(' · ') : tr('暂无执行记录', 'No runs recorded')));
      target.appendChild(executorRow);
    }

    function loadExperimentProjectRoles(project, target) {
      if (!bridge || typeof bridge.unifiedWorkspaceDetail !== 'function') {
        renderProjectEvidenceUnavailable(target, tr('工程角色暂不可用。', 'Project roles are unavailable.'));
        return;
      }
      var currentScope = getCurrentScope();
      if (!currentScope) return;
      var key = projectEvidenceKey(project, currentScope);
      var cached = projectSummaries.get(key);
      if (cached && cached.detail) {
        renderExperimentProjectRoles(target, cached.detail);
        return;
      }
      var request = experimentProjectRoleRequests.get(key);
      if (!request) {
        request = Promise.resolve(bridge.unifiedWorkspaceDetail({
          spaceId: currentScope.spaceId, scopeRevision: currentScope.scopeRevision,
          ref: { type: 'Project', id: String(project.id) }
        })).then(function (result) {
          if (!validResponse(result, currentScope) || !result.entity || String(result.entity.id) !== String(project.id)) {
            throw commandError(result, tr('工程角色响应无法确认。', 'Project role response could not be confirmed.'));
          }
          projectSummaries.set(key, { detail: result });
          var currentTarget = Array.from(listMount.querySelectorAll('[data-ouw-experiment-project-roles]'))
            .find(function (node) { return node.dataset.ouwExperimentProjectRoles === String(project.id); });
          if (currentTarget) renderExperimentProjectRoles(currentTarget, result);
          return result;
        }).catch(function (error) {
          var currentTarget = Array.from(listMount.querySelectorAll('[data-ouw-experiment-project-roles]'))
            .find(function (node) { return node.dataset.ouwExperimentProjectRoles === String(project.id); });
          if (currentTarget) renderProjectEvidenceUnavailable(currentTarget, messageForError(error, tr('工程角色读取失败。', 'Unable to read project roles.')));
          return null;
        }).finally(function () {
          if (experimentProjectRoleRequests.get(key) === request) experimentProjectRoleRequests.delete(key);
        });
        experimentProjectRoleRequests.set(key, request);
      }
    }

    function experimentThreadRoleText(thread) {
      var parts = [];
      var participant = normalizeRef(thread && thread.participatingBotRef);
      var owner = normalizeRef(thread && thread.botRef);
      var summary = thread && snapshot && snapshot.sessionSummaries && snapshot.sessionSummaries[thread.id];
      var executor = normalizeRef(summary && summary.botRef);
      var botName = function (ref) {
        var bot = ref && (snapshot.bots || []).find(function (item) { return String(item.id) === String(ref.id); });
        return bot ? safeName(bot) : ref && ref.id;
      };
      if (participant && !/^threadexec_/.test(participant.id)) parts.push(tr('会话参与 · ', 'Thread participant · ') + botName(participant));
      if (summary && summary.latestRunId && executor && !/^threadexec_/.test(executor.id)) {
        parts.push(tr('实际执行器 · ', 'Actual executor · ') + botName(executor));
      } else if (owner && !/^threadexec_/.test(owner.id) && (!participant || participant.id !== owner.id)) {
        parts.push(tr('归属 · ', 'Owner · ') + botName(owner));
      }
      return parts.join(tr('；', '; '));
    }

    function experimentTaskThreadRow(thread, depth) {
      var row = threadRow(thread, depth);
      row.dataset.ouwExperimentTaskThread = String(thread.id);
      var labels = row.querySelector('.ouw-row-labels');
      var roleText = experimentThreadRoleText(thread);
      if (labels && roleText) labels.appendChild(el('span', 'ouw-row-meta', roleText));
      var nativeMapping = experimentNativeMappingForThread(thread);
      if (labels && nativeMapping) {
        var nativeMeta = el('span', 'ouw-row-meta',
          tr('原生来源已归并 · ', 'Native source merged · ') + String(nativeMapping.streamLabel || nativeMapping.source.label || ''));
        nativeMeta.dataset.ouwNativeSourceMerged = String(nativeMapping.source.id);
        labels.appendChild(nativeMeta);
      }
      return row;
    }

    function renderExperimentTaskSessionsList(host) {
      var projects = Array.isArray(snapshot.projects) ? snapshot.projects : [];
      var tasks = Array.isArray(snapshot.tasks) ? snapshot.tasks : [];
      var threads = Array.isArray(snapshot.threads) ? snapshot.threads : [];
      var taskThreads = threads.filter(function (thread) {
        return thread && thread.kind === 'task' && !thread.archivedAt && !thread.deletedAt;
      });
      var legacyThreads = threads.filter(function (thread) {
        return thread && thread.kind === 'legacy-task' && !thread.archivedAt && !thread.deletedAt;
      });
      var titleRow = el('div', 'ouw-list-heading-row');
      titleRow.appendChild(sectionHeading(tr('任务会话', 'Task Sessions')));
      var actions = el('div', 'ouw-list-actions');
      var newThreadAction = button(tr('新建任务会话', 'New task session'), 'ouw-small-action', openCreateThreadForm);
      newThreadAction.dataset.ouwNewTaskThread = 'true';
      actions.appendChild(newThreadAction);
      titleRow.appendChild(actions);
      host.appendChild(titleRow);
      if (!taskThreads.length) host.appendChild(emptyState(tr('还没有独立任务会话。BOT 日常聊天仍在 BOT 视角。', 'No standalone task sessions yet. BOT daily chats remain under BOTs.')));
      var rendered = new Set();
      projects.forEach(function (project) {
        var groupThreads = taskThreads.filter(function (thread) { return String(projectIdForThread(thread, tasks)) === String(project.id); });
        groupThreads.forEach(function (thread) { rendered.add(String(thread.id)); });
        var group = el('section', 'ouw-project-group ouw-engineering-card ouw-experiment-project-group');
        group.dataset.ouwProjectId = String(project.id);
        var row = el('div', 'ouw-project-row');
        row.appendChild(button(safeName(project), 'ouw-project-title', function () { openEntity({ type: 'Project', id: project.id }); }, safeName(project)));
        group.appendChild(row);
        var roles = el('div', 'ouw-experiment-project-roles');
        roles.dataset.ouwExperimentProjectRoles = String(project.id);
        group.appendChild(roles);
        loadExperimentProjectRoles(project, roles);
        if (!groupThreads.length) group.appendChild(el('div', 'ouw-subtle-empty', tr('暂无任务会话', 'No task sessions yet')));
        groupThreads.forEach(function (thread) { group.appendChild(experimentTaskThreadRow(thread, 1)); });
        host.appendChild(group);
      });
      var unassigned = taskThreads.filter(function (thread) {
        if (rendered.has(String(thread.id))) return false;
        var projectId = projectIdForThread(thread, tasks);
        return !projectId || !projects.some(function (project) { return String(project.id) === String(projectId); });
      });
      if (unassigned.length) {
        host.appendChild(sectionHeading(tr('未归工程', 'No project')));
        unassigned.forEach(function (thread) { host.appendChild(experimentTaskThreadRow(thread, 0)); });
      }
      if (legacyThreads.length) {
        var history = el('details', 'ouw-experiment-history');
        var summary = el('summary', '', tr('历史任务记录 · ' + legacyThreads.length, 'Historical task records · ' + legacyThreads.length));
        history.appendChild(summary);
        history.appendChild(el('p', 'ouw-list-status is-muted', tr('历史记录保留原来源能力，不等同于可续作任务会话。', 'Historical records keep their original source capability and are not standalone resumable task sessions.')));
        legacyThreads.slice(0, 20).forEach(function (thread) { history.appendChild(experimentTaskThreadRow(thread, 0)); });
        host.appendChild(history);
      }
      renderExperimentNativeTaskSessions(host);
    }

    function threadPendingMemoryProposals(thread) {
      // M8：会话归属 BOT 的待审记忆提案（行徽标与详情说明共用）。
      var ownerRef = thread && (thread.participatingBotRef || thread.botRef);
      if (!ownerRef || !Array.isArray(snapshot.memoryProposals)) return [];
      return snapshot.memoryProposals.filter(function (proposal) {
        return proposal && proposal.status === 'held' && proposal.botRef && String(proposal.botRef.id) === String(ownerRef.id);
      });
    }

    function renderMemoryProposalPanel(host) {
      // M8：审批面板——批准/拒绝须经 reviewBotMemory 审查（批准后自动通知参与会话）。
      var proposals = Array.isArray(snapshot.memoryProposals) ? snapshot.memoryProposals.filter(function (proposal) { return proposal && proposal.status === 'held'; }) : [];
      if (!proposals.length) return;
      var section = el('section', 'ouw-memory-proposal-section');
      section.dataset.ouwMemoryProposals = 'pending';
      section.appendChild(sectionHeading(tr('记忆提案待审', 'Memory proposals')));
      proposals.slice(0, 20).forEach(function (proposal) {
        var row = el('div', 'ouw-memory-proposal-row');
        row.appendChild(el('span', 'ouw-row-title', String(proposal.text || '').slice(0, 160)));
        var actions = el('div', 'ouw-list-actions');
        actions.appendChild(button(tr('批准', 'Approve'), 'ouw-inline-action', function () {
          runCommand('reviewBotMemory', { id: proposal.id, decision: 'approve' }, function () { refresh(); });
        }));
        actions.appendChild(button(tr('拒绝', 'Reject'), 'ouw-inline-action ouw-memory-reject', function () {
          runCommand('reviewBotMemory', { id: proposal.id, decision: 'reject' }, function () { refresh(); });
        }));
        row.appendChild(actions);
        section.appendChild(row);
      });
      host.appendChild(section);
    }

    function renderBotWaitsPanel(host) {
      // M12：跨 BOT 等待面板——列出活等待，可关闭（消费不派发）。
      var waits = Array.isArray(snapshot.botWaits) ? snapshot.botWaits : [];
      if (!waits.length) return;
      var section = el('section', 'ouw-bot-waits-section');
      section.dataset.ouwBotWaits = 'open';
      section.appendChild(sectionHeading(tr('等待中的续办', 'Open waits')));
      waits.slice(0, 20).forEach(function (wait) {
        var row = el('div', 'ouw-bot-wait-row');
        var label = String(wait.title || wait.threadId || '') + (wait.reason ? ' · ' + String(wait.reason) : '');
        row.appendChild(el('span', 'ouw-row-title', label));
        row.appendChild(button(tr('关闭等待', 'Close wait'), 'ouw-inline-action', function () {
          runCommand('closeBotWait', { threadId: wait.threadId }, function () { refresh(); });
        }));
        section.appendChild(row);
      });
      host.appendChild(section);
    }

    function openSendBotMessageForm(page, thread) {
      // M10 UI 补全：向参与 BOT 发消息的详情页内联表单（对方运行结束后自动唤醒回复）。
      var existing = page.body.querySelector('[data-ouw-bot-message-form]');
      if (existing) { existing.remove(); return; }
      var form = createInlineForm(tr('发消息给参与 BOT', 'Message the participating BOT'));
      form.dataset.ouwBotMessageForm = 'true';
      var senderField = field(tr('发件 BOT', 'From BOT'), 'select', '');
      (snapshot && snapshot.bots || []).forEach(function (bot) {
        if (!bot || !bot.id) return;
        var option = el('option', '', safeName(bot));
        option.value = String(bot.id);
        senderField.input.appendChild(option);
      });
      var textField = field(tr('消息内容', 'Message'), 'text', '');
      form.append(senderField.wrap, textField.wrap);
      var submit = button(tr('发送（对方运行结束后自动唤醒回复）', 'Send (auto-wakes reply)'), 'ouw-primary-action', function () {
        if (!senderField.input.value) { senderField.input.focus(); return; }
        var text = textField.input.value.trim();
        if (!text) { textField.input.focus(); return; }
        runCommand('sendBotMessage', {
          fromBotRef: { type: 'BotInstanceRef', id: String(senderField.input.value) },
          toBotRef: thread.participatingBotRef, text: text, threadId: thread.id, expectsReply: true
        }, function () { closeForm(form); refresh(); }, form, submit);
      });
      form.appendChild(submit);
      page.body.appendChild(form);
      textField.input.focus();
    }

    function openLocalDiscovery() {
      var module = root.OpenBotLocalDiscovery;
      var currentScope = getCurrentScope();
      if (currentScope && String(currentScope.spaceId) !== 'personal') {
        setNavStatus(tr('本机发现仅在个人空间可用。', 'Local discovery is available in the personal space only.'), 'error');
        return;
      }
      if (!currentScope || !module || typeof module.open !== 'function') {
        setNavStatus(tr('本机发现入口暂不可用。', 'Local discovery is not available yet.'), 'error');
        return;
      }
      var dialog = module.open({
        scope: currentScope,
        projects: snapshot && Array.isArray(snapshot.projects) ? snapshot.projects : [],
        bots: snapshot && Array.isArray(snapshot.bots) ? snapshot.bots : [],
        getCurrentScope: getCurrentScope
      });
      if (!dialog) setNavStatus(tr('本机发现仅在个人空间可用。', 'Local discovery is available in the personal space only.'), 'error');
    }

    function normalizedIds(items) {
      var seen = new Set();
      return (Array.isArray(items) ? items : []).map(function (item) { return String(item || ''); }).filter(function (id) {
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    function pinnedProjectIds() {
      return normalizedIds(prefs().pinnedProjectIds);
    }

    function projectSummaryFor(projectId) {
      var project = (snapshot && snapshot.projects || []).find(function (item) { return String(item.id) === String(projectId); });
      var currentScope = getCurrentScope();
      if (!project || !currentScope) return null;
      var key = projectEvidenceKey(project, currentScope);
      return projectSummaries.get(key) && projectSummaries.get(key).detail || null;
    }

    function relationRootIds(detail, projectId) {
      return normalizedIds((Array.isArray(detail && detail.relations) ? detail.relations : []).filter(function (relation) {
        return !relation.endedAt && relation.predicate === 'project_binds_root' &&
          relation.subjectRef && relation.subjectRef.type === 'Project' && String(relation.subjectRef.id) === String(projectId) &&
          relation.objectRef && relation.objectRef.type === 'RootBinding';
      }).map(function (relation) { return relation.objectRef.id; }));
    }

    function rootIdsForProject(projectId) {
      var mapped = pinnedProjectRootIds.get(String(projectId)) || [];
      var navigation = snapshot && snapshot.navigation && snapshot.navigation.projectRoots;
      var navigationIds = navigation instanceof Map ? navigation.get(String(projectId)) : navigation && navigation[String(projectId)];
      var detail = projectSummaryFor(projectId);
      var fromRelations = relationRootIds(detail, projectId);
      var page = currentPage();
      if (page && page.ref.type === 'Project' && String(page.ref.id) === String(projectId)) {
        fromRelations = fromRelations.concat(relationRootIds(page.detail, projectId));
      }
      return normalizedIds((Array.isArray(navigationIds) ? navigationIds : []).concat(mapped, fromRelations));
    }

    function orderedFileRoots(roots) {
      var byId = new Map();
      (Array.isArray(roots) ? roots : []).forEach(function (item) {
        if (item && item.id) byId.set(String(item.id), item);
      });
      var ordered = [];
      var seen = new Set();
      (Array.isArray(roots) ? roots : []).filter(function (item) { return item && item.pinned === true; }).forEach(function (item) {
        var pinnedRootId = String(item.id || '');
        if (pinnedRootId && !seen.has(pinnedRootId)) { seen.add(pinnedRootId); ordered.push(item); }
      });
      pinnedProjectIds().forEach(function (projectId) {
        var project = (snapshot && snapshot.projects || []).find(function (item) { return String(item.id) === projectId; });
        if (!project) return;
        if (!projectSummaryFor(projectId) && view === 'files') loadProjectEvidence(project, null);
        rootIdsForProject(projectId).forEach(function (rootId) {
          var rootItem = byId.get(rootId);
          if (rootItem && !seen.has(rootId)) { seen.add(rootId); ordered.push(rootItem); }
        });
      });
      (Array.isArray(roots) ? roots : []).forEach(function (item) {
        var rootId = String(item && item.id || '');
        if (rootId && !seen.has(rootId)) { seen.add(rootId); ordered.push(item); }
      });
      return ordered;
    }

    function createProjectActionMenu(project) {
      var projectId = String(project.id);
      var trigger = button('⋯', 'ouw-project-more', function () {
        var group = trigger.closest && trigger.closest('.ouw-project-group');
        var menu = group && group.querySelector('.ouw-project-menu');
        if (!menu) return;
        if (menu.hidden) openProjectActionMenu(menu, trigger);
        else closeProjectActionMenu(menu, trigger, true);
      }, tr('更多工程操作', 'More project actions'));
      trigger.dataset.ouwProjectMenuId = projectId;
      trigger.setAttribute('aria-label', tr('工程操作：' + safeName(project), 'Project actions: ' + safeName(project)));
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', 'false');

      var menu = el('div', 'ouw-project-menu');
      menu.hidden = true;
      menu.setAttribute('role', 'menu');
      menu.setAttribute('aria-label', tr(safeName(project) + ' 的工程操作', 'Actions for ' + safeName(project)));
      var openItem = projectMenuItem(tr('在文件视角中打开', 'Open in Files view'), function () {
        closeProjectActionMenu(menu, trigger, false);
        projectNavigationAction('openProjectFiles', projectId, null, null).then(function () { focusProjectMore(projectId); });
      });
      openItem.dataset.ouwProjectAction = 'openProjectFiles';
      var isPinned = pinnedProjectIds().indexOf(projectId) >= 0;
      var pinItem = projectMenuItem(isPinned ? tr('取消固定到文件视角', 'Unpin from Files view') : tr('固定到文件视角', 'Pin to Files view'), function (event) {
        closeProjectActionMenu(menu, trigger, false);
        projectNavigationAction(isPinned ? 'unpinProject' : 'pinProject', projectId, null, event.currentTarget).then(function () { focusProjectMore(projectId); });
      });
      pinItem.dataset.ouwProjectAction = isPinned ? 'unpinProject' : 'pinProject';
      menu.append(openItem, pinItem);
      menu._ouwTrigger = trigger;
      menu._ouwProjectId = projectId;
      return { trigger: trigger, menu: menu };
    }

    function projectMenuItem(label, handler) {
      var item = button(label, 'ouw-project-menu-item', handler);
      item.setAttribute('role', 'menuitem');
      item.tabIndex = -1;
      return item;
    }

    function openProjectActionMenu(menu, trigger) {
      if (!menu || !trigger) return;
      closeProjectActionMenus(false);
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      menu._ouwClose = function (restoreFocus) { closeProjectActionMenu(menu, trigger, restoreFocus); };
      menu._ouwOutsideHandler = function (event) {
        if (!menu.contains(event.target) && event.target !== trigger) closeProjectActionMenu(menu, trigger, false);
      };
      menu._ouwKeyHandler = function (event) {
        var items = Array.from(menu.querySelectorAll('[role="menuitem"]')).filter(function (item) { return !item.disabled; });
        var index = items.indexOf(document.activeElement);
        if (event.key === 'Escape') { event.preventDefault(); closeProjectActionMenu(menu, trigger, true); }
        else if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          if (event.key === 'Home') index = 0;
          else if (event.key === 'End') index = items.length - 1;
          else index = (index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
          if (items[index]) items[index].focus();
        } else if (event.key === 'Tab') closeProjectActionMenu(menu, trigger, false);
      };
      document.addEventListener('pointerdown', menu._ouwOutsideHandler);
      menu.addEventListener('keydown', menu._ouwKeyHandler);
      var first = menu.querySelector('[role="menuitem"]');
      if (first) first.focus();
    }

    function closeProjectActionMenu(menu, trigger, restoreFocus) {
      if (!menu) return;
      menu.hidden = true;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (menu._ouwOutsideHandler) document.removeEventListener('pointerdown', menu._ouwOutsideHandler);
      if (menu._ouwKeyHandler) menu.removeEventListener('keydown', menu._ouwKeyHandler);
      menu._ouwOutsideHandler = null;
      menu._ouwKeyHandler = null;
      menu._ouwClose = null;
      if (restoreFocus && trigger && trigger.isConnected) trigger.focus();
    }

    function closeProjectActionMenus(restoreFocus) {
      if (!listMount) return;
      listMount.querySelectorAll('.ouw-project-menu').forEach(function (menu) {
        if (!menu.hidden) closeProjectActionMenu(menu, menu._ouwTrigger, restoreFocus);
      });
    }

    function focusProjectMore(projectId) {
      if (!listMount) return;
      var trigger = Array.from(listMount.querySelectorAll('[data-ouw-project-menu-id]')).find(function (item) { return item.dataset.ouwProjectMenuId === String(projectId); });
      if (trigger) trigger.focus();
    }

    function projectNavigationAction(action, projectId, botRef, actionNode) {
      if (!bridge || typeof bridge.unifiedWorkspaceProjectNavigation !== 'function') {
        var unavailable = tr('工程文件视角服务尚不可用。', 'Project file navigation is not available yet.');
        setNavStatus(unavailable, 'error');
        setCommandStatus(unavailable, 'error');
        renderSidebar();
        return Promise.resolve(false);
      }
      var currentScope = getCurrentScope();
      if (!currentScope) return Promise.resolve(false);
      var targetKey = projectId ? 'project:' + String(projectId) : refKey(botRef);
      var requestKey = String(currentScope.spaceId) + ':' + String(currentScope.scopeRevision) + ':' + String(action) + ':' + targetKey;
      if (projectNavigationRequests.has(requestKey)) return projectNavigationRequests.get(requestKey);
      var request = Object.assign({
        action: action,
        operationId: makeOperationId(),
        spaceId: currentScope.spaceId,
        scopeRevision: currentScope.scopeRevision
      }, projectId ? { projectId: String(projectId) } : { botRef: normalizeRef(botRef) });
      if (actionNode) actionNode.disabled = true;
      var pending = Promise.resolve(bridge.unifiedWorkspaceProjectNavigation(request)).then(function (result) {
        if (!sameScope(currentScope, getCurrentScope())) return false;
        if (result && result.canceled === true) return false;
        if (!validResponse(result, currentScope)) throw new Error(messageForError(result, tr('工程文件导航响应无法确认。', 'Project file navigation could not be confirmed.')));
        var rootIds = normalizedIds(result.rootIds);
        if (projectId && rootIds.length) pinnedProjectRootIds.set(String(projectId), rootIds);
        return refresh().then(function () {
          if (!sameScope(currentScope, getCurrentScope())) return false;
          if (Array.isArray(result.pinnedProjectIds) && snapshot) snapshot.preferences = Object.assign({}, prefs(), { pinnedProjectIds: normalizedIds(result.pinnedProjectIds) });
          if (action === 'pinProject' && snapshot && !Array.isArray(result.pinnedProjectIds)) snapshot.preferences = Object.assign({}, prefs(), { pinnedProjectIds: normalizedIds(pinnedProjectIds().concat([projectId])) });
          if (action === 'unpinProject' && snapshot && !Array.isArray(result.pinnedProjectIds)) snapshot.preferences = Object.assign({}, prefs(), { pinnedProjectIds: pinnedProjectIds().filter(function (id) { return id !== String(projectId); }) });
          renderSidebar();
          if (action === 'openProjectFiles' || action === 'openBotFiles') navigateToFileRoots(rootIds);
          return true;
        });
      }).catch(function (error) {
        if (sameScope(currentScope, getCurrentScope())) {
          var message = messageForError(error, tr('无法打开工程文件。', 'Unable to open project files.'));
          setNavStatus(message, 'error');
          setCommandStatus(message, 'error');
          renderSidebar();
        }
        return false;
      }).finally(function () {
        projectNavigationRequests.delete(requestKey);
        if (actionNode && actionNode.isConnected) actionNode.disabled = false;
      });
      projectNavigationRequests.set(requestKey, pending);
      return pending;
    }

    function navigateToFileRoots(rootIds) {
      var ids = normalizedIds(rootIds);
      if (!ids.length) {
        var noRoots = tr('没有可打开的关联目录。', 'There are no linked folders to open.');
        setNavStatus(noRoots, 'error');
        setCommandStatus(noRoots, 'error');
        renderSidebar();
        return false;
      }
      var rootId = ids.find(function (id) { return (snapshot && snapshot.roots || []).some(function (item) { return String(item.id) === id; }); }) || ids[0];
      var filesVisible = sidebarViews().indexOf('files') >= 0;
      if (filesVisible) {
        selectedRootId = rootId;
        localExpanded.roots[rootId] = true;
        if (view !== 'files') { view = 'files'; viewInteractionRevision += 1; }
        savePreferences({ navigationView: 'files', selectedRootId: rootId, expanded: { roots: Object.assign({}, localExpanded.roots) } }, { render: false });
        renderSidebar();
        loadTree(rootId, null);
      }
      openEntity({ type: 'RootBinding', id: rootId });
      return true;
    }

    function codexScopeKey(currentScope) {
      return currentScope ? String(currentScope.spaceId) + ':' + String(currentScope.scopeRevision) : '';
    }

    function historySettingsOpen() {
      return !!(historyMount && historyMount.isConnected && historyDisclosure && historyDisclosure.open && historyDisclosure.getClientRects().length);
    }

    function renderImportedHistory() {
      if (!historyMount || stopped) return;
      var active = document.activeElement;
      var focusKey = historyMount.contains(active) && active.dataset.ouwHistoryFocus;
      historyMount.replaceChildren();
      if (!historySettingsOpen()) return;
      if (!snapshot) {
        historyMount.appendChild(el('div', 'ouw-subtle-empty', navStatus || tr('正在读取…', 'Loading…')));
        return;
      }
      renderCodexHistorySources(historyMount);
      var counts = Object.create(null);
      historyMount.querySelectorAll('button').forEach(function (node) {
        var source = node.closest('[data-ouw-codex-source]');
        var key = (source && source.dataset.ouwCodexSource || '') + ':' + (node.getAttribute('aria-label') || node.textContent);
        counts[key] = (counts[key] || 0) + 1;
        node.dataset.ouwHistoryFocus = key + ':' + counts[key];
      });
      if (focusKey && document.activeElement === document.body) {
        var replacement = Array.from(historyMount.querySelectorAll('[data-ouw-history-focus]')).find(function (node) { return node.dataset.ouwHistoryFocus === focusKey; });
        if (replacement && !replacement.disabled) replacement.focus({ preventScroll: true });
      }
    }

    function codexHistoryEnabled() {
      return prefs().codexHistoryEnabled === true && !codexHistoryPreferenceBusy;
    }

    function removeCodexHistoryPages() {
      var active = currentPage();
      if (active && active.codex) {
        closeWorkspacePage();
        currentPageKey = '';
      }
      Array.from(pageCache.entries()).forEach(function (entry) {
        if (!entry[1] || !entry[1].codex) return;
        if (entry[1].node && entry[1].node.parentNode) entry[1].node.parentNode.removeChild(entry[1].node);
        pageCache.delete(entry[0]);
      });
      backStack = backStack.filter(function (key) { return pageCache.has(key); });
      if (legacyReturnPageKey && !pageCache.has(legacyReturnPageKey)) { legacyReturnPageKey = ''; legacyHop = false; }
    }

    function setCodexHistoryEnabled(enabled, actionNode) {
      var currentScope = getCurrentScope();
      enabled = enabled === true;
      if (!currentScope || currentScope.spaceId !== 'personal' || codexHistoryPreferenceBusy || enabled === (prefs().codexHistoryEnabled === true) && (!enabled || prefs().agentHistoryEnabled === true)) return Promise.resolve(false);
      var previous = prefs().codexHistoryEnabled === true;
      var previousAgents = prefs().agentHistoryEnabled === true;
      var epoch = ++codexHistoryPreferenceEpoch;
      refreshEpoch += 1;
      codexHistoryPreferenceBusy = true;
      codexHistoryPendingValue = enabled;
      if (actionNode) actionNode.disabled = true;
      var saving = savePreferences({ codexHistoryEnabled: enabled, agentHistoryEnabled: enabled }, { render: false });
      if (!enabled) {
        resetCodexHistoryState(currentScope);
        removeCodexHistoryPages();
        renderSidebar();
      }
      return saving.then(function (saved) {
        if (epoch !== codexHistoryPreferenceEpoch || !sameScope(currentScope, getCurrentScope())) return false;
        refreshEpoch += 1;
        codexHistoryPreferenceBusy = false;
        codexHistoryPendingValue = null;
        if (!saved) {
          if (snapshot) snapshot.preferences = Object.assign({}, prefs(), { codexHistoryEnabled: previous, agentHistoryEnabled: previousAgents });
          resetCodexHistoryState(currentScope);
          if (!navStatus) setNavStatus(tr('历史展示偏好未能保存。', 'Could not save the history display preference.'), 'error');
          renderSidebar();
          return false;
        }
        if (snapshot) snapshot.preferences = Object.assign({}, prefs(), { codexHistoryEnabled: enabled, agentHistoryEnabled: enabled });
        setNavStatus('', '');
        if (enabled) resetCodexHistoryState(currentScope);
        renderSidebar();
        return true;
      }).catch(function (error) {
        if (epoch === codexHistoryPreferenceEpoch && sameScope(currentScope, getCurrentScope())) {
          refreshEpoch += 1;
          codexHistoryPreferenceBusy = false;
          codexHistoryPendingValue = null;
          if (snapshot) snapshot.preferences = Object.assign({}, prefs(), { codexHistoryEnabled: previous, agentHistoryEnabled: previousAgents });
          resetCodexHistoryState(currentScope);
          setNavStatus(messageForError(error, tr('偏好未能保存。', 'Preferences could not be saved.')), 'error');
          renderSidebar();
        }
        return false;
      });
    }

    function resetCodexHistoryState(currentScope) {
      codexHistoryEpoch += 1;
      codexHistoryState = { scopeKey: codexScopeKey(currentScope), sources: null, loading: false, error: '', projects: new Map(), epoch: codexHistoryEpoch };
      codexQueryTimers.forEach(function (timer) { clearTimeout(timer); });
      codexQueryTimers.clear();
    }

    function validCodexHistoryResponse(result, currentScope) {
      return !!result && result.ok === true && String(result.spaceId) === String(currentScope.spaceId) &&
        String(result.scopeRevision) === String(currentScope.scopeRevision);
    }

    function codexHistoryError(result, fallback) {
      if (result && result.message) return String(result.message);
      return messageForError(result, fallback || tr('无法读取智能体历史。', 'Unable to read agent history.'));
    }

    function codexRequest(currentScope, request, epoch) {
      if (!bridge || typeof bridge.unifiedWorkspaceCodexHistory !== 'function') return Promise.reject(new Error(tr('智能体历史服务暂不可用。', 'Agent history is not available yet.')));
      if (!currentScope || currentScope.spaceId !== 'personal' || !codexHistoryEnabled()) return Promise.resolve(null);
      var currentEpoch = epoch === undefined ? codexHistoryState.epoch : epoch;
      var readHistory = prefs().agentHistoryEnabled === true ? bridge.unifiedWorkspaceAgentHistory : bridge.unifiedWorkspaceCodexHistory;
      if (typeof readHistory !== 'function') return Promise.reject(new Error(tr('智能体历史服务不可用', 'Agent history is unavailable')));
      return Promise.resolve(readHistory(Object.assign({}, currentScope, request))).then(function (result) {
        if (!sameScope(currentScope, getCurrentScope()) || currentEpoch !== codexHistoryState.epoch || !codexHistoryEnabled()) return null;
        if (!validCodexHistoryResponse(result, currentScope)) throw new Error(codexHistoryError(result, tr('历史读取回执范围不匹配。', 'History response scope did not match.')));
        return result;
      });
    }

    function ensureCodexHistorySources() {
      var currentScope = getCurrentScope();
      if (!currentScope || currentScope.spaceId !== 'personal' || !codexHistoryEnabled()) return Promise.resolve(false);
      var key = codexScopeKey(currentScope);
      if (codexHistoryState.scopeKey !== key) resetCodexHistoryState(currentScope);
      if (codexHistoryState.sources) {
        if (historySettingsOpen()) codexHistoryState.sources.forEach(function (source) {
          var projectState = source && codexHistoryState.projects.get(String(source.id));
          if (source && ['available', 'partial'].indexOf(String(source.status)) >= 0 && !projectState) loadCodexHistoryProjects(source, currentScope, codexHistoryState.epoch);
        });
        return Promise.resolve(false);
      }
      if (codexHistoryState.loading || codexHistoryState.error) return Promise.resolve(false);
      var ownerState = codexHistoryState;
      var epoch = codexHistoryState.epoch;
      codexHistoryState.loading = true;
      Promise.resolve().then(function () { return codexRequest(currentScope, { action: 'sources' }, epoch); }).then(function (result) {
        if (!result || codexHistoryState !== ownerState || epoch !== codexHistoryState.epoch || !sameScope(currentScope, getCurrentScope())) return;
        codexHistoryState.sources = Array.isArray(result.sources) ? result.sources : [];
        codexHistoryState.loading = false;
        if (historySettingsOpen()) codexHistoryState.sources.forEach(function (source) {
          if (source && ['available', 'partial'].indexOf(String(source.status)) >= 0) loadCodexHistoryProjects(source, currentScope, epoch);
        });
        renderImportedHistory();
      }).catch(function (error) {
        if (codexHistoryState !== ownerState || epoch !== codexHistoryState.epoch || !sameScope(currentScope, getCurrentScope())) return;
        codexHistoryState.loading = false;
        codexHistoryState.error = messageForError(error, tr('无法读取 Codex 来源。', 'Unable to read Codex sources.'));
        renderImportedHistory();
      });
      return Promise.resolve(true);
    }

    function loadCodexHistoryProjects(source, currentScope, epoch, force) {
      if (!source || !source.id || ['available', 'partial'].indexOf(String(source.status)) < 0) return Promise.resolve(false);
      var key = String(source.id);
      var state = codexHistoryState.projects.get(key);
      if (state && (state.loading || state.loaded) && !force) return Promise.resolve(false);
      state = { loading: true, loaded: false, error: '', projects: [], unassigned: null, warnings: [] };
      codexHistoryState.projects.set(key, state);
      var ownerState = codexHistoryState;
      return codexRequest(currentScope, { action: 'projects', sourceId: key }, epoch).then(function (result) {
        if (!result || codexHistoryState !== ownerState || epoch !== codexHistoryState.epoch || !sameScope(currentScope, getCurrentScope())) return false;
        state.loading = false; state.loaded = true; state.source = result.source || source;
        state.projects = Array.isArray(result.projects) ? result.projects : [];
        state.unassigned = result.unassigned || { threadCount: 0, archivedThreadCount: 0, unknownCount: 0 };
        state.warnings = Array.isArray(result.warnings) ? result.warnings : [];
        renderImportedHistory();
        return true;
      }).catch(function (error) {
        if (codexHistoryState !== ownerState || epoch !== codexHistoryState.epoch || !sameScope(currentScope, getCurrentScope())) return false;
        state.loading = false; state.loaded = false;
        state.error = messageForError(error, tr('无法读取此来源中的工程。', 'Unable to read projects from this source.'));
        renderImportedHistory();
        return false;
      });
    }

    function codexStatusLabel(status) {
      var labels = {
        available: ['可用', 'Available'], partial: ['部分可读', 'Partially available'],
        corrupt: ['历史数据损坏', 'History data is damaged'],
        unsupported: ['格式不支持', 'Unsupported format'], unavailable: ['来源不可用', 'Unavailable']
      };
      var entry = labels[String(status || '')];
      return entry ? tr(entry[0], entry[1]) : String(status || '');
    }

    function codexLogo(className, source) {
      var runtime = source && source.sourceType || 'codex';
      if (!['codex','kimi','codebuddy','pi','claude','opencode'].includes(runtime)) return el('span', className || 'ouw-codex-logo', '◷');
      var image = el('img', className || 'ouw-codex-logo');
      image.src = 'assets/agent-logos/' + runtime + '.svg';
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      return image;
    }

    function codexSidebarSourceLabel(source) {
      var full = String(source && source.label || tr('Codex 来源', 'Codex source'));
      var separator = full.lastIndexOf('·');
      var runtime = String(source && source.sourceType || 'codex').toLowerCase();
      var runtimeName = ({ codex: 'Codex', workbuddy: 'WorkBuddy', kimi: 'Kimi', codebuddy: 'CodeBuddy', pi: 'Pi', claude: 'Claude Code', opencode: 'OpenCode', hermes: 'Hermes', zcode: 'ZCode' })[runtime];
      if (separator < 0) return runtimeName || full;
      var sourceName = full.slice(0, separator).trim();
      var sourcePath = full.slice(separator + 1).trim();
      var parts = sourcePath.split(/[\\/]+/).filter(Boolean);
      var basename = parts.length ? parts[parts.length - 1] : sourcePath;
      if (/^\.?codex$/i.test(basename) && parts.length > 1) basename = parts[parts.length - 2];
      var displayName = runtimeName || sourceName || full;
      // Preserve the account name; CSS truncation retains its useful beginning.
      return displayName + (basename ? ' · ' + basename : '');
    }

    function renderCodexHistorySources(host) {
      var currentScope = getCurrentScope();
      var section = el('section', 'ouw-codex-history-section');
      // This existing history browser is mounted only inside Data settings.
      // The outer disclosure supplies its title and keeps the homepage clear.
      if (!currentScope || currentScope.spaceId !== 'personal') {
        section.appendChild(el('div', 'ouw-subtle-empty', tr('智能体历史仅在个人空间显示。', 'Agent history is available in personal space only.')));
        host.appendChild(section);
        return;
      }
      var optedIn = codexHistoryEnabled();
      if (!optedIn) {
        var connect = button(tr('接入智能体历史', 'Connect agent histories'), 'ouw-inline-action ouw-codex-connect', function () { setCodexHistoryEnabled(true, connect); });
        connect.setAttribute('aria-label', tr('接入智能体历史', 'Connect agent histories'));
        connect.disabled = codexHistoryPreferenceBusy;
        section.appendChild(connect);
        host.appendChild(section);
        return;
      }
      if (prefs().agentHistoryEnabled !== true) section.appendChild(button(tr('接入其他智能体历史', 'Connect other agent histories'), 'ouw-inline-action ouw-agent-connect', function () { setCodexHistoryEnabled(true); }));
      var actions = el('div', 'ouw-codex-history-actions');
      actions.appendChild(button(tr('刷新来源', 'Refresh sources'), 'ouw-small-action', refreshCodexHistorySources));
      var hide = button(tr('关闭展示', 'Hide history'), 'ouw-small-action', function () { setCodexHistoryEnabled(false, hide); });
      hide.setAttribute('aria-label', tr('关闭智能体历史展示', 'Hide agent histories'));
      actions.appendChild(hide);
      section.appendChild(actions);
      ensureCodexHistorySources();
      if (!bridge || typeof bridge.unifiedWorkspaceCodexHistory !== 'function') {
        section.appendChild(el('div', 'ouw-subtle-empty', tr('智能体历史服务暂不可用。', 'Agent history is unavailable.')));
      } else if (codexHistoryState.loading || codexHistoryState.sources === null && !codexHistoryState.error) {
        section.appendChild(el('div', 'ouw-subtle-empty', tr('正在读取历史来源…', 'Reading history sources…')));
      } else if (codexHistoryState.error) {
        section.appendChild(el('div', 'ouw-codex-error', codexHistoryState.error));
        section.appendChild(button(tr('重试', 'Retry'), 'ouw-inline-action', refreshCodexHistorySources));
      } else if (!codexHistoryState.sources.length) {
        section.appendChild(el('div', 'ouw-subtle-empty', tr('没有发现可读取的智能体历史来源。', 'No readable agent history sources were found.')));
      } else {
        codexHistoryState.sources.forEach(function (source) { renderCodexSourceGroup(section, source, currentScope); });
      }
      host.appendChild(section);
    }

    function refreshCodexHistorySources() {
      var currentScope = getCurrentScope();
      if (!currentScope || currentScope.spaceId !== 'personal' || !codexHistoryEnabled()) return;
      codexQueryTimers.forEach(function (timer) { clearTimeout(timer); });
      codexQueryTimers.clear();
      codexHistoryState = { scopeKey: codexScopeKey(currentScope), sources: null, loading: false, error: '', projects: new Map(), epoch: codexHistoryState.epoch };
      renderSidebar();
    }

    function renderCodexSourceGroup(host, source, currentScope) {
      if (!source || !source.id) return;
      var sourceKey = String(source.id);
      var state = codexHistoryState.projects.get(sourceKey);
      var group = el('section', 'ouw-codex-source-group');
      group.dataset.ouwCodexSource = sourceKey;
      var header = el('div', 'ouw-codex-source-header');
      header.appendChild(codexLogo('ouw-codex-logo', source));
      var sourceLabel = el('span', 'ouw-codex-source-label', codexSidebarSourceLabel(source));
      sourceLabel.title = String(source.label || tr('Codex 来源', 'Codex source'));
      sourceLabel.setAttribute('aria-label', String(source.label || tr('Codex 来源', 'Codex source')));
      header.appendChild(sourceLabel);
      var statusText = codexStatusLabel(source.status);
      var statusIndicator = el('span', 'ouw-codex-status', statusText);
      statusIndicator.dataset.status = String(source.status || 'unknown');
      statusIndicator.title = statusText;
      statusIndicator.setAttribute('role', 'img');
      statusIndicator.setAttribute('aria-label', statusText);
      header.appendChild(statusIndicator);
      group.appendChild(header);
      if (source.status === 'corrupt') {
        group.appendChild(el('div', 'ouw-subtle-empty', tr(
          '此来源的历史数据损坏，无法读取。原始资料未修改；修复来源后可刷新。',
          'History data is damaged and cannot be read. The original data was not modified; repair the source, then refresh.'
        )));
        host.appendChild(group);
        return;
      }
      if (source.status === 'unavailable' || source.status === 'unsupported') {
        group.appendChild(el('div', 'ouw-subtle-empty', source.status === 'unsupported'
          ? tr('此来源的数据库版本或结构尚不兼容，请更新 Bot Studio 后重试。', 'This database version or structure is not compatible yet. Update Bot Studio and retry.')
          : tr('此来源暂时无法读取。', 'This source cannot be read right now.')));
        group.appendChild(button(tr('重试', 'Retry'), 'ouw-inline-action', refreshCodexHistorySources));
        if (source.errorCode) group.appendChild(el('div', 'ouw-codex-warning', String(source.errorCode)));
        host.appendChild(group);
        return;
      }
      if (!state) {
        group.appendChild(el('div', 'ouw-subtle-empty', tr('正在读取工程…', 'Reading projects…')));
        host.appendChild(group);
        return;
      }
      if (state.loading) group.appendChild(el('div', 'ouw-subtle-empty', tr('正在读取工程…', 'Reading projects…')));
      else if (state.error) {
        group.appendChild(el('div', 'ouw-codex-error', state.error));
        group.appendChild(button(tr('重试', 'Retry'), 'ouw-inline-action', function () { loadCodexHistoryProjects(source, currentScope, codexHistoryState.epoch, true); }));
      } else {
        state.projects.forEach(function (project) {
          if (!project || !project.id) return;
          var card = el('div', 'ouw-codex-project-card');
          var open = button('', 'ouw-codex-project-open', function () { openCodexProject(source, project); });
          open.setAttribute('aria-label', tr('打开 Codex 工程 ', 'Open Codex project ') + String(project.name || project.nativeId || project.id));
          open.appendChild(codexLogo('ouw-codex-project-logo', source));
          var copy = el('span', 'ouw-codex-project-copy');
          copy.appendChild(el('span', 'ouw-codex-project-name', String(project.name || project.nativeId || tr('未命名工程', 'Untitled project'))));
          copy.appendChild(el('span', 'ouw-codex-project-meta', tr('只读历史 · ', 'Read-only history · ') + String(Number(project.threadCount) || 0) + ' ' + tr('会话', 'threads') + ' · ' + String(Number(project.archivedThreadCount) || 0) + ' ' + tr('已归档', 'archived')));
          open.appendChild(copy);
          card.appendChild(open);
          group.appendChild(card);
        });
        var unassigned = state.unassigned || {};
        var unassignedCount = Number(unassigned.threadCount) || 0;
        var archivedCount = Number(unassigned.archivedThreadCount) || 0;
        var unknownCount = Number(unassigned.unknownCount) || 0;
        if (unassignedCount || archivedCount || unknownCount) {
          var unassignedButton = button('', 'ouw-codex-unassigned', function () { openCodexUnassigned(source, unassigned); });
          unassignedButton.appendChild(el('span', 'ouw-codex-unassigned-title', tr('未归工程会话', 'Projectless sessions')));
          unassignedButton.appendChild(el('span', 'ouw-codex-project-meta', unassignedCount + ' ' + tr('会话', 'threads') + ' · ' + archivedCount + ' ' + tr('已归档', 'archived')));
          if (unknownCount) unassignedButton.appendChild(el('span', 'ouw-codex-project-meta', tr('其中归属未记录：', 'Membership not recorded: ') + unknownCount));
          group.appendChild(unassignedButton);
          group.appendChild(el('div', 'ouw-codex-membership-note', tr('列表会标明哪些会话尚未归属，哪些会话的归属未记录。', 'The list distinguishes unassigned sessions from sessions with unknown membership.')));
        }
        if (!state.projects.length && !unassignedCount && !archivedCount && !unknownCount) {
          group.appendChild(el('div', 'ouw-subtle-empty', tr('此来源没有可显示的工程或未归项目会话。', 'This source has no projects or projectless sessions to show.')));
        }
        state.warnings.forEach(function (warning) {
          if (typeof warning === 'string' && warning) group.appendChild(el('div', 'ouw-codex-warning', codexWarningLabel(warning)));
        });
      }
      host.appendChild(group);
    }

    function codexCompositeId(sourceId, nativeId) {
      return encodeURIComponent(String(sourceId)) + '::' + encodeURIComponent(String(nativeId));
    }

    function codexPage(kind, source, item) {
      var type = kind === 'thread' ? 'CodexThread' : kind === 'unassigned' ? 'CodexUnassigned' : 'CodexProject';
      var itemId = kind === 'thread' ? item.id : kind === 'unassigned' ? 'unassigned' : item.id;
      var page = getPage({ type: type, id: codexCompositeId(source.id, itemId) });
      if (!page.codex) page.codex = { kind: kind, source: source, item: item, list: null, history: null };
      else { page.codex.kind = kind; page.codex.source = source; page.codex.item = item; }
      return page;
    }

    function openCodexPage(page) {
      var currentScope = getCurrentScope();
      if (!currentScope || currentScope.spaceId !== 'personal' || !codexHistoryEnabled()) return;
      onOpenHistory();
      if (currentPageKey && currentPageKey !== page.key) backStack.push(currentPageKey);
      legacyHop = false;
      contentRoot.hidden = false;
      contentMount.hidden = false;
      showLegacyContent(false);
      if (page.codex.kind === 'project' || page.codex.kind === 'unassigned') {
        if (!page.codex.list) page.codex.list = { query: '', archived: false, items: [], cursor: null, warnings: [], loading: false, loaded: false, error: '', requestId: 0 };
        page.codex.list.loading = true;
      } else if (!page.codex.history) {
        page.codex.history = { items: [], cursor: null, coverage: null, warnings: [], loading: true, loaded: false, error: '', requestId: 0, thread: page.codex.item };
      } else {
        page.codex.history.loading = true;
      }
      showPage(page);
      if (page.codex.kind === 'project' || page.codex.kind === 'unassigned') loadCodexThreadList(page, false);
      else loadCodexThreadHistory(page, false);
    }

    function openCodexProject(source, project) { openCodexPage(codexPage('project', source, project)); }
    function openCodexUnassigned(source, summary) {
      openCodexPage(codexPage('unassigned', source, Object.assign({ id: 'unassigned', name: tr('未归工程会话', 'Projectless sessions') }, summary || {})));
    }
    function openCodexThread(source, thread) { openCodexPage(codexPage('thread', source, thread)); }

    function loadCodexThreadList(page, append) {
      if (!page || !page.codex || !page.codex.list) return Promise.resolve(false);
      var currentScope = getCurrentScope();
      if (!currentScope || currentScope.spaceId !== 'personal') return Promise.resolve(false);
      var list = page.codex.list;
      var epoch = codexHistoryState.epoch;
      var requestId = ++list.requestId;
      var cursor = append ? list.cursor : null;
      list.loading = true; list.error = '';
      if (!append) { list.items = []; list.cursor = null; list.warnings = []; list.loaded = false; }
      if (currentPageKey === page.key) renderPage(page);
      var request = {
        action: 'threads', sourceId: String(page.codex.source.id),
        projectId: page.codex.kind === 'unassigned' ? null : String(page.codex.item.id),
        archived: !!list.archived, query: String(list.query || ''), limit: 30
      };
      if (cursor) request.cursor = cursor;
      return codexRequest(currentScope, request, epoch).then(function (result) {
        if (!result || list.requestId !== requestId || !sameScope(currentScope, getCurrentScope())) return false;
        var nextItems = Array.isArray(result.items) ? result.items : [];
        list.items = append ? list.items.concat(nextItems) : nextItems;
        list.cursor = result.nextCursor || null; list.warnings = Array.isArray(result.warnings) ? result.warnings : [];
        list.loading = false; list.loaded = true;
        if (currentPageKey === page.key) renderPage(page);
        return true;
      }).catch(function (error) {
        if (list.requestId !== requestId || !sameScope(currentScope, getCurrentScope())) return false;
        list.loading = false; list.error = messageForError(error, tr('无法读取历史会话。', 'Unable to read session history.'));
        if (currentPageKey === page.key) renderPage(page);
        return false;
      });
    }

    function scheduleCodexThreadQuery(page, query, input) {
      if (!page || !page.codex || !page.codex.list) return;
      var list = page.codex.list;
      if (list.composing) return;
      list.query = String(query || '');
      if (input) list.searchSelection = [input.selectionStart, input.selectionEnd];
      var timerKey = page.key;
      clearTimeout(codexQueryTimers.get(timerKey));
      codexQueryTimers.set(timerKey, setTimeout(function () {
        codexQueryTimers.delete(timerKey);
        if (pageCache.get(page.key) !== page || !sameScope(scope, getCurrentScope())) return;
        loadCodexThreadList(page, false);
      }, 180));
    }

    function loadCodexThreadHistory(page, append) {
      if (!page || !page.codex || !page.codex.history) return Promise.resolve(false);
      var currentScope = getCurrentScope();
      if (!currentScope || currentScope.spaceId !== 'personal') return Promise.resolve(false);
      var history = page.codex.history;
      var epoch = codexHistoryState.epoch;
      var requestId = ++history.requestId;
      var cursor = append ? history.cursor : null;
      history.loading = true; history.error = '';
      if (!append) { history.items = []; history.cursor = null; history.coverage = null; history.loaded = false; }
      if (currentPageKey === page.key) renderPage(page);
      var request = { action: 'thread', sourceId: String(page.codex.source.id), threadId: String(history.thread.id), limit: 30 };
      if (cursor) request.cursor = cursor;
      return codexRequest(currentScope, request, epoch).then(function (result) {
        if (!result || history.requestId !== requestId || !sameScope(currentScope, getCurrentScope())) return false;
        history.thread = result.thread || history.thread;
        history.items = append ? history.items.concat(Array.isArray(result.items) ? result.items : []) : (Array.isArray(result.items) ? result.items : []);
        history.cursor = result.nextCursor || null;
        history.coverage = result.coverage || null;
        history.warnings = Array.isArray(result.warnings) ? result.warnings : [];
        history.loading = false; history.loaded = true;
        if (currentPageKey === page.key) {
          var titleNode = pageHeader.querySelector('[data-ouw-title]');
          if (titleNode) titleNode.textContent = pageTitle(page);
          renderPage(page);
        }
        return true;
      }).catch(function (error) {
        if (history.requestId !== requestId || !sameScope(currentScope, getCurrentScope())) return false;
        history.loading = false; history.error = messageForError(error, tr('无法读取历史会话。', 'Unable to read session history.'));
        if (currentPageKey === page.key) renderPage(page);
        return false;
      });
    }

    function projectEvidenceKey(project, currentScope) {
      return [currentScope.spaceId, currentScope.scopeRevision, project.id, project.revision].join(':');
    }

    function loadProjectEvidence(project, target) {
      if (!bridge || typeof bridge.unifiedWorkspaceDetail !== 'function' || !project || !project.id) {
        renderProjectEvidenceUnavailable(target, tr('工程留痕暂不可用。', 'Project activity is unavailable.'));
        return;
      }
      var currentScope = getCurrentScope();
      if (!currentScope) return;
      var key = projectEvidenceKey(project, currentScope);
      var cached = projectSummaries.get(key);
      if (cached && cached.detail) { renderProjectEvidenceStrip(target, cached.detail, true); return; }
      if (projectSummaryRequests.has(key)) return;
      var workspaceRevision = snapshot && snapshot.revision;
      var request = Promise.resolve(bridge.unifiedWorkspaceDetail({
        spaceId: currentScope.spaceId, scopeRevision: currentScope.scopeRevision,
        ref: { type: 'Project', id: String(project.id) }
      })).then(function (result) {
        if (!sameScope(currentScope, getCurrentScope()) || !snapshot || snapshot.revision !== workspaceRevision) return;
        if (!validResponse(result, currentScope) || !result.entity || String(result.entity.id) !== String(project.id) || String(result.entity.revision) !== String(project.revision)) {
          throw new Error(messageForError(result, tr('工程留痕响应无法确认。', 'Project activity response could not be confirmed.')));
        }
        projectSummaries.set(key, { detail: result });
        var currentTarget = Array.from(listMount.querySelectorAll('[data-ouw-project-evidence]')).find(function (node) { return node.dataset.ouwProjectEvidence === String(project.id); });
        if (currentTarget) renderProjectEvidenceStrip(currentTarget, result, true);
        else if (view === 'files') renderSidebar();
      }).catch(function (error) {
        if (!sameScope(currentScope, getCurrentScope()) || !snapshot || snapshot.revision !== workspaceRevision) return;
        var currentTarget = Array.from(listMount.querySelectorAll('[data-ouw-project-evidence]')).find(function (node) { return node.dataset.ouwProjectEvidence === String(project.id); });
        if (currentTarget) renderProjectEvidenceUnavailable(currentTarget, messageForError(error, tr('工程留痕读取失败。', 'Unable to read project activity.')));
      }).finally(function () { if (projectSummaryRequests.get(key) === request) projectSummaryRequests.delete(key); });
      projectSummaryRequests.set(key, request);
    }

    function renderProjectEvidenceUnavailable(target, message) {
      if (!target) return;
      target.replaceChildren(el('div', 'ouw-project-evidence-error', message));
    }

    function executorBrand(run) {
      var adapterId = String(run && run.adapterId || '').toLowerCase();
      return executorBrands[adapterId] || 'generic';
    }

    function projectMemberBots(detail) {
      var relations = Array.isArray(detail && detail.relations) ? detail.relations : [];
      var bots = [];
      relations.forEach(function (relation) {
        if (relation.endedAt || !['bot_owns_project', 'bot_participates_project'].includes(relation.predicate)) return;
        var ref = relation.subjectRef;
        if (!ref || ref.type !== 'BotInstanceRef' || !ref.id || bots.some(function (item) { return String(item.bot.id) === String(ref.id); })) return;
        var entity = (snapshot && snapshot.bots || []).find(function (item) { return String(item.id) === String(ref.id); });
        if (entity) bots.push({ bot: entity, relation: relation });
      });
      return bots;
    }

    function renderNeutralIdentity(node, name, preserveInitials) {
      var value = String(name || '').trim();
      var first = preserveInitials ? value : Array.from(value)[0] || '';
      node.textContent = first && first !== '?' && first !== '？' ? first.toUpperCase() : '';
      if (!node.textContent) node.innerHTML = '<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>';
    }
    function installLogoFallback(image) {
      image.addEventListener('error', function () {
        var neutral = document.createElement('span');
        neutral.innerHTML = '<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>';
        var icon = neutral.firstElementChild;
        icon.setAttribute('class', image.className);
        icon.setAttribute('width', String(image.width || 24));
        icon.setAttribute('height', String(image.height || 24));
        image.replaceWith(icon);
      }, { once: true });
    }
    function projectMemberAvatar(bot, relation, size, detailLink) {
      var legacy = {};
      try { legacy = getLegacyState() || {}; } catch (error) {}
      var botId = String(bot.botId || bot.id || '');
      var source = (legacy.bots || []).find(function (item) { return String(item.id) === botId; }) || {};
      var instance = (legacy.instances || []).find(function (item) { return String(item.spaceId || '') === String(scope && scope.spaceId || '') && String(item.botId) === botId; }) || {};
      var display = Object.assign({}, source, bot, {
        id: botId,
        name: bot.name || instance.name || source.name || botId,
        avatar: instance.avatar || source.avatar || bot.avatar || 'orbit',
        color: instance.color || source.color || bot.color || '#5272a7'
      });
      var owner = relation && relation.predicate === 'bot_owns_project';
      var label = (owner ? tr('负责 BOT：', 'Owning BOT: ') : tr('参与 BOT：', 'Participating BOT: ')) + safeName(display);
      var item = button('', 'ouw-project-member-avatar', function () { openEntity({ type: 'BotInstanceRef', id: String(bot.id) }); });
      item.setAttribute('aria-label', tr('打开', 'Open ') + label);
      item.title = label;
      if (root.OpenBotAvatars && typeof root.OpenBotAvatars.markup === 'function') {
        var markup = root.OpenBotAvatars.markup(display.avatar, display.color, { size: size || 'mini' });
        if (typeof markup === 'string') item.innerHTML = markup;
      }
      if (!item.childNodes.length) renderNeutralIdentity(item, display.name);
      if (detailLink) item.classList.add('ouw-project-member-avatar-large');
      return item;
    }

    function creatorInitials(name) {
      var text = String(name || '').trim();
      if (!text) return '';
      var parts = text.split(/\s+/).filter(Boolean);
      if (parts.length > 1) return (Array.from(parts[0])[0] + Array.from(parts[parts.length - 1])[0]).toUpperCase();
      return Array.from(text)[0].toUpperCase();
    }

    function creatorAvatar(creator) {
      creator = creator && typeof creator === 'object' ? creator : {};
      var kind = ['human', 'bot'].indexOf(creator.kind) >= 0 ? creator.kind : 'unknown';
      var evidence = creator.evidence && typeof creator.evidence.kind === 'string' ? creator.evidence.kind : 'not-recorded';
      var name = String(creator.name || (kind === 'human' ? 'Human' : kind === 'bot' ? tr('BOT', 'BOT') : ''));
      var label;
      if (kind === 'unknown') label = tr('创建者未知', 'Creator unknown');
      else if (kind === 'human') label = tr('创建者：', 'Creator: ') + name + (creator.id ? '' : tr('（具体身份未记录）', ' (specific identity not recorded)'));
      else label = tr('创建者 BOT：', 'Created by BOT: ') + name;

      var avatar = el('span', 'ouw-creator-avatar');
      avatar.dataset.creatorKind = kind;
      avatar.dataset.creatorEvidenceKind = evidence;
      avatar.setAttribute('role', 'img');
      avatar.setAttribute('aria-label', label);
      avatar.title = label;
      var avatarKey = String(creator.avatar || '');
      var avatarRegistry = root.OpenBotAvatars;
      var allowedAvatar = avatarRegistry && (avatarRegistry.ids || []).indexOf(avatarKey) >= 0 ||
        avatarRegistry && (avatarRegistry.legacyIds || []).indexOf(avatarKey) >= 0;
      if (kind !== 'unknown' && avatarKey && allowedAvatar && avatarRegistry && typeof avatarRegistry.markup === 'function') {
        var markup = avatarRegistry.markup(avatarKey, creator.color, { size: 'mini' });
        if (typeof markup === 'string') avatar.innerHTML = markup;
      }
      if (!avatar.firstChild) {
        avatar.classList.add('ouw-creator-avatar-fallback');
        if (kind === 'unknown') {
          // Missing creator provenance is not a broken conversation. Keep the
          // truthful tooltip, but use a neutral conversation icon, not an error.
          avatar.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 3V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h7"/></svg>';
        } else renderNeutralIdentity(avatar, creatorInitials(name), true);
        if (kind !== 'unknown' && typeof creator.color === 'string' && /^#[\da-f]{3}(?:[\da-f]{3}|[\da-f]{5})?$/i.test(creator.color.trim())) {
          avatar.style.backgroundColor = creator.color.trim();
        }
      }
      return avatar;
    }

    function entityCreatorRow(label, ref, creator, className) {
      var row = button('', 'ouw-related-row ouw-related-entity-row' + (className ? ' ' + className : ''), function () { openEntity(ref); });
      var avatar = creatorAvatar(creator);
      row.appendChild(avatar);
      row.appendChild(el('span', 'ouw-related-entity-label', label));
      row.setAttribute('aria-label', label + ', ' + avatar.getAttribute('aria-label'));
      row.title = label + ' · ' + avatar.title;
      return row;
    }

    function projectRunButton(run, compact) {
      var adapter = String(run && run.adapterId || tr('未知执行器', 'Unknown executor'));
      var runLabel = String(run && run.id || '');
      var status = run && run.status ? formatStatus(run.status) : '';
      var label = tr('打开执行记录 · ', 'Open run · ') + adapter + (status ? ' · ' + status : '') + (runLabel ? ' · ' + runLabel : '');
      var item = button('', 'ouw-project-run-chip', function () { openEntity({ type: 'Run', id: String(run.id) }); }, label);
      item.setAttribute('aria-label', label);
      var image = el('img', 'ouw-project-run-logo');
      image.alt = '';
      image.width = compact ? 18 : 22;
      image.height = compact ? 18 : 22;
      image.loading = 'lazy';
      installLogoFallback(image);
      image.src = 'assets/agent-logos/' + executorBrand(run) + (executorBrand(run) === 'aider' ? '.png' : '.svg');
      item.appendChild(image);
      if (!compact) {
        var copy = el('span', 'ouw-project-run-copy');
        copy.appendChild(el('span', 'ouw-project-run-adapter', adapter));
        if (status) copy.appendChild(el('span', 'ouw-project-run-status', status));
        item.appendChild(copy);
      }
      return item;
    }

    function renderProjectEvidenceStrip(target, detail, compact) {
      if (!target) return;
      target.replaceChildren();
      var members = projectMemberBots(detail);
      var runs = uniqueBy(Array.isArray(detail && detail.runs) ? detail.runs.slice() : [], function (run) { return String(run && run.id || ''); })
        .sort(function (a, b) { return Date.parse(b.endedAt || b.startedAt || b.createdAt || 0) - Date.parse(a.endedAt || a.startedAt || a.createdAt || 0); });
      var memberGroup = el('div', 'ouw-project-evidence-group');
      memberGroup.appendChild(el('span', 'ouw-project-evidence-label', compact ? tr('成员 BOT', 'BOT members') : tr('关联成员 BOT', 'Associated BOT members')));
      var membersRow = el('div', 'ouw-project-evidence-items ouw-project-members');
      members.slice(0, compact ? 4 : 12).forEach(function (entry) { membersRow.appendChild(projectMemberAvatar(entry.bot, entry.relation, compact ? 'mini' : 'list', !compact)); });
      if (!members.length) membersRow.appendChild(el('span', 'ouw-project-evidence-empty', tr('尚未关联 BOT', 'No BOTs associated')));
      memberGroup.appendChild(membersRow);
      target.appendChild(memberGroup);

      var runGroup = el('div', 'ouw-project-evidence-group');
      runGroup.appendChild(el('span', 'ouw-project-evidence-label', compact ? tr('真实执行', 'Run evidence') : tr('实际执行留痕', 'Recorded executions')));
      var runsRow = el('div', 'ouw-project-evidence-items ouw-project-runs');
      runs.slice(0, compact ? 4 : 12).forEach(function (run) { runsRow.appendChild(projectRunButton(run, compact)); });
      if (!runs.length) runsRow.appendChild(el('span', 'ouw-project-evidence-empty', tr('暂无执行记录', 'No runs recorded')));
      runGroup.appendChild(runsRow);
      target.appendChild(runGroup);
    }

    function taskRow(task, depth) {
      var status = formatStatus(task && task.status);
      var row = button('', 'ouw-row ouw-task-row', function () { openEntity({ type: 'WorkTask', id: task.id }); });
      row.style.setProperty('--ouw-depth', String(depth || 0));
      var avatar = creatorAvatar(task && task.creator);
      row.appendChild(avatar);
      var labels = el('span', 'ouw-row-labels');
      labels.appendChild(el('span', 'ouw-row-title', safeName(task)));
      row.appendChild(labels);
      // 单行化：可行动状态芯片（运行/待验收/失败/待输入），其余信息在详情页。
      var chipLabel = '';
      var statusKeyMap = { running: 'running', failed: 'attention', waiting_input: 'attention', awaiting_review: 'attention', needs_review: 'attention' };
      var statusKey = statusKeyMap[String(task && task.status || '')];
      if (statusKey && status) {
        var chip = el('span', 'ouw-row-status ouw-row-status-' + statusKey, status);
        chip.setAttribute('data-ouw-row-status', statusKey);
        row.appendChild(chip);
        chipLabel = status;
      }
      // 单行化 #3：任务行同样接入当前页高亮。
      row.dataset.ouwRowRef = 'WorkTask:' + String(task && task.id || '');
      if (currentPageKey === row.dataset.ouwRowRef) { row.classList.add('is-current'); row.setAttribute('aria-current', 'true'); }
      row.setAttribute('aria-label', safeName(task) + (chipLabel ? ', ' + chipLabel : '') + ', ' + avatar.getAttribute('aria-label'));
      row.title = safeName(task);
      return row;
    }

    function updateSidebarCurrent() {
      // 单行化 #3：把 is-current/aria-current 同步到 currentPageKey 对应行（导航/切页/刷新均过 showPage 或 renderSidebar）。
      if (!listMount) return;
      listMount.querySelectorAll('[data-ouw-row-ref]').forEach(function (node) {
        var isCurrent = !!currentPageKey && String(node.dataset.ouwRowRef || '') === currentPageKey;
        node.classList.toggle('is-current', isCurrent);
        if (isCurrent) node.setAttribute('aria-current', 'true'); else node.removeAttribute('aria-current');
      });
      renderContext();
    }

    function threadActionStatus(thread) {
      var sessionSummary = sessionSummaryFor(thread);
      if (sessionSummary && sessionSummary.needsAttention === true) return { key: 'attention', label: tr('需我处理', 'Needs me') };
      if (sessionSummary && sessionSummary.status) {
        var summaryStatus = String(sessionSummary.status).toLowerCase();
        if (['running', 'queued', 'waiting_input', 'approval', 'awaiting_review', 'needs_review', 'failed', 'interrupted', 'needs_repair'].indexOf(summaryStatus) >= 0) {
          var summaryKeys = { running: 'running', queued: 'queued', waiting_input: 'attention', approval: 'attention', awaiting_review: 'attention', needs_review: 'attention', failed: 'failed', interrupted: 'attention', needs_repair: 'attention' };
          return { key: summaryKeys[summaryStatus], label: sessionStatusLabel(summaryStatus) };
        }
      }
      // 单行化 #4 修正：状态语义如实区分——dispatched=运行中；prepared=排队中（意图已存，
      // store recoveryAction=await_explicit_dispatch，尚未派发）；needs_review=待核查（结果未知，
      // 不等于失败）；failed 来自最近 Run 投影（failed 不在 pendingOperations）。
      var pending = Array.isArray(snapshot.pendingOperations) ? snapshot.pendingOperations : [];
      var ops = pending.filter(function (operation) {
        return operation && operation.kind === 'thread-execution' && operation.intent && String(operation.intent.threadId) === String(thread && thread.id || '');
      });
      if (ops.some(function (operation) { return String(operation.status) === 'dispatched'; })) return { key: 'running', label: tr('运行中', 'Running') };
      if (ops.some(function (operation) { return String(operation.status) === 'prepared'; })) return { key: 'queued', label: tr('排队中', 'Queued') };
      if (ops.some(function (operation) { return String(operation.status) === 'needs_review'; })) return { key: 'attention', label: tr('待核查', 'Needs review') };
      var runState = snapshot.threadRunStatuses ? snapshot.threadRunStatuses[String(thread && thread.id || '')] : null;
      if (runState && String(runState.status) === 'failed') return { key: 'failed', label: tr('失败', 'Failed'), detail: runState.errorCode ? String(runState.errorCode) : '' };
      if (threadPendingMemoryProposals(thread).length > 0) return { key: 'memory', label: tr('记忆待审', 'Memory review') };
      return null;
    }

    function sessionSummaryFor(thread) {
      var summaries = snapshot && snapshot.sessionSummaries;
      return summaries && typeof summaries === 'object' && thread
        ? summaries[String(thread.id || '')] || null : null;
    }

    function sessionAttentionTarget(summary) {
      var attention = Array.isArray(summary && summary.attention) ? summary.attention : [];
      var item = attention.find(function (entry) { return entry && entry.requiresUser === true && entry.target; });
      return item ? item.target : null;
    }

    function sessionSummaryText(thread, summary) {
      if (!summary) return '';
      var parts = [];
      var ownerRef = normalizeRef(summary.botRef);
      var owner = ownerRef && (snapshot && snapshot.bots || []).find(function (bot) { return String(bot.id || bot.botId || '') === ownerRef.id; });
      if (owner) parts.push(safeName(owner));
      var taskTitle = String(summary.taskTitle || '').trim();
      if (taskTitle && taskTitle !== safeName(thread)) parts.push(taskTitle);
      return parts.join(' · ');
    }

    function threadKindLabel(thread) {
      var kindLabels = { daily: tr('日常会话', 'Daily conversation'), task: tr('任务会话', 'Task conversation'), 'legacy-task': tr('历史任务记录', 'Historical task record') };
      if (thread && thread.kind === 'task' && thread.origin === 'bot') return tr('BOT 发起任务会话', 'Bot-started task');
      return kindLabels[thread && thread.kind] || '';
    }

    function threadRow(thread, depth) {
      var entry = el('div', 'ouw-thread-entry');
      var row = button('', 'ouw-row ouw-thread-row', function () { openEntity({ type: 'Thread', id: thread.id }); });
      row.dataset.ouwThreadId = String(thread && thread.id || '');
      row.style.setProperty('--ouw-depth', String(depth || 0));
      var avatar = creatorAvatar(thread && thread.creator);
      row.appendChild(avatar);
      var labels = el('span', 'ouw-row-labels');
      labels.appendChild(el('span', 'ouw-row-title', safeName(thread)));
      var summary = sessionSummaryFor(thread);
      var summaryText = sessionSummaryText(thread, summary);
      if (summaryText) labels.appendChild(el('span', 'ouw-session-row-meta', summaryText));
      // 单行化（2026-10-31 会话视角可读性升级）：行内仅保留 标题+唯一可行动状态芯片；
      // 其余状态（BOT 自建/续办/压缩/调优）保留为行级 data 属性（selector 兼容），完整信息在详情页。
      if (thread && thread.origin === 'bot') row.setAttribute('data-ouw-thread-origin', 'bot');
      if (thread && thread.continuationIntent) row.setAttribute('data-ouw-thread-continuation', 'armed');
      if (thread && thread.contextCompaction) row.setAttribute('data-ouw-thread-compacted', 'true');
      if (thread && thread.pendingExecutionBinding) row.setAttribute('data-ouw-thread-tuning', 'true');
      if (thread && threadPendingMemoryProposals(thread).length > 0) row.setAttribute('data-ouw-thread-memory-pending', 'true');
      row.appendChild(labels);
      var status = threadActionStatus(thread), chipLabel = '';
      if (status) {
        var chip = el('span', 'ouw-row-status ouw-row-status-' + status.key, status.label);
        chip.setAttribute('data-ouw-row-status', status.key);
        row.appendChild(chip);
        chipLabel = status.label + (status.detail ? '(' + status.detail + ')' : '');
      }
      // 单行化 #3：当前详情页对应的行持久高亮，导航/切页/刷新同步（updateSidebarCurrent）。
      row.dataset.ouwRowRef = 'Thread:' + String(thread && thread.id || '');
      if (currentPageKey === row.dataset.ouwRowRef) { row.classList.add('is-current'); row.setAttribute('aria-current', 'true'); }
      row.setAttribute('aria-label', safeName(thread) + (threadKindLabel(thread) ? ', ' + threadKindLabel(thread) : '') + (summaryText ? ', ' + summaryText : '') + (chipLabel ? ', ' + chipLabel : '') + ', ' + avatar.getAttribute('aria-label'));
      row.title = safeName(thread);
      entry.appendChild(row);
      var attentionTarget = sessionAttentionTarget(summary);
      if (summary && summary.needsAttention === true && attentionTarget) {
        var attentionAction = button(tr('处理', 'Review'), 'ouw-session-attention-action', function () {
          navigateSessionTarget(attentionTarget, { type: 'Thread', id: String(thread.id) });
        });
        attentionAction.dataset.ouwSessionAttention = String(thread.id);
        attentionAction.setAttribute('aria-label', tr('直接处理 ', 'Go to action for ') + safeName(thread));
        attentionAction.disabled = !attentionTarget;
        entry.appendChild(attentionAction);
      }
      return entry;
    }

    function renderFilesList(host) {
      var roots = orderedFileRoots(Array.isArray(snapshot.roots) ? snapshot.roots : []);
      var head = el('div', 'ouw-list-heading-row');
      head.appendChild(sectionHeading(tr('文件', 'Files')));
      head.appendChild(button(tr('绑定目录', 'Bind folder'), 'ouw-small-action', bindRoot));
      host.classList.add('ouw-files-list');
      host.appendChild(head);
      renderSearchControls(host);
      if (activeSearch || queryText) renderSearchResults(host);
      if (!roots.length) {
        host.appendChild(emptyState(tr('尚未绑定已授权目录。', 'No authorized folders are bound yet.')));
        return;
      }
      host.appendChild(sectionHeading(tr('已绑定目录', 'Bound folders')));
      roots.forEach(function (rootItem) {
        if (!rootItem || !rootItem.id) return;
        var rootId = String(rootItem.id);
        var expanded = localExpanded.roots[rootId] === true;
        var group = el('section', 'ouw-root-group');
        group.dataset.ouwRootId = rootId;
        var row = el('div', 'ouw-root-row');
        var disclosure = button(expanded ? '⌄' : '›', 'ouw-disclosure', function () { toggleRoot(rootId); });
        disclosure.setAttribute('aria-expanded', String(expanded));
        disclosure.setAttribute('aria-label', expanded ? tr('折叠目录', 'Collapse folder') : tr('展开目录', 'Expand folder'));
        row.appendChild(disclosure);
        var pick = button('', 'ouw-root-select' + (selectedRootId === rootId ? ' is-selected' : ''), function () { selectRoot(rootId); });
        pick.appendChild(el('span', 'ouw-row-title', safeName(rootItem)));
        var rootPath = rootItem.canonicalPath || rootItem.path || rootItem.locator || '';
        if (rootPath) {
          var pathNode = el('span', 'ouw-row-subtitle', rootPath);
          pathNode.title = rootPath;
          pick.appendChild(pathNode);
        }
        var meta = [rootItem.hostId, rootItem.worktree, formatStatus(rootItem.status)].filter(Boolean).join(' · ');
        if (meta) pick.appendChild(el('span', 'ouw-row-meta', meta));
        pick.setAttribute('aria-label', rootPath
          ? tr('选择目录 ' + safeName(rootItem) + '，路径 ' + rootPath, 'Select folder ' + safeName(rootItem) + ', path ' + rootPath)
          : tr('选择目录 ' + safeName(rootItem), 'Select folder ' + safeName(rootItem)));
        pick.title = rootPath || safeName(rootItem);
        row.appendChild(pick);
        var detailButton = button(tr('关联', 'Details'), 'ouw-root-detail-link', function () { openEntity({ type: 'RootBinding', id: rootId }); }, tr('查看目录授权与关联', 'View folder authorization and relations'));
        detailButton.setAttribute('aria-label', tr('查看目录 ' + safeName(rootItem) + ' 详情', 'Open details for folder ' + safeName(rootItem)));
        row.appendChild(detailButton);
        group.appendChild(row);
        var coverage = indexCoverage.get(rootId) || (treeCache.get(treeKey(rootId, null)) || {}).coverage;
        if (!coverage && !indexLoading.has(rootId) && !indexErrors.has(rootId)) loadIndexStatus(rootId);
        var coverageRow = el('div', 'ouw-root-index-row');
        var coverageLabel = coverage && coverage.status === 'ready' && coverage.scanning !== true
          ? tr('索引就绪', 'Index ready') : coverage ? coverageText(coverage) : indexLoading.has(rootId)
            ? tr('正在读取索引覆盖…', 'Reading index coverage…')
            : indexErrors.get(rootId) || tr('索引覆盖尚未读取。', 'Index coverage has not been read yet.');
        var coverageNode = el('div', 'ouw-root-coverage', coverageLabel);
        if (coverage) coverageNode.title = coverageText(coverage);
        coverageRow.appendChild(coverageNode);
        if (indexErrors.has(rootId) && coverage) coverageRow.appendChild(el('div', 'ouw-root-index-error', indexErrors.get(rootId)));
        var indexActions = el('div', 'ouw-root-index-actions');
        if (indexErrors.has(rootId)) indexActions.appendChild(button(tr('重试状态', 'Retry status'), 'ouw-link-button', function () { loadIndexStatus(rootId, true); }));
        if (coverage && coverage.status === 'indexing') {
          var pauseButton = button(indexLoading.has(rootId) ? tr('正在暂停…', 'Pausing…') : tr('暂停索引', 'Pause indexing'), 'ouw-link-button', function (event) { pauseIndexRoot(rootId, event.currentTarget); });
          pauseButton.disabled = indexLoading.has(rootId);
          indexActions.appendChild(pauseButton);
        } else if (coverage && coverage.status !== 'ready' && coverage.status !== 'partial' && coverage.status !== 'revoked') {
          var reindexLabel = coverage.status === 'paused' ? tr('恢复索引', 'Resume indexing') : tr('重建索引', 'Reindex');
          var reindexButton = button(indexLoading.has(rootId) ? tr('索引中…', 'Indexing…') : reindexLabel, 'ouw-link-button', function (event) { reindexRoot(rootId, event.currentTarget); });
          reindexButton.disabled = indexLoading.has(rootId);
          indexActions.appendChild(reindexButton);
        }
        coverageRow.appendChild(indexActions);
        group.appendChild(coverageRow);
        if (expanded) renderTreeChildren(group, rootId, null, 1);
        host.appendChild(group);
      });
    }

    function indexStatusText(status) {
      if (String(status || '').toLowerCase() === 'ready') {
        var ready = statusLabels.ready_index;
        return tr(ready[0], ready[1]);
      }
      return formatStatus(status);
    }

    function beginIndexRequest(rootId) {
      var ticket = ++indexRequestSequence;
      indexRequests.set(rootId, ticket);
      indexLoading.add(rootId);
      return ticket;
    }

    function currentIndexRequest(rootId, ticket, requestScope) {
      return indexRequests.get(rootId) === ticket && sameScope(requestScope, getCurrentScope());
    }

    function revokeIndexCoverage(rootId) {
      revokedIndexRoots.add(rootId);
      indexRequests.delete(rootId);
      indexLoading.delete(rootId);
      indexCoverage.set(rootId, { rootId: rootId, status: 'revoked' });
      indexErrors.set(rootId, tr('目录访问已撤销', 'Folder access was revoked'));
      if (Array.isArray(searchCoverage)) searchCoverage = searchCoverage.filter(function (item) { return String(item.rootId || '') !== rootId; });
      clearRootTreeCache(rootId);
    }

    function loadIndexStatus(rootId, force) {
      rootId = String(rootId || '');
      if (!rootId || indexLoading.has(rootId) || (!force && indexCoverage.has(rootId))) return Promise.resolve();
      if (!bridge || typeof bridge.unifiedWorkspaceIndexStatus !== 'function') {
        indexErrors.set(rootId, tr('索引状态服务尚不可用。', 'Index status is not available yet.'));
        return Promise.resolve();
      }
      var currentScope = getCurrentScope();
      if (!currentScope) return Promise.resolve();
      var ticket = beginIndexRequest(rootId);
      indexErrors.delete(rootId);
      var request = { spaceId: currentScope.spaceId, rootId: rootId, scopeRevision: currentScope.scopeRevision };
      return Promise.resolve(bridge.unifiedWorkspaceIndexStatus(request)).then(function (result) {
        if (!currentIndexRequest(rootId, ticket, currentScope)) return;
        if (!validResponse(result, currentScope)) throw new Error(messageForError(result, tr('无法读取索引状态。', 'Unable to read index status.')));
        if (!result.coverage || String(result.coverage.rootId || rootId) !== rootId) throw new Error(messageForError(result, tr('索引状态响应不匹配。', 'Index status response did not match the requested folder.')));
        indexCoverage.set(rootId, result.coverage);
        revokedIndexRoots.delete(rootId);
        indexErrors.delete(rootId);
      }).catch(function (error) {
        if (currentIndexRequest(rootId, ticket, currentScope)) indexErrors.set(rootId, messageForError(error, tr('无法读取索引状态。', 'Unable to read index status.')));
      }).finally(function () {
        if (!currentIndexRequest(rootId, ticket, currentScope)) return;
        indexRequests.delete(rootId);
        indexLoading.delete(rootId);
        renderSidebar();
      });
    }

    function reindexRoot(rootId, actionNode) {
      rootId = String(rootId || '');
      if (!rootId || indexLoading.has(rootId) || !bridge || typeof bridge.unifiedWorkspaceReindex !== 'function') return Promise.resolve(false);
      var currentScope = getCurrentScope();
      if (!currentScope) return Promise.resolve(false);
      var ticket = beginIndexRequest(rootId);
      indexErrors.delete(rootId);
      if (actionNode) actionNode.disabled = true;
      renderSidebar();
      return Promise.resolve(bridge.unifiedWorkspaceReindex({ spaceId: currentScope.spaceId, rootId: rootId, scopeRevision: currentScope.scopeRevision })).then(function (result) {
        if (!currentIndexRequest(rootId, ticket, currentScope)) return false;
        if (!validResponse(result, currentScope)) throw new Error(messageForError(result, tr('无法重建索引。', 'Unable to reindex this folder.')));
        if (!result.coverage || String(result.coverage.rootId || rootId) !== rootId) throw new Error(messageForError(result, tr('索引响应不匹配。', 'Index response did not match the requested folder.')));
        indexCoverage.set(rootId, result.coverage);
        revokedIndexRoots.delete(rootId);
        return true;
      }).catch(function (error) {
        if (currentIndexRequest(rootId, ticket, currentScope)) indexErrors.set(rootId, messageForError(error, tr('无法重建索引。', 'Unable to reindex this folder.')));
        return false;
      }).finally(function () {
        if (!currentIndexRequest(rootId, ticket, currentScope)) return;
        indexRequests.delete(rootId);
        indexLoading.delete(rootId);
        renderSidebar();
      });
    }

    function pauseIndexRoot(rootId, actionNode) {
      rootId = String(rootId || '');
      if (!rootId || indexLoading.has(rootId) || !bridge || typeof bridge.unifiedWorkspacePauseIndex !== 'function') {
        if (!bridge || typeof bridge.unifiedWorkspacePauseIndex !== 'function') indexErrors.set(rootId, tr('暂停索引服务尚不可用。', 'Pausing index is not available yet.'));
        renderSidebar();
        return Promise.resolve(false);
      }
      var currentScope = getCurrentScope();
      if (!currentScope) return Promise.resolve(false);
      var ticket = beginIndexRequest(rootId);
      indexErrors.delete(rootId);
      if (actionNode) actionNode.disabled = true;
      renderSidebar();
      return Promise.resolve(bridge.unifiedWorkspacePauseIndex({ spaceId: currentScope.spaceId, rootId: rootId, scopeRevision: currentScope.scopeRevision })).then(function (result) {
        if (!currentIndexRequest(rootId, ticket, currentScope)) return false;
        if (!validResponse(result, currentScope) || result.paused !== true || String(result.rootId || '') !== rootId) {
          throw new Error(messageForError(result, tr('无法暂停索引。', 'Unable to pause indexing.')));
        }
        var coverage = Object.assign({}, indexCoverage.get(rootId) || {}, { rootId: rootId, status: 'paused' });
        indexCoverage.set(rootId, coverage);
        return true;
      }).catch(function (error) {
        if (currentIndexRequest(rootId, ticket, currentScope)) indexErrors.set(rootId, messageForError(error, tr('无法暂停索引。', 'Unable to pause indexing.')));
        return false;
      }).finally(function () {
        if (!currentIndexRequest(rootId, ticket, currentScope)) return;
        indexRequests.delete(rootId);
        indexLoading.delete(rootId);
        renderSidebar();
        loadIndexStatus(rootId, true);
      });
    }

    function renderSearchControls(host) {
      var form = el('form', 'ouw-search-form');
      form.addEventListener('submit', function (event) { event.preventDefault(); saveQueryPreferences(); runSearch(true); });
      var query = el('input', 'ouw-search-input');
      query.type = 'search';
      query.value = queryText;
      query.placeholder = tr('搜索名称、路径或内容', 'Search names, paths, or content');
      query.setAttribute('aria-label', tr('搜索文件', 'Search files'));
      query.addEventListener('input', function () {
        var next = query.value;
        if (next !== queryText) {
          cancelSearch();
          searchQueryId = '';
          searchResults = []; searchCursor = null; searchCoverage = null; searchComplete = false; searchError = '';
          searchNotice = '';
        }
        queryText = next;
        scheduleQueryPreferences();
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(function () { runSearch(true); }, 25);
      });
      form.appendChild(query);
      var row = el('div', 'ouw-search-options');
      var kind = el('select', 'ouw-search-select');
      kind.setAttribute('aria-label', tr('搜索类别', 'Search type'));
      [['name', tr('名称与路径', 'Names and paths')], ['content', tr('文件内容', 'File contents')]].forEach(function (pair) {
        var option = el('option', '', pair[1]); option.value = pair[0]; kind.appendChild(option);
      });
      kind.value = searchKind;
      kind.addEventListener('change', function () { searchKind = kind.value === 'content' ? 'content' : 'name'; saveQueryPreferences(); if (queryText.trim()) runSearch(true); });
      row.appendChild(kind);
      var range = el('select', 'ouw-search-select');
      range.setAttribute('aria-label', tr('搜索范围', 'Search range'));
      [['root', tr('当前目录', 'Current folder')], ['space', tr('当前空间', 'Current space')]].forEach(function (pair) {
        var option = el('option', '', pair[1]); option.value = pair[0]; range.appendChild(option);
      });
      range.value = searchRange;
      range.addEventListener('change', function () { searchRange = range.value === 'space' ? 'space' : 'root'; saveQueryPreferences(); if (queryText.trim()) runSearch(true); });
      row.appendChild(range);
      var caseLabel = el('label', 'ouw-case-option');
      var caseCheck = el('input'); caseCheck.type = 'checkbox'; caseCheck.checked = caseSensitive;
      caseCheck.addEventListener('change', function () { caseSensitive = caseCheck.checked; saveQueryPreferences(); if (queryText.trim()) runSearch(true); });
      caseLabel.append(caseCheck, el('span', '', tr('区分大小写', 'Case sensitive')));
      row.appendChild(caseLabel);
      form.appendChild(row);
      host.appendChild(form);
    }

    var searchDebounceTimer = 0;
    var queryPreferenceTimer = 0;

    function searchCoverageText(coverage, complete) {
      if (!coverage) return complete ? tr('已覆盖范围', 'Coverage complete') : tr('覆盖状态未知', 'Coverage status unknown');
      if (Array.isArray(coverage)) return coverage.map(function (item) {
        if (!item || typeof item !== 'object') return String(item || '');
        var path = item.path || item.rootId || item.hostId || '';
        var state = item.scanning === true ? tr('正在更新索引', 'Refreshing index') : indexStatusText(item.status || '');
        var counts = [];
        if (item.nameCovered !== undefined || item.discovered !== undefined) counts.push(tr('名称 ', 'Names ') + String(item.nameCovered || 0) + ' / ' + String(item.discovered || 0));
        if (item.contentCovered !== undefined || item.discovered !== undefined) counts.push(tr('内容 ', 'Content ') + String(item.contentCovered || 0) + ' / ' + String(item.discovered || 0));
        var caveats = [];
        ['ignored', 'binary', 'tooLarge', 'unreadable', 'unsupportedEncoding', 'unstable', 'symlinkCount'].forEach(function (key) {
          if (Number(item[key]) > 0) caveats.push(key + ' ' + item[key]);
        });
        return [path, state, counts.join(' · '), caveats.join(', '), item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''].filter(Boolean).join(' · ');
      }).filter(Boolean).join(' | ') || (complete ? tr('已覆盖范围', 'Coverage complete') : tr('覆盖状态未知', 'Coverage status unknown'));
      if (typeof coverage === 'string') return formatStatus(coverage);
      var status = coverage.status || coverage.state || coverage.code || '';
      var counts = [];
      if (coverage.indexed !== undefined) counts.push(String(coverage.indexed));
      if (coverage.total !== undefined) counts.push(String(coverage.total));
      var summary = coverage.scanning === true ? tr('正在更新索引', 'Refreshing index') : status ? indexStatusText(status) : '';
      if (counts.length) summary += (summary ? ' · ' : '') + counts.join(' / ');
      if (coverage.updatedAt) summary += ' · ' + String(coverage.updatedAt);
      return summary || (complete ? tr('已覆盖范围', 'Coverage complete') : tr('覆盖状态未知', 'Coverage status unknown'));
    }

    function coverageText(coverage) {
      if (!coverage) return tr('覆盖情况尚未读取。', 'Coverage has not been read yet.');
      if (typeof coverage !== 'object') return formatStatus(coverage);
      if (coverage.status === 'revoked') return indexStatusText('revoked');
      var parts = [indexStatusText(coverage.status)];
      if (coverage.scanning === true) parts.unshift(tr('正在更新索引', 'Refreshing index'));
      if (coverage.discovered !== undefined) {
        parts.push(tr('名称 ', 'Names ') + String(coverage.nameCovered || 0) + ' / ' + String(coverage.discovered));
        parts.push(tr('内容 ', 'Content ') + String(coverage.contentCovered || 0) + ' / ' + String(coverage.discovered));
      }
      var caveats = [];
      [['ignored', '忽略', 'ignored'], ['binary', '二进制', 'binary'], ['tooLarge', '过大', 'too large'],
        ['unreadable', '不可读', 'unreadable'], ['unsupportedEncoding', '编码不支持', 'unsupported encoding'],
        ['unstable', '变动中', 'unstable'], ['symlinkCount', '符号链接未跟随', 'symlinks not followed']].forEach(function (entry) {
        if (Number(coverage[entry[0]]) > 0) caveats.push(tr(entry[1] + ' ' + coverage[entry[0]], entry[2] + ' ' + coverage[entry[0]]));
      });
      if (coverage.watcher) caveats.push(tr('监视器 ' + coverage.watcher, 'Watcher ' + coverage.watcher));
      if (Array.isArray(coverage.exclusions) && coverage.exclusions.length) caveats.push(tr('排除规则 ' + coverage.exclusions.length, 'Exclusions ' + coverage.exclusions.length));
      if (caveats.length) parts.push(caveats.join(' · '));
      if (coverage.updatedAt) parts.push(new Date(coverage.updatedAt).toLocaleString());
      return parts.filter(Boolean).join(' · ');
    }

    function renderSearchResults(host) {
      var box = el('section', 'ouw-search-results');
      box.dataset.queryId = searchQueryId || '';
      box.dataset.scopeRevision = scope ? String(scope.scopeRevision) : '';
      box.dataset.searching = String(!!activeSearch);
      box.dataset.complete = String(searchComplete === true);
      var status = el('div', 'ouw-search-status');
      var isLoading = !!activeSearch;
      var scanInProgress = Array.isArray(searchCoverage) && searchCoverage.some(function (item) { return item && item.scanning === true; });
      var copy = isLoading ? tr('正在搜索…', 'Searching…') : searchError || searchNotice || (scanInProgress
        ? tr('索引正在更新；结果仅包含已扫描部分。', 'Index is refreshing; results include only the scanned portion so far.')
        : searchQueryId && !searchComplete && !searchCursor
        ? tr('已检索到当前范围末尾；索引覆盖不完整，不能确认没有其他匹配。', 'Reached the end of the searched range; index coverage is incomplete, so other matches cannot be ruled out.')
        : searchCoverageText(searchCoverage, searchComplete));
      showStatus(status, copy, searchError ? 'error' : 'muted');
      box.appendChild(status);
      if (activeSearch) box.appendChild(button(tr('停止搜索', 'Stop search'), 'ouw-inline-action', cancelSearch));
      if (!activeSearch && searchComplete && !scanInProgress && searchResults.length === 0 && !searchError) {
        box.appendChild(el('div', 'ouw-subtle-empty', tr('已检索当前完整范围，没有匹配项。', 'No matches in the fully searched scope.')));
      } else if (!activeSearch && searchQueryId && !searchCursor && !searchComplete && searchResults.length === 0 && !searchError && !scanInProgress) {
        box.appendChild(el('div', 'ouw-subtle-empty', tr('当前已检索范围没有匹配项；覆盖不足以确认完整无结果。', 'No matches in the searched range; coverage is insufficient to confirm a complete empty result.')));
      }
      searchResults.forEach(function (item) {
        var row = button('', 'ouw-search-result', function () { openFileItem(item); });
        var path = item.relativePath || item.path || item.fileRef && item.fileRef.relativePath || '';
        row.appendChild(el('span', 'ouw-row-title', path || tr('文件路径未提供', 'File path unavailable')));
        var line = item.line !== undefined && item.line !== null ? tr('第 ' + item.line + ' 行', 'Line ' + item.line) : '';
        var hostId = item.hostId || '';
        if (line || hostId) row.appendChild(el('span', 'ouw-row-meta', [hostId, line].filter(Boolean).join(' · ')));
        if (item.snippet) row.appendChild(el('span', 'ouw-search-snippet', item.snippet));
        box.appendChild(row);
      });
      if (snapshot && snapshot.roots && !scopeForSearch().length) box.appendChild(el('div', 'ouw-subtle-empty', tr('先选择一个目录，或搜索当前空间。', 'Select a folder or search the current space.')));
      if (searchResults.length && searchCursor && !activeSearch) box.appendChild(button(tr('更多结果', 'More results'), 'ouw-inline-action', loadMoreSearch));
      host.appendChild(box);
    }

    var searchCursor = null;

    function renderTreeChildren(host, rootId, parentFileId, depth) {
      var key = treeKey(rootId, parentFileId);
      if (treeLoading.has(key)) {
        host.appendChild(el('div', 'ouw-tree-status', tr('正在读取目录…', 'Loading folder…')));
        return;
      }
      if (treeErrors.has(key)) {
        var errorLine = el('div', 'ouw-tree-status is-error', treeErrors.get(key));
        var retry = button(tr('重试', 'Retry'), 'ouw-link-button', function () { loadTree(rootId, parentFileId); });
        retry.dataset.ouwTreeFocusKey = String(rootId) + '::retry::' + String(parentFileId || '');
        errorLine.appendChild(retry);
        host.appendChild(errorLine);
        return;
      }
      if (!treeCache.has(key)) {
        loadTree(rootId, parentFileId);
        host.appendChild(el('div', 'ouw-tree-status', tr('正在读取目录…', 'Loading folder…')));
        return;
      }
      var data = treeCache.get(key);
      var items = normalizeTreeItems(data && (data.items || data.entries || data.children), rootId);
      if (!items.length) {
        host.appendChild(el('div', 'ouw-subtle-empty', tr('此目录没有可显示的条目。', 'No entries are available in this folder.')));
      }
      items.forEach(function (item) {
        var itemKey = refKey(item.ref) || item.relativePath;
        var isDir = item.kind === 'directory' || item.kind === 'dir' || item.isDirectory === true || item.isDirectory === 'true';
        var isUnsupported = item.kind === 'symlink' || item.kind === 'unsupported' || item.kind === 'other';
        var expanded = localExpanded.dirs[rootId + ':' + itemKey] === true;
        var row = el('div', 'ouw-tree-row');
        row.style.setProperty('--ouw-depth', String(depth || 1));
        if (isDir) {
          var disclosure = button(expanded ? '⌄' : '›', 'ouw-disclosure', function () {
            var key2 = rootId + ':' + itemKey;
            localExpanded.dirs[key2] = !expanded;
            var centralTree = host.closest && host.closest('[data-ouw-central-root-tree]');
            savePreferences({ expanded: { dirs: Object.assign({}, localExpanded.dirs) } }, centralTree ? { render: false } : undefined);
            if (!expanded && !treeCache.has(treeKey(rootId, item.fileId))) loadTree(rootId, item.fileId);
            if (centralTree) refreshCentralRootTree(rootId);
            else renderSidebar();
          });
          disclosure.setAttribute('aria-expanded', String(expanded));
          disclosure.setAttribute('aria-label', expanded ? tr('折叠子目录', 'Collapse subfolder') : tr('展开子目录', 'Expand subfolder'));
          disclosure.dataset.ouwTreeFocusKey = String(rootId) + '::directory::' + String(itemKey);
          row.appendChild(disclosure);
        } else {
          row.appendChild(el('span', 'ouw-tree-indent'));
        }
        var select = button('', 'ouw-tree-item', function () { if (!isDir && !isUnsupported) openFileItem(item); });
        select.dataset.ouwTreeItemRoot = String(rootId);
        select.dataset.ouwTreeItemId = String(item.fileId || item.relativePath || '');
        select.dataset.ouwTreeItemKind = isDir ? 'directory' : isUnsupported ? 'unsupported' : 'file';
        select.dataset.ouwTreeFocusKey = String(rootId) + '::item::' + String(item.fileId || item.relativePath || itemKey);
        select.disabled = isDir || isUnsupported;
        select.appendChild(el('span', 'ouw-tree-glyph', isDir ? '▸' : isUnsupported ? '◌' : '·'));
        select.appendChild(el('span', 'ouw-row-title', item.name || item.relativePath || tr('未命名文件', 'Unnamed file')));
        if (isUnsupported) select.appendChild(el('span', 'ouw-row-meta', item.kind === 'symlink' ? tr('符号链接未跟随', 'Symlink not followed') : tr('不支持的条目', 'Unsupported entry')));
        select.title = item.relativePath || item.name || '';
        row.appendChild(select);
        host.appendChild(row);
        if (isDir && expanded) renderTreeChildren(host, rootId, item.fileId || item.relativePath, (depth || 1) + 1);
      });
      if (data && data.cursor) {
        var more = button(tr('更多条目', 'More entries'), 'ouw-link-button', function () { loadTree(rootId, parentFileId, data.cursor); });
        more.dataset.ouwTreeFocusKey = String(rootId) + '::more::' + String(parentFileId || '');
        host.appendChild(more);
      }
    }

    function centralRootUnavailableMessage(rootEntity) {
      if (rootEntity && rootEntity.revokedAt) return tr('目录授权已撤回，无法读取此目录。', 'Folder access was revoked; this directory cannot be read.');
      if (rootEntity && rootEntity.deletedAt) return tr('目录已失效，无法读取此目录。', 'This folder is no longer available.');
      var status = String(rootEntity && rootEntity.status || '').toLowerCase();
      if (['revoked', 'replaced', 'missing', 'corrupt', 'denied', 'unavailable', 'offline'].indexOf(status) >= 0) {
        return tr('目录当前不可用：', 'Folder unavailable: ') + formatStatus(status);
      }
      return '';
    }

    function renderCentralRootTreeHost(page, rootEntity) {
      var host = page && page.centralRootTreeHost;
      if (!host || !host.isConnected) return;
      var active = document.activeElement;
      var focusKey = active && host.contains(active) && active.dataset ? String(active.dataset.ouwTreeFocusKey || '') : '';
      host.replaceChildren();
      var unavailable = centralRootUnavailableMessage(rootEntity);
      if (unavailable) {
        var status = el('div', 'ouw-tree-status is-error', unavailable);
        status.setAttribute('role', 'status');
        host.appendChild(status);
      } else {
        renderTreeChildren(host, String(rootEntity.id || page.ref.id), null, 1);
      }
      if (focusKey) {
        var next = Array.from(host.querySelectorAll('[data-ouw-tree-focus-key]')).find(function (item) { return item.dataset.ouwTreeFocusKey === focusKey; });
        if (next) next.focus({ preventScroll: true });
      }
    }

    function syncCentralRootTreeProjection(page) {
      if (!page || !page.body || page.ref.type !== 'RootBinding' || !page.detail || !page.detail.entity) return;
      var filesVisible = sidebarViews().indexOf('files') >= 0;
      var section = page.centralRootTreeSection;
      if (filesVisible) {
        if (section && section.parentNode) section.parentNode.removeChild(section);
        page.centralRootTreeSection = null;
        page.centralRootTreeHost = null;
        return;
      }
      if (page.centralRootTreeHost && page.centralRootTreeHost.isConnected) return;
      var rootEntity = page.detail.entity;
      var rootId = String(rootEntity.id || page.ref.id);
      section = sectionBlock(tr('目录内容', 'Folder contents'));
      section.dataset.ouwCentralRootFileSection = rootId;
      var host = el('div', 'ouw-central-root-tree');
      host.dataset.ouwCentralRootTree = rootId;
      section.appendChild(host);
      var before = page.body.querySelector('[data-ouw-root-bound-projects]');
      if (before) page.body.insertBefore(section, before);
      else page.body.appendChild(section);
      page.centralRootTreeSection = section;
      page.centralRootTreeHost = host;
      renderCentralRootTreeHost(page, rootEntity);
    }

    function refreshCentralRootTree(rootId) {
      var page = currentPage();
      if (!page || page.ref.type !== 'RootBinding' || String(page.ref.id) !== String(rootId) || !page.detail || !page.detail.entity) return;
      if (sidebarViews().indexOf('files') >= 0) {
        syncCentralRootTreeProjection(page);
        return;
      }
      if (!page.centralRootTreeHost || !page.centralRootTreeHost.isConnected) {
        syncCentralRootTreeProjection(page);
        return;
      }
      renderCentralRootTreeHost(page, page.detail.entity);
    }

    function treeKey(rootId, parentFileId) { return String(rootId) + '::' + String(parentFileId || ''); }

    function normalizeTreeItems(items, rootId) {
      if (!Array.isArray(items)) return [];
      return items.map(function (item) {
        if (!item || typeof item !== 'object') return null;
        var fileRef = item.fileRef || null;
        var fileId = item.fileId || item.id || fileRef && fileRef.fileId;
        var path = item.relativePath || item.path || item.name || '';
        var kind = String(item.type || item.kind || (item.isDirectory ? 'directory' : 'file')).toLowerCase();
        return Object.assign({}, item, {
          rootId: String(item.rootId || fileRef && fileRef.rootId || rootId),
          fileId: fileId ? String(fileId) : '',
          ref: fileRef && fileRef.fileId ? { type: 'FileRef', id: String(fileRef.fileId), rootId: String(fileRef.rootId || rootId), revision: fileRef.revision } : fileId ? { type: 'FileRef', id: String(fileId), rootId: String(rootId), revision: item.revision } : null,
          relativePath: String(path),
          name: String(item.name || path.split(/[\\/]/).pop() || ''),
          kind: kind
        });
      }).filter(Boolean);
    }

    function loadTree(rootId, parentFileId, cursor) {
      if (!bridge || typeof bridge.unifiedWorkspaceFileTree !== 'function') {
        treeErrors.set(treeKey(rootId, parentFileId), tr('文件目录服务尚不可用。', 'The file tree service is not available yet.'));
        renderSidebar();
        refreshCentralRootTree(rootId);
        return Promise.resolve();
      }
      var currentScope = getCurrentScope();
      if (!currentScope) return Promise.resolve();
      var key = treeKey(rootId, parentFileId);
      var ticket = ++treeEpoch;
      treeRequests.set(key, ticket);
      treeLoading.add(key); treeErrors.delete(key);
      var request = { spaceId: currentScope.spaceId, rootId: String(rootId), scopeRevision: currentScope.scopeRevision, limit: 100 };
      if (parentFileId) request.parentFileId = parentFileId;
      if (cursor) request.cursor = cursor;
      return Promise.resolve(bridge.unifiedWorkspaceFileTree(request)).then(function (result) {
        if (treeRequests.get(key) !== ticket || !sameScope(currentScope, getCurrentScope()) || String(result && result.spaceId) !== currentScope.spaceId || String(result && result.scopeRevision) !== String(currentScope.scopeRevision)) return;
        if (!result || result.ok !== true) throw Object.assign(new Error(messageForError(result, tr('无法读取此目录。', 'Unable to read this folder.'))), { code: result && result.code });
        var previous = cursor && treeCache.get(key) ? treeCache.get(key) : null;
        var merged = Object.assign({}, previous || {}, result);
        if (previous && Array.isArray(previous.items) && Array.isArray(result.items)) merged.items = previous.items.concat(result.items);
        treeCache.set(key, merged);
        if (result.coverage) indexCoverage.set(String(rootId), result.coverage);
        if (result.cursor) treeCursors.set(key, result.cursor); else treeCursors.delete(key);
      }).catch(function (error) {
        if (treeRequests.get(key) === ticket && sameScope(currentScope, getCurrentScope())) treeErrors.set(key, messageForError(error, tr('无法读取此目录。', 'Unable to read this folder.')));
      }).finally(function () {
        if (treeRequests.get(key) === ticket) {
          treeRequests.delete(key);
          treeLoading.delete(key);
          if (sameScope(currentScope, getCurrentScope())) {
            renderSidebar();
            refreshCentralRootTree(rootId);
          }
        }
      });
    }

    function toggleRoot(rootId) {
      var expanded = localExpanded.roots[rootId] === true;
      localExpanded.roots[rootId] = !expanded;
      if (!expanded) {
        selectedRootId = rootId;
        if (!treeCache.has(treeKey(rootId, null))) loadTree(rootId, null);
        savePreferences({ selectedRootId: rootId, expanded: { roots: Object.assign({}, localExpanded.roots) } });
      } else {
        savePreferences({ expanded: { roots: Object.assign({}, localExpanded.roots) } });
      }
      renderSidebar();
    }

    function selectRoot(rootId) {
      selectedRootId = String(rootId);
      cancelSearch(); searchQueryId = '';
      queryText = '';
      searchResults = []; searchCursor = null; searchCoverage = null; searchError = ''; searchComplete = false;
      savePreferences({ selectedRootId: selectedRootId, queries: { text: '', kind: searchKind, caseSensitive: caseSensitive, range: searchRange } });
      if (localExpanded.roots[selectedRootId] !== true) toggleRoot(selectedRootId);
      else renderSidebar();
    }

    function bindRoot() {
      if (!bridge || typeof bridge.unifiedWorkspaceBindRoot !== 'function') {
        setNavStatus(tr('目录绑定服务尚不可用。', 'Folder binding is not available yet.'), 'error');
        return;
      }
      var currentScope = getCurrentScope();
      if (!currentScope) return;
      var request = { spaceId: currentScope.spaceId, scopeRevision: currentScope.scopeRevision };
      var projectId = selectedProjectId();
      if (projectId) request.projectId = projectId;
      setNavStatus(tr('正在选择目录…', 'Choose a folder…'), 'muted');
      Promise.resolve(bridge.unifiedWorkspaceBindRoot(request)).then(function (result) {
        if (!sameScope(currentScope, getCurrentScope())) return;
        if (result && result.canceled === true && result.ok === true && String(result.spaceId) === currentScope.spaceId && String(result.scopeRevision) === String(currentScope.scopeRevision)) { setNavStatus('', ''); return; }
        if (!validResponse(result, currentScope)) throw new Error(messageForError(result, tr('目录绑定回执范围不匹配。', 'Folder binding receipt scope did not match.')));
        if (!result || result.ok !== true) {
          if (result && result.canceled) { setNavStatus('', ''); return; }
          throw new Error(messageForError(result, tr('无法绑定此目录。', 'Unable to bind this folder.')));
        }
        if (result.entity && result.entity.id) {
          indexCoverage.delete(String(result.entity.id));
          indexErrors.delete(String(result.entity.id));
        }
        setNavStatus('', '');
        return refresh();
      }).catch(function (error) { setNavStatus(messageForError(error), 'error'); });
    }

    function saveQueryPreferences() {
      clearTimeout(queryPreferenceTimer);
      queryPreferenceTimer = 0;
      savePreferences({ queries: { text: queryText, kind: searchKind, caseSensitive: caseSensitive, range: searchRange } }, { render: false });
    }

    function scheduleQueryPreferences() {
      clearTimeout(queryPreferenceTimer);
      queryPreferenceTimer = setTimeout(saveQueryPreferences, 300);
    }

    function savePreferences(patch, options) {
      options = options || {};
      var currentScope = getCurrentScope();
      if (!currentScope || !bridge || typeof bridge.unifiedWorkspaceCommand !== 'function') return Promise.resolve(false);
      var merged = mergePreferences(patch);
      if (snapshot) snapshot.preferences = merged;
      if (options.render !== false) renderSidebar();
      var request = Object.assign({
        spaceId: currentScope.spaceId,
        scopeRevision: currentScope.scopeRevision,
        operationId: makeOperationId(),
        action: 'savePreferences',
        patch: patch || {}
      });
      return Promise.resolve(bridge.unifiedWorkspaceCommand(request)).then(function (result) {
        if (!sameScope(currentScope, getCurrentScope())) return false;
        if (!validResponse(result, currentScope)) throw new Error(messageForError(result, tr('偏好未能保存。', 'Preferences could not be saved.')));
        // Keep the data revision tied to workspace content. See the experiment
        // preference queue above: preference writes must not invalidate
        // association caches that are still authoritative for this revision.
        return true;
      }).catch(function (error) {
        if (sameScope(currentScope, getCurrentScope())) setNavStatus(messageForError(error, tr('偏好未能保存。', 'Preferences could not be saved.')), 'error');
        return false;
      });
    }

    function setView(nextView) {
      if (sidebarViews().indexOf(nextView) < 0 || view === nextView) return;
      captureLegacyComposerSelection();
      // This is intentionally a sidebar-only projection change.
      experimentRenderEpoch += 1;
      view = nextView;
      viewInteractionRevision += 1;
      navStatus = '';
      renderSidebar();
      if (experimentEnabled() && listMount) {
        listMount.classList.remove('ouw-experiment-enter');
        void listMount.offsetWidth;
        listMount.classList.add('ouw-experiment-enter');
      }
      restoreLegacyComposerSelectionSoon();
      if (experimentEnabled()) saveExperimentPreferencePatch({ experimentalMainPerspective: nextView });
      else savePreferences({ navigationView: nextView });
    }

    function captureLegacyComposerSelection() {
      var input = document.querySelector('#chat-input');
      if (!input || typeof input.selectionStart !== 'number') return;
      legacyComposerSelection = {
        value: String(input.value || ''),
        start: input.selectionStart,
        end: input.selectionEnd,
        direction: input.selectionDirection || 'none',
        scrollTop: Number(input.scrollTop) || 0
      };
    }

    function restoreLegacyComposerSelection() {
      var input = document.querySelector('#chat-input');
      var saved = legacyComposerSelection;
      if (!input || !saved || String(input.value || '') !== saved.value) return;
      try { input.setSelectionRange(saved.start, saved.end, saved.direction); } catch (error) {}
      input.scrollTop = saved.scrollTop;
    }

    function restoreLegacyComposerSelectionSoon() {
      root.requestAnimationFrame(function () {
        root.requestAnimationFrame(restoreLegacyComposerSelection);
      });
    }

    function runSearch(reset, options) {
      options = options || {};
      if (!bridge || typeof bridge.unifiedWorkspaceSearch !== 'function') {
        searchError = tr('文件搜索服务尚不可用。', 'File search is not available yet.');
        renderSidebar();
        return Promise.resolve();
      }
      var query = String(queryText || '').trim();
      if (!query) { cancelSearch(); searchQueryId = ''; searchResults = []; searchCursor = null; searchCoverage = null; searchComplete = false; searchError = ''; searchNotice = ''; renderSidebar(); return Promise.resolve(); }
      var rootIds = scopeForSearch();
      if (!rootIds.length) { searchError = tr('请先选择目录或切换到当前空间范围。', 'Select a folder or search the current space.'); renderSidebar(); return Promise.resolve(); }
      cancelSearch();
      var currentScope = getCurrentScope();
      if (!currentScope) return Promise.resolve();
      var retainedResults = options.preserveResults ? searchResults.slice() : [];
      if (reset !== false || !searchQueryId) {
        if (!options.preserveResults) searchResults = [];
        searchCursor = null;
        searchQueryId = makeOperationId();
      }
      var queryId = searchQueryId;
      var epoch = ++searchEpoch;
      activeSearch = { queryId: queryId, scope: currentScope, epoch: epoch };
      searchError = '';
      searchNotice = '';
      searchComplete = false;
      renderSidebar();
      var request = {
        spaceId: currentScope.spaceId, rootIds: rootIds, queryId: queryId,
        scopeRevision: currentScope.scopeRevision, query: query,
        kind: searchKind, caseSensitive: caseSensitive, limit: 50
      };
      return Promise.resolve(bridge.unifiedWorkspaceSearch(request)).then(function (result) {
        if (!activeSearch || activeSearch.queryId !== queryId || epoch !== searchEpoch || !sameScope(currentScope, getCurrentScope())) return;
        if (!result || result.ok !== true || String(result.queryId) !== queryId || String(result.scopeRevision) !== String(currentScope.scopeRevision)) {
          throw new Error(messageForError(result, tr('搜索结果无法确认，已丢弃。', 'Search results could not be confirmed and were discarded.')));
        }
        var nextResults = retainedResults.concat(Array.isArray(result.items) ? result.items : []);
        var seenResults = new Set();
        searchResults = nextResults.filter(function (item) {
          var ref = item && (item.fileRef || item.ref) || {};
          var key = [ref.rootId || item.rootId || '', ref.fileId || item.fileId || '', item.line == null ? '' : item.line,
            item.start == null ? '' : item.start, item.end == null ? '' : item.end, item.snippet || ''].join('\u0000');
          if (seenResults.has(key)) return false;
          seenResults.add(key);
          return true;
        });
        searchCursor = result.cursor || null;
        searchCoverage = result.coverage || null;
        searchComplete = result.complete === true;
      }).catch(function (error) {
        if (activeSearch && activeSearch.queryId === queryId && sameScope(currentScope, getCurrentScope())) searchError = messageForError(error, tr('搜索失败。', 'Search failed.'));
      }).finally(function () {
        if (activeSearch && activeSearch.epoch === epoch) activeSearch = null;
        if (sameScope(currentScope, getCurrentScope())) renderSidebar();
      });
    }

    function loadMoreSearch() {
      if (!searchCursor || activeSearch || !searchQueryId || !bridge || typeof bridge.unifiedWorkspaceSearch !== 'function') return;
      var cursor = searchCursor;
      var query = String(queryText || '').trim();
      var rootIds = scopeForSearch();
      var currentScope = getCurrentScope();
      if (!currentScope || !query || !rootIds.length) return;
      var previous = searchResults.slice();
      var queryId = searchQueryId;
      var epoch = ++searchEpoch;
      activeSearch = { queryId: queryId, scope: currentScope, epoch: epoch };
      var request = { spaceId: currentScope.spaceId, rootIds: rootIds, queryId: queryId, scopeRevision: currentScope.scopeRevision, query: query, kind: searchKind, caseSensitive: caseSensitive, cursor: cursor, limit: 50 };
      renderSidebar();
      Promise.resolve(bridge.unifiedWorkspaceSearch(request)).then(function (result) {
        if (!activeSearch || activeSearch.queryId !== queryId || epoch !== searchEpoch || !sameScope(currentScope, getCurrentScope())) return;
        if (!result || result.ok !== true || String(result.queryId) !== queryId || String(result.scopeRevision) !== String(currentScope.scopeRevision)) throw new Error(messageForError(result));
        searchResults = previous.concat(Array.isArray(result.items) ? result.items : []);
        searchCursor = result.cursor || null;
        searchCoverage = result.coverage || searchCoverage;
        searchComplete = result.complete === true;
      }).catch(function (error) { if (sameScope(currentScope, getCurrentScope())) searchError = messageForError(error); }).finally(function () {
        if (activeSearch && activeSearch.epoch === epoch) activeSearch = null;
        if (sameScope(currentScope, getCurrentScope())) renderSidebar();
      });
    }

    function cancelSearch(invalidate) {
      var active = activeSearch;
      activeSearch = null;
      searchEpoch += 1;
      if (invalidate === false || !active || !bridge || typeof bridge.unifiedWorkspaceCancelSearch !== 'function') return;
      try { Promise.resolve(bridge.unifiedWorkspaceCancelSearch({ queryId: active.queryId })).catch(function () {}); } catch (error) {}
    }

    function openFileItem(item) {
      var fileRef = item && (item.fileRef || item.ref);
      var rootId = item && (item.rootId || fileRef && fileRef.rootId);
      var fileId = item && (item.fileId || fileRef && fileRef.fileId || fileRef && fileRef.id);
      if (!rootId || !fileId) {
        setNavStatus(tr('此结果缺少稳定文件身份，无法打开。', 'This result has no stable file identity and cannot be opened.'), 'error');
        return;
      }
      openEntity({ type: 'FileRef', id: String(fileId), rootId: String(rootId), revision: fileRef && fileRef.revision, line: item.line, relativePath: item.relativePath, hostId: item.hostId });
    }

    function currentPage() { return currentPageKey ? pageCache.get(currentPageKey) || null : null; }

    function fileParticipationIdentity(page) {
      var currentScope = getCurrentScope();
      var file = page && page.file || {};
      var rootId = String(file.rootId || page && page.ref && page.ref.rootId || '');
      var fileId = String(file.fileId || page && page.ref && page.ref.id || '');
      var revision = file.revision !== undefined && file.revision !== null ? file.revision : page && page.ref && page.ref.revision;
      if (!currentScope || !page || page.ref.type !== 'FileRef' || !rootId || !fileId || revision === undefined || revision === null ||
          file.identityVerified !== true || file.historicalChanged === true) return null;
      return {
        scope: currentScope,
        rootId: rootId,
        fileId: fileId,
        revision: revision,
        key: [currentScope.spaceId, currentScope.scopeRevision, rootId, fileId, revision].join('::')
      };
    }

    function isVisibleFilePage(page) {
      var result = page && page.file && page.file.result;
      var hasCurrentPreview = !!result && (typeof result.content === 'string' || typeof result.text === 'string' || typeof result.body === 'string');
      return !!page && page.ref && page.ref.type === 'FileRef' && page.key === currentPageKey &&
        !page.loading && !page.error && hasCurrentPreview && page.node && !page.node.hidden && contentRoot && !contentRoot.hidden &&
        (!document || document.visibilityState !== 'hidden');
    }

    function clearFileParticipation() {
      var previousPageKey = fileParticipationState.pageKey;
      fileParticipationEpoch += 1;
      clearTimeout(fileParticipationPollTimer);
      fileParticipationPollTimer = 0;
      fileParticipationExpandedKey = '';
      fileParticipationState = { key: '', pageKey: '', data: null, loading: false, error: '', epoch: fileParticipationEpoch };
      var previousPage = previousPageKey && pageCache.get(previousPageKey);
      var previousNode = previousPage && previousPage.body && previousPage.body.querySelector('.ouw-file-collaboration');
      if (previousNode) previousNode.remove();
    }

    function fileParticipationError(result, fallback) {
      if (result && result.message) return String(result.message);
      return messageForError(result, fallback || tr('协作记录未获取。', 'File participation has not been retrieved.'));
    }

    function validFileParticipationResponse(result, identity) {
      return !!result && result.ok === true && String(result.spaceId) === identity.scope.spaceId &&
        String(result.scopeRevision) === String(identity.scope.scopeRevision) && String(result.rootId) === identity.rootId &&
        String(result.fileId) === identity.fileId && String(result.revision) === String(identity.revision);
    }

    function fileParticipationRequestIsCurrent(identity, epoch, page) {
      var currentIdentity = fileParticipationIdentity(page);
      return fileParticipationState.epoch === epoch && fileParticipationState.key === identity.key &&
        sameScope(identity.scope, getCurrentScope()) && currentIdentity && currentIdentity.key === identity.key && isVisibleFilePage(page);
    }

    function scheduleFileParticipationPoll(page) {
      clearTimeout(fileParticipationPollTimer);
      fileParticipationPollTimer = 0;
      if (!isVisibleFilePage(page)) return;
      fileParticipationPollTimer = setTimeout(function () {
        fileParticipationPollTimer = 0;
        if (isVisibleFilePage(page)) requestFileParticipation(page, true);
      }, 15000);
    }

    function requestFileParticipation(page, force) {
      var identity = fileParticipationIdentity(page);
      if (!isVisibleFilePage(page) || !identity) {
        if (fileParticipationState.pageKey && (!page || fileParticipationState.pageKey !== page.key || !isVisibleFilePage(page))) clearFileParticipation();
        return Promise.resolve(false);
      }
      if (fileParticipationState.key !== identity.key) {
        clearFileParticipation();
        fileParticipationState = { key: identity.key, pageKey: page.key, data: null, loading: false, error: '', epoch: fileParticipationEpoch };
      }
      if (fileParticipationState.loading) {
        if (force) fileParticipationState.refreshAfterCurrent = true;
        return Promise.resolve(false);
      }
      if (!force && (fileParticipationState.data || fileParticipationState.error)) return Promise.resolve(false);
      if (!bridge || typeof bridge.unifiedWorkspaceFileParticipation !== 'function') {
        fileParticipationState.error = tr('协作记录未获取：服务暂不可用。', 'File participation has not been retrieved: service unavailable.');
        updateFileParticipationView(page);
        scheduleFileParticipationPoll(page);
        return Promise.resolve(false);
      }
      var state = fileParticipationState;
      state.refreshAfterCurrent = false;
      var epoch = state.epoch;
      var previousData = state.data;
      state.loading = true;
      state.error = '';
      if (!previousData) updateFileParticipationView(page);
      var request = {
        spaceId: identity.scope.spaceId,
        scopeRevision: identity.scope.scopeRevision,
        rootId: identity.rootId,
        fileId: identity.fileId,
        expectedRevision: identity.revision
      };
      var timeoutError = new Error(tr('参与状态更新未确认。', 'Participation status update was not confirmed.'));
      timeoutError.code = 'PARTICIPATION_TIMEOUT';
      var requestPromise = Promise.resolve().then(function () { return bridge.unifiedWorkspaceFileParticipation(request); });
      var requestTimer;
      var boundedRequest = new Promise(function (resolve, reject) {
        requestTimer = setTimeout(function () { reject(timeoutError); }, 8000);
        state.requestTimer = requestTimer;
        requestPromise.then(resolve, reject);
      });
      return boundedRequest.then(function (result) {
        if (!fileParticipationRequestIsCurrent(identity, epoch, page)) return false;
        if (!validFileParticipationResponse(result, identity)) throw new Error(fileParticipationError(result, tr('协作记录响应范围或文件版本不匹配。', 'Participation response did not match this file or revision.')));
        var nextData = {
          participants: Array.isArray(result.participants) ? result.participants.filter(function (item) {
            return item && item.kind === 'bot' && item.actorRef && item.actorRef.type === 'BotInstanceRef' && item.actorRef.id;
          }) : [],
          records: Array.isArray(result.records) ? result.records.slice(0, 100) : [],
          truncated: result.truncated === true,
          totalRecords: Number.isSafeInteger(Number(result.totalRecords)) && Number(result.totalRecords) >= 0 ? Number(result.totalRecords) : 0,
          observedAt: result.observedAt || ''
        };
        state.loading = false;
        state.error = '';
        var sameData = previousData && JSON.stringify({ participants: previousData.participants, records: previousData.records, truncated: previousData.truncated, totalRecords: previousData.totalRecords }) ===
          JSON.stringify({ participants: nextData.participants, records: nextData.records, truncated: nextData.truncated, totalRecords: nextData.totalRecords });
        state.data = nextData;
        if (!sameData) updateFileParticipationView(page);
        if (state.refreshAfterCurrent) requestFileParticipation(page, true);
        else scheduleFileParticipationPoll(page);
        return true;
      }).catch(function (error) {
        if (!fileParticipationRequestIsCurrent(identity, epoch, page)) return false;
        state.loading = false;
        state.data = null;
        state.error = error && error.code === 'PARTICIPATION_TIMEOUT'
          ? tr('更新未确认。', 'Update not confirmed.')
          : messageForError(error, tr('协作记录未获取。', 'File participation has not been retrieved.'));
        updateFileParticipationView(page);
        var code = String(error && error.code || '');
        if (state.refreshAfterCurrent) requestFileParticipation(page, true);
        else if (!/REVOKED|ACCESS_DENIED|PERMISSION/i.test(code)) scheduleFileParticipationPoll(page);
        return false;
      }).finally(function () {
        clearTimeout(requestTimer);
        if (state.requestTimer === requestTimer) state.requestTimer = undefined;
      });
    }

    function syncFileParticipation(page, force) {
      if (!isVisibleFilePage(page) || !fileParticipationIdentity(page)) {
        if (fileParticipationState.pageKey) clearFileParticipation();
        return Promise.resolve(false);
      }
      return requestFileParticipation(page, force === true);
    }

    function fileParticipationActorKey(record) {
      var ref = record && record.actorRef;
      return ref && ref.id ? String(ref.id) : String(record && record.actorName || tr('未知参与者', 'Unknown participant'));
    }

    function fileParticipationActorLabel(record) {
      if (!record) return tr('未知参与者', 'Unknown participant');
      if (record.actorKind === 'human') return String(record.actorName || tr('Human', 'Human'));
      if (record.actorKind === 'bot') return String(record.actorName || tr('BOT', 'BOT'));
      return tr('未知参与者', 'Unknown participant');
    }

    function fileParticipationActionLabel(action) {
      var labels = {
        context_submitted: ['已提交文件上下文', 'Submitted file context'],
        deliverable_confirmed: ['用户确认交付文件', 'Human confirmed this deliverable'],
        file_read: ['读取此文件', 'Read this file'],
        file_modified: ['修改此文件', 'Modified this file']
      };
      var entry = labels[String(action || '')];
      return entry ? tr(entry[0], entry[1]) : tr('文件活动', 'File activity');
    }

    function fileParticipationTime(value) {
      if (!value) return '';
      var date = new Date(value);
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
    }

    function fileParticipationModelLabel(value) {
      value = value && typeof value === 'object' ? value : {};
      var requested = typeof value.requested === 'string' && value.requested.trim() ? value.requested : tr('未记录', 'Not recorded');
      var resolved = typeof value.resolved === 'string' && value.resolved.trim() ? value.resolved : tr('未记录', 'Not recorded');
      var reported = typeof value.reported === 'string' && value.reported.trim() ? value.reported : tr('未报告', 'Not reported');
      var provider = typeof value.providerId === 'string' && value.providerId.trim() ? value.providerId : '';
      return tr('请求 ' + requested + ' · 解析 ' + resolved + ' · 执行器报告 ' + reported + (provider ? ' · 提供方 ' + provider : ''),
        'Requested ' + requested + ' · Resolved ' + resolved + ' · Executor-reported ' + reported + (provider ? ' · Provider ' + provider : ''));
    }

    function fileParticipationRef(value, kind, host) {
      if (!value) return;
      var ref = typeof value === 'string' ? { id: value } : value;
      var id = ref && (ref.id || ref.taskId || ref.runId);
      if (!id) return;
      var type = kind === 'run' ? 'Run' : 'WorkTask';
      var label = (kind === 'run' ? 'Run ' : tr('任务 ', 'Task ')) + String(id);
      if (ref.type === 'Run' || ref.type === 'WorkTask') type = ref.type;
      var action = button(label, 'ouw-file-collab-ref', function () { openEntity({ type: type, id: String(id) }); });
      action.setAttribute('aria-label', label);
      host.appendChild(action);
    }

    function fileParticipationExecutorLogo(adapterId) {
      var adapter = String(adapterId || '').toLowerCase();
      var brand = executorBrands[adapter] || 'generic';
      var image = el('img', 'ouw-file-collab-executor-logo');
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      installLogoFallback(image);
      image.src = 'assets/agent-logos/' + brand + (brand === 'aider' ? '.png' : '.svg');
      return image;
    }

    function fileParticipationBotAvatar(participant) {
      var actorRef = participant && participant.actorRef || {};
      var actorId = String(actorRef.id || participant && participant.botId || '');
      var bot = (snapshot && snapshot.bots || []).find(function (item) { return String(item.id) === actorId || String(item.botId || '') === actorId; }) || null;
      var legacy = {};
      try { legacy = getLegacyState() || {}; } catch (error) {}
      var botId = String(bot && (bot.botId || bot.id) || participant && participant.botId || actorId);
      var source = (legacy.bots || []).find(function (item) { return String(item.id) === botId; }) || {};
      var instance = (legacy.instances || []).find(function (item) { return String(item.spaceId || '') === String(scope && scope.spaceId || '') && String(item.botId) === botId; }) || {};
      var display = Object.assign({}, source, bot || {}, {
        name: participant && participant.name || safeName(bot) || source.name || botId,
        avatar: instance.avatar || source.avatar || bot && bot.avatar || '',
        color: instance.color || source.color || bot && bot.color || '#787878'
      });
      return display;
    }

    function fileParticipationAdapters(participant, records) {
      var values = Array.isArray(participant && participant.adapterIds) ? participant.adapterIds.slice() : [];
      var participantIds = [participant && participant.key, participant && participant.botId, participant && participant.actorRef && participant.actorRef.id].filter(Boolean).map(String);
      (records || []).forEach(function (record) {
        if (!record || record.actorKind !== 'bot' || !record.adapterId || participantIds.indexOf(fileParticipationActorKey(record)) < 0) return;
        values.push(record.adapterId);
      });
      return values.map(function (item) { return String(item || '').trim(); }).filter(function (item, index, all) { return item && all.indexOf(item) === index; });
    }

    function renderFileParticipationDetail(page, host, expandedKey, participants, records) {
      if (!expandedKey) return;
      if (expandedKey === 'participants') {
        participants.forEach(function (participant) {
          if (!participant || participant.kind !== 'bot') return;
          var display = fileParticipationBotAvatar(participant);
          var row = el('article', 'ouw-file-collab-record');
          var head = el('div', 'ouw-file-collab-record-head');
          head.appendChild(el('strong', '', String(display.name || participant.name || tr('BOT', 'BOT'))));
          head.appendChild(el('span', '', participant.status === 'working_with_context'
            ? tr('正在处理 · 已引用此文件', 'Working with context · file referenced') : tr('参与记录', 'Participation history')));
          if (participant.lastAt) {
            var time = el('time', '', fileParticipationTime(participant.lastAt));
            time.dateTime = String(participant.lastAt);
            head.appendChild(time);
          }
          row.appendChild(head);
          var adapters = fileParticipationAdapters(participant, records);
          if (adapters.length) {
            var adapterLine = el('div', 'ouw-file-collab-record-links');
            adapters.forEach(function (adapterId) {
              adapterLine.appendChild(fileParticipationExecutorLogo(adapterId));
              adapterLine.appendChild(el('span', '', adapterId));
            });
            row.appendChild(adapterLine);
          }
          host.appendChild(row);
        });
        return;
      }
      if (expandedKey === 'history') {
        var sorted = records.slice().sort(function (left, right) { return Date.parse(right && right.occurredAt || 0) - Date.parse(left && left.occurredAt || 0); });
        if (!sorted.length) {
          host.appendChild(el('div', 'ouw-file-collab-empty', tr('此文件还没有参与记录。', 'No participation records are available for this file.')));
          return;
        }
        sorted.forEach(function (record) {
          var row = el('article', 'ouw-file-collab-record');
          var head = el('div', 'ouw-file-collab-record-head');
          head.appendChild(el('strong', '', fileParticipationActorLabel(record)));
          head.appendChild(el('span', '', fileParticipationActionLabel(record.action)));
          if (record.occurredAt) {
            var time = el('time', '', fileParticipationTime(record.occurredAt));
            time.dateTime = String(record.occurredAt);
            head.appendChild(time);
          }
          row.appendChild(head);
          var links = el('div', 'ouw-file-collab-record-links');
          if (record.taskRef) fileParticipationRef(record.taskRef, 'task', links);
          if (record.runRef) fileParticipationRef(record.runRef, 'run', links);
          if (record.adapterId) {
            links.appendChild(fileParticipationExecutorLogo(record.adapterId));
            links.appendChild(el('span', '', String(record.adapterId)));
          }
          if (record.modelEvidence) links.appendChild(el('span', 'ouw-file-collab-model', fileParticipationModelLabel(record.modelEvidence)));
          if (record.evidenceKind) links.appendChild(el('span', 'ouw-file-collab-evidence', String(record.evidenceKind)));
          if (links.childNodes.length) row.appendChild(links);
          host.appendChild(row);
        });
        return;
      }
      var participantKey = expandedKey.replace(/^bot:/, '');
      var participant = participants.find(function (item) { return String(item.key || item.actorRef && item.actorRef.id || item.botId || '') === participantKey; });
      if (!participant) {
        if (expandedKey === 'viewer') host.appendChild(el('div', 'ouw-file-collab-empty', tr('你当前正在查看此文件；该查看状态不会保存。', 'You have this file open now; this viewing state is not saved.')));
        return;
      }
      var participantIds = [participant.key, participant.botId, participant.actorRef && participant.actorRef.id].filter(Boolean).map(String);
      var matched = records.filter(function (record) { return record && record.actorKind === 'bot' && participantIds.indexOf(fileParticipationActorKey(record)) >= 0; });
      var last = matched.slice().sort(function (left, right) { return Date.parse(right && right.occurredAt || 0) - Date.parse(left && left.occurredAt || 0); })[0];
      var summary = el('div', 'ouw-file-collab-empty');
      summary.appendChild(el('span', '', participant.status === 'working_with_context'
        ? tr('正在处理 · 已引用此文件', 'Working with context · file referenced') : tr('参与记录', 'Participation history')));
      if (last) summary.appendChild(el('span', '', fileParticipationActionLabel(last.action)));
      var at = last && last.occurredAt || participant.lastAt;
      if (at) summary.appendChild(el('time', '', fileParticipationTime(at)));
      host.appendChild(summary);
      var adapterIds = fileParticipationAdapters(participant, records);
      if (adapterIds.length) {
        var adapterLine = el('div', 'ouw-file-collab-record-links');
        adapterIds.forEach(function (adapterId) {
          adapterLine.appendChild(fileParticipationExecutorLogo(adapterId));
          adapterLine.appendChild(el('span', '', adapterId));
        });
        if (last && last.modelEvidence) adapterLine.appendChild(el('span', 'ouw-file-collab-model', fileParticipationModelLabel(last.modelEvidence)));
        host.appendChild(adapterLine);
      }
      if (last) {
        var refs = el('div', 'ouw-file-collab-record-links');
        if (last.taskRef) fileParticipationRef(last.taskRef, 'task', refs);
        if (last.runRef) fileParticipationRef(last.runRef, 'run', refs);
        if (refs.childNodes.length) host.appendChild(refs);
      }
    }

    function isRightAssociationPaneVisible() {
      if (!experimentEnabled() || !associationsMount || typeof associationsMount.closest !== 'function') return false;
      if (document.body && document.body.dataset && document.body.dataset.chatFocus === 'true') return false;
      var pane = associationsMount.closest('#bot-right-pane');
      return !!(pane && !pane.hidden);
    }

    function renderFileParticipation(page) {
      if (!isVisibleFilePage(page)) return null;
      var section = el('section', 'ouw-file-collaboration');
      section.setAttribute('aria-label', tr('文件参与者', 'File participants'));
      section.dataset.fileKey = fileParticipationState.key || '';
      var main = el('div', 'ouw-file-collab-main');
      var people = el('div', 'ouw-file-collab-people');
      var viewer = button('', 'ouw-file-collab-person is-viewer', function () {
        fileParticipationExpandedKey = fileParticipationExpandedKey === 'viewer' ? '' : 'viewer';
        updateFileParticipationView(page);
      });
      viewer.dataset.fileCollabKey = 'viewer';
      viewer.setAttribute('aria-expanded', String(fileParticipationExpandedKey === 'viewer'));
      viewer.setAttribute('aria-label', tr('你正在查看此文件', 'You are viewing this file'));
      viewer.appendChild(el('span', 'ouw-file-collab-avatar ouw-file-collab-viewer-avatar', tr('我', 'You')));
      var viewerCopy = el('span', 'ouw-file-collab-person-copy');
      viewerCopy.appendChild(el('span', 'ouw-file-collab-person-name', tr('你', 'You')));
      viewerCopy.appendChild(el('span', 'ouw-file-collab-person-status', tr('正在查看', 'Viewing now')));
      viewer.appendChild(viewerCopy);
      people.appendChild(viewer);

      var data = fileParticipationState.data || { participants: [], records: [], truncated: false, totalRecords: 0 };
      var participants = Array.isArray(data.participants) ? data.participants : [];
      participants.slice(0, 5).forEach(function (participant) {
        if (!participant || participant.kind !== 'bot') return;
        var key = String(participant.key || participant.actorRef && participant.actorRef.id || participant.botId || '');
        if (!key) return;
        var active = participant.status === 'working_with_context';
        var status = active ? tr('正在处理 · 已引用此文件', 'Working with context · file referenced') : tr('参与记录', 'Participation history');
        var display = fileParticipationBotAvatar(participant);
        var person = button('', 'ouw-file-collab-person', function () {
          var next = 'bot:' + key;
          fileParticipationExpandedKey = fileParticipationExpandedKey === next ? '' : next;
          updateFileParticipationView(page);
        });
        person.dataset.fileCollabKey = 'bot:' + key;
        person.setAttribute('aria-expanded', String(fileParticipationExpandedKey === 'bot:' + key));
        person.setAttribute('aria-label', String(display.name || participant.name || tr('BOT', 'BOT')) + ' · ' + status);
        var avatar = el('span', 'ouw-file-collab-avatar');
        if (display.avatar && root.OpenBotAvatars && typeof root.OpenBotAvatars.markup === 'function') {
          var markup = root.OpenBotAvatars.markup(display.avatar, display.color, { size: 'mini' });
          if (typeof markup === 'string') avatar.innerHTML = markup;
        }
        if (!avatar.childNodes.length) renderNeutralIdentity(avatar, display.name);
        person.appendChild(avatar);
        var adapters = fileParticipationAdapters(participant, data.records);
        if (adapters.length) {
          var adapterBadge = el('span', 'ouw-file-collab-adapter-badge');
          adapterBadge.title = adapters.join(', ');
          adapterBadge.setAttribute('aria-label', tr('执行器 ', 'Executor ') + adapters.join(', '));
          adapterBadge.appendChild(fileParticipationExecutorLogo(adapters[0]));
          if (adapters.length > 1) adapterBadge.appendChild(el('span', '', '+' + (adapters.length - 1)));
          person.appendChild(adapterBadge);
        }
        var copy = el('span', 'ouw-file-collab-person-copy');
        copy.appendChild(el('span', 'ouw-file-collab-person-name', String(display.name || participant.name || tr('BOT', 'BOT'))));
        copy.appendChild(el('span', 'ouw-file-collab-person-status' + (active ? ' is-working' : ''), status));
        person.appendChild(copy);
        people.appendChild(person);
      });
      main.appendChild(people);
      var recordCount = data.totalRecords || data.records.length;
      if (recordCount > 0 || participants.some(function (item) { return item && item.status === 'history'; })) {
        var historyButton = button(tr('参与记录', 'Participation history') + (recordCount ? ' · ' + recordCount : ''), 'ouw-file-collab-history', function () {
          fileParticipationExpandedKey = fileParticipationExpandedKey === 'history' ? '' : 'history';
          updateFileParticipationView(page);
        });
        historyButton.dataset.fileCollabKey = 'history';
        historyButton.setAttribute('aria-expanded', String(fileParticipationExpandedKey === 'history'));
        main.appendChild(historyButton);
      }
      if (participants.length > 5) {
        var moreParticipants = button(tr('更多参与者 · ' + (participants.length - 5), 'More participants · ' + (participants.length - 5)), 'ouw-file-collab-history', function () {
          fileParticipationExpandedKey = fileParticipationExpandedKey === 'participants' ? '' : 'participants';
          updateFileParticipationView(page);
        });
        moreParticipants.dataset.fileCollabKey = 'participants';
        moreParticipants.setAttribute('aria-expanded', String(fileParticipationExpandedKey === 'participants'));
        main.appendChild(moreParticipants);
      }
      section.appendChild(main);

      if (fileParticipationState.loading) section.appendChild(el('div', 'ouw-file-collab-status', tr('正在读取参与记录…', 'Reading participation history…')));
      else if (fileParticipationState.error) {
        var rightShowsLinkError = isRightAssociationPaneVisible() && associationsMount && associationsMount.dataset.state === 'error';
        if (!rightShowsLinkError) {
          var errorText = fileParticipationState.error === tr('更新未确认。', 'Update not confirmed.')
            ? fileParticipationState.error
            : tr('协作记录未获取。', 'File participation has not been retrieved.') + ' ' + fileParticipationState.error;
          var error = el('div', 'ouw-file-collab-status is-error', errorText);
          section.appendChild(error);
          section.appendChild(button(tr('重试', 'Retry'), 'ouw-file-collab-retry', function () { requestFileParticipation(page, true); }));
        }
      } else if (!data.records.length && !participants.length) {
        section.appendChild(el('div', 'ouw-file-collab-status', tr('你在查看此文件。', 'You are viewing this file.')));
      } else if (data.truncated) {
        section.appendChild(el('div', 'ouw-file-collab-status', tr('显示 ' + data.records.length + ' 条记录（优先当前任务，共 ' + data.totalRecords + ' 条）', 'Showing ' + data.records.length + ' records, prioritizing current tasks (' + data.totalRecords + ' total).')));
      }
      var detail = el('div', 'ouw-file-collab-detail');
      detail.hidden = !fileParticipationExpandedKey;
      renderFileParticipationDetail(page, detail, fileParticipationExpandedKey, participants, data.records);
      section.appendChild(detail);
      return section;
    }

    function updateFileParticipationView(page) {
      var existing = page && page.body && page.body.querySelector('.ouw-file-collaboration');
      if (!isVisibleFilePage(page)) {
        if (existing) existing.remove();
        return;
      }
      var next = renderFileParticipation(page);
      if (!next) return;
      var active = document.activeElement;
      var shouldRestoreFocus = !!(active && existing && existing.contains(active));
      var focusKey = shouldRestoreFocus && active.dataset && active.dataset.fileCollabKey;
      var focusLabel = shouldRestoreFocus && (active.getAttribute('aria-label') || active.textContent.trim());
      if (existing) existing.replaceWith(next);
      else {
        var content = page.body.querySelector('.ouw-file-content');
        if (content) page.body.insertBefore(next, content);
        else page.body.appendChild(next);
      }
      if (shouldRestoreFocus) {
        var buttons = Array.from(next.querySelectorAll('button'));
        var replacement = buttons.find(function (item) { return focusKey && item.dataset.fileCollabKey === focusKey; }) ||
          buttons.find(function (item) { return focusLabel && (item.getAttribute('aria-label') || item.textContent.trim()) === focusLabel; });
        if (replacement) replacement.focus();
      }
    }

    function openEntity(inputRef) {
      var ref = normalizeRef(inputRef);
      if (!ref) return;
      contextOriginKey = '';
      if (ref.type === 'Bot') {
        var legacyBot = (snapshot && snapshot.bots || []).find(function (item) { return String(item.id) === ref.id || String(item.botId) === ref.id; });
        if (legacyBot) openLegacyBot(legacyBot);
        return;
      }
      rememberThreadSubviewScroll(currentPage());
      if (currentPageKey && currentPageKey !== refKey(ref)) backStack.push(currentPageKey);
      currentPageKey = refKey(ref);
      legacyHop = false;
      contentRoot.hidden = false;
      contentMount.hidden = false;
      showLegacyContent(false);
      var page = getPage(ref, inputRef);
      showPage(page);
      if (ref.type === 'FileRef') loadFilePage(page);
      else loadDetail(page);
    }

    function getPage(ref, metadata) {
      var key = refKey(ref);
      if (!pageCache.has(key)) {
        var article = el('article', 'ouw-page');
        article.dataset.ouwPage = key;
        article.dataset.ouwPageRef = key;
        article.hidden = true;
        var body = el('div', 'ouw-page-body');
        article.appendChild(body);
        pageHost.appendChild(article);
        var pageRef = Object.assign({}, ref);
        if (ref.type === 'FileRef' && metadata) ['rootId', 'revision', 'line', 'relativePath', 'hostId', 'sourceRevision', 'sourceRange', 'historicalText', 'historicalTruncated'].forEach(function (fieldName) {
          if (metadata[fieldName] !== undefined) pageRef[fieldName] = metadata[fieldName];
        });
        pageCache.set(key, { key: key, ref: pageRef, node: article, body: body, detail: null, loading: false, error: '', file: null, epoch: 0 });
      } else if (ref.type === 'FileRef' && metadata) {
        var existing = pageCache.get(key);
        ['rootId', 'revision', 'line', 'relativePath', 'hostId', 'sourceRevision', 'sourceRange', 'historicalText', 'historicalTruncated'].forEach(function (fieldName) {
          if (metadata[fieldName] !== undefined) existing.ref[fieldName] = metadata[fieldName];
        });
      }
      return pageCache.get(key);
    }

    function loadFilePage(page) {
      if (!page || page.ref.type !== 'FileRef') return Promise.resolve();
      if (page.ref.rootId && page.ref.revision !== undefined && page.ref.revision !== null) return loadFilePreview(page, page.ref);
      return loadFileReference(page);
    }

    function loadFileReference(page) {
      clearFileParticipation();
      if (!bridge || typeof bridge.unifiedWorkspaceDetail !== 'function') {
        page.error = tr('文件身份详情服务尚不可用。', 'File identity details are not available yet.'); renderPage(page); return Promise.resolve();
      }
      var currentScope = getCurrentScope();
      if (!currentScope) return Promise.resolve();
      var ticket = ++detailEpoch;
      page.epoch = ticket; page.loading = true; page.error = '';
      renderPage(page);
      return Promise.resolve(bridge.unifiedWorkspaceDetail({ spaceId: currentScope.spaceId, scopeRevision: currentScope.scopeRevision, ref: page.ref })).then(function (result) {
        if (page.epoch !== ticket || !sameScope(currentScope, getCurrentScope())) return;
        if (!validResponse(result, currentScope)) throw new Error(messageForError(result, tr('文件身份详情已过期，未显示。', 'File identity details are stale and were not shown.')));
        page.detail = result;
        var location = result.fileLocation || null;
        if ((!location || location.identityVerified !== true) && result.entity && result.entity.rootId && bridge && typeof bridge.unifiedWorkspaceResolveFile === 'function') {
          var resolveRequest = { spaceId: currentScope.spaceId, rootId: String(result.entity.rootId), fileId: String(page.ref.id), scopeRevision: currentScope.scopeRevision };
          return Promise.resolve(bridge.unifiedWorkspaceResolveFile(resolveRequest)).then(function (resolved) {
            if (page.epoch !== ticket || !sameScope(currentScope, getCurrentScope())) return;
            if (!validResponse(resolved, currentScope)) throw new Error(messageForError(resolved, tr('文件身份验证失败。', 'File identity verification failed.')));
            if (resolved.identityVerified !== true) throw new Error(tr('文件身份尚未验证。', 'File identity has not been verified.'));
            location = resolved;
            page.fileLocation = location;
          });
        }
        if (location && location.identityVerified === true) page.fileLocation = location;
      }).then(function () {
        if (page.epoch !== ticket || !sameScope(currentScope, getCurrentScope())) return;
        var location = page.fileLocation;
        if (!location || location.identityVerified !== true || !location.rootId || !location.fileId || location.revision === undefined || location.revision === null) {
          page.file = { rootId: page.ref.rootId || resultRootId(page.detail), fileId: page.ref.id, identityVerified: false,
            historicalText: page.ref.historicalText, historicalTruncated: page.ref.historicalTruncated, sourceRevision: page.ref.sourceRevision, sourceRange: page.ref.sourceRange };
          page.loading = false;
          renderPage(page);
          return;
        }
        if (String(location.fileId) !== String(page.ref.id) || page.ref.rootId && String(location.rootId) !== String(page.ref.rootId)) {
          throw new Error(tr('文件身份与历史引用不匹配，未显示文件内容。', 'The file identity did not match this reference; no file content was shown.'));
        }
        var historicalRevision = location.sourceRevision !== undefined ? location.sourceRevision : page.ref.sourceRevision;
        if (historicalRevision !== undefined && historicalRevision !== null && String(historicalRevision) !== String(location.revision)) {
          page.file = Object.assign({}, location, { identityVerified: true, historicalChanged: true,
            historicalText: page.ref.historicalText, historicalTruncated: page.ref.historicalTruncated, sourceRevision: historicalRevision, sourceRange: page.ref.sourceRange });
          page.loading = false;
          renderPage(page);
          return;
        }
        page.ref.rootId = String(location.rootId);
        page.ref.revision = location.revision;
        page.ref.relativePath = location.relativePath || page.ref.relativePath;
        page.file = Object.assign({}, location, { identityVerified: true, line: page.ref.line });
        loadFilePreview(page, page.file);
      }).catch(function (error) {
        if (page.epoch === ticket && sameScope(currentScope, getCurrentScope())) { page.loading = false; page.error = messageForError(error, tr('无法验证此文件身份。', 'Unable to verify this file identity.')); renderPage(page); }
      });
    }

    function resultRootId(detail) {
      return detail && detail.entity && detail.entity.rootId ? String(detail.entity.rootId) : '';
    }

    function rememberThreadSubviewScroll(page) {
      if (!page || !pageHost || page.ref.type !== 'Thread' || currentPageKey !== page.key) return;
      page.threadSubviewScroll = page.threadSubviewScroll || { conversation: 0, execution: 0 };
      page.threadSubviewScroll[page.threadSubview === 'execution' ? 'execution' : 'conversation'] = pageHost.scrollTop;
    }

    function restoreThreadSubviewScroll(page) {
      if (!page || !pageHost || page.ref.type !== 'Thread' || currentPageKey !== page.key) return;
      var view = page.threadSubview === 'execution' ? 'execution' : 'conversation';
      var value = page.threadSubviewScroll && page.threadSubviewScroll[view];
      pageHost.scrollTop = Number.isFinite(value) && value >= 0 ? value : 0;
    }

    function showPage(page) {
      pageCache.forEach(function (entry) { entry.node.hidden = entry !== page; });
      if (fileParticipationState.pageKey && fileParticipationState.pageKey !== page.key) clearFileParticipation();
      currentPageKey = page.key;
      syncProjectTaskActions();
      updateSidebarCurrent();
      var title = pageTitle(page);
      var titleNode = pageHeader.querySelector('[data-ouw-title]');
      if (titleNode) titleNode.textContent = title;
      var backButton = pageHeader.querySelector('[data-ouw-back]');
      if (backButton) backButton.hidden = backStack.length === 0;
      syncComposerForPage(page);
      restoreThreadSubviewScroll(page);
      renderPage(page);
      if (experimentEnabled()) syncExperimentAssociations(false);
    }

    function pageTitle(page) {
      var entity = page && page.detail && page.detail.entity;
      if (page && page.codex) {
        if (page.codex.kind === 'thread') return String(page.codex.history && page.codex.history.thread && page.codex.history.thread.title || page.codex.item && page.codex.item.title || tr('历史会话', 'History thread'));
        if (page.codex.kind === 'unassigned') return tr('未归工程会话', 'Projectless sessions');
        return String(page.codex.item && page.codex.item.name || tr('Codex 工程', 'Codex project'));
      }
      if (page && page.ref.type === 'FileRef') return page.file && page.file.relativePath || page.ref.relativePath || tr('文件预览', 'File preview');
      if (page && page.ref.type === 'Run') return tr('执行记录 ', 'Run ') + String(entity && entity.id || page.ref.id);
      return safeName(entity) || (page && page.ref.type === 'Project' ? tr('项目', 'Project') : page && page.ref.type === 'WorkTask' ? tr('任务', 'Task') : tr('会话', 'Thread'));
    }

    function showWorkspace(show) {
      if (contentRoot) contentRoot.hidden = !show;
      if (contentMount) contentMount.hidden = !show;
      if (!show) clearFileParticipation();
      showLegacyContent(!show);
      syncProjectTaskActions();
    }

    function closeWorkspacePage() {
      showWorkspace(false);
      legacyHop = false;
      // 单行化 #5：关闭详情即清当前页标识并同步行高亮，否则旧行残留 is-current/aria-current。
      currentPageKey = '';
      contextOriginKey = '';
      backStack = [];
      updateSidebarCurrent();
      setSwitcherState();
      if (experimentEnabled()) syncExperimentAssociations(false);
    }

    function rememberLegacyReturn(key) {
      if (!key) return;
      legacyReturnPageKey = key;
      legacyHop = true;
      setSwitcherState();
    }

    function returnFromLegacy() {
      if (!legacyHop || !legacyReturnPageKey) return;
      var page = pageCache.get(legacyReturnPageKey);
      if (!page) return;
      legacyHop = false;
      contentRoot.hidden = false;
      contentMount.hidden = false;
      showLegacyContent(false);
      showPage(page);
      setSwitcherState();
    }

    function goBack() {
      rememberThreadSubviewScroll(currentPage());
      contextOriginKey = '';
      if (!backStack.length) return closeWorkspacePage();
      var key = backStack.pop();
      var page = pageCache.get(key);
      if (!page) return;
      showPage(page);
    }

    function loadThreadTaskDetail(page, threadDetail, expectedScope, ticket) {
      var taskId = String(threadDetail.entity.primaryTaskId || threadDetail.entity.taskId || '');
      if (!taskId) return Promise.resolve();
      return Promise.resolve(bridge.unifiedWorkspaceDetail(Object.assign({}, expectedScope, { ref: { type: 'WorkTask', id: taskId } }))).then(function (result) {
        if (page.epoch !== ticket || !sameScope(expectedScope, getCurrentScope())) return;
        if (!validResponse(result, expectedScope) || !result.entity || result.entity.type !== 'WorkTask' || String(result.entity.id) !== taskId ||
            !(result.threads || []).some(function (thread) { return String(thread.id) === String(threadDetail.entity.id); })) {
          throw commandError(result, tr('关联任务当前不可读取，请打开任务核查。', 'The linked task is unavailable. Open the task to inspect it.'));
        }
        page.threadTaskDetail = result;
      }).catch(function (error) {
        if (page.epoch !== ticket || !sameScope(expectedScope, getCurrentScope())) return;
        page.threadTaskDetail = null;
        page.threadTaskError = messageForError(error, tr('关联任务当前不可读取。', 'The linked task is unavailable.'));
      });
    }

    function warmableThread(entity) {
      return !!(entity && entity.type === 'Thread' && !entity.deletedAt &&
        entity.messageSourceRef && entity.messageSourceRef.sourceType === 'unified-thread' &&
        entity.executionBinding && entity.executionBinding.executorId === 'agent:codex' &&
        entity.executionBinding.transport === 'appserver');
    }

    function warmThreadFor(threadId, visible, entity) {
      if (!bridge || typeof bridge.unifiedWorkspaceWarmThread !== 'function') return;
      var currentScope = getCurrentScope();
      var id = String(threadId || '');
      if (!currentScope || !id) return;
      if (visible) {
        var target = entity || (pageCache.get('Thread:' + id) || {}).detail;
        target = target && target.entity ? target.entity : target;
        if (!warmableThread(target)) return;
      }
      // A visibility downgrade is a minimal pool update. It must still reach
      // the service when detail is gone, otherwise the old warm session stays
      // visible and cannot be reclaimed; the service remains the authority.
      var key = id + '|' + (visible ? '1' : '0');
      var prior = warmThreadCache.get(id);
      if (prior && prior.key === key && (!prior.settled || prior.at && Date.now() - prior.at < WARM_THREAD_DEDUPE_MS)) return;
      var request = { key: key, at: 0, settled: false };
      var base = prior && prior.promise ? prior.promise.catch(function () {}) : Promise.resolve();
      request.promise = base.then(function () {
        var scope = getCurrentScope();
        if (!sameScope(currentScope, scope)) return null;
        return Promise.resolve(bridge.unifiedWorkspaceWarmThread({ spaceId: scope.spaceId, scopeRevision: scope.scopeRevision,
          threadId: id, visible: visible })).catch(function () { return null; });
      }).then(function (result) {
        request.at = Date.now(); request.settled = true; return result;
      });
      warmThreadCache.set(id, request);
    }

    function loadDetail(page) {
      if (!bridge || typeof bridge.unifiedWorkspaceDetail !== 'function') {
        page.error = tr('工作空间详情服务尚不可用。', 'Workspace details are not available yet.');
        renderPage(page); return Promise.resolve();
      }
      var currentScope = getCurrentScope();
      if (!currentScope) return Promise.resolve();
      var ticket = ++detailEpoch;
      var composerReadRevision = composerInputRevision;
      page.epoch = ticket; page.loading = true; page.error = '';
      if (page.ref.type === 'Thread') {
        rememberThreadSubviewScroll(page);
        page.threadScrollAwaitingDetail = true;
        page.threadTaskDetail = null;
        page.threadTaskError = '';
      }
      renderPage(page);
      return Promise.resolve(bridge.unifiedWorkspaceDetail({ spaceId: currentScope.spaceId, scopeRevision: currentScope.scopeRevision, ref: page.ref })).then(function (result) {
        if (page.epoch !== ticket || !sameScope(currentScope, getCurrentScope())) return;
        if (!validResponse(result, currentScope) || !result.entity || String(result.entity.type) !== page.ref.type || String(result.entity.id) !== page.ref.id) throw new Error(messageForError(result, tr('详情身份不匹配或已过期，未显示。', 'Details do not match this item or are stale and were not shown.')));
        page.detail = result;
        page.error = '';
        if (page.ref.type === 'Thread') warmThreadFor(page.ref.id, true, result.entity);
        if (page.ref.type === 'Thread') return loadThreadTaskDetail(page, result, currentScope, ticket);
      }).catch(function (error) {
        if (page.epoch === ticket && sameScope(currentScope, getCurrentScope())) page.error = messageForError(error);
      }).finally(function () {
        if (page.epoch !== ticket || !sameScope(currentScope, getCurrentScope())) return;
        page.loading = false;
        if (contextPage() === page) renderContext();
        if (currentPageKey === page.key) {
          var titleNode = pageHeader.querySelector('[data-ouw-title]'); if (titleNode) titleNode.textContent = pageTitle(page);
          var backButton = pageHeader.querySelector('[data-ouw-back]'); if (backButton) backButton.hidden = backStack.length === 0;
          renderPage(page);
          if (page.ref.type === 'Thread' && composerState.threadId === String(page.ref.id) &&
              composerInputRevision === composerReadRevision && page.detail && page.detail.draft) {
            // Drafts do not broadcast workspace changes. Reopening or refreshing
            // a thread therefore uses its fresh detail response to reconcile the
            // editor's cached caret and scroll state, unless the user edited it
            // while that request was in flight.
            hydrateComposer(page.detail.draft);
          }
        }
      });
    }

    function loadFilePreview(page, selected) {
      clearFileParticipation();
      if (!bridge || typeof bridge.unifiedWorkspacePreview !== 'function') {
        page.error = tr('文件预览服务尚不可用。', 'File preview is not available yet.'); renderPage(page); return Promise.resolve();
      }
      var currentScope = getCurrentScope();
      if (!currentScope) return Promise.resolve();
      var rootId = selected.rootId || selected.fileRef && selected.fileRef.rootId || page.ref.rootId;
      var fileId = selected.fileId || selected.fileRef && selected.fileRef.fileId || page.ref.id;
      var expectedRevision = selected.revision !== undefined && selected.revision !== null ? selected.revision
        : selected.fileRef && selected.fileRef.revision !== undefined && selected.fileRef.revision !== null ? selected.fileRef.revision : page.ref.revision;
      if (!rootId || !fileId || expectedRevision === undefined || expectedRevision === null) {
        page.file = Object.assign({}, page.file || {}, { rootId: rootId || '', fileId: fileId || page.ref.id, identityVerified: false });
        page.error = ''; page.loading = false; renderPage(page); return Promise.resolve();
      }
      var ticket = ++detailEpoch;
      page.epoch = ticket; page.loading = true; page.error = '';
      page.file = Object.assign({}, page.file || {}, { rootId: String(rootId), fileId: String(fileId), revision: expectedRevision,
        relativePath: selected.relativePath || page.ref.relativePath || '', line: selected.line !== undefined ? selected.line : page.ref.line, identityVerified: true });
      renderPage(page);
      var request = { spaceId: currentScope.spaceId, rootId: String(rootId), fileId: String(fileId), expectedRevision: expectedRevision, scopeRevision: currentScope.scopeRevision };
      if (page.file.line !== undefined && page.file.line !== null) request.line = page.file.line;
      return Promise.resolve(bridge.unifiedWorkspacePreview(request)).then(function (result) {
        if (page.epoch !== ticket || !sameScope(currentScope, getCurrentScope())) return;
        if (!validResponse(result, currentScope)) throw new Error(messageForError(result, tr('预览已过期，未显示。', 'The preview is stale and was not shown.')));
        var fields = result.file || result.entity || result;
        page.file = Object.assign({}, page.file, fields, { result: result, identityVerified: true });
        page.error = '';
      }).catch(function (error) { if (page.epoch === ticket && sameScope(currentScope, getCurrentScope())) page.error = messageForError(error, tr('无法预览此文件。', 'Unable to preview this file.')); }).finally(function () {
        if (page.epoch === ticket) {
          page.loading = false;
          if (currentPageKey === page.key) {
            var titleNode = pageHeader.querySelector('[data-ouw-title]');
            if (titleNode) titleNode.textContent = pageTitle(page);
          }
          renderPage(page);
          if (currentPageKey === page.key && experimentEnabled()) syncExperimentAssociations(false);
        }
      });
    }

    function renderPage(page) {
      if (!page || !page.body) return;
      if (contextPage() === page) renderContext();
      if (page.ref.type === 'Thread' && !page.threadScrollAwaitingDetail && !page.threadSubviewScrollTransition && !page.loading && !page.error) rememberThreadSubviewScroll(page);
      rememberThreadFocus(page);
      rememberReceiptFocus(page);
      var activeCodexSearch = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.ouwCodexSearchPage === page.key;
      var searchSelection = activeCodexSearch ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
      page.body.replaceChildren();
      if (page.loading) { page.body.appendChild(el('div', 'ouw-page-loading', tr('正在读取…', 'Loading…'))); return; }
      if (page.error) { var error = el('div', 'ouw-page-error', page.error); page.body.appendChild(error); page.body.appendChild(button(tr('重试', 'Retry'), 'ouw-inline-action', function () { if (page.codex) { if (page.codex.kind === 'thread') loadCodexThreadHistory(page, false); else loadCodexThreadList(page, false); } else if (page.ref.type === 'FileRef') loadFilePage(page); else loadDetail(page); })); return; }
      if (page.codex) renderCodexHistoryPage(page);
      else if (page.ref.type === 'FileRef') renderFilePage(page);
      else renderEntityPage(page);
      restoreThreadFocus(page);
      restoreReceiptFocus(page);
      if (currentPageKey === page.key && (page.ref.type === 'Thread' || page.ref.type === 'Run')) {
        if (page.ref.type === 'Thread') {
          if (!page.loading && !page.error) page.threadScrollAwaitingDetail = false;
          restoreThreadSubviewScroll(page);
          if (page.scrollToLatestOnUpdate && !page.loading && !page.error && pageHost) {
            pageHost.scrollTop = Math.max(0, pageHost.scrollHeight - pageHost.clientHeight);
            rememberThreadSubviewScroll(page);
            var activeRuns = page.detail && Array.isArray(page.detail.runs) && page.detail.runs.some(threadWorkbenchActive);
            var msgCount = page.detail && Array.isArray(page.detail.messages) ? page.detail.messages.length : 0;
            if (!activeRuns && msgCount > (page.lastRenderedScrollMsgCount || 0)) page.scrollToLatestOnUpdate = false;
          }
        }
        applySessionLocator(page);
        if (page.ref.type === 'Thread') page.threadSubviewScrollTransition = false;
      }
      if (activeCodexSearch && currentPageKey === page.key) {
        var nextSearch = page.body.querySelector('.ouw-codex-search-input');
        if (nextSearch) { nextSearch.focus(); if (searchSelection) try { nextSearch.setSelectionRange(searchSelection[0], searchSelection[1]); } catch (error) {} }
      }
    }

    function formatCodexTime(value) {
      if (value === undefined || value === null || value === '') return '';
      var date = typeof value === 'number' ? new Date(value) : new Date(String(value));
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
    }

    function formatCodexBytes(value) {
      var bytes = Number(value);
      if (!Number.isFinite(bytes) || bytes < 0) return '';
      if (bytes < 1024) return Math.round(bytes) + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function codexModelEvidence(model, evidence, provider) {
      if (!model || evidence === 'unknown') return tr('模型：未知', 'Model: unknown');
      var label = tr('记录模型：', 'Recorded model: ') + String(model);
      if (provider) label += ' · ' + String(provider);
      return label;
    }

    function codexMembershipLabel(membership) {
      if (membership === 'assigned') return tr('已归属工程', 'Assigned to project');
      if (membership === 'projectless') return tr('未关联工程', 'No project assigned');
      if (membership === 'unknown') return tr('归属未记录', 'Membership not recorded');
      return tr('归属未知', 'Membership unknown');
    }

    function codexWarningLabel(value) {
      var labels = {
        CODEX_HISTORY_DESKTOP_STATE_UNAVAILABLE: ['部分工程归属信息无法确认。', 'Some project membership information could not be confirmed.'],
        CODEX_HISTORY_THREAD_LIMIT: ['来源记录很多，当前列表可能未包含全部会话。', 'This source has many records; the current list may not include every session.'],
        CODEX_HISTORY_INDEX_LAG: ['还有较新的消息尚未整理到历史记录中。', 'Some newer messages are not yet available in the history.'],
        CODEX_HISTORY_NOT_INDEXED: ['此会话尚未完整整理到历史记录中。', 'This session has not been fully indexed into history.'],
        CODEX_HISTORY_RECORD_TOO_LARGE: ['有一条过长记录未能显示。', 'A record was too large to display.'],
        CODEX_HISTORY_HISTORY_MISSING: ['原始历史记录当前不可用。', 'The original history is currently unavailable.'],
        CODEX_HISTORY_UNSAFE_SOURCE: ['无法验证此来源记录。', 'This source record could not be verified.']
      };
      var entry = labels[String(value || '')];
      if (entry) return tr(entry[0], entry[1]);
      return tr('部分来源信息无法读取。', 'Some source information could not be read.');
    }

    function codexEventLabel(value) {
      var labels = {
        commandExecution: ['命令执行记录', 'Command execution record'], fileChange: ['文件变更记录', 'File change record'],
        collabAgentToolCall: ['智能体协作记录', 'Agent collaboration record'], subAgentActivity: ['子任务活动记录', 'Subtask activity record'],
        webSearch: ['网页检索记录', 'Web search record'], mcpToolCall: ['工具调用记录', 'Tool call record'],
        dynamicToolCall: ['工具调用记录', 'Tool call record'], imageGeneration: ['图像生成记录', 'Image generation record'],
        imageView: ['图像查看记录', 'Image view record'], contextCompaction: ['上下文整理记录', 'Context organization record'],
        plan: ['计划更新记录', 'Plan update record'], sleep: ['等待记录', 'Wait record']
      };
      var entry = labels[String(value || '')];
      return entry ? tr(entry[0], entry[1]) : tr('活动记录', 'Activity record');
    }

    function renderCodexHistoryPage(page) {
      if (page.codex.kind === 'thread') renderCodexThreadPage(page);
      else renderCodexProjectPage(page);
    }

    function renderCodexProjectPage(page) {
      var codex = page.codex;
      var item = codex.item || {};
      var source = codex.source || {};
      var meta = el('div', 'ouw-entity-meta ouw-codex-meta');
      var sourceBadge = el('span', 'ouw-entity-type ouw-codex-source-badge');
      sourceBadge.appendChild(codexLogo('ouw-codex-inline-logo', source));
      sourceBadge.appendChild(el('span', '', String(source.label || tr('Codex 历史', 'Codex history'))));
      meta.appendChild(sourceBadge);
      meta.appendChild(el('span', 'ouw-status-pill', tr('只读历史', 'Read-only history')));
      if (codex.kind === 'project') {
        meta.appendChild(el('span', 'ouw-entity-revision', item.membershipSource === 'desktop-state' ? tr('工作区关联', 'Workspace association') : tr('原生关联', 'Native association')));
        if (item.nativeId) meta.appendChild(el('span', 'ouw-entity-revision', tr('原生工程 ID：', 'Original project ID: ') + String(item.nativeId)));
      } else {
        meta.appendChild(el('span', 'ouw-entity-revision', tr('未归属与归属未知', 'Unassigned and unknown membership')));
      }
      page.body.appendChild(meta);
      if (codex.kind === 'project') {
        var roots = Array.isArray(item.roots) ? item.roots : [];
        var rootsSection = sectionBlock(tr('来源目录', 'Source folders'));
        rootsSection.appendChild(el('div', 'ouw-codex-readonly-note', tr('这些路径仅作来源信息展示，不会绑定或建立索引。', 'These paths are shown as source information only; they are not bound or indexed.')));
        if (!roots.length) rootsSection.appendChild(el('div', 'ouw-subtle-empty', tr('没有记录来源目录。', 'No source folders were recorded.')));
        roots.forEach(function (rootPath) { rootsSection.appendChild(el('div', 'ouw-codex-root-path', String(rootPath))); });
        page.body.appendChild(rootsSection);
      } else {
        page.body.appendChild(el('div', 'ouw-codex-membership-note ouw-codex-page-note', tr('此列表会分别标明明确未关联工程和归属未记录的会话。', 'This list distinguishes sessions with no project from sessions whose membership was not recorded.')));
      }

      var list = codex.list || { query: '', archived: false, items: [], cursor: null, warnings: [], loading: false, loaded: false, error: '' };
      var section = sectionBlock(tr('历史会话', 'Session history'));
      var controls = el('div', 'ouw-codex-thread-controls');
      var searchLabel = el('label', 'ouw-codex-search-label', tr('按标题搜索', 'Search titles'));
      var searchInput = el('input', 'ouw-codex-search-input');
      searchInput.type = 'search'; searchInput.value = String(list.query || '');
      searchInput.placeholder = tr('输入关键词', 'Search title keywords');
      searchInput.setAttribute('aria-label', tr('搜索历史会话标题', 'Search session titles'));
      searchInput.dataset.ouwCodexSearchPage = page.key;
      searchInput.addEventListener('compositionstart', function () {
        list.composing = true;
        clearTimeout(codexQueryTimers.get(page.key));
        codexQueryTimers.delete(page.key);
      });
      searchInput.addEventListener('compositionend', function () {
        list.composing = false;
        scheduleCodexThreadQuery(page, searchInput.value, searchInput);
      });
      searchInput.addEventListener('input', function (event) {
        if (list.composing || event.isComposing || searchInput.isComposing) return;
        scheduleCodexThreadQuery(page, searchInput.value, searchInput);
      });
      searchLabel.appendChild(searchInput);
      controls.appendChild(searchLabel);
      var archivedLabel = el('label', 'ouw-codex-archived-toggle');
      var archivedInput = el('input', ''); archivedInput.type = 'checkbox'; archivedInput.checked = !!list.archived;
      archivedInput.addEventListener('change', function () { list.archived = archivedInput.checked; loadCodexThreadList(page, false); });
      archivedLabel.append(archivedInput, document.createTextNode(tr('显示已归档会话', 'Show archived sessions')));
      controls.appendChild(archivedLabel);
      controls.appendChild(button(tr('刷新列表', 'Refresh list'), 'ouw-link-button', function () { loadCodexThreadList(page, false); }));
      section.appendChild(controls);
      if (list.loading) section.appendChild(el('div', 'ouw-page-loading', tr('正在读取会话…', 'Reading sessions…')));
      else if (list.error) {
        section.appendChild(el('div', 'ouw-page-error', list.error));
        section.appendChild(button(tr('重试', 'Retry'), 'ouw-inline-action', function () { loadCodexThreadList(page, false); }));
      } else {
        if (codex.kind === 'unassigned') renderCodexMembershipGroups(page, section, list.items || []);
        else renderCodexThreadRows(page, section, list.items || []);
        if (!list.items || !list.items.length) section.appendChild(el('div', 'ouw-subtle-empty', list.query
          ? tr('没有匹配的会话标题。', 'No session titles matched.')
          : list.archived ? tr('没有已归档会话。', 'No archived sessions.') : tr('此工程没有历史会话。', 'This project has no session history.')));
        if (list.cursor) section.appendChild(button(tr('加载更多会话', 'Load more sessions'), 'ouw-inline-action', function () { loadCodexThreadList(page, true); }));
      }
      (list.warnings || []).forEach(function (warning) { if (typeof warning === 'string' && warning) section.appendChild(el('div', 'ouw-codex-warning', codexWarningLabel(warning))); });
      page.body.appendChild(section);
    }

    function renderCodexMembershipGroups(page, host, items) {
      var groups = [
        { id: 'projectless', label: tr('明确未关联工程', 'No project assigned') },
        { id: 'unknown', label: tr('归属未记录', 'Membership not recorded') },
        { id: 'other', label: tr('其他归属状态', 'Other membership state') }
      ];
      groups.forEach(function (group) {
        var matches = items.filter(function (thread) {
          if (group.id === 'other') return thread && ['projectless', 'unknown'].indexOf(String(thread.membership)) < 0;
          return thread && String(thread.membership) === group.id;
        });
        if (!matches.length) return;
        host.appendChild(el('h3', 'ouw-codex-membership-heading', group.label));
        renderCodexThreadRows(page, host, matches);
      });
    }

    function renderCodexThreadRows(page, host, items) {
      items.forEach(function (thread) {
        if (!thread || !thread.id) return;
        var row = button('', 'ouw-related-row ouw-codex-thread-row', function () { openCodexThread(page.codex.source, thread); });
        var creator = creatorAvatar({ kind: 'unknown', evidence: { kind: 'source-not-recorded' } });
        row.appendChild(creator);
        var copy = el('span', 'ouw-codex-thread-copy');
        var title = el('span', 'ouw-codex-thread-title', String(thread.title || thread.nativeId || tr('未命名会话', 'Untitled session')));
        copy.appendChild(title);
        var details = el('span', 'ouw-codex-thread-meta');
        var time = formatCodexTime(thread.updatedAt || thread.createdAt);
        if (time) details.appendChild(el('span', '', time));
        details.appendChild(el('span', '', codexMembershipLabel(thread.membership)));
        details.appendChild(el('span', '', codexModelEvidence(thread.model, thread.modelEvidence, thread.modelProvider)));
        copy.appendChild(details);
        if (thread.archived) copy.appendChild(el('span', 'ouw-status-pill', tr('已归档', 'Archived')));
        row.appendChild(copy);
        row.setAttribute('aria-label', title.textContent + ', ' + creator.getAttribute('aria-label'));
        row.title = title.textContent + ' · ' + creator.title;
        host.appendChild(row);
      });
    }

    function renderCodexThreadPage(page) {
      var history = page.codex.history || { items: [], coverage: null, loading: false, error: '', thread: page.codex.item };
      var thread = history.thread || page.codex.item || {};
      var source = page.codex.source || {};
      var meta = el('div', 'ouw-entity-meta ouw-codex-meta');
      var sourceBadge = el('span', 'ouw-entity-type ouw-codex-source-badge');
      sourceBadge.appendChild(codexLogo('ouw-codex-inline-logo', source));
      sourceBadge.appendChild(el('span', '', String(source.label || tr('Codex 历史', 'Codex history'))));
      meta.appendChild(sourceBadge);
      meta.appendChild(el('span', 'ouw-status-pill', tr('只读历史', 'Read-only history')));
      if (thread.archived) meta.appendChild(el('span', 'ouw-status-pill', tr('已归档', 'Archived')));
      page.body.appendChild(meta);
      var identity = sectionBlock(tr('来源记录', 'Source record'));
      identity.appendChild(el('div', 'ouw-codex-model-evidence', codexModelEvidence(thread.model, thread.modelEvidence, thread.modelProvider)));
      identity.appendChild(el('div', 'ouw-codex-identity-value', tr('原会话 ID：', 'Original session ID: ') + String(thread.nativeId || tr('未记录', 'not recorded'))));
      if (thread.cwd) identity.appendChild(el('div', 'ouw-codex-root-path', tr('工作目录：', 'Working folder: ') + String(thread.cwd)));
      if (thread.updatedAt || thread.createdAt) identity.appendChild(el('div', 'ouw-codex-identity-value', tr('最近记录：', 'Updated: ') + formatCodexTime(thread.updatedAt || thread.createdAt)));
      page.body.appendChild(identity);
      renderCodexContinuation(page, source, thread);

      var coverage = history.coverage;
      if (coverage) {
        var coverageSection = sectionBlock(tr('历史覆盖', 'History coverage'));
        var coverageText = coverage.status === 'complete' ? tr('来源记录已同步', 'Source history is in sync') : coverage.status === 'partial' ? tr('来源记录可能不完整', 'Source history may be incomplete') : tr('不可用', 'Unavailable');
        coverageSection.appendChild(el('div', 'ouw-codex-coverage-status', coverageText));
        if (coverage.reason) coverageSection.appendChild(el('div', 'ouw-codex-warning', codexWarningLabel(coverage.reason)));
        var byteParts = [];
        var indexedBytes = formatCodexBytes(coverage.indexedBytes), rolloutBytes = formatCodexBytes(coverage.rolloutBytes);
        if (indexedBytes) byteParts.push(tr('已索引记录 ', 'Indexed records ') + indexedBytes);
        if (rolloutBytes) byteParts.push(tr('可用历史 ', 'Available history ') + rolloutBytes);
        if (byteParts.length) coverageSection.appendChild(el('div', 'ouw-codex-thread-meta', byteParts.join(' · ')));
        page.body.appendChild(coverageSection);
      }

      var messages = sectionBlock(tr('消息记录', 'Messages'));
      var loadedCount = (history.items || []).length;
      var loadedLabel = history.cursor
        ? tr('已载入 ' + loadedCount + ' 条消息，仍有更多记录可查看。', loadedCount + ' messages loaded; more records are available.')
        : coverage && coverage.status === 'partial'
          ? tr('当前载入 ' + loadedCount + ' 条消息；来源记录可能不完整。', loadedCount + ' messages loaded; source history may be incomplete.')
          : tr('已载入 ' + loadedCount + ' 条消息。', loadedCount + ' messages loaded.');
      messages.appendChild(el('div', 'ouw-codex-readonly-note', loadedLabel));
      if (history.error) {
        messages.appendChild(el('div', 'ouw-page-error', history.error));
        messages.appendChild(button(tr('重试', 'Retry'), 'ouw-inline-action', function () { loadCodexThreadHistory(page, false); }));
      } else if (history.loading && !history.items.length) messages.appendChild(el('div', 'ouw-page-loading', tr('正在读取消息…', 'Reading messages…')));
      else if (!history.items.length) messages.appendChild(el('div', 'ouw-subtle-empty', tr('没有可显示的消息记录。', 'No messages are available to display.')));
      var messageList = el('div', 'ouw-message-list ouw-codex-message-list');
      (history.items || []).forEach(function (item) {
        if (!item) return;
        var kind = String(item.kind || 'unsupported');
        var knownRole = kind === 'user' || kind === 'assistant';
        var message = el('article', 'ouw-message ouw-codex-message' + (kind === 'user' ? ' is-user' : ''));
        var metaLine = el('div', 'ouw-message-meta');
        var roleLabel = kind === 'user' ? tr('用户', 'User') : kind === 'assistant' ? tr('助手', 'Assistant') : kind === 'event' ? tr('事件', 'Event') : tr('不支持的记录', 'Unsupported record');
        metaLine.appendChild(el('span', '', roleLabel));
        if (item.eventType) metaLine.appendChild(el('span', '', codexEventLabel(item.eventType)));
        if (item.timestamp) metaLine.appendChild(el('span', '', formatCodexTime(item.timestamp)));
        if (item.model || item.modelEvidence) metaLine.appendChild(el('span', '', codexModelEvidence(item.model, item.modelEvidence)));
        if (item.truncated) metaLine.appendChild(el('span', 'ouw-codex-truncated', tr('记录已截断', 'Record truncated')));
        message.appendChild(metaLine);
        var content = el('pre', 'ouw-message-text ouw-codex-message-text', String(item.text || ''));
        if (!knownRole) content.classList.add('is-event');
        message.appendChild(content);
        messageList.appendChild(message);
      });
      messages.appendChild(messageList);
      if (history.loading && history.items.length) messages.appendChild(el('div', 'ouw-page-loading', tr('正在读取更多消息…', 'Reading more messages…')));
      messages.appendChild(button(tr('刷新历史', 'Refresh history'), 'ouw-link-button', function () { loadCodexThreadHistory(page, false); }));
      if (history.cursor && !history.loading) messages.appendChild(button(tr('加载更多消息', 'Load more messages'), 'ouw-inline-action', function () { loadCodexThreadHistory(page, true); }));
      (history.warnings || []).forEach(function (warning) { if (typeof warning === 'string' && warning) messages.appendChild(el('div', 'ouw-codex-warning', codexWarningLabel(warning))); });
      page.body.appendChild(messages);
    }

    function isCodexContinuationSource(source) {
      var sourceType = String(source && source.sourceType || '').toLowerCase();
      var sourceRuntime = String(source && source.sourceRuntime || '').toLowerCase();
      return (sourceType === 'codex' || sourceRuntime === 'codex') &&
        (!sourceType || sourceType === 'codex') && (!sourceRuntime || sourceRuntime === 'codex');
    }

    function renderCodexContinuation(page, source, thread) {
      var state = page.codex.continuation || (page.codex.continuation = { projectId: '', operationId: '', busy: false, error: '', mode: 'excerpt' });
      var currentScope = getCurrentScope();
      if (!currentScope || String(currentScope.spaceId) !== 'personal') return;
      var nativeCodex = isCodexContinuationSource(source);
      if (!nativeCodex || ['excerpt', 'fork', 'resume'].indexOf(state.mode) < 0) state.mode = 'excerpt';
      if (!nativeCodex && state.mode !== 'excerpt') state.mode = 'excerpt';
      var section = sectionBlock(tr('在 Bot Studio 继续', 'Continue in Bot Studio'));
      section.classList.add('ouw-codex-continuation');
      var modeLabel = el('label', 'ouw-field');
      modeLabel.appendChild(el('span', 'ouw-field-label', tr('接续方式', 'Continuation method')));
      var modeSelect = el('select', 'ouw-field-input');
      modeSelect.dataset.ouwCodexContinuationMode = page.key;
      [
        { id: 'excerpt', label: tr('DSH 历史节选（默认）', 'Selected history excerpt (DSH, default)') },
        ...(nativeCodex ? [
          { id: 'fork', label: tr('Codex 原生分支（保留原记录）', 'Codex native fork (keeps the original record)') },
          { id: 'resume', label: tr('继续原 Codex 会话（发送后写入原会话）', 'Continue original Codex session (writes to it after sending)') }
        ] : [])
      ].forEach(function (entry) {
        var option = el('option', '', entry.label);
        option.value = entry.id;
        modeSelect.appendChild(option);
      });
      modeSelect.value = state.mode;
      modeLabel.appendChild(modeSelect);
      section.appendChild(modeLabel);

      var modeNote = el('div', 'ouw-codex-readonly-note');
      section.appendChild(modeNote);
      var label = el('label', 'ouw-field');
      label.appendChild(el('span', 'ouw-field-label', tr('接续到项目', 'Continue in project')));
      var select = el('select', 'ouw-field-input');
      var continueButton = null;
      select.dataset.ouwCodexContinuationProject = page.key;
      var choose = el('option', '', tr('选择 Bot Studio 项目…', 'Choose an Bot Studio project…'));
      choose.value = '';
      select.appendChild(choose);
      (snapshot && Array.isArray(snapshot.projects) ? snapshot.projects : []).forEach(function (project) {
        if (!project || !project.id) return;
        var option = el('option', '', safeName(project));
        option.value = String(project.id);
        select.appendChild(option);
      });
      select.value = String(state.projectId || '');

      function continuationAvailable() {
        var api = root.OpenBotLocalDiscovery;
        if (!api) return false;
        if (modeSelect.value === 'fork' || modeSelect.value === 'resume') return typeof api.continueNative === 'function';
        return typeof api.continueHistory === 'function';
      }
      function updateContinuationControls() {
        var mode = modeSelect.value || 'excerpt';
        state.mode = mode;
        var copy = mode === 'fork'
          ? tr('创建分支只建立待发送的接续绑定，不会运行 Codex；原始记录保持不变。你发送消息后才会启动 Codex 分支。', 'Creating a fork only prepares a pending continuation binding; it does not run Codex. The original record stays unchanged. The Codex branch starts only after you send a message.')
          : mode === 'resume'
            ? tr('创建绑定不会运行或声称恢复已完成。你在 Bot Studio 发送消息后，才会写入原 Codex 会话。', 'Creating the binding does not run Codex or claim that the session has resumed. The original Codex session is written to only after you send a message in OpenBot.')
            : tr('为所选 Bot Studio 项目建立带历史节选的新对话。原始智能体记录保持只读，使用 DSH + DeepSeek Flash。', 'Create a new conversation with the selected history excerpt in the chosen Bot Studio project. Original agent records stay read-only. Continue with DSH + DeepSeek Flash.');
        modeNote.textContent = copy;
        if (continueButton) {
          continueButton.textContent = state.busy ? tr('正在建立接续…', 'Creating continuation…') : state.error ? tr('重试接续', 'Retry continuation') : mode === 'fork'
            ? tr('创建 Codex 分支接续绑定', 'Create Codex fork binding') : mode === 'resume'
              ? tr('创建原会话接续绑定', 'Create original-session binding') : tr('在 Bot Studio 继续', 'Continue in Bot Studio');
          continueButton.dataset.ouwContinuationMode = mode;
          continueButton.disabled = state.busy || !select.value || !continuationAvailable();
        }
      }

      select.addEventListener('change', function () {
        state.projectId = select.value;
        state.operationId = '';
        state.error = '';
        updateContinuationControls();
      });
      modeSelect.addEventListener('change', function () {
        state.mode = nativeCodex ? modeSelect.value : 'excerpt';
        state.operationId = '';
        state.error = '';
        updateContinuationControls();
      });
      select.disabled = state.busy || !(snapshot && Array.isArray(snapshot.projects) && snapshot.projects.length);
      modeSelect.disabled = state.busy;
      label.appendChild(select);
      section.appendChild(label);
      continueButton = button('', 'ouw-primary-action', function () {
        continueCodexHistory(page, source, thread, select.value, modeSelect.value);
      });
      continueButton.dataset.ouwAction = 'continue-codex';
      continueButton.disabled = state.busy || !select.value || !continuationAvailable();
      section.appendChild(continueButton);
      updateContinuationControls();
      if (!select.options.length || select.options.length === 1) section.appendChild(el('div', 'ouw-subtle-empty', tr('当前空间没有 Bot Studio 项目。请先创建项目。', 'There are no Bot Studio projects in this workspace. Create a project first.')));
      if (state.error) {
        var error = el('div', 'ouw-page-error ouw-codex-continuation-error', state.error);
        error.setAttribute('role', 'alert');
        section.appendChild(error);
      }
      page.body.appendChild(section);
    }

    function continueCodexHistory(page, source, thread, projectId, selectedMode) {
      var state = page.codex.continuation || (page.codex.continuation = { projectId: '', operationId: '', busy: false, error: '', mode: 'excerpt' });
      var currentScope = getCurrentScope();
      var mode = String(selectedMode || state.mode || 'excerpt');
      var nativeMode = mode === 'fork' || mode === 'resume';
      if (!projectId) { state.error = tr('请选择要接续到的 Bot Studio 项目。', 'Choose the Bot Studio project for this continuation.'); renderPage(page); return; }
      if (!currentScope || currentScope.spaceId !== 'personal' || !source || !source.id || !thread || !thread.id || nativeMode && !isCodexContinuationSource(source)) {
        state.error = tr('当前历史引用、接续方式或工作空间不可用。', 'This history reference, continuation method, or workspace is unavailable.'); renderPage(page); return;
      }
      var api = root.OpenBotLocalDiscovery;
      var continuation = api && (nativeMode ? api.continueNative : api.continueHistory);
      if (typeof continuation !== 'function') {
        state.error = tr('历史接续服务暂不可用。', 'History continuation is not available yet.'); renderPage(page); return;
      }
      state.projectId = String(projectId);
      state.mode = nativeMode ? mode : 'excerpt';
      state.operationId = state.operationId || makeOperationId();
      state.busy = true;
      state.error = '';
      renderPage(page);
      var expectedScope = Object.assign({}, currentScope);
      var input = {
        scope: expectedScope,
        projectId: String(projectId),
        operationId: state.operationId,
        historyRef: { sourceId: String(source.id), sourceThreadId: String(thread.id) },
        title: thread.title ? String(thread.title) : ''
      };
      if (nativeMode) input.mode = mode;
      Promise.resolve(continuation.call(api, input)).then(function (result) {
        if (!sameScope(expectedScope, getCurrentScope())) throw new Error(tr('工作空间已切换，未打开过期接续结果。', 'The workspace changed; the stale continuation result was not opened.'));
        if (nativeMode) {
          var expectedMode = mode === 'fork' ? 'native-fork-pending' : 'native-resume-pending';
          if (!result || result.nativeResume !== false || result.mode !== expectedMode) {
            throw new Error(tr('Codex 接续回执未确认待发送绑定；原会话尚未执行。', 'The Codex receipt did not confirm a pending binding; the original session has not been run.'));
          }
        } else if (!result || result.nativeResume === true || result.nativeResume !== false && result.mode !== 'history-handoff' && !result.historyHandoff) {
          throw new Error(tr('接续回执未确认新会话与原历史的边界。', 'The continuation receipt did not confirm the boundary between the new thread and the original history.'));
        }
        var threadRef = result.threadRef || result.entity && result.entity.type === 'Thread' && { type: 'Thread', id: result.entity.id };
        if (!threadRef || !threadRef.type || threadRef.id === undefined) throw new Error(tr('接续回执缺少可打开的 Bot Studio 会话。', 'The continuation receipt did not include an Bot Studio thread that can be opened.'));
        state.busy = false;
        state.error = '';
        state.operationId = '';
        openEntity(threadRef);
      }).catch(function (error) {
        state.busy = false;
        state.error = messageForError(error, tr('无法在 Bot Studio 建立接续会话。', 'Could not create a continuation thread in OpenBot.'));
        if (currentPageKey === page.key) renderPage(page);
      });
    }

    function renderEntityPage(page) {
      var detail = page.detail;
      if (!detail || !detail.entity) { page.body.appendChild(el('div', 'ouw-page-empty', tr('对象详情尚不可用。', 'Object details are not available.'))); return; }
      var entity = detail.entity;
      if (entity.type === 'Thread' || page.ref.type === 'Thread') {
        var threadLayered = entity.kind === 'task' || entity.kind === 'legacy-task';
        page.body.classList.add('uw-thread-workbench');
        page.body.classList.toggle('uw-thread-daily', !threadLayered);
        page.body.classList.toggle('uw-thread-task', entity.kind === 'task');
        renderThreadBody(page, detail);
        var sessionBody = page.body;
        if (threadLayered) {
          page.body = page.sessionConversationPane || sessionBody;
          renderThreadTechnical(page, detail);
        }
        page.body = sessionBody;
        return;
      }
      var meta = el('div', 'ouw-entity-meta');
      meta.appendChild(el('span', 'ouw-entity-type', formatEntityType(entity.type || page.ref.type)));
      if (entity.status) meta.appendChild(el('span', 'ouw-status-pill', formatStatus(entity.status)));
      if (entity.revision !== undefined) meta.appendChild(el('span', 'ouw-entity-revision', tr('修订 ', 'Revision ') + entity.revision));
      if (entity.archivedAt) meta.appendChild(el('span', 'ouw-status-pill', tr('已归档', 'Archived')));
      page.body.appendChild(meta);
      if (entity.goal || entity.description) page.body.appendChild(el('p', 'ouw-entity-description', entity.goal || entity.description));
      if (entity.type === 'Project' || page.ref.type === 'Project') renderProjectBody(page, detail);
      if (entity.type === 'WorkTask' || page.ref.type === 'WorkTask') renderTaskBody(page, detail);
      if (entity.type === 'Thread' || page.ref.type === 'Thread') renderThreadBody(page, detail);
      if (entity.type === 'BotInstanceRef' || page.ref.type === 'BotInstanceRef') renderBotBody(page, detail);
      if (entity.type === 'RootBinding' || page.ref.type === 'RootBinding') renderRootBody(page, detail);
      if (entity.type === 'Run' || page.ref.type === 'Run') {
        renderRunBody(page, detail);
        renderRelations(page, detail);
        renderActivity(page, detail);
        renderContextSnapshots(page, detail);
        return;
      }
      if (entity.type !== 'BotInstanceRef' && page.ref.type !== 'BotInstanceRef') {
        renderRelations(page, detail, entity.type === 'Project' || page.ref.type === 'Project' ? {
          skipEmpty: true, filter: function (relation) { return relation.predicate !== 'project_binds_root'; }
        } : undefined);
      }
      renderActivity(page, detail);
      renderRuns(page, detail);
      renderContextSnapshots(page, detail);
    }

    function renderProjectBody(page, detail) {
      var project = detail.entity;
      var tasks = (Array.isArray(snapshot.tasks) ? snapshot.tasks : []).filter(function (task) { return String(task.primaryProjectId || '') === String(project.id); });
      var linkedThreads = detail.threads || [];
      var chatState = page.projectChat || (page.projectChat = { operationId: '', busy: false, error: '' });
      var chatActions = el('div', 'ouw-project-chat-actions');
      var newChat = button(chatState.busy ? tr('正在创建…', 'Creating…') : chatState.error ? tr('重试新对话', 'Retry new conversation') : tr('新对话', 'New conversation'), 'ouw-primary-action', function () { createProjectChat(page, project); });
      newChat.dataset.ouwAction = 'project-chat';
      newChat.disabled = chatState.busy || !root.OpenBotLocalDiscovery || typeof root.OpenBotLocalDiscovery.projectChat !== 'function';
      chatActions.appendChild(newChat);
      if (chatState.error) {
        var chatError = el('div', 'ouw-page-error', chatState.error);
        chatError.setAttribute('role', 'alert');
        chatActions.appendChild(chatError);
      }
      page.body.appendChild(chatActions);
      var sessionsSection = sectionBlock(tr('会话', 'Sessions'));
      sessionsSection.dataset.ouwProjectSection = 'sessions';
      if (!linkedThreads.length) sessionsSection.appendChild(el('div', 'ouw-subtle-empty', tr('此工程还没有会话。', 'This project has no sessions yet.')));
      else {
        var sessionList = el('ul', 'ouw-project-detail-list');
        sessionList.setAttribute('role', 'list');
        linkedThreads.forEach(function (thread) {
          var item = el('li');
          var link = entityCreatorRow(safeName(thread), { type: 'Thread', id: thread.id }, thread.creator, 'ouw-related-thread');
          link.dataset.ouwProjectThread = String(thread.id);
          item.appendChild(link);
          sessionList.appendChild(item);
        });
        sessionsSection.appendChild(sessionList);
      }
      var createProjectThread = button(tr('新建任务会话', 'New task session'), 'ouw-inline-action', function () { openCreateThreadForm(String(project.id)); });
      createProjectThread.dataset.ouwNewTaskThread = String(project.id);
      sessionsSection.appendChild(createProjectThread);
      page.body.appendChild(sessionsSection);
      renderProjectFolders(page, detail);

      var tasksSection = sectionBlock(tr('任务', 'Tasks'));
      tasksSection.dataset.ouwProjectSection = 'tasks';
      if (!tasks.length) tasksSection.appendChild(el('div', 'ouw-subtle-empty', tr('此工程还没有任务。', 'This project has no tasks yet.')));
      tasks.forEach(function (task) { tasksSection.appendChild(entityCreatorRow(safeName(task) + (task.status ? ' · ' + formatStatus(task.status) : ''), { type: 'WorkTask', id: task.id }, task.creator)); });
      tasksSection.appendChild(button(tr('新建任务', 'Create task'), 'ouw-inline-action', function () { openCreateTaskForm(String(project.id)); }));
      tasksSection.appendChild(button(tr('编辑项目', 'Edit project'), 'ouw-inline-action', function () { openEditProjectForm(project); }));
      page.body.appendChild(tasksSection);
      var evidenceSection = sectionBlock(tr('工程参与与执行留痕', 'Project members and execution evidence'));
      renderProjectEvidenceStrip(evidenceSection, detail, false);
      page.body.appendChild(evidenceSection);
      renderProjectAssociations(page, detail);
    }

    function createProjectChat(page, project) {
      var state = page.projectChat || (page.projectChat = { operationId: '', busy: false, error: '' });
      var currentScope = getCurrentScope();
      if (!currentScope || !project || !project.id) { state.error = tr('当前项目或工作空间不可用。', 'The current project or workspace is unavailable.'); renderPage(page); return; }
      if (!root.OpenBotLocalDiscovery || typeof root.OpenBotLocalDiscovery.projectChat !== 'function') {
        state.error = tr('项目对话服务暂不可用。', 'Project chat is not available yet.'); renderPage(page); return;
      }
      state.operationId = state.operationId || makeOperationId();
      state.busy = true;
      state.error = '';
      renderPage(page);
      var expectedScope = Object.assign({}, currentScope);
      root.OpenBotLocalDiscovery.projectChat({
        scope: expectedScope,
        projectId: String(project.id),
        operationId: state.operationId,
        title: safeName(project) + ' · ' + tr('新对话', 'New conversation')
      }).then(function (result) {
        if (!sameScope(expectedScope, getCurrentScope())) throw new Error(tr('工作空间已切换，未打开过期会话。', 'The workspace changed; the stale thread was not opened.'));
        var threadRef = result && (result.threadRef || result.entity && result.entity.type === 'Thread' && { type: 'Thread', id: result.entity.id });
        if (!threadRef || !threadRef.type || threadRef.id === undefined) throw new Error(tr('项目会话回执缺少可打开的会话。', 'Project chat did not return a thread that can be opened.'));
        state.busy = false;
        state.error = '';
        state.operationId = '';
        openEntity(threadRef);
      }).catch(function (error) {
        state.busy = false;
        state.error = messageForError(error, tr('无法创建项目对话。', 'Could not create a project conversation.'));
        if (currentPageKey === page.key) renderPage(page);
      });
    }

    function renderProjectAssociations(page, detail) {
      var project = detail.entity;
      var botsSection = sectionBlock(tr('BOT 关联', 'BOT associations'));
      renderRelationPicker(botsSection, page, {
        label: tr('关联负责人 BOT', 'Add owning BOT'), predicate: 'bot_owns_project',
        options: snapshot.bots || [], subject: function (item) { return { type: 'BotInstanceRef', id: String(item.id) }; },
        object: function () { return { type: 'Project', id: String(project.id) }; },
        optionLabel: safeName, excludePredicates: ['bot_owns_project']
      });
      renderRelationPicker(botsSection, page, {
        label: tr('关联参与 BOT', 'Add participating BOT'), predicate: 'bot_participates_project',
        options: snapshot.bots || [], subject: function (item) { return { type: 'BotInstanceRef', id: String(item.id) }; },
        object: function () { return { type: 'Project', id: String(project.id) }; },
        optionLabel: safeName, excludePredicates: ['bot_participates_project']
      });
      page.body.appendChild(botsSection);
    }

    function renderProjectFolders(page, detail) {
      var project = detail.entity;
      var rootsSection = sectionBlock(tr('文件', 'Files'));
      rootsSection.dataset.ouwProjectSection = 'files';
      var roots = new Map((detail.roots || []).map(function (folder) { return [String(folder.id), folder]; }));
      var links = (detail.relations || []).filter(function (relation) {
        return !relation.endedAt && relation.predicate === 'project_binds_root' &&
          refKey(relation.subjectRef) === refKey(page.ref) && relation.objectRef && relation.objectRef.type === 'RootBinding';
      });
      if (!links.length) rootsSection.appendChild(el('div', 'ouw-subtle-empty', tr('此工程尚未绑定文件夹。', 'This project has no linked folders yet.')));
      else {
        var list = el('ul', 'ouw-project-detail-list');
        list.setAttribute('role', 'list');
        links.forEach(function (relation) {
          var folder = roots.get(String(relation.objectRef.id));
          var row = el('li', 'ouw-relation-row');
          if (folder) {
            var label = safeName(folder);
            var open = button(label, 'ouw-relation-link', function () { openEntity({ type: 'RootBinding', id: folder.id }); }, folder.path || label);
            open.dataset.ouwProjectRoot = String(folder.id);
            row.appendChild(open);
          } else {
            row.appendChild(el('span', 'ouw-subtle-empty', tr('已绑定的文件夹不可访问', 'Linked folder is unavailable')));
          }
          var unlink = button(tr('解除', 'Unlink'), 'ouw-inline-action ouw-unlink-action', function (event) { endRelation(page, relation, event.currentTarget); });
          if (folder) unlink.setAttribute('aria-label', tr('解除目录关联：', 'Unlink folder: ') + safeName(folder));
          row.appendChild(unlink);
          list.appendChild(row);
        });
        rootsSection.appendChild(list);
      }
      renderRelationPicker(rootsSection, page, {
        label: tr('关联已授权目录', 'Add bound folder'), predicate: 'project_binds_root',
        options: (snapshot.roots || []).filter(function (folder) { return folder.status === 'online'; }),
        subject: function () { return { type: 'Project', id: String(project.id) }; },
        object: function (item) { return { type: 'RootBinding', id: String(item.id) }; },
        optionLabel: function (item) { return safeName(item) + (item.canonicalPath || item.path ? ' · ' + (item.canonicalPath || item.path) : ''); },
        excludePredicates: ['project_binds_root']
      });
      rootsSection.appendChild(button(tr('绑定新目录…', 'Bind a new folder…'), 'ouw-inline-action', function () { bindRootForProject(String(project.id)); }));
      page.body.appendChild(rootsSection);
    }

    function renderBotBody(page, detail) {
      var bot = detail.entity;
      var botRef = { type: 'BotInstanceRef', id: String(bot.id || page.ref.id) };
      var botId = botRef.id;
      var allRuns = Array.isArray(detail.runs) ? detail.runs : [];
      var latestRuns = Object.create(null);
      allRuns.forEach(function (run) {
        if (!run || !run.threadId || run.executorBotRef && String(run.executorBotRef.id || '') !== botId) return;
        var id = String(run.threadId), current = latestRuns[id];
        if (!current || botTimestamp(run.updatedAt || run.createdAt) > botTimestamp(current.updatedAt || current.createdAt)) latestRuns[id] = run;
      });
      var threads = uniqueBy((Array.isArray(detail.threads) ? detail.threads : []).filter(function (thread) {
        return thread && thread.id !== undefined && thread.id !== null && String(thread.id).trim();
      }), function (thread) { return String(thread.id); });
      function activityFor(thread) {
        return latestRuns[String(thread.id)] || null;
      }
      threads.sort(function (left, right) {
        return botTimestamp((activityFor(right) || {}).updatedAt || (activityFor(right) || {}).createdAt || right.updatedAt || right.createdAt) -
          botTimestamp((activityFor(left) || {}).updatedAt || (activityFor(left) || {}).createdAt || left.updatedAt || left.createdAt);
      });

      var sessions = sectionBlock(tr('相关会话', 'Related sessions'));
      sessions.appendChild(el('p', 'ouw-bot-related-note', tr('仅显示当前空间中与此 Bot 实例关联的会话。', 'Only sessions associated with this Bot instance in the current space are shown.')));
      if (!threads.length) {
        sessions.appendChild(el('div', 'ouw-subtle-empty', tr('当前空间还没有与此 Bot 关联的会话。可从左栏“会话”视角新建或打开会话；关联后会显示在这里。', 'This Bot has no associated sessions in this space yet. Create or open one from the Sessions view in the sidebar; associated sessions will appear here.')));
      } else {
        var threadList = el('div', 'ouw-bot-related-list');
        threads.forEach(function (thread) {
          var run = activityFor(thread);
          var stamp = run && (run.updatedAt || run.createdAt) || thread.updatedAt || thread.createdAt;
          var activityParts = [], kindLabel = threadKindLabel(thread);
          if (kindLabel) activityParts.push(kindLabel);
          if (run) activityParts.push(tr('最近运行', 'Last run') + (stamp ? ' · ' + botDateLabel(stamp) : '') + (run.status ? ' · ' + formatStatus(run.status) : ''));
          else if (thread.createdAt) activityParts.push(tr('创建于 ', 'Created ') + botDateLabel(thread.createdAt));
          var activity = activityParts.join(' · ');
          var label = safeName(thread) || String(thread.id);
          var row = button('', 'ouw-related-row ouw-bot-related-thread', function () {
            openEntity({ type: 'Thread', id: String(thread.id) });
          });
          row.dataset.ouwBotRelatedThread = String(thread.id);
          row.appendChild(creatorAvatar(thread.creator));
          var copy = el('span', 'ouw-bot-related-copy');
          copy.appendChild(el('span', 'ouw-bot-related-title', label));
          if (activity) copy.appendChild(el('span', 'ouw-bot-related-meta', activity));
          row.appendChild(copy);
          row.setAttribute('aria-label', label + (activity ? ', ' + activity : ''));
          row.title = label;
          threadList.appendChild(row);
        });
        sessions.appendChild(threadList);
      }
      page.body.appendChild(sessions);

      var roots = Array.isArray(detail.roots) ? detail.roots.filter(function (item) {
        return item && item.id !== undefined && item.id !== null && String(item.id).trim();
      }) : [];
      var files = uniqueBy((Array.isArray(detail.files) ? detail.files : []).filter(function (file) {
        return file && file.id !== undefined && file.id !== null && String(file.id).trim() && file.rootId !== undefined && file.rootId !== null;
      }), function (file) { return String(file.rootId) + ':' + String(file.id); });
      var rootById = Object.create(null);
      roots.forEach(function (rootItem) { rootById[String(rootItem.id)] = rootItem; });
      var filesSection = sectionBlock(tr('负责目录中的已登记文件', 'Registered files in responsible folders'));
      filesSection.appendChild(el('p', 'ouw-bot-related-note', tr('点击文件后会在当前空间通过现有预览流程核验；这里不授予新的目录访问权限。', 'Opening a file uses the existing preview flow to verify it in this space. This list does not grant new folder access.')));
      if (!files.length) {
        filesSection.appendChild(el('div', 'ouw-subtle-empty', roots.length
          ? tr('负责目录中暂无已登记文件。可在左栏“文件”视角浏览目录。', 'No registered files are listed for these folders yet. Browse them from the Files view in the sidebar.')
          : tr('此 Bot 尚未关联负责目录。可在下方“项目与目录管理”中关联；目录文件与“实例文件”分别管理。', 'This Bot has no responsible folders. Add one under Project and folder management below. Folder files are separate from Instance files.')));
      } else {
        var grouped = Object.create(null);
        files.forEach(function (file) {
          var rootId = String(file.rootId);
          if (!grouped[rootId]) grouped[rootId] = [];
          grouped[rootId].push(file);
        });
        var fileList = el('div', 'ouw-bot-related-files');
        Object.keys(grouped).forEach(function (rootId) {
          var rootItem = rootById[rootId];
          var group = el('section', 'ouw-bot-related-file-group');
          group.appendChild(el('h3', 'ouw-bot-related-group-title', safeName(rootItem) || tr('负责目录', 'Responsible folder')));
          grouped[rootId].forEach(function (file) {
            var label = String(file.relativePath || file.name || file.title || file.id);
            var row = button('', 'ouw-related-row ouw-bot-related-file', function () {
              openEntity({ type: 'FileRef', id: String(file.id), rootId: String(file.rootId) });
            });
            row.dataset.ouwBotRelatedFile = String(file.id);
            row.appendChild(el('span', 'ouw-bot-related-title', label));
            row.setAttribute('aria-label', tr('负责目录文件：', 'Folder file: ') + label);
            row.title = label;
            group.appendChild(row);
          });
          fileList.appendChild(group);
        });
        filesSection.appendChild(fileList);
      }
      var fileTotal = Number.isSafeInteger(detail.filesTotal) && detail.filesTotal >= 0 ? detail.filesTotal : files.length;
      var filesTruncated = detail.filesTruncated === true || fileTotal > files.length;
      if (filesTruncated) {
        var shown = el('p', 'ouw-bot-related-note', tr('此处显示最近的 ' + files.length + ' 条登记；当前空间共有 ' + fileTotal + ' 条。', 'Showing the most recent ' + files.length + ' registered files; ' + fileTotal + ' are available in this space.'));
        filesSection.appendChild(shown);
        filesSection.appendChild(button(tr('在文件视角查看全部', 'View all in Files'), 'ouw-inline-action', function () {
          projectNavigationAction('openBotFiles', null, botRef, null);
        }));
      }
      page.body.appendChild(filesSection);

      var management = el('details', 'ouw-bot-management');
      management.dataset.ouwBotManagement = 'true';
      management.appendChild(el('summary', '', tr('项目与目录管理', 'Project and folder management')));
      var managementBody = el('div', 'ouw-bot-management-body');
      var projects = sectionBlock(tr('项目', 'Projects'));
      renderRelationPicker(projects, page, {
        label: tr('关联负责项目', 'Add owning project'), predicate: 'bot_owns_project',
        options: snapshot.projects || [], subject: function () { return botRef; },
        object: function (item) { return { type: 'Project', id: String(item.id) }; }, optionLabel: safeName,
        excludePredicates: ['bot_owns_project']
      });
      renderRelationPicker(projects, page, {
        label: tr('关联参与项目', 'Add participating project'), predicate: 'bot_participates_project',
        options: snapshot.projects || [], subject: function () { return botRef; },
        object: function (item) { return { type: 'Project', id: String(item.id) }; }, optionLabel: safeName,
        excludePredicates: ['bot_participates_project']
      });
      managementBody.appendChild(projects);

      var rootSection = sectionBlock(tr('负责目录', 'Responsible folders'));
      renderRelationPicker(rootSection, page, {
        label: tr('设为负责 BOT 的目录', 'Assign responsible folder'), predicate: 'bot_owns_root',
        options: snapshot.roots || [], subject: function () { return botRef; },
        object: function (item) { return { type: 'RootBinding', id: String(item.id) }; },
        optionLabel: safeName,
        excludePredicates: ['bot_owns_root']
      });
      managementBody.appendChild(rootSection);
      renderRelations(page, detail, { target: managementBody, filter: function (relation) {
        return ['bot_owns_project', 'bot_participates_project', 'bot_owns_root'].indexOf(String(relation.predicate || '')) >= 0;
      }, skipEmpty: true });
      management.appendChild(managementBody);
      page.body.appendChild(management);
    }

    function botTimestamp(value) {
      if (value === undefined || value === null || value === '') return 0;
      var number = typeof value === 'number' ? value : Date.parse(String(value));
      return Number.isFinite(number) ? number : 0;
    }

    function botDateLabel(value) {
      var stamp = botTimestamp(value);
      return stamp ? new Date(stamp).toLocaleString() : '';
    }

    function renderRootBody(page, detail) {
      var rootEntity = detail.entity;
      var pathText = rootEntity.canonicalPath || rootEntity.path || '';
      if (pathText) page.body.appendChild(el('p', 'ouw-entity-description ouw-root-path', pathText));
      var meta = el('div', 'ouw-file-meta');
      [rootEntity.hostId, rootEntity.worktree, formatStatus(rootEntity.status), rootEntity.locatorRevision ? tr('定位修订 ', 'Locator revision ') + rootEntity.locatorRevision : ''].filter(Boolean).forEach(function (item) { meta.appendChild(el('span', '', item)); });
      if (meta.childNodes.length) page.body.appendChild(meta);
      var rootActions = el('div', 'ouw-task-actions');
      if (bridge && typeof bridge.unifiedWorkspaceRelocateRoot === 'function' && !rootEntity.revokedAt && !rootEntity.deletedAt) {
        rootActions.appendChild(button(tr('重新定位原目录…', 'Relocate original folder…'), 'ouw-inline-action', function (event) {
          relocateRoot(page, rootEntity, event.currentTarget);
        }));
      }
      if (rootActions.childNodes.length) page.body.appendChild(rootActions);

      var projectSection = sectionBlock(tr('绑定项目', 'Bound projects'));
      projectSection.dataset.ouwRootBoundProjects = 'true';
      renderRelationPicker(projectSection, page, {
        label: tr('关联到项目', 'Bind to project'), predicate: 'project_binds_root',
        options: snapshot.projects || [], subject: function (item) { return { type: 'Project', id: String(item.id) }; },
        object: function () { return { type: 'RootBinding', id: String(rootEntity.id || page.ref.id) }; }, optionLabel: safeName,
        excludePredicates: ['project_binds_root']
      });
      page.body.appendChild(projectSection);

      var botSection = sectionBlock(tr('负责 BOT', 'Responsible BOTs'));
      renderRelationPicker(botSection, page, {
        label: tr('添加负责 BOT', 'Add responsible BOT'), predicate: 'bot_owns_root',
        options: snapshot.bots || [], subject: function (item) { return { type: 'BotInstanceRef', id: String(item.id) }; },
        object: function () { return { type: 'RootBinding', id: String(rootEntity.id || page.ref.id) }; }, optionLabel: safeName,
        excludePredicates: ['bot_owns_root']
      });
      page.body.appendChild(botSection);
      syncCentralRootTreeProjection(page);
    }

    function renderRunBody(page, detail) {
      var run = detail.entity;
      var evidence = run.modelEvidence && typeof run.modelEvidence === 'object' ? run.modelEvidence : {};
      var modelSection = sectionBlock(tr('模型与执行器证据', 'Model and executor evidence'));
      var modelRows = el('div', 'ouw-run-evidence');
      appendRunField(modelRows, tr('请求模型', 'Requested model'), evidence.requested || tr('未记录', 'Not recorded'));
      appendRunField(modelRows, tr('解析模型', 'Resolved model'), evidence.resolved || tr('未记录', 'Not recorded'));
      appendRunField(modelRows, tr('执行器报告', 'Executor-reported model'), evidence.reported || tr('执行器未报告', 'Executor did not report'));
      appendRunField(modelRows, tr('提供方', 'Provider'), evidence.providerId || tr('未记录', 'Not recorded'));
      appendRunField(modelRows, tr('证据类型', 'Evidence'), evidence.evidence && (evidence.evidence.kind || evidence.evidence.reason) || tr('未记录', 'Not recorded'));
      appendRunField(modelRows, tr('观察时间', 'Observed at'), evidence.observedAt ? new Date(evidence.observedAt).toLocaleString() : tr('未记录', 'Not recorded'));
      appendRunField(modelRows, tr('适配器', 'Adapter'), run.adapterId || tr('未记录', 'Not recorded'));
      appendRunField(modelRows, tr('执行主机', 'Execution host'), run.hostId || tr('未记录', 'Not recorded'));
      var capability = run.modelCapability && typeof run.modelCapability === 'object' ? run.modelCapability : null;
      appendRunField(modelRows, tr('上下文窗口', 'Context window'), capability
        ? (capability.contextWindowTokens ? capabilityValue(capability.contextWindowTokens) : tr('未知（字符回退）', 'Unknown (character fallback)'))
        : tr('历史未记录', 'Not recorded historically'));
      appendRunField(modelRows, tr('最大输出', 'Max output'), capability ? capabilityValue(capability.maxOutputTokens) : tr('历史未记录', 'Not recorded historically'));
      appendRunField(modelRows, tr('能力来源', 'Capability source'), capability ? capabilitySourceLabel(capability.source) : tr('历史未记录', 'Not recorded historically'));
      modelSection.appendChild(modelRows);
      if (run.capabilityDrift && run.capabilityDrift.previousDigest !== run.capabilityDrift.currentDigest) {
        modelSection.appendChild(el('div', 'ouw-run-capability', tr('模型能力元数据已变化：本轮采用当前可信值，旧运行记录保持不变。', 'Model capability metadata changed: this run uses the current trusted value; older run evidence is unchanged.')));
      }
      var budget = run.contextBudget && typeof run.contextBudget === 'object' ? run.contextBudget : null;
      var budgetLine = el('div', 'ouw-run-capability');
      budgetLine.setAttribute('data-ouw-run-budget', budget ? budget.mode || 'unknown' : 'historical');
      if (!budget) budgetLine.textContent = tr('上下文预算：历史未记录。', 'Context budget: not recorded historically.');
      else if (budget.mode === 'token') {
        budgetLine.textContent = tr(
          '上下文预算：' + capabilityValue(budget.contextWindowTokens) + ' 窗口 / ' + capabilityValue(budget.outputReserveTokens)
            + ' 输出预留 / 触发 ' + capabilityValue(budget.triggerTokens) + ' token · 本次估算 '
            + capabilityValue(budget.estimatedAfter) + ' token · ' + (budget.uncompressed === false
              ? '已折叠 ' + String(budget.compactedMessages || 0) + ' 条，保留 ' + String(budget.keptMessages || 0) + ' 条'
              : '未压缩') + '。估算不是计费用量。',
          'Context budget: ' + capabilityValue(budget.contextWindowTokens) + ' window / ' + capabilityValue(budget.outputReserveTokens)
            + ' output reserve / trigger ' + capabilityValue(budget.triggerTokens) + ' tokens · estimated '
            + capabilityValue(budget.estimatedAfter) + ' tokens · ' + (budget.uncompressed === false
              ? 'folded ' + String(budget.compactedMessages || 0) + ', kept ' + String(budget.keptMessages || 0)
              : 'not compacted') + '. Estimates are not billed usage.');
      } else {
        budgetLine.textContent = tr(
          '字符回退：模型窗口未知（' + String(budget.fallbackReason || '未知') + '）；阈值 ' + String(budget.thresholdChars || '未记录')
            + ' 字符 / 保留 ' + String(budget.keepMessages || '未记录') + ' 条 · ' + (budget.uncompressed === false
              ? '已折叠 ' + String(budget.compactedMessages || 0) + ' 条' : '未压缩') + '。',
          'Character fallback: model window unknown (' + String(budget.fallbackReason || 'unknown') + '); threshold '
            + String(budget.thresholdChars || 'not recorded') + ' chars / keep ' + String(budget.keepMessages || 'not recorded')
            + ' · ' + (budget.uncompressed === false ? 'folded ' + String(budget.compactedMessages || 0) : 'not compacted') + '.');
      }
      modelSection.appendChild(budgetLine);
      if (budget && budget.estimator && budget.estimator.version) {
        modelSection.appendChild(el('div', 'ouw-run-capability', tr('估算方法：openbot-heuristic/' + budget.estimator.version + '。',
          'Estimator: openbot-heuristic/' + budget.estimator.version + '.')));
      }
      if (run.status) modelSection.appendChild(el('div', 'ouw-run-capability', tr('运行状态：', 'Run status: ') + formatStatus(run.status)));
      var outputBlocked = ['missing', 'corrupt'].indexOf(String(run.outputStatus || '').toLowerCase()) >= 0 ||
        !!run.outputError || run.returnStatus === 'blocked_missing_output';
      if (run.outputStatus) modelSection.appendChild(el('div', outputBlocked ? 'ouw-run-return-error' : 'ouw-run-capability', tr('输出正文状态：', 'Output body status: ') + formatStatus(run.outputStatus)));
      if (outputBlocked) {
        modelSection.appendChild(el('div', 'ouw-run-return-error', tr('已有完成记录，但输出正文缺失或损坏。请先恢复归档并核对原始记录；不会重跑模型。', 'Execution is recorded as complete, but its output body is missing or corrupt. Restore and inspect the archive first; the model will not be rerun.')));
      }
      if (run.outputError) modelSection.appendChild(el('div', 'ouw-run-return-error', String(run.outputError.message || run.outputError.code || run.outputError)));
      var nativeSession = run.nativeSessionId
        ? tr('原生会话 ID：', 'Native session ID: ') + String(run.nativeSessionId)
        : tr('原生会话 ID 未记录。', 'Native session ID was not recorded.');
      modelSection.appendChild(el('div', 'ouw-run-capability', nativeSession));
      var canResume = run.capabilities && run.capabilities.resume && run.capabilities.resume.available === true;
      var resumeEvidence = run.capabilities && run.capabilities.resume && run.capabilities.resume.observed && run.capabilities.resume.observed.evidence;
      modelSection.appendChild(el('div', 'ouw-run-capability', canResume
        ? tr('执行器报告支持恢复，但此界面没有恢复操作。', 'The executor reports resume support, but this interface has no resume action.')
        : tr('无法恢复：执行器未提供可用的恢复能力。', 'Resume unavailable: the executor did not provide a usable resume capability.') + (resumeEvidence ? ' ' + String(resumeEvidence) : '')));
      page.body.appendChild(modelSection);

      if (run.outcomeUnknown === true || (run.status === 'needs_review' && run.outcomeUnknown !== false)) {
        var unknownSection = sectionBlock(tr('结果未知', 'Unknown outcome'));
        unknownSection.dataset.ouwUnknownRun = String(run.id);
        unknownSection.appendChild(el('div', 'ouw-run-return-error', tr(
          '上一轮执行结果未知。确认仅把该记录标记为失败并允许继续，不会重放原任务、分叉或删除原生会话。',
          'The previous outcome is unknown. Confirming only marks this record as failed so work can continue; it does not replay, fork, or delete the native session.')));
        var resolveUnknown = button(tr('确认未知并允许继续', 'Confirm unknown and allow continuing'), 'ouw-primary-action', function (event) {
          runCommand('resolveUnknownRun', { runId: String(run.id), threadId: String(run.threadId || '') }, function () {
            loadDetail(page);
          }, null, event.currentTarget);
        });
        resolveUnknown.dataset.ouwResolveUnknownRun = String(run.id);
        unknownSection.appendChild(resolveUnknown);
        page.body.appendChild(unknownSection);
      }
      var recovery = run.contextRecovery && run.contextRecovery.reason === 'CONTEXT_WINDOW_EXCEEDED'
        ? run.contextRecovery : null;
      if (recovery) {
        var terminalRecovery = recovery.terminal === true;
        var recoverySection = sectionBlock(tr('上下文恢复', 'Context recovery'));
        recoverySection.classList.add('ouw-run-recovery');
        recoverySection.setAttribute('data-ouw-run-recovery', terminalRecovery ? 'terminal' : 'unknown');
        recoverySection.setAttribute('data-ouw-run-recovery-detached', recovery.detached === true ? 'true' : 'false');
        if (recovery.previousNativeSessionId) {
          recoverySection.setAttribute('data-ouw-run-recovery-native-id', String(recovery.previousNativeSessionId));
        }
        recoverySection.setAttribute('data-ouw-run-recovery-next', String(recovery.nextSessionMode || 'unknown'));
        recoverySection.appendChild(el('div', 'ouw-run-recovery-title', terminalRecovery
          ? tr('上下文超限：本轮未重放。', 'Context limit exceeded: this turn was not replayed.')
          : tr('上下文可能超限：结果未确认，本轮未重放。', 'Possible context limit: the outcome is unconfirmed and this turn was not replayed.')));
        recoverySection.appendChild(el('div', 'ouw-run-recovery-reason',
          tr('原因：', 'Reason: ') + String(recovery.reason || 'CONTEXT_WINDOW_EXCEEDED')
            + ' · ' + tr('原始码：', 'Raw code: ') + String(recovery.rawCode || tr('未记录', 'not recorded'))
            + ' · ' + tr('匹配方式：', 'Matched by: ') + String(recovery.matchedBy || tr('未记录', 'not recorded'))));
        if (recovery.rawMessageExcerpt) {
          recoverySection.appendChild(el('div', 'ouw-run-recovery-excerpt',
            tr('脱敏诊断：', 'Redacted diagnostic: ') + String(recovery.rawMessageExcerpt)));
        }
        var detachmentText;
        if (recovery.persistence === 'failed') {
          detachmentText = tr('接续失效未能确认写入磁盘；不要直接重试或假定已切换到新原生上下文。',
            'The continuation invalidation was not confirmed on disk. Do not retry directly or assume a new native context is active.');
        } else if (recovery.detached === true) {
          detachmentText = tr('已关闭 Bot Studio 对旧原生上下文的接续；下一轮将使用新的原生上下文。旧线程或对话不会被删除。',
            'Bot Studio has closed continuation to the old native context; the next turn will use a new native context. The old thread or conversation is not deleted.');
        } else if (String(recovery.transport) === 'cli') {
          detachmentText = tr('一次性 CLI 没有持久原生接续；请核对预算后手动重试。',
            'A one-shot CLI has no persistent native continuation. Review the budget and retry manually.');
        } else {
          detachmentText = tr('未改变原生接续；先核对本轮记录，确认后再手动继续。',
            'The native continuation was not changed. Inspect this turn first, then continue manually.');
        }
        recoverySection.appendChild(el('div', 'ouw-run-recovery-detachment', detachmentText));
        if (recovery.previousNativeSessionId) {
          recoverySection.appendChild(el('div', 'ouw-run-recovery-native',
            tr('旧原生标识：', 'Previous native ID: ') + String(recovery.previousNativeSessionId)
              + tr('（仅作审计，不表示已删除或接管旧线程）', ' (audit only; it does not mean the old thread was deleted or taken over)')));
        }
        recoverySection.appendChild(el('div', 'ouw-run-recovery-next',
          tr('下一步：打开原会话手动继续或重试；系统不会自动重放。Bot Studio 不据此声称提供方的账单状态，请以提供方回执为准。',
            'Next: open the original thread to continue or retry manually; the system will not replay automatically. Bot Studio does not claim the provider billing state; use the provider receipt as authority.')));
        if (run.threadId) {
          var recoveryAction = button(String(recovery.transport) === 'cli'
            ? tr('打开会话并手动重试', 'Open thread to retry manually')
            : tr('打开会话并手动继续', 'Open thread to continue manually'),
          'ouw-inline-action ouw-run-recovery-action', function () {
            openEntity({ type: 'Thread', id: String(run.threadId) });
          });
          recoverySection.appendChild(recoveryAction);
        }
        page.body.appendChild(recoverySection);
      }

      var links = sectionBlock(tr('相关对象', 'Related objects'));
      var runLinks = el('div', 'ouw-run-links');
      appendRunLink(runLinks, tr('会话', 'Thread'), run.threadId && { type: 'Thread', id: run.threadId });
      appendRunLink(runLinks, tr('任务', 'Task'), normalizeRef(run.taskRef));
      appendRunLink(runLinks, tr('BOT', 'BOT'), normalizeRef(run.executorBotRef));
      appendRunLink(runLinks, tr('配置目录', 'Configured folder'), run.rootId && { type: 'RootBinding', id: run.rootId });
      if (runLinks.childNodes.length) links.appendChild(runLinks);
      else links.appendChild(el('div', 'ouw-subtle-empty', tr('未记录相关对象。', 'Related objects were not recorded.')));
      page.body.appendChild(links);

      var fileSection = sectionBlock(tr('文件访问证据', 'File access evidence'));
      var actualFileRelations = (detail.relations || []).filter(function (relation) {
        return !relation.endedAt && (relation.predicate === 'run_reads_file' || relation.predicate === 'run_modifies_file');
      });
      if (!actualFileRelations.length) {
        fileSection.appendChild(el('div', 'ouw-run-capability', tr('配置目录不等于实际读取或修改记录；当前没有实际文件访问回执，读写情况未知。', 'A configured folder does not prove a file was read or modified. No actual file-access receipt is recorded, so reads and writes are unknown.')));
      } else {
        actualFileRelations.forEach(function (relation) {
          var target = relation.objectRef;
          var actionLabel = relation.predicate === 'run_reads_file' ? tr('实际读取', 'Actually read') : tr('实际修改', 'Actually modified');
          if (target && target.type && target.id) fileSection.appendChild(button(actionLabel + ' · ' + (relation.objectLabel || target.id), 'ouw-related-row', function () { openEntity(target); }));
        });
      }
      page.body.appendChild(fileSection);

      if (run.returnStatus) {
        var returnSection = sectionBlock(tr('结果回传', 'Result return'));
        returnSection.appendChild(el('span', 'ouw-status-pill', formatStatus(run.returnStatus)));
        if (run.returnError) {
          var errorText = [run.returnError.code, run.returnError.message].filter(Boolean).join(' · ');
          if (errorText) returnSection.appendChild(el('div', 'ouw-run-return-error', errorText));
        }
        if (run.returnStatus === 'needs_repair') {
          var repairButton = button(tr('修复结果回传', 'Repair result return'), 'ouw-primary-action', function (event) {
            runCommand('repairReturn', { runId: String(run.id) }, function () { loadDetail(page); }, null, event.currentTarget);
          });
          repairButton.disabled = outputBlocked;
          if (outputBlocked) repairButton.title = tr('输出正文缺失或损坏；先恢复归档。', 'Output body is missing or corrupt; restore the archive first.');
          returnSection.appendChild(repairButton);
          if (outputBlocked) returnSection.appendChild(el('div', 'ouw-run-return-error', tr('结果回传已禁用，直到原输出正文恢复并验证。', 'Result return is disabled until the original output body is restored and verified.')));
        }
        page.body.appendChild(returnSection);
      }
    }

    function appendRunField(container, label, value) {
      var fieldNode = el('span', 'ouw-run-field');
      var labelNode = el('strong', '', label + ': ');
      fieldNode.appendChild(labelNode);
      fieldNode.appendChild(document.createTextNode(String(value)));
      container.appendChild(fieldNode);
    }

    function appendRunLink(container, label, ref) {
      ref = normalizeRef(ref);
      if (!ref) return;
      var buttonLabel = label + ' · ' + ref.id;
      var link = button(buttonLabel, 'ouw-inline-action', function () { openEntity(ref); });
      link.setAttribute('aria-label', tr('打开 ' + label + ' ' + ref.id, 'Open ' + label + ' ' + ref.id));
      container.appendChild(link);
    }

    function relocateRoot(page, rootEntity, actionNode) {
      var rootId = String(rootEntity.id || page.ref.id);
      var pending = relocateOperations.get(rootId);
      if (pending && pending.uncertain) {
        setCommandStatus(tr('上次重新定位回执未知，已先重新读取目录状态；请检查路径和定位修订。', 'The previous relocation receipt is unknown. Folder state was read first; check its path and locator revision.'), 'error');
        loadDetail(page).then(function () {
          var current = page.detail && page.detail.entity;
          if (current && Number(current.locatorRevision || 0) > Number(pending.locatorRevision || 0)) {
            relocateOperations.delete(rootId);
            setCommandStatus(tr('已读取到新的目录定位。', 'The refreshed folder location shows a new locator revision.'), 'muted');
          }
        });
        return Promise.resolve(false);
      }
      if (!bridge || typeof bridge.unifiedWorkspaceRelocateRoot !== 'function') {
        setCommandStatus(tr('目录重新定位服务尚不可用。', 'Folder relocation is not available yet.'), 'error');
        return Promise.resolve(false);
      }
      var currentScope = getCurrentScope();
      if (!currentScope) return Promise.resolve(false);
      var operation = pending || { operationId: makeOperationId(), locatorRevision: rootEntity.locatorRevision || 0, uncertain: false };
      relocateOperations.set(rootId, operation);
      actionNode.disabled = true;
      setCommandStatus(tr('请选择同一个原目录。', 'Choose the same original folder.'), 'muted');
      return Promise.resolve(bridge.unifiedWorkspaceRelocateRoot({
        spaceId: currentScope.spaceId, scopeRevision: currentScope.scopeRevision,
        rootId: rootId, operationId: operation.operationId
      })).then(function (result) {
        if (!sameScope(currentScope, getCurrentScope())) return false;
        if (result && result.canceled === true) {
          relocateOperations.delete(rootId);
          if (actionNode.isConnected) actionNode.disabled = false;
          setCommandStatus('', '');
          return false;
        }
        if (!validResponse(result, currentScope) || !result.entity || String(result.entity.id) !== rootId) {
          throw commandError(result, tr('目录没有重新定位。', 'The folder was not relocated.'));
        }
        relocateOperations.delete(rootId);
        setCommandStatus(tr('已验证并重新定位同一个原目录。', 'The original folder identity was verified and relocated.'), 'muted');
        return refresh().then(function () { if (currentPageKey === page.key) return loadDetail(page); });
      }).catch(function (error) {
        if (!sameScope(currentScope, getCurrentScope())) return false;
        if (isUnknownOutcome(error)) {
          operation.uncertain = true;
          setCommandStatus(tr('重新定位回执未知，正在重新读取目录状态；请勿重复提交。', 'The relocation receipt is unknown. Reading folder state; do not submit again.'), 'error');
          return loadDetail(page).then(function () {
            var current = page.detail && page.detail.entity;
            if (current && Number(current.locatorRevision || 0) > Number(operation.locatorRevision || 0)) {
              relocateOperations.delete(rootId);
              setCommandStatus(tr('已读取到新的目录定位。', 'The refreshed folder location shows a new locator revision.'), 'muted');
            }
            return false;
          });
        }
        relocateOperations.delete(rootId);
        if (actionNode.isConnected) actionNode.disabled = false;
        setCommandStatus(messageForError(error, tr('无法重新定位目录。', 'Unable to relocate this folder.')), 'error');
        return false;
      });
    }

    var receiptDomainLabels = {
      authorization: ['授权', 'Authorization'],
      context: ['上下文', 'Context'],
      runs: ['运行', 'Runs'],
      file_reads: ['文件读取', 'File reads'],
      file_writes: ['文件修改', 'File writes'],
      approvals: ['审批', 'Approvals'],
      proposals: ['提案', 'Proposals'],
      external_effects: ['外部副作用', 'External effects'],
      network: ['网络', 'Network'],
      process: ['进程', 'Process'],
      credentials: ['凭据', 'Credentials'],
      delegation: ['委派', 'Delegation'],
      external_api: ['外部 API', 'External API']
    };
    var receiptCoverageLabels = {
      observed: ['已记录', 'Recorded'],
      partial: ['部分记录', 'Partially recorded'],
      missing: ['缺失', 'Missing'],
      unknown: ['未知', 'Unknown'],
      not_applicable: ['不适用', 'Not applicable']
    };
    var receiptOverallLabels = {
      observed: ['已记录', 'Recorded'],
      partial: ['部分记录', 'Partially recorded'],
      missing: ['缺少完成记录', 'Missing completion evidence'],
      unknown: ['无法核对', 'Unverifiable'],
      not_applicable: ['尚未执行', 'No execution yet']
    };

    function receiptLabel(entry, fallback) {
      return entry ? tr(entry[0], entry[1]) : String(fallback || '');
    }

    function receiptOverallLabel(value) {
      return receiptLabel(receiptOverallLabels[String(value || '')], value || 'unknown');
    }

    function receiptState(page) {
      if (!page.receipt) page.receipt = { expanded: false, busy: false, uncertain: false, operationId: '', fingerprint: '', error: '', notice: '' };
      return page.receipt;
    }

    function receiptShortDigest(value) {
      return value ? String(value).slice(0, 12) : tr('无', 'none');
    }

    function receiptSummaryLabel(receipt) {
      var state = String(receipt && receipt.state || 'unsealed');
      if (state === 'sealed') return tr('已封存 · ', 'Sealed · ') + receiptOverallLabel(receipt.sealed && receipt.sealed.overallCoverage);
      if (state === 'stale') return tr('需重新封存', 'Reseal needed');
      if (state === 'mismatch') return tr('摘要不一致', 'Digest mismatch');
      return tr('尚未封存', 'Not sealed');
    }

    function receiptCountItem(zh, en, count, coverageValue) {
      var coverage = String(coverageValue || 'unknown');
      if (coverage === 'observed' || coverage === 'partial') return tr(zh + ' ' + count, en + ' ' + count);
      return tr(zh + ' ' + receiptLabel(receiptCoverageLabels[coverage], coverage),
        en + ' ' + receiptLabel(receiptCoverageLabels[coverage], coverage));
    }

    function receiptCountsLine(counts, coverage) {
      if (!counts) return '';
      var observed = coverage || {};
      return [
        receiptCountItem('运行', 'Runs', counts.runs, observed.runs),
        receiptCountItem('上下文', 'Context', counts.contextSnapshots, observed.context),
        receiptCountItem('读取', 'Reads', counts.fileReads, observed.file_reads),
        receiptCountItem('修改', 'Writes', counts.fileWrites, observed.file_writes),
        receiptCountItem('审批', 'Approvals', counts.approvals, observed.approvals),
        tr('已记录完成事件 ' + counts.completions + ' 条', counts.completions + ' recorded completion events')
      ].join(' · ');
    }

    function receiptCoverageChips(coverage) {
      var wrap = el('div', 'ouw-receipt-coverage');
      Object.keys(receiptDomainLabels).forEach(function (domain) {
        var value = coverage && coverage[domain];
        if (!value) return;
        var chip = el('span', 'ouw-receipt-chip', receiptLabel(receiptDomainLabels[domain]) + ': ' + receiptLabel(receiptCoverageLabels[value], value));
        chip.dataset.coverage = String(value);
        wrap.appendChild(chip);
      });
      return wrap;
    }

    function receiptUnknownList(entries) {
      var wrap = el('div', 'ouw-receipt-unknown');
      wrap.appendChild(el('strong', 'ouw-receipt-subheading', tr('未知域', 'Unknown domains')));
      if (!entries || !entries.length) { wrap.appendChild(el('span', 'ouw-receipt-muted', tr('无', 'None'))); return wrap; }
      entries.forEach(function (entry) {
        var domain = entry && receiptDomainLabels[entry.domain] || [entry && entry.domain || 'unknown', entry && entry.domain || 'unknown'];
        wrap.appendChild(el('span', 'ouw-receipt-chip', receiptLabel(domain) + ': ' + String(entry && entry.reason || '')));
      });
      return wrap;
    }

    function receiptRuns(groups) {
      var wrap = el('div', 'ouw-receipt-runs');
      if (!groups || !groups.length) { wrap.appendChild(el('div', 'ouw-receipt-muted', tr('尚无运行记录。', 'No run groups yet.'))); return wrap; }
      groups.forEach(function (group) {
        var row = el('div', 'ouw-receipt-run');
        var head = el('div', 'ouw-receipt-run-head');
        head.appendChild(el('strong', 'ouw-receipt-run-id', tr('运行 ', 'Run ') + String(group.runRef && group.runRef.id || '').slice(0, 16)));
        head.appendChild(el('span', 'ouw-status-pill', formatStatus(group.status || 'unknown')));
        if (group.outcomeUnknown) head.appendChild(el('span', 'ouw-receipt-chip', tr('结果未知', 'Outcome unknown')));
        row.appendChild(head);
        var observed = group.coverage || {};
        row.appendChild(el('div', 'ouw-receipt-run-counts', [
          receiptCountItem('上下文', 'Context', group.contextSnapshots.length, observed.context),
          receiptCountItem('读取', 'Reads', group.fileReads.length, observed.file_reads),
          receiptCountItem('修改', 'Writes', group.fileWrites.length, observed.file_writes),
          receiptCountItem('审批', 'Approvals', group.approvals.length, observed.approvals),
          tr('已记录完成 ' + group.completions.length, group.completions.length + ' recorded completions')
        ].join(' · ')));
        var truncated = group.truncated && Object.keys(group.truncated).some(function (key) { return group.truncated[key]; });
        if (truncated) row.appendChild(el('div', 'ouw-receipt-muted', tr('显示已截断；摘要仍按完整证据计算。', 'Display is truncated; the digest still covers the full evidence set.')));
        wrap.appendChild(row);
      });
      return wrap;
    }

    function renderTaskReceipt(page, task, detail) {
      var receipt = detail && detail.taskReceipt;
      if (!receipt || !receipt.current) return;
      var state = receiptState(page), current = receipt.current, sealed = receipt.sealed;
      var strip = el('div', 'ouw-receipt-strip');
      strip.dataset.ouwReceiptState = String(receipt.state || 'unsealed');
      strip.dataset.ouwReceiptTask = String(task.id);
      var panelId = 'ouw-receipt-panel-' + String(task.id).replace(/[^A-Za-z0-9_-]/g, '_');
      var toggle = button('', 'ouw-receipt-toggle', function () {
        state.expanded = !state.expanded;
        state.notice = '';
        renderPage(page);
      });
      toggle.dataset.ouwReceiptFocus = 'toggle';
      toggle.setAttribute('aria-expanded', String(state.expanded));
      toggle.setAttribute('aria-controls', panelId);
      var toolbar = el('span', 'ouw-receipt-toolbar');
      toolbar.appendChild(el('span', 'ouw-receipt-kicker', tr('任务回执', 'Task receipt')));
      var badge = el('span', 'ouw-receipt-badge', receiptSummaryLabel(receipt));
      badge.dataset.state = String(receipt.state || 'unsealed');
      toolbar.appendChild(badge);
      toolbar.appendChild(el('span', 'ouw-receipt-overview', tr(
        current.counts.runs + ' 次运行 · ' + current.unknownDomains.length + ' 个未知域',
        current.counts.runs + (current.counts.runs === 1 ? ' run' : ' runs') + ' · ' + current.unknownDomains.length + ' unknown')));
      toggle.appendChild(toolbar);
      toggle.appendChild(el('span', 'ouw-receipt-chevron', state.expanded ? '▾' : '▸'));
      strip.appendChild(toggle);
      page.body.appendChild(strip);

      var panel = el('div', 'ouw-receipt-panel');
      panel.id = panelId;
      panel.hidden = !state.expanded;
      if (state.error) {
        var alert = el('div', 'ouw-receipt-alert', state.error);
        alert.setAttribute('role', 'alert');
        panel.appendChild(alert);
      } else if (state.notice) panel.appendChild(el('div', 'ouw-receipt-notice', state.notice));

      if (sealed) {
        var sealedBlock = el('section', 'ouw-receipt-block');
        sealedBlock.dataset.ouwReceiptBlock = 'sealed';
        sealedBlock.appendChild(el('h3', 'ouw-receipt-heading', tr('已封存回执', 'Sealed receipt')));
        var meta = el('div', 'ouw-receipt-meta');
        meta.appendChild(el('span', '', tr('回执 ', 'Receipt ') + receiptShortDigest(sealed.receiptId)));
        meta.appendChild(el('span', '', tr('触发 ', 'Trigger ') + String(sealed.trigger || '')));
        meta.appendChild(el('span', '', tr('封存时间 ', 'Sealed at ') + String(sealed.sealedAt || '')));
        meta.appendChild(el('span', '', tr('整体 ', 'Overall ') + receiptOverallLabel(sealed.overallCoverage)));
        meta.appendChild(el('span', '', tr('授权引用 ', 'Authorization ') +
          (sealed.authorizationRef ? String(sealed.authorizationRef.id || '') : tr('无（v0 无 typed 授权）', 'none (no typed grant in v0)'))));
        sealedBlock.appendChild(meta);
        sealedBlock.appendChild(el('div', 'ouw-receipt-counts', receiptCountsLine(sealed.counts, sealed.coverage)));
        sealedBlock.appendChild(receiptCoverageChips(sealed.coverage));
        sealedBlock.appendChild(receiptUnknownList(sealed.unknownDomains));
        panel.appendChild(sealedBlock);
      }

      var currentBlock = el('section', 'ouw-receipt-block');
      currentBlock.dataset.ouwReceiptBlock = 'current';
      currentBlock.appendChild(el('h3', 'ouw-receipt-heading', receipt.state === 'sealed' ? tr('当前证据', 'Current evidence') : tr('当前证据（尚未封存）', 'Current evidence (not sealed)')));
      if (receipt.state === 'stale' || receipt.state === 'mismatch') {
        var warning = el('div', 'ouw-receipt-warning', receipt.state === 'stale'
          ? tr('当前证据与封存时不同；以下内容尚未封存。', 'Current evidence differs from the sealed receipt; the content below is not sealed.')
          : tr('同一证据集得到不同投影摘要；请核查。', 'The same evidence set produced a different projection digest; inspect it.'));
        warning.setAttribute('role', 'status');
        currentBlock.appendChild(warning);
      }
      currentBlock.appendChild(el('div', 'ouw-receipt-counts', receiptCountsLine(current.counts, current.coverage)));
      currentBlock.appendChild(receiptCoverageChips(current.coverage));
      currentBlock.appendChild(receiptUnknownList(current.unknownDomains));
      currentBlock.appendChild(receiptRuns(current.runs));
      var limits = current.limits || {};
      var truncatedRuns = !!(limits.truncated && limits.truncated.runs);
      currentBlock.appendChild(el('div', 'ouw-receipt-muted', tr(
        '显示上限：运行 ' + limits.maxRuns + ' / 每运行关系 ' + limits.maxRelationsPerRun + ' / 活动 ' + limits.maxActivities + (truncatedRuns ? '（已截断）' : ''),
        'Display limits: ' + limits.maxRuns + ' runs / ' + limits.maxRelationsPerRun + ' relations per run / ' + limits.maxActivities + ' activities' + (truncatedRuns ? ' (truncated)' : ''))));
      panel.appendChild(currentBlock);

      var actions = el('div', 'ouw-receipt-actions');
      var reseal = button(state.uncertain ? tr('重新读取状态', 'Reload state') : tr('重新封存', 'Seal receipt'), 'ouw-primary-action ouw-receipt-reseal', function () {
        if (state.uncertain) reloadReceiptAfterUnknown(page);
        else sealTaskReceipt(page, task, receipt);
      });
      reseal.dataset.ouwReceiptFocus = 'reseal';
      reseal.disabled = state.busy;
      reseal.title = tr('使用当前证据集摘要封存；结果以重新读取的任务详情为准。', 'Seal with the current evidence digest; the reloaded task detail decides the result.');
      actions.appendChild(reseal);
      actions.appendChild(el('span', 'ouw-receipt-muted', state.busy ? tr('正在提交…', 'Submitting…') : tr('封存不会改变任务状态。', 'Sealing does not change the task status.')));
      panel.appendChild(actions);
      strip.appendChild(panel);
    }

    function reloadReceiptAfterUnknown(page) {
      var state = receiptState(page);
      if (state.busy) return;
      state.busy = true; renderPage(page);
      return loadDetail(page).then(function () {
        state.busy = false;
        if (page.error) {
          state.error = tr('未能读取当前证据；请稍后重试。', 'Could not read the current evidence; try again later.');
        } else {
          state.uncertain = false;
          state.error = '';
          state.notice = tr('已重新读取当前证据；请核对后再封存。', 'Current evidence reloaded; inspect it before sealing.');
        }
        renderPage(page);
      });
    }

    function sealTaskReceipt(page, task, receipt) {
      var state = receiptState(page);
      if (state.busy) return;
      var scope = getCurrentScope();
      if (!scope) return;
      var expected = String(receipt && receipt.current && receipt.current.watermark && receipt.current.watermark.evidenceSetDigest || '');
      if (!/^[a-f0-9]{64}$/.test(expected)) {
        state.error = tr('当前证据摘要不可用；请重新读取任务详情后再封存。', 'The current evidence digest is unavailable; reload the task before sealing.');
        renderPage(page); return;
      }
      if (!bridge || typeof bridge.unifiedWorkspaceCommand !== 'function') {
        state.error = tr('工作空间操作服务尚不可用。', 'Workspace actions are not available yet.');
        renderPage(page); return;
      }
      var fingerprint = 'sealTaskReceipt\n' + stablePayload({ taskId: String(task.id), expectedEvidenceSetDigest: expected });
      if (state.fingerprint !== fingerprint) { state.fingerprint = fingerprint; state.operationId = makeOperationId(); }
      if (!state.operationId) state.operationId = makeOperationId();
      state.busy = true; state.error = ''; state.notice = '';
      renderPage(page);
      var request = { spaceId: scope.spaceId, scopeRevision: scope.scopeRevision, operationId: state.operationId,
        action: 'sealTaskReceipt', taskId: String(task.id), expectedEvidenceSetDigest: expected };
      return Promise.resolve(bridge.unifiedWorkspaceCommand(request)).then(function (result) {
        if (!sameScope(scope, getCurrentScope())) { state.busy = false; return; }
        if (!result || result.ok !== true) throw commandError(result, tr('封存未能完成。', 'Sealing did not complete.'));
        if (String(result.spaceId) !== String(scope.spaceId) || String(result.scopeRevision) !== String(scope.scopeRevision)) {
          throw Object.assign(new Error(tr('封存回执范围不匹配。', 'The seal receipt scope did not match.')), { unknownOutcome: true });
        }
        state.busy = false; state.operationId = ''; state.fingerprint = '';
        state.notice = tr('封存请求已被接受；正在重新读取任务回执。', 'Seal request accepted; reloading the task receipt.');
        // The command response never proves `sealed`; the reloaded detail does.
        return loadDetail(page);
      }).catch(function (error) {
        if (!sameScope(scope, getCurrentScope())) { state.busy = false; return; }
        state.busy = false;
        var code = String(error && error.code || '');
        if (isUnknownOutcome(error) || /UNKNOWN_OUTCOME|OUTCOME_UNKNOWN|(?:COMMIT_)?UNCERTAIN/.test(code)) {
          state.uncertain = true;
          state.error = tr('封存回执未知，正在读取当前状态；请勿重复提交。', 'The seal receipt is unknown. Reading current state; do not submit again.');
          renderPage(page);
          return loadDetail(page);
        }
        state.operationId = '';
        var knownMessage = messageForError(error, tr('封存未能完成。', 'Sealing did not complete.'));
        if (code === 'UW_RECEIPT_STALE' || code === 'UW_RECEIPT_CONFLICT') {
          state.busy = true;
          return loadDetail(page).then(function () {
            state.busy = false;
            state.error = page.error ? tr('未能读取当前证据；请稍后重试。', 'Could not read the current evidence; try again later.') : knownMessage;
            if (!page.error) state.notice = tr('已重新读取任务回执；请核对后再决定。', 'The task receipt was reloaded; inspect it before deciding.');
            renderPage(page);
          });
        }
        state.error = knownMessage;
        renderPage(page);
      });
    }

    function renderTaskBody(page, detail) {
      var task = detail.entity;
      renderTaskReceipt(page, task, detail);
      var threads = Array.isArray(detail.threads) ? detail.threads : [];
      var writableThreads = threads.filter(function (thread) { return thread.messageSourceRef && thread.messageSourceRef.sourceType === 'unified-thread'; });
      var section = sectionBlock(tr('会话', 'Threads'));
      if (!threads.length) section.appendChild(el('div', 'ouw-subtle-empty', tr('尚无关联会话。开始任务时会创建并关联一个新会话。', 'No thread is linked yet. Starting this task will create and link a thread.')));
      threads.forEach(function (thread) { section.appendChild(entityCreatorRow(safeName(thread), { type: 'Thread', id: thread.id }, thread.creator)); });
      page.body.appendChild(section);
      var actions = el('div', 'ouw-task-actions');
      actions.appendChild(button(tr('编辑任务', 'Edit task'), 'ouw-inline-action', function () { openEditTaskForm(task); }));
      var activeRun = (detail.runs || []).find(threadWorkbenchActive);
      if (activeRun) actions.appendChild(button(tr('停止运行', 'Stop run'), 'ouw-danger-action', function (event) { cancelRun(activeRun, event.currentTarget); }));
      actions.appendChild(button(tr('委派…', 'Delegate…'), 'ouw-inline-action', function () { openDelegateForm(task); }));
      page.body.appendChild(actions);
      attachComposer(page, writableThreads[0] && writableThreads[0].id || '');
    }

    function rememberThreadFocus(page) {
      if (page.ref.type !== 'Thread') return;
      var active = document.activeElement;
      if (active && active.dataset && active.dataset.uwThreadFocus && page.body.contains(active)) {
        page.threadFocus = { key: active.dataset.uwThreadFocus, node: active };
      } else if (active && active !== document.body && active.isConnected) page.threadFocus = null;
    }

    function rememberReceiptFocus(page) {
      if (page.ref.type !== 'WorkTask' || !page.receipt) return;
      var active = document.activeElement;
      if (active && active.dataset && active.dataset.ouwReceiptFocus && page.body.contains(active)) {
        page.receiptFocus = { key: active.dataset.ouwReceiptFocus, node: active };
      } else if (active && active !== document.body && active.isConnected) page.receiptFocus = null;
    }

    function restoreThreadFocus(page) {
      var saved = page.threadFocus, active = document.activeElement;
      if (!saved || currentPageKey !== page.key) return;
      page.threadFocus = null;
      if (active && active !== document.body && active !== saved.node && active.isConnected) return;
      var target = Array.from(page.body.querySelectorAll('[data-uw-thread-focus]')).find(function (node) { return node.dataset.uwThreadFocus === saved.key; });
      if (target && !target.disabled) target.focus({ preventScroll: true });
    }

    function restoreReceiptFocus(page) {
      var saved = page.receiptFocus, active = document.activeElement;
      if (!saved || currentPageKey !== page.key || page.ref.type !== 'WorkTask') return;
      if (active && active !== document.body && active !== saved.node && active.isConnected) { page.receiptFocus = null; return; }
      var target = Array.from(page.body.querySelectorAll('[data-ouw-receipt-focus]')).find(function (node) { return node.dataset.ouwReceiptFocus === saved.key; });
      if (!target) { page.receiptFocus = null; return; }
      if (target.disabled || target.hidden) return;
      page.receiptFocus = null;
      target.focus({ preventScroll: true });
    }

    function threadCompletionKey(taskId, currentScope) {
      return JSON.stringify([currentScope.spaceId, String(taskId)]);
    }

    function threadCompletionState(taskId, currentScope) {
      var key = threadCompletionKey(taskId, currentScope), state = threadCompletions.get(key);
      if (!state) {
        state = { phase: 'idle', runId: '', error: '', ticket: 0, commandTarget: { disabled: false } };
        threadCompletions.set(key, state);
      }
      return state;
    }

    function threadWorkbenchTask(thread, page) {
      var taskId = String(thread.primaryTaskId || thread.taskId || '');
      var task = page && page.threadTaskDetail && page.threadTaskDetail.entity;
      return task && String(task.id) === taskId ? task : null;
    }

    function renderThreadWorkbench(page, detail) {
      var thread = detail.entity, task = threadWorkbenchTask(thread, page), runs = detail.runs || [];
      if (task) {
        var taskSection = el('section', 'uw-thread-task');
        taskSection.appendChild(el('h3', 'uw-thread-task-goal', task.goal));
        taskSection.appendChild(el('span', 'uw-thread-task-status', formatStatus(task.status)));
        var owner = (snapshot && snapshot.bots || []).find(function (bot) { return task.ownerBotRef && String(bot.id) === String(task.ownerBotRef.id); });
        if (owner) {
          var ownerLink = button(tr('负责人：', 'Owner: ') + safeName(owner), 'ouw-inline-action uw-thread-task-owner', function () { openEntity({ type: 'BotInstanceRef', id: String(owner.id) }); });
          taskSection.appendChild(ownerLink);
        }
        if (task.acceptanceCriteria) {
          taskSection.appendChild(el('strong', 'uw-thread-task-criteria-label', tr('验收要求', 'Acceptance criteria')));
          taskSection.appendChild(el('p', 'uw-thread-task-criteria', task.acceptanceCriteria));
        }
        page.body.appendChild(taskSection);
      }
      var sessionSummary = sessionSummaryFor(thread);
      var attention = Array.isArray(sessionSummary && sessionSummary.attention) ? sessionSummary.attention : [];
      var userAttention = attention.filter(function (item) { return item && item.requiresUser === true; });
      if (userAttention.length) {
        var attentionSection = el('details', 'uw-session-attention');
        var attentionSummary = document.createElement('summary'); attentionSummary.className = 'uw-session-attention-summary';
        attentionSummary.appendChild(el('span', 'uw-session-attention-heading', tr('需我处理', 'Needs your attention')));
        attentionSummary.appendChild(el('span', 'uw-session-attention-count', tr(userAttention.length + ' 项', userAttention.length + (userAttention.length === 1 ? ' item' : ' items'))));
        attentionSection.appendChild(attentionSummary);
        var attentionList = el('div', 'uw-session-attention-list');
        userAttention.forEach(function (item) {
          var row = el('div', 'uw-session-attention-row');
          var target = item.target && (item.target.ref && normalizeRef(item.target.ref) || normalizeRef(item.target));
          var targetText = '';
          if (target && target.type === 'WorkTask') {
            var attentionTask = (snapshot && snapshot.tasks || []).find(function (candidate) { return String(candidate.id || '') === target.id; });
            targetText = attentionTask && String(attentionTask.goal || attentionTask.title || '').trim() || target.id;
          } else if (target && target.type === 'Run') targetText = tr('执行记录 ', 'Run ') + target.id;
          var labelText = sessionStatusLabel(item.kind || sessionSummary.status) || tr('请核查当前状态', 'Review the current state');
          var attentionLabel = el('span', 'uw-session-attention-label', labelText + (targetText ? ' · ' + targetText : ''));
          if (targetText) attentionLabel.title = targetText;
          row.appendChild(attentionLabel);
          if (item.target) row.appendChild(button(tr('前往处理', 'Open action'), 'ouw-inline-action uw-session-attention-link', function () {
            navigateSessionTarget(item.target, { type: 'Thread', id: String(thread.id) });
          }));
          attentionList.appendChild(row);
        });
        attentionSection.appendChild(attentionList);
        page.body.appendChild(attentionSection);
      }
      attention.filter(function (item) { return item && item.kind === 'waiting' && item.requiresUser !== true; }).slice(0, 3).forEach(function (item) {
        var waitKind = String(item.waitKind || 'unknown');
        var waitLabel = waitKind === 'bot-message'
          ? tr('已登记在当前运行结束后续答。', 'A reply is registered for after the current run ends.')
          : waitKind === 'manual'
            ? tr('已登记手动续办。', 'A manual continuation is registered.')
            : tr('续办已登记，等待原因未知。', 'A continuation is registered; the reason is unknown.');
        page.body.appendChild(el('div', 'uw-session-wait-note', waitLabel));
      });
      if (page.threadTaskError) {
        var taskError = el('div', 'uw-thread-task-error', page.threadTaskError); taskError.setAttribute('role', 'alert'); page.body.appendChild(taskError);
      }
      var latest = threadWorkbenchLatestRun(runs);
      if (!latest) return;
      var output = threadWorkbenchOutput(latest, detail.messages), state = String(latest.status || '');
      var text = formatStatus(state);
      if (latest.outcomeUnknown || state === 'needs_review') { state = 'unknown'; text = tr('执行结果待核查，请查看执行详情。', 'The execution outcome needs inspection. Open execution details.'); }
      else if (latest.status === 'done' && !output) { state = latest.outputStatus === 'corrupt' ? 'corrupt' : 'missing'; text = tr('执行已结束，结果当前不能用于完成确认，请核查执行详情。', 'Execution ended. The result cannot currently be used to confirm task completion. Inspect execution details.'); }
      else if (latest.status === 'done') { state = task && task.status === 'completed' ? 'completed' : 'awaiting_review'; text = state === 'completed' ? tr('任务已记录完成', 'Task completion recorded') : tr('结果已返回，等待你核对', 'Result returned, ready for your review'); }
      else if (state === 'queued') text = tr('正在排队', 'Queued');
      var progress = el('div', 'uw-thread-progress');
      progress.dataset.state = state;
      progress.setAttribute('role', ['unknown', 'missing', 'corrupt', 'failed'].indexOf(state) >= 0 ? 'alert' : 'status');
      progress.appendChild(el('span', 'uw-thread-progress-label', text));
      if (latest.error) progress.appendChild(el('span', 'uw-thread-progress-error', String(latest.error.message || latest.error.code || '')));
      var active = runs.find(threadWorkbenchActive);
      if (active) {
        var stop = button(tr('停止运行', 'Stop run'), 'ouw-danger-action', function (event) { cancelRun(active, event.currentTarget); });
        stop.classList.add('uw-thread-stop');
        stop.dataset.uwThreadFocus = 'stop:' + String(active.id);
        stop.dataset.ouwThreadStop = String(active.id || active.runId || '');
        progress.appendChild(stop);
      }
      page.body.appendChild(progress);
      if (output && output.id) {
        var latestResult = button(tr('查看最新结果', 'View latest result'), 'ouw-inline-action uw-session-latest-result', function () {
          navigateSessionTarget({ type: 'message', threadId: String(thread.id), messageId: String(output.id) }, { type: 'Thread', id: String(thread.id) });
        });
        latestResult.dataset.ouwSessionLatestResult = String(latest.id || '');
        page.body.appendChild(latestResult);
      }
      if (task) {
        var pending = threadCompletionState(task.id, getCurrentScope());
        var pendingRun = runs.find(function (run) { return String(run.id) === pending.runId; });
        if (pending.runId && !threadWorkbenchOutput(pendingRun, detail.messages)) renderThreadCompletionStatus(page.body, page, task, pending);
      }
    }

    function threadCompletionCurrent(page, expectedScope, state, ticket) {
      return !stopped && currentPageKey === page.key && pageCache.get(page.key) === page &&
        sameScope(expectedScope, getCurrentScope()) && state.ticket === ticket;
    }

    function readThreadCompletion(page, taskId, runId, expectedScope) {
      if (!bridge || typeof bridge.unifiedWorkspaceDetail !== 'function') return Promise.reject(new Error(tr('任务详情服务尚不可用。', 'Task details are unavailable.')));
      var taskRef = { type: 'WorkTask', id: String(taskId) }, threadRef = { type: 'Thread', id: String(page.ref.id) };
      return Promise.all([taskRef, threadRef].map(function (ref) {
        return Promise.resolve(bridge.unifiedWorkspaceDetail(Object.assign({}, expectedScope, { ref: ref }))).then(function (result) {
          if (!validResponse(result, expectedScope) || !result.entity || result.entity.type !== ref.type || String(result.entity.id) !== ref.id) {
            throw commandError(result, tr('任务或会话已变化，请重新读取。', 'The task or thread changed. Reload it.'));
          }
          return result;
        });
      })).then(function (details) {
        var taskDetail = details[0], threadDetail = details[1];
        if (!threadWorkbenchCompletion(taskDetail.entity, threadDetail.entity, taskDetail.runs, threadDetail.messages, runId)) {
          throw new Error(tr('当前任务或结果不再满足完成条件，请核查最新任务与执行记录。', 'The current task or result is no longer eligible. Inspect the latest task and run.'));
        }
        return { task: taskDetail.entity, thread: threadDetail.entity, runId: String(runId),
          outputMessageId: threadWorkbenchLatestRun(taskDetail.runs).outputMessageId };
      });
    }

    function requestThreadCompletion(page, taskId, runId) {
      var expectedScope = getCurrentScope(); if (!expectedScope) return Promise.resolve(false);
      var state = threadCompletionState(taskId, expectedScope);
      if (state.phase !== 'idle') return Promise.resolve(false);
      var ticket = ++state.ticket;
      state.phase = 'checking'; state.runId = String(runId); state.error = ''; renderPage(page);
      return readThreadCompletion(page, taskId, runId, expectedScope).then(function (fresh) {
        if (!threadCompletionCurrent(page, expectedScope, state, ticket)) { state.phase = 'idle'; return false; }
        state.task = fresh.task; state.phase = 'confirming'; renderPage(page);
        var confirm = page.body.querySelector('[data-uw-thread-complete-confirm]'); if (confirm) confirm.focus({ preventScroll: true });
        return true;
      }).catch(function (error) {
        if (state.ticket === ticket) { state.phase = 'idle'; state.error = messageForError(error); }
        if (threadCompletionCurrent(page, expectedScope, state, ticket)) renderPage(page);
        return false;
      });
    }

    function confirmThreadCompletion(page, taskId, runId) {
      var expectedScope = getCurrentScope(); if (!expectedScope) return Promise.resolve(false);
      var state = threadCompletionState(taskId, expectedScope);
      if (state.phase !== 'confirming' || state.runId !== String(runId)) return Promise.resolve(false);
      var reviewedRevision = state.task && state.task.revision, ticket = ++state.ticket;
      state.phase = 'checking'; state.error = ''; renderPage(page);
      return readThreadCompletion(page, taskId, runId, expectedScope).then(function (fresh) {
        if (!threadCompletionCurrent(page, expectedScope, state, ticket)) { state.phase = 'idle'; return false; }
        if (fresh.task.revision !== reviewedRevision) throw new Error(tr('任务内容已变化，请重新核对验收要求。', 'The task changed. Review the acceptance criteria again.'));
        state.phase = 'saving'; renderPage(page);
        // A stable target retains runCommand's operation/unknown lock through DOM replacement.
        return runCommand('updateTask', { id: String(taskId), expectedRevision: fresh.task.revision,
          expectedRunId: String(runId), expectedOutputMessageId: fresh.outputMessageId, patch: { status: 'completed' } }, function () {
          state.phase = 'recorded'; state.error = '';
          refresh();
        }, null, state.commandTarget).then(function (ok) {
          if (!ok) {
            var operation = actionOperationIds.get(state.commandTarget);
            if (operation && !sameScope(expectedScope, getCurrentScope())) operation.uncertain = true;
            state.phase = operation && operation.uncertain ? 'unknown' : 'idle';
            state.error = state.phase === 'unknown' ? tr('完成记录的回执未知。请先读取实际状态，不会重复提交。', 'The completion receipt is unknown. Read the actual state first; it will not be submitted again.') : tr('未确认任务完成，请重新读取任务后再核对。', 'Task completion was not confirmed. Reload and review the task.');
          }
          if (sameScope(expectedScope, getCurrentScope()) && currentPageKey === page.key) renderPage(page);
          return ok;
        });
      }).catch(function (error) {
        if (state.ticket === ticket) { state.phase = 'idle'; state.error = messageForError(error); }
        if (threadCompletionCurrent(page, expectedScope, state, ticket)) renderPage(page);
        return false;
      });
    }

    function readUnknownThreadCompletion(page, taskId, state) {
      var expectedScope = getCurrentScope(); if (!expectedScope || state.phase !== 'unknown') return;
      var ticket = ++state.ticket; state.phase = 'reading_unknown'; renderPage(page);
      Promise.resolve(bridge.unifiedWorkspaceDetail(Object.assign({}, expectedScope, { ref: { type: 'WorkTask', id: String(taskId) } }))).then(function (result) {
        if (!validResponse(result, expectedScope) || !result.entity || result.entity.type !== 'WorkTask' || String(result.entity.id) !== String(taskId)) throw commandError(result, tr('无法确认任务当前状态。', 'Could not confirm the current task state.'));
        // Readback can prove the desired state, but cannot prove an unobserved write never happened.
        state.phase = result.entity.status === 'completed' ? 'recorded' : 'unknown';
        state.error = state.phase === 'recorded' ? '' : tr('当前尚未读取到已完成状态，原提交仍不重试；请继续核查任务。', 'Completion has not been observed. The original write remains locked; inspect the task.');
        if (threadCompletionCurrent(page, expectedScope, state, ticket)) { refresh(); renderPage(page); }
      }).catch(function (error) {
        state.phase = 'unknown'; state.error = messageForError(error);
        if (threadCompletionCurrent(page, expectedScope, state, ticket)) renderPage(page);
      });
    }

    function focusThreadComposer(page) {
      if (currentPageKey !== page.key || composerState.threadId !== String(page.ref.id) || !composerInput || composerState.composing) return;
      composerInput.focus({ preventScroll: false });
    }

    function renderThreadResultActions(page, detail, message, item) {
      var thread = detail.entity, task = threadWorkbenchTask(thread, page), expectedScope = getCurrentScope();
      if (!task || !expectedScope || message.role !== 'bot') return;
      var run = (detail.runs || []).find(function (candidate) { return threadWorkbenchOutput(candidate, [message]); });
      if (!run || !run.taskRef || String(run.taskRef.id) !== String(task.id)) return;
      item.classList.add('uw-thread-delivery'); item.dataset.uwThreadResult = String(run.id);
      var actions = el('div', 'uw-thread-result-actions');
      var viewTask = button(tr('查看任务', 'View task'), 'ouw-inline-action', function () { openEntity({ type: 'WorkTask', id: String(task.id) }); });
      viewTask.dataset.uwThreadFocus = 'task:' + String(run.id);
      viewTask.dataset.uwThreadViewTask = String(task.id); actions.appendChild(viewTask);
      var revise = button(tr('继续修改', 'Continue editing'), 'ouw-inline-action', function () { focusThreadComposer(page); });
      revise.dataset.uwThreadFocus = 'revise:' + String(run.id);
      revise.dataset.uwThreadRevise = String(thread.id); actions.appendChild(revise);
      var state = threadCompletionState(task.id, expectedScope);
      var taskRuns = page.threadTaskDetail && Array.isArray(page.threadTaskDetail.runs) ? page.threadTaskDetail.runs : [];
      if (state.phase === 'recorded' && task.status === 'awaiting_review' && state.runId !== String(run.id) && String((threadWorkbenchLatestRun(taskRuns) || {}).id) === String(run.id)) { state.phase = 'idle'; state.error = ''; }
      var eligible = threadWorkbenchCompletion(task, thread, taskRuns, detail.messages, run.id);
      if (eligible || state.runId === String(run.id) && state.phase !== 'idle' && state.phase !== 'recorded') {
        var complete = button(tr('记录任务完成…', 'Record task completion…'), 'ouw-inline-action', function () { requestThreadCompletion(page, task.id, run.id); });
        complete.dataset.uwThreadFocus = 'complete:' + String(run.id);
        complete.dataset.uwThreadComplete = String(run.id);
        complete.disabled = !eligible || state.phase !== 'idle'; actions.appendChild(complete);
      }
      item.appendChild(actions);
      if (state.runId !== String(run.id)) return;
      if (state.phase === 'confirming') {
        var confirmation = el('section', 'uw-thread-completion');
        confirmation.setAttribute('aria-label', tr('确认任务完成', 'Confirm task completion'));
        confirmation.appendChild(el('p', '', tr('确认已按以下要求核对结果？此操作仅记录任务完成，不发布或升级经验。', 'Have you checked the result against these criteria? This records task completion only.')));
        confirmation.appendChild(el('p', 'uw-thread-task-criteria', state.task.acceptanceCriteria || tr('此任务未填写验收要求，请核对任务目标。', 'No acceptance criteria were saved. Check the task goal.')));
        var confirm = button(tr('确认记录完成', 'Confirm task completion'), 'ouw-primary-action', function () { confirmThreadCompletion(page, task.id, run.id); });
        confirm.dataset.uwThreadFocus = 'confirm:' + String(run.id);
        confirm.dataset.uwThreadCompleteConfirm = String(run.id);
        confirm.disabled = !eligible;
        var cancel = button(tr('取消', 'Cancel'), 'ouw-inline-action', function () { state.ticket++; state.phase = 'idle'; state.error = ''; renderPage(page); var trigger = page.body.querySelector('[data-uw-thread-complete]'); if (trigger) trigger.focus(); });
        cancel.dataset.uwThreadFocus = 'cancel:' + String(run.id);
        cancel.dataset.uwThreadCompleteCancel = String(run.id);
        confirmation.appendChild(confirm); confirmation.appendChild(cancel); item.appendChild(confirmation);
      }
      renderThreadCompletionStatus(item, page, task, state);
    }

    function renderThreadCompletionStatus(container, page, task, state) {
      if (['checking', 'saving', 'unknown', 'reading_unknown'].indexOf(state.phase) >= 0 || state.error) {
        var status = el('div', 'uw-thread-completion-status', state.error || tr('正在核对并记录…', 'Checking and recording…'));
        status.dataset.state = state.phase; status.setAttribute('role', state.error ? 'alert' : 'status'); container.appendChild(status);
        if (state.phase === 'unknown') {
          var readback = button(tr('读取实际状态', 'Read actual state'), 'ouw-inline-action', function () { readUnknownThreadCompletion(page, task.id, state); });
          readback.dataset.uwThreadFocus = 'readback:' + String(state.runId);
          readback.dataset.uwThreadCompleteReadback = String(state.runId); container.appendChild(readback);
        }
      }
    }

    function renderThreadFiles(page) {
      var files = threadWorkbenchFiles(page.threadTaskDetail);
      if (files.length) {
        var fileSection = el('section', 'uw-thread-files'); fileSection.dataset.uwThreadFiles = String(page.threadTaskDetail.entity.id);
        fileSection.appendChild(el('h3', '', tr('交付文件', 'Deliverable files')));
        files.forEach(function (file, index) {
          var label = file.label && file.label !== file.ref.id ? file.label : tr('交付文件 ' + (index + 1), 'Deliverable ' + (index + 1));
          var link = button(label, 'ouw-inline-action uw-thread-file', function () { openEntity(file.ref); });
          link.dataset.uwThreadFile = file.ref.id; link.dataset.uwThreadFocus = 'file:' + file.ref.id;
          fileSection.appendChild(link);
        });
        page.body.appendChild(fileSection);
      }
    }

    function threadSubview(page) {
      return page && page.threadSubview === 'execution' ? 'execution' : 'conversation';
    }

    function switchThreadSubview(page, nextView) {
      nextView = nextView === 'execution' ? 'execution' : 'conversation';
      if (!page || page.ref.type !== 'Thread' || threadSubview(page) === nextView) return;
      rememberThreadSubviewScroll(page);
      page.threadSubviewScrollTransition = true;
      page.threadSubview = nextView;
      renderPage(page);
    }

    function renderThreadSubviewTabs(page) {
      var current = threadSubview(page);
      var tabs = el('div', 'uw-session-tabs');
      tabs.setAttribute('role', 'tablist');
      tabs.setAttribute('aria-label', tr('会话视图', 'Thread view'));
      [['conversation', tr('对话', 'Conversation')], ['execution', tr('执行过程', 'Execution')]].forEach(function (entry) {
        var name = entry[0], tab = button(entry[1], 'uw-session-tab', function () { switchThreadSubview(page, name); });
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', String(name === current));
        tab.tabIndex = name === current ? 0 : -1;
        tab.dataset.uwThreadFocus = 'subview:' + name;
        tab.dataset.ouwSessionView = name;
        tab.addEventListener('keydown', function (event) {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) < 0) return;
          event.preventDefault();
          var next = event.key === 'Home' || event.key === 'ArrowLeft' && name === 'execution' ? 'conversation' :
            event.key === 'End' || event.key === 'ArrowRight' && name === 'conversation' ? 'execution' : name;
          switchThreadSubview(page, next);
          var target = page.body.querySelector('[data-ouw-session-view="' + next + '"]');
          if (target) target.focus();
        });
        tabs.appendChild(tab);
      });
      return tabs;
    }

    function sessionTimestamp(value) {
      if (value === null || value === undefined || value === '') return null;
      var time = typeof value === 'number' ? value : Date.parse(String(value));
      return Number.isFinite(time) ? time : null;
    }

    function sessionDateLabel(value) {
      var time = sessionTimestamp(value);
      return time === null ? tr('时间未知', 'Time unknown') : new Date(time).toLocaleString();
    }

    function sessionElapsedLabel(milliseconds) {
      if (!Number.isFinite(milliseconds) || milliseconds < 0) return tr('时间未知', 'Time unknown');
      var seconds = Math.round(milliseconds / 100) / 10;
      if (seconds < 60) return tr(seconds + ' 秒', seconds + 's');
      var minutes = Math.floor(seconds / 60), rest = Math.round(seconds - minutes * 60);
      if (minutes < 60) return tr(minutes + ' 分 ' + rest + ' 秒', minutes + 'm ' + rest + 's');
      var hours = Math.floor(minutes / 60), minutesRest = minutes - hours * 60;
      return tr(hours + ' 小时 ' + minutesRest + ' 分', hours + 'h ' + minutesRest + 'm');
    }

    function sessionRunTimingLabel(run) {
      if (run && run.timing === 'measured' && Number.isFinite(run.durationMs) && run.durationMs >= 0) {
        return tr('运行 ', 'Run ') + sessionElapsedLabel(run.durationMs);
      }
      if (run && run.timing === 'active' && Number.isFinite(run.elapsedMs) && run.elapsedMs >= 0) {
        return tr('已运行 ', 'Elapsed ') + sessionElapsedLabel(run.elapsedMs);
      }
      return tr('时间未知', 'Time unknown');
    }

    function sessionStatusLabel(value) {
      var key = String(value || '').toLowerCase();
      var labels = {
        ready: ['待开始', 'Ready'], draft: ['草稿', 'Draft'], queued: ['排队中', 'Queued'], running: ['运行中', 'Running'],
        waiting_input: ['等待输入', 'Waiting for input'], approval: ['待处理审批', 'Approval pending'], allowed: ['已授权', 'Allowed'], denied: ['已拒绝', 'Denied'],
        canceled: ['已取消', 'Canceled'], error: ['审批出错', 'Approval error'], awaiting_review: ['等待核对', 'Awaiting review'],
        needs_review: ['待核查', 'Needs review'], completed: ['已完成', 'Completed'], done: ['已完成', 'Completed'], failed: ['失败', 'Failed'],
        interrupted: ['已中断', 'Interrupted'], paused: ['已暂停', 'Paused'], needs_repair: ['待修复', 'Needs repair'],
        waiting_for_bots: ['等待受托运行', 'Waiting for delegated runs'], unknown: ['未知', 'Unknown']
      };
      return labels[key] ? tr(labels[key][0], labels[key][1]) : formatStatus(value) || tr('未知', 'Unknown');
    }

    function sessionStatusTone(value) {
      var key = String(value || '').toLowerCase();
      if (['running'].indexOf(key) >= 0) return 'running';
      if (['queued', 'ready'].indexOf(key) >= 0) return 'queued';
      if (['waiting_input', 'approval', 'awaiting_review', 'needs_review', 'needs_repair', 'interrupted', 'paused', 'waiting_for_bots'].indexOf(key) >= 0) return 'waiting';
      if (['completed', 'done'].indexOf(key) >= 0) return 'success';
      if (['failed', 'denied', 'error'].indexOf(key) >= 0) return 'failure';
      if (['allowed'].indexOf(key) >= 0) return 'success';
      return 'neutral';
    }

    function sessionBotLabel(botRef) {
      var ref = normalizeRef(botRef);
      if (!ref) return '';
      var bot = (snapshot && snapshot.bots || []).find(function (item) { return String(item.id || item.botId || '') === ref.id; });
      return bot ? safeName(bot) : ref.id;
    }

    function sessionExecutionFallback(page, detail) {
      var thread = detail.entity, runs = Array.isArray(detail.runs) ? detail.runs : [];
      var task = page.threadTaskDetail && page.threadTaskDetail.entity;
      var groups = new Map();
      function getGroup(taskId, run) {
        var key = taskId || '@thread';
        if (!groups.has(key)) {
          var associated = task && String(task.id) === String(taskId || '') ? task : null;
          groups.set(key, { taskId: taskId || null, parentTaskId: null, title: associated && (associated.goal || associated.title) ||
            (taskId ? taskId : safeName(thread)), status: associated && associated.status || null,
            ownerBotRef: associated && associated.ownerBotRef || thread.botRef || null, steps: [], waiting: null, runGroups: [] });
        }
        return groups.get(key);
      }
      runs.forEach(function (run) {
        if (!run) return;
        var taskRef = normalizeRef(run.taskRef);
        var linkedTaskId = taskRef && taskRef.type === 'WorkTask' ? taskRef.id :
          String(run.threadId || '') === String(thread.id) ? String(thread.primaryTaskId || thread.taskId || '') || null : null;
        if (!linkedTaskId && String(run.threadId || '') !== String(thread.id)) return;
        var started = sessionTimestamp(run.startedAt), ended = sessionTimestamp(run.endedAt);
        var measured = started !== null && ended !== null && ended >= started;
        var active = !measured && started !== null && ended === null && ['queued', 'running', 'waiting_input', 'approval', 'paused'].indexOf(String(run.status || '')) >= 0;
        getGroup(linkedTaskId, run).runGroups.push(Object.assign({}, run, {
          id: String(run.id || run.runId || ''), taskId: linkedTaskId, botRef: run.executorBotRef || null, steps: [],
          durationMs: measured ? ended - started : null, elapsedMs: active ? Math.max(0, Date.now() - started) : null,
          timing: measured ? 'measured' : active ? 'active' : 'unknown'
        }));
      });
      if (!groups.size && task) getGroup(String(task.id), null);
      return { schemaVersion: 1, threadId: String(thread.id), taskGroups: Array.from(groups.values()), attention: [],
        coverage: { runTiming: 'reported-only', stepTiming: 'events-only', usage: 'reported-only', history: 'supplied-only' } };
    }

    function sessionExecutionData(page, detail) {
      var execution = detail && detail.execution;
      if (execution && execution.schemaVersion === 1 && String(execution.threadId || '') === String(detail.entity.id) && Array.isArray(execution.taskGroups)) return execution;
      return sessionExecutionFallback(page, detail);
    }

    function sessionRunDomain(run) {
      var times = [];
      function add(value) { var parsed = sessionTimestamp(value); if (parsed !== null) times.push(parsed); }
      if (!run) return null;
      add(run.startedAt); add(run.endedAt);
      if (run.timing === 'active' && sessionTimestamp(run.startedAt) !== null && Number.isFinite(run.elapsedMs) && run.elapsedMs >= 0) add(sessionTimestamp(run.startedAt) + run.elapsedMs);
      (Array.isArray(run.steps) ? run.steps : []).forEach(function (step) { add(step && step.at); });
      if (!times.length) add(run.createdAt);
      if (!times.length) return null;
      return { start: Math.min.apply(Math, times), end: Math.max.apply(Math, times) };
    }

    function sessionTimelinePosition(value, domain) {
      var time = sessionTimestamp(value);
      if (time === null || !domain) return null;
      if (domain.end === domain.start) return 50;
      return Math.max(0, Math.min(100, (time - domain.start) / (domain.end - domain.start) * 100));
    }

    function sessionAxisLabel(offset) {
      var milliseconds = Math.max(0, offset);
      if (milliseconds < 1000) return tr(Math.round(milliseconds) + ' 毫秒', Math.round(milliseconds) + 'ms');
      var seconds = milliseconds / 1000;
      if (seconds < 10) return tr((Math.round(seconds * 10) / 10) + ' 秒', (Math.round(seconds * 10) / 10) + 's');
      seconds = Math.round(seconds);
      if (seconds < 60) return seconds + 's';
      var minutes = Math.floor(seconds / 60), rest = seconds % 60;
      if (minutes < 60) return minutes + 'm' + (rest ? ' ' + rest + 's' : '');
      var hours = Math.floor(minutes / 60), minuteRest = minutes % 60;
      return hours + 'h' + (minuteRest ? ' ' + minuteRest + 'm' : '');
    }

    function sessionTaskDepth(group, groups) {
      var parents = new Map(groups.map(function (item) { return [String(item.taskId || ''), item]; }));
      var depth = 0, cursor = group, seen = new Set();
      while (cursor && cursor.parentTaskId && depth < 6) {
        var id = String(cursor.parentTaskId);
        if (seen.has(id)) break;
        seen.add(id);
        cursor = parents.get(id);
        if (!cursor) break;
        depth += 1;
      }
      return depth;
    }

    function sessionStepLabel(step) {
      var kind = String(step && step.kind || '').toLowerCase();
      var original = String(step && step.label || '').trim();
      var activityLabels = {
        native_approval_requested: ['请求系统审批', 'Native approval requested'],
        native_approval_resolved: ['系统审批已返回', 'Native approval resolved'],
        approval_requested: ['请求审批', 'Approval requested'],
        approval_resolved: ['审批已返回', 'Approval resolved'],
        deliverable_confirmed: ['交付物已确认', 'Deliverable confirmed']
      };
      var activityLabel = activityLabels[original.toLowerCase()];
      if (activityLabel) return tr(activityLabel[0], activityLabel[1]);
      var labels = {
        started: ['开始运行', 'Run started'], finished: ['运行结束', 'Run finished'], input: ['收到输入', 'Input received'], result: ['返回结果', 'Result returned'],
        handoff: ['任务交接', 'Task handoff'], message: ['消息', 'Message'], approval: ['审批节点', 'Approval'], file: ['文件', 'File'],
        context: ['上下文文件', 'Context file'], wait: ['等待', 'Wait'], activity: ['活动', 'Activity']
      };
      if (labels[kind]) {
        if (!original || original === 'Run started' || original === 'Run finished' || original === 'Input' || original === 'Result' || original === 'Handoff' || original === 'Message' || original === 'Submitted context file' || original === 'Planned context file' || original === 'Activity') return tr(labels[kind][0], labels[kind][1]);
      }
      return original || (labels[kind] ? tr(labels[kind][0], labels[kind][1]) : tr('执行事件', 'Execution event'));
    }

    function sessionTargetAction(target) {
      if (!target) return '';
      if (target.type === 'message') return tr('打开消息', 'Open message');
      var ref = target.ref && normalizeRef(target.ref) || normalizeRef(target);
      if (!ref) return '';
      if (ref.type === 'Run' && target.approvalId) return tr('打开审批详情', 'Open approval detail');
      var labels = { WorkTask: ['打开任务', 'Open task'], Run: ['打开执行记录', 'Open Run'], Thread: ['打开会话', 'Open thread'], FileRef: ['打开文件', 'Open file'], BotInstanceRef: ['打开 BOT', 'Open BOT'], Project: ['打开项目', 'Open project'] };
      return labels[ref.type] ? tr(labels[ref.type][0], labels[ref.type][1]) : tr('打开关联对象', 'Open linked item');
    }

    function navigateSessionTarget(target, fallbackThread) {
      if (!target) return;
      if (target.type === 'message') {
        var threadRef = normalizeRef({ type: 'Thread', id: target.threadId }) || normalizeRef(fallbackThread);
        if (!threadRef || !target.messageId) return;
        var threadPage = getPage(threadRef);
        // Opening renders a cached page before starting the fresh detail read.
        // Arm the locator afterwards so that cache cannot consume its target.
        openEntity(threadRef);
        threadPage.pendingExecutionMessageId = String(target.messageId);
        threadPage.executionLocationNotice = '';
        if (threadPage.threadSubview !== 'conversation') {
          threadPage.threadSubviewScrollTransition = true;
          threadPage.threadSubview = 'conversation';
          renderPage(threadPage);
        }
        return;
      }
      var ref = target.ref && normalizeRef(target.ref) || normalizeRef(target);
      if (!ref) return;
      var destination = getPage(ref);
      openEntity(ref);
      if (ref.type === 'Run' && target.approvalId) {
        destination.pendingExecutionApprovalId = String(target.approvalId);
        destination.executionLocationNotice = '';
      }
    }

    function applySessionLocator(page) {
      if (!page || !page.body || !pageHost || page.loading || page.error || currentPageKey !== page.key) return;
      if (page.ref.type === 'Thread' && page.threadSubview === 'execution') return;
      var messageId = page.ref.type === 'Thread' && page.pendingExecutionMessageId;
      var approvalId = page.ref.type === 'Run' && page.pendingExecutionApprovalId;
      var selector = messageId ? '[data-ouw-session-message-id]' : approvalId ? '[data-ouw-session-approval-id]' : '';
      if (!selector) return;
      var target = Array.from(page.body.querySelectorAll(selector)).find(function (node) {
        return String(node.dataset.ouwSessionMessageId || node.dataset.ouwSessionApprovalId || '') === String(messageId || approvalId);
      });
      if (!target) {
        if (page.loading || page.error) return;
        page.executionLocationNotice = messageId
          ? tr('这条消息不在当前可读取记录中。', 'This message is not present in the available thread records.')
          : tr('此执行记录没有返回对应的审批详情。', 'This Run record does not include the linked approval detail.');
        var notice = el('div', 'uw-session-location-note', page.executionLocationNotice);
        if (page.sessionConversationPane && messageId) page.sessionConversationPane.prepend(notice);
        else if (page.ref.type === 'Run') page.body.prepend(notice);
        page.pendingExecutionMessageId = '';
        page.pendingExecutionApprovalId = '';
        return;
      }
      page.executionLocationNotice = '';
      page.pendingExecutionMessageId = '';
      page.pendingExecutionApprovalId = '';
      target.classList.add('uw-session-locator-active');
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
      target.scrollIntoView({ block: 'center', behavior: 'auto' });
      target.focus({ preventScroll: true });
      if (page.ref.type === 'Thread') rememberThreadSubviewScroll(page);
      setTimeout(function () { if (target.isConnected) target.classList.remove('uw-session-locator-active'); }, 2400);
    }

    function sessionUsageLabels(run) {
      var accounting = run && run.usage && run.usage.accounting;
      if (!accounting || typeof accounting !== 'object') return [tr('用量未记录', 'Usage not recorded')];
      var labels = [];
      var total = accounting.tokens && accounting.tokens.total;
      if (total && total.value !== null && total.value !== undefined) {
        var suffix = total.missing || accounting.unknownRuns ? tr(' · 部分记录', ' · partial') : '';
        labels.push(tr('Token ', 'Tokens ') + new Intl.NumberFormat().format(total.value) + suffix);
      } else labels.push(tr('Token 未记录', 'Tokens not recorded'));
      var cost = accounting.cost;
      var currencies = cost && cost.byCurrency && Object.keys(cost.byCurrency) || [];
      if (!currencies.length) labels.push(tr('费用未报告', 'Cost not reported'));
      else currencies.forEach(function (currency) {
        var item = cost.byCurrency[currency];
        if (!item || item.amount === null || item.amount === undefined) { labels.push(tr('费用未知', 'Cost unknown')); return; }
        var amount = new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(item.amount);
        labels.push(amount + (item.missing || accounting.unknownRuns ? tr(' · 部分报告', ' · partial') : tr(' · 已报告', ' · reported')));
      });
      return labels;
    }

    function sessionAttemptLabel(attempt, ordinal, total) {
      var label = tr('第 ' + ordinal + ' 次运行', 'Run ' + ordinal + ' of ' + total);
      if (!attempt || typeof attempt !== 'object') return label;
      var kind = String(attempt.kind || '').toLowerCase();
      var kinds = { plan: tr('团队计划', 'Team plan'), member: tr('团队成员', 'Team member'), summary: tr('团队总结', 'Team summary') };
      var details = [label];
      if (kinds[kind]) details.push(kinds[kind]);
      else if (kind) details.push(tr('协作尝试', 'Team attempt'));
      if (Number.isSafeInteger(attempt.generation) && attempt.generation > 0) details.push(tr('代次 ', 'Generation ') + attempt.generation);
      return details.join(' · ');
    }

    function sessionExecutionTrack(track, options) {
      options = options || {};
      track.classList.add('uw-session-track');
      if (options.run) {
        var run = options.run;
        var start = sessionTimestamp(run.startedAt), end = sessionTimestamp(run.endedAt);
        if (run.timing === 'active' && start !== null && Number.isFinite(run.elapsedMs) && run.elapsedMs >= 0) end = start + run.elapsedMs;
        if ((run.timing === 'measured' || run.timing === 'active') && start !== null && end !== null && end >= start) {
          var left = sessionTimelinePosition(start, options.domain), right = sessionTimelinePosition(end, options.domain);
          if (left !== null && right !== null && right > left) {
            var span = el('span', 'uw-session-run-span');
            span.dataset.state = sessionStatusTone(run.status);
            span.style.left = left + '%'; span.style.width = (right - left) + '%';
            span.setAttribute('aria-hidden', 'true'); track.appendChild(span);
          } else if (left !== null) {
            var point = el('span', 'uw-session-run-point');
            point.dataset.state = sessionStatusTone(run.status); point.style.left = left + '%';
            point.setAttribute('aria-hidden', 'true'); track.appendChild(point);
          }
        } else {
          var created = sessionTimelinePosition(run.startedAt || run.createdAt, options.domain);
          if (created !== null) {
            var mark = el('span', 'uw-session-run-point');
            mark.dataset.state = sessionStatusTone(run.status); mark.dataset.kind = 'created'; mark.style.left = created + '%';
            mark.setAttribute('aria-hidden', 'true'); track.appendChild(mark);
          } else track.appendChild(el('span', 'uw-session-track-unknown', tr('时间未知', 'Time unknown')));
        }
      }
      (Array.isArray(options.steps) ? options.steps : []).forEach(function (step) {
        var position = sessionTimelinePosition(step.at, options.domain);
        if (position === null) return;
        var action = sessionTargetAction(step.target);
        var marker = button('', 'uw-session-event-marker', function () { navigateSessionTarget(step.target, options.fallbackThread); });
        marker.style.left = position + '%';
        marker.dataset.kind = String(step.kind || 'activity');
        marker.setAttribute('aria-label', [sessionStepLabel(step), sessionDateLabel(step.at), action].filter(Boolean).join(', '));
        marker.title = [sessionStepLabel(step), sessionDateLabel(step.at), action].filter(Boolean).join(' · ');
        marker.disabled = !action;
        track.appendChild(marker);
      });
      if (!track.childNodes.length) track.appendChild(el('span', 'uw-session-track-unknown', tr('无可定位时间', 'No recorded time')));
    }

    function renderSessionStepList(host, steps, fallbackThread) {
      var list = el('div', 'uw-session-step-list');
      (Array.isArray(steps) ? steps : []).forEach(function (step) {
        if (!step) return;
        var row = el('div', 'uw-session-step-row');
        var action = sessionTargetAction(step.target);
        if (step.target && action) {
          var open = button('', 'uw-session-step-open', function () { navigateSessionTarget(step.target, fallbackThread); });
          open.appendChild(el('span', 'uw-session-step-kind', sessionStepLabel(step)));
          var subline = [];
          if (step.kind === 'handoff') {
            var from = sessionBotLabel(step.delegatorBotRef), to = sessionBotLabel(step.assigneeBotRef);
            if (from) subline.push(from);
            if (to) subline.push(to);
          }
          if (subline.length) open.appendChild(el('span', 'uw-session-step-actors', subline.join(' → ')));
          open.appendChild(el('time', 'uw-session-step-time', step.at ? sessionDateLabel(step.at) : tr('时间未知', 'Time unknown')));
          open.setAttribute('aria-label', [sessionStepLabel(step), step.at ? sessionDateLabel(step.at) : tr('时间未知', 'Time unknown'), action].filter(Boolean).join(', '));
          open.title = action;
          row.appendChild(open);
        } else {
          row.appendChild(el('span', 'uw-session-step-unlinked', sessionStepLabel(step)));
          row.appendChild(el('time', 'uw-session-step-time', step.at ? sessionDateLabel(step.at) : tr('时间未知', 'Time unknown')));
        }
        if (step.status) row.appendChild(el('span', 'uw-session-step-status', sessionStatusLabel(step.status)));
        list.appendChild(row);
      });
      if (!list.childNodes.length) list.appendChild(el('div', 'uw-session-step-empty', tr('没有记录步骤。', 'No step events were recorded.')));
      host.appendChild(list);
    }

    function renderSessionRunWaterfall(host, run, fallbackThread) {
      var domain = sessionRunDomain(run);
      var chart = el('div', 'uw-session-chart uw-session-run-waterfall');
      chart.dataset.ouwSessionWaterfallRun = String(run.id || '');
      var ruler = el('div', 'uw-session-axis-row' + (domain ? '' : ' is-unknown'));
      ruler.appendChild(el('span', 'uw-session-axis-label', tr('本次运行', 'This Run')));
      if (domain) {
        var axis = el('div', 'uw-session-axis');
        var tickFractions = domain.end === domain.start ? [0.5] : [0, 25, 50, 75, 100];
        tickFractions.forEach(function (percent) {
          var tick = el('span', 'uw-session-axis-tick', sessionAxisLabel((domain.end - domain.start) * percent / 100));
          tick.style.left = percent + '%'; axis.appendChild(tick);
        });
        ruler.appendChild(axis);
      } else ruler.appendChild(el('span', 'uw-session-axis-unknown', tr('没有已记录的时间点', 'No recorded timestamps')));
      chart.appendChild(ruler);
      var lane = el('div', 'uw-session-lane uw-session-run-lane');
      lane.appendChild(el('span', 'uw-session-lane-label', tr('运行区间', 'Run span')));
      var track = el('div', 'uw-session-lane-track');
      sessionExecutionTrack(track, { domain: domain, run: run, steps: run.steps, fallbackThread: fallbackThread });
      lane.appendChild(track); chart.appendChild(lane);
      host.appendChild(chart);
    }

    function renderSessionExecutionTimeline(page, detail, host) {
      var execution = sessionExecutionData(page, detail);
      var groups = Array.isArray(execution.taskGroups) ? execution.taskGroups : [];
      var thread = detail.entity;
      var fallbackThread = { type: 'Thread', id: String(thread.id) };
      host.dataset.ouwSessionExecution = String(thread.id);
      host.appendChild(el('div', 'uw-session-timeline-note', tr(
        '按关联任务查看运行；每次运行的时间轴只使用该次已记录时间，不跨尝试合并。',
        'Runs are grouped by linked task. Each Run has its own recorded timeline; attempts are never pooled.'
      )));
      if (!groups.length) {
        host.appendChild(el('div', 'ouw-subtle-empty', tr('此会话还没有可显示的执行记录。', 'This thread has no recorded executions to show.')));
        return;
      }
      var coverage = execution.coverage || {};
      if (coverage.runsTruncated || coverage.relatedTasksTruncated || coverage.eventsTruncated || coverage.threadsTruncated || coverage.messagesTruncated || coverage.unavailableRelatedItems) {
        host.appendChild(el('div', 'uw-session-coverage-note', tr('部分关联历史被截断或暂不可用；当前视图不补造缺失记录。', 'Some related history is truncated or unavailable; this view does not infer missing records.')));
      }
      var chart = el('div', 'uw-session-chart-scroll');
      var primaryTaskId = String(thread.primaryTaskId || thread.taskId || '');
      groups.forEach(function (group) {
        var groupSection = el('section', 'uw-session-task-group');
        var depth = sessionTaskDepth(group, groups);
        groupSection.style.setProperty('--uw-session-depth', String(depth));
        var taskId = String(group.taskId || '');
        if (taskId) groupSection.dataset.ouwSessionTask = taskId;
        var groupKey = taskId || '@thread';
        // The projection already carries immutable repository order. Keep it;
        // remote clocks and duplicate timestamps must never reorder attempts.
        var runGroups = Array.isArray(group.runGroups) ? group.runGroups.slice() : [];
        var groupSteps = Array.isArray(group.steps) ? group.steps : [];
        var title = String(group.title || (taskId ? taskId : tr('会话运行', 'Thread runs')));
        var owner = sessionBotLabel(group.ownerBotRef) || sessionBotLabel(runGroups[0] && runGroups[0].botRef);
        var savedTaskOpen = page.sessionTaskOpen && Object.prototype.hasOwnProperty.call(page.sessionTaskOpen, groupKey)
          ? page.sessionTaskOpen[groupKey] : null;
        var expanded = savedTaskOpen === null ? (!depth && (!primaryTaskId || taskId === primaryTaskId)) : savedTaskOpen;
        var heading = el('div', 'uw-session-task-heading');
        var toggle = button('', 'uw-session-task-toggle', function () {
          expanded = !expanded;
          groupSection.dataset.expanded = String(expanded);
          toggle.setAttribute('aria-expanded', String(expanded));
          toggle.setAttribute('aria-label', tr((expanded ? '折叠任务运行：' : '展开任务运行：') + title, (expanded ? 'Collapse runs for ' : 'Expand runs for ') + title));
          groupBody.hidden = !expanded;
          page.sessionTaskOpen = page.sessionTaskOpen || Object.create(null);
          page.sessionTaskOpen[groupKey] = expanded;
        });
        toggle.dataset.ouwSessionTaskToggle = groupKey;
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.setAttribute('aria-label', tr((expanded ? '折叠任务运行：' : '展开任务运行：') + title, (expanded ? 'Collapse runs for ' : 'Expand runs for ') + title));
        heading.appendChild(toggle);
        var taskCopy = el('div', 'uw-session-task-copy');
        if (taskId) {
          var taskLink = button(title, 'uw-session-task-link', function () { openEntity({ type: 'WorkTask', id: taskId }); });
          taskLink.setAttribute('aria-label', tr('打开任务 ', 'Open task ') + title);
          taskLink.title = title;
          taskCopy.appendChild(taskLink);
        } else taskCopy.appendChild(el('h3', 'uw-session-task-title', title));
        var meta = [owner, tr(runGroups.length + ' 次运行', runGroups.length + (runGroups.length === 1 ? ' Run' : ' Runs'))].filter(Boolean).join(' · ');
        taskCopy.appendChild(el('div', 'uw-session-task-meta', meta || tr('负责人或运行记录未记录', 'Owner or runs not recorded')));
        heading.appendChild(taskCopy);
        if (group.status) {
          var state = el('span', 'uw-session-task-state', sessionStatusLabel(group.status));
          state.dataset.state = sessionStatusTone(group.status); heading.appendChild(state);
        }
        groupSection.append(heading);
        groupSection.dataset.expanded = String(expanded);
        var groupBody = el('div', 'uw-session-task-body');
        groupBody.hidden = !expanded;
        if (group.waiting && group.waiting.kind === 'waiting_for_bots') {
          var waitingRunIds = Array.isArray(group.waiting.runIds) ? group.waiting.runIds : [];
          var wait = el('div', 'uw-session-waiting');
          wait.appendChild(el('span', '', tr('等待委派执行结束', 'Waiting for delegated runs')));
          if (waitingRunIds.length) wait.appendChild(el('span', 'uw-session-waiting-count', tr(waitingRunIds.length + ' 项', waitingRunIds.length + (waitingRunIds.length === 1 ? ' run' : ' runs'))));
          if (group.waiting.target) wait.appendChild(button(tr('查看任务', 'Open task'), 'uw-session-waiting-link', function () { navigateSessionTarget(group.waiting.target); }));
          groupBody.appendChild(wait);
        }
        runGroups.forEach(function (run, index) {
          var runId = String(run.id || '');
          var runEntry = el('div', 'uw-session-run-entry');
          var details = el('details', 'uw-session-run');
          details.dataset.ouwSessionRun = runId;
          details.dataset.selected = String(page.sessionSelectedRunId === runId);
          var savedOpen = page.sessionRunOpen && Object.prototype.hasOwnProperty.call(page.sessionRunOpen, runId) ? page.sessionRunOpen[runId] : null;
          details.open = savedOpen === null ? page.sessionSelectedRunId === runId : savedOpen;
          var summary = document.createElement('summary'); summary.className = 'uw-session-run-summary';
          summary.dataset.uwThreadFocus = 'run-summary:' + runId;
          var botName = sessionBotLabel(run.botRef);
          var runHeading = el('span', 'uw-session-run-heading');
          var attemptLabel = sessionAttemptLabel(run.attempt, index + 1, runGroups.length);
          var idLabel = el('strong', 'uw-session-run-id', attemptLabel);
          idLabel.title = runId ? tr('执行记录 ID：' + runId, 'Run ID: ' + runId) : tr('执行记录 ID 未记录', 'Run ID not recorded');
          runHeading.appendChild(idLabel);
          if (botName) runHeading.appendChild(el('span', 'uw-session-run-bot', botName));
          var runState = el('span', 'uw-session-run-state', sessionStatusLabel(run.status));
          runState.dataset.state = sessionStatusTone(run.status);
          var timing = el('span', 'uw-session-run-timing', sessionRunTimingLabel(run));
          summary.append(runHeading, runState, timing);
          summary.setAttribute('aria-label', [attemptLabel, botName, sessionStatusLabel(run.status), sessionRunTimingLabel(run)].filter(Boolean).join(', '));
          var inspector = el('div', 'uw-session-run-inspector');
          var facts = el('div', 'uw-session-run-facts');
          facts.appendChild(el('span', '', tr('开始 ', 'Started ') + sessionDateLabel(run.startedAt)));
          facts.appendChild(el('span', '', tr('结束 ', 'Ended ') + sessionDateLabel(run.endedAt)));
          sessionUsageLabels(run).forEach(function (label) { facts.appendChild(el('span', '', label)); });
          inspector.appendChild(facts);
          renderSessionRunWaterfall(inspector, run, fallbackThread);
          var openRun = button(tr('查看完整执行记录', 'Open full Run details'), 'uw-session-open-run', function () { openEntity({ type: 'Run', id: runId }); });
          openRun.disabled = !runId; inspector.appendChild(openRun);
          var stepsWrap = el('div', 'uw-session-run-steps');
          stepsWrap.appendChild(el('h4', 'uw-session-steps-heading', tr('运行步骤', 'Run steps')));
          renderSessionStepList(stepsWrap, run.steps, fallbackThread);
          inspector.appendChild(stepsWrap);
          details.append(summary, inspector);
          details.addEventListener('toggle', function () {
            page.sessionRunOpen = page.sessionRunOpen || Object.create(null);
            page.sessionRunOpen[runId] = details.open;
            if (details.open) page.sessionSelectedRunId = runId;
            else if (page.sessionSelectedRunId === runId) page.sessionSelectedRunId = '';
            Array.from(host.querySelectorAll('.uw-session-run')).forEach(function (other) {
              other.dataset.selected = String(page.sessionSelectedRunId === String(other.dataset.ouwSessionRun || ''));
            });
          });
          runEntry.appendChild(details);
          var resultStep = (Array.isArray(run.steps) ? run.steps : []).find(function (step) { return step && ['result', 'handoff'].indexOf(step.kind) >= 0 && step.target; });
          if (resultStep && sessionTargetAction(resultStep.target)) {
            var resultLink = button(tr('查看结果', 'View result'), 'uw-session-run-result', function () { navigateSessionTarget(resultStep.target, fallbackThread); });
            resultLink.dataset.ouwSessionRunResult = runId;
            resultLink.setAttribute('aria-label', tr('查看执行结果', 'View Run result') + ' ' + runId);
            runEntry.appendChild(resultLink);
          } else runEntry.appendChild(el('span', 'uw-session-run-result-missing', tr('结果未记录', 'No result recorded')));
          groupBody.appendChild(runEntry);
        });
        if (groupSteps.length) {
          var taskEvents = el('details', 'uw-session-task-events');
          // Task-wide activity is secondary to the independent Run summaries.
          taskEvents.open = false;
          var eventsSummary = document.createElement('summary'); eventsSummary.className = 'uw-session-group-events-heading';
          eventsSummary.appendChild(el('span', '', tr('任务事件', 'Task events')));
          eventsSummary.appendChild(el('span', 'uw-session-task-event-count', tr(groupSteps.length + ' 项', groupSteps.length + (groupSteps.length === 1 ? ' item' : ' items'))));
          taskEvents.appendChild(eventsSummary);
          renderSessionStepList(taskEvents, groupSteps, fallbackThread);
          groupBody.appendChild(taskEvents);
        }
        if (!runGroups.length && !groupSteps.length) groupBody.appendChild(el('div', 'uw-session-no-runs', tr('没有运行记录。', 'No Run records.')));
        groupSection.appendChild(groupBody);
        chart.appendChild(groupSection);
      });
      host.appendChild(chart);
    }

    function renderThreadTechnical(page, detail) {
      var thread = detail.entity, technical = el('details', 'uw-thread-technical');
      technical.dataset.uwThreadTechnical = String(thread.id);
      technical.open = page.threadTechnicalOpen === true;
      technical.addEventListener('toggle', function () { page.threadTechnicalOpen = technical.open; });
      var summary = el('summary', '', tr('执行与上下文详情', 'Execution and context details'));
      summary.dataset.uwThreadFocus = 'technical'; technical.appendChild(summary);
      var technicalPage = Object.assign({}, page, { body: technical });
      var metadata = el('div', 'ouw-entity-meta');
      metadata.appendChild(el('span', '', tr('会话 ID：', 'Thread ID: ') + String(thread.id)));
      if (thread.revision !== undefined) metadata.appendChild(el('span', 'ouw-entity-revision', tr('修订 ', 'Revision ') + thread.revision));
      if (thread.archivedAt) metadata.appendChild(el('span', '', tr('已归档', 'Archived')));
      technical.appendChild(metadata);
      renderThreadHandoff(technicalPage, detail, thread);
      technical.appendChild(button(tr('继续并传递上下文…', 'Continue with context…'), 'ouw-inline-action', function () { openContinueThreadForm(thread, detail, page); }));
      var binding = thread.executionBinding && typeof thread.executionBinding === 'object' ? thread.executionBinding : null;
      if (binding && (binding.label || binding.model || binding.executorId || binding.choiceId)) {
        var bindingSection = sectionBlock(tr('已保存的执行选择', 'Saved execution choice'));
        var bindingLabel = String(binding.choiceId || '') === 'default' || String(binding.label || '') === '默认（DSH）' || String(binding.label || '') === 'Default (DSH)'
          ? tr('默认（DSH）', 'Default (DSH)') : executionChoiceDisplayLabel(binding.choiceId, binding.label);
        var bindingValues = [bindingLabel, binding.model, binding.executorId && ('Executor ' + binding.executorId), binding.choiceId && ('Choice ' + binding.choiceId)].filter(Boolean);
        bindingSection.appendChild(el('div', 'ouw-thread-binding', bindingValues.join(' · ')));
        technical.appendChild(bindingSection);
      }
      var contextRefs = [];
      if (thread.primaryProjectId) contextRefs.push({ label: tr('所属工程', 'Project'), ref: { type: 'Project', id: String(thread.primaryProjectId) } });
      var threadTaskId = thread.taskId || thread.primaryTaskId;
      if (threadTaskId) contextRefs.push({ label: tr('关联任务', 'Task'), ref: { type: 'WorkTask', id: String(threadTaskId) } });
      if (thread.rootId) contextRefs.push({ label: tr('工作目录', 'Working folder'), ref: { type: 'RootBinding', id: String(thread.rootId) } });
      if (contextRefs.length) {
        var contextSection = sectionBlock(tr('任务上下文', 'Task context'));
        contextRefs.forEach(function (item) {
          var display = item.label + ' · ' + threadContextLabel(item.ref);
          var link = button(display, 'ouw-related-row', function () { openEntity(item.ref); });
          link.dataset.ouwThreadContextRef = refKey(item.ref);
          link.title = display;
          contextSection.appendChild(link);
        });
        technical.appendChild(contextSection);
      }

      renderRelations(technicalPage, detail);
      renderActivity(technicalPage, detail);
      renderRuns(technicalPage, detail);
      renderContextSnapshots(technicalPage, detail);
      page.body.appendChild(technical);
    }

    var projectMessageAuthors = new WeakMap();

    function paintProjectMessageAuthor(meta) {
      var author = projectMessageAuthors.get(meta);
      var account = root.OpenBotAccountSidebar;
      var label = meta.querySelector('.ouw-message-role');
      var avatar = meta.querySelector('[data-ouw-account-avatar]');
      if (avatar && account && account.paintMessageAvatar) account.paintMessageAvatar(avatar, author);
      if (author && label) label.textContent = account && account.isCurrentAccount(author.accountId)
        ? tr('你', 'You') : author.name || tr('用户', 'User');
    }

    function repaintProjectMessageAuthors() {
      if (contentRoot) contentRoot.querySelectorAll('[data-ouw-message-author="human"] .ouw-message-meta')
        .forEach(paintProjectMessageAuthor);
    }

    function renderProjectSessionCollaboration(page, detail, projectId, task, participant) {
      var thread = detail.entity;
      var tools = el('div', 'ouw-project-session-actions');
      var current = button(tr('在此会话继续', 'Continue in this session'), 'ouw-inline-action', function () {
        focusThreadComposer(page);
      });
      current.dataset.ouwProjectContinue = String(thread.id);
      current.dataset.uwThreadFocus = 'project-continue';
      tools.appendChild(current);
      var ref = task ? { type: 'WorkTask', id: String(task.id) } : { type: 'Project', id: projectId };
      var link = button(task ? tr('打开任务协作', 'Open task collaboration') : tr('打开所属工程', 'Open project'),
        'ouw-inline-action', function () { openEntity(ref); });
      link.dataset.uwThreadFocus = 'project-collaboration';
      if (task) link.dataset.ouwProjectCollaborationTask = ref.id;
      tools.appendChild(link);
      if (!task && visibleThreadHasContext(detail)) {
        var handoff = button(tr('选消息交给其他 Bot…', 'Hand off selected messages…'), 'ouw-inline-action', function () {
          openContinueThreadForm(thread, detail, page, { explicit: true });
        });
        handoff.dataset.ouwProjectHandoff = String(thread.id);
        handoff.dataset.uwThreadFocus = 'project-handoff';
        tools.appendChild(handoff);
      }
      page.body.appendChild(tools);
      var note = participant ? tr('参与 Bot：', 'Participating Bot: ') + safeName(participant) + ' · ' : '';
      page.body.appendChild(el('div', 'ouw-source-note', note + tr('在这里以你的身份发消息，当前执行者会沿用本会话继续。', 'Send here as yourself to continue with this session’s executor.')));
    }

    function visibleThreadHasContext(detail) {
      return (detail.messages || []).some(function (message) {
        return message && message.id && message.text && message.sourceAvailable !== false && message.resultAvailable !== false;
      });
    }

    function renderThreadBody(page, detail) {
      var thread = detail.entity;
      var messages = Array.isArray(detail.messages) ? detail.messages : [];
      var isWritable = !!(thread.messageSourceRef && thread.messageSourceRef.sourceType === 'unified-thread');
      var task = taskForThread(thread, snapshot && snapshot.tasks);
      var projectId = isWritable ? projectIdForThread(thread, snapshot && snapshot.tasks) : '';
      var pageBody = page.body;
      var currentView = threadSubview(page);
      var layered = thread.kind === 'task' || thread.kind === 'legacy-task';
      var experience = el('div', 'uw-session-experience');
      experience.dataset.activeView = layered ? currentView : 'conversation';
      var common = layered ? el('div', 'uw-session-common') : null;
      var conversation = el('section', 'uw-session-pane uw-session-conversation');
      conversation.hidden = layered && currentView !== 'conversation';
      conversation.setAttribute('role', 'tabpanel');
      conversation.setAttribute('aria-label', tr('对话', 'Conversation'));
      var execution = null;
      if (layered) {
        execution = el('section', 'uw-session-pane uw-session-execution');
        execution.hidden = currentView !== 'execution';
        execution.setAttribute('role', 'tabpanel');
        execution.setAttribute('aria-label', tr('执行过程', 'Execution'));
        experience.append(common, renderThreadSubviewTabs(page), conversation, execution);
      } else {
        experience.appendChild(conversation);
      }
      pageBody.appendChild(experience);
      page.sessionConversationPane = conversation;
      page.sessionExecutionPane = execution;
      if (layered) {
        page.body = common;
        renderThreadWorkbench(page, detail);
      }
      page.body = conversation;
      if (page.executionLocationNotice) conversation.appendChild(el('div', 'uw-session-location-note', page.executionLocationNotice));
      if (thread && thread.origin === 'bot') {
        // M1 遗留补齐：详情页 BOT 自建标识。
        var detailOriginBadge = el('span', 'ouw-row-subtitle ouw-thread-origin-bot', tr('BOT 自建会话', 'BOT-started thread'));
        detailOriginBadge.setAttribute('data-ouw-thread-origin', 'bot');
        page.body.appendChild(detailOriginBadge);
      }
      if (thread && thread.continuationIntent) {
        // M2 (OPENBOT-UPSTREAM-ADOPTION-PLAN)：事件续办说明。
        page.body.appendChild(el('div', 'ouw-source-note', tr('已登记自动续办：本会话运行结束后将自动派发下一轮，无需等待或轮询。', 'Continuation armed: the next turn dispatches automatically when this run settles.')));
      }
      if (thread && thread.contextCompaction) {
        // M3 (OPENBOT-UPSTREAM-ADOPTION-PLAN)：上下文压缩说明。
        var compactionNote = thread.contextCompaction;
        var compactionText = compactionNote.mode === 'token'
          ? tr('上下文按模型窗口压缩：估算 ' + capabilityValue(compactionNote.estimatedBefore) + ' → '
            + capabilityValue(compactionNote.estimatedAfter) + ' token，折叠 ' + String(compactionNote.compactedMessages || 0)
            + ' 条旧消息，保留最近 ' + String(compactionNote.keptMessages || 0) + ' 条提交给执行器；原文保留在会话存储中，估算不是计费用量。',
            'Context compacted against the model window: estimated ' + capabilityValue(compactionNote.estimatedBefore) + ' → '
            + capabilityValue(compactionNote.estimatedAfter) + ' tokens, folding ' + String(compactionNote.compactedMessages || 0)
            + ' older messages and keeping the recent ' + String(compactionNote.keptMessages || 0) + ' for the executor; originals stay in the store. Estimates are not billed usage.')
          : tr('上下文按字符回退压缩：已折叠 ' + String(compactionNote.compactedMessages || 0) + ' 条旧消息，保留最近 '
            + String(compactionNote.keptMessages || 0) + ' 条提交给执行器；原文保留在会话存储中。',
            'Context compacted with the character fallback: ' + String(compactionNote.compactedMessages || 0)
            + ' older messages folded, keeping the recent ' + String(compactionNote.keptMessages || 0)
            + ' for the executor; originals stay in the store.');
        page.body.appendChild(el('div', 'ouw-source-note', compactionText));
      }
      var visibleBots = snapshot && snapshot.bots || [];
      var participant = thread.participatingBotRef && visibleBots.find(function (bot) { return String(bot.id) === String(thread.participatingBotRef.id); });
      if (projectId) {
        renderProjectSessionCollaboration(page, detail, projectId, task, participant);
      } else if (thread.participatingBotRef) {
        // 单行化迁移：BOT 参与关系从行内移入详情。
        var participantName = participant ? safeName(participant) : String(thread.participatingBotRef.id);
        page.body.appendChild(el('div', 'ouw-source-note', tr('参与 BOT：' + participantName, 'Participating BOT: ' + participantName)));
        // M10 UI 补全：向参与 BOT 发消息（对方运行结束后自动唤醒回复）。
        page.body.appendChild(button(tr('发消息给参与 BOT…', 'Message the participating BOT…'), 'ouw-inline-action', function () { openSendBotMessageForm(page, thread); }));
      }
      if (thread && thread.pendingExecutionBinding) {
        // 单行化迁移：调优状态从行徽标移入详情。
        page.body.appendChild(el('div', 'ouw-source-note', tr('执行调优待生效：下一次执行解析时采用新配置。', 'Execution tuning pending: the new configuration applies at the next run.')));
      }
      if (thread && threadPendingMemoryProposals(thread).length > 0) {
        // M8（验收阻断③ + PI 回归修复）：同上，按长度判空。详情页展示待审提案数与内容摘要。
        var pendingForThread = threadPendingMemoryProposals(thread);
        page.body.appendChild(el('div', 'ouw-source-note', tr('该会话的 BOT 有 ' + pendingForThread.length + ' 条记忆提案待审：' + pendingForThread.map(function (proposal) { return String(proposal.text || '').slice(0, 40); }).join(' / ').slice(0, 200), 'The BOT of this thread has ' + pendingForThread.length + ' memory proposals awaiting review.')));
      }
      if (!isWritable) {
        var note = el('div', 'ouw-source-note', tr('此会话由原生聊天存储提供。', 'This thread is backed by the existing chat store.'));
        page.body.appendChild(note);
        var botRef = normalizeRef(thread.botRef);
        var bot = botRef && (snapshot.bots || []).find(function (item) { return String(item.id) === botRef.id || String(item.botId) === botRef.id; });
        if (bot) page.body.appendChild(button(tr('打开 ' + safeName(bot) + ' 对话', 'Open ' + safeName(bot) + ' chat'), 'ouw-inline-action', function () { openLegacyFromPage(String(bot.botId || bot.id), page.key); }));
      } else if (!messages.length) {
        page.body.appendChild(el('div', 'ouw-subtle-empty', tr('此会话还没有消息。', 'This thread has no messages yet.')));
      } else {
        var messageList = el('div', 'ouw-message-list');
        messages.forEach(function (message) {
          if (!message) return;
          if (message.kind === 'history-handoff') {
            var handoffMessage = renderHistoryHandoffMessage(message, thread);
            if (message.id) handoffMessage.dataset.ouwSessionMessageId = String(message.id);
            messageList.appendChild(handoffMessage);
            return;
          }
          if (message.kind === 'compaction') {
            // M3：上下文压缩摘要渲染为系统提示，不占用对话气泡。
            var compactionNote = el('div', 'ouw-source-note');
            compactionNote.setAttribute('data-ouw-compaction-message', 'true');
            if (message.id) compactionNote.dataset.ouwSessionMessageId = String(message.id);
            compactionNote.textContent = String(message.text || '');
            messageList.appendChild(compactionNote);
            return;
          }
          if (message.kind === 'bot-message' || message.kind === 'memory-change' ||
              (projectId && (message.kind === 'continuation' || message.kind === 'task-brief'))) {
            // M10/M13：跨 BOT 消息与记忆更新通知渲染为协作提示，不占用对话气泡。
            var relayNote = el('div', 'ouw-source-note');
            relayNote.setAttribute('data-ouw-relay-message', String(message.kind || ''));
            if (message.id) relayNote.dataset.ouwSessionMessageId = String(message.id);
            relayNote.textContent = (message.kind === 'continuation' ? tr('自动续办：', 'Automatic continuation: ') :
              message.kind === 'task-brief' ? tr('任务目标：', 'Task goal: ') : '') + String(message.text || '');
            messageList.appendChild(relayNote);
            return;
          }
          if (typeof message.text !== 'string') return;
          var inputAuthor = projectId && message.role === 'user' ? message.author : null;
          var human = inputAuthor && inputAuthor.kind === 'human';
          var botInput = inputAuthor && inputAuthor.kind === 'bot';
          var result = projectId && message.resultRef && message.resultAvailable === true ? message.resultRef : null;
          var botMessage = message.role === 'bot' || botInput || result;
          var item = el('article', 'ouw-message ' + (message.role === 'user' && !botInput ? 'is-user' : 'is-agent'));
          if (message.id) item.dataset.ouwSessionMessageId = String(message.id);
          var head = el('div', 'ouw-message-meta');
          var authorRef = result ? result.executorBotRef : botInput ? inputAuthor.botRef : thread.botRef;
          var executor = authorRef && visibleBots.find(function (bot) { return String(bot.id) === String(authorRef.id); });
          var roleLabel = botMessage ? (executor && safeName(executor) || (projectId && !botInput && !result && thread.executionBinding && thread.executionBinding.label) || 'Bot') :
            message.role === 'user' ? (projectId && !human ? tr('历史输入', 'Historical input') : tr('你', 'You')) :
              message.role === 'system' ? tr('系统', 'System') : message.role || tr('消息', 'Message');
          if (projectId) {
            item.dataset.ouwMessageAuthor = human ? 'human' : botMessage ? 'bot' : message.role === 'user' ? 'unverified' : 'system';
            if (human) {
              var avatar = el('span', 'ouw-message-avatar');
              avatar.dataset.ouwAccountAvatar = '';
              avatar.setAttribute('aria-hidden', 'true');
              head.appendChild(avatar);
              projectMessageAuthors.set(head, inputAuthor);
            } else if (botMessage && executor && root.OpenBotAvatars) {
              var botAvatar = el('span', 'ouw-message-avatar');
              botAvatar.setAttribute('aria-hidden', 'true');
              botAvatar.innerHTML = root.OpenBotAvatars.markup(executor.avatar, executor.color, { size: 'mini' }) || '';
              if (botAvatar.firstChild) head.appendChild(botAvatar);
            }
          }
          head.appendChild(el('span', 'ouw-message-role', roleLabel));
          if (human) paintProjectMessageAuthor(head);
          if (message.ts) head.appendChild(el('time', '', new Date(message.ts).toLocaleString()));
          item.appendChild(head);
          var messageBody;
          if (message.role === 'bot' && root.OpenBotMarkdown && typeof root.OpenBotMarkdown.render === 'function') {
            messageBody = el('div', 'ouw-message-text uw-thread-markdown');
            messageBody.appendChild(root.OpenBotMarkdown.render(message.text));
          } else messageBody = el('pre', 'ouw-message-text', message.text);
          item.appendChild(messageBody);
          renderThreadResultActions(page, detail, message, item);
          if (projectId && task && String(thread.primaryTaskId) === String(task.id) && !task.asyncTeam && !task.asyncParent &&
              message.id && (human || message.role === 'bot' && message.sourceAvailable !== false)) {
            var delegateMessage = button(tr('引用此消息委派…', 'Delegate with this message…'), 'ouw-inline-action', function () {
              openDelegateForm(task, { threadId: String(thread.id), messageId: String(message.id) });
            });
            delegateMessage.dataset.ouwProjectDelegateMessage = String(message.id);
            delegateMessage.dataset.uwThreadFocus = 'delegate:' + String(message.id);
            var delegationActions = el('div', 'uw-thread-result-actions');
            delegationActions.appendChild(delegateMessage);
            item.appendChild(delegationActions);
          }
          messageList.appendChild(item);
        });
        page.body.appendChild(messageList);
      }
      renderThreadFiles(page);
      page.body = pageBody;
      if (layered) renderSessionExecutionTimeline(page, detail, execution);
      if (isWritable) attachComposer(page, String(thread.id));
      else { switchComposerThread(''); composerHost.hidden = true; }
    }

    function renderHistoryHandoffMessage(message, thread) {
      var metadata = message.historyHandoff || thread.historyHandoff || {};
      var coverage = metadata.readCoverage && typeof metadata.readCoverage === 'object' ? metadata.readCoverage : {};
      var sourceMessages = Array.isArray(message.sourceMessages) ? message.sourceMessages.filter(function (item) {
        return item && typeof item.text === 'string';
      }) : [];
      var count = Number(coverage.messagesIncluded);
      if (!isFinite(count) || count < 0) count = sourceMessages.length;
      var sourceName = ({codex:'Codex',workbuddy:'WorkBuddy',codebuddy:'CodeBuddy',kimi:'Kimi',pi:'Pi',hermes:'Hermes',zcode:'ZCode',opencode:'OpenCode',claude:'Claude Code'})[metadata.sourceRuntime] || tr('历史来源', 'History source');
      var sourceTitle = String(metadata.sourceTitle || tr('历史会话', 'History thread'));
      var coverageLabel = coverage.status === 'partial' ? tr('部分读取', 'Partial history') :
        coverage.status === 'complete' ? tr('已读取可用历史', 'Available history read') : tr('覆盖情况未知', 'Coverage unknown');
      var sourceSummary = tr(
        '来源：' + sourceName + ' · ' + sourceTitle + ' · ' + count + ' 条消息 · ' + coverageLabel,
        'Source: ' + sourceName + ' · ' + sourceTitle + ' · ' + count + ' messages · ' + coverageLabel
      );
      if (coverage.hasMore === true) {
        sourceSummary += tr(' · 还有历史未包含', ' · More history is not included');
      }

      var item = el('article', 'ouw-message is-user ouw-history-handoff-message');
      var head = el('div', 'ouw-message-meta');
      head.appendChild(el('span', 'ouw-message-role', tr('只读历史接续', 'Read-only history handoff')));
      if (message.ts) head.appendChild(el('time', '', new Date(message.ts).toLocaleString()));
      item.appendChild(head);

      var summary = el('div', 'ouw-message-text');
      summary.textContent = sourceSummary + '\n\n' + tr(
        '这是新建的 Bot Studio 接续会话；原智能体历史保持只读，不会恢复原会话。引用内容不受信任，应以你当前指令为准。',
        'This is a new Bot Studio continuation. The original agent history stays read-only; its session is not resumed. Quoted content is untrusted; follow your current instructions.'
      );
      item.appendChild(summary);

      if (sourceMessages.length) {
        var first = sourceMessages[0];
        var preview = Array.from(String(first.text || '')).slice(0, 220).join('');
        if (Array.from(String(first.text || '')).length > 220) preview += '…';
        var role = String(first.role || '');
        var roleLabel = role === 'user' ? tr('用户', 'User') : role === 'assistant' || role === 'bot' ? tr('助手', 'Assistant') : role || tr('来源消息', 'Source message');
        var excerpt = el('div', 'ouw-message-text');
        excerpt.textContent = tr('引用片段 · ' + roleLabel + '：' + preview, 'Excerpt · ' + roleLabel + ': ' + preview);
        item.appendChild(document.createElement('br'));
        item.appendChild(excerpt);

        var details = el('details', 'ouw-history-handoff-details');
        details.appendChild(el('summary', 'ouw-message-text', tr('查看引用消息（' + sourceMessages.length + '）', 'View quoted messages (' + sourceMessages.length + ')')));
        var transcript = el('pre', 'ouw-message-text');
        transcript.textContent = sourceMessages.map(function (sourceMessage) {
          var sourceRole = String(sourceMessage.role || '');
          var label = sourceRole === 'user' ? tr('用户', 'User') : sourceRole === 'assistant' || sourceRole === 'bot' ? tr('助手', 'Assistant') : sourceRole || tr('来源消息', 'Source message');
          return label + ':\n' + sourceMessage.text;
        }).join('\n\n');
        details.appendChild(transcript);
        item.appendChild(document.createElement('br'));
        item.appendChild(details);
      }
      return item;
    }

    function renderThreadHandoff(page, detail, thread) {
      var sourceId = String(thread.continuedFromThreadId || '');
      var refs = Array.isArray(thread.handoffContextRefs) ? thread.handoffContextRefs : [];
      var threadRefs = refs.filter(function (ref) { return ref && ref.type === 'Thread' && String(ref.id || '') !== sourceId; });
      if (!sourceId && !threadRefs.length) return;
      var section = sectionBlock(tr('会话交接', 'Thread handoff'));
      var knownThreads = (detail.threads || []).concat(snapshot && snapshot.threads || []);
      function sourceFor(threadId) {
        return knownThreads.find(function (item) { return String(item.id) === String(threadId); }) || null;
      }
      function labelFor(threadId) {
        var source = sourceFor(threadId);
        return source ? safeName(source) : tr('会话 ', 'Thread ') + String(threadId);
      }
      if (sourceId) {
        var sourceThread = sourceFor(sourceId);
        var sourceButton = entityCreatorRow(tr('继续自 · ', 'Continued from · ') + labelFor(sourceId), { type: 'Thread', id: sourceId }, sourceThread && sourceThread.creator, 'ouw-handoff-source');
        sourceButton.dataset.ouwHandoffSource = sourceId;
        section.appendChild(sourceButton);
      }
      threadRefs.forEach(function (ref) {
        var id = String(ref.id || '');
        if (!id) return;
        var sourceThread = sourceFor(id);
        section.appendChild(entityCreatorRow(tr('传递上下文 · ', 'Passed context · ') + labelFor(id), { type: 'Thread', id: id }, sourceThread && sourceThread.creator, 'ouw-handoff-context'));
      });
      page.body.appendChild(section);
    }

    function openContinueThreadForm(thread, detail, page, options) {
      var explicit = options && options.explicit;
      var bots = Array.isArray(snapshot && snapshot.bots) ? snapshot.bots : [];
      if (!bots.length) { setCommandStatus(tr('当前空间没有可用的 BOT。', 'No BOT is available in this space.')); return; }
      var form = createInlineForm(tr('继续会话并传递上下文', 'Continue thread with context'));
      if (explicit) form.appendChild(el('p', 'ouw-source-note', tr('这会给所选 Bot 创建一条独立的工程会话。原会话保留。', 'This creates a separate project session for the selected Bot and keeps the original.')));
      var botField = field(tr('接收 BOT', 'Receiving BOT'), 'select', '');
      if (explicit) {
        var prompt = el('option', '', tr('请选择 Bot', 'Choose a Bot'));
        prompt.value = '';
        botField.input.appendChild(prompt);
      }
      bots.forEach(function (bot) {
        var option = el('option', '', safeName(bot));
        option.value = String(bot.id);
        botField.input.appendChild(option);
      });
      var sourceBot = normalizeRef(thread.botRef);
      if (!explicit && sourceBot) {
        var matchingBot = bots.find(function (bot) { return String(bot.id) === sourceBot.id || String(bot.botId) === sourceBot.id; });
        if (matchingBot) botField.input.value = String(matchingBot.id);
      }
      var title = field(tr('新会话标题（可选）', 'New thread title (optional)'), 'text', safeName(thread));
      form.append(botField.wrap, title.wrap);

      var contextSection = el('fieldset', 'ouw-context-choice-list');
      contextSection.appendChild(el('legend', '', tr('传递这些引用', 'Pass these references')));
      contextSection.appendChild(el('div', 'ouw-codex-readonly-note', tr(
        '只列出当前会话已载入的消息和已验证的文件引用。不会自动纳入其他会话或私人对话；每次最多选择 30 个引用，每个会话最多选择 30 条消息。',
        'Only messages loaded for this conversation and verified file references are listed. Other conversations and private chats are never added automatically. Select up to 30 references and up to 30 messages per conversation.'
      )));
      var selectionSummary = el('div', 'ouw-codex-readonly-note');
      contextSection.appendChild(selectionSummary);
      var messageChoices = document.createElement('fieldset');
      messageChoices.className = 'ouw-context-choice-list';
      messageChoices.appendChild(el('legend', '', tr('当前会话的已载入消息', 'Loaded messages in this conversation')));
      var messageItems = Array.isArray(detail && detail.messages) ? detail.messages.filter(function (message) {
        return message && message.id !== undefined && message.id !== null && typeof message.text === 'string' && message.text.trim() &&
          message.sourceAvailable !== false && message.resultAvailable !== false;
      }) : [];
      var defaultMessageStart = Math.max(0, messageItems.length - 30);
      var fileCandidates = new Map();
      var fileChoices = document.createElement('fieldset');
      fileChoices.className = 'ouw-context-choice-list';
      fileChoices.appendChild(el('legend', '', tr('已验证的文件版本', 'Verified file versions')));
      var verifiedRoots = new Map();
      (snapshot && Array.isArray(snapshot.roots) ? snapshot.roots : []).forEach(function (rootItem) {
        if (rootItem && rootItem.id !== undefined && rootItem.id !== null) verifiedRoots.set(String(rootItem.id), rootItem);
      });
      (Array.isArray(detail && detail.contextSnapshots) ? detail.contextSnapshots : []).forEach(function (snapshotItem) {
        (Array.isArray(snapshotItem && snapshotItem.items) ? snapshotItem.items : []).forEach(function (item) {
          var sourceRef = item && item.sourceRef || {};
          if (!item || item.redacted === true || item.evidence !== 'authorized-preview' || sourceRef.sourceType !== 'file' ||
              sourceRef.nativeId === undefined || sourceRef.nativeId === null || !sourceRef.storeId) return;
          var rootId = String(sourceRef.storeId);
          var rootItem = verifiedRoots.get(rootId);
          var revision = item.sourceRevision !== undefined && item.sourceRevision !== null ? item.sourceRevision : item.revision;
          if (!rootItem || revision === undefined || revision === null || !String(revision).trim()) return;
          if (typeof revision === 'number' && (!isFinite(revision) || revision < 0)) return;
          var fileId = String(sourceRef.nativeId);
          var line = item.range && Number.isInteger(Number(item.range.startLine)) && Number(item.range.startLine) > 0 ? Number(item.range.startLine) : undefined;
          var key = [rootId, fileId, String(revision), line || ''].join(':');
          if (fileCandidates.has(key)) return;
          var pathLabel = item.relativePath || item.filePath || sourceRef.relativePath || sourceRef.path || '';
          var fileLabel = pathLabel ? String(pathLabel).split(/[\\/]/).filter(Boolean).slice(-2).join('/') : tr('文件 ', 'File ') + fileId.slice(0, 14);
          var rootName = safeName(rootItem);
          var ref = { type: 'FileRef', id: fileId, rootId: rootId, revision: revision };
          if (line) ref.line = line;
          fileCandidates.set(key, { ref: ref, label: tr('文件 · ', 'File · ') + rootName + ' · ' + fileLabel, key: key });
        });
      });

      function selectedMessageInputs() {
        return Array.prototype.slice.call(messageChoices.querySelectorAll('input[type="checkbox"][data-ouw-context-kind="message"]:checked'));
      }
      function selectedFileInputs() {
        return Array.prototype.slice.call(fileChoices.querySelectorAll('input[type="checkbox"][data-ouw-context-kind="file"]:checked'));
      }
      function selectedContextRefCount() {
        return (selectedMessageInputs().length ? 1 : 0) + selectedFileInputs().length;
      }
      function updateContextSummary() {
        selectionSummary.textContent = tr(
          '已选 ' + selectedMessageInputs().length + '/30 条消息，' + selectedFileInputs().length + ' 个文件引用；共 ' + selectedContextRefCount() + '/30 个引用。',
          selectedMessageInputs().length + '/30 messages and ' + selectedFileInputs().length + ' file references selected; ' + selectedContextRefCount() + '/30 references total.'
        );
      }
      function onContextChoiceChange(input) {
        var selectedMessages = selectedMessageInputs();
        var tooManyMessages = selectedMessages.length > 30;
        var tooManyRefs = selectedContextRefCount() > 30;
        if (tooManyMessages || tooManyRefs) {
          input.checked = false;
          showStatus(form.querySelector('.ouw-form-status'), tooManyMessages
            ? tr('每个会话最多选择 30 条消息。', 'Select no more than 30 messages per conversation.')
            : tr('每次最多选择 30 个上下文引用。', 'Select no more than 30 context references.'), 'error');
        } else showStatus(form.querySelector('.ouw-form-status'), '', '');
        updateContextSummary();
      }
      function appendContextChoice(container, kind, id, labelText, checked, fileKey) {
        var label = el('label', 'ouw-context-choice');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!checked;
        checkbox.dataset.ouwContextKind = kind;
        if (kind === 'message') checkbox.dataset.ouwContextMessageId = id;
        else checkbox.dataset.ouwContextFileKey = fileKey;
        checkbox.addEventListener('change', function () { onContextChoiceChange(checkbox); });
        label.append(checkbox, el('span', '', labelText));
        container.appendChild(label);
      }
      if (messageItems.length) {
        messageItems.forEach(function (message, index) {
          var text = String(message.text || '').replace(/\s+/g, ' ').trim();
          var chars = Array.from(text);
          var preview = chars.slice(0, 180).join('') + (chars.length > 180 ? '…' : '');
          var role = String(message.role || tr('消息', 'Message'));
          var time = message.ts ? new Date(message.ts).toLocaleString() : '';
          var labelText = [role, time, preview].filter(Boolean).join(' · ');
          appendContextChoice(messageChoices, 'message', String(message.id), labelText, !explicit && index >= defaultMessageStart);
        });
      } else messageChoices.appendChild(el('div', 'ouw-subtle-empty', tr('此会话没有可选的已载入消息。', 'This conversation has no loaded messages to select.')));
      if (fileCandidates.size) {
        fileCandidates.forEach(function (entry) {
          appendContextChoice(fileChoices, 'file', entry.key, entry.label, false, entry.key);
        });
      } else fileChoices.appendChild(el('div', 'ouw-subtle-empty', tr('没有同时具备可用根目录和文件版本的已验证文件引用。', 'No verified file references with both an available root and file revision are recorded.')));
      contextSection.append(messageChoices, fileChoices);
      updateContextSummary();
      form.appendChild(contextSection);
      var submit = button(tr('创建继续会话', 'Create continued thread'), 'ouw-primary-action', function (event) {
        var selectedBot = bots.find(function (bot) { return String(bot.id) === botField.input.value; });
        if (!selectedBot) { botField.input.focus(); return; }
        var selectedRefs = [];
        var messageIds = selectedMessageInputs().map(function (checkbox) { return String(checkbox.dataset.ouwContextMessageId || ''); }).filter(Boolean);
        if (messageIds.length > 30) {
          showStatus(form.querySelector('.ouw-form-status'), tr('每个会话最多选择 30 条消息。', 'Select no more than 30 messages per conversation.'), 'error');
          return;
        }
        if (messageIds.length) selectedRefs.push({ type: 'Thread', id: String(thread.id), messageIds: messageIds });
        selectedFileInputs().forEach(function (checkbox) {
          var candidate = fileCandidates.get(String(checkbox.dataset.ouwContextFileKey || ''));
          if (candidate) selectedRefs.push(candidate.ref);
        });
        if (!selectedRefs.length) {
          showStatus(form.querySelector('.ouw-form-status'), tr('请选择当前会话中的消息或已验证文件引用。', 'Select messages from this conversation or a verified file reference.'), 'error');
          return;
        }
        if (selectedRefs.length > 30) {
          showStatus(form.querySelector('.ouw-form-status'), tr('每次最多选择 30 个上下文引用。', 'Select no more than 30 context references.'), 'error');
          return;
        }
        runCommand('continueThread', {
          threadId: String(thread.id),
          botRef: { type: 'BotInstanceRef', id: String(selectedBot.id) },
          title: title.input.value.trim() || undefined,
          contextRefs: selectedRefs
        }, function (result) {
          closeForm(form);
          refresh().then(function () { if (result.entity && result.entity.id) openEntity({ type: 'Thread', id: result.entity.id }); });
        }, form, event.currentTarget);
      });
      form.appendChild(submit);
      page.body.prepend(form);
      title.input.focus();
    }

    function openLegacyFromPage(botId, pageKey) {
      legacyReturnPageKey = pageKey;
      legacyHop = true;
      showWorkspace(false);
      // 单行化 #5：同上，清当前页标识并同步行高亮。
      currentPageKey = '';
      updateSidebarCurrent();
      setSwitcherState();
      try { openBot(botId); } catch (error) { setCommandStatus(messageForError(error), 'error'); }
    }

    function renderFilePage(page) {
      var file = page.file || {};
      var result = file.result || {};
      var hasPreviewText = typeof result.text === 'string' || typeof result.content === 'string' || typeof result.body === 'string';
      if (!hasPreviewText && page.detail && page.detail.entity) {
        page.body.appendChild(el('div', 'ouw-entity-meta', page.detail.entity.type || 'FileRef'));
        var reason = file.historicalChanged
          ? tr('此历史引用对应的文件内容已变化。保留历史上下文证据，未以当前文件内容替代。', 'The file content has changed since this historical reference. Its saved context evidence is retained; current file content is not substituted.')
          : tr('此引用尚未验证当前文件位置或版本。没有读取当前文件内容。', 'The current location or revision for this reference has not been verified. No current file content was read.');
        page.body.appendChild(el('div', 'ouw-page-empty', reason));
        if (file.relativePath || file.rootId) page.body.appendChild(el('div', 'ouw-file-meta', [file.relativePath, file.rootId && ('Root ' + file.rootId)].filter(Boolean).join(' · ')));
        var historicalText = typeof file.historicalText === 'string' ? file.historicalText : page.ref.historicalText;
        if (typeof historicalText === 'string' && historicalText.length) {
          var sourceRevision = file.sourceRevision !== undefined ? file.sourceRevision : page.ref.sourceRevision;
          if (sourceRevision !== undefined) page.body.appendChild(el('div', 'ouw-file-meta', tr('保存的上下文片段 · 文件版本 ', 'Saved context excerpt · File revision ') + sourceRevision));
          if (file.historicalTruncated || page.ref.historicalTruncated) page.body.appendChild(el('div', 'ouw-row-meta', tr('历史片段已截断', 'Historical excerpt was truncated')));
          page.body.appendChild(el('pre', 'ouw-file-content', historicalText));
        }
        renderRelations(page, page.detail);
        renderActivity(page, page.detail);
        renderRuns(page, page.detail);
        renderContextSnapshots(page, page.detail);
        return;
      }
      var path = result.relativePath || file.relativePath || page.ref.relativePath || '';
      var meta = el('div', 'ouw-file-meta');
      if (path) meta.appendChild(el('span', '', path));
      if (result.hostId || file.hostId) meta.appendChild(el('span', '', result.hostId || file.hostId));
      if (result.revision !== undefined || file.revision !== undefined) meta.appendChild(el('span', '', tr('文件版本 ', 'File revision ') + (result.revision !== undefined ? result.revision : file.revision)));
      if (result.lineStart !== undefined && result.lineEnd !== undefined && result.totalLines !== undefined) {
        meta.appendChild(el('span', '', tr('行 ' + result.lineStart + '–' + result.lineEnd + ' / ' + result.totalLines, 'Lines ' + result.lineStart + '–' + result.lineEnd + ' / ' + result.totalLines)));
      }
      page.body.appendChild(meta);
      if (file.identityVerified === true && file.historicalChanged !== true) {
        var collaboration = renderFileParticipation(page);
        if (collaboration) page.body.appendChild(collaboration);
        requestFileParticipation(page, false);
      }
      var content = result.content !== undefined ? result.content : result.text !== undefined ? result.text : result.body;
      if (typeof content !== 'string') {
        page.body.appendChild(el('div', 'ouw-page-error', tr('预览服务未返回可显示的文本内容。', 'The preview service did not return displayable text content.')));
      } else {
        var pre = el('pre', 'ouw-file-content', content);
        page.body.appendChild(pre);
        if (file.line) pre.dataset.focusLine = String(Math.max(1, Number(file.line) - Number(result.lineStart || 1) + 1));
      }
      var actions = el('div', 'ouw-file-actions');
      var openButton = button(tr('在原应用中打开', 'Open in original app'), 'ouw-inline-action', function () { openFileInApp(page, file); });
      openButton.disabled = !file.rootId || !file.fileId || file.identityVerified !== true || file.historicalChanged === true;
      actions.appendChild(openButton);
      if (!openButton.disabled) renderFileDeliverablePicker(actions, file);
      page.body.appendChild(actions);
    }

    function renderFileDeliverablePicker(host, file) {
      var disclosure = el('details', 'ouw-file-deliverable');
      disclosure.appendChild(el('summary', 'ouw-inline-action', tr('关联到任务', 'Associate with task')));
      var tasks = Array.isArray(snapshot && snapshot.tasks) ? snapshot.tasks : [];
      if (!tasks.length) {
        disclosure.appendChild(emptyState(tr('当前空间没有可关联的任务。', 'There are no tasks in this space to associate.')));
        host.appendChild(disclosure);
        return;
      }
      var form = el('form', 'ouw-inline-form ouw-file-deliverable-form');
      var formStatus = el('div', 'ouw-form-status');
      formStatus.hidden = true;
      form.appendChild(formStatus);
      var note = el('div', 'ouw-source-note', tr('关联此文件版本作为任务交付，不会把文件内容发送给 AI。', 'This records a user-confirmed deliverable association without sending file contents to AI.'));
      form.appendChild(note);
      var taskField = field(tr('任务', 'Task'), 'select', '');
      var prompt = el('option', '', tr('选择任务…', 'Choose a task…'));
      prompt.value = '';
      prompt.disabled = true;
      prompt.selected = true;
      taskField.input.appendChild(prompt);
      tasks.forEach(function (task) {
        var option = el('option', '', safeName(task));
        option.value = String(task.id);
        taskField.input.appendChild(option);
      });
      form.appendChild(taskField.wrap);
      var submit = el('button', 'ouw-primary-action', tr('确认关联交付文件', 'Confirm deliverable association'));
      submit.type = 'submit';
      submit.disabled = true;
      taskField.input.addEventListener('change', function () { submit.disabled = !taskField.input.value; });
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var task = tasks.find(function (item) { return String(item.id) === taskField.input.value; });
        if (submit.disabled || !task || file.revision === undefined || file.revision === null) return;
        runCommand('attachArtifact', { taskId: String(task.id), rootId: String(file.rootId), fileId: String(file.fileId), revision: file.revision }, function () {
          disclosure.open = false;
          openEntity({ type: 'WorkTask', id: String(task.id) });
        }, form, submit);
      });
      form.appendChild(submit);
      disclosure.appendChild(form);
      host.appendChild(disclosure);
    }

    function openFileInApp(page, file) {
      if (!bridge || typeof bridge.unifiedWorkspaceOpenFile !== 'function') { setCommandStatus(tr('原应用打开服务尚不可用。', 'Opening the original file is not available yet.'), 'error'); return; }
      var currentScope = getCurrentScope();
      if (!currentScope) return;
      Promise.resolve(bridge.unifiedWorkspaceOpenFile({ spaceId: currentScope.spaceId, rootId: file.rootId, fileId: file.fileId, expectedRevision: file.revision, scopeRevision: currentScope.scopeRevision })).then(function (result) {
        if (!sameScope(currentScope, getCurrentScope())) return;
        if (!validResponse(result, currentScope)) throw new Error(messageForError(result, tr('无法在原应用中打开。', 'Unable to open this file in its original app.')));
        setCommandStatus(tr('已在原应用中打开。', 'Opened in the original app.'), 'muted');
      }).catch(function (error) { setCommandStatus(messageForError(error), 'error'); });
    }

    function renderRelations(page, detail, options) {
      options = options || {};
      var relations = Array.isArray(detail.relations) ? detail.relations : [];
      if (typeof options.filter === 'function') relations = relations.filter(options.filter);
      if (options.skipEmpty && !relations.length) return;
      var section = sectionBlock(tr('关联与来源', 'Relations and sources'));
      if (!relations.length) {
        section.appendChild(el('div', 'ouw-subtle-empty', tr('当前没有可显示的关联记录。', 'No relation records are available.')));
      } else {
        relations.forEach(function (relation) {
          var row = el('div', 'ouw-relation-row');
          var predicate = relationLabels[relation.predicate];
          row.appendChild(el('span', 'ouw-relation-type', predicate ? tr(predicate[0], predicate[1]) : String(relation.predicate || tr('关联', 'Relation'))));
          var left = relation.subjectLabel || relation.subjectRef && (relation.subjectRef.name || relation.subjectRef.id) || '';
          var right = relation.objectLabel || relation.objectRef && (relation.objectRef.name || relation.objectRef.id) || '';
          var targetRef = normalizeRef(relation.subjectRef) && refKey(relation.subjectRef) !== refKey(page.ref) ? relation.subjectRef : relation.objectRef;
          var targetLabel = refKey(targetRef) === refKey(relation.subjectRef) ? left : right;
          var relationLink = button(targetLabel || tr('未知对象', 'Unknown object'), 'ouw-relation-link', function () { openEntity(targetRef); });
          relationLink.dataset.ouwRelationPredicate = String(relation.predicate || '');
          relationLink.dataset.ouwRelationTarget = refKey(targetRef);
          row.appendChild(relationLink);
          if (relation.evidence) row.appendChild(el('span', 'ouw-relation-evidence', relation.evidence.kind || tr('已记录证据', 'Evidence recorded')));
          if (relation.endedAt) row.appendChild(el('span', 'ouw-relation-ended', tr('已结束 · ', 'Ended · ') + new Date(relation.endedAt).toLocaleString()));
          else if (relation.id && isExplicitRelation(relation.predicate)) row.appendChild(button(tr('解除', 'Unlink'), 'ouw-unlink-action', function (event) { endRelation(page, relation, event.currentTarget); }));
          section.appendChild(row);
        });
      }
      (options.target || page.body).appendChild(section);
    }

    function isExplicitRelation(predicate) {
      return ['bot_owns_project', 'bot_participates_project', 'project_binds_root', 'task_in_project', 'task_uses_thread', 'task_delegates_task', 'bot_owns_root'].indexOf(predicate) >= 0;
    }

    function activeRelationExists(detail, predicate, subjectRef, objectRef) {
      return (detail.relations || []).some(function (relation) {
        return !relation.endedAt && relation.predicate === predicate && refKey(relation.subjectRef) === refKey(subjectRef) && refKey(relation.objectRef) === refKey(objectRef);
      });
    }

    function renderRelationPicker(section, page, config) {
      var available = (config.options || []).filter(function (item) {
        if (!item || !item.id) return false;
        var subject = config.subject(item), object = config.object(item);
        return !activeRelationExists(page.detail || {}, config.predicate, subject, object);
      });
      if (!available.length) {
        section.appendChild(el('div', 'ouw-subtle-empty', (config.options || []).length ? tr('可关联的对象已全部关联。', 'All available objects are already linked.') : tr('当前没有可关联对象。', 'No objects are available to link.')));
        return;
      }
      var form = createInlineForm(config.label);
      var selectField = field(config.label, 'select', '');
      var prompt = el('option', '', tr('选择…', 'Choose…')); prompt.value = ''; prompt.disabled = true; prompt.selected = true;
      selectField.input.appendChild(prompt);
      available.forEach(function (item) {
        var option = el('option', '', config.optionLabel ? config.optionLabel(item) : safeName(item));
        option.value = String(item.id);
        selectField.input.appendChild(option);
      });
      form.appendChild(selectField.wrap);
      var submit = button(tr('关联', 'Associate'), 'ouw-primary-action', function () {
        var selected = available.find(function (item) { return String(item.id) === selectField.input.value; });
        if (!selected) { selectField.input.focus(); return; }
        var subjectRef = config.subject(selected), objectRef = config.object(selected);
        runCommand('relate', { subjectRef: subjectRef, predicate: config.predicate, objectRef: objectRef }, function () {
          closeForm(form);
          refresh();
        }, form, submit);
      });
      form.appendChild(submit);
      section.appendChild(form);
    }

    function endRelation(page, relation, actionNode) {
      runCommand('endRelation', { relationId: String(relation.id) }, function () { refresh(); }, actionNode && actionNode.parentNode, actionNode);
    }

    function renderActivity(page, detail) {
      var activities = Array.isArray(detail.activities) ? detail.activities : [];
      if (!activities.length) return;
      var section = sectionBlock(tr('活动记录', 'Activity'));
      activities.forEach(function (event) {
        var row = el('div', 'ouw-activity-row');
        var approvalId = String(event && (event.approvalId || event.evidence && event.evidence.approvalId) || '');
        if (approvalId) row.dataset.ouwSessionApprovalId = approvalId;
        row.appendChild(el('span', 'ouw-activity-action', event.action || event.kind || tr('活动', 'Activity')));
        var actor = event.actorRef || {};
        var actorLabel = actor.type && actor.id ? actor.type + ' · ' + actor.id : [actor.sourceType, actor.nativeId || actor.storeId].filter(Boolean).join(' · ');
        if (actorLabel) row.appendChild(el('span', 'ouw-activity-source', actorLabel));
        if (event.occurredAt || event.ts) row.appendChild(el('time', '', new Date(event.occurredAt || event.ts).toLocaleString()));
        var evidenceLabel = typeof event.evidence === 'string' ? event.evidence : event.evidence && (event.evidence.kind || event.evidence.label);
        if (evidenceLabel) row.appendChild(el('span', 'ouw-activity-evidence', evidenceLabel));
        if (approvalId) row.appendChild(el('span', 'ouw-activity-evidence', tr('审批 ID ', 'Approval ID ') + approvalId));
        section.appendChild(row);
      });
      page.body.appendChild(section);
    }

    function renderRuns(page, detail) {
      var runs = Array.isArray(detail.runs) ? detail.runs : [];
      if (!runs.length) return;
      var section = sectionBlock(tr('执行记录', 'Runs'));
      runs.forEach(function (run) {
        var row = el('div', 'ouw-run-row');
        var runId = String(run.id || run.runId || '');
        var openButton = button(tr('查看执行记录 ', 'Open run ') + (runId || tr('来源未记录', 'source not recorded')), 'ouw-run-open', function () {
          if (runId) openEntity({ type: 'Run', id: runId });
        });
        openButton.setAttribute('aria-label', tr('查看执行记录 ' + (runId || '未记录'), 'Open run details ' + (runId || 'not recorded')));
        row.appendChild(openButton);
        row.appendChild(el('span', 'ouw-status-pill', formatStatus(run.status)));
        if (run.returnStatus) row.appendChild(el('span', 'ouw-status-pill', formatStatus(run.returnStatus)));
        if (run.outputStatus) row.appendChild(el('span', 'ouw-status-pill', tr('输出：', 'Output: ') + formatStatus(run.outputStatus)));
        if (run.startedAt || run.createdAt) row.appendChild(el('time', '', new Date(run.startedAt || run.createdAt).toLocaleString()));
        var evidence = run.modelEvidence && typeof run.modelEvidence === 'object' ? run.modelEvidence : {};
        var evidenceRow = el('div', 'ouw-run-evidence');
        appendRunField(evidenceRow, tr('请求', 'Requested'), evidence.requested || tr('未记录', 'Not recorded'));
        appendRunField(evidenceRow, tr('解析', 'Resolved'), evidence.resolved || tr('未记录', 'Not recorded'));
        appendRunField(evidenceRow, tr('执行器报告', 'Executor-reported'), evidence.reported || tr('执行器未报告', 'Executor did not report'));
        if (evidence.providerId) appendRunField(evidenceRow, tr('提供方', 'Provider'), evidence.providerId);
        if (evidence.observedAt) appendRunField(evidenceRow, tr('观察时间', 'Observed at'), new Date(evidence.observedAt).toLocaleString());
        row.appendChild(evidenceRow);
        var runIdForLinks = runId;
        if (run.rootId) {
          var configured = el('div', 'ouw-run-capability', tr('配置目录：', 'Configured folder: '));
          configured.appendChild(button(String(run.rootId), 'ouw-relation-link', function () { openEntity({ type: 'RootBinding', id: String(run.rootId) }); }));
          row.appendChild(configured);
          row.appendChild(el('div', 'ouw-run-capability', tr('实际读取或修改文件尚无证据；请打开执行记录核对回执。', 'Actual file reads or modifications are not evidenced here; open the Run record to inspect receipts.')));
        }
        if (!run.nativeSessionId) row.appendChild(el('span', 'ouw-run-meta', tr('原生会话未记录', 'Native session not recorded')));
        if (run.returnStatus === 'needs_repair' && runIdForLinks) {
          row.appendChild(button(tr('修复回传…', 'Repair return…'), 'ouw-link-button', function () { openEntity({ type: 'Run', id: runIdForLinks }); }));
        }
        section.appendChild(row);
      });
      page.body.appendChild(section);
    }

    function renderContextSnapshots(page, detail) {
      var snapshots = Array.isArray(detail.contextSnapshots) ? detail.contextSnapshots : [];
      if (!snapshots.length) return;
      var section = sectionBlock(tr('上下文来源', 'Context sources'));
      snapshots.forEach(function (snapshotItem) {
        var disclosure = document.createElement('details');
        disclosure.className = 'ouw-context-snapshot';
        var summary = el('summary', '', tr('上下文清单', 'Context snapshot'));
        if (snapshotItem.completeness) summary.appendChild(el('span', 'ouw-row-meta', formatStatus(snapshotItem.completeness)));
        if (snapshotItem.collectedAt) summary.appendChild(el('span', 'ouw-row-meta', new Date(snapshotItem.collectedAt).toLocaleString()));
        disclosure.appendChild(summary);
        if (snapshotItem.executorInternalContext) {
          disclosure.appendChild(el('div', 'ouw-context-item-unavailable', snapshotItem.executorInternalContext === 'unavailable'
            ? tr('执行器内部上下文不可用；清单只说明本应用提交的内容。', 'Executor-internal context is unavailable; this manifest describes only content submitted by OpenBot.')
            : tr('执行器内部上下文：', 'Executor-internal context: ') + String(snapshotItem.executorInternalContext)));
        }
        (snapshotItem.items || []).forEach(function (item) {
          var sourceRef = item.sourceRef || {};
          var itemDisclosure = document.createElement('details');
          itemDisclosure.className = 'ouw-context-item';
          var itemSummary = el('summary', 'ouw-context-kind', item.sourceKind || item.sourceType || item.kind || tr('来源', 'Source'));
          itemSummary.appendChild(el('span', 'ouw-status-pill', contextInclusion(item.inclusion)));
          if (item.truncated === true) itemSummary.appendChild(el('span', 'ouw-status-pill', tr('已截断', 'Truncated')));
          if (item.redacted === true) itemSummary.appendChild(el('span', 'ouw-status-pill', tr('来源不可用', 'Source unavailable')));
          itemDisclosure.appendChild(itemSummary);
          var itemBody = el('div', 'ouw-context-item-body');
          if (item.redacted === true) {
            itemBody.appendChild(el('div', 'ouw-context-item-unavailable', tr('来源已撤权或不可访问；原始内容未显示。', 'The source is revoked or unavailable; its original content is not shown.')));
            if (item.reason) itemBody.appendChild(el('div', 'ouw-context-item-meta', tr('原因：', 'Reason: ') + String(item.reason)));
          } else {
            var sourceLabel = [sourceRef.sourceType, sourceRef.storeId, sourceRef.nativeId].filter(Boolean).join(' · ');
            if (sourceLabel) itemBody.appendChild(el('div', 'ouw-context-item-meta', tr('来源：', 'Source: ') + sourceLabel));
            if (item.revision !== undefined) itemBody.appendChild(el('div', 'ouw-context-item-meta', tr('来源版本 ', 'Source revision ') + item.revision));
            if (item.sourceRevision !== undefined && item.sourceRevision !== item.revision) itemBody.appendChild(el('div', 'ouw-context-item-meta', tr('文件版本 ', 'File revision ') + item.sourceRevision));
            if (item.digest) itemBody.appendChild(el('div', 'ouw-context-item-meta', tr('摘要 SHA-256：', 'SHA-256 digest: ') + item.digest));
            if (item.range !== undefined && item.range !== null) itemBody.appendChild(el('div', 'ouw-context-item-meta', tr('范围：', 'Range: ') + JSON.stringify(item.range)));
            if (item.accessScope) itemBody.appendChild(el('div', 'ouw-context-item-meta', tr('授权范围：', 'Access scope: ') + String(item.accessScope)));
            if (item.accessState) itemBody.appendChild(el('div', 'ouw-context-item-meta', tr('访问状态：', 'Access state: ') + formatStatus(item.accessState)));
            if (item.evidence) itemBody.appendChild(el('div', 'ouw-context-item-meta', tr('证据：', 'Evidence: ') + String(item.evidence)));
            if (item.text !== undefined && item.text !== null) {
              var textDisclosure = document.createElement('details');
              var textSummary = el('summary', '', tr('展开提交的来源文本', 'Expand submitted source text'));
              textDisclosure.appendChild(textSummary);
              textDisclosure.appendChild(el('pre', 'ouw-context-text', String(item.text)));
              itemBody.appendChild(textDisclosure);
            }
          }
          if (item.redacted !== true && (sourceRef.sourceType === 'file' || item.kind === 'file_fragment' || item.sourceKind === 'file_fragment') && sourceRef.nativeId && sourceRef.storeId) {
            itemBody.appendChild(button(tr('验证并预览文件', 'Verify and preview file'), 'ouw-link-button', function () {
              openEntity({ type: 'FileRef', id: String(sourceRef.nativeId), rootId: String(sourceRef.storeId),
                sourceRevision: item.sourceRevision !== undefined ? item.sourceRevision : item.revision,
                sourceRange: item.range || null, historicalText: typeof item.text === 'string' ? item.text : '',
                historicalTruncated: item.truncated === true, line: item.range && item.range.startLine });
            }));
          }
          itemDisclosure.appendChild(itemBody);
          disclosure.appendChild(itemDisclosure);
        });
        section.appendChild(disclosure);
      });
      page.body.appendChild(section);
    }

    function contextInclusion(value) {
      var labels = {
        planned: ['计划提交', 'Planned'],
        submitted: ['已提交', 'Submitted'],
        confirmed: ['已确认', 'Confirmed'],
        tool_read: ['工具实际读取', 'Read by tool']
      };
      var entry = labels[String(value || '').toLowerCase()];
      return entry ? tr(entry[0], entry[1]) : tr('纳入状态未记录', 'Inclusion status not recorded');
    }

    function sectionHeading(label) { return el('div', 'ouw-section-heading', label); }
    function emptyState(label) { return el('div', 'ouw-empty-state', label); }
    function sectionBlock(label) { var section = el('section', 'ouw-detail-section'); section.appendChild(el('h2', 'ouw-detail-heading', label)); return section; }
    function uniqueBy(list, keyFn) { var seen = Object.create(null); return list.filter(function (item) { var key = keyFn(item); if (seen[key]) return false; seen[key] = true; return true; }); }

    function openCreateProjectForm() {
      var form = createInlineForm(tr('新建项目', 'Create project'));
      var name = field(tr('名称', 'Name'), 'text', tr('项目名称', 'Project name'));
      var description = field(tr('目标说明', 'Goal description'), 'textarea', tr('此项目要完成什么？', 'What should this project accomplish?'));
      form.append(name.wrap, description.wrap);
      form.appendChild(button(tr('创建项目', 'Create project'), 'ouw-primary-action', function () {
        var value = name.input.value.trim();
        if (!value) { name.input.focus(); return; }
        runCommand('createProject', { name: value, description: description.input.value.trim() }, function (result) {
          closeForm(form); refresh().then(function () { if (result.entity && result.entity.id) openEntity({ type: 'Project', id: result.entity.id }); });
        }, form);
      }, 'ouw-primary-action'));
      listMount.prepend(form);
      name.input.focus();
    }

    function openCreateTaskForm(projectId) {
      var form = createInlineForm(tr('新建任务', 'Create task'));
      var goal = field(tr('任务目标', 'Task goal'), 'textarea', tr('描述可验收的结果', 'Describe a verifiable outcome'));
      var ownerField = field(tr('负责人 BOT', 'Owner BOT'), 'select', '');
      var bots = Array.isArray(snapshot && snapshot.bots) ? snapshot.bots : [];
      bots.forEach(function (bot) { var option = el('option', '', safeName(bot)); option.value = String(bot.id); ownerField.input.appendChild(option); });
      if (!bots.length) ownerField.input.disabled = true;
      var criteria = field(tr('验收要求', 'Acceptance criteria'), 'textarea', tr('可选', 'Optional'));
      form.append(goal.wrap, ownerField.wrap, criteria.wrap);
      form.appendChild(button(tr('创建任务', 'Create task'), 'ouw-primary-action', function () {
        var selectedBot = bots.find(function (bot) { return String(bot.id) === ownerField.input.value; });
        if (!goal.input.value.trim() || !selectedBot) { goal.input.focus(); return; }
        runCommand('createTask', {
          goal: goal.input.value.trim(),
          ownerBotRef: { type: selectedBot.type || 'BotInstanceRef', id: String(selectedBot.id) },
          primaryProjectId: projectId || null,
          acceptanceCriteria: criteria.input.value.trim()
        }, function (result) {
          closeForm(form); refresh().then(function () { if (result.entity && result.entity.id) openEntity({ type: 'WorkTask', id: result.entity.id }); });
        }, form);
      }, 'ouw-primary-action'));
      listMount.prepend(form);
      goal.input.focus();
    }

    function openCreateThreadForm(projectId) {
      if (projectId && typeof projectId !== 'string') projectId = '';
      projectId = String(projectId || '');
      var form = createInlineForm(tr('新建任务会话', 'New task session'));
      form.dataset.ouwThreadCreateForm = 'true';
      var title = field(tr('会话标题', 'Thread title'), 'text', tr('新任务会话', 'New task session'));
      title.input.dataset.ouwThreadTitle = 'true';
      title.input.value = tr('新任务会话', 'New task session');

      var projectField = field(tr('所属工程', 'Project'), 'select', '');
      projectField.input.dataset.ouwThreadProjectChoice = 'true';
      var projectPrompt = el('option', '', tr('选择工程…', 'Choose a project…'));
      projectPrompt.value = '';
      projectPrompt.disabled = true;
      projectPrompt.selected = !projectId;
      projectField.input.appendChild(projectPrompt);
      (snapshot && snapshot.projects || []).forEach(function (project) {
        var option = el('option', '', safeName(project));
        option.value = String(project.id);
        projectField.input.appendChild(option);
      });
      if (projectId && !(snapshot && snapshot.projects || []).some(function (item) { return String(item.id) === projectId; })) {
        var knownProject = projectSummaryFor(projectId);
        var fallbackProject = el('option', '', safeName(knownProject && knownProject.entity || { id: projectId }));
        fallbackProject.value = projectId;
        projectField.input.appendChild(fallbackProject);
      }
      projectField.input.value = projectId;
      projectField.input.disabled = !!projectId;

      var executorField = field(tr('智能体', 'Agent'), 'select', '');
      executorField.input.dataset.ouwThreadExecutorChoice = 'true';
      var defaultChoiceId = 'default';
      var defaultChoice = el('option', '', tr('默认（DSH）', 'Default (DSH)'));
      defaultChoice.value = defaultChoiceId;
      executorField.input.appendChild(defaultChoice);
      executorField.input.value = defaultChoiceId;

      var taskField = field(tr('关联任务（可选）', 'Task (optional)'), 'select', '');
      taskField.input.dataset.ouwThreadTaskChoice = 'true';
      var botField = field(tr('参与 BOT（可选）', 'Participating BOT (optional)'), 'select', '');
      botField.input.dataset.ouwThreadBotChoice = 'true';
      var noBot = el('option', '', tr('暂不绑定', 'No BOT yet'));
      noBot.value = '';
      botField.input.appendChild(noBot);
      (snapshot && snapshot.bots || []).forEach(function (bot) {
        if (!bot || !bot.id) return;
        var option = el('option', '', safeName(bot));
        option.value = String(bot.id);
        botField.input.appendChild(option);
      });
      var rootField = field(tr('工作目录', 'Working folder'), 'select', '');
      rootField.input.dataset.ouwThreadRootChoice = 'true';
      form.append(projectField.wrap, title.wrap, executorField.wrap, botField.wrap, taskField.wrap, rootField.wrap);

      function rootsForSelectedProject() {
        var id = String(projectField.input.value || '');
        if (!id) return [];
        var rootIds = rootIdsForProject(id);
        return rootIds.map(function (rootId) { return (snapshot && snapshot.roots || []).find(function (item) { return String(item.id) === rootId; }); }).filter(Boolean);
      }

      function refreshProjectChoices() {
        var selectedTaskId = String(taskField.input.value || '');
        var tasks = (snapshot && snapshot.tasks || []).filter(function (task) { return String(task.primaryProjectId || '') === String(projectField.input.value || ''); });
        taskField.input.replaceChildren();
        var noTask = el('option', '', tr('不关联任务', 'No task'));
        noTask.value = '';
        taskField.input.appendChild(noTask);
        tasks.forEach(function (task) {
          var option = el('option', '', safeName(task));
          option.value = String(task.id);
          taskField.input.appendChild(option);
        });
        taskField.input.value = tasks.some(function (task) { return String(task.id) === selectedTaskId; }) ? selectedTaskId : '';

        var selectedRootId = String(rootField.input.value || '');
        var roots = rootsForSelectedProject();
        rootField.input.replaceChildren();
        var chooseRoot = el('option', '', tr('选择工作目录…', 'Choose a working folder…'));
        chooseRoot.value = '';
        chooseRoot.disabled = true;
        rootField.input.appendChild(chooseRoot);
        roots.forEach(function (item) {
          var option = el('option', '', safeName(item) + ((item.canonicalPath || item.path) ? ' · ' + (item.canonicalPath || item.path) : ''));
          option.value = String(item.id);
          rootField.input.appendChild(option);
        });
        rootField.wrap.hidden = roots.length < 2;
        if (roots.length === 1) rootField.input.value = String(roots[0].id);
        else rootField.input.value = roots.some(function (item) { return String(item.id) === selectedRootId; }) ? selectedRootId : '';
        rootField.input.setAttribute('aria-required', String(roots.length > 1));
      }

      projectField.input.addEventListener('change', refreshProjectChoices);
      refreshProjectChoices();

      var submit = button(tr('创建任务会话', 'Create task session'), 'ouw-primary-action', function () {
        var primaryProjectId = String(projectField.input.value || '');
        if (!primaryProjectId) { projectField.input.focus(); return; }
        var roots = rootsForSelectedProject();
        if (roots.length > 1 && !rootField.input.value) { rootField.input.focus(); return; }
        var payload = {
          title: title.input.value.trim() || tr('新任务会话', 'New task session'),
          primaryProjectId: primaryProjectId,
          executionChoice: String(executorField.input.value || defaultChoiceId)
        };
        if (taskField.input.value) payload.taskId = taskField.input.value;
        if (botField.input.value) payload.participatingBotRef = { type: 'BotInstanceRef', id: String(botField.input.value) };
        if (roots.length === 1) payload.rootId = String(roots[0].id);
        else if (rootField.input.value) payload.rootId = String(rootField.input.value);
        runCommand('createThread', payload, function (result) {
          closeForm(form);
          refresh().then(function () { if (result.entity && result.entity.id) openEntity({ type: 'Thread', id: result.entity.id }); });
        }, form, submit);
      });
      submit.dataset.ouwThreadCreate = 'true';
      form.appendChild(submit);
      listMount.prepend(form);
      title.input.focus();
      loadThreadExecutorChoices(executorField.input, form, defaultChoiceId);
    }

    function loadThreadExecutorChoices(select, form, fallbackChoiceId) {
      var currentScope = getCurrentScope();
      if (!currentScope || !bridge || typeof bridge.unifiedWorkspaceThreadExecutors !== 'function') {
        showStatus(form.querySelector('.ouw-form-status'), tr('执行选择目录暂不可用；仍可使用默认 DSH。', 'Executor choices are unavailable; the default DSH remains selected.'), 'muted');
        return;
      }
      Promise.resolve(bridge.unifiedWorkspaceThreadExecutors(currentScope)).then(function (result) {
        if (!form.isConnected || !sameScope(currentScope, getCurrentScope())) return;
        if (!validResponse(result, currentScope)) throw new Error(messageForError(result, tr('无法读取执行选择。', 'Unable to load executor choices.')));
        var choices = Array.isArray(result.choices) ? result.choices : [];
        var selectedId = String(select.value || result.defaultChoiceId || fallbackChoiceId);
        var defaultId = String(result.defaultChoiceId || fallbackChoiceId);
        var defaultEntry = choices.find(function (choice) { return choice && String(choice.id) === defaultId; });
        var options = [];
        var label = defaultId === 'default' ? tr('默认（DSH）', 'Default (DSH)') : defaultEntry && defaultEntry.label || 'DSH';
        options.push({ id: defaultId, label: label, available: defaultEntry ? defaultEntry.available !== false : true, reason: defaultEntry && defaultEntry.reason });
        choices.forEach(function (choice) {
          if (!choice || !choice.id || String(choice.id) === defaultId) return;
          options.push(choice);
        });
        select.replaceChildren();
        options.forEach(function (choice) {
          var sourceLabel = String(choice.label || choice.id);
          var optionLabel = String(executionChoiceDisplayLabel(choice.id, sourceLabel) || choice.id);
          if (choice.model && String(choice.model) !== sourceLabel) optionLabel += ' · ' + String(choice.model);
          if (choice.available === false) optionLabel += tr(' · 不可用', ' · unavailable');
          var option = el('option', '', optionLabel);
          option.value = String(choice.id);
          option.disabled = choice.available === false && String(choice.id) !== defaultId;
          if (choice.reason) option.title = String(choice.reason);
          select.appendChild(option);
        });
        select.value = options.some(function (choice) { return String(choice.id) === selectedId; }) ? selectedId : defaultId;
        showStatus(form.querySelector('.ouw-form-status'), '', '');
      }).catch(function (error) {
        if (!form.isConnected || !sameScope(currentScope, getCurrentScope())) return;
        showStatus(form.querySelector('.ouw-form-status'), messageForError(error, tr('执行选择读取失败；仍可使用默认 DSH。', 'Executor choices failed to load; the default DSH remains selected.')), 'error');
      });
    }

    function openEditProjectForm(project) {
      var form = createInlineForm(tr('编辑项目', 'Edit project'));
      var name = field(tr('名称', 'Name'), 'text', safeName(project));
      var description = field(tr('目标说明', 'Goal description'), 'textarea', '');
      name.input.value = String(project.name || '');
      description.input.value = String(project.description || '');
      form.append(name.wrap, description.wrap);
      var submit = button(tr('保存项目', 'Save project'), 'ouw-primary-action', function () {
        var nextName = name.input.value.trim();
        if (!nextName) { name.input.focus(); return; }
        runCommand('updateProject', { id: String(project.id), expectedRevision: project.revision, patch: { name: nextName, description: description.input.value.trim() } }, function () {
          closeForm(form);
          refresh().then(function () { var page = currentPage(); if (page && page.ref.type === 'Project') loadDetail(page); });
        }, form, submit);
      });
      form.appendChild(submit);
      var page = currentPage(); if (page && page.ref.type === 'Project') page.body.prepend(form); else listMount.prepend(form);
      name.input.focus();
    }

    function openEditTaskForm(task) {
      var form = createInlineForm(tr('编辑任务', 'Edit task'));
      var goal = field(tr('任务目标', 'Task goal'), 'textarea', '');
      goal.input.value = String(task.goal || '');
      var criteria = field(tr('验收要求', 'Acceptance criteria'), 'textarea', '');
      criteria.input.value = String(task.acceptanceCriteria || '');
      var project = field(tr('所属项目', 'Project'), 'select', '');
      var noProject = el('option', '', tr('不关联项目', 'No project')); noProject.value = ''; project.input.appendChild(noProject);
      (snapshot && snapshot.projects || []).forEach(function (item) {
        var option = el('option', '', safeName(item)); option.value = String(item.id); project.input.appendChild(option);
      });
      project.input.value = String(task.primaryProjectId || '');
      form.append(goal.wrap, criteria.wrap, project.wrap);
      var submit = button(tr('保存任务', 'Save task'), 'ouw-primary-action', function () {
        if (!goal.input.value.trim()) { goal.input.focus(); return; }
        runCommand('updateTask', { id: String(task.id), expectedRevision: task.revision, patch: {
          goal: goal.input.value.trim(), acceptanceCriteria: criteria.input.value.trim(), primaryProjectId: project.input.value || null
        } }, function () {
          closeForm(form);
          refresh().then(function () { var page = currentPage(); if (page && page.ref.type === 'WorkTask') loadDetail(page); });
        }, form, submit);
      });
      form.appendChild(submit);
      var page = currentPage(); if (page && page.ref.type === 'WorkTask') page.body.prepend(form); else listMount.prepend(form);
      goal.input.focus();
    }

    function createInlineForm(title) {
      var form = el('form', 'ouw-inline-form');
      form.addEventListener('submit', function (event) { event.preventDefault(); });
      var header = el('div', 'ouw-form-header');
      header.appendChild(el('strong', '', title));
      header.appendChild(button(tr('关闭', 'Close'), 'ouw-close-form', function () { closeForm(form); }));
      form.appendChild(header);
      var status = el('div', 'ouw-form-status'); status.hidden = true; form.appendChild(status);
      return form;
    }

    function closeForm(form) { if (form && form.parentNode) form.parentNode.removeChild(form); }

    function field(label, type, placeholder) {
      var wrap = el('label', 'ouw-field');
      wrap.appendChild(el('span', 'ouw-field-label', label));
      var input = type === 'textarea' ? el('textarea', 'ouw-field-input') : type === 'select' ? el('select', 'ouw-field-input') : el('input', 'ouw-field-input');
      if (input.tagName === 'INPUT') input.type = type || 'text';
      if (placeholder) input.placeholder = placeholder;
      wrap.appendChild(input);
      return { wrap: wrap, input: input };
    }

    function bindRootForProject(projectId) {
      if (!bridge || typeof bridge.unifiedWorkspaceBindRoot !== 'function') { setCommandStatus(tr('目录绑定服务尚不可用。', 'Folder binding is not available yet.'), 'error'); return; }
      var currentScope = getCurrentScope();
      if (!currentScope) return;
      Promise.resolve(bridge.unifiedWorkspaceBindRoot({ spaceId: currentScope.spaceId, scopeRevision: currentScope.scopeRevision, projectId: projectId })).then(function (result) {
        if (!sameScope(currentScope, getCurrentScope())) return;
        if (result && result.canceled === true && validResponse(result, currentScope)) return;
        if (!validResponse(result, currentScope)) { if (result && result.canceled) return; throw new Error(messageForError(result)); }
        return refresh().then(function () { var page = currentPage(); if (page && page.ref.type === 'Project') loadDetail(page); });
      }).catch(function (error) { setCommandStatus(messageForError(error), 'error'); });
    }

    function runCommand(action, payload, onSuccess, disableNode, actionNode) {
      if (!(action === 'stopRun' ? bridge && typeof bridge.unifiedWorkspaceStop === 'function' : bridge && typeof bridge.unifiedWorkspaceCommand === 'function')) { setCommandStatus(tr('工作空间操作服务尚不可用。', 'Workspace actions are not available yet.'), 'error'); return Promise.resolve(false); }
      var currentScope = getCurrentScope();
      if (!currentScope) return Promise.resolve(false);
      actionNode = actionNode || disableNode;
      var fingerprint = action + '\n' + stablePayload(payload || {});
      var operationId = makeOperationId();
      var operationRecord = null;
      if (actionNode && actionOperationIds.has(actionNode)) {
        operationRecord = actionOperationIds.get(actionNode);
        if (operationRecord.fingerprint !== fingerprint) operationRecord = null;
      }
      if (operationRecord && operationRecord.uncertain) {
        var pendingMessage = tr('上次操作回执未知，已先读取当前状态；请检查后再开始新的操作。', 'The last receipt is unknown. Current state was read first; inspect it before starting a new action.');
        if (disableNode) showStatus(disableNode.querySelector('.ouw-form-status'), pendingMessage, 'error');
        else setCommandStatus(pendingMessage, 'error');
        return Promise.resolve(false);
      }
      if (operationRecord) operationId = operationRecord.operationId;
      else if (actionNode) { operationRecord = { fingerprint: fingerprint, operationId: operationId, uncertain: false }; actionOperationIds.set(actionNode, operationRecord); }
      if (disableNode) disableNode.querySelectorAll('button,input,textarea,select').forEach(function (node) { node.disabled = true; });
      else if (actionNode) actionNode.disabled = true;
      var request = Object.assign({ spaceId: currentScope.spaceId, scopeRevision: currentScope.scopeRevision, operationId: operationId }, payload || {});
      if (action !== 'stopRun') request.action = action;
      return Promise.resolve((action === 'stopRun' ? bridge.unifiedWorkspaceStop : bridge.unifiedWorkspaceCommand).call(bridge, request)).then(function (result) {
        if (!sameScope(currentScope, getCurrentScope())) return false;
        if (!result || result.ok !== true) throw commandError(result, tr('操作未能完成。', 'The operation did not complete.'));
        if (String(result.spaceId) !== currentScope.spaceId || String(result.scopeRevision) !== String(currentScope.scopeRevision)) {
          throw Object.assign(new Error(tr('操作回执范围不匹配。', 'The operation receipt scope did not match.')), { unknownOutcome: true });
        }
        if (actionNode) actionOperationIds.delete(actionNode);
        if (disableNode) disableNode.querySelectorAll('button,input,textarea,select').forEach(function (node) { node.disabled = false; });
        else if (actionNode) actionNode.disabled = false;
        if (disableNode) showStatus(disableNode.querySelector('.ouw-form-status'), '', '');
        setCommandStatus('', '');
        if (typeof onSuccess === 'function') {
          try { onSuccess(result); } catch (error) { setCommandStatus(messageForError(error), 'error'); }
        }
        return true;
      }).catch(function (error) {
        if (!sameScope(currentScope, getCurrentScope())) return false;
        if (isUnknownOutcome(error)) {
          if (operationRecord) operationRecord.uncertain = true;
          if (disableNode) {
            disableNode.dataset.ouwOutcomeUnknown = 'true';
            disableNode.querySelectorAll('button,input,textarea,select').forEach(function (node) { if (!node.classList.contains('ouw-close-form')) node.disabled = true; });
          } else if (actionNode && actionNode !== composerHost) actionNode.disabled = true;
          var unknownMessage = tr('操作回执未知，正在读取当前状态；请勿重复提交。', 'The operation receipt is unknown. Reading current state; do not submit again.');
          if (disableNode) showStatus(disableNode.querySelector('.ouw-form-status'), unknownMessage + ' ' + messageForError(error), 'error');
          else setCommandStatus(unknownMessage + ' ' + messageForError(error), 'error');
          readAfterUnknown(action, payload || {}, currentScope);
          return false;
        }
        if (disableNode) disableNode.querySelectorAll('button,input,textarea,select').forEach(function (node) { node.disabled = false; });
        else if (actionNode) actionNode.disabled = false;
        var knownMessage = messageForError(error);
        if (disableNode) showStatus(disableNode.querySelector('.ouw-form-status'), knownMessage, 'error');
        else setCommandStatus(knownMessage, 'error');
        return false;
      });
    }

    function readAfterUnknown(action, payload, expectedScope) {
      var ref = null;
      if (action === 'sendThread') ref = { type: 'Thread', id: payload.threadId };
      else if (action === 'startTask' || action === 'delegateTask' || action === 'updateTask' || action === 'attachArtifact' || action === 'sealTaskReceipt') ref = { type: 'WorkTask', id: payload.taskId || payload.id };
      else if (action === 'updateProject') ref = { type: 'Project', id: payload.id };
      else if (action === 'repairReturn') ref = { type: 'Run', id: payload.runId };
      else if (action === 'resolveUnknownRun') ref = { type: 'Run', id: payload.runId };
      else if (action === 'endRelation') ref = { type: 'Relation', id: payload.relationId };
      else if (action === 'relate') ref = payload.subjectRef;
      else if (action === 'stopRun') ref = { type: 'Run', id: payload.runId };
      return refresh().then(function () {
        if (!ref || !bridge || typeof bridge.unifiedWorkspaceDetail !== 'function' || !sameScope(expectedScope, getCurrentScope())) return;
        return Promise.resolve(bridge.unifiedWorkspaceDetail({ spaceId: expectedScope.spaceId, scopeRevision: expectedScope.scopeRevision, ref: ref })).then(function (result) {
          if (!validResponse(result, expectedScope)) return;
          var page = pageCache.get(refKey(ref));
          if (page && page.key === currentPageKey && page.ref.type !== 'FileRef') { page.detail = result; page.loading = false; page.error = ''; renderPage(page); }
        }).catch(function () {});
      }).catch(function () {});
    }

    function startTask(task, threads, actionNode) {
      var chosenThread = threads && threads.find(function (thread) { return thread.messageSourceRef && thread.messageSourceRef.sourceType === 'unified-thread'; });
      var content = composerInput && composerInput.value || '';
      function runWithThread(threadId) {
        runCommand('startTask', { taskId: String(task.id), threadId: String(threadId), text: content || undefined }, function () {
          if (composerInput && content && composerInput.value === content) {
            if (composerState.threadId === String(threadId)) clearComposerAfterSend(String(threadId));
            else { composerInput.value = ''; syncComposerButtons(); }
          }
          openEntity({ type: 'Thread', id: String(threadId) });
          refresh();
        }, null, actionNode);
      }
      if (chosenThread && chosenThread.id) { runWithThread(chosenThread.id); return; }
      var ownerRef = normalizeRef(task.ownerBotRef);
      if (!ownerRef) { setCommandStatus(tr('任务没有可用的负责人 BOT。', 'This task has no available owner BOT.'), 'error'); return; }
      runCommand('createThread', { botRef: ownerRef, title: safeName(task), taskId: String(task.id) }, function (result) {
        var thread = result.entity;
        if (!thread || !thread.id) { setCommandStatus(tr('会话已创建，但服务未返回稳定会话 ID。', 'The thread was created without a stable ID in the response.'), 'error'); return; }
        runWithThread(thread.id);
      }, null, actionNode);
    }

    function cancelRun(run, actionNode) {
      var runId = run && (run.id || run.runId);
      if (!runId) return;
      runCommand('stopRun', { runId: String(runId) }, function () { var page = currentPage(); if (page) loadDetail(page); }, null, actionNode);
    }

    function openDelegateForm(task, selectedMessage) {
      var bots = Array.isArray(snapshot && snapshot.bots) ? snapshot.bots : [];
      if (!bots.length) { setCommandStatus(tr('当前空间没有可用的执行 BOT。', 'No execution BOT is available in this space.'), 'error'); return; }
      var origin = currentPage(), originScope = getCurrentScope();
      if (origin) {
        var previous = origin.body.querySelector('[data-ouw-delegate-form]');
        if (previous) closeForm(previous);
      }
      var form = createInlineForm(tr('委派任务', 'Delegate task'));
      form.dataset.ouwDelegateForm = '';
      var botField = field(tr('执行 BOT', 'Executor BOT'), 'select', '');
      if (selectedMessage) botField.input.appendChild(el('option', '', tr('请选择 Bot', 'Choose a Bot')));
      if (selectedMessage) botField.input.firstChild.value = '';
      bots.forEach(function (bot) { var option = el('option', '', safeName(bot)); option.value = String(bot.id); botField.input.appendChild(option); });
      var goalField = field(tr('委派目标', 'Delegation goal'), 'textarea', safeName(task));
      form.append(botField.wrap, goalField.wrap);
      if (selectedMessage) form.appendChild(el('p', 'ouw-source-note',
        tr('只引用这一条消息。子任务由你开始执行，结果会回到当前会话。', 'Only this message is included. You start the delegated task; its result returns to this session.')));
      var submit = button(tr('确认委派', 'Delegate'), 'ouw-primary-action', function (event) {
        var bot = bots.find(function (item) { return String(item.id) === botField.input.value; });
        if (!bot) { botField.input.focus(); return; }
        if (!goalField.input.value.trim()) { goalField.input.focus(); return; }
        var payload = { taskId: String(task.id), assigneeBotRef: { type: 'BotInstanceRef', id: String(bot.id) }, goal: goalField.input.value.trim(), contextRefs: [] };
        if (selectedMessage) {
          payload.returnThreadId = selectedMessage.threadId;
          payload.contextRefs = [{ type: 'Thread', id: selectedMessage.threadId, messageIds: [selectedMessage.messageId] }];
        }
        runCommand('delegateTask', payload, function (result) {
          closeForm(form);
          refresh().then(function () {
            if (selectedMessage && result.entity && currentPage() === origin && sameScope(originScope, getCurrentScope())) openEntity({ type: 'WorkTask', id: String(result.entity.id) });
          });
        }, form, event.currentTarget);
      });
      form.appendChild(submit);
      var page = currentPage(); if (page) page.body.prepend(form); else listMount.prepend(form);
      if (selectedMessage) botField.input.focus();
    }

    function createComposer() {
      var wrapper = el('div', 'ouw-composer');
      var top = el('div', 'ouw-composer-top');
      composerLabel = el('span', 'ouw-composer-label', tr('新会话', 'New thread'));
      top.appendChild(composerLabel);
      composerStatus = el('span', 'ouw-composer-status'); composerStatus.hidden = true; top.appendChild(composerStatus);
      if (root.OpenBotComposerStyle) top.appendChild(root.OpenBotComposerStyle.createControl());
      composerHost.appendChild(top);
      composerInput = el('textarea', 'ouw-composer-input');
      composerInput.rows = 1;
      composerInput.placeholder = tr('写一条消息…', 'Write a message…');
      composerInput.setAttribute('aria-label', tr('工作空间消息', 'Workspace message'));
      composerInput.addEventListener('input', function () { queueDraftSave(); });
      composerInput.addEventListener('select', function () { if (!composerSelectionSuppressed) queueDraftSave(); });
      composerInput.addEventListener('keyup', function () { if (!composerSelectionSuppressed) queueDraftSave(); });
      composerInput.addEventListener('click', function () { if (!composerSelectionSuppressed) queueDraftSave(); });
      composerInput.addEventListener('scroll', function () { if (!composerSelectionSuppressed) queueDraftSave(); });
      composerInput.addEventListener('focusout', function () {
        if (!composerSelectionSuppressed) rememberComposerDraftBeforeNavigation();
        composerSelectionSuppressed = true;
        clearTimeout(composerSuppressionTimer);
        composerSuppressionTimer = setTimeout(function () { composerSelectionSuppressed = false; composerSuppressionTimer = 0; }, 120);
      });
      document.addEventListener('pointerdown', function (event) {
        var target = event.target;
        if (!target || !navigationMount || !contentRoot || (!navigationMount.contains(target) && !contentRoot.contains(target)) || composerHost.contains(target)) return;
        // Capture only the focused editor's live selection. Later clicks in a
        // sidebar form happen after blur and can report a reset caret position;
        // those must not overwrite the draft saved at the first navigation edge.
        if (document.activeElement !== composerInput) return;
        rememberComposerDraftBeforeNavigation();
        composerSelectionSuppressed = true;
        clearTimeout(composerSuppressionTimer);
        composerSuppressionTimer = setTimeout(function () { composerSelectionSuppressed = false; composerSuppressionTimer = 0; }, 120);
      }, true);
      composerInput.addEventListener('compositionstart', function () { composerState.composing = true; });
      composerInput.addEventListener('compositionend', function () {
        composerState.composing = false;
        saveCurrentDraft();
        if (composerState.pendingThreadId !== null) {
          var target = composerState.pendingThreadId;
          composerState.pendingThreadId = null;
          switchComposerThread(target);
        }
      });
      wrapper.appendChild(composerInput);
      var actions = el('div', 'ouw-composer-actions');
      var threadActions = el('div', 'ouw-composer-thread-actions');
      composerRun = button(tr('开始任务', 'Start task'), 'ouw-primary-action', startCurrentTask);
      composerRun.dataset.ouwThreadStart = 'true';
      composerRun.hidden = true;
      threadActions.appendChild(composerRun);
      composerSend = button(tr('发送', 'Send'), 'ouw-primary-action', sendCurrentThread);
      composerSend.dataset.ouwThreadSend = 'true';
      composerSend.disabled = true;
      threadActions.appendChild(composerSend);
      actions.appendChild(threadActions);
      wrapper.appendChild(actions);
      composerHost.appendChild(wrapper);
      if (root.OpenBotComposerStyle) composerStyleCleanup = root.OpenBotComposerStyle.watchInput(composerInput);
    }

    function activeThreadId() { return composerState.threadId; }

    function draftFromInput() {
      return {
        text: String(composerInput.value || ''),
        selectionStart: typeof composerInput.selectionStart === 'number' ? composerInput.selectionStart : composerInput.value.length,
        selectionEnd: typeof composerInput.selectionEnd === 'number' ? composerInput.selectionEnd : composerInput.value.length,
        scrollTop: Number(composerInput.scrollTop || 0)
      };
    }

    function hydrateComposer(draft) {
      if (!draft || composerState.composing) return;
      var normalized = {
        text: String(draft.text || ''),
        selectionStart: Number(draft.selectionStart || 0),
        selectionEnd: Number(draft.selectionEnd || 0),
        scrollTop: Number(draft.scrollTop || 0)
      };
      composerState.drafts.set(composerState.threadId, normalized);
      composerInput.value = normalized.text;
      try { composerInput.setSelectionRange(normalized.selectionStart, normalized.selectionEnd); } catch (error) {}
      composerInput.scrollTop = normalized.scrollTop;
      syncComposerButtons();
    }

    function queueDraftSave() {
      var threadId = activeThreadId();
      if (!threadId || composerState.composing) { syncComposerButtons(); return; }
      composerInputRevision += 1;
      var draft = draftFromInput();
      var draftScope = getCurrentScope();
      composerState.drafts.set(String(threadId), draft);
      syncComposerButtons();
      clearTimeout(composerSelectionTimer);
      composerSelectionTimer = setTimeout(function () { persistDraft(String(threadId), draft, draftScope); }, 250);
    }

    function saveCurrentDraft() {
      var threadId = activeThreadId();
      if (!threadId || !bridge || typeof bridge.unifiedWorkspaceCommand !== 'function' || composerState.composing) { syncComposerButtons(); return Promise.resolve(false); }
      composerInputRevision += 1;
      clearTimeout(composerSelectionTimer);
      composerSelectionTimer = 0;
      var draft = draftFromInput();
      composerState.drafts.set(String(threadId), draft);
      syncComposerButtons();
      return persistDraft(String(threadId), draft, getCurrentScope());
    }

    function rememberComposerDraftBeforeNavigation() {
      var threadId = activeThreadId();
      if (!threadId || composerState.composing) return;
      composerInputRevision += 1;
      clearTimeout(composerSelectionTimer);
      composerSelectionTimer = 0;
      var draft = draftFromInput();
      composerState.drafts.set(String(threadId), draft);
      persistDraft(String(threadId), draft, getCurrentScope());
    }

    function persistDraft(threadId, draft, currentScope) {
      if (!threadId || !bridge || typeof bridge.unifiedWorkspaceCommand !== 'function' || !currentScope) return Promise.resolve(false);
      var epoch = (composerDraftEpochs.get(threadId) || 0) + 1;
      composerDraftEpochs.set(threadId, epoch);
      return Promise.resolve(bridge.unifiedWorkspaceCommand({
        spaceId: currentScope.spaceId, scopeRevision: currentScope.scopeRevision,
        operationId: makeOperationId(), action: 'saveDraft', threadId: threadId, composerKind: 'text', draft: draft
      })).then(function (result) {
        if (composerDraftEpochs.get(threadId) !== epoch || !validResponse(result, currentScope)) return false;
        if (composerState.threadId === threadId) showStatus(composerStatus, '', '');
        return true;
      }).catch(function (error) {
        if (composerDraftEpochs.get(threadId) === epoch && sameScope(currentScope, getCurrentScope()) && composerState.threadId === threadId) {
          showStatus(composerStatus, messageForError(error, tr('草稿保存失败。', 'Draft could not be saved.')), 'error');
        }
        return false;
      });
    }

    function switchComposerThread(threadId) {
      threadId = String(threadId || '');
      if (composerState.composing) { composerState.pendingThreadId = threadId; return; }
      var oldThreadId = composerState.threadId;
      if (oldThreadId === threadId) {
        // Chromium can collapse a textarea's live selection when it loses
        // focus. The cached draft still has the last focused caret/scroll, so
        // restore it when returning from a file or detail page. Leave an
        // actively edited textarea untouched.
        var sameThreadDraft = threadId && composerState.drafts.get(threadId);
        if (sameThreadDraft && document.activeElement !== composerInput) {
          composerSelectionSuppressed = true;
          composerInput.value = sameThreadDraft.text;
          try { composerInput.setSelectionRange(sameThreadDraft.selectionStart, sameThreadDraft.selectionEnd); } catch (error) {}
          composerInput.scrollTop = sameThreadDraft.scrollTop;
          clearTimeout(composerSuppressionTimer);
          composerSuppressionTimer = setTimeout(function () { composerSelectionSuppressed = false; composerSuppressionTimer = 0; }, 120);
        }
        syncComposerButtons(); return;
      }
      if (oldThreadId) {
        warmThreadFor(oldThreadId, false);
        clearTimeout(composerSelectionTimer);
        composerSelectionTimer = 0;
        var savedDraft = composerState.drafts.get(oldThreadId);
        if (savedDraft) persistDraft(oldThreadId, savedDraft, getCurrentScope());
        else saveCurrentDraft();
      }
      composerState.threadId = threadId;
      composerHost.dataset.threadId = threadId;
      composerHost.dataset.ouwThreadId = threadId;
      var cached = composerState.drafts.get(composerState.threadId) || { text: '', selectionStart: 0, selectionEnd: 0, scrollTop: 0 };
      composerInput.value = cached.text;
      try { composerInput.setSelectionRange(cached.selectionStart, cached.selectionEnd); } catch (error) {}
      composerInput.scrollTop = cached.scrollTop;
      syncComposerButtons();
      if (composerState.threadId) warmThreadFor(composerState.threadId, true);
      if (!cached.text && composerState.threadId) {
        var page = pageCache.get('Thread:' + composerState.threadId);
        if (page && page.detail && page.detail.draft) hydrateComposer(page.detail.draft);
      }
    }

    function syncComposerForPage(page) {
      if (page && (page.codex || page.ref.type === 'FileRef' || page.ref.type === 'RootBinding')) {
        // File and history pages have no send target. Leave the conversation's
        // draft and caret untouched for when the user returns.
        composerHost.hidden = true;
        return;
      }
      if (!page || page.ref.type === 'Project' || page.ref.type === 'BotInstanceRef') {
        composerHost.hidden = !activeThreadId();
        composerLabel.textContent = activeThreadId() ? tr('继续编辑当前会话草稿', 'Continue the current thread draft') : tr('选择一个会话以开始输入', 'Select a thread to start writing');
        syncComposerButtons();
        return;
      }
      if (page.ref.type === 'Thread') {
        var entity = page.detail && page.detail.entity;
        if (entity && entity.messageSourceRef && entity.messageSourceRef.sourceType === 'unified-thread') switchComposerThread(page.ref.id);
        else switchComposerThread('');
      }
      else if (page.ref.type === 'WorkTask') {
        var thread = page.detail && page.detail.threads && page.detail.threads.find(function (item) { return item.messageSourceRef && item.messageSourceRef.sourceType === 'unified-thread'; });
        if (thread) switchComposerThread(thread.id);
        else switchComposerThread('');
      }
      var currentEntity = page.detail && page.detail.entity;
      composerHost.hidden = page.ref.type !== 'WorkTask' && (page.ref.type !== 'Thread' || !currentEntity || !currentEntity.messageSourceRef || currentEntity.messageSourceRef.sourceType !== 'unified-thread');
      composerLabel.textContent = composerState.threadId ? tr('发送到当前会话', 'Send to the current thread') : tr('开始任务时创建会话', 'A thread will be created when the task starts');
      syncComposerButtons();
    }

    function attachComposer(page, threadId) {
      if (threadId) switchComposerThread(threadId);
      else if (page.ref.type === 'WorkTask') switchComposerThread('');
      composerHost.hidden = false;
      var project = page.ref.type === 'Thread' && page.detail && projectIdForThread(page.detail.entity, snapshot && snapshot.tasks);
      composerLabel.textContent = threadId ? (project ? tr('以你的身份发送到当前会话', 'Send to this session as yourself') :
        tr('发送到当前会话', 'Send to the current thread')) : tr('开始任务时创建会话', 'A thread will be created when the task starts');
      composerRun.hidden = page.ref.type !== 'WorkTask';
      composerSend.hidden = page.ref.type !== 'Thread';
      syncComposerButtons();
    }

    function syncComposerButtons() {
      if (!composerInput) return;
      if (root.OpenBotComposerStyle) root.OpenBotComposerStyle.resizeInput(composerInput);
      var taskPage = currentPage() && currentPage().ref.type === 'WorkTask';
      var hasText = !!String(composerInput.value || '').trim();
      if (composerSend) composerSend.disabled = !composerState.threadId || !hasText;
      if (composerRun) composerRun.disabled = !taskPage;
    }

    function startCurrentTask(event) {
      var page = currentPage();
      if (!page || page.ref.type !== 'WorkTask' || !page.detail) return;
      startTask(page.detail.entity, page.detail.threads || [], event && event.currentTarget || composerRun);
    }

    function sendCurrentThread(event) {
      var threadId = composerState.threadId;
      var text = String(composerInput && composerInput.value || '').trim();
      if (!threadId || !text || !bridge || typeof bridge.unifiedWorkspaceCommand !== 'function') return;
      var actionNode = event && event.currentTarget || composerSend;
      saveCurrentDraft();
      runCommand('sendThread', { threadId: threadId, text: text, contextRefs: [] }, function () {
        clearComposerAfterSend(threadId);
        var page = pageCache.get('Thread:' + threadId);
        if (page) {
          page.scrollToLatestOnUpdate = true;
          page.lastRenderedScrollMsgCount = page.detail && Array.isArray(page.detail.messages) ? page.detail.messages.length : 0;
          loadDetail(page);
        }
      }, composerHost, actionNode);
    }

    function clearComposerAfterSend(threadId) {
      if (composerState.threadId !== String(threadId)) return;
      composerInput.value = '';
      var empty = { text: '', selectionStart: 0, selectionEnd: 0, scrollTop: 0 };
      composerState.drafts.set(String(threadId), empty);
      saveCurrentDraft();
      syncComposerButtons();
    }

    function refresh() {
      if (stopped || !bridge || typeof bridge.unifiedWorkspaceState !== 'function') {
        navStatus = tr('工作空间服务尚不可用。', 'Workspace services are not available yet.');
        renderSidebar();
        return Promise.resolve(false);
      }
      var currentScope = getCurrentScope();
      if (!currentScope) { navStatus = tr('请选择一个空间。', 'Select a space.'); renderSidebar(); return Promise.resolve(false); }
      var ticket = ++refreshEpoch;
      var navigationRevision = viewInteractionRevision;
      navStatus = tr('正在读取…', 'Loading…');
      renderSidebar();
      return Promise.resolve(bridge.unifiedWorkspaceState(currentScope)).then(function (result) {
        if (ticket !== refreshEpoch || !sameScope(currentScope, getCurrentScope())) return false;
        if (!result || result.ok !== true || String(result.spaceId) !== currentScope.spaceId || String(result.scopeRevision) !== String(currentScope.scopeRevision)) throw new Error(messageForError(result, tr('工作空间列表已过期，未显示。', 'The workspace list is stale and was not shown.')));
        if (navigationRevision !== viewInteractionRevision) {
          result.preferences = Object.assign({}, result.preferences || {}, { navigationView: view });
        }
        snapshot = result;
        refreshContextOrigin();
        (snapshot.roots || []).forEach(function (item) {
          var rootId = String(item.id || '');
          if (rootId && item.status === 'revoked' && !revokedIndexRoots.has(rootId)) revokeIndexCoverage(rootId);
        });
        projectSummaries.clear();
        navStatus = '';
        loadLocalPreferences();
        if (selectedRootId && !(snapshot.roots || []).some(function (item) { return String(item.id) === selectedRootId; })) selectedRootId = '';
        renderSidebar();
        var page = currentPage();
        if (page && page.codex) {
          if (page.codex.kind === 'thread') loadCodexThreadHistory(page, false);
          else loadCodexThreadList(page, false);
        } else if (page && page.ref.type !== 'FileRef') loadDetail(page);
        // File changes use loadFilePage from the file event path. An unrelated
        // workspace refresh must not replace the open preview, selection or
        // participation focus.
        return true;
      }).catch(function (error) {
        if (ticket === refreshEpoch && sameScope(currentScope, getCurrentScope())) {
          navStatus = messageForError(error);
          snapshot = null;
          renderSidebar();
        }
        return false;
      });
    }

    function handleScopeChange() {
      var next = getCurrentScope();
      if (sameScope(scope, next)) return;
      clearBotAssociations();
      experimentAssociationEpoch += 1; experimentAssociationKey = '';
      experimentAssociationCache.clear(); experimentAssociationInflight.clear();
      experimentSectionExpanded = Object.create(null);
      if (historyDisclosure) historyDisclosure.open = false;
      if (historyMount) historyMount.replaceChildren();
      clearFileParticipation();
      codexHistoryPreferenceEpoch += 1;
      codexHistoryPreferenceBusy = false;
      codexHistoryPendingValue = null;
      var previousScope = scope;
      var pendingThreadId = composerState.threadId;
      if (pendingThreadId && !composerState.composing) {
        clearTimeout(composerSelectionTimer); composerSelectionTimer = 0;
        var pendingDraft = draftFromInput();
        composerState.drafts.set(String(pendingThreadId), pendingDraft);
        persistDraft(String(pendingThreadId), pendingDraft, previousScope);
      }
      cancelSearch();
      refreshEpoch += 1; detailEpoch += 1; treeEpoch += 1;
      clearTimeout(searchDebounceTimer); searchDebounceTimer = 0;
      clearTimeout(fileRefreshTimer); fileRefreshTimer = 0;
      clearTimeout(queryPreferenceTimer); queryPreferenceTimer = 0;
      clearTimeout(composerSelectionTimer); composerSelectionTimer = 0;
      pageCache.forEach(function (page) { page.epoch = -1; if (page.node.parentNode) page.node.parentNode.removeChild(page.node); });
      pageCache.clear(); backStack = []; currentPageKey = ''; legacyReturnPageKey = ''; legacyHop = false;
      resetCodexHistoryState(next);
      contextOriginKey = ''; sidebarPositions = Object.create(null); sidebarRenderedView = ''; contextExpanded.clear();
      snapshot = null; selectedRootId = ''; treeCache.clear(); treeErrors.clear(); treeCursors.clear(); treeRequests.clear(); treeLoading.clear();
      projectSummaries.clear();
      pinnedProjectRootIds.clear(); projectNavigationRequests.clear();
      indexCoverage.clear(); indexErrors.clear(); indexLoading.clear(); indexRequests.clear(); revokedIndexRoots.clear();
      searchResults = []; searchCursor = null; searchCoverage = null; searchComplete = false; searchError = ''; searchNotice = '';
      composerState.threadId = ''; composerState.pendingThreadId = null; composerState.drafts.clear(); composerDraftEpochs.clear();
      if (composerInput) composerInput.value = '';
      showWorkspace(false);
      scope = next;
      refresh();
    }

    function searchIncludesRoot(rootId) {
      if (!rootId) return true;
      return scopeForSearch().some(function (id) { return String(id) === String(rootId); });
    }

    function updateSearchCoverage(rootId, coverage) {
      if (!coverage) return;
      if (Array.isArray(searchCoverage)) {
        var found = false;
        searchCoverage = searchCoverage.map(function (item) {
          if (!item || String(item.rootId || '') !== String(rootId)) return item;
          found = true;
          return Object.assign({}, item, coverage);
        });
        if (!found) searchCoverage.push(coverage);
      } else if (searchCoverage && String(searchCoverage.rootId || '') === String(rootId)) {
        searchCoverage = Object.assign({}, searchCoverage, coverage);
      }
    }

    function clearRootTreeCache(rootId) {
      var prefix = String(rootId) + '::';
      [treeCache, treeErrors, treeCursors, treeRequests].forEach(function (map) {
        Array.from(map.keys()).forEach(function (key) { if (String(key).indexOf(prefix) === 0) map.delete(key); });
      });
      Array.from(treeLoading).forEach(function (key) { if (String(key).indexOf(prefix) === 0) treeLoading.delete(key); });
    }

    function clearSearchForFileChange(message) {
      clearTimeout(fileRefreshTimer);
      fileRefreshTimer = 0;
      cancelSearch();
      searchQueryId = '';
      searchResults = [];
      searchCursor = null;
      searchComplete = false;
      searchNotice = '';
      searchError = message || '';
      renderSidebar();
    }

    function refreshSearchAfterFileChange() {
      if (!queryText.trim()) return;
      clearTimeout(fileRefreshTimer);
      var expectedScope = getCurrentScope();
      var expectedQuery = queryText;
      fileRefreshTimer = setTimeout(function () {
        fileRefreshTimer = 0;
        if (!sameScope(expectedScope, getCurrentScope()) || String(queryText) !== expectedQuery || !queryText.trim()) return;
        runSearch(true);
      }, 180);
    }

    function handleFileWorkspaceEvent(event) {
      var fileEvent = event && event.fileEvent;
      if (!fileEvent) {
        var coarseRoot = event && event.rootId ? String(event.rootId) : '';
        if (coarseRoot) clearRootTreeCache(coarseRoot);
        else { treeCache.clear(); treeErrors.clear(); treeCursors.clear(); treeRequests.clear(); treeLoading.clear(); indexCoverage.clear(); indexErrors.clear(); indexLoading.clear(); }
        if (queryText.trim() && searchIncludesRoot(coarseRoot)) {
          clearSearchForFileChange(tr('文件索引状态无法确认，请重新搜索。', 'File index status could not be confirmed. Search again.'));
        } else renderSidebar();
        return 'unknown';
      }

      var rootId = fileEvent.rootId ? String(fileEvent.rootId) : '';
      var coverage = fileEvent.coverage && typeof fileEvent.coverage === 'object' ? fileEvent.coverage : null;
      // A late progress event cannot re-authorize a revoked folder. Only a new,
      // successfully authorized status or reindex request may replace this state.
      if (rootId && revokedIndexRoots.has(rootId) && fileEvent.type !== 'revoked') return 'stable';
      var wasScanningIncomplete = !!queryText.trim() && searchComplete === false && Array.isArray(searchCoverage) &&
        searchCoverage.some(function (item) { return item && item.scanning === true; });
      if (rootId && coverage) {
        indexCoverage.set(rootId, Object.assign({}, indexCoverage.get(rootId) || {}, coverage, { rootId: rootId }));
        indexErrors.delete(rootId);
        updateSearchCoverage(rootId, coverage);
      }
      if (fileEvent.type === 'progress' || fileEvent.type === 'indexed' && fileEvent.changed === false) {
        // Worker progress without coverage changes no displayed state. Keeping
        // the controls mounted lets users operate them during background scans.
        if (fileEvent.type !== 'progress' || coverage) renderSidebar();
        var isScanning = Array.isArray(searchCoverage) && searchCoverage.some(function (item) { return item && item.scanning === true; });
        if (fileEvent.type === 'indexed' && wasScanningIncomplete && !isScanning && !searchComplete && queryText.trim() && searchIncludesRoot(rootId)) {
          // A search made during a fallback scan cannot claim a complete
          // no-hit result until the scan finishes. Refresh once at the last
          // indexed event while preserving any already visible matches.
          runSearch(true, { preserveResults: true });
        }
        return 'stable';
      }

      if (fileEvent.type === 'unavailable' || fileEvent.type === 'revoked') {
        if (rootId) {
          if (fileEvent.type === 'revoked') revokeIndexCoverage(rootId);
          else {
            indexCoverage.set(rootId, Object.assign({}, indexCoverage.get(rootId) || {}, coverage || {}, { rootId: rootId, status: 'unavailable' }));
            indexErrors.set(rootId, tr('目录索引不可用。', 'Folder index is unavailable.'));
            clearRootTreeCache(rootId);
          }
        }
        if (queryText.trim() && searchIncludesRoot(rootId)) {
          clearSearchForFileChange(tr(fileEvent.type === 'revoked' ? '目录权限已撤回，搜索结果已清除。' : '目录索引不可用，搜索结果已清除。',
            fileEvent.type === 'revoked' ? 'Folder access was revoked; search results were cleared.' : 'Folder index is unavailable; search results were cleared.'));
        } else renderSidebar();
        return 'unavailable';
      }

      var changed = fileEvent.type === 'dirty' || fileEvent.changed === true;
      if (!changed) { renderSidebar(); return 'stable'; }
      if (rootId) clearRootTreeCache(rootId);
      if (!queryText.trim() || !searchIncludesRoot(rootId)) { renderSidebar(); return 'changed'; }
      cancelSearch();
      searchQueryId = '';
      searchResults = [];
      searchCursor = null;
      searchComplete = false;
      searchError = '';
      searchNotice = tr('文件已变化，正在刷新搜索…', 'Files changed. Refreshing search…');
      renderSidebar();
      refreshSearchAfterFileChange();
      return 'changed';
    }

    function handleWorkspaceEvent(event) {
      if (!event || !scope || String(event.spaceId) !== scope.spaceId) return;
      syncBotAssociations(true);
      if (event.source === 'files') {
        var fileEffect = handleFileWorkspaceEvent(event);
        if (['changed', 'unavailable', 'unknown'].indexOf(fileEffect) >= 0) {
          refreshContextOrigin();
          var context = contextPage();
          if (context && context === currentPage() && context.ref.type !== 'FileRef') loadDetail(context);
        }
        var filePage = currentPage();
        var changedRootId = event.fileEvent && event.fileEvent.rootId || event.rootId || '';
        if (filePage && filePage.ref.type === 'FileRef' && ['changed', 'unavailable', 'unknown'].indexOf(fileEffect) >= 0 &&
            (!changedRootId || String(filePage.ref.rootId || '') === String(changedRootId))) loadFilePage(filePage);
        return;
      }
      var activeFilePage = currentPage();
      if (activeFilePage && activeFilePage.ref.type === 'FileRef') syncFileParticipation(activeFilePage, true);
      if (event.source === 'transcript') {
        var transcriptPage = currentPage();
        if (transcriptPage && (transcriptPage.ref.type === 'Thread' || transcriptPage.ref.type === 'WorkTask')) loadDetail(transcriptPage);
        return;
      }
      refresh();
    }

    function start() {
      if (started) return controller;
      if (!sidebarMount || !contentMount) throw new Error('Unified workspace mounts are required');
      createShell();
      scope = getCurrentScope();
      started = true;
      if (historyDisclosure) historyDisclosure.addEventListener('toggle', renderImportedHistory);
      if (bridge && typeof bridge.onUnifiedWorkspaceChanged === 'function') {
        try {
          eventUnsubscribe = bridge.onUnifiedWorkspaceChanged(handleWorkspaceEvent);
        } catch (error) {}
      }
      fileParticipationVisibilityHandler = function () {
        if (document.visibilityState === 'hidden') clearFileParticipation();
        else {
          var page = currentPage();
          if (page && page.ref.type === 'FileRef' && page.body.querySelector('.ouw-file-content')) syncFileParticipation(page, true);
        }
      };
      document.addEventListener('visibilitychange', fileParticipationVisibilityHandler);
      document.addEventListener('openbot:account-avatar-changed', repaintProjectMessageAuthors);
      root.addEventListener('openbot:right-pane-visibility', fileParticipationPaneHandler);
      refresh();
      return controller;
    }

    function fileParticipationPaneHandler() {
      var page = currentPage();
      if (isVisibleFilePage(page)) updateFileParticipationView(page);
    }

    function destroy() {
      stopped = true;
      document.removeEventListener('openbot:account-avatar-changed', repaintProjectMessageAuthors);
      if (typeof root.removeEventListener === 'function') {
        root.removeEventListener('openbot:right-pane-visibility', fileParticipationPaneHandler);
      }
      clearBotAssociations();
      if (historyDisclosure) historyDisclosure.removeEventListener('toggle', renderImportedHistory);
      if (historyMount) historyMount.replaceChildren();
      if (composerStyleCleanup) composerStyleCleanup();
      clearFileParticipation();
      if (fileParticipationVisibilityHandler) document.removeEventListener('visibilitychange', fileParticipationVisibilityHandler);
      cancelSearch();
      if (typeof eventUnsubscribe === 'function') eventUnsubscribe();
      clearTimeout(searchDebounceTimer); clearTimeout(queryPreferenceTimer); clearTimeout(composerSelectionTimer); clearTimeout(fileRefreshTimer);
      if (navigationMount && navigationMount.parentNode) navigationMount.parentNode.removeChild(navigationMount);
      if (contentRoot && contentRoot.parentNode) contentRoot.parentNode.removeChild(contentRoot);
    }

    var controller = {
      start: start,
      refresh: refresh,
      destroy: destroy,
      setView: setView,
      open: openEntity,
      openBotRelations: openBotRelations,
      goBack: goBack,
      returnFromLegacy: returnFromLegacy,
      close: closeWorkspacePage,
      handleScopeChange: handleScopeChange,
      syncSidebarPreferences: syncSidebarPreferences,
      syncBotAssociations: syncBotAssociations,
      getState: function () {
        var anchor = experimentAnchor();
        return { view: view, viewInteractionRevision: viewInteractionRevision, scope: scope && Object.assign({}, scope),
          currentRef: currentPage() && Object.assign({}, currentPage().ref), anchor: anchor && { kind: anchor.kind, ref: Object.assign({}, anchor.ref), key: anchor.key },
          backStack: backStack.slice() };
      }
    };
    return controller;
  }

  root.OpenBotUnifiedWorkspace = { create: create, init: function (options) { return create(options).start(); } };
})(window);
