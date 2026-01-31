# DOM 尺寸和位置属性速查表

## 一、元素尺寸属性 (Element Dimensions)

| 属性                 | 计算公式                             | 包含内容            | 可写 |
| :------------------- | :----------------------------------- | :------------------ | :--- |
| `clientWidth/Height` | content + padding                    | ❌ border ❌ 滚动条 | ❌   |
| `offsetWidth/Height` | content + padding + border + 滚动条  | ✅ border ✅ 滚动条 | ❌   |
| `scrollWidth/Height` | 内容实际尺寸 + padding（含溢出部分） | 溢出内容            | ❌   |
| `scrollLeft/Top`     | 已滚动的距离                         | —                   | ✅   |
| `clientLeft/Top`     | border 宽度                          | —                   | ❌   |
| `offsetLeft/Top`     | 相对于 `offsetParent` 的偏移         | 含 margin           | ❌   |

### `getBoundingClientRect()` ⭐ 推荐

这是最精确、最现代的方法。返回一个对象，包含 `width`, `height`, `top`, `left`, `right`, `bottom`。

| 特点          | 说明                                                 |
| :------------ | :--------------------------------------------------- |
| **包含**      | content + padding + border（标准 `border-box` 尺寸） |
| **精度**      | 返回小数（高精度）                                   |
| **Transform** | 受 CSS `transform` 影响（缩放多大就返回多大）        |
| **位置**      | 相对于**视口 (Viewport)**                            |

```js
const rect = el.getBoundingClientRect();
// rect.width, rect.height, rect.top, rect.left, rect.right, rect.bottom
```

**适用场景**：拖拽、Tooltip 定位、判断元素是否在可视区域（Intersection Observer 备选方案）。

### 常用判断

```js
// 是否有滚动条
element.scrollHeight > element.clientHeight;

// 是否滚动到底部
scrollTop + clientHeight >= scrollHeight - 1;
```

---

## 二、鼠标事件坐标 (Event Coordinates)

通常在事件回调（如 `click`, `mousemove`）的 `event` 对象中获取。

| 属性                        | 参照系 (坐标原点)     | 场景                                                               |
| :-------------------------- | :-------------------- | :----------------------------------------------------------------- |
| `event.clientX` / `clientY` | 浏览器视口 (Viewport) | **最常用**。用于固定定位元素（弹窗、右键菜单）。不随页面滚动变化。 |
| `event.pageX` / `pageY`     | 整个文档 (Document)   | 包含滚动距离。用于绝对定位 (`position: absolute`) 的元素。         |
| `event.offsetX` / `offsetY` | 当前点击元素 (Target) | 用于计算点击位置在元素内部的坐标，如 Canvas 绘图。                 |
| `event.screenX` / `screenY` | 物理显示器屏幕        | 极少用于 Web 布局，通常用于多屏分析。                              |

### 坐标关系

```js
pageX = clientX + window.scrollX;
pageY = clientY + window.scrollY;
```

---

## 四、获取页面/视口高度 (Window/Document Dimensions)

这分为"窗口有多高"和"网页内容有多长"。

| 需求             | 代码                                       | 说明                                     |
| :--------------- | :----------------------------------------- | :--------------------------------------- |
| **视口高度**     | `window.innerHeight` ⭐                    | 浏览器框框内部高度（不含工具栏、控制台） |
|                  | `document.documentElement.clientHeight`    | HTML 标准模式下                          |
| **文档总高度**   | `document.documentElement.scrollHeight` ⭐ | 整个网页长度（含溢出）                   |
|                  | `document.body.scrollHeight`               | 备选                                     |
| **当前滚动距离** | `window.scrollY` ⭐                        | 页面卷进去了多少                         |

### 常见场景

```js
// 吸顶导航栏（滚动超过 100px 变色）
window.addEventListener("scroll", () => {
  if (window.scrollY > 100) {
    nav.classList.add("sticky");
  }
});

// 判断是否滚动到底部（触底加载）
const isBottom =
  window.scrollY + window.innerHeight >=
  document.documentElement.scrollHeight - 10;
```

---

## 五、Vue 3 + VueUse 最佳实践

### 1. 监听元素大小 (`useElementSize`)

```js
import { useElementSize } from "@vueuse/core";
import { ref } from "vue";

const el = ref(null);
const { width, height } = useElementSize(el);

// template: <div ref="el"> Width: {{ width }} </div>
```

### 2. 获取鼠标位置 (`useMouse`)

```js
import { useMouse } from "@vueuse/core";

// x, y 是响应式的，鼠标动它就变
const { x, y } = useMouse();
```

### 3. 获取视口大小 (`useWindowSize`)

```js
import { useWindowSize } from "@vueuse/core";

const { width, height } = useWindowSize();
```
