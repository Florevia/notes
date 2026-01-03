# scoped 原理

scoped 的核心思想是通过为 DOM 元素和 CSS 选择器添加一个 **共同的、唯一的属性标识**，利用 CSS 属性选择器来限制样式的作用范围。

## 工作流程可以分为两个编译阶段：

### A. 模板编译阶段（Template Compilation）

1. 当 Vue Loader（或 Vite 的 Vue 插件）解析 .vue 文件时，如果检测到 `<style scoped>`，它会生成一个全局唯一的识别码。

2. 编译器会遍历该组件模板中所有的 HTML 元素。

3. 给每个元素自动添加这个属性。

```html
<!-- 原始代码： -->
<div class="container">Hello</div>
<!-- 编译后： -->
<div class="container" data-v-7ba5bd90>Hello</div>
```

### B. 样式编译阶段（Style Compilation）

1. Vue 会利用 PostCSS 插件对 `<style>` 块中的 CSS 进行处理。

2. 在每一个 CSS 选择器的末尾（或特定位置）追加对应的属性选择器。

```css
/* 原始样式： */
.container {
  color: red;
}

/* 编译后： */
.container[data-v-7ba5bd90] {
  color: red;
}
```

---

## 作用域边界：父组件 scoped 样式的渗透边界

1. **子组件根节点**： 为了方便父组件对子组件进行布局（如设置 margin），父组件定义的 scoped 样式会同时应用到子组件的根节点上。也就是说，子组件的根节点会同时拥有父组件和它自身的 data-v-hash。

2. **子组件内部**： 父组件的 scoped 样式无法渗透进子组件内部的非根元素。
