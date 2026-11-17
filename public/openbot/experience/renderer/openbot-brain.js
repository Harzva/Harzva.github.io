(function(root, factory){
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotBrain = api;
})(typeof window === 'object' ? window : this, function(){
  'use strict';
  function tr(zh,en){var i18n=typeof window==='object'?window.OpenBotI18n:null;return i18n?i18n.t(zh,en):zh;}
  // An ephemeral projection of existing host records. No task, permission or
  // model output is created here; restart never replays a visual stage.
  var TERMINAL = ['done','failed','canceled','interrupted'];
  var COPY = {
    idle:{label:tr('已就绪',"Ready"),sub:''}, planning:{label:tr('正在梳理任务',"Planning task"),sub:tr('主脑正在处理这轮请求',"Main Bot is processing this request")},
    dispatching:{label:tr('正在分配任务',"Assigning tasks"),sub:tr('正在安排执行 Bot',"Assigning execution Bots")},
    executing:{label:tr('正在执行',"Running"),sub:tr('执行 Bot 正在处理任务',"Execution Bots are working on tasks")},
    summarizing:{label:tr('正在汇总',"Summarizing"),sub:tr('主脑正在整理已读回的结果',"Main Bot is organizing returned results")},
    waiting:{label:tr('正在等待',"Waiting"),sub:tr('等待任务或结果读回',"Waiting for tasks or results")},
    approval:{label:tr('等待授权',"Awaiting approval"),sub:tr('有一步需要你的确认',"A step needs your confirmation")},
    paused:{label:tr('已暂停',"Paused"),sub:tr('可在展开工作里继续',"Expand work details to continue")}
  };
  function active(t){ return !!t && (t.status === 'running' || t.status === 'queued'); }
  function terminal(t){ return !!t && TERMINAL.indexOf(t.status) >= 0; }
  function runId(e){ return String(e && (e.runId || e.streamId) || ''); }
  function child(t, primary){ return !!t && t.dispatchSource === 'bot' && !!t.parentRunId && t.delegatorBotId === primary; }
  function relevant(t, primary){ return active(t) && (t.botId === primary || child(t,primary)); }
  function matchesApproval(req, owner, task){
    if (!req || (req.state && req.state !== 'pending') || !active(task) || owner !== task.botId) return false;
    var run = runId(req);
    if (run && run !== String(task.runId || task.id || '')) return false;
    if (req.sourceTaskId && req.sourceTaskId !== task.id) return false;
    if (req.taskId && [task.id,task.actionTaskId].indexOf(req.taskId) < 0) return false;
    return !!run || (!!req.sourceTaskId && req.sourceTaskId === task.id);
  }
  function runActive(botId, event, pending, tasks){
    var run = runId(event);
    return !!run && ((pending && pending.botId === botId && String(pending.id) === run) || (tasks || []).some(function(t){
      return active(t) && t.botId === botId && String(t.runId || t.id) === run && (!event.sourceTaskId || event.sourceTaskId === t.id);
    }));
  }
  function advance(turn, event){
    if (!turn || !event || event.botId !== turn.botId || runId(event) !== String(turn.id)) return {};
    var kind = event.type || event.kind || event.event, patch = {};
    if (kind === 'call') {
      patch.phase = event.name === 'tasks_dispatch' ? 'dispatching' : event.name === 'tasks_wait' ? 'waiting' : 'executing';
      patch.brainToolName = String(event.name || ''); patch.brainCallId = String(event.id || '');
      patch.brainWaitTaskId = event.name === 'tasks_wait' ? String(event.args && event.args.taskId || '') : '';
    } else if (kind === 'approval-pending' && turn.brainCallId && event.name === turn.brainToolName) {
      patch.brainApprovalId = String(event.id || '');
    } else if (kind === 'approval-resolved' && turn.brainApprovalId === event.id) {
      patch.brainApprovalId = '';
      patch.phase = event.ok === true ? (turn.brainToolName === 'tasks_dispatch' ? 'dispatching' : 'executing') : 'planning';
    } else if (kind === 'paused') patch.phase = 'paused';
    else if (kind === 'resumed') patch.phase = 'planning';
    else if (kind === 'result' && turn.brainCallId === event.id && turn.brainToolName === event.name) {
      patch.phase = 'planning'; patch.brainToolName = ''; patch.brainCallId = ''; patch.brainWaitTaskId = '';
      var data = event.data;
      if (event.name === 'tasks_wait' && event.ok === true && data && data.id === turn.brainWaitTaskId
          && terminal(data) && child(data,turn.botId) && data.parentRunId === turn.id) {
        patch.brainReadTaskIds = (turn.brainReadTaskIds || []).filter(function(id){ return id !== data.id; }).concat(data.id);
      }
    }
    return patch;
  }
  function summarize(input){
    input = input || {};
    var primary = input.primaryId, turn = input.pending, tasks = input.tasks || [], approvals = input.approvals || {}, pauses = input.pausedRuns || {};
    var empty = {state:'idle',botId:primary || '',label:COPY.idle.label,sub:'',workers:[],counts:{}};
    if (!input.enabled || !primary) return empty;
    var related = tasks.filter(function(t){ return relevant(t,primary); });
    function approval(t){ return (approvals[t.botId] || []).some(function(r){ return matchesApproval(r,t.botId,t); }); }
    function paused(t){ var p = pauses[String(t.runId || t.id)]; return !!(p && p.active && p.botId === t.botId); }
    function status(t){ return active(t) ? (approval(t) ? 'approval' : paused(t) ? 'paused' : t.status) : t.status; }
    var running = related.some(function(t){ return status(t) === 'running'; });
    var hasApproval = related.some(approval) || !!(turn && (approvals[primary] || []).some(function(r){ return (!r.state || r.state === 'pending') && runId(r) === String(turn.id); }));
    var hasPause = related.some(paused) || !!(turn && turn.phase === 'paused');
    var ownApproval = !!(turn && (approvals[primary] || []).some(function(r){ return (!r.state || r.state === 'pending') && runId(r) === String(turn.id); }));
    var ownStage = turn && !ownApproval && turn.phase;
    var currentChildren = turn ? tasks.filter(function(t){ return child(t,primary) && t.parentRunId === turn.id; }) : [];
    var readIds = turn && turn.brainReadTaskIds || [];
    var allRead = currentChildren.length > 0 && currentChildren.every(function(t){ return terminal(t) && readIds.indexOf(t.id) >= 0; });
    var stage = ownStage === 'dispatching' ? 'dispatching' : running || ownStage === 'executing' ? 'executing'
      : hasApproval ? 'approval' : hasPause ? 'paused'
      : turn && allRead ? 'summarizing'
      : related.length || ownStage === 'waiting' || currentChildren.length ? 'waiting'
      : turn ? 'planning' : 'idle';
    if (stage === 'idle') return empty;
    var visible = tasks.filter(function(t){ return child(t,primary) && t.botId !== primary && (active(t) || (turn && t.parentRunId === turn.id && terminal(t))); });
    var byBot = Object.create(null), counts = {running:0,queued:0,approval:0,paused:0,done:0,failed:0,canceled:0,interrupted:0};
    visible.forEach(function(t){ var s = status(t); if (counts[s] !== undefined) counts[s]++; (byBot[t.botId] || (byBot[t.botId] = [])).push(t); });
    var order = ['running','approval','paused','queued','failed','interrupted','canceled','done'];
    var workers = Object.keys(byBot).map(function(id){
      var list = byBot[id], bot = (input.bots || []).filter(function(b){ return b.id === id; })[0];
      list.sort(function(a,b){ return order.indexOf(status(a)) - order.indexOf(status(b)) || (b.endedAt || b.createdAt || 0) - (a.endedAt || a.createdAt || 0); });
      return {botId:id,name:bot && bot.name || list[0].botName || tr('执行 Bot',"Execution Bot"),avatar:bot && bot.avatar || 'orbit',color:bot && bot.color || '',status:status(list[0]),taskCount:list.length};
    }).sort(function(a,b){ return order.indexOf(a.status)-order.indexOf(b.status) || a.botId.localeCompare(b.botId); });
    var copy = COPY[stage], sub = copy.sub;
    if (stage === 'executing') sub = counts.running ? counts.running+tr(' 项正在执行'," running")+(counts.approval ? ' · '+counts.approval+tr(' 项待批准'," awaiting approval") : counts.paused ? ' · '+counts.paused+tr(' 项已暂停'," paused") : '') : tr('主脑正在执行本轮操作',"Main Bot is carrying out this request");
    if (stage === 'summarizing' && (counts.failed || counts.canceled || counts.interrupted)) sub = tr('正在整理结果与未完成事项',"Organizing results and unfinished work");
    return {state:stage,botId:primary,label:copy.label,sub:sub,workers:workers,counts:counts};
  }
  return {summarize:summarize,advance:advance,active:active,child:child,relevant:relevant,runId:runId,matchesApproval:matchesApproval,runActive:runActive};
});
