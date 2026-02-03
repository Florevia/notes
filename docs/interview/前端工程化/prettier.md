# prettier

格式化工具，支持多种编程语言，如 JavaScript、TypeScript、HTML、CSS、Markdown、JSON 等。

## 安装

```zsh
pnpm add prettier --save-dev
# 或者
pnpm install prettier --save-dev
```

## 配置文件格式

- js
  - .prettierrc.js
  - prettier.config.js
  - .prettierrc.mjs
  - prettier.config.mjs
  - .prettierrc.cjs
  - prettier.config.cjs
- ts
  - .prettierrc.ts
  - prettier.config.ts
  - .prettierrc.cts
  - prettier.config.cts
  - .prettierrc.mts
  - prettier.config.mts
- json
  - .prettierrc.json
- yaml
  - .prettierrc.yaml
  - .prettierrc.yml
- toml
  - .prettierrc.toml

- .prettierrc 的特点：
  - 文件格式：通常是 JSON 格式，不能包含注释或代码逻辑。
  - 简洁性：适用于简单的配置，只需定义 Prettier 相关的选项。
  - 文件扩展名：可以是 .prettierrc 或 .prettierrc.json，两者是等价的。

- prettier.config.js 的特点：
  - 文件格式：是一个 JavaScript 文件，可以包含更复杂的逻辑和注释。
  - 灵活性：支持在配置中使用 JavaScript 代码，可以根据需要动态计算配置项，或执行复杂的条件判断。
  - 文件扩展名：通常是 .config.js 或 prettier.config.js。 


## 常用命令

```zsh
# 格式化指定的文件并覆盖原文件（文件路径/glob 模式）
pnpm prettier --write <file/glob>

# glob 模式
# *.js 匹配所有 .js 文件。
# **/*.js 匹配当前目录及子目录下的所有 .js 文件。
# src/**/*.js 匹配 src 目录下以及其所有子目录中的 .js 文件。

# 指定 Prettier 配置文件的位置，默认情况自动查找项目根目录下的配置文件
pnpm prettier --config <path>

# 列出所有未符合 Prettier 配置的文件，但不进行修改
pnpm prettier --list-different <file/glob>
```

## demo
```zsh
# 创建 prettier 配置文件
touch .prettier.config.js 
# 编辑 prettier 配置文件
cat <<"EXIT" > .prettier.config.js
```

```js
export default {
  // 打印宽度
  printWidth: 80,
  // 缩进宽度
  tabWidth: 2,
  // 是否使用分号
  semi: true,
  // 是否使用单引号
  singleQuote: true,
  // 控制对象属性名是否总是使用引号，可选项“consistent”、“preserve”、“as-needed”
  quoteProps: "consistent",
  // 控制在对象字面量中是否总是使用尾随逗号，可选项“none”、“es5”、“all”
  trailingComma: "none",
  // 对象字面量的大括号里要不要空格
  bracketSpacing: true,
  // 对象字面量的大括号是否换行,可选"preserve"(默认)"collapse"(压成一行)
  objectWrap: "preserve",
  //多行 HTML / JSX / Vue / Angular 标签 的右尖括号 > 放在哪里,true(紧凑)，false(换行)
  bracketSameLine: true,
  // 箭头函数参数只有一个时是否要有小括号，可选"avoid"（默认）、"always"
  arrowParens: "always",
  //定义换行符的类型,可选"auto"（默认）、"lf"（LF 换行符）、"crlf"（CRLF 换行符）、"cr"（CR 换行符）
  endOfLine: "auto",

}
```