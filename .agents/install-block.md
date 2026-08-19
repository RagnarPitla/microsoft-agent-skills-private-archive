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

Copilot reads prompt files, chat modes and instructions straight from the repository. Clone it into your workspace, or copy the generated folders into your own repo:

```
git clone https://github.com/RagnarPitla/microsoft-agent-skills
cp -r microsoft-agent-skills/.github/prompts      .github/
cp -r microsoft-agent-skills/.github/chatmodes    .github/
cp -r microsoft-agent-skills/.github/instructions .github/
```

User-invoked skills appear as slash commands. Model-invoked skills load themselves when the task fits.

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
