#!/usr/bin/env node
/**
 * Quality report.
 *
 * Aggregates the results of the repo's existing gates - the unit/fixture
 * test suite, the harness build-check, the structural validator, and the
 * freshness gate - plus the trigger-fixture pass rate from
 * tests/fixtures/trigger-cases.mjs, into one Markdown artifact.
 *
 * This script does not invent a new source of truth: every number in the
 * report comes from re-running the same scripts `npm run check` already
 * runs (as child processes, so their own exit codes are untouched) or, for
 * the trigger fixtures, from calling the same pure functions the test suite
 * calls. It exists so CI can publish a single human-readable artifact
 * instead of making a reviewer scroll through five separate log sections.
 *
 * Usage:
 *   node scripts/quality-report.mjs [--out <path>]
 *
 * Exits 1 (after still writing the report) if any underlying gate failed,
 * so a CI step can both upload the artifact and fail the job.
 */

import { spawnSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT, loadSkills } from "./lib/skills.mjs";
import { rankSkills } from "./lib/trigger-core.mjs";
import { TRIGGER_CASES } from "../tests/fixtures/trigger-cases.mjs";

const outArgIndex = process.argv.indexOf("--out");
const outPath = outArgIndex !== -1 && process.argv[outArgIndex + 1] ? process.argv[outArgIndex + 1] : "quality-report.md";

function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8" });
  const stdout = (result.stdout ?? "").trim();
  const stderr = (result.stderr ?? "").trim();
  const ok = result.status === 0;
  return { label, ok, stdout, stderr, status: result.status };
}

