# es6新特性

## 1. 变量与作用域 (Scope)

- `let / const`：引入了块级作用域，解决了 `var` 的变量提升和全局污染问题。

## 2. 函数式增强 (Functional)

- 箭头函数：

> 特性：更简洁的语法；不绑定自己的 `this`（继承自父级上下文）；没有 `arguments`。

- 解构赋值：从数组或对象中提取数据。

- 参数默认值：函数声明时直接指定默认值。

## 3. 数据结构与类型 (Data Structure)

- 模板字符串：支持多行文本和插值 `${}`。

- 对象属性简写：当属性名和变量名一致时可缩写为 `{ name }`。

- 展开/剩余运算符 `...`：
  - 展开 (Spread)：用于数组/对象克隆和合并。

  - 剩余 (Rest)：用于函数不定参数接收。

- 新的基本类型 Symbol 和 BigInt：
  - Symbol：解决属性名冲突。

  - BigInt：解决 JavaScript 对超大整数精度丢失的问题（处理后端返回的长 ID）。

- Map 和 Set：
  - Set：常用作数组去重。

  - Map：支持任意类型作为键（Object 只能用字符串或 Symbol），性能更好。

## 4. 异步处理 (Asynchronous) —— 核心中的核心

- Promise：从回调地狱转变为链式调用。

- Async / Await (ES2017)：

本质：它是 Generator 的语法糖，让异步代码写起来像同步代码一样，极大提高了可读性。

## 5. 模块化与类 (Modular & Class)

- ES Modules (import / export)：官方定义的模块化标准，支持 **_静态分析_**，是 Tree-Shaking 的基础。

- Class 语法：虽然本质仍是原型链，但提供了更接近传统面向对象的写法，降低了理解门槛。

## 6. 最新的“语法糖”（ES2020+）

- 可选链 (?.)：`user?.profile?.name`。

- 空值合并运算符 (??)：只有当值为 `null` 或 `undefined` 时才取默认值，区别于 `||`（会误伤 0 或空字符串）。

```js
const name = user?.name ?? "默认值";
```
