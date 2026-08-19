---
name: sample-user-invoked
description: User-invoked fixture skill for tests. Menu label only.
disable-model-invocation: true
---

# Sample user-invoked skill

A synthetic, user-invoked fixture skill. It declares
`disable-model-invocation: true` and pairs it with `agents/openai.yaml`
setting `policy.allow_implicit_invocation: false`, so tests can assert that
`loadSkills()` reads both sides of the invocation declaration consistently.
