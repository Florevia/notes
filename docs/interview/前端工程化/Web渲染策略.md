# Web 渲染策略：SSG、ISR、SSR、CSR

## 概述

现代 Web 应用有多种渲染策略，每种策略在性能、SEO、开发体验和用户体验上各有优劣。主要包括：

- **CSR** (Client-Side Rendering) - 客户端渲染
- **SSR** (Server-Side Rendering) - 服务端渲染
- **SSG** (Static Site Generation) - 静态站点生成
- **ISR** (Incremental Static Regeneration) - 增量静态再生

## 1. CSR - 客户端渲染

### 1.1 什么是 CSR？

客户端渲染是指 HTML 内容由 JavaScript 在浏览器端动态生成和渲染。

### 1.2 工作流程

1. 浏览器请求 HTML
2. 服务器返回一个几乎空白的 **HTML 骨架** 和 JS 链接
3. 浏览器下载 JS 文件
4. JS 执行，调用 API 获取数据
5. JS 生成 HTML 并插入到 DOM 中
6. 用户看到完整页面

### 1.3 代码示例

**HTML (几乎空白)：**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="bundle.js"></script>
  </body>
</html>
```

### 1.4 优缺点

**优点：**

- ✅ 服务器压力小，只需提供静态文件
- ✅ 前后端分离，开发简单
- ✅ 页面切换流畅，无需重新加载整个页面
- ✅ 适合交互复杂的应用（如 Dashboard、管理后台）

**缺点：**

- ❌ **首屏加载慢**：需要下载 JS、执行 JS、请求 API 后才能看到内容
- ❌ **SEO 不友好**：搜索引擎爬虫可能看不到动态生成的内容
- ❌ 依赖 JavaScript，如果 JS 加载失败，页面无法显示

### 1.5 适用场景

- 后台管理系统
- 不需要 SEO 的应用（如企业内部系统）
- 交互复杂的 SPA

**典型框架：** React (create-react-app)、Vue (Vue CLI)、Angular

## 2. SSR - 服务端渲染

### 2.1 什么是 SSR？

服务端渲染是指 HTML 内容在服务器端生成，浏览器直接获得完整的 HTML。

### 2.2 工作流程

1. 浏览器请求页面
2. 服务器执行 JS，调用 API 获取数据
3. 服务器将数据渲染成完整的 HTML
4. 服务器返回 HTML 给浏览器
5. 浏览器显示 HTML（用户可以看到内容）
6. 浏览器下载 JS 文件
7. JS 执行，进行 "hydration"（激活），绑定事件
8. 页面完全可交互

### 2.3 代码示例

**服务器端 (Next.js 示例)：**

```jsx
// pages/index.js
export default function Home({ data }) {
  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.content}</p>
    </div>
  );
}

// 每次请求时在服务器端执行
export async function getServerSideProps() {
  const res = await fetch("https://api.example.com/data");
  const data = await res.json();

  return {
    props: { data },
  };
}
```

### 2.4 优缺点

**优点：**

- ✅ **首屏加载快**：浏览器直接收到完整 HTML
- ✅ **SEO 友好**：搜索引擎可以直接抓取到完整内容
- ✅ 适合动态内容（如新闻、社交媒体）

**缺点：**

- ❌ **服务器压力大**：每次请求都需要服务器渲染
- ❌ **TTFB 较慢**：服务器需要时间渲染 HTML
- ❌ 页面切换可能需要重新请求（除非结合客户端路由）
- ❌ 部署复杂，需要 Node.js 服务器

### 2.5 适用场景

- 需要 SEO 的动态内容网站（新闻、博客、电商）
- 个性化内容（需要根据用户实时生成）
- 数据实时性要求高的页面

**典型框架：** Next.js (SSR 模式)、Nuxt.js、Angular Universal

## 3. SSG - 静态站点生成

### 3.1 什么是 SSG？

静态站点生成是指在**构建时**（build time）预先生成所有页面的 HTML，部署后直接提供静态文件。

### 3.2 工作流程

```
【构建时】
1. 执行构建命令（如 npm run build）
2. 框架调用 API 获取所有数据
3. 生成所有页面的静态 HTML 文件
4. 输出到 dist/out 文件夹

【运行时】
1. 浏览器请求页面
2. CDN/服务器直接返回预生成的 HTML
3. 浏览器显示内容（非常快）
4. JS 下载并执行，进行 hydration
5. 页面完全可交互
```

### 3.3 代码示例

**Next.js 示例：**

```jsx
// pages/blog/[id].js
export default function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}

// 构建时执行：告诉 Next.js 要生成哪些页面
export async function getStaticPaths() {
  const res = await fetch("https://api.example.com/posts");
  const posts = await res.json();

  const paths = posts.map((post) => ({
    params: { id: post.id.toString() },
  }));

  return { paths, fallback: false };
}

// 构建时执行：获取每个页面的数据
export async function getStaticProps({ params }) {
  const res = await fetch(`https://api.example.com/posts/${params.id}`);
  const post = await res.json();

  return {
    props: { post },
  };
}
```

### 3.4 优缺点

**优点：**

- ✅ **性能最佳**：HTML 预先生成，加载极快
- ✅ **SEO 友好**：完整的静态 HTML
- ✅ **服务器压力小**：只需提供静态文件
- ✅ **安全性高**：没有服务器端代码执行
- ✅ **可部署到 CDN**：成本低，全球分发

**缺点：**

- ❌ **构建时间长**：页面多时构建慢
- ❌ **内容更新慢**：需要重新构建才能更新
- ❌ 不适合动态内容
- ❌ 不适合个性化内容

### 3.5 适用场景

- 文档网站
- 博客
- 营销落地页
- 内容不常变化的网站
- 需要最佳性能和 SEO 的网站

**典型框架：** Next.js (SSG 模式)、Gatsby、VitePress、Hugo

## 4. ISR - 增量静态再生成

### 4.1 什么是 ISR？

ISR 是 SSG 的增强版，允许在 **不重新构建整个站点** 的情况下更新静态页面。

### 4.2 工作流程

```
【构建时】
1. 生成部分页面的静态 HTML

