(function(root){
  'use strict';
  function tr(zh,en){return root.OpenBotI18n?root.OpenBotI18n.t(zh,en):zh;}
  var settingsSection='general';
  var settingsTitles={general:tr('常规',"General"),model:tr('模型接入',"API connection"),apps:tr('应用连接',"App connections"),plugins:tr('插件与组件',"Plugins & components"),channels:tr('消息与设备',"Channels & devices"),data:tr('数据与同步',"Data and sync")};
  var sectionKeywords={general:'general appearance theme language preferences chat',model:'model models api provider connection',apps:'apps app application applications connections service agui codex account github gitlab notion obsidian drive netdisk gmail outlook calendar zoom linear jira figma todoist dropbox microsoft',plugins:'plugins plugin components dsh hub market office libreoffice algorithm superterminal magpie classifier skin theme pet mascot 皮肤 主题 桌宠 工坊',channels:'channels messaging telegram wechat weixin feishu dingtalk qq slack discord teams mobile voice hardware usb nas devices',data:'data sync storage spaces memory import export'};
  var channelAppIds={telegram:1,weixin:1,feishu:1,dingtalk:1,qq:1,slack:1,discord:1,teams:1};
  function isAppsSubTab(key){return key==='apps'||key==='plugins'||key==='channels';}
  function ensureAppsGroupTags(panel){
    if(!panel)panel=document.getElementById('set-panel-apps');
    if(!panel)return null;
    var hw=document.getElementById('apps-hardware');
    if(hw&&!hw.dataset.appsGroup)hw.dataset.appsGroup='channels';
    var swTitle=document.getElementById('apps-software-title');
    if(swTitle&&!swTitle.dataset.appsGroup)swTitle.dataset.appsGroup='channels';
    var skinMount=document.getElementById('skin-market-mount-point');
    if(skinMount&&!skinMount.dataset.appsGroup)skinMount.dataset.appsGroup='plugins';
    var grid=panel.querySelector('.apps-grid');
    if(grid){
      Array.from(grid.children).forEach(function(card){
        if(!card.dataset||card.dataset.appsGroup)return;
        var appId=card.dataset.app||'',cat=card.dataset.category||'';
        card.dataset.appsGroup=(channelAppIds[appId]||cat==='消息'||cat==='Messaging')?'channels':'apps';
      });
    }
    return panel;
  }
  function classifyGridCards(grid,current){
    if(!grid)return;
    Array.from(grid.children).forEach(function(card){
      if(!card.dataset)return;
      if(!card.dataset.appsGroup){
        var appId=card.dataset.app||'',cat=card.dataset.category||'';
        card.dataset.appsGroup=(channelAppIds[appId]||cat==='消息'||cat==='Messaging')?'channels':'apps';
      }
      card.hidden=card.dataset.appsGroup!==current;
    });
  }
  function syncAppsCategory(key){
    var current=key||settingsSection;
    var panel=ensureAppsGroupTags();
    if(!isAppsSubTab(current)||!panel)return;
    Array.from(panel.children).forEach(function(child){
      if(child.tagName==='DIALOG')return;
      if(child.classList&&child.classList.contains('apps-grid')){
        classifyGridCards(child,current);
        child.hidden=(current!=='apps'&&current!=='channels');
        return;
      }
      var grp=child.dataset&&child.dataset.appsGroup;
      if(!grp)return;
      if(child.dataset.appsUnavailable==='true'){child.hidden=true;return;}
      if(child.id==='apps-empty'){
        child.hidden=current!=='channels'||child.dataset.appsHasPrimary==='true';
        return;
      }
      child.hidden=grp!==current;
    });
  }
  function visible(el){return !!(el && el.getClientRects().length && (!el.checkVisibility || el.checkVisibility()));}
  function syncSearchClear(){
    var clear=document.getElementById('set-search-clear');
    var hasQuery=!!document.getElementById('set-search').value.trim();
    if(clear)clear.hidden=!hasQuery;
    var hint=document.getElementById('set-search-hint');
    if(hint)hint.hidden=!hasQuery;
  }
  function clearSearch(){
    settings(settingsSection);
    document.getElementById('set-search').focus();
  }
  function settings(section,focus){
    var key=Object.prototype.hasOwnProperty.call(settingsTitles,section)?section:'general';
    var history=document.getElementById('set-imported-history');
    if(key!=='data' && history)history.open=false;
    var changed=key!==settingsSection;settingsSection=key;
    document.getElementById('set-search').value='';
    syncSearchClear();
    document.getElementById('set-search-results').hidden=true;
    document.getElementById('set-page-title').textContent=settingsTitles[key];
    var activePanelId=isAppsSubTab(key)?'set-panel-apps':('set-panel-'+key);
    document.querySelectorAll('.settings-panel').forEach(function(panel){
      panel.hidden=panel.id!==activePanelId;
    });
    var appsPanel=document.getElementById('set-panel-apps');
    if(appsPanel&&isAppsSubTab(key)){
      appsPanel.setAttribute('aria-labelledby','set-tab-'+key);
      syncAppsCategory(key);
      if(key==='plugins'){
        if(root.OpenBotDesktopPlugins&&typeof root.OpenBotDesktopPlugins.readList==='function')root.OpenBotDesktopPlugins.readList().catch(function(){});
        if(root.OpenBotOfficeRuntime&&typeof root.OpenBotOfficeRuntime.refresh==='function')root.OpenBotOfficeRuntime.refresh();
      }
    }
    document.querySelectorAll('[data-settings-tab]').forEach(function(tab){
      var active=tab.dataset.settingsTab===key;
      tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
      if(active && focus)tab.focus();
    });
    document.getElementById('set-model-actions').hidden=key!=='model';
    document.getElementById('set-auto-note').hidden=key!=='general';
    document.getElementById('set-footer').hidden=key!=='model';
    if(changed)document.querySelector('.settings-panels').scrollTop=0;
    if(typeof root.CustomEvent==='function')document.dispatchEvent(new root.CustomEvent('openbot:settings-section-change',{detail:{section:key,searching:false}}));
  }
  function searchSettings(){
    var input=document.getElementById('set-search'),query=input.value.trim().toLocaleLowerCase();
    syncSearchClear();
    if(!query){settings(settingsSection);return;}
    var history=document.getElementById('set-imported-history');
    if(history)history.open=false;
    document.getElementById('set-page-title').textContent=tr('搜索结果',"Search results");
    if(typeof root.CustomEvent==='function')document.dispatchEvent(new root.CustomEvent('openbot:settings-section-change',{detail:{section:settingsSection,searching:true}}));
    document.querySelectorAll('.settings-panel').forEach(function(panel){panel.hidden=true;});
    document.getElementById('set-footer').hidden=true;
    var results=document.getElementById('set-search-results'),list=document.getElementById('set-search-list');
    results.hidden=false;list.replaceChildren();
    ensureAppsGroupTags();
    document.querySelectorAll('[data-setting]').forEach(function(row){
      var section=row.closest('.settings-panel').id.replace('set-panel-','');
      if(section==='apps'){
        var grpEl=row.closest('[data-apps-group]');
        if(grpEl&&grpEl.dataset.appsGroup&&settingsTitles[grpEl.dataset.appsGroup])section=grpEl.dataset.appsGroup;
        else if(row.closest('#apps-hardware'))section='channels';
      }
      var title=row.querySelector('.setting-copy > label,.setting-label,.preference-switch-title,.apps-name,.apps-card-name,.cfg-title,h3');
      var displayName=title?title.textContent.trim():(row.getAttribute('aria-label')||row.dataset.setting);
      var bilingualTitles=Array.from(row.querySelectorAll('[data-i18n-zh],[data-i18n-en]')).map(function(node){return (node.dataset.i18nZh||'')+' '+(node.dataset.i18nEn||'');}).join(' ');
      var text=[row.dataset.setting,row.dataset.settingKeywords||'',row.textContent,displayName,bilingualTitles,settingsTitles[section],sectionKeywords[section]].join(' ').toLocaleLowerCase();
      if(!query.split(/\s+/).every(function(term){return text.indexOf(term)>=0;}))return;
      var button=document.createElement('button');button.type='button';button.className='settings-search-result';
      var label=document.createElement('span');label.className='settings-search-result-label';label.textContent=displayName;
      var category=document.createElement('span');category.className='settings-result-category';category.textContent=settingsTitles[section];
      button.append(label,category);
      button.addEventListener('click',function(){
        settings(section);
        row.scrollIntoView({block:'center'});
        var control=document.getElementById(row.dataset.settingControl);
        if(control && !control.disabled)control.focus({preventScroll:true});
        else {row.tabIndex=-1;row.focus({preventScroll:true});}
      });
      list.appendChild(button);
    });
    var count=list.children.length;list.hidden=!count;
    document.getElementById('set-search-status').textContent=count?tr('找到 ',"Found ")+count+tr(' 项设置',count===1?' setting':' settings'):tr('没有找到相关设置，试试“聊天”“模型”或“宠物”。',"No settings found. Try “chat”, “model”, or “pet”.");
    document.querySelector('.settings-panels').scrollTop=0;
  }
  function taskOptions(){
    var count=document.querySelectorAll('#task-files input:checked').length;
    var named=!!document.getElementById('task-title').value.trim();
    document.getElementById('task-options-summary').textContent=[named?tr('已命名',"Named"):'',count?count+tr(' 个附件',count===1?' attachment':' attachments'):''].filter(Boolean).join(' · ')||tr('可选',"Optional");
  }
  function init(){
    document.querySelectorAll('[data-settings-icon]').forEach(function(el){el.innerHTML=root.OpenBotIcons.svg(el.dataset.settingsIcon);});
    var compact=root.matchMedia('(max-width:680px)');
    function orientSettings(){document.querySelector('.settings-tabs').setAttribute('aria-orientation',compact.matches?'horizontal':'vertical');}
    orientSettings();compact.addEventListener('change',orientSettings);
    var search=document.getElementById('set-search');
    search.addEventListener('input',searchSettings);
    var composing=false,mask=document.getElementById('set-mask');
    search.addEventListener('compositionstart',function(){composing=true;});
    search.addEventListener('compositionend',function(){composing=false;});
    search.addEventListener('blur',function(){composing=false;});
    function isComposing(e){return composing || e.isComposing || e.keyCode===229;}
    function plainKey(e){return !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey;}
    function resultButtons(){return Array.from(document.querySelectorAll('#set-search-list button')).filter(visible);}
    function settingsActive(){
      if(!visible(mask))return false;
      var dialogs=Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).filter(visible);
      return dialogs[dialogs.length-1]===mask.querySelector('.settings-modal');
    }
    var clear=document.getElementById('set-search-clear');
    if(clear)clear.addEventListener('click',clearSearch);
    mask.addEventListener('keydown',function(e){
      if(e.defaultPrevented || !settingsActive())return;
      // Do not let an IME cancellation close the containing dialog.
      if(isComposing(e)){if(e.key==='Escape')e.stopPropagation();return;}
      if(e.key==='Escape' && plainKey(e) && search.value){
        e.preventDefault();e.stopPropagation();clearSearch();return;
      }
      if(!plainKey(e))return;
      var buttons=resultButtons(),index=buttons.indexOf(e.target),next;
      if(e.target===search){
        if(e.key==='Enter' && buttons.length){e.preventDefault();buttons[0].click();return;}
        if(e.key==='ArrowDown')next=0;
        else if(e.key==='ArrowUp')next=buttons.length-1;
      }else if(index>=0){
        if(e.key==='ArrowDown')next=(index+1)%buttons.length;
        else if(e.key==='ArrowUp')next=(index+buttons.length-1)%buttons.length;
        else if(e.key==='Home')next=0;
        else if(e.key==='End')next=buttons.length-1;
      }
      if(next!==undefined && buttons[next]){e.preventDefault();buttons[next].focus();}
    });
    document.addEventListener('keydown',function(e){
      if(isComposing(e) || e.defaultPrevented || e.altKey || e.shiftKey || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase()!=='f' || !settingsActive())return;
      e.preventDefault();search.focus();search.select();
    },true);
    var tabs=Array.from(document.querySelectorAll('[data-settings-tab]'));
    tabs.forEach(function(tab,index){
      tab.addEventListener('click',function(){settings(tab.dataset.settingsTab);});
      tab.addEventListener('keydown',function(e){
        var next=index;
        if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(index+1)%tabs.length;
        else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(index+tabs.length-1)%tabs.length;
        else if(e.key==='Home')next=0;
        else if(e.key==='End')next=tabs.length-1;
        else return;
        e.preventDefault();settings(tabs[next].dataset.settingsTab,true);
      });
    });
    document.getElementById('task-title').addEventListener('input',taskOptions);
    document.getElementById('task-files').addEventListener('change',taskOptions);
    [
      ['apps-path-dsh-hub','plugins','dsh-hub-settings-section'],
      ['apps-path-office-runtime','plugins','office-runtime-section'],
      ['apps-path-algorithm-lab','plugins','algorithm-lab-section'],
      ['apps-path-channels','channels','apps-channels-heading']
    ].forEach(function(pair){
      var link=document.getElementById(pair[0]);
      if(!link)return;
      link.addEventListener('click',function(e){
        e.preventDefault();
        settings(pair[1]);
        var target=document.getElementById(pair[2]);
        if(!target)return;
        target.tabIndex=-1;
        target.scrollIntoView({block:'start'});
        var focusable=target.querySelector('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href]');
        (focusable||target).focus({preventScroll:true});
      });
    });
    var appsPanel=document.getElementById('set-panel-apps');
    if(appsPanel&&typeof root.MutationObserver==='function'){
      var appsObserver=new root.MutationObserver(function(){
        ensureAppsGroupTags(appsPanel);
        if(isAppsSubTab(settingsSection))syncAppsCategory(settingsSection);
      });
      appsObserver.observe(appsPanel,{childList:true});
      var appsGrid=appsPanel.querySelector('.apps-grid');
      if(appsGrid)appsObserver.observe(appsGrid,{childList:true});
    }
    document.addEventListener('keydown',function(e){
      if(e.key!=='Tab')return;
      var dialogs=Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).filter(visible);
      var dialog=dialogs[dialogs.length-1];if(!dialog)return;
      var controls=Array.from(dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], summary, [tabindex]')).filter(function(el){return el.tabIndex>=0 && visible(el);});
      if(!controls.length){e.preventDefault();return;}
      var first=controls[0],last=controls[controls.length-1],active=document.activeElement;
      if(!dialog.contains(active) || (e.shiftKey && active===first) || (!e.shiftKey && active===last)){
        e.preventDefault();(e.shiftKey?last:first).focus();
      }
    });
  }
  root.OpenBotDialogs={init:init,settings:settings,getSection:function(){return settingsSection;},taskOptions:taskOptions,syncAppsCategory:syncAppsCategory};
})(window);
