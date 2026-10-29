# HTTP 请求与流式通信：Axios、XHR、Fetch、SSE 与 Streamable HTTP

> 核心区别：XHR、Fetch 是原生请求 API；Axios 是上层 HTTP 客户端库；SSE 是服务端事件流机制；Streamable HTTP 是 MCP 基于 HTTP 的传输方案。它们并不处于同一个层级。

本文整理 Axios、XHR、Fetch 的关系、优缺点与代码示例，并串联 HTTP 流式响应、SSE 和 MCP Streamable HTTP 的概念。

## 1. 先区分概念层级

| 概念 | 定位 | 主要解决的问题 |
| --- | --- | --- |
| HTTP | 应用层协议 | 请求、响应、状态码、头部与消息体如何传输 |
| XMLHttpRequest（XHR） | 浏览器原生 API | 用对象和事件发起请求、控制请求过程 |
| Fetch API | 现代原生 API | 用 Promise 和 Request / Response 处理请求及响应流 |
| Axios | 第三方 HTTP 客户端库 | 统一配置、拦截器、数据转换、错误与超时处理 |
| SSE（Server-Sent Events） | 基于 HTTP 的服务端事件流机制 | 在一个响应中持续发送事件 |
| JSON-RPC | 远程调用消息协议 | 表达方法、参数、请求编号、结果与错误 |
| MCP（Model Context Protocol） | AI 应用连接工具、资源等服务的协议 | 定义工具调用、资源读取及能力交互 |
| Streamable HTTP | MCP 的 HTTP 传输方案 | 规定 MCP 消息如何通过 HTTP 与可选 SSE 传递 |

请求客户端之间的关系：

```text
业务代码
  ├── XMLHttpRequest ──────────────→ 浏览器网络实现
  ├── fetch() ────────────────────→ 浏览器网络实现
  └── Axios → Adapter（适配器）
                ├── xhr   → XMLHttpRequest
                ├── fetch → Fetch API
                └── http  → Node.js HTTP/HTTPS 模块
```

**Fetch 不是简单地用 Promise 包装 XHR。** 它是独立的标准 API，有自己的 Request、Response、Headers 和流式响应模型。

现代 Axios 支持 Fetch 适配器，因此“Axios 在浏览器里一定使用 XHR”不准确。当前 Axios 1.x 默认适配器候选顺序为：

```javascript
['xhr', 'http', 'fetch']
```

按顺序选择当前环境可用的适配器。普通浏览器通常优先使用 XHR，Node.js 通常使用 HTTP 适配器，也可以显式指定：

```javascript
import axios from 'axios';

const client = axios.create({
  adapter: 'fetch'
});
```

具体行为取决于 Axios 版本、构建方式、运行环境与配置。

**AJAX 是异步请求、局部更新页面的交互方式，不是某个具体 API。** XHR、Fetch 和 Axios 都可以实现 AJAX。

## 2. XHR、Fetch、Axios 的能力对照

以下以浏览器环境为主，Axios 的部分能力随适配器变化。

| 对比项 | XHR | Fetch | Axios |
| --- | --- | --- | --- |
| 是否需要安装 | 不需要 | 不需要 | 通常需要 |
| 编程模型 | 对象、事件、回调 | 原生 Promise | Promise |
| async/await | 需要包装为 Promise | 直接支持 | 直接支持 |
| 查询参数 | 手动构造 | 常用 URLSearchParams | 提供 params |
| 发送 JSON | 手动序列化、设置请求头 | 手动序列化、设置请求头 | 普通对象通常自动转换 |
| 解析 JSON | 可设置 responseType | 调用 response.json() | 常见 JSON 响应自动转换 |
| HTTP 4xx / 5xx | 自行检查 status | 默认不 reject | 默认 reject |
| 超时 | xhr.timeout | AbortSignal 等机制 | timeout 配置 |
| 取消 | xhr.abort() | AbortController | AbortController |
| 拦截器 | 无内置 | 无内置 | 内置 |
| 上传进度 | 原生 upload 事件 | 无 XHR 式标准上传进度事件 | 回调支持取决于适配器 |
| 下载进度 | 原生 progress 事件 | 读取流并自行统计 | 回调支持取决于适配器 |
| 浏览器响应体流 | 不提供标准 ReadableStream | 原生支持 | Fetch 适配器可支持 |
| 额外包体积 | 无 | 无 | 有 |

