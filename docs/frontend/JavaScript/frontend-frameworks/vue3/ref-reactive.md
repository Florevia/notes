# ref & reactive

vue3 中构建响应式数据的两种核心工具

| 维度                     | ref                                         | reactive                                |
| :----------------------- | :------------------------------------------ | :-------------------------------------- |
| 适用的数据类型           | 所有类型（基本类型 + 复杂类型）             | 仅限复杂类型（Object/Array/Collection） |
| 访问方式                 | 脚本中需使用 .value，模板中自动解包         | 直接访问属性，无需 .value               |
| 底层实现                 | Class getter/setter（对象值内部走 Proxy）   | ES6 Proxy                               |
| 重新赋值（替换整个对象） | 支持（通过 xxx.value = {}），保持响应式     | 不支持（直接赋值会丢失响应式连接）      |
| 解构赋值                 | 解构后的变量会丢失响应式（除非使用 toRefs） | 直接解构会丢失响应式                    |

## 响应式流程

- 初始化阶段：建立拦截机制
- 依赖收集阶段
- 派发更新阶段

## ref （reference）

- 主要是定义基本数据类型的响应式
- 基于对象属性拦截（Object.defineProperty） 的包装

### ref 的“装箱”机制

- 传入基本类型
  - 创建一个包含 value 属性的特殊对象，RefImpl 类。

- 传入对象
  - 自动调用`reactive`处理对象，并将其赋值给 `value` 属性

### 核心原理

1. 装箱包装：通过 `RefImpl` 类将值包装在 `.value` 属性中，利用 **class 的 getter/setter** 拦截对 `.value` 的读写。
2. 依赖收集：读取 `.value` 时触发 getter → 调用 `trackRefValue()`，将当前活跃的 `effect` 收集到该 ref 的依赖集合中。
3. 派发更新：修改 `.value` 时触发 setter → 调用 `triggerRefValue()`，通知所有依赖的 `effect` 重新执行。
4. 对象值代理：当传入的值是对象时，内部调用 `reactive()` 用 Proxy 进行深层代理，因此不存在 Vue 2 的属性新增/删除检测问题。

> **对比 Vue 2（面试补充）：** Vue 2 使用 `Object.defineProperty` 逐个劫持属性，存在以下缺陷——无法检测属性新增与删除（需用 `$set`）、数组索引修改无法触发更新、深层对象初始化时递归遍历性能开销大。Vue 3 的 ref + reactive 方案完全解决了这些问题。

### 核心代码逻辑

```js
class RefImpl {
  constructor(value) {
    this._rawValue = value;
    // 如果是对象，则调用 reactive 处理，否则返回原值
    this._value = isObject(value) ? reactive(value) : value;
    this.__v_isRef = true; // 标识是一个 ref
  }

  get value() {
    // 【依赖收集】针对 ref 实例本身进行 track
    trackRefValue(this);
    return this._value;
  }

  set value(newVal) {
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal;
      this._value = isObject(newVal) ? reactive(newVal) : newVal;
      // 【派发更新】
      triggerRefValue(this);
    }
  }
}

const hasChanged = (value, oldValue) => !Object.is(value, oldValue);

function ref(value) {
  return new RefImpl(value);
}
```

### 为什么 ref 需要 .value？

因为基本类型（如 Number）在 JavaScript 中是值传递，无法被 Proxy 代理。Vue 必须把它们包装在一个对象里，才能通过 get/set 拦截数据的变化。

## reactive

- 定义复杂数据类型的响应式
- 返回对象的响应式副本，基于 Proxy 实现

### reactive 的“代理”机制

- 创建 Proxy 实例
- 拦截 get/set 操作

### 核心原理

1. 直接代理对象：Proxy 代理的是整个对象而不是具体的属性。它通过 13 种拦截陷阱（traps）捕获对象的所有操作。

2. Lazy Observation（惰性监听）：Vue 3 不会在初始化时递归深层对象。只有当用户访问深层嵌套属性时，才会动态地为该层属性创建响应式代理。

3. 依赖追踪（Track & Trigger）：使用 WeakMap 存储对象与依赖的关系，结构更加精简高效。

- 核心优势
  - 动态检测：天然支持属性的新增 (add) 和删除 (delete)。

  - 原生支持数组与集合：不仅支持数组索引修改，还支持 Map、Set、WeakMap 等集合类型的响应式。

  - 性能提升：减少了初始化时的递归开销，且 Proxy 作为浏览器原生 API，受引擎优化更多。

### 核心代码逻辑

```js
// 存储依赖关系的全局容器
const targetMap = new WeakMap();

function reactive(target) {
  if (typeof target !== "object" || target === null) return target;

  return new Proxy(target, {
    get(target, key, receiver) {
      //
      const res = Reflect.get(target, key, receiver);
      // 【依赖收集】
      track(target, key);
      // 如果是嵌套对象，递归进行 reactive 包装（惰性处理，提高性能）
      return typeof res === "object" ? reactive(res) : res;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      // 【派发更新】值发生变化时触发
      if (oldValue !== value) {
        trigger(target, key);
      }
      return result;
    },
  });
}
```

