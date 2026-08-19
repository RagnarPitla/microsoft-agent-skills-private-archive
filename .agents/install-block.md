This file is the single source of truth for installation language. Copy these blocks verbatim into `README.md`. Do not reword them there, because two differently-worded install instructions is how people end up running the wrong one.

## Claude Code

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

## GitHub Copilot

Copilot reads the [Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills) open standard natively - the same `SKILL.md` format this repo is written in - in VS Code, the Copilot CLI and the Copilot cloud agent. Clone the repo into your workspace, or copy the generated folder into your own:

```
git clone https://github.com/RagnarPitla/microsoft-agent-skills
cp -r microsoft-agent-skills/.github/skills .github/
```

Every skill appears as a slash command. Model-invoked skills also load themselves when the task matches their description; user-invoked ones carry `disable-model-invocation: true` and wait to be asked.

These are deliberately **not** shipped as `.instructions.md` files. An instructions file is applied by glob, and `applyTo: "**"` means always-on: every skill in this repo would be loaded into every request whether or not it was relevant, and an interview skill that is always applied does not wait to be asked. Two skills here warn about that failure in print, so the build must not commit it.

## Codex

```
git clone https://github.com/RagnarPitla/microsoft-agent-skills
```

Point your Codex configuration at `agents/openai.yaml`. Every skill is listed there with its display name and whether it may be invoked implicitly.

## Cursor

```
git clone https://github.com/RagnarPitla/microsoft-agent-skills
cp -r microsoft-agent-skills/.cursor/rules .cursor/
```

## Anything else

Every skill is a plain Markdown file at `skills/<bucket>/<name>/SKILL.md` with no harness-specific assumptions. If your tool can read a Markdown file into context, it can run these skills. Read the `SKILL.md` directly.
