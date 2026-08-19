---
name: copilot-studio-production-patterns
description: "The patterns that separate a Copilot Studio agent that demos well from one that survives production. Use when an agent is being designed for or promoted to production, when an agent works in test but fails with real users, when calls to slow backend systems time out, when context is lost across a multi-agent handoff, or when preparing a production readiness review."
---

<!-- Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`. -->
<!-- Source: skills/build/copilot-studio-production-patterns/SKILL.md -->
Most Copilot Studio material teaches you to build a chatbot. Almost none of it
teaches you to build something that survives contact with a real tenant, real
latency and real users. This skill is about the gap between those two.

Four failure modes account for most of it. Work through whichever ones apply -
you rarely need all four.

## 1. Synchronous calls to systems that are not fast

**The failure.** An action that returns in 200ms in test is wired
synchronously. In production it calls a legacy system that takes 45 seconds,
and the request times out. Worse, it often fails *silently* - the user gets a
generic apology rather than an error, so nobody reports it as a bug and it
survives to go-live.

**Why it survives testing.** Test data is small and warm. Production data is
large and cold. Latency in test tells you almost nothing about latency at
month-end against a system under load.

**The pattern.** Decide synchronous versus asynchronous per action, from the
backend's worst case, not its average:

- Fast and reliable, under a couple of seconds worst case - call it directly.
- Slow, variable, or a system you do not control - go asynchronous. Acknowledge
  immediately, queue the work, carry a correlation ID, and notify the user when
  it completes rather than holding the conversation open.
- Anything human-approved is asynchronous by definition. The wait is unbounded.

**What to ask the user.** For each backend call: what is the p99, not the
average? What happens on timeout - retry, fail, or escalate? Is the operation
safe to retry, or would a retry double-post something? That last one is the
question that turns a timeout into a financial incident.

**Do not** state specific Azure service configurations or quota numbers from
memory. The shape of the pattern is stable; the service limits are not. Point
at the docs for anything numeric.

## 2. Context lost across agent and topic boundaries

**The failure.** Multi-agent delegation loses who the user is and what they
were doing. The receiving agent re-asks for information the user already gave,
or worse, acts without the security scope it should have inherited.

**The pattern.** Do not rely on session variables crossing boundaries. Pass an
explicit **context envelope** at delegation time - a single structured object
carrying, at minimum:

- who the user is, and what they are authorised to see
- what they were trying to do, in their words
- where they came from, so control can return there
- anything already collected, so it is not asked twice

The point is that the envelope is *explicit and versioned*. Implicit context
sharing is what breaks, because it is invisible until it is missing.

**What to ask the user.** Which agent owns which decision? What must the
receiving agent know that it cannot look up itself? And on return, what does
the calling agent need back?

## 3. Slot-filling used where routing belongs

**The failure.** The agent interrogates the user for every parameter before
doing anything. Users abandon it, because it feels like a form that talks.

**The pattern.** Establish intent first, then collect only what that intent
actually needs. Look up what you can rather than asking - if the user is
authenticated, you already know who they are, and asking for their employee
number is a self-inflicted wound. Ask for the smallest set that cannot be
derived.

**Rule of thumb.** If a question could be answered by a system you can already
reach, it is a lookup, not a question.

## 4. Grounding that is fine in test and wrong in production

**The failure.** The agent cites confidently and incorrectly, or answers from
general model knowledge in a way that looks authoritative and is not.

**The proximate causes are builder-fixable**, even though model uncertainty is
not:

- knowledge sources too broad, or containing outdated documents nobody removed
- general knowledge fallback left enabled when the agent should only answer
  from curated content
- documents structured for humans rather than retrieval - long, unstructured,
  no clear headings
- permissions differing between the builder and real users, so retrieval in
  test sees documents production users cannot

**That last one is the sneaky one.** The builder is usually an admin. Test
grounding as a user with the *least* access, not the most.

## Production readiness review

Run this before go-live. It is a checklist for a conversation, not a form.

**Identity and authorisation**
- Is a human in the loop? If yes, the agent should act as the user. If no, it
  acts as itself and you are protecting a service identity, not a session.
- Is the credential scoped to what this agent needs, or is it a full-admin key
  because that was what worked? Ask directly; the answer is often the latter.
- Where do non-Microsoft credentials live? They should not be in the agent.

**Failure behaviour**
- What does the user see when a backend is down? Generic apologies hide
  outages for weeks.
- Is there an escalation path to a human, and is it reachable when the agent is
  confused rather than only when the user asks?
- Are failures observable? If nobody is alerted, the agent has no owner.

**Environments and ALM**
- Does it move between environments cleanly, or is promotion manual? Knowledge
  source bindings and connection references are the usual casualties.
- Are environment-specific values externalised rather than hardcoded?

**Data and compliance**
- What personal data does it touch, and is that recorded?
- Do DLP policies in production differ from where it was built? This is a
  common late surprise.

**Evidence**
- What test cases exist, and were they run against production-like data and
  production-like permissions?
- Who signed off, and against what criteria?

## How to work

Ask which failure mode they are seeing, or whether this is a pre-go-live
review. Do not walk all four sections if only one applies.

Prefer questions to assertions. You do not know their backend latency, their
tenant's DLP posture or their security model, and guessing at those produces
confident advice that is wrong in their specific case.

State plainly when something is a **product limitation** rather than a
buildable fix. Knowledge source portability across environments is a real
constraint, not a thing they configured wrongly. Telling someone to fix
something unfixable wastes their afternoon and costs you their trust.

## Do not

- Quote quota limits, timeout values, throttling thresholds or pricing from
  memory. These change. Point at the documentation.
- Name Azure services as *required*. The async pattern needs a queue and a
  correlation ID; which service provides that is an architecture decision that
  depends on what they already run.
- Assume generative orchestration versus classic topics. Ask - the answer
  changes most of this advice.
- Present community patterns as official Microsoft guidance. Where a pattern
  comes from a practitioner rather than the docs, say so.

## Sources

Verified as resolving on 2026-08-18.

- Why your Copilot Studio agent fails in production, and how to fix it - MVP
  TechCommunity post; the primary source for the async, context envelope and
  intent-first patterns above:
  https://techcommunity.microsoft.com/discussions/mvp-forum/why-your-copilot-studio-agent-fails-in-production-and-how-to-fix-it/4528145
- Knowledge sources in Copilot Studio:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-copilot-studio
- End-user authentication configuration:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-end-user-authentication
- Generative mode and orchestration:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/nlu-gpt-overview
- Generative actions:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-generative-actions