### 为什么不能重新赋值

- reactive 返回的是一个 Proxy 实例。
- 给 state 变量重新赋一个普通的 JS 对象，那么 state 就不再指向那个具有拦截功能的 Proxy 实例了，响应式自然就断了。
- 而 ref 只需要 xxx.value = { ... }，它修改的是 RefImpl 实例内部的 \_value 属性，ref 实例本身的引用没变。

### 解构丢失响应式

- reactive：解构出来的属性如果是基本类型，就只是一个普通的值，脱离了 Proxy 的监控
  - 解决方法：用 `toRefs` ，这样每个属性都是一个 ref，保持响应式

  ```js
  const state = reactive({
    count: 0,
    name: "Vue",
  });

  const { count, name } = toRefs(state);
  ```

- ref：解构出来的是一个个独立的 RefImpl 对象，所以依然保持响应式（这也是 toRefs 的原理）

## 依赖收集与派发更新机制（track / trigger）

### 整体数据结构

Vue 3 使用一个三层嵌套的 WeakMap → Map → Set 结构来存储依赖关系：

```
targetMap (WeakMap)
  └── target (原始对象) → depsMap (Map)
        ├── key1 → dep (Set) → [effect1, effect2, ...]
        ├── key2 → dep (Set) → [effect3, ...]
        └── ...
```

- **WeakMap**：key 是原始对象，value 是该对象所有属性的依赖 Map（对象被回收时自动清理）
- **Map**：key 是属性名，value 是依赖该属性的所有 effect 的 Set
- **Set**：存储所有依赖该属性的 effect 函数（自动去重）

### effect 副作用函数

`effect` 是响应式系统的"消费者"——它注册一个函数，当函数内部读取的响应式数据变化时，自动重新执行。

Vue 的组件渲染函数、`watchEffect`、`computed` 底层都是通过 `effect` 实现的。

```js
// 当前正在执行的 effect（全局变量）
let activeEffect = null;

function effect(fn) {
  // 包装原始函数
  const effectFn = () => {
    activeEffect = effectFn; // 设置当前活跃的 effect
    fn(); // 执行函数，触发内部响应式数据的 getter → 依赖收集
    activeEffect = null; // 执行完毕，清除
  };
  effectFn(); // 立即执行一次，完成首次依赖收集
}
```

**执行流程：**

1. `effect(() => { console.log(state.count) })` 被调用
2. `activeEffect` 指向这个 effect 函数
3. 执行 `fn()`，其中访问了 `state.count`
4. 触发 Proxy 的 `get` 拦截 → 调用 `track(target, 'count')`
5. `track` 将 `activeEffect` 收集到 `count` 属性的依赖 Set 中

### track（依赖收集）

当读取响应式数据时，`track` 将当前 `activeEffect` 记录到对应属性的依赖集合中。

```js
const targetMap = new WeakMap();

function track(target, key) {
  if (!activeEffect) return; // 没有活跃的 effect，不需要收集

  // 第一层：获取或创建该对象的 depsMap
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  // 第二层：获取或创建该属性的 dep（Set）
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  // 第三层：将当前 effect 加入依赖集合（Set 自动去重）
  dep.add(activeEffect);
}
```

### trigger（派发更新）

当修改响应式数据时，`trigger` 找到对应属性的所有依赖 effect 并重新执行。

```js
function trigger(target, key) {
  // 找到该对象的 depsMap
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  // 找到该属性的 dep（Set）
  const dep = depsMap.get(key);
  if (!dep) return;

  // 遍历执行所有依赖的 effect
  dep.forEach((effect) => effect());
}
```

### 完整流程串联

```
1. 初始化
   effect(() => render(state.count))
     │
     ├── activeEffect = 当前 effect
     ├── 执行 render → 读取 state.count
     │     └── 触发 Proxy get
     │           └── track(state, 'count')
     │                 └── targetMap[state]['count'].add(activeEffect)
     └── activeEffect = null

2. 数据修改
   state.count = 1
     │
     └── 触发 Proxy set
           └── trigger(state, 'count')
                 └── 遍历 targetMap[state]['count'] 中的所有 effect
                       └── 重新执行 effect → 重新 render → 视图更新
```

### 面试常问点

| 问题                           | 回答                                                                         |
| :----------------------------- | :--------------------------------------------------------------------------- |
| 为什么用 WeakMap？             | key 是对象引用，WeakMap 不阻止垃圾回收，对象销毁时依赖自动清除，避免内存泄漏 |
| 为什么用 Set？                 | 同一个 effect 可能多次读取同一属性，Set 自动去重，避免重复触发               |
| effect 和 Watcher 的关系？     | Vue 3 的 effect 等价于 Vue 2 的 Watcher，但更轻量                            |
| computed 怎么实现？            | 本质是一个带缓存的 effect，有 dirty 标记，依赖变了才重新计算                 |
| watchEffect 和 effect 的关系？ | watchEffect 就是暴露给用户的 effect API，多了 onCleanup 等功能               |
