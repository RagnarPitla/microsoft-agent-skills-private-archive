/**
 * Pure validation-rule logic, split out of scripts/validate-repo.mjs so each
 * rule can be unit tested against fixture strings/objects without touching
 * git, the filesystem, or the network. validate-repo.mjs is the thin CLI that
 * discovers real skills and files, calls these, and prints the report.
 *
 * Every function here returns an array of plain-string problems (empty when
 * the input is clean) rather than pushing to a shared `errors` array, so a
 * test can assert on exactly what one rule produces.
 */

// ---------------------------------------------------------------- skill shape

// The description is the whole ballgame for a model-invoked skill. It is the
// only text the model sees when deciding whether to load the body, so a
// description that summarises contents instead of naming the situation means
// the skill never fires - the most common way a good skill is wasted, and the
// failure write-a-skill exists to prevent. Enforced rather than merely
// documented, because it is the one rule where being wrong is silent.
//
// User-invoked skills are held to a different standard on purpose. Nothing
// matches them against a task: a human picks them from a list, so their
// description is a menu label and being short is correct.
const SUMMARY_OPENERS = /^(this skill|the skill|a skill|skill (for|that)|helps you|helps the|covers |provides |contains |documentation (for|on)|guidance (for|on)|everything you need)/i;

export function checkDescriptionIsTrigger(description, { userInvoked } = {}) {
  const problems = [];
  const d = (description ?? "").trim();

  // VS Code truncates past this, so anything beyond it is invisible.
  if (d.length > 1024) {
    problems.push(`description is ${d.length} characters; the limit is 1024 and the overflow is dropped.`);
  }

  if (SUMMARY_OPENERS.test(d)) {
    problems.push(`description opens like a summary ("${d.slice(0, 40)}..."). Say when to reach for it, not what it contains.`);
  }

  if (userInvoked) return problems;

  if (!/\buse when\b/i.test(d)) {
    problems.push(`model-invoked description has no "Use when" clause, so nothing tells the model which situation matches. See skills/build/write-a-skill/SKILL.md.`);
  }
  // Every trigger description in this repo that names real situations runs to
  // several hundred characters. One that fits in a tweet is a summary wearing
  // a "Use when" hat.
  if (d.length < 150) {
    problems.push(`model-invoked description is only ${d.length} characters. Name the concrete situations a reader would recognise, not the topic.`);
  }
  return problems;
}

/** folder/kebab-case and front-matter-name-matches-folder checks, factored for testability. */
export function checkSkillIdentity({ name, dirName }) {
  const problems = [];
  if (name !== dirName) {
    problems.push(`front matter name "${name}" does not match its folder "${dirName}".`);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(dirName)) {
    problems.push(`folder name "${dirName}" must be kebab-case.`);
  }
  return problems;
}

// ------------------------------------------------------------ sync obligations

/**
 * The sync obligations AGENTS.md promises for a promoted skill: linked from
 * the root README, listed in the plugin manifest, has a docs page, and is
 * listed in its bucket README. Non-promoted skills are held to the opposite
 * standard: they must NOT leak into any of those surfaces.
 *
 * @param {object} skill - { name, bucket, dirName, promoted }
 * @param {object} ctx
 * @param {string|null} ctx.rootReadme - contents of README.md, or null if missing
 * @param {string[]|null} ctx.pluginSkillPaths - the `skills` array from plugin.json, or null if missing
 * @param {string|null} ctx.bucketReadme - contents of skills/<bucket>/README.md, or null if missing
 * @param {boolean} ctx.docsPageExists - whether docs/<bucket>/<name>.md exists
 */
