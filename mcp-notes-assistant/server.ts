#!/usr/bin/env node

/**
 * 学习笔记助手 MCP 服务器 (TypeScript 版本)
 * Learning Notes Assistant MCP Server (TypeScript)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 笔记数据文件路径
const NOTES_FILE = path.join(__dirname, "notes_data.json");

// 笔记类型定义
interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
}

// ============================================
// 数据持久化函数
// ============================================

async function loadNotes(): Promise<Note[]> {
  try {
    const data = await fs.readFile(NOTES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveNotes(notes: Note[]): Promise<void> {
  await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2), "utf-8");
}

// ============================================
// MCP 服务器初始化
// ============================================

const server = new Server(
  {
    name: "learning-notes-assistant",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ============================================
// 工具列表
// ============================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add_note",
        description: "添加一条新的学习笔记",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "笔记标题",
            },
            content: {
              type: "string",
              description: "笔记内容",
            },
            tags: {
              type: "string",
              description: "标签（用逗号分隔，例如 'JavaScript,函数,闭包'）",
            },
          },
          required: ["title", "content"],
        },
      },
      {
        name: "search_notes",
        description: "根据关键词搜索笔记",
        inputSchema: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "搜索关键词",
            },
          },
          required: ["keyword"],
        },
      },
      {
        name: "get_notes_by_tag",
        description: "获取指定标签的所有笔记",
        inputSchema: {
          type: "object",
          properties: {
            tag: {
              type: "string",
              description: "标签名称",
            },
          },
          required: ["tag"],
        },
      },
      {
        name: "get_stats",
        description: "获取笔记统计信息",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// ============================================
// 工具调用处理
// ============================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "add_note": {
      // TODO(human): 实现添加笔记逻辑
      // 提示：
      // 1. 使用 await loadNotes() 加载笔记
      // 2. 创建新笔记对象
      // 3. 使用 await saveNotes(notes) 保存
      // 4. 返回格式: { content: [{ type: "text", text: "消息内容" }] }

      const notes = await loadNotes();
      const newNote: Note = {
        id: notes.length + 1,
        title: args.title as string,
        content: args.content as string,
        tags: args.tags ? (args.tags as string).split(",").map(t => t.trim()) : [],
        created_at: new Date().toISOString(),
      };

      notes.push(newNote);
      await saveNotes(notes);

      return {
        content: [
          {
            type: "text",
            text: `✅ 笔记已添加！\n标题: ${newNote.title}\n标签: ${newNote.tags.join(", ")}`,
          },
        ],
      };
    }

    case "search_notes": {
      const keyword = (args.keyword as string).toLowerCase();
      const notes = await loadNotes();

      const results = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword)
      );

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 未找到包含 '${keyword}' 的笔记`,
            },
          ],
        };
      }

      let resultText = `🔍 找到 ${results.length} 条笔记:\n\n`;
      results.forEach((note) => {
        resultText += `📝 **${note.title}**\n`;
        resultText += `   内容: ${note.content.substring(0, 50)}...\n`;
        resultText += `   标签: ${note.tags.join(", ")}\n`;
        resultText += `   时间: ${note.created_at}\n\n`;
      });

      return {
        content: [{ type: "text", text: resultText }],
      };
    }

    case "get_notes_by_tag": {
      const tag = args.tag as string;
      const notes = await loadNotes();

      const results = notes.filter((note) => note.tags.includes(tag));

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 未找到标签为 '${tag}' 的笔记`,
            },
          ],
        };
      }

      let resultText = `🏷️  标签 '${tag}' 下的笔记 (${results.length} 条):\n\n`;
      results.forEach((note) => {
        resultText += `• ${note.title}\n`;
        resultText += `  ${note.content.substring(0, 60)}...\n\n`;
      });

      return {
        content: [{ type: "text", text: resultText }],
      };
    }

    case "get_stats": {
      const notes = await loadNotes();

      if (notes.length === 0) {
        return {
          content: [{ type: "text", text: "📊 暂无笔记数据" }],
        };
      }

      const tagCount: Record<string, number> = {};
      notes.forEach((note) => {
        note.tags.forEach((tag) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      });

      let statsText = "📊 **笔记统计信息**\n\n";
      statsText += `📝 总笔记数: ${notes.length}\n`;
      statsText += `🏷️  标签总数: ${Object.keys(tagCount).length}\n\n`;

      if (Object.keys(tagCount).length > 0) {
        statsText += "**热门标签:**\n";
        const sortedTags = Object.entries(tagCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        sortedTags.forEach(([tag, count]) => {
          statsText += `  • ${tag}: ${count} 条笔记\n`;
        });
      }

      return {
        content: [{ type: "text", text: statsText }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// ============================================
// 资源处理
// ============================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "notes://all",
        name: "所有学习笔记",
        mimeType: "application/json",
        description: "获取所有笔记的 JSON 数据",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "notes://all") {
    const notes = await loadNotes();
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(notes, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// ============================================
// 启动服务器
// ============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("学习笔记助手 MCP 服务器已启动");
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
});
