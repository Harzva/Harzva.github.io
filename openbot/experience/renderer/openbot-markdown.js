/**
 * OpenBot Markdown 子集渲染器。
 *
 * 从 integrations/android-preview/web/app.js 的 renderMarkdown 移植：
 * 围栏代码、1-6 级标题、引用、无序/有序/任务列表、分隔线、粗体、斜体、
 * 删除线、`行内代码`、链接，另补最小表格支持。所有节点用
 * createTextNode/setAttribute 构造，**任何地方都不用 innerHTML**。
 * 链接默认仍按纯文本显示；聊天界面显式传入 { links: true } 后才生成
 * 可点击的 <a>，且只允许 http(s) 协议。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OpenBotMarkdown = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MD_FENCE = /^\s*```(.*)$/;
  const MD_HEADING = /^\s*(#{1,6})\s+(.*)$/;
  const MD_QUOTE = /^\s*>\s?(.*)$/;
  const MD_BULLET = /^\s*[-*+]\s+(.*)$/;
  const MD_ORDERED = /^\s*\d+[.)]\s+(.*)$/;
  const MD_TASK = /^\[([ xX])\]\s+(.*)$/;
  const MD_RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
  const MD_TABLE_ROW = /^\s*\|.*\|\s*$/;
  const MD_TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/;
  const SAFE_LINK = /^https?:\/\//i;

  const INLINE_CODE = /`([^`\n]+)`/y;
  const INLINE_LINK = /\[([^\]\n]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/y;
  const INLINE_BOLD_ITALIC = /\*\*\*(\S(?:[^*\n]*\S)?)\*\*\*/y;
  const INLINE_BOLD = /\*\*(\S(?:[^*\n]*\S)?)\*\*/y;
  const INLINE_BOLD_UNDER = /__(\S(?:[^_\n]*\S)?)__/y;
  const INLINE_STRIKE = /~~(\S(?:[^~\n]*\S)?)~~/y;
  const INLINE_ITALIC = /\*(\S(?:[^*\n]*\S)?)\*/y;
  const INLINE_ITALIC_UNDER = /_(\S(?:[^_\n]*\S)?)_/y;

  const text = (value) => String(value == null ? '' : value);

  function isCronLine(line) {
    const fields = line.trim().split(/\s+/);
    return fields.length >= 5 && fields[0].includes('*') && fields.filter(field => field.includes('*')).length >= 3;
  }

  function matched(regex, source, index, before, after) {
    regex.lastIndex = index;
    const match = regex.exec(source);
    if (!match || match.index !== index) return null;
    if (before && index > 0 && /[A-Za-z0-9]/.test(source[index - 1])) return null;
    if (after && /[A-Za-z0-9]/.test(source[index + match[0].length] || '')) return null;
    return match;
  }

  function appendLink(parent, label, href, raw, options) {
    if (!options || options.links !== true) {
      parent.appendChild(document.createTextNode(raw));
      return;
    }
    if (!SAFE_LINK.test(href)) {
      appendInline(parent, label, Object.assign({}, options, { links: false }));
      return;
    }
    const link = document.createElement('a');
    link.className = 'md-link';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    appendInline(link, label, Object.assign({}, options, { links: false }));
    parent.appendChild(link);
  }

  function appendInline(parent, source, options) {
    const value = text(source);
    let plain = '';
    const flush = () => {
      if (!plain) return;
      parent.appendChild(document.createTextNode(plain));
      plain = '';
    };
    let index = 0;
    while (index < value.length) {
      const char = value[index];

      if (char === '\\' && /[\\`*_[\]()#+.!~>-]/.test(value[index + 1] || '')) {
        plain += value[index + 1];
        index += 2;
        continue;
      }

      let match = matched(INLINE_CODE, value, index);
      if (match) {
        flush();
        const code = document.createElement('code');
        code.className = 'md-code';
        code.textContent = match[1];
        parent.appendChild(code);
        index += match[0].length;
        continue;
      }

      match = matched(INLINE_LINK, value, index);
      if (match) {
        flush();
        appendLink(parent, match[1], match[2], match[0], options);
        index += match[0].length;
        continue;
      }

      match = matched(INLINE_BOLD_ITALIC, value, index);
      if (match) {
        flush();
        const node = document.createElement('strong');
        const em = document.createElement('em');
        appendInline(em, match[1], options);
        node.appendChild(em);
        parent.appendChild(node);
        index += match[0].length;
        continue;
      }

      match = matched(INLINE_BOLD, value, index) || matched(INLINE_BOLD_UNDER, value, index);
      if (match) {
        flush();
        const node = document.createElement('strong');
        appendInline(node, match[1], options);
        parent.appendChild(node);
        index += match[0].length;
        continue;
      }

      match = matched(INLINE_STRIKE, value, index);
      if (match) {
        flush();
        const node = document.createElement('del');
        appendInline(node, match[1], options);
        parent.appendChild(node);
        index += match[0].length;
        continue;
      }

      match = matched(INLINE_ITALIC, value, index);
      if (!match) match = matched(INLINE_ITALIC_UNDER, value, index, true, true);
      if (match) {
        flush();
        const node = document.createElement('em');
        appendInline(node, match[1], options);
        parent.appendChild(node);
        index += match[0].length;
        continue;
      }

      plain += char;
      index += 1;
    }
    flush();
  }

  function splitRow(line) {
    return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
  }

  function appendTable(fragment, lines, start, options) {
    const head = splitRow(lines[start]);
    let index = start + 1;
    if (index >= lines.length || !MD_TABLE_SEP.test(lines[index])) return null;
    index += 1;
    const table = document.createElement('table');
    table.className = 'md-table';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const cell of head) {
      const th = document.createElement('th');
      appendInline(th, cell, options);
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    while (index < lines.length && MD_TABLE_ROW.test(lines[index])) {
      const cells = splitRow(lines[index]);
      const tr = document.createElement('tr');
      for (let i = 0; i < head.length; i++) {
        const td = document.createElement('td');
        if (cells[i] !== undefined) appendInline(td, cells[i], options);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
      index += 1;
    }
    table.appendChild(tbody);
    fragment.appendChild(table);
    return index;
  }

  function render(source, options) {
    const fragment = document.createDocumentFragment();
    const lines = text(source).split(/\r?\n/);
    let index = 0;
    let paragraph = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      const node = document.createElement('p');
      node.className = 'md-p';
      appendInline(node, paragraph.join('\n'), options);
      fragment.appendChild(node);
      paragraph = [];
    };

    while (index < lines.length) {
      const line = lines[index];

      const fence = line.match(MD_FENCE);
      if (fence) {
        flushParagraph();
        const body = [];
        index += 1;
        while (index < lines.length && !MD_FENCE.test(lines[index])) {
          body.push(lines[index]);
          index += 1;
        }
        // 没有收尾围栏时 index 已经到末尾，这里多走一格也没关系。
        index += 1;
        const pre = document.createElement('pre');
        pre.className = 'md-pre';
        const code = document.createElement('code');
        const language = fence[1].trim();
        if (language) code.dataset.lang = language;
        code.textContent = body.join('\n');
        pre.appendChild(code);
        fragment.appendChild(pre);
        continue;
      }

      if (MD_TABLE_ROW.test(line)) {
        const consumed = appendTable(fragment, lines, index, options);
        if (consumed !== null) {
          flushParagraph();
          index = consumed;
          continue;
        }
      }

      if (!line.trim()) {
        flushParagraph();
        index += 1;
        continue;
      }

      if (MD_RULE.test(line)) {
        flushParagraph();
        const rule = document.createElement('hr');
        rule.className = 'md-rule';
        fragment.appendChild(rule);
        index += 1;
        continue;
      }

      const heading = line.match(MD_HEADING);
      if (heading) {
        flushParagraph();
        const node = document.createElement('p');
        node.className = 'md-heading md-h' + heading[1].length;
        node.setAttribute('role', 'heading');
        node.setAttribute('aria-level', String(heading[1].length));
        appendInline(node, heading[2], options);
        fragment.appendChild(node);
        index += 1;
        continue;
      }

      if (isCronLine(line)) {
        paragraph.push(line);
        index += 1;
        continue;
      }

      const bullet = line.match(MD_BULLET);
      const ordered = line.match(MD_ORDERED);
      if (bullet || ordered) {
        flushParagraph();
        const tag = bullet ? 'ul' : 'ol';
        const pattern = bullet ? MD_BULLET : MD_ORDERED;
        const list = document.createElement(tag);
        list.className = 'md-list';
        while (index < lines.length) {
          const item = lines[index].match(pattern);
          if (!item) break;
          const li = document.createElement('li');
          const task = bullet ? item[1].match(MD_TASK) : null;
          if (task) {
            li.className = 'md-task';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.disabled = true;
            checkbox.checked = task[1].toLowerCase() === 'x';
            li.appendChild(checkbox);
            const label = document.createElement('span');
            appendInline(label, task[2], options);
            li.appendChild(label);
          } else {
            appendInline(li, item[1], options);
          }
          list.appendChild(li);
          index += 1;
        }
        fragment.appendChild(list);
        continue;
      }

      const quote = line.match(MD_QUOTE);
      if (quote) {
        flushParagraph();
        const node = document.createElement('blockquote');
        node.className = 'md-quote';
        const inner = [];
        while (index < lines.length) {
          const item = lines[index].match(MD_QUOTE);
          if (!item) break;
          inner.push(item[1]);
          index += 1;
        }
        appendInline(node, inner.join('\n'), options);
        fragment.appendChild(node);
        continue;
      }

      paragraph.push(line);
      index += 1;
    }

    flushParagraph();
    return fragment;
  }

  return { render, appendInline };
});
