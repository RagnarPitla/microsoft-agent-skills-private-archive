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
  const sources = [];

  const p = path.join(root, ".scrub-denylist.txt");
  if (existsSync(p)) sources.push(readFileSync(p, "utf8"));

  // Trusted CI supplies this as a secret. It is never written to disk - read
  // straight from the environment and discarded when the process exits.
  if (process.env.SCRUB_DENYLIST) sources.push(process.env.SCRUB_DENYLIST);

  return {
    rules: sources.flatMap(parseDenylist),
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
  const { rules: denylistRules, hasFile, hasEnv } = loadDenylist();
  const rules = [...STRUCTURAL, ...denylistRules];
  const findings = [];
  const images = [];

  for (const rel of filesToScan()) {
    if (rel.startsWith(".scrub-denylist")) continue;
    // These deliberately contain pattern-shaped fixture strings (GUIDs, a fake
    // PEM header, "Microsoft Confidential", etc.) to prove the scanner catches
    // them. None of it is real: it exists to test scanFileText/STRUCTURAL, the
    // same way scrub.mjs and scrub-core.mjs already exclude their own source.
    if (rel === "scripts/scrub.mjs" || rel === "scripts/lib/scrub-core.mjs" || rel === "tests/scrub-core.test.mjs") continue;
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
  return { findings, images, hasFile, hasEnv, denylistCount: denylistRules.length };
}

const { findings, images, hasFile, hasEnv, denylistCount } = scan();
const denylistSupplied = hasFile || hasEnv;

if (!denylistSupplied) {
  if (requireDenylist) {
    console.error("Scrub gate FAILED: --require-denylist was set, but no denylist was supplied.");
    console.error("Neither .scrub-denylist.txt nor the SCRUB_DENYLIST environment variable was present.");
    console.error("This run is treated as trusted (main/schedule/release), where the denylist is mandatory.");
    process.exit(1);
  }
  console.warn("WARNING: no denylist found (.scrub-denylist.txt or SCRUB_DENYLIST). Structural checks ran, but");
  console.warn("customer names and internal codenames were NOT checked.");
  console.warn("Copy .scrub-denylist.example.txt to .scrub-denylist.txt and fill it in, or set SCRUB_DENYLIST.\n");
}

if (images.length) {
  console.warn(`MANUAL CHECK: ${images.length} image/video file(s) cannot be scanned automatically.`);
  console.warn("Open each and read the tab titles, address bar, notifications and any data in frame:");
  images.slice(0, 20).forEach((f) => console.warn(`  ${f}`));
  console.warn("");
}

if (findings.length === 0) {
  const mode = denylistSupplied
    ? `structural checks plus ${denylistCount} denylist term(s)`
    : "structural checks only - no denylist supplied";
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
