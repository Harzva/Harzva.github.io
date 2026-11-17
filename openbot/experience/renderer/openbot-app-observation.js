/* Composer source menu and persistent message attachments for App observations. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OpenBotAppObservation=api;
})(typeof window==='object'?window:null,function(){
  'use strict';

  var imageCache=new Map();
  var imageLoads=new Map();
  var imageCacheLimit=8;
  var sources=['app','application','screen'];

  function captureKey(botId,captureId){return String(botId)+'\u0000'+String(captureId);}
  function isImageDataUrl(value){return typeof value==='string'&&/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);}
  function normalizeSource(value){return value==='previous-app'?value:(sources.indexOf(value)>=0?value:'app');}
  function safeText(value,maxLength){return typeof value==='string'?value.trim().slice(0,maxLength||180):'';}
  function getCachedImage(key){
    if(!imageCache.has(key))return null;
    var value=imageCache.get(key);imageCache.delete(key);imageCache.set(key,value);return value;
  }
  function cacheImage(key,value){
    imageCache.delete(key);imageCache.set(key,value);
    while(imageCache.size>imageCacheLimit)imageCache.delete(imageCache.keys().next().value);
  }
  function validMetadata(value){
    return !!value&&/^[a-f0-9]{32}$/.test(String(value.captureId||''))&&Number.isFinite(Number(value.at))&&
      Number.isInteger(Number(value.width))&&Number(value.width)>0&&Number.isInteger(Number(value.height))&&Number(value.height)>0;
  }

  function create(options){
    options=options||{};
    var button=options.button,menu=options.menu,feedback=options.feedback,input=options.input;
    var menuStatus=options.menuStatus,permissionsButton=options.permissionsButton,menuCloseButton=options.menuCloseButton;
    var applicationPane=options.applicationPane,applicationTargets=options.applicationTargets,applicationStatus=options.applicationStatus;
    var applicationBackButton=options.applicationBackButton,applicationRefreshButton=options.applicationRefreshButton;
    var modeButtons=menu?Array.prototype.slice.call(menu.querySelectorAll('[data-observation-mode]')):[];
    var modeGroup=menu&&menu.querySelector('.app-observation-mode');
    var recording=options.recording,menuTitle=menu&&menu.querySelector('#app-observation-menu-title'),menuHint=menu&&menu.querySelector('#app-observation-menu-hint');
    var applicationTitle=menu&&menu.querySelector('#app-observation-application-title'),audioSummary=menu&&menu.querySelector('#app-observation-audio');
    var audioModeControl=null,audioModeSelect=null,selectedAudioMode='system-and-microphone';
    var sourceList=menu&&menu.querySelector('.app-observation-source-list');
    var sourceButtons=menu?Array.prototype.slice.call(menu.querySelectorAll('[data-observation-source]')):[];
    var inFlight=false,recordStartBusy=false,statusBusy=false,permissionsBusy=false,menuOpen=false,applicationPickerOpen=false,applicationListBusy=false,lastBotId=null,selectionVersion=0,menuEpoch=0,statusRequestEpoch=0,applicationEpoch=0,menuBotId=null,operation='capture';
    var lastStatus=null,statusError='',applicationListError='',applicationList=[],dialog=null,dialogImage=null,dialogTitle=null;
    var pluginPane=null,pluginTitle=null,pluginCopy=null,pluginDetails=null,pluginProgress=null,pluginProgressCopy=null,pluginStatusNode=null;
    var pluginPrimaryButton=null,pluginLocalButton=null,pluginCancelButton=null,pluginBackButton=null,pluginDisableButton=null,pluginUninstallButton=null;
    var pluginManageRow=null,pluginManageCopy=null,pluginManageButton=null,pluginStatus=null,pluginStatusError='',pluginErrorKind='',pluginStatusLoading=false,pluginStatusRequestBusy=false,pluginAction='',pluginActionBusy=false,pluginActionFocus=null,pluginCancelBusy=false,pluginView='flow',pluginRequestEpoch=0,pluginDownloadEpoch=0,pluginPollTimer=null;

    function tr(zh,en){return options.translate?options.translate(zh,en):zh;}
    function activeBotId(){var value=options.getActiveBotId&&options.getActiveBotId();return value?String(value):null;}
    function operationTitle(){return operation==='record'?tr('录制界面','Record a screen or app'):tr('截图并发送给当前 Bot','Capture and send to this Bot');}
    function operationHint(){return operation==='record'?tr('录制最长 3 分钟；停止后可预览、保存，或发送给开始录制的 Bot。','Record up to 3 minutes. Stop to preview, save or send it to the Bot that started it.'):tr('选择来源后将立即发送当前草稿。','Choose a source to send your current draft right away.');}
    function sourceTitle(source){
      if(source==='previous-app')return tr('上一个应用','Previous app');
      if(source==='screen')return tr('当前屏幕','Current screen');
      if(source==='application')return tr('应用窗口','Application window');
      return tr('当前 Bot Studio','Current Bot Studio');
    }
    function sourceLabel(metadata){
      metadata=metadata||{};
      var source=normalizeSource(metadata.source),label=sourceTitle(source),target=safeText(metadata.targetName,120);
      if(target&&label.toLocaleLowerCase().indexOf(target.toLocaleLowerCase())<0)label+=' · '+target;
      return label;
    }
    function showFeedback(message,isError){
      if(!feedback)return;
      feedback.textContent=message||'';
      feedback.hidden=!message;
      feedback.dataset.error=isError?'true':'false';
    }
    function setMenuMessage(message,isError){
      if(!menuStatus)return;
      menuStatus.textContent=message||'';
      menuStatus.hidden=!message;
      menuStatus.dataset.error=isError?'true':'false';
    }
    function currentSelection(botId,version){
      return activeBotId()===botId&&selectionVersion===version&&options.getBotMode&&options.getBotMode()!=='space'&&
        (!options.getView||options.getView()==='chat');
    }
    function permissionGranted(value){
      if(value===true)return true;
      if(!value||value===false)return false;
      if(typeof value==='object'){
        if(value.granted===true||value.authorized===true)return true;
        value=value.status||value.state||value.authorizationStatus||value.permissionStatus||'';
      }
      return typeof value==='string'&&/(^|[^a-z])(granted|authorized|allowed)([^a-z]|$)|已授权|已允许/i.test(value);
    }
    function recordingPermissions(status){
      return {screen:permissionGranted(status&&status.screenPermission),microphone:permissionGranted(status&&status.microphonePermission)};
    }
    function recordingReady(status,audioMode){
      if(!status||status.supported!==true||status.available===false)return false;
      var permissions=recordingPermissions(status);
      return permissions.screen&&(audioMode==='system'||permissions.microphone);
    }
    function recordingPermissionNeeded(status,audioMode){
      var permissions=recordingPermissions(status);
      return !permissions.screen||(audioMode!=='system'&&!permissions.microphone);
    }
    function menuActiveRecording(){var current=recording&&recording.currentActive?recording.currentActive():null;return current||lastStatus&&lastStatus.active||null;}
    function pluginApiAvailable(){return !!(options.bridge&&typeof options.bridge.capturePluginStatus==='function');}
    function pluginManaged(){return pluginApiAvailable();}
    function pluginEnabled(){return !!(pluginStatus&&pluginStatus.installed===true&&pluginStatus.enabled===true);}
    function pluginDownloading(){return !!(pluginStatus&&/^(downloading|installing)$/i.test(String(pluginStatus.state||'')));}
    function pluginBytes(value){
      var bytes=Number(value);
      if(!Number.isFinite(bytes)||bytes<0)return '';
      if(bytes===0)return '0 B';
      var units=['B','KB','MB','GB'],index=0;
      while(bytes>=1024&&index<units.length-1){bytes/=1024;index++;}
      var digits=index===0||bytes>=100?0:(bytes>=10?1:2);
      return bytes.toFixed(digits)+' '+units[index];
    }
    function ensureAudioModeControl(){
      if(audioModeControl||!menu||!audioSummary||typeof document==='undefined')return audioModeControl;
      audioModeControl=document.createElement('label');audioModeControl.className='app-observation-audio-choice';audioModeControl.hidden=true;
      var label=document.createElement('span');label.textContent=tr('音频','Audio');
      audioModeSelect=document.createElement('select');audioModeSelect.setAttribute('aria-label',tr('录制音频','Recording audio'));
      [['system-and-microphone',tr('系统声音和麦克风','System audio and microphone')],['system',tr('仅系统声音','System audio only')]].forEach(function(option){var item=document.createElement('option');item.value=option[0];item.textContent=option[1];audioModeSelect.appendChild(item);});
      audioModeSelect.value=selectedAudioMode;
      audioModeSelect.addEventListener('change',function(){selectedAudioMode=audioModeSelect.value==='system'?'system':'system-and-microphone';renderMenuStatus();});
      audioModeControl.appendChild(label);audioModeControl.appendChild(audioModeSelect);
      audioSummary.insertAdjacentElement('afterend',audioModeControl);
      return audioModeControl;
    }
    function makePluginButton(action,label){
      var item=document.createElement('button');item.type='button';item.className='app-observation-plugin-action';item.dataset.pluginAction=action;item.dataset.pluginControl=action;item.textContent=label;
      item.addEventListener('click',function(){handlePluginAction(item.dataset.pluginAction||action);});
      return item;
    }
    function ensurePluginUi(){
      if(pluginPane||!menu||typeof document==='undefined')return;
      pluginPane=document.createElement('section');pluginPane.className='app-observation-plugin-pane';pluginPane.setAttribute('aria-labelledby','app-observation-menu-title');pluginPane.hidden=true;
      pluginTitle=document.createElement('strong');pluginTitle.id='app-observation-plugin-title';pluginTitle.className='app-observation-plugin-title';
      pluginTitle.textContent=tr('屏幕与应用采集插件','Screen and app capture plugin');
      pluginCopy=document.createElement('p');pluginCopy.className='app-observation-plugin-copy';
      pluginCopy.textContent=tr('截取当前 Bot Studio、选定应用窗口或整个屏幕，也可录制最多 3 分钟的片段。','Capture Bot Studio, an application window, or the whole screen, or record clips up to 3 minutes.');
      pluginDetails=document.createElement('p');pluginDetails.className='app-observation-plugin-details';
      pluginProgress=document.createElement('progress');pluginProgress.className='app-observation-plugin-progress';pluginProgress.max=100;pluginProgress.hidden=true;
      pluginProgress.setAttribute('aria-label',tr('插件下载进度','Plugin download progress'));
      pluginProgressCopy=document.createElement('p');pluginProgressCopy.className='app-observation-plugin-progress-copy';pluginProgressCopy.hidden=true;
      pluginStatusNode=document.createElement('p');pluginStatusNode.className='app-observation-plugin-status';pluginStatusNode.setAttribute('role','status');pluginStatusNode.setAttribute('aria-live','polite');pluginStatusNode.setAttribute('aria-atomic','true');
      var actions=document.createElement('div');actions.className='app-observation-plugin-actions';
      pluginPrimaryButton=makePluginButton('primary',tr('下载并安装','Download and install'));
      pluginLocalButton=makePluginButton('import',tr('从本地安装','Install from file'));
      pluginCancelButton=makePluginButton('cancel',tr('取消下载','Cancel download'));
      pluginBackButton=makePluginButton('back',tr('返回来源','Back to sources'));
      pluginDisableButton=makePluginButton('disable',tr('停用','Disable'));
      pluginUninstallButton=makePluginButton('uninstall',tr('卸载','Uninstall'));
      [pluginPrimaryButton,pluginLocalButton,pluginCancelButton,pluginDisableButton,pluginUninstallButton,pluginBackButton].forEach(function(item){actions.appendChild(item);});
      pluginPane.appendChild(pluginDetails);
      pluginPane.appendChild(pluginProgress);pluginPane.appendChild(pluginProgressCopy);pluginPane.appendChild(pluginStatusNode);pluginPane.appendChild(actions);
      var next=modeGroup||menu.children[1]||null;menu.insertBefore(pluginPane,next);

      pluginManageRow=document.createElement('div');pluginManageRow.className='app-observation-plugin-manage-row';pluginManageRow.hidden=true;
      pluginManageCopy=document.createElement('span');pluginManageCopy.className='app-observation-plugin-manage-copy';
      pluginManageButton=makePluginButton('manage',tr('管理','Manage'));pluginManageButton.classList.add('app-observation-plugin-manage-button');
      pluginManageRow.appendChild(pluginManageCopy);pluginManageRow.appendChild(pluginManageButton);menu.insertBefore(pluginManageRow,modeGroup||pluginPane.nextSibling);
    }
    function stopPluginPolling(){if(pluginPollTimer){clearInterval(pluginPollTimer);pluginPollTimer=null;}}
    function updatePluginPolling(){
      var shouldPoll=menuOpen&&pluginManaged()&&(pluginDownloading()||pluginAction==='download');
      if(!shouldPoll){stopPluginPolling();return;}
      if(pluginPollTimer)return;
      pluginPollTimer=setInterval(function(){if(menuOpen)refreshPluginStatus(true);else stopPluginPolling();},1000);
    }
    function recordingActiveForPlugin(){return !!menuActiveRecording();}
    function renderPluginUi(){
      if(!pluginManaged())return;
      ensurePluginUi();if(!pluginPane)return;
      var enabled=pluginEnabled(),manage=enabled&&pluginView==='manage',loading=pluginStatusLoading,blocked=loading||!!pluginStatusError||!enabled||manage,downloading=pluginDownloading()||pluginAction==='download';
      var showPane=loading||!!pluginStatusError||!enabled||manage;
      pluginPane.hidden=!showPane;
      if(showPane){
        if(menuTitle)menuTitle.textContent=pluginTitle.textContent;
        if(menuHint)menuHint.textContent=pluginCopy.textContent;
      }
      if(modeGroup)modeGroup.hidden=blocked;
      if(audioSummary)audioSummary.hidden=blocked||operation!=='record';
      if(sourceList)sourceList.hidden=blocked||applicationPickerOpen;
      if(applicationPane)applicationPane.hidden=blocked||!applicationPickerOpen;
      if(pluginManageRow){
        pluginManageRow.hidden=!enabled||manage||loading||!!pluginStatusError;
        var version=pluginStatus&&safeText(pluginStatus.version,80);
        pluginManageCopy.textContent=tr('采集插件已启用','Capture plugin enabled')+(version?' · '+version:'');
      }
      var status=pluginStatus||{},versionText=safeText(status.version,100),total=Number(status.totalBytes),downloaded=Number(status.bytes);
      var detailParts=[];
      if(versionText)detailParts.push(tr('版本 ','Version ')+versionText);
      if(Number.isFinite(total)&&total>0)detailParts.push(tr('下载大小 ','Download size ')+pluginBytes(total));
      pluginDetails.textContent=detailParts.join(' · ');
      pluginDetails.hidden=!detailParts.length;
      pluginProgress.hidden=!downloading;
      pluginProgressCopy.hidden=!downloading;
      if(downloading){
        if(Number.isFinite(total)&&total>0){
          pluginProgress.max=total;pluginProgress.value=Math.max(0,Math.min(total,Number.isFinite(downloaded)?downloaded:0));
          var percent=Math.round(pluginProgress.value/total*100);
          pluginProgressCopy.textContent=pluginBytes(pluginProgress.value)+' / '+pluginBytes(total)+' · '+percent+'%';
        }else{
          pluginProgress.removeAttribute('value');
          pluginProgressCopy.textContent=tr('正在下载插件…','Downloading plugin…');
        }
      }else{pluginProgress.removeAttribute('value');}
      var failed=!!pluginStatusError||/^(failed|error)$/i.test(String(status.state||'')),retryStatus=pluginErrorKind==='status';
      var message=pluginStatusError||safeText(status.message,300);
      if(!message){
        if(loading)message=tr('正在检查插件状态…','Checking plugin status…');
        else if(downloading)message=tr('正在下载并安装…','Downloading and installing…');
        else if(enabled)message=manage?tr('插件已启用。','The plugin is enabled.'):'';
        else if(status.installed===true)message=tr('插件已安装，启用后即可选择截图或录制来源。','Plugin installed. Enable it to choose a capture or recording source.');
        else if(status.downloadAvailable===false)message=tr('当前无法下载；也可以从本地安装插件。','Download is currently unavailable. You can install the plugin from a local file.');
        else message=tr('下载插件后即可使用截图与录制。','Download the plugin to use screenshots and recordings.');
      }
      pluginStatusNode.textContent=message;pluginStatusNode.hidden=!message;pluginStatusNode.dataset.error=failed?'true':'false';
      var active=recordingActiveForPlugin(),pluginBusy=active||manage&&status.canUninstall===false;
      var canDownload=!loading&&!status.installed&&status.downloadAvailable!==false;
      pluginPrimaryButton.hidden=manage||downloading;
      pluginPrimaryButton.disabled=loading&&!(pluginActionBusy&&pluginActionFocus===pluginPrimaryButton)||(!retryStatus&&(status.installed===true?enabled:!canDownload));
      pluginPrimaryButton.textContent=retryStatus?tr('重试','Retry'):status.installed===true?tr('启用','Enable'):(failed?tr('重试下载','Retry download'):tr('下载并安装','Download and install'));
      pluginPrimaryButton.dataset.pluginAction=retryStatus?'refresh':status.installed===true?'enable':'primary';
      pluginLocalButton.hidden=manage||!!status.installed||!options.bridge||typeof options.bridge.capturePluginImport!=='function';
      pluginLocalButton.disabled=loading&&!(pluginActionBusy&&pluginActionFocus===pluginLocalButton);
      pluginCancelButton.hidden=manage||!downloading||!options.bridge||typeof options.bridge.capturePluginCancelDownload!=='function';
      pluginCancelButton.disabled=false;
      pluginCancelButton.textContent=pluginCancelBusy?tr('正在取消…','Cancelling…'):tr('取消下载','Cancel download');
      pluginBackButton.hidden=!manage;
      pluginDisableButton.hidden=!manage;
      pluginUninstallButton.hidden=!manage||status.canUninstall!==true;
      pluginDisableButton.disabled=loading&&!(pluginActionBusy&&pluginActionFocus===pluginDisableButton)||pluginBusy||(pluginActionBusy&&document.activeElement!==pluginDisableButton);
      pluginUninstallButton.disabled=loading&&!(pluginActionBusy&&pluginActionFocus===pluginUninstallButton)||pluginBusy||(pluginActionBusy&&document.activeElement!==pluginUninstallButton);
      pluginBackButton.disabled=loading&&!(pluginActionBusy&&pluginActionFocus===pluginBackButton)||(pluginActionBusy&&document.activeElement!==pluginBackButton);
      if(pluginBusy&&manage&&!pluginStatusError){pluginStatusNode.textContent=tr('录制进行中，停止后才能停用或卸载插件。','A recording is active. Stop it before disabling or uninstalling the plugin.');pluginStatusNode.hidden=false;}
      if(pluginActionBusy&&pluginActionFocus&&(document.activeElement===pluginActionFocus||document.activeElement===document.body)){
        if(enabled&&!manage&&modeButtons[0])modeButtons[0].focus({preventScroll:true});
        else if(pluginAction==='download'&&!pluginCancelButton.hidden)pluginCancelButton.focus({preventScroll:true});
        else if(!pluginActionFocus.hidden&&!pluginActionFocus.disabled)pluginActionFocus.focus({preventScroll:true});
      }
      updatePluginPolling();
    }
    async function refreshPluginStatus(silent){
      if(!pluginManaged()||!menuOpen||pluginStatusRequestBusy)return;
      var botId=menuBotId||activeBotId(),version=selectionVersion,epoch=menuEpoch,request=++pluginRequestEpoch;
      pluginStatusRequestBusy=true;pluginStatusLoading=!silent;pluginStatusError='';pluginErrorKind='';if(!silent)renderMenuStatus();
      try{
        var result=await options.bridge.capturePluginStatus();
        if(request!==pluginRequestEpoch||!menuOpen||menuEpoch!==epoch||!currentSelection(botId,version))return;
        if(!result||result.ok!==true||!result.status)throw new Error((result&&result.message)||tr('无法读取采集插件状态。','Could not read capture plugin status.'));
        pluginStatus=result.status;
        if(pluginStatus.installed===true&&pluginStatus.enabled===true&&pluginView==='flow')pluginView='sources';
        else if((pluginStatus.installed!==true||pluginStatus.enabled!==true)&&pluginView==='sources')pluginView='flow';
        if(pluginView==='sources')await loadMenuStatus(botId,version,epoch);
      }catch(error){
        if(request===pluginRequestEpoch&&menuOpen&&menuEpoch===epoch&&currentSelection(botId,version)){pluginStatusError=String(error&&error.message||error||tr('无法读取采集插件状态。','Could not read capture plugin status.'));pluginErrorKind='status';}
      }finally{
        if(request===pluginRequestEpoch){
          pluginStatusRequestBusy=false;
          if(menuOpen&&menuEpoch===epoch&&currentSelection(botId,version)){
            pluginStatusLoading=false;renderMenuStatus();
            if(document.activeElement===button){focusPluginPrimary();}
          }
        }
      }
    }
    function focusPluginPrimary(){
      if(pluginPane&&!pluginPane.hidden){var target=pluginPane.querySelector('[data-plugin-action]:not([hidden]):not(:disabled)');if(target)target.focus({preventScroll:true});}
      else if(modeGroup&&!modeGroup.hidden&&modeButtons[0])modeButtons[0].focus({preventScroll:true});
    }
    async function cancelPluginDownload(){
      if(pluginCancelBusy||!options.bridge||typeof options.bridge.capturePluginCancelDownload!=='function')return;
      var cancelFocus=document.activeElement;
      pluginCancelBusy=true;pluginDownloadEpoch++;pluginActionBusy=false;pluginAction='';pluginActionFocus=null;pluginStatusError='';pluginErrorKind='';renderPluginUi();
      try{
        var result=await options.bridge.capturePluginCancelDownload();
        if(!result||result.ok!==true)throw new Error((result&&result.message)||tr('无法取消插件下载。','Could not cancel the plugin download.'));
        if(result.status)pluginStatus=result.status;
        else if(menuOpen)await refreshPluginStatus(true);
      }catch(error){pluginStatusError=String(error&&error.message||error||tr('无法取消插件下载。','Could not cancel the plugin download.'));pluginErrorKind='action';}
      finally{
        pluginCancelBusy=false;
        if(menuOpen){renderMenuStatus();if((document.activeElement===cancelFocus||document.activeElement===document.body)&&pluginPane&&!pluginPane.hidden)focusPluginPrimary();}
      }
    }
    async function performPluginAction(action){
      if(action==='cancel')return cancelPluginDownload();
      if(action==='refresh'){
        if(pluginActionBusy)return;
        var refreshFocus=document.activeElement,focusWasInPane=!!(pluginPane&&pluginPane.contains(refreshFocus));
        pluginActionBusy=true;pluginAction='refresh';pluginActionFocus=refreshFocus;
        try{await refreshPluginStatus(false);}
        finally{
          pluginActionBusy=false;pluginAction='';pluginActionFocus=null;
          if(menuOpen){renderMenuStatus();if(focusWasInPane&&(document.activeElement===refreshFocus||document.activeElement===document.body))focusPluginPrimary();}
        }
        return;
      }
      if(action==='manage'){
        if(!pluginEnabled())return;
        pluginView='manage';renderMenuStatus();
        focusPluginPrimary();
        return;
      }
      if(action==='back'){
        pluginView='sources';renderMenuStatus();
        if(modeButtons[0]&&!modeButtons[0].disabled)modeButtons[0].focus({preventScroll:true});
        return;
      }
      if(pluginActionBusy)return;
      var actionFocus=document.activeElement,focusWasInPlugin=!!(pluginPane&&pluginPane.contains(actionFocus));
      var status=pluginStatus||{};
      if(action==='primary')action=status.installed===true?'enable':'download';
      if(action==='retry')action='download';
      if((action==='disable'||action==='uninstall')&&recordingActiveForPlugin())return;
      var methodName,args=[];
      if(action==='download')methodName='capturePluginDownload';
      else if(action==='import')methodName='capturePluginImport';
      else if(action==='enable'){methodName='capturePluginSetEnabled';args=[{enabled:true}];}
      else if(action==='disable'){methodName='capturePluginSetEnabled';args=[{enabled:false}];}
      else if(action==='uninstall')methodName='capturePluginUninstall';
      else return;
      if(!options.bridge||typeof options.bridge[methodName]!=='function'){
        pluginStatusError=tr('此版本桌面版尚未提供插件操作。','Plugin management is not available in this desktop build.');renderPluginUi();return;
      }
      pluginActionBusy=true;pluginAction=action;pluginActionFocus=actionFocus;pluginStatusError='';pluginErrorKind='';
      var downloadEpoch=action==='download'?++pluginDownloadEpoch:pluginDownloadEpoch;
      var statusRefreshed=false;
      renderPluginUi();
      try{
        var result=await options.bridge[methodName].apply(options.bridge,args);
        if(action==='download'&&downloadEpoch!==pluginDownloadEpoch)return;
        if(!result||result.ok!==true)throw new Error((result&&result.message)||tr('插件操作失败，请重试。','The plugin action failed. Try again.'));
        pluginErrorKind='';if(result.status)pluginStatus=result.status;
        if(action==='enable')pluginView=result.status&&result.status.enabled!==true?'flow':'sources';
        if(action==='disable'||action==='uninstall'||action==='import'||action==='download')pluginView='flow';
        if(!result.status&&menuOpen){statusRefreshed=true;await refreshPluginStatus(true);}
      }catch(error){
        if(action!=='download'||downloadEpoch===pluginDownloadEpoch){pluginStatusError=String(error&&error.message||error||tr('插件操作失败，请重试。','The plugin action failed. Try again.'));pluginErrorKind='action';}
      }finally{
        if(action!=='download'||downloadEpoch===pluginDownloadEpoch){
          pluginActionBusy=false;pluginAction='';pluginActionFocus=null;
          if(menuOpen){
            renderMenuStatus();
            if(focusWasInPlugin&&(document.activeElement===actionFocus||document.activeElement===document.body))focusPluginPrimary();
            if(pluginView==='sources'&&!statusRefreshed)loadMenuStatus(menuBotId||activeBotId(),selectionVersion,menuEpoch);
          }
        }
      }
    }
    function handlePluginAction(action){performPluginAction(action);}
    function applyOperationCopy(){
      ensureAudioModeControl();
      if(menuTitle)menuTitle.textContent=operationTitle();
      if(menuHint)menuHint.textContent=operationHint();
      if(audioSummary){
        audioSummary.hidden=operation!=='record';
        audioSummary.textContent=selectedAudioMode==='system'
          ? tr('系统声音会录入；麦克风未启用。','System audio will be captured; microphone is off.')
          : tr('系统声音和麦克风会录入。','System audio and microphone will be captured.');
      }
      if(audioModeControl)audioModeControl.hidden=operation!=='record';
      if(audioModeSelect)audioModeSelect.disabled=recordStartBusy||permissionsBusy||!!menuActiveRecording();
      if(menuCloseButton){
        menuCloseButton.setAttribute('aria-label',operation==='record'?tr('关闭录制来源菜单','Close recording sources'):tr('关闭截图来源菜单','Close screenshot sources'));
        menuCloseButton.title=tr('关闭','Close');
      }
      modeButtons.forEach(function(item){var selected=item.dataset.observationMode===operation;item.setAttribute('aria-checked',String(selected));item.tabIndex=selected?0:-1;});
      if(applicationTitle)applicationTitle.textContent=operation==='record'?tr('选择要录制的应用窗口','Choose an application window to record'):tr('选择应用窗口','Choose an application window');
      if(applicationBackButton){
        applicationBackButton.setAttribute('aria-label',operation==='record'?tr('返回录制来源','Back to recording sources'):tr('返回截图来源','Back to screenshot sources'));
        applicationBackButton.title=tr('返回','Back');
      }
      var sourceGroup=sourceList;
      if(sourceGroup){
        sourceGroup.setAttribute('aria-label',operation==='record'?tr('录制来源','Recording sources'):tr('截图来源','Screenshot sources'));
      }
    }
    function closeMenu(restoreFocus){
      menuOpen=false;
      menuEpoch++;statusRequestEpoch++;applicationEpoch++;applicationPickerOpen=false;applicationListBusy=false;
      pluginRequestEpoch++;pluginStatusRequestBusy=false;pluginStatusLoading=false;stopPluginPolling();
      applicationList=[];applicationListError='';
      if(menu)menu.hidden=true;
      if(sourceList)sourceList.hidden=false;
      if(applicationPane)applicationPane.hidden=true;
      if(button){button.setAttribute('aria-expanded','false');}
      if(restoreFocus&&button&&!button.disabled)button.focus({preventScroll:true});
    }
    function sync(){
      if(recording&&recording.sync)recording.sync();
      if(!button){if(menuOpen)renderMenuStatus();return;}
      var botId=activeBotId();
      if(botId!==lastBotId){lastBotId=botId;selectionVersion++;if(menuOpen)closeMenu(false);}
      var hidden=!botId||!options.getView||options.getView()!=='chat'||!options.getBotMode||options.getBotMode()==='space';
      var available=pluginApiAvailable()||options.bridge&&((typeof options.bridge.appObservationStatus==='function'&&typeof options.bridge.captureApp==='function'&&typeof options.bridge.readAppCapture==='function')||
        (recording&&typeof options.bridge.appRecordingStatus==='function'&&typeof options.bridge.startAppRecording==='function'));
      var pending=!!(botId&&options.isPending&&options.isPending(botId));
      if((hidden||pending)&&menuOpen)closeMenu(false);
      button.hidden=hidden;
      button.disabled=hidden||!available||inFlight||recordStartBusy||permissionsBusy||pending;
      button.setAttribute('aria-busy',String(inFlight||recordStartBusy||permissionsBusy));
      button.setAttribute('aria-expanded',String(menuOpen));
      button.title=available?tr('截图或录制界面','Capture or record the screen'):
        tr('界面截图与录制仅在桌面版可用','Screenshots and recordings are available in the desktop app');
      button.setAttribute('aria-label',button.title);
      if(menu)menu.hidden=!menuOpen;
      if(menuOpen)renderMenuStatus();
    }

    function loadCapture(botId,captureId){
      var key=captureKey(botId,captureId),cached=getCachedImage(key);
      if(cached)return Promise.resolve(cached);
      if(imageLoads.has(key))return imageLoads.get(key);
      if(!options.bridge||typeof options.bridge.readAppCapture!=='function')return Promise.reject(new Error(tr('桌面截图服务不可用','The desktop screenshot service is unavailable')));
      var promise=Promise.resolve().then(function(){return options.bridge.readAppCapture({botId:botId,captureId:captureId});}).then(function(result){
        if(!result||result.ok!==true||!isImageDataUrl(result.dataUrl))throw new Error((result&&result.message)||tr('无法读取这张界面截图','Could not read this screenshot'));
        cacheImage(key,result.dataUrl);
        return result.dataUrl;
      }).finally(function(){imageLoads.delete(key);});
      imageLoads.set(key,promise);
      return promise;
    }

    function updateThumbnail(buttonNode,dataUrl,error){
      if(!buttonNode||!buttonNode.isConnected)return;
      var image=buttonNode.querySelector('img'),copy=buttonNode.querySelector('.app-observation-thumb-copy');
      if(dataUrl&&image){image.src=dataUrl;image.hidden=false;if(copy)copy.hidden=true;buttonNode.removeAttribute('data-error');}
      else if(error&&copy){copy.textContent=tr('截图暂不可用','Screenshot unavailable');copy.hidden=false;buttonNode.dataset.error='true';}
    }

    function ensureDialog(){
      if(dialog)return;
      dialog=document.createElement('dialog');
      dialog.id='app-observation-viewer';
      dialog.className='app-observation-dialog';
      dialog.setAttribute('aria-labelledby','app-observation-dialog-title');
      var header=document.createElement('div');header.className='app-observation-dialog-header';
      dialogTitle=document.createElement('strong');dialogTitle.id='app-observation-dialog-title';
      var close=document.createElement('button');close.type='button';close.className='app-observation-dialog-close';
      close.setAttribute('aria-label',tr('关闭截图','Close screenshot'));close.title=close.getAttribute('aria-label');close.textContent='×';
      close.addEventListener('click',function(){if(dialog&&dialog.open)dialog.close();});
      header.appendChild(dialogTitle);header.appendChild(close);
      dialogImage=document.createElement('img');dialogImage.alt=tr('所附的界面截图','Attached screenshot');
      dialog.appendChild(header);dialog.appendChild(dialogImage);
      dialog.addEventListener('click',function(event){if(event.target===dialog)dialog.close();});
      document.body.appendChild(dialog);
    }

    function openImage(botId,metadata,buttonNode){
      var label=sourceLabel(metadata),image=getCachedImage(captureKey(botId,metadata.captureId));
      var promise=image?Promise.resolve(image):loadCapture(botId,metadata.captureId);
      promise.then(function(dataUrl){
        ensureDialog();
        dialogTitle.textContent=tr('界面截图','Screenshot')+' · '+label;
        dialogImage.alt=tr('所附的界面截图','Attached screenshot')+' · '+label;
        dialogImage.src=dataUrl;
        if(!dialog.open)dialog.showModal();
      }).catch(function(){updateThumbnail(buttonNode,null,true);});
    }

    function renderHistory(bot){
      if(recording&&recording.renderHistory)recording.renderHistory(bot);
      if(!bot||!Array.isArray(bot.messages))return;
      var container=document.getElementById('messages');
      if(!container)return;
      bot.messages.forEach(function(message,index){
        if(!message||message.role!=='user'||!validMetadata(message.appObservation))return;
        var bubble=container.querySelector('.msg.user[data-chat-index="'+index+'"]');
        if(!bubble||bubble.querySelector('.app-observation-attachment'))return;
        var metadata=message.appObservation,display=sourceLabel(metadata);
        var wrapper=document.createElement('div');wrapper.className='app-observation-attachment';
        var thumb=document.createElement('button');thumb.type='button';thumb.className='app-observation-thumb';
        thumb.setAttribute('aria-label',tr('查看所附的界面截图','View attached screenshot')+' · '+display);
        thumb.title=thumb.getAttribute('aria-label');
        var image=document.createElement('img');image.alt='';image.hidden=true;
        var copy=document.createElement('span');copy.className='app-observation-thumb-copy';
        copy.textContent=tr('正在读取界面截图…','Loading screenshot…');
        thumb.appendChild(image);thumb.appendChild(copy);
        thumb.addEventListener('click',function(){openImage(String(bot.id),metadata,thumb);});
        var caption=document.createElement('span');caption.className='app-observation-source-label';caption.textContent=display;
        wrapper.appendChild(thumb);wrapper.appendChild(caption);bubble.appendChild(wrapper);
        var cached=getCachedImage(captureKey(bot.id,metadata.captureId));
        if(cached)updateThumbnail(thumb,cached,false);
        else loadCapture(String(bot.id),metadata.captureId).then(function(dataUrl){updateThumbnail(thumb,dataUrl,false);})
          .catch(function(){updateThumbnail(thumb,null,true);});
      });
    }

    function statusEntry(status,source){
      if(!status||!Array.isArray(status.sources))return null;
      return status.sources.find(function(item){return item&&item.source===source;})||null;
    }
    function permissionState(status){
      var value=status&&status.screenPermission;
      var permissionStatus=value&&typeof value==='object'?String(value.status||value.state||value.authorizationStatus||'').toLowerCase():'';
      var required=value===false||!!(value&&typeof value==='object'&&
        (value.permissionRequired===true||value.required===true||value.granted===false||value.available===false||value.authorized===false));
      if(typeof value==='string'&&/denied|restricted|not.?determined|not.?granted|unknown|permission|required|权限|拒绝|未授权/i.test(value))required=true;
      if(/denied|restricted|not.?determined|not.?granted|unknown|unauthorized/.test(permissionStatus))required=true;
      return {required:required,message:value&&typeof value==='object'?safeText(value.message,300):''};
    }
    function sourceAvailable(status,source){
      if(pluginManaged()&&!pluginEnabled())return false;
      if(operation==='record'){
        var active=menuActiveRecording();
        return recordingReady(status,selectedAudioMode)&&!active&&!(options.isPending&&options.isPending(menuBotId||activeBotId()));
      }
      if(!status||status.supported!==true)return false;
      if(source==='app')return true;
      var entry=statusEntry(status,source);
      return !!(entry&&entry.available===true);
    }
    function sourceDescription(source,status,entry){
      if(operation==='record'){
        var active=menuActiveRecording(),permissions=recordingPermissions(status);
        if(active)return tr('已有录制正在进行；停止后才能开始下一段。','A recording is active. Stop it before starting another.');
        if(!status||status.supported!==true)return safeText(status&&status.message,300)||tr('此 Bot 暂不支持应用录制。','App recording is not supported for this Bot.');
        if(!permissions.screen)return safeText(status.screenPermission&&status.screenPermission.message,220)||tr('需要屏幕录制权限。','Screen Recording permission is required.');
        if(selectedAudioMode!=='system'&&!permissions.microphone)return safeText(status.microphonePermission&&status.microphonePermission.message,220)||tr('所选音频模式需要麦克风权限。','The selected audio mode needs Microphone permission.');
        var audioCopy=selectedAudioMode==='system'?tr('仅系统声音，不请求麦克风权限。','System audio only; no microphone permission is requested.'):tr('系统声音和麦克风。','System audio and microphone.');
        if(source==='app')return tr('录制 Bot Studio 当前窗口；','Record the current Bot Studio window; ')+audioCopy;
        if(source==='application')return tr('选择一个应用窗口；','Choose an application window; ')+audioCopy;
        return tr('录制鼠标所在显示器；','Record the display under your pointer; ')+audioCopy;
      }
      var permission=permissionState(status),entryMessage=entry&&safeText(entry.message,300);
      if(source==='app')return tr('截取 Bot Studio 当前窗口。','Capture the current Bot Studio window.');
      if(source==='application'){
        if(entry&&entry.available===true)return tr('选择一个应用窗口，再将截图和当前草稿一起发送。','Choose an application window to send with the current draft.');
        if(entry&&entry.permissionRequired===true)return entryMessage||permission.message||tr('需要屏幕录制权限。','Screen Recording permission is required.');
        return entryMessage||tr('应用窗口暂不可用。','Application windows are unavailable.');
      }
      if(entry&&entry.available===true)return tr('截取鼠标所在的显示器。','Capture the display under your pointer.');
      if(entry&&entry.permissionRequired===true)return entryMessage||permission.message||tr('需要屏幕录制权限。','Screen Recording permission is required.');
      if(permission.required)return permission.message||entryMessage||tr('需要屏幕录制权限。','Screen Recording permission is required.');
      return entryMessage||tr('当前屏幕暂不可用。','The current screen is unavailable.');
    }
    function renderMenuStatus(){
      if(!menu)return;
      applyOperationCopy();
      if(pluginManaged()){
        renderPluginUi();
        if(!pluginEnabled()||pluginView==='manage'||pluginStatusLoading||pluginStatusError){setMenuMessage('',false);return;}
      }
      var loading=statusBusy,recordMode=operation==='record',unsupported=!!(lastStatus&&lastStatus.supported===false),permission=permissionState(lastStatus),permissionMessage=permission.message;
      var permissions=recordingPermissions(lastStatus),active=recordMode&&menuActiveRecording();
      var anyPermission=recordMode?recordingPermissionNeeded(lastStatus,selectedAudioMode):permission.required;
      if(recordMode&&!permissions.screen&&selectedAudioMode!=='system'&&!permissions.microphone)permissionMessage=tr('录制需要屏幕录制权限和麦克风权限。','Recording requires Screen Recording and Microphone permissions.');
      else if(recordMode&&!permissions.screen&&!permissionMessage)permissionMessage=safeText(lastStatus&&lastStatus.screenPermission&&lastStatus.screenPermission.message,300);
      else if(recordMode&&selectedAudioMode!=='system'&&!permissions.microphone&&!permissionMessage)permissionMessage=safeText(lastStatus&&lastStatus.microphonePermission&&lastStatus.microphonePermission.message,300);
      sourceButtons.forEach(function(sourceButton){
        var source=sourceButton.dataset.observationSource,entry=statusEntry(lastStatus,source);
        var isAvailable=sourceAvailable(lastStatus,source);
        if(operation==='capture'&&source==='app'&&!lastStatus&&statusError&&!loading)isAvailable=true;
        if(entry&&entry.permissionRequired===true){anyPermission=true;if(!permissionMessage)permissionMessage=safeText(entry.message,300);}
        var title=source==='application'?tr('选择应用窗口','Choose an application window'):sourceTitle(source),titleNode=sourceButton.querySelector('[data-source-title]'),descNode=sourceButton.querySelector('[data-source-description]');
        if(titleNode)titleNode.textContent=title;
        if(descNode){
          if(loading)descNode.textContent=tr('正在检查此来源…','Checking this source…');
          else if(operation==='capture'&&source==='app'&&!lastStatus&&statusError)descNode.textContent=tr('状态暂不可用，可重试当前 Bot Studio 截图。','Source status is unavailable. You can still try an Bot Studio screenshot.');
          else descNode.textContent=sourceDescription(source,lastStatus,entry);
        }
        sourceButton.disabled=loading||inFlight||recordStartBusy||permissionsBusy||unsupported||!!active||!isAvailable||!!(options.isPending&&options.isPending(menuBotId||activeBotId()));
        sourceButton.setAttribute('aria-disabled',String(sourceButton.disabled));
      });
      if(permissionsButton){
        permissionsButton.hidden=!anyPermission||unsupported;
        permissionsButton.disabled=loading||permissionsBusy||!options.bridge||typeof options.bridge[recordMode?'openAppRecordingPermissions':'openAppCapturePermissions']!=='function';
        permissionsButton.textContent=recordMode&&selectedAudioMode!=='system'?tr('设置屏幕录制与麦克风权限','Set Screen Recording and Microphone permissions'):tr('设置屏幕录制权限','Set Screen Recording permission');
      }
      if(loading){setMenuMessage(recordMode?tr('正在检查录制权限与来源…','Checking recording permissions and sources…'):tr('正在检查可用的截图来源…','Checking available screenshot sources…'),false);return;}
      if(statusError){setMenuMessage(statusError,true);return;}
      if(unsupported){setMenuMessage(safeText(lastStatus.message,300)||(recordMode?tr('此 Bot 暂不支持应用录制。','App recording is not supported for this Bot.'):tr('此 Bot 暂不支持截图。','This Bot cannot capture screenshots.')),true);return;}
      if(active){setMenuMessage(tr('正在由另一段录制占用来源。请先停止当前录制。','A recording is already using the sources. Stop it first.'),false);return;}
      if(anyPermission){setMenuMessage(permissionMessage||(recordMode?tr('录制需要屏幕录制权限和麦克风权限。','Recording requires Screen Recording and Microphone permissions.'):tr('需要屏幕录制权限才能使用受影响的截图来源。','Screen Recording permission is required for the affected sources.')),true);return;}
      if(recordMode&&lastStatus&&lastStatus.available===false){setMenuMessage(safeText(lastStatus.message,300)||tr('应用录制当前不可用。','App recording is currently unavailable.'),true);return;}
      setMenuMessage('',false);
    }

    function setApplicationMessage(message,isError){
      if(!applicationStatus)return;
      applicationStatus.textContent=message||'';
      applicationStatus.hidden=!message;
      applicationStatus.dataset.error=isError?'true':'false';
    }
    function renderApplicationTargets(){
      if(!applicationTargets)return;
      applicationTargets.replaceChildren();
      if(applicationListBusy){
        setApplicationMessage(tr('正在读取应用窗口…','Loading application windows…'),false);
      }else if(applicationListError){
        setApplicationMessage(applicationListError,true);
      }else if(!applicationList.length){
        setApplicationMessage(tr('没有可用的应用窗口。','No application windows are available.'),false);
      }else{
        setApplicationMessage('',false);
      }
      if(applicationRefreshButton)applicationRefreshButton.disabled=applicationListBusy||permissionsBusy||!!(options.isPending&&options.isPending(menuBotId||activeBotId()));
      applicationList.forEach(function(target){
        var row=document.createElement('button');row.type='button';row.className='app-observation-application-target';
        row.dataset.observationTarget=target.targetId;
        var name=document.createElement('strong');name.textContent=target.name||target.windowTitle||tr('未命名应用','Unnamed application');
        var title=document.createElement('small');title.textContent=target.windowTitle||tr('窗口标题不可用','Window title unavailable');
        row.appendChild(name);row.appendChild(title);
        row.setAttribute('aria-label',[target.name,target.windowTitle].filter(Boolean).join(' · ')||tr('未命名应用窗口','Unnamed application window'));
        row.addEventListener('click',function(){
          var targetName=target.name;
          if(target.windowTitle&&target.windowTitle.toLocaleLowerCase()!==String(targetName||'').toLocaleLowerCase())targetName=targetName?targetName+' — '+target.windowTitle:target.windowTitle;
          runSourceAction('application',target.targetId,targetName);
        });
        applicationTargets.appendChild(row);
      });
    }
    function applicationRequestCurrent(botId,version,epoch,request){
      return menuOpen&&applicationPickerOpen&&menuEpoch===epoch&&applicationEpoch===request&&currentSelection(botId,version)&&
        !(options.isPending&&options.isPending(botId));
    }
    async function refreshApplications(moveFocusOnResult){
      if(!menuOpen||!applicationPickerOpen)return;
      var botId=menuBotId||activeBotId(),version=selectionVersion,epoch=menuEpoch,request=++applicationEpoch;
      if(!botId)return;
      var focusedTarget=applicationTargets&&applicationTargets.contains(document.activeElement);
      var shouldMoveFocus=!!moveFocusOnResult&&(document.activeElement===applicationRefreshButton||document.activeElement===applicationBackButton||!!focusedTarget);
      if(shouldMoveFocus&&applicationBackButton&&document.activeElement!==applicationBackButton)applicationBackButton.focus({preventScroll:true});
      applicationListBusy=true;applicationListError='';applicationList=[];renderApplicationTargets();
      try{
        if(!options.bridge||typeof options.bridge.listAppCaptureTargets!=='function')throw new Error(tr('应用窗口列表服务不可用。','The application window list is unavailable.'));
        var result=await options.bridge.listAppCaptureTargets({botId:botId});
        if(!applicationRequestCurrent(botId,version,epoch,request))return;
        if(!result||result.ok!==true)throw new Error((result&&result.message)||tr('无法读取应用窗口列表。','Could not read the application window list.'));
        applicationList=(Array.isArray(result.applications)?result.applications:[]).filter(function(target){
          return target&&/^[a-f0-9]{32}$/i.test(String(target.targetId||''))&&(typeof target.name==='string'||typeof target.windowTitle==='string');
        }).map(function(target){return {targetId:String(target.targetId),name:safeText(target.name,140),windowTitle:safeText(target.windowTitle,220)};});
      }catch(error){
        if(!applicationRequestCurrent(botId,version,epoch,request))return;
        applicationListError=String(error&&error.message||error||tr('无法读取应用窗口列表。','Could not read the application window list.'));
      }finally{
        if(applicationRequestCurrent(botId,version,epoch,request)){
          applicationListBusy=false;renderApplicationTargets();
          if(shouldMoveFocus&&document.activeElement===applicationBackButton){var first=applicationTargets&&applicationTargets.querySelector('.app-observation-application-target');if(first)first.focus({preventScroll:true});}
        }else if(menuOpen&&applicationPickerOpen&&menuEpoch===epoch&&currentSelection(botId,version)&&options.isPending&&options.isPending(botId)){
          closeMenu(false);sync();
        }
      }
    }
    function openApplicationPicker(){
      if(!menuOpen||!sourceAvailable(lastStatus,'application')||applicationPickerOpen)return;
      applicationPickerOpen=true;applicationEpoch++;applicationList=[];applicationListError='';applicationListBusy=false;
      if(sourceList)sourceList.hidden=true;
      if(applicationPane)applicationPane.hidden=false;
      if(applicationBackButton)applicationBackButton.focus({preventScroll:true});
      refreshApplications(true);
    }
    function returnToSources(){
      if(!applicationPickerOpen)return;
      applicationEpoch++;applicationPickerOpen=false;applicationListBusy=false;applicationList=[];applicationListError='';
      if(applicationPane)applicationPane.hidden=true;
      if(sourceList)sourceList.hidden=false;
      var applicationButton=sourceButtons.find(function(item){return item.dataset.observationSource==='application';});
      if(applicationButton&&!applicationButton.disabled)applicationButton.focus({preventScroll:true});
    }

    async function loadMenuStatus(botId,version,epoch){
      var requestedMode=operation,request=++statusRequestEpoch;
      statusBusy=true;statusError='';lastStatus=null;renderMenuStatus();
      try{
        var result=requestedMode==='record'&&recording?await recording.refresh(botId):await options.bridge.appObservationStatus({botId:botId});
        if(request!==statusRequestEpoch||operation!==requestedMode||!currentSelection(botId,version)||!menuOpen||menuEpoch!==epoch)return;
        if(!result||result.ok===false)throw new Error((result&&result.message)||tr('无法读取截图来源状态。','Could not read screenshot source status.'));
        lastStatus=result;
      }catch(error){
        if(request!==statusRequestEpoch||operation!==requestedMode||!currentSelection(botId,version)||!menuOpen||menuEpoch!==epoch)return;
        statusError=String(error&&error.message||error||tr('无法读取截图来源状态。','Could not read screenshot source status.'));
      }finally{
        if(request===statusRequestEpoch&&operation===requestedMode&&currentSelection(botId,version)&&menuOpen&&menuEpoch===epoch){statusBusy=false;renderMenuStatus();}
      }
    }

    function openMenu(initialMode){
      sync();
      if(!button||button.disabled||button.hidden||!menu)return Promise.resolve(false);
      if(menuOpen){if(initialMode==='record')switchOperation('record',true);return Promise.resolve(true);}
      var botId=activeBotId();
      if(!botId)return Promise.resolve(false);
      operation=initialMode==='record'?'record':'capture';statusRequestEpoch++;applyOperationCopy();
      menuOpen=true;menuBotId=botId;menuEpoch++;var epoch=menuEpoch;button.setAttribute('aria-expanded','true');menu.hidden=false;
      lastStatus=null;statusError='';statusBusy=true;pluginView='flow';pluginStatusError='';pluginStatusLoading=false;
      if(pluginManaged()){pluginStatus=null;ensurePluginUi();}
      renderMenuStatus();sync();
      var version=selectionVersion;
      var load=pluginManaged()?refreshPluginStatus(false):loadMenuStatus(botId,version,epoch);
      return load.then(function(){
        if(!menuOpen||!currentSelection(botId,version)||menuEpoch!==epoch)return;
        if(document.activeElement===button){if(pluginManaged())focusPluginPrimary();else{var first=sourceButtons.find(function(item){return !item.disabled;});if(first)first.focus({preventScroll:true});}}
        return true;
      });
    }

    function openRecordingMenu(){
      sync();
      if(menuOpen){switchOperation('record',true);return Promise.resolve(true);}
      if(!button||!menu)return Promise.resolve(false);
      if(button.hidden){
        var chatTab=document.querySelector('.view-tab[data-view="chat"]');
        if(!chatTab||chatTab.classList.contains('active'))return Promise.resolve(false);
        chatTab.click();
        return new Promise(function(resolve){setTimeout(function(){
          sync();
          if(!button||button.hidden||button.disabled){resolve(false);return;}
          button.focus({preventScroll:true});
          openMenu('record').then(resolve);
        },0);});
      }
      if(button.disabled)return Promise.resolve(false);
      button.focus({preventScroll:true});
      return openMenu('record');
    }

    function switchOperation(next,focus){
      if(next!=='capture'&&next!=='record')return;
      if(operation===next){if(focus){var selected=modeButtons.find(function(item){return item.dataset.observationMode===next;});if(selected)selected.focus({preventScroll:true});}return;}
      operation=next;statusRequestEpoch++;lastStatus=null;statusError='';statusBusy=true;
      if(applicationPickerOpen){applicationPickerOpen=false;applicationEpoch++;applicationListBusy=false;applicationList=[];applicationListError='';if(applicationPane)applicationPane.hidden=true;if(sourceList)sourceList.hidden=false;}
      renderMenuStatus();
      if(focus){var selected=modeButtons.find(function(item){return item.dataset.observationMode===next;});if(selected)selected.focus({preventScroll:true});}
      var botId=menuBotId||activeBotId(),version=selectionVersion,epoch=menuEpoch;
      if(botId)loadMenuStatus(botId,version,epoch);
    }

    function menuOptionFor(source){
      var entry=statusEntry(lastStatus,source);
      var targetName=entry&&safeText(entry.targetName,120)||'';
      return {source:source,targetName:targetName};
    }
    function waitTwoFrames(){
      return new Promise(function(resolve){requestAnimationFrame(function(){requestAnimationFrame(resolve);});});
    }

    async function captureAndSend(source,targetId,selectedTargetName){
      sync();
      if(!button||button.disabled||inFlight||sources.indexOf(source)<0||(pluginManaged()&&!pluginEnabled()))return;
      if(source==='application'&&!/^[a-f0-9]{32}$/i.test(String(targetId||'')))return;
      var botId=activeBotId();
      if(!botId)return;
      var version=selectionVersion,draft=String(input&&input.value||''),selection=menuOptionFor(source),lease=null,messageAccepted=false;
      if(selectedTargetName)selection.targetName=safeText(selectedTargetName,220);
      closeMenu(false);
      inFlight=true;showFeedback(tr('正在截取所选界面…','Capturing the selected screen…'),false);sync();
      try{
        await waitTwoFrames();
        if(!currentSelection(botId,version))throw new Error(tr('Bot 已切换，本次没有发送消息；草稿已保留。','The Bot changed, so no message was sent. Your draft was kept.'));
        if(options.isPending&&options.isPending(botId))throw new Error(tr('当前 Bot 已开始处理任务，本次没有发送；草稿已保留。','This Bot started processing a turn, so nothing was sent. Your draft was kept.'));
        var captureRequest={botId:botId,source:source};
        if(source==='application')captureRequest.targetId=String(targetId);
        var result=await options.bridge.captureApp(captureRequest);
        if(!result||result.ok!==true)throw new Error((result&&result.message)||tr('截取失败，请检查屏幕录制权限后重试。','Capture failed. Check Screen Recording permission and try again.'));
        if(!validMetadata(result))throw new Error(tr('截图服务返回了无效结果，未发送消息。','The screenshot service returned invalid data. No message was sent.'));
        if(!currentSelection(botId,version))throw new Error(tr('Bot 已切换，本次没有发送消息；草稿已保留。','The Bot changed, so no message was sent. Your draft was kept.'));
        if(options.isPending&&options.isPending(botId))throw new Error(tr('当前 Bot 已开始处理任务，本次没有发送；草稿已保留。','This Bot started processing a turn, so nothing was sent. Your draft was kept.'));
        if(!options.composerReady||!options.composerReady(botId)||String(input&&input.value||'')!==draft){
          throw new Error(tr('草稿已变化，本次没有发送；当前草稿已保留。请重新选择截图来源。','The draft changed, so nothing was sent. Your current draft was kept. Choose a screenshot source again.'));
        }
        lease=options.takeComposer&&options.takeComposer(botId);
        if(!lease||String(lease.snapshot&&lease.snapshot.value||'')!==draft){
          if(lease&&options.restoreComposer)options.restoreComposer(lease);
          lease=null;
          throw new Error(tr('草稿状态已变化，本次没有发送；请重试。','The draft changed, so nothing was sent. Please try again.'));
        }
        var sourceValue=sources.indexOf(result.source)>=0?result.source:source;
        var metadata={captureId:String(result.captureId),at:Number(result.at),width:Number(result.width),height:Number(result.height),source:sourceValue,
          targetName:safeText(result.targetName,220)||selection.targetName};
        if(isImageDataUrl(result.dataUrl))cacheImage(captureKey(botId,metadata.captureId),result.dataUrl);
        var fallback=sourceValue==='application'?tr('帮我看看这个应用窗口','Please look at this application window'):
          sourceValue==='screen'?tr('帮我看看当前屏幕','Please look at the current screen'):tr('帮我看看当前 Bot Studio 界面','Please look at the current Bot Studio window');
        var text=draft.trim()?lease.snapshot.value:fallback;
        if(!options.send||!options.send(botId,text,lease,metadata)){
          if(options.restoreComposer)options.restoreComposer(lease);
          lease=null;
          showFeedback(tr('消息未能发送；草稿已保留，请重试。','The message could not be sent. Your draft was kept; try again.'),true);
          return;
        }
        messageAccepted=true;showFeedback('',false);
        if(currentSelection(botId,version)&&options.composerReady&&options.composerReady(botId)&&input)input.focus();
      }catch(error){
        if(lease&&!messageAccepted&&options.restoreComposer)options.restoreComposer(lease);
        showFeedback(String(error&&error.message||error||tr('截取失败，请重试。','Capture failed. Try again.')),true);
      }finally{
        inFlight=false;sync();
      }
    }

    async function startRecording(source,targetId,selectedTargetName){
      sync();
      if(!recording||recordStartBusy||inFlight||sources.indexOf(source)<0||(pluginManaged()&&!pluginEnabled()))return;
      if(source==='application'&&!/^[a-f0-9]{32}$/i.test(String(targetId||'')))return;
      var botId=menuBotId||activeBotId();if(!botId)return;
      var target=safeText(selectedTargetName,220),draft=String(input&&input.value||'');
      closeMenu(false);recordStartBusy=true;showFeedback('',false);sync();
      try{
        await recording.start(botId,source,targetId,target,draft,selectedAudioMode);
        showFeedback('',false);
        if(recording.focusStop)recording.focusStop();
      }catch(error){
        showFeedback(String(error&&error.message||error||tr('无法开始录制。','Could not start recording.')),true);
        if(button&&!button.disabled)button.focus({preventScroll:true});
      }finally{recordStartBusy=false;sync();}
    }
    function runSourceAction(source,targetId,selectedTargetName){
      if(operation==='record')return startRecording(source,targetId,selectedTargetName);
      return captureAndSend(source,targetId,selectedTargetName);
    }

    async function openPermissions(){
      if(!permissionsButton||permissionsButton.disabled||permissionsBusy||!menuOpen)return;
      var botId=menuBotId||activeBotId(),version=selectionVersion,epoch=menuEpoch;
      if(!botId)return;
      permissionsBusy=true;setMenuMessage(tr('正在打开屏幕录制权限设置…','Opening Screen Recording settings…'),false);sync();renderMenuStatus();
      var operationError='';
      try{
        var result=operation==='record'&&recording?await recording.openPermissions(botId,selectedAudioMode):await options.bridge.openAppCapturePermissions();
        if(!result||result.ok!==true)operationError=safeText(result&&result.message,300)||tr('无法打开屏幕录制权限设置。','Could not open Screen Recording settings.');
      }catch(error){operationError=String(error&&error.message||error||tr('无法打开屏幕录制权限设置。','Could not open Screen Recording settings.'));}
      finally{
        permissionsBusy=false;sync();
        if(currentSelection(botId,version)&&menuOpen&&menuEpoch===epoch){
          await loadMenuStatus(botId,version,epoch);
          if(operationError&&menuOpen&&currentSelection(botId,version)&&menuEpoch===epoch)setMenuMessage(operationError,true);
        }
      }
    }

    function menuCandidates(){
      if(pluginManaged()&&pluginPane&&!pluginPane.hidden)return Array.prototype.slice.call(pluginPane.querySelectorAll('button:not([hidden])'));
      if(applicationPickerOpen)return [applicationBackButton,applicationRefreshButton].filter(Boolean).concat(applicationTargets?Array.prototype.slice.call(applicationTargets.querySelectorAll('.app-observation-application-target')):[]);
      return (pluginManageRow&&!pluginManageRow.hidden?[pluginManageButton]:[]).concat(modeButtons,sourceButtons);
    }
    function focusOption(index){
      var candidates=menuCandidates();
      var enabled=candidates.filter(function(item){return !item.disabled;});
      if(!enabled.length)return;
      var active=enabled.indexOf(document.activeElement),next=index;
      if(next===null)next=active<0?0:(active+1)%enabled.length;
      if(next===-1)next=enabled.length-1;
      if(next>=enabled.length)next=0;
      enabled[next].focus({preventScroll:true});
    }

    function onMenuKeydown(event){
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeMenu(true);return;}
      if(!applicationPickerOpen&&event.target&&event.target.matches&&event.target.matches('[data-observation-mode]')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(event.key)>=0){
        event.preventDefault();switchOperation(operation==='capture'?'record':'capture',true);return;
      }
      if(event.key==='ArrowDown'){event.preventDefault();focusOption(null);return;}
      if(event.key==='ArrowUp'){
        event.preventDefault();
        var candidates=menuCandidates();
        var active=candidates.filter(function(item){return !item.disabled;}).indexOf(document.activeElement);
        focusOption(active<=0?-1:active-1);return;
      }
      if(event.key==='Home'){event.preventDefault();focusOption(0);return;}
      if(event.key==='End'){event.preventDefault();focusOption(-1);return;}
      if(event.key==='Tab')setTimeout(function(){if(menuOpen&&!menu.contains(document.activeElement)&&document.activeElement!==button)closeMenu(false);},0);
    }

    if(button)button.addEventListener('click',function(){if(menuOpen)closeMenu(false);else openMenu('capture');});
    if(menu){
      menu.addEventListener('keydown',onMenuKeydown);
      menu.addEventListener('focusout',function(){setTimeout(function(){if(menuOpen&&!menu.contains(document.activeElement)&&document.activeElement!==button)closeMenu(false);},0);});
      sourceButtons.forEach(function(item){item.addEventListener('click',function(){
        if(item.dataset.observationSource==='application')openApplicationPicker();
        else runSourceAction(item.dataset.observationSource);
      });});
      modeButtons.forEach(function(item){item.addEventListener('click',function(){switchOperation(item.dataset.observationMode,false);});});
    }
    if(menuCloseButton)menuCloseButton.addEventListener('click',function(){closeMenu(true);});
    if(permissionsButton)permissionsButton.addEventListener('click',openPermissions);
    if(applicationBackButton)applicationBackButton.addEventListener('click',returnToSources);
    if(applicationRefreshButton)applicationRefreshButton.addEventListener('click',function(){refreshApplications(true);});
    if(typeof document!=='undefined')document.addEventListener('pointerdown',function(event){
      if(menuOpen&&menu&&!menu.contains(event.target)&&button&&!button.contains(event.target))closeMenu(false);
    });
    sync();
    return Object.freeze({sync:sync,renderHistory:renderHistory,openRecordingMenu:openRecordingMenu});
  }

  return Object.freeze({create:create});
});
