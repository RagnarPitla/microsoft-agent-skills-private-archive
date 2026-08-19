# govern-agent-lifecycle

## What it does

Works out whether an agent, flow or environment should still exist, who owns it, and whether it is governed the way the rest of production is. It ends with an honest read of your estate against three questions - who owns this, where does it live, is it governed like production - rather than a generic governance lecture.

It covers building an inventory you can trust (the Power Platform admin center's built-in views, or the Center of Excellence Starter Kit for a larger estate), environment strategy, using DLP conflicts as a governance signal rather than just an obstacle, and a decommissioning process for agents nobody uses any more.

## When to reach for it

- Nobody can say who owns an agent that is quietly running in production.
- A Center of Excellence inventory has gone stale, or was never set up, and you are not sure it is worth the investment yet.
- An agent was built in a personal or default environment and needs a deliberate, ALM-disciplined move before it becomes someone else's problem.
- A DLP policy is blocking something an agent needs, and it is unclear whether the policy or the agent is wrong.
- A team is leaving or has left, and agents they built have no named owner.

This one is model-invoked, so it may be reached for automatically when a conversation turns into "who owns this" or "should this still exist".

Reach for something else when:

- One specific solution import is broken right now. That is `power-platform-alm-connection-refs`.
- The agent is live and something is actively wrong with it this minute. That is `respond-to-agent-incidents`.
- The question is whether the agent's answers are still correct, not who owns it. That is `evaluate-agent-quality`.

## Common questions

**Do we need the CoE Starter Kit, or is the admin center enough?**

The admin center's built-in environment, maker and Copilot usage views cover a lot without any kit to install, and are the right starting point for a smaller estate. The CoE Starter Kit is a real, ongoing maintenance commitment - recommend it once the estate is past the size where a manual sweep or spreadsheet stops working, not as a default first step.

**Isn't tightening DLP always the safe move?**

Not automatically. A DLP conflict is a genuine signal worth investigating rather than routing around with a broader exception - sometimes the agent is reaching somewhere it should not, and sometimes the policy predates a legitimate use case. The skill treats this as a question to ask, not a default answer either way.

**What actually counts as "governed like production"?** 

A managed solution, a service-principal identity rather than a person, deployment settings per environment, and DLP/data residency that matches the rest of the tenant's production systems - the same bar `power-platform-alm-connection-refs` sets for a single deployment, applied across the whole estate.

## It's working if

- You can name, for any given agent, who owns it and where it lives, without opening three different systems to find out.
- A DLP conflict gets investigated as a signal rather than immediately routed around.
- Agents in the default or a personal environment get flagged for a deliberate move, rather than being left there because nothing broke yet.
- Decommissioning happens on a schedule - unused agents get named as candidates - rather than only when someone notices by accident.
