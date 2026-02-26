# canvas 绘制

## 是什么？

canvas 是 HTML5 中的一个元素，用于在网页上绘制图形。
它可以用来绘制 2D 图形，如矩形、圆形、线等。
也可以用来绘制 3D 图形，如立方体、球体等。

## 如何使用？

1. 在 HTML 中添加一个 canvas 元素。

```html
<canvas id="myCanvas" width="200" height="100"></canvas>
<!-- 这是一个 200px 宽、100px 高的 canvas 元素 -->
```

2. 在 js 中获取 canvas 元素的 `上下文`。

```js
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
```

3. 使用上下文对象的方法绘制图形。

```javascript
// 绘制一个红色的矩形
ctx.fillStyle = 'red';
ctx.fillRect(10, 10, 100, 50);
```