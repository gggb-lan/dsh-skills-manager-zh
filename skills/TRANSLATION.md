# mattpocock/skills 中文化说明

- 上游仓库：https://github.com/mattpocock/skills
- 固定版本：5beb35b040e3de97e54fa9e386d7e42d15c295c2
- 许可证：MIT（允许修改与再分发，保留版权声明）
- 版权：Copyright (c) 2026 Matt Pocock
- 状态：**38 / 38 全部翻译完成**

## 翻译原则

1. 保留原有结构、规则强度与编号。
2. 术语首次出现保留英文，例如“接缝（seam）”“曳光弹（tracer bullet）”。
3. 代码、路径、命令、frontmatter 字段保持原样。
4. 
ame 不变；description 翻译成中文。
5. disable-model-invocation 保留。
6. /xxx 改为 xxx 技能。

## 已完成清单

### engineering（20）

ask-matt、code-review、codebase-design、diagnosing-bugs、domain-modeling、grill-with-docs、implement、implement-spec、improve-codebase-architecture、pr、prototype、research、retro、setup-matt-pocock-skills、tdd、to-spec、to-tickets、triage、wayfinder、wizard

### productivity（7）

grill-me、grilling、handoff、teach、to-questionnaire、wait-what、writing-for-agents

### in-progress（7）

chief-of-staff、claude-handoff、loop-me、setup-ts-deep-modules、writing-beats、writing-fragments、writing-shape

### misc（4）

git-guardrails-claude-code、migrate-to-shoehorn、scaffold-exercises、setup-pre-commit

### 新增（不在上游）

ui-design：UI 规范、组件状态矩阵、三宽度验收。

## 附带资源

已随技能复制到 C:\Users\26241\.dsh\skills：

- ask-matt/PHASE-BOUNDARIES.md
- triage/AGENT-BRIEF.md、OUT-OF-SCOPE.md
- wizard/template.sh
- teach/MISSION-FORMAT.md、RESOURCES-FORMAT.md、LEARNING-RECORD-FORMAT.md
- setup-ts-deep-modules/dependency-cruiser.config.cjs
- git-guardrails-claude-code/scripts/block-dangerous-git.sh
- improve-codebase-architecture/HTML-REPORT.md
- prototype/LOGIC.md、UI.md
- domain-modeling/GLOSSARY-FORMAT.md、ADR-FORMAT.md
- setup-matt-pocock-skills/issue-tracker-*.md、triage-labels.md、domain.md
- tdd/tests.md、mocking.md
- codebase-design/DEEPENING.md、DESIGN-IT-TWICE.md
- writing-for-agents/SKILL-MECHANICS.md

这些引用文件仍是英文原文。

## A/B 对比方法

1. 选 3 个真实任务（一个功能、一个 bug、一次评审），中英文各跑一遍。
2. 记录：追问轮数、遗漏分支、规格完整度、工单粒度、返工次数。
3. 重点看“是否更少来回”，不是“文字是否更顺”。
4. 发现规则被稀释，直接改对应 SKILL.md。

## 部署

`powershell
Copy-Item -Recurse -Force F:\workplace\skills-zh\* C:\Users\26241\.dsh\skills\
`

DSH 在会话开始时注入技能描述，新会话才会生效。
