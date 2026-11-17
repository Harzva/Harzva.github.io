(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenBotAppCatalog = api;
})(typeof window === 'object' ? window : null, function () {
  'use strict';

  function tr(zh, en, params) {
    var i18n = typeof window === 'object' && window.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en, params) : zh;
  }

  // This directory describes integration availability. Only the original three
  // cards own live configuration; a catalog entry cannot grant access or log in.
  var existingIds = Object.freeze(['telegram', 'weixin', 'feishu']);
  function entry(id, name, category, description, guideUrl, supportLevel, options) {
    options = options || {};
    return Object.freeze({
      id: id, name: name, category: category, description: description,
      logo: 'assets/app-logos/' + id + (options.logoExtension || (id === 'feishu' ? '.png' : '.svg')),
      guideUrl: guideUrl, supportLevel: supportLevel || 'planned',
      webUrl: options.webUrl || '', keywords: options.keywords || '',
      connectionNote: options.connectionNote || '', guideLabel: options.guideLabel || tr('查看官方开发文档', 'Read official developer docs'),
      status: supportLevel === 'desktop-channel' ? tr('可配置', 'Configurable') : supportLevel === 'node-adapter' ? tr('自建接入', 'Self-hosted') : tr('待接入', 'Planned')
    });
  }
  var entries = Object.freeze([
    entry('telegram', tr('Telegram', 'Telegram'), tr('消息', 'Messaging'), tr('在 Telegram 中与主 Bot 对话，接收任务结果。', 'Chat with the primary Bot in Telegram and receive task results.'), 'https://core.telegram.org/bots/api', 'desktop-channel'),
    entry('weixin', tr('微信 ClawBot', 'Weixin ClawBot'), tr('消息', 'Messaging'), tr('通过自建节点的微信文字入口交办任务。', 'Assign tasks through a Weixin text entry on a self-hosted node.'), 'https://developers.weixin.qq.com/', 'node-adapter'),
    entry('feishu', tr('飞书', 'Feishu'), tr('消息', 'Messaging'), tr('为飞书应用配置独立连接、指定本机 BOT 和允许名单。', 'Configure a dedicated Feishu app connection, selected local BOT and allowlists.'), 'https://open.feishu.cn/document/client-docs/bot-v3/bot-overview', 'desktop-channel'),
    entry('dingtalk', tr('钉钉', 'DingTalk'), tr('消息', 'Messaging'), tr('把钉钉会话接入主 Bot，收取任务进度。', 'Connect DingTalk conversations to the primary Bot and receive progress.'), 'https://open.dingtalk.com/document/'),
    entry('qq', tr('QQ', 'QQ'), tr('消息', 'Messaging'), tr('通过 QQ 机器人交办任务，接收处理结果。', 'Assign work through a QQ bot and receive the result.'), 'https://q.qq.com/wiki/'),
    entry('slack', tr('Slack', 'Slack'), tr('消息', 'Messaging'), tr('将工作消息转为任务，回到会话查看结果。', 'Turn work messages into tasks and return to the conversation for results.'), 'https://docs.slack.dev/'),
    entry('discord', tr('Discord', 'Discord'), tr('消息', 'Messaging'), tr('在 Discord 会话中向主 Bot 交办任务。', 'Assign tasks to the primary Bot in a Discord conversation.'), 'https://discord.com/developers/docs/intro'),
    entry('teams', tr('Microsoft Teams', 'Microsoft Teams'), tr('消息', 'Messaging'), tr('在 Teams 中交办事项，查看主 Bot 的回复。', 'Assign work in Teams and view the primary Bot’s replies.'), 'https://learn.microsoft.com/en-us/microsoftteams/platform/'),
    entry('notion', tr('Notion', 'Notion'), tr('知识与文件', 'Knowledge & files'), tr('查找页面和笔记，把整理结果写回知识库。', 'Find pages and notes, then write organized results back to the knowledge base.'), 'https://developers.notion.com/'),
    entry('obsidian', tr('Obsidian', 'Obsidian'), tr('知识与文件', 'Knowledge & files'), tr('按授权使用本地知识库中的笔记与链接。', 'Use notes and links in an authorized local knowledge base.'), 'https://docs.obsidian.md/'),
    entry('github', tr('GitHub', 'GitHub'), tr('开发与协作', 'Development & collaboration'), tr('结合代码、Issue 和 Pull Request 处理开发任务。', 'Work with code, issues and pull requests.'), 'https://docs.github.com/en/rest'),
    entry('gitlab', tr('GitLab', 'GitLab'), tr('开发与协作', 'Development & collaboration'), tr('查阅项目、议题与合并请求，跟进开发工作。', 'Review projects, issues and merge requests.'), 'https://docs.gitlab.com/api/rest/'),
    entry('google-drive', tr('Google Drive', 'Google Drive'), tr('网盘', 'Cloud storage'), tr('搜索云端文件，使用获授权的文档资料。', 'Search cloud files and use authorized documents.'), 'https://developers.google.com/drive/api/guides/about-sdk'),
    entry('aliyundrive', tr('阿里云盘', 'Alibaba Cloud Drive'), tr('网盘', 'Cloud storage'), tr('在网页版管理文件；Bot 文件访问待接入。', 'Manage files on the web; Bot file access is planned.'), 'https://www.alipan.com/developer', 'planned', {
      logoExtension: '.png', webUrl: 'https://www.alipan.com/', keywords: '阿里云盘 阿里云 阿里云盘开放平台 阿里盘 alipan aliyundrive cloud drive storage',
      connectionNote: tr('打开网页版后由你登录。Bot Studio 尚未接入网盘文件授权，暂不能搜索、下载或上传文件；后续需通过官方开放平台配置应用并由你授权。', 'Sign in to the web app yourself. Bot Studio does not yet have cloud-drive file authorization, so it cannot search, download or upload files; future access will use the provider’s official platform and your authorization.')
    }),
    entry('baidu-netdisk', tr('百度网盘', 'Baidu Netdisk'), tr('网盘', 'Cloud storage'), tr('在网页版管理文件；Bot 文件访问待接入。', 'Manage files on the web; Bot file access is planned.'), 'https://pan.baidu.com/union', 'planned', {
      logoExtension: '.png', webUrl: 'https://pan.baidu.com/', keywords: '百度网盘 百度云 百度云盘 baidu netdisk cloud drive storage',
      connectionNote: tr('打开网页版后由你登录。Bot Studio 尚未接入网盘文件授权，暂不能搜索、下载或上传文件；后续需通过官方开放平台配置应用并由你授权。', 'Sign in to the web app yourself. Bot Studio does not yet have cloud-drive file authorization, so it cannot search, download or upload files; future access will use the provider’s official platform and your authorization.')
    }),
    entry('quark-drive', tr('夸克网盘', 'Quark Drive'), tr('网盘', 'Cloud storage'), tr('可使用网页版，或了解官方网盘 Skill。', 'Use the web app or read the official cloud-drive Skill.'), 'https://www.quark.cn/documents/help/quark-drive-skill', 'planned', {
      logoExtension: '.png', webUrl: 'https://pan.quark.cn/', keywords: '夸克网盘 夸克云盘 quark skill Codex WorkBuddy cloud drive storage', guideLabel: tr('查看官方 Skill 指南', 'Read official Skill guide'),
      connectionNote: tr('打开网页版后由你登录。官方另提供网盘 Skill，可按指南为兼容的智能体安装并授权。Bot Studio 尚未内置此连接器，暂不能搜索、下载或上传文件；本页不代装 Skill 或读取网站 Cookie。', 'Sign in to the web app yourself. The provider also offers a cloud-drive Skill; follow its guide to install and authorize it for a compatible agent. Bot Studio does not include this connector yet, so it cannot search, download or upload files; this page does not install Skills or read site cookies.')
    }),
    entry('gmail', tr('Gmail', 'Gmail'), tr('日程与会议', 'Calendar & meetings'), tr('按授权整理邮件，起草回复和待处理事项。', 'Organize mail, draft replies and track follow-ups with authorization.'), 'https://developers.google.com/gmail/api/guides'),
    entry('google-calendar', tr('Google Calendar', 'Google Calendar'), tr('日程与会议', 'Calendar & meetings'), tr('查看日程和空闲时间，准备会议相关事项。', 'View events and free time, then prepare meeting tasks.'), 'https://developers.google.com/calendar/api/guides/overview'),
    entry('outlook', tr('Outlook', 'Outlook'), tr('日程与会议', 'Calendar & meetings'), tr('整理邮件与日程，准备回复和会议材料。', 'Organize mail and events, then prepare replies and meeting material.'), 'https://learn.microsoft.com/en-us/graph/outlook-mail-concept-overview'),
    entry('onedrive', tr('OneDrive', 'OneDrive'), tr('网盘', 'Cloud storage'), tr('查找云端文件，整理获授权的工作资料。', 'Find cloud files and organize authorized work material.'), 'https://learn.microsoft.com/en-us/graph/onedrive-concept-overview'),
    entry('microsoft-365', tr('Microsoft 365', 'Microsoft 365'), tr('知识与文件', 'Knowledge & files'), tr('把获授权的 Microsoft 365 工作资料用于任务。', 'Use authorized Microsoft 365 work material for tasks.'), 'https://learn.microsoft.com/en-us/graph/overview'),
    entry('todoist', tr('Todoist', 'Todoist'), tr('开发与协作', 'Development & collaboration'), tr('将对话中的待办整理成任务并跟进完成情况。', 'Turn conversation follow-ups into tasks and track completion.'), 'https://developer.todoist.com/'),
    entry('dropbox', tr('Dropbox', 'Dropbox'), tr('网盘', 'Cloud storage'), tr('查找和整理云盘中的文件与共享资料。', 'Find and organize files and shared cloud material.'), 'https://www.dropbox.com/developers'),
    entry('zoom', tr('Zoom', 'Zoom'), tr('日程与会议', 'Calendar & meetings'), tr('准备会议资料，整理获授权的会议记录。', 'Prepare meeting material and organize authorized meeting records.'), 'https://developers.zoom.us/'),
    entry('linear', tr('Linear', 'Linear'), tr('开发与协作', 'Development & collaboration'), tr('围绕议题和项目交办工作、汇总进度。', 'Assign work around issues and projects, then summarize progress.'), 'https://linear.app/developers'),
    entry('jira', tr('Jira', 'Jira'), tr('开发与协作', 'Development & collaboration'), tr('结合项目与工单信息整理任务和处理结果。', 'Use project and ticket information to organize work and results.'), 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/'),
    entry('figma', tr('Figma', 'Figma'), tr('开发与协作', 'Development & collaboration'), tr('查阅获授权的设计文件，整理设计协作事项。', 'Review authorized design files and organize design collaboration.'), 'https://developers.figma.com/docs/rest-api/')
  ]);

  function element(doc, tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function image(doc, item) {
    var img = element(doc, 'img', 'app-connection-logo');
    img.setAttribute('src', item.logo);
    img.setAttribute('alt', tr(item.name + ' 标志', item.name + ' logo'));
    img.setAttribute('width', '24');
    img.setAttribute('height', '24');
    img.setAttribute('decoding', 'async');
    img.addEventListener('error', function () {
      var holder = doc.createElement('span'); holder.innerHTML = '<svg data-visual-fallback="neutral" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="#748094"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/><circle cx="16" cy="16" r="2.4"/></svg>';
      var icon = holder.firstElementChild;
      icon.setAttribute('class', img.className); icon.setAttribute('role', 'img');
      icon.removeAttribute('aria-hidden'); icon.setAttribute('aria-label', tr(item.name + ' 标志不可用', item.name + ' logo unavailable'));
      img.replaceWith(icon);
    }, { once: true });
    return img;
  }
  function applyExistingLogos(grid) {
    if (!grid || !grid.ownerDocument) return 0;
    var updated = 0;
    entries.forEach(function (item) {
      if (existingIds.indexOf(item.id) < 0) return;
      var card = grid.querySelector('[data-app="' + item.id + '"]');
      var icon = card && card.querySelector('.app-connection-icon');
      if (!icon) return;
      var current = icon.querySelector('.app-connection-logo');
      if (current && current.getAttribute('src') === item.logo) return;
      icon.replaceChildren(image(grid.ownerDocument, item));
      updated++;
    });
    return updated;
  }
  function createPlannedCard(doc, item) {
    var card = element(doc, 'article', 'apps-card apps-catalog-card');
    card.setAttribute('data-app', item.id);
    card.setAttribute('data-category', item.category);
    card.setAttribute('data-support-level', item.supportLevel);
    card.setAttribute('data-setting', item.name);
    card.setAttribute('data-setting-control', 'apps-' + item.id + '-open');
    card.setAttribute('data-setting-keywords', 'apps application 应用 连接 ' + item.category + ' ' + item.name + ' ' + item.id + ' ' + item.keywords);
    var header = element(doc, 'header');
    var icon = element(doc, 'span', 'app-connection-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.appendChild(image(doc, item));
    var heading = element(doc, 'div');
    heading.appendChild(element(doc, 'h3', '', item.name));
    heading.appendChild(element(doc, 'span', 'apps-status', item.status));
    header.appendChild(icon); header.appendChild(heading); card.appendChild(header);
    card.appendChild(element(doc, 'p', 'apps-description', item.description));
    if (item.webUrl) {
      var web = element(doc, 'a', 'btn apps-web-link', tr('打开网页版', 'Open web app'));
      web.setAttribute('href', item.webUrl);
      web.setAttribute('target', '_blank');
      web.setAttribute('rel', 'noopener noreferrer');
      web.setAttribute('aria-label', tr('打开' + item.name + '网页版（外部浏览器）', 'Open ' + item.name + ' in a browser'));
      card.appendChild(web);
    }
    var guide = element(doc, 'details', 'apps-guide');
    guide.setAttribute('id', 'apps-' + item.id + '-guide');
    var summary = element(doc, 'summary', '', tr('了解接入', 'Integration guide'));
    summary.setAttribute('id', 'apps-' + item.id + '-open');
    guide.appendChild(summary);
    guide.appendChild(element(doc, 'p', '', item.connectionNote || tr('Bot Studio 尚未提供此应用的连接器。当前不会发起授权或读取数据，后续接入进度将在这里显示。', 'Bot Studio does not yet provide a connector for this app. It will not request authorization or read data; integration progress will appear here.')));
    var link = element(doc, 'a', 'apps-developer-link', item.guideLabel);
    link.setAttribute('href', item.guideUrl);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    guide.appendChild(link); card.appendChild(guide);
    return card;
  }
  function mount(grid) {
    if (!grid || !grid.ownerDocument) return 0;
    var added = 0;
    entries.forEach(function (item) {
      // The existing cards include their working handlers and self-host guides.
      // Missing one is an integration error, not a reason to invent a login UI.
      if (existingIds.indexOf(item.id) >= 0 || grid.querySelector('[data-app="' + item.id + '"]')) return;
      grid.appendChild(createPlannedCard(grid.ownerDocument, item));
      added++;
    });
    return added;
  }
  return Object.freeze({ entries: entries, existingIds: existingIds, mount: mount, applyExistingLogos: applyExistingLogos });
});
