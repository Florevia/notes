# HTTP 缓存详解

## 1. 定义

HTTP 缓存是一种存储 HTTP 响应并在后续请求中重用它们的机制。通过在客户端、代理服务器或 CDN 中存储资源副本，HTTP 缓存可以显著减少网络延迟、降低带宽消耗、减轻服务器负载,从而提升 Web 应用的性能和用户体验。

HTTP 缓存遵循 **RFC 9111: HTTP Caching** 标准（2022年发布，替代了 RFC 7234），定义了缓存的存储、验证和重用机制。

## 2. 缓存类型

### 2.1 私有缓存 (Private Cache)
- **定义**: 专用于单个用户的缓存，通常指浏览器缓存
- **特点**: 可以存储个性化内容，如用户特定的页面或数据
- **适用场景**: 用户个人浏览器本地缓存

### 2.2 共享缓存 (Shared Cache)
- **定义**: 可供多个用户共享的缓存，如代理服务器、CDN
- **特点**: 不应存储个性化内容，以防止信息泄露
- **适用场景**: CDN、反向代理、企业网关等

## 3. 工作原理

HTTP 缓存机制主要基于两个核心概念：**新鲜度（Freshness）** 和 **验证（Validation）**。

### 3.1 新鲜度机制

新鲜度决定缓存的响应在无需重新验证的情况下可以使用多长时间。

#### Cache-Control 指令

**响应指令**:
```http
Cache-Control: max-age=3600
```
- `max-age=<seconds>`: 资源被认为是新鲜的最大时间（秒）
- `s-maxage=<seconds>`: 仅用于共享缓存，覆盖 `max-age`
- `no-cache`: 允许缓存存储，但必须先验证后才能使用
- `no-store`: 禁止任何缓存存储响应
- `public`: 响应可被任何缓存存储（包括共享缓存）
- `private`: 响应只能被私有缓存存储
- `must-revalidate`: 过期后必须向源服务器重新验证
- `immutable`: 表示响应永不改变（适用于带版本号的静态资源）

**请求指令**:
```http
Cache-Control: no-cache
Cache-Control: max-age=0
```

#### Expires 头部（传统方式）

```http
Expires: Wed, 21 Oct 2026 07:28:00 GMT
```
- 指定资源过期的绝对时间
- 如果同时存在 `Cache-Control: max-age`，则 `Expires` 会被忽略

### 3.2 验证机制

当缓存的响应过期后，可以通过条件请求验证其是否仍然有效。

#### ETag (实体标签)

**工作流程**:

1. **首次请求**:
```http
GET /api/data HTTP/1.1
Host: example.com
```

**服务器响应**:
```http
HTTP/1.1 200 OK
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Cache-Control: max-age=3600
Content-Type: application/json

{"data": "some content"}
```

2. **后续验证请求**（缓存过期后）:
```http
GET /api/data HTTP/1.1
Host: example.com
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

**如果资源未改变**:
```http
HTTP/1.1 304 Not Modified
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Cache-Control: max-age=3600
```
客户端继续使用缓存内容，无需重新下载。

**如果资源已改变**:
```http
HTTP/1.1 200 OK
ETag: "a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2"
Cache-Control: max-age=3600
Content-Type: application/json

{"data": "updated content"}
```

#### Last-Modified / If-Modified-Since

**工作流程**:

1. **首次请求响应**:
```http
HTTP/1.1 200 OK
Last-Modified: Tue, 15 Nov 2025 12:45:26 GMT
Cache-Control: max-age=3600
```

2. **验证请求**:
```http
GET /resource HTTP/1.1
If-Modified-Since: Tue, 15 Nov 2025 12:45:26 GMT
```

3. **未修改响应**:
```http
HTTP/1.1 304 Not Modified
```

#### 验证器优先级

根据 RFC 2616 规范：
- 如果同时存在 `ETag` 和 `Last-Modified`，HTTP/1.1 客户端**必须**使用 `ETag` 进行验证
- `ETag` 是**强验证器**（保证字节级一致），`Last-Modified` 是**弱验证器**

## 4. 代码示例

### 4.1 Node.js/Express 服务器端实现

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

// 静态资源缓存策略
app.use('/static', express.static('public', {
  maxAge: '1y',  // 一年缓存
  immutable: true
}));

// API 响应带 ETag
app.get('/api/data', (req, res) => {
  const data = { timestamp: Date.now(), value: 'some data' };
  const content = JSON.stringify(data);

  // 生成 ETag
  const etag = crypto.createHash('md5').update(content).digest('hex');

  // 检查客户端 ETag
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // 304 Not Modified
  }

  res.set({
    'ETag': etag,
    'Cache-Control': 'public, max-age=300' // 5分钟缓存
  });
  res.json(data);
});

// 频繁变化的数据：使用 stale-while-revalidate
app.get('/api/news', (req, res) => {
  res.set({
    'Cache-Control': 'max-age=60, stale-while-revalidate=300'
    // 60秒内新鲜，之后300秒内可以返回旧数据但后台更新
  });
  res.json({ news: 'Latest news...' });
});

// 私密数据：禁止缓存
app.get('/api/user/profile', (req, res) => {
  res.set({
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.json({ user: 'sensitive data' });
});
```

