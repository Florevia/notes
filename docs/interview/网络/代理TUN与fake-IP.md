# System Proxy、TUN 与 fake-IP

## 现象

```text
git pull
Connection closed by 198.18.0.58 port 22
fatal: Could not read from remote repository.
```

远程是 SSH 地址，例如：

```text
git@github.com:user/repo.git
```

此时本机解析结果往往是：

```bash
dig +short github.com
# 198.18.0.58
```

`198.18.0.0/15` **不是** GitHub 的公网地址，而是代理客户端（Clash / Surge 等）在 **TUN + fake-IP** 下分配的本地假 IP。报错里「关掉连接」的其实是本机 TUN/假 IP 栈，不是真正的 GitHub 服务器。


## 两种网络状态对比

| 模式 | DNS 常见结果 | 流量怎么走 | `git` SSH（22）常见表现 |
|------|--------------|------------|-------------------------|
| System Proxy | 多半真 IP | 仅「认系统代理」的 App 走代理；终端 SSH **默认不走** HTTP 代理 | 常表现为「能用」——其实多半在直连碰运气，或你实际用了 HTTPS |
| TUN + fake-IP | `198.18.*` 假 IP | **几乎所有流量**（含 SSH）进代理栈 | 假 IP 映射/分流/节点对 22 不友好时，易被本机直接掐断 |


## System Proxy 为什么「开了就没事」

- 系统代理主要影响会读 **HTTP/HTTPS/SOCKS 代理设置** 的程序（浏览器等）。
- 终端里的 `ssh` / `git@host` **默认不读**系统 HTTP 代理，而是直连目标 IP。
- 所以常见错觉是：开着 System Proxy，网页走代理，`git pull`（SSH）其实在直连——直连偶发能通，就觉得「代理没问题」。

它解决的是：**认代理的程序**如何出国；并不从机制上保证 SSH 也走同一条路。

---

## TUN 为什么更容易搞挂 Git SSH

1. TUN 在网卡层劫持流量，**SSH 也逃不掉**。
2. 常配合 **fake-IP**：先解析成 `198.18.*`，再由代理查表还原域名并转发。
3. 中间任一步失败（映射丢失、规则拒连、节点不转 22、非 HTTP 嗅探失败），就会变成：

   `Connection closed by 198.18.x.x port 22`

## 为什么开了 TUN，解析到的就是假 IP？

 **故意设计**

### 正常 DNS

```text
github.com → 20.205.243.166（真地址）
```

### fake-IP DNS

```text
github.com → 198.18.0.58（本地占位符）
同时内存记表：198.18.0.58 ↔ github.com
```

`198.18.0.0/15` 本就留给基准测试等用途，代理拿来当标签，避免和公网真 IP 冲突。

### 为什么需要假 IP

TUN 要拦所有 TCP/UDP。很多程序的流程是：

1. DNS 拿到 IP  
2. 之后**只拿 IP 去连**，不再带域名  

若返回真 IP，代理只看见 `连接 20.x.x.x:443`，很难套用 `DOMAIN-SUFFIX,github.com` 这类规则。

假 IP 的好处：

- 程序连 `198.18.0.58`
- 代理查表知道是 `github.com`
- 再按**域名**分流，并去连真正的目标

**假 IP 是给代理用的标签，不是给你直连用的。**


## 和 Git 相关的实用处理

任选其一即可改善 TUN 下的 Git SSH：

1. 对 `github.com` / `ssh.github.com` 设 **DIRECT（直连）**（若直连本身可用）
2. 关掉对该域名的 fake-IP，或 DNS 改用 `redir-host`（返回真实 IP；部分按域名分流会变弱）
3. 远程改 HTTPS：  
   `git remote set-url origin https://github.com/USER/REPO.git`
4. SSH 走 443：使用 `ssh.github.com:443`（需配 `~/.ssh/config`）
   
快速自检：改完网络后，`dig +short github.com` **不应**再以 `198.18.` 开头（若你希望走真实解析）。
