---
name: assess-change-blast-radius
description: "Work out what a Power Platform or Copilot Studio change breaks somewhere else, before it ships. Use when a solution is about to be imported into production, when a connection reference or environment variable is being repointed, when a connector is being added to a DLP policy, when trigger phrases or a knowledge source are changing, when a shared component is being deleted, when an agent is about to be published, or when someone asks \"what could this break\"."
---

<!-- Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`. -->
<!-- Source: skills/review/assess-change-blast-radius/SKILL.md -->
On a code change, the callers are greppable. You read the diff, search the
symbol, and the tooling shows you who is affected.

None of that holds here. The things that depend on a Power Platform change
are not in the file you edited. They are in Dataverse solution metadata, in
an environment you are not currently looking at, in a DLP policy set by
somebody in another team, and in a classifier that will reroute traffic you
never touched. So the instinct that works on a pull request under-reports
every time, and it under-reports *confidently*, which is the dangerous part.

Listing the components in the solution is not the job. Anyone can read the
component list. The job is the breakage the component list does not show.

Companion to [review-copilot-studio-agent](../../../skills/review/review-copilot-studio-agent/SKILL.md),
which reads one agent's configuration for defects, and to
[power-platform-alm-connection-refs](../../../skills/operate/power-platform-alm-connection-refs/SKILL.md),
which fixes the import itself when it breaks. This skill answers a different
question: the change is correct, so what *else* moves when it lands?

## Do not trust your own writeup

A blast-radius writeup that sounds right is worthless, because it reads as
equally convincing whether or not it is true. That is the trap.

So do not hand back the reasoning. Find the one or two facts the change's
safety actually depends on, and settle them against the platform rather than
against your own model of the platform.

### How sure are you

For each safety-critical fact, get it as far down this list as is cheap, and
say out loud where it stopped.

1. **You said so.** Worthless on its own, however plausible.
2. **You pointed at the artifact.** A real file and line in the YAML, a named
   component in the solution, the exact environment variable schema name.
3. **You walked the path.** You traced how the failure would have to happen
   and it does not reach.
4. **You asked the platform.** You opened the dependency view, the connection
   reference's consumers, the solution layers, or the DLP impact, and read
   what Dataverse says rather than what you inferred.
5. **You ran it.** You imported into a non-production environment and watched
   the behaviour.

Step 4 is the one people skip, and it is the only step that beats inference,
because Dataverse tracks dependencies that are invisible in the file you
edited. Anything you cannot get to step 4, mark unproven. Do not round up.

## Find the one fact it is safe because of

Most changes that look frightening are safe because of a single fact. "This
topic is only reachable from one parent topic, which we are not changing."
"This environment variable already has a current value in every target
environment, so the new default is inert." "This connector is already in the
Business group of every policy that touches these environments."

Find that fact first. If it holds, most of the scary cases die at once and
you can spend your attention on the two that survive. If you cannot find it,
that is itself the finding, and it usually means the change is larger than it
looks.

## Where the blast radius actually goes

Work from what changed. Each of these reaches past the artifact in front of
you, and none of them shows up in a diff.

**A connection reference.** Connection references are shared. Repointing one,
or reassigning the connection behind it, moves every flow and agent action
that references it, across every solution in that environment, not just the
one you are working in. Enumerate the consumers before you touch it.

**An environment variable.** There are two values: a default that travels in
the solution, and a current value set in the environment. The current value
wins. So changing the default is a no-op wherever a current value already
exists, and a live change wherever one does not. That asymmetry is why the
same deployment behaves differently in test and production, and why "it
worked in UAT" is not evidence here.

**A DLP policy.** Policy changes are environment-wide or tenant-wide, and
they apply to things that already exist. Moving a connector into the blocked
group affects every flow, app and agent already using it, immediately and
without a deployment. Check what is using the connector before the policy
changes, not after somebody reports it.

**A deleted or removed component.** Removing a component from a solution and
deleting it from the environment are different actions with very different
consequences. Use the dependency view first: it separates what merely uses
the component from what blocks its deletion outright, and the second list is
the one that tells you the change is bigger than planned.

**A managed or unmanaged layer.** If an unmanaged layer sits above a managed
component, it wins, and your managed update lands underneath it and appears
to do nothing. The deployment succeeds, the behaviour does not change, and
everyone looks for the bug in the wrong place. Check the layers before
concluding a change failed to apply.

**Topic triggering in a Copilot Studio agent.** Routing is global, so a topic
you add or a trigger phrase you edit changes selection for topics you did not
touch. The new topic can quietly capture traffic that used to reach an
existing one. The blast radius of adding a topic is every topic near it in
meaning, which is why this needs an evaluation rather than one test question.

**A knowledge source.** Adding, removing or rescoping a source changes
answers to every question in its neighbourhood, not only the question that
prompted the change. If you are fixing one bad answer this way, measure the
others before and after.

**A connected or child agent.** Its behaviour propagates to every parent that
calls it. Ownership of the change and ownership of the consequences are
usually different people, so find the callers before shipping.

**A custom connector.** Every consumer moves with it. Version and deprecate
rather than editing in place when the consumers are not all yours.

**Publishing.** Publishing pushes the draft live to the channels the agent is
already published on. There is no per-channel staging, so "let me publish and
check it in the test pane" is a production change if the agent is on Teams.

## What to hand back

- **What changed**, including the part the diff does not state.
- **The one fact it is safe because of.** Name it, say which rung of the
  ladder you got it to, and show what you checked. If you could not settle
  it, write *unproven* rather than softening it.
- **Real risks only.** Each one names how it breaks, where to look, roughly
  how likely and how bad, and the cheapest way to check.
- **Cleared.** What you checked and ruled out. A search that found nothing is
  a result worth reporting, and it stops the next person repeating it.
- **Before you deploy.** The smallest check that would catch the real failure.

Keep the risk list short and honest. A blast-radius report padded with
theoretical failures gets skimmed once and ignored afterwards, which leaves
the reader worse off than no report at all.

## Sources

- [View dependencies for a component](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/view-component-dependencies) - the *Uses*, *Used by* and *Delete blocked by* views. Verified as resolving on 2026-08-20.
- [Dependency tracking for solution components](https://learn.microsoft.com/en-us/power-platform/alm/dependency-tracking-solution-components) - what Dataverse tracks automatically, and what it does not. Verified as resolving on 2026-08-20.
- [Solution layers](https://learn.microsoft.com/en-us/power-platform/alm/solution-layers-alm) - why an unmanaged layer makes a managed update look like it did nothing. Verified as resolving on 2026-08-20.
- [Data loss prevention policies](https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention) - scope, and effect on resources that already exist. Verified as resolving on 2026-08-20.
- [Publish an agent to channels](https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-fundamentals-publish-channels) - what publishing reaches. Verified as resolving on 2026-08-20.
- [pac solution command group](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/solution) - the actual command surface. There is no dependency-check command in it; the dependency views live in the maker portal and the Dataverse API. Verified as resolving on 2026-08-20.