### 4.2 Nginx 配置示例

```nginx
# 静态资源缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML 文件不缓存
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# API 接口短时间缓存
location /api/ {
    expires 5m;
    add_header Cache-Control "public, max-age=300";
}
```

### 4.3 Service Worker 缓存策略（PWA）

#### Cache First 策略（静态资源）

```javascript
const CACHE_NAME = 'my-app-v1';
const STATIC_ASSETS = [
  '/',
  '/styles.css',
  '/script.js',
  '/logo.png'
];

// 安装时预缓存
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Cache First 策略
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse; // 缓存命中
          }
          // 缓存未命中，从网络获取
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});
```

#### Network First 策略（动态内容）

```javascript
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // 网络成功，更新缓存
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return networkResponse;
        })
        .catch(() => {
          // 网络失败，使用缓存
          return caches.match(event.request);
        })
    );
  }
});
```

#### Stale-While-Revalidate 策略（使用 Workbox）

```javascript
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// API 缓存：立即返回缓存，后台更新
registerRoute(
  /\/api\/.*\.json/,
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5分钟过期
      })
    ]
  })
);

// 图片缓存：优先缓存
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif)$/,
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
      })
    ]
  })
);
```

### 4.4 客户端 Fetch API 缓存控制

```javascript
// 强制从缓存读取
fetch('/api/data', {
  cache: 'force-cache'
});

// 绕过缓存
fetch('/api/data', {
  cache: 'no-cache'
});

// 仅使用缓存，不发网络请求
fetch('/api/data', {
  cache: 'only-if-cached',
  mode: 'same-origin'
});

// 默认行为：优先使用缓存
fetch('/api/data', {
  cache: 'default'
});

// 重新验证缓存
fetch('/api/data', {
  cache: 'reload' // 跳过缓存，并更新缓存
});
```

## 5. 优缺点

### 5.1 优点

1. **性能提升**
   - 减少网络延迟，加快页面加载速度
   - 降低首屏渲染时间（FCP、LCP 等核心性能指标）

2. **带宽节省**
   - 减少重复数据传输
   - 降低流量成本（对移动用户尤其重要）

3. **服务器负载降低**
   - 减少服务器请求数量
   - 降低服务器 CPU 和带宽压力

4. **离线可用性**
   - 配合 Service Worker 实现离线访问
   - 提升 PWA 应用体验

5. **可扩展性**
   - 通过 CDN 和边缘缓存提升全球访问速度
   - 支持高并发访问

### 5.2 缺点

1. **内容新鲜度问题**
   - 过度缓存可能导致用户看到过期内容
   - 需要合理设置缓存策略

2. **缓存失效复杂性**
   - 更新资源时需要处理缓存失效
   - 可能需要版本化 URL（如 `style.v2.css`）

3. **存储空间占用**
   - 浏览器缓存占用用户磁盘空间
   - 需要合理设置缓存大小限制

4. **调试困难**
   - 缓存可能导致开发时看不到最新更改
   - 需要频繁清除缓存

5. **隐私问题**
   - 共享缓存可能泄露用户访问信息
   - 需要正确使用 `private` 指令

## 6. 适用场景

### 6.1 长期缓存（Immutable）
```http
Cache-Control: public, max-age=31536000, immutable
```
**适用资源**:
- 带版本号或哈希值的静态资源（`app.a1b2c3.js`）
- 不变的图片、字体、视频

### 6.2 短期缓存（max-age）
```http
Cache-Control: public, max-age=300
```
**适用资源**:
- 半静态内容（博客文章、产品列表）
- API 响应（非实时数据）

### 6.3 必须验证（no-cache）
```http
Cache-Control: no-cache
```
**适用资源**:
- HTML 入口文件
- 需要保证相对新鲜的内容

