# keep-alive 滚动位置丢失

## 场景

`<KeepAlive>` 只缓存组件实例状态，并不保证你的页面或某个滚动容器的滚动位置一定自动恢复。

官方文档说明，被 `<KeepAlive>` 缓存的组件在切走时会进入 `deactivated`，回来时进入 `activated`；而路由层面的滚动恢复则需要依赖 Vue Router 的 `scrollBehavior`。

`savedPosition` 也只在浏览器“前进/后退”这类 popstate 导航时才会有。

### 1. 页面级滚动：用 Vue Router 的 scrollBehavior

```js
// router.ts
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ...
  ],
  // 记录滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
});

export default router;
```

- 这个适合：
  - 浏览器前进 / 后退时恢复页面滚动
  - 普通路由切换时决定回顶部还是保留位置

  > 但它不一定能解决 `keep-alive` 里的局部滚动容器，比如列表区是一个 `div` 在滚动，而不是 `window`。官方也说明 `scrollBehavior` 是路由级滚动控制。

### 组件级滚动：在 onDeactivated 保存，在 onActivated 恢复

```vue
<script setup>
import { ref, onActivated, onDeactivated, nextTick } from "vue";

const scrollEl = null;
let lastScrollTop = 0;

onDeactivated(() => {
  if (scrollEl.value) {
    lastScrollTop = scrollEl.value.scrollTop;
  }
});

onActivated(async () => {
  await nextTick();
  if (scrollEl.value) {
    scrollEl.value.scrollTop = lastScrollTop;
  }
});
</script>

<template>
  <div ref="scrollEl" style="height: 100vh; overflow: auto;">
    <!-- 长列表 -->
  </div>
</template>
```

- 因为 `<KeepAlive>` 缓存组件后，不是重新挂载，而是走 `deactivated` / `activated` 生命周期，所以这两个钩子正适合做滚动位置保存与恢复。
