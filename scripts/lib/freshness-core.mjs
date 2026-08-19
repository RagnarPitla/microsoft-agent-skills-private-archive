/**
 * Pure freshness-governance logic, split out of scripts/check-freshness.mjs so
 * it can be unit tested against fixture strings/dates without touching the
 * filesystem or the clock. See .agents/freshness.md for the convention this
 * enforces.
 */

/** Days after `Verified as resolving on` before a claim is due for re-review, when no explicit `Review by` is given. */
export const DEFAULT_REVIEW_DAYS = 180;

const VERIFIED_RE = /Verified as resolving on (\d{4}-\d{2}-\d{2})\./;
const REVIEW_BY_RE = /Review by (\d{4}-\d{2}-\d{2})\./;

/**
 * Find the `Verified as resolving on` (and optional `Review by`) dates in a
 * skill body or docs page. Returns null when the text has no such claim -
 * most skills and docs pages have nothing perishable to date.
 *
 * @param {string} text
 * @returns {{verifiedOn: string, reviewBy: string|null}|null}
 */
export function parseVerifiedBlock(text) {
  const verified = VERIFIED_RE.exec(text);
  if (!verified) return null;
  // Look only at the remainder of the line/paragraph immediately after the
  // verified-on sentence, so a `Review by` claim belonging to a *different*
  // Sources section elsewhere in a long docs page is never attributed here.
  const after = text.slice(verified.index, verified.index + 200);
  const reviewBy = REVIEW_BY_RE.exec(after);
  return { verifiedOn: verified[1], reviewBy: reviewBy ? reviewBy[1] : null };
}

/** Same idea, for a registry file's single top-level `verified_on: YYYY-MM-DD`. */
export function parseRegistryVerifiedOn(text) {
  const m = /^verified_on:\s*(\d{4}-\d{2}-\d{2})\s*$/m.exec(text);
  return m ? m[1] : null;
}

/** The date a claim is due for re-review: the explicit `Review by`, or `Verified as resolving on` plus the default window. */
export function effectiveReviewDate({ verifiedOn, reviewBy }, defaultDays = DEFAULT_REVIEW_DAYS) {
  if (reviewBy) return new Date(`${reviewBy}T00:00:00Z`);
  const d = new Date(`${verifiedOn}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + defaultDays);
  return d;
}

/**
 * Check a list of dated entries against "today" and report anything overdue.
 *
 * @param {Array<{label: string, verifiedOn: string, reviewBy?: string|null}>} entries
 * @param {Date} today
 * @returns {string[]} problems, one per overdue entry
 */
export function checkFreshness(entries, today) {
  const problems = [];
  for (const entry of entries) {
    const due = effectiveReviewDate(entry);
    if (due.getTime() < today.getTime()) {
      const overdueDays = Math.floor((today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
      const basis = entry.reviewBy
        ? `explicit "Review by ${entry.reviewBy}."`
        : `"Verified as resolving on ${entry.verifiedOn}." plus the default ${DEFAULT_REVIEW_DAYS}-day window`;
      problems.push(
        `${entry.label}: review was due ${due.toISOString().slice(0, 10)} (${overdueDays} day(s) overdue) - ${basis}. Re-check the sources and bump the date.`,
      );
    }
  }
  return problems;
}
