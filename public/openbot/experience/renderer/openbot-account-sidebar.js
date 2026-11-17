(function (root) {
  'use strict';
  const doc = root.document;
  let mounted = false;
  let currentAccount = null;
  const avatarRevisions = new WeakMap();
  const tr = (zh, en) => /^en\b/i.test(doc.documentElement.lang) ? en : zh;
  // A neutral local contact silhouette, not a claimed signed-in identity.
  const localAvatar = '<svg viewBox="0 0 40 40" width="40" height="40" data-local-account-avatar="true" aria-hidden="true" focusable="false">'
    + '<circle cx="20" cy="14.5" r="6.2" fill="currentColor"/>'
    + '<path d="M16.6 20h6.8v5.3h-6.8z" fill="currentColor"/>'
    + '<path d="M6 38c.7-7.6 5.6-12.3 14-12.3S33.3 30.4 34 38H6Z" fill="currentColor"/></svg>';
  function el(tag, className, text) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  // Same local/data image boundary as the existing app-account avatar,
  // narrowed to raster photos. Never fetch an upstream tracking avatar URL.
  function safeAvatarURL(value) {
    if(typeof value!=='string'||value.length>1500000)return '';
    if(/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(value))return value;
    if(!/^(?:\.\/)?assets\/[a-z0-9_./-]+\.(?:png|jpe?g|webp)$/i.test(value))return '';
    if(value.replace(/^\.\//,'').split('/').some(part=>!part||part==='.'||part==='..'))return '';
    return value;
  }
  function accountView(value) {
    if (!value || typeof value.configured !== 'boolean' || typeof value.connected !== 'boolean') return { state: 'unavailable' };
    const account = value.account;
    if (!value.connected) return { state: value.configured ? 'signed-out' : 'unconfigured' };
    if (!account || !['github', 'wechat', 'casdoor'].includes(account.provider) || typeof account.id !== 'string' || !account.id || typeof account.login !== 'string') return { state: 'unavailable' };
    return { state: 'connected', provider: account.provider, id: account.id, login: account.login.trim().slice(0, 100), displayName: typeof account.displayName === 'string' ? account.displayName.trim().slice(0, 256) : '', avatarUrl: safeAvatarURL(account.avatarDataUrl || account.avatarUrl) };
  }
  function initial(value) {
    const name=String(value||'').trim();
    if(!name)return '';
    const first=typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(name))[0]?.segment:Array.from(name)[0];
    const upper=(first||'').toLocaleUpperCase();
    // Keep a short complete grapheme, never half of a surrogate pair.
    return upper.length<=16 && (!upper.isWellFormed || upper.isWellFormed()) ? upper : '';
  }
  function renderAvatar(node, account) {
    const revision = (avatarRevisions.get(node) || 0) + 1;
    avatarRevisions.set(node, revision);
    function fallback() {
      if (avatarRevisions.get(node) !== revision) return;
      const letter = initial(account?.displayName || account?.login);
      node.dataset.avatarKind = letter ? 'initial' : 'local';
      if (letter) node.textContent = letter;
      else node.innerHTML = localAvatar;
    }
    if (!account?.avatarUrl) { fallback(); return; }
    const image = el('img', 'ob-account-avatar-image');
    image.alt = ''; image.decoding = 'async'; image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', fallback, { once: true });
    node.replaceChildren(image); node.dataset.avatarKind = 'image'; image.src = account.avatarUrl;
  }
  function isCurrentAccount(id) {
    return id ? currentAccount?.id === id : !currentAccount;
  }
  function paintMessageAvatar(node, author) {
    const match = author && author.accountId && isCurrentAccount(author.accountId);
    renderAvatar(node, match ? currentAccount : author ? { displayName: author.name } : null);
  }
  function mount({ target, bridge, openSettings, onIdentityChange }) {
    if (mounted || !target) return;
    mounted = true;
    const sidebar = target.closest('#app-rail') || target.closest('#sidebar');
    const footer = target.closest('.ob-sidebar-account-footer');
    let footerActions = doc.getElementById('sidebar-footer-actions');
    if (!footerActions && footer) {
      footerActions = el('div', 'sidebar-footer-actions');
      footerActions.id = 'sidebar-footer-actions';
      footer.insertBefore(footerActions, target);
    }
    if (footerActions) footerActions.appendChild(target);
    const trigger = el('button', 'ob-account-trigger');
    trigger.id = 'ob-sidebar-account-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'ob-sidebar-account-menu');
    const avatar = el('span', 'ob-account-avatar');
    avatar.setAttribute('aria-hidden', 'true');
    const name = el('strong', 'ob-account-name');
    const meta = el('span', 'ob-account-meta');
    trigger.append(avatar);
    target.append(trigger);
    const menu = el('div', 'ob-account-menu');
    menu.id = 'ob-sidebar-account-menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    doc.body.append(menu);
    const accountGroup = el('div', 'ob-account-menu-account');
    accountGroup.setAttribute('role', 'group');
    const actionSeparator = el('div', 'ob-account-menu-separator');
    actionSeparator.setAttribute('role', 'separator');
    const actionGroup = el('div', 'ob-account-menu-actions');
    actionGroup.setAttribute('role', 'group');
    menu.append(accountGroup, actionSeparator, actionGroup);
    const sidebarActions = [
      { id: 'btn-hidden-bots', zh: '隐藏空间', en: 'Hidden Bots' },
      { id: 'btn-human-team', zh: '小组协作', en: 'Group collaboration' },
      { id: 'btn-cloud', zh: '连接云端', en: 'Connect cloud' },
      { id: 'btn-agents', zh: '智能体工作空间', en: 'Local agents' }
    ].map(spec => ({ ...spec, button: doc.getElementById(spec.id) })).filter(spec => spec.button);
    sidebarActions.forEach(({ button, zh, en }) => {
      button.classList.add('ob-account-menu-item');
      button.dataset.accountAction = button.id;
      button.setAttribute('role', 'menuitem');
      button.tabIndex = -1;
      const caption = button.querySelector(':scope > .ob-action-label');
      if (caption) {
        caption.setAttribute('data-i18n-zh', zh);
        caption.setAttribute('data-i18n-en', en);
      }
      button.removeAttribute('data-i18n-zh');
      button.removeAttribute('data-i18n-en');
      actionGroup.append(button);
    });
    let view = { state: 'loading' }, sequence = 0, pendingRefresh = null, avatarReady = false;
    let menuItems = [];

    function hide(restoreFocus) {
      if (menu.hidden) return;
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      menuItems = [];
      accountGroup.replaceChildren();
      if (restoreFocus && trigger.isConnected && trigger.getClientRects().length) trigger.focus({ preventScroll: true });
    }
    sidebarActions.forEach(({ button }) => button.addEventListener('click', () => hide(true)));
    function paint(next) {
      const identityChanged = next.state !== view.state || next.id !== view.id;
      const changed = next.state !== view.state || next.id !== view.id || next.provider !== view.provider || next.login !== view.login || next.displayName !== view.displayName || next.avatarUrl !== view.avatarUrl;
      if (changed) hide(menu.contains(doc.activeElement));
      view = next;
      if (identityChanged && onIdentityChange) {
        const detail = next.state === 'connected' ? { connected: true, account: { id: next.id } }
          : ['signed-out', 'unconfigured'].includes(next.state) ? { configured: next.state === 'signed-out', connected: false } : null;
        onIdentityChange(detail);
      }
      target.dataset.accountState = view.state;
      const connected = view.state === 'connected';
      const provider = connected && view.provider === 'wechat' ? tr('微信', 'WeChat') :
        connected && view.provider === 'casdoor' ? tr('Bot Studio 账号', 'Bot Studio account') : 'GitHub';
      const login = connected && view.provider === 'github' && view.login ? '@' + view.login : '';
      const title = connected ? view.displayName || login || provider : view.state === 'signed-out' ? tr('登录 Bot Studio', 'Sign in to Bot Studio') : tr('Bot Studio 账号', 'Bot Studio account');
      const subtitle = connected ? [login, provider].filter(Boolean).join(' · ')
        : view.state === 'signed-out' ? tr('选择登入方式', 'Choose sign-in method')
        : view.state === 'loading' ? tr('正在检查登录', 'Checking sign-in')
        : view.state === 'unconfigured' ? tr('账户服务未配置', 'Account service not configured')
        : tr('暂时无法读取账号', 'Account temporarily unavailable');
      if (changed || !avatarReady) {
        currentAccount = connected ? view : null;
        renderAvatar(avatar, currentAccount);
        avatarReady = true;
        doc.dispatchEvent(new Event('openbot:account-avatar-changed'));
      }
      name.textContent = title;
      meta.textContent = subtitle;
      trigger.title = [title, subtitle].filter(Boolean).join(' · ');
      trigger.setAttribute('aria-label', trigger.title);
    }
    async function refresh(force = false) {
      if ((!force && pendingRefresh) || !target.isConnected) return;
      if (!bridge || typeof bridge.platformAccountAction !== 'function') { paint({ state: 'unconfigured' }); return; }
      const current = ++sequence;
      pendingRefresh = current;
      try {
        const result = await bridge.platformAccountAction({ action: 'status', input: {} });
        if (current === sequence) paint(result && result.ok === true ? accountView(result.status || result) : { state: 'unavailable' });
      } catch (_) {
        if (current === sequence) paint({ state: 'unavailable' });
      } finally { if (pendingRefresh === current) pendingRefresh = null; }
    }
    function openAccount(initialAction) {
      const expectedAccountId = view.state === 'connected' ? view.id : undefined;
      hide(false);
      if (root.OpenBotPlatformAccount) root.OpenBotPlatformAccount.open({
        bridge,
        returnFocus: trigger,
        initialAction,
        expectedAccountId,
        onOpenConnections: typeof openSettings === 'function' ? () => openSettings('apps') : undefined
      });
    }
    function item(key, title, action, options = {}) {
      const control = el('button', 'ob-account-menu-item');
      control.type = 'button';
      control.tabIndex = -1;
      control.dataset.accountAction = key;
      control.setAttribute('role', 'menuitem');
      if (options.github) {
        const mark = el('span', 'ob-account-provider-icon');
        mark.setAttribute('aria-hidden', 'true');
        control.append(mark);
      }
      control.append(el('span', '', title));
      if (options.note) control.append(el('small', 'ob-account-menu-note', options.note));
      if (options.disabled) {
        control.disabled = true;
        control.setAttribute('aria-disabled', 'true');
      } else {
        menuItems.push(control);
        control.addEventListener('click', action);
      }
      accountGroup.append(control);
    }
    function place() {
      if (menu.hidden) return;
      const rect = trigger.getBoundingClientRect();
      if (!rect.width || !rect.height) { hide(false); return; }
      const width = Math.min(Math.max(218, rect.width), root.innerWidth - 16);
      menu.style.width = width + 'px';
      menu.style.left = Math.min(Math.max(8, rect.left), root.innerWidth - width - 8) + 'px';
      const down = root.innerHeight - rect.bottom - 14;
      const up = rect.top - 14;
      const height = menu.scrollHeight;
      const below = down >= height || down >= up;
      menu.style.maxHeight = Math.max(45, below ? down : up) + 'px';
      menu.style.top = (below ? rect.bottom + 5 : Math.max(8, rect.top - menu.offsetHeight - 5)) + 'px';
    }
    function show(last = false) {
      if (!menu.hidden) return;
      accountGroup.replaceChildren();
      const methods = view.state === 'signed-out';
      const title = methods ? tr('登入方式', 'Sign-in method') : tr('Bot Studio 账号', 'Bot Studio account');
      menu.setAttribute('aria-label', title);
      accountGroup.setAttribute('aria-label', methods ? tr('登入方式', 'Sign-in method') : tr('Bot Studio 账号', 'Bot Studio account'));
      actionGroup.setAttribute('aria-label', tr('应用操作', 'App actions'));
      const heading = el('div', 'ob-account-menu-heading');
      heading.setAttribute('aria-hidden', 'true');
      if (view.state === 'connected') heading.append(el('strong', '', name.textContent), el('span', '', meta.textContent));
      else heading.textContent = title;
      accountGroup.append(heading);
      if (methods) {
        item('github', 'GitHub', () => openAccount('github'), { github: true });
        item('wechat', tr('微信', 'WeChat'), () => openAccount('wechat'));
        item('google', 'Google', null, { disabled: true, note: tr('稍后支持', 'Coming later') });
      } else if (view.state === 'connected') {
        item('account', tr('账号与同步', 'Account and sync'), () => openAccount());
        item('switch', tr('切换账号', 'Switch account'), () => openAccount('switch'));
        item('logout', tr('退出登录', 'Sign out'), () => openAccount('logout'));
      } else {
        item('account', tr('查看账号状态', 'View account status'), () => openAccount());
      }
      sidebarActions.forEach(({ button, zh, en }) => {
        if (button.hidden) return;
        const label = tr(zh, en);
        const caption = button.querySelector(':scope > .ob-action-label');
        if (caption) caption.textContent = label;
        else {
          const iconNode = button.querySelector(':scope > .ob-icon');
          button.replaceChildren();
          if (iconNode) button.append(iconNode);
          button.append(el('span', 'ob-action-label', label));
        }
        button.title = label;
        button.setAttribute('aria-label', label);
        menuItems.push(button);
      });
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      place();
      (last ? menuItems.at(-1) : menuItems[0])?.focus({ preventScroll: true });
    }
    trigger.addEventListener('click', () => menu.hidden ? show() : hide(true));
    trigger.addEventListener('keydown', event => {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault(); event.stopPropagation(); show(event.key === 'ArrowUp');
      } else if (event.key === 'Escape' && !menu.hidden) {
        event.preventDefault(); event.stopPropagation(); hide(true);
      }
    });
    menu.addEventListener('keydown', event => {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); hide(true); return; }
      if (event.key === 'Tab') { hide(true); return; }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const index = menuItems.indexOf(doc.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? menuItems.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + menuItems.length) % menuItems.length;
      menuItems[next]?.focus({ preventScroll: true });
    });
    doc.addEventListener('pointerdown', event => {
      if (!menu.hidden && !menu.contains(event.target) && !trigger.contains(event.target)) hide(false);
    });
    doc.addEventListener('focusin', event => {
      if (!menu.hidden && !menu.contains(event.target) && !trigger.contains(event.target)) hide(false);
    });
    doc.addEventListener('openbot:platform-account-status', event => { ++sequence; paint(accountView(event.detail)); });
    doc.addEventListener('openbot:platform-account-closed', () => void refresh(true));
    root.addEventListener('resize', place);
    if (root.ResizeObserver && sidebar) new root.ResizeObserver(place).observe(sidebar);
    if (root.MutationObserver) new root.MutationObserver(() => { hide(menu.contains(doc.activeElement)); paint(view); }).observe(doc.documentElement, { attributeFilter: ['lang'] });
    root.addEventListener('blur', () => hide(false));
    root.addEventListener('focus', () => void refresh());
    root.setInterval(() => { if (!doc.hidden) void refresh(); }, 10000);
    paint(view);
    void refresh();
  }
  root.OpenBotAccountSidebar = Object.freeze({ mount, isCurrentAccount, paintMessageAvatar });
})(window);
