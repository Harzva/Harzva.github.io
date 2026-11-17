(function () {
  'use strict';
  const tr = (zh, en) => window.OpenBotI18n ? window.OpenBotI18n.t(zh, en) : zh;
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const status = {assigned:['待接收','Awaiting acceptance'], accepted:['处理中','In progress'], review:['待派发人验收','Awaiting review'], done:['已验收','Accepted'], cancelled:['已取消','Cancelled']};
  const historyLabels = {assignTask:['派发','Assigned'], acceptTask:['接收','Accepted'], handoffTask:['交接','Handed off'], submitTask:['提交结果','Submitted result'], approveTask:['验收通过','Approved'], cancelTask:['取消','Cancelled']};
  const connectionLabels = {
    loading:['正在读取团队…','Loading your team…'], unconfigured:['连接团队后显示真人同事','Connect a team to see colleagues'],
    'signed-out':['登录团队后显示真人同事','Sign in to see colleagues'], 'password-required':['请先完成团队账号设置','Finish setting up your team account'],
    unavailable:['团队连接暂不可用','Team connection unavailable'], 'upgrade-required':['团队服务需升级，消息与任务暂不可用','Update the team service to use messages and tasks']
  };
  function create({call, report}) {
    const panel = document.getElementById('bar-collaboration');
    let data, active = 'tasks', selectedTask = '', taskFilter = 'mine', taskPage = 0, compose = false, busy = false, signature = '', accountKey = null;
    let roomChoice = '', operation = null, draftScope = '', detailRequest = '';
    const drafts = new Map();
    const label = key => tr(...(connectionLabels[key] || connectionLabels.unavailable));
    const pending = task => data?.account && (task.assigneeAccountId === data.account.id && ['assigned','accepted'].includes(task.status) || task.createdBy === data.account.id && task.status === 'review');
    function openRoom(roomId) { return call('open', {kind:'room', id:roomId, accountId:data.account.id}); }
    function personNode(person) {
      const item = document.createElement('div'); item.className = 'bar-bot-item bar-person-item'; item.setAttribute('role', 'listitem');
      const button = document.createElement('button'); button.type = 'button'; button.className = 'bar-bot-button bar-person-button'; button.dataset.botId = person.id;
      const avatar = document.createElement('span'); avatar.className = 'bar-person-avatar'; avatar.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span'); name.className = 'bar-bot-label';
      const state = document.createElement('span'); state.className = 'bar-bot-status';
      const digital = document.createElement('button'); digital.type = 'button'; digital.className = 'bar-digital-button'; digital.dataset.botId = 'digital-' + person.id;
      digital.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3M8 6h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3ZM9 11v3m6-3v3M2 11v5m20-5v5"/></svg>';
      button.append(avatar, name, state); item.append(button, digital);
      button.addEventListener('click', () => call('open', {kind:'person', id:person.id, accountId:data.account.id}));
      digital.addEventListener('click', () => call('open', {kind:'digital', id:person.id, accountId:data.account.id}));
      return {item, button, avatar, name, status:state, digital};
    }
    function updatePerson(node, person) {
      node.avatar.textContent = [...person.name].slice(0, 1).join('') || tr('人','P');
      node.name.textContent = person.name + (person.isMe ? tr(' · 我',' · me') : '');
      const presence = person.presence === 'online' ? tr('在线','Online') : person.presence === 'offline' ? tr('离线','Offline') : tr('状态未知','Status unknown');
      node.status.textContent = tr('真人 · ','') + presence;
      node.button.title = person.name + ' · ' + person.teamName + ' · ' + tr('打开共同群聊','Open shared group');
      node.button.setAttribute('aria-label', node.button.title + ' · ' + presence);
      const digitalStatus = {available:tr('代班可用','Delegate available'), waiting:tr('已授权，等待设备','Authorized, waiting for device'), off:tr('代班未开启','Delegate off'), unknown:tr('代班状态未知','Delegate status unknown')}[person.digitalStatus];
      node.digital.title = person.name + tr('的数字 BOT · ','’s digital BOT · ') + digitalStatus;
      node.digital.setAttribute('aria-label', node.digital.title);
      node.digital.dataset.status = person.digitalStatus;
    }
    const button = (action, text, extra = '') => '<button type="button" data-collab-action="' + action + '" ' + extra + '>' + esc(text) + '</button>';
    function taskPerson(name, roomId) {
      return '<button type="button" class="collaboration-person" data-room="' + esc(roomId) + '" aria-label="' + esc(tr('与', 'Open the group with ') + name + tr('进入任务群聊', '')) + '"><span class="collaboration-mini-avatar" aria-hidden="true">' + esc([...name].slice(0,1).join('')) + '</span><span>' + esc(name) + '</span></button>';
    }
    function taskRow(task) {
      return '<div class="collaboration-task-row"><button type="button" class="collaboration-row" data-task="' + esc(task.id) + '"><strong>' + esc(task.title) + '</strong><span class="collaboration-task-status" data-status="' + task.status + '">' + esc(tr(...status[task.status])) + '</span></button><div class="collaboration-task-people">' + taskPerson(task.createdByName,task.roomId) + '<span aria-hidden="true">→</span>' + taskPerson(task.assigneeName,task.roomId) + '</div></div>';
    }
    function renderTask(task) {
      const mine = task.assigneeAccountId === data.account.id, creator = task.createdBy === data.account.id;
      const room = data.rooms.find(r => r.id === task.roomId);
      let html = '<div class="collaboration-detail">' + button('back', tr('返回任务','Back to tasks')) + '<h2>' + esc(task.title) + '</h2><p>' + esc(task.createdByName + ' → ' + task.assigneeName) + ' · ' + esc(tr(...status[task.status])) + '</p>';
      if (!task.details) return html + '<p role="status">' + esc(tr('正在读取任务详情…','Loading task details…')) + '</p>' + button('detail',tr('重试','Retry')) + '</div>';
      if (room) html += '<p class="collaboration-context">' + esc(room.name) + '</p>';
      if (task.description) html += '<p class="collaboration-body">' + esc(task.description) + '</p>';
      if (task.result) html += '<h3>' + esc(tr('提交结果','Submitted result')) + '</h3><p class="collaboration-body">' + esc(task.result) + '</p>';
      html += '<div class="collaboration-actions">';
      if (mine && task.status === 'assigned') html += button('acceptTask', tr('接收任务','Accept task'));
      if (creator && task.status === 'review') html += button('approveTask', tr('验收通过','Approve result'));
      html += button('room', tr('进入群聊','Open group'), 'data-room="' + esc(task.roomId) + '"') + '</div>';
      if (mine && task.status === 'accepted') html += '<form data-collab-form="submitTask"><label>' + esc(tr('结果或交付说明','Result or delivery note')) + '<textarea name="result" maxlength="4000" required data-focus-key="task-result" rows="3"></textarea></label><button type="submit">' + esc(tr('提交给派发人验收','Submit for review')) + '</button></form>';
      if (mine && ['assigned','accepted'].includes(task.status)) {
        const peers = data.people.filter(p => task.handoffMemberIds.includes(p.id));
        if (peers.length) html += '<details data-preserve="handoff"><summary>' + esc(tr('交接给同事','Hand off to a colleague')) + '</summary><form data-collab-form="handoffTask"><label>' + esc(tr('接收同事','Colleague')) + '<select name="targetMemberId" data-focus-key="handoff-person">' + peers.map(p=>'<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>').join('') + '</select></label><label>' + esc(tr('交接说明','Handoff note')) + '<textarea name="note" rows="2" maxlength="2000" required data-focus-key="handoff-note"></textarea></label><button type="submit">' + esc(tr('发送交接，等待对方接收','Hand off for acceptance')) + '</button></form></details>';
      }
      if (creator && !['done','cancelled'].includes(task.status)) html += '<details data-preserve="cancel"><summary>' + esc(tr('任务操作','Task actions')) + '</summary><p>' + esc(tr('取消后，接收人不能继续提交这项任务。','After cancellation, the assignee cannot submit this task.')) + '</p>' + button('cancelTask', tr('确认取消任务','Confirm cancellation')) + '</details>';
      html += '<details data-preserve="history"><summary>' + esc(tr('责任与交接记录','Responsibility and handoff history')) + '</summary><ol class="collaboration-history">' + task.history.map(h => '<li>' + esc(h.actorName + ' · ' + tr(...(historyLabels[h.action] || [h.action,h.action])) + (h.targetName ? ' → ' + h.targetName : '')) + (h.note ? '<p>' + esc(h.note) + '</p>' : '') + '</li>').join('') + '</ol></details></div>';
      return html;
    }
    function assignment() {
      if (!data.rooms.some(r=>r.id===roomChoice)) roomChoice = data.rooms[0]?.id || '';
      const peers = data.people.filter(p => p.roomIds.includes(roomChoice));
      return '<form data-collab-form="assignTask"><label>' + esc(tr('协作群聊','Shared group')) + '<select name="roomId" data-focus-key="assignment-room">' + data.rooms.map(r=>'<option value="' + esc(r.id) + '"' + (r.id===roomChoice?' selected':'') + '>' + esc(r.name) + '</option>').join('') + '</select></label><label>' + esc(tr('接收人','Assignee')) + '<select name="targetMemberId" data-focus-key="assignment-person">' + peers.map(p=>'<option value="' + esc(p.id) + '">' + esc(p.name + (p.isMe?tr(' · 我',' · me'):'')) + '</option>').join('') + '</select></label><label>' + esc(tr('任务','Task')) + '<input name="title" maxlength="160" required data-focus-key="assignment-title"></label><label>' + esc(tr('说明（选填）','Description (optional)')) + '<textarea name="description" rows="2" maxlength="4000" data-focus-key="assignment-description"></textarea></label><p class="collaboration-context">' + esc(tr('任务在该群当前成员范围内共享；不会自动启动 Agent。','Shared with current group members. Agents are started separately.')) + '</p><div class="collaboration-actions"><button type="submit"' + (peers.length?'':' disabled') + '>' + esc(tr('派发任务','Assign task')) + '</button>' + button('cancel-compose',tr('取消','Cancel')) + '</div></form>';
    }
    function html() {
      let result = '<header class="collaboration-header"><strong>' + esc(data.account ? data.account.name : tr('团队协作','Team collaboration')) + '</strong>' + button('refresh',tr('刷新','Refresh')) + button('close',tr('收起','Close')) + '</header>';
      if (data.connection !== 'connected') return result + '<p role="status">' + esc(label(data.connection)) + '</p>' + button('team',tr('打开团队','Open team'));
      if (selectedTask) {
        const task = data.tasks.find(t=>t.id===selectedTask);
        return result + (task ? renderTask(task) : '<p>' + esc(tr('任务已不可访问，请返回刷新。','This task is no longer accessible. Go back and refresh.')) + '</p>' + button('back',tr('返回任务','Back to tasks')));
      }
      result += '<nav class="collaboration-tabs" aria-label="' + esc(tr('协作内容','Collaboration content')) + '">' + button('tasks',tr('任务','Tasks'),'aria-pressed="' + (active==='tasks') + '"') + button('messages',tr('同事消息','Messages'),'aria-pressed="' + (active==='messages') + '"') + '</nav>';
      if (active === 'messages') return result + '<div class="collaboration-rows">' + (data.messages.length ? data.messages.map(m => {
        const room = data.rooms.find(r=>r.id===m.roomId);
        return '<button type="button" class="collaboration-row" data-room="' + esc(m.roomId) + '"><strong>' + esc(m.actorName) + ' · ' + esc(m.actorType==='human'?tr('真人','Human'):tr('数字 BOT 代班','Digital BOT delegate')) + '</strong><span class="collaboration-message">' + esc(m.text) + '</span><span>' + esc(room?.name) + '</span></button>';
      }).join('') : '<p>' + esc(tr('还没有来自同事的群消息。','No group messages from colleagues yet.')) + '</p>') + '</div>';
      if (compose) return result + assignment();
      const tasks = data.tasks.filter(t => taskFilter==='mine' ? t.assigneeAccountId === data.account.id : taskFilter==='sent' ? t.createdBy === data.account.id : true);
      const pages = Math.max(1,Math.ceil(tasks.length/12)); taskPage = Math.min(taskPage,pages-1);
      result += '<div class="collaboration-tools"><label class="sr-only" for="collaboration-task-filter">' + esc(tr('任务范围','Task filter')) + '</label><select id="collaboration-task-filter" data-focus-key="task-filter"><option value="mine"' + (taskFilter==='mine'?' selected':'') + '>' + esc(tr('交给我的','Assigned to me')) + '</option><option value="sent"' + (taskFilter==='sent'?' selected':'') + '>' + esc(tr('我派发的','Assigned by me')) + '</option><option value="all"' + (taskFilter==='all'?' selected':'') + '>' + esc(tr('群内任务','Group tasks')) + '</option></select>' + (data.taskProtocol===1&&data.rooms.length?button('compose',tr('派发任务','Assign task')):'') + '</div>';
      result += '<div class="collaboration-rows">' + (tasks.length ? tasks.slice(taskPage*12,(taskPage+1)*12).map(taskRow).join('') : '<p>' + esc(tr('这个范围内还没有任务。','No tasks in this view.')) + '</p>') + '</div>';
      if (pages>1) result += '<div class="collaboration-pagination">' + button('previous',tr('上一页','Previous'),taskPage===0?'disabled':'') + '<span>' + (taskPage+1) + '/' + pages + '</span>' + button('next',tr('下一页','Next'),taskPage===pages-1?'disabled':'') + '</div>';
      return result;
    }
    function redraw(force=false) {
      if (!data) return;
      const nextSignature = JSON.stringify([data, active, selectedTask, taskFilter, taskPage, compose, roomChoice, busy]);
      if (!force && signature===nextSignature) return;
      signature=nextSignature;
      const focus=document.activeElement?.dataset.focusKey;
      const previousControls=[...panel.querySelectorAll('[data-focus-key]')].map(el=>({key:el.dataset.focusKey,value:el.value,start:el.selectionStart,end:el.selectionEnd}));
      if (draftScope) drafts.set(draftScope, previousControls);
      const nextScope=accountKey + ':' + (selectedTask ? 'task:' + selectedTask : compose ? 'compose' : 'list:' + active);
      const controls=drafts.get(nextScope) || [];
      const sameScope=nextScope===draftScope;
      const expanded=sameScope ? [...panel.querySelectorAll('details[open][data-preserve]')].map(el=>el.dataset.preserve) : [];
      draftScope=nextScope;
      const scroll=sameScope ? panel.scrollTop : 0;
      panel.innerHTML=html();
      for (const control of controls) {
        const el=[...panel.querySelectorAll('[data-focus-key]')].find(n=>n.dataset.focusKey===control.key);
        if (!el || el.tagName==='SELECT' && ![...el.options].some(o=>o.value===control.value)) continue;
        el.value=control.value;
        if (control.key===focus) {el.focus({preventScroll:true}); if (el.setSelectionRange && control.start!==null) el.setSelectionRange(control.start,control.end);}
      }
      for (const el of panel.querySelectorAll('details[data-preserve]')) if (expanded.includes(el.dataset.preserve)) el.open=true;
      for (const el of panel.querySelectorAll('button,input,textarea,select')) if(busy)el.disabled=true;
      panel.scrollTop=scroll;
    }
    async function mutate(action, value={}) {
      if (busy || !data?.account) return;
      const task=data.tasks.find(t=>t.id===selectedTask);
      const input={...value,...(action==='assignTask'?{}:{taskId:task?.id,expectedRevision:task?.revision})};
      const fingerprint=JSON.stringify([data.account.id,action,input]);
      if (!operation || operation.fingerprint!==fingerprint) operation={fingerprint,id:crypto.randomUUID()};
      busy=true;redraw();
      const account=data.account.id;
      try {
        const result=await call('collaborate',{accountId:account,action,input:{...input,operationId:operation.id}});
        if (!result || data.account?.id!==account) return;
        if(result.ok===false){report(result.message||tr('操作未完成，请刷新核对。','The action did not complete. Refresh to check.'));return;}
        operation=null; drafts.delete(draftScope); draftScope=''; panel.replaceChildren(); compose=false;
        if(result.result?.result?.task?.id)selectedTask=result.result.result.task.id;
        await call('refreshCollaboration');
      } finally {busy=false;redraw(true);}
    }
    function loadSelected() {
      const task=data?.tasks.find(t=>t.id===selectedTask);
      if(!task||task.details)return;
      const key=data.account.id+':'+task.id+':'+task.revision;
      if(detailRequest===key)return;
      detailRequest=key;
      call('task',{taskId:task.id,accountId:data.account.id});
    }
    panel.addEventListener('click',event=>{
      const target=event.target.closest('button');if(!target||busy)return;
      if(target.dataset.task){selectedTask=target.dataset.task;redraw();loadSelected();return;}
      if(target.dataset.room){openRoom(target.dataset.room);return;}
      const action=target.dataset.collabAction;
      if(!action)return;
      if(action==='detail'){detailRequest='';loadSelected();return;}
      if(action==='close'){call('panel','').then(()=>document.getElementById('bar-inbox').focus());return;}
      if(action==='refresh'){call('refreshCollaboration');return;}
      if(action==='team'){call('open',{kind:'team'});return;}
      if(['acceptTask','approveTask','cancelTask'].includes(action)){mutate(action);return;}
      if(action==='back')selectedTask='';
      if(action==='tasks'||action==='messages'){active=action;compose=false;}
      if(action==='compose'){compose=true;roomChoice='';}
      if(action==='cancel-compose'){drafts.delete(draftScope);draftScope='';panel.replaceChildren();compose=false;}
      if(action==='previous')taskPage--;
      if(action==='next')taskPage++;
      redraw();
    });
    panel.addEventListener('change',event=>{
      if(event.target.id==='collaboration-task-filter'){taskFilter=event.target.value;taskPage=0;redraw();}
      if(event.target.name==='roomId'){roomChoice=event.target.value;redraw();}
    });
    panel.addEventListener('submit',event=>{
      const form=event.target.closest('form[data-collab-form]');if(!form)return;event.preventDefault();
      mutate(form.dataset.collabForm,Object.fromEntries(new FormData(form)));
    });
    return {personNode,updatePerson,label,pending,
      render(view) {
        const next=view.collaboration;
        if(!next)return;
        if(accountKey!==next.account?.id){drafts.clear();draftScope='';detailRequest='';accountKey=next.account?.id;signature='';selectedTask='';compose=false;operation=null;roomChoice='';taskPage=0;panel.replaceChildren();}
        data=next;panel.hidden=view.layout.panel!=='inbox';
        if(!panel.hidden){redraw();loadSelected();}
      }
    };
  }
  window.OpenBotBotbarCollaboration={create};
})();
