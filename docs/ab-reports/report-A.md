# A 组（英文版 code-review）原始报告

- 仓库：`F:\workplace\_ab\A`
- 技能：`mattpocock-skills/skills/engineering/code-review/SKILL.md`
- 固定点：`main`（04e6069），diff `main...HEAD` = b1689c4
- 完成时间：2026-10-22

## Standards

规范来源只有 `CODING-STANDARDS.md`（无 CONTRIBUTING/AGENTS），另加技能的气味基线（仓库规范优先）。

硬性违规（对照 CODING-STANDARDS.md 逐条）：

1. 规范 1「导出函数必须有 JSDoc」——`lib/skills-api.js:14` 新增导出 `summarizeSkills` 无 JSDoc，同文件 `listSkills` 有。
2. 规范 2「禁止 throw，必须返回 {ok:false,error}」——`lib/routes.js:17` `if (!isLoopback(req)) throw new Error("forbidden")`。同文件 5-14 行旧路由给出正确写法（设 403 后 return）。该 throw 不会变成 403，只会让 async handler 返回 rejected promise。
3. 规范 3「布尔变量用 is/has 前缀」——`lib/skills-api.js:16` `let flag = true`，且从未重新赋值。
4. 规范 4「文件系统遍历必须走 lib/fs-utils.js 的 walkFiles()」——`lib/skills-api.js:25-32` 的 `countFiles` 直接 `fs.readdirSync(dir,{withFileTypes:true})` 手写递归，与 `lib/fs-utils.js:9-14` 的 `walkFiles` 同形。
5. 规范 5「新增路由必须以 /skmg/ 开头」——`lib/routes.js:16` 新增 `router.get("/api/summary", ...)`。

判断性气味（非硬违规）：

- Duplicated Code：`countFiles` 与 `walkFiles` 同一递归形状，应改成 `walkFiles(dir).length`。
- Speculative Generality：`size: count * 1024`（skills-api.js:20）凭空造体积；`enabled: flag` 是恒真占位。
- Mysterious Name：`flag`、`n` 不表意。

## Spec

规格 `specs/skills-summary.md`。6 条发现：

(a) 缺失/部分

1. 需求 5「出错时返回 {ok:false,error}，HTTP 200」完全未实现：routes.js:16-21 无 try/catch，summarizeSkills 或 countFiles 的异常直接外泄。

(b) 实现了但错误

2. 需求 1 端点应为 `GET /skmg/api/skills/summary`，实际 `GET /api/summary`（routes.js:16）。
3. 需求 2「只统计用户级技能（scope:"user-dsh"）」——skills-api.js:15 用 `ctx.skills.list({})`，系统技能会混入；现成 `listSkills(ctx,"user-dsh")` 未复用。
4. 需求 4「非本机请求返回 HTTP 403」——routes.js:17 用 throw，未设 statusCode 403。
5. 需求 3 的 `enabled`（是否启用）恒为 true（skills-api.js:16,20），是字面量不是真实状态。

(c) 范围蔓延

6. `size: count * 1024`（skills-api.js:20）违反非目标「不统计技能体积」。

汇总：Standards 5 条硬性违规 + 3 条气味，最严重为 API 层 throw；Spec 6 条，最严重为端点路径与需求 1 不符，按规格的 URL 根本没有这个接口。
