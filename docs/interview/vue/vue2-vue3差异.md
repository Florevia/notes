# vue2 & vue3

## 响应式系统的重构 (最底层的质变)

1. Vue 2 (`Object.defineProperty`):
   - 原理： 递归遍历对象属性，把它们转为 `getter/setter`。
   - 痛点：
     - 无法检测对象属性的添加/删除（必须用 `Vue.set` / `$set`）。
     - 无法检测数组下标的变化（直接修改 `arr[0] = 1` 无效）。
     - 性能损耗： 初始化时必须递归处理所有层级的数据，如果数据量大，启动会慢。
2. Vue 3 (`Proxy`):
   - 原理： 使用 ES6 的 `Proxy` 对整个对象进行代理拦截。
   - 优势：
     - 全方位监听： 原生支持对象属性增删、数组索引修改。
     - 性能提升： 采用 **Lazy（惰性）** 代理，只有访问到深层属性时才会去代理它，初始化速度大幅提升。

## Diff 算法优化 (静态标记 PatchFlag)

- Vue 2： 虚拟 DOM 进行全量对比（Diff）。无论节点是否是动态的，都要层层比对。

- Vue 3： 引入了 静态标记 (PatchFlag)。

  > 在编译阶段，Vue 3 会标记哪些节点是动态的（比如绑定了 `{{text}}`），哪些是静态的。
  > 在 Diff 阶段，只对比带有 PatchFlag 的动态节点，完全跳过静态节点。这让 Diff 性能与动态节点数量成正比，而不是模板大小

## 开发体验：Composition API (组合式 API)

1. Vue 2 (Options API):
   - 代码按 `data`, `methods`, `mounted` 选项分类。
   - 缺点： 随着组件变大，同一个功能的逻辑散落在文件各处，代码反复横跳，难以维护和复用。
2. Vue 3 (Composition API):
   - 代码按 “逻辑关注点” 组织。
   - 优势：
     - 逻辑复用： 我们可以利用 Hooks (Composables) 完美地提取和复用逻辑。
     - 类型推导： 对 TypeScript 的支持极佳，代码提示更智能。

## 性能与架构：Tree Shaking 与轻量化

- Vue 2： 很多 API 都是挂载在 Vue 全局对象上的（如 `Vue.nextTick`）。即使你没用，打包时也会带进去，难以剔除。

- Vue 3： 全面拥抱 ES Module。API 变成了具名导出（`import { nextTick } from 'vue'`）。

  > 结果： 构建工具可以完美进行 Tree Shaking，没用到的功能直接摇掉，打包体积更小。

## 新特性与细节

1. Fragment (片段)： Vue 3 组件不再强制要求一个唯一的根节点，支持多个根标签。（减少了无意义的 wrapper `<div>`）。

2. Teleport (传送门)： 可以把组件（如 Modal 弹窗）渲染到 DOM 树的任意位置（如 body 下），解决样式层级（z-index）问题。

3. TypeScript： Vue 3 源码本身就是用 TS 重写的，对 TS 的支持是“原生级”的，不再像 Vue 2 那样需要各种 Hack。
