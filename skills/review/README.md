# review

Passing judgement on something that already exists: agents, solutions, infrastructure, code and configuration.

These are the skills that encode what a senior reviewer would catch, and - just as importantly - what they would deliberately let go. A review that reports style opinions alongside real defects gets ignored.

**Three skills here so far.** Two read an agent: one reads a Copilot Studio agent's YAML, the other measures whether its answers are any good over time. The third asks what a change breaks elsewhere. Solution, architecture and security review are all still missing. This bucket is seeded, not filled.

## Model-invoked

Reachable by you, or reached for automatically when the task fits.

- [assess-change-blast-radius](./assess-change-blast-radius/SKILL.md) - work out what a Power Platform or Copilot Studio change breaks somewhere else, before it ships.
- [evaluate-agent-quality](./evaluate-agent-quality/SKILL.md) - establish whether an agent works, and whether it still works, using a recorded eval set rather than ad hoc chats.
- [review-copilot-studio-agent](./review-copilot-studio-agent/SKILL.md) - review a Copilot Studio agent's YAML for defects that matter before it ships.
