# 浏览器 Web API 核心知识

## 1. 核心定义：什么是 Web API？

在浏览器（W3C）语境下，**Web API 是宿主环境（浏览器）提供给 JavaScript 的接口能力**。

它允许 JS 代码与 **浏览器窗口、文档、网络、甚至底层操作系统硬件** 进行交互。

> - **100分回答：** “是浏览器通过 C++ 绑定暴露给 JS 的能力接口，弥补了 JS 作为脚本语言无法直接操作 DOM、硬件和网络的缺陷。”

## 2. 关键概念边界：ECMAScript vs Web API

| 维度       | ECMAScript (JavaScript 引擎)               | Web API (浏览器宿主环境)                     |
| ---------- | ------------------------------------------ | -------------------------------------------- |
| **职责**   | 定义语言标准、语法、逻辑、数据结构。       | 提供操作浏览器和系统的具体能力。             |
| **执行者** | V8, SpiderMonkey, JavaScriptCore 等引擎。  | Browser Core (Blink, WebKit) 的 C++ 模块。   |
| **举例**   | `const`, `Array.map`, `if/else`, `Promise` | `DOM`, `fetch`, `setTimeout`, `localStorage` |

> **面试高频考点：**
> **问：** `setTimeout` 是 JavaScript 的语法吗？

> **答：** **不是。** `setTimeout` 是浏览器 `window` 对象提供的 Web API。JS 引擎本身（如 V8）没有定时器功能，它只是将回调交给浏览器的 Timer 模块，到期后由 Event Loop 塞回 JS 执行栈。

## 3. Web API 的核心版图 (分类)

MDN 上包含数千个 API，按功能分层理解：

### A. 基础交互层 (DOM & BOM)

这是前端开发最“古老”也最核心的两个地基：

#### 1. DOM (Document Object Model) - 页面操纵者

- **定义**：把整个 HTML 页面映射为一个树形结构（DOM Tree），让 JS 可以“增删改查”网页内容。
- **核心对象**：`document`
- **主要 API**：
  - **查**：`querySelector`, `getElementById`
  - **改**：`innerHTML`, `setAttribute`, `style.color`
  - **增**：`createElement`, `appendChild`
  - **删**：`removeChild`, `remove`
  - **事件**：`addEventListener`

#### 2. BOM (Browser Object Model) - 浏览器管家

- **定义**：提供了独立于内容而与浏览器窗口进行交互的对象。它没有正式标准（HTML5 规范化了部分），但所有浏览器都支持。
- **核心对象**：`window` (它是 BOM 的核心，也是 JS 的全局对象)
- **主要 API**：
  - **导航**：`location.href` (跳转), `location.reload` (刷新)
  - **历史**：`history.pushState` (SPA 路由), `history.back`
  - **设备**：`navigator.userAgent` (UA), `navigator.clipboard`
  - **窗口**：`screen.width` (屏幕宽), `window.innerWidth` (视口宽)
  - **交互**：`alert`, `confirm`, `prompt`

### B. 网络与存储层 (Data & Net)

- **Network:**
  - `Fetch API` (现代标准)。
  - **`WebSocket`**：这里有歧义，需要区分：
    - **WebSocket 协议 (RFC 6455)**：是基于 TCP 的网络传输协议（类似 HTTP）。
    - **WebSocket API (W3C)**：是浏览器提供的**JS 接口** (`new WebSocket('wss://...')`)，让 JS 能够发起和管理这个协议的连接。
  - `Server-Sent Events` (SSE)。
- **Storage:** `localStorage`, `sessionStorage`, `IndexedDB` (大容量/异步), `Cookie Store API`。

### C. 多媒体与图形层 (Graphics & Media)

- **Graphics:** `Canvas`, `WebGL`, **`WebGPU`** (高性能计算，AI 时代核心)。
- **Media:** `Web Audio API` (音频合成), `WebRTC` (实时音视频流), `MediaStream`。

### D. 硬件与系统能力 (Device Access / PWA)

_这是区分 Web App 与 Native App 的前沿战场：_

- **Hardware:** `Bluetooth API` (蓝牙), `WebUSB`, `Gamepad API`。
- **System:** `Clipboard API` (剪贴板), `File System Access API` (读写本地文件), `Geolocation`。

---

## 4. 底层工作机制 (How it works)

1. **C++ 绑定 (Bindings):** 浏览器的内核（如 Chrome 的 Blink）主要由 C++ 编写。Web API 是通过 "Bindings" 层将 C++ 的底层功能映射为 JavaScript 对象。
2. **桥接 (Bridge):** 当你调用 `window.alert()` 时，实际上是 JS 引擎通知浏览器进程调用操作系统的原生 UI 控件。3. **异步与 Event Loop:** 绝大多数涉及 I/O（网络、文件）的 Web API 都是**异步**的。它们在浏览器后台线程运行，完成后通过任务队列（Microtask/Macrotask）通知主线程。
