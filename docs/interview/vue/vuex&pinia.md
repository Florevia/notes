# vuex

## 概念

把共用的状态抽取出来，放在一个 **全局的单例模式（Store）** 中。不管组件在哪里，都可以直接获取或修改这些状态。

## 五大核心概念

### state 状态

单一状态树（Single Source of Truth）。存储数据的地方。

### getters 计算属性

从 State 中派生出一些状态。

### mutations 修改状态

更改状态的唯一方法。

### actions 异步修改状态

类似于 mutation，但它提交的是 mutation，而不是直接变更状态。可以包含任意异步操作（如 API 请求）。

### modules 模块

当应用变得非常大时，store 对象会变得臃肿。Vuex 允许将 store 分割成模块（module）。
`namespace: true`

## 基本使用

vue3 + vuex4

```js
//store.js
import { createStore } from "vuex";
const store = createStore({
  // 1. 状态
  state: {
    count: 0,
  },
  // 2. 修改数据的唯一方式 (同步)
  mutations: {
    INCREMENT(state) {
      state.count++;
    },
  },
  // 3. 异步操作
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit("INCREMENT");
      }, 1000);
    },
  },
  // 4. 计算属性
  getters: {
    doubleCount: (state) => state.count * 2,
  },
});
```

```vue
//组件中访问 App.vue
<script setup>
import { useStore } from "./stores";
import { computed } from "vue";

const store = useStore();
const count = computed(() => store.state.count); // 使用计算属性保持响应式

// 修改状态
const add = () => {
  store.commit("INCREMENT"); // 同步
};
const addAsync = () => {
  store.dispatch("incrementAsync"); // 异步
};
</script>
```

## vuex刷新页面后状态丢失

- **原因**：Vuex（以及 Pinia）的状态是存储在 **内存（RAM）中的 JavaScript 对象**。
  当用户刷新页面时，浏览器会重新加载 JS运行环境，之前的内存被清空，所以 Vuex 的状态会重置为初始值
- **解决方案**：核心思路是 **持久化（Persistence）**。
  你需要把状态保存到浏览器的本地存储（LocalStorage / SessionStorage）中，在页面刷新回来时，再从本地存储恢复到 Vuex 中。

  有三种实现方案：

### 手动存储（最基础）

实现思路：

1.  利用 `window.addEventListener("beforeunload")` 事件，在页面即将刷新销毁前，把 Vuex 数据存入 `localStorage`。
2.  在 App 启动（App.vue 的 `created` 或 `setup`）时，读取 `localStorage` 里的数据覆盖 Vuex。

### 使用插件 vuex-persistedstate（vuex）

最成熟、使用最广泛的解决方案。自动完成 **状态改变时存入 Storage** 和 **初始化时从 Storage 恢复** 的工作。

pinia 使用 pinia-plugin-persistedstate

1. 安装

```bash
npm install vuex-persistedstate
```

2. 使用

```js
import createPersistedState from "vuex-persistedstate";

const store = createStore({
  plugins: [
    createPersistedState({
      storage: localStorage, // 存储位置
      paths: ["count"], // 只存模块
      key: "my-vuex", // 存储键名
    }),
  ],
});
```

### watch 监听 (针对特定数据)

如果你只需要持久化某一个特定的值（比如 token 或 theme），而不是整个 store。

```js
// store/index.js
export default createStore({
  state: {
    token: localStorage.getItem("token") || "", // 初始化时直接读
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token;
      // 每次修改时直接存
      localStorage.setItem("token", token);
    },
  },
});
// 或者在组件里用 watch 监听：
watch(
  () => store.state.token,
  (newVal) => {
    localStorage.setItem("token", newVal);
  },
);
```

## vuex 转向 pinia 的原因

1. **去掉了 Mutations**：
   - 在 Vuex 中，你必须 `dispatch` 一个 Action，然后 Action 再 `commit` 一个 Mutation 才能修改 State。

   - 在 Pinia 中，只有 **State、Getters、Actions**。在 Actions 里直接改 State 就行，就像写普通的 JS 函数一样。

2. **极致的 TypeScript 支持**：
   - Pinia 是原生用 TS 写的。在 Vuex 中为了让 TS 识别类型，需要写极其复杂的类型声明。在 Pinia 中，几乎不需要任何额外配置，自动推断类型。

3. **不再有复杂的嵌套模块 (Modules)**：
   - Vuex 只有一棵巨大的状态树（树状结构）。
   - Pinia 提倡扁平化设计。你需要几个 Store 就定义几个（比如 UserStore, CartStore），它们之间是相互独立的，但又可以互相引用。（扁平化设计）

4. **极轻量**：
   - 体积只有 1kb 左右。

5. **支持两种写法**：
   - Options API 写法（类似 Vuex，适合老手迁移）。
   - Composition API 写法（Setup Store，类似 Vue 3 的 setup，更加灵活）。

# pinia

## Options API 写法

```js
// stores/counter.js
import { defineStore } from "pinia";

export const useCounterStore = defineStore("counter", {
  // 类似 Vuex 的 state
  state: () => ({
    count: 0,
  }),

  // 类似 Vuex 的 getters
  getters: {
    doubleCount: (state) => state.count * 2,
  },

  // 类似 Vuex 的 actions（但没有 mutations！）
  actions: {
    increment() {
      this.count++; // 直接修改 state
    },
    async fetchData() {
      const res = await api.getData();
      console.log(res);
    },
  },
});
```

## Composition API 写法

```js
// stores/counter.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useCounterStore = defineStore("counter", () => {
  // ref() 相当于 state
  const count = ref(0);

  // computed() 相当于 getters
  const doubleCount = computed(() => count.value * 2);

  // function() 相当于 actions
  function increment() {
    count.value++;
  }

  async function fetchData() {
    const res = await api.getData();
    console.log(res);
  }

  // 必须 return 暴露出去的内容
  return { count, name, doubleCount, increment, fetchData };
});
```

```vue
<script setup>
import { useCounterStore } from "./stores/counter";
import { storeToRefs } from "pinia"; // 解决结构丢失响应式

const { count } = storeToRefs(useCounterStore()); // 只会将state和getters转换为ref，函数可以直接解构
</script>
```
