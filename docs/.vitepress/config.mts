import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { createRequire } from "module";
import { fileURLToPath, URL } from "node:url";

const require = createRequire(import.meta.url);
const requireFromVitePress = createRequire(require.resolve("vitepress"));
const inlineNavBarSearch = fileURLToPath(
  new URL("./theme/components/VPNavBarSearch.vue", import.meta.url),
);

/** Replace VitePress modal search with in-place expandable nav search. */
function inlineNavSearchPlugin() {
  return {
    name: "inline-nav-search",
    enforce: "pre",
    resolveId(source, importer) {
      if (
        importer &&
        /vitepress[/\\].*VPNavBar\.vue/.test(importer) &&
        (source === "./VPNavBarSearch.vue" ||
          source.endsWith("VPNavBarSearch.vue"))
      ) {
        return inlineNavBarSearch;
      }
      return null;
    },
  };
}

const frontendSidebar = [
  {
    text: "HTML",
    collapsed: true,
    items: [
      { text: "图片类型及选择", link: "/frontend/HTML/图片类型及选择.md" },
      { text: "浏览器渲染模式", link: "/interview/html/浏览器渲染模式.md" },
      { text: "Iframe", link: "/interview/html/iframe.md" },
      { text: "微格式 (Microformats)", link: "/interview/html/微格式.md" },
      { text: "替换元素", link: "/interview/html/替换元素.md" },
      { text: "script 的 src 与 defer", link: "/interview/html/src-vs-defer.md" },
    ],
  },
  {
    text: "CSS",
    collapsed: true,
    items: [
      {
        text: "基础",
        collapsed: true,
        items: [
          { text: "CSS 选择器", link: "/frontend/CSS/css选择器.md" },
          { text: "盒模型", link: "/interview/css/盒模型.md" },
          { text: "CSS 单位", link: "/interview/css/css单位.md" },
          { text: "CSS 优先级", link: "/interview/css/css优先级.md" },
          { text: "BFC", link: "/interview/css/BFC.md" },
          { text: "浮动 (Float)", link: "/interview/css/float.md" },
        ],
      },
      {
        text: "布局",
        collapsed: true,
        items: [
          { text: "弹性布局", link: "/interview/css/弹性布局.md" },
          { text: "Grid 布局", link: "/interview/css/grid.md" },
          { text: "水平垂直居中", link: "/interview/css/盒子居中的方式.md" },
          { text: "瀑布流布局", link: "/interview/css/瀑布流.md" },
          { text: "隐藏元素的方式", link: "/interview/css/隐藏元素的方式.md" },
          { text: "图片有间隙", link: "/interview/css/图片有间隙.md" },
        ],
      },
      {
        text: "适配与工程",
        collapsed: true,
        items: [
          { text: "Viewport", link: "/interview/css/viewport.md" },
          { text: "移动端适配", link: "/interview/css/移动端适配方案.md" },
          { text: "CSS 隔离方案", link: "/interview/css/css隔离方案.md" },
          { text: "预处理器与后处理器", link: "/interview/css/css预处理和后处理器.md" },
          { text: "行内样式 vs Tailwind", link: "/interview/css/行内样式和TailwindCSS以及手写css.md" },
          { text: "Canvas", link: "/interview/css/canvas.md" },
        ],
      },
    ],
  },
  {
    text: "JavaScript",
    collapsed: true,
    items: [
      {
        text: "基础",
        collapsed: true,
        items: [
          { text: "Var / Let / Const", link: "/interview/js/var-let-const.md" },
          { text: "判断数据类型", link: "/interview/js/判断数据类型.md" },
          { text: "类型转换", link: "/interview/js/数据转换.md" },
          { text: "== 与 ===", link: "/interview/js/==&===区别.md" },
          { text: "包装对象", link: "/interview/js/包装对象.md" },
          { text: "运算符", link: "/interview/js/运算符.md" },
          { text: "值与引用", link: "/interview/js/值和引用.md" },
          { text: "This 指向", link: "/interview/js/this指向.md" },
          { text: "ES6 新特性", link: "/interview/js/es6新特性.md" },
          { text: "剩余参数", link: "/interview/js/rest-parameters.md" },
        ],
      },
      {
        text: "作用域与闭包",
        collapsed: true,
        items: [
          { text: "作用域与作用域链", link: "/interview/js/作用域和作用域链.md" },
          { text: "闭包", link: "/interview/js/闭包.md" },
          { text: "执行栈与上下文", link: "/interview/js/执行栈和执行上下文.md" },
          { text: "垃圾回收与内存泄漏", link: "/interview/js/垃圾回收和内存泄漏.md" },
        ],
      },
      {
        text: "原型与 Class",
        collapsed: true,
        items: [
          { text: "原型与原型链", link: "/interview/js/原型和原型链.md" },
          { text: "Instanceof 原理", link: "/interview/js/instanceof.md" },
          { text: "Class", link: "/interview/js/class.md" },
        ],
      },
      {
        text: "异步",
        collapsed: true,
        items: [
          { text: "Promise", link: "/interview/js/promise.md" },
          { text: "手写 Promise.all", link: "/interview/js/promise(all).md" },
          { text: "取消操作", link: "/interview/js/取消操作.md" },
        ],
      },
      {
        text: "集合与拷贝",
        collapsed: true,
        items: [
          { text: "Set / Map / WeakSet / WeakMap", link: "/interview/js/Set-Map-WeakSet-WeakMap.md" },
          { text: "Map 与 WeakMap", link: "/interview/js/map和weakMap的区别.md" },
          { text: "Set 与 WeakSet", link: "/interview/js/set和weakSet区别.md" },
          { text: "深拷贝与浅拷贝", link: "/interview/js/深拷贝浅拷贝.md" },
          { text: "迭代器", link: "/frontend/JavaScript/ecma-262/es5/iterator.md" },
        ],
      },
      {
        text: "常用 API",
        collapsed: true,
        items: [
          { text: "字符串常用方法", link: "/interview/js/字符串常用方法.md" },
          { text: "数组常用方法", link: "/interview/js/数组常用方法.md" },
          { text: "Object 常用方法", link: "/interview/js/object常用方法.md" },
          { text: "Lodash 常用方法", link: "/interview/js/lodash常用方法.md" },
          { text: "柯里化", link: "/interview/js/柯里化函数.md" },
          { text: "防抖与节流", link: "/interview/js/防抖节流.md" },
        ],
      },
      {
        text: "模块化",
        collapsed: true,
        items: [
          { text: "ESM 与 CJS", link: "/frontend/JavaScript/js-module-systems/ESM-vs-CJS.md" },
          { text: "ESM 静态结构 vs CJS 动态结构", link: "/interview/js/ESM静态结构-CJS动态结构.md" },
          { text: "ESM / CJS 值拷贝与引用", link: "/interview/js/ESM与CJS的值拷贝与引用.md" },
        ],
      },
    ],
  },
  {
    text: "TypeScript",
    collapsed: true,
    items: [
      { text: "TypeScript 概览", link: "/frontend/JavaScript/JavaScript-Flavours/TypeScript.md" },
      { text: "TS 模块判断", link: "/frontend/JavaScript/JavaScript-Flavours/ts模块判断.md" },
    ],
  },
  {
    text: "浏览器",
    collapsed: true,
    items: [
      {
        text: "架构与渲染",
        collapsed: true,
        items: [
          { text: "浏览器组成", link: "/interview/浏览器/浏览器组成.md" },
          { text: "多进程架构", link: "/interview/浏览器/浏览器架构.md" },
          { text: "渲染进程", link: "/interview/浏览器/浏览器的渲染进程.md" },
          { text: "浏览器内核", link: "/interview/浏览器/浏览器内核一览.md" },
          { text: "JS/CSS 阻塞渲染", link: "/interview/浏览器/阻塞渲染.md" },
          { text: "回流与重绘", link: "/interview/浏览器/回流重绘.md" },
          { text: "事件循环", link: "/interview/浏览器/浏览器的事件循环.md" },
        ],
      },
      {
        text: "事件与 DOM",
        collapsed: true,
        items: [
          { text: "DOM 事件流", link: "/interview/浏览器/DOM事件流.md" },
          { text: "DOM 尺寸与位置", link: "/interview/浏览器/DOM尺寸和位置属性.md" },
          { text: "DocumentFragment", link: "/interview/浏览器/DocumentFragment.md" },
          { text: "Web APIs（DOM/BOM）", link: "/interview/浏览器/WebApis.md" },
        ],
      },
      {
        text: "存储",
        collapsed: true,
        items: [
          { text: "Cookie", link: "/interview/浏览器/cookie.md" },
          { text: "Local / Session Storage", link: "/interview/浏览器/Storage-cookie.md" },
          { text: "IndexedDB", link: "/interview/浏览器/indexedDB.md" },
        ],
      },
      {
        text: "Web API",
        collapsed: true,
        items: [
          { text: "FileReader", link: "/interview/浏览器/FileReader.md" },
          { text: "Canvas（笔记）", link: "/interview/浏览器/Canvas.md" },
          { text: "Web Workers", link: "/interview/浏览器/webworkers.md" },
          { text: "独立标签页通信", link: "/interview/浏览器/独立标签页通信.md" },
          { text: "SSE", link: "/interview/浏览器/SSE.md" },
        ],
      },
    ],
  },
  {
    text: "网络",
    collapsed: true,
    items: [
      {
        text: "HTTP 基础",
        collapsed: true,
        items: [
          { text: "输入 URL 后发生了什么", link: "/interview/网络/输入URL后.md" },
          { text: "DNS 解析", link: "/interview/网络/DNS解析.md" },
          { text: "HTTP 基础", link: "/interview/网络/http.md" },
          { text: "HTTP vs HTTPS", link: "/interview/网络/HTTP-HTTPS.md" },
          { text: "HTTP 演进", link: "/interview/网络/HTTP演进.md" },
          { text: "GET vs POST", link: "/interview/网络/GET-POST.md" },
          { text: "RESTful vs RPC", link: "/interview/网络/RESTful与RPC.md" },
          { text: "XHR readyState 与状态码", link: "/interview/网络/readyState&响应状态码.md" },
          { text: "Axios / Fetch / SSE 与 MCP", link: "/interview/网络/HTTP请求与流式通信.md" },
        ],
      },
      {
        text: "缓存",
        collapsed: true,
        items: [
          { text: "HTTP 缓存", link: "/interview/网络/HTTP缓存.md" },
          { text: "强缓存与哈希值", link: "/interview/网络/强缓存&哈希值.md" },
          { text: "缓存位置", link: "/interview/网络/缓存位置.md" },
          { text: "CS 架构缓存体系", link: "/interview/网络/CS架构缓存体系.md" },
        ],
      },
      {
        text: "跨域与鉴权",
        collapsed: true,
        items: [
          { text: "跨域 (CORS)", link: "/interview/网络/跨域.md" },
          { text: "JSONP", link: "/interview/网络/JSONP.md" },
          { text: "Session", link: "/interview/网络/session.md" },
          { text: "JWT", link: "/interview/网络/JWT.md" },
          { text: "鉴权方案", link: "/interview/网络/鉴权方案.md" },
        ],
      },
      {
        text: "安全",
        collapsed: true,
        items: [
          { text: "加密算法", link: "/interview/网络/加密算法.md" },
          { text: "常见安全攻击", link: "/interview/网络/网络安全攻击.md" },
          { text: "SSL/TLS", link: "/interview/网络/TLS.md" },
          { text: "CA 证书", link: "/interview/网络/CA.md" },
        ],
      },
      {
        text: "传输层",
        collapsed: true,
        items: [
          { text: "TCP", link: "/interview/网络/TCP.md" },
          { text: "TCP 可靠性与 UDP", link: "/interview/网络/TCP可靠的原因-UDP.md" },
          { text: "TCP 粘包与拆包", link: "/interview/网络/TCP粘包与拆包.md" },
        ],
      },
      {
        text: "实时通信",
        collapsed: true,
        items: [
          { text: "WebSocket", link: "/interview/网络/websocket.md" },
          { text: "WebSocket 握手", link: "/interview/网络/websocket握手.md" },
          { text: "数据通信基础模式", link: "/interview/网络/数据通信的基础模式.md" },
        ],
      },
      {
        text: "文件传输",
        collapsed: true,
        items: [
          { text: "文件上传", link: "/interview/网络/文件上传.md" },
          { text: "文件下载", link: "/interview/网络/文件下载.md" },
          { text: "断点续传", link: "/interview/网络/断点续传.md" },
        ],
      },
      {
        text: "服务端相关",
        collapsed: true,
        items: [
          { text: "Nginx 配置", link: "/interview/网络/nginx配置详解.md" },
          { text: "负载均衡", link: "/interview/网络/负载均衡.md" },
          { text: "SSH 远程连接", link: "/interview/网络/SSH远程连接.md" },
          { text: "System Proxy / TUN / fake-IP", link: "/interview/网络/代理TUN与fake-IP.md" },
        ],
      },
    ],
  },
  {
    text: "Vue",
    collapsed: true,
    items: [
      {
        text: "基础与 API",
        collapsed: true,
        items: [
          { text: "Vue3 项目搭建", link: "/frontend/JavaScript/frontend-frameworks/vue3/vue3项目搭建指南.md" },
          { text: "环境变量", link: "/interview/vue/环境变量.md" },
          { text: "Composition vs Options API", link: "/interview/vue/composition-api-options-api.md" },
          { text: "Setup 函数", link: "/interview/vue/setup函数.md" },
          { text: "Vue 2 vs Vue 3", link: "/interview/vue/vue2-vue3差异.md" },
          { text: "VueUse", link: "/interview/vue/vueuse库.md" },
          { text: "Vue 中的 Hook", link: "/interview/vue/vue中hook.md" },
        ],
      },
      {
        text: "响应式",
        collapsed: true,
        items: [
          { text: "Ref 与 Reactive", link: "/interview/vue/ref和reactive.md" },
          { text: "Ref / Reactive 口述", link: "/interview/vue/ref和reactive回答.md" },
          { text: "Ref 与 Reactive（笔记）", link: "/frontend/JavaScript/frontend-frameworks/vue3/ref-reactive.md" },
          { text: "响应式机制", link: "/interview/vue/响应式机制.md" },
          { text: "数组响应式", link: "/frontend/JavaScript/frontend-frameworks/vue3/数组响应式原理.md" },
          { text: "Computed & Watch", link: "/interview/vue/computed-watch.md" },
          { text: "Computed 双向绑定", link: "/interview/vue/computed如何实现双向绑定.md" },
        ],
      },
      {
        text: "渲染与更新",
        collapsed: true,
        items: [
          { text: "虚拟 DOM", link: "/interview/vue/虚拟DOM.md" },
          { text: "状态到 UI 的渲染流程", link: "/interview/vue/状态变化到UI渲染流程.md" },
          { text: "NextTick", link: "/interview/vue/nextTick.md" },
          { text: "NextTick（笔记）", link: "/frontend/JavaScript/frontend-frameworks/vue3/nextTick.md" },
          { text: "发请求时机", link: "/interview/vue/vue发请求的时机.md" },
          { text: "生命周期里的异步是否阻塞渲染", link: "/interview/vue/生命周期中写异步函数是否阻塞组件的挂载和渲染.md" },
          { text: "h 函数", link: "/interview/vue/vue3-h-function.md" },
          { text: "编译器原理", link: "/interview/vue/vue编译器的实现原理.md" },
        ],
      },
      {
        text: "生命周期",
        collapsed: true,
        items: [
          { text: "Vue 生命周期", link: "/interview/vue/vue生命周期.md" },
          { text: "Vue 2/3 生命周期对比", link: "/interview/vue/2和3生命周期.md" },
        ],
      },
      {
        text: "模板与指令",
        collapsed: true,
        items: [
          { text: "动态 Class / Style", link: "/interview/vue/动态绑定class和style.md" },
          { text: "动态 Class / Style（笔记）", link: "/frontend/JavaScript/frontend-frameworks/vue3/动态绑定class和style.md" },
          { text: "v-show vs v-if", link: "/interview/vue/v-show-v-if.md" },
          { text: "v-if 与 v-for", link: "/interview/vue/v-if-v-for.md" },
          { text: "v-for 的 key", link: "/interview/vue/v-for中的key.md" },
          { text: "v-model（Vue 2）", link: "/interview/vue/v2-model.md" },
          { text: "v-model（Vue 3）", link: "/interview/vue/v3-model原理.md" },
        ],
      },
      {
        text: "组件",
        collapsed: true,
        items: [
          { text: "Scoped CSS", link: "/interview/vue/scope原理.md" },
          { text: "Scoped CSS（笔记）", link: "/frontend/JavaScript/frontend-frameworks/vue3/scope原理.md" },
          { text: "Slot", link: "/interview/vue/slot.md" },
          { text: "Slot（笔记）", link: "/frontend/JavaScript/frontend-frameworks/vue3/slot.md" },
          { text: "Mixin", link: "/interview/vue/mixin.md" },
          { text: "组件通信（详细）", link: "/interview/vue/组件间通信方式.md" },
          { text: "组件通信（精简）", link: "/interview/vue/组件间通信方式2.md" },
          { text: "vue.use() 原理", link: "/interview/vue/vue.use().md" },
        ],
      },
      {
        text: "KeepAlive",
        collapsed: true,
        items: [
          { text: "原理", link: "/interview/vue/keep-alive原理.md" },
          { text: "常见坑", link: "/interview/vue/keep-alive常见坑.md" },
          { text: "滚动位置丢失", link: "/interview/vue/keep-alive滚动位置丢失.md" },
        ],
      },
      {
        text: "路由与状态",
        collapsed: true,
        items: [
          { text: "路由模式", link: "/interview/vue/路由模式.md" },
          { text: "Vue Router 使用", link: "/interview/vue/Vue路由.md" },
          { text: "Vuex & Pinia", link: "/interview/vue/vuex&pinia.md" },
        ],
      },
    ],
  },
  {
    text: "工程化",
    collapsed: true,
    items: [
      {
        text: "概念与架构",
        collapsed: true,
        items: [
          { text: "工程化的理解", link: "/interview/前端工程化/前端工程化的理解.md" },
          { text: "工程化概览", link: "/interview/前端工程化/前端工程化.md" },
          { text: "Monorepo", link: "/interview/前端工程化/Monorepo.md" },
          { text: "模块化规范", link: "/interview/前端工程化/模块化规范.md" },
          { text: "ESM vs CommonJS", link: "/interview/前端工程化/ESM-vs-CJS.md" },
          { text: "BFF", link: "/interview/前端工程化/BFF.md" },
          { text: "CDN 原理", link: "/interview/前端工程化/CDN工作原理.md" },
          { text: "Web 渲染策略", link: "/interview/前端工程化/Web渲染策略.md" },
          { text: "前端渲染模式", link: "/interview/前端工程化/前端渲染模式.md" },
          { text: "静态 Server vs 动态 Server", link: "/interview/前端工程化/静态server&动态server.md" },
        ],
      },
      {
        text: "构建工具",
        collapsed: true,
        items: [
          { text: "Webpack", link: "/interview/前端工程化/webpack.md" },
          { text: "Webpack 打包流程", link: "/interview/前端工程化/webpack打包流程.md" },
          { text: "Plugin 与 Loader", link: "/interview/前端工程化/Plugin和Loader的区别.md" },
          { text: "提升 Webpack 速度", link: "/interview/前端工程化/提升webpack打包速度.md" },
          { text: "打包体积优化", link: "/interview/前端工程化/项目打包后体积优化.md" },
          { text: "Tree Shaking", link: "/interview/前端工程化/TreeShaking.md" },
          { text: "Vite", link: "/interview/前端工程化/vite.md" },
          { text: "Vite 为什么快", link: "/interview/前端工程化/vite为啥快.md" },
          { text: "Webpack vs Vite", link: "/interview/前端工程化/webpack&vite.md" },
          { text: "HMR 原理", link: "/interview/前端工程化/HMR原理和机制.md" },
          { text: "Vite 配置解读", link: "/interview/前端工程化/vite配置文件解读.md" },
          { text: "Babel", link: "/interview/前端工程化/babel.md" },
        ],
      },
      {
        text: "包管理与质量",
        collapsed: true,
        items: [
          { text: "npm vs pnpm", link: "/interview/前端工程化/npm-vs-pnpm.md" },
          { text: "npm vs pnpm（详细）", link: "/interview/前端工程化/pnpm-npm.md" },
          { text: "ESLint", link: "/interview/前端工程化/eslint.md" },
          { text: "Prettier", link: "/interview/前端工程化/prettier.md" },
          { text: "ESLint & Prettier 配置", link: "/interview/前端工程化/eslint-prettier配置.md" },
          { text: "Stylelint", link: "/interview/前端工程化/stylelint.md" },
          { text: "Husky & Lint-Staged", link: "/interview/前端工程化/husky-lint-stage.md" },
          { text: "单元测试", link: "/interview/前端工程化/单元测试.md" },
          { text: "CI/CD", link: "/interview/前端工程化/CICD.md" },
          { text: "本地测试 vs 生产模式", link: "/interview/前端工程化/本地测试生产模式对比.md" },
        ],
      },
      {
        text: "团队协作",
        collapsed: true,
        items: [
          {
            text: "组件复用与代码风格",
            link: "/interview/前端工程化/团队协作组件复用.md",
          },
        ],
      },
      {
        text: "文档",
        collapsed: true,
        items: [
          { text: "文档档案对照", link: "/interview/前端工程化/文档档案对照.md" },
        ],
      },
    ],
  },
  {
    text: "性能优化",
    collapsed: true,
    items: [
      { text: "前端性能优化", link: "/interview/性能优化/前端性能优化.md" },
      { text: "首屏加载优化", link: "/interview/性能优化/首屏加载慢如何解决.md" },
      { text: "骨架屏", link: "/interview/性能优化/骨架屏.md" },
      { text: "网络性能优化", link: "/interview/网络/网络性能优化.md" },
    ],
  },
  {
    text: "Node.js",
    collapsed: true,
    items: [
      { text: "事件循环", link: "/interview/node/Node事件循环机制.md" },
      { text: "模块判断", link: "/interview/node/模块判断.md" },
      { text: "Express", link: "/frontend/JavaScript/backend-frameworks/express/" },
      { text: "Next.js", link: "/frontend/JavaScript/backend-frameworks/nextjs/" },
      { text: "NestJS Observable", link: "/interview/node/Observable.md" },
    ],
  },
  {
    text: "业务实战",
    collapsed: true,
    items: [
      {
        text: "组件与封装",
        collapsed: true,
        items: [
          { text: "拖拽组件", link: "/interview/业务场景/拖拽组件.md" },
          { text: "组件封装", link: "/interview/业务场景/组件封装.md" },
          { text: "组件封装主题色", link: "/interview/业务场景/组件封装主题色.md" },
          { text: "全局 Loading", link: "/interview/业务场景/全局loading.md" },
          { text: "render 动态渲染 VNode", link: "/interview/业务场景/render函数动态vnode渲染.md" },
        ],
      },
      {
        text: "列表与加载",
        collapsed: true,
        items: [
          { text: "懒加载", link: "/interview/业务场景/懒加载.md" },
          { text: "上拉加载", link: "/interview/业务场景/上拉加载.md" },
          { text: "长列表优化", link: "/interview/业务场景/长列表.md" },
          { text: "瀑布流", link: "/interview/业务场景/瀑布流.md" },
        ],
      },
      {
        text: "路由与权限",
        collapsed: true,
        items: [
          { text: "动态路由与权限", link: "/interview/业务场景/动态路由与权限.md" },
          { text: "RBAC 动态路由", link: "/interview/业务场景/RBAC动态路由.md" },
        ],
      },
      {
        text: "上传与流式",
        collapsed: true,
        items: [
          { text: "文件上传", link: "/interview/业务场景/文件上传.md" },
          { text: "流式响应", link: "/interview/业务场景/流式响应.md" },
          { text: "响应顺序导致渲染错位", link: "/interview/业务场景/响应顺序导致渲染错位.md" },
        ],
      },
      {
        text: "交互与动效",
        collapsed: true,
        items: [
          { text: "AI 对话复制", link: "/frontend/AI对话复制.md" },
          { text: "自定义栈页面切换", link: "/interview/业务场景/自定义栈逻辑页面切换效果.md" },
          { text: "跳转特效", link: "/interview/业务场景/跳转特效.md" },
          { text: "人类行为验证", link: "/interview/业务场景/人类行为验证.md" },
          { text: "iOS 分享卡片跳转", link: "/interview/业务场景/IOS-app跳转.md" },
        ],
      },
    ],
  },
  {
    text: "AI 面试",
    collapsed: true,
    items: [
      { text: "RAG", link: "/AI/面试/RAG.md" },
      { text: "提示词工程", link: "/AI/面试/提示词工程.md" },
      { text: "模型训练过程", link: "/AI/面试/模型训练过程.md" },
      { text: "异步流处理", link: "/AI/面试/异步流处理.md" },
      { text: "流式打字机", link: "/AI/面试/流式打字机.md" },
      { text: "Map 与 Redis", link: "/AI/面试/map和redis.md" },
      { text: "原子扣费", link: "/AI/面试/原子扣费.md" },
      { text: "Skill 模版", link: "/AI/面试/skill模版.md" },
      { text: "算法", link: "/AI/面试/算法.md" },
      { text: "面试题汇总", link: "/AI/面试/针对面试.md" },
    ],
  },
  {
    text: "工具与基建",
    collapsed: true,
    items: [
      {
        text: "Git",
        collapsed: true,
        items: [
          { text: "分支开发流程", link: "/git/分支开发流程.md" },
          { text: "Git 语法", link: "/git/git语法.md" },
        ],
      },
      {
        text: "调试与 Shell",
        collapsed: true,
        items: [
          { text: "调试技巧", link: "/tools/debug.md" },
          { text: "Shell 配置文件读取顺序", link: "/tools/shell配置文件读取顺序.md" },
          { text: "执行 Shell 的方式", link: "/tools/执行shell的方式.md" },
        ],
      },
      {
        text: "其他",
        collapsed: true,
        items: [
          { text: "设计模式", link: "/interview/前端工程化/设计模式.md" },
          { text: "Lodash 库概览", link: "/interview/前端工程化/lodash库.md" },
          { text: "关系型 vs 文档型数据库", link: "/interview/前端工程化/关系型数据库和文档型数据库.md" },
        ],
      },
    ],
  },
  {
    text: "408 计算机基础",
    collapsed: true,
    items: [
      { text: "正向代理与反向代理", link: "/408/computer-network/正向代理&反向代理.md" },
      { text: "计算机网络五层模型", link: "/408/computer-network/计算机网络五层模型.md" },
    ],
  },
];

// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    title: "My notes",
    description: "Frontend learning notes",
    ignoreDeadLinks: true,
    head: [
      ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" }],
      ["link", { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon-48x48.png" }],
      ["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }],
    ],
    vite: {
      plugins: [inlineNavSearchPlugin()],
      resolve: {
        alias: [
          {
            find: /^@vueuse\/core$/,
            replacement: requireFromVitePress.resolve("@vueuse/core"),
          },
          {
            find: /^minisearch$/,
            replacement: requireFromVitePress.resolve("minisearch"),
          },
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
      logo: "/logo.jpg",
      outline: {
        level: "deep",
      },
      search: {
        provider: "local",
        options: {
          translations: {
            button: {
              buttonText: "搜索",
              buttonAriaLabel: "搜索文档",
            },
            modal: {
              displayDetails: "显示详细列表",
              resetButtonTitle: "重置搜索",
              backButtonTitle: "关闭搜索",
              noResultsText: "无结果",
              footer: {
                selectText: "选择",
                navigateText: "切换",
                closeText: "关闭",
              },
            },
          },
        },
      },
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: "首页", link: "/" },
        {
          text: "前端",
          items: [
            { text: "HTML", link: "/frontend/HTML/图片类型及选择.md" },
            { text: "CSS", link: "/frontend/CSS/css选择器.md" },
            { text: "JavaScript", link: "/interview/js/var-let-const.md" },
            { text: "TypeScript", link: "/frontend/JavaScript/JavaScript-Flavours/TypeScript.md" },
            { text: "浏览器", link: "/interview/浏览器/浏览器组成.md" },
            { text: "网络", link: "/interview/网络/输入URL后.md" },
            { text: "Vue", link: "/interview/vue/ref和reactive.md" },
            { text: "工程化", link: "/interview/前端工程化/前端工程化的理解.md" },
            { text: "性能优化", link: "/interview/性能优化/前端性能优化.md" },
            { text: "Node.js", link: "/interview/node/Node事件循环机制.md" },
            { text: "业务实战", link: "/interview/业务场景/拖拽组件.md" },
            { text: "AI 面试", link: "/AI/面试/RAG.md" },
            { text: "工具与基建", link: "/git/分支开发流程.md" },
            { text: "408 计算机基础", link: "/408/computer-network/正向代理&反向代理.md" },
          ],
        },
        {
          text: "AI",
          items: [
            { text: "MCP", link: "/AI/MCP.md" },
            { text: "Pi Agent MCP", link: "/AI/Pi-Agent-MCP.md" },
            { text: "OpenClaw", link: "/AI/openclaw.md" },
            { text: "Skill", link: "/skill/" },
            { text: "Rule", link: "/rule/" },
            { text: "Prompt", link: "/prompt/复习记录.md" },
          ],
        },
      ],

      sidebar: {
        "/frontend/": frontendSidebar,
        "/408/": frontendSidebar,
        "/tools/": frontendSidebar,
        "/interview/": frontendSidebar,
        "/git/": frontendSidebar,
        "/AI/": [
          {
            text: "AI",
            items: [
              { text: "MCP", link: "/AI/MCP.md" },
              { text: "Pi Agent MCP", link: "/AI/Pi-Agent-MCP.md" },
              { text: "OpenClaw", link: "/AI/openclaw.md" },
            ],
          },
          {
            text: "AI 面试",
            items: [
              { text: "RAG", link: "/AI/面试/RAG.md" },
              { text: "提示词工程", link: "/AI/面试/提示词工程.md" },
              { text: "模型训练过程", link: "/AI/面试/模型训练过程.md" },
              { text: "异步流处理", link: "/AI/面试/异步流处理.md" },
              { text: "流式打字机", link: "/AI/面试/流式打字机.md" },
              { text: "Map 与 Redis", link: "/AI/面试/map和redis.md" },
              { text: "原子扣费", link: "/AI/面试/原子扣费.md" },
              { text: "Skill 模版", link: "/AI/面试/skill模版.md" },
              { text: "算法", link: "/AI/面试/算法.md" },
              { text: "面试题汇总", link: "/AI/面试/针对面试.md" },
            ],
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
        "/skill/": [
          {
            text: "Skill",
            items: [{ text: "概览", link: "/skill/" }],
          },
        ],
        "/rule/": [
          {
            text: "Rule",
            items: [{ text: "概览", link: "/rule/" }],
          },
        ],
      },

      socialLinks: [
        { icon: "github", link: "https://github.com/vuejs/vitepress" },
      ],
    },
  }),
);
