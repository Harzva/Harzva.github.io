(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ── 1. Theme & Mobile Nav ────────────────────────────────────────────────
  const themeBtn = $('#theme-toggle');
  const savedTheme = (() => {
    try { return localStorage.getItem('botengine-theme'); } catch { return null; }
  })();
  if (savedTheme === 'dark') document.documentElement.classList.add('dark');

  const syncThemeUi = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(isDark));
      themeBtn.textContent = isDark ? '浅色模式' : '深色模式';
    }
  };
  syncThemeUi();

  themeBtn?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('botengine-theme', isDark ? 'dark' : 'light'); } catch {}
    syncThemeUi();
  });

  const menuBtn = $('#menu-toggle');
  const navLinks = $('#primary-nav');
  menuBtn?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('#primary-nav a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }));

  // ── 2. L1-L4 API Standard Explorer ───────────────────────────────────────
  const API_LAYERS = {
    L1: {
      badge: 'L1 · Raw Model API',
      title: '大模型 API：干线算力与通用推理',
      unit: '单次 Prompt / Completion（Token 流）',
      state: '完全无状态，每次调用重新装配上下文',
      governance: 'API Key 配额与限流，无工作区 / TCC 权限边界',
      examples: 'DeepSeek Chat / Reasoner、GPT、Claude、Qwen 原生模型接口',
      studioRole: 'BotEngine 最底层可插拔大脑（Layer 1），各 Bot 按专长绑定不同模型。',
      whyNotEnough: '只给模型 API 等于“只建高速公路不配末端快递驿站”，无法处理多轮文件副作用与停机恢复。',
    },
    L2: {
      badge: 'L2 · Tool / App API',
      title: '工具 API：原子感知与垂直加速',
      unit: '单次能力调用（Search / Fetch / OCR / ASR / TTS）',
      state: '无状态或极短轻量缓存，不维护用户业务生命周期',
      governance: '宿主代理注钥（getApiKey）+ redirect: error SSRF 拦截 + 密钥脱敏',
      examples: 'DeepSeek /v1/tools/{search,fetch,ocr,asr,tts} 与 deepseek_web_search 内置工具',
      studioRole: '在 Layer 2 作为加速器为所有执行器（包含 DSH 与 Codex）卸载感知检索成本。',
      whyNotEnough: '工具 API 无法单独决定“交给哪个 Bot”、“在哪台 Mac/工作区跑”或“高危动作找谁审批”。',
    },
    L3: {
      badge: 'L3 · Harness / Agent API',
      title: 'Agent API：单程执行脚手架',
      unit: '单次 Run / 会话工作循环（读写代码、跑命令）',
      state: '单会话或单一 git worktree 内有效，进程退出即结束',
      governance: '工具白名单、沙箱工作区、HarnessPlan 执行规划',
      examples: '@openbot/bot-agent-runtime (dsh)、Codex AppServer / CLI、Kimi、Pi Agent',
      studioRole: '对应 D25 单固定执行器（Layer 4），专注把单一执行深度跑通，各展所长。',
      whyNotEnough: '不同执行器互不兼容；单程 Agent 没有多渠道常驻身份、跨 Bot 派单或崩溃续履约体系。',
    },
    L4: {
      badge: 'L4 · BotEngine Runtime API',
      title: 'Bot API：打通最后一公里的数字员工操作系统',
      unit: '任务派单 / openbot.task-receipt/1 / published.chat@1 持续对话',
      state: '7×24 持久 Bot 身份、私人记忆、S0 常驻与四窗口崩溃恢复',
      governance: 'D24 五态真值 + Harvis 修订绑定审批 + 作用域隔离凭据 + SHA-256 交付回执',
      examples: 'Bot Studio / OpenBot（支持 Cherry Studio 零插件直连、飞书、CLI、MCP、跨 Bot 委派）',
      studioRole: '融合模型大脑、L2 工具加速器与 L3 异构执行器，真正交付“随叫随到、可审可验”的结果。',
      whyNotEnough: '定位即 AI 最后一公里履约终端；自身不替代大模型训练（L1），而是让所有 L1–L3 能力落地可用。',
    },
  };

  const apiPanel = $('#api-detail-panel');
  const renderApiLayer = (layerKey) => {
    const spec = API_LAYERS[layerKey] || API_LAYERS.L4;
    $$('[data-api-layer]').forEach(btn => {
      btn.setAttribute('aria-selected', String(btn.dataset.apiLayer === layerKey));
    });
    if (!apiPanel) return;

    const left = document.createElement('div');
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = spec.badge;
    const h3 = document.createElement('h3');
    h3.textContent = spec.title;
    h3.style.margin = '10px 0 8px';
    const roleP = document.createElement('p');
    roleP.innerHTML = '';
    const roleStrong = document.createElement('strong');
    roleStrong.textContent = '在 Bot Studio 中的定位：';
    roleP.append(roleStrong, document.createTextNode(spec.studioRole));
    const boundaryP = document.createElement('p');
    boundaryP.style.marginTop = '10px';
    const bStrong = document.createElement('strong');
    bStrong.textContent = '层级边界：';
    boundaryP.append(bStrong, document.createTextNode(spec.whyNotEnough));
    left.append(tag, h3, roleP, boundaryP);

    const dl = document.createElement('dl');
    dl.className = 'kv-list';
    [
      ['最小调用单元', spec.unit],
      ['状态与生命周期', spec.state],
      ['安全与审批机制', spec.governance],
      ['典型代表', spec.examples],
    ].forEach(([label, val]) => {
      const wrap = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = val;
      wrap.append(dt, dd);
      dl.append(wrap);
    });

    apiPanel.replaceChildren(left, dl);
  };

  $$('[data-api-layer]').forEach(btn => {
    btn.addEventListener('click', () => renderApiLayer(btn.dataset.apiLayer));
  });
  renderApiLayer('L4');

  // ── 3. DSH 4-Layer x D24 5-State Simulator ──────────────────────────────
  const SIM_MODES = {
    'dsh-full': {
      title: 'DSH 完整运行时 Bot（dsh + valid profileRevision）',
      binding: 'executorId: "dsh" · instanceTextOnly: false · profileRevision: "rev-08f2"',
      isolation: { allowed: true, reason: '允许 DSH 插件流与 0-LLM Workbench（dshPluginFlowAllowed: true）' },
      bridgeSummary: '可直接运行 @openbot/dsh-bundle-deepseek-tools 面板动作、JSON Schema 垂直任务与 L2 工具加速。',
      caps: [
        { name: 'dsh-plugin.daily-brief (Workbench)', layer: 'workbench · hosted', states: ['installed', 'bound', 'activeInPlan', 'invoked'] },
        { name: 'vertical.issue-triage (Preset + Schema)', layer: 'preset · curated-manual', states: ['installed', 'bound', 'activeInPlan'] },
        { name: '@openbot/dsh-bundle-deepseek-tools (L2 Search/Fetch/OCR)', layer: 'bundle · host-injected', states: ['installed', 'bound', 'activeInPlan', 'invoked'] },
        { name: 'bot_send / delegate_to_dsh_bot', layer: 'profile · runtime-bridge', states: ['installed', 'bound'] },
      ],
    },
    'dsh-text-only': {
      title: 'DSH 纯文本受限实例（instanceId text-only）',
      binding: 'executorId: "dsh" · instanceId: "txt-guest-01" · instanceTextOnly: true',
      isolation: { allowed: false, reason: 'DSH_INSTANCE_TEXT_ONLY — 禁止越权插件与本地执行流，但保留 installed 真值' },
      bridgeSummary: '绝不因为 executorId === "dsh" 就盲目放行插件！复合隔离守卫阻断插件工具，只保留安全文本对话。',
      caps: [
        { name: 'dsh-plugin.daily-brief (Workbench)', layer: 'workbench · hosted', states: ['installed', 'bound'], blocked: 'DSH_INSTANCE_TEXT_ONLY' },
        { name: 'vertical.issue-triage (Preset + Schema)', layer: 'preset · curated-manual', states: ['installed'], blocked: 'DSH_INSTANCE_TEXT_ONLY' },
        { name: '@openbot/dsh-bundle-deepseek-tools (L2 Search)', layer: 'bundle · host-injected', states: ['installed', 'bound', 'activeInPlan'] },
      ],
    },
    'codex-bridge': {
      title: 'Codex 固定执行器 Bot（agent:codex × 受控桥接）',
      binding: 'executorId: "agent:codex" · transport: "appserver" · codexHomeId: "work-main"',
      isolation: { allowed: false, reason: 'DSH_PLUGIN_FLOW_UNAVAILABLE — 禁止跨执行器偷跑 runDshAgent，开放 L2 感知 + 跨 Bot 派单' },
      bridgeSummary: '每次工具调用均二次校验 assertFixedExecutorSelection；允许调用 l2_search/l2_ocr 及 delegate_to_dsh_bot（返回 TaskReceipt）。',
      caps: [
        { name: 'dsh-plugin.daily-brief (DSH Workbench Flow)', layer: 'workbench · dsh-only', states: ['installed'], blocked: 'DSH_PLUGIN_FLOW_UNAVAILABLE' },
        { name: 'vertical.issue-triage (DSH Vertical Runner)', layer: 'preset · dsh-only', states: ['installed'], blocked: 'DSH_PLUGIN_FLOW_UNAVAILABLE' },
        { name: 'l2_search / l2_fetch / l2_ocr (Host L2 Bridge)', layer: 'bundle · host-injected', states: ['installed', 'bound', 'activeInPlan', 'invoked'] },
        { name: 'delegate_to_dsh_bot -> openbot.task-receipt/1', layer: 'profile · cross-bot', states: ['installed', 'bound', 'activeInPlan'] },
      ],
    },
  };

  const simLeft = $('#sim-summary-box');
  const simRight = $('#sim-manifest-box');

  const renderSimulator = (modeKey) => {
    const data = SIM_MODES[modeKey] || SIM_MODES['dsh-full'];
    $$('[data-sim-mode]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.simMode === modeKey));
    });

    if (simLeft) {
      const h3 = document.createElement('h3');
      h3.textContent = data.title;
      const bTag = document.createElement('p');
      bTag.style.marginTop = '8px';
      bTag.innerHTML = '';
      const codeEl = document.createElement('code');
      codeEl.textContent = data.binding;
      bTag.append(codeEl);

      const isoBadge = document.createElement('div');
      isoBadge.style.marginTop = '12px';
      isoBadge.className = data.isolation.allowed ? 'tag ok' : 'tag danger';
      isoBadge.textContent = data.isolation.reason;

      const summary = document.createElement('p');
      summary.style.marginTop = '12px';
      summary.textContent = data.bridgeSummary;

      simLeft.replaceChildren(h3, bTag, isoBadge, summary);
    }

    if (simRight) {
      const h3 = document.createElement('h3');
      h3.textContent = 'EffectiveCapabilityManifest（D24 五态实时投影）';
      const list = document.createElement('div');
      list.style.marginTop = '10px';

      data.caps.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cap-item';

        const meta = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = item.name;
        title.style.fontSize = '14px';
        title.style.display = 'block';
        const layer = document.createElement('span');
        layer.textContent = item.layer;
        layer.style.fontSize = '12px';
        layer.style.color = 'var(--muted)';
        meta.append(title, layer);

        const badges = document.createElement('div');
        badges.className = 'cap-badges';
        ['installed', 'bound', 'activeInPlan', 'invoked'].forEach(st => {
          const pill = document.createElement('span');
          pill.className = 'state-pill' + (item.states.includes(st) ? ' on' : '');
          pill.textContent = st;
          badges.append(pill);
        });
        if (item.blocked) {
          const bp = document.createElement('span');
          bp.className = 'state-pill blocked';
          bp.textContent = 'blocked: ' + item.blocked;
          badges.append(bp);
        }

        row.append(meta, badges);
        list.append(row);
      });

      simRight.replaceChildren(h3, list);
    }
  };

  $$('[data-sim-mode]').forEach(btn => {
    btn.addEventListener('click', () => renderSimulator(btn.dataset.simMode));
  });
  renderSimulator('dsh-full');

  // ── 4. Three-Perspective Workspace Demo ──────────────────────────────────
  const PERSPECTIVES = {
    bot: {
      leftTitle: '左栏 · BOT 列表（数字员工视角）',
      leftItems: ['HarvisBrain（主脑协调）', 'ResearchBot（DSH + L2 加速器） ★', 'BuildBot（Codex AppServer）', 'ReviewBot（只读审阅）'],
      centerTitle: '中央工作区 · BOT 工作台与 0-LLM 快捷面板',
      centerDesc: '直接操控 ResearchBot 挂载的 @openbot/dsh-bundle-deepseek-tools 工作台面板；点击确定性按钮消耗 0 次大模型调用，并带 workbenchRevision 乐观锁与 Harvis 审批。',
      wbPanel: true,
      rightTitle: '右栏关联 · 关联任务会话 & 交付文件',
      rightItems: ['关联任务会话：2026-Q4 竞品调研 Thread', '关联委派：来自 BuildBot 的 delegate_to_dsh_bot', '交付回执：receipt-9f41 (openbot.task-receipt/1)', '产出文件：competitor-matrix.md (SHA-256 已验)'],
    },
    session: {
      leftTitle: '左栏 · 任务会话（C人工程视角）',
      leftItems: ['2026-Q4 竞品调研 Thread ★', 'Mac Runtime 协议对齐工程', '官网重构与无障碍排查'],
      centerTitle: '中央工作区 · 工程执行链路与五态能力检视',
      centerDesc: '按工程与独立任务会话组织上下文；清晰显示 D25 固定执行器绑定（不偷偷跨内核跑循环）、DSH 四层归类以及 D24 五态允许/阻塞边界。',
      wbPanel: false,
      sessionStats: [
        '执行器绑定（D25）：BuildBot -> agent:codex (appserver)',
        '桥接策略：l2_search / l2_fetch 允许；DSH 插件直调已阻断 (DSH_PLUGIN_FLOW_UNAVAILABLE)',
        '跨 Bot 协作成果：delegate_to_dsh_bot 已派发至 ResearchBot 并签收 receipt-9f41',
      ],
      rightTitle: '右栏关联 · 关联 BOT 管理员 & 工程文件',
      rightItems: ['管理 BOT：HarvisBrain（目标守门与审批）', '执行 BOT：BuildBot (Codex) + ResearchBot (DSH)', '关联产物：competitor-matrix.md · architecture-diff.patch'],
    },
    file: {
      leftTitle: '左栏 · 文件交付（成果追溯视角）',
      leftItems: ['competitor-matrix.md ★', 'openbot.task-receipt-9f41.json', 'api-l1-l4-whitepaper.pdf'],
      centerTitle: '中央工作区 · 交付产物正文与 TaskReceipt 审计核验',
      centerDesc: '从交付物反向追溯是哪个 BOT 在哪次任务会话中使用哪组授权工具生成了该文件，核对 SHA-256 摘要与耗时/状态，避免“口头宣称完成”。',
      wbPanel: false,
      sessionStats: [
        '协议版本：openbot.task-receipt/1（status: succeeded）',
        '产物校验：SHA-256 sha256:4a8c...d91e（实盘文件对比一致）',
        '来源审计：由 ResearchBot 经宿主 L2 检索 + 0-LLM 面板整理导出，0 明文密钥泄露',
      ],
      rightTitle: '右栏关联 · 责任 BOT & 来源会话',
      rightItems: ['签发 BOT：ResearchBot（DSH Runtime）', '派单来源：BuildBot -> delegate_to_dsh_bot', '所属任务会话：2026-Q4 竞品调研 Thread'],
    },
  };

  let wbRevisionStep = 1;
  const pLeft = $('#persp-left');
  const pCenter = $('#persp-center');
  const pRight = $('#persp-right');

  const renderPerspective = (key) => {
    const p = PERSPECTIVES[key] || PERSPECTIVES.bot;
    $$('[data-perspective]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.perspective === key));
    });

    if (pLeft) {
      const h4 = document.createElement('h4');
      h4.textContent = p.leftTitle;
      const ul = document.createElement('ul');
      ul.className = 'pane-list';
      p.leftItems.forEach((txt, idx) => {
        const li = document.createElement('li');
        if (txt.includes('★') || idx === 0 && !p.leftItems.some(t => t.includes('★'))) li.className = 'is-selected';
        li.textContent = txt.replace(' ★', '');
        ul.append(li);
      });
      pLeft.replaceChildren(h4, ul);
    }

    if (pCenter) {
      const h4 = document.createElement('h4');
      h4.textContent = p.centerTitle;
      const desc = document.createElement('p');
      desc.textContent = p.centerDesc;
      desc.style.fontSize = '14px';
      desc.style.color = 'var(--muted)';
      desc.style.margin = '0 0 12px';

      const nodes = [h4, desc];
      if (p.wbPanel) {
        const actionBox = document.createElement('div');
        actionBox.className = 'wb-action-row';
        const runBtn = document.createElement('button');
        runBtn.type = 'button';
        runBtn.className = 'pill-btn';
        runBtn.setAttribute('data-wb-exec', '1');
        runBtn.textContent = '模拟点击 Workbench 确定性动作 (0 LLM)';

        const log = document.createElement('div');
        log.className = 'wb-log';
        log.id = 'wb-sim-output';
        log.textContent = `ready | workbenchRevision=0000...rev0${wbRevisionStep} | llmCalls=0 | harvisApproval=bound`;

        runBtn.addEventListener('click', () => {
          wbRevisionStep += 1;
          log.textContent = `executed action="refresh-digest" | ok=true | llmCalls=0 | nextRevision=0000...rev0${wbRevisionStep} | approvalVerified=true`;
        });
        actionBox.append(runBtn);
        nodes.push(actionBox, log);
      } else {
        const ul = document.createElement('ul');
        ul.className = 'pane-list';
        p.sessionStats.forEach(line => {
          const li = document.createElement('li');
          li.textContent = line;
          ul.append(li);
        });
        nodes.push(ul);
      }
      pCenter.replaceChildren(...nodes);
    }

    if (pRight) {
      const h4 = document.createElement('h4');
      h4.textContent = p.rightTitle;
      const ul = document.createElement('ul');
      ul.className = 'pane-list';
      p.rightItems.forEach(txt => {
        const li = document.createElement('li');
        li.textContent = txt;
        ul.append(li);
      });
      pRight.replaceChildren(h4, ul);
    }
  };

  $$('[data-perspective]').forEach(btn => {
    btn.addEventListener('click', () => renderPerspective(btn.dataset.perspective));
  });
  renderPerspective('bot');

  // ── 5. Diagram Zoom Modal ────────────────────────────────────────────────
  const modal = $('#diagram-modal');
  const modalTitle = $('#diagram-modal-title');
  const modalImg = $('#diagram-modal-img');
  const modalClose = $('#diagram-modal-close');
  let lastTrigger = null;

  $$('[data-zoom-src]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!modal || !modalImg || !modalTitle) return;
      lastTrigger = btn;
      modalTitle.textContent = btn.dataset.zoomTitle || '架构原图';
      modalImg.src = btn.dataset.zoomSrc;
      modalImg.alt = btn.dataset.zoomTitle || '架构原图';
      modal.showModal();
    });
  });

  const closeModal = () => {
    if (modal?.open) modal.close();
  };
  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('close', () => {
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  });
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      const r = modal.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal();
    }
  });
})();
