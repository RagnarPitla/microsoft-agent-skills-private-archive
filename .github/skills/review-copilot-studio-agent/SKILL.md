---
name: review-copilot-studio-agent
description: "Review a Copilot Studio agent's YAML for defects that matter before it ships. Use when agent.mcs.yml or topic YAML files are open or in a diff, when reviewing a pull request that changes an agent, or when someone asks whether an agent is ready to promote."
---

<!-- Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`. -->
<!-- Source: skills/review/review-copilot-studio-agent/SKILL.md -->
Review a Copilot Studio agent the way a senior reviewer would: find the things
that will hurt in production, ignore the things that will not, and be explicit
about what you did not check.

A review that reports style opinions alongside real defects gets skimmed and
then ignored. Everything below is here because it causes a production failure,
a security exposure or a support ticket.

## Get the artefact

The files are produced by the Power Platform CLI `copilot` command group -
`pac copilot clone` pulls an existing agent down into a local workspace, and
`pull`, `push` and `pack` drive the rest of the loop. If the files are already
in the workspace or the diff, just use them.

Do not guess at command flags. Check the CLI reference linked at the bottom;
the syntax has changed and will change again.

**Read the actual files before applying any rule below.** Field names in the
agent YAML vary by platform version, and this skill deliberately describes
*what to check* rather than asserting exact keys. If you cannot find a setting,
say you could not find it - do not report a default you assumed.

## Pin the scope first

Say which files you reviewed and which you did not. A review of three topic
files in a twelve-topic agent is useful only if it says so.

If reviewing a diff, review the changed files, but read enough of the
surrounding agent to judge them. A topic that looks fine alone can be broken by
what it assumes about a variable set elsewhere.

## Blockers

Do not sign off with any of these outstanding.

**Authentication does not match the channel.** Check how the agent
authenticates and where it is published. An agent with no authentication on an
internal or Teams channel is reachable by anyone who can find it; an agent
requiring sign-in on an anonymous public channel silently blocks every user.
This is the most common serious mis-ship, and it is invisible in testing
because the builder is always signed in.

**No escalation path.** At least one route to a human or a ticket. An agent
that cannot hand off strands users at exactly the moment it is failing, and
those users do not come back.

**Fallback answers freely in a restricted domain.** If the agent covers HR,
finance, legal, health or anything regulated, check what happens when it does
not know. Falling through to general model knowledge means the scope guarantee
is fictional, and it will be discovered by the wrong person.

**Secrets or personal data in the YAML.** Connection strings, keys, passwords,
email addresses, or sample records containing real people. These files sit in
source control where everyone with repo access can read them, and history keeps
them after deletion.

## Major

Fix before production, but they need not block a merge.

**Cross-topic variables scoped to a topic.** A variable that must survive a
topic transition has to be scoped to the conversation, not the topic.
Topic-scoped variables reset silently, so the symptom is data vanishing
mid-conversation and no error anywhere.

**Knowledge sources pointed at something enormous.** A whole site, drive or
tenant-wide index. Broad sources retrieve worse, not better, and they can
surface documents the asker should not see. If grounding quality is the actual
complaint, that is a bigger conversation than this review - see the grounding
skill.

**General knowledge not deliberately set.** Whether the agent may answer from
outside its sources should be an explicit decision, not an inherited default.
Report it as a finding when you cannot tell which it is.

**Actions carrying inline credentials.** External calls should go through a
named connection reference. Inline credentials break on every environment
promotion and are a security problem in their own right.

**Overlapping or threadbare trigger phrases.** Two topics competing for the
same phrasing makes routing non-deterministic - the classic "it answered the
wrong thing, but only sometimes". A topic with one or two triggers misses the
ways real people phrase it.

**Topics with dead ends.** Every branch should end the conversation, hand off,
redirect, or ask something. A branch that just stops leaves the user staring at
nothing.

## Minor

Worth saying once. Do not lead with these.

**Orchestration mode left implicit.** Defaults here have changed between
platform versions, which means an agent can change routing behaviour without
anyone editing it.

**Generated or opaque topic names.** GUIDs and auto-generated names make the
agent unreviewable and unmaintainable by whoever inherits it.

## Deliberately not flagged

State this list in the review. It is what makes the rest credible.

- **Whether answers are correct.** That needs domain knowledge and a test set,
  not a YAML read.
- **Conversation tone, message length, personality.** Not defects.
- **Number of topics.** More is not worse.
- **Cost or message consumption.** Not visible here, and the rates change.
- **Anything requiring the live environment** - actual permissions, real
  connector behaviour, whether a knowledge source is populated. Say these were
  out of scope rather than implying they passed.

## Report it like this

Order by severity, not by file. A reviewer reading top-down should hit the
worst thing first.

For each finding: **what**, **where** (file and, where you can, the specific
element), **why it matters in production**, and **what to do**. Skip any of
those four and the finding gets argued about instead of fixed.

Then, explicitly:

- what you reviewed and what you skipped
- what could not be checked from the files alone
- a plain go / no-go, with the blocker count

If there are no blockers, say so directly. A review that cannot say "this is
fine" is not a review, it is a ritual.

## Do not

- Report a setting as wrong when you could not find it. Report that you could
  not find it.
- Assert YAML field names from memory. Read them from the file in front of you.
- Restate the same finding once per file. Group it, and say how many files.
- Pad with style observations to make the review look thorough. Thoroughness is
  the blocker list being right.

## Sources

Verified as resolving on 2026-08-18.

- Power Platform CLI `copilot` command group, for current clone and pull
  syntax:
  https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/copilot
- Copilot Studio end-user authentication:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-end-user-authentication
- Knowledge sources:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-copilot-studio
- Generative mode and orchestration:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/nlu-gpt-overview
