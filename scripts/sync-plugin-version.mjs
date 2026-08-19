#!/usr/bin/env node
/**
 * Keep the Claude plugin manifest's version in step with package.json.
 *
 * Changesets bumps package.json; the plugin manifest has to follow, or users
 * installing the plugin see a version that does not match the release notes.
 *
 * Usage:
 *   node scripts/sync-plugin-version.mjs           write the version across
 *   node scripts/sync-plugin-version.mjs --check   fail if they have drifted
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/skills.mjs";

const check = process.argv.includes("--check");

const pkgPath = path.join(ROOT, "package.json");
const pluginPath = path.join(ROOT, ".claude-plugin", "plugin.json");
const marketplacePath = path.join(ROOT, ".claude-plugin", "marketplace.json");

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const version = pkg.version;

if (!existsSync(pluginPath)) {
  console.error(`Missing ${path.relative(ROOT, pluginPath)}.`);
  console.error("The Claude plugin manifest is required; see AGENTS.md.");
  process.exit(1);
}

const problems = [];
const writes = [];

const plugin = JSON.parse(readFileSync(pluginPath, "utf8"));
if (plugin.version !== version) {
  problems.push(`.claude-plugin/plugin.json version ${plugin.version} != package.json ${version}`);
  plugin.version = version;
  writes.push([pluginPath, JSON.stringify(plugin, null, 2) + "\n"]);
}

if (existsSync(marketplacePath)) {
  const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
  let changed = false;
  for (const entry of marketplace.plugins ?? []) {
    if (entry.version && entry.version !== version) {
      problems.push(
        `.claude-plugin/marketplace.json plugin "${entry.name}" version ${entry.version} != ${version}`,
      );
      entry.version = version;
      changed = true;
    }
  }
  if (changed) writes.push([marketplacePath, JSON.stringify(marketplace, null, 2) + "\n"]);
}

if (check) {
  if (problems.length) {
    console.error("Plugin version is out of sync:\n");
    problems.forEach((p) => console.error(`  ${p}`));
    console.error("\nRun `node scripts/sync-plugin-version.mjs` and commit the result.");
    process.exit(1);
  }
  console.log(`Plugin version in sync (${version}).`);
  process.exit(0);
}

for (const [file, content] of writes) {
  writeFileSync(file, content, "utf8");
  console.log(`Updated ${path.relative(ROOT, file)} to ${version}.`);
}

if (!writes.length) console.log(`Plugin version already in sync (${version}).`);
