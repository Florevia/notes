# computed 如何实现双向绑定

- 默认情况下 computed 属性是只读的（Read-only），因为它本质上是一个基于依赖进行派生的“取值器（Getter）”。

- 要实现 computed 的双向绑定，我们需要使用其对象形式的语法，显式地提供 get 和 set 两个函数。

## 实现原理

Getter 与 Setter 的协同

- get()：负责 **依赖收集**。当读取计算属性时，它会建立与底层响应式数据的联系。

- set(newValue)：负责 **触发更新**。当对计算属性进行赋值（如通过 v-model）时，set 函数被调用。在 set 内部，我们必须修改原始的响应式数据，从而通过数据驱动视图的流程，间接实现“双向”效果。

```html
<input v-model="fullName" />
```

```js
import { ref, computed } from "vue";

export default {
  setup() {
    const firstName = ref("张");
    const lastName = ref("三");

    const fullName = computed({
      // 1. 读取逻辑
      get() {
        return `${firstName.value} ${lastName.value}`;
      },
      // 2. 写入逻辑（双向绑定的核心）
      set(newValue) {
        // 解构新值并更新原始的响应式数据源
        const names = newValue.split(" ");
        firstName.value = names[0];
        lastName.value = names[1] || "";
      },
    });

    return { fullName };
  },
};
```

## 应用场景

### 1. 配合状态管理（Vuex / Pinia）使用 v-model

禁止直接通过 v-model 修改 Store 中的数据（违反单向数据流）。

- 因此，get：返回 Store 中的状态。
- set：提交一个 action 或 mutation 来更新 Store。

### 2. 数据转换与校验

当组件需要显示的格式（如日期字符串）与底层数据格式（如时间戳）不一致时，利用 set 在存入数据前进行格式转换或业务逻辑校验。

## 注意点

不要在 set 中改变计算属性自身，否则会死循环
