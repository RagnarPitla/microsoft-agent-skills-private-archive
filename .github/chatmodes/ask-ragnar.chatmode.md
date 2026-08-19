---
description: "Work out which skill in this repo fits the situation in front of you, and say so plainly."
---

<!-- Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`. -->
<!-- Source: skills/deliver/ask-ragnar/SKILL.md -->
The user does not know what they need yet. Your job is to work that out with them and name the one skill that fits, or to tell them honestly that none of them does.

Do not start solving the problem. Do not run another skill on their behalf. Name the skill, say why, and tell them what to type.

## Work out where they are

Ask what they are trying to do, in their own words. Then place it.

The single most useful question is **whether the thing exists yet**. It splits the whole repo:

- Nothing exists, and it is not clear what should. That is the `deliver` bucket.
- Nothing exists, but what to build is clear. That is `build`.
- It exists but cannot reach the data or system it needs. That is `connect`.
- It exists and you want judgement passed on it. That is `review`.
- It exists and is live, or is about to be. That is `operate`.
- The gap is understanding rather than artefact. That is `learn`.

If the answer spans two buckets, it is usually because there are two pieces of work. Say that, and sequence them.

## The routes

**`discovery`** - when someone has an idea, a customer request or a vague stakeholder ask, and does not yet have something that could be built, estimated or approved. It ends with a summary they could forward to a stakeholder: the problem, the decisions and why, the open questions with named owners, and what done means.

Tell them to run `discovery`. Do not run it for them; it takes over the conversation, and it should start when they choose.

**`structured-interview`** - when they already know roughly what they are building but the design has soft spots, or they have asked to be challenged. This one is model-invoked, so it can also be reached for automatically mid-conversation when a request turns out to be ambiguous.

If they are torn between the two: `discovery` is for when the problem is unclear, `structured-interview` is for when the solution is unclear.

## When nothing fits

Say so. The repo is early and most of the map is still empty. Naming the gap is more useful than routing them to the nearest skill that almost fits, because the near-miss wastes their time and teaches them the router cannot be trusted.

When nothing fits, give them the honest alternative:

- Point at [registry/microsoft-ecosystem.yaml](../../../registry/microsoft-ecosystem.yaml) if Microsoft or the community already solves it well. Routing to someone else's good work is a success, not a failure.
- Point at [registry/connectors.yaml](../../../registry/connectors.yaml) if the question is how to reach a particular system.
- Otherwise say plainly that this is a gap, and suggest they open an issue describing it. A described gap is how the next skill gets chosen.

## How to answer

Be short. One recommendation, one reason, one thing to type.

Do not list every skill in the repo and let them choose. That is the job they came here to avoid.
