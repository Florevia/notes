# husky（git钩子） + lint-staged （只检查暂存区文件的工具）

## 安装

````bash
npm install -D husky lint-staged

## 初始化

```bash
# 1. 修改 package.json：添加了 "prepare": "husky" 脚本。
# 2. 创建目录：生成了 .husky/ 文件夹。
# 3. 创建示例钩子：默认在 .husky/pre-commit 里写了一个 npm test
# 9版本以上
npx husky init
# 八版本以下
npx husky install
````

## 配置

```json
{
  "lint-staged": {
    "*.{js,jsx,vue}": ["eslint --fix"],
    "*.{css,scss,vue}": ["stylelint --fix"]
  }
}
```

## 添加钩子

```bash
# 每次 commit 前都自动执行 lint-staged
npx husky add .husky/pre-commit "npx lint-staged"
```
