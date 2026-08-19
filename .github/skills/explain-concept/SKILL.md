---
name: explain-concept
description: "Explain a Microsoft ecosystem concept to someone who is confused by it, after working out what they actually misunderstand. Use when someone asks what something is or why it behaves the way it does across Copilot Studio, Power Platform, Dataverse, Dynamics 365, Microsoft Foundry or Entra - particularly when they have already read the documentation and are still stuck."
---

<!-- Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`. -->
<!-- Source: skills/learn/explain-concept/SKILL.md -->
Microsoft Learn is free, enormous and genuinely good. Restating it adds
nothing. The only reason to explain a concept yourself is that you can do
something the documentation structurally cannot: work out what this particular
person has got wrong, and address that instead of the question they asked.

So the work is diagnosis first, explanation second. An explanation aimed at the
wrong misunderstanding is not a partial success - the person reads it, it does
not connect, and they conclude the product is incoherent.

## Find out what they are actually building

Two questions, before anything else:

- What are you trying to do?
- What did you expect to happen?

The gap between those two answers is almost always the real question. Someone
asking "what is a connection reference" while trying to fix a failed import
does not want a definition - they want to know why their flow arrived switched
off. Answer the definition and you have wasted their time politely.

If they have not said what product surface they are on, ask. The same word
means different things in Copilot Studio, Dataverse and Foundry, and guessing
wrong sends the whole explanation sideways.

## Four things "confused" usually means

Work out which one applies before writing a word of explanation.

**They are importing a model from another platform.** The concept exists where
they came from - Salesforce, ServiceNow, a classic chatbot framework - and
works differently here. Their problem is not the Microsoft concept, it is the
delta from what they already know.

*Sounds like:* they describe the expected behaviour confidently and correctly,
just for a different product. "It should work like..." is the tell.

*What helps:* name the other model out loud, then explain only the difference.
Explaining from scratch is slower and mildly insulting.

**They are searching for a name that changed.** Power Virtual Agents became
Copilot Studio. Common Data Service became Dataverse. Azure Active Directory
became Microsoft Entra ID. They are not confused about the concept at all -
they cannot find it.

*Sounds like:* "I can't find where...", or terminology that was correct two
years ago.

*What helps:* map old name to new name, say when it changed, and warn them that
search results and community posts still use the old one. Then stop. This is a
thirty-second fix, and treating it as a teaching moment is irritating.

Be careful in the other direction too: not everything that sounds old is. Do not
invent a rename to explain a gap. If you are unsure whether a term is current,
say so and point at the docs rather than guessing.

**They asked at the wrong level.** The question is about a symptom, and the
answer lives one level down. "Why does my connection reference break" is usually
a question about deployment settings, not about connection references.

*Sounds like:* "why does X happen" rather than "what is X".

*What helps:* answer the question they asked briefly, then say plainly that the
thing they need is one level down, and go there. Do not silently substitute a
different question - that reads as evasion.

**It is genuinely hard.** Dataverse security composing across tables, ALM
environment variable binding, orchestration deciding which action to call. The
confusion is correct and proportionate.

*Sounds like:* the framing is right, the questions are right, they just do not
have enough yet.

*What helps:* say out loud that this one is genuinely difficult. It stops them
concluding they are slow, which is the most common reason people quietly give
up on a product area.

## Say what you diagnosed

Two sentences, before the explanation: here is what I think you have got wrong,
here is what I am about to explain. If the diagnosis is off, they will correct
you immediately and cheaply. Silent diagnosis wastes the whole answer when it
misses.

## Explain against their thing, not a sample

Use their agent, their table, their environment, their failure. The sample
scenario in the docs is already written and they have already skipped it.

Match the level to what they need to do next. Someone debugging a broken import
today does not need the ALM philosophy. Someone designing an environment
strategy does. Ask what they need to decide, and stop at the point where they
can decide it.

Then point at exactly one primary source. One good link gets read; five get
bookmarked and forgotten.

## Be willing to say they do not need it

The documentation has no incentive to tell anyone that a feature is irrelevant
to them. You do. "You do not need to understand that to do what you are doing"
is often the most valuable sentence available, and nobody else in the stack will
say it.

Equally, if they already know this and are asking to confirm, say so and move
on. Explaining something to someone who already understands it is a slow way to
lose their attention.

## What this is not

It is not a substitute for doing the thing. Reading about environment strategy
does not teach environment strategy - the first painful promotion does. Where
practice is the only teacher, say that, and help them set up the smallest safe
version of the real thing.

It is not certification preparation. That is deliberate: exam objectives change
faster than any skill can track, and Microsoft's own preparation materials are
free and kept in sync. Two examples of why - PL-600 retired on 30 June 2026 and
PL-200 retires on 31 August 2026. Anything written here about exam content would
already be wrong. Send people to the official exam page and let them read the
current objectives.

## Verified references

- [Microsoft Copilot Studio training paths](https://learn.microsoft.com/en-us/training/browse/?products=ms-copilot-studio) -
  the current catalogue, rather than a link to any one module that may move.
- [Create and extend agents with Copilot Studio](https://learn.microsoft.com/en-us/training/paths/create-extend-custom-copilots-microsoft-copilot-studio/) -
  the structured path for someone starting from nothing.
- [Agent Academy](https://microsoft.github.io/agent-academy/) - deeper,
  practitioner-oriented material for people past the basics.
- [Microsoft credentials and certifications](https://learn.microsoft.com/en-us/credentials/certifications/power-platform-fundamentals/) -
  for anyone who does want the certification route. Check retirement dates
  before recommending any specific exam.
