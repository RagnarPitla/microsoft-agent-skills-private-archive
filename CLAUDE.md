Skills are organized into bucket folders under `skills/`. Buckets are named for **what the user is doing**, not for the Microsoft product involved. Microsoft renames its products constantly; a bucket called `copilot-studio/` would be wrong within a year, and a skill filed under a renamed product becomes unfindable. Products are on-ramps inside a skill, never the top-level taxonomy.

- `build/` — creating an agent or solution on any Microsoft surface
- `connect/` — wiring an agent to data, systems and tools: connectors, MCP servers, APIs
- `review/` — reviewing something that already exists: code, YAML, solutions, architecture, security
- `operate/` — ALM, testing, evaluation, governance, monitoring, cost, incident response
- `deliver/` — the consulting layer: discovery, estimating, requirements, decisions, customer communication, handoff
- `learn/` — learning the stack yourself, and teaching it to others
- `misc/` — kept around but rarely used, not promoted
- `in-progress/` — beta: public on purpose, feedback wanted, not shipped in the plugin
- `deprecated/` — no longer used

`build`, `connect`, `review`, `operate`, `deliver` and `learn` are the **promoted** buckets. Every skill in a promoted bucket must have:

1. a reference in the top-level `README.md`, with the skill name linked to its `SKILL.md`
2. an entry in `.claude-plugin/plugin.json`'s `skills` array
3. a human-facing docs page at `docs/<bucket>/<skill-name>.md`
4. an entry in [`docs/README.md`](./docs/README.md), the index of that docs folder
5. a route in [`ask-ragnar`](./skills/deliver/ask-ragnar/SKILL.md) if it is user-reachable

Skills in `misc/`, `in-progress/` and `deprecated/` must not appear in the top-level `README.md`, in `plugin.json`, or in `docs/`.

Each bucket folder has a `README.md` listing every skill in the bucket with a one-line description, the skill name linked to its `SKILL.md`. Promoted buckets' `README.md`s and the top-level `README.md` group entries into **User-invoked** and **Model-invoked**; `misc/` and `in-progress/` use a flat list.

## Invocation

Every `SKILL.md` is either user-invoked (`disable-model-invocation: true` in front matter, plus `policy.allow_implicit_invocation: false` in `agents/openai.yaml`, reachable only by the human) or model-invoked (reachable by the human *or* reached for automatically). A user-invoked skill may invoke model-invoked skills, but never another user-invoked one. See [.agents/invocation.md](./.agents/invocation.md).

Keep user-invoked skills thin. Reusable behaviour belongs in a model-invoked primitive that several user-invoked wrappers call. [`structured-interview`](./skills/deliver/structured-interview/SKILL.md) is the reference example: it holds the interview discipline, and [`discovery`](./skills/deliver/discovery/SKILL.md) is a thin wrapper over it.

## Harnesses

This repo is **harness-agnostic by construction**. Most of our users hold a GitHub Copilot licence, not a Claude subscription, so GitHub Copilot is the primary target and Claude Code, Codex and Cursor are peers, not afterthoughts.

`SKILL.md` is the single source of truth. Never hand-edit a file under `.github/prompts/`, `.github/chatmodes/`, `.github/instructions/`, `agents/openai.yaml`, `.cursor/rules/` or `skills/index.json` — they are generated. Run `npm run build` to regenerate every harness artifact from source, and `npm run check` to fail the build when they are stale. CI enforces this.

`skills/index.json` is the escape hatch for harnesses we do not emit for. It lists every skill with its trigger description, invocation model and paths, so a tool we have never heard of can discover the collection by reading one JSON file. Nothing in this repo consumes it; that is the point.

Because a skill body is rendered into harnesses that do not share Claude's tooling, write skill bodies in plain Markdown with no harness-specific assumptions. Refer to capabilities generically ("search the repo", "run the tests"), not by a specific tool name.

## The registry

`registry/` holds the machine-readable catalogues that make this repo a one-stop shop: `microsoft-ecosystem.yaml` (official Microsoft and community repos we link to rather than duplicate) and `connectors.yaml` (how to connect an agent to a given system). Being an honest index matters as much as the skills: when Microsoft already solves something well, route to them and say so. A registry entry that 404s costs more trust than a missing skill, so `npm run validate -- --links` checks them - along with every URL cited in a skill body or docs page, since a skill that sends a reader to a 404 is worse than one that stays silent.

