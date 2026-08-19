# ground-agents-in-work-context

## What it does

Works out which layer of the Microsoft IQ stack your agent is actually missing, before you wire anything up. The output is a decision you can defend: workplace signals from Work IQ, business entities and rules from a Fabric IQ ontology, policy documents from Foundry IQ, public facts from Web IQ, or none of the above because a single knowledge source already answers the question.

It also resolves a naming collision that quietly sends people to the wrong product. "Work IQ" is both a Microsoft product and a term a lot of practitioner writing uses for something close to its opposite. Getting that backwards produces an agent that answers confidently from email and calendar about a question that needed a chart of accounts, and nothing in the transcript shows what went wrong.

And it surfaces the identity consequence early, because one constraint quietly rules out a design people attempt all the time.

## When to reach for it

- Your agent can see someone's mail, calendar and Teams messages, but not the approval rules or account structure it needs.
- You are choosing between workplace signals and a semantic model over business data, and you cannot articulate the difference to a stakeholder.
- Someone has drawn a "Business IQ" and "Work IQ" architecture on a whiteboard and you are about to map it onto Microsoft products.
- The agent has to touch GL accounts, cost centres, vendors, purchase orders or approval thresholds.
- You are designing an unattended, overnight or background agent that reads people's mailboxes or calendars.
- An agent is giving fluent answers that are wrong in a way nobody can point at a source for.

This one is model-invoked, so it may be reached for automatically when a conversation turns into a grounding-layer question.

Reach for something else when:

- The agent cites the wrong document, invents a policy, or answers differently for different users. The layer is probably right and retrieval is wrong. That is `copilot-studio-knowledge-grounding`.
- You cannot get a token, or a `User.` variable is empty. That is an authentication problem, not a grounding one - see `copilot-studio-auth-patterns`.

## Common questions

**Is this not the same as knowledge grounding?**

No, and the difference shows up in what the wrong answer looks like. A retrieval problem produces a wrong citation you can point at and argue with. A layer problem produces a confident answer with no citation that could ever have been right, because the fact the agent needed was not in anything it could reach. The first is fixable by curating sources. The second is only fixable by connecting the agent to a different kind of context.

**Why make such a fuss about the naming?**

Because the failure is silent and the search path is a trap. There is no Microsoft product called Business IQ, so someone reading a conceptual "Business IQ / Work IQ" framing goes looking for the one term that appears in both places, finds Microsoft's Work IQ documentation, and wires up a workplace signals layer for a business rules problem. The integration succeeds. The agent responds. Nobody finds out until a number is wrong.

**Can I run this overnight with a service principal?**

Not on Work IQ. Every request runs as a signed-in user and application-only authentication is not supported, so the unattended tenant-sweeping agent cannot be built on it. The workaround people reach for - a service account a human signs in as once - is a shared credential that will not survive a security review, and it fails after the thing is built rather than before. The skill pushes you to split the workload by whether a user is present.

**Do I need any of this for my agent?**

Often not, and the skill will say so. If the answer lives in one SharePoint site or a curated folder of documents, an ordinary knowledge source is the right answer and the IQ stack is overkill with a preview dependency attached. It is worth the weight when the agent reasons across systems that disagree about what a customer is, takes actions that cost money when wrong, or must not be able to break a rule however the request is phrased.

**Why does it not tell me exactly what is GA?**

It does, once, with the date it was checked, and then tells you to re-check. Preview and GA status here moves faster than anything else in the skill, and a stale status claim repeated in six places is six things to correct and six chances to mislead someone building a production plan.

## It's working if

- Somebody in the room says "wait, that is not the same Work IQ" before a connector is configured.
- You can name, in one sentence, which of the four kinds of context is missing and why the other three are not it.
- An unattended-agent design got caught at whiteboard stage rather than at security review.
- A business rule that was living in a system prompt got moved somewhere it is actually checked.
- An agent that did not need the IQ stack got a single curated knowledge source instead, and shipped sooner.
- The maturity question got asked as "what is the status today", not answered from memory.
