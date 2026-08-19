#!/usr/bin/env node
/**
 * Pre-publish scrub gate.
 *
 * This repo is authored on a machine that also holds customer engagement material
 * and Microsoft-internal content. Those live one directory away from clean source.
 * This gate exists so a copy-paste or a wandering `git add` cannot leak them.
 *
 * Usage:
 *   node scripts/scrub.mjs              # scan tracked + staged files
 *   node scripts/scrub.mjs --all        # scan the whole working tree
 *   node scripts/scrub.mjs --history    # also scan full git history (slow)
 *
 * Two denylists, for two different threat models:
 *
 *   .scrub-baseline-denylist.txt   committed. Terms that are safe to publish
 *                                  because they are markings rather than
 *                                  secrets: "internal use only", "pre-release"
 *                                  and the like. This is what makes the gate
 *                                  mean something in CI, where the local file
 *                                  can never exist.
 *   .scrub-denylist.txt            gitignored. Customer names, codenames and
 *                                  internal identifiers. Writing these into a
 *                                  committed file would itself be the
 *                                  disclosure. Copy .scrub-denylist.example.txt
 *                                  and fill it in locally.
 *
 * The gate fails closed on the committed list: if .scrub-baseline-denylist.txt
 * is missing or empty the run exits non-zero rather than warning, because a
 * check that passes when its input is missing is not a check. The local list is
 * warned about instead - it can never exist in CI, and a permanent red build
 * nobody is able to fix is how a gate gets ignored.
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = execSync("git rev-parse --show-toplevel").toString().trim();
const args = new Set(process.argv.slice(2));

// Structural patterns. These are safe to commit because they describe a *shape*,
// not a secret. Each is something that is a disclosure regardless of its value.
const STRUCTURAL = [
  { id: "tenant-crm", re: /[a-z0-9-]+\.crm\d*\.dynamics\.com/gi, why: "Dataverse environment URL" },
  { id: "tenant-ops", re: /[a-z0-9-]+\.operations\.dynamics\.com/gi, why: "F&O environment URL" },
  { id: "tenant-sp", re: /[a-z0-9-]+\.sharepoint\.com/gi, why: "SharePoint tenant URL" },
  { id: "tenant-oms", re: /[a-z0-9-]+\.onmicrosoft\.com/gi, why: "Entra tenant domain" },
  { id: "guid", re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, why: "GUID: tenant, subscription, app or environment ID" },
  { id: "msft-email", re: /[a-z0-9._%+-]+@microsoft\.com/gi, why: "Microsoft corporate email address" },
  { id: "secret-kv", re: /\b(client_?secret|api_?key|password|connection_?string|sas_?token)\b\s*[:=]\s*["']?[^\s"'<>{}]{8,}/gi, why: "credential-shaped assignment" },
  { id: "bearer", re: /\bBearer\s+[A-Za-z0-9._-]{20,}/g, why: "bearer token" },
  { id: "pem", re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g, why: "private key" },
  { id: "ms-internal", re: /Microsoft Internal|Microsoft Confidential/gi, why: "explicit Microsoft internal marking" },
];

// Placeholders that look like hits but are deliberate documentation.
// These are tested against the MATCHED TEXT, never the whole line. Testing the
// line was a silent bypass: `client_secret=<real value>` on a line that also
// said "contoso", or any markdown line containing `<br>`, skipped every rule on
// that line. The gate reported clean while shipping a live credential.
const ALLOW = [
  /00000000-0000-0000-0000-000000000000/i,
  /contoso/i,
  /fabrikam/i,
  /yourorg|your-org|example\.com|<[^>]+>|\{\{[^}]+\}\}|xxxxxxxx/i,
];

const isPlaceholder = (matched) => ALLOW.some((a) => a.test(matched));

const BASELINE_DENYLIST = ".scrub-baseline-denylist.txt";
const LOCAL_DENYLIST = ".scrub-denylist.txt";

function readDenylistTerms(rel) {
  const p = path.join(root, rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function loadDenylist() {
  const rules = [];
  for (const [rel, why] of [
    [BASELINE_DENYLIST, "baseline denylist term (internal-only marking)"],
    [LOCAL_DENYLIST, "local denylist term (customer, codename or internal identifier)"],
  ]) {
    for (const term of readDenylistTerms(rel) ?? []) {
      rules.push({
        id: "denylist",
        re: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
        why,
      });
    }
  }
  return rules;
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
  const rules = [...STRUCTURAL, ...loadDenylist()];
  const findings = [];
  const images = [];

  for (const rel of filesToScan()) {
    if (rel.startsWith(".scrub-")) continue;
    // Two files hold the shapes on purpose: the gate itself, and the tests that
    // prove the gate still catches them. Exempting the suite is narrower than it
    // looks - it is one named file, and a real secret hidden there would be a
    // deliberate act rather than an accident, which is not this gate's job.
    if (rel === "scripts/scrub.mjs" || rel === "tests/scrub.test.mjs") continue;
    const abs = path.join(root, rel);
    if (!existsSync(abs)) continue;
    if (BINARY.test(rel)) {
      if (/\.(png|jpe?g|gif|webp|pdf|mp4|mov)$/i.test(rel)) images.push(rel);
      continue;
    }
    let text;
    try { text = readFileSync(abs, "utf8"); } catch { continue; }

    text.split("\n").forEach((line, i) => {
      for (const rule of rules) {
        rule.re.lastIndex = 0;
        // Every match on the line, not just the first: one real secret sitting
        // next to one placeholder must still fail.
        for (const m of line.matchAll(rule.re)) {
          if (isPlaceholder(m[0])) continue;
          const shown = rule.id === "denylist" ? "[redacted denylist match]" : m[0].slice(0, 60);
          findings.push({ file: rel, line: i + 1, rule: rule.id, why: rule.why, match: shown });
        }
      }
    });
  }
  return { findings, images };
}

const { findings, images } = scan();

// Fail closed. A denylist that is absent is not a denylist that found nothing,
// and this is the check the README advertises most loudly. The baseline list is
// committed precisely so this can be enforced on the branch that matters.
const baselineTerms = readDenylistTerms(BASELINE_DENYLIST);
const localTerms = readDenylistTerms(LOCAL_DENYLIST);

if (!baselineTerms?.length) {
  console.error(`Scrub gate FAILED: ${BASELINE_DENYLIST} is missing or empty.`);
  console.error("It is committed on purpose so this gate still checks something in CI.");
  console.error("Restore it rather than deleting the check it feeds.");
  process.exit(1);
}

if (!localTerms?.length) {
  console.warn(`No ${LOCAL_DENYLIST} terms found. Structural checks and the committed`);
  console.warn("baseline ran, but customer names and internal codenames were NOT checked.");
  console.warn(`Copy .scrub-denylist.example.txt to ${LOCAL_DENYLIST} and fill it in.\n`);
}

if (images.length) {
  console.warn(`MANUAL CHECK: ${images.length} image/video file(s) cannot be scanned automatically.`);
  console.warn("Open each and read the tab titles, address bar, notifications and any data in frame:");
  images.slice(0, 20).forEach((f) => console.warn(`  ${f}`));
  console.warn("");
}

if (findings.length === 0) {
  console.log("Scrub gate passed. Remember: automated checks cannot catch a paraphrased");
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
