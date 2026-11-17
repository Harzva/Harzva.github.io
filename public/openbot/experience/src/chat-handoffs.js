(function(root, factory){
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OpenBotChatHandoffProjection = factory();
})(typeof window === 'object' ? window : this, function(){
  'use strict';
  var STATUSES = ['queued','running','done','failed','canceled','interrupted'];
  var DIRECTIONS = {sent:0,received:1,returned:2,feedback:3};
  function botId(value){ return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value) && ['constructor','prototype','__proto__'].indexOf(value)<0; }
  function id(value){ return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/.test(value) && ['constructor','prototype','__proto__'].indexOf(value)<0; }
  function time(value){ return typeof value==='number' && Number.isFinite(value) && value>0 ? value : 0; }
  function text(value, limit){ return typeof value==='string' ? value.slice(0,limit) : ''; }
  function eligible(task, currentId){
    return task && task.dispatchSource==='bot' && id(task.id) && botId(task.botId) && botId(task.delegatorBotId)
      && task.botId!==task.delegatorBotId && STATUSES.indexOf(task.status)>=0
      && (task.botId===currentId || task.delegatorBotId===currentId)
      && task.readOnly!==true && !task.spaceId && !task.workspaceId
      && (task.instanceId===undefined || task.instanceId===task.id);
  }
  /** Display-only personal-chat projection. Never changes messages or dispatches. */
  function project(input){
    input=input||{};
    if (input.context!=='personal' || !botId(input.botId)) return [];
    var bots=new Map(), seen=new Set(), groups=new Map();
    (Array.isArray(input.bots)?input.bots:[]).forEach(function(bot){ if(bot&&botId(bot.id))bots.set(bot.id,bot); });
    if(!bots.has(input.botId)) return [];
    var rows=(Array.isArray(input.tasks)?input.tasks:[]).filter(function(task){
      return eligible(task,input.botId);
    }).slice().sort(function(a,b){return time(b.createdAt)-time(a.createdAt)||a.id.localeCompare(b.id);}).slice(0,200);
    function add(task,direction,at){
      var peerId=task.botId===input.botId?task.delegatorBotId:task.botId;
      var peer=bots.get(peerId), runId=id(task.parentRunId)?task.parentRunId:'';
      var key=direction+':'+(runId||task.id);
      var group=groups.get(key);
      if(!group){group={id:key,direction:direction,at:at,runId:runId,taskIds:[],peerIds:[],items:[]};groups.set(key,group);}
      if(direction==='returned'||direction==='feedback')group.at=Math.max(group.at,at);
      else if(at)group.at=group.at?Math.min(group.at,at):at;
      var snapshotName=task.botId===input.botId?task.delegatorBotName:task.botName;
      group.taskIds.push(task.id);
      if(group.peerIds.indexOf(peerId)<0)group.peerIds.push(peerId);
      group.items.push({taskId:task.id,peerId:peerId,peerName:text(peer&&peer.name||snapshotName,120)||peerId,
        deleted:!peer,status:task.status,title:text(task.title,160),at:at,
        resultPending:task.resultPending===true||!!task.resultError});
    }
    rows.forEach(function(task){
      if(seen.has(task.id))return;seen.add(task.id);
      if(task.botId===input.botId)add(task,'received',time(task.createdAt));
      else {
        add(task,'sent',time(task.createdAt));
        if(time(task.endedAt) && ['done','failed','canceled','interrupted'].indexOf(task.status)>=0){
          if(task.status==='done' && task.resultPending!==true && !task.resultError)add(task,'returned',time(task.endedAt));
          else add(task,'feedback',time(task.endedAt));
        }
      }
    });
    return Array.from(groups.values()).map(function(group){
      group.items.sort(function(a,b){return a.at-b.at||a.taskId.localeCompare(b.taskId);});
      group.taskIds=group.items.map(function(item){return item.taskId;});
      group.peerIds=Array.from(new Set(group.items.map(function(item){return item.peerId;})));
      return group;
    }).sort(function(a,b){return a.at-b.at||DIRECTIONS[a.direction]-DIRECTIONS[b.direction]||a.id.localeCompare(b.id);});
  }
  return {project:project,eligible:eligible};
});
