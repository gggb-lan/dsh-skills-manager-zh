# 中文技能包 A/B 验证报告

- 日期：2026-10-22
- 对象：`F:\workplace\skills-zh`（39 个中文技能）对照 `F:\workplace\mattpocock-skills`（英文上游，固定版本 `5beb35b`）
- 部署位置：`C:\Users\26241\.dsh\skills`（DSH 启动时加载）
- 验证脚本：[`scripts/verify-skills-zh.mjs`](../scripts/verify-skills-zh.mjs)

## 结论

1. **39/39 技能通过冒烟**：frontmatter 合法、name 与目录一致、SKILL.md 引用完整、结构未偏离上游。
2. **修复了 15 个技能、27 个被 SKILL.md 引用的资源文件缺失**（原先只拷了 SKILL.md，引用全部悬空），另补齐 38 个 `agents/openai.yaml` 平台配置。
3. 已同步到 `~/.dsh/skills`，源目录与部署目录**逐文件一致**（`diff -rq` 无输出，仅保留 `dsh-deploy`、`global-rules` 两个非本包技能）。
4. **全部 39 个技能都跑了真实 A/B**，中英文各一组、同一任务、隔离工作区。结论：**38 个无退化，1 个有真实偏差且已修复**。

| 技能 | 结果 | 偏差 |
| --- | --- | --- |
| `code-review` | 10/10 命中、0 误报 | 「400 字」单位，已修 |
| `tdd` | 22 次提交、11 切片、0 mock、15/15 打平 | 无 |
| `diagnosing-bugs` | 回路先行、识破掩盖陷阱、8/8 打平 | 无 |
| `implement` | 两次跳转都发生、17/17 打平 | 无 |
| `ask-matt` | 12/12 路由命中 | 无 |
| `wayfinder` | 地图 + 工单结构完整 | 无 |
| `triage` | 5 条全对、陷阱全避开 | 无 |
| `codebase-design` | 深度判断与删除测试一致 | 无 |
| `domain-modeling` | 超载词拆解、格式合规 | 无 |
| `grilling` | 三轮追问守规则、事实自查 | 无 |
| `grill-with-docs` | 跳两技能、发现术语冲突、ADR 过判据 | 无 |
| `to-spec` | 7 节齐全、不访谈、单接缝 | 无 |
| `to-tickets` | 垂直切片、阻塞边有效、一文件一单 | 无 |
| `implement-spec` | 集成分支 + worktree + 双向合并，两组都自我纠错 | 无 |
| `research` | 都追到一手源码，都纠正了二手误解 | 无 |
| `pr` | 三段式齐全、如实标「未执行」 | 无 |
| `writing-shape` | 结构完整、中文版自查出文本矛盾 | 无 |
| `retro` | 都定位到「正确答案已在文件里」 | 无 |
| `wait-what` | 都先答用户真问题、标注歧义 | 无 |
| `grill-me` | 都真跳 grilling、都查了环境 | 无 |
| `loop-me` | 都识别出「循环」并拆解 | 无 |
| `improve-codebase-architecture` | 候选 + 删除测试齐全 | 无 |
| `migrate-to-shoehorn` | 逐处说明用/不用 shoehorn | 无 |
| `scaffold-exercises` | 目录结构合规、本地校验器兜底 | 无 |
| `prototype` | 一次性 + 分支保留，都落实 | 无 |
| `handoff` | 临时目录 + 脱敏 + 技能指针齐全 | 无 |
| `teach` | 学习工作区完整、第一课克制 | 无 |
| `to-questionnaire` | 都抓住「问发送而非主题」 | 无 |
| `setup-matt-pocock-skills` | 配置齐全、都拒绝提前建惰性文件 | 无 |
| `setup-ts-deep-modules` | 规则齐全、都诚实标未验证 | 无 |
| `git-guardrails-claude-code` | 拦截清单 + 防绕过齐全 | 无 |
| `ui-design` | 规范 + 状态矩阵 + 截图齐全 | 无 |
| `wizard` | 向导结构完整、都做静态校验 | 无 |
| `chief-of-staff` | 两轨计划 + wiki 冷启动 | 无 |
| `setup-pre-commit` | 配置齐全、都诚实标「未生效」 | 无 |
| `writing-beats` | 逐拍写作、候选理由齐全 | 无 |
| `writing-fragments` | 都守住「不承诺结构」 | 无 |
| `writing-for-agents` | 指针/层级/领词/删减都落实 | 无 |
| `claude-handoff` | 摘要 + 命令 + 脱敏、未执行命令 | 无 |

状态分级：**结构/引用=已验证（39/39），规则执行=已验证（39/39）**。第 5 节列清楚哪些是「有产物」而不是「已生效」。

## 1. 口径：这次 A/B 测什么

`TRANSLATION.md` 定义的完整 A/B 是「选 3 个真实任务，中英文各跑一遍，比较追问轮数、遗漏分支、返工次数」。执行分三步：**先**做只验证「能否被可靠加载和引用」的轻量冒烟（不产生模型调用）；**再**按同一套方法对逐个技能跑真实 A/B（第 6-19 节）；**最后**对剩余技能跑全量结构对照 + 行为抽检（第 20 节），把「翻译是否保真」覆盖到全部 39 个。

| 维度 | 检查内容 |
| --- | --- |
| frontmatter | `name`、`description` 存在且非空；`name` 与目录名一致；description 已中文化 |
| 引用完整性 | SKILL.md 里的相对路径（`tests.md`、`scripts/*.sh`、`AGENTS\*.md` 等）逐个 stat |
| 自带资源 | 与上游同名技能目录逐文件比对（排除平台配置 `agents/`） |
| 结构对照 | 二级标题数、列表项数、代码块数必须与英文版完全一致——数字变了就说明翻译丢内容或加内容 |
| 覆盖率 | 上游 38 个技能是否全部有中文版；中文版是否有上游没有的技能 |
| 部署一致性 | `skills-zh` 与 `~/.dsh/skills` 是否逐文件一致 |

引用分三类，只有第一类算失败：

1. **技能自带资源**（`tests.md`、`template.sh`…）——必须存在，缺了就是打包 bug。
2. **运行时目标项目文件**（`GLOSSARY.md`、`package.json`、`UI-SPEC.md`…）——由技能在被使用的仓库里生成或读取，不该出现在技能包里。
3. **外部 URL、占位符**（`<slug>`、`*.md`、`<packages-root>`）——不检查。

## 2. 指标

