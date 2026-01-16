# 学习笔记助手 MCP 服务器

一个简单实用的 MCP（Model Context Protocol）服务器，帮助你在与 AI 对话时快速管理学习笔记。

## 🌟 功能特性

- ✅ **添加笔记** - 快速记录学习要点
- 🔍 **搜索笔记** - 根据关键词查找内容
- 🏷️ **标签管理** - 为笔记添加分类标签
- 📊 **统计信息** - 查看笔记数量和分类

## 📦 两种实现版本

本项目提供了两种编程语言的实现：

### Python 版本 (`server.py`)
- 使用官方 `mcp` SDK
- 适合 Python 生态、数据处理场景
- **包含学习任务**：`add_note` 函数需要你自己实现

### TypeScript 版本 (`server.ts`)
- 使用官方 `@modelcontextprotocol/sdk`
- 适合 Node.js 生态、Web 应用
- **完整实现**：所有功能开箱即用

---

## 🚀 快速开始

### 方式 1：使用 TypeScript 版本

#### 1. 安装依赖
```bash
cd mcp-notes-assistant
npm install
```

#### 2. 运行服务器（开发模式）
```bash
npm run dev
```

#### 3. 编译并运行（生产模式）
```bash
npm run build
npm start
```

---

### 方式 2：使用 Python 版本

#### 1. 安装依赖
```bash
pip install mcp
```

#### 2. 完成学习任务
在 `server.py` 中找到 `TODO(human)` 标记，实现 `add_note` 函数。

#### 3. 运行服务器
```bash
python server.py
```

---

## 🔧 配置 Claude Desktop

要在 Claude Desktop 中使用这个 MCP 服务器，需要编辑配置文件：

**macOS/Linux:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

### TypeScript 版本配置

```json
{
  "mcpServers": {
    "learning-notes": {
      "command": "node",
      "args": ["/Users/你的用户名/Code/notes/mcp-notes-assistant/dist/server.js"]
    }
  }
}
```

### Python 版本配置

```json
{
  "mcpServers": {
    "learning-notes": {
      "command": "python",
      "args": ["/Users/你的用户名/Code/notes/mcp-notes-assistant/server.py"]
    }
  }
}
```

**重要**：记得替换路径中的 `你的用户名` 为你的实际用户名！

---

## 💡 使用示例

配置完成后，重启 Claude Desktop，你就可以这样使用：

```
你：帮我添加一条笔记，标题是"函数柯里化"，内容是"将多参数函数转换为单参数函数序列"，标签是"JavaScript,函数式编程"

Claude：✅ 笔记已添加！
标题: 函数柯里化
标签: JavaScript, 函数式编程

你：搜索包含"函数"的笔记

Claude：🔍 找到 1 条笔记:
📝 **函数柯里化**
   内容: 将多参数函数转换为单参数函数序列
   标签: JavaScript, 函数式编程
   时间: 2026-01-15T10:30:00.000Z

你：查看笔记统计

Claude：📊 **笔记统计信息**
📝 总笔记数: 1
🏷️  标签总数: 2
**热门标签:**
  • JavaScript: 1 条笔记
  • 函数式编程: 1 条笔记
```

---

## 📚 工具列表

| 工具名称 | 描述 | 参数 |
|---------|------|------|
| `add_note` | 添加新笔记 | title, content, tags (可选) |
| `search_notes` | 搜索笔记 | keyword |
| `get_notes_by_tag` | 按标签查询 | tag |
| `get_stats` | 获取统计信息 | 无 |

---

## 🎯 学习要点

### Python vs TypeScript 实现对比

| 特性 | Python | TypeScript |
|------|--------|-----------|
| 装饰器风格 | `@app.call_tool()` | 手动注册处理器 |
| 类型安全 | 依赖类型注解 | 原生类型系统 |
| 异步处理 | `async/await` | `async/await` |
| JSON 处理 | `json.load/dump` | `JSON.parse/stringify` |
| 文件操作 | `with open()` | `fs.readFile/writeFile` |

### MCP 核心概念

1. **Tools（工具）** - AI 可调用的函数
2. **Resources（资源）** - AI 可读取的数据
3. **Prompts（提示）** - 预定义的模板
4. **Transport（传输）** - stdio/HTTP/SSE

---

## 📁 项目结构

```
mcp-notes-assistant/
├── server.py              # Python 实现（含学习任务）
├── server.ts              # TypeScript 完整实现
├── package.json           # Node.js 依赖
├── tsconfig.json          # TypeScript 配置
├── notes_data.json        # 笔记数据存储（自动生成）
└── README.md             # 本文档
```

---

## 🔍 故障排除

### 问题：Claude Desktop 找不到服务器

**解决方案：**
1. 确认配置文件路径正确
2. 确认 JSON 格式正确（使用 JSON 验证器）
3. 重启 Claude Desktop

### 问题：TypeScript 版本无法运行

**解决方案：**
```bash
# 确保 Node.js 版本 >= 18
node --version

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 问题：Python 版本报错

**解决方案：**
```bash
# 确保 Python 版本 >= 3.10
python --version

# 安装 MCP SDK
pip install mcp
```

---

## 🎓 扩展建议

学习完成后，可以尝试：

- 添加笔记编辑和删除功能
- 支持 Markdown 格式
- 添加笔记导出功能（导出为 Markdown 文件）
- 实现笔记备份和恢复
- 添加笔记提醒功能
- 支持笔记分享（生成分享链接）

---

## 📖 相关资源

- [MCP 官方文档](https://modelcontextprotocol.io)
- [MCP SDK (Python)](https://github.com/modelcontextprotocol/python-sdk)
- [MCP SDK (TypeScript)](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop](https://claude.ai/download)

---

## 📄 许可证

MIT License
