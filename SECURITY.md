# Security policy

## What this repository is

Markdown skills, two YAML registries, and about 1,500 lines of dependency-free
Node scripts that check them. Nothing here is deployed, nothing here is published
to a package registry, and nothing here holds a credential. That shapes what
counts as a vulnerability.

## Reporting

Report privately through GitHub's
[private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
on this repository. Do not open a public issue for anything in the first two
categories below.

Expect an acknowledgement within a week. This is maintained by one person around
a full-time job, so a fix may take longer than that - you will be told which.

## What we treat as a security issue

**Disclosure.** Anything in this repository that identifies a real customer,
exposes tenant data, or reproduces internal Microsoft material. This is the most
likely and most damaging failure mode here, and it is the reason the scrub gate
exists. Report it privately; it will be removed and the history dealt with.

**A live credential**, in any file or in git history, including an expired one -
expired secrets still reveal structure.

**A bypass in `scripts/scrub.mjs`** that lets a real secret or an internal term
through. The gate has already had one silent bypass, where a placeholder anywhere
on a line suppressed every rule on that line; a credential could ship with the
build green. Finding the next one of those is genuinely valuable.

**Supply chain.** Anything that causes untrusted content to execute in CI with
write permissions. Actions are pinned by commit SHA, `check.yml` runs with
`contents: read`, and `link-rot.yml` holds `issues: write` - that job is the one
worth reading closely.

## What we do not treat as a security issue

- A dead or hijacked link in a registry entry. Real, and handled by the weekly
  link-rot job. Open a normal issue.
- Advice in a skill you disagree with, including advice you think is insecure to
  follow. That is a correctness argument, and a public issue is the right place
  for it - we would rather have it in the open.
- Anything requiring an attacker to already control the maintainer's machine.

## Supported versions

The default branch. There are no maintained release branches, and a fix ships as
the next commit rather than as a backport.
