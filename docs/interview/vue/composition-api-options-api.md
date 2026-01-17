# Composition API vs Options API

- **逻辑组织**
- **代码复用**
- **类型推导**
- **代码体积**

## 1. 逻辑组织

### Options API 的问题 (碎片化)

在 Vue 2 中，一个功能的代码被拆得七零八落。当组件变成几百行时，为了修改一个功能，你需要鼠标滚轮上下疯狂滚动，在不同的选项之间反复横跳。

### Composition API 的优势 (聚合)

将与某一功能相关的所有变量、方法、生命周期钩子写在一起（通常是一个函数内部）。

**结果**：代码更加 **高内聚**，维护起来非常轻松，读代码时不需要上下翻找。

## 2. 逻辑复用

### Options API 的问题

在 Vue 2 中，复用逻辑主要靠 **Mixins**。Mixins 有三个致命缺点：

1. **来源不明**：当使用了多个 Mixin 时，你看到 `this.userInfo`，根本不知道它是在哪个 Mixin 里定义的。

2. **命名冲突**：两个 Mixin 如果都定义了 `handleChange`，会发生覆盖，导致 Bug。

3. **隐式依赖**：Mixin 之间可能会互相依赖对方的属性，导致耦合度极高。

### Composition API 的优势 (Composables / Hooks)

你可以把逻辑抽离成一个普通的 JavaScript 函数（通常命名为 `useXxx`，如 `useSearch`, `useUser`）。

```javascript
// 假设定义了两个 Composable
// useSearch.js
function useSearch() {
  const searchQuery = ref("");
  const searchResults = ref([]);
  // ...逻辑...
  return { searchQuery, searchResults };
}

// useUser.js
function useUser() {
  const userInfo = ref({});
  // ...逻辑...
  return { userInfo };
}

// 组件中使用
// MyComponent.vue
import { useSearch } from "./composables/useSearch";
import { useUser } from "./composables/useUser";

export default {
  setup() {
    // 1. 来源清晰：数据明确来自 useSearch
    const { searchQuery, searchResults } = useSearch();

    // 2. 解决命名冲突：显式解构并重命名
    // 假设 useUser 里也有一个 searchResults，我们可以轻松改名
    const {
      userInfo,
      searchResults: userHistoryList, // 重命名为 userHistoryList
    } = useUser();

    return { searchQuery, searchResults, userInfo, userHistoryList };
  },
};
```

## 3. TypeScript 支持

### Options API 的问题：

Options API 严重依赖 `this` 上下文。在 TypeScript 中，推导 `this` 的指向是一件非常复杂且 容易出错的事情，导致 Vue 2 的 TS 支持体验并不好。

### Composition API 的优势：

它基本上就是普通的 JavaScript 变量和函数。不依赖 `this`，天然对类型推导友好。你定义的 `ref` 是什么类型，IDE 马上就能推断出来，开发体验极爽。

## 4. 代码体积与压缩 (Tree-shaking)

### Options API：

由于是对象的形式 (`{ data: ..., methods: ... }`)，对象中的属性名（如 `methods` 里的函数名）是不能被压缩工具轻易修改的，否则会破坏引用。

### Composition API：

所有的变量和函数都是普通的 JS 变量，打包工具（如 Vite/Webpack）可以安全地将变量名压缩成 `a`, `b`, `c`。同时，没有用到的功能更容易被 **Tree-shaking** (摇树优化) 掉，减少打包体积。
