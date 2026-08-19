# Security policy

## Scope

This repository contains Markdown skill files, small Node.js build/validation scripts, and
registry data (YAML/JSON). There is no running service, no deployed application and no
production data - the "attack surface" is limited to:

- The Node scripts under `scripts/` (parsing, validation, harness generation).
- GitHub Actions workflows under `.github/workflows/`.
- Content that could accidentally disclose a secret, tenant identifier or customer detail (see
  [.agents/confidentiality.md](./.agents/confidentiality.md), enforced by `npm run scrub`).

## Reporting a vulnerability

If you find a security issue - a script that can be made to execute untrusted input, a
GitHub Actions workflow with an injectable expression, a dependency with a known
vulnerability, or a credential accidentally committed - please **do not open a public issue**.

Instead, use GitHub's private reporting flow:

1. Go to the [Security tab](https://github.com/RagnarPitla/microsoft-agent-skills/security) of
   this repository.
2. Click **Report a vulnerability** to open a draft
   [security advisory](https://github.com/RagnarPitla/microsoft-agent-skills/security/advisories/new).
3. Describe the issue, the affected file(s) or workflow, and, if you have one, a reproduction.

You should expect an acknowledgement within 5 business days. If the report turns out to be a
leaked secret rather than a code vulnerability, see the incident steps below - they apply
regardless of how the report arrives.

## If a secret or customer detail leaks

This is covered in detail in [.agents/confidentiality.md](./.agents/confidentiality.md). In
short: deleting the commit is not enough because history and forks persist. Any credential that
was committed must be rotated immediately, the history rewritten and force-pushed, and anyone
affected told directly rather than left to find out from the diff.

## Supported versions

This is a skills repository, not a versioned library with a support matrix. The `main` branch
is the only supported line; there are no backported security fixes to older tags.

## Dependencies

Dependencies are kept deliberately minimal (see `package.json`). New dependencies are checked
against the GitHub Advisory Database before being added, and Dependabot
(`.github/dependabot.yml`) opens pull requests for known-vulnerable or outdated versions on a
weekly schedule for both npm packages and GitHub Actions.
