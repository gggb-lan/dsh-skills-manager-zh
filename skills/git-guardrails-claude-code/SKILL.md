---
name: git-guardrails-claude-code
description: 配置 Claude Code 钩子，在执行前拦住危险的 git 命令（push、reset --hard、clean、branch -D 等）。当用户想防止破坏性 git 操作、加 git 安全钩子，或在 Claude Code 里拦住 git push/reset 时使用。
---

# 配置 Git 护栏

配置一个 PreToolUse 钩子，在 Claude 执行前拦截并阻止危险的 git 命令。

## 会被拦下的

- `git push`（所有变体，含 `--force`）
- `git reset --hard`
- `git clean -f` / `git clean -fd`
- `git branch -D`
- `git checkout .` / `git restore .`

被拦下时，Claude 会看到一条消息，告诉它没有权限使用这些命令。

## 步骤

### 1. 问范围

问用户：只装**本项目**（`.claude/settings.json`），还是**所有项目**（`~/.claude/settings.json`）？

### 2. 复制钩子脚本

附带脚本在：[scripts/block-dangerous-git.sh](scripts/block-dangerous-git.sh)

按范围复制到目标位置：

- **项目**：`.claude/hooks/block-dangerous-git.sh`
- **全局**：`~/.claude/hooks/block-dangerous-git.sh`

用 `chmod +x` 赋可执行权限。

### 3. 把钩子加进设置

加到对应的设置文件：

**项目**（`.claude/settings.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

**全局**（`~/.claude/settings.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/block-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

设置文件已存在时，把钩子合并进现有的 `hooks.PreToolUse` 数组。不要覆盖其他设置。

### 4. 问定制

问用户是否要增删拦截清单里的模式。相应修改复制过去的脚本。

### 5. 验证

快速测试：

```bash
echo '{"tool_input":{"command":"git push origin main"}}' | <path-to-script>
```

应以退出码 2 结束，并向 stderr 打印 BLOCKED 消息。
