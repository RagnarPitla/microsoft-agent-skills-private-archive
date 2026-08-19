# Repository review - 19 August 2026

> Status: kept as a working backlog, not a published page. It reviewed the repo at
> 15 skills; the tree has since moved on, and several findings below (no docs
> index, no published site, undated product claims) have been addressed. Read the
> ranking, not the score.

An outside read of `RagnarPitla/microsoft-agent-skills`: what it is good at, what it is not,
and a ranked list of things worth doing. Nothing here is implemented. Decide each item on its
merits and delete the ones you disagree with.

State reviewed: 15 skills, 6 promoted buckets, 2 registries, 7 build/validation scripts
(1,457 lines), 2 workflows. `npm run check` passes clean.

---

## The score

**73 / 100 - B+. Exceptional infrastructure wrapped around a thin, high-quality skill set,
with no front door for anyone but the author.**

| # | Category | Score | One-line verdict |
|---|---|---|---|
| 1 | Skill content craft | 8.5 / 10 | Opinionated, specific, well-cited. Better than almost anything comparable. |
| 2 | Coverage of the Microsoft surface | 5 / 10 | Deep on Copilot Studio and Power Platform. Near-silent on Foundry, M365, Azure, Fabric, Dynamics. |
| 3 | Repo architecture and taxonomy | 9 / 10 | The verb-bucket decision is correct and will still be correct after the next rename wave. |
| 4 | Tooling and enforcement | 9 / 10 | Sync obligations are enforced, not trusted. Rare and valuable. |
| 5 | Harness portability | 9 / 10 | One source, four harnesses plus `index.json` as the escape hatch. |
| 6 | Human-facing docs | 7 / 10 | Individual pages are strong; there is no index, no entry point, no published site. |
| 7 | Trust and freshness machinery | 8 / 10 | Link rot and star drift are automated. Product claims inside skills are not dated. |
| 8 | Contributor on-ramp | 3 / 10 | No CONTRIBUTING, no templates, no SECURITY, no CODE_OF_CONDUCT. |
| 9 | Release engineering | 3 / 10 | Changesets wired into `package.json` but never initialised. Still 0.1.0, no changelog, no release workflow. |
| 10 | Tests for the tooling | 2 / 10 | 1,457 lines of gate logic guarding correctness, with nothing guarding it. |
| 11 | Distribution and discoverability | 4 / 10 | Install works; nothing pulls anyone toward it. |
| 12 | Confidentiality posture | 8 / 10 | Well designed, but the sharpest check is off by default. |

### What is genuinely excellent

- **The taxonomy argument.** Naming buckets for the user's verb rather than Microsoft's product
  name is the single highest-leverage decision in the repo. It is also written down and defended,
  so it survives contributors who did not make it.
- **Enforcement over trust.** `scripts/validate-repo.mjs` fails the build when a promoted skill is
  missing its README entry, plugin entry, docs page or router route. Most skill repos document
  the same obligations and let them rot within three months.
- **The description gate.** Refusing a model-invoked description without a "Use when" clause, and
  rejecting anything under 150 characters or opening like a summary, attacks the exact silent
  failure that makes most skills never fire.
- **Honest indexing.** `registry/microsoft-ecosystem.yaml` with `verdict: route | wrap | rebuild`,
  and a weekly job that fails when a repo is renamed or archived, is a real differentiator. Most
  "awesome-X" lists are 30% dead links within a year.
- **The scrub gate's threat model.** Structural patterns (tenant URLs, GUIDs, bearer tokens),
  denylist kept gitignored because committing it would itself be the disclosure, and a comment
  explaining a previously-fixed silent bypass. That is mature security thinking.
- **The prose.** These read like someone who has been burned. "A router that omits a skill is a
  router that lies" is the tone throughout, and it is why the skills are worth reading.

### What is actually holding it back

- **It is 15 skills claiming a six-bucket ecosystem.** `learn` and `operate` have one skill each;
  `review` has two. The bucket table promises governance, monitoring, cost and incident response,
  and none of those exist. The scaffolding is sized for 60 skills; the content is sized for 15.
- **No contributor can enter.** There is no CONTRIBUTING.md, no issue or PR template, no
  `good first issue` path. `CLAUDE.md` is excellent but is written for an agent, not a human
  deciding whether to spend an evening on this.
