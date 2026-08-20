# de-slop

**Skill:** [`skills/deliver/de-slop/SKILL.md`](../../skills/deliver/de-slop/SKILL.md)

## What it does

Takes a draft that reads like a model wrote it and gives you back something a
person would actually send. It cuts the fluent, agreeable, information-free
sentences, and replaces them with the fact, number, mechanism or opinion that
should have been there instead.

You get the rewritten text first, not a critique. If a sentence had no content
to recover, it is gone rather than reworded.

## When to reach for it

- A proposal, statement of work or customer email reads like a brand deck.
- Your draft leans on "seamless", "robust", "pivotal moment", "evolving
  landscape" or "unlock new levels of".
- Every sentence could be pasted into a competitor's blog post unchanged.
- A document hedges everywhere instead of taking a position anyone can act on.
- A reviewer said the page was fine but could not tell you what it told them.
- You are about to publish a README, a skill body or a docs page and it reads
  a little too smoothly.

Somewhere else instead:

- If the problem is that the *skill* never fires rather than that the prose is
  flabby, that is [write-a-skill](../build/write-a-skill.md).
- If you do not yet know what you are trying to say, no rewrite will save the
  draft. Go to [structured-interview](./structured-interview.md) first.
- If the writing is technically wrong rather than empty, this will not catch
  it. It edits prose, it does not fact-check claims.

## Common questions

**Is this just a banned-words list?** No, and treating it as one produces worse
writing. The list of tells is the cheap half. The test that does the real work
is whether a sentence could appear unchanged in someone else's document. A
sentence can avoid every banned word and still say nothing.

**Will it strip my voice out?** It is written to do the opposite, and there is
a section specifically on what not to flatten. Deliberate style, honest
hedging on a genuinely uncertain claim, and legally required wording are all
left alone. Generic is the target, not distinctive.

**Can it invent detail to make a sentence more concrete?** No, and this is the
failure mode to watch for. A rewrite that adds a number the original did not
contain has replaced empty prose with a false claim, which is worse. The skill
tells you to remove any fact it introduced. Read the output for that.

**Does it enforce a no-em-dash rule?** No. It looks at whether punctuation is
being used as a rhythm crutch, not at whether a particular character appears.
One em dash is ordinary. Four in a paragraph is a tic.

**Why is a writing skill in a Microsoft agent repo?** Because most of the
deliverables on an agent project are prose: the discovery summary, the
platform decision, the handover note, the thing a stakeholder reads instead of
the agent. Those fail for writing reasons far more often than technical ones.

## It's working if

You can point at specific sentences that now carry a fact, a number or a named
consequence where they previously carried a mood. The draft is usually shorter.
A reader who skims it can tell you what was decided and what happens next,
which they could not do before.

If the output is merely shorter and blander, it went wrong. Length was never
the problem.
