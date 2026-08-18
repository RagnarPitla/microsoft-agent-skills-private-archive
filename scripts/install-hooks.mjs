#!/usr/bin/env node
// Installs the pre-commit scrub gate. Runs automatically on `npm install`.
import { writeFileSync, chmodSync, mkdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

try {
  const root = execSync("git rev-parse --show-toplevel").toString().trim();
  const dir = path.join(root, ".githooks");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const hook = path.join(dir, "pre-commit");
  writeFileSync(hook, `#!/bin/sh\nexec node "$(git rev-parse --show-toplevel)/scripts/scrub.mjs"\n`);
  chmodSync(hook, 0o755);
  execSync("git config core.hooksPath .githooks", { cwd: root });
  console.log("Pre-commit scrub gate installed.");
} catch (e) {
  console.warn("Could not install git hooks:", e.message);
}
