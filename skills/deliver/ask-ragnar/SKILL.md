---
name: ask-ragnar
description: Work out which skill in this repo fits the situation in front of you, and say so plainly.
disable-model-invocation: true
verified_on: 2026-08-18
provenance: "Watching people install a skill collection and then ask which one to use, which is the question the collection itself should answer."
---

The user does not know what they need yet. Your job is to work that out with them and name the one skill that fits, or to tell them honestly that none of them does.

Do not start solving the problem yourself. Do not start a **user-invoked** skill on their behalf - those wait to be asked for, and starting one takes the conversation somewhere they did not choose to go. Name it, say why, and tell them what to type.

Model-invoked skills are different. Once you have named the skill and said why, you may go straight into it, because that is how those skills are meant to be reached. Each route below says which kind it is.

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

**`what-should-i-build`** - when someone has asked for "an agent" and it is not yet established that they need one. It has four honest outcomes, and only one is a build: nothing (the requirement is deterministic and wants a flow, a report, a form or a page), consume (Scout or Cowork already do this and they are the user, not the builder), govern (the agents exist and the real problem is that nobody can inventory them, which is Agent 365), or build.

Model-invoked, so you can start using it directly.

Route here *before* `choose-agent-platform` whenever the need for an agent is itself unproven. Picking a platform for a problem that did not need an agent is a confident answer to the wrong question, and it is expensive to unwind. The tell is a requirement phrased as "when this happens, do that", with no judgement anywhere in it.

**`choose-agent-platform`** - when the question is which Microsoft platform to build an agent on: Agent Builder, Copilot Studio, the Microsoft 365 Agents SDK or Microsoft Foundry. It asks the questions that actually separate them, which are mostly about ownership, authentication and what happens when the agent is wrong, and it ends with a recommendation plus the rejected runner-up and why.

Tell them to run `choose-agent-platform`. It is a decision they should enter deliberately, so let them start it.

The two split cleanly on *whether an agent is warranted*. `what-should-i-build` decides that. `choose-agent-platform` assumes it and picks the platform. If someone arrives certain they are building and only the platform is open, go straight to the second. If the certainty is unearned, spend ten minutes on the first.

If they do not yet know what the agent is for, send them to `discovery` first, because platform choice made against a vague problem is a guess. If the problem is clear and only the platform is open, go straight here.

**`copilot-studio-production-patterns`** - when a Copilot Studio agent already exists and the problem is that it does not survive real use: timeouts against slow backends, context lost across a multi-agent handoff, an interrogation-style conversation users abandon, or grounding that cites confidently and wrongly. Also the right call for a pre-go-live readiness review.

This one is model-invoked, so it can be reached for automatically when a conversation turns into a production problem. You do not have to send them anywhere - if that is what they are describing, you can start using it.

The distinguishing question is whether the agent exists yet. Designing one is a `build` problem in the ordinary sense; this skill is for one that exists and misbehaves under real conditions.

**`copilot-studio-knowledge-grounding`** - when the complaint is about *answer quality* rather than mechanics: the agent invents things, cites the wrong document, or gives different answers to different people. Also the right call when curating knowledge sources before go-live.

Also model-invoked, so you can simply start using it when that is what they are describing.

The two production skills split cleanly. If the agent fails or behaves badly - timeouts, lost context, abandoned conversations - that is `copilot-studio-production-patterns`. If it responds fine but the *content* is wrong, that is this one.

**`power-platform-alm-connection-refs`** - when the problem is deployment rather than behaviour: a solution import that leaves flows switched off, a pipeline that needs someone to reconnect things by hand every time, or something that ran for months and broke when a colleague left. Also the right call before promoting to production.

Model-invoked, so you can start using it directly.

Watch for this one hiding behind a Copilot Studio question. "My agent works in test but not production" is sometimes a grounding or production-patterns problem and sometimes a deployment problem. Ask whether the agent *behaves* differently or was never correctly deployed - those go to different skills.

**`govern-agent-lifecycle`** - when the question is one level up from a single deployment: nobody can say who owns an agent that is quietly running, a Center of Excellence inventory has gone stale or never existed, an agent needs a deliberate move out of the default environment, or a DLP conflict needs deciding rather than routing around.

Model-invoked, so you can start using it directly.

Against `power-platform-alm-connection-refs`: that one fixes a single broken deployment. This one asks the estate-level question - across everything that is live, who owns it, where does it live, is it governed like the rest of production.

