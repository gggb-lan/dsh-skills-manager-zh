---
name: setup-pre-commit
description: 在当前仓库配置 Husky pre-commit 钩子：lint-staged（Prettier）、类型检查与测试。当用户想加 pre-commit 钩子、配置 Husky、lint-staged，或提交时自动格式化/类型检查/测试时使用。
---

# 配置 Pre-Commit 钩子

## 会配置什么

- **Husky** pre-commit 钩子
- **lint-staged** 对所有暂存文件跑 Prettier
- **Prettier** 配置（缺失时）
- pre-commit 钩子里的 **typecheck** 与 **test** 脚本

## 步骤

### 1. 探测包管理器

检查 `package-lock.json`（npm）、`pnpm-lock.yaml`（pnpm）、`yarn.lock`（yarn）、`bun.lockb`（bun），用存在的那个。不确定时默认 npm。

### 2. 安装依赖

作为 devDependencies 安装：

```
husky lint-staged prettier
```

### 3. 初始化 Husky

```bash
npx husky init
```

这会创建 `.husky/` 目录，并在 package.json 里加 `prepare: "husky"`。

### 4. 创建 `.husky/pre-commit`

写入（Husky v9+ 不需要 shebang）：

```
npx lint-staged
npm run typecheck
npm run test
```

**适配**：把 `npm` 换成探测到的包管理器。如果 package.json 里没有 `typecheck` 或 `test` 脚本，省略对应行并告诉用户。

### 5. 创建 `.lintstagedrc`

```json
{
  "*": "prettier --ignore-unknown --write"
}
```

### 6. 创建 `.prettierrc`（缺失时）

只在没有任何 Prettier 配置时创建。用这些默认值：

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 80,
  "singleQuote": false,
  "trailingComma": "es5",
  "semi": true,
  "arrowParens": "always"
}
```

### 7. 验证

- [ ] `.husky/pre-commit` 存在且可执行
- [ ] `.lintstagedrc` 存在
- [ ] package.json 的 `prepare` 脚本是 `"husky"`
- [ ] prettier 配置存在
- [ ] 跑 `npx lint-staged` 验证可用

### 8. 提交

暂存所有改动/新建文件，用消息提交：`Add pre-commit hooks (husky + lint-staged + prettier)`

这会走一遍新的 pre-commit 钩子：一次很好的冒烟测试。

## 备注

- Husky v9+ 的钩子文件不需要 shebang
- `prettier --ignore-unknown` 会跳过 Prettier 无法解析的文件（图片等）
- pre-commit 先跑 lint-staged（快、只处理暂存），再跑完整 typecheck 与测试
