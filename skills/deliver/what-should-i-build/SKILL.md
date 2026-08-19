---
name: what-should-i-build
description: Work out whether the thing in front of you needs an agent at all, and if it does, whether you should consume one, govern the ones you already have, or build a new one. Use when someone has asked for "an agent" and you are not convinced they need one, when the honest answer might be a Power Automate flow or a better search box, when Scout, Copilot Studio and Azure-hosted agents are all being proposed for the same problem, when nobody in the room can say which Copilot they mean, or when the real problem is that twenty agents already exist and nobody knows what they do.
verified_on: 2026-08-18
provenance: "Requests for an agent that turned out to need governance of existing agents, or nothing built at all."
---

"Which agent should we build?" is the wrong question, and it is wrong in a
way that is expensive to discover later. The question already contains a
guess: that an agent is the answer, and that you are the one who builds it.
Both halves of that guess are wrong often enough that answering as asked is
the single most common way this conversation fails.

There are four honest answers, and only one of them is "build something".

- **Nothing.** The requirement is deterministic, and an agent would add cost
  and non-determinism to a problem that has neither.
- **Consume.** Someone has already built this. You are the user, not the
  builder.
- **Govern.** The agents exist. The problem is that nobody can see them.
- **Build.** Genuinely new behaviour that nothing on the shelf covers.

Your job is to find out which one, before anybody opens a designer. Say the
answer out loud as a diagnosis in a single sentence before acting on it. If
it is wrong, the user corrects you in ten seconds, which is cheaper than
correcting a build in ten weeks.

## Ask these, in this order

The order carries more of the value than the questions do. Each one is
placed where it eliminates the most work for the least effort, so a cheap
question that kills a project belongs before an expensive one that refines
it. Ask a round, then stop and wait. Do not answer on the user's behalf.

**Round 1 - does this repeat, or did it happen once?**
First, because it is free and it ends more conversations than anything else.
A great deal of requested automation is a description of one bad week. If it
happened once, the answer is usually a person doing it once more, and a note
in the calendar. Ask how many times it has happened in the last quarter and
listen for a number rather than an adjective. "Constantly" is not a number.

**Round 2 - who is the user: you, or somebody else?**
This splits consume from build faster than any capability question. If the
person describing the problem is also the only person with the problem, you
are almost certainly looking for something to use, not something to ship.
One person's recurring work is a product someone already sells. A hundred
people's recurring work might be a build.

**Round 3 - can you write down every output before it runs?**
This is the determinism test, and it decides whether an agent is warranted
at all. If the outputs are fully predictable from the inputs, you want a
flow, not a model. Push for a concrete example rather than a principle: make
them describe one real case end to end, and see whether anything in it
required a judgement call. If nothing did, you have your answer and it is
not an agent.

**Round 4 - what happens when it is wrong, and does anybody approve it?**
Drafting text a human reads before sending is a different system from
posting a journal entry. Ask who sees the output before it takes effect. If
the answer is "nobody", the bar for everything downstream just rose sharply,
and evaluation and tracing stop being nice-to-have. If the answer is "a
human approves every action", you may be describing an approval workflow
that has an agent bolted onto the front of it for no reason.

**Round 5 - does it need to remember?**
Memory across sessions is the cleanest line between the lightweight options
and the real ones. Something that answers a question from existing content
and then forgets you is a different build from something that tracks state
over weeks. Ask what it needs to know on Tuesday that it learned on Monday.

**Round 6 - who is accountable when it acts?**
Last, because people find it uncomfortable and it works best once the rest
is concrete. Every agent acts as some identity, reaches whatever that
identity can reach, and leaves someone holding the consequences. If nobody
can name that person, you have found the actual blocker, and it is not a
technical one.

## When the answer is nothing

Treat this as a real outcome and deliver it with the same confidence as a
recommendation to build. It is the most valuable thing this conversation
produces, and the hardest to say, because nobody has ever been thanked in a
steering committee for recommending less.

The test is Round 3. If every output is knowable in advance, name the
deterministic thing instead:

- A scheduled notification when a record changes is a Power Automate flow or
  a Logic App.