【运行时】
1. 用户请求页面
2. 如果页面存在且未过期，返回缓存的 HTML（极快）
3. 如果页面过期（超过 revalidate 时间）：
   - 先返回旧的 HTML（用户立即看到内容）
   - 后台重新生成新的 HTML
   - 下次请求时返回新的 HTML
4. 如果页面不存在（fallback）：
   - 首次请求时生成 HTML（可能显示 loading）
   - 生成后缓存，后续请求直接使用
```

### 4.3 代码示例

**Next.js 示例：**

```jsx
// pages/blog/[id].js
export default function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
      <p>最后更新: {post.updatedAt}</p>
    </article>
  );
}

export async function getStaticPaths() {
  // 只预生成热门文章
  const res = await fetch("https://api.example.com/popular-posts");
  const posts = await res.json();

  const paths = posts.map((post) => ({
    params: { id: post.id.toString() },
  }));

  // fallback: 'blocking' 表示其他页面首次访问时生成
  return { paths, fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const res = await fetch(`https://api.example.com/posts/${params.id}`);
  const post = await res.json();

  return {
    props: { post },
    revalidate: 60, // 60 秒后重新验证并生成新页面
  };
}
```

### 4.4 revalidate 机制详解

```
时间线示例（revalidate: 60）：

00:00 - 构建完成，生成 HTML
00:30 - 用户 A 访问 → 返回缓存的 HTML（快）
01:00 - 用户 B 访问 → 返回旧 HTML，后台开始重新生成
01:05 - 后台生成完成
01:10 - 用户 C 访问 → 返回新 HTML
```

### 4.4 fallback 选项

```jsx
// fallback: false
// - 只有 paths 中的页面存在，其他返回 404

// fallback: true
// - 首次访问不存在的页面时，先显示 loading 状态
// - 客户端生成页面后显示内容
export default function BlogPost({ post }) {
  const router = useRouter();
  if (router.isFallback) {
    return <div>Loading...</div>;
  }
  return <article>...</article>;
}

// fallback: 'blocking'
// - 首次访问时在服务器端生成（用户等待）
// - 生成后返回完整 HTML（更好的 SEO）
```

### 4.5 优缺点

**优点：**

- ✅ 结合了 SSG 和 SSR 的优点
- ✅ **性能好**：大部分时间返回缓存的静态页面
- ✅ **内容可更新**：按需或定时更新
- ✅ **构建快**：不需要一次生成所有页面
- ✅ **扩展性好**：适合大型网站（数千、数万页面）

**缺点：**

- ❌ 实现复杂
- ❌ 需要支持 ISR 的平台（如 Vercel、Netlify）
- ❌ 内容更新有延迟（revalidate 时间）

### 4.6 适用场景

- 大型电商网站（商品页面）
- 新闻网站（文章页面）
- 博客（文章列表）
- 需要平衡性能和内容时效性的网站

**典型框架：** Next.js（率先推出）

## 5. 对比总结

| 特性              | CSR      | SSR        | SSG           | ISR               |
| ----------------- | -------- | ---------- | ------------- | ----------------- |
| **HTML 生成时机** | 浏览器端 | 每次请求时 | 构建时        | 构建时 + 按需更新 |
| **首屏加载速度**  | ❌ 慢    | ✅ 快      | ✅ 最快       | ✅ 快             |
| **SEO**           | ❌ 差    | ✅ 好      | ✅ 好         | ✅ 好             |
| **服务器压力**    | ✅ 小    | ❌ 大      | ✅ 小         | ✅ 小             |
| **内容更新**      | ✅ 实时  | ✅ 实时    | ❌ 需重新构建 | ✅ 延迟更新       |
| **构建时间**      | ✅ 短    | -          | ❌ 长         | ✅ 短             |
| **部署复杂度**    | ✅ 简单  | ❌ 复杂    | ✅ 简单       | 🟡 中等           |
| **适合页面数**    | 任意     | 中小型     | 小型          | 大型              |

## 6. 如何选择？

### 6.1 决策树

```
需要 SEO 吗？
├─ 否 → CSR
└─ 是
    └─ 内容是否经常变化？
        ├─ 是（实时变化）→ SSR
        └─ 否
            └─ 页面数量多吗？
                ├─ 少（<1000）→ SSG
                └─ 多（>1000）→ ISR
```

## 7. 混合渲染策略

现代框架（如 Next.js）支持在**同一个应用**中混合使用多种策略：

```jsx
// pages/index.js - 首页使用 SSG
export async function getStaticProps() { ... }

// pages/products/[id].js - 商品页使用 ISR
export async function getStaticProps() {
  return { props: {...}, revalidate: 3600 };
}

// pages/dashboard.js - 后台使用 CSR
export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data')... }, []);
  ...
}

// pages/user/[id].js - 用户页使用 SSR
export async function getServerSideProps() { ... }
```

**最佳实践：**

- 首页/落地页 → SSG
- 商品/文章页 → ISR
- 个人中心/后台 → CSR
- 实时数据页 → SSR
