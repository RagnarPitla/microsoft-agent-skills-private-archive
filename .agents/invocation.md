Every skill in this repo is either **user-invoked** or **model-invoked**. Pick one deliberately, because the choice decides who can reach the skill and what the skill is allowed to assume.

## The two kinds

**User-invoked** skills are reachable only when the human asks for them by name. They orchestrate: they run a flow, hold state across phases, and decide when to hand off. They are allowed to be opinionated about process because a human chose to start them.

**Model-invoked** skills are reachable by the human *or* by the agent, whenever the task fits. They hold reusable discipline: a review standard, an interview technique, a diagnostic loop. They must be safe to enter mid-conversation, because they often are.

## Declaring it

User-invoked, in `SKILL.md` front matter:

```yaml
---
name: discovery
description: A structured interview that pins down what you are actually building.
disable-model-invocation: true
---
```

and in `agents/openai.yaml` beside it:

```yaml
interface:
  display_name: Discovery
  short_description: A structured interview that pins down what you are actually building.
policy:
  allow_implicit_invocation: false
```

Model-invoked skills omit `disable-model-invocation` entirely, and state the permission explicitly:

```yaml
---
name: structured-interview
description: Interview the user about a plan, decision or design until every branch is resolved. Use when a request is ambiguous, when scope is unclear, or before writing a spec.
---
```

```yaml
interface:
  display_name: Structured interview
  short_description: Interview the user about a plan, decision or design until every branch is resolved.
policy:
  allow_implicit_invocation: true
```

Write the `policy` block on both kinds rather than relying on the default. The two files are
read by different tools, and a reviewer diffing them should be able to see the invocation
decision in each without knowing what a missing block means. `npm run validate` enforces that
the two files agree.

## Writing the description

The two kinds need different descriptions, because different readers act on them.

A **user-invoked** description is read by a human scanning a list. Write it for them: short, plain, outcome-first.

A **model-invoked** description is the *only* thing the agent sees when deciding whether to reach for the skill. It must be trigger-rich. State what the skill does and enumerate the situations that should pull it in. If an agent never reaches for your model-invoked skill, the description is the bug.

## The composition rule

A user-invoked skill may invoke model-invoked skills. A model-invoked skill may invoke other model-invoked skills. **Nothing may invoke a user-invoked skill.**

The reason is that user-invoked skills own the conversation. Two of them running at once fight over who is driving, and the user cannot tell which one produced a given question. Keeping the arrows one-directional means there is always exactly one orchestrator.

If you find yourself wanting to call a user-invoked skill from another skill, that is the signal to extract the shared behaviour into a model-invoked primitive and have both wrappers call it. That is exactly how `discovery` and `structured-interview` are related.

## Invoking another skill

Be explicit and unambiguous. Name the skill and state that it should be invoked, so the instruction survives translation into every harness format:

> Invoke the `structured-interview` skill.

Do not write "you may want to consider the interview approach". Soft language gets ignored under load.

## Choosing

Ask: **is it useful for the agent to start this on its own, without being asked?**

If yes, make it model-invoked. A review standard, a debugging discipline, a writing convention: the agent reaching for these unprompted is the whole point.

If no, make it user-invoked. Anything that takes over the conversation, asks a long series of questions, writes to the issue tracker, or costs real money should wait to be asked. An agent that spontaneously starts interviewing the user about scope is an agent that is hard to work with.

When genuinely torn, ship it model-invoked with a tightly-scoped description. It is easy to narrow a description later; it is hard to discover that a user-invoked skill nobody knew about was the answer all along.

## Keeping wrappers thin

A user-invoked wrapper over a single primitive should be a few lines. It exists to give the human a name to type and to set any framing the primitive needs. It should not restate the primitive's logic, because then the two drift apart and the wrapper wins silently.
