# Vue 3 h() 函数

createElement() 的缩写，用于创建虚拟 DOM 节点，在 Vue 3 中，所有的模板最终都会被编译成使用 h() 函数的渲染函数。

## 基本语法

```js
h(元素类型, 属性对象, 子元素)
```

## 参数详解

### 元素类型

- 类型：`String | Object | Function`
- 描述：要渲染的 DOM 元素类型。
- 可以是 HTML 标签名（字符串）：'div' , 'span' , 'h1'
- 可以是 Vue 组件对象：MyComponent
- 可以是异步组件：() => import('./MyAsyncComponent.vue')
- 可以是函数式组件：

### 属性对象 （可选）：

- HTML 属性： { id: 'app', class: 'container' }
- DOM 属性： { innerHTML: 'content' }
- 事件处理器： { onClick: handleClick }
- 组件 props： { title: '标题', count: 0 }

### 子元素 （可选）：

- 字符串： 'Hello World'
- 数组： [h('span', '子元素1'), h('span', '子元素2')]
- 虚拟节点： h('span', '单个子元素')

```js
// HTML 标签示例
h('div', { class: 'container' }, '内容')
h('h1', { id: 'title' }, '标题')
h('span', { style: { color: 'red' } }, '红色文本')

// Vue 组件示例
const MyComponent = {
  props: ['title'],
  render() {
    return h('div', this.title)
  }
}

// 使用组件
h(MyComponent, { title: '组件标题' })

// 异步组件示例
const AsyncComponent = defineAsyncComponent(() => import('./MyAsyncComponent.vue'))

// 使用异步组件
h(AsyncComponent, { prop: 'value' })

// 函数式组件示例
const FunctionalComponent = (props, { slots }) => {
  return h('div', { class: 'functional' }, slots.default())
}

// 使用函数式组件
h(FunctionalComponent, {}, { default: () => '内容' })
```

