# 虚拟 DOM

## 本质

虚拟 DOM 是一个 **JS 对象**，它是对真实 DOM 的一种轻量级抽象描述。

通过对象属性（如 tag, props, children 等）来模拟 DOM 节点的结构。

- 真实 HTML

  ```html
  <div id="app" class="container">
    <h1 style="color: red">Hello Vue</h1>
    <p>This is a virtual dom.</p>
  </div>
  ```

- 对应的 虚拟 DOM

  ```js
  const vnode = {
    // 1. 标签名 (Tag)
    tag: "div",

    // 2. 属性 (Props/Data)
    props: {
      id: "app",
      class: "container",
    },

    // 3. 子节点 (Children)
    children: [
      {
        tag: "h1",
        props: { style: "color: red" },
        children: "Hello Vue", // 简单的文本子节点
      },
      {
        tag: "p",
        props: {},
        children: "This is a virtual dom.",
      },
    ],
  };
  ```

## 工作流程

- 当 **状态变更** 时，
- 框架会生成 **新的虚拟 DOM 树**，
- 通过 **对比新旧两棵树（Diff 算法）**，
- 计算出 **最小的变更集**，
- 最后应用到 **真实的 DOM 上**。

## 核心作用

**1. 优化渲染效率**

- 真实 DOM 的操作（尤其是引起 **重排 Reflow** 和 **重绘 Repaint**）是非常昂贵的。虚拟 DOM 在内存中进行计算是非常快的。

- **Diff 算法与批量更新**： 通过 Diff 算法找出最小差异，并将多次变更合并为一次 DOM 更新 **（Batching）**，最大程度减少了浏览器的重排和重绘。

  > 注意： 虚拟 DOM 不一定比极致优化的原生 DOM 操作快，但它能保证在构建大型应用时，性能维持在一个不错的水平，且无需开发者手动优化 DOM 操作。

**2. 实现跨平台能力 (最重要的架构价值)**

- 虚拟 DOM **本质是 JS 对象**，它不依赖于具体的宿主环境（如浏览器）。

  - 因此可以根据 **不同的渲染器（Renderer）**，将同一套代码渲染到不同平台。

    - 例如：渲染到 Web 是 React/Vue，渲染到 iOS/Android 是 React Native/Weex，甚至可以渲染到 Canvas 或小程序。

**3. 提升开发效率（声明式编程）**

- 它让我们从繁琐的 **命令式 DOM 操作**（如 document.getElementById、appendChild）中解放出来。

- 我们只需要关注**状态（State）**的变化，UI 的更新细节交给框架处理，实现了 **数据驱动视图** 的声明式开发模式，极大地降低了代码维护成本。

## 适用场景总结

**适合使用虚拟 DOM 的场景**：

- **复杂、交互频繁的大型应用**：如后台管理系统、社交媒体 feed 流。DOM 结构复杂，更新频率高，靠人肉优化 DOM 操作成本极高且易出错。
- **跨平台开发**：如需要一套代码同时运行在 Web、iOS、Android (React Native/Weex) 小程序上。

**不适合使用虚拟 DOM 的场景**：

- **极致追求性能的简单页面**：如纯静态展示页、简单的营销活动页（H5）。原生 JS 操作 DOM 少了一层计算，性能更好。
- **即时性要求极高的动画/游戏**：如频繁操作 Canvas 或大量粒子效果。因为 Diff 算法本身在主线程运行，可能会阻塞动画帧。此时直接操作 DOM 或使用 WebGL 是更好的选择。

## Template 与 Virtual DOM 的关系

Vue 的模版（Template）是写给开发者看的，浏览器并不认识。它们的关系是：

1.  **编译 (Compile)**：Vue 编译器（Compiler）将 `Template` 编译成 **渲染函数 (Render Function)**。

2.  **执行 (Execute)**：当组件运行时，执行这个渲染函数，**返回的结果** 就是 **虚拟 DOM (VNode 树)**。

**公式**：`Template` -> `Compiler` -> `Render Function` -> `VNode (Virtual DOM)`

## 虚拟 DOM 转化成真实 DOM 的过程

这个过程由 **渲染器 (Renderer)** 负责，主要分为两阶段：

