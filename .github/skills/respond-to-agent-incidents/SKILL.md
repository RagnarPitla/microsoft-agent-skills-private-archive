---
name: respond-to-agent-incidents
description: "Triage and recover when a live agent is failing right now and users are affected, rather than reviewing its configuration after the fact. Use when an agent has gone down or is answering badly in production and someone is asking what to do in the next few minutes, when it is unclear whether the outage is the agent, the underlying platform or a dependency, when a fix needs to be rolled back safely, when an incident needs a plain-language update sent to stakeholders, or when a postmortem needs to turn into a prevention item rather than a shrug."
---

<!-- Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`. -->
<!-- Source: skills/operate/respond-to-agent-incidents/SKILL.md -->
The moment an agent is visibly broken in production is the wrong moment to be
figuring out the process for the first time. This skill is that process:
triage first, communicate honestly while you work, recover safely, and turn
what you learn into something that survives past the incident.

This is not the skill for the calm, structured review of an agent's
configuration - that is `review-copilot-studio-agent`. It is not for the
disciplined ongoing measurement of answer quality - that is
`evaluate-agent-quality`. It is for right now, something is broken, and people
are affected.

## Triage: find the layer before you fix anything

The single most time-wasting mistake in an incident is fixing the wrong
layer. Work through these in order, because each rules out the ones below it:

1. **Is this the platform, not the agent?** Check Power Platform admin center
   service health, and Azure Service Health / Resource Health for anything
   Azure-hosted underneath. A platform-wide incident needs a very different
   response than a broken agent - mainly, stop changing things and wait,
   while communicating that you have identified it is not your configuration.
2. **Is this a dependency the agent calls?** A connector, an API, a
   Dataverse table, a model endpoint. If the agent's own configuration has
   not changed, look here before touching the agent at all.
3. **Did something change recently?** A deployment, a knowledge source
   update, a model version bump, a DLP policy edit. "What changed in the last
   24-48 hours" answers more incidents than deep debugging does.
4. **Is it actually the agent's configuration or behaviour?** Only once the
   first three are ruled out does this become a `review-copilot-studio-agent`
   or `copilot-studio-production-patterns` problem, and by then you likely
   already know which.

## Recovery: prefer rollback over live debugging under pressure

If a recent deployment is implicated, rolling back to the last known-good
version is almost always faster and safer than debugging forward while users
are affected. This depends on the ALM discipline already being in place -
managed solutions, a settings file per environment, tracked versions - which
is exactly what `power-platform-alm-connection-refs` covers. An incident is a
bad time to discover that discipline was skipped.

Resist the urge to make an unrelated improvement while you are in there under
pressure. An incident fix should do the smallest thing that restores service;
anything else is a second, unreviewed change riding along with the first.

## Communicating while it is still broken

Say what you know, what you do not yet know, and when you will next update -
on a schedule, not only when you have an answer. A stakeholder who hears
nothing for an hour assumes the worst; a stakeholder told "still
investigating, next update in 20 minutes" tends to wait calmly.

Do not promise a root cause before you have one. "We have restored service by
rolling back; we are still confirming what caused it" is honest and usually
sufficient in the moment.

## After: turn it into a prevention item, not a war story

A postmortem that only describes what happened is entertainment. It is worth
doing when it answers, specifically:

- What signal would have caught this sooner - and is `monitor-agent-telemetry`
  actually wired up to produce it, or did this incident just reveal a gap?
- What made rollback slow or risky, if it was - usually an ALM or ownership
  gap that `govern-agent-lifecycle` or `power-platform-alm-connection-refs`
  would have caught earlier.
- One concrete action with a named owner and a date. A postmortem with no
  owned action item is a postmortem that will recur.

## Do not

- Start debugging the agent's own configuration before checking platform and
  dependency health. It is the most common way to waste the first twenty
  minutes of an incident.
- Treat "it's back up" as resolved without understanding why. A recurrence a
  week later, unexplained, is worse for trust than the original incident.
- Skip the update cadence because there is nothing new to say. Silence is
  read as "still broken and nobody is working on it" even when that is false.
- Let a postmortem end without a named owner on at least one action. Naming
  nobody is how the same incident happens again.

## Sources

Verified as resolving on 2026-08-19.

- View service health - Power Platform admin center:
  https://learn.microsoft.com/en-us/power-platform/admin/view-service-health
- Notifications for Business & Industry Copilot services:
  https://learn.microsoft.com/en-us/power-platform/admin/notifications-explained
- Azure Resource Health overview:
  https://learn.microsoft.com/en-us/azure/service-health/resource-health-overview
- Power Platform ALM overview:
  https://learn.microsoft.com/en-us/power-platform/alm/overview-alm

If a link 404s, the page was probably renamed. Say you could not verify it
rather than guessing a replacement URL.
