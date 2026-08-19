# power-platform-alm-connection-refs

## What it does

Works out why a Power Platform solution import keeps breaking, and fixes the causes rather than the symptom.

It starts by separating five failure shapes that all get described as "the import broke": flows off after a successful import, being prompted to reconnect every time, something that worked for months and suddenly stopped, test-passes-production-fails, and imports that fail outright. They have different causes.

It then covers the four things worth fixing - connections owned by a person, missing deployment settings, environment-specific values baked into the solution, and unmanaged solutions in production - and gives you a pre-import checklist to walk before promoting anything.

## When to reach for it

- A solution imported successfully but the flows are off or failing.
- Every deployment needs someone to sit and reconnect things by hand.
- Something that ran fine for months broke when a colleague left or changed their password.
- You are setting up a pipeline and want it to stop needing hand-holding.
- You are about to promote to production and want a go/no-go check.

This one is model-invoked, so it may be reached for automatically when a conversation turns into a deployment problem.

Reach for something else when:

- The problem is a Copilot Studio agent misbehaving at runtime rather than a deployment failing. That is `copilot-studio-production-patterns` or `copilot-studio-knowledge-grounding`.
- The import fails on dependencies or solution layering. The skill will tell you that is a different conversation rather than pretending it is a connections problem.

## Common questions

**Why does it keep pushing service principals when my personal connection works fine?**

Because "works fine" here means "has not failed yet". A flow authenticating as a named individual is a production dependency on that person's employment, password and MFA state. It is one of the few problems where you know in advance both that it will happen and that it will happen at a moment nobody chose. The skill is direct about this being a deferred outage rather than a working setup.

**It refuses to give me the exact CLI command. Why?**

The Power Platform CLI flags and the settings file schema have changed more than once, and a command copied from a blog post is a common source of wasted afternoons. It describes what the step does and links the current CLI documentation. That is slower to read and much less likely to be wrong.

**Everything is unmanaged in production. How bad is that?**

Bad enough that the skill will tell you it is a cleanup project rather than a quick fix. Unmanaged imports into a downstream environment make changes there permanent and un-removable, and layering problems follow. It will not pretend there is a one-command escape.

**I cannot parameterise my Copilot Studio knowledge sources. What is the setting?**

There is not one. Knowledge sources are bound to the environment where the agent was created, and there is no supported way to parameterise them the way you would an environment variable. The skill names this as a known product gap so you stop searching, and recommends treating knowledge bindings as per-environment configuration with a documented rebinding step after deployment.

**Does it assume Azure DevOps?**

No, and it is explicit about that. GitHub Actions, Power Platform Pipelines and plain manual imports are all common, and the advice differs between them. It asks rather than assuming.

## It's working if

- It asks which failure shape you are seeing before recommending anything.
- Connection ownership comes up early if anything in your pipeline runs as a person.
- You end up with a deployment settings file per environment, in source control, rather than a habit of reconnecting by hand.
- Product limitations are named as such - the re-authentication experience and Copilot Studio knowledge binding - instead of being treated as things you configured wrongly.
- The post-import step reminds you that a successful import does not mean the flows are actually running.
