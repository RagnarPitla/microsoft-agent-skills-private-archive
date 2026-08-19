# copilot-studio-auth-patterns

## What it does

Helps you choose the right authentication mode for a Copilot Studio agent, and explains what each choice quietly forecloses.

The authentication setting looks like one decision. It is three: how users sign in, which channels you can publish to, and whether the agent can ever obtain a token to call an API as the signed-in user. The last two are invisible when you make the choice and expensive to reverse afterwards, which is why the convenient option so often has to be unwound later.

It also separates user authentication from downstream authentication - the identity the agent uses to reach SharePoint, Dataverse or an API - because people routinely arrive describing the second as the first, and the fixes have nothing in common.

## When to reach for it

- You are deciding how users will sign in to a new agent.
- The agent needs to call an API as the signed-in user and you cannot get a token.
- A `User.` variable is empty, or shows as Unknown after an authentication change.
- The agent cannot be published to the channel the customer expected.
- You need only a specific group of people to be able to talk to the agent.
- An authentication change appears to have done nothing.

This one is model-invoked, so it may be reached for automatically when a conversation turns into an auth problem.

Reach for something else when:

- Flows arrive deactivated after a solution import, or connections do not resolve in the target environment. That is `power-platform-alm-connection-refs`.
- The agent answers differently for different users but authentication is working. That is usually a permissions and retrieval question - `copilot-studio-knowledge-grounding` covers it.

## Common questions

**Why is "Authenticate with Microsoft" treated with suspicion when it is the recommended easy path?**

Because it is genuinely the right answer for a Teams-only agent that never calls an API on the user's behalf, and genuinely wrong for anything else - but nothing at the point of choosing tells you which situation you are in. It does not expose an access token, so an agent that must act as the signed-in user cannot do it from there. The skill front-loads that question rather than letting it surface after the agent is built.

**My auth change did not do anything. Is it broken?**

Probably not. Authentication changes take effect only after the agent is published. Testing straight after a change tells you nothing. This is the most common false bug report in this area.

**Can I restrict my agent to one department?**

It depends on the identity provider, and this catches people. With Entra ID you can require sign-in and use agent sharing to control who may chat. With a generic OAuth2 provider you can require sign-in, but anyone who successfully signs in with that provider can talk to the agent - you cannot narrow it to specific users. If the requirement is "finance only", check this before committing to a provider.

**The authentication option is greyed out in my environment.**

Tenant-level admin controls can lock it, and a data policy can remove the no-authentication option entirely. That is a governance decision made outside Copilot Studio. Find who owns the policy rather than filing a bug.

**Why does it refuse to give me the manual configuration field values?**

Because they are provider-specific, fiddly, and have changed. URL templates, grant types and scope delimiters are exactly the kind of detail where a confident wrong answer costs a rebuild. The skill points at the current field reference instead of reciting it.

## It's working if

- The channel question came up before the agent was built, not after.
- You know whether this agent will ever need to call something as the user, and chose accordingly.
- Nobody is debugging an auth change that was never published.
- A "who is allowed to use this" requirement was checked against the identity provider's actual capability.
- Downstream connection problems got routed to the ALM skill instead of being debugged as user authentication.
