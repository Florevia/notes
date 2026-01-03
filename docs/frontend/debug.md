# debug

## 原理

- Debug Protocol（调试协议）
- 通信机制（通常是 WebSocket）

## 调试器的架构体系

调试器是一个客户端-服务器架构的系统（Client/Server 架构）

- Debug Server（被调试的目标）：运行代码的环境

  - 如 Node.js 进程
  - Chrome 浏览器

- Debug Client（调试工具）：用于控制调试的界面

  - 如 VS Code
  - Chrome DevTools
  - 终端 CLI

## 具体的调试方法

### Chrome 调试 Client

**1. 启动 nodejs 的调试 server**

```bash
# 启动时候断在第一行
node --inspect-brk index.js

# 不给断点
node --inspect index.js

# 指定端口
node --inspect-port=9230 index.js
```

**2. 开启 chrome devtools 进行调试**

- 浏览器中输入`chrome://inspect`进入调试
- 选中要调试的程序

### vscode 调试 Client

**1. 启动 nodejs 的调试 server**

**2. 启动 vscode 调试 Client**

- 创建 vscode 调试 Client 的配置文件
  - 创建一个 .vscode 的目录
  - 创建一个 launch.json 文件
  - 创建具体的调试配置

第一种配置：仅仅启动调试 Client

```json
{
  "configurations": [
    {
      "name": "Debug Client only",
      "request": "attach",
      "skipFiles": ["<node_internals>/**"],
      "type": "node"
    }
  ]
}
```

第二种配置：启动调试 Client 并同时启动调试 Server

```json
{
  "configurations": [
    {
      "name": "Debug Server and Client",
      "program": "${workspaceFolder}/docs/index.ts",
      "request": "launch",
      "skipFiles": ["<node_internals>/**"],
      "type": "node"
    }
  ]
}
```

### Node 调试 Client

**1. 启动 nodejs 的调试 server**

**2. 启动 nodejs 的调试 Client**

```bash
node inspect <host>:<port>
```

具体调试方式：

- next (n): 下一步
- step (s): 进入
- step out (o): 出去
- continue (c): 继续
- pause (p): 暂停

### Javascript Debugger Terminal (VS Code 等类似编辑器皆有)

开启 vscode 的 Javascript Debugger Terminal，然后直接运行`node index.js` 即可。

- 无需配置文件
- 但需要显式打断点
- 会自动启动调试 server 和 client