**`monitor-agent-telemetry`** - when an agent shipped with no dashboard, alert or usage number behind it, when nobody can say how many sessions escalated to a human recently, or when Application Insights or Foundry tracing needs to be wired up.

Model-invoked, so you can start using it directly.

The distinguishing question against `evaluate-agent-quality`: is this about whether the agent is *healthy and used* (this one), or whether its *answers are still correct* (that one)? Production agents usually need both, and a healthy-looking dashboard says nothing about answer quality.

**`respond-to-agent-incidents`** - when an agent is failing *right now* and users are affected: it is down, answering badly, or nobody yet knows whether the outage is the agent, the platform, or a dependency. Also the right call for rolling back safely and running the postmortem afterward.

Model-invoked, so you can start using it directly - this is the one to reach for immediately when something is actively on fire, ahead of any of the calmer review or evaluation skills.

Against `review-copilot-studio-agent` and `evaluate-agent-quality`: both of those are calm, structured looks at an agent that is not actively burning. This one is for the first minutes of an incident, when triage order matters more than depth.

**`plan-agent-capacity-and-cost`** - when a Copilot Studio agent is near its message capacity or credit allocation, Foundry quota or token spend needs forecasting before a launch, or a finance stakeholder wants a real cost number and nobody has one.

Model-invoked, so you can start using it directly.

Against `monitor-agent-telemetry`: that one is a health signal, this one is a budget. A capacity or spend question routes here even when it arrived dressed as a monitoring question.

**`copilot-studio-auth-patterns`** - when the blocker is identity: deciding how users sign in, an agent that cannot get a token to call an API on the user's behalf, a `User.` variable that is empty or has gone Unknown, an agent that cannot reach the channel the customer expected, or a requirement that only certain people may talk to it.

Model-invoked, so you can start using it directly.

The distinction that matters here is *whose identity is the problem*. If the question is how the **person** signs in and what the agent knows about them, this is the one. If the question is what the **agent** authenticates as when it reaches SharePoint, Dataverse or an API in another environment, that is `power-platform-alm-connection-refs`. People bring the second one described as the first constantly, so ask which identity is failing before routing.

**`ground-agents-in-work-context`** - when the agent can reach *something* but it is the wrong kind of context: it can see someone's email, calendar and Teams messages but not the approval thresholds or business entities it needs, or someone is choosing between Work IQ, Fabric IQ, Foundry IQ and Web IQ and cannot tell which answers their problem.

Model-invoked, so you can start using it directly.

Two reasons to reach for this quickly. First, there is a genuine naming collision: the conceptual "Work IQ" and "Business IQ" people carry into the conversation map close to the *inverse* of Microsoft's products, so somebody can wire up exactly the wrong layer and the failure is silent - a fluent answer built on the wrong kind of context. Second, Work IQ is delegated-auth only, which quietly kills any unattended background agent designed on top of it. Both are cheaper to hear now than after the build.

Against the two grounding-adjacent skills: if the agent cites a document you can point at and it is the wrong document, that is `copilot-studio-knowledge-grounding`. If no document could ever have answered because the agent is grounded in the wrong kind of context entirely, that is this one.

**`review-copilot-studio-agent`** - when they want judgement passed on an agent that already exists: a pull request that changes it, a promotion decision, or an agent they have inherited and do not trust. It reads the YAML and reports what would hurt in production, ordered worst first.

Model-invoked, and often already applicable, since agent YAML is usually in context when someone asks this.

The clean split across the Copilot Studio skills is *what kind of wrong*. Configuration wrong is this one. Content wrong is `copilot-studio-knowledge-grounding`. Behaviour wrong under load is `copilot-studio-production-patterns`. Sign-in, tokens and channel reach are `copilot-studio-auth-patterns`. Never deployed properly is `power-platform-alm-connection-refs`. Nothing wrong yet, but about to move something else, is `assess-change-blast-radius`.

**`evaluate-agent-quality`** - when the question is not what the agent is configured to do but whether its answers are actually any good, and still as good as they were: it is about to ship on the strength of somebody typing a few questions into the test pane, it used to answer correctly and now does not and nobody can say when it broke, a knowledge source or model version changed and the blast radius is unknown, or a stakeholder wants an accuracy number that nobody has.

Model-invoked, so you can start using it directly.