- A recurring report over structured data is a Power BI report on a refresh
  schedule.
- Collecting structured input is a form and a table, not a conversation. A
  chat interface is a worse way to gather eight known fields.
- Moving data between systems on a schedule is a pipeline.
- Finding a document nobody can find is a search problem. A Graph connector
  that brings the content into scope, or fixing the search configuration
  that was never tuned, beats an agent wrapped around a bad index.
- A published answer to a question asked repeatedly is a page. Write the
  page.

Say plainly that these cost less to run, cannot hallucinate, and can be
tested exhaustively. Then say the cost of the alternative out loud: an agent
introduces per-message consumption, an output that has to be evaluated
rather than asserted, and a maintenance owner who does not exist yet.

Watch for the reflex where the answer is "an agent" because an agent is
fundable and a flow is not. When you spot it, name it. The honest framing is
that the deterministic answer ships this month.

## When the answer is consume

Some of what people ask to build already exists as a product, and the
correct response is a licence and thirty minutes of onboarding rather than a
project.

**Microsoft Scout** is a desktop application for Windows and macOS that acts
on someone's behalf: it reads and writes files, runs shell commands, drives a
browser, reaches their Microsoft 365 data, and can work in the background on
schedules and triggers rather than only when prompted. If the request is "I
want my own recurring work handled without me thinking about it", the person
in front of you is an end user, and building them a bespoke agent means
reproducing a product.

Check availability before you route anyone here. Scout is a Frontier preview:
the documentation is prerelease, access requires joining the Frontier program
and accepting its terms, and preview features may never reach general
availability. That makes it a real answer for "stop building this yourself"
and a bad answer for "and it will be in production next quarter". See
https://learn.microsoft.com/en-us/microsoft-scout/overview.

**Microsoft 365 Copilot Cowork** carries out tasks across someone's Microsoft
365 environment - sending mail, scheduling meetings, drafting documents,
posting in Teams, managing a calendar - with the user approving each action
before it happens. If the ask is "I want it to actually send the follow-up,
not tell me to", that is a licence, not a project. See
https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/.

The tell for this whole branch is that the requirement is phrased in the
first person. "I want" is a consume signal. "Our customers need" is not.

## When the answer is govern

There is a version of this conversation where the organisation does not need
another agent and is in fact suffering from the ones it has. The symptoms
are recognisable: nobody can produce a list of what exists, two teams have
built the same thing, an agent is still running for someone who left, or
somebody asks what these things can actually reach and the room goes quiet.

**Microsoft Agent 365** is the surface for this. It exists to observe,
govern and secure the agents already running in an organisation - a central
agent registry, lifecycle management, access control and compliance, worked
through the Microsoft 365 admin centre, Entra and Purview. See
https://learn.microsoft.com/en-us/microsoft-agent-365/overview.

When you recognise these symptoms, stop the build conversation and say so.
Building agent twenty-one into an estate nobody can inventory makes the
actual problem worse, and it does it with your name on it. The useful
deliverable from that meeting is an inventory and an owner, not a design.

## When the answer is build

Once the rounds have ruled out nothing, consume and govern, you have a
build - and this skill stops here, deliberately.

Do not compare platforms here. `choose-agent-platform` owns that decision,
holds the canonical list of options, and asks a different set of questions to
reach it. It is user-invoked, so it will not start by itself: tell the user to
run it by name, and hand over what the rounds already established so they are
not interrogated twice.

Naming a shortlist in this skill as well is how two answers drift apart. There
would then be two lists maintained in two places, and the one you are reading
is the one nobody remembers to update when a product is renamed.

## Licensing gates this, and this skill will not answer it

Every branch above has a licensing and availability condition attached, and
those conditions are the fastest-moving thing in this ecosystem. Which tier
a surface requires, whether it is available in a tenant at all, and what it
consumes per message have each changed inside a single quarter more than
once.

So this skill deliberately does not name SKUs, tiers or prices. A confident
number here is worse than a gap, because the reader repeats it to a customer
without checking, and it turns out to be wrong in a meeting rather than in a
document.

