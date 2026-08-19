# review

Passing judgement on something that already exists: agents, solutions, infrastructure, code and configuration.

These are the skills that encode what a senior reviewer would catch, and - just as importantly - what they would deliberately let go. A review that reports style opinions alongside real defects gets ignored.

**Two skills here so far**, both pointed at agents: one reads a Copilot Studio agent's YAML, the other measures whether an agent's answers are any good over time. Solution, architecture and security review are all missing. This bucket is seeded, not filled.

## Model-invoked

Reachable by you, or reached for automatically when the task fits.

- [evaluate-agent-quality](./evaluate-agent-quality/SKILL.md) - establish whether an agent works, and whether it still works, using a recorded eval set rather than ad hoc chats.
- [review-copilot-studio-agent](./review-copilot-studio-agent/SKILL.md) - review a Copilot Studio agent's YAML for defects that matter before it ships.
