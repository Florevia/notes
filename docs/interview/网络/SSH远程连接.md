# SSH 远程连接

## 是什么

SSH（Secure Shell）是一种加密的远程登录与命令执行协议，用来在不可信网络上安全地操作另一台机器。

默认走 **TCP 22 端口**，在客户端与服务器之间建立加密通道，认证和数据都走这条通道。

一句话：SSH 就是「加密的远程终端」，也是运维、开发里连服务器、配 Git、做隧道的基础工具。

## 解决什么问题

早期远程工具不加密：

- **Telnet**：远程登录（默认 23 端口），账号密码和命令都是明文。
- **rsh（remote shell）**：远程执行命令，同样基本明文。

SSH 用加密通道 + 身份认证替代它们，避免中间人直接看到密码和会话内容。

## 常见用途

- 远程登录服务器（`ssh user@host`）
- 在远程机器上执行命令（`ssh user@host 'cmd'`）
- 安全传文件（`scp` / `sftp`）
- 端口转发 / 隧道
- Git 等工具的认证与传输（如 `git@github.com:...`）

## 基本工作方式

1. 客户端连上服务器（默认端口 22）
2. 协商加密算法，建立安全通道
3. 身份认证（密码，或更常见的公钥 / 私钥）
4. 之后的 shell、传文件、转发都在加密通道里进行

## 公钥认证

常用 **公钥认证**，比每次输密码更安全、也更适合自动化：

| 位置 | 文件 | 作用 |
| --- | --- | --- |
| 本机 | `~/.ssh/id_ed25519`（私钥） | 证明「我是我」，勿泄露、勿上传 |
| 本机 | `~/.ssh/id_ed25519.pub`（公钥） | 可以给人、可以拷到服务器 |
| 服务器 | `~/.ssh/authorized_keys` | 存放允许登录的公钥列表 |

生成密钥（推荐 ed25519）：

```bash
ssh-keygen -t ed25519 -C "your@email.com"
```

把公钥拷到服务器（任选其一）：

```bash
ssh-copy-id user@host
# 或手动：把 .pub 内容追加到服务器 ~/.ssh/authorized_keys
```

登录时客户端用私钥做证明，服务器用 `authorized_keys` 里的公钥校验，通过即可进 shell。

## 基本操作

### 登录

```bash
ssh username@hostname
# 非 22 端口
ssh -p 2222 username@hostname
# 登上去直接跑一条命令（跑完退出）
ssh username@hostname 'hostnamectl'
```

首次连接会提示确认主机指纹，确认后写入 `~/.ssh/known_hosts`，用来防主机被掉包（MITM）。

### 传文件（走 SSH 通道）

```bash
# 本地 → 远程
scp -r /path/to/local user@host:/path/to/remote

# 远程 → 本地
scp -r user@host:/path/to/remote /path/to/local

# 非 22 端口用 -P（大写）
scp -P 2222 file user@host:/tmp/
```

交互式文件操作用 `sftp user@host`。

### 配置别名（`~/.ssh/config`）

避免每次敲长命令：

```text
Host myserver
    HostName 1.2.3.4
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/id_ed25519
```

之后直接：

```bash
ssh myserver
scp ./dist myserver:/var/www/
```

## 端口转发（隧道）简述

| 类型 | 典型命令 | 用途 |
| --- | --- | --- |
| 本地转发 | `ssh -L 8080:127.0.0.1:80 user@host` | 访问本机 `localhost:8080` ≈ 访问远程的 `80` |
| 远程转发 | `ssh -R 9000:127.0.0.1:3000 user@host` | 让远程侧能转到你本机的服务 |
| 动态转发 | `ssh -D 1080 user@host` | 本机起一个 SOCKS 代理，流量经 SSH 出去 |

面试记一句即可：SSH 隧道 = 把别的 TCP 流量包进已加密的 SSH 连接里。

## 和 Git 的关系

`git@github.com:user/repo.git` 这种地址走的是 **SSH 协议**，不是 HTTPS：

- 用你本机私钥认证（公钥要加到 GitHub / GitLab）
- 传代码内容也在 SSH 加密通道里

代理 / TUN / fake-IP 把 `github.com` 解析成 `198.18.*` 时，SSH（22）容易出问题，见 [System Proxy / TUN / fake-IP](./代理TUN与fake-IP.md)。

## 常见问题

| 现象 | 常见原因 |
| --- | --- |
| `Permission denied (publickey)` | 没用对私钥、服务器没放公钥、权限不对（私钥建议 `600`，`.ssh` 目录 `700`） |
| `Host key verification failed` | `known_hosts` 里旧指纹和当前主机不一致（重装过系统或真被劫持，需确认后再更新） |
| `Connection refused` / 超时 | 22 端口没开、安全组/防火墙拦了、sshd 没起、地址错了 |
| 一直要密码 | 没配公钥，或 `ssh -v` 看发现没用上你以为的那把密钥 |

排障常用：

```bash
ssh -v user@host          # 详细握手日志
ssh -i ~/.ssh/某私钥 user@host
```

## 和 Nginx 部署的边界

用 SSH **登服务器、传文件** 是 SSH 的事；**装 Nginx、写 `server {}`、反代** 是 Web 服务的事，见 [Nginx 配置](./nginx配置详解.md)。

以前这篇后半截把「SSH 登录 → 装 Nginx → 配站点」写成一整条部署教程，容易让人以为 SSH = Nginx——那是串题了。
