# respond-to-agent-incidents

## What it does

Gets you through the first minutes of a live agent incident in the right order: work out which layer is actually broken, recover safely (preferring rollback over live debugging under pressure), communicate honestly on a cadence while it is still unresolved, and turn what you learned into one owned prevention action rather than a war story nobody acts on.

It gives a deliberate triage order - platform, then dependency, then recent change, then the agent's own configuration - because fixing the wrong layer first is the most common way the first twenty minutes of an incident get wasted.

## When to reach for it

- An agent has gone down or is answering badly in production, and someone is asking what to do in the next few minutes.
- It is unclear whether the outage is the agent, the underlying platform, or something it depends on.
- A recent deployment is implicated and a decision is needed about rolling it back.
- Stakeholders need a plain-language update while the incident is still open.
- A postmortem needs to produce a named, owned action rather than just a description of what happened.

This one is model-invoked, so it may be reached for automatically the moment a conversation turns into "it's down, what do we do".

Reach for something else when:

- Nothing is actively broken and the question is a calm review of configuration. That is `review-copilot-studio-agent`.
- The question is whether answers have quietly gotten worse over time, not a live outage. That is `evaluate-agent-quality`.
- The incident turns out to be a deployment that was never correctly promoted in the first place. Diagnose that with `power-platform-alm-connection-refs` once the immediate triage above has ruled out platform and dependency issues.

## Common questions

**Why check platform health before looking at the agent at all?**

Because it rules out an entire category of fix with one check. If Power Platform or Azure is having a service incident, changing the agent's configuration will not help and wastes the most valuable early minutes. The skill orders triage so each step rules out the ones below it.

**Isn't it faster to just fix the bug I can see?**

Sometimes, but a fix made under pressure that also happens to improve something unrelated is a second, unreviewed change riding along with the first - and if the incident recurs, you now have two candidate causes instead of one. The skill's recovery guidance is deliberately narrow: do the smallest thing that restores service.

**What if we genuinely don't know the root cause yet - what do we tell people?**

Say exactly that. "Service is restored via rollback; we're still confirming the cause" is honest, sufficient in the moment, and better than a guess stated as fact. The skill is explicit that a wrong root cause announced early costs more trust than an honest "still investigating."

## It's working if

- The first response identifies which layer is implicated - platform, dependency, recent change or agent configuration - before anyone starts editing the agent.
- Rollback is considered and preferred over live debugging when a recent deployment is implicated.
- Stakeholders get updates on a stated cadence even when there is nothing new to report, rather than silence.
- Every postmortem produces at least one action item with a named owner and a date - not just a narrative of what happened.
