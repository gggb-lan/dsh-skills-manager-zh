# dsh-skills-manager

DSH 设置页 **Skills 管理器**（宿主级 bundle 插件）：系统/用户技能分类展示，用户技能支持启用开关、编辑、删除、新建。随 DSH 启动自动加载，不依赖会话，重启不失效。

## 功能

- 设置页左侧导航新增 **Skills** 入口（自定义火花星图标）
- **系统 Skills**：只读展示（bundled/runtime/custom 来源），无开关/删除
- **用户 Skills**（`~/.dsh/skills`）：启用开关、编辑、新建、删除
- **内置 39 个中文技能**（`skills/` 目录，来自 `mattpocock/skills` 中文化）：随插件分发，可一键安装到用户目录
- 底部诊断行显示扫描层范围

## 内置技能

插件自带 39 个中文技能，放在 `skills/` 下。安装插件后有两种方式让 DSH 用上它们：

```bash
# 方式一：一键安装（只补缺失，不覆盖已有）
node scripts/install-skills.mjs

# 方式二：强制覆盖（技能包升级后用）
node scripts/install-skills.mjs --force

# 只看会做什么，不写文件
node scripts/install-skills.mjs --dry-run
```

也可以通过 `POST /skmg/api` 调用 `installBundled`（同样只补缺失，传 `{force:true}` 覆盖）。

技能装到 `~/.dsh/skills` 后，DSH 在**新会话**启动时自动注入它们的描述：

- **18 个模型可自动触发**：code-review、codebase-design、diagnosing-bugs、domain-modeling、grilling、migrate-to-shoehorn、pr、prototype、research、scaffold-exercises、setup-pre-commit、tdd、ui-design、wizard、writing-for-agents 等
- **23 个需用户显式调用**：implement、to-spec、to-tickets、wayfinder、triage、ask-matt、grill-with-docs、teach 等在 frontmatter 里标了 `disable-model-invocation: true`，这是技能本身的设计（避免被误触发），不是配置问题

## 安装

```bash
# 安装 v0.1.2
dsh plugin --profile web add github:xiaoxianyu-office/dsh-skills-manager#v0.1.2
```

安装后**重启 DSH** 生效。

## 升级

重复 `add` 并指定新 tag，**不要使用 update 选择 Git 引用**：

```bash
dsh plugin --profile web add github:xiaoxianyu-office/dsh-skills-manager#v0.1.2
```

## 卸载

```bash
dsh plugin --profile web remove dsh-skills-manager
```

卸载后重启 DSH：设置页入口、client bundle 路由全部移除，无残留。

## 结构

```
dsh-skills-manager/
├── package.json      # dsh.bundle（组合补丁）+ dsh.client（浏览器双面）声明
├── cordis.patch.yml  # 组合补丁：insert skills-manager 插件行
├── lib/
│   ├── index.js      # host 端：Skills 管理 API，注册 /skmg 路由
│   └── client.js     # client 端：设置页 UI（成品 bundle，无需构建）
├── skills/           # 内置 39 个中文技能（随插件分发）
├── scripts/
│   ├── install-skills.mjs    # 把内置技能同步到 ~/.dsh/skills
│   └── verify-skills-zh.mjs  # 中文技能包冒烟验证
└── docs/
    └── SKILLS-ZH-AB-TEST.md  # 39 个技能的 A/B 验证报告
```

## 技能包验证

管理中文技能包（`skills-zh`）时，先跑一次引用完整性检查，避免设置页里出现的技能引用悬空：

```bash
node scripts/verify-skills-zh.mjs
```

退出码 0 表示 frontmatter、SKILL.md 相对引用、与英文上游的结构对照全部通过。39 个技能的真实 A/B 结果、修复清单与未验证项见 [`docs/SKILLS-ZH-AB-TEST.md`](docs/SKILLS-ZH-AB-TEST.md)。

## 说明

- host 端依赖宿主服务：`skills` / `fs` / `shell` / `sandboxPolicy` / `webServer`
- 写操作使用 `danger-full-access` 策略以管理 `~/.dsh/skills`，写后等待 300ms 让文件 watcher 完成注册表更新
- `/skmg` API 仅接受本机回环请求（源地址 + Host 头双重校验），不要将该端口暴露到局域网/公网
- client bundle 为手写 `__ModuleLoader__` 成品，无 prepare 脚本，不受 pnpm `allowBuilds` 限制
