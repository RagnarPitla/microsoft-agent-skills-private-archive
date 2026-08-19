# plan-agent-capacity-and-cost

## What it does

Works out whether an agent's message capacity, model quota or spend is sized for what it is actually about to do, before a limit gets hit mid-conversation or a bill surprises someone in finance. It ends with a capacity and cost picture reconciled across whatever combination of prepaid credits, pay-as-you-go and provisioned throughput the agent actually uses, rather than a single dashboard number quoted with false confidence.

It covers how Copilot Studio's Copilot Credits are consumed by message type, how Foundry model quota is pooled at the subscription level, when provisioned throughput is actually worth its cost versus pay-per-token, and how to forecast for growth rather than only current usage.

## When to reach for it

- A Copilot Studio agent is close to its message capacity or credit allocation.
- Foundry model quota or token spend needs to be forecast ahead of a launch.
- A finance stakeholder asks what an agent costs, and nobody has a real number to give them.
- Pay-as-you-go and prepaid credits need to be reconciled into one honest figure.
- Usage is growing and nobody has planned for what a launch, integration or marketing push does to the current capacity plan.

This one is model-invoked, so it may be reached for automatically when a conversation turns into budgeting, quota or an unexpected bill.

Reach for something else when:

- The question is whether the agent is healthy or being used, not what it costs. That is `monitor-agent-telemetry` - the two often get raised together but answer different questions.
- The agent is actively broken right now, quota exhaustion included. Triage that first with `respond-to-agent-incidents`, then come here to plan so it does not recur.

## Common questions

**A limit got hit - shouldn't we just buy more capacity?**

Not as the first move. The skill asks first whether the consumption itself is expected - a chat widget firing on page load instead of on click, a retry loop, or a runaway automation are common causes of consumption nobody intended. Buying more capacity to cover an accident just makes the accident more expensive.

**Is provisioned throughput always cheaper than pay-per-token?**

No, and the skill is explicit about this being a genuine trade-off rather than a default choice. Provisioned throughput trades guaranteed capacity for guaranteed spend, billed for what is reserved regardless of use - it wins at sustained, predictable volume and can lose badly at low or spiky volume.

**Why does the Sources section have a shorter review window than other skills?**

Credit rates, quota scoping rules and pricing pages move faster than most Microsoft Learn content - the skill sets an explicit 90-day review date instead of the repo's usual default, and says plainly that any rate quoted should be treated as illustrative until re-checked.

## It's working if

- A capacity or quota question gets a reconciled answer across every billing model in play (prepaid, pay-as-you-go, provisioned), not just whichever number was easiest to find.
- Hitting a limit triggers a check of whether the consumption itself was expected before anyone proposes buying more capacity.
- A launch or growth conversation includes a forecast at several times current volume, not just today's number.
- A cost figure given to a stakeholder is stated with the confidence it deserves - reconciled and current, or explicitly caveated as needing a re-check.
