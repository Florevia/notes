---
title: "Git 走 SSH 代理的原理"
description: "从 core.sshCommand / GIT_SSH_COMMAND 到 ssh ProxyCommand、nc 与 HTTP CONNECT / SOCKS5 的完整链路。"
tags: ["工具与实践"]
docType: "concept"
knowledgeTopic: "/tools/git/"
---

# Git 走 SSH 代理：从 Git 到 nc 的完整链路

`git clone https://github.com/...` 可以直接吃 `http_proxy` / `https_proxy`，但 `git clone git@github.com:...` 不行。

原因不是 Git 不支持代理，而是 **Git 的 SSH 传输把网络连接交给了系统的 `ssh` 命令，而 OpenSSH 客户端原生不读取 `http_proxy` / `https_proxy` 这类环境变量**。它默认只会直接向目标服务器的 22 端口发起 TCP 连接。

要让 Git 的 SSH 流量走代理，核心是给 `ssh` 注入一个 `ProxyCommand`：把“直接建 TCP 连接”换成“启动一个子进程，并通过它的 stdin/stdout 传输数据”。

## 1. 为什么 `http_proxy` 对 SSH 不生效

| 场景 | 底层客户端 | 是否读取 `http_proxy` / `https_proxy` |
| --- | --- | --- |
| `git clone https://github.com/...` | Git 的 HTTP 传输层（libcurl） | 通常会读取 |
| `git clone git@github.com:...` | Git 调用系统 `ssh` | 不读取 |

`https_proxy` 是给 HTTP 客户端用的；

SSH 是另一种协议，OpenSSH 没有“读取系统代理环境变量”的默认行为。即使系统代理软件开着全局代理，`ssh` 也可能绕过它直连 22 端口。

## 2. 整体链路：四层套娃

```text
Git
 │ 调用 ssh（core.sshCommand / GIT_SSH_COMMAND）
 ▼
SSH 客户端
 │ ProxyCommand 启动 nc，把 stdin/stdout 当作网络连接
 ▼
nc
 │ HTTP CONNECT / SOCKS5 握手
 ▼
本地代理 127.0.0.1:7890
 │ TCP
 ▼
GitHub:22
```

各层职责：

| 层 | 职责 | 能看到什么 |
| --- | --- | --- |
| Git | 生成 Git 协议数据，调用 `ssh` | Git 对象、引用、命令 |
| SSH 客户端 | SSH 握手、身份认证、加密/解密 | 本机侧的明文和密文 |
| `nc` | 和代理握手，转发字节流 | 只有 SSH 密文 |
| 本地代理 | 建立到 GitHub:22 的隧道 | SSH 密文 + 目标地址 |
| GitHub | 解密并处理 Git 请求 | 明文 |

## 3. 第一步：Git 只是“换掉 ssh 命令”

Git 自己并没有实现 SSH 协议。执行：

```bash
git clone git@github.com:user/repo.git
```

时，Git 本质上是在后台调用系统的 `ssh` 命令。因此可以通过配置或环境变量，改变 Git 启动 `ssh` 时附带的参数。

### 3.1 `core.sshCommand`

```bash
git config --global core.sshCommand "ssh -o ProxyCommand='nc -X 5 -x 127.0.0.1:7890 %h %p'"
```

这会把 `-o ProxyCommand=...` 注入 Git 调用的 `ssh`。查看当前配置：

```bash
git config --global --get core.sshCommand
```

取消配置：

```bash
git config --global --unset core.sshCommand
```

### 3.2 `GIT_SSH_COMMAND`

只对当前命令生效，适合临时测试：

```bash
GIT_SSH_COMMAND="ssh -o ProxyCommand='nc -X 5 -x 127.0.0.1:7890 %h %p'" \
  git clone git@github.com:user/repo.git
```

### 3.3 三者的区别

| 配置 | 作用范围 | 说明 |
| --- | --- | --- |
| `core.sshCommand` | Git 仓库或全局 | Git 配置，只影响 Git 调用 SSH |
| `GIT_SSH_COMMAND` | 当前进程 | 环境变量，优先级高于 `core.sshCommand`，由 shell 解释 |
| `GIT_SSH` | 当前进程 | 只指定 SSH 程序路径，不能附带参数，能力较弱 |

日常更推荐 `core.sshCommand` 或 `~/.ssh/config`；临时排查用 `GIT_SSH_COMMAND`。

## 4. 第二步：ProxyCommand 把 TCP 连接换成管道

正常情况下，`ssh` 自己建立到 `github.com:22` 的 TCP 连接：

```text
ssh ──TCP──→ github.com:22
```

加上 `-o ProxyCommand="..."` 后，`ssh` 不再自己建连接，而是把后面的命令当作子进程启动，并用子进程的 stdin/stdout 作为网络通道：