### 2.1 XHR 示例与 readyState

XHR 的流程是：创建对象 → open 配置 → 注册事件 → send 发送。

```javascript
const params = new URLSearchParams({
  page: '1',
  keyword: '张三'
});

const xhr = new XMLHttpRequest();
xhr.open('GET', `/api/users?${params}`);
xhr.responseType = 'json';
xhr.timeout = 5000;

xhr.onload = () => {
  if (xhr.status >= 200 && xhr.status < 300) {
    console.log(xhr.response);
  } else {
    console.error('HTTP 错误', xhr.status, xhr.response);
  }
};

xhr.onerror = () => console.error('网络错误');
xhr.ontimeout = () => console.error('请求超时');
xhr.onabort = () => console.log('请求已取消');
xhr.send();
```

注意：

- open 只配置请求，send 才开始发送。
- 设置请求头要在 open 之后、send 之前。
- onload 不代表 HTTP 成功，404、500 也可能触发。
- responseType 为 json 时，从 xhr.response 读取。
- JSON 解析失败可能得到 null，而不是 JSON.parse 式语法异常。

| readyState | 状态 | 含义 |
| --- | --- | --- |
| 0 | UNSENT | 尚未调用 open |
| 1 | OPENED | 已调用 open |
| 2 | HEADERS_RECEIVED | 已收到响应头 |
| 3 | LOADING | 正在接收响应体 |
| 4 | DONE | 请求结束，仍需检查结果 |

**readyState === 4 表示结束，不表示成功。**

### 2.2 Fetch 示例

```javascript
async function getUsers() {
  const params = new URLSearchParams({
    page: '1',
    keyword: '张三'
  });

  const response = await fetch(`/api/users?${params}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
}
```

Fetch 原生支持 async/await，但需要明确处理查询参数、HTTP 状态与响应体解析。

### 2.3 Axios 示例

```javascript
import axios from 'axios';

async function getUsers() {
  const response = await axios.get('/api/users', {
    params: { page: 1, keyword: '张三' },
    timeout: 5000
  });

  return response.data;
}
```

Axios 的便利主要体现在可重复使用的配置与数据处理，而不是提供一种新网络协议。

## 3. JSON 请求与响应对象

### 3.1 Fetch 发送 JSON

```javascript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: '张三', age: 20 })
});

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}

const user = await response.json();
```

JSON.stringify 把对象转换为 JSON 字符串；Content-Type 告诉服务器请求体格式。不能直接把普通对象放进 body，并期待 Fetch 自动序列化为 JSON。

### 3.2 Axios 的默认 JSON 转换

```javascript
const response = await axios.post('/api/users', {
  name: '张三',
  age: 20
});

console.log(response.data);
```

Axios 通常自动转换普通对象请求和常见 JSON 响应，但不是永远返回对象：文本可能是字符串，文件可以是 Blob / ArrayBuffer，流模式可以返回流，转换行为也可以修改。某些默认兼容配置下，非法 JSON 可能保留为字符串而不是直接报错。

### 3.3 Fetch 为什么经常有两个 await？

```javascript
const response = await fetch('/api/users');
const data = await response.json();
```

两个阶段不同：

```text
发送请求
  ↓
收到响应状态与响应头
  ↓
fetch() 的 Promise fulfilled
  ↓
继续读取响应体
  ↓
json() 读取完成并解析
```

所以 await fetch 不保证响应体已经完整下载；读取响应体时仍可能发生异常。

Fetch 的 Response 包含 status、headers 和待消费的响应体；Axios 普通 JSON 模式通常在读取与转换完成后提供 response.data。Axios 响应一般还包含 status、headers、config、request 等字段。

### 3.4 响应体通常只能消费一次

```javascript
const response = await fetch('/api/users');
const data = await response.json();

// 会失败：响应体已消费
// const text = await response.text();
```

需要两份内容时，应在读取前 clone：

```javascript
const response = await fetch('/api/users');
const copy = response.clone();