export function checkSyncObligations(skill, { rootReadme, pluginSkillPaths, bucketReadme, docsPageExists }) {
  const problems = [];
  const skillLink = `skills/${skill.bucket}/${skill.dirName}/SKILL.md`;
  const docsRel = `docs/${skill.bucket}/${skill.name}.md`;
  const bucketReadmeRel = `skills/${skill.bucket}/README.md`;

  if (skill.promoted) {
    if (rootReadme != null && !rootReadme.includes(skillLink)) {
      problems.push(`promoted but not linked from README.md (expected a link to ${skillLink}).`);
    }
    if (
      pluginSkillPaths &&
      !pluginSkillPaths.some((p) => p === skillLink || p === `./${skillLink}` || p.includes(`/${skill.dirName}`))
    ) {
      problems.push(`promoted but missing from .claude-plugin/plugin.json skills array.`);
    }
    if (!docsPageExists) {
      problems.push(`promoted but has no docs page at ${docsRel}.`);
    }
    if (bucketReadme == null) {
      problems.push(`missing ${bucketReadmeRel} for promoted bucket "${skill.bucket}".`);
    } else if (!bucketReadme.includes(skillLink) && !bucketReadme.includes(`./${skill.dirName}/SKILL.md`)) {
      problems.push(`not listed in ${bucketReadmeRel}.`);
    }
  } else {
    if (rootReadme != null && rootReadme.includes(skillLink)) {
      problems.push(`in non-promoted bucket "${skill.bucket}" but linked from README.md.`);
    }
    if (pluginSkillPaths && pluginSkillPaths.some((p) => p.includes(`/${skill.dirName}`))) {
      problems.push(`in non-promoted bucket "${skill.bucket}" but listed in .claude-plugin/plugin.json.`);
    }
    if (docsPageExists) {
      problems.push(`in non-promoted bucket "${skill.bucket}" but has a docs page at ${docsRel}.`);
    }
  }

  return problems;
}

/** docs/<bucket>/<name>.md must carry all four sections from .agents/writing-docs.md. */
export const DOCS_SECTIONS = ["What it does", "When to reach for it", "Common questions", "It's working if"];

export function checkDocsPageSections(text) {
  return DOCS_SECTIONS.filter((section) => !text.includes(section)).map(
    (section) => `missing the "${section}" section (.agents/writing-docs.md).`,
  );
}

/** Bucket README invocation-grouping rule: promoted buckets need the headings that apply, and only those. */
export function checkBucketReadmeGroups(readme, { promoted, hasUserInvoked, hasModelInvoked }) {
  const problems = [];
  if (promoted) {
    for (const [heading, required] of [
      ["User-invoked", hasUserInvoked],
      ["Model-invoked", hasModelInvoked],
    ]) {
      if (required && !readme.includes(heading)) {
        problems.push(`missing a "${heading}" section, but the bucket contains ${heading.toLowerCase()} skill(s).`);
      }
      if (!required && readme.includes(heading)) {
        problems.push(`has a "${heading}" section but no ${heading.toLowerCase()} skills. Drop the empty heading.`);
      }
    }
  } else if (readme.includes("User-invoked") || readme.includes("Model-invoked")) {
    problems.push(`is a non-promoted bucket and should use a flat list, not invocation groupings.`);
  }
  return problems;
}

// ------------------------------------------------------------------- registries

const SURFACES = new Set([
  "copilot-studio", "power-platform", "foundry", "m365-copilot",
  "microsoft-search", "custom",
  "github-copilot", "claude-code", "codex", "cursor",
]);
const CONNECTOR_REQUIRED = ["surfaces", "mechanism", "identity", "docs", "watch_out"];

/**
 * Connector entries are keyed by `system`, not `name`, so they need their own
 * schema. Deliberately line-based rather than a real YAML parse: the
 * pre-commit hook has to run on a fresh clone with no npm install.
 */
