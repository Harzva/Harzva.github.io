(function(root){
  'use strict';
  var supported=false;
  function readable(message){
    return !!message&&message.role==='bot'&&!message.error&&!message.streaming&&!message.stopped&&
      ['task','error','tool'].indexOf(message.kind)===-1&&typeof message.text==='string'&&!!message.text.trim();
  }
  function create(options){
    var bridge=options.bridge,view,intent=0,disposed=false,contextKey='',selection=null;
    var status={available:false,state:'idle',revision:-1},unsubscribers=[];
    supported=!!(bridge&&bridge.platform==='darwin'&&bridge.replySpeechStatus&&bridge.speakReply&&bridge.stopReplySpeech&&bridge.onReplySpeechChanged);
    function context(){return options.getContext()||{};}
    function key(ctx){return JSON.stringify([ctx.botId,ctx.view,ctx.botMode,ctx.visible]);}
    function validContext(ctx){return !!ctx.botId&&ctx.view==='chat'&&ctx.botMode!=='space'&&ctx.visible!==false;}
    function render(){var ctx=context();view.render(status,ctx.botId===status.ownerId?ctx.botName:'');}
    function accept(next){
      if(disposed||!next||!Number.isInteger(next.revision)||next.revision<status.revision)return;
      var wasAvailable=supported;
      supported=next.available===true;status=next;
      render();
      if(wasAvailable!==supported&&options.onAvailabilityChange)options.onAvailabilityChange();
    }
    function fail(code){
      // A failed replacement/save/IPC must not hide controls for the old child.
      var active=['starting','speaking','stopping'].indexOf(status.state)!==-1;
      status=Object.assign({},status,{state:active?status.state:'error',errorCode:code||'speech-unavailable'});render();
    }
    function stop(){
      ++intent;selection=null;
      if(!bridge||!bridge.stopReplySpeech)return Promise.resolve(false);
      return Promise.resolve(bridge.stopReplySpeech()).then(function(result){
        if(result&&result.status)accept(result.status);
        if(!result||result.ok===false){fail(result&&result.code);return false;}
        return true;
      }).catch(function(){fail('speech-stop-failed');return false;});
    }
    function syncContext(){
      var ctx=context(),nextKey=key(ctx);
      var message=selection&&ctx.messages&&ctx.messages[selection.index];
      var stale=selection&&(!readable(message)||String(message.id||'')!==selection.messageId||message.text!==selection.expectedText);
      if(contextKey&&nextKey!==contextKey||stale){stop();}
      contextKey=nextKey;render();
    }
    async function speak(message,node){
      var ctx=context(),index=Number(node&&node.dataset.chatIndex);
      if(!supported||!validContext(ctx)||!node||node.dataset.chatBotId!==ctx.botId||!Number.isInteger(index)||index<0||ctx.messages[index]!==message||!readable(message))return false;
      var token=++intent,captured=key(ctx);
      var request={botId:ctx.botId,index:index,messageId:String(message.id||''),expectedText:message.text};
      selection=request;
      try{
        var saved=await options.flush();
        if(disposed||token!==intent)return false;
        if(saved&&saved.ok===false)throw new Error('speech-save-failed');
        var current=context(),same=current.messages&&current.messages[index];
        if(key(current)!==captured||!readable(same)||same.text!==request.expectedText||String(same.id||'')!==request.messageId)return false;
        var result=await bridge.speakReply(request);
        if(disposed||token!==intent)return false;
        if(result&&result.status)accept(result.status);
        if(!result||result.ok===false){if(result&&result.code==='speech-cancelled')return false;fail(result&&result.code);return false;}
        return true;
      }catch(error){if(!disposed&&token===intent)fail(error.message==='speech-save-failed'?'speech-save-failed':'speech-unavailable');return false;}
    }
    view=root.OpenBotReplySpeechView.create({mount:options.mount,onStop:stop,translate:options.translate});
    contextKey=key(context());render();
    if(supported){
      unsubscribers.push(bridge.onReplySpeechChanged(accept));
      Promise.resolve(bridge.replySpeechStatus()).then(function(result){if(result&&result.status)accept(result.status);}).catch(function(){supported=false;if(options.onAvailabilityChange)options.onAvailabilityChange();});
      if(bridge.onWindowVisibility)unsubscribers.push(bridge.onWindowVisibility(function(visible){if(!visible)stop();}));
    }
    function hidden(){if(document.hidden)stop();}
    function unload(){stop();}
    document.addEventListener('visibilitychange',hidden);
    root.addEventListener('beforeunload',unload);
    return {speak:speak,stop:stop,syncContext:syncContext,
      isActive:function(){return ['starting','speaking','stopping'].indexOf(status.state)!==-1;},
      destroy:function(){stop();disposed=true;unsubscribers.forEach(function(fn){if(typeof fn==='function')fn();});document.removeEventListener('visibilitychange',hidden);root.removeEventListener('beforeunload',unload);view.destroy();}
    };
  }
  root.OpenBotReplySpeech={create:create,available:function(){return supported;},readable:readable};
})(window);
