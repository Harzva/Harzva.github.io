/* Minimal local display projection. No transcript, command, credential or filesystem paths. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotHabblaudProjection = api;
})(typeof window === 'object' ? window : this, function () {
  'use strict';
  var statuses = ['idle','queued','thinking','working','waiting','done','error','interrupted'];
  function text(value, max) { return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0,max); }
  function seed(value) { var n=2166136261; for(var i=0;i<value.length;i++) n=Math.imul(n^value.charCodeAt(i),16777619); return n>>>0; }
  function timestamp(value) { var n=typeof value==='number'?value:typeof value==='string'?Date.parse(value):NaN; return Number.isFinite(n)?n:null; }
  function routeLabel(value,max) { value=text(value,max); return /:\/\/|[\\]|(?:\/Users\/|\/home\/|\/Volumes\/)|^(?:\/|~|sk-|xai-)|(?:api.?key|token|password|secret)\s*[:=]/i.test(value)?'':value; }
  var harnessNames = {'dsh':'DeepSeek Harness','pi':'Pi Agent Core','legacy':'Bot Studio','agent:kimi':'Kimi Code','agent:codex':'Codex','agent:claude':'Claude Code','agent:gemini':'Gemini CLI'};
  function registryState(value) { return ['yes','no','unknown'].includes(value)?value:'unknown'; }
  function bindingRevision(bot) { return Number.isSafeInteger(bot.settingsRevision)&&bot.settingsRevision>=0?bot.settingsRevision:0; }
  function bindingSignature(bots) {
    return JSON.stringify((Array.isArray(bots)?bots:[]).filter(function(bot){return bot&&typeof bot.id==='string';}).map(function(bot){
      return [bot.id,bindingRevision(bot),bot.harness||'',bot.model||'',bot.providerId||'',bot.agent&&bot.agent.id||'',bot.agent&&bot.agent.model||'',bot.agent&&bot.agent.transport||''];
    }).sort(function(a,b){return a[0].localeCompare(b[0]);}));
  }
  function routeFor(bot, availability) {
    var route = (availability && Array.isArray(availability.bots) ? availability.bots : []).find(function(item){return item && item.botId === bot.id;}) || {};
    if (route.bindingRevision!==undefined && route.bindingRevision!==bindingRevision(bot)) route={};
    var fallback = bot.agent && bot.agent.id ? 'agent:' + bot.agent.id : bot.harness || 'dsh';
    var harnessId = routeLabel(route.harnessId || fallback,100) || 'unknown';
    if(!/^[a-z0-9][a-z0-9:._-]{0,99}$/i.test(harnessId))harnessId='unknown';
    var descriptor=(availability&&Array.isArray(availability.harnesses)?availability.harnesses:[]).find(function(item){return item&&item.id===harnessId;});
    return {harnessId:harnessId,harnessName:routeLabel(route.harnessName || descriptor&&descriptor.name || harnessNames[harnessId] || harnessId,80),
      model:routeLabel(Object.prototype.hasOwnProperty.call(route,'model')?route.model:(bot.agent ? bot.agent.model : bot.model) || '',120),
      light:['on','dim','off','unknown'].includes(route.light)?route.light:'unknown',
      reason:/^[a-z0-9_-]{1,64}$/.test(route.reason||'')?route.reason:'unknown',
      health:{state:text(route.health && route.health.state || 'unknown',32),checkedAt:timestamp(route.health && route.health.checkedAt),expiresAt:timestamp(route.health && route.health.expiresAt)},
      quota:{state:text(route.quota && route.quota.state || 'unknown',32),remainingPercent:route.quota && Number.isFinite(route.quota.remainingPercent)?Math.max(0,Math.min(100,route.quota.remainingPercent)):null,
        observedAt:timestamp(route.quota && route.quota.observedAt),resetAt:timestamp(route.quota && route.quota.resetAt)}};
  }
  function create() {
    var times = new Map(), revision=0, startedAt=Date.now();
    return function project(input) {
      input=input||{};
      var now=Number.isFinite(input.now)?input.now:Date.now();
      var spaces=Array.isArray(input.spaces)?input.spaces.filter(function(s){return s&&typeof s.id==='string'&&Array.isArray(s.memberBotIds);}):[];
      var selected=input.spaceId?spaces.find(function(s){return s.id===input.spaceId;}):null;
      var scoped=!!input.spaceMode||!!input.spaceId;
      var bots=(Array.isArray(input.bots)?input.bots:[]).filter(function(b){
        return b&&typeof b.id==='string'&&b.id.length>0&&(!scoped||(selected&&selected.memberBotIds.includes(b.id)));
      });
      var rooms=[], roomMap=new Map(), ids=new Set();
      function addRoom(harness) {
        if(!harness||typeof harness.id!=='string')return;
        var id=routeLabel(harness.id,100);
        if(!/^[a-z0-9][a-z0-9:._-]{0,99}$/i.test(id))return;
        var roomId='harness:'+id;
        if(roomMap.has(roomId))return roomMap.get(roomId);
        var room={id:roomId,name:routeLabel(harness.name,80)||id,path:'',slot:rooms.length,seed:seed(roomId),createdAt:startedAt,
          openbot:{harnessId:id,kind:['api','native'].includes(harness.kind)?harness.kind:'unknown',installed:registryState(harness.installed),
            configured:registryState(harness.configured),readiness:'unknown',occupants:0}};
        rooms.push(room);roomMap.set(roomId,room);return room;
      }
      // Halls describe supported executors, independently of current occupants.
      // An invalid Space still fails closed; a valid empty Space has no actors.
      if(!scoped||selected)(input.availability&&Array.isArray(input.availability.harnesses)?input.availability.harnesses:[]).forEach(addRoom);
      var agents=bots.filter(function(b){if(ids.has(b.id))return false;ids.add(b.id);return true;}).map(function(b){
        var p=typeof input.presence==='function'?input.presence(b.id)||{}:{};
        var status=statuses.includes(p.status)?p.status:'idle';
        var time=times.get(b.id);
        if(!time||time.status!==status){time={status:status,since:now};times.set(b.id,time);}
        var route=routeFor(b,input.availability);
        var roomId='harness:'+route.harnessId;
        var room=roomMap.get(roomId)||addRoom({id:route.harnessId,name:route.harnessName});
        if(room)room.openbot.occupants++;
        var label=text(p.label||status,80), working=status==='working'||status==='thinking';
        return {id:b.id,kind:'main',roomId:roomId,name:text(b.name||b.id,80),look:seed(b.id)%2?'f':'m',role:'BOT',
          sessionId:b.id,account:'',status:working?'working':status==='waiting'?'waiting':'idle',
          waitingFor:status==='waiting'?label:undefined,
          activity:{id:b.id+':'+status+':'+time.since,kind:status==='error'?'error':status==='done'?'done':working?'think':'wait',icon:status==='waiting'?'✋':status==='error'?'!':'',text:label,at:time.since},
          recent:[],tasks:[],startedAt:startedAt,lastEventAt:time.since,statusSince:time.since,
          stats:{toolCalls:0,tokensIn:0,tokensOut:0,subagents:0},seed:seed(b.id),
          openbot:{status:status,label:label,activeCount:Number.isSafeInteger(p.activeCount)&&p.activeCount>0?p.activeCount:0,
            harnessId:route.harnessId,harnessName:route.harnessName,model:route.model,
            light:route.light,reason:route.reason,health:route.health,quota:route.quota,
            avatar:text(b.avatar,80),color:/^#[0-9a-f]{6}$/i.test(b.color||'')?b.color:'#5b8cff',selected:b.id===input.activeId}};
      });
      Array.from(times.keys()).forEach(function(id){if(!ids.has(id))times.delete(id);});
      return {rev:++revision,serverTime:now,rooms:rooms,agents:agents,accounts:[],
        meta:{demo:false,sources:[],startedAt:startedAt,version:'openbot-local-office',terminal:false,messages:false}};
    };
  }
  return {create:create,bindingSignature:bindingSignature};
});
