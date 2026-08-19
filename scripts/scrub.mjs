#!/usr/bin/env node
/**
 * Pre-publish scrub gate.
 *
 * This repo is authored on a machine that also holds customer engagement material
 * and Microsoft-internal content. Those live one directory away from clean source.
 * This gate exists so a copy-paste or a wandering `git add` cannot leak them.
 *
 * Usage:
 *   node scripts/scrub.mjs                 # scan tracked + staged files
 *   node scripts/scrub.mjs --all           # scan the whole working tree
 *   node scripts/scrub.mjs --history       # also scan full git history (slow) [not yet implemented]
 *   node scripts/scrub.mjs --require-denylist   # fail if no denylist source was supplied
 *
 * The concrete forbidden terms live in .scrub-denylist.txt, which is gitignored,
 * OR in the SCRUB_DENYLIST environment variable (same one-term-per-line format),
 * which is how trusted CI supplies the customer/codename denylist as a secret
 * without ever writing it to a file on disk. Writing them into a committed file
 * would itself be the disclosure - copy .scrub-denylist.example.txt to
 * .scrub-denylist.txt and fill it in locally, or set SCRUB_DENYLIST in CI.
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/skills.mjs";
import { STRUCTURAL, parseDenylist, scanFileText } from "./lib/scrub-core.mjs";

const root = ROOT ?? execSync("git rev-parse --show-toplevel").toString().trim();
const args = new Set(process.argv.slice(2));
const requireDenylist = args.has("--require-denylist") || process.env.SCRUB_REQUIRE_DENYLIST === "true";

function loadDenylist() {
  // Two layers, deliberately kept separate.
  //
  // The baseline is committed: every term in it is a *marking* that only ever
  // appears on internal material, so writing it down discloses nothing. It is
  // the only layer a fork pull request can have, since forks never receive
  // repository secrets, and it is what stops that path from being structural-only.
  const basePath = path.join(root, ".scrub-baseline-denylist.txt");
  const baselineRules = existsSync(basePath) ? parseDenylist(readFileSync(basePath, "utf8")) : [];

  // The private layer is the customer names and codenames. Naming them in the
  // repository would itself be the disclosure, so it is gitignored locally and
  // supplied as a secret in trusted CI.
  const sources = [];
  const p = path.join(root, ".scrub-denylist.txt");
  if (existsSync(p)) sources.push(readFileSync(p, "utf8"));

  // Trusted CI supplies this as a secret. It is never written to disk - read
  // straight from the environment and discarded when the process exits.
  if (process.env.SCRUB_DENYLIST) sources.push(process.env.SCRUB_DENYLIST);

  const privateRules = sources.flatMap(parseDenylist);

  return {
    rules: [...baselineRules, ...privateRules],
    baselineCount: baselineRules.length,
    baselineFound: existsSync(basePath),
    privateCount: privateRules.length,
    hasFile: existsSync(p),
    hasEnv: Boolean(process.env.SCRUB_DENYLIST),
  };
}

function filesToScan() {
  if (args.has("--all")) {
    return execSync("git ls-files --cached --others --exclude-standard", { cwd: root })
      .toString().split("\n").filter(Boolean);
  }
  const staged = execSync("git diff --cached --name-only --diff-filter=ACM", { cwd: root })
    .toString().split("\n").filter(Boolean);
  if (staged.length) return staged;
  return execSync("git ls-files", { cwd: root }).toString().split("\n").filter(Boolean);
}

const BINARY = /\.(png|jpe?g|gif|webp|pdf|zip|mp4|mov|woff2?|ico|docx?|xlsx?|pptx?)$/i;

function scan() {
  const { rules: denylistRules, hasFile, hasEnv, baselineCount, baselineFound, privateCount } = loadDenylist();
  const rules = [...STRUCTURAL, ...denylistRules];
  const findings = [];
  const images = [];

  for (const rel of filesToScan()) {
    // A denylist file is a list of the very terms the scanner looks for, so
    // scanning it always flags every entry. Matched on the `.scrub-` prefix
    // rather than an exact name because the two denylists this repo carries
    // are named `.scrub-denylist*` and `.scrub-baseline-denylist*`, and an
    // exemption that covers only one of them turns the other into a permanent
    // self-inflicted failure.
    if (/^\.scrub-[a-z-]*denylist/.test(rel)) continue;
    // These deliberately contain pattern-shaped fixture strings (GUIDs, a fake
    // PEM header, "Microsoft Confidential", etc.) to prove the scanner catches
    // them. None of it is real: it exists to test scanFileText/STRUCTURAL, the
    // same way scrub.mjs and scrub-core.mjs already exclude their own source.
    //
    // Kept as an explicit file list rather than a `tests/` glob on purpose. A
    // glob would exempt every future test file from the secret scan, and the
    // point of this gate is that nothing gets a standing exemption by virtue of
    // where it lives. Adding a path here should feel like a decision.
    const SELF_EXEMPT = [
      "scripts/scrub.mjs",
      "scripts/lib/scrub-core.mjs",
      "tests/scrub-core.test.mjs",
      "tests/scrub.test.mjs",
    ];
    if (SELF_EXEMPT.includes(rel)) continue;
    const abs = path.join(root, rel);
    if (!existsSync(abs)) continue;
    if (BINARY.test(rel)) {
      if (/\.(png|jpe?g|gif|webp|pdf|mp4|mov)$/i.test(rel)) images.push(rel);
      continue;
    }
    let text;
    try { text = readFileSync(abs, "utf8"); } catch { continue; }

    findings.push(...scanFileText(rel, text, rules));
  }
  return { findings, images, hasFile, hasEnv, denylistCount: denylistRules.length, baselineCount, baselineFound, privateCount };
}

const { findings, images, hasFile, hasEnv, denylistCount, baselineCount, baselineFound, privateCount } = scan();

// The committed baseline is the layer that survives into a fork pull request,
// so it failing quietly would take the only real term coverage that path has
// with it. Its own header promises this is enforced; this is that enforcement.
if (!baselineCount) {
  console.error(
    baselineFound
      ? "Scrub gate FAILED: .scrub-baseline-denylist.txt is present but empty (every line blank or commented out)."
      : "Scrub gate FAILED: .scrub-baseline-denylist.txt is missing.",
  );
  console.error("It is committed on purpose and is the only denylist layer a fork pull request can use.");
  process.exit(1);
}

// Presence of a file is not protection. A copied-but-unfilled .scrub-denylist.txt
// (every line still commented out) used to count as "supplied", so the gate
// reported a clean pass while checking no customer names at all -- identical
// output to a run that genuinely enforced them, which is the one thing the
// trusted path must never do. Supplied means it actually contributes terms.
const denylistPresent = hasFile || hasEnv;
const denylistSupplied = privateCount > 0;

if (!denylistSupplied) {
  const emptySource = denylistPresent
    ? "A denylist was found, but it contains no usable terms (every line is blank or commented out)."
    : "Neither .scrub-denylist.txt nor the SCRUB_DENYLIST environment variable was present.";

  if (requireDenylist) {
    console.error("Scrub gate FAILED: --require-denylist was set, but no denylist terms were loaded.");
    console.error(emptySource);
    console.error("This run is treated as trusted (main/schedule/release), where the denylist is mandatory.");
    console.error("");
    console.error("To fix in CI: add a repository secret named SCRUB_DENYLIST containing one term per");
    console.error("line (customer names, codenames, internal identifiers). Settings > Secrets and");
    console.error("variables > Actions > New repository secret. The secret is never echoed: a match");
    console.error("is reported as [redacted denylist match] with the term withheld.");
    console.error("To fix locally: copy .scrub-denylist.example.txt to .scrub-denylist.txt and fill it in.");
    process.exit(1);
  }
  console.warn(`WARNING: no customer/codename denylist terms loaded. ${emptySource}`);
  console.warn(`The ${baselineCount} committed baseline term(s) still ran, but customer names and`);
  console.warn("internal codenames were NOT checked.");
  console.warn("Copy .scrub-denylist.example.txt to .scrub-denylist.txt and fill it in, or set SCRUB_DENYLIST.\n");
}

if (images.length) {
  console.warn(`MANUAL CHECK: ${images.length} image/video file(s) cannot be scanned automatically.`);
  console.warn("Open each and read the tab titles, address bar, notifications and any data in frame:");
  images.slice(0, 20).forEach((f) => console.warn(`  ${f}`));
  console.warn("");
}

if (findings.length === 0) {
  // Report the layers separately. "12 denylist terms" reads as full protection
  // even when every one of them came from the committed baseline and no
  // customer name was ever checked.
  const mode = denylistSupplied
    ? `structural checks plus ${baselineCount} baseline and ${privateCount} customer/codename term(s)`
    : `structural checks plus ${baselineCount} baseline term(s) only - no customer/codename denylist supplied`;
  console.log(`Scrub gate passed (${mode}). Remember: automated checks cannot catch a paraphrased`);
  console.log("customer story. Re-read .agents/confidentiality.md before publishing.");
  process.exit(0);
}

console.error(`Scrub gate FAILED with ${findings.length} finding(s):\n`);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  [${f.rule}] ${f.why}`);
  console.error(`      ${f.match}`);
}
console.error("\nNothing is published until these are resolved.");
console.error("If a finding is a deliberate placeholder, the placeholder must be the flagged value");
console.error("itself -- contoso/fabrikam/<angle-bracket>. A placeholder elsewhere on the line does not count.");
process.exit(1);
