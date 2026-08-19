# evaluate-agent-quality

## What it does

Turns "the agent seems fine" into a number somebody else can check. It walks you through deciding what "correct" means for a system that produces different words every time, building a first eval set you can actually populate, and re-running it when something changes so you find out that the agent got worse before your users do.

It argues that the expensive decision is not tooling. It is getting whoever owns the outcome to look at real answers and draw the line between acceptable and not, because a suite built on the builder's taste only measures whether the agent agrees with the builder.

The assertions it tells you to make are the ones that survive generative output: groundedness, refusal when out of scope, routing, latency as a trend rather than a threshold, and no leakage across identities. Exact wording is reserved for the rare case where the wording is legally load-bearing.

## When to reach for it

- An agent is about to ship and the only testing was somebody typing a few questions into the test pane.
- An agent that used to answer correctly now does not, and nobody can say when it broke.
- A knowledge source was re-indexed or a model version rolled forward, and the blast radius is unknown.
- A stakeholder wants to know how accurate it is and there is no number to give them.
- You cannot decide what "correct" even means for a generative answer.
- The agent works for you and fails for someone with different permissions.

This one is model-invoked, so it will often be reached for automatically.

Reach for something else when:

- You want a point-in-time read of an agent's configuration without running it. That is `review-copilot-studio-agent`.
- One reproducible answer cites the wrong source. That is a grounding defect - `copilot-studio-knowledge-grounding`.
- The permission model itself is what is in doubt, rather than whether the agent respects it. That is `copilot-studio-auth-patterns`.

## Common questions

**How is this different from reviewing the agent?**

A review reads the agent; an evaluation runs it. A review works on a pull request with no environment and catches defects visible in the YAML. An evaluation needs the agent to actually answer, and catches the failure a review structurally cannot see: the fluent, confident, subtly wrong answer. Most of the ways an agent regresses - re-indexed knowledge, a model version rolling forward, an expired connection, a promotion into an environment with different data - never appear in a diff at all.

**Do I need a licence, a platform or a pipeline to start?**

No, and waiting for one is the common failure. The minimum viable version is a spreadsheet with six columns - question, identity, expected behaviour, actual answer, pass or fail, date - and thirty rows. The second run is where all the value is, so the artefact that gets run twice beats the framework that never gets populated.

**Can I have a model generate the test set?**

For volume, after you have written the hard cases yourself. Generated questions cluster around what the documentation says the agent does, which is the region that already works. The sets worth having come from production: real transcripts contain phrasings you would never have invented.

**Why does it insist on running as more than one identity?**

Because two different failures hide there and only one of them is visible. An under-permissioned user gets a broken agent - empty retrieval, a silent nothing - and will eventually complain. Over-permissioned retrieval surfaces a document to someone who should never have seen it, and produces no error, no ticket and no way to find out except by testing for it.

**Why no latency threshold?**

Because a number invented here would be wrong for your agent. Copilot Studio measures end-to-end response time and deliberately assigns no pass or fail; this skill follows that, treating latency as a distribution to watch until you know what normal looks like, and a budget you set only afterwards.

**Does it tell me the test set size caps and retention windows?**

Deliberately not. Those exist on both platforms and are exactly the kind of number that changes, so the skill tells you they exist and to read the current values. It also tells you to keep the spreadsheet after moving into a tool, because results age out and the questions and agreed expectations are the asset.

## It's working if

- Somebody who owns the outcome, not the builder, has said in a sentence what "correct" means.
- Your set contains questions the agent must refuse, and refusals are asserted as passes.
- The same set has been run as at least two identities with contrasting access.
- There has been a second run, on a different date, compared against the first.
- A failing case tells you whether routing or content was wrong, because those are asserted separately.
- You can hand the whole thing to somebody else and they can run it without you.
