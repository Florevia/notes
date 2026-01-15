# BFC (块级格式化上下文)

Block Formatting Context

它是一个**独立的渲染区域**。

## 核心特性

### 包含浮动元素 (清除浮动)

- **规则**：计算 BFC 的高度时，浮动元素也参与计算。
- **用途**：这就是为什么给父元素设置 `overflow: hidden` 能解决高度坍塌的原因。

## 如何触发 BFC？

只要元素满足下面**任意一个**条件，它就变成了 BFC：

1.  **`overflow` 值不为 `visible`** (最常用)
    - 如 `overflow: hidden`、`scroll`、`auto`。
2.  **`display` 的值为特定类型**
    - `inline-block`
    - `flex` / `inline-flex`
    - `grid` / `inline-grid`
    - `flow-root` (专门为触发 BFC 设计的新属性，无副作用！推荐)
3.  **`position` 的值为绝对定位**
    - `absolute` 或 `fixed`。
4.  **`float` 的值不为 `none`**
    - `left` 或 `right`。
