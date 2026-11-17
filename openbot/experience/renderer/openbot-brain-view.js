(function(root){
  'use strict';
  function tr(zh,en){return root.OpenBotI18n?root.OpenBotI18n.t(zh,en):zh;}
  function countLabel(value,zh,one,many){
    var english=typeof window==='object'&&window.OpenBotI18n&&window.OpenBotI18n.locale==='en';
    return english?new Intl.NumberFormat('en').format(Number(value))+' '+(Number(value)===1?one:(many||one+'s')):value+zh;
  }

  /*
   * Presentation only: the host owns the stage and worker truth.  This view
   * keeps the central row stable while replacing only the small worker strip,
   * so an incoming task event cannot restart the wave animation or move the
   * chat composer.
   */
  var LIMIT = 3;
  var STATES = ['idle','planning','dispatching','executing','summarizing','approval','paused','waiting'];
  var STATUS = ['running','queued','approval','paused','done','failed','canceled','interrupted'];
  var STATUS_LABEL = {running:tr('执行中',"Running"),queued:tr('排队中',"Queued"),approval:tr('待授权',"Awaiting approval"),paused:tr('已暂停',"Paused"),done:tr('已完成',"Completed"),failed:tr('失败',"Failed"),canceled:tr('已取消',"Canceled"),interrupted:tr('已中断',"Interrupted")};

  function text(value){ return String(value == null ? '' : value); }
  function state(value){
    var candidate = text(value).toLowerCase();
    return STATES.indexOf(candidate) >= 0 ? candidate : 'idle';
  }
  function status(value){
    var candidate = text(value).toLowerCase();
    return STATUS.indexOf(candidate) >= 0 ? candidate : 'queued';
  }
  function pose(value){
    return {running:'working',queued:'queued',approval:'waiting',paused:'interrupted',done:'done',failed:'error',canceled:'interrupted',interrupted:'interrupted'}[status(value)] || 'queued';
  }
  function workerKey(worker){
    return [text(worker && worker.botId),text(worker && worker.name),text(worker && worker.avatar),text(worker && worker.color),status(worker && worker.status),Number(worker && worker.taskCount) || 1].join(':');
  }
  function safeColor(value){
    var candidate = text(value).trim();
    return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : '';
  }
  function renderAvatarNode(host, worker, renderAvatar){
    if (typeof renderAvatar !== 'function') return;
    var markup = renderAvatar(worker, pose(worker.status));
    if (markup && typeof markup.nodeType === 'number') host.appendChild(markup);
    else if (typeof markup === 'string' && markup) host.insertAdjacentHTML('beforeend', markup);
  }
  function renderWorkers(host, workers, renderAvatar){
    if (!host) return;
    var list = Array.isArray(workers) ? workers.filter(Boolean) : [];
    var visible = list.slice(0,LIMIT), overflow = Math.max(0,list.length - visible.length);
    var signature = visible.map(workerKey).join('|') + (overflow ? '|+' + overflow : '');
    if (host.dataset.signature === signature) return;
    host.dataset.signature = signature;
    host.textContent = '';
    visible.forEach(function(worker){
      var item = document.createElement('span');
      item.className = 'brain-activity-worker';
      item.dataset.botId = text(worker.botId);
      item.dataset.brainWorker = text(worker.botId);
      item.dataset.status = status(worker.status);
      item.title = text(worker.name || tr('执行 Bot',"Execution Bot")) + ' · ' + STATUS_LABEL[status(worker.status)];
      item.setAttribute('aria-hidden','true');
      var color = safeColor(worker.color);
      if (color) item.style.setProperty('--worker-accent',color);
      renderAvatarNode(item,worker,renderAvatar);
      host.appendChild(item);
    });
    if (overflow){
      var more = document.createElement('span');
      more.className = 'brain-activity-worker-count';
      more.textContent = '+' + overflow;
      more.setAttribute('aria-label',countLabel(overflow,' 个其他执行 Bot','other execution Bot'));
      host.appendChild(more);
    }
    host.setAttribute('role','group');
    host.setAttribute('aria-label',visible.length ? tr('执行 Bot：',"Execution Bots: ") + visible.map(function(worker){
      return text(worker.name || tr('执行 Bot',"Execution Bot")) + tr('，',', ') + STATUS_LABEL[status(worker.status)];
    }).join(tr('；','; ')) + (overflow ? tr('；另有',"; plus ") + countLabel(overflow,'个执行 Bot','execution Bot') : '') : tr('没有关联执行 Bot',"No associated execution Bots"));
  }
  function render(element, snapshot, renderAvatar){
    if (!element) return;
    snapshot = snapshot || {};
    var next = state(snapshot.state);
    var botId = text(snapshot.botId);
    if (element.dataset.state !== next) element.dataset.state = next;
    if (element.dataset.botId !== botId) element.dataset.botId = botId;
    var label = element.querySelector('.brain-activity-label');
    var sub = element.querySelector('.brain-activity-sub');
    var labelText = snapshot.label != null ? text(snapshot.label) : '';
    var subText = snapshot.sub != null ? text(snapshot.sub) : '';
    if (label && snapshot.label != null && label.textContent !== labelText) label.textContent = labelText;
    if (sub && snapshot.sub != null && sub.textContent !== subText) sub.textContent = subText;
    renderWorkers(element.querySelector('.brain-activity-workers'),snapshot.workers,renderAvatar);
    if (next === 'idle'){
      element.hidden = true;
      element.classList.add('hidden');
    } else {
      element.hidden = false;
      element.classList.remove('hidden');
    }
    var workerLabel = (Array.isArray(snapshot.workers) ? snapshot.workers.filter(Boolean).slice(0,LIMIT) : []).map(function(worker){
      return text(worker.name || tr('执行 Bot',"Execution Bot")) + tr('，',', ') + STATUS_LABEL[status(worker.status)];
    });
    var overflow = Math.max(0,(Array.isArray(snapshot.workers) ? snapshot.workers.length : 0) - LIMIT);
    var aria = tr('超级大脑：',"Brain mode: ") + text(snapshot.label || next)
      + (workerLabel.length ? tr('；执行 Bot：',"; Execution Bots: ") + workerLabel.join(tr('；','; ')) : '')
      + (overflow ? tr('；另有',"; plus ") + countLabel(overflow,'个执行 Bot','execution Bot') : '');
    if (element.getAttribute('aria-label') !== aria) element.setAttribute('aria-label',aria);
  }
  root.OpenBotBrainView = { render:render, renderWorkers:renderWorkers, state:state, status:status };
})(typeof window === 'object' ? window : this);
