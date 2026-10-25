# Node.js 事件循环机制

## 1. 什么是事件循环？

Node.js 是**单线程**的，通过**事件循环**实现异步操作。

**核心概念：**

- JavaScript 代码在单线程中执行
- 异步操作（如文件读取、网络请求）通过事件循环处理
- 底层使用 **libuv** 库管理事件循环

## 2. 事件循环的 6 个阶段

Node.js 的事件循环分为 6 个阶段，按顺序循环执行：

```
   ┌───────────────────────────┐
┌─>│   1. timers               │  执行 setTimeout/setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │   2. pending callbacks    │  执行系统操作的回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │   3. idle, prepare        │  内部使用
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │   4. poll                 │  执行 I/O 回调（最重要）
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │   5. check                │  执行 setImmediate
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤   6. close callbacks      │  执行关闭事件回调
   └───────────────────────────┘
```

**面试重点：只需记住这 3 个阶段**

1. **timers** - `setTimeout`/`setInterval`
2. **poll** - I/O 操作
3. **check** - `setImmediate`

## 3. 微任务队列

**每个阶段结束后**，都会清空微任务队列。

**微任务优先级（从高到低）：**

```
process.nextTick()  ← 最高优先级
Promise.then()
queueMicrotask()
```

**示例：**

```js
Promise.resolve().then(() => console.log("Promise 1"));

process.nextTick(() => console.log("nextTick 1"));

Promise.resolve().then(() => console.log("Promise 2"));

process.nextTick(() => console.log("nextTick 2"));

// 输出顺序：
// nextTick 1
// nextTick 2
// Promise 1
// Promise 2
```

## 4. setTimeout vs setImmediate

### 4.1 主模块中（顺序不确定）

```js
setTimeout(() => {
  console.log("setTimeout");
}, 0);

setImmediate(() => {
  console.log("setImmediate");
});

// 输出顺序：不确定！
// 原因：取决于事件循环启动时间
```

### 4.2 I/O 回调中（顺序确定）

```js
const fs = require("fs");

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log("setTimeout");
  }, 0);

  setImmediate(() => {
    console.log("setImmediate");
  });
});

// 输出顺序：确定的！
// setImmediate
// setTimeout

// 原因：I/O 回调在 poll 阶段，之后直接进入 check 阶段
```

## 5. 综合示例（必背）

```js
console.log("1: start");

setTimeout(() => {
  console.log("2: setTimeout");
}, 0);

setImmediate(() => {
  console.log("3: setImmediate");
});

process.nextTick(() => {
  console.log("4: nextTick");
});

Promise.resolve().then(() => {
  console.log("5: Promise");
});

console.log("6: end");

// 输出顺序：
// 1: start
// 6: end
// 4: nextTick
// 5: Promise
// 2: setTimeout (或 3 先)
// 3: setImmediate (或 2 先)
```

**执行流程：**

```
1. 同步代码：start → end
2. 微任务：nextTick → Promise
3. 事件循环：setTimeout 和 setImmediate（顺序不确定）
```

## 6. 常见错误

### ❌ 递归 nextTick 会阻塞事件循环

```js
// 危险！会导致其他代码永远无法执行
process.nextTick(function loop() {
  process.nextTick(loop);
});

setTimeout(() => {
  console.log("永远不会执行");
}, 0);
```

### ✅ 正确做法

```js
// 使用 setImmediate 让出事件循环
setImmediate(function loop() {
  // 执行一些操作
  setImmediate(loop);
});
```

## 7. Node.js vs 浏览器

| 特性                 | Node.js        | 浏览器            |
| -------------------- | -------------- | ----------------- |
| **事件循环**         | 6 个阶段       | 宏任务/微任务交替 |
| **process.nextTick** | ✅ 有          | ❌ 无             |
| **setImmediate**     | ✅ 有          | ❌ 无             |
| **微任务时机**       | 每个阶段结束后 | 每个宏任务结束后  |

## 8. 面试必背要点

### 问题 1：Node.js 事件循环有哪些阶段？

**答：** Node.js 事件循环有 6 个阶段，最重要的是：

- **timers 阶段**：执行 setTimeout 和 setInterval 的回调
- **poll 阶段**：执行 I/O 回调，是最核心的阶段
- **check 阶段**：执行 setImmediate 的回调

每个阶段结束后会清空微任务队列（先 nextTick，后 Promise）。

### 问题 2：setTimeout(fn, 0) 和 setImmediate(fn) 的区别？

**答：**

- `setTimeout` 在 **timers 阶段**执行
- `setImmediate` 在 **check 阶段**执行
- 在主模块中，**执行顺序不确定**
- 在 I/O 回调中，**setImmediate 总是先执行**

### 问题 3：process.nextTick 和 Promise.then 的区别？

**答：**

- `process.nextTick` **优先级最高**，在每个阶段结束后立即执行
- `Promise.then` 在 nextTick 队列清空后执行
- 不要递归调用 `process.nextTick`，会阻塞事件循环

### 问题 4：说一下这段代码的执行顺序

```js
console.log("1");

setTimeout(() => {
  console.log("2");
}, 0);

Promise.resolve().then(() => {
  console.log("3");
});

process.nextTick(() => {
  console.log("4");
});

console.log("5");

// 答案：1 → 5 → 4 → 3 → 2
```

**思路：**

1. 同步代码先执行：1 → 5
2. 清空微任务：nextTick (4) → Promise (3)
3. 进入事件循环：setTimeout (2)

## 9. 记忆口诀

```
同步代码先执行
微任务紧跟上（nextTick 最优先）
事件循环分六段
timers、poll、check 是重点
```

## 面试回答模板

**完整回答：**

> Node.js 的事件循环分为 6 个阶段，最重要的是 timers（执行定时器）、poll（执行 I/O）、check（执行 setImmediate）。
>
> 每个阶段结束后会清空微任务队列，process.nextTick 优先级最高，然后是 Promise。
>
> setTimeout 在 timers 阶段执行，setImmediate 在 check 阶段执行。在主模块中两者顺序不确定，但在 I/O 回调中 setImmediate 总是先执行。
>
> 执行顺序是：同步代码 → 微任务（nextTick → Promise）→ 事件循环各阶段。
