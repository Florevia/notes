# ref 和 reactive 的区别

| 特性                    | reactive                                                                                                 | ref                                                                                   |
| :---------------------- | :------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| JS 数据类型             | 仅支持 对象 (Object, Array, Map, Set, WeakMap)                                                           | 支持 任何类型 (基本类型 + 对象)                                                       |
| 底层实现                | Proxy 代理整个对象                                                                                       | RefImpl 类，通过 getter/setter 拦截 .value                                            |
| 访问方式                | 直接访问属性 (e.g., state.count)                                                                         | 必须通过 .value 访问 (e.g., count.value)。(注：在 template 中会自动解包，无需 .value) |
| 引用替换 (Reassignment) | 不可直接替换整个对象。 let state = reactive({a:1});state = {a:2} 这样会切断与 Proxy 的联系，丢失响应性。 | 可以替换 .value。count.value = 2 依然保持响应性，因为 RefImpl 实例本身的引用没变。    |
| 解构 (Destructuring)    | 直接解构会丢失响应性。const { x } = state 此时 x 只是一个普通值。需配合 toRefs 使用。                    | 不适用解构（它本身就是单一值）。但如果 ref 存的是对象，解构该对象的属性同样需要注意。 |

##

### reactive 的实现原理：基于 Proxy

> 本质是将一个普通对象包裹成一个 Proxy 对象。

1. 缓存检查： 检查 target 是否已经被代理过（存放在 WeakMap 中）。如果是，直接返回缓存的 Proxy 实例。

2. 创建代理： 使用 `new Proxy(target, baseHandlers)` 创建代理。

3. 拦截器（Handlers）： 这里的 mutableHandlers（定义在 baseHandlers.ts）是核心。

- Get 阶段：
  - 使用 `Reflect.get(target, key, receiver)` 获取值。

    > 这里使用 Reflect 非常关键，它是为了修正 this 的指向。如果对象内部有 getter 相互调用，没有 Reflect 会导致依赖收集不完整。

  - 调用 `track(target, key)` 进行依赖收集。
  - 惰性代理（Lazy Access）： 这是一个巨大的性能优化点。Vue 3 不会像 Vue 2 那样初始化时递归遍历对象。只有当 `Reflect.get` 返回的值是对象时，Vue 才会临时把它转为 reactive。

- Set 阶段：
  - 调用 `trigger(target, key)` 派发更新。
  - 使用 `Reflect.set` 完成赋值。

- 深度响应式： 在 Vue 2 中，初始化时需要递归遍历整个对象。而在 Vue 3 的 reactive 中，这个过程是 **惰性（Lazy）** 的。只有当你在 `getter` 中访问某个属性，且该属性是对象时，Vue 才会临时将其 wrap 成 reactive。这对性能是巨大的提升。

### ref 的实现原理：基于 Class 的访问器属性

ref 的本质是一个 RefImpl 类的实例。它的工作流程非常清晰：

- 存储： 内部持有两个值，一个是原始值 `_rawValue`，一个是处理后的响应式值 `_value`。

- 读取 (get)： 触发依赖收集 `trackRefValue`。

- 写入 (set)： 检查变化 -> 更新值 -> 触发依赖更新 `triggerRefValue`。

#### 源码级代码解析 (RefImpl)

关键点深挖：

1. 构造函数 (constructor)

当你执行 `const count = ref(0)` 时，构造函数将 0 存入 `_value`。

当你执行 `const state = ref({ a: 1 })` 时，`toReactive` 会介入，将对象转化为 Proxy。所以 `_value` 实际上是一个 Proxy，而 `_rawValue` 仍然是原对象。

2. toReactive 辅助函数 这是 ref 支持对象的秘密所在。源码非常简单：

```typescript
function toReactive(value: any) {
  return isReactive(value) ? value : reactive(value);
}
```

`v_isRef` 标记 Vue 在运行时通过检查 `obj.v_isRef === true` 来判断一个对象是否是 ref。这也是 `isRef()` API 的实现原理。

#### 依赖收集与触发原理 (Track & Trigger)

Ref 的响应式不仅仅靠 RefImpl 类，还需要配合 Vue 的副作用系统（Effect System）。

1. 依赖收集：trackRefValue

   当你在组件模板或 `computed` 中读取 `count.value` 时，会触发 `getter`，进而调用 `trackRefValue`。

结果： ref 实例内部的 `dep` 集合里，记录了“谁在使用我”。

2. 派发更新：triggerRefValue

   当你执行 `count.value = 1` 时，`setter` 被触发，调用 `triggerRefValue`。

结果： 通知所有依赖者重新运行（例如组件重新渲染、computed 重新计算）。

#### 两个容易忽视的细节

1. hasChanged 的比较逻辑
   Vue 在 set 中使用了 `hasChanged` 来判断值是否真的变了，避免无意义的更新。

这就解释了为什么 `NaN === NaN` 在 Vue 中不会触发更新（因为 `Object.is(NaN, NaN)` 为 true），而普通 JS 中 `NaN !== NaN`。

2. shallowRef 的实现
   源码中通过 `__v_isShallow` 标志位控制：

在 `constructor` 中，如果是 `shallow`，就不调用 `toReactive`。

在 `setter` 中，如果是 `shallow`，也不调用 `toReactive`。 这使得 `shallowRef` 的 `.value` 可以存放普通对象，且只有 `.value` 被整体替换时才触发响应。