- **Release plumbing is half-installed.** `package.json` declares `changeset` and `version`
  scripts and both `@changesets/*` devDependencies, but there is no `.changeset/` directory.
  `npm run changeset` will not work on a fresh clone. Meanwhile `sync-plugin-version.mjs` exists
  purely to serve a release process that has never run.
- **The tooling has no tests.** The validator is the load-bearing component of the entire
  quality story. A regression in it fails open - the build stays green and the promise quietly
  stops being kept, which is the exact failure mode the repo criticises elsewhere.
- **The scrub gate's strongest check is opt-in.** Without a local `.scrub-denylist.txt` the run
  emits a warning and exits 0. In CI that file can never exist, so customer names and codenames
  are never actually checked on the branch that matters.
- **Skills carry undated perishable claims.** Several assert current product behaviour or preview
  status. There is no `verified_on` per skill the way the registries have one, so a reader cannot
  tell a claim checked last week from one checked at authoring time.

---

## Findings in detail

### Content

| Observation | Evidence |
|---|---|
| Size spread is very wide | `evaluate-agent-quality` 343 lines, `migrate-agent-to-skills` 298, `what-should-i-build` 288, against `discovery` at 17. Long skills burn context on every load. |
| Roughly half have no worked example | Guidance like "no secrets in YAML" in `review-copilot-studio-agent` is correct but not demonstrable. The one place a short synthetic snippet would pay for itself. |
| `evaluate-agent-quality` describes an artefact it does not ship | It specifies a six-column eval sheet and then does not provide it as a `references/` file. |
| Cross-references are one-way | `copilot-studio-auth-patterns` points at the ALM skill; the ALM skill does not point back. Same for grounding vs evaluation. |
| Scope boundaries live in docs, not skills | The "Reach for something else when" lists in `docs/` are excellent - but the model only ever reads `SKILL.md`, where they are mostly absent. |
| Overlap between `write-a-skill` and `migrate-agent-to-skills` | Both teach description rewriting. Not fatal, but they should say which owns it. |

### Structure and tooling

| Observation | Evidence |
|---|---|
| No `.changeset/` config | Declared in `package.json`, absent on disk. |
| No tests anywhere | No test script, no test runner, no fixtures. |
| No `docs/README.md` | `docs/` is 15 orphan pages with no index and no published site. |
| No community health files | No CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, issue or PR templates, no `.github/dependabot.yml`. |
| Actions not pinned | `actions/checkout@v4`, `setup-node@v4`, `github-script@v7` pinned by tag, not SHA. Low risk with `permissions: contents: read`, but `link-rot.yml` holds `issues: write`. |
| Version frozen at 0.1.0 | No CHANGELOG, no tags, no release workflow. Users have no way to know what changed. |
| Registry connector rows are shallow | 18 systems, each one line per field. Genuinely useful, but not yet the thing that makes someone bookmark the repo. |

---

## The improvement backlog

Ordered by value per unit of effort. Each item says what it buys you, so you can cut the ones
you do not believe in.

### Tier 1 - do these first, all cheap

1. **Add `CONTRIBUTING.md`.** Human-facing companion to `CLAUDE.md`: how to add a skill, the four
   sync obligations, how to run `npm run build` and `npm run check`, what makes a review fail.
   *Buys:* the difference between a repo people read and one people extend.
2. **Finish or remove the changesets install.** Either run `npx changeset init` and add a release
   workflow, or strip the two scripts and both devDependencies. A half-wired release process is
   worse than none because it fails only for the first outside contributor who tries it.
3. **Make the scrub gate fail closed in CI.** Commit a repo-safe baseline denylist, or have
   `scrub.mjs` exit non-zero when no denylist is present and `CI` is set. Today the check the
   repo advertises most loudly is the one that does not run where it counts.
4. **Add `docs/README.md`.** One page indexing all skill docs by bucket, linking back to each
   `SKILL.md`. Extend `validate-repo.mjs` to require an entry, same as the other four obligations.
5. **Add `SECURITY.md` and issue templates.** Two of these are ten-minute files. A "propose a
   skill" issue template is the cheapest way to find out which skill to write next.
6. **Pin GitHub Actions by commit SHA**, at minimum in `link-rot.yml`, which can write issues.

