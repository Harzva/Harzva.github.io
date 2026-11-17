/* Persistent controls and playable attachments for native App recordings. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OpenBotAppRecording=api;
})(typeof window==='object'?window:null,function(){
  'use strict';

  var sources=['app','application','screen'];
  var idPattern=/^[a-f0-9]{32}$/i;
  function safeText(value,maxLength){return typeof value==='string'?value.trim().slice(0,maxLength||180):'';}
  function validPoster(value){return typeof value==='string'&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);}
  function validMediaUrl(value){return typeof value==='string'&&/^openbot-recording:\/\/[A-Za-z0-9._~-]{1,256}\/[a-f0-9]{32}$/i.test(value);}
  function recordingMetadata(value){
    if(!value||!idPattern.test(String(value.recordingId||''))||!Number.isFinite(Number(value.at))||
      !Number.isInteger(Number(value.width))||Number(value.width)<=0||!Number.isInteger(Number(value.height))||Number(value.height)<=0||
      !Number.isFinite(Number(value.durationSeconds))||Number(value.durationSeconds)<0||!Number.isFinite(Number(value.bytes))||Number(value.bytes)<0||
      sources.indexOf(value.source)<0||!value.audio||value.audio.system!==true||typeof value.audio.microphone!=='boolean')return null;
    var result={recordingId:String(value.recordingId).toLowerCase(),at:Number(value.at),width:Number(value.width),height:Number(value.height),
      source:value.source,durationSeconds:Number(value.durationSeconds),bytes:Number(value.bytes),audio:{system:true,microphone:value.audio.microphone}};
    if(value.audioMode==='system'||value.audioMode==='system-and-microphone')result.audioMode=value.audioMode;
    if(typeof value.targetName==='string'&&value.targetName.trim())result.targetName=safeText(value.targetName,120);
    if(Number.isInteger(Number(value.frameCount))&&Number(value.frameCount)>=0)result.frameCount=Number(value.frameCount);
    if(typeof value.stopReason==='string'&&value.stopReason.trim())result.stopReason=safeText(value.stopReason,100);
    return result;
  }
  function validActive(value){
    return !!value&&idPattern.test(String(value.recordingId||''))&&typeof value.botId==='string'&&value.botId.length>0&&
      sources.indexOf(value.source)>=0&&Number.isFinite(Number(value.startedAt))&&['starting','recording','stopping'].indexOf(value.state)>=0;
  }

  function create(options){
    options=options||{};
    var bridge=options.bridge,statusNode=options.statusNode,stopButton=options.stopButton,previewButton=options.previewButton,sendButton=options.sendButton,audioNode=options.audioNode;
    var saveButton=options.saveButton||null;
    var titleNode=options.titleNode,durationNode=options.durationNode,detailNode=options.detailNode,messageNode=options.messageNode;
    var dialog=options.dialog,dialogTitle=options.dialogTitle,dialogClose=options.dialogClose,dialogStatus=options.dialogStatus;
    var video=options.video,dialogSend=options.dialogSend,dialogRetry=options.dialogRetry,input=options.input;
    var active=null,latest=null,startBusy=false,startingInfo=null,failedBotId='',stopBusy=false,saveBusy=false,statusMessage='',statusError=false,pollTimer=0,pollBusy=false;
    var statusRequests=new Map(),draftSnapshots=new Map(),draftRevisionByBot=Object.create(null),browserRecordingIds=new Set(),previewEpoch=0,previewRecord=null;
    var tr=function(zh,en){return options.translate?options.translate(zh,en):zh;};

    function elementVisible(element){return !!(element&&element.getClientRects&&element.getClientRects().length);}
    function isNativeModal(element){
      if(!element||!element.open)return false;
      try{return element.matches(':modal');}catch(error){return true;}
    }
    function openNativeModal(){
      if(typeof document==='undefined')return null;
      var focused=document.activeElement;
      var focusedDialog=focused&&focused.closest&&focused.closest('dialog[open]');
      if(focusedDialog&&elementVisible(focusedDialog)&&isNativeModal(focusedDialog))return focusedDialog;
      var dialogs=document.querySelectorAll('dialog[open]');
      for(var i=dialogs.length-1;i>=0;i--){
        var candidate=dialogs[i];
        if(!elementVisible(candidate))continue;
        if(isNativeModal(candidate))return candidate;
      }
      return null;
    }
    function insertStatusAfter(parent,anchor,placement){
      if(!parent||!statusNode)return;
      var isPlaced=statusNode.parentNode===parent&&(anchor?statusNode.previousElementSibling===anchor:parent.firstElementChild===statusNode);
      if(!isPlaced){
        if(anchor&&anchor.parentNode===parent)anchor.insertAdjacentElement('afterend',statusNode);
        else parent.insertBefore(statusNode,parent.firstChild);
      }
      statusNode.dataset.placement=placement;
    }
    function ensureSaveButton(){
      if(saveButton||typeof document==='undefined'||!statusNode||!statusNode.querySelector)return saveButton;
      var actions=statusNode.querySelector('.app-recording-status-actions');
      if(!actions)return null;
      saveButton=document.createElement('button');saveButton.type='button';saveButton.className='app-recording-secondary app-recording-save';
      saveButton.hidden=true;saveButton.textContent=tr('保存视频','Save video');
      if(sendButton&&sendButton.parentNode===actions)actions.insertBefore(saveButton,sendButton);else actions.appendChild(saveButton);
      return saveButton;
    }
    function syncStatusPlacement(){
      if(!statusNode||typeof document==='undefined')return;
      var nativeModal=openNativeModal();
      if(nativeModal){
        var modalHeader=null;
        for(var i=0;i<nativeModal.children.length;i++){
          if(nativeModal.children[i].tagName==='HEADER'){modalHeader=nativeModal.children[i];break;}
        }
        insertStatusAfter(nativeModal,modalHeader,'native-modal');
        return;
      }
      var settingsMask=document.getElementById('set-mask');
      if(settingsMask&&!settingsMask.classList.contains('hidden')&&elementVisible(settingsMask)){
        var settingsMain=settingsMask.querySelector('.settings-main');
        if(settingsMain){
          var panels=settingsMain.querySelector('.settings-panels');
          if(statusNode.parentNode!==settingsMain||statusNode.nextElementSibling!==panels){
            if(panels&&panels.parentNode===settingsMain)settingsMain.insertBefore(statusNode,panels);
            else settingsMain.insertBefore(statusNode,settingsMain.firstChild);
          }
          statusNode.dataset.placement='settings';
          return;
        }
      }
      var agentMask=document.getElementById('agent-mask');
      if(agentMask&&!agentMask.classList.contains('hidden')&&elementVisible(agentMask)){
        var agentDialog=agentMask.querySelector('.aw-dialog'),agentHeader=agentDialog&&agentDialog.querySelector('.aw-header');
        if(agentDialog){insertStatusAfter(agentDialog,agentHeader,'agent-workspace');return;}
      }
      var workspace=document.getElementById('workspace'),botHeader=workspace&&workspace.querySelector('#bot-header');
      if(workspace&&botHeader&&!workspace.classList.contains('hidden')){
        insertStatusAfter(workspace,botHeader,'workspace');
        return;
      }
      var main=document.getElementById('main'),emptyState=document.getElementById('empty-state');
      if(main){
        if(statusNode.parentNode!==main||statusNode.nextElementSibling!==emptyState){
          if(emptyState&&emptyState.parentNode===main)main.insertBefore(statusNode,emptyState);
          else main.insertBefore(statusNode,main.firstChild);
        }
        statusNode.dataset.placement='main';
      }
    }
    function observeStatusHosts(){
      if(typeof document==='undefined'||!statusNode||typeof MutationObserver!=='function')return;
      var placementObserver=new MutationObserver(syncStatusPlacement);
      function watchDialogTree(node){
        if(!node||node.nodeType!==1)return;
        if(node.tagName==='DIALOG')placementObserver.observe(node,{attributes:true,attributeFilter:['open']});
        if(node.querySelectorAll)node.querySelectorAll('dialog').forEach(function(item){placementObserver.observe(item,{attributes:true,attributeFilter:['open']});});
      }
      document.querySelectorAll('dialog').forEach(watchDialogTree);
      var settingsMask=document.getElementById('set-mask'),agentMask=document.getElementById('agent-mask'),workspace=document.getElementById('workspace');
      [settingsMask,agentMask,workspace].forEach(function(node){if(node)placementObserver.observe(node,{attributes:true,attributeFilter:['class','hidden']});});
      var hostObserver=new MutationObserver(function(records){
        records.forEach(function(record){Array.prototype.forEach.call(record.addedNodes,watchDialogTree);});
        syncStatusPlacement();
      });
      if(document.body)hostObserver.observe(document.body,{childList:true});
    }

    function selectedBotId(){var value=options.getSelectedBotId&&options.getSelectedBotId();return value?String(value):null;}
    function botName(botId){return safeText(options.getBotName&&options.getBotName(botId),100)||tr('原 Bot','Original Bot');}
    function sourceTitle(source){
      if(source==='application')return tr('应用窗口','Application window');
      if(source==='screen')return tr('当前屏幕','Current screen');
      if(source==='browser')return tr('当前网页','Current web page');
      return tr('当前 Bot Studio','Current Bot Studio');
    }
    function sourceLabel(value,uiKind){
      var browserPlayback=uiKind==='browser-playback'||value&&(value.uiKind==='browser-playback'||value.kind==='browser-playback');
      var label=browserPlayback?tr('当前网页','Current web page'):sourceTitle(value&&value.source),target=safeText(value&&value.targetName,120);
      return target&&label.toLocaleLowerCase().indexOf(target.toLocaleLowerCase())<0?label+' · '+target:label;
    }
    function formatDuration(value){
      var seconds=Math.max(0,Math.floor(Number(value)||0)),minutes=Math.floor(seconds/60),remain=seconds%60;
      return String(minutes).padStart(2,'0')+':'+String(remain).padStart(2,'0');
    }
    function elapsed(value){
      var started=Number(value&&value.startedAt),seconds=started>0?Math.max(0,(Date.now()-started)/1000):0;
      return Math.min(180,Math.floor(seconds));
    }
    function rememberBrowserRecording(recordingId){
      recordingId=String(recordingId||'');if(!idPattern.test(recordingId))return;
      browserRecordingIds.add(recordingId.toLowerCase());
      while(browserRecordingIds.size>128)browserRecordingIds.delete(browserRecordingIds.values().next().value);
    }
    function activeForUi(value){
      if(!validActive(value))return null;
      var normalized=Object.assign({},value);
      if(browserRecordingIds.has(String(normalized.recordingId).toLowerCase()))normalized.uiKind='browser-playback';
      return normalized;
    }
    function wasSent(botId,recordingId){return !!(options.hasSentRecording&&options.hasSentRecording(String(botId),String(recordingId)));}
    function setMessage(value,isError){statusMessage=safeText(value,300);statusError=!!isError;render();}
    function notify(){if(options.onChange)options.onChange();}
    function setDialogMessage(value,isError){
      if(!dialogStatus)return;
      dialogStatus.textContent=value||'';dialogStatus.hidden=!value;dialogStatus.dataset.error=isError?'true':'false';
    }
    function currentDraft(botId){
      if(!options.composerReady||!options.composerReady(botId)||!options.readComposer)return null;
      var value=options.readComposer(botId);
      return typeof value==='string'?value:null;
    }
    function draftChanged(){
      if(!latest)return false;
      var snapshot=draftSnapshots.get(latest.metadata.recordingId);
      if(!snapshot||snapshot.botId!==latest.botId)return false;
      var current=currentDraft(latest.botId);
      var revision=Number(draftRevisionByBot[latest.botId]||0);
      return current!==null&&(current!==snapshot.value||revision!==snapshot.revision);
    }
    function render(){
      if(!statusNode)return;
      syncStatusPlacement();
      var visible=!!(active||latest||startBusy||statusMessage);
      statusNode.hidden=!visible;
      if(!visible)return;
      var currentState=active?(active.state==='stopping'||stopBusy?'stopping':active.state==='starting'?'starting':'recording'):latest?'saved':startBusy?'starting':'error';
      statusNode.dataset.state=currentState;
      if(active){
        if(titleNode)titleNode.textContent=(currentState==='stopping'?tr('正在停止录制','Stopping recording'):currentState==='starting'?tr('正在开始录制','Starting recording'):tr('正在录制','Recording'))+' · '+botName(active.botId);
        if(durationNode)durationNode.textContent=formatDuration(elapsed(active));
        if(detailNode)detailNode.textContent=sourceLabel(active);
      }else if(latest){
        if(titleNode)titleNode.textContent=tr(latest.uiKind==='browser-playback'?'网页录制已保存':'录制已保存',latest.uiKind==='browser-playback'?'Web recording saved':'Recording saved')+' · '+botName(latest.botId);
        if(durationNode)durationNode.textContent=formatDuration(latest.metadata.durationSeconds);
        if(detailNode)detailNode.textContent=sourceLabel(latest.metadata,latest.uiKind);
      }else{
        if(titleNode)titleNode.textContent=startBusy?tr('正在开始录制','Starting recording'):tr('录制暂不可用','Recording unavailable')+' · '+botName(failedBotId);
        if(durationNode)durationNode.textContent=startBusy?'00:00':'';
        if(detailNode)detailNode.textContent=startBusy?sourceLabel(startingInfo)+' · '+botName(startingInfo&&startingInfo.botId):'';
      }
      if(messageNode){
        var message=statusError&&statusMessage?statusMessage:(latest&&draftChanged()?tr('草稿已变化；发送录制会保留当前草稿。','The draft changed; sending the recording will keep the current draft.'):statusMessage);
        messageNode.textContent=message||'';messageNode.hidden=!message;messageNode.dataset.error=statusError?'true':'false';
      }
      if(audioNode){
        audioNode.hidden=!(currentState==='recording'||currentState==='stopping'||currentState==='saved');
        var audio=active||latest&&latest.metadata;
        if(audio){
          var microphone=audio.audio&&audio.audio.microphone===true||audio.audioMode==='system-and-microphone';
          audioNode.textContent=microphone?tr('系统声音 · 麦克风已选择','System audio · microphone selected'):tr('系统声音 · 未启用麦克风','System audio · microphone off');
          audioNode.setAttribute('aria-label',audioNode.textContent);
        }
      }
      if(stopButton){
        var retryStop=!!(active&&active.state==='stopping'&&active.cleanupUnconfirmed);
        stopButton.hidden=!active;stopButton.disabled=stopBusy||!!(active&&active.state==='stopping'&&!active.cleanupUnconfirmed);
        stopButton.textContent=stopBusy?tr(retryStop?'正在重试停止…':'正在停止…',retryStop?'Retrying stop…':'Stopping…'):
          tr(retryStop?'重试停止':'停止录制',retryStop?'Retry stop':'Stop recording');
      }
      if(previewButton)previewButton.hidden=!latest;
      if(saveButton){
        saveButton.hidden=!latest;
        saveButton.disabled=startBusy||stopBusy||saveBusy||!bridge||typeof bridge.saveAppRecording!=='function';
        saveButton.textContent=saveBusy?tr('正在保存…','Saving…'):tr('保存视频','Save video');
      }
      if(sendButton){
        sendButton.hidden=!latest||latest.metadata.source==='browser';sendButton.disabled=startBusy||stopBusy;
        sendButton.textContent=tr('发送给','Send to')+' '+botName(latest&&latest.botId);
      }
      if(dialogSend){dialogSend.hidden=!(latest&&latest.metadata.source!=='browser'&&previewRecord&&previewRecord.sendable&&latest.metadata.recordingId===previewRecord.metadata.recordingId);dialogSend.textContent=tr('发送给','Send to')+' '+botName(latest&&latest.botId);}
    }
    function setLatest(botId,value){
      var browserPlayback=!!(value&&browserRecordingIds.has(String(value.recordingId||'').toLowerCase()));
      var metadata=recordingMetadata(value);
      if(!metadata)return false;
      if(wasSent(botId,metadata.recordingId)){
        if(latest&&latest.botId===String(botId)&&latest.metadata.recordingId===metadata.recordingId)latest=null;
        render();return true;
      }
      if(!latest||latest.metadata.recordingId!==metadata.recordingId||latest.botId!==String(botId)){
        latest={botId:String(botId),metadata:metadata,uiKind:browserPlayback?'browser-playback':''};
      }else{latest.metadata=metadata;if(browserPlayback)latest.uiKind='browser-playback';}
      render();return true;
    }
    function receiveStatus(botId,result){
      if(!result||result.ok===false)throw new Error((result&&result.message)||tr('无法读取录制状态。','Could not read recording status.'));
      var targetBotId=String(botId);
      var incomingActive=activeForUi(result.active);
      if(incomingActive){
        var same=active&&active.recordingId===String(incomingActive.recordingId)&&active.botId===String(incomingActive.botId);
        if(same)active=Object.assign({},active,incomingActive);
        else{active=Object.assign({},incomingActive);}
        if(!same)stopBusy=false;
        statusMessage=safeText(result.error,300);
        if(!statusMessage&&incomingActive.cleanupUnconfirmed)statusMessage=tr('无法确认录制进程已关闭，请重试停止。','Could not confirm the recording process has closed. Retry stopping.');
        statusError=!!statusMessage;
      }else{
        if(active&&active.botId===targetBotId){active=null;stopBusy=false;}
        if(result.recent&&recordingMetadata(result.recent))setLatest(botId,result.recent);
        else if(latest&&latest.botId===targetBotId&&!wasSent(botId,latest.metadata.recordingId)){
          // Keep a stopped draft recoverable if a later status response omits recent metadata.
        }
        if(result.error&&(result.supported!==false||failedBotId===targetBotId)){
          failedBotId=targetBotId;
          statusMessage=safeText(result.error,300);
          statusError=true;
        }else if(!latest&&statusMessage&&failedBotId!==targetBotId){
          failedBotId='';
          statusMessage='';
          statusError=false;
        }
      }
      if(active&&active.botId===targetBotId&&result.recent&&recordingMetadata(result.recent))setLatest(botId,result.recent);
      render();notify();
      return result;
    }
    function refresh(botId){
      botId=String(botId||active&&active.botId||selectedBotId()||'');
      if(!botId)return Promise.resolve(null);
      if(statusRequests.has(botId))return statusRequests.get(botId);
      if(!bridge||typeof bridge.appRecordingStatus!=='function')return Promise.reject(new Error(tr('桌面录制服务不可用。','The desktop recording service is unavailable.')));
      var promise=Promise.resolve().then(function(){return bridge.appRecordingStatus({botId:botId});}).then(function(result){return receiveStatus(botId,result);})
        .catch(function(error){if(active||latest)setMessage(String(error&&error.message||error||tr('录制状态暂不可用。','Recording status is unavailable.')),true);throw error;})
        .finally(function(){statusRequests.delete(botId);});
      statusRequests.set(botId,promise);return promise;
    }
    function ensurePoll(){
      if(pollTimer||pollBusy)return;
      var hidden=typeof document!=='undefined'&&document.visibilityState==='hidden';
      if(hidden&&!active)return;
      pollTimer=setTimeout(function(){pollTimer=0;poll();},1000);
      if(pollTimer&&typeof pollTimer.unref==='function')pollTimer.unref();
    }
    async function poll(){
      if(pollBusy){ensurePoll();return;}
      var botId=active&&active.botId||selectedBotId();
      if(!botId){ensurePoll();return;}
      pollBusy=true;
      try{await refresh(botId);}catch(error){}
      finally{pollBusy=false;ensurePoll();}
    }
    function sync(){
      var currentBotId=selectedBotId();
      if(!active&&!latest&&!startBusy&&statusMessage&&currentBotId&&failedBotId!==currentBotId){
        failedBotId='';statusMessage='';statusError=false;
      }
      render();
      if(typeof document!=='undefined'&&document.visibilityState==='hidden'&&!active){if(pollTimer){clearTimeout(pollTimer);pollTimer=0;}return;}
      ensurePoll();
    }
    async function begin(botId,source,targetId,targetName,draft,audioMode,isBrowser){
      if(startBusy||active)throw new Error(tr('已有录制正在进行，请先停止。','A recording is already active. Stop it before starting another.'));
      var method=isBrowser?'startBrowserRecording':'startAppRecording';
      if(!bridge||typeof bridge[method]!=='function')throw new Error(tr('桌面录制服务不可用。','The desktop recording service is unavailable.'));
      botId=String(botId||'');if(!botId||(isBrowser?source!=='browser':sources.indexOf(source)<0))throw new Error(tr('录制来源无效。','Invalid recording source.'));
      if(source==='application'&&!idPattern.test(String(targetId||'')))throw new Error(tr('请选择有效的应用窗口。','Choose a valid application window.'));
      audioMode=audioMode==='system'?'system':'system-and-microphone';
      startBusy=true;startingInfo={botId:botId,source:source,targetName:safeText(targetName,120),audioMode:audioMode};failedBotId='';statusMessage='';statusError=false;render();
      try{
        var request=isBrowser?{botId:botId,audioMode:audioMode,maxDurationSeconds:180}:{botId:botId,source:source,audioMode:audioMode};
        if(!isBrowser&&source==='application')request.targetId=String(targetId);
        var result=await bridge[method](request);
        if(!result||result.ok!==true){var startError=new Error((result&&result.message)||tr('无法开始录制。','Could not start recording.'));if(result&&result.code)startError.code=result.code;throw startError;}
        var started=validActive(result.active)?Object.assign({},result.active):(validActive(result)?Object.assign({},result):null);
        if(isBrowser&&result.kind==='browser-playback'){
          var browserRecordingId=String(result.recordingId||result.active&&result.active.recordingId||started&&started.recordingId||'');
          rememberBrowserRecording(browserRecordingId);
          if(started&&String(started.recordingId).toLowerCase()===browserRecordingId.toLowerCase())started.uiKind='browser-playback';
        }
        if(started){active=started;stopBusy=false;statusMessage='';statusError=false;
          var normalizedTarget=safeText(targetName,120)||safeText(started.targetName,120);
          if(normalizedTarget)active.targetName=normalizedTarget;
          if(typeof draft==='string')draftSnapshots.set(active.recordingId,{botId:botId,value:draft,revision:Number(draftRevisionByBot[botId]||0)});
        }else{
          var metadata=recordingMetadata(result);
          if(metadata)setLatest(botId,metadata);
          else await refresh(botId);
        }
        notify();return result;
      }catch(error){
        failedBotId=botId;
        setMessage(String(error&&error.message||error||tr('无法开始录制。','Could not start recording.')),true);
        throw error;
      }finally{startBusy=false;startingInfo=null;render();ensurePoll();}
    }
    function start(botId,source,targetId,targetName,draft,audioMode){
      return begin(botId,source,targetId,targetName,draft,audioMode||'system-and-microphone',false);
    }
    function startBrowser(botId,audioMode,targetName){
      return begin(botId,'browser',null,targetName,undefined,audioMode||'system',true);
    }
    async function stop(){
      if(!active||stopBusy)return false;
      if(!bridge||typeof bridge.stopAppRecording!=='function'){setMessage(tr('停止录制服务不可用。','The recording stop service is unavailable.'),true);return false;}
      var recording=Object.assign({},active),botId=recording.botId,restorePreviewFocus=typeof document!=='undefined'&&document.activeElement===stopButton;
      stopBusy=true;active.state='stopping';statusMessage='';statusError=false;render();
      try{
        var result=await bridge.stopAppRecording({botId:botId,recordingId:recording.recordingId});
        if(!result||result.ok!==true)throw new Error((result&&result.message)||tr('录制未能停止。','The recording did not stop.'));
        active=null;stopBusy=false;
        if(!setLatest(botId,result&&result.metadata||result))throw new Error(tr('录制已停止，但返回的文件信息无效。','The recording stopped, but its file metadata is invalid.'));
        statusMessage='';statusError=false;render();notify();
        if(restorePreviewFocus&&previewButton&&!previewButton.hidden)previewButton.focus({preventScroll:true});
        return true;
      }catch(error){
        var failure=String(error&&error.message||error||tr('录制未能停止。','The recording did not stop.'));
        setMessage(failure,true);
        try{await refresh(botId);}catch(ignore){}
        if(active&&active.recordingId===recording.recordingId)setMessage(failure,true);
        return false;
      }finally{stopBusy=false;if(active&&active.recordingId===recording.recordingId&&active.state==='stopping')active.state=recording.state;render();notify();ensurePoll();}
    }
    async function openPermissions(botId,audioMode){
      if(!bridge||typeof bridge.openAppRecordingPermissions!=='function')throw new Error(tr('录制权限设置不可用。','Recording permission settings are unavailable.'));
      var result=await bridge.openAppRecordingPermissions({audioMode:audioMode==='system'?'system':'system-and-microphone'});
      if(!result||result.ok!==true)throw new Error((result&&result.message)||tr('无法打开录制权限设置。','Could not open recording permissions.'));
      if(botId)await refresh(String(botId));
      return result;
    }
    async function saveLatest(){
      if(!latest||saveBusy)return false;
      if(!bridge||typeof bridge.saveAppRecording!=='function'){setMessage(tr('保存视频服务不可用。','Saving recordings is unavailable.'),true);return false;}
      var item=latest,botId=item.botId,recordingId=item.metadata.recordingId;
      saveBusy=true;statusMessage='';statusError=false;render();
      try{
        var result=await bridge.saveAppRecording({botId:botId,recordingId:recordingId});
        if(!result||result.ok!==true)throw new Error((result&&result.message)||tr('无法保存录制视频。','Could not save the recording.'));
        if(result.canceled===true){setMessage(tr('已取消保存；录制仍可预览或再次保存。','Save canceled. The recording is still available to preview or save again.'),false);return {canceled:true};}
        setMessage(tr('视频已保存到所选位置。','Video saved to the selected location.'),false);
        return result;
      }catch(error){setMessage(String(error&&error.message||error||tr('无法保存录制视频。','Could not save the recording.')),true);return false;}
      finally{saveBusy=false;render();}
    }
    async function loadPreview(botId,metadata,epoch){
      if(!bridge||typeof bridge.readAppRecording!=='function')throw new Error(tr('读取录制服务不可用。','The recording reader is unavailable.'));
      var result=await bridge.readAppRecording({botId:String(botId),recordingId:metadata.recordingId});
      if(epoch!==previewEpoch||!dialog||!dialog.open)return;
      if(!result||result.ok!==true)throw new Error((result&&result.message)||tr('无法读取录制。','Could not read the recording.'));
      var mediaUrl=result.mediaUrl;
      if(!validMediaUrl(mediaUrl))throw new Error(tr('录制地址无效。','The recording URL is invalid.'));
      if(result.dataUrl&&validPoster(result.dataUrl))video.poster=result.dataUrl;else video.removeAttribute('poster');
      video.src=mediaUrl;video.hidden=false;video.load();setDialogMessage('',false);
    }
    function openPreview(botId,metadata,sendable,uiKind){
      metadata=recordingMetadata(metadata);if(!metadata||!dialog||!video)return;
      previewRecord={botId:String(botId),metadata:metadata,sendable:!!sendable&&metadata.source!=='browser',uiKind:uiKind||''};
      var epoch=++previewEpoch;
      if(dialogTitle)dialogTitle.textContent=tr('录制预览','Recording preview')+' · '+botName(botId)+' · '+sourceLabel(metadata,uiKind);
      if(video){video.pause();video.removeAttribute('src');video.removeAttribute('poster');video.hidden=true;video.load();}
      if(dialogRetry)dialogRetry.hidden=true;
      if(dialogSend){dialogSend.hidden=!sendable||metadata.source==='browser';dialogSend.textContent=tr('发送给','Send to')+' '+botName(botId);}
      setDialogMessage(tr('正在读取录制…','Loading recording…'),false);
      if(!dialog.open)dialog.showModal();
      loadPreview(botId,metadata,epoch).catch(function(error){
        if(epoch!==previewEpoch)return;
        setDialogMessage(String(error&&error.message||error||tr('无法读取录制。','Could not read the recording.')),true);
        if(dialogRetry)dialogRetry.hidden=false;
      });
    }
    async function retryPreview(){
      if(!previewRecord)return;
      var epoch=++previewEpoch;video.pause();video.removeAttribute('src');video.removeAttribute('poster');video.hidden=true;
      setDialogMessage(tr('正在重新读取录制…','Reloading recording…'),false);if(dialogRetry)dialogRetry.hidden=true;
      try{await loadPreview(previewRecord.botId,previewRecord.metadata,epoch);}
      catch(error){if(epoch===previewEpoch){setDialogMessage(String(error&&error.message||error),true);if(dialogRetry)dialogRetry.hidden=false;}}
    }
    function closePreview(){
      previewEpoch++;previewRecord=null;
      if(video){video.pause();video.removeAttribute('src');video.removeAttribute('poster');video.hidden=true;video.load();}
      setDialogMessage('',false);if(dialogRetry)dialogRetry.hidden=true;
    }
    function sendLatest(){
      if(!latest||startBusy||stopBusy)return false;
      var item=latest,botId=item.botId,metadata=item.metadata;
      if(wasSent(botId,metadata.recordingId)){latest=null;render();return true;}
      var snapshot=draftSnapshots.get(metadata.recordingId),lease=null,text=tr('帮我看看这段录制','Please review this recording');
      if(snapshot&&snapshot.botId===botId&&snapshot.value&&Number(draftRevisionByBot[botId]||0)===snapshot.revision&&currentDraft(botId)===snapshot.value){
        lease=options.takeComposer&&options.takeComposer(botId);
        if(lease&&String(lease.snapshot&&lease.snapshot.value||'')===snapshot.value)text=snapshot.value.trim()||text;
        else{if(lease&&options.restoreComposer)options.restoreComposer(lease);lease=null;}
      }
      if(!options.send||!options.send(botId,text,lease,metadata)){
        if(lease&&options.restoreComposer)options.restoreComposer(lease);
        setMessage(tr('录制尚未发送；草稿已保留，请重试。','The recording was not sent. Your draft was kept; try again.'),true);
        return false;
      }
      latest=null;draftSnapshots.delete(metadata.recordingId);statusMessage='';statusError=false;
      if(dialog&&dialog.open)dialog.close();
      render();
      if(selectedBotId()===botId&&options.composerReady&&options.composerReady(botId)&&input&&!input.disabled&&input.getClientRects().length)input.focus({preventScroll:true});
      return true;
    }
    function durationLabel(metadata){return formatDuration(metadata&&metadata.durationSeconds);}
    function renderHistory(bot){
      if(!bot||!Array.isArray(bot.messages))return;
      var container=document.getElementById('messages');if(!container)return;
      bot.messages.forEach(function(message,index){
        var metadata=message&&message.role==='user'&&recordingMetadata(message.appRecording);
        if(!metadata)return;
        var bubble=container.querySelector('.msg.user[data-chat-index="'+index+'"]');
        if(!bubble||bubble.querySelector('.app-recording-attachment'))return;
        var button=document.createElement('button');button.type='button';button.className='app-recording-attachment';
        var ownerName=botName(String(bot.id)),display=sourceLabel(metadata);
        button.setAttribute('aria-label',tr('播放录制','Play recording')+' · '+durationLabel(metadata)+' · '+display);
        button.title=button.getAttribute('aria-label');
        var icon=document.createElement('span');icon.className='app-recording-attachment-icon';icon.setAttribute('aria-hidden','true');
        icon.innerHTML='<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2.5" y="3" width="15" height="14" rx="2"/><path d="m8 7 5 3-5 3z" fill="currentColor" stroke="none"/></svg>';
        var copy=document.createElement('span');copy.className='app-recording-attachment-copy';
        var heading=document.createElement('strong');heading.textContent=tr('屏幕录制','Screen recording')+' · '+durationLabel(metadata);
        var subtitle=document.createElement('small');subtitle.textContent=display+' · '+ownerName;
        copy.appendChild(heading);copy.appendChild(subtitle);button.appendChild(icon);button.appendChild(copy);
        button.addEventListener('click',function(){openPreview(String(bot.id),metadata,false);});
        bubble.appendChild(button);
      });
    }
    function handleInput(){var botId=selectedBotId();if(botId)draftRevisionByBot[botId]=Number(draftRevisionByBot[botId]||0)+1;render();}
    if(stopButton)stopButton.addEventListener('click',function(){stop();});
    if(previewButton)previewButton.addEventListener('click',function(){if(latest)openPreview(latest.botId,latest.metadata,true,latest.uiKind);});
    ensureSaveButton();
    if(saveButton)saveButton.addEventListener('click',function(){saveLatest();});
    if(sendButton)sendButton.addEventListener('click',sendLatest);
    if(dialogSend)dialogSend.addEventListener('click',sendLatest);
    if(dialogClose)dialogClose.addEventListener('click',function(){if(dialog&&dialog.open)dialog.close();});
    if(dialogRetry)dialogRetry.addEventListener('click',retryPreview);
    if(dialog){
      dialog.addEventListener('close',closePreview);
      dialog.addEventListener('click',function(event){if(event.target===dialog)dialog.close();});
    }
    if(video)video.addEventListener('error',function(){if(dialog&&dialog.open){setDialogMessage(tr('录制读取失败，可重新读取后再播放。','The recording could not be loaded. Reload it to play.'),true);if(dialogRetry)dialogRetry.hidden=false;}});
    if(input)input.addEventListener('input',handleInput);
    if(typeof document!=='undefined'){
      document.addEventListener('visibilitychange',sync);
      observeStatusHosts();
      syncStatusPlacement();
    }
    function destroy(){
      if(pollTimer){clearTimeout(pollTimer);pollTimer=0;}
      if(typeof document!=='undefined')document.removeEventListener('visibilitychange',sync);
    }
    sync();
    return Object.freeze({sync:sync,refresh:refresh,start:start,startBrowser:startBrowser,stop:stop,saveLatest:saveLatest,focusStop:function(){if(stopButton&&!stopButton.hidden&&!stopButton.disabled)stopButton.focus({preventScroll:true});},openPermissions:openPermissions,
      currentActive:function(){return active;},renderHistory:renderHistory,sendLatest:sendLatest,destroy:destroy});
  }
  return Object.freeze({create:create,normalizeMetadata:recordingMetadata,validActive:validActive});
});
