## What this changes

<!-- One or two sentences: what does this PR add, fix or change? -->

## Why

<!-- The situation this addresses. For a new skill, the trigger in the reader's own words. -->

## Checklist

- [ ] Read [AGENTS.md](../AGENTS.md) and, for a skill change, [.agents/invocation.md](../.agents/invocation.md) and [.agents/writing-docs.md](../.agents/writing-docs.md).
- [ ] Checked [.agents/confidentiality.md](../.agents/confidentiality.md) - no customer names, tenant identifiers, internal tooling or unannounced features anywhere in the diff.
- [ ] Verified every Microsoft technical claim against `learn.microsoft.com` (or said plainly in the skill that it could not be verified).
- [ ] If a promoted skill was added, renamed or removed: updated the top-level `README.md`, the bucket `README.md`, `.claude-plugin/plugin.json`, the `docs/<bucket>/<name>.md` page, and [`ask-ragnar`](../skills/deliver/ask-ragnar/SKILL.md) if the skill is user-reachable.
- [ ] Ran `npm run build` and committed the regenerated harness artefacts (never hand-edited).
- [ ] Ran `npm run check` and it passes locally.
- [ ] Ran `npm test` (after `npm install`) and it passes, with new/updated tests for any script behaviour changed.
- [ ] Added a changeset (`npx changeset`) for tooling changes; skipped it for skill-only changes.
- [ ] No new dependency was added without checking it against the GitHub Advisory Database.

<!-- See CONTRIBUTING.md for the full explanation of each item. -->
