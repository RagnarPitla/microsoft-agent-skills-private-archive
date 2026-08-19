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

// url -> the files that cite it, so a dead link names its own fix site.
const urls = new Map();
const harvest = (text, rel) => {
  for (const [, raw] of text.matchAll(/(https?:\/\/[^\s"'<>)\]]+)/g)) {
    const u = raw.replace(/[.,;:]+$/, "");
    if (!urls.has(u)) urls.set(u, new Set());
    urls.get(u).add(rel);
  }
};

for (const rel of REGISTRIES) {
  const text = read(rel);
  if (text === null) {
    err(`Missing ${rel}. AGENTS.md requires both registry catalogues.`);
    continue;
  }
  harvest(text, rel);
  checkRegistrySchema(text, rel);
}

// The registry is only useful if its entries are trustworthy, and link-checking
// proves nothing about the fields around the url. A `covers: [learm]` typo would
// silently drop an entry out of every bucket query, so the shape is checked too.
// Deliberately line-based rather than a real YAML parse: the pre-commit hook has
// to run on a fresh clone with no npm install.
function checkRegistrySchema(text, rel) {
  const BUCKETS = new Set([...PROMOTED, ...UNPROMOTED]);
  const VERDICTS = new Set(["route", "wrap", "rebuild"]);
  const PROVENANCE = new Set(["official-microsoft", "microsoft-adjacent", "community"]);

  const lines = text.split("\n");
  if (!lines.some((l) => /^verified_on:\s*\d{4}-\d{2}-\d{2}\s*$/.test(l))) {
    err(`${rel}: missing or malformed \`verified_on: YYYY-MM-DD\`. A registry with no date cannot be re-verified.`);
  }

  // Entries in do_not_link answer a different question and carry different keys.
  const doNotLinkAt = lines.findIndex((l) => /^do_not_link:/.test(l));
  const entries = [];
  lines.forEach((line, i) => {
    if (/^ {2}- name:/.test(line)) entries.push({ start: i, fields: new Map() });
    else if (entries.length) {
      const m = line.match(/^ {4}([a-z_]+):\s*(.*)$/);
      if (m) entries[entries.length - 1].fields.set(m[1], m[2].trim());
    }
    if (/^ {2}- name:/.test(line)) {
      entries[entries.length - 1].fields.set("name", line.split(":").slice(1).join(":").trim());
    }
  });

  for (const e of entries) {
    const linked = doNotLinkAt !== -1 && e.start > doNotLinkAt;
    const where = `${rel}:${e.start + 1} (${e.fields.get("name") || "unnamed"})`;
    const need = linked ? ["url", "reason"] : ["url", "provenance", "description", "covers", "verdict"];
    for (const k of need) {
      if (!e.fields.has(k)) err(`${where}: missing required field \`${k}\`.`);
    }
    if (linked) continue;

    const verdict = e.fields.get("verdict");
    if (verdict && !VERDICTS.has(verdict)) {
      err(`${where}: verdict "${verdict}" is not one of ${[...VERDICTS].join(", ")}.`);
    }
    const prov = e.fields.get("provenance");
    if (prov && !PROVENANCE.has(prov)) {
      err(`${where}: provenance "${prov}" is not one of ${[...PROVENANCE].join(", ")}.`);
    }
    const covers = e.fields.get("covers");
    if (covers) {
      const vals = covers.replace(/[[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
      if (!vals.length) err(`${where}: \`covers\` is empty. Say which bucket it maps to.`);
      for (const v of vals) {
        if (!BUCKETS.has(v)) err(`${where}: covers "${v}" is not a bucket. Expected one of ${[...BUCKETS].join(", ")}.`);
      }
    }
  }
}

// Skills and docs cite documentation directly. Those links rot exactly like
// registry entries do, and a skill that sends a reader to a 404 is worse than
// one that stays silent -- so they are held to the same standard.
for (const s of skills) {
  harvest(read(`${s.relDir}/SKILL.md`) ?? "", `${s.relDir}/SKILL.md`);
  if (PROMOTED.includes(s.bucket)) {
    const d = `docs/${s.bucket}/${s.dirName}.md`;
    harvest(read(d) ?? "", d);
  }
}

// ------------------------------------------------------------- bucket coverage
for (const bucket of ALL_BUCKETS) {
  const dir = path.join(ROOT, "skills", bucket);
  if (!existsSync(dir)) continue;
  const hasSkills = skills.some((s) => s.bucket === bucket);
  const readme = read(`skills/${bucket}/README.md`);
  if (hasSkills && readme === null) err(`Missing skills/${bucket}/README.md.`);
  if (PROMOTED.includes(bucket) && readme) {
    const bucketSkills = skills.filter((s) => s.bucket === bucket);
    const needed = [
      ["User-invoked", bucketSkills.some((s) => s.userInvoked)],
      ["Model-invoked", bucketSkills.some((s) => !s.userInvoked)],
    ];
    for (const [heading, required] of needed) {
      if (required && !readme.includes(heading)) {
        err(
          `skills/${bucket}/README.md is missing a "${heading}" section, but the bucket contains ${heading.toLowerCase()} skill(s).`,
        );
      }
      if (!required && readme.includes(heading)) {
        err(
          `skills/${bucket}/README.md has a "${heading}" section but no ${heading.toLowerCase()} skills. Drop the empty heading.`,
        );
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
// Bounded concurrency: the skill bodies push this well past the registry's
// 20 URLs, and firing all of them at Microsoft Learn at once earns a 429 that
// looks exactly like a dead link.
//
// HEAD is only an optimisation. Plenty of Microsoft hosts answer it with 400,
// 403 or 405 while serving the page perfectly well on GET, so a non-ok HEAD is
// never trusted on its own -- GET is the arbiter. A checker that reports live
// links as dead is worse than no checker, because people learn to ignore it.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

async function verifyLinks() {
  const bad = [];
  const queue = [...urls.keys()];

  const probe = async (u) => {
    let last = "no response";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const head = await fetch(u, {
          method: "HEAD",
          redirect: "follow",
          headers: { "user-agent": UA },
        });
        if (head.ok) return null;

        const get = await fetch(u, {
          method: "GET",
          redirect: "follow",
          headers: { "user-agent": UA },
        });
        if (get.ok) return null;

        last = `HTTP ${get.status}`;
        // A rate-limited or flaky host is not a broken link. Back off and retry.
        if (![429, 503, 504].includes(get.status)) return last;
      } catch (e) {
        last = e.message;
      }
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
    return last;
  };

  const worker = async () => {
    for (let u = queue.pop(); u !== undefined; u = queue.pop()) {
      const fail = await probe(u);
      if (fail) bad.push(`${u} -> ${fail}\n      cited in: ${[...urls.get(u)].join(", ")}`);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return bad;
}

if (checkLinks && urls.size) {
  const bad = await verifyLinks();
  bad.forEach((b) => err(`Dead link: ${b}`));
  console.log(`Link-checked ${urls.size} URL(s) across registries, skills and docs.`);
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
  `Repository validation passed: ${skills.length} skill(s), ${promotedCount} promoted, ${urls.size} URL(s)${checkLinks ? " (link-checked)" : ""}.`,
);
