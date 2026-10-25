# MCP

## 概念定位

MCP，Model Context Protocol 模型上下文协议，旨在提供一个 **标准化** 的协议，让大型语言模型（LLM）能够安全、统一地连接外部数据源和工具。


## 版本速览

| 版本                      | 状态        | 一句话                                                       |
| ------------------------- | ----------- | ------------------------------------------------------------ |
| `2024-11-05`              | Final       | 早期：stdio + **HTTP+SSE**                                   |
| `2025-03-26`              | Final       | 引入 **Streamable HTTP**，HTTP+SSE 开始被取代                |
| `2025-11-25` 及更早握手系 | Final       | **有** `initialize` / `notifications/initialized`；有会话感  |
| **`2026-07-28`**          | **Current** | **无状态**：去掉握手；每请求自带版本/能力；`server/discover` |

下文约定：

- **跨版本**：Host / Client / Server、三大原语、工具调用主链路 —— 概念仍通用。
- **握手时代（≤ `2025-11-25`）**：多数现成 Host / 教程仍在讲、大量存量 Server 仍在用。
- **无状态时代（`2026-07-28`）**：当前规范；新实现应对齐这里，并保留对旧版的兼容探测。


## 核心架构（跨版本通用）

1. MCP Host (宿主应用)：发起请求的 AI 应用，负责把工具清单交给模型、把执行结果回填给模型。
2. MCP Client (客户端)：主机内的连接器，负责与服务器通信，与 MCP Server 保持一对一连接。
3. MCP Server (服务器)：通过标准协议暴露数据（资源）或功能（工具）的轻量级服务。

```text
              ┌──────── Host（Cursor 等）────────┐
              │                                  │
              │   LLM                            │
              │    │  工具清单 / 调用结果         │
              │    ▼                             │
              │   编排（审批、转发）              │
              │    │            │                │
              │ Client₁      Client₂             │
              └───┬──────────────┬───────────────┘
                  │ JSON-RPC     │ JSON-RPC
                  ▼              ▼
              Server₁        Server₂
              文件系统       GitHub / 数据库 …
```


## 三大核心原语（跨版本通用）

Server 对外暴露能力时，主要就这三类。核心差别不在「叫什么」，而在 **谁发起**：

| 原语      | 谁控制       | 用途                                              |
| --------- | ------------ | ------------------------------------------------- |
| Tools     | 模型决定调用 | 可执行函数（查库、调 API），类似 function calling |
| Resources | 应用决定读取 | 只读数据（文件内容、数据库记录），类似 GET 请求   |
| Prompts   | 用户主动触发 | 预置的提示词模板（如 /斜杠命令）                  |


工具（Tools）的定义格式是标准 JSON Schema：

```jsonc
{
  "name": "thank_audience",
  "description": "感谢观众送出的礼物或关注",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userName": { "type": "string", "description": "观众昵称" },
      "action": { "type": "string", "enum": ["gift", "follow", "share"] }
    },
    "required": ["userName"]
  }
}
```

返回值统一包在 `content` 数组里，每项带 `type`（`text` / `image` / `audio` / `resource`）。

> `2026-07-28`：`inputSchema` / `outputSchema` 放宽为 JSON Schema 2020-12 可用关键字；list 类结果宜带缓存提示（见下文）。

## 通信底座（跨版本通用）

所有消息都是 **JSON-RPC 2.0**。传输层演进：

| 传输                | 出现 / 状态                                               | 说明                                        |
| ------------------- | --------------------------------------------------------- | ------------------------------------------- |
| **stdio**           | 一直存在                                                  | Host 把 Server 当本地子进程，走标准输入输出 |
| **HTTP+SSE**        | `2024-11-05`；自 `2025-03-26` 起被取代，现 **Deprecated** | 旧远程方案，新实现勿再采用                  |
| **Streamable HTTP** | `2025-03-26` 引入；`2026-07-28` 行为再变                  | 当前远程主流                                |

JSON-RPC 三种消息形态（跨版本通用）：

