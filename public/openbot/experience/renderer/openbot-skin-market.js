/* OpenBot · Theme Skin & Mascot Market Controller.
 * Provides interactive Live Playground, multi-series character browsing,
 * one-click companion pinning, and DSH plugin upload support.
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenBotSkinMarket = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const doc = typeof document !== 'undefined' ? document : null;
  const tr = (zh, en, params) => {
    const i18n = typeof window === 'object' && window.OpenBotI18n;
    return i18n && typeof i18n.t === 'function' ? i18n.t(zh, en, params) : zh;
  };

  function escapeHtml(value) {
    if (root.OpenBotBrowser && typeof root.OpenBotBrowser.escapeHtml === 'function') {
      return root.OpenBotBrowser.escapeHtml(value);
    }
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function safeColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : '#075BFF';
  }

  let activeSeriesId = 'cats';

  function playSoundFor(charId) {
    if (typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      if (charId.includes('cat') || charId === 'opcat') {
        // Synthesize cute kitten meow
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(860, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.24);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.045, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.25);
      } else if (charId.includes('dog')) {
        // Synthesize friendly dog bark boop
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.16);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.17);
      } else if (charId === 'clawd' || charId.includes('spark') || charId.includes('gem') || charId.includes('saturn') || charId.includes('whale') || charId.includes('star')) {
        // Synthesize retro 8-bit cute pixel arpeggio for Clawd & AI companions
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.05);
        osc.frequency.setValueAtTime(783.99, now + 0.10);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.20);
      } else {
        // Synthesize soft mochi boop
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.12);
      }
    } catch (_) {}
  }

  function showToast(msg) {
    if (!doc) return;
    let toast = doc.getElementById('skin-market-toast');
    if (!toast) {
      toast = doc.createElement('div');
      toast.id = 'skin-market-toast';
      toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(24,26,36,0.92);color:#fff;padding:8px 16px;border-radius:20px;font-size:12.5px;font-weight:600;z-index:99999;box-shadow:0 6px 18px rgba(0,0,0,0.25);pointer-events:none;transition:opacity 200ms ease;';
      doc.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2400);
  }

  const mountedContainers = new Set();
  let dialogDom = null;
  let dialogOpener = null;
  let dialogOnClose = null;
  let dialogKeyHandler = null;

  function updateCompanionBadge(container, st) {
    if (!container || !st) return;
    const badge = container.querySelector('[data-skin-el="pet-badge"], #skin-market-pet-badge');
    const textEl = container.querySelector('[data-skin-el="status-text"], #skin-market-status-text');
    const dot = container.querySelector('.skin-market-dot');
    if (!badge || !textEl || !dot) return;
    const count = Array.isArray(st.pinnedBots) ? st.pinnedBots.length : (st.botId ? 1 : 0);
    if (st.enabled) {
      dot.classList.add('active');
      textEl.textContent = tr(`桌面在席：${count} 只桌宠`, `Active on desktop: ${count} pets`, { count });
    } else {
      dot.classList.remove('active');
      textEl.textContent = tr(`桌宠已收回（待命 ${count} 只）`, `Pets recalled (${count} on deck)`, { count });
    }
  }

  function updateAllCompanionBadges(st) {
    if (!st) return;
    mountedContainers.forEach(item => {
      if (item && (!doc || !doc.contains || doc.contains(item))) updateCompanionBadge(item, st);
    });
  }

  function companionBridge() {
    return root.grokbot || root.openbot || null;
  }

  function applyCompanionStatus(status) {
    if (status && typeof root.applyDesktopCompanionStatus === 'function') {
      root.applyDesktopCompanionStatus(status);
    }
    return status;
  }

  function pinKey(pin) {
    return String(pin && pin.botId || '') + '\u0000' + String(pin && pin.avatar || '');
  }

  function validPinnedBots(value) {
    return Array.isArray(value) ? value.filter(pin => pin && typeof pin.botId === 'string' && pin.botId) : [];
  }

  async function pinCompanionForBot(botId, avatar, placement) {
    const bridge = companionBridge();
    if (!bridge || typeof botId !== 'string' || !botId || typeof avatar !== 'string' || !/^pal-[a-z0-9_.-]+$/i.test(avatar)) {
      throw new Error('COMPANION_PIN_CONTEXT_REQUIRED');
    }
    const target = { botId, avatar };
    let status;
    if (typeof bridge.desktopCompanionStatus === 'function' && typeof bridge.setDesktopCompanion === 'function') {
      const current = await bridge.desktopCompanionStatus();
      const pins = validPinnedBots(current && current.pinnedBots);
      const rest = pins.filter(pin => pinKey(pin) !== pinKey(target));
      let next;
      if (placement === 'primary') {
        next = [target, ...rest];
      } else if (placement === 'secondary') {
        next = rest.length ? [rest[0], target, ...rest.slice(1)] : [target];
      } else {
        next = [...rest, target];
      }
      status = await bridge.setDesktopCompanion(true, { pinnedBots: next, singleOnly: false });
    } else if (typeof bridge.setDesktopCompanionPinned === 'function') {
      status = await bridge.setDesktopCompanionPinned({ botId, avatar, action: 'pin' });
    } else {
      throw new Error('COMPANION_PIN_UNAVAILABLE');
    }
    if (!status || !status.enabled || !Array.isArray(status.pinnedBots) ||
        !status.pinnedBots.some(pin => pinKey(pin) === pinKey(target))) {
      throw new Error('COMPANION_PIN_NOT_CONFIRMED');
    }
    return applyCompanionStatus(status);
  }

  function renderMarket(container, opts) {
    if (!container || !doc) return;
    const registry = root.OpenBotSkinRegistry;
    const charsApi = root.OpenBotCharacters;
    if (!registry || !charsApi) return;

    const inDialog = Boolean(opts && opts.inDialog) || Boolean(container._skinInDialog);
    if (inDialog) container._skinInDialog = true;
    mountedContainers.add(container);
    const idAttr = name => inDialog ? '' : ` id="${name}"`;

    const packs = registry.listSkinPacks();
    const currentPack = registry.getSkinPack(activeSeriesId) || packs[0];
    const charIds = currentPack.characters || [];
    const characters = charIds.map(id => charsApi.characters.find(c => c.id === id)).filter(Boolean);
    const currentBot = typeof root.activeBot === 'function' ? root.activeBot() : null;
    const currentBotAvatar = currentBot && typeof currentBot.avatar === 'string' ? currentBot.avatar : '';
    const currentBotMiniAvatar = currentBot && root.OpenBotAvatars && typeof root.OpenBotAvatars.markup === 'function'
      ? root.OpenBotAvatars.markup(currentBot.avatar, safeColor(currentBot.color), { size: 'list', pose: 'idle' })
      : '';
    const targetBotChip = currentBot ? `
      <span class="skin-market-target-bot" data-skin-el="target-bot">
        <span class="skin-market-target-label">${tr('当前头像目标', 'Avatar target')}</span>
        <span class="skin-market-target-avatar" aria-hidden="true">${currentBotMiniAvatar}</span>
        <strong class="skin-market-target-name">${escapeHtml(currentBot.name || currentBot.id)}</strong>
      </span>` : '';

    const headerTitleBlock = inDialog ? `
    <div class="skin-market-title-area skin-market-title-area--dialog">
      <span class="skin-market-badge-spec">DSH ${registry.SCHEMA_VERSION}</span>${targetBotChip}
    </div>` : `
    <div class="skin-market-title-area">
      <h3>
        <span>🎨 ${tr('主题皮肤与桌宠工坊', 'Theme Skin & Mascot Market')}</span>
        <span class="skin-market-badge-spec">DSH ${registry.SCHEMA_VERSION}</span>
      </h3>
      <p class="skin-market-desc">${tr('每个系列均为统一的品牌 Logo、头像与活体桌面宠物；鼠标悬停即刻试玩，支持召唤多只群宠同屏互动，随时一键收回。',
        'Each series offers unified brand logos, avatars and desktop companions. Hover to test live gaze tracking. Supports multi-pet concurrency with one-click recall.')}</p>
    </div>`;

    let html = `
<div class="skin-market-section${inDialog ? ' skin-market-section--dialog' : ''}"${idAttr('skin-market-root')}>
  <div class="skin-market-header">
    ${headerTitleBlock}
    <div class="skin-market-header-actions">
      <div class="skin-market-pet-badge" data-skin-el="pet-badge"${idAttr('skin-market-pet-badge')}>
        <span class="skin-market-dot"></span>
        <span data-skin-el="status-text"${idAttr('skin-market-status-text')}>${tr('桌宠状态同步中…', 'Syncing companion state…')}</span>
      </div>
      <button type="button" class="skin-market-action-btn danger" data-skin-el="recall-all"${idAttr('skin-market-recall-all')} title="${tr('一键收回全部桌面桌宠，随时可一键唤回', 'Recall all pets from desktop')}">
        🧹 ${tr('一键收回全部', 'Recall All')}
      </button>
      <button type="button" class="skin-market-action-btn primary" data-skin-el="summon-all"${idAttr('skin-market-summon-all')} title="${tr('唤回所有已选桌宠至桌面', 'Summon all pinned pets to desktop')}">
        🐾 ${tr('召唤已选桌宠', 'Summon Pinned')}
      </button>
    </div>
  </div>

  <div class="skin-market-tabs" role="tablist">
    ${packs.map(p => `
      <button type="button" class="skin-market-tab-btn" data-series="${escapeHtml(p.seriesId)}" data-active="${p.seriesId === currentPack.seriesId}">
        <span>${escapeHtml(p.badge || '🎨')}</span>
        <span>${escapeHtml(p.name)}</span>
      </button>
    `).join('')}
  </div>

  <div class="skin-market-grid" data-skin-el="grid"${idAttr('skin-market-grid')}>
    ${characters.map(c => {
      const isCurrentAvatar = Boolean(currentBot && currentBotAvatar === ('pal-' + c.id));
      return `
      <div class="skin-card" data-char-id="${escapeHtml(c.id)}" data-color="${safeColor(c.color)}" data-current-avatar="${isCurrentAvatar ? 'true' : 'false'}">
        <div class="skin-card-stage" title="${tr('点击揉捏试听微音效', 'Click to squish & test audio')}">
          ${charsApi.svg(c.id, { state: 'idle', size: 84 })}
        </div>
        <div class="skin-card-info">
          <div class="skin-card-name">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${safeColor(c.color)};margin-right:2px;"></span>
            <span>${escapeHtml(c.name)}</span>
          </div>
          <p class="skin-card-motto">${escapeHtml(c.note || '')}</p>
        </div>
        <div class="skin-card-actions">
          <button type="button" class="skin-card-btn skin-card-btn-summon" data-action="summon-pet" title="${tr('将此角色召唤至桌面（支持多只群宠同屏）', 'Summon this pet to desktop')}">
            🐾 ${tr('召唤', 'Summon')}
          </button>
          <button type="button" class="skin-card-btn skin-card-btn-primary" data-action="pin-primary" title="${tr('设为 1 号主桌宠', 'Set as Companion #1')}">
            ${tr('主桌宠', 'Pet #1')}
          </button>
          <button type="button" class="skin-card-btn" data-action="pin-secondary" title="${tr('设为 2 号伴侣桌宠', 'Set as Companion #2')}">
            ${tr('伴侣宠', 'Pet #2')}
          </button>
          <button type="button" class="skin-card-btn${isCurrentAvatar ? ' is-current-avatar' : ''}" data-action="apply-avatar" title="${tr('设为当前 Bot 头像', 'Set as Bot Avatar')}">
            ${isCurrentAvatar ? '✓ ' + tr('当前头像', 'Current') : tr('换头像', 'Avatar')}
          </button>
        </div>
      </div>
    `;
    }).join('')}
  </div>

  <div class="skin-market-dev-box">
    <div class="skin-market-dev-info">
      <strong>🛠️ ${tr('开发者扩展生态 (DSH Plugin)', 'Developer Ecosystem (DSH Plugin)')}</strong> · ${tr('支持导入符合 cordis 与 openbot.skin-pack/1 规范的自定义皮肤包', 'Supports importing custom skin packs conforming to openbot.skin-pack/1')}
    </div>
    <div style="display:flex;align-items:center;gap:8px;">
      <input type="file" data-skin-el="dev-file-input"${idAttr('skin-dev-file-input')} accept=".json,.tgz" style="display:none;" />
      <button type="button" class="skin-market-dev-upload-btn" data-skin-el="dev-upload-btn"${idAttr('skin-dev-upload-btn')}>
        📦 ${tr('导入本地皮肤包', 'Import Skin Bundle')}
      </button>
    </div>
  </div>
</div>`;

    container.innerHTML = html;

    // Fetch and bind companion state through the desktop bridge.
    const bridge = companionBridge();
    if (bridge && typeof bridge.desktopCompanionStatus === 'function') {
      bridge.desktopCompanionStatus().then(st => updateCompanionBadge(container, st)).catch(() => {});
    }
    if (bridge && !container._subscribedCompanion && typeof bridge.onDesktopCompanionChanged === 'function') {
      container._subscribedCompanion = true;
      bridge.onDesktopCompanionChanged(st => updateCompanionBadge(container, st));
    }

    // Attach Header Toolbar actions
    const recallBtn = container.querySelector('[data-skin-el="recall-all"]');
    if (recallBtn) {
      recallBtn.addEventListener('click', async () => {
        const activeBridge = companionBridge();
        if (!activeBridge) return;
        recallBtn.disabled = true;
        try {
          const status = typeof activeBridge.recallAllDesktopCompanions === 'function'
            ? await activeBridge.recallAllDesktopCompanions()
            : await activeBridge.setDesktopCompanion(false);
          applyCompanionStatus(status);
          updateAllCompanionBadges(status);
          showToast(tr('🧹 已一键收回全部桌面桌宠，随时可重新召唤！', '🧹 Recalled all desktop companions!'));
        } catch (_) {
          showToast(tr('收回桌宠失败，请重试', 'Could not recall companions; please try again'));
        } finally {
          recallBtn.disabled = false;
        }
      });
    }
    const summonBtn = container.querySelector('[data-skin-el="summon-all"]');
    if (summonBtn) {
      summonBtn.addEventListener('click', async () => {
        const activeBridge = companionBridge();
        if (!activeBridge || typeof activeBridge.setDesktopCompanion !== 'function') return;
        summonBtn.disabled = true;
        try {
          const status = applyCompanionStatus(await activeBridge.setDesktopCompanion(true));
          updateAllCompanionBadges(status);
          showToast(tr('🐾 已将全部已选桌宠召唤至桌面！', '🐾 Summoned all pinned companions to desktop!'));
        } catch (_) {
          showToast(tr('召唤桌宠失败，请重试', 'Could not summon companions; please try again'));
        } finally {
          summonBtn.disabled = false;
        }
      });
    }

    // Attach Tab switching
    container.querySelectorAll('.skin-market-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSeriesId = btn.dataset.series;
        registry.setActiveSeries(activeSeriesId);
        mountedContainers.forEach(target => {
          if (target && (!doc.contains || doc.contains(target))) renderMarket(target);
        });
      });
    });

    // Attach Live Playground Hover Gaze & Click Squish on each card
    container.querySelectorAll('.skin-card').forEach(card => {
      const stage = card.querySelector('.skin-card-stage');
      const charId = card.dataset.charId;
      const svgEl = stage.querySelector('svg');

      card.addEventListener('pointermove', e => {
        if (!svgEl) return;
        const rect = stage.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
        const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));
        svgEl.style.setProperty('--ob-look-x', (nx * 2.5) + 'px');
        svgEl.style.setProperty('--ob-look-y', (ny * 2.0) + 'px');
      });

      card.addEventListener('pointerleave', () => {
        if (!svgEl) return;
        svgEl.style.removeProperty('--ob-look-x');
        svgEl.style.removeProperty('--ob-look-y');
      });

      stage.addEventListener('click', () => {
        stage.style.transform = 'scale(1.15, 0.88)';
        playSoundFor(charId);
        setTimeout(() => { stage.style.transform = ''; }, 180);
      });

      // Actions
      card.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', async e => {
          e.stopPropagation();
          const action = btn.dataset.action;
          const palAvatar = 'pal-' + charId;
          const petName = card.querySelector('.skin-card-name span:last-child')?.textContent || charId;

          if (action === 'apply-avatar') {
            if (typeof root.applyBotAvatarChoice === 'function') {
              const applied = root.applyBotAvatarChoice(palAvatar);
              if (!applied) {
                showToast(tr('请先在侧栏选择一个 Bot 后再更换头像', 'Select a Bot first before changing its avatar'));
                return;
              }
              mountedContainers.forEach(target => {
                if (target && (!doc.contains || doc.contains(target))) renderMarket(target);
              });
              showToast(tr('已应用为当前 Bot 头像：', 'Applied as Bot Avatar: ') + petName);
              return;
            }
            const avatarPicker = doc.querySelector('#cfg-avatar, #set-avatar');
            if (avatarPicker) {
              avatarPicker.value = palAvatar;
              avatarPicker.dispatchEvent(new Event('change', { bubbles: true }));
            }
            showToast(tr('已应用为当前 Bot 头像：', 'Applied as Bot Avatar: ') + petName);
            return;
          }

          const bot = typeof root.activeBot === 'function' ? root.activeBot() : null;
          if (!bot || typeof bot.id !== 'string' || !bot.id) {
            showToast(tr('请在桌面版中选择一个 Bot 后再添加桌宠', 'Select a Bot in the desktop app before pinning a companion'));
            return;
          }

          const placements = { 'summon-pet': 'append', 'pin-primary': 'primary', 'pin-secondary': 'secondary' };
          const placement = placements[action];
          if (!placement) return;
          btn.disabled = true;
          try {
            const status = await pinCompanionForBot(bot.id, palAvatar, placement);
            updateAllCompanionBadges(status);
            if (placement === 'primary') {
              showToast(tr('已设为主桌宠：', 'Set as Companion #1: ') + petName);
            } else if (placement === 'secondary') {
              showToast(tr('已设为伴侣桌宠：', 'Set as Companion #2: ') + petName);
            } else {
              showToast(tr('已将桌宠召唤至桌面：', 'Summoned pet to desktop: ') + petName);
            }
          } catch (_) {
            showToast(tr('桌宠添加失败，请重试', 'Could not pin the companion; please try again'));
          } finally {
            btn.disabled = false;
          }
        });
      });
    });

    // Developer upload button
    const fileInput = container.querySelector('[data-skin-el="dev-file-input"]');
    const uploadBtn = container.querySelector('[data-skin-el="dev-upload-btn"]');
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            const text = ev.target.result;
            const json = JSON.parse(text);
            registry.registerCustomSkinPack(json);
            showToast(tr('🎉 成功载入自定义 DSH 皮肤包：', '🎉 Loaded custom DSH skin pack: ') + (json.name || json.id));
            mountedContainers.forEach(target => {
              if (target && (!doc.contains || doc.contains(target))) renderMarket(target);
            });
          } catch (err) {
            alert(tr('皮肤包解析失败：', 'Failed to parse skin pack: ') + (err.message || String(err)));
          }
        };
        reader.readAsText(file);
      });
    }
  }

  function closeDialog(options) {
    if (!dialogDom || !dialogDom.overlay || dialogDom.overlay.hidden) return;
    dialogDom.overlay.hidden = true;
    dialogDom.overlay.setAttribute('aria-hidden', 'true');
    const cb = dialogOnClose;
    dialogOnClose = null;
    if (typeof cb === 'function') {
      try { cb(); } catch (_) {}
    }
    const restore = !(options && options.restoreFocus === false);
    const opener = dialogOpener;
    dialogOpener = null;
    if (restore && opener && typeof opener.focus === 'function' && (!doc.contains || doc.contains(opener))) {
      opener.focus();
    }
  }

  function ensureDialog() {
    if (dialogDom || !doc || !doc.body) return dialogDom;
    const overlay = doc.createElement('div');
    overlay.id = 'ob-skin-dialog';
    overlay.className = 'ob-skin-overlay';
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');

    const win = doc.createElement('div');
    win.className = 'ob-skin-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'true');
    win.setAttribute('aria-labelledby', 'ob-skin-dialog-title');

    const header = doc.createElement('div');
    header.className = 'ob-skin-dialog-header';
    const heading = doc.createElement('div');
    heading.className = 'ob-skin-dialog-heading';
    const title = doc.createElement('h2');
    title.id = 'ob-skin-dialog-title';
    title.className = 'ob-skin-dialog-title';
    const subtitle = doc.createElement('p');
    subtitle.className = 'ob-skin-dialog-subtitle';
    heading.appendChild(title);
    heading.appendChild(subtitle);

    const close = doc.createElement('button');
    close.type = 'button';
    close.id = 'ob-skin-dialog-close';
    close.className = 'ob-skin-dialog-close';
    header.appendChild(heading);
    header.appendChild(close);

    const body = doc.createElement('div');
    body.className = 'ob-skin-dialog-body';
    body._skinInDialog = true;

    win.appendChild(header);
    win.appendChild(body);
    overlay.appendChild(win);
    doc.body.appendChild(overlay);

    close.addEventListener('click', () => closeDialog());
    overlay.addEventListener('mousedown', event => {
      if (event.target === overlay) closeDialog();
    });
    dialogDom = { overlay, win, title, subtitle, close, body };
    return dialogDom;
  }

  function openDialog(options) {
    const opts = options || {};
    const dom = ensureDialog();
    if (!dom) return;
    dialogOpener = opts.opener || (doc && doc.activeElement) || null;
    dialogOnClose = typeof opts.onClose === 'function' ? opts.onClose : null;
    dom.title.textContent = '🎨 ' + tr('主题皮肤与桌宠工坊', 'Theme Skin & Mascot Market');
    dom.subtitle.textContent = tr('每个系列均为统一的品牌 Logo、头像与活体桌面宠物；鼠标悬停即刻试玩，支持召唤多只群宠同屏互动，随时一键收回。',
      'Each series offers unified brand logos, avatars and desktop companions. Hover to test live gaze tracking. Supports multi-pet concurrency with one-click recall.');
    dom.close.textContent = tr('关闭', 'Close');
    dom.close.setAttribute('aria-label', tr('关闭主题皮肤与桌宠工坊', 'Close Theme Skin & Mascot Market'));
    renderMarket(dom.body, { inDialog: true });
    dom.body.scrollTop = 0;
    dom.overlay.hidden = false;
    dom.overlay.setAttribute('aria-hidden', 'false');
    if (!dialogKeyHandler && doc) {
      dialogKeyHandler = event => {
        if (event.key === 'Escape' && dialogDom && !dialogDom.overlay.hidden) {
          event.preventDefault();
          event.stopImmediatePropagation();
          closeDialog();
        }
      };
      doc.addEventListener('keydown', dialogKeyHandler);
    }
    setTimeout(() => { if (dom.close) dom.close.focus(); }, 0);
  }

  function autoMount() {
    if (!doc) return;
    const panel = doc.getElementById('set-panel-apps');
    if (!panel) return;
    let container = doc.getElementById('skin-market-mount-point');
    if (!container) {
      container = doc.createElement('div');
      container.id = 'skin-market-mount-point';
      container.dataset.appsGroup = 'plugins';
      const anchor = panel.querySelector('#algorithm-lab-section');
      if (anchor && anchor.parentNode === panel) {
        panel.insertBefore(container, anchor);
      } else {
        panel.appendChild(container);
      }
    } else if (!container.dataset.appsGroup) {
      container.dataset.appsGroup = 'plugins';
    }
    renderMarket(container);
    if (typeof window !== 'undefined' && window.OpenBotDialogs && typeof window.OpenBotDialogs.syncAppsCategory === 'function') {
      window.OpenBotDialogs.syncAppsCategory();
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoMount);
    } else {
      setTimeout(autoMount, 100);
    }
  }

  return Object.freeze({
    mount: renderMarket,
    autoMount,
    open: openDialog,
    close: closeDialog,
    showToast,
    playSoundFor
  });
});
