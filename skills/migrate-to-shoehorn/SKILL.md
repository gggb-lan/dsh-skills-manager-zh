---
name: migrate-to-shoehorn
description: 把测试文件里的 `as` 类型断言迁移到 @total-typescript/shoehorn。当用户提到 shoehorn、想在测试里替换 `as`、或需要部分测试数据时使用。
---

# 迁移到 Shoehorn

## 为什么用 shoehorn？

`shoehorn` 让你在测试里传部分数据，同时让 TypeScript 满意。它用类型安全的替代品取代 `as` 断言。

**只用于测试代码。** 绝不在生产代码里用 shoehorn。

测试里用 `as` 的问题：

- 训练里就被告知别用
- 必须手动指定目标类型
- 故意写错数据时要双 as（`as unknown as Type`）

## 安装

```bash
npm i @total-typescript/shoehorn
```

## 迁移模式

### 大对象、只需要少数属性

改前：

```ts
type Request = {
  body: { id: string };
  headers: Record<string, string>;
  cookies: Record<string, string>;
  // ...还有 20 个属性
};

it("gets user by id", () => {
  // 只关心 body.id，却要伪造整个 Request
  getUser({
    body: { id: "123" },
    headers: {},
    cookies: {},
    // ...伪造全部 20 个属性
  });
});
```

改后：

```ts
import { fromPartial } from "@total-typescript/shoehorn";

it("gets user by id", () => {
  getUser(
    fromPartial({
      body: { id: "123" },
    }),
  );
});
```

### `as Type` → `fromPartial()`

改前：

```ts
getUser({ body: { id: "123" } } as Request);
```

改后：

```ts
import { fromPartial } from "@total-typescript/shoehorn";

getUser(fromPartial({ body: { id: "123" } }));
```

### `as unknown as Type` → `fromAny()`

改前：

```ts
getUser({ body: { id: 123 } } as unknown as Request); // 故意用错类型
```

改后：

```ts
import { fromAny } from "@total-typescript/shoehorn";

getUser(fromAny({ body: { id: 123 } }));
```

## 什么时候用哪个

| 函数 | 用途 |
| --- | --- |
| `fromPartial()` | 传部分数据且仍能通过类型检查 |
| `fromAny()` | 传故意写错的数据（保留自动补全） |
| `fromExact()` | 强制完整对象（以后再换成 fromPartial） |

## 工作流

1. **收集需求**——问用户：
   - 哪些测试文件的 `as` 断言在制造问题？
   - 是不是大对象、只有少数属性重要？
   - 是否需要为错误测试传故意写错的数据？

2. **安装并迁移**：
   - [ ] 安装：`npm i @total-typescript/shoehorn`
   - [ ] 找带 `as` 断言的测试文件：`grep -r " as [A-Z]" --include="*.test.ts" --include="*.spec.ts"`
   - [ ] `as Type` 换成 `fromPartial()`
   - [ ] `as unknown as Type` 换成 `fromAny()`
   - [ ] 从 `@total-typescript/shoehorn` 加 import
   - [ ] 跑类型检查验证
