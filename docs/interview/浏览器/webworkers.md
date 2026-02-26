# Web Workers

Web Workers 提供了一种在后台线程中运行 js 代码的机制。

## 核心机制：独立且通过消息通信
Web Workers 运行在一个完全独立的全局上下文中。这意味着 Worker 线程和主线程是物理隔离的，它们不共享内存。


靠消息传递进行通信：
-  双方通过监听 `onmessage 事件`来获取对方发来的数据。
- 主线程和 Worker 都可以通过调用 `postMessage()` 方法向对方发送数据。

### 区别

❌ Worker 绝对不能做的事情（局限性）：

1. 不能操作 DOM： 无法访问 `document`、`window` 或 `parent` 对象。你不能在 Worker 里去修改页面的 HTML 元素。

2. 不能访问部分全局变量： 由于脱离了主窗口，很多挂载在 window 上的变量或库无法直接使用。

✅ Worker 可以做的事情（能力拓展）：

1. 网络请求： 可以使用 `fetch` 或 `XMLHttpRequest` 发起请求。

2. 定时器： 可以使用 `setTimeout`、`setInterval`。

3. 客户端存储： 可以访问 `IndexedDB` 或 `Cache API`。

