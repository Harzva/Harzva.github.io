/* Session-only drafts for the persistent personal-chat textarea. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  if(root)root.OpenBotComposerDrafts=api;
})(typeof window==='object'?window:null,function(){
  'use strict';
  function create(input,options){
    options=options||{};
    var drafts=new Map(),valid=null,owner=null,target=null,shown=true,composing=false,settling=false,compositionEpoch=0;
    var generation=0,layoutEpoch=0,pendingLayout=null,selectionProtected=false,externalFocus=false,internalSelection=false;
    var hasCustomDefer=typeof options.defer==='function';
    var defer=options.defer||function(fn){if(typeof requestAnimationFrame==='function')requestAnimationFrame(fn);else setTimeout(fn,0);};
    var storage=options.storage||null,storageKey=options.storageKey||'openbot.composerDrafts.v1';
    function loadStoredDrafts(){
      if(!storage||typeof storage.getItem!=='function')return {};
      try{var raw=storage.getItem(storageKey);return raw?JSON.parse(raw)||{}:{};}catch(_){return {};}
    }
    var persisted=loadStoredDrafts();
    function saveStoredDrafts(){
      if(!storage||typeof storage.setItem!=='function')return;
      try{
        var out={};
        drafts.forEach(function(rec,k){
          if(rec&&rec.snapshot&&rec.snapshot.value){
            out[k]={value:rec.snapshot.value,start:rec.snapshot.start,end:rec.snapshot.end,direction:rec.snapshot.direction||'none',scrollTop:rec.snapshot.scrollTop||0};
          }
        });
        storage.setItem(storageKey,JSON.stringify(out));
      }catch(_){}
    }
    var origSetSelectionRange=typeof input.setSelectionRange==='function'?input.setSelectionRange.bind(input):null;
    if(origSetSelectionRange){
      input.setSelectionRange=function(start,end,direction){
        origSetSelectionRange(start,end,direction);
        if(!internalSelection&&allowed(owner)&&shown&&!composing&&!settling){
          selectionProtected=false;externalFocus=false;cancelLayout();remember(true);
        }
      };
    }
    var origSelect=typeof input.select==='function'?input.select.bind(input):null;
    if(origSelect){
      input.select=function(){
        origSelect();
        if(!internalSelection&&allowed(owner)&&shown&&!composing&&!settling){
          selectionProtected=false;externalFocus=false;cancelLayout();remember(true);
        }
      };
    }
    function empty(){return {value:'',start:0,end:0,direction:'none',scrollTop:0};}
    function allowed(key){return key!==null&&(!valid||valid.has(key));}
    function entry(key){
      if(!drafts.has(key)){
        var saved=persisted&&persisted[key]&&typeof persisted[key].value==='string'
          ?{value:persisted[key].value,start:typeof persisted[key].start==='number'?persisted[key].start:persisted[key].value.length,
            end:typeof persisted[key].end==='number'?persisted[key].end:persisted[key].value.length,
            direction:persisted[key].direction||'none',scrollTop:persisted[key].scrollTop||0}
          :empty();
        if(persisted)delete persisted[key];
        drafts.set(key,{generation:++generation,revision:0,snapshot:saved});
      }
      return drafts.get(key);
    }
    function read(){
      var value=String(input.value||'');
      return {value:value,start:typeof input.selectionStart==='number'?input.selectionStart:value.length,
        end:typeof input.selectionEnd==='number'?input.selectionEnd:value.length,
        direction:input.selectionDirection||'none',scrollTop:input.scrollTop||0};
    }
    function remember(forceSelection){
      if(!allowed(owner))return;
      var record=entry(owner),snapshot=read();
      // A hidden textarea can have its scroll/caret clamped by layout. Keep
      // its last visible geometry unless an actual new value has arrived.
      if(!shown&&!composing&&!settling&&record.snapshot.value===snapshot.value)return;
      if(selectionProtected&&!forceSelection&&record.snapshot.value===snapshot.value){
        snapshot.start=record.snapshot.start;snapshot.end=record.snapshot.end;snapshot.direction=record.snapshot.direction;
      }
      if(pendingLayout&&pendingLayout.epoch===layoutEpoch&&pendingLayout.key===owner&&pendingLayout.snapshot.value===snapshot.value){
        snapshot.start=pendingLayout.snapshot.start;snapshot.end=pendingLayout.snapshot.end;
        snapshot.direction=pendingLayout.snapshot.direction;snapshot.scrollTop=pendingLayout.snapshot.scrollTop;
      }
      if(record.snapshot.value!==snapshot.value)record.revision++;
      record.snapshot=snapshot;saveStoredDrafts();
    }
    function cancelLayout(){layoutEpoch++;pendingLayout=null;}
    function layout(snapshot){
      cancelLayout();var ticket=layoutEpoch,key=owner,record=key===null?null:entry(key);
      function apply(){
        if(options.resize)options.resize();
        internalSelection=true;
        try{if(origSetSelectionRange)origSetSelectionRange(snapshot.start,snapshot.end,snapshot.direction);else input.setSelectionRange(snapshot.start,snapshot.end,snapshot.direction);}catch(error){}
        internalSelection=false;
        input.scrollTop=snapshot.scrollTop;
      }
      apply();pendingLayout={epoch:ticket,key:key,snapshot:snapshot};
      // Chromium may finish the navigation click's default selection after
      // our handler. Restore once after layout, without focusing the editor.
      defer(function(){
        if(ticket!==layoutEpoch||owner!==key||composing||settling||input.value!==snapshot.value||(record&&drafts.get(key)!==record))return;
        apply();pendingLayout=null;
      });
    }
    function write(snapshot){input.value=snapshot.value;selectionProtected=true;externalFocus=!!(input.ownerDocument&&input.ownerDocument.activeElement!==input);layout(snapshot);}
    function mount(){
      if(composing||settling||owner===target)return;
      remember();owner=target;
      write(owner===null?empty():entry(owner).snapshot);
    }
    function bind(key,visible){
      var next=key===null||key===undefined?null:String(key),wasShown=shown;
      if(!allowed(next))next=null;
      if(owner!==next||(shown&&visible===false))remember();
      target=next;shown=visible!==false;mount();
      if(!wasShown&&shown&&owner===target&&owner!==null&&!composing&&!settling)layout(entry(owner).snapshot);
    }
    function reconcile(keys){
      valid=new Set((keys||[]).map(String));
      drafts.forEach(function(record,key){if(!valid.has(key)){drafts.delete(key);if(persisted)delete persisted[key];}});
      if(owner!==null&&!valid.has(owner)){
        // Do not capture a deleted Bot's mounted text back into the Map.
        // An in-flight IME keeps its commit barrier, with no owner to save to.
        owner=null;cancelLayout();input.value='';
        internalSelection=true;
        try{if(origSetSelectionRange)origSetSelectionRange(0,0);else input.setSelectionRange(0,0);}catch(error){}
        internalSelection=false;
        input.scrollTop=0;
        if(options.resize)options.resize();
      }
      if(target!==null&&!valid.has(target))target=null;
      saveStoredDrafts();
    }
    function ready(key){return shown&&key!==null&&key!==undefined&&!composing&&!settling&&owner===String(key)&&owner===target;}
    // Read-only ownership metadata for the explicitly enabled display bridge.
    // No draft values or other Bot entries are exposed; ready remains false
    // through composing/settling so final IME input is never guessed.
    function inspect(key){
      var id=key===null||key===undefined?null:String(key),record=id===null?null:drafts.get(id);
      if(!record||owner!==id||!allowed(id))return null;
      return {key:id,generation:record.generation,revision:record.revision,ready:ready(id)};
    }
    function take(key){
      if(!ready(key))return null;
      remember();var record=entry(owner),snapshot=record.snapshot;
      record.revision++;record.snapshot=empty();saveStoredDrafts();write(record.snapshot);
      return {key:owner,generation:record.generation,revision:record.revision,snapshot:snapshot};
    }
    function restore(lease){
      if(!lease||!allowed(lease.key)||!drafts.has(lease.key))return false;
      if(owner===lease.key)remember();
      var record=entry(lease.key);
      // Re-adding the same Bot ID creates a new generation. Old async leases
      // cannot match it, nor a later edit/send that happens to be empty again.
      if(record.generation!==lease.generation||record.revision!==lease.revision||record.snapshot.value!=='')return false;
      record.revision++;record.snapshot=lease.snapshot;saveStoredDrafts();
      if(owner===lease.key&&!composing&&!settling)write(record.snapshot);
      return true;
    }
    input.addEventListener('input',function(){
      cancelLayout();selectionProtected=false;externalFocus=false;
      if(!allowed(owner))return;
      var record=entry(owner);record.revision++;record.snapshot=read();saveStoredDrafts();
    });
    function editorIntent(){selectionProtected=false;externalFocus=false;cancelLayout();}
    input.addEventListener('pointerdown',editorIntent);
    input.addEventListener('keydown',editorIntent);
    input.addEventListener('focus',function(){
      var record=allowed(owner)?drafts.get(owner):null;
      var restoreSelection=externalFocus&&record&&record.snapshot.value===input.value&&shown&&owner===target&&!composing&&!settling;
      selectionProtected=false;externalFocus=false;
      // Keyboard focus returning from a menu keeps the editing position. A
      // pointer/key intent in this editor already cleared externalFocus.
      if(restoreSelection)layout(record.snapshot);
    });
    input.addEventListener('blur',function(){remember(!externalFocus);selectionProtected=true;externalFocus=true;});
    if(input.ownerDocument&&input.ownerDocument.addEventListener){
      input.ownerDocument.addEventListener('pointerdown',function(event){
        if(event.target===input)return;
        // An external menu click can clear Chromium's unfocused textarea
        // selection before the later mode change. Save it before that default.
        // remember also keeps any still-pending owned post-layout selection.
        remember(!externalFocus);selectionProtected=true;externalFocus=true;
        // The later button-focus default can also clamp the DOM selection
        // after this capture handler, without an input/select event. Repair
        // it after that default while leaving focus on the navigation target.
        // layout's owner/value/epoch checks and editorIntent/input cancellation
        // prevent this repair from overwriting a later edit or selection.
        if(shown&&allowed(owner)&&owner===target&&!composing&&!settling)layout(entry(owner).snapshot);
        else cancelLayout();
      },true);
      input.ownerDocument.addEventListener('click',function(event){
        if(event.target===input||!externalFocus||!selectionProtected)return;
        // A held navigation press can outlast the pointerdown RAF. Its later
        // click default still needs a repair; newer editor intent clears the
        // protection flags and must never be overridden by this old press.
        var record=allowed(owner)?drafts.get(owner):null;
        if(record&&record.snapshot.value===input.value&&shown&&owner===target&&!composing&&!settling)layout(record.snapshot);
      },true);
    }
    input.addEventListener('compositionstart',function(){
      remember();cancelLayout();composing=true;settling=false;compositionEpoch++;
      if(allowed(owner))entry(owner).revision++;
    });
    input.addEventListener('compositionend',function(){
      composing=false;settling=true;var epoch=++compositionEpoch;
      function finish(){if(epoch!==compositionEpoch||composing)return;remember();settling=false;mount();}
      if(!hasCustomDefer&&owner!==target){finish();return;}
      // Native IMEs may deliver their final input after compositionend. Keep
      // the old DOM owner until that commit has had a chance to arrive.
      defer(finish);
    });
    return {bind:bind,reconcile:reconcile,ready:ready,take:take,restore:restore,remember:remember,inspect:inspect};
  }
  return {create:create};
});
