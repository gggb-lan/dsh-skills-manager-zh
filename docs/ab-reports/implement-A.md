# A 组（英文版 implement）原始报告

- 仓库：`F:\workplace\_ab\impl\A`
- 技能：`skills-A/implement/SKILL.md`（英文），依次跳转 `skills-A/tdd`、`skills-A/code-review`
- 结果：2 个 commit（`9223aa9` feat、`ca4cd73` refactor），隐藏验收 17/17

## 工单标题

#1 formatDuration（`issues/0001-format-duration.md`）

## tdd 跳转与切片

直接读 `skills-A/tdd/SKILL.md` + `tests.md`/`mocking.md`。seam = 模块公开导出 `formatDuration`。5 个垂直切片，期望值全部取自工单字面量：

1. 红：`SyntaxError: does not provide an export named 'formatDuration'` → 绿
2. 红：`'48h0m'` != `'2d'` → 绿
3. 红：`''` != `'0s'` → 绿
4. 红：`''` != `'1s500ms'`（同片含 90000→1m30s）→ 绿
5. 红：`Missing expected exception TypeError`（-1/NaN/Infinity/null）→ 绿

## code-review 结论

固定点 `4df1307`，规格源 = 工单。仓库无文档化规范，只用 Fowler 基线。

- Standards：`formatDuration` 硬编码 `86_400_000` 等常量，与文件顶部 `UNIT_MS` 重复（Duplicated Code）；已重构成复用 `UNIT_MS` 的 `FORMAT_UNITS` 表。
- Spec：5 条验收全过，无缺失、无 scope creep。
- 说明：子代理深度用尽，两轴在主上下文顺序执行，已如实标注。

## 无法确定

文件位置（工单只说背景是 parse-duration.js）、小数毫秒、测试文件组织。
