---
name: structured-interview
description: "Interview the user about a plan, design or decision until every open branch is resolved. Use when a request is ambiguous, when scope is unclear, before writing a spec or estimate, when the user asks to be challenged or stress-tested, or when you are about to build something and are not certain what \"done\" means."
---

<!-- Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`. -->
<!-- Source: skills/deliver/structured-interview/SKILL.md -->
Interview the user until you and they share the same picture of what is being built. Treat the work as a **decision tree**: every decision opens the decisions that hang off it.

Work in **rounds**. The **frontier** is every decision whose prerequisites are already settled, so you can ask it now without guessing at an answer you have not heard yet. Ask the whole frontier in one round. Then stop and wait.

Format every question like this:

```
Q1 - <short title>
<the question, with the options you see and the trade-off between them>

Recommended: <your answer, and the one-line reason>
```

Always give a recommendation. An interview that only asks costs the user energy; an interview that recommends lets them agree, disagree, or correct you, which is three times faster. Being wrong in a recommendation is useful, because the correction tells you more than a blank answer would.

Each round reshapes the tree. Settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. If a question's answer depends on another question that is still open in this round, it belongs to a later round.

## Facts are yours, decisions are theirs

Never ask the user for something you can find out. If a question needs a fact from the environment, go and get it: read the repo, query the environment, check the documentation, run the CLI. Look it up rather than asking.

Do not block the whole round on one lookup. An in-flight investigation is just an unsettled prerequisite: the questions downstream of it wait, and you ask the rest of the frontier now.

The judgement calls are the user's. Put each one to them and wait. Do not decide on their behalf and mention it afterwards.

## What must be settled

The interview is not done because the functional behaviour is clear. On the Microsoft stack, the decisions that sink projects are rarely functional. Before you call the frontier empty, confirm each of these is either settled or explicitly deferred with the user's agreement:

- **Surface.** Which thing is actually being built on, and why that one rather than the neighbouring option.
- **Operator.** Who owns this once it is live, and whether they can maintain what you are proposing.
- **Identity.** Who the agent acts as, and what it can reach when it does.
- **Licensing and cost.** What this consumes, who pays, and whether the user population is licensed for it.
- **Environments and ALM.** Where it is built, how it gets to production, and who can ship.
- **Data.** Where the data lives, where it may travel, and what must not leave.
- **Governance.** What has to be approved, and by whom, before this is allowed to exist.
- **Done.** What observable thing proves it works.

See [references/dimensions.md](./references/dimensions.md) for the specific question to ask under each, and the answers that should worry you.

Do not turn this into a form. Fold these in as branches of the tree when they become relevant. If one is genuinely irrelevant, say so and move on.

## Finishing

The session ends when the frontier is empty: every branch visited and nothing left silently assumed.

Then write back a short summary of what was decided, in the user's own vocabulary, and ask them to confirm it. Do not start building until they do. If they correct the summary, that correction is a new round, not a formality.

When a decision was hard, non-obvious, or is likely to be questioned in three months, note it as a decision with its reasoning so the next person does not relitigate it.
