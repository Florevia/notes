# Promise

### 三种状态

- **pending**（进行中）：初始状态
- **fulfilled**（已成功）：操作成功完成
- **rejected**（已失败）：操作失败

> **状态不可逆！** 一旦从 pending 变为 fulfilled 或 rejected，状态就不会再改变。

```js
const promise = new Promise((resolve, reject) => {
  // resolve 和 reject 只会生效一次
  resolve("success");
  reject("error"); // 这行不会执行，因为状态已经改变
});
```

## Promise 状态传递

### then

```mermaid
flowchart TD
  A["P1 已经 settled"] --> B{"P1 状态?"}

  B -->|"fulfilled"| C{"有 onFulfilled ?"}
  B -->|"rejected"| J{"有 onRejected ?"}

  %% fulfilled 分支
  C -->|"否"| F["P2 直接继承<br/>fulfilled(P1.value)"]
  C -->|"是"| D["执行 onFulfilled 回调"]

  D --> M{"回调结果?"}
  M -->|"return 非 Promise 值 x"| F2["P2 fulfilled(x)"]
  M -->|"return Promise q"| G["P2 跟随 q 的状态<br/>q fulfilled ⇒ P2 fulfilled<br/>q rejected ⇒ P2 rejected"]
  M -->|"throw e"| H["P2 rejected(e)"]

  %% rejected 分支
  J -->|"否"| K["P2 直接继承<br/>rejected(P1.reason)"]
  J -->|"是"| L["执行 onRejected 回调"]

  L --> N{"回调结果?"}
  N -->|"return 非 Promise 值 x"| F3["P2 fulfilled(x)<br/>(错误被处理了)"]
  N -->|"return Promise q"| G2["P2 跟随 q 的状态<br/>q fulfilled ⇒ P2 fulfilled<br/>q rejected ⇒ P2 rejected"]
  N -->|"throw e2"| H2["P2 rejected(e2)"]
```

### catch

```mermaid
flowchart TD
  A["P1 已经 settled"] --> B{"P1 状态?"}

  B -->|"fulfilled"| C["不执行 onRejected<br>P2 直接继承 fulfilled(P1.value)"]
  B -->|"rejected"| D{"有 onRejected ?"}

  D -->|"否"| E["P2 直接继承 rejected(P1.reason)"]
  D -->|"是"| F["执行 onRejected 回调"]

  F --> G{"回调结果?"}
  G -->|"return 非 Promise 值 x"| H["P2 fulfilled(x)<br>(错误被处理了)"]
  G -->|"return Promise q"| I["P2 跟随 q 的状态"]
  G -->|"throw e2"| J["P2 rejected(e2)"]
```

### finally

```mermaid
flowchart TD
  A["P1 已经 settled"] --> B{"P1 状态?"}

  B -->|"fulfilled"| C{"有 onFinally ?"}
  B -->|"rejected"| J{"有 onFinally ?"}

  C -->|"否"| D["P2 继承 fulfilled(P1.value)"]
  C -->|"是"| E["执行 onFinally 回调"]

  J -->|"否"| K["P2 继承 rejected(P1.reason)"]
  J -->|"是"| L["执行 onFinally 回调"]

  E --> M{"回调结果?"}
  M -->|"正常结束或<br>返回非 Promise 值"| N["P2 继承 fulfilled(P1.value)"]
  M -->|"返回 Promise q"| O["等待 q settled"]
  O -->|"q fulfilled"| P["P2 继承 fulfilled(P1.value)"]
  O -->|"q rejected(r)"| Q["P2 rejected(r)"]
  M -->|"抛出 e"| R["P2 rejected(e)"]

  L --> S{"回调结果?"}
  S -->|"正常结束或<br>返回非 Promise 值"| T["P2 继承 rejected(P1.reason)"]
  S -->|"返回 Promise q"| U["等待 q settled"]
  U -->|"q fulfilled"| V["P2 继承 rejected(P1.reason)"]
  U -->|"q rejected(r)"| W["P2 rejected(r)"]
  S -->|"抛出 e"| X["P2 rejected(e)"]
```

---

## Promise 静态方法