const data = await response.json();
const text = await copy.text();
```

大响应复制且两份消费速度不一致，可能产生额外缓冲与内存占用，不应随意 clone。

## 4. 网络、HTTP、业务与解析错误

| 类型 | 示例 | 判断位置 |
| --- | --- | --- |
| 网络 / 传输错误 | 断网、连接失败、浏览器因 CORS 阻止读取 | 请求异常 |
| HTTP 错误 | 401、404、500 | HTTP 状态码 |
| 业务错误 | HTTP 200，但 code 表示失败 | 接口业务字段 |
| 解析错误 | 将 HTML 当成 JSON 解析 | 响应体读取或转换 |

### 4.1 Fetch 不会仅因 404、500 而 reject

服务器返回 404 仍是一份有效 HTTP 响应，因此：

```javascript
const response = await fetch('/api/not-exist');
console.log(response.status); // 可能为 404

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}
```

response.ok 表示状态码是否在 200–299 范围。catch 中也可能收到 response.json 的解析错误，不能将所有异常都称为网络错误。

### 4.2 Axios 默认拒绝非 2xx 响应

```javascript
try {
  await axios.get('/api/users');
} catch (error) {
  if (!axios.isAxiosError(error)) throw error;

  if (error.response) {
    console.error('HTTP 错误', error.response.status);
  } else if (error.request) {
    console.error('未取得可用响应');
  } else {
    console.error('请求准备过程出错', error.message);
  }
}
```

默认判断相当于：

```javascript
validateStatus: status => status >= 200 && status < 300
```

可允许特定状态进入成功分支：

```javascript
const response = await axios.get('/api/users/123', {
  validateStatus: status => {
    return (status >= 200 && status < 300) || status === 404;
  }
});
```

HTTP 200 中的 `{ code: 1001, message: '余额不足' }`，Fetch 和 Axios 都不会自动识别为业务失败，需要按接口约定检查。

## 5. 超时、取消与请求层封装

### 5.1 XHR 原生超时和取消

```javascript
xhr.timeout = 5000;
xhr.ontimeout = () => console.log('超时');

// 用户取消时调用
xhr.abort();
```

### 5.2 Fetch 用 AbortController 实现超时

原生 Fetch 不支持通过 timeout: 5000 直接配置超时。兼容性较广的实现：

```javascript
async function getUsers() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('/api/users', {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // 等响应体读取完成后再清除计时器
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
```

现代环境也可使用 AbortSignal.timeout(5000)，但需要核实兼容性。

**Promise.race 只让等待提前结束，不会自动取消底层请求。** 真正中止 Fetch 需要 AbortSignal。

### 5.3 Axios 支持 timeout 与 signal

```javascript
const controller = new AbortController();

const request = axios.get('/api/users', {
  timeout: 5000,
  signal: controller.signal
});

// 点击取消等场景调用：controller.abort()
```

- timeout 默认为 0，即不主动设置该超时。
- 超时覆盖范围与错误表现受适配器影响，不宜简单视为统一的全流程总时限。
- 新代码优先使用 AbortController，CancelToken 已弃用。
- **客户端取消不等于服务器回滚已经完成的操作。** MCP 对断流取消有版本规定，见第 9 节。

### 5.4 Axios 实例与拦截器

```javascript
const http = axios.create({
  baseURL: '/api',
  timeout: 10000
});

http.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

http.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.log('登录状态已失效');
    }

    return Promise.reject(error);
  }
);
```

请求拦截器应返回 config；错误拦截器应抛出或继续拒绝错误，否则可能吞掉错误、使后续成功分支收到 undefined。也要避免反复注册拦截器。

Fetch 可以通过包装函数实现统一配置、鉴权和错误处理，区别是 Axios 已内置，而不是 Fetch 做不到。

## 6. 上传进度、Cookie 与跨域

### 6.1 浏览器上传进度通常选 XHR

```javascript
async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);

  return axios.post('/api/upload', form, {
    adapter: 'xhr',
    onUploadProgress(event) {
      if (event.total) {
        const percent = Math.round(event.loaded / event.total * 100);
        console.log(`上传进度：${percent}%`);
      }
    }
  });
}
```

XHR 原生提供 xhr.upload.onprogress；Fetch 没有相同的标准上传进度事件。上传流方案具有环境限制，统计流读取字节也不一定等于实际网络发送进度。Axios 的进度能力取决于适配器与环境。

注意：

- 浏览器发送 FormData 时，不要手动写死 multipart Content-Type，由浏览器生成包含 boundary 的值。
- 总大小不一定可计算，不应假定 event.total 始终存在。
- 上传 100% 不代表服务器完成保存、转码或业务处理。

### 6.2 Cookie 与凭证配置

| 客户端 | 浏览器跨源携带 Cookie 的常见配置 |
| --- | --- |
| XHR | xhr.withCredentials = true |
| Fetch | credentials: 'include' |
| Axios | withCredentials: true |

同源请求默认可携带符合条件的 Cookie。即便开启跨源凭证，Cookie 仍受 Domain、Path、Secure、SameSite 和第三方 Cookie 策略约束。

**跨源不等于跨站；Bearer Authorization 也不等于 Cookie 凭证。** 手动设置 Bearer Token 不意味着必须开启 withCredentials。

### 6.3 Axios 不能绕过 CORS

浏览器中的 Axios、XHR、Fetch 都受 CORS 约束。跨源携带 Cookie 时，服务端通常需要：

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

此时允许的 Origin 不能简单写为星号。

mode: 'no-cors' 通常产生 opaque response，JavaScript 无法读取正常接口内容，不是解决 JSON 接口跨域的办法。Node.js 不受浏览器 CORS 读取策略限制，是环境差异，不是 Axios 特有能力。

## 7. HTTP 流式响应与 Fetch 读取

HTTP 可以一次性返回结果，也可以在一个响应体中持续发送内容：

```text
一次请求
  ↓
