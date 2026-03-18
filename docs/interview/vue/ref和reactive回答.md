# ref和reactive的区别

## ref

当你调用 ref(10) 时，Vue 实际上实例化了一个 RefImpl 对象，并将 10 存在内部。然后通过 ES6 class 的 get value() 和 set value() 访问器属性来拦截对 .value 的读取和修改。

ref 如果接收的是引用类型，它底层最终还是交给了 reactive 去处理。

## reactive

当你调用 reactive(obj) 时，Vue 在底层直接返回一个被 Proxy 包装过的对象。它拦截了这个对象的 get、set、deleteProperty 等操作。

## defineProperty

Vue 2 的响应式系统由三个核心部件构成，它们分工明确：

- Observer（监听器 / 劫持者）

Vue 会把我们在 data 中定义的所有属性，都交给 Observer 扫一遍。Observer 使用 Object.defineProperty 将这些属性全部转化为 getter 和 setter。

- Dep（依赖收集器 / 调度中心）

每一个被劫持的属性，都会配备一个专属的 Dep（Dependency）实例。它的内部维护了一个数组，专门用来记录“到底是谁在使用我这个属性”。

- Watcher（订阅者 / 观察者）

组件的渲染函数（Render）、computed 计算属性、以及 watch 监听器，在底层都会被封装成一个 Watcher。当数据发生变化时，Watcher 负责接收通知，并执行实际的更新操作（比如重新渲染一段 DOM）。
