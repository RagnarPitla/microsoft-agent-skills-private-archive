# copilot-studio-knowledge-grounding

## What it does

Diagnoses why a Copilot Studio agent is giving wrong answers, then fixes the causes you actually control.

It starts by separating four symptoms that get lumped together as "hallucination": inventing facts, citing the right document but the wrong content, citations pointing at pages that do not exist, and answers that vary between users or sessions. They have different causes, and treating them as one problem is why the usual advice does not work.

It then works through the four builder-controlled causes - general knowledge fallback, corpus breadth and staleness, document structure, and permissions - and helps you build a small test set so you can tell whether a change improved anything.

## When to reach for it

- The agent states things that appear nowhere in its knowledge sources.
- Citations link to irrelevant parent pages, or to URLs that do not resolve.
- Two users ask the same question and get different answers.
- You are curating knowledge sources before go-live and want the corpus right the first time.
- Someone has told you to "improve the prompt" and it has not helped.

This one is model-invoked, so it may be reached for automatically when a conversation turns into a grounding problem.

Reach for something else when:

- The agent times out, loses context across a handoff, or interrogates users. That is `copilot-studio-production-patterns`.
- Knowledge source bindings break when promoting between environments. That is an ALM problem; the skill will tell you so rather than trying to fix it as grounding.

## Common questions

**Everyone says hallucination is just how LLMs work. Is this skill pretending otherwise?**

No. It is explicit that model uncertainty is a product limitation you cannot configure away, and that a well-grounded agent still gets things wrong sometimes. The argument is narrower: most real-world cases are caused by fallback being left on, an uncurated corpus, unstructured documents, or permissions - and those are fixable now. It separates the two so you do not wait for a fix that is not coming.

**Why does it push back on prompt engineering?**

Because it is the most common advice and the least likely to work here. Instructions cannot repair retrieval. If the agent is being handed the wrong chunk of the wrong document, no wording makes the right content appear. The skill treats prompt changes as a marginal improvement, not a primary fix.

**It keeps asking whether the wrong answers vary by user. Why does that matter so much?**

Because it is the fastest way to identify the cause most teams miss. Retrieval respects the caller's permissions, and builders are usually administrators. An agent that works in test can be reaching documents real users cannot open. If behaviour varies by user rather than by session, check permissions before touching anything else.

**Why does it want a test set before I change anything?**

Because otherwise you cannot tell whether you helped. Grounding changes are easy to make and hard to evaluate by feel. It asks for real questions rather than invented ones, questions the agent *should* refuse, and the specific document each answer should cite - since citation correctness is the thing being tested.

**Can it guarantee the agent never says anything false?**

No, and it says so directly. If you need that guarantee, no configuration provides it - the answer is a human approval step or a narrower scope. It will tell you that rather than sending you round the settings again.

## It's working if

- It asks what "wrong" looks like before suggesting anything, and the four symptoms it names map recognisably onto what you are seeing.
- Permissions get raised early when your symptom is inconsistency between users.
- You are told which parts are builder-fixable and which are product limitations, without the second being used as an excuse for the first.
- You end up with a smaller, more current knowledge corpus rather than a larger one.
- You have a test set you can re-run, including questions the agent is supposed to decline.
