// Fixture-driven tests for scripts/lib/skills.mjs: front-matter parsing,
// agents/openai.yaml reading, and skill discovery. These use a synthetic
// fixture "repo" under tests/fixtures/repo/ rather than this repo's real
// skills, so they stay stable as real skills are added, renamed or removed.

import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontMatter, readSkillOpenAiYaml, loadSkills } from "../scripts/lib/skills.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.join(HERE, "fixtures", "repo");

test("parseFrontMatter reads name/description and leaves the body intact", () => {
  const raw = [
    "---",
    "name: demo",
    "description: A demo skill. Use when testing.",
    "---",
    "",
    "# Body heading",
    "",
    "Body text.",
  ].join("\n");

  const { data, body } = parseFrontMatter(raw);
  assert.equal(data.name, "demo");
  assert.equal(data.description, "A demo skill. Use when testing.");
  assert.match(body, /# Body heading/);
  assert.match(body, /Body text\./);
});

test("parseFrontMatter folds a multi-line continuation value onto one line", () => {
  const raw = ["---", "name: demo", "description: First line", "  second line", "---", "", "body"].join("\n");
  const { data } = parseFrontMatter(raw);
  assert.equal(data.description, "First line second line");
});

test("parseFrontMatter strips matching single or double quotes from values", () => {
  const raw = ['---', 'name: "demo"', "title: 'quoted'", "---", "", "body"].join("\n");
  const { data } = parseFrontMatter(raw);
  assert.equal(data.name, "demo");
  assert.equal(data.title, "quoted");
});

test("parseFrontMatter returns the raw text as body when there is no --- block", () => {
  const raw = "# Just a heading\n\nNo front matter here.";
  const { data, body } = parseFrontMatter(raw);
  assert.deepEqual(data, {});
  assert.equal(body, raw);
});

test("parseFrontMatter returns the raw text as body when the closing --- is missing", () => {
  const raw = "---\nname: demo\n\n# unterminated block";
  const { data, body } = parseFrontMatter(raw);
  assert.deepEqual(data, {});
  assert.equal(body, raw);
});

test("readSkillOpenAiYaml reads interface and policy sections", () => {
  const dir = path.join(FIXTURE_ROOT, "skills", "operate", "sample-user-invoked");
  const openai = readSkillOpenAiYaml(dir);
  assert.ok(openai);
  assert.equal(openai.policy.allow_implicit_invocation, "false");
  assert.equal(openai.interface.display_name, "Sample User Invoked");
});

test("readSkillOpenAiYaml returns null when agents/openai.yaml is absent", () => {
  const dir = path.join(FIXTURE_ROOT, "skills", "build", "sample-skill");
  assert.equal(readSkillOpenAiYaml(dir), null);
});

test("loadSkills discovers every SKILL.md under a fixture root, sorted by name", () => {
  const skills = loadSkills(FIXTURE_ROOT);
  assert.equal(skills.length, 2);
  assert.deepEqual(
    skills.map((s) => s.name),
    ["sample-skill", "sample-user-invoked"],
  );
});

test("loadSkills marks a model-invoked skill correctly", () => {
  const skills = loadSkills(FIXTURE_ROOT);
  const model = skills.find((s) => s.name === "sample-skill");
  assert.equal(model.userInvoked, false);
  assert.equal(model.hasOpenAiYaml, false);
  assert.equal(model.bucket, "build");
  assert.equal(model.promoted, true);
  assert.match(model.description, /Use when/);
});

test("loadSkills marks a user-invoked skill and reads its openai.yaml policy", () => {
  const skills = loadSkills(FIXTURE_ROOT);
  const userInvoked = skills.find((s) => s.name === "sample-user-invoked");
  assert.equal(userInvoked.userInvoked, true);
  assert.equal(userInvoked.hasOpenAiYaml, true);
  assert.equal(userInvoked.allowImplicit, "false");
});

test("loadSkills returns an empty array when the fixture root has no skills/ directory", () => {
  const skills = loadSkills(path.join(HERE, "fixtures", "does-not-exist"));
  assert.deepEqual(skills, []);
});
