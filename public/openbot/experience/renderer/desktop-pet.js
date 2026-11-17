(function(){
  'use strict';
  var tr=function(zh,en){return window.OpenBotI18n?window.OpenBotI18n.t(zh,en):zh;};
  if(window.OpenBotI18n)window.OpenBotI18n.localize(document);
  var api=window.openbotPet,view=null,count=0,reactionUntil=0,reactionTimer=null,lastTouch=0,lastAttention='';
  // Shared by render() and the autonomous motion engine (locomotion, dialogue,
  // sprite clip). Keeping this inside render() made the ticker throw
  // ReferenceError and silently stop the whole idle animation loop.
  var agentToPetMap={
    'agent-claude':'pal-clawd',
    'agent-openai':'pal-openai-spark',
    'agent-deepseek':'pal-deepseek-whale',
    'agent-grok':'pal-grok-saturn',
    'agent-grok-bot':'pal-grok-saturn',
    'agent-antigravity':'pal-antigravity-spark',
    'agent-kimi':'pal-kimi-star',
    'agent-qwen':'pal-qwen-gem'
  };
  // Declared up front so renderReminders() can honour the speech lifetime
  // instead of reading a half-initialised object during the first host update.
  var bubbleState={activeText:'',badge:'',visibleUntil:0,nextAllowedTime:0};
  var hovered=false,manualExpanded=null,expandBusy=false,queuedExpansion=null,hoverReleaseTimer=null;
  // `hovered` is panel-wide (it owns expansion/collapse). Motion ownership is
  // narrower: only a pointer actually over a pet touch element may defer the
  // autonomous engine. With one shared flag, moving from the pet to the bubble
  // cleared the gaze but still froze every idle animation indefinitely.
  var petHoveredEl=null;
  // An unfocused window still reports document.hidden === false (switching to
  // another app is not the same as hiding the document). Without this flag the
  // 95ms sprite ticker, fidget callbacks and the sound engine all keep working
  // for a window nobody is looking at.
  var windowFocused=true;
  function motionSuppressed(){
    return Boolean(document.hidden)||!windowFocused||
      document.body.dataset.companionMode==='quiet'||
      matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  var $=function(id){return document.getElementById(id);};
  var panel=$('pet-panel'),details=$('pet-details'),more=$('pet-more'),moreToggle=$('pet-more-toggle');
  var validEdges=['free','top','bottom','left','right'];
  var statusText={
    idle:function(){return tr('待命','Ready');},
    running:function(){return tr('执行中','Running');},
    queued:function(){return tr('排队中','Queued');},
    thinking:function(){return tr('思考中','Thinking');},
    working:function(){return tr('工作中','Working');},
    waiting:function(){return tr('待审批','Needs approval');},
    done:function(){return tr('已完成','Done');},
    error:function(){return tr('出错','Error');},
    interrupted:function(){return tr('已中断','Interrupted');}
  };
  function isCount(value){return Number.isSafeInteger(value)&&value>=0;}
  function showError(message){
    $('pet-error').textContent=message||tr('主窗口暂时无法连接，请重试。','The main window is unavailable. Try again.');
    $('pet-error').hidden=false;
  }
  function clearError(){
    $('pet-error').textContent='';
    $('pet-error').hidden=true;
  }
  function setManualExpanded(value){
    manualExpanded=value;
    clearTimeout(hoverReleaseTimer);
    hoverReleaseTimer=null;
    if(value===false&&!hovered){
      hoverReleaseTimer=window.setTimeout(function(){
        if(!hovered&&manualExpanded===false)manualExpanded=null;
      },180);
    }
  }
  function scheduleManualRelease(){
    if(manualExpanded!==false)return;
    clearTimeout(hoverReleaseTimer);
    hoverReleaseTimer=window.setTimeout(function(){
      if(!hovered&&manualExpanded===false)manualExpanded=null;
    },180);
  }
  function renderCounts(next,presence){
    var activity=next.activity&&typeof next.activity==='object'?next.activity:{};
    var active=isCount(activity.activeCount)?activity.activeCount:null;
    if(active===null&&!Object.prototype.hasOwnProperty.call(next,'activity')&&isCount(presence.activeCount))active=presence.activeCount;
    var waiting=isCount(activity.waitingCount)?activity.waitingCount:null;
    var tasks=isCount(activity.taskCount)?activity.taskCount:null;
    var parts=[];
    if(tasks!==null&&tasks>0)parts.push(tr('任务','Tasks')+' '+tasks);
    if(active!==null&&active>0)parts.push(tr('运行','Active')+' '+active);
    $('pet-counts').textContent=parts.join('　');
    var attention=presence.status==='waiting'||(waiting!==null&&waiting>0);
    var showWaitCount=waiting!==null&&waiting>0;
    var waitCountLabel=waiting===null?'':waiting===1?tr('1 项','1 approval'):tr(waiting+' 项',waiting+' approvals');
    $('pet-attention').textContent=showWaitCount?(presence.status==='waiting'?waitCountLabel:tr('待审批 '+waiting+' 项','Approvals '+waiting)):'';
    $('pet-attention').hidden=!showWaitCount;
    $('pet-open').dataset.attention=attention?'true':'false';
    return {activeCount:active,waitingCount:waiting,taskCount:tasks,attention:attention};
  }
  function render(next){
    if(next)view=next;
    if(!view)return;
    var bot=view.bot,p=view.presence||{status:'idle'};
    var status=typeof p.status==='string'?p.status:'idle';
    var layout=view.layout&&typeof view.layout==='object'?view.layout:{};
    var edge=validEdges.indexOf(layout.edge)>=0?layout.edge:'free';
    var orientation=layout.orientation==='vertical'||layout.orientation==='horizontal'?layout.orientation:(edge==='left'||edge==='right'?'vertical':'horizontal');
    var expanded=layout.expanded===true;
    var mode=view.mode==='quiet'||view.mode==='lively'||view.mode==='natural'?view.mode:'natural';
    var previousMode=document.body.dataset.companionMode;
    document.body.dataset.companionMode=mode;
    if(previousMode!==mode)cancelAllBubbleReveals();
    if(previousMode!==mode&&mode==='quiet'){
      // Both slots own gaze variables. Clearing only the primary pet left the
      // companion's eyes frozen at the last cursor position in dual-pet mode.
      cancelActiveFidgets();
      settleCompanionPose($('pet-touch'),$('pet-avatar'));
      settleCompanionPose($('pet-touch-secondary'),$('pet-avatar-secondary'));
    }
    document.body.dataset.presence=status;
    document.body.dataset.edge=edge;
    document.body.dataset.orientation=orientation;
    document.body.dataset.expanded=expanded?'true':'false';
    panel.dataset.expanded=expanded?'true':'false';
    details.hidden=!expanded;
    $('pet-details-toggle').setAttribute('aria-expanded',expanded?'true':'false');
    $('pet-details-toggle').textContent=expanded?tr('收起详情','Hide details'):tr('详情','Details');
    $('pet-name').textContent=bot?bot.name:'Bot Studio';
    $('pet-name').title=(bot?bot.name+' · ':'')+tr('拖动这里移动伙伴','Drag here to move your companion');
    var effectiveAvatar=bot?bot.avatar:'';
    if(bot&&typeof effectiveAvatar==='string'&&agentToPetMap[effectiveAvatar]){
      effectiveAvatar=agentToPetMap[effectiveAvatar];
    }else if(bot&&typeof effectiveAvatar==='string'&&effectiveAvatar.indexOf('agent-')===0&&window.OpenBotCharacters&&Array.isArray(window.OpenBotCharacters.characters)&&window.OpenBotCharacters.characters.length){
      var seed=String(bot.id||bot.name||effectiveAvatar),hash=2166136261;
      for(var i=0;i<seed.length;i++)hash=Math.imul(hash^seed.charCodeAt(i),16777619)>>>0;
      effectiveAvatar='pal-'+window.OpenBotCharacters.characters[hash%window.OpenBotCharacters.characters.length].id;
    }
    var avatar=bot?[bot.id,effectiveAvatar,bot.color].join(':'):'';
    if($('pet-avatar').dataset.key!==avatar){
      $('pet-avatar').dataset.key=avatar;
      $('pet-avatar').innerHTML=bot&&window.OpenBotAvatars?window.OpenBotAvatars.markup(effectiveAvatar,bot.color,{size:'companion'}):'';
      reactionUntil=0;
    }
    var secondBot=view.secondaryBot&&view.secondaryBot.id?view.secondaryBot:null;
    var showInlineSecond=Boolean(secondBot&&!view.separateWindows);
    var secondTouch=$('pet-touch-secondary'),secondHolder=$('pet-avatar-secondary');
    document.body.dataset.dualPets=(secondBot||view.partner)?'true':'false';
    document.body.dataset.separateWindows=view.separateWindows?'true':'false';
    if(secondTouch&&secondHolder){
      secondTouch.hidden=!showInlineSecond;
      secondTouch.disabled=!showInlineSecond;
      if(showInlineSecond){
        var secondAvatar=secondBot.avatar||'orbit';
        if(typeof secondAvatar==='string'&&agentToPetMap[secondAvatar]){
          secondAvatar=agentToPetMap[secondAvatar];
        }else if(typeof secondAvatar==='string'&&secondAvatar.indexOf('agent-')===0&&window.OpenBotCharacters&&Array.isArray(window.OpenBotCharacters.characters)&&window.OpenBotCharacters.characters.length){
          var sSeed=String(secondBot.id||secondBot.name||secondAvatar),sHash=2166136261;
          for(var j=0;j<sSeed.length;j++)sHash=Math.imul(sHash^sSeed.charCodeAt(j),16777619)>>>0;
          secondAvatar='pal-'+window.OpenBotCharacters.characters[sHash%window.OpenBotCharacters.characters.length].id;
        }
        var secondKey=[secondBot.id,secondAvatar,secondBot.color].join(':');
        if(secondHolder.dataset.key!==secondKey){
          secondHolder.dataset.key=secondKey;
          secondHolder.innerHTML=window.OpenBotAvatars?window.OpenBotAvatars.markup(secondAvatar,secondBot.color,{size:'companion'}):'';
        }
        secondTouch.setAttribute('aria-label',tr('摸摸','Pet ')+secondBot.name);
        var secondStatus=typeof secondBot.status==='string'?secondBot.status:'idle';
        secondTouch.dataset.pose=secondStatus==='running'?'working':secondStatus;
        if(Date.now()>=reactionUntil&&window.OpenBotAvatars){
          window.OpenBotAvatars.setExpression(secondHolder.querySelector('.ob-avatar'),secondStatus);
        }
      }else{
        secondHolder.dataset.key='';
        secondHolder.innerHTML='';
      }
    }
    $('pet-touch').disabled=!bot;
    $('pet-touch').setAttribute('aria-label',bot?tr('摸摸','Pet ')+bot.name:tr('先创建一个机器人','Create a Bot first'));
    $('pet-status').textContent=bot?(statusText[status]?statusText[status]():p.label||''):tr('还没有伙伴','No companion yet');
    var counts=renderCounts(view,p);
    $('pet-open').textContent=!bot?tr('去创建伙伴','Create a Bot'):counts.attention?tr('去处理审批','Review approval'):status==='done'?tr('看看结果','View results'):status==='error'||status==='interrupted'?tr('查看原因','View details'):tr('回到聊天','Back to chat');
    var attentionStatus=status==='waiting'||status==='error'||status==='interrupted'||counts.waitingCount>0;
    var attentionKey=attentionStatus?status+':'+(counts.waitingCount||0):'';
    if(attentionStatus&&attentionKey!==lastAttention){
      reactionUntil=0;
      clearTimeout(reactionTimer);
      reactionTimer=null;
    }
    lastAttention=attentionKey;
    if(Date.now()>=reactionUntil){
      $('pet-speech').textContent=bot&&window.OpenBotCompanion?window.OpenBotCompanion.line(status,view.mode):tr('先到 Bot Studio 里认识一个伙伴吧。','Create a Bot in Bot Studio to meet your companion.');
      var pose=status==='running'?'working':status;
      $('pet-touch').dataset.pose=pose;
      if(window.OpenBotAvatars)window.OpenBotAvatars.setExpression($('pet-avatar').querySelector('.ob-avatar'),status);
      renderReminders();
    }
    panel.setAttribute('aria-label',bot?tr('桌面伙伴：','Desktop companion: ')+bot.name+(secondBot?' · '+secondBot.name:''):tr('Bot Studio 桌面伙伴','Bot Studio Companion'));
  }
  function botStatusBubble(botObj,statusStr,actObj,idleText){
    if(!botObj)return null;
    var shortName=String(botObj.name||'Bot');
    var hint=botObj.sessionHint&&typeof botObj.sessionHint==='object'?botObj.sessionHint:null;
    var title=(hint&&hint.topic)?String(hint.topic):shortName;
    title=title.replace(/ · (需要查看|待审批|执行中|思考中|已完成).*$/,'').trim();
    if([...title].length>22)title=[...title].slice(0,21).join('')+'…';
    var detail=(hint&&hint.detail)?String(hint.detail):'';
    var waiting=actObj&&isCount(actObj.waitingCount)?actObj.waitingCount:0;
    var active=actObj&&isCount(actObj.activeCount)?actObj.activeCount:0;
    var tasks=actObj&&isCount(actObj.taskCount)?actObj.taskCount:0;
    var isCat=typeof botObj.avatar==='string'&&(botObj.avatar.includes('cat')||botObj.avatar.includes('opcat'));
    if(statusStr==='waiting'||waiting>0){
      return {
        tone:'waiting',
        title:'⚠️ '+title,
        sub:tr('待审批'+(waiting>1?' ('+waiting+')':'')+' · 点击跳转到会话','Approval needed · Click to open')
      };
    }
    if(statusStr==='error'||statusStr==='interrupted'){
      return {
        tone:'error',
        title:'❗ '+title,
        sub:detail||(isCat?tr('🐱 抓到小Bug已被按住 · 点击查看','Caught bug · Click to inspect'):tr('需要查看 · 点击进入会话','Needs attention · Click to open'))
      };
    }
    if(statusStr==='working'||statusStr==='running'||active>0){
      return {
        tone:'working',
        title:'⚡ '+title,
        sub:detail||tr('已运行命令 · 正在执行中…','Running commands…')
      };
    }
    if(statusStr==='thinking'){
      return {
        tone:'thinking',
        title:'💭 '+title,
        sub:detail||tr('正在思考回复 · 点击进入会话','Thinking… · Click to open')
      };
    }
    if(statusStr==='queued'||tasks>0){
      return {
        tone:'working',
        title:'⏳ '+title,
        sub:detail||tr('任务排队中 · 点击进入会话','Queued · Click to open')
      };
    }
    if(statusStr==='done'){
      return {
        tone:'done',
        title:'✅ '+title,
        sub:detail||tr('任务已完成 · 点击查看会话','Done! · Click to view')
      };
    }
    if(statusStr==='idle'){
      if(idleText){
        return {
          tone:'chat',
          title:title,
          sub:detail?(idleText+' · '+detail):idleText
        };
      }
      return null;
    }
    return null;
  }
  var bubbleFadeTimers=new WeakMap();
  var bubbleRevealAnimations=new WeakMap();
  function cancelBubbleReveal(el){
    var reveal=bubbleRevealAnimations.get(el);
    if(reveal){
      if(typeof reveal.cancel==='function')reveal.cancel();
      bubbleRevealAnimations.delete(el);
    }
  }
  // WAAPI animations are NOT CSS animations: `animation:none!important` in the
  // quiet / reduced-motion kill switches cannot stop one already in flight.
  // Runtime switches (mode change, page hide, OS motion preference) must cancel
  // the two bubble entrances explicitly, otherwise they keep playing for the
  // remaining ~260ms after motion was supposedly switched off.
  function cancelAllBubbleReveals(){
    cancelBubbleReveal($('pet-bubble-primary'));
    cancelBubbleReveal($('pet-bubble-secondary'));
  }
  function applyBubbleElement(el,titleEl,subEl,info,botId){
    if(!el)return;
    if(!info||!info.title){
      if(!el.hidden&&!el.classList.contains('ob-bubble-fading')){
        // A fade-out must not fight a still-running entrance animation.
        cancelBubbleReveal(el);
        el.classList.add('ob-bubble-fading');
        var timer=setTimeout(function(){
          el.hidden=true;
          el.classList.remove('ob-bubble-fading');
          el.dataset.botId='';
          if(titleEl&&titleEl.textContent!=='')titleEl.textContent='';
          if(subEl&&subEl.textContent!=='')subEl.textContent='';
        },300);
        bubbleFadeTimers.set(el,timer);
      }
      return;
    }
    var existingTimer=bubbleFadeTimers.get(el);
    if(existingTimer){
      clearTimeout(existingTimer);
      bubbleFadeTimers.delete(el);
    }
    el.classList.remove('ob-bubble-fading');
    var wasHidden=el.hidden;
    if(el.hidden)el.hidden=false;
    // display:none -> visible has no transition starting frame, so the old
    // bubble popped in instantly while it faded out over 280ms. WAAPI gives it
    // a real 260ms entrance without touching the CSS transition (which still
    // owns hover, tone colours and fade-out). Guarded, so quiet / reduced
    // motion / hidden pages keep the instant behaviour.
    if(wasHidden&&typeof el.animate==='function'&&
       document.body.dataset.companionMode!=='quiet'&&
       !document.hidden&&
       !matchMedia('(prefers-reduced-motion: reduce)').matches){
      cancelBubbleReveal(el);
      try{
        bubbleRevealAnimations.set(el,el.animate(
          [{opacity:0,transform:'translateY(6px) scale(0.96)'},
           {opacity:1,transform:'translateY(0) scale(1)'}],
          {duration:260,easing:'cubic-bezier(.34,1.56,.64,1)'}
        ));
      }catch(_){}
    }
    var tone=info.tone||'chat';
    if(el.dataset.tone!==tone)el.dataset.tone=tone;
    var bid=botId||'';
    if(el.dataset.botId!==bid)el.dataset.botId=bid;
    if(titleEl&&subEl){
      if(titleEl.textContent!==info.title)titleEl.textContent=info.title;
      var subText=info.sub||'';
      if(subEl.textContent!==subText)subEl.textContent=subText;
    }else{
      var full=info.title+(info.sub?' · '+info.sub:'');
      if(el.textContent!==full)el.textContent=full;
    }
  }
  function renderReminders(idleA,idleB,badgeText){
    // Retire expired autonomous speech. Without this, visibleUntil is only
    // ever written: a chatty line sticks around forever and hides the real
    // status bubble. Explicit interaction lines are passed in by callers and
    // are intentionally unaffected.
    if(bubbleState.activeText&&Date.now()>bubbleState.visibleUntil){
      bubbleState.activeText='';
      bubbleState.badge='';
    }
    if(!view||!view.bot){
      applyBubbleElement($('pet-bubble-primary'),$('pet-bubble-title'),$('pet-bubble-sub'),null,'');
      applyBubbleElement($('pet-bubble-secondary'),$('pet-bubble-secondary-title'),$('pet-bubble-secondary-sub'),null,'');
      if($('pet-interact-badge'))$('pet-interact-badge').hidden=true;
      return;
    }
    var pStatus=view.presence&&typeof view.presence.status==='string'?view.presence.status:'idle';
    var textA=idleA!==undefined?idleA:(bubbleState.activeText||'');
    var b1=botStatusBubble(view.bot,pStatus,view.activity,textA);
    applyBubbleElement($('pet-bubble-primary'),$('pet-bubble-title'),$('pet-bubble-sub'),b1,view.bot.id);
    var second=view.secondaryBot&&view.secondaryBot.id&&!view.separateWindows?view.secondaryBot:null;
    if(second){
      var sStatus=typeof second.status==='string'?second.status:'idle';
      var textB=idleB!==undefined?idleB:'';
      var b2=botStatusBubble(second,sStatus,second.activity,textB);
      applyBubbleElement($('pet-bubble-secondary'),$('pet-bubble-secondary-title'),$('pet-bubble-secondary-sub'),b2,second.id);
    }else{
      applyBubbleElement($('pet-bubble-secondary'),$('pet-bubble-secondary-title'),$('pet-bubble-secondary-sub'),null,'');
    }
    var badgeEl=$('pet-interact-badge');
    if(badgeEl){
      var partnerNearby=Boolean(second||(view.partner&&view.partner.nearby));
      var effectiveBadge=badgeText||(bubbleState.badge)||((pStatus==='waiting')?'!':(pStatus==='working'||pStatus==='running')?'⚡':pStatus==='done'?'✨':'');
      // A single pet has no partner, but explicit interaction feedback
      // (poke / fidget / feeding / dizzy) still deserves its badge.
      var hasExplicitBadge=Boolean(badgeText)||Boolean(bubbleState.badge);
      if((partnerNearby||hasExplicitBadge)&&effectiveBadge){
        if(badgeEl.hidden)badgeEl.hidden=false;
        if(badgeEl.textContent!==effectiveBadge)badgeEl.textContent=effectiveBadge;
        if(view.partner){
          badgeEl.style.left=view.partner.side==='left'?'6px':'68px';
        }else{
          badgeEl.style.left='72px';
        }
      }else{
        if(!badgeEl.hidden)badgeEl.hidden=true;
      }
    }
  }
  function requestExpansion(expanded,manual){
    if(manual)setManualExpanded(expanded);
    if(!api||typeof api.expand!=='function'){
      showError(tr('主窗口尚未提供展开操作。','The main window does not support expanding the companion yet.'));
      return;
    }
    if(expandBusy){queuedExpansion=expanded;return;}
    if(view&&view.layout&&view.layout.expanded===expanded)return;
    expandBusy=true;
    queuedExpansion=null;
    Promise.resolve().then(function(){return api.expand(expanded);}).then(function(next){
      if(!next||!next.layout||typeof next.layout.expanded!=='boolean')throw new Error('missing companion layout state');
      clearError();render(next);
    }).catch(function(){
      showError(tr('无法调整桌宠大小，请稍后重试。','Could not resize the companion. Try again shortly.'));
    }).finally(function(){
      expandBusy=false;
      var queued=queuedExpansion;
      queuedExpansion=null;
      if(queued!==null&&view&&(!view.layout||view.layout.expanded!==queued))requestExpansion(queued,false);
    });
  }
  function performStateAction(name,arg){
    if(!api||typeof api[name]!=='function'){
      showError(tr('主窗口暂未接通此操作，请重试。','This action is not connected to the main window yet.'));
      return Promise.resolve();
    }
    clearError();
    return Promise.resolve().then(function(){return api[name](arg);}).then(function(next){
      if(!next||!next.layout)throw new Error('missing companion layout state');
      render(next);
      clearError();
      return next;
    }).catch(function(){
      showError(tr('操作未完成，请稍后重试。','The action failed. Try again shortly.'));
    });
  }
  function performAction(name,arg){
    if(!api||typeof api[name]!=='function'){
      showError(tr('主窗口暂时无法连接，请重试。','The main window is unavailable. Try again.'));
      return Promise.resolve();
    }
    clearError();
    return Promise.resolve().then(function(){return api[name](arg);}).catch(function(){
      showError(tr('主窗口暂时无法连接，请重试。','The main window is unavailable. Try again.'));
    });
  }
  function focusWithin(){return panel.contains(document.activeElement);}
  function maybeCollapse(){
    window.setTimeout(function(){
      if(!hovered&&!focusWithin()&&manualExpanded!==true)requestExpansion(false,false);
    },0);
  }
  var dragState=null,suppressClickUntil=0;
  var sound=(function(){
    var ctx=null;
    function getCtx(){
      if(!ctx&&typeof window.AudioContext!=='undefined'){
        try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(_){}
      }
      if(ctx&&ctx.state==='suspended')ctx.resume().catch(function(){});
      return ctx;
    }
    function isMuted(){
      // Keep audio under the SAME suppression contract as JS motion. The old
      // two-condition check forgot document.hidden and window blur, so a pet
      // left running in a background/unfocused window could still make noise.
      return motionSuppressed();
    }
    return {
      boop:function(freq){
        if(isMuted())return;
        var c=getCtx();if(!c)return;
        try{
          var osc=c.createOscillator(),gain=c.createGain();
          var f=freq||360,now=c.currentTime;
          osc.type='sine';
          osc.frequency.setValueAtTime(f,now);
          osc.frequency.exponentialRampToValueAtTime(f*1.4,now+0.07);
          gain.gain.setValueAtTime(0.045,now);
          gain.gain.exponentialRampToValueAtTime(0.001,now+0.10);
          osc.connect(gain);gain.connect(c.destination);
          osc.start(now);osc.stop(now+0.10);
        }catch(_){}
      },
      purr:function(){
        if(isMuted())return;
        var c=getCtx();if(!c)return;
        try{
          var now=c.currentTime;
          var osc1=c.createOscillator(),osc2=c.createOscillator(),gain=c.createGain();
          osc1.type='sine';osc1.frequency.setValueAtTime(32,now);
          osc1.frequency.linearRampToValueAtTime(38,now+0.15);
          osc1.frequency.linearRampToValueAtTime(30,now+0.32);
          osc2.type='triangle';osc2.frequency.setValueAtTime(64,now);
          osc2.frequency.linearRampToValueAtTime(72,now+0.15);
          gain.gain.setValueAtTime(0.045,now);
          gain.gain.exponentialRampToValueAtTime(0.001,now+0.35);
          osc1.connect(gain);osc2.connect(gain);gain.connect(c.destination);
          osc1.start(now);osc2.start(now);osc1.stop(now+0.35);osc2.stop(now+0.35);
        }catch(_){}
      },
      meow:function(){
        if(isMuted())return;
        var c=getCtx();if(!c)return;
        try{
          var osc=c.createOscillator(),gain=c.createGain();
          var now=c.currentTime;
          osc.type='sine';
          osc.frequency.setValueAtTime(680,now);
          osc.frequency.exponentialRampToValueAtTime(840,now+0.08);
          osc.frequency.exponentialRampToValueAtTime(560,now+0.25);
          gain.gain.setValueAtTime(0.001,now);
          gain.gain.linearRampToValueAtTime(0.04,now+0.04);
          gain.gain.exponentialRampToValueAtTime(0.001,now+0.26);
          osc.connect(gain);gain.connect(c.destination);
          osc.start(now);osc.stop(now+0.26);
        }catch(_){}
      },
      chime:function(){
        if(isMuted())return;
        var c=getCtx();if(!c)return;
        try{
          var now=c.currentTime;
          [880,1318.5].forEach(function(f,i){
            var osc=c.createOscillator(),gain=c.createGain();
            osc.type='sine';
            osc.frequency.setValueAtTime(f,now+i*0.07);
            gain.gain.setValueAtTime(0.04,now+i*0.07);
            gain.gain.exponentialRampToValueAtTime(0.001,now+i*0.07+0.24);
            osc.connect(gain);gain.connect(c.destination);
            osc.start(now+i*0.07);osc.stop(now+i*0.07+0.24);
          });
        }catch(_){}
      },
      pop:function(){
        if(isMuted())return;
        var c=getCtx();if(!c)return;
        try{
          var osc=c.createOscillator(),gain=c.createGain();
          var now=c.currentTime;
          osc.type='sine';
          osc.frequency.setValueAtTime(620,now);
          osc.frequency.exponentialRampToValueAtTime(260,now+0.06);
          gain.gain.setValueAtTime(0.04,now);
          gain.gain.exponentialRampToValueAtTime(0.001,now+0.07);
          osc.connect(gain);gain.connect(c.destination);
          osc.start(now);osc.stop(now+0.07);
        }catch(_){}
      },
      crunch:function(){
        if(isMuted())return;
        var c=getCtx();if(!c)return;
        try{
          var now=c.currentTime;
          [0,0.08,0.16].forEach(function(offset){
            var osc=c.createOscillator(),gain=c.createGain();
            var f=750+Math.random()*360;
            osc.type='triangle';
            osc.frequency.setValueAtTime(f,now+offset);
            osc.frequency.exponentialRampToValueAtTime(140,now+offset+0.05);
            gain.gain.setValueAtTime(0.06,now+offset);
            gain.gain.exponentialRampToValueAtTime(0.001,now+offset+0.055);
            osc.connect(gain);gain.connect(c.destination);
            osc.start(now+offset);osc.stop(now+offset+0.055);
          });
        }catch(_){}
      },
      giggle:function(){
        if(isMuted())return;
        var c=getCtx();if(!c)return;
        try{
          var now=c.currentTime;
          [520,660,580,740].forEach(function(f,i){
            var osc=c.createOscillator(),gain=c.createGain();
            osc.type='sine';
            osc.frequency.setValueAtTime(f,now+i*0.06);
            gain.gain.setValueAtTime(0.035,now+i*0.06);
            gain.gain.exponentialRampToValueAtTime(0.001,now+i*0.06+0.055);
            osc.connect(gain);gain.connect(c.destination);
            osc.start(now+i*0.06);osc.stop(now+i*0.06+0.055);
          });
        }catch(_){}
      }
    };
  })();
  var lastUserActivity=Date.now(),isSleepy=false;
  function markUserActivity(){
    lastUserActivity=Date.now();
    if(isSleepy){
      isSleepy=false;
      var touch=$('pet-touch');
      if(touch&&touch._mochi){
        var m=touch._mochi;
        m.targetSy=1.18;m.targetTy=-8;m.vsy=0.22;
        m.kick();
      }
      sound.chime();
      renderReminders(tr('✨ 伸个大懒腰！随时待命~','✨ Big stretch! Ready to help~'),tr('✨ 精神饱满！','✨ Fully charged!'),'✨');
    }
  }
  var mochiLines=[
    function(){return tr('噗叽~ 软乎乎糯米团子！','Squishy mochi companion!');},
    function(){return tr('咕啾 ♥ 再揉揉我嘛~','So soft! Rub me again~');},
    function(){return tr('唔~ 软软糯糯好舒服呀','Mmm~ Soft and cozy!');},
    function(){return tr('Q弹充能完毕 ✨ 干劲满满','Bouncy & recharged ✨');}
  ];
  // Restore the neutral pose when motion is switched off. The spring used to
  // just drop its data attribute, leaving the last inline squish/tilt frozen
  // on screen (quiet mode also disables the CSS transition that would ease it).
  function clearMochiTransform(holderEl){
    if(!holderEl)return;
    delete holderEl.dataset.mochiActive;
    holderEl.style.transform='';
    var avatarEl=holderEl.querySelector('.ob-avatar');
    if(avatarEl){
      Array.prototype.forEach.call(
        avatarEl.querySelectorAll('.obf-face-sway,.obx-face,.ob-face,.obf-gaze,.obx-pupil,.obf-spark,.obx-spark'),
        function(node){if(node.style)node.style.removeProperty('transform');}
      );
    }
  }
  function createMochiSpring(holderEl,touchEl){
    var m={
      sy:1,vsy:0,targetSy:1,
      skew:0,vskew:0,targetSkew:0,
      rot:0,vrot:0,targetRot:0,
      tx:0,vtx:0,targetTx:0,
      ty:0,vty:0,targetTy:0,
      lx:0,ly:0,
      rubDist:0,lastX:null,lastY:null,
      raf:0
    };
    function step(){
      m.raf=0;
      if(!holderEl||document.body.dataset.companionMode==='quiet'||matchMedia('(prefers-reduced-motion: reduce)').matches){
        clearMochiTransform(holderEl);
        return;
      }
      m.vsy=(m.vsy+(m.targetSy-m.sy)*0.20)*0.77;m.sy+=m.vsy;
      m.vskew=(m.vskew+(m.targetSkew-m.skew)*0.22)*0.76;m.skew+=m.vskew;
      m.vrot=(m.vrot+(m.targetRot-m.rot)*0.22)*0.76;m.rot+=m.vrot;
      m.vtx=(m.vtx+(m.targetTx-m.tx)*0.22)*0.76;m.tx+=m.vtx;
      m.vty=(m.vty+(m.targetTy-m.ty)*0.22)*0.76;m.ty+=m.vty;
      var cSy=Math.max(0.66,Math.min(1.36,m.sy));
      var cSx=1/Math.pow(cSy,0.86);
      holderEl.dataset.mochiActive='true';
      holderEl.style.transform='translate3d('+m.tx.toFixed(2)+'px,'+m.ty.toFixed(2)+'px,0) rotate('+m.rot.toFixed(2)+'deg) skewX('+m.skew.toFixed(2)+'deg) scale('+cSx.toFixed(3)+','+cSy.toFixed(3)+')';
      var avatarEl=holderEl.querySelector('.ob-avatar');
      if(avatarEl){
        Array.prototype.forEach.call(avatarEl.querySelectorAll('.obf-face-sway,.obx-face,.ob-face'),function(face){
          face.style.transformOrigin='64px 74px';
          face.style.setProperty('transform','translate('+(m.lx*0.95).toFixed(2)+'px,'+(m.ly*0.95).toFixed(2)+'px) rotate('+(m.rot*0.35).toFixed(2)+'deg)','important');
        });
        Array.prototype.forEach.call(avatarEl.querySelectorAll('.obf-gaze,.obx-pupil'),function(pupil){
          pupil.style.setProperty('transform','translate('+(m.lx*0.85).toFixed(2)+'px,'+(m.ly*0.85).toFixed(2)+'px)','important');
        });
      }
      var settled=!dragState&&
        Math.abs(m.vsy)<0.0015&&Math.abs(m.sy-m.targetSy)<0.003&&
        Math.abs(m.vskew)<0.02&&Math.abs(m.skew-m.targetSkew)<0.04&&
        Math.abs(m.vrot)<0.02&&Math.abs(m.rot-m.targetRot)<0.04&&
        Math.abs(m.vtx)<0.03&&Math.abs(m.tx-m.targetTx)<0.05&&
        Math.abs(m.vty)<0.03&&Math.abs(m.ty-m.targetTy)<0.05;
      if(!settled){
        m.raf=window.requestAnimationFrame(step);
      }else if(m.targetSy===1&&m.targetTy===0&&m.targetRot===0&&m.targetSkew===0){
        delete holderEl.dataset.mochiActive;
      }
    }
    m.kick=function(){
      if(!m.raf)m.raf=window.requestAnimationFrame(step);
    };
    return m;
  }
  function bindPetTouchInteractions(touchEl,holderEl,getTargetBot,partnerTouchEl,partnerHolderEl){
    if(!touchEl||!holderEl)return;
    var mochi=createMochiSpring(holderEl,touchEl);
    touchEl._mochi=mochi;
    touchEl.addEventListener('pointerdown',function(e){
      if(e.button!==0||!e.isPrimary)return;
      markUserActivity();
      if(api&&typeof api.attention==='function')api.attention('press');
      if(flingRaf){window.cancelAnimationFrame(flingRaf);flingRaf=0;}
      sound.boop();
      dragState={
        id:e.pointerId,
        touchEl:touchEl,
        holderEl:holderEl,
        mochi:mochi,
        startX:e.screenX,
        startY:e.screenY,
        sentX:e.screenX,
        sentY:e.screenY,
        latestX:e.screenX,
        latestY:e.screenY,
        vx:0,
        vy:0,
        moved:false,
        moveRaf:0
      };
      // 按下瞬间像软糯米团子一样压扁 (Mochi Press Squish)
      mochi.targetSy=0.78;
      mochi.targetTy=6;
      mochi.vsy-=0.14;
      mochi.kick();
      try{this.setPointerCapture(e.pointerId);}catch(_){}
    });
    touchEl.addEventListener('click',function(e){
      // The second click of a double-click belongs to the dblclick handler
      // (open the Bot); do not fire a second poke/sound for it.
      if(e.detail>=2)return;
      markUserActivity();
      if(api&&typeof api.attention==='function')api.attention('poke');
      var targetBot=getTargetBot();
      if(Date.now()<suppressClickUntil||!view||!targetBot||Date.now()-lastTouch<240)return;
      var status=view.presence&&view.presence.status;
      var waitingCount=view.activity&&isCount(view.activity.waitingCount)?view.activity.waitingCount:0;
      if(status==='waiting'||status==='error'||status==='interrupted'||waitingCount>0)return;
      lastTouch=Date.now();
      sound.pop();
      var rect=this.getBoundingClientRect();
      var relX=rect.width>0?Math.max(-1,Math.min(1,(e.clientX-rect.left-rect.width/2)/(rect.width/2))):0;
      // 方向性戳一戳 Q弹形变 (Directional Mochi Poke)
      mochi.targetSy=1;mochi.targetTy=0;mochi.targetTx=0;mochi.targetRot=0;mochi.targetSkew=0;
      mochi.vsy=-0.25;
      mochi.vty=4.5;
      mochi.vtx=-relX*7.5;
      mochi.vrot=relX*15;
      mochi.vskew=-relX*11;
      mochi.kick();
      var idx=count++;
      var r=window.OpenBotCompanion.react('pet',idx);
      var mochiText=mochiLines[idx%mochiLines.length]();
      reactionUntil=Date.now()+r.ttl;
      $('pet-speech').textContent=r.text;
      touchEl.dataset.pose='pet';
      if(window.OpenBotAvatars&&holderEl)window.OpenBotAvatars.setExpression(holderEl.querySelector('.ob-avatar'),'pet');
      if(partnerTouchEl&&partnerHolderEl&&!partnerTouchEl.hidden){
        partnerTouchEl.dataset.pose='done';
        if(window.OpenBotAvatars)window.OpenBotAvatars.setExpression(partnerHolderEl.querySelector('.ob-avatar'),'done');
      }
      var isPrimaryTouch=touchEl.id==='pet-touch';
      renderReminders(isPrimaryTouch?'♥ '+mochiText:tr('👏 好耶！一起加油~','👏 Yay! Let’s go~'),!isPrimaryTouch?'♥ '+mochiText:tr('👏 贴贴！元气满满~','👏 Nuzzle! Full of energy~'),'♥');
      clearTimeout(reactionTimer);
      reactionTimer=setTimeout(function(){render();},r.ttl+10);
    });
    touchEl.addEventListener('pointermove',function(e){
      if(dragState&&e.pointerId===dragState.id){
        var totalDx=e.screenX-dragState.startX,totalDy=e.screenY-dragState.startY;
        dragState.vx=e.screenX-dragState.latestX;
        dragState.vy=e.screenY-dragState.latestY;
        dragState.latestX=e.screenX;
        dragState.latestY=e.screenY;
        if(dragState.moved||Math.hypot(totalDx,totalDy)>=4){
          dragState.moved=true;
          // 拎起悬空弹性拉伸 + 速度钟摆倾斜 (Elastic Dangling Pendulum)
          mochi.targetSy=1.13;
          mochi.targetTy=-6;
          mochi.targetRot=Math.max(-20,Math.min(20,-dragState.vx*0.95));
          mochi.targetSkew=Math.max(-12,Math.min(12,dragState.vx*0.55));
          mochi.kick();
          if(!dragState.moveRaf){
            dragState.moveRaf=window.requestAnimationFrame(function(){
              if(!dragState)return;
              dragState.moveRaf=0;
              var stepDx=Math.round(dragState.latestX-dragState.sentX);
              var stepDy=Math.round(dragState.latestY-dragState.sentY);
              if((stepDx!==0||stepDy!==0)&&api&&typeof api.move==='function'){
                dragState.sentX+=stepDx;
                dragState.sentY+=stepDy;
                api.move(stepDx,stepDy,'move');
              }
            });
          }
        }
        return;
      }
      if(document.hidden||!view||document.body.dataset.companionMode==='quiet'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      var r=this.getBoundingClientRect();
      var nx=r.width>0?Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2))):0;
      var ny=r.height>0?Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height/2))):0;

      // 1. 光标快速绕圈逗弄检测 (Circling & Dizzy Whirl)
      var cx=r.left+r.width/2,cy=r.top+r.height/2;
      var curAngle=Math.atan2(e.clientY-cy,e.clientX-cx);
      var nowTime=Date.now();
      if(!touchEl._circling)touchEl._circling={lastAngle:curAngle,lastTime:nowTime,totalDelta:0};
      var cData=touchEl._circling;
      var dTheta=curAngle-cData.lastAngle;
      if(dTheta>Math.PI)dTheta-=2*Math.PI;
      else if(dTheta<-Math.PI)dTheta+=2*Math.PI;
      cData.lastAngle=curAngle;
      if(nowTime-cData.lastTime<1400){
        cData.totalDelta+=dTheta;
      }else{
        cData.totalDelta=dTheta;
      }
      cData.lastTime=nowTime;
      if(Math.abs(cData.totalDelta)>=3.6*Math.PI&&Date.now()>(touchEl._dizzyUntil||0)){
        touchEl._dizzyUntil=Date.now()+2400;
        cData.totalDelta=0;
        touchEl.dataset.dizzy='true';
        mochi.vrot=dTheta>0?30:-30;
        mochi.vskew=dTheta>0?20:-20;
        mochi.vsy=-0.18;
        mochi.kick();
        sound.boop();
        renderReminders(tr('💫 晕乎乎~ 别转啦！','💫 Dizzy~ Stop spinning!'),tr('💫 呜哇好晕呀~','💫 So dizzy!'),'💫');
        setTimeout(function(){
          delete touchEl.dataset.dizzy;
        },2400);
      }

      // 2. 四向空间感知姿态 (Left/Right Lean, Top Stretch, Bottom Crouch)
      if(Date.now()>(touchEl._dizzyUntil||0)){
        if(nx<-0.22){
          mochi.targetRot=nx*8.5;
          mochi.targetSkew=nx*5.5;
          mochi.targetTx=nx*5.0;
        }else if(nx>0.22){
          mochi.targetRot=nx*8.5;
          mochi.targetSkew=nx*5.5;
          mochi.targetTx=nx*5.0;
        }else{
          mochi.targetRot=0;
          mochi.targetSkew=0;
          mochi.targetTx=0;
        }
        if(ny<-0.30){
          mochi.targetSy=Math.min(1.22,1.0-ny*0.26);
          mochi.targetTy=Math.max(-9,ny*8);
        }else if(ny>0.28){
          mochi.targetSy=Math.max(0.80,1.0-ny*0.24);
          mochi.targetTy=Math.min(7,ny*6);
        }else{
          mochi.targetSy=1;
          mochi.targetTy=0;
        }
      }

      this.style.setProperty('--ob-look-x',(nx*1.35)+'px');
      this.style.setProperty('--ob-look-y',(ny*1.15)+'px');
      mochi.lx=nx*5.2;
      mochi.ly=ny*4.2;
      mochi.kick();
      if(mochi.lastX!==null&&mochi.lastY!==null){
        var mvx=e.clientX-mochi.lastX,mvy=e.clientY-mochi.lastY;
        var dist=Math.hypot(mvx,mvy);
        if(dist>0.5&&dist<60){
          // 鼠标滑过身体时的软糯果冻轻抚形变 (Soft Mochi Stroking)
          mochi.vskew+=Math.max(-3.5,Math.min(3.5,mvx*0.22));
          mochi.vrot+=Math.max(-3.0,Math.min(3.0,mvx*0.18));
          mochi.vsy-=Math.min(0.038,dist*0.0022);
          mochi.vtx+=Math.max(-2.0,Math.min(2.0,mvx*0.10));
          mochi.rubDist+=dist;
          mochi.kick();
          if(mochi.rubDist>155&&Date.now()-lastTouch>600){
            mochi.rubDist=0;
            markUserActivity();
            if(api&&typeof api.attention==='function')api.attention('stroke');
            var isChin=ny>0.15;
            var isCatPet=view&&view.bot&&typeof view.bot.avatar==='string'&&(view.bot.avatar.includes('cat')||view.bot.avatar.includes('opcat'));
            if(isCatPet){
              sound.purr();
              if(isChin)sound.meow();
            }else{
              sound.purr();
            }
            lastTouch=Date.now();
            mochi.vsy=-0.20;
            mochi.vskew+=5;
            mochi.kick();
            reactionUntil=Date.now()+1800;
            touchEl.dataset.pose='pet';
            if(window.OpenBotAvatars&&holderEl)window.OpenBotAvatars.setExpression(holderEl.querySelector('.ob-avatar'),'pet');
            var petText=isCatPet?(isChin?tr('🐱 呼噜呼噜… 挠下巴最舒服啦~','🐱 Purr purr... Chin scratch feels best~'):tr('🐾 踩奶踩奶！元气充能完毕~','🐾 Kneading! Full of cat energy~')):(isChin?tr('♥ 挠挠下巴，软乎乎好舒服~','♥ Chin rubs, so soft and cozy~'):tr('♥ 唔~ 软乎乎好舒服呀~','♥ Mmm~ Soft and cozy~'));
            renderReminders(petText,tr('✨ 伙伴被摸头啦，超开心~','✨ Partner is petted, so happy~'),'♥');
            clearTimeout(reactionTimer);
            reactionTimer=setTimeout(function(){render();},1850);
          }
        }
      }
      mochi.lastX=e.clientX;
      mochi.lastY=e.clientY;
    });
    touchEl.addEventListener('pointerup',finishDrag);
    touchEl.addEventListener('pointercancel',finishDrag);
    touchEl.addEventListener('pointerleave',function(){
      if(petHoveredEl===touchEl)petHoveredEl=null;
      delete this.dataset.dizzy;
      // The CSS dizzy animation stops on leave; without clearing the cooldown
      // the next spin within 2.4s gives no feedback at all.
      this._dizzyUntil=0;
      if(this._circling)this._circling.totalDelta=0;
      this.style.removeProperty('--ob-look-x');
      this.style.removeProperty('--ob-look-y');
      mochi.lastX=null;mochi.lastY=null;mochi.rubDist=0;
      mochi.lx=0;mochi.ly=0;
      if(!dragState){
        mochi.targetSy=1;mochi.targetTy=0;mochi.targetTx=0;mochi.targetRot=0;mochi.targetSkew=0;
        mochi.kick();
      }
    });
    touchEl.addEventListener('dblclick',function(){
      if(Date.now()<suppressClickUntil)return;
      var targetBot=getTargetBot();
      performAction('open',targetBot&&targetBot.id);
    });
    touchEl.addEventListener('pointerenter',function(e){
      if(e.pointerType==='touch'||dragState)return;
      petHoveredEl=touchEl;
      hovered=true;
      mochi.lastX=e.clientX;mochi.lastY=e.clientY;
      mochi.vsy-=0.06;
      mochi.kick();
      clearTimeout(hoverReleaseTimer);
      hoverReleaseTimer=null;
    });
  }
  var flingRaf=0;
  function startFling(initVx,initVy){
    if(api&&typeof api.attention==='function')api.attention('fling');
    if(flingRaf){window.cancelAnimationFrame(flingRaf);flingRaf=0;}
    var curVx=Math.max(-28,Math.min(28,initVx*1.25));
    var curVy=Math.max(-28,Math.min(28,initVy*1.25));
    var friction=0.89;
    var touch=$('pet-touch');
    var m=touch&&touch._mochi;
    if(m){
      m.vrot=Math.max(-22,Math.min(22,-curVx*1.1));
      m.vskew=Math.max(-14,Math.min(14,curVx*0.7));
      m.kick();
    }
    sound.boop();
    function flingStep(){
      flingRaf=0;
      curVx*=friction;
      curVy*=friction;
      var stepDx=Math.round(curVx);
      var stepDy=Math.round(curVy);
      var spd=Math.hypot(curVx,curVy);
      if(spd<0.6||(stepDx===0&&stepDy===0)){
        if(api&&typeof api.move==='function')api.move(0,0,'end');
        if(m){
          m.targetSy=1;m.targetTy=0;m.targetRot=0;m.targetSkew=0;
          m.vsy=-0.22;m.vty=4.0;
          m.kick();
        }
        return;
      }
      if(api&&typeof api.move==='function'){
        Promise.resolve(api.move(stepDx,stepDy,'fling')).then(function(res){
          if(res&&(res.bouncedX||res.bouncedY)){
            sound.boop();
            if(res.bouncedX){
              curVx=-curVx*0.55;
              if(m){m.vrot=-m.vrot*0.8;m.vskew=-m.vskew*0.8;m.vsy=-0.20;m.kick();}
            }
            if(res.bouncedY){
              curVy=-curVy*0.55;
              if(m){m.vsy=-0.24;m.vty=-m.vty*0.5;m.kick();}
            }
          }
          if(Math.hypot(curVx,curVy)>=0.6&&!dragState){
            flingRaf=window.requestAnimationFrame(flingStep);
          }else if(api&&typeof api.move==='function'){
            api.move(0,0,'end');
          }
        }).catch(function(){
          if(api&&typeof api.move==='function')api.move(0,0,'end');
        });
      }
    }
    flingRaf=window.requestAnimationFrame(flingStep);
  }
  function finishDrag(e){
    if(!dragState||e.pointerId!==dragState.id)return;
    if(dragState.moveRaf){
      window.cancelAnimationFrame(dragState.moveRaf);
      dragState.moveRaf=0;
    }
    var m=dragState.mochi;
    var wasMoved=dragState.moved;
    var remDx=Math.round(dragState.latestX-dragState.sentX);
    var remDy=Math.round(dragState.latestY-dragState.sentY);
    var vx=dragState.vx||0,vy=dragState.vy||0;
    var speed=Math.hypot(vx,vy);
    dragState=null;
    if(m){
      m.targetSy=1;m.targetTy=0;m.targetTx=0;m.targetRot=0;m.targetSkew=0;
      // 松手时注入 Q 弹果冻落地回弹冲量 (Jelly Boing Landing)
      m.vsy=wasMoved?-0.26:-0.16;
      m.vty=wasMoved?5.5:2.5;
      m.kick();
    }
    if(wasMoved){
      suppressClickUntil=Date.now()+260;
      if(speed>=6.5){
        startFling(vx,vy);
      }else if(api&&typeof api.move==='function'){
        api.move(remDx,remDy,'end');
      }
    }
  }
  bindPetTouchInteractions($('pet-touch'),$('pet-avatar'),function(){return view&&view.bot;},$('pet-touch-secondary'),$('pet-avatar-secondary'));
  bindPetTouchInteractions($('pet-touch-secondary'),$('pet-avatar-secondary'),function(){return view&&view.secondaryBot;},$('pet-touch'),$('pet-avatar'));
  if($('pet-bubble-primary')){
    $('pet-bubble-primary').addEventListener('click',function(e){
      e.stopPropagation();
      var targetId=this.dataset.botId||(view&&view.bot&&view.bot.id);
      performAction('open',targetId);
    });
  }
  if($('pet-bubble-secondary')){
    $('pet-bubble-secondary').addEventListener('click',function(e){
      e.stopPropagation();
      var targetId=this.dataset.botId||(view&&view.secondaryBot&&view.secondaryBot.id);
      performAction('open',targetId);
    });
  }
  $('pet-details-toggle').addEventListener('click',function(){
    var next=!(view&&view.layout&&view.layout.expanded===true);
    requestExpansion(next,true);
  });
  panel.addEventListener('pointerenter',function(e){
    if(e.pointerType==='touch'||dragState)return;
    hovered=true;
    markUserActivity();
    clearTimeout(hoverReleaseTimer);
    hoverReleaseTimer=null;
  });
  panel.addEventListener('pointerleave',function(e){
    if(e.pointerType==='touch')return;
    hovered=false;
    petHoveredEl=null;
    scheduleManualRelease();
    maybeCollapse();
  });
  panel.addEventListener('focusin',function(e){
    if(e.target===moreToggle||e.target===$('pet-touch')||e.target===$('pet-touch-secondary'))return;
    if(manualExpanded!==false)requestExpansion(true,false);
  });
  panel.addEventListener('focusout',maybeCollapse);
  more.addEventListener('toggle',function(){
    if(more.open){requestExpansion(true,false);return;}
    if(manualExpanded===false)requestExpansion(false,false);
    else maybeCollapse();
  });
  panel.querySelectorAll('[data-dock-edge]').forEach(function(button){
    button.addEventListener('click',function(){
      var edge=button.getAttribute('data-dock-edge');
      if(validEdges.indexOf(edge)<0)return;
      performStateAction('dock',edge).then(function(){
        more.open=false;
        if(moreToggle)moreToggle.focus();
      });
    });
  });
  $('pet-open').addEventListener('click',function(){performAction('open');});
  if($('pet-skin-market')){
    $('pet-skin-market').addEventListener('click',function(){
      more.open=false;
      performAction('open');
    });
  }
  $('pet-hide').addEventListener('click',function(){performAction('hide');});
  if($('pet-recall-all')){
    $('pet-recall-all').addEventListener('click',function(){
      more.open=false;
      performAction('recallAll');
    });
  }
  if($('pet-trigger-chase')){
    $('pet-trigger-chase').addEventListener('click',function(){
      more.open=false;
      if(api&&typeof api.triggerChase==='function'){
        api.triggerChase();
      }
    });
  }
  document.addEventListener('keydown',function(e){
    markUserActivity();
    if(e.key!=='Escape')return;
    if(more.open){more.open=false;moreToggle.focus();e.preventDefault();return;}
    if(view&&view.layout&&view.layout.expanded===true){
      setManualExpanded(false);
      requestExpansion(false,false);
      $('pet-details-toggle').focus();
      e.preventDefault();
      return;
    }
    performAction('hide');
  });
  document.addEventListener('visibilitychange',function(){
    var hiddenNow=Boolean(document.hidden);
    document.body.dataset.pageHidden=hiddenNow?'true':'false';
    // CSS only pauses CSS animations on a hidden page. All JS-owned state has
    // to be dropped immediately: gaze, spring deformation, in-flight reveals,
    // fidget timers and hover/drag ownership. Ownership is the important one:
    // leaving petHoveredEl set makes the autonomous engine defer forever after
    // the page comes back, with no pointerleave event to clear it.
    if(hiddenNow){
      settleInteractionState();
    }else{
      // A window can become visible again WITHOUT a focus event (Electron
      // hide()/show(), always-on-top reshuffle). Ask the document whether it
      // really has focus instead of blindly clearing the flag: a visible
      // window still sitting behind another app must stay suppressed.
      if(typeof document.hasFocus==='function'&&document.hasFocus())windowFocused=true;
      // The tick queued while suppressed can be ~2s away. Reschedule it now so
      // the pet reacts as soon as the user is back, not on the old long delay.
      if(windowFocused)scheduleNextTick(120);
    }
  });
  // Switching to another app does not necessarily hide the page. Without this,
  // the eyes stay pointed at the old cursor and the pet stays frozen until the
  // pointer happens to move again.
  window.addEventListener('blur',function(){windowFocused=false;settleInteractionState();});
  // A focus event is the primary "the user is back" signal; the visibility
  // branch above covers the case where it never arrives. Kick the autonomous
  // engine immediately so breathing/gaze resume without waiting out the long
  // tick delay that was queued while the window was suppressed.
  window.addEventListener('focus',function(){windowFocused=true;scheduleNextTick(120);});
  // OS-level motion preference can flip while the window is open; there is no
  // render() call to piggyback on, so cancel any in-flight entrance directly.
  var motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
  if(motionQuery&&typeof motionQuery.addEventListener==='function'){
    motionQuery.addEventListener('change',function(e){
      // An OS preference flip does not call render() and does not kick the
      // spring, so no RAF early-exit will ever clean up. Settling only the
      // WAAPI reveal left gaze, the last inline squish, pose, spring targets
      // and queued fidget stages frozen on screen with CSS transitions off.
      if(e&&e.matches)settleMotionState();
    });
  }
  var idleTick=0;
  function applyDesktopStep(holderEl,touchEl,step,stepIdx){
    if(!holderEl||!touchEl||!step)return;
    var avatarEl=holderEl.querySelector('.ob-avatar');
    if(!avatarEl)return;
    if(window.OpenBotAvatars)window.OpenBotAvatars.setExpression(avatarEl,step.expr);
    var svg=avatarEl.querySelector('svg.obf-avatar,svg.obx-avatar');
    if(svg)svg.setAttribute('data-state',step.state);
    holderEl.style.transform='translate('+(step.tx||0)+'px,'+(step.ty||0)+'px) rotate('+(step.rot||0)+'deg) scale('+(step.sx||1)+','+(step.sy||1)+')';
    touchEl.style.setProperty('--ob-look-x',(step.lx||0)+'px');
    touchEl.style.setProperty('--ob-look-y',(step.ly||0)+'px');
    Array.prototype.forEach.call(avatarEl.querySelectorAll('.obf-face-sway,.obx-face,.ob-face'),function(face){
      face.style.transformOrigin='64px 74px';
      face.style.setProperty('transform','translate('+((step.lx||0)*0.85).toFixed(2)+'px,'+((step.ly||0)*0.85).toFixed(2)+'px) rotate('+((step.rot||0)*0.4).toFixed(2)+'deg)','important');
    });
    Array.prototype.forEach.call(avatarEl.querySelectorAll('.obf-gaze,.obx-pupil'),function(pupil){
      pupil.style.setProperty('transform','translate('+((step.lx||0)*0.75).toFixed(2)+'px,'+((step.ly||0)*0.75).toFixed(2)+'px)','important');
    });
    Array.prototype.forEach.call(avatarEl.querySelectorAll('.obf-spark,.obx-spark'),function(spark){
      var hasSpark=step.expr==='done'||step.expr==='pet';
      spark.style.setProperty('display',hasSpark?'inline':'none','important');
      spark.style.setProperty('opacity',hasSpark?'1':'0','important');
      spark.style.transformBox='fill-box';
      spark.style.transformOrigin='center';
      spark.style.setProperty('transform',hasSpark?'scale(1.18) rotate('+((stepIdx||0)*22)+'deg)':'scale(1)','important');
    });
  }
  // Fidgets are multi-stage timer chains (up to 1.8s). Once motion is
  // switched off, every pending stage must be cancellable: a late callback
  // would otherwise keep writing spring targets and pose/trick datasets.
  var activeFidgetTimers=[];
  function dropFidgetTimer(id){
    activeFidgetTimers=activeFidgetTimers.filter(function(x){return x!==id;});
  }
  function fidgetTimeout(fn,delay){
    var id=setTimeout(function(){
      dropFidgetTimer(id);
      if(motionSuppressed())return;
      fn();
    },delay);
    activeFidgetTimers.push(id);
    return id;
  }
  function fidgetInterval(fn,delay){
    var id=setInterval(function(){
      if(motionSuppressed()){
        clearInterval(id);
        dropFidgetTimer(id);
        return;
      }
      fn();
    },delay);
    activeFidgetTimers.push(id);
    return id;
  }
  function cancelActiveFidgets(){
    for(var i=0;i<activeFidgetTimers.length;i++){
      clearTimeout(activeFidgetTimers[i]);
      clearInterval(activeFidgetTimers[i]);
    }
    activeFidgetTimers=[];
  }
  function settleCompanionPose(touchEl,holderEl){
    if(touchEl){
      touchEl.dataset.pose='idle';
      delete touchEl.dataset.trick;
      delete touchEl.dataset.dizzy;
      touchEl._dizzyUntil=0;
      touchEl.style.removeProperty('--ob-look-x');
      touchEl.style.removeProperty('--ob-look-y');
      var m=touchEl._mochi;
      if(m){
        m.targetSy=1;m.targetTy=0;m.targetTx=0;m.targetRot=0;m.targetSkew=0;
        m.lx=0;m.ly=0;
      }
    }
    clearMochiTransform(holderEl);
  }
  // Motion-only convergence, shared by hidden/blur and the OS preference
  // change. The latter must NOT touch hover ownership or panel expansion:
  // flipping a system setting while the pointer rests on the pet should stop
  // the animation, not collapse the details the user is reading.
  function settleMotionState(){
    cancelAllBubbleReveals();
    cancelActiveFidgets();
    settleCompanionPose($('pet-touch'),$('pet-avatar'));
    settleCompanionPose($('pet-touch-secondary'),$('pet-avatar-secondary'));
  }
  function settlePanelState(){
    petHoveredEl=null;
    hovered=false;
    if(hoverReleaseTimer){clearTimeout(hoverReleaseTimer);hoverReleaseTimer=null;}
    // A hover-expanded panel never receives pointerleave when the page is
    // hidden or the window loses focus, so maybeCollapse() is never called and
    // the details stay expanded forever. Do it synchronously here: the 0ms
    // timer used by maybeCollapse() is throttled on hidden pages anyway.
    if(manualExpanded!==true&&view&&view.layout&&view.layout.expanded===true){
      requestExpansion(false,false);
    }
  }
  function settleInteractionState(){
    settlePanelState();
    if(dragState){
      if(dragState.moveRaf)window.cancelAnimationFrame(dragState.moveRaf);
      dragState=null;
    }
    if(flingRaf){window.cancelAnimationFrame(flingRaf);flingRaf=0;}
    settleMotionState();
  }
  var fidgetTricks=[
    {
      id:'sneeze',
      weight:12,
      run:function(touchEl,holderEl,mochi){
        touchEl.dataset.pose='waiting';
        mochi.targetRot=-14;mochi.targetSy=1.12;mochi.targetTy=-5;mochi.kick();
        renderReminders(tr('🤧 阿嚏！谁在悄悄想我啦？','🤧 Achoo! Who is thinking of me?'),'','🤧');
        fidgetTimeout(function(){
          mochi.targetRot=16;mochi.targetSy=0.80;mochi.targetTy=7;
          mochi.vsy=-0.30;mochi.kick();
          sound.pop();
          if(window.OpenBotAvatars&&holderEl)window.OpenBotAvatars.setExpression(holderEl.querySelector('.ob-avatar'),'done');
          fidgetTimeout(function(){
            mochi.targetRot=0;mochi.targetSy=1;mochi.targetTy=0;mochi.kick();
            touchEl.dataset.pose='idle';
          },650);
        },450);
      }
    },
    {
      id:'yawn',
      weight:14,
      run:function(touchEl,holderEl,mochi){
        touchEl.dataset.pose='idle';
        mochi.targetSy=1.16;mochi.targetTy=-7;mochi.targetRot=3;mochi.targetTx=0;mochi.kick();
        renderReminders(tr('🥱 嗷呜~ 伸个小懒腰，活力值+1！','🥱 Yawn~ Big stretch, energy +1!'),'','🥱');
        fidgetTimeout(function(){
          mochi.targetSy=1;mochi.targetTy=0;mochi.targetRot=0;mochi.vsy=0.12;mochi.kick();
        },1200);
      }
    },
    {
      id:'paw_wash',
      weight:16,
      run:function(touchEl,holderEl,mochi){
        touchEl.dataset.pose='pet';
        if(window.OpenBotAvatars&&holderEl)window.OpenBotAvatars.setExpression(holderEl.querySelector('.ob-avatar'),'pet');
        renderReminders(tr('🐾 呼噜呼噜洗脸中，保持帅气！','🐾 Washing face & grooming!'),'','🐾');
        sound.purr();
        var tick=0;
        var washTimer=fidgetInterval(function(){
          mochi.vskew=(tick%2===0?6:-6);
          mochi.vsy=-0.05;
          mochi.kick();
          if(++tick>5){
            clearInterval(washTimer);
            touchEl.dataset.pose='idle';
          }
        },160);
      }
    },
    {
      id:'acrobat_flip',
      weight:10,
      run:function(touchEl,holderEl,mochi){
        touchEl.dataset.trick='flip';
        sound.chime();
        renderReminders(tr('🤸 芜湖！后空翻帅不帅？','🤸 Whoosh! Backflip acrobat!'),'','🤸');
        mochi.targetSy=0.72;mochi.targetTy=6;mochi.kick();
        fidgetTimeout(function(){
          mochi.targetSy=1;mochi.vsy=-0.28;mochi.vty=5;mochi.kick();
        },320);
        fidgetTimeout(function(){
          delete touchEl.dataset.trick;
          if(window.OpenBotAvatars&&holderEl)window.OpenBotAvatars.setExpression(holderEl.querySelector('.ob-avatar'),'done');
          fidgetTimeout(function(){touchEl.dataset.pose='idle';},400);
        },850);
      }
    },
    {
      id:'puppy_shake',
      weight:14,
      run:function(touchEl,holderEl,mochi){
        touchEl.dataset.trick='shake';
        sound.boop();
        renderReminders(tr('✨ 抖抖精神！干劲十足！','✨ Shake shake! High energy!'),'','✨');
        fidgetTimeout(function(){
          delete touchEl.dataset.trick;
          touchEl.dataset.pose='idle';
        },1350);
      }
    },
    {
      id:'bubble_dream',
      weight:12,
      run:function(touchEl,holderEl,mochi){
        touchEl.dataset.pose='waiting';
        mochi.targetRot=10;mochi.targetSy=1.05;mochi.lx=3.5;mochi.ly=-4.0;mochi.kick();
        renderReminders(tr('💭 悄悄发呆放空三秒钟…','💭 Daydreaming for 3 seconds...'),'','💭');
        fidgetTimeout(function(){
          mochi.targetRot=0;mochi.targetSy=1;mochi.lx=0;mochi.ly=0;mochi.kick();
          touchEl.dataset.pose='idle';
        },1800);
      }
    },
    {
      id:'tap_glass',
      weight:11,
      run:function(touchEl,holderEl,mochi){
        touchEl.dataset.pose='pet';
        mochi.targetSy=1.08;mochi.targetTy=-4;mochi.kick();
        sound.pop();
        renderReminders(tr('✊ 笃笃笃~ 主人写代码别忘喝水哦！','✊ Tap tap~ Remember to drink water!'),'','✊');
        fidgetTimeout(function(){
          mochi.vty=4;mochi.kick();sound.pop();
        },350);
        fidgetTimeout(function(){
          mochi.targetSy=1;mochi.targetTy=0;mochi.kick();
          touchEl.dataset.pose='idle';
        },1200);
      }
    },
    {
      id:'lucky_treat',
      weight:11,
      run:function(touchEl,holderEl,mochi){
        touchEl.dataset.pose='done';
        if(window.OpenBotAvatars&&holderEl)window.OpenBotAvatars.setExpression(holderEl.querySelector('.ob-avatar'),'done');
        sound.chime();
        mochi.targetTy=-6;mochi.targetSy=1.06;mochi.kick();
        renderReminders(tr('🍪 分你半块能量饼干！一起加油~','🍪 Shared a lucky cookie! Keep it up~'),'','🍪');
        fidgetTimeout(function(){
          mochi.targetTy=0;mochi.targetSy=1;mochi.kick();
          touchEl.dataset.pose='idle';
        },1500);
      }
    }
  ];
  var lastTrickId=null,nextTrickTime=Date.now()+5500;
  function maybeTriggerRandomFidget(){
    if(Date.now()<nextTrickTime||Date.now()<reactionUntil||hovered||dragState||isSleepy)return;
    var status=view&&view.presence&&view.presence.status;
    if(status!=='idle')return;
    nextTrickTime=Date.now()+(5500+Math.random()*5000);
    var totalW=0;
    for(var i=0;i<fidgetTricks.length;i++){
      var w=fidgetTricks[i].weight;
      if(fidgetTricks[i].id===lastTrickId)w*=0.15;
      totalW+=w;
    }
    var rnd=Math.random()*totalW;
    var selected=fidgetTricks[0];
    for(var j=0;j<fidgetTricks.length;j++){
      var curW=fidgetTricks[j].weight;
      if(fidgetTricks[j].id===lastTrickId)curW*=0.15;
      if(rnd<=curW){selected=fidgetTricks[j];break;}
      rnd-=curW;
    }
    lastTrickId=selected.id;
    var touch=$('pet-touch'),holder=$('pet-avatar');
    if(touch&&holder&&touch._mochi){
      selected.run(touch,holder,touch._mochi);
      reactionUntil=Date.now()+1800;
    }
  }

  // --- Natural Dialogue, Organic Locomotion & Desynchronized Scheduling Engine ---
  function triggerCharacterSpeech(text, badge, duration) {
    var now = Date.now();
    bubbleState.activeText = text;
    bubbleState.badge = badge || '';
    // Let speech bubble linger for 6.5s ~ 10s so user can read comfortably!
    bubbleState.visibleUntil = now + (duration || (6500 + Math.random() * 3500));
    // Quiet rest period of 16s ~ 30s before the next speech bubble can appear
    bubbleState.nextAllowedTime = bubbleState.visibleUntil + (16000 + Math.random() * 14000);
  }

  var characterDialogues = {
    clawd: [
      tr('☕ 今天也是高效 Coding 的一天！', '☕ Efficient coding day ahead!'),
      tr('✨ 代码写累了？摸摸我休息片刻~', '✨ Tired of coding? Pat me for a quick break~'),
      tr('💻 终端运行井井有条，随时为你待命！', '💻 Terminal running smooth, ready to assist!'),
      tr('🔍 遇到难解的 Bug 别慌，深呼吸~', '🔍 Don\'t panic over bugs, take a deep breath~'),
      tr('🚀 逻辑结构很清晰，干得漂亮！', '🚀 Elegant logic structure, great job!'),
      tr('🐾 像素爪爪时刻守护你的工程代码', '🐾 Pixel paws guarding your project codebase')
    ],
    whale: [
      tr('🌊 正在思维的深海中遨游探索...', '🌊 Navigating the deep sea of thought...'),
      tr('🧠 慢思考，出好活！思维链展开中~', '🧠 Deep thinking yields fine work! Reasoning chain unfolding~'),
      tr('🐋 大海深处有最优雅的算法解法', '🐋 In the ocean depths lie the most elegant algorithms'),
      tr('✨ 复杂问题理清脉络后，其实很简单', '✨ Complex problems become simple once unraveled'),
      tr('🌊 保持专注，灵感如潮水般涌来', '🌊 Stay focused, inspiration flows like ocean waves')
    ],
    spark: [
      tr('✨ 灵感小火花为你持续闪耀！', '✨ Creative spark shining for you!'),
      tr('💡 想要探索新思路吗？随时找我聊聊', '💡 Exploring new ideas? Chat with me anytime'),
      tr('🌟 愿你的每一行代码都充满智慧与美感', '🌟 May every line of your code sparkle with beauty'),
      tr('🎨 逻辑与创意的碰撞，总能诞生奇迹', '🎨 When logic meets creativity, miracles happen')
    ],
    saturn: [
      tr('🪐 宇宙的终极答案会是 42 吗？', '🪐 Could the answer to the universe be 42?'),
      tr('🚀 好奇心是探索未来最棒的飞船！', '🚀 Curiosity is the best vessel to explore the future!'),
      tr('⚡ 换个角度看，这个逻辑其实特别有趣', '⚡ From another angle, this logic is quite fascinating'),
      tr('🌌 星环旋转，数据流在引力中穿梭', '🌌 Rings spinning, data streams drifting through gravity')
    ],
    kimi: [
      tr('⭐ 超长上下文已就位，细节尽在掌握', '⭐ Long context engaged, every detail remembered'),
      tr('📜 无论多长的文档，都能为你条分缕析', '📜 However long the doc, I can parse it cleanly'),
      tr('🌟 记忆星河浩瀚，为你锁住每一个关键点', '🌟 Vast memory river, locking every crucial detail')
    ],
    qwen: [
      tr('💎 如宝石般精炼的回复，随时为你送上', '💎 Crisp gem-like answers, ready when you need'),
      tr('🏮 融汇万千知识，助你一臂之力', '🏮 Blending knowledge from afar to empower your craft'),
      tr('✨ 举一反三，融会贯通，写代码冲呀！', '✨ Connect the dots, master the art, let\'s code!')
    ],
    cat: [
      tr('🐾 喵呜~ 蹭蹭你的手腕，写代码加油！', '🐾 Meow~ Nuzzling your wrist, keep coding!'),
      tr('🐱 呼噜呼噜... 晒太阳的小憩时光真好', '🐱 Purr purr... Sunshine naps are the best'),
      tr('🐟 偷偷闻一闻：今天的代码有小鱼干味吗？', '🐟 Sniff sniff: does today\'s code smell like fish?'),
      tr('🐾 尾巴轻轻摇摆，把所有的 Bug 扫光光！', '🐾 Swishing tail to sweep away all the bugs!'),
      tr('😴 困了就趴在回车键上眯一会儿~', '😴 If sleepy, just nap on the Enter key~')
    ],
    dog: [
      tr('🐶 汪汪！时刻守护主人的桌面与代码！', '🐶 Woof! Always guarding your desktop and code!'),
      tr('🎾 摇尾巴~ 随时准备为主人物色灵感！', '🎾 Wagging tail~ Ready to fetch fresh ideas!'),
      tr('🐕 精神饱满！今天也是元气满满的一天汪！', '🐕 Fully pumped! Full of energy today, woof!')
    ],
    general: [
      tr('✨ 安静守护桌面中，有事随时唤我~', '✨ Peacefully guarding desktop, call me anytime~'),
      tr('💧 深呼吸一下，写代码记得喝口温水哦', '💧 Deep breath, remember to drink some warm water~'),
      tr('🌙 你专心创作，我默默陪着你', '🌙 Focus on creating, I\'m right beside you')
    ]
  };

  var lastSpokenLine = '';
  function pickRandomLineForCurrentPet() {
    var avatarId = view && view.bot ? view.bot.avatar : '';
    var eff = agentToPetMap[avatarId] || avatarId || '';
    var cat = 'general';
    if (eff.indexOf('clawd') >= 0) cat = 'clawd';
    else if (eff.indexOf('whale') >= 0 || eff.indexOf('deepseek') >= 0) cat = 'whale';
    else if (eff.indexOf('spark') >= 0 || eff.indexOf('openai') >= 0) cat = 'spark';
    else if (eff.indexOf('saturn') >= 0 || eff.indexOf('grok') >= 0) cat = 'saturn';
    else if (eff.indexOf('kimi') >= 0) cat = 'kimi';
    else if (eff.indexOf('qwen') >= 0) cat = 'qwen';
    else if (eff.indexOf('cat') >= 0 || eff.indexOf('opcat') >= 0) cat = 'cat';
    else if (eff.indexOf('dog') >= 0) cat = 'dog';

    var pool = characterDialogues[cat] || characterDialogues.general;
    var candidates = pool.filter(function(line){ return line !== lastSpokenLine; });
    var chosen = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
    lastSpokenLine = chosen;
    return chosen;
  }

  function getPetLocomotionStyle(avatarId) {
    var eff = agentToPetMap[avatarId] || avatarId || '';
    if (eff.indexOf('clawd') >= 0) return 'walk';
    if (eff.indexOf('whale') >= 0 || eff.indexOf('saturn') >= 0 || eff.indexOf('spark') >= 0) return 'glide';
    if (eff.indexOf('cat') >= 0 || eff.indexOf('dog') >= 0) return 'walk';
    if (eff.indexOf('fruit') >= 0 || eff.indexOf('shape') >= 0) return 'inchworm';
    return 'walk';
  }

  var clawdMoving = false;
  var lastClawdMarkup = '';
  var petTickTimer = null;

  function computePetSeed() {
    var key = (view && view.slot || 'primary') + ':' + (view && view.bot && view.bot.id || 'default');
    var hash = 0;
    for (var i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i) | 0;
    }
    return Math.abs(hash);
  }

  function runPetAutonomousTick() {
    if (document.hidden || !view || !view.bot || Date.now() < reactionUntil || dragState) {
      if (document.hidden) {
        clearMochiTransform($('pet-avatar'));
        clearMochiTransform($('pet-avatar-secondary'));
      }
      scheduleNextTick(1800);
      return;
    }
    // Every JS-owned motion source must share ONE suppression contract. v5
    // routed only the sprite ticker and audio through motionSuppressed(); this
    // tick kept its own hand-written guard and still wrote gaze, holder
    // transforms, expressions and autonomous speech into an unfocused window.
    if (motionSuppressed()) {
      clearMochiTransform($('pet-avatar'));
      clearMochiTransform($('pet-avatar-secondary'));
      renderReminders();
      scheduleNextTick(2400);
      return;
    }

    // While the pointer is on the pet, the interaction spring owns the pose
    // and the gaze. An autonomous step would otherwise rewrite --ob-look-x/y,
    // the face/pupil transforms and the holder transform every ~2 seconds,
    // making the mouse-following eyes visibly jump back. Keep bubble state
    // fresh, but leave the avatar alone until the pointer leaves. The scope
    // is the pet touch element, NOT the whole panel: moving the pointer to a
    // bubble already clears the gaze, so deferring here would freeze the pet.
    if (petHoveredEl) {
      renderReminders();
      scheduleNextTick(1200);
      return;
    }

    var status = view.presence && view.presence.status || 'idle';
    var now = Date.now();
    var curHour = new Date().getHours();
    var isLateNight = (curHour >= 23 || curHour < 6);
    var idleTime = now - lastUserActivity;
    var isBusy = (status === 'working' || status === 'running' || status === 'thinking' || status === 'waiting') ||
                 (view.activity && (view.activity.activeCount > 0 || view.activity.waitingCount > 0));

    if (isBusy && isSleepy) {
      markUserActivity();
    }
    if (!isBusy && (idleTime > 180000 || (isLateNight && idleTime > 45000))) {
      isSleepy = true;
    }

    var stepIdx = idleTick++;
    var touch = $('pet-touch');
    var avatarEl = $('pet-avatar');
    var partner = view.partner || null;
    var edge = (view.layout && view.layout.edge) || 'free';
    var isSecondarySlot = view.slot === 'secondary';
    var dirToPartner = partner ? (partner.side === 'left' ? -1 : 1) : (isSecondarySlot ? -1 : 1);
    var scene = partner && partner.scene ? partner.scene : 'roam';
    var beat = partner && typeof partner.beat === 'number' ? partner.beat : stepIdx;

    if (isSleepy && status === 'idle' && !avatarEl.dataset.mochiActive) {
      var breath = Math.sin(idleTick * 0.28) * 0.04;
      var sleepStep = { expr: 'idle', state: 'idle', tx: 0, ty: 4 - breath * 15, rot: 0, sx: 1.06 + breath, sy: 0.92 - breath, lx: 0, ly: 2.5 };
      applyDesktopStep(avatarEl, touch, sleepStep, idleTick);
      if (view.secondaryBot && !view.separateWindows && $('pet-touch-secondary') && !$('pet-touch-secondary').hidden) {
        applyDesktopStep($('pet-avatar-secondary'), $('pet-touch-secondary'), sleepStep, idleTick);
      }
      var botName = (view.bot && view.bot.name) || 'Bot';
      var sleepText = tr('💤 ' + botName + ' · 呼噜小憩中… (点击唤醒)', '💤 ' + botName + ' · Snoozing peacefully... (click to wake)');
      renderReminders(sleepText, tr('💤 呼噜小憩中…', '💤 Snoozing...'), '💤');
      scheduleNextTick(2200);
      return;
    }

    var avatarStyle = getPetLocomotionStyle(view.bot && view.bot.avatar);

    if (status === 'idle' && !avatarEl.dataset.mochiActive) {
      // Partner attention reaction
      if (view.attention && view.attention.slot !== view.slot && (now - (view.attention.time || 0) < 3200)) {
        var specStep = {
          expr: 'done', state: 'done',
          tx: 11 * dirToPartner, ty: -7, rot: 9 * dirToPartner, sx: 0.95, sy: 1.05,
          lx: 4.8 * dirToPartner, ly: -1.2
        };
        applyDesktopStep(avatarEl, touch, specStep, stepIdx);
        scheduleNextTick(1800);
        return;
      }

      // Check partner choreo scenes
      var baseStep = { expr: 'idle', state: 'idle', tx: 0, ty: 0, rot: 0, sx: 1.0, sy: 1.0, lx: 0, ly: 0 };
      var activeFacing = dirToPartner < 0 ? 'left' : 'right';

      if (partner && scene === 'chase') {
        var isLeader = !isSecondarySlot;
        touch.dataset.facing = activeFacing;
        touch.dataset.gait = isLeader ? (avatarStyle === 'inchworm' ? 'inchworm' : 'hop') : avatarStyle;
        if (avatarStyle === 'walk') clawdMoving = true;
        var bounce = (beat % 2 === 0) ? -12 : -2;
        baseStep = {
          expr: isLeader ? 'waiting' : 'done',
          state: isLeader ? 'peeking' : 'done',
          tx: 14 * dirToPartner, ty: bounce, rot: 10 * dirToPartner,
          sx: beat % 2 === 0 ? 0.92 : 1.07, sy: beat % 2 === 0 ? 1.08 : 0.93,
          lx: 4.5 * dirToPartner, ly: -1.5
        };
        var chaseLine = isLeader ? tr('💨 略略略~ 追不上我！', '💨 Catch me if you can!') : tr('🏃 别跑！等等我呀~', '🏃 Don\'t run! Wait for me~');
        triggerCharacterSpeech(chaseLine, '⚡', 5000);
      } else if (partner && scene === 'roughhouse') {
        touch.dataset.pose = 'pet';
        touch.dataset.gait = 'hop';
        clawdMoving = false;
        var tumbleWobble = (stepIdx % 2 === 0 ? 12 : -12);
        baseStep = {
          expr: 'done', state: 'done',
          tx: (stepIdx % 2 === 0 ? 8 : -8) * dirToPartner, ty: -10, rot: tumbleWobble,
          sx: 0.90, sy: 1.12, lx: 0, ly: -2.0
        };
        sound.giggle();
        var roughLine = tr('💥 扑倒！抓到你啦~ 哈哈打闹！', '💥 Tag! Caught you~ Rolling & tumbling!');
        triggerCharacterSpeech(roughLine, '🎉', 4500);
      } else if (partner && scene === 'highfive') {
        var lunge = (beat % 2 === 0);
        baseStep = {
          expr: lunge ? 'done' : 'pet', state: 'done',
          tx: (lunge ? 18 : 8) * dirToPartner, ty: lunge ? -12 : -4, rot: (lunge ? 12 : -6) * dirToPartner,
          sx: lunge ? 0.92 : 1.06, sy: lunge ? 1.10 : 0.94, lx: 3.5 * dirToPartner, ly: -2.0
        };
      } else {
        // Natural gentle idle loafing
        touch.dataset.pose = 'idle';
        delete touch.dataset.gait;
        clawdMoving = false;
        var sway = Math.sin(stepIdx * 0.35) * 0.03;
        baseStep = {
          expr: 'idle', state: 'idle',
          tx: Math.round(Math.sin(stepIdx * 0.4) * 4),
          ty: Math.round(Math.cos(stepIdx * 0.3) * 2),
          rot: Math.round(Math.sin(stepIdx * 0.25) * 3),
          sx: 1.0 + sway, sy: 1.0 - sway,
          lx: Math.sin(stepIdx * 0.2) * 3, ly: 0
        };

        // Occasional organic roaming locomotion (walking, sliding, inching)
        if (!hovered && !dragState && edge === 'free' && api && typeof api.move === 'function' && stepIdx % 6 === 0) {
          var roamDx = (stepIdx % 12 === 0) ? 14 : -14;
          var roamDy = Math.round(Math.cos(stepIdx * 0.3) * 4);
          var gait = getPetLocomotionStyle(view.bot && view.bot.avatar);
          touch.dataset.facing = roamDx < 0 ? 'left' : 'right';
          touch.dataset.gait = gait;
          if (avatarStyle === 'walk') clawdMoving = true;
          api.move(roamDx, roamDy, false);
          setTimeout(function(){
            delete touch.dataset.gait;
            clawdMoving = false;
          }, 1100);
        } else if ((!partner || !partner.nearby) && edge === 'free' && Math.random() < 0.15) {
          maybeTriggerRandomFidget();
        }
      }

      applyDesktopStep(avatarEl, touch, baseStep, stepIdx);

      // Autonomous speech trigger: only when cooldown has passed!
      if (now >= bubbleState.nextAllowedTime) {
        if (Math.random() < 0.22) {
          var randomLine = pickRandomLineForCurrentPet();
          triggerCharacterSpeech(randomLine, '✨');
        } else {
          bubbleState.nextAllowedTime = now + 4000;
        }
      }
    } else if (status !== 'idle' && !avatarEl.dataset.mochiActive) {
      avatarEl.style.transform = '';
      delete touch.dataset.gait;
      clawdMoving = false;
    }

    renderReminders();
    scheduleNextTick();
  }

  function scheduleNextTick(exactMs) {
    if (petTickTimer) clearTimeout(petTickTimer);
    var seed = computePetSeed();
    var delay = exactMs || (1900 + ((seed * 37 + idleTick * 19) % 1100));
    petTickTimer = setTimeout(runPetAutonomousTick, delay);
  }

  // Initial desynchronized boot
  var initialBootDelay = 500 + (computePetSeed() % 2000);
  setTimeout(runPetAutonomousTick, initialBootDelay);

  // File Feeding Drag & Drop
  var dropCueEl = $('pet-drop-cue');
  var dragCounter = 0;

  window.addEventListener('dragenter', function(e) {
    e.preventDefault();
    dragCounter++;
    if (dropCueEl) dropCueEl.hidden = false;
    document.body.classList.add('is-dragover');
  });

  window.addEventListener('dragover', function(e) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  });

  window.addEventListener('dragleave', function(e) {
    e.preventDefault();
    dragCounter = Math.max(0, dragCounter - 1);
    if (dragCounter === 0) {
      if (dropCueEl) dropCueEl.hidden = true;
      document.body.classList.remove('is-dragover');
    }
  });

  window.addEventListener('drop', function(e) {
    e.preventDefault();
    dragCounter = 0;
    if (dropCueEl) dropCueEl.hidden = true;
    document.body.classList.remove('is-dragover');

    var files = e.dataTransfer && e.dataTransfer.files;
    if (!files || files.length === 0) return;
    var file = files[0];
    var filePath = file.path || '';
    var fileName = file.name || 'file';
    var fileSize = file.size || 0;

    var targetBot = view ? view.bot : null;
    var secTouch = $('pet-touch-secondary');
    if (secTouch && !secTouch.hidden && view && view.secondaryBot) {
      var secRect = secTouch.getBoundingClientRect();
      if (e.clientX >= secRect.left && e.clientX <= secRect.right &&
          e.clientY >= secRect.top && e.clientY <= secRect.bottom) {
        targetBot = view.secondaryBot;
      }
    }
    if (!targetBot) return;

    sound.crunch();

    var targetTouch = (targetBot === (view && view.secondaryBot) && secTouch) ? secTouch : $('pet-touch');
    if (targetTouch) {
      targetTouch.classList.add('ob-eating');
      setTimeout(function(){ targetTouch.classList.remove('ob-eating'); }, 2200);
      if (targetTouch._mochi) {
        targetTouch._mochi.targetSy = 0.72;
        targetTouch._mochi.targetTy = 6;
        targetTouch._mochi.vsy = -0.28;
        targetTouch._mochi.kick();
      }
    }

    var eatingLine = tr('😋 嚼嚼嚼~ 收到《' + fileName + '》！正在飞速阅读消化中...',
                        '😋 Om nom nom~ Got "' + fileName + '"! Reading & digesting now...');
    triggerCharacterSpeech(eatingLine, '🍖', 9000);
    render();

    if (api && typeof api.feedFile === 'function') {
      api.feedFile({
        botId: targetBot.id,
        path: filePath,
        name: fileName,
        size: fileSize
      });
    }
  });

  // Live animated frame ticker for Anthropic Clawd pixel pet
  var clawdFrameIndex = 0;
  var currentClawdClip = 'Swaying';
  setInterval(function(){
    // The quiet / reduced-motion kill switches only disable CSS animations
    // and transitions. This ticker swaps SVG markup via innerHTML, so without
    // an explicit JS gate the Clawd pet keeps visibly changing frames in
    // "quiet" mode (and keeps doing DOM work 10 times a second).
    // Window focus is a separate axis from document.hidden/quiet/reduced:
    // keep it as its own early return so the three mode gates below stay
    // independently observable (and independently mutable).
    if(!windowFocused)return;
    if (document.hidden ||
        document.body.dataset.companionMode==='quiet' ||
        matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !window.OpenBotAIProduce) return;
    var botObj = view ? view.bot : null;
    var eff = botObj ? (agentToPetMap[botObj.avatar] || botObj.avatar) : '';
    if (eff !== 'pal-clawd' && eff !== 'clawd') return;

    var clawdHolder = $('pet-avatar');
    if (!clawdHolder) return;
    var targetSvg = clawdHolder.querySelector('.ob-ai-clawd');
    if (!targetSvg) return;

    var p = view ? view.presence : null;
    var st = p && p.status ? p.status : (view && view.bot && view.bot.status ? view.bot.status : 'idle');
    var clipName = 'Swaying';
    if (clawdMoving) clipName = 'Walking';
    else if (st === 'working' || st === 'running') clipName = 'Laptop';
    else if (st === 'thinking') clipName = 'Thinking';
    else if (st === 'done') clipName = 'DancingHappy';
    else if (st === 'error' || st === 'alert') clipName = 'Dizzy';
    else if (st === 'rest') clipName = 'Meditating';
    else if (st === 'pet') clipName = 'Excited';
    else if (st === 'wave') clipName = 'Waving';

    var clip = window.OpenBotAIProduce.getClawdClip(clipName);
    if (!clip || !clip.frames || clip.frames.length === 0) return;

    if (currentClawdClip !== clipName) {
      currentClawdClip = clipName;
      clawdFrameIndex = 0;
    }

    clawdFrameIndex = (clawdFrameIndex + 1) % clip.frames.length;
    var svgMarkup = window.OpenBotAIProduce.generateClawdSvg(clipName, clawdFrameIndex, 128, 'ob-ai-state-' + st);
    if (svgMarkup !== lastClawdMarkup) {
      lastClawdMarkup = svgMarkup;
      var parent = targetSvg.parentNode;
      if (parent) {
        parent.innerHTML = svgMarkup;
      }
    }
  }, 95);

  if(api&&typeof api.onUpdate==='function')api.onUpdate(render);
  if(api&&typeof api.state==='function'){
    Promise.resolve().then(function(){return api.state();}).then(render).catch(function(){
      showError(tr('无法读取桌宠状态，操作仍可重试。','Could not read companion status. You can still retry actions.'));
    });
  }else{
    showError(tr('桌宠桥接暂不可用，操作仍可重试。','The companion bridge is unavailable. Actions can be retried.'));
  }
})();
