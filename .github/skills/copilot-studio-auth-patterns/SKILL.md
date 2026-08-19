---
name: copilot-studio-auth-patterns
description: "Choose and debug authentication for a Copilot Studio agent. Use when deciding how users sign in, when an agent cannot call a downstream API as the signed-in user, when a token or User variable is empty or shows as Unknown, when an agent cannot be published to the intended channel, or when you need to control who in the organisation can talk to an agent."
---

<!-- Generated from SKILL.md by scripts/build-harnesses.mjs. Do not edit by hand; run `npm run build`. -->
<!-- Source: skills/connect/copilot-studio-auth-patterns/SKILL.md -->
The authentication setting in Copilot Studio looks like three radio buttons. It
is actually three decisions bundled into one control, and two of them are
invisible at the moment you choose:

1. **How users sign in.**
2. **Which channels you can publish to.**
3. **Whether your agent can ever get a token to call a downstream API as that
   user.**

Almost every painful auth conversation is someone discovering decision 2 or 3
weeks after making decision 1. The choice is cheap to make and expensive to
reverse, so make it deliberately.

## Ask what "auth" means here first

The word covers two unrelated problems, and people routinely bring the second
one described as the first:

- **User authentication** - how the *person* talking to the agent signs in, and
  what the agent knows about them. That is this skill.
- **Downstream authentication** - what identity the agent uses to reach
  SharePoint, Dataverse, an API or an MCP server. That is connections,
  connection references and service principals, and it is mostly a different
  problem with different failure modes.

A useful separating question: *does the answer need to differ per user?* If two
users must see different data, you need user authentication. If every user
should see the same thing, you almost certainly want a service identity and the
user auth question is a distraction.

For the downstream half, the ALM failure that actually bites at go-live -
connection references that arrive unresolved in the target environment and
leave flows deactivated - is covered by
`power-platform-alm-connection-refs`. Do not re-derive it here.

## The three options and what each one forecloses

Verify the current picker in-product before advising: the option names and the
admin controls around them have changed more than once. What follows is the
shape of the decision, not a promise about today's labels.

### No authentication

Anyone with the link can talk to the agent, and you cannot control who. That is
the whole trade. It is defensible for genuinely public content and indefensible
for anything else.

Worth knowing: a data policy in the Power Platform admin center can require
authentication, which removes this option entirely. If someone insists it was
available last month and is not now, look at admin policy before looking for a
bug.

### Authenticate with Microsoft

The convenient option, and the one chosen by default under time pressure. It
sets up Entra ID authentication with no manual configuration, and because Teams
already identifies the user, people are not prompted to sign in again.

The two things it costs you:

- **Channel reach.** This option is oriented at Teams and Microsoft 365. If the
  roadmap includes a public website, a bespoke channel or an embedded
  experience, confirm the channel is supported *before* building on it.
- **No access token.** `User.AccessToken` and `User.IsLoggedIn` are not
  available. You get identity, not delegation. An agent that must call an API
  *as the signed-in user* cannot do it from here.

That second point is the single most common late discovery in this area. If
there is any prospect of calling a downstream API on the user's behalf, this
option will have to be unwound.

It is also not available for agents integrating with Dynamics 365 Customer
Service, which is worth checking early in a customer service engagement rather
than late.

### Authenticate manually

More configuration, and the only option that gives you a token. Supports Entra
ID - including certificate and federated-credential variants - and generic
OAuth2 providers, which is what you need for a non-Microsoft identity provider.

Choose it when any of the following is true:

- The agent must call an API as the signed-in user.
- You need to publish beyond Teams with real authentication.
- Your identity provider is not Microsoft.

One governance trap that is easy to miss: with **Entra ID** you can require
sign-in and then use agent sharing to control which people in the organisation
may chat with the agent. With **generic OAuth2** you can require sign-in, but
you cannot restrict *which* users - anyone who successfully signs in with that
provider can talk to the agent. If the requirement is "only our finance team
may use this", a generic OAuth2 provider does not deliver it, and this surprises
people at review time.

## The failure modes worth recognising on sight

**A `User.` variable shows as Unknown after an auth change.** Switching from
manual authentication to Authenticate with Microsoft removes
`User.AccessToken` and `User.IsLoggedIn`. Topics referencing them do not
rewrite themselves - they break, and they break quietly until publish. After
any change to the authentication mode, search the topics for the variables that
no longer exist and fix them before publishing.

**"I changed the setting and nothing happened."** Authentication changes take
effect only after the agent is published. Test-pane behaviour after an auth
change is not evidence of anything until you publish.

**"It works for me and not for them."** Different answers for different users is
a permissions symptom far more often than an auth-configuration symptom. The
agent may be authenticating perfectly and simply retrieving what each user is
allowed to see. Establish whether the difference tracks the *user* or the
*session* before touching auth config.

**"The option is greyed out."** Tenant admin controls can lock the manual
authentication option so it cannot be changed in Copilot Studio at all. That is
a governance decision made elsewhere, not a defect - find who owns the policy.

**An MCP server that will not appear or work.** MCP in Copilot Studio requires
generative orchestration to be turned on. Confirm that before debugging
credentials, because the symptom looks like a connection problem.

## Design it in this order

1. **Does behaviour need to differ per user?** No means a service identity and
   a much simpler design. Say so plainly - it removes work.
2. **Where must this be published?** Get every channel on the table now,
   including the ones that are "maybe next quarter". Channel reach is the
   constraint most likely to invalidate the easy choice.
3. **Will the agent call anything as the user?** If yes, or plausibly yes
   later, you need the option that yields a token.
4. **Who is allowed to talk to it?** If the answer is a specific group rather
   than "anyone in the tenant", check that your chosen provider can actually
   express that.
5. **Only then configure**, and publish before you believe any of it.

## Say when you do not know

Field-level configuration for manual authentication - URL templates, grant
types, scope delimiters, certificate settings - is genuinely fiddly and changes
between providers. Do not reconstruct those templates from memory. Send people
to the field reference and let them read the current table.

The same applies to which channels support which authentication mode today.
That matrix has moved, and a confident wrong answer here costs someone a
rebuild.

## Verified references

- [Configure user authentication](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-end-user-authentication) -
  the three options, the variables each one exposes, the sharing behaviour and
  the manual configuration field reference.
- [Extend an agent with Model Context Protocol](https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-extend-action-mcp) -
  MCP integration, including the generative orchestration prerequisite.
- [Power Platform ALM overview](https://learn.microsoft.com/en-us/power-platform/alm/overview-alm) -
  for the downstream identity and connection reference half of the problem.
