# Set 和 WeakSet 的区别

## 一、Set 基础

`Set` 是 ES6 引入的**无重复值**的集合，值可以是任意类型。

```js
const set = new Set([1, 2, 2, 3]);
console.log(set); // Set {1, 2, 3}  自动去重
```

### Set 常用方法

| 方法/属性                           | 说明         |
| ----------------------------------- | ------------ |
| `add(value)`                        | 添加值       |
| `has(value)`                        | 判断是否存在 |
| `delete(value)`                     | 删除值       |
| `clear()`                           | 清空         |
| `size`                              | 返回元素数量 |
| `forEach()`                         | 遍历         |
| `keys()` / `values()` / `entries()` | 返回迭代器   |

---

## 二、WeakSet 基础

`WeakSet`：**值只能是对象**，不能是基本类型，且对值是**弱引用**。

### WeakSet 可用方法

| 方法            | 说明         |
| --------------- | ------------ |
| `add(value)`    | 添加值       |
| `has(value)`    | 判断是否存在 |
| `delete(value)` | 删除值       |

> ⚠️ 没有 `size`、`clear()`、`forEach()`，**不可遍历**。

---

## 三、核心区别对比

| 特性           | Set                  | WeakSet                          |
| -------------- | -------------------- | -------------------------------- |
| **值的类型**   | 任意类型             | 只能是对象                       |
| **是否可遍历** | ✅ 可遍历            | ❌ 不可遍历                      |
| **有无 size**  | ✅ 有                | ❌ 没有                          |
| **垃圾回收**   | 强引用，不会自动回收 | 弱引用，对象无其他引用时自动回收 |

> 与 Map/WeakMap 的关系完全一致：**Weak 版本 = 弱引用 + 只能存对象 + 不可遍历**。

---

## 四、垃圾回收区别

### Set — 强引用

```js
let obj = { name: "张三" };
const set = new Set();
set.add(obj);

obj = null; // 外部引用清除
// 但 set 仍然持有引用，对象不会被回收 ❌
```

### WeakSet — 弱引用

```js
let obj = { name: "张三" };
const ws = new WeakSet();
ws.add(obj);

obj = null; // 外部引用清除
// ws 是弱引用，GC 可以回收这个对象 ✅
```

---

## 五、实际应用场景

### 场景1：标记对象是否被处理过

```js
const processed = new WeakSet();

function handle(obj) {
  if (processed.has(obj)) {
    console.log("已处理过，跳过");
    return;
  }
  // 处理逻辑...
  processed.add(obj);
}
// 对象被销毁后，标记自动清除，不会内存泄漏
```

### 场景2：防止循环引用（深拷贝）

```js
function deepClone(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== "object") return obj;

  // 检测循环引用
  if (seen.has(obj)) return obj;
  seen.add(obj);

  const clone = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key], seen);
    }
  }
  return clone;
}
```

### 场景3：DOM 节点标记

```js
const disabledElements = new WeakSet();

function disableButton(btn) {
  disabledElements.add(btn);
  btn.disabled = true;
}

function isDisabled(btn) {
  return disabledElements.has(btn);
}
// DOM 节点从页面移除后，WeakSet 中的引用自动清除
```

---

## 六、面试简答

> **Set 和 WeakSet 有什么区别？**
>
> 1. **值的类型**：Set 可以存任意类型，WeakSet 只能存对象。
> 2. **垃圾回收**：Set 是强引用，WeakSet 是弱引用，对象没有其他引用时会被自动回收，**防止内存泄漏**。
> 3. **可遍历性**：Set 可遍历（有 `size`、`forEach`），WeakSet 不可遍历。
> 4. **使用场景**：WeakSet 常用于标记对象是否被处理过、深拷贝中检测循环引用等。
