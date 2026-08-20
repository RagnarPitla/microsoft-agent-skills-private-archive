// Fixture-driven tests for scripts/lib/validate-core.mjs, covering the rules
// that back the "sync obligations", description-is-a-trigger, docs page shape,
// bucket README grouping, and registry schema checks that
// scripts/validate-repo.mjs enforces across the real repo. Each rule is
// exercised here with both a passing and a failing fixture.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkDescriptionIsTrigger,
  checkSkillIdentity,
  checkSkillProvenance,
  checkSyncObligations,
  checkDocsPageSections,
  DOCS_SECTIONS,
  checkBucketReadmeGroups,
  checkConnectorSchema,
  checkRegistrySchema,
  checkProseIsNotSlop,
} from "../scripts/lib/validate-core.mjs";

// ------------------------------------------------------------ description rule

test("checkDescriptionIsTrigger passes a trigger-rich model-invoked description", () => {
  const description =
    "Use when a reviewer asks whether an agent is production ready, when a solution import breaks on " +
    "connection references, or when a departing employee's flows stop running. Diagnoses the root cause.";
  const problems = checkDescriptionIsTrigger(description, { userInvoked: false });
  assert.deepEqual(problems, []);
});

test("checkDescriptionIsTrigger fails a model-invoked description with no Use when clause", () => {
  const description =
    "This is a long enough description about agent governance and lifecycle management practices that " +
    "covers many topics but never says when a reader should reach for it in any concrete situation at all.";
  const problems = checkDescriptionIsTrigger(description, { userInvoked: false });
  assert.ok(problems.some((p) => p.includes('no "Use when" clause')));
});

test("checkDescriptionIsTrigger fails a model-invoked description that is too short", () => {
  const problems = checkDescriptionIsTrigger("Use when short.", { userInvoked: false });
  assert.ok(problems.some((p) => p.includes("characters")));
});

test("checkDescriptionIsTrigger fails a description that opens like a summary", () => {
  const description =
    "This skill helps you understand agent governance and lifecycle management in Copilot Studio and " +
    "covers everything about publishing, versioning and retiring agents across an organisation's estate.";
  const problems = checkDescriptionIsTrigger(description, { userInvoked: false });
  assert.ok(problems.some((p) => p.includes("opens like a summary")));
});

test("checkDescriptionIsTrigger fails a description over the 1024 character limit", () => {
  const description = "Use when " + "x".repeat(1020);
  const problems = checkDescriptionIsTrigger(description, { userInvoked: false });
  assert.ok(problems.some((p) => p.includes("1024")));
});

test("checkDescriptionIsTrigger does not require a Use when clause or length for user-invoked skills", () => {
  const problems = checkDescriptionIsTrigger("Short menu label.", { userInvoked: true });
  assert.deepEqual(problems, []);
});

// -------------------------------------------------------------- identity rule

test("checkSkillIdentity passes when name matches folder and folder is kebab-case", () => {
  assert.deepEqual(checkSkillIdentity({ name: "my-skill", dirName: "my-skill" }), []);
});

test("checkSkillIdentity fails when front-matter name does not match the folder", () => {
  const problems = checkSkillIdentity({ name: "my-skill", dirName: "other-folder" });
  assert.ok(problems.some((p) => p.includes("does not match its folder")));
});

test("checkSkillIdentity fails a non-kebab-case folder name", () => {
  const problems = checkSkillIdentity({ name: "MySkill", dirName: "MySkill" });
  assert.ok(problems.some((p) => p.includes("kebab-case")));
});

// --------------------------------------------------------- sync obligations

const PROMOTED_SKILL = { name: "demo", bucket: "operate", dirName: "demo", promoted: true };
const UNPROMOTED_SKILL = { name: "demo", bucket: "misc", dirName: "demo", promoted: false };
const skillLink = "skills/operate/demo/SKILL.md";

test("checkSyncObligations passes a promoted skill linked everywhere it must be", () => {
  const problems = checkSyncObligations(PROMOTED_SKILL, {
    rootReadme: `See [demo](${skillLink}).`,
    pluginSkillPaths: [skillLink],
    bucketReadme: `- [demo](./demo/SKILL.md)`,
    docsPageExists: true,
  });
  assert.deepEqual(problems, []);
});

