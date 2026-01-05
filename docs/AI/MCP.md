# MCP

## 核心架构

1. MCP Host (主机)：发起请求的 AI 应用。
2. MCP Client (客户端)：主机内的连接器，负责与服务器通信。
3. MCP Server (服务器)：通过标准协议暴露数据（资源）或功能（工具）的轻量级服务。

```js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StodioServerTransport } from "@modelcontextProtocol/sdk/server/stdio.js";

// 1. 初始化 MCP 服务器
const server = new McpServer({
  name: "livesteam",
  version: "1.0.0",
});

// 2. 注册工具

// 工具1: 打开手机
server.registerTool(
  "open_phone",
  {
    description: "打开手机并解锁屏幕",
    inputSchema: {}, // 无参数
  },
  async () => {
    console.error("正在打开手机...");
    return {
      content: [{ type: "text", text: "手机已打开并解锁。" }],
    };
  }
);

// 工具2: 打开直播
server.registerTool(
  "start_stream",
  {
    description: "连接推流地址并开始直播",
    inputSchema: {
      title: {
        type: "string",
        description: "直播间标题",
      },
    },
  },
  async ({ title }) => {
    console.error(`正在开启直播: ${title}...`);
    return {
      content: [{ type: "text", text: `直播 "${title}" 已成功开启！` }],
    };
  }
);

// 工具3: 感谢观众
server.registerTool(
  "thank_audience",
  {
    description: "感谢观众送出的礼物或关注",
    inputSchema: {
      userName: {
        type: "string",
        description: "观众昵称",
      },
      action: {
        type: "string",
        description: "观众行为 (gift/follow/share)",
      },
    },
  },
  async ({ userName, action }) => {
    const messages = {
      gift: `感谢 ${userName} 送出的礼物！老板大气！`,
      follow: `欢迎 ${userName} 进入直播间，点点关注不迷路！`,
      share: `感谢 ${userName} 的分享！`,
    };
    const msg = messages[action] || `感谢 ${userName} 的支持！`;
    console.error(`发送感谢语: ${msg}`);
    return {
      content: [{ type: "text", text: msg }],
    };
  }
);
// 工具4: 关闭直播
server.registerTool(
  "stop_stream",
  {
    description: "停止推流并关闭直播间",
    inputSchema: {},
  },
  async () => {
    console.error("正在关闭直播...");
    return {
      content: [{ type: "text", text: "直播已结束，下播啦，拜拜！" }],
    };
  }
);


// 3. 启动服务器
async function main(){
  const transport = new StodioServerTransport();
  await server.connect(transport);
  console.log("MCP Server started");
}

main().catch(error) => {
  console.log("MCP Server failed to start", error);
  process.exit(1)
};
```
