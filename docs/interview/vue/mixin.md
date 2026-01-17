# mixin

维护旧项目 Vue 2 老代码

## 原理

1. 定义

```js
export const likeMixin = {
  // 1. 每个人拿到 Mixin，都会生成一份独立的 data
  data() {
    return {
      likeCount: 0, // 点赞数
      isLiked: false, // 是否已点赞
    };
  },
  // 2. 复用的方法
  methods: {
    toggleLike() {
      this.isLiked = !this.isLiked;
      if (this.isLiked) {
        this.likeCount++;
        console.log("点赞成功！");
      } else {
        this.likeCount--;
        console.log("取消点赞");
      }
    },
  },
};
```

2. 使用

```js
<template>
  <div class="article">
    <h1>这是一个文章</h1>
    <!-- 直接使用 mixin 里的数据和方法 -->
    <button @click="toggleLike">
      {{ isLiked ? '已赞' : '点赞' }} ({{ likeCount }})
    </button>
  </div>
</template>

<script>
import { likeMixin } from '@/mixins/likeMixin.js'; // 导入

export default {
  mixins: [likeMixin] // 混入！就好像把代码复制粘贴到了这里
};
</script>
```

> Mixin 里的 data 是工厂模式生成的，每个组件引用它时，都会得到一份全新的、独立的数据副本。互不干扰。

## 优点

1. **提高代码复用性**：减少重复代码，特别是对于跨组件的逻辑。

2. **逻辑分离**：可以将复杂的逻辑块拆分到不同的文件中管理。

## 弊端

> 推出了 Composition API (组合式 API)的主要原因之一。

1. **来源不清晰** 一个组件使用了多个 Mixin 时，变量来源不清晰，这被称为“黑盒”，代码可读性极差。

```js
// MyComponent.vue
export default {
  mixins: [UserMixin, LogMixin], // 引入了两个黑盒
  mounted() {
    // 根本不知道 this.userName 是哪里来的，也不怕两个 Mixin 都有 userName 互相打架
    console.log(this.userName);
    this.logError();
  },
};
```

2. **命名冲突** Mixin 中的属性或方法可能与组件内部或其他 Mixin 中的属性发生冲突，且不仅不会报错，还会默默覆盖。

## 前端面试题 (Interview Questions)

1. Q: Vue 的 Mixin 和 Vuex 有什么区别？

   - Vuex 是状态管理模式，用于管理应用级的共享状态，数据在组件间是共享且响应式的。

   - Mixin 是逻辑复用，Mixin 中的数据在每个组件中是独立的（工厂模式），互不影响。

2. Q: Mixin 中的生命周期钩子和组件自身的钩子执行顺序是怎样的？

   - Mixin 的钩子先执行，组件自身的钩子后执行。

3. Q: 为什么 Vue 3 推荐使用 Composition API 替代 Mixins？

   - 主要是为了解决 Mixin 的命名冲突、数据来源不清晰以及复用逻辑过于分散难以维护的问题。Composition API 允许将逻辑显式地导入并组合，来源清晰且无命名冲突风险。

4. Q: 多个 Mixin 中有同名数据会怎样？

   - 取决于 **引入顺序**，但在组件自身也有同名数据时，组件数据优先级最高。如果只是多个 Mixin 冲突，通常后面的覆盖前面的（取决于具体合并策略实现）。
