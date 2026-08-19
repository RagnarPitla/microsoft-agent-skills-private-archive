#!/usr/bin/env node
/**
 * Freshness gate.
 *
 * Link-checking proves a URL still resolves; it says nothing about whether the
 * claim next to it is still true. This script is the other half: it finds
 * every `Verified as resolving on` (skills, docs pages) and `verified_on:`
 * (registries) date in the repo, and fails when today is past the review date
 * - the explicit `Review by`, or the default window documented in
 * .agents/freshness.md.
 *
 * Usage:
 *   node scripts/check-freshness.mjs
 *
 * The pure date logic lives in scripts/lib/freshness-core.mjs so it can be
 * unit tested without depending on the real clock or the filesystem.
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { ROOT, loadSkills, PROMOTED } from "./lib/skills.mjs";
import { parseVerifiedBlock, parseRegistryVerifiedOn, checkFreshness, DEFAULT_REVIEW_DAYS } from "./lib/freshness-core.mjs";

const read = (rel) => {
  const p = path.join(ROOT, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
};

const entries = [];

for (const skill of loadSkills()) {
  const found = parseVerifiedBlock(skill.body);
  if (found) entries.push({ label: skill.skillMdRel, ...found });

  if (skill.promoted) {
    const docsRel = `docs/${skill.bucket}/${skill.name}.md`;
    const docs = read(docsRel);
    if (docs) {
      const docsFound = parseVerifiedBlock(docs);
      if (docsFound) entries.push({ label: docsRel, ...docsFound });
    }
  }
}

for (const rel of ["registry/microsoft-ecosystem.yaml", "registry/connectors.yaml"]) {
  const text = read(rel);
  if (!text) continue;
  const verifiedOn = parseRegistryVerifiedOn(text);
  if (verifiedOn) entries.push({ label: rel, verifiedOn, reviewBy: null });
}

const today = new Date();
const problems = checkFreshness(entries, today);

if (problems.length) {
  console.error(`Freshness gate FAILED: ${problems.length} claim(s) past their review date:\n`);
  problems.forEach((p) => console.error(`  ${p}`));
  console.error("\nSee .agents/freshness.md for the convention and the default review window.");
  process.exit(1);
}

console.log(
  `Freshness gate passed: ${entries.length} dated claim(s) checked, all within their review window (default ${DEFAULT_REVIEW_DAYS} days).`,
);
