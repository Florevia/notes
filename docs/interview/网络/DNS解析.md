# DNS 解析

**DNS (Domain Name System)** 将人类可读的域名 (如 `baidu.com`) 转换为机器可读的 IP 地址 (如 `220.181.38.148`)。

- **本质**：一个分布式的、分层的数据库。

## 域名层级结构 (The Hierarchy)

域名空间是一个树状结构，从右往左读：

1.  **根域名 (Root Domain)**：`.` (通常省略)，由 ICANN 管理。全世界只有 13 组根服务器。
2.  **顶级域名 (TLD, Top-Level Domain)**：`.com`, `.cn`, `.org`, `.io` 等。
3.  **权威域名 (Authoritative)**：`baidu.com`, `google.com`。由域名注册商或者企业自己维护的 DNS 服务器。
4.  **子域名 (Subdomain)**：`www.baidu.com`, `baike.baidu.com`。

## DNS 解析流程 (面试重点)

递归查询 (Recursive Query) 和 迭代查询 (Iterative Query)。

### 第一阶段：客户端侧（查找缓存）

1. 浏览器缓存： 浏览器先看自己内存里有没有。
2. 系统缓存 (OS Cache)： 也就是 Hosts 文件或系统的 DNS 缓存。
3. 路由器缓存： 路由器如果有缓存也就直接返回了。

### 第二阶段：递归查询（客户端 -> Local DNS）

> 如果本地全没找到，客户端会向配置的 Local DNS 发起请求。

- 这是递归查询：客户端只发一次，等着收 IP。

### 第三阶段：迭代查询（Local DNS -> 全球 DNS 节点）

> 假如 Local DNS 也没有缓存，它就要开始迭代过程：

- 问根域 (Root . )
- 问顶级域 (TLD .com)
- 问权威域 (Authoritative)

### 第四阶段：回传与缓存

1. Local DNS 拿到 IP，先存入自己缓存，然后返回给客户端。
2. 浏览器拿到 IP，开始 TCP 三次握手。
