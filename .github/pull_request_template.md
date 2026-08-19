<!--
Keep the description short. The checklist below is what a review actually checks,
and every item on it is enforced by `npm run check` or `npm test` - so ticking a
box you have not verified only delays the same answer.
-->

## What this changes, and why

One or two sentences. If it is a correction, say what was wrong and how you know
what is right.

## Confidentiality

- [ ] No customer name, tenant data, internal Microsoft tooling, roadmap or NDA
      material. Worked examples use invented companies and synthetic data.
- [ ] `npm run scrub` passes locally, with a filled-in `.scrub-denylist.txt`.

## Checks

- [ ] `npm run build` re-run, and no generated file hand-edited
      (`.github/skills/`, `.cursor/rules/`, `agents/openai.yaml`, `skills/index.json`).
- [ ] `npm run check` passes.
- [ ] `npm test` passes.

## Sync obligations

Skip this section if no promoted skill was added, renamed, removed or changed in
behaviour. Otherwise all five, or the build fails on the one you missed:

- [ ] Linked from the top-level `README.md`.
- [ ] Listed in `.claude-plugin/plugin.json`.
- [ ] Listed in the bucket `README.md`, under the right invocation heading.
- [ ] Docs page at `docs/<bucket>/<skill-name>.md` with all four sections.
- [ ] Indexed in `docs/README.md`.
- [ ] If user-reachable: routed from `ask-ragnar`.

## Accuracy

- [ ] Every Microsoft technical claim verified against `learn.microsoft.com`, or
      explicitly marked as unverified in the skill.
- [ ] `verified_on` set to the date you actually checked.
- [ ] `provenance` says where the practice came from, in general terms.
