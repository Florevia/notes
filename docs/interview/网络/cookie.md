# cookie

Cookie 是服务器发送到用户浏览器并保存在本地的一小块数据（文本文件）

## 格式

`name=value; Expires=date; Path=/; Domain=site.com; Secure; HttpOnly`

数据 + 生命周期 + 作用域 + 安全性

## 本质

它是为了解决 HTTP 协议无状态 (Stateless) 导致的会话保持问题而诞生的，用于会话状态管理。

## 机制

1. 服务端在响应头中通过 Set-Cookie 字段把数据发给浏览器。

2. 浏览器保存下来。

3. 下次浏览器请求同一个域名时，会自动在请求头中带上 Cookie 字段发送给服务端。

## 核心作用

- 会话状态管理（最主要）： 如用户登录状态（Session ID）、购物车内容。

- 个性化设置： 用户自定义的主题、语言偏好。

- 行为追踪： 分析用户行为（埋点），用于广告推荐。

## 关键属性（面试重点 - 安全相关）

如何配置 Cookie 来保证安全?

1. `HttpOnly`：

   1. 设置为 true 后，禁止 JavaScript 读取（即 document.cookie 无法访问）。
   2. 意义： 有效防御 XSS（跨站脚本攻击），防止攻击者偷走 Session ID。

2. `SameSite` (Strict / Lax / None)：

   1. 作用： 限制第三方 Cookie 的发送。
   2. 意义： 有效防御 CSRF（跨站请求伪造） 攻击。现代浏览器（Chrome）默认为 Lax。

3. `Secure`：

   作用： 仅允许在 HTTPS 安全连接下传输 Cookie。

4. `Domain` 和 `Path`：

   作用： 限制 Cookie 的作用域（即在哪些域名和路径下才发送）。

5. `Expires` / `Max-Age`：

   作用： 控制 Cookie 的有效期。不设则为会话 Cookie（关闭浏览器即失效），设了则为持久 Cookie。

## 缺陷与限制

随着技术发展，Cookie 的存储功能逐渐被 Web Storage 替代：

1. 容量极小： 只有 4KB 左右。

2. 性能开销大： 同域名的每一次 HTTP 请求（包括图片、CSS 资源）都会自动携带 Cookie。如果 Cookie 存的数据太多，会严重浪费带宽，影响请求速度。

3. 安全性问题： 纯明文传输，如果不用 HTTPS 容易被截获；如果不设置 HttpOnly，容易被 XSS 攻击窃取。

## 设置 cookie

```js
// 后端接口代码
app.get("/login", (req, res) => {
  // 假设登录验证通过

  // res.cookie(name, value, [options])
  res.cookie("token", "xyz_header_payload_signature", {
    maxAge: 1000 * 60 * 60 * 24, // 24小时 (毫秒)
    httpOnly: true, // 开启 HttpOnly，前端 JS 无法读取，防 XSS
    secure: true, // 仅 HTTPS
    path: "/", // 全站有效
  });

  res.send("登录成功");
});
```
