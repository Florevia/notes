# MCP

## 概念定位

MCP，Model Context Protocol 模型上下文协议，旨在提供一个 **标准化** 的协议，让大型语言模型（LLM）能够安全、统一地连接外部数据源和工具。

被称为「AI 应用的 USB-C 接口」：以前每个 AI 应用接入每个数据源都要单独写一套集成（N×M 问题），MCP 把这件事标准化了——应用和数据源各自实现一次协议，即可互相连通。由 Anthropic 于 2024 年 11 月开源。

## 核心架构

1. MCP Host (主机)：发起请求的 AI 应用，如 Claude Desktop、Cursor、ZCode。负责把工具清单交给模型、把执行结果回填给模型。
2. MCP Client (客户端)：主机内的连接器，负责与服务器通信，与一个 Server 保持一对一连接。
3. MCP Server (服务器)：通过标准协议暴露数据（资源）或功能（工具）的轻量级服务。

```text
┌─────────── Host（如 Claude Desktop）───────────┐
│  LLM  ⇄  MCP Client  ⇄  MCP Client  ⇅         │
└────────────────────────────┬───────────────────┘
                             │ JSON-RPC
                    ┌────────▼────────┐
                    │   MCP Server    │ → 文件系统 / 数据库 / API
                    └─────────────────┘
```

## 通信底座

所有消息都是 **JSON-RPC 2.0** 格式，跑在两种传输层上：

- **stdio**：Host 把 Server 作为本地子进程启动，通过标准输入/输出通信（适合本地工具）。
- **Streamable HTTP**：远程 Server 走 HTTP，支持流式响应（已取代早期的 HTTP + SSE 方案）。

三种消息类型：

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

// 通知（无 id，不需要回复）
{ "jsonrpc": "2.0", "method": "notifications/initialized" }
```

## 三大核心原语

| 原语 | 谁控制 | 用途 |
| --- | --- | --- |
| Tools | 模型决定调用 | 可执行函数（查库、调 API），类似 function calling |
| Resources | 应用决定读取 | 只读数据（文件内容、数据库记录），类似 GET 请求 |
| Prompts | 用户主动触发 | 预置的提示词模板（如 /斜杠命令） |

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

## 工作流生命周期

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

一次工具调用的完整链路：

1. Host 通过 `tools/list` 拿到工具清单（名称 + 描述 + JSON Schema 参数定义）。
2. Host 把工具定义注入模型上下文（本质是拼进 system prompt）。
3. 模型决定调用某个工具，输出结构化调用请求。
4. Host 通过 Client 以 `tools/call` 发 JSON-RPC 请求给 Server 执行（模型不直接接触 Server）。
5. Server 返回结果，Host 把结果回填给模型，模型继续生成。

## 安全机制

- **用户确认**：敏感工具（写文件、发请求、执行命令）在真正调用前，Host 可弹窗让用户审批。
- **架构隔离**：模型永远不直接接触 Server，所有调用经 Host 转发，Host 是唯一的守门人。
- **能力最小暴露**：握手时协商能力，Server 未声明的功能客户端根本看不到。
- **远程认证**：Streamable HTTP 场景下通过 `headers`（Bearer Token）或 OAuth 授权。
- **注入风险**：工具的 name/description 会被拼进模型上下文，因此恶意 Server 可实施 **tool poisoning**（描述里藏恶意指令）和 **rug pull**（通过审核后再改描述）。对策：只接可信来源的 Server、更新前审阅工具变更。

## 开发生态

- **官方 SDK**：TypeScript、Python 等，几行代码即可起一个 Server。
- **官方参考 Server**：filesystem、git、github、sqlite、fetch 等。
- **调试工具**：MCP Inspector，可视化查看工具清单、手动调用测试。
- **Host 支持**：Claude Desktop、Cursor、ZCode、Codex 等主流客户端均已支持，2025 年 OpenAI 也宣布兼容。
- **Server 目录**：GitHub 上的 awesome-mcp-servers、Smithery 等聚合站。

Host 侧通过 `mcpServers` 配置接入，本地 stdio 型和远程 HTTP 型两种写法：

```jsonc
{
  "mcpServers": {
    "filesystem": {
      // 本地：命令行启动
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    },
    "my-remote": {
      // 远程：直接给 URL
      "url": "https://example.com/mcp",
      "headers": { "Authorization": "Bearer xxx" }
    }
  }
}
```

配置后 Host 会给工具加上 `mcp__服务器名__工具名` 前缀，例如 `mcp__node_repl__js`。
