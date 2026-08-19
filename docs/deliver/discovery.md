# discovery

## What it does

Runs a discovery session as an interview and hands you a written summary you could send to a stakeholder without editing: the problem, the decisions taken and why, the open questions with named owners, and what "done" means.

It works in rounds rather than as a questionnaire. Each answer opens the questions that hang off it, so the session follows the shape of your actual problem instead of a fixed form.

## When to reach for it

- A customer or stakeholder has given you a vague ask and you need something that can be built, estimated or approved.
- You have been handed a solution someone already chose, and you suspect it is not the problem.
- You are about to write a statement of work or an estimate and are not confident what is in scope.

Reach for something else when:

- You already know what you are building and want the design stress-tested. Use the `structured-interview` skill directly.
- You need to review something that already exists. That is a `review` bucket skill, not discovery.

## Common questions

**Why does it recommend an answer to its own questions?**
An interview that only asks costs you energy. One that recommends lets you agree, disagree or correct it, which is faster. A wrong recommendation is still useful, because your correction carries more information than a blank answer would.

**Why does it refuse to guess on behalf of someone who is not in the room?**
Because that guess becomes a commitment. If a decision belongs to a person who is not there, it is recorded as an open question with their name on it. A summary with three named open questions is more useful than one with eight confident guesses.

**It asked about licensing and identity when I only wanted to scope a feature. Why?**
On the Microsoft stack, projects rarely fail on functional scope. They fail on who the agent acts as, who is licensed to use it, who operates it, and how it reaches production. Those get asked before the session closes, or explicitly deferred with your agreement.

**Can I skip ahead to the summary?**
You can, but the summary is only as good as the branches that were visited. The session ends when nothing is left silently assumed.

## It's working if

You end with a written summary in your own vocabulary, not the product's, and every open question has a named owner rather than an assumption. If you can forward it to a stakeholder unedited, it worked.

A second signal: at least one thing you arrived certain about got revised during the session.
