(function(global){
  'use strict';
  function mount(options){
    var root=options.root,bridge=options.bridge,tr=options.tr;
    var current=null, visible=false, generation=0, report='', busy=false;
    function element(tag,text){
      var n=document.createElement(tag); if(text!==undefined)n.textContent=text; return n;
    }
    function button(text,id,action){
      var b=element('button',text); b.type='button'; b.className='btn'; b.id=id; b.addEventListener('click',action); return b;
    }
    var workflows=element('section'), skills=element('section'), files=element('section'), localTool=element('section');
    var status=element('p',''), output=element('pre',''), skillList=element('ul');
    status.setAttribute('role','status');
    status.className='cfg-note'; output.className='bot-workbench-output'; output.hidden=true;
    var summarize=button(tr('生成工作摘要','Generate work summary'),'workbench-generate-summary',async function(){
      if(!current||!visible||busy||typeof bridge?.botWorkbenchSummary!=='function')return;
      var id=current.id, epoch=generation; busy=true; summarize.setAttribute('aria-disabled','true'); status.textContent='';
      try{
        var result=await bridge.botWorkbenchSummary(id);
        if(!visible||epoch!==generation||current?.id!==id)return;
        if(result?.ok!==true||result.result?.bot?.id!==id||typeof result.result?.markdown!=='string')throw new Error();
        report=result.result.markdown; output.textContent=report; output.hidden=false; copy.hidden=false;
        status.textContent=tr('已生成工作摘要。','Work summary ready.');
      }catch(_){
        if(visible&&epoch===generation)status.textContent=tr('无法生成工作摘要，请重试。','Could not generate the summary. Try again.');
      }finally{
        if(epoch===generation){busy=false;summarize.setAttribute('aria-disabled','false');}
      }
    });
    var copy=button(tr('复制摘要','Copy summary'),'workbench-copy-summary',async function(){
      if(!report||!visible)return;
      var epoch=generation;
      try{
        await navigator.clipboard.writeText(report);
        if(epoch===generation)status.textContent=tr('已复制摘要。','Summary copied.');
      }catch(_){
        if(epoch===generation)status.textContent=tr('复制不可用，可手动选取摘要。','Clipboard unavailable. You can select the summary text.');
      }
    });
    copy.hidden=true;
    var modeText=element('p',''), revoke=button(tr('恢复问我','Return to Ask me'),'workbench-revoke-observe',async function(){
      if(!current||!visible||!grant)return;
      var id=current.id, epoch=generation, previous=grant.id;
      revoke.disabled=true;
      try{
        var result=await bridge.workstationObservationMode({botId:id,mode:'ask',expectedGrantId:previous});
        if(epoch!==generation||!visible)return;
        if(result?.ok!==true||result.botId!==id)throw new Error();
        showMode(null); status.textContent=tr('已撤销工作站观察授权。','Workstation observation authorization revoked.');
      }catch(_){
        if(epoch===generation){status.textContent=tr('授权未更新，请重新打开工作台核对。','Authorization was not changed. Reopen the workbench to check.');revoke.disabled=false;}
      }
    });
    var permission=element('section'), grant=null, permissionRead=0, permissionTimer;
    modeText.className='cfg-note';
    function showMode(next){
      clearTimeout(permissionTimer);
      grant=next||null; revoke.hidden=!grant; revoke.disabled=false;
      modeText.textContent=grant
        ? (grant.needsReauthorization
          ? tr('范围或审核设置已变更，需要重新授权。','Scope or reviewer settings changed. Authorize again.')
          : (grant.mode==='autonomous'?tr('范围内自主','Autonomous within scope'):tr('Auto · HarvisBrain','Auto · HarvisBrain'))+' · '+grant.window+' · '+new Date(grant.expiresAt).toLocaleTimeString())
        : tr('问我。可从只读观察审批卡授予指定窗口 30 分钟。','Ask me. Grant 30 minutes for a specific window from its observation request.');
      if(grant)permissionTimer=setTimeout(refreshObservationPermission,Math.max(25,grant.expiresAt-Date.now()+25));
    }
    function refreshObservationPermission(botId){
      if(!visible||permission.hidden||!current||(botId&&botId!==current.id))return;
      var id=current.id, epoch=generation, read=++permissionRead;
      function isCurrent(){return visible&&epoch===generation&&read===permissionRead&&current?.id===id;}
      function unavailable(){
        if(!isCurrent())return;
        showMode(null);modeText.textContent=tr('无法核对授权状态。','Could not verify authorization.');
      }
      bridge.workstationObservationMode({botId:id}).then(function(r){
        if(!isCurrent())return;
        if(r?.ok===true&&r.botId===id)showMode(r.grant);
        else unavailable();
      }).catch(unavailable);
    }
    var unsubscribePermission=bridge?.onWorkstationObservationModeChanged?.(event=>refreshObservationPermission(event?.botId));
    var unsubscribeConfig=bridge?.onConfigChanged?.(()=>refreshObservationPermission());
    var unsubscribeState=bridge?.onStateChanged?.(()=>refreshObservationPermission());
    permission.append(element('h3',tr('工作站观察权限','Workstation observation')),modeText,revoke);
    var acceptance=element('section'), select=element('select'), acceptanceStatus=element('p'), acceptanceHelp=element('p');
    var acceptanceRevision=null, acceptanceMode='off';
    var acceptanceLabel=element('label',tr('主动验收','Active acceptance'));
    select.id='workbench-active-acceptance';select.className='t';acceptanceLabel.htmlFor=select.id;
    acceptanceHelp.id='workbench-active-acceptance-help';acceptanceHelp.className='cfg-note';
    acceptanceHelp.textContent=tr('派单时可写验收标准。自动返工只用于本机文字任务，最多两次。','Add a check when delegating a task. Automatic repair is limited to two attempts on local text tasks.');
    select.setAttribute('aria-describedby',acceptanceHelp.id);
    acceptanceStatus.className='cfg-note';acceptanceStatus.setAttribute('role','status');
    [['off',tr('关闭','Off')],['feedback',tr('验收并给意见','Review and give feedback')],['repair',tr('验收并自动返工','Review and repair')]].forEach(function(pair){
      var option=element('option',pair[1]);option.value=pair[0];select.append(option);
    });
    acceptance.append(acceptanceLabel,select,acceptanceHelp,acceptanceStatus);
    async function acceptanceSetting(mode){
      if(!visible||!current||acceptance.hidden)return;
      var id=current.id,epoch=generation;
      select.disabled=true;
      if(mode!==undefined)acceptanceStatus.textContent='';
      try{
        var result=await bridge.botActiveAcceptance({botId:id,...(mode===undefined?{}:{mode:mode,expectedRevision:acceptanceRevision})});
        if(!visible||epoch!==generation||current?.id!==id)return;
        if(!result?.ok)throw new Error();
        acceptanceMode=result.mode;acceptanceRevision=result.revision;select.value=result.mode;
        if(mode!==undefined)acceptanceStatus.textContent=tr('已保存。','Saved.');
      }catch(_){
        if(visible&&epoch===generation){select.value=acceptanceMode;acceptanceStatus.textContent=tr('无法保存或读取设置，请重新打开工作台。','Could not load or save this setting. Reopen Workbench.');}
      }finally{if(visible&&epoch===generation)select.disabled=acceptanceRevision===null;}
    }
    select.addEventListener('change',function(){acceptanceSetting(select.value);});
    var saved=element('details'), savedList=element('ul'), savedPreview=element('pre'), savedStatus=element('p');
    savedPreview.className='bot-workbench-output';savedPreview.hidden=true;
    savedStatus.className='cfg-note';savedStatus.setAttribute('role','status');
    saved.append(element('summary',tr('已保存的交付草稿','Saved delivery drafts')),
      element('p',tr('试跑会重新执行一次并把结果留在本机。定时交付需要另行设置。','A trial runs the task again and saves the result locally. Scheduling is separate.')),
      savedList,savedStatus,savedPreview);
    var draftRead=0;
    saved.addEventListener('toggle',async function(){
      if(!saved.open||!visible||!current)return;
      var id=current.id,epoch=generation,read=++draftRead;
      var isCurrent=function(){return visible&&saved.open&&generation===epoch&&current?.id===id&&read===draftRead;};
      savedList.replaceChildren();savedPreview.hidden=true;savedPreview.textContent='';savedStatus.textContent='';
      try{
        var result=await bridge.botWorkbenchDeliveryDrafts({botId:id});
        if(!isCurrent())return;
        if(!result?.ok)throw new Error();
        if(!result.items.length)savedStatus.textContent=tr('还没有保存的交付草稿。','No saved delivery drafts yet.');
        result.items.forEach(function(row){
          var item=element('li',row.title+' ');
          var trial=element('button',row.canTrial?tr('试跑','Run trial'):tr('查看草稿','View draft'));
          var taskId=null, running=false, status=element('span');var requestId=null;
          var update=function(info){
            taskId=info?.taskId||null;running=info?.status==='running';
            trial.disabled=running||info?.status==='unknown';
            status.textContent=info?.status==='running'?tr('正在试跑','Trial running')
              :info?.status==='completed'?tr('试跑完成 · ','Trial complete · ')+info.file
              :info?.status==='failed'?tr('试跑未完成','Trial did not complete')
              :info?.status==='unknown'?tr('试跑结果待核对','Trial result needs verification'):'';
          };
          update(row.trial);
          var refresh=async function(){
            if(!isCurrent()||!taskId)return;
            var result=await bridge.botWorkbenchDeliveryDrafts({botId:id,workflowId:row.workflowId,action:'status'}).catch(function(){return null;});
            if(isCurrent()&&result?.ok){update(result.trial);if(!running&&result.trial?.status!=='unknown')requestId=null;}
          };
          item.refreshTrial=function(update){if(update?.task?.id===taskId)refresh();};
          trial.type='button';trial.className='mini';trial.addEventListener('click',async function(){
            if(!isCurrent()||trial.disabled)return;
            trial.disabled=true;
            try{
              if(!row.canTrial){
                var preview=await bridge.botWorkbenchDeliveryDrafts({botId:id,workflowId:row.workflowId});
                if(!isCurrent())return;
                if(!preview?.ok)throw new Error();
                savedPreview.hidden=false;savedPreview.textContent=preview.preview;return;
              }
              requestId=requestId||crypto.randomUUID();
              var result=await bridge.botWorkbenchDeliveryDrafts({botId:id,workflowId:row.workflowId,action:'trial',
                expectedRevision:row.revision,requestId:requestId});
              if(!isCurrent())return;
              if(!result?.ok){
                if(result?.acceptance?.status==='acceptance-unknown'){update({status:'unknown'});return;}
                throw new Error(result?.message);
              }
              update(result.trial);await refresh();
            }catch(error){if(isCurrent())savedStatus.textContent=error.message||tr('操作未确认，请核对任务。','Check the task to confirm the result.');}
            finally{if(isCurrent()&&!running&&status.textContent!==tr('试跑结果待核对','Trial result needs verification'))trial.disabled=false;}
          });
          item.append(trial,' ',status);savedList.append(item);
        });
      }catch(_){if(isCurrent())savedStatus.textContent=tr('无法读取交付草稿。','Could not load delivery drafts.');}
    });
    var unsubscribeTask=bridge?.onTaskUpdate?.(event=>{for(var item of savedList.children)item.refreshTrial?.(event);});
    workflows.append(element('h3',tr('工作流','Workflows')),summarize,copy,output,saved);
    workflows.append(acceptance);
    skills.append(element('h3',tr('技能卡','Skill cards')),skillList,button(tr('管理技能','Manage skills'),'workbench-manage-skills',options.openSkills));
    files.append(element('h3',tr('资料','Resources')),button(tr('查看文件','View files'),'workbench-view-files',options.openFiles));
    var toolView=null,toolSeq=0,toolBusy=false,toolNote=element('p',''); toolNote.className='cfg-note';
    var toolBind=button(tr('固定入口','Pin entry'),'workbench-local-tool-pin',function(){updateTool(toolView?.bound?'pin':'bind');});
    var toolRead=button(tr('读取状态','Read status'),'workbench-local-tool-read',function(){updateTool('read');});
    var toolUnpin=button(tr('移除按钮','Remove button'),'workbench-local-tool-unpin',function(){updateTool('unpin');});
    var toolUnbind=button(tr('解除绑定','Unbind'),'workbench-local-tool-unbind',function(){updateTool('unbind');});
    function renderTool(){
      toolBind.hidden=!toolView||!!toolView.pinned; toolBind.disabled=toolBusy||!toolView?.ready;
      toolRead.hidden=!toolView?.pinned; toolRead.disabled=toolBusy||!toolView?.ready;
      toolUnpin.hidden=!toolView?.pinned; toolUnpin.disabled=toolBusy;
      toolUnbind.hidden=!toolView?.bound; toolUnbind.disabled=toolBusy;
      toolNote.textContent=!toolView?tr('正在检查插件状态。','Checking plugin status.'):
        !toolView.ready?tr('请在设置中安装并启用 Algorithm Lab。','Install and enable Algorithm Lab in Settings.'):
        toolView.bound&&!toolView.pinned?tr('仍绑定。解除绑定后，此工作台将无法读取插件状态。','Still bound. Unbind to remove access from this workbench.'):
        tr('Algorithm Lab · 只读状态','Algorithm Lab · Read-only status');
    }
    async function updateTool(action){
      if(!current||!visible||localTool.hidden||(action!=='list'&&(!toolView||toolBusy)))return;
      if(action==='list'&&toolBusy)return;
      var id=current.id,epoch=generation,seq=++toolSeq;
      if(action!=='list'){toolBusy=true;renderTool();}
      try{
        var reply=await bridge.botWorkbenchLocalTool({botId:id,action,...(action==='list'?{}:{expectedRevision:toolView.revision})});
        if(!visible||epoch!==generation||seq!==toolSeq||current?.id!==id)return;
        if(reply?.ok!==true||reply.botId!==id){
          if(action==='list')localTool.hidden=true;
          else status.textContent=reply?.message||tr('工作台工具未完成操作。','The workbench tool action did not complete.');
          return;
        }
        toolView=reply;
        if(action==='read'){
          var modules=Array.isArray(reply.result?.modules)?reply.result.modules.length:null;
          status.textContent=tr('Algorithm Lab ','Algorithm Lab ')+reply.version+
            (modules===null?'':tr(' · 模块数：',' · Modules: ')+modules)+
            (reply.result?.hasBenchmark?(reply.result.allParityPassed?tr(' · 上次验证通过',' · Last validation passed'):tr(' · 上次验证未通过',' · Last validation failed')):'');
        }
        if(action==='unpin')status.textContent=tr('已移除按钮，插件仍绑定。','Button removed. The plugin is still bound.');
        if(action==='unbind')status.textContent=tr('此 Bot 的工作台已解除绑定。','Unbound from this Bot’s workbench.');
      }catch(_){
        if(visible&&epoch===generation&&seq===toolSeq)status.textContent=tr('无法核对工作台工具状态。','Could not verify the workbench tool.');
      }finally{
        if(epoch===generation&&seq===toolSeq){toolBusy=false;renderTool();}
      }
    }
    localTool.append(element('h3',tr('本地工具','Local tool')),toolNote,toolBind,toolRead,toolUnpin,toolUnbind);
    localTool.hidden=true;renderTool();
    var stopToolUpdates=bridge?.onDesktopPluginChanged?.(function(){if(visible&&current&&!localTool.hidden)updateTool('list');});
    root.append(workflows,skills,files,permission,localTool,status);
    function refresh(bot,isVisible){
      var changed=current?.id!==bot?.id||visible!==!!isVisible;
      current=bot;visible=!!isVisible;root.hidden=!visible;
      if(changed){
        clearTimeout(permissionTimer);permissionRead++;
        generation++;report='';busy=false;grant=null;status.textContent='';output.textContent='';output.hidden=true;copy.hidden=true;
        toolView=null;toolBusy=false;toolSeq++;renderTool();
        summarize.setAttribute('aria-disabled','false');
        draftRead++;saved.open=false;savedList.replaceChildren();savedStatus.textContent='';savedPreview.textContent='';savedPreview.hidden=true;
      }
      if(!visible||!bot)return;
      acceptance.hidden=typeof bridge?.botActiveAcceptance!=='function';
      if(changed&&!acceptance.hidden){acceptanceRevision=null;acceptanceMode='off';select.value='off';acceptanceStatus.textContent='';acceptanceSetting();}
      summarize.disabled=typeof bridge?.botWorkbenchSummary!=='function';
      saved.hidden=typeof bridge?.botWorkbenchDeliveryDrafts!=='function'||!!bot.agent?.id||['node','remote'].includes(bot.executionLocation);
      skillList.replaceChildren();
      var list=Array.isArray(bot.skills)?bot.skills.filter(x=>typeof x?.name==='string'):[];
      if(!list.length)skillList.append(element('li',tr('尚无技能卡','No skill cards yet')));
      list.slice(0,8).forEach(function(skill){skillList.append(element('li',skill.name));});
      if(list.length>8)skillList.append(element('li',tr('在技能管理中查看其余项目','See the rest in Manage skills')));
      if(changed){
        localTool.hidden=['node','remote'].includes(bot.executionLocation)||typeof bridge?.botWorkbenchLocalTool!=='function';
        if(!localTool.hidden)updateTool('list');
      }
      permission.hidden=bot.executionLocation!=='node'||typeof bridge?.workstationObservationMode!=='function';
      if(changed&&!permission.hidden){showMode(null);refreshObservationPermission();}
    }
    return {render:refresh,destroy:function(){
      generation++;visible=false;clearTimeout(permissionTimer);unsubscribeTask?.();unsubscribePermission?.();unsubscribeConfig?.();unsubscribeState?.();stopToolUpdates?.();root.replaceChildren();
    }};
  }
  global.OpenBotBotWorkbenchPane=Object.freeze({mount:mount});
})(window);
