# Documentation

One page per skill, written for a person deciding whether to reach for it. These
describe outcomes: what a skill does, when it is the right tool, what it does not
do, and how you know it worked.

They deliberately do not restate the execution steps. Those live in the
`SKILL.md`, which is what your agent actually loads - and two copies of the same
steps is one copy that goes stale. Every page links to its source.

New here? Install the collection from the [README](../README.md) and run
[ask-ragnar](../skills/deliver/ask-ragnar/SKILL.md), which does this routing
conversationally. This index is the version you can skim.

## build

Creating an agent or solution on any Microsoft surface.

- [copilot-studio-knowledge-grounding](./build/copilot-studio-knowledge-grounding.md) - an agent that hallucinates, cites the wrong source, or answers the same question two ways.
- [copilot-studio-production-patterns](./build/copilot-studio-production-patterns.md) - the gap between an agent that demos well and one that survives a real tenant.
- [migrate-agent-to-skills](./build/migrate-agent-to-skills.md) - moving a prompt-stuffed or legacy agent onto a portable skills harness without carrying its rot forward.
- [write-a-skill](./build/write-a-skill.md) - writing or repairing a skill so it fires when it should and stays quiet when it should not.

## connect

Wiring an agent to data, systems and tools: connectors, MCP servers, APIs.

- [copilot-studio-auth-patterns](./connect/copilot-studio-auth-patterns.md) - choosing sign-in, and the channels and tokens a choice quietly forecloses.
- [ground-agents-in-work-context](./connect/ground-agents-in-work-context.md) - which grounding layer across the Microsoft IQ stack, and the naming collision that sends people to the wrong one.

## review

Reviewing something that already exists: code, YAML, solutions, architecture, security.

- [evaluate-agent-quality](./review/evaluate-agent-quality.md) - whether an agent works, and whether it still works, on a recorded eval set rather than ad hoc chats.
- [assess-change-blast-radius](./review/assess-change-blast-radius.md) - what a change breaks somewhere else, in a platform where the callers are not greppable.
- [review-copilot-studio-agent](./review/review-copilot-studio-agent.md) - reading an agent's YAML for the defects that matter before it ships.

## operate

ALM, testing, evaluation, governance, monitoring, cost, incident response.

- [govern-agent-lifecycle](./operate/govern-agent-lifecycle.md) - who owns an agent, whether it should still exist, and whether it is governed the way production requires.
- [monitor-agent-telemetry](./operate/monitor-agent-telemetry.md) - knowing whether a live agent is working, from the data it already emits.
- [plan-agent-capacity-and-cost](./operate/plan-agent-capacity-and-cost.md) - sizing message capacity, quota and spend before a limit is hit or a bill surprises someone.
- [power-platform-alm-connection-refs](./operate/power-platform-alm-connection-refs.md) - solution imports that break on connection references, environment variables and flow ownership.
- [respond-to-agent-incidents](./operate/respond-to-agent-incidents.md) - telling a platform outage from your own change, and getting a broken agent back to working.

## deliver

The consulting layer: discovery, estimating, requirements, decisions, handoff.

- [ask-ragnar](./deliver/ask-ragnar.md) - which skill fits the situation in front of you, or an honest answer that none does.
- [choose-agent-platform](./deliver/choose-agent-platform.md) - which Microsoft platform to build on, and the written reason you will need in six months.
- [de-slop](./deliver/de-slop.md) - turning fluent, competent, information-free prose back into something worth reading.
- [discovery](./deliver/discovery.md) - pinning down what you are actually building before you build it.
- [structured-interview](./deliver/structured-interview.md) - the interview discipline the other interview skills are built on.
- [what-should-i-build](./deliver/what-should-i-build.md) - whether this needs an agent at all, and whether to consume, govern or build.

## learn

Learning the stack yourself, and teaching it to others.

- [explain-concept](./learn/explain-concept.md) - explaining a concept after working out what the person actually misunderstands.

---

This index is enforced. `scripts/validate-repo.mjs` fails the build when a
promoted skill is missing from it, or when it lists a skill that no longer
exists - the same treatment as the README, the plugin manifest and the bucket
listings. An index that quietly falls behind is worse than no index, because
people trust it.
