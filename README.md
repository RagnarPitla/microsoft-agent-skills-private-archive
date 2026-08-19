# Microsoft Agent Skills

Skills for anything you need on the Microsoft ecosystem.

A skill is a folder with a `SKILL.md` in it: a piece of hard-won practice, written down once, that your coding agent loads when it is relevant. These cover the Microsoft stack specifically - Copilot Studio, Microsoft Foundry, Power Platform, Dynamics 365, Microsoft 365 and Azure.

**This repo is harness-agnostic by construction.** Most people working on this stack hold a GitHub Copilot licence rather than a Claude subscription, so GitHub Copilot is the primary target and Claude Code, Codex and Cursor are peers. `SKILL.md` is the single source of truth; every harness format is generated from it.

## Install

### Claude Code

The documented route is the plugin:

```
/plugin install microsoft-agent-skills@ragnarpitla
```

If that marketplace is not registered yet, add it first:

```
/plugin marketplace add RagnarPitla/microsoft-agent-skills
/plugin install microsoft-agent-skills@microsoft-agent-skills
```

The repo is its own single-plugin marketplace, which is why the second command names it twice. That is a fallback, not the route to lead with.

### GitHub Copilot

Copilot reads prompt files, chat modes and instructions straight from the repository. Clone it into your workspace, or copy the generated folders into your own repo:

```
git clone https://github.com/RagnarPitla/microsoft-agent-skills
cp -r microsoft-agent-skills/.github/prompts      .github/
cp -r microsoft-agent-skills/.github/chatmodes    .github/
cp -r microsoft-agent-skills/.github/instructions .github/
```

User-invoked skills appear as slash commands. Model-invoked skills load themselves when the task fits.

### Codex

```
git clone https://github.com/RagnarPitla/microsoft-agent-skills
```

Point your Codex configuration at `agents/openai.yaml`. Every skill is listed there with its display name and whether it may be invoked implicitly.

### Cursor

```
git clone https://github.com/RagnarPitla/microsoft-agent-skills
cp -r microsoft-agent-skills/.cursor/rules .cursor/
```

### Anything else

Every skill is a plain Markdown file at `skills/<bucket>/<name>/SKILL.md` with no harness-specific assumptions. If your tool can read a Markdown file into context, it can run these skills. Read the `SKILL.md` directly.

## The skills

Buckets are named for what you are doing, not for the Microsoft product involved, because Microsoft renames products constantly and a skill filed under a renamed product becomes unfindable.

### User-invoked

You reach for these by name.

- [ask-ragnar](./skills/deliver/ask-ragnar/SKILL.md) - not sure which skill you need? Start here.
- [choose-agent-platform](./skills/deliver/choose-agent-platform/SKILL.md) - work out which Microsoft platform an agent should be built on, and write down why.
- [discovery](./skills/deliver/discovery/SKILL.md) - a structured interview that pins down what you are actually building before you build it.

### Model-invoked

Your agent reaches for these on its own when the task fits.

- [copilot-studio-auth-patterns](./skills/connect/copilot-studio-auth-patterns/SKILL.md) - choose and debug authentication for a Copilot Studio agent, including which channels a choice forecloses and whether it can ever yield a token.
- [copilot-studio-knowledge-grounding](./skills/build/copilot-studio-knowledge-grounding/SKILL.md) - diagnose and fix an agent that hallucinates, cites the wrong source, or answers inconsistently.
- [copilot-studio-production-patterns](./skills/build/copilot-studio-production-patterns/SKILL.md) - the patterns that separate a Copilot Studio agent that demos well from one that survives production.
- [explain-concept](./skills/learn/explain-concept/SKILL.md) - explain a Microsoft ecosystem concept after diagnosing what the person actually misunderstands.
- [power-platform-alm-connection-refs](./skills/operate/power-platform-alm-connection-refs/SKILL.md) - fix and prevent solution imports that break on connection references, environment variables and flow ownership.
- [review-copilot-studio-agent](./skills/review/review-copilot-studio-agent/SKILL.md) - review a Copilot Studio agent's YAML for defects that matter before it ships.
- [structured-interview](./skills/deliver/structured-interview/SKILL.md) - interview the user about a plan, design or decision until every open branch is resolved.

## Buckets

| Bucket | What lives there |
| --- | --- |
| [build](./skills/build) | Creating an agent or solution on any Microsoft surface. |
| [connect](./skills/connect) | Wiring an agent to data, systems and tools: connectors, MCP servers, APIs. |
| [review](./skills/review) | Reviewing something that already exists: code, YAML, solutions, architecture, security. |
| [operate](./skills/operate) | ALM, testing, evaluation, governance, monitoring, cost, incident response. |
| [deliver](./skills/deliver) | The consulting layer: discovery, estimating, requirements, decisions, handoff. |
| [learn](./skills/learn) | Learning the stack yourself, and teaching it to others. |

## The registry

Being an honest index matters as much as the skills. Where Microsoft already solves something well, this repo routes to them and says so:

- [registry/microsoft-ecosystem.yaml](./registry/microsoft-ecosystem.yaml) - official Microsoft and community repositories worth linking to, including the archived ones you should stop recommending.
- [registry/connectors.yaml](./registry/connectors.yaml) - how to connect an agent to a given system, what it authenticates as, and what will bite you.

Both are link-checked, as is every URL cited inside a skill or docs page. A link that 404s costs more trust than a missing skill.

## Contributing

Read [AGENTS.md](./AGENTS.md) first. It describes the bucket taxonomy, the invocation model and the sync obligations that keep the repo honest.

```
npm run build     # regenerate every harness artefact from SKILL.md
npm run check     # scrub gate, staleness check and repo validation
npm run validate  # repo validation on its own
```

Two things are enforced rather than trusted:

- **The scrub gate.** This is a public repo written by someone who works on real customer engagements. `npm run scrub` runs on every commit. Read [.agents/confidentiality.md](./.agents/confidentiality.md) before publishing anything.
- **Accuracy.** Our readers spot a wrong CLI flag or an invented connector instantly, and that costs more credibility than a missing skill. Verify against `learn.microsoft.com` before writing it down, and say so where you could not.

## Licence

MIT. See [LICENSE](./LICENSE).
