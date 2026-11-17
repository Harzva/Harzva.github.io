(function(root){
  'use strict';
  function tr(zh,en){return root.OpenBotI18n?root.OpenBotI18n.t(zh,en):zh;}
  var sessions=Object.create(null);
  function captureFocus(panel,control){
    if(!control||!panel.contains(control)||!control.id||!/^[A-Za-z][A-Za-z0-9_-]*$/.test(control.id)||
      !/^(INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY)$/.test(control.tagName)||control.type==='password')return null;
    return {id:control.id,tagName:control.tagName,type:control.type,value:control.value,
      checked:/^(checkbox|radio)$/.test(control.type)?control.checked:undefined,
      start:control.selectionStart,end:control.selectionEnd,direction:control.selectionDirection,scrollTop:control.scrollTop};
  }
  function capture(panel){
    if(!panel||!panel.dataset.inspectorBot)return;
    var state=sessions[panel.dataset.inspectorBot]||(sessions[panel.dataset.inspectorBot]={sections:Object.create(null),scroll:0});
    panel.querySelectorAll('[data-inspector-section]').forEach(function(el){state.sections[el.dataset.inspectorSection]=el.open;});
    var advancedBody=panel.querySelector('#inspector-advanced'),advancedToggle=panel.querySelector('#inspector-advanced-toggle');
    if(advancedBody&&advancedToggle)state.advanced=advancedBody.hidden===false&&advancedToggle.getAttribute('aria-expanded')==='true';
    state.scroll=panel.scrollTop;
    var label=panel.querySelector('#cfg-tag-label'),type=panel.querySelector('#cfg-tag-type'),feedback=panel.querySelector('#cfg-tag-status');
    if(label&&type)state.tagDraft={label:label.value,type:type.value,message:feedback?feedback.textContent:''};
    var focused=document.activeElement;
    return {botId:panel.dataset.inspectorBot,focus:captureFocus(panel,focused),tagFocus:focused===label||focused===type?{
      id:focused.id,start:focused.selectionStart,end:focused.selectionEnd,direction:focused.selectionDirection
    }:null};
  }
  function mount(panel,bot,status,connection,previous){
    panel.dataset.inspectorBot=bot.id;
    var state=sessions[bot.id]||(sessions[bot.id]={sections:Object.create(null),scroll:0});
    panel.querySelectorAll('details[data-inspector-section]').forEach(function(details){
      var key=details.dataset.inspectorSection;
      details.open=state.sections[key]===true;
      details.addEventListener('toggle',function(){state.sections[key]=details.open;});
    });
    function wrap(nodes,key,label,preview){
      nodes=nodes.filter(Boolean);if(!nodes.length)return;
      var details=document.createElement('details');details.className='inspector-disclosure';details.id='inspector-'+key;details.dataset.inspectorSection=key;
      details.open=state.sections[key]===true;
      var summary=document.createElement('summary');summary.id='inspector-'+key+'-toggle';
      if(preview){var mark=document.createElement('span');mark.className='inspector-preview';mark.innerHTML=preview;summary.appendChild(mark);}
      var title=document.createElement('span');title.className='inspector-title';title.textContent=label;summary.appendChild(title);
      if(key==='screen'||key==='connection'){var detail=document.createElement('span');detail.className='inspector-screen-status';detail.textContent=key==='screen'?status:connection;summary.appendChild(detail);}
      if(key==='tools'){
        var tools=panel.querySelector('#cfg-tools-enabled'),enabled=document.createElement('span');enabled.className='inspector-summary-state';summary.appendChild(enabled);
        function updateTools(){enabled.textContent=tools.checked?tr('已启用',"Enabled"):tr('未启用',"Disabled");}
        updateTools();tools.addEventListener('change',updateTools);
      }
      details.appendChild(summary);nodes[0].before(details);
      var content=document.createElement('div');content.className='inspector-content';details.appendChild(content);nodes.forEach(function(n){content.appendChild(n);});
      details.addEventListener('toggle',function(){state.sections[key]=details.open;});
    }
    var picker=panel.querySelector('.avatar-picker'),colors=panel.querySelector('.swatches');
    wrap([colors&&colors.closest('.cfg-row'),picker&&picker.closest('.cfg-row')],'appearance',tr('形象与颜色',"Avatar and color"),root.OpenBotAvatars.markup(bot.avatar,bot.color,{size:'mini'}));
    wrap([panel.querySelector('.screen-workspace')],'screen',tr('浏览器屏幕',"Browser screen"));
    var connectionNodes=Array.from(panel.querySelectorAll(':scope > .cfg-section')).filter(function(section){var title=section.querySelector('.cfg-title');return title&&[tr('模型接入',"API connection"),tr('API 配置',"API connection")].indexOf(title.textContent)>=0;});
    wrap(connectionNodes,'connection',tr('连接设置',"Connection settings"));
    var name=panel.querySelector('#cfg-name'),basic=name&&name.closest('.cfg-section'),heading=basic&&basic.querySelector('.cfg-title');if(heading)heading.hidden=true;
    var persona=panel.querySelector('#cfg-persona'),personaTitle=persona&&persona.closest('.cfg-section').querySelector('.cfg-title');if(personaTitle)personaTitle.textContent=tr('说话方式与边界',"Voice and boundaries");
    // Group by stable controls so translated headings never change behavior.
    var groups=[['#cfg-tools-enabled','tools',tr('工具与权限','Tools and permissions')],['#cfg-temp','generation',tr('生成参数','Generation settings')],['.ch-row','channels',tr('消息渠道','Messaging channels')],['#btn-del','danger',tr('删除机器人','Delete Bot')]];
    groups.forEach(function(group){
      var control=panel.querySelector(group[0]),section=control&&control.closest('.cfg-section');if(!section)return;
      var title=section.querySelector('.cfg-title');if(title)title.remove();wrap([section],group[1],group[2]);
    });
    var screen=panel.querySelector('#inspector-screen'),generation=panel.querySelector('#inspector-generation');
    if(screen && generation)generation.after(screen);
    var advancedNodes=[
      panel.querySelector('#inspector-tags'),
      panel.querySelector('#inspector-connection'),
      panel.querySelector('#inspector-tools'),
      panel.querySelector('#cfg-transport')&&panel.querySelector('#cfg-transport').closest('.cfg-section'),
      panel.querySelector('#cfg-persona')&&panel.querySelector('#cfg-persona').closest('.cfg-section'),
      panel.querySelector('#inspector-generation'),
      panel.querySelector('#inspector-screen'),
      panel.querySelector('#inspector-channels'),
      panel.querySelector('#inspector-danger')
    ].filter(function(node,index,nodes){return node&&nodes.indexOf(node)===index;});
    var advancedShell=document.createElement('section');advancedShell.className='inspector-advanced';
    var advancedToggle=document.createElement('button');advancedToggle.type='button';advancedToggle.className='inspector-advanced-toggle';advancedToggle.id='inspector-advanced-toggle';advancedToggle.setAttribute('aria-expanded',state.advanced===true?'true':'false');advancedToggle.setAttribute('aria-controls','inspector-advanced');advancedToggle.textContent=tr('高级设置',"Advanced");
    var advancedBody=document.createElement('div');advancedBody.id='inspector-advanced';advancedBody.className='inspector-advanced-body';advancedBody.setAttribute('role','region');advancedBody.setAttribute('aria-labelledby','inspector-advanced-toggle');advancedBody.hidden=state.advanced!==true;
    advancedNodes.forEach(function(node){advancedBody.appendChild(node);});
    advancedShell.appendChild(advancedToggle);advancedShell.appendChild(advancedBody);panel.appendChild(advancedShell);
    advancedToggle.addEventListener('click',function(){
      var expanded=advancedBody.hidden;
      if(!expanded&&advancedBody.contains(document.activeElement))advancedToggle.focus();
      state.advanced=expanded;
      advancedBody.hidden=!expanded;
      advancedToggle.setAttribute('aria-expanded',expanded?'true':'false');
    });
    var header=document.createElement('div');header.className='inspector-header';
    var headerCopy=document.createElement('div');headerCopy.className='inspector-header-copy';
    var heading=document.createElement('h3');heading.className='inspector-heading';heading.textContent=tr('Bot 设置',"Bot settings");
    var targetName=String(bot.name||bot.id||tr('未命名 Bot',"Untitled Bot"));
    var target=document.createElement('span');target.className='inspector-target-name';target.dataset.inspectorBotName=bot.id;target.textContent=targetName;target.title=targetName;
    headerCopy.appendChild(heading);headerCopy.appendChild(target);
    var close=document.createElement('button');close.type='button';close.id='inspector-close';close.className='inspector-close';
    close.textContent=tr('关闭',"Close");close.setAttribute('aria-label',tr('关闭 Bot 设置',"Close Bot settings"));close.title=tr('关闭 Bot 设置',"Close Bot settings");
    close.addEventListener('click',function(){var toggle=document.getElementById('toggle-config');if(toggle)toggle.click();});
    header.appendChild(headerCopy);header.appendChild(close);
    var scopeNote=document.createElement('p');scopeNote.className='inspector-scope-note';scopeNote.textContent=tr('类修改应用于当前个人 Bot 和以后新建实例；已有空间实例独立保存。',"Class changes apply to the current personal Bot and future instances; existing space instances are stored independently.");
    panel.prepend(scopeNote);panel.prepend(header);
    panel.scrollTop=state.scroll;
    var label=panel.querySelector('#cfg-tag-label'),type=panel.querySelector('#cfg-tag-type'),feedback=panel.querySelector('#cfg-tag-status');
    if(state.tagDraft&&label&&type){
      label.value=state.tagDraft.label;
      type.value=['role','style','skill','custom'].includes(state.tagDraft.type)?state.tagDraft.type:'role';
      if(feedback){feedback.textContent=state.tagDraft.message||'';feedback.hidden=!feedback.textContent;feedback.classList.toggle('error',Boolean(feedback.textContent));}
      if(state.tagDraft.message)label.setAttribute('aria-invalid','true');
    }
    var focus=previous&&previous.botId===bot.id&&(previous.focus||previous.tagFocus);
    var control=focus&&panel.querySelector('#'+focus.id);
    var active=document.activeElement;
    var unchanged=control&&(!focus.tagName||focus.tagName===control.tagName&&focus.type===control.type)&&
      (focus.value===undefined||focus.value===control.value)&&(focus.checked===undefined||focus.checked===control.checked);
    if(unchanged&&!control.disabled&&control.getClientRects().length&&(!control.checkVisibility||control.checkVisibility())&&
      (!active||active===document.body||panel.contains(active))){
      control.focus({preventScroll:true});
      if(typeof focus.start==='number'&&typeof control.setSelectionRange==='function')control.setSelectionRange(focus.start,focus.end,focus.direction);
      if(typeof focus.scrollTop==='number')control.scrollTop=focus.scrollTop;
    }
  }
  function updateScreen(panel,status){var node=panel&&panel.querySelector('#inspector-screen .inspector-screen-status');if(node)node.textContent=status;}
  function reveal(control){
    if(!control)return;
    var panel=control.closest&&control.closest('#config-panel'),advancedBody=panel&&panel.querySelector('#inspector-advanced'),advancedToggle=panel&&panel.querySelector('#inspector-advanced-toggle');
    if(advancedBody&&advancedToggle&&advancedBody.contains(control)){
      advancedBody.hidden=false;
      advancedToggle.setAttribute('aria-expanded','true');
      var state=panel.dataset.inspectorBot&&(sessions[panel.dataset.inspectorBot]||(sessions[panel.dataset.inspectorBot]={sections:Object.create(null),scroll:0}));
      if(state)state.advanced=true;
    }
    for(var parent=control.parentElement;parent;parent=parent.parentElement){if(parent.tagName==='DETAILS')parent.open=true;}
    control.focus();
  }
  root.OpenBotInspector={capture:capture,mount:mount,updateScreen:updateScreen,reveal:reveal};
})(window);
