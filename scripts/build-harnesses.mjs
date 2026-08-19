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

for (const skill of skills) {
  // Deprecated skills are history, not shipped surface area.
  if (skill.bucket === "deprecated") continue;

  const source = `skills/${skill.bucket}/${skill.dirName}/SKILL.md`;
  const header = [
    `<!-- ${GENERATED_BANNER} -->`,
    `<!-- Source: ${source} -->`,
    "",
  ].join("\n");

  if (skill.userInvoked) {
    artefacts.set(
      `.github/prompts/${skill.name}.prompt.md`,
      [
        "---",
        `description: ${yamlString(skill.description)}`,
        "---",
        "",
        header + skill.body,
        "",
      ].join("\n"),
    );

    artefacts.set(
      `.github/chatmodes/${skill.name}.chatmode.md`,
      [
        "---",
        `description: ${yamlString(skill.description)}`,
        "---",
        "",
        header + skill.body,
        "",
      ].join("\n"),
    );
  } else {
    // Model-invoked skills must stay reachable mid-conversation, so they are
    // rendered as always-available instructions rather than a slash command.
    artefacts.set(
      `.github/instructions/${skill.name}.instructions.md`,
      [
        "---",
        `description: ${yamlString(skill.description)}`,
        'applyTo: "**"',
        "---",
        "",
        header + skill.body,
        "",
      ].join("\n"),
    );
  }

  artefacts.set(
    `.cursor/rules/${skill.name}.mdc`,
    [
      "---",
      `description: ${yamlString(skill.description)}`,
      `alwaysApply: false`,
      "---",
      "",
      header + skill.body,
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
  ".github/prompts",
  ".github/chatmodes",
  ".github/instructions",
  ".cursor/rules",
];

function listOwnedFiles() {
  const found = [];
  for (const dir of OWNED_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      found.push(`${dir}/${f}`);
    }
  }
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
