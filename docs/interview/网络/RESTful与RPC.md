# RESTful API 与 RPC

**一句话:REST 是"面向资源"的架构风格——用 URI 标识资源、用 HTTP 动词表达操作;RPC 是"面向动作"的调用方式——目标是让你像调本地函数一样调远程方法。前者适合对外、面向资源的接口,后者适合内部、追求性能和强类型契约的调用。**

## REST 是什么

Representational State Transfer(Roy Fielding 在 2000 年论文中提出),核心思想:

- **一切都是资源**:URI 是资源的地址
- **HTTP 动词表达操作**:GET / POST / PUT / PATCH / DELETE 映射增删改查
- **无状态**:每个请求自包含,服务端不依赖之前的请求

```http
GET    /users          # 查列表
GET    /users/42       # 查单个
POST   /users          # 创建
PUT    /users/42       # 全量更新
PATCH  /users/42       # 部分更新
DELETE /users/42       # 删除
```

通常跑在 HTTP 上,载荷用 JSON 文本。

## RPC 是什么

Remote Procedure Call,核心思想:**把远程调用伪装成本地函数调用**。

流程:先定义接口契约(IDL,接口描述语言)→ 工具生成客户端/服务端的 stub 代码 → 调用时序列化成二进制通过网络传输。

以 gRPC 为例,先用 protobuf 定义:

```protobuf
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
}
message GetUserRequest { int64 user_id = 1; }
message User { int64 id = 1; string name = 2; }
```

客户端像调本地方法一样调用:

```js
const user = await client.getUser({ userId: 42 });
```

gRPC 跑在 HTTP/2 上,默认用 protobuf 二进制序列化,支持四种模式:单向调用、服务端流、客户端流、双向流。

## 核心区别对比

| 维度 | RESTful API | RPC(以 gRPC 为代表) |
| --- | --- | --- |
| 设计理念 | 面向资源,名词导向 | 面向动作,动词导向(方法调用) |
| 接口契约 | 靠文档/OpenAPI,事后描述,约束弱 | IDL 先行,代码生成,强类型强约束 |
| 序列化 | 通常 JSON(文本) | 二进制(protobuf/thrift),体积小、解析快 |
| 传输 | 通常 HTTP/1.1 | TCP 或 HTTP/2(多路复用、头部压缩) |
| 性能 | 一般 | 高吞吐、低延迟 |
| 浏览器直连 | ✅ fetch 即可 | ❌ 需要 grpc-web + 反向代理转译 |
| HTTP 语义利用 | ✅ GET 可缓存、幂等、CDN 友好 | 基本不利用,都是 POST 语义的调用 |
| 可读性/调试 | curl、浏览器直接看 | 需要专门工具,报文不可读 |
| 流式通信 | 需另配 SSE/WebSocket | 原生支持四种流模式 |
| 跨语言 | 任意语言都能发 HTTP | IDL 生成各语言 stub,天然多语言统一 |

### 两个容易误解的点(面试考点)

- **REST ≠ HTTP API**。很多自称 REST 的接口只是"HTTP + JSON",动词全用 POST、URI 里塞动词(`/getUserById?id=42`),这其实更接近"RPC over HTTP",只是没有 IDL 和二进制序列化。
- **RPC 也能跑在 HTTP 上**(gRPC 就在 HTTP/2 上)。区别的本质不在传输层,而在**建模方式(资源 vs 方法)和契约形式(文档 vs IDL)**。

## 使用场景

### 选 REST

- **对外开放的 API**:第三方开发者用 curl、fetch 就能上手,不用装 SDK。GitHub、Stripe、OpenAI 的公开 API 都是 REST 风格
- **浏览器 / 移动端直接调用**:fetch 天然支持,无需代理层
- **CRUD 型业务**:管理后台、资源管理类服务,资源模型和 HTTP 动词映射自然
- **需要利用 HTTP 基础设施**:GET 的可缓存性(CDN、网关缓存)、幂等语义
- **接口需要人读得懂**:联调、排障成本低

### 选 RPC(gRPC)

- **微服务内部互调**:内部调用方可控,性能和强类型的收益直接,浏览器不友好的缺点无所谓。gRPC 最典型的落地场景
- **低延迟 / 高吞吐**:protobuf 报文比 JSON 小 3~10 倍,序列化快一个量级;HTTP/2 多路复用避免反复建连。交易系统、推荐服务、游戏后端常见
- **多语言团队需要统一契约**:proto 文件就是单一事实来源,改接口 → 编译报错 → 全员感知,而不是运行时才发现字段名拼错
- **需要流式通信**:实时日志推送、双向音视频流、长任务进度上报
- **接口定义先行的开发流程**(contract-first)

### 实践中的常见组合:对外 REST,对内 gRPC

```
浏览器/第三方 ──REST/JSON──> API 网关 ──gRPC──> 内部微服务 A ──gRPC──> B
```

网关层做协议转换(grpc-gateway、Envoy),外部享受 REST 的易用性,内部享受 RPC 的性能和类型安全。

### 顺带一提:GraphQL

当痛点是"REST 接口粒度不合适、前端要来回拼多个请求"时,第三选项是 GraphQL——前端按需查询字段,适合字段多、视图多样、聚合需求强的场景(内容型网站)。但它有自己的复杂度(查询复杂度控制、缓存策略),不是 REST 的简单替代。

## 选型口诀

- 给**外部/浏览器**用、资源型 CRUD → **REST**
- 给**内部服务**用、追求性能与强类型、要流式 → **gRPC / RPC**
- 前端聚合查询痛点明显 → 考虑 **GraphQL**
- 拿不准时:内部新项目默认 gRPC,对外默认 REST,两者并不互斥
