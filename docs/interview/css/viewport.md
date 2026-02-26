## 最标准的 Viewport 配置
在现代前端开发中，几乎所有的项目都会在 HTML 模板中包含以下这行标准代码：

```HTML
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```
### 属性拆解与作用
content 属性中可以包含多个以逗号分隔的指令，最常用的包括：

- `width=device-width`:

作用： 将“布局视口”的宽度设置为设备的物理屏幕宽度（即“视觉视口”的宽度）。

效果： 页面不再默认按照 980px 渲染，CSS 中的 100vw 或媒体查询（Media Queries）就能准确匹配到手机的实际屏幕宽度。

- `initial-scale=1.0`:

作用： 设置页面首次加载时的初始缩放比例。

效果： 1.0 表示不缩放，1 个 CSS 像素完全等于 1 个设备独立像素（DIP）。它解决了某些设备在横竖屏切换时可能出现的缩放 Bug。

- `maximum-scale=2.0` / `minimum-scale=0.5`:

作用： 允许用户缩放到的最大或最小比例。例如 `maximum-scale=2.0` 表示用户最多可以将页面缩放 2 倍，`minimum-scale=0.5` 表示用户最少可以将页面缩放 0.5 倍。

- `user-scalable=yes`:

作用： 是否允许用户通过手指捏合来缩放页面。可选值为 `yes` 或 `no`。
