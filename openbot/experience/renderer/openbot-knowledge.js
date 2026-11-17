(function (global) {
  'use strict';
  function mount({root, bridge, tr, getScope, commitNavigation}) {
    let activeKey = '', visible = false, kind = 'knowledge', library = 'shared', query = '', view = 0;
    let dialog = null, serial = 0;
    const el = (tag, text, cls) => {
      const node = document.createElement(tag);
      if (text !== undefined) node.textContent = text;
      if (cls) node.className = cls;
      return node;
    };
    function button(text, fn, data, value) {
      const control = el('button', text, 'ob-knowledge-button');
      control.type = 'button';
      if (data) control.dataset[data] = value;
      control.addEventListener('click', fn);
      return control;
    }
    const scopeKey = (scope) => scope ? JSON.stringify([scope.spaceId, scope.botId]) : '';
    const current = (scope) => scopeKey(scope) === scopeKey(getScope());
    async function call(scope, method, action, fields = {}) {
      if (!scope || !current(scope)) throw new Error(tr('已切换 Bot，请重新打开。', 'The Bot changed. Reopen the panel.'));
      const result = await bridge[method]({...scope, action, ...fields});
      if (!result?.ok) throw Object.assign(new Error(result?.message || tr('操作未完成。', 'Action did not complete.')), {code:result?.code});
      return result;
    }
    function field(form, label, name, type, value = '', {required = false, max = 0, options = []} = {}) {
      const control = el(type === 'textarea' || type === 'select' ? type : 'input');
      if (!['textarea','select'].includes(type)) control.type = type;
      const id = 'ob-k-field-' + (++serial);
      control.id = id; control.name = name;
      if (required) control.required = true;
      if (max) control.maxLength = max;
      if (type === 'select') for (const [val, caption] of options) {
        const option = el('option', caption); option.value = val; control.append(option);
      }
      if (type === 'checkbox') control.checked = Boolean(value);
      else control.value = value;
      const labelNode = el('label', label);
      labelNode.htmlFor = id;
      const line = el('div', undefined, type === 'checkbox' ? 'ob-knowledge-check' : 'ob-knowledge-field');
      if (type === 'checkbox') line.append(control, labelNode); else line.append(labelNode, control);
      form.append(line); return control;
    }
    function status(parent) {
      const result = el('p', '', 'ob-knowledge-status');
      result.setAttribute('role', 'status');
      parent.append(result); return result;
    }
    function setError(node, error) {
      node.textContent = error?.message || tr('操作未完成。', 'Action did not complete.');
    }
    function submit(form, label, fn, marker, mark, errorHost = null) {
      const save = el('button', label, 'ob-knowledge-button ob-knowledge-primary');
      save.type = 'submit';
      if (marker) save.dataset[marker] = mark;
      form.append(save);
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (save.disabled || !form.reportValidity()) return;
        save.disabled = true;
        try { await fn(); }
        catch (error) { if (errorHost) setError(errorHost, error); }
        finally { save.disabled = false; }
      });
      return save;
    }
    function shell(id, title, opener, scope) {
      if (dialog?.open) dialog.close();
      const modal = el('dialog', undefined, 'ob-knowledge-dialog'); modal.id = id;
      modal.dataset.scope = scopeKey(scope);
      const head = el('header', undefined, 'ob-knowledge-dialog-head');
      const heading = el('h2', title); heading.id = id + '-title';
      modal.setAttribute('aria-labelledby', heading.id);
      head.append(heading, button(tr('关闭', 'Close'), () => modal.close()));
      modal.append(head);
      modal.addEventListener('close', () => {
        modal.remove();
        if (dialog === modal) dialog = null;
        if (opener?.isConnected && current(scope)) opener.focus({preventScroll: true});
      }, {once: true});
      document.body.append(modal); dialog = modal; return modal;
    }
    function toggle(text, selected, fn, marker, mark) {
      const control = button(text, fn, marker, mark);
      control.setAttribute('aria-pressed', String(selected));
      return control;
    }
    function render(show) {
      const scope = getScope(), key = scopeKey(scope);
      if (dialog?.open && dialog.dataset.scope !== key) dialog.close();
      if (visible === Boolean(show && scope) && key === activeKey) return;
      if (key !== activeKey) { kind = 'knowledge'; library = 'shared'; query = ''; }
      visible = Boolean(show && scope); activeKey = key; root.hidden = !visible;
      if (!visible) { view++; root.replaceChildren(); return; }
      draw(scope);
    }
    function draw(scope) {
      const ticket = ++view;
      root.replaceChildren();
      const topBar = el('div', undefined, 'ob-knowledge-top');
      const header = el('div', undefined, 'ob-knowledge-segments');
      header.setAttribute('role', 'group');
      header.setAttribute('aria-label', tr('条目类型', 'Entry type'));
      header.append(
        toggle(tr('知识', 'Knowledge'), kind === 'knowledge', () => { kind = 'knowledge'; draw(scope); root.querySelector('[data-knowledge-view="knowledge"]')?.focus(); }, 'knowledgeView', 'knowledge'),
        toggle(tr('话术', 'Scripts'), kind === 'script', () => { kind = 'script'; draw(scope); root.querySelector('[data-knowledge-view="script"]')?.focus(); }, 'knowledgeView', 'script')
      );
      const addButton = button(tr('+ 新增', '+ New'), e => edit(scope, null, e.currentTarget), 'knowledgeAction', 'new');
      addButton.classList.add('ob-knowledge-new');
      topBar.append(header, addButton);
      root.append(topBar);
      const libraries = el('div', undefined, 'ob-knowledge-actions ob-knowledge-scopes');
      libraries.setAttribute('role', 'group');
      libraries.setAttribute('aria-label', tr('可见范围', 'Scope'));
      libraries.append(
        toggle(tr('共享', 'Shared'), library === 'shared', () => { library = 'shared'; draw(scope); root.querySelector('[data-knowledge-library="shared"]')?.focus(); }, 'knowledgeLibrary', 'shared'),
        toggle(tr('此 Bot 专属', 'This Bot'), library === 'bot', () => { library = 'bot'; draw(scope); root.querySelector('[data-knowledge-library="bot"]')?.focus(); }, 'knowledgeLibrary', 'bot')
      ); root.append(libraries);
      const search = el('search');
      const form = el('form'); form.className = 'ob-knowledge-search-form'; search.append(form); root.append(search);
      const term = document.createElement('input');
      term.type = 'search'; term.name = 'query'; term.value = query; term.maxLength = 200;
      term.placeholder = tr('搜索标题或内容…', 'Search titles or content…');
      term.setAttribute('aria-label', tr('搜索标题或内容', 'Search titles or content'));
      form.append(term);
      const messages = status(root);
      submit(form, tr('搜索', 'Search'), async () => {
        query = term.value.trim();
        await load(scope, ticket, items, messages);
      }, 'knowledgeAction', 'search', messages);
      const items = el('ul', undefined, 'ob-knowledge-list'); root.append(items);
      void load(scope, ticket, items, messages);
    }
    let searchTicket = 0;
    async function load(scope, ticket, items, messages) {
      const loadTicket = ++searchTicket;
      try {
        let result;
        const selection = {kind, library, query};
        try { result = await call(scope, 'botKnowledge', 'list', selection); }
        catch (error) {
          if (error.code !== 'KNOWLEDGE_SCOPE_DENIED' || !commitNavigation || !current(scope) || ticket !== view || loadTicket !== searchTicket) throw error;
          await commitNavigation();
          if (!current(scope) || ticket !== view || loadTicket !== searchTicket) return;
          result = await call(scope, 'botKnowledge', 'list', selection);
        }
        if (ticket !== view || loadTicket !== searchTicket || !current(scope)) return;
        const scopeLabel = library === 'shared' ? tr('共享', 'Shared') : tr('此 Bot 专属', 'This Bot');
        const kindLabel = kind === 'knowledge' ? tr('知识', 'Knowledge') : tr('话术', 'Scripts');
        messages.textContent = result.entries.length ? '' : tr('暂无匹配的' + scopeLabel + kindLabel + '条目。', 'No matching ' + scopeLabel.toLowerCase() + ' ' + kindLabel.toLowerCase() + ' entries.');
        items.replaceChildren();
        for (const entry of result.entries) {
          const row = el('li');
          const open = button('', event => edit(scope, entry, event.currentTarget), 'knowledgeEntry', entry.id);
          open.className = 'ob-knowledge-entry-row';
          open.append(el('span', entry.title, 'ob-knowledge-entry-title'));
          const badges = el('span', undefined, 'ob-knowledge-entry-badges');
          const statePill = el('span', entry.status === 'published' ? tr('已发布', 'Published') : tr('草稿', 'Draft'), 'ob-knowledge-pill');
          statePill.dataset.state = entry.status === 'published' ? 'published' : 'draft';
          badges.append(statePill);
          if (entry.external && entry.status === 'published') {
            const extPill = el('span', tr('可对外', 'External'), 'ob-knowledge-pill');
            extPill.dataset.external = 'true';
            badges.append(extPill);
          }
          open.append(badges);
          row.append(open);
          items.append(row);
        }
      } catch (error) { if (ticket === view && loadTicket === searchTicket && current(scope)) setError(messages, error); }
    }
    function edit(scope, entry, opener) {
      const itemKind = kind, itemLibrary = library;
      const modal = shell('ob-knowledge-edit', entry ? tr('编辑条目', 'Edit entry') : tr('新增条目', 'New entry'), opener, scope);
      const form = el('form'); modal.append(form);
      const title = field(form, tr('标题', 'Title'), 'title', 'text', entry?.title, {required: true, max: 200});
      const body = field(form, tr('内容（Markdown）', 'Content (Markdown)'), 'body', 'textarea', entry?.body, {required: true, max: 100000});
      body.rows = 7;
      const source = field(form, tr('来源', 'Source'), 'source', 'text', entry?.source, {max: 2000});
      const state = field(form, tr('状态', 'Status'), 'status', 'select', entry?.status || 'draft', {options: [
        ['draft',tr('草稿','Draft')],['published',tr('发布','Publish')]
      ]});
      const external = field(form, tr('允许客服引用（发布后生效）', 'Allow customer support use after publishing'), 'external', 'checkbox', entry?.external);
      const msg = status(form);
      submit(form, tr('保存条目', 'Save entry'), async () => {
        await call(scope,'botKnowledge','save',{
          ...(entry ? {id: entry.id} : {}), expectedRevision: entry?.revision || 0,
          library: itemLibrary, kind: itemKind, title: title.value.trim(), body: body.value.trim(), source: source.value.trim(),
          status: state.value, external: external.checked
        });
        modal.close(); if (visible && current(scope)) { query = ''; draw(scope); root.querySelector('[data-knowledge-action="new"]')?.focus(); }
      },'knowledgeAction','save',msg);
      if (entry) form.append(button(tr('撤回', 'Withdraw'), async e => {
        const control = e.currentTarget;
        control.disabled = true;
        try {
          await call(scope,'botKnowledge','withdraw',{id:entry.id,expectedRevision:entry.revision});
          modal.close(); if (visible && current(scope)) draw(scope);
        } catch (error) { setError(msg,error); control.disabled = false; }
      },'knowledgeAction','withdraw'));
      modal.showModal(); title.focus();
    }
    async function openStyle(opener) {
      const scope = getScope();
      if (!scope) return;
      const modal = shell('ob-bot-reply-style', tr('回复风格', 'Reply style'), opener, scope);
      const msg = status(modal);
      modal.showModal();
      try {
        const {style} = await call(scope,'botKnowledge','list',{kind:'script'});
        if (!modal.open || !current(scope)) return;
        const form = el('form'); modal.append(form);
        const text = field(form, tr('表达方式', 'How this Bot should write'), 'style', 'textarea', style.value,{max:4000});
        text.rows = 5;
        form.append(el('p',tr('例如：简洁、亲切，先给结论。风格不改变已发布的话术和业务规则。','For example: concise and friendly, lead with the answer. Style does not change published scripts or policies.'),'ob-knowledge-hint'));
        submit(form,tr('保存风格','Save style'),async () => {
          await call(scope,'botKnowledge','style-save',{value:text.value,expectedRevision:style.revision});
          modal.close();
        },'knowledgeAction','style-save',msg);
        text.focus();
      } catch (error) { setError(msg,error); }
    }
    function openCustomer() {
      const scope = getScope();
      if (!scope) return;
      const modal = shell('ob-customer-pilot', tr('飞书客服', 'Feishu customer service'), document.activeElement, scope);
      const head = modal.querySelector('header');
      const identity = el('div',undefined,'ob-feishu-identity');
      const mark = el('img',undefined,'ob-feishu-mark'); mark.src = 'assets/app-logos/feishu.png'; mark.alt = '';
      mark.width = 32; mark.height = 32;
      const words = el('div');
      const info = el('p','','ob-feishu-mode');
      words.append(head.querySelector('h2'),info); identity.append(mark,words); head.prepend(identity);
      const body = el('div',undefined,'ob-feishu-body'); modal.append(body);
      const threads = el('div',undefined,'ob-customer-threads'); body.append(threads);
      const conversation = el('section',undefined,'ob-customer-conversation'); body.append(conversation);
      const msg = status(body);
      let threadId = '', sequence = 0, busy = false, mode = '';
      const refresh = button(tr('刷新会话','Refresh conversation'),()=>action(async()=>{
        await call(scope,'customerPilot','sync'); await listing();
      }),'customerAction','sync');
      refresh.classList.add('ob-feishu-refresh');
      const timeline = el('div',undefined,'ob-feishu-timeline'); body.prepend(timeline);
      const conversationHead = el('div',undefined,'ob-feishu-conversation-head');
      const heading = el('h3',tr('飞书会话','Feishu conversation'));
      conversationHead.append(heading, refresh);
      timeline.append(conversationHead,threads,conversation);
      function still() { return modal.open && current(scope); }
      async function action(fn) {
        if (busy || !still()) return;
        busy = true; msg.textContent = '';
        modal.setAttribute('aria-busy','true');
        const controls = Array.from(body.querySelectorAll('button:not(:disabled)'));
        controls.forEach(control => { control.disabled = true; });
        try { await fn(); }
        catch(error) { if (still()) setError(msg,error); }
        finally { controls.forEach(control => { control.disabled = false; }); busy = false; modal.removeAttribute('aria-busy'); }
      }
      async function detail(id) {
        threadId = id; const t = ++sequence;
        const data = await call(scope,'customerPilot','detail',{threadId:id});
        if (!still() || t !== sequence) return;
        renderDetail(data);
      }
      async function listing() {
        const data = await call(scope,'customerPilot','list');
        if (!still()) return;
        mode = data.mode;
        info.textContent = mode === 'live' ? tr('已绑定飞书测试会话 · 人工审核发送','Feishu test conversation · Human approval required') :
          tr('隔离预览 · 不向飞书发送','Isolated preview · No messages sent to Feishu');
        modal.dataset.customerMode = mode;
        heading.textContent = mode === 'live' ? tr('飞书会话','Feishu conversation') : tr('客服会话','Customer conversation');
        threads.replaceChildren();
        for (const entry of data.threads) {
          const tab = button(entry.label, () => action(() => detail(entry.id)),'customerThread',entry.id);
          tab.hidden = data.threads.length === 1;
          threads.append(tab);
        }
        const found = data.threads.find(row=>row.id===threadId) || data.threads[0];
        if (found) await detail(found.id);
        else conversation.replaceChildren(el('p',tr('没有会话。刷新后会显示当前绑定会话。','No conversation. Refresh to load the bound conversation.')));
      }
      function renderDetail(data) {
        conversation.replaceChildren();
        conversation.dataset.customerConversation = data.thread.id;
        const log = el('ol',undefined,'ob-customer-log');
        if (!data.messages.length) {
          const empty = el('li',tr('还没有消息。刷新会话以读取已授权的消息。','No messages yet. Refresh to read authorized messages.'),'ob-feishu-empty');
          log.append(empty);
        }
        for (const entry of data.messages) {
          const row = el('li'); row.dataset.customerActor = entry.actor; row.dataset.customerState = entry.state;
          const actor = {customer:tr('客户','Customer'),human:tr('人工客服','Human agent'),bot:'Bot',system:tr('系统','System')}[entry.actor] || '';
          const accepted = mode === 'live' ? tr('飞书已受理','Accepted by Feishu') : tr('模拟发送已受理 · 未发到飞书','Preview send accepted · Not sent to Feishu');
          const states = {accepted,sent:accepted,
            unknown:tr('结果待核对','Needs verification'),sending:tr('发送中','Sending'),failed:tr('发送失败','Send failed'),
            'confirmed-sent':tr('人工确认已发送','Manually confirmed sent'),'not-sent':tr('已确认未发出','Confirmed not sent'),
            retracted:tr('已撤回','Retracted')};
          const author = entry.author === 'Bot (approved by human)' ? tr('经人工确认','Human approved') :
            entry.author === 'Human (edited)' ? tr('人工编辑','Edited by human') :
            entry.author === 'Human (template)' ? tr('人工确认模板','Template approved by human') : entry.author;
          const meta = el('div',undefined,'ob-feishu-message-meta');
          meta.append(el('strong',actor,'ob-feishu-role'));
          if (author) meta.append(el('span',author,'ob-feishu-byline'));
          if (Number.isFinite(entry.at)) {
            const time = el('time',new Intl.DateTimeFormat(document.documentElement.lang || undefined,{dateStyle:'short',timeStyle:'short'}).format(entry.at));
            time.dateTime = new Date(entry.at).toISOString(); meta.append(time);
          }
          row.append(meta,el('p',entry.state === 'retracted' ? tr('消息已撤回','Message retracted') : entry.text));
          if (states[entry.state]) row.append(el('small',states[entry.state],'ob-feishu-receipt'));
          if (entry.state === 'unknown' && data.thread.sendBlocked === 'unknown') {
            const verify = el('div',undefined,'ob-feishu-reconcile');
            verify.append(el('p',tr('请先查看飞书原会话，再记录结果。','Check the original Feishu conversation, then record the outcome.')));
            for (const [outcome, label] of [['sent',tr('已核对：发出','Verified: sent')],['not-sent',tr('已核对：未发出','Verified: not sent')]]) {
              verify.append(button(label,()=>action(async()=>{
                const result = await call(scope,'customerPilot','resolve-send',{threadId:data.thread.id,messageId:entry.id,expectedRevision:data.thread.revision,outcome});
                if (!result.canceled) await detail(data.thread.id);
              })));
            }
            row.append(verify);
          }
          log.append(row);
        }
        conversation.append(log);
        const actions = el('div',undefined,'ob-knowledge-actions ob-feishu-actions');
        if (data.thread.sendBlocked) {
          actions.append(el('p',data.thread.sendBlockNeedsOriginalBinding ?
            tr('此会话有未核对的旧回复。请用原来的飞书连接打开并记录结果。','This conversation has an unverified reply. Open it with the original Feishu connection to record the outcome.') :
            data.thread.sendBlocked === 'unknown' ? tr('上一条回复需要核对，暂不能继续拟稿或发送。','Verify the previous reply before drafting or sending again.') :
            tr('正在确认发送结果。','Waiting for the send result.')));
        } else if (data.thread.status === 'taken_over') {
          actions.append(el('p',tr('人工已接管，Bot 不再拟稿。','A human has taken over; Bot drafts are paused.')));
        } else {
          actions.append(button(data.draft ? tr('重新拟稿','Regenerate draft') : tr('让 Bot 拟稿','Ask Bot for a draft'),()=>action(async () => {
            await call(scope,'customerPilot','draft',{threadId:data.thread.id}); await detail(data.thread.id);
            conversation.querySelector('textarea')?.focus();
          }),'customerAction','draft'),button(tr('人工接管','Take over'),()=>action(async () => {
            await call(scope,'customerPilot','takeover',{threadId:data.thread.id,expectedRevision:data.thread.revision}); await detail(data.thread.id);
          }),'customerAction','takeover'));
        }
        conversation.append(actions);
        if (data.draft && data.thread.status !== 'taken_over' && !data.thread.sendBlocked) {
          const form = el('form',undefined,'ob-customer-draft'); form.dataset.customerActor = 'bot';
          const draftHead = el('div',undefined,'ob-feishu-draft-head');
          draftHead.append(el('strong',data.draft.origin === 'template' ? tr('人工回复模板','Manual reply template') : tr('Bot 草稿','Bot draft')),
            el('span',tr('待审核 · 未发送','Awaiting review · Not sent'),'ob-feishu-draft-state'));
          form.append(draftHead);
          if (data.draft.origin === 'template') form.append(el('p',tr('没有配置可用于客服拟稿的本地模型。请人工补全回复。','No local model is configured for drafting. Complete the reply manually.'),'ob-knowledge-hint'));
          if (data.draft.sources?.length) {
            const sources = el('details',undefined,'ob-feishu-sources');
            sources.append(el('summary',tr('拟稿参考','Draft sources') + ' · ' + data.draft.sources.length));
            const list = el('ul');
            for (const source of data.draft.sources) list.append(el('li',source.title + ' · v' + source.revision));
            sources.append(list); form.append(sources);
          }
          const reply = field(form,tr('待审核回复','Reply to review'),'reply','textarea',data.draft.text,{required:true,max:1800});
          reply.rows=4;
          submit(form,mode === 'live' ? tr('审核并发送…','Review and send…') : tr('审核并模拟发送…','Review and simulate send…'),async () => {
            await action(async () => {
              const result = await call(scope,'customerPilot','send',{threadId:data.thread.id,draftId:data.draft.id,
                expectedRevision:data.thread.revision,text:reply.value.trim()});
              if (!result.canceled) await detail(data.thread.id);
            });
          },'customerAction','send',msg);
          conversation.append(form);
        }
      }
      modal.showModal();
      void action(listing);
    }
    return {render,openStyle,openCustomer};
  }
  global.OpenBotKnowledge = Object.freeze({mount});
})(window);
