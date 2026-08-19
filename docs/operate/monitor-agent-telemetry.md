# monitor-agent-telemetry

## What it does

Sets up the ongoing signals that tell you an agent is healthy and being used, so you find out from a dashboard or an alert rather than from a user's complaint. It ends with a minimum signal set - volume, engagement outcome, latency, error rate and, where available, cost per conversation - wired to an owner and a threshold, not just a screen someone has to remember to open.

It covers what Copilot Studio gives you out of the box versus when Application Insights integration is actually worth the extra wiring, what Microsoft Foundry's observability tooling covers, and why a quiet dashboard is not the same claim as a healthy agent.

## When to reach for it

- An agent shipped with no dashboard, alert or usage number behind it.
- Nobody can say how many sessions escalated to a human last week, or whether that number is rising.
- Latency or error rate needs to be watched continuously rather than checked by hand occasionally.
- Application Insights or Foundry tracing needs to be wired up for an agent.
- A stakeholder asks for a usage report and the only source anyone has is memory.

This one is model-invoked, so it may be reached for automatically when a conversation turns into "how do we know this is working".

Reach for something else when:

- The question is whether answers are still *correct*, not whether the agent is being used or is healthy. That is `evaluate-agent-quality` - the two are complementary and usually both matter, but they measure different things.
- The agent is already visibly broken right now. That is `respond-to-agent-incidents`.
- The concern is quota, credits or spend rather than health signal. That is `plan-agent-capacity-and-cost`.

## Common questions

**We already have Copilot Studio's analytics tab. Isn't that enough?**

Often, yes - it covers sessions, topics, engagement and outcomes without any extra setup, and the skill says to start there rather than reaching for Application Insights by default. Application Insights earns its cost when you need a custom query, a longer retention window, or a shared observability surface alongside other systems in the tenant.

**Why does this keep saying monitoring and evaluation are different things?**

Because a dashboard showing steady sessions and flat errors tells you nothing about whether the answers are still right, and an eval run showing accuracy held steady tells you nothing about whether traffic even continued or the agent got slower. Production agents that only have one of these have a real blind spot, and the skill is explicit about which one it is.

**What's the most commonly missed alert?**

A silence alert - zero sessions when sessions are expected. Teams reliably configure error and latency thresholds and just as reliably forget that no traffic at all is itself a signal, often meaning telemetry broke rather than usage genuinely stopped.

## It's working if

- You can state current volume, engagement outcome, latency and error rate for the agent without opening a transcript.
- At least one of those signals is wired to an alert with a named owner, not just a dashboard.
- The choice between built-in analytics and Application Insights was made deliberately, based on what question needs answering, rather than by default.
- A quiet period gets investigated rather than assumed to mean "all is well".