发送响应头
  ↓
发送消息 1 → 客户端处理
  ↓
发送消息 2 → 客户端处理
  ↓
发送最终结果
  ↓
响应结束
```

**不是多份 HTTP 响应，而是一个响应体持续传输。** HTTP/1.1 可用分块传输编码；HTTP/2、HTTP/3 有各自的帧机制。应用消息边界不能依赖网络分块边界。

### 7.1 Fetch 读取文本流

```javascript
async function readStream() {
  const response = await fetch('/api/stream');

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  if (!response.body) {
    throw new Error('响应体不可用');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      console.log(decoder.decode(value, { stream: true }));
    }

    const rest = decoder.decode();
    if (rest) console.log(rest);
  } finally {
    reader.releaseLock();
  }
}
```

stream: true 可处理 UTF-8 字符跨多个字节块；末尾 decode() 输出剩余内容。releaseLock 释放读取锁，不等于主动取消请求。

### 7.2 chunk 不等于完整事件

```text
chunk 1：data: {"jsonrpc":
chunk 2："2.0","id":1,...
chunk 3：}\n\n
```

也可能一个 chunk 包含多条事件。不能直接对每个 value 调用 JSON.parse。

正确分层：

```text
网络字节流
  ↓ UTF-8 解码
文本块
  ↓ 缓冲、识别 SSE / NDJSON 边界
完整消息
  ↓ JSON.parse
对象
  ↓ 协议与业务处理
结果、进度、错误
```

处理 AI 流式回复、SSE、NDJSON 时需要相应解析器。反向代理缓冲也可能让服务端已经发送的内容无法及时到达客户端。

XHR 某些文本场景可增量读取 responseText，但没有 Fetch 的标准 ReadableStream 响应体模型。现代 Axios 也可在支持的环境中使用：

```javascript
const response = await axios.get('/api/stream', {
  adapter: 'fetch',
  responseType: 'stream'
});

const stream = response.data;
```

## 8. SSE 是什么？与 EventSource、WebSocket 的区别

SSE 即 Server-Sent Events，让服务器在 HTTP 响应中持续发送事件，常见 Content-Type 为 text/event-stream。

```text
客户端发起请求
  ↓
响应保持打开
  ↓
服务器逐条发送事件
```

事件格式：

```text
event: progress
data: {"percent":50}

event: complete
data: {"result":"完成"}

```

最后一条事件也需要以空行结束。

- event：事件类型，可选，默认 message。
- data：事件数据，可为普通文本，也可放 JSON；多条 data 行组合成一个事件的数据。
- 空行：事件边界。
- id、retry：可用于事件标识及重连相关行为，但上层协议是否使用需另行确认。
- 以冒号开头的行是注释，可作为心跳，解析器应忽略。

**SSE 不规定数据必须是 JSON，也不规定必须是 MCP。**

### 8.1 SSE 不等于 EventSource

浏览器原生 EventSource 主要通过 GET 建立流：

```javascript
const source = new EventSource('/events');

