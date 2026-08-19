#!/usr/bin/env node
/**
 * Refresh the point-in-time facts in registry/microsoft-ecosystem.yaml.
 *
 * Star counts and archive flags are the only numbers in this repository that go
 * stale on their own, without anybody touching a file. A public index whose
 * numbers are a year out of date reads as abandoned, and a repo we call "active"
 * that GitHub has since archived is a factual error we published.
 *
 * So they are not hand-maintained. This script asks GitHub and rewrites the file:
 *
 *   npm run refresh:stars            rewrite stars, archive state and verified_on
 *   npm run refresh:stars -- --check exit 1 if anything drifted, write nothing
 *
 * --check is what CI runs. It does not fail on small star drift, because stars
 * move every day and a red build every morning trains people to ignore red
 * builds. It fails on the things that are actually wrong: a repo that has been
 * archived, renamed, made private or deleted, or a count that has drifted far
 * enough that citing it would misrepresent the project.
 *
 * Auth: uses `gh` if you are logged in, otherwise unauthenticated (60 req/hr,
 * which is enough for this registry but will rate-limit if you loop it).
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = path.join(ROOT, "registry/microsoft-ecosystem.yaml");

// Past this fraction of change, the published number is no longer a fair
// description of the project and --check should fail rather than shrug.
const DRIFT_TOLERANCE = 0.15;

const checkOnly = process.argv.includes("--check");

function ghToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

async function fetchRepo(fullName, token) {
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "microsoft-agent-skills-refresh-stars",
  };
  if (token) headers.authorization = `Bearer ${token}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers });

    if (res.status === 403 || res.status === 429) {
      const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
      const waitMs = Number.isFinite(reset) ? reset - Date.now() : 60_000;
      if (waitMs > 0 && waitMs < 120_000 && attempt < 2) {
        await new Promise((r) => setTimeout(r, waitMs + 1000));
        continue;
      }
      return { error: `rate limited (${res.status}) - set GITHUB_TOKEN or run \`gh auth login\`` };
    }

    // A registry entry that 404s is the single worst failure mode for this
    // file, so say so plainly rather than folding it into a generic error.
    if (res.status === 404) return { error: "not found - renamed, deleted or made private" };
    if (!res.ok) return { error: `HTTP ${res.status}` };

    const body = await res.json();
    return {
      stars: body.stargazers_count,
      archived: body.archived,
      // GitHub silently follows renames. If we asked for A and got B, the
      // registry is citing a name that no longer exists.
      movedTo: body.full_name.toLowerCase() === fullName.toLowerCase() ? null : body.full_name,
    };
  }
  return { error: "gave up after retries" };
}

const original = readFileSync(REGISTRY, "utf8");
const lines = original.split("\n");

// Deliberately a line-oriented rewrite rather than a YAML round-trip: this file
// is 90% prose comments explaining each verdict, and every YAML serialiser in
// the ecosystem throws those away. Preserving the reasoning matters more than
// structural purity.
const entries = [];
lines.forEach((line, i) => {
  const nameMatch = /^\s*-\s+name:\s+(\S+)\s*$/.exec(line);
  if (!nameMatch) return;
  const name = nameMatch[1];
  if (!name.includes("/")) return;

  let starLine = null;
  for (let j = i + 1; j < lines.length && !/^\s*-\s+name:/.test(lines[j]); j += 1) {
    if (/^\s*stars:\s+\d+\s*$/.test(lines[j])) {
      starLine = j;
      break;
    }
  }
  if (starLine !== null) {
    entries.push({ name, starLine, current: Number(/(\d+)/.exec(lines[starLine])[1]) });
  }
});

if (entries.length === 0) {
  console.error("No star-bearing entries found. Has the registry format changed?");
  process.exit(1);
}

const token = ghToken();
console.log(
  `Checking ${entries.length} repositories${token ? "" : " unauthenticated (60/hr limit)"}...`,
);

const problems = [];
const drifted = [];
let updated = 0;

for (const entry of entries) {
  const result = await fetchRepo(entry.name, token);

  if (result.error) {
    problems.push(`${entry.name}: ${result.error}`);
    continue;
  }
  if (result.movedTo) {
    problems.push(`${entry.name}: renamed to ${result.movedTo} - update name and url`);
  }
  if (result.archived) {
    problems.push(`${entry.name}: archived by its owner - verdict should probably be \`rebuild\``);
  }

  if (result.stars !== entry.current) {
    const delta = Math.abs(result.stars - entry.current) / Math.max(entry.current, 1);
    if (delta > DRIFT_TOLERANCE) {
      drifted.push(
        `${entry.name}: ${entry.current} -> ${result.stars} (${(delta * 100).toFixed(0)}% off)`,
      );
    }
    lines[entry.starLine] = lines[entry.starLine].replace(/\d+\s*$/, String(result.stars));
    updated += 1;
  }
}

// Local date, not toISOString(). A `verified_on` a day ahead of the reader's
// calendar reads as a bug in the registry rather than a timezone in the tool.
const now = new Date();
const today = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
].join("-");
const verifiedIdx = lines.findIndex((l) => /^verified_on:/.test(l));
const verifiedStale = verifiedIdx !== -1 && !lines[verifiedIdx].includes(today);
if (verifiedIdx !== -1) lines[verifiedIdx] = `verified_on: ${today}`;

const next = lines.join("\n");

if (checkOnly) {
  for (const p of problems) console.error(`  broken:  ${p}`);
  for (const d of drifted) console.error(`  drifted: ${d}`);

  if (problems.length > 0 || drifted.length > 0) {
    console.error(`\nRun \`npm run refresh:stars\` and commit the result.`);
    process.exit(1);
  }
  console.log(
    `Registry accurate: ${entries.length} repositories reachable, no significant drift.` +
      (updated > 0 ? ` (${updated} within tolerance)` : ""),
  );
  process.exit(0);
}

for (const p of problems) console.error(`  needs a human: ${p}`);

if (next === original) {
  console.log(`Registry already current (${entries.length} repositories, verified ${today}).`);
} else {
  writeFileSync(REGISTRY, next);
  console.log(
    `Updated ${updated} star count(s)${verifiedStale ? ` and verified_on -> ${today}` : ""}.`,
  );
}

// Broken entries are not fixable from here - a rename needs a new url and a
// re-read of the `why`, an archive needs a fresh verdict. Fail so it is not
// silently committed as if the refresh had succeeded.
if (problems.length > 0) process.exit(1);
