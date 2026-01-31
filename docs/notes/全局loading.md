#

核心思路通常是：Axios 拦截器（监听请求） + 状态管理（Pinia/Vuex） + 全局组件。

## 第一步：创建 Loading 状态管理 (Store)

这里使用 计数器 (Counter) 逻辑，而不是简单的 True/False，这非常关键。

```js
stores / loading.js;
import { defineStore } from "pinia";
import { ref } from "vue";

export const useLoadingStore = defineStore("loading", () => {
  const isLoading = ref(false);
  const requestCount = ref(0);
  // 显示 Loading
  const showLoading = () => {
    requestCount.value++;
    isLoading.value = true;
  };
  // 隐藏 Loading
  const hideLoading = () => {
    if (requestCount.value > 0) {
      requestCount.value--;
    }
    // 只有当所有请求都结束时，才真正关闭 Loading
    if (requestCount.value === 0) {
      isLoading.value = false;
    }
  };
  return { isLoading, showLoading, hideLoading };
});
```

## 第二步：配置 Axios 拦截器 (自动化触发)

不要在每个页面里手动写 showLoading()。我们要在网络请求的入口（Axios 封装文件）统一处理。

```js
// utils/request.js (或者 api/axios.js)
import axios from "axios";
import { useLoadingStore } from "@/stores/loading";

const service = axios.create({
  baseURL: "/api",
  timeout: 5000,
});
// ❌ 注意：不能在这里直接 const store = useLoadingStore()
// 因为此时 Pinia 可能还没挂载，必须在拦截器内部调用
// 1. 请求拦截器：发请求前打开 Loading
service.interceptors.request.use(
  (config) => {
    const loadingStore = useLoadingStore();
    loadingStore.showLoading();
    return config;
  },
  (error) => {
    const loadingStore = useLoadingStore();
    loadingStore.hideLoading(); // 出错也要关掉
    return Promise.reject(error);
  },
);
// 2. 响应拦截器：收到结果后关闭 Loading
service.interceptors.response.use(
  (response) => {
    const loadingStore = useLoadingStore();
    loadingStore.hideLoading();
    return response.data;
  },
  (error) => {
    const loadingStore = useLoadingStore();
    loadingStore.hideLoading(); // 出错也要关掉
    return Promise.reject(error);
  },
);
export default service;
```

## 第三步：创建全局 Loading 组件 (UI)

写一个覆盖全屏的 CSS 组件，受 `store.isLoading` 控制。

```vue
<!-- components/GlobalLoading.vue -->
<script setup>
import { useLoadingStore } from "@/stores/loading";
import { storeToRefs } from "pinia";

const store = useLoadingStore();
const { isLoading } = storeToRefs(store);
</script>

<template>
  <!-- 使用 v-if 控制显示 -->
  <div v-if="isLoading" class="loading-mask">
    <div class="spinner">
      <!-- 这里可以放任何你喜欢的 loading 动画或图标 -->
      <div class="circle"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<style scoped>
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* 半透明遮罩 */
  z-index: 9999; /* 保证在最顶层 */
  display: flex;
  justify-content: center;
  align-items: center;
}
.spinner {
  text-align: center;
  color: white;
}
/* 简单的转圈动画 */
.circle {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
```

## 第四步：挂载到 App.vue

最后，把这个组件放到项目的入口文件中。

```vue
<!-- App.vue -->
<script setup>
import GlobalLoading from "@/components/GlobalLoading.vue";
</script>

<template>
  <GlobalLoading />
  <router-view />
</template>
```
