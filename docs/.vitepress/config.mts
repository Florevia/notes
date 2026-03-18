import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    title: "My notes",
    description: "Frontend learning notes",
    ignoreDeadLinks: true,
    vite: {
      resolve: {
        alias: [
          {
            find: /^dayjs$/,
            replacement: require.resolve("dayjs/esm/index.js"),
          },
          {
            find: /^@braintree\/sanitize-url$/,
            replacement:
              require.resolve("@braintree/sanitize-url/dist/index.js"),
          },
        ],
      },
    },
    themeConfig: {
      outline: {
        level: "deep",
      },
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: "首页", link: "/" },
        { text: "前端", link: "/frontend/JavaScript/" },
        { text: "408", link: "/408/computer-network/正向代理&反向代理.md" },
        { text: "面试", link: "/interview/html/浏览器渲染模式.md" },
        { text: "AI", link: "/AI/MCP.md" },
        { text: "Prompt", link: "/prompt/复习记录.md" },
        { text: "笔记", link: "/notes/" },
      ],

      sidebar: {
        "/frontend/HTML/": [
          {
            text: "HTML",
            items: [{ text: "简介", link: "/frontend/HTML/" }],
          },
        ],
        "/frontend/CSS/": [
          {
            text: "CSS",
            items: [{ text: "CSS 选择器", link: "/frontend/CSS/css选择器.md" }],
          },
        ],
        "/frontend/JavaScript/": [
          {
            text: "JavaScript",
            items: [
              {
                text: "ECMA-262",
                collapsed: false,
                items: [
                  {
                    text: "ES2016",
                    collapsed: false,
                    items: [
                      {
                        text: "Class",
                        link: "/frontend/JavaScript/ecma-262/es2016/class.md",
                      },
                    ],
                  },
                  {
                    text: "ES2015",
                    collapsed: false,
                    items: [
                      {
                        text: "Promise",
                        link: "/frontend/JavaScript/ecma-262/es2015/Promise.md",
                      },
                    ],
                  },
                  {
                    text: "ES5",
                    collapsed: false,
                    items: [
                      {
                        text: "迭代器",
                        link: "/frontend/JavaScript/ecma-262/es5/iterator.md",
                      },
                    ],
                  },
                ],
              },
              {
                text: "前端框架",
                collapsed: false,
                items: [
                  {
                    text: "Vue 3",
                    collapsed: false,
                    items: [
                      {
                        text: "Ref 与 Reactive",
                        link: "/frontend/JavaScript/frontend-frameworks/vue3/ref-reactive.md",
                      },
                      {
                        text: "数组响应式原理",
                        link: "/frontend/JavaScript/frontend-frameworks/vue3/数组响应式原理.md",
                      },
                      {
                        text: "动态绑定 Class 与 Style",
                        link: "/frontend/JavaScript/frontend-frameworks/vue3/动态绑定class和style.md",
                      },
                      {
                        text: "Scope 原理",
                        link: "/frontend/JavaScript/frontend-frameworks/vue3/scope原理.md",
                      },
                      {
                        text: "Slot 原理",
                        link: "/frontend/JavaScript/frontend-frameworks/vue3/slot.md",
                      },
                      {
                        text: "NextTick 原理",
                        link: "/frontend/JavaScript/frontend-frameworks/vue3/nextTick.md",
                      },
                    ],
                  },
                ],
              },
              {
                text: "JavaScript 变体",
                collapsed: false,
                items: [
                  {
                    text: "TypeScript",
                    link: "/frontend/JavaScript/JavaScript-Flavours/TypeScript.md",
                  },
                ],
              },
              {
                text: "JS 模块化体系",
                collapsed: false,
                items: [
                  {
                    text: "ESM 与 CJS",
                    link: "/frontend/JavaScript/js-module-systems/ESM-vs-CJS.md",
                  },
                ],
              },
              {
                text: "后端框架",
                collapsed: false,
                items: [
                  {
                    text: "Express",
                    link: "/frontend/JavaScript/backend-frameworks/express/",
                  },
                  {
                    text: "Next.js",
                    link: "/frontend/JavaScript/backend-frameworks/nextjs/",
                  },
                ],
              },
            ],
          },
        ],
        "/408/": [
          {
            text: "计算机网络",
            collapsed: false,
            items: [
              {
                text: "正向代理与反向代理",
                link: "/408/computer-network/正向代理&反向代理.md",
              },
              {
                text: "计算机网络五层模型",
                link: "/408/computer-network/计算机网络五层模型.md",
              },
            ],
          },
        ],
        "/notes/": [
          {
            text: "笔记",
            items: [
              { text: "Git 语法", link: "/notes/git语法.md" },
              { text: "调试技巧", link: "/notes/debug.md" },
              { text: "Vue3 项目搭建指南", link: "/notes/vue3项目搭建指南.md" },
              { text: "Vite 配置文件解读", link: "/notes/vite配置文件解读.md" },
              { text: "Canvas", link: "/notes/Canvas.md" },
              { text: "FileReader", link: "/notes/FileReader.md" },
              {
                text: "Shell 配置文件读取顺序",
                link: "/notes/shell配置文件读取顺序.md",
              },
              { text: "执行 Shell 的方式", link: "/notes/执行shell的方式.md" },
              { text: "全局 Loading", link: "/notes/全局loading.md" },
              { text: "前端学习路线", link: "/notes/前端学习路线.md" },
              { text: "强缓存与哈希值", link: "/notes/强缓存&哈希值.md" },
              { text: "缓存位置", link: "/notes/缓存位置.md" },
            ],
          },
        ],
        "/interview/": [
          {
            text: "HTML",
            collapsed: false,
            items: [
              {
                text: "浏览器渲染模式",
                link: "/interview/html/浏览器渲染模式.md",
              },
              { text: "Iframe", link: "/interview/html/iframe.md" },
              {
                text: "微格式 (Microformats)",
                link: "/interview/html/微格式.md",
              },
              {
                text: "替换元素",
                link: "/interview/html/替换元素.md",
              },
              {
                text: "src 与 defer",
                link: "/interview/html/src-vs-defer.md",
              },
            ],
          },
          {
            text: "CSS",
            collapsed: false,
            items: [
              { text: "CSS 单位", link: "/interview/css/css单位.md" },
              {
                text: "隐藏元素的方式",
                link: "/interview/css/隐藏元素的方式.md",
              },
              {
                text: "水平垂直居中",
                link: "/interview/css/盒子居中的方式.md",
              },
              { text: "浮动 (Float)", link: "/interview/css/float.md" },
              { text: "BFC", link: "/interview/css/BFC.md" },
              { text: "Flex 布局", link: "/interview/css/flex.md" },
              {
                text: "弹性布局",
                link: "/interview/css/弹性布局.md",
              },
              { text: "Grid 布局", link: "/interview/css/grid.md" },
              { text: "盒模型", link: "/interview/css/盒模型.md" },
              { text: "CSS 优先级", link: "/interview/css/css优先级.md" },
              {
                text: "行内样式 vs Tailwind",
                link: "/interview/css/行内样式和TailwindCSS以及手写css.md",
              },
              {
                text: "CSS 隔离方案",
                link: "/interview/css/css隔离方案.md",
              },
              {
                text: "CSS 预处理与后处理器",
                link: "/interview/css/css预处理和后处理器.md",
              },
              {
                text: "瀑布流布局",
                link: "/interview/css/瀑布流.md",
              },
              {
                text: "移动端适配方案",
                link: "/interview/css/移动端适配方案.md",
              },
              {
                text: "Viewport",
                link: "/interview/css/viewport.md",
              },
              {
                text: "Canvas",
                link: "/interview/css/canvas.md",
              },
              {
                text: "图片有间隙",
                link: "/interview/css/图片有间隙.md",
              },
            ],
          },
          {
            text: "JavaScript",
            collapsed: false,
            items: [
              {
                text: "原型与原型链",
                link: "/interview/js/原型和原型链.md",
              },
              {
                text: "Instanceof 原理",
                link: "/interview/js/instanceof.md",
              },
              {
                text: "DocumentFragment",
                link: "/interview/js/DocumentFragment.md",
              },
              {
                text: "Lodash 常用方法",
                link: "/interview/js/lodash常用方法.md",
              },
              {
                text: "== 与 ===",
                link: "/interview/js/==&===区别.md",
              },
              {
                text: "剩余参数",
                link: "/interview/js/rest-parameters.md",
              },
              {
                text: "手写 Promise (all)",
                link: "/interview/js/promise(all).md",
              },
              {
                text: "Promise",
                link: "/interview/js/Promise.md",
              },
              {
                text: "Class",
                link: "/interview/js/class.md",
              },
              {
                text: "Node.js 模块判断",
                link: "/interview/js/模块判断.md",
              },
              {
                text: "TS 模块判断",
                link: "/interview/js/ts模块判断.md",
              },
              {
                text: "Node.js 事件循环",
                link: "/interview/js/Node事件循环机制.md",
              },
              {
                text: "Set/Map/WeakSet/WeakMap",
                link: "/interview/js/Set-Map-WeakSet-WeakMap.md",
              },
              {
                text: "柯里化函数",
                link: "/interview/js/柯里化函数.md",
              },
              {
                text: "作用域与作用域链",
                link: "/interview/js/作用域和作用域链.md",
              },
              {
                text: "闭包",
                link: "/interview/js/闭包.md",
              },
              {
                text: "垃圾回收与内存泄漏",
                link: "/interview/js/垃圾回收和内存泄漏.md",
              },
              {
                text: "执行栈与上下文",
                link: "/interview/js/执行栈和执行上下文.md",
              },
              {
                text: "值与引用",
                link: "/interview/js/值和引用.md",
              },
              {
                text: "Var/Let/Const",
                link: "/interview/js/var-let-const.md",
              },
              {
                text: "包装对象",
                link: "/interview/js/包装对象.md",
              },
              {
                text: "ESM 与 CJS 区别",
                link: "/interview/js/ESM静态结构-CJS动态结构.md",
              },
              {
                text: "ESM 与 CJS 值拷贝",
                link: "/interview/js/ESM与CJS的值拷贝与引用.md",
              },
              {
                text: "深拷贝与浅拷贝",
                link: "/interview/js/深拷贝浅拷贝.md",
              },
              {
                text: "字符串常用方法",
                link: "/interview/js/字符串常用方法.md",
              },
              {
                text: "数组常用方法",
                link: "/interview/js/数组常用方法.md",
              },
              {
                text: "Object 常用方法",
                link: "/interview/js/object常用方法.md",
              },
              {
                text: "类型转换",
                link: "/interview/js/数据转换.md",
              },
              {
                text: "运算符",
                link: "/interview/js/运算符.md",
              },
              {
                text: "DOM 尺寸与位置",
                link: "/interview/js/DOM尺寸和位置属性.md",
              },
              {
                text: "DOM 事件流",
                link: "/interview/js/DOM事件流.md",
              },
              {
                text: "ES6 新特性",
                link: "/interview/js/es6新特性.md",
              },
              {
                text: "This 指向",
                link: "/interview/js/this指向.md",
              },
              {
                text: "防抖与节流",
                link: "/interview/js/防抖节流.md",
              },
            ],
          },
          {
            text: "Vue",
            collapsed: false,
            items: [
              {
                text: "环境变量",
                link: "/interview/vue/环境变量.md",
              },
              {
                text: "Ref 和 Reactive",
                link: "/interview/vue/ref和reactive.md",
              },
              {
                text: "响应式机制",
                link: "/interview/vue/响应式机制.md",
              },
              {
                text: "虚拟 DOM",
                link: "/interview/vue/虚拟DOM.md",
              },
              {
                text: "Vue 生命周期",
                link: "/interview/vue/vue生命周期.md",
              },
              {
                text: "状态变化到 UI 渲染流程",
                link: "/interview/vue/状态变化到UI渲染流程.md",
              },
              {
                text: "Composition API vs Options API",
                link: "/interview/vue/composition-api-options-api.md",
              },
              {
                text: "Computed & Watch",
                link: "/interview/vue/computed-watch.md",
              },
              {
                text: "Computed 双向绑定",
                link: "/interview/vue/computed如何实现双向绑定.md",
              },
              {
                text: "NextTick 原理",
                link: "/interview/vue/nextTick.md",
              },
              {
                text: "Scope 原理",
                link: "/interview/vue/scope原理.md",
              },
              {
                text: "动态绑定 Class 与 Style",
                link: "/interview/vue/动态绑定class和style.md",
              },
              {
                text: "v-show vs v-if",
                link: "/interview/vue/v-show-v-if.md",
              },
              {
                text: "v-if 与 v-for",
                link: "/interview/vue/v-if-v-for.md",
              },
              {
                text: "v-for 中的 key",
                link: "/interview/vue/v-for中的key.md",
              },
              {
                text: "v-model 原理 (Vue 2)",
                link: "/interview/vue/v2-model.md",
              },
              {
                text: "v-model 原理 (Vue 3)",
                link: "/interview/vue/v3-model原理.md",
              },
              {
                text: "h 函数",
                link: "/interview/vue/vue3-h-function.md",
              },
              {
                text: "Setup 函数",
                link: "/interview/vue/setup函数.md",
              },
              {
                text: "Slot 插槽",
                link: "/interview/vue/slot.md",
              },
              {
                text: "Mixin",
                link: "/interview/vue/mixin.md",
              },
              {
                text: "组件间通信方式 (详细版)",
                link: "/interview/vue/组件间通信方式.md",
              },
              {
                text: "组件间通信方式 (精简版)",
                link: "/interview/vue/组件间通信方式2.md",
              },
              {
                text: "Vuex & Pinia",
                link: "/interview/vue/vuex&pinia.md",
              },
              {
                text: "路由模式",
                link: "/interview/vue/路由模式.md",
              },
              {
                text: "Vue 路由使用",
                link: "/interview/vue/Vue路由.md",
              },

              {
                text: "vue.use() 原理",
                link: "/interview/vue/vue.use().md",
              },
              {
                text: "Vue2 vs Vue3 差异",
                link: "/interview/vue/vue2-vue3差异.md",
              },
              {
                text: "Vue 编译器原理",
                link: "/interview/vue/vue编译器的实现原理.md",
              },
              {
                text: "Ref 和 Reactive 回答",
                link: "/interview/vue/ref和reactive回答.md",
              },
              {
                text: "VueUse 库",
                link: "/interview/vue/vueuse库.md",
              },
            ],
          },
          {
            text: "浏览器与网络",
            collapsed: false,
            items: [
              { text: "Cookie", link: "/interview/网络/cookie.md" },
              { text: "Session", link: "/interview/网络/session.md" },
              { text: "DNS 解析", link: "/interview/网络/DNS解析.md" },
              {
                text: "Local vs Session Storage",
                link: "/interview/网络/localStorage.md",
              },
              { text: "GET vs POST", link: "/interview/网络/GET-POST.md" },
              { text: "JWT", link: "/interview/网络/JWT.md" },
              {
                text: "鉴权方案",
                link: "/interview/网络/鉴权方案.md",
              },
              {
                text: "加密算法",
                link: "/interview/网络/加密算法.md",
              },
              { text: "跨域 (CORS)", link: "/interview/网络/跨域.md" },
              { text: "JSONP", link: "/interview/网络/JSONP.md" },
              {
                text: "SSH 远程连接",
                link: "/interview/网络/SSH远程连接.md",
              },
              {
                text: "Nginx 配置详解",
                link: "/interview/网络/nginx配置详解.md",
              },
              { text: "HTTP 基础", link: "/interview/网络/http.md" },
              { text: "HTTP vs HTTPS", link: "/interview/网络/HTTP-HTTPS.md" },
              { text: "HTTP 缓存", link: "/interview/网络/HTTP缓存.md" },
              { text: "HTTP 演进", link: "/interview/网络/HTTP演进.md" },
              {
                text: "CS 架构缓存体系",
                link: "/interview/网络/CS架构缓存体系.md",
              },
              { text: "文件上传", link: "/interview/网络/文件上传.md" },
              { text: "文件下载", link: "/interview/网络/文件下载.md" },
              { text: "断点续传", link: "/interview/网络/断点续传.md" },
              {
                text: "网络性能优化",
                link: "/interview/网络/网络性能优化.md",
              },
              {
                text: "网络安全攻击",
                link: "/interview/网络/网络安全攻击.md",
              },
              {
                text: "TCP 协议",
                link: "/interview/网络/TCP.md",
              },
              {
                text: "TCP 可靠性与 UDP",
                link: "/interview/网络/TCP可靠的原因-UDP.md",
              },
              {
                text: "TCP 粘包与拆包",
                link: "/interview/网络/TCP粘包与拆包.md",
              },
              {
                text: "SSL/TLS",
                link: "/interview/网络/TSL.md",
              },
              {
                text: "CA 证书",
                link: "/interview/网络/CA.md",
              },
              {
                text: "WebSocket",
                link: "/interview/网络/websocket.md",
              },
              {
                text: "Websocket 握手",
                link: "/interview/网络/websocket握手.md",
              },
              {
                text: "输入 URL 后发生了什么",
                link: "/interview/网络/输入URL后.md",
              },
              {
                text: "回流与重绘",
                link: "/interview/网络/回流重绘.md",
              },
              {
                text: "浏览器事件循环",
                link: "/interview/网络/浏览器的事件循环.md",
              },
              {
                text: "XHR readyState 与状态码",
                link: "/interview/网络/readyState&响应状态码.md",
              },
              {
                text: "数据通信基础模式",
                link: "/interview/网络/数据通信的基础模式.md",
              },
              {
                text: "负载均衡",
                link: "/interview/网络/负载均衡.md",
              },
            ],
          },
          {
            text: "前端工程化",
            collapsed: false,
            items: [
              {
                text: "前端工程化的理解",
                link: "/interview/前端工程化/前端工程化的理解.md",
              },
              {
                text: "前端工程化概览",
                link: "/interview/工程化/前端工程化.md",
              },
              {
                text: "Monorepo",
                link: "/interview/前端工程化/Monorepo.md",
              },
              {
                text: "模块化规范",
                link: "/interview/前端工程化/模块化规范.md",
              },
              {
                text: "ESM vs CommonJS",
                link: "/interview/前端工程化/ESM-vs-CJS.md",
              },
              {
                text: "Webpack",
                link: "/interview/前端工程化/webpack.md",
              },
              {
                text: "Webpack 打包流程",
                link: "/interview/前端工程化/webpack打包流程.md",
              },
              {
                text: "Webpack vs Vite",
                link: "/interview/前端工程化/webpack&vite.md",
              },
              {
                text: "提升 Webpack 打包速度",
                link: "/interview/前端工程化/提升webpack打包速度.md",
              },
              {
                text: "打包体积优化",
                link: "/interview/前端工程化/项目打包后体积优化.md",
              },
              {
                text: "Vite",
                link: "/interview/前端工程化/vite.md",
              },
              {
                text: "Vite 为啥快",
                link: "/interview/前端工程化/vite为啥快.md",
              },
              {
                text: "ESLint",
                link: "/interview/前端工程化/eslint.md",
              },
              {
                text: "Prettier",
                link: "/interview/前端工程化/prettier.md",
              },
              {
                text: "静态 Server 与动态 Server",
                link: "/interview/前端工程化/静态server&动态server.md",
              },
              {
                text: "Web 渲染策略",
                link: "/interview/前端工程化/Web渲染策略.md",
              },
              {
                text: "前端渲染模式",
                link: "/interview/前端工程化/前端渲染模式.md",
              },
              {
                text: "静态站点与动态站点",
                link: "/interview/前端工程化/静态站点&动态站点.md",
              },
              {
                text: "HMR 原理和机制",
                link: "/interview/前端工程化/HMR原理和机制.md",
              },
              {
                text: "Plugin 和 Loader 的区别",
                link: "/interview/前端工程化/Plugin和Loader的区别.md",
              },
              {
                text: "Tree Shaking",
                link: "/interview/前端工程化/TreeShaking.md",
              },
              {
                text: "单元测试",
                link: "/interview/前端工程化/单元测试.md",
              },
              {
                text: "npm vs pnpm",
                link: "/interview/前端工程化/npm-vs-pnpm.md",
              },
              {
                text: "npm vs pnpm (详细)",
                link: "/interview/工程化/pnpm-npm.md",
              },
              {
                text: "CI/CD 企业级实践",
                link: "/interview/工程化/CICD.md",
              },
              {
                text: "Babel 原理与配置",
                link: "/interview/工程化/babel.md",
              },
              {
                text: "ESLint & Prettier 配置",
                link: "/interview/工程化/eslint-prettier配置.md",
              },
              {
                text: "Stylelint 配置",
                link: "/interview/工程化/stylelint.md",
              },
              {
                text: "Husky & Lint-Staged",
                link: "/interview/工程化/husky-lint-stage.md",
              },
              {
                text: "本地测试与生产模式对比",
                link: "/interview/工程化/本地测试生产模式对比.md",
              },
              {
                text: "设计模式",
                link: "/interview/工程化/设计模式.md",
              },
              {
                text: "前端性能优化",
                link: "/interview/工程化/前端性能优化.md",
              },
              {
                text: "Lodash 库",
                link: "/interview/工程化/lodash库.md",
              },
              {
                text: "首屏加载优化",
                link: "/interview/工程化/首屏加载慢如何解决.md",
              },
              {
                text: "骨架屏",
                link: "/interview/工程化/骨架屏.md",
              },
              {
                text: "BFF",
                link: "/interview/工程化/BFF.md",
              },
              {
                text: "CDN 工作原理",
                link: "/interview/工程化/CDN工作原理.md",
              },
              {
                text: "关系型 vs 文档型数据库",
                link: "/interview/工程化/关系型数据库和文档型数据库.md",
              },
            ],
          },
          {
            text: "业务场景",
            collapsed: false,
            items: [
              {
                text: "拖拽组件",
                link: "/interview/业务场景/拖拽组件.md",
              },
              {
                text: "流式响应",
                link: "/interview/业务场景/流式响应.md",
              },
              {
                text: "RBAC 动态路由",
                link: "/interview/业务场景/RBAC动态路由.md",
              },
              {
                text: "实现响应式",
                link: "/interview/业务场景/实现响应式.md",
              },
              {
                text: "组件封装",
                link: "/interview/业务场景/组件封装.md",
              },
              {
                text: "动态路由与权限",
                link: "/interview/业务场景/动态路由与权限.md",
              },
              {
                text: "懒加载",
                link: "/interview/业务场景/懒加载.md",
              },
              {
                text: "上拉加载",
                link: "/interview/业务场景/上拉加载.md",
              },
              {
                text: "长列表优化",
                link: "/interview/业务场景/长列表.md",
              },
              {
                text: "瀑布流",
                link: "/interview/业务场景/瀑布流.md",
              },
              {
                text: "render 函数动态渲染 VNode",
                link: "/interview/业务场景/render函数动态vnode渲染.md",
              },
              {
                text: "跳转特效",
                link: "/interview/业务场景/跳转特效.md",
              },
              {
                text: "人类行为验证",
                link: "/interview/业务场景/人类行为验证.md",
              },
              {
                text: "大文件上传",
                link: "/interview/业务场景/大文件上传.md",
              },
            ],
          },
          {
            text: "浏览器",
            collapsed: false,
            items: [
              {
                text: "浏览器组成",
                link: "/interview/浏览器/浏览器组成.md",
              },
              {
                text: "浏览器多进程架构",
                link: "/interview/浏览器/浏览器架构.md",
              },
              {
                text: "浏览器渲染进程",
                link: "/interview/浏览器/浏览器的渲染进程.md",
              },
              {
                text: "浏览器事件循环",
                link: "/interview/浏览器/浏览器的事件循环.md",
              },
              {
                text: "JS/CSS 阻塞渲染",
                link: "/interview/浏览器/阻塞渲染.md",
              },
              {
                text: "IndexedDB",
                link: "/interview/浏览器/indexedDB.md",
              },
              {
                text: "SSE (Server-Sent Events)",
                link: "/interview/浏览器/SSE.md",
              },
              {
                text: "Web APIs (DOM/BOM)",
                link: "/interview/浏览器/WebApis.md",
              },
              {
                text: "Web Workers",
                link: "/interview/浏览器/webworkers.md",
              },
              {
                text: "独立标签页通信",
                link: "/interview/浏览器/独立标签页通信.md",
              },
              {
                text: "浏览器内核一览",
                link: "/interview/浏览器/浏览器内核一览.md",
              },
            ],
          },
          {
            text: "AI",
            collapsed: false,
            items: [
              {
                text: "LLM",
                link: "/interview/AI/LLM.md",
              },
              {
                text: "LoRA",
                link: "/interview/AI/LoRA.md",
              },
              {
                text: "RAG",
                link: "/interview/AI/RAG.md",
              },
              {
                text: "提示词工程",
                link: "/interview/AI/提示词工程.md",
              },
              {
                text: "异步流处理",
                link: "/interview/AI/异步流处理.md",
              },
              {
                text: "流式打字机",
                link: "/interview/AI/流式打字机.md",
              },
              {
                text: "AI 与前端结合场景",
                link: "/interview/AI/AI和前端结合的场景.md",
              },
              {
                text: "AI 前端开发 vs 普通开发",
                link: "/interview/AI/AI前端开发vs普通.md",
              },
              {
                text: "Map 与 Redis",
                link: "/interview/AI/map和redis.md",
              },
              {
                text: "原子扣费",
                link: "/interview/AI/原子扣费.md",
              },
              {
                text: "AI 面试题",
                link: "/interview/AI/针对面试.md",
              },
              {
                text: "算法",
                link: "/interview/AI/算法111111111111.md",
              },
            ],
          },
          {
            text: "NestJS",
            collapsed: false,
            items: [
              {
                text: "Observable",
                link: "/interview/Nestjs/Observable.md",
              },
            ],
          },
        ],
        "/AI/": [
          {
            text: "AI",
            items: [{ text: "MCP", link: "/AI/MCP.md" }],
          },
        ],
        "/prompt/": [
          {
            text: "Prompt",
            items: [
              { text: "复习记录", link: "/prompt/复习记录.md" },
              { text: "前端面试", link: "/prompt/前端面试.md" },
            ],
          },
        ],
      },

      socialLinks: [
        { icon: "github", link: "https://github.com/vuejs/vitepress" },
      ],
    },
  }),
);
