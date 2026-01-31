# shell配置文件读取顺序

## 启动模式

Shell 的启动模式由两个维度组成，组合起来共有 4 种模式。

### 1. 两个维度

- 交互式 (Interactive) vs 非交互式 (Non-Interactive)
  - 交互式：有一个输入框等你敲命令，有标准输入输出（比如打开终端）。
  - 非交互式：跑完脚本就退出，不需要人干预（比如执行 bash script.sh）。

- 登录式 (Login) vs 非登录式 (Non-Login)
  - 登录式：需要输入用户名密码，或者通过 SSH 连接的（注意：macOS 的终端窗口默认强制为登录式）。
  - 非登录式：登录后，再手动输入 bash 启动的子 Shell，或者 VS Code 里的终端（部分系统）。

### 2. 四种组合（核心考点）

| 模式                | 典型场景                           | 加载的配置文件 (Bash为例)       |
| ------------------- | ---------------------------------- | ------------------------------- |
| 交互式 + 登录式     | SSH 远程登录、macOS 打开终端       | /etc/profile -> ~/.bash_profile |
| 交互式 + 非登录式   | Ubuntu 右键打开终端、手动输入 bash | ~/.bashrc                       |
| 非交互式 + 非登录式 | 执行 Shell 脚本 (./deploy.sh)      | 不加载 (或读取 BASH_ENV)        |
| 非交互式 + 登录式   | 极少见 (bash --login script.sh)    | 同登录式                        |

> “Shell 启动分登录和非登录、交互和非交互。我们在 `.bash_profile` 里写环境变量是因为它是登录式加载；在 `.bashrc` 里写 alias 是因为它在非登录交互式下也会加载。为了省事，我们通常会在 profile 里手动 source 一下 rc 文件。”

## Zsh (macOS 默认，Linux 常用)

### 加载顺序：

- `.zshenv` (任何时候都会读，不建议放耗时操作)
- `.zprofile` (登录时读)
- `.zshrc` (最核心！每次打开新终端窗口都会读)
- `.zlogin` (登录结束时读)

结论：
前端开发（配置环境变量、alias、fnm/nvm 等），永远只改 `~/.zshrc`。
改完记得 `source ~/.zshrc`。

## Bash (Linux 默认，旧版 macOS 默认)

### 场景 A：Login Shell (登录式)

- 触发：
  - SSH 远程登录
  - 输入账号密码登录
  - macOS 的终端窗口（这是个特例）

- 读取顺序：
  - /etc/profile （全局配置）
  - 然后查找 `~/.bash_profile`（用户配置）
  - `~/.bash_login`
  - `~/.profile`
  - （只读取找到的第一个）

### 场景 B：Non-Login Interactive Shell (非登录交互式)

- 触发：
  - 在 Ubuntu/CentOS 桌面右键“打开终端”
  - 在 VS Code 里打开终端
  - 输入 bash 命令

- 读取顺序：
  - `~/.bashrc`

> ⚠️ 史诗级巨坑 (macOS 用户必看)：

> macOS 的终端默认把每一个 **新窗口都当作 Login Shell 处理**。这意味着它只会读 `~/.bash_profile`，不会读 `~/.bashrc`。

> 最佳实践：在你的 `~/.bash_profile` 里手动加一行代码去加载 `.bashrc`：

```bash
# 在 .bash_profile 中添加
if [ -f ~/.bashrc ]; then
  source ~/.bashrc
fi
```
