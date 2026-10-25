# B 组（中文版 code-review）原始报告

- 仓库：`F:\workplace\_ab\B`
- 技能：`skills-zh/code-review/SKILL.md`
- 固定点：`main`（04e6069），diff `main...HEAD` = b1689c4
- 完成时间：2026-10-22

## 规范

依据 [CODING-STANDARDS.md](_ab/B/CODING-STANDARDS.md)（5 条硬性约定）与 Fowler 坏味道基线。

1. **硬性** `lib/skills-api.js:14` `summarizeSkills` 无 JSDoc。规范 1：「导出函数必须有 JSDoc：说明用途、参数、返回值。没有 JSDoc 的导出函数一律视为违规。」同文件 `listSkills`(:4-9) 即合格范例。
2. **硬性** `lib/routes.js:17` `throw new Error("forbidden")`。规范 2：「错误用返回值，不用 throw：API 层（`lib/routes.js`）及以下禁止 `throw`」。同文件 :6-10 是既有正确写法。
3. **硬性** `lib/skills-api.js:25-32` `countFiles` 自行递归 `fs.readdirSync(dir, { withFileTypes: true })`。规范 4：「文件系统遍历必须走 `lib/fs-utils.js` 的 `walkFiles()`」。改成 `walkFiles(skill.dir).length` 即可，顺带删掉 :1-2 两个 import。
4. **硬性** `lib/routes.js:16` 注册 `/api/summary`。规范 5：「新增 API 路由必须以 `/skmg/` 开头，并带本机校验（`isLoopback(req)`）」。
5. **硬性** `lib/skills-api.js:16` `let flag = true;`。规范 3：「布尔变量用 `is` / `has` 前缀：`flag`、`enabled` 这类裸名不允许。」（:20 的 `enabled:` 是规格规定的响应字段名，按字段不按变量判，不计违规。）
6. **判断题** 重复代码：`countFiles`(:25-32) 与 [fs-utils.js](_ab/B/lib/fs-utils.js):9-14 的 `walkFiles` 同构 → 同 3，删掉共用实现。
7. **判断题** 夸夸其谈通用性：`size: count * 1024`(:20) 规格未要求任何体积字段。
8. **判断题** 重复代码：`lib/routes.js:19-20` 与 :12-13 重复 content-type + end 包装，可抽一个响应助手。

## 规格

依据 [specs/skills-summary.md](_ab/B/specs/skills-summary.md)。

1. **需求 1 未满足**：规格「新增 `GET /skmg/api/skills/summary`」，实现是 `GET /api/summary`（`lib/routes.js:16`）。
2. **需求 2 未满足**：规格「只统计 **用户级技能**（`scope: "user-dsh"`），系统技能不出现」，实现 `ctx.skills.list({})`（`lib/skills-api.js:15`）取全部；同文件 `listSkills`(:10-11) 已有 `{ scope: "user-dsh" }` 的正确写法。
3. **需求 3 可疑**：规格要求 `enabled`（是否启用），实现 `let flag = true` 恒真、循环中从不改变（:16、:20），形同占位，无真实启用状态来源。
4. **需求 4 未满足**：规格「非本机请求返回 HTTP 403」，实现 `throw new Error("forbidden")`（`lib/routes.js:17`），不会产生 403。
5. **需求 5 缺失**：规格「出错时返回 `{ ok: false, error }`，HTTP 200」，整个 diff 无 try/catch；`countFiles`(:19) 内 `readdirSync` 抛错会直接冒泡。
6. **范围蔓延**：`size: count * 1024`（:20）非规格字段，且违反非目标「不统计技能体积」。
7. **需确认**：`skill.dir`(:19) — 仓库内没有 `ctx.skills.list` 返回结构的定义，字段名无法验证。
8. **非目标核对**：不改现有 `/skmg/api/skills` — 仅动 import，行为未变，符合；不分页 — 符合。

总结：规范 5 项硬性 + 3 项判断题，最严重是 `lib/routes.js:16-17` 同一 hunk 既违反路由前缀约定又用 `throw` 做本机校验；规格 5 项缺失/偏差 + 1 项范围蔓延 + 1 项待确认，最严重是需求 1、2 —— 端点路径与统计范围都不对，功能对不上规格。
