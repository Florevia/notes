---
title: "XHR、Fetch 与 Axios：关系与用法"
description: "XHR、Fetch、Axios 的层级关系、API 逐个说明、同一请求的三种写法、能力对照与选型。"
tags: ["前端开发"]
docType: "concept"
knowledgeTopic: "/frontend/network/"
---

# XHR、Fetch 与 Axios：关系、API 与用法

> 一句话定位：**XHR 和 Fetch 是浏览器原生请求 API，Axios 是构建在它们之上的 HTTP 客户端库，AJAX 是用异步请求局部更新页面的开发方式。** 三者不是同一层级的三个竞品。

## 1. 先定位：三个名字不在同一层

| 名称 | 类型 | 运行环境 | 主要职责 |
| --- | --- | --- | --- |
| HTTP | 应用层协议 | 网络 | 规定请求/响应报文、方法、状态码、头部 |
| XMLHttpRequest | 浏览器 Web API | 浏览器（部分运行时提供兼容实现） | 用对象和事件发起请求，控制请求过程 |
| Fetch API | 现代标准 API | 浏览器、Web Worker、Node.js、Deno、Bun | 用 Promise、Request/Response 和流处理请求 |
| Axios | 第三方 HTTP 客户端库 | 浏览器、Node.js | 统一配置、拦截器、数据转换、错误与取消处理 |
| AJAX | 开发模式 | — | 不刷新页面异步取数并更新 UI |

请求客户端的实际调用链：

```text
业务代码
  ├── new XMLHttpRequest() ─────────→ 浏览器网络栈
  ├── fetch() ──────────────────────→ 浏览器网络栈
  └── axios(config)
        └── adapter（适配器）
              ├── xhr   → XMLHttpRequest
              ├── http  → Node.js http / https
              └── fetch → Fetch API
```

⚠️ 注意：

- **Axios 没有自己的网络能力。** 它把配置、转换、拦截器和错误处理组织起来，真正发请求的是适配器。换句话说，Axios 负责管理 HTTP 请求，而真正执行网络通信的是运行环境提供的底层 API。

![Axios 分层结构：Core 核心层 → Adapter 适配器层 → XHR / fetch / Node.js http(s)](/assets/knowledge/frontend/network/axios-core-adapter.png)

## 2. 同一个请求，三种写法

目标相同：`GET /api/users?page=1&keyword=张三`，携带 `Accept: application/json`，检查 HTTP 状态，返回 JSON。

### 2.1 XHR

```js
function getUsers({ page = 1, keyword = '' } = {}) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      page: String(page),
      keyword
    });

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/api/users?${params}`);
    xhr.responseType = 'json';
    xhr.timeout = 5000;
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`HTTP ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new TypeError('网络错误或请求被 CORS 阻止'));
    xhr.ontimeout = () => reject(new Error('请求超时'));
    xhr.onabort = () => reject(new DOMException('请求已取消', 'AbortError'));

    xhr.send();
  });
}
```

XHR 的步骤是手动的：创建对象 → `open` 配置 → 设置请求头 → 注册事件 → `send`。状态判断和 JSON 解析也要自己处理。

### 2.2 Fetch

```js
async function getUsers({ page = 1, keyword = '' } = {}, { signal } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    keyword
  });

  const response = await fetch(`/api/users?${params}`, {
    headers: { Accept: 'application/json' },
    signal
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

Fetch 用 Promise 和 async/await，但查询参数、HTTP 状态判断和响应体解析仍然要显式处理。

### 2.3 Axios

```js
import axios from 'axios';

const http = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: { Accept: 'application/json' }
});

async function getUsers({ page = 1, keyword = '' } = {}, { signal } = {}) {
  const response = await http.get('/users', {
    params: { page, keyword },
    signal
  });

  return response.data;
}
```

Axios 把 `params` 序列化、JSON 响应转换、非 2xx 拒绝、超时配置都收进了统一配置。便利来自工程封装，不是来自新的网络能力。

## 3. XMLHttpRequest API

### 3.1 生命周期与 readyState

XHR 用一个对象表示一次请求，通过事件通知进度：

```js
const xhr = new XMLHttpRequest();

xhr.onreadystatechange = () => {
  console.log('readyState', xhr.readyState);

  if (xhr.readyState === 2) {
    console.log('响应头', xhr.getAllResponseHeaders());
    console.log('Content-Type', xhr.getResponseHeader('content-type'));
  }

  if (xhr.readyState === 4) {
    console.log('结束', xhr.status, xhr.statusText);
  }
};

