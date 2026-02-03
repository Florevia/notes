# 插槽 slot

实现组件内容分发的核心机制

## 出现原因

1. 提高组件的复用性 (Reusability)
2. 逻辑与样式的解耦

## 类型

| 插槽类型   | 关键字                        | 数据来源 | 决定展示权 | 解决的问题                                      |
| ---------- | ----------------------------- | -------- | ---------- | ----------------------------------------------- |
| 默认插槽   | `<slot></slot>`               | 无       | 父组件     | 简单的 HTML 嵌套                                |
| 具名插槽   | `<slot name="header"></slot>` | 无       | 父组件     | 复杂布局的多位置内容分发                        |
| 作用域插槽 | `<slot :row="item"></slot>`   | 子组件   | 父组件     | 数据和表现的分离。子组件提供数据，父组件定制 UI |

---

### 匿名插槽（默认插槽）

```js
// 子组件child
<template>
  <div>
    <slot></slot>
  </div>
</template>

// 父组件
<template>
  <child>
    <p1>这是插槽的内容</p1>
  </child>
</template>
```

### 具名插槽

- 组件内部有多个 `<slot>` 元素，每个元素都有一个唯一的名称。
- 父级通过 `<slot>` 元素的 `name` 属性指定要渲染的内容到哪个插槽。

```js
//子组件child
<template>
  <div>
    <slot name="header"></slot>
  </div>
  <div>
    <slot name="footer"></slot>
  </div>
  <slot></slot> // 默认插槽
</template>

// 父组件
<template>
  <child>
    <p1 slot="header">这是插槽header的内容</p1>
    <p2 slot="footer">这是插槽footer的内容</p2>
    <p3>这是默认插槽的内容</p3>
  </child>
</template>
```

### 作用域插槽 Scoped Slot

- 数据在子组件，但展示逻辑在父组件
- `#header` 等价于 `v-slot:header`

#### 分析

1. 首先要明确 Vue 的一个核心原则——编译作用域（Compilation Scope）：父级模板里的所有内容都是在父级作用域中编译的；子级模板里的所有内容都是在子级作用域中编译的。
2. 作用域插槽允许子组件在暴露插槽的同时，将自身内部的数据“回传”给父组件。这打破了编译作用域的限制，使得父组件可以根据子组件提供的数据来定制化渲染内容。

```js
// 子组件child
<template>
  <div>
    <slot name="header" :message="message"></slot>
  </div>
</template>

// 父组件 - 写法1：使用props对象接收
<template>
  <child>
    <template #header="props">
      <p1>{{ props.message }}</p1>
    </template>
  </child>
</template>

// 父组件 - 写法2：直接解构接收
<template>
  <child>
    <template #header="{ message }">
      <p1>{{ message }}</p1>
    </template>
  </child>
</template>

// 父组件 - 写法3：解构并重命名
<template>
  <child>
    <template #header="{ message: msg }">
      <p1>{{ msg }}</p1>
    </template>
  </child>
</template>

```
