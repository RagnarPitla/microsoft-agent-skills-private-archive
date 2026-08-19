# Contributing

Thanks for considering a contribution. This repo is a collection of agent skills for the
Microsoft ecosystem, written so the same `SKILL.md` runs unmodified in GitHub Copilot, Claude
Code, Codex and Cursor. Read [AGENTS.md](./AGENTS.md) first - it defines the bucket taxonomy,
the invocation model, and the sync obligations every promoted skill carries. This file covers
the mechanics of getting a change in.

## Before you start

- **Skill content changes** (new skill, edited skill, docs page, registry entry) do not need
  `npm install` at all. `npm run check` and the pre-commit scrub hook are dependency-free by
  design, because contributors without Node tooling still need to be able to validate a skill.
- **Tooling changes** (scripts, tests, workflows) need `npm install` to pull in Changesets and
  the test runner's dev dependencies.
- Read [.agents/confidentiality.md](./.agents/confidentiality.md) before writing any example.
  Nothing customer-specific, tenant-specific or Microsoft-internal may appear anywhere in this
  repo, including in a commit message or a test fixture.

## Setting up

```bash
git clone https://github.com/RagnarPitla/microsoft-agent-skills
cd microsoft-agent-skills
npm install   # installs devDependencies and the pre-commit scrub hook
```

`npm install` runs `scripts/install-hooks.mjs`, which points `core.hooksPath` at `.githooks/`
so the scrub gate runs automatically before every commit. If you skip `npm install`, run
`npm run scrub` by hand before you push.

## Making a change

1. **Adding or editing a skill?** Read [.agents/invocation.md](./.agents/invocation.md) to
   choose user-invoked vs. model-invoked deliberately, and
   [.agents/writing-docs.md](./.agents/writing-docs.md) for the docs page shape. Follow
   [`write-a-skill`](./skills/build/write-a-skill/SKILL.md) for how to write a description that
   actually fires.
2. **Never hand-edit a generated file.** `.github/skills/`, `.github/prompts/`,
   `.github/chatmodes/`, `.github/instructions/`, `.cursor/rules/`, `agents/openai.yaml` and
   `skills/index.json` are all rendered from `SKILL.md` by `scripts/build-harnesses.mjs`. Edit
   the source `SKILL.md`, then run:
   ```bash
   npm run build
   ```
3. **Run the checks:**
   ```bash
   npm run check   # scrub gate + harness staleness + repo validation
   npm test        # fixture-driven unit tests for the scripts, if Node dependencies are installed
   ```
4. **Changing a script?** Add or update a test under `tests/`. See "Testing" below.
5. **Touching a dependency, workflow, or anything users would notice in a release?** Add a
   changeset (see "Releasing" below).

## Testing

Tests live under `tests/` and run on Node's built-in test runner (`node:test`) - no test
framework dependency needed:

```bash
npm test
```

Tests are fixture-driven: each test writes small, synthetic files into a temporary directory
(never real skill content) and asserts on the script's behaviour, covering both a passing case
and a failing case for every rule. If you add a check to `scripts/validate-repo.mjs`,
`scripts/scrub.mjs`, `scripts/build-harnesses.mjs` or `scripts/lib/skills.mjs`, add a test that
exercises it in both directions. A validator with no test proving it can fail is a validator
nobody trusts.

If you add or rename a **model-invoked** skill, add a positive and a negative utterance for it
to [`tests/fixtures/trigger-cases.mjs`](./tests/fixtures/trigger-cases.mjs) - a coverage check in
`tests/trigger-core.test.mjs` fails the build if a model-invoked skill has none. These are scored
by a small, dependency-free keyword-overlap ranker (`scripts/lib/trigger-core.mjs`); it is a
regression canary for "does this description still distinguish itself from its neighbours," not
a simulation of real LLM routing judgement. `npm run quality-report` aggregates the test suite,
the harness build-check, the validator, the freshness gate and the trigger-fixture pass rate into
one Markdown file (`quality-report.md`, gitignored) - the same file CI publishes as a workflow
artifact on every run.

## Releasing

This repo uses [Changesets](https://github.com/changesets/changesets) to version and changelog
tooling releases (the `scripts/` package, not individual skills, which are not independently
versioned). If your change is user-facing - a new script flag, a behaviour change in
`npm run check`, a new test category - add a changeset:

```bash
npx changeset
```

See [.changeset/README.md](./.changeset/README.md) and the "Releasing" section of
[AGENTS.md](./AGENTS.md) for how the release PR and tag get cut. Skill content itself (a new or
edited `SKILL.md`) does not need a changeset - the plugin version is bumped separately, via
`npm run version`, when a batch of skill changes ships.

## Pull request checklist

Copy this into your PR description (the template does it for you) and check off what applies:

- [ ] Read [AGENTS.md](./AGENTS.md) and, for a skill change,
      [.agents/invocation.md](./.agents/invocation.md) and
      [.agents/writing-docs.md](./.agents/writing-docs.md).
- [ ] Checked [.agents/confidentiality.md](./.agents/confidentiality.md) - no customer names,
      tenant identifiers, internal tooling or unannounced features anywhere in the diff.
- [ ] Verified every Microsoft technical claim against `learn.microsoft.com` (or said plainly
      in the skill that it could not be verified).
- [ ] If a promoted skill was added, renamed or removed: updated the top-level `README.md`, the
      bucket `README.md`, `.claude-plugin/plugin.json`, the `docs/<bucket>/<name>.md` page, and
      [`ask-ragnar`](./skills/deliver/ask-ragnar/SKILL.md) if the skill is user-reachable.
- [ ] If a model-invoked skill was added or its description changed: added or updated its cases in
      [`tests/fixtures/trigger-cases.mjs`](./tests/fixtures/trigger-cases.mjs).
- [ ] Ran `npm run build` and committed the regenerated harness artefacts (never hand-edited).
- [ ] Ran `npm run check` and it passes locally.
- [ ] Ran `npm test` (after `npm install`) and it passes, with new/updated tests for any script
      behaviour changed.
- [ ] Added a changeset (`npx changeset`) for tooling changes; skipped it for skill-only changes.
- [ ] No new dependency was added without checking it against the GitHub Advisory Database.

## Code style

- Scripts are plain, dependency-free Node.js (see `scripts/lib/skills.mjs` for why). Keep new
  script code in that spirit unless there is a strong reason to add a dependency.
- Skill bodies are harness-agnostic Markdown: no tool-specific vocabulary, no assumption about
  which coding agent is reading them.
- Comment code only where the reasoning is not obvious from the code itself - see the existing
  scripts for the level of comment density expected.

## Getting help

Open a [discussion](https://github.com/RagnarPitla/microsoft-agent-skills/discussions) or an
issue using the templates under `.github/ISSUE_TEMPLATE/`. If you are not sure whether
something belongs as a new skill, a doc fix, or a registry entry, say what you are trying to do
and we'll help you place it.
