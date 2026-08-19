// Fixture-driven tests for scripts/lib/scrub-core.mjs: structural pattern
// matching, placeholder allowance, denylist parsing, multi-match-per-line
// scanning, and binary/image handling. All fixture text below is synthetic:
// no real tenant, customer or Microsoft-internal data.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STRUCTURAL,
  ALLOW,
  BINARY,
  IMAGE_OR_VIDEO,
  isPlaceholder,
  parseDenylist,
  scanFileText,
  scanFiles,
} from "../scripts/lib/scrub-core.mjs";

// -------------------------------------------------------------- STRUCTURAL patterns

test("STRUCTURAL flags a Dataverse tenant URL", () => {
  // "acmecorp" rather than "contoso": contoso is itself an allowed placeholder,
  // so a match containing it would be filtered before it reached this assertion.
  const findings = scanFileText("doc.md", "Environment: acmecorp.crm4.dynamics.com", STRUCTURAL);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "tenant-crm");
});

test("STRUCTURAL flags a SharePoint tenant URL", () => {
  const findings = scanFileText("doc.md", "Site: acmecorp.sharepoint.com/sites/demo", STRUCTURAL);
  assert.ok(findings.some((f) => f.rule === "tenant-sp"));
});

test("STRUCTURAL flags a bare GUID", () => {
  const findings = scanFileText("doc.md", "tenant id: 6b29fc40-ca47-1067-b31d-00dd010662da", STRUCTURAL);
  assert.ok(findings.some((f) => f.rule === "guid"));
});

test("STRUCTURAL flags a credential-shaped assignment", () => {
  const findings = scanFileText("doc.md", 'client_secret = "abcdefgh12345678"', STRUCTURAL);
  assert.ok(findings.some((f) => f.rule === "secret-kv"));
});

// Regression: the rule originally matched only client_secret/api_key/password/
// connection_string/sas_token. A real Azure connection string contains none of
// those words - the secret sits in AccountKey= or SharedAccessKey= - so pasted
// Storage, Service Bus and Cosmos strings passed the gate with exit 0. That is
// the most likely secret to reach a Microsoft-ecosystem repo.
for (const [label, text] of [
  ["Azure Storage", "DefaultEndpointsProtocol=https;AccountName=stg01;AccountKey=Zm9vYmFyYmF6cXV4MTIzNDU2Nzg5MGFiY2Rl;EndpointSuffix=core.windows.net"],
  ["Service Bus", "Endpoint=sb://bus.servicebus.windows.net/;SharedAccessKeyName=Root;SharedAccessKey=aB3dEfGhIjKlMnOpQrStUvWxYz0123456789"],
  ["Cosmos DB", "AccountEndpoint=https://c.documents.azure.com:443/;AccountKey=q1W2e3R4t5Y6u7I8o9P0aSdFgHjKlZxCvBnM;"],
]) {
  test(`STRUCTURAL flags the secret inside a pasted ${label} connection string`, () => {
    const findings = scanFileText("doc.md", text, STRUCTURAL);
    assert.ok(findings.some((f) => f.rule === "secret-kv"), `${label} connection string was not flagged`);
  });
}

test("a connection-string key set to a placeholder is still allowed", () => {
  assert.equal(scanFileText("doc.md", "AccountKey=<your-account-key>", STRUCTURAL).length, 0);
  assert.equal(scanFileText("doc.md", "AccountKey=contoso", STRUCTURAL).length, 0);
});

test("prose about account keys is not flagged", () => {
  const findings = scanFileText("doc.md", "Set the account key in Key Vault rather than in source.", STRUCTURAL);
  assert.equal(findings.length, 0);
});

test("STRUCTURAL flags a bearer token", () => {
  // Built at runtime from repeated characters, deliberately not a literal
  // secret-shaped string in source: a fake token exercising the regex shape.
  const fakeToken = "Bearer " + "a".repeat(24);
  const findings = scanFileText("doc.md", `Authorization: ${fakeToken}`, STRUCTURAL);
  assert.ok(findings.some((f) => f.rule === "bearer"));
});

test("STRUCTURAL flags a PEM private key header", () => {
  const findings = scanFileText("doc.md", "-----BEGIN RSA PRIVATE KEY-----", STRUCTURAL);
  assert.ok(findings.some((f) => f.rule === "pem"));
});

test("STRUCTURAL flags an explicit Microsoft internal marking", () => {
  const findings = scanFileText("doc.md", "Status: Microsoft Confidential", STRUCTURAL);
  assert.ok(findings.some((f) => f.rule === "ms-internal"));
});

test("STRUCTURAL does not flag ordinary prose with no sensitive shapes", () => {
  const findings = scanFileText("doc.md", "This is an ordinary sentence about agent skills.", STRUCTURAL);
  assert.deepEqual(findings, []);
});

// ---------------------------------------------------------------- placeholders

test("isPlaceholder allows the well-known zero GUID", () => {
  assert.equal(isPlaceholder("00000000-0000-0000-0000-000000000000"), true);
});

test("isPlaceholder allows contoso and fabrikam", () => {
  assert.equal(isPlaceholder("contoso"), true);
  assert.equal(isPlaceholder("fabrikam.sharepoint.com"), true);
});

test("isPlaceholder allows angle-bracket and mustache placeholders", () => {
  assert.equal(isPlaceholder("<your-tenant-id>"), true);
  assert.equal(isPlaceholder("{{TENANT_ID}}"), true);
});