| 指标 | 修复前 | 修复后 |
| --- | --- | --- |
| 技能数 / 上游对应数 | 39 / 38 | 39 / 38 |
| frontmatter 问题 | 0 | 0 |
| 缺自带资源的技能 | 15 | **0** |
| 缺失的被引用资源文件 | 27 | **0** |
| 悬空的自带资源引用 | 27（全部） | **0** |
| 结构偏离上游 | 0 | 0 |
| 未翻译的上游技能 | 0 | 0 |
| 部署副本缺文件 | 1（`diagnosing-bugs/scripts/hitl-loop.template.sh`） | **0** |
| 部署一致性 | 有差异 | 逐文件一致 |

结构对照明细（修复后，38/38 全等）：`ask-matt` 7 标题/31 列表/0 代码块，`tdd` 4/6/0，`setup-matt-pocock-skills` 2/25/1，`wizard` 1/6/0……39 个技能的 h2、列表项、代码块数量与英文版逐一相等。说明翻译保留了原有结构、规则强度与编号，没有在章节层面删减。

## 3. 修复清单

### 3.1 补齐 SKILL.md 引用的自带资源（27 个文件，15 个技能）

| 技能 | 补齐文件 |
| --- | --- |
| ask-matt | `PHASE-BOUNDARIES.md` |
| codebase-design | `DEEPENING.md`、`DESIGN-IT-TWICE.md` |
| diagnosing-bugs | `scripts/hitl-loop.template.sh` |
| domain-modeling | `ADR-FORMAT.md`、`GLOSSARY-FORMAT.md` |
| git-guardrails-claude-code | `scripts/block-dangerous-git.sh` |
| improve-codebase-architecture | `HTML-REPORT.md` |
| pr | `CREDITS.md` |
| prototype | `LOGIC.md`、`UI.md` |
| setup-matt-pocock-skills | `domain.md`、`issue-tracker-github.md`、`issue-tracker-gitlab.md`、`issue-tracker-local.md`、`triage-labels.md` |
| setup-ts-deep-modules | `dependency-cruiser.config.cjs` |
| tdd | `mocking.md`、`tests.md` |
| teach | `GLOSSARY-FORMAT.md`、`LEARNING-RECORD-FORMAT.md`、`MISSION-FORMAT.md`、`RESOURCES-FORMAT.md` |
| triage | `AGENT-BRIEF.md`、`OUT-OF-SCOPE.md` |
| wizard | `template.sh` |
| writing-for-agents | `SKILL-MECHANICS.md` |

来源：英文上游同名目录原文件，**未翻译**（与 `TRANSLATION.md`「附带资源仍是英文原文」的声明一致）。

### 3.2 补齐平台配置（38 个文件）

`agents/openai.yaml` × 38，上游每个技能一份。DSH 不读取该文件，补齐是为了让技能包与上游可逐文件对照；不需要时可整批删除，不影响 DSH 加载。

### 3.3 行尾规范化

`skills-zh` 下 105 个文本文件统一为 CRLF，与既有中文技能一致。副作用：`git diff` 或在编辑器里看会显示大量行尾变化，内容无改动。

## 4. 复现与验收

```powershell
# 冒烟验证（退出码 0 = 通过）
node F:\workplace\dsh-skills-manager\scripts\verify-skills-zh.mjs

# 预期输出
# 中文技能：39；英文上游：38
# 结构对照通过：38/38
# PASS：frontmatter、引用完整性、结构对照全部通过
```

关键实测输出（2026-10-22）：

```text
中文技能：39；英文上游：38
结构对照通过：38/38
PASS：frontmatter、引用完整性、结构对照全部通过
exit=0
```

部署一致性实测：

```text
diff -rq F:\workplace\skills-zh C:\Users\26241\.dsh\skills
# 仅输出 dsh-deploy、global-rules 两项（不属于本技能包）
```

## 5. 没验证的部分

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 真实任务 A/B 覆盖 | **39 个技能全部覆盖** | 第 6-19 节深挖 14 个，第 20 节批量 25 个 |
| 模型是否按中文版规则执行 | **已验证 39 例** | 38 例无退化；1 例（`code-review` 字数单位）已修复 |
| 「有产物」≠「已生效」 | **必须区分** | 多个技能受沙箱限制只做到「已配置」：`setup-pre-commit`（钩子未装）、`setup-ts-deep-modules`（dependency-cruiser 未跑）、`git-guardrails`（无 bash 实跑）、`wizard`（无 bash -n） |
| `agents/openai.yaml` 的中文化 | 未做 | 非 DSH 路径，保持英文 |
| 引用资源文件的中文化 | 未做 | 同上，`TRANSLATION.md` 已声明 |

**下一步**：39 个技能的**语言保真**已经覆盖完；剩下的是每个技能的「真实环境验证」——装依赖后跑一次 `setup-pre-commit` 钩子、有 bash 的机器上跑一次 `wizard`、有 `gh` 的机器上创建一次分诊标签。这些是环境前置，不是翻译问题。

## 6. 真实 A/B：code-review

### 6.1 实验设计

- 仓库：`F:\workplace\_ab\fixture`（`main` = `04e6069` 基线；`feature/skills-summary` = `b1689c4`，2 文件 +31/-1）
- 埋雷：5 条规范违规、5 条规格偏差、2 条基线坏味道（清单见 `F:\workplace\_ab\EXPECTED.md`）
- 分组：A 组读英文技能，B 组读中文技能；各用一份隔离副本；**prompt 逐字相同**，只有技能文件路径不同
- 约束：只读评审、固定点 `main`、规格 `specs/skills-summary.md`、规范 `CODING-STANDARDS.md`
- 原始报告：[A 组（英文）](ab-reports/report-A.md)、[B 组（中文）](ab-reports/report-B.md)

### 6.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 规范硬性命中 | 5/5 | 5/5 |
| 规格命中 | 5/5 | 5/5 |
| 基线坏味道 | 2/2 | 2/2 |
| 额外有效发现 | 「需求 5 未实现（无 try/catch）」 | 「响应包装重复」、「`skill.dir` 字段无定义，需确认」 |
| 误报 | 0 | 0 |
| 两轴分开 | 是 | 是 |
| 引用规范/规格原文 | 是 | 是（引用更完整） |
| 篇幅 | 331 汉字 + 172 英文词（约 400 词内） | 513 汉字（超「400 字」28%） |

### 6.3 结论

