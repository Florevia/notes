# v-model

- 本质：**属性绑定** 与 **事件监听**
- 核心逻辑：单向数据流

---

- Vue3
  - modelValue
  - update:modelValue
  - （原生支持多个 v-model）
- Vue2
  - value
  - input
  - （需要用到 .sync）

## 实现原理

v-model 等价于

在 vue2 中

- `:value="msg"`
- `@input="msg = $event"`

在 vue3 中

- `:modelValue="msg"`
- `@update:modelValue="msg = $event"`

---

### vue3

```vue
// 父组件
<script setup>
const msg = ref("");
</script>

<template>
  <div>
    <MyInput v-model="msg" />
  </div>
</template>

// 在编译层会变成（概念上） // 子组件接收父组件传递的 modelValue // 子组件触发
update 事件，更新父组件的 msg，$event 是子组件触发事件传递的参数
<MyInput :modelValue="msg" @update:modelValue="msg = $event" />
```

```vue
// 子组件
<script setup>
const props = defineProps({
  // 接收父组件传递过来的 modelValue
  modelValue: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(["update:modelValue"]);
// 定义触发 update:modelValue 事件
</script>

<template>
  <!-- 绑定 modelValue -->
  <!-- 监听 input 事件，触发 update 事件，传递输入框的值 -->
  <input
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>
```

## 多个 v-model

```vue
// 父组件
<script setup>
const isChecked = ref(false);
const inputValue = ref("");
</script>

<template>
  <div>
    <!-- 一个组件实例，同时绑定两个状态 -->
    <MyInput v-model:checked="isChecked" v-model:value="inputValue" />
  </div>
</template>
```

```vue
// 子组件
<script setup>
// 接收父组件传递过来的 checked 和 value
const props = defineProps({
  checked: Boolean,
  value: String,
});
// 定义触发 update:checked 和 update:value 事件
const emit = defineEmits(["update:checked", "update:value"]);
</script>

<template>
  <div>
    <!-- 复选框示例：控制选中状态 -->
    <input
      type="checkbox"
      :checked="checked"
      @change="$emit('update:checked', $event.target.checked)"
    />

    <!-- 文本输入框示例：控制输入值 -->
    <input
      type="text"
      :value="value"
      @input="$emit('update:value', $event.target.value)"
    />
  </div>
</template>
```

## defineModel

1. 建立连接：查找父组件传进来的特定 prop。

2. 值同步（父 -> 子）：父组件更新该 prop 时，defineModel 返回的 Ref 也会随之更新。

3. 触发更新（子 -> 父）：子组件更新 defineModel 返回的 Ref 时，会触发更新事件。

---

### 基本用法

```vue
//子组件
<script setup>
// 声明 model，它既是 prop 也是 ref
const model = defineModel();
</script>

<template>
  <input v-model="model" />
</template>
```

```vue
//父组件
<template>
  <Child v-model="msg" />
</template>

<script setup>
import { ref } from "vue";
const msg = ref("initial value");
</script>
```

### 多个 v-model

```vue
// 子组件
<script setup>
const title = defineModel("title");
const count = defineModel("count");
</script>

<template>
  <input v-model="title" />
  <button @click="count++">加 1</button>
</template>
```

```vue
// 父组件
<template>
  <Child v-model:title="pageTitle" v-model:count="pageCount" />
</template>

<script setup>
import { ref } from "vue";
const pageTitle = ref("Initial Title");
const pageCount = ref(0);
</script>
```

## VueUse useVModel

### 核心作用

它在组件内部创建一个类似“双向绑定”的 `ref`：

1.  **Getter**：当你读取这个 ref 时，它返回 props 中的对应值。
2.  **Setter**：当你修改这个 ref 时，它会自动触发对应的 `update:xxx` 事件通知父组件更新。

这使得你可以在组件内部像操作普通数据一样操作 prop，而无需手动编写 `emit` 逻辑。

### 基本用法

你需要显式声明 `props` 和 `emits`，然后将它们传入 `useVModel`。

```vue
<script setup>
import { useVModel } from "@vueuse/core";

const props = defineProps({
  modelValue: String,
  count: Number,
});

const emit = defineEmits(["update:modelValue", "update:count"]);

// 1. 绑定默认的 modelValue
// 修改 data.value 会自动触发 emit('update:modelValue', newValue)
const data = useVModel(props, "modelValue", emit);

// 2. 绑定具名 v-model
// 修改 countData.value 会自动触发 emit('update:count', newValue)
const countData = useVModel(props, "count", emit);
</script>

<template>
  <input v-model="data" />
  <button @click="countData++">{{ countData }}</button>
</template>
```

### 与 defineModel 的区别

| 特性         | **defineModel** (Vue 3.4+) | **useVModel** (VueUse)      |
| :----------- | :------------------------- | :-------------------------- |
| **来源**     | Vue 官方标准、内置宏       | 第三方库 VueUse             |
| **声明方式** | 自动声明 props/emits (宏)  | 需手动声明 props/emits      |
| **底层实现** | 编译器宏，运行时优化       | 基于 Composition API 的封装 |
| **兼容性**   | 仅 Vue 3.4+                | Vue 2.7 / Vue 3 全版本      |
| **灵活性**   | 标准化，配置简单           | 提供 `passive` 等额外选项   |

### 高级选项

`useVModel` 支持配置对象：

```js
const data = useVModel(props, "modelValue", emit, {
  // passive: true
  // 如果设为 true，prop 变化时不会更新内部的 ref。
  // 这种情况下，它更像是一个“带初始值的本地状态”，但也具备向外 emit 的能力。
  passive: true,

  // deep: true
  // 深度监听 prop 变化
  deep: true,
});
```