export function checkConnectorSchema(text) {
  const problems = [];
  const lines = text.split("\n");
  if (!lines.some((l) => /^verified_on:\s*\d{4}-\d{2}-\d{2}\s*$/.test(l))) {
    problems.push(`missing or malformed \`verified_on: YYYY-MM-DD\`. A registry with no date cannot be re-verified.`);
  }

  const entries = [];
  lines.forEach((line, i) => {
    const head = line.match(/^ {2}- system:\s*(.*)$/);
    if (head) {
      entries.push({ start: i, fields: new Map([["system", head[1].trim()]]) });
      return;
    }
    if (!entries.length) return;
    const m = line.match(/^ {4}([a-z_]+):\s*(.*)$/);
    if (m) entries[entries.length - 1].fields.set(m[1], m[2].trim());
  });

  if (!entries.length) {
    problems.push(`no connector entries found. Entries must start with "  - system:".`);
    return problems;
  }

  const seen = new Map();
  for (const e of entries) {
    const system = e.fields.get("system");
    const where = `line ${e.start + 1} (${system || "unnamed"})`;

    if (!system) problems.push(`${where}: \`system\` is empty.`);
    else if (seen.has(system)) problems.push(`${where}: duplicate system, already defined at line ${seen.get(system)}.`);
    else seen.set(system, e.start + 1);

    for (const k of CONNECTOR_REQUIRED) {
      if (!e.fields.has(k) || e.fields.get(k) === "") {
        problems.push(`${where}: missing required field \`${k}\`.`);
      }
    }

    const surfaces = e.fields.get("surfaces");
    if (surfaces) {
      const vals = surfaces.replace(/[[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
      if (!vals.length) problems.push(`${where}: \`surfaces\` is empty. Say where this connector can be reached from.`);
      for (const v of vals) {
        if (!SURFACES.has(v)) {
          problems.push(`${where}: surface "${v}" is not known. Expected one of ${[...SURFACES].join(", ")}.`);
        }
      }
    }

    const docs = e.fields.get("docs");
    if (docs && !/^https:\/\/\S+$/.test(docs)) {
      problems.push(`${where}: \`docs\` must be a single https URL, got "${docs}".`);
    }
  }

  return problems;
}

const VERDICTS = new Set(["route", "wrap", "rebuild"]);
const PROVENANCE = new Set(["official-microsoft", "microsoft-adjacent", "community"]);

/**
 * The registry is only useful if its entries are trustworthy, and link-checking
 * proves nothing about the fields around the url. A `covers: [learm]` typo would
 * silently drop an entry out of every bucket query, so the shape is checked too.
 * Deliberately line-based, for the same fresh-clone reason as above.
 */
export function checkRegistrySchema(text, buckets) {
  const problems = [];
  const lines = text.split("\n");
  if (!lines.some((l) => /^verified_on:\s*\d{4}-\d{2}-\d{2}\s*$/.test(l))) {
    problems.push(`missing or malformed \`verified_on: YYYY-MM-DD\`. A registry with no date cannot be re-verified.`);
  }

  // Entries in do_not_link answer a different question and carry different keys.
  const doNotLinkAt = lines.findIndex((l) => /^do_not_link:/.test(l));
  const entries = [];
  lines.forEach((line, i) => {
    if (/^ {2}- name:/.test(line)) entries.push({ start: i, fields: new Map() });
    else if (entries.length) {
      const m = line.match(/^ {4}([a-z_]+):\s*(.*)$/);
      if (m) entries[entries.length - 1].fields.set(m[1], m[2].trim());
    }
    if (/^ {2}- name:/.test(line)) {
      entries[entries.length - 1].fields.set("name", line.split(":").slice(1).join(":").trim());
    }
  });

  for (const e of entries) {
    const linked = doNotLinkAt !== -1 && e.start > doNotLinkAt;
    const where = `line ${e.start + 1} (${e.fields.get("name") || "unnamed"})`;
    const need = linked ? ["url", "reason"] : ["url", "provenance", "description", "covers", "verdict"];
    for (const k of need) {
      if (!e.fields.has(k)) problems.push(`${where}: missing required field \`${k}\`.`);
    }
    if (linked) continue;

    const verdict = e.fields.get("verdict");
    if (verdict && !VERDICTS.has(verdict)) {
      problems.push(`${where}: verdict "${verdict}" is not one of ${[...VERDICTS].join(", ")}.`);
    }
    const prov = e.fields.get("provenance");
    if (prov && !PROVENANCE.has(prov)) {
      problems.push(`${where}: provenance "${prov}" is not one of ${[...PROVENANCE].join(", ")}.`);
    }
    const covers = e.fields.get("covers");
    if (covers) {
      const vals = covers.replace(/[[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
      if (!vals.length) problems.push(`${where}: \`covers\` is empty. Say which bucket it maps to.`);
      for (const v of vals) {
        if (!buckets.has(v)) problems.push(`${where}: covers "${v}" is not a bucket. Expected one of ${[...buckets].join(", ")}.`);
      }
    }
  }

  return problems;
}
