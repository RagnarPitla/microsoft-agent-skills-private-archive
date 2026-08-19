---
name: write-a-skill
description: "Write or repair an agent skill so it fires when it should and stays quiet when it should not. Use when drafting a new SKILL.md, when a skill is installed but never reached for, when a description reads like a table of contents, when choosing between user-invoked and model-invoked, when a skill has quietly grown two jobs, or when reviewing someone else's skill before it ships."
---

<!-- Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`. -->
<!-- Source: skills/build/write-a-skill/SKILL.md -->
Most skills that fail do not fail in the body. They fail at the door. The
agent never loaded them, because the only thing it had to judge was a name
and a description, and the description described the contents instead of the
occasion. A carefully written skill that never fires is worth nothing, and
the person who wrote it usually concludes that skills do not work.

So start with the description, and treat everything else as the easier half.

## The description is a trigger, not a summary

When an agent decides whether to pull a skill in, it sees the name and the
description and nothing else. The body is not loaded yet. That makes the
description a matching surface, not an abstract: it has to contain the words
the user will actually type and the symptoms they will actually describe.

The reflex that ruins it is writing the description last, from the finished
body. Do that and you summarise, because the body is what is in front of you.
"This skill covers X" is a summary. "Use when X is happening to you" is a
trigger.

A worked rewrite. Before:

> This skill covers authentication in Copilot Studio, including the
> authentication options, channel considerations and token handling.

Every word is true and none of it matches anything a person in trouble will
say. Nobody types "I would like to cover authentication". They type "my agent
cannot call the API as the signed-in user", or "the User variable is empty".

After:

> Choose and debug authentication for a Copilot Studio agent. Use when
> deciding how users sign in, when an agent cannot call a downstream API as
> the signed-in user, when a token or User variable is empty or shows as
> Unknown, when an agent cannot be published to the intended channel, or when
> you need to control who in the organisation can talk to an agent.

One clause of what it does, then the occasions - in the user's vocabulary,
in the shape of symptoms. Notice it names the symptom (User variable is
empty) rather than the mechanism (token propagation), because the person with
the problem knows the symptom and does not yet know the mechanism. That is
the whole trick.

This one is checked by machine, because getting it wrong fails silently: a
summary-shaped description does not error, it just never matches, and the
skill sits unused looking installed. In this repo the validator rejects a
model-invoked skill whose description opens like a summary, carries no
"Use when" clause, or is too short to name a real situation. It also rejects
anything past 1024 characters, which is where the description gets truncated
and the tail you wrote is simply not read.

User-invoked skills are held to none of that. Nothing matches them against a
task - a human picks them off a list - so their description is a menu label
and short is right.

What belongs in the trigger clause:

- Failure phrasings, not only intentions. Skills get reached for by people in
  trouble far more often than by people planning.
- The words users use, including the old product names they still search for.
- Moments as well as symptoms: "before go-live", "when reviewing a pull
  request that changes an agent", "when a diff touches agent.mcs.yml".
- A boundary, when a neighbouring skill is the better answer. A description
  that also repels is more useful than one that only attracts.

One to three sentences. If it takes five to name the triggers, you have two
skills.

The exception is a user-invoked skill, whose description is read by a human
scanning a list rather than by a model deciding. Write that one short, plain
and outcome-first; trigger richness buys you nothing there.

## Choose the invocation deliberately

User-invoked means only the human can start it. Model-invoked means the human
or the agent can, whenever the task fits.

Ask one question: is it useful for the agent to start this on its own,
without being asked? A review standard, a diagnostic loop, a writing
convention - yes, the agent reaching for those unprompted is the entire
point. Anything that takes over the conversation, asks a long series of
questions, writes to an issue tracker or spends real money - no, it should
wait to be asked.

Getting this wrong in the noisy direction is memorable. An interview-style
orchestrator marked model-invoked is emitted by some harnesses as an
always-applied instruction, and an always-applied instruction does not wait
for a matching request. It hijacks every conversation: the user asks for a
one-line fix and gets interrogated about scope and success criteria. Nobody
has to report that bug, because everybody sees it.

The quiet direction fails worse. Reusable discipline shipped as user-invoked
can only be found by someone who already knows it exists, and nobody does.
When genuinely torn, ship model-invoked with a narrow description. Narrowing
a description later is easy; discovering that a hidden skill was the answer
all along does not happen.

Keep the arrows one-directional: nothing may invoke a user-invoked skill. Two
orchestrators running at once fight over who is driving, and the user cannot
tell which one asked the question. Wanting to call one is the signal to
extract the shared behaviour into a model-invoked primitive and have both
wrappers call that instead.

## One skill, one job

The tells that a skill is doing two:

- The description needs an "and" between unrelated occasions - "use when
  designing an environment strategy, or when a solution import fails".
- Half the body never runs for any given reader.
- Two different people arrive for two different reasons and each skips the
  other's half.
- You cannot write a single "it worked if" sentence without writing two.

Split on the occasion that summons it, not on the subject. Two skills about
the same product area that fire at different moments - choosing a design
versus debugging a failure - are correctly separate. One skill covering
everything about that area is not, because its description ends up either so
broad it matches nothing in particular or so specific it misses most of what
it covers.

The opposite mistake is real too. If two halves always run together, they are
one skill, and splitting them only means one of them gets loaded without the
context it needs.

## Write the discipline, not the documentation

A skill that restates the product documentation is overhead. It costs
context, it goes stale on the vendor's release schedule, and the agent
frequently knows it already. The reason to write a skill at all is to encode
judgement that is not in the documentation:

- What to check first, and in what order. The order is often the entire
  value.
- What a symptom usually means in the field, as opposed to what it could mean
  in theory.
- What people get wrong, and why the obvious fix is the wrong one.
- What cannot be fixed at all, so nobody spends a day trying.
- The question worth asking before answering.

The test is paragraph by paragraph: do the official docs already say this as
well or better? If so, delete it and link to them. Their copy updates and
yours does not.

## Refuse to quote perishable specifics

Do not write down quotas, size caps, row limits, prices, SKU names, exact CLI
flag syntax, portal navigation paths, or whether something is preview or
generally available. All of it changes, and a confident wrong answer is worse
than a link, because the reader acts on it without checking.

Write around the specific instead. "Check the current limit before you design
around it" stays true; naming the number is a time bomb with your name on it.
Where a date genuinely matters, record the date you verified it, so a future
reader can tell how much to trust it.

This is not timidity. A skill is trusted at a glance or not at all, and one
stale number is enough to make a reader re-check everything else in it.

## Diagnose before prescribing

Answering the question as asked is usually wrong, because the question
already contains a guess about the cause. Someone asking how to raise a
timeout has decided the problem is the timeout. Someone asking how to word a
prompt better has decided the problem is wording. Answer as asked and you
have politely helped them do the wrong thing.

So a good skill establishes the symptom precisely first, separates symptoms
that look alike but have different causes, and only then prescribes. Say the
diagnosis out loud in a sentence before acting on it - if it is wrong, the
user corrects it immediately and cheaply, whereas a silent wrong diagnosis
wastes the whole answer.

This also keeps a skill from decaying into a checklist. Checklists get
skimmed. An ordered diagnosis gets followed, because each step tells you
which step comes next.

## Keep it portable across harnesses

A skill is plain markdown with front matter. The same file should work in
Claude Code, GitHub Copilot CLI, Cursor, Codex and whatever ships next
quarter, which means the body cannot assume one harness's tooling, file
layout or interface.

- Refer to capabilities generically: search the repository, run the tests,
  read the file. Not by a specific tool's name.
- Keep harness-specific paths, slash commands and settings out of the body.
- Assume a model-invoked skill can be entered cold, mid-conversation, with no
  warm-up and no earlier context.
- Keep front matter to the fields every harness agrees on - a name and a
  description, plus the flag that withholds model invocation on the skills
  that must wait to be asked. Model-invoked is the default everywhere, so
  the absence of that flag is what declares it; do not add a field to say so.

Portability is also a hedge. Harness formats change far more often than the
discipline being written down does, and a body written against one tool's
vocabulary has to be rewritten every time that tool moves.

## Test it before you ship it

Three tests, in this order.

**Does it fire when it should?** Open a cold session and describe the problem
the way a real person would - their words, their symptom, no section
headings - and watch whether the agent reaches for the skill. If it does not,
the description is the bug, not the body. Feed the phrasings that failed back
into the trigger list and try again.

**Does it stay out when it should?** Describe an adjacent problem that
belongs to a different skill. If yours fires anyway, the description is too
broad, and a skill that fires on everything is one that gets ignored on
everything.

**Does a fresh agent reach the right outcome?** Hand the body to an agent
with no memory of writing it and watch what it actually does. This catches
the failure the author cannot see: instructions that are clear to the person
who wrote them and ambiguous to everyone else. Hedged wording is where it
shows first - "you may want to consider" gets dropped under load, imperatives
survive.

Testing on yourself does not count. You know what you meant.

## Do not

- Do not open with "this skill covers", "an overview of" or "everything about
  X". All three announce a summary, and a summary does not fire.
- Do not pad the trigger list with situations the skill handles badly. Firing
  and then disappointing costs more trust than never firing.
- Do not write length to look substantial. A short skill that changes an
  outcome beats a long one that recites background.
- Do not hide the limits. The sentence naming what the skill cannot fix is
  the one readers remember and quote.
- Do not use soft language for the instructions that matter.
- Do not ship without running it once from cold, in a session that has never
  seen it.

## If you are adding one to this collection

File it in the bucket that matches what the user is doing, not the product
involved - products get renamed, and a skill filed under a renamed product
becomes unfindable. Read `AGENTS.md` for the sync obligations that come with
a promoted skill, and `.agents/invocation.md` before declaring invocation,
which has to be declared in two places that must agree. The skill body and
the docs page have different readers and different jobs, so the docs page
describes the outcome rather than repeating the steps.

## References

Verified as resolving on 2026-08-18.

- Agent skills in Claude Code:
  https://docs.claude.com/en/docs/claude-code/skills
- Anthropic's engineering note on what skills are for:
  https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Published skill examples, worth reading for their descriptions rather than
  their bodies: https://github.com/anthropics/skills
- Customising GitHub Copilot with instruction files, for how a second harness
  loads the same kind of content:
  https://code.visualstudio.com/docs/copilot/customization/custom-instructions

Formats move faster than the discipline. If one of these 404s the page was
renamed, and saying you could not verify it beats guessing a replacement URL.
