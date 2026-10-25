#!/usr/bin/env node
// 中文技能包冒烟验证：frontmatter、引用完整性、与英文上游结构对照。
//
// 用法：
//   node scripts/verify-skills-zh.mjs
//   SKILLS_ZH=F:/workplace/skills-zh SKILLS_ZH_UPSTREAM=F:/workplace/mattpocock-skills/skills node scripts/verify-skills-zh.mjs
//
// 退出码：0 = 全部通过；1 = 有失败项（详见输出）。

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const ROOT = process.env.SKILLS_ZH || "F:/workplace/skills-zh";
const UPSTREAM = process.env.SKILLS_ZH_UPSTREAM || "F:/workplace/mattpocock-skills/skills";
const DEPLOYED = process.env.SKILLS_ZH_DEPLOYED || path.join(os.homedir(), ".dsh", "skills");

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

function readFrontmatter(file) {
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) fields[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { fields, body: text.slice(m[0].length) };
}

const countH2 = (s) => (s.match(/^##\s/gm) || []).length;
const countList = (s) => (s.match(/^\s*(?:[-*]|\d+\.)\s/gm) || []).length;
const countCode = (s) => Math.floor((s.match(/```/g) || []).length / 2);

// 上游 name -> 目录 + 自带文件
const upstreamSkills = new Map();
if (fs.existsSync(UPSTREAM)) {
  for (const f of walk(UPSTREAM)) {
    if (path.basename(f) !== "SKILL.md") continue;
    const dir = path.dirname(f);
    const files = walk(dir)
      .filter((x) => path.basename(x) !== "SKILL.md")
      .map((x) => path.relative(dir, x).replace(/\\/g, "/"));
    upstreamSkills.set(path.basename(dir), { dir, files });
  }
}

const failures = [];
const zhNames = new Set();
const rows = [];

for (const name of fs.readdirSync(ROOT).sort()) {
  const dir = path.join(ROOT, name);
  if (!fs.statSync(dir).isDirectory()) continue;
  zhNames.add(name);
  const skillFile = path.join(dir, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    failures.push(`${name}: 缺少 SKILL.md`);
    continue;
  }
  const fm = readFrontmatter(skillFile);
  if (!fm) failures.push(`${name}: frontmatter 缺失或未闭合`);
  else {
    if (!fm.fields.name) failures.push(`${name}: frontmatter 缺 name`);
    if (!fm.fields.description) failures.push(`${name}: frontmatter 缺 description`);
    if (fm.fields.name && fm.fields.name !== name) failures.push(`${name}: name(${fm.fields.name}) 与目录不一致`);
  }

  const up = upstreamSkills.get(name);
  const absentOwn = [];
  const absentDeployed = [];
  if (up) {
    for (const rel of up.files) {
      if (!fs.existsSync(path.join(dir, rel))) absentOwn.push(rel);
      if (!fs.existsSync(path.join(DEPLOYED, name, rel))) absentDeployed.push(rel);
    }
    for (const rel of absentOwn) failures.push(`${name}: 缺自带资源 ${rel}`);
    for (const rel of absentDeployed) failures.push(`${name}: 部署副本缺 ${rel}`);
  } else if (name !== "ui-design") {
    failures.push(`${name}: 英文上游找不到对应技能`);
  }

  // 结构对照（h2/列表/代码块数量必须与上游一致，防止翻译时丢内容）。
  // 例外：LOCALLY_ENHANCED 里的技能是「本地增强版」——在上游基础上融合了别处的规则，
  // 结构本来就会比上游多。这类技能只校验「不丢」：h2/列表/代码块数量不得少于上游。
  const LOCAL_ENHANCEMENTS = {
    grilling: "融合 dsh-grill-me 的 ask_user_question 提问与结构化收尾",
  };
  let structOk = null;
  if (up && fm) {
    const upFm = readFrontmatter(path.join(up.dir, "SKILL.md"));
    const upStats = { h2: countH2(upFm.body), list: countList(upFm.body), code: countCode(upFm.body) };
    const zhStats = { h2: countH2(fm.body), list: countList(fm.body), code: countCode(fm.body) };
    if (LOCAL_ENHANCEMENTS[name]) {
      structOk =
        zhStats.h2 >= upStats.h2 && zhStats.list >= upStats.list && zhStats.code >= upStats.code;
      if (!structOk) {
        failures.push(
          `${name}: 本地增强版反而少于上游（h2 ${upStats.h2}→${zhStats.h2}，列表 ${upStats.list}→${zhStats.list}，代码块 ${upStats.code}→${zhStats.code}）`,
        );
      }
    } else {
      structOk =
        upStats.h2 === zhStats.h2 && upStats.list === zhStats.list && upStats.code === zhStats.code;
      if (!structOk) {
        failures.push(
          `${name}: 结构偏离上游（h2 ${upStats.h2}→${zhStats.h2}，列表 ${upStats.list}→${zhStats.list}，代码块 ${upStats.code}→${zhStats.code}）`,
        );
      }
    }
  }
  rows.push({ name, structOk });
}

if (fs.existsSync(UPSTREAM)) {
  for (const name of upstreamSkills.keys()) {
    if (!zhNames.has(name)) failures.push(`${name}: 上游技能未翻译`);
  }
}

console.log(`中文技能：${zhNames.size}；英文上游：${upstreamSkills.size}`);
console.log(`结构对照通过：${rows.filter((r) => r.structOk).length}/${rows.filter((r) => r.structOk !== null).length}`);
if (failures.length) {
  console.log(`\n失败 ${failures.length} 项：`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("PASS：frontmatter、引用完整性、结构对照全部通过");