test("isPlaceholder does not allow an arbitrary real-looking value", () => {
  assert.equal(isPlaceholder("acmecorp-prod"), false);
});

test("scanFileText skips a real-shaped match on a line when the placeholder is the matched text itself", () => {
  const findings = scanFileText("doc.md", "Tenant: contoso.onmicrosoft.com", STRUCTURAL);
  assert.deepEqual(findings, []);
});

test("scanFileText does NOT allow a placeholder elsewhere on the line to excuse a real match", () => {
  // The line contains "contoso" as an unrelated word, but the matched GUID
  // itself is not a placeholder, so it must still be flagged. Placeholder
  // exemption is checked against the match, never the whole line.
  const line = "contoso engagement notes: tenant id 6b29fc40-ca47-1067-b31d-00dd010662da";
  const findings = scanFileText("doc.md", line, STRUCTURAL);
  assert.ok(findings.some((f) => f.rule === "guid"));
});

// ----------------------------------------------------------------- multi-match

test("scanFileText reports every match on a line, not just the first", () => {
  const line = "ids: 6b29fc40-ca47-1067-b31d-00dd010662da and 3fa85f64-5717-4562-b3fc-2c963f66afa6";
  const findings = scanFileText("doc.md", line, STRUCTURAL);
  assert.equal(findings.filter((f) => f.rule === "guid").length, 2);
});

test("scanFileText flags a real secret sitting next to a placeholder on the same line", () => {
  const line = "example client_secret=contoso but prod client_secret=RealLookingSecretValue123";
  const findings = scanFileText("doc.md", line, STRUCTURAL);
  assert.ok(findings.some((f) => f.rule === "secret-kv" && f.match.includes("RealLookingSecretValue123")));
});

test("scanFileText reports the correct 1-based line number for a later match", () => {
  const text = "line one\nline two\nMicrosoft Confidential appears here";
  const findings = scanFileText("doc.md", text, STRUCTURAL);
  assert.equal(findings[0].line, 3);
});

// ------------------------------------------------------------------- denylist

test("parseDenylist turns each non-comment, non-blank line into a case-insensitive rule", () => {
  const rules = parseDenylist("# a comment\n\nProjectCodename\nAcmeCorp\n");
  assert.equal(rules.length, 2);
  assert.ok(rules.every((r) => r.id === "denylist"));
  assert.ok(rules[0].re.test("this mentions projectcodename in lowercase"));
});

test("parseDenylist returns an empty array for empty or absent text", () => {
  assert.deepEqual(parseDenylist(""), []);
  assert.deepEqual(parseDenylist(null), []);
  assert.deepEqual(parseDenylist(undefined), []);
});

test("parseDenylist escapes regex metacharacters in a term", () => {
  const rules = parseDenylist("acme.corp (internal)");
  assert.equal(rules.length, 1);
  assert.equal(rules[0].re.test("acme.corp (internal) mentioned here"), true);
  // A literal dot must not act as a wildcard: "acmeXcorp" should not match.
  assert.equal(rules[0].re.test("acmeXcorp (internal)"), false);
});

test("scanFileText redacts the shown match text for a denylist hit, unlike a structural hit", () => {
  const rules = parseDenylist("ProjectCodename");
  const findings = scanFileText("doc.md", "Working on ProjectCodename this week.", rules);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].match, "[redacted denylist match]");
});

test("scanFileText finds nothing when no denylist term is present (absence behaviour)", () => {
  const rules = parseDenylist("ProjectCodename");
  const findings = scanFileText("doc.md", "This document never mentions the forbidden term.", rules);
  assert.deepEqual(findings, []);
});

// -------------------------------------------------------------------- scanFiles

test("scanFiles aggregates findings across multiple files and separates image/video paths", () => {
  const files = new Map([
    ["a.md", "clean content"],
    ["b.md", "Microsoft Confidential"],
  ]);
  const { findings, images } = scanFiles(files, ["screenshot.png", "archive.zip"], STRUCTURAL);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, "b.md");
  assert.deepEqual(images, ["screenshot.png"]);
});

test("scanFiles returns no findings and no images for an all-clean, all-text fixture set", () => {
  const files = new Map([["a.md", "clean"], ["b.md", "also clean"]]);
  const { findings, images } = scanFiles(files, [], STRUCTURAL);
  assert.deepEqual(findings, []);
  assert.deepEqual(images, []);
});

// ------------------------------------------------------------------ BINARY / IMAGE_OR_VIDEO

test("BINARY matches common non-text extensions", () => {
  for (const f of ["photo.png", "deck.pptx", "archive.zip", "clip.mp4", "font.woff2"]) {
    assert.equal(BINARY.test(f), true, f);
  }
});

test("BINARY does not match text/markdown extensions", () => {
  for (const f of ["SKILL.md", "openai.yaml", "index.json", "script.mjs"]) {
    assert.equal(BINARY.test(f), false, f);
  }
});

test("IMAGE_OR_VIDEO matches images and video but not documents/archives", () => {
  assert.equal(IMAGE_OR_VIDEO.test("photo.png"), true);
  assert.equal(IMAGE_OR_VIDEO.test("clip.mov"), true);
  assert.equal(IMAGE_OR_VIDEO.test("archive.zip"), false);
  assert.equal(IMAGE_OR_VIDEO.test("deck.pptx"), false);
});

// ---------------------------------------------------------------------- ALLOW

test("ALLOW exports at least one pattern for each documented placeholder family", () => {
  assert.ok(ALLOW.length >= 3);
});
