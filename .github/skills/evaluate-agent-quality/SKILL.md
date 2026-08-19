---
name: evaluate-agent-quality
description: "Establish whether an agent actually works, and whether it still works, using a recorded eval set rather than ad hoc chats. Use when an agent is about to ship and the only testing was somebody typing a few questions into the test pane, when an agent that used to answer correctly now does not and nobody can say when it broke, when a knowledge source or model version changed and you need to know what it affected, when a stakeholder asks how accurate it is and there is no number to give them, when you cannot decide what \"correct\" even means for a generative answer, or when the agent works for the builder and fails for a user with different permissions. For a one-off read of a single agent's configuration, review-copilot-studio-agent is the better fit; this one is about measurement over time."
---

<!-- Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`. -->
<!-- Source: skills/review/evaluate-agent-quality/SKILL.md -->
Most agents ship on the strength of a demo. One person, usually the person who
built it, types five questions into the test pane, gets five reasonable
answers, and calls it tested. Nothing about that is written down, so it cannot
be repeated, cannot be handed to anybody else, and cannot detect that the
agent got worse. It is a demo. Demos are useful and they are not tests.

The gap this creates is specific and it always shows up the same way. Someone
edits a topic, or a knowledge source gets re-indexed, or the underlying model
version rolls forward, and the first person to notice is a user complaining
weeks later about an answer nobody can reproduce. There is no baseline to
compare against, because nobody ever recorded what good looked like.

An eval set is just written-down expectations. That is the whole idea, and the
tooling is the easy part. The expensive part is deciding what "correct" means
for a system that produces different words every time, and that decision is
not the builder's to make.

## Correctness is a business decision, so go and get it

Do not start by opening a testing tool. Start by getting somebody who owns the
outcome to look at ten real answers and say which ones they would be happy to
have sent to a customer, an auditor or an employee. You are not asking them to
write test cases. You are asking them to draw the line, because they are the
only ones who can.

You will usually find the line is in a different place than you assumed. A
support agent that says "I do not have information on that, here is how to
reach the team" is a pass, and builders routinely record it as a failure
because it did not answer. Meanwhile a fluent, confident, subtly wrong answer
reads as a pass to everyone in the room, and it is the single most expensive
output the agent can produce.

Write the line down in a sentence before writing any test cases. If the
business owner will not engage, that is the finding. Say so, and stop. An eval
set built entirely on the builder's taste measures whether the agent agrees
with the builder.

## What you can actually assert

You cannot assert an exact string against a generative answer. Any suite built
on string equality either fails constantly on correct output or gets weakened
until it asserts nothing. So assert the properties that have to hold no matter
how the sentence comes out. These five carry almost all the value.

**Groundedness.** Did the answer come from the source it cited, or did the
model fill a gap? This is the assertion that catches the dangerous failure,
because ungrounded answers are the fluent ones. Both platforms judge this for
you: Copilot Studio's general quality method scores groundedness against the
context the agent actually retrieved, and Microsoft Foundry ships groundedness
evaluators, including one that returns a plain pass or fail without you
standing up a judge model.

**Refusal when out of scope.** Ask the questions the agent must not answer and
assert that it declines. This is the only way to test a scope boundary,
because scope is defined by what is excluded and nothing in the happy path
exercises it. Copilot Studio's general quality method scores abstention as one
of its criteria, so a deliberate refusal is measurable rather than a
judgement call you make by reading transcripts.

**Routing.** Did the right topic, tool or knowledge source fire? Assert this
separately from the answer, because routing failures and content failures need
completely different fixes, and an aggregate score hides which one you have.
Copilot Studio has a tool use method that passes only when the expected
topics or tools were used; Foundry has a family of tool call evaluators that
go further into parameter correctness and whether the output was actually
used. Routing assertions are also the ones that survive a rewrite of the
agent's instructions, which makes them the most durable part of a suite.

**Latency.** An agent that is correct in forty seconds is wrong in the ways
that matter to users. Record the response time for each case and watch the
distribution move, rather than fixing a threshold you invented. Copilot
Studio measures end-to-end response time per interaction during an evaluation
and deliberately does not pass or fail on it, which is the right default:
treat it as a trend line, and set a budget only once you know what normal is
for your agent.

**No leakage across identities.** Covered below, because it is the one people
skip.

A sixth is worth adding as soon as the agent generates anything a person
signs: exact or near-exact wording, where the wording is legally load-bearing.
Reach for exact match, keyword match or text similarity only there. Using them
as your default is how suites become noise.

## Identity is part of the assertion, not a test environment detail

The same question must return different answers to different people. That is
usually the point of the agent. A test set run entirely as the builder, who is
an administrator with every connection already consented, proves that the
agent works for the one person it was always going to work for.

There are two distinct failures hiding here and they need separate cases.
Under-permissioned users get a broken agent: empty retrieval, an action that
cannot call the downstream system, or a silent nothing. Over-permissioned
retrieval is worse: the agent surfaces a document to somebody who should never
have seen it, and there is no error, no ticket, and no way to find out except
by testing for it.

So run the same set as at least two identities, and pick them for contrast:
somebody with broad access and somebody with almost none. For the restricted
identity, the expected result for some cases is "declines or returns nothing",
and you assert that positively rather than treating an empty answer as a
failed run.

Copilot Studio supports this directly. A test set can carry a user profile,
and the evaluation uses that account to reach knowledge sources and tools, so
the run reflects what that user can see. Running without a profile is allowed
and it is a different, weaker test. Note that the profile's connections have
to be working or the run will not proceed, and that some sovereign clouds
restrict this, so check what your environment supports before you design a
suite around it.

If the permission model itself is the thing in doubt, this skill is not
enough. `copilot-studio-auth-patterns` is where that gets diagnosed; here you
are only proving that the model behaves as designed.

## Build the first set before you have any tooling

Do not wait for a platform, a licence or a pipeline. The minimum viable
version is a spreadsheet with six columns: question, identity, expected
behaviour, actual answer, pass or fail, and the date you ran it. Thirty rows.
That artefact, run twice on two different dates, is worth more than an
elaborate framework that never gets populated, because it is the second run
that generates all the value.

Fill it from four places, in this order. Every question a real user has
already asked, if the agent is live and you have transcripts. Every question
the business owner was worried about in the requirements conversation. Every
question that must be refused. And every question that lives on a boundary
between two topics, because that is where routing breaks.

Resist the urge to have a model generate the whole set. Generated questions
cluster around what the documentation says the agent does, which is exactly
the region that already works. Use generation to get to volume once you have
written the hard cases yourself. Both platforms will help you here: Copilot
Studio can generate a starter set from the agent's own description, knowledge
and topics, seed a set from a test chat you just had, import from a
spreadsheet, or build one from themes in production analytics, and Foundry can
turn real production traces into a curated evaluation dataset. The
production-derived sets are the good ones. They contain the phrasings you
would never have thought of.

When you move the spreadsheet into a tool, keep the spreadsheet. Test sets
have caps, results have retention windows, and both change; the questions and
the agreed expectations are the asset, and they should live somewhere you
control. Export results before they age out if you want to compare across
quarters.

## Regression is the entire payoff

A first evaluation run tells you roughly what you already suspected. The
second run, after something changed, is what you built the suite for. Agents
regress from underneath in ways that never appear in a diff:

- A knowledge source gets new or reorganised content, and retrieval starts
  returning something else.
- A model version rolls forward, and phrasing, refusal behaviour and tool
  selection all shift slightly.
- Somebody edits one topic's trigger phrases and quietly steals traffic from
  another.
- A connection expires, or the account behind an action loses access.
- The agent is promoted to another environment where the data, permissions and
  connections are not the ones you tested against.

Only the third of those is visible in source control. This is why a review of
the YAML, which is genuinely worth doing, cannot substitute for a suite.

Re-run on those triggers rather than on a calendar, and re-run before every
promotion, because environments differ in exactly the ways that break agents.
Then compare against the previous run rather than reading the new one on its
own: Copilot Studio can compare two runs of the same test set directly, which
turns "it scored 82" into "these four cases used to pass". The second
statement is actionable and the first is not.

Automate it once it is boring. Copilot Studio exposes evaluation runs through
a Power Platform REST API and through connector actions you can drop into a
scheduled or triggered flow, and Foundry can run evaluations from a CI/CD
pipeline and can score production traffic continuously. Do this after the set
is stable. Automating a suite nobody trusts produces a red build everybody
learns to ignore, which is worse than no suite because it costs credibility as
well as time.

## Before go-live and after are different jobs

Before go-live you are proving the agent meets the bar the business set. The
suite is the evidence, the pass rate is the headline, and the failures are the
punch list. Insist on the refusal cases and the second identity here, because
after launch they stop being cheap.

After go-live the questions change. Now you want to know what real users are
asking that you never anticipated, which of your test cases turned out not to
matter, and whether quality is drifting. Copilot Studio's analytics carry
production questions, sessions, feedback and themes, and the loop that pays
off is feeding those themes back into the test set so the suite converges on
what people actually ask. Foundry closes the same loop through tracing, with
the added ability to sample production traces into a dataset and to evaluate
live traffic on an ongoing basis.

The failure mode after launch is not that the suite is wrong. It is that the
suite is frozen in the shape of the launch, and reality moved.

## What an evaluation does not tell you

Say this out loud when you report results, because a pass rate invites more
confidence than it earns.

A pass rate is only as meaningful as the set behind it, and the set is a
sample somebody chose. Ninety-five per cent on thirty questions you picked is
not ninety-five per cent accuracy in production. Report the pass rate with the
size and provenance of the set attached, or do not report it.

Correctness is not safety. Microsoft's own documentation is explicit that
agent evaluation measures correctness and performance and not AI ethics or
safety problems, and that an agent can pass every test and still produce an
inappropriate answer. Content filters, responsible AI review and, for
higher-risk agents, adversarial testing are separate obligations. Foundry
ships safety and risk evaluators and a red teaming capability precisely
because this is a different job from quality.

The judge is a model, so the judge is fallible. Every method described here
that scores meaning, quality or groundedness is a language model grading
another language model's output, and it has its own error rate. Deterministic
methods exist and are worth knowing for what they are: token and n-gram
overlap scores compared against a ground truth answer, plus exact and keyword
matching. Those are reproducible and narrow. The model-graded ones are broad
and approximate. Use the approximate ones for the bulk of the set, and read
the reasoning on failures rather than trusting the label, especially early on
while you are calibrating.

And an evaluation run is not the channel. Copilot Studio's own documentation
warns that the test panel is design-time validation that does not fully
replicate published channel behaviour, and that timer-based and
background-triggered events may not fire there. Anything that depends on a
schedule, an inactivity trigger or a specific channel's rendering needs to be
tested where it will actually run.

## Do not

- Do not report a pass rate without the size of the set and where the
  questions came from.
- Do not assert exact strings against generative answers outside the narrow
  case where exact wording is the requirement.
- Do not run the whole suite as one privileged identity and call the result
  representative.
- Do not let a model write your entire test set. It will write the questions
  that already work.
- Do not treat a refusal as a failure. Decide which questions must be refused,
  and assert it.
- Do not skip the second run. One run is a measurement; two runs are a test.
- Do not wire evaluations into a release gate before the set is stable enough
  that a failure means something.
- Do not present an evaluation pass as a safety or compliance sign-off. They
  are different reviews with different owners.

## Verified references

Every URL below returned HTTP 200 on 2026-08-18, and each was read rather than
only pinged. The specific capabilities described above - the Copilot Studio
test methods and their criteria, user profiles on test sets, response time
measurement, run comparison, the API and connector automation surface, and the
Foundry evaluator families and trace-to-dataset loop - are taken from these
pages.

Copilot Studio:

- About agent evaluation, including the explicit statement that evaluation
  does not cover safety:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-intro
- Choose evaluation methods, the source for general quality, compare meaning,
  tool use, keyword match, text similarity, exact match and custom:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-overview
- Create a single response test set, including how sets can be generated,
  imported or seeded from analytics themes:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-create
- Create a conversational test set:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-multi-turn
- Run evaluations and view results, the source for user profiles, response
  time and run comparison:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-results
- Automate evaluations with the Power Platform API:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-rest-api
- Trigger evaluations with connectors:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-automate-tools
- Test your agent, the source for the design-time limitation of the test
  panel:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-test-bot
- Analytics key concepts:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-overview

Microsoft Foundry:

- Built-in evaluators, the catalogue and the turn versus conversation
  evaluation levels:
  https://learn.microsoft.com/en-us/azure/foundry/concepts/built-in-evaluators
- RAG evaluators, including both groundedness variants:
  https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators
- Agent evaluators, including the tool call family:
  https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/agent-evaluators
- Risk and safety evaluators, which run on a hosted service rather than a
  judge model you deploy:
  https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/risk-safety-evaluators
- Textual similarity evaluators, the deterministic overlap scores:
  https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/textual-similarity-evaluators
- Convert agent traces into evaluation datasets:
  https://learn.microsoft.com/en-us/azure/foundry/observability/how-to/traces-to-dataset
- Monitor agents and set up continuous evaluation:
  https://learn.microsoft.com/en-us/azure/foundry/observability/how-to/how-to-monitor-agents-dashboard
- Run evaluations in GitHub Actions:
  https://learn.microsoft.com/en-us/azure/foundry/how-to/evaluation-github-action
- AI red teaming agent:
  https://learn.microsoft.com/en-us/azure/foundry/concepts/ai-red-teaming-agent

Power Platform:

- Power Platform CLI copilot command group, for the local workspace and
  packaging loop that moves an agent between environments:
  https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/copilot
- Power Platform pipelines, for where a re-run belongs in a promotion:
  https://learn.microsoft.com/en-us/power-platform/alm/pipelines
- Copilot Agent Kit, maintained by Microsoft's Power CAT team, which offers
  batch testing, an agent debugger and change tracking on top of Copilot
  Studio: https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit

Perishable, checked 2026-08-18. The Foundry evaluator catalogue marks several
evaluators as preview, and trace-to-dataset generation is preview. The Copilot
Studio evaluation documentation notes limitations in Government Community
Cloud environments, including no user profile on test sets. The Copilot Agent
Kit has been renamed from the Copilot Studio Kit and is a Microsoft-published
open source accelerator rather than a supported product, so verify its status
before depending on it. Test set size caps and result retention windows exist
in Copilot Studio and are the kind of number that changes; read the current
values rather than designing around one written here.

One thing these pages did not tell me, and it matters: they do not state
whether an evaluation run targets the saved-but-unpublished agent or the
published one. Confirm that in your own environment before you treat a green
run as a pre-publish gate, because the answer determines whether the suite is
testing the change you just made.
