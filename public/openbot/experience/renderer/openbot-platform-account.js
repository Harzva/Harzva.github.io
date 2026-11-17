(function (root) {
  'use strict';
  const doc = root.document;
  const categories = ['setting', 'chat', 'task'];
  const copy = {
    setting: ['设置', 'Settings'], chat: ['聊天', 'Chats'], task: ['任务', 'Tasks'],
    bot: ['Bot 设置', 'Bot settings'], message: ['消息', 'Messages']
  };
  const states = {
    idle: ['尚未同步', 'Not synced yet'], syncing: ['正在同步', 'Syncing'],
    synced: ['账户同步正常', 'Account sync is up to date'], ready: ['账户同步正常', 'Account sync is up to date'],
    offline: ['暂时离线', 'Offline'], error: ['同步失败', 'Sync failed'],
    conflict: ['需要处理同步冲突', 'Sync conflicts need attention'],
    revoked: ['此设备的登录已撤销', 'This device was signed out']
  };
  const errors = {
    DEVICE_REVOKED: ['此设备的登录已撤销，请重新登录。', 'This device was signed out. Sign in again.'],
    FLOW_EXPIRED: ['授权码已过期，请重新获取。', 'This code has expired. Get a new code.'],
    ACCESS_DENIED: ['GitHub 未授权本次登录。', 'GitHub authorization was declined.'],
    RATE_LIMITED: ['请求过于频繁，请稍后重试。', 'Too many requests. Try again shortly.'],
    NOT_CONFIGURED: ['此版本尚未配置账户服务。', 'The account service is not configured in this build.'],
    OFFLINE: ['暂时无法连接账户服务，请重试。', 'The account service is unreachable. Try again.'],
    STORAGE_UNAVAILABLE: ['此设备暂时无法安全保存登录，请检查系统钥匙串。', 'This device could not store your sign-in securely. Check the system keychain.'],
    SIGN_IN_REQUIRED: ['此设备的登录已失效，请重新登录。', 'This device’s sign-in expired or was revoked. Sign in again.'],
    RESOLVE_CONFLICT_FIRST: ['请先到「概览」处理这项设置的同步冲突，再保存。', 'Resolve this setting’s sync conflict in Overview before saving.'],
    ACCOUNT_CHANGED: ['当前账号已变更，请核对后重试。', 'The active account changed. Check the account and try again.'],
    BROWSER_FAILED: ['无法打开登录页面，请检查默认浏览器后重试。', 'Could not open the sign-in page. Check the default browser and try again.']
  };
  const providers = {
    casdoor: { marker: '智', name: ['智拓巨浪账号', 'Zhitro Wave account'] },
    github: { marker: 'GH', name: ['GitHub', 'GitHub'] },
    wechat: { marker: '微', name: ['微信', 'WeChat'] },
    google: { marker: 'G', name: ['Google', 'Google'] }
  };
  let active = null;

  function tr(zh, en) { return /^en\b/i.test(doc.documentElement.lang) ? en : zh; }
  function label(kind) { return Object.hasOwn(copy, kind) ? tr(...copy[kind]) : tr('记录', 'Record'); }
  function string(value, limit = 240) { return typeof value === 'string' ? value.slice(0, limit) : ''; }
  function date(value) {
    const time = typeof value === 'number' ? value : Date.parse(value);
    return Number.isFinite(time) && time > 0 ? new Date(time).toLocaleString(doc.documentElement.lang || undefined) : '';
  }
  function epoch(value) { return typeof value === 'number' ? value : Date.parse(value); }
  function list(value) { return Array.isArray(value) ? value : []; }
  function node(tag, name, text) {
    const el = doc.createElement(tag);
    if (name) el.className = name;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function button(key, title, callback, options = {}) {
    const el = node('button', options.primary ? 'btn btn-primary pa-primary' : 'btn pa-button', title);
    el.type = 'button';
    el.dataset.paKey = key;
    el.disabled = !!options.disabled;
    el.addEventListener('click', callback);
    return el;
  }
  function providerInfo(value) {
    return Object.hasOwn(providers, value) ? providers[value] : { marker: 'BS', name: ['Bot Studio', 'Bot Studio'] };
  }
  function providerName(value) {
    return tr(...providerInfo(value).name);
  }
  const BRAND_LOGOS = { wechat: 'wechat', github: 'github', google: 'google' };
  function brandLogoFile(value) { return BRAND_LOGOS[value] || null; }
  function loginMethod(key, title, description, callback, options = {}) {
    const el = button(key, '', callback, options);
    el.classList.add('pa-login-method');
    if (options.preferred) el.classList.add('is-preferred');
    const mark = node('span', 'pa-login-mark', '');
    mark.setAttribute('aria-hidden', 'true');
    const brandFile = brandLogoFile(options.provider || key);
    if (brandFile) {
      const img = doc.createElement('img');
      img.src = 'assets/brand-logos/' + brandFile + '.svg';
      img.alt = '';
      mark.classList.add('is-brand');
      mark.append(img);
    } else mark.append(doc.createTextNode(providerInfo(options.provider || key).marker));
    const copyEl = node('span', 'pa-login-copy');
    copyEl.append(node('strong', '', title), node('span', '', description));
    const state = node('span', 'pa-login-state', options.state || '');
    state.setAttribute('aria-hidden', 'true');
    el.replaceChildren(mark, copyEl, state);
    return el;
  }
  function note(text) { return node('p', 'pa-note', text); }
  function row(title, description, action) {
    const el = node('div', 'pa-row');
    const words = node('div', 'pa-row-copy');
    words.append(node('strong', '', title));
    if (description) words.append(note(description));
    el.append(words);
    if (action) el.append(action);
    return el;
  }
  function section(container, title) {
    const el = node('section', 'pa-section');
    if (title) el.append(node('h3', '', title));
    container.append(el);
    return el;
  }
  function actionResult(result) {
    if (!result || result.ok !== true) throw result || {};
    return result;
  }
  function errorText(error) {
    const code = String(error && (error.code || error.errorCode || error.error) || '').toUpperCase().replace(/^PLATFORM_/, '');
    return Object.hasOwn(errors, code) ? tr(...errors[code]) : tr('操作未完成，请重试。', 'The action could not finish. Try again.');
  }
  function request(s, action, input = {}) {
    return Promise.resolve().then(() => s.bridge.platformAccountAction({ action, input })).then(actionResult);
  }
  function live(s, generation = s.generation) { return active === s && generation === s.generation; }
  function clearTimer(s) { root.clearTimeout(s.timer); s.timer = 0; }
  function flowId(s) { return s.status && s.status.flow && s.status.flow.id; }
  function accountId(s) { return s.status && s.status.connected && s.status.account && s.status.account.id || ''; }
  function validFlow(flow) {
    return flow && flow.id && (flow.provider === 'wechat' ? !!flow.qrDataUrl && !!flow.label
      : flow.provider === 'casdoor' ? !!flow.label
      : !!flow.userCode) && (!flow.status || ['pending', 'authorization_pending', 'slow_down', 'waiting', 'review', 'approved'].includes(flow.status));
  }
  function setStatus(s, response) {
    const raw = response.status && typeof response.status === 'object' ? response.status : response;
    const next = raw && typeof raw === 'object' ? { ...raw } : raw;
    if (typeof next.connected !== 'boolean' && typeof next.configured !== 'boolean') return false;
    if (!next.providers && s.status?.providers) next.providers = s.status.providers;
    const previous = accountId(s);
    s.status = next;
    const account = accountId(s) ? next.account : null;
    // The persistent sidebar only needs public identity, never a flow code or sync data.
    doc.dispatchEvent(new CustomEvent('openbot:platform-account-status', { detail: {
      configured: next.configured === true, connected: !!account,
      account: account ? { id: account.id, provider: account.provider, login: account.login, displayName: account.displayName } : null
    } }));
    if (previous !== accountId(s)) {
      s.view = 'overview'; s.detail = null; s.recordState = null;
      s.recordGeneration++; s.confirm = null; s.selection.clear();
      s.deviceRequest = null; s.deviceError = '';
    }
    return true;
  }
  function schedulePoll(s) {
    clearTimer(s);
    if (!live(s) || accountId(s) || !validFlow(s.status && s.status.flow) || s.poll || s.busy) return;
    const flow = s.status.flow;
    const due = epoch(flow.nextPollAt);
    const expires = epoch(flow.expiresAt);
    const now = Date.now();
    if (Number.isFinite(expires) && expires <= now) return;
    const delay = Math.max(500, Number.isFinite(due) ? due - now : 5000);
    s.timer = root.setTimeout(() => {
      if (!live(s) || flowId(s) !== flow.id) return;
      if (Number.isFinite(expires) && expires <= Date.now()) return render(s);
      void poll(s, flow.id);
    }, Math.min(delay, Number.isFinite(expires) ? expires - now : delay, 2147483647));
  }
  async function refresh(s, generation = s.generation) {
    const result = await request(s, 'status');
    if (live(s, generation)) setStatus(s, result);
  }
  async function run(s, action, input = {}, options = {}) {
    if (!live(s) || s.busy) return;
    const previousFocus = doc.activeElement.dataset.paKey;
    const generation = ++s.generation;
    s.poll = null;
    clearTimer(s);
    s.busy = action;
    s.error = '';
    s.notice = '';
    render(s);
    try {
      const result = await request(s, action, input);
      if (!live(s, generation)) return;
      if (options.closeConfirm) s.confirm = null;
      if (action === 'publishLocal') s.selection.clear();
      const applied = setStatus(s, result);
      if (!applied && action !== 'openGitHub') await refresh(s, generation);
      if (!live(s, generation)) return;
      if (options.notice) s.notice = options.notice;
      if (options.reload && s.view !== 'overview' && accountId(s)) await loadRecords(s);
    } catch (error) {
      if (live(s, generation)) {
        s.error = errorText(error);
        try { await refresh(s, generation); } catch (_) { /* Retain the previous state and the error. */ }
      }
    } finally {
      if (live(s, generation)) {
        s.busy = '';
        const after = action === 'start' && validFlow(s.status && s.status.flow) ? 'github'
          : action === 'startCasdoor' && validFlow(s.status && s.status.flow) ? 'casdoor'
          : action === 'logout' && !accountId(s) ? 'start'
          : action === 'cancel' && !validFlow(s.status && s.status.flow) ? 'start'
          : options.closeConfirm && !s.confirm ? 'nav-overview' : previousFocus;
        render(s, after); schedulePoll(s);
        if (action === 'syncNow' && accountId(s)) void loadDevices(s);
      }
    }
  }
  async function poll(s, id) {
    if (!live(s) || s.poll || s.busy || flowId(s) !== id) return;
    clearTimer(s);
    const generation = s.generation;
    const current = {};
    s.poll = current;
    try {
      const result = await request(s, 'poll', { flowId: id });
      if (!live(s, generation) || s.poll !== current || flowId(s) !== id) return;
      if (!setStatus(s, result)) await refresh(s, generation);
      if (live(s, generation)) s.error = '';
    } catch (error) {
      if (!live(s, generation) || s.poll !== current) return;
      s.error = errorText(error);
      try { await refresh(s, generation); } catch (_) { /* Keep the retry action visible. */ }
    } finally {
      if (live(s, generation) && s.poll === current) {
        s.poll = null; render(s, accountId(s) ? 'nav-overview' : undefined); schedulePoll(s);
        if (accountId(s)) void loadDevices(s);
      }
    }
  }
  async function inspect(s) {
    const generation = s.generation;
    try { await refresh(s, generation); }
    catch (error) { if (live(s, generation)) s.error = errorText(error); }
    if (live(s, generation)) {
      s.loading = false; render(s);
      const initialAction = s.initialAction; s.initialAction = '';
      if (accountId(s) && s.expectedAccountId === accountId(s) && (initialAction === 'logout' || initialAction === 'switch')) confirm(s, initialAction);
      else if (!accountId(s) && initialAction === 'github' && s.status?.configured && (!validFlow(s.status.flow) || epoch(s.status.flow.expiresAt) <= Date.now())) { void run(s, 'start'); return; }
      else if (initialAction === 'github' && validFlow(s.status?.flow)) focusKey(s, 'github');
      else if (!accountId(s) && initialAction === 'wechat' && s.status?.configured && (!validFlow(s.status.flow) || epoch(s.status.flow.expiresAt) <= Date.now())) { void run(s, 'startWechat'); return; }
      else if (!accountId(s) && initialAction === 'casdoor' && s.status?.configured && (!validFlow(s.status.flow) || epoch(s.status.flow.expiresAt) <= Date.now())) { void run(s, 'startCasdoor'); return; }
      else if (initialAction === 'casdoor' && validFlow(s.status?.flow)) focusKey(s, 'casdoor');
      schedulePoll(s);
      if (accountId(s)) void loadDevices(s);
    }
  }
  async function loadDevices(s) {
    const account = accountId(s);
    if (!account || s.deviceRequest) return;
    const requestId = {};
    const generation = s.generation;
    const valid = () => live(s, generation) && accountId(s) === account && s.deviceRequest === requestId;
    s.deviceRequest = requestId; s.deviceError = '';
    try {
      const result = await request(s, 'devices');
      if (valid()) s.status = { ...s.status, devices: list(result.devices) };
    } catch (error) {
      if (valid()) {
        s.deviceError = errorText(error);
        try { await refresh(s, generation); } catch (_) { /* Retain any cached devices. */ }
      }
    } finally {
      if (live(s) && s.deviceRequest === requestId) s.deviceRequest = null;
      if (live(s, generation) && s.view === 'overview' && !s.confirm && !s.busy) render(s);
    }
  }
  async function checkAccount(s) {
    if (!live(s) || !accountId(s) || s.busy || s.checking) return;
    const generation = s.generation;
    const before = accountId(s);
    s.checking = true;
    try {
      await refresh(s, generation);
      if (live(s, generation) && before !== accountId(s)) render(s, accountId(s) ? 'nav-overview' : 'start');
    } catch (_) { /* The current view still reflects the last confirmed account status. */ }
    finally { s.checking = false; }
  }
  function boundary() {
    return note(tr('单独保存的密钥、登录凭据、文件和任务运行环境留在本机。', 'Stored keys, sign-in credentials, files, and task runtimes stay on this device.'));
  }
  function localServiceNote() {
    return note(tr('当前使用本机服务，仅用于同一台 Mac 上的隔离资料同步测试。跨设备同步需要各设备都能访问的账户服务。', 'The local service is for testing sync between isolated profiles on this Mac. Sync across devices requires an account service each device can reach.'));
  }
  function categoryList() {
    const el = node('ul', 'pa-scope');
    for (const kind of categories) el.append(node('li', '', label(kind)));
    return el;
  }
  function renderSignIn(s, container) {
    const status = s.status;
    if (s.loading) return container.append(note(tr('正在读取账户状态…', 'Checking account status…')));
    if (!status) return container.append(button('retry-status', tr('重试', 'Retry'), () => { s.error = ''; s.loading = true; render(s); void inspect(s); }, { primary: true }));
    const signIn = section(container);
    signIn.append(node('p', 'pa-lead', tr('登录后，在已授权的设备之间同步你选择的资料。', 'Sign in to sync the data you choose across authorized devices.')),
      status.localService ? localServiceNote() : note(tr('账号用于识别你和已登记设备。第三方应用授权会单独管理。', 'Your account identifies you and your registered devices. App permissions are managed separately.')),
      categoryList());
    if (!status.configured) return signIn.append(note(tr('此版本尚未配置账户服务。', 'The account service is not configured in this build.')));
    if (status.logoutRemotePending) signIn.append(note(tr('本机已退出，但未能确认账户服务已注销本次登录。', 'You are signed out locally. The account service did not confirm that it ended the session.')));
    if (status.sync && ['revoked', 'signed_out'].includes(status.sync.state)) signIn.append(note(tr('此设备的登录已失效。', 'This device’s sign-in is no longer valid.')));
    const flow = status.flow;
    const expires = flow && epoch(flow.expiresAt);
    const expired = Number.isFinite(expires) && expires <= Date.now();
    if (!validFlow(flow) || expired) {
      if (expired || (flow && flow.status === 'expired')) signIn.append(note(tr('授权码已过期，请重新获取。', 'This code has expired. Get a new code.')));
      if (flow && ['denied', 'access_denied'].includes(flow.status)) signIn.append(note(
        flow.provider === 'wechat' ? tr('微信未授权本次登录。', 'WeChat authorization was declined.')
          : flow.provider === 'casdoor' ? tr('智拓巨浪账号未授权本次登录。', 'Zhitro Wave account authorization was declined.')
          : tr('GitHub 未授权本次登录。', 'GitHub authorization was declined.')));
      const methods = section(container, tr('选择登录方式', 'Choose a sign-in method'));
      const available = status.providers || {};
      const casdoorAvailable = available.casdoor === true;
      methods.append(
        loginMethod('start-casdoor', tr('智拓巨浪账号', 'Zhitro Wave account'),
          casdoorAvailable ? tr('通过 Wave 自托管身份中心登录', 'Sign in through the self-hosted Wave identity center')
            : tr('尚未配置：账户服务未启用 Casdoor', 'Not configured: Casdoor is not enabled by the account service'),
          () => void run(s, 'startCasdoor'), { provider: 'casdoor', preferred: casdoorAvailable,
            disabled: s.busy || !casdoorAvailable, state: casdoorAvailable ? '' : tr('暂不可用', 'Unavailable') }),
        loginMethod('start-wechat', tr('微信', 'WeChat'), tr('使用手机扫码或在微信内确认', 'Scan on your phone or confirm in WeChat'),
          () => void run(s, 'startWechat'), { provider: 'wechat', preferred: !casdoorAvailable, disabled: s.busy }),
        loginMethod('start', 'GitHub', tr('使用一次性验证码登录', 'Sign in with a one-time code'),
          () => void run(s, 'start'), { provider: 'github', disabled: s.busy }),
        loginMethod('google', 'Google', tr('尚未配置：需要 Google 登录凭据', 'Not configured: Google credentials are required'),
          () => {}, { provider: 'google', disabled: true, state: tr('暂不可用', 'Unavailable') })
      );
      methods.append(note(tr('当前只启用已经验证的登录方式。Google 入口保留，但不会伪造登录结果。', 'Only verified sign-in methods are enabled. The Google entry stays visible and never fakes a result.')));
      return;
    }
    if (flow.provider === 'casdoor') {
      const auth = section(container, tr('在浏览器完成智拓巨浪登录', 'Finish signing in through Zhitro Wave'));
      const instructions = node('div', 'pa-auth-instructions');
      instructions.append(node('h4', '', tr('已打开登录页面', 'Sign-in page opened')),
        note(tr('在浏览器中完成 Wave 账号登录。返回 Bot Studio 后会自动检查结果。', 'Complete the Wave account sign-in in your browser. Bot Studio will check the result after you return.')));
      const label = node('code', 'pa-code', string(flow.label, 32));
      label.setAttribute('aria-label', tr('配对标记', 'Pairing code'));
      instructions.append(node('span', 'pa-field-label', tr('配对标记', 'Pairing code')), label);
      const actions = node('div', 'pa-actions');
      actions.append(
        button('casdoor', tr('重新打开登录页', 'Open sign-in page again'),
          () => void run(s, 'openCasdoor', { flowId: flow.id }), { primary: true, disabled: s.busy }),
        button('poll', tr('检查登录状态', 'Check sign-in'),
          () => void poll(s, flow.id), { disabled: s.busy || s.poll }),
        button('cancel', tr('取消登录', 'Cancel sign-in'),
          () => void run(s, 'cancel', { flowId: flow.id }), { disabled: s.busy })
      );
      instructions.append(actions,
        note(tr('登录结果只接受已签名的身份令牌；邮箱不会用于自动合并账号。', 'Only a signed identity token is accepted; email is never used to merge accounts automatically.')));
      auth.append(instructions);
      return;
    }
    if (flow.provider === 'wechat') {
      const auth = section(container, tr('用微信扫码登录', 'Sign in with WeChat'));
      const layout = node('div', 'pa-auth-grid');
      const qrColumn = node('div', 'pa-qr-column');
      const qr = string(flow.qrDataUrl, 500000);
      if (/^data:image\/gif;base64,[A-Za-z0-9+/]+={0,2}$/.test(qr)) {
        const image = node('img', 'pa-wechat-qr');
        image.src = qr; image.width = 200; image.height = 200;
        image.alt = tr('微信登录二维码', 'WeChat sign-in QR code');
        qrColumn.append(image);
      } else qrColumn.append(note(tr('无法显示二维码，请取消并重试。', 'Could not display the QR code. Cancel and try again.')));
      const instructions = node('div', 'pa-auth-instructions');
      instructions.append(node('h4', '', tr('在手机上确认', 'Confirm on your phone')),
        note(tr('使用微信扫一扫，核对下方配对标记后再确认。', 'Scan with WeChat, check the pairing code below, then confirm.')));
      const label = node('code', 'pa-code', string(flow.label, 32));
      label.setAttribute('aria-label', tr('配对标记', 'Pairing code'));
      instructions.append(node('span', 'pa-field-label', tr('配对标记', 'Pairing code')), label);
      const actions = node('div', 'pa-actions');
      actions.append(button('poll', tr('检查登录状态', 'Check sign-in'), () => void poll(s, flow.id), { disabled: s.busy || s.poll }),
        button('cancel', tr('取消登录', 'Cancel sign-in'), () => void run(s, 'cancel', { flowId: flow.id }), { disabled: s.busy }));
      instructions.append(actions, note(flow.status === 'review' ? tr('已扫码，请在微信中确认。', 'Scanned. Confirm in WeChat.') : tr('正在等待微信扫码。', 'Waiting for the WeChat scan.')),
        note(tr('二维码只在本次登录使用。如需切换登录方式，请先取消。', 'This QR code is only for this sign-in. Cancel before switching methods.')));
      layout.append(qrColumn, instructions);
      auth.append(layout);
      return;
    }
    const auth = section(container, tr('在 GitHub 确认登录', 'Confirm on GitHub'));
    const layout = node('div', 'pa-auth-grid pa-github-auth');
    const steps = node('div', 'pa-auth-instructions');
    steps.append(node('h4', '', tr('复制验证码', 'Copy the code')),
      note(tr('打开 GitHub 并输入下方验证码。授权完成后返回 Bot Studio。', 'Open GitHub, enter the code below, then return to OpenBot.')));
    const codeRow = node('div', 'pa-code-row');
    const code = node('code', 'pa-code', string(flow.userCode, 24));
    code.setAttribute('aria-label', tr('验证码', 'Verification code'));
    codeRow.append(code);
    if (root.navigator.clipboard && root.navigator.clipboard.writeText) codeRow.append(button('copy', tr('复制验证码', 'Copy code'), async () => {
      try { await root.navigator.clipboard.writeText(code.textContent); if (live(s)) { s.notice = tr('已复制验证码。', 'Code copied.'); render(s); } }
      catch (_) { if (live(s)) { s.error = tr('无法复制，请手动选择验证码。', 'Could not copy. Select the code manually.'); render(s); } }
    }));
    steps.append(codeRow);
    const actions = node('div', 'pa-actions');
    const input = { flowId: flow.id };
    actions.append(
      button('github', tr('打开 GitHub', 'Open GitHub'), () => void run(s, 'openGitHub', input), { primary: true, disabled: s.busy }),
      button('poll', tr('检查登录状态', 'Check sign-in'), () => void poll(s, flow.id), { disabled: s.busy || s.poll }),
      button('cancel', tr('取消登录', 'Cancel sign-in'), () => void run(s, 'cancel', input), { disabled: s.busy })
    );
    steps.append(actions, note(tr('正在等待 GitHub 授权。', 'Waiting for GitHub authorization.')),
      note(tr('验证码只用于本次登录。如需切换登录方式，请先取消。', 'This code is only for this sign-in. Cancel before switching methods.')));
    const githubMark = node('div', 'pa-auth-provider-mark');
    const githubMarkInner = node('span', 'pa-login-mark', providerInfo('github').marker);
    githubMarkInner.setAttribute('aria-hidden', 'true');
    githubMark.append(githubMarkInner, node('span', '', 'GitHub'));
    layout.append(githubMark, steps);
    auth.append(layout);
  }
  function count(sync, kind) { return Math.max(0, Number(sync.counts && sync.counts[kind]) || 0); }
  function enabledKinds(status) {
    return list(status && (status.enabledKinds || (status.sync && status.sync.enabledKinds)));
  }
  function confirm(s, kind, value) {
    if (kind === 'logout' || kind === 'switch') {
      const id = accountId(s);
      if (!id) return;
      const account = s.status.account;
      const login = string(account.login);
      value = { accountId: id, identity: account.provider === 'wechat'
        ? (string(account.displayName) || tr('微信用户', 'WeChat user'))
        : account.provider === 'casdoor'
          ? (string(account.displayName) || tr('智拓巨浪用户', 'Zhitro Wave user'))
          : login ? '@' + login : string(account.displayName) || 'GitHub' };
    }
    s.confirm = { kind, value };
    if (kind === 'publish') s.selection = new Set(enabledKinds(s.status));
    render(s, 'confirm-back', true);
  }
  function deviceRows(s, container, status) {
    const devices = section(container, tr('设备', 'Devices'));
    const shown = list(status.devices).filter(device => device && device.id && !device.revokedAt && !device.revoked);
    if (!shown.length && status.device && status.device.id) shown.push(status.device);
    if (s.deviceError) devices.append(row(s.deviceError, '', button('retry-devices', tr('刷新设备', 'Refresh devices'), () => void loadDevices(s), { disabled: s.busy })));
    else if (s.deviceRequest && !list(status.devices).length) devices.append(note(tr('正在读取设备…', 'Loading devices…')));
    else if (!shown.length) devices.append(note(tr('没有已登记设备。', 'No registered devices.')));
    for (const device of shown) {
      const current = device.current || (status.device && device.id === status.device.id);
      const name = string(device.name) || tr('未命名设备', 'Unnamed device');
      const detail = current ? tr('此设备', 'This device') : date(device.lastSeenAt);
      const revoke = current ? null : button('revoke:' + device.id, tr('撤销', 'Revoke'), () => confirm(s, 'revoke', { id: device.id, name }), { disabled: s.busy });
      if (revoke) revoke.setAttribute('aria-label', tr('撤销 ', 'Revoke ') + name);
      devices.append(row(name, detail, revoke));
    }
  }
  function renderOverview(s, container) {
    const status = s.status;
    const sync = status.sync || {};
    const account = status.account || {};
    const login = string(account.login);
    const isWechat = account.provider === 'wechat';
    const isCasdoor = account.provider === 'casdoor';
    const name = string(account.displayName) || (isWechat ? tr('微信用户', 'WeChat user')
      : isCasdoor ? tr('智拓巨浪用户', 'Zhitro Wave user')
      : login ? '@' + login : tr('已登录', 'Signed in'));
    const provider = providerName(account.provider) + (login && !isWechat && !isCasdoor && name !== '@' + login ? ' · @' + login : '');
    const identity = node('div', 'pa-identity');
    const avatar = node('div', 'pa-identity-avatar', '');
    avatar.setAttribute('aria-hidden', 'true');
    const avatarBrand = brandLogoFile(account.provider);
    if (avatarBrand) {
      const avatarImg = doc.createElement('img');
      avatarImg.src = 'assets/brand-logos/' + avatarBrand + '.svg';
      avatarImg.alt = '';
      avatarImg.className = 'pa-identity-brand';
      avatar.append(avatarImg);
    } else avatar.append(doc.createTextNode(providerInfo(account.provider).marker));
    const identityCopy = node('div', 'pa-identity-copy');
    const providerLine = node('span', 'pa-identity-provider');
    providerLine.append(node('span', '', provider), doc.createTextNode(' · ' + tr('已登录', 'Signed in')));
    identityCopy.append(node('strong', 'pa-identity-name', name), providerLine);
    const statusBadge = node('span', 'pa-status-badge', tr('账号正常', 'Signed in'));
    identity.append(avatar, identityCopy, statusBadge);
    container.append(identity);
    const security = section(container, tr('登录与安全', 'Sign-in & security'));
    security.append(
      row(tr('登录方式', 'Sign-in method'), provider, button('logout', tr('退出登录', 'Sign out'), () => confirm(s, 'logout'), { disabled: s.busy })),
      row(tr('本机保护', 'On this device'), tr('登录凭据由系统安全存储保护，不会显示在账号页。', 'Sign-in credentials are protected by system secure storage and never shown here.')),
      row(tr('账户归属', 'Account ownership'), tr('登录身份、同步资料和第三方应用授权分别管理。', 'Sign-in identity, synced data, and app permissions are managed separately.'))
    );
    const syncing = section(container, tr('同步', 'Sync'));
    const enabled = enabledKinds(status);
    const state = s.busy === 'syncNow' ? 'syncing' : sync.state;
    const last = date(sync.lastSyncedAt);
    const conflicts = list(sync.conflicts).length ? list(sync.conflicts) : list(status.conflicts);
    const syncNotes = [];
    if (last && enabled.length) syncNotes.push(tr('上次同步：', 'Last sync: ') + last);
    if (Number(sync.pending) > 0) syncNotes.push(tr('待同步：', 'Pending: ') + Number(sync.pending));
    const conflictCount = conflicts.length || Number(sync.conflicts) || 0;
    if (conflictCount > 0) syncNotes.push(tr('待处理冲突：', 'Conflicts: ') + conflictCount);
    const syncTitle = !enabled.length && ['synced', 'ready'].includes(state)
      ? tr('账户已连接', 'Account connected') : tr(...(Object.hasOwn(states, state) ? states[state] : states.idle));
    syncing.append(row(syncTitle, syncNotes.join(' · '), button('sync', tr('立即同步', 'Sync now'), () => void run(s, 'syncNow'), { disabled: s.busy })));
    if (status.localService) syncing.append(localServiceNote());
    for (const conflict of conflicts) {
      if (!conflict || !conflict.id) continue;
      const controls = node('div', 'pa-actions');
      for (const [choice, title] of [['remote', tr('保留账户版本', 'Keep account version')], ['local', tr('保留本机版本', 'Keep this device’s version')]]) {
        if (choice === 'local' && conflict.canKeepLocal === false) continue;
        controls.append(button('conflict:' + choice + ':' + conflict.id, title, () => confirm(s, 'conflict', { id: conflict.id, choice }), { disabled: s.busy }));
      }
      syncing.append(row(string(conflict.title) || label(conflict.kind), tr('两台设备修改了同一条记录。', 'The same record changed on two devices.'), controls));
    }
    if (status.localPublishAvailable !== false) syncing.append(row(
      tr('本机同步范围', 'Data synced from this device'),
      enabled.length ? enabled.map(label).join(tr('、', ', ')) : tr('尚未开启本机资料同步。', 'Sync from this device is off.'),
      button('publish', enabled.length ? tr('更改范围', 'Change scope') : tr('选择资料', 'Choose data'), () => confirm(s, 'publish'), { disabled: s.busy })
    ));
    syncing.append(boundary());
    deviceRows(s, container, status);
  }
  function renderConnections(s, container) {
    const panel = section(container, tr('连接应用', 'Connected apps'));
    panel.append(node('p', 'pa-lead', tr('第三方应用授权与 Bot Studio 登录分开管理。', 'App permissions are separate from your Bot Studio sign-in.')),
      note(tr('连接凭据不会出现在账号页，也不会因为登录同一账户自动授予应用操作权限。', 'App credentials never appear on this page, and signing in to the same account does not grant app actions.')));
    const list = section(container);
    list.append(
      row(tr('GitHub 应用授权', 'GitHub app permissions'), tr('在现有应用连接页为 Bot 分别授权资料或公开仓库读取。', 'Authorize profile or public-repository reads for each Bot on the existing Connected apps page.')),
      row(tr('账号数据', 'Account data'), tr('由“概览”管理；与应用凭据使用不同的存储和撤销路径。', 'Manage it in Overview. It uses separate storage and revocation from app credentials.'))
    );
    const controls = node('div', 'pa-actions');
    const manage = button('open-app-connections', tr('打开应用连接', 'Open Connected apps'), () => openConnections(s), {
      primary: true, disabled: s.busy || typeof s.onOpenConnections !== 'function'
    });
    controls.append(manage);
    panel.append(controls, boundary());
  }
  function recordPayload(record) { return (record && (record.payload || record.data || record.value)) || {}; }
  function recordTitle(record, kind) {
    const data = recordPayload(record);
    return string(data.title || data.name || record.title) || (kind === 'setting' ? settingTitle(string(data.key || record.key)) : '') || label(kind);
  }
  function settingTitle(key) {
    switch (key) {
      case 'theme': return tr('主题', 'Theme');
      case 'language': return tr('语言', 'Language');
      case 'chatFontSize': return tr('聊天字号', 'Chat text size');
      default: return '';
    }
  }
  function settingValue(value) {
    const titles = {
      system: ['跟随系统', 'System'], light: ['浅色', 'Light'], dark: ['深色', 'Dark'],
      'zh-CN': ['简体中文', 'Simplified Chinese'], en: ['英语', 'English']
    };
    return typeof value === 'number' ? String(value) : Object.hasOwn(titles, value) ? tr(...titles[value]) : '';
  }
  const preferenceOptions = {
    theme: ['system', 'light', 'dark'], language: ['system', 'zh-CN', 'en'],
    chatFontSize: [13, 14, 15, 16, 18, 20]
  };
  function renderPreferences(s, container, records) {
    const panel = section(container, tr('外观偏好', 'Appearance preferences'));
    panel.append(note(tr('在这里手动更改偏好会应用到此设备并保存到账户，即使未开启设置自动同步。', 'Manual changes here apply on this device and are saved to your account, even if automatic settings sync is off.')));
    for (const [key, values] of Object.entries(preferenceOptions)) {
      const current = records.find(record => record.kind !== 'bot' && recordPayload(record).key === key);
      const value = current && recordPayload(current).value;
      const select = node('select', 'pa-select');
      select.dataset.paKey = 'pref:' + key;
      select.setAttribute('aria-label', settingTitle(key));
      select.disabled = !!s.busy;
      const unset = node('option', '', tr('未同步', 'Not synced'));
      unset.disabled = true; unset.value = ''; select.append(unset);
      for (const entry of values) {
        const option = node('option', '', settingValue(entry));
        option.value = String(entry); select.append(option);
      }
      select.value = values.includes(value) ? String(value) : '';
      select.addEventListener('change', () => {
        const next = values.find(entry => String(entry) === select.value);
        if (next === undefined) return;
        void run(s, 'savePreference', { key, value: next }, { reload: true });
      });
      panel.append(row(settingTitle(key), '', select));
    }
  }
  function renderRecords(s, container) {
    const kind = s.detail ? 'message' : s.view;
    const items = s.recordState;
    if (s.detail) {
      container.append(button('back-chats', tr('返回聊天', 'Back to chats'), () => navigate(s, 'chat', null, true)), node('h3', 'pa-record-title', s.detail.title));
    }
    if (kind === 'task') container.append(note(tr('这里显示同步的任务记录。任务在原设备上运行。', 'Synced task records are shown here. Tasks run on their original devices.')));
    if (kind === 'setting') container.append(note(tr('此账户已同步的外观和 Bot 设置。', 'Appearance and Bot settings synced to this account.')));
    if (kind === 'chat' || kind === 'message') container.append(note(tr('这里显示同步的聊天记录。', 'This view shows synced conversation history.')));
    if (!items || items.loading) return container.append(note(tr('正在读取记录…', 'Loading records…')));
    if (items.error) return container.append(note(items.error), button('retry-records', tr('重试', 'Retry'), () => void loadRecords(s)));
    if (kind === 'setting') renderPreferences(s, container, items.records);
    if (!items.records.length) {
      if (kind !== 'setting') container.append(note(tr('此账户还没有这类同步记录。', 'No synced records of this kind in this account yet.')));
      return;
    }
    const records = section(container);
    for (const record of items.records) {
      const data = recordPayload(record);
      const title = recordTitle(record, kind);
      const updated = date(record.updatedAt || data.updatedAt || data.createdAt || data.ts);
      if (kind === 'chat') {
        const openChat = button('chat:' + record.id, tr('查看聊天', 'View chat'), () => navigate(s, 'chat', { id: record.id, title }, true));
        openChat.setAttribute('aria-label', tr('查看聊天：', 'View chat: ') + title);
        records.append(row(title, updated, openChat));
      } else if (kind === 'setting') {
        if (record.kind === 'bot') records.append(row(title, string(data.description) || updated));
      } else if (kind === 'task') {
        const statuses = {
          queued: ['排队中', 'Queued'], running: ['运行中', 'Running'], completed: ['已完成', 'Completed'],
          done: ['已完成', 'Completed'], failed: ['失败', 'Failed'], cancelled: ['已取消', 'Canceled'],
          canceled: ['已取消', 'Canceled'], interrupted: ['已中断', 'Interrupted'], waiting: ['等待中', 'Waiting']
        };
        const state = Object.hasOwn(statuses, data.status) ? tr(...statuses[data.status]) : tr('状态未知', 'Status unknown');
        const item = row(title, [state, string(data.hostLabel), updated].filter(Boolean).join(' · '));
        const body = string(data.result || data.summary || data.description, 24000);
        if (body) {
          const details = node('details', 'pa-details');
          details.append(node('summary', '', tr('任务详情', 'Task details')), node('p', 'pa-record-text', body));
          item.firstElementChild.append(details);
        }
        records.append(item);
      } else {
        const author = data.role === 'user' ? tr('用户', 'You') : data.role === 'assistant' ? 'Bot' : tr('消息', 'Message');
        const message = row(author, updated);
        message.firstElementChild.append(node('p', 'pa-record-text', string(data.text || data.content, 48000)));
        records.append(message);
      }
    }
  }
  async function loadRecords(s) {
    const account = accountId(s);
    if (!account || s.view === 'overview') return;
    const recordGeneration = ++s.recordGeneration;
    const detail = s.detail;
    const kind = detail ? 'message' : s.view;
    const valid = () => live(s) && accountId(s) === account && recordGeneration === s.recordGeneration;
    s.recordState = { loading: true };
    render(s);
    try {
      const result = await request(s, 'records', detail ? { kind, chatId: detail.id } : { kind });
      const bots = kind === 'setting' ? await request(s, 'records', { kind: 'bot' }) : null;
      if (!valid()) return;
      const time = record => epoch(recordPayload(record).createdAt || record.updatedAt) || 0;
      const records = list(result.records).filter(record => record && record.id);
      if (kind !== 'setting') records.sort((left, right) => kind === 'message' ? time(left) - time(right) : time(right) - time(left));
      if (bots) records.push(...list(bots.records).filter(record => record && record.id).map(record => ({ ...record, kind: 'bot' })));
      s.recordState = { records };
    } catch (error) {
      if (!valid()) return;
      s.recordState = { error: errorText(error) };
    }
    render(s);
  }
  function navigate(s, view, detail, fromDetails) {
    if (s.busy) return;
    const before = s.detail;
    s.view = view; s.detail = detail; s.confirm = null; s.error = ''; s.notice = '';
    s.recordGeneration++;
    s.recordState = null;
    render(s, fromDetails ? (detail ? 'back-chats' : 'nav-chat') : 'nav-' + view, true);
    if (view !== 'overview' && view !== 'connections') void loadRecords(s).then(() => {
      if (fromDetails && before && !s.detail && s.view === 'chat' && doc.activeElement.dataset.paKey === 'nav-chat') focusKey(s, 'chat:' + before.id);
    });
  }
  function renderConfirm(s, container) {
    const { kind, value } = s.confirm;
    let title, description, action, input, affirmative;
    const enabled = enabledKinds(s.status);
    const scopeChanged = () => categories.some(category => s.selection.has(category) !== enabled.includes(category));
    if (kind === 'publish') {
      title = tr('本机同步范围', 'Sync from this device');
      description = tr('所选类别的现有资料和后续变更将上传到账户服务。关闭某一类别会暂停该类别的自动上传，待上传和已同步的记录均保留。', 'Existing data and future changes in selected categories are uploaded to the account service. Turning off a category pauses its automatic uploads. Queued and previously synced records are kept.');
      action = 'publishLocal'; affirmative = tr('保存同步范围', 'Save sync scope');
    } else if (kind === 'revoke') {
      title = tr('撤销设备登录？', 'Sign this device out?');
      description = tr('该设备将停止同步，再次使用账户时需要登录：', 'This device will stop syncing and must sign in again: ') + value.name;
      action = 'revokeDevice'; input = { deviceId: value.id }; affirmative = tr('撤销设备', 'Revoke device');
    } else if (kind === 'conflict') {
      const local = value.choice === 'local';
      title = local ? tr('保留本机版本？', 'Keep this device’s version?') : tr('保留账户版本？', 'Keep the account version?');
      description = local ? tr('本机版本将替换该账户中的记录。', 'This device’s version will replace the record in the account.') : tr('账户中的版本将替换此设备的同步记录。', 'The account version will replace this device’s synced record.');
      action = 'resolveConflict'; input = value; affirmative = tr('确认保留', 'Keep version');
    } else if (kind === 'switch') {
      title = tr('切换 Bot Studio 账号？', 'Switch Bot Studio account?');
      description = tr('此设备将退出当前账号。然后你可以用另一种已启用的方式登录。本机原有资料仍可使用。', 'This device will sign out of the current account so you can sign in another way. Existing local data stays available.');
      action = 'logout'; input = { accountId: value.accountId }; affirmative = tr('退出并切换', 'Sign out and switch');
    } else {
      title = tr('退出 Bot Studio 账户？', 'Sign out of Bot Studio?');
      description = tr('此设备将停止同步，本机原有资料仍可使用。', 'Sync stops on this device. Your existing local data remains available.');
      action = 'logout'; input = { accountId: value.accountId }; affirmative = tr('退出登录', 'Sign out');
    }
    const el = section(container, title);
    if (action === 'logout') el.append(note(tr('当前账号：', 'Current account: ') + value.identity));
    el.append(note(description));
    if (kind === 'publish' && s.status.localService) el.append(localServiceNote());
    const controls = node('div', 'pa-actions');
    const submit = button('confirm-submit', affirmative, () => {
      if (action === 'publishLocal' && !scopeChanged()) return;
      void run(s, action, input || (action === 'publishLocal' ? { kinds: categories.filter(category => s.selection.has(category)) } : {}), {
        closeConfirm: true,
        notice: action === 'publishLocal' ? tr('同步范围已保存。', 'Sync scope saved.') : ''
      });
    }, { primary: true, disabled: s.busy || (kind === 'publish' && !scopeChanged()) });
    if (kind === 'publish') {
      const group = node('fieldset', 'pa-publish-choices');
      group.append(node('legend', '', tr('同步范围', 'Data to publish')));
      for (const category of categories) {
        const option = node('label', 'pa-choice');
        const check = node('input');
        check.type = 'checkbox'; check.checked = s.selection.has(category); check.disabled = !!s.busy;
        check.dataset.paKey = 'publish:' + category;
        check.addEventListener('change', () => {
          if (check.checked) s.selection.add(category); else s.selection.delete(category);
          submit.disabled = !scopeChanged();
        });
        option.append(check, node('span', '', label(category)));
        group.append(option);
      }
      el.append(group, note(tr('勾选聊天或设置时，对应的聊天正文或 Bot 人设会以纯文本上传。请先检查正文中是否包含敏感信息。', 'Selecting Chats or Settings uploads the corresponding chat or Bot persona text as plain text. Check that text for sensitive information first.')), boundary());
    }
    controls.append(button('confirm-back', tr('取消', 'Cancel'), () => cancelConfirm(s), { disabled: s.busy }), submit);
    el.append(controls);
  }
  function cancelConfirm(s) {
    const { kind, value } = s.confirm;
    s.confirm = null; s.error = ''; s.selection.clear();
    const key = kind === 'revoke' ? 'revoke:' + value.id : kind === 'conflict' ? 'conflict:' + value.choice + ':' + value.id : kind === 'switch' ? 'logout' : kind;
    render(s, key, true);
  }
  function focusKey(s, key) {
    const next = key && Array.from(s.dialog.querySelectorAll('[data-pa-key]')).find(el => el.dataset.paKey === key && !el.disabled);
    if (next) next.focus({ preventScroll: true });
    return !!next;
  }
  function openConnections(s) {
    if (!live(s) || s.busy || typeof s.onOpenConnections !== 'function') return;
    const callback = s.onOpenConnections;
    close(s);
    Promise.resolve().then(callback).catch(() => {});
  }
  function render(s, focus, resetScroll) {
    if (!live(s)) return;
    const currentFocus = s.dialog.contains(doc.activeElement) && doc.activeElement.dataset.paKey;
    const scroll = s.body.scrollTop;
    const status = s.status;
    s.title.setAttribute('aria-label', accountId(s) ? tr('Bot Studio 账户', 'Bot Studio account') : tr('登录 Bot Studio', 'Sign in to Bot Studio'));
    s.titleContext.textContent = accountId(s) ? tr('智拓巨浪 · Bot Studio 账户', 'Bot Studio account') : tr('智拓巨浪 · 登录 Bot Studio', 'Sign in to Bot Studio');
    s.feedback.textContent = s.error || s.notice;
    s.feedback.dataset.state = s.error ? 'error' : 'notice';
    s.body.replaceChildren();
    if (!accountId(s)) renderSignIn(s, s.body);
    else if (s.confirm) renderConfirm(s, s.body);
    else {
      const nav = node('nav', 'pa-nav');
      nav.setAttribute('aria-label', tr('账户页面', 'Account pages'));
      for (const view of ['overview', 'connections', ...categories]) {
        const amount = ['overview', 'connections'].includes(view) ? 0 : count(status.sync || {}, view);
        const title = view === 'overview' ? tr('概览', 'Overview') : view === 'connections' ? tr('连接应用', 'Connected apps') : label(view);
        const control = button('nav-' + view, title, () => navigate(s, view, null, false), { disabled: s.busy });
        control.setAttribute('aria-current', view === s.view ? 'page' : 'false');
        if (amount) control.append(node('span', 'pa-count', String(amount)));
        nav.append(control);
      }
      s.body.append(nav);
      if (s.view === 'overview') renderOverview(s, s.body);
      else if (s.view === 'connections') renderConnections(s, s.body);
      else renderRecords(s, s.body);
    }
    s.body.scrollTop = resetScroll ? 0 : scroll;
    if (focus || currentFocus) {
      if (!focusKey(s, focus || currentFocus) && doc.activeElement === doc.body) s.close.focus({ preventScroll: true });
    }
  }
  function close(s) {
    if (!live(s)) return;
    clearTimer(s); root.clearInterval(s.statusTimer);
    s.generation++; s.recordGeneration++; active = null;
    s.dialog.close(); s.dialog.remove();
    const opener = s.returnFocus && (s.returnFocus.isConnected ? s.returnFocus : doc.getElementById(s.returnFocus.id));
    if (opener) opener.focus({ preventScroll: true });
    doc.dispatchEvent(new CustomEvent('openbot:platform-account-closed'));
  }
  function open({ bridge = root.grokbot, returnFocus = doc.activeElement, initialAction = '', expectedAccountId, onOpenConnections } = {}) {
    if (active) { active.close.focus(); return; }
    const dialog = node('dialog', 'openbot-platform-account');
    dialog.id = 'openbot-platform-account';
    dialog.setAttribute('aria-labelledby', 'openbot-platform-account-title');
    dialog.setAttribute('aria-modal', 'true');
    const title = node('h2', 'pa-title');
    title.id = 'openbot-platform-account-title';
    title.append(node('span', 'pa-brand-name', 'zhitro wave'));
    const titleContext = node('span', 'pa-brand-context', tr('智拓巨浪 · 登录 Bot Studio', 'Sign in to Bot Studio'));
    title.append(titleContext);
    title.setAttribute('aria-label', tr('登录 Bot Studio', 'Sign in to Bot Studio'));
    const header = node('header', 'pa-header');
    const body = node('div', 'pa-body');
    const feedback = node('div', 'pa-feedback');
    feedback.setAttribute('role', 'status');
    const s = { dialog, title, titleContext, body, feedback, bridge, returnFocus, initialAction, expectedAccountId, onOpenConnections, status: null, loading: true, error: '', notice: '',
      timer: 0, generation: 0, recordGeneration: 0, view: 'overview', detail: null, recordState: null,
      confirm: null, selection: new Set(), poll: null, busy: '', deviceRequest: null, deviceError: '', checking: false };
    s.close = button('close', tr('关闭', 'Close'), () => close(s));
    header.append(title, s.close);
    dialog.append(header, feedback, body);
    const escape = () => {
      if (s.confirm && !s.busy) cancelConfirm(s);
      else close(s);
    };
    dialog.addEventListener('cancel', event => { event.preventDefault(); escape(); });
    dialog.addEventListener('keydown', event => {
      // The main window uses Escape and several shortcuts to control live tasks.
      event.stopPropagation();
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
      if (event.key === 'Escape') { event.preventDefault(); escape(); }
      if (event.key !== 'Tab') return;
      const controls = Array.from(dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary'))
        .filter(el => el.getClientRects().length && el.tabIndex >= 0);
      const target = event.shiftKey ? controls[0] : controls.at(-1);
      if (doc.activeElement === target) {
        event.preventDefault();
        (event.shiftKey ? controls.at(-1) : controls[0]).focus();
      }
    });
    active = s;
    doc.body.append(dialog);
    dialog.showModal();
    s.close.focus();
    render(s);
    if (!bridge || typeof bridge.platformAccountAction !== 'function') {
      s.loading = false; s.status = { configured: false, connected: false }; render(s); return;
    }
    s.statusTimer = root.setInterval(() => void checkAccount(s), 10000);
    void inspect(s);
  }
  root.OpenBotPlatformAccount = Object.freeze({ open });
})(window);
