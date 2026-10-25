#!/usr/bin/env node
// 把插件自带的技能同步到用户技能目录（默认 ~/.dsh/skills）。
//
// 规则：只补缺失，不覆盖已存在的技能；--force 才覆盖；--dry-run 只看不动。
//
// 用法：
//   node scripts/install-skills.mjs
//   node scripts/install-skills.mjs --force
//   node scripts/install-skills.mjs --dry-run
//   DSH_HOME=/custom node scripts/install-skills.mjs

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const bundled = path.resolve(here, "..", "skills");
const home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
const target = path.join(home, "skills");

const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const dryRun = args.has("--dry-run");

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(bundled)) {
  console.error(`找不到内置技能目录：${bundled}`);
  process.exit(1);
}

const skills = fs.readdirSync(bundled, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
let installed = 0;
let skipped = 0;
let overwritten = 0;

for (const name of skills) {
  const src = path.join(bundled, name);
  const dst = path.join(target, name);
  const exists = fs.existsSync(path.join(dst, "SKILL.md"));
  if (exists && !force) {
    skipped++;
    console.log(`skip    ${name}（已存在，用 --force 覆盖）`);
    continue;
  }
  if (dryRun) {
    console.log(`would   ${name}${exists ? "（覆盖）" : ""}`);
    continue;
  }
  copyDir(src, dst);
  if (exists) overwritten++;
  else installed++;
  console.log(`${exists ? "replace" : "install"} ${name}`);
}

console.log(`\n技能总数 ${skills.length}：新装 ${installed}，覆盖 ${overwritten}，跳过 ${skipped}`);
console.log(`目标目录：${target}`);
if (dryRun) console.log("（dry-run，未写入任何文件）");
