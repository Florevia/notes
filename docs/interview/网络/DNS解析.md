# DNS 解析

**DNS (Domain Name System)** 是互联网的电话簿。它将人类可读的域名 (如 `baidu.com`) 转换为机器可读的 IP 地址 (如 `220.181.38.148`)。

- **本质**：一个分布式的、分层的数据库。

## 域名层级结构 (The Hierarchy)

域名空间是一个树状结构，从右往左读：

1.  **根域名 (Root Domain)**：`.` (通常省略)，由 ICANN 管理。全世界只有 13 组根服务器。
2.  **顶级域名 (TLD, Top-Level Domain)**：`.com`, `.cn`, `.org`, `.io` 等。
3.  **权威域名 (Authoritative)**：`baidu.com`, `google.com`。由域名注册商或者企业自己维护的 DNS 服务器。
4.  **子域名 (Subdomain)**：`www.baidu.com`, `baike.baidu.com`。

## DNS 解析流程 (面试重点)

### 第一阶段：本地查找 (递归查询)

客户端只跟 **本地 DNS 服务器 (Local DNS)** 打交道，告诉它：“帮我查查这个 IP 是多少，不查到别回来。”

1.  **浏览器缓存**：浏览器会先检查自己缓存里有没有（Chrome 可通过 `chrome://net-internals/#dns` 查看）。
2.  **操作系统缓存**：检查 OS 的 hosts 文件和 DNS 缓存。
3.  **本地 DNS 服务器 (LDNS)**：如果电脑没存，请求发送到路由器或 ISP（互联网服务提供商）提供的 LDNS（本地域名服务器）。

### 第二阶段：互联网迭代查询

如果 LDNS 也没有，它会代替客户端并在互联网上跑腿（迭代查询）：

1.  **问根 (Root)**：LDNS 问根服务器：“知道 `www.google.com` 在哪吗？”
    - 根回：“不知道，但 `.com` 归这哥们管 (TLD 服务器 IP)。”
2.  **问顶级 (TLD)**：LDNS 去问 `.com` 的 TLD 服务器。
    - TLD 回：“不知道细节，但 `google.com` 归这两个权威服务器管。”
3.  **问权威 (Authoritative)**：LDNS 去问 `google.com` 的权威服务器。
    - 权威回：“找到了！`www.google.com` 的 IP 是 `172.217.160.100`。”

### 第三阶段：返回与缓存

1.  LDNS 拿到 IP，存入自己的缓存（根据 TTL）。
2.  LDNS 把 IP 告诉用户的操作系统。
3.  操作系统存缓存，并告诉浏览器。
4.  浏览器发起 TCP 连接。

## DNS 优化与相关问题

### DNS 劫持

- **现象**：你输入 `baidu.com`，却跳转到了赌博网站。
- **原因**：中间人（如流氓路由器、运营商）篡改了 DNS 响应包，返回了错误的 IP。
- **解决**：使用 HTTPDNS（直接用 HTTP 协议请求 IP，绕过运营商 UDP 劫持），常用于移动端 App。

### DNS Prefetch (预解析)

浏览器的一种优化机制，提前解析网页中可能用到的域名。

```html
<link rel="dns-prefetch" href="//example.com" />
```

### 递归 vs 迭代

- **递归 (Recursive)**：帮人帮到底。客户端 -> LDNS 的过程。
- **迭代 (Iterative)**：指路不带路。LDNS -> 根 -> TLD -> 权威的过程。
