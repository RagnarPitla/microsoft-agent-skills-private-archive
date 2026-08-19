# Freshness governance

Two different things go stale in this repo, and they are checked differently on purpose.

**Links** rot silently and say nothing about whether the *claim* next to them is still true. `npm run validate -- --links` and the weekly `link-rot` workflow HEAD/GET every URL cited anywhere in the repo and open an issue when one 404s. That is necessary but not sufficient: a link can resolve perfectly to a page whose content changed underneath it.

**Genuinely perishable claims** are the other half: a UI path that Microsoft renames, a preview feature that ships GA, a quota or limit that gets tuned, a screen that gets redesigned. No amount of link-checking catches those, because the URL still resolves. This is what `Verified as resolving on` and `Review by` dates exist for.

## The convention

A skill (or docs page) that makes a perishable claim already ends with a `## Sources` section, prose-compatible with everything already written:

```markdown
## Sources

Verified as resolving on 2026-08-18.
Review by 2027-02-18.

- Power Platform ALM overview: https://learn.microsoft.com/power-platform/alm/overview-alm
```

- **`Verified as resolving on YYYY-MM-DD.`** is required wherever this section exists. It is the date a human actually opened every link below it and confirmed the page still says what the skill claims, not the date the skill was written.
- **`Review by YYYY-MM-DD.`** is optional. State it explicitly when a claim has a known expiry (a documented preview end date, an announced deprecation, a limit Microsoft has said it will change) — do not guess a shorter window just to be cautious.
- When `Review by` is absent, the default review window is **180 days** from `Verified as resolving on`. That is roughly the pace at which Copilot Studio, Foundry and Power Platform surfaces visibly move; it is a maintenance cadence, not a claim about how long any individual fact stays true.

Registry entries (`registry/microsoft-ecosystem.yaml`, `registry/connectors.yaml`) already carry a top-level `verified_on: YYYY-MM-DD`. The same default 180-day window applies to the whole file; there is no per-entry `review_by` because both registries already document that they are "seeded, not complete" and re-verified as a batch.

## What checks it

`scripts/check-freshness.mjs` (pure logic in `scripts/lib/freshness-core.mjs`, unit tested in `tests/`) scans every `SKILL.md`, every promoted docs page, and both registries for this pattern, and fails when today is past the effective review date (explicit `Review by`, or `Verified as resolving on` + 180 days).

- `npm run check:freshness` — run it locally.
- `.github/workflows/freshness.yml` — runs it on the same weekly schedule as `link-rot`, and opens (or comments on) an issue when something has gone stale, naming the file and how overdue it is.

A stale-freshness failure is not automatically wrong — plenty of pages do not change for years — but it is a prompt to re-open the linked pages, confirm the claim still holds, and bump the date. Bumping the date without re-reading the page defeats the entire point of this check.
