/**
 * Pure scrub-gate logic, split out of scripts/scrub.mjs so it can be unit
 * tested against fixture strings without touching git or the filesystem.
 *
 * Nothing in this file reads a file, runs git, or calls process.exit - it
 * only takes text in and returns findings out. scripts/scrub.mjs is the thin
 * CLI wrapper that does the I/O and prints the report.
 */

// Structural patterns. These are safe to commit because they describe a *shape*,
// not a secret. Each is something that is a disclosure regardless of its value.
export const STRUCTURAL = [
  { id: "tenant-crm", re: /[a-z0-9-]+\.crm\d*\.dynamics\.com/gi, why: "Dataverse environment URL" },
  { id: "tenant-ops", re: /[a-z0-9-]+\.operations\.dynamics\.com/gi, why: "F&O environment URL" },
  { id: "tenant-sp", re: /[a-z0-9-]+\.sharepoint\.com/gi, why: "SharePoint tenant URL" },
  { id: "tenant-oms", re: /[a-z0-9-]+\.onmicrosoft\.com/gi, why: "Entra tenant domain" },
  { id: "guid", re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, why: "GUID: tenant, subscription, app or environment ID" },
  { id: "msft-email", re: /[a-z0-9._%+-]+@microsoft\.com/gi, why: "Microsoft corporate email address" },
  // AccountKey / SharedAccessKey / primaryKey are the tokens that actually carry
  // the secret inside an Azure connection string. A pasted Storage, Service Bus
  // or Cosmos connection string contains none of the words above, so without
  // these it sails straight through the gate - the single most likely secret to
  // land in a Microsoft-ecosystem repo. `;` is excluded from the value class
  // because connection strings are semicolon-delimited.
  { id: "secret-kv", re: /\b(client_?secret|api_?key|password|connection_?string|sas_?token|account_?key|shared_?access_?key|primary_?key|secondary_?key|access_?key)\b\s*[:=]\s*["']?[^\s"'<>{};]{8,}/gi, why: "credential-shaped assignment" },
  { id: "bearer", re: /\bBearer\s+[A-Za-z0-9._-]{20,}/g, why: "bearer token" },
  { id: "pem", re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g, why: "private key" },
  { id: "ms-internal", re: /Microsoft Internal|Microsoft Confidential/gi, why: "explicit Microsoft internal marking" },
];

// Placeholders that look like hits but are deliberate documentation.
// These are tested against the MATCHED TEXT, never the whole line. Testing the
// line was a silent bypass: `client_secret=<real value>` on a line that also
// said "contoso", or any markdown line containing `<br>`, skipped every rule on
// that line. The gate reported clean while shipping a live credential.
export const ALLOW = [
  /00000000-0000-0000-0000-000000000000/i,
  /contoso/i,
  /fabrikam/i,
  /yourorg|your-org|example\.com|<[^>]+>|\{\{[^}]+\}\}|xxxxxxxx/i,
];

export const BINARY = /\.(png|jpe?g|gif|webp|pdf|zip|mp4|mov|woff2?|ico|docx?|xlsx?|pptx?)$/i;
export const IMAGE_OR_VIDEO = /\.(png|jpe?g|gif|webp|pdf|mp4|mov)$/i;

export function isPlaceholder(matched) {
  return ALLOW.some((a) => a.test(matched));
}

/** Parse a denylist file's or env var's text into scrub rules. Blank lines and `#` comments are skipped. */
export function parseDenylist(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((term) => ({
      id: "denylist",
      re: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
      why: "local denylist term (customer, codename or internal identifier)",
    }));
}

/**
 * Scan one file's text content for findings.
 *
 * @param {string} rel - the file's path, used only to label findings.
 * @param {string} text - file content.
 * @param {Array} rules - STRUCTURAL plus any loaded denylist rules.
 * @returns {Array<{file, line, rule, why, match}>}
 */
export function scanFileText(rel, text, rules) {
  const findings = [];
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
  return findings;
}

/**
 * Scan a map of relative-path -> file content (or Buffer marker for binaries).
 * Binary/image files are collected separately for the manual-check warning
 * rather than scanned, since they cannot be regex-matched for text leaks.
 *
 * @param {Map<string,string>} files - rel path -> text content. Binary files
 *   should not be included here; pass their paths in `binaryPaths` instead.
 * @param {string[]} binaryPaths - rel paths of binary/image/video files present.
 * @param {Array} rules
 */
export function scanFiles(files, binaryPaths, rules) {
  const findings = [];
  const images = [];
  for (const rel of binaryPaths) {
    if (IMAGE_OR_VIDEO.test(rel)) images.push(rel);
  }
  for (const [rel, text] of files) {
    findings.push(...scanFileText(rel, text, rules));
  }
  return { findings, images };
}
