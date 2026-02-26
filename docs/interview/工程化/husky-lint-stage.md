# husky（git钩子） + lint-staged （只检查暂存区文件的工具）+ commitlint（校验提交信息是否符合规范）

## 安装

```bash
npm install -D husky lint-staged commitlint @commitlint/config-conventional
# husky：用于初始化 Git 钩子
# lint-staged：用于在提交前对暂存的文件进行格式化和检查
# commitlint：用于校验提交信息是否符合规范
```

## 初始化

```bash
# 1. 修改 package.json：添加了 "prepare": "husky" 脚本。
# 2. 创建目录：生成了 .husky/ 文件夹。
# 3. 创建示例钩子：默认在 .husky/pre-commit 里写了一个 npm test
# 9版本以上
npx husky init
# 8版本以下
npx husky install
````

## 配置

package.json：

```json
{
  "lint-staged": {
    "*.{js,jsx,vue}": ["eslint --fix"],
    "*.{css,scss,vue}": ["stylelint --fix"]
  }
}
```
commitlint.config.js:

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  // 也可以自定义规则
  rules: {
    // 自定义规则
  }
};
```
## 添加钩子

```bash
# 每次 commit 前都自动执行 lint-staged
npx husky add .husky/pre-commit "npx lint-staged"

# 每次 commit 时都自动校验提交信息是否符合规范
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

## 约定式提交规范

- 提交信息格式：`<type>[scope]: <description>`
- 类型：`feat`（新功能）、`fix`（修复）、`docs`（文档变更）、`style`（代码格式）、`refactor`（代码重构）、`test`（测试）、`chore`（其他变更）
- 示例：`feat(auth): add login feature`

