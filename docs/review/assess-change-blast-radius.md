# assess-change-blast-radius

**Skill:** [`skills/review/assess-change-blast-radius/SKILL.md`](../../skills/review/assess-change-blast-radius/SKILL.md)

## What it does

Tells you what a Power Platform or Copilot Studio change breaks *somewhere
else* before you ship it, in a platform where you cannot grep for the callers.

You get back a short report: what changed, the single fact the change is safe
because of, how firmly that fact was established, the risks that survived
checking, and the cheapest test that would catch the real failure.

## When to reach for it

- A solution is about to be imported into production and nobody has said out
  loud what else it touches.
- A connection reference is being repointed, or the connection behind it
  reassigned.
- An environment variable's default is changing, and the target environments
  may already have current values.
- A connector is moving into a DLP policy's blocked group.
- Trigger phrases, a topic, or a knowledge source is changing in an agent that
  already answers real questions.
- Someone wants to delete a shared component and is not sure what uses it.
- An agent is about to be published and it is already live on Teams.

Somewhere else instead:

- If the import itself is failing, that is
  [power-platform-alm-connection-refs](../operate/power-platform-alm-connection-refs.md).
- If you want the agent's own configuration judged rather than the reach of a
  change, that is [review-copilot-studio-agent](./review-copilot-studio-agent.md).
- If the question is whether answer quality dropped, measure it with
  [evaluate-agent-quality](./evaluate-agent-quality.md). This skill predicts
  what to measure; that one measures it.
- If it is already broken in production and users are affected, stop here and
  go to [respond-to-agent-incidents](../operate/respond-to-agent-incidents.md).

## Common questions

**Why not just read the solution's component list?** Because the components in
your solution are the things you changed, not the things that depend on them.
A connection reference used by eleven flows across four solutions appears once
in your list and looks like one item.

**What is the "one safety fact"?** Most alarming-looking changes are fine
because of a single condition. Name it, and most of the hypothetical failures
collapse at once. It also makes the report falsifiable: a reviewer can check
one claim instead of arguing with a list of maybes.

**Why grade the evidence?** Because a confident writeup reads identically
whether or not it is true, and that is exactly what makes it dangerous. The
skill asks you to say which rung you reached and to mark anything unproven as
unproven, rather than rounding a plausible inference up to a fact.

**Does it need environment access?** It is more useful with it. The most
valuable step is asking the platform rather than reasoning about it: the
dependency views, the layers, the consumers of a connection reference. Without
access you can still get useful results, but more findings will come back
marked unproven, which is the correct outcome rather than a failure.

**Is this only for production changes?** It earns its time on anything shared.
A change confined to one unmanaged solution in your own dev environment does
not need it.

## It's working if

The report names something you had not thought of, and names it specifically
enough to check in a few minutes: a flow in another solution, an environment
where the variable default will be ignored, a topic that will start losing
traffic to the one you just added.

It is also working when it comes back short and says the change is safe
because of one thing, and that thing turns out to be verifiable. A long list
of theoretical risks is the failure mode, not the deliverable.
