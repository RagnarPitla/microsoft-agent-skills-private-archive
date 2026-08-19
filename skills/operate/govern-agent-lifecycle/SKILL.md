---
name: govern-agent-lifecycle
description: Decide whether an agent, flow or environment should still exist, who owns it, and whether it is governed the way production requires. Use when nobody can say who owns an agent that is quietly running in production, when a Center of Excellence inventory has gone stale or was never set up, when an agent was built in a personal or default environment and needs to move before it becomes someone's problem, when DLP policies do not match what an agent actually needs to reach, or when a departing team leaves agents behind with no named owner.
verified_on: 2026-08-19
provenance: "Microsoft's Power Platform governance, CoE and environment-strategy documentation, read against the recurring pattern of agents outliving the people who built them."
---

Most agent sprawl is not malicious, it is just uncounted. Someone built something
useful in whatever environment was open, it worked, and eighteen months later
nobody can say who owns it, what it is allowed to touch, or whether it should
still be running at all. Governance is the discipline of being able to answer
those three questions for every agent in the tenant, not a one-time audit.

This is an estate-level concern, not a single deployment's. If one specific
solution import is broken right now, that is
`power-platform-alm-connection-refs`. This skill is for the question one level
up: across everything that is live, who owns it, where does it live, and is it
governed the way the rest of production is.

## The three questions worth being able to answer

**Who owns it?** Not "who built it" - who is paged when it misbehaves, and
whose departure should trigger a review. An agent with no named owner is not
ownerless, it is owned by whoever gets blamed when it breaks, which is worse.

**Where does it live?** The default environment is for personal productivity,
not production. An agent that started there because it was the path of least
resistance needs a deliberate move to a managed environment, with the same
ALM discipline as anything else being promoted - see
`power-platform-alm-connection-refs` for what that migration needs to get
right on the connections side.

**Is it governed the way this tenant's other production systems are?** DLP
policies, data residency, who can edit it, whether it has an approval gate
before changes ship. An agent that quietly bypassed all of that because it
grew organically is a gap, not a feature.

## Building the inventory

You cannot govern what you cannot see. The Power Platform admin center and the
Center of Excellence (CoE) Starter Kit both give you this, at different levels
of investment:

- The **admin center** now surfaces environment, maker and Copilot usage
  information out of the box, without any kit to install - start there if
  nothing exists yet.
- The **CoE Starter Kit** goes further: it syncs apps, flows, connectors,
  agents and their owners into Dataverse tables on a schedule, so drift shows
  up automatically instead of needing a manual sweep. It costs a real setup
  investment and ongoing maintenance, so recommend it when the tenant is past
  the size where a spreadsheet works, not by default.

Either way, the inventory is only useful if someone owns keeping it accurate.
An inventory nobody reviews is exactly as blind as no inventory, with the
added cost of maintaining it.

## Environment strategy

Ask where new work is supposed to land before it becomes a governance problem,
not after:

- **Default environment**: personal, exploratory work only. If it is being
  used for anything a customer or colleague depends on, that is the finding,
  not a footnote.
- **Development / sandbox**: where building and breaking things is safe and
  expected.
- **Production**: managed solutions, service-principal identities, deployment
  settings per environment - the standard `power-platform-alm-connection-refs`
  checklist applies in full here.

Restricting who can create new environments is usually the highest-leverage
single control, because it forces the "where should this live" conversation
to happen once, deliberately, rather than by default every time.

## DLP as a governance signal, not just a security control

A Data Loss Prevention policy that blocks a connector an agent actually needs
is not just an inconvenience for the builder - it is a sign the policy was
written before this agent's use case existed, or that the agent is reaching
somewhere it should not. Treat a DLP conflict as a prompt to ask which side is
wrong, not as an obstacle to route around with a broader exception than the
agent needs.

## Decommissioning

The uncomfortable but necessary end of the lifecycle. Ask, on a schedule:

- Is this agent still used? Zero sessions in ninety days is a decommission
  candidate, not an emergency, but it should be someone's job to notice.
- Does it still have an owner? An agent whose owner left the organisation and
  was never reassigned is a governance failure waiting to become an incident.
- If it is decommissioned, is that documented, or will someone rebuild it from
  scratch next year because they could not find out it already existed?

## Do not

- Treat the CoE Starter Kit as mandatory for every tenant. It is a real
  maintenance commitment; a small estate may be better served by the
  admin center's built-in inventory and a disciplined review habit.
- Confuse "governed" with "locked down". The goal is visibility and
  accountability, not making it hard to build anything.
- Recommend a DLP change without asking who owns that policy. Tightening or
  loosening it is a tenant-wide decision, not a per-agent one.
- Treat this as a one-time project. An inventory taken once and never
  revisited is a historical document, not governance.

## Sources

Verified as resolving on 2026-08-19.

- Power Platform Center of Excellence Starter Kit overview:
  https://learn.microsoft.com/en-us/power-platform/guidance/coe/overview
- CoE Starter Kit core (inventory) components:
  https://learn.microsoft.com/en-us/power-platform/guidance/coe/core-components
- Develop a tenant environment strategy to adopt Power Platform at scale:
  https://learn.microsoft.com/en-us/power-platform/guidance/adoption/environment-strategy
- Data loss prevention policies:
  https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention

If a link 404s, the page was probably renamed. Say you could not verify it
rather than guessing a replacement URL.
