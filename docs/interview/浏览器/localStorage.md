# localStorage vs sessionStorage

localStorage 和 sessionStorage 统称为 Web Storage，是 HTML5 引入的本地存储机制。

## localStorage

- 生命周期： 永久有效。除非用户 **手动清除浏览器缓存** 或 **通过 JS 代码执行 `clear()`**，否则数据永远不会消失，即使关闭浏览器后再打开也在。
- 作用范围： 同源文档共享（同一个域名的所有窗口/标签页都能访问）。

## sessionStorage

- 生命周期： 仅在当前会话下有效。数据只存在于 **当前标签页**，一旦关闭该标签页或窗口，数据就会被清除。（注意：刷新页面不会清除数据）。
- 作用范围： 仅限于 **当前标签页**。即使是同一个页面的不同标签页，数据也是隔离的。

## cookie

- 作用范围： 同源文档共享。
- 大小限制： 4KB。
- 数据流向： 每次请求都会携带。
- 易用性： 差 (需解析字符串)。
- 典型应用： Session ID, Token (鉴权)。

## 总结对比

| 特性         | Cookie                    | localStorage                 | sessionStorage         |
| :----------- | :------------------------ | :--------------------------- | :--------------------- |
| **数据流向** | 每次请求都会携带          | 仅存于本地                   | 仅存于本地             |
| **大小限制** | 4KB                       | ~5MB                         | ~5MB                   |
| **生命周期** | 可设过期时间 / 默认会话级 | 永久                         | 标签页关闭即失效       |
| **易用性**   | 差 (需解析字符串)         | 好 (原生 API)                | 好 (原生 API)          |
| **典型应用** | Session ID, Token (鉴权)  | 换肤设置, 购物车数据(未登录) | 表单分步填写, 临时状态 |

## 优缺点

### 关于安全性 (Security)

- XSS 攻击：
  - LocalStorage 和 SessionStorage 都可以被 JS 读取。如果页面被注入了恶意脚本（XSS），攻击者可以轻松拿走里面的 Token。

- Cookie 的 HttpOnly：
  - Cookie 有一个属性 HttpOnly。设置了它，JS 就读不到 Cookie 了，这能有效防御 XSS 盗取 Token。所以，敏感的鉴权 Token 建议存 Cookie (配合 HttpOnly)，而不是 LocalStorage。

### 关于“与服务器交互” (网络性能)

- Cookie 的缺陷：
  - 它会随每个 HTTP 请求发送，如果 Cookie 存了太多数据，会造成巨大的带宽浪费和性能损耗。

- Storage 的优势：
  - Web Storage 纯粹服务于客户端，除非你主动用 JS 取出来发给后端，否则不会占用网络流量。
