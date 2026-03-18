# vue中hook

Hook 官方文档种叫做 **组合式函数** / Composables 是基于 Composition API 的核心概念。主要目的是 **实现状态逻辑的复用**。

## 与js函数的区别

Hook 就是一个普通的 js 函数，但它利用了 Vue 的响应式 API（如 ref, reactive, watch, onMounted 等）来封装和复用有状态的逻辑。

## Hook 的基本特征

- 命名规范：通常以 use 开头（比如 useUser, useFetch, useMouse）。
- 执行环境：必须在 Vue 组件的 `setup()` 阶段同步调用，或者在其他 Hook 中调用。
- 返回值：通常返回包含响应式数据（Refs）的对象，以便在组件中解构使用。

## 常见hook

### 自己封装

```js
// useToggle.js
import { ref } from "vue";

export function useToggle(initialValue = false) {
  // 1. 定义响应式状态
  const state = ref(initialValue);

  // 2. 定义修改状态的方法
  const toggle = () => {
    state.value = !state.value;
  };

  const setTrue = () => {
    state.value = true;
  };

  const setFalse = () => {
    state.value = false;
  };

  // 3. 将状态和方法以对象形式返回
  return {
    state,
    toggle,
    setTrue,
    setFalse,
  };
}
```

```vue
<template>
  <div style="padding: 20px;">
    <!-- 使用导出的 state -->
    <h3 v-if="state">👋 弹窗内容显示啦！</h3>

    <!-- 使用导出的方法 -->
    <button @click="toggle">切换 (Toggle)</button>
    <button @click="setTrue">打开</button>
    <button @click="setFalse">关闭</button>
  </div>
</template>

<script setup>
// 1. 引入刚才封装的 Hook
import { useToggle } from "./useToggle.js";

// 2. 执行 Hook，解构出需要的数据和方法
// 传入默认值 false
const { state, toggle, setTrue, setFalse } = useToggle(false);
</script>
```

### useVModel

- 作用：极大地简化了 Vue 3 中父子组件的 v-model 双向绑定逻辑，不需要手动写 emit('update:modelValue', val)。

### useIntersectionObserver

- 作用：监听元素是否进入可视区域。
- 场景：实现图片的懒加载，或者列表的无限滚动加载。

### useStorage

- 作用：监听元素是否进入可视区域。
- 场景：实现图片的懒加载，或者列表的无限滚动加载。

### useDebounceFn / useThrottleFn

- 作用：防抖和节流。
- 场景：输入框搜索联想（防抖）、窗口滚动事件监听（节流）。

### useDebounceFn / useThrottleFn

- 作用：防抖和节流。
- 场景：输入框搜索联想（防抖）、窗口滚动事件监听（节流）。
