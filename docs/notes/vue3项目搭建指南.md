# Vue3 项目创建完整指南

> 本指南详细讲解使用脚手架和纯手动创建 Vue3 项目的两种方式

---

##  目录

1. [方式一：使用 Vite 脚手架](#方式一使用-vite-脚手架)
2. [方式二：使用 Webpack 脚手架](#方式二使用-webpack-脚手架)
3. [方式三：纯手动创建（Vite 版本）](#方式三纯手动创建vite-版本)
4. [方式四：纯手动创建（Webpack 版本）](#方式四纯手动创建webpack-版本)
5. [配置文件详解](#配置文件详解)

---

## 方式一：使用 Vite 脚手架

- 启动速度极快（基于 ESM）
- 热更新（HMR）速度快
- 开箱即用，配置简单
- 生产构建基于 Rollup，打包体积小

###  详细步骤

```bash
# 1.
pnpm create vite@latest my-vue3-app -- --template vue
# pnpm create vite 会临时下载并运行 create-vite 工具，所以不用下载vite，用完即删，不占用全局空间
# 2.
cd my-vue3-app
pnpm install  # 安装 package.json 中定义的所有依赖，包括vue核心库
# 3.
pnpm run dev  
# 4.
pnpm run build  # 打包生产版本到 dist 目录
pnpm run preview  # 预览生产构建结果
```
### 脚手架自动安装的核心包

```json
{
  "dependencies": {
    "vue": "^3.x.x" // Vue3 核心库
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.x.x", // Vite 的 Vue 插件，用于处理 .vue 文件
    "vite": "^5.x.x" // Vite 构建工具
  }
}
```

### 脚手架生成的项目结构

```
my-vue3-app/
├── public/              # 静态资源目录（不会被构建工具处理）
│   └── favicon.ico      # 网站图标
├── src/                 # 源代码目录
│   ├── assets/          # 资源文件（会被构建工具处理，如图片、CSS）
│   │   └── logo.png
│   ├── components/      # Vue 组件目录
│   │   └── HelloWorld.vue
│   ├── App.vue          # 根组件
│   └── main.js          # 入口文件
├── .gitignore           # Git 忽略文件配置
├── index.html           # HTML 入口文件（Vite 特有，在根目录）
├── package.json         # 项目配置和依赖管理
├── vite.config.js       # Vite 配置文件
└── README.md            # 项目说明文档
```

---

## 方式二：使用 Webpack 脚手架

### 详细步骤

```bash
# 使用 Vue CLI 创建项目
# 全局安装 Vue CLI（如果还没安装）
npm install -g @vue/cli

# 创建项目
vue create my-vue3-webpack-app

# 进入项目并启动
cd my-vue3-webpack-app
npm run serve  # 启动开发服务器

# 构建生产版本
npm run build  # 打包生产版本
```

### Vue CLI 自动安装的核心包

```json
{
  "dependencies": {
    "vue": "^3.x.x",
    "vue-router": "^4.x.x", // 路由（如果选择了）
    "pinia": "^2.x.x",//pinia 状态管理（如果选择了）
    "vuex": "^4.x.x" // 或者 vuex 状态管理（如果选择了）
  },
  "devDependencies": {
    "@vue/cli-service": "^5.x.x", // Vue CLI 核心服务
    "vue-loader": "^17.x.x", // Webpack 的 Vue 加载器
    "webpack": "^5.x.x", // Webpack 打包工具
    "@vue/compiler-sfc": "^3.x.x" // Vue 单文件组件编译器
  }
}
```
---
## 方式三： 使用create-vue脚手架

- 基于 Vite 构建，启动速度快
- 支持 Vue3 单文件组件（.vue 文件）
  - Vite + @vitejs/plugin-vue
  - Webpack + vue-loader
  - Vue CLI （内部使用 Webpack + vue-loader）
- 自动配置 Vite 插件，无需手动配置
- 提供默认的目录结构和配置文件

### 详细步骤

```bash
# 1.
pnpm create vue@latest my-vue3-app
# 2.
cd my-vue3-app
pnpm install  # 安装 package.json 中定义的所有依赖，包括vue核心库
# 3.
pnpm run dev  
# 4.
pnpm run build  
pnpm run preview  
```
---
## 方式四：纯手动创建（Vite 版本）

###  详细步骤

```bash
# 步骤 1：创建项目目录和初始化
# 创建项目文件夹
mkdir my-manual-vite-vue3
cd my-manual-vite-vue3

# 初始化 package.json
pnpm init

# 步骤 2：安装核心依赖
# 安装 Vue3 核心库（生产依赖）
pnpm add vue

# 安装 Vite 构建工具（开发依赖）
pnpm add vite --save-dev

# 安装 Vite 的 Vue 插件（开发依赖）
pnpm add @vitejs/plugin-vue --save-dev

# 步骤 3：创建项目结构
# 创建目录结构
mkdir -p src/components public
# 参数p：parents，递归创建目录

# 创建文件
touch index.html
touch vite.config.js
touch src/main.js
touch src/App.vue
touch src/components/HelloWorld.vue
```
#### 步骤 4：配置 package.json

```json
{
  "name": "my-manual-vite-vue3",
  "version": "1.0.0",
  "type": "module", // 重要：启用 ES 模块支持
  "scripts": {
    "dev": "vite", // 启动开发服务器
    "build": "vite build", // 构建生产版本
    "preview": "vite preview" // 预览生产构建
  },
  "dependencies": {
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0", 
    "vite": "^5.0.0" 
  }
}
```

#### 步骤 5：创建 vite.config.js

```js
import { defineConfig } from "vite"; // 导入 Vite 配置函数
import vue from "@vitejs/plugin-vue"; // 导入 Vue 插件

// 导出 Vite 配置
export default defineConfig({
  // 插件配置
  plugins: [
    vue(), // 使用 Vue 插件，让 Vite 能够处理 .vue 文件
  ],

  // 服务器配置
  server: {
    port: 3000, // 开发服务器端口，默认 5173
    open: true, // 启动时自动打开浏览器
    cors: true, // 允许跨域
    host: "0.0.0.0", // 监听所有地址，允许局域网访问
  },

  // 构建配置
  build: {
    outDir: "dist", // 输出目录
    assetsDir: "assets", // 静态资源目录
    sourcemap: false, // 是否生成 source map（调试用）
    minify: "terser", // 压缩方式：'terser' | 'esbuild'

  // 路径别名配置
  resolve: {
    alias: {
      "@": "/src", // 配置 @ 指向 src 目录，方便导入
    },
  },
});
```

#### 步骤 6：创建 index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue3 手动项目</title>
  </head>
  <body>
    <!-- Vue 应用挂载点 -->
    <div id="app"></div>

    <!-- 
    重要：Vite 的入口文件
    type="module" 表示这是一个 ES 模块
    Vite 会自动处理这个脚本
  -->
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

## 方式四：纯手动创建（Webpack 版本）

### 详细步骤

```bash
# 步骤 1：创建项目并初始化
mkdir my-manual-webpack-vue3
cd my-manual-webpack-vue3
pnpm init

#### 步骤 2：安装核心依赖
# 安装 Vue3（生产依赖）
pnpm add vue

# 安装 Webpack相关
pnpm add webpack webpack-cli webpack-dev-server --save-dev

# 安装 Vue 加载器/编译器（开发依赖）
pnpm add vue-loader @vue/compiler-sfc --save-dev

# 安装 HTML 插件（自动生成 HTML）
pnpm add html-webpack-plugin --save-dev

# 安装 CSS 加载器/样式加载器（开发依赖）
pnpm add css-loader vue-style-loader --save-dev

# 安装 Babel（转译 ES6+ 代码）
pnpm add @babel/core @babel/preset-env babel-loader --save-dev
```

**包的作用详解：**

| 包名                  | 作用                            |
| --------------------- | ------------------------------- |
| `webpack`             | 模块打包工具核心                |
| `webpack-cli`         | Webpack 命令行工具              |
| `webpack-dev-server`  | 开发服务器，提供热更新          |
| `vue-loader`          | 加载和转换 .vue 文件            |
| `@vue/compiler-sfc`   | 编译 Vue 单文件组件             |
| `html-webpack-plugin` | 自动生成 HTML 并注入打包后的 JS |
| `css-loader`          | 解析 CSS 文件                   |
| `vue-style-loader`    | 将 CSS 注入到 DOM 中            |
| `babel-loader`        | 使用 Babel 转译 JavaScript      |
| `@babel/core`         | Babel 核心库                    |
| `@babel/preset-env`   | Babel 预设，自动转译 ES6+ 语法  |

#### 步骤 3：配置 package.json

```json
{
  "name": "my-manual-webpack-vue3",
  "version": "1.0.0",
  "scripts": {
    "dev": "webpack serve --mode development", // 开发模式
    "build": "webpack --mode production" // 生产构建
  },
  "dependencies": {
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "@babel/core": "^7.23.0",
    "@babel/preset-env": "^7.23.0",
    "@vue/compiler-sfc": "^3.4.0",
    "babel-loader": "^9.1.0",
    "css-loader": "^6.8.0",
    "html-webpack-plugin": "^5.5.0",
    "vue-loader": "^17.3.0",
    "vue-style-loader": "^4.1.3",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.0",
    "webpack-dev-server": "^4.15.0"
  }
}
```

#### 步骤 4：创建 webpack.config.js

```javascript
const path = require("path"); // Node.js 路径模块
const HtmlWebpackPlugin = require("html-webpack-plugin"); // HTML 插件
const { VueLoaderPlugin } = require("vue-loader"); // Vue 加载器插件


module.exports = {
  // 入口文件：Webpack 从这里开始打包
  entry: "./src/main.js",

  // 输出配置
  output: {
    path: path.resolve(__dirname, "dist"), // 输出目录的绝对路径
    filename: "js/[name].[contenthash:8].js", // 输出文件名（带哈希值，利于缓存）
    clean: true, // 构建前清空输出目录
  },

  // 模块加载规则
  module: {
    rules: [
      // 处理 .vue 文件
      {
        test: /\.vue$/, // 匹配 .vue 文件
        loader: "vue-loader", // 使用 vue-loader 处理
      },

      // 处理 JavaScript 文件
      {
        test: /\.js$/, // 匹配 .js 文件
        exclude: /node_modules/, // 排除 node_modules 目录
        use: {
          loader: "babel-loader", // 使用 babel-loader
          options: {
            presets: ["@babel/preset-env"], // 使用 preset-env 预设
          },
        },
      },

      // 处理 CSS 文件
      {
        test: /\.css$/, // 匹配 .css 文件
        use: [
          "vue-style-loader", // 将 CSS 注入到 DOM
          "css-loader", // 解析 CSS 文件
        ],
        // 注意：use 数组从右到左执行，先 css-loader 再 vue-style-loader
      },
    ],
  },

  // 插件配置
  plugins: [
    // Vue Loader 插件（必需）
    new VueLoaderPlugin(),

    // HTML 插件：自动生成 HTML 并注入打包后的资源
    new HtmlWebpackPlugin({
      template: "./public/index.html", // HTML 模板路径
      title: "Vue3 Webpack 手动项目", // 页面标题
      inject: "body", // 将脚本注入到 body 底部
    }),
  ],

  // 开发服务器配置
  devServer: {
    port: 8080, // 端口号
    hot: true, // 启用热模块替换（HMR）
    open: true, // 自动打开浏览器
    compress: true, // 启用 gzip 压缩
    historyApiFallback: true, // SPA 路由支持
  },

  // 路径解析配置
  resolve: {
    extensions: [".js", ".vue", ".json"], // 自动解析这些扩展名
    alias: {
      "@": path.resolve(__dirname, "src"), // @ 指向 src 目录
    },
  },

  // 开发工具：生成 source map
  devtool: "eval-source-map", // 开发环境使用，生产环境改为 'source-map' 或 false
};
```
---
#### 步骤 5：创建项目文件

创建目录结构：

```bash
mkdir -p src/components public
```

创建 `public/index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%= htmlWebpackPlugin.options.title %></title>
  </head>
  <body>
    <div id="app"></div>
    <!-- Webpack 会自动注入打包后的 JS 文件 -->
  </body>
</html>
```

创建 `src/main.js`：

```javascript
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

## 配置文件详解

 Vite 配置项

```js
{
  plugins: [],        // 插件
  server: {},         // 开发服务器
  build: {},          // 构建配置
  resolve: {},        // 路径解析
  css: {},            // CSS 配置
  optimizeDeps: {}    // 依赖优化
}
```

Webpack 配置项

```js
{
  entry: '',          // 入口
  output: {},         // 输出
  module: { rules: [] },  // 加载器
  plugins: [],        // 插件
  devServer: {},      // 开发服务器
  resolve: {},        // 路径解析
  optimization: {}    // 优化配置
}
```

## 📚 扩展阅读

- [Vite 官方文档](https://vitejs.dev/)
- [Webpack 官方文档](https://webpack.js.org/)
- [Vue3 官方文档](https://vuejs.org/)
- [Vue3 组合式 API](https://vuejs.org/guide/extras/composition-api-faq.html)

---
