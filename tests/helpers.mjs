/**
 * Test harness.
 *
 * The gates in scripts/ are the load-bearing part of this repo: every promise in
 * the README about sync obligations, descriptions, invocation and confidentiality
 * rests on them being correct. A regression in a gate fails *open* - the build
 * stays green and the promise quietly stops being kept - which is exactly the
 * failure mode the repo criticises elsewhere.
 *
 * So these tests are written the only way that catches that: each one breaks the
 * repository in a specific way and asserts the gate *fails*. A test that only
 * proves the real repo passes is the same fail-open bug one layer up.
 *
 * Each case runs against a scratch copy of the real repository in a temp dir,
 * with `git init` so `git rev-parse --show-toplevel` resolves there rather than
 * here. The scripts are run as subprocesses, exactly as CI runs them, so nothing
 * is mocked and no gate can be accidentally bypassed by the harness.
 *
 * No test framework: node --test, for the same reason the rest of the toolchain
 * has no dependencies.
 */

import { execSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const REPO = execSync("git rev-parse --show-toplevel").toString().trim();

// Copied wholesale minus the things that are large, generated from what we copy,
// or actively hostile to a scratch clone.
const SKIP = new Set([".git", "node_modules", "tests"]);

/**
 * Make a scratch copy of the repo, apply `mutate`, and hand back its path.
 * Registered for cleanup with the caller's test context.
 */
export function scratchRepo(t, mutate = () => {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "mas-test-"));
  cpSync(REPO, dir, {
    recursive: true,
    dereference: true,
    filter: (src) => {
      const rel = path.relative(REPO, src);
      if (!rel) return true;
      return !SKIP.has(rel.split(path.sep)[0]);
    },
  });

  // The scripts resolve their root with `git rev-parse --show-toplevel`, and
  // scrub.mjs lists tracked files. Both need a real repository, not a directory.
  execSync("git init -q && git add -A && git -c user.email=t@example.com -c user.name=t commit -qm fixture", {
    cwd: dir,
    stdio: "pipe",
  });

  mutate(new Scratch(dir));

  t?.after?.(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Small edit helpers, so a test reads as the one thing it breaks. */
export class Scratch {
  constructor(dir) {
    this.dir = dir;
  }

  abs(rel) {
    return path.join(this.dir, rel);
  }

  read(rel) {
    return readFileSync(this.abs(rel), "utf8");
  }

  write(rel, content) {
    mkdirSync(path.dirname(this.abs(rel)), { recursive: true });
    writeFileSync(this.abs(rel), content, "utf8");
  }

  edit(rel, fn) {
    this.write(rel, fn(this.read(rel)));
  }

  remove(rel) {
    rmSync(this.abs(rel), { recursive: true, force: true });
  }

  exists(rel) {
    return existsSync(this.abs(rel));
  }

  /** Replace a single front matter field in a SKILL.md. */
  setFrontMatter(rel, key, value) {
    this.edit(rel, (text) => {
      const line = value === null ? "" : `${key}: ${value}`;
      if (new RegExp(`^${key}:`, "m").test(text)) {
        return text.replace(new RegExp(`^${key}:.*$`, "m"), line).replace(/\n\n---/, "\n---");
      }
      return text.replace(/^---\n/, `---\n${line}\n`);
    });
  }

  /** Stage everything, so scrub.mjs sees the mutation. */
  stage() {
    execSync("git add -A", { cwd: this.dir, stdio: "pipe" });
  }
}

/** Run a repo script inside a scratch dir. Never throws; the exit code is the assertion. */
export function run(dir, script, args = []) {
  // spawnSync rather than execFileSync: warnings go to stderr and a passing run
  // still has to be inspectable, so both streams are always captured.
  const r = spawnSync(process.execPath, [path.join(dir, "scripts", script), ...args], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, CI: "" },
  });
  return { code: r.status ?? 1, output: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

export const validate = (dir, args = []) => run(dir, "validate-repo.mjs", args);
export const build = (dir, args = []) => run(dir, "build-harnesses.mjs", args);
export const site = (dir, args = []) => run(dir, "build-site.mjs", args);
export const scrub = (dir, args = []) => run(dir, "scrub.mjs", args);

/** A minimal, valid model-invoked skill, used when a test needs to add one. */
export function addSkill(s, { bucket = "build", name = "fixture-skill", description, userInvoked = false, body = "Body." } = {}) {
  const desc =
    description ??
    "Do the fixture thing that this fixture skill exists to do in tests. Use when a test needs a valid model-invoked skill on disk, when a gate is being proved to fail on a mutation of one, or when the harness needs a skill nothing else depends on.";
  const fm = ["---", `name: ${name}`, `description: ${desc}`];
  if (userInvoked) fm.push("disable-model-invocation: true");
  fm.push("verified_on: 2026-08-18");
  fm.push('provenance: "Invented for the test suite; this skill is not shipped and describes no real practice."');
  fm.push("---", "", body, "");
  s.write(`skills/${bucket}/${name}/SKILL.md`, fm.join("\n"));
  s.write(
    `skills/${bucket}/${name}/agents/openai.yaml`,
    [
      "interface:",
      `  display_name: "${name}"`,
      `  short_description: "${name}"`,
      "policy:",
      `  allow_implicit_invocation: ${userInvoked ? "false" : "true"}`,
      "",
    ].join("\n"),
  );
  return { name, bucket };
}

/** Wire a skill into all five sync obligations, so a test can then break exactly one. */
export function promote(s, { bucket, name }) {
  const link = `skills/${bucket}/${name}/SKILL.md`;
  s.edit("README.md", (t) => t.replace(/\n## Buckets/, `\n- [${name}](./${link}) - fixture.\n\n## Buckets`));
  s.edit(".claude-plugin/plugin.json", (t) => {
    const json = JSON.parse(t);
    json.skills.push(`./skills/${bucket}/${name}`);
    return JSON.stringify(json, null, 2) + "\n";
  });
  s.edit(`skills/${bucket}/README.md`, (t) => `${t.trimEnd()}\n- [${name}](./${name}/SKILL.md) - fixture.\n`);
  s.write(
    `docs/${bucket}/${name}.md`,
    [
      `# ${name}`,
      "",
      "## What it does",
      "Fixture.",
      "",
      "## When to reach for it",
      "Never; it exists for the test suite.",
      "",
      "## Common questions",
      "None.",
      "",
      "## It's working if",
      "The gate under test fails when this page is removed.",
      "",
    ].join("\n"),
  );
  s.edit("docs/README.md", (t) => `${t.trimEnd()}\n\n- [${name}](./${bucket}/${name}.md) - fixture.\n`);
  s.edit(`skills/deliver/ask-ragnar/SKILL.md`, (t) => `${t.trimEnd()}\n\n- \`${name}\` - fixture route.\n`);
}
