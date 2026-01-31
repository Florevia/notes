# 动态绑定 class 和 style

在 Vue 中，我们可以使用 v-bind（简写为 :）来动态控制 HTML 元素的 class 和 style。

## class

### 对象语法

- 传给 :class 一个对象，以动态切换 class:

  - 键 (Key): 类名
  - 值 (Value): 布尔值

```vue
<template>
  <div :class="{ active: isActive, 'text-danger': hasError }"></div>
</template>

<script>
export default {
  data() {
    return {
      isActive: true,
      hasError: false,
    };
  },
};
</script>
```

### 数组语法

- 传给 :class 一个数组，以应用一个 class 列表。

  - 适用于：需要同时应用多个 class，且这些 class 来自不同的变量。

```vue
<template>
  <div :class="[activeClass, errorClass]"></div>
</template>

<script>
export default {
  data() {
    return {
      activeClass: "active",
      errorClass: "text-danger",
    };
  },
};
</script>
```

### 组合使用

- 数组中可以嵌套对象语法

```vue
<template>
  <div :class="[{ active: isActive }, errorClass]"></div>
</template>

<script>
export default {
  data() {
    return {
      isActive: true,
      errorClass: "text-danger",
    };
  },
};
</script>
```

## style

### 对象语法

- CSS 属性名可以用驼峰式
- 或短横线分隔（记得加引号）

```vue
<template>
  <div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
  <!-- 或者直接绑定一个样式对象，代码更清晰 -->
</template>

<script>
export default {
  data() {
    return {
      activeColor: "red",
      fontSize: 30,
    };
  },
};
</script>
```

### 数组语法

```vue
<template>
  <div :style="[{ color: activeColor }, { fontSize: fontSize + 'px' }]"></div>
  <!-- <div :style="[baseStyles, overridingStyles]"> -->
</template>

<script>
export default {
  data() {
    return {
      activeColor: "red",
      fontSize: 30,
    };
  },
};
</script>
```

### 组合使用

```vue
<template>
  <div :style="[{ color: activeColor }, errorClass]"></div>
</template>

<script>
export default {
  data() {
    return {
      activeColor: "red",
      fontSize: 30,
    };
  },
};
</script>
```

## 组件上使用

如果组件只有一个根元素，在组件上绑定的 class 会自动 透传 (Fallthrough) 到根元素上，并与根元素已有的 class 合并。

```vue
<!-- MyComponent.vue -->
<template>
  <p class="foo bar">Hi!</p>
</template>

<!-- 父组件使用 -->
<MyComponent class="baz box" />

<!-- 最终渲染结果 -->
<p class="foo bar baz box">Hi!</p>
```