test("checkSyncObligations fails a promoted skill missing from README, plugin.json, docs and bucket README", () => {
  const problems = checkSyncObligations(PROMOTED_SKILL, {
    rootReadme: "Nothing about demo here.",
    pluginSkillPaths: [],
    bucketReadme: "Nothing about demo here either.",
    docsPageExists: false,
  });
  assert.equal(problems.length, 4);
  assert.ok(problems.some((p) => p.includes("not linked from README.md")));
  assert.ok(problems.some((p) => p.includes("missing from .claude-plugin/plugin.json")));
  assert.ok(problems.some((p) => p.includes("no docs page")));
  assert.ok(problems.some((p) => p.includes("not listed in skills/operate/README.md")));
});

test("checkSyncObligations passes a non-promoted skill absent from every promoted surface", () => {
  const problems = checkSyncObligations(UNPROMOTED_SKILL, {
    rootReadme: "Nothing about demo here.",
    pluginSkillPaths: [],
    bucketReadme: null,
    docsPageExists: false,
  });
  assert.deepEqual(problems, []);
});

test("checkSyncObligations fails a non-promoted skill that leaked into README, plugin.json or docs", () => {
  const leaked = { name: "demo", bucket: "misc", dirName: "demo", promoted: false };
  const problems = checkSyncObligations(leaked, {
    rootReadme: "See [demo](skills/misc/demo/SKILL.md).",
    pluginSkillPaths: ["skills/misc/demo/SKILL.md"],
    bucketReadme: null,
    docsPageExists: true,
  });
  assert.equal(problems.length, 3);
  assert.ok(problems.some((p) => p.includes("linked from README.md")));
  assert.ok(problems.some((p) => p.includes("listed in .claude-plugin/plugin.json")));
  assert.ok(problems.some((p) => p.includes("has a docs page")));
});

// -------------------------------------------------------------- docs page shape

test("checkDocsPageSections passes a docs page with all four required sections", () => {
  const docs = DOCS_SECTIONS.map((h) => `## ${h}\n\nContent.`).join("\n\n");
  assert.deepEqual(checkDocsPageSections(docs), []);
});

test("checkDocsPageSections fails a docs page missing one section", () => {
  const docs = DOCS_SECTIONS.filter((h) => h !== "Common questions")
    .map((h) => `## ${h}\n\nContent.`)
    .join("\n\n");
  const problems = checkDocsPageSections(docs);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Common questions/);
});

// ------------------------------------------------------------ bucket README

test("checkBucketReadmeGroups passes a promoted bucket README with the headings it needs", () => {
  const readme = "## User-invoked\n\n...\n\n## Model-invoked\n\n...";
  const problems = checkBucketReadmeGroups(readme, { promoted: true, hasUserInvoked: true, hasModelInvoked: true });
  assert.deepEqual(problems, []);
});

test("checkBucketReadmeGroups fails a promoted bucket README missing a required heading", () => {
  const readme = "## Model-invoked\n\n...";
  const problems = checkBucketReadmeGroups(readme, { promoted: true, hasUserInvoked: true, hasModelInvoked: true });
  assert.ok(problems.some((p) => p.includes('missing a "User-invoked" section')));
});

test("checkBucketReadmeGroups fails a promoted bucket README with an empty heading present", () => {
  const readme = "## User-invoked\n\n...\n\n## Model-invoked\n\n...";
  const problems = checkBucketReadmeGroups(readme, { promoted: true, hasUserInvoked: true, hasModelInvoked: false });
  assert.ok(problems.some((p) => p.includes('has a "Model-invoked" section but no model-invoked skills')));
});

test("checkBucketReadmeGroups fails a non-promoted bucket README that uses invocation groupings", () => {
  const readme = "## User-invoked\n\n- [demo](./demo/SKILL.md)";
  const problems = checkBucketReadmeGroups(readme, { promoted: false, hasUserInvoked: true, hasModelInvoked: false });
  assert.ok(problems.some((p) => p.includes("should use a flat list")));
});

test("checkBucketReadmeGroups passes a non-promoted bucket README using a flat list", () => {
  const readme = "- [demo](./demo/SKILL.md)";
  const problems = checkBucketReadmeGroups(readme, { promoted: false, hasUserInvoked: false, hasModelInvoked: false });
  assert.deepEqual(problems, []);
});

// -------------------------------------------------------------- connector schema

const VALID_CONNECTOR_YAML = [
  "verified_on: 2025-01-15",
  "connectors:",
  "  - system: contoso-crm",
  "    surfaces: [copilot-studio, power-platform]",
  "    mechanism: OAuth connector",
  "    identity: Delegated user identity",
  "    docs: https://learn.microsoft.com/example",
  "    watch_out: Rate limits apply.",
].join("\n");

test("checkConnectorSchema passes a well-formed connector entry", () => {
  assert.deepEqual(checkConnectorSchema(VALID_CONNECTOR_YAML), []);
});