### 6.4 禁止缓存（no-store）
```http
Cache-Control: private, no-cache, no-store, must-revalidate
```
**适用资源**:
- 用户敏感信息（个人资料、银行信息）
- 实时数据（股票价格、聊天消息）
- 一次性令牌、验证码

### 6.5 Stale-While-Revalidate
```http
Cache-Control: max-age=60, stale-while-revalidate=86400
```
**适用资源**:
- 新闻资讯、社交媒体动态
- 可以容忍短暂过期的动态内容

## 7. 与相关知识点对比

### 7.1 HTTP 缓存 vs 浏览器缓存

| 特性 | HTTP 缓存 | 浏览器存储 (LocalStorage/IndexedDB) |
|------|-----------|-------------------------------------|
| **控制方** | 服务器通过 HTTP 头控制 | 前端 JavaScript 完全控制 |
| **适用范围** | HTTP 请求/响应 | 任意数据 |
| **容量** | 浏览器自动管理 | LocalStorage ~5-10MB，IndexedDB 更大 |
| **生命周期** | 由 Cache-Control 决定 | 永久存储（除非手动删除） |
| **跨域** | 遵循同源策略 | 严格同源 |

### 7.2 HTTP 缓存 vs CDN 缓存

| 特性 | 浏览器 HTTP 缓存 | CDN 缓存 |
|------|-----------------|----------|
| **位置** | 用户本地浏览器 | 边缘节点服务器 |
| **作用范围** | 单个用户 | 区域内多个用户 |
| **控制指令** | `private`, `max-age` | `public`, `s-maxage` |
| **失效机制** | 自然过期或手动清除 | 主动清除（Purge API） |

### 7.3 强缓存 vs 协商缓存

| 类型 | 控制方式 | 是否发请求 | 状态码 |
|------|---------|-----------|--------|
| **强缓存** | `Cache-Control: max-age`<br>`Expires` | 不发请求，直接使用缓存 | 200 (from cache) |
| **协商缓存** | `ETag` / `If-None-Match`<br>`Last-Modified` / `If-Modified-Since` | 发请求验证 | 304 Not Modified（未改变）<br>200（已改变） |

### 7.4 ETag vs Last-Modified

| 特性 | ETag | Last-Modified |
|------|------|---------------|
| **精确度** | 内容哈希，精确到字节 | 时间戳，精确到秒 |
| **验证强度** | 强验证器 | 弱验证器 |
| **服务器成本** | 需要计算哈希（较高） | 读取文件时间（较低） |
| **适用场景** | 内容频繁变化、需要精确验证 | 文件修改时间可靠 |
| **优先级** | 高（HTTP/1.1 必须优先使用） | 低 |

## 8. 最佳实践

### 8.1 资源版本化策略
```html
<!-- 使用哈希值确保缓存更新 -->
<link rel="stylesheet" href="/css/styles.a1b2c3d4.css">
<script src="/js/app.e5f6g7h8.js"></script>
```

### 8.2 分层缓存策略
```javascript
// HTML: 不缓存，始终获取最新
Cache-Control: no-cache

// CSS/JS: 长期缓存（带哈希）
Cache-Control: public, max-age=31536000, immutable

// API: 短期缓存 + 验证
Cache-Control: public, max-age=60, must-revalidate

// 用户数据: 禁止缓存
Cache-Control: private, no-store
```

### 8.3 使用 Service Worker 增强控制
```javascript
// 结合 HTTP 缓存和 SW 缓存
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 优先返回 SW 缓存
      if (response) return response;

      // 否则正常请求，让 HTTP 缓存生效
      return fetch(event.request);
    })
  );
});
```

### 8.4 开发环境禁用缓存
```javascript
// webpack.config.js
devServer: {
  headers: {
    'Cache-Control': 'no-store'
  }
}
```

## 9. 参考资源

### 官方文档
- [RFC 9111: HTTP Caching](https://httpwg.org)
- [MDN - HTTP Caching](https://mozilla.org)
- [MDN - Cache-Control](https://mozilla.org)
- [MDN - Conditional Requests](https://mozilla.org)
- [MDN - Service Worker API](https://mozilla.org)

### 相关标准
- RFC 9111: HTTP Caching (2022)
- RFC 5861: HTTP Cache-Control Extensions for Stale Content
- RFC 7234: HTTP/1.1 Caching (已被 RFC 9111 替代)

### 扩展阅读
- [Chrome Developer - Service Worker Caching Strategies](https://chrome.com)
- [Web.dev - HTTP Caching Best Practices](https://web.dev)
- [Workbox - PWA Caching Library](https://js.org)

---

**最后更新**: 2026-01-10