function parseTapSummary(tapOutput) {
  const get = (re) => {
    const m = tapOutput.match(re);
    return m ? Number(m[1]) : null;
  };
  return {
    tests: get(/^# tests (\d+)/m),
    pass: get(/^# pass (\d+)/m),
    fail: get(/^# fail (\d+)/m),
    cancelled: get(/^# cancelled (\d+)/m),
    skipped: get(/^# skipped (\d+)/m),
  };
}

// ------------------------------------------------------------------ gates

const testFiles = readdirSync(path.join(ROOT, "tests"))
  .filter((f) => f.endsWith(".test.mjs"))
  .map((f) => path.join("tests", f));
const testGate = run("Unit / fixture test suite", "node", ["--test", ...testFiles]);
const testSummary = parseTapSummary(testGate.stdout);

const buildGate = run("Harness build (--check)", "node", ["scripts/build-harnesses.mjs", "--check"]);
const validateGate = run("Structural validator", "node", ["scripts/validate-repo.mjs"]);
const freshnessGate = run("Freshness gate", "node", ["scripts/check-freshness.mjs"]);

// -------------------------------------------------------- trigger fixtures

const realSkills = loadSkills();
const modelInvoked = realSkills.filter((s) => !s.userInvoked);
const corpus = modelInvoked.map((s) => ({ name: s.name, description: s.description }));
const knownNames = new Set(modelInvoked.map((s) => s.name));

const coverageMissing = modelInvoked.filter((s) => !TRIGGER_CASES[s.name]).map((s) => s.name);
const coverageStale = Object.keys(TRIGGER_CASES).filter((name) => !knownNames.has(name));

let positiveTotal = 0;
let positivePass = 0;
let negativeTotal = 0;
let negativePass = 0;
const triggerFailures = [];

for (const [skillName, cases] of Object.entries(TRIGGER_CASES)) {
  if (!knownNames.has(skillName)) continue;
  for (const utterance of cases.positive ?? []) {
    positiveTotal++;
    const ranked = rankSkills(utterance, corpus);
    if (ranked[0]?.name === skillName) positivePass++;
    else triggerFailures.push(`positive "${utterance}" expected "${skillName}", got "${ranked[0]?.name}"`);
  }
  for (const utterance of cases.negative ?? []) {
    negativeTotal++;
    const ranked = rankSkills(utterance, corpus);
    if (ranked[0]?.name !== skillName) negativePass++;
    else triggerFailures.push(`negative "${utterance}" incorrectly ranked "${skillName}" first`);
  }
}

const triggerOk = coverageMissing.length === 0 && coverageStale.length === 0 && triggerFailures.length === 0;

// ------------------------------------------------------------------ render

const badge = (ok) => (ok ? "✅ pass" : "❌ fail");
const now = new Date().toISOString();

const lines = [];
lines.push("# Repository quality report");
lines.push("");
lines.push(`Generated ${now} by \`scripts/quality-report.mjs\`. Not committed - see \`.gitignore\`.`);
lines.push("");
lines.push("| Gate | Result |");
lines.push("| --- | --- |");
lines.push(`| Unit / fixture test suite | ${badge(testGate.ok)} |`);
lines.push(`| Harness build (\`--check\`) | ${badge(buildGate.ok)} |`);
lines.push(`| Structural validator | ${badge(validateGate.ok)} |`);
lines.push(`| Freshness gate | ${badge(freshnessGate.ok)} |`);
lines.push(`| Trigger fixtures | ${badge(triggerOk)} |`);
lines.push("");

lines.push("## Unit / fixture test suite");
lines.push("");
if (testSummary.tests !== null) {
  lines.push(
    `${testSummary.pass}/${testSummary.tests} passing` +
      (testSummary.fail ? `, **${testSummary.fail} failing**` : "") +
      (testSummary.cancelled ? `, ${testSummary.cancelled} cancelled` : "") +
      (testSummary.skipped ? `, ${testSummary.skipped} skipped` : "") +
      ` (${testFiles.length} file(s): ${testFiles.map((f) => path.basename(f)).join(", ")}).`,
  );
} else {
  lines.push("Could not parse a TAP summary from `node --test` output.");
}
if (!testGate.ok) lines.push("", "```", testGate.stderr || testGate.stdout, "```");
lines.push("");

lines.push("## Harness build check");
lines.push("");
lines.push(buildGate.stdout || buildGate.stderr || "(no output)");
lines.push("");

lines.push("## Structural validator");
lines.push("");
lines.push(validateGate.stdout || validateGate.stderr || "(no output)");
lines.push("");

lines.push("## Freshness gate");
lines.push("");
lines.push(freshnessGate.stdout || freshnessGate.stderr || "(no output)");
lines.push("");

lines.push("## Trigger fixtures");
lines.push("");
lines.push(
  `Positive cases: ${positivePass}/${positiveTotal} ranked their own skill first. ` +
    `Negative cases: ${negativePass}/${negativeTotal} correctly did not rank the paired skill first. ` +
    `Coverage: ${modelInvoked.length - coverageMissing.length}/${modelInvoked.length} model-invoked skill(s) have fixture cases.`,
);
if (coverageMissing.length) lines.push("", `Missing fixtures for: ${coverageMissing.join(", ")}`);
if (coverageStale.length) lines.push("", `Fixture references unknown skill(s): ${coverageStale.join(", ")}`);
if (triggerFailures.length) {
  lines.push("", "Failures:");
  for (const f of triggerFailures) lines.push(`- ${f}`);
}
lines.push("");
lines.push(
  "> This is a deterministic keyword-overlap smoke test against skill descriptions, not a simulation of real " +
    "LLM routing judgement - see `scripts/lib/trigger-core.mjs`. It exists to catch a description regressing " +
    "to the point that it no longer distinguishes itself from a neighbour, not to prove routing correctness.",
);
lines.push("");

const report = lines.join("\n");
writeFileSync(path.join(ROOT, outPath), report, "utf8");

const allOk = testGate.ok && buildGate.ok && validateGate.ok && freshnessGate.ok && triggerOk;
console.log(`Quality report written to ${outPath}. Overall: ${allOk ? "PASS" : "FAIL"}.`);
if (!allOk) process.exit(1);
