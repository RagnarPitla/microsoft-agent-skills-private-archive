# Contributing

`CLAUDE.md` is the contract an agent reads before touching this repo. This is the
same contract for a human deciding whether to spend an evening here.

Contributions are welcome, with one honest caveat: this is a collection of
practices that were paid for in production, not a survey of what the documentation
says. A skill written from a product page will be declined, however well written.
If you have not hit the failure, you cannot yet write the skill.

## Before anything else: confidentiality

This repository is public and is written by someone who works on real customer
engagements. Nothing here may contain a named customer, data from any customer
tenant, internal Microsoft tooling or roadmap, NDA material, or a screenshot with
real tenant data. Worked examples use invented companies and synthetic data.

Read [.agents/confidentiality.md](./.agents/confidentiality.md) before you write
anything, not after. `npm run scrub` catches structural leaks - tenant URLs,
GUIDs, credentials, internal markings - but it cannot catch a paraphrased customer
story, which is the leak that actually happens.

The scrub gate installs itself as a pre-commit hook on `npm install`. Copy
`.scrub-denylist.example.txt` to `.scrub-denylist.txt` and fill in the names you
personally must never publish. That file is gitignored and must stay that way:
writing those terms into a committed file would itself be the disclosure. The
committed `.scrub-baseline-denylist.txt` holds only internal-only *markings*,
which are safe to publish, and exists so the gate still checks something in CI.

Copying the example file is not enough. One left with every line still commented
out contributes no terms, and the gate now says so instead of reporting a clean
pass - which is what it used to do, and the reason this paragraph exists.

## Maintainer setup, once

Two things live outside the repository and cannot be set by a pull request. Until
they are done, the relevant workflow fails on purpose rather than skipping
quietly.

1. **`SCRUB_DENYLIST` repository secret.** Settings > Secrets and variables >
   Actions > New repository secret, one term per line - the same customer names
   and codenames as your local `.scrub-denylist.txt`. Trusted runs (a push to
   `main`, the weekly schedule) require it, because a trusted run that silently
   skipped the customer/codename layer would look identical to one that enforced
   it. A match is reported as `[redacted denylist match]`; the term is never
   written to a log. Fork and Dependabot pull requests cannot read it - those
   read from a different secret store - so they run the committed baseline
   instead, and the full denylist is enforced again when the change reaches
   `main`.

2. **GitHub Pages.** Settings > Pages > Source: "GitHub Actions", which the
   `pages` workflow needs before it can publish `docs/`. On a private repository
   this requires a paid plan; on a public one it is free.

## The one structural decision

Buckets are named for **what the user is doing**, never for the Microsoft product
involved: `build`, `connect`, `review`, `operate`, `deliver`, `learn`. Microsoft
renames products constantly, and a skill filed under a renamed product becomes
unfindable. Products are on-ramps inside a skill, never the taxonomy.

If your skill does not fit a bucket, that is evidence about the skill, not about
the buckets. Six verbs is the ceiling.

## Adding a skill

1. `skills/<bucket>/<skill-name>/SKILL.md` - kebab-case folder, `name` in front
   matter matching the folder exactly.
2. `skills/<bucket>/<skill-name>/agents/openai.yaml` - hand-authored, and it must
   agree with the front matter about invocation. See
   [.agents/invocation.md](./.agents/invocation.md).
3. `npm run build` - regenerates every harness artefact. Never hand-edit anything
   under `.github/skills/`, `.cursor/rules/`, `agents/openai.yaml` or
   `skills/index.json`.
4. `npm run check` - scrub, staleness, validation, version sync.
5. `npm test` - proves the gates still bite.

### Front matter

```
---
name: your-skill-name
description: <the trigger - see below>
verified_on: YYYY-MM-DD
provenance: "One line, in general terms, on where the practice came from."
---
```

`verified_on` is the date you last checked the skill's factual claims against
Microsoft's current documentation. It is validated, and the weekly maintenance job
warns when it goes stale. Do not bump it without re-reading the skill.

`provenance` is one confidentiality-safe line on where the practice came from -
"repeated production incidents", "several tenant migrations", not a customer.
It is what separates this from a generated skill collection, and it is validated
because a claim nobody checks is a claim nobody believes.

### The description is the whole ballgame

For a model-invoked skill the description is the only text the model sees when
deciding whether to load the body. Describe **the situation**, not the contents.
It must contain a "Use when" clause and name concrete situations a reader would
recognise. The validator rejects summary-shaped openers and anything under 150
characters, because that failure is silent: the skill is simply never reached for.

User-invoked skills are held to a different standard on purpose. A human picks
them from a list, so a short menu label is correct.