test("checkConnectorSchema fails when verified_on is missing", () => {
  const text = VALID_CONNECTOR_YAML.replace("verified_on: 2025-01-15\n", "");
  const problems = checkConnectorSchema(text);
  assert.ok(problems.some((p) => p.includes("verified_on")));
});

test("checkConnectorSchema fails an entry missing a required field", () => {
  const text = VALID_CONNECTOR_YAML.replace("\n    watch_out: Rate limits apply.", "");
  const problems = checkConnectorSchema(text);
  assert.ok(problems.some((p) => p.includes("missing required field `watch_out`")));
});

test("checkConnectorSchema fails an unknown surface", () => {
  const text = VALID_CONNECTOR_YAML.replace("[copilot-studio, power-platform]", "[not-a-real-surface]");
  const problems = checkConnectorSchema(text);
  assert.ok(problems.some((p) => p.includes("surface") && p.includes("not known")));
});

test("checkConnectorSchema fails a duplicate system", () => {
  const text = VALID_CONNECTOR_YAML + "\n" + VALID_CONNECTOR_YAML.split("\n").slice(1).join("\n");
  const problems = checkConnectorSchema(text);
  assert.ok(problems.some((p) => p.includes("duplicate system")));
});

test("checkConnectorSchema fails when there are no entries at all", () => {
  const problems = checkConnectorSchema("verified_on: 2025-01-15\nconnectors: []\n");
  assert.ok(problems.some((p) => p.includes("no connector entries found")));
});

// ------------------------------------------------------------ registry schema

const BUCKETS = new Set(["build", "connect", "review", "operate", "deliver", "learn", "misc", "in-progress", "deprecated"]);

const VALID_REGISTRY_YAML = [
  "verified_on: 2025-01-15",
  "entries:",
  "  - name: Contoso Sample Repo",
  "    url: https://github.com/contoso/sample",
  "    provenance: community",
  "    description: A synthetic example repo used only in tests.",
  "    covers: [build]",
  "    verdict: route",
].join("\n");

test("checkRegistrySchema passes a well-formed registry entry", () => {
  assert.deepEqual(checkRegistrySchema(VALID_REGISTRY_YAML, BUCKETS), []);
});

test("checkRegistrySchema fails an entry missing a required field", () => {
  const text = VALID_REGISTRY_YAML.replace("    verdict: route\n", "").replace("    verdict: route", "");
  const problems = checkRegistrySchema(text, BUCKETS);
  assert.ok(problems.some((p) => p.includes("missing required field `verdict`")));
});

test("checkRegistrySchema fails an unknown verdict", () => {
  const text = VALID_REGISTRY_YAML.replace("verdict: route", "verdict: not-a-real-verdict");
  const problems = checkRegistrySchema(text, BUCKETS);
  assert.ok(problems.some((p) => p.includes('verdict "not-a-real-verdict" is not one of')));
});

test("checkRegistrySchema fails a covers value that is not a known bucket", () => {
  const text = VALID_REGISTRY_YAML.replace("covers: [build]", "covers: [not-a-bucket]");
  const problems = checkRegistrySchema(text, BUCKETS);
  assert.ok(problems.some((p) => p.includes('covers "not-a-bucket" is not a bucket')));
});

test("checkRegistrySchema only requires url and reason for do_not_link entries", () => {
  const text = [
    "verified_on: 2025-01-15",
    "entries: []",
    "do_not_link:",
    "  - name: Some Retired Tool",
    "    url: https://example.com/retired",
    "    reason: Retired; no longer maintained.",
  ].join("\n");
  assert.deepEqual(checkRegistrySchema(text, BUCKETS), []);
});

// --------------------------------------------------------- skill provenance
// Every SKILL.md carries verified_on and provenance. The fields were present
// on all 15 skills but nothing read them, which is the failure mode the fields
// exist to prevent: metadata that looks like accountability and enforces none.

const NOW = new Date("2026-08-19T00:00:00Z");
const GOOD_PROV = "Repeated go-live escalations where knowledge sources turned out to be the cause.";

test("checkSkillProvenance accepts a sound front matter", () => {
  assert.deepEqual(checkSkillProvenance({ verified_on: "2026-08-18", provenance: GOOD_PROV }, { now: NOW }), []);
});

test("checkSkillProvenance requires both fields", () => {
  const problems = checkSkillProvenance({}, { now: NOW });
  assert.equal(problems.length, 2);
  assert.ok(problems.some((p) => p.includes("verified_on")));
  assert.ok(problems.some((p) => p.includes("provenance")));
});