- Promise.resolve(value)
- Promise.reject(reason)
- Promise.all(iterable)
- Promise.race(iterable)
- Promise.allSettled(iterable)
- Promise.any(iterable)

## 常见面试题

### resolve 传入 Promise

```js
const p1 = new Promise((resolve) => {
  setTimeout(() => {
    resolve("p1");
  }, 1000);
});

const p2 = new Promise((resolve) => {
  setTimeout(() => {
    resolve(p1); // resolve 传入另一个 Promise
  }, 500);
});

p2.then((res) => console.log(res)); // 'p1' (                           1秒后输出)
```

**解析**: 当 `resolve(promise)` 时，会等待传入的 Promise settled 后，采用其状态和值。

---

### Promise 构造器中抛错 vs resolve(Promise.reject())

```js
// 情况 A
const pA = new Promise((resolve) => {
  resolve(Promise.reject("error A"));
});

// 情况 B
const pB = new Promise((resolve, reject) => {
  reject("error B");
});

// 情况 C
const pC = new Promise(() => {
  throw "error C";
});

pA.catch((e) => console.log("A:", e));
pB.catch((e) => console.log("B:", e));
pC.catch((e) => console.log("C:", e));
// B: error B
// C: error C
// A: error A
```

---

### 微任务时序（高频考点）

```js
Promise.resolve()
  .then(() => {
    console.log(1);
    return Promise.resolve(2); // 返回一个 fulfilled Promise
  })
  .then((res) => {
    console.log(res);
  });

Promise.resolve()
  .then(() => {
    console.log(3);
  })
  .then(() => {
    console.log(4);
  })
  .then(() => {
    console.log(5);
  });
  .then(() => {
    console.log(6);
  });
// 1 3 4 5 2
```

---

### resolve(promise) vs return promise

```js
const p1 = new Promise((resolve) => {
  setTimeout(() => resolve("p1"), 1000);
});

const p2 = new Promise((resolve) => {
  resolve(p1);
});

const p3 = Promise.resolve().then(() => p1);

p2.then((res) => console.log("p2:", res));
p3.then((res) => console.log("p3:", res));

console.log("p2 === p1:", p2 === p1);
console.log("p3 === p1:", p3 === p1);
```

**输出**:

```js
p2 === p1: false
p3 === p1: false
// 1秒后
p2: p1
p3: p1
```

**核心解析**:

1.  **引用不相等**:
    - `p1` 是源 Promise。
    - `p2` 是 `new Promise` 创建的新实例。即使 `resolve(p1)`，它也只是锁定状态，而非返回同一个对象。
    - `p3` 是 `.then()` 返回的新实例。
    - 所以 `p2 !== p1` 且 `p3 !== p1`。

2.  **执行顺序 (p2 先于 p3)**:
    - `p2` 在构造函数中直接 `resolve(p1)`。这是一个同步操作（或非常早的订阅），`p2` 立即订阅了 `p1` 的状态。
    - `p3` 通过 `Promise.resolve().then(() => p1)` 创建。这是一个**微任务**。只有当这个微任务执行时，回调函数 `() => p1` 被调用，`p3` 才开始订阅 `p1`。
    - 因此，`p2` 比 `p3` 更早进入 `p1` 的等待队列。
    - 当 1 秒后 `p1` settled (fulfilled) 时，它会按顺序通知订阅者：先 `p2`，后 `p3`。
    - 所以 `p2` 的回调先执行，`p3` 的回调后执行。

---

### async/await 与 Promise

```js
async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async1 end");
}

async function async2() {
  console.log("async2");
}

console.log("script start");
async1();
console.log("script end");

// 输出:
// 'script start'
// 'async1 start'
// 'async2'
// 'script end'
// 'async1 end'
```

**解析**: `await` 后面的代码相当于在 `.then()` 中执行，是微任务。

---

### 10. 综合题

```js
console.log("start");

setTimeout(() => console.log("setTimeout"), 0);

Promise.resolve()
  .then(() => console.log("promise1"))
  .then(() => console.log("promise2"));

new Promise((resolve) => {
  console.log("promise3");
  resolve();
}).then(() => console.log("promise4"));

console.log("end");
```

**答案**: `start, promise3, end, promise1, promise4, promise2, setTimeout`
