/**
 * build-harnesses.mjs
 *
 * `--check` is what stops a hand-edited generated file, or a skill edited without
 * a rebuild, from shipping. It is only worth anything if it actually notices, so
 * every case here makes the tree stale in a different way and asserts it says so.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { scratchRepo, build, addSkill } from "./helpers.mjs";

const stale = (result, fragment) => {
  assert.equal(result.code, 1, `expected a non-zero exit.\n---\n${result.output}`);
  assert.match(result.output, /Harness artefacts are out of date/);
  assert.match(result.output, fragment);
};

test("a generated artefact edited by hand is reported stale", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit(".github/skills/write-a-skill/SKILL.md", (text) => `${text}\nHand-edited by a fixture.\n`);
  });
  stale(build(dir, ["--check"]), /stale:\s+\.github\/skills\/write-a-skill\/SKILL\.md/);
});

test("a skill edited without a rebuild is reported stale", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("skills/build/write-a-skill/SKILL.md", (text) => `${text}\n## A section added without rebuilding\n`);
  });
  const result = build(dir, ["--check"]);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /stale:\s+\.github\/skills\/write-a-skill\/SKILL\.md/);
  assert.match(result.output, /stale:\s+\.cursor\/rules\/write-a-skill\.mdc/);
});

test("a new skill with no artefacts is reported missing", (t) => {
  const dir = scratchRepo(t, (s) => addSkill(s, { bucket: "build", name: "fixture-skill" }));
  stale(build(dir, ["--check"]), /missing:\s+\.github\/skills\/fixture-skill\/SKILL\.md/);
});

test("an artefact left behind by a deleted skill is reported orphaned", (t) => {
  // The failure this catches is a renamed skill leaving a command behind that
  // still routes to something that no longer exists.
  const dir = scratchRepo(t, (s) => {
    s.write(".cursor/rules/deleted-skill.mdc", "---\ndescription: \"gone\"\nalwaysApply: false\n---\n");
  });
  stale(build(dir, ["--check"]), /orphaned:\s+\.cursor\/rules\/deleted-skill\.mdc/);
});

test("a deleted skill's artefacts are reported orphaned", (t) => {
  const dir = scratchRepo(t, (s) => s.remove("skills/learn/explain-concept"));
  stale(build(dir, ["--check"]), /orphaned:\s+\.github\/skills\/explain-concept\/SKILL\.md/);
});

test("a stale skills/index.json is reported", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("skills/index.json", (text) => {
      const json = JSON.parse(text);
      json.count = 99;
      return JSON.stringify(json, null, 2) + "\n";
    });
  });
  stale(build(dir, ["--check"]), /stale:\s+skills\/index\.json/);
});

test("a rebuild makes a stale tree clean again", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("skills/build/write-a-skill/SKILL.md", (text) => `${text}\nOne more line.\n`);
  });
  assert.equal(build(dir, ["--check"]).code, 1);
  assert.equal(build(dir).code, 0);
  const after = build(dir, ["--check"]);
  assert.equal(after.code, 0, after.output);
});

test("a skill's relative links are re-anchored for the artefact's own depth", (t) => {
  // A SKILL.md links relative to its own folder. .cursor/rules/<name>.mdc is a
  // flat file three levels shallower, so emitting the body verbatim would point
  // every one of those links outside the repo - which is what used to happen.
  const dir = scratchRepo(t);
  assert.equal(build(dir, ["--check"]).code, 0);
  const source = readFileSync(`${dir}/skills/deliver/structured-interview/SKILL.md`, "utf8");
  assert.match(source, /\]\(\.\/references\/dimensions\.md\)/, "fixture assumes the source links to its own references/");

  const flat = readFileSync(`${dir}/.cursor/rules/structured-interview.mdc`, "utf8");
  assert.doesNotMatch(flat, /\]\(\.\/references\/dimensions\.md\)/, "a flat artefact must not keep a sibling-relative link");
  assert.match(flat, /\]\(\.\.\/\.\.\/skills\/deliver\/structured-interview\/references\/dimensions\.md\)/);

  // The GitHub Copilot artefact is the opposite case: references/ travels with
  // it, so the link must be left exactly as authored.
  const copilot = readFileSync(`${dir}/.github/skills/structured-interview/SKILL.md`, "utf8");
  assert.match(copilot, /\]\(\.\/references\/dimensions\.md\)/);
  assert.ok(existsSync(`${dir}/.github/skills/structured-interview/references/dimensions.md`));
});

test("verified_on and provenance reach the harness-neutral manifest", (t) => {
  // skills/index.json is the escape hatch for harnesses this repo does not emit
  // for. A consumer reading it should be able to see how old a claim is without
  // opening the file it came from.
  const dir = scratchRepo(t);
  assert.equal(build(dir, ["--check"]).code, 0);
  const index = JSON.parse(readFileSync(`${dir}/skills/index.json`, "utf8"));
  for (const s of index.skills) {
    assert.match(s.verified_on ?? "", /^\d{4}-\d{2}-\d{2}$/, `${s.name} has no verified_on in index.json`);
    assert.ok((s.provenance ?? "").length > 20, `${s.name} has no provenance in index.json`);
  }
});

test("the committed artefacts match the committed skills", (t) => {
  const dir = scratchRepo(t);
  const result = build(dir, ["--check"]);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /Harness artefacts up to date/);
});
