// Fixture-driven tests for scripts/lib/harness-core.mjs: link re-anchoring and
// artefact diffing (missing/stale/orphaned detection), plus buildArtifacts()
// from scripts/build-harnesses.mjs exercised against the same synthetic
// fixture repo used by tests/lib-parsing.test.mjs.

import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { yamlString, reanchorLinks, diffArtifacts, GENERATED_BANNER } from "../scripts/lib/harness-core.mjs";
import { loadSkills } from "../scripts/lib/skills.mjs";
import { buildArtifacts } from "../scripts/build-harnesses.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.join(HERE, "fixtures", "repo");

test("yamlString escapes backslashes and double quotes", () => {
  assert.equal(yamlString('a "quoted" value'), '"a \\"quoted\\" value"');
  assert.equal(yamlString("path\\to\\thing"), '"path\\\\to\\\\thing"');
});

test("GENERATED_BANNER warns against hand-editing and names the build command", () => {
  assert.match(GENERATED_BANNER, /Do not edit by hand/);
  assert.match(GENERATED_BANNER, /npm run build/);
});

// ------------------------------------------------------------- reanchorLinks

test("reanchorLinks rewrites a relative markdown link for a flat artefact one directory deeper", () => {
  const body = "See [the note](./references/note.md) for detail.";
  const exists = () => true;
  const out = reanchorLinks(body, "skills/build/sample-skill", ".cursor/rules/sample-skill.mdc", new Set(), "/repo", exists);
  // .cursor/rules is two directories deep from the repo root, so the rewritten
  // link climbs back out twice before descending into skills/.
  assert.match(out, /\]\(\.\.\/\.\.\/skills\/build\/sample-skill\/references\/note\.md\)/);
});

test("reanchorLinks leaves a link alone when the target file was copied alongside the artefact", () => {
  const body = "See [the note](./references/note.md) for detail.";
  const copied = new Set(["references/note.md"]);
  const out = reanchorLinks(body, "skills/build/sample-skill", ".github/skills/sample-skill/SKILL.md", copied, "/repo", () => true);
  assert.equal(out, body);
});

test("reanchorLinks leaves a link alone when the target does not exist on disk", () => {
  const body = "See [missing](./nope.md) for detail.";
  const out = reanchorLinks(body, "skills/build/sample-skill", ".cursor/rules/sample-skill.mdc", new Set(), "/repo", () => false);
  assert.equal(out, body);
});

test("reanchorLinks preserves an anchor/query suffix while rewriting the path", () => {
  const body = "See [the note](./references/note.md#section) for detail.";
  const out = reanchorLinks(body, "skills/build/sample-skill", ".cursor/rules/sample-skill.mdc", new Set(), "/repo", () => true);
  assert.match(out, /#section\)/);
});

test("reanchorLinks rewrites an href attribute the same way as a markdown link", () => {
  const body = '<a href="./references/note.md">note</a>';
  const out = reanchorLinks(body, "skills/build/sample-skill", ".cursor/rules/sample-skill.mdc", new Set(), "/repo", () => true);
  assert.match(out, /href="\.\.\/\.\.\/skills\/build\/sample-skill\/references\/note\.md"/);
});

// ------------------------------------------------------------- diffArtifacts

test("diffArtifacts reports nothing when wanted and existing agree", () => {
  const wanted = new Map([["a.md", "content-a"]]);
  const existing = new Map([["a.md", "content-a"]]);
  assert.deepEqual(diffArtifacts(wanted, existing), []);
});

test("diffArtifacts reports a missing file that is wanted but not on disk", () => {
  const wanted = new Map([["a.md", "content-a"]]);
  const existing = new Map([["a.md", null]]);
  assert.deepEqual(diffArtifacts(wanted, existing), ["missing:  a.md"]);
});

test("diffArtifacts reports a stale file whose disk content differs from wanted", () => {
  const wanted = new Map([["a.md", "new-content"]]);
  const existing = new Map([["a.md", "old-content"]]);
  assert.deepEqual(diffArtifacts(wanted, existing), ["stale:    a.md"]);
});

test("diffArtifacts reports an orphaned file that exists on disk but is no longer wanted", () => {
  const wanted = new Map();
  const existing = new Map([["stale-skill.md", "leftover"]]);
  assert.deepEqual(diffArtifacts(wanted, existing), ["orphaned: stale-skill.md"]);
});

test("diffArtifacts reports missing, stale and orphaned together, each on its own line", () => {
  const wanted = new Map([
    ["missing.md", "x"],
    ["stale.md", "new"],
    ["same.md", "same"],
  ]);
  const existing = new Map([
    ["missing.md", null],
    ["stale.md", "old"],
    ["same.md", "same"],
    ["orphan.md", "leftover"],
  ]);
  const problems = diffArtifacts(wanted, existing);
  assert.equal(problems.length, 3);
  assert.ok(problems.includes("missing:  missing.md"));
  assert.ok(problems.includes("stale:    stale.md"));
  assert.ok(problems.includes("orphaned: orphan.md"));
});

// -------------------------------------------------------------- buildArtifacts

test("buildArtifacts emits a GitHub Copilot skill file, a Cursor rule, an openai.yaml entry and an index.json entry per skill", () => {
  const skills = loadSkills(FIXTURE_ROOT);
  const artefacts = buildArtifacts(skills, FIXTURE_ROOT);

  assert.ok(artefacts.has(".github/skills/sample-skill/SKILL.md"));
  assert.ok(artefacts.has(".cursor/rules/sample-skill.mdc"));
  assert.ok(artefacts.has(".github/skills/sample-skill/references/note.md"));
  assert.ok(artefacts.has("agents/openai.yaml"));
  assert.ok(artefacts.has("skills/index.json"));

  const ghSkill = artefacts.get(".github/skills/sample-skill/SKILL.md");
  assert.match(ghSkill, /^---\nname: sample-skill\n/);
  assert.doesNotMatch(ghSkill, /disable-model-invocation/);

  const index = JSON.parse(artefacts.get("skills/index.json"));
  const names = index.skills.map((s) => s.name);
  assert.ok(names.includes("sample-skill"));
  assert.ok(names.includes("sample-user-invoked"));
});

test("buildArtifacts marks a user-invoked skill's GitHub artefact with disable-model-invocation: true", () => {
  const skills = loadSkills(FIXTURE_ROOT);
  const artefacts = buildArtifacts(skills, FIXTURE_ROOT);
  const ghSkill = artefacts.get(".github/skills/sample-user-invoked/SKILL.md");
  assert.match(ghSkill, /disable-model-invocation: true/);
});

test("buildArtifacts is deterministic: building twice from the same skill list produces byte-identical artefacts", () => {
  const skills = loadSkills(FIXTURE_ROOT);
  const first = buildArtifacts(skills, FIXTURE_ROOT);
  const second = buildArtifacts(skills, FIXTURE_ROOT);
  assert.deepEqual([...first.entries()], [...second.entries()]);
});