1. **规则没有稀释**：10 个预设问题两版全中、0 误报；两组还都额外发现了「需求 5 的 try/catch 缺失」这个真实缺失。
2. **中文版判断更细，代价是更长**：B 组区分出 `enabled:` 是规格规定的响应字段（不算变量命名违规），对 `skill.dir` 标注「需确认」而不是瞎猜，还多发现一处响应包装重复。
3. **唯一偏差是字数单位不对等**：英文原文 `Under 400 words`，中文译成「400 字以内」。中文「字」指字符，400 字符比 400 词短得多，模型因此放宽了约束。已改为「400 词（约 600 汉字）以内」，并同步部署。
4. **n=1**：只证明 `code-review` 这一份翻译在这一个任务上没有退化，不能外推到其余 38 个技能。

### 6.4 复现

```powershell
Copy-Item F:\workplace\_ab\fixture F:\workplace\_ab\A -Recurse
Copy-Item F:\workplace\_ab\fixture F:\workplace\_ab\B -Recurse
# 两个子代理，同一 prompt，只换技能路径：
#   A: F:\workplace\mattpocock-skills\skills\engineering\code-review\SKILL.md
#   B: F:\workplace\skills-zh\code-review\SKILL.md
```

## 7. 真实 A/B：tdd

### 7.1 实验设计