test("checkSkillProvenance rejects a future verified_on", () => {
  const problems = checkSkillProvenance({ verified_on: "2027-01-01", provenance: GOOD_PROV }, { now: NOW });
  assert.ok(problems.some((p) => p.includes("in the future")));
});

// JS rolls impossible dates over rather than rejecting them - new Date on
// 2026-02-31 yields March 3, not NaN - so this needs a round-trip, not a
// NaN check. The first version of this rule passed 2026-02-31.
for (const bad of ["2026-02-31", "2026-13-01", "2026-00-10"]) {
  test(`checkSkillProvenance rejects the impossible date ${bad}`, () => {
    const problems = checkSkillProvenance({ verified_on: bad, provenance: GOOD_PROV }, { now: NOW });
    assert.ok(problems.some((p) => p.includes("not a real date")), `${bad} was accepted`);
  });
}

test("checkSkillProvenance accepts a valid leap day", () => {
  const problems = checkSkillProvenance({ verified_on: "2024-02-29", provenance: GOOD_PROV }, { now: NOW });
  assert.deepEqual(problems, []);
});

test("checkSkillProvenance rejects a malformed date format", () => {
  const problems = checkSkillProvenance({ verified_on: "18/08/2026", provenance: GOOD_PROV }, { now: NOW });
  assert.ok(problems.some((p) => p.includes("malformed")));
});

test("checkSkillProvenance rejects provenance too short to say anything", () => {
  const problems = checkSkillProvenance({ verified_on: "2026-08-18", provenance: "internal" }, { now: NOW });
  assert.ok(problems.some((p) => p.includes("too short")));
});

// ------------------------------------------------------------------ prose slop

test("checkProseIsNotSlop passes prose that says something", () => {
  const body = "Set the source to GitHub Actions. The deploy step fails until you do.";
  assert.deepEqual(checkProseIsNotSlop(body), []);
});

for (const [phrase, sentence] of [
  ["seamless", "The connector offers a seamless experience."],
  ["utilize", "Utilize the CLI to export the solution."],
  ["cutting-edge", "A cutting-edge approach to agent design."],
  ["testament to", "The result is a testament to careful planning."],
  ["myriad", "There are a myriad of reasons this fails."],
  ["it is important to note", "It is important to note that flows turn off."],
  ["evolving landscape", "The ever-evolving landscape of agent tooling."],
  ["delve", "Let us delve into the topic."],
]) {
  test(`checkProseIsNotSlop catches "${phrase}"`, () => {
    const problems = checkProseIsNotSlop(sentence);
    assert.ok(problems.length > 0, `"${phrase}" was accepted`);
  });
}

// The de-slop skill has to name the vocabulary it bans, so a word inside quotes
// is being mentioned rather than used. Without this the rule would forbid the
// one file whose job is to state it.
test("checkProseIsNotSlop ignores a quoted mention", () => {
  assert.deepEqual(checkProseIsNotSlop('Avoid "seamless" and "cutting-edge" in a proposal.'), []);
});

// Skill bodies wrap at column ~72, so a quoted list of banned phrases routinely
// breaks across lines. An earlier version of this rule matched quotes per-line,
// which desynchronised the pairing and reported the next phrase as real slop.
test("checkProseIsNotSlop ignores a quoted mention that wraps across lines", () => {
  const body = '1. Empty importance. "Pivotal moment", "testament to", "evolving\n   landscape", "at the forefront", "groundbreaking". State what happened.';
  assert.deepEqual(checkProseIsNotSlop(body), []);
});

test("checkProseIsNotSlop ignores fenced code and inline code", () => {
  assert.deepEqual(checkProseIsNotSlop("```\nconst seamless = utilize();\n```\nUse `utilize` here."), []);
});

test("checkProseIsNotSlop ignores a blockquoted example", () => {
  assert.deepEqual(checkProseIsNotSlop("Before:\n\n> A seamless, cutting-edge solution.\n\nAfter: it exports the solution."), []);
});

// Words that are slop in marketing but honest in technical prose are absent
// from the list on purpose: a gate that fires on correct writing gets disabled.
test("checkProseIsNotSlop leaves legitimate technical vocabulary alone", () => {
  const body = "Robust error handling is crucial here, and this is the highest-leverage fix. A holistic view helps.";
  assert.deepEqual(checkProseIsNotSlop(body), []);
});

test("checkProseIsNotSlop reports the line the phrase is on", () => {
  const problems = checkProseIsNotSlop("clean line\nanother clean line\na seamless thing", { where: "f.md" });
  assert.equal(problems.length, 1);
  assert.ok(problems[0].startsWith("f.md: line 3:"), problems[0]);
});
