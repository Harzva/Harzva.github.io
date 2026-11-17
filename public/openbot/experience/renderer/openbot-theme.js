/* Device preferences; UI language is fixed at launch to preserve active work. */
(function () {
  'use strict';
  function tr(zh, en) { return window.OpenBotI18n ? window.OpenBotI18n.t(zh, en) : zh; }
  function mount() {
    var theme = document.getElementById('set-theme');
    var themeStatus = document.getElementById('set-theme-status');
    var language = document.getElementById('set-language');
    var languageStatus = document.getElementById('set-language-status');
    var chatFont = document.getElementById('set-chat-font');
    var chatFontSize = document.getElementById('set-chat-font-size');
    var typographyStatus = document.getElementById('set-chat-typography-status');
    var sidebarAvatarSizeOptions = document.getElementById('set-sidebar-avatar-size');
    var sidebarAvatarSizeStatus = document.getElementById('set-sidebar-avatar-size-status');
    var sidebarAvatarSizeButtons = sidebarAvatarSizeOptions
      ? Array.from(sidebarAvatarSizeOptions.querySelectorAll('[data-avatar-size-option]')) : [];
    var fontFamilies = {
      system: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif',
      pingfang: '"PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif',
      serif: '"Songti SC", "STSong", "Noto Serif CJK SC", serif',
      mono: '"SFMono-Regular", Menlo, Monaco, "PingFang SC", monospace'
    };
    var fontSizes = [13, 14, 15, 16, 18, 20];
    var bridge = window.grokbot;
    var savedTheme = 'system', savedLanguage = 'system';
    var savedFont = 'system', savedFontSize = 14, typographyBusy = false;
    var savedSidebarAvatarSize = 'medium', sidebarAvatarSizeBusy = false;
    var themeBusy = false, languageBusy = false;
    if (!theme || !themeStatus) return;
    if (!bridge || !bridge.getAppearance || !bridge.setAppearance) {
      themeStatus.textContent = tr('当前界面跟随系统外观；桌面版可单独选择。', 'This page follows the system theme. Choose a theme in the desktop app.');
      return;
    }
    function applyTypography(font, size) {
      var style = document.documentElement.style;
      if (style.getPropertyValue('--ob-chat-font-family') === fontFamilies[font] &&
          style.getPropertyValue('--ob-chat-font-size') === size + 'px') return;
      var messages = document.getElementById('messages');
      var follow = messages && messages.scrollHeight - messages.clientHeight - messages.scrollTop < 12;
      var anchor, offset;
      if (messages && !follow) {
        var top = messages.getBoundingClientRect().top;
        anchor = Array.from(messages.querySelectorAll('.msg')).find(function (item) { return item.getBoundingClientRect().bottom > top; });
        if (anchor) offset = anchor.getBoundingClientRect().top - top;
      }
      style.setProperty('--ob-chat-font-family', fontFamilies[font]);
      style.setProperty('--ob-chat-font-size', size + 'px');
      if (window.OpenBotChatLayout) window.OpenBotChatLayout.resize();
      if (messages && follow) messages.scrollTop = messages.scrollHeight;
      else if (messages && anchor && anchor.isConnected) {
        messages.scrollTop += anchor.getBoundingClientRect().top - messages.getBoundingClientRect().top - offset;
      }
    }
    function syncTypography(value) {
      if (!Object.prototype.hasOwnProperty.call(fontFamilies, value.chatFont) || !fontSizes.includes(value.chatFontSize)) return;
      savedFont = value.chatFont; savedFontSize = value.chatFontSize;
      if (chatFont) chatFont.value = savedFont;
      if (chatFontSize) chatFontSize.value = String(savedFontSize);
      applyTypography(savedFont, savedFontSize);
    }
    function validSidebarAvatarSize(value) { return ['small', 'medium', 'large'].includes(value); }
    function syncSidebarAvatarSize(value) {
      if (!validSidebarAvatarSize(value)) return;
      savedSidebarAvatarSize = value;
      sidebarAvatarSizeButtons.forEach(function (button) {
        var selected = button.dataset.avatarSizeOption === savedSidebarAvatarSize;
        button.setAttribute('aria-checked', selected ? 'true' : 'false');
        button.tabIndex = selected ? 0 : -1;
      });
      var sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.dataset.avatarSize = savedSidebarAvatarSize;
    }
    function setSidebarAvatarSizeBusy(busy) {
      sidebarAvatarSizeBusy = busy;
      sidebarAvatarSizeButtons.forEach(function (button) { button.disabled = busy || !bridge || !bridge.setSidebarAvatarSize; });
      if (sidebarAvatarSizeOptions) sidebarAvatarSizeOptions.dataset.ready = busy || !bridge || !bridge.setSidebarAvatarSize ? 'false' : 'true';
    }
    function saveSidebarAvatarSize(size) {
      if (sidebarAvatarSizeBusy || !validSidebarAvatarSize(size) || !bridge || !bridge.setSidebarAvatarSize) return;
      var previousSize = savedSidebarAvatarSize;
      var wasFocused = sidebarAvatarSizeButtons.includes(document.activeElement);
      sidebarAvatarSizeBusy = true;
      sidebarAvatarSizeButtons.forEach(function (button) { button.disabled = true; });
      if (sidebarAvatarSizeOptions) sidebarAvatarSizeOptions.dataset.ready = 'false';
      syncSidebarAvatarSize(size);
      if (sidebarAvatarSizeStatus) sidebarAvatarSizeStatus.textContent = tr('正在保存…', 'Saving…');
      bridge.setSidebarAvatarSize(size).then(function (result) {
        if (!result || !result.ok || !validSidebarAvatarSize(result.sidebarAvatarSize)) {
          throw new Error(result && result.message || tr('头像大小保存失败，请重试。', 'Could not save the avatar size. Try again.'));
        }
        syncSidebarAvatarSize(result.sidebarAvatarSize);
        if (sidebarAvatarSizeStatus) sidebarAvatarSizeStatus.textContent = tr('已保存在本机。', 'Saved on this device.');
      }).catch(function (error) {
        savedSidebarAvatarSize = previousSize;
        syncSidebarAvatarSize(savedSidebarAvatarSize);
        if (sidebarAvatarSizeStatus) sidebarAvatarSizeStatus.textContent = error.message;
      }).finally(function () {
        setSidebarAvatarSizeBusy(false);
        if (wasFocused) {
          var selectedButton = sidebarAvatarSizeButtons.find(function (button) { return button.dataset.avatarSizeOption === savedSidebarAvatarSize; });
          if (selectedButton && !selectedButton.disabled) selectedButton.focus();
        }
      });
    }
    function syncLanguageStatus(value) {
      if (languageStatus) languageStatus.textContent = value.requiresRestart
        ? tr('重启 Bot Studio 后应用新的界面语言；正在执行的任务不会因选择语言而重启。', 'Restart Bot Studio to apply your language choice. Selecting a language does not restart active work.')
        : tr('只改变界面语言，保留 Bot 名称、对话、记忆和文件原文。', 'Changes the interface only. Bot names, conversations, memories, and files stay as written.');
    }
    function sync(value) {
      if (!value) return;
      if (!themeBusy && ['system', 'light', 'dark'].includes(value.theme)) { savedTheme = value.theme; theme.value = savedTheme; }
      if (language && !languageBusy && ['system', 'zh-CN', 'en'].includes(value.language)) { savedLanguage = value.language; language.value = savedLanguage; }
      if (!typographyBusy) syncTypography(value);
      if (!sidebarAvatarSizeBusy) syncSidebarAvatarSize(value.sidebarAvatarSize || 'medium');
      syncLanguageStatus(value);
    }
    bridge.getAppearance().then(function (value) {
      sync(value); theme.disabled = false;
      if (language && bridge.setLanguage) language.disabled = false;
      if (chatFont && chatFontSize && bridge.setChatTypography) chatFont.disabled = chatFontSize.disabled = false;
      setSidebarAvatarSizeBusy(false);
    }).catch(function () { themeStatus.textContent = tr('无法读取外观偏好，请重新打开应用。', 'Could not read appearance preferences. Reopen the app.'); });
    if (bridge.onAppearanceChanged) bridge.onAppearanceChanged(sync);
    theme.addEventListener('change', function () {
      if (themeBusy) return;
      themeBusy = true; theme.disabled = true;
      themeStatus.textContent = tr('正在保存主题…', 'Saving theme…');
      bridge.setAppearance(theme.value).then(function (result) {
        if (!result || !result.ok) throw new Error(result && result.message || tr('主题保存失败，请重试。', 'Could not save the theme. Try again.'));
        savedTheme = result.theme; theme.value = savedTheme;
        themeStatus.textContent = tr('立即生效，并记住本机选择。', 'Applies immediately and is saved on this device.');
        syncLanguageStatus(result);
      }).catch(function (error) { theme.value = savedTheme; themeStatus.textContent = error.message; })
        .finally(function () { themeBusy = false; theme.disabled = false; });
    });
    if (language && bridge.setLanguage) language.addEventListener('change', function () {
      if (languageBusy) return;
      languageBusy = true; language.disabled = true;
      languageStatus.textContent = tr('正在保存语言…', 'Saving language…');
      bridge.setLanguage(language.value).then(function (result) {
        if (!result || !result.ok) throw new Error(result && result.message || tr('语言保存失败，请重试。', 'Could not save the language. Try again.'));
        savedLanguage = result.language; language.value = savedLanguage; syncLanguageStatus(result);
      }).catch(function (error) { language.value = savedLanguage; languageStatus.textContent = error.message; })
        .finally(function () { languageBusy = false; language.disabled = false; });
    });
    function saveTypography() {
      if (typographyBusy) return;
      typographyBusy = true; chatFont.disabled = chatFontSize.disabled = true;
      typographyStatus.textContent = tr('正在保存聊天文字…', 'Saving chat typography…');
      bridge.setChatTypography({ chatFont: chatFont.value, chatFontSize: Number(chatFontSize.value) }).then(function (result) {
        if (!result || !result.ok) throw new Error(result && result.message || tr('聊天文字保存失败，请重试。', 'Could not save chat typography. Try again.'));
        syncTypography(result);
        typographyStatus.textContent = tr('已保存，立即应用于对话和输入框。', 'Saved. Applies immediately to messages and the composer.');
      }).catch(function (error) {
        chatFont.value = savedFont; chatFontSize.value = String(savedFontSize);
        typographyStatus.textContent = error.message;
      }).finally(function () { typographyBusy = false; chatFont.disabled = chatFontSize.disabled = false; });
    }
    if (chatFont && chatFontSize && typographyStatus && bridge.setChatTypography) {
      chatFont.addEventListener('change', saveTypography);
      chatFontSize.addEventListener('change', saveTypography);
    }
    if (sidebarAvatarSizeOptions && sidebarAvatarSizeButtons.length) {
      sidebarAvatarSizeButtons.forEach(function (button) {
        button.addEventListener('click', function () { saveSidebarAvatarSize(button.dataset.avatarSizeOption); });
      });
      sidebarAvatarSizeOptions.addEventListener('keydown', function (event) {
        var current = sidebarAvatarSizeButtons.indexOf(document.activeElement);
        if (current < 0 || sidebarAvatarSizeBusy) return;
        var next = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % sidebarAvatarSizeButtons.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current + sidebarAvatarSizeButtons.length - 1) % sidebarAvatarSizeButtons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = sidebarAvatarSizeButtons.length - 1;
        if (next === null) return;
        event.preventDefault();
        sidebarAvatarSizeButtons[next].focus();
        saveSidebarAvatarSize(sidebarAvatarSizeButtons[next].dataset.avatarSizeOption);
      });
      if (!bridge || !bridge.setSidebarAvatarSize) {
        setSidebarAvatarSizeBusy(false);
        if (sidebarAvatarSizeStatus) sidebarAvatarSizeStatus.textContent = tr('此选项仅在桌面版中可用。', 'This option is available in the desktop app.');
      }
    }
  }
  function start() { Promise.resolve(window.OpenBotI18n && window.OpenBotI18n.ready).then(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
