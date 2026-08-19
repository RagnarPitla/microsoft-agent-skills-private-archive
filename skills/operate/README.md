# operate

Running an agent or solution once it is live: ALM and deployment, environments, monitoring, governance, support and the things that break at 2am.

These are the skills for the part of the work that starts when the build is finished and everyone else has moved on.

**Still seeded rather than filled.** The most obvious remaining gap is evaluation and regression testing as an ongoing discipline separate from `evaluate-agent-quality`'s one-off measurement approach - four skills elsewhere in this repo tell you that you need a test suite before you promote anything, and none of them tells you how to build a continuous regression harness. Naming the hole is more useful than padding the list to look complete.

## Model-invoked

Reachable by you, or reached for automatically when the task fits.

- [govern-agent-lifecycle](./govern-agent-lifecycle/SKILL.md) - decide whether an agent should still exist, who owns it, and whether it is governed the way production requires.
- [monitor-agent-telemetry](./monitor-agent-telemetry/SKILL.md) - set up the signals that tell you an agent is healthy and being used before a user has to report otherwise.
- [plan-agent-capacity-and-cost](./plan-agent-capacity-and-cost/SKILL.md) - work out whether an agent's message capacity, quota or spend is sized correctly before a limit or a bill surprises someone.
- [power-platform-alm-connection-refs](./power-platform-alm-connection-refs/SKILL.md) - fix and prevent solution imports that break on connection references, environment variables and flow ownership.
- [respond-to-agent-incidents](./respond-to-agent-incidents/SKILL.md) - triage and recover when a live agent is failing right now and users are affected.
