# vueuse 库

## 常用函数

### useIntersectionObserver

```js
import { useIntersectionObserver } from "@vueuse/core";

// 1. 监听元素是否进入视口
const { stop } = useIntersectionObserver(el, ([{ isIntersecting }]) => {
  if (isIntersecting) {
    // 2. 元素进入视口时，加载图片
    el.src = imgSrc;
    // 3. 停止监听
    stop();
  }
});
```

### useStorage

```js
import { useStorage } from "@vueuse/core";

// 将 userInfo 绑定到 localStorage 中的 'my-user-info' 字段
// 如果缓存里没数据，默认值为后面传入的对象
const userInfo = useStorage('my-user-info', { name: 'Li Lin', theme: 'dark' })

// 当你在代码里修改 userInfo.value.theme = 'light' 时
// localStorage 里的数据会自动更新，同时视图也会响应式重新渲染！
```

### useWindowSize

```js
import { useWindowSize } from "@vueuse/core";

// 1. 监听窗口大小变化
const { width, height } = useWindowSize();

// 2. 当窗口大小变化时，会自动更新 width 和 height
console.log(width.value, height.value);
```

### useMouse

```js
import { useMouse } from "@vueuse/core";

// 1. 监听鼠标位置变化
const { x, y } = useMouse();

// 2. 当鼠标移动时，会自动更新 x 和 y
console.log(x.value, y.value);
```
