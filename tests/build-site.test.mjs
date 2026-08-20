/**
 * build-site.mjs
 *
 * The published site is the first thing a stranger sees, and both of its
 * generated parts come from the skills on disk: docs/index.html is the landing
 * page, docs/_data/skills.yml is what every per-skill page reads to know its
 * own title, invocation and neighbours. If `--check` ever stops noticing that
 * either has fallen behind, the site keeps advertising a set of skills the repo
 * no longer has, and nothing goes red. So every case here makes the site stale
 * in a different way and asserts the gate says so.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { scratchRepo, site, addSkill, REPO } from "./helpers.mjs";
import { parseInstallBlock, buildSite, buildSkillsData } from "../scripts/build-site.mjs";

const stale = (result, file) => {
  assert.equal(result.code, 1, `expected a non-zero exit.\n---\n${result.output}`);
  assert.match(result.output, /Site artefacts are out of date/);
  if (file) assert.match(result.output, new RegExp(`stale: ${file.replace(/[/.]/g, "\\$&")}`));
};

// --------------------------------------------------------------- staleness

test("the committed site matches the skills on disk", (t) => {
  const dir = scratchRepo(t);
  const r = site(dir, ["--check"]);
  assert.equal(r.code, 0, `expected the real repo to be up to date.\n---\n${r.output}`);
});

test("a hand-edited landing page is reported stale", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("docs/index.html", (text) => text.replace("Install", "Set up"));
  });
  stale(site(dir, ["--check"]), "docs/index.html");
});

test("a deleted landing page is reported stale", (t) => {
  const dir = scratchRepo(t, (s) => s.remove("docs/index.html"));
  stale(site(dir, ["--check"]), "docs/index.html");
});

test("a hand-edited skills data file is reported stale", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("docs/_data/skills.yml", (text) => text.replace(/bucket: "build"/, 'bucket: "learn"'));
  });
  stale(site(dir, ["--check"]), "docs/_data/skills.yml");
});

test("a deleted skills data file is reported stale", (t) => {
  const dir = scratchRepo(t, (s) => s.remove("docs/_data/skills.yml"));
  stale(site(dir, ["--check"]), "docs/_data/skills.yml");
});

test("a new skill added without a rebuild is reported stale", (t) => {
  const dir = scratchRepo(t, (s) => addSkill(s, { bucket: "build", name: "site-fixture-skill" }));
  stale(site(dir, ["--check"]));
});

test("a changed short description without a rebuild is reported stale", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("skills/deliver/de-slop/agents/openai.yaml", (text) =>
      text.replace(/short_description:.*/, "short_description: Something else entirely."),
    );
  });
  stale(site(dir, ["--check"]));
});

test("a changed install command without a rebuild is reported stale", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit(".agents/install-block.md", (text) =>
      text.replace("cp -r microsoft-agent-skills/.cursor/rules .cursor/", "cp -r microsoft-agent-skills/.cursor/rules ./"),
    );
  });
  stale(site(dir, ["--check"]), "docs/index.html");
});

test("a rebuild clears the staleness it reported", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.remove("docs/index.html");
    s.remove("docs/_data/skills.yml");
  });
  stale(site(dir, ["--check"]));
  assert.equal(site(dir).code, 0);
  assert.equal(site(dir, ["--check"]).code, 0);
});

// ------------------------------------------------------------ install block

test("install commands are parsed from the source of truth, not restated", () => {
  const parsed = parseInstallBlock(readFileSync(path.join(REPO, ".agents/install-block.md"), "utf8"));
  for (const harness of ["Claude Code", "GitHub Copilot", "Codex", "Cursor"]) {
    assert.ok(parsed.has(harness), `missing ${harness}`);
    assert.ok(parsed.get(harness)[0].length > 0, `${harness} has an empty command block`);
  }
});

test("every install command on the page appears verbatim in the source of truth", () => {
  const source = readFileSync(path.join(REPO, ".agents/install-block.md"), "utf8");
  const page = readFileSync(path.join(REPO, "docs/index.html"), "utf8");
  const commands = [...page.matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)].map((m) => m[1]);
  assert.ok(commands.length >= 4, "expected an install block per harness");
  for (const cmd of commands) {
    for (const line of cmd.split("\n")) {
      assert.ok(source.includes(line.trim()), `not in install-block.md: ${line}`);
    }
  }
});