source.onmessage = event => {
  console.log(event.data);
};

source.addEventListener('progress', event => {
  console.log(JSON.parse(event.data));
});

// 不再需要时调用 source.close()
```

原生 EventSource 不能直接配置成任意 POST，也不提供任意自定义请求头的通用配置。**但服务器完全可以让 POST 的响应体使用 SSE 格式**，由 Fetch 或 SDK 读取。

### 8.2 与 WebSocket 对照

| 对比项 | SSE | WebSocket |
| --- | --- | --- |
| 模型 | HTTP 响应中的事件流 | 建立连接后发送消息帧 |
| 数据方向 | 服务端 → 客户端 | 双向 |
| 客户端发送其他业务消息 | 另发 HTTP 请求等方式 | 同一连接发送 |
| 数据表现 | 文本事件格式 | 可传文本或二进制消息 |
| 常见场景 | 通知、日志、进度、流式输出 | 聊天、游戏、实时协作 |

SSE 技术与“采用 SSE 的应用协议”要分开判断，不能将 EventSource 的所有默认行为直接套到 MCP 上。

## 9. Streamable HTTP 与 SSE 的关系

如果在 MCP 配置中看到 Streamable HTTP，它通常指 **MCP 的一种 HTTP 传输方案**，不是新的浏览器请求 API。

核心组成：

```text
HTTP 传输基础
  + JSON-RPC 消息格式
  + 可选 SSE 流式响应
  + MCP 的消息与交互规则
```

服务端通常暴露一个 MCP 端点，例如 https://example.com/mcp。

客户端 POST 消息，服务端可选择：

```text
POST /mcp
  ├── application/json → 一条 JSON-RPC 最终响应
  └── text/event-stream → SSE 通知与最终响应
```

客户端通常声明：

```http
Accept: application/json, text/event-stream
```

**Streamable 表示支持流式，不表示每次必须流式。**

### 9.1 同一请求通过 SSE 接收消息

```text
MCP 客户端                          MCP 服务端
    │ POST /mcp：调用工具                │
    ├──────────────────────────────────→│
    │ HTTP 响应：text/event-stream       │
    │←──────────────────────────────────┤
    │ SSE：请求相关日志或进度             │
    │←──────────────────────────────────┤
    │ SSE：最终 JSON-RPC 响应            │
    │←──────────────────────────────────┤
    │ 响应结束                           │
```

SSE 的 data 中装的是 JSON-RPC 消息，例如：

```text
event: message
data: {"jsonrpc":"2.0","method":"notifications/message","params":{"level":"info","data":"开始执行"}}

event: message
data: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"执行完成"}]}}

