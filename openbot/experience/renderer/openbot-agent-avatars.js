(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.OpenBotAgentAvatars=factory();
})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  // Pinned Agent HUD artwork. These identities never imply an installed executor.
  var names={openai:'Codex',claude:'Claude',antigravity:'Antigravity',deepseek:'DeepSeek',grok:'Grok','grok-bot':'Grok Bot',cursor:'Cursor',opencode:'OpenCode',kimi:'Kimi',glm:'GLM',pi:'Pi',hermes:'Hermes',zcode:'ZCode',qwen:'Qwen',devin:'Devin',openclaw:'OpenClaw',codebuddy:'CodeBuddy',workbuddy:'WorkBuddy',qoder:'Qoder',copilot:'Copilot'};
  var executors={dsh:'deepseek',pi:'pi','agent:codex':'openai','agent:claude':'claude','agent:agy':'antigravity','agent:grok':'grok','agent:cursor-agent':'cursor','agent:opencode':'opencode','agent:kimi':'kimi','agent:pi':'pi','agent:qwen':'qwen','agent:codebuddy':'codebuddy','agent:workbuddy':'workbuddy','agent:copilot':'copilot'};
  var characters=Object.keys(names).map(function(key){return Object.freeze({id:'agent-'+key,key:key,name:names[key]});});
  function forExecutor(id){return Object.prototype.hasOwnProperty.call(executors,id)?'agent-'+executors[id]:null;}
  var legacyArt={orbit:'pal-capsule',sprout:'pal-sprout',pebble:'pal-mochi',wink:'pal-tuantuan',luma:'pal-moon',nook:'pal-fold',peek:'pal-peek'};
  function artworkFor(id){return Object.prototype.hasOwnProperty.call(legacyArt,id)?legacyArt[id]:id;}
  function availableForRoster(bots,preferred,alternatives){
    var uses=new Map();
    for(var bot of bots){
      var key=artworkFor(bot.avatar || 'orbit');
      uses.set(key,(uses.get(key)||0)+1);
    }
    var pool=Array.from(new Set([preferred].concat(alternatives).filter(Boolean)));
    return pool.reduce(function(best,id){return (uses.get(artworkFor(id))||0)<(uses.get(artworkFor(best))||0)?id:best;});
  }
  return Object.freeze({characters:Object.freeze(characters),ids:Object.freeze(characters.map(function(c){return c.id;})),forExecutor:forExecutor,artworkFor:artworkFor,availableForRoster:availableForRoster});
});
