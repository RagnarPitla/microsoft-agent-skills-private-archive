---
name: sample-skill
description: Fixture skill used only by tests/lib-parsing.test.mjs. Use when validating that loadSkills() and parseFrontMatter() read a model-invoked skill's front matter, body and folder correctly, including a multi-line folded description value like this one.
---

# Sample skill

This is a synthetic fixture skill body used only by the test suite. It exists
to give `loadSkills()` something real to parse: a front-matter block, a body,
and a folder name that must match the declared `name`. It contains no real
customer, tenant or Microsoft-internal information.

It links to a [sibling reference](./references/note.md) so link re-anchoring
can also be exercised from the same fixture tree.
