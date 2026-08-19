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

// ------------------------------------------------------- denylist fails closed

// A copied-but-unfilled .scrub-denylist.txt counted as "supplied" purely because
// the file existed, so the gate reported a clean pass having checked no customer
// names at all - and --require-denylist, the trusted CI path, passed too. That is
// the exact failure the workflow comments call worse than no check at all,
// because a silently-skipped run looks identical to an enforced one.

test("a denylist that exists but has no usable terms still warns", (t) => {
  const dir = scratchRepo(t, (s) => s.write(".scrub-denylist.txt", "# every line commented out\n\n"));
  const result = scrub(dir);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /no usable terms/);
  assert.match(result.output, /were NOT checked/);
});

test("an unfilled denylist fails the trusted gate", (t) => {
  const dir = scratchRepo(t, (s) => s.write(".scrub-denylist.txt", "# every line commented out\n\n"));
  const result = scrub(dir, ["--require-denylist"]);
  assert.equal(result.code, 1, `an empty denylist must not satisfy --require-denylist.\n---\n${result.output}`);
  assert.match(result.output, /no denylist terms were loaded/);
});

test("a missing denylist fails the trusted gate", (t) => {
  const dir = scratchRepo(t, (s) => s.remove(".scrub-denylist.txt"));
  const result = scrub(dir, ["--require-denylist"]);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /Neither \.scrub-denylist\.txt nor the SCRUB_DENYLIST/);
});

test("a supplied denylist term is matched and never echoed", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.write(".scrub-denylist.txt", "zzconfidentialcorp\n");
    s.write("notes.md", "Pasted from a deck: zzconfidentialcorp rollout plan.\n");
    s.stage();
  });
  const result = caught(dir, "denylist");
  assert.match(result.output, /\[redacted denylist match\]/, "a denylist hit must never echo the term it matched");
  assert.doesNotMatch(result.output, /zzconfidentialcorp/, "the term itself must never reach the log");
});

// The committed baseline is the only denylist layer a fork pull request can
// have, so it failing open would make that path structural-only in silence.

test("a baseline denylist term is caught", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.write(".scrub-baseline-denylist.txt", "zzbaselinemarking\n");
    s.write("notes.md", "Slide footer: zzbaselinemarking, pasted in by accident.\n");
    s.stage();
  });
  const result = caught(dir, "denylist");
  assert.match(result.output, /\[redacted denylist match\]/, "a denylist hit must never echo the term it matched");
});

test("deleting the committed baseline denylist fails the gate", (t) => {
  const dir = scratchRepo(t, (s) => s.remove(".scrub-baseline-denylist.txt"));
  const result = scrub(dir);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /\.scrub-baseline-denylist\.txt is missing/);
});

test("emptying the committed baseline denylist fails the gate", (t) => {
  const dir = scratchRepo(t, (s) => s.write(".scrub-baseline-denylist.txt", "# everything commented out\n"));
  const result = scrub(dir);
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /is present but empty/);
});
