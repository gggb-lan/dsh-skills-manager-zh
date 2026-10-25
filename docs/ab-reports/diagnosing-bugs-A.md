# A 组（英文版 diagnosing-bugs）原始报告

- 仓库：`F:\workplace\_ab\bug\A`
- 技能：`mattpocock-skills/skills/engineering/diagnosing-bugs/SKILL.md`
- 结果：commit `07e5937`，根因是失败分支漏掉 `active -= 1` 与 `pump()`

## 阶段 1 回路

一条命令：`npm test`（`node test/run.mjs`），2 秒 watchdog 把挂起变成可断言失败。

修复前（红）：

```text
ok - 全部成功的任务都会 resolve
FAIL - 任务失败后，队列里的后续任务继续执行
  STALL: limit=1，失败任务之后排队的两个任务 在 2000ms 内没有完成（池卡死）
FAIL - 混合失败时池不卡死，且并发数不超过 limit
  STALL: 5 个任务混合失败 在 2000ms 内没有完成（池卡死）
2/3 个测试失败
[exit=1]
```

## 阶段 2 复现与最小化

最小场景：`createPool(1)` + 任务 A 抛错 + 任务 B 排队。削减表：去掉失败→SETTLED；去掉排队→无可观测卡死；limit=2→症状被掩盖（active 仍泄漏 1）。

## 阶段 3 假设（5 条，4 条被证伪）

1. 失败分支漏掉 `active -= 1` 与 `pump()`（成立）
2. 失败任务 promise 永不 settle（被 no-queue 变体证伪）
3. `pump()` 本身失效（被纯成功基线证伪）
4. `active` 重复计数 / 任务重复启动（被 `started` 断言证伪）
5. `queue.shift()` 丢项（被 `queue=1` 插桩证伪）

## 阶段 4 插桩

前缀 `[DEBUG-a4f2]`，关键输出：

```text
[DEBUG-a4f2] pump enter active=0 queue=1
[DEBUG-a4f2] start   active=1 queue=0
[DEBUG-a4f2] pump exit  active=1 queue=0
[DEBUG-a4f2] pump enter active=1 queue=1
[DEBUG-a4f2] pump exit  active=1 queue=1
[DEBUG-a4f2] failure active=1 queue=1 (无递减/无 pump)
```

插桩已全部移除。

## 阶段 5 修复 + 回归测试

回归测试写在公共 API 接缝（`createPool(limit).run()`），修复前红、修复后绿（0.86s，连跑 5 次稳定）。

```diff
               (error) => {
+                active -= 1;
                 reject(error);
+                pump();
               },
```

commit `07e5937 fix(pool): 任务失败时释放并发槽并继续调度队列`，message 写明假设 1 成立。

## 阶段 6 清理

原 repro 不再复现、回归测试通过、无 DEBUG 残留、`debug/min-repro.mjs` 已删、README 未改、工作区干净。
