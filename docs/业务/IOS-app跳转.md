# iOS 分享卡片点击跳转 App

## 1. 实际在跳的是什么

跳转发生在**点击分享卡片**这一下，不是先进网页再点「立即打开」。

分享出去的卡片上绑着一条 HTTPS 链接。对方点卡片，系统打开的就是这条链接。这条链接同时是 Universal Link：App 已安装时，iOS 直接把链接交给 App；未安装时，同一条链接在浏览器里打开 Web 页。

```text
分享卡片
（链接、标题、描述、封面）
        ↓
   点击卡片
        ↓
卡片上的 URL
https://share.example.com/product/123
        ↓
      iOS 判断
     /        \
 App 已安装    App 未安装
     ↓            ↓
 直接打开 App   浏览器打开同一条 URL
     ↓            ↓
 商品详情       Web 分享页
 productId=123  （页上可以再引导下载）
```

---

## 2. 卡片 URL 就是 Universal Link

分享时写进卡片的 `link`，必须是要被 App 接管的那条 URL。

```text
分享卡片 link
https://share.example.com/product/123
```

这条 URL 同时承担三件事：

| 角色 | 行为 |
| ---- | ---- |
| 分享卡片链接 | 点击卡片时打开它 |
| Universal Link | 已安装时交给 App |
| Web 分享页 | 未安装时在浏览器里展示内容 |

未安装时不要把这条 URL 302 到 App Store。没装 App 的人点开卡片，应该先看到被分享的内容。下载入口放在这个 Web 页上（商店按钮或 Smart App Banner），作为兜底。

---

## 3. 前置信息

| 参数 | 示例 |
| ---- | ---- |
| Apple Team ID | `ABCDE12345` |
| Bundle ID | `com.example.app` |
| App Store Apple ID | `1234567890` |
| 卡片链接域名 | `share.example.com` |
| 分享路径 | `/product/*`、`/order/*`、`/activity/*` |

AASA 里的 App ID：

```text
TEAM_ID + "." + BUNDLE_ID
ABCDE12345.com.example.app
```

---

## 4. 部署 AASA

在卡片链接的域名上提供：

```text
https://share.example.com/.well-known/apple-app-site-association
```

文件名没有 `.json` 后缀。直接访问要返回 `200`，`Content-Type: application/json`。

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["ABCDE12345.com.example.app"],
        "components": [
          { "/": "/product/*", "comment": "商品分享卡片" },
          { "/": "/order/*", "comment": "订单分享卡片" },
          { "/": "/activity/*", "comment": "活动分享卡片" }
        ]
      }
    ]
  }
}
```

`components` 要覆盖卡片真实路径。写成 `/open/*` 而卡片链接是 `/product/123`，点卡片不会进 App。

这条文件不能被这些东西挡住：

```text
Nginx / CDN rewrite
SPA fallback（返回 index.html）
301 / 302
登录鉴权
```

推荐响应：

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=3600
```

---

## 5. App：Associated Domains

Xcode：

```text
Target → Signing & Capabilities → Associated Domains
```

填写：

```text
applinks:share.example.com
```

不要写成 `https://share.example.com`。

`applinks:` 是 Apple 用来声明 Universal Link 的服务前缀。

---

## 6. App：点卡片之后怎么进页面

已安装时，浏览器通常不会真正请求这个 URL。iOS 把整条链接交给 App，由 App 解析路径再路由。

```text
https://share.example.com/product/123
        ↓
path = /product/123
        ↓
type = product
id = 123
        ↓
ProductDetail(productId: 123)
```

冷启动、后台唤起、前台已打开，三条都要接到同一个路由。`id` 做校验，非法参数降级到安全页，不要直接拼进请求。

---

## 7. 未安装：打开的仍是卡片 URL

Universal Link 不会自己跳 App Store。没有对应 App 时，这条链接就是普通网页：

```text
点击分享卡片
        ↓
https://share.example.com/product/123
        ↓
没有 App 可以接管
        ↓
Safari 打开 Web 分享页
        ↓
页面展示商品内容
        ↓
需要下载时，用户再点页内的 App Store 入口
```

Web 分享页要能独立渲染 `product/123`，不能只放一个「立即打开」然后把路径 302 走。

页内下载可以用 Smart App Banner，它只在已经进入 Safari 之后出现：

```html
<meta
  name="apple-itunes-app"
  content="app-id=1234567890, app-argument=https://share.example.com/product/123"
/>
```

已安装显示 OPEN，未安装显示 VIEW 进商店。`app-argument` 用卡片原链接，这样从 Banner 进 App 时仍能带到 `product/123`。

---

## 8. 多环境

测试、预发、生产用各自的卡片域名，App 里都声明，AASA 也各自部署：

```text
applinks:share-test.example.com
applinks:share-pre.example.com
applinks:share.example.com
```

分享时写入的 `link` 必须和当前环境的域名一致。测试包的 Associated Domains 里没有生产域名时，点生产卡片不会进测试包。

---

## 9. 职责

| 谁 | 做什么 |
| -- | ------ |
| 分享侧 | 把业务 URL 写进卡片 `link` |
| Web | 同一条 URL 在未安装时渲染分享内容，并提供下载入口 |
| 运维 / CDN | 在该域名部署 AASA，保证不被重写和鉴权挡住 |
| iOS | Associated Domains，接收链接并路由到业务页 |

一句话：点的是分享卡片，打开的是卡片上的 URL；这条 URL 配成 Universal Link，装了 App 就进对应页，没装就打开同一条链接的网页。
