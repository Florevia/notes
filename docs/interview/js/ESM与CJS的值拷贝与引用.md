# ESM 与 CJS 的核心差异：值拷贝 vs 动态引用

## 1. 核心结论（面试必背）

| 特性             | CommonJS (CJS)                   | ES Modules (ESM)                        |
| :--------------- | :------------------------------- | :-------------------------------------- |
| **输出机制**     | **值的拷贝** (Value Copy)        | **值的引用** (Live Binding / Reference) |
| **加载时机**     | **运行时**加载 (Runtime)         | **编译时**静态分析 (Static analysis)    |
| **加载方式**     | 同步加载 (Synchronous)           | 异步加载 (Asynchronous capability)      |
| **对象引用**     | 可读写                           | 导入的变量是**只读** (Read-only) 的     |
| **Tree Shaking** | 困难 (因为动态性)                | **原生支持** (因为静态结构)             |
| **this 指向**    | 指向当前模块对象                 | `undefined`                             |
| **主要环境**     | Node.js (传统), Webpack 打包结果 | 浏览器, Deno, Node.js (现代)            |

---

## 2. 深度原理对比

### CommonJS：缓存出的"快照"

- **机制**：Node.js 在模块第一次被 require 时，执行该模块，将 `module.exports` 的结果**缓存**下来。

- **值拷贝**：
  - 如果导出的是**基本类型**，`require` 拿到的是这个值的**副本**。模块内部变量变化，**不会**影响外部拿到的值。
  - 如果导出的是**引用类型**，拿到的是对象的浅拷贝引用（即同一个内存地址）。

### ES Modules：实时的"连接"

- **机制**：JS 引擎在编译阶段分析导出/导入关系，建立**内存映射**。
- **动态引用**：
  - `import` 导入的变量是指向导出模块内部变量的**指针**。
  - 模块内部变量变化，外部**实时感知**。
  - 外部无法重新赋值（`Assignment to constant variable`），只能由导出模块修改。

## 3. 经典面试题：计数器差异

这是区分二者最直观的例子。

### CommonJS (值拷贝 - 断开联系)

```javascript
// counter.js
let count = 1;
function increment() {
  count++;
}
module.exports = { count, increment };

// main.js
const { count, increment } = require("./counter");
console.log(count); // 1
increment();
console.log(count); // 1  <-- 仍然是 1！因为 require 拿到的是 count 的副本
```

> **修正 CJS 问题的方法**：导出 getter 函数

```js
// counter.js
let count = 1;
function increment() {
  count++;
}
module.exports = {
  get count() {
    return count;
  },
  increment,
};

// main.js
const { count, increment } = require("./index.js"); // ❌ 解构后count是只读的，并且失去了对count的引用
console.log(count); // 1
increment();
console.log(count); // 1

// ✅ 解决方案： 获取整个导出的对象
const counter = require("./index.js");

counter.increment();
console.log(counter.count); // 触发 getter，拿到 2
```

### ES Modules (动态引用 - 保持同步)

```javascript
// counter.js
export let count = 1;
export function increment() {
  count++;
}

// main.js
import { count, increment } from "./counter";
console.log(count); // 1
increment();
console.log(count); // 2  <-- 变成了 2！因为 import 拿到的是绑定的引用
```

---

## 4. 循环依赖处理

- **CommonJS**：遇到循环依赖时，只输出 **已执行部分** 的 `module.exports`。可能会拿到空对象 `{}` 或不完整的属性，容易报错。

- **ESM**：由于是静态分析，只要引用存在即可。利用函数提升或动态引用，通常能更好地解决循环依赖（虽然也需小心 TDZ 暂时性死区）。