```jsonc
// 请求（有 id，需要回复）
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": { "name": "start_stream", "arguments": { "title": "前端专场" } }
}

// 响应（成功给 result，失败给 error）
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{ "type": "text", "text": "直播已开启" }],
    "isError": false
  }
}

// 握手收尾通知示例（仅握手时代；无 id，Server 不必回复）
{ "jsonrpc": "2.0", "method": "notifications/initialized" }
```

## 规范 A：握手时代（≤ `2025-11-25`）

> 含 `2024-11-05`、`2025-03-26`、`2025-11-25` 等握手系修订。  
> 特征：**先握手再干活**；连接上有会话感。

### 握手生命周期

连接建立时先握手、**协商能力**（如 Server 声明支持 tools 但不支持 resources），协议版本不匹配则降级或断开：

```text
Client                          Server
  │── initialize（协议版本 + 自身能力）──▶│
  │◀─── initialize result（能力协商）────│
  │── notification: initialized ────────▶│
  │                                       │
  │── tools/list / tools/call 等 ───────▶│  ← 正常工作阶段
  │◀──── result / notification ──────────│
```



### Streamable HTTP（握手时代要点）

- 远程用 Streamable HTTP 取代 HTTP+SSE。
- 可有协议层会话（如 `Mcp-Session-Id`）。
- 可能存在 GET 长流、资源订阅（`resources/subscribe` / `unsubscribe`）等机制。

### 能力协商方式

版本和能力主要在 **`initialize` 一次谈妥**，之后同一连接上复用。

## 规范 B：无状态时代（`2026-07-28`，Current）

> 官方当前修订。相对 `2025-11-25` 的核心转向：**有状态握手 → 每请求自描述、可负载均衡**。

### 和握手时代的关键差异

| 点                   | ≤ `2025-11-25`                             | `2026-07-28`                                                              |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| 开场                 | `initialize` + `notifications/initialized` | **删除**；无强制握手                                                      |
| 版本 / 能力          | 握手时协商一次                             | **每条请求**在 `_meta` 里声明                                             |
| 发现                 | 靠 initialize result                       | 必选 RPC：`server/discover`（Client 可选先调）                            |
| 会话                 | Streamable HTTP 可有 `Mcp-Session-Id`      | **去掉**协议层 session                                                    |
| 长订阅               | GET 流 / `resources/subscribe` 等          | 统一为 `subscriptions/listen`（长 POST 响应流）                           |
| Server→Client 要信息 | Server 主动发请求（sampling 等）           | **MRTR**：返回 `input_required`，Client 重试原请求并带上 `inputResponses` |
| 结果形态             | 普通 result                                | 必有 `resultType`：`"complete"` 或 `"input_required"`                     |

### 无握手工作流

```text
Client                              Server
  │──（可选）server/discover ──────────▶│  查支持的版本 / 能力 / 身份
  │◀── discover result ────────────────│
  │                                    │
  │── 任意 RPC（每请求带 _meta 版本）──▶│  可直接打，不必先 discover
  │◀── result（含 resultType）─────────│
  │                                    │
  │──（可选）subscriptions/listen ────▶│  长流：list 变更等通知
```

版本协商：

- 请求 `_meta` 带 `io.modelcontextprotocol/protocolVersion`（HTTP 上还有头 `MCP-Protocol-Version`）。
- 不支持则回 `UnsupportedProtocolVersionError`，并列出 Server 支持的版本；Client 可换版本重试。
- Client / Server 都 **可以同时支持多版本**（含对 `2025-11-25` 及更早的兼容）。

### 每请求自描述（示意）

```jsonc
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": { "q": "mcp" },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": { /* ... */ },
      "io.modelcontextprotocol/clientInfo": { "name": "my-host", "version": "1.0.0" }
    }
  }
}
```

Streamable HTTP 上还会要求标准头，例如 `Mcp-Method`、`Mcp-Name`，便于网关按头路由 / 鉴权。

### Streamable HTTP（`2026-07-28`）

