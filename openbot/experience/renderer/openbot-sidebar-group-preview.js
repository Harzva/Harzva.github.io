(function (root) {
  'use strict';

  // Keep a value snapshot: the sidebar may edit its Bot objects in place while
  // the model is running. Reordering rows (for example, by pinning) is harmless.
  function snapshot(value) {
    const bots = Array.isArray(value?.bots) ? value.bots.map(bot => ({ id: bot?.id, name: bot?.name })) : [];
    return {
      scope: { mode: value?.scope?.mode, spaceId: value?.scope?.spaceId },
      brain: value?.brain && { id: value.brain.id, name: value.brain.name },
      bots, scopeLabel: value?.scopeLabel, assignmentsKey: value?.assignmentsKey, language: value?.language
    };
  }

  function signature(context) {
    const members = context.bots.map(bot => [bot.id, bot.name]).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
    return JSON.stringify([context.scope, context.brain, members, context.assignmentsKey, context.language]);
  }

  function checkedGroups(groups, bots) {
    if (!Array.isArray(groups) || !groups.length || groups.length > 24) return null;
    const remaining = new Set(bots.map(bot => bot.id));
    const names = new Set();
    const result = [];
    for (const group of groups) {
      const name = typeof group?.name === 'string' ? group.name.trim() : '';
      const key = name.normalize('NFKC').toLowerCase();
      if (!name || group.name.length > 64 || /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/u.test(group.name) ||
          names.has(key) || !Array.isArray(group.botIds) || !group.botIds.length) return null;
      names.add(key);
      for (const id of group.botIds) if (!remaining.delete(id)) return null;
      result.push({ name, botIds: [...group.botIds] });
    }
    return remaining.size ? null : result;
  }

  function mount({ dialog, trigger, getContext, request, apply, tr }) {
    const field = name => dialog.querySelector('[data-sg-' + name + ']');
    const title = field('title'), status = field('status'), list = field('list');
    const retry = field('retry'), cancel = field('cancel'), adopt = field('apply');
    const doc = dialog.ownerDocument;
    let token = 0, phase = 'closed', base = null, baseKey = '', draft = null;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');

    function reset() {
      ++token;
      base = null;
      baseKey = '';
      draft = null;
      list.replaceChildren();
    }

    function paint(next, message) {
      phase = next;
      title.textContent = tr('智能分组建议', 'Smart group suggestions');
      cancel.textContent = tr('取消', 'Cancel');
      retry.textContent = tr('重新生成', 'Generate again');
      adopt.textContent = tr('采用分组', 'Apply groups');
      const focused = doc.activeElement;
      retry.hidden = next !== 'error';
      adopt.disabled = next !== 'ready';
      cancel.disabled = next === 'applying';
      status.textContent = message;
      if (next === 'error' && focused === adopt) retry.focus();
      if ((next === 'loading' && focused === retry) || (next === 'checking' && focused === adopt)) cancel.focus();
    }

    function fail(message) {
      reset();
      paint('error', message);
    }

    function readContext() {
      try { return snapshot(getContext()); } catch (_) { return snapshot(null); }
    }

    function stillCurrent(id) {
      if (!dialog.open || token !== id) return false;
      if (baseKey !== signature(readContext())) {
        fail(tr('分组范围或 Bot 资料已变化，请重新生成建议。', 'The grouping scope or Bot details changed. Generate suggestions again.'));
        return false;
      }
      return true;
    }

    function refresh() {
      if (dialog.open && base && phase !== 'applying') stillCurrent(token);
    }

    function renderPreview(groups) {
      const names = new Map(base.bots.map(bot => [bot.id, bot.name || bot.id]));
      const nameCounts = new Map();
      for (const name of names.values()) nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
      for (const group of groups) {
        const section = doc.createElement('section');
        const heading = doc.createElement('h3');
        heading.textContent = group.name;
        const members = doc.createElement('ul');
        for (const id of group.botIds) {
          const item = doc.createElement('li');
          const name = names.get(id);
          item.textContent = nameCounts.get(name) > 1 ? name + ' (' + id + ')' : name;
          members.appendChild(item);
        }
        section.append(heading, members);
        list.appendChild(section);
      }
    }

    function payload(context) {
      return { scope: { ...context.scope }, botIds: context.bots.map(bot => bot.id), language: context.language };
    }

    function responseError(response, fallback) {
      return typeof response?.message === 'string' && response.message.trim() ? response.message : fallback;
    }

    async function generate() {
      reset();
      const id = token;
      base = readContext();
      baseKey = signature(base);
      if (!base.brain?.id) return fail(tr('请先指定主脑 Bot。', 'Choose a main Bot first.'));
      if (!base.bots.length) return fail(tr('当前范围没有可分组的 Bot。', 'There are no Bots to group in this scope.'));
      if (typeof base.assignmentsKey !== 'string' || base.bots.some(bot => typeof bot.id !== 'string' || !bot.id) ||
          new Set(base.bots.map(bot => bot.id)).size !== base.bots.length) {
        return fail(tr('Bot 清单尚未就绪，请稍后重试。', 'The Bot list is not ready. Try again shortly.'));
      }
      const name = base.brain.name || base.brain.id;
      paint('loading', tr(name + ' 正在为当前范围的 Bot 生成分组建议…', name + ' is suggesting groups for the Bots in this scope…'));
      let response;
      try { response = await request(payload(base)); } catch (_) { /* Handled below. */ }
      if (!stillCurrent(id)) return;
      if (response?.ok !== true) return fail(responseError(response, tr('未能获取主脑建议，请重试。', 'Could not get suggestions from the main Bot. Try again.')));
      const groups = checkedGroups(response.groups, base.bots);
      if (!groups || response.brain?.id !== base.brain.id || typeof response.scopeRevision !== 'string' || !response.scopeRevision) {
        return fail(tr('未收到当前主脑完整有效的分组建议，请重试。', 'The current main Bot did not return a complete, valid grouping. Try again.'));
      }
      draft = { groups, revision: response.scopeRevision };
      renderPreview(groups);
      const scope = base.scopeLabel || tr('当前范围', 'Current scope');
      paint('ready', tr(name + ' 为「' + scope + '」中的 ' + base.bots.length + ' 个 Bot 给出了分组建议。',
        name + ' suggested groups for ' + base.bots.length + ' Bots in ' + scope + '.'));
    }

    function close() {
      if (phase === 'applying') return;
      reset();
      phase = 'closed';
      if (dialog.open) dialog.close();
    }

    function open() {
      if (dialog.open) return;
      dialog.showModal();
      void generate();
      cancel.focus();
    }

    async function confirm() {
      if (phase !== 'ready' || !stillCurrent(token)) return;
      const id = token;
      paint('checking', tr('正在核对 Bot 清单…', 'Checking the Bot list…'));
      let response;
      try {
        response = await request({ ...payload(base), validateOnly: true, expectedBrainId: base.brain.id,
          expectedScopeRevision: draft.revision });
      } catch (_) { /* Handled below. */ }
      if (!stillCurrent(id)) return;
      if (response?.ok !== true || response.scopeRevision !== draft.revision) {
        return fail(responseError(response, tr('无法确认这份建议，请重新生成。', 'Could not verify these suggestions. Generate them again.')));
      }
      const groups = draft.groups, context = base;
      reset();
      const writeToken = token;
      paint('applying', tr('正在采用分组…', 'Applying groups…'));
      try {
        const saved = await apply(groups, context);
        if (saved === false || saved?.ok === false) throw new Error('apply rejected');
      } catch (_) {
        if (!dialog.open || token !== writeToken) return;
        return fail(tr('未能保存分组，请重新生成后再试。', 'Could not save the groups. Generate suggestions and try again.'));
      }
      if (!dialog.open || token !== writeToken) return;
      phase = 'done';
      close();
    }

    trigger?.addEventListener('click', open);
    retry.addEventListener('click', () => { if (phase === 'error') void generate(); });
    adopt.addEventListener('click', () => void confirm());
    cancel.addEventListener('click', close);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => {
      // A queued close event from a previous opening must not cancel a new one.
      if (!dialog.open) { reset(); phase = 'closed'; }
    });
    return { open, close, refresh };
  }

  const api = { mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.OpenBotSidebarGroupPreview = api;
})(typeof window !== 'undefined' ? window : null);
