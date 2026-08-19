#!/usr/bin/env node
/**
 * Harness builder.
 *
 * `SKILL.md` is the single source of truth. This script renders every skill into
 * the formats each harness expects, so a skill written once is reachable from
 * GitHub Copilot, Claude Code, Codex and Cursor without being rewritten.
 *
 * Generated, never hand-edited:
 *   .github/prompts/<name>.prompt.md            user-invoked, Copilot slash commands
 *   .github/chatmodes/<name>.chatmode.md        user-invoked, Copilot chat modes
 *   .github/instructions/<name>.instructions.md model-invoked, Copilot instructions
 *   .cursor/rules/<name>.mdc                    every skill, Cursor rules
 *   agents/openai.yaml                          aggregate Codex manifest
 *   skills/index.json                           harness-neutral manifest, any tool
 *
 * Usage:
 *   node scripts/build-harnesses.mjs            write the artefacts
 *   node scripts/build-harnesses.mjs --check    fail if anything on disk is stale
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import path from "node:path";
import { ROOT, loadSkills, GENERATED_BANNER } from "./lib/skills.mjs";

const check = process.argv.includes("--check");
const skills = loadSkills();

/** Files we intend to exist, as relative path to content. */
const artefacts = new Map();

function yamlString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// A SKILL.md links relatively to its own location: ./references/x.md, or
// ../../../registry/y.yaml. Emitting the body verbatim to a different depth
// silently breaks every one of those links. .cursor/rules/<name>.mdc is a flat
// file, so ask-ragnar's registry links pointed three levels above the repo and
// structured-interview's reference pointed at a sibling that was never there.
// Re-anchor each link: resolve against the source directory, then re-relativize
// against wherever the artefact actually lands. Links to files copied alongside
// the artefact are left alone.
function reanchorLinks(body, srcRelDir, artefactRel, copiedAlongside = new Set()) {
  const srcAbs = path.join(ROOT, srcRelDir);
  const outDir = path.dirname(path.join(ROOT, artefactRel));
  const rewrite = (link) => {
    const [target, suffix = ""] = link.split(/(?=[#?])/);
    if (copiedAlongside.has(target.replace(/^\.\//, ""))) return link;
    const abs = path.resolve(srcAbs, target);
    if (!existsSync(abs)) return link;
    let out = path.relative(outDir, abs);
    if (!out.startsWith(".")) out = `./${out}`;
    return out + suffix;
  };
  return body
    .replace(/\]\((\.[^)\s]+)\)/g, (m, l) => `](${rewrite(l)})`)
    .replace(/((?:src|href)=")(\.[^"]+)(")/g, (m, a, l, b) => `${a}${rewrite(l)}${b}`);
}

for (const skill of skills) {
  // Deprecated skills are history, not shipped surface area.
  if (skill.bucket === "deprecated") continue;

  const source = `skills/${skill.bucket}/${skill.dirName}/SKILL.md`;
  const header = [
    `<!-- ${GENERATED_BANNER} -->`,
    `<!-- Source: ${source} -->`,
    "",
  ].join("\n");

  // GitHub Copilot reads the agentskills.io standard natively from
  // .github/skills/<name>/SKILL.md, in VS Code, the CLI and the cloud agent.
  // That is the same standard this repo authors in, so the emitted file is
  // very close to the source: name, the trigger description, and the one
  // frontmatter field that decides whether the agent may load it on its own.
  //
  // This deliberately does NOT emit .instructions.md. An instructions file is
  // applied by glob, and applyTo "**" makes it always-on for every request -
  // which is exactly the failure write-a-skill and migrate-agent-to-skills
  // both warn about in print. An interview skill that is always applied does
  // not wait to be asked; it interrogates someone who wanted a one-line fix.
  const ghFrontmatter = [
    "---",
    `name: ${skill.name}`,
    `description: ${yamlString(skill.description)}`,
  ];
  if (skill.userInvoked) ghFrontmatter.push("disable-model-invocation: true");
  ghFrontmatter.push("---");

  const copiedAlongside = new Set();
  for (const sub of ["references", "scripts", "assets"]) {
    const dir = path.join(ROOT, skill.relDir, sub);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
      if (!entry.isFile()) continue;
      const from = path.join(entry.parentPath ?? entry.path, entry.name);
      const relInside = path.relative(path.join(ROOT, skill.relDir), from);
      artefacts.set(`.github/skills/${skill.name}/${relInside}`, readFileSync(from, "utf8"));
      copiedAlongside.add(relInside);
    }
  }

  const ghRel = `.github/skills/${skill.name}/SKILL.md`;
  artefacts.set(
    ghRel,
    [...ghFrontmatter, "", header + reanchorLinks(skill.body, skill.relDir, ghRel, copiedAlongside), ""].join("\n"),
  );

  const cursorRel = `.cursor/rules/${skill.name}.mdc`;
  artefacts.set(
    cursorRel,
    [
      "---",
      `description: ${yamlString(skill.description)}`,
      `alwaysApply: false`,
      "---",
      "",
      header + reanchorLinks(skill.body, skill.relDir, cursorRel),
      "",
    ].join("\n"),
  );
}

// Aggregate Codex manifest. Per-skill agents/openai.yaml files are authored by
// hand beside each SKILL.md; this rolls them up into one catalogue.
const manifestLines = [
  `# ${GENERATED_BANNER}`,
  "skills:",
];
for (const skill of skills) {
  if (skill.bucket === "deprecated") continue;
  manifestLines.push(`  - name: ${skill.name}`);
  manifestLines.push(`    bucket: ${skill.bucket}`);
  manifestLines.push(`    path: skills/${skill.bucket}/${skill.dirName}/SKILL.md`);
  manifestLines.push(`    interface:`);
  manifestLines.push(`      display_name: ${yamlString(skill.displayName || skill.name)}`);
  manifestLines.push(
    `      short_description: ${yamlString(skill.shortDescription || skill.description)}`,
  );
  manifestLines.push(`    policy:`);
  manifestLines.push(`      allow_implicit_invocation: ${skill.userInvoked ? "false" : "true"}`);
}
artefacts.set("agents/openai.yaml", manifestLines.join("\n") + "\n");

// Harness-neutral manifest. The artefacts above each target a specific tool, and
// there will always be one more tool. This is the escape hatch: any harness,
// script or site can read one JSON file and discover every skill, what triggers
// it, and whether it may fire on its own. Nothing in the repo consumes it - it
// exists so that something outside the repo can.
artefacts.set(
  "skills/index.json",
  JSON.stringify(
    {
      $comment: GENERATED_BANNER,
      generator: "scripts/build-harnesses.mjs",
      count: skills.filter((s) => s.bucket !== "deprecated").length,
      skills: skills
        .filter((s) => s.bucket !== "deprecated")
        .map((s) => ({
          name: s.name,
          bucket: s.bucket,
          // The trigger, not a summary. This is the field a harness matches on.
          description: s.description,
          invocation: s.userInvoked ? "user" : "model",
          promoted: s.promoted,
          // Carried through so a consumer outside this repo can tell a claim
          // checked last week from one checked at authoring time, and can see
          // what the practice came out of, without opening the file.
          verified_on: s.frontMatter.verified_on ?? null,
          provenance: s.frontMatter.provenance ?? null,
          path: `skills/${s.bucket}/${s.dirName}/SKILL.md`,
          docs: s.promoted ? `docs/${s.bucket}/${s.dirName}.md` : null,
        })),
    },
    null,
    2,
  ) + "\n",
);

/** Every directory we own end to end, so stale files are removed, not left behind. */
const OWNED_DIRS = [
  ".github/skills",
  // Retired GitHub Copilot artefact shapes. Kept in this list so the staleness
  // check reports any left on disk from an older build and deletes them.
  ".github/prompts",
  ".github/chatmodes",
  ".github/instructions",
  ".cursor/rules",
];

function listOwnedFiles() {
  const found = [];
  const walk = (dir) => {
    const abs = path.join(ROOT, dir);
    if (!existsSync(abs)) return;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else found.push(rel);
    }
  };
  for (const dir of OWNED_DIRS) walk(dir);
  if (existsSync(path.join(ROOT, "agents/openai.yaml"))) found.push("agents/openai.yaml");
  if (existsSync(path.join(ROOT, "skills/index.json"))) found.push("skills/index.json");
  return found;
}

if (check) {
  const problems = [];

  for (const [rel, want] of artefacts) {
    const abs = path.join(ROOT, rel);
    if (!existsSync(abs)) {
      problems.push(`missing:  ${rel}`);
      continue;
    }
    if (readFileSync(abs, "utf8") !== want) {
      problems.push(`stale:    ${rel}`);
    }
  }

  for (const rel of listOwnedFiles()) {
    if (!artefacts.has(rel)) problems.push(`orphaned: ${rel}`);
  }

  if (problems.length) {
    console.error("Harness artefacts are out of date:\n");
    problems.forEach((p) => console.error(`  ${p}`));
    console.error("\nRun `npm run build` and commit the result.");
    process.exit(1);
  }
  console.log(`Harness artefacts up to date (${artefacts.size} files from ${skills.length} skills).`);
  process.exit(0);
}

// Write mode. Clear owned directories first so a renamed skill cannot leave a
// stale command behind that still routes to something that no longer exists.
for (const dir of OWNED_DIRS) {
  const abs = path.join(ROOT, dir);
  if (existsSync(abs)) rmSync(abs, { recursive: true, force: true });
}

for (const [rel, content] of artefacts) {
  const abs = path.join(ROOT, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf8");
}

console.log(`Built ${artefacts.size} harness artefact(s) from ${skills.length} skill(s).`);
