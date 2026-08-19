#!/usr/bin/env node
/**
 * Harness builder.
 *
 * `SKILL.md` is the single source of truth. This script renders every skill into
 * the formats each harness expects, so a skill written once is reachable from
 * GitHub Copilot, Claude Code, Codex and Cursor without being rewritten.
 *
 * Generated, never hand-edited:
 *   .github/skills/<name>/SKILL.md              GitHub Copilot (agentskills.io standard)
 *   .cursor/rules/<name>.mdc                    every skill, Cursor rules
 *   agents/openai.yaml                          aggregate Codex manifest
 *   skills/index.json                           harness-neutral manifest, any tool
 *
 * Usage:
 *   node scripts/build-harnesses.mjs            write the artefacts
 *   node scripts/build-harnesses.mjs --check    fail if anything on disk is stale
 *
 * The pure rendering logic (link re-anchoring, artefact diffing) lives in
 * scripts/lib/harness-core.mjs so it can be unit tested without touching disk.
 * This file is the thin CLI: it resolves real paths, reads/writes files, and
 * prints the report.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, loadSkills, GENERATED_BANNER } from "./lib/skills.mjs";
import { yamlString, reanchorLinks, diffArtifacts } from "./lib/harness-core.mjs";

const check = process.argv.includes("--check");
const skills = loadSkills();

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

/**
 * Build the wanted-artefact map (rel path -> content) for a given skill list.
 *
 * `root` defaults to the real repo root and is only overridden by tests, which
 * point it at a fixture tree so copied-alongside references/scripts/assets
 * resolve against the fixture instead of this repo's real files.
 */
export function buildArtifacts(skillList, root = ROOT) {
  const artefacts = new Map();

  for (const skill of skillList) {
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
      const dir = path.join(root, skill.relDir, sub);
      if (!existsSync(dir)) continue;
      for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
        if (!entry.isFile()) continue;
        const from = path.join(entry.parentPath ?? entry.path, entry.name);
        const relInside = path.relative(path.join(root, skill.relDir), from);
        artefacts.set(`.github/skills/${skill.name}/${relInside}`, readFileSync(from, "utf8"));
        copiedAlongside.add(relInside);
      }
    }

    const ghRel = `.github/skills/${skill.name}/SKILL.md`;
    artefacts.set(
      ghRel,
      [...ghFrontmatter, "", header + reanchorLinks(skill.body, skill.relDir, ghRel, copiedAlongside, root, existsSync), ""].join("\n"),
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
        header + reanchorLinks(skill.body, skill.relDir, cursorRel, new Set(), root, existsSync),
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
  for (const skill of skillList) {
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
        count: skillList.filter((s) => s.bucket !== "deprecated").length,
        skills: skillList
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
            // Freshness metadata belongs in the manifest, not just the source
            // file: a consumer reading index.json is exactly who needs to know
            // how old a skill's claims are and where they came from.
            verified_on: s.frontMatter?.verified_on ?? null,
            provenance: s.frontMatter?.provenance ?? null,
          })),
      },
      null,
      2,
    ) + "\n",
  );

  return artefacts;
}

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

// Only run the CLI body when this file is executed directly, not when
// buildArtifacts is imported for testing.
//
// Compare real paths, not raw strings. Node resolves import.meta.url to the
// realpath, so on macOS a repo under /var (a symlink to /private/var) never
// matched argv[1] and this gate silently exited 0 having checked nothing.
// `.pathname` is also percent-encoded, so any repo path containing a space
// failed the same way -- hence fileURLToPath rather than new URL().pathname.
const realpathOrNull = (p) => {
  try {
    return realpathSync(p);
  } catch {
    return null;
  }
};
const invokedAs = process.argv[1] && realpathOrNull(path.resolve(process.argv[1]));
const isMain = Boolean(invokedAs) && invokedAs === realpathOrNull(fileURLToPath(import.meta.url));
if (isMain) {
  const artefacts = buildArtifacts(skills);

  if (check) {
    const existing = new Map();
    for (const rel of listOwnedFiles()) {
      const abs = path.join(ROOT, rel);
      existing.set(rel, existsSync(abs) ? readFileSync(abs, "utf8") : null);
    }
    const problems = diffArtifacts(artefacts, existing);

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
}
