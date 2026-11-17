(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OpenBotHistoryMedia = api;
})(typeof window === 'object' ? window : null, function () {
  'use strict';
  function tr(zh,en){var i18n=typeof window==='object'?window.OpenBotI18n:null;return i18n?i18n.t(zh,en):zh;}
  var order = ['video', 'image', 'audio'];
  var labels = { text: tr('文字',"Text"), video: tr('视频',"Video"), image: tr('图片',"Image"), audio: tr('音频',"Audio") };
  // Matches the media formats the existing file viewer recognizes. No prose,
  // URL fetching, or file contents are used to infer a navigation category.
  var extensions = {
    video: /\.(mp4|m4v|webm|mov|mkv)$/i,
    image: /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i,
    audio: /\.(mp3|wav|m4a|ogg|oga|flac|aac|opus)$/i
  };
  function kind(file) {
    if (!file || typeof file !== 'object') return null;
    if (order.indexOf(file.kind) !== -1) return file.kind;
    var mime = typeof file.mime === 'string' ? file.mime : typeof file.mimeType === 'string' ? file.mimeType : '';
    var category = mime.toLowerCase().split('/')[0];
    if (order.indexOf(category) !== -1) return category;
    var name = typeof file.name === 'string' ? file.name : '';
    for (var i = 0; i < order.length; i++) if (extensions[order[i]].test(name)) return order[i];
    return null;
  }
  function describe(types) {
    types = order.filter(function (type) { return types.indexOf(type) !== -1; });
    if (!types.length) return { types: ['text'], label: labels.text, paint: '' };
    var colors = types.map(function (type) { return 'var(--ob-history-media-' + type + ')'; });
    var paint = colors[0];
    if (colors.length > 1) paint = 'linear-gradient(to right,' + colors.map(function (color, i) {
      return color + ' ' + (i * 100 / colors.length) + '%,' + color + ' ' + ((i + 1) * 100 / colors.length) + '%';
    }).join(',') + ')';
    return { types: types, label: types.map(function (type) { return labels[type]; }).join(' · '), paint: paint };
  }
  function explicitReference(text, name) {
    var target = '@' + name, pos = text.indexOf(target);
    while (pos !== -1) {
      var before = pos === 0 || /[\s，。！？、；：,;!?()[\]{}<>"'（【]/.test(text[pos - 1]);
      var end = pos + target.length;
      var after = end === text.length || /[\s，。！？、；：,;!?()[\]{}<>"'）】]/.test(text[end]);
      if (before && after) return true;
      pos = text.indexOf(target, pos + target.length);
    }
    return false;
  }
  function segments(bot) {
    bot = bot || {};
    var files = (Array.isArray(bot.files) ? bot.files : []).filter(function (file) { return file && typeof file.name === 'string'; });
    var tasks = new Map(), references = [];
    files.forEach(function (file) {
      var type = kind(file);
      if (!type) return;
      references.push({ name: file.name, type: type });
      var ids = [file.taskId];
      if (typeof file.id === 'string' && file.id.indexOf('f_') === 0) ids.push(file.id.slice(2));
      ids.forEach(function (id) {
        if (!id) return;
        var types = tasks.get(id) || []; types.push(type); tasks.set(id, types);
      });
    });
    var result = [], current = null;
    (Array.isArray(bot.messages) ? bot.messages : []).forEach(function (message) {
      if (!message || typeof message !== 'object') return;
      if (message.role === 'user') { current = []; result.push(current); }
      if (!current) return;
      var media = kind(message.fileView);
      if (media) current.push(media);
      if (message.kind === 'task' && message.taskId) current.push.apply(current, tasks.get(message.taskId) || []);
      var text = typeof message.text === 'string' ? message.text : '';
      if (text.indexOf('@') !== -1) references.forEach(function (file) {
        if (explicitReference(text, file.name)) current.push(file.type);
      });
    });
    return result.map(describe);
  }
  return Object.freeze({ segments: segments, kind: kind });
});
