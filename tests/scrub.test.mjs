/**
 * scrub.mjs
 *
 * This is the gate with an actual consequence: everything else here costs
 * credibility when it breaks, this one costs a disclosure. It has already had
 * one silent bypass, where a placeholder anywhere on a line suppressed every
 * rule on that line - a live credential could ship with the build green.
 *
 * So the cases below are split in two. The first half proves real secrets are
 * caught, including next to a placeholder. The second half proves placeholders
 * are not flagged, because a gate with false positives is a gate people disable,
 * and a disabled gate catches nothing at all.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { scratchRepo, scrub } from "./helpers.mjs";

const caught = (dir, rule) => {
  const result = scrub(dir);
  assert.equal(result.code, 1, `expected the scrub gate to fail.\n---\n${result.output}`);
  assert.match(result.output, new RegExp(`\\[${rule}\\]`));
  return result;
};

const clean = (dir) => {
  const result = scrub(dir);
  assert.equal(result.code, 0, `expected the scrub gate to pass.\n---\n${result.output}`);
  return result;
};

// ------------------------------------------------------------ real disclosures

test("a Dataverse environment URL is caught", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.write("notes.md", "The environment is at https://acmeretail.crm4.dynamics.com/main.aspx\n");
    s.stage();
  });
  caught(dir, "tenant-crm");
});

test("an Entra tenant domain is caught", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.write("notes.md", "Sign in as someone@acmeretail.onmicrosoft.com\n");
    s.stage();
  });
  caught(dir, "tenant-oms");
});

test("a GUID is caught", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.write("notes.md", "clientId: 3f2b8c71-4d5e-4a91-b6c2-9e0d17a4f8b3\n");
    s.stage();
  });
  caught(dir, "guid");
});

test("a bearer token is caught", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.write("notes.md", `Authorization: ${"Bear" + "er"} NOT-A-REAL-TOKEN-0000000000000\n`);
    s.stage();
  });
  caught(dir, "bearer");
});

test("a credential-shaped assignment is caught", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.write("notes.md", 'client_secret = "NOT-A-REAL-SECRET-000000000000"\n');
    s.stage();
  });
  caught(dir, "secret-kv");
});

test("a private key header is caught", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.write("notes.md", "-----BEGIN RSA PRIVATE KEY-----\n");
    s.stage();
  });
  caught(dir, "pem");
});

test("a baseline denylist term is caught", (t) => {
  // The committed baseline is what makes this gate mean anything in CI, where
  // the local denylist can never exist.
  const dir = scratchRepo(t, (s) => {
    s.write("notes.md", "Slide deck marked Internal use only, pasted in by accident.\n");
    s.stage();
  });
  const result = caught(dir, "denylist");
  assert.match(result.output, /\[redacted denylist match\]/, "a denylist hit must never echo the term it matched");
});

test("a local denylist term is caught, and never echoed", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.write(".scrub-denylist.txt", "# local\nnorthwind-traders\n");
    s.write("notes.md", "Rolled out for northwind-traders last quarter.\n");
    s.stage();
  });
  const result = caught(dir, "denylist");
  assert.doesNotMatch(result.output, /northwind-traders/, "the gate must not print the term it is protecting");
});

test("a real secret beside a placeholder is still caught", (t) => {
  // This is the regression test for the bypass that mattered. Testing the whole
  // line meant one placeholder disarmed every rule on it.
  const dir = scratchRepo(t, (s) => {
    s.write("notes.md", 'contoso demo: client_secret="NOT-A-REAL-SECRET-000000000000"\n');
    s.stage();
  });
  caught(dir, "secret-kv");
});

test("two secrets on one line are both reported", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.write(
      "notes.md",
      "ids: 3f2b8c71-4d5e-4a91-b6c2-9e0d17a4f8b3 and 8a1c4e02-77bd-4f36-9d51-2b6e0fca9317\n",
    );
    s.stage();
  });
  const result = scrub(dir);
  assert.equal(result.code, 1);
  assert.equal((result.output.match(/\[guid\]/g) ?? []).length, 2);
});

// -------------------------------------------------------------- fail closed

test("deleting the committed baseline denylist fails the gate", (t) => {
  // Without this, the check the README advertises most loudly degrades to a
  // structural-patterns-only no-op, silently, on the branch that matters.
  const dir = scratchRepo(t, (s) => s.remove(".scrub-baseline-denylist.txt"));
  const result = scrub(dir);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /\.scrub-baseline-denylist\.txt is missing or empty/);
});

test("emptying the committed baseline denylist fails the gate", (t) => {
  const dir = scratchRepo(t, (s) => s.write(".scrub-baseline-denylist.txt", "# everything commented out\n"));
  const result = scrub(dir);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /is missing or empty/);
});

test("a missing local denylist warns rather than failing", (t) => {
  // It can never exist in CI - the terms are themselves the disclosure - so a
  // hard failure here would be a permanent red build nobody is able to fix.
  const dir = scratchRepo(t);
  const result = clean(dir);
  assert.match(result.output, /customer names and internal codenames were NOT checked/);
});

// ------------------------------------------------------------- placeholders

test("documented placeholders are not flagged", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.write(
      "notes.md",
      [
        "Tenant: contoso.crm4.dynamics.com",
        "Site: https://fabrikam.sharepoint.com/sites/finance",
        "App ID: 00000000-0000-0000-0000-000000000000",
        "client_secret: <your-client-secret>",
        "Environment: {{ENVIRONMENT_URL}}",
        "Contact: someone@example.com",
      ].join("\n") + "\n",
    );
    s.stage();
  });
  clean(dir);
});

test("the repository as committed passes its own gate", (t) => {
  const dir = scratchRepo(t);
  clean(dir);
});
