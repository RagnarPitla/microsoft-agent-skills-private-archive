# ask-ragnar

## What it does

Works out which skill in this repo fits the situation in front of you, and tells you what to type. One recommendation, one reason, one command.

It will also tell you when nothing here fits, and point you at Microsoft's own work instead. That is the more useful answer more often than you would expect, because the repo is early and most of the map is still empty.

## When to reach for it

- You have a problem on the Microsoft stack and do not know whether this repo helps.
- You are new to the repo and do not want to read every skill to find out which one you need.
- You are torn between two skills that sound similar.

Reach for something else when:

- You already know which skill you want. Run it directly; the router is pure overhead.
- You want the work done rather than routed. The router deliberately stops at the recommendation.

## Common questions

**Why does it not just run the skill it recommends?**
Because the skills it routes to take over the conversation, and a skill that starts without you choosing it is hard to work with. It also keeps the arrows one-directional, which is the composition rule the whole repo is built on: nothing invokes a user-invoked skill.

**How does it decide?**
It asks whether the thing exists yet. That single question splits the repo: nothing exists and it is unclear what should is `deliver`; clear but unbuilt is `build`; built but cannot reach its data is `connect`; built and needing judgement is `review`; live is `operate`; and a gap in understanding is `learn`.

**It told me the repo has nothing for my problem. Is that a failure?**
No, it is the router working. Routing you to a near-miss would waste your time and teach you the router cannot be trusted. A named gap is also how the next skill gets chosen, so it is worth opening an issue describing it.

**Why is it named after a person?**
It is the question you would otherwise ask a colleague who knows the stack. Naming it after the ask rather than the mechanism keeps it obvious what to type.

## It's working if

You leave with the name of one skill and a reason you agree with, in under a minute. If it hands you a list of everything in the repo and asks you to choose, it has failed at the one job it has.
