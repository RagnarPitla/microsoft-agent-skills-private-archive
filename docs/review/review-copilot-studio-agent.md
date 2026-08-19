# review-copilot-studio-agent

## What it does

Reads a Copilot Studio agent's YAML - `agent.mcs.yml` and its topic files - and reports the defects that will cause a production failure, a security exposure or a support ticket. It orders findings by severity, states what it deliberately did not check, and ends with a plain go or no-go.

The blocker list is short on purpose: authentication that does not match the publishing channel, no escalation path, unrestricted fallback in a regulated domain, and secrets or personal data committed to the YAML.

It reads the actual files rather than assuming field names, because the agent YAML schema varies by platform version. When it cannot find a setting, it reports that it could not find it instead of reporting the default it assumed.

## When to reach for it

- You are reviewing a pull request that changes an agent.
- Someone is asking whether an agent is ready to promote to production.
- You have inherited an agent and want to know what is wrong with it before you touch anything.
- An agent is behaving unpredictably and you suspect configuration rather than content.

This one is model-invoked, so it will often be reached for automatically when agent YAML is already in context.

Reach for something else when:

- The agent gives wrong or invented answers. That is content, not configuration - use `copilot-studio-knowledge-grounding`.
- The agent times out or loses context across handoffs. That is `copilot-studio-production-patterns`.
- The problem is that the solution will not import cleanly. That is `power-platform-alm-connection-refs`.

## Common questions

**Why is the blocker list so short?**

Because a long blocker list is not a stricter review, it is a less useful one. Everything on it causes a production failure, a security exposure or a stranded user. Anything that would merely be nicer done differently is either a major, a minor, or explicitly not flagged. Reviews that mix the two get skimmed and ignored.

**It said it could not find a setting rather than telling me the value. Is that a limitation?**

It is the intended behaviour. Field names in the agent YAML differ between platform versions, so a review that asserts what a setting is - based on the schema it remembers rather than the file in front of it - can confidently report a security posture you do not have. Not finding something and saying so is a correct result.

**Why does it publish a list of things it will not check?**

Because that list is what makes the rest trustworthy. It does not judge whether answers are correct, does not comment on tone or topic count, and cannot see anything requiring the live environment - real permissions, actual connector behaviour, whether a knowledge source is populated. Saying so prevents a passing review being read as a guarantee it never made.

**Does it need the environment, or just the files?**

Just the files. That is the limit of what it claims. Anything needing the live environment is listed as out of scope rather than quietly assumed to be fine.

**Is there a shared review engine for the other technologies?**

Still no, and the second review skill landing is what settled it. `evaluate-agent-quality` turned out to be a different shape entirely - it runs an agent and measures answers over time rather than reading files and reporting findings by severity - so the two share a bucket and almost no machinery. The common abstraction stays unextracted until two skills actually want the same one.

## It's working if

- The first thing you read is the worst thing it found.
- Every finding tells you what, where, why it matters in production, and what to do - all four.
- It states which files it reviewed and which it skipped.
- It is willing to say the agent is fine when it is. A review that can never pass anything is not a quality gate.
- Findings that repeat across files are grouped with a count, not restated once per file.
