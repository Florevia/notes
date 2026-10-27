# Pi Agent 的 MCP 实现与架构

本文汇总两次问答：Pi Agent 如何实现 MCP，以及三层架构、内置 MCP 和不同 Agent 实现方式的进一步解释。

研究对象是 Mario Zechner 的 **Pi Coding Agent**，原仓库为 `badlogic/pi-mono`，现为 [`earendil-works/pi`](https://github.com/earendil-works/pi)。以下实现说明基于 2026-10-27 查询的官方 `main` 源码和文档，不代表所有历史版本。

## 一、Pi Agent 是如何实现 MCP 的？

Pi 当前已经有内置 MCP 支持。核心实现是：**独立 MCP Client + 内置 MCP 扩展 + Pi 的统一工具调用管线**。

比较有特色的是：**连接 MCP 服务，不等于把所有工具 schema 塞进模型上下文**。

### 1. 架构概览

```text
模型
 ├─ 直接调用 MCP 工具
 ├─ tool_search → 发现后直接调用
 └─ codemode → 用脚本发现、组合和调用工具
             │
             ▼
Pi 统一工具管线
  tool_call hooks / 权限扩展 / tool_result hooks
             │
             ▼
内置 MCP 扩展
  配置、连接管理、工具注册、结果转换、/mcp UI
             │
             ▼
@earendil-works/pi-mcp
  JSON-RPC、握手、超时、取消、通知
             │
       ┌─────┴──────────┐
       ▼                ▼
    stdio        Streamable HTTP
       │                │
       └──── MCP Server ┘
```

Agent 核心本身并不承担 MCP 网络连接。`core/mcp-servers.ts` 负责配置校验和 server 注册，内置 MCP 扩展管理实际连接；其他扩展也可以通过 `pi.registerMcpServer(name, config)` 动态添加服务。

这里的职责边界需要准确区分：**内置 MCP 扩展负责决定连接哪些服务、何时连接，并管理连接生命周期；底层握手、消息收发和进程／网络通信由 MCP Client 与 Transport 实现。**

扩展是连接的“管理者”，Client 和 Transport 是连接的“执行者”。

源码：[MCP 配置与注册](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/mcp-servers.ts)。

### 2. 协议层：自己实现轻量 Client

Pi 的 `@earendil-works/pi-mcp` **不依赖官方 MCP SDK，也不依赖其他 Pi 包**，提供：

- `McpClient`：与 transport 无关的协议核心。
- `StdioTransport`：启动本地子进程并通信。
- `StreamableHttpTransport`：连接远程服务。
- 内存 transport：用于测试。

`McpClient.connect()` 的流程是：

```text
transport.start()
  → initialize 请求
  → 校验服务端选择的协议版本
  → 保存 serverInfo、capabilities、instructions
  → notifications/initialized
  → connected
```

普通调用通过递增的 JSON-RPC ID 和 `pending Map` 匹配请求与响应，同时处理超时、`AbortSignal` 取消以及进度通知。进度通知会重置请求超时。

这层没有依赖官方 SDK，但 **OAuth 实现是从官方 TypeScript SDK 的 MIT 许可代码适配而来**，不是所有部分都从零重写。

参考：[包说明](https://github.com/earendil-works/pi/blob/main/packages/mcp/README.md) · [Client 源码](https://github.com/earendil-works/pi/blob/main/packages/mcp/src/client.ts)。

### 3. 适配层：把 MCP 工具变成 Pi 工具

`McpServerConnection` 建立连接后，根据服务端 capability 调用 `client.listTools()`，支持分页，并监听：

```text
notifications/tools/list_changed
```

工具列表变化后重新获取并更新注册。

每个 MCP 工具通过 `createMcpToolDefinition()` 转换成 Pi 的 `ToolDefinition`，主要映射如下：

| MCP 字段 | Pi 中的处理 |
| --- | --- |
| `name` | 转成 `mcp__<server>__<tool>` |
| `description` | 工具描述 |
| `inputSchema` | 工具参数 schema |
| `outputSchema` | 放进完整 MCP 结果的输出 schema |
| `annotations` | 保留只读、破坏性、幂等性等提示 |
| 调用 | `execute()` 内调用 `client.callTool()` |

执行链可以概括为：

```text
ToolDefinition.execute()
  → 获取连接，必要时重连
  → client.callTool(原始工具名, 参数, { signal, timeoutMs, onProgress })
  → JSON-RPC tools/call
  → convertMcpResult()
  → Pi AgentToolResult
```

命名适配还处理了非法字符、64 字符长度限制和名称冲突；过长或冲突的名字追加 hash。

源码：[连接管理](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/extensions/mcp/runtime.ts) · [工具适配](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/extensions/mcp/tools.ts)。

### 4. 最关键的设计：工具注册和上下文暴露分离

Pi 默认不是“启动时把所有 MCP 工具声明给模型”，而是提供四种 `exposure`：

| 模式 | 模型如何使用 |
| --- | --- |
| **`codemode`，默认** | 不直接声明工具；脚本通过 `searchTools()`、`describeTool()` 等发现并调用 |
| `deferred` | 先用 `tool_search` 找到工具，再把匹配工具声明给后续模型调用 |
| `direct` | 像普通内置工具一样，直接声明给模型 |
| `hidden` | 已注册，但不可调用 |

因此它区分了三个状态：

> **服务已连接 → 工具已注册 → 工具是否出现在模型请求里。**

这三件事不是一回事。

默认的 codemode 路径还能在脚本中组合多个 MCP 调用、过滤返回数据，只把最终所需内容交给模型，从而减少 schema 和结果对上下文的占用。

另一个容易混淆的点：**内置实现会在 session 启动时后台连接所有 enabled server，并不是第一次调用才启动 server**。按需的是工具发现和暴露；掉线后的重连才是按下一次调用触发。

参考：[官方 MCP 文档](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/mcp.md)。

### 5. 返回结果和权限不是旁路

MCP 返回值分两路处理：

- **直接给模型**：转换成文本和图片；超过 20 KB 的文本截掉中间，完整输出保存到临时文件。
- **给 codemode 脚本**：保留完整 `CallToolResult` 的 `content`、`structuredContent`、`isError`，去掉 `_meta`，不截断。

所有 MCP 调用仍经过 Pi 的 `tool_call` / `tool_result` hooks，权限扩展也适用。codemode 内的嵌套调用通过 `parentToolCallId` 关联外层调用，而不是绕过工具管线。

当前内置 transport 支持 **stdio 和 Streamable HTTP，不支持旧式 HTTP+SSE**。

### 6. 实现总结与版本区别

**Pi 把 MCP 做成可替换的内置扩展，用自己的轻量 Client 接协议，再把远端工具接入统一工具系统；它最重要的设计不是“如何发 `tools/call`”，而是将工具连接、注册和模型可见性解耦。**

早期“Pi 不内置 MCP，建议用 CLI”的文章描述的是旧版本；第三方 [`pi-mcp-adapter`](https://github.com/nicobailon/pi-mcp-adapter) 现在仍可用，但它和上述官方内置实现是两套东西。

## 二、进一步理解架构

### 1. 架构分为哪三层？

这里说的是 **Pi 内部实现 MCP 的三个职责层**，不是 MCP 协议规定的三层：

| 层 | 负责什么 | Pi 中对应的实现 |
| --- | --- | --- |
| **Agent 工具层** | 向模型暴露工具、执行工具调用、触发权限和结果 hooks、把结果放回对话 | Pi 的工具注册表和统一工具调用管线 |
| **MCP 集成层** | 读取配置、管理服务连接、发现工具、将 MCP 工具适配成 Pi 工具、提供 `/mcp` 管理界面 | 内置 MCP 扩展 |
| **MCP 协议与传输层** | MCP 握手、JSON-RPC 请求响应、超时取消，以及 stdio / HTTP 通信 | `@earendil-works/pi-mcp` |

调用方向如下：

```text
Agent 工具层
    ↓ 调用 Pi 工具
MCP 集成层
    ↓ client.callTool(...)
MCP 协议与传输层
    ↓ tools/call 消息
外部 MCP Server
```

对于“真正的连接工作由内置 MCP 扩展完成”这句话，更严谨的理解是：

**内置 MCP 扩展负责决定连接哪些服务、何时连接，并管理连接生命周期；底层握手、消息收发和进程／网络通信由 MCP Client 与 Transport 实现。**

扩展是连接的“管理者”，Client 和 Transport 是连接的“执行者”。

### 2. “内置 MCP”是指什么？

这里指的是 **Pi 自带 MCP 客户端集成能力**，不是 Pi 自带了数据库、浏览器等 MCP Server。

区别是：

```text
Pi 自带：
  MCP 扩展 + MCP Client + Transport + 配置和管理界面

你提供或配置：
  文件系统 MCP Server
  数据库 MCP Server
  GitHub MCP Server
  ……
```

而“**内置 MCP 扩展**”中的两个词也不冲突：

- **内置**：随 Pi 一起发布，正常 CLI 会话不需要另外安装第三方适配器。
- **扩展**：它通过 Pi 的扩展机制接入，而不是把所有 MCP 功能直接写进 Agent 核心循环。

可以类比编辑器的“内置 Git 扩展”：它随应用安装，但架构上仍是扩展模块。

Pi 这样做是为了保持核心与具体集成解耦。核心管理工具和 server 注册，MCP 扩展管理具体连接；第三方扩展也可以替换内置 MCP 支持。

参考：[替换内置 MCP 支持](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/mcp.md#replace-the-built-in-mcp-support)。

### 3. 所有 Agent 的 MCP 都是这种架构吗？

**不是。大多数有相似的职责，但不一定有相同的模块划分。**

#### 相似的是基本调用链

对于让模型调用 MCP 工具的 Agent，通常都需要：

```text
发现 MCP 工具
    ↓
让模型知道如何调用
    ↓
将模型调用转换为 MCP tools/call
    ↓
把返回值转换为模型可消费的结果
```

模型通常不自己建立 MCP 连接。**Agent 应用充当 MCP Host，内部的 MCP Client 与 MCP Server 通信。**

#### 不同的是这些职责放在哪里

常见实现方式包括：

| 实现方式 | 特点 |
| --- | --- |
| **直接集成在应用里** | Agent 应用直接使用 MCP SDK，连接管理与工具调度写在主应用中 |
| **插件／扩展式集成** | 像 Pi 一样，由扩展管理 MCP，再接入核心工具系统 |
| **框架适配器** | 通过框架的 MCP adapter，把 MCP 工具转换为框架原生工具 |
| **网关／代理式集成** | Agent 只连接一个网关，由网关再连接、聚合多个 MCP Server |

此外，**模型如何看到工具**也不是统一的：

- 有的 Agent 一次性发送所有工具 schema。
- 有的先搜索工具，再加载匹配的 schema。
- 有的提供一个代理工具，按名称转发调用。
- 有的采用 Pi 默认的 codemode，让脚本发现、组合和调用工具。

**因此，MCP 标准统一的是 Client 与 Server 的通信协议；它并不规定 Agent 必须用扩展架构，也不规定工具必须如何进入模型上下文。**

## 三、参考资料

- [Pi 官方仓库](https://github.com/earendil-works/pi)
- [Pi MCP 使用与设计文档](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/mcp.md)
- [独立 MCP Client 包说明](https://github.com/earendil-works/pi/blob/main/packages/mcp/README.md)
- [MCP Client 协议实现](https://github.com/earendil-works/pi/blob/main/packages/mcp/src/client.ts)
- [MCP 配置校验与 Server 注册](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/mcp-servers.ts)
- [内置 MCP 扩展入口](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/extensions/mcp/index.ts)
- [MCP 连接管理](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/extensions/mcp/runtime.ts)
- [MCP 工具适配与结果转换](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/extensions/mcp/tools.ts)
- [第三方 pi-mcp-adapter](https://github.com/nicobailon/pi-mcp-adapter)
