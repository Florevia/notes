# Vue 编译器的实现原理

## 概括

Vue 的编译器（Compiler）本质上就是一个将 **模板字符串`<template></template>` 转换为 渲染函数（render function）** 的程序。

```mermaid
flowchart LR
  A["Template 模板字符串"] -->|Parse 解析| B["AST 抽象语法树"]
  B -->|Transform 转换优化| C["优化后的 AST"]
  C -->|Codegen 代码生成| D["render() 渲染函数"]

  style A fill:#42b883,color:#fff,stroke:none
  style B fill:#35495e,color:#fff,stroke:none
  style C fill:#35495e,color:#fff,stroke:none
  style D fill:#42b883,color:#fff,stroke:none
```

## 1. 为什么需要编译器？

> DSL：领域特定语言

编译器的职责:

`.vue` 文件里写的 `<template>` 是 **DSL（领域特定语言）**，浏览器并不认识。Vue 需要把它转换成 浏览器能执行的 **JavaScript 渲染函数**.

```vue
<!-- 我们写的模板 -->
<template>
  <div id="app">
    <p>{{ msg }}</p>
  </div>
</template>
```

```js
// 编译器输出的渲染函数
function render(_ctx) {
  return _createElementVNode("div", { id: "app" }, [
    _createElementVNode("p", null, _toDisplayString(_ctx.msg)),
  ]);
}
```

## 2. 编译三大阶段

Vue 3 的编译器（`@vue/compiler-core`）分为 **三个核心阶段**：

### 2.1 Parse（解析）

> 过程： 模板 → AST

将模板字符串解析为 **抽象语法树（AST）**。

**工作原理：**

- 使用 **有限状态机** 对模板进行逐字符扫描（词法分析）
- 识别出各种 **Token**：开始标签、结束标签、属性、插值表达式、文本等
- 将 Token 组装为一棵树形结构的 **AST**，维护父子关系

```js
// 模板
`<div><p>{{ msg }}</p></div>`

// 解析后的 AST（简化）
{
  type: 'Root',
  children: [{
    type: 'Element',
    tag: 'div',
    children: [{
      type: 'Element',
      tag: 'p',
      children: [{
        type: 'Interpolation',       // 插值节点
        content: { type: 'Expression', content: 'msg' }
      }]
    }]
  }]
}
```

> **面试要点**：解析过程类似于编译原理中的 **词法分析 + 语法分析**，Vue 使用的是递归下降的方式来构建 AST。

---

### 2.2 Transform（转换/优化）

> 过程： AST → 优化后的 AST

对 AST 进行 **语义分析和编译优化**，这是 Vue 3 性能提升的关键一环。

**主要工作：**

| 转换项                        | 说明                                                                     |
| ----------------------------- | ------------------------------------------------------------------------ |
| **指令转换**                  | 将 `v-if`、`v-for`、`v-on`、`v-bind` 等指令转换为对应的代码结构          |
| **静态提升（hoistStatic）**   | 将不会变化的静态节点提升到渲染函数外部，避免重复创建                     |
| **PatchFlag 标记**            | 为动态节点打上标记（如 TEXT=1、CLASS=2），告诉运行时只需 diff 标记的部分 |
| **Block Tree 收集**           | 将动态节点收集到 Block 中，形成"动态节点平面数组"，跳过静态节点的 diff   |
| **事件缓存（cacheHandlers）** | 缓存内联事件处理函数，避免每次渲染都创建新的函数实例                     |

> **面试要点**：Vue 3 通过 Transform 阶段实现了 **编译时优化**，把运行时的 diff 开销降到最低。这是 Vue 3 比 Vue 2 快的核心原因之一。

---

### 2.3 Codegen（代码生成）

> 过程： AST → render 函数字符串

遍历优化后的 AST，**拼接生成** render 函数的 JavaScript 代码字符串。

**工作原理：**

- 递归遍历 AST 节点
- 根据节点类型（Element、Text、Interpolation、Directive 等）生成对应的 `createVNode`、`toDisplayString` 等函数调用
- 最终输出一段 **可执行的 JavaScript 字符串**，包裹在 `function render() {}` 中

```js
// 最终生成的代码字符串
`function render(_ctx, _cache) {
  return (_openBlock(), _createElementBlock("div", { id: "app" }, [
    _hoisted_1,
    _createElementVNode("p", null, _toDisplayString(_ctx.msg), 1 /* TEXT */)
  ]))
}`;
```

---

## 3. 编译时机：运行时编译 vs 预编译

| 维度         | 运行时编译（Runtime Compilation）     | 预编译（AOT / Build-time Compilation）                |
| ------------ | ------------------------------------- | ----------------------------------------------------- |
| **触发时机** | 浏览器中执行时                        | 构建阶段（Webpack / Vite）                            |
| **使用包**   | `vue.global.js`（完整版，包含编译器） | `vue.runtime.esm-bundler.js`（运行时版，不含编译器）  |
| **处理对象** | `template` 选项中的字符串             | `.vue` 文件中的 `<template>`                          |
| **处理工具** | Vue 内置编译器                        | `vue-loader`（Webpack）/ `@vitejs/plugin-vue`（Vite） |
| **体积**     | 较大（包含编译器 ~14KB）              | 较小（不含编译器）                                    |
| **性能**     | 首次加载有编译开销                    | 构建时完成编译，运行时零开销                          |

> **面试要点**：我们日常使用 Vite/Webpack + `.vue` 文件开发时，走的是 **预编译** 路径。编译器代码不会被打入生产包，所以不存在运行时编译开销。

---

## 4. Vue 3 编译优化总结（面试高频）

| 优化策略                   | 核心思想                                                    |
| -------------------------- | ----------------------------------------------------------- |
| **Block Tree + PatchFlag** | 将动态节点平铺收集，diff 时跳过整棵静态子树，只对比动态节点 |
| **静态提升 hoistStatic**   | 纯静态节点只创建一次，后续 render 直接复用引用              |
| **事件缓存 cacheHandlers** | `@click="handler"` 编译后被缓存，不会每次 render 创建新函数 |
| **SSR 优化**               | 静态内容直接输出字符串拼接，不走 VNode 创建流程             |

这些优化的共同点是：**把尽可能多的工作从运行时移到编译时**。

---

## 5. 总结回答模板（面试用）

> Vue 的编译器本质是将 **template 模板转换为 render 函数** 的过程，分为三个阶段：
>
> 1. **Parse**：通过词法分析和语法分析，将模板字符串解析为 AST；
> 2. **Transform**：对 AST 进行转换和优化，包括指令处理、静态提升、PatchFlag 标记、Block Tree 收集等；
> 3. **Codegen**：遍历优化后的 AST，生成 render 函数代码字符串。
>
> Vue 3 在 Transform 阶段引入了大量编译时优化（静态提升、PatchFlag、Block Tree），核心思想是 **把运行时的 diff 开销尽可能转移到编译时**，让渲染只关注真正变化的动态节点。
>
> 在实际项目中，编译发生在构建阶段（由 vue-loader 或 @vitejs/plugin-vue 完成），生产包中不包含编译器代码。
