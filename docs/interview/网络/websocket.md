# WebSocket

为了解决 HTTP 协议在实时双向通信方面的短板

## 概念

WebSocket 是 HTML5 开始提供的一种在单个 TCP 连接上进行全双工（Full-Duplex）通讯的协议。

- **协议标识**：ws:// (非加密) 和 wss:// (加密，类似于 HTTPS)。

- **层级**：应用层协议，基于 TCP 传输。

- **本质区别**：HTTP 是“请求-响应”模式；WebSocket 是“对等”模式，服务器可以主动向客户端推送数据，客户端也可以随时发送数据，无需频繁建立连接。

## 为什么 HTTP 做不到双向

HTTP 是严格的请求—响应模型：客户端不发请求，服务端就没机会说话。想要“服务端推送”，传统做法是轮询、长轮询，但每次都是完整的 HTTP 请求（头部开销大、延迟高、大多数请求是无效的）。

> 关键认识：**底层 TCP 本来就是全双工的**（双向都能写数据），“不能推送”只是 HTTP 应用层协议自己规定的限制。WebSocket 要做的就是绕开这个限制。

## 与其他实时方案对比

| 方案 | 方向 | 连接开销 | 典型场景 |
| --- | --- | --- | --- |
| 轮询 | 单向模拟 | 每次完整 HTTP 请求，浪费大 | 兼容性兜底 |
| 长轮询 | 单向模拟 | hold 住请求，仍有反复建连 | 老式 IM |
| SSE | 服务端→客户端单向 | 一条 HTTP 长连接，只能服务器推 | 消息流、AI 流式输出 |
| **WebSocket** | **全双工** | 一次握手，2 字节级帧头 | 聊天、协同编辑、游戏、实时行情 |

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

### 帧格式详解（RFC 6455）

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |            (16/64)            |
|N|V|V|V|       |S|             |  (if payload len==126/127)    |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
|          Masking-key (continued)       |    Payload Data      |
+---------------------------------------------------------------+
```

关键字段：

- **FIN**：是否是消息的最后一个分片（大消息可以切成多帧，`0x0` 是延续帧）
- **opcode**：`0x1` 文本帧、`0x2` 二进制帧、`0x0` 延续帧、`0x8` 关闭、`0x9` Ping、`0xA` Pong
- **MASK**：为 1 表示 Payload 被掩码处理过
- **Payload len 三档编码**：7 位（<126 直接表示长度）/ 16 位（126~65535）/ 64 位（更大），所以**头部最小只有 2 字节**，比 HTTP 头轻量得多
- **Masking-key**：4 字节掩码键，客户端→服务端必须掩码，**服务端→客户端不掩码**（协议规定，防止中间代理被伪造数据投毒，不是为了加密）

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

## 部署注意：Nginx 反向代理配置

WebSocket 走 HTTP Upgrade，经过 Nginx 等反向代理时必须显式透传 Upgrade 头，并调大超时，否则长连接会被代理掐断：

```nginx
location /ws/ {
    proxy_pass http://127.0.0.1:8080;
    # 关键：透传协议升级头
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # 保底：让代理不主动断开空闲连接（配合应用层心跳更好）
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
}
```
