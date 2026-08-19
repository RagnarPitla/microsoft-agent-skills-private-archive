#!/usr/bin/env node
/**
 * Repository consistency gate.
 *
 * AGENTS.md makes promises about how this repo hangs together. This script is
 * what makes those promises enforceable rather than aspirational: a skill that
 * is added without its README entry, its plugin entry, its docs page or its
 * router entry fails the build instead of quietly rotting.
 *
 * Usage:
 *   node scripts/validate-repo.mjs           structural checks
 *   node scripts/validate-repo.mjs --links   also HEAD every registry URL (slow, needs network)
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { ROOT, loadSkills, PROMOTED, UNPROMOTED, ALL_BUCKETS } from "./lib/skills.mjs";

const checkLinks = process.argv.includes("--links");
const errors = [];
const warnings = [];

const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const read = (rel) => {
  const p = path.join(ROOT, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
};

const skills = loadSkills();
if (!skills.length) err("No skills found under skills/. Expected at least one SKILL.md.");

const ROUTER = "ask-ragnar";

// ---------------------------------------------------------------- skill shape
for (const s of skills) {
  if (!ALL_BUCKETS.includes(s.bucket)) {
    err(`${s.skillMdRel}: unknown bucket "${s.bucket}". Expected one of ${ALL_BUCKETS.join(", ")}.`);
  }
  if (!s.description) err(`${s.skillMdRel}: front matter is missing a description.`);
  if (s.name !== s.dirName) {
    err(`${s.skillMdRel}: front matter name "${s.name}" does not match its folder "${s.dirName}".`);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.dirName)) {
    err(`${s.relDir}: folder name must be kebab-case.`);
  }

  // Invocation model: the two declarations must agree, or a harness will
  // disagree with Claude about who is allowed to reach the skill.
  if (s.userInvoked) {
    if (!s.hasOpenAiYaml) {
      err(`${s.relDir}: user-invoked skills need agents/openai.yaml with policy.allow_implicit_invocation: false.`);
    } else if (s.allowImplicit !== "false") {
      err(`${s.relDir}: disable-model-invocation is set, so agents/openai.yaml must set policy.allow_implicit_invocation: false.`);
    }
  } else if (s.allowImplicit === "false") {
    err(`${s.relDir}: agents/openai.yaml disables implicit invocation, but SKILL.md does not set disable-model-invocation: true.`);
  }

  // Composition rule: nothing may invoke a user-invoked skill.
  const userInvokedNames = skills.filter((x) => x.userInvoked).map((x) => x.name);
  for (const target of userInvokedNames) {
    if (target === s.name) continue;
    const re = new RegExp("invoke the `" + target + "` skill", "i");
    if (re.test(s.body)) {
      err(`${s.skillMdRel}: invokes user-invoked skill "${target}". Extract the shared behaviour into a model-invoked primitive instead (.agents/invocation.md).`);
    }
  }
}

// duplicate names across buckets
const seen = new Map();
for (const s of skills) {
  if (seen.has(s.name)) err(`Duplicate skill name "${s.name}" in ${seen.get(s.name)} and ${s.relDir}.`);
  else seen.set(s.name, s.relDir);
}

// ------------------------------------------------------------ sync obligations
const rootReadme = read("README.md");
if (rootReadme === null) err("Missing README.md.");

const pluginRaw = read(".claude-plugin/plugin.json");
let pluginSkills = null;
if (pluginRaw === null) {
  err("Missing .claude-plugin/plugin.json.");
} else {
  try {
    pluginSkills = JSON.parse(pluginRaw).skills ?? [];
  } catch (e) {
    err(`.claude-plugin/plugin.json is not valid JSON: ${e.message}`);
  }
}

for (const s of skills) {
  const docsRel = `docs/${s.bucket}/${s.name}.md`;
  const skillLink = `skills/${s.bucket}/${s.dirName}/SKILL.md`;
  const bucketReadmeRel = `skills/${s.bucket}/README.md`;
  const bucketReadme = read(bucketReadmeRel);

  if (s.promoted) {
    if (rootReadme && !rootReadme.includes(skillLink)) {
      err(`${s.name}: promoted but not linked from README.md (expected a link to ${skillLink}).`);
    }
    if (pluginSkills && !pluginSkills.some((p) => p === skillLink || p === `./${skillLink}` || p.includes(`/${s.dirName}`))) {
      err(`${s.name}: promoted but missing from .claude-plugin/plugin.json skills array.`);
    }
    if (!existsSync(path.join(ROOT, docsRel))) {
      err(`${s.name}: promoted but has no docs page at ${docsRel}.`);
    }
    if (bucketReadme === null) {
      err(`Missing ${bucketReadmeRel} for promoted bucket "${s.bucket}".`);
    } else if (!bucketReadme.includes(skillLink) && !bucketReadme.includes(`./${s.dirName}/SKILL.md`)) {
      err(`${s.name}: not listed in ${bucketReadmeRel}.`);
    }
  } else {
    // Non-promoted skills must not leak into public surface area.
    if (rootReadme && rootReadme.includes(skillLink)) {
      err(`${s.name}: in non-promoted bucket "${s.bucket}" but linked from README.md.`);
    }
    if (pluginSkills && pluginSkills.some((p) => p.includes(`/${s.dirName}`))) {
      err(`${s.name}: in non-promoted bucket "${s.bucket}" but listed in .claude-plugin/plugin.json.`);
    }
    if (existsSync(path.join(ROOT, docsRel))) {
      err(`${s.name}: in non-promoted bucket "${s.bucket}" but has a docs page at ${docsRel}.`);
    }
  }
}

// docs pages with no surviving skill
const docsRoot = path.join(ROOT, "docs");
if (existsSync(docsRoot)) {
  for (const bucket of readdirSync(docsRoot, { withFileTypes: true })) {
    if (!bucket.isDirectory()) continue;
    if (!PROMOTED.includes(bucket.name)) {
      err(`docs/${bucket.name}/ exists, but "${bucket.name}" is not a promoted bucket.`);
      continue;
    }
    for (const f of readdirSync(path.join(docsRoot, bucket.name))) {
      if (!f.endsWith(".md")) continue;
      const name = f.replace(/\.md$/, "");
      if (!skills.some((s) => s.name === name && s.bucket === bucket.name)) {
        err(`docs/${bucket.name}/${f} has no matching skill. Delete it or restore the skill.`);
      }
    }
  }
}

// docs page shape
for (const s of skills.filter((x) => x.promoted)) {
  const docs = read(`docs/${s.bucket}/${s.name}.md`);
  if (!docs) continue;
  for (const section of ["What it does", "When to reach for it", "Common questions", "It's working if"]) {
    if (!docs.includes(section)) {
      err(`docs/${s.bucket}/${s.name}.md is missing the "${section}" section (.agents/writing-docs.md).`);
    }
  }
}

// ------------------------------------------------------------------- the router
const router = skills.find((s) => s.name === ROUTER);
if (!router) {
  warn(`No "${ROUTER}" router skill yet. AGENTS.md expects one once user-reachable skills exist.`);
} else {
  for (const s of skills) {
    if (s.name === ROUTER || !s.promoted) continue;
    if (!router.body.includes(s.name)) {
      err(`${ROUTER} does not route to "${s.name}". A router that omits a skill is a router that lies.`);
    }
  }
  for (const [, name] of [...router.body.matchAll(/`([a-z0-9-]+)`/g)]) {
    if (name === ROUTER) continue;
    if (name.includes("-") && !skills.some((s) => s.name === name) && !/^(npm|node|git)/.test(name)) {
      warn(`${ROUTER} mentions "${name}", which is not a skill in this repo. Confirm it is not a stale route.`);
    }
  }
}

// ------------------------------------------------------------------- registries
const REGISTRIES = ["registry/microsoft-ecosystem.yaml", "registry/connectors.yaml"];
const urls = new Set();
for (const rel of REGISTRIES) {
  const text = read(rel);
  if (text === null) {
    err(`Missing ${rel}. AGENTS.md requires both registry catalogues.`);
    continue;
  }
  for (const [, u] of text.matchAll(/(https?:\/\/[^\s"'<>)]+)/g)) urls.add(u.replace(/[.,]$/, ""));
}

// ------------------------------------------------------------- bucket coverage
for (const bucket of ALL_BUCKETS) {
  const dir = path.join(ROOT, "skills", bucket);
  if (!existsSync(dir)) continue;
  const hasSkills = skills.some((s) => s.bucket === bucket);
  const readme = read(`skills/${bucket}/README.md`);
  if (hasSkills && readme === null) err(`Missing skills/${bucket}/README.md.`);
  if (PROMOTED.includes(bucket) && readme) {
    for (const heading of ["User-invoked", "Model-invoked"]) {
      if (!readme.includes(heading)) {
        err(`skills/${bucket}/README.md must group entries into "User-invoked" and "Model-invoked".`);
        break;
      }
    }
  }
  if (UNPROMOTED.includes(bucket) && readme) {
    if (readme.includes("User-invoked") || readme.includes("Model-invoked")) {
      err(`skills/${bucket}/README.md is a non-promoted bucket and should use a flat list, not invocation groupings.`);
    }
  }
}

// ------------------------------------------------------------------ link check
async function verifyLinks() {
  const bad = [];
  await Promise.all(
    [...urls].map(async (u) => {
      try {
        let res = await fetch(u, { method: "HEAD", redirect: "follow" });
        if (res.status === 405 || res.status === 403) {
          res = await fetch(u, { method: "GET", redirect: "follow" });
        }
        if (!res.ok) bad.push(`${u} -> HTTP ${res.status}`);
      } catch (e) {
        bad.push(`${u} -> ${e.message}`);
      }
    }),
  );
  return bad;
}

if (checkLinks && urls.size) {
  const bad = await verifyLinks();
  bad.forEach((b) => err(`Dead registry link: ${b}`));
  console.log(`Link-checked ${urls.size} registry URL(s).`);
}

// ---------------------------------------------------------------------- report
if (warnings.length) {
  console.warn(`${warnings.length} warning(s):\n`);
  warnings.forEach((w) => console.warn(`  ${w}`));
  console.warn("");
}

if (errors.length) {
  console.error(`Repository validation FAILED with ${errors.length} error(s):\n`);
  errors.forEach((e) => console.error(`  ${e}`));
  console.error("");
  process.exit(1);
}

const promotedCount = skills.filter((s) => s.promoted).length;
console.log(
  `Repository validation passed: ${skills.length} skill(s), ${promotedCount} promoted, ${urls.size} registry URL(s)${checkLinks ? " (link-checked)" : ""}.`,
);
