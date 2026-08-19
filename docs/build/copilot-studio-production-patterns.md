# copilot-studio-production-patterns

## What it does

Works through the four failure modes that account for most of the gap between a Copilot Studio agent that demos well and one that survives production: synchronous calls to slow systems, context lost across agent boundaries, slot-filling used where routing belongs, and grounding that is fine in test and wrong in production.

It also carries a production readiness review covering identity, failure behaviour, environment promotion, data and compliance, and evidence of testing.

It works by asking rather than asserting. It does not know your backend latency, your tenant's DLP posture or your security model, and it is built to ask about those instead of guessing.

## When to reach for it

- An agent works in test and fails, times out or behaves oddly with real users.
- You are preparing an agent for go-live and want a readiness review before someone else does it for you.
- A multi-agent handoff loses the user's identity or context, or re-asks for things already given.
- The agent cites confidently and wrongly, or answers from general knowledge when it should only use curated content.
- You are designing an agent that will call a slow or unreliable backend and want the async decision made deliberately rather than discovered later.

This one is model-invoked, so it may also be reached for automatically when a conversation turns into a production problem.

Reach for something else when:

- You have not yet decided which platform to build on. That is `choose-agent-platform`.
- The problem is that a solution will not import cleanly into another environment. That is an ALM problem, not a production-patterns problem.

## Common questions

**Why does it ask so many questions instead of telling me the fix?**

Because the right answer genuinely depends on things it cannot see. Whether an action should be asynchronous depends on your backend's worst-case latency, not its average, and on whether the operation is safe to retry. An agent that confidently tells you to make everything async is not more useful than one that asks which calls are slow - it is just faster at being wrong.

**It refused to give me a timeout value or a quota number.**

Deliberate. Those numbers change, and a confidently wrong limit is worse than a pointer to the page that is always current. It will describe the shape of the pattern and link the documentation for anything numeric.

**Is this official Microsoft guidance?**

Partly, and it tells you which is which. The async, context envelope and intent-first routing patterns come from a practitioner MVP post, which is cited. The grounding, authentication and orchestration material links to Microsoft Learn. The skill is instructed to attribute community patterns as community patterns rather than presenting everything as official.

**My grounding works perfectly in test. Why does it keep raising permissions?**

Because you are almost certainly an admin and your users are not. Retrieval sees what the *caller* is allowed to see, so an agent tested by an administrator can cite documents that real users cannot open, or answer from content they should never have reached. Testing as the least-privileged user is the check most teams skip.

**It told me something is a product limitation rather than fixing it.**

That is intended. Knowledge source portability across environments is a real constraint, not a misconfiguration. Being told to keep trying to fix something unfixable costs you an afternoon and the skill its credibility.

## It's working if

- It asks which failure mode you are hitting instead of walking you through all four.
- The questions are specific enough to be uncomfortable - worst-case latency, whether a retry would double-post, who signed off and against what.
- It distinguishes what you can fix from what is a product constraint, and says which is which.
- It points at documentation for anything numeric rather than quoting a limit.
- The readiness review surfaces at least one thing you had not considered. Failure observability and least-privilege credential scoping are the usual candidates.