- 单个 MCP 端点，**POST** 发 JSON-RPC。
- 每个请求各自一条响应：普通 JSON，或 **仅属于该请求** 的 SSE 流（进度类通知 + 最终响应）。
- **去掉**协议层 session、`Mcp-Session-Id`。
- **去掉** GET 长流；长生命周期变更通知改走 `subscriptions/listen`。
- **去掉** SSE 可恢复 / `Last-Event-ID`：流断了就丢这次请求，Client 必须用新 id 重发。
- list 结果在连接间一致，不再「按连接变一份」；跨调用状态用 Server 发的 handle 当普通参数传递。

### Multi Round-Trip Requests（MRTR）

Server 需要额外信息（以前靠 Server 主动发 `sampling/createMessage`、`elicitation/create`、`roots/list` 等）时：

1. 先返回 `resultType: "input_required"`，`inputRequests` 里列出要的东西。
2. Client 带着 `inputResponses` **重试原来的那个方法**。
3. 普通完成结果为 `resultType: "complete"`（旧版 Server 若省略该字段，Client 应当作 `"complete"`）。

### 订阅与其它调整（摘要）

- `subscriptions/listen`：Client 勾选关心的变更类型（如 `toolsListChanged`、`resourcesListChanged` 等）。
- 请求相关的 `notifications/progress` 等仍走 **该请求自己的** 响应流，不走 listen 流。
- 去掉 `ping`、`logging/setLevel`、`notifications/roots/list_changed`；日志级别可经每请求 `_meta` 的 `io.modelcontextprotocol/logLevel` 设置。
- Tasks 从核心挪到扩展 `io.modelcontextprotocol/tasks`。
- list / read 等结果带 `ttlMs`、`cacheScope`，方便客户端缓存、提高 prompt cache 命中。
- Roots / Sampling / Logging 标为 **Deprecated**（仍可用一段时间，新实现不建议再加）。
- OAuth：强化 `iss` 校验等；DCR 走向 **Client ID Metadata Documents**，DCR 本身 Deprecated。


## 一次工具调用（Host 视角，跨版本）

协议开场方式变了，但 Host 侧业务链路仍是：

1. Host 通过 `tools/list` 拿到工具清单（名称 + 描述 + JSON Schema）。
2. Host 把工具定义注入模型上下文（本质是拼进 system prompt）。
3. 模型决定调用某个工具，输出结构化调用请求。
4. Host 通过 Client 以 `tools/call` 发 JSON-RPC 给 Server（模型不直接接触 Server）。
5. Server 返回结果，Host 回填给模型，模型继续生成。

差别只在第 1/4 步前后：握手时代要先 `initialize`；`2026-07-28` 则每请求带版本，或先 `server/discover`。

## 安全机制（跨版本 + 新规范补强）

- **用户确认**：敏感工具在真正调用前，Host 可弹窗审批。
- **架构隔离**：模型永远不直接接触 Server，所有调用经 Host 转发。
- **能力最小暴露**：旧版靠握手协商；新版靠每请求 capabilities + `server/discover`，未声明的能力客户端看不到。
- **远程认证**：Streamable HTTP 用 `Authorization` 等头或 OAuth；`2026-07-28` 加强 issuer 校验，并推动 CIMD。
- **注入风险**：工具 name/description 会进模型上下文 → **tool poisoning** / **rug pull**。对策：只接可信 Server、更新前审阅工具变更。

## 开发生态

- **官方 SDK**：TypeScript、Python、Go、C# 等（`2026-07-28` 起 Tier 1 SDK 已跟进无状态核心）。
- **官方参考 Server**：filesystem、git、github、sqlite、fetch 等。
- **调试工具**：MCP Inspector。
- **Host 支持**：Claude Desktop、Cursor、ZCode、Codex 等；生态仍在从握手版迁到无状态版，对接时注意双方协议日期。
- **Server 目录**：awesome-mcp-servers、Smithery 等。

Host 侧通过 `mcpServers` 配置接入（示意，具体字段以所用 Host 为准）：

```jsonc
{
  "mcpServers": {
    "filesystem": {
      // 本地：stdio
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    },
    "my-remote": {
      // 远程：Streamable HTTP
      "url": "https://example.com/mcp",
      "headers": { "Authorization": "Bearer xxx" }
    }
  }
}
```

配置后 Host 常会给工具加 `mcp__服务器名__工具名` 前缀，例如 `mcp__node_repl__js`。