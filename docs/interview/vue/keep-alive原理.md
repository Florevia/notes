# keep-alive 原理

1. keep-alive 是抽象组件
2. 缓存的是组件实例，不是简单缓存 HTML
3. 切换时不是销毁，而是失活
4. 再进入时直接复用实例并激活
5. 可通过 include/exclude/max 控制缓存策略

## 一句话原理

- `keep-alive` 自己维护一个缓存表，把组件对应的 `vnode / component instance / DOM` 保留下来；

- 切走时不走正常卸载，而是把节点移动到一个隐藏容器；
- 切回来时再移回真实容器，并复用原来的组件实例。

## 标准回答

`KeepAlive` 是 Vue 3 的内建组件，本质是一个带特殊标记的抽象缓存组件。它在内部维护 `cache(Map)` 和 `keys(Set)`，render 时会先根据 `include/exclude` 和组件 `name` 判断当前组件是否需要缓存，再用组件类型或用户传入的 `key` 作为缓存 `key`。

首次渲染时不会立即缓存原始 vnode，而是先记录 pendingCacheKey，等组件 mounted/updated 后把规范化后的 subTree 放进缓存。命中缓存时，会直接复用旧 vnode 上的 component 和 el，因此不会重新创建实例。

切换离开时，`KeepAlive` 不会让组件正常 `unmount`，而是借助 renderer 暴露的 `deactivate` 能力，把 vnode 从真实容器 move 到一个隐藏的 storageContainer 里，并触发 deactivated；切换回来时，再通过 activate 把 vnode 移回页面，同时执行一次 patch 以更新可能变化的 props，最后触发 activated。所以它缓存的不只是 DOM，而是带有组件实例、DOM 引用和子树状态的 vnode。max 则通过 keys 的顺序实现 LRU，超出数量时淘汰最久未使用的缓存项。

## 面试最常问的几个点，怎么答

1. 为什么 KeepAlive 能保留表单状态？

因为实例没有被真正卸载，只是被 deactivate 并移到隐藏容器。组件内部的响应式状态、组件实例、DOM 引用都还在，恢复时直接复用。

2. 为什么切回来不会重新执行 mounted？

因为不是重新 mount，而是 activate：旧实例被复用，只触发 activated。

3. include / exclude 匹配什么？

匹配组件的 name。
