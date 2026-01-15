# session

Session（会话） 是一种服务器端的状态管理机制。

## 本质

- 服务器端存储

- 通过 cookie 存储 session id

## 工作原理

- 创建： 用户首次访问或登录成功后，服务器会在服务端生成一个唯一的 Session 对象，并为它分配一个唯一的标识符，称为 Session ID。

- 传递： 服务器通过 HTTP 响应头（通常是 Set-Cookie），将这个 Session ID 发送给浏览器。

- 存储： 浏览器收到后，默认会将 Session ID 保存在 Cookie 中。

- 识别： 当用户再次发送请求时，浏览器会自动在 HTTP 请求头中带上包含 Session ID 的 Cookie。

- 读取： 服务器收到请求，提取 Session ID，在内存或数据库中查找对应的 Session 对象，从而识别用户身份。

## 存储位置

- 客户端： 只存储 Session ID（通常在 Cookie 中，也可以在 URL 或 Header 中，但 Cookie 最常用）。

- 服务器端： 存储 实际数据（User Info, Data）。

  - 内存：速度快，但服务器重启数据会丢失，且不适合多台服务器集群。

  - 数据库/文件：持久化，但读写慢。

  - Redis (缓存)：这是目前企业的最佳实践。速度快，支持持久化，且方便多台服务器共享 Session。

## 安全性与控制 (Security)

- HttpOnly： 设置为 true，禁止 JavaScript (document.cookie) 访问 Session ID，防止 XSS (跨站脚本攻击) 窃取 Session。

- Secure： 设置为 true，强制只在 HTTPS 协议下传输 Session ID。

- SameSite： 用来限制第三方 Cookie 的发送，防止 CSRF (跨站请求伪造) 攻击。

- 过期时间： Session 通常有有效期限（比如 30 分钟无操作自动过期），以降低安全风险。

demo

```js
const express = require("express");
const session = require("express-session");
const app = express();

// 配置 Session 中间件
app.use(
  session({
    secret: "my_secret_key", // 用于加密 Session ID 的密钥
    resave: false, // 即使 Session 没变化，也重新保存
    saveUninitialized: true, // 是否保存未初始化的 Session
    cookie: {
      secure: false, // HTTPS 环境下设为 true
      maxAge: 30 * 60 * 1000, // 有效期 30 分钟
      httpOnly: true, // 禁止 JS 访问 Cookie (防止 XSS)
    },
  })
);

// 1. 登录：生成 Session
app.get("/login", (req, res) => {
  // 假设用户认证成功
  req.session.user = { id: 101, username: "admin" };
  // express-session 会自动将 Session ID 写入响应头 Set-Cookie
  res.send("登录成功");
});

// 2. 访问受保护接口：读取 Session
app.get("/admin", (req, res) => {
  // 浏览器会自动带上 Cookie (Session ID)
  // express-session 会根据 ID 查找 session 数据并挂载到 req.session
  if (req.session.user) {
    res.send(`欢迎回来，${req.session.user.username}`);
  } else {
    res.status(401).send("未登录");
  }
});

// 3. 退出：销毁 Session
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid"); // 清除客户端 Cookie
    res.send("退出成功");
  });
});

app.listen(3000);
```

## 如何消除 Session (释放压力)

由于 Session 存储在服务端，如果无限增长会耗尽内存或磁盘。通常有以下几种消除（销毁）Session 的时机和策略：

1.  **被动超时**

    - **原理**：这是最主要的消除方式。给 Session 设置一个有效时间 (TTL, Time To Live)。
    - **时机**：每次用户请求时，服务器检查最后访问时间。如果 `(当前时间 - 最后访问时间) > 30分钟`，则视作过期，直接销毁。
    - **实现**：通常在中间件配置 `maxAge`。Redis 等存储自带 TTL 功能，过期自动删除数据。

2.  **主动注销**

    - **原理**：用户点击“退出登录”。
    - **时机**：用户触发退出接口。
    - **实现**：服务器调用 `session.destroy()` 立即删除服务端数据，并清除客户端 Cookie。

3.  **定期清理**

    - **原理**：如果 Session 存在文件或数据库中，且不像 Redis 那样有自动过期机制。
    - **时机**：后台开启定时任务或以一定概率（如 1/1000 请求）触发清理。
    - **实现**：扫描数据库/文件目录，删除那些 `LastModified < (Now - 30min)` 的记录。

4.  **服务器重启 (非持久化时)**
    - 如果 Session 存在内存中（默认模式），服务器重启或进程崩溃，所有 Session 瞬间消失（生产环境应避免这种情况）。

## Session 与 Token (JWT) 的区别

| 特性       | Session                                      | Token (如 JWT)                                |
| ---------- | -------------------------------------------- | --------------------------------------------- |
| 状态存储   | 服务端存储 (有状态)                          | 客户端存储 (无状态，数据在 Token 里)          |
| 服务器压力 | 随用户量增加，内存/存储压力大                | 服务器不存数据，只需计算验签，压力小          |
| 可扩展性   | 较差，集群环境需要做 Session 共享 (如 Redis) | 极好，天生支持分布式/微服务                   |
| 安全性     | 相对容易控制 (服务端可随时销毁 Session)      | 一旦签发，难以在过期前强制失效 (需配合黑名单) |
