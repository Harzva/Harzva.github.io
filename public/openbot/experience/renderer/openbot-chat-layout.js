(function(root){
  'use strict';
  function tr(zh,en){return root.OpenBotI18n?root.OpenBotI18n.t(zh,en):zh;}
  var input,observer,lastWidth=-1,frame=0,history;
  function resize(){
    if(!input)return;
    var scroll=input.scrollTop;
    input.style.height='auto';
    var needed=input.scrollHeight;
    input.style.height=needed+'px';
    input.style.overflowY=needed>input.clientHeight+1?'auto':'hidden';
    input.scrollTop=scroll;
  }
  function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(resize);}
  function setFocus(value){
    document.body.dataset.chatFocus=String(value);
    var button=document.getElementById('composer-focus');
    if(button){button.setAttribute('aria-pressed',String(value));button.textContent=value?tr('退出专注',"Exit focus"):tr('专注对话',"Focus chat");}
    schedule();
  }
  function createHistory(){
    var box=document.getElementById('messages'),surface=document.getElementById('chat-history-surface');
    var rail=document.getElementById('chat-history-rail'),preview=document.getElementById('chat-history-preview');
    var railButtons=[],previews=[],previewTarget=null;
    var mediaCaption=document.createElement('span');
    mediaCaption.className='chat-history-preview-media';mediaCaption.hidden=true;
    preview.insertBefore(mediaCaption,preview.querySelector('.chat-history-preview-answer'));
    var previewAnimation=null,previewOpenTimer=0,previewHideTimer=0,previewRequest=0;
    var previewSource=null,pointerInside=false,hoverMarked=[],restoringRailFocus=false;
    var pointerX=null,pointerY=null;
    var reducedMotion=root.matchMedia?root.matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
    var latest=document.getElementById('chat-history-latest'),records=new Map();
    var current=null,bot=null,nodes=[],epoch=0,restoreFrame=0,scrollFrame=0,restoring=false,manualUntil=0;
    function visible(){return box.clientHeight>0&&box.getClientRects().length>0;}
    function atEnd(){return box.scrollHeight-box.clientHeight-box.scrollTop<12;}
    function currentIndex(){
      if(!nodes.length)return -1;
      if(atEnd())return nodes.length-1;
      var y=box.getBoundingClientRect().top+32,lo=0,hi=nodes.length-1;
      while(lo<hi){var mid=Math.ceil((lo+hi)/2);if(nodes[mid].getBoundingClientRect().top<=y)lo=mid;else hi=mid-1;}
      return lo;
    }
    function layoutBounds(){
      var bounds=surface.getBoundingClientRect(),right=bounds.right;
      var drawer=document.getElementById('org-drawer');
      if(drawer&&drawer.getClientRects().length){var edge=drawer.getBoundingClientRect();if(edge.left>bounds.left&&edge.left<right)right=edge.left;}
      surface.style.setProperty('--ob-history-right-inset',Math.max(0,bounds.right-right)+'px');
      surface.style.setProperty('--ob-history-visible-width',Math.max(0,right-bounds.left)+'px');
      return {left:bounds.left,right:right,top:bounds.top,bottom:bounds.bottom,height:bounds.height,width:Math.max(0,right-bounds.left)};
    }
    function syncTabStop(items,selected){
      // Each navigation group is one Tab stop. Arrow keys move within it;
      // when unfocused, the current reading position is its entry point.
      var index=items.indexOf(document.activeElement);
      if(index<0)index=Math.max(0,Math.min(selected,items.length-1));
      items.forEach(function(item,i){item.tabIndex=i===index?0:-1;});
    }
    function update(){
      layoutBounds();
      rail.hidden=nodes.length<2;
      latest.hidden=!current||current.follow||!visible()||box.scrollHeight<=box.clientHeight+12;
      var selected=visible()?currentIndex():-1;
      railButtons.forEach(function(button,i){if(i===selected)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');});
      syncTabStop(railButtons,selected);
      if(!pointerInside&&!rail.contains(document.activeElement)&&railButtons[selected])ensureTickVisible(railButtons[selected]);
    }
    function ensureTickVisible(item){
      if(!item||rail.scrollHeight<=rail.clientHeight+1)return;
      var top=item.offsetTop,bottom=top+item.offsetHeight;
      if(top<rail.scrollTop+6||bottom>rail.scrollTop+rail.clientHeight-6)
        rail.scrollTop=Math.max(0,Math.min(rail.scrollHeight-rail.clientHeight,top-rail.clientHeight/2+item.offsetHeight/2));
    }
    function clearHover(){
      hoverMarked.forEach(function(item){item.style.removeProperty('--ob-history-hover');});
      hoverMarked=[];rail.dataset.peeking='false';
    }
    function emphasize(index){
      clearHover();if(index<0)return;
      rail.dataset.peeking='true';
      for(var i=Math.max(0,index-3);i<=Math.min(railButtons.length-1,index+3);i++){
        var item=railButtons[i],distance=Math.abs(i-index);
        item.style.setProperty('--ob-history-hover',String([1,.75,.5,.32][distance]));hoverMarked.push(item);
      }
    }
    function cancelIntent(){
      clearTimeout(previewOpenTimer);previewOpenTimer=0;
      clearTimeout(previewHideTimer);previewHideTimer=0;previewRequest++;
    }
    function cancelPreviewAnimation(){
      if(previewAnimation){previewAnimation.cancel();previewAnimation=null;}
    }
    function closePreview(soft){
      cancelIntent();
      if(previewTarget)previewTarget.removeAttribute('aria-describedby');
      previewTarget=null;previewSource=null;clearHover();
      preview.setAttribute('aria-hidden','true');
      if(!soft||preview.hidden||reducedMotion.matches){
        cancelPreviewAnimation();preview.hidden=true;preview.dataset.motion='closed';return;
      }
      var opacity=Number(getComputedStyle(preview).opacity);cancelPreviewAnimation();
      preview.dataset.motion='closing';
      var request=previewRequest;
      function finish(){
        if(request!==previewRequest||preview.dataset.motion!=='closing')return;
        clearTimeout(previewHideTimer);previewHideTimer=0;
        preview.hidden=true;preview.dataset.motion='closed';cancelPreviewAnimation();
      }
      previewAnimation=preview.animate([{opacity:opacity},{opacity:0}],{duration:80,easing:'ease-out',fill:'forwards'});
      previewAnimation.onfinish=finish;
      previewHideTimer=setTimeout(finish,110);
    }
    function showPreview(item,source){
      var index=Number(item.dataset.questionIndex),value=previews[index];
      if(!value||!item.isConnected||!rail.contains(item)||rail.hidden||!visible()){closePreview();return;}
      cancelIntent();
      var previous=preview.hidden?null:preview.getBoundingClientRect();
      var opacity=previous?Number(getComputedStyle(preview).opacity):0;
      cancelPreviewAnimation();
      if(previewTarget)previewTarget.removeAttribute('aria-describedby');
      preview.querySelector('.chat-history-preview-question').textContent=value.question;
      mediaCaption.textContent=value.media.label;mediaCaption.hidden=value.media.types[0]==='text';
      var streaming=index===previews.length-1?box.querySelector('.msg.bot.streaming'):null;
      preview.querySelector('.chat-history-preview-answer').textContent=value.answer||(streaming?streaming.textContent:'')||tr('点击查看这一段对话',"Select to view this conversation");
      var bounds=layoutBounds(),target=item.getBoundingClientRect();
      var onRight=document.body.dataset.historySide==='right';
      var width=Math.min(320,onRight?target.left-bounds.left-16:bounds.right-target.right-16);
      if(width<80){closePreview();return;}
      var left=onRight?target.left-width-8:target.right+8;
      left=Math.max(bounds.left+8,Math.min(left,bounds.right-width-8));
      preview.style.minWidth='0';preview.style.width=width+'px';preview.style.maxWidth=width+'px';
      preview.style.maxHeight=Math.min(220,Math.max(0,bounds.height-16))+'px';preview.hidden=false;
      var top=Math.max(bounds.top+8,Math.min(target.top-16,bounds.bottom-preview.offsetHeight-8));
      preview.style.left=(left-bounds.left)+'px';preview.style.top=(top-bounds.top)+'px';
      preview.dataset.motion='open';preview.setAttribute('aria-hidden','false');
      previewTarget=item;previewSource=source||'keyboard';item.setAttribute('aria-describedby',preview.id);emphasize(index);
      if(reducedMotion.matches)return;
      // Continue from the visible in-flight rectangle instead of restarting a
      // new entrance on every neighboring question or native state snapshot.
      var dx=previous?Math.max(bounds.left+8,Math.min(previous.left,bounds.right-width-8))-left:(onRight?4:-4);
      var dy=previous?Math.max(bounds.top+8,Math.min(previous.top,bounds.bottom-preview.offsetHeight-8))-top:0;
      if(previous&&Math.abs(dx)<.5&&Math.abs(dy)<.5&&opacity>.99)return;
      var animation=preview.animate([{opacity:opacity,transform:'translate('+dx+'px,'+dy+'px)'},{opacity:1,transform:'translate(0,0)'}],
        {duration:previous?120:140,easing:'cubic-bezier(.2,.8,.2,1)'});
      previewAnimation=animation;
      animation.onfinish=function(){if(previewAnimation===animation)previewAnimation=null;};
    }
    function requestPreview(item){
      pointerInside=true;emphasize(Number(item.dataset.questionIndex));
      if(!preview.hidden){showPreview(item,'pointer');return;}
      cancelIntent();
      var request=previewRequest,generation=epoch;
      previewOpenTimer=setTimeout(function(){
        previewOpenTimer=0;
        if(request!==previewRequest||generation!==epoch||!pointerInside||!item.isConnected)return;
        showPreview(item,'pointer');
      },70);
    }
    function capture(){
      if(!current||!visible()||restoring)return;
      current.top=box.scrollTop;
      var i=currentIndex();
      current.anchor=i;
      current.offset=i<0?0:nodes[i].getBoundingClientRect().top-box.getBoundingClientRect().top;
    }
    function restore(){
      if(!current||!visible())return;
      restoring=true;
      if(current.follow)box.scrollTop=box.scrollHeight;
      else if(nodes[current.anchor])box.scrollTop+=nodes[current.anchor].getBoundingClientRect().top-box.getBoundingClientRect().top-current.offset;
      else box.scrollTop=current.top;
      var generation=epoch;
      cancelAnimationFrame(restoreFrame);
      restoreFrame=requestAnimationFrame(function(){
        if(generation!==epoch)return;
        restoring=false;capture();update();
      });
      update();
    }
    function beforeRender(next){
      capture();
      if(current){var focused=document.activeElement;current.focusedIndex=box.contains(focused)&&focused.matches('.msg.user[data-question-index]')?Number(focused.dataset.questionIndex):-1;}
      if(!next){closePreview();current=null;bot=null;nodes=[];railButtons=[];rail.hidden=true;latest.hidden=true;epoch++;return;}
      if(!bot||bot.id!==next.id){closePreview();pointerInside=false;manualUntil=0;}
      bot=next;
      var entry=records.get(next.id);
      // IPC snapshots replace Bot objects even when history is unchanged. Keep
      // reading state by Bot identity; validate the history prefix below.
      if(!entry){entry={follow:true,top:0,anchor:-1,offset:0,signatures:[]};records.set(next.id,entry);}
      current=entry;restoring=false;epoch++;
    }
    function afterRender(next){
      if(!next)return;
      if(!bot||bot.id!==next.id)beforeRender(next);
      var previewIndex=previewTarget?Number(previewTarget.dataset.questionIndex):-1;
      var previewSignature=current.signatures[previewIndex],keepPreview=!preview.hidden&&preview.dataset.motion==='open';
      var previousPreviewSource=previewSource;
      var questions=(next.messages||[]).filter(function(m){return m.role==='user';});
      var signatures=questions.map(function(m){return JSON.stringify([m.id||'',m.ts||'',m.text||'']);});
      // Prefix checks only detect history replacement; ordinal anchors locate
      // DOM nodes, including identical questions and imported duplicate IDs.
      if(current.anchor>=0&&!current.follow){
        for(var i=0;i<=current.anchor;i++)if(current.signatures[i]!==signatures[i]){current.follow=true;current.focusedIndex=-1;break;}
      }
      current.signatures=signatures;
      nodes=Array.prototype.slice.call(box.querySelectorAll('.msg.user'));
      var railFocused=rail.contains(document.activeElement)?Number(document.activeElement.dataset.questionIndex):-1;
      cancelIntent();
      if(previewTarget)previewTarget.removeAttribute('aria-describedby');previewTarget=null;
      clearHover();restoringRailFocus=true;
      rail.replaceChildren();railButtons=[];previews=[];epoch++;
      var mediaSegments=root.OpenBotHistoryMedia.segments(next);
      var segment=null;
      (next.messages||[]).forEach(function(message){
        if(message.role==='user'){segment={question:Array.from(String(message.text||'').replace(/\s+/g,' ').trim()).slice(0,180).join(''),answer:'',media:mediaSegments[previews.length]};previews.push(segment);}
        else if(segment&&!segment.answer&&message.kind!=='task'&&(message.role==='bot'||message.role==='assistant'))segment.answer=Array.from(String(message.text||'').replace(/\s+/g,' ').trim()).slice(0,260).join('');
      });
      nodes.forEach(function(node,i){
        node.id='chat-question-'+epoch+'-'+i;node.dataset.questionIndex=String(i);node.tabIndex=-1;
        var message=questions[i],text=String(message?message.text:node.textContent).replace(/\s+/g,' ').trim()||tr('空白消息',"Empty message");
        var summary=Array.from(text).slice(0,120).join('');
        var tick=document.createElement('button');tick.type='button';tick.className='chat-history-rail-item';tick.dataset.questionIndex=String(i);tick.tabIndex=-1;
        var media=mediaSegments[i],suffix=media.types[0]==='text'?'':tr('，包含',", includes ")+media.label;
        tick.dataset.mediaTypes=media.types.join(' ');
        if(media.paint)tick.style.setProperty('--ob-history-media-paint',media.paint);
        tick.title=media.label+tr('：',': ')+summary;
        tick.setAttribute('aria-label',tr('第',"Question ")+(i+1)+tr('条问题：',": ")+summary+suffix);tick.setAttribute('aria-controls',node.id);rail.appendChild(tick);railButtons.push(tick);
      });
      if(railFocused>=0&&railButtons[railFocused]){
        ensureTickVisible(railButtons[railFocused]);railButtons[railFocused].focus({preventScroll:true});
      }
      restoringRailFocus=false;
      if(document.activeElement===document.body&&nodes[current.focusedIndex])nodes[current.focusedIndex].focus({preventScroll:true});
      restore();
      if(keepPreview&&railButtons[previewIndex]&&signatures[previewIndex]===previewSignature&&
          (previousPreviewSource==='keyboard'||pointerInside))showPreview(railButtons[previewIndex],previousPreviewSource);
      else closePreview();
    }
    function follow(force){
      if(!current)return;
      if(force){current.follow=true;manualUntil=0;closePreview();}
      if(current.follow&&visible())box.scrollTop=box.scrollHeight;
      update();
    }
    function jump(index){
      var target=nodes[index];if(!target||!current||!visible())return;
      closePreview();
      current.follow=false;restoring=true;
      box.scrollTop+=target.getBoundingClientRect().top-box.getBoundingClientRect().top-28;
      current.anchor=index;current.offset=target.getBoundingClientRect().top-box.getBoundingClientRect().top;current.top=box.scrollTop;
      target.focus({preventScroll:true});target.classList.add('chat-history-target');
      setTimeout(function(){target.classList.remove('chat-history-target');},600);
      restoring=false;update();
    }
    latest.addEventListener('click',function(){follow(true);input.focus({preventScroll:true});});
    rail.addEventListener('click',function(event){var item=event.target.closest('.chat-history-rail-item');if(item)jump(Number(item.dataset.questionIndex));});
    // Replacing rail buttons can generate hit-test over events beneath an
    // unmoving pointer. Only actual movement may open a new pointer preview.
    root.addEventListener('pointermove',function(event){
      var moved=event.clientX!==pointerX||event.clientY!==pointerY;pointerX=event.clientX;pointerY=event.clientY;
      if(!moved||!rail.contains(event.target))return;
      var item=event.target.closest('.chat-history-rail-item');
      if(item&&(item!==previewTarget||preview.hidden))requestPreview(item);
    },{passive:true});
    rail.addEventListener('pointerleave',function(){
      pointerInside=false;
      var focused=railButtons.find(function(item){return item===document.activeElement;});
      if(focused&&!preview.hidden&&preview.dataset.motion==='open')showPreview(focused,'keyboard');else closePreview(true);
    });
    rail.addEventListener('focusin',function(event){syncTabStop(railButtons,currentIndex());var item=event.target.closest('.chat-history-rail-item');if(item&&!restoringRailFocus)showPreview(item,'keyboard');});
    rail.addEventListener('focusout',function(event){if(!restoringRailFocus&&!rail.contains(event.relatedTarget))closePreview();});
    rail.addEventListener('keydown',function(event){
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closePreview();return;}
      var index=railButtons.indexOf(event.target),next=index;if(index<0)return;
      if(event.key==='ArrowDown')next=Math.min(index+1,railButtons.length-1);
      else if(event.key==='ArrowUp')next=Math.max(index-1,0);
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=railButtons.length-1;
      else return;
      event.preventDefault();ensureTickVisible(railButtons[next]);railButtons[next].focus({preventScroll:true});
    });
    box.addEventListener('scroll',function(){
      if(current&&!restoring&&Date.now()<manualUntil&&!atEnd())current.follow=false;
      cancelAnimationFrame(scrollFrame);
      scrollFrame=requestAnimationFrame(function(){
        if(!current||!visible()||restoring)return;
        if(atEnd())current.follow=true;
        else if(Date.now()<manualUntil)current.follow=false;
        // Layout changes and arriving text also emit scroll events. They must
        // not turn automatic following off as though the user scrolled up.
        else if(current.follow)box.scrollTop=box.scrollHeight;
        capture();update();
      });
    },{passive:true});
    box.addEventListener('wheel',function(event){manualUntil=Date.now()+400;if(current&&event.deltaY<0)current.follow=false;},{passive:true});
    box.addEventListener('touchmove',function(){manualUntil=Date.now()+400;if(current)current.follow=false;},{passive:true});
    box.addEventListener('pointerdown',function(){manualUntil=Date.now()+1500;});
    box.addEventListener('keydown',function(event){
      if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)){
        manualUntil=Date.now()+400;
        if(current&&['ArrowUp','PageUp','Home'].includes(event.key))current.follow=false;
      }
    });
    if(reducedMotion.addEventListener)reducedMotion.addEventListener('change',function(){
      if(preview.dataset.motion==='closing')closePreview();else cancelPreviewAnimation();
    });
    var drawer=document.getElementById('org-drawer');
    if(drawer&&typeof MutationObserver==='function'){new MutationObserver(function(){closePreview();update();}).observe(drawer,{attributes:true,attributeFilter:['class']});}
    window.addEventListener('resize',function(){closePreview();update();});
    if(typeof ResizeObserver==='function'){var readingObserver=new ResizeObserver(function(){restore();});readingObserver.observe(surface);readingObserver.observe(box);}
    return {beforeRender:beforeRender,afterRender:afterRender,follow:follow,sideChanged:function(){closePreview();update();},visible:function(){if(!visible()){closePreview();}restore();}};
  }
  function getHistory(){if(!history)history=createHistory();return history;}
  function init(){
    if(input)return;input=document.getElementById('chat-input');if(!input)return;
    var expand=document.getElementById('composer-expand'),focus=document.getElementById('composer-focus');
    var composing=false;
    input.addEventListener('compositionstart',function(){composing=true;});
    input.addEventListener('compositionend',function(){composing=false;});
    input.addEventListener('blur',function(){composing=false;});
    function keepDraft(change){
      var start=input.selectionStart,end=input.selectionEnd,direction=input.selectionDirection,scroll=input.scrollTop;
      change();resize();
      input.focus({preventScroll:true});input.setSelectionRange(start,end,direction);input.scrollTop=scroll;
    }
    function setExpanded(value){
      document.body.dataset.inputExpanded=String(value);
      expand.setAttribute('aria-expanded',String(value));expand.textContent=value?tr('收起输入',"Collapse input"):tr('展开输入',"Expand input");
    }
    function overlayOpen(){
      // These handlers are registered before the app's document Escape handler.
      // Yield while any dialog/menu is visible so that same key only closes it.
      return Array.prototype.some.call(document.querySelectorAll('[role="dialog"],dialog,[role="menu"],#space-mode-menu,#org-drawer,.executor-popover'),function(node){
        return node.getClientRects().length>0&&getComputedStyle(node).visibility!=='hidden';
      });
    }
    input.addEventListener('input',resize);
    expand.addEventListener('click',function(){
      keepDraft(function(){setExpanded(document.body.dataset.inputExpanded!=='true');});
    });
    focus.addEventListener('click',function(){
      keepDraft(function(){setFocus(document.body.dataset.chatFocus!=='true');});
    });
    document.addEventListener('keydown',function(event){
      // The textarea's task-stop handler, recording controls and IME own their
      // handled keys. Never turn the same Escape into a second layout action.
      if(event.defaultPrevented||event.key!=='Escape'||event.isComposing||event.keyCode===229||composing||
          event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.repeat)return;
      var active=document.activeElement;
      if((active!==input&&active!==expand&&active!==focus)||event.target!==active||overlayOpen())return;
      var send=document.getElementById('btn-send');
      if(send&&send.classList.contains('stop'))return;
      if(document.body.dataset.inputExpanded==='true'){
        event.preventDefault();keepDraft(function(){setExpanded(false);});
      }else if(document.body.dataset.chatFocus==='true'){
        event.preventDefault();keepDraft(function(){setFocus(false);});
      }
    });
    window.addEventListener('resize',schedule);
    if(typeof ResizeObserver==='function'){
      observer=new ResizeObserver(function(entries){var width=entries[0].contentRect.width;if(Math.abs(width-lastWidth)<.5)return;lastWidth=width;schedule();});
      observer.observe(input.parentElement);
    }
    getHistory();resize();
  }
  root.OpenBotChatLayout={init:init,resize:resize,exitFocus:function(){setFocus(false);},
    beforeChatRender:function(bot){getHistory().beforeRender(bot);},
    afterChatRender:function(bot){getHistory().afterRender(bot);},
    followLatest:function(force){getHistory().follow(force===true);},
    chatVisibilityChanged:function(){getHistory().visible();},
    historySideChanged:function(){getHistory().sideChanged();}};
})(window);