Against `review-copilot-studio-agent`: that one reads the agent, this one runs it. A review is a point-in-time read of configuration and can be done on a pull request without an environment; an evaluation is a measurement of behaviour over time and needs the agent to actually answer. They fail differently too - a review catches a defect you can see in the YAML, an evaluation catches the fluent, confident, subtly wrong answer that no amount of reading configuration would ever reveal. Route to this one whenever the complaint is about answer quality, or whenever somebody says "it got worse".

One routing trap. "It gives bad answers" arrives constantly and usually means `copilot-studio-knowledge-grounding` - a single reproducible answer citing the wrong source is a grounding defect, not a measurement problem. Come here when nobody can say *which* answers are bad, or whether there are more of them than last month.

**`assess-change-blast-radius`** - when the change itself is fine and the question is what *else* moves when it lands: a solution about to be imported into production, a connection reference being repointed, a connector heading into a DLP policy's blocked group, a shared component someone wants to delete, trigger phrases or a knowledge source changing on an agent that already answers real questions, or a publish on an agent that is already live in Teams.

Model-invoked, so you can start using it directly.

Against `review-copilot-studio-agent`: that one asks whether the thing in front of you is correct, this one assumes it is and asks who else feels it. The two most common arrivals are "is this safe to deploy" and "what could this break", and both belong here rather than with the review skill. If it has already broken and users are affected, neither applies - that is `respond-to-agent-incidents`. If the import itself is failing rather than something downstream, that is `power-platform-alm-connection-refs`.

**`de-slop`** - when the artefact is prose rather than an agent: a proposal or customer email that reads like a brand deck, a summary where every sentence could be pasted into another company's document unchanged, a draft leaning on "seamless" and "robust", or a page a reviewer called fine without being able to say what it told them.

Model-invoked, so you can start using it directly.

Route here for the writing, not the thinking. If someone does not yet know what they are trying to say, no rewrite rescues the draft, and `structured-interview` or `discovery` comes first. If the complaint is that a skill never fires rather than that its prose is flabby, that is `write-a-skill`.

**`explain-concept`** - when they are not stuck on a system at all, they are stuck on an idea. They have read the documentation and it did not land, they are describing how the product worked somewhere else, or they cannot find something that was renamed.

Model-invoked, so you can start using it directly.

Route here rather than to a product skill when nothing is actually broken. "Why does it work this way" is this one; "why is it broken" is one of the four above. And if someone is asking to be told which option to pick rather than what an option means, that is `choose-agent-platform` - explaining will not settle a decision.

**`write-a-skill`** - when the artefact in question is a skill rather than an agent: they are drafting a `SKILL.md`, they installed one and the agent never reaches for it, the description reads like a table of contents, they cannot decide between user-invoked and model-invoked, or they are reviewing someone else's skill before it ships.

Model-invoked, so you can start using it directly.

The give-away is that the thing being built is instructions for an agent rather than an agent. "My agent ignores my skill" sounds like an agent problem and is almost always a description problem, so ask what the description says before routing anywhere else.

**`migrate-agent-to-skills`** - when an agent already exists somewhere else and needs to move: a system prompt nobody can review any more, a monolithic assistant someone wants broken up, a move off Power Virtual Agents or a hand-rolled framework, or a requirement that the same behaviour run in GitHub Copilot, Claude Code, Cursor and Codex at once.

Model-invoked, so you can start using it directly.

It pairs with `write-a-skill` rather than competing: this one decides what should become a skill at all and what should become code, configuration or a deleted rule, and `write-a-skill` is how each surviving piece gets written. If someone has already decided what the skills are and only needs them written well, skip straight to `write-a-skill`.

## When nothing fits

Say so. The repo is early and most of the map is still empty. Naming the gap is more useful than routing them to the nearest skill that almost fits, because the near-miss wastes their time and teaches them the router cannot be trusted.

When nothing fits, give them the honest alternative:

- Point at [registry/microsoft-ecosystem.yaml](../../../registry/microsoft-ecosystem.yaml) if Microsoft or the community already solves it well. Routing to someone else's good work is a success, not a failure.
- Point at [registry/connectors.yaml](../../../registry/connectors.yaml) if the question is how to reach a particular system.
- Otherwise say plainly that this is a gap, and suggest they open an issue describing it. A described gap is how the next skill gets chosen.

## How to answer

Be short. One recommendation, one reason. If it is a user-invoked skill, tell them exactly what to type. If it is model-invoked, say that you are going into it now and then do so.

Do not list every skill in the repo and let them choose. That is the job they came here to avoid.
