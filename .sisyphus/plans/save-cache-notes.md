# Plan: Save CS Cache Notes

## TL;DR
> **Quick Summary**: Save the detailed explanation of CS architecture cache locations to the documentation notes folder for VitePress visibility.
> 
> **Deliverables**:
> - `docs/notes/缓存位置.md`
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: Sequential

---

## Context
### Original Request
User asked to organize the explanation of CS cache locations into a markdown file and save it as `缓存位置.md`.

### Decisions
- **Location**: `docs/notes/` (Selected by user to ensure visibility in VitePress site)
- **Format**: Markdown with detailed tables and diagrams.

---

## Work Objectives
### Core Objective
Persist the knowledge about Client-Side, Network-Side, and Server-Side caching into the notes repository.

### Definition of Done
- [x] File exists at `docs/notes/缓存位置.md`
- [x] Content includes all 3 layers and the summary table.

---

## Execution Strategy
Single wave execution.

---

## TODOs

- [x] 1. Create Cache Notes File

  **What to do**:
  - Ensure the directory `docs/notes/` exists.
  - Write the detailed content to `docs/notes/缓存位置.md`.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]
    - Reason: Simple file operation in a git repository.

  **Content to Write**:
  
  ````markdown
  # CS 架构缓存位置详解

  在 CS (Client-Server) 架构中，缓存策略的核心思想是 **“让数据离用户更近”** 或 **“让昂贵的计算只做一次”**。

  从用户发起请求到最终从数据库获取数据，整个链路上几乎每一个节点都可以设置缓存。我们可以将其分为三个大层级：**客户端侧**、**网络传输侧**、**服务端侧**。

  ---

  ## 第一层：客户端侧缓存 (Client Side)
  这是离用户最近的地方，访问速度最快（毫秒级甚至微秒级），不消耗服务器资源。

  ### 1. 浏览器/客户端应用缓存
  *   **HTTP 缓存 (强缓存/协商缓存)**
      *   **位置**: 浏览器本地磁盘或内存。
      *   **机制**: 遵循 HTTP 协议头 (`Cache-Control`, `Expires`, `ETag`, `Last-Modified`)。
      *   **场景**: 图片、CSS、JS 文件等静态资源。
  *   **Web Storage (数据存储)**
      *   **位置**: `LocalStorage`, `SessionStorage`, `IndexedDB`, `WebSQL`。
      *   **场景**: 保存用户的 Token、偏好设置、草稿内容、SPA 应用的本地状态。
  *   **Service Worker (PWA)**
      *   **位置**: 运行在浏览器后台的独立线程。
      *   **场景**: 实现离线访问，拦截网络请求并返回自定义缓存，提升弱网体验。
  *   **App 本地数据库**
      *   **位置**: 移动端 App 的 `SQLite`, `Realm`。
      *   **场景**: 微信聊天记录、新闻列表的离线缓存。

  ### 2. 操作系统/DNS 缓存
  *   **DNS 缓存**
      *   **位置**: 浏览器缓存 -> 操作系统 hosts/DNS 缓存。
      *   **作用**: 减少域名解析为 IP 地址的时间。

  ---

  ## 第二层：网络传输侧缓存 (Network Side)
  请求已经离开了客户端，但还没到达你的应用服务器。

  ### 3. CDN 缓存 (Content Delivery Network)
  *   **位置**: 分布在全国/全球的边缘节点服务器。
  *   **机制**: 用户访问资源时，请求会被路由到离用户地理位置最近的 CDN 节点。如果节点有缓存，直接返回；没有则回源站拉取。
  *   **场景**: **静态资源** (图片、视频、前端包) 的分发。现代 CDN 甚至支持边缘计算（Edge Computing）来缓存动态内容。

  ### 4. 反向代理/网关缓存
  *   **位置**: 部署在应用服务器之前的负载均衡层，如 **Nginx**, **Varnish**, **Squid**。
  *   **机制**: Nginx 可以配置 `proxy_cache`。当多个用户请求同一个 URL 时，Nginx 直接返回缓存的 HTML 或 JSON，请求根本不会打到后端的 Java/Go/Python 进程上。
  *   **场景**: 访问量极高且内容变化不频繁的页面（如热点新闻详情页、活动静态页）。

  ---

  ## 第三层：服务端侧缓存 (Server Side)
  请求到达了后端数据中心，这是后端开发最常操作的区域。通常采用 **“多级缓存”** 策略。

  ### 5. 本地缓存 (Local Cache / In-Process Cache)
  *   **位置**: 应用程序的**内存**中（JVM 堆, Node.js Buffer）。
  *   **工具**: **Guava Cache**, **Caffeine**, **Ehcache**, 全局 HashMap 变量。
  *   **优点**: 速度极快（纳秒/微秒级），没有网络开销。
  *   **缺点**:
      *   **容量受限**: 占用应用内存，存多了容易 OOM (Out Of Memory)。
      *   **一致性问题**: 在分布式集群中，服务器 A 的缓存更新了，服务器 B 还是旧的（数据漂移）。
  *   **场景**: 极高频访问且很少变更的小字典数据（如配置开关、省份城市列表）。

  ### 6. 分布式缓存 (Distributed Cache / Remote Cache)
  *   **位置**: 独立部署的缓存中间件集群。
  *   **工具**: **Redis**, **Memcached**。
  *   **机制**: 所有应用服务器共享同一个缓存集群。A 改了数据，B 读取时也是新的。
  *   **优点**: 支持海量数据，支持数据持久化 (Redis)，支持分布式一致性。
  *   **缺点**: 需要一次内部网络 I/O 请求（通常在 1-5ms 左右）。
  *   **场景**: Session 共享、热点业务数据、计数器、排行榜。

  ### 7. 数据库缓存 (Database Cache)
  *   **位置**: 数据库引擎内部。
  *   **机制**:
      *   **Buffer Pool (MySQL InnoDB)**: 数据库会把磁盘上的热点数据页（Page）加载到内存中。下次查询时，直接从内存读，不需要磁盘 I/O。这是数据库性能的关键。
      *   **Query Cache**: (MySQL 8.0 已移除) 缓存 SQL 语句的文本结果。
  *   **注意**: 这一层通常由 DBA 配置，开发人员通过优化 SQL 命中索引来利用它，而不是手动 set/get。

  ---

  ## 总结图谱

  | 缓存位置 | 代表技术/组件 | 速度 | 典型数据 | 控制权 |
  | :--- | :--- | :--- | :--- | :--- |
  | **客户端** | 浏览器缓存, LocalStorage | 极快 (0ms) | 图片, JS, Token | 前端开发 |
  | **网络边缘** | CDN | 快 (10-50ms) | 静态资源 | 运维/架构 |
  | **网关层** | Nginx Proxy Cache | 快 (<10ms) | 静态HTML, 接口 | 运维/后端 |
  | **应用本地** | Caffeine, Guava | 极快 (内存级) | 配置, 极热点数据 | 后端开发 |
  | **分布式** | Redis, Memcached | 较快 (网络级) | 业务对象, Session | 后端开发 |
  | **数据库** | Buffer Pool | - | 原始数据页 | DBA/数据库本身 |

  ### 典型的请求流程（多级缓存击穿路径）
  当一个请求进来时，理想的拦截顺序是：

  1.  **浏览器**：我有缓存吗？有 -> 直接展示。(200 OK form memory/disk)
  2.  **CDN**：边缘节点有吗？有 -> 返回。
  3.  **Nginx**：反向代理有吗？有 -> 返回。
  4.  **应用本地 (Caffeine)**：堆内存有吗？有 -> 返回。
  5.  **Redis**：分布式缓存有吗？有 -> 返回。
  6.  **数据库**：(这是最后一道防线) -> 查询数据 -> **写入 Redis** -> **写入本地缓存** -> 返回。

  > **核心原则**：设计 CS 架构缓存时，**越靠近用户，成本越低，性能越好；越靠近数据库，数据越准确，一致性越强。** 架构师的工作就是在“速度”和“一致性”之间做权衡。
  ````

  **Commit Strategy**:
  - Message: `docs: add CS architecture cache locations note`
  - Files: `docs/notes/缓存位置.md`

  **Verification**:
  - [x] `ls -F docs/notes/缓存位置.md` (Expected: file exists)
  - [x] `cat docs/notes/缓存位置.md | grep "CDN"` (Expected: match found)
