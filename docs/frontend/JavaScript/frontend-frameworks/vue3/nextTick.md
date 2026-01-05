# nextTick 详解

- 下一次 DOM 更新循环结束之后执行延迟回调。

## 出现原因

Vue 在更新 DOM 时是**异步**执行的。

1. 侦测变化：数据发生变化。
2. 开启队列：Vue 将开启一个异步队列，缓冲 **同一事件循环中** 发生的所有数据改变。
3. 去重：如果同一个组件（Watcher）被多次触发，它只会被推入队列一次。这避免了不必要的重复计算和 DOM 操作。
4. 异步刷新：在下一个的事件循环“tick”中，Vue 刷新队列并执行 **实际的 DOM** 更新工作。

## 核心作用

`nextTick` 的主要作用就是：**等待 DOM 更新完成**。

- 它接受一个回调函数作为参数，在 DOM 更新循环结束之后执行这个回调函数。

## 使用场景

### 操作更新后的 DOM

这是最常见的场景。例如：你有一个 `v-if` 控制的输入框，当你把变量设为 `true` 显示输入框后，想立刻获取焦点。

```vue
<template>
  <input v-if="showInput" ref="inputRef" />
  <button @click="handleShow">显示并聚焦</button>
</template>

<script setup>
import { ref, nextTick } from "vue";

const showInput = ref(false);
const inputRef = ref(null);

const handleShow = async () => {
  showInput.value = true;

  // ❌ 错误做法：此时 DOM 还没更新，inputRef.value 还是 null
  // inputRef.value.focus();

  // ✅ 正确做法：使用 await (推荐)
  await nextTick();
  inputRef.value.focus();
};
</script>
```

### B. 数据变化后获取最新的 DOM 尺寸

例如，你改变了一个列表的数据，列表长度变长了，你想获取列表容器最新的滚动高度。

```js
// 修改数据
list.value.push("新数据");

// ❌ 此时获取的是旧高度
console.log(container.scrollHeight);

nextTick(() => {
  // ✅ 此时 DOM已更新，获取的是新高度
  console.log(container.scrollHeight);
});
```

### C. 初始化第三方插件

很多依赖 DOM 结构的插件（如 Swiper、ECharts）需要在 DOM 渲染完毕后才能正确初始化。如果数据是异步获取的，必须在数据赋值且 DOM 更新后，再调用插件的 init 方法。

## 语法使用

### Composition API (Vue 3)

```ts
import { nextTick } from "vue";

// 方式一：传入回调
nextTick(() => {
  // 访问更新后的 DOM
});

// 方式二：作为 Promise 使用 (常用)
await nextTick();
// 访问更新后的 DOM
```

### Options API (Vue 2 / Vue 3)

```js
this.message = "new message";
this.$nextTick(() => {
  // DOM 现在更新了
});
```

## 原理简述

`nextTick` 中的代码通常会在 **微任务 (Microtask)** 阶段执行（在当前宏任务执行完，下一次渲染之前），这样可以确保在浏览器进行 UI 重绘之前更新数据，避免不必要的重绘，效率更高。