// -------------------------------------------------------------- landing page

const oneSkill = (over = {}) => [
  {
    name: "a-skill",
    bucket: "build",
    promoted: true,
    userInvoked: false,
    displayName: "A skill",
    shortDescription: "Does a thing.",
    ...over,
  },
];

test("a skill links to its own page", () => {
  assert.match(buildSite(oneSkill(), new Map()), /href="build\/a-skill\.html"/);
});

test("invocation is shown, because it changes how you reach the skill", () => {
  assert.match(buildSite(oneSkill(), new Map()), /badge auto/);
  assert.match(buildSite(oneSkill({ userInvoked: true }), new Map()), /You invoke it/);
});

test("unpromoted skills stay off the page", () => {
  const html = buildSite(
    [...oneSkill(), { name: "hidden", bucket: "in-progress", promoted: false, userInvoked: false }],
    new Map(),
  );
  assert.doesNotMatch(html, /hidden/);
});

test("a description containing markup is escaped", () => {
  const html = buildSite(oneSkill({ shortDescription: 'Handles <script> & "quotes".' }), new Map());
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt; &amp; &quot;quotes&quot;/);
});

test("an empty bucket produces no heading", () => {
  assert.doesNotMatch(buildSite(oneSkill(), new Map()), /id="connect"/);
});

// --------------------------------------------------------------- skills data

const two = [
  { name: "a-skill", bucket: "build", promoted: true, userInvoked: false, displayName: "A skill", shortDescription: "First." },
  { name: "b-skill", bucket: "learn", promoted: true, userInvoked: true, displayName: "B skill", shortDescription: "Second." },
];

test("each skill knows the page it will be published at", () => {
  const yml = buildSkillsData(two);
  assert.match(yml, /url: "\/build\/a-skill\.html"/);
  assert.match(yml, /url: "\/learn\/b-skill\.html"/);
});

test("each skill points back at its own source, so a page can always be checked", () => {
  assert.match(buildSkillsData(two), /source: ".*\/blob\/main\/skills\/build\/a-skill\/SKILL\.md"/);
});

test("the chain has no previous at the start and no next at the end", () => {
  const yml = buildSkillsData(two);
  const [first, second] = yml.split("- name:").slice(1);
  assert.doesNotMatch(first, /prev:/);
  assert.match(first, /next: "B skill"/);
  assert.match(second, /prev: "A skill"/);
  assert.doesNotMatch(second, /next:/);
});

test("invocation carries through, so a page cannot advertise the wrong one", () => {
  const yml = buildSkillsData(two);
  assert.match(yml, /name: "a-skill"\n {2}title: "A skill"\n {2}short: "First\."\n {2}bucket: "build"\n {2}user_invoked: false/);
  assert.match(yml, /name: "b-skill"[\s\S]*?user_invoked: true/);
});

test("a lone skill still produces valid entries with no neighbours", () => {
  const yml = buildSkillsData(oneSkill());
  assert.doesNotMatch(yml, /prev:|next:/);
  assert.match(yml, /^- name: "a-skill"$/m);
});

test("unpromoted skills stay out of the data, so no page is generated for them", () => {
  const yml = buildSkillsData([...two, { name: "hidden", bucket: "in-progress", promoted: false, userInvoked: false }]);
  assert.doesNotMatch(yml, /hidden/);
});

test("a quote in a title cannot break the YAML", () => {
  const yml = buildSkillsData(oneSkill({ shortDescription: 'Says "hello" \\ loudly.' }));
  assert.match(yml, /short: "Says \\"hello\\" \\\\ loudly\."/);
});

test("the committed data file lists every promoted skill exactly once", () => {
  const yml = readFileSync(path.join(REPO, "docs/_data/skills.yml"), "utf8");
  const names = [...yml.matchAll(/^- name: "(.+?)"$/gm)].map((m) => m[1]);
  assert.equal(new Set(names).size, names.length, "a skill is listed twice");
  assert.ok(names.length >= 20, `expected the full set, got ${names.length}`);
});
