# float

`float` 属性最初设计只有一个目的：**实现文字环绕图片的效果**。

## 特性

1.  **脱离文档流 (但没完全脱离)**：
    - 元素会浮动到父元素的左边或右边。
    - **重要**：它虽然脱离了文档流（不占位），但它依然会“挤占”内容的显示空间，所以文字会环绕它，而不会被它遮挡（这与 `position: absolute` 不同）。
2.  **高度坍塌 (Height Collapse)**：
    - 如果一个父元素里的所有子元素都浮动了，那么父元素就像“空”了一样，高度会变成 0。这是 Float 最大的副作用。

## 如何清除浮动？

清除浮动的核心目的是**让父元素在高度坍塌后能重新撑开**，包裹住浮动的子元素。

### 方法一：clearfix

这是目前最流行、最标准的方法。给父元素加上一个 `clearfix` 类。

- **原理**：利用伪元素 `:after` 在父元素内容的最后面插入一个看不见的块级元素，并应用 `clear: both`。

```css
/* 定义工具类 */
.clearfix::after {
  content: ""; /* 必须有内容，哪怕是空的 */
  display: block; /* 必须是块级元素 */
  clear: both; /* 核心：清除左右浮动 */
  visibility: hidden;
  height: 0;
}
```

### 方法二：BFC (块级格式化上下文)

给父元素触发 BFC，BFC 的特性之一就是**计算高度时会包含浮动子元素**。

- **常见写法**：
  - `overflow: hidden;`、
  - `display: flow-root;`
- **缺点**：`overflow: hidden` 可能会把超出父元素的内容裁剪掉（比如下拉菜单）。

### 方法三：额外标签法（或者：after 伪元素法）

在浮动元素后面硬加一个空的 `div` 标签。

- **缺点**：HTML 结构里多了一堆无意义的空标签，代码不干净。

```html
<div class="parent">
  <div class="float-left"></div>
  <div class="float-left"></div>
  <!-- 硬加的 -->
  <div style="clear: both;"></div>
</div>
```

## 总结

面试时首选回答 **clearfix 伪元素方案**，因为它对现有布局影响最小、兼容性最好。其次可以提一下 **BFC (`overflow: hidden` / `display: flow-root`)** 方案，展示你对 BFC 的理解。
