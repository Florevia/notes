# Map 和 WeakMap 的区别

## 一、Map 基础回顾

`Map` 是 ES6 引入的一种**键值对**集合数据结构，与普通对象不同的是，它的**键可以是任意类型**（对象、函数、基本类型等）。

```js
const map = new Map();

map.set("name", "张三"); // 字符串作为 key
map.set(1, "one"); // 数字作为 key
map.set(true, "yes"); // 布尔值作为 key

const obj = { id: 1 };
map.set(obj, "对象值"); // 对象作为 key
```

### Map 的常用方法

| 方法/属性                           | 说明               |
| ----------------------------------- | ------------------ |
| `set(key, value)`                   | 设置键值对         |
| `get(key)`                          | 获取值             |
| `has(key)`                          | 判断是否存在某个键 |
| `delete(key)`                       | 删除某个键值对     |
| `clear()`                           | 清空所有键值对     |
| `size`                              | 返回键值对数量     |
| `forEach()`                         | 遍历               |
| `keys()` / `values()` / `entries()` | 返回迭代器         |

---

## 二、WeakMap 基础回顾

`WeakMap` 也是键值对集合，但有严格限制：**键只能是对象**（或未注册的 Symbol），不能是基本类型。

```js
const wm = new WeakMap();

const obj = { id: 1 };
wm.set(obj, "对象值"); // ✅ 正确

wm.set("name", "张三"); // ❌ TypeError: Invalid value used as weak map key
wm.set(1, "one"); // ❌ TypeError
```

### WeakMap 的可用方法

| 方法              | 说明               |
| ----------------- | ------------------ |
| `set(key, value)` | 设置键值对         |
| `get(key)`        | 获取值             |
| `has(key)`        | 判断是否存在某个键 |
| `delete(key)`     | 删除某个键值对     |

> ⚠️ 注意：WeakMap **没有** `size`、`clear()`、`forEach()`、`keys()`、`values()`、`entries()` 等方法，**不可遍历**。

---

## 三、核心区别对比

| 特性                  | Map                  | WeakMap                          |
| --------------------- | -------------------- | -------------------------------- |
| **键的类型**          | 任意类型             | 只能是对象（或未注册的 Symbol）  |
| **是否可遍历**        | ✅ 可遍历            | ❌ 不可遍历                      |
| **有无 size 属性**    | ✅ 有                | ❌ 没有                          |
| **有无 clear() 方法** | ✅ 有                | ❌ 没有                          |
| **垃圾回收**          | 强引用，不会自动回收 | 弱引用，key 无其他引用时自动回收 |
| **使用场景**          | 通用键值对存储       | 关联元数据、缓存、私有数据       |

---

## 四、最关键的区别：垃圾回收机制（弱引用 vs 强引用）

这是 `Map` 和 `WeakMap` 最本质的区别。

### Map — 强引用

`Map` 会对 key 保持**强引用**。即使对象在外部已经不再使用了，只要 `Map` 中还持有它，垃圾回收器（GC）就**不会回收**它。

```js
let obj = { name: "张三" };
const map = new Map();
map.set(obj, "一些数据");

obj = null; // 外部引用清除了

// 但 map 内部仍然持有对 { name: '张三' } 的引用
// 这个对象不会被垃圾回收 ❌
// map.keys() 仍然能拿到这个对象
console.log([...map.keys()]); // [{ name: '张三' }]
```

**问题**：如果忘记手动 `map.delete(obj)`，就会导致**内存泄漏**。

### WeakMap — 弱引用

`WeakMap` 对 key 是**弱引用**。如果一个对象只被 `WeakMap` 引用，没有其他地方引用它，垃圾回收器就**可以回收**它。

```js
let obj = { name: "张三" };
const wm = new WeakMap();
wm.set(obj, "一些数据");

obj = null; // 外部引用清除了

// WeakMap 对这个对象只是弱引用
// GC 可以回收 { name: '张三' } 这个对象 ✅
// 对应的键值对也会自动消失
```

**优势**：不需要手动清理，**自动防止内存泄漏**。

### 为什么 WeakMap 不可遍历？

正是因为弱引用的特性，WeakMap 中的键**随时可能被垃圾回收**。如果允许遍历，那么遍历的结果是**不确定的**（取决于 GC 何时执行），这在语义上是不合理的，所以 JS 规范禁止了遍历。

---

## 五、实际应用场景

### 场景1：DOM 元素关联数据

```js
// ❌ 使用 Map —— DOM 被移除后，Map 中的引用仍然存在，导致内存泄漏
const map = new Map();
const btn = document.getElementById("myBtn");
map.set(btn, { clicks: 0 });
// 即使 btn 从 DOM 中移除了，map 仍然持有引用

// ✅ 使用 WeakMap —— DOM 被移除后，自动被垃圾回收
const wm = new WeakMap();
const btn2 = document.getElementById("myBtn");
wm.set(btn2, { clicks: 0 });
// btn2 从 DOM 中移除且无其他引用后，自动被 GC 回收
```

### 场景2：对象私有数据

```js
const privateData = new WeakMap();

class Person {
  constructor(name, age) {
    // 将私有数据存到 WeakMap 中，外部无法直接访问
    privateData.set(this, { name, age });
  }

  getName() {
    return privateData.get(this).name;
  }

  getAge() {
    return privateData.get(this).age;
  }
}

const p = new Person("张三", 25);
console.log(p.getName()); // '张三'
console.log(p.name); // undefined（外部无法直接拿到）
// 当 p 被销毁时，privateData 中的数据也会自动清除
```

### 场景3：缓存计算结果

```js
const cache = new WeakMap();

function heavyCompute(obj) {
  if (cache.has(obj)) {
    console.log("命中缓存");
    return cache.get(obj);
  }

  const result = /* 复杂计算 */ obj.value * 100;
  cache.set(obj, result);
  return result;
}

let data = { value: 42 };
heavyCompute(data); // 计算
heavyCompute(data); // 命中缓存

data = null; // data 不再使用后，缓存自动清除，不会内存泄漏
```

### 场景4：Vue3 响应式系统中的应用

Vue3 的响应式系统 `reactive()` 内部就使用了 `WeakMap` 来存储对象和其代理之间的映射关系：

```js
// Vue3 源码简化示意
const reactiveMap = new WeakMap();

function reactive(target) {
  // 如果已经有代理，直接返回
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }

  const proxy = new Proxy(target, handlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
// 当原始对象不再使用时，对应的 Proxy 也会被自动回收
```

---

## 六、面试简答版

> **Map 和 WeakMap 有什么区别？**
>
> 1. **键的类型**：Map 的键可以是任意类型，WeakMap 的键只能是对象。
> 2. **垃圾回收**：Map 对键是强引用，不会被 GC 回收；WeakMap 对键是弱引用，当键对象没有其他引用时会被自动回收，从而**防止内存泄漏**。
> 3. **可遍历性**：Map 可遍历（有 `size`、`forEach`、`keys()` 等），WeakMap 不可遍历（因为键随时可能被回收，遍历结果不确定）。
> 4. **使用场景**：WeakMap 常用于 DOM 元素关联数据、对象私有数据存储、缓存等需要自动清理的场景。Vue3 的响应式系统内部就使用了 WeakMap。