```

这里是消息流示意，不是完整客户端。流式传输不保证工具结果逐字输出，也可能只在最后提供完整结果。

两者关系：

- **SSE 解决消息如何逐条传来。**
- **Streamable HTTP 解决 MCP 如何完整地通过 HTTP 通信。**
- 使用 SSE 不代表使用 Streamable HTTP，普通通知服务也能用 SSE。
- 使用 Streamable HTTP 不代表每次使用 SSE，也可直接返回 JSON。
- Streamable HTTP 可以实现协议层双向交互，但不是一条 WebSocket 式全双工连接。

### 9.2 为什么说从 SSE 换成 Streamable HTTP？

这里的 SSE 通常是 **MCP 旧版 HTTP+SSE 传输方案的简称**，不是 SSE 技术本身。

旧方案典型结构：

```text
GET /sse       → 长期接收服务端消息
POST /messages → 向服务端发送消息
```

Streamable HTTP 从 2025-03-26 引入，替换旧架构，核心改为统一 MCP 端点，POST 可以直接获得 JSON 或 SSE 响应。

因此“替代 SSE 传输”更准确地说是：**替代旧的 HTTP+SSE 通信架构，仍然可以使用 SSE。**

### 9.3 协议版本差异不可忽略

同名 Streamable HTTP 在不同 MCP 版本中有不同规则。以下整理本次会话查阅的官方规范，而非假定所有 SDK 已支持新版。

| 机制 | 2025 年的 Streamable HTTP 各版本 | 2026-07-28 版本 |
| --- | --- | --- |
| POST 返回 JSON 或 SSE | 支持 | 支持 |
| 独立 GET SSE 通道 | 可选 | 移除 |
| Mcp-Session-Id 协议会话 | 可选 | 移除 |
| Last-Event-ID 流恢复 | 可选支持 | 不支持 |
| SSE 断开是否表示取消 | 不应自动解释为取消 | 必须视为取消该请求 |
| 长期变更通知 | 可用独立 SSE 通道 | subscriptions/listen 响应流 |

2026-07-28 版还采用逐请求元信息及对应请求头；服务端需要客户端输入时，使用 Multi Round-Trip Requests（MRTR），而非在 SSE 流中发送独立 JSON-RPC 请求。

所以旧教程中的 initialize、Mcp-Session-Id、GET 通道、Last-Event-ID 与显式取消通知，不能直接套到每个版本。

**实际接入要核对服务端和 SDK 支持的协议版本，并使用相应 SDK。** HTTP 状态成功也不代表 JSON-RPC 成功，需要检查消息里的 error；只读取 response.body 不是实现了完整 MCP 客户端。

## 10. 优缺点与选型总结

### 10.1 三种请求客户端的取舍

**XHR**

- 优点：原生无依赖；上传与下载进度事件直接；内置超时和取消。
- 缺点：事件式代码较繁琐；统一参数和错误处理需要封装；不适合标准流式响应体消费。
- 适用：老项目、原生上传进度、自定义底层能力。

**Fetch**

- 优点：原生无依赖；Promise 与 async/await 自然；标准请求响应对象；流式读取方便。
- 缺点：HTTP 错误、JSON、超时等需要明确处理；无内置业务拦截器；上传进度不如 XHR 直接。
- 适用：轻量项目、现代原生请求、AI 流式输出、已有统一封装的项目。

**Axios**

- 优点：常见业务请求简洁；实例、拦截器和默认配置成熟；参数与 JSON 转换方便；支持多适配器。
- 缺点：增加依赖和体积；需理解默认行为与适配器差异；拦截器使用不当会吞错或重复执行。
- 适用：接口较多、统一鉴权和错误处理、中大型业务项目。

### 10.2 场景决策表

| 场景 | 常见选择 |
| --- | --- |
| 少量简单请求，减少依赖 | Fetch |
| 大量 CRUD、统一 Token 与业务错误 | Axios 或成熟 Fetch 封装 |
| 浏览器文件上传进度条 | Axios + XHR 或直接 XHR |
| AI 流式回复、逐块读取文本 | Fetch，或 Axios Fetch 适配器 |
| MCP 远程工具 / 资源服务 | 与目标版本兼容的 MCP SDK |
| 维护稳定的既有请求层 | 优先复用，不为“更新”而替换 |

API 更新不等于请求天然更快。网络、服务端处理、响应大小、缓存与连接复用通常更影响耗时。

### 10.3 常见误区速记

1. Axios 是库，XHR / Fetch 是原生 API，不是三个同级标准。
2. Fetch 不因 HTTP 404 / 500 自动 reject，需检查 ok。
3. HTTP 200 不保证业务成功，也不保证 JSON-RPC 成功。
4. await fetch 不等于响应体读取完成。
5. Promise.race 超时不等于取消请求。
6. chunk 不等于 SSE 事件，不可逐块直接 JSON.parse。
7. 上传 100% 不等于服务端处理完成。
8. Axios 不能绕过浏览器 CORS，no-cors 也不是接口跨域解法。
9. SSE 不等于 EventSource，POST 响应也可以采用 SSE。
10. Streamable HTTP 可以不用 SSE；它替换的是旧 MCP HTTP+SSE 架构。
11. 断流、会话和重连行为必须按 MCP 版本判断。

## 11. 参考资料与关联笔记

官方资料：

- [MDN：XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
- [MDN：Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [MDN：Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [Axios：请求配置](https://axios-http.com/docs/req_config)
- [Axios：1.x 默认配置源码](https://github.com/axios/axios/blob/v1.x/lib/defaults/index.js)
- [MCP：2025-06-18 传输规范](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)
- [MCP：2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)

仓库关联笔记：

- [XHR readyState 与响应状态码](./readyState&响应状态码.md)
- [跨域与 CORS](./跨域.md)
- [文件上传](./文件上传.md)
- [WebSocket](./websocket.md)
- [RESTful 与 RPC](./RESTful与RPC.md)