Make licensing an explicit gate instead, before any recommendation hardens.
Ask whether the intended users are licensed for the surface you are pointing
at, who pays if they are not, and whether anybody has confirmed that in the
tenant rather than inferring it from a blog post. If nobody has, record it
as an open question with a named owner, and check the current Microsoft
licensing documentation rather than repeating what this skill or anybody
else told you. Treat availability the same way, particularly for newer
surfaces, where "we saw it in a keynote" and "it is in this tenant" are
frequently different facts.

## The wrong choices people actually make

Each of these has a cause, and the cause is more useful than the error,
because you can hear the cause in the room before the error is committed.

**An agent where a flow belonged.** Caused by visibility. Agents demo well,
have budget attached, and carry the word leadership is asking about; a flow
does not. Symptom: the requirement contains the words "when this happens, do
that", with no judgement anywhere in it.

**Building what they should have consumed.** Caused by the builder's reflex.
Somebody describes a personal productivity problem to a team whose job is to
build, and gets a project instead of a licence. Symptom: the requester is
also the only user.

**Building when they should have governed.** Caused by the new thing being
more interesting than the estate. Symptom: nobody can answer "how many
agents do you have now?" and the conversation moves on anyway.

**A declarative agent for something that must act.** Caused by both options
being no-code and looking identical in a demo. The line is knowing versus
doing: answering from content already in scope is one thing, writing to a
system or calling an external API is another. Symptom: "and then it updates
the record", said quietly, at the end of a sentence about answering
questions.

**Pro-code because the engineer wanted to write code.** Caused by
professional preference dressed as a requirement, usually justified by
flexibility nobody asked for. Symptom: the design has tickets for tracing,
evaluation and deployment pipelines that a managed platform would have
supplied. Ask who maintains it in a year, and watch how slowly the answer
arrives.

**"Everything is a Copilot."** Caused by branding, and it is not the user's
fault. Several genuinely different products share the word, and two people
can hold an entire meeting using it to mean different things. Make everybody
name the specific product. A surprising share of the disagreement in this
conversation dissolves at that point, because it was never a disagreement.

## Deliver it like this

**The answer** - nothing, consume, govern or build. One word, then one
sentence.

**Because** - the two or three answers from the rounds that actually drove
it, quoted back to them. Not generic properties of the options.

**What we are not doing** - the option they arrived expecting, and the
specific answer that ruled it out. This is the part that survives the
meeting and stops the decision being relitigated by somebody who was absent.

**Open questions** - anything unresolved, each with a named owner. Licensing
and availability belong here unless somebody has actually checked the tenant.

**Revisit if** - the condition that changes the answer. "If this has to
serve customers rather than the four of you, this becomes a different
decision."

## Do not

- Do not produce a comparison table of the surfaces. Microsoft maintains
  those, they are more current than anything written here, and they do not
  answer this question.
- Do not treat "you do not need an agent" as a failure to reach a
  recommendation. It is a recommendation, and usually the most valuable one.
- Do not quote licence tiers, prices, consumption rates or availability from
  memory, and do not repeat them from a blog post.
- Do not run the platform comparison here. Establish that it is a build, then
  hand the decision over.
- Do not accept "an agent" as a requirement. Make them describe one real
  case, end to end, including what happens when it is wrong.

## Verified references

Each returned HTTP 200 on 2026-08-18. Scout's and Cowork's pages were also
read, not just pinged, on 2026-08-18: what each product actually does, and
Scout's Frontier preview gating, are described from those pages. Both are
moving surfaces. Re-read them before you rely on the consume branch.

- Microsoft Scout: https://learn.microsoft.com/en-us/microsoft-scout/overview
- Microsoft 365 Copilot Cowork:
  https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/
- Microsoft Agent 365:
  https://learn.microsoft.com/en-us/microsoft-agent-365/overview
- Copilot Studio:
  https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio
- Declarative agents for Microsoft 365 Copilot:
  https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-declarative-agent
- Microsoft Foundry Agents:
  https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview

If one of these 404s, the product was probably renamed rather than
withdrawn. Say you could not verify it instead of guessing the new URL.
