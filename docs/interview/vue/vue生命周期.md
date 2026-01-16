# Vue 2 与 Vue 3 生命周期详解与面试指南

## 1. 生命周期定义与对比

生命周期（Lifecycle）是指 Vue 实例从创建、初始化数据、编译模板、挂载 DOM、渲染、更新到最终销毁的全过程。Vue 在这个过程中提供了特定的**钩子函数（Hooks）**，允许我们在特定阶段执行代码。

### Vue 2 (Options API) vs Vue 3 (Composition API) 对照表

| 阶段     | Vue 2 (Options API) | Vue 3 (Composition API) | 变化说明                           |
| :------- | :------------------ | :---------------------- | :--------------------------------- |
| **创建** | `beforeCreate`      | `setup()`               | `setup` 在 `beforeCreate` 之前执行 |
|          | `created`           | `setup()`               | `setup` 替代了 `created`           |
| **挂载** | `beforeMount`       | `onBeforeMount`         | 命名增加 `on` 前缀                 |
|          | `mounted`           | `onMounted`             |                                    |
| **更新** | `beforeUpdate`      | `onBeforeUpdate`        |                                    |
|          | `updated`           | `onUpdated`             |                                    |
| **销毁** | `beforeDestroy`     | `onBeforeUnmount`       | **名称变更**: Destroy -> Unmount   |
|          | `destroyed`         | `onUnmounted`           | **名称变更**: Destroy -> Unmount   |
| **其他** | `errorCaptured`     | `onErrorCaptured`       |                                    |
|          | `activated`         | `onActivated`           | Keep-Alive 专用                    |
|          | `deactivated`       | `onDeactivated`         | Keep-Alive 专用                    |

---

## 2. 核心理解与代码示例

### 2.1 Vue 3 Composition API 写法

在 Vue 3 的 `setup` 函数中，需要按需导入生命周期钩子：

```javascript
import { onMounted, onUpdated, onBeforeUnmount } from "vue";

export default {
  setup() {
    // 1. 替代 beforeCreate 和 created
    console.log("setup 执行: 组件创建中...");

    // 2. 挂载完成
    onMounted(() => {
      console.log("onMounted: DOM 已生成，可以访问元素");
      // 这里的逻辑等同于 Vue 2 的 mounted
    });

    // 3. 数据更新
    onUpdated(() => {
      console.log("onUpdated: DOM 已根据响应式数据更新");
    });

    // 4. 卸载之前 (原 beforeDestroy)
    onBeforeUnmount(() => {
      console.log("onBeforeUnmount: 清理定时器、事件监听器等");
    });

    return {};
  },
};
```

### 2.2 关键注意点 (Attention Points)

1.  **Vue 3 的 `setup` 执行时机**：

    - `setup` 在 `beforeCreate` 之前执行。
    - 在 `setup` 中无法访问 `this`（此时实例还未完全初始化）。

2.  **父子组件执行顺序 (高频考点)**：

    - **加载渲染过程**：
      `父 beforeCreate` -> `父 created` -> `父 beforeMount` -> `子 beforeCreate` -> `子 created` -> `子 beforeMount` -> `子 mounted` -> `父 mounted`
      _(记忆口诀：父先开始，子先完成)_
    - **更新过程**：
      `父 beforeUpdate` -> `子 beforeUpdate` -> `子 updated` -> `父 updated`
    - **销毁过程**：
      `父 beforeUnmount` -> `子 beforeUnmount` -> `子 onUnmounted` -> `父 onUnmounted`

3.  **异步请求放在哪里？**：
    - 通常放在 `created` (Vue 2) 或 `setup` (Vue 3) 中，越早越好。
    - 如果在 `mounted` 中请求，可能会导致页面渲染后闪烁（除非依赖 DOM 宽高等属性）。
    - **注意**：SSR（服务端渲染）中，只有 `beforeCreate` 和 `created` 会执行，`mounted` 不会执行。

## 4. 常见面试题 (Q&A)

### Q1: `created` 和 `mounted` 的区别是什么？

- **created**: 实例创建完成，数据观测 (data observer)、属性和方法的运算、watch/event 事件回调已完成。**但 DOM 还没生成**，`$el` 属性不可见。适合：初始数据获取。

- **mounted**: 实例被挂载后调用。此时 **DOM 已经渲染出来**。适合：操作 DOM（如 Chart 初始化）。

### Q2: 谈谈父子组件生命周期的执行顺序？

- 参考上文 "关键注意点"。
- **核心逻辑**：Vue 的编译和挂载是深度优先的。父组件解析模板发现子组件 -> 暂停父组件挂载 -> 开始初始化子组件 -> 子组件挂载完成 -> 回到父组件完成挂载。

### Q4: `setup` 中可以使用 `await` 吗？

- 可以直接使用 `await`，但这样 `setup` 会返回一个 Promise。
- 这需要父级组件使用 `<Suspense>` 包裹才能正常渲染（目前 Suspense 还是实验性特性，需谨慎使用）。
