# Vite 配置文件详解 (vite.config.js)

## 1. 基础依赖导入

```javascript
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vite'
```

- **作用**: 导入 Node.js 内置模块（用于路径处理）和 Vite 的核心配置定义函数。
- **原理**: `vite.config.js` 运行在 Node.js 环境中，在 Vite 启动时被读取。

## 2. 插件配置 (Plugins)

Vite 通过插件扩展其构建和开发能力。

### 2.1 Vue 支持

```javascript
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
// ...
plugins: [vue(), vueDevTools(), ...]
```

- **vue()**:
  - **作用**: 支持 `.vue` 单文件组件 (SFC)。
  - **原理**: 拦截 `.vue` 文件请求，使用 `@vue/compiler-sfc` 编译 `<template>`, `<script>`, `<style>` 为 JS 模块，并注入 HMR（热更新）代码。
- **vueDevTools()**: 集成 Vue 官方调试工具。

### 2.2 自动导入 (Unplugin)

```javascript
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// ...
plugins: [
  AutoImport({ resolvers: [ElementPlusResolver()] }),
  Components({ resolvers: [ElementPlusResolver()] }),
  // ...
]
```

- **作用**: 实现 API 和组件的**按需自动导入**。
  - 无需手动 `import { ElButton } from 'element-plus'`，直接使用 `<el-button>`。
- **原理**:
  - 编译时通过 AST 或正则分析代码。
  - 检测到未定义的组件或 API 时，根据 Resolver 自动生成 import 语句。
  - **Tree Shaking**: 确保只打包使用到的代码，减小体积。

### 2.3 SVG 图标处理

```javascript
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
// ...
createSvgIconsPlugin({
  iconDirs: [path.resolve(process.cwd(), 'src/icons/svg')],
  symbolId: 'icon-[name]',
})
```

- **作用**: 将 `src/icons/svg` 下的所有 SVG 打包成**SVG Sprite (雪碧图)**。
- **原理**:
  - 扫描指定目录 SVG 文件。
  - 转换为 HTML `<symbol>` 标签并注入到 `index.html` 的 `<body>` 中。
  - 页面通过 `<svg><use xlink:href="#icon-name"></use></svg>` 复用，极大减少 HTTP 请求数。

## 3. 路径别名 (Resolve)

```javascript
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
}
```

- **作用**: 允许在代码中使用 `@` 代替 `src` 绝对路径（如 `@/components/Abc.vue`）。
- **原理**: Vite 的模块解析器在处理 import 路径时，遇到 `@` 开头的路径，直接替换为配置的绝对路径。

## 4. 开发服务器代理 (Server Proxy)

```javascript
server: {
  proxy: {
    '/api': {
      target: 'https://api.imooc-admin.lgdsunday.club/',
      changeOrigin: true,
    },
  },
}
```

- **作用**: 解决开发环境下的**跨域问题 (CORS)**。
- **配置**:
  - `'/api'`: 拦截本地以 `/api` 开头的请求。
  - `target`: 转发的目标后端地址。
  - `changeOrigin: true`: **关键**。将请求头中的 `Host` 修改为目标服务器地址，欺骗后端服务器，防止其拒绝请求。
- **原理**:
  - **中间人代理**: 浏览器 -> Vite Dev Server (Node.js) -> 目标后端。
  - 利用**服务器间通信不受 CORS 限制**的特性绕过浏览器同源策略。
