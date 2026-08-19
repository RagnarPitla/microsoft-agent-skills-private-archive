This repository is public and is written by someone who works on real Microsoft customer engagements. Everything here is read by customers, partners and Microsoft colleagues. One leaked customer name is a career problem, not a repo problem.

Run this check before publishing a skill, a docs page, a README example, a screenshot, a video or a social post.

## Never publish

- **A named customer.** Not in a skill, not in an example, not in a commit message, not in a test fixture. Not even a customer that is publicly known to be a Microsoft customer, because confirming *what you did for them* is the disclosure.
- **Data from any customer tenant.** No exported records, no entity names that are obviously bespoke, no environment URLs, no org IDs, no user principal names, no support ticket numbers.
- **Internal Microsoft tooling, systems or roadmap.** Internal tool names, internal-only URLs, unreleased feature names, dates for unannounced releases, internal guidance documents.
- **Anything under NDA.** Private preview features, private preview documentation, and anything from a customer's own NDA.
- **Screenshots containing real data.** Tenant names, real user names and photos, real financial figures, real addresses. Blur is not enough; regenerate the screenshot with synthetic data.
- **Credentials of any kind.** Connection strings, client secrets, tenant IDs, subscription IDs, API keys, SAS tokens, bearer tokens. Even expired ones, because they reveal structure.

## Instead

- **Invent a company.** Use a fictional organisation with a clearly invented name. Keep the same fictional company across the repo so examples feel coherent.
- **Use synthetic data.** Generate it. Never anonymise real data by find-and-replace, because the shape, volume and outliers of real data are themselves disclosure.
- **Generalise the lesson, drop the specifics.** "A manufacturer with a heavily customised F&O deployment hit this" is publishable. The customer's name, industry niche and go-live date together are identifying, even without the name.
- **Describe public behaviour only.** If it is on `learn.microsoft.com` or was announced publicly, it is fair game. Link to the announcement.

## Pre-publish checklist

Work through this before every push that touches public content.

1. Search the diff for customer names, including abbreviations and internal project code names.
2. Search for tenant URLs: `.crm.dynamics.com`, `.operations.dynamics.com`, `.sharepoint.com`, `.onmicrosoft.com`.
3. Search for GUIDs. Every GUID is either a tenant ID, a subscription ID, an app ID or an environment ID until proven otherwise.
4. Search for anything that looks like a secret: `secret`, `password`, `apikey`, `token`, `connectionstring`, `Bearer`.
5. Open every image and read it, including the browser tab titles, the address bar and any notification popups caught in the frame.
6. Confirm every feature named is publicly announced. If you learned it in an internal channel, do not write it down, even if it is also public, until you can point at the public source.

## When you are not sure a product name is public

Check the vendor documentation directly before treating a name as confidential. A single research pass failing to find something is not evidence that it is internal - `learn.microsoft.com` is the arbiter, not a web search.

This has already gone wrong once in this repo, in the safe direction: Microsoft Scout, Copilot Cowork and Work IQ were stripped from the package description because one research pass could not find them publicly. All three have live Learn documentation. The caution cost nothing and the instinct was right, but the check was wrong.

Run the check that settles it:

```bash
curl -s -o /dev/null -w "%{http_code}" -L -A "Mozilla/5.0" "https://learn.microsoft.com/en-us/<path>"
```

A 200 on a vendor documentation page is the public source rule 6 asks for. No page, no mention - leave it out. Erring toward silence is still correct when the answer is genuinely unclear, but check properly before you err.
7. Confirm every example uses the fictional company and synthetic data.
8. Ask: if this specific customer read this page, would they recognise themselves? If yes, change it until they would not.

## If something slips

Deleting the commit is not enough; Git history and forks persist. Force-push the history rewrite, rotate anything credential-shaped immediately, and tell whoever owns the relationship before they hear it from someone else. Speed matters more than tidiness.
