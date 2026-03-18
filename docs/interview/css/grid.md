# grid 网格布局

## 核心概念

- 二维布局
- 容器属性（作用在父元素）和项目属性（作用在子元素）
- 网格线、网格轨道、网格单元格、网格区域

## 网格容器属性

### 1. 定义网格结构

`grid-template-columns`: 定义每一列的宽度。

`grid-template-rows`: 定义每一行的高度。

- 常用的特殊单位和函数：

  - `fr`: 片段单位，表示网格容器中剩余空间的比例。

    > `grid-template-columns: 1fr 2fr`; 表示第二列是第一列的两倍宽。

  - `repeat()`: 简化重复的值。

    > `repeat(3, 1fr)` 等同于 `1fr 1fr 1fr`。

  - `minmax()`: 定义长度范围。
    > `minmax(100px, 1fr)` 表示最小 100px，最大占据剩余空间。

### 2. 网格间距 (Gutters)

`row-gap`: 行间距。

`column-gap`: 列间距。

`gap`: 上面两个属性的简写，格式为 `<row-gap> <column-gap>`。

### 3. 单元格内容的对齐 (Items)

> 定义网格项目在自身单元格内的对齐方式。

`justify-items`: 水平对齐（start | end | center | stretch）。

`align-items`: 垂直对齐（start | end | center | stretch）。

`place-items`: align-items 和 justify-items 的简写。

### 4. 整个网格的对齐 (Content)

> 当网格的总尺寸小于容器尺寸时，定义整个网格在容器内的对齐方式。

`justify-content`: 水平对齐（start | end | center | stretch | space-around | space-between | space-evenly）。

`align-content`: 垂直对齐。

`place-content`: align-content 和 justify-content 的简写。

## 网格项目属性

### 1. 指定项目位置和跨度

> 定义网格项目在网格中的位置和占用的单元格数量。

`grid-column-start / grid-column-end`: 指定项目所在的垂直网格线的起始和结束位置。

`grid-row-start / grid-row-end`: 指定项目所在的水平网格线的起始和结束位置。

简写方式：

`grid-column`: 例如 `grid-column: 1 / 3;` 表示从第 1 条垂直网格线开始，到第 3 条垂直网格线结束（跨越两列）。或者使用 span 关键字：`grid-column: 1 / span 2;`。

`grid-row`: 同上，用于行跨度。
