This file is the single source of truth for installation language. Copy these blocks verbatim into `README.md`. Do not reword them there, because two differently-worded install instructions is how people end up running the wrong one.

## Claude Code

The repo is its own single-plugin marketplace, so registering it and installing from it are two steps:

```
/plugin marketplace add RagnarPitla/microsoft-agent-skills
/plugin install microsoft-agent-skills@microsoft-agent-skills
```

The name appears twice because the plugin and the marketplace that carries it share a name. That is correct, not a typo.

Verify the manifests before publishing a change to either:

```
claude plugin validate . --strict
```

## GitHub Copilot

Copilot reads the [Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills) open standard natively - the same `SKILL.md` format this repo is written in - in VS Code, the Copilot CLI and the Copilot cloud agent. Clone the repo into your workspace, or copy the generated folder into your own:

```
git clone https://github.com/RagnarPitla/microsoft-agent-skills
cp -r microsoft-agent-skills/.github/skills .github/
```

Every skill appears as a slash command. Model-invoked skills also load themselves when the task matches their description; user-invoked ones carry `disable-model-invocation: true` and wait to be asked.

These are deliberately **not** shipped as `.instructions.md` files. An instructions file is applied by glob, and `applyTo: "**"` means always-on: every skill in this repo would be loaded into every request whether or not it was relevant, and an interview skill that is always applied does not wait to be asked. Two skills here warn about that failure in print, so the build must not commit it.

## Codex

Codex reads the same `SKILL.md` standard, from `<name>/SKILL.md` directories under `~/.codex/skills`. The generated tree is already in that shape, so copy it across:

```
git clone https://github.com/RagnarPitla/microsoft-agent-skills
cp -r microsoft-agent-skills/.github/skills/* ~/.codex/skills/
```

`agents/openai.yaml` is this repo's own manifest of which skills may be invoked implicitly. It is used by the validator, not by Codex - do not point a Codex config at it.

## Cursor

```
git clone https://github.com/RagnarPitla/microsoft-agent-skills
cp -r microsoft-agent-skills/.cursor/rules .cursor/
```

## Anything else

Every skill is a plain Markdown file at `skills/<bucket>/<name>/SKILL.md` with no harness-specific assumptions. If your tool can read a Markdown file into context, it can run these skills. Read the `SKILL.md` directly.