xhr.open('GET', '/api/users');
xhr.responseType = 'json';
xhr.setRequestHeader('Accept', 'application/json');
xhr.send();
```

| readyState | 常量 | 含义 |
| --- | --- | --- |
| 0 | `UNSENT` | 已创建，尚未调用 `open()` |
| 1 | `OPENED` | 已调用 `open()` |
| 2 | `HEADERS_RECEIVED` | 已收到响应头，`status` 和响应头可读 |
| 3 | `LOADING` | 正在接收响应体 |
| 4 | `DONE` | 请求结束 |

**`readyState === 4` 只表示结束，不表示成功。** 404、500、网络错误、取消都可能走到 4，必须再检查 `status`。

### 3.2 方法

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `open` | `open(method, url, async = true, user, password)` | 配置请求方法和地址；`async = false` 的同步请求已不推荐 |
| `setRequestHeader` | `setRequestHeader(name, value)` | 设置请求头；必须在 `open()` 之后、`send()` 之前 |
| `send` | `send(body = null)` | 真正发送请求；GET/HEAD 不发送请求体 |
| `abort` | `abort()` | 中止请求，触发 `abort` 事件 |
| `getResponseHeader` | `getResponseHeader(name)` | 读取单个响应头，读不到时返回 `null` |
| `getAllResponseHeaders` | `getAllResponseHeaders()` | 读取全部响应头，返回 CRLF 分隔的字符串 |
| `overrideMimeType` | `overrideMimeType(mime)` | 覆盖响应 MIME 类型，影响解析方式 |

`setRequestHeader` 可以多次调用同名头，值会按规范合并；但 `Content-Type`、`Authorization` 这类头通常只设置一次。

### 3.3 属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `readyState` | number | 当前状态，0–4 |
| `status` | number | HTTP 状态码；尚未拿到响应、网络错误、取消时为 `0` |
| `statusText` | string | 状态描述，如 `OK` |
| `responseType` | string | 期望的响应类型：`''`/`'text'`、`'json'`、`'document'`、`'blob'`、`'arraybuffer'` |
| `response` | any | 按 `responseType` 返回的响应体 |
| `responseText` | string | 文本响应；仅 `responseType` 为 `''` 或 `'text'` 时可读 |
| `responseURL` | string | 最终 URL（经过重定向后），不含 fragment |
| `timeout` | number | 超时毫秒数，`0` 表示不设置 |
| `withCredentials` | boolean | 跨源请求是否携带 Cookie 和 HTTP 认证信息 |
| `upload` | XMLHttpRequestUpload | 上传事件目标，用于监听上传进度 |

`responseType` 必须在 `send()` 之前设置。设置成 `blob`、`arraybuffer` 后再读 `responseText` 会抛 `InvalidStateError`。`responseType = 'json'` 时，非法 JSON 通常得到 `null`，而不是 `JSON.parse` 那样的语法异常。

### 3.4 事件

| 事件 | 触发时机 |
| --- | --- |
| `readystatechange` | `readyState` 每次变化 |
| `loadstart` | 请求开始 |
| `progress` | 下载过程中周期性触发 |
| `load` | 请求完成并拿到 HTTP 响应（包括 4xx/5xx） |
| `error` | 网络层错误，如 DNS 失败、连接失败、CORS 阻止 |
| `abort` | 调用了 `abort()` |
| `timeout` | 超过 `timeout` 设置的时间 |
| `loadend` | 请求结束；成功、失败、取消、超时都会触发 |

上传侧事件挂在 `xhr.upload` 上：`loadstart`、`progress`、`load`、`error`、`abort`、`timeout`、`loadend`。

典型事件顺序：

```text
成功：  loadstart → progress* → load → loadend
网络错误：loadstart → progress* → error → loadend
取消：  loadstart → abort → loadend
超时：  loadstart → progress* → timeout → loadend
```

`progress` 事件的常用字段：

```js
xhr.onprogress = event => {
  // 总大小是否已知
  console.log(event.lengthComputable);
  // 已传输字节数
  console.log(event.loaded);
  // 总字节数；lengthComputable 为 false 时不可靠
  console.log(event.total);
};
```

### 3.5 完整示例：上传、进度与取消

```js
function uploadFile(file, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.responseType = 'json';

    xhr.upload.onprogress = event => {
      if (event.lengthComputable) {
        onProgress?.(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`HTTP ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new TypeError('网络错误'));
    xhr.onabort = () => reject(new DOMException('请求已取消', 'AbortError'));

    if (signal) {
      if (signal.aborted) {
        reject(new DOMException('请求已取消', 'AbortError'));
        return;
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.send(form);
  });
}
```

注意：

- 发送 `FormData` 时不要手动设置 `Content-Type`，浏览器需要自己生成带 `boundary` 的值。
- `xhr.abort()` 只中止客户端这次请求，服务端是否停止处理不受客户端控制。
- 上传进度 100% 只代表请求体发完，不代表服务端保存、转码或业务处理完成。

### 3.6 XHR 的边界

- 代码是事件/回调模型，统一封装需要自己写。
- 没有标准的 `ReadableStream` 响应体模型，不适合现代流式读取。
- 大响应会整体进入 `response`/`responseText`，内存压力明显。
- 同步 XHR（`async = false`）会阻塞主线程，已被弃用。
- 跨源请求同样受 CORS 约束，`withCredentials` 只解决是否携带凭证，不解决服务端是否允许。

## 4. Fetch API

### 4.1 两阶段 Promise

`fetch()` 返回 `Promise<Response>`。这个 Promise fulfilled 时，通常只表示**响应头已经到达**，响应体可能还在传输：

```js
const response = await fetch('/api/users'); // 收到状态码和响应头
const data = await response.json();         // 继续读取并解析响应体
```

```text
fetch()
  ↓
收到响应头，Promise fulfilled
  ↓
response.body 仍是可读流
  ↓
response.json() / text() / arrayBuffer() 读取完成
  ↓
得到完整数据
```

所以经常看到两个 `await`，它们分别对应“拿到响应”和“读完响应体”两个阶段。

### 4.2 三个核心对象

#### Request

```js
const request = new Request('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: '张三', age: 20 })
});

const response = await fetch(request);
```

`Request` 常用属性：`url`、`method`、`headers`、`body`、`bodyUsed`、`credentials`、`cache`、`redirect`、`mode`、`signal`。

#### Response

```js
const response = await fetch('/api/users/1');

console.log(response.ok);         // 状态码是否在 200–299
console.log(response.status);     // 200
console.log(response.statusText); // OK
console.log(response.type);       // basic / cors / opaque / opaqueredirect / error
console.log(response.url);        // 最终 URL
console.log(response.redirected); // 是否发生过重定向
console.log(response.bodyUsed);   // 响应体是否已被消费

const data = await response.json();
console.log(response.bodyUsed);   // true
```

| 属性 | 说明 |
| --- | --- |
| `ok` | `status >= 200 && status < 300` |
| `status` | HTTP 状态码；opaque 响应为 `0` |
| `statusText` | 状态描述 |
| `headers` | `Headers` 对象 |
| `url` | 最终 URL |
| `redirected` | 是否经过重定向 |
| `type` | 响应类型；`opaque` 表示内容不可读 |
| `body` | `ReadableStream` 或 `null`（如 HEAD、204、304） |
| `bodyUsed` | 响应体是否已被读取 |

响应体读取方法：

| 方法 | 返回 | 说明 |
| --- | --- | --- |
| `text()` | `Promise<string>` | 按文本读取 |
| `json()` | `Promise<any>` | 读取并 JSON 解析；空体或非法 JSON 会抛错 |
| `blob()` | `Promise<Blob>` | 二进制文件 |
| `arrayBuffer()` | `Promise<ArrayBuffer>` | 原始二进制 |
| `formData()` | `Promise<FormData>` | 解析表单响应 |
| `bytes()` | `Promise<Uint8Array>` | 原始字节，较新的 API，使用前确认兼容性 |

**响应体只能消费一次。** 读取后再调用其他读取方法会抛 `TypeError`。需要两份内容时先克隆：

```js
const response = await fetch('/api/users');
const copy = response.clone();

const data = await response.json();
const text = await copy.text();
```

`clone()` 会带来额外的缓冲和内存开销，大响应不要随意复制。

#### Headers

```js
const headers = new Headers({
  'Content-Type': 'application/json'
});

headers.append('X-Trace-Id', 'abc');
headers.set('Content-Type', 'application/json; charset=utf-8');

console.log(headers.get('content-type')); // 头名大小写不敏感
console.log(headers.has('X-Trace-Id'));   // true
headers.delete('X-Trace-Id');
```

`Headers` 提供 `get`、`set`、`append`、`has`、`delete`、`forEach` 等方法。注意响应头在浏览器中通常是只读的（guard 为 `immutable`），不能随意修改；请求头则可以设置，但会被浏览器限制某些禁止修改的头。

### 4.3 fetch 的 init 配置

```js
const response = await fetch(url, {
  method: 'GET',
  headers: {},
  body: undefined,
  mode: 'cors',
  credentials: 'same-origin',
  cache: 'default',
  redirect: 'follow',
  referrer: 'about:client',
  referrerPolicy: '',
  integrity: '',
  keepalive: false,
  signal: undefined
});
```

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `method` | `GET` | HTTP 方法 |
| `headers` | `{}` | 请求头，可为对象、`Headers` 或数组 |
| `body` | `null` | 请求体；GET/HEAD 不允许设置 |
| `mode` | `cors` | `cors`、`same-origin`、`no-cors` |
| `credentials` | `same-origin` | `omit`、`same-origin`、`include` |
| `cache` | `default` | 请求缓存模式：`no-store`、`reload`、`no-cache`、`force-cache`、`only-if-cached` |
| `redirect` | `follow` | `follow`、`error`、`manual` |
| `referrer` | `about:client` | 参照页 |
| `referrerPolicy` | 空 | 参照页策略 |
| `integrity` | 空 | 子资源完整性校验 |
| `keepalive` | `false` | 允许请求在页面卸载后继续，规范上限约 64 KiB |
| `signal` | 无 | `AbortSignal`，用于取消 |
| `duplex` | 无 | 请求体是流时，部分环境要求设为 `'half'` |

`mode: 'no-cors'` 会得到 opaque response，`status` 为 0，JavaScript 读不到正常响应内容。**它不是解决 JSON 接口跨域的办法。**

### 4.4 body 的类型与 Content-Type

| body 类型 | 自动设置的 Content-Type | 说明 |
| --- | --- | --- |
| `string` | `text/plain;charset=UTF-8` | 最常见的是自己 `JSON.stringify` |
| `URLSearchParams` | `application/x-www-form-urlencoded;charset=UTF-8` | 表单编码 |
| `FormData` | `multipart/form-data; boundary=...` | boundary 由浏览器生成 |
| `Blob` / `File` | 取 `Blob.type` | 文件上传 |
| `ArrayBuffer` / TypedArray | 不自动设置 | 手动指定需要的内容类型 |
| `ReadableStream` | 不自动设置 | 流式上传，环境支持不一 |

发送 JSON 时要自己序列化并设置 `Content-Type`：

```js
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  body: JSON.stringify({ name: '张三', age: 20 })
});
```

发送 `FormData` 时不要手写 `Content-Type`：

```js
const form = new FormData();
form.append('file', file);
form.append('description', '头像');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: form
});
```

### 4.5 超时与取消

Fetch 没有 `timeout` 配置，需要用 `AbortController`：

```js
async function fetchWithTimeout(input, init = {}, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const onAbort = () => controller.abort();

  if (init.signal?.aborted) {
    controller.abort();
  } else {
    init.signal?.addEventListener('abort', onAbort, { once: true });
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', onAbort);
  }
}
```

现代环境也可以使用 `AbortSignal.timeout(ms)`，需要同时响应多个信号时可用 `AbortSignal.any([...])`，使用前确认目标浏览器兼容性。

**`Promise.race` 只能让等待提前结束，不会取消底层请求。** 要真正中止 Fetch，必须把 `AbortSignal` 传进 `fetch`。

### 4.6 下载进度与流式读取

Fetch 没有 `onDownloadProgress` 回调，但可以读 `response.body`：

```js
const response = await fetch('/api/file');
const total = Number(response.headers.get('content-length')) || 0;
const reader = response.body.getReader();

let loaded = 0;

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  loaded += value.byteLength;
  console.log(total ? `${Math.round(loaded / total * 100)}%` : `${loaded} bytes`);
}
```

`Content-Length` 可能缺失，也可能因为压缩、分块传输而不等于实际网络字节，所以这只是近似进度。

读取文本流时要处理 UTF-8 字符跨 chunk 和消息边界：

```js
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  let index;
  while ((index = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, index);
    buffer = buffer.slice(index + 1);
    if (line) console.log(line);
  }
}

buffer += decoder.decode();
```

**一个 chunk 不等于一条完整消息。** 完整的分层是：网络字节流 → UTF-8 解码 → 文本缓冲 → 消息边界 → `JSON.parse` → 业务处理。SSE/NDJSON 的完整解析见 [Axios / Fetch / SSE 与 MCP](/frontend/network/http-streaming)。

### 4.7 Fetch 的错误语义

Fetch 只在以下情况 reject：

- 网络错误、DNS 失败、连接失败；
- 请求被 CORS 阻止；
- URL 非法；
- 被 `AbortSignal` 取消。

**HTTP 404、500 不会让 fetch reject。** 因为服务器确实返回了一份 HTTP 响应：

```js
const response = await fetch('/api/not-exist');
console.log(response.status); // 404

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}
```

`response.json()` 的解析错误也会进入 `catch`，所以不能把所有异常都当成网络错误。建议把错误拆成四类：

| 类型 | 示例 | 判断位置 |
| --- | --- | --- |
| 网络/传输错误 | 断网、连接失败、CORS 阻止 | `fetch` 的 reject |
| HTTP 错误 | 401、404、500 | `response.status` / `response.ok` |
| 业务错误 | HTTP 200，但 `{ code: 1001 }` 表示失败 | 响应体业务字段 |
| 解析错误 | 把 HTML 当 JSON 解析 | `response.json()` 的 reject |

### 4.8 Fetch 的边界

- 没有内置超时，需要 `AbortController`。
- 没有内置拦截器，需要自己封装。
- 没有标准的上传进度事件；需要上传进度通常用 XHR。
- 默认不因 4xx/5xx 抛错，必须检查 `ok`。
- 响应体只能读一次。
- 跨源携带 Cookie 需要 `credentials: 'include'`，服务端还要允许凭证。
- `keepalive` 有大小限制，不适合发送大请求体。

## 5. Axios API

### 5.1 定位与安装

Axios 是一个基于 Promise 的 HTTP 客户端，浏览器端通常走 XHR 适配器，Node.js 端走 `http`/`https` 适配器，也可以显式切到 Fetch 适配器。

```bash
npm install axios
```

```js
import axios from 'axios';
```

### 5.2 调用方式

```js
// 1. 传配置对象
const response = await axios({
  method: 'get',
  url: '/api/users',
  params: { page: 1 }
});

// 2. 传 URL 和配置
const response2 = await axios('/api/users', {
  method: 'get',
  params: { page: 1 }
});

// 3. 使用快捷方法
await axios.get('/api/users', { params: { page: 1 } });
await axios.post('/api/users', { name: '张三' });
await axios.put('/api/users/1', { name: '李四' });
await axios.patch('/api/users/1', { age: 21 });
await axios.delete('/api/users/1');
await axios.head('/api/users');
await axios.options('/api/users');

// 4. 创建带默认配置的实例
const http = axios.create({
  baseURL: '/api',
  timeout: 5000
});
```

快捷方法的参数位置不同：

| 方法 | 签名 |
| --- | --- |
| `get` / `delete` / `head` / `options` | `(url, config)` |
| `post` / `put` / `patch` | `(url, data, config)` |

`axios.all`、`axios.spread` 是旧 API，新代码优先使用 `Promise.all`。

### 5.3 请求配置

```js
const response = await http.post('/users', { name: '张三' }, {
  params: { notify: true },
  headers: { 'X-Trace-Id': 'abc' },
  timeout: 5000,
  withCredentials: true,
  responseType: 'json',
  validateStatus: status => status >= 200 && status < 300,
  signal: controller.signal,
  onUploadProgress: event => {},
  onDownloadProgress: event => {}
});
```

常用配置：

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `url` | 必填 | 请求地址；绝对 URL 会忽略 `baseURL` |
| `method` | `'get'` | HTTP 方法 |
| `baseURL` | `''` | 基础地址，和相对 `url` 拼接 |
| `params` | 无 | 查询参数对象，由 Axios 序列化 |
| `paramsSerializer` | 内置 | 自定义查询参数序列化 |
| `data` | 无 | 请求体；POST/PUT/PATCH 常用 |
| `headers` | 无 | 请求头 |
| `timeout` | `0` | 超时毫秒数，`0` 表示不主动设置 |
| `withCredentials` | `false` | 跨源是否携带 Cookie |
| `responseType` | `'json'` | `'json'`、`'text'`、`'blob'`、`'arraybuffer'`、`'document'`、`'stream'`（Node） |
| `validateStatus` | `status >= 200 && status < 300` | 决定哪些状态码进入成功分支 |
| `signal` | 无 | `AbortSignal`，用于取消 |
| `adapter` | `['xhr', 'http', 'fetch']` | 适配器候选顺序 |
| `onUploadProgress` | 无 | 上传进度回调，能力取决于适配器 |
| `onDownloadProgress` | 无 | 下载进度回调，能力取决于适配器 |
| `transformRequest` | 内置数组 | 发送前转换请求体 |
| `transformResponse` | 内置数组 | 收到响应后转换响应体 |
| `maxContentLength` | `-1` | 响应体最大字节数，`-1` 不限制 |
| `maxBodyLength` | `-1` | 请求体最大字节数，`-1` 不限制 |
| `auth` | 无 | `{ username, password }`，Basic Auth |
| `proxy` | 无 | Node.js 代理配置 |
| `decompress` | `true` | Node.js 是否自动解压 |
| `maxRedirects` | `21` | Node.js 最大重定向次数 |

几个关键区别：

- **`params` 拼到 URL 上，`data` 放进请求体。**
- **`baseURL` 只对相对 URL 生效**；`url` 是绝对地址时不会被拼接。
- **`validateStatus` 决定“什么算成功”**，不是 HTTP 协议本身的行为。
- **`transformRequest` / `transformResponse` 是数组**，按顺序执行。

Axios 通常会自动把普通对象序列化为 JSON，并设置 `Content-Type: application/json`：

```js
await axios.post('/api/users', {
  name: '张三',
  age: 20
});
```

但这不是“永远自动”：文本可能是字符串，文件可能是 `Blob`/`ArrayBuffer`，Node.js 流模式可能返回流，具体结果受 `responseType`、适配器和 `transformResponse` 影响。

### 5.4 响应对象与错误对象

成功时得到 `AxiosResponse`：

```js
{
  data,        // 转换后的响应体
  status,      // HTTP 状态码
  statusText,  // 状态描述
  headers,     // 响应头
  config,      // 本次请求的完整配置
  request      // 底层请求对象（浏览器通常是 XHR，Node.js 是 ClientRequest）
}
```

失败时得到 `AxiosError`：

```js
{
  message,
  name: 'AxiosError',
  code,
  config,
  request,
  response,    // 有响应时才有
  isAxiosError: true,
  toJSON()
}
```

```js
try {
  const response = await http.get('/users/1');
  console.log(response.data);
} catch (error) {
  if (!axios.isAxiosError(error)) throw error;

  if (error.response) {
    // 服务器返回了响应，但状态码不在 validateStatus 允许范围内
    console.error('HTTP 错误', error.response.status, error.response.data);
  } else if (error.request) {
    // 请求发出去了，但没有拿到响应
    console.error('没有收到响应', error.code);
  } else {
    // 请求配置阶段就出错了
    console.error('请求准备失败', error.message);
  }
}
```

常见错误码：

| `code` | 含义 |
| --- | --- |
| `ERR_NETWORK` | 网络错误 |
| `ECONNABORTED` | 请求被中止或超时 |
| `ETIMEDOUT` | 明确超时（需开启 `transitional.clarifyTimeoutError`） |
| `ERR_CANCELED` | 请求被取消 |
| `ERR_BAD_REQUEST` | 4xx 响应 |
| `ERR_BAD_RESPONSE` | 5xx 响应 |
| `ERR_INVALID_URL` | URL 非法 |
| `ERR_FR_TOO_MANY_REDIRECTS` | 重定向次数过多 |
| `ERR_DEPRECATED` | 使用了已弃用能力 |
| `ERR_NOT_SUPPORT` | 当前环境不支持该能力 |

**Axios 默认拒绝非 2xx 响应。** 如果希望 404 也进入成功分支：

```js
const response = await axios.get('/api/users/123', {
  validateStatus: status => {
    return (status >= 200 && status < 300) || status === 404;
  }
});
```

HTTP 200 里的 `{ code: 1001, message: '余额不足' }`，Axios 不会自动识别为业务失败，仍要按接口约定检查。

### 5.5 实例、默认值与拦截器

```js
const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    Accept: 'application/json'
  }
});

http.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  error => Promise.reject(error)
);

http.interceptors.response.use(
  response => response,
  error => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // 例如跳转登录，或触发 token 刷新
    }
    return Promise.reject(error);
  }
);
```

拦截器规则：

- 请求拦截器必须返回 `config`，否则后续拿不到配置。
- 响应拦截器必须返回 `response`，错误拦截器应继续 `reject`，否则错误会被吞掉。
- 请求拦截器**后注册的先执行**（LIFO）；响应拦截器**先注册的先执行**（FIFO）。

```js
axios.interceptors.request.use(config => {
  console.log('A');
  return config;
});
axios.interceptors.request.use(config => {
  console.log('B');
  return config;
});
// 请求时输出：B A

axios.interceptors.response.use(response => {
  console.log('C');
  return response;
});
axios.interceptors.response.use(response => {
  console.log('D');
  return response;
});
// 响应时输出：C D
```

移除拦截器：

```js
const id = http.interceptors.request.use(config => config);
http.interceptors.request.eject(id);
```

一个常见的 401 刷新 token 模式：

```js
let refreshPromise = null;

http.interceptors.response.use(
  response => response,
  async error => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const original = error.config;
    if (original._retry) return Promise.reject(error);
    original._retry = true;

    refreshPromise ??= refreshToken().finally(() => {
      refreshPromise = null;
    });

    await refreshPromise;
    return http(original);
  }
);
```

这里用 `_retry` 防止无限循环，用共享的 `refreshPromise` 防止并发 401 重复刷新。刷新失败时要把错误继续抛给调用方，并处理退出登录。

### 5.6 取消、超时与适配器

取消请求使用 `AbortController`：

```js
const controller = new AbortController();

const request = http.get('/users', {
  signal: controller.signal,
  timeout: 5000
});

// 用户点击取消
controller.abort();

try {
  await request;
} catch (error) {
  if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
    console.log('请求已取消');
  }
}
```

- `timeout` 是客户端等待上限，超时后通常得到 `ECONNABORTED`；开启 `transitional.clarifyTimeoutError` 后可能得到 `ETIMEDOUT`。
- `signal` 是更通用的取消机制，能区分“用户主动取消”和“超时”。
- `CancelToken` 已弃用，新代码不要再使用。
- 取消/超时都不保证服务端回滚已经完成的操作。

Axios 的适配器决定底层用什么发请求：

| 适配器 | 环境 | 底层 | 上传进度 | 流式响应 |
| --- | --- | --- | --- | --- |
| `xhr` | 浏览器 | `XMLHttpRequest` | 支持 | 不提供标准 `ReadableStream` |
| `fetch` | 浏览器/Node.js | Fetch API | 不支持（标准 Fetch 无上传进度） | 浏览器可用 `response.body` |
| `http` | Node.js | `http`/`https` | Node.js 流 | Node.js 流 |

Axios 1.x 默认按 `['xhr', 'http', 'fetch']` 选择当前环境可用的适配器。浏览器通常选 `xhr`，Node.js 通常选 `http`。可以显式指定：

```js
const http = axios.create({
  adapter: 'fetch'
});
```

也可以传入自定义适配器函数。适配器的职责是接收配置并返回一个类似响应的对象：

```js
const myAdapter = config => {
  return new Promise((resolve, reject) => {
    // 用任意底层能力发请求
    resolve({
      data,
      status,
      statusText,
      headers,
      config,
      request
    });
  });
};
```

**Axios 的很多“特性”其实是适配器的特性。** 例如上传进度在 `xhr` 适配器下可用，在 `fetch` 适配器下不可用；Node.js 的流式响应依赖 `http` 适配器。

## 6. 三者能力对照

### 6.1 同一任务的 API 映射

| 任务 | XHR | Fetch | Axios |
| --- | --- | --- | --- |
| 创建请求 | `new XMLHttpRequest()` + `open()` | `fetch(url, init)` | `axios(config)` / `axios.get()` |
| 查询参数 | 手拼字符串或 `URLSearchParams` | `URLSearchParams` | `params` |
| 设置请求头 | `setRequestHeader()` | `headers` | `headers` |
| 发送 JSON | `JSON.stringify` + 手动设 `Content-Type` | 同左 | 普通对象通常自动转换 |
| 发送 FormData | `send(form)` | `body: form` | `data: form` |
| 读取 JSON | `responseType = 'json'` + `response` | `await response.json()` | `response.data` |
| 读取文本 | `responseText` | `await response.text()` | `response.data` |
| 读取二进制 | `responseType = 'blob'/'arraybuffer'` | `blob()` / `arrayBuffer()` | `responseType: 'blob'/'arraybuffer'` |
| 判断 HTTP 成功 | 检查 `status` | 检查 `response.ok` | 默认非 2xx 进入 `catch` |
| 网络错误 | `onerror` | `catch` | `catch` + `error.request` |
| 超时 | `timeout` + `ontimeout` | `AbortController` / `AbortSignal.timeout()` | `timeout` / `signal` |
| 取消 | `abort()` | `AbortController` | `AbortController` + `signal` |
| 上传进度 | `xhr.upload.onprogress` | 无标准方案 | `onUploadProgress`（通常需 `xhr` 适配器） |
| 下载进度 | `xhr.onprogress` | 读取 `response.body` | `onDownloadProgress`（取决于适配器） |
| 跨源 Cookie | `withCredentials` | `credentials: 'include'` | `withCredentials` |
| 拦截器 | 无 | 无 | `interceptors` |
| 流式响应 | 无标准 `ReadableStream` | `response.body` | `fetch` 适配器 + 流式响应 |
| Node.js 支持 | 需兼容实现 | 原生支持 | `http` 适配器原生支持 |

### 6.2 能力对比

| 对比项 | XHR | Fetch | Axios |
| --- | --- | --- | --- |
| 是否原生 | 是 | 是 | 否，需要安装 |
| 编程模型 | 对象 + 事件 + 回调 | Promise + `async/await` | Promise + `async/await` |
| 查询参数 | 手动 | 手动，常用 `URLSearchParams` | 内置 `params` |
| JSON 转换 | 手动或 `responseType` | 手动序列化/解析 | 常见 JSON 自动处理 |
| HTTP 错误 | 自行检查 `status` | 默认不 reject | 默认 reject |
| 超时 | 内置 `timeout` | 需 `AbortController` | 内置 `timeout` |
| 取消 | `abort()` | `AbortController` | `AbortController` |
| 拦截器 | 无 | 无 | 内置 |
| 上传进度 | 原生支持 | 无标准方案 | 取决于适配器 |
| 下载进度 | 原生支持 | 读流自行统计 | 取决于适配器 |
| 响应体流 | 无标准流模型 | 原生 `ReadableStream` | 取决于适配器 |
| 额外体积 | 无 | 无 | 有 |
| 适合场景 | 老项目、上传进度、底层控制 | 轻量、现代、流式读取 | 中大型业务、统一请求层 |

一个常见误区是认为“Fetch 更现代，所以一定更快”。**API 新不等于请求快。** 耗时主要来自网络、服务端处理、响应大小、缓存和连接复用。

## 7. 手写一个最小 Axios 风格封装

理解三者关系的最好方式是看 Axios 的核心思路如何用 Fetch 实现：

```js
function createHttp({ baseURL = '', timeout = 5000, headers: defaultHeaders = {} } = {}) {
  const requestInterceptors = [];
  const responseInterceptors = [];

  async function request({ url, method = 'GET', params, data, headers, signal, withCredentials } = {}) {
    let config = {
      url,
      method,
      params,
      data,
      headers: { ...defaultHeaders, ...headers },
      signal,
      withCredentials
    };

    for (const interceptor of requestInterceptors) {
      config = (await interceptor(config)) ?? config;
    }

    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(config.params ?? {})) {
      if (value == null) continue;
      if (Array.isArray(value)) {
        value.forEach(item => query.append(key, String(item)));
      } else {
        query.append(key, String(value));
      }
    }

    const base = baseURL.replace(/\/$/, '');
    const path = config.url.replace(/^\//, '');
    const fullURL = /^https?:\/\//.test(config.url) ? config.url : `${base}/${path}`;
    const queryString = query.toString();
    const finalURL = queryString
      ? `${fullURL}${fullURL.includes('?') ? '&' : '?'}${queryString}`
      : fullURL;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeout ?? timeout);
    const onAbort = () => controller.abort();

    if (config.signal?.aborted) {
      controller.abort();
    } else {
      config.signal?.addEventListener('abort', onAbort, { once: true });
    }

    try {
      const isPlainObject = config.data != null
        && Object.getPrototypeOf(config.data) === Object.prototype;

      const response = await fetch(finalURL, {
        method: config.method,
        headers: isPlainObject
          ? { 'Content-Type': 'application/json', ...config.headers }
          : config.headers,
        body: config.data == null
          ? undefined
          : isPlainObject
            ? JSON.stringify(config.data)
            : config.data,
        credentials: config.withCredentials ? 'include' : 'same-origin',
        signal: controller.signal
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status} ${response.statusText}`);
        error.response = response;
        throw error;
      }

      let result = {
        data: await response.json(),
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };

      for (const interceptor of responseInterceptors) {
        result = (await interceptor(result)) ?? result;
      }

      return result;
    } finally {
      clearTimeout(timer);
      config.signal?.removeEventListener('abort', onAbort);
    }
  }

  return {
    request,
    get: (url, config = {}) => request({ ...config, url, method: 'GET' }),
    post: (url, data, config = {}) => request({ ...config, url, method: 'POST', data }),
    interceptors: {
      request: { use: fn => requestInterceptors.push(fn) },
      response: { use: fn => responseInterceptors.push(fn) }
    }
  };
}
```

这个封装演示了 Axios 的核心链路：

```text
合并配置
  → 执行请求拦截器
  → 适配器（这里是 fetch）发请求
  → 转换响应
  → 执行响应拦截器
  → 返回统一结果
