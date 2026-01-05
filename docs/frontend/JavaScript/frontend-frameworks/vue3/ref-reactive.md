# ref & reactive

vue3 中构建响应式数据的两种核心工具

| 维度                     | ref                                         | reactive                                |
| :----------------------- | :------------------------------------------ | :-------------------------------------- |
| 适用的数据类型           | 所有类型（基本类型 + 复杂类型）             | 仅限复杂类型（Object/Array/Collection） |
| 访问方式                 | 脚本中需使用 .value，模板中自动解包         | 直接访问属性，无需 .value               |
| 底层实现                 | Object.defineProperty (针对 .value 访问)    | ES6 Proxy                               |
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

1. 深度遍历：在组件初始化时，Vue 会递归遍历 data 中的所有属性，利用 `Object.defineProperty` 为每个属性添加 `getter` 和 `setter`。
2. 依赖收集：当触发 `getter` 时，将当前的 Watcher（订阅者）收集到 Dep（依赖管理器）中。
3. 派发更新：当属性被修改触发 `setter` 时，Dep 会通知所有关联的 Watcher 重新渲染。

- 存在的缺陷（面试重点）
  - 无法检测属性的新增与删除：由于劫持是在初始化阶段完成的，后期动态添加的属性（如 this.obj.newKey = 1）无法被 `Object.defineProperty` 拦截。
  - 数组索引与长度的局限：出于性能考虑，Vue 2 没有对数组索引进行拦截，导致直接修改 `arr[index]` 或 `arr.length` 无法触发视图更新。
  - 性能开销：对于层级很深的复杂对象，初始化时一次性的递归遍历会带来明显的性能损耗。

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
