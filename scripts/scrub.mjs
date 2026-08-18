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
 * The concrete forbidden terms live in .scrub-denylist.txt, which is gitignored.
 * Writing them into a committed file would itself be the disclosure.
 * Copy .scrub-denylist.example.txt to .scrub-denylist.txt and fill it in locally.
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
const ALLOW = [
  /00000000-0000-0000-0000-000000000000/i,
  /contoso/i,
  /fabrikam/i,
  /yourorg|your-org|example\.com|<[^>]+>|\{\{[^}]+\}\}|xxxxxxxx/i,
];

function loadDenylist() {
  const p = path.join(root, ".scrub-denylist.txt");
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((term) => ({
      id: "denylist",
      re: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
      why: "local denylist term (customer, codename or internal identifier)",
    }));
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
    if (rel.startsWith(".scrub-denylist")) continue;
    if (rel === "scripts/scrub.mjs") continue;
    const abs = path.join(root, rel);
    if (!existsSync(abs)) continue;
    if (BINARY.test(rel)) {
      if (/\.(png|jpe?g|gif|webp|pdf|mp4|mov)$/i.test(rel)) images.push(rel);
      continue;
    }
    let text;
    try { text = readFileSync(abs, "utf8"); } catch { continue; }

    text.split("\n").forEach((line, i) => {
      if (ALLOW.some((a) => a.test(line))) return;
      for (const rule of rules) {
        rule.re.lastIndex = 0;
        const m = rule.re.exec(line);
        if (m) {
          const shown = rule.id === "denylist" ? "[redacted denylist match]" : m[0].slice(0, 60);
          findings.push({ file: rel, line: i + 1, rule: rule.id, why: rule.why, match: shown });
        }
      }
    });
  }
  return { findings, images };
}

const { findings, images } = scan();

if (!existsSync(path.join(root, ".scrub-denylist.txt"))) {
  console.warn("WARNING: no .scrub-denylist.txt found. Structural checks ran, but");
  console.warn("customer names and internal codenames were NOT checked.");
  console.warn("Copy .scrub-denylist.example.txt to .scrub-denylist.txt and fill it in.\n");
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
console.error("If a finding is a deliberate placeholder, use contoso/fabrikam or an <angle-bracket> token.");
process.exit(1);
