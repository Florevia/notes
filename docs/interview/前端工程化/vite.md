# vite

Vite 是一个前端构建工具 + 开发服务器

- 开发阶段：起一个本地 dev server，支持热更新（HMR），改代码页面秒刷新。
- 打包阶段：用 Rollup 打包成上线可以用的静态文件（HTML、JS、CSS、图片……）


## Vite ***VS*** webpack

- webpack 开发流程：
  - 启动开发服务器前，要先把整个项目打包一次。
  - 改一小段代码，也要重新编译一坨依赖，然后再热更新。

- Vite 开发流程：
  - 开发阶段基于原生 ES Module（浏览器原生 import）
  - 不提前把所有代码打成一个大 bundle。
  - 浏览器访问哪个文件，就按需编译哪个文件。
  - 依赖（node_modules）用 esbuild 预构建,esbuild 是用 Go 写的，非常快。
  - 依赖只需要预构建一次，后面基本就直接用缓存。
  - 生产环境用 Rollup 打包

## 安装

```zsh
npm install -g create-vite # 全局安装 Vite 命令行工具
npm create/init vite # 创建一个新的 Vite 项目
cd my-vite-app   # 进入项目目录（换成你自己的项目名）
npm install      # 安装依赖（会生成 node_modules）

```
## 运行 Vite 开发服务器

```zsh
npm run dev
```

## 配置文件

Vite 配置文件是 `vite.config.js`，可以在其中配置 Vite 的行为。

- 基本配置：
  - `root`：项目根目录，默认是当前目录。
  - `publicDir`：静态资源目录，默认是 `public`。
  - `outDir`：打包输出目录，默认是 `dist`。
  - `server.port`：开发服务器端口，默认是 `3000`。

- 插件配置：
  - `plugins`：数组，配置 Vite 插件。

- 环境变量配置：
  - `envPrefix`：环境变量前缀，默认是 `VITE_`。
  - `envDir`：环境变量文件目录，默认是项目根目录。

- 其他配置：
  - `resolve.alias`：路径别名配置。
  - `build.rollupOptions`：Rollup 配置。
  
```js
export default {
  server: {
    host: "localhost", // 服务器主机名，默认是 localhost
    allowedHosts: ["lilin"], // 允许访问的主机名列表，默认是 []
    port: 5172, // 服务器端口号，默认是 5173
    open: true, // 服务器启动后自动打开浏览器
    strictPort: true, // 严格使用指定的端口号，默认是 false
    proxy: {
      // key：字符串，表示「要匹配的请求路径」。
      // 可以是：以 /api 这种开头的前缀，也可以是以 ^ 开头的 正则表达式（'^/fallback/.*' 会匹配 /fallback/ 开头的所有路径）。
      // value：可以是：一个 target 字符串（简写形式），或者一个更详细的 ProxyOptions 对象。

      //简单写法：'/foo': 'http://localhost:4567'
      "/api": {
        // 目标服务器地址
        target: "http://localhost:3000", 
        // 是否改变源地址，默认是 false
        changeOrigin: true, 
        // 是否验证 SSL 证书，默认是 true
        secure: false, 
        // 重写路径，默认是 (path) => path
        rewrite: (path) => path.replace(/^\/api/, ""), 
        //举例：
        //浏览器请求：/api/posts
        //代理前 path：/api/posts
        //经过 rewrite：/posts
        //真正后端收到的 URL：http://jsonplaceholder.typicode.com/posts
      },
      // resolve 是 Vite 配置中的一个选项，用于配置模块解析规则。
      resolve: {
        alias: {
          //配置路径别名 @ 指向 src 目录，方便在代码中引入模块
          "@": path.resolve(__dirname, "src"),
        },
      },
      //配置 Element Plus 自动按需导入，配置 Vue API 自动导入（ref, reactive, computed 等）
      plugins: [
        // 配置 Element Plus 自动按需导入
        ElementPlus({
          // 自动导入 Element Plus 组件的样式
          useSource: true,
        }),
        // 配置 Vue API 自动导入（ref, reactive, computed 等）
        Vue({
          // 自动导入 Vue 3 提供的 API
          template: {
            compilerOptions: {
              isCustomElement: (tag) => tag.startsWith("el-"),
            },
          },
        }),
      ],
    }
  }
}
```
