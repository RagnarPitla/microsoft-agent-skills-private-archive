# Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) to version and changelog
the **tooling** in `package.json` and `scripts/` - not individual skills, which are not
independently versioned (see `.claude-plugin/plugin.json`'s single package version, bumped
separately via `npm run version`).

## When to add one

Add a changeset when your change is user-facing for someone consuming this repo's tooling:

- A new or changed flag on a script (`scripts/validate-repo.mjs`, `scripts/scrub.mjs`, etc.).
- A behaviour change in what `npm run check` or `npm test` enforces.
- A new script, workflow input, or Dependabot/CI behaviour a contributor would notice.

Skip it for skill-only changes (a new or edited `SKILL.md`, a docs page, a registry entry) -
those ship on their own cadence and are not part of this changelog.

## How

```bash
npx changeset
```

Answer the prompts (this repo is a single package, so bump type is really "does this change
break, add to, or just fix the tooling contract"), then commit the generated file under
`.changeset/` alongside your change.

## Releasing

See the "Releasing" section of [CONTRIBUTING.md](../CONTRIBUTING.md) and the
[release workflow](../.github/workflows/release.yml). In short: merging changesets to `main`
opens or updates a "Version Packages" pull request; merging that PR runs `npm run version`
(which also syncs `.claude-plugin/plugin.json`'s version) and tags the release. This repo does
not publish to the npm registry - `package.json` is `"private": true` - so there is no publish
step, only versioning and changelog generation.

Full documentation and common questions:
https://github.com/changesets/changesets/blob/main/docs/common-questions.md
