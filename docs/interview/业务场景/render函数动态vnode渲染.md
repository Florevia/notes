# render 函数动态 vnode 渲染

## 原因

在日常开发中，像 Message（消息提示）和 Confirm（确认弹窗）这种组件，如果我们每次都在 `<template>` 里写一遍标签，然后用 `v-if` 去控制显示隐藏，会非常痛苦且冗余。

最优雅的解法就是函数式（命令式）调用，比如直接执行 `showMessage('成功')`，底层通过 `Render 函数`动态创建组件并插入到 `<body>` 中。

## 标准开发流程

1. 编写标准的 `.vue` 组件： 正常使用 `<template>`、`<style>` 和 `<script setup>` 编写 UI、过渡动画`<Transition>`和内部交互。

2. 预留回调 Props： 在组件内部不要直接销毁 DOM，而是通过触发 `props.onDestroy` 等方法，通知外部去执行清理工作。

3. 编写命令式包装器： 创建一个独立的 `JS/TS` 文件，暴露出触发函数（如 showMessage）。

4. 动态挂载与卸载（核心）：

- 利用 `createVNode (或 h)` 将引入的 `.vue` 组件转化为虚拟 DOM。

- 利用 `render` 将虚拟 DOM 渲染到动态创建的 `div` 容器中。

- 监听组件的退场动画结束事件（如 `@after-leave`），在此时执行 `render(null, container)` 和 `container.remove()` 进行彻底的内存回收。

## message 消息提示弹窗

### 1. 编写 UI 组件 (Message.vue)

```vue
<template>
  <Transition name="msg-fade" @after-leave="handleAfterLeave">
    <div v-show="visible" class="standard-message">
      {{ text }}
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  text: String,
  duration: { type: Number, default: 2000 },
  // 接收外部传入的销毁方法
  onDestroy: Function,
});

const visible = ref(false);

onMounted(() => {
  // 挂载后立即显示，触发进入动画
  visible.value = true;

  // 定时关闭
  setTimeout(() => {
    visible.value = false; // 触发离开动画
  }, props.duration);
});

// 动画结束后，通知外部执行真正的 DOM 卸载
const handleAfterLeave = () => {
  if (props.onDestroy) {
    props.onDestroy();
  }
};
</script>

<style scoped>
.standard-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #f0f9eb;
  color: #67c23a;
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 9999;
}
/* Vue 内置的过渡动画类名 */
.msg-fade-enter-active,
.msg-fade-leave-active {
  transition: all 0.3s ease;
}
.msg-fade-enter-from,
.msg-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
```

### 2. 编写触发器 (message.js)

```js
import { createVNode, render } from "vue";
import MessageComponent from "./Message.vue";

export const showMessage = (text, duration = 2000) => {
  // 1. 创建动态容器
  const container = document.createElement("div");
  // 2. 挂载到 body 上
  document.body.appendChild(container);

  // 销毁逻辑：清空 VNode，移除真实 DOM
  const destroy = () => {
    render(null, container);
    container.remove();
  };

  // 使用 createVNode (等同于 h)，传入组件和 props
  const vnode = createVNode(MessageComponent, {
    text,
    duration,
    onDestroy: destroy, // 将销毁控制权注入给组件，由动画结束钩子触发
  });

  render(vnode, container);
};
```

## confirm 确认弹窗 (基于 promise 阻塞流程)

### 1. 编写 UI 组件 (Confirm.vue)

```vue
<template>
  <Transition name="fade" @after-leave="handleAfterLeave">
    <div v-show="visible" class="confirm-overlay">
      <div class="confirm-box">
        <div class="content">{{ content }}</div>
        <div class="actions">
          <button @click="handleAction('cancel')">取消</button>
          <button @click="handleAction('confirm')" class="primary">确定</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  content: String,
  onConfirm: Function,
  onCancel: Function,
  onDestroy: Function,
});

const visible = ref(false);
let actionType = ""; // 记录用户点击了哪个按钮

onMounted(() => {
  visible.value = true;
});

const handleAction = (type) => {
  actionType = type;
  visible.value = false; // 先触发动画隐藏组件
};

// 动画结束后，执行回调与物理销毁
const handleAfterLeave = () => {
  if (actionType === "confirm" && props.onConfirm) {
    props.onConfirm();
  } else if (actionType === "cancel" && props.onCancel) {
    props.onCancel();
  }

  if (props.onDestroy) {
    props.onDestroy();
  }
};
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.confirm-box {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
}
.actions {
  margin-top: 20px;
  text-align: right;
  gap: 10px;
  display: flex;
  justify-content: flex-end;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 2. 编写触发器 (confirm.js)

```js
import { createVNode, render } from "vue";
import ConfirmComponent from "./Confirm.vue";

