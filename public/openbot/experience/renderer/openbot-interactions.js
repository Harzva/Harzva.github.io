(function(root, factory){
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./openbot-brain'));
  else root.OpenBotInteractions = factory(root.OpenBotBrain);
})(typeof window === 'object' ? window : this, function(brain){
  'use strict';
  function tr(zh,en){var i18n=typeof window==='object'?window.OpenBotI18n:null;return i18n?i18n.t(zh,en):zh;}
  // Display-only, rebuilt from authoritative task snapshots. No timers, task
  // dispatch, transcript writes or fallback to an assumed primary identity.
  var LABELS = {queued:tr('等待执行',"Waiting to run"),running:tr('正在执行',"Running"),approval:tr('等待授权',"Awaiting approval"),paused:tr('已暂停',"Paused")};
  var ORDER = ['approval','paused','running','queued'];
  function project(input){
    input = input || {};
    var bots = Object.create(null), byTask = Object.create(null), byBot = Object.create(null);
    (input.bots || []).forEach(function(b){ if (b && typeof b.id === 'string' && b.id) bots[b.id] = b; });
    var approvals = input.approvals || {}, pauses = input.pausedRuns || {};
    var edges = [];
    (input.tasks || []).forEach(function(t){
      if (!t || !t.id || byTask[t.id] || !brain.active(t) || t.dispatchSource !== 'bot'
          || !bots[t.delegatorBotId] || !bots[t.botId] || t.delegatorBotId === t.botId) return;
      var phase = t.status;
      if ((approvals[t.botId] || []).some(function(req){ return brain.matchesApproval(req,t.botId,t); })) phase = 'approval';
      else {
        var pause = pauses[String(t.runId || t.id)];
        if (pause && pause.active && pause.botId === t.botId) phase = 'paused';
      }
      var edge = {taskId:t.id,sourceId:t.delegatorBotId,targetId:t.botId,phase:phase,label:LABELS[phase]};
      byTask[t.id] = edge; edges.push(edge);
      [[edge.sourceId,edge.targetId,'outgoing'],[edge.targetId,edge.sourceId,'incoming']].forEach(function(pair){
        var peers = byBot[pair[0]] || (byBot[pair[0]] = []);
        var peer = peers.filter(function(p){return p.botId === pair[1];})[0];
        if (!peer) { peer = {botId:pair[1],phase:phase,incoming:0,outgoing:0,incomingPhase:'',outgoingPhase:'',taskIds:[]}; peers.push(peer); }
        if (ORDER.indexOf(phase) < ORDER.indexOf(peer.phase)) peer.phase = phase;
        var lane = pair[2]+'Phase';
        if (!peer[lane] || ORDER.indexOf(phase) < ORDER.indexOf(peer[lane])) peer[lane] = phase;
        peer[pair[2]]++; peer.taskIds.push(t.id);
      });
    });
    Object.keys(byBot).forEach(function(id){
      byBot[id].sort(function(a,b){return ORDER.indexOf(a.phase)-ORDER.indexOf(b.phase) || a.botId.localeCompare(b.botId);});
    });
    return {edges:edges,byTask:byTask,byBot:byBot};
  }
  return {project:project,labels:LABELS,peersForDirection:function(peers,direction){
    if (direction !== 'incoming' && direction !== 'outgoing') return [];
    return (peers || []).filter(function(peer){return peer[direction] > 0;}).map(function(peer){
      return {botId:peer.botId,phase:peer[direction+'Phase'],taskCount:peer[direction]};
    }).sort(function(a,b){return ORDER.indexOf(a.phase)-ORDER.indexOf(b.phase) || a.botId.localeCompare(b.botId);});
  }};
});
