(function(root){
  'use strict';
  function tr(zh, en, params){
    var i18n = typeof window === 'object' && window.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en, params) : zh;
  }
  // Approved colorful companions. Retired black artwork never renders; stored IDs stay compatible.
  // All paths are local; expressions are a projection of task state, not memory.
  var LEGACY_IDS=['orbit','sprout','pebble','wink','luma','nook','peek'];
  var family=root.OpenBotCharacters;
  var FAMILY_IDS=family?family.characters.map(function(c){return 'pal-'+c.id;}):[];
  var agents=root.OpenBotAgentAvatars;
  var AGENT_IDS=agents?agents.ids:[];
  var studio=root.OpenBotStudioAvatars;
  var STUDIO_IDS=studio?studio.ids:[];
  var IDS=LEGACY_IDS.concat(FAMILY_IDS,AGENT_IDS,STUDIO_IDS);
  var META={
    peek:{name:tr('门门','Peek'),desc:tr('躲在门后，也一直在你身边','Hiding behind the door, always by your side'),tone:'#2878f2'},
    orbit:{name:tr('环环','Orbit'),desc:tr('安静听你说，认真把事做好','Listens quietly and takes care of the details'),tone:'#719be9'},
    sprout:{name:tr('芽芽','Sprout'),desc:tr('慢慢长大，小事也认真','Growing steadily and taking small things seriously'),tone:'#7fb690'},
    pebble:{name:tr('石仔','Pebble'),desc:tr('稳稳当当，是个可靠的小家伙','Steady and dependable'),tone:'#d5a36f'},
    wink:{name:tr('眨眨','Wink'),desc:tr('有一点机灵，有一点小得意','A little clever and quietly proud'),tone:'#d78da9'},
    luma:{name:tr('露露','Luma'),desc:tr('留一盏小灯，陪你理清思路','Keeps a small light on while you think'),tone:'#cba75d'},
    nook:{name:tr('角角','Nook'),desc:tr('安安静静，给想法留个小窝','A quiet corner for your ideas'),tone:'#a39aca'}
  };
  if(family)family.characters.forEach(function(c){META['pal-'+c.id]={name:c.name,desc:c.note,tone:c.color};});
  if(agents)agents.characters.forEach(function(c){META[c.id]={name:c.name,desc:tr('本地 Agent 头像','Local Agent avatar'),tone:'#719be9'};});
  if(studio)studio.characters.forEach(function(c){META[c.id]={name:c.name,desc:c.desc,tone:c.tone};});
  // One stylesheet per window, not one repeated 8 KB style block per icon.
  if(family && !document.getElementById('openbot-character-styles')){
    var style=document.createElement('style');style.id='openbot-character-styles';style.textContent=family.css;document.head.appendChild(style);
  }
  var POSES=['idle','queued','thinking','working','waiting','done','error','interrupted','pet','wave','cheer','rest'];
  function expression(value){return POSES.indexOf(value)>=0?value:'idle';}
  function familyState(pose){return {thinking:'thinking',waiting:'peeking',done:'done',pet:'done',wave:'peeking',cheer:'done',interrupted:'rest',rest:'rest'}[expression(pose)]||'idle';}
  // Old saved identities are presentation aliases, not selectable legacy artwork.
  function displayFor(id){var key=normalize(id);return agents?agents.artworkFor(key):key;}
  function normalize(id){return IDS.indexOf(id)>=0?id:'orbit';}
  function defaultForIndex(index){var n=Number(index);if(!isFinite(n)||n<0)n=0;return LEGACY_IDS[Math.floor(n)%LEGACY_IDS.length];}
  function newForIndex(index){var n=Number(index);if(!isFinite(n)||n<0)n=0;return FAMILY_IDS.length?FAMILY_IDS[Math.floor(n)%FAMILY_IDS.length]:defaultForIndex(n);}
  // Count rendered identities, including legacy aliases that share the same artwork.
  function availableAvatar(bots, preferred){
    return agents?agents.availableForRoster(bots,preferred,FAMILY_IDS.length?FAMILY_IDS:LEGACY_IDS):newForIndex(bots.length);
  }
  var identityColors=[['#256788','#d7ecf4'],['#89582f','#f5e5cd'],['#426c4e','#dcece0'],
    ['#705696','#e9e1f4'],['#924e63','#f6e2e8'],['#386c71','#d5ebea'],['#585f92','#e1e5f7']];
  // Resolve over the full roster so a search, collapse or reorder cannot change a face.
  // Explicit choices keep their artwork. Legacy profiles carry no provenance, so their
  // visual alternatives are projected here without rewriting the stored Bot records.
  function sidebarIdentities(bots){
    var result=new Map(), usedArt=new Set(), repeated=new Map();
    var companions=FAMILY_IDS.length?FAMILY_IDS:LEGACY_IDS;
    // Allocate oldest first. A newly added Bot can use an available face, while
    // an explicit manual choice is allowed to share an existing one.
    var ordered=bots.slice().sort(function(a,b){
      return (a.createdAt||0)-(b.createdAt||0) || (a.id<b.id?-1:a.id>b.id?1:0);
    });
    ordered.forEach(function(bot){
      var shown=displayFor(bot.avatar);
      if(usedArt.has(shown) && bot.avatarChoice!=='manual'){
        var free=companions.find(function(id){return !usedArt.has(displayFor(id));});
        if(free){
          result.set(bot.id,{artwork:free});
          shown=displayFor(free);
        }
      }
      usedArt.add(shown);
      if(!repeated.has(shown))repeated.set(shown,[]);
      repeated.get(shown).push(bot);
    });
    repeated.forEach(function(same){
      if(same.length<2)return;
      var used=new Set();
      same.forEach(function(bot,index){
        var letters=Array.from(String(bot.name||'').toUpperCase()).filter(function(c){return /^[\p{L}\p{N}]$/u.test(c);});
        var letter=letters.find(function(c){return !used.has(c);}) || String(index+1);
        used.add(letter);
        result.set(bot.id,Object.assign({},result.get(bot.id),{letter:letter,colors:identityColors[index%identityColors.length]}));
      });
    });
    return result;
  }
  function defaultForId(value){var text=String(value||'');if(!text)return 'orbit';var hash=7;for(var i=0;i<text.length;i++)hash=(hash*31+text.charCodeAt(i))>>>0;return LEGACY_IDS[hash%LEGACY_IDS.length];}
  function safeTone(value,id){return /^#[0-9a-f]{6}$/i.test(String(value||''))?String(value):META[normalize(id)].tone;}
  var neutralMarkup='<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>';
  function fallbackMarkup(name){
    var first=Array.from(String(name||'').trim())[0]||'';
    if(!first||first==='?'||first==='？')return neutralMarkup;
    return '<span data-visual-fallback="initial">'+first.toUpperCase().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span>';
  }
  function markup(id,tone,opts){
    opts=opts||{};var key=normalize(id),size=['list','header','picker','companion','mini','office','peer','task-peer'].indexOf(opts.size)>=0?opts.size:'list';
    var display=displayFor(opts.identity?.artwork || key),isFamily=FAMILY_IDS.indexOf(display)>=0;
    var graphic=isFamily?family.svg(display.slice(4),{state:familyState(opts.pose),withStyle:false}):'<img src="assets/openbot-mark.svg" alt="">';
    if(AGENT_IDS.indexOf(display)>=0){
      var asset='assets/agent-hud/'+display.slice(6);
      graphic='<img class="ob-agent-light" src="'+asset+'-light.png" alt="" draggable="false"><img class="ob-agent-dark" src="'+asset+'-dark.png" alt="" draggable="false">';
    }else if(STUDIO_IDS.indexOf(display)>=0&&studio){
      var studioFile=studio.fileFor(display);
      if(studioFile)graphic='<img class="ob-studio-avatar" src="assets/bot-studio/'+studioFile+'" alt="" draggable="false">';
    }
    var identity=opts.identity?.colors && opts.identity;
    var style='--ob-accent:'+safeTone(tone,key);
    if(identity){
      style+=';--sidebar-identity-ink:'+identity.colors[0]+';--sidebar-identity-wash:'+identity.colors[1];
      graphic+='<span class="sidebar-avatar-letter">'+identity.letter+'</span>';
    }
    return '<span class="avatar ob-avatar '+(identity?'sidebar-avatar-variant ':'')+'ob-avatar--'+display+' ob-avatar--'+size+(isFamily?' ob-avatar--family':'')+(opts.active?' is-selected':'')+'" data-avatar="'+key+'" data-display-avatar="'+display+'" data-expression="'+expression(opts.pose)+'" style="'+style+'" aria-hidden="true">'+graphic+'</span>';
  }
  function picker(current,tone){
    var selected=displayFor(current);
    function options(ids){return ids.map(function(id){var meta=META[id],pressed=id===selected;return '<button type="button" class="avatar-option'+(pressed?' selected':'')+'" data-avatar="'+id+'" style="--ob-accent:'+safeTone(tone,id)+'" aria-label="'+tr('选择'+meta.name+'：'+meta.desc, 'Choose '+meta.name+': '+meta.desc)+'" aria-pressed="'+pressed+'" title="'+meta.name+' · '+meta.desc+'">'+markup(id,tone,{size:'picker',active:pressed})+'<span class="avatar-option-copy"><span class="avatar-option-name">'+meta.name+'</span></span></button>';}).join('');}
    return '<div class="avatar-family-options" role="group" aria-label="'+tr('机器人头像','Bot avatars')+'">'+(STUDIO_IDS.length?'<div class="avatar-group-label">'+tr('Bot Studio 角色','Bot Studio characters')+'</div>'+options(STUDIO_IDS):'')+(AGENT_IDS.length?'<div class="avatar-group-label">'+tr('Agent 机器人','Agent robots')+'</div>'+options(AGENT_IDS):'')+'<div class="avatar-group-label">'+tr('伙伴角色','Companion characters')+'</div>'+options(FAMILY_IDS)+'</div>';
  }
  function setExpression(element,value){
    if(!element)return;
    element.dataset.expression=expression(value);
    var svg=element.querySelector('svg.obf-avatar,svg.obx-avatar');
    if(svg && family)family.setState(svg,familyState(value));
  }
  function revealSelection(container){
    if(!container)return;
    var selected=container.querySelector('.avatar-family-options .avatar-option.selected');
    if(!selected)return;
    var grid=selected.closest('.avatar-family-options');
    if(!grid.clientHeight)return;
    var item=selected.getBoundingClientRect(),bounds=grid.getBoundingClientRect();
    if(item.top<bounds.top)grid.scrollTop+=item.top-bounds.top;
    else if(item.bottom>bounds.bottom)grid.scrollTop+=item.bottom-bounds.bottom;
  }
  document.addEventListener('toggle',function(event){
    if(event.target.open && event.target.querySelector('.avatar-picker'))revealSelection(event.target);
  },true);
  // Pausing is local to visibility, never a new task state or stored preference.
  function observeMotion(){
    if(!family||!root.IntersectionObserver||!root.MutationObserver)return;
    var visible=new WeakMap(),observed=new Set();
    function sync(svg){svg.dataset.motion=document.hidden||visible.get(svg)!==true?'paused':'auto';}
    var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){visible.set(entry.target,entry.isIntersecting);sync(entry.target);});});
    function icons(node){if(node.nodeType!==1)return [];var selector='.ob-avatar--family svg.obf-avatar,.ob-avatar--family svg.obx-avatar';var items=Array.from(node.querySelectorAll(selector));if(node.matches(selector))items.push(node);return items;}
    function watch(node){icons(node).forEach(function(svg){if(observed.has(svg))return;observed.add(svg);sync(svg);observer.observe(svg);});}
    watch(document.body);
    new MutationObserver(function(records){records.forEach(function(record){record.removedNodes.forEach(function(node){icons(node).forEach(function(svg){if(!svg.isConnected){observer.unobserve(svg);observed.delete(svg);}});});record.addedNodes.forEach(watch);});}).observe(document.body,{subtree:true,childList:true});
    document.addEventListener('visibilitychange',function(){observed.forEach(sync);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeMotion,{once:true});else observeMotion();
  document.addEventListener('error',function(event){
    var image=event.target;
    if(!image||image.tagName!=='IMG'||!image.closest)return;
    var avatar=image.closest('.ob-avatar');
    if(!avatar)return;
    // Keep the healthy theme image and both original theme classes. The page's
    // CSP explicitly allows data: images; this SVG needs no external asset.
    if(image.dataset.visualFallback==='self-contained'&&image.src.indexOf('data:image/svg+xml')===0)return;
    image.dataset.visualFallback='self-contained';
    image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(neutralMarkup);
  },true);
  root.OpenBotAvatars={fallbackMarkup:fallbackMarkup,neutralMarkup:neutralMarkup,ids:IDS.slice(),legacyIds:LEGACY_IDS.slice(),familyIds:FAMILY_IDS.slice(),meta:META,normalize:normalize,displayFor:displayFor,defaultForIndex:defaultForIndex,newForIndex:newForIndex,availableAvatar:availableAvatar,sidebarIdentities:sidebarIdentities,defaultForId:defaultForId,label:function(id){return (META[displayFor(id)]||META[normalize(id)]).name;},markup:markup,picker:picker,revealSelection:revealSelection,setExpression:setExpression,expression:expression};
})(window);
