<!--
Keep the description short. Every box below is enforced by `npm run check` or
`npm test`, so ticking one you have not verified only delays the same answer.
-->

## What this changes, and why

One or two sentences. If it is a correction, say what was wrong and how you know
what is right. For a new skill, give the trigger in the reader's own words.

## Confidentiality

- [ ] No customer name, tenant identifier, internal Microsoft tooling, roadmap or
      NDA material. Worked examples use invented companies and synthetic data.
- [ ] `npm run scrub` passes locally, with a filled-in `.scrub-denylist.txt`
      (a copied-but-empty one is not protection, and the gate now says so).

## Checks

- [ ] `npm run build` re-run, and no generated file hand-edited
      (`.github/skills/`, `.cursor/rules/`, `agents/openai.yaml`, `skills/index.json`).
- [ ] `npm run check` passes.
- [ ] `npm test` passes, with new or updated tests for any script behaviour changed.
- [ ] Added a changeset (`npx changeset`) for tooling changes; skipped it for
      skill-only changes.
- [ ] No new dependency added without checking it against the GitHub Advisory Database.

## Sync obligations

Skip this section if no promoted skill was added, renamed, removed or changed in
behaviour. Otherwise all five, or validation fails on the one you missed:

- [ ] Linked from the top-level `README.md`.
- [ ] Listed in `.claude-plugin/plugin.json`.
- [ ] Listed in the bucket `README.md`, under the right invocation heading.
- [ ] Docs page at `docs/<bucket>/<skill-name>.md` with all four sections.
- [ ] Indexed in `docs/README.md`, which is what GitHub Pages publishes.

And one the validator cannot check for you:

- [ ] If the skill is user-reachable, routed from
      [`ask-ragnar`](../skills/deliver/ask-ragnar/SKILL.md).

## Accuracy

- [ ] Every Microsoft technical claim verified against `learn.microsoft.com`, or
      explicitly marked as unverified in the skill.
- [ ] `verified_on` set to the date you actually checked, not the date you wrote it.
- [ ] `provenance` says where the practice came from, in general terms.