```text
ssh ──stdin/stdout──→ nc ──TCP──→ 代理 ──→ GitHub:22
```

OpenSSH 会替换命令中的占位符：

| 占位符 | 含义 | 示例 |
| --- | --- | --- |
| `%h` | 目标主机名 | `github.com` |
| `%p` | 目标端口 | `22` |
| `%r` | 远程用户名 | `git` |
| `%n` | 原始主机名 | `github.com` |

例如：

```text
nc -X 5 -x 127.0.0.1:7890 %h %p
```

会被展开成：

```text
nc -X 5 -x 127.0.0.1:7890 github.com 22
```

最关键的机制是：**`ssh` 把子进程的 stdin/stdout 当成网络连接。**

- `ssh` 要发给 GitHub 的加密数据，直接写入 `nc` 的 stdin。
- `ssh` 从 `nc` 的 stdout 读到的数据，就当成 GitHub 发回来的数据。
- `ssh` 不关心子进程是 `nc`、`socat` 还是另一条 SSH 连接，它只关心“能不能读写字节流”。

因此，`ProxyCommand` 替换的是**传输通道**，不是 SSH 协议本身。SSH 握手、加密、主机密钥验证仍然由 `ssh` 完成。

## 5. 第三步：nc 和代理“接头”

`nc` 在这里扮演翻译和搭桥的角色：它不直接连 GitHub，而是先连本地代理，再按代理协议告诉对方“我要去 `github.com:22`”。

### 5.1 HTTP 代理：`-X connect`

```bash
nc -X connect -x 127.0.0.1:7890 %h %p
```

流程：

1. `nc` 先连接本地代理 `127.0.0.1:7890`。
2. 向代理发送 HTTP CONNECT 请求：

```http
CONNECT github.com:22 HTTP/1.1
Host: github.com:22
```

3. 代理代替客户端连接 `github.com:22`，成功后返回：

```http
HTTP/1.1 200 Connection Established
```

4. 之后代理不再解析 HTTP 内容，而是变成一根透明的 TCP 水管，原封不动地转发字节流。

这就是 **HTTP 隧道（HTTP CONNECT tunneling）**。虽然名字里有 HTTP，但隧道里跑的是 SSH 密文，不是 HTTP 报文。

### 5.2 SOCKS5 代理：`-X 5`

```bash
nc -X 5 -x 127.0.0.1:7890 %h %p
```

流程：

1. `nc` 连接本地 SOCKS5 代理。
2. 双方进行 SOCKS5 版本、认证方式协商。
3. `nc` 发送 CONNECT 请求，告知目标地址 `github.com:22`。
4. 代理连接目标并返回成功，之后同样变成透明 TCP 通道。

SOCKS5 工作在更底层，专门用来转发任意 TCP 流量，不关心上层是 HTTP、SSH 还是别的协议。

### 5.3 `nc` 的变体

不同系统的 `nc` 参数不完全一样：

| 工具 | HTTP 代理 | SOCKS5 代理 |
| --- | --- | --- |
| macOS / BSD `nc`、`netcat-openbsd` | `nc -X connect -x host:port %h %p` | `nc -X 5 -x host:port %h %p` |
| `ncat`（Nmap 自带） | `ncat --proxy host:port --proxy-type http %h %p` | `ncat --proxy host:port --proxy-type socks5 %h %p` |
| 传统 netcat | 可能不支持 `-X` | 可能不支持 `-X` |

如果看到 `nc: invalid option -- X`，说明当前 `nc` 不支持代理参数，换 `ncat` 或 `socat`，或者改用 `~/.ssh/config` 配合其他 ProxyCommand。

## 6. 完整数据流

```text
[ Git ]
  ↕ 进程间通信 stdin/stdout
[ SSH 客户端 ]  <-- 在这里完成 SSH 加密/解密
  ↕ ProxyCommand 重定向 stdin/stdout
[ nc 工具 ]     <-- 和代理握手，建立隧道
  ↕ TCP 连接
[ 本地代理 127.0.0.1:7890 ]  <-- 转发加密后的字节流
  ↕ 代理转发 TCP
[ GitHub 服务器 :22 ]
```

正向：

1. Git 把 Git 协议数据交给 `ssh`。
2. `ssh` 完成 SSH 加密，把密文写入 `nc` 的 stdin。
3. `nc` 通过代理隧道把密文发给代理。
4. 代理转发到 GitHub:22。

反向：

1. GitHub 返回 SSH 密文。
2. 代理把密文转发给 `nc`。
3. `nc` 写到 stdout。
4. `ssh` 从 stdout 读取并解密。
5. Git 得到 Git 协议数据。

## 7. 三种配置方式

