(function(root, factory){
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotPresence = api;
})(typeof window === 'object' ? window : this, function(){
  'use strict';
  function tr(zh,en){var i18n=typeof window==='object'?window.OpenBotI18n:null;return i18n?i18n.t(zh,en):zh;}
  var LABELS = { idle:tr('待命',"Ready"), queued:tr('排队中',"Queued"), thinking:tr('思考中',"Thinking"), working:tr('执行中',"Running"), waiting:tr('等你批准',"Awaiting your approval"), done:tr('已完成',"Completed"), error:tr('执行失败',"Run failed"), interrupted:tr('已中断',"Interrupted") };

  // A projection of host state, never an executor or a second task store.
  function summarize(botId, input, at){
    input = input || {};
    at = typeof at === 'number' ? at : Date.now();
    var tasks = (input.tasks || []).filter(function(t){ return t && t.botId === botId; });
    var live = tasks.filter(function(t){ return t.status === 'running' || t.status === 'queued'; });
    var running = live.some(function(t){ return t.status === 'running'; });
    var turn = input.pending || null;
    var waiting = !!turn && (input.approvals || []).some(function(r){ return r && r.state === 'pending' && (!r.runId || r.runId === turn.id); });
    var terminal = tasks.filter(function(t){ return ['done','failed','canceled','interrupted'].indexOf(t.status) >= 0; })
      .sort(function(a,b){ return (b.endedAt || b.createdAt || 0) - (a.endedAt || a.createdAt || 0); })[0];
    var outcome = input.outcome;
    if (outcome && (!terminal || outcome.at > (terminal.endedAt || terminal.createdAt || 0))) {
      terminal = { status:outcome.status, endedAt:outcome.at };
    }
    var status = 'idle';
    if (waiting) status = 'waiting';
    else if (running) status = 'working';
    else if (turn) status = turn.text || turn.activity === 'tool' ? 'working' : 'thinking';
    else if (live.length) status = 'queued';
    else if (terminal) {
      if (terminal.status === 'failed') status = 'error';
      else if (terminal.status === 'interrupted' || terminal.status === 'canceled') status = 'interrupted';
      else if (terminal.status === 'done' && at - terminal.endedAt >= 0 && at - terminal.endedAt < 8000) status = 'done';
    }
    return { status:status, label:LABELS[status], activeCount:live.length + (turn ? 1 : 0) };
  }

  function escape(value){ return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function office(bots, presence, avatar, activeId){
    if (!bots.length) return tr('<div class="org-empty">还没有机器人。新建一个后，它会出现在办公室。</div>',"<div class=\"org-empty\">No Bots yet. Create one to see it in the office.</div>");
    return tr('<div class="ob-office"><p class="ob-office-note">每个工位对应一个 Bot。点击角色，回到它的对话。</p>',"<div class=\"ob-office\"><p class=\"ob-office-note\">Each desk belongs to a Bot. Select a character to open its chat.</p>")
      + tr('<div class="ob-office-floor" role="group" aria-label="机器人办公室">',"<div class=\"ob-office-floor\" role=\"group\" aria-label=\"Bot office\">")
      + bots.map(function(bot){
        var p = presence(bot.id);
        return '<button type="button" class="ob-workstation'+(bot.id === activeId ? ' is-current' : '')+'" data-office-bot="'+escape(bot.id)+'" data-presence="'+p.status+'" aria-label="'+escape(bot.name)+tr('，',', ')+p.label+tr('，打开对话">',", open chat\">")
          + '<span class="ob-workstation-scene" aria-hidden="true"><span class="ob-office-chair"></span><span class="ob-office-worker">'+avatar(bot)+'</span><span class="ob-office-desk"><span class="ob-office-monitor"></span><span class="ob-office-keyboard"></span></span></span>'
          + '<span class="ob-worker-name">'+escape(bot.name)+'</span>'
          + '<span class="ob-worker-status">'+p.label+(p.activeCount > 1 ? ' · '+p.activeCount+tr(' 项进行中'," active") : '')+'</span></button>';
      }).join('') + '</div></div>';
  }
  return { summarize:summarize, office:office, labels:LABELS };
});
