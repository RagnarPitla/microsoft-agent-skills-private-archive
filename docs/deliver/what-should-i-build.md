# what-should-i-build

## What it does

Interrogates you about a request for "an agent" and comes back with one of four answers: you need nothing, you need to use something that already exists, you need to govern the agents you already have, or you genuinely need to build. Each answer arrives with the reasoning quoted back from what you said, the option you walked in expecting and why it was ruled out, and the open questions with named owners.

It sits one step before the platform decision. It does not compare Copilot Studio against Foundry against declarative agents - that is a different conversation, and this skill hands it over rather than duplicating it.

The most useful thing it produces is often the answer nobody wants to give: that a Power Automate flow, a Power BI report, a Graph connector or a well-configured search box solves the problem for less money, with no hallucinations and no maintenance owner to find.

## When to reach for it

- Somebody has asked for "an agent" and you are not convinced they need one.
- The room is arguing about Scout versus Copilot Studio versus something Azure-hosted, and the options are so different that the argument is a sign nobody has defined the problem.
- Two people are using the word "Copilot" and you suspect they mean different products.
- You already have a pile of agents nobody can inventory, and the next request is for one more.
- Somebody wants to spend a quarter building something that a licence would deliver next week.

Reach for something else when:

- You already know you are building, and the question is which platform. Run `choose-agent-platform`; that is exactly the decision it owns.
- You do not yet know what the underlying business problem is. `discovery` comes first - this skill is a decision, and a decision against a vague problem is a guess.
- The surface is already fixed by contract, licensing or a decision above you. Designing within the constraint is the useful work.

## Common questions

**Is "you do not need an agent" a real output, or a way of dodging the question?**

It is a real output and it is treated as first-class. The test it applies is whether you can write down every output before the system runs. If you can, the requirement is deterministic and an agent adds per-message cost plus an output you have to evaluate rather than assert. When that happens you get a named alternative - a flow, a report, a form, a pipeline, a search fix - not a shrug.

**Why does it ask whether the thing repeats before anything technical?**

Because it is the cheapest question and it ends the most conversations. A large share of requested automation is somebody describing one bad week. If it happened once, the answer is a person doing it once more. Asking that first costs nothing; discovering it after a design workshop costs a fortnight.

**It refused to tell me which licence I need. Why?**

Deliberate. Licensing and availability move faster than anything else in this ecosystem, and a wrong tier quoted confidently to a customer is expensive in a way that a missing answer is not. The skill treats licensing as a gate you must close yourself: it will ask whether your users are licensed, who pays if they are not, and whether anybody has confirmed it in the tenant rather than inferred it from a keynote. Then it records that as an open question with an owner.

**Why is governance one of the answers? I asked what to build.**

Because sometimes the honest diagnosis is that the organisation is suffering from the agents it already has rather than missing one. If nobody can list what exists, two teams have built the same thing, or an agent is still running for someone who left, then building another one makes the real problem worse. The skill will say so and point you at Microsoft Agent 365 instead of a designer.

**Does it overlap with `choose-agent-platform`?**

They are adjacent, not overlapping. This skill decides whether you are building at all. `choose-agent-platform` decides where, once you are. If this one concludes "build", it stops and tells you to run that one by name, carrying the answers forward so you are not interviewed twice.

## It's working if

- You get one answer - nothing, consume, govern or build - rather than a shortlist with caveats.
- The reasoning quotes things you actually said, not generic properties of Microsoft products.
- At least sometimes it talks you out of the agent, and names the flow, report or search fix that replaces it.
- The option you arrived expecting is named explicitly, along with the specific answer that killed it, so it does not get relitigated by somebody who missed the meeting.
- It hands you off to the platform decision rather than trying to make it, and licensing leaves the room as an open question with an owner rather than as a number somebody guessed.
