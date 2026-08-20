/**
 * Hand-authored positive/negative utterances for every model-invoked skill,
 * scored against `scripts/lib/trigger-core.mjs`'s keyword-overlap ranker in
 * `tests/trigger-core.test.mjs`.
 *
 * - `positive`: a paraphrase of the skill's own "Use when" clause. The
 *   ranker must place this skill first among all model-invoked skills.
 * - `negative`: an utterance drawn from a genuinely confusable neighbouring
 *   skill's domain (the same pairing called out in
 *   `skills/deliver/ask-ragnar/SKILL.md`'s routing table). The ranker must
 *   NOT place this skill first for it.
 *
 * Keys must exactly match a skill's `name:` frontmatter. The integration
 * test in tests/trigger-core.test.mjs fails loudly if a model-invoked skill
 * is missing from this file, or if this file references a skill that no
 * longer exists - so every new model-invoked skill must be added here.
 */
export const TRIGGER_CASES = {
  "assess-change-blast-radius": {
    positive: [
      "We're repointing a connection reference before this solution goes into production and nobody can say what else uses it.",
      "What could adding this topic break, given the agent is already published to Teams and answering real questions?",
    ],
    negative: [
      "The solution import itself is failing on connection references and the flows turned themselves off afterwards.",
    ],
  },

  "copilot-studio-auth-patterns": {
    positive: [
      "Our Copilot Studio agent can't call the downstream API because the token is empty and the User variable shows Unknown.",
      "We need to decide how users sign in and control who in the organisation is allowed to talk to this agent.",
    ],
    negative: [
      "The agent keeps hallucinating details and citing the wrong knowledge source for the same question.",
    ],
  },

  "copilot-studio-knowledge-grounding": {
    positive: [
      "The agent fabricates details that aren't in its knowledge sources and cites pages that don't exist.",
      "We're curating knowledge sources before go-live because the same question gets different answers in different sessions.",
    ],
    negative: [
      "Calls to our slow backend systems keep timing out and context is lost across the multi-agent handoff before we go to production.",
    ],
  },

  "copilot-studio-production-patterns": {
    positive: [
      "The agent demos well but fails with real users once calls to slow backend systems start timing out.",
      "We're preparing a production readiness review because context keeps getting lost across the multi-agent handoff.",
    ],
    negative: [
      "The User variable is empty and shows Unknown, so the agent can't call the downstream API as the signed-in user.",
    ],
  },

  "de-slop": {
    positive: [
      "This proposal reads like a brand deck and every sentence could be pasted into another company's document unchanged.",
      "Can you rewrite this summary so it stops sounding like a model wrote it and actually says something?",
    ],
    negative: [
      "My skill is installed but the agent never reaches for it, and the description reads like a table of contents.",
    ],
  },

  "evaluate-agent-quality": {
    positive: [
      "The agent used to answer correctly and now it doesn't, and nobody can say when it broke or what changed.",
      "We need a recorded eval set instead of someone typing a few questions into the test pane before we ship, and a stakeholder wants an accuracy number.",
    ],
    negative: [
      "Someone opened a pull request that changes the agent's YAML and wants it reviewed before it ships.",
    ],
  },

  "explain-concept": {
    positive: [
      "I read the Dataverse documentation twice and I still don't understand why Copilot Studio behaves this way.",
      "Can you explain what Foundry actually is, because the concept still doesn't make sense to me?",
    ],
    negative: [
      "Someone asked for an agent but I'm not convinced we need one instead of a Power Automate flow.",
    ],
  },

  "govern-agent-lifecycle": {
    positive: [
      "Nobody can say who owns this agent that's quietly running in production, and our Center of Excellence inventory has gone stale.",
      "This agent was built in the default environment and needs to move before it becomes someone else's problem, and a DLP policy conflict needs deciding.",
    ],
    negative: [
      "This specific solution import broke connection references and left the flows switched off after deployment.",
    ],
  },

  "ground-agents-in-work-context": {
    positive: [
      "The agent can see someone's email and calendar but not the approval thresholds or business entities it actually needs.",
      "We're deciding between Work IQ, Fabric IQ and Foundry IQ and need the right grounding layer for GL accounts and vendors.",
    ],
    negative: [
      "The agent cites the wrong knowledge source and gives inconsistent answers to the same question.",
    ],
  },

  "migrate-agent-to-skills": {
    positive: [
      "We have a prompt-stuffed legacy chatbot with a system prompt nobody can review, and we want to break it into a portable skills-based harness.",
      "We need the same behaviour to run in GitHub Copilot, Claude Code, Cursor and Codex instead of a hand-rolled Python agent.",
    ],
    negative: [
      "This skill was installed but the agent never reaches for it, and the description reads like a table of contents.",
    ],
  },

  "monitor-agent-telemetry": {
    positive: [
      "We shipped this agent with no dashboard or alert, and nobody can say how many sessions escalated to a human last week.",
      "We need Application Insights or Foundry tracing wired up so latency and error rates are watched continuously instead of sampled by hand.",
    ],
    negative: [
      "This Copilot Studio agent is close to its message capacity and credit allocation, and finance wants to know what it costs.",
    ],
  },

  "plan-agent-capacity-and-cost": {
    positive: [
      "Our Copilot Studio agent is close to its message capacity and credit allocation, and a finance stakeholder wants a real cost number.",
      "We need to forecast Foundry model quota and token spend before launch and reconcile prepaid credits against pay-as-you-go.",
    ],
    negative: [
      "Nobody can say how many sessions escalated to a human last week because there's no dashboard or alert behind this agent.",
    ],
  },

  "power-platform-alm-connection-refs": {
    positive: [
      "The solution import succeeded but the flows are switched off because connection references resolved to nothing.",
      "Every deployment needs someone to manually reconnect things because no deployment settings file was supplied at import.",
    ],
    negative: [
      "Nobody can say who owns this agent, and our Center of Excellence inventory of agents across the tenant has gone stale.",
    ],
  },

  "respond-to-agent-incidents": {
    positive: [
      "The agent is down right now in production and users are affected, and someone is asking what to do in the next few minutes.",
      "We need to decide whether to roll back a recent deployment safely and send stakeholders a plain-language update while it's still unresolved.",
    ],
    negative: [
      "Someone opened a pull request that changes the agent's YAML and wants a calm review before it ships.",
    ],
  },

  "review-copilot-studio-agent": {
    positive: [
      "Someone opened a pull request that changes agent.mcs.yml and the topic YAML files, and wants them reviewed before they ship.",
      "Is this agent actually ready to promote, based on what's in its configuration YAML?",
    ],
    negative: [
      "The agent used to answer correctly and now it doesn't, and we need a recorded eval set to measure it over time.",
    ],
  },

  "structured-interview": {
    positive: [
      "This request is ambiguous and the scope is unclear, and I want to be challenged and stress-tested before writing a spec.",
      "We're about to build something and I'm not certain what done even means yet.",
    ],
    negative: [
      "Someone asked for an agent but I'm not convinced we actually need one instead of a better search box.",
    ],
  },

  "what-should-i-build": {
    positive: [
      "Someone asked for an agent but I'm not convinced we need one instead of a Power Automate flow or a better search box.",
      "Twenty agents already exist in this tenant and nobody in the room can say which Copilot they even mean.",
    ],
    negative: [
      "This request is ambiguous and the scope is unclear, and I want to be challenged before writing a spec.",
    ],
  },

  "write-a-skill": {
    positive: [
      "This skill was installed but the agent never reaches for it, and the description reads like a table of contents.",
      "I can't decide between user-invoked and model-invoked for this new SKILL.md I'm drafting.",
    ],
    negative: [
      "This legacy chatbot has a system prompt nobody can review any more and we want to break the monolithic agent into skills.",
    ],
  },
};
