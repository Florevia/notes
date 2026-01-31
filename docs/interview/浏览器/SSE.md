# SSE

## 概念

SSE 是一种基于 **HTTP** 的轻量级 **“服务器推”** 技术，它允许服务器通过 **单一的 HTTP 连接**，**持续地向客户端** 推送 文本数据流。

## 核心原理与通信流程

不同于 WebSocket 的全双工（双向）通信，SSE 是 **单向通信** 的，即 **只有服务器能发消息给客户端，客户端只能接收**。

- 建立连接： 客户端发起一个普通的 HTTP 请求（通常是 GET）。
- 保持连接： 服务器响应时，不关闭连接，而是保持开启（Keep-Alive）。
- 数据流： 服务器按照特定的格式（text/event-stream），源源不断地向客户端写入数据块。
- 自动重连： 这是 SSE 的一大亮点。如果连接意外断开，浏览器原生支持自动重连，无需写额外的代码。

## 协议规范

完全基于HTTP

1.  响应头：

    服务端必须设置以下 Header，这是握手的关键：

    ```h
    Content-Type: text/event-stream // 告诉浏览器，我发的是事件流，不是普通的 HTML 或 JSON
    Cache-Control: no-cache // 必须禁用缓存，否则实时性无法保证
    Connection: keep-alive
    ```

2.  数据载荷格式

    数据必须是 UTF-8 编码的文本。每一条消息由 data: 开头，以两个换行符 `\n\n` 结尾。
    - 支持的字段包括：
      - data: 消息内容（可以是 JSON 字符串）。
      - event: 自定义事件类型（默认是 message）。
      - id: 事件 ID。如果连接断开，浏览器重连时会带上 Last-Event-ID 头，告诉服务器“我上次收到这了”，实现断点续传。
      - retry: 告诉浏览器如果断连，多少毫秒后重连。

    ```h
    id: 101
    event: ping
    data: {"time": "2023-10-01"}

    id: 102
    data: This is a message without event type
    ```

## 代码实现

1. 前端实现 (Native API)

   浏览器提供了原生的 EventSource API，非常简单

```js
// 建立连接 (仅支持 GET 请求)
const evtSource = new EventSource("/api/stream-endpoint");

// 1. 监听默认消息
evtSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("New message:", data);
};

// 2. 监听自定义事件 (对应后端的 event: ping)
evtSource.addEventListener("ping", (event) => {
  console.log("Ping event:", event.data);
});

// 3. 错误处理
evtSource.onerror = (err) => {
  console.error("EventSource failed:", err);
  // EventSource 会自动重连，除非调用 close()
  // evtSource.close();
};
```

2. 后端实现 (Node.js / Express 示例)

```js
app.get("/api/stream-endpoint", (req, res) => {
  // 1. 设置必要头信息
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // 2. 发送数据的辅助函数
  const sendData = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // 模拟每秒推送一次
  const intervalId = setInterval(() => {
    sendData({ time: new Date().toISOString() });
  }, 1000);

  // 3. 重要：客户端断开时清理资源
  req.on("close", () => {
    clearInterval(intervalId);
    res.end();
  });
});
```

## SSE vs websocket

| 特性           | SSE (Server-Sent Events)            | WebSocket                                  |
| :------------- | :---------------------------------- | :----------------------------------------- |
| **通讯方向**   | 单向 (Server -> Client)             | 双向 (Full Duplex)                         |
| **协议**       | 标准 HTTP                           | TCP 上的独立协议 (ws://)                   |
| **复杂度**     | 低 (浏览器原生支持自动重连、ID管理) | 高 (需手动处理心跳、重连、鉴权)            |
| **数据类型**   | 仅文本 (UTF-8)                      | 文本 + 二进制 (Binary/Blob)                |
| **防火墙友好** | 极好 (就是普通 HTTP)                | 一般 (某些企业防火墙会屏蔽非 80/443 的 WS) |
| **典型场景**   | AI 打字机效果、股票行情、新闻推送   | 在线游戏、即时聊天室、协同编辑             |

## 进阶：如何解决 SSE 不支持 POST 的问题？

原生 `EventSource` 只支持 GET 请求，这在 AI 应用场景下有个巨大的痛点：**Prompt（提示词）往往很长，GET 请求的 URL 长度有限制**，很容易超长。

**解决方案：** 抛弃原生 `EventSource`，使用 `fetch` API 配合 `ReadableStream` 来模拟。

这也是 ChatGPT、Claude 等大多数 AI 产品的标准做法。

### 核心原理

1.  **发送 POST 请求**：使用 `fetch` 发送 POST 请求，Body 中携带超长的 JSON 数据。
2.  **获取 Reader**：通过 `response.body.getReader()` 获取一个流式读取器。
3.  **循环读取**：在一个 `while` 循环中，不断调用 `reader.read()` 读取数据块（Chunk）。
4.  **解码文本**：读到的 `value` 是 `Uint8Array`（二进制字节流），需要用 `TextDecoder` 解码成字符串。
5.  **处理分包/粘包**：网络传输中，一条完整的 SSE 消息可能会被切成两半随不同 Chunk 到达（分包），也可能多条消息在一个 Chunk 里（粘包）。需要手动拼接字符串并按换行符分割。
