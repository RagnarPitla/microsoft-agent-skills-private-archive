# explain-concept

## What it does

Explains a Microsoft ecosystem concept to someone who is stuck, after working out what they have actually misunderstood.

Microsoft Learn already exists and is very good, so restating it is worthless. The one thing a skill can do that documentation structurally cannot is diagnose this particular person's confusion and answer that, rather than the question they typed. An explanation aimed at the wrong misunderstanding does not half-land - it reads as incoherent and quietly convinces people the product is a mess.

It sorts confusion into four kinds: a mental model imported from another platform, a search for a name that changed, a question asked one level above where the answer lives, and genuine difficulty. Each needs a different response, and three of the four are fast once identified.

## When to reach for it

- Someone asks what a concept is, or why it behaves the way it does.
- They have read the documentation and are still stuck.
- They are describing behaviour from Salesforce, ServiceNow or a classic chatbot platform and expecting it here.
- They cannot find a feature that was renamed.
- You are onboarding someone into an unfamiliar Microsoft product area.

This one is model-invoked, so it may be reached for automatically when a conversation turns into an explanation.

Reach for something else when:

- The concept is fine and the agent is misbehaving. That is `copilot-studio-production-patterns` or `copilot-studio-knowledge-grounding`.
- They want a decision made rather than a concept explained - which platform, which pattern. That is `choose-agent-platform`.

## Common questions

**Why so much emphasis on diagnosis before explaining?**

Because the failure mode is invisible. A clear, accurate explanation of the wrong misunderstanding still fails, and the person usually blames the product rather than saying "that missed". Two questions up front - what are you building, what did you expect - reveal the real gap most of the time.

**Someone asked me a simple definitional question. Is all this overhead?**

Often the answer is genuinely thirty seconds, and the skill says so explicitly. The rename case in particular should be a fast map from old name to new name and nothing more. Turning it into a teaching moment is the anti-pattern, not the goal.

**Why does it insist on saying the diagnosis out loud?**

So it can be corrected cheaply. Naming what you think they have got wrong in two sentences means a wrong guess costs one exchange instead of a full explanation nobody could use.

**Does it prepare people for certification?**

No, deliberately. Exam objectives move faster than any skill can track and Microsoft's own preparation material is free and in sync. The retirement dates make the point concretely: PL-600 retired on 30 June 2026 and PL-200 retires on 31 August 2026. Anything written here about exam content would already be stale. It points at the official exam pages instead.

**Is it going to tell people they do not need to learn something?**

Yes, and that is one of the main reasons it exists. Documentation has no incentive to say a feature is irrelevant to you. That sentence saves more time than most explanations.

## It's working if

- The answer addressed what the person actually got wrong, not only what they typed.
- Renames were resolved in seconds rather than becoming a lesson.
- Someone was told plainly that a hard concept is genuinely hard, and stopped assuming they were slow.
- Someone was told they did not need to learn something.
- The explanation used their environment and their failure, not a sample scenario.
- Exactly one link was given, and it was read.
