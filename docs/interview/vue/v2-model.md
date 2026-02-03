# vue2中 v-model是如何实现双向绑定的？

## 原生表单上

```js
//1.input框
<input v-model="msg">
//编译后等价于
<input
  :value="msg"
  @input="msg = $event.target.value"
/>

//2.
//checkbox + 数组（选中项列表）
<input
  type="checkbox"
  v-model="list"
  value="A"
/>
<input
  type="checkbox"
  v-model="list"
  value="B"

  @change="(e) => {
  const checked = e.target.checked
  const val = 'A'
  const arr = list
  //选中时：往 list 里 push(value)
  if (checked && arr.indexOf(val) < 0) arr.push(val)
  //取消时：从 list 中移除该 value
  if (!checked && arr.indexOf(val) > -1) arr.splice(arr.indexOf(val), 1)
}"
/>

```

## 组件中

- 在 Vue2 里，一个组件只能有一个 v-model（其它的得用 .sync 修饰符）
- v-model 是一个语法糖，等价于 :value + @input
  - 接收一个名为 value 的 prop
  - 在内部通过 this.$emit('input', 新值) 的方式向外触发更新
- 组件的 v-model 默认是 value 和 input 事件，也可以通过 model 选项自定义

```js
//父组件
<MyInput v-model="msg" />
//等价于
<MyInput
  :value="msg"
  @input="msg = $event" //$event 不再是 DOM 事件对象，而是子组件通过 $emit('input', value) 触发事件时传递的参数值
/>

//子组件
<input :value="value" @input="onInput">

export default {
  props: {
    value: String
  },
  methods: {
    onInput(e) {
      this.$emit('input', e.target.value)
    }
  }
}
```

## 修饰符

`.lazy` 修饰符的作用是将 v-model 的更新时机从默认的 input 事件（每次输入都更新）改为 change 事件（失去焦点或回车确认时更新）。

```js
  //.lazy
  <input v-model.lazy="msg" />
```

`.number` 修饰符的作用是将输入值转换为 Number 类型

```js
  <input v-model.number="msg" />
```

`.trim` 修饰符的作用是自动去除输入首尾空格

```js
  <input v-model.trim="msg" />
```

`.sync` 修饰符的主要作用是实现 Prop 的“双向绑定”。

```js
//sync修饰符示例:
//父组件
<script>
  export default {
    data() {
      return {
        isVisible: false
      }
    }
  }
</script>

<template>
  <div>
    <ChildComponent :visible.sync="isVisible" />
    <p>弹窗显示状态: {{ isVisible }}</p>
  </div>
</template>
//子组件
<template>
  <div :value="visible">
    <button @click="onInput">点击</button>
  </div>
</template>

<script>
  export default {
    props: {
      visible: Boolean
    },
    methods: {
      onInput(e) {
        // 触发 update:visible 事件，更新父组件中的 isVisible
        this.$emit('update:visible', !this.visible)
      }
    }
  }
</script>
```
