---
name: ask-ragnar
description: Work out which skill in this repo fits the situation in front of you, and say so plainly.
disable-model-invocation: true
---

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

**`choose-agent-platform`** - when the question is which Microsoft platform to build an agent on: Agent Builder, Copilot Studio, the Microsoft 365 Agents SDK or Microsoft Foundry. It asks the questions that actually separate them, which are mostly about ownership, authentication and what happens when the agent is wrong, and it ends with a recommendation plus the rejected runner-up and why.

Tell them to run `choose-agent-platform`. It is a decision they should enter deliberately, so let them start it.

This one often runs *before* `discovery` rather than after. If they do not yet know what the agent is for, send them to `discovery` first, because platform choice made against a vague problem is a guess. If the problem is clear and only the platform is open, go straight here.

**`copilot-studio-production-patterns`** - when a Copilot Studio agent already exists and the problem is that it does not survive real use: timeouts against slow backends, context lost across a multi-agent handoff, an interrogation-style conversation users abandon, or grounding that cites confidently and wrongly. Also the right call for a pre-go-live readiness review.

This one is model-invoked, so it can be reached for automatically when a conversation turns into a production problem. You do not have to send them anywhere - if that is what they are describing, you can start using it.

The distinguishing question is whether the agent exists yet. Designing one is a `build` problem in the ordinary sense; this skill is for one that exists and misbehaves under real conditions.

**`copilot-studio-knowledge-grounding`** - when the complaint is about *answer quality* rather than mechanics: the agent invents things, cites the wrong document, or gives different answers to different people. Also the right call when curating knowledge sources before go-live.

Also model-invoked, so you can simply start using it when that is what they are describing.

The two production skills split cleanly. If the agent fails or behaves badly - timeouts, lost context, abandoned conversations - that is `copilot-studio-production-patterns`. If it responds fine but the *content* is wrong, that is this one.

**`power-platform-alm-connection-refs`** - when the problem is deployment rather than behaviour: a solution import that leaves flows switched off, a pipeline that needs someone to reconnect things by hand every time, or something that ran for months and broke when a colleague left. Also the right call before promoting to production.

Model-invoked, so you can start using it directly.

Watch for this one hiding behind a Copilot Studio question. "My agent works in test but not production" is sometimes a grounding or production-patterns problem and sometimes a deployment problem. Ask whether the agent *behaves* differently or was never correctly deployed - those go to different skills.

**`copilot-studio-auth-patterns`** - when the blocker is identity: deciding how users sign in, an agent that cannot get a token to call an API on the user's behalf, a `User.` variable that is empty or has gone Unknown, an agent that cannot reach the channel the customer expected, or a requirement that only certain people may talk to it.

Model-invoked, so you can start using it directly.

The distinction that matters here is *whose identity is the problem*. If the question is how the **person** signs in and what the agent knows about them, this is the one. If the question is what the **agent** authenticates as when it reaches SharePoint, Dataverse or an API in another environment, that is `power-platform-alm-connection-refs`. People bring the second one described as the first constantly, so ask which identity is failing before routing.

**`review-copilot-studio-agent`** - when they want judgement passed on an agent that already exists: a pull request that changes it, a promotion decision, or an agent they have inherited and do not trust. It reads the YAML and reports what would hurt in production, ordered worst first.

Model-invoked, and often already applicable, since agent YAML is usually in context when someone asks this.

The clean split across the Copilot Studio skills is *what kind of wrong*. Configuration wrong is this one. Content wrong is `copilot-studio-knowledge-grounding`. Behaviour wrong under load is `copilot-studio-production-patterns`. Sign-in, tokens and channel reach are `copilot-studio-auth-patterns`. Never deployed properly is `power-platform-alm-connection-refs`.

## When nothing fits

Say so. The repo is early and most of the map is still empty. Naming the gap is more useful than routing them to the nearest skill that almost fits, because the near-miss wastes their time and teaches them the router cannot be trusted.

When nothing fits, give them the honest alternative:

- Point at [registry/microsoft-ecosystem.yaml](../../../registry/microsoft-ecosystem.yaml) if Microsoft or the community already solves it well. Routing to someone else's good work is a success, not a failure.
- Point at [registry/connectors.yaml](../../../registry/connectors.yaml) if the question is how to reach a particular system.
- Otherwise say plainly that this is a gap, and suggest they open an issue describing it. A described gap is how the next skill gets chosen.

## How to answer

Be short. One recommendation, one reason, one thing to type.

Do not list every skill in the repo and let them choose. That is the job they came here to avoid.
