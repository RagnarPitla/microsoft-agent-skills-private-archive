import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { tokenize, buildIdf, scoreOverlap, rankSkills } from "../scripts/lib/trigger-core.mjs";
import { loadSkills } from "../scripts/lib/skills.mjs";
import { TRIGGER_CASES } from "./fixtures/trigger-cases.mjs";

describe("tokenize", () => {
  test("lowercases, strips punctuation and drops stopwords", () => {
    const tokens = tokenize("Use when the Agent cannot reach Dataverse, or a Connector times out.");
    assert.ok(tokens.has("dataverse"));
    assert.ok(tokens.has("connector"));
    assert.ok(tokens.has("times"));
    assert.ok(!tokens.has("the"));
    assert.ok(!tokens.has("when"));
    // "agent"/"skill" are deliberately NOT hardcoded stopwords: they are
    // near-ubiquitous across the corpus, so IDF weighting (not a manually
    // maintained domain list) is what should suppress their contribution.
    assert.ok(tokens.has("agent"));
  });

  test("drops tokens shorter than three characters", () => {
    const tokens = tokenize("a to go up an ok fix it");
    assert.deepEqual([...tokens].sort(), ["fix"]);
  });

  test("returns a Set with no duplicates", () => {
    const tokens = tokenize("timeout timeout timeout dataverse dataverse");
    assert.deepEqual([...tokens].sort(), ["dataverse", "timeout"]);
  });
});

describe("buildIdf", () => {
  test("gives a lower weight to a term that appears in every document", () => {
    const docs = [new Set(["common", "alpha"]), new Set(["common", "beta"]), new Set(["common", "gamma"])];
    const idf = buildIdf(docs);
    assert.ok(idf.get("common") < idf.get("alpha"));
    assert.ok(idf.get("common") < idf.get("beta"));
  });

  test("gives an equal, higher weight to terms unique to one document each", () => {
    const docs = [new Set(["alpha"]), new Set(["beta"]), new Set(["gamma"])];
    const idf = buildIdf(docs);
    assert.equal(idf.get("alpha"), idf.get("beta"));
    assert.equal(idf.get("beta"), idf.get("gamma"));
  });
});

describe("scoreOverlap", () => {
  test("sums the idf weight of every shared token", () => {
    const idf = new Map([
      ["alpha", 2],
      ["beta", 3],
      ["gamma", 5],
    ]);
    const score = scoreOverlap(new Set(["alpha", "beta", "delta"]), new Set(["alpha", "beta", "gamma"]), idf);
    assert.equal(score, 5); // alpha (2) + beta (3); delta and gamma do not overlap
  });

  test("scores zero when nothing overlaps", () => {
    const idf = new Map([["alpha", 2]]);
    assert.equal(scoreOverlap(new Set(["zzz"]), new Set(["alpha"]), idf), 0);
  });

  test("falls back to a weight of 1 for a shared token missing from the idf map", () => {
    const score = scoreOverlap(new Set(["alpha"]), new Set(["alpha"]), new Map());
    assert.equal(score, 1);
  });
});

describe("rankSkills", () => {
  const skills = [
    { name: "fix-database-timeouts", description: "Use when a database connection times out or a query is slow under load." },
    { name: "review-pull-requests", description: "Use when a pull request needs a review for correctness and style before merge." },
    { name: "plan-release-notes", description: "Use when a release needs user-facing notes summarising what changed." },
  ];

  test("ranks the skill whose description shares the most distinctive words first", () => {
    const ranked = rankSkills("Our database connection keeps timing out under heavy load", skills);
    assert.equal(ranked[0].name, "fix-database-timeouts");
  });

  test("ranks a different skill first for an unrelated utterance", () => {
    const ranked = rankSkills("Can someone review this pull request before we merge it", skills);
    assert.equal(ranked[0].name, "review-pull-requests");
  });

  test("returns every skill, including zero-score ones, in a stable order", () => {
    const ranked = rankSkills("completely unrelated gibberish about weather", skills);
    assert.equal(ranked.length, skills.length);
    assert.deepEqual(
      ranked.map((r) => r.score),
      [0, 0, 0],
    );
    // Stable on ties: original skill order preserved.
    assert.deepEqual(
      ranked.map((r) => r.name),
      skills.map((s) => s.name),
    );
  });
});

// ---------------------------------------------------------------------------
// Integration: real repo skill descriptions against hand-authored fixture
// utterances. This is the "reproducible positive/negative trigger case for
// every model-invoked skill" regression test - it fails when a description
// edit accidentally makes two skills indistinguishable, or drops the
// keywords a canonical utterance for that skill depends on.
// ---------------------------------------------------------------------------

const realSkills = loadSkills();
const modelInvoked = realSkills.filter((s) => !s.userInvoked);
const corpus = modelInvoked.map((s) => ({ name: s.name, description: s.description }));

describe("trigger fixture coverage", () => {
  test("every model-invoked skill in the repo has at least one positive and one negative case", () => {
    const missing = modelInvoked.filter((s) => !TRIGGER_CASES[s.name]);
    assert.deepEqual(missing.map((s) => s.name), [], "model-invoked skill(s) with no trigger fixture");

    for (const s of modelInvoked) {
      const cases = TRIGGER_CASES[s.name];
      assert.ok(cases.positive?.length >= 1, `${s.name}: needs at least one positive utterance`);
      assert.ok(cases.negative?.length >= 1, `${s.name}: needs at least one negative utterance`);
    }
  });

  test("the fixture does not reference a skill that no longer exists", () => {
    const knownNames = new Set(modelInvoked.map((s) => s.name));
    const stale = Object.keys(TRIGGER_CASES).filter((name) => !knownNames.has(name));
    assert.deepEqual(stale, [], "trigger-cases.mjs references skill(s) not found among model-invoked skills");
  });
});

describe("trigger fixture: positive cases rank their own skill first", () => {
  for (const [skillName, cases] of Object.entries(TRIGGER_CASES)) {
    if (!corpus.some((s) => s.name === skillName)) continue; // covered as a failure above
    for (const utterance of cases.positive ?? []) {
      test(`"${utterance}" -> ${skillName}`, () => {
        const ranked = rankSkills(utterance, corpus);
        assert.equal(
          ranked[0].name,
          skillName,
          `expected "${skillName}" to rank first, got "${ranked[0].name}" (top 3: ${ranked
            .slice(0, 3)
            .map((r) => `${r.name}=${r.score.toFixed(2)}`)
            .join(", ")})`,
        );
      });
    }
  }
});

describe("trigger fixture: negative cases do not rank their paired skill first", () => {
  for (const [skillName, cases] of Object.entries(TRIGGER_CASES)) {
    if (!corpus.some((s) => s.name === skillName)) continue;
    for (const utterance of cases.negative ?? []) {
      test(`"${utterance}" -/-> ${skillName}`, () => {
        const ranked = rankSkills(utterance, corpus);
        assert.notEqual(
          ranked[0].name,
          skillName,
          `expected "${skillName}" NOT to rank first for an utterance that belongs elsewhere, but it did`,
        );
      });
    }
  }
});
