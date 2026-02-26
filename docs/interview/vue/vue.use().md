# vue.use() 方法

它的本质是调用插件内部的 install 方法，把 Vue 应用实例暴露给第三方，允许它们在应用级别进行拦截、注入和扩展。

## 底层机制

Vue.use() 的源码其实非常精简，它的核心逻辑可以用两句话概括：

1. 防止重复安装： 它会先检查这个插件是不是已经安装过了，如果装过了就直接跳过，保证单例。

2. 寻找并执行 `install` 方法： 它要求你传入的插件必须是一个对象（包含 install 方法）或者是一个函数。

## 架构演进：从“全局污染”到“实例隔离” (Vue 2 vs Vue 3)

- Vue 2 的痛点 (Vue.use)：Vue 2 是基于全局构造函数的。当你调用 `Vue.use(VueRouter)` 时，你修改的是全局的 Vue 对象。这就导致了一个致命问题：如果你在同一个页面上有两个独立的 Vue 应用（比如微前端架构），它们被迫共享同一个 Router 或 Vuex。

- Vue 3 的破局 (app.use)：Vue 3 引入了 `createApp()`。`app.use()` 只作用于当前这个特定的应用实例。这是典型的工厂模式，彻底解决了微前端和 SSR 下的单例状态隔离问题。

## demo

1. vue2:

第一步：编写插件

```js
// plugin.js
const MyPlugin = {
  install(Vue, options) {
    // 核心操作：挂载到 Vue 的原型上
    Vue.prototype.$myPlugin = function(msg) {
      console.log(options?.message || 'default message', msg);
    };
  },
};

export default MyPlugin;
```

第二步： 安装插件

```js
// main.js
import Vue from 'vue';
import MyPlugin from './plugin.js';

// 安装插件
Vue.use(MyPlugin, { message: 'Hello Vue 2!' });

new Vue({
  render: (h) => h(App),
}).$mount('#app');
```
第三步： 使用插件

```js
// App.vue
<template>
  <div>
    <button @click="sayHello">Click me</button>
  </div>
</template>

<script>
export default {
  methods: {
    sayHello() {
      // 直接通过 this 调用，非常顺手
      this.$myPlugin('前端开发者'); 
    }
  }
}
</script>
```

2. vue3

第一步：编写插件

```js
// plugin.js
const MyPlugin = {
  install(app, options) {
    // 第一种：挂载到 Vue 的原型上
    app.config.globalProperties.$myPlugin = function(msg) {
      console.log(options?.message || 'default message', msg);
    };

    // 第二种：推荐的 Composition API 写法（依赖注入）
    // 相当于在最顶层给所有的子组件发了一个广播
    app.provide('myPlugin', function(msg) {
      console.log(options?.message || 'default message', msg);
    });
  },
};

export default MyPlugin;
```

第二步： 安装插件

```js
// main.js
import { createApp } from 'vue';
import MyPlugin from './plugin.js';

// 创建应用实例
const app = createApp(App);

// 安装插件
app.use(MyPlugin);

// 挂载应用
app.mount('#app');
```

第三步： 使用插件

```vue
// App.vue
<template>
  <div>
    <button @click="sayHello">Click me</button>
  </div>
</template>

<script>
import { inject } from 'vue';

const myPlugin = inject('myPlugin');

const sayHello = () => {
  myPlugin('前端开发者');
};
</script>
```
