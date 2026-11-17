(function(root){
 'use strict';
 var ctx=null,data=null,selected='',busy=false,preview=null,poll=null,serial=0;
 function text(tag,value,cls){var n=document.createElement(tag);n.textContent=value||'';if(cls)n.className=cls;return n;}
 function button(label,fn,primary){var b=text('button',label,primary?'ob-market-primary':'');b.type='button';b.disabled=busy;b.addEventListener('click',fn);return b;}
 function size(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';}
 function active(){return ctx&&ctx.isActive();}
 async function request(p){var r=await p;if(!r||!r.ok)throw Error(r&&r.message||'游戏市场请求失败');return r.data;}
 async function refresh(){var id=++serial;try{var d=await request(ctx.api.gameMarketList());if(id!==serial)return;data=d;if(active())render();}catch(e){if(active())ctx.message(e.message,true);}}
 async function operate(fn){if(busy)return;busy=true;render();try{await fn();await refresh();}catch(e){if(active())ctx.message(e.message,true);}finally{busy=false;if(active())render();}}
 function stopPoll(){if(poll)clearInterval(poll);poll=null;}
 function watch(){stopPoll();poll=setInterval(async function(){if(!preview||preview.status!=='running'||!active()){stopPoll();return;}try{preview=await request(ctx.api.gameMarketView({runId:preview.id}));if(active())render();}catch(e){stopPoll();if(active())ctx.message(e.message,true);}},600);}
 async function play(game){
  if(busy)return;busy=true;
  try{preview=await request(ctx.api.gameMarketStart({gameId:game.id}));preview.status='running';render();watch();preview=await request(ctx.api.gameMarketPlay({runId:preview.id}));}
  catch(e){if(active())ctx.message(e.message,true);}
  finally{busy=false;stopPoll();if(active())render();}
 }
 function render(){
  if(!active())return;
  var list=ctx.list,detail=ctx.detail;list.replaceChildren();detail.replaceChildren();
  if(!data){list.append(text('p','正在读取游戏目录…','ob-market-note'));return;}
  var query=ctx.search.value.trim().toLowerCase();
  var rows=data.games.filter(function(g){return [g.name,g.id].join(' ').toLowerCase().includes(query);});
  if(!rows.some(function(g){return g.id===selected;}))selected=rows[0]&&rows[0].id||'';
  rows.forEach(function(g){
   var row=button('',function(){selected=g.id;render();});row.className='ob-market-row';row.dataset.gameId=g.id;row.setAttribute('aria-current',String(g.id===selected));
   var icon=document.createElement('img');icon.src='../vendor/game-market/'+g.icon;icon.alt='';icon.width=32;icon.height=32;
   row.append(icon,text('strong',g.name),text('span',g.state==='installed'?'已安装 · '+size(g.installed.diskBytes):g.state==='damaged'?'文件损坏':'未下载 · '+size(g.downloadBytes)));list.append(row);
  });
  if(!rows.length){list.append(text('p','没有找到匹配的游戏。','ob-market-note'));return;}
  var g=rows.find(function(g){return g.id===selected;});
  detail.append(text('h3',g.name),text('p',g.seats.min===g.seats.max?g.seats.min+' 人':g.seats.min+'–'+g.seats.max+' 人'),text('p','下载 '+size(g.downloadBytes)+' · 安装文件约 '+size(g.installedBytes)+' · 版本 '+g.version,'ob-market-note'));
  detail.append(text('p','下载后保存到本机，占用本机存储。卸载删除游戏文件，保留试玩记录。','ob-market-note'));
  if(g.error)detail.append(text('p',g.error,'ob-market-note'));
  var actions=document.createElement('div');actions.className='ob-market-toolbar';
  if(g.state==='available')actions.append(button('下载到本机',function(){ctx.message('正在校验并安装 '+g.name+'…',false);operate(async function(){await request(ctx.api.gameMarketInstall({gameId:g.id}));ctx.message(g.name+' 已安装到本机。',false);});},true));
  if(g.state==='installed'){
   actions.append(button('规则试玩',function(){play(g);},true));
   actions.append(button('卸载游戏',function(){operate(async function(){await request(ctx.api.gameMarketUninstall({gameId:g.id}));if(preview&&preview.gameId===g.id)preview=null;ctx.message('游戏文件已卸载，试玩记录保留。',false);});}));
   detail.append(text('p','本机占用 '+size(g.installed.diskBytes)+'（含下载包和安装文件）','ob-market-note'));
  }
  detail.append(actions);
  detail.append(text('p','本地候选目录 · 尚未公开发布。规则试玩使用本机基准策略，不调用大模型。','ob-market-note'));
  if(preview&&preview.gameId===g.id){
   detail.append(text('h4',preview.status==='finished'?'试玩结果':'试玩进行中'),text('p','第 '+preview.turn+' 回合 · '+(preview.status==='finished'?'已结束':preview.status==='stopped'?'已停止':'运行中')));
   if(preview.status==='running'){
    var stop=button('停止试玩',async function(){try{preview=await request(ctx.api.gameMarketStop({runId:preview.id}));stopPoll();render();}catch(e){ctx.message(e.message,true);}});stop.disabled=false;detail.append(stop);
   }
   if(preview.result){
    var scores=preview.result.scores||{};
    Object.keys(scores).forEach(function(id,i){detail.append(text('p','选手 '+(i+1)+'：'+scores[id]+' 分'));});
    var winners=preview.result.winnerBotIds||[];
    detail.append(text('p',winners.length?'获胜：'+winners.map(function(id){return '选手 '+(Number(id.replace('preview_bot_',''))+1);}).join('、'):'本局和局或未达成胜利条件'));
   }
   var events=document.createElement('ol');(preview.events||[]).slice(-8).forEach(function(e){events.append(text('li',e.label||e.type||'回合已完成'));});detail.append(events);
  }
  var info=document.createElement('details');info.append(text('summary','来源与安装信息'),text('p',g.packageName+'@'+g.version),text('p','许可：'+g.license),text('p','目录包 SHA-256：'+g.packageSha256),text('p','安装目录：'+data.storageRoot));detail.append(info);
 }
 root.OpenBotGameMarket={
  mount:function(options){ctx=options;render();refresh();},
  cancelPreview:function(){stopPoll();if(preview&&preview.status==='running'&&ctx)ctx.api.gameMarketStop({runId:preview.id}).catch(function(){});}
 };
})(window);
