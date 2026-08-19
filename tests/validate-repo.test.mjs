/**
 * validate-repo.mjs
 *
 * Every case here breaks one thing and asserts the validator says so. The
 * control case - that the real repository passes - is the last test, because on
 * its own it proves nothing: a validator that always exits 0 would pass it.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { scratchRepo, validate, addSkill, promote } from "./helpers.mjs";

const failsWith = (result, fragment) => {
  assert.equal(result.code, 1, `expected a non-zero exit.\n---\n${result.output}`);
  assert.match(result.output, fragment);
};

// ---------------------------------------------------------- sync obligations
// Five obligations, five ways to forget one. Each is enforced rather than
// documented precisely because a promoted skill that is missing from one surface
// is invisible in a way nobody notices for months.

test("a promoted skill missing from README.md fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("README.md", (text) =>
      text.replace(/^- \[write-a-skill\].*$/m, "- write-a-skill - fixture removed the link."),
    );
  });
  failsWith(validate(dir), /write-a-skill: promoted but not linked from README\.md/);
});

test("a promoted skill missing from plugin.json fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit(".claude-plugin/plugin.json", (text) => {
      const json = JSON.parse(text);
      json.skills = json.skills.filter((p) => !p.includes("write-a-skill"));
      return JSON.stringify(json, null, 2) + "\n";
    });
  });
  failsWith(validate(dir), /write-a-skill: promoted but missing from \.claude-plugin\/plugin\.json/);
});

test("a promoted skill with no docs page fails", (t) => {
  const dir = scratchRepo(t, (s) => s.remove("docs/build/write-a-skill.md"));
  failsWith(validate(dir), /write-a-skill: promoted but has no docs page/);
});

test("a promoted skill missing from its bucket README fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("skills/build/README.md", (text) => text.replace(/^- \[write-a-skill\].*$/m, "- write-a-skill"));
  });
  failsWith(validate(dir), /write-a-skill: not listed in skills\/build\/README\.md/);
});

test("a docs page with no surviving skill fails", (t) => {
  const dir = scratchRepo(t, (s) => s.write("docs/build/deleted-skill.md", "# gone\n"));
  failsWith(validate(dir), /docs\/build\/deleted-skill\.md has no matching skill/);
});

test("a docs page missing one of its four sections fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("docs/build/write-a-skill.md", (text) => text.replace("It's working if", "You will know it worked when"));
  });
  failsWith(validate(dir), /missing the "It's working if" section/);
});

test("a non-promoted skill that leaks into public surface area fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    const skill = addSkill(s, { bucket: "in-progress", name: "beta-skill" });
    s.write("skills/in-progress/README.md", "# in-progress\n\n- [beta-skill](./beta-skill/SKILL.md) - fixture.\n");
    promote(s, skill);
  });
  const result = validate(dir);
  assert.equal(result.code, 1);
  assert.match(result.output, /beta-skill: in non-promoted bucket "in-progress" but linked from README\.md/);
  assert.match(result.output, /beta-skill: in non-promoted bucket "in-progress" but listed in \.claude-plugin\/plugin\.json/);
  assert.match(result.output, /beta-skill: in non-promoted bucket "in-progress" but has a docs page/);
});

// -------------------------------------------------------------- descriptions
// The description is the only text a model sees when deciding whether to load a
// skill. Getting it wrong is silent - the skill is simply never reached for - so
// these are the checks most worth proving still bite.

test("a summary-shaped description fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.setFrontMatter(
      "skills/build/write-a-skill/SKILL.md",
      "description",
      "This skill covers everything about writing skills, including descriptions, invocation, scope and the review checklist you should apply. Use when writing a skill.",
    );
  });
  failsWith(validate(dir), /description opens like a summary/);
});

test("a model-invoked description with no \"Use when\" clause fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.setFrontMatter(
      "skills/build/write-a-skill/SKILL.md",
      "description",
      "Write or repair an agent skill so that it fires at the right moment and stays quiet the rest of the time, covering descriptions, invocation model, scope and review.",
    );
  });
  failsWith(validate(dir), /has no "Use when" clause/);
});

test("a sub-150-character model-invoked description fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.setFrontMatter("skills/build/write-a-skill/SKILL.md", "description", "Write a skill. Use when writing one.");
  });
  failsWith(validate(dir), /is only 36 characters/);
});

test("a short description on a user-invoked skill is allowed", (t) => {
  // The inverse of the rule above, and worth pinning: a human picks these from a
  // list, so a menu label is correct and must not be dragged into the model-
  // invoked standard by a well-meaning tightening of the check.
  const dir = scratchRepo(t, (s) => {
    s.setFrontMatter("skills/deliver/discovery/SKILL.md", "description", "A structured interview before you build.");
  });
  const result = validate(dir);
  assert.equal(result.code, 0, result.output);
});

// ---------------------------------------------------------------- invocation

test("a user-invoked skill invoked by another skill fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("skills/build/write-a-skill/SKILL.md", (text) => `${text}\n\nInvoke the \`discovery\` skill.\n`);
  });
  failsWith(validate(dir), /invokes user-invoked skill "discovery"/);
});

test("a skill that declares no invocation policy fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.write(
      "skills/build/write-a-skill/agents/openai.yaml",
      'interface:\n  display_name: "write-a-skill"\n  short_description: "write a skill"\n',
    );
  });
  failsWith(validate(dir), /must state policy\.allow_implicit_invocation: true/);
});

test("front matter and openai.yaml disagreeing about invocation fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("skills/deliver/discovery/agents/openai.yaml", (t2) =>
      t2.replace("allow_implicit_invocation: false", "allow_implicit_invocation: true"),
    );
  });
  failsWith(validate(dir), /must set policy\.allow_implicit_invocation: false/);
});

// ------------------------------------------------------------------ the router

test("a promoted skill the router never mentions fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    const skill = addSkill(s, { bucket: "build", name: "fixture-skill" });
    promote(s, skill);
    s.edit("skills/deliver/ask-ragnar/SKILL.md", (text) =>
      text.replace(/\n- `fixture-skill` - fixture route\.\n/, "\n"),
    );
  });
  failsWith(validate(dir), /ask-ragnar does not route to "fixture-skill"/);
});

// ----------------------------------------------------------------- freshness

test("a skill with no verified_on fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("skills/build/write-a-skill/SKILL.md", (text) => text.replace(/^verified_on:.*\n/m, ""));
  });
  failsWith(validate(dir), /missing `verified_on: YYYY-MM-DD`/);
});

test("a malformed verified_on fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.setFrontMatter("skills/build/write-a-skill/SKILL.md", "verified_on", "August 2026");
  });
  failsWith(validate(dir), /malformed `verified_on`: expected YYYY-MM-DD/);
});

test("a future verified_on fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.setFrontMatter("skills/build/write-a-skill/SKILL.md", "verified_on", "2099-01-01");
  });
  failsWith(validate(dir), /is in the future/);
});

test("a skill with no provenance fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("skills/build/write-a-skill/SKILL.md", (text) => text.replace(/^provenance:.*\n/m, ""));
  });
  failsWith(validate(dir), /missing `provenance`/);
});

// ---------------------------------------------------------------- registries

test("a connector row missing a required field fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("registry/connectors.yaml", (text) => text.replace(/^ {4}watch_out:.*$/m, "    note: removed by fixture"));
  });
  failsWith(validate(dir), /missing required field `watch_out`/);
});

test("a connector naming a surface that does not exist fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("registry/connectors.yaml", (text) => text.replace(/^ {4}surfaces:.*$/m, "    surfaces: [copilot-studio, teams-premium]"));
  });
  failsWith(validate(dir), /surface "teams-premium" is not known/);
});

test("an ecosystem entry with an unknown verdict fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("registry/microsoft-ecosystem.yaml", (text) => text.replace(/^ {4}verdict:.*$/m, "    verdict: maybe"));
  });
  failsWith(validate(dir), /verdict "maybe" is not one of/);
});

test("a registry with no verified_on date fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("registry/connectors.yaml", (text) => text.replace(/^verified_on:.*$/m, "# date removed by fixture"));
  });
  failsWith(validate(dir), /missing or malformed `verified_on/);
});

// ------------------------------------------------------------- other promises

test("an install command that has drifted from the source of truth fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("README.md", (text) => text.replace("/plugin marketplace add", "/plugin marketplace install"));
  });
  failsWith(validate(dir), /does not carry this install command verbatim/);
});

test("a relative link to a file that does not exist fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("README.md", (text) => text.replace("## Buckets", "See [nothing](./docs/does-not-exist.md).\n\n## Buckets"));
  });
  failsWith(validate(dir), /references "\.\/docs\/does-not-exist\.md", which does not exist/);
});

test("a skill whose folder and front matter name disagree fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.setFrontMatter("skills/build/write-a-skill/SKILL.md", "name", "write-the-skill");
  });
  failsWith(validate(dir), /does not match its folder/);
});

// --------------------------------------------------------------- the control

test("the repository as committed passes", (t) => {
  const dir = scratchRepo(t);
  const result = validate(dir);
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /Repository validation passed/);
});

// ------------------------------------------------------------ docs site index

// docs/README.md is what .github/workflows/pages.yml publishes as the site's
// landing page, so drift here is invisible-to-readers breakage, not a private
// bookkeeping slip. It was unenforced through one merge and immediately lost
// four skills.

test("a promoted skill missing from the docs index fails", (t) => {
  const dir = scratchRepo(t, (s) => {
    s.edit("docs/README.md", (text) => text.replace(/^.*build\/write-a-skill\.md.*$/m, ""));
  });
  failsWith(validate(dir), /write-a-skill: promoted but not listed in docs\/README\.md/);
});

test("a missing docs index fails outright", (t) => {
  const dir = scratchRepo(t, (s) => s.remove("docs/README.md"));
  failsWith(validate(dir), /Missing docs\/README\.md/);
});
