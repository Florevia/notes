# JWT (JSON Web Token)

目前现代 Web 开发（尤其是前后端分离和微服务架构）中最主流的认证方案

## 基本原理

- 核心作用： 用于在各方之间以 **JSON 对象**安全地传输信息。

- 核心特点： 无状态 (Stateless)。

  - 服务器不需要在内存或数据库中保存 Session 信息，只需要验证 Token 的签名（Signature）是否合法即可。
  - 因为 JWT 不依赖 Cookie 机制，而是通过 HTTP Header 显式传输，从而避开了浏览器对 Cookie 严格的跨域限制

- 结构： 一个 JWT 字符串由三个部分组成，用 `.` 连接：`Header.Payload.Signature`
  - `Header` (头部)： 声明算法（如 HS256）和类型（JWT）。
  - `Payload` (负载)： 存放实际数据（Claims）。如用户 ID (sub)、过期时间 (exp)、签发时间 (iat) 等。注意：这是 Base64 编码的，不是加密的。
  - `Signature` (签名)： 使用服务器独有的密钥 (Secret) 对**前两部分进行加密签名**，用于防止数据被篡改。
    - 生成公式： Hash(Header + "." + Payload, SecretKey)
    - 原理： 只有服务器知道 SecretKey（密钥）。如果黑客篡改了 Payload 里的数据（比如把普通用户改成管理员），由于他不知道密钥，他算出来的签名和原本的签名就会对不上，服务器一验就发现是假的。

demo

```json
header: {
    "alg": "HS256",
    "typ": "JWT"
}
payload: {
    "sub": "1234567890",
    "name": "John Doe",
    "admin": true
}
```

## 应用场景

### 授权认证

- 流程：

  - 用户登录
  - 服务端校验账号密码
  - 生成 JWT 返回给前端
  - 前端存起来
  - 后续请求在 `Header (Authorization: Bearer <token>)` 中携带
  - 服务端验证签名放行

- 优势：
  - 跨域友好： 完美解决 Cookie 跨域限制问题。
  - 支持移动端： App 开发原生支持较好。
  - 微服务架构： 只需要在网关层校验 Token，下游服务直接解析 Payload 获取用户信息，无需频繁查询数据库或共享 Session。

### 交换信息

用于一次性的安全信息传递。

- 激活邮件链接

- 密码重置链接

  - 因为 JWT 有签名，接收方可以确信发送方是谁，且内容没有被修改。

## 鉴权流程

  1. 登录 (Login)：

     - 用户在前端输入账号密码，发送 POST 请求给服务端。

  2. 签发 (Sign)：

     - 服务端校验账号密码成功。
     - 服务端使用密钥将用户信息（ID、Role）和过期时间打包，生成一个 JWT 字符串。
     - 服务端将 JWT 返回给前端。

  3. 存储 (Store)：

     - 前端拿到 JWT，通常存储在 localStorage 或 sessionStorage 中（也可以是 Cookie）。

  4. 携带 (Carry)：

     - 前端再次请求受保护的接口时，在 HTTP 请求头中携带 Token。
     - 标准格式： `Authorization: Bearer <token>`

  5. 校验 (Verify)：

     - 服务端中间件拦截请求，解析 Token。
     - 验签： 用密钥重新计算签名。如果通过，且 Token 未过期，则放行，并将 Payload 中的 UserID 挂载到 request 对象上。

  6. 响应 (Response)：

     - 后端业务逻辑处理完毕，返回数据

## 注意事项 (面试高频考点)

1. Payload 不存放敏感信息

   - 原因： Payload 只是 Base64 编码，任何人都可以解码看到里面的内容。
   - 做法： 绝对不要在 JWT 里放用户的密码、手机号等隐私数据。只放 UserID 或 权限等级。

2. Token 撤销/失效困难 (最大的缺点)

   - 问题： 因为服务端不存状态，一旦 JWT 签发，在到期之前它一直有效。哪怕用户改了密码或被封号，旧的 Token 依然能用。

   - 解决方案：

     - 黑名单机制： 将注销的 Token 存入 Redis（牺牲了一定的“无状态”优势）。
     - 版本号机制： 在 Token Payload 中加入 token_version，用户改密码时修改数据库版本号，验证时对比。
     - 短过期时间： 让 Access Token 只有 15 分钟有效期。

3. 双 Token 机制 (Access Token + Refresh Token)

   - 背景： 为了解决“安全”与“用户体验”的矛盾（Token 设置太短需频繁登录，太长不安全）。

   - 做法：

     - Access Token： 有效期短（如 15 分钟），用于请求接口。
     - Refresh Token： 有效期长（如 7 天），仅用于在 Access Token 过期时换取新的 Token。

   - 优势： 这样即使 Access Token 被盗，攻击窗口期也很短；如果 Refresh Token 被盗，服务端可以随时作废它。

4. 存储位置的选择 (XSS vs CSRF)

   - 存 localStorage/sessionStorage：

     - 优点： 使用方便，自动抗 CSRF 攻击（因为脚本无法自动携带）。
     - 缺点： 容易被 XSS 攻击窃取（JS 可以读取）。

   - 存 HttpOnly Cookie：

     - 优点： 抗 XSS（JS 读不到）。
     - 缺点： 容易受 CSRF 攻击（需配合 CSRF Token 防御）。

   - 建议： 现代主流做法通常是存 localStorage，但必须严格防范 XSS（过滤输入、CSP 等）。

5. 必须使用 HTTPS

   JWT 在网络中传输是明文的（Base64），如果不用 SSL/TLS 加密通道，很容易被中间人抓包截取。
