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
 *
 * Most individual rules are pure functions in scripts/lib/validate-core.mjs,
 * unit tested there against fixtures. This file discovers the real skills and
 * files, calls those rules, and prints the report.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { ROOT, loadSkills, PROMOTED, UNPROMOTED, ALL_BUCKETS } from "./lib/skills.mjs";
import {
  checkDescriptionIsTrigger,
  checkSkillIdentity,
  checkSkillProvenance,
  checkSyncObligations,
  checkDocsPageSections,
  checkBucketReadmeGroups,
  checkConnectorSchema,
  checkRegistrySchema,
  checkProseIsNotSlop,
} from "./lib/validate-core.mjs";

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
  else {
    for (const p of checkDescriptionIsTrigger(s.description, { userInvoked: s.userInvoked })) {
      err(`${s.skillMdRel}: ${p}`);
    }
  }
  for (const p of checkSkillIdentity({ name: s.name, dirName: s.dirName })) {
    err(`${s.skillMdRel}: ${p}`);
  }
  for (const p of checkSkillProvenance(s.frontMatter)) {
    err(`${s.skillMdRel}: ${p}`);
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
  } else if (s.allowImplicit !== "true") {
    // Silence is not a declaration. A missing policy block leaves the decision
    // to whatever each harness defaults to, and makes a diff unreadable - the
    // reviewer cannot tell a deliberate model-invoked skill from an unfinished
    // one. See .agents/invocation.md.
    err(`${s.relDir}: model-invoked skills must state policy.allow_implicit_invocation: true in agents/openai.yaml.`);
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

// docs/README.md is what GitHub Pages publishes as the site index, so it is a
// public surface, not an internal convenience file.
const docsIndex = read("docs/README.md");
if (docsIndex == null) err("Missing docs/README.md - it is the index GitHub Pages publishes.");

for (const s of skills) {
  const docsRel = `docs/${s.bucket}/${s.name}.md`;
  const bucketReadme = read(`skills/${s.bucket}/README.md`);

  const problems = checkSyncObligations(s, {
    rootReadme,
    pluginSkillPaths: pluginSkills,
    bucketReadme,
    docsPageExists: existsSync(path.join(ROOT, docsRel)),
    docsIndex,
  });
  problems.forEach((p) => err(`${s.name}: ${p}`));
}

// docs pages with no surviving skill
const docsRoot = path.join(ROOT, "docs");
// docs/ mirrors the promoted buckets, plus a flat assets dir for README artwork.
// Directories starting with "_" belong to Jekyll (_layouts, _data) and are the
// site chrome, not content, so they are never skill buckets.
const DOCS_NON_BUCKET_DIRS = ["assets"];
if (existsSync(docsRoot)) {
  for (const bucket of readdirSync(docsRoot, { withFileTypes: true })) {
    if (!bucket.isDirectory()) continue;
    if (DOCS_NON_BUCKET_DIRS.includes(bucket.name) || bucket.name.startsWith("_")) continue;
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

// relative paths referenced from the front-page and contributor docs must exist
// on disk. A broken hero image or a dead skill link is visible to every visitor,
// and a dead link in the file contributors are told to read first is worse: the
// README promises that "a registry entry that 404s costs more trust than a
// missing skill", so the repo has to hold itself to that internally too.
{
  const rootDocs = ["README.md", "CLAUDE.md", "CONTRIBUTING.md"];
  for (const f of readdirSync(path.join(ROOT, ".agents"))) {
    if (f.endsWith(".md")) rootDocs.push(`.agents/${f}`);
  }
  // Source skills and the artefacts generated from them. A skill that links to
  // ./references/x.md is only correct if that file travels with it: the emitted
  // copy is what a user actually installs, and it shipped the link without the
  // file. Checking the source alone would not have caught that.
  for (const s of skills) rootDocs.push(`${s.relDir}/SKILL.md`);
  for (const dir of [".github/skills", ".cursor/rules"]) {
    const abs = path.join(ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const e of readdirSync(abs, { withFileTypes: true, recursive: true })) {
      if (e.isFile() && /\.(md|mdc)$/.test(e.name)) {
        rootDocs.push(path.relative(ROOT, path.join(e.parentPath ?? e.path, e.name)));
      }
    }
  }
  for (const doc of rootDocs) {
    const body = read(doc);
    if (!body) continue;
    const base = path.dirname(path.join(ROOT, doc));
    const rel = new Set();
    for (const m of body.matchAll(/(?:src|href)="(\.[^"]+)"/g)) rel.add(m[1]);
    for (const m of body.matchAll(/\]\((\.[^)\s]+)\)/g)) rel.add(m[1]);
    for (const r of rel) {
      const target = r.replace(/[#?].*$/, "");
      if (!existsSync(path.resolve(base, target))) {
        err(`${doc} references "${r}", which does not exist on disk.`);
      }
    }
  }
}

// docs page shape
for (const s of skills.filter((x) => x.promoted)) {
  const docs = read(`docs/${s.bucket}/${s.name}.md`);
  if (!docs) continue;
  for (const p of checkDocsPageSections(docs)) {
    err(`docs/${s.bucket}/${s.name}.md ${p}`);
  }
}

// prose the de-slop skill would reject. Enforced once here rather than restated
// in every SKILL.md, so the rule cannot drift between copies.
for (const s of skills) {
  for (const p of checkProseIsNotSlop(s.body, { where: s.skillMdRel })) err(p);
}
for (const s of skills.filter((x) => x.promoted)) {
  const rel = `docs/${s.bucket}/${s.name}.md`;
  const docs = read(rel);
  if (!docs) continue;
  for (const p of checkProseIsNotSlop(docs, { where: rel })) err(p);
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

// ------------------------------------------------------- install instructions
// .agents/install-block.md says to copy its blocks into README.md verbatim,
// because two differently-worded install instructions is how someone ends up
// running the wrong one. Nothing checked it, so the commands could drift apart
// silently - and a bad install command is the one error every reader hits.
{
  const block = read(".agents/install-block.md");
  const readme = read("README.md");
  if (!block) {
    err(".agents/install-block.md is missing. It is the source of truth for install language.");
  } else if (!readme) {
    err("README.md is missing.");
  } else {
    const commands = [...block.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1].trim());
    if (!commands.length) {
      err(".agents/install-block.md has no command blocks. Install instructions cannot be verified.");
    }
    for (const cmd of commands) {
      if (!readme.includes(cmd)) {
        err(
          `README.md does not carry this install command verbatim from .agents/install-block.md:\n    ${cmd.replace(/\n/g, "\n    ")}`,
        );
      }
    }
  }
}

// ------------------------------------------------------------------- registries
const REGISTRIES = ["registry/microsoft-ecosystem.yaml", "registry/connectors.yaml"];
const ALL_BUCKETS_SET = new Set(ALL_BUCKETS);

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
  const problems = rel.endsWith("connectors.yaml")
    ? checkConnectorSchema(text)
    : checkRegistrySchema(text, ALL_BUCKETS_SET);
  problems.forEach((p) => err(`${rel}: ${p}`));
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

// The READMEs and the contributor guides are read more than anything else here
// -- the root README is the repo's front door and the first thing a visitor
// judges. A rotted link there is the most expensive kind, so they get checked
// too, rather than being trusted because they are prose.
harvest(rootReadme ?? "", "README.md");
for (const bucket of ALL_BUCKETS) {
  const rel = `skills/${bucket}/README.md`;
  harvest(read(rel) ?? "", rel);
}
for (const rel of ["AGENTS.md", "CONTRIBUTING.md"]) {
  harvest(read(rel) ?? "", rel);
}
// Glob rather than list: a new guide added to .agents/ should be link-checked
// without anyone remembering to add it here.
for (const f of existsSync(path.join(ROOT, ".agents")) ? readdirSync(path.join(ROOT, ".agents")) : []) {
  if (f.endsWith(".md")) harvest(read(`.agents/${f}`) ?? "", `.agents/${f}`);
}

// ------------------------------------------------------------- bucket coverage
for (const bucket of ALL_BUCKETS) {
  const dir = path.join(ROOT, "skills", bucket);
  if (!existsSync(dir)) continue;
  const hasSkills = skills.some((s) => s.bucket === bucket);
  const readme = read(`skills/${bucket}/README.md`);
  if (hasSkills && readme === null) err(`Missing skills/${bucket}/README.md.`);
  if (readme) {
    const bucketSkills = skills.filter((s) => s.bucket === bucket);
    const problems = checkBucketReadmeGroups(readme, {
      promoted: PROMOTED.includes(bucket),
      hasUserInvoked: bucketSkills.some((s) => s.userInvoked),
      hasModelInvoked: bucketSkills.some((s) => !s.userInvoked),
    });
    problems.forEach((p) => err(`skills/${bucket}/README.md ${p}`));
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

// Codes that mean "you are a robot", not "this page is gone". LinkedIn answers
// 999 to everything automated; microsoft.com and blogs.microsoft.com answer 403
// while serving fine in a browser. Reporting these as dead links is how a link
// checker gets ignored, and an ignored checker is worse than none - so they are
// reported separately and never fail the run.
const BOT_BLOCKED = new Set([401, 403, 405, 406, 999]);

// This repository's own canonical URL. While the repo is private, GitHub answers
// 404 to the anonymous request this checker makes - which is indistinguishable
// from a typo unless we say so. It resolves itself the moment the repo goes
// public, so it is reported as unverified rather than failing every run until
// then. Any *other* github.com 404 is still a hard failure.
const SELF = "https://github.com/RagnarPitla/microsoft-agent-skills";

async function verifyLinks() {
  const bad = [];
  const blocked = [];
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

        if (BOT_BLOCKED.has(get.status)) return { blocked: `HTTP ${get.status}` };
        if (get.status === 404 && (u === SELF || u.startsWith(`${SELF}/`))) {
          return { blocked: "HTTP 404 - this repo is still private; resolves on publish" };
        }

        last = `HTTP ${get.status}`;
        // A rate-limited or flaky host is not a broken link. Back off and retry.
        // 502 in particular shows up on healthy Microsoft community pages often
        // enough that failing on it would train people to ignore this check.
        if (![429, 500, 502, 503, 504].includes(get.status)) return last;
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
      if (fail && typeof fail === "object") {
        blocked.push(`${u} -> ${fail.blocked}`);
      } else if (fail) {
        bad.push(`${u} -> ${fail}\n      cited in: ${[...urls.get(u)].join(", ")}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return { bad, blocked };
}

if (checkLinks && urls.size) {
  const { bad, blocked } = await verifyLinks();
  bad.forEach((b) => err(`Dead link: ${b}`));
  console.log(`Link-checked ${urls.size} URL(s) across registries, skills and docs.`);
  if (blocked.length) {
    console.log(
      `\n${blocked.length} URL(s) refused an automated request and could not be verified ` +
        `from here. These are almost always live in a browser - check by hand before ` +
        `treating any of them as broken:\n`,
    );
    blocked.forEach((b) => console.log(`  ${b}`));
    console.log("");
  }
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