```

它仍然是简化版：没有处理空响应体、非 JSON 响应、`204`、二进制、`FormData` 的默认头、错误模型、取消原因、重试等。生产项目要么继续完善封装，要么直接用 Axios。

## 8. 选型与常见坑

### 8.1 怎么选

| 场景 | 建议 |
| --- | --- |
| 少量简单请求，想减少依赖 | Fetch |
| 需要兼容老浏览器或维护老代码 | XHR / 现有封装 |
| 浏览器文件上传进度条 | XHR，或 Axios + `xhr` 适配器 |
| 大量 CRUD、统一鉴权与错误处理 | Axios 或成熟的 Fetch 封装 |
| AI 流式输出、逐块读取文本 | Fetch |
| Node.js 脚本或服务端请求 | Axios（`http` 适配器）、原生 Fetch 或 undici |
| 已经稳定的请求层 | 优先复用，不为“更新”而替换 |

### 8.2 常见坑

4. **Fetch 不因 404/500 reject。** 必须检查 `response.ok` 或 `status`。
5. **响应体只能消费一次。** 需要两份内容先 `clone()`。
6. **XHR 的 `readyState === 4` 和 `onload` 都不代表成功。** 仍然要检查 `status`。
7. **`responseType` 要在 `send()` 前设置。** 设成 `blob`/`arraybuffer` 后不能读 `responseText`。
8. **Axios 默认拒绝非 2xx。** 4xx/5xx 会进入 `catch`；需要放行时用 `validateStatus`。
9. **拦截器必须返回值。** 请求拦截器返回 `config`，响应拦截器返回 `response`，错误拦截器继续 `reject`。
10. **超时和取消不等于服务端停止。** `Promise.race` 不会取消底层请求；`AbortController` 中止的是客户端请求。
11. **跨源 Cookie 需要两边配合。** 客户端开 `withCredentials` / `credentials: 'include'`，服务端还要返回允许凭证的 CORS 头；Axios 不能绕过 CORS。
12. **`FormData` 不要手写 `Content-Type`。** 浏览器需要生成 `boundary`。
13. **上传进度依赖底层实现。** Fetch 没有标准上传进度；Axios 的 `onUploadProgress` 在 `fetch` 适配器下不可用。
14. **`no-cors` 不是跨域读接口的方案。** 得到的是 opaque response，JavaScript 读不到正常内容。
15. **HTTP 200 不代表业务成功。** 业务错误码仍要按接口约定检查。

## 9. 参考资料与关联笔记

官方资料：

- [MDN：XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
- [MDN：Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN：Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [MDN：Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
- [MDN：Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
- [MDN：Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers)
- [MDN：AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN：CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Axios：请求配置](https://axios-http.com/docs/req_config)
- [Axios：响应结构](https://axios-http.com/docs/res_schema)
- [Axios：拦截器](https://axios-http.com/docs/interceptors)
- [Axios：取消请求](https://axios-http.com/docs/cancellation)
- [Axios：适配器源码](https://github.com/axios/axios/tree/v1.x/lib/adapters)

仓库关联笔记：

- [XHR readyState 与响应状态码](/frontend/network/xhr-states-status)
- [Axios / Fetch / SSE 与 MCP](/frontend/network/http-streaming)
- [跨域 (CORS)](/frontend/network/cors)
- [文件上传](/frontend/network/file-upload)
- [HTTP 基础](/frontend/network/http)
