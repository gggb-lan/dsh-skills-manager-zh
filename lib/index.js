import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const name = "dsh-skills-manager";

export const inject = ["skills", "fs", "shell", "sandboxPolicy", "webServer"];

const SYSTEM_SOURCES = ["bundled", "runtime", "custom"];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLED_SKILLS = path.resolve(__dirname, "..", "skills");

function copyDirSync(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

export function apply(ctx) {
  const fullPolicy = ctx.sandboxPolicy.resolve({ mode: "danger-full-access" });
  let userRoot = null;
  let rootResolved = false;
  let layersCache = null;
  // acquireScope 返回的租约需要保持持有，否则 preset 的 standing 挂载会被回收。
  const scopeLeases = [];

  async function collectScopes() {
    if (layersCache) return layersCache;
    const layers = [{ scope: undefined, label: "global" }];
    try {
      const ap = ctx.get("agentPresets");
      if (ap && typeof ap.list === "function") {
        const presets = await ap.list();
        for (const p of presets) {
          try {
            let key = null;
            // 新版 registry：acquireScope(id) -> { key, [Symbol.asyncDispose] }
            if (typeof ap.acquireScope === "function") {
              const lease = await ap.acquireScope(p.id);
              if (lease) {
                scopeLeases.push(lease);
                key = lease.key;
              }
            } else if (typeof ap.standingKeyFor === "function") {
              // 旧版：直接给 key
              key = await ap.standingKeyFor(p.id);
            }
            if (key) layers.push({ scope: key, label: p.id });
          } catch (e) {
            /* 该 preset 不可挂载则跳过 */
          }
        }
      }
    } catch (e) {
      /* 仅保留全局层 */
    }
    layersCache = layers;
    return layers;
  }

  async function collectAll() {
    const layers = await collectScopes();
    const merged = new Map();
    for (const layer of layers) {
      const items = await ctx.skills.list(layer.scope === undefined ? {} : { scope: layer.scope });
      for (const s of items) {
        if (!merged.has(s.name)) merged.set(s.name, summary(s));
      }
    }
    return { layers, items: [...merged.values()] };
  }

  // 把任意候选路径规范化成「技能根目录」：去掉结尾的 /SKILL.md 或 /<技能名>。
  function normalizeSkillsRoot(p, skillNameHint) {
    if (!p) return null;
    let s = String(p).replace(/\\/g, "/").replace(/\/+$/, "");
    if (s.endsWith("/SKILL.md")) s = s.slice(0, -"/SKILL.md".length);
    const base = s.split("/").pop();
    if (base === "skills") return s;
    if (skillNameHint && base === skillNameHint) s = s.slice(0, -(skillNameHint.length + 1));
    return s;
  }

  async function detectUserRoot() {
    if (!rootResolved) {
      rootResolved = true;
      // 优先级：DSH_HOME 推导（最可靠）→ 从 skills 列表推断 → 问 shell
      try {
        const home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
        const candidate = path.join(home, "skills");
        if (fs.existsSync(candidate)) userRoot = candidate.replace(/\\/g, "/");
      } catch (e) {
        userRoot = null;
      }
      if (userRoot === null) {
        try {
          const { items } = await collectAll();
          const hit = items.find((i) => i.source === "user-dsh" && i.resourcePath);
          if (hit) userRoot = normalizeSkillsRoot(hit.resourcePath, hit.name);
        } catch (e) {
          userRoot = null;
        }
      }
      // 最后兜底：问 shell。
      if (userRoot === null) {
        try {
          const spec = ctx.shell.resolve({ command: "printf '%s' \"${DSH_HOME:-$HOME/.dsh}\"", timeoutMs: 5000 });
          const res = await ctx.shell.run(spec);
          if (res.exitCode === 0 && res.stdout && res.stdout.text) {
            const home = res.stdout.text.trim();
            if (home) userRoot = home + "/skills";
          }
        } catch (e) {
          userRoot = null;
        }
      }
    }
    return userRoot;
  }

  function yamlScalar(v) {
    const s = String(v == null ? "" : v).replace(/\r?\n/g, " ").trim();
    if (s.length === 0) return '""';
    if (!/[:#]/.test(s) && !/^[\s\-?:,.[\]{}#&*!|>'"%@`]/.test(s)) return s;
    return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  }

  function buildFile(skillName, description, whenToUse, enabled, content) {
    const lines = ["---", "name: " + yamlScalar(skillName), "description: " + yamlScalar(description)];
    if (whenToUse && String(whenToUse).trim()) lines.push("whenToUse: " + yamlScalar(whenToUse));
    if (!enabled) {
      lines.push("disable-model-invocation: true");
      lines.push("user-invocable: false");
    }
    lines.push("---", "");
    let body = String(content == null ? "" : content);
    if (!body.endsWith("\n")) body += "\n";
    return lines.join("\n") + body;
  }

  function summary(s) {
    return {
      name: s.name,
      description: s.description,
      whenToUse: s.whenToUse != null ? s.whenToUse : null,
      source: s.source,
      provider: s.provider,
      modelInvocable: !s.invocation || s.invocation.modelInvocable !== false,
      userInvocable: !s.invocation || s.invocation.userInvocable !== false,
      resourcePath: s.resourceBase && s.resourceBase.kind === "directory" ? s.resourceBase.path : null
    };
  }

  function isSystem(source) { return SYSTEM_SOURCES.indexOf(source) !== -1; }

  async function findSkill(skillName) {
    const layers = await collectScopes();
    for (const layer of layers) {
      const d = await ctx.skills.get(String(skillName), layer.scope === undefined ? {} : { scope: layer.scope });
      if (d) return d;
    }
    return undefined;
  }

  function fail(e) { return { ok: false, error: String((e && e.message) || e) }; }
  function q(p) { return String(p).replace(/'/g, "'\\''"); }
  function settle() { return new Promise((r) => setTimeout(r, 300)); }

  async function handle(method, args) {
    try {
      if (method === "list") {
        const { layers, items } = await collectAll();
        return {
          ok: true,
          data: {
            system: items.filter((i) => isSystem(i.source)),
            user: items.filter((i) => !isSystem(i.source)),
            userRoot: await detectUserRoot(),
            debug: { layers: layers.map((l) => l.label), total: items.length }
          }
        };
      }
      if (method === "get") {
        const skillName = args && args.name ? String(args.name) : "";
        const d = await findSkill(skillName);
        if (!d) return { ok: true, data: null };
        return {
          ok: true,
          data: {
            name: d.name,
            description: d.description,
            whenToUse: d.whenToUse != null ? d.whenToUse : null,
            source: d.source,
            provider: d.provider,
            modelInvocable: !d.invocation || d.invocation.modelInvocable !== false,
            userInvocable: !d.invocation || d.invocation.userInvocable !== false,
            path: d.path != null ? d.path : null,
            content: d.content
          }
        };
      }
      if (method === "create") {
        const skillName = String(args && args.name ? args.name : "").trim();
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(skillName)) return { ok: false, error: "名称必须为 kebab-case（小写字母/数字，连字符分隔）" };
        const description = String(args && args.description ? args.description : "").trim();
        if (!description) return { ok: false, error: "描述不能为空" };
        const whenToUse = args && args.whenToUse ? String(args.whenToUse).trim() : "";
        const content = String(args && args.content != null ? args.content : "");
        const root = await detectUserRoot();
        if (!root) return { ok: false, error: "无法定位用户 skills 根目录（~/.dsh/skills）" };
        const { items } = await collectAll();
        if (items.some((i) => i.name === skillName)) return { ok: false, error: "同名 skill 已存在：" + skillName };
        const dir = root + "/" + skillName;
        const mk = ctx.shell.resolve({ command: "mkdir -p -- '" + q(root) + "' '" + q(dir) + "'", timeoutMs: 5000, sandboxPolicy: fullPolicy });
        const mkRes = await ctx.shell.run(mk);
        if (mkRes.exitCode !== 0) return { ok: false, error: "创建目录失败（exit " + mkRes.exitCode + "）" };
        const target = await ctx.fs.resolve(dir + "/SKILL.md");
        await ctx.fs.writeText(target, buildFile(skillName, description, whenToUse, true, content), undefined, undefined, fullPolicy);
        await settle();
        return { ok: true, data: { path: dir + "/SKILL.md" } };
      }
      if (method === "update") {
        const skillName = args && args.name ? String(args.name) : "";
        const d = await findSkill(skillName);
        if (!d) return { ok: false, error: "skill 不存在：" + skillName };
        if (d.source !== "user-dsh") return { ok: false, error: "仅用户级（~/.dsh/skills）skill 可操作：" + skillName };
        const description = String(args && args.description ? args.description : "").trim();
        if (!description) return { ok: false, error: "描述不能为空" };
        const whenToUse = args && args.whenToUse ? String(args.whenToUse).trim() : "";
        const content = String(args && args.content != null ? args.content : "");
        const enabled = !d.invocation || (d.invocation.modelInvocable !== false && d.invocation.userInvocable !== false);
        if (!d.path) return { ok: false, error: "无法定位 skill 文件" };
        const target = await ctx.fs.resolve(d.path);
        await ctx.fs.writeText(target, buildFile(skillName, description, whenToUse, enabled, content), undefined, undefined, fullPolicy);
        await settle();
        return { ok: true, data: { path: d.path } };
      }
      if (method === "setEnabled") {
        const skillName = args && args.name ? String(args.name) : "";
        const enabled = !!(args && args.enabled);
        const d = await findSkill(skillName);
        if (!d) return { ok: false, error: "skill 不存在：" + skillName };
        if (d.source !== "user-dsh") return { ok: false, error: "仅用户级（~/.dsh/skills）skill 可操作：" + skillName };
        if (!d.path) return { ok: false, error: "无法定位 skill 文件" };
        const target = await ctx.fs.resolve(d.path);
        await ctx.fs.writeText(target, buildFile(d.name, d.description, d.whenToUse || "", enabled, d.content), undefined, undefined, fullPolicy);
        await settle();
        return { ok: true, data: { path: d.path } };
      }
      if (method === "delete") {
        const skillName = args && args.name ? String(args.name) : "";
        const d = await findSkill(skillName);
        if (!d) return { ok: false, error: "skill 不存在：" + skillName };
        if (d.source !== "user-dsh") return { ok: false, error: "仅用户级（~/.dsh/skills）skill 可操作：" + skillName };
        if (!d.path) return { ok: false, error: "无法定位 skill 文件" };
        const target = d.path.replace(/\/SKILL\.md$/, "");
        const spec = ctx.shell.resolve({ command: "rm -rf -- '" + q(target) + "'", timeoutMs: 5000, sandboxPolicy: fullPolicy });
        const res = await ctx.shell.run(spec);
        if (res.exitCode !== 0) return { ok: false, error: "删除失败（exit " + res.exitCode + "）" };
        await settle();
        return { ok: true, data: null };
      }
      if (method === "installBundled") {
        const root = await detectUserRoot();
        if (!root) return { ok: false, error: "无法定位用户 skills 根目录（~/.dsh/skills）" };
        if (!fs.existsSync(BUNDLED_SKILLS)) return { ok: false, error: "插件未内置 skills 目录" };
        const force = !!(args && args.force);
        const names = fs
          .readdirSync(BUNDLED_SKILLS, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => e.name);
        let installed = 0;
        let skipped = 0;
        const failed = [];
        for (const n of names) {
          const dst = path.join(root, n);
          const exists = fs.existsSync(path.join(dst, "SKILL.md"));
          if (exists && !force) {
            skipped++;
            continue;
          }
          try {
            copyDirSync(path.join(BUNDLED_SKILLS, n), dst);
            installed++;
          } catch (e) {
            failed.push({ name: n, error: String((e && e.message) || e) });
          }
        }
        await settle();
        return { ok: true, data: { total: names.length, installed, skipped, failed, target: root } };
      }
      return { ok: false, error: "未知方法：" + method };
    } catch (e) {
      return fail(e);
    }
  }

  function trusted(req) {
    const addr = req.socket && req.socket.remoteAddress;
    if (addr !== "127.0.0.1" && addr !== "::1" && addr !== "::ffff:127.0.0.1") return false;
    const raw = String((req.headers && req.headers.host) || "").toLowerCase();
    const name = raw.startsWith("[") ? raw.slice(1, raw.indexOf("]")) : raw.split(":")[0];
    return name === "127.0.0.1" || name === "localhost" || name === "::1";
  }

  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: "/skmg",
    handler: async (req, res) => {
      if (req.method !== "POST") {
        res.writeHead(405);
        res.end();
        return;
      }
      if (!trusted(req)) {
        res.writeHead(403, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "拒绝非本机请求" }));
        return;
      }
      let body = "";
      try {
        for await (const chunk of req) body += chunk;
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: "请求读取失败" }));
        return;
      }
      let payload;
      try {
        payload = JSON.parse(body);
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: "请求体不是合法 JSON" }));
        return;
      }
      const result = await handle(payload && payload.method ? String(payload.method) : "", payload && payload.args);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(result));
    }
  }), "dsh-skills-manager: /skmg/ api route");
}
