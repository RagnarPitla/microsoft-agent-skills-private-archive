/**
 * A small, dependency-free "which skill would this utterance trigger"
 * ranker, used to regression-test that model-invoked skill descriptions
 * still distinguish themselves from their neighbours.
 *
 * This is deliberately not a simulation of how an LLM actually chooses a
 * skill - that depends on the model and is not reproducible here. It is a
 * much narrower, honest claim: an IDF-weighted keyword overlap between an
 * utterance and each skill's own trigger description, used as a canary. If a
 * description regresses to the point that even this simple scorer no longer
 * favours the right skill for a canonical utterance, an LLM's judgement has
 * lost a useful signal too - the fixture is a smoke test, not a guarantee.
 */

const STOPWORDS = new Set(
  (
    "a an the this that these those is are was were be been being " +
    "and or but if then than so because as while when where which who whom whose " +
    "of to in on for with without by from into onto over under about against " +
    "not no nor never ever always often sometimes " +
    "you your yours i me my we our us they them their it its he she his her " +
    "do does did done doing have has had having will would could should shall can may might must " +
    "use uses used using when whenever " +
    "one someone something anything nothing everything else also still yet already " +
    "there here what how why whether whichever " +
    "or a the"
  ).split(/\s+/),
);

/** Lowercase, strip punctuation, drop stopwords and very short tokens. Returns a de-duplicated Set. */
export function tokenize(text) {
  const words = (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return new Set(words);
}

/**
 * Smoothed inverse document frequency over a corpus of already-tokenized
 * documents (one Set<string> per skill description). Common words shared by
 * most descriptions (e.g. "production", "microsoft") score low; words
 * specific to one or two skills score high.
 */
export function buildIdf(tokenizedDocs) {
  const df = new Map();
  for (const doc of tokenizedDocs) {
    for (const t of doc) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const n = tokenizedDocs.length;
  const idf = new Map();
  for (const [t, count] of df) {
    idf.set(t, Math.log((n + 1) / (count + 1)) + 1);
  }
  return idf;
}

/** Sum of IDF weights for tokens shared between an utterance and a description. */
export function scoreOverlap(utteranceTokens, descriptionTokens, idf) {
  let score = 0;
  for (const t of utteranceTokens) {
    if (descriptionTokens.has(t)) {
      score += idf.get(t) ?? 1;
    }
  }
  return score;
}

/**
 * Rank every skill's description against one utterance.
 *
 * @param {string} utterance
 * @param {Array<{name: string, description: string}>} skills
 * @returns {Array<{name: string, score: number}>} sorted highest score first, stable on ties
 */
export function rankSkills(utterance, skills) {
  const docs = skills.map((s) => tokenize(s.description));
  const idf = buildIdf(docs);
  const utteranceTokens = tokenize(utterance);

  return skills
    .map((s, i) => ({ name: s.name, score: scoreOverlap(utteranceTokens, docs[i], idf) }))
    .map((r, i) => ({ ...r, _i: i }))
    .sort((a, b) => b.score - a.score || a._i - b._i)
    .map(({ _i, ...rest }) => rest);
}