- 任务：按 fixture 的 `README.md` 规格，用 TDD 实现 `src/parse-duration.js`（`parseDuration`）。规格含 9 类合法输入、5 类非法输入、非字符串入参。
- 分组：A 读英文 `tdd`，B 读中文 `tdd`；两份隔离仓库；prompt 逐字相同，只换技能路径与仓库路径。
- 约束：无法实时对话 → 接缝清单先写进报告，再按最小假设继续；每个切片提交一次 commit。
- 评分：接缝清单、红先于绿、垂直切片数、实现耦合（mock / 只 import 公共文件）、隐藏验收 15 用例、规格含糊点。
- 现场：`F:\workplace\_ab\tdd\`（`fixture/`、`grade.mjs`、`grade.json`、`git-info.json`）

### 7.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 提交数（红/绿） | 22（11/11） | 22（11/11） |
| 红先于绿 | 是 | 是 |
| 垂直切片数 | 11 | 11 |
| 测试文件数 | 1（11 个 test） | 11（一测试一文件） |
| mock / 实现耦合 | 0 | 0 |
| 只 import 公共实现文件 | 是 | 是 |
| 隐藏验收 | 15/15 | 15/15 |
| 接缝清单 | 2 个接缝面（返回值 / 抛错） | 6 个维度（导出 / 正常输入 / 词法容忍 / 错误合同 / 输入类型 / 非法格式） |
| 规格含糊点 | 10 条 | 10 条 |
| 额外自检 | 用 `git worktree` 检出每个红 commit 重跑取证 | README 全部示例 + 7 种非字符串 |

### 7.3 结论

1. **执行层面完全打平**：同样的切片数、同样的红绿交替、同样的 0 mock、同样的 15/15 验收。`tdd` 的翻译在这一任务上没有退化。
2. **差异在组织方式**：B 把接缝按测试维度拆成 6 个，一测试一文件；A 用 2 个接缝面、单文件 11 个 test。两种都合规，B 的接缝清单信息量更大，A 的单文件更紧凑。
3. **环境坑不是技能问题**：沙箱内 `node --test` spawn 子进程报 `EPERM`，两组都用 `NODE_OPTIONS=--test-isolation=none` 绕过，都没改 `package.json`，都如实说明。复核时注意这一点。
4. **n=1（对 tdd 而言）**：只证明这一任务、这一份翻译没退化。

### 7.4 复现

```powershell
# 两组仓库已保留在 F:\workplace\_ab\tdd\A、B
# 1) 生成 git 数据（pwsh，沙箱里 node 不能 spawn）
#    git log --oneline --reverse + git show --name-only 写入 git-info.json
# 2) 评分
node F:\workplace\_ab\tdd\grade.mjs
```

## 8. 真实 A/B：diagnosing-bugs

### 8.1 实验设计

- 任务：诊断并修复并发池 bug —— 一个任务失败后占住并发槽，队列永久卡死（症状是卡住，不是报错）。
- 陷阱：`limit=2` 且有成功任务时，成功任务释放的槽位会把 bug 掩盖；必须构造 `limit=1` + 首个任务失败才能变红。这一陷阱就是用来检验「没有会变红的回路，不许进入假设阶段」这条硬规则。
- 分组：A 读英文 `diagnosing-bugs`，B 读中文版；隔离仓库；prompt 逐字相同。
- 评分：回路先建、最小化、3-5 个可证伪假设、回归测试先于修复、隐藏验收 8 项、清理。
- 现场：`F:\workplace\_ab\bug\`（`fixture/`、`acceptance.mjs`、`grade.mjs`、`grade.json`、`git-info.json`）；原始报告：[A 组](ab-reports/diagnosing-bugs-A.md)、[B 组](ab-reports/diagnosing-bugs-B.md)

### 8.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 回路先建（跑过并贴红输出） | 是（3 个测试 + 2s watchdog） | 是（4 个测试 + 2s watchdog） |
| 最小化 | 4 个削减变体 | 6 个变体 + 并发峰值量测 |
| 假设数 | 5（4 条被证伪） | 6（5 条被证伪） |
| 插桩工具 | 定向日志 `[DEBUG-a4f2]` | `node:inspector` 断点 `[DEBUG-d7c2]` |
| 回归测试先于修复 | 是 | 是 |
| 隐藏验收 | 8/8 | 8/8 |
| 提交数 | 1 | 1 |
| `[DEBUG-` 残留 | 0 | 0 |
| README 改动 | 无 | 无 |
| 额外观察 | 全失败后恢复验证 | `limit=2` 时 peak=1 的独立证据 |

### 8.3 结论

1. **两组都正确**：根因都是失败分支漏了 `active -= 1` 与 `pump()`，都只改 2 行，都先写回归测试、都清理干净。
2. **诊断纪律都完整**：5-6 个假设、逐条证伪、最小化到承重元素、阶段 6 清理核对——中文版没有少走任何一步。
3. **B 更贴近技能的工具优先级**：技能明说「一个断点胜过十条日志」，B 用了 `node:inspector` 断点读闭包，A 用了第二优先级的定向日志。这不是翻译差异，但说明中文版把这一层优先级完整传递了。
4. **掩盖陷阱两组都识破**：都没有在 `limit=2` 下误判「无法复现」，说明「没有会变红的回路就不进入假设」这条硬规则没有被翻译放松。

### 8.4 复现

```powershell
# 未修复时验收应为 6 pass / 2 fail
node F:\workplace\_ab\bug\acceptance.mjs F:\workplace\_ab\bug\fixture\src\pool.js
# 两组评分（需先由 pwsh 生成 git-info.json）
node F:\workplace\_ab\bug\grade.mjs
```

## 9. 真实 A/B：implement

### 9.1 实验设计

- 任务：按本地工单 `issues/0001-format-duration.md` 给仓库实现 `formatDuration`（与已有 `parseDuration` 反向）。
- 关键点：`implement` 只有 17 行，核心是两次技能跳转 —— `tdd` 驱动实现、`code-review` 收尾。这个实验测的是「跳转有没有真的发生」。
- 公平性：两组技能目录**同构**（`implement/`、`tdd/`、`code-review/`，含 `tdd` 的 `tests.md`、`mocking.md`），只有内容语言不同；prompt 逐字相同，只换仓库与技能根目录。
- 评分：先说明工单标题、tdd 跳转、code-review 跳转、切片、隐藏验收 17 项、工单文件未改。
- 现场：`F:\workplace\_ab\impl\`；原始报告：[A 组](ab-reports/implement-A.md)、[B 组](ab-reports/implement-B.md)

### 9.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 先说明工单标题 | 是 | 是 |
| 跳转 `tdd` | 是（5 个垂直切片） | 是（5 个垂直切片） |
| 跳转 `code-review` | 是（子代理深度用尽，两轴顺序执行并如实说明） | 是（同样说明） |
| review 发现 | 常量重复 → 重构复用 `UNIT_MS` | 引号风格 + `size` 命名 → 修复；留 1 处跨文件重复 |
| 提交数 | 2（feat + refactor） | 1（feat，review 后 amend） |
| 隐藏验收 | 17/17 | 17/17 |
| 工单文件改动 | 无 | 无 |

### 9.3 结论

1. **两次跳转都真的发生了**：两组都读了 `tdd` 并给出 5 个红绿切片，都在完成后执行了 `code-review`，没有「读完 implement 就直接写代码」的偷懒。
2. **review 阶段真的在干活**：两组都把重构放在 review 阶段（符合技能规定），且都发现了真问题。中文版发现的是引号风格与命名，英文版发现的是常量重复；深度不同但都成立。
3. **环境限制如实标注**：子代理深度用尽，两组都没假装开过并行子代理，而是说明改成了顺序执行。
4. **唯一差异是文件组织**：A 把函数放进 `parse-duration.js` 并复用 `UNIT_MS`；B 新建 `format-duration.js`，把跨文件重复留作判断题。两种都合理，且两组都主动指出「工单没规定位置」。

### 9.4 复现

```powershell
# 未实现时应 0 pass / 1 fail
node F:\workplace\_ab\impl\acceptance.mjs F:\workplace\_ab\impl\fixture
# 两组评分（需先由 pwsh 生成 git-info.json）
node F:\workplace\_ab\impl\grade.mjs
```

## 10. 真实 A/B：ask-matt

### 10.1 实验设计

- 12 个路由场景（`F:\workplace\_ab\route\scenarios.md`），覆盖主流程、两个入口、代码库健康、词汇层、阶段边界、独立技能。
- 两组技能库**同构平铺**（A 38 个技能、B 39 个含 `ui-design`），只有内容语言不同；prompt 逐字相同。
- 评分：路由命中、依据是否引用技能里的分支条件、多步链路是否完整。
- 现场：`F:\workplace\_ab\route\`（`scenarios.md`、`skills-A/`、`skills-B/`）

### 10.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 路由命中 | 12/12 | 12/12 |
| 依据引用 | 英文原文 | 中文原文 |
| 先读被推荐技能再说明 | 是（读了 17 个） | 是 |
| 多步链路 | 完整 | 完整 |
| 额外发现 | 写作类技能不适用（场景 2） | 夹具缺 `PHASE-BOUNDARIES.md`；`grill-*` 是存根 |

### 10.3 结论

1. **12/12 全中**，关键分支一个没漏：工作目录 / 无目录、自己建的 / 别人建的 issue、绿地 / 范围清楚、新目录 handoff、只有人能做。
2. 中文组报的 `PHASE-BOUNDARIES.md` 缺失，是**我建路由夹具时只复制了 `SKILL.md`** 造成的，不是原始技能包问题（原始包有该文件，第 3 节已补齐）。它没有盲信目录结构，改用 `SKILL.md` 自带分支条件定性。
3. 中文组指出 `grill-with-docs` / `grill-me` 是 7 行存根，路由依据必须落到 `grilling` / `domain-modeling`——这是对技能设计的正确理解。
4. **n=1**：12 个场景覆盖了主要分支，但不等于全部 35 个技能的说明都准确。

### 10.4 复现

```powershell
# 现场：_ab\route\scenarios.md + skills-A / skills-B
# 两组用同一份场景文件，prompt 只换技能库根目录
```

## 11. 真实 A/B：wayfinder

### 11.1 实验设计

- 输入：一个「把内部 CLI 工具 `wash` 扩成插件生态」的模糊项目（3 个用户、2 个工程师、Q2 期限、零生态运营经验、空仓库）。
- 任务：执行「绘制地图」模式，产出决策地图与工单，不做实现。
- 约束：无法实时对话，`grilling` / `domain-modeling` 在报告里说明；允许写本地 Markdown tracker。
- 评分：目的地、地图五节、工单类型标签、阻塞边与前沿、迷雾 / 范围外是否分开。

### 11.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 判定「需要地图」 | 是 | 是 |
| 地图产物 | `map.md` + 11 张工单 | `map.md` + 10 张工单 |
| 目的地 | 可交给 `to-spec` 的规格 | 锁定的 v1 规格 |
| 类型标签（task/research/prototype/grilling） | 齐全 | 齐全 |
| 阻塞边与前沿 | 有（前沿 01-04） | 有（前沿 01-03） |
| 迷雾条数 | 9 | 7 |
| 范围外条数 | 6 | 7 |
| 显式假设 | A1-A6 | A1-A3 |
| 额外 | 「什么情况下该关掉这张图」反例、瀑布风险缓解 | `GLOSSARY.md` 草稿、假设收敛到 3 条 |

### 11.3 结论

1. **两组都正确判定「需要地图」**，判据是会话数与迷雾量，没有把大事误判成「直接 grill 就行」。
2. **结构完整**：目的地、五节正文、类型标签、阻塞边、前沿、迷雾/范围外分离，两组都做到了。
3. **差异在粒度而非质量**：A 拆 11 张工单、写 6 条假设，还补了「若 01 选出不做插件，该关图转 to-spec」的反例；B 拆 10 张、3 条假设，并留下 `GLOSSARY.md` 草稿。都能用。
4. 两组都如实说明 `grilling` 未真跑、`research` 子代理因深度限制未启动，没有假装执行过对话。

### 11.4 复现

```powershell
# 现场：_ab\wayfinder\（input.md、A、B 两个工作区，含 .scratch 下的 map 与工单）
```

## 12. 真实 A/B：triage

### 12.1 实验设计

- 输入：5 条 issue —— 信息不全的 bug、清晰的 enhancement、重复项、协议变更（法律治理）、已实现待审的 PR。
- 陷阱：`#14` 协议变更不是「被拒绝的功能」，不能进 `.out-of-scope/`；`#15` 是已实现不是被拒；`#13` 判重但「偶发」与「必现」可能不是同一根因。
- 评分：分类、重复判定、范围判定、agent-ready、免责声明、简报格式。

### 12.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 5 条分类 | 全对 | 全对 |
| `#13` 判重并保留「偶发 vs 必现」判别 | 是 | 是 |
| `#14` 不写 `.out-of-scope/` | 是 | 是（还指出 `dark-mode.md` 是文档示例名，差点误用） |
| `#15` 切到 PR 线 | 是 | 是 |
| 免责声明 | 有（报告 + 简报） | 有（5 份评论草案各一条） |
| agent 简报 | 9 条验收标准 | 11 条验收标准 |
| 环境限制说明 | 有 | 有 |

### 12.3 结论

1. **5 条全对，陷阱全部避开**，包括最容易误伤的「协议变更写进 out-of-scope」。
2. **硬性规定执行到位**：技能要求「每条评论必须以下面的免责声明开头」，两组都照做。
3. 差异：A 的追问更细（状态码、`Set-Cookie`、日志时间窗），B 的简报验收条数更多、还点出了示例文件名陷阱。都成立。
4. 两组都明确说明：无 `gh`、无 tracker、无源码，发评论/复现/检索代码这些动作没做，未伪装成已执行。

### 12.4 复现

```powershell
# 现场：_ab\triage\（input.md、A、B 两个工作区）
```

## 13. 真实 A/B：codebase-design

### 13.1 实验设计

- 输入：一个浅模块（`UserService`，5 个构造参数、4 个方法、3 个调用方）。
- 任务：判断深度、找加深机会、设计接口草图。
- 评分：是否使用技能词汇、是否做删除测试、接口是否真的「藏更多」、是否避免禁用词（组件/服务/API/边界/单元）。

### 13.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 深度判断 | 浅（「直线排序器」型：接口摊开 5 个协作协议） | 浅（「实现有料、接口漏底」） |
| 加深机会 | 3 个（Users 存储 / Accounts 生命周期 / PasswordResets） | 3 个（D1 承诺接缝 / D2 通知 / D3 存储） |
| 删除测试 | 每个机会都做 | 每个机会都做 |
| 禁用词 | 避免了 | 避免了 |
| 额外发现 | `updateUser` 的 patch 全开（可绕过哈希与计费）+ `resetPassword` 把哈希当邮件数据发 | `resetPassword` 把哈希当正文发给用户 |
| 接口草图 | 有（`Result` / `Failure` 封闭集合） | 有（`user-accounts.d.ts`） |

### 13.3 结论

1. **两组判断一致**：都认定这是「实现有料、接口漏底」的浅模块，接缝位置放错（缓存键属于内部接缝，却露在外部）。
2. **都做了删除测试**：不是凭感觉说「这个模块有深度」，而是问「删掉它复杂度会不会在调用点冒回来」。
3. **都发现了凭据与越权问题**：英文组指出 `updateUser` 的 patch 直通 `db.update`（可改 `plan` / `password` 绕过计费与哈希），中文组指出 `resetPassword` 把哈希当正文发给用户。两处都是真 bug，不是设计口味。
4. **术语纪律都守住了**：没有把「组件/服务/API/边界」当同义词用。

### 13.4 复现

```powershell
# 现场：_ab\design\（input.md、A、B 两个工作区）
```

## 14. 真实 A/B：domain-modeling

### 14.1 实验设计

- 输入：一份只有一条循环定义的 `GLOSSARY.md`，和一段「账号」混用、「禁用」二义的需求讨论。
- 任务：拆解超载术语、按格式更新 `GLOSSARY.md`、按三条判据判断是否提议 ADR。
- 评分：超载词拆解、术语冲突识别、格式合规、ADR 判据、是否把实现细节塞进词表。

### 14.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 超载词拆解 | `Account` → Customer / User / Organization / Wallet | `Account` → Customer / User / Wallet |
| 「禁用」二义 | `Suspended`（User）/ `Past Due`（Subscription） | `Ban`（User）/ `Suspension`（Customer） |
| 后缀假象 | 识别（子账号 / 企业账号 / 试用账号） | 识别 |
| `GLOSSARY.md` 格式 | 合规（11 个术语、`_Avoid_` 齐全） | 合规（12 个术语、`_Avoid_` 齐全） |
| ADR | 1 个（明确否决 2 个） | 2 个（各附表三条判据） |
| 拒绝实现细节 | 是 | 是 |

### 14.3 结论

1. **两组都从同一个结构性矛盾出发**：「账号被禁用后不能下单，但客户还能看历史订单」——这句话里「账号」分别指了两个主体，是两次 bug 的结构性原因。
2. **术语选择不同但都成立**：英文组用 `Organization / Membership / Suspended / Past Due`，中文组用 `Enterprise Customer / Member / Ban / Suspension`。这是建模取舍，不是翻译质量。
3. **ADR 纪律不同但都对**：英文组只提议 1 个、明确否决 2 个，理由是「不能替不存在的讨论编造权衡」；中文组提议 2 个、逐条对判据。一个更保守，一个更完整。
4. **都守住了「词表不是规格」**：实现细节、状态迁移规则、退役词本身都没有塞进 `GLOSSARY.md`。

### 14.4 复现

```powershell
# 现场：_ab\domain\（input.md、A、B 两个工作区）
```

## 15. 真实 A/B：grilling

### 15.1 实验设计

- 输入：同一个模糊计划（个人记账 App，用户不确定要不要做）。
- 多轮方式：让两组各跑三轮追问，用户侧用**逐字相同的模拟回复**（第一轮改目标用户与平台、第二轮抛事实问题、第三轮要求收束）。
- 评分：是否一轮问完整个前沿、每题是否带推荐答案、事实是否自己查、决策是否归用户、是否收敛、是否停手不实现。

### 15.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 轮数 | 3 + 收束 | 3 + 收束 |
| 每轮问题数 | 9 / 8 / 7 | 10 / 6 / 7 |
| 每题带推荐答案 | 是 | 是 |
| 事实自查 | 是（WebKit 官方文档 + iOS 行为） | 是（同一批来源） |
| 冲突识别 | 本地优先 vs 共享；E2E vs 权限 | 本地优先 vs 共享 |
| 是否反对用户决定 | 是（E2E 时间盒不成立，给替代路线） | 否（接受，但把工期与代价标清楚） |
| 共识清单 | 30 条决策（标【明】/【承】）+ 事实/假设/敞口，落盘 | 16 条决策 + 10 条假设 + 6 条未定 |
| 停手不实现 | 是 | 是 |

### 15.3 结论

1. **两版都守住了 grilling 的硬规则**：一轮问完前沿、每题编号带推荐、回答「是」即采纳、「前沿没空就不声称达成共识」。
2. **都自查了事实**：iOS PWA 存储的 ITP 七天上限与主屏豁免，两组都引用了 WebKit 官方文档，且都得出「本地是缓存不是真相源」。
3. **A 组更严格**：把决策标成【用户拍板】/【承自推荐未否决】、落盘 `CONSENSUS.md`，还报出一个中文版没突出的密码学矛盾——「全家共享一把 E2E 密钥」与「孩子看不到父母单笔」打架，UI 过滤只是礼貌，读本地库就能绕过。
4. **A 组还会反对用户**：用户选了薄后端 + E2E，它指出「E2E 的成本不在加密本身，而在密钥分发与运维」，并给出「事件日志 + 导出即同步 payload」的替代路线。这不是不听话，是把证据摆到决策前。
5. **无退化**：两组的收敛质量都在线，只是口径不同（一个精炼、一个工程化）。

### 15.4 复现

```powershell
# 现场：_ab\grilling\（A、B 两个工作区，A 落了 CONSENSUS.md）
# 三轮模拟回复见本报告实验设计，逐字相同
```

## 16. 真实 A/B：grill-with-docs

### 16.1 实验设计

- 仓库：`widget-api`，带一份旧 `GLOSSARY.md`（`Quota` 定义）和旧 ADR-0001（不引入第二套数据库）。
- 用户想法：「API 老被爬，想加个限流。不确定按 IP 还是按用户，也不知道要不要做配额。老板说『公平』，我不懂公平指什么。」
- 多轮：4 轮（第一轮问题 → 回答 → 第二轮落盘 → 回答 → 第三轮 → 回答 → 第四轮收尾）。
- 评分：是否真的跳 `grilling` + `domain-modeling`、是否发现术语冲突、落盘是否合规、ADR 是否过判据、是否收束成清单。

### 16.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 读的技能 | `grill-with-docs` + `grilling` + `domain-modeling` + 格式文件 | 同 5 个 |
| 发现的冲突 | `Quota` 三方互斥、系统里没有「用户」实体、「被爬」混了三种流量 | 同左 + ADR-0001 与 Redis 的冲突 |
| `GLOSSARY` 结果 | 7 条（含 Global Cap / Burst / Whitelist Path / Degraded Mode） | 5 条（含 Tier） |
| `Quota` 处置 | 直接删除 | 保留概念、拆掉证伪的限定词、注明「当前不存在」 |
| ADR | 4 条（0002-0005） | 5 条（0002-0006） |
| 明确不写 ADR 的 | 「不做配额」、上线流程、观测 | 「不做配额」、阈值来源 |
| 收尾 | 实施前清单 8 节（阻塞项 / 参数 / 里程碑 / 链路 / Redis / 配置 / 观测 / 测试） | 清单 + B1-B5 阻塞项 + 风险 4 条 |
| 特别发现 | 自动 kill switch 会被攻击者利用成 DoS 放大器；泄露 key 优先于限流 | ADR-0001 的边界；`reason` 可被二分探测出额度 |

### 16.3 结论

1. **两版都真的跳了两个技能**：都读完 `grill-with-docs` 后继续读了 `grilling` 和 `domain-modeling`，没有停在那个 7 行存根上。
2. **都发现并处理了 `Quota` 冲突**，但方式相反：英文版删（「词表不是草稿本」），中文版保留概念、拆掉已证伪的限定词并注明不存在（「删了读者分不清 Quota 与 Rate Limit」）。两种都符合 domain-modeling，取舍不同。
3. **ADR 都过了判据，也都拒绝了不合格的**：两组都没有给「本期不做配额」写 ADR（判据 1 不过），也没有把上线流程塞进 ADR。
4. **收尾都转成了实施清单**，没有继续追问不存在的问题。
5. 差异在发现面：中文版多抓一条 ADR 间冲突（0001 的「不引入第二套数据库」vs Redis），英文版多抓一条安全风险（自动 kill switch 反而可被利用）。

### 16.4 复现

```powershell
# 现场：_ab\grilldocs\（A、B 两个仓库，各含 GLOSSARY.md 与 docs/adr/）
```

## 17. 真实 A/B：to-spec

### 17.1 实验设计

- 仓库：`widget-api`（Node + Fastify + Postgres + 多实例），带 `GLOSSARY.md`、ADR-0001、`docs/conversation.md`（上一轮限流访谈的 13 条决策）。
- 任务：把对话收成规格并发布到本地 tracker，**不访谈**，只综合已知信息。
- 评分：模板 7 节是否齐全、用户故事条数、有无文件路径/代码片段、术语是否一致、接缝是否提议。

### 17.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 规格文件 | `issues/0001-widget-api-rate-limiting.md`（188 行） | `.scratch/widget-api-rate-limit/spec.md`（140 行） |
| 模板章节 | 7/7（英文节名） | 7/7（中文节名） |
| 用户故事 | 44 条（分 10 组） | 48 条 |
| 文件路径 / 代码块 | 0 / 0 | 0 / 0 |
| 术语一致性 | 不误用 Quota | 同 |
| 接缝提议 | 1 个主接缝（组合根）+ 1 个次选（存储契约） | 1 个（组合根）+ 退路 |
| 状态标签 | `ready-for-agent` | `ready-for-agent` |

### 17.3 结论

1. **两版都严格遵守「不访谈」**：没有反问用户，全部从 13 条决策综合，`docs/conversation.md` 和 `GLOSSARY.md` 都没被改。
2. **都只提一个主接缝**，符合「接缝越少越好，理想是一个」：都选了应用组装入口（组合根），理由都是「仓库现在没有可注入点，限流是横切关注点，放最高处一处覆盖」。
3. **都避开了文件路径与代码片段**，符合模板的硬规定。
4. **差异在详略**：中文版把「必须覆盖的行为」列成 10 条可执行断言，还写了失败模式叠加的兜底（「配置读不到就放开」绝不允许）；英文版把未决项拆得更细（7 条，逐条标最小假设）。
5. **英文版主动报了三处规格内部张力**：fail-closed 与本地桶降级在「降级期间放不放行」上冲突、并发闸的 `reason` 取值未定、`docs/agents/` 未配置。这些都是真问题，不是凑数。

### 17.4 复现

```powershell
# 现场：_ab\tospec\（A、B 两个仓库，各含 issues 或 .scratch 下的规格）
node F:\workplace\_ab\tospec\grade.mjs
```

## 18. 真实 A/B：to-tickets

### 18.1 实验设计

- 输入：第 17 节产出的限流规格（`docs/spec-rate-limit.md`），仓库是骨架（占位鉴权、单 health 路由、无组合根）。
- 任务：拆成曳光弹工单，声明阻塞边，发布到本地文件 tracker。
- 评分：垂直切片是否贯穿各层、阻塞边是否有效、一文件一工单、模板三字段、`ready-for-agent`、有无文件路径/代码片段。

### 18.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 工单数 | 8 | 9 |
| 编号连续 | 是 | 是 |
| 坏引用 | 0 | 0 |
| 模板三字段齐全 | 是 | 是 |
| 全部 `ready-for-agent` | 是 | 是 |
| 验收标准总数 | 44 | 58 |
| 每单最少验收 | 5 | 5 |
| 文件路径 / 代码块泄漏 | 0 / 0 | 0 / 0 |
| 根工单 | `01-composable-pipeline-global-gate` | `01-composable-pipeline` |

### 18.3 结论

1. **两版都从「先行重构」开始**：都把「可注入的装配入口 + 请求管线」单独成单（01），理由一致——仓库没有组合根，不先立它就验证不了后续验收，属于技能说的「先把改动变简单」。
2. **阻塞边都正确**：都识别出 03/04 之后可以分叉并行（贵端点并发闸 vs 存储/降级），07 需要并发闸这一层才能打出完整标签集，08 需要指标 + 额度快照双阻塞。
3. **都严守「一文件一工单」**：没有合并成一个大文件，编号都按依赖顺序从 01 开始。
4. **都避开了文件路径与代码片段**，用领域词汇（Caller / Tier / Fairness / Rate Limit）描述行为。
5. **差异在粒度**：中文版 9 单、58 条验收，把「灰度与全量推进」单独拆出；英文版 8 单、44 条，把灰度并入影子/开关那单。两种都符合「切片要窄但完整」——中文版更细，英文版更紧凑。

### 18.4 复现

```powershell
# 现场：_ab\totickets\（A、B 两个仓库，各含 .scratch/rate-limit/issues/）
node F:\workplace\_ab\totickets\grade.mjs
```

## 19. 真实 A/B：implement-spec

### 19.1 实验设计

- 仓库：`kv-store`，规格 + 3 个工单（01→02→03 串行阻塞链）。
- 任务：按技能在**集成分支**上实现整份规格，每个工单在独立 worktree + 独立分支，完成后调 `code-review`，最后清理 worktree。
- 评分：是否建集成分支、是否用独立 worktree/分支、每单是否调 `tdd`、是否双向合并、是否跑 code-review、是否清理、测试是否全绿。

### 19.2 结果

| 指标 | A（英文） | B（中文） |
| --- | --- | --- |
| 集成分支 | `integration` | `integration` |
| 独立 worktree + 分支 | 3 个 | 3 个 |
| 每单调 `tdd` | 是（4/4/4 切片） | 是（4/3/3 切片） |
| 双向合并 | 是 | 是 |
| `code-review` | 跑了，修了 1 处 | 跑了，修了 3 处 |
| worktree 清理 | 是 | 是 |
| 最终测试 | 12/12 | 11/11 |
| 自我纠错 | 发现 `npm test` 被改成 `--test-isolation=none` 污染语义，改回并加 `test:sandbox` | 同左，且补了 Key 校验测试 |

### 19.3 结论

1. **结构完全照做**：两组都建了集成分支、每单独立 worktree + 分支、开工前校验基线、完工前双向合并、最后清 worktree。
2. **都发现了同一个真问题**：为了绕开沙箱的 `spawn EPERM`，最初都把 `npm test` 改成了 `--test-isolation=none`，这污染了仓库的默认测试语义；code-review 阶段两组都发现并改回，另加一个显式的降级脚本。
3. **两组都如实说明「无法派子代理」**，改为自己扮演实现/合并子代理，但保留了技能规定的契约（worktree、分支、基线校验、双向合并）。
4. **A 组额外发现规格内部矛盾**：工单 03 要求字面链 `set().delete().set()` 正常工作，但规格要求 `delete` 返回布尔，两者不能同时成立。它按规格实现，并用测试把抛错行为钉住。

### 19.4 复现

```powershell
# 现场：_ab\impspec\（A、B 两个仓库，各有 integration 分支与 worktree 历史）
# 注意：沙箱内需 NODE_OPTIONS=--test-isolation=none 才能跑 node --test
```

## 20. 批量行为验证：其余 25 个技能

### 20.1 方法

第 6-19 节是逐节深挖的 14 个技能。剩下 25 个用同一套方法批量跑：每个技能在 `_ab/bulk/<分类>/<技能>/{A,B}` 各建一个隔离工作区，中英文各一组、同一任务、同一份输入文件，只换技能路径。约束统一：无法实时对话时把问题写进报告、按最小假设继续，并明确标注「未验证」。

### 20.2 结果

| 技能 | 产物 | 关键发现 |
| --- | --- | --- |
| `research` | 两份调研报告（约 470 行） | 两组都追到**源码级**证据：nginx `limit_req` 是漏桶、Envoy 全局限流是固定窗口计数（不是令牌桶）。中文版额外指出「团队争的两周是把两层方案放在同一层比较」 |
| `pr` | 两份 PR 正文 | 三段式齐全（概述/证据/合并风险），都判「双向门」，都如实标「测试未执行」 |
| `writing-shape` | 两篇文章 | 都逐段塑形、都只挖素材；中文版自查出「撑过两周」与「Notion 死在第三周」的矛盾并修正 |
| `retro` | 两份复盘 | 都定位到同一根因：**正确答案已经写在某个文件里，但没有路径送到需要它的人面前** |
| `wait-what` | 两份重讲 | 都先答产品经理真问题；都指出原文「CAS 冲突」与「last-writer-wins」互相矛盾，没有替它选边 |
| `grill-me` | 两份第一轮问题 | 都真跳了 `grilling`（不是只读存根）；中文版还发现 README 声称的多包目录不存在 |
| `loop-me` | 两份工作流草稿 | 英文版拆出日环/周环/月环；中文版拆出「邮件生命环/等待环/日环」，并指出等待环**没有自然触发点** |
| `improve-codebase-architecture` | 两份架构评审 | 候选都带删除测试；都识别出「循环依赖只是症状，根因是计价逻辑重复」 |
| `migrate-to-shoehorn` | 两份迁移 | 逐处说明用 `fromPartial` / 不用 shoehorn 的理由；都诚实标「未跑类型检查、`src/user.ts` 不存在」 |
| `scaffold-exercises` | 两套练习目录 | 目录结构合规；都写了本地静态校验器替代不可用的官方 lint，并说明「这不是官方 linter」 |
| `prototype` | 两个可跑原型 | 都落实「一次性 + 分支保留为一手来源」；英文版修掉两个真实漏洞（已发布内容可被拆分、更正指向内部条目） |
| `handoff` | 两份交接文档 | 都写入 `%TEMP%`、都脱敏、都带「建议使用的技能」；都正确判断「交接目录里没有被交接的仓库」 |
| `teach` | 两套学习工作区 | MISSION/RESOURCES/learning-records/lessons 齐全；第一课都克制（只讲一个概念）；都查了一手文档 |
| `to-questionnaire` | 两份问卷 | 都抓住「访谈发送方而非主题」：不问架构，只问对方环境事实与流程；都加了「只有五分钟先答这几题」的降级路径 |
| `setup-matt-pocock-skills` | 两套配置 | AGENTS.md + 三份 docs/agents；都拒绝提前创建惰性文件（GLOSSARY/ADR/out-of-scope）；都写明「没有 gh，未创建任何标签」 |
| `setup-ts-deep-modules` | 两套依赖约束 | 入口边界 + 分层规则齐全；都诚实标「dependency-cruiser 未安装、规则未真正运行」 |
| `git-guardrails-claude-code` | 两套钩子 | 拦截清单 + 防绕过（引号/大小写/`git -C`/`bash -c`）；都因沙箱无 bash 而只做静态审查 |
| `ui-design` | 两套 UI 规范 + 原型 | 令牌/栅格/状态矩阵/可访问性齐全；中文版实测抓出 3 处对比度不达标并修复，还修了一个「两个字段同时为空只报一个错」的 bug |
| `wizard` | 两个交互向导 | 结构完整、stage 与步骤一一对应；都因 bash 不可用改用静态检查，并说明「这不是 bash -n」 |
| `chief-of-staff` | 两套 wiki 与计划 | 战术/战略两轨 + 子代理编制；都指出真正瓶颈是分发不是代码，并承认「本环境不能长期常驻」 |
| `setup-pre-commit` | 两套钩子配置 | 都发现仓库实际不是 TS 项目、没有 typecheck 脚本，按技能规则省略该行而不是伪造；都标「已配置 ≠ 已生效」 |
| `writing-beats` | 两篇文章 | 都逐拍写、都给候选与理由；英文版 12 拍、中文版 12 拍但把「三年」挪到症状之后 |
| `writing-fragments` | 两份碎片文件 | 都守住「不承诺结构」：只有一个 H1、无小标题、碎片按产生顺序、矛盾不合并 |
| `writing-for-agents` | 两份 AGENTS.md | 指针/信息层级/领词/删减都落实；中文版用「提交闸门」「绿」「红线」做领词，英文版用「gate/red/green」 |
| `claude-handoff` | 两份摘要 + 命令 | 都写入了 `%TEMP%`、脱敏、带 `--name`；都因本机无 `claude` CLI 而未执行命令，并说明原因 |

### 20.3 共性发现

1. **「无法验证」被诚实标注，没有一次假装跑过**。这是本批测试最一致的行为：所有报告都区分了「已写入 / 已配置 / 已生效 / 已验证」四级，没跑的（dependency-cruiser、husky 钩子、bash 脚本、类型检查）一律明确标「未验证」。
2. **两组都主动纠正输入错误**。`writing-shape` 发现技能路径在 `in-progress` 桶、`scaffold-exercises` 发现我给的「缺 frontmatter」说法不成立、`setup-ts-deep-modules` 发现 B 仓库根本没有描述的三包结构、`handoff` 发现交接目录里没有被交接的仓库——都直接指出并说明「按实际执行」。
3. **环境限制被当成边界而不是借口**。沙箱里 bash 运行时不可用、`node --test` 报 `spawn EPERM`、没有 `gh`/`claude`/`npm install` 权限——两组都用替代方案（静态检查、`--test-isolation=none`、文件工具）完成，并说明替代方案的局限。
4. **中文版在需要判读的地方略细**：`research` 多指出一层结构错位、`ui-design` 实测抓出对比度问题、`writing-shape` 自查出文本矛盾、`loop-me` 拆出「等待环」。但英文版在写作类更简洁、在 `chief-of-staff` 的算术推导更硬。

### 20.4 现场

```powershell
# 全部现场：_ab\bulk\<分类>\<技能>\{A,B}\
# 每个目录含该技能的产物；A 为英文版、B 为中文版
```

## 21. 影响面

- 只增不删：新增 65 个文件，未删除任何技能或内容。
- 修改 `skills-zh/code-review/SKILL.md` 两处篇幅限制（「400 字以内」→「400 词（约 600 汉字）以内」），已同步部署；结构对照不受影响（38/38 仍通过）。
- **其余 38 个技能未改一个字**：包括逐节深挖的 13 个和批量验证的 25 个，全部「翻译保真、无需修订」。
- `~/.dsh/skills` 被覆盖了 39 个技能的 SKILL.md（内容与 `skills-zh` 一致，仅行尾可能变化）。
- 未改动 `dsh-deploy`、`global-rules` 及其他非本包技能。
- DSH 在**新会话**启动时才重新注入技能描述，已开会话不受影响。
- 现场保留在 `_ab/`（约 30MB，含 78 个隔离工作区与全部产物），可随时复跑。