### 7.1 Git 全局配置（只影响 Git）

```bash
# HTTP 代理
git config --global core.sshCommand \
  "ssh -o ProxyCommand='nc -X connect -x 127.0.0.1:7890 %h %p'"

# SOCKS5 代理
git config --global core.sshCommand \
  "ssh -o ProxyCommand='nc -X 5 -x 127.0.0.1:7890 %h %p'"
```

### 7.2 临时环境变量（只影响当前命令）

```bash
GIT_SSH_COMMAND="ssh -o ProxyCommand='nc -X 5 -x 127.0.0.1:7890 %h %p'" \
  git clone git@github.com:user/repo.git
```

### 7.3 `~/.ssh/config`（影响所有 SSH 客户端）

```text
Host github.com
  HostName github.com
  User git
  ProxyCommand nc -X 5 -x 127.0.0.1:7890 %h %p
```

这种方式不仅对 Git 生效，对 `ssh`、`scp`、`sftp` 等也生效。`%h` 会展开为 `HostName`，`%p` 会展开为端口（默认 22）。

| 方式 | 作用范围 | 适合 |
| --- | --- | --- |
| `core.sshCommand` | 当前仓库或全局 Git | 只让 Git 走代理 |
| `GIT_SSH_COMMAND` | 当前命令 | 临时测试、不同命令用不同代理 |
| `~/.ssh/config` | 所有 SSH 客户端 | 统一管理多台主机和代理 |

## 8. 排障

### 8.1 先确认代理本身能通

```bash
nc -v -X connect -x 127.0.0.1:7890 github.com 22
```

如果代理正常，通常会看到 SSH banner，例如：

```text
SSH-2.0-...
```

按 `Ctrl+C` 退出即可。

### 8.2 看 SSH 是否真的执行了 ProxyCommand

如果代理写在 `~/.ssh/config` 里：

```bash
ssh -v git@github.com
```

在输出中找：

```text
Executing proxy command: ...
```

如果代理只写在 Git 配置里，`ssh -v` 不会读取 `core.sshCommand`，要用 Git 命令验证：

```bash
GIT_SSH_COMMAND="ssh -v -o ProxyCommand='nc -X 5 -x 127.0.0.1:7890 %h %p'" \
  git ls-remote git@github.com:user/repo.git
```

### 8.3 常见报错

| 现象 | 常见原因 |
| --- | --- |
| `nc: invalid option -- X` | 当前 `nc` 不支持 `-X`，换 `ncat` 或 `socat` |
| `ProxyCommand ... exited with status 1` | 代理没启动、端口填错、`nc` 命令语法错误 |
| `Connection refused` | 本地代理端口不对，或代理没监听 |
| `kex_exchange_identification: Connection closed by remote host` | 代理拒绝 CONNECT，或目标 22 端口被拦截 |
| `Permission denied (publickey)` | 隧道已经通了，问题在密钥或认证 |
| `Host key verification failed` | 主机密钥变化；确认原因后再更新 `known_hosts` |

一个重要的区分：**如果能看到 SSH 的认证错误，说明代理隧道大概率已经通了。** 代理问题通常发生在认证之前，表现为连接被关闭、超时或 `ProxyCommand` 退出。

### 8.4 22 端口被封的另一种思路

如果只是 GitHub 的 22 端口被网络拦截，也可以让 GitHub SSH 走 443 端口：

```text
Host github.com
  HostName ssh.github.com
  Port 443
  User git
```

这是 GitHub 提供的备用 SSH 入口，和“走代理”是两条不同的路，也可以组合使用。

## 9. 安全性说明

本地代理只负责转发原始字节流。由于流量在进入 `nc` 之前就已经被 `ssh` 加密了，所以即使走的是 HTTP 代理，代理服务器也看不到你的 Git 代码和私钥内容。

代理能看到的是：

- 目标地址和端口（例如 `github.com:22`）；
- 连接时间、流量大小、持续时长等元数据；
- 它可以阻断连接，但无法直接解密 SSH 内容。

SSH 的主机密钥验证仍然有效。不要为了“让代理工作”而关闭 `StrictHostKeyChecking`，否则会失去对中间人攻击的防护。

## 10. 一句话总结

**Git 只是把 `ssh` 命令换掉；`ssh` 用 `ProxyCommand` 把 TCP 连接换成子进程管道；`nc` 负责和代理握手建立隧道；代理只转发字节流。SSH 加密在进入 `nc` 之前完成，所以代理看到的始终是密文。**

关联笔记：

- [SSH 远程连接](/tools/shell/ssh)
- [System Proxy / TUN / fake-IP](/tools/developer-tools/proxy-tun-fake-ip)
- [Git 语法](/tools/git/git-basics)
