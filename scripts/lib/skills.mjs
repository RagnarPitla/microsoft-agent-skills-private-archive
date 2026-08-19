/**
 * Shared skill discovery and parsing.
 *
 * SKILL.md is the single source of truth. Everything under .github/, .cursor/
 * and the top-level agents/openai.yaml is generated from it.
 *
 * Deliberately dependency-free: this repo is cloned and checked by people who
 * have not run `npm install`, and the pre-commit hook must work regardless.
 * The front matter we author is a small, known subset of YAML, so a focused
 * parser is more honest here than pulling in a full YAML engine.
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";

export const ROOT = execSync("git rev-parse --show-toplevel").toString().trim();

export const PROMOTED = ["build", "connect", "review", "operate", "deliver", "learn"];
export const UNPROMOTED = ["misc", "in-progress", "deprecated"];
export const ALL_BUCKETS = [...PROMOTED, ...UNPROMOTED];

/** Bucket one-liners, used to generate bucket README headers. */
export const BUCKET_BLURB = {
  build: "Creating an agent or solution on any Microsoft surface.",
  connect: "Wiring an agent to data, systems and tools: connectors, MCP servers, APIs.",
  review: "Reviewing something that already exists: code, YAML, solutions, architecture, security.",
  operate: "ALM, testing, evaluation, governance, monitoring, cost, incident response.",
  deliver: "The consulting layer: discovery, estimating, requirements, decisions, handoff.",
  learn: "Learning the stack yourself, and teaching it to others.",
  misc: "Kept around but rarely used, not promoted.",
  "in-progress": "Beta: public on purpose, feedback wanted, not shipped in the plugin.",
  deprecated: "No longer used.",
};

/**
 * Parse a `---` delimited front matter block.
 * Supports `key: value`, quoted values, and multi-line folded values, which is
 * everything our SKILL.md files actually use.
 */
export function parseFrontMatter(raw) {
  if (!raw.startsWith("---")) {
    return { data: {}, body: raw };
  }
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw };

  const block = raw.slice(3, end).replace(/^\r?\n/, "");
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");

  const data = {};
  let key = null;
  for (const line of block.split("\n")) {
    if (!line.trim()) continue;
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (m) {
      key = m[1];
      data[key] = stripQuotes(m[2].trim());
    } else if (key && /^\s+/.test(line)) {
      // continuation of a folded value
      data[key] = `${data[key]} ${line.trim()}`.trim();
    }
  }
  return { data, body };
}

function stripQuotes(v) {
  if (v.length > 1 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    return v.slice(1, -1);
  }
  return v;
}

function toBool(v) {
  return v === true || v === "true" || v === "yes";
}

/**
 * Minimal reader for the two-level `agents/openai.yaml` we author beside each
 * SKILL.md. We only ever read interface.display_name, interface.short_description
 * and policy.allow_implicit_invocation.
 */
export function readSkillOpenAiYaml(skillDir) {
  const p = path.join(skillDir, "agents", "openai.yaml");
  if (!existsSync(p)) return null;
  const text = readFileSync(p, "utf8");

  const out = { interface: {}, policy: {}, _raw: text };
  let section = null;
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const top = /^([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (top) {
      section = top[1];
      continue;
    }
    const kv = /^\s+([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (kv && section) {
      const value = stripQuotes(kv[2].trim());
      out[section] = out[section] || {};
      out[section][kv[1]] = value;
    }
  }
  return out;
}

/**
 * Discover every skill in the repo.
 *
 * Accepts an optional `root` so tests can point this at a fixture directory
 * shaped like a repo (a `skills/<bucket>/<name>/SKILL.md` tree) instead of the
 * real one. Production callers never pass it and get the real repo root.
 */
export function loadSkills(root = ROOT) {
  const skills = [];
  const skillsRoot = path.join(root, "skills");
  if (!existsSync(skillsRoot)) return skills;

  for (const bucket of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!bucket.isDirectory()) continue;
    const bucketDir = path.join(skillsRoot, bucket.name);

    for (const entry of readdirSync(bucketDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(bucketDir, entry.name);
      const skillMd = path.join(dir, "SKILL.md");
      if (!existsSync(skillMd)) continue;

      const raw = readFileSync(skillMd, "utf8");
      const { data, body } = parseFrontMatter(raw);
      const openai = readSkillOpenAiYaml(dir);

      skills.push({
        name: data.name || entry.name,
        dirName: entry.name,
        bucket: bucket.name,
        promoted: PROMOTED.includes(bucket.name),
        description: data.description || "",
        userInvoked: toBool(data["disable-model-invocation"]),
        allowImplicit: openai?.policy?.allow_implicit_invocation,
        displayName: openai?.interface?.display_name || null,
        shortDescription: openai?.interface?.short_description || null,
        hasOpenAiYaml: Boolean(openai),
        body: body.trim(),
        dir,
        relDir: path.relative(root, dir),
        skillMdRel: path.relative(root, skillMd),
        frontMatter: data,
      });
    }
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));
  return skills;
}

/** Skills shipped in the Claude plugin and listed in public docs. */
export function promotedSkills(skills) {
  return skills.filter((s) => s.promoted);
}

export const GENERATED_BANNER =
  "Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`.";
