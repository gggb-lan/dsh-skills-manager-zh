---
name: setup-ts-deep-modules
description: 把 dependency-cruiser 接进 TypeScript 仓库，让每个 package 都是深模块：实现藏在子目录里，只能通过入口文件访问。用户调用。
disable-model-invocation: true
---

# 配置 TS 深模块

让本仓库的每个 package 都成为**深模块**：大量行为藏在小接口后面。一个 package 的公共表面是它的**入口文件**（package 根目录下的文件），子目录里的一切都是私有的。本技能安装 [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) 与规则，使入口文件成为唯一通道，然后证明规则真的会咬人。

词汇（深模块、接口、接缝、深度）请调用 `codebase-design` 技能，并全程使用它的语言。

## 强制的形状

```
src/packages/
  <name>/
    index.ts        ← 入口（公开）。从外部 import 这个。
    client.ts       ← 另一个入口。一个 package 可以暴露多个。
    lib/            ← 实现：对外隐藏，内部可自由互相 import。
    tests/          ← 就近测试 + fixture（子目录，所以私有）。
```

公共表面是该 package 的**根文件**，不是指定的某个 `index.ts`。按约定实现放 `lib/`、测试放 `tests/`，让每个 package 都长成同样的两个目录。规则本身是通用的：**任何**子目录里的**任何东西**都是私有的，所以你永远不需要为了加目录去改配置。

四条规则，全部 `error`：

1. **入口边界**：package 之外的代码（应用代码或另一个 package）只能 import 该 package 的入口（根文件），绝不碰子目录里的东西。
2. **包内自由**：package 自己的文件之间可以自由 import。
3. **测试走入口**：`<pkg>/tests/` 下的文件可以 import 任何 package 的入口和自己 `tests/` 下的 fixture，但绝不 import 任何 package 的子目录内部（连自己的也不行）。跨 package 的集成测试可以，深 import 不行。
4. **无环**：不允许依赖环。

**要入口，不要 barrel。** 因为公共表面是**每个**根文件，一个 package 可以暴露多个小入口（`index.ts`、`client.ts`、`server.ts`），而不是把所有东西塞进一个巨大的 `index.ts`。把整棵子树重新导出的 barrel 文件不鼓励；入口要小，实现藏在子目录。

分层（哪个 package 可以依赖哪个）是**另一件事**，在配置里留成注释桩，由本仓库自行填写。

## 步骤

### 1. 探测环境

- **包管理器**：`pnpm-lock.yaml` → pnpm，`yarn.lock` → yarn，`bun.lockb` → bun，否则 npm。下面所有命令都用它。
- **packages 根目录**：有 `src/` 就用 `src/packages`，否则 `packages`。如果仓库已有明显不同的约定，与用户确认。
- **现有配置**：检查 `.dependency-cruiser.*`。存在时**不要**覆盖：把四条规则与选项合并进去，并告诉用户你加了什么。

**完成判据：** 包管理器、packages 根目录、现有配置状态都已明确。

### 2. 安装 dependency-cruiser

用探测到的包管理器把它装成 devDependency。

**完成判据：** `dependency-cruiser` 出现在 `devDependencies`。

### 3. 写配置

把 [`dependency-cruiser.config.cjs`](./dependency-cruiser.config.cjs) 复制到仓库根为 `.dependency-cruiser.cjs`。把 `PACKAGES_ROOT` 设为第 1 步探测到的根。规则基于路径深度且与扩展名无关，其他都不用改。

**完成判据：** `.dependency-cruiser.cjs` 存在且 `PACKAGES_ROOT` 正确，四条禁止规则都在。

### 4. 接进检查

- 加 `lint:boundaries` 脚本：`depcruise <packages-root>`（或 `depcruise src`）。
- 把它并入仓库的总检查命令（已经在跑 typecheck 的那个，例如 `check` / `ci` / `validate`）。**不要**改 `tsconfig`，也不要加路径别名。
- 没有总检查脚本时，加 `lint:boundaries` 并告诉用户把它纳入 CI。

**完成判据：** `lint:boundaries` 存在，并且和 typecheck 在同一条命令里运行。

### 5. 搭示例 package

创建并提交 `<packages-root>/example/` 作为“照抄”模板：

- `index.ts` 是入口，导出一个委托给内部文件的函数（让 package 明显是**深**的，不是转发）。
- `lib/impl.ts`：**子目录**里的内部文件，被 `index.ts` import，外部够不到。
- `tests/example.test.ts` **只** import `../index`（入口），对公共函数断言。

告诉用户这是可复制或删除的起始模板。

**完成判据：** 示例 package 存在，通过根入口暴露行为，并把 `impl` 藏在子目录里。

### 6. 证明规则会咬人

这是整个技能的完成判据：一条在违规时不报错的配置毫无价值。

1. 跑 `lint:boundaries`，在干净的示例上必须**通过**。
2. 临时在 `tests/example.test.ts` 加一个深 import（例如 `import { thing } from "../lib/impl"`），再跑一次，必须**失败**并报 `tests-through-entrypoints`。
3. 撤销这个深 import，再跑一次，必须**通过**。

**完成判据：** 你亲眼看到“通过 → 深 import 失败 → 再通过”。如果第 2 步没失败，说明规则没接对，修好再结束。

### 7. 记录约定

在 **packages 文件夹里**写 `README.md`（`<packages-root>/README.md`，和它管理的 packages 放一起），覆盖：`src/packages/<name>/` 布局（根入口、`lib/` 实现、`tests/` 测试）、“只通过 package 的入口（根文件）import”、以及怎么跑 `lint:boundaries`。明确**劝阻 barrel 文件**：暴露多个小入口，而不是用一个 index 重新导出整棵子树。保持在照抄片段加四条规则、每条一段的长度。

然后从仓库的代理指令文件（有 `CLAUDE.md` 用它，否则 `AGENTS.md`，都没有就创建 `AGENTS.md`）加一个**上下文指针**指向它。一行就够，例如 `Packages are deep modules: see [src/packages/README.md](./src/packages/README.md) before adding or importing one.` 这才是让代理发现边界规则、而不是撞上去的原因。

**完成判据：** `<packages-root>/README.md` 存在且劝阻 barrel，仓库的 `CLAUDE.md`/`AGENTS.md` 链接到它。

## 备注

- 配置里的 `$1` 反向引用（dependency-cruiser 的分组匹配）让 package 能访问自己的内部而外部不能。不要把它们摊平成每个 package 一组规则。
- 公有/私有由**深度**决定：package 的根文件是入口，子目录里的一切都私有。约定子目录是 `lib/`（实现）与 `tests/`，但规则不写死它们：任何子目录都私有，所以新目录永远不需要改配置。加入口就是加一个根文件（不要 barrel）。
- packages 是**扁平**的：根下一层直接子项。package 的内部可以任意嵌套，但 package 不能包含另一个 package。
- 用 `.cjs`（不是 `.js`），让配置的 `module.exports` 在 `"type": "module"` 仓库里也能工作。
