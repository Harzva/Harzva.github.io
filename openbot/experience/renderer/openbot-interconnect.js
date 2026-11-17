(function (root) {
  'use strict';

  function byId(id) { return root.document.getElementById(id); }

  function scrollTo(target) {
    if (!target) return;
    target.scrollIntoView({ block: 'start' });
    if (typeof target.focus === 'function') target.focus({ preventScroll: true });
  }

  function openModelSettings() {
    var tab = byId('set-tab-model');
    if (tab) tab.click();
    root.setTimeout(function () {
      var firstField = byId('set-profile');
      if (firstField && !firstField.disabled) firstField.focus({ preventScroll: true });
    }, 0);
  }

  function openAgentCreation() {
    var trigger = byId('btn-new-bot');
    var modal = byId('modal-mask');
    if (!trigger || !modal) return;
    var closeSettings = byId('set-close');
    var settingsMask = byId('set-mask');
    if (closeSettings && settingsMask && !settingsMask.classList.contains('hidden')) closeSettings.click();
    trigger.click();

    var attempts = 0;
    function focusExecutor() {
      var picker = byId('m-executor-trigger');
      if (!picker || modal.classList.contains('hidden')) return;
      if (!picker.disabled) {
        picker.focus({ preventScroll: true });
        return;
      }
      attempts += 1;
      if (attempts < 60) root.setTimeout(focusExecutor, 50);
    }
    root.setTimeout(focusExecutor, 0);
  }

  function init() {
    var sectionLink = byId('apps-path-service');
    var channelLink = byId('apps-path-channels');
    var service = byId('bot-service-settings');
    var channels = byId('apps-channels-heading');
    [sectionLink, channelLink].forEach(function (link, index) {
      if (!link) return;
      link.addEventListener('click', function (event) {
        event.preventDefault();
        scrollTo(index === 0 ? service : channels);
      });
    });

    var modelPath = byId('apps-open-model-settings');
    var agentPath = byId('apps-create-local-agent');
    if (modelPath) modelPath.addEventListener('click', openModelSettings);
    if (agentPath) agentPath.addEventListener('click', openAgentCreation);
  }

  function start() {
    Promise.resolve(root.OpenBotI18n && root.OpenBotI18n.ready).then(init);
  }

  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window);