1.  **挂载 (Mount)** - 首次渲染：

    - 渲染器遍历虚拟 DOM 树。
    - 根据 VNode 的类型（如元素、文本、组件），调用原生 DOM API（如 `document.createElement`, `document.createTextNode`）创建真实的 DOM 节点。
    - 处理属性（props, class, style）和事件监听。
    - 将创建好的真实 DOM 插入到页面容器中。

2.  **更新 (Patch)** - 再次渲染：
    - 当数据变化时，重新执行 Render Function 生成 **新的虚拟 DOM 树**。
    - 渲染器将 **新旧两棵 VNode 树** 进行对比（Diff 算法）。
    - 找出差异（比如只是文本变了，或者某个 class 变了）。
    - 仅对有差异的部分调用原生 DOM API 进行精准更新（如 `el.textContent = 'new text'`）。

## Diff 算法

当组件 **创建** 和 **更新** 时，vue 均会执行内部的 `update 函数`，该函数利用 `render 函数` 生成虚拟 dom 树，组件会指向新树，然后 vue 将 **新旧两树进行对比**，找到差异点，最终更新到真实 dom。

对比差异的过程叫 diff，vue 在内部通过一个叫 `patch` 的函数完成该过程。在对比时，vue 采用 **深度优先、逐层比较** 的方式进行比对。

在判断两个节点是否相同时，vue 是通过 **虚拟节点的 key 和 tag 来进行判断** 的。

具体来说，首先对 **根节点进行对比**，如果相同则将 **旧节点关联的真实 dom 的引用挂到新节点上**，然后根据需要更新 **属性** 到真实 dom，然后再对比其子节点数组；如果不相同，则按照新节点的信息 **递归创建所有真实 dom**，然后挂到对应虚拟节点上，然后移除掉旧的 dom。

在对比其子节点数组时，vue 对 **每个子节点数组使用了两个指针**，分别指向头尾，然后不断向中间靠拢来进行对比，这样做的目的是尽量复用真实 dom，尽量少的销毁和创建真实 dom。如果发现相同，则进入和根节点一样的对比流程，如果发现不同，则移动真实 dom 到合适的位置。这样一直递归的遍历下去，直到整棵树完成对比。

## patch 函数

`patch` 是 Vue 虚拟 DOM 机制的核心，它是 **Diff 算法的具体实现者**。

它的核心职责是将新旧 VNode 进行比对，并将差异应用到真实 DOM 上。

### 判断是否是同一个节点 (sameVnode)

这是 Diff 的前提。Vue 只有在两个节点被判定为“相同”时，才会去比较它们的内部细节（子节点、属性等），否则直接替换。

判断标准（主要）：

1.  **key 相同**：这是最关键的标识。
2.  **tag (标签名) 相同**：例如都是 `<div>`。
3.  **isComment 相同**：是否都是注释节点。
4.  **data (属性) 定义情况相同**：是否都定义了 `data`。
5.  **input 类型相同**：如果是 `<input>`，`type` 必须相同。

### 3. patchVnode (精细化比对)

当判定为 `sameVnode` 时，进入 `patchVnode`，主要做以下事情：

1.  **复用 DOM**：将旧节点的真实 DOM (`oldVnode.elm`) 赋值给新节点 (`vnode.elm`)，因为它们是同一个节点。
2.  **文本节点更新**：
    - 如果新旧节点都是文本节点，且文本内容不同 -> **更新文本内容** (`textContent`)。
3.  **子节点比对 (重点)**：
    - **新旧都有子节点**：调用 `updateChildren` (这是最复杂的部分，双端比对算法)。
    - **只有新节点有子节点**：
      - 如果旧节点是文本，先清空文本。
      - 这里的操作等于：**添加子节点**。
    - **只有旧节点有子节点**：
      - 这里的操作等于：**移除子节点**。
    - **都没有子节点**：
      - 如果旧节点是文本，清空文本。

### 4. 总结图解

- **Patch 开始** -> 新旧节点相同？
  - **NO** -> 暴力替换 (Destroy Old, Create New)
  - **YES** -> `patchVnode`
    - 更新属性 (Props/Class/Style)
    - **文本不同？** -> 更新 Text
    - **子节点不同？** -> `updateChildren` (Diff 核心逻辑)
