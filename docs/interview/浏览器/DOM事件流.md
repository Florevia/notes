# DOM 事件流

## 三个阶段

1. 捕获阶段 (Capturing Phase)： 事件从最外层的 window 对象出发，顺着 DOM 树一层层向里传播，直到到达目标元素。

2. 目标阶段 (Target Phase)： 事件到达了实际被点击的元素（目标元素）。

3. 冒泡阶段 (Bubbling Phase)： 事件从目标元素出发，顺着 DOM 树一层层向外传播，直到回到 window 对象。

## 代码控制

```js
element.addEventListener(event, function, useCapture)
```

- useCapture 为 false (默认)： 监听器在 冒泡阶段 执行。

- useCapture 为 true： 监听器在 捕获阶段 执行。

## 事件委托

便于代码维护（父元素代理子元素不需要手动添加）和性能优化（事件监听少了）。

### 两个易混淆的属性 (target vs currentTarget)

- `e.target`： 触发事件的元素（实际点击的那个东西，可能是子元素）。
- `e.currentTarget`： 绑定事件监听器的元素（写 addEventListener 的那个元素）。

在事件委托中： `currentTarget` 是 ul，`target` 是被点击的那个 li。

### 阻止事件冒泡

- `e.stopPropagation()`： 阻止事件冒泡，阻止事件继续向上传播。
