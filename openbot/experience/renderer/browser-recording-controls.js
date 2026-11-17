(function () {
  'use strict';

  var copy = {
    zh: {
      ariaLabel: '网页录制控制',
      states: {
        starting: ['正在准备网页录制', '可以在录制开始前取消', '取消', '取消网页录制'],
        recording: ['正在录制当前网页', '系统声音 · 最长 3 分钟', '停止并保存', '停止并保存网页录制'],
        stopping: ['正在完成录制', '正在验证并保存视频', '结束中…', '正在结束网页录制'],
        error: ['无法确认录制已结束', '', '重试停止', '重试停止网页录制']
      },
      invalidControl: '此录制控制暂不可用，请返回 Bot Studio。',
      errors: {
        'missing-media': '录屏文件缺少有效视频或音频。',
        'permission-denied': '屏幕或系统音频权限不可用。',
        'window-closed': '浏览器窗口已关闭，录制已结束。',
        'stop-failed': '无法确认录制已结束，请返回 Bot Studio。',
        unavailable: '录制暂不可用，请返回 Bot Studio。'
      },
      genericError: '录制失败，请返回 Bot Studio。'
    },
    en: {
      ariaLabel: 'Browser recording controls',
      states: {
        starting: ['Preparing browser recording', 'You can cancel before recording starts', 'Cancel', 'Cancel browser recording'],
        recording: ['Recording the current page', 'System audio · Up to 3 minutes', 'Stop and save', 'Stop and save browser recording'],
        stopping: ['Finishing recording', 'Verifying and saving the video', 'Finishing…', 'Finishing browser recording'],
        error: ['Recording stop unconfirmed', '', 'Retry stop', 'Retry stopping browser recording']
      },
      invalidControl: 'Recording controls are unavailable. Return to OpenBot.',
      errors: {
        'missing-media': 'The recording has no valid video or audio.',
        'permission-denied': 'Screen or system audio permission is unavailable.',
        'window-closed': 'The browser window closed. Recording ended.',
        'stop-failed': 'Could not confirm recording ended. Return to OpenBot.',
        unavailable: 'Recording is unavailable. Return to OpenBot.'
      },
      genericError: 'Recording failed. Return to OpenBot.'
    }
  };

  function render() {
    var params = new URLSearchParams(window.location.search);
    var language = params.get('lang') === 'en' ? 'en' : 'zh';
    var theme = params.get('theme') === 'light' ? 'light' : 'dark';
    var requestedPhase = params.get('phase');
    var phase = ['starting', 'recording', 'stopping', 'error'].indexOf(requestedPhase) >= 0 ? requestedPhase : 'starting';
    var controlCandidate = String(params.get('controlId') || '');
    var controlId = controlCandidate.length === 32 && /^[a-f0-9]{32}$/.test(controlCandidate) ? controlCandidate : '';
    var errorCode = String(params.get('error') || '').slice(0, 64).trim().toLowerCase();
    var strings = copy[language];
    var state = strings.states[phase];
    var bar = document.querySelector('[data-recording-controls]');
    var title = document.querySelector('[data-recording-title]');
    var detail = document.querySelector('[data-recording-detail]');
    var action = document.querySelector('[data-recording-action]');

    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.documentElement.dataset.theme = theme;
    bar.dataset.phase = phase;
    bar.setAttribute('aria-label', strings.ariaLabel);
    title.textContent = state[0];
    var knownError = Object.prototype.hasOwnProperty.call(strings.errors, errorCode);
    detail.textContent = phase === 'error' ? (knownError ? strings.errors[errorCode] : strings.genericError) : state[1];
    action.textContent = state[2];
    action.setAttribute('aria-label', state[3]);

    action.hidden = false;
    if (controlId) {
      // A regular local navigation reaches the host's will-navigate guard.
      // Custom media protocols may be handled before that event is emitted.
      action.setAttribute('href', './browser-recording-controls.html?stopControlId=' + controlId);
      action.setAttribute('aria-disabled', phase === 'stopping' ? 'true' : 'false');
      if (phase === 'recording' && params.get('audioMode') === 'system-and-microphone') {
        detail.textContent = language === 'en' ? 'System audio and microphone · Up to 3 minutes' : '系统声音和麦克风 · 最长 3 分钟';
      }
    } else {
      action.removeAttribute('href');
      action.setAttribute('aria-disabled', 'true');
      detail.textContent = strings.invalidControl;
    }

    action.addEventListener('click', function (event) {
      if (phase === 'stopping' || !controlId) event.preventDefault();
    });
    action.addEventListener('keydown', function (event) {
      if (event.key !== ' ') return;
      event.preventDefault();
      if (phase === 'stopping' || !controlId) return;
      action.click();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
})();
