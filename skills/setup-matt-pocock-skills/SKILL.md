---
name: setup-matt-pocock-skills
description: "为工程技能配置本仓库：issue 跟踪器、分诊标签词汇、领域文档布局。首次使用其他工程技能前运行一次。"
disable-model-invocation: true
---

# 配置 Matt Pocock 的技能

搭好工程技能所假设的“每仓库”配置：

- **Issue 跟踪器**：issue 存在哪里（默认 GitHub；也开箱支持本地 Markdown）
- **分诊标签**：五个标准分诊角色使用的字符串
- **领域文档**：`GLOSSARY.md` 与 ADR 放在哪里，以及读取它们的消费规则

这是提示驱动的技能，不是确定性脚本。先探索、呈现发现、与用户确认，然后才写。

## 流程

### 1. 探索

看当前仓库的起始状态。读已有的一切，不要假设：

- `git remote -v` 与 `.git/config`：这是 GitHub 仓库吗？哪一个？
- 仓库根的 `AGENTS.md` 与 `CLAUDE.md`：存在吗？其中是否已有 `## Agent skills` 一节？
- 仓库根的 `GLOSSARY.md` 与 `GLOSSARY-MAP.md`
- `docs/adr/` 以及任何 `src/*/docs/adr/` 目录
- `docs/agents/`：本技能此前的输出是否已存在？
- `.scratch/`：本地 Markdown issue 约定的迹象
- `triage` 技能是否安装？（与本技能同级的 `triage` 文件夹，或在可用技能里能看到。）这决定 B 节是否运行
- Monorepo 信号：`pnpm-workspace.yaml`、`package.json` 里的 `workspaces` 字段，或 `packages/*` 下各有自己的 `src/`。这些只出现在真正的大型多包仓库；没有这些信号就是单上下文，绝大多数仓库都是这样。

### 2. 呈现发现并提问

总结已有什么、缺什么，然后按顺序过各节。一节一个问题，答完再下一节。

每节先给推荐答案，让用户一个词就能接受。只有当选择真的分叉时才给一句解释；探索已经确定的事就整节跳过（`triage` 未安装时跳过 B 节；没有 monorepo 时跳过 C 节）。

**A 节：Issue 跟踪器。**

> 解释：“issue 跟踪器”是这个仓库的 issue 存放处。`to-tickets`、`triage`、`to-spec` 这类技能会读写它。它们需要知道是调用 `gh issue create`、在 `.scratch/` 下写 Markdown，还是走你描述的其他流程。选你为这个仓库实际跟踪工作的那个地方。

默认姿态：这些技能是为 GitHub 设计的。如果 `git remote` 指向 GitHub，就提议 GitHub；指向 GitLab（`gitlab.com` 或自建主机），就提议 GitLab。否则（或用户偏好），提供：

- **GitHub**：issue 存在仓库的 GitHub Issues（用 `gh` CLI）
- **GitLab**：issue 存在仓库的 GitLab Issues（用 [`glab`](https://gitlab.com/gitlab-org/cli) CLI）
- **本地 Markdown**：issue 作为 `.scratch/<feature>/` 下的文件存在本仓库（适合个人项目或没有远端的仓库）
- **其他**（Jira、Linear 等）：请用户用一段话描述流程；技能会把它记成自由文本

把选择记进 `docs/agents/issue-tracker.md`。GitHub 与 GitLab 模板带一个“把 PR 当作请求入口”的开关，默认**关闭**。保持关闭且不要提起：想要外部 PR 进入分诊队列的用户以后可以在文件里打开。

**B 节：分诊标签词汇。** 如果 `triage` 技能没安装（探索已经告诉你），整节跳过。

如果装了，只问一个问题：

> 是否保留默认分诊标签？（推荐：**是**）

默认值就是五个标准角色，标签字符串等于角色名：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。答**是**就原样写入。只有用户说不（通常是他们的跟踪器已用别的名字，例如用 `bug:triage` 表示 `needs-triage`），才收集覆盖项，让 `triage` 使用既有标签而不是重建重复的。

**C 节：领域文档。** 默认**单上下文**（仓库根一个 `GLOSSARY.md` + `docs/adr/`）。这适合几乎所有仓库，直接写，不用问。

只有探索发现 monorepo 信号时，才提供**多上下文**（根 `GLOSSARY-MAP.md` 指向各上下文的 `GLOSSARY.md`）。然后确认他们要哪种布局。

### 3. 确认并编辑

给用户看草稿：

- 要加到 `CLAUDE.md` / `AGENTS.md` 里的 `## Agent skills` 块（选择规则见第 4 步）
- `docs/agents/issue-tracker.md`、`docs/agents/domain.md`、`docs/agents/triage-labels.md` 的内容（最后一份仅当 `triage` 已安装）

写之前让他们编辑。

### 4. 写入

**选择要编辑的文件：**

- 如果 `CLAUDE.md` 存在，编辑它。
- 否则如果 `AGENTS.md` 存在，编辑它。
- 如果都不存在，问用户要创建哪一个，不要替他们决定。

`CLAUDE.md` 已存在时绝不创建 `AGENTS.md`（反之亦然）；永远编辑已经存在的那个。

如果所选文件里已有 `## Agent skills` 块，就地更新内容，不要追加重复块。不要覆盖用户对周边章节的修改。

块的内容：

```markdown
## Agent skills

### Issue tracker

[issue 跟踪位置的一行摘要]。见 `docs/agents/issue-tracker.md`。

### Triage labels

[标签词汇的一行摘要]。见 `docs/agents/triage-labels.md`。

### Domain docs

[布局的一行摘要：单上下文或多上下文]。见 `docs/agents/domain.md`。
```

只有当 `triage` 已安装且 B 节运行过时，才包含 `### Triage labels` 子块并写 `docs/agents/triage-labels.md`。否则两者都省略。

B 节在 GitHub 或 GitLab 上运行过时，为跟踪器缺少的每个已配置标签创建出来（`gh label create` / `glab label create`）。

然后用本技能文件夹里的种子模板写文档：

- [issue-tracker-github.md](./issue-tracker-github.md)：GitHub issue 跟踪器
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md)：GitLab issue 跟踪器
- [issue-tracker-local.md](./issue-tracker-local.md)：本地 Markdown 跟踪器
- [triage-labels.md](./triage-labels.md)：标签映射（仅当 `triage` 已安装）
- [domain.md](./domain.md)：领域文档消费规则 + 布局

对“其他”跟踪器，按用户描述从零写 `docs/agents/issue-tracker.md`。

### 5. 完成

告诉用户配置完成，以及哪些工程技能以后会读这些文件。说明他们之后可以直接编辑 `docs/agents/*.md`；只有想换跟踪器或从零重来时才需要重跑本技能。
