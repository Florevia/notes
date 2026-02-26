# ESLint + Prettier 配置指南

## 安装

```bash
# 核心包
npm install -D eslint prettier

# eslint 与 prettier 的冲突
npm install -D eslint-config-prettier eslint-plugin-prettier

# Vue 专用规则
npm install -D eslint-plugin-vue

# 涵盖所有的浏览器 API（如 localStorage, fetch, navigator 等）
npm install globals -D
```

安装详解：

- `eslint`：ESLint 核心包
- `prettier`：Prettier 核心包
- `eslint-config-prettier`：关闭 ESLint 的格式化规则，避免与 Prettier 冲突
- `eslint-plugin-prettier`：将 Prettier 作为 ESLint 的一个插件
- `eslint-plugin-vue`：Vue 文件的 ESLint 插件

## 配置

.prettierrc.js

```js
module.exports = {
  singleQuote: true,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  semi: true,
  endOfLine: "auto",
};
```

新版 ESLint 配置（ESLint 9+ 默认，推荐）

```js
import js from "@eslint/js"; // ESLint 官方的 JS 规则包

import pluginVue from "eslint-plugin-vue"; // 解析.vue文件、提供 Vue 专用的检查规则

import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
  js.configs.recommended, // 继承推荐规则
  ...pluginVue.configs["flat/vue2-recommended"], // vue2规则
  // ...pluginVue.configs['flat/recommended']  // Vue 3 项目(默认就是 Vue 3)

  eslintConfigPrettier, // 关闭 ESLint 与 Prettier 的冲突

  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      "prettier/prettier": "error", // 把 Prettier 的格式问题作为 ESLint 错误
    },
  },

  {
    files: ["**/*.{vue,js}"], // 匹配文件
    ignores: ["node_modules", "dist"], // 忽略文件
    rules: {
      "no-console": "warn",
      "no-unused-vars": "warn",
    },
  },
  {
    languageOptions: {
      ecmaVersion: 2021, // 支持的 ECMAScript 版本
      sourceType: "module", // 模块类型：'module' | 'script' | 'commonjs'
      globals: {
        // 全局变量声明
        ...globals.browser,
      },
    },
  },
];
```

旧版配置（ESLint 8 及以前）

```js
module.exports = {
  root: true, // 这是项目的根配置文件，不要再往上层目录查找
  env: { browser: true, es2021: true }, // 声明代码运行的环境，让 ESLint 知道哪些全局变量是合法的
   extends: [
    'eslint:recommended',
    'plugin:vue/recommended',
    'plugin:prettier/recommended'  // 建议加上
  ]
  plugins: ['vue'],
  rules: {
    'no-console': 'warn'
  }
};
```

.vscode/settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  // 针对 JS 和 Vue 的配置
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  // 开启 ESLint 自动修复
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## 添加脚本

```json
{
  "scripts": {
    "lint": "eslint src --fix"
  }
}
```