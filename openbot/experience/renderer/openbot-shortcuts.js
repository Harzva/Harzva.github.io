(function(global){
  'use strict';
  function mount(options){
    var root=options.root,bridge=options.bridge,tr=options.tr||function(zh){return zh;},toast=options.toast||function(){};
    var openFeature=typeof options.openFeature==='function'?options.openFeature:null;
    var bot=null,scopeKey='',generation=0,revision=-1,requestedRevision=-1,items=[],features=[],disposed=false,busy=false,restoreKey=null,pending=0,loadSequence=0;
    function node(tag,text,cls){var el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
    function button(text,key,action){var el=node('button',text);el.type='button';el.dataset.shortcutKey=key;el.addEventListener('click',action);return el;}
    var heading=node('div',undefined,'bot-shortcut-heading');
    var title=node('h3',tr('固定快捷方式','Pinned shortcuts'));
    var controls=node('div',undefined,'bot-shortcut-controls');
    var addFile=button(tr('文件','File'),'add-file',function(){invoke('addBotShortcutFiles',{},'add-file');});
    var addUrl=button(tr('网页','Web link'),'add-url',function(){showForm('url',null,'add-url');});
    var addFeature=button(tr('功能','Feature'),'add-feature',function(){showForm('feature',null,'add-feature');});
    var formId=(root.id||'bot-shortcuts')+'-edit';
    addFeature.setAttribute('aria-controls',formId);
    addFeature.setAttribute('aria-expanded','false');
    addFeature.hidden=true;
    controls.append(addFile,addUrl,addFeature);heading.append(title,controls);
    var list=node('ul',undefined,'bot-shortcut-list'),formRoot=node('div',undefined,'bot-shortcut-form-root');
    formRoot.id=formId;
    var expanded=false, more=button(tr('全部快捷方式','All shortcuts'),'all',function(){
      expanded=!expanded;draw();
    });
    more.className='bot-shortcut-action';
    more.setAttribute('aria-expanded','false');
    var status=node('p','', 'bot-shortcut-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    root.classList.add('bot-shortcuts');root.append(heading,list,more,formRoot,status);
    function isCurrent(id,gen){return !disposed&&bot&&bot.id===id&&generation===gen;}
    function setBusy(value){busy=value;root.setAttribute('aria-busy',String(value));addFile.disabled=value||revision<0;addUrl.disabled=value||revision<0;addFeature.disabled=value||revision<0;}
    function begin(){pending++;setBusy(true);}
    function end(){pending=Math.max(0,pending-1);setBusy(pending>0);}
    function focusKey(key){if(!key)return;var el=Array.from(root.querySelectorAll('[data-shortcut-key]')).find(function(row){return row.dataset.shortcutKey===key;});if(el)el.focus({preventScroll:true});}
    function setStatus(text){status.textContent=text||'';}
    function fail(error){var message=error&&error.message||tr('操作未完成，请重试','Could not complete this action. Try again.');setStatus(message);toast(message);}
    function unpinnedFeatures(){
      return features.filter(function(feature){return !items.some(function(item){return item.kind==='feature'&&item.target===feature.id;});});
    }
    function draw(){
      var focused=root.contains(document.activeElement)?document.activeElement.dataset.shortcutKey:null;
      list.replaceChildren();
      addFeature.hidden=!openFeature||!bridge||typeof bridge.addBotShortcutFeature!=='function'||!unpinnedFeatures().length;
      more.hidden=items.length<=3;
      more.setAttribute('aria-expanded',String(expanded));
      more.textContent=expanded?tr('收起快捷方式','Show fewer shortcuts'):tr('全部快捷方式','All shortcuts')+' ('+items.length+')';
      if(!items.length){var empty=node('li',addFeature.hidden?tr('将常用文件、HTML 控制台或网页固定在这里。','Pin frequently used files, HTML consoles or web pages here.'):tr('将常用功能、文件或网页固定在这里。','Pin frequently used features, files or web pages here.'),'bot-shortcut-empty');list.append(empty);}
      (expanded?items:items.slice(0,3)).forEach(function(item,index){
        var row=node('li',undefined,'bot-shortcut-row');
        var open=button('', 'open:'+item.id,function(){invoke('openBotShortcut',{id:item.id},'open:'+item.id);});open.className='bot-shortcut-open';open.title=item.kind==='feature'?item.label:item.target;
        var kind=node('span',item.kind==='feature'?tr('功能','APP'):item.kind==='url'?tr('网页','WEB'):/\.html?$/i.test(item.target)?'HTML':tr('文件','FILE'),'bot-shortcut-kind');kind.setAttribute('aria-hidden','true');
        if(item.kind==='feature'&&item.target==='feishu-customer-service'){
          kind=node('img',undefined,'ob-feishu-shortcut-mark');
          kind.src='assets/app-logos/feishu.png';kind.alt='';kind.width=16;kind.height=16;
        }
        var label=node('span',item.label,'bot-shortcut-label');open.append(kind,label);
        var edit=button(tr('改名','Rename'),'rename:'+item.id,function(){showForm('rename',item,'rename:'+item.id);});edit.className='bot-shortcut-action';edit.setAttribute('aria-label',tr('改名：','Rename: ')+item.label);
        var remove=button('×','remove:'+item.id,function(){invoke('removeBotShortcut',{id:item.id},'add-file');});remove.className='bot-shortcut-action';remove.title=tr('移除快捷方式','Remove shortcut');remove.setAttribute('aria-label',tr('移除快捷方式：','Remove shortcut: ')+item.label);
        row.append(open);
        if((expanded||items.length<=3)&&items.length>1&&bridge&&typeof bridge.moveBotShortcut==='function'){
          var move=function(direction){
            var key='move:'+direction+':'+item.id;
            var control=button(direction<0?'↑':'↓',key,function(){invoke('moveBotShortcut',{id:item.id,direction:direction},key);});
            control.className='bot-shortcut-action';
            control.disabled=index+direction<0||index+direction>=items.length;
            control.setAttribute('aria-label',(direction<0?tr('上移：','Move up: '):tr('下移：','Move down: '))+item.label);
            return control;
          };
          row.append(move(-1),move(1));
        }
        row.append(edit,remove);list.append(row);
      });
      focusKey(focused);
    }
    function closeForm(key){formRoot.replaceChildren();addFeature.setAttribute('aria-expanded','false');focusKey(key||restoreKey);restoreKey=null;}
    function showForm(next,item,key){
      if(busy||!bot)return;
      var choices=next==='feature'?unpinnedFeatures():[];
      if(next==='feature'&&!choices.length)return;
      restoreKey=key;formRoot.replaceChildren();
      addFeature.setAttribute('aria-expanded',String(next==='feature'));
      var form=node('form',undefined,'bot-shortcut-form'),nameLabel=node('label',tr('名称','Name')),name=node('input');
      var title=next==='feature'?tr('固定功能','Pin a feature'):next==='url'?tr('固定网页','Pin a web link'):tr('改名快捷方式','Rename shortcut');
      form.setAttribute('aria-label',title);
      name.id=formId+'-label';name.name='label';nameLabel.htmlFor=name.id;
      name.type='text';name.maxLength=80;name.value=item?item.label:'';name.placeholder=next==='url'?tr('可选，默认使用网址','Optional; defaults to the URL'):'';
      name.required=next==='rename';nameLabel.append(name);
      var url=null,featureInput=null;
      if(next==='url'){var urlLabel=node('label',tr('网页地址','Web address'));url=node('input');url.type='url';url.id=formId+'-url';url.name='url';urlLabel.htmlFor=url.id;url.required=true;url.maxLength=4096;url.placeholder='https://…';url.autocomplete='url';url.spellcheck=false;urlLabel.append(url);form.append(urlLabel);}
      if(next==='feature'){
        featureInput=node('select');
        featureInput.id=formId+'-feature';featureInput.name='feature';featureInput.required=true;
        var featureLabel=node('label',tr('要固定的功能','Feature to pin'));
        featureLabel.htmlFor=featureInput.id;
        choices.forEach(function(feature){var option=node('option',feature.label);option.value=feature.id;featureInput.append(option);});
        featureLabel.append(featureInput);
        form.append(featureLabel);
      }else form.append(nameLabel);
      var actions=node('div',undefined,'bot-shortcut-form-actions'),save=node('button',next==='feature'?tr('固定','Pin'):tr('保存','Save')),cancel=button(tr('取消','Cancel'),'form-cancel',function(){closeForm();});save.type='submit';actions.append(cancel,save);form.append(actions);
      form.addEventListener('keydown',function(event){if(event.key==='Escape'&&!event.isComposing){event.preventDefault();closeForm();}});
      form.addEventListener('submit',function(event){
        event.preventDefault();if(busy||!form.reportValidity())return;
        if(featureInput){invoke('addBotShortcutFeature',{featureId:featureInput.value,
          ...(typeof scopeKey==='string'&&scopeKey?{featureScope:scopeKey}:{})},key,true);return;}
        var data=next==='url'?{url:url.value.trim(),...(name.value.trim()?{label:name.value.trim()}:{})}:{id:item.id,label:name.value.trim()};
        invoke(next==='url'?'addBotShortcutUrl':'renameBotShortcut',data,key,true);
      });
      formRoot.append(form);(featureInput||url||name).focus();
    }
    async function load(id,gen){
      if(!bridge){items=[];features=[];revision=-1;setBusy(false);draw();setStatus('');root.hidden=true;return;}
      var sequence=++loadSequence;begin();setStatus(tr('正在读取…','Loading…'));
      try{var result=await bridge.listBotShortcuts({botId:id});if(!isCurrent(id,gen)||sequence!==loadSequence)return;if(!result||!result.ok||result.botId!==id)throw new Error(result&&result.message||tr('快捷方式读取失败','Could not load shortcuts'));if(result.revision>=revision){revision=result.revision;items=result.items||[];features=Array.isArray(result.features)?result.features:[];draw();}setStatus('');}
      catch(error){if(isCurrent(id,gen)&&sequence===loadSequence){revision=-1;fail(error);var retry=button(tr('重试','Retry'),'retry',function(){load(id,gen);});status.append(' ',retry);}}
      finally{if(isCurrent(id,gen))end();}
    }
    async function invoke(method,data,key,closeOnSuccess){
      if(busy||!bot||revision<0)return;var id=bot.id,gen=generation,expected=revision;begin();setStatus('');
      try{var result=await bridge[method]({botId:id,expectedRevision:expected,...data});if(!isCurrent(id,gen))return;if(!result||!result.ok)throw Object.assign(new Error(result&&result.message||tr('操作未完成','Action did not complete')),{code:result&&result.code});
        if(result.botId&&result.botId!==id)throw new Error(tr('快捷方式归属已变化','Shortcut owner changed'));
        if(Array.isArray(result.items)&&result.revision>=revision){items=result.items;revision=result.revision;requestedRevision=revision;draw();}
        if(method==='openBotShortcut'&&result.kind==='feature'){
          if(!openFeature||typeof result.featureId!=='string')throw new Error(tr('功能入口不可用','This feature is unavailable'));
          await openFeature(result.featureId,id);
          return;
        }
        if(method==='addBotShortcutFeature'&&closeOnSuccess){
          var pinned=items.find(function(item){return item.kind==='feature'&&item.target===data.featureId;});
          if(pinned&&items.indexOf(pinned)>=3&&!expanded){expanded=true;draw();}
          closeForm(pinned?'open:'+pinned.id:key);
          return;
        }
        if(closeOnSuccess)closeForm();if(!result.canceled)focusKey(key);
      }catch(error){if(isCurrent(id,gen)){fail(error);if(error.code==='STALE_REVISION'||error.code==='BOT_SHORTCUTS_SCOPE_CHANGED'){requestedRevision=-1;await load(id,gen);}}}
      finally{if(isCurrent(id,gen))end();}
    }
    return {
      render:function(next,nextScope){
        if(disposed)return;var nextId=next&&next.id,changed=!bot||bot.id!==nextId||scopeKey!==nextScope;bot=next||null;scopeKey=nextScope;root.hidden=!bot;
        if(!bot){generation++;revision=-1;items=[];features=[];closeForm();list.replaceChildren();return;}
        if(changed){generation++;expanded=false;pending=0;revision=-1;requestedRevision=-1;setBusy(false);items=[];features=[];restoreKey=null;closeForm();draw();}
        var value=Number.isSafeInteger(bot.pinnedShortcutsRevision)?bot.pinnedShortcutsRevision:0;
        if(changed||value!==requestedRevision){requestedRevision=value;load(bot.id,generation);}
      },
      refresh:function(){if(bot&&!disposed)return load(bot.id,generation);},
      destroy:function(){disposed=true;generation++;root.replaceChildren();}
    };
  }
  global.OpenBotShortcuts=Object.freeze({mount:mount});
})(window);
