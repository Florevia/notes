# ESM (Static) vs CJS (Dynamic) 深度解析

本文聚焦三个方面：

- **加载机制**
- **解析时机**
- **内存处理**

## 1. 核心差异概览

| 特性             | **ES6 Module (ESM)**      | **CommonJS (CJS)**           |
| :--------------- | :------------------------ | :--------------------------- |
| **引入语法**     | `import` / `export`       | `require` / `module.exports` |
| **结构类型**     | **静态结构 (Static)**     | **动态结构 (Dynamic)**       |
| **加载时机**     | **编译时 (Compile Time)** | **运行时 (Runtime)**         |
| **值拷贝方式**   | **引用 (Live Binding)**   | **浅拷贝 (Value Copy)**      |
| **Tree Shaking** | **支持** (完美)           | **不支持** (极难)            |
| **顶层 this**    | `undefined`               | `module.exports`             |

### 顶层 this 解读

**为什么会有这个差异？**

**1. CommonJS (CJS)**

- **指向**: `module.exports` (也就是空对象 `{}`)
- **原理**: CommonJS 模块在执行时，实际上是被包裹在一个**函数**里的。

```js
  // Node.js 源码层面的封装逻辑
  (function(exports, require, module, __filename, __dirname) {
      // 你的代码在这里执行
      console.log(this === module.exports); // true
  }).call(module.exports, ...); // 使用 .call 强制绑定 this
```

- **现象**: 你在文件最顶头打印 `console.log(this)`，不会是 `global`，而是当前模块的导出对象。

**2. ES6 Module (ESM)**

- **指向**: `undefined`
- **原理**: ESM 规范规定，模块内部**默认开启严格模式 (`'use strict'`)**。
  - 在严格模式下，函数（或模块顶层）如果没有显式绑定 context，`this` 就是 `undefined`，而不是全局对象 `window/global`。
- **作用**: 避免不小心污染全局变量。

## 2. 静态结构 vs 动态结构 (Static vs Dynamic)

这是两者最本质的区别，也是 Tree Shaking 能否生效的决定性因素。

### CommonJS: 运行时加载 (Dynamic)

- **原理**: `require` 是一个函数，可以在任何地方调用（if 判断、函数内部、循环中）。
- **后果**: 模块依赖关系只有在代码**运行起来之后**才能确定。

```javascript
// 只有运行时随机数大于 0.5，才加载 math 模块
if (Math.random() > 0.5) {
  const math = require("./math");
}
```

打包工具（Webpack）在静态分析阶段（构建时）无法确定 `math` 模块到底有没有被用到，为了安全，必须将其**全部打包**。

### ESM: 编译时加载 (Static)

- **原理**: `import` 是语法关键字（Static Keyword），必须位于文件顶层，不能嵌套在块级作用域中。
- **后果**: 模块依赖关系在**代码运行之前（AST 解析阶段）** 就能完全确定。

```javascript
// ❌ 报错：SyntaxError
if (Math.random() > 0.5) {
  import { add } from "./math";
}

// ✅ 必须写在顶层
import { add } from "./math";
```

打包工具看一眼代码就知道：“这个文件只引用了 `add`，没引用 `sub`”，因此可以放心地在打包产物中**剔除** `sub` 函数（即 **Tree Shaking**）。

## 3. 输出值的差异 (Reference vs Copy)

这是面试中非常容易忽视的高级考点。

### CommonJS: 值的浅拷贝

CJS 模块输出的是一个**值的拷贝**。一旦输出了这个值，模块内部的变化就影响不到这个值了。

```javascript
// counter.js
let count = 1;
function inc() {
  count++;
}
module.exports = { count, inc };

// main.js
const { count, inc } = require("./counter");
console.log(count); // 1
inc();
console.log(count); // 1 (依然是 1，因为 count 是数字，拷贝过去后就断了联系)
```

解决方法：使用 getter 函数动态获取

```js
// counter.js (Fix)
module.exports = {
  get count() {
    return count;
  }, //每次都会运行函数取最新值
  inc,
};
```

### ESM: 值的动态引用 (Live Binding)

ESM 模块输出的是**值的引用**（Live Binding）。JS 引擎对模块的 export 变量会有特殊的处理，它们指向同一个内存地址。

```javascript
// counter.mjs
export let count = 1;
export function inc() {
  count++;
}

// main.mjs
import { count, inc } from "./counter.mjs";
console.log(count); // 1
inc();
console.log(count); // 2 (变成了 2！因为 import 的 count 只是一个只读引用，指向原模块的内存)
```

#### 关键注意事项

1. 在 `main.mjs` 中，`count` 是只读的，你不能直接 `count = 3` 赋值，但原模块 `inc()` 修改它时，你会感知到变化。

2. 默认导出 (Default Export) 的陷阱：`export default` 在某些情况下会破坏 ESM 的 **动态引用 Live Binding** 和 **Tree Shaking** 效果.

- 在 ESM 的具名导出（Named Export）中，导入的变量直接绑定在导出模块的内存地址上。

```js
// counter.js
export let count = 1;
export function inc() {
  count++;
}

// main.js
import { count, inc } from "./counter.js";
console.log(count); // 1
inc();
console.log(count); // 2 (没再次 import，变量自己变了)
```

- 当你使用 export default 时，本质上你是导出了一坨东西赋值给了 default 这个变量。

```js
// counter-default.js
let count = 1;
function inc() {
  count++;
}

// 这里发生了什么？
// 你创建了一个新对象 { count: 1, inc: function }，并把它赋值给 default。
// 注意：这个对象里的 count: 1 是一个普通的属性赋值（Value Copy）。
export default {
  count,
  inc,
};
```

```js
// main.js
import obj from "./counter-default.js";

console.log(obj.count); // 1
obj.inc();
// 内部的 count 确实变成了 2
// 但是！obj 是刚才那个对象 { count: 1 } 的引用。
// obj.count 依然是 1。
console.log(obj.count); // 1 (!!!)

// 因为 JS 对象属性的赋值是浅拷贝，等价于
const _default = { count: count }; // 这一刻，把 count 的值 (1) 抄了一份放进去
export { _default as default };
```

- 最佳实践：尽量使用具名导出（Named Export）。

## 4. 循环依赖处理 (Circular Dependency)

- **CommonJS**: 遇到循环加载时，只输出**已经执行的部分**。如果由循环依赖导致某些属性还没来得及挂载到 `exports` 上，引用方拿到的就是 `undefined`。容易出 Bug。
- **ESM**: 利用“动态引用”特性。只要模块内部使用了 `function` 声明（函数提升），即使循环引用，也能保证在后续调用时找到正确的函数引用。比 CJS 处理得更好。

---

## 5. 总结

随着现代前端工程化（Vite/Webpack5）的发展，**ESM 已经成为绝对的主流**。

1.  **写库/组件**: 必须提供 ESM 格式，方便用户 Tree Shaking。
2.  **Node.js**: 高版本 Node 已经原生支持 ESM（`.mjs` 或 `package.json` 设置 `"type": "module"`）。
3.  **性能**: ESM 的静态分析特性让工具链能做更多激进的优化（Scope Hoisting, Dead Code Elimination）。
