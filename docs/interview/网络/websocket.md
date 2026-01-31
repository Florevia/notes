# WebSocket

为了解决 HTTP 协议在实时双向通信方面的短板

## 概念

WebSocket 是 HTML5 开始提供的一种在单个 TCP 连接上进行全双工（Full-Duplex）通讯的协议。

- **协议标识**：ws:// (非加密) 和 wss:// (加密，类似于 HTTPS)。

- **层级**：应用层协议，基于 TCP 传输。

- **本质区别**：HTTP 是“请求-响应”模式；WebSocket 是“对等”模式，服务器可以主动向客户端推送数据，客户端也可以随时发送数据，无需频繁建立连接。

# WebSocket 通信流程

## 第一阶段：握手

WebSocket 并不是凭空建立的，它初始化时是一个 **标准的 HTTP 请求**。

### 原理

客户端发送一个 **HTTP GET 请求**，但在 Header 里带了 **暗号**。

### 代码与报文演示

1. 客户端发起请求 (Browser):

```js
// 代码层面很简单
const ws = new WebSocket("ws://example.com/socket");
```

2. 实际发出的 HTTP 报文 (Request):

```http
GET /chat HTTP/1.1
Host: example.com
Connection: Upgrade // 1. 核心字段：告诉服务器要改变连接状态
Upgrade: websocket // 2. 核心字段：我要升级成 websocket 协议
Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw== // 3. 随机字符串（验证身份用）
Sec-WebSocket-Version: 13
```

3. 服务端响应 (Response):

```http
HTTP/1.1 101 Switching Protocols // 1. 状态码 101：同意切换协议
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: HSmrc0sMlYUkAGmn5OI98eE15Ss= // 2. 验证通过的签名

```

### 深度解析：Key 和 Accept 是干嘛的？

- 面试考点：Sec-WebSocket-Key 是为了加密安全吗？

- 回答：不是。它主要是为了 **防止缓存代理服务器的误判**。

  - 服务器拿到客户端发来的 Key，拼接上一个固定的 GUID（魔数），进行 SHA-1 哈希并转 Base64，生成 Accept 返回给客户端。

  - 客户端校验 Accept 也是为了确认：“即使你返回了 200，但我发的是 WS 请求，如果你不懂 WS 协议，你就不会算出这个 Key，那我就断开”。

## 第二阶段：数据传输

握手成功后，底层 TCP 连接保持打开，后续所有数据都通过 WebSocket 数据帧 (Frame) 进行传输。

### 原理：分帧

- TCP 是流式协议，WebSocket 为了区分消息边界，定义了自己的帧格式：

  - Opcode (操作码)：定义这个帧是什么数据（文本、二进制、Ping、Pong、关闭）。

  - Payload：实际数据。

  - Masking：客户端发给服务端的数据必须掩码（异或加密），防止缓存污染攻击。

### 代码演示

发送与接收 (JavaScript):

```js
// 发送：虽然看起来是发字符串，底层会被切分成一个或多个帧(Frame)
ws.send(JSON.stringify({ type: "msg", content: "hello" }));

// 接收：浏览器帮我们把底层的“帧”组装好了，直接给开发者完整的数据
ws.onmessage = (event) => {
  // 这里的 event.data 已经是组装好的完整消息
  console.log("收到服务端数据:", event.data);
};
```

底层的帧结构 (逻辑示意)：假设发送 "Hi"：

- FIN=1 (这是最后一片)
- Opcode=1 (这是文本)
- Mask=1 (客户端发送需掩码)
- Payload="Hi" (经过掩码处理后的二进制)

## 第三阶段：心跳保活

这是最容易被忽略但最重要的环节。

### 原理

WebSocket 连接建立后，如果长时间没有数据传输，中间的防火墙、路由器或者 Nginx 可能会认为连接已死，强制切断（NAT 超时）。
因此，必须在应用层实现心跳检测：

- Ping：我发一个“在吗？”
- Pong：对方回一个“在的”。

### 代码演示 (应用层实现)

```js
const ws = new WebSocket("ws://echo.websocket.org");

let heartbeatTimer = null;
let serverTimeoutTimer = null;

// 1. 连接成功，开启心跳
ws.onopen = () => {
  startHeartbeat();
};

ws.onmessage = (event) => {
  // 2. 无论收到什么消息（包括业务消息或 Pong），都说明连接是活的
  // 重置心跳倒计时
  resetHeartbeat();

  // 处理业务数据...
};

function startHeartbeat() {
  // 每 30 秒 发送一次 Ping
  heartbeatTimer = setTimeout(() => {
    ws.send("PING"); // 这是一个约定好的字符串，也可以是二进制 0x9

    // 发送 Ping 后，如果 5秒 内没收到任何消息，认为服务器挂了
    serverTimeoutTimer = setTimeout(() => {
      ws.close(); // 手动关闭，触发 onclose 里的重连逻辑
    }, 5000);
  }, 30000);
}

function resetHeartbeat() {
  clearTimeout(heartbeatTimer);
  clearTimeout(serverTimeoutTimer);
  startHeartbeat();
}
```

## 第四阶段：连接关闭

WebSocket 的关闭也是有仪式的，不是直接断网。

### 原理

一方发送一个 Close Frame（Opcode=0x8），另一方收到后也回一个 Close Frame，然后 TCP 四次挥手断开。

### 代码

```javascript
// 客户端主动发起关闭
ws.close(1000, "用户主动离开");

ws.onclose = (event) => {
  // code: 1000 (正常关闭), 1006 (异常断开)
  console.log("连接已彻底断开", event.code);
};
```
