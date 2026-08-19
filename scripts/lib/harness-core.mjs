/**
 * Pure harness-generation logic, split out of scripts/build-harnesses.mjs so
 * it can be unit tested against an in-memory skill list without touching the
 * filesystem. build-harnesses.mjs is the thin CLI wrapper that resolves real
 * paths, reads/writes files, and prints the report.
 */

import path from "node:path";

export const GENERATED_BANNER =
  "Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`.";

export function yamlString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * A SKILL.md links relatively to its own location: ./references/x.md, or
 * ../../../registry/y.yaml. Emitting the body verbatim to a different depth
 * silently breaks every one of those links. .cursor/rules/<name>.mdc is a flat
 * file, so ask-ragnar's registry links pointed three levels above the repo and
 * structured-interview's reference pointed at a sibling that was never there.
 * Re-anchor each link: resolve against the source directory, then re-relativize
 * against wherever the artefact actually lands. Links to files copied alongside
 * the artefact are left alone.
 *
 * `exists` is injected (defaults to a real filesystem check) so tests can
 * simulate a repo tree without writing real files to disk.
 */
export function reanchorLinks(body, srcRelDir, artefactRel, copiedAlongside = new Set(), root = "", exists = () => true) {
  const srcAbs = path.join(root, srcRelDir);
  const outDir = path.dirname(path.join(root, artefactRel));
  const rewrite = (link) => {
    const [target, suffix = ""] = link.split(/(?=[#?])/);
    if (copiedAlongside.has(target.replace(/^\.\//, ""))) return link;
    const abs = path.resolve(srcAbs, target);
    if (!exists(abs)) return link;
    let out = path.relative(outDir, abs);
    if (!out.startsWith(".")) out = `./${out}`;
    return out + suffix;
  };
  return body
    .replace(/\]\((\.[^)\s]+)\)/g, (m, l) => `](${rewrite(l)})`)
    .replace(/((?:src|href)=")(\.[^"]+)(")/g, (m, a, l, b) => `${a}${rewrite(l)}${b}`);
}

/**
 * Compare a "wanted" artefact map (rel path -> content) against the set of
 * files currently on disk in the directories this build owns. Pure diffing
 * logic: no filesystem access, so tests can assert missing/stale/orphaned
 * detection with plain objects.
 *
 * @param {Map<string,string>} wanted - rel path -> desired content
 * @param {Map<string,string|null>} existing - rel path -> current content, or
 *   null if the file does not exist. Every owned-directory file that is
 *   currently on disk must appear here, even if it is not in `wanted`
 *   (orphan detection depends on it).
 * @returns {string[]} problems, in the same "missing:/stale:/orphaned:" shape
 *   the CLI has always printed.
 */
export function diffArtifacts(wanted, existing) {
  const problems = [];

  for (const [rel, want] of wanted) {
    const have = existing.has(rel) ? existing.get(rel) : null;
    if (have === null) {
      problems.push(`missing:  ${rel}`);
    } else if (have !== want) {
      problems.push(`stale:    ${rel}`);
    }
  }

  for (const rel of existing.keys()) {
    if (!wanted.has(rel)) problems.push(`orphaned: ${rel}`);
  }

  return problems;
}
