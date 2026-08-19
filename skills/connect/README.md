# connect

Wiring an agent to data, systems and tools: connectors, MCP servers, APIs and the identities they authenticate as.

An agent that cannot reach anything is a chat window. These are the skills for the layer where it starts touching real systems - and where most of the surprises live, because the constraints are set by the identity model and the channel long before anyone writes an action.

Connectors themselves are catalogued in [registry/connectors.yaml](../../registry/connectors.yaml) rather than written up as skills, because a connector list is reference material and goes stale in a way judgement does not. MCP is the notable gap here: it is named above and has no skill yet.

## Model-invoked

Reachable by you, or reached for automatically when the task fits.

- [copilot-studio-auth-patterns](./copilot-studio-auth-patterns/SKILL.md) - choose and debug authentication for a Copilot Studio agent, including which channels a choice forecloses and whether it can ever yield a token.
- [ground-agents-in-work-context](./ground-agents-in-work-context/SKILL.md) - choose the right grounding layer across the Microsoft IQ stack, and avoid the naming collision that sends people to the wrong one.
