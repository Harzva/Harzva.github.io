(function(root, factory){
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotCompanion = api;
})(typeof window === 'object' ? window : this, function(){
  'use strict';
  function tr(zh, en, params){
    var i18n = typeof window === 'object' && window.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en, params) : zh;
  }
  var modes = {quiet:tr('安静','Quiet'),natural:tr('自然','Natural'),lively:tr('活泼','Lively')};
  var lines = {
    idle:[tr('我在，慢慢来。','I am here; take it one step at a time.'),tr('偷偷探个头，看看你需不需要帮忙。','Peeking out to see if you need a hand.')],
    queued:[tr('任务还在排队，轮到它就会开始。','The task is queued and will start when it is ready.'),tr('在队伍里啦，先伸个懒腰等一等。','In the queue for now; time for a little stretch.')],
    thinking:[tr('让我理一理思路。','Let me sort through the idea.'),tr('脑袋正在转，先把思路理顺。','Working through the details before moving ahead.')],
    working:[tr('正在处理，你可以先忙别的。','Working on it; you can get on with your day.'),tr('小工位开工了，有结果会在这里显示。','The little workbench is running; the result will appear here.')],
    waiting:[tr('这里需要你批准，先停一下。','Your approval is needed here, so I am paused.'),tr('探头等你：这一步需要你点头。','Peeking out for your go-ahead on this step.')],
    done:[tr('这一轮完成了，可以看看结果。','This round is complete; take a look at the result.'),tr('这一轮收工！来看看结果吧。','This round is done. Here is what came back.')],
    error:[tr('这一步没完成，先看看原因。','This step did not finish; check the reason first.'),tr('碰到一块小石头，先看原因再决定下一步。','We hit a small bump; check the reason before deciding what to do next.')],
    interrupted:[tr('上次的工作中断了，尚未继续执行。','The previous run was interrupted and has not resumed.'),tr('先在这里停住了，等你决定接下来怎么走。','Paused here until you decide how to continue.')]
  };
  function normalizeMode(value){ return Object.prototype.hasOwnProperty.call(modes,value) ? value : 'natural'; }
  function line(status, mode){ var pair=lines[status] || lines.idle; return pair[normalizeMode(mode)==='lively'?1:0]; }
  function react(action, index){
    var pets=[tr('被发现了，我刚刚在偷偷看你。','You caught me peeking.'),tr('收到摸摸，精神加一点。','A little pet gives me a boost.'),tr('好啦，换我陪你一会儿。','All right, I will keep you company for a while.')];
    if (action==='pet') return {text:pets[(Math.abs(index || 0)) % pets.length],pose:'pet',ttl:3200};
    if (action==='hello') return {text:tr('在呢。今天想先做一件什么小事？','I am here. What small thing should we start with today?'),pose:'wave',ttl:4200};
    if (action==='rest') return {text:tr('肩膀松一松，喝口水。事情可以一步一步来。','Relax your shoulders and take a sip of water. One step at a time.'),pose:'rest',ttl:5000};
    if (action==='celebrate') return {text:tr('愿意迈出一小步，也值得给自己一点掌声。','Taking one small step is worth celebrating.'),pose:'cheer',ttl:4200};
    return null;
  }
  function escape(value){return String(value == null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function options(mode){
    mode=normalizeMode(mode);
    return '<div class="ob-companion-modes" role="group" aria-label="'+tr('陪伴方式','Companion style')+'">'+Object.keys(modes).map(function(key){return '<button type="button" data-companion-mode="'+key+'" aria-pressed="'+(key===mode)+'">'+modes[key]+'</button>';}).join('')+'</div>';
  }
  function panel(bot,presence,avatar,mode,reaction,desktop){
    if(!bot)return '<div class="org-empty">'+tr('新建一个机器人，就能认识你的伙伴。','Create a Bot to meet your companion.')+'</div>';
    var needsAttention=['waiting','error','interrupted'].indexOf(presence.status)>=0;
    if(needsAttention)reaction=null;
    var text=reaction?reaction.text:line(presence.status,mode);
    desktop=desktop||{};
    return '<section class="ob-companion" aria-label="'+escape(bot.name)+tr('的伙伴模式', "'s companion mode")+'">'
      +'<div class="ob-companion-heading"><h4>'+escape(bot.name)+'</h4>'+options(mode)+'</div>'
      +'<div class="ob-companion-stage" data-pose="'+escape(reaction?reaction.pose:presence.status)+'">'
      +'<button class="ob-companion-pet" type="button" data-companion-action="pet" aria-label="'+tr('摸摸','Pet ') + escape(bot.name)+'"><span class="ob-companion-face">'+avatar(bot,reaction?reaction.pose:presence.status)+'</span></button>'
      +'<span class="ob-companion-ground" aria-hidden="true"></span></div>'
      +'<p class="ob-companion-speech" aria-live="polite">'+escape(text)+'</p>'
      +'<p class="ob-companion-truth">'+escape(presence.label)+(presence.activeCount?' · '+presence.activeCount+' '+tr('项进行中','in progress'):'')+'</p>'
      +'<div class="ob-companion-actions"><button type="button" data-companion-action="hello">'+tr('打个招呼','Say hello')+'</button><button type="button" data-companion-action="rest">'+tr('歇一下','Take a break')+'</button><button type="button" data-companion-action="celebrate">'+tr('给自己鼓个掌','Celebrate')+'</button></div>'
      +'<div class="ob-companion-next"><button type="button" class="btn primary" data-companion-action="chat">'+tr('去聊天','Chat')+'</button><button type="button" class="btn" data-companion-action="unstick">'+tr('帮我理理思路','Help me think it through')+'</button><button type="button" class="btn" data-companion-action="desktop" aria-pressed="'+!!desktop.enabled+'"'+(desktop.busy?' disabled':'')+'>'+(desktop.busy?tr('正在切换…','Switching…'):desktop.enabled?tr('收起桌面伙伴','Hide desktop companion'):tr('放到桌面','Show on desktop'))+'</button></div>'
      +'<p class="ob-companion-note">'+tr('点击角色试试。这里的小互动在本地完成，不会发送消息或执行任务。','Try clicking the character. These small interactions stay local; they do not send messages or run tasks.')+'</p></section>';
  }
  function bar(bot,presence,avatar,mode){
    if(!bot || normalizeMode(mode)==='quiet')return '';
    return '<button type="button" class="ob-companion-open" data-presence="'+escape(presence.status)+'" data-companion-action="open" aria-label="'+tr('打开','Open ') + escape(bot.name)+tr('的伙伴模式', "'s companion mode")+'">'+avatar(bot,presence.status)+'<span class="ob-companion-bar-copy"><span>'+escape(line(presence.status,mode))+'</span><span class="ob-companion-bar-status">'+escape(presence.label)+' · '+tr('点击和我互动','Click to interact')+'</span></span></button>';
  }
  return {modes:modes,normalizeMode:normalizeMode,line:line,react:react,panel:panel,bar:bar};
});
