# write-a-skill

## What it does

Turns a skill you have drafted, or one that is quietly failing, into a skill an agent actually reaches for.

It fixes the failure that accounts for most dead skills: the `description` field written as a summary of contents rather than as a trigger. The agent only ever sees a name and a description when it decides whether to load a skill, so a description that says "this skill covers authentication" gives it nothing to match on, and the skill sits unused while its author concludes that skills do not work.

Beyond the description it settles the decisions that make or break a skill in use: user-invoked versus model-invoked, whether the skill is secretly doing two jobs, what to write down versus what to link to, and how to test that it fires when it should and declines when it should not.

## When to reach for it

- You are drafting a new `SKILL.md` and want it to be reached for rather than admired.
- A skill is installed, correct, and never fires.
- A skill fires on everything, including conversations it does not help.
- You cannot decide whether something should be user-invoked or model-invoked.
- A skill has grown a second job and you are not sure whether to split it.
- You are reviewing someone else's skill before it ships.

This one is model-invoked, so it may be reached for automatically when a conversation turns into skill authoring.

Reach for something else when:

- You want to know which existing skill fits your situation. That is `ask-ragnar`.
- You want the repository's structural contract - buckets, sync obligations, harness generation. That is `AGENTS.md`, and the skill points you there rather than restating it.

## Common questions

**Is the description really the most important part? It is one line.**

It is the only line the agent reads before deciding. The body is not loaded at that point, so a body full of hard-won judgement changes nothing if the description never matched. Treating it as a one-line afterthought is precisely why so many skills sit unused, and it is the cheapest thing in the whole file to fix.

**Why does the skill push back on "this skill covers X" phrasing so hard?**

Because it is the natural thing to write and it is unmatchable. Nobody describes their problem as "I would like to cover authentication" - they say the token is empty, or the agent cannot publish where they expected. A trigger written in symptoms matches what people actually type; a summary written in topics matches nothing.

**Everything sounds better model-invoked. Why not make all of them that?**

Because an always-reachable skill that takes over the conversation is a genuinely bad experience. An interview-style orchestrator marked model-invoked gets emitted by some harnesses as an always-applied instruction, and then it hijacks every conversation - the user asks for a one-line fix and gets interrogated about scope. The skill gives you the test: is it useful for the agent to start this unprompted?

**Why does it refuse to let me write down limits, quotas and CLI flags?**

Because they change, and readers act on them without checking. A stale number is worse than a link, and worse than the number alone suggests: one wrong specific makes a reader distrust everything else in the file. The skill has you write around the specific and point at the source.

**Will this not make my skill shorter than it feels it should be?**

Probably, and that is the intent. Anything the product documentation already says as well or better is overhead that goes stale on someone else's release schedule. What is left is the part only you have: what to check first, what a symptom usually means, and what cannot be fixed at all.

## It's working if

- Your description reads as a list of occasions in the user's words, not a list of the sections in your file.
- You can name the phrasings the skill should match, and you tested at least one of them from a cold session.
- The skill fires when you describe the problem naturally, and stays out when you describe an adjacent one.
- The invocation choice was made by asking whether the agent should start it unprompted, and the two places it gets declared agree.
- The body got shorter, because the parts that restated the documentation were replaced by a link.
- An agent that did not write the skill can follow it and reach the outcome you intended.
