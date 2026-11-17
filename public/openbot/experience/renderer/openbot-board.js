/* A keyed panel per Bot: view changes and stream updates never replace editors. */
(function(root){
  'use strict';
  function tr(zh,en){return root.OpenBotI18n?root.OpenBotI18n.t(zh,en):zh;}
  function countLabel(value,zh,one,many){
    var english=typeof window==='object'&&window.OpenBotI18n&&window.OpenBotI18n.locale==='en';
    return english?new Intl.NumberFormat('en').format(Number(value))+' '+(Number(value)===1?one:(many||one+'s')):value+zh;
  }
  var api, host, grid, canvas, queued=false, mode='work', canvasOpened=false;
  var panels=new Map();
  function text(el,value){value=String(value || '');if(el.textContent!==value)el.textContent=value;}
  function icon(name){return root.OpenBotIcons.svg(name);}
  function schedule(){if(!queued){queued=true;root.requestAnimationFrame(render);}}
  function resize(input){input.style.height='auto';var height=Math.min(120,Math.max(32,input.scrollHeight));input.style.height=height+'px';input.closest('.ob-board-panel').style.setProperty('--ob-draft-height',height+'px');}
  function create(bot){
    var el=document.createElement('article');el.className='ob-board-panel';el.dataset.botId=bot.id;
    el.innerHTML='<header class="ob-board-panel-head" tabindex="0" aria-describedby="ob-canvas-help"><button type="button" class="ob-board-avatar"></button><div class="ob-board-identity"><h2>'+api.nameMarkup(bot)+'</h2><div class="ob-board-meta"><span class="ob-board-presence"></span><span class="ob-board-model"></span></div></div><button type="button" class="ob-board-focus">'+icon('eye')+'</button><button type="button" class="ob-board-launch">'+icon('monitor')+'</button><button type="button" class="ob-board-open">'+icon('external')+'</button></header>'
      +tr('<section class="ob-board-stage"><img class="ob-board-screen" hidden><div class="ob-board-wait"><button type="button" class="ob-board-character"></button><p hidden></p></div><div class="ob-board-screen-bar" hidden><div><span class="ob-board-screen-title"></span><span class="ob-board-screen-meta"></span></div><button type="button" class="ob-board-takeover"></button><button type="button" class="ob-board-release" hidden>交还 Bot</button></div></section>',"<section class=\"ob-board-stage\"><img class=\"ob-board-screen\" hidden><div class=\"ob-board-wait\"><button type=\"button\" class=\"ob-board-character\"></button><p hidden></p></div><div class=\"ob-board-screen-bar\" hidden><div><span class=\"ob-board-screen-title\"></span><span class=\"ob-board-screen-meta\"></span></div><button type=\"button\" class=\"ob-board-takeover\"></button><button type=\"button\" class=\"ob-board-release\" hidden>Return to Bot</button></div></section>")
      +'<section class="ob-board-chat"><div class="ob-board-transcript" role="region" tabindex="0"><div class="ob-board-history"></div><div class="ob-board-stream" hidden></div><div class="ob-board-tools"></div><p class="ob-board-notice" role="status" hidden></p></div><div class="ob-board-progress" role="status" hidden></div><form class="ob-board-composer"><textarea rows="1"></textarea><button type="submit" class="ob-board-send">'+icon('arrowUp')+'</button></form></section>';
    var q=function(s){return el.querySelector(s);};
    var card={el:el,avatar:q('.ob-board-avatar'),name:q('.bot-name-text'),rename:q('.bot-rename'),presence:q('.ob-board-presence'),model:q('.ob-board-model'),focus:q('.ob-board-focus'),open:q('.ob-board-open'),stage:q('.ob-board-stage'),image:q('img'),wait:q('.ob-board-wait'),character:q('.ob-board-character'),welcome:q('.ob-board-wait p'),launch:q('.ob-board-launch'),screenBar:q('.ob-board-screen-bar'),screenTitle:q('.ob-board-screen-title'),screenMeta:q('.ob-board-screen-meta'),takeover:q('.ob-board-takeover'),release:q('.ob-board-release'),transcript:q('.ob-board-transcript'),history:q('.ob-board-history'),stream:q('.ob-board-stream'),tools:q('.ob-board-tools'),notice:q('.ob-board-notice'),progress:q('.ob-board-progress'),form:q('form'),input:q('textarea'),send:q('.ob-board-send'),historyKey:null,toolsKey:null,identityKey:null,pinned:true};
    card.input.value=api.state().boardDrafts[bot.id] || '';
    card.input.addEventListener('input',function(){api.draft(bot.id,card.input.value);resize(card.input);syncSend(card,bot.id);});
    card.input.addEventListener('keydown',function(e){
      if(e.key!=='Enter' || e.shiftKey || e.isComposing || e.keyCode===229)return;
      e.preventDefault();
      // Enter while generating keeps the next draft; stopping is an explicit button.
      if(!api.pending(bot.id))submit();
    });
    function submit(){
      if(api.pending(bot.id)){api.stop(bot.id);return;}
      if(api.send(bot.id,card.input.value)){card.input.value='';api.draft(bot.id,'');resize(card.input);card.pinned=true;card.input.focus({preventScroll:true});schedule();}
    }
    card.form.addEventListener('submit',function(e){e.preventDefault();submit();});
    card.open.addEventListener('click',function(){api.open(bot.id,'chat');});
    card.focus.addEventListener('click',function(){focusBot(bot.id);});
    card.rename.addEventListener('click',function(){api.rename(bot.id,card.rename);});
    [card.avatar,card.character].forEach(function(button){button.addEventListener('click',function(){api.appearance(bot.id,button);});});
    card.launch.addEventListener('click',function(){api.open(bot.id,'space');});
    card.takeover.addEventListener('click',function(){api.control(bot.id,'open');});
    card.release.addEventListener('click',function(){api.control(bot.id,'release');});
    card.transcript.addEventListener('scroll',function(){card.pinned=card.transcript.scrollHeight-card.transcript.clientHeight-card.transcript.scrollTop<40;});
    grid.appendChild(el);panels.set(bot.id,card);resize(card.input);
    return card;
  }
  function syncSend(card,id){
    var pending=!!api.pending(id);
    if(card.send.dataset.busy!==String(pending)){card.send.dataset.busy=String(pending);card.send.innerHTML=icon(pending?'stop':'arrowUp');}
    var name=card.name.textContent;
    card.send.setAttribute('aria-label',pending?tr('停止 ',"Stop ")+name+tr(' 的生成'," generation"):tr('发送给 ',"Send to ")+name);
    card.send.title=pending?tr('停止生成',"Stop generating"):tr('发送（Enter）',"Send (Enter)");
    card.send.disabled=!pending && !card.input.value.trim();
  }
  function update(card,bot,state){
    var presence=api.presence(bot.id),pending=api.pending(bot.id),screen=api.screen(bot.id);
    var identity=[bot.avatar,bot.color,presence.status].join('|');
    if(card.identityKey!==identity){
      card.identityKey=identity;
      card.avatar.innerHTML=api.avatar(bot,'list',presence.status);
      card.character.innerHTML=api.avatar(bot,'companion',presence.status);
    }
    text(card.name,bot.name);card.name.title=bot.name;
    text(card.model,bot.model || '');card.model.hidden=!bot.model;card.model.title=bot.model || '';
    card.rename.setAttribute('aria-label',tr('重命名 ',"Rename ")+bot.name);
    card.el.setAttribute('aria-label',bot.name+tr(' 的工作面板'," work panel"));
    card.el.querySelector('.ob-board-panel-head').setAttribute('aria-label',tr('移动 ',"Move ")+bot.name+tr(' 的窗口'," window"));
    text(card.presence,presence.label);
    card.el.dataset.status=presence.status;
    [card.avatar,card.character].forEach(function(button){button.setAttribute('aria-label',tr('更换 ',"Change ")+bot.name+tr(' 的形象'," avatar"));button.title=tr('更换形象',"Change avatar");});
    card.open.setAttribute('aria-label',tr('展开 ',"Expand ")+bot.name+tr(' 的聊天'," chat"));card.open.title=tr('展开聊天',"Expand chat");
    card.focus.setAttribute('aria-label',tr('聚焦 ',"Focus ")+bot.name);card.focus.title=tr('聚焦到这个 Bot',"Focus this Bot");
    card.launch.setAttribute('aria-label',tr('打开 ',"Open ")+bot.name+tr(' 的网页'," web page"));card.launch.title=tr('打开网页',"Open web page");
    card.input.setAttribute('aria-label',tr('给 ',"Message ")+bot.name+tr(' 发消息',""));card.input.placeholder=tr('说点什么…',"Say something…");
    card.transcript.setAttribute('aria-label',bot.name+tr(' 的聊天记录'," chat history"));
    var draft=state.boardDrafts[bot.id] || '';
    if(card.input.value!==draft){card.input.value=draft;resize(card.input);}
    var running=!!screen.running,shot=running && screen.shot && screen.shot.dataUrl;
    card.stage.classList.toggle('has-screen',running);
    card.image.hidden=!shot;card.wait.hidden=!!shot;card.screenBar.hidden=!running;
    if(shot && card.image.getAttribute('src')!==shot)card.image.src=shot;
    if(!shot)card.image.removeAttribute('src');
    card.image.alt=bot.name+tr(' 的浏览器屏幕预览'," browser screen preview");
    card.launch.hidden=running;
    var emptyConversation=!running && !pending && !(bot.messages || []).length && !api.notice(bot.id);
    text(card.welcome,running?(screen.captureError?tr('预览暂时不可用，仍可打开操作窗',"Preview unavailable. You can still open the control window."):tr('正在读取工作画面…',"Loading workspace preview…")):emptyConversation?tr('还没有对话',"No messages yet"): '');card.welcome.hidden=!running&&!emptyConversation;
    var title=screen.title || screen.url || tr('浏览器屏幕',"Browser screen");
    text(card.screenTitle,title);card.screenTitle.title=screen.url || title;
    text(card.screenMeta,screen.error || screen.captureError || (screen.owner==='human'?tr('你正在接管 · 预览',"Your control · Preview"):tr('Bot 控制 · 预览',"Bot control · Preview")));
    text(card.takeover,screen.owner==='human'?tr('打开操作窗',"Open control window"):tr('接管',"Take over"));
    card.takeover.setAttribute('aria-label',(screen.owner==='human'?tr('打开 ',"Open "):tr('接管 ',"Take over "))+bot.name+tr(' 的浏览器屏幕'," browser screen"));
    card.release.setAttribute('aria-label',tr('将 ',"Return ")+bot.name+tr(' 的屏幕交还 Bot'," screen to Bot"));
    card.release.hidden=screen.owner!=='human';
    card.takeover.disabled=card.release.disabled=screen.controlState==='loading';
    var historyKey=JSON.stringify(bot.messages || []),changed=false;
    if(card.historyKey!==historyKey){
      card.historyKey=historyKey;card.history.replaceChildren();
      (bot.messages || []).forEach(function(m){var item=document.createElement('div');item.className='ob-board-message '+(m.role==='user'?'user':'bot');item.textContent=String(m.text || '');card.history.appendChild(item);});
      changed=true;
    }
    var stream=pending ? pending.text : '';
    if(card.stream.textContent!==stream){text(card.stream,stream);changed=true;}
    card.stream.hidden=!stream;
    var toolsKey=api.toolsKey(bot.id);
    if(card.toolsKey!==toolsKey){
      card.toolsKey=toolsKey;
      var toolFocus=card.tools.contains(document.activeElement);
      card.tools.replaceChildren();api.tools(bot,card.tools);changed=true;
      if(toolFocus)card.input.focus({preventScroll:true});
    }
    var notice=api.notice(bot.id);if(card.notice.textContent!==notice)changed=true;
    text(card.notice,notice);card.notice.hidden=!notice;card.notice.classList.toggle('error',presence.status==='failed');
    card.el.classList.toggle('is-resting',!running && !pending && !(bot.messages || []).length && !notice && !card.tools.childElementCount);
    card.progress.hidden=!pending || state.showProgress===false;
    text(card.progress,pending?(pending.statusText || (pending.text?tr('正在回复…',"Replying…"):tr('正在思考…',"Thinking…"))):'');
    syncSend(card,bot.id);
    if(changed && card.pinned)card.transcript.scrollTop=card.transcript.scrollHeight;
  }
  function render(){
    queued=false;if(!api)return;if(api.state().view!=='board'){if(canvas)canvas.cancel();return;}
    var state=api.state(),ids=new Set(state.bots.map(function(b){return b.id;}));
    panels.forEach(function(card,id){if(!ids.has(id)){card.el.remove();panels.delete(id);}});
    var previous=null;
    state.bots.forEach(function(bot){
      var card=panels.get(bot.id) || create(bot);
      var position=previous?previous.nextElementSibling:grid.firstElementChild;
      if(position!==card.el)grid.insertBefore(card.el,position);
      update(card,bot,state);previous=card.el;
    });
    canvas.sync(state.bots.map(function(b){return b.id;}));
    text(host.querySelector('.ob-board-count'),countLabel(state.bots.length,' 位伙伴','Bot'));
  }
  function init(options){
    api=options;host=document.getElementById('board-view');
    host.dataset.boardMode='work';
    host.innerHTML='<div class="ob-board-toolbar"><div class="ob-canvas-caption"><span class="ob-board-count"></span><span class="ob-canvas-hint">'+tr('滚动浏览 Bot；需要自由摆放时切换画布',"Scroll to browse Bots; switch to canvas to arrange them")+'</span></div><div class="ob-board-toolbar-actions"><div class="ob-board-mode-controls" role="group" aria-label="'+tr('工作视图',"Board view")+'"><button type="button" data-board-mode="work" aria-pressed="true">'+tr('工作视图',"Work view")+'</button><button type="button" data-board-mode="canvas" aria-pressed="false">'+tr('自由画布',"Free canvas")+'</button></div><div class="ob-canvas-controls" role="group" aria-label="'+tr('画布视角',"Canvas view")+'"><button type="button" data-canvas="out" aria-label="'+tr('缩小画布',"Zoom out canvas")+'" title="'+tr('缩小',"Zoom out")+'">'+icon('minus')+'</button><button type="button" data-canvas="reset" aria-label="'+tr('恢复 100% 缩放',"Reset zoom to 100%")+'" title="'+tr('恢复 100%',"Reset to 100%")+'">100%</button><button type="button" data-canvas="in" aria-label="'+tr('放大画布',"Zoom in canvas")+'" title="'+tr('放大',"Zoom in")+'">'+icon('plus')+'</button><button type="button" data-canvas="fit" title="'+tr('调整视角，让所有 Bot 可见',"Fit all Bots in view")+'">'+tr('查看全部',"View all")+'</button><button type="button" data-canvas="arrange" title="'+tr('把窗口重新排列整齐',"Arrange windows")+'">'+tr('整理排列',"Arrange")+'</button></div></div></div><div class="ob-canvas-viewport" tabindex="0" role="region" aria-label="'+tr('Bot 工作区',"Bot workbench")+'" aria-describedby="ob-canvas-help"><div class="ob-canvas-backdrop" aria-hidden="true"></div><div class="ob-canvas-world"></div></div><span id="ob-canvas-help" class="ob-canvas-sr">'+tr('工作视图按当前列表顺序排列，可滚动浏览全部 Bot；自由画布中每个 Bot 窗口尺寸相同。拖动标题移动窗口，标题聚焦时可用方向键移动，Shift 加快。拖动空白或按住空格拖动平移画布。触控板捏合或 Ctrl 加滚轮缩放。画布聚焦时按加减号缩放，Home 查看全部，Escape 取消拖动。',"Work view lists Bots in the current order in a scrollable grid. In free canvas mode, all Bot windows have the same size. Drag a title to move a window, or focus its title and use arrow keys; hold Shift to move faster. Drag empty space, or hold Space and drag, to pan. Pinch or use Ctrl with the mouse wheel to zoom. When the canvas is focused, use plus or minus to zoom, Home to fit all, and Escape to cancel dragging.")+'</span>';
    grid=host.querySelector('.ob-canvas-world');
    grid.style.setProperty('--ob-window-width',root.OpenBotCanvasLayout.WIDTH+'px');
    grid.style.setProperty('--ob-window-height',root.OpenBotCanvasLayout.HEIGHT+'px');
    canvas=root.OpenBotCanvas.create(host.querySelector('.ob-canvas-viewport'),grid,{
      state:function(){return api.state().boardCanvas;},save:api.canvas,
      mode:function(){return mode;},
      changed:function(c){
        text(host.querySelector('[data-canvas="reset"]'),Math.round(c.zoom*100)+'%');
        host.querySelector('[data-canvas="out"]').disabled=c.zoom<=root.OpenBotCanvasLayout.MIN_ZOOM;
        host.querySelector('[data-canvas="in"]').disabled=c.zoom>=root.OpenBotCanvasLayout.MAX_ZOOM;
        if(api.state().view==='board')api.visible();
      }
    });
    function updateModeButtons(){
      host.querySelectorAll('[data-board-mode]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.boardMode===mode));});
      host.querySelector('.ob-canvas-hint').textContent=mode==='work'?tr('滚动浏览 Bot；需要自由摆放时切换画布',"Scroll to browse Bots; switch to canvas to arrange them"):tr('拖动标题排列 · 拖动空白处平移 · 全览会缩小到所有 Bot',"Drag titles to arrange · drag empty space to pan · View all fits every Bot");
    }
    host.querySelector('[data-board-mode="work"]').addEventListener('click',function(){
      if(mode==='work')return;canvas.cancel();mode='work';host.dataset.boardMode=mode;updateModeButtons();canvas.sync(api.state().bots.map(function(b){return b.id;}));
    });
    host.querySelector('[data-board-mode="canvas"]').addEventListener('click',function(){
      if(mode==='canvas')return;mode='canvas';host.dataset.boardMode=mode;updateModeButtons();canvas.sync(api.state().bots.map(function(b){return b.id;}));
      if(!canvasOpened){canvasOpened=true;var active=api.state().activeId || (api.state().bots[0]&&api.state().bots[0].id);if(active)canvas.focusBot(active);}
    });
    host.querySelectorAll('[data-canvas]').forEach(function(btn){btn.addEventListener('click',function(){
      var action=btn.dataset.canvas,current=api.state().boardCanvas.camera,zoom=current?current.zoom:1;
      if(action==='fit')canvas.fit();else if(action==='arrange')canvas.arrange();else canvas.zoom(action==='reset'?1:action==='in'?zoom*1.2:zoom/1.2);
    });});
  }
  function focusBot(id){
    schedule();root.requestAnimationFrame(function(){
      if(mode==='canvas'){if(canvas)canvas.focusBot(id);return;}
      var card=panels.get(id);if(!card)return;
      card.el.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'});card.input.focus({preventScroll:true});
    });
  }
  root.OpenBotBoard={init:init,refresh:schedule,visibleBotIds:function(){return canvas?canvas.visibleIds():[];},focusBot:focusBot};
})(window);
