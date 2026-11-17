(function (root) {
  'use strict';

  var bridge = null;
  var personalMode = false;
  var initialized = false;
  var open = false;
  var lifeEpoch = 0;
  var statusEpoch = 0;
  var stateEpoch = 0;
  var messageEpoch = 0;
  var catalogEpoch = 0;
  var ssoProvidersEpoch = 0;
  var ssoFlowEpoch = 0;
  var pollTimer = null;
  var executionStatusSub = null;
  var pushRefreshTimer = null;
  var ssoPollTimer = null;
  var ssoStartPromise = null;
  var secureStorageBlocked = false;
  var secureStorageRetrying = false;
  var secureStorageEpoch = 0;
  var focusBefore = null;
  var composing = false;
  var actionBusy = false;
  var stateLoading = false;
  var messageLoading = false;
  var selectedTeamId = '';
  var selectedRoomId = '';
  var activePane = 'team';
  var botbarNavigation = null;
  var botbarMention = null;
  var connectionOpen = false;
  var statusTone = '';
  var statusMessage = '';
  var invitePreview = null;
  var createdInvite = null;
  var proposals = [];
  var proposalDrafts = Object.create(null);
  var messagesRoomId = '';
  var catalogProjects = [];
  var catalogBots = [];
  var catalogLoaded = false;
  var catalogLoading = false;
  var catalogError = '';
  var ssoProviderKey = null;
  var ssoProviders = [];
  var ssoProvidersLoaded = false;
  var ssoProvidersLoading = false;
  var ssoProvidersError = '';
  var ssoStarting = false;
  var ssoCancelling = false;
  var ssoFlow = null;
  var authCapabilitiesEpoch = 0;
  var authCapabilitiesKey = null;
  var authCapabilities = { passwordLogin: true, emailLogin: false, emailBinding: false };
  var authCapabilitiesLoaded = false;
  var authCapabilitiesLoading = false;
  var authCapabilitiesError = '';
  var authMode = 'employee';
  var accountPanel = '';
  var employees = [];
  var employeesLoaded = false;
  var employeesLoading = false;
  var employeesError = '';
  var employeesTruncated = false;
  var employeeListEpoch = 0;
  var employeeResetTarget = '';
  var employeeAssignmentOperationId = '';
  var employeeAssignmentSignature = '';
  var employeeBindingPendingEmail = '';
  var localBotList = [];
  var localBotsLoaded = false;
  var localBotsError = '';
  var mentionMemberId = '';
  var draft = Object.create(null);
  var model = { status: null, state: null, messages: null };
  var dom = Object.create(null);

  function tr(zh, en) {
    return root.OpenBotI18n && typeof root.OpenBotI18n.t === 'function' ? root.OpenBotI18n.t(zh, en) : zh;
  }
  function value(input, fallback) {
    return input === undefined || input === null ? (fallback === undefined ? '' : String(fallback)) : String(input);
  }
  function esc(input) {
    return value(input).replace(/[&<>"']/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
    });
  }
  function make(tag, className, text) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function operationId() {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    return 'human-team-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }
  function safeError(error) {
    var code = error && typeof error.code === 'string' ? error.code : '';
    if (!/^HT_[A-Z0-9_]{1,64}$/.test(code) && error && typeof error.message === 'string' && /^HT_[A-Z0-9_]{1,64}$/.test(error.message)) code = error.message;
    var messages = {
      CLOUD_SCREEN_OPEN: tr('这个 Bot 的桌面仍在使用，请关闭桌面后再更换执行主机。', 'This Bot’s desktop is still in use. Close it before changing hosts.'),
      CLOUD_BOT_BUSY: tr('这个 Bot 还有任务需要完成或核查，暂时不能更换执行连接。', 'This Bot has a pending task. Finish or reconcile it before changing its connection.'),
      CLOUD_BINDING_CHANGED: tr('Bot 的主机绑定已变化，请刷新设备列表后重试。', 'The Bot’s host binding changed. Refresh the devices and try again.'),
      CLOUD_SCREEN_UNVERIFIED: tr('暂时无法确认桌面状态，请恢复原连接后再更换主机。', 'The desktop state could not be verified. Restore its connection before changing hosts.'),
      REMOTE_DISCONNECTED: tr('设备的 Bot Studio 执行连接已断开，请重新连接。', 'The device’s Bot Studio execution connection is offline. Reconnect it.'),
      REMOTE_CONNECTING: tr('正在恢复设备连接，请稍后重试。', 'The device connection is recovering. Try again shortly.'),
      REMOTE_TARGET_MISMATCH: tr('设备与已绑定的执行主机不一致，请刷新后核对目标设备。', 'The device does not match the assigned host. Refresh and verify the target device.'),
      ZW_SOURCE_CHANGED: tr('资料已变化，请重新预览后再确认。', 'The record changed. Preview it again before confirming.'),
      ZW_PREVIEW_STALE: tr('预览已过期，请重新预览。', 'This preview expired. Preview the record again.'),
      ZW_FORBIDDEN: tr('当前账号已不在这个团队或没有权限，请刷新团队信息。', 'Your account is no longer a member or lacks access. Refresh the team.'),
      ZW_DEVICE_REVOKED: tr('这台设备的同步权限已被撤销，请联系团队管理员。', 'Sync access for this device was revoked. Contact your team admin.'),
      ZW_CANCELLED: tr('收集已暂停或登录状态已变化。', 'Collection paused or your sign-in changed.'),
      ZW_NO_VISIBLE_MESSAGES: tr('这条会话没有可收集的用户或助手文字。', 'This conversation has no collectable user or assistant text.'),
      ZW_OUTBOX_FULL: tr('本机同步队列已满，请先处理现有记录。', 'The local sync queue is full. Resolve existing records first.'),
      HT_AUTH_REQUIRED: personalMode ? tr('Bot Studio 账号登录状态已失效，请重新登录。', 'Your Bot Studio account sign-in expired. Please sign in again.') : tr('登录状态已失效，请重新登录。', 'Your sign-in expired. Please sign in again.'),
      HT_CLIENT_AUTH_REQUIRED: personalMode ? tr('Bot Studio 账号登录状态已失效，请重新登录。', 'Your Bot Studio account sign-in expired. Please sign in again.') : tr('登录状态已失效，请重新登录。', 'Your sign-in expired. Please sign in again.'),
      HT_SECURE_STORAGE_RETRY_REQUIRED: tr('安全存储未能打开，已暂停自动重试。请在需要时重试。', 'Secure storage could not be opened. Automatic retries are paused. Retry when needed.'),
      HT_SIGNOUT_PENDING: personalMode ? tr('本机协作已暂停。请完成退出，或重新登录后继续。', 'Local collaboration is paused. Finish signing out or sign in again to continue.') : tr('当前会话正在退出或暂停，请完成退出或重新登录后继续。', 'This session is signing out or paused. Finish signing out or sign in again to continue.'),
      HT_INVALID_CREDENTIALS: personalMode ? tr('账号或密码错误，请重试。', 'Account or password is incorrect. Try again.') : tr('工号或密码错误，请重试。', 'Employee number or password is incorrect. Try again.'),
      HT_PASSWORD_POLICY: tr('密码需为 8–128 个字符。', 'Passwords must be 8–128 characters.'),
      HT_PASSWORD_CHANGE_REQUIRED: personalMode ? tr('请先修改临时密码，再继续使用 Bot Studio 账号。', 'Change your temporary password before continuing with your Bot Studio account.') : tr('请先修改临时密码，再继续使用团队。', 'Change your temporary password before continuing.'),
      HT_TEMPORARY_PASSWORD_EXPIRED: personalMode ? tr('Bot Studio 账号的临时密码已过期，请联系 Bot Studio 服务方重置。', 'The temporary password for this Bot Studio account expired. Contact your Bot Studio service operator to reset it.') : tr('临时密码已过期，请联系团队管理员重置。', 'The temporary password expired. Ask your team admin to reset it.'),
      HT_EMPLOYEE_EXISTS: tr('这个员工号已被使用，请换一个员工号。', 'That employee number is already in use. Choose another.'),
      HT_EMPLOYEE_NOT_FOUND: tr('没有找到该员工，请刷新列表后重试。', 'Employee not found. Refresh the list and try again.'),
      HT_ACCOUNT_ADMIN_REQUIRED: tr('只有账号管理员可以管理员工账号。', 'Only an account admin can manage employee accounts.'),
      HT_EMAIL_ALREADY_BOUND: tr('这个账号已绑定邮箱。', 'This account already has a bound email.'),
      HT_EMAIL_IN_USE: tr('这个邮箱已关联其他账号，请换一个邮箱。', 'This email is already linked to another account. Use a different email.'),
      HT_EMAIL_VERIFICATION_FAILED: tr('邮箱验证码无效或已过期，请检查后重试。', 'The email code is invalid or expired. Check it and try again.'),
      HT_CREDENTIALS_ALREADY_SET: tr('这个账号已经设置了员工号和密码。', 'Employee credentials are already set for this account.'),
      HT_EMPLOYEE_INVALID_INPUT: tr('员工号或姓名格式无效，请检查后重试。', 'Employee number or name is invalid. Check the fields and try again.'),
      HT_EMPLOYEE_RATE_LIMIT: tr('操作过于频繁，请稍后再试。', 'Too many attempts. Try again later.'),
      HT_INVITE_USED: tr('这个邀请码已经使用，请向管理员申请新的邀请。', 'This invite code has already been used. Ask the admin for a new invite.'),
      HT_INVITE_INVALID: tr('邀请码已失效，请核对代码或联系管理员重新邀请。', 'This invite code has expired or is invalid. Check it or ask the admin for a new invite.'),
      HT_FORBIDDEN: tr('当前账号没有执行此操作或访问此内容的权限。', 'Your account is not allowed to perform this action or access this content.'),
      HT_STALE_REVISION: tr('团队信息已变化，请刷新后重新检查再试。', 'The team changed. Refresh, review the latest details, then try again.'),
      HT_CLIENT_NETWORK: personalMode ? tr('无法连接 Bot Studio 服务，请检查网络和服务地址后重试。', 'Could not reach the Bot Studio service. Check the network and service addresses, then try again.') : tr('无法连接团队服务，请检查网络和服务地址后重试。', 'Could not reach the team service. Check the network and service addresses, then try again.'),
      HT_MAIL_UNAVAILABLE: tr('邮箱验证暂不可用，请联系管理员检查邮件服务。', 'Email verification is unavailable. Ask the admin to check the mail service.'),
      HT_SSO_UNAVAILABLE: tr('公司单点登录暂时不可用，请重试或使用其他登录方式。', 'Company sign-in is temporarily unavailable. Retry or use another sign-in method.'),
      HT_SSO_EXPIRED: tr('公司登录请求已过期，请重新开始。', 'The company sign-in request expired. Start again.'),
      HT_SSO_CANCELLED: personalMode ? tr('本次账号操作已取消，请重试。', 'This account action was cancelled. Try again.') : tr('公司登录已取消。', 'Company sign-in was cancelled.'),
      HT_SSO_DENIED: tr('公司账号未获准登录此团队。', 'The company account was not approved for this team.'),
      HT_SSO_PENDING: tr('请在浏览器中完成公司登录。', 'Complete company sign-in in the browser.'),
      HT_SSO_BROWSER_FAILED: tr('无法打开公司登录浏览器，请重试或使用其他登录方式。', 'The company sign-in browser could not be opened. Retry or use another sign-in method.'),
      HT_IDENTITY_UNAVAILABLE: tr('身份服务暂时无法连接，请检查网络后重试。', 'The identity service is unavailable. Check the network and try again.'),
      HT_CLIENT_NOT_CONFIGURED: personalMode ? tr('请先配置 Bot Studio 账号与设备服务地址。', 'Configure the Bot Studio account and device service addresses first.') : tr('请先配置身份服务和团队节点地址。', 'Configure both the identity service and team node addresses first.'),
      HT_EXECUTOR_UNAVAILABLE: tr('所选成员的本机执行器当前不可用，群聊 AI 代班未启动；部门建议会独立使用主脑的私密调用。', 'The selected member’s local executor is unavailable, so group AI did not start. Department suggestions use a separate private call to the main Bot.'),
      HT_PROPOSAL_STALE: tr('这条建议已过期，请重新生成后再创建。', 'This suggestion is stale. Generate it again before creating the workspace.'),
      HT_PROPOSAL_INVALID: tr('未能生成可核对的建议，请调整目标后重试。', 'The suggestion could not be verified. Adjust the goal and try again.'),
      HT_AI_GRANT_UNAVAILABLE: tr('AI 代班授权当前不可用，没有启动任务。', 'The AI delegate grant is unavailable. No run was started.'),
      HT_AI_GRANT_REVOKED: tr('AI 代班授权已撤回，相关任务已停止。', 'The AI delegate grant was revoked and the run stopped.'),
      HT_AI_BUDGET: tr('这条消息已达到可启动的代班数量上限。', 'This message has reached the limit for AI delegates.'),
      HT_AI_DISABLED: tr('目标成员尚未授权 AI 代班，请先取得其授权。', 'The selected member has not authorized an AI delegate.'),
      HT_TAKEBACK_REQUIRED: tr('请先接回真人操作，再发送群消息。', 'Take back control before sending a human group message.'),
      HT_CLIENT_SIGN_OUT_REQUIRED: personalMode ? tr('请先退出 Bot Studio 账号，再修改服务地址。', 'Sign out of your Bot Studio account before changing the service addresses.') : tr('请先退出团队账号，再修改服务地址。', 'Sign out before changing the service addresses.'),
      HT_SIGNOUT_REQUIRED: personalMode ? tr('请先退出 Bot Studio 账号，再启动或调整本机节点。', 'Sign out of your Bot Studio account before starting or changing the local node.') : tr('请先退出团队账号，再启动或调整本机节点。', 'Sign out before starting or changing the local node.'),
      HT_NODE_IN_USE: tr('本机节点正在使用其他身份服务；请重启应用后再更换。', 'The local node is using another identity service. Restart the app before changing it.'),
      HT_CLIENT_HTTPS_REQUIRED: tr('远程服务地址必须使用 HTTPS；本机服务可使用 HTTP。', 'Remote service addresses must use HTTPS. Local services may use HTTP.'),
      HT_CLIENT_INVALID_URL: tr('服务地址无效，请检查 URL 后重试。', 'The service address is invalid. Check the URL and try again.'),
      HT_INVALID_URL: tr('服务地址无效，请检查 URL 后重试。', 'The service address is invalid. Check the URL and try again.'),
      HT_LAST_ADMIN: tr('请先完成管理员转让，再移除该成员。', 'Transfer admin first before removing this member.'),
      HT_TRANSFER_INVALID: tr('管理员转让已取消或过期，请重新发起。', 'This admin transfer was cancelled or expired. Start a new transfer.'),
      HT_NOT_FOUND: tr('团队内容已变化或不存在，请刷新后重试。', 'This team item changed or no longer exists. Refresh and try again.'),
      HT_CLIENT_SESSION_CHANGED: tr('登录状态已变化，请重新读取团队信息后继续。', 'Your sign-in changed. Reload the team state before continuing.'),
      HT_LIMIT: tr('已达到团队服务的数量上限。', 'The team service has reached an item limit.'),
      HT_NETWORK_DEVICE_OFFLINE: tr('设备离线或未启用接收任务。', 'The device is offline or task execution is disabled.'),
      HT_NETWORK_UNAVAILABLE: personalMode ? tr('Bot Studio 设备服务暂不可用。', 'The Bot Studio device service is unavailable.') : tr('设备服务暂不可用。', 'The device service is unavailable.'),
      HT_NETWORK_NO_READY_BOTS: personalMode ? tr('设备已连接，但还没有可以执行任务的 BOT；请先在目标设备配置模型。', 'The device is connected, but it has no Bot ready to run tasks. Configure a model on the target device first.') : tr('目标设备没有已配置模型且可执行任务的 BOT。', 'The target device has no configured Bot ready to run tasks.'),
      HT_NETWORK_ACCOUNT_CHANGED: tr('请登录保存此连接时使用的 Bot Studio 账号和服务。', 'Sign in to the Bot Studio account and service used to save this connection.'),
      HT_NETWORK_DEVICE_REVOKED: tr('此设备的连接已撤销。', 'This device connection was revoked.'),
      HT_NETWORK_EXECUTOR_UNAVAILABLE: tr('目标设备的 Node 执行器尚未就绪。', 'The target Node executor is not ready.'),
      HT_INVALID_INPUT: tr('部分信息无效，请检查输入后重试。', 'Some input is invalid. Review it and try again.')
    };
    return messages[code] || (personalMode ? tr('操作未完成，请检查连接、权限和输入后重试。', 'The action did not complete. Check the connection, access and input, then try again.') : tr('团队操作未完成，请检查连接、权限和输入后重试。', 'The team action did not complete. Check the connection, access and input, then try again.'));
  }
  function secureStorageError() {
    var error = new Error('HT_SECURE_STORAGE_RETRY_REQUIRED');
    error.code = 'HT_SECURE_STORAGE_RETRY_REQUIRED';
    return error;
  }
  function blockSecureStorage() {
    if (secureStorageBlocked) { secureStorageRetrying = false; return; }
    var moveFocus = !!(dom.dialog && dom.dialog.contains(root.document.activeElement));
    secureStorageBlocked = true;
    secureStorageRetrying = false;
    secureStorageEpoch++;
    lifeEpoch++;
    if (pollTimer) { root.clearInterval(pollTimer); pollTimer = null; }
    if (pushRefreshTimer) { root.clearTimeout(pushRefreshTimer); pushRefreshTimer = null; }
    clearSSOPollTimer();
    ssoProvidersEpoch++;
    ssoProviderKey = null;
    ssoProviders = [];
    ssoProvidersLoaded = false;
    ssoProvidersLoading = false;
    ssoProvidersError = '';
    ssoFlowEpoch++;
    ssoFlow = null;
    ssoStarting = false;
    ssoCancelling = false;
    ssoStartPromise = null;
    authCapabilitiesEpoch++;
    authCapabilitiesKey = null;
    authCapabilities = { passwordLogin: true, emailLogin: false, emailBinding: false };
    authCapabilitiesLoaded = false;
    authCapabilitiesLoading = false;
    authCapabilitiesError = '';
    statusEpoch++;
    stateEpoch++;
    messageEpoch++;
    catalogEpoch++;
    employeeListEpoch++;
    stateLoading = false;
    messageLoading = false;
    catalogLoading = false;
    employeesLoading = false;
    model.status = null;
    model.state = null;
    model.messages = null;
    messagesRoomId = '';
    setBusy(false);
    setStatus('', '');
    updateHeader();
    if (open) render();
    if (moveFocus && dom.content) {
      var retryButton = dom.content.querySelector('[data-action="retry-secure-storage"]');
      if (retryButton) retryButton.focus();
    }
  }
  function call(action, input) {
    if ((secureStorageBlocked || secureStorageRetrying) && action !== 'retrySecureStorage') return Promise.reject(secureStorageError());
    if (!bridge || typeof bridge.humanTeam !== 'function') {
      return Promise.reject(new Error(personalMode ? tr('Bot Studio 账号与设备服务尚未连接。请关闭后重试。', 'The Bot Studio account and device service is not connected. Close this window and try again.') : tr('真人团队服务尚未连接。请关闭后重试。', 'The human team service is not connected. Close this window and try again.')));
    }
    var result;
    var requestSecureStorageEpoch = secureStorageEpoch;
    try { result = bridge.humanTeam(action, input || {}); }
    catch (error) { return Promise.reject(error); }
    return Promise.resolve(result).then(function (response) {
      if (!response || response.ok === false) {
        if (response && response.code === 'HT_SECURE_STORAGE_RETRY_REQUIRED' && requestSecureStorageEpoch === secureStorageEpoch) blockSecureStorage();
        if (dom.overlay) dom.overlay.dataset.lastErrorCode = response && /^HT_[A-Z0-9_]{1,64}$/.test(response.code || '') ? response.code : 'HT_UNAVAILABLE';
        var error = new Error(response && (response.message || response.error) || (personalMode ? tr('Bot Studio 服务请求失败。', 'The Bot Studio service request failed.') : tr('团队服务请求失败。', 'The team service request failed.')));
        if (response && response.code) error.code = response.code;
        throw error;
      }
      return response;
    });
  }
  function live(ticket) { return open && ticket === lifeEpoch; }
  function setStatus(message, tone) {
    if (secureStorageBlocked) {
      statusMessage = '';
      statusTone = '';
      if (dom.status) dom.status.hidden = true;
      return;
    }
    statusMessage = value(message);
    statusTone = tone || '';
    if (!dom.status) return;
    dom.status.textContent = statusMessage;
    dom.status.dataset.tone = statusTone;
    dom.status.hidden = !statusMessage;
  }
  function isAccountAdmin() {
    return !!(model.status && model.status.signedIn && model.status.user && model.status.user.isAccountAdmin === true);
  }
  function personalCollaborationActive() { return personalMode && accountPanel === 'collaboration'; }
  function accountMenuMarkup(user) {
    var items = [];
    if (personalMode) {
      if (user && user.mustChangePassword !== true) {
        var personalNetwork = model.status && model.status.network;
        var personalCount = personalNetwork && personalNetwork.available ? (personalNetwork.devices || []).filter(function (d) { return !d.revoked; }).length : null;
        items.push('<button type="button" data-account-action="devices" data-focus-key="account-devices">' + esc(tr('我的设备', 'My devices') + (personalCount === null ? '' : ' (' + personalCount + ')')) + '</button>');
      }
      if (user && user.hasPassword === true && user.mustChangePassword !== true) items.push('<button type="button" data-account-action="change-password" data-focus-key="account-change-password">' + esc(tr('修改个人密码', 'Change personal password')) + '</button>');
      if (!items.length) items.push('<p class="ht-account-note">' + esc(tr('当前没有其他可用的账号设置。', 'No other account settings are available.')) + '</p>');
      return items.join('');
    }
    if (user && user.mustChangePassword !== true) {
      var network = model.status && model.status.network;
      var count = network && network.available ? (network.devices || []).filter(function (d) { return !d.revoked; }).length : null;
      items.push('<button type="button" data-account-action="devices" data-focus-key="account-devices">' + esc(tr('我的设备', 'My devices') + (count === null ? '' : ' (' + count + ')')) + '</button>');
    }
    if (user && user.isAccountAdmin === true) items.push('<button type="button" data-account-action="employees" data-focus-key="account-employees">' + esc(tr('员工管理', 'Employee management')) + '</button>');
    if (user && user.accountType === 'email' && user.hasPassword === false && authCapabilitiesLoaded && authCapabilities.passwordLogin) items.push('<button type="button" data-account-action="set-credentials" data-focus-key="account-set-credentials">' + esc(tr('设置工号和密码', 'Set employee number and password')) + '</button>');
    if (user && user.accountType === 'employee' && !user.email) {
      if (authCapabilities.emailBinding) items.push('<button type="button" data-account-action="bind-email" data-focus-key="account-bind-email">' + esc(tr('绑定邮箱', 'Bind email')) + '</button>');
      else items.push('<button type="button" disabled aria-describedby="ht-email-binding-unavailable">' + esc(tr('绑定邮箱', 'Bind email')) + '</button><p id="ht-email-binding-unavailable" class="ht-account-note">' + esc(tr('邮箱服务尚未配置，工号密码仍可使用。', 'Email service is not configured. Employee password sign-in remains available.')) + '</p>');
    }
    if (user && user.hasPassword === true && user.mustChangePassword !== true) items.push('<button type="button" data-account-action="change-password" data-focus-key="account-change-password">' + esc(tr('修改密码', 'Change password')) + '</button>');
    if (!items.length) items.push('<p class="ht-account-note">' + esc(tr('此账号没有其他可用设置。', 'No additional account settings are available.')) + '</p>');
    return items.join('');
  }
  function updateHeader() {
    if (!dom.accountMenu || !dom.signOut) return;
    if (dom.dialog) {
      var title = dom.dialog.querySelector('#ht-title');
      var subtitle = dom.dialog.querySelector('#ht-subtitle');
      var closeLabel = personalCollaborationActive() ? tr('关闭小组协作', 'Close group collaboration') : personalMode ? tr('关闭账号与设备', 'Close account and devices') : tr('关闭真人团队', 'Close human team');
      if (title) title.textContent = personalCollaborationActive() ? tr('Bot Studio 小组协作', 'Bot Studio group collaboration') : personalMode ? tr('账号与设备', 'Account and devices') : tr('真人团队', 'Human team');
      if (subtitle) subtitle.textContent = personalCollaborationActive() ? tr('Bot Studio 账号下的小组、成员与群聊', 'Groups, members and rooms on your Bot Studio account') : personalMode ? tr('Bot Studio 个人账号与设备', 'Personal Bot Studio account and devices') : tr('团队、部门工作空间与群聊', 'Teams, department workspaces and groups');
      if (dom.close) dom.close.setAttribute('aria-label', closeLabel);
    }
    var user = model.status && model.status.user;
    var current = user || (model.state && model.state.account);
    var summary = current ? [current.name, current.email || current.employeeNumber].filter(Boolean).join(' · ') : '';
    dom.accountMenu.hidden = secureStorageBlocked || !current;
    if (!current) dom.accountMenu.open = false;
    if (dom.accountSummary && dom.accountSummary.textContent !== summary) dom.accountSummary.textContent = summary;
    if (dom.accountSummary) dom.accountSummary.setAttribute('aria-label', current ? (personalMode ? tr('账号与设备：', 'Account and devices: ') : tr('账户选项：', 'Account options: ')) + summary : personalMode ? tr('账号与设备', 'Account and devices') : tr('账户选项', 'Account options'));
    if (dom.accountActions) dom.accountActions.setAttribute('aria-label', personalMode ? tr('账号与设备', 'Account and devices') : tr('账户选项', 'Account options'));
    var menuHTML = current ? accountMenuMarkup(current) : '';
    if (dom.accountActions && dom.accountActions.innerHTML !== menuHTML) dom.accountActions.innerHTML = menuHTML;
    dom.signOut.hidden = secureStorageBlocked || !(model.status && model.status.signedIn);
    dom.signOut.textContent = personalMode ? tr('退出 Bot Studio 账号', 'Sign out of Bot Studio') : tr('退出登录', 'Sign out');
  }
  function currentState() { return model.state || { account: null, teams: [], departments: [], members: [], rooms: [], transfers: [] }; }
  function teams() { return Array.isArray(currentState().teams) ? currentState().teams : []; }
  function departments() { return Array.isArray(currentState().departments) ? currentState().departments : []; }
  function members() { return Array.isArray(currentState().members) ? currentState().members : []; }
  function rooms() { return Array.isArray(currentState().rooms) ? currentState().rooms : []; }
  function transfers() { return Array.isArray(currentState().transfers) ? currentState().transfers : []; }
  function account() { return currentState().account || (model.status && model.status.user) || null; }
  function teamById(teamId) { return teams().filter(function (team) { return team.id === teamId; })[0] || null; }
  function selectedTeam() { return teamById(selectedTeamId); }
  function teamMember(teamId, memberId) { return members().filter(function (member) { return member.teamId === teamId && member.id === memberId; })[0] || null; }
  function myMember(teamId) {
    var current = account();
    return current ? members().filter(function (member) { return member.teamId === teamId && member.accountId === current.id; })[0] || null : null;
  }
  function ownTeamMembership() {
    var current = account();
    return current && selectedTeamId ? members().filter(function (member) { return member.teamId === selectedTeamId && member.accountId === current.id; })[0] || null : null;
  }
  function canUseCompanyData(team) {
    return !!(open && model.status && model.status.signedIn && model.state && team && team.id === selectedTeamId && myMember(team.id));
  }
  function companyDataContext() {
    var team = selectedTeam();
    if (!canUseCompanyData(team)) return null;
    var current = account();
    return {
      sessionId: lifeEpoch,
      accountId: current && current.id || '',
      teamId: team.id,
      teamName: team.name,
      departments: teamDepartments(team.id).map(function (department) { return { id: department.id, name: department.name }; }),
      call: call,
      errorText: safeError
    };
  }
  function teamDepartments(teamId) { return departments().filter(function (department) { return department.teamId === teamId; }); }
  function teamRooms(teamId) { return rooms().filter(function (room) { return room.teamId === teamId; }).sort(function (a, b) { return Number(!!a.departmentId) - Number(!!b.departmentId); }); }
  function roomForDepartment(departmentId) { return rooms().filter(function (room) { return room.departmentId === departmentId; })[0] || null; }
  function selectedRoom() { return rooms().filter(function (room) { return room.id === selectedRoomId; })[0] || null; }
  function isAdmin(team) { var current = account(); return !!(team && current && team.adminId === current.id); }
  function setDefaultRoom(teamId) {
    var list = teamRooms(teamId);
    if (!list.some(function (room) { return room.id === selectedRoomId; })) selectedRoomId = list.length ? list[0].id : '';
  }
  function formatDate(input) {
    var date = new Date(input);
    if (!Number.isFinite(date.getTime())) return value(input);
    var locale = root.OpenBotI18n && root.OpenBotI18n.locale === 'en' ? 'en-US' : 'zh-CN';
    try { return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }); }
    catch (_) { return date.toLocaleString(locale); }
  }
  function formatTime(input) {
    var date = new Date(input);
    if (!Number.isFinite(date.getTime())) return '';
    try { return date.toLocaleTimeString(root.OpenBotI18n && root.OpenBotI18n.locale === 'en' ? 'en-US' : 'zh-CN', { hour: '2-digit', minute: '2-digit' }); }
    catch (_) { return date.toLocaleTimeString(); }
  }
  function inputValue(key, fallback) { return Object.prototype.hasOwnProperty.call(draft, key) ? draft[key] : (fallback || ''); }
  function htmlRefs(refs) {
    if (!Array.isArray(refs) || !refs.length) return '<span class="ht-muted">' + esc(tr('尚未关联', 'None linked')) + '</span>';
    return refs.map(function (ref) { return '<span class="ht-ref">' + esc(ref.name || ref.id) + '</span>'; }).join('');
  }
  function relationNames(member) {
    var ids = Array.isArray(member.departmentIds) ? member.departmentIds : [];
    var names = departments().filter(function (department) { return ids.indexOf(department.id) >= 0; }).map(function (department) { return department.name; });
    return names.length ? names.join(' · ') : tr('仅团队总群', 'Team group only');
  }
  function captureFocus() {
    if (!dom.content) return null;
    var active = root.document.activeElement;
    if (!active || !dom.content.contains(active)) return null;
    var selection = null;
    try { selection = { start: active.selectionStart, end: active.selectionEnd, direction: active.selectionDirection }; } catch (_) { selection = null; }
    return { key: active.getAttribute('data-focus-key'), id: active.id, selection: selection };
  }
  function restoreFocus(snapshot) {
    if (!snapshot || !dom.content) return;
    var target = null;
    if (snapshot.key) {
      target = Array.prototype.filter.call(dom.content.querySelectorAll('[data-focus-key]'), function (node) { return node.getAttribute('data-focus-key') === snapshot.key; })[0] || null;
    }
    if (!target && snapshot.id) target = root.document.getElementById(snapshot.id);
    if (!target || typeof target.focus !== 'function') return;
    try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
    if (snapshot.selection && typeof target.setSelectionRange === 'function') {
      try { target.setSelectionRange(snapshot.selection.start, snapshot.selection.end, snapshot.selection.direction); } catch (_) { /* Selects and buttons do not expose text selection. */ }
    }
  }
  function focusables() {
    if (!dom.dialog) return [];
    return Array.prototype.filter.call(dom.dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'), function (node) {
      return !node.hidden && node.offsetParent !== null;
    });
  }
  function applyBusyState() {
    if (!dom.content) return;
    Array.prototype.forEach.call(dom.content.querySelectorAll('[data-lock-on-busy] input, [data-lock-on-busy] textarea, [data-lock-on-busy] select'), function (node) {
      if (actionBusy && !node.disabled) {
        node.disabled = true;
        node.dataset.disabledByBusy = 'true';
      } else if (!actionBusy && node.dataset.disabledByBusy === 'true') {
        node.disabled = false;
        delete node.dataset.disabledByBusy;
      }
    });
  }
  function setBusy(busy) {
    actionBusy = !!busy;
    if (dom.content) dom.content.setAttribute('aria-busy', String(actionBusy));
    Array.prototype.forEach.call(dom.content ? dom.content.querySelectorAll('[data-submit]') : [], function (button) { button.disabled = actionBusy || button.dataset.unavailable === 'true'; });
    applyBusyState();
  }
  function connectionMarkup() {
    var status = model.status || {};
    var identity = inputValue('identityURL', status.identityURL || '');
    var node = inputValue('nodeURL', status.nodeURL || '');
    var summary = status.configured
      ? (personalMode ? tr('Bot Studio 账号与设备服务地址已配置', 'Bot Studio account and device service addresses configured') : tr('服务地址已配置', 'Service addresses configured'))
      : (personalMode ? tr('尚未配置 Bot Studio 账号与设备服务地址', 'Bot Studio account and device service addresses are not configured') : tr('尚未配置团队服务地址', 'Team service addresses are not configured'));
    var identityLabel = personalMode ? tr('Bot Studio 账号服务 URL', 'Bot Studio account service URL') : tr('身份服务 URL', 'Identity service URL');
    var nodeLabel = personalMode ? tr('Bot Studio 设备服务 URL', 'Bot Studio device service URL') : tr('团队节点 URL', 'Team node URL');
    var localNodeHelp = personalMode
      ? tr('本机节点只在这台 Mac 保存协同数据。其他设备请填写服务提供方给出的地址。', 'The local node stores collaboration data only on this Mac. On other devices, enter the address provided by your service operator.')
      : tr('本机节点只保存团队数据在这台 Mac 上。其他设备请填写团队管理员提供的服务地址。', 'The local node stores team data on this Mac. On other devices, enter the service address provided by the team admin.');
    return '<div class="ht-service-row">' +
      '<span class="ht-service-state">' + esc(summary) + '</span>' +
      '<details class="ht-connection"' + (connectionOpen ? ' open' : '') + ' data-connection-details data-detail-key="connection">' +
        '<summary>' + esc(personalMode ? tr('服务设置', 'Service settings') : tr('连接设置', 'Connection settings')) + '</summary>' +
        '<form class="ht-connection-form" data-form="configure">' +
          '<label class="ht-field"><span>' + esc(identityLabel) + '</span><input type="url" name="identityURL" autocomplete="url" required maxlength="2048" data-focus-key="identity-url" value="' + esc(identity) + '"></label>' +
          '<label class="ht-field"><span>' + esc(nodeLabel) + '</span><input type="url" name="nodeURL" autocomplete="url" required maxlength="2048" data-focus-key="node-url" value="' + esc(node) + '"></label>' +
          '<div class="ht-local-node"><p class="ht-help">' + esc(localNodeHelp) + '</p>' + (status.signedIn ? '<p class="ht-help">' + esc(personalMode ? tr('启动本机节点前请先退出 Bot Studio 账号。', 'Sign out of Bot Studio before starting the local node.') : tr('启动本机节点前请先退出团队账号。', 'Sign out before starting the local node.')) + '</p>' : '') + '<button class="ht-button ht-quiet" type="button" data-action="start-local-node" data-focus-key="start-local-node"' + (status.signedIn ? ' disabled' : '') + '>' + esc(personalMode ? tr('在这台 Mac 保存本机数据', 'Store local data on this Mac') : tr('在这台 Mac 保存团队数据', 'Store team data on this Mac')) + '</button></div>' +
          '<button class="ht-button" type="submit" data-submit>' + esc(tr('保存地址', 'Save addresses')) + '</button>' +
        '</form>' +
      '</details>' +
    '</div>';
  }
  function closeConnectionSettings() {
    connectionOpen = false;
    if (personalMode && dom.overlay) dom.overlay.setAttribute('data-connection-open', 'false');
    var details = dom.content && dom.content.querySelector('[data-connection-details]');
    if (details) details.open = false;
  }
  function clearSSOPollTimer() {
    if (ssoPollTimer) { root.clearTimeout(ssoPollTimer); ssoPollTimer = null; }
  }
  function resetSSOProviders() {
    ssoProvidersEpoch++;
    ssoProviderKey = null;
    ssoProviders = [];
    ssoProvidersLoaded = false;
    ssoProvidersLoading = false;
    ssoProvidersError = '';
  }
  function loadSSOProviders(ticket, retry) {
    if (secureStorageBlocked || secureStorageRetrying || !live(ticket) || !model.status || !model.status.configured || model.status.signedIn) return Promise.resolve(null);
    if (ssoProvidersLoading || (ssoProvidersLoaded && !retry)) return Promise.resolve(null);
    var request = ++ssoProvidersEpoch;
    var configKey = ssoProviderKey;
    ssoProvidersLoading = true;
    ssoProvidersError = '';
    render();
    return call('ssoProviders', {}).then(function (response) {
      if (!live(ticket) || request !== ssoProvidersEpoch || configKey !== ssoProviderKey) return response;
      ssoProviders = (Array.isArray(response.providers) ? response.providers : []).filter(function (provider) {
        return provider && typeof provider.id === 'string' && provider.id.trim() && typeof provider.name === 'string' && provider.name.trim();
      }).slice(0, 8).map(function (provider) { return { id: provider.id, name: provider.name }; });
      ssoProvidersLoaded = true;
      ssoProvidersError = '';
      return response;
    }).catch(function (error) {
      if (live(ticket) && request === ssoProvidersEpoch && configKey === ssoProviderKey) {
        ssoProviders = [];
        ssoProvidersLoaded = true;
        ssoProvidersError = safeError(error);
      }
      return null;
    }).finally(function () {
      if (request === ssoProvidersEpoch && configKey === ssoProviderKey) {
        ssoProvidersLoading = false;
        if (live(ticket)) render();
      }
    });
  }
  function syncSSOProviders(ticket, status) {
    if (secureStorageBlocked || secureStorageRetrying) return;
    var nextKey = status && status.configured && !status.signedIn
      ? value(status.identityURL) + '\u0000' + value(status.nodeURL)
      : '';
    if (nextKey !== ssoProviderKey) {
      ssoProvidersEpoch++;
      ssoProviderKey = nextKey;
      ssoProviders = [];
      ssoProvidersLoaded = false;
      ssoProvidersLoading = false;
      ssoProvidersError = '';
    }
    if (nextKey && !ssoProvidersLoaded && !ssoProvidersLoading) loadSSOProviders(ticket, false);
  }
  function resetAuthCapabilities() {
    authCapabilitiesEpoch++;
    authCapabilitiesKey = null;
    authCapabilities = { passwordLogin: true, emailLogin: false, emailBinding: false };
    authCapabilitiesLoaded = false;
    authCapabilitiesLoading = false;
    authCapabilitiesError = '';
    authMode = 'employee';
  }
  function loadAuthCapabilities(ticket, configKey) {
    if (secureStorageBlocked || secureStorageRetrying || !live(ticket) || !model.status || !model.status.configured || authCapabilitiesLoading || authCapabilitiesLoaded) return Promise.resolve(null);
    var request = ++authCapabilitiesEpoch;
    authCapabilitiesLoading = true;
    authCapabilitiesError = '';
    render();
    return call('authCapabilities', {}).then(function (response) {
      if (!live(ticket) || request !== authCapabilitiesEpoch || configKey !== authCapabilitiesKey) return response;
      authCapabilities = {
        passwordLogin: response.passwordLogin !== false,
        emailLogin: response.emailLogin === true,
        emailBinding: response.emailBinding === true
      };
      authCapabilitiesLoaded = true;
      authCapabilitiesError = '';
      if (!authCapabilities.passwordLogin && authCapabilities.emailLogin) authMode = 'email';
      else if (!authCapabilities.emailLogin && authMode === 'email') authMode = 'employee';
      return response;
    }).catch(function () {
      if (live(ticket) && request === authCapabilitiesEpoch && configKey === authCapabilitiesKey) {
        authCapabilities = { passwordLogin: true, emailLogin: false, emailBinding: false };
        authCapabilitiesLoaded = false;
        authCapabilitiesError = tr('无法检查身份服务的登录方式。', 'Could not check identity-service sign-in methods.');
        if (authMode === 'email') authMode = 'employee';
      }
      return null;
    }).finally(function () {
      if (request === authCapabilitiesEpoch && configKey === authCapabilitiesKey) {
        authCapabilitiesLoading = false;
        if (live(ticket)) render();
      }
    });
  }
  function syncAuthCapabilities(ticket, status) {
    if (secureStorageBlocked || secureStorageRetrying) return;
    var nextKey = status && status.configured
      ? value(status.identityURL) + '\u0000' + value(status.nodeURL)
      : '';
    if (nextKey !== authCapabilitiesKey) {
      authCapabilitiesEpoch++;
      authCapabilitiesKey = nextKey;
      authCapabilities = { passwordLogin: true, emailLogin: false, emailBinding: false };
      authCapabilitiesLoaded = false;
      authCapabilitiesLoading = false;
      authCapabilitiesError = '';
      authMode = 'employee';
    }
    if (nextKey && !authCapabilitiesLoaded && !authCapabilitiesLoading) loadAuthCapabilities(ticket, nextKey);
  }
  function ssoMarkup() {
    if (!ssoProvidersLoading && !ssoProvidersError && !ssoProviders.length && !ssoStarting && !ssoCancelling && !ssoFlow) return '';
    var providers = ssoProviders.map(function (provider, index) {
      return '<button class="ht-button ht-sso-provider" type="button" data-sso-provider="' + esc(provider.id) + '" data-focus-key="sso-provider-' + index + '" aria-label="' + esc(tr('使用 ' + provider.name + ' 登录', 'Continue with ' + provider.name)) + '">' + esc(provider.name) + '</button>';
    }).join('');
    var state = '';
    if (ssoProvidersLoading) state = '<p class="ht-help" role="status">' + esc(tr('正在读取公司登录方式…', 'Loading company sign-in options…')) + '</p>';
    else if (ssoProvidersError) state = '<div class="ht-sso-error" role="alert"><p class="ht-error-copy">' + esc(ssoProvidersError) + '</p><button class="ht-button ht-quiet" type="button" data-action="retry-sso-providers" data-focus-key="retry-sso-providers">' + esc(tr('重试', 'Retry')) + '</button></div>';
    var pending = '';
    if (ssoStarting || ssoCancelling) {
      pending = '<p class="ht-help" role="status">' + esc(ssoCancelling ? tr('正在取消公司登录…', 'Cancelling company sign-in…') : tr('正在打开公司登录…', 'Opening company sign-in…')) + '</p>';
    } else if (ssoFlow) {
      pending = '<div class="ht-sso-pending" aria-live="polite"><p class="ht-help">' + esc(tr('请在浏览器中完成登录，并输入此应用显示的 6 位确认码。', 'Finish sign-in in the browser and enter the six-digit confirmation code shown in this app.')) + '</p><output class="ht-sso-code" aria-label="' + esc(tr('应用中的确认码', 'Confirmation code shown in this app')) + '">' + esc(ssoFlow.confirmationCode) + '</output><button class="ht-button ht-quiet" type="button" data-action="cancel-sso" data-focus-key="cancel-sso">' + esc(tr('取消公司登录', 'Cancel company sign-in')) + '</button></div>';
    }
    return '<section class="ht-sso" aria-labelledby="ht-sso-title" aria-busy="' + String(ssoProvidersLoading || ssoStarting || ssoCancelling) + '"><h3 id="ht-sso-title">' + esc(tr('公司单点登录', 'Company single sign-on')) + '</h3>' +
      (providers ? '<div class="ht-sso-providers">' + providers + '</div>' : '') + state + pending + '</section>';
  }
  function isCurrentSSO(ticket, request) { return live(ticket) && request === ssoFlowEpoch; }
  function scheduleSSOPoll(ticket, request) {
    if (secureStorageBlocked || secureStorageRetrying || !isCurrentSSO(ticket, request) || !ssoFlow) return;
    clearSSOPollTimer();
    ssoPollTimer = root.setTimeout(function () {
      ssoPollTimer = null;
      pollSSO(ticket, request);
    }, 2000);
  }
  function finishSSO(status, ticket, request) {
    if (secureStorageBlocked || secureStorageRetrying || !isCurrentSSO(ticket, request)) return Promise.resolve(status);
    clearSSOPollTimer();
    ssoFlow = null;
    ssoStarting = false;
    ssoFlowEpoch++;
    model.status = status;
    model.state = null;
    model.messages = null;
    messagesRoomId = '';
    updateHeader();
    setStatus(tr('公司账号已登录。', 'Company account signed in.'), 'ok');
    render();
    return refreshAll(ticket, true);
  }
  function pollSSO(ticket, request) {
    if (secureStorageBlocked || secureStorageRetrying || !isCurrentSSO(ticket, request) || !ssoFlow) return Promise.resolve(null);
    return call('pollSSO', {}).then(function (response) {
      if (!isCurrentSSO(ticket, request)) return response;
      if (response.pending === true) { scheduleSSOPoll(ticket, request); return response; }
      if (response.configured && response.signedIn && response.user) return finishSSO(response, ticket, request);
      var error = new Error('HT_SSO_UNAVAILABLE');
      error.code = 'HT_SSO_UNAVAILABLE';
      throw error;
    }).catch(function (error) {
      if (!isCurrentSSO(ticket, request)) return null;
      var code = error && (error.code || error.message);
      if (code === 'HT_SSO_PENDING') { scheduleSSOPoll(ticket, request); return null; }
      clearSSOPollTimer();
      ssoFlow = null;
      ssoStarting = false;
      ssoFlowEpoch++;
      setStatus(safeError(error), 'error');
      render();
      return null;
    });
  }
  function startSSO(providerId) {
    if (!open || secureStorageBlocked || secureStorageRetrying || actionBusy || ssoStarting || ssoCancelling || ssoFlow) return Promise.resolve(null);
    var ticket = lifeEpoch;
    var request = ++ssoFlowEpoch;
    ssoStarting = true;
    setStatus('', '');
    render();
    var startPromise = call('startSSO', { providerId: providerId }).then(function (response) {
      if (!isCurrentSSO(ticket, request)) return response;
      var code = value(response.confirmationCode);
      if (response.pending !== true || !/^\d{6}$/.test(code)) {
        var error = new Error('HT_SSO_UNAVAILABLE');
        error.code = 'HT_SSO_UNAVAILABLE';
        throw error;
      }
      ssoStarting = false;
      ssoFlow = { providerId: providerId, confirmationCode: code, expiresAt: value(response.expiresAt) };
      render();
      var cancel = dom.content && dom.content.querySelector('[data-action="cancel-sso"]');
      if (cancel) cancel.focus();
      scheduleSSOPoll(ticket, request);
      return response;
    }).catch(function (error) {
      if (isCurrentSSO(ticket, request)) {
        ssoStarting = false;
        ssoFlow = null;
        ssoFlowEpoch++;
        setStatus(safeError(error), 'error');
        render();
      }
      return null;
    });
    ssoStartPromise = startPromise;
    startPromise.then(function () { if (ssoStartPromise === startPromise) ssoStartPromise = null; });
    return startPromise;
  }
  function cancelSSOFlow(options) {
    options = options || {};
    if (personalMode) {
      clearSSOPollTimer();
      ssoFlowEpoch++;
      ssoFlow = null;
      ssoStarting = false;
      ssoCancelling = false;
      ssoStartPromise = null;
      return Promise.resolve(null);
    }
    var hadWork = !!(ssoFlow || ssoStarting || ssoStartPromise);
    if (!hadWork) return Promise.resolve(null);
    var ticket = lifeEpoch;
    var request = ++ssoFlowEpoch;
    var startPromise = ssoStartPromise;
    clearSSOPollTimer();
    ssoFlow = null;
    ssoStarting = false;
    ssoCancelling = true;
    if (options.render !== false && live(ticket)) render();
    var cancel = function () { return call('cancelSSO', {}); };
    var pending = startPromise ? Promise.resolve(startPromise).catch(function () {}).then(cancel) : cancel();
    return pending.then(function (response) {
      if (request === ssoFlowEpoch) {
        ssoCancelling = false;
        if (live(ticket) && options.message) setStatus(options.message, 'ok');
        if (live(ticket) && options.render !== false) {
          render();
          if (options.focusAfter) {
            var focusTarget = dom.content && (dom.content.querySelector('[data-sso-provider]') || dom.content.querySelector('[data-focus-key="auth-email"]'));
            if (focusTarget) focusTarget.focus();
          }
        }
      }
      return response;
    }).catch(function (error) {
      if (request === ssoFlowEpoch) {
        ssoCancelling = false;
        if (live(ticket)) {
          setStatus(safeError(error), 'error');
          if (options.render !== false) render();
        }
      }
      throw error;
    });
  }
  function authModeMarkup() {
    if (personalMode) {
      if (authCapabilitiesError) {
        return '<div class="ht-auth-capability" role="status"><span>' + esc(authCapabilitiesError) + '</span><button class="ht-button ht-quiet" type="button" data-action="retry-auth-capabilities" data-focus-key="retry-auth-capabilities">' + esc(tr('重试', 'Retry')) + '</button></div>';
      }
      if (authCapabilitiesLoading) return '<p class="ht-auth-capability" role="status">' + esc(tr('正在检查登录方式…', 'Checking sign-in methods…')) + '</p>';
      var personalMethods = [];
      if (authCapabilities.passwordLogin) personalMethods.push('<button type="button" class="ht-auth-mode' + (authMode === 'employee' ? ' is-active' : '') + '" data-auth-mode="employee" aria-pressed="' + String(authMode === 'employee') + '" data-focus-key="auth-mode-employee">' + esc(tr('账号和密码', 'Account and password')) + '</button>');
      if (authCapabilities.emailLogin) personalMethods.push('<button type="button" class="ht-auth-mode' + (authMode === 'email' ? ' is-active' : '') + '" data-auth-mode="email" aria-pressed="' + String(authMode === 'email') + '" data-focus-key="auth-mode-email">' + esc(tr('邮箱验证码', 'Email code')) + '</button>');
      if (personalMethods.length < 2) return '';
      return '<div class="ht-auth-mode-group" role="group" aria-label="' + esc(tr('登录方式', 'Sign-in method')) + '">' + personalMethods.join('') + '</div>';
    }
    var capabilityNote = '';
    if (authCapabilitiesError) {
      capabilityNote = '<div class="ht-auth-capability" role="status"><span>' + esc(authCapabilitiesError) + '</span><button class="ht-button ht-quiet" type="button" data-action="retry-auth-capabilities" data-focus-key="retry-auth-capabilities">' + esc(tr('重试', 'Retry')) + '</button></div>';
    } else if (authCapabilitiesLoading) {
      capabilityNote = '<p class="ht-auth-capability" role="status">' + esc(tr('正在检查身份服务的登录方式…', 'Checking identity-service sign-in methods…')) + '</p>';
    } else if (!authCapabilities.passwordLogin && authCapabilities.emailLogin) {
      capabilityNote = '<p class="ht-auth-capability" role="status">' + esc(personalMode ? tr('当前服务未启用账号密码登录，请使用邮箱验证码。', 'Account-and-password sign-in is unavailable. Use an email code.') : tr('需升级身份服务才能启用工号密码登录。', 'Upgrade the identity service to enable employee-password sign-in.')) + '</p>';
    } else if (!authCapabilities.passwordLogin && !authCapabilities.emailLogin) {
      capabilityNote = '<p class="ht-auth-capability" role="status">' + esc(personalMode ? tr('此身份服务没有可用的登录方式。', 'This identity service has no available sign-in method.') : tr('此身份服务没有可用的登录方式，请联系管理员。', 'This identity service has no available sign-in method. Contact the admin.')) + '</p>';
    } else if (!authCapabilities.emailLogin) {
      capabilityNote = '<p class="ht-auth-capability" role="status">' + esc(personalMode ? tr('邮箱验证码登录暂不可用；账号密码登录已启用。', 'Email-code sign-in is unavailable; account-and-password sign-in is enabled.') : tr('邮箱验证码登录/自助注册暂不可用；请联系管理员配置邮件服务。工号密码登录已启用。', 'Email sign-in and self-service registration are unavailable. Ask the admin to configure mail; employee password sign-in is enabled.')) + '</p>';
    }
    var emailLabel = authCapabilitiesLoading ? tr('邮箱登录（检查中）', 'Email sign-in (checking)') : tr('邮箱验证码登录/注册', 'Email code sign-in / register');
    return '<div class="ht-auth-mode-group" role="group" aria-label="' + esc(tr('登录方式', 'Sign-in method')) + '">' +
      '<button type="button" class="ht-auth-mode' + (authMode === 'employee' ? ' is-active' : '') + '" data-auth-mode="employee" aria-pressed="' + String(authMode === 'employee') + '" data-focus-key="auth-mode-employee"' + (authCapabilities.passwordLogin ? '' : ' disabled') + '>' + esc(personalMode ? tr('账号和密码', 'Account and password') : tr('工号和密码', 'Employee number and password')) + '</button>' +
      '<button type="button" class="ht-auth-mode' + (authMode === 'email' ? ' is-active' : '') + '" data-auth-mode="email" aria-pressed="' + String(authMode === 'email') + '" data-focus-key="auth-mode-email"' + (authCapabilities.emailLogin ? '' : ' disabled') + '>' + esc(emailLabel) + '</button>' +
      '</div>' +
      capabilityNote;
  }
  function employeeAuthForm() {
    if (!authCapabilities.passwordLogin) return '<p class="ht-help" role="status">' + esc(authCapabilities.emailLogin ? (personalMode ? tr('当前服务未启用账号密码登录，请使用邮箱验证码。', 'Account-and-password sign-in is unavailable. Use an email code.') : tr('需升级身份服务才能启用工号密码登录。', 'Upgrade the identity service to enable employee-password sign-in.')) : (personalMode ? tr('此身份服务没有可用的登录方式。', 'This identity service has no available sign-in method.') : tr('此身份服务没有可用的登录方式，请联系管理员。', 'This identity service has no available sign-in method. Contact the admin.'))) + '</p>';
    return '<form class="ht-auth-form" data-form="auth-password" data-lock-on-busy>' +
      '<label class="ht-field"><span>' + esc(personalMode ? tr('Bot Studio 账号', 'Bot Studio account') : tr('员工号', 'Employee number')) + '</span><input name="employeeNumber" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required minlength="1" maxlength="64" pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,63}" data-focus-key="auth-employee-number" value="' + esc(inputValue('authEmployeeNumber')) + '"></label>' +
      '<label class="ht-field"><span>' + esc(tr('密码', 'Password')) + '</span><input name="password" type="password" autocomplete="current-password" required minlength="8" maxlength="128" data-focus-key="auth-password"></label>' +
      '<div class="ht-form-actions"><button class="ht-button ht-primary" type="submit" data-focus-key="auth-password-submit" data-submit>' + esc(tr('登录', 'Sign in')) + '</button></div>' +
      (personalMode ? '' : '<p class="ht-help">' + esc(tr('工号密码在团队身份服务内验证，不需要邮箱。', 'Employee credentials are verified by the team identity service and do not require email.')) + '</p>') +
    '</form>';
  }
  function emailAuthForm() {
    var email = inputValue('email');
    var codeReady = !!(email && draft.otpSentEmail === email);
    return '<form class="ht-auth-form" data-form="auth" data-lock-on-busy>' +
      '<label class="ht-field"><span>' + esc(tr('邮箱', 'Email')) + '</span><input name="email" type="email" inputmode="email" autocomplete="email" required maxlength="254" data-focus-key="auth-email" value="' + esc(email) + '"></label>' +
      (codeReady ? '<label class="ht-field"><span>' + esc(tr('邮箱验证码', 'Email code')) + '</span><input name="otp" type="text" inputmode="numeric" autocomplete="one-time-code" required maxlength="12" data-focus-key="auth-otp" value="' + esc(inputValue('otp')) + '"></label>' +
        '<label class="ht-field"><span>' + esc(tr('显示名称（可选）', 'Display name (optional)')) + '</span><input name="name" type="text" autocomplete="name" maxlength="120" data-focus-key="auth-name" value="' + esc(inputValue('name')) + '"></label>' +
        '<p class="ht-help">' + esc(personalMode ? tr('验证码已发送到此邮箱。验证后可登录或创建 Bot Studio 个人账号。', 'A code was sent to this email. Verify it to sign in or create a personal Bot Studio account.') : tr('验证码已发送到此邮箱。验证通过后可创建邮箱账号。', 'A code was sent to this email. Verifying it can create an email account.')) + '</p>' : '') +
      '<div class="ht-form-actions"><button class="ht-button ht-primary" type="submit" data-auth-submit="' + (codeReady ? 'signIn' : 'sendCode') + '" data-focus-key="auth-submit" data-submit>' + esc(codeReady ? tr('验证并登录', 'Verify and sign in') : tr('发送验证码', 'Send code')) + '</button>' +
        (codeReady ? '<button class="ht-button ht-quiet" type="button" data-action="resend-code" data-focus-key="auth-resend">' + esc(tr('重新发送', 'Send again')) + '</button>' : '') +
      '</div>' +
    '</form>';
  }
  function authMarkup() {
    var status = model.status || {};
    var configured = !!status.configured;
    if (personalMode && !authCapabilities.passwordLogin && authCapabilities.emailLogin) authMode = 'email';
    else if (personalMode && authMode === 'email' && !authCapabilities.emailLogin) authMode = 'employee';
    var method = authMode === 'email' && authCapabilities.emailLogin ? emailAuthForm() : employeeAuthForm();
    var heading = personalMode ? (configured ? tr('登录 Bot Studio', 'Sign in to Bot Studio') : tr('配置 Bot Studio 服务', 'Configure Bot Studio services')) : (configured ? tr('登录团队账号', 'Sign in to your team') : tr('先配置团队服务', 'Configure the team service first'));
    var description = personalMode
      ? (configured ? tr('登录后管理账号和已连接设备。', 'Sign in to manage your account and connected devices.') : tr('填写服务提供方给出的账号与设备地址。', 'Enter the account and device addresses supplied by your service operator.'))
      : (configured ? tr('工号密码、已验证邮箱和公司单点登录均由团队身份服务验证；团队权限不按邮箱域名推断。', 'Employee credentials, verified email and company sign-in are checked by the team identity service. Team access is never inferred from an email domain.') : tr('服务地址由你或团队部署者提供；首次使用不会填入示例地址。', 'Use addresses supplied by your team or service operator. No example addresses are prefilled.'));
    return '<section class="ht-auth">' +
      '<div class="ht-auth-copy"><h2>' + esc(heading) + '</h2>' +
        '<p>' + esc(description) + '</p>' +
      '</div>' +
      (configured ? '<div class="ht-auth-methods">' + authModeMarkup() + (personalMode ? '' : ssoMarkup()) + method + '</div>' : '<p class="ht-help">' + esc(personalMode ? tr('展开“服务设置”，填写两项地址并保存。', 'Open Service settings, enter both addresses, and save.') : tr('展开“连接设置”填写两项服务地址，然后保存。', 'Open Connection settings, enter both service addresses, and save.')) + '</p>') +
    '</section>';
  }
  function accountPanelHeading(title, description, hideBack) {
    var back = hideBack ? '' : '<button type="button" class="ht-button ht-quiet" data-action="back-account" data-focus-key="account-back">' + esc(personalMode ? tr('返回我的设备', 'Back to my devices') : tr('返回团队', 'Back to team')) + '</button>';
    return '<div class="ht-account-page-heading">' + back + '<div><h2>' + esc(title) + '</h2><p>' + esc(description) + '</p></div></div>';
  }
  function devicePlatformLabel(platform) {
    return ({ darwin:'macOS', win32:'Windows', linux:'Linux', ios:'iOS', android:'Android' })[platform] || value(platform, tr('设备类型未知', 'Device type unknown'));
  }
  function deviceIcon(platform) {
    var mobile = platform === 'ios' || platform === 'android';
    return mobile
      ? '<svg class="ht-device-icon" viewBox="0 0 20 20" aria-hidden="true"><rect x="5.5" y="1.5" width="9" height="17" rx="1.8"></rect><path d="M8.5 4h3M9.2 15.7h1.6"></path></svg>'
      : '<svg class="ht-device-icon" viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="2.5" width="16" height="11" rx="1.4"></rect><path d="M7 17.5h6M10 13.5v4"></path></svg>';
  }
  function readyBotCountLabel(count) {
    if (Number.isSafeInteger(count) && count === 0) return tr('暂无可接任务的 Bot', 'No Bot is ready for tasks');
    return Number.isSafeInteger(count) && count > 0
      ? tr('可接任务 · ' + count + ' 个 Bot', count + ' ready ' + (count === 1 ? 'Bot' : 'Bots'))
      : tr('可接任务数量未知', 'Ready Bot count unknown');
  }
  function executionStateLabel(state) {
    return ({
      offline:tr('暂不可接任务', 'Not ready for tasks'),
      unconnected:tr('执行端未连接', 'Executor not connected'),
      unavailable:tr('当前没有可执行的 Bot', 'No Bot is ready to run tasks'),
      unknown:tr('执行能力未知', 'Execution availability unknown')
    })[state] || tr('执行能力未知', 'Execution availability unknown');
  }
  function renderDeviceRow(device, network) {
    var current = device.id === network.localDeviceId;
    var connected = device.online === true;
    var disconnected = device.online === false;
    var executor = device.executor === true;
    var reported = device.execution && typeof device.execution.state === 'string' ? device.execution.state : 'unknown';
    var executionState = disconnected ? 'offline' : !connected ? 'unknown' : device.executor === false ? 'controller' : !executor ? 'unknown' : reported;
    var executionLabel = executionState === 'ready'
      ? readyBotCountLabel(device.execution && device.execution.readyBotCount)
      : executionState === 'controller' ? tr('仅控制端', 'Controller only') : executionStateLabel(executionState);
    var executionReady = executionState === 'ready' && Number.isSafeInteger(device.execution && device.execution.readyBotCount) && device.execution.readyBotCount > 0;
    var openBotLabel = connected ? tr('Bot Studio 已连接', 'Bot Studio connected') : disconnected ? tr('Bot Studio 未连接', 'Bot Studio disconnected') : tr('Bot Studio 状态未知', 'Bot Studio status unknown');
    var taskLabel = executor ? tr('接收任务已开启', 'Task reception enabled') : device.executor === false ? tr('接收任务已关闭', 'Task reception disabled') : tr('接收任务设置未知', 'Task reception setting unknown');
    var lastSeen = '';
    if (disconnected) {
      var seenAt = device.lastSeen;
      var validSeenAt = typeof seenAt === 'number' && Number.isSafeInteger(seenAt) && seenAt > 0 && seenAt <= Date.now();
      var seenDate = validSeenAt ? new Date(seenAt) : null;
      lastSeen = '<span class="ht-device-last-seen">' + esc(seenDate && Number.isFinite(seenDate.getTime()) ? tr('上次连接：' + seenDate.toLocaleString(), 'Last connected: ' + seenDate.toLocaleString()) : tr('上次连接时间未知', 'Last connection time unknown')) + '</span>';
    }
    var actions = '';
    if (!current) {
      if (connected && executor) actions += '<button type="button" class="ht-button ht-quiet ht-device-connect" data-action="connect-device" data-device-id="' + esc(device.id) + '" data-focus-key="connect-device-' + esc(device.id) + '">' + esc(tr('连接并导入 BOT', 'Connect and import Bots')) + '</button>';
      actions += '<details class="ht-device-more" data-detail-key="device-more-' + esc(device.id) + '"><summary aria-label="' + esc(tr('更多设备操作：', 'More device actions: ') + value(device.name)) + '" title="' + esc(tr('更多', 'More')) + '">•••</summary><button type="button" class="ht-button ht-quiet ht-device-revoke" data-action="revoke-device" data-device-id="' + esc(device.id) + '" data-focus-key="revoke-device-' + esc(device.id) + '">' + esc(tr('撤销连接', 'Revoke connection')) + '</button></details>';
    }
    return '<li class="ht-device-row" data-device-id="' + esc(device.id) + '">' + deviceIcon(device.platform) +
      '<div class="ht-device-main"><div class="ht-device-title"><strong>' + esc(device.name) + '</strong><span class="ht-device-platform">' + esc(devicePlatformLabel(device.platform)) + '</span>' + (current ? '<span class="ht-device-current">' + esc(tr('本机', 'This device')) + '</span>' : '') + '</div>' +
      '<p class="ht-device-status"><span class="ht-device-presence' + (connected ? ' is-online' : '') + '"><span class="ht-device-dot" aria-hidden="true"></span>' + esc(openBotLabel) + '</span><span>' + esc(taskLabel) + '</span><span class="ht-device-execution' + (executionReady ? ' is-ready' : '') + '">' + esc(executionLabel) + '</span>' + lastSeen + '</p></div>' +
      (actions ? '<div class="ht-device-actions">' + actions + '</div>' : '') + '</li>';
  }
  function renderExecutionHost(host) {
    var connected = host.connected === true;
    var disconnected = host.connected === false;
    var state = typeof host.state === 'string' ? host.state : 'unknown';
    var readyCount = host.readyBotCount;
    var validReady = connected && state === 'ready' && Number.isSafeInteger(readyCount) && readyCount > 0;
    var availability = validReady ? readyBotCountLabel(readyCount) : connected && state === 'ready' ? Number.isSafeInteger(readyCount) && readyCount === 0 ? readyBotCountLabel(0) : tr('可执行状态未知', 'Execution availability unknown') : disconnected ? executionStateLabel('offline') : !connected ? executionStateLabel('unknown') : executionStateLabel(state);
    return '<li class="ht-device-row ht-host-row" data-host-id="' + esc(host.id) + '">' + deviceIcon('linux') +
      '<div class="ht-device-main"><div class="ht-device-title"><strong>' + esc(host.name) + '</strong>' + (host.isDefault ? '<span class="ht-device-current">' + esc(tr('默认', 'Default')) + '</span>' : '') + '</div>' +
      '<p class="ht-device-status"><span class="ht-device-presence' + (connected ? ' is-online' : '') + '"><span class="ht-device-dot" aria-hidden="true"></span>' + esc(connected ? tr('执行主机已连接', 'Execution host connected') : disconnected ? tr('执行主机未连接', 'Execution host disconnected') : tr('执行主机状态未知', 'Execution host status unknown')) + '</span><span class="ht-device-execution' + (validReady ? ' is-ready' : '') + '">' + esc(availability) + '</span></p></div></li>';
  }
  function coordinatorHostLabel(nodeURL) {
    if (typeof nodeURL !== 'string' || !nodeURL) return '';
    try {
      var parsed = new URL(nodeURL);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
      return parsed.host;
    } catch (_) { return ''; }
  }
  function renderPasswordPanel(forced) {
    var title = forced ? tr('先修改临时密码', 'Change your temporary password') : (personalMode ? tr('修改个人密码', 'Change personal password') : tr('修改密码', 'Change password'));
    var description = forced
      ? (personalMode ? tr('这是该 Bot Studio 账号的临时密码。修改后即可继续使用。', 'This is a temporary password for this Bot Studio account. Change it to continue.') : tr('这是管理员发放的临时密码。修改后才能进入团队。', 'An admin issued this temporary password. Change it before entering the team.'))
      : (personalMode ? tr('修改后仍使用当前 Bot Studio 个人账号。', 'You will keep using the same personal Bot Studio account.') : tr('修改后将继续使用当前账号和团队成员身份。', 'You will remain signed in with the same account and team membership.'));
    return '<section class="ht-account-page ht-password-page" data-account-panel="change-password">' +
      (forced ? '<div class="ht-account-page-heading"><div><h2>' + esc(title) + '</h2><p>' + esc(description) + '</p></div></div>' : accountPanelHeading(title, description)) +
      '<form class="ht-account-form" data-form="change-password" data-lock-on-busy>' +
        '<label class="ht-field"><span>' + esc(tr('当前密码', 'Current password')) + '</span><input name="currentPassword" type="password" autocomplete="current-password" required maxlength="128" data-focus-key="account-current-password"></label>' +
        '<label class="ht-field"><span>' + esc(tr('新密码', 'New password')) + '</span><input name="newPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128" data-focus-key="account-new-password"></label>' +
        '<label class="ht-field"><span>' + esc(tr('确认新密码', 'Confirm new password')) + '</span><input name="confirmPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128" data-focus-key="account-confirm-password"></label>' +
        '<p class="ht-help">' + esc(tr('密码需为 8–128 个字符。提交后请妥善保管。', 'Use 8–128 characters and keep the new password safe.')) + '</p>' +
        '<div class="ht-form-actions"><button class="ht-button ht-primary" type="submit" data-submit>' + esc(forced ? tr('保存并继续', 'Save and continue') : tr('保存新密码', 'Save new password')) + '</button>' +
          (forced ? '' : '<button class="ht-button ht-quiet" type="button" data-action="back-account" data-focus-key="account-cancel">' + esc(tr('取消', 'Cancel')) + '</button>') +
        '</div>' +
      '</form></section>';
  }
  function renderCredentialSetupPanel() {
    var user = model.status && model.status.user || {};
    if (user.accountType !== 'email' || user.hasPassword !== false || !authCapabilitiesLoaded || !authCapabilities.passwordLogin) {
      return '<section class="ht-account-page" data-account-panel="set-credentials">' + accountPanelHeading(tr('设置工号和密码', 'Set employee number and password'), tr('此账号当前不可设置员工凭据。', 'Employee credentials cannot be set for this account.')) + '</section>';
    }
    return '<section class="ht-account-page" data-account-panel="set-credentials">' +
      accountPanelHeading(tr('设置工号和密码', 'Set employee number and password'), tr('这会在同一邮箱账号上增加工号登录，不会更换账号或团队成员身份。', 'Add employee-number sign-in to this email account. Your account and team membership stay the same.')) +
      '<form class="ht-account-form" data-form="set-credentials" data-lock-on-busy>' +
        '<label class="ht-field"><span>' + esc(tr('员工号', 'Employee number')) + '</span><input name="employeeNumber" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required minlength="1" maxlength="64" pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,63}" data-focus-key="credentials-employee-number" value="' + esc(inputValue('credentialsEmployeeNumber')) + '"></label>' +
        '<label class="ht-field"><span>' + esc(tr('新密码', 'New password')) + '</span><input name="password" type="password" autocomplete="new-password" required minlength="8" maxlength="128" data-focus-key="credentials-password"></label>' +
        '<label class="ht-field"><span>' + esc(tr('确认新密码', 'Confirm new password')) + '</span><input name="confirmPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128" data-focus-key="credentials-confirm-password"></label>' +
        '<p class="ht-help">' + esc(tr('工号需为 1–64 个英文字母、数字、点、下划线或连字符，保存时会规范为小写。密码需为 8–128 个字符。', 'Use 1–64 ASCII letters, numbers, dots, underscores or hyphens for the employee number; it is normalized to lowercase. Passwords must be 8–128 characters.')) + '</p>' +
        '<div class="ht-form-actions"><button class="ht-button ht-primary" type="submit" data-submit>' + esc(tr('保存凭据', 'Save credentials')) + '</button><button class="ht-button ht-quiet" type="button" data-action="back-account" data-focus-key="account-cancel">' + esc(tr('取消', 'Cancel')) + '</button></div>' +
      '</form></section>';
  }
  function renderEmailBindingPanel() {
    var user = model.status && model.status.user || {};
    if (user.accountType !== 'employee' || user.email) {
      return '<section class="ht-account-page" data-account-panel="bind-email">' + accountPanelHeading(tr('绑定邮箱', 'Bind email'), tr('此账号当前不可绑定新邮箱。', 'A new email cannot be bound to this account.')) + '</section>';
    }
    if (!authCapabilities.emailBinding) {
      return '<section class="ht-account-page" data-account-panel="bind-email">' + accountPanelHeading(tr('绑定邮箱', 'Bind email'), tr('邮件服务尚未配置；员工号和密码仍可使用。', 'Email service is not configured. Employee number and password remain available.')) + '<p class="ht-account-note">' + esc(authCapabilitiesError || tr('请联系团队管理员启用邮件服务后再绑定邮箱。', 'Ask the team admin to enable mail before binding an email.')) + '</p></section>';
    }
    if (!employeeBindingPendingEmail) {
      return '<section class="ht-account-page" data-account-panel="bind-email">' +
        accountPanelHeading(tr('绑定邮箱', 'Bind email'), tr('首次绑定需要验证邮箱。绑定会保留当前账号和团队成员身份。', 'Verify the email to bind it. Your account and team membership will remain the same.')) +
        '<form class="ht-account-form" data-form="request-email-binding" data-lock-on-busy>' +
          '<label class="ht-field"><span>' + esc(tr('邮箱', 'Email')) + '</span><input name="email" type="email" inputmode="email" autocomplete="email" required maxlength="254" data-focus-key="binding-email" value="' + esc(inputValue('bindingEmail')) + '"></label>' +
          '<label class="ht-field"><span>' + esc(tr('当前密码', 'Current password')) + '</span><input name="currentPassword" type="password" autocomplete="current-password" required maxlength="128" data-focus-key="binding-current-password"></label>' +
          '<div class="ht-form-actions"><button class="ht-button ht-primary" type="submit" data-submit>' + esc(tr('发送验证邮件', 'Send verification email')) + '</button><button class="ht-button ht-quiet" type="button" data-action="back-account" data-focus-key="account-cancel">' + esc(tr('取消', 'Cancel')) + '</button></div>' +
        '</form></section>';
    }
    return '<section class="ht-account-page" data-account-panel="bind-email">' +
      accountPanelHeading(tr('确认邮箱绑定', 'Confirm email binding'), tr('请查看邮箱验证码，并再次输入当前密码确认绑定。', 'Check your email code, then re-enter your current password to confirm.')) +
      '<form class="ht-account-form" data-form="confirm-email-binding" data-lock-on-busy>' +
        '<label class="ht-field"><span>' + esc(tr('待绑定邮箱', 'Email to bind')) + '</span><input name="email" type="email" autocomplete="email" readonly value="' + esc(employeeBindingPendingEmail) + '"></label>' +
        '<label class="ht-field"><span>' + esc(tr('邮箱验证码', 'Email code')) + '</span><input name="otp" type="text" inputmode="numeric" autocomplete="one-time-code" required maxlength="12" data-focus-key="binding-otp" value="' + esc(inputValue('bindingOtp')) + '"></label>' +
        '<label class="ht-field"><span>' + esc(tr('当前密码', 'Current password')) + '</span><input name="currentPassword" type="password" autocomplete="current-password" required maxlength="128" data-focus-key="binding-confirm-password"></label>' +
        '<div class="ht-form-actions"><button class="ht-button ht-primary" type="submit" data-submit>' + esc(tr('验证并绑定', 'Verify and bind')) + '</button><button class="ht-button ht-quiet" type="button" data-action="restart-email-binding" data-focus-key="binding-restart">' + esc(tr('更换邮箱', 'Choose another email')) + '</button></div>' +
      '</form></section>';
  }
  function renderEmployeeAssignment() {
    var employeeOptions = employees.filter(isManagedEmployeeRecord);
    var allTeams = teams();
    var teamList = allTeams.filter(isAdmin);
    var selectedNumber = inputValue('employeeAssignmentEmployeeNumber', employeeOptions[0] && employeeOptions[0].employeeNumber || '');
    var requestedTeamId = inputValue('employeeAssignmentTeamId', selectedTeamId || '');
    var requestedTeamAllowed = teamList.some(function (team) { return team.id === requestedTeamId; });
    var teamIdForAssignment = requestedTeamAllowed ? requestedTeamId : (teamList[0] && teamList[0].id || '');
    var departmentList = teamDepartments(teamIdForAssignment);
    var selectedDepartments = Array.isArray(draft.employeeAssignmentDepartmentIds) ? draft.employeeAssignmentDepartmentIds : [];
    var canAssign = employeeOptions.length > 0 && teamList.length > 0 && !employeesLoading;
    return '<details class="ht-advanced ht-employee-details" data-detail-key="employee-assign"><summary>' + esc(tr('分配员工到团队', 'Assign an employee to a team')) + '</summary>' +
      (!teamList.length ? '<p class="ht-help">' + esc(allTeams.length ? tr('你目前不是任何团队的管理员；请返回团队页面创建一个你管理的团队，或联系团队管理员。', 'You do not administer any team. Create a team you administer or contact a team admin before assigning employees.') : tr('请先返回团队页面创建一个你管理的团队，然后再分配员工。', 'Return to the team page and create a team you administer before assigning employees.')) + '</p>' : '') +
      '<form class="ht-employee-form" data-form="assign-employee" data-lock-on-busy>' +
        '<label class="ht-field"><span>' + esc(tr('员工', 'Employee')) + '</span><select name="employeeNumber" data-change="employee-assignment-employee" data-focus-key="assignment-employee"' + (employeeOptions.length ? '' : ' disabled') + '>' +
          (employeeOptions.length ? employeeOptions.map(function (employee) { return '<option value="' + esc(employee.employeeNumber) + '"' + (employee.employeeNumber === selectedNumber ? ' selected' : '') + '>' + esc(employee.name + ' · ' + employee.employeeNumber) + '</option>'; }).join('') : '<option value="">' + esc(employeesLoading ? tr('正在读取员工…', 'Loading employees…') : tr('没有可分配的员工', 'No employees to assign')) + '</option>') +
        '</select></label>' +
        '<label class="ht-field"><span>' + esc(tr('团队', 'Team')) + '</span><select name="teamId" data-change="employee-assignment-team" data-focus-key="assignment-team"' + (teamList.length ? '' : ' disabled') + '>' +
          (teamList.length ? teamList.map(function (team) { return '<option value="' + esc(team.id) + '"' + (team.id === teamIdForAssignment ? ' selected' : '') + '>' + esc(team.name) + '</option>'; }).join('') : '<option value="">' + esc(allTeams.length ? tr('没有可管理的团队', 'No team you administer') : tr('尚无团队', 'No teams yet')) + '</option>') +
        '</select></label>' +
        (departmentList.length ? '<fieldset class="ht-member-choice"><legend>' + esc(tr('部门（可选）', 'Departments (optional)')) + '</legend>' + departmentList.map(function (department) { return '<label class="ht-check"><input type="checkbox" name="departmentIds" value="' + esc(department.id) + '"' + (selectedDepartments.indexOf(department.id) >= 0 ? ' checked' : '') + '><span>' + esc(department.name) + '</span></label>'; }).join('') + '</fieldset>' : '<p class="ht-help">' + esc(tr('该团队没有部门；员工会先加入团队总群。', 'This team has no departments. The employee will join the team-wide group.')) + '</p>') +
        '<div class="ht-form-actions"><button class="ht-button ht-primary" type="submit" data-submit' + (canAssign ? '' : ' data-unavailable="true" disabled') + '>' + esc(tr('分配员工', 'Assign employee')) + '</button></div>' +
      '</form></details>';
  }
  function isManagedEmployeeRecord(employee) {
    return !!employee && typeof employee === 'object' && employee.accountType === 'employee' && employee.isAccountAdmin !== true && employee.canResetPassword === true && typeof employee.employeeNumber === 'string' && /^[a-z0-9][a-z0-9._-]{0,63}$/.test(employee.employeeNumber);
  }
  function renderEmployeeResetPanel() {
    if (!employeeResetTarget) return '';
    var employee = employees.filter(function (item) { return item && item.employeeNumber === employeeResetTarget; })[0];
    if (!employee || employee.canResetPassword !== true || employee.isAccountAdmin === true) return '';
    return '<section class="ht-employee-reset ht-section"><h3>' + esc(tr('重置 ', 'Reset password for ') + employee.name) + '</h3>' +
      '<form class="ht-employee-form" data-form="reset-employee-password" data-lock-on-busy>' +
        '<label class="ht-field"><span>' + esc(tr('新临时密码', 'New temporary password')) + '</span><input name="newPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128" data-focus-key="employee-reset-new-password"></label>' +
        '<label class="ht-field"><span>' + esc(tr('确认新密码', 'Confirm new password')) + '</span><input name="confirmPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128" data-focus-key="employee-reset-confirm-password"></label>' +
        '<label class="ht-field"><span>' + esc(tr('管理员当前密码', 'Admin current password')) + '</span><input name="adminPassword" type="password" autocomplete="current-password" required maxlength="128" data-focus-key="employee-reset-admin-password"></label>' +
        '<p class="ht-help">' + esc(tr('下次登录时员工必须修改临时密码。自助邮箱账号和管理员账号不能从此处重置。', 'The employee must change this temporary password at next sign-in. Self-service email accounts and admin accounts cannot be reset here.')) + '</p>' +
        '<div class="ht-form-actions"><button class="ht-button ht-primary" type="submit" data-submit>' + esc(tr('重置密码', 'Reset password')) + '</button><button class="ht-button ht-quiet" type="button" data-action="cancel-employee-reset" data-focus-key="employee-reset-cancel">' + esc(tr('取消', 'Cancel')) + '</button></div>' +
      '</form></section>';
  }
  function renderEmployeeAdminPanel() {
    if (!isAccountAdmin()) return '<section class="ht-account-page">' + accountPanelHeading(tr('员工管理', 'Employee management'), tr('只有账号管理员可以访问。', 'Only an account admin can access this page.')) + '</section>';
    var list = employees.filter(isManagedEmployeeRecord).map(function (employee) {
      var emailState = employee.email ? (employee.emailVerified ? tr('已验证邮箱：', 'Verified email: ') : tr('邮箱未验证：', 'Unverified email: ')) + employee.email : tr('未绑定邮箱', 'No email bound');
      var passwordState = employee.mustChangePassword ? '<span class="ht-employee-state">' + esc(tr('首次登录需改密', 'Password change required')) + '</span>' : '';
      var reset = employee.canResetPassword === true && employee.isAccountAdmin !== true ? '<button class="ht-button ht-quiet" type="button" data-action="reset-employee" data-employee-number="' + esc(employee.employeeNumber) + '" data-focus-key="reset-' + esc(employee.employeeNumber) + '">' + esc(tr('重置密码', 'Reset password')) + '</button>' : '';
      return '<article class="ht-employee-row"><div class="ht-employee-main"><h4>' + esc(employee.name || employee.employeeNumber || tr('员工', 'Employee')) + '</h4><p><span class="ht-employee-number">' + esc(employee.employeeNumber || '') + '</span><span>' + esc(emailState) + '</span></p>' + (passwordState ? '<div class="ht-employee-states">' + passwordState + '</div>' : '') + '</div><div class="ht-list-end">' + reset + '</div></article>';
    }).join('');
    return '<section class="ht-account-page ht-employee-admin" data-account-panel="employees">' +
      accountPanelHeading(tr('员工管理', 'Employee management'), tr('创建普通员工、分配团队和重置临时密码。员工账号不会获得管理员权限。', 'Create standard employee accounts, assign teams and reset temporary passwords. Employee accounts never receive admin privileges.')) +
      '<div class="ht-employee-admin-toolbar"><p class="ht-help">' + esc(teams().filter(isAdmin).length ? tr('创建与分配分开保存；分配失败时可重试，不会重复创建员工。这里只显示你管理的团队。', 'Creation and assignment are separate. You can retry a failed assignment without creating the employee again. Only teams you administer are available here.') : (teams().length ? tr('你不是任何团队的管理员；请先创建一个你管理的团队，或联系团队管理员。', 'You do not administer any team. Create a team you administer or contact a team admin first.') : tr('当前没有团队。先返回团队页面创建一个你管理的团队，再分配员工。', 'There are no teams yet. Return to the team page and create one you administer before assigning employees.'))) + '</p><button class="ht-button ht-quiet" type="button" data-action="refresh-employees" data-focus-key="refresh-employees"' + (employeesLoading ? ' disabled' : '') + '>' + esc(employeesLoading ? tr('正在刷新…', 'Refreshing…') : tr('刷新列表', 'Refresh list')) + '</button></div>' +
      '<details class="ht-advanced ht-employee-details" data-detail-key="employee-create"><summary>' + esc(tr('创建员工', 'Create employee')) + '</summary>' +
        '<form class="ht-employee-form" data-form="create-employee" data-lock-on-busy>' +
          '<label class="ht-field"><span>' + esc(tr('员工号', 'Employee number')) + '</span><input name="employeeNumber" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required minlength="1" maxlength="64" pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,63}" data-focus-key="employee-create-number" value="' + esc(inputValue('employeeCreateNumber')) + '"></label>' +
          '<label class="ht-field"><span>' + esc(tr('姓名', 'Name')) + '</span><input name="name" type="text" autocomplete="name" required maxlength="120" data-focus-key="employee-create-name" value="' + esc(inputValue('employeeCreateName')) + '"></label>' +
          '<label class="ht-field"><span>' + esc(tr('临时密码', 'Temporary password')) + '</span><input name="password" type="password" autocomplete="new-password" required minlength="8" maxlength="128" data-focus-key="employee-create-password"></label>' +
          '<label class="ht-field"><span>' + esc(tr('确认临时密码', 'Confirm temporary password')) + '</span><input name="confirmPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128" data-focus-key="employee-create-confirm"></label>' +
          '<p class="ht-help">' + esc(tr('不需要邮箱。首次使用此临时密码登录后，员工必须先修改密码。员工号保存时规范为小写。', 'No email is required. The employee must change this temporary password at first sign-in. Employee numbers are normalized to lowercase.')) + '</p>' +
          '<div class="ht-form-actions"><button class="ht-button ht-primary" type="submit" data-submit>' + esc(tr('创建员工', 'Create employee')) + '</button></div>' +
        '</form></details>' +
      renderEmployeeAssignment() +
      '<section class="ht-section ht-employee-list"><div class="ht-section-head"><h3>' + esc(tr('员工账号', 'Employee accounts')) + '</h3><span class="ht-count">' + employees.length + '</span></div>' +
        (employeesLoading && !employeesLoaded ? '<p class="ht-help" role="status">' + esc(tr('正在读取员工列表…', 'Loading employees…')) + '</p>' : employeesError ? '<div class="ht-error-block" role="alert"><p class="ht-error-copy">' + esc(employeesError) + '</p><button class="ht-button ht-quiet" type="button" data-action="refresh-employees" data-focus-key="retry-employees">' + esc(tr('重试', 'Retry')) + '</button></div>' : (employeesTruncated ? '<p class="ht-help ht-employee-truncated" role="status">' + esc(tr('当前仅显示前 500 个员工账号；此处暂不支持搜索或浏览更多账号。', 'Only the first 500 employee accounts are shown. Search and browsing additional accounts are not available here.')) + '</p>' : '') + (list ? '<div class="ht-employee-list-items">' + list + '</div>' : '<p class="ht-empty-line">' + esc(tr('还没有管理员创建的员工账号。', 'No admin-created employee accounts yet.')) + '</p>')) +
      '</section>' + renderEmployeeResetPanel() +
    '</section>';
  }
  function focusAccountPanel() {
    var target = dom.content && (dom.content.querySelector('[data-focus-key="account-back"]') || dom.content.querySelector('input:not([disabled]), button:not([disabled])'));
    if (target && typeof target.focus === 'function') target.focus();
  }
  function loadEmployees() {
    if (!open || accountPanel !== 'employees' || !isAccountAdmin() || employeesLoading) return Promise.resolve(null);
    var ticket = lifeEpoch;
    var request = ++employeeListEpoch;
    employeesLoading = true;
    employeesError = '';
    employeesTruncated = false;
    render();
    return call('listEmployees', {}).then(function (response) {
      if (!live(ticket) || request !== employeeListEpoch || accountPanel !== 'employees') return response;
      employees = Array.isArray(response.employees) ? response.employees.filter(isManagedEmployeeRecord).slice(0, 500) : [];
      employeesTruncated = response.truncated === true;
      employeesLoaded = true;
      employeesError = '';
      return response;
    }).catch(function (error) {
      if (live(ticket) && request === employeeListEpoch && accountPanel === 'employees') employeesError = safeError(error);
      return null;
    }).finally(function () {
      if (request === employeeListEpoch) {
        employeesLoading = false;
        if (live(ticket) && accountPanel === 'employees') render();
      }
    });
  }
  function openAccountPanel(panel) {
    if (!open || !model.status || !model.status.signedIn || actionBusy) return;
    if (personalMode && panel !== 'devices' && panel !== 'change-password') return;
    var user = model.status.user || {};
    if (panel === 'employees' && !isAccountAdmin()) return;
    if (panel === 'change-password' && user.hasPassword !== true) return;
    if (panel === 'set-credentials' && !(user.accountType === 'email' && user.hasPassword === false && authCapabilitiesLoaded && authCapabilities.passwordLogin)) return;
    if (panel === 'bind-email' && !(user.accountType === 'employee' && !user.email && authCapabilities.emailBinding)) return;
    accountPanel = panel;
    employeeResetTarget = '';
    if (panel !== 'employees') {
      employeeListEpoch++;
      employeesLoading = false;
    }
    if (panel !== 'bind-email') {
      employeeBindingPendingEmail = '';
      delete draft.bindingOtp;
      delete draft.bindingEmail;
    }
    closeConnectionSettings();
    if (dom.accountMenu) dom.accountMenu.open = false;
    setStatus('', '');
    render();
    focusAccountPanel();
    if (panel === 'employees') loadEmployees();
  }
  function selectPersonalSection(section) {
    if (!open || !personalMode || !model.status || !model.status.signedIn || actionBusy) return;
    var next = section === 'collaboration' ? 'collaboration' : 'devices';
    if (next === accountPanel) {
      if (next === 'collaboration' && !model.state) refreshState(lifeEpoch, { force: true }).catch(function () {});
      return;
    }
    accountPanel = next;
    closeConnectionSettings();
    setStatus('', '');
    if (next === 'collaboration') {
      activePane = 'team';
      selectedRoomId = '';
      model.messages = null;
      messagesRoomId = '';
      messageEpoch++;
      messageLoading = false;
      render();
      refreshState(lifeEpoch, { force: true }).catch(function () {});
      return;
    }
    stateEpoch++;
    messageEpoch++;
    stateLoading = false;
    messageLoading = false;
    render();
  }
  function backAccountPanel() {
    accountPanel = personalMode ? 'devices' : '';
    employeeListEpoch++;
    employeesLoading = false;
    employeeResetTarget = '';
    employeeAssignmentOperationId = '';
    employeeAssignmentSignature = '';
    employeeBindingPendingEmail = '';
    delete draft.bindingOtp;
    delete draft.bindingEmail;
    setStatus('', '');
    render();
    if (dom.accountSummary) dom.accountSummary.focus();
  }
  function handleAccountMenuClick(event) {
    var target = event.target && event.target.closest ? event.target.closest('[data-account-action]') : null;
    if (!target || !dom.accountActions.contains(target) || target.disabled) return;
    openAccountPanel(target.dataset.accountAction);
  }
  function renderAccountPanel() {
    if (accountPanel === 'devices' && !personalMode) {
      var teamNetwork = model.status && model.status.network;
      var teamDevices = teamNetwork && teamNetwork.available ? (teamNetwork.devices || []).filter(function (d) { return !d.revoked; }) : [];
      var teamConnected = teamDevices.filter(function (d) { return d.online; }).length;
      var teamNetworkError = teamNetwork && typeof teamNetwork.error === 'string' ? safeError({ code: teamNetwork.error }) : '';
      var teamNetworkMessage = teamNetwork && typeof teamNetwork.message === 'string' ? teamNetwork.message : '';
      var teamNetworkFeedback = teamNetworkMessage || teamNetworkError;
      return '<section class="ht-account-page" data-account-panel="devices">' + accountPanelHeading(tr('我的设备', 'My devices'), tr('同一 Bot Studio 账号下的设备。接收任务需在目标设备上启用。', 'Devices on this Bot Studio account. Task execution must be enabled on the target device.'), personalMode) +
        '<p role="status">' + esc(teamNetwork && teamNetwork.available ? tr('共 ' + teamDevices.length + ' 台，' + teamConnected + ' 台 Bot Studio 已连接', teamDevices.length + ' devices, ' + teamConnected + ' connected to Bot Studio') : tr('设备服务暂不可用，请检查团队服务是否已升级。', 'Device service is unavailable. Check that the team service has been upgraded.')) + '</p>' +
        (teamNetworkFeedback ? '<p class="ht-account-note" role="status">' + esc(teamNetworkFeedback) + '</p>' : '') +
        '<ul>' + teamDevices.map(function (d) { return '<li><strong>' + esc(d.name) + '</strong> · ' + esc(devicePlatformLabel(d.platform)) + ' · ' + esc(d.online ? tr('Bot Studio 已连接', 'Bot Studio connected') : tr('Bot Studio 未连接', 'Bot Studio not connected')) + (d.id === teamNetwork.localDeviceId ? ' · ' + esc(tr('本机', 'This device')) : '') + ' · ' + esc(d.executor ? tr('接收任务已启用', 'Task reception enabled') : tr('控制端', 'Controller')) + (d.id === teamNetwork.localDeviceId ? '' : (d.online && d.executor ? ' <button type="button" class="ht-button ht-quiet" data-action="connect-device" data-device-id="' + esc(d.id) + '">' + esc(tr('连接并导入 BOT', 'Connect and import bots')) + '</button>' : '') + ' <button type="button" class="ht-button ht-quiet" data-action="revoke-device" data-device-id="' + esc(d.id) + '">' + esc(tr('撤销连接', 'Revoke connection')) + '</button>') + '</li>'; }).join('') + '</ul>' +
        '<button type="button" class="ht-button ht-quiet" data-action="refresh-devices">' + esc(tr('刷新设备', 'Refresh devices')) + '</button></section>';
    }
    if (accountPanel === 'devices') {
      var network = model.status && model.status.network;
      var devices = network && network.available ? (network.devices || []).filter(function (d) { return !d.revoked; }) : [];
      var connected = devices.filter(function (d) { return d.online === true; }).length;
      var networkError = network && typeof network.error === 'string' ? safeError({ code: network.error }) : '';
      var networkMessage = network && typeof network.message === 'string' ? network.message : '';
      var networkFeedback = networkMessage || networkError;
      var currentDevice = devices.filter(function (d) { return d.id === (network && network.localDeviceId); });
      var otherDevices = devices.filter(function (d) { return d.id !== (network && network.localDeviceId); });
      var hosts = network && Array.isArray(network.hosts) ? network.hosts : [];
      var nodeURL = model.status && model.status.nodeURL;
      var coordinatorHost = coordinatorHostLabel(nodeURL);
      var description = personalMode
        ? tr('管理 Bot Studio 设备和执行主机。组网在线状态仍由现有设备网络页面显示。', 'Manage Bot Studio devices and execution hosts. Mesh network status remains on the existing network page.')
        : tr('同一 Bot Studio 账号下的设备及执行状态。', 'Devices and execution status for this Bot Studio account.');
      var deviceSummary = network && network.available
        ? tr('共 ' + devices.length + ' 台，' + connected + ' 台 Bot Studio 已连接', devices.length + ' devices, ' + connected + ' connected to Bot Studio')
        : tr('Bot Studio 设备服务暂不可用。', 'Bot Studio device service is unavailable.');
      var currentSection = currentDevice.length
        ? '<section class="ht-device-section"><h3>' + esc(tr('本机设备', 'This device')) + '</h3><ul class="ht-device-list">' + currentDevice.map(function (d) { return renderDeviceRow(d, network); }).join('') + '</ul></section>'
        : '';
      var otherSection = '<section class="ht-device-section"><h3>' + esc(tr('管理设备', 'Manage devices')) + '</h3>' +
        (otherDevices.length ? '<ul class="ht-device-list">' + otherDevices.map(function (d) { return renderDeviceRow(d, network); }).join('') + '</ul>' : '<p class="ht-device-empty">' + esc(network && network.available ? tr('还没有其他设备连接到这个 Bot Studio 账号。', 'No other devices are connected to this Bot Studio account.') : tr('设备列表暂不可用。', 'The device list is unavailable.')) + '</p>') + '</section>';
      var hostsSection = '<section class="ht-device-section"><h3>' + esc(tr('执行主机', 'Execution hosts')) + '</h3>' +
        (hosts.length ? '<ul class="ht-device-list">' + hosts.map(renderExecutionHost).join('') + '</ul>' : '<p class="ht-device-empty">' + esc(tr('暂无已保存的执行主机。', 'No saved execution hosts.')) + '</p>') + '</section>';
      var coordinatorSection = '<section class="ht-device-section"><h3>' + esc(tr('协调服务', 'Coordinator')) + '</h3><ul class="ht-device-list ht-service-list"><li class="ht-device-row">' +
        '<svg class="ht-device-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.2 17.4 6v8L10 17.8 2.6 14V6z"></path><path d="m2.8 6.1 7.2 3.8 7.2-3.8M10 10v7.5"></path></svg>' +
        '<div class="ht-device-main"><div class="ht-device-title"><strong>' + esc(tr('Bot Studio 协调服务', 'Bot Studio coordinator')) + '</strong></div><p class="ht-device-status"><span>' + esc(coordinatorHost ? tr(coordinatorHost + ' · 服务地址已配置', coordinatorHost + ' · Address configured') : tr('服务地址未配置', 'Service address not configured')) + '</span></p></div></li></ul></section>';
      return '<section class="ht-account-page" data-account-panel="devices">' + accountPanelHeading(tr('我的设备', 'My devices'), description, personalMode) +
        '<p class="ht-device-summary" role="status">' + esc(network && network.available ? deviceSummary : (personalMode ? deviceSummary : tr('设备服务暂不可用，请检查团队服务是否已升级。', 'Device service is unavailable. Check that the team service has been upgraded.'))) + '</p>' +
        (networkFeedback ? '<p class="ht-account-note" role="status">' + esc(networkFeedback) + '</p>' : '') +
        currentSection + otherSection + hostsSection + coordinatorSection +
        '<div class="ht-device-footer"><button type="button" class="ht-button ht-quiet" data-action="refresh-devices" data-focus-key="refresh-devices">' + esc(tr('刷新设备', 'Refresh devices')) + '</button></div></section>';
    }
    if (accountPanel === 'employees') return renderEmployeeAdminPanel();
    if (accountPanel === 'change-password') return renderPasswordPanel(false);
    if (accountPanel === 'set-credentials') return renderCredentialSetupPanel();
    if (accountPanel === 'bind-email') return renderEmailBindingPanel();
    return '<section class="ht-account-page">' + accountPanelHeading(tr('账户设置', 'Account settings'), '') + '</section>';
  }
  function renderPersonalSectionNavigation() {
    if (!personalMode || !model.status || !model.status.signedIn || (model.status.user && model.status.user.mustChangePassword === true)) return '';
    return '<nav class="ht-personal-nav" aria-label="' + esc(tr('Bot Studio 页面', 'Bot Studio sections')) + '">' +
      '<button type="button" data-personal-section="devices" data-focus-key="personal-section-devices" aria-current="' + (accountPanel === 'devices' ? 'page' : 'false') + '">' + esc(tr('账号与设备', 'Account and devices')) + '</button>' +
      '<button type="button" data-personal-section="collaboration" data-focus-key="personal-section-collaboration" aria-current="' + (personalCollaborationActive() ? 'page' : 'false') + '">' + esc(tr('小组协作', 'Group collaboration')) + '</button>' +
      '</nav>';
  }
  function renderSecureStorageBlocked() {
    return '<section class="ht-empty-start ht-secure-storage-blocked" data-secure-storage-panel="blocked" role="alert"><h2>' + esc(tr('安全存储暂时无法打开', 'Secure storage is temporarily unavailable')) + '</h2>' +
      '<p>' + esc(tr('安全存储未能打开，已暂停自动重试。请在需要时重试。', 'Secure storage could not be opened. Automatic retries are paused. Retry when needed.')) + '</p>' +
      '<button type="button" class="ht-button ht-primary" data-action="retry-secure-storage" data-focus-key="retry-secure-storage" data-submit' + (secureStorageRetrying ? ' disabled' : '') + '>' + esc(secureStorageRetrying ? tr('正在重试安全存储…', 'Retrying secure storage…') : tr('重试安全存储', 'Retry secure storage')) + '</button></section>';
  }
  function renderMain() {
    if (secureStorageBlocked) return renderSecureStorageBlocked();
    if (!model.status) return '<div class="ht-loading" role="status">' + esc(personalMode ? tr('正在检查 Bot Studio 账号与设备服务…', 'Checking Bot Studio account and device services…') : tr('正在检查团队服务…', 'Checking the team service…')) + '</div>';
    var main = '';
    if (!model.status.signedIn) {
      main = authMarkup();
    } else if (model.status.user && model.status.user.mustChangePassword === true) {
      main = renderPasswordPanel(true);
      return main;
    } else if (personalMode) {
      if (accountPanel !== 'devices' && accountPanel !== 'change-password' && accountPanel !== 'collaboration') accountPanel = 'devices';
      if (personalCollaborationActive()) {
        main = model.state
          ? renderTeamApp()
          : '<div class="ht-loading" role="status">' + esc(stateLoading ? tr('正在读取小组和成员状态…', 'Loading groups and member access…') : tr('小组状态尚未读取。', 'Group state has not loaded.')) +
            (!stateLoading ? '<button type="button" class="ht-button ht-quiet" data-action="retry-state" data-focus-key="retry-state">' + esc(tr('重试', 'Retry')) + '</button>' : '') + '</div>';
      } else main = renderAccountPanel();
      return connectionMarkup() + renderPersonalSectionNavigation() + main;
    } else if (accountPanel) {
      return connectionMarkup() + renderAccountPanel();
    } else if (!model.state) {
      main = '<div class="ht-loading" role="status">' + esc(stateLoading ? tr('正在读取团队状态…', 'Loading team state…') : tr('团队状态尚未读取。', 'Team state has not loaded.')) +
        (!stateLoading ? '<button type="button" class="ht-button ht-quiet" data-action="retry-state" data-focus-key="retry-state">' + esc(tr('重试', 'Retry')) + '</button>' : '') + '</div>';
    } else {
      main = renderTeamApp();
    }
    return connectionMarkup() + main;
  }
  function renderTeamApp() {
    var teamList = teams();
    if (!selectedTeamId || !teamById(selectedTeamId)) selectTeam(teamList.length ? teamList[0].id : '');
    setDefaultRoom(selectedTeamId);
    if (!teamList.length) {
      var createGroupForm = '<form class="ht-inline-form ht-create-team" data-form="create-team"><label class="ht-field"><span>' + esc(personalMode ? tr('小组名称', 'Group name') : tr('团队名称', 'Team name')) + '</span><input name="name" required maxlength="120" autocomplete="organization" data-focus-key="create-team-name" value="' + esc(inputValue('createTeamName')) + '"></label><button class="ht-button ht-primary" type="submit" data-submit>' + esc(personalMode ? tr('创建小组', 'Create group') : tr('创建团队', 'Create team')) + '</button></form>';
      if (personalMode && invitePreview) {
        return '<div class="ht-empty-start">' + renderInviteAccept() + '<details class="ht-advanced" data-detail-key="create-personal-group"><summary>' + esc(tr('创建自己的小组', 'Create your own group')) + '</summary>' + createGroupForm + '</details></div>';
      }
      return '<div class="ht-empty-start"><h2>' + esc(personalMode ? tr('还没有加入小组', 'No group yet') : tr('还没有加入团队', 'No team yet')) + '</h2>' +
        '<p>' + esc(personalMode ? tr('创建小组会同时建立一个文字群聊；成员加入后，本机 Bot 仍需单独绑定并授权。', 'Creating a group also creates a text room. A local Bot still needs separate binding and room authorization after members join.') : tr('创建一个团队会同时建立独立的团队总群。部门工作空间可以稍后添加。', 'Creating a team also creates its separate team-wide group. Department workspaces can be added later.')) + '</p>' +
        createGroupForm +
        renderInviteAccept() + '</div>';
    }
    var team = selectedTeam();
    if (activePane === 'collection' && (personalMode || !canUseCompanyData(team))) activePane = 'team';
    var adminText = isAdmin(team) ? tr('管理员', 'Admin') : tr('成员', 'Member');
    return '<div class="ht-team-app" data-active-pane="' + esc(activePane) + '">' +
      '<div class="ht-team-toolbar"><label class="ht-team-picker"><span>' + esc(personalMode ? tr('当前小组', 'Current group') : tr('当前团队', 'Current team')) + '</span><select data-change="team" data-focus-key="team-picker">' + teamList.map(function (item) { return '<option value="' + esc(item.id) + '"' + (item.id === selectedTeamId ? ' selected' : '') + '>' + esc(item.name) + '</option>'; }).join('') + '</select></label>' +
        '<span class="ht-role-label">' + esc(adminText) + '</span>' +
        '<details class="ht-new-team" data-detail-key="new-team"><summary>' + esc(personalMode ? tr('创建小组', 'Create group') : tr('创建团队', 'Create team')) + '</summary><form class="ht-new-team-form" data-form="create-team"><label class="ht-field"><span>' + esc(personalMode ? tr('小组名称', 'Group name') : tr('团队名称', 'Team name')) + '</span><input name="name" required maxlength="120" autocomplete="organization" data-focus-key="create-team-name" value="' + esc(inputValue('createTeamName')) + '"></label><button class="ht-button ht-primary" type="submit" data-submit>' + esc(tr('创建', 'Create')) + '</button></form></details>' +
      '</div>' +
      '<div class="ht-layout"><nav class="ht-nav" aria-label="' + esc(tr('团队页面', 'Team pages')) + '">' +
        paneButton('team', personalMode ? tr('小组与空间', 'Groups and spaces') : tr('团队与部门', 'Team and departments')) + paneButton('members', tr('成员与邀请', 'Members and invites')) + paneButton('chat', tr('群聊', 'Group chat')) +
        (!personalMode && canUseCompanyData(team) ? paneButton('collection', tr('团队资料', 'Team records')) : '') +
      '</nav><section class="ht-pane" aria-live="polite">' + renderPane(team) + '</section></div>' +
      '</div>';
  }
  function paneButton(pane, label) {
    return '<button type="button" class="ht-nav-button" data-pane="' + pane + '" aria-current="' + (activePane === pane ? 'page' : 'false') + '" data-focus-key="pane-' + pane + '">' + esc(label) + '</button>';
  }
  function renderPane(team) {
    if (activePane === 'members') return renderMembersPane(team);
    if (activePane === 'chat') return renderChatPane(team);
    if (activePane === 'collection') return '<div class="ht-pane-content"><div class="ht-company-data-mount" data-company-data-mount></div></div>';
    return renderTeamPane(team);
  }
  function renderTeamPane(team) {
    var deptList = teamDepartments(team.id);
    var roomList = teamRooms(team.id);
    var totalRoom = roomList.filter(function (room) { return !room.departmentId; })[0] || null;
    var canManage = isAdmin(team);
    var localSection = '<details class="ht-advanced" data-detail-key="local-bots"><summary>' + esc(personalMode ? tr('绑定本机 Bot', 'Bind a local Bot') : tr('本机 Bot 绑定', 'Bind a local Bot')) + '</summary>' + renderLocalBots() + '</details>';
    var management = canManage ?
      '<section class="ht-section ht-suggest"><h3>' + esc(tr('按目标生成部门建议', 'Suggest departments from a goal')) + '</h3>' +
        '<p class="ht-help">' + esc(tr('提交给主脑的输入仅含目标、团队名称、工程和 BOT 名称；创建前由你确认。', 'The main Bot receives only the goal, team, project and Bot names; you review suggestions before creating them.')) + '</p>' +
        '<form class="ht-goal-form" data-form="recommend"><label class="ht-field"><span>' + esc(tr('团队当前目标', 'Current team goal')) + '</span><textarea name="goal" rows="2" maxlength="3000" required data-focus-key="team-goal" placeholder="' + esc(tr('例如：我们要共同完成什么工作？', 'For example, what work does this team need to complete?')) + '">' + esc(inputValue('recommendGoal')) + '</textarea></label><button class="ht-button" type="submit" data-submit>' + esc(tr('生成建议', 'Generate suggestions')) + '</button></form>' +
        (proposals.length ? '<p class="ht-help">' + esc(tr('审核建议及成员后按原方案创建；自定义名称或引用请使用手动创建。', 'Review the suggestion and members before applying it. Use manual creation for custom names or references.')) + '</p><div class="ht-proposals">' + proposals.map(renderProposal).join('') + '</div>' : '') +
      '</section>' +
      '<details class="ht-advanced" data-detail-key="manual-department"><summary>' + esc(tr('手动新建部门', 'Create a department manually')) + '</summary>' + renderManualDepartment(team) + '</details>' :
      '<p class="ht-help">' + esc(tr('部门工作空间由团队管理员创建和管理。', 'Department workspaces are created and managed by a team admin.')) + '</p>';
    return '<div class="ht-pane-content">' +
      '<div class="ht-pane-heading"><div><h2>' + esc(team.name) + '</h2><p>' + esc(personalMode ? tr('小组总群与协作空间分开管理。', 'The group room and collaboration spaces are managed separately.') : tr('团队总群与部门工作空间分开管理。', 'The team group and department workspaces have separate membership.')) + '</p></div></div>' +
      '<section class="ht-section"><h3>' + esc(personalMode ? tr('小组总群', 'Group room') : tr('团队总群', 'Team-wide group')) + '</h3>' +
        (totalRoom ? '<button class="ht-room-link" type="button" data-open-room="' + esc(totalRoom.id) + '" data-focus-key="team-room">' + esc(totalRoom.name) + '<span>' + esc(personalMode ? tr('所有小组成员', 'All group members') : tr('全团队成员', 'All team members')) + '</span></button>' : '<p class="ht-muted">' + esc(tr('总群状态尚未返回；请刷新团队状态。', 'The team-wide group is missing from the returned state. Refresh the team state.')) + '</p>') +
      '</section>' +
      '<section class="ht-section"><div class="ht-section-head"><h3>' + esc(personalMode ? tr('协作空间', 'Collaboration spaces') : tr('部门工作空间', 'Department workspaces')) + '</h3><span class="ht-count">' + deptList.length + '</span></div>' +
        (deptList.length ? '<div class="ht-list">' + deptList.map(renderDepartmentRow).join('') + '</div>' : '<p class="ht-empty-line">' + esc(canManage ? (personalMode ? tr('还没有协作空间。', 'No collaboration spaces yet.') : tr('还没有部门工作空间。', 'No department workspaces yet.')) : (personalMode ? tr('目前没有可访问的协作空间。', 'No collaboration spaces are available to you yet.') : tr('目前没有可访问的部门工作空间。', 'No department workspaces are available to you yet.'))) + '</p>') +
      '</section>' +
      management +
      localSection +
      '</div>';
  }
  function renderDepartmentRow(department) {
    var depMembers = members().filter(function (member) { return member.teamId === department.teamId && Array.isArray(member.departmentIds) && member.departmentIds.indexOf(department.id) >= 0; });
    var room = roomForDepartment(department.id);
    return '<article class="ht-list-row"><div class="ht-list-main"><h4>' + esc(department.name) + '</h4><p>' + esc(tr('项目', 'Projects')) + ' · ' + htmlRefs(department.projectRefs) + '</p><p>' + esc(tr('BOT', 'Bots')) + ' · ' + htmlRefs(department.botRefs) + '</p><p>' + esc(tr('成员', 'Members')) + ' · ' + (depMembers.length ? depMembers.map(function (member) { return esc(member.name); }).join('、') : esc(tr('暂无成员', 'No members'))) + '</p></div>' +
      '<div class="ht-list-end">' + (room ? '<button type="button" class="ht-button ht-quiet" data-open-room="' + esc(room.id) + '" data-focus-key="dept-room-' + esc(department.id) + '">' + esc(tr('打开部门群', 'Open department group')) + '</button>' : '<span class="ht-muted">' + esc(tr('未创建部门群', 'No department group')) + '</span>') + '</div></article>';
  }
  function renderProposal(proposal, index) {
    var roster = members().filter(function (member) { return member.teamId === selectedTeamId; });
    var owner = ownTeamMembership();
    var edits = proposalDrafts[index] || {};
    var chosenMembers = Array.isArray(edits.memberIds) ? edits.memberIds : [];
    return '<article class="ht-proposal"><div class="ht-proposal-copy"><h4>' + esc(value(proposal.name)) + '</h4>' +
      '<p>' + esc(value(proposal.reason, tr('建议依据尚未提供。', 'No reason was returned.'))) + '</p>' +
      '<div class="ht-ref-line"><strong>' + esc(tr('项目', 'Projects')) + '</strong><span>' + htmlRefs(proposal.projectRefs) + '</span></div>' +
      '<div class="ht-ref-line"><strong>' + esc(tr('BOT', 'Bots')) + '</strong><span>' + htmlRefs(proposal.botRefs) + '</span></div>' +
      '</div><fieldset class="ht-member-choice"><legend>' + esc(tr('部门成员', 'Department members')) + '</legend>' + roster.map(function (member) {
        var current = owner && member.id === owner.id;
        return '<label class="ht-check"><input type="checkbox" name="proposalMember" value="' + esc(member.id) + '" data-proposal-members="' + index + '"' + (current || chosenMembers.indexOf(member.id) >= 0 ? ' checked' : '') + (current ? ' disabled' : '') + '><span>' + esc(member.name) + (current ? ' · ' + esc(tr('你', 'you')) : '') + '</span></label>';
      }).join('') +
      '<button type="button" class="ht-button ht-primary" data-apply-proposal="' + index + '" data-focus-key="apply-proposal-' + index + '">' + esc(tr('创建此工作空间', 'Create this workspace')) + '</button></fieldset></article>';
  }
  function renderManualDepartment(team) {
    var roster = members().filter(function (member) { return member.teamId === team.id; });
    var owner = myMember(team.id);
    var chosenMembers = Array.isArray(draft.departmentMembers) ? draft.departmentMembers : [];
    return '<form class="ht-manual-form" data-form="create-department">' +
      '<label class="ht-field"><span>' + esc(tr('部门名称', 'Department name')) + '</span><input name="name" required maxlength="120" data-focus-key="department-name" value="' + esc(inputValue('departmentName')) + '"></label>' +
      '<fieldset class="ht-member-choice"><legend>' + esc(tr('部门成员', 'Department members')) + '</legend>' + roster.map(function (member) {
        var current = owner && member.id === owner.id;
        return '<label class="ht-check"><input type="checkbox" name="memberIds" value="' + esc(member.id) + '"' + (current || chosenMembers.indexOf(member.id) >= 0 ? ' checked' : '') + (current ? ' disabled' : '') + '><span>' + esc(member.name) + (current ? ' · ' + esc(tr('你', 'you')) : '') + '</span></label>';
      }).join('') + '</fieldset>' +
      renderCatalogControl() +
      renderCatalogPicker('project', catalogProjects, Array.isArray(draft.departmentProjectIds) ? draft.departmentProjectIds : []) +
      renderCatalogPicker('bot', catalogBots, Array.isArray(draft.departmentBotIds) ? draft.departmentBotIds : []) +
      '<label class="ht-check ht-create-room"><input name="createGroup" type="checkbox" value="true"' + (draft.createGroup ? ' checked' : '') + '><span>' + esc(tr('同时创建部门群聊（可选）', 'Create a department group (optional)')) + '</span></label>' +
      '<button class="ht-button ht-primary" type="submit" data-submit>' + esc(tr('创建部门', 'Create department')) + '</button>' +
    '</form>';
  }
  function renderCatalogPicker(kind, rows, selectedIds) {
    var project = kind === 'project';
    var field = project ? 'projectRefIds' : 'botRefIds';
    var title = project ? tr('关联本机工程（可选）', 'Link local projects (optional)') : tr('关联 BOT（可选）', 'Link Bots (optional)');
    var empty = project ? tr('目前没有可关联的工程。请先在 Bot Studio 主界面创建工程，再重新读取。', 'No projects are available. Create a project in the Bot Studio workspace, then reload this list.') : tr('目前没有可关联的 BOT。请先在 Bot Studio 中创建或配置 BOT，再重新读取。', 'No Bots are available. Create or configure a Bot in Bot Studio, then reload this list.');
    var choices = !catalogLoaded ? '<p class="ht-muted">' + esc(tr('读取名称列表后即可选择。', 'Load the names to choose from this list.')) + '</p>' : rows.length ? '<div class="ht-catalog-items">' + rows.map(function (row) {
      return '<label class="ht-check"><input type="checkbox" name="' + field + '" value="' + esc(row.id) + '" data-catalog-ref="' + kind + '"' + (selectedIds.indexOf(row.id) >= 0 ? ' checked' : '') + '><span>' + esc(row.name) + '</span></label>';
    }).join('') + '</div>' : '<p class="ht-muted">' + esc(empty) + '</p>';
    return '<fieldset class="ht-member-choice ht-catalog-choice"><legend>' + esc(title) + '</legend>' + choices + '</fieldset>';
  }
  function renderCatalogControl() {
    return '<div class="ht-catalog-control"><p class="ht-help">' + esc(tr('按需读取现有工程与 BOT 名称用于关联。', 'Load existing project and Bot names on demand for linking.')) + '</p>' +
      (catalogError ? '<p class="ht-error-copy">' + esc(catalogError) + '</p>' : catalogLoading ? '<p class="ht-muted" role="status">' + esc(tr('正在读取名称列表…', 'Loading names…')) + '</p>' : '') +
      '<button type="button" class="ht-button ht-quiet" data-action="load-catalog" data-focus-key="load-catalog"' + (catalogLoading ? ' disabled' : '') + '>' + esc(catalogLoaded ? tr('重新读取本机工程与 BOT', 'Reload local projects and Bots') : tr('读取本机工程与 BOT', 'Load local projects and Bots')) + '</button></div>';
  }
  function selectedCatalogRefs(rows, selectedIds) {
    var refs = [];
    for (var index = 0; index < selectedIds.length; index++) {
      var row = rows.filter(function (item) { return item.id === selectedIds[index]; })[0];
      if (!row) return null;
      refs.push({ id: row.id, name: row.name });
    }
    return refs;
  }
  function renderLocalBots() {
    if (!localBotsLoaded && !localBotsError) {
      return '<div class="ht-local-bots"><p class="ht-help">' + esc(personalMode ? tr('读取当前设备上的 Bot 名称，选择一个绑定到你自己的小组成员身份。绑定后仍需在群聊里单独授权。', 'Read Bot names on this device and bind one to your group membership. Room access still needs separate authorization.') : tr('按需读取当前设备上的 Bot 列表。', 'Load Bots from this device when needed.')) + '</p><button type="button" class="ht-button ht-quiet" data-action="load-local-bots" data-focus-key="local-bot-load">' + esc(tr('读取列表', 'Load list')) + '</button></div>';
    }
    if (localBotsError) return '<div class="ht-local-bots"><p class="ht-error-copy">' + esc(localBotsError) + '</p><button type="button" class="ht-button ht-quiet" data-action="load-local-bots" data-focus-key="local-bot-retry">' + esc(tr('重试', 'Retry')) + '</button></div>';
    if (!localBotList.length) return '<p class="ht-help">' + esc(tr('当前设备没有可绑定的本机 Bot。', 'No local Bot is available on this device.')) + '</p>';
    return '<div class="ht-local-bots"><p class="ht-help">' + esc(personalMode ? tr('绑定只关联你本人在小组的成员身份，不会自动向任何房间分享 Bot。私人聊天、记忆和密钥不会复制给其他成员。', 'Binding links the Bot only to your membership. It does not share it with any room. Private chats, memory, and keys are not copied to other members.') : tr('绑定只作用于你自己的成员身份，不会自动共享 Bot 凭据或私人记忆。', 'Binding applies to your own membership. It does not share Bot credentials or private memory.')) + '</p>' +
      '<label class="ht-field"><span>' + esc(tr('本机 Bot', 'Local Bot')) + '</span><select data-change="local-bot" data-focus-key="local-bot-select"><option value="">' + esc(tr('选择 Bot', 'Choose a Bot')) + '</option>' + localBotList.map(function (bot) { return '<option value="' + esc(bot.id) + '"' + (bot.id === model.localBoundBotId ? ' selected' : '') + '>' + esc(bot.name) + '</option>'; }).join('') + '</select></label>' +
      '<button type="button" class="ht-button ht-quiet" data-action="bind-local-bot" data-focus-key="bind-local-bot">' + esc(tr('绑定到本人', 'Bind to me')) + '</button></div>';
  }
  function renderInviteAccept() {
    var preview = invitePreview;
    return '<section class="ht-section ht-invite-accept"><h3>' + esc(personalMode ? tr('使用邀请码加入小组', 'Join a group with an invite code') : tr('使用邀请码加入团队', 'Join a team with an invite code')) + '</h3>' +
      (personalMode ? '<p class="ht-help">' + esc(tr('请用当前 Bot Studio 账号预览并接受。加入小组不会自动共享你绑定的 Bot。', 'Preview and accept with your current Bot Studio account. Joining a group does not share your bound Bot.')) + '</p>' : '') +
      '<form class="ht-invite-form" data-form="preview-invite"><label class="ht-field"><span>' + esc(tr('邀请码', 'Invite code')) + '</span><input name="code" required maxlength="200" autocomplete="off" data-focus-key="invite-code" value="' + esc(inputValue('inviteCode')) + '"></label><button class="ht-button" type="submit" data-submit>' + esc(tr('预览邀请', 'Preview invite')) + '</button></form>' +
      (preview ? '<div class="ht-invite-preview"><h4>' + esc(preview.teamName) + '</h4><p>' + esc(tr('邀请人', 'Invited by')) + ' · ' + esc(preview.inviterName) + '</p><p>' + esc(personalMode ? tr('加入小组总群和以下空间：', 'You will join the group room and these spaces:') : tr('获得团队总群权限，并加入以下部门：', 'You will get access to the team group and these departments:')) + ' ' + esc((preview.departments || []).map(function (department) { return department.name; }).join('、') || (personalMode ? tr('无额外空间', 'No additional spaces') : tr('无额外部门', 'No additional departments'))) + '</p>' + (personalMode ? '<p class="ht-muted">' + esc(tr('接受后不会自动共享本机 Bot；Bot 绑定与房间授权需分别确认。', 'Accepting does not share a local Bot. Bot binding and room access need separate confirmation.')) + '</p>' : '') + (preview.expiresAt ? '<p class="ht-muted">' + esc(tr('有效期至', 'Expires')) + ' · ' + esc(formatDate(preview.expiresAt)) + '</p>' : '') + '<button type="button" class="ht-button ht-primary" data-action="accept-invite" data-focus-key="accept-invite">' + esc(tr('接受邀请', 'Accept invite')) + '</button></div>' : '') +
      '</section>';
  }
  function renderMembersPane(team) {
    var roster = members().filter(function (member) { return member.teamId === team.id; });
    var admin = isAdmin(team);
    var current = account();
    var teamTransfers = transfers().filter(function (transfer) { return transfer.teamId === team.id; });
    return '<div class="ht-pane-content"><div class="ht-pane-heading"><div><h2>' + esc(personalMode ? tr('小组成员与邀请', 'Group members and invites') : tr('成员与邀请', 'Members and invites')) + '</h2><p>' + esc(personalMode ? tr('小组和空间成员资格分开记录；加入小组不会自动共享任何 Bot。', 'Group and space membership are separate. Joining a group does not share a Bot.') : tr('团队成员资格与部门成员资格分开记录。', 'Team and department membership are managed separately.')) + '</p></div></div>' +
      '<section class="ht-section"><div class="ht-section-head"><h3>' + esc(personalMode ? tr('小组成员', 'Group members') : tr('团队成员', 'Team members')) + '</h3><span class="ht-count">' + roster.length + '</span></div>' +
        (roster.length ? '<div class="ht-list">' + roster.map(function (member) {
          var self = current && member.accountId === current.id;
          var role = member.role === 'admin' ? tr('管理员', 'Admin') : tr('成员', 'Member');
          return '<article class="ht-list-row"><div class="ht-list-main"><h4>' + esc(member.name) + (self ? ' <span class="ht-muted">(' + esc(tr('你', 'you')) + ')</span>' : '') + '</h4><p>' + esc(role) + ' · ' + esc(relationNames(member)) + '</p></div><div class="ht-list-end">' + (admin && !self ? '<button type="button" class="ht-button ht-danger" data-remove-member="' + esc(member.id) + '" data-focus-key="remove-member-' + esc(member.id) + '">' + esc(tr('移除', 'Remove')) + '</button>' : '') + '</div></article>';
        }).join('') + '</div>' : '<p class="ht-empty-line">' + esc(tr('没有可显示的成员。', 'No members to show.')) + '</p>') +
      '</section>' +
      (admin ? '<section class="ht-section"><h3>' + esc(tr('邀请成员', 'Invite members')) + '</h3>' +
        '<p class="ht-help">' + esc(personalMode ? tr('受邀者需用自己的 Bot Studio 账号登录，再预览并接受。邀请码单次有效，7 天后过期；无需好友关系。邀请码只授予所选小组和空间成员资格，不会复制或共享 Bot。', 'The invitee signs in with their own Bot Studio account, then previews and accepts. The code works once and expires after 7 days; no friend relationship is required. It grants only the selected group and space membership and does not copy or share a Bot.') : tr('持码者先验证自己的邮箱，再预览并接受邀请。邀请码会授予团队总群和下方所选部门权限。', 'The recipient verifies their own email, then previews and accepts the invite. The code grants access to the team group and the selected departments.')) + '</p>' +
        '<form class="ht-invite-form" data-form="create-invite"><fieldset class="ht-member-choice"><legend>' + esc(personalMode ? tr('允许加入的空间', 'Spaces to include') : tr('允许加入的部门', 'Departments to include')) + '</legend>' + teamDepartments(team.id).map(function (department) { return '<label class="ht-check"><input type="checkbox" name="departmentIds" value="' + esc(department.id) + '"' + (Array.isArray(draft.inviteDepartments) && draft.inviteDepartments.indexOf(department.id) >= 0 ? ' checked' : '') + '><span>' + esc(department.name) + '</span></label>'; }).join('') + (teamDepartments(team.id).length ? '' : '<p class="ht-muted">' + esc(personalMode ? tr('目前没有协作空间。邀请仍可加入小组总群。', 'There are no spaces yet. The invite still grants group-room membership.') : tr('目前没有部门。邀请仍可加入团队总群。', 'There are no departments yet. The invite still grants access to the team group.')) + '</p>') + '</fieldset><button class="ht-button ht-primary" type="submit" data-submit>' + esc(personalMode ? tr('创建一次性邀请码', 'Create one-time invite') : tr('生成邀请码', 'Create invite code')) + '</button></form>' +
        (createdInvite && createdInvite.teamId === team.id ? '<div class="ht-created-code"><label class="ht-field"><span>' + esc(tr('一次性邀请码', 'Invite code')) + '</span><input readonly value="' + esc(createdInvite.code) + '" data-focus-key="created-invite-code"></label><p>' + esc(tr('有效期至', 'Expires')) + ' · ' + esc(formatDate(createdInvite.expiresAt)) + '</p></div>' : '') +
      '</section>' : '') +
      (admin ? renderTransferAdmin(team, teamTransfers, roster) : renderIncomingTransfers(team, teamTransfers)) +
      renderInviteAccept() +
    '</div>';
  }
  function renderTransferAdmin(team, teamTransfers, roster) {
    var current = account();
    var pending = teamTransfers.filter(function (transfer) { return transfer.status === 'pending'; });
    var targets = roster.filter(function (member) { return !current || member.accountId !== current.id; });
    return '<section class="ht-section"><h3>' + esc(tr('管理员转让', 'Transfer admin')) + '</h3>' +
      '<p class="ht-help">' + esc(tr('发起后仍由你管理团队，目标接受后才生效。', 'You remain admin until the target accepts the transfer.')) + '</p>' +
      (targets.length ? '<form class="ht-transfer-form" data-form="transfer-admin"><label class="ht-field"><span>' + esc(tr('转让给', 'Transfer to')) + '</span><select name="targetMemberId" required data-focus-key="transfer-target"><option value="">' + esc(tr('选择当前成员', 'Choose a current member')) + '</option>' + targets.map(function (member) { return '<option value="' + esc(member.id) + '"' + (draft.transferTarget === member.id ? ' selected' : '') + '>' + esc(member.name) + '</option>'; }).join('') + '</select></label><button class="ht-button" type="submit" data-submit>' + esc(tr('发起转让', 'Request transfer')) + '</button></form>' : '<p class="ht-muted">' + esc(tr('需要另一位有效成员才能转让管理员。', 'Another active member is required before you can transfer admin.')) + '</p>') +
      renderTransferRows(team, pending) +
      '</section>';
  }
  function renderIncomingTransfers(team, teamTransfers) {
    var current = account();
    var incoming = teamTransfers.filter(function (transfer) { return transfer.targetAccountId === (current && current.id) && transfer.status === 'pending'; });
    return '<section class="ht-section"><h3>' + esc(tr('管理员转让', 'Admin transfer')) + '</h3>' + (incoming.length ? renderTransferRows(team, incoming) : '<p class="ht-muted">' + esc(tr('目前没有待接受的转让。', 'No transfer is waiting for your acceptance.')) + '</p>') + '</section>';
  }
  function renderTransferRows(team, list) {
    var current = account();
    if (!list.length) return '<p class="ht-muted">' + esc(tr('目前没有待处理的转让。', 'No pending transfer.')) + '</p>';
    return '<div class="ht-transfer-list">' + list.map(function (transfer) {
      var targetName = (members().filter(function (member) { return member.teamId === team.id && member.accountId === transfer.targetAccountId; })[0] || {}).name || tr('成员', 'Member');
      var sender = (members().filter(function (member) { return member.teamId === team.id && member.accountId === transfer.createdBy; })[0] || {}).name || tr('管理员', 'Admin');
      var isTarget = current && transfer.targetAccountId === current.id;
      var isInitiator = current && transfer.createdBy === current.id && team.adminId === current.id;
      return '<article class="ht-list-row"><div class="ht-list-main"><h4>' + esc(isTarget ? tr('你收到管理员转让', 'Admin transfer for you') : sender + ' → ' + targetName) + '</h4><p>' + esc(tr('状态', 'Status')) + ' · ' + esc(value(transfer.status)) + (transfer.expiresAt ? ' · ' + esc(formatDate(transfer.expiresAt)) : '') + '</p></div><div class="ht-list-end">' +
        (isTarget ? '<button type="button" class="ht-button ht-primary" data-accept-transfer="' + esc(transfer.id) + '" data-focus-key="accept-transfer-' + esc(transfer.id) + '">' + esc(tr('接受转让', 'Accept transfer')) + '</button>' : '') +
        (isTarget || isInitiator ? '<button type="button" class="ht-button ht-quiet" data-cancel-transfer="' + esc(transfer.id) + '" data-focus-key="cancel-transfer-' + esc(transfer.id) + '">' + esc(tr('取消', 'Cancel')) + '</button>' : '') +
        '</div></article>';
    }).join('') + '</div>';
  }
  function actorLabel(message) {
    if (message.actorType === 'ai_delegate') return tr('AI代班', 'AI delegate');
    if (message.actorType === 'workspace_bot') return tr('工作空间 BOT', 'Workspace Bot');
    if (message.actorType === 'human') return tr('真人', 'Human');
    return tr('来源未识别', 'Unknown source');
  }
  function runStatusLabel(status) {
    if (status === 'running') return tr('运行中', 'Running');
    if (status === 'done') return tr('已完成', 'Done');
    if (status === 'cancelled') return tr('取消请求已记录', 'Cancellation requested');
    if (status === 'failed' || status === 'executor_unavailable' || status === 'grant_unavailable' || status === 'grant_revoked' || status === 'busy' || status === 'invalid') return tr('失败', 'Failed');
    return tr('状态未知', 'Unknown status');
  }
  function executionReceiptLabel(receipt) {
    if (!receipt || receipt.protocol !== 2) return tr('执行状态未确认。', 'Execution status is unconfirmed.');
    var label = '';
    if (receipt.state === 'not-started') label = tr('执行尚未启动。', 'Execution has not started.');
    else if (receipt.state === 'stop-requested-unconfirmed') label = tr('已请求停止，执行端未确认结束。', 'Stop requested; the executor has not confirmed it ended.');
    else if (receipt.state === 'lease-expired-unconfirmed') label = tr('执行租约已过期，结束状态未确认。', 'The execution lease expired; its end state is unconfirmed.');
    if (receipt.state === 'stopped-acknowledged') {
      label = receipt.providerStopConfirmed === true
        ? tr('执行端已确认结束，供应商停止也已确认。', 'The executor confirmed it ended; provider stop is also confirmed.')
        : tr('执行端已确认结束，供应商停止未确认。', 'The executor confirmed it ended; provider stop is unconfirmed.');
    }
    if (!label) label = tr('执行状态未确认。', 'Execution status is unconfirmed.');
    if (receipt.reason === 'execution_timeout') label += ' ' + tr('本次文字协作已达 2 分钟上限；请重新发起。', 'This text collaboration reached the 2-minute limit. Start a new request.');
    else if (receipt.reason === 'queue_timeout') label += ' ' + tr('请求等待超过 60 秒，执行尚未启动；请重新发起。', 'The request waited over 60 seconds and did not start. Start a new request.');
    return label;
  }
  function renderRun(run) {
    var receipt = run && run.executionReceipt;
    var runId = value(run && (run.id || run.runId));
    return '<article class="ht-run" data-run-id="' + esc(runId) + '" data-run-status="' + esc(value(run && run.status, 'unknown')) + '"><p>' + esc(runStatusLabel(run && run.status)) + '</p>' +
      (receipt ? '<p class="ht-run-receipt" data-run-id="' + esc(runId) + '" data-execution-state="' + esc(value(receipt.state, 'unknown')) + '" data-provider-stop-confirmed="' + String(receipt.providerStopConfirmed === true) + '">' + esc(executionReceiptLabel(receipt)) + '</p>' : '') +
      '</article>';
  }
  function presenceLabel(member) {
    var presence = member.presence === 'online' ? tr('真人在线', 'Human online') : member.presence === 'offline' ? tr('真人离线', 'Human offline') : tr('在线状态未知', 'Presence unknown');
    var mode = member.mode || {};
    if (mode.enabled && mode.available) return presence + ' · ' + (personalMode ? tr('Bot 已在本房间分享，可用', 'Bot shared in this room and available') : tr('AI代班已授权，可执行', 'AI delegate authorized and available'));
    if (mode.enabled) return presence + ' · ' + (personalMode ? tr('Bot 已在本房间分享，等待设备', 'Bot shared in this room, waiting for a device') : tr('AI代班已授权，等待设备', 'AI delegate authorized, waiting for a device'));
    return presence + ' · ' + (personalMode ? tr('Bot 未在本房间分享', 'Bot not shared in this room') : tr('AI代班关闭', 'AI delegate off'));
  }
  function compactPresenceLabel(member) {
    var presence = member.presence === 'online' ? tr('真人在线', 'Human online') : member.presence === 'offline' ? tr('真人离线', 'Human offline') : tr('真人状态未知', 'Human presence unknown');
    var mode = member.mode || {};
    var delegate = personalMode ? (mode.enabled ? (mode.available ? tr('Bot 本房间可用', 'Bot shared here') : tr('Bot 等待设备', 'Bot waiting for a device')) : tr('Bot 未分享', 'Bot not shared')) : mode.enabled ? (mode.available ? tr('AI代班可用', 'AI delegate available') : tr('AI代班等待设备', 'AI delegate waiting')) : tr('AI代班关闭', 'AI delegate off');
    return value(member.name) + ' · ' + presence + ' · ' + delegate;
  }
  function currentRoomMember() {
    var current = account();
    var list = model.messages && messagesRoomId === selectedRoomId && Array.isArray(model.messages.members) ? model.messages.members : [];
    return current ? list.filter(function (member) { return member.accountId === current.id; })[0] || null : null;
  }
  function renderChatPane(team) {
    var roomList = teamRooms(team.id);
    var activeRoom = selectedRoom();
    if (!activeRoom || activeRoom.teamId !== team.id) activeRoom = roomList[0] || null;
    if (activeRoom && activeRoom.id !== selectedRoomId) selectedRoomId = activeRoom.id;
    var currentRoom = selectedRoomId && activeRoom && activeRoom.id === selectedRoomId ? activeRoom : null;
    var messageModel = model.messages && messagesRoomId === selectedRoomId ? model.messages : null;
    var myRoomMember = currentRoomMember();
    var myMode = messageModel && messageModel.mode ? messageModel.mode : (myRoomMember && myRoomMember.mode) || { enabled: false, available: false };
    var authorized = messageModel && Array.isArray(messageModel.members) ? messageModel.members.filter(function (member) { return member.mode && member.mode.enabled && member.botId; }) : [];
    var selectedTarget = authorized.filter(function (member) { return member.id === mentionMemberId && member.mode.available; })[0] || null;
    var ownMemberId = ownTeamMembership() && ownTeamMembership().id;
    var currentList = messageModel && Array.isArray(messageModel.members) ? messageModel.members : [];
    var timeline = messageModel && Array.isArray(messageModel.messages) ? messageModel.messages : [];
    var runs = messageModel && Array.isArray(messageModel.runs) ? messageModel.runs : [];
    var statuses = currentList.length ? '<details class="ht-room-members-disclosure" data-detail-key="room-members" aria-label="' + esc(tr('群成员状态', 'Group member status')) + '"><summary>' + esc(currentList.map(compactPresenceLabel).join(' / ')) + '</summary><div class="ht-room-members">' + currentList.map(function (member) {
      var canDisable = isAdmin(team) && member.id !== ownMemberId && member.mode && member.mode.enabled;
      return '<div class="ht-room-member"><div><strong>' + esc(member.name) + '</strong><span>' + esc(presenceLabel(member)) + '</span></div>' + (canDisable ? '<button type="button" class="ht-button ht-quiet" data-disable-takeover="' + esc(member.id) + '" data-focus-key="disable-takeover-' + esc(member.id) + '">' + esc(tr('关闭其代班', 'Disable delegate')) + '</button>' : '') + '</div>';
    }).join('') + '</div></details>' : '<p class="ht-muted">' + esc(tr('读取群成员状态中…', 'Loading group member status…')) + '</p>';
    var personalConsentCopy = personalMode
      ? '<p class="ht-help ht-takeover-scope">' + esc(tr('只有你可以开启；房间管理员可关闭。成员变化后，本房间授权会自动关闭，需你重新确认。协作范围仅限本房间共同文字消息；不会共享私人聊天、记忆或密钥，不开放命令行、鼠标/键盘控制或文件。单次文字协作最长 2 分钟；超时请重新发起。', 'Only you can enable this access; room admins can turn it off. A membership change automatically closes access in this room, so you must confirm again. Collaboration is limited to shared text messages in this room. Private chats, memory and keys stay private; terminal, mouse/keyboard controls and files are not exposed. Each text collaboration lasts at most 2 minutes; start a new request after timeout.')) + '</p>'
      : '';
    var hasBoundBot = !!(myRoomMember && myRoomMember.botId);
    var takeoverAction = personalMode && !hasBoundBot && !myMode.enabled
      ? '<button type="button" class="ht-button ht-quiet" data-action="open-local-bot-binding" data-focus-key="open-local-bot-binding">' + esc(tr('先绑定本机 Bot', 'Bind a local Bot first')) + '</button>'
      : '<button type="button" class="ht-button ' + (myMode.enabled ? 'ht-quiet' : '') + '" data-toggle-takeover="' + (!myMode.enabled) + '" data-focus-key="toggle-takeover">' + esc(myMode.enabled ? (personalMode ? tr('关闭本房间授权', 'Turn off room access') : tr('关闭代班', 'Turn off delegate')) : (personalMode ? tr('允许本房间文字协作', 'Allow text collaboration here') : tr('授权本群代班', 'Authorize for this group'))) + '</button>';
    var controls = myRoomMember
      ? '<div class="ht-takeover"><div><strong>' + esc(personalMode ? tr('你绑定的 Bot · 本房间', 'Your Bot · this room') : tr('本人 AI 代班', 'My AI delegate')) + '</strong><span>' + esc(myMode.enabled ? (myMode.available ? tr('已授权，可用', 'Authorized and available') : tr('已授权，等待设备', 'Authorized, waiting for a device')) : (personalMode ? tr('未向本房间授权', 'Not shared in this room') : tr('已关闭', 'Off'))) + '</span>' + personalConsentCopy + '</div>' + takeoverAction + '</div>'
      : '<p class="ht-muted">' + esc(tr('当前账号不在此群的成员范围内。', 'Your account is not a member of this group.')) + '</p>';
    var messages = timeline.length ? timeline.map(function (message) {
      return '<article class="ht-message"><div class="ht-message-meta"><strong>' + esc(message.actorName || tr('未知成员', 'Unknown member')) + '</strong><span>' + esc(actorLabel(message)) + '</span><time>' + esc(formatTime(message.ts)) + '</time></div><p>' + esc(message.text) + '</p></article>';
    }).join('') : '<p class="ht-chat-empty">' + esc(messageLoading ? tr('正在读取群聊…', 'Loading messages…') : tr('还没有群消息。真人消息不会触发模型。', 'No group messages yet. Human messages do not start a model.')) + '</p>';
    var runLines = runs.length ? '<div class="ht-runs"><strong>' + esc(personalMode ? tr('Bot 协作执行', 'Bot collaboration runs') : tr('代班任务', 'Delegate runs')) + '</strong>' + runs.map(renderRun).join('') + '</div>' : '';
    return '<div class="ht-chat-layout"><nav class="ht-room-list" aria-label="' + esc(tr('群聊列表', 'Group list')) + '"><h3>' + esc(tr('群聊', 'Groups')) + '</h3>' + (roomList.length ? roomList.map(function (room) {
      return '<button type="button" data-room="' + esc(room.id) + '" aria-current="' + (room.id === selectedRoomId ? 'true' : 'false') + '" data-focus-key="room-' + esc(room.id) + '"><strong>' + esc(room.name) + '</strong><span>' + esc(room.departmentId ? (personalMode ? tr('空间群', 'Space room') : tr('部门群', 'Department group')) : (personalMode ? tr('小组群', 'Group room') : tr('团队总群', 'Team-wide group'))) + '</span></button>';
    }).join('') : '<p class="ht-muted">' + esc(tr('没有可访问的群聊。', 'No accessible groups.')) + '</p>') + '</nav>' +
      '<section class="ht-chat-view">' + (currentRoom ? '<header class="ht-chat-header"><div><h2>' + esc(currentRoom.name) + '</h2><p>' + esc(currentRoom.departmentId ? (personalMode ? tr('仅限空间成员', 'Space members only') : tr('仅限部门成员', 'Department members only')) : (personalMode ? tr('小组成员', 'Group members') : tr('团队成员', 'Team members'))) + '</p></div></header>' + statuses + controls +
        '<div class="ht-messages" role="log" aria-label="' + esc(tr('群聊消息', 'Group messages')) + '" aria-live="polite">' + messages + '</div>' + runLines +
        '<form class="ht-composer" data-form="send-message"><label class="ht-field"><span>' + esc(tr('群消息', 'Group message')) + '</span><textarea name="text" rows="2" maxlength="32000" data-focus-key="group-message" placeholder="' + esc(tr('在群里说点什么…', 'Message this group…')) + '">' + esc(inputValue('message-' + currentRoom.id)) + '</textarea></label>' +
          '<div class="ht-composer-actions"><label class="ht-mention"><span>' + esc(personalMode ? tr('明确 @ 已授权 Bot', 'Explicitly @ an authorized Bot') : tr('明确 @AI 代班', 'Explicitly @ an AI delegate')) + '</span><select name="targetMemberId" data-change="mention" data-focus-key="mention-target"><option value="">' + esc(tr('不 @ 成员', 'No mention')) + '</option>' + authorized.map(function (member) { return '<option value="' + esc(member.id) + '"' + (member.id === mentionMemberId ? ' selected' : '') + (member.mode.available ? '' : ' disabled') + '>' + esc(member.name + (member.mode.available ? '' : ' · ' + tr('等待设备', 'waiting for device'))) + '</option>'; }).join('') + '</select></label>' +
            '<button class="ht-button ht-primary" type="submit" data-submit>' + esc(myMode.enabled ? tr('接回并发送', 'Take back and send') : selectedTarget ? tr('发送并 @ 代班', 'Send and @ delegate') : tr('发送', 'Send')) + '</button></div>' +
          '<p class="ht-help">' + esc(myMode.enabled ? tr('发送时会先关闭你在本群的代班，再保存真人消息。', 'Sending first turns off your delegate in this group, then saves your human message.') : tr('只有已授权且设备可用的成员可以被明确 @。', 'Only an authorized member with an available device can be explicitly @ mentioned.')) + '</p>' +
        '</form>' : '<div class="ht-chat-empty"><p>' + esc(tr('请选择一个群聊。', 'Choose a group.')) + '</p></div>') +
      '</section></div>';
  }
  function render() {
    if (!open || !dom.content) return;
    var focus = captureFocus();
    var mainScroll = activePane === 'chat' ? 0 : dom.content.scrollTop;
    var messagesNode = dom.content.querySelector('.ht-messages');
    var messagesScroll = messagesNode ? messagesNode.scrollTop : 0;
    var nearBottom = messagesNode ? messagesNode.scrollHeight - messagesNode.clientHeight - messagesNode.scrollTop < 48 : true;
    var detailsState = Object.create(null);
    Array.prototype.forEach.call(dom.content.querySelectorAll('details[data-detail-key]'), function (details) {
      detailsState[details.dataset.detailKey] = details.open;
    });
    dom.content.innerHTML = renderMain();
    dom.content.dataset.pane = activePane;
    if (dom.overlay) dom.overlay.setAttribute('data-secure-storage-blocked', String(secureStorageBlocked));
    if (root.OpenBotCompanyData && typeof root.OpenBotCompanyData.mount === 'function') {
      var companyDataMount = dom.content.querySelector('[data-company-data-mount]');
      root.OpenBotCompanyData.mount(companyDataMount, companyDataMount ? companyDataContext() : null);
    }
    Array.prototype.forEach.call(dom.content.querySelectorAll('details[data-detail-key]'), function (details) {
      if (Object.prototype.hasOwnProperty.call(detailsState, details.dataset.detailKey)) details.open = detailsState[details.dataset.detailKey];
    });
    if (personalMode && dom.overlay) dom.overlay.setAttribute('data-connection-open', String(connectionOpen));
    if (personalMode && dom.overlay) {
      var personalViewStatus = model.status || {};
      var passwordRequired = personalViewStatus.user && personalViewStatus.user.mustChangePassword === true;
      var personalView = !model.status ? 'loading' : !personalViewStatus.signedIn ? 'login' : (passwordRequired || accountPanel === 'change-password') ? 'password' : personalCollaborationActive() ? 'collaboration' : 'devices';
      dom.overlay.setAttribute('data-personal-view', personalView);
    }
    if (statusMessage) setStatus(statusMessage, statusTone);
    updateHeader();
    restoreFocus(focus);
    if (secureStorageBlocked && focus && focus.key !== 'retry-secure-storage') {
      var secureRetryButton = dom.content.querySelector('[data-action="retry-secure-storage"]');
      if (secureRetryButton) secureRetryButton.focus();
    }
    Array.prototype.forEach.call(dom.content.querySelectorAll('[data-submit]'), function (button) { button.disabled = actionBusy || button.dataset.unavailable === 'true'; });
    applyBusyState();
    if (activePane === 'chat') dom.content.scrollTop = 0;
    else if (dom.content.scrollHeight >= mainScroll) dom.content.scrollTop = mainScroll;
    var nextMessages = dom.content.querySelector('.ht-messages');
    if (nextMessages && nearBottom) nextMessages.scrollTop = nextMessages.scrollHeight;
    else if (nextMessages) nextMessages.scrollTop = messagesScroll;
    if (dom.content) dom.content.setAttribute('aria-busy', String(actionBusy || stateLoading || messageLoading));
  }
  function ensureDialog() {
    if (dom.overlay) return;
    var overlay = root.document.createElement('div');
    overlay.id = 'human-team-dialog';
    overlay.setAttribute('data-personal-mode', String(personalMode));
    overlay.setAttribute('data-connection-open', 'false');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<section class="ht-window" role="dialog" aria-modal="true" aria-labelledby="ht-title" aria-describedby="ht-subtitle" tabindex="-1">' +
      '<header class="ht-header"><div class="ht-heading"><h1 id="ht-title">真人团队</h1><p id="ht-subtitle">团队、部门工作空间与群聊</p></div><div class="ht-header-actions"><details class="ht-account-menu" hidden><summary class="ht-account"></summary><div class="ht-account-popover" role="group" aria-label="账户选项" data-account-actions></div></details><button type="button" class="ht-button ht-sign-out" hidden>退出登录</button><button type="button" class="ht-close" aria-label="关闭真人团队" title="关闭">×</button></div></header>' +
      '<div class="ht-status" role="status" aria-live="polite" hidden></div><main class="ht-content"></main></section>';
    root.document.body.appendChild(overlay);
    dom.overlay = overlay;
    dom.dialog = overlay.querySelector('.ht-window');
    dom.content = overlay.querySelector('.ht-content');
    dom.status = overlay.querySelector('.ht-status');
    dom.accountMenu = overlay.querySelector('.ht-account-menu');
    dom.accountSummary = overlay.querySelector('.ht-account');
    dom.accountActions = overlay.querySelector('[data-account-actions]');
    dom.signOut = overlay.querySelector('.ht-sign-out');
    dom.close = overlay.querySelector('.ht-close');
    dom.dialog.querySelector('#ht-title').textContent = personalMode ? tr('账号与设备', 'Account and devices') : tr('真人团队', 'Human team');
    dom.dialog.querySelector('#ht-subtitle').textContent = personalMode ? tr('Bot Studio 个人账号与设备', 'Personal Bot Studio account and devices') : tr('团队、部门工作空间与群聊', 'Teams, department workspaces and groups');
    dom.close.setAttribute('aria-label', personalMode ? tr('关闭账号与设备', 'Close account and devices') : tr('关闭真人团队', 'Close human team'));
    dom.close.title = tr('关闭', 'Close');
    dom.signOut.textContent = personalMode ? tr('退出 Bot Studio 账号', 'Sign out of Bot Studio') : tr('退出登录', 'Sign out');
    dom.close.addEventListener('click', closeDialog);
    dom.signOut.addEventListener('click', signOut);
    dom.accountActions.addEventListener('click', handleAccountMenuClick);
    overlay.addEventListener('click', function (event) { if (event.target === overlay) closeDialog(); });
    dom.content.addEventListener('click', handleClick);
    dom.content.addEventListener('change', handleChange);
    dom.content.addEventListener('input', handleInput);
    dom.content.addEventListener('submit', handleSubmit);
    dom.content.addEventListener('compositionstart', function () { composing = true; });
    dom.content.addEventListener('compositionend', function () { composing = false; });
    root.document.addEventListener('keydown', handleKeydown, true);
    dom.content.addEventListener('toggle', function (event) {
      if (event.target && event.target.matches('[data-connection-details]')) {
        connectionOpen = event.target.open;
        if (personalMode && dom.overlay) dom.overlay.setAttribute('data-connection-open', String(connectionOpen));
      }
    }, true);
  }
  function refreshStatus(ticket) {
    if (secureStorageBlocked || secureStorageRetrying) return Promise.resolve(null);
    var request = ++statusEpoch;
    return call('status').then(function (status) {
      if (!live(ticket) || request !== statusEpoch) return status;
      var previousStatus = JSON.stringify(model.status);
      var wasSignedIn = !!(model.status && model.status.signedIn);
      var previousAccountId = model.status && model.status.user && model.status.user.id;
      var nextAccountId = status && status.user && status.user.id;
      var personalIdentityChanged = wasSignedIn !== !!(status && status.signedIn) || previousAccountId !== nextAccountId;
      model.status = status;
      if (!personalMode) syncSSOProviders(ticket, status);
      syncAuthCapabilities(ticket, status);
      if (!status.signedIn) {
        if (wasSignedIn || model.state || model.messages || stateLoading || messageLoading) {
          stateEpoch++;
          messageEpoch++;
          stateLoading = false;
          messageLoading = false;
        }
        model.state = null;
        model.messages = null;
        messagesRoomId = '';
        accountPanel = '';
        employeeListEpoch++;
        employeesLoading = false;
        employeesLoaded = false;
        employees = [];
        employeesError = '';
        employeesTruncated = false;
        employeeResetTarget = '';
        employeeBindingPendingEmail = '';
        if (wasSignedIn) authMode = 'employee';
      } else if (status.user && status.user.mustChangePassword === true) {
        if (model.state || model.messages || stateLoading || messageLoading) {
          stateEpoch++;
          messageEpoch++;
          stateLoading = false;
          messageLoading = false;
        }
        model.state = null;
        model.messages = null;
        messagesRoomId = '';
      } else if (personalMode) {
        if (personalIdentityChanged) {
          stateEpoch++;
          messageEpoch++;
          stateLoading = false;
          messageLoading = false;
          model.state = null;
          model.messages = null;
          messagesRoomId = '';
        }
        if (accountPanel !== 'change-password' && accountPanel !== 'devices' && accountPanel !== 'collaboration') accountPanel = 'devices';
      } else if (accountPanel === 'employees' && !isAccountAdmin()) {
        accountPanel = '';
        employeeListEpoch++;
        employeesLoading = false;
      }
      updateHeader();
      if ((!status.signedIn && wasSignedIn !== !!status.signedIn) || (model.state && previousStatus !== JSON.stringify(status)) || (personalMode && previousStatus !== JSON.stringify(status))) render();
      return status;
    });
  }
  function refreshState(ticket, options) {
    if (secureStorageBlocked || secureStorageRetrying) return Promise.resolve(null);
    var request = ++stateEpoch;
    options = options || {};
    if ((personalMode && !personalCollaborationActive()) || !model.status || !model.status.signedIn) return Promise.resolve(null);
    stateLoading = true;
    if (!model.state) render();
    if (dom.content) dom.content.setAttribute('aria-busy', 'true');
    return call('state').then(function (next) {
      if (!live(ticket) || request !== stateEpoch) return next;
      var before = JSON.stringify(model.state);
      model.state = next;
      if (botbarNavigation) {
        var navigation = botbarNavigation; botbarNavigation = null;
        var navigationRoom = rooms().find(function (room) { return room.id === navigation.roomId && room.teamId === navigation.teamId; });
        if (navigation.accountId === next.account.id && navigationRoom) {
          selectTeam(navigation.teamId); selectedRoomId = navigationRoom.id; activePane = 'chat'; accountPanel = ''; mentionMemberId = '';
          botbarMention = navigation.digital ? navigation : null;
        } else setStatus(tr('团队账号或会话已改变，请重新选择。', 'The account or conversation changed. Choose it again.'), 'error');
      }
      if (!teams().some(function (team) { return team.id === selectedTeamId; })) selectTeam(teams()[0] ? teams()[0].id : '');
      setDefaultRoom(selectedTeamId);
      updateHeader();
      stateLoading = false;
      if (before !== JSON.stringify(next) || options.force) render();
      return next;
    }).catch(function (error) {
      if (live(ticket) && request === stateEpoch) {
        stateLoading = false;
        setStatus(tr('无法读取团队状态：', 'Could not load team state: ') + safeError(error), 'error');
        render();
      }
      throw error;
    }).finally(function () { if (live(ticket) && request === stateEpoch && dom.content) dom.content.setAttribute('aria-busy', String(actionBusy || stateLoading || messageLoading)); });
  }
  function refreshMessages(roomId, ticket, options) {
    if (secureStorageBlocked || secureStorageRetrying) return Promise.resolve(null);
    var room = roomId || selectedRoomId;
    if ((personalMode && !personalCollaborationActive()) || !room || !model.status || !model.status.signedIn || !open || activePane !== 'chat') return Promise.resolve(null);
    var request = ++messageEpoch;
    options = options || {};
    messageLoading = true;
    if (dom.content) dom.content.setAttribute('aria-busy', 'true');
    return call('messages', { roomId: room }).then(function (next) {
      if (!live(ticket) || request !== messageEpoch || selectedRoomId !== room) return next;
      var before = messagesRoomId === room ? JSON.stringify(model.messages) : '';
      model.messages = next;
      messagesRoomId = room;
      if (botbarMention && botbarMention.roomId === room) {
        var target = (next.members || []).find(function (member) { return member.id === botbarMention.memberId; });
        botbarMention = null;
        if (target && target.accountId !== account().id && target.mode && target.mode.enabled && target.mode.available) mentionMemberId = target.id;
        else {
          mentionMemberId = '';
          setStatus(tr('已打开共同群聊；数字 BOT 的代班授权与设备状态见下方。', 'Shared group opened. Delegate authorization and device status are shown below.'), '');
        }
      }
      messageLoading = false;
      if (before !== JSON.stringify(next) || options.force) render();
      return next;
    }).catch(function (error) {
      if (live(ticket) && request === messageEpoch && selectedRoomId === room) {
        messageLoading = false;
        setStatus(tr('无法读取群聊：', 'Could not load group messages: ') + safeError(error), 'error');
        render();
      }
      throw error;
    }).finally(function () { if (live(ticket) && request === messageEpoch && dom.content) dom.content.setAttribute('aria-busy', String(actionBusy || stateLoading || messageLoading)); });
  }
  function refreshAll(ticket, force) {
    if (secureStorageBlocked || secureStorageRetrying) {
      if (secureStorageBlocked && open) render();
      return Promise.resolve(null);
    }
    return refreshStatus(ticket).then(function (status) {
      if (!live(ticket)) return status;
      if (secureStorageBlocked || secureStorageRetrying) return null;
      if (personalMode) {
        if (!status.signedIn || (status.user && status.user.mustChangePassword === true)) { render(); return status; }
        if (accountPanel !== 'devices' && accountPanel !== 'change-password' && accountPanel !== 'collaboration') accountPanel = 'devices';
        if (personalCollaborationActive()) {
          return refreshState(ticket, { force: force }).then(function () {
            if (activePane === 'chat' && selectedRoomId) return refreshMessages(selectedRoomId, ticket, { force: force });
            return null;
          }).then(function () { return status; });
        }
        render();
        return status;
      }
      if (!status.signedIn) { render(); return status; }
      if (status.user && status.user.mustChangePassword === true) { render(); return status; }
      return refreshState(ticket, { force: force }).then(function () {
        if (activePane === 'chat' && selectedRoomId) return refreshMessages(selectedRoomId, ticket, { force: force });
        return null;
      });
    }).catch(function (error) {
      if (live(ticket)) {
        setStatus((personalMode ? tr('Bot Studio 服务不可用：', 'Bot Studio service unavailable: ') : tr('团队服务不可用：', 'Team service unavailable: ')) + safeError(error), 'error');
        render();
      }
      return null;
    });
  }
  function poll() {
    if (!open || secureStorageBlocked || secureStorageRetrying || root.document.hidden || actionBusy) return;
    var ticket = lifeEpoch;
    refreshAll(ticket, false);
  }
  function startPollTimer() {
    if (pollTimer) { root.clearInterval(pollTimer); pollTimer = null; }
    if (open && !secureStorageBlocked && !secureStorageRetrying) pollTimer = root.setInterval(poll, 20000);
  }
  function retrySecureStorage() {
    if (!open || !secureStorageBlocked || secureStorageRetrying || actionBusy) return Promise.resolve(null);
    var ticket = lifeEpoch;
    secureStorageEpoch++;
    secureStorageRetrying = true;
    setStatus('', '');
    setBusy(true);
    render();
    return call('retrySecureStorage', {}).then(function (response) {
      if (!live(ticket)) return response;
      secureStorageBlocked = false;
      secureStorageRetrying = false;
      secureStorageEpoch++;
      model.status = null;
      model.state = null;
      model.messages = null;
      messagesRoomId = '';
      stateLoading = false;
      messageLoading = false;
      setStatus(tr('安全存储已恢复，正在重新读取。', 'Secure storage is available again. Refreshing.'), 'ok');
      startPollTimer();
      return refreshAll(ticket, true);
    }).catch(function () {
      if (live(ticket)) {
        secureStorageBlocked = true;
        secureStorageRetrying = false;
        setStatus('', '');
        setBusy(false);
        render();
        var retryButton = dom.content && dom.content.querySelector('[data-action="retry-secure-storage"]');
        if (retryButton) retryButton.focus();
      }
      return null;
    }).finally(function () {
      if (live(ticket)) {
        secureStorageRetrying = false;
        setBusy(false);
        render();
      }
    });
  }
  function loadLocalBots() {
    var ticket = lifeEpoch;
    var requestedTeam = selectedTeamId;
    localBotsError = '';
    render();
    call('localBots', { teamId: requestedTeam }).then(function (response) {
      if (!live(ticket) || requestedTeam !== selectedTeamId) return;
      localBotList = Array.isArray(response.bots) ? response.bots : [];
      model.localBoundBotId = response.boundBotId || '';
      localBotsLoaded = true;
      localBotsError = '';
      render();
    }).catch(function (error) {
      if (!live(ticket) || requestedTeam !== selectedTeamId) return;
      localBotsError = safeError(error);
      render();
    });
  }
  function selectTeam(teamId) {
    if (teamId === selectedTeamId) return;
    selectedTeamId = teamId;
    localBotsLoaded = false;
    localBotsError = '';
    localBotList = [];
    model.localBoundBotId = '';
    model.selectedLocalBotId = '';
    catalogEpoch++;
    catalogLoaded = false;
    catalogLoading = false;
    catalogProjects = [];
    catalogBots = [];
    catalogError = '';
    proposals = [];
    proposalDrafts = Object.create(null);
  }
  function loadCatalog() {
    if (!open || catalogLoading) return Promise.resolve(null);
    var ticket = lifeEpoch;
    var request = ++catalogEpoch;
    var requestedTeam = selectedTeamId;
    catalogLoading = true;
    catalogError = '';
    render();
    return call('catalog', { teamId: requestedTeam }).then(function (response) {
      if (!live(ticket) || request !== catalogEpoch || requestedTeam !== selectedTeamId) return response;
      catalogProjects = Array.isArray(response.projects) ? response.projects.filter(function (item) { return item && typeof item.id === 'string' && typeof item.name === 'string' && item.name.trim(); }) : [];
      catalogBots = Array.isArray(response.bots) ? response.bots.filter(function (item) { return item && typeof item.id === 'string' && typeof item.name === 'string' && item.name.trim(); }) : [];
      catalogLoaded = true;
      catalogError = '';
      setStatus(tr('本机名称列表已更新。', 'Local project and Bot names were refreshed.'), 'ok');
      return response;
    }).catch(function (error) {
      if (live(ticket) && request === catalogEpoch) {
        catalogError = safeError(error);
        setStatus(catalogError, 'error');
      }
      return null;
    }).finally(function () {
      if (request === catalogEpoch) {
        catalogLoading = false;
        if (live(ticket)) render();
      }
    });
  }
  function mutate(action, payload, success, after) {
    if (actionBusy) return Promise.resolve(null);
    var ticket = lifeEpoch;
    setBusy(true);
    return call(action, payload).then(function (response) {
      if (!live(ticket)) return response;
      if (typeof after === 'function') after(response);
      if (success) setStatus(success, 'ok');
      return refreshState(ticket, { force: true }).then(function () {
        if (activePane === 'chat' && selectedRoomId) return refreshMessages(selectedRoomId, ticket, { force: true }).then(function () { return response; });
        return response;
      });
    }).catch(function (error) {
      if (live(ticket)) {
        setStatus(safeError(error), 'error');
        if (typeof after === 'function' && after.onError) after.onError(error);
        render();
      }
      return null;
    }).finally(function () { if (live(ticket)) setBusy(false); });
  }
  function sendCode() {
    closeConnectionSettings();
    var email = inputValue('email').trim();
    if (!email) { setStatus(tr('请输入邮箱。', 'Enter an email address.'), 'error'); return Promise.resolve(); }
    var ticket = lifeEpoch;
    setBusy(true);
    return cancelSSOFlow({ render: true }).then(function () {
      if (!live(ticket)) return null;
      return call('sendCode', { email: email });
    }).then(function (response) {
      if (!live(ticket)) return;
      draft.otpSentEmail = email;
      draft.otp = '';
      setStatus(tr('验证码已发送。请查看邮箱。', 'The code was sent. Check your email.'), 'ok');
      render();
      var otp = dom.content.querySelector('[name="otp"]');
      if (otp) otp.focus();
    }).catch(function (error) { if (live(ticket)) setStatus(safeError(error), 'error'); }).finally(function () { if (live(ticket)) setBusy(false); });
  }
  function signIn(form) {
    closeConnectionSettings();
    var data = new root.FormData(form);
    var email = value(data.get('email')).trim();
    var otp = value(data.get('otp')).trim();
    var name = value(data.get('name')).trim();
    if (!email || !otp) { setStatus(tr('邮箱和验证码不能为空。', 'Email and code are required.'), 'error'); return Promise.resolve(); }
    var ticket = lifeEpoch;
    setBusy(true);
    return cancelSSOFlow({ render: true }).then(function () {
      if (!live(ticket)) return null;
      return call('signIn', { email: email, otp: otp, name: name });
    }).then(function (response) {
      if (!live(ticket)) return;
      delete draft.otp;
      delete draft.otpSentEmail;
      setStatus(tr('已登录。', 'Signed in.'), 'ok');
      return refreshAll(ticket, true);
    }).catch(function (error) { if (live(ticket)) setStatus(safeError(error), 'error'); }).finally(function () { if (live(ticket)) setBusy(false); });
  }
  function clearPasswordFields(form) {
    if (!form) return;
    Array.prototype.forEach.call(form.querySelectorAll('input[type="password"]'), function (input) { input.value = ''; });
  }
  function validEmployeeNumber(input) { return /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(value(input)); }
  function validPassword(input) { return typeof input === 'string' && input.length >= 8 && input.length <= 128; }
  function applyReturnedStatus(response) {
    var next = response && response.status && typeof response.status.signedIn === 'boolean' ? response.status : response;
    if (next && typeof next.signedIn === 'boolean') model.status = next;
    updateHeader();
  }
  function signInPassword(form) {
    closeConnectionSettings();
    var data = new root.FormData(form);
    var employeeNumber = value(data.get('employeeNumber')).trim();
    var password = value(data.get('password'));
    clearPasswordFields(form);
    if (!validEmployeeNumber(employeeNumber)) { setStatus(personalMode ? tr('Bot Studio 账号需为 1–64 个英文字母、数字、点、下划线或连字符。', 'Bot Studio account must contain 1–64 ASCII letters, numbers, dots, underscores or hyphens.') : tr('员工号需为 1–64 个英文字母、数字、点、下划线或连字符。', 'Employee number must contain 1–64 ASCII letters, numbers, dots, underscores or hyphens.'), 'error'); return Promise.resolve(); }
    if (!validPassword(password)) { setStatus(tr('密码需为 8–128 个字符。', 'Passwords must be 8–128 characters.'), 'error'); return Promise.resolve(); }
    draft.authEmployeeNumber = employeeNumber.toLowerCase();
    var ticket = lifeEpoch;
    setBusy(true);
    return cancelSSOFlow({ render: true }).then(function () {
      if (!live(ticket)) return null;
      return call('signInPassword', { employeeNumber: employeeNumber.toLowerCase(), password: password });
    }).then(function (response) {
      if (!live(ticket) || !response) return;
      accountPanel = '';
      authMode = 'employee';
      model.state = null;
      applyReturnedStatus(response);
      var returnedStatus = response && response.status && typeof response.status.signedIn === 'boolean' ? response.status : response;
      var mustChange = !!(returnedStatus && returnedStatus.user && returnedStatus.user.mustChangePassword === true);
      accountPanel = personalMode && !mustChange ? 'devices' : '';
      setStatus(mustChange ? tr('登录成功，请先修改临时密码。', 'Sign-in succeeded. Change your temporary password first.') : (personalMode ? tr('已登录 Bot Studio 个人账号。', 'Signed in to your personal Bot Studio account.') : tr('已登录。', 'Signed in.')), 'ok');
      return refreshAll(ticket, true);
    }).catch(function (error) { if (live(ticket)) setStatus(safeError(error), 'error'); }).finally(function () { if (live(ticket)) setBusy(false); });
  }
  function changePassword(form) {
    var data = new root.FormData(form);
    var currentPassword = value(data.get('currentPassword'));
    var newPassword = value(data.get('newPassword'));
    var confirmPassword = value(data.get('confirmPassword'));
    clearPasswordFields(form);
    if (!validPassword(newPassword)) { setStatus(safeError({ code: 'HT_PASSWORD_POLICY' }), 'error'); return Promise.resolve(); }
    if (newPassword !== confirmPassword) { setStatus(tr('两次输入的新密码不一致，请重新输入。', 'The new passwords do not match. Enter them again.'), 'error'); var next = form.querySelector('[name="newPassword"]'); if (next) next.focus(); return Promise.resolve(); }
    if (!currentPassword) { setStatus(tr('请输入当前密码。', 'Enter your current password.'), 'error'); return Promise.resolve(); }
    var ticket = lifeEpoch;
    setBusy(true);
    return call('changePassword', { currentPassword: currentPassword, newPassword: newPassword }).then(function (response) {
      if (!live(ticket)) return response;
      applyReturnedStatus(response);
      accountPanel = personalMode ? 'devices' : '';
      setStatus(personalMode ? tr('Bot Studio 个人账号密码已更新。', 'Personal Bot Studio account password updated.') : tr('密码已更新。', 'Password updated.'), 'ok');
      return refreshAll(ticket, true);
    }).catch(function (error) { if (live(ticket)) setStatus(safeError(error), 'error'); }).finally(function () { if (live(ticket)) setBusy(false); });
  }
  function setEmployeeCredentials(form) {
    if (!authCapabilitiesLoaded || !authCapabilities.passwordLogin) {
      clearPasswordFields(form);
      setStatus(tr('此身份服务不支持设置工号密码，请联系管理员升级服务。', 'This identity service does not support employee-password setup. Ask the admin to upgrade it.'), 'error');
      return Promise.resolve(null);
    }
    var data = new root.FormData(form);
    var employeeNumber = value(data.get('employeeNumber')).trim();
    var password = value(data.get('password'));
    var confirmPassword = value(data.get('confirmPassword'));
    clearPasswordFields(form);
    if (!validEmployeeNumber(employeeNumber)) { setStatus(tr('员工号需为 1–64 个英文字母、数字、点、下划线或连字符。', 'Employee number must contain 1–64 ASCII letters, numbers, dots, underscores or hyphens.'), 'error'); return Promise.resolve(); }
    if (!validPassword(password)) { setStatus(safeError({ code: 'HT_PASSWORD_POLICY' }), 'error'); return Promise.resolve(); }
    if (password !== confirmPassword) { setStatus(tr('两次输入的密码不一致，请重新输入。', 'The passwords do not match. Enter them again.'), 'error'); return Promise.resolve(); }
    var normalized = employeeNumber.toLowerCase();
    draft.credentialsEmployeeNumber = normalized;
    var ticket = lifeEpoch;
    setBusy(true);
    return call('setEmployeeCredentials', { employeeNumber: normalized, password: password }).then(function (response) {
      if (!live(ticket)) return response;
      applyReturnedStatus(response);
      accountPanel = '';
      setStatus(tr('工号和密码已添加到当前邮箱账号。', 'Employee credentials were added to this email account.'), 'ok');
      return refreshAll(ticket, true);
    }).catch(function (error) { if (live(ticket)) setStatus(safeError(error), 'error'); }).finally(function () { if (live(ticket)) setBusy(false); });
  }
  function requestEmailBinding(form) {
    var data = new root.FormData(form);
    var email = value(data.get('email')).trim();
    var currentPassword = value(data.get('currentPassword'));
    clearPasswordFields(form);
    if (!email) { setStatus(tr('请输入要绑定的邮箱。', 'Enter the email address to bind.'), 'error'); return Promise.resolve(); }
    if (!currentPassword) { setStatus(tr('请输入当前密码。', 'Enter your current password.'), 'error'); return Promise.resolve(); }
    draft.bindingEmail = email;
    var ticket = lifeEpoch;
    setBusy(true);
    return call('requestEmailBinding', { email: email, currentPassword: currentPassword }).then(function (response) {
      if (!live(ticket)) return response;
      employeeBindingPendingEmail = email;
      draft.bindingOtp = '';
      setStatus(tr('验证邮件已发送。请查看邮箱。', 'Verification email sent. Check your inbox.'), 'ok');
      render();
      var code = dom.content.querySelector('[data-focus-key="binding-otp"]');
      if (code) code.focus();
      return response;
    }).catch(function (error) { if (live(ticket)) setStatus(safeError(error), 'error'); }).finally(function () { if (live(ticket)) setBusy(false); });
  }
  function confirmEmailBinding(form) {
    var data = new root.FormData(form);
    var email = value(data.get('email')).trim();
    var otp = value(data.get('otp')).trim();
    var currentPassword = value(data.get('currentPassword'));
    clearPasswordFields(form);
    if (!email || email !== employeeBindingPendingEmail || !otp) { setStatus(tr('请输入待绑定邮箱收到的验证码。', 'Enter the code sent to the email being bound.'), 'error'); return Promise.resolve(); }
    if (!currentPassword) { setStatus(tr('请输入当前密码。', 'Enter your current password.'), 'error'); return Promise.resolve(); }
    draft.bindingOtp = otp;
    var ticket = lifeEpoch;
    setBusy(true);
    return call('confirmEmailBinding', { email: email, otp: otp, currentPassword: currentPassword }).then(function (response) {
      if (!live(ticket)) return response;
      applyReturnedStatus(response);
      accountPanel = '';
      employeeBindingPendingEmail = '';
      delete draft.bindingEmail;
      delete draft.bindingOtp;
      setStatus(tr('邮箱已绑定到当前员工账号。', 'Email was bound to the current employee account.'), 'ok');
      return refreshAll(ticket, true);
    }).catch(function (error) { if (live(ticket)) setStatus(safeError(error), 'error'); }).finally(function () { if (live(ticket)) setBusy(false); });
  }
  function createEmployee(form) {
    if (!isAccountAdmin()) return Promise.resolve(null);
    var data = new root.FormData(form);
    var rawNumber = value(data.get('employeeNumber')).trim();
    var name = value(data.get('name')).trim();
    var password = value(data.get('password'));
    var confirmPassword = value(data.get('confirmPassword'));
    clearPasswordFields(form);
    if (!validEmployeeNumber(rawNumber)) { setStatus(tr('员工号需为 1–64 个英文字母、数字、点、下划线或连字符。', 'Employee number must contain 1–64 ASCII letters, numbers, dots, underscores or hyphens.'), 'error'); return Promise.resolve(); }
    if (!name) { setStatus(tr('请输入员工姓名。', 'Enter the employee name.'), 'error'); return Promise.resolve(); }
    if (!validPassword(password)) { setStatus(safeError({ code: 'HT_PASSWORD_POLICY' }), 'error'); return Promise.resolve(); }
    if (password !== confirmPassword) { setStatus(tr('两次输入的临时密码不一致，请重新输入。', 'The temporary passwords do not match. Enter them again.'), 'error'); return Promise.resolve(); }
    var employeeNumber = rawNumber.toLowerCase();
    draft.employeeCreateNumber = employeeNumber;
    draft.employeeCreateName = name;
    var ticket = lifeEpoch;
    setBusy(true);
    return call('createEmployee', { employeeNumber: employeeNumber, name: name, password: password }).then(function (response) {
      if (!live(ticket)) return response;
      var employee = response.employee || { employeeNumber: employeeNumber, name: name };
      draft.employeeAssignmentEmployeeNumber = employee.employeeNumber || employeeNumber;
      if (!draft.employeeAssignmentTeamId && selectedTeamId) draft.employeeAssignmentTeamId = selectedTeamId;
      draft.employeeAssignmentDepartmentIds = [];
      employeeAssignmentOperationId = '';
      employeeAssignmentSignature = '';
      employeesLoaded = false;
      setStatus(tr('员工已创建。可单独分配团队；员工首次登录必须修改临时密码。', 'Employee created. Assign a team separately if needed. The employee must change the temporary password at first sign-in.'), 'ok');
      var createDetails = dom.content.querySelector('[data-detail-key="employee-create"]');
      var assignDetails = dom.content.querySelector('[data-detail-key="employee-assign"]');
      if (createDetails) createDetails.open = false;
      if (assignDetails) assignDetails.open = true;
      return loadEmployees().then(function () { return response; });
    }).catch(function (error) { if (live(ticket)) { setStatus(safeError(error), 'error'); render(); } }).finally(function () { if (live(ticket)) setBusy(false); });
  }
  function assignEmployee(form) {
    if (!isAccountAdmin()) return Promise.resolve(null);
    var data = new root.FormData(form);
    var employeeNumber = value(data.get('employeeNumber')).trim();
    var teamId = value(data.get('teamId')).trim();
    var departmentIds = Array.prototype.map.call(form.querySelectorAll('input[name="departmentIds"]:checked'), function (input) { return input.value; }).sort();
    if (!employeeNumber || !teamId || !teamById(teamId) || !isAdmin(teamById(teamId))) { setStatus(tr('请选择员工和你管理的有效团队。', 'Choose an employee and a valid team you administer.'), 'error'); return Promise.resolve(); }
    var signature = JSON.stringify({ teamId: teamId, employeeNumber: employeeNumber, departmentIds: departmentIds });
    if (signature !== employeeAssignmentSignature || !employeeAssignmentOperationId) {
      employeeAssignmentSignature = signature;
      employeeAssignmentOperationId = operationId();
    }
    var ticket = lifeEpoch;
    setBusy(true);
    return call('assignEmployee', { teamId: teamId, employeeNumber: employeeNumber, departmentIds: departmentIds, operationId: employeeAssignmentOperationId }).then(function (response) {
      if (!live(ticket)) return response;
      employeeAssignmentOperationId = '';
      employeeAssignmentSignature = '';
      draft.employeeAssignmentDepartmentIds = [];
      setStatus(tr('员工已分配到所选团队和部门。', 'Employee assigned to the selected team and departments.'), 'ok');
      return refreshAll(ticket, true).then(function () { return response; });
    }).catch(function (error) { if (live(ticket)) { setStatus(safeError(error), 'error'); render(); } }).finally(function () { if (live(ticket)) setBusy(false); });
  }
  function resetEmployeePassword(form) {
    if (!isAccountAdmin()) return Promise.resolve(null);
    var employeeNumber = employeeResetTarget;
    var data = new root.FormData(form);
    var newPassword = value(data.get('newPassword'));
    var confirmPassword = value(data.get('confirmPassword'));
    var adminPassword = value(data.get('adminPassword'));
    clearPasswordFields(form);
    if (!employeeNumber) { setStatus(tr('请选择要重置的员工。', 'Choose an employee to reset.'), 'error'); return Promise.resolve(); }
    if (!validPassword(newPassword)) { setStatus(safeError({ code: 'HT_PASSWORD_POLICY' }), 'error'); return Promise.resolve(); }
    if (newPassword !== confirmPassword) { setStatus(tr('两次输入的新密码不一致，请重新输入。', 'The new passwords do not match. Enter them again.'), 'error'); return Promise.resolve(); }
    if (!adminPassword) { setStatus(tr('请输入管理员当前密码。', 'Enter the admin current password.'), 'error'); return Promise.resolve(); }
    var ticket = lifeEpoch;
    setBusy(true);
    return call('resetEmployeePassword', { employeeNumber: employeeNumber, newPassword: newPassword, adminPassword: adminPassword }).then(function (response) {
      if (!live(ticket)) return response;
      employeeResetTarget = '';
      setStatus(tr('员工密码已重置；下次登录必须修改临时密码。', 'Employee password reset. The employee must change the temporary password at next sign-in.'), 'ok');
      employeesLoaded = false;
      return loadEmployees().then(function () { return response; });
    }).catch(function (error) { if (live(ticket)) { setStatus(safeError(error), 'error'); render(); } }).finally(function () { if (live(ticket)) setBusy(false); });
  }
  function signOut() {
    if (!open || actionBusy) return;
    var ticket = lifeEpoch;
    setBusy(true);
    cancelSSOFlow({ render: true }).then(function () {
      if (!live(ticket)) return null;
      return call('signOut');
    }).then(function (response) {
      if (!live(ticket)) return;
      model.state = null;
      model.messages = null;
      messagesRoomId = '';
      invitePreview = null;
      createdInvite = null;
      proposals = [];
      selectedTeamId = '';
      selectedRoomId = '';
      activePane = 'team';
      setStatus(tr('已退出登录。', 'Signed out.'), 'ok');
      return refreshAll(ticket, true);
    }).catch(function (error) { if (live(ticket)) setStatus(safeError(error), 'error'); }).finally(function () { if (live(ticket)) setBusy(false); });
  }
  function submitAuth(form) {
    var data = new root.FormData(form);
    var email = value(data.get('email')).trim();
    if (email !== value(draft.otpSentEmail)) return sendCode();
    return signIn(form);
  }
  function handleSubmit(event) {
    var form = event.target && event.target.closest ? event.target.closest('form[data-form]') : null;
    if (!form) return;
    event.preventDefault();
    if (actionBusy) return;
    var kind = form.dataset.form;
    var data = new root.FormData(form);
    if (kind === 'configure') {
      var identityURL = value(data.get('identityURL')).trim();
      var nodeURL = value(data.get('nodeURL')).trim();
      var ticket = lifeEpoch;
      setBusy(true);
      cancelSSOFlow({ render: true }).then(function () {
        if (!live(ticket)) return null;
        return call('configure', { identityURL: identityURL, nodeURL: nodeURL });
      }).then(function (response) {
        if (!live(ticket)) return;
        closeConnectionSettings();
        delete draft.identityURL;
        delete draft.nodeURL;
        setStatus(tr('服务地址已保存。', 'Service addresses saved.'), 'ok');
        return refreshAll(ticket, true);
      }).catch(function (error) { if (live(ticket)) setStatus(safeError(error), 'error'); }).finally(function () { if (live(ticket)) setBusy(false); });
      return;
    }
    if (kind === 'auth-password') { signInPassword(form); return; }
    if (kind === 'auth') { submitAuth(form); return; }
    if (kind === 'change-password') { changePassword(form); return; }
    if (kind === 'set-credentials') { setEmployeeCredentials(form); return; }
    if (kind === 'request-email-binding') { requestEmailBinding(form); return; }
    if (kind === 'confirm-email-binding') { confirmEmailBinding(form); return; }
    if (kind === 'create-employee') { createEmployee(form); return; }
    if (kind === 'assign-employee') { assignEmployee(form); return; }
    if (kind === 'reset-employee-password') { resetEmployeePassword(form); return; }
    if (kind === 'create-team') {
      var name = value(data.get('name')).trim();
      if (!name) { setStatus(tr('请输入团队名称。', 'Enter a team name.'), 'error'); return; }
      mutate('createTeam', { name: name, operationId: operationId() }, personalMode ? tr('小组和群聊已创建。', 'The group and its room were created.') : tr('团队和团队总群已创建。', 'The team and its group were created.'), function (response) {
        var result = response.result || {};
        if (result.teamId) selectTeam(result.teamId);
        if (result.roomId) selectedRoomId = result.roomId;
        draft.createTeamName = '';
      });
      return;
    }
    if (kind === 'recommend') {
      var goal = value(data.get('goal')).trim();
      if (!goal) { setStatus(tr('请先填写团队目标。', 'Enter a team goal first.'), 'error'); return; }
      var ticket = lifeEpoch;
      setBusy(true);
      call('recommend', { teamId: selectedTeamId, goal: goal }).then(function (response) {
        if (!live(ticket)) return;
        var result = response.result || {};
        proposals = Array.isArray(result.proposals) ? result.proposals.slice(0, 4) : [];
        proposalDrafts = Object.create(null);
        setStatus(proposals.length ? tr('建议已生成，请核对工作空间、项目、BOT 和成员后再创建。', 'Suggestions are ready. Review each workspace, project, Bot and member before creating it.') : tr('没有返回可用的部门建议。', 'No usable department suggestions were returned.'), proposals.length ? 'ok' : '');
        render();
      }).catch(function (error) { if (live(ticket)) setStatus(safeError(error), 'error'); }).finally(function () { if (live(ticket)) setBusy(false); });
      return;
    }
    if (kind === 'create-department') {
      var departmentName = value(data.get('name')).trim();
      var memberIds = Array.prototype.map.call(form.querySelectorAll('input[name="memberIds"]:checked'), function (input) { return input.value; });
      var owner = myMember(selectedTeamId);
      if (owner && memberIds.indexOf(owner.id) < 0) memberIds.push(owner.id);
      var projectIds = Array.prototype.map.call(form.querySelectorAll('input[name="projectRefIds"]:checked'), function (input) { return input.value; });
      var botIds = Array.prototype.map.call(form.querySelectorAll('input[name="botRefIds"]:checked'), function (input) { return input.value; });
      var projectRefs = selectedCatalogRefs(catalogProjects, projectIds);
      var botRefs = selectedCatalogRefs(catalogBots, botIds);
      if (!projectRefs || !botRefs) { setStatus(tr('本机名称列表已变化，请重新读取并选择工程或 BOT。', 'The local name list changed. Reload it and choose projects or Bots again.'), 'error'); return; }
      if (!departmentName) { setStatus(tr('请输入部门名称。', 'Enter a department name.'), 'error'); return; }
      mutate('createDepartment', { teamId: selectedTeamId, name: departmentName, memberIds: memberIds, projectRefs: projectRefs, botRefs: botRefs, createGroup: data.get('createGroup') === 'true', operationId: operationId() }, tr('部门已创建。', 'The department was created.'), function () {
        draft.departmentName = '';
        draft.departmentMembers = [];
        draft.departmentProjectIds = [];
        draft.departmentBotIds = [];
        draft.createGroup = false;
      });
      return;
    }
    if (kind === 'create-invite') {
      var departmentIds = Array.prototype.map.call(form.querySelectorAll('input[name="departmentIds"]:checked'), function (input) { return input.value; });
      mutate('createInvite', { teamId: selectedTeamId, departmentIds: departmentIds, operationId: operationId() }, tr('邀请码已创建。', 'Invite code created.'), function (response) {
        var result = response.result || {};
        createdInvite = { teamId: selectedTeamId, code: result.code || '', id: result.id || '', expiresAt: result.expiresAt };
        draft.inviteDepartments = [];
      });
      return;
    }
    if (kind === 'preview-invite') {
      var code = value(data.get('code')).trim();
      if (!code) { setStatus(tr('请输入邀请码。', 'Enter an invite code.'), 'error'); return; }
      var ticket = lifeEpoch;
      setBusy(true);
      call('previewInvite', { code: code }).then(function (response) {
        if (!live(ticket)) return;
        invitePreview = Object.assign({ code: code }, response.result || {});
        setStatus(personalMode ? tr('邀请内容已确认。接受前请核对小组和空间。', 'Invite details are ready. Check the group and spaces before accepting.') : tr('邀请内容已确认。接受前请核对团队和部门。', 'Invite details are ready. Check the team and departments before accepting.'), 'ok');
        render();
      }).catch(function (error) { if (live(ticket)) { invitePreview = null; setStatus(safeError(error), 'error'); render(); } }).finally(function () { if (live(ticket)) setBusy(false); });
      return;
    }
    if (kind === 'transfer-admin') {
      var targetMemberId = value(data.get('targetMemberId'));
      var team = selectedTeam();
      if (!team || !targetMemberId) { setStatus(tr('请选择一位团队成员。', 'Choose a team member.'), 'error'); return; }
      mutate('transferAdmin', { teamId: team.id, targetMemberId: targetMemberId, expectedRevision: team.revision, operationId: operationId() }, tr('转让请求已发送，管理员身份尚未变化。', 'Transfer requested. The current admin role remains unchanged until acceptance.'), function () { draft.transferTarget = ''; });
      return;
    }
    if (kind === 'send-message') {
      var room = selectedRoom();
      var text = value(data.get('text')).trim();
      if (!room || !text) { setStatus(tr('请输入群消息。', 'Enter a group message.'), 'error'); return; }
      var requestedTargetId = value(data.get('targetMemberId'));
      var currentRoomData = model.messages && messagesRoomId === room.id ? model.messages : null;
      var requestedTarget = currentRoomData && Array.isArray(currentRoomData.members) ? currentRoomData.members.filter(function (member) { return member.id === requestedTargetId; })[0] : null;
      var targetId = requestedTarget && requestedTarget.mode && requestedTarget.mode.enabled && requestedTarget.mode.available ? requestedTargetId : '';
      var targetBecameUnavailable = !!(requestedTargetId && !targetId);
      var messageDraftKey = 'message-' + room.id;
      var messageMode = model.messages && model.messages.mode || (currentRoomMember() && currentRoomMember().mode) || {};
      var ticket = lifeEpoch;
      setBusy(true);
      call('sendMessage', { roomId: room.id, text: text, takeBack: !!messageMode.enabled, operationId: operationId() }).then(function (response) {
        if (!live(ticket)) return;
        draft[messageDraftKey] = '';
        var result = response.result || {};
        if (targetId) {
          if (!result.messageId) {
            setStatus(tr('真人消息已提交，但服务未返回触发消息 ID，AI 未启动。', 'The human message was submitted, but no trigger ID was returned. AI was not started.'), 'error');
          } else {
            return call('requestAI', { roomId: room.id, targetMemberId: targetId, triggerMessageId: result.messageId, operationId: operationId() }).then(function () {
              if (!live(ticket)) return;
              setStatus(tr('真人消息已提交，已按所选成员授权启动 AI 代班。', 'Human message submitted; the selected authorized AI delegate was started.'), 'ok');
            }).catch(function (error) {
              if (live(ticket)) setStatus(tr('真人消息已提交，但 AI 代班未启动：', 'Human message submitted, but the AI delegate did not start: ') + safeError(error), 'error');
            });
          }
        } else {
          setStatus(targetBecameUnavailable ? tr('群消息已发送；所选成员当前没有可用执行设备，未启动 AI。', 'Message sent. The selected member has no available executor, so AI was not started.') : (messageMode.enabled ? tr('已接回并发送真人消息；本群 AI 代班已关闭。', 'Human message sent after takeback; AI delegate is off in this group.') : tr('群消息已发送。', 'Group message sent.')), targetBecameUnavailable ? 'error' : 'ok');
        }
      }).then(function () {
        if (!live(ticket)) return;
        return refreshMessages(room.id, ticket, { force: true });
      }).catch(function (error) { if (live(ticket)) setStatus(safeError(error), 'error'); }).finally(function () { if (live(ticket)) setBusy(false); });
      return;
    }
  }
  function handleInput(event) {
    var target = event.target;
    if (!target || !target.name) return;
    var key = target.name;
    if (key === 'name' && target.form && target.form.dataset.form === 'auth') key = 'name';
    var focusKey = target.getAttribute('data-focus-key');
    if (focusKey === 'auth-email') {
      draft.email = target.value;
      if (draft.otpSentEmail && draft.otpSentEmail !== target.value.trim()) delete draft.otpSentEmail;
    } else if (focusKey === 'auth-otp') draft.otp = target.value;
    else if (focusKey === 'auth-name') draft.name = target.value;
    else if (focusKey === 'auth-employee-number') draft.authEmployeeNumber = target.value;
    else if (focusKey === 'credentials-employee-number') draft.credentialsEmployeeNumber = target.value;
    else if (focusKey === 'binding-email') draft.bindingEmail = target.value;
    else if (focusKey === 'binding-otp') draft.bindingOtp = target.value;
    else if (focusKey === 'employee-create-number') draft.employeeCreateNumber = target.value;
    else if (focusKey === 'employee-create-name') draft.employeeCreateName = target.value;
    else if (focusKey === 'create-team-name') draft.createTeamName = target.value;
    else if (focusKey === 'team-goal') draft.recommendGoal = target.value;
    else if (focusKey === 'department-name') draft.departmentName = target.value;
    else if (focusKey === 'department-projects') draft.departmentProjects = target.value;
    else if (focusKey === 'department-bots') draft.departmentBots = target.value;
    else if (focusKey === 'group-message') {
      var room = selectedRoom();
      if (room) draft['message-' + room.id] = target.value;
    } else if (key === 'identityURL') draft.identityURL = target.value;
    else if (key === 'nodeURL') draft.nodeURL = target.value;
    if (target.getAttribute('data-focus-key') === 'invite-code') draft.inviteCode = target.value;
  }
  function handleChange(event) {
    var target = event.target;
    if (!target) return;
    if (target.dataset.change === 'team') {
      setStatus('', '');
      selectTeam(target.value);
      selectedRoomId = '';
      model.messages = null;
      messagesRoomId = '';
      invitePreview = null;
      createdInvite = null;
      proposals = [];
      proposalDrafts = Object.create(null);
      draft.inviteDepartments = [];
      draft.departmentMembers = [];
      draft.departmentProjectIds = [];
      draft.departmentBotIds = [];
      draft.transferTarget = '';
      setDefaultRoom(selectedTeamId);
      render();
      if (activePane === 'chat' && selectedRoomId) refreshMessages(selectedRoomId, lifeEpoch, { force: true }).catch(function () {});
      return;
    }
    if (target.dataset.change === 'mention') {
      mentionMemberId = target.value;
      draft.mentionMemberId = target.value;
      render();
      return;
    }
    if (target.dataset.change === 'local-bot') {
      model.selectedLocalBotId = target.value;
      return;
    }
    if (target.dataset.change === 'employee-assignment-team') {
      var previousAssignmentTeam = draft.employeeAssignmentTeamId || selectedTeamId || '';
      draft.employeeAssignmentTeamId = target.value;
      if (previousAssignmentTeam !== target.value) draft.employeeAssignmentDepartmentIds = [];
      setStatus('', '');
      render();
      return;
    }
    if (target.dataset.change === 'employee-assignment-employee') {
      draft.employeeAssignmentEmployeeNumber = target.value;
      setStatus('', '');
      return;
    }
    if (target.matches('input[name="departmentIds"]')) {
      var inviteForm = target.closest('form[data-form="create-invite"]');
      var assignmentForm = target.closest('form[data-form="assign-employee"]');
      if (assignmentForm) {
        draft.employeeAssignmentDepartmentIds = Array.prototype.map.call(assignmentForm.querySelectorAll('input[name="departmentIds"]:checked'), function (input) { return input.value; });
        return;
      }
      draft.inviteDepartments = inviteForm ? Array.prototype.map.call(inviteForm.querySelectorAll('input[name="departmentIds"]:checked'), function (input) { return input.value; }) : [];
      return;
    }
    if (target.matches('input[name="memberIds"]')) {
      var departmentForm = target.closest('form[data-form="create-department"]');
      draft.departmentMembers = departmentForm ? Array.prototype.map.call(departmentForm.querySelectorAll('input[name="memberIds"]:checked'), function (input) { return input.value; }) : [];
      return;
    }
    if (target.matches('input[data-catalog-ref="project"]')) {
      var projectForm = target.closest('form[data-form="create-department"]');
      draft.departmentProjectIds = projectForm ? Array.prototype.map.call(projectForm.querySelectorAll('input[name="projectRefIds"]:checked'), function (input) { return input.value; }) : [];
      return;
    }
    if (target.matches('input[data-catalog-ref="bot"]')) {
      var botForm = target.closest('form[data-form="create-department"]');
      draft.departmentBotIds = botForm ? Array.prototype.map.call(botForm.querySelectorAll('input[name="botRefIds"]:checked'), function (input) { return input.value; }) : [];
      return;
    }
    if (target.matches('[data-proposal-members]')) {
      var proposalIndex = Number(target.dataset.proposalMembers);
      proposalDrafts[proposalIndex] = proposalDrafts[proposalIndex] || {};
      proposalDrafts[proposalIndex].memberIds = Array.prototype.map.call(dom.content.querySelectorAll('input[data-proposal-members="' + proposalIndex + '"]:checked'), function (input) { return input.value; });
      return;
    }
    if (target.name === 'createGroup') { draft.createGroup = target.checked; return; }
    if (target.name === 'targetMemberId') { draft.transferTarget = target.value; return; }
    if (target.name === 'text' && target.form && target.form.dataset.form === 'send-message') {
      var room = selectedRoom();
      if (room) draft['message-' + room.id] = target.value;
    }
  }
  function handleClick(event) {
    var target = event.target && event.target.closest ? event.target.closest('button') : null;
    if (!target || !dom.content.contains(target)) return;
    if (actionBusy) return;
    if (secureStorageBlocked || secureStorageRetrying) {
      if (target.dataset.action === 'retry-secure-storage') retrySecureStorage();
      return;
    }
    if (target.dataset.authMode) {
      if (target.dataset.authMode === 'email' && !authCapabilities.emailLogin) return;
      if (target.dataset.authMode === 'employee' && !authCapabilities.passwordLogin) return;
      authMode = target.dataset.authMode === 'email' ? 'email' : 'employee';
      setStatus('', '');
      render();
      var firstInput = dom.content.querySelector(authMode === 'email' ? '[data-focus-key="auth-email"]' : '[data-focus-key="auth-employee-number"]');
      if (firstInput) firstInput.focus();
      return;
    }
    if (target.dataset.personalSection) { selectPersonalSection(target.dataset.personalSection); return; }
    if (target.dataset.action === 'back-account') { backAccountPanel(); return; }
    if (target.dataset.action === 'refresh-devices') { refreshStatus(lifeEpoch); return; }
    if (target.dataset.action === 'connect-device') {
      // The pool connection completes before this receipt returns, so the
      // readiness projection can be fetched right away instead of waiting for
      // the manual refresh or the next periodic poll.
      mutate('networkConnect', { deviceId: target.dataset.deviceId }, tr('设备已连接，可用 BOT 已导入，可在 BOT 列表中使用。', 'Device connected. Its available Bots were imported and can be used from the Bot list.'), function () { refreshStatus(lifeEpoch); });
      return;
    }
    if (target.dataset.action === 'revoke-device') {
      target.dataset.action = 'confirm-revoke-device';
      target.textContent = tr('确认撤销此设备连接', 'Confirm revoking this device');
      return;
    }
    if (target.dataset.action === 'confirm-revoke-device') {
      var deviceId = target.dataset.deviceId;
      var network = model.status && model.status.network;
      if (!network || !network.available || deviceId === network.localDeviceId || !(network.devices || []).some(function (d) { return d.id === deviceId && !d.revoked; })) return;
      mutate('networkRevoke', { deviceId: deviceId }, tr('设备连接已撤销。', 'Device connection revoked.'), function () { refreshStatus(lifeEpoch); });
      return;
    }
    if (target.dataset.action === 'retry-auth-capabilities') {
      if (!authCapabilitiesKey || !model.status || !model.status.configured || authCapabilitiesLoading) return;
      authCapabilitiesLoaded = false;
      authCapabilitiesError = '';
      loadAuthCapabilities(lifeEpoch, authCapabilitiesKey);
      return;
    }
    if (target.dataset.action === 'refresh-employees') {
      if (!isAccountAdmin()) return;
      employeesLoaded = false;
      employeesError = '';
      loadEmployees();
      return;
    }
    if (target.dataset.action === 'reset-employee') {
      if (!isAccountAdmin()) return;
      var resetTarget = value(target.dataset.employeeNumber);
      var resetEmployee = employees.filter(function (employee) { return employee && employee.employeeNumber === resetTarget && employee.canResetPassword === true && employee.isAccountAdmin !== true; })[0];
      if (!resetEmployee) return;
      employeeResetTarget = resetTarget;
      setStatus('', '');
      render();
      var resetPasswordInput = dom.content.querySelector('[data-focus-key="employee-reset-new-password"]');
      if (resetPasswordInput) resetPasswordInput.focus();
      return;
    }
    if (target.dataset.action === 'cancel-employee-reset') {
      var cancelledResetTarget = employeeResetTarget;
      employeeResetTarget = '';
      setStatus('', '');
      render();
      var resetButtons = dom.content.querySelectorAll('[data-action="reset-employee"]');
      var resetButton = Array.prototype.filter.call(resetButtons, function (button) { return button.dataset.employeeNumber === cancelledResetTarget; })[0];
      if (resetButton) resetButton.focus();
      return;
    }
    if (target.dataset.action === 'restart-email-binding') {
      employeeBindingPendingEmail = '';
      delete draft.bindingOtp;
      setStatus('', '');
      render();
      var bindingEmailInput = dom.content.querySelector('[data-focus-key="binding-email"]');
      if (bindingEmailInput) bindingEmailInput.focus();
      return;
    }
    if (target.dataset.ssoProvider) { startSSO(target.dataset.ssoProvider); return; }
    if (target.dataset.action === 'retry-sso-providers') { loadSSOProviders(lifeEpoch, true); return; }
    if (target.dataset.action === 'cancel-sso') {
      cancelSSOFlow({ render: true, focusAfter: true, message: tr('公司登录已取消。', 'Company sign-in was cancelled.') }).catch(function () {});
      return;
    }
    if (target.dataset.pane) {
      if (activePane !== target.dataset.pane) setStatus('', '');
      activePane = target.dataset.pane;
      render();
      if (activePane === 'chat' && selectedRoomId) refreshMessages(selectedRoomId, lifeEpoch, { force: true }).catch(function () {});
      if (activePane === 'team' && !localBotsLoaded && !localBotsError) { /* Explicit read remains available in the advanced section. */ }
      return;
    }
    if (target.dataset.openRoom) {
      if (selectedRoomId !== target.dataset.openRoom) setStatus('', '');
      selectedRoomId = target.dataset.openRoom;
      activePane = 'chat';
      model.messages = null;
      messagesRoomId = '';
      mentionMemberId = '';
      render();
      refreshMessages(selectedRoomId, lifeEpoch, { force: true }).catch(function () {});
      return;
    }
    if (target.dataset.room) {
      if (selectedRoomId !== target.dataset.room) setStatus('', '');
      selectedRoomId = target.dataset.room;
      model.messages = null;
      messagesRoomId = '';
      mentionMemberId = '';
      render();
      refreshMessages(selectedRoomId, lifeEpoch, { force: true }).catch(function () {});
      return;
    }
    if (target.dataset.action === 'resend-code') { sendCode(); return; }
    if (target.dataset.action === 'retry-state') { refreshState(lifeEpoch, { force: true }).catch(function () {}); return; }
    if (target.dataset.action === 'open-local-bot-binding') {
      activePane = 'team';
      setStatus('', '');
      render();
      var localBotDetails = dom.content.querySelector('details[data-detail-key="local-bots"]');
      if (localBotDetails) {
        localBotDetails.open = true;
        var localBotSummary = localBotDetails.querySelector('summary');
        if (localBotSummary) localBotSummary.focus();
      }
      return;
    }
    if (target.dataset.action === 'start-local-node') {
      var identityURL = inputValue('identityURL', model.status && model.status.identityURL || '').trim();
      if (!identityURL) { setStatus(tr('请先填写团队身份服务 URL。', 'Enter the identity service URL first.'), 'error'); return; }
      var nodeTicket = lifeEpoch;
      setBusy(true);
      call('startLocalNode', { identityURL: identityURL }).then(function (response) {
        if (!live(nodeTicket)) return;
        var result = response.result || {};
        if (typeof result.nodeURL !== 'string' || !result.nodeURL.trim()) throw new Error(tr('本机节点没有返回服务地址。', 'The local node did not return a service address.'));
        draft.nodeURL = result.nodeURL.trim();
        setStatus(tr('本机节点已启动。检查地址后再保存连接设置。', 'Local node started. Review the address, then save the connection settings.'), 'ok');
        render();
      }).catch(function (error) { if (live(nodeTicket)) setStatus(safeError(error), 'error'); }).finally(function () { if (live(nodeTicket)) setBusy(false); });
      return;
    }
    if (target.dataset.action === 'load-catalog') { loadCatalog(); return; }
    if (target.dataset.action === 'load-local-bots') { loadLocalBots(); return; }
    if (target.dataset.action === 'bind-local-bot') {
      var botId = model.selectedLocalBotId || '';
      if (!botId) { setStatus(tr('请先选择本机 Bot。', 'Choose a local Bot first.'), 'error'); return; }
      mutate('bindLocalBot', { teamId: selectedTeamId, botId: botId }, personalMode ? tr('本机 Bot 已绑定到你的小组身份。分享范围以各房间的授权状态为准。', 'Local Bot bound to your group membership. Each room keeps its own sharing setting.') : tr('本机 Bot 已绑定到本人。', 'Local Bot bound to your account.'));
      return;
    }
    if (target.dataset.action === 'accept-invite') {
      if (!invitePreview || !invitePreview.code) { setStatus(tr('请先预览有效的邀请码。', 'Preview a valid invite first.'), 'error'); return; }
      mutate('acceptInvite', { code: invitePreview.code, operationId: operationId() }, personalMode ? tr('已加入小组。', 'You joined the group.') : tr('已加入团队。', 'You joined the team.'), function (response) {
        var result = response.result || {};
        if (result.teamId) selectTeam(result.teamId);
        activePane = 'team';
        invitePreview = null;
        draft.inviteCode = '';
      });
      return;
    }
    if (target.dataset.applyProposal !== undefined) {
      var index = Number(target.dataset.applyProposal);
      var proposal = proposals[index];
      var team = selectedTeam();
      if (!proposal || !team) return;
      var owner = ownTeamMembership();
      var selected = Array.prototype.map.call(dom.content.querySelectorAll('input[data-proposal-members="' + index + '"]:checked'), function (input) { return input.value; });
      if (owner && selected.indexOf(owner.id) < 0) selected.push(owner.id);
      mutate('applyProposal', { teamId: team.id, proposal: proposal, memberIds: selected, operationId: operationId() }, tr('已创建建议的工作空间。', 'Suggested workspace created.'), function (response) {
        var result = response.result || {};
        if (result.roomId) selectedRoomId = result.roomId;
        proposals.splice(index, 1);
        var nextDrafts = Object.create(null);
        Object.keys(proposalDrafts).forEach(function (key) {
          var oldIndex = Number(key);
          if (oldIndex < index) nextDrafts[oldIndex] = proposalDrafts[key];
          else if (oldIndex > index) nextDrafts[oldIndex - 1] = proposalDrafts[key];
        });
        proposalDrafts = nextDrafts;
      });
      return;
    }
    if (target.dataset.removeMember) {
      var teamForRemoval = selectedTeam();
      var memberId = target.dataset.removeMember;
      var member = teamMember(selectedTeamId, memberId);
      if (!teamForRemoval || !member) return;
      target.hidden = true;
      var confirm = root.document.createElement('button');
      confirm.type = 'button'; confirm.className = 'ht-button ht-danger'; confirm.dataset.confirmRemoveMember = memberId; confirm.dataset.focusKey = 'confirm-remove-' + memberId;
      confirm.textContent = tr('确认移除', 'Confirm removal');
      target.parentNode.insertBefore(confirm, target.nextSibling);
      var cancel = root.document.createElement('button');
      cancel.type = 'button'; cancel.className = 'ht-button ht-quiet'; cancel.dataset.cancelRemoveMember = memberId; cancel.dataset.focusKey = 'cancel-remove-' + memberId;
      cancel.textContent = tr('取消', 'Cancel');
      target.parentNode.insertBefore(cancel, confirm.nextSibling);
      return;
    }
    if (target.dataset.cancelRemoveMember) {
      var removalId = target.dataset.cancelRemoveMember;
      var row = target.closest('.ht-list-end');
      if (row) {
        var original = row.querySelector('[data-remove-member="' + removalId + '"]');
        var confirmation = row.querySelector('[data-confirm-remove-member="' + removalId + '"]');
        if (original) original.hidden = false;
        if (confirmation) confirmation.remove();
      }
      target.remove();
      return;
    }
    if (target.dataset.confirmRemoveMember) {
      mutate('removeMember', { teamId: selectedTeamId, memberId: target.dataset.confirmRemoveMember, operationId: operationId() }, tr('成员已从团队移除。', 'Member removed from the team.'));
      return;
    }
    if (target.dataset.acceptTransfer) {
      var transferId = target.dataset.acceptTransfer;
      var teamForAccept = selectedTeam();
      if (!teamForAccept) return;
      mutate('acceptTransfer', { transferId: transferId, expectedRevision: teamForAccept.revision, operationId: operationId() }, tr('管理员转让已接受。', 'Admin transfer accepted.'));
      return;
    }
    if (target.dataset.cancelTransfer) {
      mutate('cancelTransfer', { transferId: target.dataset.cancelTransfer, operationId: operationId() }, tr('管理员转让已取消。', 'Admin transfer cancelled.'));
      return;
    }
    if (target.dataset.toggleTakeover !== undefined) {
      var room = selectedRoom();
      if (!room) return;
      var enableRoomDelegate = target.dataset.toggleTakeover === 'true';
      var roomDelegateSuccess = personalMode
        ? (enableRoomDelegate ? tr('已允许成员在本房间请求你的 Bot。成员变化后授权会自动关闭；你可随时关闭。', 'Members can now request your Bot in this room. Access will close if membership changes; you can turn it off anytime.') : tr('本房间的 Bot 授权已关闭。', 'Bot access in this room is off.'))
        : (enableRoomDelegate ? tr('本群 AI 代班已授权。', 'AI delegate authorized for this group.') : tr('本群 AI 代班已关闭。', 'AI delegate turned off for this group.'));
      mutate('setTakeover', { roomId: room.id, enabled: enableRoomDelegate, operationId: operationId() }, roomDelegateSuccess, function () {
        model.messages = null;
        messagesRoomId = '';
      });
      return;
    }
    if (target.dataset.disableTakeover) {
      var roomForDisable = selectedRoom();
      if (!roomForDisable) return;
      mutate('setTakeover', { roomId: roomForDisable.id, enabled: false, targetMemberId: target.dataset.disableTakeover, operationId: operationId() }, tr('该成员在本群的 AI 代班已关闭。', 'That member’s AI delegate is off in this group.'), function () {
        model.messages = null;
        messagesRoomId = '';
      });
    }
  }
  function handleKeydown(event) {
    if (!open || composing) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeDialog(); return; }
    if (event.key !== 'Tab') return;
    var list = focusables();
    if (!list.length) return;
    if (event.shiftKey && root.document.activeElement === list[0]) { event.preventDefault(); list[list.length - 1].focus(); }
    else if (!event.shiftKey && root.document.activeElement === list[list.length - 1]) { event.preventDefault(); list[0].focus(); }
  }
  function openDialog(options) {
    if (!initialized) init({ bridge: root.OpenBotBridge || root.grokbot || null });
    options = options || {};
    if (options.roomId && options.teamId && options.accountId) botbarNavigation = options;
    if (open) { if (botbarNavigation) refreshAll(lifeEpoch, true); if (dom.close) dom.close.focus(); return; }
    focusBefore = options.opener && options.opener.isConnected ? options.opener : root.document.activeElement;
    open = true;
    lifeEpoch++;
    setBusy(false);
    if (personalMode) accountPanel = '';
    resetSSOProviders();
    authMode = 'employee';
    statusEpoch++;
    stateEpoch++;
    messageEpoch++;
    model.status = null;
    stateLoading = false;
    messageLoading = false;
    if (dom.overlay) { dom.overlay.hidden = false; dom.overlay.setAttribute('aria-hidden', 'false'); }
    render();
    setStatus('', '');
    var ticket = lifeEpoch;
    startPollTimer();
    refreshAll(ticket, true);
    root.setTimeout(function () { if (open && dom.close) dom.close.focus(); }, 0);
  }
  function closeDialog() {
    if (!open) return;
    cancelSSOFlow({ render: false }).catch(function () {});
    open = false; botbarNavigation = null; botbarMention = null;
    secureStorageRetrying = false;
    lifeEpoch++;
    setBusy(false);
    catalogEpoch++;
    catalogLoading = false;
    statusEpoch++;
    stateEpoch++;
    messageEpoch++;
    stateLoading = false;
    messageLoading = false;
    composing = false;
    if (root.OpenBotCompanyData && typeof root.OpenBotCompanyData.mount === 'function') root.OpenBotCompanyData.mount(null, null);
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (pushRefreshTimer) { root.clearTimeout(pushRefreshTimer); pushRefreshTimer = null; }
    if (dom.overlay) { dom.overlay.hidden = true; dom.overlay.setAttribute('aria-hidden', 'true'); }
    setStatus('', '');
    var target = focusBefore && focusBefore.isConnected ? focusBefore : null;
    focusBefore = null;
    if (target && typeof target.focus === 'function') { try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); } }
  }
  function init(options) {
    if (initialized) return root.OpenBotHumanTeam;
    options = options || {};
    bridge = options.bridge !== undefined ? options.bridge : (root.OpenBotBridge || root.grokbot || null);
    personalMode = options.personal === true;
    initialized = true;
    ensureDialog();
    // The execution pool already pushes node status over this event; reuse it
    // so device readiness follows connect and disconnect without a new poll.
    if (bridge && typeof bridge.onNodeExecutionStatus === 'function' && !executionStatusSub) {
      executionStatusSub = bridge.onNodeExecutionStatus(function () {
        if (!open || secureStorageBlocked || secureStorageRetrying || actionBusy || pushRefreshTimer) return;
        if (!(model.status && model.status.signedIn)) return;
        pushRefreshTimer = root.setTimeout(function () {
          pushRefreshTimer = null;
          if (!open || secureStorageBlocked || secureStorageRetrying || actionBusy || !(model.status && model.status.signedIn)) return;
          refreshStatus(lifeEpoch);
        }, 400);
      });
    }
    if (bridge && typeof bridge.onBotbarCollaboration === 'function') bridge.onBotbarCollaboration(openDialog);
    return root.OpenBotHumanTeam;
  }
  root.OpenBotHumanTeam = { init: init, open: openDialog, close: closeDialog, refresh: function () { if (open) return refreshAll(lifeEpoch, true); return Promise.resolve(null); } };
})(window);
