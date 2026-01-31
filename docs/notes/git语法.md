# git

## 初始化与配置 (起步)

- 配置用户信息（必做，否则提交记录无法追踪）：

```bash
git config --global user.name "Your Name"
git config --global user.email "email@example.com"
```

- 初始化仓库：

```bash
git init
# 克隆远程仓库到本地
git clone <url>
# 只下载（克隆）main 分支
git clone -b main --single-branch <repo-url>
```

- 将本地仓库与远程仓库建立连接

```bash
git remote add <r-github/origin> <git@github.com:Florevia/notes.git/(url)>
```

- 查看当前 git 仓库的远程仓库名

```bash
git remote -v
```

## 日常提交 (核心循环)

工作区 -> 暂存区 -> 本地仓库

- 查看仓库信息

```bash
git status
```

- 添加到暂存区：

```bash
git add .
git add <file>
git add -A
git add --all
```

- 提交到本地仓库：

```bash
git commit -m "feat: 完成登录功能"
# 跳过 git add 步骤，直接提交所有已跟踪文件的修改（对新文件无效）。
git commit -am "fix: 修复bug"
```

## 分支管理 (并行开发)

- 查看分支：

```bash
# 列出本地分支
git branch
# 列出所有分支（含远程）
git branch -a
# 看远程分支列表
git branch -r
# 查看分支详情或上游关系
git branch -vv
# 新建分支
git branch <分支名>

```

- 切换/创建分支：

```bash
# 创建并切换到新分支（旧命令）
git checkout -b feature-xxx
# 推荐，Git 2.23+ 引入的新命令，语义更清晰
git switch -c feature-xxx
git switch master

```

- 合并分支：

```bash
# 将 feature-xxx 分支合并到当前分支
git merge feature-xxx

#
git switch feature-xxx
git rebase main
```

- 删除分支

```bash
git branch -d branchname
# 强制删除
git branch -D branchname
# 删除远程分支
git push （origin） --delete （feature）

```

## 远程同步 (团队协作)

- 拉取代码：

```bash
# 下载远程更新但不合并（安全，可先查看）
git fetch
# 下载并直接合并（fetch + merge）
git pull
# 同步远程分支变化,更新远程列表，修剪掉（prune）那些远程已经不存在的分支引用。
git fetch --prune
```

- 推送代码：

```bash
git push <remote_repo_name> <local_branch_name：remote_branch_name>
# -u（--set-upstream）: 在远程仓库建立分支,两仓库分支创立链接
git push -u <remote_repo_name> <branch_name：remote_branch_name>
# 慎用！ 强制推送，只有在非常确定覆盖远程历史（如自己独占的分支 rebase 后）才使用
git push -f
# 查看提交历史
git log
```

## 后悔药”与高级操作 (进阶)

- git reset
  - --soft 只动版本库，其他不动
  - --mixed 动版本库和暂存区，不动工作区
  - --hard 三个区域都同步回到老版本

- 从暂存区删掉文件，但保留工作区文件

```bash
git re --cached filename
```

- 恢复到之前的版本

```bash
git restore
```

- 删除单个文件

```bash
git rm --cached 文件名
# 删除整个目录
git rm -r --cached 目录名
```

- 修改上一次提交

```bash
git commit --amend
```

- 暂存更改 (Stash)：

```bash
# 场景：开发到一半，突然要修紧急 Bug，但不想提交半成品的代码。
# 把当前修改“藏”起来，工作区变干净
git stash
# 修完 Bug 回来，把藏起来的代码恢复
git stash pop
```

- 撤销与回滚（面试考点）：

```bash
# 撤销最近一次 commit，但保留代码在暂存区（常用于修改提交信息或合并多个 commit）
  git reset --soft HEAD^
  # 危险，彻底回退到上一个版本，丢弃代码
  git reset --hard HEAD^
  # 推荐，生成一个新的 commit 来抵消之前的操作。适用于公共分支，因为它不破坏历史记录
  git revert <commit-id>
```

- 拣选提交 (Cherry-pick)：

```bash
# 把其他分支的某一个特定 commit “复制”到当前分支
git cherry-pick <commit-id>
# 场景：只要修复 Bug 的那个 commit，不要那个分支上的其他功能代码
```
