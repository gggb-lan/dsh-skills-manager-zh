# B 组（中文版 diagnosing-bugs）原始报告

- 仓库：`F:\workplace\_ab\bug\B`
- 技能：`skills-zh/diagnosing-bugs/SKILL.md`
- 结果：commit `e384dc4`，根因与 A 组一致

## 阶段 1 回路

一条命令：`npm test`（`test/run.mjs`，2s watchdog）。修复前红：

```text
ok: all tasks resolve
ok: never exceeds limit
FAIL: queue keeps draining after a task rejects
  TIMEOUT 2000ms：任务池卡死，队列里的任务再也没有执行
1 case(s) failed
--- exit code: 1 ---
```

连跑 3 次均 exit 1（2463~2606ms）。沙箱 bash 起不来（EXECUTOR_UNAVAILABLE），命令经 pwsh 执行。

## 阶段 2 最小化（6 个变体 + 量测）

- A `limit=1 [失败, 成功]` RED（只启动失败那个）
- B 砍掉失败 `[成功, 成功]` GREEN
- C 失败放队尾 `[成功, 失败]` GREEN
- D `limit=2 [失败, 成功]` GREEN
- E `limit=1 [失败, 成功, 成功]` RED
- F 同步 throw 替代 async throw RED（否掉"异常逃出 Promise 链"）
- 附加量测：`limit=2` 失败一次后 peak=1（健康应为 2）

## 阶段 3 假设（6 条，5 条被证伪）

H1 失败分支漏做账（确认）；H2 pump 被调但 while 条件为假（否）；H3 失败 promise 被吞（否）；H4 异常逃出 Promise 链（否）；H5 测试脚手架问题（否）；H6 成功路径也漏账（否）。

## 阶段 4 插桩

用 `node:inspector` 断点读闭包，优先级高于日志（技能第 1 工具）：

```text
[DEBUG-d7c2] paused @pump:13 state={"active":0,"queued":1}
[DEBUG-d7c2] paused @(anon):37 state={"active":1,"queued":1}
[DEBUG-d7c2] 实际启动: ["failing"]
```

## 阶段 5 修复 + 回归

新增场景 2「失败后队列继续排空」、场景 4「失败不侵蚀并发额度」，修复前红、修复后绿（4/4）。修复两行：

```js
(error) => {
  active -= 1;
  reject(error);
  pump();
},
```

原始未最小化场景复跑：`[fulfilled, rejected:boom-2, fulfilled, fulfilled, fulfilled]`，completed `[1,3,4,5]`。

## 阶段 6 清理

`tmp/` 探针删除、`grep DEBUG-` 无残留、README 未改、`git status --porcelain` 为空。
