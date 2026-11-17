/* Explicit product UI localization. User content is never scanned or translated. */
(function (root) {
  'use strict';
  var locale = /^zh\b|^zh[-_]/i.test(root.navigator.language || '') ? 'zh-CN' : 'en';
  var query = new URLSearchParams(root.location.search).get('uiLanguage');
  if (query === 'en' || query === 'zh-CN') locale = query;
  var boot = root.grokbot && root.grokbot.uiLanguage;
  if (boot === 'en' || boot === 'zh-CN') locale = boot;
  function setLocale(value) {
    locale = value === 'en' ? 'en' : 'zh-CN';
    root.document.documentElement.lang = locale;
  }
  function t(zh, en, params) {
    var value = locale === 'en' && typeof en === 'string' ? en : zh;
    if (params) value = String(value).replace(/\{([a-zA-Z0-9_]+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match;
    });
    return value;
  }
  function localize(target) {
    var attributes = ['text', 'placeholder', 'title', 'aria-label'];
    attributes.forEach(function (attribute) {
      var prefix = attribute === 'text' ? 'data-i18n-' : 'data-i18n-' + attribute + '-';
      var selector = '[' + prefix + 'zh][' + prefix + 'en]';
      var nodes = Array.from(target.querySelectorAll(selector));
      if (target.matches && target.matches(selector)) nodes.unshift(target);
      nodes.forEach(function (node) {
        var value = t(node.getAttribute(prefix + 'zh'), node.getAttribute(prefix + 'en'));
        if (attribute === 'text') node.textContent = value;
        else node.setAttribute(attribute, value);
      });
    });
  }
  var ready = Promise.resolve();
  if (!boot && !query && root.grokbot && root.grokbot.getAppearance) {
    ready = root.grokbot.getAppearance().then(function (value) {
      setLocale(value.activeLanguage || value.effectiveLanguage || locale);
    }).catch(function () { setLocale(locale); });
  } else setLocale(locale);
  root.OpenBotI18n = { t: t, localize: localize, ready: ready,
    get locale() { return locale; },
    date: function (value, options) { return new Intl.DateTimeFormat(locale, options).format(new Date(value)); },
    number: function (value, options) { return new Intl.NumberFormat(locale, options).format(value); } };
})(window);
