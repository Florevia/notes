# AI 对话前端复制

复制必须发生在用户手势里（点击、按键）。`navigator.clipboard` 只在 HTTPS 或 localhost 可用；内网 HTTP 下它是 `undefined`。所有写入都要 `try/catch`，失败就走降级。

## 工具函数

Vue 和 React 共用。

```js
// utils/copy.js

export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* 降级 */ }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', ''); // 移动端不弹键盘
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length); // iOS
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

// 同时写 HTML 和纯文本，粘贴目标自己选格式
export async function copyRich(html, plain) {
  if (window.ClipboardItem && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ]);
      return true;
    } catch {}
  }
  return copyText(plain);
}

// 只有 PNG 稳定。Promise 必须直接传给 ClipboardItem，Safari 才认用户手势
export async function copyImage(url) {
  if (!window.ClipboardItem) return false;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': fetch(url).then((r) => r.blob()) }),
    ]);
    return true;
  } catch {
    return false;
  }
}
```

| API | 能做什么 | 限制 |
|---|---|---|
| `clipboard.writeText` | 纯文本 | 安全上下文，且必须用户触发 |
| `clipboard.write` + `ClipboardItem` | HTML、图片 | 老浏览器没有 `ClipboardItem` |
| `execCommand('copy')` | 降级纯文本 | 已废弃，只能复制当前选区 |
| `copy` 事件 | 改写用户手动复制的内容 | 只在 Ctrl+C / 右键复制时触发 |

## 六种场景

### 1. 整条消息

复制 `msg.content`（Markdown 原文），不要复制渲染后的 DOM。按钮文案切到「已复制」，1.5–2 秒恢复；连续点击先清掉上一个定时器，卸载时也要清。Vue 可直接用 `useClipboard({ legacy: true })`。

```jsx
function MessageItem({ content }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  const onCopy = async () => {
    if (!(await copyText(content))) return;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  return <button onClick={onCopy}>{copied ? '已复制' : '复制'}</button>;
}
```

### 2. 富文本

`copyRich(容器.innerHTML, 原文)`。粘贴到 Word、飞书时保留标题、加粗、表格。复制出来的 HTML 只有 class、没有样式，格式要求高就把关键样式写成内联 `style`。

### 3. 代码块

React 在自定义 `code` 组件里直接拿字符串。`react-markdown` v9 去掉了 `inline`，用 `className` 是否含 `language-`，或内容是否含换行来判断。

Vue 的 `v-html` 绑不上事件：改写 `fence` 插入按钮，在外层用事件委托，从 `code.textContent` 取值。高亮拆成的 `<span>` 不影响；有行号先排除行号节点。

```js
md.renderer.rules.fence = (tokens, idx) => {
  const t = tokens[idx];
  return `<div class="code-block">
    <button class="copy-code-btn">复制代码</button>
    <pre><code>${md.utils.escapeHtml(t.content)}</code></pre></div>`;
};
```

```vue
<div v-html="html" @click="onClick" />
```

```js
async function onClick(e) {
  const btn = e.target.closest('.copy-code-btn');
  if (!btn) return;
  const code = btn.closest('.code-block').querySelector('code').textContent;
  if (await copyText(code)) {
    btn.textContent = '已复制';
    setTimeout(() => (btn.textContent = '复制代码'), 1500);
  }
}
```

### 4. 划词引用

`getSelection()`，确认选区在消息容器内，用 `getBoundingClientRect()` 定位浮动菜单。

```js
function getSelectionInfo(container) {
  const sel = window.getSelection();
  const text = sel?.toString().trim();
  if (!text || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!container?.contains(range.commonAncestorContainer)) return null;
  const rect = range.getBoundingClientRect();
  return { text, top: rect.top - 40, left: rect.left + rect.width / 2 };
}
```

- 按钮 `mousedown` 要 `preventDefault`，否则一点就丢选区。
- 菜单用 Portal / Teleport 挂到 `body`，避免被 `overflow` 裁掉。
- `mouseup` 后延迟一帧再读选区。
- 移动端改听 `selectionchange` 并防抖，注意和系统菜单冲突。滚动时隐藏或重算位置。

### 5. 拦截 Ctrl+C

只绑在消息区域，不要绑 `document`，否则输入框复制也被改掉。典型用途：KaTeX 乱码还原成 LaTeX、去掉按钮文字、末尾附来源。`setData` 之后必须 `preventDefault`，否则改写不生效。不要随意改用户复制的内容。

```js
function onCopy(e) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const frag = sel.getRangeAt(0).cloneContents();
  const div = document.createElement('div');
  div.appendChild(frag);

  div.querySelectorAll('.katex').forEach((el) => {
    const tex = el.querySelector('annotation[encoding="application/x-tex"]')?.textContent;
    if (tex) el.replaceWith(`$${tex}$`);
  });

  e.clipboardData.setData('text/plain', div.textContent);
  e.preventDefault();
}
```

React 用 `<div onCopy={onCopy}>`，Vue 用 `<div @copy="onCopy">`。

### 6. 图片

调 `copyImage`。JPG 先画到 canvas 再转 PNG。跨域图需要服务端 CORS，否则 `fetch` 失败。没有 `execCommand` 降级，不支持就提示右键另存或提供下载。iframe 里还要父页面加 `allow="clipboard-write"`。

## 落地时别漏

- 按钮、头像、时间戳加 `user-select: none`，避免被划词带走。
- 流式输出时 DOM 不断替换，选区会丢。已完成段落做 memo，或生成结束后再显示复制按钮。
- `v-html` / `dangerouslySetInnerHTML` 要关 Markdown 的 HTML，或用 DOMPurify。
- 失败时提示用户手动复制，不要静默。

## 怎么配

| 需求 | 用哪个 |
|---|---|
| 只要一段文字 | 1 |
| 贴进文档还要保留格式 | 1 + 2 |
| 回答里有代码 | 1 + 3 |
| 要「引用追问」 | 再加 4 |
| 有公式 | 再加 5 |
| 有生成图 | 再加 6 |

常见组合是 1 + 3。4 对体验提升最大，5 只在有公式时才需要。