Star counts and archive flags are the one thing here that goes stale without anybody editing a file, so they are not hand-maintained: `npm run refresh:stars` pulls them live from the GitHub API and stamps `verified_on`. `npm run check:stars` is the read-only form CI runs weekly. It tolerates ordinary star drift — a red build every morning teaches people to ignore red builds — and fails only on the things that make the index wrong: a repo renamed, archived, deleted, or drifted far enough that citing the old number would misrepresent it.

## Docs

Skills in promoted buckets have a human-facing docs page at `docs/<bucket>/<skill-name>.md`, listed in [`docs/README.md`](./docs/README.md). A finished page carries four sections — **What it does**, **When to reach for it**, **Common questions**, **It's working if**. The template and the rules live in [.agents/writing-docs.md](./.agents/writing-docs.md). Docs pages describe outcomes; they never restate the execution steps in `SKILL.md`, and never duplicate install commands.

## Sync obligations

Whenever you add, rename, remove or change the behaviour of a promoted skill, re-sync all five of: the top-level `README.md`, the bucket `README.md`, `.claude-plugin/plugin.json`, the docs page, and `docs/README.md`. If the skill is user-reachable, also re-read [`ask-ragnar`](./skills/deliver/ask-ragnar/SKILL.md) and update it. A router that omits a new skill, or still routes to a deleted one, is a router that lies. Every one of these is enforced by `npm run validate`; none of them relies on you remembering.

A model-invoked skill carries one further obligation that `npm run validate` does not cover: an entry in `tests/fixtures/trigger-cases.mjs`, keyed by its `name`, holding `positive` utterances that should reach it and `negative` ones belonging to a neighbouring skill it is easy to confuse with. `npm test` fails when a model-invoked skill has no fixture, because a trigger description nobody has tested against a confusable neighbour is a guess.

Install commands are copied verbatim from [.agents/install-block.md](./.agents/install-block.md), which is the single source of truth for installation language. `.claude-plugin/marketplace.json` makes the repo its own single-plugin marketplace, a fallback the install block explains rather than the documented route.

## Confidentiality

This is a public repository written by a Microsoft Principal PM who works on real customer engagements. Nothing in it may contain: a named customer, data from any customer tenant, internal Microsoft tooling or roadmap, anything under NDA, or a screenshot containing real tenant data. Examples must use invented scenarios and synthetic data. When a skill needs a worked example, invent a fictional company. Check [.agents/confidentiality.md](./.agents/confidentiality.md) before publishing anything.

## Accuracy

Our audience will spot a wrong CLI flag, an invented connector or a retired exam code instantly, and that costs more credibility than a missing skill. Verify Microsoft technical detail against `learn.microsoft.com` before writing it down. Where something could not be verified, say so in the skill rather than guessing. Prefer linking to Microsoft's documentation over restating it, because their docs update and our copy does not.

Genuinely perishable claims (a UI path, a preview feature's status, a limit that Microsoft tunes) carry a `Verified as resolving on YYYY-MM-DD.` line in the skill's `## Sources` section, exactly as link verification already does — see [.agents/freshness.md](./.agents/freshness.md) for the convention, the optional `Review by` date, and the default review window. `npm run check:freshness` fails on anything past its review date; the weekly `freshness` workflow runs it on a schedule and opens an issue when something has gone stale.

Separately, every `SKILL.md` carries two front matter fields that make its accuracy checkable rather than asserted: `verified_on`, the date its claims were last read against current documentation, and `provenance`, one line on where the knowledge came from — stated generally enough to stay inside the confidentiality rule. `npm run validate` requires both, rejects a malformed or future-dated `verified_on`, and rejects a `provenance` too short to say anything. Move a `verified_on` date only after re-reading the skill; bumping it to silence a warning converts an honest unknown into a false assurance, which is worse than the stale date was.

The checks themselves are tested. `npm test` runs fixture cases that break one rule at a time and assert the gate *fails* — a test that only asserts the repo is green would pass just as happily against a validator that checks nothing.

## Writing

[`de-slop`](./skills/deliver/de-slop/SKILL.md) states how we write, and `npm run validate` enforces the checkable part of it across every `SKILL.md` body and docs page. Restating that rule inside each skill would create as many copies as there are skills, so it lives in one place and is enforced in one place. The enforced list holds only phrases with no honest use in this register — `seamless`, `utilize`, `cutting-edge`, `testament to`, `it is important to note`. Words that are slop in marketing but legitimate in technical prose — robust, crucial, leverage, holistic — are deliberately excluded, because a gate that fires on correct writing is a gate people switch off. A phrase inside quotes, backticks, a code fence or a blockquote is being quoted rather than written, and does not trip the check; that is what lets `de-slop` name the vocabulary it bans.
