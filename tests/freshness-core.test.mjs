import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parseVerifiedBlock,
  parseRegistryVerifiedOn,
  effectiveReviewDate,
  checkFreshness,
  DEFAULT_REVIEW_DAYS,
} from "../scripts/lib/freshness-core.mjs";

describe("parseVerifiedBlock", () => {
  test("returns null when there is no Verified as resolving on line", () => {
    assert.equal(parseVerifiedBlock("## Sources\n\nNo dated claim here.\n"), null);
  });

  test("parses a verified-on date with no Review by", () => {
    const text = "## Sources\n\nVerified as resolving on 2026-01-15.\n\n- Some link\n";
    assert.deepEqual(parseVerifiedBlock(text), { verifiedOn: "2026-01-15", reviewBy: null });
  });

  test("parses a verified-on date with an explicit Review by on the next line", () => {
    const text = "## Sources\n\nVerified as resolving on 2026-01-15.\nReview by 2026-04-01.\n\n- Some link\n";
    assert.deepEqual(parseVerifiedBlock(text), { verifiedOn: "2026-01-15", reviewBy: "2026-04-01" });
  });

  test("does not attribute a Review by that belongs to a much later, unrelated section", () => {
    const text =
      "Verified as resolving on 2026-01-15.\n\n" +
      "Some unrelated paragraph that goes on for a while so the next Review by claim is far away from the verified-on sentence and should not be picked up by this parse. ".repeat(
        5,
      ) +
      "\nReview by 2030-01-01.\n";
    const result = parseVerifiedBlock(text);
    assert.equal(result.verifiedOn, "2026-01-15");
    assert.equal(result.reviewBy, null);
  });

  test("only reports the first Verified as resolving on match in a longer document", () => {
    const text = "Intro.\n\nVerified as resolving on 2025-06-01.\n\nMore text.\n\nVerified as resolving on 2025-12-01.\n";
    assert.deepEqual(parseVerifiedBlock(text), { verifiedOn: "2025-06-01", reviewBy: null });
  });
});

describe("parseRegistryVerifiedOn", () => {
  test("returns null when the field is absent", () => {
    assert.equal(parseRegistryVerifiedOn("connectors:\n  - name: foo\n"), null);
  });

  test("parses a top-level verified_on field", () => {
    assert.equal(parseRegistryVerifiedOn("verified_on: 2026-03-02\nconnectors: []\n"), "2026-03-02");
  });

  test("does not match an indented verified_on that belongs to a nested entry", () => {
    // Only a column-0 `verified_on:` is the registry-wide stamp; per-entry
    // fields (if any existed) would be indented and must not be picked up.
    assert.equal(parseRegistryVerifiedOn("connectors:\n  - verified_on: 2026-03-02\n"), null);
  });
});

describe("effectiveReviewDate", () => {
  test("uses the explicit Review by date when present", () => {
    const due = effectiveReviewDate({ verifiedOn: "2026-01-01", reviewBy: "2026-02-01" });
    assert.equal(due.toISOString().slice(0, 10), "2026-02-01");
  });

  test("falls back to verifiedOn + default window when Review by is absent", () => {
    const due = effectiveReviewDate({ verifiedOn: "2026-01-01", reviewBy: null });
    const expected = new Date("2026-01-01T00:00:00Z");
    expected.setUTCDate(expected.getUTCDate() + DEFAULT_REVIEW_DAYS);
    assert.equal(due.toISOString().slice(0, 10), expected.toISOString().slice(0, 10));
  });
});

describe("checkFreshness", () => {
  test("passes (no problems) when every entry is within its review window", () => {
    const today = new Date("2026-01-10T00:00:00Z");
    const entries = [
      { label: "skills/a/SKILL.md", verifiedOn: "2026-01-01", reviewBy: null },
      { label: "skills/b/SKILL.md", verifiedOn: "2025-12-01", reviewBy: "2026-06-01" },
    ];
    assert.deepEqual(checkFreshness(entries, today), []);
  });

  test("fails when today is past the default window with no explicit Review by", () => {
    const today = new Date("2026-08-01T00:00:00Z");
    const entries = [{ label: "skills/a/SKILL.md", verifiedOn: "2026-01-01", reviewBy: null }];
    const problems = checkFreshness(entries, today);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /skills\/a\/SKILL\.md/);
    assert.match(problems[0], /default 180-day window/);
  });

  test("fails when today is past an explicit Review by date, even within the default window", () => {
    const today = new Date("2026-02-15T00:00:00Z");
    const entries = [{ label: "skills/b/SKILL.md", verifiedOn: "2026-01-01", reviewBy: "2026-02-01" }];
    const problems = checkFreshness(entries, today);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /explicit "Review by 2026-02-01\."/);
  });

  test("reports one problem per overdue entry and none for entries still within window", () => {
    const today = new Date("2026-08-01T00:00:00Z");
    const entries = [
      { label: "stale-1", verifiedOn: "2026-01-01", reviewBy: null },
      { label: "fresh-1", verifiedOn: "2026-07-01", reviewBy: null },
      { label: "stale-2", verifiedOn: "2025-01-01", reviewBy: "2026-01-01" },
    ];
    const problems = checkFreshness(entries, today);
    assert.equal(problems.length, 2);
    assert.ok(problems.some((p) => p.startsWith("stale-1:")));
    assert.ok(problems.some((p) => p.startsWith("stale-2:")));
    assert.ok(!problems.some((p) => p.startsWith("fresh-1:")));
  });

  test("an entry due exactly today is not yet overdue", () => {
    const today = new Date("2026-02-01T00:00:00Z");
    const entries = [{ label: "edge", verifiedOn: "2026-01-01", reviewBy: "2026-02-01" }];
    assert.deepEqual(checkFreshness(entries, today), []);
  });
});
