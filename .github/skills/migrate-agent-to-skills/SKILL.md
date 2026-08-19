---
name: migrate-agent-to-skills
description: "Move an existing agent - a prompt-stuffed assistant, a legacy chatbot, a pile of custom instructions, a hand-rolled Python agent - onto a portable skills-based harness without carrying its rot forward. Use when a system prompt has grown past what anyone can review, when someone wants to break a monolithic agent into skills, when moving off Power Virtual Agents or a bespoke framework, when the same behaviour has to run in GitHub Copilot, Claude Code, Cursor and Codex, or when a migration has produced skill files that nothing ever reaches for."
---

<!-- Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`. -->
<!-- Source: skills/build/migrate-agent-to-skills/SKILL.md -->
The migration everyone tries first is to paste the system prompt into a
`SKILL.md`, split it at the headings, and ship. It takes an afternoon and it
produces the worst possible outcome: the same behaviour, the same
contradictions, the same six-year-old defensive paragraphs, now spread across
twelve files where nobody can see them at once - plus one new failure, which is
that none of the files ever fire.

Treat the migration as an opportunity to delete. Most of the value is in what
you leave behind. A monolithic prompt is an accretion: rules added by different
people over years, half of them for situations that no longer occur, several of
them contradicting each other, and a few written in anger the day after a bad
demo. Move it verbatim and you have paid the cost of a migration for none of
the benefit.

## Freeze the behaviour before you touch anything

Do this first, before the inventory, before any file is written. Once you start
editing you lose the ability to tell a fix from a regression.

Capture real prior conversations. Not invented examples - the actual traffic:
transcripts, support tickets, chat logs, the analytics the old platform kept.
Aim for a set that covers the handful of things people actually ask most often,
plus the awkward ones: the questions the agent refuses, the ones it escalates,
the ones it historically got wrong.

For each captured case write down the outcome that matters, not the wording. "It
asked for the order number before answering" is a testable outcome. "It replied
helpfully" is not.

Include the cases the old agent handled badly, and mark them. The new agent is
allowed to be better - but that has to be a decision you made and recorded,
otherwise an improvement and a regression look identical when you compare
outputs later.

If nobody can produce a single real transcript, stop and ask why. An agent with
no observable traffic is usually an agent nobody uses, and the honest
recommendation may be to retire it rather than port it.

## Inventory the prompt, line by line

Read the existing instructions with a pen. Every rule gets one of four labels:

- **Live** - it still applies, and you can name a recent case where it mattered.
- **Dead** - it is about a system, a process or a product name that no longer
  exists. Prompts are full of this and it is invisible until you look.
- **Contradictory** - it cannot be followed alongside another rule. Almost every
  monolith has at least one such pair. The model has been quietly picking a
  winner for months, and nobody chose which.
- **Defensive** - added after one incident, usually over-broad, often written in
  capitals. "NEVER discuss pricing under any circumstances" started as one
  awkward conversation and now blocks a legitimate question daily.

For anything you cannot label, ask the owner: what happened that made you write
this? If nobody remembers the incident, that is evidence, not a gap. Rules whose
purpose has been forgotten are rules nobody is defending.

Resolve contradictions with a human, not with the model. The point of the
migration is that a person finally decides which rule wins. Carrying both
forward into separate skill files makes it worse, because now the conflict only
surfaces when both files happen to load.

Expect to delete a lot. If the inventory does not shrink the instruction set
noticeably, either the original was unusually well maintained, or the inventory
was not honest.

## Untangle the three things in a system prompt

Every large prompt is three kinds of content wearing one coat. They have
different owners, different update cadences and different homes. Separating them
is the highest-value step in the migration.

**Identity and voice.** Who the agent is, how it addresses people, what it is
called, the tone. This belongs in the harness configuration - one place, loaded
for every conversation. It does not belong in each skill. Copy the persona into
twelve skills and you get twelve copies that drift, and a personality that
changes depending on which file happened to load.

**Domain knowledge.** Policy text, product facts, refund thresholds, the list of
regions, the escalation matrix. This is content, not behaviour, and it should
become a knowledge source or a retrieval step so the people who own the content
can update it without a code change. Knowledge pasted into a prompt goes stale
on someone else's schedule and nobody notices until an answer is wrong. The
exception is the small, stable, load-bearing fact - three lines that change once
a year - which is cheaper inline than in a retrieval pipeline.

**Task procedures.** How to handle a refund request. How to triage an incident.
How to review a change. What to check, in what order, and what to do when a
check fails.

**Only the third one is usually a skill.** If the split leaves you with two
skills instead of twelve, that is a good result, not a failed migration.

## One skill, one job

Split on the occasion that summons the skill, not on the subject matter. A
monolith about order management is not three skills because it has three
headings about orders. It is as many skills as there are distinct moments where
a person shows up needing something different.

The test for whether a split is real, and it is a good one because your frozen
transcripts can answer it: **can you point at a captured conversation that
should load skill A and not skill B?** If every real conversation loads both,
you did not split a skill - you cut one in half, and now half of it will
sometimes arrive without the other. Put it back.

Two more tells from the same evidence. If a skill's captured cases have nothing
in common except the product they mention, it is a filing cabinet, not a skill.
If you cannot write one sentence describing what "it worked" looks like without
writing two, it is two skills.

For the craft of writing each one - the description, the invocation choice, what
belongs in the body - invoke the `write-a-skill` skill. Do not re-derive it
here.

## Extracted skills inherit descriptions that never fire

This is the signature failure of a migration, and it deserves separate billing
because the migration itself causes it rather than careless writing.

When you split a document, the section headings come with you. "Escalation
Policy" becomes a skill named `escalation-policy` described as "Covers the
escalation policy" - and then nothing ever loads it, because no human in trouble
types "escalation policy". They type "the customer is threatening to cancel and
I do not know who to tell".

The old headings were navigation labels for a human reading top to bottom. In a
skills harness the description is the only thing the agent sees when deciding
whether to load the file, so it has to be a trigger written in the words of the
person with the problem. Your frozen transcripts are the raw material: the
opening line of each captured conversation is, almost literally, a trigger
phrase. Use them.

Rewrite every description from the transcripts, not from the section it came
from. A migrated skill that never fires is worse than the monolith it replaced,
because at least the monolith was always loaded.

## What not to migrate at all

Be blunt about this. Some of the prompt should not become a skill in any form.

**Deterministic branching.** "If the order is over 5,000, route to the regional
manager. If the customer is in the EU, apply the extended returns window."
Written as an instruction this is probabilistic - it holds most of the time and
fails on exactly the boundary cases the rule was written for, silently, with no
log. It belongs in a flow, a topic with real conditions, or code. Anything you
could express as an `if` statement should be an `if` statement.

**Safety-critical rules.** A politely worded sentence in a Markdown file is a
suggestion under load. If the consequence of ignoring it is regulatory, legal or
financial, it needs a hard constraint: a tool that refuses, a schema that
rejects the output, a human approval step, a guard that runs outside the model.
Migrating "must never" text from a prompt into a skill file changes nothing
about the risk while making everyone feel it was addressed. Say that out loud
when you see it.

**Model workarounds.** "Think step by step." "Do not invent JSON fields."
"Remember the current year." Most of this was written against a model two
generations old and is now noise competing for attention with instructions that
matter. Drop it, and re-add only what a failed test proves you need.

**Formatting boilerplate** the harness already handles, and **dead rules** from
the inventory. Neither earns its context.

**Anything about a system being decommissioned.** Migrating instructions for a
platform that is going away in a quarter is work with a known expiry date.

## Portability, and what quietly destroys it

The reason to move to skills is that behaviour becomes versioned, reviewable
files rather than a text box in one vendor's portal. That only holds if the
files are not welded to a single harness.

Look at how a skill is compiled in this repository, because it makes the
constraint concrete. One `SKILL.md` renders into: a Copilot prompt file and chat
mode for user-invoked skills, a Copilot instructions file applied to everything
for model-invoked ones, a Cursor rule for every skill, an aggregate Codex
manifest, and a harness-neutral `index.json` for tools nobody has written yet.
The same body has to work in all of them.

That has a consequence people miss at migration time: **a model-invoked skill is
emitted as an always-applied instruction in some harnesses.** Migrate your
monolith into one big model-invoked skill and you have not decomposed anything.
You have rebuilt the system prompt with extra steps, loaded into every
conversation exactly as before.

What keeps a skill portable:

- Refer to capabilities generically. "Search the repository", "run the tests",
  "read the file" - not one tool's name for those things.
- Keep front matter to the fields every harness agrees on: a name, a
  description, and the invocation flag.
- No harness-specific paths, slash commands, settings or model names in the
  body.
- Assume a model-invoked skill is entered cold, mid-conversation, with none of
  the earlier context the old monolith could rely on. Legacy prompts lean hard
  on "as established above". There is no above.

What pins a skill to one harness: named tools, hardcoded file layouts, front
matter fields only one vendor reads, and instructions that assume a specific UI.
Every one of those is a rewrite the next time a harness moves, and harness
formats move far more often than the discipline you are writing down.

## A staged order, so this is not a big bang

Cutting over everything in one weekend is how migrations get rolled back.

1. **Freeze.** Capture the transcripts, snapshot the current agent, and stop
   changing it. A moving target cannot be verified against.
2. **Inventory and delete.** Produce the labelled list. Remove the dead rules
   and get a human decision on every contradiction. Nothing has been written yet
   and this is already most of the value.
3. **Split by layer.** Identity to harness configuration, knowledge to a
   knowledge source or retrieval step, procedures set aside. Verify against the
   frozen set now: identity and knowledge alone should already handle the simple
   informational cases.
4. **Migrate the highest-traffic procedure first, alone.** One skill. Run the
   captured cases for that procedure only. Run both agents in parallel and
   compare - shadow the old one rather than replacing it.
5. **Repeat in traffic order.** One procedure at a time, re-running the frozen
   set after each, because a regression is only attributable while the change
   that caused it is small.
6. **Stop when the remainder is below the value line.** The long tail of a
   monolith is often rules that fire twice a year. Leaving them behind, or
   leaving them as a documented human process, is a legitimate outcome and more
   honest than migrating them badly to claim completeness.
7. **Cut over and delete the old prompt.** This step is not optional. If the
   monolith survives alongside the skills it is still loaded, it still wins on
   conflicts, and every future change goes to the file people already know.

## Done is behaviour preserved, not files created

The most common false finish is a pull request full of tidy `SKILL.md` files and
a claim of success. Files existing is not evidence of anything.

Run the frozen set against the new agent and compare outcomes to the recorded
ones. Score on outcome, not phrasing - different words reaching the same result
is a pass, and demanding identical text turns the exercise into a diff review
that nobody finishes.

Watch specifically for these, because they are what migrations break:

- **Refusals.** New agents are usually more willing than old ones. If the old
  agent declined to quote prices and the new one obliges, the defensive rule you
  deleted was live after all.
- **The order of questions.** Procedures encode sequence for a reason - "check
  the account is in good standing before offering the refund". Sequence is the
  first thing lost when a procedure is turned into prose.
- **Skills that never load.** If a captured conversation should have pulled a
  skill in and did not, the description is the bug, not the body. Fix it and
  re-run.
- **Skills that load for everything.** That is the migrated monolith
  reassembling itself. Narrow the description, or re-split.

Then keep the frozen set. It was expensive to gather and it is now the
regression suite for every future change.

## Do not

- Do not migrate an agent nobody uses. Check the traffic first. Retirement is
  cheaper than portability, and someone has to say so.
- Do not let the model do the inventory unsupervised. It will faithfully
  reproduce contradictions it has no way to adjudicate, because resolving them
  needs business context only the owner has.
- Do not preserve the old file structure out of respect. Section boundaries in a
  prompt were written for a human reading top to bottom, and they are almost
  never the right skill boundaries.
- Do not run the old and new agents in production at once without deciding which
  is authoritative. Two live sources of behaviour is worse than either alone.
- Do not claim the migration is done before the frozen set has been re-run.
  Files are not behaviour.

## References

Verified as resolving on 2026-08-18.

- Agent skills in Claude Code, for the source format:
  https://docs.claude.com/en/docs/claude-code/skills
- Anthropic's engineering note on what skills are for:
  https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Custom instructions in VS Code, for how a second harness loads the same
  content:
  https://code.visualstudio.com/docs/copilot/customization/custom-instructions
- GitHub Copilot CLI:
  https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-copilot-cli
- Cursor rules: https://docs.cursor.com/context/rules
- AGENTS.md, the cross-harness convention worth targeting for identity and
  project context: https://agents.md/
- Copilot Studio analytics, for pulling real prior conversations out of a
  Power Virtual Agents era bot before migrating it:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-overview

Harness formats change faster than any of this. If a link 404s the page was
renamed, and saying you could not verify it beats guessing a replacement URL.
