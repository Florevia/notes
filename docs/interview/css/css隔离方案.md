# css隔离方案

## CSS Modules

React 常用，Vue 也支持

- 原理：不使用属性选择器，而是直接改变类名。

- 做法：构建工具会将 `.title` 编译成一个独一无二的 Hash 类名，如 `._title_1a2b3`。

- Vue 中使用：`<style module>`。

- 对比 Scoped：CSS Modules 的性能稍微好一点点（Class 选择器比 Attribute 选择器快，虽然微乎其微），且更彻底杜绝冲突，但写代码时需要用 JavaScript 对象的方式引用类名 (:class="$style.title")，不如 Scoped 写法自然。

## scoped

## BEM

- 原理：靠人为约定，不靠工具。

- 格式：Block **Element--Modifier** (如 `.card title--active`)。

- 评价：在没有构建工具的年代是王者，现在更多是配合预处理器作为一种良好的编码习惯存在。

## CSS in JS

- 原理：在 JS 里写 CSS，运行时动态生成 class 并注入 `<style>` 标签。

- 特点：完全的组件化，支持动态主题非常方便，但有运行时性能开销，且增加了包体积。

```js
// vue 中的 css-in-js
<script setup>
import { useCssModule } from 'vue';

const props = defineProps({
  primary: Boolean
});

const dynamicStyle = computed(() => ({
  backgroundColor: props.primary ? '#007bff' : '#6c757d',
  padding: '10px 20px',
  color: 'white'
}));
</script>

<template>
  <button :style="dynamicStyle">
    <slot />
  </button>
</template>
```
