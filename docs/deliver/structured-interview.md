# structured-interview

## What it does

Interviews you about a plan, design or decision until nothing is left silently assumed. It treats the work as a decision tree, asks every question that is currently answerable in one round, then waits, and lets your answers reshape what it asks next.

It is the primitive underneath the interview-shaped skills in this repo. `discovery` is a thin wrapper over it.

## When to reach for it

- A request is ambiguous and you would otherwise start building on a guess.
- You are about to write a spec, an estimate or an architecture decision.
- You want a design stress-tested, or you have asked to be challenged.
- You are not certain what "done" means for the thing in front of you.

Reach for something else when:

- You are starting from a vague stakeholder ask and need a stakeholder-ready summary at the end. Use `discovery`, which adds that framing.
- The decision is already made and you want it reviewed. That is a `review` bucket skill.

## Common questions

**Why one round of many questions instead of a back-and-forth?**
Because questions that do not depend on each other should not be serialised. Asking the whole answerable frontier at once means you answer in one sitting, and each round genuinely changes the next.

**It went and read the repo instead of asking me. Is that intended?**
Yes. Facts are its job, decisions are yours. Anything it can look up, it looks up. You are only asked for judgement calls, which is the part only you can supply.

**Why does it keep a question open instead of picking a sensible default?**
A default chosen for you and mentioned afterwards is how scope drifts. If it is genuinely a judgement call, it stays open until you settle it or explicitly defer it.

**Can it be invoked automatically?**
Yes, it is model-invoked by design, because reaching for it unprompted when a request is ambiguous is the whole point. Skills that take over the conversation are user-invoked instead.

## It's working if

The frontier empties: every branch has been visited and you are asked to confirm a written summary in your own words. You should be able to point at a decision in that summary and remember choosing it.

If you find yourself answering questions you would rather it had looked up, that is a bug in how it is being used, not a feature.