export const showConfirm = (content) => {
  // 返回一个 Promise，实现异步等待用户确认/取消操作
  return new Promise((resolve, reject) => {
    // 创建一个临时的 DOM 容器，用于挂载动态组件
    const container = document.createElement("div");
    // 将容器挂载到 body 上，确保组件能在页面中显示
    document.body.appendChild(container);

    // 定义销毁函数：负责清理 VNode 和 DOM 元素
    const destroy = () => {
      // 调用 render(null, container) 清空虚拟 DOM，触发组件的卸载生命周期
      render(null, container);
      // 从 DOM 树中移除容器元素，完成物理清理
      container.remove();
    };

    // 创建虚拟节点 (VNode)，传入组件和配置参数
    const vnode = createVNode(ConfirmComponent, {
      // 传递弹窗内容给组件
      content,
      // 用户点击"确定"按钮时触发，将 Promise 状态置为 fulfilled
      onConfirm: () => resolve(true),
      // 用户点击"取消"按钮时触发，将 Promise 状态置为 rejected
      onCancel: () => reject(new Error("cancel")),
      // 将销毁函数注入组件，由组件在退场动画结束后触发销毁
      onDestroy: destroy,
    });

    // 将虚拟节点渲染到真实 DOM 容器中，完成组件的挂载
    render(vnode, container);
  });
};
```
### 业务组件调用方式

```js
import { showMessage } from './message';
import { showConfirm } from './confirm';

// 触发 Message
showMessage('操作成功！');

// 触发 Confirm
const handleDelete = async () => {
  try {
    await showConfirm('确认删除该文件吗？');
    showMessage('删除成功');
  } catch (e) {
    showMessage('已取消');
  }
};
```

## 面试问题

1. （基础与 API）：在实现命令式组件时，Vue 3 的底层思路相比 Vue 2 发生了什么根本性的变化？为什么要这么改？

>【考察目的】：测试对框架版本演进的敏感度，以及对 Tree-shaking 工程化理念的理解。

- Vue 2 的做法：通常依赖 `Vue.extend(Component)` 生成一个子类构造器，然后 new 出一个实例，最后手动调用 `$mount()` 挂载。这种做法是严重依赖全局 Vue 对象的。

- Vue 3 的做法：废弃了 `Vue.extend`，改为使用导出的独立纯函数 `createVNode（或 h）和 render`。

- 为什么要改：核心是为了 Tree-shaking。Vue 3 采用了函数式的 API 设计，`createVNode` 和 `render` 都是从 vue 包里具名导入的。如果你在项目中没用到动态挂载，打包工具就能把这部分代码剔除掉，从而减小打包体积；同时也避免了 Vue 2 中全局 API 容易造成的污染问题。

2. （内存与生命周期）：在执行组件销毁逻辑时，为什么必须先执行 `render(null, container)`，然后再执行 `container.remove()`？如果反过来，或者漏写其中一个，会造成什么后果？

>【考察目的】：测试实际工程中的内存泄露防范意识，以及对 **虚拟 DOM** 和 **真实 DOM** 关系的理解。

- 如果漏写 `render(null, container)`：这是最致命的。`container.remove()` 只是把 HTML 节点从浏览器的 DOM 树上拔掉了（视觉上消失了）。但 Vue 内部根本不知道这个组件被干掉了，它在内存中依然保留着这个组件的实例、响应式依赖（effect）和绑定的事件监听器。只要不刷新页面，频繁触发就会导致严重的内存泄漏。

- 如果漏写 `container.remove()`：内存虽然被 Vue 回收了，但 HTML 结构里会残留无数个空的 `<div class="container"></div>` 垃圾外壳。

- 如果反过来执行：如果先移除了真实 DOM 再去 `render(null, container)`，Vue 在执行卸载逻辑和触发生命周期钩子（如 beforeUnmount）时，可能会因为找不到对应的真实 DOM 节点而抛出底层错误。

3. （上下文与边界）使用 render 函数挂载到 `document.body` 上的组件，本质上是一个脱离了主应用树的“孤儿节点”。如果你的 Confirm 组件里使用了 `Vue Router` 进行跳转，或者使用了 `Pinia` 获取全局状态，会发生什么？如何优雅地解决这个问题？

>【考察目的】：测试对 Vue 渲染边界（App Tree）的理解，以及跨树状态传递的解决方案。

- 会发生什么：默认情况下会报错。因为这个组件不是通过 `createApp().mount()` 那个主根节点渲染出来的，它拿不到主应用的 `provide/inject` 依赖和全局插件。

- 如何优雅解决：需要将 **主应用的上下文（Context）“透传”给这个孤儿节点**。在调用 `createVNode` 之后，执行 `render` 之前，把当前应用的上下文赋值给虚拟节点的 `appContext` 属性。

```JavaScript
const vnode = createVNode(ConfirmComponent, props);
// 核心：上下文继承
vnode.appContext = app._context; 
render(vnode, container);
```