# migrate-agent-to-skills

## What it does

Takes an agent that already exists - a bespoke assistant with a 4,000-word system prompt, a Power Virtual Agents era bot, a folder of custom instructions, a hand-rolled Python agent - and moves its behaviour onto versioned skill files that run in GitHub Copilot, Claude Code, Cursor or Codex.

You end up with a much smaller set of skills than the original had sections, a knowledge source holding what was pasted into the prompt, the persona in harness configuration rather than repeated everywhere, and a test set of real prior conversations you can re-run to prove the new agent still handles the old agent's cases.

The argument it makes throughout: a migration is mostly deletion. Moving a monolith verbatim carries forward every contradiction and every rule nobody remembers writing, and it adds a new problem, which is that the extracted files never fire.

## When to reach for it

- The system prompt has grown past the point where anyone reviews changes to it.
- Different people added rules over the years and you suspect some of them conflict.
- You want the same behaviour available in more than one tool, without maintaining it twice.
- You are moving off a platform that is being retired, or off a framework only one person understands.
- A migration already happened, produced tidy skill files, and now nothing gets reached for.
- You want behaviour in pull requests and code review rather than in a text box in a portal.

This one is model-invoked, so it may be reached for automatically once a conversation turns into "how do we break this prompt up".

Reach for something else when:

- You are writing or repairing one skill rather than moving a whole agent. That is `write-a-skill`, and this skill hands off to it for the per-skill craft.
- You have not decided which platform the agent should live on. That decision comes first; `choose-agent-platform` is where it belongs.
- The existing agent gives wrong answers and you want that fixed, not moved. Migrating a grounding problem produces a portable grounding problem.

## Common questions

**Can I not just paste the prompt into SKILL.md files and split at the headings?**

You can, and it takes an afternoon, and it is the outcome this skill is written to prevent. Prompt headings are navigation labels for a human reading top to bottom, not the moments where an agent should load a file. Split there and you get skills whose descriptions read like a table of contents, which is precisely the shape that never fires.

**Why does it insist on capturing transcripts before anything else?**

Because once you start editing you can no longer tell a fix from a regression. The frozen set is the only thing that answers "does the new agent still do what the old one did", and it has to be gathered while the old agent is still the one running. It also doubles as the raw material for writing descriptions, since the opening line of a real conversation is close to a literal trigger phrase.

**How much of a legacy prompt actually survives?**

Less than people expect, and that is the point. Domain knowledge leaves for a knowledge source. Identity leaves for harness configuration. Deterministic branching should have been code all along. What is left - the actual procedures - is often two or three skills where the original had a dozen headings.

**It told me part of my migration is not worth doing. Is that a cop-out?**

No, it is deliberate. The long tail of a monolith is usually rules that fire twice a year, and migrating them badly to claim completeness is worse than leaving them as a documented human process. It will also tell you to check the traffic before starting: an agent nobody uses should be retired rather than ported.

**Why is it so hostile to safety rules written as instructions?**

Because a politely worded sentence in a Markdown file is a suggestion under load, and moving it into a skill file changes nothing about the risk while making everyone feel it was addressed. Anything with a legal, regulatory or financial consequence needs a hard constraint - a tool that refuses, a schema that rejects, a human approval step. The skill says so rather than migrating it neatly.

**What actually makes a skill portable across tools?**

Referring to capabilities generically rather than by one tool's name for them, keeping front matter to the fields every harness agrees on, and assuming the skill can be entered cold with no earlier context. The failure mode worth knowing: a model-invoked skill is emitted as an always-applied instruction in some harnesses, so migrating a monolith into one large model-invoked skill rebuilds the system prompt rather than decomposing it.

## It's working if

- You have a labelled inventory of the old prompt, and a visible pile of rules marked dead or contradictory that a human has now ruled on.
- The migration produced fewer skills than the original had sections, and you can name a real conversation that loads each one and not its neighbour.
- The persona appears exactly once, in harness configuration, rather than at the top of every skill file.
- You can re-run a set of real prior conversations and say which cases changed, including the ones that got better on purpose.
- Something that used to be an instruction is now an `if` statement, a flow, or an approval step.
- The old system prompt has been deleted rather than left in place alongside the skills.