Read [`write-a-skill`](./skills/build/write-a-skill/SKILL.md) first. It is the
skill for exactly this, and it is enforced by the validator.

### Invocation

Every skill is either user-invoked (`disable-model-invocation: true` plus
`policy.allow_implicit_invocation: false`) or model-invoked. Silence is not a
declaration and fails the build. A user-invoked skill may invoke model-invoked
skills, never another user-invoked one - extract the shared behaviour into a
model-invoked primitive instead.

Keep user-invoked skills thin.
[`structured-interview`](./skills/deliver/structured-interview/SKILL.md) holds the
discipline; [`discovery`](./skills/deliver/discovery/SKILL.md) is a 17-line wrapper
over it. That is the pattern, not an oversight.

## The five sync obligations

A skill in a promoted bucket is not finished until all five are true. All five are
enforced by `scripts/validate-repo.mjs`, so you will find out either way:

1. Linked from the top-level `README.md`.
2. Listed in `.claude-plugin/plugin.json`'s `skills` array.
3. Listed in its bucket `README.md`, under **User-invoked** or **Model-invoked**.
4. A docs page at `docs/<bucket>/<skill-name>.md`, carrying all four sections from
   [.agents/writing-docs.md](./.agents/writing-docs.md).
5. Indexed in [docs/README.md](./docs/README.md).

If the skill is user-reachable, also add a route in
[`ask-ragnar`](./skills/deliver/ask-ragnar/SKILL.md). A router that omits a new
skill, or still routes to a deleted one, is a router that lies.

## Accuracy

Our audience will spot a wrong CLI flag, an invented connector or a retired exam
code instantly, and that costs more credibility than a missing skill. Verify
Microsoft technical detail against `learn.microsoft.com` before writing it down.
Where something could not be verified, say so in the skill rather than guessing -
roughly one in three guessed documentation paths is a 404, and every URL you cite
is checked weekly.

Prefer linking to Microsoft's documentation over restating it. Their docs update;
our copy does not.

## What makes a review fail

In roughly the order it happens:

- **The skill is a summary of the documentation.** Route to Microsoft instead and
  add a registry entry. That is a contribution too.
- **The description describes contents rather than a situation.** Automatic.
- **A confidentiality slip** - a real tenant, a recognisable customer story, an
  internal tool name. Non-negotiable, and no amount of rewriting rescues the PR.
- **An unverifiable technical claim** stated as fact.
- **Generated artefacts hand-edited**, or `npm run build` not re-run.
- **A sync obligation skipped.**
- **A new dependency.** The toolchain runs on a fresh clone with no `npm install`,
  and the pre-commit hook depends on that staying true. Adding a YAML parser to
  tidy up the registry checks is the most tempting version of this, and it is
  still a no.
- **Prose that hedges.** If a practice is right, say so and say why. If it is
  situational, name the situations. "It depends" without the dependencies is not
  a skill.

## Running things

```bash
npm install        # installs release tooling and wires up the pre-commit scrub gate
npm run build      # regenerate harness artefacts from SKILL.md
npm run check      # scrub + staleness + validation + version sync
npm test           # fixture tests: prove each gate fails on bad input
npm run validate -- --links   # also HEAD every cited URL (slow, needs network)
npm run validate -- --stale   # fail if any skill is overdue for re-verification
npm run check:stars           # registry star counts and archive flags
```

There is no linter and no build step beyond the harness renderer. Tests use
`node --test` and no test framework, for the same reason as everything else here.

`--stale` is deliberately not part of `npm run check`. Only the weekly job runs
it, where it opens a maintenance issue instead of blocking a pull request that
has nothing to do with the skill that aged out.

The docs folder is published to GitHub Pages by `.github/workflows/pages.yml`.
That workflow needs one manual step, once, from someone with repository admin:
set **Settings > Pages > Source** to **GitHub Actions**. Until then it fails at
the deploy step rather than half-publishing.

## Releases

Hand-cut, and small on purpose:

1. Bump `version` in `package.json`.
2. `npm run sync-plugin-version` - propagates it to the plugin manifest and the
   marketplace entry.
3. Add a section to [CHANGELOG.md](./CHANGELOG.md) naming the current version.
4. `npm run check`, commit, tag.

`npm run check` fails if the plugin version or the changelog has drifted from
`package.json`.

## Proposing rather than writing

The most useful thing you can send is not always a skill. A
[skill proposal issue](./.github/ISSUE_TEMPLATE/skill-proposal.md) describing a
failure you hit repeatedly, and what you had to learn to get past it, is worth
more than a skill written from documentation. It also tells us which bucket is
actually thin, which is not always the one that looks thin.
