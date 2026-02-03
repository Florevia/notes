# ESLint

## 安装

```zsh
# 全局安装
pnpm add eslint -g

# 项目本地安装
pnpm add eslint --save-dev
```

## 初始化配置

```zsh
# 初始化配置文件
eslint --init
```

```js
export default [
  {
    rules: {
      // 可选项："error"、"warn"、"off"
      // 是否禁止 console 语句
      "no-console": "warn",
      // 是否禁止使用未定义的变量
      "no-unused-vars": "error",
      // 是否禁止重新赋值 const 变量
      "no-const-assign": "error",
      // 是否禁止使用 debugger 语句
      "no-debugger": "error", 
      // 是否禁止在变量使用前先声明
      "no-use-before-define": "error",
      // 是否禁止使用未定义的变量
      "no-undef": "error",
    },
    languageOptions: {
      globals: {
        window: "readonly",
        console: "readonly",
      }
    },
    // 插件配置
    plugins: {
      // 插件名：插件配置
      "vue": {
        // 插件规则配置
        "rules": {
          // 规则名：规则值
          "vue/no-v-html": "error",
        }
      }
    },
    files: ["src/**/*.{js,css,html}"],
    ignores: ["node_modules/**", "dist/**"],
  }
]
```

## 运行 ESLint

```zsh
# 检查所有文件
eslint .

# 检查指定文件
eslint src/main.js

# 检查目录下所有文件
eslint src/

# 检查目录下所有文件，递归子目录
eslint src/**/*

# 检查目录下所有文件，递归子目录，忽略 node_modules 目录
eslint src/**/* --ignore-pattern node_modules/**
```