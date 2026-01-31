# stylelint

## 安装

```bash
# 核心与标准规则
npm install -D stylelint stylelint-config-standard stylelint-config-recommended-vue

# 兼容 Prettier (防止样式规则打架)
npm install -D stylelint-config-prettier stylelint-config-recess-order

# 如果你使用 SCSS (Sass)，还需额外安装：
npm install -D sass stylelint-config-standard-scss
```

- `stylelint`：stylelint 核心包
- `stylelint-config-standard`：官方推荐的标准 CSS 规则
- `stylelint-config-recommended-vue`：专门用于解析 .vue 文件中的样式
- `stylelint-config-prettier`：与 Prettier 兼容

## 配置

.stylelintrc.js

```js
export default {
  // 继承规则集
  extends: [
    // 1. 标准 CSS 规则
    "stylelint-config-standard",
    // 2. Vue 适配规则 (必须加，否则解析不了 .vue 文件)
    "stylelint-config-recommended-vue",
    // 3. 属性自动排序 (可选，推荐)
    "stylelint-config-recess-order",
  ],
  // 自定义规则
  rules: {
    // 允许使用未知伪类 (为了适配 Vue 的 ::v-deep, ::v-slotted 等)
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: [
          "deep",
          "global",
          "v-deep",
          "v-global",
          "v-slotted",
        ],
      },
    ],
    // 允许使用未知伪元素 (同上)
    "selector-pseudo-element-no-unknown": [
      true,
      {
        ignorePseudoElements: ["v-deep", "v-global", "v-slotted"],
      },
    ],
    // 禁止空源码 (防止 .vue 文件没有 <style> 标签时报错)
    "no-empty-source": null,

    // 允许 BEM 命名规范 (也就是类名可以包含下划线和连字符)
    "selector-class-pattern": null,
  },
};
```

## 脚本配置

`package.json`

```json
"scripts": {
  "lint:style" : "stylelint \'src/**/*.{css,scss,vue}\ --fix"
}
```