### Tier 2 - raises the quality ceiling

7. **Test the tooling.** Even ten fixture-based cases through `node --test` - a skill missing its
   docs page, a summary-shaped description, a bad connector surface, a stale harness artefact -
   would prove the gates still bite. This is the single highest-value engineering item; every
   other guarantee in the repo rests on the validator being correct.
8. **Add a `verified_on` date to every skill's front matter**, and validate it is present and not
   absurdly old. The registries already do this. Skills make far more perishable claims than the
   registries do and carry no date at all.
9. **Move scope boundaries into `SKILL.md`.** Give every skill a short "reach for something else
   when" list, mirroring the docs pages. The model never sees `docs/`; that is where the
   boundaries are needed most.
10. **Ship `references/` artefacts where a skill describes one.** Start with the eval sheet for
    `evaluate-agent-quality` and a minimal `deployment-settings.json` for the ALM skill. A skill
    that hands over a file gets used twice; a skill that describes one gets read once.
11. **Split the three 280+ line skills.** Keep the diagnostic spine in `SKILL.md` and push the
    long tail into `references/`, which loads on demand. Also add a soft length warning to the
    validator so this does not creep back.
12. **Make cross-references bidirectional**, and have the validator warn when skill A names
    skill B but B never names A.

### Tier 3 - coverage, where the repo is thinnest

13. **Fill `operate`.** It has one skill against a bucket promising ALM, testing, evaluation,
    governance, monitoring, cost and incident response. The highest-demand gaps, in order:
    environment strategy and DLP, agent cost and capacity/message consumption, monitoring and
    telemetry, and an incident runbook for an agent that has started answering wrongly in prod.
14. **Broaden past Copilot Studio.** Nine of fifteen skills are Copilot Studio or Power Platform.
    The obvious next surfaces: Microsoft Foundry agents, M365 Copilot declarative agents and Teams
    distribution, MCP server authoring and security, and agent identity via Entra Agent ID.
15. **Add one `review` skill for solutions rather than agents** - a Power Platform solution
    review covering DLP, connector sprawl, environment placement and ownership.
16. **Deepen `registry/connectors.yaml` into the flagship artefact.** For each system add a
    minimal working example, the failure everyone hits first, and the auth mode that will not
    work unattended. The 18-row table is already the most immediately reusable thing in the repo;
    it is currently one line per field.

### Tier 4 - distribution

17. **Publish `docs/` with GitHub Pages.** The pages are already written and structured; they are
    just not reachable by anyone who is not browsing the repo tree.
18. **Set repository topics and a description** (`copilot-studio`, `agent-skills`, `power-platform`,
    `mcp`, `claude-code`, `github-copilot`). Free discovery.
19. **Add a "what changed" surface** - even a hand-written CHANGELOG - so someone who installed
    two months ago knows whether to re-pull.
20. **Add per-skill provenance**: one line on where the hard-won practice came from, in general
    terms. It is the repo's actual differentiator against generated skill collections, and it is
    currently only claimed in the README.

---

## Things I would deliberately not do

- **Do not add more buckets.** Six verbs is right. The gap is depth, not taxonomy.
- **Do not merge `discovery` into `structured-interview`.** The thin user-invoked wrapper over a
  model-invoked primitive is the correct pattern and the README already teaches it as the
  reference example. Its 17 lines are a feature.
- **Do not switch the registries to a real YAML parser** for the sake of tidiness. The line-based
  checks exist so the pre-commit hook runs on a fresh clone with no `npm install`. That constraint
  is worth more than the elegance.
- **Do not ship skills as `.instructions.md`.** Already argued in the README, and the argument is
  correct.
- **Do not chase skill count.** Fifteen good skills beat forty thin ones, and the enforcement
  machinery means every additional skill carries four sync obligations. Grow where you have scars.

---

## If you only do five things

1. `CONTRIBUTING.md` - opens the door.
2. Tests for `validate-repo.mjs` - protects everything else.
3. Make the scrub gate fail closed in CI - closes the real risk.
4. Finish or remove changesets - stops a broken promise.
5. Two or three `operate` skills - makes the bucket table true.

That set moves the score to roughly 85/100 without writing a single new line of skill prose
beyond item 5.
