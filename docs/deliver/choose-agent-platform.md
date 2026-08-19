# choose-agent-platform

## What it does

Interviews you about an agent you are planning, then names one Microsoft platform to build it on - Agent Builder, Copilot Studio, the Microsoft 365 Agents SDK or Microsoft Foundry - and writes down the reasoning in a form you can forward to someone who was not in the room.

The output is deliberately not a feature comparison. It gives you the recommendation, the two or three answers that actually drove it, the runner-up and the specific reason it was rejected, the open questions with named owners, and the condition that would make you revisit the decision.

It asks about ownership, authentication, audience, blast radius and constraints, in that order. Those are the questions that separate the platforms. Feature lists mostly do not, because all four can technically handle the common case.

## When to reach for it

- A customer or stakeholder has asked for "an agent" and you need to commit to a platform before estimating.
- You are being pushed toward a platform for reasons that sound like preference rather than fit, and you want the decision written down either way.
- A prototype was built somewhere convenient and you need to decide whether that is also the right home for production.
- Someone asks you to justify a platform choice made months ago and the reasoning was never recorded.

Reach for something else when:

- You do not yet know what the agent is *for*. Platform choice against a vague problem is a guess with extra steps. Run `discovery` first, then come back.
- The platform is already fixed by a contract, an existing estate or a decision above your pay grade. In that case the useful work is designing within the constraint, not re-litigating it.
- You want a capability matrix. Microsoft maintains those and they are linked from the skill.

## Common questions

**Will it just tell me Copilot Studio every time?**

It recommends Copilot Studio often, because for a large share of enterprise cases it is genuinely correct. But it is built to make the *reason* explicit, and it pushes back in both directions: toward Agent Builder when a business user will own it and nothing external is called, and toward Foundry when evaluation, model choice or governance are real requirements. If the reasoning it gives you is generic, that is a bug - the "because" section should quote your answers back to you.

**Why does it ask who maintains it before asking what it does?**

Because that answer eliminates options faster than anything else, and almost nobody asks it. An agent that a business user in HR will own cannot live in Foundry, regardless of how well it could be built there. An agent the platform team wants in source control with CI cannot live in Agent Builder. Getting this first stops you designing something that is technically correct and organisationally dead.

**It says it cannot answer without knowing the licensing position. Is that a cop-out?**

No, that is the intended behaviour. Copilot Studio credit consumption and Microsoft 365 Copilot per-user licensing genuinely change the answer, and the pricing has moved recently. The skill will not quote figures from memory. It records licensing as an open question with an owner and points you at the pricing page, which is more useful than a confident number that turns out to be a year out of date.

**Can it recommend a hybrid?**

Yes, and it will when the conversational surface and the reasoning have genuinely different requirements - Copilot Studio in front, a Foundry agent behind. It is instructed not to offer hybrid as a way of avoiding a decision, so if you get that recommendation it should come with a clear split of responsibilities.

**The product names it uses do not match what I have been reading.**

Likely a rename. Microsoft Foundry was previously Azure AI Foundry, and older posts still use the old name. The skill accepts either from you and uses the current name itself. Its reference links were verified as resolving when it was written; if one 404s now, treat that as a rename rather than assuming the product is gone.

## It's working if

- The recommendation is one platform, not a shortlist with caveats.
- The "because" section quotes things you actually said, not generic platform properties.
- You are told which option came second and the specific trigger that killed it.
- Anything it could not resolve comes back as a named open question with an owner, rather than a confident guess.
- It tells you what would change the answer later, so the decision has a documented expiry condition rather than silently rotting.
