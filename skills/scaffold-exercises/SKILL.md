---
name: scaffold-exercises
description: 创建能通过 lint 的练习目录结构：分节、题目、解答与讲解。当用户想搭练习骨架、创建练习桩，或建立新的课程分节时使用。
---

# 搭建练习骨架

创建能通过 `pnpm ai-hero-cli internal lint` 的练习目录结构，然后用 `git commit` 提交。

## 目录命名

- **分节**：`exercises/` 下的 `XX-section-name/`（例如 `01-retrieval-skill-building`）
- **练习**：分节下的 `XX.YY-exercise-name/`（例如 `01.03-retrieval-with-bm25`）
- 分节编号 = `XX`，练习编号 = `XX.YY`
- 名字用 dash-case（小写、连字符）

## 练习变体

每个练习至少需要以下子目录之一：

- `problem/` —— 学生工作区，带 TODO
- `solution/` —— 参考实现
- `explainer/` —— 概念材料，无 TODO

搭桩时默认用 `explainer/`，除非计划另有说明。

## 必需文件

每个子目录（`problem/`、`solution/`、`explainer/`）都需要一个 `readme.md`，且：

- **不能为空**（必须有真实内容，哪怕只有一行标题）
- 不能有坏链接

搭桩时创建带标题和描述的最小 readme：

```md
# Exercise Title

Description here
```

子目录里有代码时，还需要 `main.ts`（超过 1 行）。但搭桩阶段只有 readme 也可以。

## 工作流

1. **解析计划**——抽出分节名、练习名、变体类型
2. **创建目录**——对每个路径 `mkdir -p`
3. **创建桩 readme**——每个变体目录一个带标题的 `readme.md`
4. **跑 lint**——`pnpm ai-hero-cli internal lint` 验证
5. **修错**——迭代直到 lint 通过

## Lint 规则摘要

linter（`pnpm ai-hero-cli internal lint`）检查：

- 每个练习有子目录（`problem/`、`solution/`、`explainer/`）
- 至少存在 `problem/`、`explainer/` 或 `explainer.1/` 之一
- 主目录里有 `readme.md` 且非空
- 没有 `.gitkeep` 文件
- 没有 `speaker-notes.md` 文件
- readme 里没有坏链接
- readme 里没有 `pnpm run exercise` 命令
- 每个子目录都需要 `main.ts`，除非只有 readme

## 移动/重命名练习

重新编号或移动练习时：

1. 用 `git mv`（不是 `mv`）重命名目录——保留 git 历史
2. 更新数字前缀以维持顺序
3. 移动后重跑 lint

例子：

```bash
git mv exercises/01-retrieval/01.03-embeddings exercises/01-retrieval/01.04-embeddings
```

## 例子：按计划搭桩

给定计划：

```
Section 05: Memory Skill Building
- 05.01 Introduction to Memory
- 05.02 Short-term Memory (explainer + problem + solution)
- 05.03 Long-term Memory
```

创建：

```bash
mkdir -p exercises/05-memory-skill-building/05.01-introduction-to-memory/explainer
mkdir -p exercises/05-memory-skill-building/05.02-short-term-memory/{explainer,problem,solution}
mkdir -p exercises/05-memory-skill-building/05.03-long-term-memory/explainer
```

然后创建 readme 桩：

```
exercises/05-memory-skill-building/05.01-introduction-to-memory/explainer/readme.md -> "# Introduction to Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/explainer/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/problem/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/solution/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.03-long-term-memory/explainer/readme.md -> "# Long-term Memory"
```
