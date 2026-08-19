Every skill in a promoted bucket has a human-facing docs page at `docs/<bucket>/<skill-name>.md`. The docs tree mirrors the promoted bucket folders under `skills/`.

A docs page is read by someone deciding whether to use the skill. `SKILL.md` is read by the agent that runs it. They have different jobs, so a docs page never restates the execution steps and never duplicates install commands.

## The four sections

Use these headings, in this order, on every page.

### What it does

The outcome, in two or three sentences. Lead with what the reader gets, not with how the skill works. Name the thing that changes: a written summary they can send to a stakeholder, a reviewed solution, a set of decisions with owners.

### When to reach for it

The situations that should pull the reader here, as a short list. Include the neighbouring situations that should send them somewhere else, and name that somewhere else. A page that only lists what it is good for makes the reader work out the boundary themselves.

### Common questions

Real questions, answered plainly. Hunt for them in three places:

- The objections you get when you demo the skill.
- The places people misuse it, which are usually a question they never asked.
- The design decisions that look wrong until explained. If a reviewer questioned it once, a reader will question it again.

Do not invent questions to fill the section. Three real ones beat eight padded ones.

### It's working if

The observable signal that the skill did its job. This is the section people skip and it is the most useful one, because it tells the reader what success looks like before they commit. Prefer something they can see: the interview ended with named owners on every open question, the review produced a finding they had not spotted.

## Style

- Write to one reader, in second person.
- Prefer the reader's vocabulary over the product's.
- No screenshots. They rot, and every screenshot is a confidentiality review.
- Link to `learn.microsoft.com` rather than restating Microsoft's documentation, because their docs update and our copy does not.

## Where a docs page is read

There is no docs site. A docs page is read on GitHub, under `docs/<bucket>/<skill-name>.md`
in this repository.

That path contains the bucket, so **moving a skill between buckets breaks every link to its
docs page**. Move a skill only when the bucket is genuinely wrong, and when you do, grep the
repo for the old path before you push.

Write each page so it survives being read cold, on a phone, by someone who arrived from a
LinkedIn link and has never seen the repository.
