# Changelog

Every entry answers one question: if you installed this a while ago, is it worth
re-pulling? Notable changes only - a typo fix does not earn a line.

Versions are hand-cut. To release: bump `version` in `package.json`, run
`npm run sync-plugin-version`, add a section here, tag the commit.
`npm run check` fails if the plugin manifest or this file falls out of step.

## Unreleased

Nothing yet.

## 0.1.0

First public cut. 19 skills across six promoted buckets, two registries, and the
tooling that keeps them honest.

**Skills**

- `build`: `copilot-studio-knowledge-grounding`, `copilot-studio-production-patterns`,
  `migrate-agent-to-skills`, `write-a-skill`
- `connect`: `copilot-studio-auth-patterns`, `ground-agents-in-work-context`
- `review`: `evaluate-agent-quality`, `review-copilot-studio-agent`
- `operate`: `govern-agent-lifecycle`, `monitor-agent-telemetry`,
  `plan-agent-capacity-and-cost`, `power-platform-alm-connection-refs`,
  `respond-to-agent-incidents`
- `deliver`: `ask-ragnar`, `choose-agent-platform`, `discovery`,
  `structured-interview`, `what-should-i-build`
- `learn`: `explain-concept`

**Repository**

- `SKILL.md` as the single source of truth, rendered to GitHub Copilot, Claude
  Code, Codex and Cursor by `npm run build`, with `skills/index.json` as the
  escape hatch for harnesses that are not emitted for.
- `registry/microsoft-ecosystem.yaml` and `registry/connectors.yaml`, link-checked
  weekly, with star counts and archive flags refreshed from the GitHub API.
- Sync obligations enforced by `scripts/validate-repo.mjs` rather than trusted.
- Confidentiality scrub gate, wired into a pre-commit hook and CI.
- Fixture tests under `tests/` that assert each gate fails on bad input.
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue and pull request
  templates, and Dependabot for actions and npm.
- Every skill carries `verified_on` and `provenance`, both validated; staleness
  surfaces in the weekly maintenance job instead of being discovered by a reader.
- `docs/` published via GitHub Pages. One manual step is required once, by a
  maintainer: set Settings > Pages > Source to "GitHub Actions".
