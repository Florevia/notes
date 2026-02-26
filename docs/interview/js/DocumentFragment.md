# DocumentFragment

## 概念

- DocumentFragment 是一个 DOM 节点，它是一个 **文档片段**，可以包含多个子节点。
- 它的作用是 **临时存储 DOM 节点**，避免直接操作 DOM 导致的性能问题。

## 作用

- 如果你需要向页面中动态添加 1000 个 `<li>` 元素，如果直接在一个循环中通过 `document.body.appendChild()` 追加，会触发 1000 次 DOM 树的更新和严重的回流，这会导致页面卡顿。

- 你可以把所有的 `<li>` 先塞进这个 `Fragment`，最后一次性把它追加到真实的 DOM 树中。

```js
// 1. 创建一个空的 Fragment (隐形包裹箱)
const fragment = document.createDocumentFragment();

// 2. 在内存中操作这个 Fragment，不会触发任何页面的回流/重绘
for (let i = 0; i < 1000; i++) {
  const li = document.createElement('li');
  li.textContent = `List item ${i}`;
  fragment.appendChild(li); 
}

// 3. 一次性将 Fragment 挂载到真实的 DOM 节点上
// ⚠️ 关键特性：挂载时，插入的是 Fragment 的所有子孙节点，而 Fragment 本身会“消亡”，不会出现在 DOM 树中
const ul = document.getElementById('my-list');
ul.appendChild(fragment);
```

## 现代框架上的应用

- Vue3：在模板中，使用 `<template>` 标签包裹多个子元素，也会创建一个 `Fragment` 来存储这些子元素。

- 具体实现：
  - 虽然你在模板里写了多个根节点，但在 Vue 的编译器（Compiler）眼里，它会将这些节点编译成一个特殊的 `VNode`，其 `type` 是 `Fragment`。
  - 在 Patch（Diff 算法更新）阶段，Vue 识别到这是一个 `Fragment VNode` 时，不会去创建一个真实的 DOM 父节点，而是 **直接遍历并挂载其内部的 children**。
